// HERO SET PIECE for "sunken-colossus": the toppled idol asleep on the lagoon floor, holding the way out in its hand.
//
// WHAT IT IS
//   A 228 m archaic idol lying on its side, half buried in white sand, sleeping with its head on its outstretched
//   arm. The feet stand on edge, 14 m tall, toes capped with gold leaf, above bare stone shins and a gold anklet; hip,
//   torso and a second arm folded across the belly are lofted forms under reef crust and instanced corals. Then the HEAD: a 28 m pale stone mask rolled up toward the sun
//   inside a verdigris bronze helmet (brow rim, cheek guards, raised gold-leaf bands, a scalloped crest fan standing
//   across the crown). The mask has five features only: one straight brow bar with surviving gold leaf, a long wedge
//   nose, a closed eye carved as a 6 m gold-lipped crescent, the other eye a dark hollow, and a lip line. Verdigris
//   tears run down the stone from the bronze. Beyond the crown the elbow breaks the sand and a bronze forearm rises
//   ~20 degrees to a gold armband and a 28 m cupped HAND, palm up, four 13 m fingers curling up behind and to the
//   right of the portal seat, thumb on the left, gold-inlaid rings in the palm where the portal rests.
//   Alive: animated caustics on everything, a 320-fish shoal spiralling in and out of the hollow eye, bubbles
//   trailing from the lips to the surface, swaying soft corals and sea fans, twinkling fluorescent polyps and coral
//   tips, soft sun shafts falling through the fingers.
//
// LOCAL SPACE
//   Origin at the base centre on the sand (y = 0), +Y up. The statue lies along X: feet at x = +110, head at
//   x = -36..-64, fingertips at x = -119. The face, the open side of the hand and every anchor are on the +Z side:
//   the camera travels toward -X at z = +20..+36 with the idol on its right (drop-off on its left).
//   Depths assume sand at local y = 0 and the sea surface at y = +26 (opts.surfaceY).
//
// OPTS (all optional)
//   palette       7 hex strings in the brief's order (pale light, turquoise, blue, cobalt, sand/stone, coral, gold)
//   sand          'full' (default: rippled floor out to sandRadius with drifts banked against the body) |
//                 'apron' (only the drifts, sinking to -1.8 m at 45 m from the body so world terrain overlaps it) | false
//   sandRadius    half-size of the 'full' floor in metres (default 1400)
//   surfaceY      height of the sea surface above the sand (default 26): bubbles end and shafts start there
//   sandColor     hex of the sand before the 0.8 albedo factor (default '#f4efe2')
//   sunDir        THREE.Vector3 toward the sun (default near-vertical, leaning to +Z). Soft shadows of the head,
//                 hand and crest are baked per vertex for this direction, so keep it within ~25 degrees of vertical.
//   hollowEye     'lower' | 'upper' (default per seed)   roll: head roll in degrees (default per seed 24..32)
//   gold, reef    0..1 gold-leaf survival / reef coverage (default per seed)      curl: finger curl (default ~1)
//   coralDensity  multiplier on the ~1000 instanced corals (default 1; 0 leaves only the crust shader)
//   shoal, bubbles, rays   false to drop one (replace with kit elements at anchors.eyeHollow / lips / palmCenter)
//   fish          shoal size (default 320)        glow: emissive of coral tips (default 2.6)
//   faceU         path progress at which the camera slides past the face (default 0.4)
//   progress      initial setProgress value (default faceU)
//   preview       true adds stand-ins for judging the piece alone: a glowing 14 m ring at the portal seat, a water
//                 backdrop dome and water tint. Off unless you pass preview: true (the piece never reads the URL).
//   waterDensity  extinction (1/m) toward the water colour built into the materials (default 0: use scene fog)
//
// RETURNS (besides object / radius / height / center / anchors / update / dispose / ground / groundY)
//   setProgress(u, raw)  u = the world's path progress 0..1 (raw, optional: the unwarped progress; the finger shafts stay dark below 0.55). Scripted, purely a function of u: around faceU the shoal
//                   pours out of the hollow eye and the lips let go a long breath of bubbles; from u = 0.6 the
//                   shafts through the fingers brighten. Call it every frame from the world's update(dt, t, cam, u).
//   setLight({ sunDir, sunColor, skyColor, bounceColor, causticScale (m), causticStrength, causticSpeed,
//              waterColor, waterDensity, glow, surfaceY })   any subset; match these to the water kit.
//   uniforms        the shared block { uTime, uSunDir, uSunCol, uSkyCol, uBounceCol, uCaus, uWater }
//   distance(x,y,z) distance from a local-space point to the solid idol (head and hand exact, the rest as
//                   conservative spheres): use it to validate a camera path.
//   bounds (Box3), length, triangles, seedInfo
//   sandHeightAt(x, z), sandColor, sandRect [x0, z0, x1, z1]   the idol's own sand (local space): a world that lays its
//                   sea bed around the piece (sand: 'full', sandRadius: 5) continues it from the edge of sandRect + 5 m.
//   export COLOSSUS_GLSL   the light model (noise, caustics, seaLight, bumpN) for world materials that must match.
//
// ANCHORS (local space; transform by object.matrixWorld)
//   portalSeat      { position, normal, direction, radius: 7 }: centre of the 14 m portal, 8.4 m above the palm so
//                   the disc rests just inside the cup; `direction` is the way the camera flies in (the path's last
//                   tangent), `normal` faces the arriving camera. Fingers rise behind it, the thumb to its left.
//   flyThrough      ordered points of a safe camera line, entry -> portal centre: along the legs and torso at
//                   z ~ +31, past the mask ~14 m off its face, then `straightStart` and a straight, level 62 m run
//                   to the seat. `clearance` is the measured minimum distance to the idol on that line (>= 6 m).
//   straightStart, approachDir     start and direction of that last straight
//   viewpoints      { entry, shoulder, face, eye, elbow, approach, hero }: each { position, target }
//   headCenter, faceCenter, faceNormal, closedEye, eyeHollow (+ eyeHollowRadius), lips, crown, shoulderTop,
//   foldedElbow, elbow, wrist, palmCenter, palmNormal, fingerDir, thumbDir, fingertips[4], thumbTip, feet, surfaceY
//
// SIZE   228 m long (x -119..+110), 42 m across, 21 m high. `center`/`radius` (62) frame the head-and-hand group for
//        the viewer; use `bounds` for the whole body.
// COST   ~140k triangles (statue 42k, sand 12k, corals ~83k, shoal 2k), 10 draw calls (statue, sand, 5 coral kinds,
//        shoal, bubbles, shafts), no lights, no textures. Build ~250-450 ms of CPU with five ctx.yield() breaks.
// LIGHT  Self-lit ShaderMaterials: they ignore scene lights and honour scene fog. One near-vertical sun with
//        animated caustics projected along it, turquoise sky light from above, warm sand bounce from below, baked
//        ambient occlusion and soft sun shadows. Wants noon light, turquoise fog, bloom threshold ~0.9: caustic
//        filaments, gold leaf and coral tips are the only things meant to bloom.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, bell } from '../kit/core.js';

const DEFAULT_PALETTE = ['#c9fff2', '#39c6d6', '#1487b8', '#0b4f86', '#e9dcb8', '#ff6f61', '#ffd447'];
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- signed distance helpers (plain numbers, no allocation)
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const sdEll = (x, y, z, rx, ry, rz) => {
  const ax = x / rx, ay = y / ry, az = z / rz, k0 = Math.sqrt(ax * ax + ay * ay + az * az);
  const bx = ax / rx, by = ay / ry, bz = az / rz, k1 = Math.sqrt(bx * bx + by * by + bz * bz);
  return k1 > 1e-7 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz);
};
const sdRBox = (x, y, z, hx, hy, hz, r) => {
  const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
};
// tapered capsule from A (radius ra) to B (radius rb)
const sdCap = (px, py, pz, ax, ay, az, bx, by, bz, ra, rb) => {
  const ex = bx - ax, ey = by - ay, ez = bz - az, qx = px - ax, qy = py - ay, qz = pz - az;
  let t = (qx * ex + qy * ey + qz * ez) / (ex * ex + ey * ey + ez * ez); t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = qx - ex * t, dy = qy - ey * t, dz = qz - ez * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t);
};
const sst = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- surface nets with coarse block culling
// sdf(x,y,z) -> distance (negative inside). Returns raw arrays; vertices are snapped to the surface with one Newton
// step, normals come from the sdf gradient, plus a cavity AO term and a soft shadow toward `sun` per vertex.
async function surfaceNets(sdf, min, max, cell, o = {}) {
  const Y = o.yield;   // optional: hand the page back between slabs (no random draws in here, so the result is the same)
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1, ny = Math.ceil((max[1] - min[1]) / cell) + 1, nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const nxy = nx * ny, vals = new Float32Array(nxy * nz), B = 4;
  const brad = (B - 1) * 0.5 * cell * 1.7321 * 1.45 + cell, brad2 = 1.4 * cell;
  for (let bz = 0; bz < nz; bz += B) for (let by = 0; by < ny; by += B) { for (let bx = 0; bx < nx; bx += B) {
    if (Y && (bx & 15) === 0) await Y();
    const c = (B - 1) * 0.5, d = sdf(min[0] + (bx + c) * cell, min[1] + (by + c) * cell, min[2] + (bz + c) * cell);
    const x1 = Math.min(bx + B, nx), y1 = Math.min(by + B, ny), z1 = Math.min(bz + B, nz);
    if (Math.abs(d) > brad) { for (let k = bz; k < z1; k++) for (let j = by; j < y1; j++) { let p = k * nxy + j * nx + bx; for (let i = bx; i < x1; i++, p++) vals[p] = d; } continue; }
    for (let sz = bz; sz < z1; sz += 2) for (let sy = by; sy < y1; sy += 2) for (let sx = bx; sx < x1; sx += 2) {
      const d2 = sdf(min[0] + (sx + 0.5) * cell, min[1] + (sy + 0.5) * cell, min[2] + (sz + 0.5) * cell), far = Math.abs(d2) > brad2;
      const x2 = Math.min(sx + 2, nx), y2 = Math.min(sy + 2, ny), z2 = Math.min(sz + 2, nz);
      for (let k = sz; k < z2; k++) for (let j = sy; j < y2; j++) for (let i = sx; i < x2; i++) vals[k * nxy + j * nx + i] = far ? d2 : sdf(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);
    }
  } }
  // one vertex per sign-changing cell
  const vidx = new Int32Array(nxy * nz).fill(-1), pos = [];
  const co = [0, 1, nx, nx + 1, nxy, nxy + 1, nxy + nx, nxy + nx + 1];
  const E = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  for (let k = 0; k < nz - 1; k++) { if (Y && (k & 7) === 0) await Y(); for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const p = k * nxy + j * nx + i; let m = 0;
    for (let c = 0; c < 8; c++) if (vals[p + co[c]] < 0) m |= 1 << c;
    if (m === 0 || m === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (let e = 0; e < 24; e += 2) {
      const a = E[e], b = E[e + 1], va = vals[p + co[a]], vb = vals[p + co[b]];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; n++;
    }
    vidx[p] = pos.length / 3;
    pos.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
  } }
  // quads around sign-changing edges
  const quads = [], yCut = o.yCut ?? -1e9;
  const emit = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (pos[a * 3 + 1] < yCut && pos[b * 3 + 1] < yCut && pos[c * 3 + 1] < yCut && pos[d * 3 + 1] < yCut) return;
    if (flip) quads.push(a, d, c, b); else quads.push(a, b, c, d);
  };
  for (let k = 1; k < nz - 1; k++) { if (Y && (k & 7) === 0) await Y(); for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const p = k * nxy + j * nx + i, v0 = vals[p] < 0;
    if (v0 !== (vals[p + 1] < 0)) emit(vidx[p - nx - nxy], vidx[p - nxy], vidx[p], vidx[p - nx], v0);
    if (v0 !== (vals[p + nx] < 0)) emit(vidx[p - 1 - nxy], vidx[p - 1], vidx[p], vidx[p - nxy], v0);
    if (v0 !== (vals[p + nxy] < 0)) emit(vidx[p - 1 - nx], vidx[p - nx], vidx[p], vidx[p - 1], v0);
  } }
  // compact used vertices, refine, shade
  const remap = new Int32Array(pos.length / 3).fill(-1); let nv = 0;
  for (let q = 0; q < quads.length; q++) { const v = quads[q]; if (remap[v] < 0) remap[v] = nv++; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), lit = new Float32Array(nv * 3);
  const sun = o.sun || [0, 1, 0], e = cell * 0.3, maxStep = cell * 0.6;
  if (Y) await Y();
  for (let v = 0; v < remap.length; v++) {
    const r = remap[v]; if (r < 0) continue;
    if (Y && (r & 1023) === 1023) await Y();
    let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    const d0 = sdf(x, y, z); let gx = sdf(x + e, y, z) - d0, gy = sdf(x, y + e, z) - d0, gz = sdf(x, y, z + e) - d0;
    const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1; gx /= gl; gy /= gl; gz /= gl;
    const st = clamp(d0, -maxStep, maxStep); x -= gx * st; y -= gy * st; z -= gz * st;
    P[r * 3] = x; P[r * 3 + 1] = y; P[r * 3 + 2] = z; N[r * 3] = gx; N[r * 3 + 1] = gy; N[r * 3 + 2] = gz;
    // cavity AO: how much free space is there 1.6 m and 4.5 m out along the normal
    const a1 = sdf(x + gx * 1.6, y + gy * 1.6, z + gz * 1.6) / 1.6, a2 = sdf(x + gx * 4.5, y + gy * 4.5, z + gz * 4.5) / 4.5;
    lit[r * 3] = clamp(0.12 + 0.5 * clamp(a1, 0, 1) + 0.38 * clamp(a2, 0, 1), 0, 1);
    // soft shadow toward the sun
    let sh = 1;
    if (gx * sun[0] + gy * sun[1] + gz * sun[2] > -0.2) {
      const ox = x + gx * 0.35, oy = y + gy * 0.35, oz = z + gz * 0.35;
      for (let s = 0, t = 1.2; s < 2; s++, t *= 4) { const d = sdf(ox + sun[0] * t, oy + sun[1] * t, oz + sun[2] * t); sh = Math.min(sh, (4 * d) / t + 0.15); }
    }
    lit[r * 3 + 1] = clamp(sh, 0, 1);
  }
  // triangles, winding checked against the gradient normal
  if (Y) await Y();
  const idx = new Uint32Array((quads.length / 4) * 6); let w = 0;
  for (let q = 0; q < quads.length; q += 4) {
    const a = remap[quads[q]], b = remap[quads[q + 1]], c = remap[quads[q + 2]], d = remap[quads[q + 3]];
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[d * 3] - P[a * 3], vy = P[d * 3 + 1] - P[a * 3 + 1], vz = P[d * 3 + 2] - P[a * 3 + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const dot = fx * (N[a * 3] + N[c * 3]) + fy * (N[a * 3 + 1] + N[c * 3 + 1]) + fz * (N[a * 3 + 2] + N[c * 3 + 2]);
    if (dot >= 0) { idx[w++] = a; idx[w++] = b; idx[w++] = c; idx[w++] = a; idx[w++] = c; idx[w++] = d; }
    else { idx[w++] = a; idx[w++] = c; idx[w++] = b; idx[w++] = a; idx[w++] = d; idx[w++] = c; }
  }
  return { P, N, lit, idx, count: nv };
}

