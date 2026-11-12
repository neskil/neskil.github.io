// Alien fauna: leviathans (sky whales) with glowing patterns, floating jellies, ribbon eels of light, grazing tripods.
import * as THREE from 'three';
import { Geo, col, rngOf, resolveRoute, routeBounds, creatureMaterial, instancedGeo, creatureMesh, triCount } from './common.js';
import { makeSwimmer, hull } from './marine.js';
import { makeJellyfish } from './fish.js';
import { makeHerd } from './land.js';

// ---------- leviathan ----------
// outline rows [z/L, dorsal, ventral, half width, top exponent]: broad flat head over a gular pouch, keeled belly, long tapering tail
const LEVI_PROFILE = [
  [0.495, 0.010, -0.018, 0.032, 0.7], [0.47, 0.024, -0.044, 0.066, 0.7], [0.43, 0.036, -0.072, 0.092, 0.7], [0.37, 0.048, -0.098, 0.108, 0.75], [0.30, 0.058, -0.108, 0.112, 0.8],
  [0.22, 0.068, -0.100, 0.104, 0.9], [0.12, 0.076, -0.086, 0.092, 1], [0.02, 0.078, -0.070, 0.078, 1], [-0.08, 0.074, -0.058, 0.063, 1], [-0.18, 0.064, -0.046, 0.049, 1.05],
  [-0.28, 0.052, -0.036, 0.035, 1.1], [-0.36, 0.040, -0.028, 0.024, 1.1], [-0.43, 0.028, -0.020, 0.016, 1.1], [-0.48, 0.016, -0.012, 0.010, 1], [-0.5, 0.006, -0.004, 0.004, 1],
];
const leviAt = (zn) => { const P = LEVI_PROFILE; let i = 0; while (i < P.length - 2 && P[i + 1][0] > zn) i++; const a = P[i], b = P[i + 1], t = Math.min(1, Math.max(0, (a[0] - zn) / (a[0] - b[0]))); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; };
// packed colours: r = shade, g = belly weight (body) or edge weight (fins), b = part: 0 body, .5 fin / ribbon / sail, 1 horn
export function leviathanGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 48, PK = (r, gg, b) => new THREE.Color(r, gg, b);
  hull(g, LEVI_PROFILE, L, S.sides ?? 18, { eb: 1.35, yc: () => 0.55, paint: (zn, y, cs, cc) => { const [top, bot] = leviAt(zn), k = (y - bot) / (top - bot); cc.setRGB(0.82 + 0.18 * Math.max(0, cs), 1 - Math.min(1, Math.max(0, (k - 0.25) / 0.4)), 0); } });
  // three pairs of sweeping fins, beating in a wave down the body
  const fin = (zn, span, chord, droop) => {
    const [top, bot, w] = leviAt(zn), px = w * 0.86 * L, py = (bot + (top - bot) * 0.42) * L, pz = zn * L, n = 7, le = [], te = [], cl = [], ct = [];
    for (let i = 0; i <= n; i++) { const s = i / n, x = px + s * span * L, z = pz - Math.pow(s, 1.5) * span * L * 0.75, ch = chord * L * (1 - 0.8 * Math.pow(s, 1.3)); le.push([x, py - s * droop * L, z + ch * 0.35]); te.push([x, py - s * droop * L - 0.002 * L, z - ch * 0.65]); cl.push(PK(1, 0.15 + 0.35 * s, 0.5)); ct.push(PK(1, 1, 0.5)); }
    const st = g.strip(le, te, cl, ct);
    g.anim(st, (x) => [Math.max(0, (x - px) / (span * L)), 1, 1, 0]); g.pivot(st, px, py, pz);
    g.mirror(st);
  };
  fin(0.2, 0.32, 0.15, 0.04); fin(0.02, 0.23, 0.11, 0.035); fin(-0.14, 0.16, 0.08, 0.025);
  // tail: two broad ribbon flukes that trail and ripple
  for (const sx of [-1, 1]) { const le = [], te = [], cl = [], ct = [], n = 9; for (let i = 0; i <= n; i++) { const s = i / n, z = -0.47 * L - s * 0.36 * L, x = sx * (0.004 * L + Math.pow(s, 1.3) * 0.13 * L), w = 0.012 * L + 0.07 * L * Math.sin(Math.min(1, s * 1.15 + 0.08) * Math.PI) * (1 - 0.3 * s); le.push([x + sx * w * 0.7, 0.004 * L, z + w * 0.3]); te.push([x - sx * w * 0.3, 0, z - w * 0.5]); cl.push(PK(1, 0.9, 0.5)); ct.push(PK(1, 0.25, 0.5)); }
    const st = g.strip(le, te, cl, ct); g.anim(st, (x, y, z) => [0, 0, 0, Math.max(0, (-0.47 * L - z) / (0.36 * L)) * 1.5]); }
  // dorsal sail of spines
  for (let i = 0; i < 12; i++) { const zn = 0.24 - i * 0.045, top = leviAt(zn)[0] * L, z = zn * L, h = 0.055 * L * Math.sin(((i + 0.5) / 12) * Math.PI) + 0.012 * L;
    g.fan([[0, top - 0.004 * L, z + 0.022 * L], [0, top + h, z - 0.04 * L], [0, top - 0.004 * L, z - 0.032 * L]], PK(1, 0.1, 0.5), PK(1, 1, 0.5)); }
  // chin barbels, horns and eyes
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.03 * L, -0.045 * L, 0.45 * L], [sx * 0.07 * L, -0.1 * L, 0.37 * L], [sx * 0.09 * L, -0.13 * L, 0.25 * L], [sx * 0.095 * L, -0.125 * L, 0.12 * L]], [0.006 * L, 0.0045 * L, 0.003 * L, 0.0012 * L], 4, PK(1, 0.1, 0.5), PK(1, 1, 0.5));
    g.tube([[sx * 0.04 * L, 0.03 * L, 0.42 * L], [sx * 0.075 * L, 0.075 * L, 0.35 * L], [sx * 0.092 * L, 0.1 * L, 0.26 * L]], [0.009 * L, 0.0055 * L, 0], 5, PK(1, 0, 1));
    const e = g.blob(sx * 0.071 * L, -0.012 * L, 0.455 * L, 0.006 * L, 0.009 * L, 0.011 * L, PK(0.05, 0, 1), null, 6, 3); g.glow(e, 2.2);
  }
  return g.build();
}
// luminous skin, all in the fragment shader: lantern discs along the flank, flowing bands on the belly, a drift of spots on the back
const LEVI_PATTERN = /* glsl */`
uniform vec3 uLTop, uLBel, uLFin, uLEdge, uLHorn, uGlowF; uniform float uWL; uniform vec4 uLGlow;
float lh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 pattern(vec3 base, vec3 lp, float mask){
  vec3 q = lp / uWL; float zn = q.z, part = base.b, t = uTime;
  vec3 c;
  if(part < .25){
    float k = base.g, th = atan(q.x, -q.y);
    float n = lh(floor(vec2(zn * 60., th * 5.)));
    c = mix(uLTop, uLBel, smoothstep(.2, .8, k)) * (.8 + .4 * n);
    float body = smoothstep(-.47, -.38, zn) * (1. - smoothstep(.4, .48, zn));
    // lanterns: soft discs on the lateral line, pulsing in a wave toward the tail
    float cell = zn * uLGlow.x, ci = floor(cell); vec2 d = vec2((fract(cell) - .5) / uLGlow.x, (k - .52) * .07);
    float disc = smoothstep(.016, .003, length(d)) * body;
    float wave = .35 + .65 * pow(.5 + .5 * sin(t * uLGlow.z + ci * .55), 2.);
    // flowing bands along the belly and pouch
    float ph = th * 7. + 1.6 * sin(zn * 7. + t * .15), w = fwidth(ph);
    float band = (1. - smoothstep(.0, .2 + w, abs(sin(ph)))) * (1. - smoothstep(.8, 2., w)) * smoothstep(.55, .9, k) * body;
    float run = .25 + .75 * pow(.5 + .5 * sin(zn * 16. - t * uLGlow.w), 3.);
    // spots on the back
    vec2 gp = vec2(zn * 46., th * 7.); vec2 gi = floor(gp); float hs = lh(gi);
    float spot = smoothstep(.3, .08, length(fract(gp) - .5 - .25 * (vec2(hs, lh(gi + 7.)) - .5))) * step(.55, hs) * (1. - smoothstep(.2, .4, k)) * body * (.3 + .7 * pow(.5 + .5 * sin(t * 1.1 + hs * 40.), 3.));
    spot *= 1. - smoothstep(.25, .7, length(fwidth(gp)));
    gEmitF = uGlowF * (disc * wave * 1.6 + band * run * .9 + spot * 1.1);
    c *= 1. - .5 * disc;
  } else if(part < .75){
    float e = base.g;
    c = mix(uLFin, uLEdge, e * .7);
    gEmitF = uGlowF * (smoothstep(.72, 1., e) * (.5 + .5 * sin(t * 1.3 - zn * 16.)) * 1.1 + .05);
  } else { c = uLHorn; }
  return c * base.r;
}
`;
// makeLeviathan(opts): a vast luminous sky whale. One draw call, ~1.1k triangles. Follows a route like every swimmer.
export function makeLeviathan(opts = {}) {
  const rng = rngOf(opts), L = opts.length ?? 48, gk = opts.glowIntensity ?? 2.2;
  const base = leviathanGeometry({ len: L });
  return makeSwimmer(base, opts, rng, { len: L, speed: 6, count: 1, light: 'alien', center: [0, 70, 0], radius: 190, height: 14, span: 700, swim: [0.085, 0.045, 4.6, 0.42], fin: [0.095, 0.42, -0.06, 1.7], bank: 50, bob: 1.5, rim: 0.9, spec: 0.8, shine: 22, caustics: 0,
    glow: opts.glow ?? '#3affe0', glowK: gk, glowAnim: [0.5, 0.5, 1.3, 16], scales: [0.4, 0.55, 0.3], spread: [L * 0.9, L * 0.4, L * 0.9], pattern: LEVI_PATTERN, near: 0.03,
    uniforms: { uLTop: { value: col(opts.top ?? '#2a2f78') }, uLBel: { value: col(opts.belly ?? '#2c7f8c') }, uLFin: { value: col(opts.fin ?? '#3a3f9a') }, uLEdge: { value: col(opts.edge ?? '#58c8d8') }, uLHorn: { value: col(opts.horn ?? '#c8d8f0') },
      uGlowF: { value: col(opts.glow ?? '#3affe0').multiplyScalar(gk) }, uWL: { value: L }, uLGlow: { value: new THREE.Vector4(opts.lanterns ?? 22, 0, 1.4, 1.1) } } });
}

