// TEMPEST LIGHT: a storm-petrel's flight over mountainous dusk swells to a lighthouse on a wave-battered skerry.
//
// Layout (world space == hero local space, the hero sits at the origin at mean sea level):
//   entry  ~(-215, 20, 328), 380 m from the tower inside a rain squall, flying -Z/+X with the lighthouse dead ahead and
//          the last yellow slit of daylight low on the left; bell buoy close by at u~0.07
//   0.10   squall thins, a scripted lightning strike shows tower, rock and white water
//   0.24   trawler labouring up the swell 70 m to the left (other seeds: sheltering in the lee at u~0.58, bow to the camera)
//   0.34+  hero wave detonates on the weather face; 0.45 pass the tower on its left at gallery height
//   0.5-0.8  out over the lee toward the slit and the far stacks, then one long left-hand loop
//            past the Sisters (two ledged stacks with their own wave bursts and gannets); the shafts reach 800 m here so the
//            beam sweeps overhead and paints them; a strike behind them at 0.697
//   home   the homecoming: the spray burst that climbs the tower, the beam's foot lighting the crests; the storm strikes
//          here on its own seeded schedule, out on the sea east of the skerry
//   exit   110 m straight back toward the tower from its lee side: the portal dead ahead over calmer water, the tower
//          just left of it with the beam sweeping over both and the weather-side spray bursting behind
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/tempest-light.js';

const TAU = Math.PI * 2;
const PALETTE = ['#070c14', '#14232e', '#1d4f5a', '#3b5a66', '#0a1a22', '#dfe9ee', '#ffd27a'];

// ---------- small geometry helpers (position + colour only; flat shaded, double sided materials) ----------
function tint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const box = (w, h, l, x, y, z, color, rx = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, l);
  if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
  return tint(g.translate(x, y, z), color);
};
const cyl = (r0, r1, h, seg, x, y, z, color, rx = 0, rz = 0, open = false) => {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, open);
  if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
  return tint(g.translate(x, y, z), color);
};
function mergeAndFree(list) { const g = mergeGeometries(list); for (const q of list) q.dispose(); return g; }

// ---------- the trawler ----------
// Local frame: +Z forward (bow), +Y up, +X port. Origin on the centreline at the waterline, a little aft of midships.
function buildTrawler(rng, hullHex) {
  const L = 22, B = 6.6;
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const cHull = C(hullHex), cBoot = C('#3a1512'), cStripe = C('#b9c2c4'), cDeck = C('#4a4034', 0.5), cHouse = C('#8a9391', 0.7), cDark = C('#15191c'),
    cRust = C('#6a3a22'), cNet = C('#1f5a4a', 0.6), cOrange = C('#c6551a', 0.5), cSteel = C('#59646a', 0.8);
  // lofted hull
  const NS = 18, st = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS;
    const hb = B * 0.5 * (s < 0.5 ? lerp(0.8, 1, smoothstep(0, 0.5, s)) : Math.pow(Math.max(0, 1 - Math.pow((s - 0.5) / 0.5, 2.3)), 0.62)) + 0.05;
    const g = 1.5 + 2.6 * Math.pow(s, 2.4) + 0.35 * Math.pow(1 - s, 3);
    const d = 2.0 * (1 - 0.75 * Math.pow(s, 4)) * (0.6 + 0.4 * smoothstep(0, 0.25, s));
    const z0 = (s - 0.46) * L, rake = 1.8 * s * s * s;
    const zr = (y) => z0 + rake * (y + d) / (g + d);
    const fl = 1 + 0.1 * s;
    st.push({ s, g, d, hb, pts: [
      [0, -d, zr(-d), cBoot], [0.5 * hb, -0.85 * d, zr(-0.85 * d), cBoot], [0.93 * hb, -0.15 * d, zr(-0.15 * d), cBoot], [0.975 * hb, 0.25, zr(0.25), cBoot],
      [0.975 * hb, 0.25, zr(0.25), cHull], [hb * fl, g - 0.5, zr(g - 0.5), cHull], [hb * fl, g - 0.5, zr(g - 0.5), cStripe], [hb * (fl + 0.03), g, zr(g), cStripe]],
      deck: [0.96 * hb, g - 0.75, zr(g - 0.75)] });
  }
  const pos = [], col = [];
  const vtx = (x, y, z, c) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); };
  const quad = (a, b, c, d, ca, cb) => { vtx(a[0], a[1], a[2], ca); vtx(b[0], b[1], b[2], cb); vtx(c[0], c[1], c[2], cb); vtx(a[0], a[1], a[2], ca); vtx(c[0], c[1], c[2], cb); vtx(d[0], d[1], d[2], ca); };
  for (let i = 0; i < NS; i++) {
    const A = st[i], Bn = st[i + 1];
    for (const sx of [1, -1]) {
      for (let j = 0; j < 7; j++) {
        if (j === 3 || j === 5) continue;
        const a = A.pts[j], b = A.pts[j + 1], c = Bn.pts[j + 1], d = Bn.pts[j];
        quad([a[0] * sx, a[1], a[2]], [b[0] * sx, b[1], b[2]], [c[0] * sx, c[1], c[2]], [d[0] * sx, d[1], d[2]], a[3], b[3]);
      }
    }
    quad([A.deck[0], A.deck[1], A.deck[2]], [-A.deck[0], A.deck[1], A.deck[2]], [-Bn.deck[0], Bn.deck[1], Bn.deck[2]], [Bn.deck[0], Bn.deck[1], Bn.deck[2]], cDeck, cDeck);
  }
  { // transom
    const A = st[0];
    for (const sx of [1, -1]) for (let j = 0; j < 7; j++) {
      const a = A.pts[j], b = A.pts[j + 1];
      vtx(a[0] * sx, a[1], a[2], a[3]); vtx(b[0] * sx, b[1], b[2], b[3]); vtx(0, 0.3, a[2], cHull);
    }
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hull.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

  const parts = [hull];
  // wheelhouse aft, bridge above it, funnel
  parts.push(box(3.9, 2.5, 4.6, 0, 2.15, -4.9, cHouse), box(3.2, 2.2, 3.2, 0, 4.5, -4.5, cHouse), box(3.7, 0.16, 3.9, 0, 5.68, -4.4, cDark));
  parts.push(cyl(0.42, 0.5, 2.1, 10, 0, 6.3, -6.2, cHull), cyl(0.44, 0.44, 0.35, 10, 0, 7.4, -6.2, cDark));
  parts.push(box(1.5, 0.12, 0.22, 0, 6.05, -3.6, cSteel));                                   // radar bar
  // masts, derrick, outriggers, stern gallows
  parts.push(cyl(0.07, 0.1, 5, 6, 0, 8.2, -4.4, cSteel), box(2.4, 0.08, 0.08, 0, 9.3, -4.4, cSteel));
  parts.push(cyl(0.1, 0.16, 7.4, 6, 0, 5.4, 3.2, cRust), box(0.14, 0.14, 7.6, 0, 5.0, 0.2, cRust, -0.5));
  for (const sx of [1, -1]) {
    parts.push(cyl(0.06, 0.09, 9.5, 5, sx * 4.6, 5.3, 1.2, cRust, 0, -sx * 0.62));           // outrigger boom
    parts.push(box(0.2, 3.4, 0.2, sx * 2.1, 2.6, -9.2, cRust));                              // gallows post
    parts.push(box(0.06, 0.06, 6.2, sx * 0.02 + sx * 0.5, 7.4, -0.6, cDark, sx * 0.02 - 0.72)); // stays
  }
  parts.push(box(4.4, 0.22, 0.22, 0, 4.3, -9.2, cRust));
  // deck gear: winch, hatch, fish boxes, net drum, bow rail block
  parts.push(cyl(0.55, 0.55, 2.3, 10, 0, 1.85, -1.5, cSteel, 0, Math.PI / 2), box(2.6, 0.55, 2.8, 0, 1.6, 1.7, cDark));
  parts.push(box(0.9, 0.5, 0.7, 1.5, 1.75, 4.6, cOrange), box(0.9, 0.5, 0.7, -1.3, 1.9, 5.3, C('#2c5f8a', 0.5)), box(0.9, 0.9, 0.7, 0.2, 2.3, 6.4, cOrange));
  parts.push(cyl(0.75, 0.75, 2.8, 10, 0, 1.9, -8.2, cNet, 0, Math.PI / 2));
  for (let i = 0; i < 6; i++) parts.push(box(0.3, 0.3, 0.3, rng.range(-1.6, 1.6), 1.55, rng.range(-7.6, -6.6), rng.chance(0.5) ? cOrange : cStripe));
  const bodyGeo = mergeAndFree(parts);

  // self-lit parts: windows, lamp housings (linear HDR colours on a basic material)
  const warm = C('#ffcf8a'), lit = [];
  lit.push(box(2.7, 0.75, 0.06, 0, 4.75, -2.88, C('#ffd9a0', 2.6)));                         // bridge front windows
  for (const sx of [1, -1]) {
    lit.push(box(0.06, 0.75, 2.2, sx * 1.62, 4.75, -4.4, C('#ffd9a0', 2.2)));
    for (let k = 0; k < 3; k++) lit.push(box(0.06, 0.42, 0.42, sx * 1.97, 2.5, -3.4 - k * 1.3, C('#ffc27a', 2.4)));
    lit.push(box(0.3, 0.2, 0.3, sx * 1.4, 5.5, -2.85, C('#fff0d0', 4.5)));                    // deck floods
    lit.push(box(0.16, 0.2, 0.16, sx * 1.75, 5.2, -3.3, sx > 0 ? C('#ff2a18', 5) : C('#28ff70', 4)));   // port red / starboard green
  }
  lit.push(box(0.2, 0.2, 0.2, 0, 10.75, -4.4, C('#ffffff', 7)), box(0.2, 0.2, 0.2, 0, 9.2, 3.2, C('#fff0d0', 7)), box(0.3, 0.2, 0.2, 0, 4.2, -9.3, C('#fff0d0', 6)));
  lit.push(box(3.0, 0.02, 4.0, 0, 1.93, 4.6, warm.clone().multiplyScalar(0.05)));             // faint pool on the foredeck hatch area
  const litGeo = mergeAndFree(lit);

  const group = new THREE.Group(); group.name = 'trawler';
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }));
  const lights = new THREE.Mesh(litGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }));
  group.add(body, lights);
  const lamp = new THREE.PointLight('#ffd9a8', 42, 46, 1.7); lamp.position.set(0, 7.2, 0.8); group.add(lamp);
  // glow sprites (local positions, colour, size)
  const glows = [
    { p: new THREE.Vector3(1.4, 5.5, -2.7), c: '#ffe2b0', s: 1.5 }, { p: new THREE.Vector3(-1.4, 5.5, -2.7), c: '#ffe2b0', s: 1.5 },
    { p: new THREE.Vector3(0, 10.85, -4.4), c: '#ffffff', s: 1.1 }, { p: new THREE.Vector3(0, 9.3, 3.2), c: '#ffe8c0', s: 1.2 },
    { p: new THREE.Vector3(1.85, 5.2, -3.3), c: '#ff3a20', s: 0.8 }, { p: new THREE.Vector3(-1.85, 5.2, -3.3), c: '#30ff7a', s: 0.8 },
    { p: new THREE.Vector3(0, 4.2, -9.5), c: '#ffe8c0', s: 0.9 }, { p: new THREE.Vector3(0, 4.75, -2.7), c: '#ffc880', s: 1.6 },
  ];
  return { group, body, lights, lamp, glows, length: L, beam: B, bow: new THREE.Vector3(0, 1.2, 12.2) };
}