// soft shadow / occlusion of a point by an sdf, marching toward `sun` (used for the sand under head and hand)
function sdfShadow(sdf, x, y, z, sun, k = 3) {
  let sh = 1;
  for (let s = 0, t = 1.5; s < 6; s++, t *= 1.75) { const d = sdf(x + sun[0] * t, y + sun[1] * t, z + sun[2] * t); sh = Math.min(sh, (k * d) / t + 0.1); if (sh <= 0) return 0; }
  return clamp(sh, 0, 1);
}

// ---------------------------------------------------------------- the head: an archaic mask in a banded, crested helmet
// Head space: a = chin -> crown, b = toward the statue's left ear (mostly up in the world, the head lies on its right
// cheek), c = out of the face. The head is rolled about its long axis so the mask looks up at the sun.
function makeHead(H) {
  const cr = Math.cos(H.roll), sr = Math.sin(H.roll), cy = Math.cos(H.yaw), sy = Math.sin(H.yaw);
  const { browA, browArch, bandGap, crestN, crestH, crestA, sC, eyeA, eyeB, eyeK } = H;
  const loc = (x, y, z, o) => {
    const X = x - H.c[0], Y = y - H.c[1], Z = z - H.c[2], Xr = X * cy + Z * sy, Zr = -X * sy + Z * cy;
    o[0] = -Xr; o[1] = Y * cr - Zr * sr; o[2] = Y * sr + Zr * cr; return o;
  };
  const world = (a, b, c) => {
    const Xr = -a, Y = b * cr + c * sr, Zr = -b * sr + c * cr;
    return new THREE.Vector3(H.c[0] + Xr * cy - Zr * sy, H.c[1] + Y, H.c[2] + Xr * sy + Zr * cy);
  };
  const dir = (a, b, c) => world(a, b, c).sub(world(0, 0, 0));
  const t3 = [0, 0, 0];
  const skullRaw = (a, b, c) => {
    const bj = b * (1 + 0.28 * sst(-4, -14, a));
    return smin(sdRBox(a - 3, b, c + 1.3, 11, 9.2, 11.2, 5), sdRBox(a + 5, bj, c, 9.5, 6.8, 9.9, 4.5) * 0.8, 3);
  };
  const faceSphere = (a, b, c) => { const cz = c - (9.7 - 46); return Math.sqrt(0.8 * a * a + b * b + cz * cz) - 46; };
  const f0 = (a, b) => 9.7 - (0.8 * a * a + b * b) / 92;
  const helmPlane = (a, c) => ((a - 6.4) + 0.85 * (9.4 - c)) / 1.3124;
  const bandPulse = (hd) => { const s = hd - 0.9; if (s < -1) return 0; const m = s < bandGap * 0.5 ? s : s - bandGap * Math.round(s / bandGap); return 1 - sst(0.55, 0.95, Math.abs(m)); };
  const browBar = (a, b, c) => sdRBox(a - (browA - browArch * b * b), b, c - (f0(a, b) + 0.25), 0.85, 7.3, 1.3, 0.55);
  const sdf = (x, y, z, exact) => {
    loc(x, y, z, t3); const a = t3[0], b = t3[1], c = t3[2];
    const sk = skullRaw(a, b, c), neck = sdCap(a, b, c, -8, 0, -2.5, -27, 0, -4, 6.6, 7.6);
    const base = smin(sk, neck, 2.5);
    if (base > 11 && !exact) return base - 7.5;
    const fr = faceSphere(a, b, c);
    let d = smax(sk, fr, 1.2);
    if (a < -7) d = smin(d, sdEll(a + 12, b, c - 6.3, 2.6, 3.2, 2.8), 1.5);                  // chin
    d = smin(d, neck, 2.5);
    if (c > 4) {
      const F = f0(a, b);
      if (a > -6.5 && a < 7) {
        d = smax(d, -sdEll(a - 0.4, b - 4.3, c - (F + 0.5), 3.1, 3.4, 2.0), 0.8);            // eye sockets under the brow
        d = smax(d, -sdEll(a - 0.4, b + 4.3, c - (F + 0.5), 3.1, 3.4, 2.0), 0.8);
        d = smin(d, browBar(a, b, c), 0.5);                                                   // the single brow line
        // nose: a long straight wedge with a flattened ridge
        const tn = clamp((browA - a) / (browA + 5.4), 0, 1), hn = 1.0 + 2.5 * tn, wn = 1.05 + 0.95 * tn;
        let dn = (Math.abs(b) * hn + (c - F) * wn - wn * hn) / Math.sqrt(hn * hn + wn * wn);
        dn = Math.max(dn, c - F - hn + 0.3, (-5.4 - a) - 0.3 * (c - F), a - browA - 0.4);
        d = smin(d, dn, 0.35);
        // closed eye: a lid bulge with the carved crescent
        const bb = b - sC * eyeB;
        d = smin(d, sdEll(a - eyeA, bb, c - (F - 1.45), 1.95, 3.2, 1.5), 0.45);
        const da = (a - (eyeA - 0.55 + eyeK * bb * bb)) / Math.sqrt(1 + 4 * eyeK * eyeK * bb * bb), db = Math.max(Math.abs(bb) - 3.0, 0);
        d = smax(d, -Math.max(Math.sqrt(da * da + db * db) - 0.42, Math.abs(c - (F - 0.3)) - 1.3), 0.25);
        // hollow eye: an almond opening into a dark chamber
        const hb = b + sC * eyeB;
        d = smax(d, -sdEll(a - eyeA, hb, c - (F - 1.5), 2.1, 3.0, 5.0), 0.5);
        d = smax(d, -(Math.sqrt((a - eyeA) * (a - eyeA) + hb * hb * 0.8 + (c - F + 6.2) * (c - F + 6.2)) - 4.3), 0.6);
      }
      if (a < -6 && a > -11.5) {                                                              // lips: two low ridges
        d = smin(d, sdEll(a + 7.9, b, c - (F + 0.05), 0.7, 2.8, 1.0), 0.4);
        d = smin(d, sdEll(a + 9.4, b, c - (f0(-9.4, b) + 0.0), 0.78, 2.3, 1.05), 0.4);
      }
    }
    // helmet shell with raised bands, cut back from the face; crest fin over the crown
    const hd = helmPlane(a, c), r2 = Math.min(Math.abs(b) - 6.8, (a + 9.5) * 0.8), hh = Math.max(hd, r2);
    if (hh > -2) {
      const rim2 = r2 > -0.3 && hd < 0.4 ? 1 - sst(0.9, 1.5, r2) : 0;
      const infl = 0.85 + 0.5 * Math.max(bandPulse(hd), rim2);
      d = smin(d, smax(smax(sk - infl, fr - 1.2, 1.5), -hh, 0.35), 0.15);
    }
    // the crest: a scalloped fan standing across the crown from ear to ear, thinning toward its rim
    const ac = a - crestA;
    if (ac < 3.2 && ac > -3.2 && sk < crestH + 3) {
      const th = Math.atan2(b, c + 1.3), ch = crestH * (0.9 + 0.1 * Math.cos(th * crestN)) * (0.3 + 0.7 * sst(2.95, 1.9, Math.abs(th)));
      d = smin(d, smax(Math.abs(ac) - (0.85 - 0.08 * Math.max(sk, 0)), sk - ch, 0.4), 0.35);
    }
    return d;
  };
  // per-vertex material: [bronze, reef, gold], engraving mask and head-space coordinates
  const mat = (x, y, z, ny, o) => {
    loc(x, y, z, t3); const a = t3[0], b = t3[1], c = t3[2], hd = helmPlane(a, c), sk = skullRaw(a, b, c);
    const r2 = Math.min(Math.abs(b) - 6.8, (a + 9.5) * 0.8), rim2 = r2 > -0.3 && hd < 0.4 ? 1 - sst(0.9, 1.5, r2) : 0;
    const onHelm = sst(-0.3, 0.1, Math.max(hd, r2)) * sst(0.2, 0.6, sk);
    const crest = Math.abs(a - crestA) < 1.3 && sk > 1.6 ? 1 : 0;
    let gold = browBar(a, b, c) < 0.3 && c > 6 ? 1 : 0;
    gold = Math.max(gold, onHelm * (1 - crest) * Math.max(bandPulse(hd) * 0.6, rim2 * 0.45), crest * sst(crestH * 0.6, crestH * 0.85, sk) * 0.7);
    if (crest) { o.bronze = 1; o.reef = 0.25; o.gold = gold; o.eng = 0; o.a = a; o.b = b; o.c = c; return; }
    const reef = clamp(Math.max(sst(-11, -17, a), sst(-3, -10, c) * 0.9) + 0.38 * onHelm * sst(0.25, 0.8, ny) + 0.25 * sst(8.4, 9.6, Math.abs(b)), 0, 1);
    o.bronze = onHelm; o.reef = reef; o.gold = gold; o.eng = sst(6.5, 8.3, c) * (1 - onHelm);
    o.a = a; o.b = b; o.c = c;
  };
  return { sdf, mat, loc, world, dir, f0 };
}