// makeFloatingJellies(opts): big drifting sky jellies. Same options as makeJellyfish; larger, slower, alien-lit.
// With `avoid: path` every jelly (bell, arms and tentacles) keeps `clear` metres (default 20) away from the camera path.
export function makeFloatingJellies(opts = {}) {
  const rng = rngOf(opts);
  return makeJellyfish({ preset: rng.pick ? rng.pick(['orchid', 'lagoon', 'ember']) : 'orchid', count: 14, size: 5, radius: 0.55, length: 3.4, spread: [70, 18, 70], center: [0, 40, 0], pulse: 0.16, thrust: 0.7, drift: [6, 3, 6], light: 'alien', glowIntensity: 1.6, hueVariety: 1, opacity: 0.85, clear: 20, ...opts, rng });
}

// ---------- ribbon eels of light ----------
const EEL_PRE = /* glsl */`
uniform float uLen, uWidth; uniform vec4 uWave, uPulse; uniform vec3 uColA, uColB;
varying float vAlong, vAcross;
`;
const EEL_TRAJ = /* glsl */`
vec3 traj(float q){
  float s = q - iA.z; vec3 h = h31(iB.z);
  gFade = endFade(s);
  vec3 w = vec3(sin(s * .021 * (.7 + h.x) + h.y * 30.), sin(s * .017 * (.7 + h.z) + h.x * 30.), cos(s * .019 * (.7 + h.y) + h.z * 30.)) * uWave.w;
  return routeAt(s) + vec3(iA.x, iA.y, iB.w) + w;
}
`;
const EEL_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float t = aAnim.y, seed = iB.z, ph = (uPhase * uWave.x * (.8 + .4 * h11(seed)) + iA.w) * 6.2832;
  float amp = uWave.y * (.2 + t), arg = t * uWave.z - ph;
  p.y += aAnim.x * uWidth * .16 * sin(t * 90. - ph * 4.);          // the fin edges ripple
  p.xy = rot2(t * 4.2 + uTime * .35 + seed) * p.xy;                 // a slow twist runs down the ribbon
  p.x += amp * sin(arg); p.y += amp * .6 * cos(arg * .83 + 1.);
  vAlong = t; vAcross = aAnim.x;
}
`;
// hue-preserving light: a dim membrane, a bright spine and two edge lines, pulses travelling head to tail. Peak radiance ~2.3 x colour.
const EEL_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uColA, uColB; uniform vec4 uPulse; uniform float uTime;
varying vec3 vColor, vN, vWorld, vEmit, vLocal; varying float vThin, vAlong, vAcross;
void main(){
  float ax = abs(vAcross), fw = fwidth(vAcross);
  float sheet = 1. - ax * ax, spine = 1. - smoothstep(.0, .14 + fw, ax), edge = smoothstep(.62 - fw, .9, ax) * (1. - smoothstep(.93, 1., ax));
  float ends = smoothstep(.0, .03, vAlong) * (1. - smoothstep(.7, 1., vAlong));
  float pulse = uPulse.x + uPulse.y * pow(.5 + .5 * sin(vAlong * uPulse.w - uTime * uPulse.z), 4.);
  float bars = .75 + .25 * sin(vAlong * 260.);
  vec3 hue = mix(uColA, uColB, smoothstep(.04, .75, vAlong)) * vColor;
  vec3 c = hue * (.3 * sheet * bars + 1.05 * spine + .55 * edge) * pulse * ends;
  c += uColA * exp(-vAlong * 45.) * 1.2 * sheet;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
    c *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
    c *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(c, 1.);
}
`;
// makeRibbonEels(opts): long undulating ribbons of light following a route (additive HDR). 192 triangles each.
export function makeRibbonEels(opts = {}) {
  const rng = rngOf(opts), count = Math.max(1, Math.floor(opts.count ?? 9)), len = opts.length ?? 26, width = opts.width ?? 0.7, NS = 48;
  const g = new Geo(), white = new THREE.Color(1, 1, 1), rows = [];
  for (let i = 0; i <= NS; i++) { const t = i / NS, k0 = Math.min(1, t / 0.035), k1 = Math.min(1, (1 - t) / 0.3), w = width * Math.sqrt(k0) * (0.25 + 0.75 * k1 * k1 * (3 - 2 * k1)) * (i === 2 ? 1.25 : 1), z = -t * len, row = [g.v(-w, 0, z, white), g.v(0, 0, z, white), g.v(w, 0, z, white)]; rows.push(row); g.a[row[0] * 4] = -1; g.a[row[2] * 4] = 1; for (const r of row) g.a[r * 4 + 1] = t; }
  for (let i = 0; i < NS; i++) { g.quad(rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]); g.quad(rows[i][1], rows[i][2], rows[i + 1][2], rows[i + 1][1]); }
  const base = g.build(), speed = opts.speed ?? 9;
  const R = resolveRoute({ ...opts, speed }, rng, { center: [0, 30, 0], radius: 70, height: 16, span: 400, wobble: 0.4 });
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3), sp = opts.spread || [14, 8, 60], c = new THREE.Color();
  let lat = 0, back = 0;
  for (let i = 0; i < count; i++) {
    iA.set([rng.gauss() * sp[0] * 0.5, rng.gauss() * sp[1] * 0.5, rng() * sp[2] + i * 3, rng()], i * 4); iB.set([rng.range(0.6, 1.3) * (opts.size ?? 1), 0, rng() * 100, rng.gauss() * sp[0] * 0.5], i * 4);
    c.setHSL(rng(), 0.5 * (opts.hueVariety ?? 0.5), 0.75); iT.set([c.r, c.g, c.b], i * 3);
    lat = Math.max(lat, Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3])); back = Math.max(back, iA[i * 4 + 2]);
  }
  const k = opts.intensity ?? 1.2, wave = [opts.waveSpeed ?? 0.45, opts.wave ?? 1.6, opts.waves ?? 9, opts.wander ?? 6], size = (opts.size ?? 1) * 1.3;
  const material = creatureMaterial({
    instanced: true, spine: true, route: R.route, light: opts.light || 'alien', eps: 1.5, pre: EEL_PRE, traj: EEL_TRAJ, deform: EEL_DEFORM, frag: EEL_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, near: [1.5, 5],
    uniforms: { uLen: { value: len }, uWidth: { value: width }, uWave: { value: new THREE.Vector4(...wave) }, uPulse: { value: new THREE.Vector4(0.5, 1.1, opts.pulseSpeed ?? 2.4, opts.pulses ?? 26) },
      uColA: { value: col(opts.color ?? '#5affea').multiplyScalar(k) }, uColB: { value: col(opts.color2 ?? '#c050ff').multiplyScalar(k) } },
  });
  const B = routeBounds(R, lat + wave[3] * 1.8 + wave[1] * 2 + width * 2, back + len * size);
  const geometry = instancedGeo(base, count, iA, iB, iT), object = creatureMesh(geometry, material, 3, B.sphere), u = material.uniforms;
  return { object, material, uniforms: u, geometry, count, route: R.route, bounds: B.sphere, triangles: triCount(base) * count,
    update(dt, time, camera, pu) { const s = R.step(dt, time, pu); u.uTime.value = time; u.uPhase.value = time + R.state.extra; u.uVis.value = R.state.vis; u.uQ.value = s; B.follow(s); }, setLight() {},
    positionAt(time, pu, out = new THREE.Vector3()) { return R.route.pointAt(R.travel(time, pu), out); } };
}

