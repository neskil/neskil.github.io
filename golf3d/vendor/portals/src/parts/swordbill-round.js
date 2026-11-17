// THE LEANING TRUMPET TREE  (hero set piece of "swordbill-round")
// ---------------------------------------------------------------------------------------------
// A red angel's trumpet (Brugmansia sanguinea) at x15: a grey corky trunk leaning 30 degrees out
// over the ravine, forking into two main limbs 20 m apart, a crown 60 m across hung with about
// three hundred pendant trumpets (green ribbed calyx, yellow veined tube, five recurved scarlet
// lobes) that swing as pendulums on their own stalks with gust waves travelling through them.
// Every lobe carries a glass drop that swells, lets go and falls. Felted leaves flutter, moss
// beards sway, mist rises through the crown, sun shafts stand under it. Between the two limbs
// is the NAVE: a clear hall 17 m wide rising at 60 degrees, walled and roofed with bells and
// leaves, with the portal seat as its window; the largest bell hangs at its foot.
//
// FRAME    Origin = root collar on the ravine rim (the brief's -25 m), +Y up. With the default
//          opts.yaw (45 deg) and the object unrotated, +X is east and +Z is south: the tree leans
//          south-east (toward +X+Z) and the nave climbs north-west. A mossy rock knuckle and roots
//          reach 9 m below the origin so the world can bury them in its rim. ground: false.
// SIZE     radius ~32 m about `center` (crown 60 m across, drooping skirts to 34 m), height 76 m
//          (crown from y 5 to y 76; trunk tip is 40 m down-lean of the root).
// OPTS     palette  7 hex strings [pearl mist, blue-green mist, moss green, deep green, yellow,
//                   scarlet, violet] (brief default)
//          hour     'morning' (default, sun 58 deg up in the east) | 'dawn' | 'afternoon' | 'bluehour'
//          weather  'mist' (default) | 'clear' | 'drizzle' (wetter, every bell drips fast)
//          bloom    'scarlet' (default) | 'flame' | 'yellow'
//          density  220..380 trumpets (default by seed 305..345)
//          yaw      radians the lean is turned from +Z toward +X (default PI/4)
//          sunDir   [x,y,z] toward the sun in WORLD space (overrides the hour preset)
//          mist, shafts   false to leave out the rising mist sprites / the light shafts
//          mistAlpha  gain on the rising mist sprites (default 1; a world with its own mist turns them down)
//          fogCut   0..1 share of the scene's fog the tree takes (default 1); under 1 it reads further through the mist
//          farFrom  Vector3 (object space): the place the tree is first seen from, 150 m or more away. Stand-in bells (opts.farBells,
//                   default 400, about 50 triangles each) are hung on the side of the crown turned to it and shrink away within 150 m
//          nearLeaf metres: leaf clusters this close to a flight line get the 64-triangle blade (default 11.5)
//          route    (anchors) => [polyline of Vector3 in object space, ...]: the world's own flight line round the tree;
//                   twigs keep 6 m, leaves 8.6 m and bells 5 m off it, and bells within 8 m of it have their swing capped
//          sight    () => [{ from: Vector3 (object space), r, to, cut }]: places outside the nave's own sight cone from which the portal must
//                   show. What stands inside the cone from each place to the portal seat (radius r there, default 7.8 m; only as far
//                   along it as `to`, default all the way) is left undrawn: cut 'leaves' = leaf clusters and beards only, 'twigs' = twigs
//                   and bells as well, otherwise boughs too; the trunk and the two main limbs always stay (hero.mainWood lists them)
// HOOKS    hero.uniforms: uSunDir, uSunCol, uSkyCol, uGroundCol (retint the self-shading),
//          uGust (x spatial k, y speed, z strength), uGlow (petal glow gain), uWet.
//          hero.setWind(k) scales swing and gusts (1 = default). hero.setSun(dirWorld, colour).
//          hero.bells = [{ position (stalk pivot), axis (down the bell), length, swing (max radians), lod,
//          stop }] in local space, so the world can
//          assert its path against every swept bell. Nothing here is keyed to arrival: swing,
//          drips and mist run on time, as the brief asks.
// ANCHORS  (local space of hero.object)
//          portalSeat   { position, normal, radius 7 } the 14 m portal, tilted 60 deg, facing back
//                       down the nave (normal = minus the final flight direction)
//          naveFoot     start of the 60 m straight; naveFoot -> portalSeat.position is the climb
//          flyThrough   ordered points: under the crown (dive bottom) -> two rise bends -> throat
//                       view -> naveFoot -> portal. Branches keep 6.5 m and leaves 6 m from this
//                       line, bells 4.4 m (their swing is capped within 8 m of it)
//          stopSun / stopBacklit / stopThroat   { flower (mouth centre), view (2 m off), approach
//                       (12 m off, head-on), axis (down the bell) }; stopBacklit also has bells[5]
//          circuit      8 points round the crown at 22 m from its skin (anticlockwise from above)
//          trunkTop, fork, limbTips[2], crownTop, under (lowest bells), wind (unit vector)
// LIGHT    Self-shaded ShaderMaterials (fogged with the scene fog): one sun direction, pale mist
//          fill from above, deep green fill from below, per-instance canopy shade baked at build.
//          Petals transmit light (strongest with the sun beyond them); only petal rims, drops and
//          wet leaf highlights exceed 1. Wants pale bright mist behind it and bloom ~0.4 at
//          threshold ~0.9. No real-time lights, no shadows.
// COST     about 185k triangles (200k while the far stand-ins show), 12 draw calls, build ~250 ms on the test machine (yields between steps).
//          Style: plain naturalistic. hero.solids = flat [x, y, z, r, ...] of wood samples and leaf clusters (object space).
import * as THREE from 'three';

const PALETTE = ['#E6EEE9', '#9FC6B4', '#5F8F3A', '#17301F', '#F2C83A', '#D8321E', '#5A3FC8'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function distSeg(p, a, b) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
  const l2 = abx * abx + aby * aby + abz * abz;
  const t = l2 > 1e-9 ? Math.min(1, Math.max(0, (apx * abx + apy * aby + apz * abz) / l2)) : 0;
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function distPoly(p, poly) { let d = Infinity; for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, distSeg(p, poly[i], poly[i + 1])); return d; }
function spaced(ctrl, n) { return new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(n); }

// ---- growable geometry buffer -----------------------------------------------------------------
class Buf {
  constructor(sizes) { this.sizes = sizes; this.a = {}; for (const k in sizes) this.a[k] = []; this.idx = []; this.n = 0; }
  v(vals) { for (const k in this.sizes) { const x = vals[k]; for (let i = 0; i < this.sizes[k]; i++) this.a[k].push(x[i]); } return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  // make every triangle's winding agree with its vertex normals (so gl_FrontFacing means "outside")
  fixWinding() {
    const P = this.a.position, N = this.a.normal, I = this.idx;
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const d = nx * (N[a] + N[b] + N[c]) + ny * (N[a + 1] + N[b + 1] + N[c + 1]) + nz * (N[a + 2] + N[b + 2] + N[c + 2]);
      if (d < 0) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
    }
    return this;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    for (const k in this.sizes) g.setAttribute(k, new THREE.Float32BufferAttribute(this.a[k], this.sizes[k]));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    return g;
  }
}

// ---- a branch tube with parallel-transported rings ----------------------------------------------
// pts: Vector3[], rad(i) radius, radial sides, attrs(i, j, ang) -> extra attribute values
function tube(B, pts, rad, radial, extra, lump) {
  const n = pts.length, t = V3(), nrm = V3(), bin = V3(), prevT = V3(), q = new THREE.Quaternion(), tmp = V3();
  t.subVectors(pts[1], pts[0]).normalize();
  nrm.set(1, 0, 0); if (Math.abs(t.x) > 0.9) nrm.set(0, 0, 1);
  nrm.addScaledVector(t, -nrm.dot(t)).normalize();
  let len = 0; const rows = [];
  for (let i = 0; i < n; i++) {
    prevT.copy(t);
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    if (i < n - 1) t.subVectors(pts[i + 1], pts[Math.max(0, i - 1)]).normalize(); else t.subVectors(pts[i], pts[i - 1]).normalize();
    if (i > 0) { q.setFromUnitVectors(prevT, t); nrm.applyQuaternion(q); nrm.addScaledVector(t, -nrm.dot(t)).normalize(); }
    bin.crossVectors(t, nrm);
    const r = rad(i), row = [];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      tmp.set(0, 0, 0).addScaledVector(nrm, c).addScaledVector(bin, s);
      const rr = r * (lump ? lump(i, a, len) : 1);
      const e = extra(i, len, tmp);
      row.push(B.v({ position: [pts[i].x + tmp.x * rr, pts[i].y + tmp.y * rr, pts[i].z + tmp.z * rr], normal: [tmp.x, tmp.y, tmp.z], aUV: [j / radial, len], aM: e }));
    }
    rows.push(row);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) B.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
}

