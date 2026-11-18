// THE CALVING: blazing Antarctic noon from the seat of a kayak. Down a lead between floes while Adelie
// penguins porpoise past the bow, a red expedition ship slides by to starboard like a wall, then up the
// ship's black channel toward the glacier front as a serac tower shears off and its ring wave comes
// through the pack, lifting every floe, the penguins, the orcas and finally our own bow; over the crest
// a capsized berg has heaved up as a sapphire arch, and that arch is the portal.
//
// Layout (world space == hero local space; origin = foot of the tower at still sea level, cliff along X,
// the kayak comes down +Z looking toward -Z, starboard = +X):
//   (the channel is the line x = tan(22 deg) * (z - 150); the lead runs 17 m to port of it)
//   u 0.00  entry (91, 0.95, 398) in a 13 m lead; ship's bow 53 m ahead, a floe of standing penguins 25 m ahead to port
//   u 0.15  ship's bow abeam (hull 11 m to starboard), floes upending along it; zodiac astern of it
//   u 0.35  turn in to the ship's channel behind the other kayak; orcas spy-hop 22 m to port, a tabular berg slides by to starboard
//   u 0.50  dust puff: the event clock starts (event seconds = 40 * (u - 0.5)); the 85 m tower leans until u 0.6 (250 m off)
//   u ~0.69 impact, splash column; u ~0.82 the crest lifts the other kayak, then us (whiteout); u 0.86 the arch stands, 35 m ahead
//   u 1.00  through the arch (portal centre (0, 1.05, 150))
// Variations by seed / ctx.vary: noon | midnight sun | overcast + snow | fog bank torn open by the fall;
// early (tight pack) or late (open water, brash, moulting birds) summer; Adelie / chinstrap / gentoo;
// leopard or crabeater seal; second kayak ahead; zodiac. Rare: a shooter bursts up after the main fall.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/the-calving.js';

const TAU = Math.PI * 2, D = 40, EYE = 0.95, LEAD_OFF = -17, ARCH_Z = 150, START_Z = 398;
// the ship's channel runs through the arch 22 degrees off the glacier's axis, so the tower and its splash stand clear to the right of the hummock
const CH_A = 22 * Math.PI / 180, K = Math.tan(CH_A), KS = K.toFixed(5);
const chanX = (z) => K * (z - ARCH_Z);
const PALETTE = ['#3F86C9', '#BFE2F2', '#F4FAFD', '#58B8D8', '#1C6FA0', '#06141F', '#E23B2E'];
const HEAD = { x: -330, z: 176, r: 120, shelf: 185 };           // colony headland and its fast ice
const POLY = { x: chanX(254) - 22, z: 254, r: 12 };                        // the orcas' polynya
// the lead starts 9 m to port of the channel (the ship's bow is then almost dead ahead in the entry view) and swings out to 17 m
// in the channel the kayak swings 4 m to starboard and back (z 290 .. 204): the heading turns toward the berg wall and the tower, then back onto the hummock
const pathX = (z) => chanX(z) + LEAD_OFF * smoothstep(272, 314, z) + 8 * smoothstep(356, 392, z) + 4 * smoothstep(204, 234, z) * (1 - smoothstep(256, 290, z));
const shipZ = (u) => 315 + 112 * u;                             // ship centre; it is 60 m long and heads +Z