// ---------------------------------------------------------------- the hand: cupped, palm up, fingers curling behind the portal
// Hand space: u = wrist -> fingers, v = toward the thumb, w = out of the palm.
function makeHand(G, rng) {
  const O = G.O, F = G.F, S = G.S, N = G.N;
  const loc = (x, y, z, o) => { const X = x - O.x, Y = y - O.y, Z = z - O.z; o[0] = X * F.x + Y * F.y + Z * F.z; o[1] = X * S.x + Y * S.y + Z * S.z; o[2] = X * N.x + Y * N.y + Z * N.z; return o; };
  const world = (u, v, w) => new THREE.Vector3().copy(O).addScaledVector(F, u).addScaledVector(S, v).addScaledVector(N, w);
  // fingers: joints and radii in hand space
  const caps = [], tips = [], fingers = [];
  // The portal disc hides whatever stands straight behind it, so the fingers are prongs: each rises from its knuckle
  // in an arc that bulges away from the disc and curls back toward its plane, ending above the rim (or to its right),
  // just under the sea surface. Targets are given in the ring's frame: d behind the disc, l to its left, h above its centre.
  const vs = [5.3, 1.8, -1.9, -5.6], rs = [1.5, 1.56, 1.48, 1.3];
  const PC = world(0.9, 0, 8.4), Aw = G.A, Lw = new THREE.Vector3(0, 1, 0).cross(Aw).normalize(), tv = new THREE.Vector3();
  const ringPt = (d, l, h) => { tv.copy(PC).addScaledVector(Aw, d).addScaledVector(Lw, l); tv.y += h; return loc(tv.x, tv.y, tv.z, [0, 0, 0]); };
  const aL = [Aw.dot(F), Aw.dot(S), Aw.dot(N)], hTop = Math.min(9.9, (G.surfaceY ?? 26) - 1.3 - PC.y) * (0.96 + 0.04 * Math.min(G.curl, 1.1));
  const targets = [[4.8, 1.6, hTop - 0.4], [4.1, -3.6, hTop], [3.4, -8.3, hTop - 2.0], [2.8, -11.4, hTop - 5.6]];
  for (let i = 0; i < 4; i++) {
    const tg = targets[i], T = ringPt(tg[0] + rng.range(-0.4, 0.4), tg[1] + rng.range(-0.5, 0.5), tg[2]), B = [7.2, vs[i], 0.25];
    const rad = [rs[i], rs[i] * 0.94, rs[i] * 0.84, rs[i] * 0.7], js = [B];
    for (const [f, bulge] of [[0.36, 4.2], [0.72, 3.3]]) js.push([lerp(B[0], T[0], f) + aL[0] * bulge, lerp(B[1], T[1], f) + aL[1] * bulge, lerp(B[2], T[2], f) + aL[2] * bulge]);
    js.push(T);
    for (let sg = 0; sg < 3; sg++) caps.push({ a: js[sg], b: js[sg + 1], ra: rad[sg], rb: rad[sg + 1], f: i, kn: sg < 2 ? rad[sg + 1] * 1.14 : 0 });
    tips.push(world(T[0], T[1], T[2])); fingers.push(js);
  }
  { // thumb: two phalanges rising on the +v side to the disc's mid-height, just in front of its plane
    const p0 = [-3.4, 6.1, 0.5], p2 = ringPt(-1.2, 9.9, 0.8), p1 = [lerp(p0[0], p2[0], 0.5), lerp(p0[1], p2[1], 0.5) + 1.7, lerp(p0[2], p2[2], 0.5) - 0.6];
    caps.push({ a: p0, b: p1, ra: 1.8, rb: 1.46, f: 4, kn: 1.66 }, { a: p1, b: p2, ra: 1.46, rb: 1.12, f: 4, kn: 0 });
    tips.push(world(p2[0], p2[1], p2[2])); fingers.push([p0, p1, p2]);
  }
  const tipL = fingers.map((js) => js[js.length - 1]);
  const bounds = fingers.map((js) => {
    const c = [0, 0, 0]; for (const q of js) { c[0] += q[0] / js.length; c[1] += q[1] / js.length; c[2] += q[2] / js.length; }
    let r = 0; for (const q of js) r = Math.max(r, Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]));
    return [c[0], c[1], c[2], r + 2.1];
  });
  // wrist stub toward the elbow, with the armband that hides the joint to the forearm
  const e3 = loc(G.elbow.x, G.elbow.y, G.elbow.z, [0, 0, 0]), wp = [-6.8, 0, -0.3];
  const wl = Math.hypot(e3[0] - wp[0], e3[1] - wp[1], e3[2] - wp[2]), wd = [(e3[0] - wp[0]) / wl, (e3[1] - wp[1]) / wl, (e3[2] - wp[2]) / wl];
  const stubL = 9.5, we = [wp[0] + wd[0] * stubL, wp[1] + wd[1] * stubL, wp[2] + wd[2] * stubL];
  const band = (u, v, w) => {
    const qx = u - wp[0], qy = v - wp[1], qz = w - wp[2], s = qx * wd[0] + qy * wd[1] + qz * wd[2];
    const rx = qx - wd[0] * s, ry = qy - wd[1] * s, rz = qz - wd[2] * s, rr = Math.sqrt(rx * rx + ry * ry + rz * rz);
    const lip = Math.abs(s - 8.4) > 0.95 ? 0.72 : 0.5;
    return smax(Math.abs(s - 8.4) - 1.45, rr - (2.85 + 0.047 * s + lip), 0.25);
  };
  const t3 = [0, 0, 0];
  const sdfL = (u, v, w, exact) => {
    const cu = u + 0.5, r0 = Math.sqrt(cu * cu + (v - 1) * (v - 1) + (w - 3) * (w - 3));
    if (r0 > 34 && !exact) return r0 - 27;
    const cup = 0.016 * (0.5 * u * u + v * v);
    let d = sdRBox(u + 0.5, v, w - cup + 0.2, 7.6, 6.6, 1.7, 1.5);
    d = smin(d, sdEll(u + 3.6, v - 4.6, w - 1.1, 4.2, 3.0, 2.0), 1.2);                        // thenar pad
    d = smin(d, sdEll(u + 4.6, v + 4.6, w - 0.9, 4.0, 2.4, 1.7), 1.2);                        // hypothenar pad
    d = smin(d, sdEll(u - 6.1, v + 0.2, w - 1.0, 1.9, 6.3, 1.5), 1.0);                        // knuckle pad
    const bu = u - 0.8, bw = w - 12.4;
    d = smax(d, -(Math.sqrt(bu * bu + v * v + bw * bw) - 12), 1.5);                           // the bowl of the palm
    d = smin(d, sdCap(u, v, w, wp[0], wp[1], wp[2], we[0], we[1], we[2], 2.85, 3.3), 2.4);
    d = smin(d, band(u, v, w), 0.2);
    for (let f = 0; f < 5; f++) {
      const bs = bounds[f], ex = u - bs[0], ey = v - bs[1], ez = w - bs[2];
      if (Math.sqrt(ex * ex + ey * ey + ez * ez) - bs[3] > d + 1.4 && !exact) continue;
      let df = 1e9;
      for (let i = 0; i < caps.length; i++) {
        const cp = caps[i]; if (cp.f !== f) continue;
        const dc = sdCap(u, v, w, cp.a[0], cp.a[1], cp.a[2], cp.b[0], cp.b[1], cp.b[2], cp.ra, cp.rb);
        df = df > 1e8 ? dc : smin(df, dc, 0.35);
        if (cp.kn) { const kx = u - cp.b[0], ky = v - cp.b[1], kz = w - cp.b[2]; df = smin(df, Math.sqrt(kx * kx + ky * ky + kz * kz) - cp.kn, 0.3); }
      }
      d = smin(d, df, f === 4 ? 1.3 : 0.3);
    }
    return d;
  };
  const sdf = (x, y, z, exact) => { loc(x, y, z, t3); return sdfL(t3[0], t3[1], t3[2], exact); };
  const mat = (x, y, z, n, o) => {
    loc(x, y, z, t3); const u = t3[0], v = t3[1], w = t3[2];
    const facing = n[0] * N.x + n[1] * N.y + n[2] * N.z, pr = Math.sqrt((u - 0.8) * (u - 0.8) + v * v);
    o.eng = sst(0.35, 0.75, facing) * sst(8.2, 6.8, pr) * sst(3.2, 2.2, w);
    let dt = 1e9; for (let i = 0; i < tipL.length; i++) dt = Math.min(dt, Math.hypot(u - tipL[i][0], v - tipL[i][1], w - tipL[i][2]) - (i === 4 ? 0.6 : 0));
    const cap = sst(3.6, 2.6, dt);                                              // gold-leaf caps on the fingertips
    o.bronze = 1; o.gold = Math.max(band(u, v, w) < 0.25 ? 0.72 : 0, cap * 0.85);
    o.reef = clamp(0.1 + 0.55 * sst(-5, -13, u) + 0.4 * sst(0.1, -0.6, facing) * sst(9, 3, u) * sst(6, 2, w) + 0.12 * sst(0.3, 0.9, n[1]) * sst(5, 9, w) - o.eng - cap, 0, 1);
    o.a = u; o.b = v; o.c = w;
  };
  return { sdf, sdfL, mat, loc, world, tips, fingers, wristEnd: world(we[0], we[1], we[2]), wristStart: world(wp[0], wp[1], wp[2]), stubDir: wd };
}

// ---------------------------------------------------------------- geometry accumulator shared by every statue part
function makeAcc() {
  return { pos: [], nor: [], mat: [], lit: [], loc: [], idx: [], n: 0 };
}
async function accGeometry(acc, Y) {   // (one attribute per step: turning 60k vertices of plain arrays into buffers takes a while)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  if (Y) await Y();
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3));
  if (Y) await Y();
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(acc.mat, 3));   // bronze, reef, gold
  if (Y) await Y();
  g.setAttribute('aLit', new THREE.Float32BufferAttribute(acc.lit, 3));   // ao, sun shadow, engraving mask
  if (Y) await Y();
  g.setAttribute('aLoc', new THREE.Float32BufferAttribute(acc.loc, 4));   // part-space position, part id (0 body, 1 head, 2 hand)
  if (Y) await Y();
  g.setIndex(acc.idx);
  return g;
}
async function addNets(acc, m, matFn, part, Y) {
  const o = { bronze: 0, reef: 0, gold: 0, eng: 0, a: 0, b: 0, c: 0 }, base = acc.n, nn = [0, 0, 0];
  for (let i = 0; i < m.count; i++) {
    if (Y && (i & 1023) === 1023) await Y();
    const x = m.P[i * 3], y = m.P[i * 3 + 1], z = m.P[i * 3 + 2]; nn[0] = m.N[i * 3]; nn[1] = m.N[i * 3 + 1]; nn[2] = m.N[i * 3 + 2];
    matFn(x, y, z, part === 1 ? nn[1] : nn, o);
    acc.pos.push(x, y, z); acc.nor.push(nn[0], nn[1], nn[2]); acc.mat.push(o.bronze, o.reef, o.gold);
    acc.lit.push(m.lit[i * 3], m.lit[i * 3 + 1], o.eng); acc.loc.push(o.a, o.b, o.c, part);
  }
  if (Y) await Y();
  for (let i = 0; i < m.idx.length; i++) acc.idx.push(base + m.idx[i]);
  acc.n += m.count;
}

// Lofted limb / torso: stations [x, y, z, ry (up), rz (sideways)], cross-section a superellipse, lumpy with reef noise.
// Returns footprint samples {x, z, r} for the sand drifts.
async function addLoft(acc, noise, st, o, Y) {
  const pts = st.map((s) => new THREE.Vector3(s[0], s[1], s[2])), curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const rings = o.rings, segs = o.segs, base = acc.n, e = o.sup ?? 0.82, n = st.length - 1, foot = [];
  const C = new THREE.Vector3(), T = new THREE.Vector3(), U = new THREE.Vector3(), W = new THREE.Vector3(), up = o.up || new THREE.Vector3(0, 1, 0);
  const P = new Float32Array((rings + 1) * (segs + 1) * 3), Nn = new Float32Array(P.length), INS = new Float32Array(P.length / 3), PY = new Float32Array(P.length / 3), AN = new Float32Array(P.length / 3), RR = new Float32Array(P.length / 3);
  const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i <= rings; i++) {
    if (Y && i % 4 === 3) await Y();
    const t = i / rings, f = t * n, k = Math.min(n - 1, Math.floor(f)), ft = f - k;
    const s0 = st[Math.max(k - 1, 0)], s1 = st[k], s2 = st[k + 1], s3 = st[Math.min(k + 2, n)];
    const ry = Math.max(0.05, cr(s0[3], s1[3], s2[3], s3[3], ft)), rz = Math.max(0.05, cr(s0[4], s1[4], s2[4], s3[4], ft));
    curve.getPoint(t, C); curve.getTangent(t, T); U.copy(up).addScaledVector(T, -up.dot(T)).normalize(); W.crossVectors(T, U);
    if (C.y < ry && i % 3 === 0) foot.push({ x: C.x, z: C.z, r: Math.max(Math.abs(W.x), Math.abs(W.z)) * rz * Math.sqrt(Math.max(0.05, 1 - Math.min(1, (C.y * C.y) / (ry * ry)))) + 0.5 });
    for (let j = 0; j <= segs; j++) {
      const th = -Math.PI / 2 + (j % segs) / segs * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const px = Math.sign(cs) * Math.pow(Math.abs(cs), e) * rz, py = Math.sign(sn) * Math.pow(Math.abs(sn), e) * ry;
      let x = C.x + W.x * px + U.x * py, y = C.y + W.y * px + U.y * py, z = C.z + W.z * px + U.z * py;
      const rl = Math.sqrt(px * px + py * py) || 1, dx = (W.x * px + U.x * py) / rl, dy = (W.y * px + U.y * py) / rl, dz = (W.z * px + U.z * py) / rl;
      const b = o.bump * (o.bumpAt ? o.bumpAt(x) : 1) * (noise.fbm3(x * o.bumpF, y * o.bumpF, z * o.bumpF, 3) + 0.35 * noise.n3(x * o.bumpF * 4.3, y * o.bumpF * 4.3, z * o.bumpF * 4.3)) * Math.min(1, rl / 3);
      // o.inset(x, py, an, rr, ry): metres carved in (+) or raised (-) along the radial direction (grooves, greaves, bands);
      // an = angle round the section from its +W face (0) over the top or bottom (PI/2) to the back, rr = mean radius
      const an = Math.atan2(Math.abs(py) / ry, px / rz), rr = (ry + rz) * 0.5, ins = o.inset ? o.inset(C.x, py, an, rr, ry) : 0, mv = b - ins;
      x += dx * mv; y += dy * mv; z += dz * mv;
      const q = (i * (segs + 1) + j) * 3; P[q] = x; P[q + 1] = y; P[q + 2] = z; INS[q / 3] = ins; PY[q / 3] = py; AN[q / 3] = an; RR[q / 3] = rr;
    }
  }
  if (Y) await Y();
  const yCut = o.yCut ?? -1.2, tri = [];
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1;
    if (P[a * 3 + 1] < yCut && P[b * 3 + 1] < yCut && P[c * 3 + 1] < yCut && P[d * 3 + 1] < yCut) continue;
    tri.push(a, c, b, b, c, d);
  }
  for (let q = 0; q < tri.length; q += 3) {
    const a = tri[q] * 3, b = tri[q + 1] * 3, c = tri[q + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    Nn[a] += fx; Nn[a + 1] += fy; Nn[a + 2] += fz; Nn[b] += fx; Nn[b + 1] += fy; Nn[b + 2] += fz; Nn[c] += fx; Nn[c + 1] += fy; Nn[c + 2] += fz;
  }
  if (Y) await Y();
  // make sure the winding faces outward (compare one normal with its radial direction), weld the seam normals
  { const i = Math.floor(rings / 2), a = (i * (segs + 1) + Math.floor(segs / 4)) * 3; curve.getPoint(i / rings, C);
    if (Nn[a] * (P[a] - C.x) + Nn[a + 1] * (P[a + 1] - C.y) + Nn[a + 2] * (P[a + 2] - C.z) < 0) { for (let q = 0; q < Nn.length; q++) Nn[q] = -Nn[q]; for (let q = 0; q < tri.length; q += 3) { const t = tri[q + 1]; tri[q + 1] = tri[q + 2]; tri[q + 2] = t; } } }
  for (let i = 0; i <= rings; i++) { const a = i * (segs + 1) * 3, b = a + segs * 3; for (let q = 0; q < 3; q++) { const s = Nn[a + q] + Nn[b + q]; Nn[a + q] = s; Nn[b + q] = s; } }
  for (let v = 0; v < P.length / 3; v++) {
    if (Y && v % 400 === 399) await Y();
    let nx = Nn[v * 3], ny = Nn[v * 3 + 1], nz = Nn[v * 3 + 2]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], t = Math.floor(v / (segs + 1)) / rings;
    acc.pos.push(x, y, z); acc.nor.push(nx, ny, nz);
    const py = PY[v], an = AN[v], rr = RR[v], carve = clamp(INS[v] / 1.4, 0, 1);
    acc.mat.push(typeof o.bronze === 'function' ? o.bronze(t, x, y, z, py, an, rr) : o.bronze ?? 0.7, clamp(typeof o.reef === 'function' ? o.reef(t, x, y, z, ny, py, an, rr) : o.reef, 0, 1), o.gold ? o.gold(t, x, y, z, py, an, rr) : 0);
    // baked light: the flanks sink into shade toward the sand, carved grooves are dark, undersides get no sun
    acc.lit.push((0.5 + 0.5 * sst(0, 7.5, y)) * (1 - 0.4 * carve), (0.25 + 0.75 * sst(-0.4, 0.3, ny)) * (1 - 0.4 * carve), 0); acc.loc.push(x, y, z, 0);
  }
  for (let q = 0; q < tri.length; q++) acc.idx.push(base + tri[q]);
  acc.n += P.length / 3;
  return foot;
}

