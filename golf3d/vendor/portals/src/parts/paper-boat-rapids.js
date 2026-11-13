// Paper Boat Rapids: hero set piece "The Storm Drain".
//
// WHAT IT IS
//   The end of the gutter at insect scale. The channel widens into a basin, the water pours over a
//   cast-iron horseshoe rim as a three-sided cataract into a brick chamber, amber mist boils up out
//   of it, a 400-unit gas lamp stands directly behind on a kerb build-out, and in the chamber's back
//   wall a round brick culvert (radius 7) waits for the exit portal.
//
// UNITS / FRAME   1 unit = 1 cm of the real street (the brief's "world units"), so the piece is
//   used at scale 1 with the 14-unit portal. Origin = centre of the cataract lip at water level.
//   +Y up. FRONT = +Z = upstream: the boats and camera arrive from +Z travelling toward -Z.
//   Kerb + pavement are on -X (the boat's left), the cobbled road on +X.
//   Footprint: x -126..126, z -126..146. Lamp top y ~ 430. Chamber pool y = -45.
//   radius/height returned (110 / 150) frame the drain, not the whole lamp post.
//
// OPTS
//   palette     7 hex strings (brief order: night, slate-violet, slate, pale slate, amber, cream, red)
//   portalColor hex, light spilling out of the culvert onto the bricks (default warm cream-amber)
//   portalGlow  true: draw a glowing disc in the culvert mouth (stand-in for the portal; pass false
//               when the real portal is seated there)
//   mist        number of mist billboards (default 60)
//   lamp        false to omit the lamp post (its light on the water/bricks stays)
//   lampGain    multiplier on the lamp's brightness (1); the world lowers it for the pale dawn variation
//   apron       true (default): a plain dark wet street/pavement plane continues to 1500 units so the
//               piece stands alone. PASS apron:false when the world supplies its own street.
//
// ANCHORS (local space)
//   portalSeat  { position, facing, radius } culvert mouth; portal centre, facing +Z (toward camera)
//   flyThrough  ordered points: down the gutter 7 above the water, over the lip, a shallow dive
//               through the hollow of the horseshoe (>= 8 clear of the sheets, the hood and the
//               ring), level for the last stretch into the culvert
//   lip         centre of the cataract crest (where a boat tips)
//   gutterIn    where the world's gutter should join: centre of the channel at z=146, halfWidth 15
//   lampHead    flame position (use it for rain-needle lighting, lens discs, the street reflection)
//   lampBase, mistTop, viewpoints.{approach, brink, inside} = { from, at }
//   poolY, waterY, kerbTopY, roadY: reference heights
//   hero.waterHeight(x, z) and hero.flow(x, z, out) give the basin surface height and flow
//   direction/speed so boats ride the same water; hero.channelHalfWidth(z).
//
// PROGRESS   hero.setProgress(u) 0..1 (the world sets it from path u as the camera nears the lip):
//   swells the mist, brightens the culvert glow and quickens the cataract. Default 0.6.
//
// COST   about 86k triangles, 9 draw calls (one for all solids), no real-time lights, no textures.
//   Build ~200 ms with three yields.
//
// LIGHTING   Made for a dark slate dusk/night scene with fog. The amber lamp and the culvert light
//   are computed analytically in the shaders (with a fake shadow so lamp light only enters the
//   chamber through the horseshoe opening), so it needs no lights from the world; solids are
//   MeshStandardMaterial and also take the world's hemisphere/fill light. Keep that fill low and
//   cold (#56607A at ~0.2-0.4) or the amber stops reading.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1A2130', '#2A3152', '#56607A', '#9AA6BC', '#F2A53A', '#F5F1E6', '#E5432F'];

// ---- shared layout (mirrored in GLSL below) ----
const UR = 20, UCZ = -20, UZ1 = -46;          // horseshoe opening: radius, centre z, end of the arms
const POOL_Y = -45, ROAD_Y = 2.5, KERB_Y = 12, BED_Y = -3;
const LAMP = new THREE.Vector3(0, 388, -84);
const CUL = new THREE.Vector3(0, -20, -55);

function sdU(x, z) {
  if (z > UCZ) return Math.hypot(x, z - UCZ) - UR;
  return Math.max(Math.abs(x) - UR, UZ1 - z);
}
const chanHalf = (z) => 15 + 19 * (1 - smoothstep(18, 75, z));
const waterY = (x, z) => -0.7 * (1 - smoothstep(0, 12, sdU(x, z)));

function groundY(x, z) {
  if (z < -64) return x < 36 ? 11 : ROAD_Y;
  if (z < UZ1) return x < -36 ? 11 : (x > 36 ? ROAD_Y : BED_Y);
  const w = chanHalf(z);
  if (x < -w - 4) return 11;
  return BED_Y + (ROAD_Y - BED_Y) * smoothstep(w - 3, w + 5, x);
}

// horseshoe path: left arm, front semicircle, right arm. Returns {x,z,nx,nz (inward),s}
function uPath(n) {
  const arm = UCZ - UZ1, arc = Math.PI * UR, total = arm * 2 + arc, out = [];
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * total;
    let x, z, nx, nz;
    if (d < arm) { x = -UR; z = UZ1 + d; nx = 1; nz = 0; }
    else if (d < arm + arc) { const a = Math.PI - (d - arm) / UR; x = UR * Math.cos(a); z = UCZ + UR * Math.sin(a); nx = -Math.cos(a); nz = -Math.sin(a); }
    else { x = UR; z = UCZ - (d - arm - arc); nx = -1; nz = 0; }
    out.push({ x, z, nx, nz, s: i / n });
  }
  return out;
}

// ---- geometry helpers ----
// Box with a smooth one-segment bevel on every edge and corner (108 triangles).
function chamferBox(w, h, d, b) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3);
  const p = g.attributes.position, nr = g.attributes.normal, hx = w / 2, hy = h / 2, hz = d / 2;
  b = Math.min(b, hx * 0.9, hy * 0.9, hz * 0.9);
  const snap = (v, hh) => (Math.abs(v) > hh * 0.5 ? Math.sign(v) * hh : Math.sign(v) * (hh - b));
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(snap(p.getX(i), hx), snap(p.getY(i), hy), snap(p.getZ(i), hz));
    c.set(clamp(v.x, -hx + b, hx - b), clamp(v.y, -hy + b, hy - b), clamp(v.z, -hz + b, hz - b));
    v.sub(c);
    if (v.lengthSq() > 1e-9) { v.normalize(); nr.setXYZ(i, v.x, v.y, v.z); p.setXYZ(i, c.x + v.x * b, c.y + v.y * b, c.z + v.z * b); }
  }
  return g;
}

// Rounded-square cobble dome, unit footprint 1x1, height 1.
function domeGeo() {
  const g = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 1e-5) { const k = r / Math.pow(Math.pow(Math.abs(x), 4) + Math.pow(Math.abs(z), 4), 0.25); x *= k; z *= k; }
    p.setXYZ(i, x * 0.5, Math.pow(Math.max(y, 0), 0.55), z * 0.5);
  }
  g.computeVertexNormals();
  return g;
}

