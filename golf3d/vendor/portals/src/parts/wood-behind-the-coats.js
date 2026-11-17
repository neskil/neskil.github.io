// The Wood Behind the Coats: hero set pieces.
//   - the lamp-post: a plain old iron street lamp, its lantern lit, standing in a snow drift where no street is
//   - the wardrobe mouth: rows of long hanging fur coats with a gap down the middle that the flight leaves by
//   - the season: one material family (the kit's flora material with a winter laid over it) in which every tree, bough,
//     tuft and flower reads the same value, `u` against its own thaw moment, so snow, leaf-out and bloom happen by rule
//   - the falling snow that turns gold where it crosses the lamp light
// The world (src/worlds/wood-behind-the-coats.js) places and drives all of it.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const SOLID_U = 0.875, SOLID_V = 0.75;                     // the opaque cell of the kit's leaf atlas
const CELL = flora.LEAF_CELLS;
export const SNOW = [0.78, 0.85, 0.97];
export const SEASON_SPAN = 0.15;                           // share of the flight one spot takes from deep winter to full spring
// the light the first lamp-post throws (the world dims it with the season; the set piece alone shows it at full)
export const LAMP_COLOR = [5.4, 2.8, 0.78];
// the wardrobe's depth from the place the flight enters it to its mouth, in metres
export const WARDROBE_DEPTH = 34;
// every stream the set pieces deal from, by the name of what it deals; each is made from the visit's seed and its own name
const PART_STREAMS = ['wardrobe', 'first lamp', 'set piece firs', 'set piece snow'];
const PART_SHAPES = ['set piece fir shape', 'set piece small fir shape'];

// ---------------------------------------------------------------- the season: uniforms every seasonal shader shares
// uSeason = (u, 1 / span, time, 0). A spot's phase is p = (u - its thaw moment) / span: below 0 winter, 0..1 the thaw, above 1 spring.
// uRose: the colour that snow lying high (above 9 m: the tree tops) is multiplied by, by the hour. uSmall: the two distances (m) from the eye between which small plants (flowers, tufts) sink into the ground.
// uPortal: where the ring stands (xyz) and how strongly its gold falls on what grows near it (w).
export function makeSeason() {
  return {
    uSeason: { value: new THREE.Vector4(0, 1 / SEASON_SPAN, 0, 0) },
    uRose: { value: new THREE.Vector3(1, 1, 1) }, uSmall: { value: new THREE.Vector2(60, 80) }, uPortal: { value: new THREE.Vector4(0, -999, 0, 0) },
    uLampPos: { value: [new THREE.Vector3(0, -999, 0), new THREE.Vector3(0, -999, 0)] },
    uLampCol: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    set(u, time) { this.uSeason.value.x = u; this.uSeason.value.z = time; },
  };
}
export const LAMP_GLSL = /* glsl */`
uniform vec3 uLampPos[2]; uniform vec3 uLampCol[2];
float lampFall(float d2) { float k = clamp(1. - d2 / 3600., 0., 1.); return k * k / (1. + d2 / 120.); }
`;

const swap = (src, find, put, name) => { if (!src.includes(find)) { console.warn('wood-behind-the-coats: shader hook not found: ' + name); return src; } return src.replace(find, put); };

// The kit's wind material with the season laid over it. Geometry needs colorB (colour under snow) and aPivot (where a leaf
// vertex folds to); instances need aSeason = (thaw moment in u, leaf delay in phases, snow load 0..1, kind).
// kind 0: evergreen bough, bends under its snow. 1: deciduous, leaves unfold from aPivot. 2: plain. 3: flower, rises then opens.
// A kind with .25 added (1.25, 3.25) is a small plant: it sinks into the ground by its own distance from the eye between uSmall.x and uSmall.y, so none appears or goes at once in clear air.
export function seasonMaterial(S, o = {}) {
  const mat = flora.windMaterial(o), kit = mat.onBeforeCompile, key = mat.customProgramCacheKey();
  mat.onBeforeCompile = (sh, r) => {
    kit(sh, r);
    sh.uniforms.uSeason = S.uSeason; sh.uniforms.uLampPos = S.uLampPos; sh.uniforms.uLampCol = S.uLampCol; sh.uniforms.uRose = S.uRose; sh.uniforms.uSmall = S.uSmall; sh.uniforms.uPortal = S.uPortal;
    let v = sh.vertexShader;
    v = swap(v, 'attribute vec4 wind;', 'attribute vec4 wind;\nattribute vec3 aPivot; attribute vec3 colorB; attribute vec4 aSeason; uniform vec4 uSeason; uniform vec3 uRose; uniform vec2 uSmall; float sP = 0.0, sSnow = 0.0;', 'attributes');
    v = swap(v, '#include <color_vertex>', /* glsl */`
        sP = (uSeason.x - aSeason.x) * uSeason.y;
        { float sH = fract(sin(dot(aPivot.xz + aPivot.y * 0.37, vec2(12.9898, 78.233))) * 43758.5453);
          sSnow = aSeason.z * (1.0 - smoothstep(0.06, 0.6, sP + sH * 0.24)); }
        #include <color_vertex>
        #ifdef USE_COLOR
          vColor.rgb = mix(vColor.rgb, colorB, sSnow);
          #ifdef USE_INSTANCING
            vColor.rgb *= mix(vec3(1.0), uRose, sSnow * smoothstep(9.0, 15.0, (modelMatrix * instanceMatrix * vec4(position, 1.0)).y));
          #endif
        #endif`, 'color');
    v = swap(v, '#include <begin_vertex>', /* glsl */`#include <begin_vertex>
        {
          float sLeaf = step(0.5, wind.z), sK = aSeason.w;
          if (sK > 2.5) {
            float g = clamp((sP - aSeason.y) * 2.4, 0.0, 1.0), rise = smoothstep(0.0, 0.6, g), wide = smoothstep(0.0, 0.25, g) * mix(0.4, 1.0, rise);
            transformed = mix(aPivot, transformed, smoothstep(0.4, 1.0, g));
            transformed *= vec3(wide, rise, wide);
          } else if (sK > 0.5 && sK < 1.5) {
            float g = smoothstep(0.0, 1.0, (sP - aSeason.y) * 1.7);
            transformed = mix(aPivot, transformed, mix(1.0, g, sLeaf));
          } else if (sK < 0.5) {
            transformed.y -= sLeaf * sSnow * length(transformed.xz) * 0.09;
          }
          #ifdef USE_INSTANCING
            if (fract(sK + 0.05) > 0.15) transformed *= 1.0 - smoothstep(uSmall.x, uSmall.y, distance((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, cameraPosition));
          #endif
        }`, 'begin');
    sh.vertexShader = v;
    let f = sh.fragmentShader;
    f = swap(f, '#include <common>', '#include <common>\nuniform vec4 uPortal;\n' + LAMP_GLSL, 'frag common');
    f = swap(f, 'reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);', /* glsl */`reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);
        for (int sI = 0; sI < 2; sI++) {
          vec3 sL = (viewMatrix * vec4(uLampPos[sI], 1.0)).xyz + vViewPosition;
          float sD2 = dot(sL, sL), sN = clamp(dot(normal, sL * inversesqrt(max(sD2, 1e-4))) * 0.6 + 0.4, 0.0, 1.0);
          reflectedLight.directDiffuse += diffuseColor.rgb * uLampCol[sI] * (lampFall(sD2) * sN * RECIPROCAL_PI);
        }
        { vec3 sL = (viewMatrix * vec4(uPortal.xyz, 1.0)).xyz + vViewPosition; float sD2 = dot(sL, sL);
          reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 0.82, 0.42) * (uPortal.w * clamp(1.0 - sD2 / 1600.0, 0.0, 1.0) / (1.0 + sD2 / 60.0)); }`, 'lamp');
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => key + '-wbc-season';
  return mat;
}

// Adds colorB and aPivot to a kit flora geometry (position, normal, color, wind, uv).
//   twin: the same geometry built with its snow colours (conifers); else wood takes snow on its upper sides
//   pivot: 'buds' (each leaf clump folds into the middle of its clump), 'top' (strands fold up into their highest point),
//          'base' (the whole plant folds into its foot), or none
export function seasonize(g, o = {}) {
  const P = g.attributes.position.array, N = g.attributes.normal.array, C = g.attributes.color.array, W = g.attributes.wind.array, n = P.length / 3;
  const piv = new Float32Array(P), cb = new Float32Array(n * 3), snow = o.snow || SNOW, wk = o.woodSnow ?? 0.85, lk = o.leafSnow ?? 0;
  if (o.twin) cb.set(o.twin.attributes.color.array);
  else for (let i = 0; i < n; i++) {
    const leaf = W[i * 4 + 2] > 0.5, k = leaf ? lk * clamp(N[i * 3 + 1] * 0.8 + 0.5, 0, 1) : wk * clamp(N[i * 3 + 1] * 1.4 + 0.1, 0, 1);
    for (let c = 0; c < 3; c++) cb[i * 3 + c] = lerp(C[i * 3 + c], snow[c], k);
  }
  if (o.pivot === 'base') {
    for (let i = 0; i < n; i++) { piv[i * 3] = P[i * 3] * 0.12; piv[i * 3 + 1] = 0; piv[i * 3 + 2] = P[i * 3 + 2] * 0.12; }
  } else if (o.pivot === 'buds' || o.pivot === 'top') {
    const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) { const a = find(idx[i]), b = find(idx[i + 1]), c = find(idx[i + 2]); if (b !== a) par[b] = a; const c2 = find(c); if (c2 !== a) par[c2] = a; }
    const comp = new Map();
    for (let i = 0; i < n; i++) { const r = find(i); let k = comp.get(r); if (!k) comp.set(r, k = { first: i, v: [] }); k.v.push(i); }
    let core = null;
    for (const k of [...comp.values()].sort((a, b) => a.first - b.first)) {
      if (W[k.first * 4 + 2] < 0.5) continue;
      let cx = 0, cy = 0, cz = 0, top = -1e9, ti = k.first;
      for (const i of k.v) { cx += P[i * 3]; cy += P[i * 3 + 1]; cz += P[i * 3 + 2]; if (P[i * 3 + 1] > top) { top = P[i * 3 + 1]; ti = i; } }
      cx /= k.v.length; cy /= k.v.length; cz /= k.v.length;
      let q = [cx, cy, cz];
      if (o.pivot === 'top') q = [P[ti * 3], P[ti * 3 + 1], P[ti * 3 + 2]];
      else if (k.v.length >= 12) { let r = 0; for (const i of k.v) r = Math.max(r, Math.hypot(P[i * 3] - cx, P[i * 3 + 1] - cy, P[i * 3 + 2] - cz)); core = { q, r }; }
      else if (core && Math.hypot(cx - core.q[0], cy - core.q[1], cz - core.q[2]) < core.r * 2.6) q = core.q;
      for (const i of k.v) { piv[i * 3] = q[0]; piv[i * 3 + 1] = q[1]; piv[i * 3 + 2] = q[2]; }
    }
  }
  g.setAttribute('aPivot', new THREE.BufferAttribute(piv, 3)); g.setAttribute('colorB', new THREE.BufferAttribute(cb, 3));
  return g;
}