// ---- GLSL shared by everything that moves -------------------------------------------------------
const GLSL_WIND = /* glsl */`
uniform float uTime; uniform vec3 uWindDir; uniform vec3 uGust;
float gustAt(vec3 p, float t) {
  float ph = dot(p, uWindDir) * uGust.x - t * uGust.y;
  float a = 0.5 + 0.5 * sin(ph);
  float b = 0.5 + 0.5 * sin(ph * 0.37 + p.y * 0.05 + 1.3);
  return a * a * (0.35 + 0.65 * b);
}
// pendulum of a bell hung at piv: axis (xyz) and angle (w). sw = phase, phase, amplitude, frequency
vec4 swingAA(vec3 piv, vec4 sw, float t) {
  float g = gustAt(piv, t);
  vec2 tau = sw.z * vec2(0.6 * sin(t * sw.w + sw.x) + 0.3 * sin(t * sw.w * 1.83 + sw.y),
                         0.6 * sin(t * sw.w * 0.93 + sw.y) + 0.3 * sin(t * sw.w * 1.61 + sw.x * 1.7));
  tau += uWindDir.xz * (uGust.z * sw.z * g * (1.5 + 0.4 * sin(t * sw.w * 1.3 + sw.x)));
  float len = length(tau);
  return vec4(vec3(-tau.y, 0.0, tau.x) / max(len, 1e-5), len);
}
vec3 rotAA(vec3 v, vec4 aa) {
  float c = cos(aa.w), s = sin(aa.w);
  return v * c + cross(aa.xyz, v) * s + aa.xyz * (dot(aa.xyz, v) * (1.0 - c));
}
`;
const GLSL_NOISE = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; uniform float uWet, uGlow, uFogCut;
`;

// ---- the trumpet: one parametric flower, three levels of detail ---------------------------------
// Unit length: pivot (stalk) at the origin, mouth plane at y = -1. lu runs 0..5 round the flower
// (one unit per lobe, lobe mid-vein at .5), q 0..1 down the tube and 1..2 out along the recurved limb.
function bellSurf(lu, q, out) {
  const th = (lu / 5) * Math.PI * 2, phi = lu - Math.floor(lu) - 0.5, qq = Math.min(q, 1);
  let r = 0.038 + 0.07 * sstep(0.2, 0.8, qq) + 0.082 * Math.pow(qq, 5);
  r *= 1 + 0.06 * Math.cos(phi * Math.PI * 2) * sstep(0.3, 1, qq);
  let y = -(0.12 + 0.88 * qq);
  if (q > 1) {
    const lt = 0.27, ls = 0.032, K = 11.2, a0 = 0.96;
    const a = (ls + (lt - ls) * Math.pow(Math.max(0, 1 - 2 * Math.abs(phi)), 1.7)) * (q - 1);
    r += (Math.cos(a0) - Math.cos(a0 + K * a)) / K;
    y -= (Math.sin(a0 + K * a) - Math.sin(a0)) / K;
  }
  return out.set(Math.cos(th) * r, y, Math.sin(th) * r);
}
function calyxR(v, lu) {
  const t = Math.min(1, Math.max(0, (v - 0.10) / 0.34));
  return (0.034 + 0.03 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.3 * t) + 0.026 * t) * (1 + 0.09 * Math.cos(lu * Math.PI * 2));
}
function surfGrid(B, fn, cols, ss, part, vOf) {
  const p = V3(), a = V3(), b = V3(), n = V3(), rows = [], e = 2e-3, sMax = ss[ss.length - 1];
  for (const s of ss) {
    const row = [];
    for (let j = 0; j <= cols; j++) {
      const lu = (j / cols) * 5;
      fn(lu, s, p); fn(lu + e, s, a); fn(lu - e, s, b); a.sub(b);
      fn(lu, Math.min(s + e, sMax), b); fn(lu, Math.max(s - e, 0), n); b.sub(n);
      n.crossVectors(a, b); if (n.lengthSq() < 1e-18) n.set(Math.cos(lu * 1.2566), 0, Math.sin(lu * 1.2566)); n.normalize();
      row.push(B.v({ position: [p.x, p.y, p.z], normal: [n.x, n.y, n.z], aUV: [lu, vOf(s)], aPart: [part] }));
    }
    rows.push(row);
  }
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < cols; j++) B.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
}
async function makeBell(ctx, perLobe, tubeQs, limbN, lod) {
  const B = new Buf({ position: 3, normal: 3, aUV: 2, aPart: 1 });
  const qs = [...tubeQs]; for (let i = 1; i <= limbN; i++) qs.push(1 + i / limbN);
  const vOfQ = (q) => (q <= 1 ? 0.12 + 0.88 * q : q);
  if (lod === 0) {
    // far: calyx merged into the tube (its rows sit inside the calyx zone and are pushed out to it)
    const tmp = V3();
    surfGrid(B, (lu, q, out) => {
      bellSurf(lu, q, out); const v = vOfQ(q);
      if (v < 0.4) { const th = (lu / 5) * Math.PI * 2, r = calyxR(Math.max(v, 0.14), lu); out.x = Math.cos(th) * r; out.z = Math.sin(th) * r; }
      return out;
    }, perLobe * 5, qs, 0, vOfQ);
    for (let i = 0; i < B.n; i++) if (B.a.aUV[i * 2 + 1] < 0.4) B.a.aPart[i] = 1;
    tmp.set(0, 0, 0);
  } else {
    surfGrid(B, bellSurf, perLobe * 5, qs, 0, vOfQ);
    await ctx.yield();
    // calyx: an inflated ribbed sleeve ending in five teeth
    const cb = lod === 2 ? 6 : 3, css = []; for (let i = 0; i <= cb; i++) css.push(i / cb);
    surfGrid(B, (lu, s, out) => {
      const tooth = Math.pow(Math.max(0, Math.cos(lu * Math.PI * 2)), 2);
      const v = 0.10 + s * 0.34 + 0.085 * tooth * sstep(0.6, 1, s), th = (lu / 5) * Math.PI * 2;
      const r = calyxR(0.10 + s * 0.34, lu) * (1 - 0.1 * tooth * sstep(0.7, 1, s));
      return out.set(Math.cos(th) * r, -v, Math.sin(th) * r);
    }, lod === 2 ? 20 : 10, css, 1, (s) => 0.10 + s * 0.34);
    await ctx.yield();
    // five stamens leaning to the mouth, and the style
    const sc = lod === 2 ? 5 : 3, sss = lod === 2 ? [0, 0.4, 0.8, 0.86, 0.94, 1] : [0, 0.84, 0.9, 1];
    for (let k = 0; k <= 5; k++) {
      const style = k === 5, ang = ((k + 0.5) / 5) * Math.PI * 2;
      surfGrid(B, (lu, s, out) => {
        const v = style ? 0.45 + 0.53 * s : 0.5 + 0.41 * s, rc = style ? 0 : 0.016 + 0.034 * s * s;
        const sw = sstep(0.8, 0.9, s) * (1 - sstep(0.96, 1.0, s));
        const rad = (style ? 0.006 + 0.011 * sw : 0.0055 + 0.012 * sw) * (s >= 1 ? 0.3 : 1), a = (lu / 5) * Math.PI * 2;
        return out.set(Math.cos(ang) * rc + Math.cos(a) * rad, -v, Math.sin(ang) * rc + Math.sin(a) * rad);
      }, sc, sss, 2, (s) => (style ? 2.0 : 1.0) + s);
    }
  }
  await ctx.yield();
  // pedicel
  surfGrid(B, (lu, s, out) => { const th = (lu / 5) * Math.PI * 2, r = 0.012 + 0.024 * s * s * s; return out.set(Math.cos(th) * r, -0.115 * s, Math.sin(th) * r); },
    lod === 2 ? 6 : 3, lod === 0 ? [0, 1] : lod === 1 ? [0, 0.6, 1] : [0, 0.4, 0.75, 1], 3, (s) => s * 0.11);
  await ctx.yield();
  B.fixWinding();
  await ctx.yield();
  return B.geometry();
}

const BELL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_WIND}
attribute vec2 aUV; attribute float aPart; attribute vec4 aSw; attribute vec4 aTint;
uniform float uScale;
varying vec2 vUv; varying float vPart; varying vec3 vWN; varying vec3 vWP; varying vec4 vTint;
void main() {
  vec3 piv = instanceMatrix[3].xyz;
  mat3 im = mat3(instanceMatrix);
  vec4 aa = swingAA(piv, aSw, uTime);
  vec3 rel = rotAA(im * position * uScale, aa);
  vec3 n = rotAA(im * normal, aa);
  vec4 wp = modelMatrix * vec4(piv + rel, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * n; vUv = aUV; vPart = aPart; vTint = aTint;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BELL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
uniform vec3 uYel, uRed, uGreen, uDeep, uMist;
varying vec2 vUv; varying float vPart; varying vec3 vWN; varying vec3 vWP; varying vec4 vTint;
void main() {
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  bool front = gl_FrontFacing; if (!front) N = -N;
  vec3 toCam = cameraPosition - vWP; float dist = length(toCam);
  vec3 V = toCam / max(dist, 1e-4);
  vec3 L = uSunDir;
  float lu = vUv.x, v = vUv.y, fl = fract(lu);
  float rip = vTint.x, sunVis = vTint.y;
  float aa = fwidth(lu) * 1.3 + 0.003, fwv = fwidth(v);
  vec3 base; float tr = 1.0;
  if (vPart < 0.5) {
    // corolla: greenish at the calyx, yellow tube, scarlet flare and lobes
    float mott = vn(vec2(lu * 3.0, v * 9.0));
    float k = smoothstep(0.45 - 0.15 * rip, 0.86, v + 0.05 * mott - 0.025);
    base = mix(uYel, uRed, k);
    base = mix(uGreen * 1.0 + uYel * 0.4, base, smoothstep(0.34, 0.47, v));
    base *= 0.88 + 0.24 * vn(vec2(lu * 24.0, v * 38.0));
    float mid = 1.0 - smoothstep(0.016, 0.016 + aa, abs(fl - 0.5));
    float sec = 1.0 - smoothstep(0.008, 0.008 + aa, min(abs(fl - 0.2), abs(fl - 0.8)));
    float sn = 1.0 - smoothstep(0.010, 0.010 + aa, min(fl, 1.0 - fl));
    // side veins that leave the mid-vein toward the margin on the flare
    float herr = abs(fract(v * 16.0 - abs(fl - 0.5) * 5.0) - 0.5);
    float side = (1.0 - smoothstep(0.06, 0.06 + fwv * 16.0 + 0.02, herr)) * smoothstep(0.7, 0.9, v) * 0.35;
    float vein = max(max(mid, 0.75 * sn), max(0.6 * sec, side)) * clamp(0.035 / aa, 0.0, 1.0);
    vec3 veinCol = mix(uGreen * 0.7, uRed * 0.42, smoothstep(0.6, 0.95, v));
    base = mix(base, veinCol, vein * (0.8 - 0.35 * smoothstep(1.0, 1.7, v)));
    tr = 1.0 - 0.45 * vein;
    base *= 1.0 + vTint.z;
  } else if (vPart < 1.5) {
    float rib = 0.5 + 0.5 * cos(lu * 6.2832);
    base = mix(uGreen * 0.62, uGreen * 1.15 + uYel * 0.16, rib * 0.7 + 0.3 * vn(vec2(lu * 9.0, v * 30.0)));
    base = mix(base, uYel * 0.6 + uGreen * 0.5, smoothstep(0.34, 0.46, v) * 0.5);
    tr = 0.5;
  } else if (vPart < 2.5) {
    float anth = smoothstep(1.8, 1.88, v) * (1.0 - step(2.0, v)) + smoothstep(2.8, 2.9, v);
    base = mix(uYel * 0.55 + uMist * 0.45, v > 2.0 ? uGreen * 1.3 : uMist * 0.9 + uYel * 0.2, anth);
    tr = 0.15;
  } else {
    base = mix(uGreen * 0.8, uDeep * 1.5 + uGreen * 0.3, 0.4);
    tr = 0.0;
  }
  float ndl = dot(N, L);
  float dif = max(ndl, 0.0) * sunVis;
  float back = max(-ndl, 0.0) * sunVis;
  vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  float deep = front ? 1.0 : mix(0.34, 1.0, smoothstep(0.35, 1.0, v));        // darker up the tube
  vec3 tcol = base * (0.35 + 1.5 * base);                                      // light that came through a petal
  float vb = max(dot(V, L) * -1.0, 0.0); vb *= vb;                              // the sun is beyond the flower
  vec3 col = base * (amb * deep + uSunCol * dif * (front ? 1.0 : 0.55));
  col += tcol * uSunCol * tr * uGlow * (back * (0.5 + 1.5 * vb) + (front ? 0.05 : 0.2 * (0.3 + 0.7 * sunVis)));
  col += tcol * uSunCol * tr * uGlow * vb * (0.3 + 0.6 * vb) * (0.35 + 0.65 * sunVis) * (front ? 1.0 : 1.5 + 1.2 * (1.0 - smoothstep(0.45, 1.25, v)));
  float fres = 1.0 - abs(dot(N, V)); fres = fres * fres * fres;
  col += tcol * uSunCol * tr * fres * (0.10 + 0.9 * back + 0.5 * vb * sunVis);
  float rim = smoothstep(1.72, 2.0, v) * step(vPart, 0.5);
  col += tcol * uSunCol * rim * uGlow * (0.22 + 1.5 * back * (0.35 + vb));
  vec3 H = normalize(L + V + vec3(0.0, 1e-4, 0.0));
  float ndh = max(dot(N, H), 0.0); float sp = ndh * ndh; sp *= sp; sp *= sp; sp *= sp; sp *= sp * sp; sp *= sp;
  col += (uSunCol * 0.3 + tcol * uSunCol * 0.9) * sp * (0.2 + 0.4 * uWet) * sunVis * (front ? 1.0 : 0.3);
  // beads of water on the petals, only close up
  float kNear = (1.0 - smoothstep(7.0, 18.0, dist)) * step(vPart, 1.5);
  if (kNear > 0.0) {
    vec2 q = vec2(lu * 4.0, v * 13.0) + 0.7 * vn(vec2(lu * 2.0, v * 5.0)); vec2 ci = floor(q); vec2 cf = fract(q) - 0.5;
    float rr = h21(ci + 0.37); vec2 dv = cf - (vec2(h21(ci + 7.1), h21(ci + 3.7)) - 0.5) * 0.44;
    float rad = 0.10 + 0.20 * rr * rr, bd = length(dv);
    float bead = step(0.5 - 0.3 * uWet, rr) * (1.0 - smoothstep(rad * 0.8, rad, bd));
    float spot = 1.0 - smoothstep(0.0, rad * 0.35, length(dv - vec2(-0.3, 0.3) * rad));
    float glint = 1.0 - smoothstep(0.0, rad * 0.55, length(dv + vec2(-0.3, 0.3) * rad));
    float ring = smoothstep(rad * 0.45, rad, bd);
    col = mix(col, col * (1.25 - 0.7 * ring) + tcol * 0.3 * glint, bead * kNear);
    col += uSunCol * spot * bead * kNear * (0.4 + 2.2 * max(dif, back));
  }
  gl_FragColor = vec4(col, 1.0);
  #if defined(USE_FOG) && defined(FOG_EXP2)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uFogCut));   // the tree shows through the mist a little further than its neighbours
  #elif defined(USE_FOG)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
  #endif
}`;

