// Large swimmers: whale, manta ray, turtle, shark, dolphins. Bodies bend along their baked route ("spine" mode).
import * as THREE from 'three';
import { Geo, col, rngOf, resolveRoute, routeBounds, creatureMaterial, instancedGeo, creatureMesh, triCount, applyLight } from './common.js';

const mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// aAnim for all swimmers: x = limb span weight (0 at the joint .. 1 at the tip), y = side (+1 / -1, 0 = body), z = limb kind, w = fluke weight
// aPivot = limb joint. Limb kinds: 1 pectoral fin / wing, 2 hind flipper.
const SWIM_PRE = /* glsl */`
uniform float uLen, uBob, uSpeed; uniform vec4 uSwim, uFin, uLeap;
`;
const SWIM_TRAJ = /* glsl */`
vec3 traj(float q){
  float s = q - iA.z;
  gFade = endFade(s);
  return routeAt(s) + vec3(iA.x, iA.y + uBob * sin(uTime * .35 + iB.z * 9.), iB.w);
}
`;
// vertical (whale / dolphin / manta / turtle) or lateral (shark) body wave + limb strokes
const SWIM_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float seed = iB.z, t = (uPhase * uSwim.x * (.9 + .2 * h11(seed)) + iA.w) * 6.2832;
  float zn = p.z / uLen, w = clamp(uSwim.w - zn, 0., 1.2);
  float a = uSwim.y * uLen * w * w, arg = zn * uSwim.z + t;
  float off = a * sin(arg) + uSwim.y * uLen * .05 * sin(t - 1.2) * (.5 + zn);
  float slope = a * uSwim.z / uLen * cos(arg) - 2. * w * uSwim.y * sin(arg);
  if(aAnim.y != 0. && aAnim.z > .5){
    vec3 d = p - aPivot; float k = aAnim.x, side = aAnim.y;
    float ft = (uPhase * uFin.x + iA.w + (aAnim.z > 1.5 ? .5 : 0.)) * 6.2832 + aPivot.z / uLen * 5.;
    float ang = (uFin.z + uFin.y * sin(ft - k * uFin.w)) * (aAnim.z > 1.5 ? .5 : 1.) * side;
    ang *= smoothstep(0., .25, k) * .4 + .6 * k;
    d.xy = rot2(ang) * d.xy; n.xy = rot2(ang) * n.xy;
    d.y -= k * k * length(d.xz) * uFin.y * .15 * cos(ft - k * uFin.w);
    p = aPivot + d; gThin = .5;
  }
  #ifdef LATERAL
  p.x += off; n = normalize(vec3(n.x - slope * n.z, n.y, n.z + slope * n.x));
  #else
  p.y += off + aAnim.w * uLen * uSwim.y * 1.6 * cos(arg + .5);
  n = normalize(vec3(n.x, n.y - slope * n.z, n.z + slope * n.y));
  #endif
  gEmit = uGlowColor * aGlow * (uGlowAnim.x + uGlowAnim.y * sin(uTime * uGlowAnim.z - zn * uGlowAnim.w + seed));
  #ifdef PACKED
  vColor = vec3(color.r * iTint.r, color.g, color.b);
  #endif
}
`;
// leaping (dolphins): time is the spine parameter, the body follows a sine arc through the surface
const LEAP_TRAJ = /* glsl */`
vec3 traj(float q){
  float s = uTravel0 + (q - uTime) * uSpeed - iA.z;
  vec3 c = routeAt(s); gFade = endFade(s);
  float ph = q / uLeap.y + iA.w + iB.z;
  float y = uLeap.x * (sin(ph * 6.2832) - uLeap.z) / (1. - uLeap.z);
  return vec3(c.x + iA.x, uLeap.w + y * (.75 + .5 * h11(iB.z)), c.z + iB.w);
}
`;

// shared factory for route-following swimmers
export function makeSwimmer(base, opts, rng, D) {
  const count = Math.max(1, opts.count ?? D.count ?? 1), size = opts.size ?? 1, L = D.len;
  const speed = opts.speed ?? D.speed;
  const R = resolveRoute({ ...opts, speed }, rng, { center: D.center || [0, -15, 0], radius: D.radius || 60, height: D.height ?? 6, span: D.span || 300, wobble: 0.2 });
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3);
  const sp = opts.spread || D.spread || [L * 0.9, L * 0.35, L * 1.4];
  for (let i = 0; i < count; i++) {
    const lead = i === 0 ? 0 : 1, k = D.scales ? D.scales[(i - 1 + D.scales.length) % D.scales.length] : rng.range(0.8, 1.1);
    iA.set([lead * rng.range(-1, 1) * sp[0], lead * rng.range(-1, 1) * sp[1], lead * (i * sp[2] * 0.75 + rng.range(0, sp[2] * 0.25)), rng()], i * 4);
    iB.set([size * (i === 0 ? 1 : k), 0, rng() * 10, lead * rng.range(-1, 1) * sp[0]], i * 4);
    const l = rng.range(0.9, 1.08); iT.set([l, l, l], i * 3);
  }
  const leap = !!D.leap, swim = opts.swim || D.swim, fin = opts.stroke || D.fin || [0.2, 0.2, 0, 1];
  const material = creatureMaterial({
    instanced: true, spine: true, route: R.route, light: opts.light || D.light || 'underwater', bank: opts.bank ?? D.bank ?? 0.25, eps: leap ? 0.06 : L * 0.12, spineK: leap ? 1 / speed : 1,
    pre: SWIM_PRE + (leap ? 'uniform float uTravel0;\n' : ''), traj: leap ? LEAP_TRAJ : SWIM_TRAJ, deform: SWIM_DEFORM, defines: { ...(D.lateral ? { LATERAL: 1 } : {}), ...(D.pattern ? { PATTERN: 1, PACKED: 1 } : {}) }, pattern: D.pattern || '',
    near: [L * size * (D.near ?? 0.25), L * size * (D.near ?? 0.25) * 2.6],
    rim: opts.rim ?? D.rim ?? 0.5, spec: opts.spec ?? D.spec ?? 0.5, shine: D.shine ?? 30, trans: 0.4, caustics: opts.caustics ?? D.caustics ?? 0.55, vivid: opts.vivid ?? 0.25,
    glow: col(opts.glow ?? D.glow ?? '#000000').multiplyScalar(opts.glowIntensity ?? D.glowK ?? 1), glowAnim: opts.glowAnim || D.glowAnim || [0.6, 0.4, 1.2, 9],
    uniforms: {
      uLen: { value: L }, uBob: { value: opts.bob ?? D.bob ?? 0.4 }, uSpeed: { value: speed }, uTravel0: { value: 0 },
      uSwim: { value: new THREE.Vector4(swim[0], swim[1], swim[2], swim[3] ?? 0.3) }, uFin: { value: new THREE.Vector4(fin[0], fin[1], fin[2], fin[3]) },
      uLeap: { value: new THREE.Vector4(opts.leapHeight ?? 2.4, opts.leapPeriod ?? 3.4, 0.42, opts.level ?? 0) },
      ...(D.uniforms || {}),
    },
  });
  let lat = 0, back = 0; for (let i = 0; i < count; i++) { lat = Math.max(lat, Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3])); back = Math.max(back, iA[i * 4 + 2]); }
  const B = routeBounds(R, lat + L * size * 0.75 + (opts.bob ?? D.bob ?? 0.4) + (leap ? (opts.leapHeight ?? 2.4) * 1.6 : 0), back);
  const geometry = instancedGeo(base, count, iA, iB, iT), object = creatureMesh(geometry, material, 0, B.sphere), u = material.uniforms;
  return {
    object, material, uniforms: u, geometry, count, route: R.route, bounds: B.sphere, length: L * size, triangles: triCount(base) * count,
    update(dt, time, camera, pu) { const s = R.step(dt, time, pu); u.uTime.value = time; u.uPhase.value = time + R.state.extra; u.uVis.value = R.state.vis; u.uQ.value = leap ? time : s; u.uTravel0.value = s; B.follow(s); },
    setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { R.route.pointAt(R.travel(time, pu), out); if (leap) out.y = u.uLeap.value.w + 1; return out; },
  };
}

// ---------- whale (humpback) ----------
// Outline rows: [z/L, dorsal y/L, ventral y/L, half width/L, flat-top exponent]. Nose +Z.
const WHALE_PROFILE = [
  [0.493, 0.012, -0.030, 0.030, 0.6], [0.47, 0.019, -0.052, 0.052, 0.6], [0.43, 0.027, -0.077, 0.069, 0.62], [0.38, 0.036, -0.098, 0.083, 0.66], [0.32, 0.048, -0.114, 0.095, 0.72],
  [0.25, 0.064, -0.123, 0.105, 0.8], [0.17, 0.083, -0.125, 0.112, 0.9], [0.09, 0.097, -0.120, 0.113, 0.95], [0.0, 0.106, -0.110, 0.107, 1], [-0.08, 0.109, -0.095, 0.094, 1],
  [-0.15, 0.114, -0.077, 0.076, 1.05], [-0.22, 0.096, -0.060, 0.056, 1.1], [-0.29, 0.08, -0.049, 0.038, 1.15], [-0.36, 0.066, -0.041, 0.024, 1.2], [-0.42, 0.054, -0.036, 0.015, 1.2],
  [-0.455, 0.041, -0.03, 0.0125, 1.2], [-0.482, 0.022, -0.016, 0.013, 1], [-0.5, 0.007, -0.004, 0.006, 1],
];
// Lofts a body from outline rows [z/L, dorsal y/L, ventral y/L, half width/L, top exponent] (nose first, +Z): separate back and belly
// curves, flat or domed tops (exponent < 1 flattens), o.eb belly exponent (> 1 = keel), o.yc(zn) height of the widest point (0..1),
// o.paint(zn, y/L, cos(angle from the top), color) fills the vertex colour.
export function hull(g, P, L, sides, o = {}) {
  const c = new THREE.Color(), rows = [], start = g.n, eb = o.eb ?? 0.92, n = P.length, f = P[0], l = P[n - 1];
  const nose = g.v(0, (f[1] + f[2]) * 0.5 * L, (f[0] + (f[3]) * 0.3) * L, c.setRGB(1, 0.4, 0)), tail = g.v(0, (l[1] + l[2]) * 0.5 * L, (l[0] - l[3]) * L, c.setRGB(1, 0, 0));
  for (const [zn, top, bot, w, et] of P) {
    const yc = mix(bot, top, o.yc ? o.yc(zn) : 0.5), row = [];
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const x = w * Math.sign(sn) * Math.pow(Math.abs(sn), cs > 0 ? 0.85 : 0.95), y = cs > 0 ? yc + (top - yc) * Math.pow(cs, et) : yc - (yc - bot) * Math.pow(-cs, eb);
      if (o.paint) o.paint(zn, y, cs, c); else c.setRGB(1, 1, 1);
      row.push(g.v(x * L, y * L, zn * L, c));
    }
    rows.push(row);
  }
  for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.tri(rows[0][j], nose, rows[0][j1]); g.tri(tail, rows[n - 1][j], rows[n - 1][j1]); }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.quad(rows[i + 1][j], rows[i][j], rows[i][j1], rows[i + 1][j1]); }
  return [start, g.n];
}
// colours are packed for the fragment pattern: r = shade, g = belly weight, b = part (0 body, .5 pectoral, 1 fluke / dorsal)
export function whaleGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 14, sides = S.sides ?? 20, P = WHALE_PROFILE, c = new THREE.Color(), rows = [];
  const at = (zn) => { let i = 0; while (i < P.length - 2 && P[i + 1][0] > zn) i++; const a = P[i], b = P[i + 1], t = Math.min(1, Math.max(0, (a[0] - zn) / (a[0] - b[0]))); return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)]; };
  // countershade line: white throat and belly, dark back; rises toward the tail stock
  const shadeLine = (zn) => -0.058 + 0.036 * sstep(0.1, -0.35, zn) - 0.012 * sstep(0.3, 0.5, zn);
  hull(g, P, L, sides, { yc: (zn) => (zn > 0.2 ? 0.52 : 0.46), paint: (zn, y, cs, c) => c.setRGB(0.86 + 0.14 * Math.max(0, cs), sstep(shadeLine(zn) + 0.03, shadeLine(zn) - 0.03, y), 0) });
  // tubercles: knobs on the rostrum (three rows) and along the lower jaw
  const knob = c.clone().setRGB(0.8, 0, 0), kr = 0.0062 * L;
  for (let i = 0; i < 7; i++) { const zn = 0.47 - i * 0.027, [top, , w] = at(zn);
    g.blob(0, top * L + kr * 0.2, zn * L, kr, kr * 0.9, kr * 1.2, knob, null, 4, 2);
    if (i > 0) for (const sx of [-1, 1]) g.blob(sx * w * 0.55 * L, (top - 0.004) * L, (zn + 0.012) * L, kr, kr * 0.9, kr * 1.2, knob, null, 4, 2); }
  const jawKnob = c.clone().setRGB(0.9, 0.7, 0);
  for (let i = 0; i < 5; i++) { const zn = 0.475 - i * 0.03, [top, bot, w] = at(zn); for (const sx of [-1, 1]) g.blob(sx * w * 0.93 * L, mix(bot, top, 0.3) * L, zn * L, kr, kr, kr * 1.2, jawKnob, null, 4, 2); }
  // dorsal fin on its hump, then knuckles down the tail stock
  const dTop = (zn) => at(zn)[0] * L, dc = c.clone().setRGB(0.9, 0, 1);
  g.fan([[0, dTop(-0.12) - 0.004 * L, -0.105 * L], [0, dTop(-0.15) + 0.014 * L, -0.15 * L], [0, dTop(-0.17) + 0.03 * L, -0.185 * L], [0, dTop(-0.19) + 0.033 * L, -0.205 * L], [0, dTop(-0.2) + 0.018 * L, -0.2 * L], [0, dTop(-0.215) - 0.003 * L, -0.215 * L]], dc);
  for (let i = 0; i < 6; i++) { const zn = -0.25 - i * 0.034, r = (0.0075 - i * 0.0007) * L; g.blob(0, dTop(zn) - r * 0.3, zn * L, r * 0.7, r, r * 1.9, knob, null, 4, 2); }
  g.anim([0, g.n], () => [0, 0, 0, 0]);
  // flukes: broad swept lobes with a centre notch, scalloped trailing edge
  const fz = -0.462 * L, fy = 0.006 * L, FS = 0.2 * L, nF = 7, fl = [], ft = [], cfl = [], cft = [];
  for (let i = 0; i <= nF; i++) { const t = i / nF, x = t * FS;
    const le = fz + 0.07 * L - 0.185 * L * Math.pow(t, 1.25), te = fz - 0.058 * L - 0.085 * L * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) - 0.012 * L * t + 0.006 * L * Math.sin(t * 19) * (1 - t);
    fl.push([x, fy + 0.006 * L * (1 - t), Math.max(le, te + 0.004 * L)]); ft.push([x, fy, te]); cfl.push(c.clone().setRGB(1, 0, 1)); cft.push(c.clone().setRGB(0.72, 0, 1)); }
  const fk = g.strip(fl, ft, cfl, cft);
  g.anim(fk, (x, y, z) => [0, 0, 0, Math.max(0, (fz + 0.07 * L - z) / (0.2 * L)) + Math.abs(x) / L * 0.8]);
  g.mirror(fk, 0);
  // pectoral fins: a third of the body long, drooping 42 deg and swept back, knobbly leading edge
  const droop = (S.droop ?? 42) * Math.PI / 180, sweep = (S.sweep ?? 34) * Math.PI / 180, PL = 0.3 * L, pw = at(0.2)[2];
  const d = new THREE.Vector3(Math.cos(droop) * Math.cos(sweep), -Math.sin(droop), -Math.cos(droop) * Math.sin(sweep)), ch = new THREE.Vector3(0, 0, 1); ch.addScaledVector(d, -ch.dot(d)).normalize();
  const root = new THREE.Vector3(pw * 0.8 * L, -0.082 * L, 0.2 * L), nP = 10, le = [], te = [], cl = [], ct = [], q = new THREE.Vector3();
  for (let i = 0; i <= nP; i++) {
    const t = i / nP, chord = 0.092 * L * (0.6 + 0.4 * Math.sin(Math.min(1, t * 1.1 + 0.12) * Math.PI)) * (1 - 0.55 * t * t * t), kn = 1 + 0.2 * Math.abs(Math.sin(t * Math.PI * 4.5 + 0.4));
    q.copy(root).addScaledVector(d, t * PL).addScaledVector(ch, -t * t * 0.035 * L);
    le.push([q.x + ch.x * chord * 0.42 * kn, q.y + ch.y * chord * 0.42 * kn, q.z + ch.z * chord * 0.42 * kn]); te.push([q.x - ch.x * chord * 0.58, q.y - ch.y * chord * 0.58, q.z - ch.z * chord * 0.58]);
    cl.push(c.clone().setRGB(1, 0, 0.5)); ct.push(c.clone().setRGB(0.8, 0, 0.5));
  }
  const pf = g.strip(le, te, cl, ct);
  g.anim(pf, (x, y, z) => [Math.min(1, Math.max(0, q.set(x, y, z).sub(root).dot(d) / PL)), 1, 1, 0]); g.pivot(pf, root.x, root.y, root.z);
  g.mirror(pf);
  // eyes, low behind the corner of the mouth
  const ew = at(0.258)[2];
  for (const sx of [-1, 1]) { const e = g.blob(sx * ew * 0.97 * L, -0.052 * L, 0.258 * L, 0.004 * L, 0.0075 * L, 0.0095 * L, c.setRGB(0.04, 0, 0), null, 5, 3); g.anim(e, () => [0, 0, 0, 0]); }
  return g.build();
}
// fragment coat: wavy countershade edge, throat pleats, mottling and scars, pale fin undersides. All filtered by pixel footprint.
const WHALE_PATTERN = /* glsl */`
uniform vec3 uWTop, uWBel, uGlowF; uniform float uWL;
float wn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float n = i.x + i.y * 57. + i.z * 113.;
  #define WH(n) fract(sin(n) * 43758.5453)
  return mix(mix(mix(WH(n), WH(n + 1.), f.x), mix(WH(n + 57.), WH(n + 58.), f.x), f.y), mix(mix(WH(n + 113.), WH(n + 114.), f.x), mix(WH(n + 170.), WH(n + 171.), f.x), f.y), f.z); }
