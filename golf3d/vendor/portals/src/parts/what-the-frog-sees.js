// The frog's eye: ONE rule in every material of the pond. A point is drawn only as strongly as it moves across the eye:
//   s = screen speed in frame heights per second, g = smoothstep(0.05, 0.15, s), out = mix(FIELD, hazed lit colour, g).
// Stateless: every material computes its point now and one nominal step (1/30 s) ago, against the camera now and the
// camera of one step ago, so a still, a strip and a hitch all give the same picture. Nothing reads the previous frame.
import * as THREE from 'three';

export const DELTA = 1 / 30;
export const SIT = { x: 0, y: 2.4, z: -81 };          // where we sit, pond-local
export const RELEASE_Z = -140.4;                       // world z of the camera when the jump starts (the pond has ridden 59.4 m)
const JUMP_EASE = 12;                                  // metres of path after the release over which the pond lets go of us
export const CARRY_END = RELEASE_Z - SIT.z - JUMP_EASE / 2;   // the pond's final offset along z
const EASE0 = -79, EASE1 = -83;                        // camera world z over which the pond picks up our speed

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const lin = (hex) => new THREE.Color(hex);

// ---- the flight's clock, from the same pace table the engine builds: T(u) seconds, du/dt, and u at a second
export function makeClock(paceFn, duration) {
  const N = 64, p = new Float32Array(N + 1); let inv = 0;
  for (let i = 0; i <= N; i++) p[i] = clamp(+paceFn(i / N) || 1, 0.35, 2.5);
  for (let i = 0; i < N; i++) inv += 2 / (p[i] + p[i + 1]);
  const k = inv / N;
  const pn = (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return (p[i] + (p[i + 1] - p[i]) * (x - i)) * k; };
  const M = 4096, tt = new Float32Array(M + 1);
  for (let i = 0; i < M; i++) tt[i + 1] = tt[i] + duration / (M * pn((i + 0.5) / M));
  const T = (u) => { const x = clamp(u, 0, 1) * M, i = Math.min(M - 1, Math.floor(x)); return tt[i] + (tt[i + 1] - tt[i]) * (x - i); };
  const uOf = (t) => { let a = 0, b = M; while (b - a > 1) { const m = (a + b) >> 1; if (tt[m] <= t) a = m; else b = m; } return clamp((a + (t - tt[a]) / Math.max(1e-6, tt[b] - tt[a])) / M, 0, 1); };
  return { T, uOf, rate: (u) => pn(u) / duration, total: tt[M] };
}

// ---- the pond's ride: its offset along z as a function of where the camera is on the path (a pure function of u)
// local camera z = world z until EASE0, eases over 4 m of our travel to a stop at SIT.z, holds until the release.
export function carryZ(camWorldZ) {
  if (camWorldZ >= EASE0) return 0;
  if (camWorldZ >= EASE1) { const q = (EASE0 - camWorldZ) / (EASE0 - EASE1); return camWorldZ - (EASE0 - 4 * (q - 0.5 * q * q)); }
  const d = Math.min(JUMP_EASE, Math.max(0, RELEASE_Z - camWorldZ));
  return Math.max(camWorldZ, RELEASE_Z) - SIT.z - (d - d * d / (2 * JUMP_EASE));
}

// ---- the flight's line (world space). THE SWING IN: we arrive on a long right-hand bend, so for the first three seconds the whole
// pond turns across the eye and is all there (sky, far bank, the bird); then the line straightens for the run onto the mud and, by
// the rule, whatever we head straight at goes blank; then we stop and everything goes. THE JUMP keeps hooking left all the way down,
// so the pond stays whole until the last straight 35 m into the pool. Lengths are those of the first build: every beat keeps its u.
const knots = (k, d) => { for (let i = 1; i < k.length; i++) if (d <= k[i][0]) { const a = k[i - 1], b = k[i]; return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]); } return k[k.length - 1][1]; };
export const SWING = { len: 58, k0: 1 / 65, ease: 10 };   // metres of bend before the straight run, its curvature, metres over which it eases out
// x of the approach line at a world z (0 once the line is straight): the near lilies and sedges are set out from it
const swingPts = (() => { const out = []; let x = 0, z = -SWING.len, psi = 0; out.push([x, z]);
  for (let d = 0; d < SWING.len; d += 1) { psi += SWING.k0 * sst(0, SWING.ease, d + 0.5); x += Math.sin(psi); z += Math.cos(psi); out.push([x, z]); } return out; })();
export const swingX = (z) => { const P = swingPts; if (z <= P[0][1]) return 0; for (let i = 1; i < P.length; i++) if (z <= P[i][1]) { const a = P[i - 1], b = P[i]; return a[0] + (b[0] - a[0]) * (z - a[1]) / Math.max(1e-6, b[1] - a[1]); } return P[P.length - 1][0]; };
// TWO FROG HOPS IN (polish 1). We arrive level, spring off the film, and come in on two arcs: a long one, a touch on the water,
// a short one onto the mud. On a falling arc the eye turns downward all the way, and turning counts: with the bend it keeps the
// whole pond at full strength, and the place where turn and travel cancel falls on near rippled water instead of the reed wall.
// pitch (degrees, forward) against b = metres of ground still to go to the landing at z = LAND_Z; level from the landing on.
export const LAND_Z = -80;
const HOP_TRIM = 0.89;                                    // metres cut from the start of the bend to pay for the arcs' extra length
const hopK = [[0, 0], [12, -13], [21, 14], [31, 14], [35, -14.5], [70, 12.5], [76, 0], [200, 0]];
const hopY = (() => { const out = [2.4]; for (let i = 1; i <= 400; i++) out.push(out[i - 1] - 0.25 * Math.tan(knots(hopK, (i - 0.5) * 0.25) * Math.PI / 180)); return out; })();
export const hopHeight = (b) => { const x = clamp(b, 0, 99.9) * 4, i = Math.floor(x); return hopY[i] + (hopY[i + 1] - hopY[i]) * (x - i); };
export function flightPoints() {
  const pts = [], n = swingPts.length - 1, gap = -SWING.len - LAND_Z;     // 22 m of straight ground between the bend and the landing
  // the bend's own points (1 m apart on the ground), every second one, the first trimmed so that every later beat keeps its u
  const first = n - HOP_TRIM;
  { const i0 = Math.floor(first), f = first - i0, A = swingPts[i0], B = swingPts[Math.min(n, i0 + 1)]; pts.push([A[0] + (B[0] - A[0]) * f, hopHeight(first + gap), A[1] + (B[1] - A[1]) * f]); }
  for (let i = Math.floor(first) - 1; i >= 1; i -= 2) pts.push([swingPts[i][0], hopHeight(i + gap), swingPts[i][1]]);
  for (let b = gap; b >= 2; b -= 2) pts.push([0, hopHeight(b), LAND_Z + b]);
  pts.push([0, 2.4, LAND_Z], [0, 2.4, SIT.z], [0, 2.4, RELEASE_Z + 0.4], [0, 2.4, RELEASE_Z]);
  // the jump: low, and turned a little toward the bird for the first metres (legs, neck, bill and both wings in the middle of the frame),
  // then right, up and past it, over the apex and round to the left in one long falling hook that never stops turning until the last run
  const pitchK = [[0, 0], [5, 12], [10, 22], [16, 34], [30, 26], [92, -9], [122, -34]], yawK = [[0, 0], [2, -6], [8, -6], [14, 8], [19, 19], [92, -76], [122, -109]];
  const p = new THREE.Vector3(0, 2.4, RELEASE_Z), dir = new THREE.Vector3();
  const heading = (d) => { const pi = knots(pitchK, d) * Math.PI / 180, ya = knots(yawK, d) * Math.PI / 180; return dir.set(Math.sin(ya) * Math.cos(pi), Math.sin(pi), -Math.cos(ya) * Math.cos(pi)); };
  for (let d = 0; d < 122; d += 2) { p.addScaledVector(heading(d + 1), 2); pts.push([p.x, p.y, p.z]); }
  heading(122);
  for (const s of [9, 18, 27, 35]) pts.push([p.x + dir.x * s, p.y + dir.y * s, p.z + dir.z * s]);
  return pts;
}

// ---- the rule, as GLSL shared by every material
const GATE_VERT = /* glsl */`
uniform mat4 uPVAgo;                 // projection * (view one step ago) * (pond one step ago)
uniform mat4 uPVNow;                 // projection * view * pond, now
varying vec4 vCN; varying vec4 vCA; varying vec3 vP;
void gate(vec3 pNow, vec3 pAgo) {
  vP = pNow;
  vCN = projectionMatrix * viewMatrix * modelMatrix * vec4(pNow, 1.);
  vCA = uPVAgo * vec4(pAgo, 1.);
  gl_Position = vCN;
}`;
const GATE_FRAG = /* glsl */`
uniform vec3 uField, uHaze, uAir, uCamL, uSunD, uSunC, uSkyC, uBounceC, uShadowC, uTop, uMid;
uniform float uAspect, uOpen, uDim, uTime, uWind;
uniform vec2 uRes;
uniform mat4 uPVAgo; uniform mat4 uPVNow;
varying vec4 vCN; varying vec4 vCA; varying vec3 vP;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// speed across the eye, frame heights per second
float eyeSpeed() {
  vec2 a = vCN.xy / max(vCN.w, 1e-3), b = vCA.xy / max(vCA.w, 1e-3);
  return length((a - b) * vec2(uAspect, 1.)) * 0.5 * ${(1 / DELTA).toFixed(1)};
}
float gateOf(float s) { return smoothstep(0.05, 0.15, max(s, uOpen)); }
// the dome's colour in a direction of height y (-1..1): also what the water mirrors
vec3 skyCol(float y) { return mix(mix(uAir, uMid, smoothstep(0., 0.07, y)), uTop, smoothstep(0.02, 0.42, y)); }
// one key (wrapped a little so the terminator is soft), sky from above, mud bounce from below, and a blue green shadow: never black
vec3 shade(vec3 alb, vec3 n, float occ) {
  float key = clamp(dot(n, uSunD) * 0.78 + 0.22, 0., 1.) * occ;
  return alb * (uSunC * key + uSkyC * (0.5 + 0.5 * n.y) * (0.55 + 0.45 * occ) + uBounceC * (0.5 - 0.5 * n.y) + uShadowC * (1. - key));
}
// light coming through a thin leaf or feather from behind it
vec3 thru(vec3 alb, vec3 n, vec3 v) { float t = max(dot(-n, uSunD), 0.) * (0.35 + 0.65 * max(dot(-v, uSunD), 0.)); return alb * uSunC * t; }
// haze BEFORE the gate, then the field with its slow life, then the dimming
vec3 finish(vec3 lit, float g) {
  float d = distance(vP, uCamL);
  vec3 c = mix(lit, uAir, 1. - exp2(-max(d - 50., 0.) / 480.));   // thin cool air for depth: never the field's hue
  vec2 sp = gl_FragCoord.xy / max(uRes.y, 1.);
  float m = (vn(sp * 12. + vec2(uTime * 0.36, uTime * 0.11)) + 0.5 * vn(sp * 24. - vec2(uTime * 0.2, uTime * 0.31)) - 0.75) * 0.055;
  float dim = 1. - 0.66 * uDim * smoothstep(0.28, 0.92, sp.y + 0.24 * (vn(vec2(sp.x * 3., 7.3)) - 0.5));
  return mix(uField, c, g) * (1. + m) * dim;
}`;

const WATER_FN = /* glsl */`uniform vec3 uUnder; uniform vec4 uSlot, uPort; uniform vec3 uPortN; uniform float uSlotOpen, uTrain;
      // the exit keeps the pond trembling once it has opened: waves leave a rim round it, two a second, and whatever they lift is moving,
      // so by the rule it is drawn. Returns their strength (0..1); eW = metres from the dive line, measured square to it.
      float trainAt(vec2 P, out float eW) { vec2 q = P - uSlot.xy; eW = length(vec2(dot(q, uSlot.zw) * uPort.w, q.x * uSlot.w - q.y * uSlot.z));
        return uTrain * smoothstep(6.1, 7.3, eW) * (1. - smoothstep(40., 90., eW)); }
      // where reeds stand, and how tall (0..1 of 100 m): the right wall, the near left wall, the low far-left fringe
      float reedH(vec2 p) {
        float a = smoothstep(11., 17., p.x + 3. * vn(p * 0.11)) * (1. - smoothstep(-30., -14., p.y)) * smoothstep(-275., -250., p.y);
        float c = smoothstep(0., 5., -p.x - max(16., -0.6 * p.y + 6.) + 2. * vn(p * 0.13)) * smoothstep(-92., -84., p.y) * (1. - smoothstep(-16., -9., p.y));
        float b = (1. - smoothstep(-38., -26., p.x + 4. * vn(p * 0.09))) * (1. - smoothstep(-186., -170., p.y + 5. * vn(p.yx * 0.07)));
        return max(max(a, c), 0.5 * b); }
      // at frog scale a ripple is a fast thing (no water wave runs slower than 14 m/s here): the wind's ripples travel
      float wave(vec2 p, float t) { return vn(p * 0.9 + vec2(t * 2.1, t * 1.2)) * 0.6 + vn(p * 2.3 - vec2(t * 7.4, t * 4.1)) * 0.25 + vn(p * 0.21 + vec2(t * 0.2, -t * 0.16)) * 0.5; }
      vec3 waterLook(vec3 P, vec3 v, float depth) {
        // a rippled mirror: the normal from three taps of a moving height, calmer far away so it never sparkles into noise
        float amp = (0.10 + 0.16 * uWind) / (1. + depth * 0.02), h0 = wave(P.xz, uTime);
        vec3 n = normalize(vec3((h0 - wave(P.xz + vec2(0.35, 0.), uTime)) * amp * 2.9, 1., (h0 - wave(P.xz + vec2(0., 0.35), uTime)) * amp * 2.9));
        vec3 r = reflect(-v, n); r.y = abs(r.y) + 0.004;
        vec3 rc = reflect(-v, normalize(mix(vec3(0., 1., 0.), n, 0.3))); rc.y = abs(rc.y) + 0.004;   // the walls are mirrored more calmly than the sky
        float rl = max(length(rc.xz), 1e-3), slope = rc.y / rl; vec2 rd = rc.xz / rl;
        float fres = 1. - max(dot(v, n), 0.); fres = fres * fres; fres = 0.06 + 0.94 * fres * (0.4 + 0.6 * fres);
        vec3 sky = skyCol(r.y);
        // the reed walls stand in it upside down: five looks along the mirrored ray (plain arithmetic, no texture)
        float cov = 0., hf = 0.; vec2 hit = P.xz;
        float jit = 0.75 + 0.5 * vn(P.xz * 0.6 + 3.7);
        for (int i = 0; i < 7; i++) { float fi = float(i), d = (3. + fi * fi * 3.1 + fi * 3.) * jit; vec2 w = P.xz + rd * d;
          float H = reedH(w) * 100., k = (1. - smoothstep(H * 0.6, H + 0.5, d * slope)) * smoothstep(1., 30., H) * (1. - cov);
          hf += k * clamp(d * slope / max(H, 1.), 0., 1.); hit += k * rd * d; cov += k; }
        // a stem is upright, so in the mirror it runs along the line of sight: stripe by the bearing of the mirrored ray
        float az = atan(-v.x, v.z + 1e-5) + (h0 - 0.67) * 0.034 / (1. + depth * 0.03),   // polish 1: each ripple shifts the mirrored stems sideways: dashes that shiver, not smears
           st = vn(vec2(az * 170., 2.3)) * 0.55 + vn(vec2(az * 520., 7.9)) * 0.45, hh = hf / max(cov, 1e-3);
        vec3 reedC = mix(vec3(0.035, 0.07, 0.02), mix(vec3(0.17, 0.27, 0.06), vec3(0.74, 0.6, 0.17), smoothstep(0.3, 0.9, hh)), smoothstep(0.0, 0.28, hh));
        reedC *= (0.3 + 1.3 * st * st) * (0.8 + 0.3 * dot(uSunC, vec3(0.33)));
        float brk = 1. - 0.72 * smoothstep(0.66, 0.92, h0) / (1. + depth * 0.012);              // and every crest turns its face to the sky
        vec3 refl = mix(sky * 0.92, reedC, cov * (0.82 + 0.16 * st) * brk);
        // under the mirror: brown green shallows near us, where we look down into it
        vec3 body = mix(uUnder * 0.5, vec3(0.16, 0.15, 0.07), 0.45) * (0.7 + 0.5 * h0);
        vec3 c = mix(body, refl, fres);
        c = mix(c, c * vec3(0.5, 0.62, 0.55), reedH(P.xz) * 0.55);
        vec3 hv = normalize(v + uSunD + vec3(0., 2e-3, 0.)); float sp = max(dot(n, hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        c += uSunC * sp * (0.2 + 1.9 * smoothstep(0.7, 0.95, vn(P.xz * 4.7 + vec2(uTime * 0.7, uTime * 0.45)))) * 0.75;   // the sun's road is glitter, not a white sheet
        return c; }`;

function gateMaterial(G, { vert, frag, uniforms = {}, side = THREE.FrontSide, transparent = false, depthWrite = true }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...G, ...uniforms }, side, transparent, depthWrite,
    vertexShader: GATE_VERT + vert, fragmentShader: 'precision highp float;\n' + GATE_FRAG + frag,
  });
}

// looks by variant: A grey heron in early gold, B great egret under thin overcast (mirrored), C purple heron at evening.
// fieldLin is the linear value that lands on the brief's field colour after the engine's tone map and grade (measured).
const LOOKS = [
  { field: '#D9D49A', fieldLin: [0.76, 0.694, 0.212], sunD: [-0.62, 0.31, 0.72], sunC: '#FFE9B8', sunI: 2.6, skyTop: '#A9C7D6', zen: '#4F8FD2', haze: '#EFE3B4', skyI: 0.5,
    bird: { body: '#8E9AA6', neck: '#F2F0E6', dark: '#23262B', bill: '#F0B030', leg: '#D6B548' } },
  { field: '#D3D6B4', fieldLin: [0.688, 0.73, 0.353], sunD: [-0.4, 0.75, 0.52], sunC: '#F6F2E2', sunI: 1.5, skyTop: '#C3CDD2', zen: '#9FB4C8', haze: '#E9E8D8', skyI: 0.95,
    bird: { body: '#F4F2EA', neck: '#FBFAF4', dark: '#E6E3D8', bill: '#E8B23C', leg: '#1E1F22' } },
  { field: '#DDC98E', fieldLin: [0.815, 0.552, 0.183], sunD: [0.5, 0.14, -0.855], sunC: '#FFC078', sunI: 2.9, skyTop: '#AEB9D0', zen: '#6E82C0', haze: '#F4D7A2', skyI: 0.55,
    bird: { body: '#7A6A7E', neck: '#B5713F', dark: '#2A2230', bill: '#D9A441', leg: '#A88F4E' } },
];