// ---------------------------------------------------------------- sand: rippled floor with drifts banked against the body
function makeSandHeight(noise, blobs, mode) {
  return (x, z, out) => {
    const edge = Math.max(-132 - x, x - 129, -48 - z, z - 57, 0);
    let drift = 0, gap = 1e9;
    if (edge < 30) for (let b = 0; b < blobs.length; b++) {
      const bl = blobs[b], ex = x - bl.x, ez = z - bl.z; if (ex > 60 || ex < -60 || ez > 60 || ez < -60) continue;
      const d = Math.sqrt(ex * ex + ez * ez) - bl.r; if (d > 40) continue;
      const amp = Math.min(3.2, 0.5 + 0.16 * bl.r) * (bl.amp ?? 1);
      drift = Math.max(drift, amp * Math.exp(-Math.max(0, d) / (2.5 + bl.r * 0.45))); gap = Math.min(gap, d);
    }
    let y = drift + 0.45 * noise.fbm2(x * 0.03, z * 0.03, 3) * (1 + drift * 0.3) + 0.25 * noise.n2(x * 0.011 + 7, z * 0.011);
    // dunes and drifts die away before the border of the fine grid, so the coarse skirt beyond it is truly flat
    y *= sst(0, 22, Math.min(x + 132, 129 - x, z + 48, 57 - z));
    if (mode === 'apron') y -= 1.8 * sst(8, 45, edge);
    if (out) out.gap = gap;
    return y;
  };
}
async function buildSand(heightAt, shadowers, sun, mode, radius, Y) {
  const fine = 3, xs = [], zs = [];
  const axis = (lo, hi, out) => {
    const far = mode === 'apron' ? 45 : radius, grow = [];
    for (let d = fine * 1.6, s = fine * 1.6; d < far; s *= 1.75, d += s) grow.push(Math.min(d, far));
    grow.push(far);
    for (let i = grow.length - 1; i >= 0; i--) out.push(lo - grow[i]);
    for (let v = lo; v <= hi + 0.01; v += fine) out.push(v);
    for (let i = 0; i < grow.length; i++) out.push(hi + grow[i]);
  };
  axis(-132, 129, xs); axis(-48, 57, zs);
  const tmp = { gap: 0 }, nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), lit = new Float32Array(nx * nz * 2), idx = [];
  for (let k = 0; k < nz; k++) { if (Y && k % 5 === 0) await Y(); for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[k], v = k * nx + i, y = heightAt(x, z, tmp), gap = tmp.gap;
    pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
    let sh = 1;
    for (const s of shadowers) if (Math.hypot(x - s.x, z - s.z) < s.r) sh = Math.min(sh, sdfShadow(s.sdf, x, y + 0.2, z, sun, s.k));
    lit[v * 2] = 1 - 0.5 * Math.exp(-Math.max(0, gap) / 3.5);
    lit[v * 2 + 1] = (0.1 + 0.9 * sh) * (1 - 0.45 * Math.exp(-Math.max(0, gap) / 5.5));   // a broad soft shadow under the flanks of the body
  } }
  for (let k = 0; k < nz - 1; k++) for (let i = 0; i < nx - 1; i++) { const a = k * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aLit', new THREE.BufferAttribute(lit, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- reef kit of the hero's own: five small coral forms
// Each geometry is ~1 m, base at the origin, +Y up; aCv = (shade 0 base .. 1 top, sway weight, glowing-tip weight).
function triSoup() {
  const pos = [], cv = [];
  return {
    pos, cv,
    tri(a, b, c, ca, cb, cc) { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); cv.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCv', new THREE.Float32BufferAttribute(cv, 3));
      const m = mergeVertices(g, 1e-3); m.computeVertexNormals(); g.dispose(); return m;
    },
  };
}
function mergeVertices(g, tol) { // weld equal position+aCv so normals come out smooth
  const p = g.attributes.position.array, c = g.attributes.aCv.array, map = new Map(), np = [], nc = [], idx = [], k = 1 / tol;
  for (let i = 0; i < p.length / 3; i++) {
    const key = Math.round(p[i * 3] * k) + '_' + Math.round(p[i * 3 + 1] * k) + '_' + Math.round(p[i * 3 + 2] * k);
    let j = map.get(key);
    if (j === undefined) { j = np.length / 3; map.set(key, j); np.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]); nc.push(c[i * 3], c[i * 3 + 1], c[i * 3 + 2]); }
    idx.push(j);
  }
  const o = new THREE.BufferGeometry();
  o.setAttribute('position', new THREE.Float32BufferAttribute(np, 3)); o.setAttribute('aCv', new THREE.Float32BufferAttribute(nc, 3)); o.setIndex(idx);
  return o;
}
function tube(out, pts, radii, sides, attr, capTip, capLen = 1.6) {
  const rings = [], t = new THREE.Vector3(), u = new THREE.Vector3(1, 0, 0.3).normalize(), v = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    t.copy(pts[Math.min(i + 1, pts.length - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    u.addScaledVector(t, -u.dot(t)); if (u.lengthSq() < 1e-4) u.set(0, 0, 1).addScaledVector(t, -t.z); u.normalize(); v.crossVectors(t, u);
    const ring = [];
    for (let s = 0; s < sides; s++) { const an = (s / sides) * Math.PI * 2; ring.push(pts[i].clone().addScaledVector(u, Math.cos(an) * radii[i]).addScaledVector(v, Math.sin(an) * radii[i])); }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < sides; s++) {
    const a = rings[i][s], b = rings[i][(s + 1) % sides], c = rings[i + 1][s], d = rings[i + 1][(s + 1) % sides];
    out.tri(a, b, c, attr(i), attr(i), attr(i + 1)); out.tri(b, d, c, attr(i), attr(i + 1), attr(i + 1));
  }
  if (capTip) { const L = rings.length - 1, tip = pts[L].clone().addScaledVector(t, radii[L] * capLen); for (let s = 0; s < sides; s++) out.tri(rings[L][s], rings[L][(s + 1) % sides], tip, attr(L), attr(L), capTip); }
}
function coralBoulder(rng, noise) {
  const o = triSoup(), R = 4, S = 9, off = rng.range(0, 50), grid = [];
  for (let r = 0; r <= R; r++) { const row = []; for (let s = 0; s < S; s++) {
    const el = (r / R) * 1.45, az = (s / S) * Math.PI * 2 + r * 0.35, x = Math.sin(el) * Math.cos(az), z = Math.sin(el) * Math.sin(az), y = Math.cos(el);
    const k = 0.5 * (1 + 0.38 * noise.n3(x * 1.6 + off, y * 1.6, z * 1.6));
    row.push(new THREE.Vector3(x * k, (y * 0.72 + 0.02) * k * 1.25 - 0.06, z * k));
  } grid.push(row); }
  const at = (r) => [1 - (r / R) * 0.75, 0, 0];
  for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) {
    const a = grid[r][s], b = grid[r][(s + 1) % S], c = grid[r + 1][s], d = grid[r + 1][(s + 1) % S];
    if (r > 0) o.tri(a, c, b, at(r), at(r + 1), at(r)); o.tri(b, c, d, at(r), at(r + 1), at(r + 1));
  }
  return o.geometry();
}
function coralTable(rng) {
  const o = triSoup(), up = new THREE.Vector3(0, 1, 0);
  const plate = (cx, cy, cz, rad, S) => {
    const c0 = new THREE.Vector3(cx, cy - 0.04, cz), inner = [], outer = [], under = new THREE.Vector3(cx, cy - 0.16, cz);
    for (let s = 0; s < S; s++) { const an = (s / S) * Math.PI * 2, k = rad * rng.range(0.8, 1.12);
      inner.push(new THREE.Vector3(cx + Math.cos(an) * k * 0.55, cy, cz + Math.sin(an) * k * 0.55)); outer.push(new THREE.Vector3(cx + Math.cos(an) * k, cy + 0.05 + rng.range(-0.02, 0.03), cz + Math.sin(an) * k)); }
    for (let s = 0; s < S; s++) { const t = (s + 1) % S;
      o.tri(c0, inner[t], inner[s], [0.7, 0, 0], [0.85, 0, 0], [0.85, 0, 0]);
      o.tri(inner[s], inner[t], outer[s], [0.85, 0, 0], [0.85, 0, 0], [1, 0, 0.6]); o.tri(inner[t], outer[t], outer[s], [0.85, 0, 0], [1, 0, 0.6], [1, 0, 0.6]);
      o.tri(under, outer[s], outer[t], [0.25, 0, 0], [0.5, 0, 0.3], [0.5, 0, 0.3]); }
  };
  tube(o, [new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(0.03, 0.42, 0.02)], [0.16, 0.24], 5, (i) => [0.2 + i * 0.3, 0, 0]);
  plate(0, 0.46, 0, 0.62, 10); plate(rng.range(-0.2, 0.2), 0.27, rng.range(0.2, 0.34), 0.36, 7);
  return o.geometry();
}
function coralStaghorn(rng) {
  const o = triSoup();
  const branch = (p, d, len, r, depth) => {
    const q = p.clone().addScaledVector(d, len);
    tube(o, [p, q], [r, r * 0.62], 3, (i) => [0.3 + 0.2 * (2 - depth) + i * 0.2, 0, depth === 0 && i ? 0.5 : 0], depth === 0 ? [1, 0, 1] : null);
    if (depth === 0) return;
    const n = depth === 2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const dd = d.clone().add(new THREE.Vector3(rng.range(-1, 1), rng.range(-0.1, 0.6), rng.range(-1, 1)).multiplyScalar(0.85)).normalize();
      branch(p.clone().lerp(q, rng.range(0.55, 0.95)), dd, len * rng.range(0.6, 0.8), r * 0.62, depth - 1);
    }
  };
  for (let k = 0; k < 2; k++) branch(new THREE.Vector3(rng.range(-0.12, 0.12), -0.08, rng.range(-0.12, 0.12)), new THREE.Vector3(rng.range(-0.4, 0.4), 1, rng.range(-0.4, 0.4)).normalize(), 0.42, 0.09, k === 0 ? 2 : 1);
  return o.geometry();
}
function coralFan(rng) {
  const o = triSoup(), A = 8, R = 3, grid = [];
  for (let r = 0; r <= R; r++) { const row = []; for (let a = 0; a <= A; a++) {
    const an = -1.15 + (a / A) * 2.3, k = (r / R) * (r === R ? rng.range(0.82, 1.08) : 1);
    row.push(new THREE.Vector3(Math.sin(an) * k * 0.7, 0.12 + Math.cos(an) * k * 0.88, 0.1 * Math.sin(an * 2.2 + r) * k));
  } grid.push(row); }
  const at = (r) => [0.35 + 0.65 * (r / R), (r / R) * (r / R), r === R ? 0.7 : 0];
  for (let r = 0; r < R; r++) for (let a = 0; a < A; a++) {
    const p = grid[r][a], q = grid[r][a + 1], s = grid[r + 1][a], t = grid[r + 1][a + 1];
    if (r > 0) o.tri(p, q, s, at(r), at(r), at(r + 1)); o.tri(q, t, s, at(r), at(r + 1), at(r + 1));
  }
  tube(o, [new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(0, 0.16, 0)], [0.06, 0.04], 3, () => [0.3, 0, 0]);
  return o.geometry();
}
function coralSoft(rng) {
  const o = triSoup(), n = 5;
  for (let f = 0; f < n; f++) {
    const an = (f / n) * Math.PI * 2 + rng.range(-0.4, 0.4), lean = f === 0 ? 0.05 : rng.range(0.25, 0.6), L = f === 0 ? 1 : rng.range(0.6, 0.9), pts = [], rad = [];
    for (let i = 0; i <= 3; i++) { const t = i / 3; pts.push(new THREE.Vector3(Math.cos(an) * lean * t * t * L, -0.08 + t * L, Math.sin(an) * lean * t * t * L)); rad.push(0.085 + 0.06 * Math.sin(t * 2.3)); }
    tube(o, pts, rad, 4, (i) => [0.3 + 0.7 * (i / 3), (i / 3) * (i / 3), i === 3 ? 0.8 : 0], [1, 1, 1], 0.75);
  }
  return o.geometry();
}

// ---------------------------------------------------------------- shaders (self-lit, linear HDR, scene fog honoured)
const GLSL_COMMON = /* glsl */`
uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uBounceCol;
uniform vec3 uCaus; uniform vec4 uWater;
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(17.1, 3.7, 9.2); a *= 0.5; } return s / 0.9375; }
float causticLayer(vec2 uv, float time) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0, i = p; float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / 0.005), p.y / (cos(i.y + t) / 0.005)));
  }
  c = 1.17 - pow(c / 4.0, 1.4);
  return pow(abs(c), 8.0);
}
// animated caustic light, projected along the sun direction; ~0.3 on average with bright moving filaments
float caustics(vec3 wp, float dist) {
  vec2 q = (wp.xz - uSunDir.xz / max(uSunDir.y, 0.25) * wp.y) * uCaus.x; float t = uTime * uCaus.z;
  float a = causticLayer(q, t), b = causticLayer(mat2(0.8, -0.6, 0.6, 0.8) * q * 0.61 + 3.7, t * 0.83 + 4.0);
  float pch = 0.6 + 0.8 * vnoise(vec3(q * 0.31, t * 0.12));
  float c = (a * 1.25 + b * 0.95 + min(a, b) * 1.2) * pch;
  return mix(c, 0.42, smoothstep(140.0, 480.0, dist));
}
vec3 bumpN(vec3 N, vec3 p, float h, float amt) {
  vec3 dpdx = dFdx(p), dpdy = dFdy(p); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx); float det = dot(dpdx, r1);
  return normalize(abs(det) * N - amt * sign(det) * (hx * r1 + hy * r2));
}
// sun (with caustics and baked shadow) + turquoise sky from above + warm sand bounce from below
vec3 seaLight(vec3 N, vec3 wp, float ao, float sh, float dist, out float caus) {
  caus = caustics(wp, dist);
  float ndl = max(dot(N, normalize(uSunDir)), 0.0);
  vec3 sun = uSunCol * ndl * sh * (0.3 + uCaus.y * caus);
  vec3 amb = mix(uBounceCol * (0.35 + 0.65 * ao), uSkyCol, smoothstep(-0.7, 0.8, N.y)) * ao * ao;
  amb *= mix(vec3(0.25, 0.5, 0.85), vec3(1.0), smoothstep(0.15, 0.7, ao));
  return sun + amb;
}
vec3 waterFog(vec3 col, float dist) { return mix(uWater.rgb, col, exp(-uWater.a * dist)); }
`;
// The idol's light model (noise, caustics, seaLight, bumpN) for world materials that must match it: sea bed, columns.
export const COLOSSUS_GLSL = GLSL_COMMON;