// ---- leaves (instanced) and epiphytes (merged: moss beards, bromeliads) -------------------------
// aLf = phase, sun visibility, kind (0 leaf, 1 moss beard, 2 bromeliad), flex
const FOL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_WIND}
attribute vec2 aUV; attribute vec4 aLf;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec4 vLf;
void main() {
  vec3 p = position; vec3 n = normal;
  #ifdef USE_INSTANCING
    vec3 org = instanceMatrix[3].xyz; mat3 im = mat3(instanceMatrix);
    float g = gustAt(org, uTime);
    float fl = aLf.w * (0.45 + 1.7 * g);
    float tw = fl * 0.45 * sin(uTime * (2.1 + aLf.x) + aLf.x * 40.0) * aUV.y;
    float bob = fl * 0.20 * sin(uTime * 1.6 + aLf.x * 23.0) + fl * 0.10 * g;
    float c = cos(tw), s = sin(tw);
    p = vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x); n = vec3(c * n.x + s * n.z, n.y, c * n.z - s * n.x);
    c = cos(bob); s = sin(bob);
    p = vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); n = vec3(n.x, c * n.y - s * n.z, s * n.y + c * n.z);
    p = org + im * p; n = im * n;
  #else
    float g = gustAt(p, uTime);
    float f = aLf.w * aUV.y * aUV.y;
    p.xz += uWindDir.xz * (f * (0.4 + 2.4 * g) * (0.7 + 0.3 * sin(uTime * 1.3 + aLf.x * 30.0)));
    p.xz += f * 0.3 * vec2(sin(uTime * 1.1 + aLf.x * 17.0), cos(uTime * 0.9 + aLf.x * 11.0));
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * n; vUv = aUV; vLf = aLf;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FOL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
uniform vec3 uGreen, uDeep, uMist, uYel, uRed;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec4 vLf;
void main() {
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  bool front = gl_FrontFacing; if (!front) N = -N;
  vec3 toCam = cameraPosition - vWP; float dist = length(toCam);
  vec3 V = toCam / max(dist, 1e-4);
  vec3 L = uSunDir;
  float kind = vLf.z, sunVis = vLf.y, ph = vLf.x;
  vec3 base; float tr = 0.8, gloss = 1.0, hq = 0.0, kN = 0.0, veinK = 0.0;
  if (kind < 0.5) {
    float ax = abs(vUv.x);
    kN = 1.0 - smoothstep(11.0, 26.0, dist);
    vec3 top = mix(uDeep * 2.8, uGreen * 0.74, 0.15 + 0.6 * ph);
    vec3 under = mix(uGreen * 0.8, uMist, 0.14);                                  // felted underside
    base = front ? top : under;
    float midrib = 1.0 - smoothstep(0.03, 0.08, ax);
    float sv = abs(fract(vUv.y * 7.0 - ax * 1.6) - 0.5);
    float veins = (1.0 - smoothstep(0.05, 0.13, sv)) * 0.45;
    base = mix(base, mix(uGreen * 1.2 + uYel * 0.2, uMist * 0.7, front ? 0.1 : 0.3), max(midrib, veins) * 0.36);
    base *= 0.8 + 0.4 * vn(vUv * vec2(5.0, 9.0) + ph * 31.0);
    // close to: the blade is quilted between its side veins, the midrib lies in a channel, the surface is felted
    float felt = vn(vUv * vec2(13.0, 31.0) + ph * 7.0);
    veinK = max(midrib, veins * 2.0) * kN;
    hq = (smoothstep(0.02, 0.42, sv) - midrib * 0.8) * (front ? 1.0 : -1.0);
    base *= 1.0 + kN * 0.12 * (felt - 0.5);
    if (ax > 1.0 - 0.17 * (0.5 + 0.5 * sin(vUv.y * 27.0 + ph * 40.0))) discard;      // wavy margin
    gloss = front ? 1.0 : 0.15;
  } else if (kind < 1.5) {
    // moss beard: ragged strands cut out of the ribbon
    float sx = vUv.x * 5.0 + ph * 13.0, id = floor(sx), fx = fract(sx) - 0.5;
    float strand = h21(vec2(id, floor(ph * 97.0)));
    float wav = 0.2 * sin(vUv.y * 7.0 + strand * 20.0);
    if (abs(fx + wav) > (0.14 + 0.2 * strand) * (1.0 - 0.7 * vUv.y) || vUv.y > 0.35 + 0.65 * strand) discard;
    base = mix(uGreen * 0.6 + uDeep * 0.8, uMist * 0.3 + uGreen * 0.5, vUv.y * 0.7 + 0.3 * strand);
    tr = 1.2; gloss = 0.0;
  } else {
    base = mix(uGreen * 1.05 + uYel * 0.08, uDeep * 1.6, 0.25 + 0.5 * abs(vUv.x));
    base = mix(uRed * 0.5 + uGreen * 0.3, base, smoothstep(0.02, 0.4, vUv.y));       // red-flushed heart
    base *= 0.85 + 0.3 * vn(vec2(vUv.x * 6.0, vUv.y * 14.0 + ph * 9.0));
  }
  float nz1 = vn(vUv * vec2(3.0, 5.0) + ph * 17.0), nz2 = vn(vUv * vec2(4.0, 3.0) - ph * 29.0);
  N = normalize(N + (vec3(nz1, nz2, nz1 * nz2 * 2.0) - 0.5) * 0.5 * gloss * (1.0 - 0.6 * kN) + vec3(0.0, 1e-5, 0.0));
  if (kN > 0.0) {
    vec3 sx = dFdx(vWP), sy = dFdy(vWP); float hx = dFdx(hq), hy = dFdy(hq);
    vec3 r1 = cross(sy, N), r2 = cross(N, sx); float det = dot(sx, r1);
    vec3 gq = (det < 0.0 ? -1.0 : 1.0) * (hx * r1 + hy * r2);
    N = normalize(abs(det) * N - 0.05 * kN * gq + vec3(0.0, 1e-7, 0.0));
  }
  float ndl = dot(N, L);
  float dif = max(ndl, 0.0) * sunVis, back = max(-ndl, 0.0) * sunVis;
  vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  vec3 tcol = (base * 0.6 + uGreen * 0.5 + uYel * 0.12) * (0.4 + base * 2.0);
  vec3 col = base * (amb * (0.9 + 0.5 * sunVis) + uSunCol * dif) + tcol * uSunCol * back * tr * 0.55;
  float fres = 1.0 - abs(dot(N, V)); fres *= fres;
  col += uSkyCol * fres * 0.05;
  // rim light: the sky along the turned edges of a near blade, the sun through its veins when it stands beyond the leaf
  col += kN * fres * (uSkyCol * 0.3 + tcol * uSunCol * (0.2 + 0.8 * back) * (0.5 + 0.5 * sunVis)) * (0.6 + 0.6 * veinK);
  col += kN * veinK * tcol * uSunCol * back * 0.25;
  vec3 H = normalize(L + V + vec3(0.0, 1e-4, 0.0));
  float ndh = max(dot(N, H), 0.0); float sp = ndh * ndh; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol * sp * gloss * (0.2 + 1.3 * uWet) * sunVis * nz1 * nz1 * (1.0 - 0.5 * kN);      // wet highlight (blooms)
  gl_FragColor = vec4(col, 1.0);
  #if defined(USE_FOG) && defined(FOG_EXP2)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uFogCut));   // the tree shows through the mist a little further than its neighbours
  #elif defined(USE_FOG)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
  #endif
}`;

// ---- bark, moss and the root rock --------------------------------------------------------------
// aM = moss amount, sun visibility, occlusion
const BARK_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec2 aUV; attribute vec3 aM;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec3 vM; varying vec3 vLP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz; vLP = position; vWN = mat3(modelMatrix) * normal; vUv = aUV; vM = aM;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BARK_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
uniform vec3 uGreen, uDeep, uMist, uYel;
varying vec2 vUv; varying vec3 vWN; varying vec3 vWP; varying vec3 vM; varying vec3 vLP;
void main() {
  vec3 N = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  vec3 toCam = cameraPosition - vWP;
  vec3 V = toCam / max(length(toCam), 1e-4);
  float u = vUv.x, v = vUv.y;
  // corky bark: long fissures, plates, pale lichen
  float f1 = vn(vec2(u * 18.0, v * 0.55)), f2 = vn(vec2(u * 43.0 + f1 * 2.0, v * 1.7));
  float fis = smoothstep(0.1, 0.7, abs(f1 - 0.5) * 2.0 * (0.6 + 0.8 * f2));
  vec3 cork = mix(vec3(0.085, 0.078, 0.068), vec3(0.27, 0.26, 0.235), fis * (0.5 + 0.5 * f2)) * (0.8 + 0.4 * vn(vec2(u * 70.0, v * 6.0)));
  float lich = smoothstep(0.62, 0.8, vn(vLP.xy * 0.45 + vLP.z * 0.3));
  cork = mix(cork, uMist * 0.62, lich * 0.55);
  // moss: on the weather side and the tops, in cushions
  float cush = vn(vLP.xz * 0.9 + vLP.y * 0.4), cush2 = vn(vLP.xz * 3.1 + vLP.y * 2.3);
  float mk = smoothstep(0.5, 0.72, vM.x * 0.5 + N.y * 0.55 + cush * 0.3 + cush2 * 0.14);
  vec3 moss = mix(uDeep * 2.0, uGreen * 0.8 + uYel * 0.05, cush2 * 0.65 + 0.35 * cush) * (0.6 + 0.8 * vn(vLP.xz * 9.0 + vLP.y * 7.0));
  vec3 base = mix(cork, moss, mk);
  float ndl = dot(N, uSunDir);
  float dif = max(ndl * (1.0 - 0.3 * mk) + 0.3 * mk, 0.0) * vM.y;                     // moss wraps the light
  vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5) * vM.z;
  vec3 col = base * (amb + uSunCol * dif * (0.55 + 0.45 * fis));
  float fres = 1.0 - abs(dot(N, V)); fres *= fres;
  col += (uGreen * 0.5 + uYel * 0.18) * uSunCol * fres * mk * (0.12 + 0.5 * vM.y);    // lit velvet on the moss edge
  col += uSkyCol * fres * (1.0 - mk) * 0.05 * (0.5 + uWet);
  gl_FragColor = vec4(col, 1.0);
  #if defined(USE_FOG) && defined(FOG_EXP2)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uFogCut));   // the tree shows through the mist a little further than its neighbours
  #elif defined(USE_FOG)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
  #endif
}`;