// ---------- bell buoy ----------
function buildBuoy(hex) {
  const cl = new THREE.Color(hex), c = cl.clone().multiplyScalar(0.5), dark = new THREE.Color('#14181b'), steel = new THREE.Color('#4a5458');
  const parts = [cyl(1.5, 1.25, 1.3, 12, 0, 0.25, 0, c), cyl(1.25, 0.5, 0.7, 12, 0, -0.75, 0, dark), cyl(0.5, 0.5, 2.2, 6, 0, -2.2, 0, dark)];
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.4; parts.push(cyl(0.07, 0.07, 3.7, 4, Math.cos(a) * 0.62, 2.7, Math.sin(a) * 0.62, steel, Math.sin(a) * 0.28, -Math.cos(a) * 0.28)); }
  parts.push(cyl(0.28, 1.1, 0.12, 4, 0, 2.2, 0, steel), cyl(0.3, 0.42, 0.55, 8, 0, 3.0, 0, new THREE.Color('#7a6a3a')), cyl(0.36, 0.3, 0.5, 8, 0, 4.75, 0, c), box(0.6, 0.6, 0.06, 0, 5.45, 0, c, 0, Math.PI / 4));
  const mesh = new THREE.Mesh(mergeAndFree(parts), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, side: THREE.DoubleSide }));
  const lampGeo = cyl(0.2, 0.2, 0.3, 8, 0, 5.05, 0, new THREE.Color(1, 1, 1));
  const lamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: cl.clone(), fog: true }));
  const group = new THREE.Group(); group.name = 'buoy'; group.add(mesh, lamp);
  return { group, lamp, lampLocal: new THREE.Vector3(0, 5.05, 0) };
}

// ---------- far sea stack: a ledged, leaning basalt column (position + colour, flat shaded) ----------
function stackGeometry(rng, noise, height, radius, spire) {
  const SEG = 13, RINGS = 12, sink = 9, o = rng.range(0, 90), la = rng.range(0, TAU), lean = rng.range(0.03, 0.1), ell = rng.range(0.1, 0.3), ea = rng.range(0, TAU);
  const P = [], pos = [], col = [], c0 = new THREE.Color('#1b2328'), c1 = new THREE.Color('#0d1216'), c = new THREE.Color();
  for (let j = 0; j <= RINGS; j++) {
    const t = j / RINGS, y = -sink + (height + sink) * t, ty = clamp(y / height, 0, 1);
    let pr = lerp(1.25, 0.7, Math.pow(ty, 0.8)) * (1 - 0.26 * Math.exp(-Math.pow((ty - 0.1) / 0.07, 2))) * (1 + 0.16 * noise.n2(ty * 3.1 + o, 7.7));
    pr *= 1 + 0.1 * noise.n2(Math.floor(ty * 7) * 5.3 + o, 1.3);
    if (spire) pr *= 1 - 0.86 * ty * ty; else if (t > 0.9) pr *= lerp(1, 0.55, (t - 0.9) / 0.1);
    const cx = Math.cos(la) * lean * height * ty * ty, cz = Math.sin(la) * lean * height * ty * ty, row = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * TAU, r = radius * pr * (1 + ell * Math.cos(2 * (a - ea))) * (1 + 0.2 * noise.n3(Math.cos(a) * 1.3 + o, ty * 4, Math.sin(a) * 1.3));
      row.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    }
    P.push(row);
  }
  const put = (p, k) => { pos.push(p[0], p[1], p[2]); c.copy(c1).lerp(c0, k); col.push(c.r, c.g, c.b); };
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = P[j][i], b = P[j][(i + 1) % SEG], d = P[j + 1][i], e = P[j + 1][(i + 1) % SEG], k = 0.3 + 0.7 * rng();
    put(a, k); put(d, k); put(b, k); put(b, k); put(d, k); put(e, k);
  }
  const top = P[RINGS], ty = height + (spire ? 0 : rng.range(0.5, 2)), mx = top.reduce((s, p) => s + p[0], 0) / SEG, mz = top.reduce((s, p) => s + p[2], 0) / SEG;
  for (let i = 0; i < SEG; i++) { put(top[i], 1); put([mx, ty, mz], 1); put(top[(i + 1) % SEG], 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---------- the Sisters: near stacks with real relief (ledges, two octaves of bulge, an indexed skin of ~1.7k facets each) ----------
function sisterGeometry(rng, noise, height, radius, spire) {
  const SEG = 30, RINGS = 30, sink = 9, o = rng.range(0, 90), la = rng.range(0, TAU), lean = rng.range(0.03, 0.1), ell = rng.range(0.1, 0.3), ea = rng.range(0, TAU);
  const nV = (RINGS + 1) * SEG + 1, pos = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = [];
  const c0 = new THREE.Color('#37413f'), c1 = new THREE.Color('#131a1c'), c = new THREE.Color();
  let v = 0, mx = 0, mz = 0;
  for (let j = 0; j <= RINGS; j++) {
    const t = j / RINGS, y = -sink + (height + sink) * t, ty = clamp(y / height, 0, 1);
    let pr = lerp(1.25, 0.7, Math.pow(ty, 0.8)) * (1 - 0.26 * Math.exp(-Math.pow((ty - 0.1) / 0.07, 2))) * (1 + 0.16 * noise.n2(ty * 3.1 + o, 7.7));
    if (spire) pr *= 1 - 0.86 * ty * ty; else if (t > 0.9) pr *= lerp(1, 0.5, Math.pow((t - 0.9) / 0.1, 1.6));
    const cx = Math.cos(la) * lean * height * ty * ty, cz = Math.sin(la) * lean * height * ty * ty;
    for (let i = 0; i < SEG; i++, v++) {
      const a = (i / SEG) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      // ledges: each band swells a little as it rises, then steps back in; the step height wanders round the column
      const lt = y / 7.6 + 0.55 * noise.n2(ca * 0.9 + o, sa * 0.9 + 4.1), lf = lt - Math.floor(lt), led = 0.13 * (lf - 0.5) * smoothstep(0, 0.2, ty);
      const bulge = 0.2 * noise.n3(ca * 1.3 + o, ty * 4, sa * 1.3) + 0.085 * noise.n3(ca * 3.9 + o, ty * 12, sa * 3.9) + 0.035 * noise.n3(ca * 9 + o, ty * 30, sa * 9);
      const r = radius * pr * (1 + ell * Math.cos(2 * (a - ea))) * (1 + bulge + led);
      const x = cx + ca * r, z = cz + sa * r;
      pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
      if (j === RINGS) { mx += x / SEG; mz += z / SEG; }
      const k = 0.35 + 0.4 * (0.5 + 0.5 * noise.n3(ca * 2.2 + o, ty * 9, sa * 2.2)) + 0.25 * (1 - lf);
      c.copy(c1).lerp(c0, clamp(k, 0, 1)); col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
    }
  }
  pos[v * 3] = mx; pos[v * 3 + 1] = height + (spire ? 0.5 : rng.range(0.5, 2)); pos[v * 3 + 2] = mz; col[v * 3] = c0.r; col[v * 3 + 1] = c0.g; col[v * 3 + 2] = c0.b;
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * SEG + i, b = j * SEG + (i + 1) % SEG, d = a + SEG, e = b + SEG;
    if ((i + j) & 1) idx.push(a, d, b, b, d, e); else idx.push(a, d, e, a, e, b);
  }
  for (let i = 0; i < SEG; i++) idx.push(RINGS * SEG + i, v, RINGS * SEG + (i + 1) % SEG);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}
// their material: strata and blotches, a wet dark foot with a breathing foam line, fine relief on the facets; the slit only
// rims them (no flat orange facets), the beam paints them warm as it passes and lightning lifts them cold
function patchStack(mat, U, timeU) {
  mat.onBeforeCompile = (sh) => {
    for (const k of ['uTLamp', 'uTBeam', 'uTLampCol', 'uTBeamI', 'uTFlash']) sh.uniforms[k] = U[k];
    sh.uniforms.uTTime = timeU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vTW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', /* glsl */`#include <common>
        varying vec3 vTW; uniform vec3 uTLamp, uTBeam, uTLampCol; uniform float uTBeamI, uTFlash, uTTime;
        float tkH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float tkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(tkH(i), tkH(i + vec2(1., 0.)), f.x), mix(tkH(i + vec2(0., 1.)), tkH(i + vec2(1., 1.)), f.x), f.y); }
        float tkF(vec2 p){ return .5 * tkN(p) + .25 * tkN(p * 2.03 + 17.1) + .125 * tkN(p * 4.1 + 31.7) + .0625 * tkN(p * 8.3 + 5.3); }
        float tkFoam = 0.;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        { float ta = atan(vTW.x + 280., vTW.z + 205.);
          float s1 = tkN(vec2(vTW.y * .5 + tkN(vTW.xz * .11) * 3.5, 3.7)), s2 = tkF(vTW.xz * .4 + vTW.y * .27);
          float crk = smoothstep(.55, .75, tkN(vec2(dot(vTW.xz, vec2(.9, .7)) * 1.6, vTW.y * .22)));          // vertical joints
          diffuseColor.rgb *= (.5 + 1.0 * s1) * (.65 + .7 * s2) * (1. - .45 * crk);
          diffuseColor.rgb *= mix(.4, 1., smoothstep(1.5, 11., vTW.y + 4. * (s2 - .5)));                       // wet foot
          float lace = smoothstep(.35, .7, tkF(vTW.xz * .6 + vec2(vTW.y * .5 - uTTime * .6, uTTime * .25)));
          float wl = 2.2 + 2.6 * sin(uTTime * .9 + ta * 2.) + 3. * (tkN(vTW.xz * .2 + uTTime * .12) - .5);
          tkFoam = clamp(smoothstep(wl + 2.2, wl - 1.5, vTW.y + 2. * (lace - .5)) * lace, 0., 1.);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.6, .68, .7), tkFoam * .85); }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        { vec3 bq = vTW * .7; float b1 = tkF(bq.xz + bq.y * .37), b2 = tkF(bq.zx * 1.3 + bq.y * .61 + 9.), b3 = tkF(vec2(bq.y * 1.9, bq.x + bq.z));
          normal = normalize(normal + (viewMatrix * vec4(b1 - .5, (b3 - .5) * .8, b2 - .5, 0.)).xyz * .42);
          float up = dot((viewMatrix * vec4(0., 1., 0., 0.)).xyz, normal);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.3, .34, .34), smoothstep(.35, .8, up) * smoothstep(.45, .7, b1) * smoothstep(14., 30., vTW.y) * .5); }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { vec3 tb = vTW - uTLamp; float td = max(length(tb), 1.);
          float tc = smoothstep(.972, .9992, abs(dot(tb / td, uTBeam)));
          vec3 tlv = normalize((viewMatrix * vec4(-tb, 0.)).xyz); float tnl = max(dot(normal, tlv), 0.);
          float upw = dot((viewMatrix * vec4(0., 1., 0., 0.)).xyz, normal) * .5 + .5;
          totalEmissiveRadiance += (diffuseColor.rgb * 5. + .02) * uTLampCol * tc * uTBeamI * (.12 + .88 * tnl) * 2.6 / (1. + td / 260.);
          totalEmissiveRadiance += diffuseColor.rgb * vec3(.34, .44, .47) * (.3 + .7 * upw) * 1.9;              // cold sky fill so the forms read
          totalEmissiveRadiance += (diffuseColor.rgb + .012) * vec3(.6, .74, .86) * uTFlash * (.5 + upw) * 1.0;
          totalEmissiveRadiance += tkFoam * vec3(.2, .27, .29) * (1. + 2.2 * uTFlash); }`)
      .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
        reflectedLight.directDiffuse *= vec3(.42, .5, .56); reflectedLight.directSpecular *= .5;`);
  };
  mat.customProgramCacheKey = () => 'tempest-light-sister';
  return mat;
}