const STATUE_VERT = /* glsl */`
uniform vec3 uSeed;
attribute vec3 aMat; attribute vec3 aLit; attribute vec4 aLoc;
varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vMat; varying vec3 vLit; varying vec4 vLoc;
#include <fog_pars_vertex>
void main() {
  vP = position + uSeed; vMat = aMat; vLit = aLit; vLoc = aLoc;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STATUE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uStone; uniform vec3 uBronze; uniform vec3 uVerd; uniform vec3 uVerdPale; uniform vec3 uGold;
uniform vec3 uReefA; uniform vec3 uReefB; uniform vec3 uReefC; uniform vec3 uReefRock; uniform vec3 uGlowCol;
uniform vec4 uEye; uniform vec3 uPalm; uniform vec3 uFace;   // uFace: brow a, gold survival 0..1, brow arch
varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vMat; varying vec3 vLit; varying vec4 vLoc;
#include <fog_pars_fragment>
float seamLines(vec3 p, vec3 an, float size) {
  vec2 q = (an.z > an.x && an.z > an.y) ? p.yx : ((an.y > an.x) ? p.zx : p.zy);
  q /= size; q.x += 0.5 * floor(q.y);
  vec2 f = abs(fract(q) - 0.5);
  return 1.0 - smoothstep(0.03, 0.1, min(0.5 - f.x, (0.5 - f.y) * 0.8) * size);
}
void main() {
  vec3 N = normalize(vN);
  float bronze = vMat.x, reefA = vMat.y, gold = vMat.z, ao = vLit.x, sh = vLit.y, eng = vLit.z, part = vLoc.w;
  vec3 q = vLoc.xyz;
  float dist = length(cameraPosition - vW), lod = 1.0 - smoothstep(90.0, 260.0, dist), fine = 1.0 - smoothstep(22.0, 75.0, dist);
  float nBig = fbm(vP * 0.09 + 3.0), nMid = fbm(vP * 0.45 + 11.0), nFine = vnoise(vP * 2.7);
  vec3 an = abs(normalize(cross(dFdx(q), dFdy(q)) + 1e-6));
  float seam = seamLines(q, an, part > 0.5 ? 5.4 : 7.2) * lod;
  // pale stone, faintly banded and algae-tinged
  // (the body's dressed stone is a darker, greyer block than the mask, so legs and torso stand off the white sand)
  vec3 stone = uStone * (0.72 + 0.3 * nMid + 0.1 * nFine) * (part < 0.5 ? vec3(0.62, 0.64, 0.68) : vec3(1.12, 1.1, 1.06));
  stone = mix(stone, stone * vec3(0.8, 0.92, 0.84), smoothstep(0.45, 0.75, nBig) * 0.6);
  stone *= 0.9 + 0.1 * sin(q.x * 2.4 + nMid * 5.0);
  stone *= 1.0 - fine * (0.16 * smoothstep(0.5, 0.75, vnoise(vP * 5.3 + 80.0)) + 0.1 * smoothstep(0.55, 0.3, vnoise(vP * vec3(1.3, 6.0, 1.3) + 90.0)));   // pitting and tool marks up close
  // bronze: dark metal on rubbed high spots, verdigris everywhere else, streaked along gravity
  float streak = fbm(vec3(vP.x * 0.55, vP.y * 0.07, vP.z * 0.55) + 5.0);
  float verd = smoothstep(0.36, 0.62, nMid * 0.5 + streak * 0.6 + 0.08 * N.y + (1.0 - ao) * 0.3);
  vec3 bz = mix(uBronze * (0.7 + 0.6 * nFine), mix(uVerd, uVerdPale, smoothstep(0.3, 0.72, nBig + 0.3 * nFine - 0.12)), verd);
  if (part > 1.5) bz = mix(bz, uVerd * (0.8 + 0.5 * nFine), 0.4) * 0.8;   // the hand: deep verdigris, so it stands against the bright water
  float bm = smoothstep(0.35, 0.65, bronze + (nFine - 0.5) * 0.2);
  vec3 alb = mix(stone, bz, bm);
  float groove = 0.0, dark = 0.0;
  if (part > 0.5 && part < 1.5) {
    // the mask: carved crescent of the sleeping eye with gold on its lips, the lip line, verdigris tears
    float bb = q.y - uEye.y, k2 = 2.0 * uEye.z * bb;
    float da = abs(q.x - (uEye.x - 0.55 + uEye.z * bb * bb)) / sqrt(1.0 + k2 * k2);
    float endm = (1.0 - smoothstep(uEye.w, uEye.w + 0.3, abs(bb))) * eng;
    groove = (1.0 - smoothstep(0.15, 0.55, da)) * endm;
    // gold is an inlay here, not a tube: a 0.4 m line along the middle of the brow bar, a narrow lip on the crescent
    float browD = abs(q.x - (uFace.x - uFace.z * q.y * q.y));
    if (q.z > 6.0 && browD < 1.7 && abs(q.y) < 7.7) gold *= 1.0 - smoothstep(0.17, 0.3, browD);
    gold = max(gold, smoothstep(0.86, 0.72, da) * smoothstep(0.4, 0.5, da) * endm);
    float lip = (1.0 - smoothstep(0.06, 0.3, abs(q.x + 8.62))) * (1.0 - smoothstep(2.1, 2.7, abs(q.y))) * eng;
    groove = max(groove, lip); dark = groove;
    float run = vnoise(vec3(q.y * 1.15, q.x * 0.07, 2.0)) * 0.65 + vnoise(vec3(q.y * 3.3, q.x * 0.18, 7.0)) * 0.35;
    float stain = eng * smoothstep(0.56, 0.8, run) * smoothstep(uFace.x + 0.4, uFace.x - 2.0, q.x) * (0.45 + 0.55 * smoothstep(-13.0, 2.0, q.x));
    alb = mix(alb, mix(uVerd, uVerdPale, 0.6) * (0.8 + 0.3 * nFine), stain * 0.4);
  } else if (part > 1.5) {
    // the palm: concentric gold-inlaid rings and a sun-ray band, the setting that holds the portal
    vec2 pc = q.xy - uPalm.xy; float r = length(pc), ang = atan(pc.y, pc.x);
    float ring = min(min(abs(r - 2.5), abs(r - 4.3)), abs(r - 5.9));
    float ray = abs(fract(ang * 18.0 / 6.28318) - 0.5) * 6.28318 / 18.0 * r;
    float ld = min(ring, (r > 4.3 && r < 5.9) ? ray : 9.0);
    groove = (1.0 - smoothstep(0.1, 0.3, ld)) * eng;
    gold = max(gold, groove);
  } else if (q.x > 104.5) {
    // the soles: the same setting as the palm, carved where the ball and the heel of each foot press, and a gold rim
    float face = smoothstep(0.55, 0.8, N.x);
    vec2 pa = q.zy - vec2(8.6, 5.2), pb = q.zy - vec2(-2.4, 5.0); float ra = length(pa), rb = length(pb);
    float ring = min(min(min(abs(ra - 1.9), abs(ra - 3.4)), abs(ra - 4.9)), min(abs(rb - 1.5), abs(rb - 2.9)));
    float ray = abs(fract(atan(pa.y, pa.x) * 16.0 / 6.28318) - 0.5) * 6.28318 / 16.0 * ra;
    float ld = min(ring, (ra > 3.4 && ra < 4.9) ? ray : 9.0);
    groove = (1.0 - smoothstep(0.1, 0.32, ld)) * face * step(0.5, q.y);
    gold = max(gold, max(groove * 0.9, 0.8 * smoothstep(0.3, 0.45, N.x) * (1.0 - smoothstep(0.62, 0.78, N.x)) * smoothstep(106.0, 107.0, q.x) * smoothstep(0.3, 1.2, q.y)));
  }
  // gold leaf survives in flakes
  float flake = smoothstep(0.45, 0.6, fbm(vP * 1.15 + 20.0) + (gold - 0.75) * 0.8 + (uFace.y - 0.5) * 0.5);
  gold = step(0.05, gold) * mix(gold * 0.5, flake, lod);
  alb *= 1.0 - seam * (0.05 + 0.27 * bm + (part < 0.5 ? 0.2 : 0.04) * (1.0 - bm)) * (1.0 - gold);
  alb *= mix(0.55, 1.0, smoothstep(0.1, 0.5, ao));
  alb *= 1.0 - 0.75 * dark * (1.0 - gold);
  float gk = (part > 0.5 && part < 1.5) ? 0.72 : 1.0;   // the leaf on the mask is duller than on the hand
  alb = mix(alb, uGold * (0.5 + 0.2 * nFine) * gk, gold);
  // reef crust
  float cn = fbm(vP * 0.3 + 30.0);
  float crust = smoothstep(0.48, 0.62, reefA * 0.8 + cn * 0.62 + max(N.y, 0.0) * 0.14 - 0.26 - groove - gold * 0.3);
  float cell = vnoise(vP * 0.8 + 40.0) * 0.7 + nMid * 0.3, cell2 = vnoise(vP * 3.1 + 50.0);
  float cell3 = vnoise(vP * 1.9 + 70.0), mid = 1.0 - smoothstep(60.0, 200.0, dist);
  vec3 rc = mix(uReefRock, uReefRock * vec3(0.66, 0.86, 0.78), smoothstep(0.3, 0.7, nBig + 0.3 * cell2 - 0.15));
  rc = mix(rc, uReefA, smoothstep(0.56, 0.7, cell + 0.12 * (cell2 - 0.5)) * (0.45 + 0.5 * cell2));
  rc = mix(rc, uReefB, smoothstep(0.38, 0.26, cell + 0.12 * (cell2 - 0.5)) * (0.45 + 0.5 * cell2));
  rc = mix(rc, uReefC, smoothstep(0.7, 0.76, cell3) * smoothstep(0.4, 0.5, cell) * 0.85 * mid);
  rc = mix(rc, uReefRock * 1.35, smoothstep(0.3, 0.24, cell3) * 0.6 * mid);          // pale dead-coral plates
  float cFine = vnoise(vP * 5.0 + 23.0);
  rc *= mix(0.92, 0.5 + 0.5 * nFine + 0.4 * cell2, 0.35 + 0.65 * fine) * (1.0 - fine * 0.42 * smoothstep(0.62, 0.3, cFine));   // pores and polyp cups up close
  alb = mix(alb, rc, crust);
  float h = crust * (nMid * 0.6 + cell * 0.35 + (cell2 * 0.16 + nFine * 0.06 + cFine * 0.09) * fine) + (1.0 - crust) * (nMid * 0.1 + nFine * 0.035 - seam * 0.14 * bm) - groove * 0.3 + gold * 0.04;
  N = bumpN(N, vW, h, lod);
  float caus;
  vec3 light = seaLight(N, vW, ao, sh, dist, caus);
  vec3 col = alb * light;
  vec3 V = normalize(cameraPosition - vW), L = normalize(uSunDir), Hh = normalize(L + V);
  float ndh = max(dot(N, Hh), 0.0), ndl = max(dot(N, L), 0.0);
  col += uSunCol * (0.4 + caus) * sh * ndl * (pow(ndh, 60.0) * gold * 2.6 * gk * uGold + pow(ndh, 18.0) * (gold * 0.5 * gk * uGold + bm * (1.0 - crust) * 0.08));
  col += uGold * gold * gk * gk * sh * (0.2 + 0.9 * caus) * pow(max(dot(N, normalize(L + vec3(0.0, 1.0, 0.0))), 0.0), 5.0);
  col += uSkyCol * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.35 * ao;
  // fluorescent polyps twinkling in the crust
  float pol = smoothstep(0.84, 0.9, vnoise(vP * 4.4 + 60.0)) * crust * smoothstep(0.5, 0.62, cell) * fine;
  col += uGlowCol * pol * (1.6 + 1.2 * sin(uTime * 1.7 + cell2 * 40.0));
  gl_FragColor = vec4(waterFog(col, dist), 1.0);
  #include <fog_fragment>
}`;

const SAND_VERT = /* glsl */`
attribute vec2 aLit; varying vec3 vW; varying vec3 vN; varying vec2 vLit;
#include <fog_pars_vertex>
void main() {
  vLit = aLit; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SAND_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uSand;
varying vec3 vW; varying vec3 vN; varying vec2 vLit;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN);
  float dist = length(cameraPosition - vW), lod = 1.0 - smoothstep(50.0, 190.0, dist);
  float w = fbm(vec3(vW.xz * 0.05, 1.0));
  float r1 = sin((vW.x * 0.94 + vW.z * 0.34) * 3.6 + w * 16.0 + sin(vW.z * 0.21) * 1.5);
  r1 = r1 * (0.6 + 0.4 * r1 * r1);
  float grain = vnoise(vec3(vW.xz * 2.1, 3.0));
  N = bumpN(N, vW, (0.05 * r1 + 0.025 * grain) * lod, 1.0);
  vec3 alb = uSand * (0.84 + 0.12 * fbm(vec3(vW.xz * 0.4, 9.0)) + 0.05 * r1 * lod);
  alb = mix(alb, alb * vec3(0.8, 0.9, 0.93), smoothstep(0.45, 0.75, fbm(vec3(vW.xz * 0.018, 4.0))) * 0.3);
  float caus;
  vec3 col = alb * seaLight(N, vW, vLit.x, vLit.y, dist, caus);
  col += uSunCol * step(0.975, vnoise(vec3(vW.xz * 7.0, floor(uTime * 2.0)))) * caus * 0.5 * lod * vLit.y;
  gl_FragColor = vec4(waterFog(col, dist), 1.0);
  #include <fog_fragment>
}`;