// a geometry sharing another's buffers, with its own per-instance aSeason (and petal colours)
export function seasonInstances(g, material, list) {
  const n = list.length, geo = new THREE.BufferGeometry(); geo.index = g.index;
  for (const k in g.attributes) geo.setAttribute(k, g.attributes[k]);
  const sa = new Float32Array(n * 4), pa = new Float32Array(n * 3);
  geo.setAttribute('aSeason', new THREE.InstancedBufferAttribute(sa, 4)); geo.setAttribute('petal', new THREE.InstancedBufferAttribute(pa, 3));
  geo.userData = g.userData;
  const mesh = new THREE.InstancedMesh(geo, material, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  list.forEach((p, i) => {
    e.set(p.tiltX || 0, p.rot || 0, p.tiltZ || 0); q.setFromEuler(e);
    v.set(p.x, p.y, p.z); s.set(p.s, p.s * (p.sy || 1), p.s);
    mesh.setMatrixAt(i, m.compose(v, q, s));
    const c = p.col || [1, 1, 1]; col.setRGB(c[0], c[1], c[2]); mesh.setColorAt(i, col);
    sa.set([p.thaw ?? 0, p.delay ?? 0, p.snow ?? 1, p.kind ?? 0], i * 4);
    const pc = p.petal || [1, 1, 1]; pa.set(pc, i * 3);
  });
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4;
  return mesh;
}

// ---------------------------------------------------------------- a small geometry builder in the season material's vertex format
export class SGeo {
  constructor() { this.p = []; this.n = []; this.c = []; this.cb = []; this.w = []; this.t = []; this.pv = []; this.i = []; this.count = 0; }
  // position, normal, colour, colour under snow, wind (sway, flutter, leaf mask, glow), atlas uv, pivot
  v(p, n, c, cb = c, w = [0, 0, 0, 0], uv = [SOLID_U, SOLID_V], pv = p) {
    this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.cb.push(cb[0], cb[1], cb[2]);
    this.w.push(w[0], w[1], w[2], w[3]); this.t.push(uv[0], uv[1]); this.pv.push(pv[0], pv[1], pv[2]);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // a tube through pts with a radius per point; col(t, k) -> colour; snow settles on its upper side by `snow`
  tube(pts, rad, sides, col, o = {}) {
    const n = pts.length, rings = [], snow = o.snow ?? 0.85; let nr = null;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (!nr) nr = Math.abs(ty) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const d = nr[0] * tx + nr[1] * ty + nr[2] * tz; nr = [nr[0] - tx * d, nr[1] - ty * d, nr[2] - tz * d]; const nl = Math.hypot(nr[0], nr[1], nr[2]) || 1; nr = [nr[0] / nl, nr[1] / nl, nr[2] / nl];
      const bx = ty * nr[2] - tz * nr[1], by = tz * nr[0] - tx * nr[2], bz = tx * nr[1] - ty * nr[0], ring = [], t = n > 1 ? i / (n - 1) : 0;
      for (let k = 0; k < sides; k++) {
        const an = k / sides * TAU, ca = Math.cos(an), sa = Math.sin(an), dn = [nr[0] * ca + bx * sa, nr[1] * ca + by * sa, nr[2] * ca + bz * sa];
        const c = col(t, k), sk = snow * clamp(dn[1] * 1.4 + 0.1, 0, 1);
        ring.push(this.v([pts[i][0] + dn[0] * rad[i], pts[i][1] + dn[1] * rad[i], pts[i][2] + dn[2] * rad[i]], dn, c, mix3(c, SNOW, sk), [o.sway ? o.sway * t : 0, 0, 0, 0]));
      }
      rings.push(ring);
      if (i > 0) { const pr = rings[i - 1]; for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; this.quad(pr[k], pr[k1], ring[k1], ring[k]); } }
    }
    if (o.cap !== false) {
      const l = pts[n - 1], c = col(1, 0), tip = this.v([l[0], l[1] + (o.capUp ?? 0), l[2]], [0, 1, 0], c, mix3(c, SNOW, snow)), last = rings[n - 1];
      for (let k = 0; k < sides; k++) this.tri(last[k], last[(k + 1) % sides], tip);
    }
  }
  build(userData = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('colorB', new THREE.Float32BufferAttribute(this.cb, 3));
    g.setAttribute('wind', new THREE.Float32BufferAttribute(this.w, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.pv, 3));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    g.userData = { triangles: this.i.length / 3, height: g.boundingBox.max.y, radius: Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z), ...userData };
    return g;
  }
}