// Plane-tree leaf: five pointed lobes, flat fan with a little curl. Unit size ~1 across.
function leafGeo(rng, n = 40, RINGS = [0.5, 0.9, 1.0]) {
  // (repair 2, round 2) n outline points and the rings are the caller's: a leaf near the lens gets the full
  // outline, one stuck to the road far off a coarse one (the veins, the blotches and the rim are drawn by the
  // material, not by the mesh). rng is the leaf shapes' own stream: one draw for each outline point.
  const pts = [], lobes = 5, jit = [];
  for (let i = 0; i < n; i++) jit.push(rng());
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, t = ((a / (Math.PI * 2)) * lobes + 0.5) % 1;
    const lobe = Math.pow(Math.abs(Math.cos(t * Math.PI)), 0.7);
    const back = 0.55 + 0.45 * Math.cos(a - Math.PI / 2) * 0.5 + 0.2;
    const r = (0.2 + 0.32 * lobe + 0.05 * Math.sin(a * 17)) * back * (0.9 + 0.2 * jit[i]);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  // (repair 2) the blade is a mesh of rings from the stalk out to the outline (it was one flat fan), so it can
  // lie as a wet leaf lies: nearly flat on the water, a shallow dish, and two or three of its lobes curled up
  // at their tips. uv.x = how far out toward the edge (0 at the stalk, 1 on the outline), uv.y = how much the
  // tip there is curled up (0..1): the world draws the water's bright rim along the edge from these
  const P = [0, 0, 0], UV = [0, 0], idx = [], NR = RINGS.length;
  for (let i = 0; i < n; i++) {
    const q = pts[i], a = Math.atan2(q.y, q.x), lobe = Math.pow(Math.abs(Math.cos((((a / (Math.PI * 2) + 1) * lobes + 0.5) % 1) * Math.PI)), 0.7);
    const curl = Math.max(0, Math.sin(a * 1.5 + 0.9)) * lobe * lobe;      // which lobes lift, and only toward their tips
    for (let j = 0; j < NR; j++) {
      const f = RINGS[j], x = q.x * f, z = -q.y * f;
      P.push(x, 0.2 * (x * x + z * z) + 0.02 * Math.sin(x * 9 + z * 7) * f + 0.2 * curl * f * f * f - (j === NR - 1 ? 0.008 * (1 - curl) : 0), z);
      UV.push(f, curl);
    }
  }
  for (let i = 0; i < n; i++) {
    const a = 1 + i * NR, b = 1 + ((i + 1) % n) * NR;
    idx.push(0, a, b);
    for (let j = 0; j < NR - 1; j++) idx.push(a + j, a + j + 1, b + j, b + j, a + j + 1, b + j + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Accumulates many small geometries into one vertex-coloured mesh.
function makeAcc() {
  let cap = 300000, cnt0 = 0, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), R = new Float32Array(cap);
  const grow = () => { cap *= 2; const g = (a, k) => { const b = new Float32Array(cap * k); b.set(a); return b; }; P = g(P, 3); N = g(N, 3); C = g(C, 3); R = g(R, 1); };
  const put = (x, y, z, nx, ny, nz, r, g, b, ro) => {
    if (cnt0 >= cap) grow();
    const i = cnt0 * 3; P[i] = x; P[i + 1] = y; P[i + 2] = z; N[i] = nx; N[i + 1] = ny; N[i + 2] = nz; C[i] = r; C[i + 1] = g; C[i + 2] = b; R[cnt0++] = ro;
  };
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  const acc = {
    add(geo, m, col, rough, o = {}) {
      const pa = geo.attributes.position, na = geo.attributes.normal, idx = geo.index;
      nm.getNormalMatrix(m);
      const rev = (m.determinant() < 0) !== !!o.inside, cnt = idx ? idx.count : pa.count, fn = typeof col === 'function';
      const one = (i) => {
        const k = idx ? idx.getX(i) : i;
        v.fromBufferAttribute(pa, k).applyMatrix4(m);
        n.fromBufferAttribute(na, k).applyMatrix3(nm).normalize();
        if (o.inside) n.negate();
        const sh = o.shade ? o.shade(v.x, v.y, v.z) : 1, cc = fn ? col(v) : col;
        put(v.x, v.y, v.z, n.x, n.y, n.z, cc.r * sh, cc.g * sh, cc.b * sh, rough);
      };
      for (let t = 0; t < cnt; t += 3) { one(t); if (rev) { one(t + 2); one(t + 1); } else { one(t + 1); one(t + 2); } }
      if (o.double) acc.add(geo, m, col, rough, { shade: o.shade, inside: !o.inside });
    },
    quad(a, b, c, d, nrm, col, rough) {   // a,b,c,d counter-clockwise seen from the normal side
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
      const flip = (uy * wz - uz * wy) * nrm[0] + (uz * wx - ux * wz) * nrm[1] + (ux * wy - uy * wx) * nrm[2] < 0;
      for (const q of flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d]) put(q[0], q[1], q[2], nrm[0], nrm[1], nrm[2], col.r, col.g, col.b, rough);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, cnt0 * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, cnt0 * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, cnt0 * 3), 3));
      g.setAttribute('aRough', new THREE.BufferAttribute(R.slice(0, cnt0), 1));
      return g;
    },
  };
  return acc;
}

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
function trs(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return M4.compose(V1.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')), V2.set(sx, sy, sz)).clone();
}

// ---- GLSL shared by every material of the piece ----
const GLSL_COMMON = /* glsl */`
uniform vec3 uCamL; uniform vec3 uLampPos; uniform vec3 uLampCol; uniform vec3 uPortalPos; uniform vec3 uPortalCol;
uniform float uTime; uniform float uProg; uniform vec3 uShopP; uniform vec3 uShopC;      // (polish 2) the corner shop's window light, set by the world
// smoothstep that is also defined for reversed edges
float pbSq(float x){ return x * x; }
float pbSS(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float pbHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float pbNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(pbHash(i), pbHash(i+vec2(1,0)), f.x), mix(pbHash(i+vec2(0,1)), pbHash(i+vec2(1,1)), f.x), f.y); }
float pbFbm(vec2 p){ return 0.6*pbNoise(p) + 0.3*pbNoise(p*2.13+7.1) + 0.1*pbNoise(p*4.7+3.3); }
float pbSdU(vec2 p){ return p.y > -20.0 ? length(p - vec2(0.0,-20.0)) - 20.0 : max(abs(p.x) - 20.0, -46.0 - p.y); }
float pbChan(float z){ return 15.0 + 19.0 * (1.0 - pbSS(18.0, 75.0, z)); }
// lamp light reaching a point: distance falloff, and inside the chamber only what comes down through the horseshoe
float pbLampVis(vec3 p, vec3 L){
  float inPit = pbSS(-1.5, -5.0, p.y);
  vec3 q = p + L * ((-2.0 - p.y) / max(L.y, 0.05));
  float open = 1.0 - pbSS(-3.0, 2.5, pbSdU(q.xz));
  return mix(1.0, open, inPit);
}
float pbLampAtt(float d){ float k = d / 430.0; return 1.0 / (1.0 + k*k*k*k); }
`;

// Sweep a profile [[out, y], ...] along a horizontal path {x,z,nx,nz}; 'out' is measured away from (nx,nz).
function sweepGeo(path, prof) {
  const pos = [], idx = [], m = prof.length;
  for (const q of path) for (const [o, y] of prof) pos.push(q.x - q.nx * o, y, q.z - q.nz * o);
  for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < m - 1; j++) {
    const a = i * m + j, b = a + m;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // orient: the first profile segment is the inner face and must look along +(nx,nz)
  const A = new THREE.Vector3(pos[0], pos[1], pos[2]), B = new THREE.Vector3(pos[m * 3], pos[m * 3 + 1], pos[m * 3 + 2]), C = new THREE.Vector3(pos[3], pos[4], pos[5]);
  const fn = B.sub(A).cross(C.sub(A));
  if (fn.x * path[0].nx + fn.z * path[0].nz < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Bend a box (x = tangential, y = radial, z = depth) round the culvert axis.
function bendToRing(g, rmid, ang, zc) {
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const a = ang + p.getX(i) / rmid, r = rmid + p.getY(i), sa = Math.sin(a), ca = Math.cos(a);
    const nx = n.getX(i), ny = n.getY(i);
    p.setXYZ(i, CUL.x + r * sa, CUL.y + r * ca, zc + p.getZ(i));
    n.setXYZ(i, nx * ca + ny * sa, -nx * sa + ny * ca, n.getZ(i));
  }
  return g;
}

async function buildStreet(acc, rng, noise, col, pause, leafRng) {      // pause(): hand a frame back (the rng here is this function's own fork; leafRng is the plastered leaves' shapes' own stream)
  const I = new THREE.Matrix4(), tmp = new THREE.Color();
  // --- base: gutter bed, joints and the dirt under everything, with the horseshoe cut out ---
  const X0 = -126, Z0 = -126, CS = 4, NX = 63, NZ = 68, pos = [], idx = [];
  await pause();
  for (let j = 0; j <= NZ; j++) { if (j % 23 === 22) await pause(); for (let i = 0; i <= NX; i++) {
    const x = X0 + i * CS, z = Z0 + j * CS;
    pos.push(x, groundY(x, z) + noise.n2(x * 0.09, z * 0.09) * 0.35, z);
  } }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const cx = X0 + (i + 0.5) * CS, cz = Z0 + (j + 0.5) * CS;
    if (sdU(cx, cz) < 2.0) continue;
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  await pause();
  const base = new THREE.BufferGeometry();
  base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setIndex(idx);
  await pause();
  base.computeVertexNormals();
  await pause();
  // the base goes in as four runs of the same triangles in the same order, a frame handed back between them
  // (as one call it held the page 53 to 71 ms on a busy machine)
  const baseCol = (v) => {
    const m = smoothstep(-0.15, 0.45, noise.fbm2(v.x * 0.035, v.z * 0.035, 3)) * (v.y > 0 ? 1 : 0.35);
    return tmp.copy(col.dirt).lerp(col.moss, m * col.mossAmt);
  };
  for (let k = 0, per = Math.ceil(idx.length / 12) * 3; k < idx.length; k += per) {
    const run = new THREE.BufferGeometry();
    run.setAttribute('position', base.attributes.position); run.setAttribute('normal', base.attributes.normal); run.setIndex(idx.slice(k, k + per));
    acc.add(run, I, baseCol, 0.75);
    await pause();
  }
  // chamber ceiling (underside of the basin slab)
  for (let x = -36; x < 36; x += 2) for (let z = -56; z < 8; z += 2) {
    if (sdU(x + 1, z + 1) < 1.0) continue;
    acc.quad([x, -6, z], [x + 2, -6, z], [x + 2, -6, z + 2], [x, -6, z + 2], [0, -1, 0], col.mortar, 0.7);
  }
  // --- apron: plain wet street running on to the horizon (opts.apron) ---
  if (col.apron) {
    const A = 1500, ra = col.dirt.clone().multiplyScalar(1.5), pa = col.flag.clone().multiplyScalar(0.8), up = [0, 1, 0];
    acc.quad([126, 2.4, -A], [126, 2.4, A], [A, 2.4, A], [A, 2.4, -A], up, ra, 0.4);
    acc.quad([-36 + 72, 2.4, 146], [36, 2.4, A], [126, 2.4, A], [126, 2.4, 146], up, ra, 0.4);
    acc.quad([36, 2.4, -A], [36, 2.4, -126], [126, 2.4, -126], [126, 2.4, -A], up, ra, 0.4);
    acc.quad([-15, 0.0, 146], [-15, 0.0, A], [36, 0.0, A], [36, 0.0, 146], up, col.dirt, 0.2);
    acc.quad([-A, 11.6, -A], [-A, 11.6, A], [-126, 11.6, A], [-126, 11.6, -A], up, pa, 0.45);
    acc.quad([-126, 11.6, 146], [-126, 11.6, A], [-15, 11.6, A], [-15, 11.6, 146], up, pa, 0.45);
    acc.quad([-126, 11.6, -A], [-126, 11.6, -126], [36, 11.6, -126], [36, 11.6, -A], up, pa, 0.45);
    acc.quad([-15, 11.6, 146], [-15, 11.6, A], [-15, -3, A], [-15, -3, 146], [1, 0, 0], pa, 0.45);
    acc.quad([36, 11.6, -126], [36, 11.6, -A], [36, 2.4, -A], [36, 2.4, -126], [1, 0, 0], pa, 0.45);
  }
  await pause();
  // --- cobbles ---
  const dome = domeGeo(), P = 10.6;
  for (let r = 0, z = -122; z < 146; z += P, r++) { if (r % 4 === 0) await pause(); for (let x = 12 + (r % 2) * P * 0.5; x < 124; x += P) {
    const jx = x + rng.range(-0.5, 0.5), jz = z + rng.range(-0.5, 0.5);
    if (jz < UZ1 ? jx < 42 : jx < chanHalf(jz) + 1.5) continue;
    const gy = groundY(jx, jz), s = rng.range(9.0, 10.1), t = rng();
    tmp.copy(col.cobble).lerp(t < 0.5 ? col.violet : col.pale, rng.range(0.0, 0.28)).multiplyScalar(rng.range(0.75, 1.15));
    acc.add(dome, trs(jx, gy - 1.3, jz, rng.range(-0.05, 0.05), rng.range(-0.12, 0.12), rng.range(-0.05, 0.05), s, rng.range(3.0, 3.6), s * rng.range(0.94, 1.04)), tmp.clone(), rng.range(0.28, 0.5));
  } }
  await pause();
  // --- granite kerb along the left bank, and the kerb return behind the hood ---
  const kerb = (x, z, ry, len, dep) => {
    tmp.copy(col.granite).multiplyScalar(rng.range(0.82, 1.15));
    acc.add(chamferBox(len, 15.6, dep, 1.3), trs(x, KERB_Y - 7.8 + rng.range(-0.25, 0.1), z, rng.range(-0.012, 0.012), ry, rng.range(-0.01, 0.01)), tmp.clone(), 2 + rng.range(0.4, 0.6),      // (polish 3) 2.x: wet speckled granite
      { shade: (px, py) => 0.72 + 0.28 * smoothstep(-1, 6, py) });   // damp tide line near the water
  };
  for (let z = 146; z > UZ1 + 4;) {
    const len = Math.min(rng.range(34, 50), z - UZ1 + 1), zc = z - len / 2;
    const w0 = chanHalf(z), w1 = chanHalf(z - len), ry = Math.atan2(w1 - w0, len);
    kerb(-(w0 + w1) / 2 - 6.4, zc, Math.PI / 2 + ry, len - 0.9, 12);
    z -= len;
  }
  for (let z = -64.5; z > -126;) { const len = Math.min(rng.range(30, 44), z + 127); kerb(30, z - len / 2, Math.PI / 2, len - 0.9, 12); z -= len; }
  await pause();
  // --- pavement flags ---
  const slab = (x0, x1, z0, z1) => {
    tmp.copy(col.flag).lerp(col.pale, rng.range(0, 0.2)).multiplyScalar(rng.range(0.8, 1.12));
    acc.add(chamferBox(x1 - x0 - 0.9, 2.2, z1 - z0 - 0.9, 0.5), trs((x0 + x1) / 2, KERB_Y - 1.1 + rng.range(-0.25, 0.12), (z0 + z1) / 2, rng.range(-0.006, 0.006), 0, rng.range(-0.006, 0.006)), tmp.clone(), rng.range(0.3, 0.55));
  };
  for (let z = -126; z < 146; z += 34) {
    const z1 = Math.min(z + 34, 146);
    let xr;
    if (z1 <= -64) xr = 24; else if (z < UZ1) xr = -37.5; else xr = -Math.max(chanHalf(z), chanHalf(z1)) - 12.6;
    if (z < -64 && z1 > -64) { slabRow(z, -64, 24); slabRow(-64, z1, -37.5); } else slabRow(z, z1, xr);
  }
  function slabRow(z0, z1, xr) { for (let x = xr; x > -126;) { const w = Math.min(rng.range(26, 44), x + 126.5); if (w > 4) slab(x - w, x, z0, z1); x -= w; } }
  // --- fallen plane leaves plastered on the wet stone ---
  const nLeaf = rng.int(4, 9);
  for (let i = 0; i < nLeaf; i++) {
    const onRoad = rng.chance(0.6), x = onRoad ? rng.range(46, 110) : rng.range(-110, -52), z = rng.range(-110, 130), s = rng.range(13, 19);
    tmp.copy(col.leaf).multiplyScalar(rng.range(0.7, 1.2));
    acc.add(leafGeo(leafRng, 20, [0.88, 1.0]), trs(x, onRoad ? ROAD_Y + 2.15 : KERB_Y + 0.25, z, rng.range(-0.08, 0.08), rng.range(0, 6.28), rng.range(-0.08, 0.08), s, s * 0.5, s), tmp.clone(), 0.42, { double: true });
  }
  tmp.copy(col.leaf).multiplyScalar(1.1);
  acc.add(leafGeo(leafRng, 20, [0.88, 1.0]), trs(rng.range(-26, 26), KERB_Y + 0.3, -57, 0.03, rng.range(0, 6.28), 0.05, 16, 8, 16), tmp.clone(), 0.4, { double: true });
}

async function buildChamber(acc, rng, col, pause) {      // pause(): hand a frame back (as one stretch this ran 30 to 60 ms on a busy machine)
  const I = new THREE.Matrix4(), tmp = new THREE.Color();
  // cast-iron horseshoe rim: inner skirt, bull-nosed crest, outer edge let into the bed
  acc.add(sweepGeo(uPath(72), [[-0.7, -7.6], [-0.7, -2.4], [-0.25, -1.75], [0.6, -1.45], [4.6, -1.45], [5.3, -1.95], [5.3, -3.6]]), I, col.iron, 0.3);
  // brick walls, one bevelled brick at a time
  const BL = 14, BH = 4.5, BD = 7, PX = 14.7, PY = 5.2, cache = new Map();
  const brickGeo = (len) => { const k = Math.round(len * 4); if (!cache.has(k)) cache.set(k, chamferBox(k / 4, BH, BD, 0.55)); return cache.get(k); };
  const wall = (x0, z0, x1, z1, inx, inz, isBack) => {
    const L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L, ry = Math.atan2(-dz, dx);
    for (let c = 1; c < 9; c++) {
      const yc = -52.8 + PY * (c + 0.5);
      for (let d = -((c % 2) * PX) / 2; d < L; d += PX) {
        const a = Math.max(d, 0), b = Math.min(d + BL, L), len = b - a;
        if (len < 2.5 || rng.chance(0.025)) continue;
        const mid = (a + b) / 2, bx = x0 + dx * mid, bz = z0 + dz * mid;
        if (isBack) {
          const qx = clamp(CUL.x, bx - len / 2, bx + len / 2), qy = clamp(CUL.y, yc - BH / 2, yc + BH / 2);
          if (Math.hypot(qx - CUL.x, qy - CUL.y) < 15.7) continue;
        }
        const proud = rng.chance(0.07) ? rng.range(0.8, 1.6) : rng.range(-0.35, 0.35);
        tmp.copy(col.brick).lerp(col.brick2, rng()).multiplyScalar(rng.range(0.7, 1.2));
        if (rng.chance(0.12)) tmp.lerp(col.moss, 0.5);
        acc.add(brickGeo(len), trs(bx - inx * (BD / 2 - proud), yc + rng.range(-0.15, 0.15), bz - inz * (BD / 2 - proud), rng.range(-0.015, 0.015), ry + rng.range(-0.012, 0.012), rng.range(-0.012, 0.012)), tmp.clone(), rng.range(0.22, 0.5));
      }
    }
  };
  await pause();
  wall(-35, -55, 35, -55, 0, 1, true);
  await pause();
  wall(35, -55, 35, 6, -1, 0, false);
  await pause();
  wall(35, 6, -35, 6, 0, -1, false);
  await pause();
  wall(-35, 6, -35, -55, 1, 0, false);
  await pause();
  // recessed mortar behind the bricks
  acc.quad([35.9, -53, -55], [35.9, -53, 6], [35.9, -6, 6], [35.9, -6, -55], [-1, 0, 0], col.mortar, 0.8);
  acc.quad([-35.9, -53, -55], [-35.9, -53, 6], [-35.9, -6, 6], [-35.9, -6, -55], [1, 0, 0], col.mortar, 0.8);
  acc.quad([-36, -53, 6.9], [36, -53, 6.9], [36, -6, 6.9], [-36, -6, 6.9], [0, 0, -1], col.mortar, 0.8);
  for (let x = -36; x < 36; x += 3) for (let y = -54; y < -6; y += 3) {
    if (Math.hypot(x + 1.5 - CUL.x, y + 1.5 - CUL.y) < 9.5) continue;
    acc.quad([x, y, -55.7], [x + 3, y, -55.7], [x + 3, y + 3, -55.7], [x, y + 3, -55.7], [0, 0, 1], col.mortar, 0.8);
  }
  // culvert: two rings of voussoirs standing proud of the wall, then the barrel behind
  const ring = (n, r0, r1, front, a0) => {
    const rmid = (r0 + r1) / 2, tang = (Math.PI * 2 * rmid) / n - 0.55;
    for (let i = 0; i < n; i++) {
      tmp.copy(col.brick2).lerp(col.pale, rng.range(0.05, 0.3)).multiplyScalar(rng.range(0.8, 1.25));
      const g = bendToRing(chamferBox(tang, r1 - r0, 8, 0.5), rmid, a0 + (i / n) * Math.PI * 2, front - 4 + rng.range(-0.3, 0.3));
      acc.add(g, I, tmp.clone(), rng.range(0.16, 0.3));
    }
  };
  await pause();
  ring(14, 7.1, 11.3, -53.3, rng.range(0, 0.4));
  ring(18, 11.8, 15.4, -54.2, rng.range(0, 0.3));
  await pause();
  const barrel = new THREE.CylinderGeometry(7.15, 7.15, 40, 28, 8, true);
  acc.add(barrel, trs(0, CUL.y, -76, Math.PI / 2, 0, 0), (v) => {
    const h = Math.sin(Math.floor(v.z / 5) * 12.9898 + Math.floor(Math.atan2(v.y - CUL.y, v.x) * 2.2) * 78.233) * 43758.5453;
    return tmp.copy(col.brick).multiplyScalar(0.6 + 0.5 * (h - Math.floor(h)));
  }, 0.3, { inside: true });
  // step irons in the back wall beside the culvert
  const side = rng.chance(0.5) ? 1 : -1, iron = new THREE.TorusGeometry(3.4, 0.55, 6, 12, Math.PI), mb = new THREE.Matrix4();
  for (let i = 0; i < 5; i++) {
    mb.makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)).setPosition(side * 26, -10.5 - i * 7.6, -55.2);
    acc.add(iron, mb, col.rust, 0.35);
  }
  return side;
}

