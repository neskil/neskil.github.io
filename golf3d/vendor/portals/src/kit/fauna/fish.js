// Fish schools and jellyfish: instanced, body wiggle and bell pulse in the vertex shader.
import * as THREE from 'three';
import { Geo, col, rngOf, resolveRoute, routeBounds, sphereOfPoints, creatureMaterial, instancedGeo, creatureMesh, triCount, applyLight } from './common.js';

// colour is packed for the reef/koi painters: r = brightness, g = accent mask, b = dark mask (plain fish: real rgb)
export const FISH_PRESETS = {
  sardines: { len: 0.2, depth: 0.2, width: 0.11, tailH: 0.23, tailL: 0.2, dorsal: 0.5, paint: 0, lod: 'low', count: 2000, form: 'baitball', spread: [6, 4.8], speed: 3.2, size: 2.1, swim: [3.2, 0.09, 5.5],
    top: '#3c5f78', belly: '#e6f0f4', fin: '#8aa4b4', spec: 2.6, shine: 18 },
  mackerel: { len: 0.4, depth: 0.2, width: 0.12, tailH: 0.3, tailL: 0.22, dorsal: 0.6, paint: 0, count: 220, form: 'school', spread: [10, 4, 26], speed: 4.5, size: 1.5, swim: [2.6, 0.08, 5.5], wander: [0.8, 0.5, 0.6, 0.5],
    top: '#2e6a70', belly: '#e8eef0', fin: '#6f8c96', spec: 2.2, shine: 20 },
  reef: { len: 0.24, depth: 0.42, width: 0.14, tailH: 0.34, tailL: 0.24, dorsal: 1, paint: 1, lod: 'high', count: 160, form: 'school', spread: [12, 5, 16], speed: 1.6, size: 1.6, swim: [2.4, 0.07, 4.5], wander: [2.2, 1.2, 2.0, 0.45],
    top: '#ffffff', belly: '#ffffff', fin: '#ffffff', spec: 0.5, shine: 16,
    varieties: [['#ff7a1a', '#ffffff'], ['#1f6fe0', '#ffd21f'], ['#ffd91f', '#fff3a0'], ['#f4f4f0', '#16161a'], ['#18b8a8', '#ff6fa8'], ['#ff5f7a', '#8a3fd0'], ['#2a4cff', '#101018']] },
  koi: { len: 0.6, depth: 0.27, width: 0.2, tailH: 0.36, tailL: 0.3, dorsal: 0.7, paint: 2, lod: 'high', count: 14, form: 'pond', spread: [9, 0.25], speed: 0.55, size: 1.4, swim: [1.1, 0.085, 4.2],
    top: '#ffffff', belly: '#ffffff', fin: '#ffffff', spec: 0.9, shine: 30,
    varieties: [['#f8f4ec', '#ff5a14'], ['#f8f4ec', '#e8281a'], ['#ff8a1f', '#f8f4ec'], ['#f6f2ea', '#18181c'], ['#ffc21f', '#ff6a14']] },
  glowfish: { len: 0.22, depth: 0.3, width: 0.12, tailH: 0.3, tailL: 0.26, dorsal: 0.8, paint: 0, count: 300, form: 'school', spread: [12, 5, 26], speed: 3, size: 1.6, swim: [2.8, 0.08, 5], wander: [1.2, 0.8, 1.0, 0.5],
    top: '#12303c', belly: '#1c5060', fin: '#2a7a88', spec: 0.6, shine: 16, glow: '#38ffe0', glowK: 2.2 },
};