// ---- drops: lens sprites riding the swing of their bell, then falling ---------------------------
// aLife = phase, period (s), radius (m), sun visibility
const DROP_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_WIND}
attribute vec3 aPiv, aRel; attribute vec4 aSw, aLife;
uniform vec2 uRes; uniform float uGrav;
varying vec2 vQ; varying float vA; varying float vSun;
void main() {
  float c = fract(uTime / aLife.y + aLife.x);
  float tf = max(c - 0.72, 0.0) * aLife.y;                 // seconds since it let go
  vec4 aa = swingAA(aPiv, aSw, uTime - tf);               // the swing is frozen at the moment of release
  vec3 p = aPiv + rotAA(aRel, aa);
  float sz = aLife.z * (0.3 + 0.7 * smoothstep(0.0, 0.72, c)) * (1.0 + 0.05 * sin(uTime * 9.0 + aLife.x * 50.0));
  p.y -= 0.5 * uGrav * tf * tf + sz * 0.8;
  float span = aLife.y * 0.28;
  float fade = 1.0 - smoothstep(span * 0.55, span, tf);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
  float d = max(-mvPosition.z, 0.05);
  float px = sz * projectionMatrix[1][1] / d * uRes.y * 0.5;
  float k = max(1.0, 1.25 / max(px, 1e-3));               // never thinner than a pixel and a quarter
  vA = fade * clamp(2.5 / (k * k), 0.0, 1.0) * smoothstep(0.1, 0.6, d) * (1.0 - smoothstep(0.018, 0.05, px / uRes.y));   // a drop about to fill the lens goes out instead
  vSun = aLife.w; vQ = position.xy;
  float stretch = 1.0 + min(tf * 1.2, 1.0);
  mvPosition.xy += position.xy * sz * k * vec2(1.0, stretch);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DROP_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec2 uSunV;
varying vec2 vQ; varying float vA; varying float vSun;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
  // a water globe shows the world upside down: bright sky at the bottom, dark forest at the top
  vec3 env = mix(uGroundCol * 0.7, uSkyCol * 1.5, smoothstep(-0.55, 0.5, -vQ.y));
  float rim = smoothstep(0.5, 1.0, r2);
  vec3 col = env * (1.0 - 0.7 * rim);
  float spec = 1.0 - smoothstep(0.0, 0.34, length(vQ - uSunV * 0.5)); spec *= spec;
  float caus = 1.0 - smoothstep(0.0, 0.5, length(vQ + uSunV * 0.55));
  col += uSunCol * (spec * 3.2 + caus * 0.5) * (0.25 + 0.75 * vSun);
  gl_FragColor = vec4(col, vA * (0.5 + 0.5 * max(rim, spec)));
  #if defined(USE_FOG) && defined(FOG_EXP2)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uFogCut));   // the tree shows through the mist a little further than its neighbours
  #elif defined(USE_FOG)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
  #endif
}`;

// ---- mist rising through the crown, and sun shafts under it -------------------------------------
const MIST_VS = /* glsl */`
#include <common>
uniform float uTime; uniform vec3 uWindDir;
attribute vec4 aA, aB;      // aA = base xyz + size, aB = phase, speed, seed, alpha
varying vec2 vQ; varying float vA; varying float vSeed;
void main() {
  float c = fract(uTime * aB.y + aB.x);
  vec3 p = aA.xyz + vec3(uWindDir.x * 26.0, 78.0, uWindDir.z * 26.0) * c;
  p.xz += 3.0 * vec2(sin(c * 6.0 + aB.z * 9.0), cos(c * 5.0 + aB.z * 7.0));
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  float d = -mv.z;
  vA = aB.w * sin(c * 3.14159) * smoothstep(8.0, 30.0, d) * (1.0 - 0.8 * smoothstep(105.0, 150.0, d));     // from far off the rising mist would only veil the crown
  vQ = position.xy; vSeed = aB.z + c * 0.6;
  mv.xy += position.xy * aA.w * (0.8 + 0.5 * c);
  gl_Position = projectionMatrix * mv;
}`;
const MIST_FS = /* glsl */`
${GLSL_NOISE}
${GLSL_LIGHT}
uniform vec3 uMist;
varying vec2 vQ; varying float vA; varying float vSeed;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
  float n = vn(vQ * 1.7 + vSeed * 7.0) * 0.6 + vn(vQ * 3.9 - vSeed * 3.0) * 0.4;
  float a = (1.0 - r2); a = a * a * smoothstep(0.2, 0.75, n + 0.25 * (1.0 - r2));
  vec3 col = uMist * (uSkyCol * 0.9 + uSunCol * 0.2 * (0.6 + 0.4 * vQ.y));
  gl_FragColor = vec4(col, a * vA);
}`;
// the crown's own shade, seen from far off: soft dark-green discs standing behind the leaves and bells on the far side of
// the crown, so that the gaps between them show foliage in shadow and not bright mist. aA = xyz + size, aB = seed, alpha
const DEEP_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aA; attribute vec2 aB;
uniform float uScale;
varying vec2 vQ; varying float vA; varying float vSeed;
void main() {
  vec4 mv = viewMatrix * modelMatrix * vec4(aA.xyz, 1.0);
  vA = aB.y * uScale; vQ = position.xy; vSeed = aB.x;
  mv.xy += position.xy * aA.w;
  vec4 mvPosition = mv;
  gl_Position = projectionMatrix * mv;
  #include <fog_vertex>
}`;
const DEEP_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
uniform vec3 uGreen, uDeep;
varying vec2 vQ; varying float vA; varying float vSeed;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
  float n = vn(vQ * 2.3 + vSeed * 7.0) * 0.6 + vn(vQ * 5.1 - vSeed * 3.0) * 0.4;
  float a = smoothstep(0.0, 0.5, (1.0 - r2) + (n - 0.5) * 0.9);
  vec3 col = (uDeep * 1.5 + uGreen * 0.22 * n) * (uSkyCol * 0.9 + uGroundCol * 0.5 + uSunCol * 0.07);
  gl_FragColor = vec4(col, a * vA);
  #if defined(USE_FOG) && defined(FOG_EXP2)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uFogCut));
  #endif
}`;
const SHAFT_VS = /* glsl */`
#include <common>
uniform float uTime; uniform vec3 uSunL, uCamL;       // sun direction and camera in the mesh's own space
attribute vec4 aA, aB;      // aA = top xyz + length, aB = width, seed, gain, 0
varying vec2 vQ; varying float vA;
void main() {
  vec3 top = aA.xyz + vec3(sin(uTime * 0.07 + aB.y * 9.0), 0.0, cos(uTime * 0.06 + aB.y * 5.0)) * 2.5;   // shafts slide as the cloud moves
  vec3 c = top - uSunL * (aA.w * (0.5 - 0.5 * position.y));
  vec3 side = cross(uSunL, uCamL - c) + vec3(1e-4, 0.0, 1e-4);
  side = normalize(side);
  vec3 p = c + side * position.x * aB.x * (0.7 + 0.3 * (0.5 - 0.5 * position.y));
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  float breathe = 0.6 + 0.4 * sin(uTime * 0.23 + aB.y * 20.0);
  vA = aB.z * breathe * smoothstep(6.0, 26.0, -mv.z) * (1.0 - smoothstep(95.0, 140.0, -mv.z));
  vQ = position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const SHAFT_FS = /* glsl */`
${GLSL_LIGHT}
varying vec2 vQ; varying float vA;
void main() {
  float e = 1.0 - vQ.x * vQ.x; e *= e;
  float l = smoothstep(-1.0, -0.2, vQ.y) * (1.0 - smoothstep(0.75, 1.0, vQ.y));
  gl_FragColor = vec4(uSunCol * (e * l * vA), 1.0);
}`;

// =================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('swordbill-tree');
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const [cPearl, cMist, cGreen, cDeep, cYel, cRed] = pal;
  const hour = opts.hour || 'morning', weather = opts.weather || 'mist', bloomForm = opts.bloom || 'scarlet';
  const yaw = opts.yaw ?? Math.PI / 4;
  const HOURS = {
    morning: { dir: [0.53, 0.848, 0.0], col: '#fff1da', gain: 1.6, sky: 0.4, ground: 0.3, shafts: 1, tint: [1, 1, 1] },
    dawn: { dir: [0.96, 0.2, 0.18], col: '#ffb49a', gain: 1.15, sky: 0.4, ground: 0.26, shafts: 0.5, tint: [1.08, 0.94, 0.98] },
    afternoon: { dir: [-0.94, 0.342, 0.0], col: '#ffbe6e', gain: 1.4, sky: 0.42, ground: 0.3, shafts: 1, tint: [1.04, 1, 0.94] },
    bluehour: { dir: [-0.9, 0.3, 0.3], col: '#8fa8ff', gain: 0.4, sky: 0.22, ground: 0.12, shafts: 0, tint: [0.62, 0.78, 1.25] },
  };
  const H = HOURS[hour] || HOURS.morning;
  const wet = weather === 'drizzle' ? 1 : weather === 'clear' ? 0.25 : 0.6;
  const toT = (v) => v.clone().applyAxisAngle(UP, -yaw), toO = (v) => v.clone().applyAxisAngle(UP, yaw);
  const sunW = V3(...(opts.sunDir || H.dir)).normalize();
  const sunT = toT(sunW);                       // sun in the tree's own frame (lean = +Z), for the baked canopy shade
  const eastT = toT(V3(1, 0, 0)), westT = toT(V3(-1, 0, 0));

  // ---- the lines the camera will fly, in the tree frame (x lateral, y up, z down-lean) ----------
  const N0 = V3(0, 13, 40), PS = V3(0, 65, 10), naveDir = PS.clone().sub(N0).normalize();
  const CC = V3(0, 40, 26);                                             // crown centre
  const ax3 = V3(0, -0.788, 0.616), M3 = V3(4.7, 16, 39.5);             // throat bell: axis pivot->mouth, mouth centre
  const ax1 = V3(0, -1, 0).multiplyScalar(0.9).addScaledVector(eastT, 0.44).normalize();
  const M1 = V3(0, 19, 26).addScaledVector(eastT, 29);
  const look2 = V3(0, 0.45, 0.893), M2 = V3(0, 37, 26).addScaledVector(westT, 27);
  const stops = [
    { key: 'stopSun', M: M1, axis: ax1, len: 4.4, view: M1.clone().addScaledVector(eastT, 2.1).add(V3(0, -0.5, 0)), approach: M1.clone().addScaledVector(eastT, 12).add(V3(0, 0.6, 0)) },
    { key: 'stopBacklit', M: M2, axis: V3(0.12, -0.97, -0.2).normalize(), len: 4.5, view: M2.clone().addScaledVector(look2, -2.2), approach: M2.clone().addScaledVector(look2, -12) },
    { key: 'stopThroat', M: M3, axis: ax3, len: 5.0, view: M3.clone().addScaledVector(ax3, 2.0), approach: M3.clone().addScaledVector(ax3, 12) },
  ];
  const U0 = V3(-7, -9, 62), U1 = V3(3.5, -3, 54);
  const corridor = [stops[2].approach.clone().addScaledVector(ax3, 4), stops[2].approach, stops[2].view, N0, PS];
  const stopLines = stops.map((s) => [s.approach, s.view]);
  const clearOf = (p) => distPoly(p, corridor);
  const stopClear = (p) => Math.min(distPoly(p, stopLines[0]), distPoly(p, stopLines[1]), distPoly(p, stopLines[2]));
  // the world's own route round the tree (opts.route(anchors) -> polylines in object space): twigs, leaves and bells keep off it too
  const preStop = (s) => ({ flower: toO(s.M), view: toO(s.view), approach: toO(s.approach), axis: toO(s.axis), pivot: toO(s.M.clone().addScaledVector(s.axis, -s.len)), length: s.len });
  const routeLines = (opts.route ? opts.route({ portalSeat: { position: toO(PS), normal: toO(naveDir).negate(), radius: 7 }, naveFoot: toO(N0), flyThrough: corridor.map(toO),
    stopSun: preStop(stops[0]), stopBacklit: preStop(stops[1]), stopThroat: preStop(stops[2]) }) || [] : []).map((poly) => poly.map((q) => toT(q)));
  const routeBox = routeLines.map((l) => new THREE.Box3().setFromPoints(l).expandByScalar(15));
  const routeClear = (p) => { let d = 99; for (let k = 0; k < routeLines.length; k++) if (routeBox[k].containsPoint(p)) d = Math.min(d, distPoly(p, routeLines[k])); return d; };
  // opts.avoid: lines the world flies that the tree was not grown round. What stands in their way is left undrawn after the
  // fact (b.drawN, .cut), and every random draw of the build is still made, so the tree is the same tree with a way cut through it
  const avoidLines = ((typeof opts.avoid === 'function' ? opts.avoid() : opts.avoid) || []).map((poly) => poly.map((q) => toT(q)));      // a function is asked after opts.route
  const avoidBox = avoidLines.map((l) => new THREE.Box3().setFromPoints(l).expandByScalar(13));
  const avoidClear = (p) => { let d = 99; for (let k = 0; k < avoidLines.length; k++) if (avoidBox[k].containsPoint(p)) d = Math.min(d, distPoly(p, avoidLines[k])); return d; };
  // opts.sight: cones of sight to the portal seat from places the world names; what stands in them is left undrawn in the same way
  const sightCones = ((typeof opts.sight === 'function' ? opts.sight() : opts.sight) || []).map((c) => { const a = toT(c.from), ax = PS.clone().sub(a); return { a, ax, l2: Math.max(1e-6, ax.lengthSq()), r: c.r ?? 7.8, t1: c.to ?? 1.03, lvl: c.cut === 'leaves' ? 0 : c.cut === 'twigs' ? 1 : 2 }; });
  const _sv = V3();
  // need: 0 a leaf cluster or a beard, 1 a twig or a bell, 2 a bough; a cone cuts what its `cut` says ('leaves', 'twigs', or all)
  const inSight = (p, pad, need = 0) => {
    for (const c of sightCones) {
      if (need > c.lvl) continue;
      _sv.subVectors(p, c.a); const t = _sv.dot(c.ax) / c.l2; if (t < 0.05 || t > c.t1) continue;
      _sv.addScaledVector(c.ax, -t); if (_sv.length() < c.r * t + pad) return true;
    }
    return false;
  };
  const rz = ctx.core ? ctx.core.makeRng(ctx.core.hashSeed("swordbill-feeder:" + ctx.seed)) : rng;      // the young tree's own draws
  const _n = V3(), _a = V3();
  const pushFrom = (p, line, need) => {          // move a point off a polyline to the wanted clearance
    let best = Infinity;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1]; _a.subVectors(b, a);
      const t = Math.min(1, Math.max(0, p.clone().sub(a).dot(_a) / Math.max(_a.lengthSq(), 1e-9)));
      const q = a.clone().addScaledVector(_a, t), d = q.distanceTo(p);
      if (d < best) { best = d; _n.copy(q); }
    }
    if (best < need) { const dir = p.clone().sub(_n); if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0); p.addScaledVector(dir.normalize(), need - best); }
  };
  const pushOut = (p, need) => {                 // off the corridor, the stop approaches and the world's route
    pushFrom(p, corridor, need);
    for (const l of stopLines) pushFrom(p, l, 3.7);
    for (let k = 0; k < routeLines.length; k++) if (routeBox[k].containsPoint(p)) pushFrom(p, routeLines[k], 6.8);
  };

  // the sight cone: the world's rise spirals under the foot of the nave, within 13 m of the line the nave would follow if it went
  // on down, and the portal is its window from there. sightGap(p) = metres p stands outside every line of sight (negative inside)
  const sightGap = (p) => {
    const dx = p.x - N0.x, dy = p.y - N0.y, dz = p.z - N0.z, a = dx * naveDir.x + dy * naveDir.y + dz * naveDir.z;
    if (a < -26 || a > 57) return 99;
    return Math.hypot(dx - naveDir.x * a, dy - naveDir.y * a, dz - naveDir.z * a) - (12.5 * (60 - a) + 4 * (a + 18)) / 78;
  };

  await ctx.yield();
  // ---- skeleton -------------------------------------------------------------------------------
  const branches = [];
  const jit = (v, a) => v.add(V3(rng.range(-a, a), rng.range(-a, a) * 0.6, rng.range(-a, a)));
  const addBranch = (ctrl, r0, r1, level, step) => {
    let len = 0; for (let i = 1; i < ctrl.length; i++) len += ctrl[i].distanceTo(ctrl[i - 1]);
    let pts = spaced(ctrl, Math.max(3, Math.round(len / step)));
    if (level <= 1) {
      for (let i = 1; i < pts.length; i++) pushOut(pts[i], 6.8 + r0);
      if (level === 1) {                          // a bough stops short of a flower stop and of the world's route instead of running beside it
        let cut = pts.length;
        for (let i = 2; i < pts.length; i++) if (stopClear(pts[i]) < 7.5 || routeClear(pts[i]) < 7.2) { cut = i; break; }
        pts = pts.slice(0, Math.max(3, cut));
      }
    } else {
      let cut = pts.length;
      for (let i = 1; i < pts.length; i++) if (clearOf(pts[i]) < 6.6 || stopClear(pts[i]) < 3.2 || routeClear(pts[i]) < 6.2 || sightGap(pts[i]) < 0.6) { cut = i; break; }
      if (cut < 3) return null; pts = pts.slice(0, cut);
    }
    const b = { pts, r0, r1, level, len }; branches.push(b); return b;
  };
  const onB = (b, t) => b.pts[Math.min(b.pts.length - 1, Math.round(t * (b.pts.length - 1)))].clone();

  const forkY = rng.range(21, 24), F = V3(rng.range(-0.6, 0.6), forkY, forkY * 0.577);
  const trunk = addBranch([V3(0, -2.5, -1.2), V3(rng.range(-0.5, 0.5), 7, 3.6 + rng.range(-0.5, 0.5)), V3(rng.range(-0.7, 0.7), 15, 8.9), F], 2.1, 1.9, 0, 1.9);
  const limbs = [], sideB = [];
  const longSide = rng.sign();
  for (const s of [-1, 1]) {
    const sp = rng.range(9.8, 11.2), ls = s === longSide ? 1.06 : 0.95;
    const limb = addBranch([F.clone().add(V3(0.5 * s, -1.2, -0.6)), V3(6 * s, 31, 17), V3(sp * s, 41, 24), jit(V3((sp + 1) * s, 51, 32), 0.8),
      jit(V3((sp + 2) * s, 41 + 17 * ls, 24 + 17 * ls), 1.0), jit(V3((sp + 3) * s, 41 + 20 * ls, 24 + 26 * ls), 1.2)], 1.5, 0.6, 0, 1.7);
    limbs.push(limb);
    const bough = (start, pts, r0 = 0.66) => addBranch([start, ...pts.map((p) => jit(V3(p[0] * s, p[1], p[2]), 1.1))], r0, 0.2, 1, 1.7);
    const B1 = bough(onB(limb, 0.42), [[11, 50, 19], [10.5, 59, 13], [10, 66, 6], [8, 71, -3]], 0.85);
    const B2 = bough(onB(limb, 0.40), [[11, 37, 31], [11.5, 29, 38], [12, 21, 44], [12, 14, 49]], 0.78);
    const list = [B1, B2,
      bough(onB(limb, 0.45), [[17, 45, 22], [24, 46, 19], [30, 41, 15]]),
      bough(onB(limb, 0.64), [[18, 55, 34], [25, 54, 38], [31, 47, 41]]),
      bough(onB(limb, 0.84), [[17, 60, 47], [22, 57, 54], [24, 49, 60]]),
      bough(onB(limb, 1.0), [[11, 59, 57], [8, 53, 63]], 0.5),
      bough(onB(limb, 0.19), [[13, 31, 14], [20, 27, 10], [26, 20, 6]]),
      bough(onB(B2, 0.5), [[17, 26, 43], [22, 20, 48], [25, 13, 53]], 0.45),
      bough(onB(limb, 0.22), [[11, 38, 12], [16, 44, 8], [20, 47, 3], [23, 45, -4]]),
      bough(onB(limb, 0.75), [[9, 66, 38], [6, 72, 33], [3, 75, 27]], 0.45),
      // the roof of the nave and the ring round the portal
      bough(onB(limb, 0.64), [[7, 55, 35], [2.2, 57, 38]], 0.4),
      bough(onB(B2, 0.25), [[6, 41, 34], [1.6, 43, 37]], 0.4),
      bough(onB(B2, 0.5), [[6, 32, 43], [1.6, 33, 46.5]], 0.38),
      bough(onB(B1, 0.75), [[8, 70, 13], [4, 71.5, 18], [0.7, 70.5, 19.5]], 0.4),
      bough(onB(B1, 0.5), [[8, 58, 6], [4, 58.5, 2], [0.7, 59, 1]], 0.4),
    ];
    sideB.push(list);
    await ctx.yield();
  }
  await ctx.yield();
  // branchlets (level 2) and their spurs (level 3), grown outward and drooping
  const _o = V3();
  for (const b of branches.slice()) {
    if (b === trunk) continue;
    const start = b.level === 0 ? Math.floor(b.pts.length * 0.38) : Math.max(2, Math.floor(b.pts.length * 0.18));
    for (let i = start; i < b.pts.length; i += 2) {
      if (!rng.chance(0.9)) continue;
      const p = b.pts[i], tan = b.pts[Math.min(b.pts.length - 1, i + 1)].clone().sub(b.pts[i - 1]).normalize();
      _o.subVectors(p, CC); _o.y *= 0.45; _o.normalize();
      const dir = _o.clone().multiplyScalar(0.9).addScaledVector(tan, 0.4).add(V3(rng.range(-0.7, 0.7), rng.range(-0.5, 0.35), rng.range(-0.7, 0.7))).normalize();
      const L = rng.range(5.5, 10.5) * (i === b.pts.length - 1 ? 0.8 : 1);
      const c = [p.clone(), p.clone().addScaledVector(dir, L * 0.4).add(V3(0, 0.7, 0)), p.clone().addScaledVector(dir, L * 0.75).add(V3(0, -L * 0.1, 0)), p.clone().addScaledVector(dir, L).add(V3(0, -L * 0.38, 0))];
      const bl = addBranch(c, 0.25, 0.085, 2, 1.8);
      if (bl) { bl.parent = b; bl.parentIdx = i; }
      if (!bl || bl.pts.length < 4) continue;
      const q = onB(bl, rng.range(0.35, 0.7)), d2 = dir.clone().applyAxisAngle(UP, rng.sign() * rng.range(0.7, 1.3));
      const L2 = rng.range(3, 5.2);
      const sp = addBranch([q, q.clone().addScaledVector(d2, L2 * 0.5).add(V3(0, 0.2, 0)), q.clone().addScaledVector(d2, L2).add(V3(0, -L2 * 0.35, 0))], 0.125, 0.055, 3, 1.6);
      if (sp) { sp.parent = bl; sp.parentIdx = 0; for (let k = 0; k < bl.pts.length; k++) if (bl.pts[k].distanceToSquared(q) < 1e-6) sp.parentIdx = k; }
    }
    await ctx.yield();
  }
  await ctx.yield();
  if (avoidLines.length || sightCones.length) for (const b of branches) {
    if (b === trunk || b.level === 0) continue;
    if (b.parent && b.parent.drawN != null && b.parentIdx >= b.parent.drawN - 1) { b.drawN = 0; continue; }
    const need = b.level === 1 ? 5.0 + b.r0 : 4.6;
    for (let i = 0; i < b.pts.length; i++) if (avoidClear(b.pts[i]) < need || inSight(b.pts[i], 0.5 + (b.level === 1 ? b.r0 : 0.2), b.level === 1 ? 2 : 1)) { b.drawN = i < 2 ? 0 : i; break; }
  }

  // ---- where the trumpets hang ------------------------------------------------------------------
  const radAt = (b, i) => b.r0 + (b.r1 - b.r0) * Math.pow(i / Math.max(1, b.pts.length - 1), 0.8);
  const major = [], nodes = [];
  for (const b of branches) for (let i = 0; i < b.pts.length; i++) {
    if (b.level <= 1) major.push({ p: b.pts[i], r: radAt(b, i) });
    if (b !== trunk && (b.level >= 1 ? i >= 1 : i > b.pts.length * 0.35)) nodes.push({ p: b.pts[i], level: b.level, end: i === b.pts.length - 1, gone: b.drawN != null && i >= b.drawN });
  }
  const bells = [];
  const bellFits = (piv, axis, len, isStop) => {
    const pt = V3();
    for (const k of [0.12, 0.55, 1.0]) {
      pt.copy(piv).addScaledVector(axis, len * k);
      if (!isStop && (clearOf(pt) < 4.5 + 0.9 * k || stopClear(pt) < 2.5 || routeClear(pt) < 5.2 + 0.9 * k || sightGap(pt) < 1.0)) return false;
      for (const m of major) if (pt.distanceTo(m.p) < m.r + 0.4 + 1.0 * k) return false;
    }
    for (const o of bells) {
      if (o.piv.distanceToSquared(piv) < 6.2) return false;
      if (o.mouth.distanceToSquared(pt) < 4.4) return false;
    }
    return true;
  };
  const nearestNode = (p, maxD) => {
    let best = null, bd = maxD;
    for (const n of nodes) { if (n.p.y < p.y - 0.5) continue; const d = n.p.distanceTo(p); if (d < bd) { bd = d; best = n; } }
    return best;
  };
  const addBell = (piv, axis, len, lod, node, extra = {}) => {
    const b = { piv, axis, len, lod, node, mouth: piv.clone().addScaledVector(axis, len), ...extra };
    bells.push(b); return b;
  };
  // the three stop flowers and the backlit group of five
  for (const s of stops) {
    const piv = s.M.clone().addScaledVector(s.axis, -s.len);
    s.bell = addBell(piv, s.axis, s.len, 2, nearestNode(piv, 60), { stop: s.key });
  }
  stops[1].group = [stops[1].bell];
  for (const o of [[-2.7, 1.3, 2.2], [2.6, 2.1, 2.9], [-0.9, 3.3, 5.2], [3.7, 0.3, 5.8]]) {
    const len = rng.range(3.8, 4.4), axis = V3(rng.range(-0.15, 0.15), -1, rng.range(-0.2, 0.05)).normalize();
    const M = stops[1].M.clone().add(V3(o[0], o[1], o[2])), piv = M.clone().addScaledVector(axis, -len);
    stops[1].group.push(addBell(piv, axis, len, 1, nearestNode(piv, 60), { stop: 'group' }));
  }
  // forty in the nave: two walls and a roof round the climb, none on its floor
  const e2 = V3(0, 0.5, 0.866);
  await ctx.yield();
  for (let tries = 0, got = 0; tries < 900 && got < 40; tries++) {
    if ((tries & 31) === 31) await ctx.yield();
    const a = rng.range(0.04, 0.94) * 60, ph = rng.range(-0.75, Math.PI + 0.75), rad = Math.max(rng.range(5.7, 8.2), (12.5 * (60 - a) + 4 * (a + 18)) / 78 + 1.3);   // the walls flare toward the foot: a horn
    const M = N0.clone().addScaledVector(naveDir, a).add(V3(Math.cos(ph) * rad, 0, 0)).addScaledVector(e2, Math.sin(ph) * rad);
    const len = rng.range(3.7, 4.5), axis = V3(rng.range(-0.18, 0.18) - Math.cos(ph) * 0.1, -1, rng.range(-0.15, 0.2)).normalize();
    const piv = M.clone().addScaledVector(axis, -len);
    if (!bellFits(piv, axis, len, false)) continue;
    const node = nearestNode(piv, 13); if (!node) continue;
    addBell(piv, axis, len, 1, node, { nave: true }); got++;
  }
  // a ring round the foot of the horn, just outside the lines of sight: what the rise looks up at from below
  for (let tries = 0, got = 0; tries < 500 && got < 18; tries++) {
    if ((tries & 31) === 31) await ctx.yield();
    const a = rng.range(-9, 12), ph = rng.range(0, 6.283), rad = (12.5 * (60 - a) + 4 * (a + 18)) / 78 + rng.range(1.3, 4.6);
    const M = N0.clone().addScaledVector(naveDir, a).add(V3(Math.cos(ph) * rad, 0, 0)).addScaledVector(e2, Math.sin(ph) * rad);
    const len = rng.range(3.8, 4.7), axis = V3(rng.range(-0.15, 0.15), -1, rng.range(-0.15, 0.15)).normalize();
    const piv = M.clone().addScaledVector(axis, -len);
    if (!bellFits(piv, axis, len, false)) continue;
    const node = nearestNode(piv, 14); if (!node) continue;
    addBell(piv, axis, len, 1, node, { nave: true }); got++;
  }
  await ctx.yield();
  // the rest of the three hundred, hung under branchlets all through the crown
  const target = Math.round(Math.min(380, Math.max(220, opts.density ?? rng.range(305, 345))));
  const order = rng.shuffle(nodes.slice());
  for (let pass = 0, _no = 0; pass < 3 && bells.length < target; pass++) {
    for (const n of order) {
      if (bells.length >= target) break;
      if ((++_no & 63) === 0) await ctx.yield();
      if (n.level < 2 && !n.end && pass === 0) continue;
      _o.subVectors(n.p, CC); _o.y = 0; if (_o.lengthSq() < 1e-4) _o.set(1, 0, 0); _o.normalize();
      const len = rng.range(3.7, 4.9) * (rng.chance(0.08) ? 0.72 : 1);
      const axis = V3(0, -1, 0).addScaledVector(_o, rng.range(0, 0.3)).add(V3(rng.range(-0.14, 0.14), 0, rng.range(-0.14, 0.14))).normalize();
      const a = rng.range(0, 6.283), r = rng.range(0.2, 1.7);
      const piv = n.p.clone().add(V3(Math.cos(a) * r, -rng.range(0.9, 3.0), Math.sin(a) * r));
      if (!bellFits(piv, axis, len, false)) continue;
      addBell(piv, axis, len, 0, n);
    }
    if (pass === 0) await ctx.yield();
  }
  await ctx.yield();
  // level of detail by distance to the lines the camera flies
  const lodDist = (b) => { const m = b.piv.clone().addScaledVector(b.axis, b.len * 0.6); return Math.min(clearOf(m), stopClear(m) * 0.8, routeClear(m)); };
  const ranked = bells.filter((b) => b.lod === 0).map((b) => ({ b, d: lodDist(b) })).sort((x, y) => x.d - y.d);
  let nearN = bells.filter((b) => b.lod === 1).length;
  for (const r of ranked) { if (nearN >= 90 || r.d > 17) break; r.b.lod = 1; nearN++; }
  for (const b of bells) { const d = Math.min(clearOf(b.mouth), routeClear(b.mouth)); b.swing = b.stop === 'stopThroat' ? 0.035 : d < 8 ? 0.07 : rng.range(0.13, 0.2); }
  if (avoidLines.length || sightCones.length) { const mid = V3(); for (const b of bells) {
    mid.copy(b.piv).lerp(b.mouth, 0.55); const d = Math.min(avoidClear(b.mouth), avoidClear(mid), avoidClear(b.piv) + 1.5);
    if (d < 8) b.swing = Math.min(b.swing, 0.07);
    if (!b.stop && (d < 5.3 || (b.node && b.node.gone) || inSight(b.mouth, 1.3, 1) || inSight(mid, 1.2, 1) || inSight(b.piv, 0.5, 1))) b.cut = true;
  } }

  await ctx.yield();
  // pendant twigs from the branch to each stalk
  let _nt = 0;
  for (const b of bells) {
    if ((++_nt & 15) === 0) await ctx.yield();
    if (!b.node) continue;
    const A = b.node.p, d = A.distanceTo(b.piv);
    const mid = A.clone().lerp(b.piv, 0.5).add(V3(0, 0.22 * d, 0)), pre = b.piv.clone().addScaledVector(b.axis, -Math.min(1.2, d * 0.3));
    let pts = spaced([A.clone(), mid, pre, b.piv.clone()], b.lod > 0 ? Math.max(6, Math.round(d / 1.1)) : Math.max(3, Math.round(d / 3)));   // near stalks bend smoothly
    branches.push({ pts, r0: 0.09 + 0.012 * d, r1: 0.013 * b.len, level: 4, len: d, round: b.lod > 0, drawN: b.cut ? 0 : undefined });
  }
  // roots gripping the rim rock
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * 6.283 + rng.range(-0.3, 0.3), c = Math.cos(a), s = Math.sin(a), R = rng.range(6.5, 9);
    branches.push({ pts: spaced([V3(c * 1.2, 2.2, s * 1.2 + 0.6), V3(c * 3.2, -0.2, s * 3.2), V3(c * R * 0.75, -2.6, s * R * 0.75 - 0.5), V3(c * R, -7.5, s * R - 1)], 7), r0: 0.8, r1: 0.22, level: 5, len: 12 });
  }

  await ctx.yield();
  // ---- leaf clusters --------------------------------------------------------------------------
  const clusters = [], leafTarget = Math.round(Math.max(3000, 5200 - (bells.length - 325) * 37) * detail);   // keeps the triangle count level across densities
  let leafCount = 0;
  const lorder = rng.shuffle(nodes.filter((n) => n.level >= 2 || n.end));
  let _nl = 0;
  for (let pass = 0; pass < 2 && leafCount < leafTarget; pass++) for (const n of lorder) {
    if (leafCount >= leafTarget) break;
    if ((++_nl & 127) === 0) await ctx.yield();
    if (!rng.chance(0.25 + 0.75 * sstep(18, 56, n.p.y))) continue;
    if (clearOf(n.p) < 8.4 || stopClear(n.p) < 5.2 || routeClear(n.p) < 8.6 || sightGap(n.p) < 2.4) continue;
    const k = rng.int(6, 11); clusters.push({ p: n.p.clone().add(V3(rng.range(-0.4, 0.4), rng.range(-0.2, 0.5), rng.range(-0.4, 0.4))), k, cut: !!n.gone }); leafCount += k;
  }
  if (avoidLines.length || sightCones.length) for (const c of clusters) if (avoidClear(c.p) < 8.2 || inSight(c.p, 2.7)) c.cut = true;
  await ctx.yield();
  // ---- the young tree (opts.feeder): a sapling of the same kind standing where the world roots it (root: the head of a broken
  // trunk), arching over to hang one great bell with its mouth at opts.feeder.mouth, where the world's swordbill feeds. Its
  // boughs, its other bells and its leaves keep to opts.feeder.side, so that the air beyond the great bell stays clear. Its
  // draws come from a stream of its own, so the old tree is the same with or without it.
  let feeder = null;
  if (opts.feeder) {
    const M = toT(opts.feeder.mouth), R0 = toT(opts.feeder.root), sd = toT(opts.feeder.side || V3(0, 0, 1)); sd.y = 0; sd.normalize();
    const len = 5.2, axis = V3(0.03, -1, 0.02).normalize(), piv = M.clone().addScaledVector(axis, -len), top = piv.clone().add(V3(0, 0.75, 0));
    const h = top.clone().sub(R0), rise = h.y; h.y = 0; const hn = h.clone().normalize();
    const at = (f, up, sq = 0) => R0.clone().addScaledVector(h, f).add(V3(0, rise * up, 0)).addScaledVector(sd, sq);
    const NS = 16, stem = { pts: spaced([R0.clone().add(V3(0, -1.6, 0)), at(0.05, 0.36, 0.5), at(0.3, 0.84, 0.7), at(0.66, 1.1, 0.25), at(0.9, 1.08), top], NS), r0: 0.5, r1: 0.1, level: 1, len: 20, fz: true, sides: 9, moss: 0.5 };
    branches.push(stem);
    const hang = (A, p, bl, lod, sw, ax) => {
      const b = addBell(p, ax, bl, lod, null, { fz: true }); b.swing = sw;
      const d = A.distanceTo(p), mid = A.clone().lerp(p, 0.5).add(V3(0, 0.22 * d, 0)), pre = p.clone().addScaledVector(ax, -Math.min(1.2, d * 0.3));
      branches.push({ pts: spaced([A.clone(), mid, pre, p.clone()], Math.max(5, Math.round(d / 0.6))), r0: 0.08 + 0.012 * d, r1: 0.013 * bl, level: 4, len: d, round: true, fz: true });
      return b;
    };
    const leafy = (p, k, size = 1) => clusters.push({ p: p.clone(), k, fz: true, size });
    const fbell = hang(top, piv, len, 2, 0.02, axis);
    leafy(top.clone().add(V3(0, 0.5, 0)).addScaledVector(sd, 0.5), 7, 0.9); leafy(stem.pts[13].clone().add(V3(0, 0.4, 0)), 8); leafy(stem.pts[10].clone().add(V3(0, 0.5, 0)).addScaledVector(sd, 0.4), 8);
    for (const q of [[0.44, 0.9, -0.3, 0.3, 5.6, 1.6], [0.64, 0.8, 0.38, 0.12, 4.6, 1.9], [0.27, 0.45, -0.75, 0.35, 5.0, 1.3], [0.8, 1.0, 0.1, 0.05, 3.4, 1.5]]) {
      const a = stem.pts[Math.round(q[0] * NS)], dir = sd.clone().multiplyScalar(q[1]).addScaledVector(hn, q[2]).add(V3(0, q[3], 0)).normalize(), L = q[4] * rz.range(0.9, 1.1), dr = q[5];
      const pts = spaced([a.clone(), a.clone().addScaledVector(dir, L * 0.45).add(V3(0, 0.8, 0)), a.clone().addScaledVector(dir, L * 0.8).add(V3(0, 0.5 - dr * 0.4, 0)), a.clone().addScaledVector(dir, L).add(V3(0, -dr, 0))], 7);
      branches.push({ pts, r0: 0.2, r1: 0.06, level: 2, len: L, fz: true, sides: 6 });
      leafy(pts[3].clone().add(V3(0, 0.3, 0)), 8); leafy(pts[6], 9); leafy(pts[7].clone().add(V3(rz.range(-0.4, 0.4), 0.2, rz.range(-0.4, 0.4))), 7, 0.9);
      for (const k of [7, 4]) {
        if (k === 4 && rz.chance(0.35)) continue;
        const bl = rz.range(3.3, 4.2), ax = V3(rz.range(-0.12, 0.12), -1, rz.range(-0.12, 0.12)).normalize();
        hang(pts[k], pts[k].clone().add(V3(rz.range(-0.5, 0.5), -rz.range(0.9, 1.7), rz.range(-0.5, 0.5))).addScaledVector(sd, 0.3), bl, 1, 0.07, ax);
      }
    }
    feeder = { M, axis, piv, len, bell: fbell };
  }
  // canopy shade: how much sun reaches a point, from the leaf clusters between it and the sun
  const shade = (p) => {
    let n = 0;
    for (const c of clusters) {
      if (c.cut) continue;
      const dx = c.p.x - p.x, dy = c.p.y - p.y, dz = c.p.z - p.z, t = dx * sunT.x + dy * sunT.y + dz * sunT.z;
      if (t < 1.5) continue;
      const d2 = dx * dx + dy * dy + dz * dz - t * t; if (d2 < 10) n += 1 - d2 / 10;
    }
    return Math.max(0.08, Math.exp(-0.5 * n));
  };
  await ctx.yield();

  // ---- wood: trunk, limbs, boughs, branchlets, twigs, roots, rock --------------------------------
  const WB = new Buf({ position: 3, normal: 3, aUV: 2, aM: 3 });
  const RADIAL = [9, 6, 4, 3, 3, 5], MOSS = [0.6, 0.5, 0.25, 0.1, 0.3, 0.75];
  let wi = 0;
  for (const b of branches) {
    const n = b.pts.length, isTrunk = b === trunk, nDraw = b.drawN ?? n;
    if (nDraw < 2) { if (!isTrunk) (b.fz ? rz : rng).range(0.7, 1.2); wi++; continue; }
    const sun = b.pts.map((p) => (b.level === 5 ? 0.6 : shade(p)));
    const rad = isTrunk ? (i) => { const t = i / (n - 1); return 2.1 + 1.7 * Math.exp(-t * 7) + 0.6 * sstep(0.8, 1, t); } : (i) => radAt(b, i);
    const lump = isTrunk ? (i, a, len) => 1 + 0.14 * Math.sin(a * 5 + 1) * Math.exp(-len * 0.2) + 0.05 * Math.sin(a * 3 + len * 0.55)
      : b.level <= 1 || b.level === 5 ? (i, a, len) => 1 + 0.07 * Math.sin(a * 3 + len * 0.8 + wi) + 0.05 * Math.sin(len * 2.1 + wi * 1.7) : null;
    const moss = (b.moss ?? MOSS[b.level]) * (isTrunk ? 1 : (b.fz ? rz : rng).range(0.7, 1.2));
    tube(WB, nDraw < n ? b.pts.slice(0, nDraw) : b.pts, rad, b.sides || (isTrunk ? 12 : b.round ? 6 : RADIAL[b.level]), (i) => [moss, sun[i], b.level >= 2 ? 0.9 : 0.8 + 0.2 * sstep(0, 1, i / n)], lump);
    wi++; await ctx.yield();
  }
  await ctx.yield();
  {
    // the rim rock under the root collar: a mossy knuckle the world buries in its ravine wall
    const rows = [], RC = V3(0, -7.4, -2.2), nz = ctx.noise, NU = 22, NV = 12, sd = rng.range(0, 50);
    const rp = (u, v, out) => {
      const th = u * 6.2832, ph = v * Math.PI, sx = Math.sin(ph) * Math.cos(th), sy = Math.cos(ph), sz = Math.sin(ph) * Math.sin(th);
      const k = 1 + 0.3 * nz.fbm3(sx * 1.2 + sd, sy * 1.2, sz * 1.2, 3) + 0.16 * (1 - Math.abs(nz.n3(sx * 2.6 + sd, sy * 2.6, sz * 2.6))) + 0.05 * nz.n3(sx * 6 + sd, sy * 6, sz * 6);
      return out.set(RC.x + sx * 11.5 * k, RC.y + sy * (sy > 0 ? 6.2 : 9.5) * k, RC.z + sz * 10 * k);
    };
    const p = V3(), a = V3(), b2 = V3(), nn = V3();
    for (let j = 0; j <= NV; j++) {
      const row = [], v = Math.min(0.985, Math.max(0.015, j / NV));
      for (let i = 0; i <= NU; i++) {
        const u = i / NU; rp(u, v, p); rp(u + 0.01, v, a); rp(u - 0.01, v, b2); a.sub(b2); rp(u, v + 0.01, b2); rp(u, v - 0.01, nn); b2.sub(nn);
        nn.crossVectors(a, b2).normalize();
        row.push(WB.v({ position: [p.x, p.y, p.z], normal: [nn.x, nn.y, nn.z], aUV: [u * 3, v * 14], aM: [0.36 + 0.45 * nn.y, 0.5, 0.45 + 0.55 * sstep(-14, -1, p.y)] }));
      }
      rows.push(row);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) WB.quad(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]);
  }
  await ctx.yield();
  WB.fixWinding();
  await ctx.yield();

  // ---- materials ------------------------------------------------------------------------------
  const col3 = (c, k = 1) => new THREE.Color(c.r * k, c.g * k, c.b * k);
  const sunCol = new THREE.Color(H.col).multiplyScalar(H.gain);
  const skyCol = cPearl.clone().lerp(cMist, 0.5).multiplyScalar(H.sky); skyCol.r *= H.tint[0]; skyCol.g *= H.tint[1]; skyCol.b *= H.tint[2];
  const groundCol = col3(cDeep, 1.6).add(col3(cMist, 0.3)).multiplyScalar(H.ground / 0.3);
  const redForm = bloomForm === 'yellow' ? cYel.clone().lerp(cRed, 0.1).multiplyScalar(0.8) : bloomForm === 'flame' ? cRed.clone().lerp(cYel, 0.4).multiplyScalar(0.92) : new THREE.Color(cRed.r * 0.95, cRed.g + 0.022, cRed.b + 0.004);
  const windT = westT.clone().add(V3(0, 0.3, 0)).normalize();
  const shared = {
    uTime: { value: 0 }, uWindDir: { value: windT }, uGust: { value: V3(0.085, 1.15, 1.0) },
    uSunDir: { value: sunW.clone() }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uGroundCol: { value: groundCol },
    uWet: { value: wet }, uGlow: { value: 1 }, uFogCut: { value: opts.fogCut ?? 1 },
    uYel: { value: col3(cYel, 0.8) }, uRed: { value: redForm }, uGreen: { value: cGreen.clone() }, uDeep: { value: cDeep.clone() }, uMist: { value: cPearl.clone() },
  };
  const mat = (vs, fs, more = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...more }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const object = new THREE.Group(), tree = new THREE.Group();
  tree.rotation.y = yaw; object.add(tree);
  const addMesh = (m, order = 0) => { m.frustumCulled = false; m.renderOrder = order; tree.add(m); return m; };
  addMesh(new THREE.Mesh(WB.geometry(), mat(BARK_VS, BARK_FS)));

  // ---- leaves ---------------------------------------------------------------------------------
  {
    const P = [0, 0, 0, -0.14, 0.22, 0.05, 0, 0.22, -0.01, 0.14, 0.22, 0.02, -0.19, 0.5, -0.015, 0, 0.5, -0.055, 0.19, 0.5, 0.0, -0.13, 0.78, -0.09, 0, 0.78, -0.135, 0.13, 0.78, -0.12, 0, 1, -0.22];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute([0, 0, -1, 0.22, 0, 0.22, 1, 0.22, -1, 0.5, 0, 0.5, 1, 0.5, -1, 0.78, 0, 0.78, 1, 0.78, 0, 1], 2));
    g.setIndex([0, 2, 1, 0, 3, 2, 1, 2, 5, 1, 5, 4, 2, 3, 6, 2, 6, 5, 4, 5, 8, 4, 8, 7, 5, 6, 9, 5, 9, 8, 7, 8, 10, 8, 9, 10]);
    g.computeVertexNormals();
    const gFar = new THREE.BufferGeometry();          // far leaves: a creased kite, four triangles
    gFar.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.18, 0.42, 0.03, 0, 0.45, -0.05, 0.18, 0.42, 0.0, 0, 1, -0.22], 3));
    gFar.setAttribute('aUV', new THREE.Float32BufferAttribute([0, 0, -1, 0.42, 0, 0.45, 1, 0.42, 0, 1], 2));
    gFar.setIndex([0, 2, 1, 0, 3, 2, 1, 2, 4, 2, 3, 4]);
    gFar.computeVertexNormals();
    // leaves the eye passes within a few metres: a blade of 64 triangles, folded along its midrib, its halves arched like
    // a gull's wing, the margin ruffled, the tip drawn out and drooping
    const gNear = (() => {
      const NT = 8, NS = 4, pos = [], uv = [], nor = [], idx = [], p = V3(), a = V3(), b = V3(), c = V3(), d = V3(), n = V3(), e = 0.012;
      const S = (t, s, o) => {
        const tt = Math.min(1, Math.max(0, t)), w = Math.max(0.006, 0.215 * Math.pow(Math.sin(Math.PI * Math.pow(tt, 0.72)), 0.75) * (1 - 0.25 * tt)), as = Math.abs(s);
        const ruffle = 0.05 * Math.sin(tt * 19 + (s > 0 ? 0 : 2.1)) * as * as * (0.3 + 0.7 * Math.sin(Math.PI * tt));
        return o.set(s * w + 0.035 * tt * tt * Math.sin(tt * 4.0), tt * (1 - 0.05 * tt * tt) - 0.06 * as * (1 - tt) * (1 - tt), 0.36 * as * w - 0.24 * w * as * as * as * as + ruffle + 0.045 * Math.sin(Math.PI * tt) - 0.3 * Math.pow(tt, 2.2));
      };
      for (let i = 0; i <= NT; i++) for (let j = 0; j <= NS; j++) {
        const t = i / NT, s = -1 + 2 * j / NS;
        S(t, s, p); S(t + e, s, a); S(t - e, s, b); S(t, Math.min(1, s + e), c); S(t, Math.max(-1, s - e), d);
        n.crossVectors(c.sub(d), a.sub(b)); if (n.lengthSq() < 1e-14) n.set(0, 0, 1); n.normalize();
        pos.push(p.x, p.y, p.z); uv.push(s, t); nor.push(n.x, n.y, n.z);
      }
      for (let i = 0; i < NT; i++) for (let j = 0; j < NS; j++) { const q = i * (NS + 1) + j; idx.push(q, q + 1, q + NS + 2, q, q + NS + 2, q + NS + 1); }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); gg.setIndex(idx);
      return gg;
    })();
    const folMat = mat(FOL_VS, FOL_FS, {}, { side: THREE.DoubleSide });
    const m4 = new THREE.Matrix4(), X = V3(), Y = V3(), Z = V3();
    const sets = [{ g, m: [], lf: [] }, { g: gFar, m: [], lf: [] }, { g: gNear, m: [], lf: [] }];
    const eyeDist = (p) => Math.min(clearOf(p), stopClear(p), routeClear(p));
    let li = 0;
    for (const c of clusters) {
      const R = c.fz ? rz : rng, sz = c.size || 1;
      const sv = shade(c.p), a0 = R.range(0, 6.283), set = sets[c.fz || eyeDist(c.p) < (opts.nearLeaf ?? 11.5) ? 2 : Math.min(clearOf(c.p), stopClear(c.p)) < 11.5 ? 0 : 1];
      for (let k = 0; k < c.k; k++) {
        const az = a0 + (k / c.k) * 6.283 * 1.6 + R.range(-0.35, 0.35);
        Y.set(Math.cos(az), -R.range(0.05, 0.9), Math.sin(az)).normalize();
        Z.copy(UP).addScaledVector(Y, -Y.y).add(V3(R.range(-0.25, 0.25), 0, R.range(-0.25, 0.25))).normalize();
        X.crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y);
        const s = R.range(2.5, 3.9) * (set === sets[1] ? 1.18 : 1) * sz;
        m4.makeBasis(X, Y, Z).scale(V3(s * R.range(1.0, 1.4), s, s)).setPosition(c.p.x + Y.x * 0.3, c.p.y + R.range(-0.5, 0.5), c.p.z + Y.z * 0.3);
        const lf = [R(), Math.min(1, sv * R.range(0.75, 1.25)), 0, R.range(0.6, 1.2)];
        if (c.cut) continue;                                   // in the way of the world's later line: drawn from, never drawn
        for (let e = 0; e < 16; e++) set.m.push(m4.elements[e]);
        set.lf.push(lf[0], lf[1], lf[2], lf[3]); li++;
      }
      if ((li & 1023) < 10) await ctx.yield();
    }
    for (const set of sets) {
      const n = set.lf.length / 4; if (!n) continue;
      const im = new THREE.InstancedMesh(set.g, folMat, n);
      im.instanceMatrix.array.set(set.m); im.instanceMatrix.needsUpdate = true;
      set.g.setAttribute('aLf', new THREE.InstancedBufferAttribute(new Float32Array(set.lf), 4));
      addMesh(im);
    }
  }

  // ---- the trumpets ---------------------------------------------------------------------------
  const bellGeo = [await makeBell(ctx, 2, [0, 0.3, 0.6, 0.85, 1], 2, 0)];
  await ctx.yield();
  bellGeo.push(await makeBell(ctx, 6, [0, 0.2, 0.4, 0.58, 0.74, 0.86, 0.94, 1], 3, 1));
  await ctx.yield();
  { const qs = []; for (let i = 0; i <= 14; i++) qs.push(1 - Math.pow(1 - i / 14, 1.35)); bellGeo.push(await makeBell(ctx, 12, qs, 6, 2)); }
  await ctx.yield();
  const bellMat = mat(BELL_VS, BELL_FS, { uScale: { value: 1 } }, { side: THREE.DoubleSide });
  // the detailed bells (levels 1 and 2) are wasted from far off: where the far stand-ins hang (opts.farFrom) they shrink into
  // their stalks beyond 96 m and are not drawn beyond 122 m, as the stand-ins grow (uNear = 1 - uFar)
  const uNear = { value: 1 }, nearBellMat = mat(BELL_VS, BELL_FS, { uScale: uNear }, { side: THREE.DoubleSide }), nearBells = [];
  const dropData = { piv: [], rel: [], sw: [], life: [] };
  const lobeUnit = [], sinusUnit = [];
  for (let i = 0; i < 5; i++) { lobeUnit.push(bellSurf(i + 0.5, 1.2, V3())); sinusUnit.push(bellSurf(i, 2, V3())); }
  const dripK = weather === 'drizzle' ? 0.42 : 1;
  for (let lod = 0; lod < 3; lod++) {
    const list = bells.filter((b) => b.lod === lod);
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(bellGeo[lod], lod > 0 ? nearBellMat : bellMat, list.length);
    if (lod > 0) nearBells.push(im);
    const sw = new Float32Array(list.length * 4), tint = new Float32Array(list.length * 4), m4 = new THREE.Matrix4(), X = V3(), Y = V3(), Z = V3(), q = V3();
    list.forEach((b, i) => {
      const R = b.fz ? rz : rng, sl = b.cut ? 1e-4 : b.len;          // a bell in the way of the world's later line is drawn at no size
      Y.copy(b.axis).negate();
      X.set(1, 0, 0).applyAxisAngle(UP, R.range(0, 6.283)); X.addScaledVector(Y, -X.dot(Y)).normalize(); Z.crossVectors(X, Y);
      m4.makeBasis(X, Y, Z).scale(V3(sl, sl, sl)).setPosition(b.piv);
      im.setMatrixAt(i, m4);
      const sun = b.stop === 'stopSun' ? 1 : b.stop ? Math.max(0.85, shade(b.mouth)) : shade(b.mouth);
      const swv = [R.range(0, 6.283), R.range(0, 6.283), b.swing, R.range(1.25, 1.75) * Math.sqrt(4 / b.len)];
      sw.set(swv, i * 4); b.swv = swv;
      tint.set([b.stop ? 0.6 : R(), sun, R.range(-0.12, 0.12), 0], i * 4);
      b.maxSwing = b.swing * 3.2;
      // drops: one under every lobe (three on far bells), and on near bells one in every sinus too
      const nL = lod === 0 ? 3 : 5, l0 = R.int(0, 4);
      for (let k = 0; k < nL + (lod > 0 ? 5 : 0); k++) {
        const u = k < nL ? lobeUnit[(k + l0) % 5] : sinusUnit[k - nL];
        q.set(0, 0, 0).addScaledVector(X, u.x * b.len).addScaledVector(Y, u.y * b.len).addScaledVector(Z, u.z * b.len);
        dropData.piv.push(b.piv.x, b.piv.y, b.piv.z); dropData.rel.push(q.x, q.y, q.z); dropData.sw.push(...swv);
        dropData.life.push(R(), R.range(5, 11) * dripK, R.range(0.075, 0.12) * (b.len / 4) * (k < nL ? 1 : 0.7) * (b.cut ? 0 : 1), sun);
      }
    });
    bellGeo[lod].setAttribute('aSw', new THREE.InstancedBufferAttribute(sw, 4));
    bellGeo[lod].setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4));
    addMesh(im);
  }
  await ctx.yield();
  // ---- the crown from far off --------------------------------------------------------------------
  // Two hundred metres away a four-metre bell is eight pixels and the crown is lace against the mist. opts.farFrom (a point
  // in object space the tree is first seen from) hangs stand-in bells, larger and plainer, on the side of the crown turned
  // to that point, so that from there the tree is one scarlet-and-gold mass; they shrink into their stalks as the eye comes
  // within 122 m and are gone by 96 m (uFar, set in update), long before any of them could be told from the real ones.
  const uFar = { value: 1 }, farCut = { value: (opts.fogCut ?? 1) * 0.28 }; let farMesh = null, deepMesh = null;      // the stand-ins and the shade take less mist still: they are the colour of the far tree
  if (opts.farFrom && ctx.core) {
    const rf = ctx.core.makeRng(ctx.core.hashSeed('swordbill-far:' + ctx.seed));
    const FB = new Buf({ position: 3, normal: 3, aUV: 2, aPart: 1 });
    surfGrid(FB, (lu, q, out) => {
      bellSurf(lu + 0.5, q, out);
      if (q < 0.3) { const th = ((lu + 0.5) / 5) * Math.PI * 2, r = calyxR(0.14 + q, lu + 0.5); out.x = Math.cos(th) * r; out.z = Math.sin(th) * r; }
      return out;
    }, 5, [0, 0.28, 0.62, 1, 1.5, 2], 0, (q) => (q <= 1 ? 0.12 + 0.88 * q : q));
    for (let i = 0; i < FB.n; i++) if (FB.a.aUV[i * 2 + 1] < 0.37) FB.a.aPart[i] = 1;
    const fg = FB.fixWinding().geometry();
    const from = toT(V3(opts.farFrom.x, opts.farFrom.y, opts.farFrom.z)), view = from.clone().sub(CC).normalize(), want = Math.round((opts.farBells ?? 400) * Math.min(1, detail + 0.2));
    const fm = [], fsw = [], ftint = [], m4 = new THREE.Matrix4(), X = V3(), Y = V3(), Z = V3(), piv = V3();
    for (let tries = 0; tries < want * 8 && ftint.length / 4 < want && clusters.length; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      const c = clusters[Math.floor(rf() * clusters.length)];
      piv.set(c.p.x + rf.range(-2.4, 2.4), c.p.y + rf.range(-2.6, 0.4), c.p.z + rf.range(-2.4, 2.4));
      const len = rf.range(5.0, 7.2), face = (piv.x - CC.x) * view.x + (piv.y - CC.y) * view.y + (piv.z - CC.z) * view.z, sun = shade(piv);
      if (face < -7 || piv.y - len < 3) continue;
      Y.set(rf.range(-0.22, 0.22), 1, rf.range(-0.22, 0.22)).normalize();
      X.set(1, 0, 0).applyAxisAngle(UP, rf.range(0, 6.283)); X.addScaledVector(Y, -X.dot(Y)).normalize(); Z.crossVectors(X, Y);
      m4.makeBasis(X, Y, Z).scale(V3(len, len, len)).setPosition(piv);
      for (let e = 0; e < 16; e++) fm.push(m4.elements[e]);
      fsw.push(rf.range(0, 6.283), rf.range(0, 6.283), rf.range(0.12, 0.18), rf.range(1.1, 1.5));
      ftint.push(rf(), Math.max(0.25, Math.min(0.9, sun * rf.range(0.7, 1.2))), rf.range(-0.34, -0.1), 0);
    }
    const nF = ftint.length / 4;
    if (nF) {
      farMesh = new THREE.InstancedMesh(fg, mat(BELL_VS, BELL_FS, { uScale: uFar, uFogCut: farCut }, { side: THREE.DoubleSide }), nF);
      farMesh.instanceMatrix.array.set(fm); farMesh.instanceMatrix.needsUpdate = true;
      fg.setAttribute('aSw', new THREE.InstancedBufferAttribute(new Float32Array(fsw), 4));
      fg.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(ftint), 4));
      addMesh(farMesh);
    }
    // the shade inside the crown: discs behind the far side's leaves, within the crown's outline as farFrom sees it
    const dA = [], dB = [], q = V3();
    for (let tries = 0; tries < 400 && dB.length / 2 < 16 && clusters.length; tries++) {
      const c = clusters[Math.floor(rf() * clusters.length)]; q.subVectors(c.p, CC);
      const face = q.dot(view), off = Math.sqrt(Math.max(0, q.lengthSq() - face * face)), size = rf.range(8, 12.5);
      if (face > 4 || off + size > 29 || c.p.y - size < 6) continue;
      const back = rf.range(5, 10);
      dA.push(c.p.x - view.x * back, c.p.y - view.y * back, c.p.z - view.z * back, size); dB.push(rf() * 10, rf.range(0.8, 0.95));
    }
    if (dB.length) {
      const dg = new THREE.InstancedBufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); dg.setIndex([0, 1, 2, 0, 2, 3]);
      dg.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(dA), 4)); dg.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(dB), 2)); dg.instanceCount = dB.length / 2;
      deepMesh = addMesh(new THREE.Mesh(dg, mat(DEEP_VS, DEEP_FS, { uScale: uFar, uFogCut: farCut }, { transparent: true, depthWrite: false })), 1);
    }
  }
  await ctx.yield();
  // ---- drops ----------------------------------------------------------------------------------
  const quadGeo = (attrs) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    let n = 0;
    for (const k in attrs) { const [arr, size] = attrs[k]; g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(arr), size)); n = arr.length / size; }
    g.instanceCount = n; return g;
  };
  const uRes = { value: new THREE.Vector2(800, 450) }, uSunV = { value: new THREE.Vector2(0.3, 0.6) };
  addMesh(new THREE.Mesh(quadGeo({ aPiv: [dropData.piv, 3], aRel: [dropData.rel, 3], aSw: [dropData.sw, 4], aLife: [dropData.life, 4] }),
    mat(DROP_VS, DROP_FS, { uRes, uSunV, uGrav: { value: 11 } }, { transparent: true, depthWrite: false })), 3);

  // ---- epiphytes: moss beards under the limbs, bromeliads on the leaning trunk ------------------
  {
    const EB = new Buf({ position: 3, normal: 3, aUV: 2, aLf: 4 });
    const cand = rng.shuffle(major.slice());
    let nb = 0; const maxB = Math.round(190 * detail);
    for (const m of cand) {
      if (nb >= maxB) break;
      const L = rng.chance(0.3) ? rng.range(2, 3.2) : rng.range(4, 6.2), top = m.p.clone().add(V3(rng.range(-0.3, 0.3) * m.r, -m.r * 0.8, rng.range(-0.3, 0.3) * m.r));
      const bot = top.clone().add(V3(0, -L, 0));
      if (m.p.y < 6 || sightGap(bot) < 1 || sightGap(top) < 1 || clearOf(bot) < 6.3 || clearOf(top) < 6.3 || stopClear(bot) < 6 || stopClear(top) < 6 || routeClear(bot) < 6.5 || routeClear(top) < 6.5) continue;
      const sv = shade(top), ph = rng(), yaw0 = rng.range(0, Math.PI), w = rng.range(0.45, 0.9);
      if ((avoidLines.length || sightCones.length) && (avoidClear(bot) < 6.5 || avoidClear(top) < 6.5 || inSight(bot, 0.9) || inSight(top, 0.9))) { nb++; continue; }
      for (let pl = 0; pl < 2; pl++) {
        const a = yaw0 + pl * 1.57, cx = Math.cos(a), cz = Math.sin(a), rows = [];
        for (let k = 0; k <= 4; k++) {
          const t = k / 4, y = top.y - L * t, ww = w * (1 - 0.25 * t);
          rows.push([EB.v({ position: [top.x - cx * ww, y, top.z - cz * ww], normal: [-cz, 0.15, cx], aUV: [-1, t], aLf: [ph, sv, 1, 1.3] }),
            EB.v({ position: [top.x + cx * ww, y, top.z + cz * ww], normal: [-cz, 0.15, cx], aUV: [1, t], aLf: [ph, sv, 1, 1.3] })]);
        }
        for (let k = 0; k < 4; k++) EB.quad(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]);
      }
      nb++;
    }
    // bromeliad tanks on the upper side of the trunk and the limb bases
    const seats = [];
    for (let i = 3; i < trunk.pts.length - 1; i += 2) seats.push({ p: trunk.pts[i], r: 1.8, t: trunk.pts[i + 1].clone().sub(trunk.pts[i - 1]).normalize() });
    for (const lb of limbs) for (const f of [0.12, 0.3, 0.52]) { const i = Math.max(1, Math.round(f * (lb.pts.length - 1))); seats.push({ p: lb.pts[i], r: radAt(lb, i), t: lb.pts[i + 1].clone().sub(lb.pts[i - 1]).normalize() }); }
    const A = V3(), S = V3(), T = V3(), pt = V3(), nr = V3();
    for (const st of seats) {
      if (!rng.chance(0.85)) continue;
      A.copy(UP).addScaledVector(st.t, -st.t.y).normalize();                 // the top side of the leaning wood
      const c = st.p.clone().addScaledVector(A, st.r * 0.95).add(V3(rng.range(-0.5, 0.5), 0, 0));
      if (clearOf(c) < 9 || routeClear(c) < 7.5) continue;
      A.lerp(UP, 0.5).normalize(); S.set(1, 0, 0).addScaledVector(A, -A.x).normalize(); T.crossVectors(A, S);
      const nBl = rng.int(13, 17), R = rng.range(1.7, 2.9), sv = Math.max(0.5, shade(c)), ph = rng();
      for (let k = 0; k < nBl; k++) {
        const az = (k / nBl) * 6.283 + rng.range(-0.15, 0.15), el0 = rng.range(0.75, 1.25) * (k % 2 ? 1 : 0.7), len = R * rng.range(0.75, 1.15);
        const dx = Math.cos(az), dz = Math.sin(az), rows = [];
        for (let j = 0; j <= 3; j++) {
          const t = j / 3, el = el0 - t * t * 1.25, rr = len * t * (0.55 + 0.45 * Math.cos(el0 - t * 0.6)), hh = len * (Math.sin(el0) * t - 0.42 * t * t);
          const wv = 0.3 * (R / 2.3) * (1 - t * t) * (0.5 + 0.5 * Math.min(1, t * 4)) + 0.015;
          pt.copy(c).addScaledVector(S, dx * rr).addScaledVector(T, dz * rr).addScaledVector(A, hh);
          nr.copy(A).multiplyScalar(Math.cos(el)).addScaledVector(S, -dx * Math.sin(el)).addScaledVector(T, -dz * Math.sin(el));
          const sx = -dz * wv, sz = dx * wv;
          rows.push([EB.v({ position: [pt.x + S.x * sx + T.x * sz, pt.y + S.y * sx + T.y * sz, pt.z + S.z * sx + T.z * sz], normal: [nr.x, nr.y, nr.z], aUV: [-1, t], aLf: [ph, sv, 2, 0.12] }),
            EB.v({ position: [pt.x - S.x * sx - T.x * sz, pt.y - S.y * sx - T.y * sz, pt.z - S.z * sx - T.z * sz], normal: [nr.x, nr.y, nr.z], aUV: [1, t], aLf: [ph, sv, 2, 0.12] })]);
        }
        for (let j = 0; j < 3; j++) EB.quad(rows[j][0], rows[j][1], rows[j + 1][1], rows[j + 1][0]);
      }
    }
    addMesh(new THREE.Mesh(EB.geometry(), mat(FOL_VS, FOL_FS, {}, { side: THREE.DoubleSide })));
  }
  await ctx.yield();

  // ---- mist pouring up through the crown, and shafts standing under it --------------------------
  const uCamL = { value: V3(0, 40, 120) };
  if (opts.mist !== false) {
    const aA = [], aB = [], n = Math.round(44 * detail);
    for (let i = 0; i < n; i++) {
      aA.push(rng.range(-26, 26), rng.range(-26, -6), rng.range(-2, 60), rng.range(9, 17));
      aB.push(rng(), 1 / rng.range(24, 40), rng.range(0, 10), rng.range(0.15, 0.28) * (opts.mistAlpha ?? 1));
    }
    addMesh(new THREE.Mesh(quadGeo({ aA: [aA, 4], aB: [aB, 4] }), new THREE.ShaderMaterial({ uniforms: { ...shared }, vertexShader: MIST_VS, fragmentShader: MIST_FS, transparent: true, depthWrite: false })), 2);
  }
  if (opts.shafts !== false && H.shafts > 0) {
    const aA = [], aB = [];
    for (let i = 0; i < 10; i++) {
      const a = rng.range(0, 6.283), r = rng.range(6, 26);
      aA.push(Math.cos(a) * r, rng.range(26, 44), 26 + Math.sin(a) * r, rng.range(38, 60));
      aB.push(rng.range(1.6, 3.6), rng(), rng.range(0.05, 0.11) * H.shafts, 0);
    }
    addMesh(new THREE.Mesh(quadGeo({ aA: [aA, 4], aB: [aB, 4] }), new THREE.ShaderMaterial({ uniforms: { ...shared, uSunL: { value: sunT.clone() }, uCamL },
      vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })), 4);
  }

  // ---- anchors (hero.object local space) --------------------------------------------------------
  const stopAnchor = (s) => ({ flower: toO(s.M), view: toO(s.view), approach: toO(s.approach), axis: toO(s.axis), pivot: toO(s.bell.piv), length: s.len });
  const circuit = [];
  for (let i = 0; i < 8; i++) { const a = -(i / 8) * Math.PI * 2 + Math.PI / 2; circuit.push(toO(V3(Math.cos(a) * 52, 30 - 4 * Math.cos(a - 0.6), 26 + Math.sin(a) * 54))); }
  const anchors = {
    portalSeat: { position: toO(PS), normal: toO(naveDir).negate(), radius: 7, tiltDeg: 60 },
    naveFoot: toO(N0),
    flyThrough: corridor.map(toO),
    stopSun: stopAnchor(stops[0]),
    stopBacklit: { ...stopAnchor(stops[1]), bells: stops[1].group.map((b) => toO(b.mouth)) },
    stopThroat: stopAnchor(stops[2]),
    feeder: feeder ? { flower: toO(feeder.M), axis: toO(feeder.axis), pivot: toO(feeder.piv), length: feeder.len } : null,
    circuit,
    trunkTop: toO(F), fork: toO(F), limbTips: limbs.map((l) => toO(l.pts[l.pts.length - 1])),
    crownTop: toO(V3(0, 76, 24)), under: toO(V3(0, 5, 44)), wind: toO(windT),
  };
  const center = toO(CC);
  const radius = 32, height = 76, lookAt = center;
  // solids for the world's path assertions (object space): x, y, z, radius of every wood sample and leaf cluster
  const solids = [];
  for (const b of branches) for (let i = 0; i < (b.drawN ?? b.pts.length); i++) { const q = toO(b.pts[i]); solids.push(q.x, q.y, q.z, b === trunk ? 3 : b.level <= 1 || b.level === 5 ? radAt(b, i) : 0.3); }
  for (const c of clusters) { if (c.cut) continue; const q = toO(c.p); solids.push(q.x, q.y, q.z, 3.2); }
  const mainWood = [];                                    // the wood no sight cone removes: trunk and main limbs (object space: x, y, z, radius)
  for (const b of branches) if (b === trunk || b.level === 0) for (let i = 0; i < b.pts.length; i++) { const q = toO(b.pts[i]); mainWood.push(q.x, q.y, q.z, b === trunk ? 2.1 : radAt(b, i)); }
  const _cp = V3(), res = uRes.value, _fa = V3(), _fv = V3();
  let wind = 1;
  return {
    object, radius, height, center: lookAt, anchors, ground: false, groundY: -9,
    uniforms: shared, solids, mainWood,
    bells: bells.filter((b) => !b.cut).map((b) => ({ position: toO(b.piv), axis: toO(b.axis), length: b.len, swing: b.maxSwing, lod: b.lod, stop: b.stop || (b.fz ? 'young' : null) })),
    cutCount: { bells: bells.filter((b) => b.cut).length, clusters: clusters.filter((c) => c.cut).length, wood: branches.filter((b) => b.drawN != null).length },
    // where the mouth of the young tree's great bell has swung to at this time (object space; the same pendulum as the shader's),
    // and the way the bell then hangs (outAxis, from stalk to mouth)
    feederMouth(time, out, outAxis) {
      if (!feeder) return null;
      const b = feeder.bell, sw = b.swv, Wd = shared.uWindDir.value, G = shared.uGust.value, p = b.piv;
      const ph = (p.x * Wd.x + p.y * Wd.y + p.z * Wd.z) * G.x - time * G.y, ga = 0.5 + 0.5 * Math.sin(ph), gb = 0.5 + 0.5 * Math.sin(ph * 0.37 + p.y * 0.05 + 1.3), g = ga * ga * (0.35 + 0.65 * gb);
      let tx = sw[2] * (0.6 * Math.sin(time * sw[3] + sw[0]) + 0.3 * Math.sin(time * sw[3] * 1.83 + sw[1])), ty = sw[2] * (0.6 * Math.sin(time * sw[3] * 0.93 + sw[1]) + 0.3 * Math.sin(time * sw[3] * 1.61 + sw[0] * 1.7));
      const k = G.z * sw[2] * g * (1.5 + 0.4 * Math.sin(time * sw[3] * 1.3 + sw[0])); tx += Wd.x * k; ty += Wd.z * k;
      const ang = Math.hypot(tx, ty); _fa.set(-ty, 0, tx).multiplyScalar(1 / Math.max(ang, 1e-5));
      _fv.copy(b.axis).applyAxisAngle(_fa, ang);
      if (outAxis) outAxis.copy(_fv).applyAxisAngle(UP, yaw);
      return out.copy(_fv).multiplyScalar(b.len).add(p).applyAxisAngle(UP, yaw);
    },
    setWind(k) { wind = k; shared.uGust.value.z = k; },
    setSun(dirWorld, colour) { shared.uSunDir.value.copy(dirWorld).normalize(); if (colour) shared.uSunCol.value.copy(colour); },
    update(dt, time, camera) {
      shared.uTime.value = time;
      shared.uGlow.value = 1 + 0.07 * Math.sin(time * 0.45) + 0.04 * Math.sin(time * 0.17 + 2);      // petal glow rises and falls with the cloud
      const e = camera.matrixWorld.elements, s = shared.uSunDir.value;
      uSunV.value.set(s.x * e[0] + s.y * e[1] + s.z * e[2], s.x * e[4] + s.y * e[5] + s.z * e[6]);
      tree.updateWorldMatrix(true, false);
      uCamL.value.copy(tree.worldToLocal(_cp.set(e[12], e[13], e[14])));
      if (farMesh) {                                                                                  // _cp is now in the tree's frame, as CC is
        uFar.value = sstep(92, 108, _cp.distanceTo(CC)); farMesh.visible = uFar.value > 0.2; if (deepMesh) deepMesh.visible = uFar.value > 0.004;      // from the first stop (125 m) the stand-ins stand alone: 110 000 triangles fewer there
        uNear.value = 1 - uFar.value; for (const m of nearBells) m.visible = uNear.value > 0.004;
      }
      if (ctx.renderer) ctx.renderer.getDrawingBufferSize(res);
    },
    dispose() {},
  };
}