vec3 pattern(vec3 base, vec3 lp, float mask){
  vec3 q = lp / uWL; float zn = q.z, part = base.b;
  float fw = length(fwidth(q)) ;
  float n1 = mix(wn3(q * vec3(34., 34., 20.)), .5, smoothstep(.012, .04, fw)), n2 = mix(wn3(q * vec3(150., 150., 34.) + 7.), .5, smoothstep(.004, .012, fw));
  vec3 top = uWTop * (.72 + .5 * n1) , bel = uWBel * (.86 + .2 * n1);
  top = mix(top, uWBel * .8, smoothstep(.84, .93, n2) * .22);                 // pale scars and barnacle marks
  vec3 c;
  if(part < .25){
    float k = smoothstep(.36, .64, base.g + (n1 - .5) * .55 + (n2 - .5) * .2);
    float th = atan(q.x, -(q.y + .012));
    float pz = smoothstep(-.03, .07, zn) * (1. - smoothstep(.45, .5, zn)) * (1. - smoothstep(1.0, 1.45, abs(th)));
    float ph = th * 14., w = fwidth(ph);
    float groove = (1. - smoothstep(.0, .42 + w, abs(sin(ph)))) * (1. - smoothstep(.9, 2.2, w)) * pz;
    bel *= 1. - .6 * groove;
    bel = mix(bel, uWTop, smoothstep(.72, .8, n1 + n2 * .3) * .5);          // dark flecks on the white
    c = mix(top, bel, k);
    float ym = -.008 - .04 * smoothstep(.5, .27, zn);
    c *= 1. - .75 * (1. - smoothstep(.0012, .0035 + fw, abs(q.y - ym))) * step(.262, zn);   // mouth line
    gEmitF = uGlowF * (groove * 1.4 + smoothstep(.75, .9, n2) * (1. - k) * 1.2);
  } else {
    float under = gl_FrontFacing ? 1. : 0.;
    vec3 pale = uWBel * (.8 + .2 * n1);
    float ptc = smoothstep(.45, .6, n1 + (part < .75 ? .12 : -.2));
    c = mix(mix(top, pale, ptc * (part < .75 ? .75 : .2)), pale, under * (part < .75 ? .95 : .75));
    gEmitF = uGlowF * (1. - base.r) * 3.;
  }
  return c * base.r;
}
`;
// makeWhale(opts): a humpback, alone or with companions (count). Swims or flies: it only follows its route.
export function makeWhale(opts = {}) {
  const rng = rngOf(opts), L = opts.length ?? 14;
  const base = whaleGeometry({ len: L, droop: opts.finDroop, sweep: opts.finSweep });
  return makeSwimmer(base, opts, rng, { len: L, speed: 3.2, count: 1, center: [0, -18, 0], radius: 70, height: 5, span: 360, swim: [0.16, 0.06, 3.4, 0.2], fin: [0.11, 0.2, 0.04, 1.4], bank: 18, bob: 0.6, rim: 0.6, spec: 0.7, shine: 26, scales: [0.5, 0.8, 0.65], spread: [L * 0.9, L * 0.3, L * 1.1],
    pattern: WHALE_PATTERN, near: 0.06, glow: '#000000',
    uniforms: { uWTop: { value: col(opts.top ?? '#62788f') }, uWBel: { value: col(opts.belly ?? '#dfe5e8') }, uWL: { value: L }, uGlowF: { value: col(opts.glow ?? '#000000').multiplyScalar(opts.glow ? (opts.glowIntensity ?? 1.5) : 0) } } });
}

// ---------- manta ray ----------
export function mantaGeometry(S = {}) {
  const g = new Geo(), W = S.span ?? 2.6, Lb = S.len ?? 2.3, cTop = col(S.top ?? '#232c3a'), cPatch = col(S.patch ?? '#aeb9c4'), cBel = col(S.belly ?? '#e9eef2'), cEdge = col(S.edge ?? '#55606e');
  const NS = 10, NC = 5, top = [], bot = [], c = new THREE.Color();
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, x = s * W, zl = Lb * (0.42 - 0.56 * Math.pow(s, 1.35)), zt = Lb * (-0.5 + 0.375 * Math.pow(s, 0.75)), th = 0.115 * Lb * Math.pow(1 - s, 1.6) + 0.004 * Lb, rt = [], rb = [];
    for (let j = 0; j <= NC; j++) {
      const cc = j / NC, z = zl + (zt - zl) * cc, bump = Math.pow(Math.sin(Math.PI * Math.pow(cc, 0.7)), 0.8);
      const patch = Math.max(0, 1 - Math.abs(s - 0.3) / 0.16) * Math.max(0, 1 - Math.abs(cc - 0.3) / 0.22);
      c.copy(cTop).lerp(cPatch, Math.min(1, patch * 1.4)); rt.push(g.v(x, th * bump, z, c));
      c.copy(cBel).lerp(cEdge, sstep(0.55, 1, s) * 0.7 + (cc > 0.8 ? 0.25 : 0)); rb.push(j === 0 || j === NC ? rt[j] : g.v(x, -th * 0.55 * bump, z, c));
    }
    top.push(rt); bot.push(rb);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { g.quad(top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]); g.quad(bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]); }
  const wing = [0, g.n];
  g.anim(wing, (x) => [x / W, 1, 1, 0]); g.glow(wing, (x, y, z) => (x / W > 0.82 ? 0.9 : y < 0 ? 0.15 : 0));
  // cephalic lobes
  const lobe = g.fan([[0.07 * Lb, 0.01 * Lb, 0.4 * Lb], [0.1 * Lb, -0.02 * Lb, 0.6 * Lb], [0.15 * Lb, -0.03 * Lb, 0.56 * Lb], [0.17 * Lb, 0.0, 0.36 * Lb]], cTop, cEdge);
  g.anim(lobe, () => [0, 0, 0, 0]);
  g.mirror([0, g.n]);
  // whip tail
  g.tube([[0, 0.01 * Lb, -0.46 * Lb], [0, 0, -0.8 * Lb], [0, 0, -1.25 * Lb], [0, 0, -1.7 * Lb]], [0.018 * Lb, 0.011 * Lb, 0.006 * Lb, 0], 4, cTop);
  return g.build();
}
export function makeMantaRay(opts = {}) {
  const rng = rngOf(opts), W = opts.span ?? 2.6, Lb = W * 0.88;
  const base = mantaGeometry({ span: W, len: Lb, top: opts.top, belly: opts.belly, patch: opts.patch, edge: opts.edge });
  return makeSwimmer(base, opts, rng, { len: Lb * 1.6, speed: 2.4, count: 1, center: [0, -10, 0], radius: 34, height: 4, span: 200, swim: [0.3, 0.012, 3, 0.3], fin: [0.3, 0.4, -0.04, 2.3], bank: 12, bob: 0.3, rim: 0.6, spec: 0.5, spread: [W * 2.2, W * 0.8, W * 2.5] });
}

// ---------- sea turtle ----------
export function turtleGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 1.1, cShell = col(S.shell ?? '#6b5a34'), cSeam = col(S.seam ?? '#c9b070'), cPlas = col(S.plastron ?? '#e6d9a4'), cSkin = col(S.skin ?? '#8a9a6a'), cDark = col(S.dark ?? '#3a4630');
  const prof = [[-0.5, 0, 0], [-0.45, 0.17, 0.085], [-0.32, 0.31, 0.15], [-0.14, 0.39, 0.19], [0.06, 0.41, 0.2], [0.24, 0.36, 0.18], [0.38, 0.25, 0.13], [0.46, 0.13, 0.075], [0.5, 0, 0]];
  const shell = g.loft(prof.map(([z, rx, ry]) => ({ z: z * L, rx: rx * L, ry: ry * L })), { sides: 12, top: cShell, belly: cPlas, shade: [-0.25, 0.1], flat: 0.6 });
  g.paint(shell, (x, y, z, c) => { if (y > 0.01 * L) { const u = Math.abs(Math.sin((z / L) * 9.5)) , v = Math.abs(Math.sin(Math.atan2(x, y) * 2.6)); const seam = Math.max(sstep(0.25, 0.0, u), sstep(0.22, 0.0, v) * 0.8); c.lerp(cSeam, seam * 0.7).multiplyScalar(0.85 + 0.3 * u * v); } });
  // neck + head
  g.tube([[0, 0, 0.44 * L], [0, 0.015 * L, 0.58 * L]], [0.075 * L, 0.07 * L], 6, cSkin);
  g.loft([{ z: 0.55 * L, y: 0.02 * L, rx: 0.07 * L, ry: 0.065 * L }, { z: 0.64 * L, y: 0.03 * L, rx: 0.085 * L, ry: 0.078 * L }, { z: 0.72 * L, y: 0.02 * L, rx: 0.065 * L, ry: 0.06 * L }, { z: 0.77 * L, y: 0.0, rx: 0, ry: 0 }], { sides: 6, top: cDark, belly: cSkin });
  // flippers: long swept front pair, short hind paddles
  const flip = (root, tip, chord, kind, nn) => {
    const le = [], te = [], cl = [], ct = [];
    for (let i = 0; i <= nn; i++) { const t = i / nn, ch = chord * (0.55 + 0.75 * Math.sin(Math.min(1, t * 1.15 + 0.12) * Math.PI)) * (1 - t * 0.35), bend = t * t; const x = mix(root[0], tip[0], t), y = mix(root[1], tip[1], t), z = mix(root[2], tip[2], t * 0.6 + bend * 0.4);
      le.push([x, y, z + ch * 0.35]); te.push([x, y - 0.004 * L, z - ch * 0.65]); cl.push(cDark.clone().lerp(cSkin, 0.3)); ct.push(cSkin.clone()); }
    const r = g.strip(le, te, cl, ct);
    g.anim(r, (x) => [Math.max(0, (x - root[0]) / (tip[0] - root[0])), 1, kind, 0]); g.pivot(r, root[0], root[1], root[2]);
    g.mirror(r);
  };
  flip([0.3 * L, -0.02 * L, 0.3 * L], [0.92 * L, -0.03 * L, -0.02 * L], 0.17 * L, 1, 5);
  flip([0.2 * L, -0.02 * L, -0.36 * L], [0.44 * L, -0.02 * L, -0.62 * L], 0.14 * L, 2, 3);
  g.tube([[0, -0.02 * L, -0.46 * L], [0, -0.03 * L, -0.6 * L]], [0.03 * L, 0], 4, cSkin);
  return g.build();
}
export function makeTurtle(opts = {}) {
  const rng = rngOf(opts), L = opts.length ?? 1.1;
  const base = turtleGeometry({ len: L, shell: opts.shell, seam: opts.seam, plastron: opts.plastron, skin: opts.skin, dark: opts.dark });
  return makeSwimmer(base, opts, rng, { len: L * 1.5, speed: 1.3, count: 1, center: [0, -8, 0], radius: 22, height: 3, span: 120, swim: [0.3, 0.006, 2, 0.3], fin: [0.42, 0.55, 0.1, 1.0], bank: 8, bob: 0.25, rim: 0.5, spec: 0.5, spread: [L * 3, L, L * 4] });
}

// ---------- shark ----------
export function sharkGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 3.4, cTop = col(S.top ?? '#566672'), cBel = col(S.belly ?? '#e4e9ea'), cFin = col(S.fin ?? '#4a5964');
  const prof = [[-0.5, 0.012, 0.03, 0.02], [-0.42, 0.024, 0.04, 0.012], [-0.3, 0.042, 0.06, 0.004], [-0.14, 0.066, 0.086, 0], [0.04, 0.083, 0.1, 0], [0.2, 0.086, 0.098, 0], [0.32, 0.074, 0.082, -0.002], [0.41, 0.054, 0.058, -0.008], [0.465, 0.034, 0.034, -0.016], [0.5, 0, 0, -0.022]];
  const body = g.loft(prof.map(([z, rx, ry, y]) => ({ z: z * L, y: y * L, rx: rx * L, ry: ry * L })), { sides: 10, top: cTop, belly: cBel, shade: [-0.35, 0.15] });
  g.paint(body, (x, y, z, c) => { const zn = z / L; if (zn > 0.24 && zn < 0.33 && Math.abs(y) < 0.05 * L) { const sl = 0.5 + 0.5 * Math.cos((zn - 0.24) * 5 * 6.283 / 0.09); c.multiplyScalar(mix(1, 0.55, sl > 0.6 ? 1 : 0)); } });
  const fins = [];
  fins.push(g.fan([[0, 0.02 * L, -0.455 * L], [0, 0.11 * L, -0.56 * L], [0, 0.215 * L, -0.67 * L], [0, 0.06 * L, -0.565 * L], [0, 0.0, -0.545 * L], [0, -0.115 * L, -0.6 * L], [0, -0.03 * L, -0.47 * L]], cFin));
  fins.push(g.fan([[0, 0.09 * L, 0.1 * L], [0, 0.2 * L, -0.02 * L], [0, 0.215 * L, -0.07 * L], [0, 0.12 * L, -0.075 * L], [0, 0.085 * L, -0.11 * L]], cFin));
  fins.push(g.fan([[0, 0.048 * L, -0.27 * L], [0, 0.085 * L, -0.33 * L], [0, 0.04 * L, -0.34 * L]], cFin));
  fins.push(g.fan([[0, -0.04 * L, -0.3 * L], [0, -0.075 * L, -0.36 * L], [0, -0.03 * L, -0.36 * L]], cFin));
  const pec = g.fan([[0.07 * L, -0.045 * L, 0.23 * L], [0.2 * L, -0.085 * L, 0.11 * L], [0.285 * L, -0.115 * L, 0.0], [0.2 * L, -0.09 * L, 0.03 * L], [0.062 * L, -0.05 * L, 0.09 * L]], cFin, cFin);
  g.anim(pec, (x) => [Math.max(0, (x - 0.07 * L) / (0.21 * L)), 1, 1, 0]); g.pivot(pec, 0.07 * L, -0.045 * L, 0.16 * L); g.mirror(pec);
  const pel = g.fan([[0.04 * L, -0.06 * L, -0.12 * L], [0.1 * L, -0.1 * L, -0.2 * L], [0.035 * L, -0.06 * L, -0.2 * L]], cFin); g.mirror(pel);
  for (const sx of [-1, 1]) g.blob(sx * 0.052 * L, 0.005 * L, 0.4 * L, 0.006 * L, 0.008 * L, 0.01 * L, col('#06080a'), null, 5, 3);
  return g.build();
}
export function makeShark(opts = {}) {
  const rng = rngOf(opts), L = opts.length ?? 3.4;
  const base = sharkGeometry({ len: L, top: opts.top, belly: opts.belly, fin: opts.fin });
  return makeSwimmer(base, opts, rng, { len: L, speed: 2.6, count: 1, center: [0, -12, 0], radius: 30, height: 3, span: 180, lateral: true, swim: [0.55, 0.075, 5.2, 0.32], fin: [0.2, 0.04, 0.12, 1], bank: 10, bob: 0.2, rim: 0.5, spec: 0.6, spread: [L * 2, L * 0.8, L * 2.5] });
}

// ---------- dolphins ----------
export function dolphinGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 2.4, cTop = col(S.top ?? '#5e7388'), cBel = col(S.belly ?? '#e2e8ea'), cFin = col(S.fin ?? '#4f6276');
  const prof = [[-0.5, 0.012, 0.02, 0], [-0.43, 0.02, 0.034, 0], [-0.3, 0.042, 0.058, 0], [-0.12, 0.07, 0.082, 0], [0.08, 0.087, 0.096, 0], [0.24, 0.082, 0.09, 0], [0.34, 0.066, 0.074, 0.004], [0.4, 0.046, 0.052, -0.004], [0.432, 0.024, 0.024, -0.02], [0.5, 0.012, 0.011, -0.026], [0.525, 0, 0, -0.027]];
  g.loft(prof.map(([z, rx, ry, y]) => ({ z: z * L, y: y * L, rx: rx * L, ry: ry * L })), { sides: 10, top: cTop, belly: cBel, shade: [-0.45, 0.2] });
  g.fan([[0, 0.085 * L, 0.07 * L], [0, 0.17 * L, -0.03 * L], [0, 0.205 * L, -0.085 * L], [0, 0.15 * L, -0.075 * L], [0, 0.08 * L, -0.09 * L]], cFin);
  const fz = -0.47 * L, fk = g.strip([[0, 0, fz + 0.04 * L], [0.05 * L, 0, fz - 0.02 * L], [0.125 * L, 0, fz - 0.08 * L]], [[0, 0, fz - 0.035 * L], [0.05 * L, 0, fz - 0.075 * L], [0.125 * L, 0, fz - 0.095 * L]], cFin, cFin);
  g.anim(fk, (x, y, z) => [0, 0, 0, Math.max(0, (fz + 0.04 * L - z) / (0.14 * L))]); g.mirror(fk, 0);
  const pec = g.fan([[0.075 * L, -0.05 * L, 0.22 * L], [0.15 * L, -0.1 * L, 0.13 * L], [0.2 * L, -0.135 * L, 0.05 * L], [0.13 * L, -0.095 * L, 0.08 * L], [0.07 * L, -0.055 * L, 0.12 * L]], cFin);
  g.anim(pec, (x) => [Math.max(0, (x - 0.075 * L) / (0.125 * L)), 1, 1, 0]); g.pivot(pec, 0.075 * L, -0.05 * L, 0.17 * L); g.mirror(pec);
  for (const sx of [-1, 1]) g.blob(sx * 0.058 * L, 0.0, 0.365 * L, 0.006 * L, 0.008 * L, 0.01 * L, col('#06080a'), null, 5, 3);
  return g.build();
}
// makeDolphins(opts): a pod porpoising along its route; level = water surface height
export function makeDolphins(opts = {}) {
  const rng = rngOf(opts), L = opts.length ?? 2.4, level = opts.level ?? 0, c = opts.center || [0, level, 0];
  const base = dolphinGeometry({ len: L, top: opts.top, belly: opts.belly, fin: opts.fin });
  return makeSwimmer(base, { ...opts, center: [c[0] ?? c.x, level, c[2] ?? c.z], height: 0, level }, rng, { len: L, speed: 7.5, count: 6, leap: true, light: 'day', radius: 60, height: 0, span: 320, swim: [1.4, 0.03, 4, 0.2], fin: [0.3, 0.05, 0.25, 1], bank: 0, bob: 0, rim: 0.7, spec: 1.6, shine: 40, caustics: 0, spread: [L * 2.2, 0, L * 2.6] });
}