// ---------- bow spray: one ballistic sheet of droplets (streaks drawn out along their flight) plus a little mist, replayed from uAge ----------
function buildBowSpray(rng, origin, fogU, vs = 1, zs = 1, ss = 1) {
  const N = 700, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(N * 4), b = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const mist = i % 6 === 0, side = rng.sign(), fan = Math.pow(rng(), 0.7), out = 1.5 + 9.5 * fan, up = rng.range(6, 15) * (1.1 - 0.5 * fan) * (mist ? 0.7 : 1);
    a.set([(side * out + rng.gauss() * 0.7) * vs, up * vs, (rng.range(-7.5, 0.5) - 2 * fan) * vs * zs, rng.range(0, 0.3) * vs], i * 4);     // velocity (boat frame), delay
    b.set([(mist ? rng.range(2.5, 4.5) : rng.range(0.22, 0.8)) * ss, mist ? 2 + rng() : rng(), rng.range(1.2, 2.2) * (0.5 + 0.5 * vs), rng.range(-1, 1) * ss], i * 4);   // size, seed (+2 = mist), life, lateral start
  }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(b, 4));
  g.instanceCount = N; g.boundingSphere = new THREE.Sphere(origin.clone(), 40);
  const uniforms = { ...fogU(), uAge: { value: 99 }, uOrigin: { value: origin.clone() }, uColor: { value: new THREE.Color(1, 1, 1) }, uStrength: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aA, aB; uniform float uAge; uniform vec3 uOrigin; varying vec2 vUv; varying float vA, vS, vM;
      #include <fog_pars_vertex>
      void main(){
        float t = uAge - aA.w, k = clamp(t / aB.z, 0., 1.);
        vM = step(1.5, aB.y); vS = fract(aB.y);
        vec3 p = uOrigin + vec3(aB.w * .9, 0., 0.) + aA.xyz * t * (1. - .25 * k) + vec3(0., -4.9 * t * t, 0.);
        vec3 vel = aA.xyz * (1. - .5 * k) + vec3(0., -9.8 * t, 0.);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vec2 dv = (modelViewMatrix * vec4(vel, 0.)).xy; float sp = length(dv); dv /= max(sp, 1e-3);
        float sz = aB.x * (.5 + .8 * k), el = mix(1.6 + min(sp * .22, 3.2), 1., vM);
        if (vM > .5) dv = vec2(0., 1.);
        mvPosition.xy += (vec2(dv.y, -dv.x) * position.x + dv * position.y * el) * sz;
        vUv = position.xy;
        vA = (t > 0. ? 1. : 0.) * smoothstep(0., .08, k) * (1. - k) * (1. - k);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; varying float vA, vS, vM;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vUv); if (r > 1. || vA < .003) discard;
        float n = sin(vUv.x * 5. + vS * 40.) * sin(vUv.y * 6. - vS * 27.);
        float drop = (1. - abs(vUv.x)) * (1. - vUv.y * vUv.y) * (.6 + .4 * vUv.y);                 // bright head, fading tail
        float al = mix(drop * .8, smoothstep(1., .1, r + .3 * n) * .16, vM) * vA * uStrength;
        gl_FragColor = vec4(uColor * mix(1.15, .8, vM), 1.);
        #include <fog_fragment>
        gl_FragColor = vec4(gl_FragColor.rgb * al, al);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'bow-spray';
  return { mesh, uniforms };
}