// ---------------------------------------------------------------- lamp light for plain Lambert materials (iron, wood, snow, rock)
export function lampLit(mat, S, keyName) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLampPos = S.uLampPos; sh.uniforms.uLampCol = S.uLampCol;
    sh.fragmentShader = swap(swap(sh.fragmentShader, '#include <common>', '#include <common>\n' + LAMP_GLSL, 'lampLit common'), '#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
      for (int sI = 0; sI < 2; sI++) {
        vec3 sL = (viewMatrix * vec4(uLampPos[sI], 1.0)).xyz + vViewPosition;
        float sD2 = dot(sL, sL), sN = clamp(dot(normal, sL * inversesqrt(max(sD2, 1e-4))) * 0.7 + 0.3, 0.0, 1.0);
        reflectedLight.directDiffuse += diffuseColor.rgb * uLampCol[sI] * (lampFall(sD2) * sN * RECIPROCAL_PI);
      }`, 'lampLit lights');
  };
  mat.customProgramCacheKey = () => 'wbc-lamplit-' + keyName;
  return mat;
}

// merge indexed or non-indexed three geometries (position + normal only), each with an optional matrix, into one non-indexed geometry
function mergeSolid(parts) {
  let total = 0; const list = [];
  for (const p of parts) { const g = p.g.index ? p.g.toNonIndexed() : p.g; if (p.m) g.applyMatrix4(p.m); list.push(g); total += g.attributes.position.count; }
  const P = new Float32Array(total * 3), N = new Float32Array(total * 3); let o = 0;
  for (const g of list) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  for (const p of parts) p.g.dispose();
  return out;
}
const at = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// ---------------------------------------------------------------- the lamp-post
// Origin at the foot, +Y up. o: { rng, snow: true (caps of snow and a drift at the foot), time: shared { value } }
// -> { object, lantern: Vector3 (local centre of the light), top, setLevel(k) (flame strength; pale by day), update(time) }
// o.pause: an async function awaited between the iron, the glass and the snow
export async function makeLampPost(S, o = {}) {
  const pause = o.pause || (async () => {}), rng = o.rng, object = new THREE.Group(), snowOn = o.snow !== false, H = 7.5;
  const iron = [];
  const cyl = (r0, r1, y0, y1, seg = 10) => iron.push({ g: new THREE.CylinderGeometry(r1, r0, y1 - y0, seg, 1), m: at(0, (y0 + y1) / 2, 0) });
  iron.push({ g: new THREE.BoxGeometry(1.0, 0.34, 1.0), m: at(0, 0.17, 0) });
  cyl(0.44, 0.4, 0.34, 0.62, 8); cyl(0.4, 0.26, 0.62, 1.25, 8); cyl(0.3, 0.3, 1.25, 1.4, 12);
  // the shaft: a fluted column, slimmer toward the top
  { const prof = [], n = 9; for (let i = 0; i <= n; i++) { const t = i / n; prof.push(new THREE.Vector2(lerp(0.19, 0.125, t) * (1 + 0.1 * Math.exp(-t * 14)), lerp(1.4, 5.0, t))); }
    const g = new THREE.LatheGeometry(prof, 12); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)), k = 1 - 0.07 * (0.5 + 0.5 * Math.cos(a * 6)); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
    g.computeVertexNormals(); iron.push({ g }); }
  cyl(0.24, 0.24, 2.05, 2.17, 12); cyl(0.2, 0.2, 4.86, 5.0, 12); cyl(0.26, 0.2, 5.0, 5.14, 12);
  // the ladder bar under the lantern
  iron.push({ g: new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), m: at(0, 4.74, 0, 0, 0, Math.PI / 2) });
  for (const sx of [-1, 1]) iron.push({ g: new THREE.SphereGeometry(0.1, 8, 6), m: at(sx * 0.87, 4.74, 0) });
  cyl(0.1, 0.085, 5.14, 5.56, 8);
  // lantern: a cradle, a tapered frame of four corner bars, rims, a roof with a little chimney and a finial
  const y0 = 5.6, y1 = 6.7, b0 = 0.3, b1 = 0.54;
  iron.push({ g: new THREE.BoxGeometry(b0 * 2 + 0.12, 0.08, b0 * 2 + 0.12), m: at(0, y0 - 0.04, 0) });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p0 = new THREE.Vector3(sx * b0, y0, sz * b0), p1 = new THREE.Vector3(sx * b1, y1, sz * b1), d = p1.clone().sub(p0), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    iron.push({ g: new THREE.BoxGeometry(0.085, len, 0.085), m: new THREE.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)) });
    // curled brackets from the neck to the cradle
    iron.push({ g: new THREE.TorusGeometry(0.2, 0.022, 5, 8, Math.PI), m: at(sx * 0.17, y0 - 0.26, sz * 0.17, 0, Math.atan2(-sz, sx), Math.PI / 2) });
  }
  for (const [a, b] of [[1, 0], [0, 1]]) for (const s of [-1, 1]) {
    iron.push({ g: new THREE.BoxGeometry(a ? 0.06 : b1 * 2 + 0.06, 0.06, a ? b1 * 2 + 0.06 : 0.06), m: at(a * s * b1, y1, b * s * b1) });
  }
  { const g = new THREE.CylinderGeometry(0.16, 0.7, 0.42, 4, 1); iron.push({ g, m: at(0, y1 + 0.21, 0, 0, Math.PI / 4, 0) }); }
  cyl(0.15, 0.13, y1 + 0.42, y1 + 0.6, 8); cyl(0.22, 0.05, y1 + 0.6, y1 + 0.68, 8);
  iron.push({ g: new THREE.SphereGeometry(0.07, 8, 6), m: at(0, y1 + 0.75, 0) });
  const ironMat = lampLit(new THREE.MeshLambertMaterial({ color: '#23262b' }), S, 'iron');
  object.add(new THREE.Mesh(mergeSolid(iron), ironMat));
  await pause();

  // glass: four panes that carry the flame's glow, brightest low in the middle, frosted toward the bars
  const tU = o.time || { value: 0 };
  const glassU = { uLevel: { value: 1 }, uFlick: { value: 1 }, uTime: tU, uCol: { value: new THREE.Color('#ffb347') }, ...fx.fogUniforms() };
  const gp = [], gu = [], gi = [];
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), ins = 0.985, base = gp.length / 3;
    const P = (h, t, y) => { const d = h * ins; gp.push(c * d - s * t * h * ins, y, s * d + c * t * h * ins); };
    P(b0, -1, y0); gu.push(0, 0); P(b0, 1, y0); gu.push(1, 0); P(b1, 1, y1); gu.push(1, 1); P(b1, -1, y1); gu.push(0, 1);
    gi.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const glassG = new THREE.BufferGeometry(); glassG.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); glassG.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2)); glassG.setIndex(gi);
  const glass = new THREE.Mesh(glassG, new THREE.ShaderMaterial({
    uniforms: glassU, fog: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform float uLevel, uTime, uFlick; uniform vec3 uCol; varying vec2 vUv;
      void main(){
        vec2 q = vUv - vec2(.5, .34); q.x *= 1.25;
        float fl = uFlick;
        float core = exp(-dot(q, q) * 9.) * fl, body = .55 + .45 * exp(-dot(q, q) * 2.2);
        float frost = smoothstep(.3, .5, max(abs(vUv.x - .5), abs(vUv.y - .5) * .9));
        vec3 col = uCol * (body * 1.15 + core * 3.4) * uLevel + vec3(1., .86, .6) * core * core * 2.4 * uLevel;
        col = mix(col, col * .55 + vec3(.5, .56, .7) * (.12 + .1 * uLevel), frost * .6);
        gl_FragColor = vec4(fxApplyFog(col), 1.);
      }`,
  }));
  object.add(glass);

  // snow: on the roof, the ladder bar, the plinth, and a drift round the foot
  const snowMat = lampLit(new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(SNOW[0], SNOW[1], SNOW[2]), emissive: '#1b2a4a', emissiveIntensity: 0.35 }), S, 'snow');
  let drift = null;
  if (snowOn) {
    const sn = [];
    { const g = new THREE.SphereGeometry(0.62, 12, 6, 0, TAU, 0, Math.PI / 2); sn.push({ g, m: at(0, y1 + 0.2, 0, 0, Math.PI / 4, 0, 1.12, 0.62, 1.12) }); }
    sn.push({ g: new THREE.SphereGeometry(0.24, 8, 5, 0, TAU, 0, Math.PI / 2), m: at(0, y1 + 0.66, 0, 0, 0, 0, 1, 0.7, 1) });
    sn.push({ g: new THREE.CapsuleGeometry(0.07, 1.5, 3, 6), m: at(0, 4.81, 0, 0, 0, Math.PI / 2, 1, 1, 1.3) });
    sn.push({ g: new THREE.SphereGeometry(0.58, 10, 5, 0, TAU, 0, Math.PI / 2), m: at(0, 0.3, 0, 0, 0, 0, 1.15, 0.5, 1.15) });
    object.add(new THREE.Mesh(mergeSolid(sn), snowMat));
    await pause();
    const R = 3.6, g = new THREE.CircleGeometry(R, 28, 0, TAU); g.rotateX(-Math.PI / 2);
    const rings = 7, P = [], idx = [], ph = rng ? rng() * 9 : 0, lean = rng ? rng.range(0, TAU) : 0;
    for (let i = 0; i <= rings; i++) for (let k = 0; k < 28; k++) {
      const r = R * i / rings, a = k / 28 * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, wob = 0.75 + 0.25 * Math.sin(a * 3 + ph) + 0.18 * Math.cos(a - lean);
      P.push(x, (0.62 * Math.exp(-r * r / (1.9 * wob)) + 0.16 * (1 - r / R)) * (1 - sstep(0.75, 1, i / rings)) - 0.05 * sstep(0.7, 1, i / rings), z);
    }
    for (let i = 0; i < rings; i++) for (let k = 0; k < 28; k++) { const a = i * 28 + k, b = i * 28 + (k + 1) % 28; idx.push(a, a + 28, b, b, a + 28, b + 28); }
    g.dispose(); const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dg.setIndex(idx); dg.computeVertexNormals();
    drift = new THREE.Mesh(dg, snowMat); object.add(drift);
  }

  // the glow: a small hot core and a wide soft halo, their flicker phases dealt from this lamp's own stream
  const lantern = new THREE.Vector3(0, (y0 + y1) / 2 - 0.1, 0);
  const halo = fx.makeGlows({ rng, time: tU, positions: [[0, lantern.y, 0], [0, lantern.y, 0]], colors: ['#ffb347', '#ff9a3a'], sizes: [0.8, 3.6], size: 2.6, intensity: 1.15, flicker: 0.12 });
  object.add(halo.object);
  // the flame's flicker, one rule for the glass and for the light the world throws from it; its three phases are this lamp's own
  const fp = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)];
  return {
    object, lantern, top: H, glass, halo, drift,
    setLevel(k) { glassU.uLevel.value = k; halo.uniforms.uIntensity.value = 1.15 * k; },
    flicker(time) { const f = 0.05 * Math.sin(time * 9.1 + fp[0]) + 0.04 * Math.sin(time * 23.7 + fp[1]) + 0.03 * Math.sin(time * 3.3 + fp[2]); glassU.uFlick.value = 0.9 + f * 1.35; return 0.93 + f; },
    update(time) { tU.value = time; },
  };
}

