// Red Sails at Sunrise · 280 million years ago (early Permian, the Red Beds of north Texas).
// Blue dawn on a red mudbar: a fleet of sail-backed animals stands side-on to the sunrise in knee-deep mist and the
// edge of the far levee's shadow, one level plane of light, sinks through every sail at once (the hero part).
// World frame = the hero's frame: we fly toward +X, the fleet is on our left (-Z), the sun beyond it.
// Everything is self-lit by shaders that share the hero's uniforms (sun line, sun, hemisphere, mist): no scene lights.
// THE FLIGHT (polish 1): the cut bank and its lit Dimetrodon pair stand 13 m left-ahead of the entry; the bar starts at 30 m with
// two Eryops on its lip and the first sails 6 m off. From 126 m to 214 m the bar's near margin swings under our line and we fly
// LOW (1.1 m) above the cracked mud in among the sails: broadside to the hero row (u 0.30-0.36), obliquely down it to a display
// pair standing in a gap of the row (u 0.43), then into the sunrise, which breaks between two near sails at u 0.48-0.55 with the
// rib shadows raking over mud and puddles. Then the display pair on the point, two spits with sail-backs on our left through the
// turn (u 0.70, 0.79), and a sail-back on a mud shelf either side of the gate.
// POLISH 2: the dawn stands 30 degrees left of the entry heading; the lit pair stands on a low landing 9 m off above its mirror image;
// the fire line starts at 1.5 m; the sky has a horizon glow and high streaks that the water mirrors; rib shadows end at the water's edge.
// POLISH 3: no shore is a slab's lip (a wet apron slides under the water in bays and tongues; ground and water share a fine waterline);
// a mud isthmus crosses our line at 25-56 m and we fly LOW between sail-backs standing on it (u 0.07-0.13), rise over the channel
// (u 0.16, the fleet in a row, a griffinfly banking across), come down through a brake of tall Calamites (u 0.22-0.27); groves on the
// east bank break the horizon; the Dimetrodon sail has a clean pinned outline and round ocelli; skin has form shading; the mud has
// relief, grit and great polygons at range.
// POLISH 4: the flight changes height (5.6 m over the channel at u 0.16, 0.95 m under one towering sail at u 0.34, 0.9 m above the back-pool
// at u 0.61 with the pair on the point over their mirror image); the sun is seen THROUGH a sail at u 0.52; the griffinfly is rebuilt (eyes,
// thorax, legs, ringed abdomen, glassy veined wings) and one hangs 2 m off at u 0.79; the mud is cracked right down to the lens and the
// waterline carries strandlines; after sunrise the sky stays blue above a band of fire and the shade stays cool (no lilac wash).
// Seeds 8 / 21 / 3 give the three moods (clear / cirrus / after rain: the bar half flooded, puddles mirroring the sails).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, sunLineY, PALETTE } from '../parts/red-sails-dawn.js';

const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const LIN = (h) => new THREE.Color(h);

