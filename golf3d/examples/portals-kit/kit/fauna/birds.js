// Birds: instanced bodies with two-segment flapping wings, moved along baked routes in the vertex shader.
import * as THREE from 'three';
import { Geo, col, rngOf, resolveRoute, routeBounds, creatureMaterial, instancedGeo, creatureMesh, triCount, applyLight, wingReach, clearSteps } from './common.js';

// wing planforms: [span fraction, leading-edge z / span, chord multiplier]
const WINGS = {
  gull: [[0, 0, 1], [0.22, 0.07, 1.02], [0.46, 0.11, 0.88], [0.74, 0.0, 0.6], [1, -0.24, 0.06]],
  long: [[0, 0, 1], [0.28, 0.05, 1.02], [0.55, 0.07, 0.9], [0.8, 0.0, 0.62], [1, -0.16, 0.08]],
  broad: [[0, 0, 0.95], [0.3, 0.04, 1.1], [0.6, 0.05, 1.12], [0.84, 0.03, 1.02], [1, -0.02, 0.8]],
  scythe: [[0, 0, 1], [0.22, 0.07, 0.92], [0.5, 0.04, 0.7], [0.76, -0.12, 0.44], [1, -0.44, 0.04]],
  bat: [[0, 0, 1.35], [0.2, 0.1, 0.85], [0.42, 0.17, 1.12], [0.62, 0.14, 0.72], [0.82, 0.05, 0.86], [1, -0.14, 0.04]],
  dart: [[0, 0, 1], [0.3, 0.02, 1.0], [0.6, -0.04, 0.8], [1, -0.3, 0.05]],
};