// ---------------------------------------------------------------- falling snow that goes gold where it crosses a lamp's light
// A box of flakes centred on the eye's place (and on nothing else of the camera), wrapping as the eye moves; flakes fade over the outer fifth of the box, 34 to 42 m from the eye,
// where one is two pixels across. uniforms.uAmount (0..1) thins it; uniforms.uTint is the flakes' own light.
export function makeFlakes(S, o = {}) {
  const rng = o.rng, n = o.count || 5200, box = o.box || [84, 36, 84];
  const base = new Float32Array(n * 4 * 3), seed = new Float32Array(n * 4 * 2), corner = new Float32Array(n * 4 * 2), idx = new Uint32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const b = [rng(), rng(), rng()], s = [rng(), rng()];
    for (let k = 0; k < 4; k++) { base.set(b, (i * 4 + k) * 3); seed.set(s, (i * 4 + k) * 2); corner.set([k % 2 ? 1 : -1, k > 1 ? 1 : -1], (i * 4 + k) * 2); }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2)); g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  const uniforms = {
    uBox: { value: new THREE.Vector3(box[0], box[1], box[2]) }, uTime: o.time || { value: 0 }, uAmount: { value: 1 }, uRoof: { value: new THREE.Vector4(0, 0, 0, 0) }, uSize: { value: o.size ?? 0.085 },
    uTint: { value: new THREE.Color(0.62, 0.72, 0.95) }, uLampPos: S.uLampPos, uLampCol: S.uLampCol, ...fx.fogUniforms(),
  };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: fx.GLSL_FOG_PARS_VERT + LAMP_GLSL + /* glsl */`
      attribute vec2 aSeed, aCorner; uniform vec3 uBox, uTint; uniform vec4 uRoof; uniform float uTime, uAmount, uSize; varying vec2 vC; varying vec4 vCol;
      void main(){
        vec3 centre = cameraPosition;
        vec3 p = position * uBox;
        float fall = 1.3 + aSeed.x * 1.5;
        p.y -= uTime * fall;
        p.x += uTime * .55 + sin(uTime * (.5 + aSeed.y) + aSeed.x * 40.) * .7;
        p.z += uTime * .2 + cos(uTime * (.4 + aSeed.x * .7) + aSeed.y * 31.) * .6;
        p = mod(p - centre, uBox) - .5 * uBox + centre;
        vec4 mvPosition = viewMatrix * vec4(p, 1.);
        float dist = -mvPosition.z, sz = uSize * (.6 + 1.1 * aSeed.y) * max(1., dist * .012);
        mvPosition.xy += aCorner * sz;
        gl_Position = projectionMatrix * mvPosition;
        vec3 e = abs(p - centre) / (.5 * uBox);
        float a = (1. - smoothstep(.8, 1., max(e.x, max(e.y, e.z)))) * smoothstep(1., 4.5, dist);
        a *= step(fract(aSeed.x * 7.31 + aSeed.y * 3.7), uAmount) * min(1., uSize * (.6 + 1.1 * aSeed.y) / sz * 1.6);
        a *= 1. - uRoof.w * step(abs(p.x - uRoof.x), uRoof.y) * smoothstep(uRoof.z - 1., uRoof.z + 5., p.z);
        vec3 col = uTint;
        for (int i = 0; i < 2; i++) { vec3 L = uLampPos[i] - p; col += uLampCol[i] * lampFall(dot(L, L)) * .42; }
        vCol = vec4(col, a); vC = aCorner;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`varying vec2 vC; varying vec4 vCol;
      void main(){
        float d = dot(vC, vC), a = vCol.a * (1. - smoothstep(.25, 1., d));
        if (a < .004) discard;
        gl_FragColor = vec4(fxFogPremult(vCol.rgb * a, a), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { object: mesh, uniforms, material, update(time) { uniforms.uTime.value = time; } };
}

// ---------------------------------------------------------------- the wardrobe mouth: fur coats in rows, a gap down the middle
// One coat, hook at the origin, hanging down -Y, broad across X: a round body in deep hanging folds from sloping shoulders, two sleeves hanging at its sides with fur cuffs,
// a thick rolled collar with lapels; over the pelt, locks of fur at the folds' ridges, a fringe at the hem, a ruff on the collar.
const COAT_CUTS = [{}, { length: 6.1, width: 1.1, collar: 1.5 }, { length: 7.4, width: 0.92, collar: 0.8 }];
// how far a coat of a cut reaches to its side from its hook, sleeve and cuff counted (at scale 1)
const coatReach = (cut) => 1.62 * (cut.width ?? 1) + 0.1 + 0.56;
async function coatGeometry(rng, o = {}, pause = async () => {}) {
  const L = o.length ?? 6.8, Wd = o.width ?? 1, cell = CELL.grass, SOLID = [SOLID_U, SOLID_V];
  const P = [], N = [], UV = [], F = [], I = []; let count = 0;
  const v = (p, n, uv, tip, shade) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); UV.push(uv[0], uv[1]); F.push(tip, shade); return count++; };
  const band = (ra, rb) => { const n = ra.length; for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; I.push(ra[k], ra[k1], rb[k1], ra[k], rb[k1], rb[k]); } };
  // body cross-sections: [y, half width, half depth]
  const sec = [[-0.25, 0.42, 0.4], [-0.7, 1.32, 0.62], [-1.5, 1.38, 0.84], [-2.9, 1.25, 0.8], [-L * 0.6, 1.5, 0.94], [-L * 0.82, 1.7, 1.04], [-L, 1.86, 1.1]].map((s) => [s[0], s[1] * Wd, s[2]]);
  const secAt = (y) => { for (let i = 0; i < sec.length - 1; i++) if (y >= sec[i + 1][0]) { const t = (y - sec[i][0]) / (sec[i + 1][0] - sec[i][0]); return [lerp(sec[i][1], sec[i + 1][1], t), lerp(sec[i][2], sec[i + 1][2], t)]; } return [sec[sec.length - 1][1], sec[sec.length - 1][2]]; };
  // the folds: pleats that begin under the shoulders and deepen to the hem
  const sides = 20, nRow = 12, folds = rng.int(5, 7), fph = rng.range(0, TAU), rings = [];
  const foldAt = (a, y) => (0.7 * Math.sin(a * folds + fph) + 0.3 * Math.sin(a * (2 * folds + 1) + fph * 2.3)) * sstep(-0.9, -L * 0.75, y);
  const skin = (a, y, out = 1) => { const s = secAt(y), m = (1 + 0.2 * foldAt(a, y)) * out; return [Math.cos(a) * s[0] * m, y, Math.sin(a) * s[1] * m]; };
  for (let j = 0; j <= nRow; j++) { const y = lerp(sec[0][0], -L, Math.pow(j / nRow, 1.2)), ring = [];
    for (let k = 0; k < sides; k++) { const a = k / sides * TAU, f = foldAt(a, y), p = skin(a, y); if (j === nRow) p[1] += 0.14 * f; ring.push(v(p, [Math.cos(a), 0, Math.sin(a)], SOLID, 0, 0.74 + 0.3 * f)); }
    rings.push(ring); if (j) band(rings[j - 1], ring); }
  { const top = v([0, sec[0][0] + 0.1, 0], [0, 1, 0], SOLID, 0, 0.6); for (let k = 0; k < sides; k++) I.push(top, rings[0][(k + 1) % sides], rings[0][k]); }
  // sleeves: from the shoulder's end, hanging a little out and forward, the elbow easy, a wide fur cuff
  const cuffs = [];
  for (const sx of [-1, 1]) {
    const s0 = [sx * 1.3 * Wd, -0.78, 0], s1 = [sx * (1.62 * Wd + 0.1), -Math.min(4.6, L * 0.66), 0.2], seg = 6; let prev = null;
    for (let j = 0; j <= seg; j++) { const t = j / seg, ring = [], cuff = j >= seg - 1, r = cuff ? 0.56 : lerp(0.52, 0.42, t), cx = lerp(s0[0], s1[0], t), cy = lerp(s0[1], s1[1], t), cz = lerp(s0[2], s1[2], t) + 0.22 * Math.sin(Math.PI * t);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ring.push(v([cx + Math.cos(a) * r * 0.9, cy, cz + Math.sin(a) * r], [Math.cos(a), 0, Math.sin(a)], SOLID, cuff ? 0.3 : 0, cuff ? 1.12 : 0.76 + 0.12 * Math.sin(a * 3 + t * 4))); }
      if (prev) band(prev, ring); prev = ring;
      if (j === seg) { const end = v([cx, cy - 0.05, cz], [0, -1, 0], SOLID, 0, 0.25); for (let k = 0; k < 8; k++) I.push(end, ring[k], ring[(k + 1) % 8]); cuffs.push([cx, cy, cz]); } }
  }
  // the collar: a thick roll of fur round the neck, falling down the front as lapels
  const cr = o.collar ?? 1, roll = [];
  { let prev = null;
    for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, c = Math.cos(a), sn = Math.sin(a), front = Math.max(0, sn), cx = c * 0.66 * Wd, cz = sn * 0.5 + 0.12 * front, cy = -0.42 - 0.75 * front * front * cr, rr = 0.24 * cr * (1 + 0.25 * front), ring = [];
      for (let k = 0; k < 6; k++) { const b = k / 6 * TAU, ox = Math.cos(b), oy = Math.sin(b); ring.push(v([cx + c * ox * rr, cy + oy * rr, cz + sn * ox * rr], [c * ox, oy, sn * ox], SOLID, 0.3, 1.16)); }
      if (prev) band(prev, ring); prev = ring; roll.push([cx, cy, cz, c, sn, rr]); } }
  // smooth normals for everything solid so far
  { for (let k = 0; k < N.length; k++) N[k] = 0;
    for (let k = 0; k < I.length; k += 3) { const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], wx = P[c] - P[a], wy = P[c + 1] - P[a + 1], wz = P[c + 2] - P[a + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; } }
    for (let k = 0; k < count; k++) { const l = Math.hypot(N[k * 3], N[k * 3 + 1], N[k * 3 + 2]) || 1; N[k * 3] /= l; N[k * 3 + 1] /= l; N[k * 3 + 2] /= l; } }
  await pause();
  // a hanging lock of fur: root on the surface, tip down and a little out
  const lock = (p, n, len, w, lift = 0.16, shade = 1) => {
    let sx = -n[2], sz = n[0]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const tip = [p[0] + n[0] * len * lift, p[1] - len, p[2] + n[2] * len * lift], h = w / 2, fl = rng() < 0.5;
    const u0 = fl ? cell[2] : cell[0], u1 = fl ? cell[0] : cell[2], nn = [n[0], 0.25, n[2]];
    const a = v([p[0] - sx * h, p[1], p[2] - sz * h], nn, [u0, cell[3]], 0, shade * 0.8), b = v([p[0] + sx * h, p[1], p[2] + sz * h], nn, [u1, cell[3]], 0, shade * 0.8);
    const c = v([tip[0] + sx * h * 1.15, tip[1], tip[2] + sz * h * 1.15], nn, [u1, cell[1]], 1, shade * 1.15), d = v([tip[0] - sx * h * 1.15, tip[1], tip[2] - sz * h * 1.15], nn, [u0, cell[1]], 1, shade * 1.15);
    I.push(a, b, c, a, c, d);
  };
  const onBody = (a, y, len, w, lift, shade) => { const s = secAt(y), c = Math.cos(a), sn = Math.sin(a), nl = Math.hypot(c * s[1], sn * s[0]) || 1; lock(skin(a, y, 1.03), [c * s[1] / nl, 0, sn * s[0] / nl], len, w, lift, shade); };
  // locks along the ridges of the folds, a fringe round the hem
  const nBody = o.locks ?? 110;
  for (let i = 0; i < nBody; i++) { const y = lerp(-0.9, -L + 0.9, Math.pow((i + rng()) / nBody, 0.9)); let a = rng() * TAU; if (foldAt(a, y) < 0) a = rng() * TAU; onBody(a, y, rng.range(0.35, 0.6), rng.range(0.26, 0.42), 0.16, rng.range(0.9, 1.2)); }
  for (let i = 0; i < 72; i++) onBody((i + rng()) / 72 * TAU, -L + rng.range(0.2, 0.5), rng.range(0.55, 0.85), rng.range(0.3, 0.5), 0.1, rng.range(0.9, 1.2));
  for (const q of cuffs) for (let i = 0; i < 16; i++) { const a = (i + rng()) / 16 * TAU; lock([q[0] + Math.cos(a) * 0.52, q[1] + rng.range(0.1, 0.6), q[2] + Math.sin(a) * 0.58], [Math.cos(a), 0, Math.sin(a)], rng.range(0.4, 0.6), rng.range(0.3, 0.45), 0.2, rng.range(1, 1.25)); }
  for (let i = 0; i < 44; i++) { const q = roll[Math.floor(rng() * 16)], out = rng.range(0.6, 1); lock([q[0] + q[3] * q[5] * out, q[1] + rng.range(-0.1, 0.25), q[2] + q[4] * q[5] * out], [q[3], 0, q[4]], rng.range(0.4, 0.7) * cr, rng.range(0.36, 0.55), 0.5, rng.range(1, 1.3)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aFur', new THREE.Float32BufferAttribute(F, 2)); g.setIndex(I);
  g.userData = { triangles: I.length / 3, length: L };
  return g;
}

const COAT_VERT = /* glsl */`
attribute vec2 aFur; attribute vec4 aCoat; attribute vec3 aTint;
uniform float uTime; uniform vec3 uCam;
varying vec2 vUv; varying vec2 vFur; varying vec3 vTint; varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying float vFir;
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
void main(){
  vUv = uv; vFur = aFur; vTint = aTint; vFir = aCoat.z; vObj = position;
  vec3 hook = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.)).xyz;
  float d = distance(uCam.xz, hook.xz), push = 1. - smoothstep(3., 11., d), side = aCoat.y;
  float roll = side * push * .34 + .03 * sin(uTime * .8 + aCoat.x * 30.), yaw = side * push * .55 + .07 * sin(uTime * .6 + aCoat.x * 17.);
  vec3 p = position, n = normal;
  float brush = .035 + .5 * push * (1. - push);
  p += n * aFur.x * brush * sin(uTime * 2.6 + position.y * 1.9 + position.x * 2.3 + aCoat.x * 50.);
  p.xz = rot(-yaw) * p.xz; n.xz = rot(-yaw) * n.xz;
  p.xy = rot(-roll) * p.xy; n.xy = rot(-roll) * n.xy;
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const COAT_FRAG = /* glsl */`
uniform sampler2D map; uniform vec3 uMouth, uFill, uMouthPos, uAxis, uRoom;
varying vec2 vUv; varying vec2 vFur; varying vec3 vTint; varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying float vFir;
float cH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(cH(i), cH(i + vec2(1., 0.)), f.x), mix(cH(i + vec2(0., 1.)), cH(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec4 tex = texture2D(map, vUv); if (tex.a < .38) discard;
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(uAxis + vec3(0., .22, 0.));
  if (dot(N, V) < 0.) N = -N;
  // the pelt: long hairs lying down the coat
  float hair = cN(vec2((vObj.x + vObj.z * .7) * 9., vObj.y * 2.2)) * .65 + cN(vec2((vObj.x - vObj.z * .6) * 23., vObj.y * 5.)) * .35;
  vec3 alb = vTint * (.5 + .62 * vFur.y) * (.7 + .5 * tex.g) * (.74 + .5 * hair);
  alb = mix(alb, vec3(.035, .12, .075) * (.6 + .9 * vFur.y), vFir * .85);
  float snow = vFir * smoothstep(.1, .55, N.y + (vFur.x - .5) * .3);
  alb = mix(alb, vec3(.78, .85, .97), snow);
  float reach = 1. / (1. + distance(vW, uMouthPos) * .028);
  float ndl = dot(N, L), wrap = clamp(ndl * .5 + .5, 0., 1.), back = clamp(dot(-V, L), 0., 1.); back *= back;
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * (.7 + .7 * rim);
  vec3 light = uFill * .7 + uRoom * (pow(clamp(-ndl * .7 + .3, 0., 1.), 1.6) * (.6 + .4 * N.y)) + uMouth * reach * (wrap * wrap * 1.1 + rim * (.5 + 1.6 * back) * (.45 + vFur.x) + vFur.x * back * .55);
  float sheen = clamp(1. - abs(dot(normalize(N + vec3(0., .55, 0.)), V)), 0., 1.); sheen *= sheen;
  light += (uRoom * .35 + uMouth * reach * .5) * sheen * (.3 + .7 * vFur.x) * (1. - vFir);
  gl_FragColor = vec4(fxApplyFog(alb * light), 1.);
}`;

function grainTexture(rng) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#c4c4c4'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) { const u = rng() * 256, w = 0.6 + rng() * 2.2, g = Math.floor(110 + rng() * 140); x.strokeStyle = `rgba(${g},${g},${g},${0.1 + rng() * 0.25})`; x.lineWidth = w; x.beginPath(); let px = u; x.moveTo(px, 0); for (let y = 0; y <= 256; y += 32) { px += (rng() - 0.5) * 5; x.lineTo(px, y); } x.stroke(); }
  for (let i = 0; i < 5; i++) { const cx = rng() * 256, cy = rng() * 256; for (let r = 3; r < 16; r += 3) { x.strokeStyle = 'rgba(40,40,40,0.25)'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, r * 0.6, r * 1.6, 0, 0, TAU); x.stroke(); } }
  x.fillStyle = 'rgba(20,20,20,0.75)'; x.fillRect(0, 0, 3, 256); x.fillStyle = 'rgba(230,230,230,0.25)'; x.fillRect(3, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
  return t;
}

// The wardrobe: local frame = the flight's entry frame. The flight comes in at the origin heading -Z; the doors stand open behind (+Z),
// the back is gone and the wood begins at z = -depth. o: { rng, map (leaf atlas), time, depth: 24 }
// -> { object, coats (InstancedMesh), uniforms, rows, depth, update(time, camPos) }
// o.pause: an async function awaited between the heavy pieces (the woodwork, the grain, each cut of coat), so a build has no long step in it
export async function makeWardrobe(S, o = {}) {
  const pause = o.pause || (async () => {}), rng = o.rng, object = new THREE.Group(), depth = o.depth ?? 24, HW = 12.4, HT = 17.2, Z1 = 8, Z0 = -depth;
  // woodwork: boxes with a grain texture whose seams make planks
  const P = [], N = [], C = [], UV = [], I = []; let cnt = 0;
  const wood = lin('#6b4126'), woodDark = lin('#44281a'), woodLight = lin('#86583a');
  const face = (a, b, c, d, n, col, uv) => { for (const [q, t] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [d, uv[3]]]) { P.push(q[0], q[1], q[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); UV.push(t[0], t[1]); } I.push(cnt, cnt + 1, cnt + 2, cnt, cnt + 2, cnt + 3); cnt += 4; };
  // box with planks running along `grain` ('x' | 'y' | 'z'); plank width pw
  const box = (x0, y0, z0, x1, y1, z1, col, grain = 'y', pw = 1.6) => {
    const k = 1 / pw, j = rng() * 7;
    const uvOf = (p, nAxis) => { const along = grain === 'x' ? p[0] : grain === 'y' ? p[1] : p[2]; const across = nAxis === 'x' ? (grain === 'y' ? p[2] : p[1]) : nAxis === 'y' ? (grain === 'x' ? p[2] : p[0]) : (grain === 'y' ? p[0] : p[1]); return [across * k + j, along * 0.11 + j]; };
    const q = (x, y, z) => [x, y, z];
    const F = (a, b, c, d, n, ax) => face(a, b, c, d, n, mul3(col, 0.86 + rng() * 0.28), [uvOf(a, ax), uvOf(b, ax), uvOf(c, ax), uvOf(d, ax)]);
    F(q(x1, y0, z1), q(x1, y0, z0), q(x1, y1, z0), q(x1, y1, z1), [1, 0, 0], 'x'); F(q(x0, y0, z0), q(x0, y0, z1), q(x0, y1, z1), q(x0, y1, z0), [-1, 0, 0], 'x');
    F(q(x0, y1, z1), q(x1, y1, z1), q(x1, y1, z0), q(x0, y1, z0), [0, 1, 0], 'y'); F(q(x0, y0, z0), q(x1, y0, z0), q(x1, y0, z1), q(x0, y0, z1), [0, -1, 0], 'y');
    F(q(x0, y0, z1), q(x1, y0, z1), q(x1, y1, z1), q(x0, y1, z1), [0, 0, 1], 'z'); F(q(x1, y0, z0), q(x0, y0, z0), q(x0, y1, z0), q(x1, y1, z0), [0, 0, -1], 'z');
  };
  box(-HW - 0.7, -0.5, Z0, HW + 0.7, 0, Z1, woodLight, 'z', 1.9);                                   // floor boards
  for (const sx of [-1, 1]) {
    box(sx > 0 ? HW : -HW - 0.6, 0, Z0, sx > 0 ? HW + 0.6 : -HW, HT, Z1, wood, 'y', 2.1);             // side
    for (let z = Z0; z <= Z1 + 0.01; z += (Z1 - Z0) / 7) box(sx * (HW - 0.22) - 0.22, 0, z - 0.45, sx * (HW - 0.22) + 0.22, HT, z + 0.45, woodDark, 'y', 0.9);   // stiles
    for (const y of [0.9, 8.4, 15.6]) box(sx * (HW - 0.16) - 0.16, y - 0.5, Z0, sx * (HW - 0.16) + 0.16, y + 0.5, Z1, woodDark, 'z', 1.0);                      // rails
    // an open door behind the entry, swung wide
    const dz = 9.5; box(sx * (HW + 0.2), 0.3, Z1, sx * (HW + 0.2) + sx * 0.5, HT - 0.3, Z1 + dz, wood, 'y', 2.3);
    box(sx * (HW + 0.2) - 0.1, 0.3, Z1 + dz - 0.5, sx * (HW + 0.2) + sx * 0.5 + 0.1, HT - 0.3, Z1 + dz, woodDark, 'y', 0.6);
  }
  box(-HW - 0.7, HT, Z0 - 0.5, HW + 0.7, HT + 0.7, Z1, wood, 'z', 2.2);                               // top
  box(-HW - 1.3, HT + 0.7, Z0 - 1.0, HW + 1.3, HT + 1.5, Z1 + 0.6, woodDark, 'x', 0.8);              // cornice
  box(-HW - 0.7, HT - 1.7, Z0 - 0.35, HW + 0.7, HT, Z0 + 0.35, woodDark, 'x', 1.7);                  // lintel over the mouth
  // rows of coats: a brass rail across, a hanger at every hook
  const rows = [], nRows = o.rows ?? 6, coatList = [];
  const furs = [lin('#a6481c'), lin('#8a8d94'), lin('#6a4630'), lin('#e6e2d8'), lin('#7a4e30'), lin('#c08a52'), lin('#54483f'), lin('#b9b2a4')];
  const order = rng.shuffle(furs.slice(0, 4)).concat(rng.shuffle(furs.slice()));
  let ci = 0;
  // Where each coat hangs at rest: the flight's line runs down the middle (x = 0). In every row the coat nearest the line hangs so that its near sleeve, cuff counted, is `gap` from the
  // line: 3.4 m in the first row (the lane our flight sways in, and a hand's breadth), widening to 5.0 m in the last, where the wood begins. The second coat of a side hangs 3.0 to 3.5 m
  // further out (not nearer the side wall than 2.4 m).
  for (let r = 0; r < nRows; r++) {
    const z = -3.6 - r * ((depth - 7.2) / (nRows - 1)) + rng.range(-0.5, 0.5), gap = lerp(3.4, 5.0, r / (nRows - 1)), y = 10.9;
    rows.push({ z, gap });
    box(-HW, y + 0.16, z - 0.13, HW, y + 0.42, z + 0.13, lin('#c79a40'), 'x', 30);
    for (const sx of [-1, 1]) for (let j = 0, x0 = 0; j < 2; j++) {
      const vi = rng.int(0, 2), sc = rng.range(0.93, 1.07), ax = j === 0 ? (x0 = gap + coatReach(COAT_CUTS[vi]) * sc) : Math.min(x0 + rng.range(3.0, 3.5), HW - 2.4), x = sx * ax;
      const fir = r === nRows - 1 ? (j === 0 ? 0.55 : 0.9) : r === nRows - 2 && j === 1 ? 0.35 : 0;
      coatList.push({ x, y, z: z + rng.range(-0.35, 0.35), side: sx, yaw: rng.range(-0.22, 0.22) + sx * 0.12, s: sc, col: order[ci++ % order.length], fir, v: vi, seed: rng() });
      box(x - 1.6, y - 0.42, z - 0.09, x + 1.6, y - 0.18, z + 0.09, woodLight, 'x', 9); box(x - 0.06, y - 0.18, z - 0.06, x + 0.06, y + 0.2, z + 0.06, lin('#b08a3a'), 'y', 9);
    }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  wg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); wg.setIndex(I);
  await pause();
  const grain = grainTexture(rng);
  await pause();
  const woodMat = lampLit(new THREE.MeshLambertMaterial({ vertexColors: true, map: grain, emissive: '#5a3418', emissiveMap: grain, emissiveIntensity: 0.6 }), S, 'wood');
  const woodMesh = new THREE.Mesh(wg, woodMat); object.add(woodMesh);

  const uniforms = {
    map: { value: o.map }, uTime: o.time || { value: 0 }, uCam: { value: new THREE.Vector3(0, 5, 60) },
    uMouth: { value: new THREE.Color(0.62, 0.78, 1.25) }, uFill: { value: new THREE.Color(0.3, 0.25, 0.23) }, uRoom: { value: new THREE.Color(0.95, 0.78, 0.6) },
    uMouthPos: { value: new THREE.Vector3(0, 7, Z0 - 8) }, uAxis: { value: new THREE.Vector3(0, 0, -1) }, ...fx.fogUniforms(),
  };
  const coatMat = new THREE.ShaderMaterial({ uniforms, fog: true, side: THREE.DoubleSide, vertexShader: fx.GLSL_FOG_PARS_VERT + COAT_VERT, fragmentShader: fx.GLSL_FOG_PARS_FRAG + COAT_FRAG });
  const variants = [];
  for (const cut of COAT_CUTS) { variants.push(await coatGeometry(rng, cut, pause)); await pause(); }
  const coats = [];
  variants.forEach((g, vi) => {
    const list = coatList.filter((c) => c.v === vi); if (!list.length) return;
    const ac = new Float32Array(list.length * 4), tint = new Float32Array(list.length * 3);
    g.setAttribute('aCoat', new THREE.InstancedBufferAttribute(ac, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
    const mesh = new THREE.InstancedMesh(g, coatMat, list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach((c, i) => { e.set(0, c.yaw, 0); mesh.setMatrixAt(i, m.compose(new THREE.Vector3(c.x, c.y, c.z), q.setFromEuler(e), new THREE.Vector3(c.s, c.s, c.s))); ac.set([c.seed, c.side, c.fir, 0], i * 4); tint.set(c.col, i * 3); });
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; object.add(mesh); coats.push(mesh);
  });
  const _w = new THREE.Vector3();
  return {
    object, coats, wood: woodMesh, uniforms, rows, depth, halfWidth: HW, height: HT,
    // camPos in world space; the mouth light point and the flight axis follow the object
    update(time, camPos) {
      uniforms.uTime.value = time; if (camPos) uniforms.uCam.value.copy(camPos);
      object.updateMatrixWorld(); uniforms.uMouthPos.value.set(0, 7, Z0 - 8).applyMatrix4(object.matrixWorld);
      uniforms.uAxis.value.set(0, 0, -1).transformDirection(object.matrixWorld);
    },
  };
}

// snow-laden firs for the season material: the kit's spruce built twice from one seed, once green and once under snow
// the dark inner mass and the trunk carry no snow in the kit's twin: pack them with shaded snow so no black pole shows through the boughs
function packFir(a, b) {
  const ca = a.attributes.color.array, cb = b.attributes.color.array, w = a.attributes.wind.array;
  for (let k = 0; k < ca.length / 3; k++) if (Math.abs(ca[k * 3] - cb[k * 3]) + Math.abs(ca[k * 3 + 2] - cb[k * 3 + 2]) < 1e-4) {
    const core = w[k * 4 + 2] > 0.5, m = core ? 0.4 : 0.3;
    if (core) { ca[k * 3] *= 0.3; ca[k * 3 + 1] *= 0.32; ca[k * 3 + 2] *= 0.34; }
    for (let c = 0; c < 3; c++) cb[k * 3 + c] = lerp(ca[k * 3 + c], SNOW[c] * 0.42, m);
  }
}
const firTwin = (core, seed, o, snow) => flora.coniferGeometry(snow ? { ...o, rng: core.makeRng(seed), snow: 1, snowColor: new THREE.Color().setRGB(SNOW[0], SNOW[1], SNOW[2]) } : { ...o, rng: core.makeRng(seed), snow: 0 });
// one fir, with a pause after each of the kit's two builds and after the packing, so a world's build has no long step in it
export async function firVariant(core, seed, o, pause) {
  const a = firTwin(core, seed, o, 0); await pause();
  const b = firTwin(core, seed, o, 1); await pause();
  packFir(a, b); await pause();
  seasonize(a, { twin: b }); b.dispose(); await pause();
  return a;
}

// ---------------------------------------------------------------- the hero
// opts.world: true -> nothing is arranged; the world places hero.lamp.object and hero.wardrobe.object itself.
// Alone (the set-piece viewer): the lamp-post in its drift on a floor of snow, firs bent with snow round it, flakes turning gold
// in its light, and the wardrobe standing open behind it with its coats.
export async function buildHero(ctx, opts = {}) {
  const seedOf = (name) => ctx.core.hashSeed(name + ':' + ctx.seed), ST = {}; for (const n of PART_STREAMS) ST[n] = ctx.core.makeRng(seedOf(n));
  const S = opts.season || makeSeason(), tU = opts.time || { value: 0 }, object = new THREE.Group();
  const matOptions = { wind: opts.wind || flora.makeWind({ direction: [0.7, 0.5], strength: 0.7, speed: 0.8 }), backlight: 1.0, backlightTint: '#d6f08a', ambient: 2.0, leafAmbient: 1.9 };
  await flora.prepareLeafTexture(matOptions, ctx.yield);
  const treeMat = opts.material || seasonMaterial(S, matOptions);
  await ctx.yield();
  const lamp = await makeLampPost(S, { rng: ST['first lamp'], snow: true, time: tU, pause: ctx.yield });
  await ctx.yield();
  const wardrobe = await makeWardrobe(S, { rng: ST.wardrobe, map: treeMat.map, time: tU, depth: WARDROBE_DEPTH, pause: ctx.yield });
  await ctx.yield();
  const hero = {
    object, lamp, wardrobe, season: S, material: treeMat, wind: matOptions.wind, time: tU,
    radius: 5.5, height: 8, center: new THREE.Vector3(0, 4.4, 0), ground: false, groundY: 0,
    anchors: { lantern: lamp.lantern.clone(), mouth: new THREE.Vector3(0, 5.5, -WARDROBE_DEPTH) },
    update(dt, time, camera) { tU.value = time; matOptions.wind.update(time); },
    dispose() {},
  };
  if (opts.world) return hero;

  // ---- alone
  object.add(lamp.object);
  S.uLampPos.value[0].copy(lamp.lantern); S.uLampCol.value[0].set(LAMP_COLOR[0], LAMP_COLOR[1], LAMP_COLOR[2]);
  const snowMat = lampLit(new THREE.MeshLambertMaterial({ color: new THREE.Color().setRGB(SNOW[0], SNOW[1], SNOW[2]), emissive: '#1b2a4a', emissiveIntensity: 0.5 }), S, 'snow');
  const floor = new THREE.Mesh(new THREE.CircleGeometry(170, 48).rotateX(-Math.PI / 2), snowMat); floor.position.y = -0.02; object.add(floor);
  const firs = [await firVariant(ctx.core, seedOf(PART_SHAPES[0]), { detail: 2, height: 13 }, ctx.yield), await firVariant(ctx.core, seedOf(PART_SHAPES[1]), { detail: 1, height: 9.5, slim: 1.2 }, ctx.yield)];
  // nine firs round the lamp, the furthest FIR_RING from it
  const rng = ST['set piece firs'], FIR_RING = 15, spots = [], ring0 = rng.range(0, TAU);
  for (let i = 0; i < 9; i++) { const a = ring0 + i * 0.62 + rng.range(-0.15, 0.15), r = i % 3 === 0 ? rng.range(5.2, 6.5) : rng.range(8, FIR_RING); spots.push({ x: Math.cos(a) * r, y: -0.3, z: Math.sin(a) * r - 1, s: rng.range(0.75, 1.15), rot: rng() * TAU, thaw: 9, snow: 1, kind: 0, v: i % 2 }); }
  for (let k = 0; k < 2; k++) object.add(seasonInstances(firs[k], treeMat, spots.filter((p) => p.v === k)));
  await ctx.yield();
  const flakes = makeFlakes(S, { rng: ST['set piece snow'], time: tU, count: 4200 });
  object.add(flakes.object);
  // the wardrobe stands open toward the lamp, its mouth 6 m beyond the furthest fir (the firs' ring is centred a metre toward it)
  wardrobe.object.position.set(0, 0, -(FIR_RING + 1 + 6 + WARDROBE_DEPTH)); wardrobe.object.rotation.y = Math.PI; object.add(wardrobe.object);
  const cam = new THREE.Vector3();
  hero.update = (dt, time, camera) => {
    tU.value = time; matOptions.wind.update(time); S.set(0, time); lamp.flicker(time);
    wardrobe.update(time, camera ? camera.getWorldPosition(cam) : null);
  };
  return hero;
}