function buildHood(acc, rng, col) {
  const tmp = new THREE.Color(), dome = domeGeo();
  const ir = () => tmp.copy(col.iron).lerp(col.rust, rng.range(0, 0.35)).multiplyScalar(rng.range(0.85, 1.2)).clone();
  acc.add(chamferBox(75, 4.2, 21, 1.1), trs(0, 9.9, -56.2), ir(), 0.3);            // top plate
  acc.add(chamferBox(73, 15.8, 2.6, 0.7), trs(0, 0.3, -47.1), ir(), 0.28);          // fascia facing the basin
  acc.add(chamferBox(72, 14, 9.5, 0.8), trs(0, 1, -61), ir(), 0.4);                 // body behind the wall
  for (const s of [-1, 1]) acc.add(chamferBox(3.4, 17.5, 21, 0.9), trs(s * 36.6, 3.4, -56.2), ir(), 0.32);
  // ribs, maker's plaque with raised bars for lettering, bolts
  const nR = rng.int(4, 7);
  for (const s of [-1, 1]) for (let i = 0; i < nR; i++) {
    const x = s * (14.5 + (i + 0.5) * (19.5 / nR));
    acc.add(chamferBox(1.7, 12.5, 1.5, 0.45), trs(x, 1.6, -45.5), ir(), 0.26);
  }
  acc.add(chamferBox(23, 7.4, 1.3, 0.45), trs(0, 3.9, -45.6), ir(), 0.24);
  const nB = rng.int(2, 3);
  for (let i = 0; i < nB; i++) acc.add(chamferBox(rng.range(11, 18), 0.9, 0.7, 0.25), trs(rng.range(-1.5, 1.5), 2.2 + i * (3.4 / Math.max(nB - 1, 1)), -44.85), ir(), 0.2);
  for (const sx of [-1, 1]) for (const sy of [0, 1]) acc.add(dome, trs(sx * 10.2, 1.3 + sy * 5.2, -45.0, Math.PI / 2, 0, 0, 1.3, 0.7, 1.3), ir(), 0.2);
  // tread bars and bolts on the top plate
  for (let r = 0; r < 3; r++) for (let i = 0; i < 13; i++) {
    const x = -30 + i * 5 + (r % 2) * 2.5;
    acc.add(chamferBox(3.6, 0.7, 0.9, 0.25), trs(x, 12.2, -50.5 - r * 4.6, 0, (r % 2 ? 1 : -1) * 0.6, 0), ir(), 0.25);
  }
  for (const sx of [-1, 1]) for (const z of [-48.5, -64]) acc.add(dome, trs(sx * 34, 12.0, z, 0, 0, 0, 2.2, 1.0, 2.2), ir(), 0.2);
}