// ---------- grazing tripods ----------
export function tripodGeometry(S = {}) {
  const g = new Geo(), H = S.h ?? 9, cTop = col(S.coat ?? '#4a3f8a'), cBel = col(S.belly ?? '#2a8a8a'), cLeg = col(S.legs ?? '#3a3470'), cFoot = col(S.sock ?? '#1e1a44'), cAcc = col(S.accent ?? '#7ad8e0'), white = col('#ffffff');
  const R = 0.17 * H, py = H;
  // lens-shaped pod with a crest
  const pod = g.loft([{ z: -R * 1.2, y: py, rx: 0, ry: 0 }, { z: -R * 0.85, y: py, rx: R * 0.55, ry: R * 0.3 }, { z: -R * 0.2, y: py + 0.02 * H, rx: R, ry: R * 0.52 }, { z: R * 0.5, y: py + 0.02 * H, rx: R * 0.85, ry: R * 0.5 }, { z: R * 1.05, y: py, rx: R * 0.4, ry: R * 0.3 }, { z: R * 1.3, y: py - 0.01 * H, rx: 0, ry: 0 }], { sides: 10, top: cTop, belly: cBel, shade: [-0.5, 0.2] });
  g.glow(pod, (x, y, z) => (Math.abs(y - py + R * 0.12) < R * 0.1 && Math.abs(x) > R * 0.3 ? 1 : 0));
  for (let i = 0; i < 5; i++) { const z = R * (0.6 - i * 0.35), h = R * (0.5 + 0.5 * Math.sin((i + 0.5) / 5 * Math.PI)); const f = g.fan([[0, py + R * 0.42, z + R * 0.15], [0, py + R * 0.45 + h, z - R * 0.3], [0, py + R * 0.4, z - R * 0.22]], cTop, cAcc); g.glow(f, (x, y) => (y > py + R * 0.5 + h * 0.5 ? 1 : 0)); }
  for (const sx of [-1, 1]) { const e = g.blob(sx * R * 0.42, py + R * 0.1, R * 0.95, R * 0.09, R * 0.09, R * 0.09, white, null, 5, 3); g.glow(e, 2); }
  // three long two-jointed legs: one ahead, two behind
  const leg = (ang, phase) => {
    const dx = Math.sin(ang), dz = Math.cos(ang), jx = dx * R * 0.6, jz = dz * R * 0.6, jy = py - R * 0.2;
    const pts = [[jx, jy, jz], [dx * 0.3 * H, jy + 0.12 * H, dz * 0.3 * H], [dx * 0.36 * H, 0.52 * H, dz * 0.36 * H], [dx * 0.3 * H, 0.06 * H, dz * 0.3 * H], [dx * 0.3 * H, 0, dz * 0.3 * H + 0.01 * H]];
    const r = g.tube(pts, [0.022 * H, 0.03 * H, 0.016 * H, 0.011 * H, 0.03 * H], 5, cLeg, cFoot);
    g.anim(r, (x, y) => [phase, Math.min(1, Math.max(0, (jy + 0.12 * H - y) / (jy + 0.12 * H))) * (y > jy && Math.hypot(x, 0) < 99 ? 1 : 1), 1, 0]); g.pivot(r, jx, jy, jz);
    g.glow(r, (x, y) => (Math.abs(y - (jy + 0.12 * H)) < 0.03 * H || Math.abs(y - 0.52 * H) < 0.035 * H ? 1.2 : 0));
  };
  leg(0, 0); leg((Math.PI * 2) / 3, 0.33); leg((-Math.PI * 2) / 3, 0.66);
  // grazing trunk with a glowing mouth
  const n0 = g.n, nb = [0, py - R * 0.25, R * 0.9], pts = [], rr = [], m = 8;
  for (let i = 0; i <= m; i++) { const t = i / m; pts.push([0, nb[1] - t * 0.36 * H - Math.sin(t * Math.PI) * 0.03 * H, nb[2] + Math.sin(t * Math.PI * 0.6) * 0.16 * H]); rr.push(0.028 * H * (1 - 0.55 * t)); }
  const nk = g.tube(pts, rr, 5, cTop, cAcc); g.glow(nk, (x, y) => (y < nb[1] - 0.3 * H ? 1.5 : 0));
  g.anim([n0, g.n], (x, y) => [Math.min(1, Math.max(0, (nb[1] - y) / (0.2 * H))), 0, 2, 0]); g.pivot([n0, g.n], nb[0], nb[1], nb[2]);
  return g.build();
}
export const TRIPOD_PRESET = { h: 9, bodyLen: 0.4, speed: 1.6, stride: 0.5, graze: 0.75, pattern: 'none', count: 5, sizes: [1, 0.8, 0.9, 0.55, 0.7], coat: '#4a3f8a', belly: '#2a8a8a', legs: '#3a3470', sock: '#1e1a44', accent: '#7ad8e0', glow: '#58ffe8', glowK: 1.1, glowAnim: [0.6, 0.4, 1.6, 0], shadow: [3.6, 3.6, 0] };
// makeTripods(opts): tall three-legged grazers that stalk across terrain. Takes every makeHerd option (center, radius, heightAt, mode, route...).
export function makeTripods(opts = {}) {
  const P = { ...TRIPOD_PRESET, ...(opts.height ? { h: opts.height, shadow: [opts.height * 0.4, opts.height * 0.4, 0] } : {}) };
  for (const k of ['coat', 'belly', 'legs', 'sock', 'accent']) if (opts[k] !== undefined) P[k] = opts[k];
  return makeHerd({ light: 'alien', swing: 0.2, pause: 0.11, roam: 2.2, radius: 60, ...opts, preset: P, geometry: tripodGeometry(P) });
}