// Fish model: nose +Z, length S.len. aAnim.x = fin (thin) flag
export function fishGeometry(S, lod = 'high') {
  const g = new Geo(), L = S.len, H = S.depth * L * 0.5, Wd = S.width * L * 0.5, hi = lod === 'high', mid = lod === 'mid';
  const packed = S.paint > 0, cTop = packed ? new THREE.Color(0.8, 0, 0) : col(S.top), cBel = packed ? new THREE.Color(1, 0, 0) : col(S.belly), cFin = packed ? new THREE.Color(0.9, 1, 0) : col(S.fin);
  const prof = hi ? [[-0.5, 0.0], [-0.44, 0.17], [-0.3, 0.42], [-0.12, 0.84], [0.08, 1], [0.26, 0.9], [0.4, 0.6], [0.47, 0.32], [0.5, 0]] : mid ? [[-0.5, 0], [-0.42, 0.2], [-0.16, 0.78], [0.12, 1], [0.38, 0.62], [0.5, 0]] : [[-0.5, 0], [-0.4, 0.22], [0.05, 1], [0.38, 0.62], [0.5, 0]];
  const rings = prof.map(([z, k], i) => ({ z: z * L, y: (i === prof.length - 1 ? -0.12 : 0) * H, rx: Wd * (i === 1 ? k * 0.55 : k), ry: H * k }));
  const body = g.loft(rings, { sides: hi ? 8 : mid ? 5 : 4, top: cTop, belly: cBel, shade: [-0.35, 0.45] });
  if (packed) g.paint(body, (x, y, z, c) => {
    const zn = z / L;
    if (S.paint === 1) { const band = Math.max(0, 1 - Math.abs(zn - 0.22) / 0.07) + Math.max(0, 1 - Math.abs(zn + 0.12) / 0.08) + Math.max(0, 1 - Math.abs(zn + 0.4) / 0.06); c.g = Math.min(1, band * 1.6); c.b = zn > 0.38 && y > 0 ? 0.0 : 0; }
    else { c.g = 0; c.b = 0; }
  });
  if (!packed && (hi || mid)) g.glow(body, (x, y, z) => (Math.abs(y) < H * 0.25 ? 1 : 0));
  // tail fin (vertical), forked
  const tz = -0.45 * L, th = S.tailH * L, tl = S.tailL * L, fins = [];
  fins.push(g.fan([[0, 0, tz + 0.04 * L], [0, th * 0.55, tz - tl], [0, th * 0.12, tz - tl * 0.55], [0, 0, tz - tl * 0.45], [0, -th * 0.12, tz - tl * 0.55], [0, -th * 0.55, tz - tl]], cFin));
  if (hi) {
    const d = S.dorsal;
    fins.push(g.fan([[0, H * 0.9, 0.2 * L], [0, H * (0.95 + 0.75 * d), 0.02 * L], [0, H * (0.75 + 0.5 * d), -0.2 * L], [0, H * 0.5, -0.3 * L]], cFin));
    fins.push(g.fan([[0, -H * 0.85, -0.02 * L], [0, -H * (0.9 + 0.5 * d), -0.14 * L], [0, -H * 0.5, -0.3 * L]], cFin));
    for (const sx of [-1, 1]) fins.push(g.fan([[sx * Wd * 0.9, -H * 0.25, 0.22 * L], [sx * (Wd + 0.16 * L), -H * 0.6, 0.06 * L], [sx * (Wd + 0.05 * L), -H * 0.75, 0.1 * L]], cFin));
  } else if (mid) fins.push(g.fan([[0, H * 0.9, 0.2 * L], [0, H * (0.95 + 0.7 * S.dorsal), 0.0], [0, H * 0.55, -0.28 * L]], cFin));
  for (const f of fins) g.anim(f, () => [1, 0, 0, 0]);
  return g.build();
}