function buildLamp(acc, rng, col, sides) {
  const tmp = new THREE.Color(), bx = LAMP.x, bz = LAMP.z, y0 = KERB_Y;
  const ir = () => tmp.copy(col.iron).lerp(col.rust, rng.range(0, 0.2)).multiplyScalar(rng.range(0.9, 1.15)).clone();
  const cyl = (rt, rb, h, seg, y, o) => acc.add(new THREE.CylinderGeometry(rt, rb, h, seg, 1), trs(bx, y + h / 2, bz, 0, o || 0, 0), ir(), 0.3);
  const tor = (r, t, y) => acc.add(new THREE.TorusGeometry(r, t, 8, 20), trs(bx, y, bz, Math.PI / 2, 0, 0), ir(), 0.25);
  cyl(16.5, 18.5, 2.5, 8, y0 - 0.5, Math.PI / 8); cyl(15, 16.5, 8, 8, y0 + 2, Math.PI / 8); tor(14.2, 1.3, y0 + 10.4);
  cyl(11, 13.2, 13, 8, y0 + 10, Math.PI / 8); tor(11, 1.7, y0 + 23.5);
  cyl(7.6, 9.6, 40, 16, y0 + 23); tor(8, 1.5, y0 + 63.5); tor(7.2, 0.9, y0 + 67);
  // fluted, tapering shaft
  const H = 283, sh = new THREE.CylinderGeometry(4.3, 7, H, 32, 14, true), p = sh.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 - 0.075 * Math.pow(Math.abs(Math.cos(a * 4)), 0.6);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  sh.computeVertexNormals();
  acc.add(sh, trs(bx, y0 + 63 + H / 2, bz), ir(), 0.3);
  tor(6.2, 0.9, y0 + 140); tor(5.3, 1.1, y0 + 296); tor(5.0, 0.7, y0 + 300);
  // ladder rest
  acc.add(chamferBox(46, 2.2, 2.2, 0.7), trs(bx, y0 + 312, bz), ir(), 0.3);
  for (const s of [-1, 1]) acc.add(new THREE.SphereGeometry(2.3, 10, 8), trs(bx + s * 23.5, y0 + 312, bz), ir(), 0.25);
  // capital and lantern frame
  const yc = y0 + 346, rot = Math.PI / sides;
  cyl(9, 4.3, 10, 16, yc); tor(9, 1.0, yc + 10); cyl(10.5, 10.5, 2.6, sides, yc + 10.5, rot);
  const yb = yc + 13, yt = yb + 30, rb = 9, rt = 15.5;
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    const len = Math.hypot(yt - yb, rt - rb), tilt = Math.atan2(rt - rb, yt - yb);
    const m = new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeTranslation(0, (yb + yt) / 2, (rb + rt) / 2)).multiply(new THREE.Matrix4().makeRotationX(tilt));
    m.premultiply(new THREE.Matrix4().makeTranslation(bx, 0, bz));
    acc.add(chamferBox(1.3, len, 1.3, 0.35), m, ir(), 0.3);
    void s; void c;
  }
  cyl(17.5, 16.5, 1.8, sides, yt, rot);
  acc.add(new THREE.ConeGeometry(17.5, 14, sides, 1), trs(bx, yt + 1.8 + 7, bz, 0, rot, 0), ir(), 0.3);
  cyl(3.5, 5.5, 3, 10, yt + 14.5);
  acc.add(new THREE.SphereGeometry(2.8, 12, 8), trs(bx, yt + 19.5, bz), ir(), 0.22);
  acc.add(new THREE.ConeGeometry(1.1, 9, 8, 1), trs(bx, yt + 26, bz), ir(), 0.25);
  return { yb, yt, rb, rt, rot };
}

// Wet stone / iron: MeshStandardMaterial plus mottling, wetness and the analytic amber lamp + culvert light.
function makeSolidMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRough; varying float vRough; varying vec3 vLp; varying vec3 vLn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position; vLn = normal; vRough = aRough;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRough; varying vec3 vLp; varying vec3 vLn; uniform vec3 uSkyHi;\n' + GLSL_COMMON)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float pbM = pbFbm(vLp.xz * 0.9 + vLp.y * 0.7) ;
        float pbG = pbNoise(vLp.xz * 6.0 + vLp.yy * 5.0);
        diffuseColor.rgb *= (0.72 + 0.5 * pbM) * (0.9 + 0.2 * pbG);
        // (polish 3) kerb stones (aRough 2..3): speckled granite, drip streaks down the face, a rain-glazed top
        float pbStone = step(1.5, vRough), pbRr = vRough - 2.0 * pbStone; vec3 pbThrown = vec3(0.0);
        if (pbStone > 0.5) {
          vec3 pbSn = normalize(vLn);
          float pf1 = pbNoise(vLp.xz * 7.0 + vLp.y * 5.3), pf2 = pbNoise(vLp.zx * 13.0 - vLp.y * 9.1 + 31.0), pmt = pbFbm(vLp.xz * 0.22 + vLp.y * 0.31);
          float pface = 1.0 - smoothstep(0.3, 0.7, abs(pbSn.y)), pal = vLp.z + vLp.x * 0.35;
          float pdrip = pbSS(0.56, 0.8, pbNoise(vec2(pal * 0.5, 2.7))) * pbSS(0.2, 0.6, pbNoise(vec2(pal * 0.5 + 40.0, vLp.y * 0.1))) * pface;
          diffuseColor.rgb *= (0.7 + 0.62 * pmt) * (1.0 - 0.55 * pbSS(0.64, 0.8, pf1)) * (1.0 + 1.1 * pbSS(0.68, 0.86, pf2));
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.42, 0.45, 0.55), pdrip * 0.85);
          pbRr *= mix(1.0, 0.25, max(pdrip, (1.0 - pface) * (0.5 + 0.5 * pmt)));
          // (repair 2) the same kerb as up the street: the basin's lit water throws a slow rippling net of lamp
          // light up the face (strongest at the waterline), the tooled face has a darker soaked foot, and the
          // rounded arris along the top carries a wet amber line; so the kerb is never one dark tone
          float phw = vLp.y, ptool = pbFbm(vec2(pal * 1.3, vLp.y * 0.7 + 9.0));
          float pn1 = pbNoise(vec2(pal * 0.42 + uTime * 0.45, vLp.y * 0.5 - uTime * 0.3)), pn2 = pbNoise(vec2(pal * 0.3 - uTime * 0.35 + 17.0, vLp.y * 0.36 + uTime * 0.2));
          float pnet = pbSS(0.1, 0.0, abs(pn1 - pn2)) + 0.4 * pbSS(0.07, 0.0, abs(pn1 + pn2 - 1.0));
          float preach = pface * pbSS(10.0, 0.4, phw) * pbSS(-0.6, 0.6, phw);
          diffuseColor.rgb *= (0.88 + 0.24 * ptool) * mix(1.0, 0.62, pface * pbSS(2.6, 0.2, phw + 1.2 * (pmt - 0.5)));
          pbThrown = uLampCol * pbLampAtt(distance(uLampPos, vLp)) * (diffuseColor.rgb * preach * (0.5 + 0.8 * pnet * preach)
            + 0.42 * pbSS(0.3, 0.55, pbSn.y) * pbSS(0.97, 0.8, pbSn.y) * pbSS(-1.0, 1.0, phw) * (0.5 + 0.8 * pf2));
        }`)
      .replace('#include <roughnessmap_fragment>', /* glsl */`#include <roughnessmap_fragment>
        roughnessFactor = clamp(pbRr * (0.6 + 0.9 * pbM), 0.08, 1.0);`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          vec3 pN = normalize(vLn); vec3 pV = normalize(uCamL - vLp);
          float pR = clamp(pbRr * (0.6 + 0.9 * pbM), 0.08, 1.0);
          float pSp = mix(260.0, 10.0, sqrt(pR)); float pSk = (1.0 - pR) * (1.0 - pR) * 3.2;
          vec3 pAcc = vec3(0.0);
          // street lamp
          vec3 pL = uLampPos - vLp; float pd = length(pL); pL /= pd;
          float pvis = pbLampVis(vLp, pL) * pbLampAtt(pd);
          float pnl = max(dot(pN, pL), 0.0);
          vec3 pH = normalize(pL + pV);
          pAcc += uLampCol * pvis * (diffuseColor.rgb * pnl + pow(max(dot(pN, pH), 0.0), pSp) * pSk * step(0.0, pnl));
          // light spilling from the culvert, and amber bounce off the mist inside the chamber
          vec3 pP = uPortalPos - vLp; float pq = length(pP); pP /= pq;
          float patt = 1.0 / (1.0 + pq * pq / 240.0) * pbSS(1.0, -4.0, vLp.y);
          float pnp = max(dot(pN, pP) * 0.75 + 0.25, 0.0);
          vec3 pH2 = normalize(pP + pV);
          pAcc += uPortalCol * patt * (diffuseColor.rgb * pnp + pow(max(dot(pN, pH2), 0.0), pSp) * pSk * 0.8);
          float pit = pbSS(-3.0, -9.0, vLp.y);
          float pIn = pbSS(24.0, 4.0, uCamL.z) * pbSS(12.0, 5.5, uCamL.y);
          pAcc += uLampCol * diffuseColor.rgb * pit * (0.02 + 0.05 * pbSS(-48.0, -8.0, vLp.y)) * (0.8 + 0.4 * pbNoise(vLp.xy * 0.2 + uTime * 0.25)) * (1.0 - 0.6 * pIn);
          pAcc += uSkyHi * diffuseColor.rgb * pit * pIn * 0.55;
          // (repair 3) the mouth glows: the lit steam in the shaft throws its amber up onto the wet iron and stone
          // that stand round the opening (the hood's fascia and ribs, the rim, the kerb's return, the lamp's foot)
          vec3 pG = vec3(0.0, -5.0, -22.0) - vLp; float pgd = length(pG); pG /= pgd;
          float pgl = pbSS(-9.0, -2.5, vLp.y) / (1.0 + pgd * pgd / 1100.0) * (0.85 + 0.3 * pbNoise(vec2(vLp.x * 0.15 + uTime * 0.3, vLp.y * 0.2 - uTime * 0.5)));
          pAcc += (uPortalCol * 0.3 + uLampCol * 0.34) * pgl * (diffuseColor.rgb + 0.03 * (1.0 - pR)) * max(dot(pN, pG) * 0.75 + 0.25, 0.0) * 1.6;
          // (repair 3) the lamp's amber pooled on the wet road and the flags round its foot: a wet stone gives back a
          // broad soft share of the lamp over it, not only the one glint
          float pPool = exp(-(pbSq(vLp.x - 10.0) + pbSq(vLp.z + 70.0)) / 22500.0) * pbSS(0.45, 0.85, pN.y) * pbSS(-1.0, 1.5, vLp.y);
          pAcc += uLampCol * pPool * 0.05 * (1.0 - pR) * (0.5 + pbM);
          // the corner shop's window, up the street on the pavement side (zero unless the world sets it)
          vec3 pS = uShopP - vLp; float psd = length(pS); pS /= max(psd, 1e-3);
          float psk = psd / 300.0, psn = max(dot(pN, pS), 0.0);
          pAcc += uShopC / (1.0 + psk * psk * psk * psk) * pbSS(-4.0, 1.0, vLp.y) * (diffuseColor.rgb * psn + pow(max(dot(pN, normalize(pS + pV)), 0.0), pSp) * pSk * step(0.0, psn));
          totalEmissiveRadiance += pAcc + pbThrown;
        }`);
  };
  return mat;
}