// ---------- geometry helpers: flat shaded, vertex coloured, merged ----------
function part(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const box = (w, h, d, x, y, z, color, ry = 0, rx = 0, rz = 0) => part(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
const cyl = (r0, r1, h, seg, x, y, z, color, rx = 0, rz = 0) => part(new THREE.CylinderGeometry(r0, r1, h, seg), color, x, y, z, rx, 0, rz);
function merged(parts) {
  parts.forEach((p) => p.deleteAttribute('normal'));
  const g = mergeGeometries(parts, false); parts.forEach((p) => p.dispose());
  g.computeVertexNormals();
  return g;
}
// triangles from loose arrays (flat, coloured)
function soup() {
  const P = [], C = [], col = new THREE.Color();
  const api = {
    tri(a, b, c, color) { col.set(color); P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) C.push(col.r, col.g, col.b); },
    quad(a, b, c, d, color) { api.tri(a, b, c, color); api.tri(a, c, d, color); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeVertexNormals(); return g;
    },
  };
  return api;
}

// ---------- soft lit sprites: looping (life > 0, on uTime) or one-shot (life < 0, on uClock) ----------
// item: { o:[x,y,z], v:[x,y,z], ph, life, s0, s1, a, g, grp, c }   (c: 0 lit white .. 1 shade colour)
function makePuffs(list, o) {
  const n = list.length, aO = new Float32Array(n * 3), aV = new Float32Array(n * 3), aT = new Float32Array(n * 4), aK = new Float32Array(n * 4), aC = new Float32Array(n * 2);
  list.forEach((p, i) => {
    aO.set(p.o, i * 3); aV.set(p.v, i * 3); aT.set([p.ph, p.life, p.s0, p.s1], i * 4);
    aK.set([o.rng(), p.a, p.g ?? 0, p.grp ?? 0], i * 4); aC.set([p.c ?? 0, p.drag ?? 0], i * 2);
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 3));
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 4));
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 2));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uSun: { value: o.sunDir.clone() }, uLit: { value: new THREE.Color(o.lit) }, uShade: { value: new THREE.Color(o.shade) }, uDark: { value: new THREE.Color(o.dark || o.shade) },
      uAmp: { value: new THREE.Vector4(1, 1, 1, 1) }, uClock: { value: 0 },
    }]),
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aO, aV; attribute vec4 aT, aK; attribute vec2 aC;
uniform float uTime, uClock; uniform vec4 uAmp; uniform vec3 uSun;
varying vec2 vUv; varying float vA, vSeed, vC; varying vec3 vSunV;
void main(){
  float life = abs(aT.y), tau = aT.y > 0.0 ? mod(uTime + aT.x*life, life) : uClock - aT.x;
  float f = tau/life, on = step(0.0, tau)*step(f, 1.0);
  float d = aC.y > 0.0 ? (1.0 - exp(-aC.y*tau))/aC.y : tau;
  vec3 p = aO + vec3(aV.x*d, aV.y*d - 2.9*aK.z*tau*tau, aV.z*d);
  float size = mix(aT.z, aT.w, sqrt(clamp(f, 0.0, 1.0)));
  int gi = int(aK.w + 0.5);
  float amp = gi == 0 ? uAmp.x : gi == 1 ? uAmp.y : gi == 2 ? uAmp.z : uAmp.w;
  vA = aK.y*amp*on*smoothstep(0.0, 0.1, f)*(1.0 - smoothstep(0.45, 1.0, f));
  float ang = aK.x*40.0 + f*(aK.x - 0.5)*1.6, ca = cos(ang), sa = sin(ang);
  vUv = position.xy; vSeed = aK.x; vC = aC.x;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  mvPosition.xy += mat2(ca, sa, -sa, ca)*position.xy*size*step(0.003, vA);
  vec3 sv = normalize((viewMatrix*vec4(uSun, 0.0)).xyz);
  vSunV = vec3(sv.x*ca + sv.y*sa, -sv.x*sa + sv.y*ca, sv.z);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uLit, uShade, uDark; uniform float uTime;
varying vec2 vUv; varying float vA, vSeed, vC; varying vec3 vSunV;
float ph(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float pn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(ph(i), ph(i + vec2(1, 0)), f.x), mix(ph(i + vec2(0, 1)), ph(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float r = length(vUv);
  if (r > 1.0 || vA < 0.003) discard;
  vec2 q = vUv*2.1 + vSeed*31.0 + uTime*0.07;
  float n = 0.6*pn(q) + 0.4*pn(q*2.3 + 3.1);
  float a = smoothstep(1.0, 0.2, r + (n - 0.5)*1.0)*vA;
  vec3 nn = normalize(vec3(vUv + (n - 0.5)*0.6, sqrt(max(0.0, 1.0 - r*r)) + 0.25));
  float lit = clamp(dot(nn, vSunV)*0.6 + 0.5, 0.0, 1.0);
  vec3 col = mix(mix(uShade, uDark, vC), mix(uLit, uShade, vC*0.7), lit*lit);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`,
  });
  mat.uniforms.uTime = o.time;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh, amp: mat.uniforms.uAmp.value, clock: mat.uniforms.uClock };
}

// ---------- the ship: 60 m ice-strengthened expedition vessel, bow toward +Z, waterline y = 0 ----------
async function buildShipGeometry(red, pause) {
  const s = soup(), N = 34, st = [];
  const dark = '#150c0d', white = '#dfe7ea', grey = '#56646b', glass = '#0b161d', steel = '#262c30', lit = new THREE.Color(0.5, 0.86, 1.1);
  const cRed = new THREE.Color(red).multiplyScalar(0.74).add(new THREE.Color(0, 0.028, 0.012)), cBelt = new THREE.Color('#5a1611'), cScuff = new THREE.Color('#6d7072'), cc = new THREE.Color();
  const hsh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const hb = (z) => 6.2 * Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, (z - 6) / 24), 2.3)), 0.62) * (1 - 0.22 * smoothstep(-22, -30, z)) + 0.06;
  const deckY = (z) => 6.4 + 2.6 * smoothstep(4, 30, z) + 0.5 * smoothstep(-20, -30, z), rakeAt = (z) => 5.5 * smoothstep(8, 30, z);
  const FR = [0.3, 0.64, 1];                                          // strakes between the ice belt (y 1.3) and the deck
  const sideAt = (zs, f) => [hb(zs) * (0.985 + 0.045 * f), 1.3 + (deckY(zs) - 1.3) * f, zs - rakeAt(zs) * 0.55 * Math.pow(1 - f, 1.5)];
  for (let i = 0; i <= N; i++) {
    const t = i / N, z = -30 + 60 * (0.55 * t + 0.45 * (1 - Math.pow(1 - t, 1.8)));     // stations crowd toward the bow so light rolls round the flare
    const b = hb(z), deck = deckY(z), rake = rakeAt(z), bw = b * (1 - 0.35 * smoothstep(12, 30, z));
    st.push([[0, -2.2, z - rake * 1.3], [bw * 0.8, -1.6, z - rake], [bw, 0.4, z - rake * 0.76], sideAt(z, 0), sideAt(z, FR[0]), sideAt(z, FR[1]), sideAt(z, 1), [b * 1.03, deck + 1.1, z + 0.1]]);
  }
  const NB = 7, bandCol = (i, k, sx) => {
    if (k < 2) return dark;
    const zz = st[i][3][2];
    if (k === 2) { cc.copy(cBelt).multiplyScalar(0.75 + 0.6 * hsh(i * 1.7 + sx, 3)); if (hsh(i + sx * 5, 9) > 0.62) cc.lerp(cScuff, 0.3 + 0.3 * hsh(i, 21)); return cc; }
    const strake = Math.floor((zz + 40) / 3) + k * 13 + sx * 3;       // 3 m plates, each a slightly different value
    cc.copy(cRed).multiplyScalar(0.95 + 0.1 * hsh(strake, k) - (k === 3 ? 0.06 : 0));
    if (k === 3 && hsh(strake, 5) > 0.7) cc.lerp(cBelt, 0.25);        // rust weeping down the lowest strake
    return cc;
  };
  for (let i = 0; i < N; i++) for (let k = 0; k < NB; k++) for (const sx of [1, -1]) {
    const a = st[i][k], b = st[i + 1][k], c = st[i + 1][k + 1], d = st[i][k + 1], m = (p) => [p[0] * sx, p[1], p[2]], col = bandCol(i, k, sx);
    if (sx < 0) s.quad(m(a), m(b), m(c), m(d), col); else s.quad(m(b), m(a), m(d), m(c), col);
  }
  // the shell is shaded smooth (normals shared between plates) so light rolls round the bow flare; deck and transom stay flat
  const hull = s.build(), s2 = soup();
  {
    const hp = hull.attributes.position, hn = hull.attributes.normal, acc = new Map(), keyOf = (i) => Math.round(hp.getX(i) * 50) + ',' + Math.round(hp.getY(i) * 50) + ',' + Math.round(hp.getZ(i) * 50);
    for (let i = 0; i < hp.count; i++) { const k = keyOf(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += hn.getX(i); a[1] += hn.getY(i); a[2] += hn.getZ(i); }
    for (let i = 0; i < hp.count; i++) { const a = acc.get(keyOf(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; hn.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
  }
  for (let i = 0; i < N; i++) { const a = st[i][6], b = st[i + 1][6]; s2.quad([a[0], a[1], a[2]], [-a[0], a[1], a[2]], [-b[0], b[1], b[2]], [b[0], b[1], b[2]], grey); }
  { const a = st[0]; for (let k = 0; k < NB; k++) s2.quad([-a[k][0], a[k][1], a[k][2]], [-a[k + 1][0], a[k + 1][1], a[k + 1][2]], [a[k + 1][0], a[k + 1][1], a[k + 1][2]], [a[k][0], a[k][1], a[k][2]], k < 3 ? dark : red); }
  const P = [s2.build()];
  await pause();
  // where the plating is at height y and world z: [x, yaw of the plate]
  const fOf = (zs, y) => clamp((y - 1.3) / (deckY(zs) - 1.3), 0, 1);
  const surf = (y, zw) => {
    let lo = -30, hi = 30;
    for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (sideAt(m, fOf(m, y))[2] < zw) lo = m; else hi = m; }
    return sideAt(lo, fOf(lo, y))[0];
  };
  const onHull = (w, h, d, y, z, color, out = 1.01) => {
    for (const sx of [1, -1]) P.push(box(w, h, d, surf(y, z) * out * sx, y, z, color, Math.atan((surf(y, z + 0.5) - surf(y, z - 0.5))) * sx));
  };
  for (let z = -23; z < 13; z += 2.4) { onHull(0.1, 0.66, 0.66, 4.5, z, '#c9b9b4', 1.004); onHull(0.1, 0.44, 0.44, 4.5, z, glass, 1.013); }   // portholes in pale rims
  for (let i = 0; i < 7; i++) if (i !== 3) onHull(0.12, 1.2, 0.62, 6.1, 12.6 + i * 1.05, white, 1.02);            // the name, as blocks
  for (let z = -26; z < 20; z += 6.5) onHull(0.1, 0.12, 5.6, 2.9, z, '#9c1f18');                                 // rubbing strake
  for (let i = 0; i < 7; i++) onHull(0.1, 0.16, 0.34 + 0.2 * (i % 2), 1.6 + i * 0.5, 21.5 - i * 0.12, white, 1.02);              // draught marks
  for (let i = 0; i < 9; i++) { const z = -24 + i * 5.3 + hsh(i, 2) * 2, h = 1.2 + 1.6 * hsh(i, 4); onHull(0.06, h, 0.22 + 0.2 * hsh(i, 6), 4.3 - h * 0.5, z, '#7c1e17', 1.004); }   // rust streaks
  onHull(0.16, 1.5, 1.3, 6.3, 20.5, '#2a0d0b', 1.0); onHull(0.2, 1.5, 0.2, 5.9, 20.5, steel, 1.03); onHull(0.2, 0.26, 1.1, 5.25, 20.5, steel, 1.035);   // hawse recess and anchor
  await pause();
  // upperworks: three houses with deck slabs, rails and window panes, bridge wings, funnel, masts, crane, boats
  const houses = [[10.6, 2.9, 30, 8.4, -9], [9.6, 2.7, 22, 11.2, -8], [11.4, 2.5, 8, 13.8, -1.5]];
  houses.forEach(([w, h, d, y, z], lv) => {
    P.push(box(w, h, d, 0, y, z, white), box(w + 1.1, 0.14, d + 1.0, 0, y + h / 2 + 0.05, z, grey));
    const top = y + h / 2 + 0.12, hx = (w + 1.0) / 2, z0 = z - d / 2 - 0.4, z1 = z + d / 2 + 0.4;
    for (const sx of [1, -1]) {
      P.push(box(0.08, 0.08, z1 - z0, hx * sx, top + 1.0, z, white), box(0.07, 0.07, z1 - z0, hx * sx, top + 0.5, z, white));
      for (let zz = z0; zz <= z1 + 0.01; zz += lv === 2 ? 2.2 : 3.1) P.push(box(0.08, 1.0, 0.08, hx * sx, top + 0.5, zz, white));
      const n = Math.floor((d - 2) / 1.75);
      for (let i = 0; i < n; i++) { const zz = z - d / 2 + 1.4 + i * 1.75; P.push(box(0.16, lv === 2 ? 0.95 : 0.72, 1.2, (w / 2 + 0.01) * sx, y + 0.35, zz, hsh(i + lv * 9, sx) > 0.72 ? lit : glass)); }
    }
    P.push(box(w + 1.0, 0.08, 0.08, 0, top + 1.0, z1, white), box(w + 1.0, 0.08, 0.08, 0, top + 1.0, z0, white));
  });
  await pause();
  for (let i = 0; i < 8; i++) P.push(box(1.12, 0.95, 0.16, -4.62 + i * 1.32, 14.15, 2.52, hsh(i, 77) > 0.7 ? lit : glass));   // bridge front
  P.push(box(7, 1.4, 6, 0, 15.8, -2, white), box(15.4, 0.3, 2.6, 0, 12.75, 0.6, grey), box(15.4, 0.9, 0.12, 0, 13.3, 1.9, white));     // wheelhouse top, bridge wings
  for (const sx of [1, -1]) {
    P.push(cyl(0.85, 0.85, 5.4, 8, 5.9 * sx, 11.1, -14, red, Math.PI / 2), box(1.1, 0.5, 3.6, 5.9 * sx, 11.9, -14, white));
    P.push(box(0.25, 2.4, 0.25, 5.7 * sx, 12.1, -10.9, grey), box(0.25, 2.4, 0.25, 5.7 * sx, 12.1, -17.1, grey), box(1.2, 0.2, 0.2, 5.5 * sx, 13.2, -10.9, grey), box(1.2, 0.2, 0.2, 5.5 * sx, 13.2, -17.1, grey));
  }
  P.push(cyl(1.5, 1.9, 5, 10, 0, 15, -14, white), cyl(1.52, 1.62, 1.2, 10, 0, 16.3, -14, red), cyl(1.3, 1.5, 0.5, 10, 0, 17.7, -14, dark));
  P.push(cyl(0.16, 0.24, 9, 6, 0, 20.4, -3, white), box(4.6, 0.2, 0.2, 0, 21.9, -3, white), cyl(0.5, 0.5, 0.9, 8, 0, 23.0, -3, white, Math.PI / 2), box(2.2, 0.12, 0.3, 0, 19.2, -2.6, white));
  P.push(cyl(0.3, 0.4, 7, 6, 0, 12, 14, white), cyl(0.18, 0.22, 10, 6, 0, 13.6, 18, white, 1.05), box(3.4, 1.6, 4, 0, 9.6, 10, white), box(2.4, 1.2, 2.4, 0, 10.8, 22, grey));
  P.push(box(1.0, 0.7, 1.0, 2.2, 10.2, 25.5, steel), box(1.0, 0.7, 1.0, -2.2, 10.2, 25.5, steel), cyl(0.5, 0.5, 2.6, 8, 0, 10.1, 24, steel, 0, Math.PI / 2));      // windlass
  P.push(box(8.5, 0.25, 9, 0, 9.95, -24.5, grey), cyl(0.2, 0.2, 3.2, 5, 0, 11.4, -29, white));
  await pause();
  const rest = merged(P);
  await pause();
  const out = mergeGeometries([hull, rest], false);
  hull.dispose(); rest.dispose();
  return out;
}

// ---------- zodiac and second kayak (tiny travelling vehicles) ----------
function buildZodiacGeometry(red) {
  const P = [], tube = '#141a1e';
  for (const sx of [1, -1]) P.push(cyl(0.3, 0.3, 4, 7, 0.8 * sx, 0.35, 0, tube, Math.PI / 2), cyl(0.3, 0.16, 1.4, 7, 0.52 * sx, 0.5, 2.5, tube, Math.PI / 2 - 0.25, sx * 0.42));
  P.push(box(1.5, 0.12, 3.9, 0, 0.2, 0, '#2c363b'), box(0.5, 0.9, 0.4, 0, 0.5, -2.15, '#20282c'), box(0.7, 0.5, 0.6, 0, 0.6, -0.2, red));
  for (const [x, z] of [[-0.3, -1.3], [0.35, 0.6], [-0.3, 1.2]]) P.push(cyl(0.25, 0.3, 0.75, 6, x, 0.95, z, red), part(new THREE.SphereGeometry(0.17, 6, 5), '#1a2126', x, 1.5, z));
  return merged(P);
}
function buildKayakGeometry(red) {
  const s = soup(), N = 10;
  for (let i = 0; i < N; i++) {
    const z0 = -2.4 + 4.8 * i / N, z1 = -2.4 + 4.8 * (i + 1) / N, w = (z) => 0.3 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / 2.4, 2.2)), 0.8) + 0.01;
    for (const sx of [1, -1]) {
      const a = [w(z0) * sx, 0.12, z0], b = [w(z1) * sx, 0.12, z1], c = [0, 0.26, z1], d = [0, 0.26, z0], e = [0, -0.12, z0], f = [0, -0.12, z1];
      if (sx < 0) { s.quad(a, b, c, d, red); s.quad(b, a, e, f, '#7e1d18'); } else { s.quad(b, a, d, c, red); s.quad(a, b, f, e, '#7e1d18'); }
    }
  }
  return merged([s.build(), cyl(0.2, 0.26, 0.62, 6, 0, 0.55, 0.15, '#1c2a33'), part(new THREE.SphereGeometry(0.14, 6, 5), '#c9d3d6', 0, 1.0, 0.15), box(0.42, 0.2, 0.3, 0, 0.72, 0.1, red)]);
}

// ---------- penguin: ~70 triangles, y up, belly toward +Z; aPt = 0 body, +-1 flipper ----------
function buildPenguinGeometry(species, moult) {
  const P = [], C = [], A = [], col = new THREE.Color();
  const black = new THREE.Color('#0b0e12'), white = new THREE.Color('#dfe6ea'), beak = new THREE.Color(species === 'gentoo' ? '#7a2b22' : '#15191d'), scruff = new THREE.Color('#6d6f6f');
  const prof = [[0.0, 0.05], [0.04, 0.125], [0.2, 0.165], [0.4, 0.14], [0.52, 0.085], [0.6, 0.09], [0.68, 0.06], [0.715, 0.0]], S = 6;
  const pt = (k, j) => { const a = (j + 0.5) / S * TAU, [y, r] = prof[k]; return [Math.sin(a) * r, y, Math.cos(a) * r * (k < 4 ? 1.12 : 1) + (k >= 5 ? 0.02 : 0)]; };
  const paint = (p) => {
    const front = p[2] > 0.045, y = p[1];
    if (y < 0.5) col.copy(front ? white : black);
    else if (species === 'chinstrap') col.copy(front && y < 0.665 ? white : black);
    else if (species === 'gentoo') col.copy(y > 0.63 && Math.abs(p[0]) > 0.02 && p[2] > -0.03 ? white : black);
    else col.copy(black);
    if (moult && y < 0.5 && Math.sin(p[0] * 40 + y * 31) > 0.2) col.lerp(scruff, 0.7);
    return col;
  };
  const push = (p, c, a) => { P.push(p[0], p[1], p[2]); C.push(c.r, c.g, c.b); A.push(a); };
  const tri = (a, b, c, fixed, apt = 0) => { for (const p of [a, b, c]) push(p, fixed || paint(p), apt); };
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < S; j++) {
    const a = pt(k, j), b = pt(k, j + 1), c = pt(k + 1, j + 1), d = pt(k + 1, j);
    tri(a, b, c); if (k < prof.length - 2) tri(a, c, d);
  }
  tri([-0.03, 0.63, 0.09], [0.03, 0.63, 0.09], [0, 0.615, 0.17], beak); tri([0.03, 0.63, 0.09], [-0.03, 0.63, 0.09], [0, 0.65, 0.1], beak);
  for (const sx of [1, -1]) {
    const a = [0.14 * sx, 0.47, 0.0], b = [0.19 * sx, 0.2, 0.05], c = [0.185 * sx, 0.22, -0.05], d = [0.15 * sx, 0.45, -0.07];
    tri(a, b, c, black, sx); tri(a, c, d, black, sx); tri(c, b, a, white, sx); tri(d, c, a, white, sx);
    tri([0.03 * sx, 0.0, 0.0], [0.11 * sx, 0.0, 0.15], [0.12 * sx, 0.02, 0.02], beak);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPt', new THREE.Float32BufferAttribute(A, 1));
  g.computeVertexNormals();
  return g;
}

const TILT_GLSL = /* glsl */`
vec3 calvTilt(vec3 v, vec3 n){ vec3 k = vec3(n.z, 0.0, -n.x); return v*n.y + cross(k, v) + k*dot(k, v)/(1.0 + n.y); }
vec3 calvN(vec2 c){ float e = 2.0, h = calvWave(c); return normalize(vec3(h - calvWave(c + vec2(e, 0.0)), e, h - calvWave(c + vec2(0.0, e)))); }
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
`;

export default {
  id: 'the-calving',
  name: 'The Calving',
  category: 'ocean',
  weirdness: 0,
  media: ['water'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    const time = { value: 0 }, updaters = [], disposables = [];
    const red = PALETTE[6];

    // ---------- what kind of visit is this ----------
    let look = rng.pick(['noon', 'noon', 'noon', 'fogbank', 'midnight', 'noon', 'overcast']);      // blazing noon is the signature look: four visits in seven
    if (vary.hour === 'day') look = look === 'midnight' ? 'noon' : look;
    else if (vary.hour === 'golden' || vary.hour === 'dawn' || vary.hour === 'night') look = 'midnight';
    const late = rng.chance(0.45);                                  // late summer: open water, brash, moulting birds
    const species = rng.pick(['adelie', 'adelie', 'chinstrap', 'gentoo']);
    const crabeater = rng.chance(0.4), kayakDraw = rng.chance(0.4), zodiac = rng.chance(0.55), secondKayak = true;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;

    // ---------- sky, light, fog ----------
    const SKY = {
      noon: { preset: 'day', zenith: '#3478c2', horizon: PALETTE[1], sunElevation: 40, sunAzimuth: -148, clouds: false, clouds2: { coverage: 0.3, opacity: 0.45, stretch: 1 }, scatter: 0.08, fog: 0.00034 },
      midnight: { preset: 'goldenHour', zenith: '#2a5c9c', mid: '#7fb0d6', horizon: '#d6e7ea', sunElevation: 7, sunAzimuth: -112, sunColor: '#fff0b0', scatterColor: '#fff2b8', scatter: 0.15,
        lightColor: '#fff0b0', ambientColor: '#6fa6e0', clouds: false, clouds2: { coverage: 0.3, opacity: 0.5, stretch: 1, lit: '#fbf7e6', shade: '#9fbad2' }, fog: 0.00042 },
      overcast: { preset: 'overcast', zenith: '#8fa6b8', mid: '#aec3d0', horizon: '#cfdfe8', ground: '#8ea4b2', scatterColor: '#eaf3f7', scatter: 0.3, sunElevation: 32, sunAzimuth: -112, sunColor: '#f2f8fb',
        clouds: { lit: '#e2ecf1', shade: '#6d8799' }, clouds2: { lit: '#bccbd5', shade: '#7b93a5' },
        lightColor: '#f3f9fc', lightIntensity: 1.9, ambientColor: '#b4cde0', groundLight: '#5f7c90', ambientIntensity: 2.0, fog: 0.0015 },
      fogbank: { preset: 'day', zenith: '#3f86c9', horizon: '#e6f1f6', horizonPow: 1.7, sunElevation: 34, sunAzimuth: -150, clouds: false, clouds2: false, scatter: 0.05, fog: 0.0046 },
    }[look];
    const { fog: fogBase, ...skyOpts } = SKY;
    const sky = makeSky({ rng, ...skyOpts });
    scene.add(sky.object);
    const fogCol = look === 'overcast' ? sky.fogColor.clone().lerp(new THREE.Color(PALETTE[1]), 0.7) : sky.colorAt(new THREE.Vector3(0, 0.02, -1).normalize()).clone();
    const snowCol = new THREE.Color(PALETTE[2]);
    scene.fog = new THREE.FogExp2(fogCol.clone(), fogBase);
    const rig = makeLightRig(sky, { bounce: 0.5, intensity: look === 'midnight' ? 1.2 : 1, ambient: look === 'midnight' ? 0.72 : 1 }); scene.add(rig.object);
    const sunDir = sky.lightDirection.clone().normalize();
    await ctx.yield();

    // ---------- the hero: glacier front, tower, wave, sea, arch ----------
    const hero = await buildHero(ctx, {
      palette: PALETTE, width: 1400, archDistance: ARCH_Z, archYaw: CH_A, sea: true, floes: false, swell: 0.5, sunDir,
      skyTop: look === 'overcast' ? '#5f8198' : sky.zenithColor.clone().multiplyScalar(look === 'midnight' ? 0.8 : 0.52),      // near-black water under the hard blue sky iceGlow: look === 'overcast' ? 1.15 : 1,
      lightSweep: look === 'overcast' ? 0.25 : look === 'fogbank' ? 0.1 : 0.14, glitter: look === 'overcast' ? 0.8 : look === 'fogbank' ? 0.7 : 1,
      skyHorizon: look === 'overcast' ? fogCol.clone().lerp(new THREE.Color('#4f7690'), 0.6) : fogCol.clone().lerp(sky.zenithColor, look === 'midnight' ? 0.75 : 0.55),
    });
    scene.add(hero.object);
    hero.setEventTime(0);
    const WU = hero.waveUniforms, WAVE = hero.waveGLSL, imp = hero.anchors.impact, TL = hero.timeline;
    await ctx.yield();

    // ---------- the path: lead, turn in, channel; the ring wave is baked into its height ----------
    const flat = [];
    for (let z = START_Z; z > 262; z -= 6) flat.push(z);
    for (let z = 262; z > ARCH_Z + 0.1; z -= 2.5) flat.push(z);
    flat.push(ARCH_Z);
    const cum = [0];
    for (let i = 1; i < flat.length; i++) cum.push(cum[i - 1] + Math.hypot(flat[i] - flat[i - 1], pathX(flat[i]) - pathX(flat[i - 1])));
    const flatLen = cum[cum.length - 1];
    const evAt = (u) => Math.max(0, D * (u - 0.5));
    const ringAt = (i, dz) => { const z = flat[i] + dz, u = clamp((cum[i] - dz) / flatLen, 0, 1); return hero.ringHeight(pathX(z), z, evAt(u)); };
    let uCrest = 0.84, crestH = 0;
    const pts = flat.map((z, i) => {
      const h = (ringAt(i, -3) + 2 * ringAt(i, -1.5) + 3 * ringAt(i, 0) + 2 * ringAt(i, 1.5) + ringAt(i, 3)) / 9;
      if (h > crestH) { crestH = h; uCrest = cum[i] / flatLen; }
      const endK = smoothstep(ARCH_Z + 14, ARCH_Z, z);
      return [pathX(z), lerp(EYE + clamp(h, -0.7, 3.2), 1.05, endK), z];   // a low portal: the hummock's ridge hides it from any distance
    });
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const kayakZ = (u) => { const d = clamp(u, 0, 1) * flatLen; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; return lerp(flat[i - 1], flat[i], (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])); };

    // ---------- tabular bergs (they rock ponderously on the wave) ----------
    const bergDefs = [[0, 0, 0, 80], [-215, 395, -0.35, 150], [345, 135, 1.25, 210], [-185, 112, 1.35, 140], [430, 315, 0.15, 190]];   // [0] is placed below: the close one to starboard
    const bergMat = hero.kit.makeIceMaterial({ detail: 1.0, scallop: 0.4, crack: 0.35 }), bergs = [];   // melt-fluted, banded; few of the wall's crack lines
    for (let i = 0; i < bergDefs.length; i++) {
      const [bx, bz, yaw, len] = bergDefs[i], hgt = rng.range(30, 40), wid = len * rng.range(0.36, 0.5);
      const g = hero.kit.makeIceBlock(len, hgt, wid, { seg: 9, round: 0.22, amp: 2.6, weathered: (nx, ny, nz, x, y) => Math.max(smoothstep(0.3, 0.8, ny), 0.35 + 0.65 * smoothstep(-0.36, -0.12, y / hgt) - 0.25 * smoothstep(0.2, 0.7, noise.n2(x * 0.05, y * 0.3))) });
      const m = new THREE.Mesh(g, bergMat); m.position.set(bx + rng.range(-20, 20), hgt * 0.5 - 6, bz + rng.range(-20, 20)); m.rotation.y = yaw + rng.range(-0.25, 0.25);
      if (i === 0) {   // a 30 m ice wall close to starboard of the channel (its face about 19 m off) from u 0.35 to 0.6, its long side along the channel;
        // its far end stays to the right of the tower's sight line from everywhere on the route
        const bz0 = 262 + rng.range(-3, 3), off = 19 + wid * 0.5 + rng.range(0, 3);
        m.position.x = chanX(bz0) + off * Math.cos(CH_A); m.position.z = bz0 - off * Math.sin(CH_A); m.rotation.y = Math.PI / 2 + CH_A + rng.range(-0.06, 0.06);
      }
      scene.add(m); bergs.push({ m, y0: m.position.y, yaw: m.rotation.y, len, wid, ph: rng.range(0, TAU) });
      await ctx.yield();
    }
    {   // shadows on the sea and the pack: short at noon, hundreds of metres long under the midnight sun
      const hl = Math.hypot(sunDir.x, sunDir.z) || 1, dx = -sunDir.x / hl, dz = -sunDir.z / hl, tanE = Math.max(0.05, sunDir.y / hl);
      const cast = bergs.map((b) => {
        const ux = Math.cos(b.yaw), uz = -Math.sin(b.yaw), top = b.y0 * 2 + 6;
        return { x: b.m.position.x, z: b.m.position.z, halfWidth: 0.46 * (b.len * Math.abs(ux * -dz + uz * dx) + b.wid * Math.abs(-uz * -dz + ux * dx)),
          length: Math.min(600, top / tanE + 0.5 * (b.len * Math.abs(ux * dx + uz * dz) + b.wid * Math.abs(-uz * dx + ux * dz))) };
      });
      cast.push({ x: HEAD.x, z: HEAD.z, halfWidth: 78, length: Math.min(600, 70 / tanE + 40) });
      hero.setShadows(cast, [dx, dz], { noon: 0.7, midnight: 0.92, fogbank: 0.45, overcast: 0 }[look]);
    }
    const inBerg = (x, z, r) => bergs.some((b) => {
      const dx = x - b.m.position.x, dz = z - b.m.position.z, c = Math.cos(b.yaw), s = Math.sin(b.yaw);
      return Math.abs(dx * c - dz * s) < b.len * 0.56 + r && Math.abs(dx * s + dz * c) < b.wid * 0.6 + r;
    });

    // ---------- the pack: floes, strip pack ahead of the ship, brash astern of it ----------
    const floeItems = [], grid = new Map(), CELL = 16;
    const key = (x, z) => Math.floor(x / CELL) * 4096 + Math.floor(z / CELL);
    const fits = (x, z, r) => {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let i = cx - 2; i <= cx + 2; i++) for (let j = cz - 2; j <= cz + 2; j++) {
        const list = grid.get(i * 4096 + j); if (!list) continue;
        for (const it of list) { const dx = it.x - x, dz = it.z - z, rr = it.r + r + 0.5; if (dx * dx + dz * dz < rr * rr) return false; }
      }
      return true;
    };
    const blocked = (x, z, r) => {
      if (z < hero.wallZ(clamp(x, -690, 690)) + 10 + r) return true;
      if (Math.hypot(x - imp.x, z - imp.z) < 46 + r) return true;
      if (Math.hypot(x, z - ARCH_Z) < 30 + r) return true;
      if (Math.hypot(x - POLY.x, z - POLY.z) < POLY.r + r) return true;
      if (Math.hypot(x - HEAD.x, z - HEAD.z) < HEAD.shelf + r) return true;
      if (z > 135 && Math.abs(x - pathX(z)) < 6.6 + r) return true;
      if (z > START_Z + 2 && Math.abs(x - pathX(z)) < 13 + r) return true;       // open water behind the entry
      if (z > 40 && z < 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8) return true;
      if (Math.abs(z - POLY.z) < POLY.r + 4 + r && x > POLY.x && x < chanX(z)) return true;      // nothing between the orcas and the kayak
      return inBerg(x, z, r);
    };
    const addFloe = (x, z, r, kind = 0, th) => {
      const it = { x, z, r, kind, th: th ?? (r > 7 ? rng.range(0.7, 1.15) : r > 3.5 ? rng.range(0.3, 0.75) : rng.range(0.14, 0.42)), id: floeItems.length };
      floeItems.push(it); const k = key(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(it); return it;
    };
    // hand-placed floes along the route: the seal's, the leap-out floes and the standing groups
    const sealFloe = addFloe(pathX(361) - 11.6, 361, 4.6, 0, 0.6);
    const stageFloes = [];
    for (const z of [391, 345, 329]) { const r = rng.range(5.5, 7.5), zz = z + rng.range(-3, 3); stageFloes.push(addFloe(pathX(zz) - 7.2 - r, zz, r, 0, 0.75)); }
    const greetFloe = addFloe(pathX(374) - 10.4, 374, 5.8, 0, 0.7);     // standing birds in the entry view, 25 m ahead to port
    for (let i = 0; i < 6; i++) {      // low pans close beside the bow in the entry view: white ice on black water in the lower half of the opening
      const r = rng.range(1.5, 2.6), z = 391 - i * 4.2 + rng.range(-1, 1), x = pathX(z) + (i % 2 ? 1 : -1) * (3.3 + r + rng.range(0, 1.6));
      if (fits(x, z, r)) addFloe(x, z, r, 3, rng.range(0.16, 0.3));
    }
    for (const [z, sx] of [[284, -1], [250, 1], [206, -1]]) {      // eye-level foreground in the channel: penguin floes whose edge is 6 m off the bow
      const r = rng.range(5.2, 6.8), zz = z + rng.range(-2, 2);
      stageFloes.push(addFloe(pathX(zz) + sx * (6.9 + r * 0.95), zz, r, 0, rng.range(0.55, 0.8)));
    }
    for (const z of [292, 270, 222, 196, 174]) for (const sx of [-1, 1]) {
      const r = rng.range(5, 8.5), zz = z + rng.range(-5, 5), x = chanX(zz) + sx * (10 + r * 0.8 + 1.5 + rng.range(0, 3));
      if (!blocked(x, zz, r) && fits(x, zz, r)) stageFloes.push(addFloe(x, zz, r, 0, 0.8));
    }
    for (let i = 0; i < 9; i++) {     // slabs the ship left standing on edge along its channel, still rocking
      const sx = i % 2 ? 1 : -1, z = 338 - i * 11.5 + rng.range(-3, 3), r = rng.range(2.6, 4.4), x = chanX(z) + sx * (9.6 + r * 0.55 + rng.range(0, 1.6));
      if (Math.abs(z - POLY.z) < POLY.r + 8 && sx < 0) continue;
      if (!fits(x, z, r) || Math.abs(x - pathX(z)) < 8.5 + r) continue;
      addFloe(x, z, r, 0, rng.range(0.55, 0.85)).tilt = rng.range(0.5, 1.0);
    }
    const wantFloes = Math.round((late ? 2150 : 3150) * density), nearAdd = Math.round((late ? 200 : 320) * density);
    const rndR = () => { const q = rng(); return q < 0.55 ? rng.range(1.5, 4) : q < 0.9 ? rng.range(4, 9) : rng.range(9, 15); };
    // the pack beside the route: plates shouldered edge to edge, biggest first, so the lead and the ship's channel are black roads
    // between white shelves; one plate in five carries a slab that has ridden up onto it
    const rafts = [];
    for (let z = 404; z > 172;) {        // a course of plates along both edges of the lead and of the ship's channel
      const r = rng.range(5.5, 9.5), lead = z > 300;
      for (const sx of [-1, 1]) {
        const x = (lead ? pathX(z) : chanX(z)) + sx * ((lead ? 6.9 : 9.8) + r * 0.9), inShip = z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8;
        if (blocked(x, z, r) || !fits(x, z, r * 0.8) || (r > 7 && inShip)) continue;
        addFloe(x, z, r, inShip ? 1 : 0, rng.range(0.4, 0.95));
      }
      z -= r * 1.7;
    }
    for (const [tries, r0, r1] of [[90, 11, 16], [300, 7, 11], [800, 4, 7], [1700, 2.2, 4], [1500, 1.2, 2.2]]) {
      for (let i = 0, n = Math.round(tries * (late ? 0.6 : 1) * density); i < n; i++) {
        if ((i & 255) === 255) await ctx.yield();
        const z = rng.range(170, 436), x = pathX(z) + rng.range(-66, 66), r = rng.range(r0, r1);
        if (blocked(x, z, r) || !fits(x, z, r * 0.8)) continue;
        const inShip = z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8;
        if (r > 7 && inShip) continue;
        const it = addFloe(x, z, r, inShip ? 1 : 0, (r > 9 ? rng.range(0.45, 0.95) : rng.range(0.25, 1.0)) * (rng.chance(0.12) ? 1.45 : 1));
        if (r > 5.5 && !inShip && rng.chance(0.22)) {
          const a = rng.range(0, TAU), rs = r * rng.range(0.36, 0.55), tilt = rng.range(0.14, 0.26);
          rafts.push({ x: x + Math.cos(a) * r * 0.3, z: z + Math.sin(a) * r * 0.3, r: rs, kind: 0, th: rng.range(0.3, 0.55), tilt, y: it.th - 0.1 + 0.58 * rs * Math.sin(tilt) });
        }
      }
      await ctx.yield();
    }
    for (const rf of rafts) { rf.id = floeItems.length; floeItems.push(rf); }
    await ctx.yield();
    const nearFloes = floeItems.length + nearAdd;
    for (let tries = 0; tries < nearAdd * 30 && floeItems.length < nearFloes; tries++) {   // then loose floes out to 80 m either side
      const z = rng.range(135, 455), x = pathX(z) + rng.range(-80, 80), r = rndR();
      if (blocked(x, z, r) || !fits(x, z, r)) continue;
      if (r > 7 && z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8) continue;      // nothing bigger than 7 m stands on edge beside the kayak
      addFloe(x, z, r, z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8 ? 1 : 0);
    }
    await ctx.yield();
    for (let tries = 0; tries < wantFloes * 9 && floeItems.length < wantFloes; tries++) {
      const x = rng.range(-470, 470), z = rng.range(30, 590);
      if (Math.abs(x) > 130 && rng() < 0.4) continue;
      if (Math.abs(x - chanX(z)) > 250 && rng() < 0.5) continue;      // thinner far from the route: it pays for the pack beside it
      const r = rndR();
      if (blocked(x, z, r) || !fits(x, z, r)) continue;
      if (r > 7 && z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8) continue;      // nothing bigger than 7 m stands on edge beside the kayak
      addFloe(x, z, r, z > 316 && Math.abs(x - chanX(z)) < 9 + r * 0.8 ? 1 : 0);
      if (tries % 1500 === 1499) await ctx.yield();
    }
    const nBrash = Math.round((late ? 900 : 700) * density);
    for (let i = 0; i < nBrash; i++) {
      const z = i % 3 ? rng.range(150, 440) : rng.range(190, 335), r = rng.range(0.3, 1.25) * (rng.chance(0.08) ? 1.8 : 1), x = chanX(z) + rng.range(-9.5, 9.5);
      if (Math.abs(x - pathX(z)) < 3.4 + r || Math.hypot(x, z - ARCH_Z) < 26) continue;
      floeItems.push({ x, z, r, kind: 2, th: rng.range(0.14, 0.42), id: floeItems.length });
    }
    await ctx.yield();
    const nNear = Math.round(640 * density);
    for (let i = 0; i < nNear; i++) {
      const z = rng.range(152, 420), r = rng.range(0.25, 0.85) * (rng.chance(0.12) ? 1.9 : 1), x = pathX(z) + rng.sign() * (2.4 + r + 8.5 * Math.pow(rng(), 1.6));
      if (Math.hypot(x, z - ARCH_Z) < 26) continue;
      floeItems.push({ x, z, r, kind: 3, th: r * rng.range(0.16, 0.34), id: floeItems.length });
    }
    for (let i = 0, n = Math.round(460 * density); i < n; i++) {    // slush and crumbs right under the bow
      const z = rng.range(154, 420), r = rng.range(0.1, 0.36);
      floeItems.push({ x: pathX(z) + rng.range(-2.6, 2.6), z, r, kind: 3, th: rng.range(0.05, 0.12), id: floeItems.length });
    }
    await ctx.yield();
    {
      // one slab: a flat top (shaded smooth, broken up in the fragment shader), a bevelled wet rim and a broken, faceted edge.
      // aRd = 0 centre .. 0.86 top edge .. 1 rim, then 1.2 .. 1.6 down the edge to below the waterline
      const sides = 8, ring = [], P = [], C = [], Rd = [];
      for (let i = 0; i < sides; i++) { const a = (i + rng.range(-0.32, 0.32)) / sides * TAU, r = rng.range(0.7, 1.1); ring.push([Math.cos(a) * r, Math.sin(a) * r]); }
      const one = [1, 1, 1], wlT = one, wlB = one;      // the broken edge is coloured in the fragment shader
      const Nn = [], nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      const tri = (a, b, c) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); C.push(...v[3]); Rd.push(v[4]); Nn.push(...v[5]); } };
      const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
      for (let i = 0; i < sides; i++) {
        const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % sides];
        const na0 = nrm(ax * 0.12, 1, az * 0.12), nb0 = nrm(bx * 0.12, 1, bz * 0.12), na1 = nrm(ax, 0.75, az), nb1 = nrm(bx, 0.75, bz);
        const fw = nrm(-(bz - az), 0.06 * Math.hypot(bx - ax, bz - az), bx - ax), sg = fw[0] * (ax + bx) + fw[2] * (az + bz) < 0 ? -1 : 1, nw = [fw[0] * sg, fw[1], fw[2] * sg];
        const a0 = [ax * 0.86, 1, az * 0.86, one, 0.86, na0], b0 = [bx * 0.86, 1, bz * 0.86, one, 0.86, nb0], a1 = [ax, 0.74, az, one, 1, na1], b1 = [bx, 0.74, bz, one, 1, nb1];
        const a1w = [ax, 0.74, az, wlT, 1.2, nw], b1w = [bx, 0.74, bz, wlT, 1.2, nw], a2 = [ax * 1.06, -0.32, az * 1.06, wlB, 1.6, nw], b2 = [bx * 1.06, -0.32, bz * 1.06, wlB, 1.6, nw];
        tri([0, 1, 0, one, 0, [0, 1, 0]], b0, a0); quad(a0, b0, b1, a1); quad(a1w, b1w, b2, a2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aRd', new THREE.Float32BufferAttribute(Rd, 1)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      const n = floeItems.length, aFl = new Float32Array(n * 3);
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, emissive: new THREE.Color(PALETTE[4]), emissiveIntensity: 0.06 });
      const uShip = { value: new THREE.Vector3(407, 347, 377) };
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, WU, { uShip });
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\n${WAVE}\n${hero.shadowGLSL}\n${TILT_GLSL}\nattribute vec3 aFl; attribute float aRd; uniform vec3 uShip; varying vec3 vFl; varying float vSh; varying vec2 vRd;`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
vec3 fc = instanceMatrix[3].xyz; float fcx = fc.x - ${KS}*(fc.z - ${ARCH_Z}.0), fsc = 1.0, roll = 0.0, sgn = fcx < 0.0 ? -1.0 : 1.0;
vFl = vec3(transformed.xz*length(instanceMatrix[0].xyz), aFl.y); vRd = vec2(aRd, length(instanceMatrix[0].xyz));
if (aFl.x > 1.5) {
  fsc = aFl.x > 2.5 ? 1.0 : 1.0 - smoothstep(uShip.y - 4.0, uShip.y + 12.0, fc.z);
  transformed.xz = rot2(uCalvTime*(aFl.y - 0.5)*0.9)*transformed.xz;
  fc.x += sin(uCalvTime*0.31 + aFl.y*40.0)*0.7; fc.z += cos(uCalvTime*0.23 + aFl.y*23.0)*0.7;
  roll = 0.25*sin(uCalvTime*1.1 + aFl.y*60.0);
} else {
  float nearS = (1.0 - smoothstep(9.0, 23.0, abs(fcx)))*(1.0 - smoothstep(26.0, 44.0, abs(fc.z - uShip.z)));
  roll = nearS*0.16*sin(uCalvTime*1.7 + aFl.y*40.0);
  if (aFl.x > 0.5) { float k = smoothstep(uShip.x - 5.0, uShip.x + 9.0, fc.z); fsc = smoothstep(0.0, 0.35, k); roll += (1.0 - k)*1.25*sgn; fc.x += (1.0 - k)*sgn*5.0; fc.y -= (1.0 - k)*0.8; }
}
if (aFl.z > 0.0) { roll += aFl.z*sgn*(1.0 + 0.1*sin(uCalvTime*0.8 + aFl.y*30.0)); fc.y += sin(aFl.z)*length(instanceMatrix[0].xyz)*0.42; }   // left on edge by the ship
vec3 fnn = calvN(fc.xz);
transformed = (instanceMatrix*vec4(transformed*fsc, 1.0)).xyz - instanceMatrix[3].xyz;
transformed.xy = rot2(roll)*transformed.xy;
transformed = calvTilt(transformed, fnn) + fc + vec3(0.0, calvWave(fc.xz), 0.0);
{ mat3 im = mat3(instanceMatrix); vec3 nI = im*(objectNormal/vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])));   // the baked normal, carried through the same roll and tilt
  nI.xy = rot2(roll)*nI.xy; vNormal = normalize(normalMatrix*calvTilt(normalize(nI), fnn)); }
vSh = calvShadow(transformed.xz);`)
          .replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix*vec4(transformed, 1.0);\ngl_Position = projectionMatrix*mvPosition;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
varying vec3 vFl; varying float vSh; varying vec2 vRd;
float flH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float flN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(flH(i), flH(i + vec2(1, 0)), f.x), mix(flH(i + vec2(0, 1)), flH(i + vec2(1, 1)), f.x), f.y); }`)
          .replace('#include <color_fragment>', `#include <color_fragment>
vec2 flQ = vFl.xy + vFl.z*91.0; float flD = 0.55*flN(flQ*0.45) + 0.3*flN(flQ*1.3) + 0.15*flN(flQ*3.7);
float flTop = 1.0 - smoothstep(1.02, 1.1, vRd.x), flBig = smoothstep(1.6, 3.2, vRd.y);
float flCrown = 1.0 - smoothstep(0.68, 0.84, vRd.x + (flD - 0.5)*0.4);              // old snow, ragged, set in from the edge
float flPool = smoothstep(0.6, 0.68, flN(flQ*0.3 + 7.0))*(1.0 - smoothstep(0.4, 0.66, vRd.x))*flBig;      // grey-blue melt pools on the bigger floes
float flCrack = (1.0 - smoothstep(0.0, 0.07, abs(flN(flQ*0.6 + 19.0) - 0.5)))*flBig;
float flRim = smoothstep(0.8, 0.97, vRd.x);
vec3 flC = mix(vec3(0.6, 0.71, 0.77)*(0.82 + 0.36*flD), vec3(0.84, 0.855, 0.86)*(0.88 + 0.16*flD), flCrown);
flC = mix(flC, vec3(0.34, 0.5, 0.62), max(flPool, flCrack*0.6));
flC = mix(flC, vec3(0.46, 0.7, 0.8), flRim);
// the broken edge: a snow lip, dark wet blue ice streaked by melt, a bright wash line at the water and turquoise below it
float flWy = clamp((vRd.x - 1.2)/0.4, 0.0, 1.0), flStr = flN(vec2((vFl.x + vFl.y)*2.3 + vFl.z*50.0, flWy*1.5)), flLay = flN(vec2((vFl.x - vFl.y)*0.35, flWy*9.0 + vFl.z*30.0));
vec3 flWall = vec3(0.30, 0.52, 0.68)*(0.62 + 0.55*flStr + 0.22*flLay);
flWall = mix(flWall, vec3(0.78, 0.84, 0.88), (1.0 - smoothstep(0.0, 0.14, flWy + (flStr - 0.5)*0.14))*0.85);
flWall = mix(flWall, vec3(0.6, 0.86, 0.95), smoothstep(0.6, 0.67, flWy)*(1.0 - smoothstep(0.69, 0.76, flWy))*0.6);
flWall = mix(flWall, vec3(0.2, 0.62, 0.74), smoothstep(0.7, 0.8, flWy));
diffuseColor.rgb *= mix(flWall, flC, flTop);
float flWet = max(flRim, flPool)*flTop;
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.34, 0.48, 0.74), vSh);`)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.18, flWet);');
      };
      const mesh = new THREE.InstancedMesh(g, mat, n), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color(), tint = new THREE.Color(PALETTE[1]), skM = [], skK = [];
      floeItems.forEach((it, i) => {
        qt.setFromAxisAngle(up, rng.range(0, TAU));
        sc.set(it.r * rng.range(0.86, 1.0), it.th, it.r * rng.range(0.8, 1.0)); ps.set(it.x, it.y || 0, it.z);
        mesh.setMatrixAt(i, m4.compose(ps, qt, sc));
        mesh.setColorAt(i, c.setScalar(rng.range(0.9, 1.08)).lerp(tint, rng.range(0, 0.2)));
        aFl[i * 3] = it.kind; aFl[i * 3 + 1] = rng(); aFl[i * 3 + 2] = it.tilt || 0;
        if (it.kind === 0 && it.r > 1.7 && !it.tilt) {          // its submerged ledge: a turquoise glow in the dark water round the floe
          const k = 1 + clamp(2.4 / it.r, 0.2, 0.7); ps.y = 0;
          sc.x *= k; sc.z *= k; skM.push(...m4.compose(ps, qt, sc).elements); skK.push(1 / k);
        }
      });
      g.setAttribute('aFl', new THREE.InstancedBufferAttribute(aFl, 3));
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'floes';
      scene.add(mesh);
      await ctx.yield();
      {
        const sp = [0, 0, 0], si = [];
        for (let i = 0; i < sides; i++) { sp.push(ring[i][0], 1, ring[i][1]); si.push(0, 1 + (i + 1) % sides, 1 + i); }      // y = radial coordinate (0 centre, 1 outer edge)
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
        const skMat = new THREE.ShaderMaterial({
          fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
          uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(PALETTE[3]).multiplyScalar(look === 'midnight' ? 0.68 : 0.9) } }]),
          vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WAVE}