const FISH_PRE = /* glsl */`
uniform float uTravel, uSpeed, uGlowK; uniform vec4 uWander, uSwim, uBall; uniform vec3 uCenter;
uniform vec3 uColA[8]; uniform vec3 uColB[8];
float nz3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); float n = i.x + i.y*57. + i.z*113.;
  return mix(mix(mix(h11(n), h11(n+1.), f.x), mix(h11(n+57.), h11(n+58.), f.x), f.y), mix(mix(h11(n+113.), h11(n+114.), f.x), mix(h11(n+170.), h11(n+171.), f.x), f.y), f.z); }
`;
const FISH_TRAJ = /* glsl */`
vec3 traj(float q){
  float seed = iB.z; vec3 h = h31(seed);
#if FORM == 1
  // bait ball: every fish circles a shared axis, the ball breathes and leans
  float s = uTravel + (q - uTime) * uSpeed * .15;  // uTravel already runs at the slow centre speed
  vec3 c = routeAt(s); gFade = endFade(s);
  float r = iA.x, a = iA.z + q * uSpeed / max(r, 1.5) * uBall.x;
  float br = 1. + uBall.y * sin(q * .6 + iA.y * .35) + uBall.y * .6 * sin(q * .37 + a * 2.);
  vec3 o = vec3(cos(a) * r * br, iA.y * (1. + .5 * uBall.y * sin(q * .45 + 1.)) + sin(q * 1.3 * (.6 + h.x) + h.y * 30.) * uWander.y, sin(a) * r * br);
  o.xy = rot2(uBall.z * sin(q * .23)) * o.xy; o.zy = rot2(uBall.z * sin(q * .17 + 2.)) * o.zy;
  return c + o;
#elif FORM == 2
  // pond: each fish idles along its own slow Lissajous loop, nearly level
  float sp = uSpeed * (.6 + .8 * h.x) / max(uBall.x, 1.), t = q * sp;
  vec3 o = vec3(sin(t + h.y * 6.283) + .45 * sin(t * 2.3 + h.z * 9.), 0., cos(t * .83 + h.x * 6.283) + .45 * sin(t * 1.7 + h.y * 12.)) * uBall.x * .6;
  o.y = sin(t * 1.3 + h.z * 20.) * uBall.y;
  return uCenter + vec3(iA.x, iA.y, iB.w) * .35 + o;
#else
  float s = uTravel + (q - uTime) * uSpeed - iA.z;
  gFade = endFade(s);
  vec3 w = vec3(sin(q * uWander.w * (.6 + .8 * h.x) + h.y * 40.), sin(q * uWander.w * 1.3 * (.5 + .9 * h.z) + h.x * 50.), sin(q * uWander.w * .8 * (.7 + .6 * h.y) + h.z * 60.)) * uWander.xyz;
  return routeAt(s) + vec3(iA.x, iA.y, iB.w) + w;
#endif
}
`;
const FISH_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float seed = iB.z, zn = p.z / uSwim.w, w = .5 - zn;
  float a = uSwim.y * uSwim.w * (.12 + w * w);
  float arg = zn * uSwim.z + (uPhase * uSwim.x * (.8 + .4 * h11(seed)) + iA.w) * 6.2832;
  p.x += a * sin(arg);
  float slope = a * uSwim.z / uSwim.w * cos(arg) + 2. * w * uSwim.y * sin(arg) * -1.;
  n = normalize(vec3(n.x - slope * n.z, n.y, n.z + slope * n.x));
  gThin = aAnim.x;
#if PAINT == 1
  int v = int(iB.y + .5); vec3 A = uColA[v], B = uColB[v];
  vColor = mix(A, B, color.g) * color.r * iTint;
#elif PAINT == 2
  int v = int(iB.y + .5); vec3 A = uColA[v], B = uColB[v];
  vec3 pp = position / uSwim.w * vec3(3., 2., 3.2) + seed * 7.;
  float m = smoothstep(.42, .58, nz3(pp) + .25 * (h11(seed + 9.) - .5));
  float k = smoothstep(.6, .72, nz3(pp * 1.7 + 31.)) * step(.6, h11(seed + 5.));
  vColor = mix(mix(A, B, max(m, color.g * .6)), vec3(.03, .03, .04), k) * color.r * iTint;