const FOG_V = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_F = '#include <common>\n#include <fog_pars_fragment>\n';

const WATER_VERT = FOG_V + GLSL_COMMON + /* glsl */`
varying vec3 vLp;
void main(){
  vec3 p = position; float sd = pbSdU(p.xz);
  float near = 1.0 - pbSS(0.0, 12.0, sd);
  p.y = -0.7 * near + sin(sd * 1.1 - uTime * 5.0) * 0.13 * near * pbSS(-1.0, 3.0, sd)
      + (pbNoise(p.xz * 0.11 + vec2(0.0, uTime * 0.9)) - 0.5) * 0.55 * (1.0 - near);
  vLp = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WATER_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
uniform vec3 uSkyLo; uniform vec3 uSkyHi; uniform vec3 uDeep; uniform vec3 uCream;
uniform vec3 uHull[3]; uniform vec3 uHullD[3];      // (polish 3) floating hulls: (x, z, half width), (cos yaw, -sin yaw, width / length)
uniform float uSwirl;
varying vec3 vLp;
vec2 pbFlow(vec2 p, float sd, out float spd){
  vec2 e = vec2(0.6, 0.0);
  vec2 g = normalize(vec2(pbSdU(p + e.xy) - pbSdU(p - e.xy), pbSdU(p + e.yx) - pbSdU(p - e.yx)) + 1e-4);
  float k = 1.0 - pbSS(3.0, 42.0, sd);
  spd = 10.0 + 24.0 * (1.0 - pbSS(0.0, 30.0, sd));
  // (repair 3) the water does not run straight at the rim: it turns as it is drawn in (which way round is the seed's)
  return normalize(mix(vec2(0.0, -1.0), -g + uSwirl * 0.8 * vec2(-g.y, g.x), k));
}
float pbRings(vec2 p){
  vec2 c = floor(p / 15.0), f = p / 15.0 - c;
  float h = pbHash(c), t = fract(uTime * 0.6 + h);
  vec2 o = vec2(pbHash(c + 3.1), pbHash(c + 7.7)) * 0.5 + 0.25;
  float d = length(f - o) * 15.0, r = t * 6.5;
  return sin((d - r) * 2.4) * exp(-abs(d - r) * 0.9) * (1.0 - t) * (1.0 - t);
}
float pbH(vec2 p, vec2 f, float spd){
  float t = uTime * 0.8, a = fract(t), b = fract(t + 0.5), w = abs(1.0 - 2.0 * a);
  vec2 q1 = p - f * spd * (a - 0.5) * 1.25, q2 = p - f * spd * (b - 0.5) * 1.25 + 17.3;
  float h1 = pbFbm(q1 * 0.2) + 0.35 * pbNoise(q1 * 0.75);
  float h2 = pbFbm(q2 * 0.2) + 0.35 * pbNoise(q2 * 0.75);
  return mix(h1, h2, w) + 0.3 * pbRings(p);
}
void main(){
  vec2 p = vLp.xz; float sd = pbSdU(p);
  if (sd < -0.35) discard;
  float spd; vec2 f = pbFlow(p, sd, spd);
  float e = 0.35, h0 = pbH(p, f, spd);
  float near = 1.0 - pbSS(0.0, 14.0, sd);
  float str = 0.75 + 1.1 * near;
  vec3 N = normalize(vec3(-(pbH(p + vec2(e, 0.0), f, spd) - h0) / e * str, 1.0, -(pbH(p + vec2(0.0, e), f, spd) - h0) / e * str));
  // surface tension: the water bulges up against kerb and cobbles
  float edge = pbChan(p.y) - abs(p.x);
  float men = pbSS(2.2, 0.2, edge) * step(-46.0, p.y);
  N = normalize(N + vec3(sign(p.x) * men * 0.9, 0.0, 0.0));
  vec3 V = normalize(uCamL - vLp);
  float fr = 0.035 + 0.965 * pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 5.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 col = mix(uDeep * (0.55 + 0.5 * h0), mix(uSkyLo, uSkyHi, clamp(R.y * 1.3, 0.0, 1.0)), fr);
  // the lamp: one broken golden ribbon laid along the water toward the viewer, plus hard glints
  vec3 Lv = uLampPos - vLp; float ld = length(Lv); vec3 L = Lv / ld;
  vec3 az = normalize(vec3(L.x, 0.0, L.z)), lat = vec3(az.z, 0.0, -az.x);
  float dl = dot(R, lat) - dot(L, lat), dv = R.y - L.y;
  float ribbon = exp(-dl * dl * 190.0) * exp(-dv * dv * 1.3) * step(0.0, dot(R, az));
  float glint = pow(max(dot(R, L), 0.0), 220.0);
  // (polish 3) a hull stands in front of the ribbon: dark water round it and a bright meniscus line,
  // so a boat on the gold is a solid thing and not a ghost in the glare
  float occ = 1.0, hring = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 hv = vLp.xz - uHull[i].xy;
    float hr = length(vec2(dot(hv, uHullD[i].xy) * uHullD[i].z, dot(hv, vec2(-uHullD[i].y, uHullD[i].x)))) + 1e-3;
    occ *= 1.0 - 0.8 * pbSS(uHull[i].z * 2.2, uHull[i].z * 1.2, hr);      // (repair 3) a hull darkens the water close round it and no further (it was three and a half hull lengths: from close astern the whole ribbon between the lens and the lip lay in the boats' dark, and the setPiece wants 'The lamp's reflection ... runs to the lip')
    hring += exp(-pbSq((hr - uHull[i].z) / 1.1));
  }
  col += uLampCol * ((ribbon * 1.0 + glint * 3.0) * occ + 0.012) * pbLampAtt(ld) * 1.3 * mix(0.6, 1.0, pbSS(8.0, 45.0, distance(uCamL, vLp)));
  col += (uSkyHi * 0.5 + uLampCol * 0.1 * pbLampAtt(ld)) * hring;
  // foam: streaks accelerating over the rim, flecks along the banks
  float along = p.y > -20.0 ? atan(p.x, p.y + 20.0) * 20.0 : sign(p.x) * (31.4 + (-20.0 - p.y));
  float lipFoam = pbSS(9.0, 0.5, sd) * pbSS(0.55, 0.85, pbNoise(vec2(along * 0.9, sd * 0.32 + uTime * (3.0 + 2.0 * uProg))));      // (repair 3) streaks with dark water between, not a pale band
  float bankFoam = men * pbSS(0.5, 0.8, pbNoise(p * 0.8 + vec2(0.0, uTime * 2.0)));
  // (repair 3) the motion: 'eddies, foam lines'. Foam lines drawn in on the turning water: a few long arms that
  // follow the flow's own curve in toward the rim (sph is constant along a line of flow), each broken into runs
  // that slide inward along it, soft at both edges, fading out up the channel
  float lr = log(20.0 + max(sd, 0.0)), sph = along * 0.4 - uSwirl * 6.4 * lr;
  float sw = sph + 2.2 * (pbNoise(vec2(along * 0.06, lr * 2.0)) - 0.5), wpu = (20.0 + max(sd, 0.0)) / 10.2;      // wpu: world units to one radian of sph
  float d1 = abs(fract(sw / 6.2832) - 0.5) * 6.2832 * wpu, d2 = abs(fract(sw / 3.1416 + 0.31) - 0.5) * 3.1416 * wpu;      // distance to the nearest arm, and to the nearest of the finer lines between
  float runs = pbSS(0.3, 0.62, pbNoise(vec2(sph * 0.8, lr * 5.0 + uTime * (0.55 + 0.25 * uProg))));
  float runs2 = pbSS(0.45, 0.7, pbNoise(vec2(sph * 1.7 + 9.0, lr * 7.0 + uTime * (0.7 + 0.3 * uProg))));
  float spiral = (pbSS(0.95, 0.2, d1) * runs + 0.6 * pbSS(0.55, 0.1, d2) * runs2) * pbSS(64.0, 28.0, sd) * pbSS(0.3, 3.0, sd);
  float foam = clamp(lipFoam * 0.7 + bankFoam * 0.5 + spiral * 0.7, 0.0, 1.0);
  // the lit steam in the mouth mirrored on the water: a broken amber road from the rim toward the viewer
  // (the setPiece: 'The lamp's reflection, which has led us down the whole street, runs to the lip')
  { vec3 Gv = vec3(0.0, 16.0, -24.0) - vLp; float gl = length(Gv); vec3 Gd = Gv / gl;
    vec3 gaz = normalize(vec3(Gd.x, 0.0, Gd.z) + 1e-5), glat = vec3(gaz.z, 0.0, -gaz.x);
    float gdl = dot(R, glat) - dot(Gd, glat), gdv = R.y - Gd.y;
    col += (uPortalCol * 0.3 + uLampCol * 0.34) * exp(-gdl * gdl * 26.0) * exp(-gdv * gdv * 5.0) * step(0.0, dot(R, gaz)) * fr * occ * (0.5 + 0.5 * uProg) * pbSS(150.0, 60.0, gl) * 1.5;
  }
  { vec3 Sv = uShopP - vLp; float sl = length(Sv); vec3 Sd = Sv / max(sl, 1e-3);
    vec3 saz = normalize(vec3(Sd.x, 0.0, Sd.z) + 1e-5), slat = vec3(saz.z, 0.0, -saz.x);
    float sdl = dot(R, slat) - dot(Sd, slat), sdv = R.y - Sd.y, sk = sl / 520.0;
    col += uShopC * exp(-sdl * sdl * 40.0) * exp(-sdv * sdv * 1.3) * step(0.0, dot(R, saz)) * 0.6 / (1.0 + sk * sk * sk * sk); }
  col = mix(col, uCream * 0.3 + uLampCol * 0.16, foam);
  col += uSkyHi * men * 0.22;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const SHEET_VERT = FOG_V + GLSL_COMMON + /* glsl */`