export const BIRD_PRESETS = {
  gulls: { len: 0.6, girth: 0.085, span: 0.72, chord: 0.2, wing: 'gull', neck: 0, tail: 0.16, tailW: 0.1, legs: 0, flap: 2.5, amp: 0.55, glide: 0.5, dihedral: 0.1, outer: 0.9, speed: 12, count: 28, form: 'loose', spread: [34, 12, 34], wander: [5, 2.5, 4, 0.35], size: 1.5,
    body: '#f2f2ee', belly: '#ffffff', wingC: '#aeb6c0', trail: '#d9dde2', tip: '#22252b', beak: '#f0b020', head: '#f6f6f2', legC: '#e0a050', height: 30, radius: 90 },
  starlings: { len: 0.21, girth: 0.04, span: 0.2, chord: 0.085, wing: 'dart', neck: 0, tail: 0.06, tailW: 0.04, legs: 0, flap: 9, amp: 0.8, glide: 0.12, dihedral: 0.05, outer: 0.6, speed: 15, count: 3500, form: 'murmuration', spread: [60, 22, 40], wander: [1.2, 0.8, 1.2, 1.2], size: 2.4, lod: 'low',
    body: '#2a2634', belly: '#332e3e', wingC: '#2c2838', trail: '#383246', tip: '#1e1b26', beak: '#c8a040', head: '#15131a', legC: '#553', height: 70, radius: 160 },
  geese: { len: 0.95, girth: 0.14, span: 0.85, chord: 0.3, wing: 'long', neck: 0.34, tail: 0.14, tailW: 0.12, legs: 0, flap: 3.2, amp: 0.5, glide: 0, dihedral: 0.06, outer: 0.7, speed: 16, count: 17, form: 'vee', spacing: 2.6, wander: [0.35, 0.3, 0.3, 0.5], size: 1.5,
    body: '#a39480', belly: '#e0d8ca', wingC: '#8a7c6a', trail: '#5a5148', tip: '#3a342e', beak: '#2a2622', head: '#2a2624', neckC: '#2a2624', legC: '#444', height: 55, radius: 220 },
  flamingos: { len: 0.7, girth: 0.11, span: 0.75, chord: 0.24, wing: 'long', neck: 0.7, tail: 0.08, tailW: 0.08, legs: 0.85, flap: 3.0, amp: 0.5, glide: 0, dihedral: 0.05, outer: 0.7, speed: 13, count: 22, form: 'line', spacing: 2.3, wander: [0.4, 0.35, 0.4, 0.45], size: 1.5,
    body: '#ffb4bc', belly: '#ffd0d4', wingC: '#ff8c9c', trail: '#2a1e22', tip: '#2a1e22', beak: '#2a1a1c', head: '#ffc0c8', neckC: '#ffc0c8', legC: '#ff9aa8', height: 26, radius: 150 },
  bats: { len: 0.2, girth: 0.05, span: 0.3, chord: 0.17, wing: 'bat', neck: 0, tail: 0.03, tailW: 0.03, legs: 0, flap: 8.5, amp: 0.95, glide: 0, dihedral: 0.0, outer: 1.0, speed: 9, count: 260, form: 'stream', spread: [9, 6, 150], wander: [3.5, 2.5, 2.5, 1.6], size: 1.9, ears: 1,
    body: '#3a2a22', belly: '#48342a', wingC: '#4a3228', trail: '#5c3e30', tip: '#30201a', beak: '#2a1c16', head: '#3a2a22', legC: '#222', height: 24, radius: 70 },
  swifts: { len: 0.24, girth: 0.04, span: 0.33, chord: 0.075, wing: 'scythe', neck: 0, tail: 0.11, tailW: 0.07, fork: 1, legs: 0, flap: 8, amp: 0.6, glide: 0.5, dihedral: 0.02, outer: 0.6, speed: 20, count: 40, form: 'loose', spread: [40, 16, 40], wander: [9, 5, 8, 0.7], size: 1.9,
    body: '#3a3444', belly: '#5a5262', wingC: '#342f3e', trail: '#403a4c', tip: '#26222e', beak: '#111', head: '#28242e', legC: '#222', height: 40, radius: 70 },
  eagles: { len: 0.95, girth: 0.15, span: 1.05, chord: 0.46, wing: 'broad', neck: 0, tail: 0.3, tailW: 0.26, legs: 0, flap: 1.9, amp: 0.5, glide: 0.85, dihedral: 0.2, outer: 0.8, speed: 9, count: 3, form: 'soar', spread: [70, 22, 70], wander: [0, 0, 0, 0.2], size: 1.7, fingers: 1,
    body: '#6e4c30', belly: '#7c5a3c', wingC: '#6a4a32', trail: '#4a3424', tip: '#30221a', beak: '#f0b828', head: '#f1ece2', tailC: '#f1ece2', legC: '#e0a020', height: 80, radius: 90 },
  crows: { len: 0.5, girth: 0.085, span: 0.5, chord: 0.24, wing: 'broad', neck: 0, tail: 0.18, tailW: 0.13, legs: 0, flap: 3.6, amp: 0.6, glide: 0.25, dihedral: 0.06, outer: 0.8, speed: 11, count: 16, form: 'loose', spread: [30, 10, 30], wander: [4, 2, 4, 0.4], size: 1.5, fingers: 1,
    body: '#2c2c38', belly: '#34343f', wingC: '#2a2a36', trail: '#333342', tip: '#1c1c24', beak: '#24242c', head: '#2c2c38', legC: '#222', height: 30, radius: 70 },
  parrots: { len: 0.5, girth: 0.08, span: 0.46, chord: 0.2, wing: 'long', neck: 0, tail: 0.4, tailW: 0.07, legs: 0, flap: 5, amp: 0.65, glide: 0.15, dihedral: 0.05, outer: 0.8, speed: 13, count: 14, form: 'loose', spread: [16, 6, 20], wander: [2, 1.2, 2, 0.6], size: 1.6,
    body: '#e8262a', belly: '#f04a30', wingC: '#f0c020', trail: '#1c50c8', tip: '#143a9c', beak: '#f2ead8', head: '#ee3030', tailC: '#d42028', legC: '#444', height: 22, radius: 60 },
};

