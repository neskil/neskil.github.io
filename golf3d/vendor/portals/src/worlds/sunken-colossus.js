// THE SUNKEN COLOSSUS: a sunlit lagoon of white sand, 26 m deep, where a reef has grown over the toppled statue of a
// forgotten giant. The way out is a portal resting in the palm of its open hand.
//
// World space = the idol's local space lowered by 26 m: sea surface at y = 0, sand at y = -26. The idol lies along X
// (feet +110, head -50, fingertips -119) with its face and open hand toward +Z. A sand bay lies on that side; a reef
// crest and a wall falling into cobalt water bound it to the north (+Z) and wrap round beyond the hand (-X).
// Flight (about 290 m, heading south toward the feet, then west along the body):
//   0.00 entry: over rippled sand and sea-grass beds through a pair of fluted columns; dead ahead the idol's soles, 14 m
//        tall, gold on their rims and toes
//   0.20 the turn at the feet: the two legs lying one on the other, bronze greaves and kneecaps rimmed with gold
//   0.30 low along the flank, 10 to 14 m off, down the aisle between the colonnade and the body; manta rays come over
//   0.60 the swing out past the folded arm: mask, its breath of bubbles, and the hand with the portal in one frame
//   0.80 eye to eye with the mask at 18 m, the shoal pouring from its hollow eye; then the last 62 m straight and level
//        along the forearm into the portal cupped in the hand
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { buildHero, COLOSSUS_GLSL } from '../parts/sunken-colossus.js';

const PALETTE = ['#c9fff2', '#39c6d6', '#1487b8', '#0b4f86', '#e9dcb8', '#ff6f61', '#ffd447'];
const FL = -26;                         // lagoon floor; the sea surface is y = 0

// ------------------------------------------------------------------ sea bed material: sand + reef rock + old marble
// Uses the idol's own light model (same sun, sky, bounce and caustic web) and repeats its sand recipe exactly, so the
// world's sea bed continues the idol's sand apron without a seam. Fog is done here: toward the lagoon it is the
// scene's turquoise, down the wall it deepens to cobalt.
const SEABED_VERT = /* glsl */`
attribute vec2 aLit; attribute vec2 aMat;
varying vec3 vW; varying vec3 vN; varying vec2 vLit; varying vec2 vMat; varying float vDepth;
void main() {
  vLit = aLit; vMat = aMat;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const SEABED_FRAG = /* glsl */`