attribute vec2 aIn; varying vec3 vLp; varying vec2 vUv;
void main(){
  vec3 p = position; vUv = uv;
  float wob = (pbNoise(vec2(uv.x * 34.0, uv.y * 2.4 - uTime * 1.3)) - 0.5) * 2.6 * uv.y;
  p.xz += aIn * wob;
  vLp = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHEET_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
uniform vec3 uSkyHi; uniform vec3 uSkyLo; uniform vec3 uDeep; uniform vec3 uCream;
varying vec3 vLp; varying vec2 vUv;
void main(){
  float s = vUv.x, v = vUv.y, t = uTime * (1.2 + 0.5 * uProg);
  float st1 = pbNoise(vec2(s * 170.0, v * 3.0 - t * 2.1));
  float st2 = pbNoise(vec2(s * 52.0, v * 5.5 - t * 2.7));
  float clump = pbNoise(vec2(s * 15.0, v * 2.3 - t * 1.4));
  float streak = st1 * 0.55 + st2 * 0.65;
  float inP = pbSS(24.0, 4.0, uCamL.z) * pbSS(12.0, 5.5, uCamL.y);          // (polish 2) the viewer is down in the chamber
  // (polish 3) seen from inside, the sheet is combed into falling ribbons instead of standing as a pane
  float comb = pbSS(0.34, 0.86, streak);
  // (repair 3) the fall is drawn: whole and glassy where it bends over the lip, then torn into ropes of water
  // about a unit across (gathered in clumps, fine threads between) with the dark of the chamber in the gaps;
  // each rope is the lamp's amber where it leaves the lip ('the falling sheet lit amber from behind') and goes
  // down into the dark. Before, the whole curtain was one pale cream surface from lip to pool
  // (r5) the fall stays whole as far down as the iron skirt stands behind it and tears below the skirt's foot:
  // 7.6 is the foot of the iron rim's skirt under the basin's level (the rim's profile, its first point
  // [-0.7, -7.6]); 0.7 and 45.5 are the fall's own law (its height is -0.7 - 45.5 v v). So the tearing starts at
  // the v at which the water has fallen to the skirt's foot
  float rope = pbSS(0.36, 0.6, st2 * 0.62 + clump * 0.38), thread = pbSS(0.6, 0.86, st1), torn = pbSS(sqrt((7.6 - 0.7) / 45.5), 0.5, v), deep = pbSS(0.0, 0.85, v);
  float alpha = mix(0.92, 0.06 + 0.86 * max(rope, 0.5 * thread), torn);
  vec3 Lv = uLampPos - vLp; float ld = length(Lv); vec3 L = Lv / ld;
  float lit = pbLampVis(vLp, L) * pbLampAtt(ld);
  vec3 col = mix(uLampCol * (0.07 + 0.16 * st2 + 0.2 * thread) * (0.5 + 0.5 * lit), uDeep * 0.9 + uSkyLo * 0.6, deep) * (0.4 + 0.8 * rope);
  // (polish 3) inside the chamber the culvert's warm light rakes across the ropes, and clots of foam go down
  vec3 Pq = uPortalPos - vLp; float pk = 1.0 / (1.0 + dot(Pq, Pq) / 2600.0);
  col += inP * (uPortalCol * 0.16 + uLampCol * 0.3) * (0.01 + 0.16 * comb * comb) * pk * (0.3 + 0.7 * rope);
  col += (uCream * 0.08 + uLampCol * 0.1) * inP * pbSS(0.74, 0.96, st1) * (0.3 + 0.7 * clump) * (1.0 - 0.7 * deep);
  float clot = pbSS(0.7, 0.9, pbNoise(vec2(s * 46.0, v * 7.0 - t * 2.4))) * pbSS(0.25, 0.6, clump) * pbSS(0.1, 0.35, v);
  col += (uCream * 0.12 + uLampCol * 0.12) * inP * clot * (1.0 - 0.6 * deep);
  // the lamp's reflection runs to the lip and goes over the edge with the water
  float rib = exp(-vLp.x * vLp.x / 14.0) * pbSS(-26.0, -6.0, vLp.z) * (1.0 - 0.75 * v);
  col += uLampCol * rib * (0.12 + 0.5 * st1);
  vec3 Pv = uPortalPos - vLp; col += uPortalCol * (0.04 + 0.3 * st2) / (1.0 + dot(Pv, Pv) / 300.0);
  col += uSkyHi * 0.6 * pbSS(0.07, 0.0, v) * (1.0 - 0.6 * inP);
  col += (uPortalCol * 0.55 + uLampCol * 0.18) * pbSS(0.12, 0.0, v) * (0.6 + 0.6 * st2);     // the back-lit lip: a glowing horseshoe line
  // (polish 3) the curl at the lip: a bright rolled shoulder, the darker hollow under it, then the fall
  float curl = exp(-pbSq((v - 0.045) / 0.028)), hollow = exp(-pbSq((v - 0.15) / 0.05));
  col += uLampCol * curl * (0.12 + 0.25 * st2) * (0.6 + 0.4 * inP);
  col *= 1.0 - 0.5 * hollow * (0.5 + 0.5 * st2);
  col += (uCream * 0.3 + uLampCol * 0.25) * pbSS(0.6, 0.85, pbNoise(vec2(s * 90.0, v * 14.0 - t * 3.0))) * pbSS(0.2, 0.06, v) * pbSS(0.0, 0.03, v);
  // the spray at its foot: where the ropes strike the pool they burst into fine drops (amber-grey, never white)
  float drops = pbSS(0.5, 0.78, pbNoise(vec2(s * 300.0, v * 70.0 - t * 6.0))), foam = pbSS(0.72, 1.0, v) * (0.25 + 0.75 * drops) * (0.5 + 0.5 * st2);
  col = mix(col, uCream * 0.13 + uLampCol * (0.05 + 0.14 * lit + 0.09 * inP), foam * 0.85);
  alpha = max(alpha, foam * 0.6) * (1.0 - pbSS(0.95, 1.03, v)) * pbSS(0.0, 0.035, s) * pbSS(1.0, 0.965, s);
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

const POOL_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
uniform vec3 uSkyHi; uniform vec3 uDeep; uniform vec3 uCream;
varying vec3 vLp;
void main(){
  vec2 p = vLp.xz; float sd = pbSdU(p);
  float band = exp(-pbSq((sd + 8.0) / 4.5));
  float n = pbFbm(p * 0.33 + uTime * vec2(0.7, -0.9)), n2 = pbFbm(p * 0.6 - uTime * vec2(0.5, 0.8) + 9.0);
  float rip = sin((sd + 8.0) * 0.8 - sign(sd + 8.0) * uTime * 5.0 + n * 5.0) * exp(-abs(sd + 8.0) * 0.07);
  vec3 N = normalize(vec3((n - 0.5) * 1.6 + rip * 0.35, 1.0, (n2 - 0.5) * 1.6));
  vec3 V = normalize(uCamL - vLp), R = reflect(-V, N);
  vec3 Lv = uLampPos - vLp; float ld = length(Lv); vec3 L = Lv / ld;
  float lit = pbLampVis(vLp, L) * pbLampAtt(ld);
  float foam = clamp(band * (0.4 + 0.8 * n) + pbSS(0.25, 0.95, n * n2 * 2.4) * 0.3, 0.0, 1.0);
  vec3 col = uDeep * 0.5;
  col += uLampCol * lit * (0.05 + pow(max(dot(R, L), 0.0), 60.0) * 2.5);
  vec3 Pv = uPortalPos - vLp; float pd = length(Pv);
  col += uPortalCol * (0.05 + 1.2 * pow(max(dot(R, Pv / pd), 0.0), 24.0)) / (1.0 + pd * pd / 1500.0);
  col = mix(col, uCream * 0.16 + uLampCol * (0.04 + 0.25 * lit), foam);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const PLAIN_VERT = FOG_V + /* glsl */`
varying vec3 vLp; varying vec3 vLn; varying vec2 vUv;
void main(){ vLp = position; vLn = normal; vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const MIST_VERT = FOG_V + GLSL_COMMON + /* glsl */`
attribute vec4 aSeed; varying vec3 vLp; varying vec2 vUv; varying float vA; varying vec2 vS; varying float vH;
void main(){
  float ph = fract(uTime * (0.05 + 0.03 * aSeed.y) + aSeed.x);
  // the setPiece: 'mist boiling up out of it into the lamp cone in slow rolling billows'. Most billows boil in
  // the mouth of the drain (up from the chamber to a little over the lip, lit gold from below); about four in
  // ten climb on into the lamp cone, and those drift out to one side or the other and back toward the hood
  // as they rise, so no column ever stands in front of the lamp post
  float tall = step(0.6, aSeed.w), side = aSeed.y < 0.5 ? -1.0 : 1.0;
  vec3 c = vec3((aSeed.y - 0.5) * 30.0, -40.0, -23.0 + (aSeed.z - 0.5) * 36.0);
  c.y += pow(ph, 0.7) * mix(48.0, 57.0, aSeed.z) + tall * ph * ph * (70.0 + 50.0 * aSeed.x);
  c.x += sin(uTime * 0.23 + aSeed.z * 20.0) * 5.0 * ph + tall * side * (5.0 + 34.0 * ph * ph);
  c.z -= tall * ph * 30.0 + (1.0 - tall) * ph * ph * 8.0;
  float size = mix(14.0, mix(36.0, 58.0, tall), ph) * (0.8 + 0.5 * aSeed.z);      // separate billows, not one sheet of haze
  float rot = aSeed.w * 6.283 + uTime * 0.12 * (aSeed.x - 0.5);
  vec2 q = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * position.xy * size;
  vec3 fw = normalize(c - uCamL), rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rt, fw);
  vec3 p = c + rt * q.x + up * q.y;
  vLp = p; vUv = position.xy * 2.0; vS = aSeed.xy; vH = 2.0 * q.y / size;      // vH: -1 at a billow's foot, +1 at its crown
  vA = pbSS(0.0, 0.1, ph) * (1.0 - pbSS(0.4, 1.0, ph)) * (0.55 + 0.6 * uProg);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const MIST_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
uniform vec3 uFogCol;
varying vec3 vLp; varying vec2 vUv; varying float vA; varying vec2 vS; varying float vH;
void main(){
  float d = length(vUv);
  float soft = pbSS(1.0, 0.15, d);
  float n = pbFbm(vUv * 1.7 + vS * 31.0 + vec2(0.0, -uTime * 0.07));
  float cd = distance(vLp, uCamL);
  // thin from up the street (the lamp post and the drain stay readable), thickening as we arrive
  float puff = pbSS(0.38, 0.76, n * (0.5 + 0.95 * soft));                 // a lumpy head with gaps round it
  float a = soft * puff * vA * 0.5 * mix(1.0, 0.4, pbSS(120.0, 250.0, cd)) * mix(1.0, 0.4, pbSS(240.0, 300.0, vLp.y));
  float sd = pbSdU(vLp.xz);
  a *= pbSS(5.0, 40.0, cd) * mix(0.35, 1.0, pbSS(-14.0, 4.0, vLp.y)) * mix(1.0, 0.14, pbSS(24.0, 4.0, uCamL.z) * pbSS(12.0, 5.5, uCamL.y));     // (polish 2, 3) thin once the viewer is inside it
  // the design: 'mist boiling up out of it into the lamp cone in slow rolling billows'. The billows climb the
  // whole cone again; one rule in space keeps them off the boats: outside the horseshoe opening itself nothing
  // of them hangs lower than the kerb top, which is above a boat's peak and the lens that rides behind it
  a *= mix(1.0, pbSS(11.5, 34.0, vLp.y), pbSS(-4.0, 1.0, sd));      // (this also keeps a billow from cutting a hard line into the street)
  // at the level of the lip the falling water drags the mist thin: the horseshoe, its rim and the foot of the
  // lamp post show through it; it thickens again in the chamber below and in the lamp cone above
  a *= 1.0 - 0.3 * pbSS(-14.0, -2.0, vLp.y) * (1.0 - pbSS(24.0, 58.0, vLp.y));
  if (a < 0.003) discard;
  vec3 Lv = uLampPos - vLp; float ld = length(Lv); vec3 L = Lv / ld;
  float cone = pbSS(0.55, 0.97, L.y);
  float att = 1.0 / (1.0 + ld * ld / 90000.0);
  float fs = pow(max(dot(normalize(vLp - uCamL), L), 0.0), 3.0);
  // mist is water in the air: it has no colour of its own, only the light that falls into it. Pale amber and
  // luminous where the lamp cone lights it, nearly nothing outside it (no slate or brown body); each billow
  // is lit from above (a bright crown over a dimmer foot), which is what makes it a rolling billow and not a
  // veil. In the mouth of the drain the light wells up from below instead, and there the foot is the bright part
  float crown = 0.5 + 0.5 * clamp(vH + 0.35 * (n - 0.5), -1.0, 1.0);
  float lit = pbLampVis(vLp, L) * att * cone;
  vec3 Pv = uPortalPos - vLp; float gold = 1.0 / (1.0 + dot(Pv, Pv) / 1500.0);
  // (repair 3) the steam is the lamp's amber, not cream: so bright that it burnt out to white puffs, it is now
  // dim enough to keep its colour (the journey: 'mist glowing ahead under the lamp', 'the amber mist')
  vec3 pale = uLampCol * 0.3 + dot(uLampCol, vec3(0.3333)) * vec3(0.06, 0.04, 0.02);
  vec3 col = pale * lit * (0.75 + 0.5 * fs) * (0.5 + 0.9 * n * soft) * mix(0.5, 1.6, crown * crown);
  // (the gold from below lights the mist in the mouth and over the lip. Below the lip, inside the shaft, the
  // falling sheets drag the mist down with them and it holds little of that light: thin veils there, the same
  // from wherever they are seen, with the fall, the chamber's pool and the culvert's ring behind them; deep in
  // the chamber the gold gives out)
  gold *= pbSS(-34.0, -8.0, vLp.y) * mix(0.35, 1.0, pbSS(-12.0, 2.0, vLp.y));
  // (repair 3) lit amber from below: the light in the shaft is the lamp's amber gone down with the water and come
  // back up through the spray, and it reaches a billow's foot before its crown
  col += (uPortalCol * 0.3 + uLampCol * 0.34) * gold * mix(1.5, 0.3, crown) * (0.6 + 0.6 * n);
  float seen = clamp(lit * 2.6 + gold * 1.2, 0.0, 1.0);
  a *= 0.06 + 0.94 * seen;
  #ifdef USE_FOG
    col = mix(col, fogColor, (1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * 0.6);
  #endif
  gl_FragColor = vec4(col * a, a * 0.22);      // premultiplied: the billow adds its light and hides little of what stands behind it
}`;

const GLASS_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
varying vec3 vLp; varying vec3 vLn;
void main(){
  vec3 N = normalize(vLn), V = normalize(uCamL - vLp);
  float core = pow(max(abs(dot(N, V)), 0.0), 5.0);
  float bars = 0.85 + 0.15 * pbSS(0.0, 0.5, abs(fract(vLp.y * 0.1) - 0.5));
  gl_FragColor = vec4(uLampCol * (0.55 + 1.9 * core) * bars, 1.0);
  #include <fog_fragment>
}`;

const GLOW_VERT = FOG_V + GLSL_COMMON + /* glsl */`
uniform vec3 uCentre; uniform float uSize; varying vec2 vUv;
void main(){ vUv = position.xy * 2.0;
  vec4 mvPosition = modelViewMatrix * vec4(uCentre, 1.0);
  float sc = length(modelMatrix[0].xyz);
  mvPosition.xyz += normalize(-mvPosition.xyz) * 24.0 * sc;
  mvPosition.xy += position.xy * uSize * sc;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLOW_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
varying vec2 vUv;
void main(){ float d = length(vUv);
  float e = pbSS(1.0, 0.0, d); float g = 0.5 * exp(-d * d * 16.0) + 0.075 * e * e;
  gl_FragColor = vec4(uLampCol * g, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      gl_FragColor.rgb *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
}`;

const CONE_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
varying vec3 vLp; varying vec3 vLn;
void main(){
  vec3 N = normalize(vLn), V = normalize(uCamL - vLp);
  float rim = pbSq(abs(dot(N, V)));
  float h = clamp((uLampPos.y - vLp.y) / 400.0, 0.0, 1.0);
  float ang = atan(vLp.x - uLampPos.x, vLp.z - uLampPos.z);
  float needles = pbSS(0.62, 1.0, pbNoise(vec2(ang * 330.0, vLp.y * 0.022 + uTime * 4.0)))
                + 0.6 * pbSS(0.66, 1.0, pbNoise(vec2(ang * 610.0 + 9.0, vLp.y * 0.03 + uTime * 5.5)));   // rain crossing the light
  float fade = pbSS(1.0, 0.8, h) * pbSS(0.0, 0.05, h);
  float g = rim * fade * (0.008 + 0.03 * (1.0 - h) * (1.0 - h) + needles * 0.03 * (1.0 - 0.5 * h));
  gl_FragColor = vec4(uLampCol * g, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      gl_FragColor.rgb *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
}`;

const PORTAL_FRAG = FOG_F + GLSL_COMMON + /* glsl */`
varying vec2 vUv;
void main(){ vec2 q = vUv * 2.0 - 1.0; float d = length(q);
  float sw = pbFbm(q * 2.4 + vec2(uTime * 0.15, -uTime * 0.22));
  gl_FragColor = vec4(uPortalCol * (0.45 + 0.9 * sw) * (1.15 - 0.5 * d) * (0.8 + 0.4 * uProg), 1.0);
  #include <fog_fragment>
}`;

// geometry helpers and the shared GLSL, reused by the world for the rest of the street
export { GLSL_COMMON, chamferBox, domeGeo, leafGeo, makeAcc, trs };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('storm-drain') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cNight, cViolet, cSlate, cPale, cAmber, cCream] = pal;
  const mix = (a, b, t, k = 1) => a.clone().lerp(b, t).multiplyScalar(k);

  // ---- per-seed character ----
  const warm = rng.range(0.1, 0.3), sides = rng.pick([4, 6, 6, 8]);
  const col = {
    violet: cViolet, pale: cPale,
    dirt: mix(cNight, cSlate, 0.25, 0.55),
    moss: new THREE.Color('#3A4A44').multiplyScalar(0.75), mossAmt: rng.range(0.45, 1.0),
    mortar: mix(cNight, cSlate, 0.3, 0.5),
    cobble: mix(cSlate, cViolet, rng.range(0.15, 0.45), 0.62),
    granite: mix(cSlate, cPale, rng.range(0.25, 0.5), 0.6),
    flag: mix(cSlate, cViolet, 0.3, 0.52),
    brick: mix(mix(cViolet, cSlate, 0.4), cAmber, warm, 0.6),
    brick2: mix(mix(cSlate, cPale, 0.25), cAmber, warm * 1.3, 0.62),
    iron: mix(cNight, cSlate, 0.22, 0.75),
    rust: mix(cNight, cAmber, 0.3, 0.6),
    apron: opts.apron !== false,
    leaf: mix(cAmber, cPale, rng.range(0.4, 0.6), 0.3),
  };
  const lampBase = cAmber.clone().lerp(cCream, rng.range(0.0, 0.18)).multiplyScalar(3.0 * (opts.lampGain ?? 1));
  const portalCol = new THREE.Color(opts.portalColor || '#FFD9A0').multiplyScalar(1.2);

  const U = {
    uCamL: { value: new THREE.Vector3(0, 60, 200) }, uLampPos: { value: LAMP.clone() }, uLampCol: { value: lampBase.clone() },
    uPortalPos: { value: new THREE.Vector3(CUL.x, CUL.y, CUL.z + 15) }, uPortalCol: { value: portalCol },
    uTime: { value: 0 }, uProg: { value: 0.6 },
    uSkyLo: { value: mix(cViolet, cNight, 0.2, 0.5) }, uSkyHi: { value: mix(cSlate, cPale, 0.15, 0.55) },
    uDeep: { value: mix(cNight, cViolet, 0.4, 0.3) }, uCream: { value: cCream.clone() }, uFogCol: { value: mix(cSlate, cViolet, 0.3, 0.9) },
    uShopP: { value: new THREE.Vector3(-200, 120, 190) }, uShopC: { value: new THREE.Color(0, 0, 0) },
    uHull: { value: [0, 1, 2].map(() => new THREE.Vector3(1e5, 1e5, 4)) }, uHullD: { value: [0, 1, 2].map(() => new THREE.Vector3(1, 0, 1)) },
    uSwirl: { value: 1 },
  };
  const shader = (vs, fs, extra = {}, uni = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...uni }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra,
  });

  const object = new THREE.Group(); object.name = 'storm-drain';
  const addMesh = (g, m, order = 0) => { const me = new THREE.Mesh(g, m); me.renderOrder = order; me.frustumCulled = false; object.add(me); return me; };

  // ---- solids (one draw call) ----
  const acc = makeAcc();
  // a thing that is new, or whose count of draws is its own affair, takes a stream made from the world's seed and its name
  const ownRng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  U.uSwirl.value = ownRng('paper-boat-rapids:drain-swirl')() < 0.5 ? -1 : 1;      // which way round the water turns into the drain
  await buildStreet(acc, rng.fork ? rng.fork('street') : rng, noise, col, () => ctx.yield(), ownRng('paper-boat-rapids:plastered-leaf-shapes'));
  await ctx.yield();
  const ironSide = await buildChamber(acc, rng.fork ? rng.fork('chamber') : rng, col, () => ctx.yield());
  await ctx.yield();
  buildHood(acc, rng.fork ? rng.fork('hood') : rng, col);
  await ctx.yield();
  let lan = null;
  if (opts.lamp !== false) lan = buildLamp(acc, rng.fork ? rng.fork('lamp') : rng, col, sides);
  await ctx.yield();
  addMesh(acc.build(), makeSolidMaterial(U));
  await ctx.yield();

  // ---- basin water ----
  const wg = new THREE.PlaneGeometry(74, 193, 50, 96); wg.rotateX(-Math.PI / 2); wg.translate(0, 0, 49);
  addMesh(wg, shader(WATER_VERT, WATER_FRAG), 1);

  // ---- the horseshoe cataract ----
  {
    const NS = 110, NV = 24, path = uPath(NS), P = [], UV = [], IN = [], idx = [];
    for (let i = 0; i <= NS; i++) {
      const q = path[i], thr = 5 + 4.5 * Math.sin(Math.PI * q.s);
      for (let j = 0; j <= NV; j++) {
        const tv = (j / NV) * 1.03, o = -0.35 + thr * tv;
        P.push(q.x + q.nx * o, -0.7 - 45.5 * tv * tv, q.z + q.nz * o); UV.push(q.s, tv); IN.push(q.nx, q.nz);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    sg.setAttribute('aIn', new THREE.Float32BufferAttribute(IN, 2)); sg.setIndex(idx);
    addMesh(sg, shader(SHEET_VERT, SHEET_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 3);
  }

  // ---- chamber pool ----
  const pg = new THREE.PlaneGeometry(71.8, 62.6); pg.rotateX(-Math.PI / 2); pg.translate(0, POOL_Y, -24.4);
  addMesh(pg, shader(PLAIN_VERT, POOL_FRAG), 1);

  // ---- mist billows ----
  {
    const n = Math.max(8, Math.round((opts.mist ?? 60) * rng.range(0.9, 1.1))), seeds = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) seeds[i] = rng();
    const mg = new THREE.InstancedBufferGeometry(); const q = new THREE.PlaneGeometry(1, 1);
    mg.index = q.index; mg.setAttribute('position', q.attributes.position);
    mg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); mg.instanceCount = n;
    addMesh(mg, shader(MIST_VERT, MIST_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true }), 5);
  }

  // ---- lantern glass, its soft lens disc, the cone of lit rain ----
  if (lan) {
    const gg = new THREE.CylinderGeometry(lan.rt - 0.4, lan.rb - 0.4, lan.yt - lan.yb, sides, 1, true);
    gg.rotateY(lan.rot); gg.translate(LAMP.x, (lan.yb + lan.yt) / 2, LAMP.z);
    addMesh(gg, shader(PLAIN_VERT, GLASS_FRAG, { side: THREE.DoubleSide }), 0);
    addMesh(new THREE.PlaneGeometry(1, 1), shader(GLOW_VERT, GLOW_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending },
      { uCentre: { value: LAMP.clone() }, uSize: { value: 160 } }), 6);
    const cg = new THREE.CylinderGeometry(16, 170, 400, 40, 1, true); cg.translate(LAMP.x, LAMP.y - 206, LAMP.z + 30);
    addMesh(cg, shader(PLAIN_VERT, CONE_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), 4);
  }
  if (opts.portalGlow !== false) {
    const dg = new THREE.CircleGeometry(7.2, 36); dg.translate(CUL.x, CUL.y, -59);
    addMesh(dg, shader(PLAIN_VERT, PORTAL_FRAG), 0);
  }

  // ---- runtime ----
  const inv = new THREE.Matrix4(), flick = rng.range(0, 100);
  let prog = 0.6;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const hero = {
    object, radius: 110, height: 150, center: V(0, -4, -22), ground: false, groundY: ROAD_Y,
    uniforms: U,                 // shared uniform objects (lamp, time, water colours) so the world's street can match
    anchors: {
      portalSeat: { position: V(CUL.x, CUL.y, -55.5), facing: V(0, 0, 1), radius: 7 },
      flyThrough: [V(0, 7, 146), V(0, 7, 80), V(0, 7, 30), V(0, 6, 8), V(0, 2.5, -4), V(0, -5, -14), V(0, -12.5, -25), V(0, -17.5, -36), V(0, -19.6, -45), V(0, -20, -55.5)],
      lip: V(0, -0.7, 0), gutterIn: { position: V(0, 0, 146), direction: V(0, 0, -1), halfWidth: 15 },
      lampHead: LAMP.clone(), lampBase: V(LAMP.x, KERB_Y, LAMP.z), mistTop: V(8, 95, -55),
      viewpoints: {
        approach: { from: V(0, 9, 135), at: V(0, 20, -40) },
        brink: { from: V(0, 8, 22), at: V(0, -14, -40) },
        inside: { from: V(0, -10, -20), at: V(0, -20, -55) },
      },
      stepIronSide: ironSide, poolY: POOL_Y, waterY: 0, kerbTopY: KERB_Y, roadY: ROAD_Y + 2,
    },
    waterHeight: (x, z) => waterY(x, z),
    channelHalfWidth: (z) => chanHalf(z),
    flow(x, z, out = new THREE.Vector3()) {     // xz = unit direction, y = speed in units/s
      const sd = sdU(x, z), e = 0.6, gx = sdU(x + e, z) - sdU(x - e, z), gz = sdU(x, z + e) - sdU(x, z - e), gl = Math.hypot(gx, gz) || 1;
      const k = 1 - smoothstep(3, 42, sd), w = 0.8 * U.uSwirl.value, fx = lerp(0, (-gx + w * -gz) / gl, k), fz = lerp(-1, (-gz + w * gx) / gl, k), fl = Math.hypot(fx, fz) || 1;
      return out.set(fx / fl, 10 + 24 * (1 - smoothstep(0, 30, sd)), fz / fl);
    },
    setProgress(u) { prog = clamp(u, 0, 1); },
    update(dt, time, camera) {
      object.updateWorldMatrix(true, false);
      inv.copy(object.matrixWorld).invert();
      if (camera) (camera.matrixWorld ? U.uCamL.value.setFromMatrixPosition(camera.matrixWorld) : U.uCamL.value.copy(camera.position)).applyMatrix4(inv);
      U.uTime.value = time; U.uProg.value = prog;
      const t = time + flick, f = 1 + 0.07 * Math.sin(t * 11.3) * Math.sin(t * 3.1) + 0.04 * Math.sin(t * 23.7 + 1.3) + 0.05 * noise.n2(t * 1.7, 3.3);
      U.uLampCol.value.copy(lampBase).multiplyScalar(f);
    },
    dispose() {},
  };
  return hero;
}