// ---------- far rain shafts hanging under the cloud base (y-axis billboards, streaked, lit by lightning and the slit) ----------
function buildRainShafts(rng, slitDir, baseCol, slitCol) {
  const N = 6, pos = [], uv = [], cen = [], par = [], idx = [];
  for (let i = 0; i < N; i++) {
    const a = rng.range(0, TAU), r = rng.range(700, 1500), w = rng.range(420, 820), h = rng.range(330, 460);
    const cx = Math.sin(a) * r, cz = -Math.cos(a) * r - 150, lean = rng.range(0.15, 0.5), seed = rng.range(0, 50);
    const k = pos.length / 3;
    for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(u * w * 0.5, v * h - 12, 0); uv.push(u, v); cen.push(cx, 0, cz); par.push(lean, seed, rng.range(0.45, 1)); }
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCen', new THREE.Float32BufferAttribute(cen, 3)); g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 3)); g.setIndex(idx);
  const uniforms = { uTime: { value: 0 }, uFlash: { value: 0 }, uOpacity: { value: 0 }, uSlit: { value: slitDir.clone() }, uBase: { value: baseCol.clone() }, uSlitCol: { value: slitCol.clone() } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aCen, aPar; uniform float uTime; varying vec2 vUv; varying vec3 vPar; varying float vSlit; uniform vec3 uSlit;
      void main(){
        vec3 c = aCen + vec3(sin(uTime * .011 + aPar.y) * 60., 0., cos(uTime * .009 + aPar.y) * 60.);
        vec3 toC = normalize(vec3(cameraPosition.x - c.x, 0., cameraPosition.z - c.z)), right = vec3(toC.z, 0., -toC.x);
        vec3 wp = c + right * (position.x + aPar.x * (position.y - 440.) * .55) + vec3(0., position.y, 0.);
        vUv = uv; vPar = aPar; vSlit = pow(max(dot(-toC, uSlit), 0.), 6.);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFlash, uOpacity; uniform vec3 uBase, uSlitCol; varying vec2 vUv; varying vec3 vPar; varying float vSlit;
      float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
      void main(){
        float x = vUv.x * 6. + vPar.y + .35 * n1(vUv.y * 2.3 + vPar.y);                // broad, slightly wavering veils, no fine barcode
        float st = .68 * n1(x + uTime * .02) + .32 * n1(x * 2.3 + 3.);
        float fall = n1(x * 3.1 + 11.) * .5 + .5;                                    // each streak reaches a different depth
        float ex = 1. - vUv.x * vUv.x;
        float a = smoothstep(.15, .95, st) * ex * ex * smoothstep(1., .42, vUv.y) * smoothstep(-.1 + .12 * (1. - fall), .5, vUv.y + .12);
        a *= vPar.z * uOpacity * (.07 + .16 * vSlit);
        vec3 col = uBase * (1. + 2.5 * uFlash) + uSlitCol * vSlit * .55 + vec3(.5, .62, .8) * uFlash * .35;
        gl_FragColor = vec4(col, a);
      }`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 0; mesh.name = 'rain-shafts';
  return { mesh, uniforms };
}

// ---------- shader patches: the lighthouse lamp, the portal and lightning on kit materials that have no scene lights ----------
// Both are guarded: if the kit shader no longer contains the anchor line the material is left as it is.
const GLSL_TL_UNIFORMS = /* glsl */`
uniform vec3 uTLamp, uTBeam, uTLampCol, uTPortal, uTPortalCol; uniform float uTBeamI, uTFlash;
`;
function patchOcean(ocean, U) {
  const m = ocean.material, anchor = 'col += spec*(1.-fa);';
  if (!m || typeof m.fragmentShader !== 'string' || !m.fragmentShader.includes(anchor) || !m.fragmentShader.includes('void main(){')) return false;
  Object.assign(m.uniforms, U);
  m.fragmentShader = m.fragmentShader.replace('void main(){', GLSL_TL_UNIFORMS + 'uniform vec3 uTSlit, uTSlitCol; uniform vec4 uTBoat; uniform vec3 uTRocks[11]; uniform float uTHome;\nvoid main(){').replace(anchor, /* glsl */`
  {
    vec2 tvd = normalize(vWorld.xz - cameraPosition.xz + 1e-4); float tsd = max(dot(tvd, uTSlit.xz), 0.), tsd2 = tsd * tsd;
    // the swell's big shapes: black troughs, lifted faces
    col = col * mix(.7, 1.15, smoothstep(-.95, .55, vH)) + uScatter * amb * (.55 + .8 * crest * crest);   // storm-teal body: no black troughs
    // breaking crests: lace on the tops and wind-drawn streaks trailing down the back of every big sea
    float tbr = fbm2(ws * vec2(.016, .07) + vec2(uTime * .03, 1.7));
    float tcr = smoothstep(.62, .9, vH + .5 * (tbr - .5));
    float tst = fbm2(ws * vec2(.03, .55) + vec2(uTime * .06, ft * 2.));
    float tm2 = clamp(tcr * .85 + smoothstep(-.2, .55, vH) * smoothstep(.6, .86, tst) * .22, 0., .9);
    // the trawler's white water: a collar round the hull, the churned track astern and the two arms of her bow wave
    vec2 bq = vWorld.xz - uTBoat.xy; float ba = dot(bq, uTBoat.zw), bc = abs(dot(bq, vec2(uTBoat.w, -uTBoat.z))), twk = 0.;
    if (ba > -90. && ba < 16. && bc < 34.) {
      float bk = max(-ba - 6., 0.), hw = 3.5 * smoothstep(13.5, 5., ba);
      float collar = smoothstep(hw + 2.8, hw + .3, bc) * smoothstep(15., 11., ba) * smoothstep(-13., -9., ba);
      float churn = smoothstep(4.2 + bk * .11, 1.4 + bk * .08, bc) * exp(-bk / 32.) * smoothstep(-7., -10., ba);
      float bd = (bc - (3.2 + (12. - ba) * .3)) / (1. + bk * .035);
      float arm = exp(-bd * bd) * exp(-(12. - ba) / 40.) * smoothstep(14., 9., ba);
      twk = clamp(max(max(collar * .85, churn * .9), arm * .72), 0., .9);
    }
    // white water round the outlying rocks and the Sisters: a feathered, breathing collar the lace breaks up
    float tro = 0.;
    for (int i = 0; i < 11; i++) { vec3 rk = uTRocks[i]; float rd = length(vWorld.xz - rk.xy) - rk.z;
      tro = max(tro, smoothstep(5. + rk.z * .55, -1., rd) * step(.5, rk.z) * (.72 + .28 * sin(uTime * .9 + rk.x * .37 + rd * .25))); }
    twk = max(twk, tro * .8);
    tm2 = max(tm2, twk);
    float tcov = 0.;
    if (tm2 > .01) {
      vec2 tfp = vXZ + wd * uTime * .3;
      tcov = max(kitLace(tfp * .48 + vec2(ft, wq.y) * 1.2, tm2, foot * .48), kitLace(R1 * tfp * 1.6 + wq * 2., tm2 * .85, foot * 1.6) * .8);
      tcov *= mix(.5 + .5 * smoothstep(.25, .8, tst), 1., twk) * (1. - fa) * .85;
      // cold white water, only a warm edge toward the slit; the trawler's deck floods warm her own wake
      vec3 tfc = uFoamColor * (amb * (2.8 + 1.4 * crest) + uTSlitCol * (.008 + .035 * tsd2 * tsd) + vec3(1., .78, .5) * .55 * exp(-dot(bq, bq) / 420.));
      col = mix(col, tfc, tcov);
    }
    float fa2 = max(fa, tcov);
    // slit glints only where the eye looks toward the last light
    col += spec * 1.4 * (1. - fa2) * (.06 + .94 * tsd2 * tsd2);
    // crests rimmed by the slit: light through the thin tops of seas standing between the eye and the horizon glow
    float trim = pow(smoothstep(.2, 1.05, vH), 2.) * tsd2 * tsd * exp(-dist * .0022);
    col += uTSlitCol * trim * (.03 + .32 * clamp((1. - N.y) * 9., 0., 1.)) * (1. - .85 * fa2);
    col += uTSlitCol * tsd2 * tsd2 * pow(1. - max(dot(N, V), 0.), 4.) * .22 * smoothstep(90., 600., dist) * (1. - .7 * fa2);
    // lamp: the sweeping beam's foot as a streak of glints on the wave faces, spill round the rock, the lamp's glitter road
    vec3 tb = vWorld - uTLamp; float td = length(tb.xz); vec2 tn = tb.xz / max(td, 1.);
    float tc = smoothstep(mix(.985, .972, uTHome), .9995, abs(dot(tn, uTBeam.xz)));
    float tl = tc * uTBeamI / (1. + td / 120.) * smoothstep(14., 60., td) * (1. - smoothstep(mix(380., 520., uTHome), mix(560., 800., uTHome), td));
    vec3 tR = reflect(-V, N); vec3 tL = normalize(uTLamp - vWorld);
    // the lamp's road: one broken column on the water between the eye and the lantern, flaring as the beam comes round
    float tg = smoothstep(.95, .998, -dot(tn, tvd)) * (.25 + .75 * pow(max(dot(tR, tL), 0.), 18.)) * (.4 + 3. * tc) / (1. + td * td / 60000.) * smoothstep(20., 70., td);
    col += uTLampCol * (tl * (.03 + (.16 * fa2 + .5 * crest * crest) * (1. + 2.2 * uTHome)) + tg * .26 * (1. - .5 * fa2) + (.02 + .12 * fa2) / (1. + td * td / 1100.));
    col += uScatter * crest * crest * (tl * (1.4 + 2.5 * uTHome) + uTFlash * .35);                 // crests go translucent teal under the beam and the lightning
    // portal: glow carried by the calmer lee water plus its broken reflection
    vec3 pv = uTPortal - vWorld; float pd = length(pv.xz); vec3 pL = pv / max(length(pv), 1.);
    float pg = smoothstep(.94, .998, dot(pv.xz / max(pd, 1.), tvd)) * (.3 + .7 * pow(max(dot(tR, pL), 0.), 14.)) * .55 / (1. + pd * pd / 9000.);
    col += uTPortalCol * (pg * (1. - .6 * fa2) + (.05 + .14 * fa2 + .1 * crest) / (1. + pd * pd / 500.));
    // lightning: foam and crests light up
    col += vec3(.62, .76, 1.) * uTFlash * (.035 + .5 * fa2 + .16 * crest * crest);
  }`);
  const anchor2 = 'col = mix(col, hz, hf);';
  if (m.fragmentShader.includes(anchor2)) {
    m.fragmentShader = m.fragmentShader.replace('void main(){', 'uniform vec4 uTFar;\nvoid main(){').replace(anchor2, /* glsl */`
  { vec2 tfv = vWorld.xz - cameraPosition.xz; float tfd = length(tfv); float tfs = max(dot(tfv / max(tfd, 1e-3), uTSlit.xz), 0.);
    float tf2 = tfs * tfs, tf4 = tf2 * tf2;
    hz = mix(hz, uTSlitCol * uTFar.x, (tf4 * tf4 * .75 + tf4 * tf4 * tf4 * tf4 * tf2 * .25) * uTFar.y);   // the far sea under the slit carries its gold
    hz += vec3(.078, .133, .141) * uTFar.w;                                     // in the squall: the ghost of the cloud the veiled dome still shows
    float tfk = 1. - .7 * smoothstep(0., .05, uTFar.w);
    float tsq = (1. - tfk) / .7;
    hf = max(hf, smoothstep(mix(450., 48., tsq), mix(1800., 285., tsq), tfd) * mix(uTFar.z, 1., tsq)); }
  ` + anchor2);
  }
  m.needsUpdate = true;
  return true;
}
function patchCreature(mat, U) {
  const anchor = 'c += vEmit + gEmitF;';
  if (!mat || typeof mat.fragmentShader !== 'string' || !mat.fragmentShader.includes(anchor) || !mat.fragmentShader.includes('void main(){')) return false;
  Object.assign(mat.uniforms, U);
  mat.fragmentShader = mat.fragmentShader.replace('void main(){', GLSL_TL_UNIFORMS + 'void main(){').replace(anchor, anchor + /* glsl */`
  { vec3 tb = vWorld - uTLamp; float td = max(length(tb), 1.);
    float tc = smoothstep(.975, .9992, abs(dot(tb / td, uTBeam)));
    c += (alb + .08) * uTLampCol * (tc * uTBeamI * 7. / (1. + td / 90.) + .7 / (1. + td * td / 500.));
    c += (alb + .05) * vec3(.7, .84, 1.) * uTFlash * 1.3; }`);
  mat.needsUpdate = true;
  return true;
}

// the lit hulls (trawler, buoy): they flare when the beam crosses them and lift under lightning
function patchHull(mat, U, gain = 1) {
  mat.onBeforeCompile = (sh) => {
    for (const k of ['uTLamp', 'uTBeam', 'uTLampCol', 'uTBeamI', 'uTFlash']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vTW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW; uniform vec3 uTLamp, uTBeam, uTLampCol; uniform float uTBeamI, uTFlash;')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { vec3 tb = vTW - uTLamp; float td = max(length(tb), 1.);
          float tc = smoothstep(.975, .9992, abs(dot(tb / td, uTBeam)));
          vec3 tlv = normalize((viewMatrix * vec4(-tb, 0.)).xyz);
          totalEmissiveRadiance += (diffuseColor.rgb + .03) * uTLampCol * tc * uTBeamI * ${(5.5 * gain).toFixed(2)} / (1. + td / 90.) * (.35 + .65 * max(dot(normal, tlv), 0.));
          totalEmissiveRadiance += (diffuseColor.rgb + .02) * vec3(.7, .84, 1.) * uTFlash * 1.1; }`);
  };
  mat.customProgramCacheKey = () => 'tempest-light-hull' + gain;
  return mat;
}