const CORAL_VERT = /* glsl */`
uniform float uTime;
attribute vec3 aCv; varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vCv; varying vec3 vL;
#include <fog_pars_vertex>
void main() {
  vec4 ip = instanceMatrix * vec4(position, 1.0);
  vec3 io = instanceMatrix[3].xyz; float sc = length(instanceMatrix[1].xyz), ph = dot(io, vec3(0.37, 0.21, 0.53));
  float s1 = sin(uTime * 1.05 + ph + position.y * 2.0), s2 = cos(uTime * 0.8 + ph * 1.3 + position.y * 1.4);
  ip.xyz += aCv.y * sc * 0.3 * vec3(s1 + 0.4 * sin(uTime * 0.31 + io.x * 0.05), 0.12 * s1 * s2, s2);
  vec4 wp = modelMatrix * ip; vW = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vCv = aCv; vL = position;
  #ifdef USE_INSTANCING_COLOR
  vCol = instanceColor;
  #else
  vCol = vec3(0.8, 0.4, 0.4);
  #endif
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CORAL_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uGlow; uniform float uLace;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vCv; varying vec3 vL;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float dist = length(cameraPosition - vW);
  if (uLace > 0.5) {   // sea fans are nets: ribs radiating from the holdfast, cross-linked
    float rr = length(vL.xy - vec2(0.0, 0.1)), aa = atan(vL.x, vL.y - 0.1);
    float rib = abs(fract(aa * 9.0 + 0.3 * sin(rr * 9.0)) - 0.5), web = abs(fract(rr * 11.0 + 0.5 * sin(aa * 14.0)) - 0.5);
    if (min(rib * rr * 1.6, web * 0.5) > 0.075 && rr > 0.12 && dist < 110.0) discard;
  }
  vec3 alb = vCol * (0.2 + 0.8 * vCv.x) * (0.7 + 0.6 * vnoise(vW * 2.6)) * (0.74 + 0.4 * smoothstep(-0.3, 0.3, sin(vnoise(vL * 5.0) * 24.0)));
  float caus;
  vec3 col = alb * seaLight(N, vW, 0.45 + 0.55 * vCv.x, 0.55 + 0.45 * vCv.x, dist, caus);
  col += mix(vCol, vec3(1.0), 0.3) * vCv.z * vCv.z * uGlow * (0.7 + 0.3 * sin(uTime * 1.3 + vW.x * 0.7 + vW.z * 0.9));
  gl_FragColor = vec4(waterFog(col, dist), 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- small living things that belong to the idol
const SHOAL_VERT = /* glsl */`
uniform float uTime; uniform vec3 uEyeC; uniform vec3 uEyeN; uniform vec3 uEyeT1; uniform vec3 uEyeT2; uniform float uBurst;
attribute vec4 aSeed; varying vec3 vCol; varying float vShade; varying vec3 vW;
#include <fog_pars_vertex>
vec3 fishPos(float th) {
  float s = 0.5 + 0.5 * sin(th);
  float outw = -2.6 + (2.6 + (1.5 + 5.5 * aSeed.y) * uBurst) * s;
  float rad = 0.3 + 0.6 * aSeed.y + (0.5 + 2.4 * aSeed.y) * uBurst * s * s;
  float al = th * 2.0 + aSeed.w * 6.28318 + 0.6 * sin(th * 0.5 + aSeed.x * 20.0);
  return uEyeC + uEyeN * outw + (uEyeT1 * cos(al) + uEyeT2 * sin(al)) * rad;
}
void main() {
  float th = uTime * (0.22 + 0.2 * aSeed.z) + aSeed.x * 6.28318;
  vec3 c = fishPos(th), d = normalize(fishPos(th + 0.03) - c);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), d) + vec3(1e-4, 0.0, 0.0)), upv = cross(d, side);
  float size = 0.2 + 0.2 * aSeed.z;
  float wag = sin(uTime * 9.0 + aSeed.x * 40.0 - position.x * 3.0) * 0.16 * (0.55 - position.x);
  vec3 p = c + (d * position.x + upv * position.y + side * (position.z + wag)) * size;
  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz;
  vCol = aSeed.w < 0.55 ? vec3(1.0, 0.62, 0.05) : vec3(0.03, 0.25, 1.0);
  vShade = 0.55 + 0.45 * position.y * 2.5 + 0.35 * sin(th * 2.0 + aSeed.x * 9.0);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHOAL_FRAG = /* glsl */`
uniform vec4 uWater; uniform vec3 uSunCol;
varying vec3 vCol; varying float vShade; varying vec3 vW;
#include <fog_pars_fragment>
void main() {
  vec3 col = vCol * (0.3 + 1.0 * clamp(vShade, 0.0, 1.4)) * (0.6 + 0.4 * uSunCol);
  col = mix(uWater.rgb, col, exp(-uWater.a * length(cameraPosition - vW)));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function fishGeometry(count, rng) {
  const g = new THREE.InstancedBufferGeometry();
  // side profile in XY (head at +x), a thin top-view diamond in XZ so it never vanishes edge-on
  const P = [0.5, 0, 0, 0.2, 0.17, 0, -0.22, 0.1, 0, -0.5, 0.2, 0, -0.5, -0.2, 0, -0.22, -0.1, 0, 0.2, -0.17, 0, 0.1, 0, 0.07, 0.1, 0, -0.07, -0.3, 0, 0];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex([0, 1, 6, 1, 2, 6, 6, 2, 5, 2, 3, 4, 2, 4, 5, 0, 7, 9, 0, 9, 8]);
  const seed = new Float32Array(count * 4); for (let i = 0; i < seed.length; i++) seed[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = count;
  return g;
}

const BUBBLE_VERT = /* glsl */`
uniform float uTime; uniform vec3 uLips; uniform vec3 uLipN; uniform float uRise; uniform float uExhale;
attribute vec4 aB; varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
void main() {
  float life = fract(uTime * (0.055 + 0.04 * aB.w) + aB.x), on = step(aB.z, 0.45 + 0.55 * uExhale);
  float spread = 0.25 + 2.4 * life, wob = life * 0.6;
  vec3 c = uLips + uLipN * (0.3 + 1.5 * smoothstep(0.0, 0.12, life)) + vec3(0.0, life * uRise, 0.0)
    + vec3((aB.y - 0.5) * spread + sin(uTime * 1.6 + aB.x * 30.0) * wob, 0.0, (fract(aB.y * 7.31) - 0.5) * spread + cos(uTime * 1.3 + aB.x * 17.0) * wob);
  float size = (0.1 + 0.3 * aB.w * aB.w) * (0.6 + 1.1 * life) * on;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.0); mvPosition.xy += position.xy * size;
  vUv = position.xy; vA = smoothstep(0.0, 0.03, life) * (1.0 - smoothstep(0.9, 1.0, life));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BUBBLE_FRAG = /* glsl */`
uniform vec3 uTint; varying vec2 vUv; varying float vA;
#include <fog_pars_fragment>
void main() {
  float r = length(vUv); if (r > 1.0) discard;
  float rim = smoothstep(0.5, 0.95, r) * (1.0 - smoothstep(0.95, 1.0, r)), spot = 1.0 - smoothstep(0.0, 0.22, length(vUv - vec2(-0.35, 0.4)));
  gl_FragColor = vec4(uTint * (0.12 + 1.3 * rim + 2.2 * spot) * vA, 1.0);
  #include <fog_fragment>
}`;