#endif
  gEmit = uGlowColor * aGlow * uGlowK * (.6 + .4 * sin(uTime * 2. + seed * 9.));
}
`;

// makeFishSchool(opts): presets sardines (bait ball), mackerel, reef (colour varieties), koi (pond), glowfish. 1 draw call.
export function makeFishSchool(opts = {}) {
  const rng = rngOf(opts), name = opts.species || opts.preset || 'sardines', P = FISH_PRESETS[name] || FISH_PRESETS.sardines, o = (k) => opts[k] ?? P[k];
  const S = { ...P }; for (const k of ['top', 'belly', 'fin']) if (opts[k] !== undefined) S[k] = opts[k];
  const count = Math.max(1, Math.floor(o('count'))), form = o('form'), size = o('size'), lod = opts.lod || (count > 900 ? 'low' : P.paint ? 'high' : count > 150 ? 'mid' : (P.lod === 'low' ? 'mid' : 'high'));
  const base = fishGeometry(S, lod), spread = o('spread'), speed = o('speed'), swim = o('swim'), wander = o('wander') || [0.3, 0.3, 0.3, 0.5];
  const pond = form === 'pond', ball = form === 'baitball';
  const center = opts.center ? (opts.center.isVector3 ? opts.center.clone() : new THREE.Vector3(...opts.center)) : new THREE.Vector3(0, -12, 0);
  const R = pond ? null : resolveRoute({ ...opts, speed: ball ? (opts.drift ?? speed * 0.15) : speed }, rng, { center: [center.x, center.y, center.z], radius: ball ? 8 : 45, height: ball ? 2 : 5, span: 260 });
  const vars = (opts.varieties || P.varieties || [['#ffffff', '#ffffff']]).slice(0, 8), nv = vars.length;
  const colA = [], colB = []; for (let i = 0; i < 8; i++) { const v = vars[i % nv]; colA.push(col(v[0])); colB.push(col(v[1])); }
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x, y, z = 0, lag = 0;
    if (ball) { const rr = spread[0] * (0.3 + 0.7 * Math.pow(rng(), 0.55)), cz = rng() * 2 - 1, sz = Math.sqrt(1 - cz * cz); x = Math.max(0.6, rr * sz); y = rr * cz * (spread[1] / spread[0]); lag = rng() * 6.283; }
    else if (pond) { const a = rng() * 6.283, r = Math.sqrt(rng()) * spread[0]; x = Math.cos(a) * r; z = Math.sin(a) * r; y = rng.range(-1, 1) * spread[1]; }
    else { x = rng.gauss() * spread[0] * 0.45; y = rng.gauss() * spread[1] * 0.45; z = rng.gauss() * spread[0] * 0.45; lag = rng() * spread[2]; }
    iA.set([x, y, lag, rng()], i * 4); iB.set([size * rng.range(0.8, 1.2), rng.int(0, nv - 1), rng() * 100, z], i * 4);
    const l = rng.range(0.85, 1.12); iT.set([l, l, l], i * 3);
  }
  const material = creatureMaterial({
    instanced: true, route: R ? R.route : null, light: opts.light || 'underwater', bank: opts.bank ?? (pond ? 0 : 0.12), eps: pond ? 0.35 : 0.15,
    pre: FISH_PRE, traj: FISH_TRAJ, deform: FISH_DEFORM, defines: { FORM: ball ? 1 : pond ? 2 : 0, PAINT: P.paint }, level: pond ? 0.3 : 1,
    near: [S.len * size * 1.2, S.len * size * 3.2], rim: opts.rim ?? 0.5, vivid: opts.vivid ?? (P.paint ? 0.75 : 0.2), spec: opts.spec ?? P.spec, shine: P.shine, trans: 0.7, caustics: opts.caustics ?? 0.6, glow: opts.glow ?? P.glow ?? '#000000',
    uniforms: {
      uTravel: { value: 0 }, uSpeed: { value: speed }, uGlowK: { value: opts.glowIntensity ?? P.glowK ?? 0 }, uCenter: { value: center },
      uWander: { value: new THREE.Vector4(wander[0], ball ? (opts.jitter ?? 0.35) : wander[1], wander[2], wander[3]) },
      uSwim: { value: new THREE.Vector4(swim[0], swim[1], swim[2], S.len) },
      uBall: { value: pond ? new THREE.Vector4(spread[0], spread[1], 0, 0) : new THREE.Vector4(opts.spin ?? 1, opts.breathe ?? 0.14, opts.lean ?? 0.25, 0) },
      uColA: { value: colA }, uColB: { value: colB },
    },
  });
  let lat = 0, back = 0; for (let i = 0; i < count; i++) { lat = Math.max(lat, Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3])); if (!ball && !pond) back = Math.max(back, iA[i * 4 + 2]); }
  const pad = lat * (ball ? 1.45 : 1) + Math.hypot(wander[0], wander[1], wander[2]) + S.len * size * 2 + (pond ? spread[0] * 1.2 : 0);
  const B = R ? routeBounds(R, pad, back) : { sphere: new THREE.Sphere(center.clone(), pad), follow() {} };
  const geometry = instancedGeo(base, count, iA, iB, iT), object = creatureMesh(geometry, material, 0, B.sphere), u = material.uniforms;
  return {
    object, material, uniforms: u, geometry, count, route: R ? R.route : null, bounds: B.sphere, species: name, lod, triangles: triCount(base) * count,
    update(dt, time, camera, pu) { u.uTime.value = time; u.uQ.value = time; u.uPhase.value = time; if (R) { const s = R.step(dt, time, pu); u.uPhase.value = time + R.state.extra; u.uVis.value = R.state.vis; u.uTravel.value = s; B.follow(s); } },
    setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { return R ? R.route.pointAt(R.travel(time, pu), out) : out.copy(center); },
  };
}

// ---------- jellyfish ----------
// Model is Y-up: bell apex at +H, rim at 0, tentacles hang to -len.
// aAnim: bell (rim weight, 0, 0, 0) | oral arm (side -1..1, hang depth 0..1, phase, 1) | tentacle (side +-1, depth, phase, 2)
// aPivot: arm = outward radial direction (ruffle axis) | tentacle = centre-line point (the ribbon is billboarded around it)
export function jellyGeometry(S = {}) {
  const g = new Geo(), R = S.radius ?? 0.5, H = S.height ?? R * 0.75, len = S.length ?? R * 4.5, sides = S.sides ?? 14, rings = S.rings ?? 6, rnd = S.rnd || (() => 0.5);
  const cTop = col(S.bell ?? '#ffffff'), cRim = col(S.rim ?? '#ffffff'), cArm = col(S.arms ?? '#ffffff'), cT = col(S.tentacles ?? '#ffffff');
  const rows = [], c = new THREE.Color();
  for (let i = 0; i <= rings + 1; i++) {
    const t = Math.min(i, rings) / rings, a = t * Math.PI * 0.5, tuck = i > rings ? 1 : 0, row = [];
    c.copy(cTop).lerp(cRim, t * t);
    if (i === 0) { row.push(g.v(0, H, 0, c)); rows.push(row); continue; }
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * Math.PI * 2, sc = 1 + (i >= rings ? 0.05 * Math.cos(th * sides * 0.5) : 0), r = R * Math.pow(Math.sin(a), 0.85) * sc * (tuck ? 0.84 : 1);
      row.push(g.v(Math.cos(th) * r, H * Math.cos(a) - tuck * H * 0.18, Math.sin(th) * r, c));
    }
    rows.push(row);
  }
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides, A = rows[i], B = rows[i + 1]; if (A.length === 1) g.tri(A[0], B[j1], B[j]); else g.quad(A[j], A[j1], B[j1], B[j]); }
  const bell = [0, g.n];
  g.anim(bell, (x, y) => [1 - Math.max(0, Math.min(1, y / H)), 0, 0, 0]);
  g.glow(bell, (x, y) => { const k = y / H; return k < 0.14 ? 1 : 0.1; });
  // oral arms: tapered, ruffled curtains hanging from the centre
  const na = S.armCount ?? 4, al = len * (S.armLength ?? 0.55), seg = 9;
  for (let k = 0; k < na; k++) {
    const th = (k / na) * Math.PI * 2 + 0.4, rx = Math.cos(th), rz = Math.sin(th), ax = rx * R * 0.16, az = rz * R * 0.16, ph = rnd() * 6.283, e = [[], [], []];
    for (let i = 0; i <= seg; i++) { const t = i / seg, w = R * 0.24 * Math.pow(1 - t, 0.8) + R * 0.02, y = H * 0.4 - t * al, ruf = R * 0.07 * Math.sin(i * 2.4 + k) * (0.3 + t);
      for (let m = 0; m < 3; m++) { const sd = m - 1; e[m].push([ax - rz * w * sd + rx * ruf * (m === 1 ? -0.6 : 1), y - (m === 1 ? 0 : R * 0.03), az + rx * w * sd + rz * ruf * (m === 1 ? -0.6 : 1)]); } }
    const r0 = g.n; g.strip(e[0], e[1], cArm, cArm); g.strip(e[1], e[2], cArm, cArm); const r = [r0, g.n];
    for (let i = r0; i < g.n; i++) { const m = Math.floor((i - r0) / (2 * (seg + 1))), odd = (i - r0) % 2, sd = m === 0 ? (odd ? 0 : -1) : (odd ? 1 : 0); g.a[i * 4] = sd; g.a[i * 4 + 1] = Math.max(0, (H * 0.4 - g.p[i * 3 + 1]) / len); g.a[i * 4 + 2] = ph; g.a[i * 4 + 3] = 1; g.pv[i * 3] = rx; g.pv[i * 3 + 1] = 0; g.pv[i * 3 + 2] = rz; }
    g.glow(r, 0.3);
  }
  // trailing tentacles from the rim: ribbons billboarded in the shader, kept at least ~1.3 px wide
  const nt = S.tentacleCount ?? 12, ts = 7;
  for (let k = 0; k < nt; k++) {
    const th = ((k + 0.5) / nt) * Math.PI * 2, tx = Math.cos(th) * R * 0.86, tz = Math.sin(th) * R * 0.86, e0 = [], e1 = [], ph = rnd() * 6.283, tl = len * (0.6 + 0.4 * rnd()), w = R * 0.02;
    for (let i = 0; i <= ts; i++) { const t = i / ts, y = -t * tl, ww = w * (1 - t * 0.55); e0.push([tx - ww, y, tz]); e1.push([tx + ww, y, tz]); }
    const r = g.strip(e0, e1, cT, cT);
    for (let i = r[0]; i < r[1]; i++) { const y = g.p[i * 3 + 1]; g.a[i * 4] = (i - r[0]) % 2 ? 1 : -1; g.a[i * 4 + 1] = Math.max(0, -y / len); g.a[i * 4 + 2] = ph; g.a[i * 4 + 3] = 2; g.pv[i * 3] = tx; g.pv[i * 3 + 1] = y; g.pv[i * 3 + 2] = tz; }
    g.glow(r, (x, y) => 0.35 + 0.65 * Math.max(0, -y / len));
  }
  return g.build();
}
const JELLY_PRE = /* glsl */`
uniform vec4 uPulse; uniform vec3 uDrift; uniform float uLen, uMinPx, uR; varying float vFadeW;
float jellyYaw(float q){ vec3 h = h31(iB.z); return h.y * 6.283 + q * .05 * (h.z - .5); }
`;
const JELLY_TRAJ = /* glsl */`
vec3 traj(float q){
  vec3 h = h31(iB.z);
  float ph = (q * uPulse.x * (.75 + .5 * h.x) + iA.w) * 6.2832;
  vec3 p = iA.xyz;
  p.y += uPulse.z * (-.6 * cos(ph - .9) + .25 * sin(ph * 2. - .5)) * iB.x + uDrift.y * sin(q * .13 * (.6 + h.y) + h.z * 30.);
  p.xz += uDrift.xz * vec2(sin(q * .09 * (.5 + h.z) + h.x * 20.), cos(q * .07 * (.5 + h.x) + h.y * 20.));
  gYaw = jellyYaw(q);
  return p;
}
`;
const JELLY_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  vec3 h = h31(iB.z);
  float ph = (uTime * uPulse.x * (.75 + .5 * h.x) + iA.w) * 6.2832, part = aAnim.w, rimW = part < .5 ? aAnim.x : 0.;
  float s = .5 + .5 * sin(ph - rimW * 1.1); s = s * s * (3. - 2. * s);
  vFadeW = 1.;
  if(part < .5){
    float sq = 1. - uPulse.y * s * rimW * rimW;
    p.xz *= sq; p.y += rimW * s * uPulse.y * .5 * abs(p.y + .2) + (1. - rimW) * s * uPulse.y * .08;
    n.xz *= mix(1., .7, s * rimW); n = normalize(n);
  } else {
    float d = aAnim.y, r1 = aAnim.z, side = aAnim.x;
    vec3 ctr = part > 1.5 ? aPivot : p;
    float am = d * uLen * (part > 1.5 ? .16 : .09);
    vec3 sway = vec3(sin(ph * .5 - d * 5. + r1) * am + sin(uTime * .7 + d * 3. + r1 * 2.) * am * .6, d * uLen * .08 * sin(ph - 1.6 - d * 2.5), cos(ph * .5 - d * 4.2 + r1 * 1.7) * am + cos(uTime * .6 + d * 2.6 + r1) * am * .6);
    float pinch = 1. - uPulse.y * (.5 + .5 * sin(ph)) * (1. - d) * .8;
    if(part > 1.5){
      // billboard the ribbon around the vertical and keep it a pixel wide
      ctr.xz *= pinch; ctr += sway;
      float yaw = jellyYaw(uQ), cy = cos(yaw), sy = sin(yaw);
      vec3 toCam = cameraPosition - iA.xyz; vec2 vl = vec2(dot(toCam.xz, vec2(cy, -sy)), dot(toCam.xz, vec2(sy, cy)));
      vec2 wd = normalize(vec2(vl.y, -vl.x) + 1e-5);
      float w0 = abs(position.x - aPivot.x), sc = max(iB.x * uScale, 1e-3), hw = max(w0, length(toCam) * uMinPx / sc);
      vFadeW = w0 / hw;
      p = ctr + vec3(wd.x, 0., wd.y) * side * hw; n = normalize(vec3(vl.x, 0., vl.y) + 1e-5);
    } else {
      p.xz *= pinch; p += sway;
      p += aPivot * (uR * .09 * (.25 + d * 2.) * sin(d * 34. + side * 1.6 + r1 - uTime * 1.7) * (.4 + abs(side)));   // ruffles
    }
  }
  float tl = .12 * sin(uTime * .31 + h.z * 9.); p.xy = rot2(tl) * p.xy; n.xy = rot2(tl) * n.xy;
  gThin = part;
  gEmit = uGlowColor * aGlow * (uGlowAnim.x + uGlowAnim.y * s);
}
`;
// Glass: premultiplied alpha from fresnel only (thin in the middle, bright at the rim); emission never adds opacity.
export const FRAG_GLASS = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunColor, uSkyColor, uGroundColor, uInner; uniform float uRim, uOpacity, uBody, uR, uTime;
varying vec3 vColor, vN, vWorld, vEmit, vLocal; varying float vThin, vFadeW;
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N; vec3 V = normalize(cameraPosition - vWorld);
  float nv = abs(dot(N, V)), fr = pow(1. - nv, 2.2);
  vec3 hemi = mix(uGroundColor, uSkyColor, N.y * .5 + .5) + uSunColor * (.3 + .7 * max(dot(N, uSunDir), 0.) + .6 * pow(max(dot(-V, uSunDir), 0.), 4.));
  vec3 lit = vColor * hemi * .3183, emit; float a;
  if(vThin < .5){
    a = uOpacity * mix(.13, .8, fr);
    float r = length(vLocal.xz) / uR, th = atan(vLocal.z, vLocal.x);
    float t4 = mod(th + .7854, 1.5708) - .7854; vec2 p2 = r * vec2(cos(t4), sin(t4));
    float lobe = (1. - smoothstep(.03, .075, abs(length(p2 - vec2(.33, 0.)) - .13))) * smoothstep(.38, .3, abs(t4) * r + .12 * step(r, .2));   // four horseshoe gonads
    float cw = fwidth(th * 8.);
    float canal = (1. - smoothstep(.0, .2 + cw, abs(sin(th * 8.)))) * smoothstep(.5, .62, r) * (1. - smoothstep(.9, 1., r)) * (1. - smoothstep(.6, 1.6, cw));
    float margin = smoothstep(.8, .98, r);
    emit = vEmit * (.3 + 1.1 * fr) + uInner * (lobe * (.8 + .2 * sin(uTime * 1.3 + th * 2.)) + canal * .3);
    a = min(1., a + lobe * .3 + canal * .08 + margin * .12);
    lit *= uBody + uRim * fr;
  } else {
    float tent = step(1.5, vThin);
    a = uOpacity * mix(.34 + .3 * fr, .5, tent) * vFadeW;
    emit = vEmit * mix(.5, .55, tent) * vFadeW;
    lit *= uBody + .4;
  }
  vec3 c = lit * a + emit;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
    float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
    float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    c = mix(c, fogColor * a, ff);
  #endif
  gl_FragColor = vec4(c, a);
}
`;
export const JELLY_PRESETS = {
  moon: { bell: '#bfe0ff', rim: '#7fb4ff', arms: '#e8d8ff', tentacles: '#a8c8ff', glow: '#5a8cff', inner: '#ff9ad8', glowK: 1.3, radius: 0.5, length: 2.0, pulse: 0.42 },
  ember: { bell: '#ffb070', rim: '#ff5a3c', arms: '#ffd0a0', tentacles: '#ff8a5a', glow: '#ff5a28', inner: '#ffd27a', glowK: 1.5, radius: 0.55, length: 3.2, pulse: 0.36 },
  lagoon: { bell: '#8ff5e0', rim: '#28d0c0', arms: '#d8fff0', tentacles: '#6fe8d8', glow: '#20ffd0', inner: '#c8ff8a', glowK: 1.4, radius: 0.45, length: 2.4, pulse: 0.48 },
  orchid: { bell: '#f0b0ff', rim: '#c060ff', arms: '#ffd8ff', tentacles: '#e090ff', glow: '#c050ff', inner: '#7ad8ff', glowK: 1.5, radius: 0.5, length: 2.8, pulse: 0.4 },
};
// makeJellyfish(opts): pulsing glass bells with gonad rings, ruffled oral arms and trailing tentacles.
// 2 draw calls (back faces, then front faces), ~500 triangles each. object is a Group.
export function makeJellyfish(opts = {}) {
  const rng = rngOf(opts), name = opts.preset || opts.species || 'moon', P = JELLY_PRESETS[name] || JELLY_PRESETS.moon, o = (k) => opts[k] ?? P[k];
  const count = opts.count ?? 24, radius = o('radius'), length = o('length'), size = opts.size ?? 1;
  const base = jellyGeometry({ radius, length, height: opts.bellHeight, bell: o('bell'), rim: o('rim'), arms: o('arms'), tentacles: o('tentacles'), tentacleCount: opts.tentacleCount ?? opts.tentacles_n, armCount: opts.armCount, rnd: rng });
  const center = opts.center ? (opts.center.isVector3 ? opts.center : new THREE.Vector3(...opts.center)) : new THREE.Vector3(0, -10, 0), spread = opts.spread || [22, 9, 22];
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3), c = new THREE.Color();
  const pts = opts.positions, clear = opts.clear ?? (opts.path ? 5 : 12), reach = (radius + length * 0.25) * size * 1.5;
  for (let i = 0; i < count; i++) {
    let x, y, z;
    const sc = size * rng.range(0.55, 1.5);
    if (pts && pts[i]) { const p = pts[i]; x = p.x ?? p[0]; y = p.y ?? p[1]; z = p.z ?? p[2]; }
    else if (opts.path) { const u = rng.range(opts.uFrom ?? 0, opts.uTo ?? 1), p = opts.path.pointAt(u), a = rng() * 6.283, r = rng.range(clear + reach, Math.max(spread[0], clear + reach + 1)); x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r; y = p.y + rng.range(-1, 1) * spread[1]; }
    else { for (let t = 0; t < 16; t++) { const a = rng() * 6.283, r = Math.sqrt(rng()); x = center.x + Math.cos(a) * r * spread[0]; z = center.z + Math.sin(a) * r * spread[2]; y = center.y + rng.range(-1, 1) * spread[1]; if (!opts.avoid || opts.avoid.distanceTo(x, y, z) > clear + reach) break; } }
    iA.set([x, y, z, rng()], i * 4); iB.set([sc, 0, rng() * 100, 0], i * 4);
    c.setHSL(rng(), 0.25 * (opts.hueVariety ?? 0.6), 0.86); iT.set([c.r, c.g, c.b], i * 3);
  }
  const drift = opts.drift || [2.5, 1.2, 2.5], gk = opts.glowIntensity ?? P.glowK;
  const material = creatureMaterial({
    instanced: true, upright: true, light: opts.light || 'underwater', pre: JELLY_PRE, traj: JELLY_TRAJ, deform: JELLY_DEFORM, frag: FRAG_GLASS,
    transparent: true, depthWrite: false, premultiplied: true, side: THREE.BackSide, rim: opts.rim ?? 2.4, opacity: opts.opacity ?? 0.9,
    glow: col(o('glow')).multiplyScalar(gk), glowAnim: [0.55, 0.6, 1, 0],
    uniforms: { uPulse: { value: new THREE.Vector4(opts.pulse ?? P.pulse, opts.squeeze ?? 0.3, opts.thrust ?? 0.3, 0) }, uDrift: { value: new THREE.Vector3(...drift) }, uLen: { value: length }, uR: { value: radius },
      uBody: { value: opts.body ?? 0.5 }, uMinPx: { value: opts.minPixel ?? 0.0011 }, uInner: { value: col(o('inner')).multiplyScalar(gk * (opts.innerGlow ?? 0.9)) } },
  });
  const front = new THREE.ShaderMaterial({ uniforms: material.uniforms, defines: material.defines, vertexShader: material.vertexShader, fragmentShader: material.fragmentShader, fog: true, vertexColors: true,
    side: THREE.FrontSide, transparent: true, depthWrite: false, premultipliedAlpha: true });
  const sphere = sphereOfPoints(iA, 4, count, Math.hypot(drift[0], drift[1], drift[2]) + (length * 1.3 + radius * 2) * size * 1.5 + (opts.thrust ?? 0.3) * size * 1.5);
  const geometry = instancedGeo(base, count, iA, iB, iT), back = creatureMesh(geometry, material, 2, sphere), fr = creatureMesh(geometry, front, 3, sphere), u = material.uniforms;
  const object = new THREE.Group(); object.add(back, fr);
  return { object, mesh: fr, material, materials: [material, front], uniforms: u, geometry, count, bounds: sphere, triangles: triCount(base) * count,
    update(dt, time) { u.uTime.value = time; u.uQ.value = time; }, setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { return out.set(iA[0], iA[1], iA[2]); } };
}