export default {
  id: 'tempest-light',
  name: 'Tempest Light',
  category: 'ocean',
  weirdness: 0.08,
  async build(ctx) {
    const rng = ctx.rng;
    const scene = new THREE.Scene();
    const time = { value: 0 };

    // ---------------- per-seed character ----------------
    const V = {
      weatherAngle: 0.95 + rng.range(-0.16, 0.16),          // waves come from front-right, crossing the approach
      slitAz: -15 + rng.range(-8, 6),                        // where the last light sits (deg, 0 = -Z, -90 = -X)
      slitHue: rng.pick(['#ffd27a', '#ffc65e', '#ffdc92', '#f6b04e']),
      slitGain: rng.range(0.85, 1.25),
      dusk: rng.range(0, 1),                                 // 0 = a little light left, 1 = nearly night
      // kit wave set: the longest train is 2x `wavelength` and the next 1.3x, so 105-120 gives dominant seas about 150 m apart;
      // crest to trough of the big ones is about 1.3x `height`: 13-16 m
      seaHeight: rng.range(10.4, 12.2), seaLength: rng.range(104, 120), slitPow: rng.range(30, 50),
      squall: rng.range(0.0072, 0.0086), clear: rng.range(0.00135, 0.0018),
      rain: rng.range(0.75, 1.3),
      lightning: rng.range(0.45, 0.8), boltEvery: rng.range(5.2, 8),
      gannets: rng.int(20, 34), petrels: rng.int(7, 13), crossing: rng.chance(0.6),
      hullHex: rng.pick(['#7a1f1a', '#1f4a66', '#1c5a48', '#2a2f36', '#8a5a1c']),
      buoyHex: rng.pick(['#b3261c', '#17663a', '#c79a1a']), buoySide: rng.sign(),
      stacks: rng.int(2, 4),
      red: rng.pick(['#8a2a20', '#8a2a20', '#7a3018', '#6e2230']),
      farShip: rng.chance(0.5),                              // a second vessel's lights far out instead of the bell buoy
      cover: rng.range(0.78, 0.9), shipAz: rng.range(24, 44) * (rng.chance(0.75) ? 1 : -1),
    };
    // one structural choice per seed: the trawler labours past on the approach, or shelters in the lee beyond the rock
    // where the camera meets her bow-on against the last light
    V.leeBoat = ctx.core.makeRng(((ctx.seed | 0) ^ 0x2f6e2b1) >>> 0).chance(0.45);    // its own generator: the main sequence stays as released
    const slitCol = new THREE.Color(V.slitHue);
    const dim = lerp(1.7, 1.0, Math.pow(V.dusk, 0.8));                    // dusk level: a seed may still have light in the cloud or be nearly night

    // ---------------- hero (world space == hero space) ----------------
    const weatherDir = new THREE.Vector3(Math.sin(V.weatherAngle), 0, Math.cos(V.weatherAngle));
    const windAngle = Math.atan2(-weatherDir.z, -weatherDir.x);                    // direction the waves travel, for makeOcean
    const ROCK_DISC = new THREE.Vector4(0, 0, 38, 100), SHORE_DAMP = 0.3, SEAT_DISC = [-50, 170];

    // sky first: the sea and the hero's white water are lit from it
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'storm',
      zenith: new THREE.Color('#0a1419').multiplyScalar(dim), mid: new THREE.Color('#13262c').multiplyScalar(dim), horizon: new THREE.Color('#2c4649').multiplyScalar(dim), ground: '#0a161a',
      horizonPow: 3.4, midPow: 1.4,
      scatterColor: slitCol.clone().multiplyScalar(V.slitGain * lerp(1.1, 0.85, V.dusk)), scatter: 0.8, scatterPow: V.slitPow, scatterHigh: 0.0, scatterFall: 22,
      sunElevation: 1.4, sunAzimuth: V.slitAz, sunColor: slitCol, sunIntensity: 0, sunGlow: 0.14, sunGlowTight: 0.5,
      lightning: V.lightning, flashColor: '#7fa3b2',        // flashes stay teal and slate, never lavender
      clouds: { coverage: V.cover, softness: 0.38, scale: 0.8, lit: new THREE.Color('#4f6669').multiplyScalar(dim), shade: '#0a1013', absorb: 2.6, silver: 0.55, wind: [0.075, 0.03], detail: 0.85, haze: 0.2 },
      clouds2: { coverage: 0.96, softness: 0.6, scale: 0.5, stretch: 0.35, opacity: 1, lit: new THREE.Color('#243538').multiplyScalar(dim), shade: '#0b1215', wind: [0.03, 0.012] },
      lightElevationMin: 7, lightColor: slitCol.clone().lerp(new THREE.Color('#ffb060'), 0.25), lightIntensity: 1.2 * V.slitGain,
      ambientColor: '#3f6a74', groundLight: '#15343a', ambientIntensity: 2.7 * dim,
      cloudLightColor: slitCol.clone().multiplyScalar(0.7),
    });
    if (sky.material) sky.material.transparent = true; if (sky.materialLow) sky.materialLow.transparent = true;     // so setOpacity can veil the dome in the squall
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { flash: 1.0, bounce: 0.6 }); scene.add(rig.object);
    const slitDir = sky.sunDirection.clone().setY(0).normalize();
    const fogBase = new THREE.Color('#1e333a').multiplyScalar(dim * 0.95), fogFlash = new THREE.Color('#6f8f9e'), fogSquall = new THREE.Color('#3a4d53').multiplyScalar(dim);
    scene.fog = new THREE.FogExp2(fogBase.clone(), V.squall);
    scene.background = scene.fog.color;                  // the squall veils the sky dome toward the haze colour (sky.setOpacity)
    await ctx.yield();

    // the sea
    const L = Water.waterLight(sky, { sunDir: sky.sunDirection.clone().setY(0.12).normalize(), sunColor: slitCol, sunIntensity: 0.16 * V.slitGain, glint: 0.42, fogColor: fogBase });
    L.skyP.w = 13;                                        // on the water the slit's gold spreads wide: a glitter road and a gold far sea under the last light
    const stackSpots = [];
    {
      // far sea stacks, most of them toward the slit so they cut black shapes out of the last light
      const sr = rng.fork('stacks');
      for (let i = 0; i < V.stacks; i++) {
        const az = THREE.MathUtils.degToRad(V.slitAz + (i % 2 ? 1 : -1) * sr.range(7, 22) - (i > 1 ? sr.range(8, 20) : 0)), r = sr.range(560, 820);
        stackSpots.push({ x: -97 + Math.sin(az) * r * 0.9, z: -208 - Math.cos(az) * r * 0.9, h: sr.range(38, 78), rad: sr.range(9, 17), spire: sr.chance(0.4) });
      }
    }
    // ... and the Sisters, two near stacks out to the west: the loop home banks round in front of them
    stackSpots.push({ x: -292, z: -188, h: 68, rad: 16, spire: false, near: true }, { x: -268, z: -231, h: 40, rad: 8.5, spire: true, near: true });
    const seat = new THREE.Vector3(-90, 16, -8);         // overwritten from the hero's anchor below; needed for the calm disc now
    const ocean = Water.makeOcean({
      rng: rng.fork('sea'), preset: 'storm', light: L, windAngle,
      height: V.seaHeight, wavelength: V.seaLength, steepness: 1, spread: 0.5, foam: 1, speed: 1.1, contrast: 1,
      rings: 176, segments: 192, glitter: 0.45, roughness: 0.05,
      fadeStart: 0.2, fadeEnd: 0.6,                         // the far sea melts into the sky of its own direction: gold under the slit, slate elsewhere
      deep: '#0a2c31', scatter: '#2f9a94', foamColor: '#dfe9ee', shallowColor: '#1c6a70', shoreDamp: SHORE_DAMP,
      shallows: [{ x: ROCK_DISC.x, z: ROCK_DISC.y, radius: ROCK_DISC.z, falloff: ROCK_DISC.w }, { x: seat.x, z: seat.z, radius: SEAT_DISC[0], falloff: SEAT_DISC[1] },
        ...stackSpots.map((s) => ({ x: s.x, z: s.z, radius: s.rad * 1.2, falloff: s.near ? 26 : 34 }))],
      sprayRange: 320, sprayOpacity: 0.32,
    });
    scene.add(ocean.object);
    await ctx.yield();
    { // The dome average the kit derives is warmed by the slit-lit cloud colour, which turned every foam patch tan. Keep its
      // strength, replace its hue: white water is lit by the cold overcast, the slit only edges it (in the shader patch).
      L.ambient.multiply(new THREE.Color(2.1, 3.25, 3.3));
      const lum = L.ambient.r * 0.3 + L.ambient.g * 0.5 + L.ambient.b * 0.2;
      L.ambient.setRGB(0.68, 1.0, 1.08).multiplyScalar(lum / 0.92);
    }
    const Lbase = { zenith: L.zenith.clone(), mid: L.mid.clone(), horizon: L.horizon.clone(), ambient: L.ambient.clone() };
    await ctx.yield();

    // the flight's beats in u (the path is about 840 m: 130 m of squall, 250 m of approach, the pass, 310 m out and round, 110 m home)
    const U_BURST = 0.34, U_BURST_SPAN = 0.14;
    const hero = await buildHero(ctx, {
      palette: PALETTE, red: V.red, weatherAngle: V.weatherAngle, beamPeriod: 6, beamLength: 540, beamReach: 800, beamIntensity: 1, beamFogCut: 0.85,
      burstAt: U_BURST, burstSpan: U_BURST_SPAN, bursts: [[0.735, 0.115], [0.87, 0.125]], ambient: '#587888',
      sea: { uWA: ocean.uniforms.uWA, uWB: ocean.uniforms.uWB, uTime: ocean.uniforms.uTime, uSpacing: ocean.uniforms.uSpacing, uR0: ocean.uniforms.uR0, disc: ROCK_DISC, damp: SHORE_DAMP, lift: 0.4 },
    });
    scene.add(hero.object);
    const A = hero.anchors, lantern = A.lantern.clone();
    seat.copy(A.portalSeat.position);
    await ctx.yield();

    // ---------------- the flight path ----------------
    const fly = A.flyThrough.map((p) => p.clone());
    const d0 = new THREE.Vector3().subVectors(fly[1], fly[0]).setY(0).normalize(), back = d0.clone().multiplyScalar(-1), rightV = new THREE.Vector3(-d0.z, 0, d0.x);
    const pre = (dist, side, y) => new THREE.Vector3().copy(fly[0]).addScaledVector(back, dist).addScaledVector(rightV, side).setY(y);
    const sw = rng.range(-1, 1);
    const pts = [pre(130, 5 + 4 * sw, 13.5), pre(98, 1 + 3 * sw, 12 + rng.range(-1, 1)), pre(64, -5 - 2 * sw, 12 + rng.range(-0.5, 1.5)), pre(30, -2, 20), ...fly];
    // (the opening points are deliberately low: the lift loop below sets the real height, so the camera skims the crest envelope)
    // Never less than 4 m above the highest crest the wave set raises under the route during a visit: sample the real
    // surface (with the shoal damping the shader applies) over 100 s under 56 route points and lift the control points.
    const discs = [[ROCK_DISC.x, ROCK_DISC.y, ROCK_DISC.z, ROCK_DISC.w], [seat.x, seat.z, SEAT_DISC[0], SEAT_DISC[1]]];
    const dampAt = (x, z) => { let sd = 1e3; for (const d of discs) sd = Math.min(sd, (Math.hypot(x - d[0], z - d[1]) - d[2]) / d[3]); return lerp(SHORE_DAMP, 1, smoothstep(0, 1, sd)); };
    let path = makePath(pts);
    for (let pass = 0; pass < 3; pass++) {
      let changed = false; const P3 = new THREE.Vector3();
      for (let i = 0; i <= 56; i++) {
        path.pointAt(i / 56, P3);
        if ((i & 7) === 7) await ctx.yield();
        let hm = -1e3; for (let tt = 0; tt <= 100; tt += 1.7) hm = Math.max(hm, ocean.heightAt(P3.x, P3.z, tt));
        const need = hm * dampAt(P3.x, P3.z) + 4.6 - P3.y;
        if (need > 0) {
          let bi = 0, bd = 1e9; for (let k = 0; k < pts.length - 2; k++) { const d = Math.hypot(pts[k].x - P3.x, pts[k].z - P3.z); if (d < bd) { bd = d; bi = k; } }
          pts[bi].y += need + 0.3; changed = true;
        }
      }
      if (!changed) break;
      path = makePath(pts);
      await ctx.yield();
    }
    await ctx.yield();
    const duration = 50;
    const uOf = (i) => path.nearestXZ(pts[i].x, pts[i].z).u;
    const uFly0 = uOf(4), uPass = uOf(8);

    // ---------------- trawler: 70 m to the left on the approach, climbing the swell; or 48 m to the right in the lee ----------------
    const uTr = V.leeBoat ? 0.585 : 0.26, pTr = path.pointAt(uTr), tTr = path.tangentAt(uTr).setY(0).normalize();
    const trLat = V.leeBoat ? -48 : 56, trRun = V.leeBoat ? 9 : 30;
    const trBase = new THREE.Vector3(pTr.x + tTr.z * trLat, 0, pTr.z - tTr.x * trLat);   // + is left of the heading
    const trYaw = V.weatherAngle + rng.range(-0.35, -0.12);                          // head to sea, a little off the wind
    const trDir = new THREE.Vector3(Math.sin(trYaw), 0, Math.cos(trYaw)), trSide = new THREE.Vector3(trDir.z, 0, -trDir.x);
    await ctx.yield();
    const trawler = buildTrawler(rng.fork('trawler'), V.hullHex);
    scene.add(trawler.group);
    await ctx.yield();
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const bowSpray = buildBowSpray(rng.fork('bow'), trawler.bow, fogU); trawler.group.add(bowSpray.mesh);
    const trPos = new THREE.Vector3();
    const trAt = (u, out) => out.copy(trBase).addScaledVector(trDir, clamp((u - uTr) * duration, -14, trRun) * 2.6);
    const pitchAt = (t) => ocean.heightAt(trPos.x + trDir.x * 8, trPos.z + trDir.z * 8, t) - ocean.heightAt(trPos.x - trDir.x * 8, trPos.z - trDir.z * 8, t);

    await ctx.yield();
    // ---------------- bell buoy close to the opening run ----------------
    const uBu = 0.072, pBu = path.pointAt(uBu), tBu = path.tangentAt(uBu).setY(0).normalize();
    const buPos = new THREE.Vector3(pBu.x - tBu.z * 17 * V.buoySide, 0, pBu.z + tBu.x * 17 * V.buoySide);
    const buoy = buildBuoy(V.buoyHex); if (!V.farShip) scene.add(buoy.group);
    // ... or, on other seeds, a second vessel far out beyond the rock: only her lights, heaving on the swell and steaming slowly across
    const shipAz = THREE.MathUtils.degToRad(V.slitAz + V.shipAz), shipR = rng.range(480, 620);
    const shipBase = new THREE.Vector3(Math.sin(shipAz) * shipR, 0, -Math.cos(shipAz) * shipR), shipDir = new THREE.Vector3(Math.cos(shipAz), 0, Math.sin(shipAz)).multiplyScalar(rng.sign());
    const shipLamps = [{ o: 0, y: 15, c: '#ffffff', s: 0.9 }, { o: -22, y: 10.5, c: '#fff2d8', s: 0.75 }, { o: -6, y: 6, c: V.shipAz > 0 ? '#ff3a20' : '#30ff7a', s: 0.6 }, { o: -30, y: 5, c: '#ffc880', s: 1.1 }];

    await ctx.yield();
    // lights that are sprites: trawler lamps (0..7), the buoy lamp (8) and the far vessel (9..12)
    const glowPos = new THREE.Vector3();
    const glows = fx.makeGlows({ time, positions: [...trawler.glows.map(() => [trBase.x, 6, trBase.z]), [buPos.x, 5, buPos.z], ...shipLamps.map((l) => [shipBase.x, l.y, shipBase.z])],
      colors: [...trawler.glows.map((g) => g.c), V.buoyHex, ...shipLamps.map((l) => l.c)], sizes: [...trawler.glows.map((g) => g.s), 1.2, ...shipLamps.map((l) => l.s)],
      size: 3.1, intensity: 0.75, spikes: 0.25, halo: 0.8, flicker: 0.06, fogAmount: 0.45 });
    scene.add(glows.object);
    await ctx.yield();

    // ---------------- far sea stacks ----------------
    let stackMesh = null;
    {
      const sr = rng.fork('stackgeo'), geos = [];
      for (const s of stackSpots) {
        if (s.near) continue;
        const g = stackGeometry(sr, ctx.noise, s.h, s.rad, s.spire);
        geos.push(g.translate(s.x, 0, s.z));
        await ctx.yield();
      }
      if (geos.length) {
        stackMesh = new THREE.Mesh(mergeAndFree(geos), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, transparent: true }));
        stackMesh.name = 'sea-stacks'; scene.add(stackMesh);
      }
    }

    // the Sisters (their own generator, so nothing after them is reshuffled): detailed skin, gannets round the taller one,
    // a wave bursting on each weather face every 7 s
    const xr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x51573a7) >>> 0);
    const sisters = stackSpots.filter((s) => s.near), sisterGeos = [];
    for (const s of sisters) { sisterGeos.push(sisterGeometry(xr, ctx.noise, s.h, s.rad, s.spire).translate(s.x, 0, s.z)); await ctx.yield(); }
    const sisterMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.62, transparent: true });
    const sisterMesh = new THREE.Mesh(mergeAndFree(sisterGeos), sisterMat); sisterMesh.name = 'sisters'; scene.add(sisterMesh);
    await ctx.yield();
    const sisterSprays = sisters.map((s, i) => {
      const sp = buildBowSpray(xr.fork('sis' + i), new THREE.Vector3(0, 0, 0), fogU, i ? 1.5 : 2.0, 0.3, i ? 2.4 : 3.4);
      sp.mesh.position.set(s.x + weatherDir.x * s.rad * 1.18, 1.5, s.z + weatherDir.z * s.rad * 1.18); sp.mesh.rotation.y = Math.atan2(weatherDir.x, weatherDir.z);
      sp.mesh.name = 'sister-spray'; sp.phase = i * 2.9 + xr.range(0, 7); sp.at = new THREE.Vector3(s.x, s.h * 0.4, s.z);
      scene.add(sp.mesh); return sp;
    });
    await ctx.yield();
    const rockDiscs = [];
    for (const o of (A.outliers || []).slice(0, 9)) rockDiscs.push(new THREE.Vector3(o.position.x, o.position.z, o.radius * 0.8));
    for (const s of sisters) rockDiscs.push(new THREE.Vector3(s.x, s.z, s.rad * 1.3));
    while (rockDiscs.length < 11) rockDiscs.push(new THREE.Vector3(0, 0, 0));
    rockDiscs.length = 11;

    // ---------------- weather: rain, far rain shafts, lightning ----------------
    const rainBase = 0.36;
    const rain = fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, density: V.rain * 1.5, box: [58, 40, 58],
      velocity: [-weatherDir.x * 9.5, -23, -weatherDir.z * 9.5], velocityRandom: [1.2, 6, 1.2], opacity: rainBase });
    scene.add(rain.object);
    await ctx.yield();
    const shafts = buildRainShafts(rng.fork('shafts'), slitDir, new THREE.Color('#2a3b46').multiplyScalar(dim), slitCol);
    scene.add(shafts.mesh);
    await ctx.yield();
    const bolt = fx.makeLightning({ rng: rng.fork('bolt'), from: [0, 430, 0], to: [40, 0, 25], position: [330 + rng.range(-60, 60), 0, -270 + rng.range(-60, 60)],
      area: 460, interval: V.boltEvery, intensity: 6, glow: 0.6, lightIntensity: 1500 });
    scene.add(bolt.object);
    await ctx.yield();

    // ---------------- birds ----------------
    const birdLight = { sunDir: sky.lightDirection.clone(), sunColor: slitCol, sunIntensity: 1.3, sky: '#587a8c', skyIntensity: 1.5 * dim, ground: '#1a3640', groundIntensity: 1.2 };
    const white = { body: '#f1f4f4', belly: '#ffffff', wingC: '#e9eef0', trail: '#dfe6e9', tip: '#15191c', head: '#f2e0a6', tailC: '#f4f6f6', beak: '#9fb0b8' };
    const dark = { body: '#3c474e', belly: '#a3b0b6', wingC: '#333c42', trail: '#56636a', tip: '#1a1f22', head: '#343d43', tailC: '#f0f4f5', beak: '#0c0e10' };
    const birds = [];
    // (the clear air round the line, 14 Oct: these wide scatters dealt a gannet 0.21 m, a petrel 1.78 m and a lee swift 0.57 m from the flown
    // line. Each of the three now hands the kit its own clearing, per bird, so the ring or the escort stays where it was laid and only the few
    // birds that come too near are held off. The petrels fly beside the eye on purpose, so their clearing is bought with a steadier wander
    // rather than with distance: the kit clears a member's whole roam, and a wandering escort would be thrown out of the frame.)
    birds.push(F.makeFlock({ rng: rng.fork('gannets'), species: 'gulls', count: V.gannets, size: 2.7, speed: 14, light: birdLight, palette: white,
      center: [4, 43, 2], radius: 52, height: 9, spread: [38, 14, 60], keepClear: { path, dist: 2, each: true } }));   // 0.21 m
    birds.push(F.makeFlock({ rng: rng.fork('petrels'), species: 'swifts', count: V.petrels, size: 2.5, light: birdLight, palette: dark, spread: [8, 2.5, 10], wander: [0.8, 0.5, 0.8, 0.6],
      along: { path, side: 2.5, up: -1.4, lead: 15, from: 0, to: Math.min(0.32, uFly0 + 0.15) }, keepClear: { path, dist: 2, each: true } }));   // 1.78 m
    await ctx.yield();
    if (V.crossing) birds.push(F.makeFlock({ rng: rng.fork('cross'), species: 'gulls', count: rng.int(7, 12), size: 2.7, light: birdLight, palette: white, spread: [14, 5, 22],
      cross: { path, u: 0.25, lead: 42, span: 320, angle: 72, side: -1, height: 2, window: 0.17 } }));
    // petrels pattering over the calmer lee water under the portal, and gannets crossing the run out toward the slit
    await ctx.yield();
    const leeC = path.pointAt(0.935);
    birds.push(F.makeFlock({ rng: rng.fork('lee'), species: 'swifts', count: rng.int(12, 20), size: 2.5, light: birdLight, palette: dark, speed: 15,
      center: [leeC.x, 12, leeC.z], radius: 34, height: 5, spread: [24, 6, 40], keepClear: { path, dist: 2, each: true } }));   // 0.57 m
    birds.push(F.makeFlock({ rng: rng.fork('late'), species: 'gulls', count: rng.int(5, 9), size: 2.7, light: birdLight, palette: white, spread: [12, 4, 20],
      cross: { path, u: 0.6, lead: 46, span: 300, angle: rng.range(55, 80), side: rng.sign(), height: 4, window: 0.17 } }));
    await ctx.yield();
    birds.push(F.makeFlock({ rng: xr.fork('sisgulls'), species: 'gulls', count: xr.int(15, 20), size: 2.7, speed: 13, light: birdLight, palette: white,
      center: [sisters[0].x + 6, sisters[0].h - 8, sisters[0].z + 8], radius: 34, height: 12, spread: [26, 12, 44] }));
    for (const b of birds) scene.add(b.object);
    await ctx.yield();

    // ---------------- lamp, portal and lightning on the sea and the birds ----------------
    const HU = hero.uniforms, OU = ocean.uniforms, flashU = { value: 0 };
    const portalCol = new THREE.Color('#bfeaf2');
    const TLU = { uTLamp: HU.uLamp, uTBeam: HU.uBeamDir, uTLampCol: HU.uLampCol, uTBeamI: HU.uBeamI, uTFlash: flashU,
      uTPortal: { value: seat.clone() }, uTPortalCol: { value: portalCol.clone().multiplyScalar(0.55) },
      uTSlit: { value: slitDir.clone() }, uTSlitCol: { value: slitCol.clone().multiplyScalar(V.slitGain) }, uTFar: { value: new THREE.Vector4(0.44, 0, 0.6, 0) }, uTHome: { value: 0 }, uTRocks: { value: rockDiscs }, uTBoat: { value: new THREE.Vector4(trBase.x, trBase.z, trDir.x, trDir.z) } };
    const portalGlow = TLU.uTPortalCol.value.clone();
    patchOcean(ocean, TLU);
    for (const b of birds) patchCreature(b.material, TLU);
    patchHull(trawler.body.material, TLU); patchHull(buoy.group.children[0].material, TLU, 0.3); patchStack(sisterMat, TLU, time);
    hero.setAmbient(new THREE.Color('#5d7f88').multiplyScalar(dim), 0.8);
    await ctx.yield();

    // ---------------- per-frame ----------------
    const tmpN = new THREE.Vector3(), poiTr = new THREE.Vector3(), shipPos = new THREE.Vector3(), buCol = new THREE.Color(V.buoyHex), sprayCol = new THREE.Color();
    const REVEAL_U = 0.105, DARK_U = 0.697, strike0 = bolt.nextStrike(1), boltHome = bolt.object.position.clone(), boltWest = new THREE.Vector3(-640, 0, -250);
    // for the run home the storm cell stands on the open sea 240 m east of the tower: its weather side, the far side of the skerry from the portal
    const boltEast = new THREE.Vector3(240, 0, 40), ambCol = new THREE.Color('#5d7f88').multiplyScalar(dim), sisDir = new THREE.Vector3();
    let flashS = 0;
    const blink = (x) => Math.exp(-Math.pow((x - 0.2) / 0.11, 2)) + Math.exp(-Math.pow((x - 0.75) / 0.11, 2));

    // The exit portal is drawn without fog, so from inside the squall it would outshine the lantern. It is never switched
    // on or off from here: only its colour is scaled. Nearly dark in the squall, a faint ring low and left of the tower on
    // the approach, kindled in full once the camera is past the tower and turning for home. (The engine adds its group to
    // this scene after build; if it cannot be found nothing happens.)
    // Fragile by nature (it reads the engine's own materials), so it is guarded at every step and degrades silently: if the
    // engine's portal changes shape nothing is found, nothing is scaled, and the portal simply shows at its `glow`.
    let portalTint = null, portalFull = null;
    const findPortal = () => {
      for (const o of scene.children) if (o.isGroup) {
        const found = [];
        for (const c of o.children) {
          const pu = c.material && c.material.uniforms;
          if (pu && pu.uReveal && pu.uColor && pu.uColor.value && pu.uColor.value.isColor && !found.includes(pu.uColor.value)) found.push(pu.uColor.value);   // the opening and its halo
        }
        if (found.length) { portalTint = found; portalFull = found.map((c) => c.clone()); return; }
      }
    };
    const uKindle = uPass + 0.03;

    function update(dt, t, camera, u) {
      time.value = t;
      // Seen through the previous portal, and for the first metres after the crossing, the squall is eased so the opening
      // shows sea, rain, torn cloud and the beam, not a dark disc; the squall closes in over the first 0.06 of u, then thins for good.
      const open = ctx.through ? 1 : 1 - smoothstep(0, 0.07, u);
      const thin = Math.max(0.9 * open, smoothstep(0.04, 0.125, u));
      scene.fog.density = lerp(V.squall, V.clear, thin);

      // lightning: the sky's own flicker, wandering bolts, and one strike keyed to the reveal at u = 0.18
      // (inside the reveal window the bolt's clock is a pure function of u, so the strike happens there at any flight speed)
      // ... and a second one out to the west behind the Sisters, on the dark side of the loop home
      // (the home straight has no scripted strike: there the storm keeps its own seeded schedule on the world clock)
      const keyU = u >= DARK_U && u < DARK_U + 1.0 / duration ? DARK_U : u >= REVEAL_U && u < REVEAL_U + 1.0 / duration ? REVEAL_U : -1;
      const inReveal = keyU >= 0;
      sky.update(dt, t, camera); bolt.update(dt, inReveal ? strike0 + (u - keyU) * duration : t);
      if (u > 0.6 && u < 0.8) bolt.object.position.sub(boltHome).multiplyScalar(0.4).add(boltWest);   // the storm's strikes move west while the camera looks that way
      else if (u >= 0.8) bolt.object.position.sub(boltHome).multiplyScalar(0.1).add(boltEast);       // ... and to the sea east of the skerry for the run home
      const su = inReveal ? bolt.flash : 0;
      // one eased envelope for the sea, the hero, the fog and the rain: a 0.1 s rise, the strike's own decay
      const flashRaw = clamp(Math.max(sky.flash * 0.7, bolt.flash), 0, 1.1);
      flashS = flashRaw > flashS && dt > 0 ? flashS + (flashRaw - flashS) * Math.min(1, dt * 14) : flashRaw;
      const flash = flashS;
      sky.flash = Math.max(sky.flash, bolt.flash * 0.85, su);
      if (sky.uniforms && sky.uniforms.uFlash) sky.uniforms.uFlash.value = Math.min(sky.flash, 0.2);
      rig.update(dt, t, camera);
      flashU.value = flash;
      const lift = 1 + 1.7 * flash;
      L.zenith.copy(Lbase.zenith).multiplyScalar(lift); L.mid.copy(Lbase.mid).multiplyScalar(lift);
      L.horizon.copy(Lbase.horizon).multiplyScalar(lift); L.ambient.copy(Lbase.ambient).multiplyScalar(lift);
      scene.fog.color.copy(fogBase).lerp(fogSquall, (1 - thin) * 0.55).lerp(fogFlash, Math.min(1, flash) * 0.16);   // rain murk is paler than the night behind it
      // inside the squall the dome is a ghost: only the slit's glow, the beam and the lantern flare pierce the murk
      const skyO = Math.max(open, 0.15 + 0.85 * smoothstep(0.04, 0.14, u));
      sky.setOpacity(skyO);
      if (stackMesh) stackMesh.material.opacity = Math.max(0.7 * open, smoothstep(0.04, 0.125, u));
      sisterMat.opacity = stackMesh ? stackMesh.material.opacity : 1;
      // the far sea takes the colour of what is drawn above it: murk in the squall, then mostly the sky of its own direction
      OU.uHorizonColor.value.copy(scene.fog.color); OU.uHorizonMix.value = 1 - 0.85 * skyO; TLU.uTFar.value.y = skyO; TLU.uTFar.value.w = 0.055 * dim * (1 - thin);
      rain.setOpacity(rainBase * (1.8 - 0.9 * thin) * (1 + 1.6 * flash));
      shafts.uniforms.uTime.value = t; shafts.uniforms.uFlash.value = flash; shafts.uniforms.uOpacity.value = smoothstep(0.05, 0.2, u);
      const settle = smoothstep(0.05, 0.2, u);
      HU.uBeamI.value = Math.max(lerp(1.7, 1, settle), 2.6 * open) * (1 + 0.4 * smoothstep(0.72, 0.84, u)); if (HU.uFogCut) HU.uFogCut.value = lerp(0.45, 0.85, thin);
      // out over the lee the shafts reach further, so the hero's light sweeps overhead and paints the Sisters while the camera looks west
      if (HU.uBeamLen) HU.uBeamLen.value = lerp(540, 800, smoothstep(0.46, 0.58, u));
      // the homecoming: the beam's foot widens and lights the crests teal, the skerry and its white water lift out of the dark
      const home = smoothstep(0.72, 0.82, u);
      TLU.uTHome.value = Math.max(home, 0.55 * smoothstep(0.46, 0.58, u)); hero.setAmbient(ambCol, lerp(0.8, 1.7, smoothstep(0.74, 0.84, u)));

      // the portal kindles once the tower is passed, then brightens with nearness: from 110 m off its seat (the length of
      // the home straight) down to 20 m, wherever the route brings the camera that close
      if (!portalTint) findPortal();
      const kindle = smoothstep(uKindle, uKindle + 0.16, u), near = 1 - smoothstep(20, 110, camera.position.distanceTo(seat));
      const pk = 0.03 + 0.09 * smoothstep(0.12, 0.26, u) + (0.45 + 0.4 * near) * kindle * kindle;
      if (portalTint) for (let i = 0; i < portalTint.length; i++) portalTint[i].copy(portalFull[i]).multiplyScalar(pk);
      TLU.uTPortalCol.value.copy(portalGlow).multiplyScalar(pk);

      ocean.update(dt, t, camera);
      hero.setFlash(flash); hero.setProgress(u); hero.update(dt, t, camera);

      // trawler: travels with u, rides the real wave heights, throws spray when the bow digs into the next face
      trAt(u, trPos);
      const hB = ocean.heightAt(trPos.x + trDir.x * 8, trPos.z + trDir.z * 8, t), hS = ocean.heightAt(trPos.x - trDir.x * 8, trPos.z - trDir.z * 8, t);
      const hP = ocean.heightAt(trPos.x + trSide.x * 2.6, trPos.z + trSide.z * 2.6, t), hQ = ocean.heightAt(trPos.x - trSide.x * 2.6, trPos.z - trSide.z * 2.6, t);
      trawler.group.position.set(trPos.x, (hB + hS + hP + hQ) * 0.25 + 0.1, trPos.z);
      trawler.group.rotation.set(-Math.atan2(hB - hS, 16) * 0.95, trYaw, Math.atan2(hP - hQ, 5.2) * 0.75 + Math.sin(t * 0.9) * 0.03, 'YXZ');
      trawler.group.updateMatrixWorld(true);
      TLU.uTBoat.value.set(trPos.x, trPos.z, trDir.x, trDir.z);
      // seconds since the bow last dug in: a short coarse look back, and only while the boat is near enough to be seen
      let age = 99;
      if (u > uTr - 0.3 && u < uTr + 0.3) {
        let later = hB - hS;
        for (let k = 1; k <= 9; k++) {
          const s = pitchAt(t - k * 0.4);
          if (s <= 0 && later > 0) { age = 0.4 * (k - 1 + later / (later - s)); break; }
          later = s;
        }
      }
      bowSpray.uniforms.uAge.value = age + 0.3;
      bowSpray.uniforms.uColor.value.copy(sprayCol.setRGB(0.3, 0.36, 0.4)).multiplyScalar(dim).add(sprayCol.setRGB(0.4, 0.34, 0.25)).addScalar(flash * 1.2);
      for (let i = 0; i < trawler.glows.length; i++) glows.setPosition(i, glowPos.copy(trawler.glows[i].p).applyMatrix4(trawler.group.matrixWorld));
      // the Sisters' wave bursts: cold spray, lifted by lightning, warmed when the beam crosses it
      for (const sp of sisterSprays) {
        sp.uniforms.uAge.value = (t + sp.phase) % 7;
        sisDir.copy(sp.at).sub(HU.uLamp.value).normalize();
        const bc = smoothstep(0.972, 0.9992, Math.abs(sisDir.dot(HU.uBeamDir.value))) * HU.uBeamI.value;
        sp.uniforms.uColor.value.setRGB(0.2 + 0.5 * bc, 0.27 + 0.4 * bc, 0.3 + 0.22 * bc).multiplyScalar(dim).addScalar(flash * 0.9);
      }

      const nG = trawler.glows.length;
      if (!V.farShip) {
        // buoy: heaves and leans on the swell, lamp flashes twice every five seconds
        ocean.normalAt(buPos.x, buPos.z, t, tmpN);
        buoy.group.position.set(buPos.x, ocean.heightAt(buPos.x, buPos.z, t) + 0.2, buPos.z);
        buoy.group.rotation.set(tmpN.z * 0.8 + Math.sin(t * 1.7) * 0.09, t * 0.07, -tmpN.x * 0.8 + Math.sin(t * 1.3 + 1) * 0.09);
        buoy.group.updateMatrixWorld(true);
        const bl = blink((t % 5) / 5 * 2.2);
        buoy.lamp.material.color.copy(buCol).multiplyScalar(0.4 + 3.5 * bl);
        glows.setPosition(nG, glowPos.copy(buoy.lampLocal).applyMatrix4(buoy.group.matrixWorld));
        glows.setSize(nG, 0.25 + 0.8 * bl);
        for (let i = 0; i < shipLamps.length; i++) glows.setSize(nG + 1 + i, 0);
      } else {
        // far vessel: her lights ride the swell (slow pitch shows as the two mastheads rising and falling out of step)
        glows.setSize(nG, 0);
        shipPos.copy(shipBase).addScaledVector(shipDir, (u - 0.4) * duration * 4);
        const hs = ocean.heightAt(shipPos.x, shipPos.z, t) * 0.55, pitch = Math.sin(t * 0.55) * 0.05 + (ocean.heightAt(shipPos.x + shipDir.x * 30, shipPos.z + shipDir.z * 30, t) - hs / 0.55) * 0.004;
        for (let i = 0; i < shipLamps.length; i++) {
          const l = shipLamps[i];
          glows.setPosition(nG + 1 + i, glowPos.copy(shipPos).addScaledVector(shipDir, l.o).setY(hs + l.y + l.o * pitch));
          glows.setSize(nG + 1 + i, l.s * (i === 0 ? 0.85 + 0.15 * Math.sin(t * 9) : 1));
        }
      }
      glows.update(dt, t, camera);

      rain.update(dt, t, camera);
      for (const b of birds) b.update(dt, t, camera, u);
    }

    return {
      scene, path, duration,
      // quick through the squall, slow from the impact through the close pass, quick again over the run out and round, unhurried home
      pace: (u) => 1.18 - 0.4 * smoothstep(0.14, 0.3, u) + 0.62 * smoothstep(0.47, 0.57, u) - 0.42 * smoothstep(0.72, 0.84, u),
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 30, sway: 1.5, bank: 0.7 },
      pois: [
        // opening: gaze lifted over the lantern so the horizon sits low and the sweeping shaft owns the frame
        { at: lantern.clone().setY(lantern.y + 75), from: 0.0, to: 0.12, weight: 0.65, fade: 0.2 },
        V.leeBoat
          ? { at: (time_, u) => trAt(u, poiTr).setY(6), from: uPass + 0.05, to: 0.62, weight: 0.5, fade: 0.2 }
          : { at: (time_, u) => trAt(u, poiTr).setY(5), from: 0.06, to: 0.225, weight: 0.5, fade: 0.14 },
        // the close pass: hold the lantern room through the arc
        { at: lantern, from: 0.18, to: uPass + 0.07, weight: 0.72, fade: 0.17 },
        // the loop home: the gaze leads the turn round to the tower, then settles between the portal and the lantern
        { at: lantern.clone().setY(32), from: 0.67, to: 0.9, weight: 0.7, fade: 0.33 },
        { at: seat.clone().lerp(lantern, 0.5).setY(lantern.y), from: 0.83, to: 1, weight: 0.4, fade: 0.12 },
      ],
      portal: { shape: 'circle', radius: 7, color: portalCol, glow: 0.7 },
      post: {
        exposure: 1.32,
        bloom: { strength: 0.58, radius: 0.75, threshold: 0.86 },
        grade: { saturation: 1.06, contrast: 1.06, tint: '#f2f7fb', shadowTint: '#04131a', vignette: 0.42, grain: 0.04, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