attribute float aIn; varying vec2 vK;
void main(){
  vec3 w = (instanceMatrix*vec4(position.x, 0.0, position.z, 1.0)).xyz;
  w.y = calvWave(w.xz) + 0.05;
  vK = vec2(position.y, aIn);
  vec4 mvPosition = viewMatrix*vec4(w, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
          fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uCol; varying vec2 vK;
void main(){
  float a = 1.0 - smoothstep(vK.y, 1.0, vK.x);
  gl_FragColor = vec4(uCol*(0.55 + 0.45*a), a*a*0.7);
  #include <fog_fragment>
}`,
        });
        Object.assign(skMat.uniforms, WU);
        const skirts = new THREE.InstancedMesh(sg, skMat, skK.length);
        skirts.instanceMatrix.array.set(skM); skirts.instanceMatrix.needsUpdate = true;
        sg.setAttribute('aIn', new THREE.InstancedBufferAttribute(new Float32Array(skK), 1));
        skirts.frustumCulled = false; skirts.renderOrder = 1; skirts.name = 'floe-ledges'; scene.add(skirts);
      }
      updaters.push((dt, t, cam, u) => { const zc = shipZ(u); uShip.value.set(zc + 30, zc - 30, zc); });
    }
    await ctx.yield();

    // ---------- far sea, peaks, lenticular clouds ----------
    const summits = [];                                             // the three highest tops: caps and spindrift
    {
      const g = new THREE.RingGeometry(560, 7000, 48, 1); g.rotateX(-Math.PI / 2);
      const far = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[5]).lerp(fogCol, 0.5) }));
      far.position.set(imp.x, -0.35, imp.z); scene.add(far);
      // a dark bed far below: a camera that looks in through the previous portal from under our waterline sees deep water, not the sky's underside
      const bed = new THREE.Mesh(new THREE.CircleGeometry(7000, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE[5]).lerp(new THREE.Color(PALETTE[4]), 0.12) }));
      bed.position.set(imp.x, -26, imp.z); scene.add(bed);
      // the ringing peaks: a ridged heightfield annulus, black rock on the steeps and snow on the rest, lit by the
      // sun and paled by haze; hidden in overcast, standing out of the bank in fog
      if (look !== 'overcast') {
        const NA = 420, NR = 13, CZ = 150, pr = rng.fork('peaks'), o1 = pr.range(0, 50), o2 = pr.range(0, 50);
        const heroA = [-0.52 + pr.range(-0.12, 0.12), 0.24 + pr.range(-0.08, 0.08), 1.0 + pr.range(-0.12, 0.15)];
        const pos = new Float32Array(NA * NR * 3), aN = new Float32Array(NA * NR), best = new Float32Array(NA), bestK = new Int32Array(NA);
        for (let i = 0; i < NA; i++) {
          const a = i / NA * TAU, sa = Math.sin(a), ca = Math.cos(a);
          let M = lerp(0.5, 1, smoothstep(-0.7, 0.3, ca)) * (0.6 + 0.4 * (0.5 + 0.5 * noise.fbm2(sa * 1.7 + o1, ca * 1.7, 3)));
          for (const ha of heroA) { let d = a - ha; d = Math.atan2(Math.sin(d), Math.cos(d)); M += 0.42 * Math.exp(-(d * d) / 0.02); }
          const foot = 1900 + 260 * noise.n2(sa * 2.3 + o2, ca * 2.3);
          for (let j = 0; j < NR; j++) {
            const t = j / (NR - 1), r = foot + 2300 * Math.pow(t, 1.15), x = sa * r, z = CZ - ca * r;
            const env = Math.pow(smoothstep(0, 0.55, t), 0.8) * (1 - 0.3 * smoothstep(0.7, 1, t));
            const rg = clamp(noise.ridged2(x * 0.00045 + o1, z * 0.00045 + o2, 4), 0, 1), fine = clamp(noise.ridged2(x * 0.0021 + o2, z * 0.0021, 2), 0, 1);
            const y = -25 + 1250 * M * env * (0.25 + 0.75 * rg) + 110 * fine * env, k = i * NR + j;
            pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; aN[k] = 0.5 + 0.5 * noise.n2(x * 0.004, z * 0.004 + o1);
            if (y > best[i]) { best[i] = y; bestK[i] = k; }
          }
          if (i % 60 === 59) await ctx.yield();
        }
        const idx = new Uint32Array(NA * (NR - 1) * 6); let q = 0;
        for (let i = 0; i < NA; i++) for (let j = 0; j < NR - 1; j++) { const a = i * NR + j, b = ((i + 1) % NA) * NR + j; idx[q++] = a; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b + 1; idx[q++] = a + 1; }
        const pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aN', new THREE.BufferAttribute(aN, 1)); pg.setIndex(new THREE.BufferAttribute(idx, 1));
        pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, CZ), 4700);
        const bank = look === 'fogbank', mid = look === 'midnight';
        const pm = new THREE.ShaderMaterial({
          side: THREE.DoubleSide,
          uniforms: {
            uSun: { value: sunDir.clone() }, uSunCol: { value: sky.lightColor.clone().multiplyScalar(mid ? 1.15 : 1.0) }, uAmb: { value: new THREE.Color(mid ? '#3f6fb4' : '#6fa6dc').multiplyScalar(mid ? 0.42 : 0.5) },
            uHazeCol: { value: fogCol.clone() }, uHaze: { value: new THREE.Vector3(mid ? 0.00013 : 0.0001, bank ? 340 : 240, bank ? 1 : 0.55) },
            uSnow: { value: new THREE.Color(PALETTE[2]).multiplyScalar(0.8) }, uRock1: { value: new THREE.Color('#161b21') }, uRock2: { value: new THREE.Color('#2b343a') },
          },
          vertexShader: /* glsl */`attribute float aN; varying vec3 vW; varying float vNz;
void main(){ vW = position; vNz = aN; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
          fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uAmb, uHazeCol, uHaze, uSnow, uRock1, uRock2; varying vec3 vW; varying float vNz;
void main(){
  vec3 dx = dFdx(vW), dy = dFdy(vW), c = cross(dx, dy);
  vec3 n = dot(c, c) > 1e-12 ? normalize(c) : vec3(0.0, 1.0, 0.0);
  if (n.y < 0.0) n = -n;
  float band = 0.5 + 0.5*sin(vW.y*0.021 + vNz*9.0);
  float rock = (1.0 - smoothstep(0.52, 0.68, n.y + (vNz - 0.5)*0.34 + band*0.1))*smoothstep(30.0, 220.0, vW.y + vNz*140.0);
  vec3 alb = mix(uSnow, mix(uRock1, uRock2, band*0.7 + vNz*0.3), rock);
  float ndl = max(dot(n, uSun), 0.0);
  vec3 col = alb*(uSunCol*ndl*1.05 + uAmb*(0.55 + 0.45*n.y));
  float d = length(vW - cameraPosition);
  float hz = max(1.0 - exp(-d*uHaze.x), (1.0 - smoothstep(uHaze.y*0.35, uHaze.y, vW.y))*uHaze.z);
  gl_FragColor = vec4(mix(col, uHazeCol, clamp(hz, 0.0, 1.0)), 1.0);
}`,
        });
        const peaks = new THREE.Mesh(pg, pm); peaks.name = 'peaks'; scene.add(peaks);
        // the three highest tops
        const order = Array.from({ length: NA }, (_, i) => i).filter((i) => Math.cos(i / NA * TAU) > -0.2).sort((a, b) => best[b] - best[a]);
        for (const i of order) {
          if (summits.length >= 3) break;
          if (summits.some((sm) => { const d = Math.abs(sm.i - i); return Math.min(d, NA - d) < 34; })) continue;
          const k = bestK[i]; summits.push({ i, x: pos[k * 3], y: pos[k * 3 + 1], z: pos[k * 3 + 2] });
        }
        await ctx.yield();
        // lenticular caps: a pile of thin lenses seated on each of those tops
        const parts = [], windYaw = 0.3;
        for (const sm of summits) {
          const w = rng.range(250, 340), n = rng.int(3, 4);
          for (let k = 0; k < n; k++) {
            const sc = [1, 0.84, 0.6, 0.36][k], sg = new THREE.SphereGeometry(1, 24, 10);
            sg.scale(w * sc, [46, 34, 26, 18][k], w * 0.62 * sc); sg.computeVertexNormals(); sg.rotateY(windYaw + rng.range(-0.08, 0.08));
            sg.translate(sm.x + w * 0.1 * k, sm.y - 34 + [0, 52, 92, 122][k], sm.z); sg.deleteAttribute('uv'); parts.push(sg);
          }
        }
        const lg = mergeGeometries(parts, false); parts.forEach((p) => p.dispose());
        const lm = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false,
          uniforms: { uSun: { value: sunDir.clone() }, uLit: { value: sky.cloudLit.clone().lerp(new THREE.Color('#ffffff'), 0.5).multiplyScalar(0.95) }, uShade: { value: fogCol.clone().lerp(new THREE.Color(PALETTE[0]), 0.4).multiplyScalar(0.9) }, uTime: time },
          vertexShader: /* glsl */`uniform float uTime; varying vec3 vN, vV, vP;
void main(){ vec3 p = position; p.y += sin(position.x*0.011 + uTime*0.25)*4.0 + sin(position.z*0.017 - uTime*0.19)*3.0;
  vN = normal; vV = cameraPosition - p; vP = position; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0); }`,
          fragmentShader: /* glsl */`uniform vec3 uSun, uLit, uShade; uniform float uTime; varying vec3 vN, vV, vP;
float lh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float ln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(lh(i), lh(i + vec2(1, 0)), f.x), mix(lh(i + vec2(0, 1)), lh(i + vec2(1, 1)), f.x), f.y); }
void main(){
  vec3 n = normalize(vN), V = normalize(vV); float e = abs(dot(n, V));
  vec2 q = vP.xz*0.006 + vec2(uTime*0.035, uTime*0.012);
  float nz = 0.6*ln(q) + 0.4*ln(q*2.7 + 5.0);
  float a = smoothstep(0.03, 0.6, e + (nz - 0.5)*0.3);
  float l = clamp(dot(n, uSun)*0.5 + 0.5, 0.0, 1.0), top = smoothstep(-0.35, 0.5, n.y);
  vec3 col = mix(uShade, uLit, clamp(0.3 + 0.5*top*l + 0.2*nz, 0.0, 1.0));
  col = mix(col, uLit, pow(1.0 - e, 1.6)*0.7);
  gl_FragColor = vec4(col, a*0.9);
}`,
        });
        const lens = new THREE.Mesh(lg, lm); lens.frustumCulled = false; lens.renderOrder = 1; scene.add(lens);
      }
    }
    await ctx.yield();

    // ---------- the colony headland, its fast ice, two red tents ----------
    const headH = (x, z) => {
      const dx = x - HEAD.x, dz = z - HEAD.z, rad = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
      const R = HEAD.r * (0.82 + 0.26 * noise.n2(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3)), t = clamp(1 - rad / R, 0, 1);
      return -3 + 92 * Math.pow(t, 0.85) * smoothstep(0, 0.3, t) * (0.55 + 0.55 * noise.ridged2(dx * 0.011 + 3, dz * 0.011, 3)) + 5 * smoothstep(0, 0.12, t);
    };
    {
      const NR = 18, NS = 60, pos = [], idx = [];
      for (let i = 0; i <= NR; i++) for (let j = 0; j < NS; j++) {
        const a = j / NS * TAU, rr = HEAD.r * 1.12 * Math.pow(i / NR, 0.85), x = HEAD.x + Math.cos(a) * rr, z = HEAD.z + Math.sin(a) * rr;
        pos.push(x, headH(x, z), z);
      }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, b, c, b, d, c); }
      let hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx); hg.computeVertexNormals();
      const nr = hg.attributes.normal, col = new Float32Array(nr.count * 3), c = new THREE.Color(), rock = new THREE.Color('#161b21'), rock2 = new THREE.Color('#2b343a'), lichen = new THREE.Color('#7c8a88'), snow = new THREE.Color(PALETTE[2]).multiplyScalar(0.8);
      for (let i = 0; i < nr.count; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], m = noise.fbm2(x * 0.05, z * 0.05, 3);
        c.copy(rock).lerp(rock2, 0.5 + 0.5 * m).lerp(lichen, smoothstep(0.35, 0.7, noise.n2(x * 0.09 + 9, z * 0.09)) * 0.35);
        c.lerp(snow, smoothstep(0.66, 0.84, nr.getY(i) + m * 0.12 + smoothstep(40, 80, y) * 0.1));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      hg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const head = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }));
      scene.add(head);
      // fast ice
      const s = soup(), SN = 56, white = new THREE.Color(PALETTE[2]).multiplyScalar(0.8).getStyle(), cy = new THREE.Color(PALETTE[3]).multiplyScalar(0.8).getStyle(), rim = [];
      for (let j = 0; j < SN; j++) { const a = j / SN * TAU, r = HEAD.shelf * (0.86 + 0.12 * noise.n2(Math.cos(a) * 2.2, Math.sin(a) * 2.2 + 4)); rim.push([HEAD.x + Math.cos(a) * r, HEAD.z + Math.sin(a) * r]); }
      for (let j = 0; j < SN; j++) {
        const a = rim[j], b = rim[(j + 1) % SN];
        s.tri([HEAD.x, 0.75, HEAD.z], [b[0], 0.7, b[1]], [a[0], 0.7, a[1]], white); s.quad([a[0], 0.7, a[1]], [b[0], 0.7, b[1]], [b[0], -0.6, b[1]], [a[0], -0.6, a[1]], cy);
      }
      // tents on the slope that faces the channel
      const tents = [], tentAt = [];
      for (const [ta, tr] of [[-0.12, 0.72], [0.2, 0.78]]) {
        const x = HEAD.x + Math.cos(ta) * HEAD.r * tr, z = HEAD.z + Math.sin(ta) * HEAD.r * tr, y = headH(x, z) - 0.3;
        tents.push(part(new THREE.CylinderGeometry(3.9, 3.9, 7.8, 3), red, x, y + 1.95, z, -Math.PI / 2, rng.range(0, 3), 0)); tentAt.push([x, y, z]);
      }
      {
        const fb = [], fq = [], fi = [], NF = 10, NS = 6, ta = -0.12;
        for (let f = 0; f < NF; f++) {
          const rr = HEAD.r * 0.72 + 9 + f * 6.6, a = ta + 0.05 * Math.sin(f * 0.9) + f * 0.012, x = HEAD.x + Math.cos(a) * rr, z = HEAD.z + Math.sin(a) * rr, y = Math.max(headH(x, z), 0.72) - 0.2, sd = rng();
          let v0 = fb.length / 3;
          for (const [sx, al] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { fb.push(x, y, z); fq.push(sx, al, 0, sd); }
          fi.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
          v0 = fb.length / 3;
          for (let k = 0; k <= NS; k++) for (const e of [1, -1]) { fb.push(x, y, z); fq.push(e, k / NS, 1, sd); }
          for (let k = 0; k < NS; k++) { const a0 = v0 + k * 2; fi.push(a0, a0 + 1, a0 + 2, a0 + 2, a0 + 1, a0 + 3); }
        }
        const fg = new THREE.BufferGeometry();
        fg.setAttribute('position', new THREE.Float32BufferAttribute(fb, 3)); fg.setAttribute('aQ', new THREE.Float32BufferAttribute(fq, 4)); fg.setIndex(fi);
        const uH = { value: 450 }, v2 = new THREE.Vector2();
        const fm = new THREE.ShaderMaterial({
          fog: true, side: THREE.DoubleSide,
          uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uRed: { value: new THREE.Color(red) }, uLight: { value: sky.lightColor.clone().multiplyScalar(look === 'overcast' ? 0.8 : 1) } }]),
          vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aQ; uniform float uTime, uH; varying float vK, vS;
void main(){
  vec4 mvPosition = viewMatrix*vec4(position, 1.0);
  float dist = max(1.0, -mvPosition.z), px = dist*2.0/(max(projectionMatrix[1][1], 0.1)*uH), H = 7.5;
  vK = aQ.z; vS = 0.0;
  if (aQ.z < 0.5) {
    mvPosition.xyz += (viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz*(aQ.y*H) + vec3(aQ.x*max(0.045, 0.8*px), 0.0, 0.0);
  } else {
    float L = max(3.4, 9.0*px), Hf = max(1.7, 4.5*px), sl = aQ.y, t = uTime*6.0 + aQ.w*30.0, wv = sin(sl*5.0 - t);
    vec3 w = position + vec3(0.0, H - 0.1, 0.0) + normalize(vec3(0.45, 0.0, -0.9))*(sl*L);
    w.y += (aQ.x*0.5 - 0.5)*Hf*(1.0 - 0.75*sl) + (wv*0.16 - sl*0.25)*sl*Hf;
    w += vec3(0.9, 0.0, 0.45)*(sin(sl*6.5 - t*1.15 + 1.0)*0.32*sl*L*0.3);
    mvPosition = viewMatrix*vec4(w, 1.0); vS = wv*sl;
  }
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
          fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uRed, uLight; varying float vK, vS;
void main(){
  vec3 col = vK < 0.5 ? vec3(0.02, 0.026, 0.03) : uRed*uLight*(0.8 + 0.22*vS);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`,
        });
        fm.uniforms.uTime = time; fm.uniforms.uH = uH;
        const flags = new THREE.Mesh(fg, fm); flags.frustumCulled = false; flags.name = 'flag-line'; scene.add(flags);
        updaters.push(() => { uH.value = ctx.renderer.getDrawingBufferSize(v2).y; });
      }
      const extra = new THREE.Mesh(merged([s.build(), ...tents]), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true, side: THREE.DoubleSide }));
      scene.add(extra);
      // the colony: impostors seething on the lower slopes and the fast ice
      const N = Math.round(2500 * density), aP = new Float32Array(N * 4);
      for (let i = 0, guard = 0; i < N && guard < N * 30; guard++) {
        const a = rng.range(-1.5, 1.9), rr = rng.range(0.45, 1.45) * HEAD.r, x = HEAD.x + Math.cos(a) * rr, z = HEAD.z + Math.sin(a) * rr, h = headH(x, z);
        if (h > 30 || (h > 1 && Math.abs(headH(x + 2, z) - h) + Math.abs(headH(x, z + 2) - h) > 2.6)) continue;
        if (noise.n2(x * 0.03 + 20, z * 0.03) < -0.25) continue;
        aP.set([x, Math.max(h, 0.72), z, rng()], i * 4); i++;
      }
      const cg = new THREE.InstancedBufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); cg.setIndex([0, 1, 2, 0, 2, 3]);
      cg.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); cg.instanceCount = N;
      const cm = new THREE.ShaderMaterial({
        fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWhite: { value: new THREE.Color(PALETTE[2]).multiplyScalar(0.8) } }]),
        vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aP; uniform float uTime; varying vec2 vUv;