// ---------------------------------------------------------------------------------------------------------------
// A small geometry builder: position, linear colour, aAnim (vec4, meaning set by each user).
function GB() {
  const P = [], C = [], A = [], I = [];
  const g = {
    P, I,
    v(x, y, z, c, a) { P.push(x, y, z); C.push(c[0], c[1], c[2]); A.push(a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0, a ? a[3] : 0); return P.length / 3 - 1; },
    tri(a, b, c) { I.push(a, b, c); },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    // tube through pts [{ p:[x,y,z], r, ry, c:[r,g,b], a:[..] }]: r = half-width sideways, ry = half-height (default r)
    tube(pts, sides, opt = {}) {
      const rings = [], up = new THREE.Vector3(), t = new THREE.Vector3(), s = new THREE.Vector3(), b = new THREE.Vector3();
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(i - 1, 0)].p, c = pts[Math.min(i + 1, pts.length - 1)].p, q = pts[i];
        t.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
        up.set(0, 1, 0); if (Math.abs(t.y) > 0.9) up.set(opt.side ? 0 : 1, 0, opt.side ? 1 : 0);
        s.crossVectors(t, up).normalize(); b.crossVectors(s, t).normalize();
        const ring = [], rx = q.r, ry = q.ry ?? q.r;
        for (let k = 0; k < sides; k++) {
          const an = (k / sides) * TAU + (opt.twist || 0), ca = Math.cos(an), sa = Math.sin(an);
          const sq = opt.flatBelly && sa < 0 ? opt.flatBelly : 1;
          const col = q.cb && sa < -0.2 ? q.cb : q.c;
          ring.push(g.v(q.p[0] + s.x * ca * rx + b.x * sa * ry * sq, q.p[1] + s.y * ca * rx + b.y * sa * ry * sq, q.p[2] + s.z * ca * rx + b.z * sa * ry * sq, col, q.a));
        }
        rings.push(ring);
      }
      for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides; g.quad(rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]);
      }
      for (const end of [0, rings.length - 1]) {
        const q = pts[end], cap = g.v(q.p[0], q.p[1], q.p[2], q.c, q.a);
        for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; if (end) g.tri(rings[end][k], rings[end][k2], cap); else g.tri(rings[end][k2], rings[end][k], cap); }
      }
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      geo.setIndex(I); geo.computeVertexNormals();
      return geo;
    },
  };
  return g;
}
const rgb = (h, k = 1) => { const c = LIN(h); return [c.r * k, c.g * k, c.b * k]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the world: the hero's light law (hemisphere + sun gated by the level sun line),
// the mist law, and a distance haze that warms toward the sun.
const COMMON_U = ['uTime', 'uSunLineY', 'uSunDir', 'uSunColor', 'uSunI', 'uSky', 'uGround', 'uHemiW', 'uMistColor', 'uMistTop', 'uMistAmt', 'uMistLit', 'uFogCol', 'uFogWarm', 'uFogRange', 'uSunAz'];
const COMMON_GLSL = /* glsl */`
uniform float uTime, uSunLineY, uSunI, uHemiW, uMistTop, uMistAmt, uMistLit;
uniform vec3 uSunDir, uSunColor, uSky, uGround, uMistColor, uFogCol, uFogWarm;
uniform vec2 uFogRange, uSunAz;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float litAt(float y) { return smoothstep(-0.03, 0.03, y - uSunLineY); }
// the waterline wanders at a finer scale than the ground grid: ground and water add the same small offset to their height
float shoreWig(vec2 p) { return (vn(p * 1.1 + 2.0) - 0.5) * 0.085 + (vn(p * 3.7 + 9.0) - 0.5) * 0.04; }
vec3 hemiAt(vec3 N) { return mix(uGround, uSky, N.y * 0.5 + 0.5) * uHemiW; }
vec3 hazeCol(vec3 dir) { float s = max(dot(dir.xz, uSunAz), 0.0); s *= s; return mix(uFogCol, uFogWarm, s * s * (1.0 - 0.5 * clamp(dir.y * 4.0, 0.0, 1.0))); }
vec3 haze(vec3 col, vec3 w) {
  vec3 d = w - cameraPosition; float dist = length(d);
  float f = clamp((dist - uFogRange.x) / max(uFogRange.y - uFogRange.x, 1.0), 0.0, 1.0);
  return mix(col, hazeCol(d / max(dist, 1e-4)), f * (2.0 - f) * 0.92);
}
// ground mist: things fade toward the mist colour below uMistTop above their own ground (the hero's law)
vec3 mistFade(vec3 col, vec3 w, float groundY) {
  float md = clamp(uMistTop - (w.y - groundY), 0.0, uMistTop);
  float vy = abs(normalize(cameraPosition - w + vec3(0.0, 1e-4, 0.0)).y);
  return mix(col, uMistColor * 0.8, min(1.0 - exp(-md * 0.11 / max(vy, 0.05)), 0.8) * uMistAmt);
}`;
function share(mat, U, names = COMMON_U) { for (const k of names) mat.uniforms[k] = U[k]; return mat; }

// ---------------------------------------------------------------------------------------------------------------
// Layout: the path, a signed "how far along / how far to the left of the path" lookup, and the height field.
// polish 4: the flight changes height. Low over the isthmus, up to 5.6 m over the channel (the fleet strung down the bar), down through
// the canes, a pass 0.7 m above the mud under one towering sail (u 0.34), level through the portrait and into the sunrise seen THROUGH a
// sail (u 0.52), down to 0.9 m above the back-pool (u 0.61: the pair on the point above their mirror image, boomerang heads close below),
// up past the first spit (u 0.70), low again beside the second where a griffinfly hangs in front of a sail against the sun (u 0.79), then up to the ring.
const PATH_PTS = [[0, 1.5, 0], [30, 1.5, 0], [41, 1.8, 0.2], [51, 3.7, 0.4], [60, 5.3, 0.5], [67, 5.6, 0.6], [81, 4.6, -0.9], [94, 2.6, -2.2], [104, 1.6, -3.4], [121, 1.25, -6.2], [136, 0.95, -8.8],
  [170, 1.12, -14.8], [205, 1.5, -21.4], [214, 1.9, -20.9], [226, 1.5, -21.9], [236, 1.0, -24.0], [244, 0.9, -25.5], [254, 1.1, -25.8], [265, 1.7, -24.8], [276, 2.2, -22.9], [294.2, 2.0, -17.7],
  [310, 1.6, -10.6], [318, 1.7, -6.0], [326.6, 2.4, -0.8], [340, 2.95, 8.6], [352.8, 3.0, 17.6], [379, 3.0, 35.9]];
const BAR_S0 = 30, BAR_S1 = 257;
function makeLayout(ctx, mood) {
  const path = makePath(PATH_PTS), L = path.length, N = 220, noise = ctx.noise;
  const px = new Float32Array(N + 1), pz = new Float32Array(N + 1), tx = new Float32Array(N + 1), tz = new Float32Array(N + 1);
  const a = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    path.posAtDist((i / N) * L, a); path.tangentAtDist((i / N) * L, t);
    const hl = Math.hypot(t.x, t.z) || 1; px[i] = a.x; pz[i] = a.z; tx[i] = t.x / hl; tz[i] = t.z / hl;
  }
  const out = { s: 0, lat: 0 };
  // s = metres along the path (below 0 before the entry, above L past the exit); lat = metres to the LEFT of it
  function info(x, z) {
    let best = 1e18, bi = 0;
    for (let i = 0; i <= N; i += 4) { const dx = x - px[i], dz = z - pz[i], d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    const i0 = Math.max(bi - 4, 0), i1 = Math.min(bi + 4, N);
    for (let i = i0; i <= i1; i++) { const dx = x - px[i], dz = z - pz[i], d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    const dx = x - px[bi], dz = z - pz[bi];
    out.s = (bi / N) * L + dx * tx[bi] + dz * tz[bi]; out.lat = dx * tz[bi] - dz * tx[bi];
    return out;
  }
  // world position of a point s metres along and lat metres left of the path
  function at(s, lat, v = new THREE.Vector3()) {
    path.posAtDist(s, a); path.tangentAtDist(clamp(s, 0, L), t); const hl = Math.hypot(t.x, t.z) || 1;
    return v.set(a.x + (t.z / hl) * lat, 0, a.z - (t.x / hl) * lat);
  }
  const barTop = mood === 2 ? 0.2 : 0.3;
  function barHalf(s) {
    const tt = (s - BAR_S0) / (BAR_S1 - BAR_S0); if (tt <= 0 || tt >= 1) return 0;
    const taper = Math.sqrt(Math.min(1, tt / 0.07, (1 - tt) / 0.1));
    return (5.2 + 7.3 * Math.pow(Math.sin(Math.PI * Math.pow(tt, 0.8)), 0.6) * (0.85 + 0.3 * noise.n2(s * 0.021, 3.3))) * taper;
  }
  const barEdge = (s) => 2.7 + 0.4 * Math.sin(s * 0.09) - 6.4 * sst(106, 126, s) * (1 - sst(214, 232, s)) + 1.3 * sst(230, 237, s) * (1 - sst(250, 256, s));   // near edge, metres left of the path; a notch (the back-pool) before the point
  function heightAt(x, z) {
    const { s, lat } = info(x, z), al = Math.abs(lat);
    const n1 = noise.fbm2(x * 0.03, z * 0.03, 3), n2 = noise.fbm2(x * 0.11 + 7, z * 0.11, 2);
    let h = 0.55 + 0.22 * n1;                                                  // the red flat
    const zc = -19 + 6 * Math.sin(x * 0.013), half = 31 + 5 * n1;             // the channel, 60 m wide
    const wc = lerp(10, 6, sst(L - 45, L - 8, s));                              // the corridor narrows into the flood-cut gap
    const ch = Math.max(1 - sst(half - 7, half + 3, Math.abs(z - zc)), 1 - sst(wc, wc + 8, al));
    h = lerp(h, -0.34 + 0.15 * n2 - 0.85 * sst(0.75, 1.0, ch), ch);
    // low shoals inside the channel, away from the path
    const sh = sst(0.1, 0.55, noise.fbm2(x * 0.045 + 31, z * 0.06, 2)) * sst(8, 15, al) * ch;
    h = Math.max(h, lerp(h, 0.14 + 0.05 * n2, sh));
    // polish 3: no shore is a slab's lip. Outside every bank foot lies a wet apron of mud that slides under the water over 1-4 m,
    // its width wandering, so the waterline is a string of small bays and tongues (d = metres outward from the foot)
    const awN = 2.1 + 1.5 * noise.n2(x * 0.1 + 5.5, z * 0.1) + 0.9 * noise.n2(x * 0.27, z * 0.27 + 8);
    const apron = (d, k) => {
      if (k < 0.02 || d < -1.2) return;
      const aw = Math.max(awN, 0.5) * k + 0.3, t = clamp(d / aw, 0, 1);
      if (d > aw + 1.5) return;
      const ap = 0.13 - 0.3 * Math.pow(t, 0.75) + 0.03 * n2 + 0.035 * noise.n2(x * 0.45 + 3, z * 0.45);
      h = Math.max(h, lerp(h, ap, k * (1 - sst(aw, aw + 1.5, d))));
    };
    // the mudbar on our left
    const hw = barHalf(s);
    if (hw > 0.01) {
      const e = Math.abs(lat - barEdge(s) - hw) / hw + 0.1 * noise.fbm2(x * 0.11, z * 0.11, 3) * Math.min(1, 6 / hw);
      const bar = 1 - sst(1 - 0.8 / hw, 1.0, e);
      h = Math.max(h, lerp(h, mood === 2 ? 0.1 + 0.36 * noise.fbm2(x * 0.085 + 3, z * 0.085, 2) + 0.03 * n2 : barTop + 0.04 * n2, bar));
      apron(barEdge(s) + 0.55 - lat, Math.min(1, hw / 4));
    }
    // polish 3: a mud isthmus across our line at 25-56 m (the entry pool's far shore): we fly low over it between the first sail-backs
    const sj = s + 1.6 * n2 + 0.9 * Math.sin(lat * 0.7);
    const ist = sst(23.5, 26.5, sj) * (1 - sst(55, 58.5, sj)) * (1 - sst(5.4, 6.6, -lat + 0.7 * n2)) * (1 - sst(9, 12, lat));
    h = Math.max(h, lerp(h, barTop + 0.04 * n2, ist));
    apron(Math.max(26.2 - sj, sj - 55.4) + 0.4, (1 - sst(4.5, 7, -lat)) * (1 - sst(7, 10, lat)));
    // a low islet on our right at 84-110 m: the Calamites brake we fly through stands on it and on the bar's lip
    const isl = sst(82, 87, sj) * (1 - sst(107, 112, sj)) * sst(2.9, 4.1, -lat + 0.5 * n2) * (1 - sst(8.5, 11, -lat));
    h = Math.max(h, lerp(h, 0.13 + 0.05 * n2, isl));
    // a last low spit on our left as we swing to the ring: a few sail-backs stand on it against the sun, their rib shadows reaching us
    const spit = Math.max(sst(311, 316, s) * (1 - sst(338, 344, s)), sst(274, 280, s) * (1 - sst(302, 308, s))) * sst(2.5, 3.9, lat + 0.5 * n2) * (1 - sst(9.5, 14, lat));
    h = Math.max(h, lerp(h, barTop + 0.04 * n2, spit));
    apron(3.3 - lat, Math.max(sst(311, 316, s) * (1 - sst(338, 344, s)), sst(274, 280, s) * (1 - sst(302, 308, s))));
    // the cut bank before the bar: a stage 1.4 m high, cut steep on our side
    const bank = sst(-7, -2, s) * (1 - sst(27, 33, s)) * sst(1.8, 2.6, lat + 0.3 * n2) * (1 - sst(16, 24, lat));
    // polish 2: a low red shoal on our right at the entry (horsetails and an Eryops on it), so the opening is not half bare water
    const sho = sst(9, 15, s) * (1 - sst(40, 52, s)) * sst(3.0, 4.6, -lat + 0.5 * n2) * (1 - sst(8.5, 12.5, -lat));
    h = Math.max(h, lerp(h, 0.17 + 0.05 * n2, sho));
    h = Math.max(h, lerp(h, barTop + 0.04 * n2 + 0.7 * sst(8.5, 13, lat), bank));
    apron(2.3 - lat, sst(-7, -2, s) * (1 - sst(27, 33, s)) * (1 - sst(2.5, 4, -lat)));    // polish 2: a low landing at the water's edge (the lit pair stands above its own reflection), rising behind them
    // mud shelves beside the gate: the last sail-backs stand on them, either side of the ring
    const shelf = sst(lat > 0 ? L - 52 : L - 26, lat > 0 ? L - 47 : L - 20, s) * sst(4.6, 6.0, al + 0.3 * n2) * (1 - sst(9.5, 12, al));
    h = Math.max(h, lerp(h, barTop - 0.04 + 0.04 * n2, shelf));
    apron(5.4 - al, sst(lat > 0 ? L - 52 : L - 26, lat > 0 ? L - 47 : L - 20, s) * sst(2.2, 3.2, al));
    // a low rise on the right shore: the grove that hides the ring until we turn toward it
    const gx = (x - 305) / 13, gz = (z - 17) / 15, gr = Math.exp(-gx * gx - gz * gz);
    h = Math.max(h, lerp(h, 0.7 + 0.1 * n2, sst(0.3, 0.7, gr)));
    // levees: the west one 40 m to our right with a flood-cut gap at the exit, the east one far to the left
    const zw = 39 + 3 * Math.sin(x * 0.021), dw = (z - zw) / 6.5;
    h += 3.2 * Math.exp(-dw * dw) * sst(8.5, 14, al) * (0.8 + 0.3 * n1);
    const ze = -262 + 14 * Math.sin(x * 0.008 + 1), de = (z - ze) / 16;
    h += 4.5 * Math.exp(-de * de) + 1.2 * sst(40, 110, z - zw);
    return h;
  }
  return { path, L, info, at, heightAt, barHalf, barEdge, barTop };
}

// The ground: one displaced grid, fine in the channel and coarse toward the levees. Cracked into plates in the shader.
async function makeGround(ctx, U, lay) {
  const xs = [], zs = [];
  for (let x = -110; x < -30; x += 16) xs.push(x);
  for (let x = -30; x < 9; x += 3) xs.push(x);
  for (let x = 9; x < 117; x += 2) xs.push(x);
  for (let x = 117; x <= 420; x += 3) xs.push(x);
  for (let x = 436; x <= 900; x += 40) xs.push(x);
  for (let z = -340; z < -70; z += 22) zs.push(z);
  for (let z = -70; z < -52; z += 3) zs.push(z);
  for (let z = -52; z < -36; z += 1.3) zs.push(z);
  for (let z = -36; z < 8; z += 0.86) zs.push(z);
  for (let z = 8; z < 16; z += 1.6) zs.push(z);
  for (let z = 16; z <= 46; z += 2.5) zs.push(z);
  for (let z = 50; z <= 62; z += 4) zs.push(z);
  for (let z = 80; z <= 200; z += 40) zs.push(z);
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0, k = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++, k++) { pos[k * 3] = xs[i]; pos[k * 3 + 1] = lay.heightAt(xs[i], zs[j]); pos[k * 3 + 2] = zs[j]; }
    await ctx.yield();
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  await ctx.yield(); geo.computeVertexNormals(); await ctx.yield();
  const mat = share(share(new THREE.ShaderMaterial({
    uniforms: { uMud: { value: LIN('#9C4A32') }, uGreen: U.uGreen, uWet: { value: lay.barTop < 0.25 ? 1 : 0 } },
    vertexShader: /* glsl */`
      varying vec3 vW, vN;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMud, uGreen; uniform float uWet; varying vec3 vW, vN;
      ${COMMON_GLSL}
      ${SKY_GLSL}
      // distance from the nearest plate edge of a Voronoi tiling, and the plate's id
      float vorE(vec2 p, out float id) {
        vec2 ip = floor(p), fp = fract(p); float f1 = 9.0, f2 = 9.0; id = 0.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)), c = o + vec2(h21(ip + o), h21(ip + o + 17.3)) * 0.8 + 0.1 - fp;
          float d = dot(c, c);
          if (d < f1) { f2 = f1; f1 = d; id = h21(ip + o + 3.1); } else if (d < f2) { f2 = d; }
        }
        return sqrt(max(f2, 0.0)) - sqrt(max(f1, 0.0));
      }
      void main() {
        vec3 Ng = normalize(vN + vec3(0.0, 1e-4, 0.0));
        float steep = 1.0 - smoothstep(0.72, 0.94, Ng.y);                      // cut banks and levee flanks
        vec2 gx = vW.xz + vW.y * vec2(0.9, 1.3);                                // slopes are not smeared: the pattern also runs with height
        vec2 p = gx * 2.5 + vec2(vn(gx * 0.9), vn(gx * 0.9 + 5.0)) * 0.7;
        float fw = max(fwidth(p.x), fwidth(p.y));
        float id, id2, id3, e = vorE(p, id), e2 = vorE(p * 2.7 + 13.0, id2), e3 = vorE(p * 0.43 + 31.0, id3);
        float lod = 1.0 - smoothstep(0.25, 0.9, fw);
        float yS = vW.y + shoreWig(vW.xz) * (1.0 - smoothstep(0.25, 0.5, fwidth(vW.x) + fwidth(vW.z)));
        float dry = mix(smoothstep(0.07, 0.2, yS), smoothstep(0.0, 0.06, yS), uWet);      // after rain the plates stand in a film of water, their cracks brimming
        // the mud is not one tile: cracked plates in patches (large slabs here, fine crazing there), smooth silt pans between
        float pa = vn(vW.xz * 0.27 + 11.0) + 0.3 * vn(vW.xz * 1.1), pb = vn(vW.xz * 0.19 + 70.0);
        float cm = max(0.5 + 0.5 * smoothstep(0.6, 0.8, pa), uWet * 0.85) * (1.0 - steep);      // polish 4: plates everywhere (bold here, fainter in the silt pans): no smooth smear at the lens
        float dryC = mix(0.6, 1.0, dry) * smoothstep(-0.16, -0.03, yS);      // the cracks run on down the wet apron and under the first centimetres of clear water
        float cmBig = smoothstep(0.55, 0.7, pb) * (1.0 - smoothstep(0.5, 0.64, pa)) * (1.0 - steep);
        float lod3 = (1.0 - smoothstep(0.5, 1.6, fw)) * cmBig * dry;
        lod *= cm;
        float lod2 = (1.0 - smoothstep(0.1, 0.4, fw * 2.7)) * mix(0.45, 1.0, smoothstep(0.56, 0.76, pa)) * dryC * (1.0 - steep);
        float crack = max((1.0 - smoothstep(0.012, 0.03 + fw, e)) * lod * dryC, 0.75 * (1.0 - smoothstep(0.008, 0.04 + fw * 2.7, e2)) * lod2);
        crack = max(crack, (1.0 - smoothstep(0.01, 0.03 + fw * 0.43, e3)) * lod3);
        // polish 3: seen close, a big slab is not a smooth cell: hairline crazing inside it, and grit everywhere
        // ... and seen from afar or at a grazing angle the bar is not a smooth smear: great polygons 2.5 m across take over as the fine ones fade
        float id4, e4 = vorE(p * 0.16 + 50.0, id4);
        float lod4 = (1.0 - smoothstep(1.5, 5.0, fw)) * smoothstep(0.1, 0.4, fw) * smoothstep(0.0, 0.12, yS) * (1.0 - steep);
        crack = max(crack, 0.7 * (1.0 - smoothstep(0.008, 0.035 + fw * 0.3, e4)) * lod4);
        float nearK = 1.0 - smoothstep(0.03, 0.14, fw);
        crack = max(crack, 0.5 * (1.0 - smoothstep(0.006, 0.03 + fw * 2.7, e2)) * (1.0 - smoothstep(0.1, 0.4, fw * 2.7)) * cmBig * dry);
        float grit = (vn(vW.xz * 41.0) - 0.5) * 0.3 + (vn(vW.xz * 97.0 + 3.0) - 0.5) * 0.24;
        float curl = smoothstep(0.1, 0.45, e) * lod * dry;
        // strandlines: as the pool shrinks it leaves fine lines of silt that follow every bay and tongue of the waterline
        float sl = yS * 36.0 + 1.3 * vn(vW.xz * 0.5 + 3.0) + 0.5 * vn(vW.xz * 2.3), fsl = fwidth(sl);
        float slK = (1.0 - smoothstep(0.3, 0.9, fsl)) * smoothstep(-0.05, -0.01, yS) * (1.0 - smoothstep(0.07, 0.15, yS)) * (1.0 - steep) * (1.0 - uWet) * (0.35 + 0.65 * smoothstep(0.3, 0.7, vn(vW.xz * 0.35 + 60.0)));
        float strand = (1.0 - smoothstep(0.04, 0.07 + fsl, abs(fract(sl) - 0.5))) * slK;
        float strandP = (1.0 - smoothstep(0.03, 0.06 + fsl, abs(fract(sl + 0.16) - 0.5))) * slK;
        float wet = 1.0 - smoothstep(0.0, 0.25, yS);                             // the apron darkens gradually toward the water: no hard band
        float edgeL = smoothstep(0.06, 0.13, e) * (1.0 - smoothstep(0.15, 0.36, e)) * lod * dry;      // plates curl up pale at their edges
        float big = vn(vW.xz * 0.07), mid = vn(vW.xz * 0.6);
        vec3 mud = uMud * vec3(0.86, 1.36, 1.6);                                // red-brown terracotta, not crimson
        vec3 alb = mud * (0.74 + 0.42 * id * lod * dry + 0.22 * (id3 - 0.5) * lod3 + 0.42 * (id4 - 0.5) * lod4 + 0.2 * mid + 0.3 * (big - 0.5)) * mix(1.0, 0.82, curl * 0.5);
        alb = mix(alb, mud * vec3(1.4, 1.6, 1.7) + 0.02, edgeL * 0.7);
        alb *= (0.86 + 0.28 * vn(vW.xz * 9.0) * (1.0 - smoothstep(0.1, 0.5, fw))) * (1.0 + 0.3 * (id2 - 0.5) * lod2) * (1.0 + grit * nearK);
        float edge3 = smoothstep(0.02, 0.05, e3) * (1.0 - smoothstep(0.06, 0.15, e3)) * lod3;
        alb = mix(alb, mud * vec3(1.4, 1.6, 1.7) + 0.02, edge3 * 0.45);
        // silt pans: paler, with faint ripple marks and drift lines left by the falling water
        float pan = (1.0 - smoothstep(0.42, 0.62, pa)) * (1.0 - cmBig) * dry * (1.0 - steep);
        float rip = sin((vW.x * 0.6 + vW.z) * 9.0 + 3.0 * vn(vW.xz * 0.8)) * 0.5 + 0.5;
        alb = mix(alb, mud.rgb * vec3(1.15, 1.45, 1.5) * (0.82 + 0.16 * rip * (1.0 - smoothstep(0.05, 0.3, fw))), pan * 0.55);
        float drift = 1.0 - smoothstep(0.0, 0.035, abs(fract(vW.y * 9.0 + 0.25 * vn(vW.xz * 0.5)) - 0.5));
        alb *= 1.0 - 0.13 * drift * smoothstep(0.12, 0.2, vW.y) * (1.0 - smoothstep(0.24, 0.3, vW.y));
        alb = mix(alb, uGreen * 0.5, 0.35 * smoothstep(0.62, 0.8, vn(vW.xz * 0.23 + 40.0)) * smoothstep(0.35, 0.6, vW.y) * (1.0 - steep)); // moss on the flat
        // bedding in the cut banks: the Red Beds, layer on layer
        float bed = vn(vec2(vW.y * 11.0, (vW.x + vW.z) * 0.8)) * 0.7 + 0.3 * vn(vec2(vW.y * 31.0, vW.x * 1.7));
        float ledge = smoothstep(0.0, 0.22, fract(vW.y * 4.3 + 0.35 * vn(vW.xz * 0.45)));
        alb = mix(alb, mix(mud * 0.5, mud * vec3(1.5, 1.9, 2.0), smoothstep(0.4, 0.62, bed)) * (0.35 + 0.65 * ledge) * (0.7 + 0.5 * vn(vec2((vW.x - vW.z) * 2.6, vW.y * 0.9))), steep * 0.9);   // ledges, and rills down the face
        // trackways: two lines of five-toed prints wander down the bar
        float tk = 0.0;
        for (int k = 0; k < 2; k++) {
          float fk = float(k), z0 = -7.5 - 6.5 * fk - (0.105 + 0.02 * fk) * (vW.x - 60.0) + 2.2 * sin(vW.x * 0.07 + fk * 2.0);
          float cell = floor(vW.x / 0.6), side = mod(cell, 2.0) * 2.0 - 1.0;
          vec2 dq = vec2((fract(vW.x / 0.6) - 0.5) * 0.6, vW.z - z0 - side * 0.34) / vec2(0.13, 0.11);
          tk = max(tk, 1.0 - smoothstep(0.55, 1.0, length(dq)));
        }
        tk *= dry * (1.0 - smoothstep(0.02, 0.12, fwidth(vW.x))) * step(0.2, vW.y) * (1.0 - step(0.5, vW.y));
        // puddles in the hollows of the bar: the last of the water, mirroring the sky
        float pdn = vn(vW.xz * 1.0 + 23.0) + 0.14 * vn(vW.xz * 2.6 + 4.0);
        float flatBar = smoothstep(0.2, 0.24, vW.y) * (1.0 - smoothstep(0.42, 0.5, vW.y)) * (1.0 - steep);
        float pud = smoothstep(0.75, 0.772, pdn) * flatBar, damp = smoothstep(0.705, 0.75, pdn) * flatBar;
        float pudRim = smoothstep(0.728, 0.744, pdn) * (1.0 - smoothstep(0.748, 0.762, pdn)) * flatBar * (1.0 - uWet);      // a pale ring of dried silt round each puddle: an edge, not a blur
        crack *= 1.0 - pud;
        alb = mix(alb, mud * vec3(0.24, 0.2, 0.24), max(max(crack, wet * wet * mix(0.34, 0.45, uWet)), max(damp * 0.3, tk * 0.6)));
        alb *= 1.0 - 0.3 * strand;
        alb = mix(alb, mud * vec3(1.5, 1.85, 1.95) + 0.02, max(0.3 * strandP * (1.0 - crack), 0.55 * pudRim));
        // low relief the raking light can catch: swells a few metres across, hummocks under a metre, never flat as a floor
        vec2 qa = vW.xz * 0.5 + 3.0, qb = vW.xz * 1.9 + 11.0;
        vec2 rl = vec2(vn(qa + vec2(0.3, 0.0)) - vn(qa - vec2(0.3, 0.0)), vn(qa + vec2(0.0, 0.3)) - vn(qa - vec2(0.0, 0.3)));
        vec2 rs = vec2(vn(qb + vec2(0.3, 0.0)) - vn(qb - vec2(0.3, 0.0)), vn(qb + vec2(0.0, 0.3)) - vn(qb - vec2(0.0, 0.3)));
        vec3 relief = (vec3(rl.x, 0.0, rl.y) * 0.3 + vec3(rs.x, 0.0, rs.y) * 0.2 * (1.0 - smoothstep(0.3, 1.2, fw))) * (1.0 - steep) * smoothstep(0.02, 0.2, yS);
        vec3 N = normalize(Ng - relief + vec3(grit, 0.0, grit * 0.7 - 0.1 * grit) * 0.5 * nearK + vec3(vn(vW.xz * 3.0) - 0.5, 0.0, vn(vW.xz * 3.0 + 9.0) - 0.5) * 0.25 * lod + vec3(id2 - 0.5, 0.0, fract(id2 * 7.3) - 0.5) * 0.35 * lod2 + vec3(id - 0.5, 0.0, fract(id * 5.3) - 0.5) * 0.3 * curl);
        float lit = litAt(vW.y);
        // shade: cool sky from above plus a little of the dawn band; sun: a raking warm wash that catches every curled edge
        float toDawn = dot(N.xz, uSunAz);                                        // before the sun, the dawn band itself models the relief
        vec3 col = alb * (hemiAt(N) * 0.7 + mix(uRoseC, vec3(0.5, 0.36, 0.3), 0.6) * (0.36 + 0.08 * uProg) * clamp(1.0 + 2.2 * toDawn, 0.45, 1.7));
        col += alb * mix(uSunColor, vec3(1.0, 0.74, 0.52), 0.4) * uSunI * lit * (0.17 + 3.2 * clamp(dot(N, uSunDir) + 0.02, 0.0, 0.4) + 0.5 * edgeL) * (1.0 - 0.6 * crack);     // a warm wash, not pure red on red
        float lipSheen = 0.0;
        vec3 Vg = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
        float gl = 1.0 - clamp(Vg.y, 0.0, 1.0); gl *= gl;
        // after rain the plates are dark and glazed: they hold the sky at a low angle
        col = mix(col, col * 0.72 + uSky * uHemiW * 0.16 * gl * gl, uWet * (1.0 - 0.6 * crack));
        vec2 pr = (vec2(vn(vW.xz * 2.3 + uTime * 0.25), vn(vW.xz * 2.3 + 7.0 - uTime * 0.2)) - 0.5) * 0.05;
        vec3 R = normalize(vec3(-Vg.x + pr.x, abs(Vg.y) + 0.03, -Vg.z + pr.y));
        vec3 mir = skyBase(vec3(R.x, min(R.y, 0.45), R.z)) + sunGlow(R) * 0.6;
        col = mix(col, mix(col * 0.8, mir * 0.7, 0.3 + 0.7 * gl), max(pud, uWet * crack * 0.85));      // looked down into, a puddle shows its bed, not a black hole
        // wet mud by the water is glossy: it holds the sky at a low angle, in broken patches, and a pale line of silt marks the edge
        float gloss = wet * wet * (0.08 + 0.45 * gl) * (0.55 + 0.45 * vn(vW.xz * 2.1 + 17.0)) * (1.0 - uWet) * (1.0 - 0.75 * crack) * (1.0 - 0.6 * strand);
        col = mix(col, mir * 0.7, gloss);
        float scum = (1.0 - smoothstep(0.0, 0.016, abs(yS - 0.02))) * smoothstep(0.3, 0.6, vn(vW.xz * 2.7 + 5.0)) * (1.0 - smoothstep(0.02, 0.12, fwidth(vW.x) + fwidth(vW.z)));
        col += (uSky * 0.6 + uRoseC * 0.4) * uHemiW * 0.07 * scum;
        col = mix(col, mistFade(col, vec3(vW.x, max(vW.y, 0.0), vW.z), 0.3), 0.12);
        gl_FragColor = vec4(haze(col, vW), 1.0);
      }`,
  }), U), U, SKY_U);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'ground'; mesh.frustumCulled = false;
  return { mesh, xs, zs, pos };
}

// ---------------------------------------------------------------------------------------------------------------
// Sky: slate zenith and west, a rose band along the east that grows with u, four ember-bellied cloud bars, two last
// stars, and (after u 0.5) a soft flattened peach sun in river haze. skyBase() is shared with the water's mirror.
const SKY_U = ['uZen', 'uMidSky', 'uRoseC', 'uPeachC', 'uProg', 'uBandGain', 'uSunVis', 'uSunUp'];
const SKY_GLSL = /* glsl */`
uniform vec3 uZen, uMidSky, uRoseC, uPeachC, uSunVis; uniform float uProg, uBandGain, uSunUp;
vec3 skyBase(vec3 d) {
  float e = max(d.y, 0.0);
  vec2 h = d.xz / max(length(d.xz), 1e-4);
  float ca = dot(h, uSunAz), east = smoothstep(-0.4, 1.0, ca);
  vec3 c = mix(uMidSky, uZen, smoothstep(0.02, 0.62, e));
  c = mix(c, uZen * 0.85, (1.0 - east) * 0.6);
  float bh = mix(0.13, 0.27, uProg);
  float band = exp(-e / bh * 2.3) * east * east;
  float core = exp(-e / bh * 5.5) * (0.3 + 0.7 * uProg) * smoothstep(0.2, 1.0, ca);
  vec3 warm = mix(uRoseC, uPeachC, core);
  c = mix(c, warm * uBandGain * (1.0 + 0.5 * core), band * (0.8 + 0.2 * uProg));
  float hz = exp(-e * 9.0);                                   // the whole horizon glows before sunrise: lilac-rose even in the west
  c = mix(c, mix(uRoseC, uPeachC, 0.3) * (0.62 + 0.3 * uProg), hz * (0.34 + 0.3 * east) * mix(1.0, 0.25 + 0.75 * east, uProg));
  // away from the dawn: the belt of rose above the earth's own blue shadow, which sinks as the sun comes up
  float belt = exp(-(e - 0.13) * (e - 0.13) * 160.0) * (1.0 - east) * smoothstep(0.35, 0.9, uProg);
  c = mix(c, mix(uRoseC, uMidSky, 0.35) * 0.95, belt * 0.5);
  c = mix(c, uZen * 0.9 + uMidSky * 0.12, exp(-e * 22.0) * (1.0 - east) * smoothstep(0.35, 0.9, uProg) * 0.75);
  // the place where the sun will rise: a tall soft fan of peach light standing over the levee from the first frame
  float fan = exp(-e * 5.0) * pow(max(ca, 0.0), 24.0);
  c += uPeachC * vec3(1.0, 0.78, 0.6) * fan * (0.22 + 0.5 * uProg);
  return mix(hazeCol(d), c, smoothstep(0.0, 0.05, e));
}
vec3 cloudLite(vec3 d, vec3 c) {
  vec2 h = d.xz / max(length(d.xz), 1e-4);
  float ca = dot(h, uSunAz), sa = h.x * uSunAz.y - h.y * uSunAz.x, az = atan(sa, ca + 1e-5), e = max(d.y, 0.0);
  vec2 q = vec2(az * 1.5 + 3.0, e * 11.0 - az * 0.9);
  float n = vn(q + vec2(0.0, vn(q * 0.6 + 9.0))) * 0.6 + vn(q * vec2(3.1, 2.3) + 4.0) * 0.4;
  float hi = smoothstep(0.5, 0.74, n) * smoothstep(0.1, 0.3, e) * (1.0 - smoothstep(0.62, 0.9, e)) * (1.0 - smoothstep(1.3, 2.7, abs(az)));
  return mix(c, mix(uRoseC, uPeachC, 0.3) * (0.75 + 0.5 * uProg), hi * 0.5 * (0.45 + 0.55 * smoothstep(-0.2, 0.9, ca)));
}
vec3 sunGlow(vec3 d) {
  vec3 q = d - uSunVis; q.y *= 1.4; float r = length(q);
  float disc = 1.0 - smoothstep(0.03, 0.05, r);
  return uPeachC * vec3(1.0, 0.72, 0.5) * uSunUp * (disc * 2.1 + 0.7 * exp(-r * 11.0) + 0.36 * exp(-r * 3.5));
}`;
function makeSky(U, mood, rng) {
  const geo = new THREE.SphereGeometry(1000, 48, 24);
  const mat = share(share(new THREE.ShaderMaterial({
    uniforms: { uCirrus: { value: mood === 1 ? 1 : 0 }, uEmberC: U.uEmber, uStars: { value: 1 }, uSeed: { value: rng() * 20 } },
    vertexShader: /* glsl */`
      varying vec3 vD;
      void main() { vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position = p; }`,
    fragmentShader: /* glsl */`
      uniform float uCirrus, uStars, uSeed; uniform vec3 uEmberC; varying vec3 vD;
      ${COMMON_GLSL}
      ${SKY_GLSL}
      // altocumulus bars: noise stretched along the horizon inside a low window toward the dawn
      float cloudCov(float e, float az) {
        vec2 q = vec2(az * 2.4 + uSeed + uTime * 0.003, e * 34.0 + 0.6 * sin(az * 1.3 + uSeed));
        float n = vn(q + vec2(0.0, vn(q * 0.7 + 5.0) * 1.2)) * 0.65 + vn(q * vec2(2.7, 2.1) + 11.0) * 0.35;
        float win = smoothstep(0.04, 0.075, e) * (1.0 - smoothstep(0.2, 0.3, e)) * (1.0 - smoothstep(0.5, 1.5, abs(az)));
        return smoothstep(0.55, 0.7, n) * win;
      }
      void main() {
        vec3 d = normalize(vD);
        vec3 c = skyBase(d);
        vec2 h = d.xz / max(length(d.xz), 1e-4);
        float ca = dot(h, uSunAz), sa = h.x * uSunAz.y - h.y * uSunAz.x, az = atan(sa, ca + 1e-5), e = d.y;
        // a high veil of cirrus on some mornings: lilac streaks
        float cir = vn(vec2(az * 1.2 + e * 2.0 + uSeed, e * 16.0 - az * 2.5)) * vn(vec2(az * 3.0 - e * 4.0, e * 44.0 + az * 6.0 + uSeed + uTime * 0.002));
        c += uCirrus * smoothstep(0.1, 0.55, cir) * smoothstep(0.12, 0.35, e) * (1.0 - smoothstep(0.5, 0.95, e)) * mix(uMidSky, uRoseC, 0.5 + 0.4 * ca) * 0.2;
        // cloud bars, lit ember from beneath, brightening with u
        float cv = cloudCov(e, az), cvB = cloudCov(e - 0.011, az);
        vec3 under = mix(uEmberC, uPeachC, 0.25 + 0.5 * uProg) * (0.7 + 1.0 * uProg);
        vec3 topc = mix(uZen, uRoseC, 0.3) * 0.75;
        vec2 q2 = vec2(az * 1.5 + uSeed * 1.7 + uTime * 0.002, e * 11.0 - az * 0.9);
        float n2 = vn(q2 + vec2(0.0, vn(q2 * 0.6 + 9.0))) * 0.6 + vn(q2 * vec2(3.1, 2.3) + 4.0) * 0.4;
        float hi = smoothstep(0.54, 0.74, n2) * smoothstep(0.2, 0.36, e) * (1.0 - smoothstep(0.62, 0.9, e)) * (1.0 - smoothstep(1.3, 2.7, abs(az)));
        float hiB = smoothstep(0.54, 0.74, vn(q2 + vec2(0.0, vn(q2 * 0.6 + 9.0)) + vec2(0.0, -0.25)) * 0.6 + vn(q2 * vec2(3.1, 2.3) + 4.0) * 0.4);
        c = mix(c, mix(mix(uZen, uMidSky, 0.5) * 0.9, mix(uRoseC, uPeachC, 0.3) * (0.75 + 0.5 * uProg), clamp(0.25 + (hi - hiB * 0.7) * 1.5, 0.0, 1.0) * (0.45 + 0.55 * smoothstep(-0.2, 0.9, ca))), hi * 0.55);
        c = mix(c, mix(topc, under, smoothstep(0.0, 0.45, cv - cvB * 0.85)), cv * 0.92);
        // two last stars in the west
        vec3 s1 = normalize(vec3(-0.55, 0.62, 0.56)), s2 = normalize(vec3(-0.2, 0.45, 0.87));
        float tw = 0.75 + 0.25 * sin(uTime * 3.1);
        c += vec3(0.8, 0.9, 1.0) * uStars * tw * (smoothstep(0.99996, 0.99999, dot(d, s1)) * 2.0 + smoothstep(0.99997, 0.999995, dot(d, s2)) * 1.4);
        c += sunGlow(d) * smoothstep(-0.01, 0.01, e);
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthWrite: false, depthTest: false, side: THREE.BackSide,
  }), U), U, SKY_U);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.name = 'sky';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// Water: the ground grid laid flat, alpha by depth so shores are soft. An analytic mirror of the sky, trembling;
// ripple rings where amphibians sink; and the mirrored silhouettes of the nearest sail-backs (ember above the line).
const RING_N = 6, REF_N = 8;
function makeWater(U, ground, mood) {
  const n = ground.pos.length / 3, pos = new Float32Array(n * 3), dep = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = ground.pos[i * 3]; pos[i * 3 + 2] = ground.pos[i * 3 + 2]; dep[i] = -ground.pos[i * 3 + 1]; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1));
  { const gi = ground.mesh.geometry.index.array, wi = [];
    for (let i = 0; i < gi.length; i += 3) if (dep[gi[i]] > -0.12 || dep[gi[i + 1]] > -0.12 || dep[gi[i + 2]] > -0.12) wi.push(gi[i], gi[i + 1], gi[i + 2]);
    geo.setIndex(wi); }
  const V4 = (k) => Array.from({ length: k }, () => new THREE.Vector4(0, 0, 0, 0));
  const uni = { uRing: { value: V4(RING_N) }, uRefA: { value: V4(REF_N) }, uRefB: { value: V4(REF_N) }, uRefC: { value: V4(REF_N) },
    uMud: { value: LIN('#9C4A32') }, uEmberC: U.uEmber, uWebShade: U.uWebShade, uRipple: { value: mood === 2 ? 0.35 : 1 }, uSmear: { value: mood === 2 ? 1 : 0.55 }, uFresMin: { value: mood === 2 ? 0.62 : 0.16 }, uShore: { value: 0.09 }, uRefMaxY: { value: mood === 2 ? 0.3 : 1 } };
  const mat = share(share(new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aDepth; varying vec3 vW; varying float vDepth;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vDepth = aDepth; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec4 uRing[${RING_N}], uRefA[${REF_N}], uRefB[${REF_N}], uRefC[${REF_N}];
      uniform vec3 uMud, uEmberC, uWebShade; uniform float uRipple, uSmear, uFresMin, uShore, uRefMaxY;
      varying vec3 vW; varying float vDepth;
      ${COMMON_GLSL}
      ${SKY_GLSL}
      void main() {
        vec3 Vd = cameraPosition - vW; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-4);
        vec2 rp = vW.xz * 1.7 + uTime * 0.3;
        vec2 dn = (vec2(vn(rp), vn(rp + 9.1)) - 0.5) * 0.075 * uRipple + (vec2(vn(rp * 0.23 + 3.0), vn(rp * 0.23 + 7.0)) - 0.5) * 0.03;
        float paw = smoothstep(0.5, 0.72, vn(vW.xz * vec2(0.045, 0.2) + vec2(uTime * 0.02, 3.0)));     // patches of faint breeze
        dn += (vec2(vn(rp * 3.1 + 2.0), vn(rp * 3.1 + 6.0)) - 0.5) * 0.14 * paw * uRipple;
        float glint = 0.0;
        vec3 Rm = normalize(vec3(-V.x + dn.x * 0.5, abs(V.y) + 0.02, -V.z + dn.y * 0.5));      // the sails' mirror trembles; it is not torn by the rings
        float dS = max(vDepth, -1.0) - shoreWig(vW.xz);
        for (int i = 0; i < ${RING_N}; i++) {
          vec2 dv = vW.xz - uRing[i].xy; float r = length(dv), age = uRing[i].z, front = 0.2 + age * 1.0;
          float x1 = (r - front) / 0.13, x2 = (r - front * 0.55) / 0.1;
          float w = (exp(-x1 * x1) + 0.6 * exp(-x2 * x2)) * uRing[i].w * exp(-age * 0.45);
          dn += dv / max(r, 1e-3) * w * 0.2 * sin((r - front) * 30.0);
          glint += w;
        }
        vec3 R = normalize(vec3(-V.x + dn.x, abs(V.y) + 0.02, -V.z + dn.y));
        vec3 Rs = vec3(R.x, min(R.y, uRefMaxY), R.z);  // after rain the still sheet holds the pale low sky, not the dark zenith
        vec3 sky = cloudLite(Rs, skyBase(Rs)) + sunGlow(R) * (0.45 + 0.9 * vn(rp * vec2(1.6, 6.0))), refC = vec3(0.0); float refA = 0.0;
        // the far shores stand in the water too: a dark ragged band of levee and conifers under the horizon's glow
        vec2 rh = R.xz / max(length(R.xz), 1e-4);
        float raz = atan(rh.y, rh.x + 1e-5), shoreH = 0.03 + 0.035 * vn(vec2(raz * 46.0, 3.0)) * vn(vec2(raz * 9.0, 7.0));
        sky = mix(sky, mix(vec3(0.02, 0.03, 0.035) * uHemiW, hazeCol(R), 0.3), (1.0 - smoothstep(shoreH, shoreH + 0.012, R.y)) * 0.8);
        // the sun's road on the water: a broken path of peach glitter toward the sunrise
        float ga = max(dot(rh, uSunAz), 0.0), road = pow(ga, 70.0) * (1.0 - smoothstep(0.03, 0.45, R.y));
        float spark = smoothstep(0.5, 0.85, vn(vW.xz * vec2(1.7, 6.0) + uTime * vec2(0.25, 0.8)));
        sky += uPeachC * vec3(1.0, 0.68, 0.42) * uSunUp * road * (0.3 + 2.4 * spark);
        float bk = max(dot(-V.xz / max(length(V.xz), 1e-3), uSunAz), 0.0), bl = 0.3 + 0.7 * bk * bk;
        // mirrored sail-backs: ray against each animal's upright plane, the fan profile of the rib-shadow shader
        for (int i = 0; i < ${REF_N}; i++) {
          vec4 A = uRefA[i], B = uRefB[i], C = uRefC[i]; float uSmearK = clamp((uSmear - 0.55) / 0.45, 0.0, 1.0);
          float cy = cos(A.z), sy = sin(A.z); vec2 ax = vec2(cy, -sy), nr = vec2(sy, cy);
          float dnr = dot(nr, Rm.xz); dnr = abs(dnr) < 1e-3 ? 1e-3 : dnr;
          float t = dot(nr, A.xy - vW.xz) / dnr;
          vec2 hit = vW.xz + Rm.xz * t;
          float sc = max(B.w, 0.1), xl = dot(ax, hit - A.xy) / sc, wy = t * Rm.y, hp = (wy - C.z) / sc;
          float s = (xl - C.x) / max(C.y - C.x, 0.1), soft = 0.035 + t * 0.012;
          float bodyH = 0.47 * smoothstep(-0.6, -0.05, s) * (1.0 - smoothstep(1.08, 1.38, s));
          float scl = clamp(s, 0.0, 1.0), w = scl < B.y ? 0.5 * scl / max(B.y, 1e-3) : 0.5 + 0.5 * (scl - B.y) / max(1.0 - B.y, 1e-3);
          float prof = B.x * (0.13 + 0.87 * pow(max(sin(3.14159 * w), 0.0), B.z));
          float inS = smoothstep(-0.03, 0.03, s) * (1.0 - smoothstep(0.97, 1.03, s));
          float sail = inS * (1.0 - smoothstep(prof - soft, prof + soft, hp - 0.44)) * smoothstep(0.38, 0.46, hp);
          float sb = min(soft, 0.1);
          float body = (1.0 - smoothstep(bodyH - sb, bodyH + sb, hp)) * smoothstep(0.1, 0.3, hp) * smoothstep(-0.65, -0.45, s) * (1.0 - smoothstep(1.2, 1.4, s));
          float du = abs(fract(s * mix(21.0, 25.0, C.w) + 0.5) - 0.5), rib = 1.0 - smoothstep(0.1, 0.32, du);
          vec3 web = mix(uWebShade * (uSky * 1.1 + uRoseC * 0.9) * (1.0 - 0.7 * rib), uEmberC * mix(0.08 + 0.3 * bk * bk, 0.4 + 0.7 * bk * bk, uSmearK) * (1.0 - mix(0.75, 0.7, uSmearK) * rib), litAt(wy) * step(0.5, uSunI * 10.0));
          vec3 c = mix(web, vec3(0.1, 0.075, 0.075) * hemiAt(vec3(0.0, 0.2, 0.0)), body);
          float cov = max(sail, body) * step(0.0, t) * A.w * (1.0 - smoothstep(4.0, 7.5, t)) * (1.0 - smoothstep(0.45, 0.75, abs(V.y)));      // only beside its owner: a detached red patch reads as a stain
          refC = mix(refC, c, cov); refA = max(refA, cov);
        }
        float uSmearK = clamp((uSmear - 0.55) / 0.45, 0.0, 1.0);
        sky = mix(sky, refC, refA * 0.7);
        float fres = uFresMin + (1.0 - uFresMin) * pow(1.0 - clamp(abs(V.y), 0.0, 1.0), 3.0);      // near water shows its dark bed, far water mirrors
        vec3 bed = (uMud * vec3(0.8, 1.5, 2.0) * (0.3 + 0.5 * exp(-vDepth * 6.0)) + uSky * 0.2) * hemiAt(vec3(0.0, 1.0, 0.0)) * 0.8 * (0.7 + 0.45 * vn(vW.xz * 1.7 + 3.0) + 0.25 * vn(vW.xz * 6.0));
        vec3 col = mix(bed, sky * 0.86, fres) * (0.9 + 0.2 * vn(rp * vec2(0.35, 1.3)));
        col = mix(col, refC * 0.85, refA * mix(0.22, 0.6, uSmearK));
        col += uSky * glint * 0.3 * uHemiW;
        col = mix(col, mistFade(col, vW, 0.0), 0.14);
        float a = smoothstep(0.0, uShore, dS) * mix(0.34 + 0.66 * smoothstep(0.04, 0.34, dS), 1.0, fres);
        a = max(a, refA * 0.85 * smoothstep(0.0, uShore, dS));       // a mirrored sail holds even in the clear shallows
        gl_FragColor = vec4(haze(col, vW), a);
      }`,
  }), U), U, SKY_U);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 1; mesh.frustumCulled = false; mesh.name = 'water';
  return { mesh, uni };
}

// Mist: noise-scrolled sheets over water and bar, thinned around the camera (so the pools beside the path read),
// blue in shade and peach once the sun line reaches the mist top.
function makeMist(U, detail, mistTop) {
  const ys = detail < 0.8 ? [0.5, 0.78] : [0.38, 0.62, 0.86], pos = [], lay = [], idx = [];
  ys.forEach((f, k) => {
    const y = 0.3 + mistTop * f * 1.05, o = pos.length / 3;
    pos.push(-260, y, -330, 640, y, -330, 640, y, 110, -260, y, 110); lay.push(k, k, k, k); idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 1)); geo.setIndex(idx);
  const mat = share(new THREE.ShaderMaterial({
    uniforms: { uRoseC: U.uRoseC, uPeachC: U.uPeachC, uProg: U.uProg }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aLayer; varying vec3 vW; varying float vLayer;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vLayer = aLayer; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRoseC, uPeachC; uniform float uProg; varying vec3 vW; varying float vLayer;
      ${COMMON_GLSL}
      void main() {
        vec2 p = vW.xz * 0.16 + vec2(uTime * 0.045, uTime * 0.012) * (1.0 + vLayer * 0.35) + vLayer * 7.3;
        float n = vn(p) * 0.5 + vn(p * 2.3 + 3.0 + uTime * 0.05) * 0.28 + vn(p * 5.1 + vec2(uTime * 0.2, -uTime * 0.07)) * 0.22;
        float big = vn(vW.xz * 0.055 + vec2(uTime * 0.012, 3.0) + vLayer * 3.1);
        float a = 0.7 * smoothstep(0.45, 0.74, n * 0.62 + big * 0.62) * (1.0 - vLayer * 0.2) * (1.0 - 0.72 * smoothstep(0.56, 0.74, uProg));
        vec3 dv = vW - cameraPosition; float dist = length(dv);
        a *= smoothstep(6.0, 14.0, length(dv.xz));
        float steepV = abs(dv.y) / max(dist, 1e-3);
        a *= mix(0.72, 1.0, smoothstep(0.03, 0.2, steepV)) * mix(1.0, 0.22, smoothstep(0.12, 0.42, steepV));     // edge-on the sheets must not add up to a wall; looked down into, mist is thin
        a *= (1.0 - 0.4 * smoothstep(30.0, 100.0, dist)) * mix(1.0, 0.4, smoothstep(2.4, 5.0, cameraPosition.y));
        a = min(a + smoothstep(60.0, 220.0, dist) * 0.18 * (0.4 + 0.6 * n), 0.6);
        vec3 lit = mix(uRoseC, uPeachC, 0.55 + 0.3 * n) * (0.5 + 0.35 * n) * (0.7 + 0.6 * max(dot(dv.xz / max(length(dv.xz), 1e-3), uSunAz), 0.0));
        vec3 col = mix(uMistColor * (0.85 + 0.55 * n), lit, uMistLit * (0.8 + 0.2 * n));
        gl_FragColor = vec4(haze(col, vW), a * uMistAmt);
      }`,
  }), U);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.name = 'mist';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// Plants of the early Permian: Walchia conifers, Calamites canes, horsetail shoots, seed ferns, tree ferns.
// One material: vertex colour, the shared light law, a warm rim above the sun line, a slow nod, joints drawn by height.
// aAnim = (sway weight, height above the plant's foot in m, joint spacing in m (0 none; negative: widen along z), half-width for thin blades)
// mirror = true: the same plant turned upside down under the water plane, dimmed and trembling (its reflection)
function plantMaterial(U, mirror = false) {
  return share(new THREE.ShaderMaterial({
    uniforms: { uPix: U.uPix, uGreenGain: U.uGreenGain, uRoseP: U.uRoseC, uMirror: { value: mirror ? -1 : 1 } },
    vertexColors: true, side: THREE.DoubleSide, transparent: mirror, depthWrite: !mirror,
    vertexShader: /* glsl */`
      attribute vec4 aAnim; attribute vec3 aI;     // aI: tint, phase, sway scale
      uniform float uTime, uPix, uMirror;
      varying vec3 vW, vN, vCol; varying vec3 vK; varying float vWy;
      void main() {
        mat4 M = modelMatrix * instanceMatrix;
        vec3 p = position;
        vec4 w = M * vec4(p, 1.0);
        float ph = aI.y * 6.283, sw = aAnim.x * aI.z;
        w.x += sw * (0.06 * sin(uTime * 0.7 + ph + w.z * 0.2) + 0.025 * sin(uTime * 1.9 + ph * 3.0));
        w.z += sw * (0.05 * sin(uTime * 0.53 + ph * 1.7 + w.x * 0.2));
        float hw = abs(aAnim.w);
        if (hw > 1e-5) {    // thin blades keep ~1.5 px of width
          float dist = distance(w.xyz, cameraPosition), k = clamp(dist * uPix * 0.8 / hw, 1.0, 8.0);
          vec3 off = (aAnim.z < 0.0 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)) * aAnim.w * (k - 1.0);
          w.xyz += mat3(M) * off;
        }
        vWy = w.y; w.y *= uMirror; w.x += (1.0 - uMirror) * 0.012 * sin(uTime * 1.6 + vWy * 7.0 + w.z);
        vW = w.xyz; vN = mat3(M) * normal; vCol = color * (1.0 + aI.x);
        vK = vec3(aAnim.y, abs(aAnim.z), M[3].y);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uGreenGain, uMirror; uniform vec3 uRoseP; varying vec3 vW, vN, vCol; varying vec3 vK; varying float vWy;
      ${COMMON_GLSL}
      void main() {
        vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
        vec3 Vd = cameraPosition - vW; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-4);
        vec3 alb = vCol * vec3(1.0, uGreenGain, 1.0);
        // joints: a dark ring and a pale sheath at every node of a horsetail
        float j = vK.y > 1e-4 ? fract(vK.x / max(vK.y, 1e-3)) : 0.5;
        float fj = fwidth(vK.x / max(vK.y, 1e-3));
        float ring = (1.0 - smoothstep(0.04, 0.1 + fj, min(j, 1.0 - j))) * step(1e-4, vK.y) * (1.0 - smoothstep(0.3, 0.8, fj));
        alb = mix(alb, alb * vec3(0.35, 0.3, 0.3), ring);
        alb *= 0.85 + 0.3 * vn(vW.xz * 7.0 + vW.y * 5.0);
        float lit = litAt(vWy), ndl = dot(N, uSunDir);
        float back = max(dot(-V, uSunDir), 0.0), fr = 1.0 - abs(dot(N, V));
        vec3 sunC = mix(uSunColor, vec3(1.0, 0.8, 0.56), 0.6);
        vec3 col = alb * (hemiAt(N) * 0.9 + sunC * uSunI * lit * (0.12 + 0.5 * clamp(ndl * 0.7 + 0.3, 0.0, 1.0)));
        // translucent green and a warm edge where the sun is behind
        col += sunC * uSunI * lit * (alb * vec3(1.1, 1.3, 0.75) * 0.55 * back * back + vec3(1.0, 0.55, 0.35) * 0.04 * fr * fr * (0.3 + back));
        col += alb * (uRoseP * 0.5 + uSky * 0.5) * 0.5 * back * back * uHemiW * 0.5;             // before the sun: the dawn band shows through thin green
        col = mix(col, mistFade(col, vec3(vW.x, vWy, vW.z), vK.z), 0.45);
        float under = 0.5 - 0.5 * uMirror;
        if (under > 0.5 && vWy < 0.0) discard;                 // only what stands above the water is mirrored
        gl_FragColor = vec4(haze(col, vW) * (1.0 - 0.7 * under), 1.0 - under * (0.1 + 0.7 * smoothstep(0.3, 2.2, vWy)));
      }`,
  }), U);
}
// a feathered frond: a ribbon from base along dir, arching, with saw-toothed leaflets; fork > 0 splits the tip in two
function frond(g, b, yaw, len, wid, rise, droop, col, colTip, segs, sway, h0, fork = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), L = [], R = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, r = len * t, y = rise * len * t - droop * len * t * t;
    const w = wid * Math.sin(Math.PI * Math.min(0.08 + t * 0.92, 1)) * (i % 2 ? 1 : 0.55) + 0.01;
    const c = mixc(col, colTip, t), a = [sway * t * t, h0 + Math.max(y, 0), 0, 0];
    const x = b[0] + cy * r, z = b[2] + sy * r, yy = b[1] + y + (i % 2 ? -0.06 * wid : 0);
    L.push(g.v(x - sy * w, yy, z + cy * w, c, a)); R.push(g.v(x + sy * w, yy, z - cy * w, c, a));
    if (i) g.quad(L[i - 1], R[i - 1], R[i], L[i]);
  }
  if (fork > 0) for (const sgn of [-1, 1]) {
    const tipY = b[1] + rise * len - droop * len;
    frond(g, [b[0] + cy * len * 0.72, b[1] + (rise * 0.72 - droop * 0.52) * len, b[2] + sy * len * 0.72], yaw + sgn * 0.5, len * 0.5, wid * 0.75, rise * 0.4, droop * 0.9, col, colTip, 4, sway, h0 + Math.max(tipY - b[1], 0) * 0.7, 0);
  }
}
function walchiaGeo(rnd, far = false) {
  const g = GB(), bark = rgb('#3A2A24'), dk = rgb('#2F4A3A', 0.6), lt = rgb('#3F5E44', 0.8), H = 8;
  g.tube([0, 0.3, 0.62, 1].map((t) => ({ p: [0.12 * Math.sin(t * 3), t * H, 0.08 * Math.sin(t * 4 + 1)], r: lerp(0.2, 0.03, t), c: mixc(bark, dk, t * 0.7), a: [t * t * 0.5, t * H, 0, 0] })), 5);
  const comb = far === 2, tiers = comb ? 6 : far ? 8 : 11;
  for (let k = 0; k < tiers; k++) {
    const t = k / (tiers - 1), y = lerp(1.6, H - 0.25, Math.pow(t, 0.9)), r = lerp(2.5, 0.35, Math.pow(t, 0.8)), nb = comb ? 4 : far ? 5 : k < 7 ? 7 : 5;
    for (let i = 0; i < nb; i++) {
      const yaw = (i / nb) * TAU + k * 0.9 + rnd() * 0.3, len = r * (0.85 + 0.3 * rnd());
      frond(g, [0, y, 0], yaw, len, (0.3 + 0.16 * (1 - t)) * (comb ? 2.1 : far ? 1.5 : 1), 0.02, -0.14, dk, lt, far ? 2 : 4, 0.4 + t * 0.6, y);
      if (k < 9 && !far) frond(g, [0, y + 0.12, 0], yaw + 0.45, len * 0.6, 0.24, 0.22, 0.1, dk, mixc(dk, lt, 0.5), 3, 0.4 + t * 0.6, y);
    }
  }
  return g.build();
}
function calamitesGeo(rnd, near = false) {
  const g = GB(), c0 = rgb('#4E5C48'), c1 = rgb('#727E60'), H = 5, bend = 0.25;
  if (near) {
    // the canes we fly between: a ribbed, jointed stem 0.2 m thick at the foot, a sheath at every joint and a ruff of ten thin
    // branches that rise and droop at their tips, shorter toward the pointed top
    const pts = [], pale = rgb('#A9B67C'), dk = rgb('#39463A');
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push({ p: [bend * t * t, t * H, 0], r: lerp(0.1, 0.022, Math.pow(t, 0.85)), c: mixc(mixc(c0, dk, 0.35), c1, t), a: [t * t, t * H, 0.5, 0] }); }
    g.tube(pts, 6);
    for (let j = 1; j <= 9; j++) {
      const y = j * 0.5, t = y / H, x0 = bend * t * t, n = 9, len = (0.42 + 0.75 * Math.sin(Math.PI * Math.pow(t, 0.75))) * (0.85 + 0.3 * rnd()), r0 = lerp(0.1, 0.022, Math.pow(t, 0.85));
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + j * 0.5 + rnd() * 0.3, ca = Math.cos(an), sa = Math.sin(an), w = 0.04, up = 0.42 + 0.2 * rnd(), ln = len * (0.8 + 0.4 * rnd());
        const a0 = [t * t, y, 0, 0], a1 = [t * t + 0.12, y + ln * 0.4, 0, 0], a2 = [t * t + 0.3, y + ln * 0.5, 0, 0], cb = mixc(c0, c1, 0.5), cm = mixc(c1, pale, 0.35), ct = mixc(c1, pale, 0.8);
        const bx = x0 + ca * r0 * 0.8, bz = sa * r0 * 0.8, mx = x0 + ca * ln * 0.6, mz = sa * ln * 0.6, my = y + ln * up, tx = x0 + ca * ln, tz = sa * ln, ty = y + ln * (up + 0.02);
        const b0 = g.v(bx - sa * w, y, bz + ca * w, cb, a0), b1 = g.v(bx + sa * w, y, bz - ca * w, cb, a0), m0 = g.v(mx - sa * w * 0.75, my, mz + ca * w * 0.75, cm, a1), m1 = g.v(mx + sa * w * 0.75, my, mz - ca * w * 0.75, cm, a1);
        g.quad(b0, b1, m1, m0); g.tri(m0, m1, g.v(tx, ty, tz, ct, a2));
      }
    }
    return g.build();
  }
  const pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push({ p: [bend * t * t, t * H, 0], r: lerp(0.085, 0.025, t), c: mixc(c0, c1, t), a: [t * t, t * H, 0.52, 0] }); }
  g.tube(pts, 4);
  for (let j = 1; j <= 9; j++) {
    const y = j * 0.52, t = y / H, x0 = bend * t * t, n = 5, len = lerp(0.75, 0.3, t), c = mixc(c0, c1, 0.6);
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + j * 0.5, ca = Math.cos(an), sa = Math.sin(an), a0 = [t * t, y, 0, 0], a1 = [t * t + 0.15, y + len * 0.5, 0, 0];
      const b0 = g.v(x0 + ca * 0.03 - sa * 0.025, y, sa * 0.03 + ca * 0.025, c, a0), b1 = g.v(x0 + ca * 0.03 + sa * 0.025, y, sa * 0.03 - ca * 0.025, c, a0);
      g.tri(b0, b1, g.v(x0 + ca * len * 0.8, y + len * 0.62, sa * len * 0.8, c1, a1));
    }
  }
  return g.build();
}
// a clump of knee-high horsetail shoots: leafless jointed blades, each two crossed tapered quads
function shootGeo(rnd) {
  const g = GB(), c0 = rgb('#46523A'), c1 = rgb('#8C9668');
  for (let k = 0; k < 4; k++) {
    const an = rnd() * TAU, rr = Math.sqrt(rnd()) * 0.36, x = Math.cos(an) * rr, z = Math.sin(an) * rr, h = 0.4 + 0.5 * rnd(), lx = (rnd() - 0.5) * 0.14, lz = (rnd() - 0.5) * 0.14, w = 0.013 + 0.006 * rnd();
    for (const ax of [0, 1]) {
      const sg = ax ? -0.09 : 0.09, ox = ax ? 0 : 1, oz = ax ? 1 : 0;
      const a = g.v(x - ox * w, -0.25, z - oz * w, c0, [0, 0, sg, -w]), b = g.v(x + ox * w, -0.25, z + oz * w, c0, [0, 0, sg, w]);
      const c = g.v(x + lx + ox * w * 0.35, h, z + lz + oz * w * 0.35, c1, [1, h, sg, w * 0.35]), d = g.v(x + lx - ox * w * 0.35, h, z + lz - oz * w * 0.35, c1, [1, h, sg, -w * 0.35]);
      g.quad(a, b, c, d);
    }
  }
  return g.build();
}
function seedFernGeo(rnd) {
  const g = GB(), c0 = rgb('#3E5A38'), c1 = rgb('#7A8A4A');
  for (let i = 0; i < 8; i++) frond(g, [0, 0.05, 0], (i / 8) * TAU + rnd() * 0.5, 0.9 + 0.5 * rnd(), 0.22, 1.1 + 0.4 * rnd(), 0.9, c0, c1, 5, 0.5, 0.2, 1);
  return g.build();
}
// a fern frond, not a palm leaf: a thin rachis that arches over, carrying pairs of separate lance-shaped pinnae that shorten to the tip
function pinnaFrond(g, b, yaw, len, wid, rise, droop, col, colTip, pairs, sway, h0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), P = [];
  for (let i = 0; i <= pairs; i++) { const t = i / pairs, r = len * t; P.push([b[0] + cy * r, b[1] + rise * len * t - droop * len * t * t, b[2] + sy * r, t]); }
  for (let i = 1; i <= pairs; i++) {
    const p0 = P[i - 1], p1 = P[i], t = p1[3], c = mixc(col, colTip, t), a0 = [sway * p0[3] * p0[3], h0 + Math.max(p0[1] - b[1], 0), 0, 0], a1 = [sway * t * t, h0 + Math.max(p1[1] - b[1], 0), 0, 0];
    const rw = 0.028 * (1.2 - t);
    g.quad(g.v(p0[0] - sy * rw, p0[1], p0[2] + cy * rw, col, a0), g.v(p0[0] + sy * rw, p0[1], p0[2] - cy * rw, col, a0), g.v(p1[0] + sy * rw, p1[1], p1[2] - cy * rw, c, a1), g.v(p1[0] - sy * rw, p1[1], p1[2] + cy * rw, c, a1));
    const pw = wid * Math.min(t / 0.16, 1) * (1.08 - t) + 0.05, bw = (len / pairs) * 0.3;
    for (const sg of [-1, 1]) {      // one pinna: base on the rachis, tip out to the side, swept toward the frond's tip and hanging a little
      const tipx = p1[0] + sg * -sy * pw + cy * pw * 0.35, tipz = p1[2] + sg * cy * pw + sy * pw * 0.35;
      g.tri(g.v(p1[0] - cy * bw, p1[1] + 0.01, p1[2] - sy * bw, c, a1), g.v(p1[0] + cy * bw, p1[1] + 0.01, p1[2] + sy * bw, c, a1), g.v(tipx, p1[1] - 0.22 * pw, tipz, mixc(c, colTip, 0.6), [a1[0] + 0.1, a1[1], 0, 0]));
    }
  }
}
function treeFernGeo(rnd) {
  // a tree fern, 3 m (polish 2: it read as a stump with arms, then as a cloaked figure): a slender fibrous trunk that flares at the
  // foot, and a wide green umbrella: fourteen broad, deeply cut fronds that rise, arch over and droop below the crown, five lacy
  // young fronds with separate pinnae standing higher, and fiddleheads in the middle. No skirt.
  const g = GB(), tr = rgb('#3A3024'), c0 = rgb('#35603A'), c1 = rgb('#8FA85E'), dead = rgb('#5A4A30'), H = 2.3;
  g.tube([0, 0.1, 0.3, 0.65, 1].map((t) => ({ p: [0.1 * t * t, t * H, 0], r: lerp(0.26, 0.1, Math.pow(t, 0.35)) * (1 + 0.08 * Math.sin(t * 31)), c: mixc(tr, rgb('#56503A'), 0.5 + 0.5 * Math.sin(t * 29)), a: [t * t * 0.2, t * H, 0.07, 0] })), 6);
  // every frond is a thin rachis with close pairs of separate narrow pinnae (a feather of leaflets, never a palm's broad blade)
  for (let i = 0; i < 11; i++) {
    const yaw = i * 2.399 + rnd() * 0.3, len = 1.9 + 0.5 * rnd();
    pinnaFrond(g, [0.1, H - 0.03, 0], yaw, len, 0.55, 0.7 + 0.25 * rnd(), 0.95 + 0.3 * rnd(), c0, c1, 9, 0.8, H);
  }
  for (let i = 0; i < 4; i++) pinnaFrond(g, [0.1, H, 0], i * 1.571 + rnd() * 0.4, 1.3 + 0.3 * rnd(), 0.42, 1.25, 0.8, c0, c1, 6, 0.8, H);
  for (let i = 0; i < 3; i++) {       // croziers: young fronds still curled like the head of a fiddle
    const an = i * 2.1 + rnd(), ca = Math.cos(an), sa = Math.sin(an), pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, cu = t * t * 4.4, r = 0.3 * (1 - 0.75 * t), o = 0.08 + 0.2 * Math.min(t * 2, 1) + (t > 0.5 ? Math.sin(cu) * r * 0.5 : 0); pts.push({ p: [0.1 + ca * o, H + 0.5 * Math.min(t * 2, 1) + (t > 0.5 ? (1 - Math.cos(cu)) * r * 0.4 : 0), sa * o], r: 0.03 * (1 - 0.6 * t), c: mixc(dead, c1, 0.6), a: [0.3, H, 0, 0] }); }
    g.tube(pts, 3);
  }
  return g.build();
}
// instanced plants: list of { x, y, z, yaw, s, sy, tint, sway }
function plantMesh(geo, mat, list, name) {
  const n = Math.max(list.length, 1), mesh = new THREE.InstancedMesh(geo, mat, n), aI = new Float32Array(n * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  list.forEach((p, i) => {
    e.set(p.lean || 0, p.yaw || 0, 0); q.setFromEuler(e); sv.set(p.s || 1, (p.s || 1) * (p.sy || 1), p.s || 1); pv.set(p.x, p.y, p.z);
    m.compose(pv, q, sv); mesh.setMatrixAt(i, m); aI.set([p.tint || 0, p.ph ?? (i * 0.618) % 1, p.sway ?? 1], i * 3);
  });
  mesh.count = list.length; geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 3));
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = name;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// The small cast: Diplocaulus (boomerang-headed amphibian), Eryops (squat 2 m amphibian), Meganeuropsis (griffinfly).
// One material. Head toward +X. aAnim = (tail-wave weight, wing flap sign, breathing weight, 1 = wing membrane).
function critterMaterial(U) {
  return share(new THREE.ShaderMaterial({
    uniforms: { uEmberC: U.uEmber },
    vertexColors: true, side: THREE.DoubleSide, transparent: true,       // drawn after the water and the mist sheets, clipped at the waterline
    vertexShader: /* glsl */`
      attribute vec4 aAnim; attribute vec4 aI;     // aI: phase, ground height for the mist law, wave amount, flap amount
      uniform float uTime;
      varying vec3 vW, vN, vCol, vObj; varying vec3 vK;
      void main() {
        vec3 p = position; float ph = aI.x * 6.283;
        p.z += aAnim.x * aI.z * sin(uTime * 1.6 + ph - p.x * 5.0);
        p += normal * aAnim.z * 0.012 * sin(uTime * 1.3 + ph);
        p.y += aAnim.y * aI.w * abs(p.z) * 0.2 * sin(uTime * 58.0 + ph + aAnim.y * 0.8);
        mat4 M = modelMatrix * instanceMatrix;
        vec4 w = M * vec4(p, 1.0);
        vW = w.xyz; vN = mat3(M) * normal; vCol = color; vObj = position; vK = vec3(aAnim.w, aI.y, aI.x);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uEmberC; varying vec3 vW, vN, vCol, vObj; varying vec3 vK;
      ${COMMON_GLSL}
      void main() {
        if (vW.y < 0.0) discard;
        vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
        vec3 Vd = cameraPosition - vW; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-4);
        float lit = litAt(vW.y), back = max(dot(-V, uSunDir), 0.0), fr = 1.0 - abs(dot(N, V));
        vec3 col; float alpha = 1.0;
        // wing coordinates and their derivatives, taken outside every branch
        float wT = clamp(vCol.r, 0.0, 1.0), wC = clamp(vCol.g, 0.0, 1.0), wfT = fwidth(vCol.r), wfC = fwidth(vCol.g);
        float wCl = pow(wC + 1e-4, 0.8) * 5.0, wRow = floor(wCl), wDl = abs(fract(wCl + 0.5) - 0.5);
        float wDc = abs(fract(wT * 34.0 + wRow * 0.37 + 0.6 * sin(wRow * 2.1)) - 0.5);
        if (vK.x > 0.5) {
          // wing membrane: clear smoky glass carried on a net of dark veins (a stout leading edge, six long veins fanning to the hind margin,
          // a ladder of fine cross-veins between them, a node half-way and a dark stigma near the tip); gold, never white, with the sun behind
          float longV = 1.0 - smoothstep(0.05, 0.07 + wfC * 7.0, wDl);
          float crossV = (1.0 - smoothstep(0.07, 0.1 + wfT * 50.0, wDc)) * (1.0 - smoothstep(0.2, 0.6, wfT * 34.0));
          float costa = 1.0 - smoothstep(0.05, 0.08 + wfC * 1.5, wC);
          float stig = smoothstep(0.83, 0.85, wT) * (1.0 - smoothstep(0.92, 0.94, wT)) * (1.0 - smoothstep(0.17, 0.21, wC));
          float nodus = (1.0 - smoothstep(0.0, 0.012 + wfT, abs(wT - 0.46))) * (1.0 - smoothstep(0.1, 0.3, wC));
          float vein = clamp(max(max(longV, crossV * 0.75), max(max(costa, stig), nodus)), 0.0, 1.0);
          float smoke = 0.35 * smoothstep(0.7, 1.0, wT) + 0.5 * (1.0 - smoothstep(0.0, 0.1, wT));           // amber at the root, smoky toward the tip
          vec3 glass = mix(vec3(0.5, 0.56, 0.62), vec3(0.42, 0.3, 0.16), smoke) * hemiAt(N) * 0.55 + uSky * uHemiW * fr * fr * 0.35;
          vec3 gold = mix(uEmberC, vec3(1.0, 0.66, 0.3), 0.7) * min(uSunI, 2.0) * (0.14 + 0.3 * back * back) * (1.0 - 0.35 * smoke);
          col = mix(glass, glass * 0.5 + gold, lit);
          col = mix(col, vec3(0.05, 0.035, 0.02) * (hemiAt(N) * 0.8 + uSunColor * uSunI * lit * 0.5), vein);
          alpha = mix(0.34 + 0.3 * fr * fr + 0.2 * smoke + 0.12 * lit, 0.96, vein);
        } else {
          float fade = 1.0 - smoothstep(6.0, 22.0, dist);
          float wart = vn(vObj.xz * 60.0 + vK.z * 9.0), blot = vn(vObj.xz * 9.0 + vObj.y * 5.0 + vK.z * 31.0);
          vec3 alb = vCol * (1.0 + fade * (wart - 0.5) * 0.7 + (blot - 0.5) * 0.55);
          float wrap = clamp(dot(N, uSunDir) * 0.7 + 0.3, 0.0, 1.0);
          float fr2 = fr * fr;
          col = alb * (hemiAt(N) * 1.5 + uSunColor * uSunI * wrap * lit * 0.6);
          col += uSky * uHemiW * fr2 * fr * (0.3 + 0.7 * max(N.y, 0.0)) * 0.22;                 // moist skin: sky sheen
          col += uSunColor * uSunI * lit * fr2 * fr2 * (0.1 + 0.8 * back * back) * 0.5;
          col = mix(col, col * vec3(0.5, 0.55, 0.62), (1.0 - smoothstep(-0.02, 0.05, vW.y)));    // darker where awash
        }
        col = mistFade(col, vW, vK.y);
        gl_FragColor = vec4(haze(col, vW), alpha);
      }`,
  }), U);
}
function eyeBump(g, x, y, z, r, skin) {
  const dark = [0.012, 0.012, 0.014], hi = [2.2, 2.4, 2.6], n = 6, top = g.v(x, y + r * 0.9, z, dark), ring = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ring.push(g.v(x + Math.cos(a) * r, y, z + Math.sin(a) * r, i % 2 ? skin : dark)); }
  for (let i = 0; i < n; i++) g.tri(ring[i], top, ring[(i + 1) % n]);
  const h = r * 0.3; g.tri(g.v(x + h, y + r * 0.95, z, hi), g.v(x + h * 2.2, y + r * 0.8, z + h, hi), g.v(x + h * 2.2, y + r * 0.8, z - h, hi));
}
function diplocaulusGeo() {
  const g = GB(), top = rgb('#4A5240'), dk = rgb('#2C3326'), bel = rgb('#8A8A6A'), horn = rgb('#B9B08A');
  // the boomerang skull: stations across z, a flat lens in x-y at each, swept back into two horns
  const st = 11, rows = [];
  for (let i = 0; i < st; i++) {
    const zn = (i / (st - 1)) * 2 - 1, az = Math.abs(zn), z = zn * 0.185;
    const xf = 0.5 - 0.13 * Math.pow(az, 1.6), xb = 0.33 - 0.2 * Math.pow(az, 1.25), th = 0.045 * (1 - 0.72 * az) + 0.006, xm = (xf + xb) / 2;
    const c = mixc(mixc(top, dk, 0.4 + 0.4 * Math.sin(i * 2.4)), horn, sst(0.86, 1, az));
    rows.push([g.v(xf, 0.012, z, c), g.v(xm, 0.012 + th, z, c), g.v(xb, 0.012, z, c), g.v(xm, 0.012 - th * 0.6, z, mixc(bel, horn, sst(0.86, 1, az)))]);
  }
  for (let i = 0; i < st - 1; i++) for (let k = 0; k < 4; k++) g.quad(rows[i][k], rows[i][(k + 1) % 4], rows[i + 1][(k + 1) % 4], rows[i + 1][k]);
  eyeBump(g, 0.4, 0.05, 0.045, 0.016, top); eyeBump(g, 0.4, 0.05, -0.045, 0.016, top);
  // body and the tail, flattened side to side
  const B = [[0.3, 0.075, 0.04], [0.16, 0.09, 0.05], [0.0, 0.085, 0.05], [-0.14, 0.06, 0.05], [-0.26, 0.03, 0.06], [-0.4, 0.016, 0.055], [-0.5, 0.006, 0.03]];
  g.tube(B.map((b, i) => ({ p: [b[0], 0.0, 0], r: b[1], ry: b[2], c: mixc(top, dk, 0.5 + 0.5 * Math.sin(i * 2.1)), cb: bel, a: [Math.pow(Math.max(0.16 - b[0], 0) / 0.66, 1.5), 0, b[0] > -0.15 ? 1 : 0, 0] })), 8);
  for (const sx of [0.2, -0.12]) for (const sz of [-1, 1]) g.tube([{ p: [sx, -0.01, sz * 0.07], r: 0.016, c: top }, { p: [sx + 0.03, -0.03, sz * 0.14], r: 0.012, c: top }, { p: [sx + 0.06, -0.05, sz * 0.16], r: 0.014, ry: 0.006, c: dk }], 4);
  return g.build();
}
function eryopsGeo() {
  // Eryops: a squat 2 m amphibian. A broad flat skull a quarter of the length (widest at the back, eyes on top), no neck, a wide
  // low barrel, a short thick tail, four short stout limbs sprawled out to the side with broad five-toed feet; belly on the mud.
  const g = GB(), top = rgb('#5E543E'), dk = rgb('#3A3226'), bel = rgb('#BDAE86');
  const B = [[1.0, 0.085, 0.03], [0.95, 0.17, 0.05], [0.84, 0.24, 0.068], [0.68, 0.29, 0.085], [0.55, 0.305, 0.1], [0.45, 0.275, 0.13], [0.22, 0.35, 0.2], [-0.08, 0.37, 0.21], [-0.33, 0.31, 0.19], [-0.5, 0.2, 0.15], [-0.68, 0.12, 0.11], [-0.84, 0.06, 0.07], [-0.95, 0.015, 0.03]];
  const lift = (x) => 0.07 * sst(0.4, 0.75, x), yc = (b) => 0.02 + b[2] * 0.55 + lift(b[0]);
  g.tube(B.map((b, i) => ({ p: [b[0], yc(b), 0], r: b[1], ry: b[2], c: mixc(top, dk, 0.5 + 0.5 * Math.sin(i * 1.9 + 1)), cb: b[0] > 0.35 ? bel : mixc(bel, top, 0.35),
    a: [Math.pow(Math.max(-0.3 - b[0], 0) / 0.7, 1.5), 0, (b[0] < 0.4 && b[0] > -0.4) ? 1 : 0, 0] })), 12, { flatBelly: 0.55 });
  const wAt = (x) => { for (let i = 0; i < B.length - 1; i++) if (x <= B[i][0] && x >= B[i + 1][0]) { const t = (B[i][0] - x) / (B[i][0] - B[i + 1][0]); return [lerp(B[i][1], B[i + 1][1], t), lerp(yc(B[i]), yc(B[i + 1]), t), lerp(B[i][2], B[i + 1][2], t)]; } return [0.1, 0.1, 0.05]; };
  const e = wAt(0.62); eyeBump(g, 0.62, e[1] + e[2] * 0.82, 0.13, 0.04, top); eyeBump(g, 0.62, e[1] + e[2] * 0.82, -0.13, 0.04, top);
  for (const sz of [-1, 1]) {     // the long mouth line round the flat skull, and a nostril
    const xs = [0.99, 0.9, 0.78, 0.64, 0.5]; let prev = null;
    for (const x of xs) { const w = wAt(x), lo = g.v(x, w[1] - 0.012, sz * (w[0] + 0.004), dk), hi = g.v(x, w[1] + 0.012, sz * (w[0] + 0.004), dk); if (prev) g.quad(prev[0], lo, hi, prev[1]); prev = [lo, hi]; }
    const n = wAt(0.93); g.tri(g.v(0.93, n[1] + n[2] + 0.004, sz * 0.05, dk), g.v(0.955, n[1] + n[2], sz * 0.07, dk), g.v(0.905, n[1] + n[2] + 0.004, sz * 0.072, dk));
  }
  // limbs: a thick upper arm straight out to the side, the elbow or knee the widest point of the animal, forearm down to a planted foot
  for (const [sx, fwd] of [[0.3, 0.2], [-0.36, -0.08]]) for (const sz of [-1, 1]) {
    g.tube([{ p: [sx, 0.16, sz * 0.24], r: 0.105, c: top }, { p: [sx - 0.04, 0.17, sz * 0.5], r: 0.085, c: top }, { p: [sx + fwd * 0.6, 0.09, sz * 0.62], r: 0.06, c: dk }, { p: [sx + fwd, 0.02, sz * 0.66], r: 0.07, ry: 0.025, c: dk }], 6, { side: true });
    const hx = sx + fwd + 0.02, hz = sz * 0.67, hub = g.v(hx, 0.035, hz, dk);
    for (let t = 0; t < 5; t++) { const a = (t - 2) * 0.4 + sz * 0.6, l = 0.16; g.tri(hub, g.v(hx + Math.cos(a - 0.13) * l, 0.008, hz + Math.sin(a - 0.13) * l, bel), g.v(hx + Math.cos(a + 0.13) * l, 0.008, hz + Math.sin(a + 0.13) * l, bel)); }
  }
  return g.build();
}
function griffinflyGeo() {
  // Meganeuropsis: a griffinfly, 0.7 m across. Head with two great eyes that meet on top, a deep humped thorax carrying the wings, six spiny legs
  // held forward as a basket, a long ringed abdomen ending in two claspers; four narrow glassy wings held out flat (fore pair straight-edged,
  // hind pair broader at the root). Wing vertices carry (span 0..1, chord 0..1, pair) in their colour: the vein net is drawn from them.
  const g = GB(), br = rgb('#4A3C24'), dk = rgb('#17120C'), pale = rgb('#A08C52'), eye = rgb('#2E4438'), eyeHi = [0.5, 0.62, 0.6];
  const T = [[0.118, 0.012, 0.012], [0.105, 0.03, 0.028], [0.085, 0.024, 0.026], [0.07, 0.036, 0.04], [0.035, 0.042, 0.05], [-0.005, 0.038, 0.044], [-0.035, 0.022, 0.026]];
  g.tube(T.map((b, i) => ({ p: [b[0], i > 2 && i < 6 ? 0.008 : 0, 0], r: b[1], ry: b[2], c: i === 4 ? mixc(br, pale, 0.35) : i % 2 ? br : dk, cb: mixc(br, pale, 0.5) })), 8);
  const AB = [];      // the abdomen: ten segments, each swelling a little toward its hind ring, dark with a pale band
  for (let k = 0; k <= 20; k++) { const t = k / 20, sw = k % 2 ? 1.18 : 0.9; AB.push({ p: [-0.035 - t * 0.42, 0.004 - 0.012 * t * t, 0], r: lerp(0.017, 0.0085, Math.pow(t, 0.7)) * sw * (t > 0.9 ? 1.25 : 1), c: k % 2 ? mixc(br, pale, 0.55) : dk, cb: mixc(br, pale, 0.3) }); }
  g.tube(AB, 6);
  for (const sz of [-1, 1]) {
    g.tube([{ p: [-0.45, -0.008, sz * 0.005], r: 0.004, c: dk }, { p: [-0.48, -0.006, sz * 0.012], r: 0.005, c: dk }, { p: [-0.505, -0.004, sz * 0.008], r: 0.002, c: dk }], 4);       // claspers
    // an eye: a fat globe that meets its twin on the crown, with a pale glint
    g.tube([{ p: [0.112, 0.016, sz * 0.004], r: 0.014, c: eye }, { p: [0.114, 0.014, sz * 0.022], r: 0.026, c: eye }, { p: [0.106, 0.008, sz * 0.04], r: 0.019, c: mixc(eye, eyeHi, 0.45) }, { p: [0.1, 0.004, sz * 0.049], r: 0.006, c: eyeHi }], 7, { side: true });
    // legs: femur out and down, tibia forward, a hooked foot: a catching basket under the head
    for (let k = 0; k < 3; k++) {
      const x0 = 0.07 - k * 0.028, fw = 0.05 - k * 0.035, out = 0.05 + k * 0.012;
      g.tube([{ p: [x0, -0.03, sz * 0.02], r: 0.0055, c: br }, { p: [x0 + fw * 0.3, -0.07, sz * out], r: 0.0045, c: br }, { p: [x0 + fw + 0.03, -0.085, sz * (out + 0.012)], r: 0.0035, c: dk }, { p: [x0 + fw + 0.05, -0.1, sz * out], r: 0.0025, c: dk }], 4, { side: true });
    }
  }
  // wings: a grid of span x chord so the vein coordinates run smoothly; a straight leading edge, a narrow root, a rounded tip
  const NS = 12, NC = 3;
  for (const [pairId, x0, len, wd, root, sgn] of [[0, 0.058, 0.345, 0.07, 0.34, 1], [1, -0.004, 0.325, 0.084, 0.62, -1]]) for (const sz of [-1, 1]) {
    const rows = [];
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, tip = sst(0.8, 1, t), chord = wd * lerp(root, 1, sst(0, 0.32, t)) * (1 - 0.82 * tip * tip), xl = x0 + 0.01 * Math.sin(Math.PI * t) - 0.5 * wd * tip * tip - (pairId ? 0.03 : 0.012) * t;
      const row = [];
      for (let j = 0; j <= NC; j++) { const c = j / NC; row.push(g.v(xl - c * chord, 0.034 + 0.012 * t * (1 - t) * 4 * (pairId ? 0.6 : 1), sz * (0.026 + t * len), [t, c, pairId], [0, sgn, 0, 1])); }
      rows.push(row);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) g.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
  }
  return g.build();
}
function critterMesh(geo, mat, n, name) {
  const mesh = new THREE.InstancedMesh(geo, mat, n), aI = new Float32Array(n * 4);
  geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
  mesh.frustumCulled = false; mesh.name = name; mesh.userData.aI = aI; mesh.renderOrder = 4;
  return mesh;
}
// Gnats and the hatch: points that are nearly invisible in shade and gold motes above the sun line.
function moteMesh(U, list, top, gain = 1) {
  const n = list.length, pos = new Float32Array(n * 3), aP = new Float32Array(n * 4);
  list.forEach((m, i) => { pos.set([m.x, m.y, m.z], i * 3); aP.set([m.ph, m.rise, m.orbit, m.size], i * 4); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
  const mat = share(new THREE.ShaderMaterial({
    uniforms: { uPixH: U.uPixH, uTop: { value: top }, uGain: { value: gain } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform float uTime, uPixH, uTop, uSunLineY; varying float vLit, vFade;
      void main() {
        vec3 p = position; float ph = aP.x * 6.283;
        float yr = mod(position.y + uTime * aP.y, max(uTop, 0.5));
        p.y = aP.y > 0.0 ? yr : position.y;
        vFade = aP.y > 0.0 ? smoothstep(0.0, 0.5, yr) * (1.0 - smoothstep(uTop * 0.7, uTop, yr)) : 1.0;
        p.x += aP.z * sin(uTime * (0.8 + aP.x) + ph); p.z += aP.z * cos(uTime * (0.7 + aP.x * 0.6) + ph * 1.3); p.y += aP.z * 0.4 * sin(uTime * 1.3 + ph * 2.0);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 0.1);
        gl_PointSize = clamp(aP.w * uPixH / d, 1.5, 5.0);
        vLit = smoothstep(-0.06, 0.06, p.y - uSunLineY); vFade *= 1.0 - smoothstep(60.0, 140.0, d);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunColor; uniform float uSunI, uGain; varying float vLit, vFade;
      void main() {
        vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0, a = 1.0 - smoothstep(0.45, 1.0, r);
        vec3 gold = mix(uSunColor, vec3(1.0, 0.55, 0.15), 0.7) * (0.3 + 0.28 * uSunI) * uGain;
        gl_FragColor = vec4(mix(vec3(0.05, 0.06, 0.08), gold, vLit), a * vFade * mix(0.08, 0.85, vLit));
      }`,
  }), U, ['uTime', 'uSunLineY', 'uSunColor', 'uSunI']);
  const mesh = new THREE.Points(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// A soft contact shade under every sail-back: one multiply quad each, lying on the mud (so no animal looks set down on a floor).
function contactShade(placements) {
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      varying vec2 vQ;
      void main() { vQ = uv * 2.0 - 1.0; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ;
      void main() {
        float r = length(vQ * vec2(1.0, 1.25)), a = (1.0 - smoothstep(0.2, 1.0, r)) * 0.5;
        gl_FragColor = vec4(mix(vec3(1.0), vec3(0.42, 0.4, 0.55), a), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(placements.length, 1)), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  placements.forEach((p, i) => {
    const c = Math.cos(p.yaw), sn = -Math.sin(p.yaw), k = p.scale * (p.kind === 'dim' ? 1.05 : 1);
    e.set(0, p.yaw, 0); q.setFromEuler(e); pv.set(p.x + c * 0.2 * k, p.y + 0.045, p.z + sn * 0.2 * k); sv.set(3.0 * k, 1, 1.35 * k);
    m.compose(pv, q, sv); mesh.setMatrixAt(i, m);
  });
  mesh.count = placements.length; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.renderOrder = 0; mesh.name = 'contact-shade';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
const MOODS = [
  { name: 'clear', pal: PALETTE, mistTop: 0.36, green: 1.0, band: 1.25, fog: '#7F93A8' },
  { name: 'cirrus', pal: ['#8C8CB2', '#34304F', '#9C4A32', '#C9608A', '#F2466E', '#F4C2B4', '#2F4A3A'], mistTop: 0.5, green: 0.95, band: 1.2, fog: '#8C8CB2' },
  { name: 'rain', pal: ['#7C97AC', '#2A3A56', '#8E4430', '#C9714A', '#F2552C', '#F4C9A0', '#2F5238'], mistTop: 0.34, green: 1.18, band: 1.3, fog: '#7C97AC' },
];
const SAIL = { eda: [1.0, 0.5, 0.5, -0.40, 1.02], dim: [1.26, 0.6, 0.62, -0.30, 0.94] };   // h, peak, shape, x0, x1 (the part's SPEC)

export default {
  id: 'red-sails-dawn',
  name: 'Red Sails at Sunrise',
  category: 'prehistoric',
  weirdness: 0.3,
  media: ['open', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const moodI = rng.int(0, 2), mood = MOODS[moodI], sailStyle = rng.int(0, 2), rare = !!vary.rare;
    const hour = vary.hour || 'any', hourK = hour === 'night' ? -1 : (hour === 'day' || hour === 'golden') ? 1 : 0;   // an earlier, bluer dawn or a later, warmer one
    const lineShift = moodI === 2 ? -0.1 : 0;
    // the brief's line, re-timed for sails that stand on a bar 0.3 m high: tips alight at u 0.15, halfway down the nearest webs at 0.40, at the backs by 0.52
    const LINE = [[0, 1.5], [0.08, 1.45], [0.16, 1.38], [0.25, 1.2], [0.34, 0.95], [0.40, 0.55], [0.43, 0.2], [0.47, -0.15], [0.54, -0.5], [1, -0.5]];   // polish 2: the fire comes down sooner, so the opening is not dim
    const lineAt = (u) => { u = clamp(u, 0, 1); for (let i = 0; i < LINE.length - 1; i++) if (u <= LINE[i + 1][0]) return lerp(LINE[i][1], LINE[i + 1][1], (u - LINE[i][0]) / (LINE[i + 1][0] - LINE[i][0])); return -0.5; };
    const scene = new THREE.Scene();
    const lay = makeLayout(ctx, moodI), L = lay.L, path = lay.path;
    const azA = (30 + rng.range(-3, 3)) * Math.PI / 180;     // polish 2: the dawn stands 30 degrees left of the entry heading (was 50): its glow and its mirror in the water are in the opening frame, and sails ahead of us are seen broadside
    const sunAz = new THREE.Vector2(Math.cos(azA), -Math.sin(azA));
    await ctx.yield();

    // ---- the cast of sail-backs: world placements for the hero part (its frame is the world's frame)
    const P = [], v = new THREE.Vector3(), axisYaw = -(Math.PI / 2 - azA);        // long axis square to the sun: every sail broadside to the dawn
    const add = (kind, s, lat, o = {}) => {
      lay.at(s, lat, v);
      const p = { kind, shadowLift: moodI === 2 ? 0.2 : 0.07, x: v.x, z: v.z, y: Math.max(lay.heightAt(v.x, v.z), 0.03), yaw: axisYaw + (o.dyaw || 0), scale: o.scale || 1, tilt: o.tilt || 0, s, lat };
      if (o.mist === false) p.mist = false;
      P.push(p); return p;
    };
    const free = (s, lat, r) => { lay.at(s, lat, v); for (const p of P) if (Math.hypot(p.x - v.x, p.z - v.z) < r) return false; return true; };
    const nDim = rng.chance(0.6) ? 6 : 4;
    const pair = (s, lat, o = {}) => {
      const j = rng.range(-0.1, 0.1), ca = Math.cos(axisYaw + j), sa = -Math.sin(axisYaw + j), c = lay.at(s, lat, new THREE.Vector3());
      const gap = o.gap ?? 1.5, stag = o.stag ?? 0.85;
      const i0 = lay.info(c.x - gap * sunAz.x + stag * ca, c.z - gap * sunAz.y + stag * sa), s0 = i0.s, l0 = i0.lat;
      const i1 = lay.info(c.x + gap * sunAz.x - stag * ca, c.z + gap * sunAz.y - stag * sa), s1 = i1.s, l1 = i1.lat;
      add('dim', s0, l0, { dyaw: j, tilt: -0.1, ...o }); add('dim', s1, l1, { dyaw: j + Math.PI, tilt: -0.1, scale: 0.96, ...o });
    };
    pair(13.8, 5.3);           // on the cut bank, 13 m left-ahead of the entry: the first to be lit
    pair(247.5, 6.2, { gap: 2.1, stag: 2.0 });                           // on the bar's point, above the back-pool
    pair(174.7, 5.1);                         // mid-bar, in a gap of the hero row: the taller peaks close on our left at u 0.43
    // the first three stand where the bar begins, 6 to 8 m off: sails close on our left by u 0.08
    // polish 3: they stand on the isthmus either side of our line; we pass between them 3.5 m off, 1.2 m above the mud (u 0.07-0.13)
    for (const [s, lat, sc, hr, fl] of [[38.4, 3.7, 1.1, 1, 0], [42.0, -3.9, 1.06, 1, 1], [48.2, 4.4, 1.08, 1, 0], [53.4, -4.3, 1.0, 1, 1], [41.0, 8.4, 1.0, 0, 0]]) add('eda', s, lat, { dyaw: rng.range(-0.15, 0.15) + (fl ? Math.PI : 0), scale: sc }).hero = !!hr;
    add('edaFar', 47.0, -2.9, { dyaw: 0.35, scale: 0.5 });
    add('eda', 138.6, 3.0, { dyaw: 0.12, scale: 1.1 }).hero = true;     // polish 4: the low pass (u 0.34): one sail-back 4 m off, seen from 0.7 m above the mud, its sail against the sky
    for (const [s, lat, sc] of [[70.5, 4.5, 1.06], [76, 6.6, 1.0], [81.5, 4.7, 1.08], [104.6, 6.9, 1.07], [111.2, 5.6, 1.0]]) add('eda', s, lat, { dyaw: rng.range(-0.15, 0.15), scale: sc }).hero = lat < 6.5;   // the bar's lip, 6 m off, for u 0.16 and 0.25
    // the turn (a spit on our left from u 0.70) and the gate: turned a little toward us, so their sails read as we come up behind them
    for (const [s, lat, sc, hr] of [[284, 4.7, 1.08, 1], [290.5, 7.0, 1.0, 0], [296.5, 5.0, 1.04, 1], [293.2, 4.2, 0.5, 0], [355, 6.6, 1.05, 1], [361.5, 8.4, 1.0, 0], [383, 6.5, 1.04, 1], [384.5, -6.5, 1.0, 1]])
      add(sc < 0.8 ? 'edaFar' : 'eda', s, lat, { dyaw: (lat < 0 ? 0.5 : s > 350 ? -0.6 : -0.38) + rng.range(-0.1, 0.1), scale: sc }).hero = !!hr;
    for (const [s, lat, sc] of [[320.5, 4.4, 1.1], [326.5, 7.2, 1.0], [332.5, 5.2, 1.04], [324.6, 4.3, 0.5], [329.6, 4.3, 0.46]]) add(sc < 0.8 ? 'edaFar' : 'eda', s, lat, { dyaw: -0.3 + rng.range(-0.15, 0.15), scale: sc }).hero = sc > 1.01;   // the spit's few
    const eryS = [95, 101.5, 36.6, 44.2, 316, 21.5], eryLat = (s, i) => i === 5 ? -5.2 : i === 4 ? -7.4 : i === 3 ? 1.3 : i === 2 ? -1.0 : lay.barEdge(s) + 1.75;
    eryS.forEach((s, i) => { lay.at(s, eryLat(s, i), v); P.push({ kind: 'ery', x: v.x, z: v.z }); });   // keep their spots free
    // the hero row: we fly in among them, looking broadside. Every 5-6 m one stands 4 m (then 5.3 m) to our left on the bar we are crossing
    // the sunrise frame (u 0.52): two stand either side of the line from our eye to the sun, 6 and 8 m off, so the disc clears the
    // levee between two near sails and their rib shadows fall past us
    { const c = path.posAtDist(0.52 * L, new THREE.Vector3());
      for (const [fw, side, sc] of [[4.2, 0.2, 1.1], [7.4, -3.7, 1.06], [8.6, 4.0, 1.03]]) {
        const inf = lay.info(c.x + sunAz.x * fw + sunAz.y * side, c.z + sunAz.y * fw - sunAz.x * side);
        add('eda', inf.s, inf.lat, { scale: sc }).hero = true;
      } }
    for (let s = 119.5 + rng.range(-0.3, 0.3), k = 0; s < 220; s += 5.7 + rng.range(-0.25, 0.25), k++) {
      const lat = (k % 2 ? 5.8 : 4.3) + rng.range(-0.1, 0.3), dyaw = rng.range(-0.18, 0.18) + (rng.chance(0.3) ? Math.PI : 0), scale = rng.range(1.0, 1.1);
      if ((s > 167.5 && s < 182.5) || !free(s, lat, 3.6)) continue;      // the display pair stands in the gap
      add('eda', s, lat, { dyaw, scale }).hero = true;
    }
    const nEda = Math.round(clamp(rng.range(26, 40) * (0.8 + 0.2 * density), 26, 40));
    for (let s = 88 + rng.range(0, 5); s < 236; s += rng.range(7, 11)) {       // a loose row along the near edge, and behind the hero row
      const lat = Math.max(lay.barEdge(s) + 2.25, s > 112 && s < 222 ? 8.3 : 0) + rng() * 1.3;
      if (free(s, lat, 3.0)) add('eda', s, lat, { dyaw: rng.range(-0.25, 0.25) + (rng.chance(0.3) ? Math.PI : 0), scale: rng.range(0.92, 1.08) });
    }
    let guard = 0;
    while (P.filter((p) => p.kind === 'eda').length < nEda && guard++ < 60) {
      const sC = rng.range(66, 240), hwC = lay.barHalf(sC), latC = Math.max(lay.barEdge(sC) + 3.2, 7.5) + Math.pow(rng(), 2.2) * Math.max(2 * hwC - 9, 0.5), k = rng.int(3, 6);
      for (let i = 0; i < k; i++) {
        const s = sC + rng.range(-5.5, 5.5), lat = latC + rng.range(-2.8, 2.8), hw = lay.barHalf(s), e = lay.barEdge(s);
        if (lat < Math.max(e + 2.5, 7.2) || lat > e + 2 * hw - 1.6 || s < 62 || s > 250 || !free(s, lat, 2.9)) continue;
        if (P.filter((p) => p.kind === 'eda').length >= nEda) break;
        add('eda', s, lat, { dyaw: rng.range(-0.28, 0.28) + (rng.chance(0.3) ? Math.PI : 0), scale: rng.range(0.9, 1.08) });
      }
    }
    const adults = P.filter((p) => p.kind === 'eda' && p.lat > 0), nYoung = rng.int(0, 6);
    for (let i = 0; i < nYoung; i++) {
      const a = rng.pick(adults), s = a.s + rng.range(-1.6, 1.6), lat = a.lat + rng.range(1.4, 2.2);
      if (lat < lay.barEdge(s) + 2 * lay.barHalf(s) - 1.4 && free(s, lat, 1.5)) add('edaFar', s, lat, { dyaw: rng.range(-0.4, 0.4), scale: rng.range(0.46, 0.56) });
    }
    { const c = path.posAtDist(0.52 * L, new THREE.Vector3());
      for (const p of P) {
        if (p.kind === 'ery') continue;
        const dx = p.x - c.x, dz = p.z - c.z, al = dx * sunAz.x + dz * sunAz.y, pe = Math.abs(dx * sunAz.y - dz * sunAz.x);
        if (al < 0 || al > 150 || pe > 1.9 + 0.1 * al || (al < 5 && pe < 1.2)) continue;      // (the one that stands on the line stays)
        if (al > 14 || p.s === undefined) { p.kind = 'skip'; continue; }
        lay.at(p.s + 3.0, p.lat, v); p.x = v.x; p.z = v.z; p.y = Math.max(lay.heightAt(v.x, v.z), 0.03); p.s += 3.0;
      } }
    P.filter((p) => p.kind === 'eda').sort((a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0) || Math.abs(a.lat) - Math.abs(b.lat)).forEach((p, i) => { if (i >= 21) p.kind = 'edaFar'; });
    // CLEAR AIR ROUND THE ROUTE (repair sa1; the owner's order of 2026-10-08, one rule of place). Every standing sail-back, whatever line laid it, keeps its
    // whole body AS THE HERO PART BUILDS IT (every vertex of the part's own geometry for its kind, placed with the instance's scale, tilt, yaw, x, y, z, and
    // with the roll the part's vertex shader adds about the feet at its greatest reach, both ways) at least CLEAR metres from the WHOLE route's line: the lens
    // is that line's point in every frame, and in live it flew into a standing animal. An animal that fails keeps its s, yaw, scale, tilt and kind and moves
    // sideways along its own row by the shortfall, on the side it already stands; then it is measured again, three passes at most. THE ROW SHIFTS AS ONE (the
    // lead's ruling of 12:58 UTC on 2026-10-08): every other standing sail-back farther out on the mover's side whose skin the move would bring nearer than it
    // stood AND nearer than NEIGHBOUR metres moves along its own row by the same amount on the same side (it too keeps its s, yaw, scale, tilt and kind), so
    // the pair keeps the air it had; what is carried so carries its own farther neighbours by the same test, to the end of the row. A carried animal is still
    // measured from the route in its own turn. Any other animal is not touched. No draw from any stream, no phase, no fade, nothing from the eye, the clock or a seed.
    await ctx.yield();      // (sa1c) the page is handed back between the laying of the animals and this block's first work
    { const CLEAR = 2.0;      // metres of clear air between the lens's track and the skin: the owner's figure of 10:53 UTC on 2026-10-08, nearly seven times the camera's near distance (0.3 m)
      // The body's extent is the part's own: its exported sailbackGeometry, called at the middle of its seeded play (every draw 0.5: no stream is made or touched).
      // PLAY: how far the body the part builds on a seed may stand outside that middle build, metres at scale 1 (its play in spine height, lean and crossbar length:
      // 0.0289 at most over every vertex on seeds 1 to 600), taken off every distance measured. ROLL: the part's weight-shift roll about the feet at its greatest
      // (its vertex shader: 0.052 + 0.02 rad, by each vertex's own aAnim.w, the display tilt added). Both are proved against what the part builds, and the
      // outline shown never more than 0.06 m outside the skin, by shots/red-sails-dawn/verify-sa1/outline.mjs.
      const PLAY = 0.03, ROLL = 0.052 + 0.02, STEP = 0.2;      // STEP: the route's line is taken every 0.2 m from its first metre to its last
      const { sailbackGeometry } = await import('../parts/red-sails-dawn.js');
      const nR = Math.ceil(L / STEP), R = new Float64Array((nR + 1) * 3), mid = () => 0.5, body = {};
      for (let i = 0; i <= nR; i++) { path.posAtDist(Math.min(i * STEP, L), v); R[i * 3] = v.x; R[i * 3 + 1] = v.y; R[i * 3 + 2] = v.z; }
      await ctx.yield();      // (sa1c) and again when the route's points are made, before the first body is measured
      for (const k of ['eda', 'edaFar', 'dim']) {      // the three bodies the part builds: hero plant-eater, far plant-eater, hunter
        const g = sailbackGeometry(k === 'dim' ? 'dim' : 'eda', mid, k !== 'edaFar'), pos = g.attributes.position.array, an = g.attributes.aAnim.array; let rad = 0;
        for (let j = 0; j < pos.length; j += 3) rad = Math.max(rad, Math.hypot(pos[j], pos[j + 1], pos[j + 2]));
        body[k] = { pos, an, rad, rolled: {} };
        await ctx.yield();
      }
      const rolled = (b, tilt) => b.rolled[tilt] || (b.rolled[tilt] = [-ROLL, ROLL].map((r) => {      // the body rolled to either end of its reach
        const out = new Float64Array(b.pos.length);
        for (let j = 0, q = 3; j < out.length; j += 3, q += 4) { const a = (r + tilt) * b.an[q], c = Math.cos(a), s = Math.sin(a); out[j] = b.pos[j]; out[j + 1] = c * b.pos[j + 1] - s * b.pos[j + 2]; out[j + 2] = s * b.pos[j + 1] + c * b.pos[j + 2]; }
        return out;
      }));
      // least distance in three dimensions from the whole route's line to the skin (a point of the route is passed over only when the body's whole sphere is farther than CLEAR from it)
      const air = (p) => {
        const b = body[p.kind], sets = rolled(b, p.tilt), c = Math.cos(p.yaw), s = Math.sin(p.yaw), reach = (b.rad + PLAY) * p.scale + CLEAR; let best = Infinity;
        for (let i = 0; i < R.length; i += 3) {
          const dx = R[i] - p.x, dy = R[i + 1] - p.y, dz = R[i + 2] - p.z;
          if (dx * dx + dy * dy + dz * dz >= reach * reach) continue;
          const lx = (dx * c - dz * s) / p.scale, ly = dy / p.scale, lz = (dx * s + dz * c) / p.scale;      // the route's point in the animal's own frame
          for (const V of sets) for (let j = 0; j < V.length; j += 3) { const ex = V[j] - lx, ey = V[j + 1] - ly, ez = V[j + 2] - lz, d = ex * ex + ey * ey + ez * ez; if (d < best) best = d; }
        }
        return (Math.sqrt(best) - PLAY) * p.scale;
      };
      // NEIGHBOUR: twice the reach of the weight-shift roll at a sail's tip, so that two animals rolling toward each other never meet. The reach is ROLL times the
      // tip's height over the feet: the hunter's 2.02 m at scale 1, its largest (the plant-eater's 1.79 m at 1.1, its largest, is 1.97 m), so 0.072 x 2.02 = 0.146 m
      // each (0.148 with PLAY), 0.29 m for two, rounded up to the next 0.05 m.
      const NEIGHBOUR = 0.3;
      // least distance between two skins as the block measures bodies (each outline rolled either way, PLAY taken off for each), a standing at (ax, ay, az) and q where
      // it stands; NEIGHBOUR when they are farther apart than that. Taken in q's own frame; a vertex of a is passed over only when it lies farther than that outside
      // q's box, and a vertex of q only when it lies farther than that outside the box of a's vertices so kept.
      const gap = (a, ax, ay, az, q) => {
        const A = body[a.kind], B = body[q.kind], play = PLAY * (a.scale + q.scale), e = (NEIGHBOUR + play) / q.scale;
        if (Math.hypot(q.x - ax, q.y - ay, q.z - az) >= A.rad * a.scale + B.rad * q.scale + NEIGHBOUR + play) return NEIGHBOUR;
        const ca = Math.cos(a.yaw), sa = Math.sin(a.yaw), cq = Math.cos(q.yaw), sq = Math.sin(q.yaw), sets = rolled(B, q.tilt), K = [], M = []; let best = e * e;
        const box = (V, b) => { for (let j = 0; j < V.length; j++) { const k = j % 3; if (V[j] < b[k]) b[k] = V[j]; if (V[j] > b[k + 3]) b[k + 3] = V[j]; } return b; };
        const inside = (b, x, y, z) => x >= b[0] - e && x <= b[3] + e && y >= b[1] - e && y <= b[4] + e && z >= b[2] - e && z <= b[5] + e;
        const bq = sets.reduce((b, V) => box(V, b), [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
        for (const U of rolled(A, a.tilt)) for (let i = 0; i < U.length; i += 3) {
          const dx = ax + (U[i] * ca + U[i + 2] * sa) * a.scale - q.x, dy = ay + U[i + 1] * a.scale - q.y, dz = az + (U[i + 2] * ca - U[i] * sa) * a.scale - q.z;
          const lx = (dx * cq - dz * sq) / q.scale, ly = dy / q.scale, lz = (dx * sq + dz * cq) / q.scale;      // a's vertex in q's own frame
          if (inside(bq, lx, ly, lz)) K.push(lx, ly, lz);
        }
        const bk = box(K, [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
        for (const V of sets) for (let j = 0; j < V.length; j += 3) if (inside(bk, V[j], V[j + 1], V[j + 2])) M.push(V[j], V[j + 1], V[j + 2]);
        for (let i = 0; i < K.length; i += 3) for (let j = 0; j < M.length; j += 3) { const ex = M[j] - K[i], ey = M[j + 1] - K[i + 1], ez = M[j + 2] - K[i + 2], d = ex * ex + ey * ey + ez * ez; if (d < best) best = d; }
        return best < e * e ? Math.sqrt(best) * q.scale - play : NEIGHBOUR;
      };
      for (const p of P) {
        if (p.kind !== 'eda' && p.kind !== 'edaFar' && p.kind !== 'dim') continue;
        const lat0 = p.lat, x0 = p.x, y0 = p.y, z0 = p.z;
        for (let pass = 0; pass < 3; pass++) {
          const short = CLEAR - air(p); if (!(short > 0)) break;
          p.lat += (p.lat < 0 ? -1 : 1) * short;
          lay.at(p.s, p.lat, v); p.x = v.x; p.z = v.z; p.y = Math.max(lay.heightAt(v.x, v.z), 0.03);
        }
        if (p.lat !== lat0) {      // the row shifts as one: the mover first, then each animal it carries, each with the place it left
          const m = p.lat - lat0, row = [[p, lat0, x0, y0, z0]];
          for (const [a, al, ax, ay, az] of row) for (const q of P) {
            if ((q.kind !== 'eda' && q.kind !== 'edaFar' && q.kind !== 'dim') || (q.lat < 0) !== (al < 0) || !(Math.abs(q.lat) > Math.abs(al)) || row.some((r) => r[0] === q)) continue;
            await ctx.yield();
            const g = gap(a, a.x, a.y, a.z, q); if (!(g < NEIGHBOUR)) continue;
            await ctx.yield();
            if (!(g < gap(a, ax, ay, az, q))) continue;
            row.push([q, q.lat, q.x, q.y, q.z]); q.lat += m;      // nearer than NEIGHBOUR and nearer than it stood: it goes with its neighbour, by the same m
            lay.at(q.s, q.lat, v); q.x = v.x; q.z = v.z; q.y = Math.max(lay.heightAt(v.x, v.z), 0.03);
          }
        }
        await ctx.yield();
      } }
    const placements = P.filter((p) => p.kind !== 'ery' && p.kind !== 'skip');
    await ctx.yield();
    // polish 2: a rib shadow ends where the mud ends (a shadow does not lie on a mirror of water: it read as a dark slab there)
    { const thr = moodI === 2 ? -0.07 : 0.12; let n = 0;      // after rain the wet plates still take a shadow; open water does not
      for (const p of placements) {
        const ca = Math.cos(p.yaw), sa = -Math.sin(p.yaw); let len = moodI === 2 ? 5.5 : 11;
        for (const o of [-1.1, 0.3, 1.5]) for (let d = 0.6; d < len; d += 0.45) {
          if (lay.heightAt(p.x + ca * o * p.scale - sunAz.x * d, p.z + sa * o * p.scale - sunAz.y * d) < thr) { len = d; break; }
        }
        p.shadowLen = Math.max(len * 1.3 + 0.3, 1.2);
        p.refl = 1;
        if (moodI !== 2 && p.s !== undefined) { lay.at(p.s, p.lat - Math.sign(p.lat) * 2.5 * p.scale, v); p.refl = lay.heightAt(v.x, v.z) < 0.06 ? 1 : 0; }
        ++n; await ctx.yield();
      } }

    const hero = await buildHero(ctx, { placements, ground: false, mist: false, palette: mood.pal, sailStyle, detail });
    scene.add(hero.object);
    await ctx.yield();
    // ---- shared uniforms: the hero's, plus the world's haze and sky
    const U = hero.uniforms, pal = mood.pal;
    Object.assign(U, {
      uFogCol: { value: LIN(mood.fog).multiplyScalar(0.62) }, uFogWarm: { value: LIN(pal[3]) }, uFogRange: { value: new THREE.Vector2(120, 900) }, uSunAz: { value: sunAz },
      uZen: { value: LIN(pal[1]).multiplyScalar(hourK < 0 ? 0.8 : 1) }, uMidSky: { value: LIN(pal[0]).multiplyScalar(hourK < 0 ? 0.85 : 1) }, uRoseC: { value: LIN(pal[3]) }, uPeachC: { value: LIN(pal[5]) },
      uProg: { value: 0 }, uBandGain: { value: mood.band }, uSunVis: { value: new THREE.Vector3(sunAz.x, 0, sunAz.y) }, uSunUp: { value: 0 },
      uHemiW: { value: 1.8 }, uGreen: { value: LIN(pal[6]) }, uGreenGain: { value: mood.green }, uPixH: { value: 400 }, uMoteGain: { value: 1 },
    });
    U.uHemiI.value = 1.6;                    // shade is cool blue-violet, never black
    hero.setMist(LIN(pal[0]).multiplyScalar(0.6).lerp(LIN(pal[3]), 0.12), mood.mistTop);
    scene.fog = new THREE.Fog(U.uFogCol.value.clone(), 120, 900);

    // ---- sky, ground, water, mist
    const sky = makeSky(U, moodI, rng); scene.add(sky);
    const ground = await makeGround(ctx, U, lay); scene.add(ground.mesh);
    await ctx.yield();
    await ctx.yield();
    const water = makeWater(U, ground, moodI); scene.add(water.mesh);
    await ctx.yield();
    scene.add(makeMist(U, detail, mood.mistTop)); await ctx.yield();
    scene.add(contactShade(placements)); await ctx.yield();

    // ---- plants
    const pmat = plantMaterial(U), prng = rng.fork ? rng.fork('plants') : rng;
    const onBar = (s, lat, m = 0) => { const hw = lay.barHalf(s); return hw > 0.5 && lat > lay.barEdge(s) - m && lat < lay.barEdge(s) + 2 * hw + m; };
    const spot = (x, z, o = {}) => ({ x, z, y: lay.heightAt(x, z) - (o.sink || 0), yaw: prng() * TAU, s: o.s || 1, sy: o.sy || 1, tint: prng.range(-0.18, 0.18), sway: o.sway ?? 1, lean: o.lean || 0 });
    const trees = [], farTrees = [], combTrees = [], canes = [], sferns = [], tferns = [];
    const nearP = (x, z, r) => { for (const p of P) if (Math.abs(p.x - x) < r && Math.abs(p.z - z) < r && Math.hypot(p.x - x, p.z - z) < r) return true; return false; };   // nothing grows through an animal
    const nComb = Math.round(54 * (detail < 0.8 ? 0.5 : 1));
    for (let i = 0; i < nComb; i++) {                       // the comb on the east levee: the edge that casts the shadow
      const x = -110 + (i + prng()) * (990 / nComb), z = -262 + 14 * Math.sin(x * 0.008 + 1) + prng.range(-9, 9);
      combTrees.push(spot(x, z, { s: prng.range(1.0, 1.45), sink: 0.6, sway: 0.5 }));
    }
    await ctx.yield();
    for (let i = 0; i < 15; i++) {                          // the west levee, 40 m to our right
      const x = -40 + i * 27 + prng.range(-8, 8), z = 39 + 3 * Math.sin(x * 0.021) + prng.range(-4, 5), inf = lay.info(x, z);
      if (Math.abs(inf.lat) < 13) continue;
      farTrees.push(spot(x, z, { s: prng.range(0.85, 1.3), sink: 0.2 }));
      for (let k = 0; k < 2; k++) { const fx = x + prng.range(-5, 5), fz = z + prng.range(-6, 4); if (Math.abs(lay.info(fx, fz).lat) > 11) tferns.push(spot(fx, fz, { s: prng.range(0.8, 1.2), sink: 0.1 })); }
      for (let k = 0; k < 3; k++) { const fx = x + prng.range(-9, 9), fz = z + prng.range(-12, 3); if (Math.abs(lay.info(fx, fz).lat) > 9 && lay.heightAt(fx, fz) > 0.3) sferns.push(spot(fx, fz, { s: prng.range(0.8, 1.25) })); }
    }
    for (let i = 0; i < 8; i++) { const x = 30 + i * 52 + prng.range(-15, 15), z = prng.range(-150, -78); farTrees.push(spot(x, z, { s: prng.range(0.9, 1.3), sink: 0.3 })); }
    for (const sg of [-1, 1]) {                             // the gateposts of the exit
      lay.at(L - 1.5, sg * 8.7, v); trees.push({ ...spot(v.x, v.z, { s: 1.22, sink: 0.15 }), yaw: sg * 0.4 });
      for (let k = 0; k < 5; k++) { lay.at(L - prng.range(-6, 40), sg * prng.range(9.5, 17), v); (k < 2 ? tferns : sferns).push(spot(v.x, v.z, { s: prng.range(0.8, 1.2) })); }
    }
    await ctx.yield();
    for (let i = 0; i < 46; i++) {                          // ferns over the levee's flanks toward the exit
      const x = prng.range(230, 430), z = 39 + 3 * Math.sin(x * 0.021) + prng.range(-13, 12), inf = lay.info(x, z);
      if (Math.abs(inf.lat) > 9.5 && lay.heightAt(x, z) > 0.35) (i % 4 ? sferns : tferns).push(spot(x, z, { s: prng.range(0.8, 1.3) }));
    }
    for (let i = 0; i < 18; i++) {                          // the grove on the right shore
      const x = 296 + (i % 4) * 5.5 + prng.range(-1.5, 1.5), z = 4 + i * 1.5 + prng.range(-1, 1);
      trees.push(spot(x, z, { s: prng.range(1.05, 1.45), sink: 0.1 }));
      if (i % 2) tferns.push(spot(x + prng.range(-4, 4), z + prng.range(-3, 3), { s: prng.range(0.8, 1.2) })); else sferns.push(spot(x - prng.range(3, 7), z + prng.range(-3, 3), { s: prng.range(0.8, 1.2) }));
    }
    for (let i = 0; i < 12; i++) {                          // shaded conifers beyond the gap: the dark behind the ring
      lay.at(L + prng.range(16, 70), (i % 2 ? 1 : -1) * prng.range(4, 30), v);
      farTrees.push({ ...spot(v.x, v.z, { s: prng.range(1.0, 1.5) }), tint: -0.3 });
    }
    await ctx.yield();
    const brakes = [[25, -14], [72, -13.5], [118, -15], [166, -13], [208, -14.5], [252, -15], [150, 46], [60, 44], [215, 40], [290, 12], [297, 24], [300, -11],
      [L - 52, -10.5], [L - 50, 10.5], [L - 30, -11], [L - 26, 11.5], [L - 10, 12.5], [L - 8, -12.5], [288, 15.5], [300, 16], [311, 15.5], [322, -8.6], [330, -8.8], [272, -9.5], [345, 13.5]];
    for (const [bs, bl] of brakes) {
      const n = Math.round(prng.range(13, 24) * (detail < 0.8 ? 0.5 : 1) * clamp(density, 0.8, 1.2));
      for (let i = 0; i < n; i++) {
        const s = bs + prng.gauss() * 4.5, lat = bl + prng.gauss() * 2.6;
        if (Math.abs(lat) < 6.8 || onBar(s, lat, 1)) continue;
        lay.at(s, lat, v); const h = lay.heightAt(v.x, v.z); if (h > 1.2 || nearP(v.x, v.z, 3.2)) continue;
        canes.push({ ...spot(v.x, v.z, { s: 1, sy: prng.range(0.75, 1.25), lean: prng.range(-0.07, 0.07) }), y: h - 0.1 });
      }
      await ctx.yield();
    }
    // polish 3: the brake we fly THROUGH (u 0.22-0.27): tall canes close on both sides, the sails seen between them; and stands
    // beside the landing and at the isthmus's ends, so no horizon of the first third is a bare line
    const nearCanes = [];
    const put = (s, lat, r = 2.0) => {
      lay.at(s, lat, v); const h = lay.heightAt(v.x, v.z); if (h > 1.2 || h < -0.3 || nearP(v.x, v.z, r)) return;
      nearCanes.push({ ...spot(v.x, v.z, { s: prng.range(0.95, 1.2), sy: prng.range(0.85, 1.3), lean: prng.range(-0.06, 0.06) }), y: h - 0.1 });
    };
    // left of the frame at u 0.25 (behind the Eryops), right of it (on the bar's lip ahead), and the islet on our right
    for (const [s, lat] of [[101.6, 7.9], [102.8, 8.6], [103.4, 7.4], [100.2, 9.3], [109.6, 2.9], [110.4, 3.5], [111.6, 2.75], [112.6, 3.3], [93.5, 6.6], [92.2, 7.4]]) put(s, lat, 1.5);
    for (const [bs, bl, n, ss, sl] of [[89, -4.4, 6, 2.6, 0.9], [97, -5.0, 6, 2.6, 1.0], [104, -4.6, 6, 2.4, 1.0], [20, 9.5, 6, 3, 1.5], [33, -8.0, 6, 3, 1.3], [58, 8.5, 5, 2.5, 1.2], [61, -7.5, 6, 3, 1.3], [72, -9.5, 5, 3, 1.5]]) {
      for (let i = 0; i < n; i++) { const s = bs + prng.gauss() * ss, lat = bl + prng.gauss() * sl; if (Math.abs(lat) >= 2.9) put(s, lat, 2.6); }
      await ctx.yield();
    }
    await ctx.yield();
    // knee-high horsetail shoots: thick beside the path and round the bar, thinner out across the channel
    const shoots = [], nShoot = Math.round(1000 * detail * clamp(density, 0.8, 1.25));
    for (let i = 0, tries = 0; shoots.length < nShoot && tries < 14000; tries++, i++) {
      if (tries % 80 === 79) await ctx.yield();
      const far = prng() < 0.24, s = prng.range(-45, L + 20), lat = far ? prng.range(-22, 55) : prng.range(-11, 12) * prng();
      if (Math.abs(lat) < 1.7 || (s > 231 && s < 256 && lat > 0 && lat < 5.5)) continue;
      lay.at(s, lat, v);
      if (ctx.noise.fbm2(v.x * 0.09 + 50, v.z * 0.09, 2) < (far ? 0.05 : -0.4)) continue;        // in patches
      if (onBar(s, lat, -1.6) && (lat > -1.5 || prng() > 0.13)) continue;   // the bar itself is bare mud on our left: nothing stands between us and the sails
      const h = lay.heightAt(v.x, v.z); if (h < -1.6 || h > 0.75 || nearP(v.x, v.z, 2.3)) continue;
      const big = far ? prng.range(1.0, 1.45) : prng.range(0.62, 1.0);
      shoots.push({ ...spot(v.x, v.z, { s: big, sy: prng.range(0.8, 1.3) }), y: Math.max(h, -0.3) });
    }
    for (let i = 0; i < Math.round(46 * detail); i++) {      // horsetails on the entry shoal, on our right
      lay.at(prng.range(11, 47), -prng.range(3.3, 9.5), v); const h = lay.heightAt(v.x, v.z);
      if (h < 0.02 || h > 0.5 || nearP(v.x, v.z, 1.7)) continue;
      shoots.push({ ...spot(v.x, v.z, { s: prng.range(0.7, 1.15), sy: prng.range(0.8, 1.3) }), y: h });
    }
    await ctx.yield();
    // polish 3: groves on the east bank, 45-90 m off beyond the bar, and more conifers along the west levee: the horizon behind the
    // fleet is a broken dark treeline against the rose band, not a ruled line (none stands on the line from the sunrise stretch to the sun)
    for (const [gx, gz, n] of [[-12, -64, 5], [30, -90, 4], [62, -64, 6], [104, -78, 5], [140, -61, 4], [172, -84, 6], [206, -65, 5], [234, -94, 4]]) {
      for (let i = 0; i < n; i++) { const a = prng() * TAU, r = Math.sqrt(prng()) * 9; combTrees.push(spot(gx + Math.cos(a) * r * 1.5, gz + Math.sin(a) * r * 0.7, { s: prng.range(0.95, 1.5), sink: 0.25, sway: 0.6 })); }
      for (let i = 0; i < 2; i++) sferns.push(spot(gx + prng.range(-12, 12), gz + prng.range(4, 9), { s: prng.range(0.9, 1.4) }));
      await ctx.yield();
    }
    for (let i = 0; i < 10; i++) { const x = -22 + i * 41 + prng.range(-9, 9), z = 40 + 3 * Math.sin(x * 0.021) + prng.range(-3, 6); if (Math.abs(lay.info(x, z).lat) > 14) farTrees.push(spot(x, z, { s: prng.range(0.9, 1.4), sink: 0.2 })); }
    const frng = rng.fork ? rng.fork('geo2') : rng;
    scene.add(plantMesh(walchiaGeo(frng), pmat, trees, 'walchia')); await ctx.yield();
    scene.add(plantMesh(walchiaGeo(frng, true), pmat, farTrees, 'walchia-far')); await ctx.yield();
    scene.add(plantMesh(walchiaGeo(frng, 2), pmat, combTrees, 'walchia-comb')); await ctx.yield();
    scene.add(plantMesh(calamitesGeo(frng), pmat, canes, 'calamites')); await ctx.yield();
    scene.add(plantMesh(calamitesGeo(frng, true), pmat, nearCanes, 'calamites-near')); await ctx.yield();
    scene.add(plantMesh(shootGeo(frng), pmat, shoots, 'shoots')); await ctx.yield();
    {
      const wet = (p) => { const inf = lay.info(p.x, p.z), lat = inf.lat, s = inf.s; return p.y < -0.02 && lat > -9 && (lay.barHalf(s) < 0.5 ? lat < 9 : lat < lay.barEdge(s) + 0.3); };
      const mmat = plantMaterial(U, true), sg = scene.getObjectByName('shoots').geometry.clone(), cg = scene.getObjectByName('calamites').geometry.clone();
      await ctx.yield();
      const wetS = shoots.filter(wet); await ctx.yield();
      const ms = plantMesh(sg, mmat, wetS, 'shoots-mirror'), mc = plantMesh(cg, mmat, canes.filter(wet), 'canes-mirror');
      ms.renderOrder = 2; mc.renderOrder = 2; scene.add(ms); scene.add(mc);
    }
    await ctx.yield();
    scene.add(plantMesh(seedFernGeo(frng), pmat, sferns, 'seedferns'));
    scene.add(plantMesh(treeFernGeo(frng), pmat, tferns, 'treeferns')); await ctx.yield();

    // ---- the small cast
    const cmat = critterMaterial(U), crng = rng.fork ? rng.fork('cast') : rng;
    const nDip = Math.round(clamp(crng.range(8, 20), 10, 20)), FIXS = [15, 70, 248, 284, 351, 321, 64], dips = [], rings = [], tt0 = new THREE.Vector3();
    const wetAt = (s, lat) => { lay.at(s, lat, v); return lay.heightAt(v.x, v.z) < -0.13 && !onBar(s, lat, 0.6); };
    const nPair = Math.ceil(nDip / 2), dS = (L - 44) / nPair;
    for (let p = 0; dips.length < nDip && p < 40; p++) {        // in twos: one sinks ahead of us inside its ring, its partner holds on as we pass
      let s0 = 16 + ((p % nPair) + crng.range(0.2, 0.8)) * dS; const side = p % 2 ? 1 : -1;
      if (p < FIXS.length) s0 = FIXS[p];
      for (let m = 0; m < 2 && dips.length < nDip; m++) {
        const s = s0 + m * crng.range(1.1, 1.9), l0 = m ? 2.3 : 1.35; let lat = 0;
        for (const c of (s0 === 248 ? [m ? 2.5 : 1.45] : [side * l0, -side * l0, -4.4 - m, -5.8 - m])) if (wetAt(s, c)) { lat = c; break; }
        if (!lat) continue;
        lay.at(s, lat, v); path.tangentAtDist(clamp(s, 0, L), tt0);
        const late = (m ? 4 : 0) + (s0 === 248 ? 2.5 : 0);
        dips.push({ x: v.x, z: v.z, s, late, yaw: Math.atan2(tt0.z, -tt0.x) + (lat > 0 ? -1 : 1) * crng.range(0.45, 1.0), ph: crng() });      // heads toward us, turned three-quarter
        rings.push({ x: v.x, z: v.z, sAt: s - 27 }, { x: v.x, z: v.z, sAt: s - 6.5 + late });
      }
    }
    const dipMesh = critterMesh(diplocaulusGeo(), cmat, nDip, 'diplocaulus'); scene.add(dipMesh); dipMesh.count = dips.length;
    dips.forEach((d, i) => dipMesh.userData.aI.set([d.ph, -10, 0.035, 0], i * 4));
    await ctx.yield();
    const eryMesh = critterMesh(eryopsGeo(), cmat, eryS.length, 'eryops'); scene.add(eryMesh);
    const ery = eryS.map((s, i) => {
      const a = lay.at(s, eryLat(s, i), new THREE.Vector3()), b = lay.at(s + 2.2, 1.7, new THREE.Vector3());
      a.y = Math.max(lay.heightAt(a.x, a.z), -0.09); b.y = -0.07;
      eryMesh.userData.aI.set([crng(), -10, 0.05, 0], i * 4);
      return { a, b, yaw: Math.atan2(-(b.z - a.z), b.x - a.x) + [0.9, 0, 2.6, -2.2, 2.4, 2.3][i] };
    });
    rings.push({ x: lerp(ery[1].a.x, ery[1].b.x, 0.6), z: lerp(ery[1].a.z, ery[1].b.z, 0.6), sAt: eryS[1] - 6 });
    const flyMesh = critterMesh(griffinflyGeo(), cmat, 4, 'griffinflies'); scene.add(flyMesh);
    const flyOff = [[1.35, 0.3], [0.4, 0.6], [0.9, 0.7], [1.0, 0.2]];     // where each crosses: metres left of our line, metres above the eye
    const flies = [0.165, 0.655, 0.868, 0.79].map((u0, i) => {
      const c = i === 1 ? lay.at(u0 * L + 34, -12, new THREE.Vector3()) : i < 3 ? lay.at(u0 * L + 30, 9, new THREE.Vector3()) : lay.at(34, 5.5, new THREE.Vector3());
      flyMesh.userData.aI.set([crng(), -10, 0, 1], i * 4);
      return { u0, c, cy: 2.3 + 0.5 * crng(), ph: crng() * TAU, w: crng.range(0.5, 0.75), dir: i % 2 ? -1 : 1, pos: new THREE.Vector3(), yaw: 0 };
    });
    // A CROSSING FLY LEAVES FORWARD (repair sa1d; the lead's order of 2026-10-08, one rule of place). In live the fourth griffinfly (u0 0.79), led 1 m ahead of
    // the lens while its window is open, is drawn back when the window closes to its pool at route metre 34, 290 m BEHIND us: a straight line through the lens's
    // own place. From its crossing on (u at or past its u0: the window is fully open there and the pool has no weight) its pool is a SECOND POOL ahead of its
    // crossing place, laid as the other three's are: AHEAD metres past it along the route, on the side it is crossing toward, at the least lateral distance,
    // in half metres from 5.5 m up to 30 m, at which its WHOLE hawking track (update()'s figure of eight at every phase and at every height of its swing,
    // widened by the fly's reach and its rise at the size it is drawn) keeps AIR metres of clear air from the route's WHOLE line and touches nothing that
    // stands: no upright cylinder that holds a standing sail-back's body (as the hero part builds it, rolled to its greatest) or a plant (cane, tree, fern or
    // shoot as built, at its own scale and lean), nor the ground. If that side has no such place AHEAD metres on, the same on that side at the station
    // nearest to it that has one, in steps of 2 m from 30 to 50 m past the crossing place (the farther first of two as near: 36, 32, 38, 30, 40, 42 .. 50):
    // the fly still leaves forward and to the side it was crossing toward. (The other side comes after them all: the lens looks that way at the crossing,
    // and the fly's way to a pool there lies across the picture, through the canes and the sail-backs of the second spit.) Last, the least lateral distance
    // on the first side, AHEAD metres on, that keeps the route's clear air alone. Before its crossing its pool is live's (f.c): the start of the film is
    // untouched. No draw from any stream; nothing from the eye or the clock; no phase, fade or shrink. On the rare morning the pools follow the lens
    // (update()) and no second pool is laid.
    if (!rare) { const f = flies[3], AIR = 2.0, AHEAD = 34, lo = f.cy - 0.7, hi = f.cy + 0.7, NT = 720, tx = new Float64Array(NT), tz = new Float64Array(NT);
      for (let k = 0; k < NT; k++) { tx[k] = 5 * Math.sin(k / NT * TAU); tz[k] = 2.6 * Math.sin(2 * k / NT * TAU); }      // the track about its pool, as update() flies it
      // the fly's reach: its farthest vertex from its own centre, the wings at either end of their beat (critterMaterial: 0.2 of the span), at the 1.1 it is drawn
      // at; its rise: how far a vertex can stand above or below its centre as update() holds it while it hawks (pitch 0.08, roll 0.2 sin 2t + 0.3 dir: 0.5 at most)
      const gp = flyMesh.geometry.attributes.position.array, ga = flyMesh.geometry.attributes.aAnim.array; let reach = 0, rise = 0;
      for (let j = 0, q = 0; j < gp.length; j += 3, q += 4) { const y = Math.abs(gp[j + 1]) + 0.2 * Math.abs(ga[q + 1] * gp[j + 2]);
        reach = Math.max(reach, 1.1 * Math.hypot(gp[j], y, gp[j + 2])); rise = Math.max(rise, 1.1 * (Math.abs(gp[j]) * Math.sin(0.08) + y + Math.abs(gp[j + 2]) * Math.sin(0.5))); }
      const off = (cx, cz, x, z) => { let b = Infinity; for (let k = 0; k < NT; k++) { const dx = cx + tx[k] - x, dz = cz + tz[k] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };      // metres in plan from a point to the track about (cx, cz)
      const stand = [], dims = (name) => { const a = scene.getObjectByName(name).geometry.attributes.position.array; let r = 0, h = 0; for (let j = 0; j < a.length; j += 3) { r = Math.max(r, Math.hypot(a[j], a[j + 2])); h = Math.max(h, a[j + 1]); } return [r, h]; };
      for (const [list, name] of [[trees, 'walchia'], [farTrees, 'walchia-far'], [combTrees, 'walchia-comb'], [canes, 'calamites'], [nearCanes, 'calamites-near'], [shoots, 'shoots'], [sferns, 'seedferns'], [tferns, 'treeferns']]) {
        const [r, h] = dims(name);      // all that stands, each as [x, z, radius, top] of an upright cylinder that holds it
        for (const p of list) { const sl = Math.abs(Math.sin(p.lean)), ph = h * p.s * p.sy; stand.push([p.x, p.z, r * p.s + ph * sl, p.y + ph + r * p.s * sl]); }
        await ctx.yield();
      }
      for (const kind of ['eda', 'edaFar', 'dim']) {
        const [r, h] = dims('sailbacks-' + kind);
        for (const p of placements) if (p.kind === kind) { const sl = Math.sin(0.052 + 0.02 + Math.abs(p.tilt)); stand.push([p.x, p.z, (r + h * sl) * p.scale, p.y + (h + r * sl) * p.scale]); }
        await ctx.yield();
      }
      const route = [], nR = Math.ceil(L / 0.2); for (let i = 0; i <= nR; i++) { path.posAtDist(Math.min(i * 0.2, L), v); route.push(v.x, v.y, v.z); }
      await ctx.yield();
      const clear = (cx, cz, all) => {      // is the track about (cx, cz) clear of the route (and, if all, of all that stands and of the ground)?
        for (let i = 0; i < route.length; i += 3) {
          if (Math.abs(route[i] - cx) > 5 + AIR + reach || Math.abs(route[i + 2] - cz) > 2.6 + AIR + reach) continue;
          if (Math.hypot(off(cx, cz, route[i], route[i + 2]), Math.max(0, lo - route[i + 1], route[i + 1] - hi)) - reach < AIR) return false;
        }
        if (!all) return true;
        for (const [x, z, r, top] of stand) if (top + rise > lo && Math.abs(x - cx) < 5 + r + reach && Math.abs(z - cz) < 2.6 + r + reach && off(cx, cz, x, z) < r + reach) return false;
        for (let k = 0; k < NT; k += 8) if (lay.heightAt(cx + tx[k], cz + tz[k]) + rise > lo) return false;
        return true;
      };
      for (const [side, all, on] of [...[0, 2, -2, 4, -4, 6, 8, 10, 12, 14, 16].map((d) => [f.dir, true, AHEAD + d]), [-f.dir, true, AHEAD], [f.dir, false, AHEAD]]) for (let lat = 5.5; lat <= 30 && !f.c2; lat += 0.5) {
        lay.at(f.u0 * L + on, side * lat, v); if (clear(v.x, v.z, all)) f.c2 = v.clone();
        await ctx.yield();
      } }
    await ctx.yield();
    // gnats over the pools; on a rare morning, a hatch of thousands rising through the sun line
    const gn = [], nG = Math.round(600 * detail * (detail < 0.8 ? 0.6 : 1));
    for (let i = 0; i < nG; i++) {
      const k = i % 26, s = 8 + k * 15.5 + ((k * 7) % 5), lat = (k % 2 ? 1 : -1) * (3.5 + (k * 3) % 5);
      lay.at(s + crng.gauss() * 1.6, lat + crng.gauss() * 1.3, v);
      gn.push({ x: v.x, y: crng.range(0.5, 2.7), z: v.z, ph: crng(), rise: 0, orbit: crng.range(0.2, 0.5), size: 0.022 });
    }
    const gnats = moteMesh(U, gn, 3); scene.add(gnats);
    if (rare) {
      const hl = [], nH = Math.round(7000 * detail);
      for (let i = 0; i < nH; i++) {
        const near = crng() < 0.7; lay.at(crng.range(-25, L + 5), near ? crng.range(-8, 10) : crng.range(-20, 34), v);
        hl.push({ x: v.x, y: crng.range(0, 4.2), z: v.z, ph: crng(), rise: crng.range(0.2, 0.55), orbit: crng.range(0.12, 0.32), size: 0.027 });
        if (i % 800 === 799) await ctx.yield();
      }
      scene.add(moteMesh(U, hl, 4.2, 1.7));
    }
    await ctx.yield();

    // ---- per-frame helpers (no allocation in update)
    const camP = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), mtx = new THREE.Matrix4(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), tt = new THREE.Vector3();
    const AX_Y = new THREE.Vector3(0, 1, 0), AX_Z = new THREE.Vector3(0, 0, 1), AX_X = new THREE.Vector3(1, 0, 0), size = new THREE.Vector2(), sunV = new THREE.Vector3();
    const setM = (mesh, i, x, y, z, yaw, pitch, roll, s) => {
      q1.setFromAxisAngle(AX_Y, yaw); q2.setFromAxisAngle(AX_Z, pitch); q1.multiply(q2);
      if (roll) { q2.setFromAxisAngle(AX_X, roll); q1.multiply(q2); }
      pp.set(x, y, z); sc.setScalar(s); mtx.compose(pp, q1, sc); mesh.setMatrixAt(i, mtx);
    };
    const refD = new Float32Array(placements.length), refUsed = new Uint8Array(placements.length);
    const cFogB = U.uFogCol.value.clone(), cFogW = LIN(pal[5]).multiplyScalar(0.8), cWarm0 = LIN(pal[3]), cWarm1 = LIN(pal[5]);
    const fogC = scene.fog.color;
    const cSunE = LIN(pal[4]), cSunG = LIN(pal[4]).lerp(LIN(pal[5]), 0.42), cMid0 = U.uMidSky.value.clone(), cMid1 = cMid0.clone().lerp(LIN('#5E8FCC'), 0.5), cZen0 = U.uZen.value.clone(), cZen1 = cZen0.clone().lerp(LIN('#2B4E94'), 0.45);
    const SPEED = L / 46;

    const poiSpit = lay.at(320.6, 4.6, new THREE.Vector3()).setY(1.35), poiFleet = new THREE.Vector3(), poiBank = lay.at(14.6, 5.0, new THREE.Vector3()).setY(1.1), poiSpit1 = lay.at(289.5, 6.2, new THREE.Vector3()).setY(1.2), poiGate = lay.at(360, 6.6, new THREE.Vector3()).setY(1.5), poiTmp = new THREE.Vector3(), poiPoint = lay.at(247.5, 5.6, new THREE.Vector3()).setY(0.75), poiPair = lay.at(175.0, 5.3, new THREE.Vector3()).setY(1.55);
    return {
      scene, path, duration: 46,
      pace: (u) => 1.12 - 0.46 * sst(0.26, 0.32, u) + 0.5 * sst(0.63, 0.69, u) - 0.14 * sst(0.8, 0.88, u),     // the long linger is among the sails, through the sunrise and past the pair on the point
      title: 'Red Sails at Sunrise · 280 million years ago',
      ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 1200, lookAhead: 30, sway: 0.15, bank: 0.5, nearThrough: 0.3 },     // the pool in front of the entry is in the portal picture (ground and water reach 110 m behind the entry; nothing is carried)
      pois: [
        { at: poiBank, from: -0.06, to: 0.062, weight: 0.95, fade: 0.3 },
        // the fleet: ahead-left to the first sails, then broadside to the hero row (u 0.30-0.36), then obliquely down the row to the
        // display pair (u 0.43), then into the sunrise between the nearest sails (u 0.48-0.55)
        { at: (time, u) => {
          const k1 = sst(0.14, 0.28, u), k2 = sst(0.375, 0.415, u), k3 = sst(0.45, 0.49, u);
          const k0 = sst(0.125, 0.16, u), kc = sst(0.2, 0.235, u) * (1 - sst(0.265, 0.29, u));
          lay.at(u * L + lerp(lerp(9, 16, k0), 5.0, k1), lerp(lerp(1.1, 7.5, k0), 6.2, k1) - 2.4 * kc, poiFleet).setY(lerp(1.25, 1.0, k0 * (1 - k1)));     // down the aisle of the isthmus, then out over the channel to the fleet, then through the canes
          poiFleet.lerp(poiPair, k2);          // polish 2: a portrait of the display pair, 4.7 m off, the dawn behind their sails
          path.posAtDist(u * L, poiTmp); poiTmp.x += sunAz.x * 16; poiTmp.z += sunAz.y * 16; poiTmp.y = 1.75;
          return poiFleet.lerp(poiTmp, k3);
        }, from: 0.035, to: 0.6, weight: 0.8, fade: 0.1 },
        { at: poiPoint, from: 0.56, to: 0.66, weight: 0.8, fade: 0.28 },
        { at: poiSpit1, from: 0.655, to: 0.775, weight: 0.6, fade: 0.3 },
        { at: poiSpit, from: 0.745, to: 0.835, weight: 0.9, fade: 0.3 },
        { at: poiGate, from: 0.84, to: 0.92, weight: 0.4, fade: 0.35 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#EE8A4E', glow: 0.75, revealDistance: 140 },      // ember-peach: a glowing opening, not a pale pane, against the blue west
      post: { exposure: 1.0, bloom: { strength: 0.55, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.06, contrast: 1.06, tint: '#ffffff', shadowTint: '#10142a', vignette: 0.25, grain: 0, aberration: 0 } },
      update(dt, time, camera, u) {
        hero.update(dt, time, camera); hero.setProgress(u + 0.055 * sst(0.1, 0.38, u) * (1 - sst(0.62, 0.9, u))); hero.setSunLine(lineAt(u) + lineShift); U.uEmberGain.value = 2.7;
        camP.setFromMatrixPosition(camera.matrixWorld);
        ctx.renderer.getDrawingBufferSize(size); U.uPixH.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
        // the sun: behind the far levee's comb until u 0.5, 4 degrees up at the exit; one light direction for everything
        const el = lerp(-0.03, 0.085, sst(0, 0.75, u)) + 0.012 * hourK, ce = Math.cos(el);
        U.uSunVis.value.set(sunAz.x * ce, Math.sin(el), sunAz.y * ce);
        U.uSunUp.value = sst(0.18, 0.40, u);
        sunV.set(sunAz.x, Math.max(el, 0.05), sunAz.y); hero.setSun(sunV);
        U.uProg.value = clamp(0.2 + 0.85 * u + 0.12 * hourK, 0, 1);
        U.uFogCol.value.copy(cFogB).lerp(cFogW, 0.08 * sst(0.45, 0.9, u)); U.uFogWarm.value.copy(cWarm0).lerp(cWarm1, 0.6 * sst(0.2, 0.8, u));
        // polish 4: the dawn keeps its contrast to the end: the sun stays ember-gold (never pale peach), the cool fill sinks as the sun
        // takes over (shade stays blue-violet, a full stop under the light), the sky above the band turns a clearer blue
        const dayK = sst(0.42, 0.72, u);
        U.uSunColor.value.copy(cSunE).lerp(cSunG, sst(0.3, 0.8, u));
        U.uHemiW.value = lerp(1.8, 1.38, dayK); U.uHemiI.value = lerp(1.6, 1.22, dayK);
        U.uMidSky.value.copy(cMid0).lerp(cMid1, dayK); U.uZen.value.copy(cZen0).lerp(cZen1, dayK);
        fogC.copy(U.uFogCol.value);
        sky.position.copy(camP); sky.material.uniforms.uStars.value = 1 - sst(0.15, 0.55, u);
        const camS = u * L;
        // Diplocaulus: each rises ahead of us, holds, and sinks with one ring
        for (let i = 0; i < dips.length; i++) {
          const d = dips[i], rise = sst(d.s - 27, d.s - 22, camS), sk = sst(d.s - 6 + d.late, d.s - 0.5 + d.late, camS), up = rise * (1 - sk);
          setM(dipMesh, i, d.x, -0.3 + 0.335 * rise - 0.4 * sk * sk + 0.008 * Math.sin(time * 1.7 + d.ph * 9), d.z, d.yaw + 0.25 * Math.sin(time * 0.3 + d.ph * 5), 0.2 * up, 0, 1.2);
        }
        dipMesh.instanceMatrix.needsUpdate = true;
        // Eryops: one lies still on the bar's edge, one slides into the water on its belly at u 0.36
        for (let i = 0; i < ery.length; i++) if (i !== 1) setM(eryMesh, i, ery[i].a.x, ery[i].a.y, ery[i].a.z, ery[i].yaw, 0, 0, i >= 4 ? 1.08 : 1);
        const k1 = sst(eryS[1] - 13, eryS[1] + 1, camS), e1 = ery[1];
        setM(eryMesh, 1, lerp(e1.a.x, e1.b.x, k1), lerp(e1.a.y, e1.b.y, sst(0.2, 0.8, k1)), lerp(e1.a.z, e1.b.z, k1), e1.yaw + 0.06 * Math.sin(k1 * 14), -0.2 * Math.sin(Math.PI * k1), 0, 1);
        eryMesh.instanceMatrix.needsUpdate = true;
        // griffinflies: hawking in figures of eight over their pools; three cross 4-5 m ahead of us, rising through the line
        for (let i = 0; i < 4; i++) {
          const f = flies[i], t = time * f.w + f.ph;
          const c = f.c2 && u >= f.u0 ? f.c2 : f.c;      // (sa1d) the fourth fly's second pool, from its crossing on
          let cx = c.x, cz = c.z, rx = 5, rz = 2.6;
          if (rare) { lay.at(camS + 13 + 5.5 * i, 4.5 + 1.6 * i, tt); cx = tt.x; cz = tt.z; rx = 3; rz = 1.6; }
          let x = cx + rx * Math.sin(t), z = cz + rz * Math.sin(2 * t), y = f.cy + 0.7 * Math.sin(t * 0.7 + 1), bankK = 0, yawT = 0;
          if (f.u0 >= 0) {
            const wv = sst(f.u0 - 0.06, f.u0 - 0.02, u) * (1 - sst(f.u0 + 0.02, f.u0 + 0.06, u));
            if (wv > 0) {
              const k = clamp((u - f.u0) / 0.02, -1.5, 1.5), lat = k * (i === 3 ? 0.9 : 3.0) * f.dir + flyOff[i][0] + 0.12 * Math.sin(time * 2.3 + f.ph);
              const ahead = i === 3 ? 1.0 : i ? 2.9 : 2.5 /* the last hangs 2 m off, between us and a sail on the second spit, the sun behind it */; path.posAtDist(camS + ahead, pp); path.tangentAtDist(clamp(camS + ahead, 0, L), tt);
              x = lerp(x, pp.x + tt.z * lat, wv); z = lerp(z, pp.z - tt.x * lat, wv); y = lerp(y, pp.y + 0.05 + flyOff[i][1] + (i === 3 ? 0.12 : 0.5) * k + 0.07 * Math.sin(time * 3.1 + f.ph), wv);
              // polish 3: it crosses in a steep banked turn, its back toward us: four veined wings in plan, lit through, not a line seen from behind
              bankK = wv; yawT = Math.atan2(-tt.z, tt.x) + f.dir * 1.2;
            }
          }
          const dx = x - f.pos.x, dz = z - f.pos.z;
          if (dx * dx + dz * dz > 1e-6) f.yaw = Math.atan2(-dz, dx);
          f.pos.set(x, y, z);
          let yawU = f.yaw;
          if (bankK > 0) { let d = yawT - f.yaw; d -= Math.round(d / TAU) * TAU; yawU = f.yaw + d * bankK; }
          setM(flyMesh, i, x, y, z, yawU, 0.08, lerp(0.2 * Math.sin(t * 2) + 0.3 * f.dir, -f.dir * (i === 3 ? 0.62 : 1.0), bankK), 1.1);
        }
        flyMesh.instanceMatrix.needsUpdate = true;
        // ripple rings: the latest sink in each slot
        const UR = water.uni.uRing.value;
        for (let k = 0; k < RING_N; k++) {
          let best = -1, bs = -1e9;
          for (let j = k; j < rings.length; j += RING_N) if (camS >= rings[j].sAt && rings[j].sAt > bs) { best = j; bs = rings[j].sAt; }
          if (best >= 0) { const age = (camS - bs) / SPEED; UR[k].set(rings[best].x, rings[best].z, age, age < 9 ? 1 : 0); } else UR[k].w = 0;
        }
        // mirrored sails: the eight sail-backs nearest the camera
        const RA = water.uni.uRefA.value, RB = water.uni.uRefB.value, RC = water.uni.uRefC.value, np = placements.length;
        for (let i = 0; i < np; i++) { refD[i] = Math.hypot(placements[i].x - camP.x, placements[i].z - camP.z); refUsed[i] = 0; }
        for (let k = 0; k < REF_N; k++) {
          let b = -1, bd = 40;
          for (let i = 0; i < np; i++) if (!refUsed[i] && refD[i] < bd) { b = i; bd = refD[i]; }
          if (b < 0) { RA[k].w = 0; continue; }
          refUsed[b] = 1;
          const p = placements[b], S = p.kind === 'dim' ? SAIL.dim : SAIL.eda;
          RA[k].set(p.x, p.z, p.yaw, p.mist === false ? 0 : p.refl * (1 - sst(26, 38, bd))); RB[k].set(S[0], S[1], S[2], p.scale); RC[k].set(S[3], S[4], p.y, p.kind === 'dim' ? 1 : 0);
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