export async function buildFrogEye(ctx, o) {
  const { path, variant, mir, rare } = o;
  const look = LOOKS[variant], detail = o.detail || (ctx.quality ? (ctx.quality.detail || 1) : 1), density = o.density || 1;
  const rng = ctx.rng.fork ? ctx.rng.fork('frog-eye') : ctx.rng;
  const clock = makeClock(o.pace, o.duration);
  const pond = new THREE.Group(); pond.scale.x = mir; o.scene.add(pond);
  const sunD = new THREE.Vector3(...look.sunD).normalize();
  const K = 0.42;                                         // overall exposure of the lit pond under the engine's tone map
  const G = {                                             // shared by every material: the rule's uniforms
    uPVAgo: { value: new THREE.Matrix4() }, uPVNow: { value: new THREE.Matrix4() }, uField: { value: new THREE.Color().setRGB(...look.fieldLin) },
    uHaze: { value: lin(look.haze) }, uAir: { value: lin(look.haze).lerp(lin(look.zen), 0.55) }, uUnder: { value: lin('#5F7F78') }, uCamL: { value: new THREE.Vector3() }, uCamAgoL: { value: new THREE.Vector3() },
    uSunD: { value: sunD }, uSunC: { value: lin(look.sunC).multiplyScalar(look.sunI * K) },
    uSkyC: { value: lin(look.skyTop).multiplyScalar(look.skyI * K * 2.2) }, uShadowC: { value: lin('#4E6B66').multiplyScalar([0.34, 0.3, 0.62][variant] * K) }, uTop: { value: lin(look.zen) }, uMid: { value: lin(look.skyTop) }, uBounceC: { value: lin('#6B5A3E').multiplyScalar(0.15 * K * 3) },
    uSlot: { value: new THREE.Vector4(0, 0, 1, 0) }, uPort: { value: new THREE.Vector4(0, -900, 0, 0.36) }, uPortN: { value: new THREE.Vector3(0, 0, -1) }, uSlotOpen: { value: 0 }, uTrain: { value: 0 },
    uAspect: { value: 16 / 9 }, uWind: { value: 1 }, uOpen: { value: 1 }, uDim: { value: 0 }, uTime: { value: 0 }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
  };
  const add = (mesh, order = 0) => { mesh.frustumCulled = false; mesh.renderOrder = order; pond.add(mesh); return mesh; };

  // ---- sky: a plain dome carried on the eye. It turns with us or it is not there. Below the horizon it wears the water's tone,
  // so the lower half of the previous world's portal is never empty.
  const skyM = gateMaterial(G, {
    uniforms: { uLow: { value: lin('#7E9C96') } }, side: THREE.DoubleSide, depthWrite: false,
    vert: /* glsl */`uniform vec3 uCamL, uCamAgoL; varying vec3 vDir;
      void main() { vDir = position; gate(uCamL + position * 1500., uCamAgoL + position * 1500.); }`,
    frag: /* glsl */`uniform vec3 uLow; varying vec3 vDir;
      vec3 finishSky(vec3 c, float g) { vec2 sp = gl_FragCoord.xy / max(uRes.y, 1.);
        float m = (vn(sp * 12. + vec2(uTime * 0.36, uTime * 0.11)) + 0.5 * vn(sp * 24. - vec2(uTime * 0.2, uTime * 0.31)) - 0.75) * 0.055;
        float dim = 1. - 0.66 * uDim * smoothstep(0.28, 0.92, sp.y + 0.24 * (vn(vec2(sp.x * 3., 7.3)) - 0.5));
        return mix(uField, c, g) * (1. + m) * dim; }
      void main() { float y = vDir.y / max(length(vDir), 1e-4);
        vec3 d = vDir / max(length(vDir), 1e-4);
        vec3 c = skyCol(y); float sn = max(dot(d, uSunD), 0.);
        c += uSunC * (0.05 * sn * sn + 0.1 * sn * sn * sn * sn * sn * sn) * (1. - smoothstep(0.1, 0.6, y));   // the air is a little warmer toward the sun
        c = mix(c, mix(uAir, uLow, (1. - smoothstep(-0.25, 0., y))), step(y, 0.));
        gl_FragColor = vec4(finishSky(c, gateOf(eyeSpeed())), 1.); }`,
  });
  skyM.depthTest = false;
  const sky = add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), skyM), -10);

  // ---- water: one opaque plane; darker under the reeds; a floor for the rings; an elliptical slot over the exit
  // RINGS. Each source: uRing = (x, z, age in seconds, strength), uRingB = (wavelength m, its growth per second, life s, crests in the train).
  // A ring is a short train of crest and trough LINES behind a front that runs at 14 m/s. The wavelength is never allowed under
  // nine 450ths of the frame height on screen, so every ring is drawn as clean nested ellipses at any distance, never a smear.
  const NR = 12, rings = [], ringsB = []; for (let i = 0; i < NR; i++) { rings.push(new THREE.Vector4(0, 0, -1, 0)); ringsB.push(new THREE.Vector4(2, 0.5, 3, 3)); }
  const RING_GLSL = /* glsl */`uniform vec4 uRing[${NR}]; uniform vec4 uRingB[${NR}];
      // signed line strength at a point of the water: + crest, - trough. dPx, dPy: metres of water per 450th of the frame height
      float ringLines(vec2 P, vec2 dPx, vec2 dPy, out float win) { float f = 0.; win = 0.;
        for (int i = 0; i < ${NR}; i++) { vec4 rg = uRing[i], rb = uRingB[i]; vec2 q = P - rg.xy; float dist = length(q), age = max(rg.z, 0.);
          vec2 rd = q / max(dist, 1e-3);
          float lam = max(rb.x + rb.y * age, 9. * (abs(dot(rd, dPx)) + abs(dot(rd, dPy))));
          float p = (14. * age - dist) / max(lam, 1e-3), nC = max(rb.w, 1.);
          float env = smoothstep(-0.02, 0.2, p) * (1. - smoothstep(nC - 0.7, nC, p)) * (1. - 0.55 * clamp(p / nC, 0., 1.));
          float am = rg.w * step(0., rg.z) * smoothstep(0., 0.1, age) * (1. - smoothstep(0.25 * rb.z, rb.z, age));
          float a = cos(6.2832 * (p - 0.3));
          win = max(win, am * smoothstep(-0.03, 0.22, p) * (1. - smoothstep(0.35 * nC, nC + 0.9, p)));
          f += am * env * (smoothstep(0.3, 0.78, a) - smoothstep(0.3, 0.78, -a)); }
        return f; }`;
  const waterM = gateMaterial(G, {
    uniforms: { uRing: { value: rings }, uRingB: { value: ringsB } },
    side: THREE.DoubleSide,
    vert: /* glsl */`void main() { gate(position, position); }`,
    frag: WATER_FN + RING_GLSL + /* glsl */`
      void main() {
        // the exit lies under the water: the surface is cut away exactly where it would hide the portal from this eye, and nowhere else
        vec3 ray = vP - uCamL; float dn = dot(ray, uPortN);
        if (dn > 1e-4) { float tt = dot(uPort.xyz - uCamL, uPortN) / dn; if (tt > 0.98 && distance(uCamL + ray * tt, uPort.xyz) < 5.05 * uSlotOpen) discard; }
        vec3 v = normalize(uCamL - vP + vec3(0., 1e-3, 0.));
        float depth = max(distance(vP, uCamL), 0.3);
        vec3 c = waterLook(vP, v, depth);
        float eW, tA = trainAt(vP.xz, eW), sT = max(tA, uTrain * (1. - smoothstep(5., 7.3, eW))) * 14. / (depth * 1.2);
        float sW = uWind * 14. / (depth * 1.2);                     // while the wind blows its ripples travel: near water is moving water
        float g = gateOf(max(max(eyeSpeed(), sT), sW));
        float gR = smoothstep(0.05, 0.15, 14. / (depth * 1.2)), pk = max(uRes.y, 1.) / 450., win;
        float f = ringLines(vP.xz, dFdx(vP.xz) * pk, dFdy(vP.xz) * pk, win) * gR;
        // the water a ring is passing through is moving water: inside the train it is seen as it is (sky, the mirrored reeds, glitter),
        // and it goes back to the field as the train dies. Outside a ring, still water is exactly the field.
        g = max(g, clamp(win, 0., 1.) * gR);
        vec3 col = finish(c, g);
        float lamT = max(4.5, 9. * (abs(dFdx(eW)) + abs(dFdy(eW))) * pk), aT = cos(6.2832 * ((eW - 6.4) / lamT - uTime * 2.));
        float fT = tA * smoothstep(0.05, 0.15, sT) * (1. - 0.55 * smoothstep(0., 30., eW - 6.4)) * (smoothstep(0.3, 0.78, aT) - smoothstep(0.3, 0.78, -aT));
        f += fT * 0.72;                                              // seen water stays water: the exit's waves are glints and shadows on it, not stripes
        vec2 sp = gl_FragCoord.xy / max(uRes.y, 1.);
        float dimK = 1. - 0.66 * uDim * smoothstep(0.28, 0.92, sp.y + 0.24 * (vn(vec2(sp.x * 3., 7.3)) - 0.5));
        // on the blank field a crest is pale light and a trough a soft olive line; on seen water they are the sky's glint and its shadow
        vec3 crest = mix(uField * 1.2 + vec3(0.5, 0.48, 0.36), c * 1.22 + skyCol(0.3) * 0.26, g) * dimK;
        vec3 trough = mix(uField * vec3(0.4, 0.48, 0.5), c * 0.68, g) * dimK;
        col = mix(col, crest, clamp(f, 0., 1.));
        col = mix(col, trough, clamp(-f, 0., 1.) * 0.9);
        // the lip of the exit takes the sun: one warm line, a few pixels wide at any distance
        float wpx = max(0.22, 1.6 * (abs(dFdx(eW)) + abs(dFdy(eW)))), rim = (1. - smoothstep(0.5 * wpx, wpx, abs(eW - 6.5))) * uTrain;
        col = mix(col, uSunC * 1.3 * dimK, rim * 0.85);
        gl_FragColor = vec4(col, 1.); }`,
  });
  add(new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1).rotateX(-Math.PI / 2).translate(0, 0, -150), waterM));
  await ctx.yield();

  // ---- a small mesh builder: positions, normals, colours (and a spare vec2) pushed by hand, one geometry at the end
  const MB = () => {
    const P = [], N = [], C = [], X = [], I = [];
    const v = (x, y, z, nx, ny, nz, c, a = 0, b = 0) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c.r, c.g, c.b); X.push(a, b); return P.length / 3 - 1; };
    const tri = (a, b, c) => I.push(a, b, c);
    // a tube through points pts (Vector3), radius r(i), colour c(i); sides round; extra(i) -> [a, b]
    const tube = (pts, r, c, sides = 6, extra = null, cap = true, flat = 1) => {
      const t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3(), ref = new THREE.Vector3(0, 0, 1);
      const first = P.length / 3;
      for (let i = 0; i < pts.length; i++) {
        t.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        if (Math.abs(t.dot(ref)) > 0.95) ref.set(1, 0, 0);
        n.crossVectors(t, ref).normalize(); b.crossVectors(t, n).normalize();
        const e = extra ? extra(i) : [0, 0], ri = r(i), ci = c(i);
        for (let s = 0; s < sides; s++) { const a = s / sides * Math.PI * 2, cx = Math.cos(a), sx = Math.sin(a);
          const nx = n.x * cx + b.x * sx, ny = n.y * cx + b.y * sx, nz = n.z * cx + b.z * sx, fx = n.x * cx * flat + b.x * sx, fy = n.y * cx * flat + b.y * sx, fz = n.z * cx * flat + b.z * sx;
          v(pts[i].x + fx * ri, pts[i].y + fy * ri, pts[i].z + fz * ri, nx, ny, nz, ci, e[0], e[1]); }
      }
      for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s < sides; s++) { const a = first + i * sides + s, b2 = first + i * sides + (s + 1) % sides; tri(a, a + sides, b2); tri(b2, a + sides, b2 + sides); }
      if (cap) for (const end of [0, pts.length - 1]) { const p = pts[end], k = v(p.x, p.y, p.z, 0, end ? 1 : -1, 0, c(end)); for (let s = 0; s < sides; s++) { const a = first + end * sides + s, b2 = first + end * sides + (s + 1) % sides; if (end) tri(a, k, b2); else tri(b2, k, a); } }
    };
    // an ellipsoid at centre, radii (rx, ry, rz), rotated by matrix m (optional), colour by (unit normal) => Color
    const blob = (cx, cy, cz, rx, ry, rz, cf, seg = 12, m = null) => {
      const first = P.length / 3, rows = Math.max(4, seg >> 1), p = new THREE.Vector3(), q = new THREE.Vector3();
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) { const th = j / rows * Math.PI, ph = i / seg * Math.PI * 2;
        q.set(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); p.set(q.x * rx, q.y * ry, q.z * rz);
        const col = cf(q); q.set(q.x / rx, q.y / ry, q.z / rz).normalize(); if (m) { p.applyMatrix4(m); q.transformDirection(m); }
        v(cx + p.x, cy + p.y, cz + p.z, q.x, q.y, q.z, col); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = first + j * (seg + 1) + i, b2 = a + seg + 1; tri(a, a + 1, b2); tri(a + 1, b2 + 1, b2); }
    };
    const geo = () => { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aX', new THREE.Float32BufferAttribute(X, 2)); g.setIndex(I); return g; };
    // a lily pad: rings from the middle to an upturned rim, a notch left open. aX = (2 + 0.9 * radius fraction, angle) for the veins
    const padAt = (x, z, r, rot, cc, y = 0.07) => { const S = 20, RR = [0.03, 0.5, 0.88, 1.0], first = P.length / 3;
      for (let j = 0; j < 4; j++) for (let i = 0; i <= S; i++) { const a = rot + 0.22 + i / S * (Math.PI * 2 - 0.44), rr = r * RR[j] * (0.95 + 0.05 * Math.sin(i * 2.1 + rot * 3)), tl = j === 3 ? -0.5 : 0;
        v(x + Math.sin(a) * rr, y + (j === 3 ? 0.12 : j === 2 ? 0.02 : 0), z + Math.cos(a) * rr, Math.sin(a) * tl, 1, Math.cos(a) * tl, cc, 2 + 0.9 * RR[j], a - rot); }
      for (let j = 0; j < 3; j++) for (let i = 0; i < S; i++) { const a = first + j * (S + 1) + i, b = a + S + 1; tri(a, a + 1, b); tri(a + 1, b + 1, b); } };
    // a petal: grows from (bx,by,bz) outward along azimuth az, starting at elevation el and curling by curl radians; cupped. aX = (5, t)
    const petal = (bx, by, bz, az, el, L, W, curl, c0, c1, cup = 0.35) => { const ox = Math.sin(az), oz = Math.cos(az), sx = oz, sz = -ox, R = 7, first = P.length / 3;
      let px = bx, py = by, pz = bz; const col = new THREE.Color();
      for (let i = 0; i <= R; i++) { const t = i / R, e = el - curl * t, ce = Math.cos(e), se = Math.sin(e), nx = -ox * se, ny = ce, nz = -oz * se;
        const w = W * (Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.92 + 0.08 * (1 - t)) * (i === R ? 0.0 : 1), k = cup * w; col.copy(c0).lerp(c1, t);
        v(px - sx * w + nx * k, py + ny * k, pz - sz * w + nz * k, nx + sx * 0.6, ny, nz + sz * 0.6, col, 5, t);
        v(px, py, pz, nx, ny, nz, col, 5.2, t);
        v(px + sx * w + nx * k, py + ny * k, pz + sz * w + nz * k, nx - sx * 0.6, ny, nz - sz * 0.6, col, 5.4, t);
        px += ox * ce * L / R; py += se * L / R; pz += oz * ce * L / R; }
      for (let i = 0; i < R; i++) { const a = first + i * 3; tri(a, a + 1, a + 3); tri(a + 1, a + 4, a + 3); tri(a + 1, a + 2, a + 4); tri(a + 2, a + 5, a + 4); } };
    return { v, tri, tube, blob, padAt, petal, geo, count: () => P.length / 3 };
  };

  // ---- still things in one mesh: the mud spit, the far bank, lily pads, the bent rush, the dark bed under the exit.
  // aX.x = 1 marks mud (grain and wet shine).
  const still = MB(), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const mudC = lin('#6B5A3E'), n2 = (x, z) => ctx.noise.n2(x, z);
  // mud: a rounded bar 0.9 m high, sloping under the water at its edges. Beside the sit the water comes in as a bay to within 3 m of us on the
  // left, so the pond's unseen surface fills the lower left of the sit's frame: that is where the rings are drawn.
  const bayX = (z) => 2.4 * sst(-67, -77, z);
  const mudAt = (x, z) => { const dx = Math.max(bayX(z) - x, x - (25 - 5), 0), dz = Math.max(-132 + 5 - z, z - (-64 - 5), 0), d = Math.hypot(dx, dz) - 5;
    return lerp(-0.6, 0.9, sst(2.2, -3.2, d + 1.2 * n2(x * 0.09, z * 0.09))) + 0.07 * n2(x * 0.5, z * 0.5) * sst(1, -3, d); };
  const strikeAt = V3(-1.3, 0.9, SIT.z - 11.5); strikeAt.y = mudAt(strikeAt.x, strikeAt.z) - 0.2;   // where the bill goes in: the wet bank we sat on
  {
    const X0 = -10, X1 = 30, Z0 = -138, Z1 = -59, NX = 70, NZ = 130, hAt = mudAt;
    const first = still.count();
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = lerp(X0, X1, i / NX), z = lerp(Z0, Z1, j / NZ), h = hAt(x, z), e = 0.3;
      const nx = hAt(x - e, z) - hAt(x + e, z), nz = hAt(x, z - e) - hAt(x, z + e), l = Math.hypot(nx, 2 * e, nz);
      still.v(x, h, z, nx / l, 2 * e / l, nz / l, mudC, 1, 0); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = first + j * (NX + 1) + i, b = a + NX + 1; still.tri(a, b, a + 1); still.tri(a + 1, b, b + 1); }
  }
  await ctx.yield();
  { // far bank: a low line of alder all round, 30 m high, 430 m out
    const bankC = lin('#5E7A4E'), bankD = lin('#3A5238'), S = 720, first = still.count();
    for (let i = 0; i <= S; i++) { const a = i / S * Math.PI * 2, x = Math.sin(a) * 370, z = SIT.z + Math.cos(a) * 370, top = 25 + 7 * n2(i * 0.06, 3.1) + 7 * Math.abs(n2(i * 0.23, 9.2)) + 4.5 * Math.abs(Math.sin(i * 0.9 + 3 * n2(i * 0.11, 5.5)));
      still.v(x, -1, z, -Math.sin(a), 0.2, -Math.cos(a), bankD, 4, 0); still.v(x, top, z, -Math.sin(a), 0.5, -Math.cos(a), bankC, 4, 1); }
    for (let i = 0; i < S; i++) { const a = first + i * 2; still.tri(a, a + 2, a + 1); still.tri(a + 1, a + 2, a + 3); }
  }
  // the exit: where the dive line meets the water (pond-local), and its heading on the water
  const endL = path.end.clone(); endL.x *= mir; endL.z -= CARRY_END;
  const endT = path.endTangent.clone(); endT.x *= mir;
  const slotC = endL.clone().addScaledVector(endT, -endL.y / Math.min(-0.05, endT.y)), slotA = new THREE.Vector2(endT.x, endT.z).normalize();
  G.uSlot.value.set(slotC.x, slotC.z, slotA.x, slotA.y); G.uPort.value.set(endL.x, endL.y, endL.z, Math.max(0.05, -endT.y)); G.uPortN.value.copy(endT).normalize();
  { // the pool over the exit: a skin of moving light on the water we dive through. The next world is seen through it; nets of sun
    // slide across it and a soft green glow hugs its lip. It is light in motion, so by the rule it is drawn. Added, never covering.
    const filmM = new THREE.ShaderMaterial({ uniforms: { uTime: G.uTime, uSlotOpen: G.uSlotOpen, uSunC: G.uSunC }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vQ; varying vec3 vW; void main() { vQ = position.xy; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`precision highp float; uniform float uTime, uSlotOpen; uniform vec3 uSunC; varying vec2 vQ; varying vec3 vW;
        float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main() { float r = length(vQ) / 5.05, t = uTime;
          vec2 q = vQ * 0.9 + 0.35 * vec2(vn(vQ * 0.4 + t * 0.21), vn(vQ * 0.4 + 7.3 - t * 0.17));
          float a = vn(q + vec2(t * 0.33, t * 0.21)), b = vn(q * 1.9 - vec2(t * 0.27, t * 0.41) + 3.1);
          float net = 1. - smoothstep(0.0, 0.06, abs(a - b)); net *= 0.25 + 0.75 * vn(q * 0.7 - t * 0.1);
          float lip = smoothstep(0.55, 1., r); lip *= lip;
          float edge = 1. - smoothstep(0.93, 1., r);
          vec3 c = uSunC * vec3(0.8, 1.0, 0.85) * net * 0.2 + vec3(0.02, 0.12, 0.1) * lip * 0.6 + vec3(0.008, 0.024, 0.022);
          float near = smoothstep(2.5, 9., distance(vW, cameraPosition));
          gl_FragColor = vec4(c * edge * uSlotOpen * near, 1.); }`,
    });
    const film = new THREE.Mesh(new THREE.CircleGeometry(5.05, 40), filmM);
    film.position.copy(endL).addScaledVector(endT, -0.25); film.lookAt(endL.clone().addScaledVector(endT, -10)); add(film, 3);
    // a dark collar of deep water just behind the exit's edge, so no sliver of blank shows between the pool's lip and the way out
    const collar = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.9, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.05, 0.045), side: THREE.DoubleSide }));
    collar.position.copy(endL).addScaledVector(endT, 0.3); collar.lookAt(endL.clone().addScaledVector(endT, -10)); add(collar, 0);
  }
  { // the dark bed under the exit, wide enough to meet the horizon when we are under the surface
    const bedC = lin('#4E7A6C'), first = still.count(), S = 24; still.v(endL.x, -14, endL.z, 0, 1, 0, bedC);
    for (let i = 0; i <= S; i++) { const a = i / S * Math.PI * 2; still.v(endL.x + Math.sin(a) * 1000, -14, endL.z + Math.cos(a) * 1000, 0, 1, 0, bedC); }
    for (let i = 0; i < S; i++) still.tri(first, first + 1 + i, first + 2 + i);
  }
  { // lily pads: a raft round the exit slot with a row down each side of it, and three with buds near the entry on the left
    const padC = lin('#5E8A46'), padD = lin('#4C7440'), bud = lin('#D9A9B8'), pr = rng.fork ? rng.fork('pads') : rng, S = 14;
    const pad = (x, z, r, rot) => still.padAt(x, z, r, rot, pr() < 0.5 ? padC : padD);
    const side = new THREE.Vector2(-slotA.y, slotA.x);
    const sepal = lin('#5E8A46'), pinkD = lin('#D8718A'), pinkL = lin('#F6C9D2');
    var budAt = (x, y, z, sc, ph) => { for (let k = 0; k < 3; k++) still.petal(x, y, z, ph + k * 2.094, 1.3, 0.95 * sc, 0.34 * sc, -0.5, sepal, sepal, 0.5);
      for (let k = 0; k < 5; k++) still.petal(x, y + 0.05 * sc, z, ph + 0.6 + k * 1.2566, 1.36, 1.55 * sc, 0.42 * sc, -0.62, pinkD, pinkL, 0.55); };
    for (let i = 0; i < 12; i++) for (const sg of [-1, 1]) { const al = -34 + i * 9.6 + pr() * 2, of = sg * (10.5 + pr() * 2.5);
      pad(slotC.x + slotA.x * al + side.x * of, slotC.z + slotA.y * al + side.y * of, 4.2 + pr() * 0.6, pr() * 6.28); }
    for (let i = 0; i < 16; i++) { const al = -40 + pr() * 90, of = (pr() < 0.5 ? -1 : 1) * (21 + pr() * 22);
      pad(slotC.x + slotA.x * al + side.x * of, slotC.z + slotA.y * al + side.y * of, 3.6 + pr() * 1.2, pr() * 6.28); }
    for (const [x0, z] of [[-7, -15], [-11, -27], [-6.5, -38]]) { const x = x0 + swingX(z); pad(x, z, 3.2, pr() * 6.28);
      still.tube([V3(x + 1, 0, z), V3(x + 1.2, 2.2, z + 0.2), V3(x + 1.1, 4.2, z + 0.1)], (i) => 0.16, () => padD, 6, (i) => [3, i / 2]);
      budAt(x + 1.1, 4.2, z + 0.1, 0.9, x * 1.7); }
  }
  // the bent rush, 6.5 m to our right: the damselfly's perch
  const rushTip = V3(7.2, 7.2, -93);
  { const rc = lin('#7E9A4A'), rs = lin('#C9B65E'), pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(V3(9 - 1.8 * t * t, 0.8 + 9.5 * t - 3.1 * t * t * t, -88.5 - 4.5 * t * t)); }
    rushTip.copy(pts[10]); still.tube(pts, (i) => 0.22 - 0.014 * i, (i) => (i > 6 ? rs : rc), 6, (i) => [3, i / 10]); }
  await ctx.yield();
  // polish 1b: THE BIRD'S WINDOW. At the door (u 0, the picture seen through the previous portal) and on the first still (u 0.02) the
  // heron must stand whole in the gap, legs and all: nothing nearer than it may stand within W degrees of its bearing from either place.
  const winC = [0, 0.02].map((uu) => { const q = path.pointAt(uu, V3()); return [q.x * mir, q.z]; }), winH = [-36, -150];
  const inWin = (x, z, W) => { for (const [cx, cz] of winC) { const dz = cz - z; if (dz < 3 || dz > cz - winH[1] + 4) continue;
      if (Math.abs(Math.atan2(x - cx, dz) - Math.atan2(winH[0] - cx, cz - winH[1])) * 57.3 < W) return true; } return false; };
  { // the approach: things near enough on BOTH sides and overhead to stream past at 13 m/s, so that fast = a full frame.
    // Sedge blades arch over the channel from each side, lilies stand in the water beside the path. All are behind us at the sit.
    const nr = rng.fork ? rng.fork('near') : rng, gA = lin('#4F8A2E'), gB = lin('#86A83C'), gS = lin('#C9B65E'), padC = lin('#5E8A46'), padD = lin('#487A3C');
    const petal = lin('#F2B8C6'), petalD = lin('#E88C9A'), gold = lin('#E8C24A'), pts = [], e0 = flightPoints()[0];
    for (let i = 0; i < 44; i++) { const sg = i % 2 ? 1 : -1, z = -22 - i * 1.32 - nr() * 1.4, far = nr(), cross = nr() < 0.6;
      const xr = sg * (6 + 8 * far * far + (z < -62 && sg < 0 ? 2.5 : 0)), xt = cross ? -sg * (0.5 + 4.5 * nr()) : sg * (1 + 3 * nr()), H = 10 + 10 * nr(), dz = (nr() - 0.5) * 14, y0 = (sg > 0 && z < -66) ? 0.85 : 0;
      const ox = swingX(z), az = (Math.atan2(xr * 0.6 + xt * 0.4 + ox - e0[0], -(z - e0[2])) - Math.atan2(-36 - e0[0], 150 + e0[2])) * 57.3, droop = 1 + 3 * nr(); if (Math.abs(az) < 5.5) continue;      // leave the heron's window clear at the entry
      if (inWin(ox + xr, z, 4.5) || inWin(ox + xt, z + dz, 4.5) || inWin(ox + xr + (xt - xr) * 0.42, z + dz * 0.36, 4.5)) { nr(); nr(); continue; }   // (polish 1b: root, middle and tip, from both places)
      pts.length = 0; for (let j = 0; j <= 12; j++) { const t = j / 12; pts.push(V3(ox + xr + (xt - xr) * Math.pow(t, 1.7), y0 + H * t * (2 - t) - droop * t * t * t * t, z + dz * t * t)); }
      const r0 = 0.17 + 0.1 * nr(), ca = nr() < 0.5 ? gA : gB;
      still.tube(pts, (j) => r0 * 1.7 * (1 - 0.068 * j), (j) => (j > 8 ? gS : ca), 6, (j) => [3, j / 12], true, 0.3); }
    await ctx.yield();
    const white = lin('#FBEFEA');
    const lily = (x, z, h, open) => { const cc = nr() < 0.5 ? padC : padD, rot = nr() * 6.28, r = 2.2 + 1.2 * nr(); still.padAt(x, z, r, rot, cc);
      const sx = x + r * 0.8, lean = (nr() - 0.5) * 0.8, fx = sx + lean, ph = x * 1.3 + z * 0.7;
      still.tube([V3(sx, 0, z), V3(sx + lean * 0.35, h * 0.3, z + 0.06), V3(sx + lean * 0.75, h * 0.7, z + 0.08), V3(fx, h, z)], (i) => 0.17 - 0.012 * i, () => padD, 6, (i) => [3, i / 3]);
      bloom(fx, h, z, ph, open); };
    const bloom = (fx, h, z, ph, open) => {
      if (!open) { budAt(fx, h, z, 0.95, ph); return; }
      for (let k = 0; k < 4; k++) still.petal(fx, h, z, ph + k * 1.5708, 0.2, 1.1, 0.5, 0.5, padC, padD, 0.3);
      for (let k = 0; k < 9; k++) still.petal(fx, h + 0.05, z, ph + k * 0.698, 0.42, 1.75, 0.5, 0.25, white, petal, 0.4);
      for (let k = 0; k < 8; k++) still.petal(fx, h + 0.12, z, ph + 0.35 + k * 0.785, 0.88, 1.5, 0.46, 0.3, white, petalD, 0.45);
      for (let k = 0; k < 6; k++) still.petal(fx, h + 0.18, z, ph + k * 1.047, 1.3, 1.1, 0.36, 0.25, petal, petalD, 0.5);
      still.blob(fx, h + 0.45, z, 0.34, 0.3, 0.34, () => gold, 8); };
    { const sd = new THREE.Vector2(-slotA.y, slotA.x);                                                          // and a garland of them round the pool we dive into
      for (const [al, of, h, open] of [[-13, 8.6, 3.0, 1], [-6, -8.4, 3.6, 0], [1, 9.0, 4.2, 1], [8, -8.8, 4.6, 1], [14, 8.2, 3.6, 0], [19, -6.5, 3.0, 1], [23, 3.5, 3.4, 1], [22, -1.5, 2.4, 0], [-20, -9.5, 3.2, 1], [5, -13.5, 3.4, 0], [10, 13.0, 3.8, 1], [3.5, -6.8, 1.5, 1], [6, 6.6, 1.7, 1], [13, -3.6, 1.9, 0],
        [16, 2.5, 0.7, 1], [18, -3, 0.6, 1], [21, 0.5, 0.8, 1], [15, -6.5, 0.7, 1], [14, 6.8, 0.6, 1], [9, -7.2, 0.7, 1], [8, 7.4, 0.6, 1], [25, -5, 0.9, 1], [26, 4.5, 0.8, 1]])   // the low ones float: they are what the last look down holds
        lily(slotC.x + slotA.x * al + sd.x * of, slotC.z + slotA.y * al + sd.y * of, h, !!open); }
    for (let i = 0; i < 38; i++) { const z = -8 - i * 2.0 - nr() * 1.5, right = i % 3 === 1 && z > -58, x = right ? 3.5 + 7 * nr() : -(3.6 + 9 * nr()) - (z < -60 ? 3.5 : 0);
      if (Math.abs(x + 8.5) < 5 && z > -40 && z < -12) { nr(); nr(); nr(); nr(); nr(); continue; }                 // the three entry buds live here
      let lx = x + swingX(z); for (let k = 0; k < 5 && inWin(lx, z, 6.5); k++) lx += right ? 4 : -4;                  // polish 1b: none in front of the bird at the door
      lily(lx, z, 2.6 + 3.2 * nr(), nr() < 0.45); }
    // polish 1b: three lean in from the left of the sit. Their pads and feet stand outside the frame (left of its edge as seen from the
    // sit), so no still stem or pad can cut a notch into a ring; their heads hang in the left sixth of the frame, clear of the lane the
    // heron's legs come down, and (seen from the landing at u 0.25) to the left of the standing bird. Still, so not there; in the wind's last breath (u 0.334 to 0.349) each is there as far as it nods:
    // the flower whole, the stem fading to nothing toward its still foot.
    for (const [px, z, fx, h, open, r] of [[-12, -90, -7.2, 3.9, 1, 2.4], [-19.5, -97, -14.5, 7.0, 0, 2.4], [-16.5, -93, -11.5, 5.6, 0, 2.0]]) {
      still.padAt(px, z, r, px * 1.9, px < -14 ? padD : padC); const sx = px + r * 0.5, L = fx - sx;
      still.tube([V3(sx, 0, z), V3(sx + L * 0.1, h * 0.42, z + 0.05), V3(sx + L * 0.42, h * 0.8, z + 0.08), V3(sx + L * 0.8, h * 0.97, z + 0.05), V3(fx, h, z)], (i) => 0.19 - 0.012 * i, () => padD, 6, (i) => [3, i / 4]);
      bloom(fx, h, z, px * 1.3 + z * 0.7, !!open); }
  }
  // ==== flight1 THING ONE (begin; with the four places in stillM marked "flight1 bed" it comes out whole) ====
  // THE STANDING LILY BED. Round the exit pool, leaves and flowers stand clear of the water on stalks: the frog dives for cover where
  // the bird cannot follow. Still things in the still mesh: drawn only because the eye moves; no clock, no wind, no motion, no stream.
  // Where its gate is 0 the bed is not drawn at all (its own discard, the lead's cure): while the eye is still the picture is live's.
  // Every metre is measured from the pool's own centre and long axis (slotC, slotA): al along the axis, of square to it.
  await ctx.yield();
  { const bh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };   // a hash of the leaf's own index
    const sd = new THREE.Vector2(-slotA.y, slotA.x), LANE = 15, OUT = 45, PITCH = 10;
    const bw = [[-36, -150], [-14, -126], [-6.5, -100]];      // the heron's walk (W0, WC, W1, typed where the walk is set out below this mesh)
    const hAt = (of) => 3 + 7 * (Math.abs(of) - LANE) / (OUT - LANE);   // low at the pool, taller outward: 3 m at the lane, 10 m at the outer edge
    // may a stalk stand at (x, z) under a rim of r metres? Not with its rim within 30 m of any point of the walk, nor within 8 m of a
    // reed stand (the stands' bounds as the reed loop types them: far-left fringe, near-left wall, right wall)
    const clear = (x, z, r) => { for (let k = 0; k <= 40; k++) { const t = k / 40, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
        if (Math.hypot(x - (bw[0][0] * a + bw[1][0] * b + bw[2][0] * c), z - (bw[0][1] * a + bw[1][1] * b + bw[2][1] * c)) - r < 30) return false; }
      const zc = Math.min(-12, Math.max(-86, z));
      return Math.min(Math.hypot(Math.max(0, x + 30), Math.max(0, z + 177)), Math.hypot(Math.max(0, x + Math.max(16, 0.6 * -zc + 6)), z - zc), 14 - x) >= 8; };
    const inBed = (al, of) => Math.abs(of) <= OUT && al >= -15 && al <= 45;
    // a stalk: the tube is built WITHOUT the builder's own end caps (their centre vertex carries aX = (0, 0): it would miss the bed's
    // early return and the bed's discard and take the wind); the top is closed here by a centre that carries the stalk's own aX, so
    // every vertex of the bed is a bed vertex. The foot, 0.2 m under the opaque water, needs no cap.
    const stalk = (x0, z0, x1, y1, z1, c) => { const first = still.count();
      still.tube([V3(x0, -0.2, z0), V3(lerp(x0, x1, 0.2), y1 * 0.35, lerp(z0, z1, 0.2)), V3(lerp(x0, x1, 0.7), y1 * 0.75, lerp(z0, z1, 0.7)), V3(x1, y1, z1)], () => 0.25, () => c, 6, (i) => [7, i / 3], false);
      const k = still.v(x1, y1, z1, 0, 1, 0, c, 7, 1); for (let s = 0; s < 6; s++) still.tri(first + 18 + s, k, first + 18 + (s + 1) % 6); };
    // a dished leaf: five rings from the heart to a lifted, slowly waving rim, the V notch left open, tilted a little (tx, tz).
    // aX = (6 + 0.9 * radius fraction, angle from the notch)
    const leafAt = (x, y, z, r, rot, tx, tz, cc) => { const S = 24, RR = [0.04, 0.38, 0.72, 0.93, 1.0], first = still.count(), D = 0.16 * r;
      for (let j = 0; j < 5; j++) for (let i = 0; i <= S; i++) { const a = rot + 0.22 + i / S * (Math.PI * 2 - 0.44), rf = RR[j] * (0.95 + 0.05 * Math.sin(i * 2.1 + rot * 3)), sa = Math.sin(a), ca = Math.cos(a);
        const lx = sa * r * rf, lz = ca * r * rf, ly = D * rf * rf + (j === 4 ? 0.02 * r * Math.sin(i * 1.3 + rot) : 0), sl = 2 * D * rf / r;
        const nx = -sa * sl - tx, nz = -ca * sl - tz, nl = Math.hypot(nx, 1, nz);
        still.v(x + lx, y + ly + tx * lx + tz * lz, z + lz, nx / nl, 1 / nl, nz / nl, cc, 6 + 0.9 * RR[j], a - rot); }
      for (let j = 0; j < 4; j++) for (let i = 0; i < S; i++) { const a = first + j * (S + 1) + i, b = a + S + 1; still.tri(a, a + 1, b); still.tri(a + 1, b + 1, b); } };
    const leafC = lin('#5E8A46'), leafD = lin('#4C7440'), stalkC = lin('#7E9A4A');
    for (let n = 0; n < 36; n++) { const col = Math.floor(n / 6), row = Math.floor(n / 2) % 3, sg = n % 2 ? 1 : -1, r = 5 + 4 * bh(n, 3);
      const al = -10 + PITCH * col + (bh(n, 1) - 0.5) * 0.7 * PITCH, of = sg * (LANE + r + 1 + PITCH * row + 3 * bh(n, 2));
      const x = slotC.x + slotA.x * al + sd.x * of, z = slotC.z + slotA.y * al + sd.y * of;
      if (!inBed(al, of) || !clear(x, z, r)) continue;
      const y = hAt(of), th = bh(n, 5) * 6.2832, ln = bh(n, 6);
      leafAt(x, y, z, r, bh(n, 4) * 6.2832, 0.12 * Math.cos(th) * bh(n, 7), 0.12 * Math.sin(th) * bh(n, 7), bh(n, 8) < 0.5 ? leafC : leafD);
      stalk(x + Math.cos(th) * ln, z + Math.sin(th) * ln, x, y + 0.02, z, stalkC); }
    await ctx.yield();
    // the open blooms, on a second grid half a pitch off the leaves': live's open flower (the lily() bloom above) at the bed's scale,
    // in live's pinks, standing 1.5 m clear of the leaves of its place. aX = (8 + 0.2 * across, along) petal, 9 the gold heart.
    const bedPetal = (bx, by, bz, az, el, L, W, curl, c0, c1, cup) => { const ox = Math.sin(az), oz = Math.cos(az), sx = oz, sz = -ox, R = 7, first = still.count();
      let px = bx, py = by, pz = bz; const col = new THREE.Color();
      for (let i = 0; i <= R; i++) { const t = i / R, e = el - curl * t, ce = Math.cos(e), se = Math.sin(e), nx = -ox * se, ny = ce, nz = -oz * se;
        const w = W * (Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.92 + 0.08 * (1 - t)) * (i === R ? 0.0 : 1), k = cup * w; col.copy(c0).lerp(c1, t);
        still.v(px - sx * w + nx * k, py + ny * k, pz - sz * w + nz * k, nx + sx * 0.6, ny, nz + sz * 0.6, col, 8, t);
        still.v(px, py, pz, nx, ny, nz, col, 8.2, t);
        still.v(px + sx * w + nx * k, py + ny * k, pz + sz * w + nz * k, nx - sx * 0.6, ny, nz - sz * 0.6, col, 8.4, t);
        px += ox * ce * L / R; py += se * L / R; pz += oz * ce * L / R; }
      for (let i = 0; i < R; i++) { const a = first + i * 3; still.tri(a, a + 1, a + 3); still.tri(a + 1, a + 4, a + 3); still.tri(a + 1, a + 2, a + 4); still.tri(a + 2, a + 5, a + 4); } };
    const white = lin('#FBEFEA'), pinkA = lin('#F2B8C6'), pinkB = lin('#E88C9A'), pinkC = lin('#D8718A'), pinkE = lin('#F6C9D2'), gold = lin('#E8C24A');
    for (let n = 0; n < 24; n++) { const col = Math.floor(n / 4), row = Math.floor(n / 2) % 2, sg = n % 2 ? 1 : -1, m = 100 + n, rad = 3 + bh(m, 3), sc = rad / 1.65;
      const al = -5 + PITCH * col + (bh(m, 1) - 0.5) * 0.7 * PITCH, of = sg * (LANE + 4 + 6 + PITCH * row + 3 * bh(m, 2));
      const x = slotC.x + slotA.x * al + sd.x * of, z = slotC.z + slotA.y * al + sd.y * of;
      if (bh(m, 9) >= 0.6 || !inBed(al, of) || !clear(x, z, rad)) continue;
      const y = hAt(of) + 1.5, ph = bh(m, 4) * 6.2832, th = bh(m, 5) * 6.2832, deep = bh(m, 8) < 0.5, o0 = deep ? pinkE : white, o1 = deep ? pinkC : pinkA;
      stalk(x + Math.cos(th) * bh(m, 6), z + Math.sin(th) * bh(m, 6), x, y, z, stalkC);
      for (let k = 0; k < 4; k++) bedPetal(x, y, z, ph + k * 1.5708, 0.2, 1.1 * sc, 0.5 * sc, 0.5, leafC, leafD, 0.3);
      for (let k = 0; k < 9; k++) bedPetal(x, y + 0.05 * sc, z, ph + k * 0.698, 0.42, 1.75 * sc, 0.5 * sc, 0.25, o0, o1, 0.4);
      for (let k = 0; k < 8; k++) bedPetal(x, y + 0.12 * sc, z, ph + 0.35 + k * 0.785, 0.88, 1.5 * sc, 0.46 * sc, 0.3, o0, pinkB, 0.45);
      for (let k = 0; k < 6; k++) bedPetal(x, y + 0.18 * sc, z, ph + k * 1.047, 1.3, 1.1 * sc, 0.36 * sc, 0.25, o1, pinkB, 0.5);
      const hf = still.v(x, y + 0.75 * sc, z, 0, 1, 0, gold, 9, 0);                                   // the gold heart: a low seed head
      for (let k = 0; k <= 8; k++) { const a = k / 8 * 6.2832; still.v(x + Math.cos(a) * 0.34 * sc, y + 0.4 * sc, z + Math.sin(a) * 0.34 * sc, Math.cos(a) * 0.7, 0.7, Math.sin(a) * 0.7, gold, 9, 0); }
      for (let k = 0; k < 8; k++) still.tri(hf, hf + 1 + k, hf + 2 + k); }
  }
  await ctx.yield();
  // ==== flight1 THING ONE (end) ====
  // one material for everything that stands still. aX.x picks the surface: 1 mud, 2 lily pad (+ radius), 3 stem or blade (aX.y along it),
  // 4 far bank, 5 petal; 0 is plain.
  const stillM = gateMaterial(G, {
    uniforms: { uHit: { value: 0 }, uStrike: { value: strikeAt } },
    side: THREE.DoubleSide,
    vert: /* glsl */`attribute vec3 color; attribute vec2 aX; uniform float uHit, uTime, uTrain, uWind; uniform vec3 uStrike; uniform vec4 uSlot, uPort; varying vec3 vC; varying vec3 vN; varying vec2 vX;
      float trainY(vec2 P, float time) { vec2 q = P - uSlot.xy; float eW = length(vec2(dot(q, uSlot.zw) * uPort.w, q.x * uSlot.w - q.y * uSlot.z));     // a pad rides the exit's waves
        return uTrain * smoothstep(6.1, 7.3, eW) * (1. - smoothstep(40., 90., eW)) * 0.16 * sin(6.2832 * ((eW - 6.4) / 4.5 - time * 2.))
          + uWind * 0.05 * sin(P.x * 0.9 + P.y * 0.6 - time * 6.) ; }                                   // and rocks on the wind's ripples
      // polish 1b: a nod is a small loop, not a line (side to side and, a quarter turn later, down and up), so a nodding head never
      // stands still at the end of its swing and is never missing from a frame while the wind blows
      vec3 windSway(vec3 P, float time) { float h = max(P.y - 1.2, 0.), a = time * 6.5 + P.x * 0.37 + P.z * 0.23, b = time * 9.7 + P.z * 0.4, sw = sin(a) + 0.3 * sin(b);
        return uWind * 1.2 * (1. - exp(-h * h / 6.)) * vec3(0.8 * sw, 0.5 * cos(a), 0.6 * sw); }   // a bud trembles a few centimetres, quickly: metres a second at frog scale
      void main() { vC = color; vN = normal; vX = aX; vec3 p = position;
        if (aX.x > 5.95) { gate(p, p); return; }                          // flight1 bed: a standing leaf, stalk or bloom has no clock and no wind
        if (aX.x > 1.5 && aX.x < 2.95) { vec3 pa = p; p.y += trainY(position.xz, uTime); pa.y += trainY(position.xz, uTime - ${DELTA.toFixed(6)}); gate(p, pa); return; }
        if (aX.x > 0.5 && aX.x < 1.5) { float r = distance(p.xz, uStrike.xz) - 1.7;                    // the strike leaves a dent with a thrown lip
          p.y += uHit * (0.34 * exp(-r * r * 3.) - 0.5 * (1. - smoothstep(-1.7, -0.5, r))); }
        // stems, blades, buds and flowers nod while the wind blows (not the mud, the pads or the far bank). Polish 1b: the damselfly's
        // rush nods too, and the damselfly rides it (rushNod below is this same sum, on the CPU)
        if ((aX.x < 0.5 || aX.x > 2.95) && !(aX.x > 3.95 && aX.x < 4.5)) {
          vec3 pa = p; p += windSway(position, uTime); pa += windSway(position, uTime - ${DELTA.toFixed(6)}); gate(p, pa); return; }
        gate(p, p); }`,
    frag: WATER_FN + /* glsl */`varying vec3 vC; varying vec3 vN; varying vec2 vX;
      uniform float uHit; uniform vec3 uStrike;
      float mudH(vec2 p) { float c = vn(p * 0.8); return vn(p * 1.3) * 0.4 + vn(p * 4.3) * 0.16 - 0.2 * (1. - smoothstep(0., 0.05, abs(c - 0.5))); }
      vec2 h22(vec2 p) { return vec2(h21(p), h21(p + 37.7)); }
      // drying crust: distance from the nearest crack between plates (plain arithmetic)
      float crackle(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 gq = vec2(float(x), float(y)), o = gq + 0.1 + 0.8 * h22(i + gq) - f; float dd = dot(o, o);
          if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
        return sqrt(d2) - sqrt(d1); }
      // a round pebble in about one cell in four: (dome 0..1, a number for its tone, slope toward its centre)
      vec4 pebble(vec2 p) { vec2 i = floor(p), f = fract(p), c = 0.27 + 0.46 * h22(i + 9.1); float r0 = h21(i + 5.3), rad = 0.08 + 0.13 * h21(i + 2.9);
        vec2 o = (f - c) / rad; float dd = length(o), on = step(0.73, r0) * (1. - smoothstep(0.82, 1., dd));
        return vec4(on * sqrt(max(1. - dd * dd, 0.)), r0, o * on); }
      void main() { vec3 n = normalize(vN + vec3(0., 1e-3, 0.)), v = normalize(uCamL - vP + vec3(0., 1e-3, 0.));
        if (dot(n, v) < 0.) n = -n;
        float kind = floor(vX.x + 0.01), kf = vX.x - kind, d = distance(vP, uCamL), gloss = 0., wet = 0.;
        vec3 alb = vC, extra = vec3(0.);
        float bed = step(5.5, kind); if (kind > 6.5) kind = kind < 7.5 ? 3. : kind < 8.5 ? 5. : 0.;   // flight1 bed: its stalks wear the stem's look, its petals the petal's, its gold heart is plain
        if (kind > 0.5 && kind < 1.5) {
          // wet silt from a centimetre up: big soft forms, a dark mirror band at the waterline, a pale cracked crust on the crown,
          // grain only close to the lens, a few round pebbles, two snail tracks, and after the strike a dent with thrown clods
          vec2 mp = vP.xz; float a = vn(mp * 0.37), b = vn(mp * 2.3), big = vn(mp * 0.19 + 3.1), near = 1. - smoothstep(30., 90., d), close = 1. - smoothstep(3., 13., d);
          float h0 = mudH(mp), hx = mudH(mp + vec2(0.1, 0.)), hz = mudH(mp + vec2(0., 0.1));
          float B0 = vn(mp * 0.55 + 7.), Bx = vn(mp * 0.55 + vec2(7.17, 7.)), Bz = vn(mp * 0.55 + vec2(7., 7.17));
          n = normalize(n + vec3(h0 - hx, 0., h0 - hz) * 0.8 * near + vec3(B0 - Bx, 0., B0 - Bz) * 1.3);
          float hgt = vP.y + 0.2 * (a - 0.5) + 0.12 * (B0 - 0.5);
          wet = 1. - smoothstep(0.1, 0.55, hgt); float film = 1. - smoothstep(0.0, 0.2, hgt);
          float dry = smoothstep(0.6, 0.9, hgt + 0.25 * (b - 0.5)) * smoothstep(0.3, 0.55, vn(mp * 0.21 + 11.) + 0.25 * (a - 0.5));   // crust in patches, smooth damp silt between
          alb = vC * (0.78 + 0.5 * a) * (0.78 + 0.45 * big) * (0.9 + 0.2 * b) * (0.9 + 0.25 * B0);
          float ck = crackle(mp * 1.5 + 0.35 * vec2(vn(mp * 1.1), vn(mp * 1.1 + 9.))), crack = (1. - smoothstep(0.015, 0.07 + 0.005 * d, ck)) * (1. - smoothstep(25., 60., d));
          alb = mix(alb, vec3(0.36, 0.3, 0.19) * (0.8 + 0.4 * b) * (0.9 + 0.2 * smoothstep(0.1, 0.5, ck)), dry * 0.8);
          alb *= 1. - 0.62 * crack * dry;
          alb *= 1. + (vn(mp * 17.) * 0.6 + vn(mp * 43.) * 0.4 - 0.5) * 0.7 * close;                     // grain, only near the lens
          vec4 pb = pebble(mp * 1.1 + 13.); float pk = pb.x * near;
          alb = mix(alb, mix(vec3(0.17, 0.15, 0.115), vec3(0.07, 0.07, 0.075), step(0.5, fract(pb.y * 7.3))) * (0.7 + 0.6 * pb.x), smoothstep(0., 0.25, pk));
          n = normalize(n - vec3(pb.z, 0., pb.w) * 0.9 * near);
          float t1 = abs(mp.x + 0.7 - 0.7 * sin(mp.y * 0.45 + 1.) - 0.22 * sin(mp.y * 1.9)), t2 = abs(mp.y + 88.2 - 0.5 * sin(mp.x * 0.8) - 0.15 * sin(mp.x * 2.7));
          float trail = max((1. - smoothstep(0.03, 0.07, t1)) * step(-97., mp.y) * step(mp.y, -70.), (1. - smoothstep(0.03, 0.07, t2)) * step(1., mp.x) * step(mp.x, 9.)) * (1. - wet) * near;
          alb = mix(alb, alb * 1.2 + 0.02, trail * 0.5);
          // the strike: a dark wet hole, a raised lip that catches the light, clods thrown out round it
          vec2 sq = mp - uStrike.xz; float sr = length(sq), lipR = sr - 1.7, hole = (1. - smoothstep(0.3, 1.25, sr)) * uHit, lip = exp(-lipR * lipR * 3.5) * uHit;
          film *= 1. - uHit * (1. - smoothstep(1.6, 3.4, sr));
          float clod = smoothstep(0.6, 0.74, vn(mp * 2.9 + 31.) * 0.7 + vn(mp * 7.1) * 0.3) * (1. - smoothstep(2., 5.2, sr)) * smoothstep(1.2, 2., sr) * uHit;
          n = normalize(n + vec3(sq.x, 0., sq.y) / max(sr, 0.05) * (1.1 * hole * smoothstep(0.1, 0.9, sr) - 0.9 * lip * sign(lipR)) + vec3(vn(mp * 5.3) - 0.5, 0., vn(mp * 5.3 + 4.7) - 0.5) * 1.6 * clod);
          alb = mix(alb, alb * vec3(0.5, 0.54, 0.55), wet * 0.7);
          alb = mix(alb, vC * vec3(0.62, 0.6, 0.58), max(lip, clod) * 0.9);
          alb *= 1. - 0.72 * hole;
          gloss = 0.03 + 0.3 * wet + 0.6 * film + 0.35 * trail + 0.06 * pk + 0.1 * (1. - dry) + 0.45 * max(lip, clod) - 0.25 * hole;
          wet = film * (1. - max(hole, max(lip, clod)));                     // from here on: only the film at the waterline mirrors the sky
        } else if (kind < 2.5 && kind > 1.5) {                            // lily pad: veins from the stalk, a rusty rim, a waxy skin
          float rad = kf / 0.9, vein = smoothstep(0.86, 1., abs(cos(vX.y * 6.5))) * smoothstep(0.02, 0.2, rad) * (1. - rad * 0.6);
          float mot = vn(vP.xz * 1.7) * 0.6 + vn(vP.xz * 6.) * 0.4;
          alb = vC * (0.72 + 0.5 * mot) * (1. + 0.5 * vein);
          alb = mix(alb, vec3(0.30, 0.19, 0.07), smoothstep(0.9, 1., rad + 0.06 * mot) * 0.75);
          alb = mix(alb, vC * 1.5, (1. - smoothstep(0.03, 0.12, rad)) * 0.6);
          gloss = 0.4;
        } else if (kind < 3.5 && kind > 2.5) {                            // stems and blades: ribbed, paler toward the tip, light comes through
          float rib = vn(vec2(vX.y * 3., atan(n.z, n.x + 1e-4) * 5.)) ;
          alb = vC * (0.8 + 0.4 * rib) * (0.85 + 0.3 * vX.y);
          extra = thru(alb, n, v) * 0.6 + alb * uSunC * 0.08; gloss = 0.15;
        } else if (kind < 4.5 && kind > 3.5) {                            // far bank: clumps of alder crowns, lit on top
          float cl = vn(vec2(atan(vP.x, vP.z + 81.) * 90., vP.y * 0.12)) * 0.6 + vn(vec2(atan(vP.x, vP.z + 81.) * 31., 3.)) * 0.4;
          alb = vC * (0.6 + 0.7 * cl) * (0.75 + 0.5 * vX.y); n = normalize(vec3(n.x, 0.55 + cl, n.z));
        } else if (kind > 5.5) {                                          // flight1 bed: a standing leaf. Waxy green above with veins from the heart;
          float rad = kf / 0.9, far = 1. - smoothstep(70., 160., d);      // from below pale and veined, the day coming through it
          float vein = smoothstep(0.84, 1., abs(cos(vX.y * 10.))) * smoothstep(0.03, 0.2, rad) * (1. - rad * 0.5) * far;
          float mot = vn(vP.xz * 0.9) * 0.6 + vn(vP.xz * 3.1) * 0.4, under = step(dot(vN, v), 0.);
          vec3 top = vC * (0.74 + 0.46 * mot) * (1. + 0.45 * vein);
          top = mix(top, vec3(0.30, 0.19, 0.07), smoothstep(0.94, 1., rad + 0.04 * mot) * 0.55);
          top = mix(top, vC * 1.45, (1. - smoothstep(0.03, 0.14, rad)) * 0.6);
          vec3 bot = mix(vec3(0.40, 0.58, 0.145) * (0.82 + 0.3 * mot), vec3(0.62, 0.74, 0.36), vein * 0.7);
          alb = mix(top, bot, under);
          extra = thru(alb, n, v) * (0.35 + 0.65 * under); gloss = mix(0.38, 0.08, under);
        } else if (kind > 4.5) {                                          // petal: fine ribs, pale at the heart, thin enough to glow
          float ac = (kf - 0.2) * 5., rib = 0.86 + 0.14 * cos(ac * 13.) * (1. - vX.y * 0.5);
          alb = vC * rib * (0.82 + 0.18 * smoothstep(0., 0.25, abs(ac))) * (1. + 0.25 * smoothstep(0.7, 1., abs(ac)));
          extra = alb * uSunC * (0.3 + 0.45 * abs(dot(n, uSunD))) + alb * uSkyC * 0.25; gloss = 0.08;   // a crease down the middle, a thin bright edge, lit from both faces
        }
        vec3 c = shade(alb, n, 1.) + extra; float s = eyeSpeed();
        if (kind < 2.5 && kind > 1.5) { float eW; s = max(s, max(trainAt(vP.xz, eW) * 14., uWind * 8.) / (max(d, 0.3) * 1.2)); }   // a pad rides the exit's waves, and the wind's ripples while it blows
        if (vP.y < -3.) {                                                // the bed under the exit: only ever seen from under the surface, in the last
          float lit = wave(vP.xz * 0.35, uTime * 1.6);                   // metres of the dive: dim green depths with slow nets of light sliding over them
          c = mix(uUnder * 0.42, vec3(0.13, 0.13, 0.06), 0.4) * (0.55 + 0.9 * lit) + uSunC * 0.05 * smoothstep(0.62, 0.9, lit); gloss = 0.; wet = 0.; }
        // sheen: the sky in wet mud and waxy leaves, and the sun where it can reach
        vec3 r = reflect(-v, n); float fr = 1. - max(dot(n, v), 0.); fr = fr * fr; fr = 0.04 + 0.96 * fr * fr;
        c = mix(c, skyCol(abs(r.y)) * 0.85, clamp(gloss * fr + wet * 0.22, 0., 1.));                   // wet silt holds a film of water: it mirrors the sky from any angle
        vec3 h = normalize(v + uSunD + vec3(0., 2e-3, 0.)); float sp = max(dot(n, h), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        c += uSunC * sp * gloss * 0.9;
        if (bed > 0.5 && gateOf(s) <= 0.) discard;                       // flight1 bed: where its gate is 0 the bed is not drawn at all, so the sit holds exactly what live holds (the hard test)
        gl_FragColor = vec4(finish(c, gateOf(s)), 1.); }`,
  });
  add(new THREE.Mesh(still.geo(), stillM));
  await ctx.yield();

  // ---- reeds: instanced stems 120 m tall with three leaves and a head. Still, unless the gust front passes: then each one
  // bends once and is there only while it bends (the tail keeps it for under half a second after).
  // the heron's walk: a curve from where it first stands (left, in profile) round to face us at 46 m
  const W0 = V3(-36, 0, -150), WC = V3(-14, 0, -126), W1 = V3(-6.5, 0, -100), _fd = V3(), _fl = V3();
  const walkAt = (t, out) => out.set(0, 0, 0).addScaledVector(W0, (1 - t) * (1 - t)).addScaledVector(WC, 2 * t * (1 - t)).addScaledVector(W1, t * t);
  const walkDir = (t, out) => out.set(0, 0, 0).addScaledVector(W0, -2 * (1 - t)).addScaledVector(WC, 2 - 4 * t).addScaledVector(W1, 2 * t).normalize();
  const footAt = (side, t, out) => { walkDir(t, _fd); walkAt(t, out); return out.addScaledVector(_fl.set(_fd.z, 0, -_fd.x), side ? 2.4 : -2.4); };
  const nReed = Math.round(5536 * (detail < 1 ? 0.62 : 1)) + (variant === 2 ? 30 : 0);
  const reedGeo = new THREE.InstancedBufferGeometry();
  { const P = [], N = [], Kd = [], I = []; const pv = (x, y, z, nx, ny, nz, k) => { P.push(x, y, z); N.push(nx, ny, nz); Kd.push(k); return P.length / 3 - 1; };
    for (let j = 0; j < 5; j++) for (let s = 0; s < 3; s++) { const a = s / 3 * 6.2832, r = 0.34 - 0.045 * j; pv(Math.cos(a) * r, j / 4 * 0.94, Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), 0); }
    for (let j = 0; j < 4; j++) for (let s = 0; s < 3; s++) { const a = j * 3 + s, b = j * 3 + (s + 1) % 3; I.push(a, a + 3, b, b, a + 3, b + 3); }
    for (let l = 0; l < 3; l++) { const a = l * 2.2 + 0.4, ca = Math.cos(a), sa = Math.sin(a), yb = 0.34 + 0.19 * l, f = P.length / 3, W = [0.5, 1.0, 0.95, 0.55];   // a blade that lifts, then droops
      for (let j = 0; j < 4; j++) { const t = j / 4, r = 16 * t, y = yb + 0.22 * t - 0.2 * t * t, w = W[j], tl = 0.5 - 1.1 * t;
        pv(ca * r - sa * w, y, sa * r + ca * w, -ca * tl - sa * 0.25, 1, -sa * tl + ca * 0.25, 1); pv(ca * r + sa * w, y, sa * r - ca * w, -ca * tl + sa * 0.25, 1, -sa * tl - ca * 0.25, 1); }
      pv(ca * 16, yb + 0.02, sa * 16, ca * 0.6, 1, sa * 0.6, 1);
      for (let j = 0; j < 3; j++) { const q = f + j * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); } I.push(f + 6, f + 7, f + 8); }
    { const f = pv(0, 0.93, 0, 0, -1, 0, 2); for (let s = 0; s < 3; s++) { const a = s / 3 * 6.2832; pv(Math.cos(a) * 1.0, 0.97, Math.sin(a) * 1.0, Math.cos(a), 0, Math.sin(a), 2); } const t = pv(0, 1.04, 0, 0, 1, 0, 2);
      for (let s = 0; s < 3; s++) { const a = f + 1 + s, b = f + 1 + (s + 1) % 3; I.push(f, b, a, a, b, t); } }
    reedGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); reedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    reedGeo.setAttribute('aK', new THREE.Float32BufferAttribute(Kd, 1)); reedGeo.setIndex(I); }
  { const aB = new Float32Array(nReed * 4), aT = new Float32Array(nReed * 2), rr = rng.fork ? rng.fork('reeds') : rng;
    const lane = variant === 2 ? 30 : 0, nearL = 16 + Math.round(520 * (detail < 1 ? 0.62 : 1)), left = nearL + Math.round((nReed - 536) * 0.24);
    for (let i = 0; i < nReed; i++) { let x, z;
      if (i < lane) { const t = rr() * 0.45, w = 7 + 10 * rr(); walkAt(t, _fl); const dx = SIT.x - _fl.x, dz = SIT.z - _fl.z, dl = Math.hypot(dx, dz); x = _fl.x + dx / dl * w + (rr() - 0.5) * 10; z = _fl.z + dz / dl * w + (rr() - 0.5) * 10; if (inWin(x, z, 6)) x = 15 + (x + 45) * 0.2; }   // (polish 1b: any that would stand in the bird's window at the door joins the front rank of the right-hand wall instead, clear of our line and the bird's)   // C: a thin stand the heron walks behind
      else if (i < lane + 16) { x = -7.5 - 3.5 * rr(); z = -56 - 16 * rr(); for (let k = 0; k < 6 && inWin(x, z, 6); k++) x -= 3; }
      else if (i < lane + nearL) { const t = rr(); z = -12 - 74 * rr(); x = -(Math.max(16, 0.6 * -z + 6) + 42 * t * t + 3 * rr()); }
      else if (i < lane + left) { const t = rr(); x = -30 - 110 * t * Math.sqrt(t) - 5 * rr(); z = -177 - 125 * rr(); z -= 16 * (1 + n2(x * 0.045, 1.7)); x -= 14 * (1 + n2(z * 0.05, 4.3)) * (1 - t); }
      else { const t = rr(); x = 14 + 106 * t * Math.sqrt(t) + 4 * rr() * rr(); z = -20 - 240 * rr(); if (z > -45) x += (z + 45) * 0.9; }
      aB[i * 4] = x; aB[i * 4 + 1] = z; aB[i * 4 + 2] = 120 * (0.72 + 0.4 * rr()) * (i >= lane + nearL && i < lane + left ? 0.5 : 1); aB[i * 4 + 3] = rr() * 6.2832; aT[i * 2] = rr(); aT[i * 2 + 1] = (rr() - 0.5) * 2;
      if (i % 500 === 499) await ctx.yield(); }
    reedGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); reedGeo.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 2)); reedGeo.instanceCount = nReed; }
  const reedM = gateMaterial(G, {
    uniforms: { uGust: { value: new THREE.Vector4(0, 50, -100, 14) } }, side: THREE.DoubleSide,
    vert: /* glsl */`attribute vec4 aB; attribute vec2 aT; attribute float aK;
      uniform vec4 uGust; uniform float uT, uTime, uWind; uniform vec3 uCamL; uniform vec2 uRes;
      varying vec3 vC; varying vec3 vN; varying float vTail; varying float vY; varying vec4 vR;
      float env(float tau) { float s = sin(3.14159 * clamp(tau / 1.3, 0., 1.)); return s * s; }
      float denv(float tau) { float x = clamp(tau / 1.3, 0., 1.); return abs(2.4166 * sin(6.28318 * x)); }
      float tauOf(float T) { return (T - uGust.x - (uGust.z - aB.y) / max(uGust.y, 1.)) * step(0., aB.x) * step(aB.y, uGust.z) * step(uGust.z - 72., aB.y); }
      vec3 reedAt(float T, float time, float wide) { float cy = cos(aB.w), sy = sin(aB.w), yy = position.y;
        vec3 p = vec3(position.x * wide, yy * aB.z, position.z * wide); p.xz = vec2(cy * p.x - sy * p.z, sy * p.x + cy * p.z);
        float prof = 1.6 * yy - 0.6 * yy * yy, b = env(tauOf(T)) * uGust.w * prof;
        b += uWind * prof * (4.5 * sin(time * 1.6 + aB.x * 0.05 + aB.y * 0.03) + 1.6 * sin(time * 2.9 + aB.w));   // a reed two metres tall nods a hand's width: fast, at frog scale
        return p + vec3(aB.x + aT.y * 5. * yy * yy - 0.85 * b, -0.08 * b * yy, aB.y - 0.5 * b); }
      void main() { float yy = position.y, d = max(distance(vec3(aB.x, yy * aB.z, aB.y), uCamL), 0.3);
        float wide = max(1., 1.6 * d * 1.2 / (0.6 * max(uRes.y, 1.)));
        float tau = tauOf(uT);
        vTail = max(0.6 * denv(tau - 0.2), 0.3 * denv(tau - 0.4)) * uGust.w * (1.6 * yy - 0.6 * yy * yy) * 0.8 / (d * 1.2);
        vec3 green = vec3(0.21, 0.32, 0.07), straw = vec3(0.58, 0.47, 0.11), head = vec3(0.30, 0.19, 0.08);
        float dry = step(0.82, fract(aT.x * 7.31));                                 // one stem in six is last year's: straw from the foot up
        vC = mix(green, straw, max(smoothstep(0.25, 0.95, yy + 0.25 * (aT.x - 0.5)), dry * 0.85)) * (0.78 + 0.5 * fract(aT.x * 3.17));
        if (aK > 0.5) vC = mix(vec3(0.2, 0.36, 0.08), straw, 0.2 + 0.35 * aT.x); if (aK > 1.5) vC = head;
        // how deep in the stand this stem is: the front rank takes the sun, the ranks behind stand in blue green shade below their tops
        float inner = aB.x > 0. ? smoothstep(15., 44., aB.x) : (aB.y > -100. ? smoothstep(2., 28., -aB.x - max(16., -0.6 * aB.y + 6.)) : smoothstep(34., 70., -aB.x));
        vR = vec4(aK, yy * aB.z, 1. - 0.7 * inner * (1. - smoothstep(0.45, 0.95, yy)), aT.x);
        float cy = cos(aB.w), sy = sin(aB.w); vN = vec3(cy * normal.x - sy * normal.z, normal.y, sy * normal.x + cy * normal.z); vY = yy;
        gate(reedAt(uT, uTime, wide), reedAt(uT - ${DELTA.toFixed(6)}, uTime - ${DELTA.toFixed(6)}, wide)); }`,
    frag: /* glsl */`varying vec3 vC; varying vec3 vN; varying float vTail; varying float vY; varying vec4 vR;
      void main() { vec3 n = normalize(vN + vec3(0., 1e-3, 0.)), v = normalize(uCamL - vP + vec3(0., 1e-3, 0.));
        float d = distance(vP, uCamL), near = 1. - smoothstep(60., 170., d), occ = (0.45 + 0.55 * smoothstep(0.02, 0.4, vY)) * vR.z;
        vec3 alb = vC, c;
        if (vR.x < 0.5) {                                                           // stem: joints every few metres, long fibres, dappled by its neighbours
          float joint = 1. - smoothstep(0.02, 0.1, abs(fract(vR.y / 9. + vR.w) - 0.5) * 2. - 0.88);
          alb *= (1. - 0.4 * (1. - joint) * near) * (0.9 + 0.2 * vn(vec2(vP.x * 9. + vP.z * 7., vR.y * 0.15)) * near);
          occ *= 0.72 + 0.5 * vn(vec2(vR.w * 40., vR.y * 0.06));
          c = shade(alb, n, occ) * (0.7 + 0.3 * smoothstep(0., 0.3, vY));
          float fr = 1. - abs(dot(n, v)); c += alb * uSkyC * 0.5 * fr * fr;
        } else if (vR.x < 1.5) {                                                    // leaf: thin, so it takes light on both faces and glows against the sun
          if (dot(n, v) < 0.) n = -n;
          c = shade(alb, n, occ) + alb * uSunC * (0.16 + 0.3 * abs(dot(n, uSunD))) * occ + thru(alb, n, v) * 0.6;
        } else { c = shade(alb * (0.75 + 0.5 * vn(vP.xy * 1.3)), n, 1.) + alb * uSunC * 0.35; }   // seed head: downy, always catching some sun
        gl_FragColor = vec4(finish(c, gateOf(max(eyeSpeed(), vTail))), 1.); }`,
  });
  add(new THREE.Mesh(reedGeo, reedM));
  await ctx.yield();

  // ---- the script, in flight seconds T (from the pace table; u is the contract, seconds follow from it)
  const Tu = clock.T;
  const tGust = Tu(0.281), tGustEnd = Tu(0.305), tDamsel0 = Tu(0.301), tDamsel1 = Tu(0.318), tFly0 = Tu(0.323), tFly1 = Tu(0.344);
  const tStill = Tu(0.428), tDim = Tu(0.457), tStrike = Tu(0.462), tJump = Tu(0.4722), tHit = tJump + 0.06;
  const nStep = variant === 1 ? 4 : 3, stepLen = variant === 1 ? 1.0 : 1.2, stepGap = variant === 1 ? 2.2 : 3.0;
  // The end of the last step, tLastEnd, is LIVE'S OWN NUMBER and is not the journey's: the brief's beat 4 begins the bird's dead
  // stillness at u 0.428; 0.4283 was set in polish round 1b (first build 0.4244, polish round 1 0.4312) by looking at frames of the
  // stalk, so that the big foot comes down between two frames that round looked at. Round flight1 leaves the number exactly as live
  // (moving it would change live's pictures of the stalk) and lists it for the lead. What the step does: through its last four
  // tenths the big foot creeps in a hand's breadth over the water and comes down with the step's last instant (stepGo and stepLift
  // below, in the step's own time); the planted leg is gone inside the rule's half-second tail, and nothing of the bird moves again
  // until the dimming.
  const tLastEnd = Tu(0.4283);
  const tStep0 = variant === 1 ? tLastEnd - (3 * 2.2 + 1.0) : Tu(0.361);
  const lastLate = variant === 1 ? 0 : tLastEnd - stepLen - (tStep0 + (nStep - 1) * stepGap);
  const stepT = (s) => tStep0 + s * stepGap + (s === nStep - 1 ? lastLate : 0);
  // polish 1b: how a swinging foot goes, as (way along its swing, height) against the step's own time 0..1. The first steps swing and
  // drop. The last is placed, as a stalking heron places a foot: it swings to within five metres of its mark in the first six tenths,
  // then creeps in low over the water, toes spread and tipped at us, and comes down with the step's last instant. So the beat frame
  // u 0.425 holds both legs as tall as the frame and the big foot a hand's breadth up, and it is planted at u 0.4283.
  const stepGo = (s, t) => { if (s !== nStep - 1) return t * t * (3 - 2 * t); const x = Math.min(1, t / 0.6), ex = x * x * (3 - 2 * x); return t < 0.6 ? 0.85 * (ex + (x - ex) * 0.265) : 0.85 + 0.375 * (t - 0.6); };
  const stepLift = (s, t) => (s !== nStep - 1 ? Math.sin(Math.PI * t) : t < 0.6 ? Math.sin(Math.PI * 0.92 * t / 0.6) : 0.2487 * (1 - (t - 0.6) / 0.4));
  // per step: the body's place along the walk before and after, which foot swings (0 left, 1 right), from where to where
  const bodyA = variant === 1 ? [0, 0.1, 0.4, 0.62, 0.8] : [0, 0.1, 0.5, 0.8];   // the body stops short of the last footfall: the near foot lands 19 m from us
  const swings = variant === 1 ? [[0, 0, 0.28], [1, 0, 0.6], [0, 0.28, 0.88], [1, 0.6, 1]] : [[0, 0, 0.32], [1, 0, 0.72], [0, 0.32, 1]];
  reedM.uniforms.uGust.value.set(tGust, 70 / Math.max(0.3, tGustEnd - tGust - 1.3), -100, 14);

  // ---- bits: thistledown on world time (always falling, so always seen), drops off each lifted foot and mud from the strike on T
  const bitM = (() => {
    const nNear = 3, nBlank = 23, nWide = Math.round(60 * detail * density), nDrop = Math.max(8, Math.round(14 * (detail < 1 ? 0.7 : 1))), nMud = 52, nCrown = 12;
    const n = nNear + nBlank + nWide + (nDrop + nCrown) * nStep + nMud, aA = new Float32Array(n * 4), aV = new Float32Array(n * 4), aC = new Float32Array(n * 4), br = rng.fork ? rng.fork('bits') : rng;
    let k = 0; const put = (a, v, c) => { aA.set(a, k * 4); aV.set(v, k * 4); aC.set(c, k * 4); k++; };
    const seeds = [];                                                             // for the rings: x, z, phase, period, over water?
    const seed = (x, z, top, cls, ph) => { const mh = mudAt(x, z), gy = mh > 0.05 ? mh + 0.05 : 0.02, per = (top - gy) / 3; const phase = ph ?? br() * per;
      put([x, z, phase, top], [cls, br() * 6.28, gy, 0], [0, cls ? 0.5 : 0.95, 0, 0]); seeds.push({ x, z, phase, per, water: gy < 0.5, cls }); };
    seed(-6.4, -89.2, 10, 0, 0.4); seed(-7.2, -93, 11.5, 0, 1.9); seed(2.3, -88.6, 9, 0, 2.6);
    for (let i = 0; i < nBlank; i++) { const a = -0.9 + 1.8 * br(), d = 8 + 22 * Math.sqrt(br()); seed(SIT.x + Math.sin(a) * d - 3, SIT.z - Math.cos(a) * d, 14 + 12 * br(), 1); }
    for (let i = 0; i < nWide; i++) { const t = br(); seed(-60 + 75 * br() + (t > 0.5 ? -40 * br() : 0), 10 - 230 * t, 16 + 20 * br(), 2); }
    const f = V3(), dirW = V3();
    // drops: each lifted foot lets go a string of beads as it swings; every bead keeps some of the foot's speed and falls to the water
    const f2 = V3(), footIn = (s, tf, out) => { footAt(swings[s][0], lerp(swings[s][1], swings[s][2], stepGo(s, tf)), out); out.y = 0.5 + 11.5 * stepLift(s, tf); return out; };
    for (let s = 0; s < nStep; s++) for (let i = 0; i < nDrop; i++) { const tf = 0.08 + 0.58 * (i + 0.7 * br()) / nDrop; footIn(s, tf, f); footIn(s, tf + 0.02, f2);
      const kv = 0.4 / (0.02 * stepLen), y0 = Math.max(0.6, f.y - 0.8 - 0.8 * br()), vy = -3.5 - 5 * br(), gr = 15, life = (vy + Math.sqrt(vy * vy + 2 * gr * y0)) / gr;
      put([f.x + (br() - 0.5) * 1.8, y0, f.z + (br() - 0.5) * 1.8, stepT(s) + tf * stepLen], [(f2.x - f.x) * kv, vy, (f2.z - f.z) * kv, gr], [1, (0.27 + 0.1 * br()) * (s === nStep - 1 ? 1.6 : 1), life, 0]); }
    for (let s = 0; s < nStep; s++) { footAt(swings[s][0], swings[s][2], f);                                   // the crown thrown up where each foot comes down
      for (let i = 0; i < nCrown; i++) { const a = i / nCrown * 6.2832 + br(), vy = 6.5 + 4.5 * br(), vr = 1.6 + 1.6 * br();
        put([f.x + Math.cos(a) * 0.9, 0.25, f.z + Math.sin(a) * 0.9, stepT(s) + stepLen * 0.97 + 0.05 * br()], [Math.cos(a) * vr, vy, Math.sin(a) * vr, 15], [1, 0.22 + 0.12 * br(), 2 * vy / 15 + 0.03, 0]); } }
    for (let i = 0; i < nMud; i++) { const big = i >= 40, vy = big ? 2.5 + 3 * br() : 5 + 9 * br();          // flecks thrown high, and a dozen clods thrown low round the bill
      put([strikeAt.x + (br() - 0.5) * 2.5, strikeAt.y + 0.4, strikeAt.z + (br() - 0.5) * 2.5, tHit + 0.1 * br()], big ? [(br() - 0.5) * 7, vy, (br() - 0.4) * 6, 5.5] : [(br() - 0.5) * 9, vy, 1 + (br() - 0.3) * 7, 5.5],
        [2, big ? 0.28 + 0.2 * br() : 0.09 + 0.2 * br() * br(), big ? 2 * vy / 5.5 + 0.08 : 3.2, 0]); }
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.instanceCount = n;
    const m = gateMaterial(G, {
      uniforms: { uCamR: { value: V3(1, 0, 0) }, uCamU: { value: V3(0, 1, 0) }, uFew: { value: 0 } }, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vert: /* glsl */`attribute vec4 aA; attribute vec4 aV; attribute vec4 aC;
        uniform float uT, uTime, uFew; uniform vec3 uCamR, uCamU, uCamL; uniform vec2 uRes;
        varying vec2 vUv; varying float vKind; varying vec2 vS;
        vec3 bitAt(float time, float T, out float alive) {
          if (aC.x < 0.5) { float per = max((aA.w - aV.z) / 3., 0.5), ph = mod(time + aA.z, per); alive = 1. - uFew * step(0.5, aV.x);
            return vec3(aA.x + 1.25 * sin(time * 0.8 + aV.y), aA.w - 3. * ph, aA.y + 1.0 * cos(time * 0.63 + aV.y * 1.7)); }
          float tau = T - aA.w; alive = step(0., tau) * step(tau, aC.z);
          return aA.xyz + aV.xyz * tau - vec3(0., 0.5 * aV.w * tau * tau, 0.); }
        void main() { float al, al2; vec3 c = bitAt(uTime, uT, al), ca = bitAt(uTime - ${DELTA.toFixed(6)}, uT - ${DELTA.toFixed(6)}, al2);
          float d = max(distance(c, uCamL), 0.3), px = aC.y / (d * 1.2) * max(uRes.y, 1.);
          float minPx = (aC.x > 0.5 && aC.x < 1.5) ? 4.0 * max(uRes.y, 1.) / 450. : 1.1;      // a bead is never under about six 450ths of the frame across
          float size = aC.y * al * max(1., minPx / max(px, 1e-3)) * smoothstep(1.5, 9., d);
          vec3 off = (uCamR * position.x + uCamU * position.y) * size; vUv = position.xy; vKind = aC.x; vS = vec2(aV.y + uTime * 0.35 * step(aC.x, 0.5), size / (d * 1.2) * max(uRes.y, 1.));
          gate(c + off, ca + off); }`,
      frag: /* glsl */`varying vec2 vUv; varying float vKind; varying vec2 vS;
        void main() { float r = length(vUv); vec3 col; float a;
          if (vKind < 0.5) {                                   // thistledown: a parasol of fine hairs turning slowly, the seed hanging under it
            vec2 q = vUv - vec2(0., 0.12); float rq = length(q), ang = rq < 1e-3 ? 0. : atan(q.y, q.x) + vS.x;
            float f1 = 0.5 + 0.5 * cos(ang * 17.), f2 = 0.5 + 0.5 * cos(ang * 29. + 1.3); f1 *= f1; f1 *= f1; f2 *= f2; f2 *= f2;
            float fan = smoothstep(-0.5, 0.15, q.y / max(rq, 1e-3)), ragged = 1. + 0.16 * cos(ang * 5. + 2.) + 0.1 * cos(ang * 9.);   // polish 1: hairs fan up and out, uneven
            rq *= ragged;
            float hairs = fan * (f1 * (1. - smoothstep(0.5, 0.86, rq)) + 0.7 * f2 * (1. - smoothstep(0.35, 0.7, rq))) * smoothstep(0.02, 0.1, rq);
            float tips = fan * f1 * (1. - smoothstep(0.0, 0.07, abs(rq - 0.8))) * 0.9, halo = (1. - smoothstep(0., 0.88, rq)) * (0.35 + 0.65 * fan); halo *= halo * 0.42;
            float core = 1. - smoothstep(0.04, 0.12, rq);
            float seedA = (1. - smoothstep(0.6, 1., length((vUv - vec2(0., -0.5)) / vec2(0.07, 0.17)))), stalk = (1. - smoothstep(0.012, 0.035, abs(vUv.x))) * step(-0.5, vUv.y) * step(vUv.y, 0.12);
            float fine = clamp(hairs + tips + core, 0., 1.), lod = smoothstep(5., 22., vS.y);
            a = clamp(mix(halo * 2.1 + core, max(fine, halo), lod) + seedA + 0.6 * stalk, 0., 1.);
            a *= 0.92; col = mix(mix(vec3(1.38, 1.2, 0.8), vec3(1.34, 1.3, 1.12), smoothstep(0.1, 0.7, rq)), vec3(0.34, 0.2, 0.06), clamp(seedA + 0.5 * stalk, 0., 1.)); }
          else if (vKind < 1.5) { a = 1. - smoothstep(0.72, 0.96, r); col = vec3(1.25, 1.22, 1.0) * (0.75 + 0.5 * smoothstep(-0.9, 0.6, vUv.y)) + vec3(1.6, 1.5, 1.2) * (1. - smoothstep(0., 0.42, length(vUv - vec2(-0.28, 0.32)))); }
          else { a = 1. - smoothstep(0.62, 0.92, r + 0.1 * cos(atan(vUv.y, vUv.x + 1e-4) * 3. + vS.x * 5.)); col = vec3(0.1, 0.075, 0.045) * (0.7 + 0.9 * clamp(vUv.y * 0.5 + 0.5, 0., 1.)); }
          float g = gateOf(eyeSpeed());
          vec2 sp = gl_FragCoord.xy / max(uRes.y, 1.);
          float dim = 1. - 0.66 * uDim * smoothstep(0.28, 0.92, sp.y);
          gl_FragColor = vec4(col * dim, a * g); if (a * g <= 0.004) discard; }`,
    });
    add(new THREE.Mesh(g, m), 2); m.userData.seeds = seeds; return m;
  })();
  await ctx.yield();

  // ---- the heron: one mesh, 20 rigid bones posed on the CPU from T (now, one step ago, and two lags for the tail).
  // bones: 0 body, 1..8 neck rings, 9 head, 10/11/12 left thigh, shank, foot, 13/14/15 right, 16/17 left wing, 18/19 right wing.
  // aX.x carries the bone. While it stands nothing on it moves, so by the rule it is not there; it alone discards at g = 0.
  const NB = 20, LEG = 13.6, bc = look.bird;
  const hb = MB();
  { const cBody = lin(bc.body), cBelly = lin(bc.body).lerp(lin('#ffffff'), 0.45), cDark = lin(bc.dark), cNeck = lin(bc.neck), cBill = lin(bc.bill), cLeg = lin(bc.leg), cEye = lin('#F4D23C');
    const cPale = lin(bc.body).lerp(lin('#ffffff'), 0.3), cBillD = lin(bc.bill).multiplyScalar(0.45), cClaw = lin('#2A2620'), cTail = lin(bc.body).lerp(lin(bc.dark), 0.45);
    const withBone = (b, fn) => { const a = hb.count(); fn(); return [a, hb.count(), b]; }, spans = [];
    const crk = (K, z, c) => { let i = 1; while (i < K.length - 2 && z > K[i][0]) i++; const p0 = K[Math.max(0, i - 2)], p1 = K[i - 1], p2 = K[i], p3 = K[Math.min(K.length - 1, i + 1)], f = clamp((z - p1[0]) / (p2[0] - p1[0]), 0, 1), f2 = f * f, f3 = f2 * f;
      return 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * f + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * f2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * f3); };
    // a lofted skin along z: knots [z, centre y, half width, height above, depth below]; colour by (z, angle from the top, side)
    const loft = (K, rings, sides, cf) => { const first = hb.count(), z0 = K[0][0], z1 = K[K.length - 1][0], at = (j, i, o) => { const z = lerp(z0, z1, j / rings), a = i / sides * 6.2832, ca = Math.cos(a);
        return o.set(Math.sin(a) * Math.max(0.02, crk(K, z, 2)), crk(K, z, 1) + ca * Math.max(0.02, crk(K, z, ca > 0 ? 3 : 4)), z); };
      const q = V3(), q1 = V3(), q2 = V3(), q3 = V3(), q4 = V3();
      for (let j = 0; j <= rings; j++) for (let i = 0; i <= sides; i++) { at(j, i, q); at(j, i + 1, q1); at(j, i - 1, q2); at(Math.min(rings, j + 1), i, q3); at(Math.max(0, j - 1), i, q4);
        q1.sub(q2); q3.sub(q4); q2.crossVectors(q3, q1).normalize(); hb.v(q.x, q.y, q.z, q2.x, q2.y, q2.z, cf(q.z, i / sides * 6.2832, q)); }
      for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) { const a2 = first + j * (sides + 1) + i, b2 = a2 + sides + 1; hb.tri(a2, a2 + 1, b2); hb.tri(a2 + 1, b2 + 1, b2); } };
    // a plume: a tapering ribbon that starts at p along d and droops. aX.y = -1..1 across (the shader draws the shaft)
    const plume = (px, py, pz, dx, dy, dz, len, w, droop, c0, c1, nx = 0, ny = 1, nz = 0) => { const first = hb.count(), R = 4, col = new THREE.Color(), dl = Math.hypot(dx, dy, dz) || 1;
      let sx = dy * nz - dz * ny, sy = dz * nx - dx * nz, sz = dx * ny - dy * nx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      for (let i = 0; i <= R; i++) { const t = i / R, ww = w * (i === R ? 0.04 : Math.sin(Math.PI * (0.18 + 0.72 * t))), x = px + dx / dl * len * t, y = py + dy / dl * len * t - droop * t * t, z = pz + dz / dl * len * t; col.copy(c0).lerp(c1, t);
        hb.v(x - sx * ww, y - sy * ww, z - sz * ww, nx, ny, nz, col, 0, 9); hb.v(x + sx * ww, y + sy * ww, z + sz * ww, nx, ny, nz, col, 0, 11); }
      for (let i = 0; i < R; i++) { const a2 = first + i * 2; hb.tri(a2, a2 + 1, a2 + 2); hb.tri(a2 + 1, a2 + 3, a2 + 2); } };
    const hr = rng.fork ? rng.fork('heron-art') : rng;
    spans.push(withBone(0, () => {
      loft([[-20, 0.75, 0.05, 0.04, 0.04], [-17, 1.0, 1.1, 0.3, 0.3], [-13, 1.5, 2.0, 0.7, 0.6], [-9, 2.2, 3.0, 1.9, 1.7], [-5, 2.6, 3.9, 3.5, 3.5], [-1, 2.7, 4.4, 4.4, 4.7], [3, 2.6, 4.5, 4.8, 5.0], [7, 2.8, 4.2, 4.7, 4.8], [10, 3.2, 3.5, 4.0, 4.0], [12.5, 3.8, 2.4, 2.9, 2.6], [14, 4.2, 1.0, 1.4, 1.0]], 26, 28,
        (z, a) => { const ca = Math.cos(a), sa = Math.abs(Math.sin(a)); if (ca < -0.45) return cBelly; if (z > 4.5 && z < 10.5 && sa > 0.72 && ca > -0.4 && ca < 0.55) return cDark; return z < -11 ? cTail : cBody; });
      for (let i = -3; i <= 3; i++) plume(i * 0.42, 1.25 - 0.05 * Math.abs(i), -13.5, i * 0.13, -0.04, -1, 8.2 - 0.5 * Math.abs(i), 0.85, 0.35, cBody, cDark, 0, 1, 0);   // polish 1b: a closed rump and a short square tail fan, so from behind it is a bird, not a tube
      for (let i = 0; i < 16; i++) { const sx = i % 2 ? 1 : -1, t = hr();                          // scapular plumes over the back
        plume(sx * (0.8 + 2.6 * t), 6.9 - 1.3 * t, 5 - 5 * hr(), sx * (0.15 + 0.3 * t), -0.12, -1, 9 + 5 * hr(), 0.55, 1.6 + 1.2 * t, cPale, cBody, sx * 0.5 * t, 1, 0.1); }
      for (let i = 0; i < 14; i++) { const t = (i + 0.5) / 14 - 0.5;                               // breast plumes hanging from the base of the neck
        plume(t * 4.4, 3.4 + 1.5 * hr(), 12.6 - 3 * Math.abs(t), t * 0.5, -1, 0.12 - 0.3 * hr(), 5 + 3 * hr(), 0.42, -0.4, cNeck, cPale, t, 0.1, 1); }
    }));
    { const sides = 14, first = hb.count();                                       // neck: one ring per bone, so the tube follows the joints exactly
      for (let j = 0; j < 8; j++) { const r = lerp(2.3, 1.15, Math.pow(j / 7, 0.7)); for (let s2 = 0; s2 < sides; s2++) { const a = s2 / sides * 6.2832; hb.v(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), j === 0 ? cBody : cNeck, 1 + j, j / 7); } }
      for (let j = 0; j < 7; j++) for (let s2 = 0; s2 < sides; s2++) { const a = first + j * sides + s2, b2 = first + j * sides + (s2 + 1) % sides; hb.tri(a, b2, a + sides); hb.tri(b2, b2 + sides, a + sides); } }
    spans.push(withBone(9, () => {
      loft([[-2.2, 0.3, 0.35, 0.4, 0.4], [-1.5, 0.3, 1.15, 1.15, 1.1], [0, 0.35, 1.5, 1.5, 1.35], [1.6, 0.3, 1.45, 1.4, 1.2], [3.0, 0.1, 1.05, 1.05, 0.95], [4.2, 0, 0.8, 0.82, 0.78]], 12, 18,
        (z, a) => { const ca = Math.cos(a); if (ca > 0.3 && ca < 0.86 && z < 2.6) return cDark; return cNeck.clone().lerp(cBill, sst(1.9, 3.9, z) * (ca > -0.6 ? 1 : 0.4)); });
      hb.tube([V3(0, 0, 3.9), V3(0, 0, 6), V3(0, -0.06, 8.5), V3(0, -0.14, 10.8), V3(0, -0.25, 12.4)], (i) => [0.84, 0.7, 0.5, 0.27, 0.04][i], () => cBill, 10, (i) => [0, 3], false);
      hb.tube([V3(0, 0.7, 4), V3(0, 0.56, 7), V3(0, 0.12, 11.6)], (i) => [0.3, 0.22, 0.05][i], () => cBillD, 5, (i) => [0, 3], false);   // the dark ridge of the upper bill
      for (const sx of [-1, 1]) { hb.tube([V3(sx * 0.7, 1.25, -0.6), V3(sx * 0.9, 1.1, -4.5), V3(sx * 0.6, 0.0, -9.5)], (i) => [0.34, 0.26, 0.05][i], () => cDark, 5);   // the two crest plumes
        hb.blob(sx * 1.28, 0.42, 2.3, 0.3, 0.52, 0.52, () => cEye, 10); hb.blob(sx * 1.47, 0.42, 2.34, 0.17, 0.27, 0.27, () => cDark, 8); }
    }));
    for (const b0 of [10, 13]) {
      spans.push(withBone(b0, () => { hb.tube([V3(0, -1.5, 0), V3(0, 1.5, 0), V3(0, 4.5, 0), V3(0, 7, 0), V3(0, 10, 0), V3(0, LEG, 0)], (i) => [2.0, 1.75, 1.3, 0.86, 0.72, 0.74][i], (i) => (i < 3 ? cBody : i === 3 ? cPale : cLeg), 12, (i) => [0, 4]);
        for (let k = 0; k < 7; k++) { const a2 = k / 7 * 6.2832; plume(Math.cos(a2) * 1.2, 3.4, Math.sin(a2) * 1.2, Math.cos(a2) * 0.18, 1, Math.sin(a2) * 0.18, 4.6, 0.6, 0, cBody, cPale, Math.cos(a2), 0, Math.sin(a2)); }   // thigh feathers
        hb.blob(0, LEG, 0, 1.08, 1.0, 1.15, () => cLeg, 12); }));
      spans.push(withBone(b0 + 1, () => hb.tube([V3(0, 0, 0), V3(0, 4, 0), V3(0, 9, 0), V3(0, LEG - 0.6, 0), V3(0, LEG, 0)], (i) => [0.78, 0.66, 0.64, 0.7, 0.86][i], () => cLeg, 12, (i) => [0, 4])));
      spans.push(withBone(b0 + 2, () => { hb.blob(0, 0.15, 0, 0.95, 0.7, 0.95, () => cLeg, 10);
        for (const [x, z, L] of [[0, 1, 5.9], [0.46, 0.88, 5.2], [-0.46, 0.88, 5.2], [0, -1, 3.0]]) {
          hb.tube([V3(0, 0.25, 0), V3(x * L * 0.33, 0.02, z * L * 0.33), V3(x * L * 0.66, -0.2, z * L * 0.66), V3(x * L * 0.9, -0.4, z * L * 0.9)], (i) => [0.56, 0.5, 0.42, 0.34][i], () => cLeg, 8, (i) => [0, 4]);
          hb.blob(x * L * 0.33, 0.02, z * L * 0.33, 0.56, 0.5, 0.56, () => cLeg, 8); hb.blob(x * L * 0.66, -0.2, z * L * 0.66, 0.48, 0.42, 0.48, () => cLeg, 8);
          hb.tube([V3(x * L * 0.88, -0.38, z * L * 0.88), V3(x * L, -0.42, z * L), V3(x * (L + 0.9), -0.62, z * (L + 0.9))], (i) => [0.3, 0.22, 0.03][i], () => cClaw, 6); } }));
    }
    // a flight feather in a wing bone's YZ plane: root at (y, z0), running along (dy, dz), tilted like a louvre so neighbours overlap
    const feather = (sx, y, z0, dy, dz, len, w, c0, c1, lift) => { const first = hb.count(), dl = Math.hypot(dy, dz), ty = dy / dl, tz = dz / dl, R = 4, col = new THREE.Color();
      for (let i = 0; i <= R; i++) { const t = i / R, ww = w * (i === R ? 0.05 : 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.15 + t))), cy = y + ty * len * t, cz = z0 + tz * len * t; col.copy(c0).lerp(c1, t * t * t);
        hb.v(sx * (lift + 0.08), cy - tz * ww, cz + ty * ww, sx, 0, 0.18, col, 0, 9); hb.v(sx * (lift - 0.08), cy + tz * ww, cz - ty * ww, sx, 0, -0.18, col, 0, 11); }
      for (let i = 0; i < R; i++) { const a2 = first + i * 2; hb.tri(a2, a2 + 1, a2 + 2); hb.tri(a2 + 1, a2 + 3, a2 + 2); } };
    for (const [b0, sx] of [[16, -1], [18, 1]]) {                                // wings: +Y root to tip, feathers to -Z
      spans.push(withBone(b0, () => {
        hb.tube([V3(0, -0.5, 1.6), V3(0, 6, 1.9), V3(0, 12, 1.5)], (i) => [1.15, 0.85, 0.65][i], () => cBody, 8, (i) => [0, 5]);
        for (let i = 0; i < 11; i++) feather(sx, 0.4 + i * 1.12, 0.6, 0.12, -1, 7.6 + 0.12 * i, 1.2, cBody, cDark, 0);            // secondaries
        for (let i = 0; i < 9; i++) feather(sx, 0.2 + i * 1.4, 1.4, 0.1, -1, 4.4, 1.05, cPale, cBody, 0.3);                        // coverts over their roots
        for (let i = 0; i < 9; i++) feather(sx, 0.9 + i * 1.4, 1.6, 0.1, -1, 2.3, 1.0, cPale, cPale, 0.52); }));
      spans.push(withBone(b0 + 1, () => {
        hb.tube([V3(0, 0, 1.5), V3(0, 5, 1.1), V3(0, 9, 0.5)], (i) => [0.65, 0.45, 0.16][i], () => cBody, 8, (i) => [0, 5]);
        for (let i = 0; i < 11; i++) { const t = i / 10; feather(sx, 0.3 + t * 8.4, 0.9 - 0.5 * t, 0.1 + 1.6 * t * t, -1 + 0.75 * t * t, 8.2 + 3.4 * Math.sin(Math.PI * Math.min(1, 0.3 + t * 0.7)), 0.9, cDark.clone().lerp(cBody, 0.35), cDark, 0); }   // primaries, fanning to the tip
        for (let i = 0; i < 7; i++) feather(sx, 0.2 + i * 1.25, 1.2, 0.2 + 0.1 * i, -1, 3.8, 1.0, cBody, cDark, 0.3); }));
    }
    hb.spans = spans;
  }
  const heronGeo = hb.geo();
  { const ax = heronGeo.attributes.aX; for (const [a, b, bone] of hb.spans) for (let i = a; i < b; i++) ax.setX(i, bone); }
  const boneN = new Float32Array(NB * 12), boneA = new Float32Array(NB * 12), boneT = new Float32Array(NB);
  const heronM = gateMaterial(G, {
    uniforms: { uBn: { value: boneN }, uBa: { value: boneA }, uBt: { value: boneT } }, side: THREE.DoubleSide,
    vert: /* glsl */`attribute vec3 color; attribute vec2 aX; uniform vec4 uBn[${NB * 3}]; uniform vec4 uBa[${NB * 3}]; uniform float uBt[${NB}];
      varying vec3 vC; varying vec3 vN; varying float vTail; varying vec3 vObj; varying vec3 vOn; varying vec2 vBA;
      void main() { int b = int(aX.x + 0.5); int k = b * 3; vec4 q = vec4(position, 1.), n = vec4(normal, 0.);
        vec3 pn = vec3(dot(uBn[k], q), dot(uBn[k + 1], q), dot(uBn[k + 2], q)), pa = vec3(dot(uBa[k], q), dot(uBa[k + 1], q), dot(uBa[k + 2], q));
        vN = vec3(dot(uBn[k], n), dot(uBn[k + 1], n), dot(uBn[k + 2], n)); vC = color; vTail = uBt[b]; vObj = position; vOn = normal; vBA = aX;
        gate(pn, pa); }`,
    frag: /* glsl */`varying vec3 vC; varying vec3 vN; varying float vTail; varying vec3 vObj; varying vec3 vOn; varying vec2 vBA;
      void main() { vec3 n = normalize(vN + vec3(0., 1e-3, 0.)), v = normalize(uCamL - vP + vec3(0., 1e-3, 0.)); if (dot(n, v) < 0.) n = -n;
        float g = gateOf(max(eyeSpeed(), vTail)); if (g <= 0.) discard;
        // polish 1b: a limb that barely moves is barely there, and it is laid over whatever is behind it (seen water, its own ring) in
        // that proportion: a third of g by coverage, the rest by colour. Over the field the result is the rule's own mix; over seen
        // water it is no longer a field-coloured cut-out of a leg that has all but stopped.
        float cov = min(1., g * 3.), ign = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
        if (cov <= ign) discard;
        float bone = vBA.x, al = vBA.y, near = 1. - smoothstep(110., 260., distance(vP, uCamL)); vec3 alb = vC, extra = vec3(0.); float gloss = 0.;
        if (al > 8.5) {                                                             // a feather or plume (aX.y 9..11 across it): a pale shaft, fine barbs, light through it
          float ac = al - 10., shaft = 1. - smoothstep(0.03, 0.14, abs(ac)), barb = vn(vec2(ac * 9., dot(vObj, vec3(1.3, 2.1, 2.7))));
          alb = vC * (0.82 + 0.3 * barb * near) * (1. - 0.22 * smoothstep(0.75, 1., abs(ac))) + vec3(0.25) * shaft * near;
          extra = thru(alb, n, v) * 0.55;
        } else if (bone < 0.5) {                                                    // body: rows of overlapping feathers, streaks under the breast
          float ang = atan(vObj.x, vObj.y - 2.6 + 1e-4), row = vObj.z * 0.62, cx = ang * 2.9 + 0.5 * mod(floor(row), 2.);
          vec2 f = vec2(fract(cx) - 0.5, fract(row)); float sc = smoothstep(0.25, 0.62, length(f * vec2(1., 0.85)));
          alb = vC * mix(1., 1.1 - 0.42 * sc, near);
          alb *= 1. - 0.5 * near * smoothstep(0.6, 0.75, vn(vec2(vObj.x * 2.4, vObj.z * 0.35))) * (1. - smoothstep(-0.75, -0.2, vOn.y)) * step(4., vObj.z);
        } else if (bone < 8.5) {                                                    // neck: two rows of dark dashes down the front
          float r = max(length(vObj.xz), 1e-3), front = smoothstep(0.55, 0.9, -vObj.x / r) * (1. - smoothstep(0.985, 1., -vObj.x / r));
          alb = mix(alb, vec3(0.02, 0.022, 0.026), front * step(0.12, al) * smoothstep(0.45, 0.6, vn(vec2(al * 46., sign(vObj.z) * 3.))) * 0.9);
          alb *= 0.9 + 0.2 * vn(vec2(atan(vObj.z, vObj.x + 1e-4) * 6., al * 60.)) * near;
        } else if (bone < 9.5) { if (al > 2.5) { alb = vC * (0.9 + 0.2 * vn(vObj.zy * vec2(1.5, 6.))) * (1. - 0.5 * (1. - smoothstep(0.02, 0.1, abs(vObj.y + 0.02 + 0.02 * vObj.z))) * step(0.7, abs(vOn.x))); gloss = 0.5; }
          else gloss = 0.15 * step(1.2, abs(vObj.x)) * step(vObj.z, 3.) * step(1.8, vObj.z);
        } else if (bone < 15.5) {                                                   // legs and toes: rings of scutes, a paler shin plate
          float sy = (bone > 11.5 && bone < 12.5) || bone > 14.5 ? length(vObj.xz) : vObj.y;
          if (al > 3.5) alb = vC * (1. - 0.3 * near * smoothstep(0.75, 0.95, abs(fract(sy * 1.9) * 2. - 1.)) * 0.55) * (0.9 + 0.2 * vn(vObj.xy * 3.));
          gloss = 0.3; }
        vec3 c = shade(alb, n, 1.) + alb * uSkyC * 0.22 + extra;      // the bird's shadow side is blue grey, never black
        float fr = 1. - max(dot(n, v), 0.); fr *= fr;
        c += (uSkyC * 0.5 + uSunC * 0.12) * fr * (0.35 + gloss);                    // a soft rim: down and wet horn both catch the sky
        vec3 h = normalize(v + uSunD + vec3(0., 2e-3, 0.)); float sp = max(dot(n, h), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        c += uSunC * sp * gloss;
        gl_FragColor = vec4(finish(c, g / max(cov, 1e-3)), 1.); }`,
  });
  const heron = add(new THREE.Mesh(heronGeo, heronM), 1);
  await ctx.yield();

  // ---- the heron's pose at flight second T (a pure function of T): 20 matrices
  const UP = V3(0, 1, 0), _a = V3(), _b = V3(), _c = V3(), _x = V3(), _y = V3(), _z = V3(), tmp = V3(), tmp2 = V3();
  const frameY = (m, o, y, hint) => { _y.copy(y).normalize(); _x.crossVectors(_y, hint).normalize(); _z.crossVectors(_x, _y); return m.makeBasis(_x, _y, _z).setPosition(o); };   // +Y along the bone
  const frameZ = (m, o, z, up) => { _z.copy(z).normalize(); _x.crossVectors(up, _z).normalize(); _y.crossVectors(_z, _x); return m.makeBasis(_x, _y, _z).setPosition(o); };      // +Z forward
  const eb = (t) => lerp(t, t * t * (3 - 2 * t), 0.35), es = (t) => t * t * (3 - 2 * t);
  const mkPose = () => Array.from({ length: NB }, () => new THREE.Matrix4());
  const dirW = V3(), latW = V3(), hip = V3(), knee = V3(), ank = V3(), bpos = V3(), fwd = V3(), anc = V3(), bill = V3(), billS = V3(), neck = [V3(), V3(), V3(), V3(), V3()];
  const STAND = [[0, 0], [5, 7], [-1.5, 15], [1, 22], [4.5, 26.5]];
  const crAt = (t, out) => { const i = Math.min(3, Math.floor(t)), f = t - i, f2 = f * f, f3 = f2 * f, p0 = neck[Math.max(0, i - 1)], p1 = neck[i], p2 = neck[i + 1], p3 = neck[Math.min(4, i + 2)];
    return out.set(0, 0, 0).addScaledVector(p0, -0.5 * f3 + f2 - 0.5 * f).addScaledVector(p1, 1.5 * f3 - 2.5 * f2 + 1).addScaledVector(p2, -1.5 * f3 + 2 * f2 + 0.5 * f).addScaledVector(p3, 0.5 * f3 - 0.5 * f2); };
  const strikeDir = walkAt(bodyA[nStep], V3()).sub(strikeAt).setY(0).normalize().multiplyScalar(-1);   // on the ground, from the bird's last stand to the strike
  const LOOK_J = V3(-5.5, 12.5, -104.5), LOOK_D = V3(0.9, -0.15, -0.4).normalize();   // where the head goes to look for us, and where the bill points
  // polish 1: THE BIRD LEAVES. Having looked for us it wheels round, leaps hard and flies away down the open channel and up over the
  // reed fringe toward the far bank. We are hooking left at 16 degrees a second, so it crosses our eye from left to right (u 0.59 to
  // 0.75): it must cross, for a bird that kept its place in our eye would, by the rule, not be there. Keys about 1.07 s apart.
  const FLYK = [walkAt(bodyA[nStep], V3()).add(walkDir(bodyA[nStep], V3())).setY(21), V3(-11.5, 25, -126.5), V3(-18.5, 32.5, -153), V3(-29, 38.5, -177), V3(-39, 44, -193),
    V3(-50, 48, -208), V3(-63, 51, -221), V3(-78, 53, -232), V3(-94, 55, -241), V3(-111, 57, -248), V3(-129, 59, -253), V3(-147, 61, -256)];
  const ROLL = 0.14, FLYN = [[0, 0], [5, 3], [3, 7.5], [7, 9], [12, 7.5]];                       // the neck folded in an S, as a heron flies
  const fPos = V3(), fVel = V3(), fAnk = V3(), fT = V3(), fUp = V3();
  const flyAt = (p, out) => { const q = clamp(p, 0, FLYK.length - 1.001), i = Math.floor(q), f = q - i, f2 = f * f, f3 = f2 * f, n = FLYK.length - 1;
    const p0 = FLYK[Math.max(0, i - 1)], p1 = FLYK[i], p2 = FLYK[Math.min(n, i + 1)], p3 = FLYK[Math.min(n, i + 2)];
    return out.set(0, 0, 0).addScaledVector(p0, -0.5 * f3 + f2 - 0.5 * f).addScaledVector(p1, 1.5 * f3 - 2.5 * f2 + 1).addScaledVector(p2, -1.5 * f3 + 2 * f2 + 0.5 * f).addScaledVector(p3, 0.5 * f3 - 0.5 * f2); };
  const poseHeron = (T, M) => {
    let a = bodyA[0]; const fa = [0, 0], lift = [0, 0];
    for (let s = 0; s < nStep; s++) { const t = clamp((T - stepT(s)) / stepLen, 0, 1); a += (bodyA[s + 1] - bodyA[s]) * eb(t);
      if (t > 0) { const [side, f0, f1] = swings[s]; fa[side] = lerp(f0, f1, stepGo(s, t)); lift[side] = stepLift(s, t); } }
    const k = clamp((T - tStrike) / (tHit - tStrike), 0, 1), ks = sst(0, 0.6, k), kq = clamp((k - 0.6) / 0.4, 0, 1), kB = kq * kq, kw = sst(tHit - 0.1, tHit + 0.45, T);
    const ksN = ks * (1 - 0.8 * sst(tHit + 1.6, tHit + 2.5, T));           // the neck: thrown at the strike, held while the bird looks for us (polish 1), then drawn back up, out of our way
    const pitch = lerp(0.40, -0.34, ks);
    walkDir(a, dirW); latW.set(dirW.z, 0, -dirW.x); walkAt(a, bpos).addScaledVector(dirW, 1 * kB); bpos.y = 24.2 - 3.2 * ks;
    fwd.copy(dirW).multiplyScalar(Math.cos(pitch)); fwd.y = Math.sin(pitch);
    const tf = T - tHit - 1.1; let kLeg = 0, kN = 0, kFl = 0, roll = 0;
    if (tf > 0) { const p = tf / 1.07, pe = p - (1 - Math.exp(-2 * p)) / 2; flyAt(pe, fPos); flyAt(pe + 0.03, fVel).sub(fPos);
      if (fVel.lengthSq() < 1e-10) fVel.set(0, 0, -1); fVel.normalize();
      const kP = sst(0.5, 1.4, tf); roll = ROLL * sst(1.3, 2.6, tf); kLeg = sst(0.8, 1.6, tf); kN = sst(0.9, 1.9, tf); kFl = sst(0.9, 1.5, tf);
      const th0 = Math.atan2(dirW.x, dirW.z); let dth = Math.atan2(fVel.x, fVel.z) - th0; while (dth > 0) dth -= 6.2831853; while (dth <= -6.2831853) dth += 6.2831853;
      const th = th0 + kP * dth, pf = lerp(pitch, Math.asin(clamp(fVel.y, -1, 1)) + 0.1, kP);          // it wheels round by its left as it gathers
      bpos.copy(fPos); dirW.set(Math.sin(th), 0, Math.cos(th)); latW.set(dirW.z, 0, -dirW.x); fwd.copy(dirW).multiplyScalar(Math.cos(pf)); fwd.y = Math.sin(pf); }
    // it leans a little into its long left-hand curve
    frameZ(M[0], bpos, fwd, roll ? fUp.set(0, Math.cos(roll), 0).addScaledVector(latW, Math.sin(roll)) : UP);
    for (let sd = 0; sd < 2; sd++) { const b0 = sd ? 13 : 10;
      hip.set(sd ? 2.3 : -2.3, -0.5, 0).applyMatrix4(M[0]);
      footAt(sd, fa[sd], ank); ank.y = 0.5 + 11.5 * lift[sd];
      if (kLeg > 0) { fAnk.copy(hip).addScaledVector(fwd, -(2 * LEG - 0.4)); fAnk.y -= 2.5; ank.lerp(fAnk, kLeg); }        // legs trail straight out behind
      tmp.subVectors(ank, hip); let d = tmp.length(); const dmax = 2 * LEG - 0.05;
      if (d > dmax) { ank.copy(hip).addScaledVector(tmp, dmax / d); d = dmax; tmp.subVectors(ank, hip); }
      tmp.multiplyScalar(1 / Math.max(d, 1e-3));
      tmp2.copy(dirW).multiplyScalar(-1); tmp2.addScaledVector(tmp, -tmp2.dot(tmp)).normalize();
      knee.copy(hip).addScaledVector(tmp, d / 2).addScaledVector(tmp2, Math.sqrt(Math.max(0, LEG * LEG - d * d / 4)));
      frameY(M[b0], hip, _a.subVectors(knee, hip), dirW);
      frameY(M[b0 + 1], knee, _a.subVectors(ank, knee), dirW);
      _a.copy(dirW).multiplyScalar(Math.cos(lift[sd] * 1.1)); _a.y = -Math.sin(lift[sd] * 1.1);
      if (kLeg > 0) _a.lerp(fT.set(-fwd.x, -0.6, -fwd.z), kLeg).normalize();
      frameZ(M[b0 + 2], ank, _a, UP); }
    anc.set(0, 5.2, 11.5).applyMatrix4(M[0]);
    billS.set(strikeDir.x * 0.7, -0.714, strikeDir.z * 0.7); _b.copy(strikeAt).addScaledVector(billS, -12.4 - 10 * (1 - kB));
    // polish 1: having missed, it jerks its bill out of the mud and swings its head after us (head, eye and bill across the lower
    // frame as we pass under the wing, u 0.51 to 0.53), then the neck goes back up out of our way
    const kL = sst(tHit + 1.05, tHit + 1.5, T); _b.lerp(LOOK_J, kL);
    for (let i = 0; i < 5; i++) { const t = i / 4;
      _c.copy(anc).addScaledVector(dirW, STAND[i][0]); _c.y = anc.y + STAND[i][1];
      tmp2.lerpVectors(anc, _b, t); tmp2.y += 8 * Math.sin(Math.PI * t) * (1 - 0.4 * t);
      neck[i].lerpVectors(_c, tmp2, ksN); }
    if (kN > 0) { fUp.setFromMatrixColumn(M[0], 1); for (let i = 0; i < 5; i++) neck[i].lerp(tmp2.copy(anc).addScaledVector(fwd, FLYN[i][0]).addScaledVector(fUp, FLYN[i][1]), kN); }
    for (let j = 0; j < 8; j++) { const t = j / 7 * 4; crAt(t, tmp); crAt(Math.min(4, t + 0.05), _a); crAt(Math.max(0, t - 0.05), _c); _a.sub(_c);
      if (_a.lengthSq() < 1e-8) _a.copy(UP); frameY(M[1 + j], tmp, _a, latW); }
    bill.copy(dirW); bill.y = -0.12; bill.lerp(tmp2.lerpVectors(billS, LOOK_D, kL), ksN * (1 - kN)).normalize();
    if (kN > 0) bill.lerp(fT.set(fwd.x, fwd.y - 0.1, fwd.z), kN).normalize();
    frameZ(M[9], neck[4], bill, UP);
    // wings: folded while it stalks; at the strike they are thrown forward and out over us like a canopy, the flight feathers hanging
    // down across the top of the frame; then they lift up and back, clear of our way past
    const km = kw * (1 - sst(tHit + 0.9, tHit + 1.9, T)), flap = (T - tHit) * 10.7;        // 1.7 beats a second
    for (const [b0, sx] of [[16, -1], [18, 1]]) {
      const sh = tmp.set(sx * 4.3, 5.0, 6.5).applyMatrix4(M[0]);
      _a.set(sx * lerp(lerp(0.06, 0.55, kw), 0.86, km), lerp(lerp(-0.12, 0.85, kw), 0.36, km), lerp(lerp(-1, -0.25, kw), 0.52, km));
      _b.set(0, lerp(lerp(1, 0.25, kw), 0.9, km), lerp(lerp(0.15, 1, kw), 0.42, km));
      if (kFl > 0) { const a1 = 0.12 + 0.6 * Math.sin(flap); _a.lerp(fT.set(sx * Math.cos(a1), Math.sin(a1), 0.05), kFl).normalize(); _b.lerp(fT.set(0, 0.12, 1), kFl); }
      _a.transformDirection(M[0]); _b.transformDirection(M[0]);
      frameY(M[b0], sh, _a, _b); tmp2.copy(sh).addScaledVector(_y, 12);
      _a.set(sx * lerp(lerp(0.05, 0.9, kw), 0.92, km), lerp(lerp(-0.3, 0.42, kw), 0.02, km), lerp(lerp(-1, -0.2, kw), 0.46, km));
      _b.set(0, lerp(lerp(1, 0.25, kw), 0.9, km), lerp(lerp(0.15, 1, kw), 0.42, km));
      if (kFl > 0) { const a2 = -0.05 + 0.85 * Math.sin(flap - 1.0); _a.lerp(fT.set(sx * Math.cos(a2), Math.sin(a2), -0.15), kFl).normalize(); _b.lerp(fT.set(0, 0.12, 1), kFl); }   // the hand lags the arm
      _a.transformDirection(M[0]); _b.transformDirection(M[0]);
      frameY(M[b0 + 1], tmp2, _a, _b); }
  };
  const poses = [mkPose(), mkPose(), mkPose(), mkPose(), mkPose(), mkPose()];   // now, ago, lag .2 (and its ago), lag .4 (and its ago)
  const boneTip = []; for (let b = 0; b < NB; b++) boneTip.push(b === 0 ? V3(0, 4, 12) : b === 9 ? V3(0, 0, 12) : (b >= 10 && b <= 15) ? V3(0, (b - 10) % 3 === 2 ? 0 : LEG, (b - 10) % 3 === 2 ? 5 : 0) : b >= 16 ? V3(0, 13, -3) : V3(0, 0, 0));
  const packBones = (M, out) => { for (let b = 0; b < NB; b++) { const e = M[b].elements, o = b * 12;
    out[o] = e[0]; out[o + 1] = e[4]; out[o + 2] = e[8]; out[o + 3] = e[12]; out[o + 4] = e[1]; out[o + 5] = e[5]; out[o + 6] = e[9]; out[o + 7] = e[13]; out[o + 8] = e[2]; out[o + 9] = e[6]; out[o + 10] = e[10]; out[o + 11] = e[14]; } };
  await ctx.yield();

  // ==== flight1 THING TWO (begin; it comes out whole by removing this block: nothing outside it knows of it) ====
  // THE POND RUNS OFF THE HERON'S LEGS AT TAKE-OFF, as FREE DROPS (the mend a2). Eight strings: the three front toes of each foot and
  // each hock. They are parts of the heron: every drop is baked here from a table made by stepping its own pose (never from u), and
  // drawn from T alone (uT, which live's bits read). A leg sheds from the moment it trails (after the last moment its ankle stands at
  // wading height, the first at which the pose has it trailing): RIB_RATE drops a second per string then, evenly fewer, none RIB_DRY
  // seconds on. A drop leaves with its limb's own velocity and is free from then on: the air takes its speed (a time of RIB_AIR
  // seconds), the drops' own gravity pulls it down, and it is gone where it meets the water. Every chance is a hash of the string's
  // and the drop's own numbers (ribH): no stream is read.
  // RIB_RATE 14: the pull that parts a drop from its toe is the air's (25 m/s of bird over 1 s) and gravity's, 29 m/s2 together; two
  // drops let go 1/14 s apart stand a drop's length apart 0.29 s later, 1.2 m from the toe: no run of touching drops over three widths.
  const RIB_E = 8, RIB_DRY = 6, RIB_RATE = 14, RIB_G = 15, RIB_DT = 0.04, RIB_AIR = 1, RIB_JIT = 0.7, RIB_SIDE = 0.6;
  const ribPose = mkPose(), ribLocal = [V3(0, -0.4, 5.9), V3(2.392, -0.4, 4.576), V3(-2.392, -0.4, 4.576), V3(0, 0, 0)];   // toe ends as the foot is built; the hock is the shank's origin
  const ribOff = [0, 0];                                       // per foot: the second from which its leg trails
  for (let sd = 0; sd < 2; sd++) { const b = (sd ? 13 : 10) + 2, wading = (T) => { poseHeron(T, ribPose); return ribPose[b].elements[13] <= 0.5 + 1e-3; };
    let lo = clock.total; while (lo > 0 && !wading(lo)) lo -= 0.1;                 // back from the flight's end to a standing foot
    let hi = Math.min(clock.total, lo + 0.1); for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (wading(mid)) lo = mid; else hi = mid; }
    // legs trailing: the first moment after that at which the ankle is within its own radius (0.86 m, the shank's end as built) of the
    // place the pose trails it to: behind the hip by 2 LEG - 0.4 along the body and 2.5 m lower, and no farther from the hip than the
    // leg reaches (2 LEG - 0.05): poseHeron's own law with its own reach, read from its matrices. With the reach in, the ankle of a
    // fully trailed leg IS that place, whatever the climb, so the moment is always found.
    let tr = lo; for (; tr < clock.total; tr += 0.02) { poseHeron(tr, ribPose); const hipP = tmp2.setFromMatrixPosition(ribPose[b - 2]);
      tmp.setFromMatrixColumn(ribPose[0], 2).multiplyScalar(-(2 * LEG - 0.4)); tmp.y -= 2.5; tmp.multiplyScalar(Math.min(1, (2 * LEG - 0.05) / Math.max(tmp.length(), 1e-3))).add(hipP);
      if (tmp.distanceTo(tmp2.setFromMatrixPosition(ribPose[b])) <= 0.86) break; }
    ribOff[sd] = tr; await ctx.yield(); }
  const ribT0 = Math.min(ribOff[0], ribOff[1]) - RIB_DT, ribT1 = Math.max(ribOff[0], ribOff[1]) + RIB_DRY + RIB_DT, ribNT = Math.ceil((ribT1 - ribT0) / RIB_DT) + 2;
  const ribTab = new Float32Array(RIB_E * ribNT * 3);
  for (let k = 0; k < ribNT; k++) { poseHeron(ribT0 + k * RIB_DT, ribPose);
    for (let e = 0; e < RIB_E; e++) { const b0 = e < 4 ? 10 : 13, j = e % 4; tmp.copy(ribLocal[j]).applyMatrix4(ribPose[j === 3 ? b0 + 1 : b0 + 2]); ribTab.set([tmp.x, tmp.y, tmp.z], (e * ribNT + k) * 3); }
    if (k % 60 === 59) await ctx.yield(); }
  const ribAt = (e, T, out) => { const x = clamp((T - ribT0) / RIB_DT, 0, ribNT - 1.001), i = Math.floor(x), f = x - i, o = (e * ribNT + i) * 3;
    return out.set(lerp(ribTab[o], ribTab[o + 3], f), lerp(ribTab[o + 1], ribTab[o + 4], f), lerp(ribTab[o + 2], ribTab[o + 5], f)); };
  // the drops: drop i of string e leaves when the string's count of drops (RIB_RATE s - RIB_RATE s2 / (2 RIB_DRY), s seconds after
  // its leg trails) reaches i + RIB_JIT x hash: uneven moments, fewer and fewer, the last near RIB_DRY
  const ribH = (e, i, k) => { const x = Math.sin(e * 127.1 + i * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };
  const RIB_PER = Math.floor(RIB_RATE * RIB_DRY / 2), ribND = RIB_E * RIB_PER, ribP = new Float32Array(ribND * 4), ribV4 = new Float32Array(ribND * 4), ribC4 = new Float32Array(ribND * 4);
  { const c = V3(), w = V3(), w0 = V3();
    for (let e = 0; e < RIB_E; e++) { for (let i = 0; i < RIB_PER; i++) { const o = (e * RIB_PER + i) * 4, n = i + RIB_JIT * ribH(e, i, 1);
        const ts = ribOff[e < 4 ? 0 : 1] + RIB_DRY * (1 - Math.sqrt(Math.max(0, 1 - n / (RIB_RATE * RIB_DRY / 2))));
        ribAt(e, ts, c); ribAt(e, ts + RIB_DT / 2, w).sub(ribAt(e, ts - RIB_DT / 2, w0)).multiplyScalar(1 / RIB_DT);   // the limb's own velocity then
        const a = ribH(e, i, 2) * 6.2832, sv = RIB_SIDE * ribH(e, i, 3); w.x += sv * Math.cos(a); w.z += sv * Math.sin(a);   // no two leave quite alike
        const k = 1 / (RIB_AIR * (0.8 + 0.45 * ribH(e, i, 4)));                                    // small drops slow sooner: a string spreads
        const yAt = (tau) => { const E = (1 - Math.exp(-k * tau)) / k; return c.y + w.y * E + RIB_G / k * (E - tau); };
        let life = 0; if (c.y > 0) { let t1 = 0.05; while (t1 < 20 && yAt(t1) > 0) t1 += 0.05;     // until it meets the water
          const ya = yAt(t1 - 0.05), yb = yAt(t1); life = t1 - 0.05 + 0.05 * ya / Math.max(1e-6, ya - yb); }
        ribP.set([c.x, c.y, c.z, ts], o); ribV4.set([w.x, w.y, w.z, k], o); ribC4.set([0.27 + 0.1 * ribH(e, i, 5), life, ribH(e, i, 6), 0], o); }
      await ctx.yield(); } }
  const ribGeo = new THREE.InstancedBufferGeometry(); ribGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); ribGeo.setIndex([0, 1, 2, 0, 2, 3]);
  ribGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(ribP, 4)); ribGeo.setAttribute('aV', new THREE.InstancedBufferAttribute(ribV4, 4)); ribGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(ribC4, 4)); ribGeo.instanceCount = ribND;
  // a drop is a ball of clear water turned to the eye, at its own size in metres (live's bead, no floor in pixels; near the lens live's
  // own law for bits), drawn out along its fall by the way it goes in half a film frame, never beyond three widths. A mover: now and
  // ago from the same law of fall; it discards where its gate is 0, as live's drops and rigid movers do.
  const ribM = gateMaterial(G, { side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vert: /* glsl */`attribute vec4 aP; attribute vec4 aV; attribute vec4 aC; uniform float uT; uniform vec3 uCamL, uSunD;
      varying vec2 vUv; varying vec2 vGl; varying vec2 vUp; varying vec2 vSn;
      vec3 dropAt(float tau) { float E = (1. - exp(-aV.w * tau)) / max(aV.w, 0.1); return aP.xyz + aV.xyz * E + vec3(0., ${RIB_G.toFixed(1)} / max(aV.w, 0.1) * (E - tau), 0.); }
      void main() { float tau = uT - aP.w, alive = step(0., tau) * step(tau, aC.y), ek = exp(-aV.w * clamp(tau, 0., 20.));
        vec3 c = dropAt(clamp(tau, 0., 20.)), ca = dropAt(clamp(tau, 0., 20.) - ${DELTA.toFixed(6)});
        vec3 vel = aV.xyz * ek - vec3(0., ${RIB_G.toFixed(1)} / max(aV.w, 0.1) * (1. - ek), 0.);
        float d = max(distance(c, uCamL), 0.3); vec3 toC = (uCamL - c) / d;
        vec3 ax = vel - toC * dot(vel, toC); float sp = length(ax);                                 // its speed across the line of sight
        ax = ax + vec3(2e-3, 1e-3, 0.) - toC * dot(vec3(2e-3, 1e-3, 0.), toC); ax = ax / max(length(ax), 1e-5);
        vec3 sd = cross(toC, ax); sd = sd / max(length(sd), 1e-5);
        float size = aC.x * alive * smoothstep(1.5, 9., d), lng = min(size + sp / 120., 3. * size);
        vec3 off = sd * position.x * size + ax * position.y * lng; vUv = position.xy;
        vec3 h = toC + uSunD; h = h / max(length(h), 1e-4);                                          // where the ball mirrors the sun, where its up is, where the sun is
        vGl = vec2(dot(h, sd), dot(h, ax)); vUp = vec2(sd.y, ax.y); vSn = vec2(dot(uSunD, sd), dot(uSunD, ax));
        gate(c + off, ca + off); }`,
    frag: /* glsl */`uniform vec3 uUnder; varying vec2 vUv; varying vec2 vGl; varying vec2 vUp; varying vec2 vSn;
      void main() { float g = gateOf(eyeSpeed()); if (g <= 0.) discard;
        vec2 q = vec2(vUv.x / mix(1., 0.5, clamp(-vUv.y, 0., 1.)), vUv.y);                          // the end that trails is drawn in to half its width
        float r2 = dot(q, q); if (r2 >= 1.) discard;
        float rim = r2 * r2, edge = 1. - smoothstep(0.8, 1., r2);
        // clear water: the middle is see-through and shows the world upside down (the pond's dark above, the sky below); the edge is
        // a little darker, but for one bright crescent toward the low sun; one glint where the ball mirrors the sun
        float up = dot(vUv, vUp) / max(length(vUp), 0.2), cres = rim * smoothstep(0., 0.9, dot(vUv, vSn) / max(length(vSn), 0.2));
        vec3 thr = mix(skyCol(0.3) * 0.9, uUnder * 0.3, smoothstep(-0.35, 0.45, up));
        vec3 col = mix(mix(thr, thr * 0.55, rim), vec3(1.25, 1.22, 1.0), cres);
        float gl = 1. - smoothstep(0.06, 0.3, length(vUv - vGl * 0.85));
        col += vec3(1.6, 1.5, 1.2) * gl;
        float a = clamp(0.26 + 0.2 * rim + 0.5 * cres + gl, 0., 1.) * edge * g; if (a <= 0.004) discard;
        gl_FragColor = vec4(finish(col, 1.), a); }` });
  add(new THREE.Mesh(ribGeo, ribM), 2);
  // ==== flight1 THING TWO (end) ====

  // ---- small rigid movers, each placed by one matrix now and one a step ago: damselfly, fly, tongue, and (rare) a second frog
  const rigid = (geo) => { const m = gateMaterial(G, { uniforms: { uMn: { value: new THREE.Matrix4() }, uMa: { value: new THREE.Matrix4() }, uTailS: { value: 0 } }, side: THREE.DoubleSide,
      vert: /* glsl */`attribute vec3 color; uniform mat4 uMn; uniform mat4 uMa; varying vec3 vC; varying vec3 vN;
        void main() { vC = color; vN = mat3(uMn) * normal; gate((uMn * vec4(position, 1.)).xyz, (uMa * vec4(position, 1.)).xyz); }`,
      frag: /* glsl */`uniform float uTailS; varying vec3 vC; varying vec3 vN;
        void main() { vec3 n = normalize(vN + vec3(0., 1e-3, 0.)), v = normalize(uCamL - vP + vec3(0., 1e-3, 0.)); if (dot(n, v) < 0.) n = -n;
          float g = gateOf(max(eyeSpeed(), uTailS)); if (g <= 0.) discard;
          float fr = 1. - max(dot(n, v), 0.); fr *= fr;
          vec3 h = normalize(v + uSunD + vec3(0., 2e-3, 0.)); float sp = max(dot(n, h), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
          vec3 c = shade(vC, n, 1.) + thru(vC, n, v) * 0.5 + (uSkyC * 0.38 + vC * 0.2) * fr + uSunC * sp * 0.4;    // wet skin and chitin: a sky rim and a small hot glint
          gl_FragColor = vec4(finish(c, g), 1.); }` });
    add(new THREE.Mesh(geo, m), 1); return { m, now: m.uniforms.uMn.value, ago: m.uniforms.uMa.value, lag: new THREE.Matrix4(), lag2: new THREE.Matrix4(), at: null }; };
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), XA = V3(1, 0, 0);
  const props = [];
  { // damselfly: a blue line that zigzags in from the left and lands on the bent rush
    const g = MB(), blue = lin('#2F7BE0').multiplyScalar(1.5), pale = lin('#CFE4F2'), dk = lin('#16324F');
    const abd = []; for (let i = 0; i <= 12; i++) abd.push(V3(0, 0.02 - 0.012 * i - 0.0035 * i * i, 0.1 - i * 0.125));
    g.tube(abd, (i) => (i === 0 ? 0.1 : i > 10 ? 0.075 : 0.062 + 0.012 * (i % 2)), (i) => (i % 3 === 2 ? dk : blue), 8);                 // abdomen: blue segments, dark joints
    g.blob(0, 0.06, 0.35, 0.19, 0.2, 0.3, (n) => (n.y > 0.55 ? dk : blue), 10);                                                           // thorax, a dark saddle
    g.blob(0, 0.05, 0.7, 0.12, 0.11, 0.1, () => dk, 8);
    for (const sx of [-1, 1]) { g.blob(sx * 0.17, 0.08, 0.72, 0.12, 0.12, 0.12, () => blue, 8);                                           // eyes set wide, like a hammerhead
      g.petal(sx * 0.08, 0.22, 0.42, sx * 2.0, 0.42, 1.3, 0.13, -0.1, pale, pale, 0.05); g.petal(sx * 0.08, 0.22, 0.27, sx * 2.25, 0.3, 1.22, 0.12, -0.1, pale, pale, 0.05);
      for (const zz of [0.5, 0.36, 0.22]) g.tube([V3(sx * 0.1, -0.08, zz), V3(sx * 0.3, -0.2, zz + 0.06), V3(sx * 0.34, -0.42, zz + 0.02)], () => 0.018, () => dk, 3, null, false); }
    const P = rigid(g.geo()), d0 = V3(-25, 9.5, -98), d1 = rushTip.clone().add(V3(0, 0.3, 0)), dur = Math.max(0.5, tDamsel1 - tDamsel0 - 0.3), q = V3(), q2 = V3();
    const posAt = (T, out) => { const e = clamp((T - tDamsel0) / dur, 0, 1), eo = 1 - (1 - e) * (1 - e); out.lerpVectors(d0, d1, eo);
      out.y += 3.0 * (1 - e) * Math.sin(e * 17.3); out.z += 2.6 * (1 - e) * Math.cos(e * 12.6) - 2.6 * (1 - e); return out; };
    // polish 1b: perched, it has not moved since it landed, so it has not been there. In the wind's last breath (u 0.334 to 0.349) its
    // rush nods and carries it through a small loop: for those seconds the damselfly is there again, blue on a bending straw-gold tip,
    // at the upper right of the frame, and when the wind drops it goes with the rush. The same sum as windSway() in the still material.
    const rushNod = (time, out) => { const h = Math.max(rushTip.y - 1.2, 0), a = time * 6.5 + rushTip.x * 0.37 + rushTip.z * 0.23, b = time * 9.7 + rushTip.z * 0.4, sw = Math.sin(a) + 0.3 * Math.sin(b),
      k = G.uWind.value * 1.2 * (1 - Math.exp(-h * h / 6)); return out.set(0.8 * k * sw, 0.5 * k * Math.cos(a), 0.6 * k * sw); };
    const nod = V3();
    P.at = (T, time, m) => { if (T < tDamsel0) return m.copy(ZERO); posAt(T, q); posAt(T + 0.03, q2).sub(q); if (q2.lengthSq() < 1e-6) q2.set(1, 0.1, 0.2);
      q.addScaledVector(rushNod(time, nod), sst(tDamsel1 - 0.6, tDamsel1 - 0.3, T)); return frameZ(m, q, q2, UP); };
    props.push(P); }
  const mouth = V3(SIT.x + 0.1, SIT.y - 1.25, SIT.z - 0.55), tTongue = tFly1 - 0.25;
  const flyA = V3(4.6, 1.3, -90.2), flyB = V3(2.2, 1.3, -90.5), flyC = V3(0.5, 1.3, -88.4);
  const tongueExt = (T) => { const x = T - tTongue; return x <= 0 || x >= 0.25 ? 0 : x < 0.1 ? x / 0.1 : 1 - (x - 0.1) / 0.15; };
  { // fly: walks, stops (and is gone), walks nearer, is taken
    const g = MB(), dk = lin('#2A2A26'), wing = lin('#A9A99A');
    g.blob(0, 0, 0, 0.3, 0.26, 0.42, () => dk, 8); g.blob(0, 0.05, 0.42, 0.2, 0.19, 0.19, () => lin('#5A2A20'), 6);
    for (const sx of [-1, 1]) { const f = g.count(); g.v(0, 0.24, 0.1, 0, 1, 0, wing); g.v(sx * 0.42, 0.3, -0.75, 0, 1, 0, wing); g.v(sx * 0.1, 0.3, -0.85, 0, 1, 0, wing); g.tri(f, f + 1, f + 2);
      for (const zz of [0.25, 0, -0.25]) g.tube([V3(sx * 0.15, -0.1, zz), V3(sx * 0.5, 0.05, zz * 1.6), V3(sx * 0.62, -0.38, zz * 2)], () => 0.035, () => dk, 3, null, false); }
    const P = rigid(g.geo()), D = tFly1 - tFly0, q = V3(), q2 = V3();
    const posAt = (T, out) => { const x = (T - tFly0) / D; if (T >= tTongue + 0.1) return out.lerpVectors(mouth, flyC, tongueExt(T));
      if (x < 0.32) return out.lerpVectors(flyA, flyB, clamp(x / 0.32, 0, 1)); if (x < 0.6) return out.copy(flyB); return out.lerpVectors(flyB, flyC, clamp((x - 0.6) / 0.22, 0, 1)); };
    P.at = (T, time, m) => { if (T >= tTongue + 0.25) return m.copy(ZERO); posAt(T, q); const x = (T - tFly0) / D; q2.subVectors(x < 0.45 ? flyB : flyC, x < 0.45 ? flyA : flyB);
      frameZ(m, q, q2, UP); return m.scale(tmp.set(1.5, 1.5, 1.5)); };
    props.push(P); }
  { // tongue: one pink ribbon from under the frame to the fly and back in a quarter of a second
    const g = MB(), pink = lin('#E88C9A'), tipC = lin('#F2A9B2');
    g.tube([V3(0, 0, 0), V3(0, 0.5, 0), V3(0, 0.9, 0), V3(0, 0.97, 0), V3(0, 1.02, 0)], (i) => [0.34, 0.26, 0.24, 0.42, 0.2][i], (i) => (i > 2 ? tipC : pink), 10);
    const P = rigid(g.geo()), q = V3();
    P.at = (T, time, m) => { const e = tongueExt(T); if (e <= 0) return m.copy(ZERO); q.subVectors(flyC, mouth); const L = q.length() * e; frameY(m, mouth, q, XA); return m.scale(tmp.set(1, L, 1)); };
    props.push(P); }
  // the rare event: a second frog has sat on the mud to our right the whole time, unseen because it never moved. It jumps when we do.
  const tLand = Tu(0.70); let frogSplash = null;
  if (rare) {
    const g = MB(), fg = lin('#6E8A3A'), fb = lin('#C9C58A'), dk = lin('#2B3A1E');
    const fd = lin('#3F5A22'), gold = lin('#D8B23A'), skin = (n) => (n.y < -0.25 ? fb : (ctx.noise.n3(n.x * 3.1, n.y * 3.1, n.z * 3.1) > 0.28 ? fd : fg));
    g.blob(0, 0, 0, 1.5, 1.05, 2.2, skin, 18); g.blob(0, 0.2, 1.85, 1.2, 0.78, 1.15, skin, 16);
    for (const sx of [-1, 1]) { g.blob(sx * 0.72, 0.92, 2.05, 0.42, 0.4, 0.44, (n) => (n.y > 0.1 || sx * n.x > 0.2 ? gold : fg), 10); g.blob(sx * 0.86, 1.02, 2.12, 0.2, 0.26, 0.3, () => dk, 8);
      g.tube([V3(sx * 1.2, -0.3, -1.4), V3(sx * 1.9, -0.55, -3.0), V3(sx * 1.7, -0.65, -4.6), V3(sx * 1.5, -0.7, -6.0), V3(sx * 1.9, -0.78, -7.2)], (i) => [0.78, 0.6, 0.36, 0.3, 0.26][i], (i) => (i % 2 ? fd : fg), 10);
      g.blob(sx * 1.9, -0.55, -3.0, 0.66, 0.6, 0.7, () => fg, 8);
      for (let k = -2; k <= 2; k++) g.tube([V3(sx * 1.9, -0.78, -7.2), V3(sx * 1.9 + k * 0.42, -0.84, -8.3), V3(sx * 1.9 + k * 0.75, -0.9, -9.3)], (i) => 0.13 - 0.03 * i, () => fg, 4);
      for (let k = -2; k < 2; k++) { const f = g.count(); g.v(sx * 1.9, -0.8, -7.2, 0, 1, 0, fb); g.v(sx * 1.9 + k * 0.75, -0.9, -9.2, 0, 1, 0, fb); g.v(sx * 1.9 + (k + 1) * 0.75, -0.9, -9.2, 0, 1, 0, fb); g.tri(f, f + 1, f + 2); }   // the web
      g.tube([V3(sx * 1.2, -0.5, 1.2), V3(sx * 1.85, -1.2, 1.9), V3(sx * 2.2, -1.55, 2.9)], (i) => 0.32 - 0.06 * i, () => fg, 8);
      for (let k = -1; k <= 1; k++) g.tube([V3(sx * 2.2, -1.55, 2.9), V3(sx * 2.2 + k * 0.4, -1.65, 3.7)], (i) => 0.1 - 0.04 * i, () => fg, 4); }
    const P = rigid(g.geo()), sitAt = V3(8.5, 1.95, -96), q = V3(), q2 = V3(), cl = V3(), side = V3();
    const posAt = (T, out) => { if (T <= tJump) return out.copy(sitAt);
      const uu = clock.uOf(T) + 0.036; path.pointAt(uu, cl); cl.x *= mir; cl.z -= CARRY_END; path.tangentAt(uu, side); side.x *= mir; side.set(-side.z, 0, side.x).normalize();
      cl.addScaledVector(side, 7.5).y -= 1.2; const fall = Math.max(0, T - Tu(0.63)); cl.y -= 5.5 * fall * fall;
      return out.lerpVectors(sitAt, cl, sst(tJump, tJump + 0.9, T)); };
    P.at = (T, time, m) => { posAt(T, q); if (q.y < -1.5) return m.copy(ZERO); posAt(T + 0.04, q2).sub(q); if (q2.lengthSq() < 1e-6) q2.set(0.1, 0.1, -1); return frameZ(m, q, q2, UP); };
    props.push(P);
    // when and where it meets the water (found once, here)
    for (let T = Tu(0.63); T < Tu(0.63) + 4; T += 0.02) { posAt(T, q); if (q.y < 0) { frogSplash = { x: q.x, z: q.z, t: T }; break; } }
  }
  await ctx.yield();

  // ---- every frame: the camera now and one nominal step ago, the pond's ride, the script. No state is kept between frames.
  const Fn = new THREE.Matrix4(), Fa = new THREE.Matrix4(), camAgo = new THREE.Matrix4(), viewAgo = new THREE.Matrix4(), pondAgo = new THREE.Matrix4(), pvNow = new THREE.Matrix4(), viewNow = new THREE.Matrix4();
  const pN = V3(), pA = V3(), tN = V3(), tA = V3(), tgt = V3(), res = new THREE.Vector2(), w1 = V3(), w2 = V3(), flip = new THREE.Matrix4().makeScale(mir, 1, 1);
  const frameOf = (u, m, p, t) => { path.pointAt(u, p); path.tangentAt(u, t); m.lookAt(p, tgt.copy(p).add(t), UP); return m.setPosition(p); };
  const toNdc = (v) => v.applyMatrix4(pvNow);
  const speedOn = (a, b) => { toNdc(w1.copy(a)); toNdc(w2.copy(b)); return Math.hypot((w1.x - w2.x) * G.uAspect.value, w1.y - w2.y) * 0.5 / DELTA; };
  const seeds = bitM.userData.seeds, topAge = new Float32Array(7), topIdx = new Int32Array(7), SEED_RING = 2.2;
  // each step makes two rings: a smaller one where the foot leaves the water and a larger one where it comes down; nearer steps are larger
  const footEv = [];
  swings.forEach(([side, f0, f1], s) => { const a = footAt(side, f0, V3()), b = footAt(side, f1, V3()), t0 = stepT(s), kN = s / Math.max(1, nStep - 1);
    footEv.push({ x: a.x, z: a.z, t: t0 + 0.06, str: 0.85, lam: 2.4 + 0.4 * kN, life: 2.6, n: 3.3 });
    footEv.push({ x: b.x, z: b.z, t: t0 + stepLen * 0.97, str: 1, lam: 3.0 + 0.9 * kN, life: s === nStep - 1 ? 3.4 : 3.0, n: 4.5 }); });
  const o3 = V3(), o4 = V3();

  function update(dt, time, camera, u) {
    ctx.renderer.getDrawingBufferSize(res); G.uRes.value.copy(res); G.uAspect.value = res.x / Math.max(1, res.y);
    const T = Tu(u), ua = Math.max(0, u - DELTA * clock.rate(u));
    // the pond rides with us from the sit to the jump: its offset is a pure function of where the path is
    frameOf(u, Fn, pN, tN); frameOf(ua, Fa, pA, tA);
    const c = carryZ(pN.z), ca = carryZ(pA.z);
    pond.position.z = c;
    // the camera of one step ago: the current camera moved by the rigid change of the path frame (position and tangent only)
    camAgo.copy(Fn).invert().premultiply(Fa).multiply(camera.matrixWorld);
    viewAgo.copy(camAgo).invert();
    pondAgo.makeTranslation(0, 0, ca).multiply(flip);
    G.uPVAgo.value.copy(camera.projectionMatrix).multiply(viewAgo).multiply(pondAgo);
    viewNow.copy(camera.matrixWorld).invert();
    pvNow.makeTranslation(0, 0, c).multiply(flip).premultiply(viewNow).premultiply(camera.projectionMatrix); G.uPVNow.value.copy(pvNow);
    const e = camera.matrixWorld.elements;
    G.uCamL.value.set(e[12] * mir, e[13], e[14] - c);
    G.uCamAgoL.value.set(camAgo.elements[12] * mir, camAgo.elements[13], camAgo.elements[14] - ca);
    bitM.uniforms.uCamR.value.set(e[0] * mir, e[1], e[2]); bitM.uniforms.uCamU.value.set(e[4] * mir, e[5], e[6]);
    G.uTime.value = time; G.uT.value = T;
    G.uOpen.value = u <= 0 ? 1 : 0.3 * (1 - sst(0.004, 0.035, u));     // whole at the door, the rule in force by u 0.035
    G.uDim.value = sst(tDim, tDim + 0.5, T) * (1 - sst(tJump, tJump + 0.15, T));
    stillM.uniforms.uHit.value = sst(tHit - 0.02, tHit + 0.06, T);
    // the wind: on the way in, again after the jump, and (polish 1) one last breath over the sit as the fly walks its second leg; it drops at u 0.349
    G.uWind.value = u <= 0 ? 1 : (1 - sst(0.205, 0.245, u)) + sst(0.5, 0.56, u) + sst(0.3335, 0.3385, u) * (1 - sst(0.343, 0.349, u));
    G.uSlotOpen.value = sst(0.60, 0.72, u); G.uTrain.value = sst(0.63, 0.74, u);
    bitM.uniforms.uFew.value = sst(0.423, 0.428, u) * (1 - sst(0.457, 0.461, u));

    // rings: thistledown that has just met the water (world time), each foot as it comes down, the second frog (T)
    const few = bitM.uniforms.uFew.value > 0.5; let nTop = 0;
    for (let i = 0; i < seeds.length; i++) { const s = seeds[i]; if (!s.water || s.cls === 2 || (few && s.cls !== 0)) continue; const age = (time + s.phase) % s.per; if (age >= SEED_RING) continue;
      let j; if (nTop < 7) j = nTop++; else if (age < topAge[6]) j = 6; else continue;                    // keep the seven youngest, sorted, with no allocation
      while (j > 0 && topAge[j - 1] > age) { topAge[j] = topAge[j - 1]; topIdx[j] = topIdx[j - 1]; j--; }
      topAge[j] = age; topIdx[j] = i; }
    for (let i = 0; i < 7; i++) { if (i < nTop) { const s = seeds[topIdx[i]]; rings[i].set(s.x, s.z, topAge[i], s.cls ? 0.8 : 1); ringsB[i].set(1.5, 0.6, SEED_RING, 3.6); } else rings[i].set(0, 0, -1, 0); }
    let rk = 7;
    for (let i = 0; i < footEv.length && rk < 11; i++) { const f = footEv[i]; if (T >= f.t && T < f.t + f.life) { rings[rk].set(f.x, f.z, T - f.t, f.str); ringsB[rk].set(f.lam, 0.8, f.life, f.n); rk++; } }
    for (; rk < 11; rk++) rings[rk].set(0, 0, -1, 0);
    if (frogSplash && T >= frogSplash.t && T < frogSplash.t + 3) { rings[11].set(frogSplash.x, frogSplash.z, T - frogSplash.t, 1); ringsB[11].set(3.2, 0.8, 3, 4.5); } else rings[11].set(0, 0, -1, 0);

    // the heron: now, a step ago, and two lags for the tail (a stopped limb is gone inside half a second, with no buffer)
    poseHeron(T, poses[0]); poseHeron(T - DELTA, poses[1]);
    packBones(poses[0], boneN); packBones(poses[1], boneA);
    const moving = T > tStep0 - 0.1 && T < tHit + 1.2;
    if (moving) { poseHeron(T - 0.2, poses[2]); poseHeron(T - 0.2 - DELTA, poses[3]); poseHeron(T - 0.4, poses[4]); poseHeron(T - 0.4 - DELTA, poses[5]); }
    for (let b = 0; b < NB; b++) { let s = 0;
      if (moving) { for (let l = 0; l < 2; l++) { const A = poses[2 + l * 2][b], B = poses[3 + l * 2][b], wgt = l ? 0.3 : 0.6;
        s = Math.max(s, wgt * speedOn(o3.setFromMatrixPosition(A), o4.setFromMatrixPosition(B)), wgt * speedOn(o3.copy(boneTip[b]).applyMatrix4(A), o4.copy(boneTip[b]).applyMatrix4(B))); } }
      boneT[b] = s; }

    for (const P of props) { P.at(T, time, P.now); P.at(T - DELTA, time - DELTA, P.ago);
      P.at(T - 0.2, time, P.lag); P.at(T - 0.2 - DELTA, time, P.lag2); let s = 0.6 * speedOn(o3.setFromMatrixPosition(P.lag), o4.setFromMatrixPosition(P.lag2));
      P.at(T - 0.4, time, P.lag); P.at(T - 0.4 - DELTA, time, P.lag2); s = Math.max(s, 0.3 * speedOn(o3.setFromMatrixPosition(P.lag), o4.setFromMatrixPosition(P.lag2)));
      P.m.uniforms.uTailS.value = s; }
  }
  update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start), projectionMatrix: new THREE.Matrix4() }, 0);

  return { group: pond, sky, clock, update, dispose() {} };
}