void main(){
  vUv = position.xy; float sd = aP.w;
  vec3 c = aP.xyz; float act = smoothstep(0.0, 0.6, sin(uTime*0.4 + sd*60.0));
  c.xz += vec2(sin(uTime*0.5 + sd*40.0), cos(uTime*0.43 + sd*70.0))*0.9*act;
  vec3 toC = normalize(vec3(cameraPosition.x - c.x, 0.0, cameraPosition.z - c.z)), side = vec3(toC.z, 0.0, -toC.x);
  float lean = sin(uTime*5.0 + sd*90.0)*0.12*act;
  vec3 p = c + side*(position.x*0.34 + position.y*lean) + vec3(0.0, position.y*(0.95 + 0.25*sd), 0.0);
  vec4 mvPosition = viewMatrix*vec4(p, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
        fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uWhite; varying vec2 vUv;
void main(){
  float body = 1.0 - smoothstep(0.75, 1.0, length(vec2(vUv.x, (vUv.y - 0.45)*1.9)));
  if (body < 0.5) discard;
  float belly = step(length(vec2(vUv.x*1.5 + 0.1, (vUv.y - 0.36)*2.6)), 0.62);
  gl_FragColor = vec4(mix(vec3(0.012, 0.016, 0.022), uWhite, belly), 1.0);
  #include <fog_fragment>
}`,
      });
      cm.uniforms.uTime = time;
      const colony = new THREE.Mesh(cg, cm); colony.frustumCulled = false; scene.add(colony);
    }
    await ctx.yield();

    // ---------- penguins: one instanced mesh, four behaviours in the vertex shader ----------
    // mode 0 standing on a floe, 1 porpoising along the route, 2 rocketing out of the lead onto a floe, 3 tobogganing
    const uClock = { value: 0 };
    {
      const list = [], total = Math.round(1000 * density);
      const put = (home, hd, fc, mode, c) => list.push({ home, hd, fc, mode, c, sd: rng() });
      const onFloe = (fl, n, leapShare, t0) => {
        for (let i = 0; i < n; i++) {
          const a = rng.range(0, TAU), rr = Math.sqrt(rng()) * fl.r * 0.55, x = fl.x + Math.cos(a) * rr, z = fl.z + Math.sin(a) * rr, hd = rng.range(0, TAU);
          if (rng() < leapShare) {
            const edge = pathX(fl.z) - Math.sign(fl.x - pathX(fl.z)) * -5.2;
            put([x, fl.th, z], hd, [fl.x, fl.z], 2, [t0 + rng.range(0, 5.5), edge - x + rng.range(-1, 1), -fl.th - 0.5, rng.range(1, 5)]);
          } else put([x, fl.th, z], hd, [fl.x, fl.z], 0, [0, 0, 0, 0]);
        }
      };
      const uAtZ = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (kayakZ(m) > z) lo = m; else hi = m; } return lo; };
      stageFloes.forEach((fl, i) => onFloe(fl, Math.round(rng.range(12, 30) * density), i < 3 ? 0.65 : 0.25, Math.max(0.3, D * uAtZ(fl.z + 22))));
      onFloe(greetFloe, Math.round(26 * density), 0, 0);
      onFloe(sealFloe, 0, 0, 0);
      const nPorp = Math.round(190 * density), nTob = 48, L = 270;
      const cand = floeItems.filter((f) => f.kind === 0 && f.r > 4 && !f.y && Math.abs(f.x - pathX(f.z)) < 120 && f.z > 70 && f.z < 420 && f !== sealFloe && !stageFloes.includes(f));
      rng.shuffle(cand);
      for (const fl of cand) { if (list.length >= total - nPorp - nTob) break; if (rng() < 0.45) onFloe(fl, rng.int(3, 4 + Math.round(fl.r * 2)), 0, 0); }
      for (let i = 0, cl = 0; i < nPorp; i++) {
        if (i % 14 === 0) cl = rng.range(0, L);
        put([0, 0, 0], Math.PI, [0, 0], 1, [cl + rng.range(0, 16), rng.sign() * rng.range(2.7, 5.9), rng.range(0.34, 0.6), rng.range(0.94, 1.06)]);
      }
      for (let i = 0, f = 0, base = null; i < nTob; i++) {
        if (i % 8 === 0) { const a = rng.range(-1.2, 1.6), r = HEAD.shelf * rng.range(0.72, 0.8); base = { x: HEAD.x + Math.cos(a) * r, z: HEAD.z + Math.sin(a) * r, a: a + Math.PI / 2 + rng.range(-0.3, 0.3) }; f = 0; }
        const dx = Math.cos(base.a), dz = Math.sin(base.a); f += rng.range(1.2, 2.2);
        put([base.x + dx * f, 0.76, base.z + dz * f], Math.atan2(dx, dz), [0, 0], 3, [dx, dz, 26, rng.range(1.5, 1.9)]);
      }
      const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
      list.forEach((p, i) => { iA.set([...p.home, p.hd], i * 4); iB.set([p.fc[0], p.fc[1], p.mode, p.sd], i * 4); iC.set(p.c, i * 4); });
      const base = buildPenguinGeometry(species, late), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('color', base.attributes.color); g.setAttribute('aPt', base.attributes.aPt);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
      g.instanceCount = n;
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, WU, { uClock });
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\n${WAVE}\n${TILT_GLSL}\nattribute vec4 iA, iB, iC; attribute float aPt; uniform float uClock;`)
          .replace('#include <beginnormal_vertex>', `
vec3 pp = position, pn = normal; float sd = iB.w, mode = iB.z, tt = uCalvTime;
float hd = iA.w, pitch = 0.0, vis = 1.0; vec3 pbase = iA.xyz; vec2 pfc = iB.xy;
if (mode < 0.5 || (mode > 1.5 && mode < 2.5)) {
  float act = smoothstep(0.1, 0.7, sin(tt*0.37 + sd*50.0)), wad = sin(tt*6.5 + sd*40.0)*act;
  pp.xy = rot2(wad*0.14)*pp.xy;
  hd += 0.6*sin(tt*0.21 + sd*30.0) + wad*0.07;
  pbase.xz += vec2(sin(tt*0.13 + sd*17.0), cos(tt*0.11 + sd*29.0))*0.4*act;
  float flap = 0.2 + 0.8*act*max(0.0, sin(tt*2.3 + sd*70.0));
  if (mode > 1.5) {
    float tau = uClock - iC.x, f = clamp(tau/0.8, 0.0, 1.0);
    vis = step(0.0, tau);
    pitch = (1.0 - f)*(1.25 - 2.2*f);
    pbase += iC.yzw*(1.0 - f); pbase.y += 6.0*f*(1.0 - f) + 0.25*max(0.0, sin(clamp(tau - 0.8, 0.0, 1.2)*7.85))*exp(-(tau - 0.8)*2.0);
    hd = mix(atan(-iC.y, -iC.w), hd, smoothstep(0.8, 2.2, tau));
    flap = max(flap, 1.0 - smoothstep(0.8, 2.5, tau));
  }
  pp.x += aPt*flap*smoothstep(0.47, 0.2, pp.y)*0.15;
} else if (mode < 1.5) {
  float s = mod(iC.x + tt*10.5*iC.w, 270.0), z = 426.0 - s;
  float phs = s*0.5 + sd*6.2832;
  pbase = vec3(${KS}*(z - ${ARCH_Z}.0) - 17.0*smoothstep(272.0, 314.0, z) + 8.0*smoothstep(356.0, 392.0, z) + 4.0*smoothstep(204.0, 234.0, z)*(1.0 - smoothstep(256.0, 290.0, z)) + iC.y, iC.z*sin(phs) - 0.18, z);
  pitch = 1.5708 - atan(iC.z*0.5*cos(phs));
  hd = 3.14159 + ${CH_A.toFixed(4)}; pfc = pbase.xz;
  vis = smoothstep(166.0, 182.0, z)*(1.0 - smoothstep(417.0, 426.0, z));
  pp.x += aPt*0.1*smoothstep(0.47, 0.2, pp.y);
} else {
  pbase.xz += iC.xy*(mod(tt*iC.w + sd*3.0, iC.z) - iC.z*0.5);
  pitch = 1.42; pp.x += aPt*0.12*(0.5 + 0.5*sin(tt*7.0 + sd*30.0))*smoothstep(0.47, 0.2, pp.y);
  pbase.y += 0.12;
}
pp *= vis*(0.92 + 0.16*fract(sd*7.31));
pp.yz = rot2(pitch)*pp.yz; pn.yz = rot2(pitch)*pn.yz;
pp.xz = rot2(-hd)*pp.xz; pn.xz = rot2(-hd)*pn.xz;
vec3 pw = pbase + pp;
if (mode < 2.5) {
  if (mode < 0.5 || mode > 1.5) { vec3 c3 = vec3(pfc.x, 0.0, pfc.y); pw = calvTilt(pw - c3, calvN(pfc)) + c3; }
  pw.y += calvWave(pfc);
}
vec3 objectNormal = pn;`)
          .replace('#include <begin_vertex>', 'vec3 transformed = pw;');
      };
      const peng = new THREE.Mesh(g, mat); peng.frustumCulled = false; peng.name = 'penguins'; scene.add(peng);
      disposables.push(base);
    }
    await ctx.yield();

    // ---------- the ship (and what it needs: bow spray, exhaust, wake), the zodiac, the other kayak ----------
    const litCol = snowCol.clone().multiplyScalar(1.03), shadeCol = new THREE.Color(PALETTE[1]).multiplyScalar(0.8).lerp(new THREE.Color(PALETTE[3]), 0.1);
    const puffOpts = { rng, time, sunDir, lit: litCol, shade: shadeCol, dark: new THREE.Color('#55626b') };
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide });   // normals are baked: flat everywhere but the ship's shell
    boatMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBp = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBp;')
        // painted steel: welded plate seams (3 m by 1.5 m, staggered) and a slow value drift on anything red
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  float redK = smoothstep(0.1, 0.28, vColor.r - 1.6*vColor.g);
  vec2 pc = vec2(vBp.z/3.0 + floor(vBp.y/1.5)*0.37, vBp.y/1.5), pf = 0.5 - abs(fract(pc) - 0.5), pw = fwidth(vec2(vBp.z/3.0, vBp.y/1.5));
  float seam = max(1.0 - smoothstep(0.0, 1.0, pf.x/max(pw.x*1.5, 0.012)), 1.0 - smoothstep(0.0, 1.0, pf.y/max(pw.y*1.5, 0.022)));
  float fade = 1.0 - smoothstep(0.2, 0.5, max(pw.x, pw.y));
  float drift = sin(vBp.z*0.9 + sin(vBp.y*1.3)*1.7)*sin(vBp.y*2.1 + vBp.z*0.23);
  diffuseColor.rgb *= 1.0 - redK*(0.34*seam*fade - 0.05*drift);
}`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb*max(0.0, vColor.b - 1.0)*5.0;');   // lit window panes carry blue > 1
    };
    const ship = new THREE.Group(); ship.name = 'ship';
    await ctx.yield();
    ship.add(new THREE.Mesh(await buildShipGeometry(red, () => ctx.yield()), boatMat));
    await ctx.yield();
    {
      const pl = [];
      for (let i = 0; i < 26; i++) pl.push({ o: [rng.range(-0.4, 0.4), 18, -14], v: [rng.range(-0.8, 0.8), rng.range(1.6, 2.8), rng.range(-6.5, -4.5)], ph: i / 26, life: 8, s0: 1.1, s1: rng.range(6, 9), a: 0.42, c: 0.6 });
      for (let i = 0; i < 64; i++) { const sx = rng.sign(), zb = rng.range(19, 27); pl.push({ o: [sx * (0.4 + (27 - zb) * 0.42), 0.25, zb], v: [sx * rng.range(3.5, 7.5), rng.range(1.6, 4.2), rng.range(-4.5, -1.5)], ph: rng(), life: rng.range(0.8, 1.2), s0: 0.35, s1: rng.range(1.1, 2.3), a: 0.4, g: 1.1 }); }
      for (let i = 0; i < 20; i++) { const sx = rng.sign(); pl.push({ o: [sx * rng.range(4.5, 6.2), 0.3, rng.range(-24, 18)], v: [sx * rng.range(0.6, 1.8), rng.range(0.15, 0.5), rng.range(-3.5, -2)], ph: rng(), life: rng.range(1.4, 2.0), s0: 0.4, s1: rng.range(0.8, 1.4), a: 0.24 }); }
      for (let i = 0; i < 26; i++) pl.push({ o: [rng.range(-4, 4), 0.25, rng.range(-33, -29)], v: [rng.range(-1.2, 1.2), rng.range(0.2, 0.8), rng.range(-5, -3)], ph: rng(), life: rng.range(3.5, 5), s0: 2, s1: rng.range(5, 8), a: 0.42 });
      ship.add(makePuffs(pl, puffOpts).mesh);
    }
    ship.position.set(chanX(shipZ(0)), 0, shipZ(0)); ship.rotation.y = CH_A; scene.add(ship);
    await ctx.yield();
    let zod = null, kayak2 = null, paddle2 = null;
    if (zodiac) {
      zod = new THREE.Group(); zod.add(new THREE.Mesh(buildZodiacGeometry(red), boatMat));
      const pl = [];
      for (let i = 0; i < 22; i++) { const sx = rng.sign(); pl.push({ o: [sx * 0.9, 0.2, rng.range(-2.4, 1)], v: [sx * rng.range(1.5, 3.5), rng.range(1.2, 2.6), rng.range(-5, -3)], ph: rng(), life: rng.range(0.9, 1.5), s0: 0.4, s1: rng.range(1.2, 2.2), a: 0.7, g: 0.8 }); }
      zod.add(makePuffs(pl, puffOpts).mesh); scene.add(zod);
    }
    if (secondKayak) {
      kayak2 = new THREE.Group(); kayak2.add(new THREE.Mesh(buildKayakGeometry(red), boatMat));
      paddle2 = new THREE.Mesh(merged([cyl(0.02, 0.02, 2.2, 5, 0, 0, 0, '#11161a', 0, Math.PI / 2), box(0.42, 0.16, 0.02, 1.05, 0, 0, '#11161a'), box(0.42, 0.02, 0.16, -1.05, 0, 0, '#11161a')]), boatMat);
      paddle2.position.set(0, 0.78, -0.25); kayak2.add(paddle2); scene.add(kayak2);
    }
    const _v = new THREE.Vector3(), _t = new THREE.Vector3(), uHit = 0.5 + TL.hit / D;
    updaters.push((dt, t, cam, u) => {
      const zc = shipZ(u);
      ship.position.set(chanX(zc) + 0.4 * Math.sin(t * 0.21), 0.12 * Math.sin(t * 0.7) + hero.waveHeight(chanX(zc), zc) * 0.4, zc);
      ship.rotation.set(0.008 * Math.sin(t * 0.55), CH_A + 0.012 * Math.sin(t * 0.17), 0.012 * Math.sin(t * 0.43));
      if (zod) {
        const zz = zc - 72 + 3 * Math.sin(t * 0.3), zx = chanX(zz) + 7 + 1.2 * Math.sin(t * 0.37);
        zod.position.set(zx, hero.waveHeight(zx, zz) + 0.05 + 0.1 * Math.abs(Math.sin(t * 3.1)), zz);
        zod.rotation.set(-0.09 - 0.05 * Math.sin(t * 3.1), CH_A + 0.1 * Math.cos(t * 0.37), 0.04 * Math.sin(t * 2.3));
      }
      if (kayak2) {
        // ahead of us and a little to starboard, under the tower's line: 27 m ahead in the lead, about 21 m in the channel; it stops
        // paddling when the tower goes, turns half broadside and is the last thing the wave lifts before our own bow
        const L = path.length, a = u + (27 - (kayakDraw ? 4 : 7) * smoothstep(0.3, 0.5, u)) / L, fEnd = 1 - 38 / L;
        const f = a < fEnd - 0.06 ? a : fEnd - 0.06 * Math.exp(-(a - fEnd + 0.06) / 0.06), stop = smoothstep(fEnd - 0.07, fEnd + 0.02, a);
        const d = f * L, lat = 2.4 + 2.4 * smoothstep(0.3, 0.46, u) + 3.6 * stop;
        path.posAtDist(d, _v); path.tangentAtDist(d, _t);
        const kx = _v.x - lat * _t.z, kz = _v.z + lat * _t.x, yaw = Math.atan2(_t.x, _t.z) - 0.85 * stop + 0.05 * Math.sin(t * 2.2) * (1 - stop);
        const fx2 = Math.sin(yaw), fz2 = Math.cos(yaw), hh = hero.waveHeight(kx, kz), h2 = hero.waveHeight(kx + fx2 * 2, kz + fz2 * 2), h3 = hero.waveHeight(kx + fz2, kz - fx2);
        kayak2.position.set(kx, hh + 0.02, kz);
        kayak2.rotation.set(-Math.atan2(h2 - hh, 2), yaw, Math.atan2(h3 - hh, 1) * 0.8 + 0.05 * Math.sin(t * 1.3) * stop, 'YXZ');
        const pd = 1 - smoothstep(uHit - 0.11, uHit - 0.07, u);       // the paddle hangs, dripping, from the moment the tower starts to go
        paddle2.rotation.set(0.5 * Math.cos(t * 2.2) * pd + 0.12 * (1 - pd), 0, 0.55 * Math.sin(t * 2.2) * pd + 0.3 * (1 - pd));
      }
    });
    await ctx.yield();

    // ---------- orcas spy-hopping in their polynya, the seal on its floe ----------
    const orcaSpots = [];
    {
      const s = soup(), prof = [[-2.6, 0.72], [-1.2, 0.8], [0.2, 0.78], [1.1, 0.66], [1.8, 0.46], [2.25, 0.25], [2.5, 0.0]], S = 12, blk = '#07090c', wht = '#d9e2e6';
      const pt = (k, j) => { const a = j / S * TAU, [y, r] = prof[k]; return [Math.sin(a) * r, y, Math.cos(a) * r * 1.08 + (y > 0 ? y * 0.06 : 0)]; };
      const colOf = (a, b, c) => {
        const x = (a[0] + b[0] + c[0]) / 3, y = (a[1] + b[1] + c[1]) / 3, z = (a[2] + b[2] + c[2]) / 3, r = Math.hypot(x, z) || 1;
        if (z / r > 0.6 && y < 2.1) return wht;
        if (y > 0.9 && y < 1.7 && z / r > -0.1 && z / r < 0.55 && Math.abs(x) / r > 0.5) return wht;
        return blk;
      };
      for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < S; j++) {
        const a = pt(k, j), b = pt(k, j + 1), c = pt(k + 1, j + 1), d = pt(k + 1, j);
        s.tri(a, b, c, colOf(a, b, c)); if (k < prof.length - 2) s.tri(a, c, d, colOf(a, c, d));
      }
      const headG = s.build(), f = soup();
      for (const sx of [1, -1]) { const w = 0.07 * sx; f.tri([w, 0, 0.55], [0, 1.8, -0.3], [w, 0, -0.65], blk); f.tri([w, 0, 0.55], [w, 0, -0.65], [0, 1.8, -0.3], blk); }
      const hump = new THREE.SphereGeometry(1, 10, 6); hump.scale(0.55, 0.3, 2.3);
      const finG = merged([f.build(), part(hump, blk, 0, -0.12, 0)]);
      const om = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, flatShading: false, side: THREE.DoubleSide });
      const heads = new THREE.InstancedMesh(headG, om, 4), fins = new THREE.InstancedMesh(finG, om, 4);
      heads.frustumCulled = fins.frustumCulled = false; scene.add(heads, fins);
      const orcas = [];
      for (let i = 0; i < 4; i++) {
        // the two nearest the channel are up together while we look at them (u 0.38 .. 0.46); the others fill the gaps
        const a = [0.35, -0.75, 2.2, 3.9][i] + rng.range(-0.25, 0.25), r = i < 2 ? rng.range(5.5, 8) : rng.range(3, 7);
        orcas.push({ x: POLY.x + Math.cos(a) * r, z: POLY.z + Math.sin(a) * r, off: [1.0, 0.1, 5.4, 7.6][i] - D * 0.378 + rng.range(-0.15, 0.15), yaw: Math.atan2(chanX(292) - (POLY.x + Math.cos(a) * r), 292 - (POLY.z + Math.sin(a) * r)) + rng.range(-0.5, 0.5), fa: rng.range(0, TAU) });
        orcaSpots.push([orcas[i].x, orcas[i].z, orcas[i].off]);
      }
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), big = new THREE.Vector3(1.25, 1.25, 1.25);
      updaters.push((dt, t, cam, u) => {
        for (let i = 0; i < orcas.length; i++) {
          const o = orcas[i];
          const c = (((D * u + o.off) % 9.2) + 9.2) % 9.2, k = smoothstep(0, 1.3, c) * (1 - smoothstep(3.3, 4.6, c));
          p.set(o.x, (-5.3 + 5.25 * k) * 1.25 + hero.waveHeight(o.x, o.z) + 0.08 * Math.sin(t * 2 + i), o.z);
          q.setFromEuler(e.set(0.12 * Math.sin(t * 0.8 + i), o.yaw + 0.25 * Math.sin(t * 0.5 + i * 2), 0.06 * Math.sin(t * 1.1 + i)));
          heads.setMatrixAt(i, m4.compose(p, q, big));
          const fa = o.fa + t * 0.22, fr = 8.2 + 1.6 * Math.sin(t * 0.3 + i), fx2 = POLY.x + Math.cos(fa) * fr, fz = POLY.z + Math.sin(fa) * fr;
          p.set(fx2, hero.waveHeight(fx2, fz) - 0.15 - 1.5 * k - 0.55 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7)), fz);
          q.setFromEuler(e.set(0, -fa, 0.1 * Math.sin(t * 0.7 + i)));
          fins.setMatrixAt(i, m4.compose(p, q, one));
        }
        heads.instanceMatrix.needsUpdate = fins.instanceMatrix.needsUpdate = true;
      });
    }
    {
      const lathe = (pr, back, belly, spots) => {
        const g = new THREE.LatheGeometry(pr.map(([z, r]) => new THREE.Vector2(r, z)), 9); g.rotateX(Math.PI / 2); g.scale(1, 0.78, 1);
        const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), cb = new THREE.Color(back), cw = new THREE.Color(belly), cs = new THREE.Color('#1c2126');
        for (let i = 0; i < p.count; i++) {
          c.copy(cw).lerp(cb, smoothstep(-0.12, 0.12, p.getY(i)));
          if (spots && noise.n3(p.getX(i) * 7, p.getY(i) * 7, p.getZ(i) * 5) > 0.25) c.lerp(cs, 0.6);
          col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
        return g;
      };
      const back = crabeater ? '#aeb4b2' : '#39424a', belly = crabeater ? '#d5dad8' : '#b4bfc3';
      const sm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, side: THREE.DoubleSide });
      const seal = new THREE.Group(), body = new THREE.Mesh(lathe([[1.75, 0.03], [1.45, 0.16], [0.9, 0.3], [0.2, 0.44], [-0.5, 0.45], [-1.0, 0.34]], back, belly, !crabeater), sm);
      const neck = new THREE.Group(), headM = new THREE.Mesh(lathe([[-0.05, 0.33], [-0.4, 0.3], [-0.72, 0.24], [-0.95, 0.2], [-1.12, 0.12], [-1.2, 0.0]], back, belly, !crabeater), sm);
      neck.position.set(0, 0.02, -0.95); neck.add(headM); seal.add(body, neck);
      seal.rotation.y = -Math.PI / 2 + 0.35; scene.add(seal);
      updaters.push((dt, t, cam, u) => {
        const lift = smoothstep(0.02, 0.07, u) * (1 - smoothstep(0.2, 0.3, u)) * 0.75 + 0.25 * smoothstep(0.3, 0.9, Math.sin(t * 0.5));
        seal.position.set(sealFloe.x + 0.6, sealFloe.th + 0.3 + hero.waveHeight(sealFloe.x, sealFloe.z), sealFloe.z);
        neck.rotation.set(0.75 * lift, 0.45 * Math.sin(t * 0.6) * lift, 0);
        body.scale.y = 1 + 0.03 * Math.sin(t * 1.4);
      });
    }
    await ctx.yield();

    // ---------- snow petrels and skuas ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: rng.fork('fauna') });
    await ctx.yield();
    const whiteBird = { body: '#eef3f6', belly: '#ffffff', wingC: '#e6edf1', tip: '#dfe7ec', trail: '#eef3f6', head: '#f4f8fa', beak: '#1c2227', tailC: '#e9eff3' };
    const skua = { body: '#3b3d41', belly: '#55585c', wingC: '#34363a', tip: '#c9d2d6', trail: '#2c2e31', head: '#3b3d41', beak: '#16191c', tailC: '#2c2e31' };
    fauna.add(F.makeFlock({ rng: rng.fork('petrelA'), species: 'gulls', count: Math.round(22 * density), size: 0.9, palette: whiteBird, center: [-12, 15, 250], radius: 75, height: 9 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('petrelB'), species: 'gulls', count: Math.round(11 * density), size: 0.9, palette: whiteBird, along: { path, side: -7, up: 4.5, lead: 30, from: 0, to: 0.62, drift: 8 }, spread: [9, 3, 12] }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('petrelC'), species: 'gulls', count: Math.round(9 * density), size: 0.9, palette: whiteBird, cross: { path, u: 0.3, lead: 40, height: 7, angle: 70, side: 1, span: 260, duration: D } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('skua'), species: 'gulls', count: 10, size: 1.25, palette: skua, center: [-150, 24, 210], radius: 95, height: 12 }));
    await ctx.yield();

    // ---------- air: diamond dust (or snow), spindrift, blows, crest spray, the rare shooter ----------
    const snowing = look === 'overcast';
    const dust = snowing
      ? fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time, count: Math.round(2600 * density), velocity: [1.4, -1.1, 0.5] })
      : fx.makeParticles({ rng: rng.fork('dd'), preset: 'dust', time, count: Math.round(2200 * density), box: [46, 20, 46], size: [0.018, 0.05], colors: ['#ffffff', '#d4f1ff', '#f2fbff'], intensity: 2.6, twinkle: 0.9 });
    scene.add(dust.object);
    await ctx.yield();
    const wp = [], cliffY = hero.anchors.cliffTop.y;
    for (let i = 0; i < 46; i++) { const x = rng.range(-330, 330); wp.push({ o: [x, cliffY - rng.range(0, 14) * Math.abs(x) / 330 - 2, hero.wallZ(x) - rng.range(4, 14)], v: [rng.range(5, 9), rng.range(0.2, 1.2), rng.range(0.5, 2.5)], ph: rng(), life: rng.range(6, 9), s0: 4, s1: rng.range(12, 20), a: 0.2 }); }
    for (const b of bergs) for (let i = 0; i < 5; i++) wp.push({ o: [b.m.position.x + rng.range(-0.3, 0.3) * b.len, b.y0 * 2 + 9, b.m.position.z + rng.range(-0.3, 0.3) * b.wid], v: [rng.range(4, 7), 0.5, rng.range(0.5, 2)], ph: rng(), life: rng.range(5, 8), s0: 3, s1: rng.range(9, 14), a: 0.16 });
    const bl = [];
    for (const [ox, oz, off] of orcaSpots) for (let cyc = -2; cyc < 5; cyc++) for (let i = 0; i < 4; i++) {
      const t0 = cyc * 9.2 - off + 1.0 + i * 0.12;
      if (t0 > 0 && t0 < D) bl.push({ o: [ox, 2.9, oz], v: [rng.range(-0.5, 0.5), rng.range(2.5, 4), rng.range(-0.5, 0.5)], ph: t0, life: -rng.range(1.8, 2.6), s0: 0.3, s1: rng.range(2.4, 3.8), a: 0.5, g: 0.02, drag: 1.4 });
    }
    const blows = makePuffs(bl, puffOpts); scene.add(blows.mesh);
    await ctx.yield();
    updaters.push((dt, t, cam, u) => { blows.clock.value = D * u; });
    for (const sm of summits) for (let i = 0; i < 9; i++) wp.push({ o: [sm.x + rng.range(-70, 70), sm.y - rng.range(15, 110), sm.z + rng.range(-70, 70)], v: [rng.range(16, 26), rng.range(1, 5), rng.range(2, 8)], ph: rng(), life: rng.range(12, 18), s0: 30, s1: rng.range(110, 190), a: 0.34 });
    let shooter = null; const tShoot = TL.hit + 2.6, shootAt = new THREE.Vector3();
    if (rare) {
      const sx = imp.x + rng.range(40, 58), sz = imp.z + rng.range(8, 16);   // to starboard of the fall, clear of the portal's line
      const sg = hero.kit.makeIceBlock(26, 46, 22, { amp: 2.2, seg: 3.2, weathered: () => 0 });
      const shMat = hero.kit.makeIceMaterial({ detail: 0.9 }); shMat.emissive = new THREE.Color(PALETTE[4]); shMat.emissiveIntensity = 0;
      shooter = new THREE.Mesh(sg, shMat); shooter.position.set(sx, -60, sz); shooter.visible = false; scene.add(shooter); shootAt.set(sx, 14, sz);
      for (let i = 0; i < 46; i++) { const a = i / 46 * TAU + rng.range(-0.1, 0.1), vr = rng.range(9, 15); wp.push({ o: [sx + Math.cos(a) * 15, 0, sz + Math.sin(a) * 15], v: [Math.cos(a) * vr, rng.range(5, 12), Math.sin(a) * vr], ph: tShoot + 0.9 + rng.range(0, 0.6), life: -rng.range(4, 6.5), s0: 5, s1: rng.range(12, 20), a: 0.55, g: 0.7, grp: 2, drag: 0.25 }); }
      shooter.userData = { x: sx, z: sz, ax: rng.range(-0.5, 0.5), az: rng.range(0.5, 0.9) * rng.sign() };
      for (let i = 0; i < 70; i++) { const a = rng.range(0, TAU), vr = rng.range(2, 12); wp.push({ o: [sx + Math.cos(a) * 8, 0, sz + Math.sin(a) * 8], v: [Math.cos(a) * vr, rng.range(16, 42), Math.sin(a) * vr], ph: tShoot + rng.range(0, 0.9), life: -rng.range(5, 8), s0: 4, s1: rng.range(10, 18), a: 0.6, g: 1, grp: 2, drag: 0.2 }); }
    }
    const worldPuffs = makePuffs(wp, puffOpts); scene.add(worldPuffs.mesh);
    await ctx.yield();
    const cp = [];
    for (let i = 0; i < 90; i++) { const x = rng.range(-80, 80); cp.push({ o: [x, 0.3, -x * x / 520 + rng.range(-2, 2)], v: [rng.range(-1, 1), rng.range(2.5, 5), rng.range(-5, -1.5)], ph: rng(), life: rng.range(1.1, 1.8), s0: 1.6, s1: rng.range(8, 14), a: 0.6, g: 0.5 }); }
    const crest = makePuffs(cp, puffOpts); crest.amp.x = 0; scene.add(crest.mesh);
    await ctx.yield();
    // the whiteout on the crest: a veil of blown spray (never a blank card: streaks race through it, the sky shows
    // at the top) with fast spray flying at the lens, drawn over it
    const veilU = { uW: { value: 0 }, uCol: { value: snowCol.clone().multiplyScalar(1.05) }, uSky: { value: sky.zenithColor.clone().lerp(fogCol, 0.45) }, uTime: time };
    const veil = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 12), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: THREE.BackSide, uniforms: veilU,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform float uW, uTime; uniform vec3 uCol, uSky; varying vec3 vD;
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(vh(i), vh(i + vec2(1, 0)), f.x), mix(vh(i + vec2(0, 1)), vh(i + vec2(1, 1)), f.x), f.y); }
void main(){
  vec3 d = normalize(vD); float up = d.y, az = atan(d.x, -d.z - 1.0e-4);
  float s1 = vn(vec2(az*5.0 + uTime*2.4, up*22.0 - uTime*5.0)), s2 = vn(vec2(az*13.0 - uTime*3.1, up*64.0 - uTime*11.0));
  float st = 0.6*s1 + 0.4*s2;
  float a = uW*(0.52 - 0.32*smoothstep(0.1, 0.8, up))*(0.05 + 0.95*smoothstep(0.38, 0.78, st));
  gl_FragColor = vec4(mix(uCol, uSky, smoothstep(0.2, 0.95, up)*0.55)*(0.7 + 0.45*st)*(1.0 + 0.14*smoothstep(0.1, -0.4, up)), a);
}`,
    }));
    veil.renderOrder = 60; veil.visible = false; veil.frustumCulled = false; scene.add(veil);
    const wo = [];
    for (let i = 0; i < 80; i++) wo.push({ o: [rng.range(-10, 10), rng.range(-2.5, 6.5), rng.range(-17, -4)], v: [rng.range(-2.5, 2.5), rng.range(0.5, 3.5), rng.range(9, 17)], ph: rng(), life: rng.range(0.6, 1.0), s0: 0.5, s1: rng.range(1.8, 4.2), a: 0.5, c: rng.range(0, 0.55) });
    const lash = makePuffs(wo, { ...puffOpts, lit: litCol.clone().multiplyScalar(1.3), shade: shadeCol.clone().multiplyScalar(1.3), dark: shadeCol.clone().multiplyScalar(0.9) }); lash.amp.x = 0; lash.mesh.renderOrder = 61; lash.mesh.material.depthTest = false; scene.add(lash.mesh);
    await ctx.yield();

    // ---------- the flight ----------
    const A = hero.anchors, gaze = new THREE.Vector3(), g2 = new THREE.Vector3();
    const pois = [
      { at: (t, u) => gaze.set(chanX(shipZ(u)) + 2, 8.5, shipZ(u) + 8), from: 0.045, to: 0.28, weight: 0.5 },
      { at: [POLY.x, 1.6, POLY.z], from: 0.36, to: 0.5, weight: 0.5 },
      { at: (t, u) => {
        if (u < uHit - 0.02) return g2.copy(A.towerTop).lerp(A.impact, smoothstep(0.6, uHit - 0.02, u) * 0.6);
        // up the splash column, then back down onto the white line that comes on across the bay
        g2.copy(A.impact).lerp(A.splashTop, 0.45 * smoothstep(uHit - 0.02, uHit + 0.06, u) * (1 - 0.72 * smoothstep(uHit + 0.06, uCrest - 0.03, u)));
        if (shooter) { const ts = D * (u - 0.5) - tShoot; g2.lerp(shootAt, 0.3 * smoothstep(-0.3, 0.4, ts) * (1 - smoothstep(2.4, 3.4, ts))); }
        return g2;
      }, from: 0.5, to: uCrest - 0.012, weight: 0.75 },
      { at: [0, 30, ARCH_Z - 60], from: uCrest - 0.015, to: uCrest + 0.02, weight: 0.8 },
      { at: [0, 5, ARCH_Z], from: uCrest + 0.02, to: 0.975, weight: 0.6 },
    ];
    const fog = scene.fog, fogNow = new THREE.Color();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: D,
      title: { noon: 'The Calving', midnight: 'The Calving: Midnight Sun', overcast: 'The Calving: Snow Light', fogbank: 'The Calving: Fog Bank' }[look],
      ride: 'kayak-bow', style: 'none',
      camera: { fov: 47, near: 0.3, far: 6500, lookAhead: 14, sway: 0.25, bank: 0.25, nearThrough: 0.3 },   // nearThrough: the sea and floes in front of the entry show in the lower half of the previous portal
      pois,
      portal: { shape: 'circle', radius: 6, color: PALETTE[1], glow: 0.3, revealDistance: 44 },
      post: {
        exposure: look === 'overcast' ? 1.02 : look === 'midnight' ? 0.98 : 0.92,
        bloom: { strength: 0.42, radius: 0.6, threshold: 0.92 },
        grade: { saturation: look === 'overcast' ? 1.18 : 1.08, contrast: 1.08, tint: look === 'midnight' ? '#fbfbf2' : '#f1f9ff', shadowTint: '#03121c', vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        const T = evAt(u);
        hero.setEventTime(T); hero.setArchProgress(Math.max(0, D * (u - uCrest) + 0.45) / TL.archLength); hero.update(dt, t, camera);
        uClock.value = D * u;
        for (const f of updaters) f(dt, t, camera, u);
        sky.update(dt, t, camera); rig.update(dt, t, camera); fauna.update(dt, t, camera, u); dust.update(dt, t, camera);
        dust.setOpacity(snowing ? 0.85 : 0.25 + 0.75 * smoothstep(0.4, 0.62, u));
        // tabular bergs rock ponderously as the ring passes
        for (const b of bergs) {
          const x = b.m.position.x, z = b.m.position.z, h = hero.waveHeight(x, z), dx = hero.waveHeight(x + 40, z) - hero.waveHeight(x - 40, z), dz = hero.waveHeight(x, z + 40) - hero.waveHeight(x, z - 40);
          b.m.position.y = b.y0 + h * 0.35 + 0.25 * Math.sin(t * 0.33 + b.ph);
          b.m.rotation.set(dz / 80 * 0.5 + 0.006 * Math.sin(t * 0.27 + b.ph), b.yaw, -dx / 80 * 0.5 + 0.008 * Math.sin(t * 0.21 + b.ph * 2));
        }
        // spray torn off the advancing crest
        const R = Math.max(0, T - TL.hit) * TL.waveSpeed, cz = imp.z + R;
        camera.getWorldPosition(_v);
        crest.mesh.position.set(imp.x, hero.waveHeight(imp.x, cz), cz);
        crest.mesh.scale.x = Math.sqrt(clamp(R, 30, 400) / 260);      // the line of puffs keeps the ring's curvature as it widens
        crest.amp.x = smoothstep(25, 45, R) * (1 - smoothstep(300, 380, R));
        worldPuffs.clock.value = T;
        if (shooter) {
          const tau = T - tShoot, d = shooter.userData; shooter.visible = tau > 0;
          if (tau > 0) {
            const up = tau < 1.9 ? lerp(-46, 16, 1 - Math.pow(1 - tau / 1.9, 2.2)) : -8 + 24 * Math.exp(-0.5 * (tau - 1.9)) * Math.cos(1.15 * (tau - 1.9));
            shooter.material.emissiveIntensity = 0.4 * (1 - smoothstep(1.2, 2.6, tau));
            shooter.position.set(d.x, up + hero.waveHeight(d.x, d.z) * 0.5, d.z);
            shooter.rotation.set(d.ax * (1 - Math.exp(-0.35 * tau)) * 1.6, 0.2 * tau * Math.exp(-0.15 * tau), d.az * (1 - Math.exp(-0.28 * Math.max(0, tau - 1.2))) * 1.5);
          }
        }
        // fog: the bank that the fall tears open, and the one-second whiteout on the crest
        const w = smoothstep(uCrest - 0.010, uCrest + 0.002, u) * (1 - smoothstep(uCrest + 0.005, uCrest + 0.013, u));
        const base = look === 'fogbank' ? lerp(fogBase, 0.0011, smoothstep(uHit - 0.01, uHit + 0.09, u)) : fogBase;
        fog.density = base + w * 0.002;
        fog.color.copy(fogNow.copy(fogCol).lerp(snowCol, w));
        veil.visible = w > 0.004; veilU.uW.value = w; veil.position.copy(_v);
        lash.amp.x = w * 0.6; lash.mesh.position.copy(_v);
      },
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};