${COLOSSUS_GLSL}
uniform vec3 uSand, uStone, uReefRock, uReefA, uReefB, uReefC, uFogCol, uDeepCol;
uniform float uFogDens, uFloor;
varying vec3 vW; varying vec3 vN; varying vec2 vLit; varying vec2 vMat; varying float vDepth;
void main() {
  vec3 N = normalize(vN);
  float dist = length(cameraPosition - vW), lod = 1.0 - smoothstep(50.0, 190.0, dist);
  // sand: wind-row ripples, grain, pale and blue-grey patches
  float w = fbm(vec3(vW.xz * 0.05, 1.0));
  float r1 = sin((vW.x * 0.94 + vW.z * 0.34) * 3.6 + w * 16.0 + sin(vW.z * 0.21) * 1.5);
  r1 = r1 * (0.6 + 0.4 * r1 * r1);
  float grain = vnoise(vec3(vW.xz * 2.1, 3.0));
  vec3 alb = uSand * (0.84 + 0.12 * fbm(vec3(vW.xz * 0.4, 9.0)) + 0.05 * r1 * lod);
  alb = mix(alb, alb * vec3(0.8, 0.9, 0.93), smoothstep(0.45, 0.75, fbm(vec3(vW.xz * 0.018, 4.0))) * 0.3);
  float h = (0.05 * r1 + 0.025 * grain) * lod, sandy = 1.0;
  if (vMat.x + vMat.y > 0.002) {
    // reef rock: knobbly limestone under a quilt of encrusting coral (pink, lilac, ochre), darker in the crevices
    float m1 = fbm(vW * 0.17 + 3.0), m2 = vnoise(vW * 0.85), m3 = vnoise(vW * 3.3);
    vec3 rc = mix(uReefRock, uReefA, smoothstep(0.5, 0.66, m1) * 0.55);
    rc = mix(rc, uReefB, smoothstep(0.54, 0.72, vnoise(vW * 0.12 + 31.0)) * 0.5);
    rc = mix(rc, uReefC, smoothstep(0.66, 0.82, vnoise(vW * 0.26 + 57.0)) * 0.4);
    rc *= (0.62 + 0.5 * m2) * (0.8 + 0.4 * m3) * (1.0 - 0.3 * lod * smoothstep(0.6, 0.3, vnoise(vW * 5.3 + 7.0)));
    float hr = m2 * 0.4 + m3 * 0.1;
    float reef = smoothstep(0.3, 0.7, vMat.x + (m2 - 0.5) * 0.5) * (1.0 - vMat.y);
    alb = mix(alb, rc, reef); h = mix(h, hr * (0.35 + 0.65 * lod), reef); sandy = 1.0 - reef;
    if (vMat.y > 0.5) {
      // marble: warm and pale, a few veins running with the shaft, crust where the reef has taken hold
      float vein = abs(vnoise(vW * vec3(1.1, 0.3, 1.1) + 11.0) - 0.5);
      vec3 mb = uStone * (0.86 + 0.18 * fbm(vW * 0.8)) * (0.88 + 0.12 * smoothstep(0.0, 0.06, vein));
      float crust = smoothstep(0.55, 0.8, m1 * 0.55 + vMat.x * 0.75 + N.y * 0.18 + (m2 - 0.5) * 0.3 + (m3 - 0.5) * 0.12);
      vec3 cc = mix(rc * 1.25, mix(uReefA, uReefB, smoothstep(0.3, 0.7, vnoise(vW * 0.6 + 21.0))) * (0.75 + 0.5 * m3), 0.55);   // coralline pink and lilac over the limestone
      alb = mix(mb, cc, crust); h = m3 * 0.025 + crust * hr * 0.3; sandy = 0.0;
    }
  }
  N = bumpN(N, vW, h, 1.0);
  float caus;
  vec3 lgt = seaLight(N, vW, vLit.x, vLit.y, dist, caus);
  // under water light arrives from every side: walls and flanks are filled by the bright water and the sand
  // (old marble takes less of it, and more on the flank that faces the sun, so a shaft has a lit and a shaded side)
  vec2 sd = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float mar = step(0.5, vMat.y), side = 0.5 + 0.5 * dot(N.xz, sd);
  lgt += (1.0 - sandy) * mix(1.0, 0.32 + 0.6 * side, mar) * vLit.x * (uSkyCol * (0.85 + 0.65 * N.y) + uBounceCol * 0.8 * (1.0 - N.y) + uSunCol * 0.2 * (0.3 + caus));
  lgt += mar * uSunCol * 0.34 * side * side * vLit.x * (0.6 + 0.6 * caus);
  vec3 col = alb * lgt;
  col += uSunCol * step(0.975, vnoise(vec3(vW.xz * 7.0, floor(uTime * 2.0)))) * caus * 0.5 * lod * vLit.y * sandy;
  // light dies and turns blue down the wall
  float deep = smoothstep(uFloor - 3.0, uFloor - 50.0, vW.y);
  col *= mix(vec3(1.0), vec3(0.2, 0.42, 0.72), deep);
  vec3 dir = (vW - cameraPosition) / dist;
  vec3 fc = mix(uFogCol, uDeepCol, smoothstep(uFloor - 3.0, uFloor - 26.0, vW.y) * smoothstep(-0.02, -0.32, dir.y));
  float f = 1.0 - exp(-uFogDens * uFogDens * vDepth * vDepth);
  gl_FragColor = vec4(mix(col, fc, f), 1.0);
}`;

// ------------------------------------------------------------------ geometry accumulator (position, aLit, aMat)
const _p = new THREE.Vector3();
function makeAcc() { return { pos: [], lit: [], mat: [], idx: [], n: 0 }; }
function pushV(acc, M, x, y, z, ao, reef, marble, sh = 1) {
  _p.set(x, y, z); if (M) _p.applyMatrix4(M);
  acc.pos.push(_p.x, _p.y, _p.z); acc.lit.push(ao, sh); acc.mat.push(reef, marble);
  return acc.n++;
}
function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  g.setAttribute('aLit', new THREE.Float32BufferAttribute(acc.lit, 2));
  g.setAttribute('aMat', new THREE.Float32BufferAttribute(acc.mat, 2));
  g.setIndex(acc.idx); g.computeVertexNormals();
  return g;
}
// A fluted shaft along +Y of its own frame, y0..y1, radius R. Twenty concave flutes meeting at sharp arrises, a crisp
// drum joint every 2.3 m, the top snapped off on a slant (o.broken) or sawn flat, dark at the foot, reef crust thickening upward.
function addFluted(acc, M, R, y0, y1, o) {
  const rng = o.rng, noise = o.noise, flutes = 20, N = flutes * 2, H = y1 - y0, base = acc.n;
  const seed = rng.range(0, 90), tiltA = rng() * 6.283, tiltK = o.broken ? rng.range(0.3, 0.8) : 0, crust = o.crust ?? 0.3;
  const topAt = (th) => (o.broken ? y1 - R * tiltK * (0.5 + 0.5 * Math.cos(th - tiltA)) - 0.15 * R * Math.abs(noise.n2(Math.cos(th) * 1.7 + seed, Math.sin(th) * 1.7)) : y1);
  const topMin = o.broken ? y1 - R * tiltK - 0.15 * R - 0.25 : y1;
  const ys = [[y0, 0]];                                        // rings at fixed heights: [y, joint]; the last ring follows the break
  for (let y = y0 + 1.15; y < topMin - 0.5; y += 1.15) ys.push([y, 0]);
  if (o.broken) {
    for (const y of [0.1, 0.75]) if (y < topMin - 0.3) ys.push([y, 0]);
    for (let y = 2.3; y < topMin - 0.6; y += 2.3) ys.push([y - 0.11, 0], [y, 1], [y + 0.11, 0]);
  }
  ys.sort((a, b) => a[0] - b[0]);
  const rings = ys.length;
  const rad = (ph, t, joint) => R * (1 - 0.025 * t) - 0.13 * R * Math.sin(Math.PI * ph) - joint * 0.07;
  for (let j = 0; j <= rings; j++) {
    const top = j === rings, joint = top ? 0 : ys[j][1];
    for (let i = 0; i <= N; i++) {
      const th = ((i % N) / N) * 6.28318, ph = (i % 2) / 2, y = top ? topAt(th) : ys[j][0], t = clamp((y - y0) / H, 0, 1), r = rad(ph, t, joint);
      const ao = (o.broken ? 0.35 + 0.65 * smoothstep(0.1, 1.6, y) : 0.9) * (1 - 0.5 * joint) * (1 - 0.45 * Math.sin(Math.PI * ph));
      const cr = clamp(crust * (0.45 + 1.4 * smoothstep(0.4, 1, t)) + 0.3 * noise.n2(th * 2 + seed, y * 0.4), 0, 1);
      pushV(acc, M, Math.cos(th) * r, y, Math.sin(th) * r, ao, cr, 1);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < N; i++) { const a = base + j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; acc.idx.push(a, c, b, b, c, d); }
  // top: outer ring (hard edge), a rubble ring, the core
  const o0 = acc.n, topCr = clamp(crust * 1.2, 0, 1); let mean = 0;
  for (let i = 0; i <= N; i++) { const th = ((i % N) / N) * 6.28318; mean += topAt(th) / (N + 1); }
  for (let i = 0; i <= N; i++) { const th = ((i % N) / N) * 6.28318, r = rad((i % 2) / 2, 1, 0); pushV(acc, M, Math.cos(th) * r, topAt(th), Math.sin(th) * r, 0.95, topCr, 1); }
  const m0 = acc.n;
  for (let i = 0; i <= N; i++) {
    const th = ((i % N) / N) * 6.28318, r = R * 0.52, k = o.broken ? 0.2 * R * noise.n2(Math.cos(th) * 2.3 + seed + 9, Math.sin(th) * 2.3) : 0;
    pushV(acc, M, Math.cos(th) * r, lerp(topAt(th), mean, 0.5) + k * 0.5, Math.sin(th) * r, 0.85, topCr, 1);
  }
  const c0 = pushV(acc, M, 0, mean + (o.broken ? 0.12 * R * noise.n2(seed, 4.4) : 0), 0, 0.8, topCr, 1);
  for (let i = 0; i < N; i++) acc.idx.push(o0 + i, m0 + i, o0 + i + 1, o0 + i + 1, m0 + i, m0 + i + 1, m0 + i, c0, m0 + i + 1);
  if (o.cap0) {
    const b0 = acc.n;
    for (let i = 0; i <= N; i++) { const th = ((i % N) / N) * 6.28318, r = rad((i % 2) / 2, 0, 0); pushV(acc, M, Math.cos(th) * r, y0, Math.sin(th) * r, 0.7, crust, 1); }
    const cb = pushV(acc, M, 0, y0, 0, 0.75, crust, 1);
    for (let i = 0; i < N; i++) acc.idx.push(b0 + i, b0 + i + 1, cb);
  }
}
// a weathered block (plinth), 3 x 3 quads per face so the crust mask has something to bite
function addBlock(acc, M, sx, sy, sz, crust) {
  const F6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], n = 3;
  for (const [nx, ny, nz] of F6) {
    const ux = ny, uy = nz, uz = nx, vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux, base = acc.n;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const a = (i / n) * 2 - 1, b = (j / n) * 2 - 1, x = (nx + ux * a + vx * b) * sx * 0.5, y = (ny + uy * a + vy * b) * sy * 0.5, z = (nz + uz * a + vz * b) * sz * 0.5;
      pushV(acc, M, x, y, z, 0.55 + 0.4 * (ny > 0 ? 1 : 0.4 + 0.3 * (y / sy + 0.5)), crust * (ny > 0 ? 1.6 : 0.8), 1);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; acc.idx.push(a, b, c, b, d, c); }
  }
}
// a coral head: a rounded knoll draped over the sea bed (heights come from the same function the scatter uses)
function addBommie(acc, b, baseAt) {
  const rings = 10, segs = 24, base = acc.n;
  pushV(acc, null, b.x, baseAt(b.x, b.z) + b.at(b.x, b.z), b.z, 1, 1, 0);
  for (let i = 1; i <= rings; i++) for (let j = 0; j < segs; j++) {
    const rr = b.r * 1.07 * Math.pow(i / rings, 0.8), a = (j / segs) * 6.28318, x = b.x + Math.cos(a) * rr, z = b.z + Math.sin(a) * rr, hb = b.at(x, z);
    pushV(acc, null, x, baseAt(x, z) + hb - (i === rings ? 0.6 : 0), z, 0.42 + 0.58 * smoothstep(0, b.h * 0.55, hb), 1, 0);
  }
  for (let j = 0; j < segs; j++) acc.idx.push(base, base + 1 + ((j + 1) % segs), base + 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const p = base + 1 + (i - 1) * segs + j, p1 = base + 1 + (i - 1) * segs + ((j + 1) % segs), q = p + segs, q1 = p1 + segs;
    acc.idx.push(p, p1, q, p1, q1, q);
  }
}
// a drift of sand banked round something half buried: a low mound draped over the sea bed, its rim sunk out of sight
function addDrift(acc, x, z, r0, r1, hgt, baseAt, shadeAt, seed, noise) {
  const rings = 5, segs = 16, base = acc.n;
  for (let i = 0; i <= rings; i++) for (let j = 0; j < segs; j++) {
    const a = (j / segs) * 6.28318, k = i / rings, r = (r0 * 0.5 + (r1 - r0 * 0.5) * k) * (1 + 0.22 * noise.n2(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3)), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    const sh = shadeAt(px, pz);
    pushV(acc, null, px, baseAt(px, pz) + hgt * (1 - smoothstep(r0, r1, r)) * (0.75 + 0.35 * noise.n2(px * 0.5 + seed, pz * 0.5)) - (i === rings ? 0.3 : 0), pz, 0.55 + 0.45 * sh, 0, 0, sh);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const p = base + i * segs + j, p1 = base + i * segs + ((j + 1) % segs), q = p + segs, q1 = p1 + segs; acc.idx.push(p, p1, q, p1, q1, q); }
}
// grid lines: `step` apart inside [lo, hi], then growing cells out to `far` (a skirt that reaches into the fog)
function gridAxis(lo, hi, step, far) {
  const out = [], grow = [];
  for (let d = step * 1.5, s = step * 1.5; d < far; s *= 1.6, d += s) grow.push(d);
  grow.push(far);
  for (let i = grow.length - 1; i >= 0; i--) out.push(lo - grow[i]);
  for (let v = lo; v <= hi + 0.01; v += step) out.push(v);
  for (let i = 0; i < grow.length; i++) out.push(hi + grow[i]);
  return out;
}

export default {
  id: 'sunken-colossus',
  name: 'The Sunken Colossus',
  category: 'ocean',
  weirdness: 0.2,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---------------------------------------------------------------- per-seed character
    const mood = rng.pick(['noon', 'afternoon', 'milk', 'deep-clear']);
    const M = {
      // high blazing sun, clear turquoise water
      noon:      { el: [1.2, 1.42], water: '#2bb6cc', deep: '#0a4c8a', dens: [0.0044, 0.0051], sun: '#fff3d4', sunK: 1.0, rays: 1.0, caus: 1.0, exposure: 1.0, sky: '#8fe9e0', chop: [0.8, 1.3] },
      // a low, golden sun: long slanting shafts, green water, gold on everything
      afternoon: { el: [0.78, 0.92], water: '#2fb0a0', deep: '#0a4a6c', dens: [0.0047, 0.0054], sun: '#ffdca0', sunK: 1.14, rays: 2.2, caus: 1.2, exposure: 1.03, sky: '#9ae8c0', chop: [0.9, 1.5] },
      // a bright haze of stirred-up lime mud after wind: paler, softer, shorter views
      milk:      { el: [1.1, 1.4], water: '#56c4d0', deep: '#165c96', dens: [0.0058, 0.0066], sun: '#f2fbf2', sunK: 0.92, rays: 0.75, caus: 0.72, exposure: 1.05, sky: '#b4f0ea', chop: [1.3, 1.9] },
      // glass-clear blue water on a still day: the longest views, cobalt distances, hard white light
      'deep-clear': { el: [1.15, 1.4], water: '#1fa4d0', deep: '#083c7c', dens: [0.0034, 0.0038], sun: '#f6f8ff', sunK: 1.06, rays: 1.25, caus: 1.12, exposure: 0.95, sky: '#7fd0f2', chop: [0.6, 1.0] },
    }[mood];
    const el = rng.range(M.el[0], M.el[1]), az = Math.atan2(0.3, -0.22) + rng.range(-0.75, 0.75), dens = rng.range(M.dens[0], M.dens[1]);
    const sunDir = V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize();          // toward the sun, above water
    const sinT = Math.hypot(sunDir.x, sunDir.z) / 1.333, hl = Math.hypot(sunDir.x, sunDir.z) || 1;
    const toLight = V3((sunDir.x / hl) * sinT, Math.sqrt(1 - sinT * sinT), (sunDir.z / hl) * sinT);                 // toward the light, as seen under water
    const fogCol = col(M.water), deepCol = col(M.deep, 0.8);
    const hueShift = rng.range(-0.12, 0.12);                                                                       // the reef's own colour cast
    const reefTint = (h, k) => col(h, k).offsetHSL(hueShift, 0, 0);

    // ---------------------------------------------------------------- the hero: the idol and its own sand apron
    const hero = await buildHero(ctx, { palette: PALETTE, sand: 'full', sandRadius: 5, surfaceY: -FL, sunDir: toLight, progress: 0, fish: 800, rayGain: 0.36, coralDensity: 0.8 });
    hero.object.position.y = FL; hero.object.updateMatrixWorld(true);
    hero.setLight({ sunDir: toLight, sunColor: col(M.sun, 1.22 * M.sunK), skyColor: col(M.sky, 0.26), causticScale: 8, causticStrength: M.caus, causticSpeed: 0.55, surfaceY: -FL });
    scene.add(hero.object);
    const A = hero.anchors, seat = A.portalSeat.position, appr = A.approachDir;
    const W = (v, out = V3()) => out.set(v.x, v.y + FL, v.z);                                                       // idol-local -> world
    await ctx.yield();

    // ---------------------------------------------------------------- the flight
    // The entry is short and aimed straight at the idol's feet: the soles, 14 m tall with gold on their rims and toes, stand
    // dead ahead between the gate columns. There the lens turns west and flies low, 6 to 10 m over the sand and 10 to 14 m
    // from the body, down an aisle between the colonnade and the flank: calf, knee, girdle, hip, shoulder. Past the folded
    // arm it swings out so mask, bubbles and the hand with the portal come into one frame, turns in toward the face, and
    // runs straight past it, eye to eye, into the hand.
    const ex = rng.range(-30, 25), swing = rng.range(-2, 3.5), lift = rng.range(-0.4, 0.7);
    const P0 = [142 + ex * 0.3, 102], aim = (k) => [P0[0] + (107 - P0[0]) * k, P0[1] + (14 - P0[1]) * k];
    let path, LP;
    for (let out = 0, tries = 0; tries < 4; tries++, out += 1.5) {                  // (the flank run moves out until it is 9 m clear everywhere)
      const pts = [[P0[0], 7.9 + lift, P0[1]], [aim(0.25)[0], 7 + lift, aim(0.25)[1]], [aim(0.46)[0], 6.4 + lift, aim(0.46)[1]], [111, 6 + lift, 45 + out], [84, 8 + lift * 0.5, 29 + swing * 0.3 + out],
        [50, 9, 27 + swing * 0.4 + out], [14, 9.5 + lift * 0.4, 27 + swing * 0.4 + out], [-8, 10.5, 31.5 + out * 0.5], [-25, 11.5, 35.5]].map(([x, y, z]) => V3(x, y + FL, z));
      pts.push(W(A.straightStart), W(seat).addScaledVector(appr, -31), W(seat));
      path = makePath(pts); LP = path.length;
      await ctx.yield();
      let min = 1e9; const q = V3();
      for (let i = 0; i <= 150; i++) { path.pointAt(i / 176, q); min = Math.min(min, hero.distance(q.x, q.y - FL, q.z)); }
      await ctx.yield();
      if (min >= 9) break;
    }
    const tmp = V3(), tmp2 = V3();
    // point in path space: s metres along, lat metres to the right, optionally at height y
    const onPath = (s, lat, y, out = V3()) => {
      path.posAtDist(s, out); path.tangentAtDist(s, tmp);
      const l = Math.hypot(tmp.x, tmp.z) || 1; out.x += (-tmp.z / l) * lat; out.z += (tmp.x / l) * lat; if (y !== undefined) out.y = y; return out;
    };
    const uOfX = (x) => { let best = 0, bd = 1e9; for (let i = 120; i <= 400; i++) { path.pointAt(i / 400, tmp); const d = Math.abs(tmp.x - x); if (d < bd) { bd = d; best = i / 400; } } return best; };
    const U_FACE = uOfX(A.faceCenter.x + 4), U_TURN = path.nearestXZ(111, 45).u;                                    // where the camera is abreast of the mask; the column gate
    const U_SHOW = U_FACE - 0.07;                                                                                  // where the whole mask is best seen, just before the lens is abreast of it
    const heroU = (u) => (u < U_SHOW ? (u / U_SHOW) * 0.4 : 0.4 + ((u - U_SHOW) / (1 - U_SHOW)) * 0.6);             // the idol's script expects the face at 0.4

    // ---------------------------------------------------------------- the lie of the sea bed (idol-local y: sand = 0)
    const n0 = rng.range(0, 400), ph1 = rng.range(0, 6.283), bay = rng.range(165, 190), wallBase = rng.range(86, 92);
    const wallZ = (x) => wallBase + bay * Math.pow(smoothstep(35, 170, x), 1.4) + 6 * Math.sin(x * 0.021 + ph1) + 5 * noise.n2(x * 0.012 + n0, 3.3);
    const westX = (z) => -178 + 9 * Math.sin(z * 0.03 + ph1 * 1.7) + 5 * noise.n2(7.7, z * 0.012 + n0);
    const [hx0, hz0, hx1, hz1] = hero.sandRect;
    const G = { reef: 0, gw: -99, back: 0 };
    const ground = (x, z, o = G) => {
      const edge = Math.max(hx0 - x, x - hx1, hz0 - z, z - hz1, 0);                 // metres outside the idol's own sand
      if (edge <= 0) { o.reef = 0; o.gw = -99; o.back = 0; return hero.sandHeightAt(x, z); }
      const sl = (wallZ(x + 3) - wallZ(x - 3)) / 6, g1 = (z - wallZ(x)) / Math.sqrt(1 + sl * sl), g2 = westX(z) - x;
      const hk = Math.max(24 - Math.abs(g1 - g2), 0) / 24, g = Math.max(g1, g2) + hk * hk * 6;
      const gw = g + 9 * noise.fbm2(x * 0.018 + n0, z * 0.018, 3) + 2.2 * noise.n2(x * 0.07, z * 0.07 + n0);   // > 0: over the edge
      const far = smoothstep(6, 30, edge), far2 = smoothstep(3, 17, edge);
      let h = (0.5 * noise.fbm2(x * 0.03, z * 0.03, 3) + 0.3 * noise.n2(x * 0.011 + 7, z * 0.011) + 0.8 * noise.n2(x * 0.0045 + n0, z * 0.0045)) * far - 0.12 * (1 - smoothstep(5.2, 7.5, edge));
      let reef = 0;
      if (gw > -36) {
        const spur = 0.5 + 0.5 * noise.ridged2(x * 0.03 + n0, z * 0.03, 2);                // spur and groove
        h += 3.8 * Math.exp(-Math.pow((gw + 9) / 9, 2)) * spur * far2;                     // the reef crest, just inside the edge
        reef = smoothstep(-22, -11, gw + 4 * spur) * far2;
        if (gw > 0) {
          const t = clamp(gw / 30, 0, 1), s = t * t * (3 - 2 * t);
          h -= 58 * Math.pow(s, 0.85);                                                     // the wall
          h += (noise.ridged2(x * 0.045 + n0 + 9, z * 0.045, 3) - 0.45) * 40 * t * (1 - t);  // buttresses and ledges
          h -= 26 * smoothstep(30, 190, gw) - 4 * noise.fbm2(x * 0.012, z * 0.012 + 5, 3) * smoothstep(25, 80, gw);
        }
      }
      const b = smoothstep(-60, -104, z + 12 * noise.n2(x * 0.016 + 3, n0));              // the back reef behind the idol
      if (b > 0) { h += b * (3.5 + 7.5 * noise.ridged2(x * 0.02 + n0 + 40, z * 0.02, 3)) * smoothstep(-5, -25, gw); reef = Math.max(reef, smoothstep(0.12, 0.45, b)); }
      o.reef = reef; o.gw = gw; o.back = b;
      return h;
    };

    // ---------------------------------------------------------------- the six column stumps that once flanked the idol, and their fallen drums
    const rc = rng.fork('columns'), columns = [], drums = [], COL_R = 2.5;
    const toppled = rc.int(0, 5), toppled2 = rc.chance(0.4) ? rc.int(0, 5) : -1, tallA = rc.int(0, 2), tallB = rc.int(3, 5);
    [138, 90, 54, 18, -18, -54].forEach((cx, i) => {
      const x = cx + rc.range(-2.5, 2.5), down = i === toppled || i === toppled2;
      let z = 41 + rc.range(-1, 1.2); while (path.nearestXZ(x, z).dist < 10) z += 1.5;          // an aisle between colonnade and body, never in the lens's way
      const c = { x, z, y: ground(x, z), H: down ? rc.range(1.3, 2.4) : (i === tallA || i === tallB ? rc.range(8.5, 11.5) : rc.range(3.2, 7.5)), lean: rc.range(0.015, 0.07), leanA: rc() * 6.283 };
      columns.push(c);
      for (let k = 0, n = down ? rc.int(2, 3) : rc.int(0, 1); k < n; k++) {
        const a = rc.range(-0.9, 0.9) + Math.PI * 0.5, d = rc.range(6.5, 9) + k * 5.4;        // drums roll away from the idol, toward the drop-off
        drums.push({ x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, yaw: rc() * 6.283, len: rc.range(2.2, 3.1), sink: rc.range(0.3, 0.45) });
      }
    });
    for (const [s, lat] of [[58, 12.5 + rc.range(0, 3)], [96, -11.5 - rc.range(0, 4)]]) {
      const p = onPath(s + rc.range(-4, 4), lat); drums.push({ x: p.x, z: p.z, yaw: rc() * 6.283, len: rc.range(2.2, 3.1), sink: rc.range(0.3, 0.45) });
    }
    // a pair of columns stands either side of the entry axis, a tall one and a stump: the gate that frames the idol's
    // feet in the first frame and in the view through the previous world's portal
    { const tallSide = rc.sign(), s0 = 40 + rc.range(0, 3);
      for (const side of [tallSide, -tallSide]) {
        const p = onPath(s0 + (side === tallSide ? 0 : rc.range(-3, 2)), side * (side === tallSide ? 10.2 : 10.8));
        columns.push({ x: p.x, z: p.z, y: ground(p.x, p.z), H: side === tallSide ? rc.range(10, 11.2) : rc.range(5.4, 6.4), lean: rc.range(0.015, 0.04), leanA: rc() * 6.283, entry: side });
      } }
    // debris of the idol's dressing along the body: tilted slabs half sunk in the sand, mostly on the open side
    const debris = [];
    for (let s0 = 96; s0 < Math.min(215, LP - 95); s0 += rc.range(13, 19)) {
      const lat = (rc.chance(0.8) ? -1 : 1) * rc.range(9, 14), p = onPath(s0, lat);
      if (hero.distance(p.x, 1, p.z) < 5) continue;
      debris.push({ x: p.x, z: p.z, yaw: rc() * 6.283, sx: rc.range(1.4, 3.2), sy: rc.range(0.45, 0.9), sz: rc.range(1.0, 2.2), tilt: rc.range(-0.35, 0.35), roll: rc.range(-0.2, 0.2) });
      if (rc.chance(0.5)) debris.push({ x: p.x + rc.range(-2.5, 2.5), z: p.z + rc.range(1.5, 3), yaw: rc() * 6.283, sx: rc.range(0.8, 1.5), sy: rc.range(0.3, 0.6), sz: rc.range(0.7, 1.2), tilt: rc.range(-0.5, 0.5), roll: rc.range(-0.3, 0.3) });
    }

    // ---------------------------------------------------------------- coral heads on the sand
    const rb = rng.fork('bommies'), bommies = [];
    const tryBommie = (x, z, r, h) => {
      ground(x, z, G); if (G.gw > -17 || G.reef > 0.3) return false;                // not on the crest, not in the deep
      if (hero.distance(x, 2, z) < r + 4.5 || path.nearestXZ(x, z).dist < r + 8.5) return false;
      for (const c of columns) if (Math.hypot(x - c.x, z - c.z) < r + 6.5) return false;
      for (const d of drums) if (Math.hypot(x - d.x, z - d.z) < r + 3.5) return false;
      for (const d of debris) if (Math.hypot(x - d.x, z - d.z) < r + 2) return false;
      for (const b of bommies) if (Math.hypot(x - b.x, z - b.z) < (r + b.r) * 0.78) return false;
      const s = rb.range(0, 99), r2 = r * r;
      bommies.push({ x, z, r, r2, h, at: (px, pz) => {                     // lobed outline, steep flanks, a knobbly crown
        const an = Math.atan2(pz - z, px - x), rr = r * (0.78 + 0.16 * Math.sin(an * 3 + s) + 0.08 * Math.sin(an * 5 + s * 2.3)), k = 1 - ((px - x) * (px - x) + (pz - z) * (pz - z)) / (rr * rr);
        return k <= 0 ? 0 : h * Math.pow(k, 0.42) * (0.78 + 0.3 * noise.n2(px * 0.2 + s, pz * 0.2)) + Math.pow(k, 0.3) * (0.55 * noise.n2(px * 0.45 + s, pz * 0.45) + 0.25 * noise.n2(px * 1.1, pz * 1.1 + s));
      } });
      return true;
    };
    const cluster = (x, z, r, h) => {
      if (!tryBommie(x, z, r, h)) return;
      for (let k = 0, n = rb.int(0, 2); k < n; k++) { const a = rb() * 6.283, d = r * rb.range(1.0, 1.4), r1 = r * rb.range(0.35, 0.6); tryBommie(x + Math.cos(a) * d, z + Math.sin(a) * d, r1, r1 * rb.range(0.55, 0.85)); }
    };
    for (const [s, lat, r] of [[20, -19.5, 7.2], [25, 19.5, 6.6], [62, -21, 6.4], [84, 20, 5.6], [118, -17, 5], [168, -17, 4.5]]) { const p = onPath(s + rb.range(-3, 3), lat + rb.range(-0.6, 1.5) * Math.sign(lat)); cluster(p.x, p.z, r * rb.range(0.95, 1.1), r * rb.range(0.58, 0.72)); }
    // two coral heads beyond the forearm, so the last straight has a reef on its right as well as the arm
    for (const [back, lat, r] of [[rb.range(34, 42), rb.range(22, 26), 6.2], [rb.range(6, 13), rb.range(25, 29), 5.2]]) { const p = onPath(LP - back, lat); cluster(p.x, p.z, r * rb.range(0.9, 1.1), r * rb.range(0.6, 0.75)); }
    // and more round and beyond the hand, where the last run looks, so it does not stand on an empty plain (negative: beyond the portal)
    for (const [back, lat, r] of [[2, -24, 6], [-14, -15, 5.2], [-6, -40, 6.5], [16, -27, 5.5], [-13, 23, 5]]) { const p = onPath(LP - back + rb.range(-2, 2), lat - rb.range(0, 1.2)); cluster(p.x, p.z, r * rb.range(0.92, 1.08), r * rb.range(0.6, 0.78)); }
    await ctx.yield();
    for (let i = 0; i < 90 && bommies.length < 38; i++) {
      const p = onPath(rb.range(8, LP - 45), rb.sign() * rb.range(13, 58)), r = rb.range(3, 7.5);
      cluster(p.x, p.z, r, r * rb.range(0.5, 0.8));
    }
    const bommieAt = (x, z) => { let m = 0; for (const b of bommies) { const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz < b.r2) { const v = b.at(x, z); if (v > m) m = v; } } return m; };
    const heightAt = (x, z) => ground(x, z) + bommieAt(x, z) + FL;                    // world height of everything the reef grows on
    await ctx.yield();
    // What stands on the sand shades it: each column throws a soft bar along the refracted sun, coral heads, drums and
    // slabs sit in a pool of shade. Baked into the sea bed's vertices and into the idol's own sand.
    const shX = -toLight.x / toLight.y, shZ = -toLight.z / toLight.y, casters = [];
    for (const c of columns) casters.push([c.x, c.z, c.x + shX * c.H, c.z + shZ * c.H, COL_R + 0.6, 3.2, 0.58]);
    for (const d of drums) casters.push([d.x, d.z, d.x + shX * 2, d.z + shZ * 2, 2.3, 2.6, 0.5]);
    for (const b of bommies) casters.push([b.x + shX * b.h * 0.3, b.z + shZ * b.h * 0.3, b.x + shX * b.h * 0.6, b.z + shZ * b.h * 0.6, b.r * 0.8, 3.6, 0.5]);
    for (const d of debris) casters.push([d.x, d.z, d.x + shX * 0.5, d.z + shZ * 0.5, d.sx * 0.45, 1.8, 0.4]);
    const propShade = (x, z) => {
      let s = 1;
      for (let i = 0; i < casters.length; i++) {
        const c = casters[i], reach = c[4] + c[5], ax = x - c[0], az = z - c[1];
        if (ax > 24 || ax < -24 || az > 24 || az < -24) continue;
        const ex = c[2] - c[0], ez = c[3] - c[1], t = clamp((ax * ex + az * ez) / (ex * ex + ez * ez + 1e-6), 0, 1), d = Math.hypot(ax - ex * t, az - ez * t);
        if (d < reach) s *= 1 - c[6] * (1 - smoothstep(c[4], reach, d)) * (1 - 0.45 * t);
      }
      return s;
    };
    hero.shadeSand(propShade);
    await ctx.yield();

    // ---------------------------------------------------------------- water, light, atmosphere
    const light = Water.waterLight('noon', { sunDir, sunColor: M.sun, sunIntensity: 3.4 * M.sunK, zenith: '#8fdcec', mid: '#c4f2ee', horizon: '#e6fbf2', fogColor: M.water });
    const vents = [];
    for (const c of columns) if (rc.chance(0.6)) vents.push([c.x + rc.range(-3.5, 3.5), FL + 0.4, c.z + rc.range(-3.5, 3.5)]);
    for (const b of bommies) if (vents.length < 12 && rb.chance(0.3)) vents.push([b.x + b.r * 0.8, FL + 0.5, b.z]);
    if (!vents.length) vents.push([columns[0].x + 3, FL + 0.4, columns[0].z]);
    const uw = Water.makeUnderwater({ rng: rng.fork('uw'), light, surfaceY: 0, floorY: FL, water: M.water, deep: M.deep, fogDensity: dens, minBrightness: 0.15,
      rayIntensity: M.rays * 0.6, rays: { count: 36, range: 220, width: 6, length: mood === 'afternoon' ? 34 : 26 }, chop: rng.range(M.chop[0], M.chop[1]),
      particles: { count: Math.round(350 * (ctx.quality?.detail ?? 1)), range: 44, size: 0.05, color: PALETTE[0], glowColor: PALETTE[0], glowFraction: 0.05, glowIntensity: 1.5 },
      bubbles: { count: 200, size: 0.085, sources: vents }, caustics: { scale: 8, intensity: 2.2 * M.caus, color: '#d8fff0' } });
    scene.add(uw.object);
    scene.fog = new THREE.FogExp2(fogCol.clone(), dens);
    scene.background = fogCol.clone();
    const keepWater = () => { uw.volumeColor.copy(fogCol); uw.fog.color.copy(fogCol); uw.background.copy(fogCol); };
    uw.update(0, 0, null); keepWater();
    // Outside Snell's window the surface mirrors the deeper water, not the bright fog: a darker ceiling round a blazing
    // window overhead, so the top of every frame has a value structure of its own.
    const mirrorCol = fogCol.clone().lerp(deepCol, mood === 'deep-clear' ? 0.26 : 0.38).multiplyScalar(mood === 'milk' ? 0.76 : mood === 'deep-clear' ? 0.8 : 0.64);
    if (uw.surface && uw.surface.material.uniforms.uUwWater) uw.surface.material.uniforms.uUwWater.value = mirrorCol;
    // lights for the kit's lit materials (corals, sea grass); the idol and the sea bed light themselves
    const hemi = new THREE.HemisphereLight(col(M.sky), col('#d9cfae', 0.75), 2.1);
    const sun = new THREE.DirectionalLight(col(M.sun), 2.5 * M.sunK); sun.position.copy(toLight).multiplyScalar(100);
    scene.add(hemi, sun, sun.target);
    const faunaLight = { sunDir: toLight.clone(), sunColor: M.sun, sunIntensity: 2.5 * M.sunK, sky: M.sky, skyIntensity: 1.5, ground: '#cfc6a2', groundIntensity: 1.25 };

    // ---------------------------------------------------------------- sea bed mesh: bay floor, reef crest, wall, back reef
    const seabedU = { ...hero.uniforms, uSand: { value: hero.sandColor }, uStone: { value: col('#efe4c8', 0.78) },
      uReefRock: { value: col('#c6b89c', 0.4) }, uReefA: { value: reefTint(PALETTE[5], 0.5) }, uReefB: { value: reefTint('#b59be8', 0.46) }, uReefC: { value: reefTint(PALETTE[6], 0.5) },
      uFogCol: { value: fogCol }, uDeepCol: { value: deepCol }, uFogDens: { value: dens }, uFloor: { value: FL } };
    const seabedMat = new THREE.ShaderMaterial({ vertexShader: SEABED_VERT, fragmentShader: SEABED_FRAG, uniforms: seabedU });
    const BED = { nx: 0, nz: 0, i0: 0, k0: 0, reef: null, gw: null };
    {
      const xs = gridAxis(-222, 262, 4, 900), zs = gridAxis(-128, 282, 4, 900), nx = xs.length, nz = zs.length;
      const pos = new Float32Array(nx * nz * 3), lit = new Float32Array(nx * nz * 2), mat = new Float32Array(nx * nz * 2), idx = [];
      BED.nx = nx; BED.nz = nz; BED.i0 = xs.indexOf(-222); BED.k0 = zs.indexOf(-128); BED.reef = new Float32Array(nx * nz); BED.gw = new Float32Array(nx * nz);
      for (let k = 0; k < nz; k++) {
        for (let i = 0; i < nx; i++) {
          const x = xs[i], z = zs[k], v = k * nx + i, h = ground(x, z, G);
          pos[v * 3] = x; pos[v * 3 + 1] = h + FL; pos[v * 3 + 2] = z;
          // the back reef behind the idol is held darker, so the body's silhouette stands out from it
          const sh = propShade(x, z), back = 1 - 0.3 * G.back;
          lit[v * 2] = (1 - 0.3 * G.reef * (0.5 + 0.5 * noise.n2(x * 0.09 + 5, z * 0.09))) * (0.55 + 0.45 * sh) * back; lit[v * 2 + 1] = sh * back;
          mat[v * 2] = G.reef; BED.reef[v] = G.reef; BED.gw[v] = G.gw;
        }
        if (k % 3 === 2) await ctx.yield();
      }
      const inApron = (i, k) => xs[i] > hx0 - 4.4 && xs[i] < hx1 + 4.4 && zs[k] > hz0 - 4.4 && zs[k] < hz1 + 4.4;   // the idol's own sand covers these
      for (let k = 0; k < nz - 1; k++) for (let i = 0; i < nx - 1; i++) {
        if (inApron(i, k) && inApron(i + 1, k) && inApron(i, k + 1) && inApron(i + 1, k + 1)) continue;
        const a = k * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aLit', new THREE.BufferAttribute(lit, 2)); g.setAttribute('aMat', new THREE.BufferAttribute(mat, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const bed = new THREE.Mesh(g, seabedMat); bed.name = 'sea-bed'; bed.frustumCulled = false; bed.matrixAutoUpdate = false; scene.add(bed);
    }
    // The blue beyond: a soft veil standing in the water 28 m past the edge of the wall, clear at the surface and
    // thickening downward, with a lid just under the surface that deepens outward. Seen from the lagoon the open sea
    // (and the ceiling over it, out to the horizon) turns from turquoise to cobalt, while the bay itself stays clear.
    const veilU = { uCol: { value: fogCol.clone().lerp(deepCol.clone().multiplyScalar(1.2), 0.94) }, uAmt: { value: mood === 'milk' ? 0.74 : 0.9 } };
    {
      const line = [];
      for (let x = 520; x >= -218; x -= 15) line.push([x, wallZ(x) + 28, 0, 1]);
      for (let z = line[line.length - 1][1] - 15; z >= -430; z -= 15) line.push([westX(z) - 28, z, -1, 0]);
      const pos = [], lid = [], idx = [], rows = [-110, -40, -21, -11, -1.5], R = rows.length + 2;
      line.forEach(([x, z, ox, oz], i) => {
        const near = Math.min(i, line.length - 1 - i) < 1 ? 0 : 1, cnr = i > 46 && i < 54 ? 0.7 : 0;          // round the north-west corner
        const dx = ox - cnr * (ox + 0.7) , dz = oz - cnr * (oz - 0.7);
        for (const y of rows) { pos.push(x, y, z); lid.push(0); }
        pos.push(x + dx * 150, -1.5, z + dz * 150, x + dx * 800, -1.5, z + dz * 800); lid.push(near, near);
        if (i > 0) for (let r = 0; r < R - 1; r++) { const a = (i - 1) * R + r, b = a + 1, c = a + R, d = c + 1; idx.push(a, b, c, b, d, c); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aLid', new THREE.Float32BufferAttribute(lid, 1)); g.setIndex(idx);
      const veil = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: veilU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: 'attribute float aLid; varying vec3 vW; varying float vLid; void main(){ vLid = aLid; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: 'uniform vec3 uCol; uniform float uAmt; varying vec3 vW; varying float vLid; void main(){ float d = length(cameraPosition - vW); gl_FragColor = vec4(uCol, uAmt * max(smoothstep(-1.5, -21.0, vW.y), vLid * vLid * (3.0 - 2.0 * vLid)) * smoothstep(20.0, 85.0, d)); }' }));
      veil.name = 'blue-beyond'; veil.renderOrder = -0.5; veil.frustumCulled = false; veil.matrixAutoUpdate = false; scene.add(veil);
    }
    await ctx.yield();
    // coral heads, column stumps, plinths and drums: one mesh, same material
    {
      const acc = makeAcc(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), one = V3(1, 1, 1), yAxis = V3(0, 1, 0);
      for (let i = 0; i < bommies.length; i++) { addBommie(acc, bommies[i], (x, z) => ground(x, z) + FL); if (i % 4 === 3) await ctx.yield(); }
      await ctx.yield();
      for (const c of columns) {
        q.setFromAxisAngle(V3(Math.cos(c.leanA), 0, Math.sin(c.leanA)), c.lean);
        m4.compose(V3(c.x, c.y + FL, c.z), q, one);
        addFluted(acc, m4, COL_R, -1.2, c.H, { rng: rc, noise, broken: true, crust: rc.range(0.2, 0.42) });
        q2.setFromAxisAngle(yAxis, rc.range(-0.12, 0.12)).premultiply(q);
        m4.compose(V3(c.x, c.y + FL + 0.05, c.z), q2, one);
        addBlock(acc, m4, COL_R * 2.7, 1.1, COL_R * 2.7, 0.3);
        await ctx.yield();
      }
      await ctx.yield();
      for (const d of drums) {
        q.setFromAxisAngle(V3(1, 0, 0), Math.PI / 2 + rc.range(-0.12, 0.12)).premultiply(q2.setFromAxisAngle(yAxis, d.yaw));
        m4.compose(V3(d.x, ground(d.x, d.z) + FL + COL_R * (1 - 2 * d.sink) , d.z), q, one);
        addFluted(acc, m4, COL_R, -d.len / 2, d.len / 2, { rng: rc, noise, broken: false, cap0: true, crust: rc.range(0.12, 0.25) });
        addDrift(acc, d.x, d.z, 1.7, 5.2, 0.55 + 1.5 * d.sink, (x, z) => ground(x, z) + FL, propShade, rc.range(0, 50), noise);
      }
      await ctx.yield();
      for (const d of debris) {
        q.setFromEuler(new THREE.Euler(d.tilt, d.yaw, d.roll, 'YXZ'));
        m4.compose(V3(d.x, ground(d.x, d.z) + FL + d.sy * 0.12, d.z), q, one);
        addBlock(acc, m4, d.sx, d.sy, d.sz, 0.3);
      }
      await ctx.yield();
      const props = new THREE.Mesh(accGeometry(acc), seabedMat); props.name = 'coral-heads-and-columns'; props.matrixAutoUpdate = false; scene.add(props);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- reef growth from the kit, all in one slow current
    const curA = rng.range(0, 6.283);
    const seaWind = flora.makeWind({ direction: [Math.cos(curA), Math.sin(curA)], speed: 0.4, strength: 2.2, gustScale: 0.03, gustiness: 0.4 });
    const matSeaO = { wind: seaWind, backlight: 0.9, backlightTint: '#fff2b0', caustics: 0.6, detail: 0.15, glow: 1 };
    await flora.prepareLeafTexture(matSeaO, ctx.yield);
    const matSea = flora.windMaterial(matSeaO);
    await ctx.yield();
    const fr = rng.fork('flora'), growth = [];
    // How much reef there is under a point: the crest, coral heads, the feet of the columns. Asked tens of thousands of
    // times by the scatters, so nothing is worked out twice: the sea-bed grid kept its reef and edge distance (4 m, read
    // bilinearly), and coral heads, column feet and drums are baked on a 2 m lattice round the path.
    const bedAt = (x, z) => {                                                       // fills G.reef and G.gw
      const fi = (x + 222) / 4, fk = (z + 128) / 4;
      if (!(fi >= 0 && fk >= 0 && fi < 121 && fk < 102)) { ground(x, z, G); return; }
      const i = Math.floor(fi), k = Math.floor(fk), ti = fi - i, tk = fk - k, a = (BED.k0 + k) * BED.nx + BED.i0 + i, b = a + BED.nx;
      G.reef = lerp(lerp(BED.reef[a], BED.reef[a + 1], ti), lerp(BED.reef[b], BED.reef[b + 1], ti), tk);
      G.gw = lerp(lerp(BED.gw[a], BED.gw[a + 1], ti), lerp(BED.gw[b], BED.gw[b + 1], ti), tk);
    };
    const PR = { x0: -180, z0: -50, nx: 201, nz: 116, v: null }; PR.v = new Float32Array(PR.nx * PR.nz);
    const stamp = (cx, cz, R, f) => {                                               // f(distance squared) -> reef, kept where it is the larger
      const i0 = Math.max(0, Math.ceil((cx - R - PR.x0) / 2)), i1 = Math.min(PR.nx - 1, Math.floor((cx + R - PR.x0) / 2)), k0 = Math.max(0, Math.ceil((cz - R - PR.z0) / 2)), k1 = Math.min(PR.nz - 1, Math.floor((cz + R - PR.z0) / 2));
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) { const dx = PR.x0 + i * 2 - cx, dz = PR.z0 + k * 2 - cz, d2 = dx * dx + dz * dz; if (d2 < R * R) { const a = k * PR.nx + i, v = f(d2); if (v > PR.v[a]) PR.v[a] = v; } }
    };
    for (const b of bommies) stamp(b.x, b.z, b.r * 1.2247, (d2) => 1 - 0.5 * d2 / (b.r2 * 1.5));
    for (const c of columns) stamp(c.x, c.z, 7.5, (d2) => (d2 < (COL_R + 1.2) * (COL_R + 1.2) ? 0 : 0.75));
    for (const d of drums) stamp(d.x, d.z, 5, (d2) => (d2 < 2.9 * 2.9 ? 0 : 0.6));
    const reefAt = (x, z) => {
      bedAt(x, z); if (G.gw > 14) return 0;
      const fi = (x - PR.x0) / 2, fk = (z - PR.z0) / 2;
      if (!(fi >= 0 && fk >= 0 && fi < PR.nx - 1 && fk < PR.nz - 1)) return G.reef;
      const i = Math.floor(fi), k = Math.floor(fk), ti = fi - i, tk = fk - k, a = k * PR.nx + i, b = a + PR.nx;
      return Math.max(G.reef, lerp(lerp(PR.v[a], PR.v[a + 1], ti), lerp(PR.v[b], PR.v[b + 1], ti), tk));
    };
    await ctx.yield();
    // distance to the idol near the sand, baked on a 3 m grid (the exact field is too dear to ask ten thousand times)
    const ID = { x0: -129, z0: -30, nx: 84, nz: 25 }, idolD = new Float32Array(ID.nx * ID.nz);
    for (let k = 0; k < ID.nz; k++) { for (let i = 0; i < ID.nx; i++) idolD[k * ID.nx + i] = hero.distance(ID.x0 + i * 3, 1.5, ID.z0 + k * 3); if (k % 2 === 1) await ctx.yield(); }
    const offIdol = (x, z, m) => { const i = Math.round((x - ID.x0) / 3), k = Math.round((z - ID.z0) / 3); return i < 0 || k < 0 || i >= ID.nx || k >= ID.nz || idolD[k * ID.nx + i] > m; };
    const reefCols = [PALETTE[5], '#ff8f7a', PALETTE[6], '#ffc061', '#c9a2f2', '#b48cf0', '#f47fb6', '#7fe0cf'];
    const dominant = fr.pick([0, 2, 4]);                                             // which family leads this reef: pink, yellow or lilac
    const lead = []; for (let k = 0; k < 12; k++) lead.push(reefCols[dominant + (k % 3 === 2 ? 1 : 0)]);        // the leading family is 60% of the reef
    const colors = reefCols.concat(lead).map((c) => reefTint(c, 0.8).getStyle());
    // Coral gardens are laid out by hand so every coral head wears a crown: a big table or staghorn on top, brains,
    // fans and fingers crowding down the flanks; then the crest of the wall, the feet of the columns, strays on the sand.
    const cpts = [], cr = fr.fork('gardens'), BIG = [0, 0, 4, 1, 2], FILL = [5, 6, 3, 1, 2];   // kinds: branching brain fan tube table finger mound
    const putCoral = (x, z, sc, v) => {
      if (!offIdol(x, z, 4.5)) return;
      const n = path.nearestXZ(x, z); if (n.dist < 8) return;
      const y = heightAt(x, z); if (y < FL - 12) return;
      cpts.push({ x, y, z, s: sc, rot: cr() * 6.283, d: n.dist, u: n.u, v });
    };
    const garden = (x, z, R, n, s0, s1) => {
      for (let k = 0; k < n; k++) {
        const f = k / n, r = R * Math.sqrt(f) * cr.range(0.85, 1.15), a = k * 2.39996 + cr.range(-0.3, 0.3), big = k === 0 || cr() < 0.55 - 0.3 * f;
        putCoral(x + Math.cos(a) * r, z + Math.sin(a) * r, lerp(s1, s0, Math.pow(f, 0.6)) * cr.range(0.8, 1.15) * (big ? 1 : 0.8), big ? cr.pick(BIG) : cr.pick(FILL));
      }
    };
    for (const b of bommies) garden(b.x, b.z, b.r * 0.92, Math.round(6 + b.r * b.r * 0.34), 0.35, Math.min(1.5, 0.8 + b.r * 0.1));        // crowded with small growth under a few big crowns
    await ctx.yield();
    for (const c of columns) for (let k = 0, n = cr.int(4, 7); k < n; k++) { const a = cr() * 6.283, d = COL_R + cr.range(1.7, 4.6); putCoral(c.x + Math.cos(a) * d, c.z + Math.sin(a) * d, cr.range(0.5, 1.1), cr.pick(FILL)); }
    for (const d of drums) for (let k = 0; k < 3; k++) { const a = cr() * 6.283; putCoral(d.x + Math.cos(a) * 3.4, d.z + Math.sin(a) * 3.4, cr.range(0.4, 0.9), cr.pick(FILL)); }
    for (let i = 0; i < 56; i++) {                                                  // the crest of the north wall, and of the west wall beyond the hand
      const west = i >= 44, t = cr(), x = west ? westX(lerp(-35, 95, t)) + cr.range(3, 20) : lerp(-172, 118, t), z = west ? lerp(-35, 95, t) : wallZ(x) - cr.range(3, 21);
      if (reefAt(x, z) > 0.3) garden(x, z, cr.range(2.6, 4.2), cr.int(3, 5), 0.6, cr.range(1.0, 1.6));
    }
    await ctx.yield();
    for (let i = 0; i < 170; i++) {                                                 // strays and small knots of coral on the open sand beside the lens
      const p = onPath(cr.range(6, LP - 50), cr.sign() * cr.range(8.5, 20));
      if (reefAt(p.x, p.z) < 0.05 && G.gw < -20) { putCoral(p.x, p.z, cr.range(0.5, 1.1), cr.pick(FILL)); if (cr.chance(0.4)) garden(p.x, p.z, cr.range(0.9, 1.6), cr.int(2, 3), 0.4, 0.8); }
    }
    await ctx.yield();
    // (three batches along the path, so no single step of the build is long)
    cpts.sort((p, q) => p.u - q.u);
    for (let k = 0; k < 3; k++) {
      const part = cpts.slice(Math.floor(cpts.length * k / 3), Math.floor(cpts.length * (k + 1) / 3));
      if (part.length) growth.push(flora.makeCorals({ rng: fr.fork('corals' + k), path, heightAt, material: matSea, detail: 1, points: part, farDistance: 10, colors, glow: 0.5, chunks: 3, cullDistance: 72 }));
      await ctx.yield();
    }
    growth.push(flora.makeAnemones({ rng: fr.fork('anemones'), path, heightAt, material: matSea, count: fr.int(24, 32), radius: 36, corridor: 8, scale: [0.4, 0.9], yRange: [FL - 4, FL + 12],
      colors: ['#ff8ab0', '#ffb070', '#a0f0d0', PALETTE[0]], glow: 0.55, density: (x, z) => (offIdol(x, z, 4) ? reefAt(x, z) : 0) }));
    await ctx.yield();
    // sea grass: upright dark blades in thick beds with clean lanes of white sand between them, bowing to the swell
    const meadow = (x, z) => smoothstep(0.02, 0.3, noise.fbm2(x * 0.016 + n0 + 60, z * 0.016, 3) + 0.25 * noise.n2(x * 0.06, z * 0.06 + 9));
    growth.push(await flora.makeGrassAsync({ flowers: 0, materialOptions: { caustics: 0.5 }, rng: fr.fork('grass'), path, heightAt, wind: seaWind, map: matSea.map, count: Math.round(21000 * (ctx.quality?.detail ?? 1)), radius: 22, bias: 2.0, uRange: [0, 0.9],
      root: '#1c4034', tip: '#5c8f62', dry: '#9aa86c', dryAmount: 0.22, tint: 0.04, height: [0.6, 1.2], width: [0.45, 0.75], cards: 2, chunks: 8, fade: [52, 78],
      density: (x, z) => { const r = reefAt(x, z); return r > 0.2 || G.gw > -12 || !offIdol(x, z, 2.2) ? 0 : meadow(x, z); } }, ctx.yield));
    for (const g of growth) scene.add(g.object);
    await ctx.yield();

    // ---------------------------------------------------------------- fauna
    const rf = rng.fork('fauna'), fauna = [];
    const add = (it, from = 0, to = 1) => { fauna.push({ it, from, to }); scene.add(it.object); return it; };
    const YELLOW = [['#ffd91f', '#fff3a0'], ['#ffc400', '#ffffff'], ['#ffe14a', '#ff9d1a']], BLUE = [['#2a4cff', '#101018'], ['#1f6fe0', '#ffd21f'], ['#2f8cff', '#0b1a6a']];
    const MIXED = [['#ff7a1a', '#ffffff'], ['#ffd91f', '#fff3a0'], ['#2a4cff', '#101018'], ['#18b8a8', '#ff6fa8'], ['#ff5f7a', '#8a3fd0']];
    const school = (label, c, o, from, to) => add(F.makeFishSchool({ rng: rf.fork(label), species: 'reef', light: faunaLight, center: [c.x, c.y, c.z], radius: 9, height: 1.8, speed: 1.5,
      size: 0.55, vivid: 1, caustics: 0.4, ...o }), from, to);
    // yellow tangs over the first coral heads, a blue cloud at the column gate, a mixed crowd beside the torso, and the shoal that keeps the hand
    school('tangs', onPath(35, rf.range(-1, 1), FL + 8), { count: rf.int(180, 250), varieties: YELLOW, radius: rf.range(9, 12) }, 0, 0.45);
    await ctx.yield();
    school('chromis', V3(columns[1].x - 4, FL + rf.range(6.5, 8.5), columns[1].z + 3), { count: rf.int(160, 220), varieties: BLUE, radius: rf.range(8, 11), speed: 1.8 }, 0, 0.72);
    await ctx.yield();
    school('crowd', onPath(LP * 0.62, -rf.range(10, 15), FL + rf.range(7, 9)), { count: rf.int(150, 200), varieties: MIXED, radius: rf.range(8, 11) }, 0.12, 0.9);
    { const c = W(A.palmCenter).add(V3(0, 7, 0)); school('keepers', c, { count: 300, varieties: YELLOW, size: 1.1, radius: 9.5, height: 5, speed: 1.3 }, 0.5, 1); }   // they ring the portal; hidden by the head until then
    // a few that swim with the lens for the first stretch
    await ctx.yield();
    add(F.makeFishSchool({ rng: rf.fork('escort'), species: 'reef', light: faunaLight, count: rf.int(22, 34), varieties: YELLOW, size: 0.6, vivid: 1, caustics: 0.4, spread: [3.2, 1.6, 5],
      along: { path, side: rf.sign() * rf.range(3.2, 4.6), up: -1.4, lead: 12, from: 0.015, to: 0.3, drift: 1.5 } }), 0, 0.42);
    await ctx.yield();
    // silver fish wheeling over the reef crest
    { const sx = rf.range(-25, 35), c = V3(sx, FL + rf.range(9, 13), wallZ(sx) - 6);
      add(F.makeFishSchool({ rng: rf.fork('silver'), species: 'mackerel', light: faunaLight, lod: 'low', count: 300, center: [c.x, c.y, c.z], radius: rf.range(20, 28), height: 3, speed: 3.4, size: 0.8 }), 0, 1); }
    // green turtles: one crosses the lens early, one idles round a column stump (some days there is a third)
    await ctx.yield();
    const turtleSide = rf.sign();
    add(F.makeTurtle({ rng: rf.fork('turtle1'), light: faunaLight, length: 2.0, shell: '#5a6a34', skin: '#8fa06a',
      cross: { path, u: 0.03, lead: 13, span: 120, angle: 52, side: turtleSide, height: 0.6, window: 0.2, bow: 0, rise: 3 } }), 0, 0.4);
    await ctx.yield();
    { const c = columns[rf.int(2, 3)]; add(F.makeTurtle({ rng: rf.fork('turtle2'), light: faunaLight, length: 1.35, shell: '#5a6a34', skin: '#8fa06a', center: [c.x - 2, FL + c.H + 2.2, c.z + 1.5], radius: rf.range(6, 7.5), height: 1.4, speed: 1.0 }), 0, 0.95); }
    if (rf.chance(0.45)) { const p = onPath(60, -turtleSide * 16); add(F.makeTurtle({ rng: rf.fork('turtle3'), light: faunaLight, length: 1.2, shell: '#6b5a34', center: [p.x, FL + 3.4, p.z], radius: 8, height: 1.2, speed: 0.8 }), 0, 0.5); }
    // the manta squadron: in over the reef crest on the left, against the camera's heading and just over the lens, while
    // the camera hangs high beside the hip: they pass between it and the head and hand
    await ctx.yield();
    const nManta = rf.pick([5, 5, 5, 4, 6]);
    const mantas = add(F.makeMantaRay({ rng: rf.fork('mantas'), light: faunaLight, count: nManta, span: rf.range(5.6, 6.4), spread: [7, 2.2, 9],
      cross: { path, u: 0.41, lead: 16, span: 300, angle: 172, side: -1, offset: -rf.range(4, 7), height: rf.range(4.5, 6), window: 0.25, bow: 14 } }), 0, 0.9);
    // visitors that change with the seed, on the open side of the path where the lens climbs past the hip
    await ctx.yield();
    const visitor = rf.pick(['shark', 'jellies', 'baitball']);
    { const vp = onPath(LP * rf.range(0.3, 0.42), -rf.range(26, 33)), vx = vp.x, vz = vp.z;
      if (visitor === 'shark') add(F.makeShark({ rng: rf.fork('shark'), light: faunaLight, length: 3.8, center: [vx, FL + rf.range(8, 12), vz], radius: rf.range(15, 19), height: 3, speed: 1.9 }), 0, 1);
      if (visitor === 'jellies') add(F.makeJellyfish({ rng: rf.fork('jellies'), preset: rf.pick(['lagoon', 'moon']), count: rf.int(20, 28), size: 2.1, center: [vx, FL + 16, vz], spread: [30, 7, 20], glowIntensity: 1.1 }), 0, 1);
      if (visitor === 'baitball') add(F.makeFishSchool({ rng: rf.fork('bait'), species: 'sardines', light: faunaLight, count: 1000, center: [vx, FL + 13, vz + 4], radius: 6, spread: [7, 5.5], size: 1.6 }), 0, 1); }
    await ctx.yield();

    // ---------------------------------------------------------------- gaze
    const poiI = V3(), faceW = W(A.faceCenter), eyeW = W(A.eyeHollow), palmW = W(A.palmCenter).add(V3(0, 7, 0)), poiV = V3(), camP = V3();
    // The feet first; then the flank 20 m ahead of the lens, so the body fills the right half of the frame; a glance up
    // as the manta rays come over.
    const poiIdol = (time, u) => {
      path.pointAt(u, camP); const x = clamp(camP.x - 20, -22, 106), up = smoothstep(0.35, 0.4, u) * (1 - smoothstep(0.44, 0.5, u));
      return poiI.set(x, FL + 7 + 2 * smoothstep(50, -10, x) + 7 * up, 4 + 2 * smoothstep(90, 106, x) + 5 * up);
    };
    // The whole mask first, then toward the hollow eye; the gaze stays on the face through the pass, eye to eye at 18 m,
    // and only goes on to the hand once the lens is beyond it.
    const facePoi = (time, u) => poiV.lerpVectors(faceW, eyeW, 0.5 * smoothstep(U_FACE - 0.15, U_FACE - 0.09, u)).lerp(palmW, smoothstep(U_FACE + 0.015, U_FACE + 0.075, u));

    return {
      scene, path, duration: 38,
      // a little quicker over the sand, slower where the camera hangs over the body
      pace: (u) => 1 + 0.16 * (1 - smoothstep(0.04, 0.2, u)) - 0.14 * smoothstep(0.26, 0.36, u) * (1 - smoothstep(0.52, 0.62, u))
        - 0.3 * smoothstep(U_FACE - 0.1, U_FACE - 0.03, u) * (1 - smoothstep(U_FACE + 0.03, U_FACE + 0.09, u)),   // linger eye to eye with the mask
      camera: { fov: 64, near: 0.3, far: 1500, lookAhead: 22, sway: 1, bank: 0.5 },
      pois: [
        { at: poiIdol, from: 0.03, to: U_FACE - 0.15, weight: 0.6, fade: 0.14 },
        { at: facePoi, from: U_FACE - 0.27, to: Math.min(0.96, U_FACE + 0.12), weight: 0.85, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#bff5e6', glow: 0.4, revealDistance: 170 },
      post: { exposure: M.exposure * 0.94, bloom: { strength: 0.42, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.16, contrast: 1.18, tint: '#f4fffb', shadowTint: '#012a3c', vignette: 0.3, grain: 0.015, aberration: 0 } },
      update(dt, time, camera, u) {
        uw.update(dt, time, camera); keepWater(); uw.applyTo(scene, camera);
        seabedU.uFogDens.value = scene.fog.density;
        hero.setProgress(heroU(u), u); hero.update(dt, time, camera);
        for (const g of growth) g.update(dt, time, camera);
        for (const f of fauna) { const on = u >= f.from && u <= f.to; f.it.object.visible = on; if (on) f.it.update(dt, time, camera, u); }
      },
      dispose() { hero.dispose(); for (const it of [uw, ...growth, ...fauna.map((f) => f.it)]) if (it && typeof it.dispose === 'function') it.dispose(); },
    };
  },
};