// Bird model: nose +Z. aAnim = (metres from shoulder, side, trailing-edge weight, tail weight)
export function birdGeometry(S, lod = 'high') {
  const g = new Geo(), L = S.len, G = S.girth, hi = lod !== 'low';
  const cBody = col(S.body), cBelly = col(S.belly), cHead = col(S.head ?? S.body), cBeak = col(S.beak), cNeck = col(S.neckC ?? S.head ?? S.body);
  const cW = col(S.wingC), cTr = col(S.trail ?? S.wingC), cTip = col(S.tip ?? S.wingC), cTail = col(S.tailC ?? S.trail ?? S.wingC), cLeg = col(S.legC ?? S.beak);
  const N = S.neck || 0, z0 = -0.5 * L, zc = 0.24 * L, zh = zc + (N > 0 ? 0.16 : 0.19) * L + N, ny = N * 0.12;
  if (hi) {
    const rings = [
      { z: z0, y: 0.1 * G, rx: 0, ry: 0 }, { z: z0 + 0.12 * L, y: 0.05 * G, rx: 0.5 * G, ry: 0.42 * G }, { z: -0.12 * L, rx: 0.95 * G, ry: 0.9 * G },
      { z: 0.1 * L, rx: G, ry: G }, { z: zc, y: 0.1 * G, rx: 0.72 * G, ry: 0.74 * G },
    ];
    if (N > 0) { const nr = Math.max(0.2 * G, 0.028 + 0.1 * G); rings.push({ z: zc + 0.1 * L, y: 0.3 * G, rx: nr * 1.25, ry: nr * 1.3, top: cNeck, belly: cNeck }, { z: zc + 0.1 * L + N * 0.5, y: 0.3 * G + ny, rx: nr, ry: nr, top: cNeck, belly: cNeck }, { z: zh - 0.1 * L, y: 0.3 * G + ny * 0.6, rx: nr, ry: nr, top: cNeck, belly: cNeck }); }
    const hy = N > 0 ? 0.3 * G + ny * 0.4 : 0.3 * G, hr = N > 0 ? Math.max(0.5 * G, 0.055) : 0.58 * G;
    if (!(N > 0)) rings.push({ z: zc + 0.075 * L, y: 0.22 * G, rx: 0.43 * G, ry: 0.45 * G, top: cHead, belly: cHead });   // neck pinch: the head reads as a head
    rings.push({ z: zh - 0.03 * L, y: hy, rx: hr, ry: hr, top: cHead, belly: cHead }, { z: zh + 0.05 * L, y: hy - 0.04 * G, rx: hr * 0.62, ry: hr * 0.66, top: cHead, belly: cHead },
      { z: zh + 0.08 * L, y: hy - 0.1 * G, rx: hr * 0.36, ry: hr * 0.4, top: cBeak, belly: cBeak }, { z: zh + 0.08 * L + (S.beakLen ?? 0.1) * L, y: hy - 0.22 * G - (S.neck > 0.5 ? 0.6 * G : 0), rx: 0, ry: 0, top: cBeak });
    g.loft(rings, { sides: 6, top: cBody, belly: cBelly });
    if (S.ears) for (const sx of [-1, 1]) g.fan([[sx * 0.3 * G, hy + hr * 0.5, zh - 0.02 * L], [sx * 0.9 * G, hy + hr * 2.4, zh - 0.03 * L], [sx * 0.7 * G, hy + hr * 0.6, zh + 0.03 * L]], cHead);
  } else {
    g.loft([{ z: z0, rx: 0, ry: 0 }, { z: 0.05 * L, rx: G, ry: G }, { z: zh + 0.1 * L, rx: 0, ry: 0, top: cHead }], { sides: 4, top: cBody, belly: cBelly });
  }
  // tail fan
  const tl = S.tail, tw = S.tailW, tz = z0 + 0.1 * L;
  let r;
  if (S.fork) r = g.fan([[0, 0.05 * G, tz], [tw * 0.35, 0.05 * G, tz], [tw, 0.02 * G, tz - tl], [0, 0.05 * G, tz - tl * 0.45], [-tw, 0.02 * G, tz - tl], [-tw * 0.35, 0.05 * G, tz]], cTail);
  else if (hi) r = g.fan([[0, 0.08 * G, tz + 0.05 * L], [tw * 0.4, 0.06 * G, tz], [tw, 0.02 * G, tz - tl * 0.8], [tw * 0.45, 0.02 * G, tz - tl], [-tw * 0.45, 0.02 * G, tz - tl], [-tw, 0.02 * G, tz - tl * 0.8], [-tw * 0.4, 0.06 * G, tz]], cTail);
  else r = g.fan([[0, 0, tz + 0.05 * L], [tw, 0, tz - tl], [-tw, 0, tz - tl]], cTail);
  g.anim(r, (x, y, z) => [0, 0, 0, Math.min(1, (tz - z) / tl)]);
  // trailing legs (flamingo, heron, crane)
  if (S.legs > 0 && hi) for (const sx of [-1, 1]) g.tube([[sx * 0.3 * G, -0.6 * G, -0.1 * L], [sx * 0.25 * G, -0.3 * G, z0 - S.legs * 0.5], [sx * 0.22 * G, -0.15 * G, z0 - S.legs]], [0.016, 0.012, 0.014], 3, cLeg);
  // wings (right side built, then mirrored)
  const W = S.span, C = S.chord, plan = WINGS[S.wing] || WINGS.long, st = hi ? plan : [plan[0], plan[Math.floor(plan.length / 2)], plan[plan.length - 1]];
  const sx0 = 0.5 * G, wy = 0.35 * G, wz = 0.16 * L + C * 0.35, lead = [], trail = [], cl = [], ct = [];
  if (hi) { lead.push([0.15 * G, wy + 0.2 * G, wz + 0.1 * C]); trail.push([0.15 * G, wy + 0.1 * G, wz - C * 1.3]); cl.push(cBody.clone()); ct.push(cBody.clone()); }   // root fairing inside the body
  for (const [s, lz, cm] of st) {
    const x = sx0 + s * W, zl = wz + lz * W, k = Math.min(1, Math.max(0, (s - 0.62) / 0.3)), kb = hi ? Math.max(0, 1 - s / 0.16) * 0.8 : 0;
    lead.push([x, wy, zl + (s === 0 && hi ? 0.06 * C : 0)]); trail.push([x, wy - 0.01, zl - C * cm * (s === 0 && hi ? 1.18 : 1)]);
    cl.push(cW.clone().lerp(cTip, k).lerp(cBody, kb)); ct.push(cTr.clone().lerp(cTip, k).lerp(cBody, kb));
  }
  const w0 = g.n; g.strip(lead, trail, cl, ct);
  if (S.fingers && hi) {
    const tipL = lead[lead.length - 1], tipT = trail[trail.length - 1], nf = 5;
    for (let i = 0; i < nf; i++) { const t0 = i / nf, t1 = (i + 0.72) / nf, tm = (i + 0.4) / nf, zl0 = tipL[2] + (tipT[2] - tipL[2]) * t0, zl1 = tipL[2] + (tipT[2] - tipL[2]) * t1, zm = tipL[2] + (tipT[2] - tipL[2]) * tm;
      g.fan([[tipL[0] - 0.01, wy, zl0], [tipL[0] + W * (0.2 - 0.1 * Math.abs(tm - 0.35)), wy, zm - W * 0.04 * i], [tipL[0] - 0.01, wy, zl1]], cTip); }
  }
  const wr = [w0, g.n];
  g.anim(wr, (x, y, z) => { const s = (x - sx0) / W, f = Math.min(1, Math.max(0, s)); let lz = 0, cm = 1; for (let i = 0; i < plan.length - 1; i++) if (f >= plan[i][0] && f <= plan[i + 1][0]) { const k = (f - plan[i][0]) / (plan[i + 1][0] - plan[i][0]); lz = plan[i][1] + (plan[i + 1][1] - plan[i][1]) * k; cm = plan[i][2] + (plan[i + 1][2] - plan[i][2]) * k; }
    return [Math.max(0, x - sx0), 1, Math.min(1, Math.max(0, (wz + lz * W - z) / (C * Math.max(cm, 0.2)))), 0]; });
  g.mirror(wr);
  const geo = g.build();
  // cambered wing normals: flat sheets shade like a curved aerofoil that blends into the body
  const an = geo.attributes.aAnim, nn = geo.attributes.normal, v = new THREE.Vector3(), v2 = new THREE.Vector3();
  for (let i = 0; i < an.count; i++) { const side = an.getY(i); if (!side) continue; const up = nn.getY(i) < 0 ? -1 : 1, sp = Math.min(1, an.getX(i) / W);
    v.set(side * (0.25 + 0.35 * sp) * up, up, (0.55 - an.getZ(i)) * up).normalize(); if (sp < 0.2) v.lerp(v2.set(side * 0.6 * up, 0.8 * up, 0), 1 - sp / 0.2).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
  return geo;
}

const BIRD_PRE = /* glsl */`
uniform float uTravel, uSpeed; uniform vec4 uWander, uMorph, uFlap, uWing, uWave; uniform vec3 uSoar;
`;
const BIRD_TRAJ = /* glsl */`
vec3 traj(float q){
  float seed = iB.z; vec3 h = h31(seed);
  float s = uTravel + (q - uTime) * uSpeed - iA.z;
  gFade = endFade(s);
  vec3 w = vec3(sin(q * uWander.w * (.6 + .8 * h.x) + h.y * 40.) + .5 * sin(q * uWander.w * 2.3 * (.7 + .5 * h.z) + h.x * 17.),
                sin(q * uWander.w * 1.3 * (.5 + .9 * h.z) + h.x * 50.),
                sin(q * uWander.w * .8 * (.7 + .6 * h.y) + h.z * 60.)) * uWander.xyz;
#if FORM == 1
  vec3 c = routeAt(s);
  vec3 T = routeAt(s + 5.) - c; T.y = 0.; T = normalize(T + vec3(0., 0., 1e-5)); vec3 Xr = vec3(T.z, 0., -T.x);
  return c + Xr * (iA.x + w.x) + vec3(0., iA.y + w.y, 0.) + T * w.z;
#elif FORM == 2
  vec3 c = routeAt(s) + vec3(iA.x, iA.y, iB.w);
  float r = uSoar.x * (.55 + .9 * h.x), dir = h.y > .5 ? 1. : -1.;
  float a = q * uSoar.y / r * dir + h.z * 6.283;
  r *= 1. + .25 * sin(a * .37 + h.x * 9.);
  return c + vec3(cos(a) * r, uSoar.z * sin(q * .11 + h.y * 30.) + w.y, sin(a) * r);
#else
  vec3 o = vec3(iA.x, iA.y, iB.w);
  #ifdef MORPH
  float mt = q * uMorph.y;
  s -= uMorph.w * (.5 + .5 * sin(dot(o, vec3(.021, .05, .017)) + mt * .9)) ;
  o.xz = rot2(mt * .45 + o.y * uMorph.z) * o.xz;
  o.xy = rot2(sin(mt * .31) * 1.1 + o.z * uMorph.z * .6) * o.xy;
  o.y *= .75 + .35 * sin(mt * .53 + 1.);
  o += uMorph.x * sin(o.yzx * .045 + mt * vec3(1.1, .83, 1.27));
  o += uMorph.x * .45 * sin(o.zxy * .11 - mt * vec3(.9, 1.3, .7));
  // travelling compression waves: dark folding bands sweep through the cloud
  vec3 wd = normalize(vec3(sin(mt * .21), .35 * sin(mt * .13 + 1.), cos(mt * .21)));
  float wp = dot(o, wd) * uWave.y - mt * uWave.z;
  o -= wd * (uWave.x / uWave.y) * sin(wp) ;
  vec3 wd2 = normalize(vec3(cos(mt * .17 + 2.), .5, sin(mt * .17 + 2.)));
  o -= wd2 * (uWave.x * .6 / (uWave.y * 1.9)) * sin(dot(o, wd2) * uWave.y * 1.9 + mt * uWave.z * 1.3);
  #endif
  return routeAt(s) + o + w;
#endif
}
`;
const BIRD_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float seed = iB.z, hs = h11(seed + 3.1);
  float t = (uPhase * uFlap.x * (.85 + .3 * hs) + iA.w) * 6.2832;
  float gl = 0.;
  if(uFlap.z > 0.01){ float th = 1. - 2. * uFlap.z; gl = smoothstep(th - .2, th + .2, sin(uTime * (.3 + .35 * hs) + seed * 37.) + .35 * sin(uTime * 1.1 * (.5 + hs) + seed * 11.)); }
  float amp = uFlap.y * (1. - gl * .93), side = aAnim.y, st = sin(t);
  if(abs(side) > .5){
    float d = aAnim.x, wrist = uWing.x * uFlap.w;
    float a1 = uWing.y * (1. + gl * .7) + amp * st;
    float a2 = a1 + uWing.z * amp * (sin(t - 1.25) - .35) * (1. - gl) - gl * uWing.y * .9;
    float dIn = min(d, wrist), dOut = max(d - wrist, 0.);
    float sx = p.x - side * d;
    p.x = sx + side * (cos(a1) * dIn + cos(a2) * dOut);
    p.y += sin(a1) * dIn + sin(a2) * dOut - aAnim.z * amp * cos(t) * .22 * d;
    p.z -= dOut * amp * max(sin(t - 1.6), 0.) * .25;
    float an = side * (d > wrist ? a2 : a1);
    n.xy = rot2(-an) * n.xy;
    gThin = 1.;
  }
  p.y += uWing.w * amp * cos(t + .5) - aAnim.w * .06 * uWing.x * sin(t * .5 + seed);
}
`;

const defaults = (opts, P) => (k) => opts[k] ?? P[k];
// makeFlock(opts): instanced flapping birds following a baked route. 1 draw call.
function* flockSteps(opts, chunk) {
  const rng = rngOf(opts), P = BIRD_PRESETS[opts.species || opts.preset || 'gulls'] || BIRD_PRESETS.gulls, o = defaults(opts, P);
  const S = { ...P }; for (const k of ['body', 'belly', 'wingC', 'trail', 'tip', 'beak', 'head', 'neckC', 'tailC', 'legC']) if (opts[k] !== undefined) S[k] = opts[k];
  if (opts.palette) Object.assign(S, opts.palette);
  const count = Math.max(1, Math.floor(o('count'))), form = o('form'), size = o('size'), lod = opts.lod || P.lod || (count > 600 ? 'low' : 'high');
  const base = birdGeometry(S, lod), spread = o('spread') || [30, 10, 30], spacing = (o('spacing') || 2.5) * size / 1.5;
  const speed = o('speed'), soar = form === 'soar';
  const R = resolveRoute({ ...opts, speed: soar ? (opts.drift ?? speed * 0.12) : speed }, rng, { center: [0, P.height, 0], radius: P.radius, height: P.height * 0.2, span: 420 });
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3);
  const longArm = rng.sign();
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0, lag = 0;
    if (form === 'vee') { const side = i === 0 ? 0 : (i % 3 === 0 ? -longArm : longArm), rank = i === 0 ? 0 : (side === longArm ? Math.ceil((i * 2) / 3) : i / 3); x = side * rank * spacing * 0.8 + rng.range(-0.2, 0.2); lag = rank * spacing + rng.range(-0.3, 0.3); y = rng.range(-0.3, 0.3) - rank * 0.05; }
    else if (form === 'line') { const k = i - (count - 1) / 2; x = k * spacing * 0.9 + rng.range(-0.3, 0.3); lag = Math.abs(k) * spacing * 0.3 + Math.sin(i * 0.8) * spacing * 0.6 + rng.range(-0.4, 0.4) + spacing * 2; y = Math.sin(i * 0.55) * 0.8 + rng.range(-0.3, 0.3); }
    else if (form === 'murmuration') { const r = Math.pow(rng(), 0.42), a = rng() * 6.283, cz = rng() * 2 - 1, sz = Math.sqrt(1 - cz * cz); x = Math.cos(a) * sz * r * spread[0]; y = cz * r * spread[1]; z = Math.sin(a) * sz * r * spread[2]; }
    else if (form === 'stream') { x = rng.gauss() * spread[0] * 0.5; y = rng.gauss() * spread[1] * 0.5; lag = Math.pow(rng(), 1.6) * spread[2]; }
    else if (form === 'soar') { const a = rng() * 6.283, r = Math.sqrt(rng()); x = Math.cos(a) * r * spread[0]; z = Math.sin(a) * r * spread[2]; y = rng.range(-1, 1) * spread[1]; }
    else { x = rng.gauss() * spread[0] * 0.45; y = rng.gauss() * spread[1] * 0.45; z = rng.gauss() * spread[0] * 0.45; lag = rng() * spread[2]; }
    iA.set([x, y, lag, rng()], i * 4); iB.set([size * rng.range(0.88, 1.12), 1, rng() * 100, z], i * 4);
    const l = rng.range(0.85, 1.1); iT.set([l, l, l], i * 3);
  }
  const frame = form === 'vee' || form === 'line';
  const wander = o('wander');
  const material = creatureMaterial({
    instanced: true, route: R.route, light: opts.light, bank: opts.bank ?? (soar ? 1.4 : Math.min(2, speed * 0.12)), eps: soar ? 0.25 : 0.12,
    pre: BIRD_PRE, traj: BIRD_TRAJ, deform: BIRD_DEFORM, defines: { FORM: frame ? 1 : soar ? 2 : 0, ...(form === 'murmuration' ? { MORPH: 1 } : {}) },
    rim: opts.rim ?? 0.35, trans: opts.translucency ?? 0.6, level: form === 'murmuration' ? 0.6 : 0.8,
    near: opts.nearFade || [(S.len + S.span) * size * 0.8, (S.len + S.span) * size * 2.2],   // near guard: a bird shrinks to nothing between these distances from the lens
    uniforms: {
      uWave: { value: new THREE.Vector4(opts.bands ?? 0.72, opts.bandScale ?? 0.15, opts.bandSpeed ?? 1.7, 0) },
      uTravel: { value: 0 }, uSpeed: { value: R.speed }, uWander: { value: new THREE.Vector4(wander[0], wander[1], wander[2], wander[3]) },
      uMorph: { value: new THREE.Vector4(opts.morph ?? spread[1] * 0.55, opts.morphSpeed ?? 0.5, opts.twist ?? 0.02, opts.shear ?? 30) },
      uFlap: { value: new THREE.Vector4(o('flap'), o('amp'), o('glide'), 0.46) }, uWing: { value: new THREE.Vector4(S.span, o('dihedral'), o('outer'), S.len * 0.07) },
      uSoar: { value: new THREE.Vector3(opts.soarRadius ?? 28, speed, opts.soarLift ?? 6) },
    },
  });
  // bounds: lateral extent of the formation + wander + morph + creature size; the group trails `back` metres behind its lead point
  let lat = 0, back = 0; for (let i = 0; i < count; i++) { lat = Math.max(lat, Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3])); back = Math.max(back, iA[i * 4 + 2]); }
  const U = material.uniforms.uMorph.value, mur = form === 'murmuration';
  const pad = lat * (mur ? 1.25 : 1) + Math.hypot(wander[0], wander[1], wander[2]) * 1.5 + (mur ? U.x * 1.5 + 8 : 0) + (soar ? (opts.soarRadius ?? 28) * 1.85 + (opts.soarLift ?? 6) : 0) + (S.len + S.span) * size * 2.4;
  // reach: how far the dealt flock strays from its course, for a world that must place it. offsets: [x, y, z] per member (x across the
  // course and z unused for vee / line, world axes otherwise); lag [min, max]: metres behind the lead point; wander [x, y, z]: half-extents
  // of the roam; extra: what the form adds in any direction (a soaring circle with its lift, a murmuration's morph and bands); body: radius
  // of the largest member with its wings anywhere in the beat; radius: all of it but lag, about a member's own point of the course
  const offsets = new Float32Array(count * 3), wr = [1.5 * Math.abs(wander[0]), Math.abs(wander[1]), Math.abs(wander[2])], amp = Math.abs(o('amp')), So = material.uniforms.uSoar.value, Wv = material.uniforms.uWave.value;
  let lead = Infinity, big = 0; for (let i = 0; i < count; i++) { offsets.set([iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]], i * 3); lead = Math.min(lead, iA[i * 4 + 2]); big = Math.max(big, iB[i * 4]); }
  const extra = soar ? Math.hypot(1.8125 * So.x, So.z) : mur ? 0.1 * lat + 2.52 * Math.abs(U.x) + 1.32 * Math.abs(Wv.x / Wv.y) : 0, body = big * (wingReach(base, 1 + 0.34 * amp) + S.len * 0.07 * amp + 0.06 * S.span);
  const rest = Math.hypot(wr[0], wr[1], wr[2]) + extra + body, reach = { offsets, frame, lag: [lead, back + (mur ? U.w : 0)], wander: wr, extra, body, radius: lat + rest };
  // keepClear: { path, dist (2), reach, ease, up, from, to, step }: no body within dist metres of the camera path, by place. The deal is over, so it
  // is the course that shifts (clearRoute in common.js) and no draw is taken; kept = { need, moved, shift, short } says what the shift came to.
  // Each member is held off by its own offset (a murmuration, whose offsets turn, by the whole radius)
  if (chunk && opts.keepClear) yield;
  const kept = opts.keepClear ? yield* clearSteps(R.route, opts.keepClear, mur ? lat + rest : rest, mur ? null : offsets, frame, soar ? { rh: 1.8125 * Math.abs(So.x) + body, hv: Math.abs(So.z) + wr[1] + body } : null, R.route.closed ? 0 : 2 * material.uniforms.uEps.value * Math.abs(material.uniforms.uSpeed.value), chunk) : null;
  // (each on a soar: a member's ring with its lift is a low drum about its own centre, and the centre alone moves, up or down)
  // keepClear.each: the course stayed and the members that were too near moved by their own offsets: the dealt places take them
  if (kept && kept.each && kept.moved > 0) { for (let i = 0; i < count; i++) { iA[i * 4] = offsets[i * 3]; iA[i * 4 + 1] = offsets[i * 3 + 1]; iB[i * 4 + 3] = offsets[i * 3 + 2]; } reach.radius += kept.moved; }
  const B = routeBounds(R, pad + (kept && kept.each ? kept.moved : 0), back + (mur ? U.w : 0));
  const geometry = instancedGeo(base, count, iA, iB, iT), object = creatureMesh(geometry, material, 0, B.sphere), u = material.uniforms;
  // THE CLEARING, WRITTEN ON THE MESH so that a check outside the world can read it (the owner's air counter, tools/airtest.mjs; nothing
  // in the site reads it and no pixel moves for it): asked, the metres of clear air this flock was asked to keep by place, or null where
  // the world asked for no clearing at all; need, those metres plus this flock's own reach (its wander, its body and its lift); short,
  // what was still missing after the last pass, 0 when the course is clear; moved, the largest shift it took to get there.
  object.userData.flockClear = { species: opts.species || opts.preset || 'gulls', count,
    asked: opts.keepClear ? (opts.keepClear.dist ?? 2) : null,
    form: form || 'scatter', mode: R.mode, key: R.key, speed: R.speed,   // mode: how the travel runs. loop, on the clock alone, so any place of the course meets any
    // place of the flown line at some visit; along, keyed to the camera's own u with a drift; cross, keyed to u alone (one travel a u).
    // and, for a soar, the very drum clearDrums keeps out, so the counter reads the ring as the kit does
    drum: soar ? { rh: 1.8125 * Math.abs(So.x) + body, hv: Math.abs(So.z) + wr[1] + body } : null,
    need: kept ? kept.need : null, short: kept ? kept.short : null, moved: kept ? kept.moved : null, each: kept ? !!kept.each : null,
    radius: reach.radius, route: R.route, reach };   // (the course, the reach and the dealt offsets, so that the counter can walk the flock itself and take its own reading)
  return {
    object, material, uniforms: u, geometry, count, route: R.route, bounds: B.sphere, species: opts.species || opts.preset || 'gulls', triangles: triCount(base) * count, reach, kept,
    update(dt, time, camera, pu) { const s = R.step(dt, time, pu); u.uTime.value = time; u.uQ.value = time; u.uPhase.value = time + R.state.extra; u.uVis.value = R.state.vis; u.uTravel.value = s; B.follow(s); },
    setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { return R.route.pointAt(R.travel(time, pu), out); },
  };
}
export function makeFlock(opts = {}) { const it = flockSteps(opts, 0); let s = it.next(); while (!s.done) s = it.next(); return s.value; }
// The stepped form (since s0r): `const flock = await fauna.makeFlockAsync(opts, ctx.yield)` makes the same flock to the bit and takes the
// same draws, all of them before its first hand-back; the keepClear clearing is handed back to the page in slices (every `chunk` member
// checks, after each plumb rise, between passes), so that no build step carries a whole clearing. Await it before the next draw.
export async function makeFlockAsync(opts = {}, y, chunk = 256) { const it = flockSteps(opts, Math.max(1, chunk)), w = typeof y === 'function' ? y : async () => {}; let s = it.next(); while (!s.done) { await w(); s = it.next(); } return s.value; }