const RAY_VERT = /* glsl */`
uniform float uTime; uniform vec3 uSunDir; uniform float uSurfaceY;
attribute vec4 aR; varying vec2 vUv; varying float vPh;
void main() {
  // position.x = -1..1 across, position.y = 0 (foot) .. 1 (surface); a cylindrical billboard slanted along the sun
  float y = mix(aR.y, uSurfaceY, position.y);
  vec3 c = vec3(aR.x, y, aR.z) + vec3(uSunDir.x, 0.0, uSunDir.z) / max(uSunDir.y, 0.3) * (y - aR.y);
  vec4 wc = modelMatrix * vec4(c, 1.0);
  vec3 toCam = cameraPosition - wc.xyz, right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam) + vec3(1e-4, 0.0, 0.0));
  float wd = aR.w * (0.6 + 0.4 * position.y);
  wc.xyz += right * position.x * wd;
  vUv = position.xy; vPh = aR.w * 3.7 + aR.x;
  gl_Position = projectionMatrix * viewMatrix * wc;
}`;
const RAY_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uTint; uniform float uGain; varying vec2 vUv; varying float vPh;
void main() {
  float a = exp(-vUv.x * vUv.x * 3.5) * smoothstep(0.0, 0.3, vUv.y) * (0.25 + 0.75 * vUv.y) * (1.0 - smoothstep(0.93, 1.0, vUv.y));
  float fl = 0.55 + 0.45 * sin(uTime * 0.9 + vPh * 5.0) * sin(uTime * 0.53 + vPh * 2.3 + vUv.x * 2.0);
  gl_FragColor = vec4(uTint * a * fl * uGain, 1.0);
}`;

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((c) => new THREE.Color(c));
  const up = V3(0, 1, 0), surfaceY = opts.surfaceY ?? 26;
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : V3(-0.22, 1, 0.3)).normalize(), sun = [sunDir.x, sunDir.y, sunDir.z];

  // ---- per-seed character
  const hollow = opts.hollowEye ?? (rng.chance(0.7) ? 'lower' : 'upper');
  const H = {
    c: [-50, 4.2, 0], roll: (opts.roll ?? rng.range(24, 32)) * DEG, yaw: rng.range(-4, 4) * DEG, sC: hollow === 'lower' ? 1 : -1,
    browA: 3.6, browArch: rng.range(0.008, 0.02), bandGap: rng.range(3.6, 5.2), crestN: rng.int(9, 15), crestH: rng.range(5.0, 6.4), crestA: rng.range(8.6, 10.2),
    eyeA: 0.5, eyeB: 4.3, eyeK: rng.range(0.07, 0.1),
  };
  const goldAmt = opts.gold ?? rng.range(0.42, 0.78), reefAmt = opts.reef ?? rng.range(0.85, 1.1);
  const head = makeHead(H);

  // approach line: the camera's last straight runs along A and ends in the portal held by the hand
  const skew = 9 * DEG, A = V3(-Math.cos(skew), 0, -Math.sin(skew)), R = V3().crossVectors(A, up);
  const beta = rng.range(19, 23) * DEG, phi = rng.range(5, 9) * DEG, xi = rng.range(-3, 5) * DEG;
  const F = A.clone().multiplyScalar(Math.cos(beta)).addScaledVector(R, Math.sin(beta)).multiplyScalar(Math.cos(phi)).addScaledVector(up, Math.sin(phi)).normalize();
  let N = up.clone().addScaledVector(F, -up.dot(F)).normalize();
  N = N.clone().multiplyScalar(Math.cos(xi)).addScaledVector(V3().crossVectors(F, N), Math.sin(xi)).normalize();
  const S = V3().crossVectors(N, F).normalize();
  const elbow = V3(-72, -3, 13);
  const G = { O: V3(-103, 6.3, 16.5), F, S, N, A, surfaceY, elbow, curl: opts.curl ?? rng.range(0.9, 1.12), fingerLen: rng.range(0.96, 1.04) };
  const hand = makeHand(G, rng);

  // ---- statue geometry: head and hand are meshed sdfs, the rest are lofts buried in reef
  const acc = makeAcc();
  const hm = await surfaceNets(head.sdf, [H.c[0] - 21, -1.6, H.c[2] - 18.5], [H.c[0] + 28, 21.5, H.c[2] + 18.5], opts.headCell ?? 0.6, { yCut: -1.0, sun, yield: ctx.yield });
  await addNets(acc, hm, head.mat, 1, ctx.yield);
  await ctx.yield();
  const hb = new THREE.Box3();
  for (const f of hand.fingers) for (const j of f) hb.expandByPoint(hand.world(j[0], j[1], j[2]));
  for (const sx of [-8.5, 8]) for (const sy of [-7.5, 7.5]) for (const sz of [-2.5, 2]) hb.expandByPoint(hand.world(sx, sy, sz));
  hb.expandByPoint(hand.wristEnd).expandByScalar(3.4);
  const gm = await surfaceNets(hand.sdf, [hb.min.x, hb.min.y, hb.min.z], [hb.max.x, hb.max.y, hb.max.z], opts.handCell ?? 0.55, { sun, yield: ctx.yield });
  await addNets(acc, gm, hand.mat, 2, ctx.yield);
  await ctx.yield();

  const blobs = [], solids = [];   // sand-drift footprints; spheres approximating the lofts for distance()
  const addBody = async (st, o) => {
    const foot = await addLoft(acc, noise, st, o, ctx.yield); for (const f of foot) blobs.push(f);
    for (let i = 0; i < st.length - 1; i++) for (let k = 0; k < 4; k++) { const t = k / 4; solids.push([lerp(st[i][0], st[i + 1][0], t), lerp(st[i][1], st[i + 1][1], t), lerp(st[i][2], st[i + 1][2], t), Math.max(lerp(st[i][3], st[i + 1][3], t), lerp(st[i][4], st[i + 1][4], t)) + o.bump]); }
  };
  const j = (a) => rng.range(-a, a), girth = rng.range(0.94, 1.06);
  // Bands that say "made": a girdle below the hip and a collar at the shoulder (x centre, half width), raised bronze
  // with gold surviving on the rims. The legs wear armour on the side the lens sees: a round boss on each kneecap, a
  // bronze greave down each shin with a gold rim and a ridge, and an anklet.
  const BANDS = [[38.5 + j(1.5), 2.6], [-30.5, 1.5]], KX = 63 + j(1.5), GRV = [KX + 5.2, 91 + j(0.6)], GA = [0.2, 1.1], GM = 0.64, ANK = [96.6, 1.7];
  const torsoBand = (x) => { let m = 0; for (const b of BANDS) m = Math.max(m, 1 - sst(b[1] - 0.5, b[1] + 0.3, Math.abs(x - b[0]))); return m; };
  const bandRim = (x) => { let m = 0; for (const b of BANDS) m = Math.max(m, 1 - sst(0.35, 0.75, Math.abs(Math.abs(x - b[0]) - b[1] + 0.6))); return m; };
  const torsoNear = (x) => { let m = 0; for (const b of BANDS) m = Math.max(m, 1 - sst(b[1] + 1, b[1] + 6, Math.abs(x - b[0]))); return m; };
  const plateD = (x, an, rr) => Math.min(x - GRV[0], GRV[1] - x, (an - GA[0]) * rr, (GA[1] - an * (1 + 0.012 * (x - GRV[0]))) * rr);   // metres inside the greave (it narrows toward the ankle)
  const onGreave = (x, an, rr) => sst(-0.2, 0.35, plateD(x, an, rr));
  const greaveRim = (x, an, rr) => { const d = plateD(x, an, rr); return sst(-0.2, 0.3, d) * Math.max(1 - sst(0.7, 1.2, d), 1 - sst(0.35, 0.8, Math.abs(an - GM) * rr)); };
  const kneeD = (x, an, rr) => Math.hypot(x - KX, (an - GM) * rr);
  const onKnee = (x, an, rr) => 1 - sst(2.9, 3.5, kneeD(x, an, rr));
  const kneeRim = (x, an, rr) => { const d = kneeD(x, an, rr); return Math.max(1 - sst(0.4, 0.8, Math.abs(d - 2.5)), 1 - sst(0.5, 0.9, d)); };
  const onAnklet = (x) => 1 - sst(ANK[1] - 0.35, ANK[1] + 0.25, Math.abs(x - ANK[0]));
  const ankletRim = (x) => onAnklet(x) * (1 - sst(0.35, 0.75, Math.abs(Math.abs(x - ANK[0]) - ANK[1] + 0.8)));
  const legs = (x) => sst(47, 56, x) * sst(106.5, 103, x);                                   // where the two stacked legs part
  const armBand = (t) => Math.max(1 - sst(0.03, 0.045, Math.abs(t - 0.44)), 1 - sst(0.018, 0.03, Math.abs(t - 0.8)));
  // torso to ankles: pale stone under the reef; shoulder, waist, hip, then the legs lying one on the other, the upper
  // one clear of the sand: thigh, a pinched knee, the swell of the calf, a narrow ankle, the heel
  await addBody([[-41, 0.8, -3, 2, 2], [-35, 0.4, -2.6, 9, 8.5], [-27, 0, -2, 18.5 * girth, 10], [-12, 0, -1, 17.5 * girth, 11.5], [6 + j(2), -1, 0, 12.5, 9.5], [23 + j(2), -1, 0, 16.5 * girth, 11.5],
    [42, -0.5, 2, 12.8, 9], [53, 2, 3.6, 11.0, 8.3], [KX, 4.2, 5 + j(1.2), 7.6, 6.7], [72, 4.5, 4.2, 9.6, 7.3], [80, 4.6, 3, 10.0, 7.7], [89, 4.5, 2.1, 7.8, 5.9], [97, 4.4, 1.5, 5.8, 4.4], [103.5, 4.5, 1, 8, 4.8], [107, 4.7, 1, 2.5, 2]],
    { rings: 196, segs: 72, bump: 1.5, bumpF: 0.075, sup: 0.86, bumpAt: (x) => (1 - 0.6 * sst(58, 68, x)) * (1 - 0.8 * Math.max(onAnklet(x), torsoBand(x))),
      // the groove where the upper leg rests on the lower: a broad valley with a sharp crease in it; armour and bands stand proud
      inset: (x, py, an, rr, ry) => { const w = 0.24 * ry, kd = kneeD(x, an, rr);
        return legs(x) * (1.5 * Math.exp(-(py * py) / (w * w)) + 0.9 * Math.exp(-(py * py) / 0.5))
          - Math.max(onGreave(x, an, rr) * (0.45 + 0.3 * (1 - sst(0.2, 1.0, Math.abs(an - GM) * rr))), kd < 3.5 ? 0.3 + 0.75 * Math.sqrt(1 - (kd * kd) / 12.25) : 0, 0.65 * onAnklet(x) * sst(0.6, 1.4, Math.abs(py)), 0.5 * torsoBand(x)); },
      bronze: (t, x, y, z, py, an, rr) => Math.max(0.12, onGreave(x, an, rr), onKnee(x, an, rr), onAnklet(x), torsoBand(x)),
      gold: (t, x, y, z, py, an, rr) => sst(0.4, 1.6, y) * Math.max(0.85 * greaveRim(x, an, rr), 0.85 * onKnee(x, an, rr) * kneeRim(x, an, rr), 0.85 * ankletRim(x), torsoBand(x) * (0.42 + 0.43 * bandRim(x))),
      reef: (t, x, y, z, ny, py, an, rr) => {
        const flank = sst(1.5, 6.5, z) * sst(0.8, 3.5, y), panel = sst(-0.3, 0.2, noise.n3(x * 0.028 + 11, y * 0.05, 3.7) + 0.25 * noise.n3(x * 0.11, y * 0.11, z * 0.11));
        const bare = Math.max(flank * (0.35 + 0.65 * panel), sst(0, 1, torsoNear(x)) * sst(0.3, 2, y) * (0.5 + 0.5 * flank), onGreave(x, an, rr), onKnee(x, an, rr), onAnklet(x));
        // the shins keep more of their dressed stone than the torso, but the reef has them along the top and in patches
        return (0.74 + 0.3 * noise.n3(x * 0.045, y * 0.045, z * 0.045)) * reefAmt * (1 - 0.72 * bare) * (1 - 0.35 * sst(66, 80, x) * (1 - 0.7 * sst(0.3, 0.8, ny)));
      } });
  await ctx.yield();
  // the upper arm folded across the belly, Cycladic fashion
  await addBody([[-27, 13, 1, 3.5, 3.5], [-22, 14.5, 3.5, 5.6, 5.2], [-2 + j(2), 10.5, 8.2, 4.7, 4.4], [9, 4, 12, 3.8, 3.6], [15, 0.6, 13, 3.0, 3.0], [18, -1.5, 13, 1.2, 1.2]],
    { rings: 64, segs: 18, bump: 0.6, bumpF: 0.14, sup: 0.8, bronze: 0.95, gold: (t) => 0.85 * armBand(t),
      reef: (t, x, y, z) => (0.7 + 0.2 * Math.sin(t * 9)) * reefAmt * (1 - 0.75 * Math.max(armBand(t), sst(0.2, 0.3, t) * sst(0.95, 0.85, t) * sst(-0.2, 0.25, noise.n3(x * 0.09, y * 0.09 + 5, z * 0.09)))) });
  // the arm the head sleeps on: buried shoulder -> elbow -> forearm rising to the wrist (ends under the armband)
  const wj = hand.wristStart.clone().lerp(hand.wristEnd, 0.5), wb = hand.wristEnd.clone().lerp(elbow, 0.12);
  await addBody([[-28, -8, 6, 5.4, 5.4], [-50, -6.2, 8.5, 5.4, 5.4], [elbow.x + 2, elbow.y - 0.4, elbow.z - 0.6, 5.3, 5.3], [elbow.x - 4, elbow.y + 0.9, elbow.z + 1.2, 4.7, 5.0],
    [wb.x, wb.y, wb.z, 3.45, 3.7], [wj.x, wj.y, wj.z, 2.8, 2.85]],
    { rings: 60, segs: 22, bump: 0.3, bumpF: 0.2, sup: 0.84, bronze: 1, reef: (t) => lerp(0.85, 0.3, sst(0.55, 1, t)) * reefAmt });
  await ctx.yield();
  // feet: the pair stacked on edge, 14 m tall, soles a flat wall toward +X and five toes in a column toward the viewer
  // side, capped with gold leaf like the fingertips. With the bare shins and the anklet this is the first made thing
  // seen from the entry.
  await addBody([[105, 3.6, -9, 2.5, 2], [105.6, 4.9, -5.5, 8.9, 4.4], [106.2, 5.2, 3, 9.4, 4.3], [106.8, 5.1, 11, 8.9, 3.7], [107.2, 4.9, 15.6, 8.2, 3.2], [107.3, 4.9, 17.2, 7.0, 2.5], [107.3, 4.9, 17.9, 2.6, 1.2]],
    { rings: 32, segs: 24, bump: 0.3, bumpF: 0.15, sup: 0.5, bronze: 0.12, up: V3(0, 1, 0),
      reef: (t, x, y, z) => (0.16 + 0.22 * noise.n3(x * 0.08, y * 0.08 + 3, z * 0.08) + 0.3 * sst(2.5, 0, y)) * reefAmt });
  await ctx.yield();
  { let top = 13.2;
    for (const [i, r] of [1.8, 1.5, 1.4, 1.3, 1.1].entries()) {
      const yc = top - r, len = 4 - i * 0.5; top -= 2 * r - 0.1;
      await addBody([[107.2, yc, 14.6, r * 0.9, r], [107.3, yc, 17.6, r, r * 1.08], [107.4, yc - 0.1, 18.4 + len, r * 0.92, r], [107.4, yc - 0.25, 19.5 + len, r * 0.35, r * 0.4]],
        { rings: 9, segs: 12, bump: 0.1, bumpF: 0.3, sup: 0.72, bronze: 0.12, up: V3(0, 1, 0), yCut: -0.8, gold: (t) => 0.85 * sst(0.7, 0.78, t), reef: (t, x, y) => (0.1 + 0.3 * sst(1.5, 0, y)) * reefAmt });
    } }
  for (const dx of [-9, 0, 9]) blobs.push({ x: H.c[0] + dx, z: H.c[2] - 1.5, r: 10.5, amp: 0.8 });
  await ctx.yield();
  const statueGeo = await accGeometry(acc, ctx.yield);
  await ctx.yield();

  // ---- shared light uniforms
  const sandCol = new THREE.Color(opts.sandColor ?? '#f4efe2').multiplyScalar(0.8);
  const sky = pal[1].clone().lerp(pal[0], 0.3).multiplyScalar(0.36);
  const U = {
    uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Color(1.22, 1.16, 0.95) }, uSkyCol: { value: sky },
    uBounceCol: { value: sandCol.clone().multiplyScalar(0.42) }, uCaus: { value: V3(1 / 8, 1.0, 0.55) },
    uWater: { value: new THREE.Vector4(pal[1].r * 0.55, pal[1].g * 0.75, pal[1].b * 0.8, opts.waterDensity ?? 0) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const hueJ = rng.range(-0.035, 0.035);
  const green = new THREE.Color('#2f9e7a'), verd = pal[1].clone().lerp(green, 0.62).offsetHSL(hueJ, 0, 0).multiplyScalar(0.5);
  const lilac = new THREE.Color('#b59be8').lerp(pal[5], 0.12);
  const eyeC = head.world(H.eyeA, -H.sC * H.eyeB, head.f0(H.eyeA, H.eyeB)), closedC = head.world(H.eyeA, H.sC * H.eyeB, head.f0(H.eyeA, H.eyeB) + 0.8);
  const statueMat = new THREE.ShaderMaterial({
    vertexShader: STATUE_VERT, fragmentShader: STATUE_FRAG, fog: true,
    uniforms: { ...fogU(), ...U,
      uSeed: { value: V3(rng.range(0, 90), rng.range(0, 90), rng.range(0, 90)) },
      uStone: { value: pal[4].clone().multiplyScalar(0.9) }, uBronze: { value: new THREE.Color(0.2, 0.115, 0.045) },
      uVerd: { value: verd }, uVerdPale: { value: pal[0].clone().lerp(pal[1], 0.45).lerp(green, 0.25).offsetHSL(hueJ, 0, 0).multiplyScalar(0.5) },
      uGold: { value: pal[6].clone().lerp(new THREE.Color(1.0, 0.42, 0.02), 0.4) }, uReefA: { value: pal[5].clone().multiplyScalar(0.95) }, uReefB: { value: lilac.clone().multiplyScalar(0.8) },
      uReefC: { value: pal[6].clone().multiplyScalar(0.85) }, uReefRock: { value: pal[4].clone().lerp(new THREE.Color('#9a9474'), 0.4).multiplyScalar(0.86) },
      uGlowCol: { value: pal[6].clone().lerp(pal[0], 0.35) },
      uEye: { value: new THREE.Vector4(H.eyeA, H.sC * H.eyeB, H.eyeK, 3.0) }, uPalm: { value: V3(0.8, 0, 0) }, uFace: { value: new THREE.Vector3(H.browA, goldAmt, H.browArch) } },
  });
  const object = new THREE.Group(); object.name = 'sunken-colossus';
  const statue = new THREE.Mesh(statueGeo, statueMat); statue.name = 'colossus'; object.add(statue);

  // ---- sand with drifts, contact shade and the soft shadows of head and hand
  const sandMode = opts.sand === undefined ? 'full' : opts.sand, heightAt = makeSandHeight(noise, blobs, sandMode);
  let sandGeo = null;
  if (sandMode) {
    sandGeo = await buildSand(heightAt, [{ x: H.c[0], z: H.c[2], r: 32, sdf: head.sdf, k: 3 }, { x: G.O.x, z: G.O.z, r: 30, sdf: hand.sdf, k: 2.2 }], sun, sandMode, opts.sandRadius ?? 1400, ctx.yield);
    const sand = new THREE.Mesh(sandGeo, new THREE.ShaderMaterial({ vertexShader: SAND_VERT, fragmentShader: SAND_FRAG, fog: true, uniforms: { ...fogU(), ...U, uSand: { value: sandCol } } }));
    sand.name = 'sand'; object.add(sand);
  }
  await ctx.yield();

  // ---- corals growing on the reef-covered parts and along the foot of the body
  const cand = [];
  for (let v = 0; v < acc.n; v++) {
    const reef = acc.mat[v * 3 + 1], ny = acc.nor[v * 3 + 1], y = acc.pos[v * 3 + 1], part = acc.loc[v * 4 + 3];
    if (y < 0.4 || ny < 0.05 || reef < 0.3) continue;
    if (part === 2 && acc.loc[v * 4] > -9.5) continue;                    // nothing on the palm or fingers: the portal lives there
    if (part === 1 && acc.lit[v * 3 + 2] > 0.05) continue;                // the mask stays clean
    cand.push({ x: acc.pos[v * 3], y, z: acc.pos[v * 3 + 2], nx: acc.nor[v * 3], ny, nz: acc.nor[v * 3 + 2], w: (part > 0 ? 0.3 : 1.7) * reef * reef * (part === 0 && acc.nor[v * 3 + 2] > 0.3 ? 1.8 : 1), part });
  }
  for (let i = 0; i < 520; i++) {
    const b = blobs[rng.int(0, blobs.length - 1)], an = rng.range(0, Math.PI * 2), d = b.r + rng.range(0.5, 7) * rng();
    const x = b.x + Math.cos(an) * d, z = b.z + Math.sin(an) * d;
    if (head.sdf(x, 1, z) < 2.5 || Math.hypot(x - G.O.x, z - G.O.z) < 20) continue;
    cand.push({ x, y: heightAt(x, z) - 0.05, z, nx: 0, ny: 1, nz: 0, w: 1.3, part: -1 });
  }
  await ctx.yield();
  const U2 = { ...fogU(), ...U, uGlow: { value: opts.glow ?? 2.6 }, uLace: { value: 0 } };
  const coralMat = new THREE.ShaderMaterial({ vertexShader: CORAL_VERT, fragmentShader: CORAL_FRAG, fog: true, side: THREE.DoubleSide, uniforms: U2 });
  const fanMat = new THREE.ShaderMaterial({ vertexShader: CORAL_VERT, fragmentShader: CORAL_FRAG, fog: true, side: THREE.DoubleSide, uniforms: { ...U2, uLace: { value: 1 } } });
  const cPink = pal[5].clone().multiplyScalar(0.7), cYel = pal[6].clone().multiplyScalar(0.62), cCream = pal[4].clone().lerp(pal[5], 0.25).multiplyScalar(0.55), cTeal = pal[1].clone().lerp(green, 0.4).multiplyScalar(0.5), cLil = lilac.clone().multiplyScalar(0.6);
  const k = opts.coralDensity ?? 1, limb = (c) => c.part === 0 && (c.x < -60 || (c.x > 58 && c.y > 6.5));   // the forearm, the top edge of the legs
  const shoulder = (c) => (c.part === 0 && c.x > -44 && c.x < -4 && c.y > 8 ? 7 : limb(c) ? 3 : 0.25);
  const kinds = [
    { geo: coralBoulder(rng, noise), n: 560, s: [0.6, 2.1], aff: (c) => (limb(c) ? 0.12 : 1), cols: [cCream, cYel, cLil, cTeal, cCream], upMix: 0.3, squash: [0.55, 1.0] },
    { geo: coralTable(rng), n: 150, s: [0.9, 1.9], aff: (c) => (c.ny > 0.45 ? 1 : 0.12), cols: [cPink, cTeal, cLil], upMix: 0.75 },
    { geo: coralStaghorn(rng), n: 230, s: [0.8, 1.6], aff: (c) => (c.ny > 0.3 ? 1 : 0.3), cols: [cPink, cYel, cLil, cPink], upMix: 0.5 },
    { geo: coralFan(rng), n: 240, s: [1.0, 2.2], aff: (c) => (c.part === 1 || limb(c) ? 3 : c.y > 9 ? 1.6 : 0.6), cols: [cLil, cPink, cYel], upMix: 0.7, mat: fanMat },
    { geo: coralSoft(rng), n: 250, s: [0.9, 1.9], aff: shoulder, cols: [cPink, cLil, cTeal, cPink], upMix: 0.45 },
  ];
  const dom = rng.int(0, 2), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), q2 = new THREE.Quaternion(), nv = V3(), pv = V3(), sv = V3(), col = new THREE.Color();
  let coralTris = 0;
  for (const kd of kinds) {
    const n = Math.round(kd.n * k); if (n < 1) continue;
    const cdf = new Float32Array(cand.length); let sum = 0;
    for (let i = 0; i < cand.length; i++) { sum += cand[i].w * kd.aff(cand[i]); cdf[i] = sum; }
    const im = new THREE.InstancedMesh(kd.geo, kd.mat || coralMat, n); im.name = 'coral';
    for (let i = 0; i < n; i++) {
      const r = rng() * sum; let lo = 0, hi = cand.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
      const c = cand[lo], s = rng.range(kd.s[0], kd.s[1]) * (c.part === -1 ? 0.8 : 1) * (c.part === 1 || c.part === 2 ? 0.7 : 1);
      nv.set(c.nx, c.ny, c.nz).lerp(up, kd.upMix).normalize();
      qt.setFromUnitVectors(up, nv).multiply(q2.setFromAxisAngle(up, rng.range(0, Math.PI * 2)));
      pv.set(c.x + rng.range(-0.8, 0.8), c.y, c.z + rng.range(-0.8, 0.8)).addScaledVector(nv, -0.1 * s);
      sv.set(s, s * (kd.squash ? rng.range(kd.squash[0], kd.squash[1]) : 1), s);
      im.setMatrixAt(i, m4.compose(pv, qt, sv));
      col.copy(rng.chance(0.4) ? kd.cols[dom % kd.cols.length] : rng.pick(kd.cols)).offsetHSL(rng.range(-0.025, 0.025), 0, rng.range(-0.05, 0.05));
      im.setColorAt(i, col);
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false;
    coralTris += n * kd.geo.index.count / 3; object.add(im);
    await ctx.yield();
  }
  await ctx.yield();

  // ---- the shoal that lives in the hollow eye, bubbles from the lips, sun shafts through the fingers
  const fx = {};
  const eyeN = head.dir(0, 0, 1).normalize(), lips = head.world(-8.62, 0, head.f0(-8.62, 0) + 0.4);
  if (opts.shoal !== false) {
    fx.shoalU = { ...fogU(), uTime: U.uTime, uWater: U.uWater, uSunCol: U.uSunCol, uEyeC: { value: eyeC }, uEyeN: { value: eyeN },
      uEyeT1: { value: head.dir(1, 0, 0).normalize() }, uEyeT2: { value: head.dir(0, 1, 0).normalize() }, uBurst: { value: 1 } };
    const shoal = new THREE.Mesh(fishGeometry(opts.fish ?? 320, rng), new THREE.ShaderMaterial({ vertexShader: SHOAL_VERT, fragmentShader: SHOAL_FRAG, fog: true, side: THREE.DoubleSide, uniforms: fx.shoalU }));
    shoal.frustumCulled = false; shoal.name = 'eye-shoal'; object.add(shoal);
  }
  const quad = (count, name, data) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(name === 'aR' ? [-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0] : [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.setAttribute(name, new THREE.InstancedBufferAttribute(data, 4)); g.instanceCount = count;
    return g;
  };
  if (opts.bubbles !== false) {
    const nB = 130, d = new Float32Array(nB * 4); for (let i = 0; i < d.length; i++) d[i] = rng();
    fx.bubU = { ...fogU(), uTime: U.uTime, uLips: { value: lips }, uLipN: { value: eyeN }, uRise: { value: surfaceY - lips.y - 0.5 }, uExhale: { value: 0.5 }, uTint: { value: pal[0].clone().multiplyScalar(1.5) } };
    const bub = new THREE.Mesh(quad(nB, 'aB', d), new THREE.ShaderMaterial({ vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: fx.bubU }));
    bub.frustumCulled = false; bub.name = 'lip-bubbles'; object.add(bub);
  }
  if (opts.rays !== false) {
    const nR = 16, d = new Float32Array(nR * 4);
    for (let i = 0; i < nR; i++) {
      const p = i < 9 ? hand.world(rng.range(4, 15), rng.range(-8, 9), 0) : hand.world(rng.range(-16, 4), rng.range(-14, 14), 0);
      d[i * 4] = p.x; d[i * 4 + 1] = Math.max(0, heightAt(p.x, p.z)); d[i * 4 + 2] = p.z; d[i * 4 + 3] = rng.range(1.2, 3.4);
    }
    fx.rayU = { uTime: U.uTime, uSunDir: U.uSunDir, uSurfaceY: { value: surfaceY }, uTint: { value: pal[0].clone().lerp(new THREE.Color(1, 1, 0.9), 0.3) }, uGain: { value: 0.2 } };
    const rays = new THREE.Mesh(quad(nR, 'aR', d), new THREE.ShaderMaterial({ vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: fx.rayU }));
    rays.frustumCulled = false; rays.renderOrder = 5; rays.name = 'finger-rays'; object.add(rays);
  }

  // ---- anchors (local space)
  const portalPos = hand.world(0.9, 0, 8.4), straightStart = portalPos.clone().addScaledVector(A, -62);
  const faceCenter = head.world(0, 0, 9.7), faceNormal = eyeN.clone();
  const flyThrough = [V3(150, 6, 36), V3(104, 5.5, 31), V3(60, 6.5, 31), V3(22, 8, 32), V3(-14, 9.5, 31), V3(-32, 11.5, 28.5), straightStart,
    portalPos.clone().addScaledVector(A, -30), portalPos.clone()];
  // conservative distance from a local-space point to the solid idol (head and hand exact, the rest as spheres)
  const distance = (x, y, z) => {
    let d = Math.min(head.sdf(x, y, z, true), hand.sdf(x, y, z, true));
    for (let i = 0; i < solids.length; i++) { const s = solids[i], e = Math.hypot(x - s[0], y - s[1], z - s[2]) - s[3]; if (e < d) d = e; }
    return d;
  };
  let clearance = 1e9; const tp = V3();
  for (let i = 0; i < flyThrough.length - 1; i++) for (let t = 0; t <= 1; t += 0.05) { tp.lerpVectors(flyThrough[i], flyThrough[i + 1], t); clearance = Math.min(clearance, distance(tp.x, tp.y, tp.z)); }
  const anchors = {
    portalSeat: { position: portalPos.clone(), normal: A.clone().negate(), direction: A.clone(), radius: 7 },
    flyThrough, straightStart: straightStart.clone(), approachDir: A.clone(), clearance,
    viewpoints: {
      entry: { position: V3(150, 6, 36), target: V3(40, 8, 4) }, shoulder: { position: V3(-2, 9, 36), target: V3(-24, 11, 2) },
      face: { position: faceCenter.clone().addScaledVector(faceNormal, 12).add(V3(6, -2, 14)), target: faceCenter.clone() },
      eye: { position: eyeC.clone().add(V3(4, 1, 15)), target: eyeC.clone() },
      elbow: { position: V3(elbow.x + 2, 13.5, elbow.z + 11), target: portalPos.clone() },
      approach: { position: portalPos.clone().addScaledVector(A, -42), target: portalPos.clone() },
      hero: { position: V3(-84, 10, 46), target: V3(-98, 9, 12) },
    },
    headCenter: V3(H.c[0], H.c[1], H.c[2]), faceCenter, faceNormal, closedEye: closedC, eyeHollow: eyeC.clone(), eyeHollowRadius: 2.6, lips: lips.clone(),
    crown: head.world(15, 0, 0), shoulderTop: V3(-26, 18.5, -1), foldedElbow: V3(-2, 12, 9), elbow: elbow.clone(), wrist: hand.wristStart.clone(),
    palmCenter: hand.world(0.8, 0, 0.5), palmNormal: N.clone(), fingerDir: F.clone(), thumbDir: S.clone(),
    fingertips: hand.tips.slice(0, 4).map((p) => p.clone()), thumbTip: hand.tips[4].clone(), feet: V3(106, 7, 6), surfaceY,
  };

  // ---- optional stand-ins for judging the piece alone: the 14 m portal and a water backdrop
  let dome = null;
  const preview = opts.preview === true;
  if (preview) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.2, 8, 72), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 3.4, 3.2), fog: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(6.9, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.5, 0.75), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    for (const m of [ring, disc]) { m.position.copy(portalPos); m.lookAt(portalPos.clone().addScaledVector(A, -1)); object.add(m); }
    U.uWater.value.w = opts.waterDensity ?? 0.003;
    dome = new THREE.Mesh(new THREE.SphereGeometry(2400, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uWater: U.uWater },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec4 uWater; varying vec3 vD; void main(){ float h = normalize(vD).y; vec3 c = mix(uWater.rgb, vec3(0.75, 1.25, 1.2), smoothstep(0.25, 1.0, h)); c = mix(c, uWater.rgb * vec3(0.35, 0.6, 1.0), smoothstep(0.02, -0.5, h)); gl_FragColor = vec4(c, 1.0); }' }));
    dome.renderOrder = -0.5; dome.frustumCulled = false; object.add(dome);
  }

  // ---- progress: everything that must coincide with the camera's arrival
  const faceU = opts.faceU ?? 0.4;
  let progress = -1;
  const setProgress = (u, raw) => {
    progress = clamp(u, 0, 1);
    if (fx.shoalU) fx.shoalU.uBurst.value = 0.5 + 0.8 * bell(progress, faceU - 0.16, faceU + 0.18, 0.45);   // the shoal pours out as the camera slides past the eye
    if (fx.bubU) fx.bubU.uExhale.value = bell(progress, faceU - 0.14, faceU + 0.12, 0.35);                   // and the lips let go a long breath
    if (fx.rayU) fx.rayU.uGain.value = (opts.rayGain ?? 0.2) * (0.7 + 0.9 * smoothstep(0.6, 0.92, progress)) * (raw === undefined ? 1 : smoothstep(0.55, 0.75, raw)); // shafts through the fingers brighten on approach
  };
  setProgress(opts.progress ?? faceU);
  const setLight = (l = {}) => {
    if (l.sunDir) U.uSunDir.value.copy(l.sunDir).normalize();
    if (l.sunColor) U.uSunCol.value.copy(l.sunColor);
    if (l.skyColor) U.uSkyCol.value.copy(l.skyColor);
    if (l.bounceColor) U.uBounceCol.value.copy(l.bounceColor);
    if (l.causticScale != null) U.uCaus.value.x = 1 / l.causticScale;
    if (l.causticStrength != null) U.uCaus.value.y = l.causticStrength;
    if (l.causticSpeed != null) U.uCaus.value.z = l.causticSpeed;
    if (l.waterColor) { U.uWater.value.x = l.waterColor.r; U.uWater.value.y = l.waterColor.g; U.uWater.value.z = l.waterColor.b; }
    if (l.waterDensity != null) U.uWater.value.w = l.waterDensity;
    if (l.glow != null) U2.uGlow.value = l.glow;
    if (l.surfaceY != null && fx.rayU) fx.rayU.uSurfaceY.value = l.surfaceY;
  };

  const center = V3(-62, 13, 8);  // above the head-and-hand group; with radius 62 the viewer's orbit just clears the legs
  return {
    object, radius: 62, height: 26, center, anchors, ground: false, groundY: 0,
    length: 228, bounds: new THREE.Box3(V3(-119, -1, -22), V3(110, 20.5, 28)),
    uniforms: U, setProgress, setLight, distance,
    sandHeightAt: (x, z) => heightAt(x, z), sandColor: sandCol, sandRect: [-132, -48, 129, 57],
    // shadeSand(fn): fn(x, z) -> 0..1 light left on the idol's own sand at that point (the world's props cast on it)
    shadeSand(fn) {
      if (!sandGeo) return;
      const P = sandGeo.attributes.position.array, L = sandGeo.attributes.aLit.array;
      for (let v = 0, n = P.length / 3; v < n; v++) { const s = fn(P[v * 3], P[v * 3 + 2]); if (s < 1) { L[v * 2] *= 0.5 + 0.5 * s; L[v * 2 + 1] *= s; } }
      sandGeo.attributes.aLit.needsUpdate = true;
    },
    seedInfo: { hollowEye: hollow, roll: H.roll / DEG, gold: goldAmt, curl: G.curl },
    triangles: Math.round(statueGeo.index.count / 3 + coralTris),
    update(dt, time, camera) {
      U.uTime.value = time;
      if (dome && camera) dome.position.copy(camera.position).applyMatrix4(_inv.copy(object.matrixWorld).invert());
    },
    dispose() {},
  };
}
const _inv = new THREE.Matrix4();
