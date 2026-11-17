// THE LEDGE - hero set piece for the world "salmon-falls" (Against the Falls: Brooks Falls at 3x life size).
//
// A river-wide basalt ledge, 150 m across and 6 m high, with the whole river coming over it as layered
// fibrous sheets of white water; seven brown bears planted in the torrent along the lip, heads down,
// tracking, lunging and snapping; never fewer than eight crimson sockeye in the air in front of it (most
// slap back into the foam, some clear the lip, one every few seconds ends in a bear's jaws and is shaken
// in a halo of drops); a boiling apron of foam at the foot; and a wall of sunlit spray climbing 25 m and
// leaning upstream behind the bears.
//
// LOCAL SPACE  origin = lower-river water level at the foot of the middle of the ledge. +Y up. The face
//   looks toward +Z (downstream, the side the camera comes from); upstream is -Z. Heading upstream (-Z),
//   left is -X and right is +X. Lower water y = 0 (pool bed y = -7), lip water y = 6 (upper bed y ~ 3).
// SIZE   rock x -88..88 (river |x| < 75, rock shoulders beyond), z -46..+14, y -7..~13. Local water sheets
//   reach z -70..+72. Bears stand at z ~ -1.7 with heads out over the lip (top of hump y ~ 10); plume top
//   y ~ 27. hero.radius 46 / height 22 / center (0,5,0) frame it for the viewer; true bounding radius ~95.
// COST   ~125k triangles (july: up to ~155k), 10 draw calls (rock, bears, salmon near and far, upper water, pool + foam, bubble wall, falls
//   sheets, plume, drops). No lights, no textures, ~200 ms build. Everything animates in vertex shaders.
// DRAW ORDER  rock, bears, salmon opaque. Transparent queue: upper water (1), pool (1), bubble wall (2),
//   falls sheets (3, depth-written so spray behind them is hidden), plume (5), drops (6, additive).
// LIGHT  All ShaderMaterials lit by uniforms (no scene lights needed): one hard sun + sky/ground hemisphere.
//   Default is the brief's light: sun 35 degrees up on the LEFT bank, sunDir (toward the sun, LOCAL space)
//   (-0.82, 0.57, -0.07), #FFF4E0 x 2.6, cool blue sky fill. hero.setLight({ sunDir, sunColor, sunIntensity,
//   sky, ground }) to match the world. Recipe to match: albedo x (sun x lambert + hemi(sky, ground) x AO)
//   + wet specular; bears and fish add a strong back-lit rim (fresnel^3 x sun, HDR ~3) so they burn at the
//   edges when they stand between the camera and the sun; white water peaks ~1.2 (just under clipping);
//   spray drops are additive HDR 2-4 (the only bloom sources). All materials honour scene fog.
// OPTS   palette  7 hex strings in brief order: crimson fish, amber-green, pool green, birch gold (unused),
//                 spruce black-green (moss on rock), white water, bear umber
//        hour     'day' (default) | 'evening' (low copper sun, right and behind) | 'dawn' (rose, sun barely
//                 up on the left) | 'night' (moonlit silver)          sunDir [x,y,z] overrides
//        season   'september' (default: crimson fish, 7 bears) | 'july' (silver-pink fish, 12 bears, twice
//                 the leapers, at most 115) | 'october' (dull ragged fish, 3 vast bears, a third of the leapers)
//        weather  'clear' (default) | 'rain' | 'fog' (both grey the light and thicken the plume)
//        density  0.7..1.3 scales the leapers            bears  override the number on the lip (3..12)
//        water    false = the upper-river and pool sheets draw ONLY their foam (lip riffles, bear wakes, the
//                 boil and foam lines) as overlays at y 6.02 / 0.03 over the world's own water surface
//        plume / bubbleWall  false to omit                duration (45) and strikeU (0.775) for setProgress
// HERO API (besides the contract)
//   hero.setProgress(u)     keys the APEX bear (anchors.apexBear) and the fish it takes: the jaws close at
//                           u = opts.strikeU. Clock = (u - strikeU) x duration seconds; the same bear also
//                           strikes every 12 s of that clock before and after. Never called: free-runs on time.
//   hero.setStrikeClock(s)  the same clock in seconds relative to the snap (use this with a pace(u) curve).
//   hero.setLight({...})    see LIGHT.      hero.surfaceAt(x, z) -> water surface y (0 or 6, local).
//   Everything else (other bears, 40+ leapers, water, spray) loops on the time passed to update().
// ANCHORS (local space)
//   lipY 6, poolY 0, bedY -7, leapX, failX      the two leap lines (x of the clean and the failed leap)
//   flyThrough   clean leap: 3 m deep run-up, out of the foam 7 m from the face at 40 degrees, apex 2.6 m
//                over the lip water at (leapX, 8.6, 0), splashdown 9 m past the lip, then the upper river.
//                Clear of rock by >= 3 m and of the apex bear (7.5 m to the left) by ~5.5 m at its lunge.
//   failedLeap   up through the foam 9 m short to y 3.5 under three bears, then swept right and under.
//   portalSeat   { position, facing }: suggested centre for the 14 m portal 115 m upstream on the leap line,
//                facing +Z (back toward the lip); it lies outside the piece, in the world's outlet channel.
//   viewpoints   far (the white line and plume on the axis), slant (the sunlit ledge from the pool),
//                foot (under the sheet), apex.
//   bears        [{ position, yaw, scale, head, mouth }] head = resting head, mouth = jaws at the snap.
//   apexBear     index into bears of the keyed bear; apexMouth = where the fish beside us is taken.
//   plumeTop, sunDir, bounds { radius: 95 }.
//   hero.addBears(list, opts)  extra bears (riffle, pool, bar, the rare fight) drawn with the lip bears' material:
//                           list of { x, y, z, yaw, scale, girth, phase, tint, period, offset }; returns { mesh, rear }
//                           where rear.value = (rear-up angle, dx, dy, dz) poses the whole group (opts.own = own material;
//                           with it opts.subK scales the lift of the submerged part seen under water, opts.silK the silhouette).
//   hero.uniforms           the shared light uniforms (uSun, uSunCol, uSkyCol, uGndCol, uCam, uTime) for the world's own shaders.
import * as THREE from 'three';
import { makeRng } from '../kit/core.js';

const LIP = 6, BED = -7, G = 22, HALF = 75, XR = 88;
const DEFAULT_PALETTE = ['#C4262E', '#8C8A3A', '#2E5E4C', '#E2B13C', '#1E3A2D', '#F1F5F2', '#3A2A1F'];
const cl = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform float uTime, uKeyT, uKeyOn;
uniform vec3 uSun, uSunCol, uSkyCol, uGndCol, uCam, uUnderC;
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ return vn(p)*.5 + vn(p*2.03+7.1)*.3 + vn(p*4.1+13.7)*.2; }
vec3 hemi(vec3 n){ return mix(uGndCol, uSkyCol, n.y*.5+.5); }
vec3 safeN(vec3 v){ return v / max(length(v), 1e-5); }
// strike clock: seconds relative to the snap, looping. st = (period, offset, keyed)
float strikeTau(vec3 st){ float c = mix(uTime, uKeyT, st.z*uKeyOn); return mod(c + st.y, st.x) - 5.; }
`;
// bear pose (shared by the bears and by the fish held in their jaws). Constants mirrored in JS (mouthAtSnap).
const POSE = { np: [0, 3.3, 1.5], hp: [0, 0.4, -2.0], jh: [0, 2.42, 3.62], pitchL: 0.42, fwdL: 0.8, dropL: 0.3, bodyA: 0.15, bodyF: 0.4, mouth: [0, 2.4, 4.26] };
const GLSL_BEAR = /* glsl */`
vec3 bearPose(vec3 p, float wH, float wJ, float wP, float tau, float ph){
  float t = uTime;
  float L = smoothstep(-.42,-.04,tau)*(1.-smoothstep(1.9,3.1,tau));
  float crouch = smoothstep(-1.6,-.5,tau)*(1.-smoothstep(-.42,-.1,tau));
  float open = smoothstep(-.5,-.22,tau)*(1.-smoothstep(-.07,0.,tau))*.8 + smoothstep(0.,.1,tau)*(1.-smoothstep(2.1,2.6,tau))*.22;
  float shake = smoothstep(.45,.7,tau)*(1.-smoothstep(1.5,1.9,tau));
  float idle = 1.-L;
  vec3 q = p;
  vec3 d = q - vec3(${POSE.jh.join(',')});
  float a = open*wJ, c = cos(a), s = sin(a);
  d.yz = vec2(d.y*c - d.z*s, d.y*s + d.z*c);
  q = d + vec3(${POSE.jh.join(',')});
  // neck and head: yaw (tracking the water), pitch (nose down), roll (the shake)
  d = q - vec3(${POSE.np.join(',')});
  a = (sin(t*.37+ph*6.)*.26 + sin(t*.91+ph*11.)*.12)*idle*wH; c = cos(a); s = sin(a);
  d.xz = vec2(d.x*c + d.z*s, -d.x*s + d.z*c);
  a = ((sin(t*.29+ph*3.)*.08 - crouch*.12)*idle + L*${POSE.pitchL})*wH; c = cos(a); s = sin(a);
  d.yz = vec2(d.y*c - d.z*s, d.y*s + d.z*c);
  a = sin(tau*27.)*.3*shake*wH; c = cos(a); s = sin(a);
  d.xy = vec2(d.x*c - d.y*s, d.x*s + d.y*c);
  q = d + vec3(${POSE.np.join(',')});
  q.z += L*${POSE.fwdL}*wH; q.y -= L*${POSE.dropL}*wH;
  // body: planted paws stay, everything else leans, breathes, shifts weight and lunges
  float free = 1.-wP;
  d = q - vec3(${POSE.hp.join(',')});
  a = (L*${POSE.bodyA} + (sin(t*.5+ph*9.)*.014 - crouch*.05)*idle)*free; c = cos(a); s = sin(a);
  d.yz = vec2(d.y*c - d.z*s, d.y*s + d.z*c);
  q = d + vec3(${POSE.hp.join(',')});
  q.x += (sin(t*.43+ph*5.)*.16 + sin(tau*27.)*.05*shake)*idle*free + sin(tau*27.)*.04*shake*free;
  q.z += (L*${POSE.bodyF} - crouch*.25)*free;
  q.y += sin(t*1.1+ph*4.)*.025*free;
  return q;
}
vec3 bearPlace(vec3 q, vec4 ip, vec2 sc){ // ip = xyz + yaw, sc = (scale, girth)
  q *= vec3(sc.x*sc.y, sc.x, sc.x);
  float c = cos(ip.w), s = sin(ip.w);
  return ip.xyz + vec3(q.x*c + q.z*s, q.y, -q.x*s + q.z*c);
}
`;
// JS mirror of bearPose for the mouth point at the instant of the snap (tau = 0: L = 1, idle = 0).
function mouthAtSnap(b) {
  const rotYZ = (d, a) => { const c = Math.cos(a), s = Math.sin(a); return [d[0], d[1] * c - d[2] * s, d[1] * s + d[2] * c]; };
  let d = [POSE.mouth[0] - POSE.np[0], POSE.mouth[1] - POSE.np[1], POSE.mouth[2] - POSE.np[2]];
  d = rotYZ(d, POSE.pitchL);
  let q = [d[0] + POSE.np[0], d[1] + POSE.np[1] - POSE.dropL, d[2] + POSE.np[2] + POSE.fwdL];
  d = rotYZ([q[0] - POSE.hp[0], q[1] - POSE.hp[1], q[2] - POSE.hp[2]], POSE.bodyA);
  q = [d[0] + POSE.hp[0], d[1] + POSE.hp[1], d[2] + POSE.hp[2] + POSE.bodyF];
  return placeBear(q, b);
}
function placeBear(q, b) {
  const x = q[0] * b.scale * b.girth, y = q[1] * b.scale, z = q[2] * b.scale, c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  return new THREE.Vector3(b.x + x * c + z * s, b.y + y, b.z - x * s + z * c);
}

// ---------------------------------------------------------------- geometry builder
export function makeBuilder() {
  const P = [], C = [], A = [], I = [];
  const B = {
    P, C, A, I,
    v(p, col, a) { P.push(p[0], p[1], p[2]); C.push(col[0], col[1], col[2]); A.push(a[0], a[1], a[2], a[3]); return P.length / 3 - 1; },
    tri(a, b, c) { I.push(a, b, c); },
    // rings: [{ c:[x,y,z], rx, ry, e (superellipse), k:[4 aux] }], frame u (cos) and v (sin); Catmull-Rom
    // smoothed `sub` times; colFn(pos, sinTheta, cosTheta, t 0..1, aux) -> [r,g,b]
    loft(rings, u, v, sides, sub, colFn, caps = 3) {
      const R = [], n = rings.length, get = (i) => rings[cl(i, 0, n - 1)];
      const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      for (let i = 0; i < n - 1; i++) for (let s = 0; s < sub; s++) {
        const t = s / sub, r0 = get(i - 1), r1 = get(i), r2 = get(i + 1), r3 = get(i + 2), f = (g) => cr(g(r0), g(r1), g(r2), g(r3), t);
        R.push({ c: [0, 1, 2].map((j) => f((r) => r.c[j])), rx: Math.max(0.01, f((r) => r.rx)), ry: Math.max(0.01, f((r) => r.ry)),
          e: f((r) => r.e ?? 2), k: [0, 1, 2, 3].map((j) => cl(f((r) => (r.k ? r.k[j] : 0)), 0, 1)) });
      }
      const last = rings[n - 1]; R.push({ c: last.c.slice(), rx: last.rx, ry: last.ry, e: last.e ?? 2, k: (last.k || [0, 0, 0, 0]).slice() });
      const base = P.length / 3, m = R.length;
      for (let i = 0; i < m; i++) for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2, r = R[i]; let cx = Math.cos(th), sy = Math.sin(th);
        const pw = 2 / r.e, ax = Math.sign(cx) * Math.pow(Math.abs(cx), pw) * r.rx, ay = Math.sign(sy) * Math.pow(Math.abs(sy), pw) * r.ry;
        const p = [r.c[0] + u[0] * ax + v[0] * ay, r.c[1] + u[1] * ax + v[1] * ay, r.c[2] + u[2] * ax + v[2] * ay];
        B.v(p, colFn(p, sy, cx, i / (m - 1), r.k), r.k);
      }
      for (let i = 0; i < m - 1; i++) for (let j = 0; j < sides; j++) {
        const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = base + (i + 1) * sides + (j + 1) % sides, d = base + (i + 1) * sides + j;
        I.push(a, b, c, a, c, d);
      }
      if (caps & 1) { const r = R[0], cI = B.v(r.c, colFn(r.c, 0, 0, 0, r.k), r.k); for (let j = 0; j < sides; j++) I.push(cI, base + (j + 1) % sides, base + j); }
      if (caps & 2) { const r = R[m - 1], cI = B.v(r.c, colFn(r.c, 0, 0, 1, r.k), r.k), o = base + (m - 1) * sides; for (let j = 0; j < sides; j++) I.push(cI, o + j, o + (j + 1) % sides); }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aAux', new THREE.Float32BufferAttribute(A, 4));
      g.setIndex(I); g.computeVertexNormals();
      return g;
    },
  };
  return B;
}
const hexLin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [mixn(a[0], b[0], t), mixn(a[1], b[1], t), mixn(a[2], b[2], t)];

// ---------------------------------------------------------------- brown bear (nose +Z, feet y 0, 4.3 m at the hump, ~7.7 m long)
// aAux = (head/neck weight, lower-jaw weight, planted-paw weight, fur-tuft tip)
async function bearGeometry(rng, pal, ctx) {
  const B = makeBuilder(), U = mul(hexLin(pal[6]), 1.05), blond = [0.1, 0.06, 0.03], dark = mul(U, 0.4), tan = [0.085, 0.055, 0.03];
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const bodyCol = (p, sy) => {
    const top = ss(-0.3, 0.9, sy), hump = Math.exp(-((p[2] - 0.9) ** 2) / 2.4), wet = ss(2.3, 0.7, p[1]);
    let c = mix3(mul(U, 0.72), mix3(U, blond, 0.14 + 0.4 * hump), top);
    c = mix3(c, tan, ss(3.8, 4.12, p[2]) * 0.6); c = mix3(c, [0.012, 0.011, 0.012], ss(4.3, 4.38, p[2]) * ss(2.56, 2.72, p[1]));
    return mix3(c, dark, wet * 0.85);
  };
  const H = (w) => [w, 0, 0, 0];
  // torso, hump, neck, skull, muzzle in one skin. The head is a brown bear's: a thick neck running out of the hump, a
  // broad skull, a brow that drops steeply (the dished face) to a short deep muzzle a third of the head long
  B.loft([
    { c: [0, 2.55, -2.85], rx: 0.3, ry: 0.35 }, { c: [0, 2.72, -2.6], rx: 0.95, ry: 1.02 }, { c: [0, 2.82, -1.9], rx: 1.26, ry: 1.3, e: 2.3 },
    { c: [0, 2.72, -0.9], rx: 1.4, ry: 1.36, e: 2.3 }, { c: [0, 2.8, 0.1], rx: 1.36, ry: 1.38, e: 2.3 }, { c: [0, 3.0, 0.95], rx: 1.24, ry: 1.36 },
    { c: [0, 3.04, 1.7], rx: 1.1, ry: 1.18, k: H(0.12) }, { c: [0, 3.0, 2.35], rx: 1.02, ry: 1.04, k: H(0.45) }, { c: [0, 2.93, 2.9], rx: 0.96, ry: 0.92, k: H(0.8) },
    { c: [0, 2.9, 3.3], rx: 0.98, ry: 0.84, k: H(1), e: 2.2 }, { c: [0, 2.87, 3.6], rx: 0.9, ry: 0.74, k: H(1), e: 2.3 }, { c: [0, 2.72, 3.86], rx: 0.63, ry: 0.5, k: H(1), e: 2.3 },
    { c: [0, 2.68, 4.08], rx: 0.5, ry: 0.42, k: H(1), e: 2.5 }, { c: [0, 2.68, 4.28], rx: 0.47, ry: 0.4, k: H(1), e: 2.5 }, { c: [0, 2.7, 4.4], rx: 0.36, ry: 0.32, k: H(1) },
    { c: [0, 2.7, 4.45], rx: 0.12, ry: 0.1, k: H(1) },
  ], X, Y, 12, 2, (p, sy) => bodyCol(p, sy));
  // lower jaw: deep, as wide as the muzzle
  B.loft([{ c: [0, 2.3, 3.55], rx: 0.46, ry: 0.2, k: [1, 1, 0, 0] }, { c: [0, 2.25, 3.95], rx: 0.44, ry: 0.2, k: [1, 1, 0, 0] }, { c: [0, 2.25, 4.2], rx: 0.38, ry: 0.17, k: [1, 1, 0, 0] }, { c: [0, 2.29, 4.36], rx: 0.2, ry: 0.09, k: [1, 1, 0, 0] }],
    X, Y, 8, 2, (p, sy) => (sy > 0.3 ? [0.02, 0.008, 0.008] : mul(tan, 0.8)));
  // ears (small, round, set wide and low on the skull) and eyes
  const earV = [];
  for (const sx of [-1, 1]) {
    earV.push(B.P.length / 3);
    B.loft([{ c: [sx * 0.64, 3.4, 3.2], rx: 0.25, ry: 0.13, k: H(1) }, { c: [sx * 0.74, 3.62, 3.17], rx: 0.26, ry: 0.115, k: H(1) }, { c: [sx * 0.79, 3.78, 3.15], rx: 0.21, ry: 0.09, k: H(1) }, { c: [sx * 0.81, 3.85, 3.14], rx: 0.11, ry: 0.05, k: H(1) }],
      X, Z, 7, 2, (p, sy) => mul(U, sy > 0.2 ? 0.45 : 0.85), 2);
    earV.push(B.P.length / 3);
    B.loft([{ c: [sx * 0.4, 3.11, 3.79], rx: 0.02, ry: 0.02, k: H(1) }, { c: [sx * 0.42, 3.11, 3.85], rx: 0.075, ry: 0.07, k: H(1) }, { c: [sx * 0.41, 3.1, 3.92], rx: 0.02, ry: 0.02, k: H(1) }],
      X, Y, 6, 1, () => [0.006, 0.005, 0.004]);
  }
  // legs: shoulder/haunch bulge, elbow, wrist, broad paw; plant weight rises to 1 at the paw
  const leg = (sx, front) => {
    const zs = front ? 1.05 : -1.95, P = (w) => [0, 0, w, 0];
    const R = front
      ? [{ c: [sx * 0.72, 2.9, zs], rx: 0.62, ry: 0.78, k: P(0) }, { c: [sx * 0.8, 2.1, zs - 0.05], rx: 0.55, ry: 0.64, k: P(0.2) }, { c: [sx * 0.83, 1.35, zs - 0.12], rx: 0.44, ry: 0.5, k: P(0.55) },
        { c: [sx * 0.84, 0.62, zs + 0.02], rx: 0.38, ry: 0.42, k: P(0.9) }, { c: [sx * 0.85, 0.2, zs + 0.2], rx: 0.46, ry: 0.62, k: P(1) }, { c: [sx * 0.85, 0.0, zs + 0.24], rx: 0.42, ry: 0.6, k: P(1) }]
      : [{ c: [sx * 0.7, 2.8, zs], rx: 0.74, ry: 0.95, k: P(0) }, { c: [sx * 0.84, 2.0, zs + 0.18], rx: 0.62, ry: 0.78, k: P(0.2) }, { c: [sx * 0.88, 1.3, zs + 0.22], rx: 0.46, ry: 0.54, k: P(0.55) },
        { c: [sx * 0.88, 0.62, zs - 0.1], rx: 0.38, ry: 0.42, k: P(0.9) }, { c: [sx * 0.88, 0.2, zs + 0.12], rx: 0.46, ry: 0.64, k: P(1) }, { c: [sx * 0.88, 0.0, zs + 0.16], rx: 0.42, ry: 0.62, k: P(1) }];
    B.loft(R, X, Z, 8, 2, (p, sy) => bodyCol(p, 0.2), 2);
  };
  await ctx.yield();
  leg(-1, true); leg(1, true); leg(-1, false); leg(1, false);
  await ctx.yield();
  // wet coat: hanging tufts sampled over the skin (a ragged, dripping silhouette that takes the rim light)
  const nTri = B.I.length / 3, P = B.P, A = B.A, pt = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
  let made = 0, guard = 0; const tuftN = [];
  while (made < 2300 && guard++ < 40000) {
    if ((guard & 1023) === 1023) await ctx.yield();
    const t = Math.floor(rng() * nTri), ia = B.I[t * 3], ib = B.I[t * 3 + 1], ic = B.I[t * 3 + 2], a = pt(ia), b = pt(ib), c = pt(ic);
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const area = Math.hypot(n[0], n[1], n[2]); if (area < 1e-5 || rng() > area / 0.2) continue;
    let r1 = rng(), r2 = rng(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const p = [a[0] + e1[0] * r1 + e2[0] * r2, a[1] + e1[1] * r1 + e2[1] * r2, a[2] + e1[2] * r1 + e2[2] * r2];
    if (p[2] > 3.8 || p[1] < 0.4 || (p[2] > 3.6 && p[1] > 2.95 && Math.abs(p[0]) > 0.22 && Math.abs(p[0]) < 0.62)) continue;   // not on the muzzle, the eyes or the paws
    n = [n[0] / area, n[1] / area, n[2] / area];
    if (n[0] * p[0] + n[1] * (p[1] - 2.6) * 0.5 < -0.2) n = [-n[0], -n[1], -n[2]];
    const k = [0, 1, 2, 3].map((j) => A[ia * 4 + j] * (1 - r1 - r2) + A[ib * 4 + j] * r1 + A[ic * 4 + j] * r2);
    const shag = p[1] < 2.3 && p[2] > -2.2 && p[2] < 3 ? 1.7 : p[2] > 2.9 ? 0.6 : 1, len = rng.range(0.09, 0.2) * shag, w = rng.range(0.03, 0.065);
    let d = [n[0] * 0.42, n[1] * 0.42 - 0.62, n[2] * 0.42 - 0.36]; const dl = Math.hypot(d[0], d[1], d[2]) || 1; d = [d[0] / dl, d[1] / dl, d[2] / dl];
    // base edge perpendicular to the tuft, lying in the skin
    let s = [n[1] * d[2] - n[2] * d[1], n[2] * d[0] - n[0] * d[2], n[0] * d[1] - n[1] * d[0]]; const sl = Math.hypot(s[0], s[1], s[2]);
    if (sl < 0.05) s = [1, 0, 0]; else s = [s[0] / sl, s[1] / sl, s[2] / sl];
    const col = bodyCol(p, n[1]), tip = mix3(col, blond, 0.3);
    const i0 = B.v([p[0] - s[0] * w - n[0] * 0.03, p[1] - s[1] * w - n[1] * 0.03, p[2] - s[2] * w - n[2] * 0.03], mul(col, 0.8), [k[0], k[1], k[2], 0]);
    B.v([p[0] + s[0] * w - n[0] * 0.03, p[1] + s[1] * w - n[1] * 0.03, p[2] + s[2] * w - n[2] * 0.03], mul(col, 0.8), [k[0], k[1], k[2], 0]);
    B.v([p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], tip, [k[0], k[1], k[2], 1]);
    B.tri(i0, i0 + 1, i0 + 2); tuftN.push(i0, n[0], n[1], n[2]); made++;
  }
  // the ears: small, thick and furred, set back on the corners of the skull (a brown bear's, not a toy's). The skin of
  // each ear and the tufts that were sampled on it move together; then a fringe of short fur stands round its rim
  const earAt = (sx) => [sx * 0.62, 3.46, 2.96];
  const earMove = (i) => {
    const sx = P[i * 3] < 0 ? -1 : 1, bx = sx * 0.6, by = 3.36, bz = 3.2;
    P[i * 3] = bx + (P[i * 3] - bx) * 1.12 - sx * 0.035; P[i * 3 + 1] = by + (P[i * 3 + 1] - by) * 1.1 + 0.02; P[i * 3 + 2] = bz + (P[i * 3 + 2] - bz) * 1.5 - 0.2;
  };
  for (let e = 0; e < 2; e++) for (let i = earV[e * 2]; i < earV[e * 2 + 1]; i++) earMove(i);
  for (let i = 0; i < tuftN.length; i += 4) { const v = tuftN[i]; if (Math.abs(P[v * 3]) > 0.52 && P[v * 3 + 1] > 3.56 && P[v * 3 + 2] > 2.98 && P[v * 3 + 2] < 3.42) for (let k = 0; k < 3; k++) earMove(v + k); }
  const fr = makeRng(90211);                                 // its own stream: the hero's draws stay as they were
  const tuft = (p, n, d, len, w, col, tip, k) => {
    let sx = n[1] * d[2] - n[2] * d[1], sy = n[2] * d[0] - n[0] * d[2], sz = n[0] * d[1] - n[1] * d[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const i0 = B.v([p[0] - sx * w, p[1] - sy * w, p[2] - sz * w], col, [k[0], k[1], k[2], 0]);
    B.v([p[0] + sx * w, p[1] + sy * w, p[2] + sz * w], col, [k[0], k[1], k[2], 0]);
    B.v([p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], tip, [k[0], k[1], k[2], 1]);
    B.tri(i0, i0 + 1, i0 + 2); tuftN.push(i0, n[0], n[1], n[2]);
  };
  for (const sx of [-1, 1]) {
    const c = earAt(sx);
    for (let k = 0; k < 46; k++) {
      const th = -0.5 + (k + fr()) / 46 * 4.1, cx = Math.cos(th) * sx, sy = Math.sin(th), back = fr() < 0.5 ? -1 : 1;
      const p = [c[0] + cx * 0.23 + sx * 0.1, c[1] + 0.2 + sy * 0.25, c[2] + back * 0.07], n = [cx * 0.8, sy * 0.8, back * 0.6];
      const dl = Math.hypot(cx, sy * 0.9 - 0.25, back * 0.3 - 0.3) || 1, d = [cx / dl, (sy * 0.9 - 0.25) / dl, (back * 0.3 - 0.3) / dl];
      const col = mul(U, 0.7 + 0.3 * fr());
      tuft(p, n, d, fr.range(0.07, 0.14), fr.range(0.03, 0.05), mul(col, 0.8), mix3(col, blond, 0.3), [1, 0, 0]);
    }
  }
  await ctx.yield();
  // wet fur on the forelegs: long clumps that hang from the elbow to the wrist, dark at the root, drawn to points by
  // the water running down them (the ragged outline of an animal that has stood in the river all morning)
  for (const sx of [-1, 1]) for (let k = 0; k < 150; k++) {
    const y = 0.5 + 2.0 * Math.pow(fr(), 0.8), th = fr() * 6.2832, t = ss(0.62, 2.9, y);
    const rx = mixn(0.38, 0.6, t), rz = mixn(0.42, 0.74, t), w8 = y > 2.1 ? mixn(0.2, 0, (y - 2.1) / 0.8) : y > 1.35 ? mixn(0.55, 0.2, (y - 1.35) / 0.75) : mixn(0.9, 0.55, cl((y - 0.62) / 0.73, 0, 1));
    const cx = Math.cos(th), sz = Math.sin(th), p = [sx * mixn(0.84, 0.75, t) + cx * rx * 0.97, y, 1.0 + sz * rz * 0.97], n = [cx, 0.1, sz];
    const out = fr.range(0.1, 0.24), dl = Math.hypot(cx * out, 1, sz * out - 0.12), d = [cx * out / dl, -1 / dl, (sz * out - 0.12) / dl];
    const col = bodyCol(p, 0.2), len = fr.range(0.26, 0.5) * mixn(0.8, 1.15, t);
    tuft(p, n, d, Math.min(len, y - 0.12), fr.range(0.045, 0.085), mul(col, 0.62), mix3(mul(col, 0.9), blond, 0.22), [0, 0, w8]);
  }
  // water running off the chin: three thin broken strands (their colour is a flag for the shader: blue far over red)
  for (const [x, z, len] of [[-0.16, 4.08, 0.95], [0.12, 4.2, 0.7], [0.02, 3.86, 1.15]]) {
    B.loft([{ c: [x, 2.2, z], rx: 0.013, ry: 0.013, k: [1, 1, 0, 0] }, { c: [x + 0.02, 2.2 - len * 0.5, z + 0.03], rx: 0.012, ry: 0.012, k: [1, 1, 0, 0] }, { c: [x, 2.2 - len, z + 0.01], rx: 0.007, ry: 0.007, k: [1, 1, 0, 0] }], X, Z, 4, 2, () => [0.02, 0.2, 0.9], 0);
  }
  await ctx.yield();
  const geo = B.build(), na = geo.getAttribute('normal');          // tufts take the skin's normal, so only the silhouette ones catch the rim
  await ctx.yield();
  for (let i = 0; i < tuftN.length; i += 4) for (let k = 0; k < 3; k++) na.setXYZ(tuftN[i] + k, tuftN[i + 1], tuftN[i + 2], tuftN[i + 3]);
  return geo;
}

// ---------------------------------------------------------------- sockeye (nose +Z, 1.8 m, spawning male: hump, kype, olive head)
// aAux = (bend weight 0 nose .. 1 tail, fin flag, 0, 0)
// the sockeye's colours by season (shared with the world's lower tiers): crimson flank, dark olive head, dark fins
export function salmonColours(pal, season) {
  let red = hexLin(pal[0]), olive = [0.062, 0.085, 0.032], belly = mul(red, 0.7), back = mul(red, 0.8), jaw = [0.105, 0.11, 0.08], fin = [0.055, 0.03, 0.028];
  if (season === 'july') { red = [0.5, 0.4, 0.42]; belly = [0.66, 0.66, 0.68]; back = [0.1, 0.2, 0.24]; olive = [0.1, 0.19, 0.21]; fin = [0.1, 0.13, 0.15]; jaw = [0.4, 0.42, 0.42]; }
  if (season === 'october') { red = mix3(red, [0.25, 0.14, 0.1], 0.5); belly = mul(red, 0.6); back = mul(red, 0.7); olive = [0.06, 0.07, 0.035]; jaw = [0.2, 0.19, 0.16]; }
  return { red, olive, belly, back, jaw, fin };
}
export function salmonGeometry(pal, season, sides = 10, sub = 2, o = {}) {      // sub 1 with 8 sides = the far fish (214 triangles against 494)
  // o.male = a big spawning male for a close pass: a higher hump, a longer snout hooked down over a long hooked lower
  // jaw (the kype), teeth along both, and a greener head
  const B = makeBuilder(), L = 1.8, X = [1, 0, 0], Y = [0, 1, 0], male = !!o.male, mk = typeof o.male === 'number' ? o.male : 1;      // (mk = how much of a male: 1.7 for the old bucks beside the route)
  const SC = salmonColours(pal, season), { red, belly, back, fin: finC } = SC;
  const olive = male ? mix3(SC.olive, [0.07, 0.15, 0.05], 0.75) : SC.olive, jaw = male ? mix3(SC.jaw, [0.1, 0.15, 0.07], 0.5) : SC.jaw;
  const bend = (z) => cl((0.25 * L - z) / (0.75 * L), 0, 1);
  const rows = [[-0.45, 0.05, -0.05, 0.018], [-0.37, 0.058, -0.058, 0.034], [-0.23, 0.105, -0.1, 0.06], [-0.06, 0.165, -0.14, 0.085], [0.09, 0.218, -0.155, 0.096],
    [0.21, 0.2, -0.15, 0.092], [0.3, 0.148, -0.132, 0.086], [0.38, 0.112, -0.112, 0.074], [0.45, 0.072, -0.08, 0.05], [0.495, 0.03, -0.035, 0.026], [0.515, -0.012, -0.05, 0.012]];
  if (male) {
    for (const r of rows) if (r[0] > -0.2 && r[0] < 0.34) r[1] *= 1 + 0.3 * mk * Math.exp(-((r[0] - 0.1) ** 2) / 0.018);      // the hump
    const hk = mk - 1;
    rows.splice(9, 2, [0.495, 0.042 + 0.006 * hk, -0.022, 0.03 + 0.003 * hk], [0.535 + 0.014 * hk, 0.018 + 0.006 * hk, -0.02, 0.022 + 0.003 * hk], [0.565 + 0.03 * hk, -0.014 - 0.004 * hk, -0.036 - 0.01 * hk, 0.014 + 0.003 * hk], [0.578 + 0.036 * hk, -0.046 - 0.024 * hk, -0.058 - 0.03 * hk, 0.006 + 0.002 * hk]);   // the snout, hooked down
  }
  const col = (p, sy) => {
    const head = ss(0.27 * L, 0.33 * L, p[2]), tailG = ss(-0.36 * L, -0.44 * L, p[2]);
    let c = mix3(mix3(red, belly, ss(-0.2, -0.9, sy)), back, ss(0.55, 1, sy) * 0.8);
    c = mix3(c, mix3(olive, jaw, ss(-0.1, -0.8, sy) * 0.7), head);
    return mix3(c, olive, tailG * 0.8);
  };
  B.loft(rows.map((r) => ({ c: [0, (r[1] + r[2]) * 0.5 * L, r[0] * L], rx: r[3] * L, ry: (r[1] - r[2]) * 0.5 * L, e: 2.2, k: [bend(r[0] * L), 0, 0, 0] })), X, Y, sides, sub, col);
  // hooked lower jaw (kype), a little agape
  if (male) {
    const kz = 1 + 0.32 * (mk - 1), kr = 1 + 0.4 * (mk - 1), kd = 0.022 * (mk - 1);
    B.loft([{ c: [0, -0.1 * L, 0.38 * L], rx: 0.042 * L, ry: 0.02 * L }, { c: [0, (-0.096 - kd) * L, (0.38 + 0.07 * kz) * L], rx: 0.034 * L * kr, ry: 0.019 * L * kr }, { c: [0, (-0.088 - kd * 1.4) * L, (0.38 + 0.13 * kz) * L], rx: 0.024 * L * kr, ry: 0.016 * L * kr }, { c: [0, (-0.064 - kd) * L, (0.38 + 0.17 * kz) * L], rx: 0.014 * L * kr, ry: 0.013 * L * kr }, { c: [0, -0.036 * L, (0.38 + 0.182 * kz) * L], rx: 0.006 * L, ry: 0.006 * L }],
      X, Y, 6, sub, () => jaw);
    // teeth: small pale pegs along the lower jaw and under the snout
    const tooth = [0.42, 0.4, 0.33];
    for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) {
      const t = i / 5, z = (0.455 + 0.085 * t) * L, x = sx * (0.026 - 0.016 * t) * L, y0 = (-0.078 + 0.018 * t * t) * L, y1 = (-0.012 - 0.03 * t) * L;
      B.loft([{ c: [x, y0, z], rx: 0.0045 * L, ry: 0.0045 * L }, { c: [x, y0 + 0.016 * L, z + 0.003 * L], rx: 0.0012 * L, ry: 0.0012 * L }], X, [0, 0, 1], 3, 1, () => tooth, 2);
      if (i < 5) B.loft([{ c: [x, y1, z + 0.012 * L], rx: 0.004 * L, ry: 0.004 * L }, { c: [x, y1 - 0.014 * L, z + 0.014 * L], rx: 0.0012 * L, ry: 0.0012 * L }], X, [0, 0, 1], 3, 1, () => tooth, 2);
    }
  } else B.loft([{ c: [0, -0.098 * L, 0.385 * L], rx: 0.04 * L, ry: 0.018 * L }, { c: [0, -0.085 * L, 0.45 * L], rx: 0.03 * L, ry: 0.016 * L }, { c: [0, -0.058 * L, 0.5 * L], rx: 0.016 * L, ry: 0.014 * L }],
    X, Y, sub > 1 ? 6 : 4, sub, () => jaw);
  const fin = (pts, c, k) => { const i0 = B.v(pts[0], c, [bend(pts[0][2]), k, 0, 0]); for (let i = 1; i < pts.length; i++) B.v(pts[i], i === pts.length - 1 ? mul(c, 0.7) : c, [bend(pts[i][2]), 1, 0, 0]); for (let i = 1; i < pts.length - 1; i++) B.tri(i0, i0 + i, i0 + i + 1); };
  const tailC = mix3(olive, finC, 0.5);
  fin([[0, 0, -0.42 * L], [0, 0.055 * L, -0.45 * L], [0, 0.175 * L, -0.6 * L], [0, 0.03 * L, -0.54 * L], [0, 0, -0.52 * L]], tailC, 0.3);
  fin([[0, 0, -0.42 * L], [0, 0, -0.52 * L], [0, -0.03 * L, -0.54 * L], [0, -0.175 * L, -0.6 * L], [0, -0.055 * L, -0.45 * L]], tailC, 0.3);
  fin([[0, 0.2 * L, 0.03 * L], [0, 0.285 * L, -0.06 * L], [0, 0.25 * L, -0.13 * L], [0, 0.165 * L, -0.12 * L]], finC, 0.2);       // dorsal
  fin([[0, 0.09 * L, -0.28 * L], [0, 0.125 * L, -0.33 * L], [0, 0.085 * L, -0.33 * L]], finC, 0.2);                             // adipose
  fin([[0, -0.1 * L, -0.2 * L], [0, -0.17 * L, -0.27 * L], [0, -0.08 * L, -0.33 * L]], finC, 0.2);                              // anal
  for (const s of [-1, 1]) {
    fin([[s * 0.03 * L, -0.14 * L, 0.0], [s * 0.08 * L, -0.2 * L, -0.07 * L], [s * 0.04 * L, -0.15 * L, -0.09 * L]], finC, 0.2);  // pelvic
    fin([[s * 0.075 * L, -0.09 * L, 0.29 * L], [s * 0.15 * L, -0.17 * L, 0.2 * L], [s * 0.1 * L, -0.13 * L, 0.15 * L]], finC, 0.2); // pectoral
  }
  return B.build();
}

// sockeye skin, shared with the world's shoal. Everything is drawn from the body-space position b (nose +Z, 1.8 m
// long, before the swimming bend): rows of scales with a sheen each, a darker speckled back, the gill cover's edge,
// an eye, and on the fins rays with a darker membrane between them and a ragged trailing edge (cut > .5 = outside
// it: discard). Detail fades with the size of a scale on screen, so nothing shimmers at range. keepHue() holds a
// lit colour under a ceiling without changing its hue: a red fish in full sun stays red and never bleaches pink.
export const GLSL_SALMON_SKIN = /* glsl */`
vec3 keepHue(vec3 c, float knee, float cap){
  float mx = max(c.r, max(c.g, c.b));
  if (mx <= knee) return c;
  float r = max(cap - knee, 1e-3);
  return c*((knee + r*(1. - exp(-(mx - knee)/r)))/mx);
}
// The lit fish. Its colour is held by keepHue on the flatly lit skin (E = the light on a surface that faces the
// key), and the modelling comes from form (0..1 and over), applied after it, so that no light can flatten the fish
// into one poster red: lit back and flank, shaded belly.
vec3 salmonLit(vec3 alb, vec3 E, float form){ return keepHue(alb*E, .3, .62)*form; }
float salmonForm(vec3 n, vec3 L, float lo){ return mix(lo, 1., smoothstep(-.45, .7, dot(n, L)))*mix(.62, 1., smoothstep(-.75, .35, n.y)); }
// where a point of the body lies on the flank in profile: 0 at the belly line, 1 at the back line
float salmonRel(vec3 b){
  vec3 s = b/1.8;
  float dz = s.z - .12, wT = dz < 0. ? .3 : .23, dzb = s.z - .1;
  float top = .05 + .17*exp(-dz*dz/(wT*wT)), bot = -.05 - .105*exp(-dzb*dzb/.09);
  return clamp((s.y - bot)/max(top - bot, 1e-3), 0., 1.);
}
vec3 salmonSkin(vec3 base, vec3 b, float fin, float seed, out float gloss, out float cut){
  vec3 s = b/1.8;
  vec2 sc = vec2(s.z*64., s.y*72.);
  float near = 1. - smoothstep(.4, 1.25, fwidth(sc.x) + fwidth(sc.y));
  gloss = 0.; cut = 0.;
  vec3 col = base;
  if (fin > .05) {
    float rc = s.z < -.405 ? atan(s.y, max(-.385 - s.z, 1e-3))*13. : (s.z + abs(s.y)*.9 + abs(s.x)*.6)*85.;
    float ray = abs(fract(rc) - .5)*2.;
    float thr = .8 + .2*h11(floor(rc)*1.7 + 3. + floor(seed*8.)) - .12*smoothstep(.45, 1., ray);
    cut = step(mix(1.01, thr, near), fin);
    col = (base*1.7 + vec3(.012, .003, .002))*mix(.85, mix(1.35, .5, smoothstep(.15, .85, ray)), near);       // a smoky membrane between darker rays
  } else {
    float row = floor(sc.y);
    vec2 cf = fract(vec2(sc.x + .5*mod(row, 2.), sc.y)) - .5;
    float scl = 1. - smoothstep(.12, .5, length(cf*vec2(1., 1.15)));
    float head = smoothstep(.3, .335, s.z), tail = 1. - smoothstep(-.43, -.37, s.z);
    float bodyK = near*(1. - head)*(1. - tail);
    col *= 1. + bodyK*(scl*.42 - .19);
    gloss = scl*bodyK;
    // where on the flank this is, 0 at the belly line and 1 at the back line of the fish in profile
    float dz = s.z - .12, wT = dz < 0. ? .3 : .23, dzb = s.z - .1;
    float top = .05 + .17*exp(-dz*dz/(wT*wT)), bot = -.05 - .105*exp(-dzb*dzb/.09);
    float rel = clamp((s.y - bot)/max(top - bot, 1e-3), 0., 1.);
    float back = smoothstep(.55, .8, rel)*(1. - .55*head);
    col = mix(col, col*.13 + vec3(.016, .018, .01), back*.92);            // the dark maroon-olive back
    col *= mix(1., .8, (1. - smoothstep(.05, .32, rel))*(1. - head));      // and a duller belly
    float spk = smoothstep(.6, .72, vn(vec2(s.z*80. + seed*31., s.y*95. + abs(s.x)*40.)))*smoothstep(.5, .7, rel)*(1. - head);
    col *= 1. - .5*spk*near;
    float gd = length(vec2(s.z - .392, s.y*.9 + .01));
    col *= 1. - .62*(1. - smoothstep(0., .009, abs(gd - .072)))*step(s.z, .36)*near;
    float de = length(vec2(s.z - .428, s.y - .022)), side = smoothstep(.006, .02, abs(s.x));
    col = mix(col, vec3(.3, .26, .1), (1. - smoothstep(.021, .026, de))*side*near);
    float pupil = (1. - smoothstep(.011, .015, de))*side*near;
    col = mix(col, vec3(.004), pupil);
    gloss = max(gloss, pupil*2.);
  }
  return col;
}
`;

// ---------------------------------------------------------------- materials
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogK = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float fogK = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  float fogK = 0.;
#endif
`;
function mat(shared, o) {
  return new THREE.ShaderMaterial({
    fog: true, ...o,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...(o.uniforms || {}) },
  });
}

function bearMaterial(shared, turnU) {
  return mat(shared, {
    vertexColors: true, side: THREE.DoubleSide, uniforms: { uRear: { value: new THREE.Vector4(0, 0, 0, 0) }, uRear2: { value: new THREE.Vector4(0, 0, 0, 0) }, uSubK: { value: 1 }, uSilK: { value: 1 }, uTurn: turnU || { value: new THREE.Vector4(0, 1, 0, 0) } },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${GLSL_COMMON}${GLSL_BEAR}
attribute vec4 aAux, iPos, iPar; attribute vec3 iStrike;
uniform vec4 uRear, uRear2;   // uRear = (rear-up angle, dx, dy, dz); uRear2 = (roll onto its left side, head carried lower, pawing 0..1, hind legs let go 0..1)
// the bears within uTurn.y metres of x = uTurn.x turn their heads away from it by uTurn.z radians and lift their noses by
// uTurn.w, a strike included (the fish in the jaws follows: salmonMaterial); only the keyed bear's strike is as it was
uniform vec4 uTurn;
varying vec3 vP, vN, vC, vL; varying float vTip, vFootY;
// a bear on its hind legs: the trunk turns up about the pelvis while the hind legs stay where they stand (the turn runs
// out down the leg to the planted paw) until they let go; the forelegs come up and forward off the chest and paw the
// air; the head is carried down against the turn so that it looks at what is in front of it. Then the whole animal
// can roll over onto its left side about its feet.
vec3 pose(vec3 p0, float tau){
  float hind = step(position.z, -.6)*smoothstep(0., .55, aAux.z), fore = step(-.6, position.z)*smoothstep(0., .6, aAux.z);
  float lift = uRear.x*(1. - .45*uRear2.w);
  vec3 d = p0 - vec3(${POSE.np.join(',')});
  float tdx = iPos.x - uTurn.x, tk = (1. - smoothstep(uTurn.y*.7, uTurn.y, abs(tdx)))*(1. - iStrike.z*smoothstep(-.42, -.04, tau)*(1. - smoothstep(1.9, 3.1, tau)));
  float a = (tdx < 0. ? -1. : 1.)*uTurn.z*tk*aAux.x, c = cos(a), s = sin(a);
  d.xz = vec2(d.x*c + d.z*s, -d.x*s + d.z*c);
  a = (uRear2.y + lift*.4 - uTurn.w*tk)*aAux.x; c = cos(a); s = sin(a);
  d.yz = vec2(d.y*c - d.z*s, d.y*s + d.z*c);
  vec3 q = bearPose(d + vec3(${POSE.np.join(',')}), aAux.x, aAux.y, aAux.z*(1. - min(uRear.x*1.4, 1.)*step(-.6, position.z)), tau, iPar.z);
  // forelegs: off the ground, reaching, one paw after the other
  d = q - vec3(0., 2.75, 1.05);
  a = fore*(lift*.42 + uRear2.z*(.16 + .34*sin(uTime*5.3 + sign(position.x)*1.4 + iPar.z*9.))); c = cos(a); s = sin(a);
  d.yz = vec2(d.y*c + d.z*s, -d.y*s + d.z*c); q = d + vec3(0., 2.75, 1.05);
  // trunk about the pelvis
  d = q - vec3(0., 2.45, -2.0);
  a = uRear.x*mix(1. - hind, 1., uRear2.w); c = cos(a); s = sin(a);
  d.yz = vec2(d.y*c + d.z*s, -d.y*s + d.z*c); q = d + vec3(0., 2.45, -2.0);
  q.y -= .2*min(uRear.x, 1.)*(1. - hind);           // it settles onto its haunches a little
  // roll
  d = q - vec3(0., .5, 0.); c = cos(uRear2.x); s = sin(uRear2.x);
  d.xy = vec2(d.x*c - d.y*s, d.x*s + d.y*c);
  return bearPlace(d + vec3(0., .5, 0.), iPos, iPar.xy) + uRear.yzw;
}
void main(){
  float tau = strikeTau(iStrike);
  vec3 p0 = position + aAux.w*vec3(sin(uTime*3.1+position.z*5.+iPar.z*20.), 0., cos(uTime*2.3+position.x*6.))*.035;
  vec3 w = pose(p0, tau);
  vN = safeN(pose(p0 + normal*.06, tau) - w); vP = w; vL = position; vTip = aAux.w; vFootY = iPos.y + uRear.z;
  vC = color*(.75 + .5*iPar.w)*mix(vec3(1.), vec3(1.15,.95,.8), iPar.w);
  vec4 mvPosition = modelViewMatrix*vec4(w, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform float uSubK, uSilK;
varying vec3 vP, vN, vC, vL; varying float vTip, vFootY;
void main(){
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  // fur in body space (it stays on the animal): clumps, and fine strands running down and back
  float fur = fbm(vec2(vL.x*8. + vL.z*5.5, vL.y*2.4 - vL.z*1.2));
  float fine = vn(vec2(vL.x*37. + vL.z*29., vL.y*8. - vL.z*4.5));
  float h = vP.y - vFootY, wet = (1. - smoothstep(.9, 2.9, h));
  vec3 alb = vC*(.48 + .6*fur + .42*fine)*mix(1., .7, wet);
  float ndl = dot(n, uSun), ao = .4 + .6*smoothstep(.3, 3.2, h);
  float fr = 1. - max(dot(n, V), 0.), back = max(dot(-V, uSun), 0.); back *= back;
  // against the light, or overhead against the sky, a bear is a dark shape: the direct light goes and the rim carries it
  float wl = vP.z < -.6 ? 6. : 0., sub = 1. - smoothstep(wl - .35, wl, vP.y);       // the part of it that stands in the river
  float sil = max(back, smoothstep(.1, .45, -V.y)*.9)*(1. - sub)*uSilK;
  vec3 col = alb*(uSunCol*max(ndl*.75 + .25, 0.)*max(ndl + .35, 0.)*.6*(1. - .82*sil) + (hemi(n)*mix(.42, .2, sil) + uSunCol*vec3(.05, .035, .02))*ao);
  float sp = pow(max(dot(n, safeN(uSun + V)), 0.), 36.)*(.1 + .45*wet)*fur*(1. - .7*sil);
  float lit = max(ndl*.6 + .4, 0.);
  float f6 = fr*fr*fr; f6 *= f6*fr*fr;
  // seen end-on, the whole round of the head grazes the eye and drew a pale ring where the face is: the head's skin takes
  // little rim; the wet fur of the neck and shoulders takes more, a lit fringe along the top of the dark shape
  float headK = smoothstep(2.7, 3.3, vL.z), neckK = smoothstep(-2.4, .4, vL.z)*(1. - headK)*smoothstep(2.3, 3.2, vL.y);
  float f4 = fr*fr; f4 *= f4;
  float rim = f6*(.05 + 1.*back + .4*sil*lit)*(1. - .8*headK) + vTip*mix(f6, fr*fr*fr, neckK*.8)*(.05 + .8*back + (.3 + 1.5*neckK)*sil*lit)*(.6 + .8*fine)*(1. - .5*headK);
  rim += f4*neckK*sil*lit*.45;                                   // and the wet skin under it, along the top of the back
  // the muzzle keeps its brown on the dark head (sky light off the wet fur), the nose pad and the lips stay black;
  // the forelegs are soaked: dark runnels down the fur and a cool sheen where the sky lies on it
  float muzK = smoothstep(3.7, 4.02, vL.z)*smoothstep(2.3, 2.52, vL.y)*(1. - smoothstep(4.27, 4.36, vL.z)*smoothstep(2.52, 2.66, vL.y));
  col += alb*(uSkyCol*2.2 + uSunCol*.2)*muzK*sil*(.55 + .45*smoothstep(-.5, .6, n.y));
  float foreK = smoothstep(.2, .5, vL.z)*(1. - smoothstep(1.9, 2.3, vL.z))*(1. - smoothstep(1.9, 2.7, vL.y))*(1. - sub);
  float run = vn(vec2(vL.x*43. + vL.z*37., vL.y*2.6));
  col *= 1. - foreK*.4*smoothstep(.35, .7, run);
  col += uSkyCol*foreK*fr*fr*(.05 + .22*smoothstep(.55, .8, run))*(1. - .5*sil);
  float net = vn(vP.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(vP.xz*1.7 - vec2(uTime*.4, uTime*.3));
  col += (alb*(uSunCol*(.7 + net*4.*max(n.y, 0.)) + uSkyCol*2.4)*(.3 + .7*smoothstep(-.7, .8, n.y)) + uUnderC*.12)*sub*uSubK;
  col = col*mix(vec3(1.), vec3(.5, .78, .66), sub*.75) + uSunCol*(sp + rim*vec3(1., .8, .55))*(1. - .93*sub);
  // seen from under water through the surface, what stands above it is a dark umber shape against the bright sky
  float lowEye = step(uCam.y, (uCam.z < -.6 ? 6. : 0.) - .05)*(1. - sub);
  col = mix(col, alb*vec3(1., .86, .7)*(dot(uSkyCol, vec3(.4)) + dot(uSunCol, vec3(.05)) + .08)*(.6 + .5*smoothstep(-.6, .8, n.y)), lowEye);
  // the water running off the chin (flagged by its vertex colour): bright broken strands that fall
  if (vC.b > vC.r*3. + .02) {
    if (vP.y < wl + .05 || vn(vec2(vL.x*31. + vL.z*17., vL.y*3.4 + uTime*3.8)) < .56 + .22*smoothstep(2.1, .6, vL.y)) discard;
    col = uSkyCol*.36 + uSunCol*(.05 + .3*back) + .015;
  }
    gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
  // far off under water the animal keeps its dark: a shape against the bright wall, not a green ghost
  gl_FragColor.rgb *= 1. - .36*step(uCam.y, -.05)*smoothstep(24., 42., distance(uCam, vP));
}`,
  });
}

function salmonMaterial(shared, turnU) {
  return mat(shared, {
    vertexColors: true, side: THREE.DoubleSide, uniforms: { uTurn: turnU || { value: new THREE.Vector4(0, 1, 0, 0) } },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${GLSL_COMMON}${GLSL_BEAR}
attribute vec4 aAux, iA, iB, iC, iD, iE;   // p0+T, v0+type, (period, offset, keyed, seed), bear xyz+yaw, (bear scale, girth, phase, fish size)
uniform vec4 uTurn;
varying vec3 vP, vN, vC, vB; varying float vFin, vSeed;
void main(){
  float T = iA.w, type = iB.w, seed = iC.w, tau = strikeTau(iC.xyz);
  vB = position; vSeed = seed;
  float s = type > 1.5 ? tau + T : mod(uTime + iC.y, iC.x);
  float tt = clamp(s, -.3, T + .5);
  vec3 pos = iA.xyz + iB.xyz*tt - vec3(0., ${(0.5 * G).toFixed(1)}*tt*tt, 0.);
  vec3 f = safeN(iB.xyz - vec3(0., ${G.toFixed(1)}*tt, 0.));
  float vis = smoothstep(-.3, -.12, s);
  float hold = 0.;
  if (type > 1.5) {
    hold = smoothstep(T - .04, T, s);
    // the jaws of a head that is turned aside (the bear material's uTurn, the same angles in the same order)
    float tdx = iD.x - uTurn.x, tk = (1. - smoothstep(uTurn.y*.7, uTurn.y, abs(tdx)))*(1. - iC.z);
    vec3 md = vec3(${POSE.mouth.join(',')}) - vec3(${POSE.np.join(',')});
    float ta = (tdx < 0. ? -1. : 1.)*uTurn.z*tk, tc = cos(ta), tsn = sin(ta);
    md.xz = vec2(md.x*tc + md.z*tsn, -md.x*tsn + md.z*tc);
    float headYaw = iD.w + ta;
    ta = -uTurn.w*tk; tc = cos(ta); tsn = sin(ta);
    md.yz = vec2(md.y*tc - md.z*tsn, md.y*tsn + md.z*tc);
    vec3 m = bearPlace(bearPose(md + vec3(${POSE.np.join(',')}), 1., 0., 0., tau, iE.z), iD, iE.xy);
    pos = mix(pos, m, hold);
    f = safeN(mix(f, vec3(cos(headYaw), .12, -sin(headYaw))*(seed > .5 ? 1. : -1.), hold));
    vis *= 1. - smoothstep(T + 2.2, T + 2.7, s);
  } else vis *= 1. - smoothstep(T + .2, T + .45, s);
  vec3 r = safeN(cross(vec3(.03, 1., .02), f)), u = cross(f, r);
  float roll = (seed - .5)*2.4 + (h11(seed*7.) - .5)*3.*s*(1. - hold) + hold*1.57;
  float c = cos(roll), sn = sin(roll);
  vec3 r2 = r*c + u*sn, u2 = u*c - r*sn;
  // thrash: a travelling wave from the dorsal fin back, a hard C-curve in the air and in the jaws
  float b = aAux.x, ph = s*(22. + 8.*seed) + seed*40.;
  vec3 lp = position*iE.w*vis;
  lp.x += (sin(ph - b*2.6)*.2*b*b + sin(ph*.5)*.07*(b - .35))*iE.w*vis;
  vec3 w = pos + r2*lp.x + u2*lp.y + f*lp.z;
  vec3 ln = normal; ln.x += cos(ph - b*2.6)*.3*b*step(.001, abs(normal.x));
  vN = safeN(r2*ln.x + u2*ln.y + f*ln.z); vP = w; vC = color*(.8 + .4*h11(seed*3.)); vFin = aAux.y;
  vec4 mvPosition = modelViewMatrix*vec4(w, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_SALMON_SKIN}
varying vec3 vP, vN, vC, vB; varying float vFin, vSeed;
void main(){
  float gloss, cut;
  vec3 alb = salmonSkin(vC, vB, vFin, vSeed, gloss, cut);
  float wl = vP.z < 0. ? ${LIP.toFixed(1)} : 0.;
  if ((uCam.y > wl && vP.y < wl - .06) || cut > .5) discard;
  vec3 V = safeN(uCam - vP), n = safeN(vN); if (dot(n, V) < 0.) n = -n;
  float fr = 1. - max(dot(n, V), 0.), back = max(dot(-V, uSun), 0.); back *= back;
  vec3 E = uSunCol*.3 + uSkyCol*.5 + uGndCol*.2;
  vec3 col = salmonLit(alb*(1. + vFin*(.7 + back*2.2)), E, salmonForm(n, uSun, .3));   // crimson that keeps its shading in full sun
  col += alb*uSunCol*fr*fr*(.04 + .2*back);                    // the wet edge lit through, in the fish's own colour
  float sp = pow(max(dot(n, safeN(uSun + V)), 0.), 160.) + .6*pow(max(dot(n, safeN(V + vec3(0., 1.3, 0.) + uSun*.6)), 0.), 260.);
  col += uSunCol*sp*(.3 + .5*gloss)*(1. - vFin) + uSkyCol*fr*fr*.09;           // one small wet glint, a cool sheen at the edge
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
  });
}

// drops: HDR streaks on ballistic arcs; one clock formula serves foot spray, fish trails, splash
// crowns and the bears' halos. iP = origin + life, iV = velocity + size, iT = (period, offset, keyed, start).
// Each is a slim soft bead of sky and sun light laid over what is behind it (premultiplied), drawn out along its
// flight: a spark against the dark forest, a pale fleck against the white sheet.
function dropMaterial(shared) {
  return mat(shared, {
    // (both faces: the quad is laid out along the drop's own flight, across it to the left, which turns its winding over)
    transparent: true, depthWrite: false, blending: THREE.NormalBlending, premultipliedAlpha: true, side: THREE.DoubleSide,
    uniforms: { uVH: { value: 450 } },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${GLSL_COMMON}
uniform float uVH;
attribute vec4 iP, iV, iT;
varying vec2 vQ; varying float vA; varying vec3 vP;
void main(){
  float c = mix(uTime, uKeyT, iT.z*uKeyOn);
  float s = mod(c + iT.y, iT.x) - iT.w, life = iP.w;
  float a = step(0., s)*step(s, life);
  vec3 pos = iP.xyz + iV.xyz*s - vec3(0., ${(0.5 * G).toFixed(1)}*s*s, 0.);
  vec3 vel = iV.xyz - vec3(0., ${G.toFixed(1)}*s, 0.);
  vec4 mvPosition = modelViewMatrix*vec4(pos, 1.);
  vec3 vv = (modelViewMatrix*vec4(vel, 0.)).xyz;
  float sp = length(vv.xy);
  vec2 dir = sp > 1e-3 ? vv.xy/sp : vec2(0., 1.);
  float size = iV.w*1.5*(1. - .5*s/max(life, .01));
  float px = 2.*max(-mvPosition.z, .1)/(projectionMatrix[1][1]*uVH);     // one pixel in metres at this depth
  float minS = px*.9, dim = clamp(size/minS, .12, 1.);
  size = max(size, minS)*a;
  float stretch = 1. + min(sp*.035, 1.8);
  mvPosition.xy += (dir*position.y*stretch + vec2(-dir.y, dir.x)*position.x)*size;
  vQ = position.xy; vA = a*dim*dim; vP = pos;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec2 vQ; varying float vA; varying vec3 vP;
void main(){
  float d = vQ.x*vQ.x*5. + vQ.y*vQ.y; if (d > 1.) discard;
  float k = 1. - smoothstep(0., 1., d);
  float back = max(dot(safeN(vP - uCam), uSun), 0.);
  vec3 col = uSunCol*(.42 + 1.3*back*back*back) + uSkyCol*.72;
  ${FOG_ADD}
  // (a bright core that thins to nothing at its edge, and takes a little of what is behind it away: no outline)
  gl_FragColor = vec4(col*k*k*vA*.8*(1. - fogK), clamp(k*vA*.5*(1. - fogK), 0., .6));
}`,
  });
}

const GLSL_WATER = /* glsl */`
uniform vec3 uWhite, uPool, uAmber, uHorizon, uUnder; uniform float uSolid; uniform vec2 uEye;
// foam from below: aerated water glows with the light scattered down through it, darker where the raft is thick
vec4 foamUnder(float foam, float a, float b){
  float edge = smoothstep(.04, .3, foam)*(1. - smoothstep(.4, .95, foam));
  vec3 shade = mix(uUnder*1.1, uWhite*(uSunCol*.1 + uSkyCol*.22)*vec3(.72, 1., .88), a);
  vec3 leak = uWhite*(uSunCol*.24 + uSkyCol*.42)*vec3(.8, 1., .9);
  return vec4(mix(shade, leak, clamp(edge*1.2 + b*b*.35, 0., 1.)), clamp(foam*1.15, 0., .93));
}
vec3 whiteLight(vec3 n){ return uSunCol*(max(dot(n, uSun)*.5 + .5, 0.)*.37) + uSkyCol*.42 + .03; }
vec3 skyRefl(vec3 R){ return mix(uHorizon, uSkyCol*1.2, smoothstep(.1, .5, R.y)); }
`;

function rockMaterial(shared) {
  return mat(shared, {
    vertexColors: true,
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
varying vec3 vP, vN, vC;
void main(){
  vP = position; vN = normal; vC = color;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec3 uMoss;
varying vec3 vP, vN, vC;
void main(){
  vec3 V = safeN(uCam - vP), n = safeN(vN);
  float face = 1. - smoothstep(.35, .8, abs(n.y));
  // columnar basalt: warped columns with dark joints and cross fractures
  float cx = vP.x*.62 + vn(vec2(vP.x*.3, vP.y*.2))*.9, id = floor(cx), fx = fract(cx);
  float joint = (1. - smoothstep(0., .09, min(fx, 1. - fx)));
  float jy = vP.y*.55 + h11(id)*5.;
  float cross_ = (1. - smoothstep(0., .06, abs(fract(jy) - .5)))*step(.35, h11(id + floor(jy)*7.3));
  float tone = h11(id*1.7 + floor(jy)*3.1);
  n = safeN(n + vec3((fx - .5)*.9, 0., 0.)*face);
  float grain = fbm(vP.xz*1.7 + vP.y*2.3), big = fbm(vP.xz*.21 + vP.y*.4);
  vec3 alb = vC*(.55 + .5*grain + .35*big)*mix(1., .7 + .6*tone, face);
  alb *= 1. - face*max(joint, cross_)*.75;
  float dry = smoothstep(6.4, 7.6, vP.y);
  float moss = dry*smoothstep(.45, .7, fbm(vP.xz*.5) + n.y*.25) + (1. - dry)*smoothstep(.62, .8, big)*smoothstep(.2, .7, n.y)*.6;
  alb = mix(alb, uMoss*(.6 + .8*grain), moss*.85);
  float wet = 1. - dry;
  alb *= mix(1., .72, wet);
  float wl = vP.z < -.6 ? 5.9 : -.05, under = 1. - smoothstep(wl - .25, wl, vP.y), up = smoothstep(.3, .75, n.y)*under;
  if (up > .01) {
    vec2 g = vP.xz*1.15 + vec2(vn(vP.xz*.7), vn(vP.xz*.7 + 9.))*.8, gi = floor(g), gf = fract(g);
    float dm = 9., id = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), c = o + .5 + (vec2(h21(gi + o), h21(gi + o + 37.)) - .5)*.7 - gf;
      float dd = dot(c, c); if (dd < dm) { dm = dd; id = h21(gi + o + 71.); }
    }
    float stone = 1. - smoothstep(.1, .34, dm);
    vec3 cob = mix(vec3(.2, .19, .15), mix(vec3(.52, .49, .4), vec3(.36, .39, .2), smoothstep(.45, .8, grain + id*.3)), .35 + .65*stone)*(.7 + .5*id);
    alb = mix(alb, cob, up*.85)*mix(1., .5, up*smoothstep(-3., -6.5, vP.y));
    // the apron under the boil: darker, and mottled with silt, so that it is a bed for the boulders on it and not a pale slab
    // (less so towards its outer edge at z 14, where it meets the world's own bed)
    alb *= mix(1., mix(.8, .5, smoothstep(13.6, 8.5, vP.z))*(.7 + .6*big), up*step(.5, vP.z)*smoothstep(-3., -6.5, vP.y));
    // and, between the boulders, pebbles with a clean edge each (the eye is 3 to 6 m off: the cobble pattern above is
    // too broad and too soft for that distance and read as a blurred patch)
    float apK = up*step(.5, vP.z)*smoothstep(-3., -6.5, vP.y);
    if (apK > .01) {
      // (not one size: the current has sorted the bed in tongues that run out from the face, cobbles in one, gravel
      // in the next, pale rippled sand in the slack between; the world lays its loose stones by the same tongues)
      float tongue = .5 + .28*sin(vP.x*.52 + 1.2*sin(vP.z*.19 + 1.)) + .22*sin(vP.x*1.23 - vP.z*.11 + 2.4*sin(vP.x*.2));
      float cobK = smoothstep(.52, .6, tongue), sandK = 1. - smoothstep(.36, .44, tongue), nearK = 1. - smoothstep(9., 20., length(uCam - vP));
      float pebAll = 0., idAll = 0.;
      for (int s = 0; s < 2; s++) {
        float fq = s == 0 ? 4.4 : 1.8;
        vec2 g2 = vP.xz*fq + vec2(vn(vP.xz*1.9 + 3.), vn(vP.xz*1.9 + 11.))*.6 + 17.*float(s + 1), gj = floor(g2), gg = fract(g2);
        float d2 = 9., id2 = 0.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)), c = o + .5 + (vec2(h21(gj + o), h21(gj + o + 37.)) - .5)*.8 - gg;
          float dd = dot(c, c); if (dd < d2) { d2 = dd; id2 = h21(gj + o + 71.); }
        }
        float pr = s == 0 ? .04 + .19*id2 : .09 + .17*id2, peb = (1. - smoothstep(pr*.6, pr, d2))*step(.2, id2);
        float wgt = s == 0 ? (1. - cobK)*(1. - sandK) : cobK;
        pebAll += peb*wgt; idAll += id2*wgt;
      }
      alb = mix(alb, alb*mix(.55, .78 + .55*idAll, pebAll)*mix(vec3(1.), vec3(1.04, 1., .9), idAll), apK*.9*nearK*(1. - sandK));
      float sand = (.86 + .28*vn(vP.xz*21.))*(.9 + .2*sin(vP.z*8. + vn(vP.xz*1.3)*7.));
      alb = mix(alb, vec3(.19, .19, .15)*sand, apK*sandK*.55*nearK);
    }
  }
  float ndl = max(dot(n, uSun), 0.);
  float ao = mix(.55, 1., smoothstep(-7., 5., vP.y))*(1. - face*joint*.5);
  float net = vn(vP.xz*.9 + vec2(uTime*.5, -uTime*.35))*vn(vP.xz*1.7 - vec2(uTime*.4, uTime*.3));
  vec3 col = alb*(uSunCol*ndl*(1. - .6*under) + hemi(n)*ao*(1. + .7*face*wet) + uSkyCol*.2*face*wet + uSunCol*net*2.6*up*max(uSun.y, .25));
  col *= mix(vec3(1.), vec3(.6, .84, .7), under*(1. - exp(-max(wl - vP.y, 0.)*.3)));
  float thread = smoothstep(.7, .88, vn(vec2(vP.x*5.5, vP.y*.55 + uTime*2.6)))*face*wet*(1. - under)*step(vP.y, 6.2)*step(0., vP.z);
  col = mix(col, uSkyCol*.9 + uSunCol*.12, thread*.5);
  vec3 R = reflect(-V, n);
  float fr = 1. - max(dot(n, V), 0.); fr *= fr; fr *= fr;
  col += wet*(1. - under)*(pow(max(dot(R, uSun), 0.), 30.)*uSunCol*.35*(.4 + grain) + uSkyCol*(.05 + .3*fr));
  gl_FragColor = vec4(col, 1.);
  // the apron under the boil takes the water's haze over a third of the distance (it is seen from 3 to 8 m, where the
  // full haze turned it into a pale slab); far off it still fades out entirely
  ${FOG_ADD}
  #ifdef USE_FOG
    float apron = up*step(.5, vP.z)*smoothstep(-3., -6.5, vP.y);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, mix(fogK, 1. - pow(max(1. - fogK, 0.), .35), apron));
  #endif
}`,
    uniforms: { uMoss: { value: new THREE.Color() } },
  });
}

// upper river: glassy green, accelerating to the lip, breaking white over the rock teeth and round the bears
function upperMaterial(shared, wu) {
  return mat(shared, {
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...wu, uBears: { value: [] } },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
uniform float uTime;
attribute float aFlow;
varying vec3 vP; varying float vFlow;
void main(){
  vec3 p = position; float far = (1. - smoothstep(-9., -2., p.z));
  p.y += (sin(p.x*.8 + p.z*.5 - uTime*1.7)*.03 + sin(p.x*.27 - p.z*.9 + uTime*1.1)*.04)*far;
  vP = p; vFlow = aFlow;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_WATER}
uniform vec4 uBears[12];
varying vec3 vP; varying float vFlow;
void main(){
  float lipK = smoothstep(-9., 0., vP.z);
  float s1 = fbm(vec2(vP.x*.45, vP.z*.07 - uTime*.3));
  float s2 = fbm(vec2(vP.x*1.5, vP.z*.2 - uTime*1.7));
  float s3 = vn(vec2(vP.x*4., vP.z*.5 - uTime*3.2));
  vec3 n = safeN(vec3((s1 - .5)*.22 + (s2 - .5)*.5*lipK, 1., (vn(vP.xz*.6 + uTime*.2) - .5)*.16 - lipK*lipK*.35));
  vec3 V = safeN(uCam - vP); if (V.y < 0.) n.y = -n.y;
  float F = .03 + .97*pow(1. - max(dot(n, V), 0.), 5.);
  vec3 R = reflect(-V, n);
  float shallow = (1. - smoothstep(.2, .75, vFlow))*lipK;
  vec3 body = mix(uPool*1.5, uAmber*.9, shallow*.6 + (s1 - .5)*.25)*(uSunCol*.3*max(uSun.y, 0.) + uSkyCol*.6 + .1);
  vec3 col = mix(body, skyRefl(R), F) + pow(max(dot(R, uSun), 0.), 220.)*uSunCol*2.2;
  // white: riffles over the teeth, the acceleration lines at the lip, wakes piled against the bears
  float foam = lipK*lipK*(1. - smoothstep(.12, .6, vFlow))*(.35 + .9*s2) + lipK*lipK*lipK*smoothstep(.55, .85, s2*.6 + s3*.5)*.7;
  for (int i = 0; i < 12; i++) {
    vec4 b = uBears[i]; vec2 d = vP.xz - b.xy; float r = max(b.z, .01);
    float pile = exp(-dot(d, d)/(r*r));
    float tail = exp(-d.x*d.x/(r*r*.8))*smoothstep(-r, r*.3, d.y)*exp(-max(d.y, 0.)/(r*2.2));
    foam += (pile*.9 + tail*(.45 + .9*s3))*b.w;
  }
  foam = clamp(foam, 0., 1.);
  vec3 fc = uWhite*whiteLight(vec3(0., 1., 0.))*(.72 + .3*s3);
  col = mix(col, fc, foam);
  gl_FragColor = vec4(col, mix(foam*.95, mix(.9, 1., max(F, foam)), uSolid));
  if (uEye.y > .75 && uSolid < .5) gl_FragColor = foamUnder(foam, s2, s3);
  else if (uCam.y < vP.y && uSolid < .5) gl_FragColor.a *= .2;                     // from the air under the lip the sheet's own green glass carries it       // only for an eye that is in the upper river: from the air under the lip it is white water
  #include <fog_fragment>
}`,
  });
}

// lower river: the boil at the foot (solid white for ~12 m), foam lines streaming away, dark pool green
function poolMaterial(shared, wu) {
  return mat(shared, {
    transparent: true, side: THREE.DoubleSide,
    uniforms: { ...wu },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${GLSL_COMMON}
varying vec3 vP; varying float vBoil;
void main(){
  vec3 p = position; float near = exp(-max(p.z, 0.)/6.5);
  float b = fbm(vec2(p.x*.3, p.z*.35 - uTime*.9)) + .5*vn(vec2(p.x*.9 + uTime*.7, p.z*.8 - uTime*1.6));
  p.y += (b - .7)*1.0*near*smoothstep(-.6, 1.5, p.z) + sin(p.z*.5 - uTime*1.8 + p.x*.2)*.05*(1. - near);
  vBoil = b; vP = p;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_WATER}
varying vec3 vP; varying float vBoil;
void main(){
  float near = exp(-max(vP.z, 0.)/8.5);
  float n1 = fbm(vec2(vP.x*.22 + uTime*.05, vP.z*.3 - uTime*.9));
  float n2 = fbm(vec2(vP.x*.7, vP.z*.6 - uTime*1.5) + n1*1.5);
  float n3 = vn(vec2(vP.x*2.6 + n2*2., vP.z*2.2 - uTime*2.4));
  float boil = smoothstep(.22, .7, near*1.3 + (n2 - .5)*.9*near + (n1 - .5)*.3);
  float ln = fbm(vec2(vP.x*.33 + n1*1.3, vP.z*.045 - uTime*.13));
  float lines = smoothstep(.57, .7, ln)*(1. - smoothstep(18., 72., vP.z))*(.3 + .7*n3)*smoothstep(.25, .6, n2 + near);
  float foam = clamp(boil + lines*.85, 0., 1.);
  vec3 n = safeN(vec3((n2 - .5)*.5*(near + .25), 1., (n1 - .5)*.5*(near + .25)));
  vec3 V = safeN(uCam - vP); if (V.y < 0.) n.y = -n.y;
  float F = .03 + .97*pow(1. - max(dot(n, V), 0.), 5.);
  vec3 R = reflect(-V, n);
  vec3 body = mix(uPool*.75, uAmber*.5, (n1 - .5)*.3 + near*.3)*(uSunCol*.3*max(uSun.y, 0.) + uSkyCol*.6 + .08);
  body = mix(body, uWhite*.55*whiteLight(vec3(0., 1., 0.))*vec3(.75, 1., .92), near*.5 + lines*.2);   // aerated green-white
  vec3 col = mix(body, skyRefl(R), F*.8) + pow(max(dot(R, uSun), 0.), 160.)*uSunCol*1.6;
  vec3 fc = uWhite*whiteLight(n)*mix(vec3(.48, .66, .68), vec3(1.), smoothstep(.2, .7, n2)*.55 + n3*.25 + vn(vP.xz*6.5 + vec2(n1*3., -uTime*3.))*.2)*(.82 + .24*vBoil);
  col = mix(col, fc, foam);
  float edge = (1. - smoothstep(60., 72., vP.z))*(1. - smoothstep(84., 88., abs(vP.x)));
  gl_FragColor = vec4(col, mix(foam*.96, 1., uSolid)*mix(1., edge, 1. - uSolid));
  if (uEye.x > .75 && uSolid < .5) { gl_FragColor = foamUnder(foam, n2, n3); gl_FragColor.a *= edge; }
  else if (uSolid < .5) gl_FragColor.a *= smoothstep(.6, 2.8, length(uCam - vP));     // a crest of the boil right at the lens (the top of the miss) would stand across the frame as a pale pane   // an eye in the air below a crest of the boil sees foam, not the pool's ceiling
  #include <fog_fragment>
}`,
  });
}

// the falls: three layered sheets, fibres scrolling in fall-time so they accelerate downward; green glass
// where the flow bends over the lip, threads and gaps over the rock teeth. aS = (s, layer, flow, drop)
function sheetMaterial(shared, wu) {
  return mat(shared, {
    transparent: true, side: THREE.DoubleSide,
    uniforms: { ...wu },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
uniform float uTime;
attribute vec4 aS;
varying vec3 vP; varying vec4 vS; varying vec3 vN;
void main(){
  vec3 p = position;
  float w = aS.x*aS.x;
  p.z += (sin(p.x*1.9 + uTime*4.3 + aS.y*2.) + sin(p.x*.53 - uTime*2.1))*.07*w*(1. + aS.y);
  p.x += sin(p.x*3.1 + uTime*5.7 + aS.x*7.)*.04*w;
  vP = p; vS = aS; vN = normal;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_WATER}
varying vec3 vP; varying vec4 vS; varying vec3 vN;
// A STRAND OF FALLING WATER. xc = the place across the fall in strand widths, tc = the fall clock in strand lengths,
// sd = a seed, k = how much of it shows. Every strand (one to a width) has a clock of its own and surges of a pace
// of its own (.8 to 1.2 of its size's: lengths of .83 to 1.25), so no two begin or end side by side: there are no
// rows, and so no cells. A strand is a file of surges, each coming down head first: thick at its head (the lower
// end), drawn thin behind it.
// Returns (how much water: .5 the mean and, where k is 1, .21 the spread, as the grain it replaces; its slope across
// the strand).
vec2 strand(float xc, float tc, float sd, float k){
  float i = floor(xc), f = fract(xc), w = f*f*(3. - 2.*f);
  vec2 hh = vec2(h11(i*.731 + sd), h11((i + 1.)*.731 + sd)), ph = hh*23. + tc*(.8 + .4*fract(hh*7.3));
  vec2 j = floor(ph), g = fract(ph), e = smoothstep(.55, 1., g);
  float a = mix(h21(vec2(i, j.x) + sd)*(.75 + .5*g.x), h21(vec2(i, j.x + 1.) + sd)*.75, e.x);
  float b = mix(h21(vec2(i + 1., j.y) + sd)*(.75 + .5*g.y), h21(vec2(i + 1., j.y + 1.) + sd)*.75, e.y);
  return vec2(.5 + (mix(a, b, w) - .451)*k, (b - a)*6.*f*(1. - f)*k);     // (.451: the mean of a and b by the two lines above)
}
void main(){
  float d = vS.w, tf = sqrt(d + .04), lay = vS.y, flow = vS.z, x = vP.x;
  // THE FALL CLOCK. Water that leaves the lip has fallen d = g t t/2 after t seconds: t = sqrt(2 d/g) = .4515 tf, and it
  // then falls at sqrt(2 g d) = 4.43 tf m/s. So whatever falls with the water is a function of tf - 2.215 uTime
  // (2.215 = sqrt(g/2)), and a surge that takes T seconds to pass the lip is drawn out to 4.43 tf T metres: its length
  // in tf is T/.4515 wherever it is on the face. The four sizes of strand: ropes .77 m wide and strands .2 m wide,
  // whose surges take .75 s to pass (3.4 m long one metre down, 6.7 m at four: the whole face), fibres 6.7 cm wide
  // of .56 s (2.5 and 5 m), threads 2.6 cm wide of .45 s (2 and 4 m): 4 to 150 times as long as wide. (The strand
  // itself, the column the surges run in, stands from the lip to the foot.)
  // The sheets in front are thrown further and run a tenth faster each, so their strands slide past those behind.
  float fall = tf - uTime*2.215*(1. + .1*lay), fw = fwidth(x);
  // (no two strands are of one width, and they shift across the face, slowly: a tenth of a metre a second; falling
  // water runs straight down)
  float xs = x + (vn(vec2(x*.37 + lay*5., uTime*.11)) - .5)*.8 + (vn(vec2(x*2.3 + lay*3., uTime*.23)) - .5)*.2;
  // (the water leaves the lip whole and tears into fibres as it falls; and of the three finer sizes none is drawn
  // narrower than a pixel: what is too fine to draw, or not yet torn, hands its share of the grain to the strand next
  // in size (fibres fall with the strand they are torn from), by the root of the squares. The ropes, the largest
  // size, have no size to hand theirs to and are drawn at every size of a pixel, as the coarsest grain they replace
  // was. So the grain's spread, and with it how much of the face is white, is the same whatever the size of a pixel
  // on the face. .1156, .09, .0484 and .0196 are the squares of the four sizes' own shares, .34, .3, .22 and .14.)
  float torn = .3 + .7*smoothstep(.1, 2.4, d);
  float k2 = 1. - smoothstep(.4, 1., fw*5.), k3 = torn*(1. - smoothstep(.4, 1., fw*15.)), k4 = torn*(1. - smoothstep(.4, 1., fw*38.));
  float w3 = sqrt(.0484 + (1. - k4*k4)*.0196), w2 = sqrt(.09 + (1. - k3*k3)*w3*w3), w1 = sqrt(.1156 + (1. - k2*k2)*w2*w2);
  vec2 s1 = strand(xs*1.3 + lay*31., fall*.6, 3. + lay*7., 1.);
  vec2 s2 = strand(xs*5. + lay*17., fall*.6, 11. + lay*5., k2);
  vec2 s3 = strand(xs*15. + lay*7., fall*.8, 19. + lay*3., k3);
  vec2 s4 = strand(xs*38., fall, 29., k4);
  float f1 = s1.x, f2 = s2.x, f3 = s3.x, f4 = s4.x;
  float fib = .5 + (f1 - .5)*w1 + (f2 - .5)*w2 + (f3 - .5)*w3 + (f4 - .5)*.14;      // (with every size drawn: f1*.34 + f2*.3 + f3*.22 + f4*.14)
  // AT THE FOOT the strands end in the boil's broken white: what the pool throws back up the face, a metre high and
  // ragged: clots of the boil's own sizes (.7, 2.6 and 6.5 to the metre) that climb and burst, white on the pool's
  // own foam grey
  float foot = 1. - smoothstep(-.1, 1.1, vP.y + (f1 - .5)*1.4), slopeX = s1.y*.35 + s2.y*.6 + s3.y*.25 + s4.y*.15, broken = .5;
  if (foot > .002) {
    float b2 = fbm(vec2(x*.7 + lay*3., vP.y*.9 - uTime*1.5));
    broken = smoothstep(.3, .7, b2*.4 + vn(vec2(x*2.6 + b2*2., vP.y*2.2 - uTime*2.4))*.35 + vn(vec2(x*6.5 + lay*9., vP.y*6.5 - uTime*3.))*.25);
    fib = mix(fib, .35 + .5*broken, foot); slopeX *= 1. - foot;
  }
  float cover = lay < .5
    ? smoothstep(.0, .3, flow - .12 + .34*smoothstep(.2, 4.2, d) + (fib - .5)*(.55 + .8*smoothstep(.2, 4.2, d)) + (f1 - .5)*.6*smoothstep(.5, 5., d))
    : smoothstep(.5 + .05*lay, .66 + .05*lay, fib + (flow - .5)*.3)*smoothstep(.1, 1.2, d)*.75;
  float glass = (1. - smoothstep(.1, 1.5 + flow, d))*smoothstep(.3, .75, flow)*(1. - step(.5, lay));
  cover = max(cover, smoothstep(.25, .6, foot*(.6 + .8*broken)));
  vec3 V = safeN(uCam - vP), n = safeN(vN - vec3(slopeX, 0., 0.));
  if (dot(n, V) < 0.) n = -n;
  // THE BLUE-GREY IS A STRAND'S SHADE and follows it down: on the flank a strand turns from the sun, and deeper in
  // the thin water beside it (both run the strand's length; neither is a step over a grain). The white keeps the
  // sheet's own floor; a surge is whiter than it. At the foot the shade is the boil's hollows.
  float lee = smoothstep(.1, .6, slopeX*uSun.x), thinK = 1. - smoothstep(.3, .62, fib);
  vec3 shade = mix(vec3(.5, .66, .74), vec3(1.), 1. - max(lee*.2, thinK*.36));
  shade = mix(shade, mix(vec3(.48, .66, .68), vec3(1.), .4 + .6*broken)*(1. + .15*broken), foot);      // (the pool's own foam grey; a clot is the whitest water of the fall)
  vec3 white = uWhite*whiteLight(n)*shade*(.8 + .32*fib)*(1. + .36*smoothstep(.2, .9, f2));      // (a strand is whitest where a surge is thick in it)
  float fr = 1. - max(dot(n, V), 0.);
  vec3 green = mix(uPool*2.4, uAmber*1.3, .25)*(uSunCol*.4 + uSkyCol*.5) + skyRefl(reflect(-V, n))*(.08 + .5*fr*fr*fr);
  green += pow(max(dot(reflect(-V, n), uSun), 0.), 90.)*uSunCol*1.5;
  vec3 col = mix(white, green, glass*(1. - smoothstep(.5, .72, fib)));
  float back = max(dot(-V, uSun), 0.);
  col += uSunCol*uWhite*back*back*.18*fib;                          // the sheet glows a little when back-lit
  // seen from the air below it (the failed leap), the first metre of the sheet is looked at from underneath, through the
  // river's own thickness as it bends over the rock: green glass with the light in it, its upper edge thinning away
  // in fibres (never a pale pane with a straight edge across the bears' legs)
  float underK = step(dot(vN*(vN.y >= 0. ? 1. : -1.), V), 0.)*(1. - smoothstep(.6, 1.9, d))*(1. - step(.5, lay))*step(uCam.y, vP.y);
  float a = cover*smoothstep(0., mix(.04, .05 + .16*f2, underK), vS.x);
  a *= lay < .5 ? mix(.72 + .28*fib, 1., smoothstep(.8, 3.5, d)*flow) : 1.;
  // from close under the lip (the failed leap) the river bends over it as a tongue of green glass, drawn out into
  // white streaks and breaking into the sheet a metre and a half down
  float tongue = (1. - smoothstep(.45, 1.5 + .7*flow, d))*smoothstep(.12, .45, flow)*(1. - step(.5, lay))
    *(1. - smoothstep(10., 17., length(uCam - vP)))*smoothstep(5.6, 4.2, uCam.y);
  float streak = smoothstep(.5, .74, f2*.5 + f3*.3 + f4*.2)*(.35 + .65*smoothstep(.1, 1.2, d));
  col = mix(col, mix(green*.82, white*1.04, streak), tongue*.9);
  a = mix(a, max(a, .94), tongue*cover);
  col = mix(col, green*.9 + white*streak*.45, underK);
  a = mix(a, a*.96/max(.72 + .28*fib, .5), underK*.8);
  // the sheets run 0.7 m down into the pool: to an eye in the pool their feet hung under the sunk ceiling of the boil as
  // a ruler-straight pale line along the top of the bubble wall (they are drawn after it); the wall is the falls there
  // BETWEEN THE STRANDS THE WATER STILL FALLS, thin and clear: the pool's own dark green with the sky on it, in long
  // gaps that follow the strands down. It is what the fall lets through of the rock behind it: a fifth of the rock as
  // it is, and for the rest the rock as wet basalt stands behind falling water: dark, in its upright columns (the
  // rock's own columns: its width of 1.6 m, its joints, a tone to each column from foot to top, none to a block).
  // (Not where no water comes over the lip, and not from under the lip, where the edge thins away.)
  if (lay < .5) {
    float wet = smoothstep(.1, .3, flow)*smoothstep(.1, .8, d)*(1. - underK), F = .03 + .97*fr*fr*fr*fr*fr;
    float cx = x*.62 + vn(vec2(x*.3, vP.y*.2))*.9, cf = fract(cx), joint = 1. - smoothstep(0., .09, min(cf, 1. - cf));
    vec3 thin = uPool*.75*(uSunCol*.3*max(uSun.y, 0.) + uSkyCol*.6 + .08)*(.7 + .6*h11(floor(cx)*1.7))*(1. - .75*joint);
    thin = mix(thin, skyRefl(reflect(-V, n)), F*.8);
    // (it is water and whitens as it falls: half of it the sheet's own shaded white once it is torn, and threads of white run down in it)
    thin = mix(thin, white*vec3(.5, .66, .74), .5*torn);
    thin = mix(thin, white, smoothstep(.5, .8, f3*.5 + f4*.5)*.3*torn);
    float fa = (1. - a)*.8*wet;
    col = (col*a + thin*fa)/max(a + fa, 1e-4); a += fa;
  }
  if (uEye.x > .75 && vP.y < .3) discard;
  if (a < .012) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`,
  });
}

// plume: soft billows boiling up from the foot, climbing 25 m and leaning upstream behind the bears
function plumeMaterial(shared, wu) {
  return mat(shared, {
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...wu, uPlume: { value: 1 } },
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
uniform float uTime; uniform vec3 uCam;
attribute vec4 iA, iB;        // (x, z0, phase, size), (rate, drift x, seed, top)
varying vec2 vQ; varying vec3 vP; varying vec3 vK;
void main(){
  float f = fract(uTime*iB.x + iA.z), g = 1. - (1. - f)*(1. - f);
  float tall = step(10., iB.w);
  vec3 c = vec3(iA.x + iB.y*f*8. + sin(uTime*.3 + iB.z*20.)*1.5*f, mix(.6 + g*iB.w, 6.6 + g*(iB.w - 6.), tall), mix(iA.y - g*(iA.y*.5 + iB.w*.42), -4.5 - iA.y*.7 - g*iB.w*.3, tall));
  float size = iA.w*(.45 + 1.25*g);
  float rot = mix(iB.z*6.28 + f*(iB.z - .5)*1.6, (iB.z - .5)*.8 + f*(iB.z - .5)*.5, tall), cr = cos(rot), sr = sin(rot);
  // low mist faces the camera; the tall wall is built of quads standing across the river (facing +Z, a
  // little yawed), so that seen along the lip it is edge-on and can never veil the bears in front of it
  vec2 o = vec2(position.x*cr - position.y*sr, position.x*sr + position.y*cr);
  o *= size*vec2(1., mix(1.35, 1.9, tall));           // the wall is built of tall overlapping billows, not round puffs
  vec4 mc = modelViewMatrix*vec4(c, 1.);
  float yw = (iB.z - .5)*.4;
  vec4 mvPosition = mix(mc + vec4(o, 0., 0.), modelViewMatrix*vec4(c + vec3(o.x*cos(yw), o.y, o.x*sin(yw)), 1.), tall);
  vec3 vd = c - uCam;                                   // wall quads fade out when seen edge-on
  float ed = abs(dot(vd/max(length(vd), 1e-4), vec3(-sin(yw), 0., cos(yw))));
  float show = smoothstep(0., .2, f)*(1. - smoothstep(.5, 1., f))*smoothstep(mix(9., 5., tall), mix(32., 26., tall), -mc.z)*mix(1., smoothstep(.2, .55, ed), tall);
  vQ = position.xy; vP = c; vK = vec3(show, iB.z, tall);
  gl_Position = projectionMatrix*mvPosition;
  // depth-tested 4 m behind itself: no hard line where the wall meets a bear's rump
  vec4 fp = projectionMatrix*(mvPosition - vec4(0., 0., 4.*tall, 0.));
  gl_Position.z = fp.z/max(fp.w, 1e-4)*gl_Position.w;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_WATER}
uniform float uPlume;
varying vec2 vQ; varying vec3 vP; varying vec3 vK;
void main(){
  float d = dot(vQ, vQ); if (d > 1.) discard;
  float w = fbm(vQ*1.6 + vK.y*37. + vec2(0., -uTime*.12)) ;
  float w2 = vn(vQ*4.3 + vK.y*91. + vec2(0., -uTime*.3));
  float a = (1. - d); a = a*mix(a, sqrt(a), vK.z)*smoothstep(mix(.22, .16, vK.z), .75, w*.8 + w2*.25 + (1. - d)*.3);
  float back = max(dot(safeN(vP - uCam), uSun), 0.);
  vec3 col = uWhite*(uSunCol*(.17 + .08*vQ.y + .13*back*back*back*back)*(.8 + .4*w) + uSkyCol*.55 + .04);
  gl_FragColor = vec4(col, a*vK.x*mix(.2, .25, vK.z)*uPlume);
  #include <fog_fragment>
}`,
  });
}

// bubble wall (seen from under water): three curtains of rising white under the falls. aS = (depth 0..1, layer)
function bubbleMaterial(shared, wu) {
  return mat(shared, {
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...wu, uBub: { value: new THREE.Vector2(1, 1) }, uJet: { value: 0 } },      // (share of the scene's fog it takes, gain); uJet 0..1 = seen from close by: the jets stand out as white columns
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
uniform float uTime;
attribute vec2 aS;
varying vec3 vP; varying vec2 vS;
void main(){
  vec3 p = position;
  p.z += sin(p.x*.4 + p.y*.9 + uTime*1.3 + aS.y*2.)*.3*aS.x;
  vP = p; vS = aS;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${GLSL_COMMON}${GLSL_WATER}
uniform vec2 uBub; uniform float uJet;
varying vec3 vP; varying vec2 vS;
void main(){
  float dep = vS.x, lay = vS.y;
  float plunge = fbm(vec2(vP.x*.35 + lay*9., vP.y*.25 + uTime*(1.4 - lay*.3)));         // plunging jets going down
  float bub = vn(vec2(vP.x*3. + lay*5., vP.y*2. - uTime*(2.2 + lay))) * vn(vec2(vP.x*9., vP.y*7. - uTime*4.));
  float reach = (1. - smoothstep(.3, 1.15, dep + (plunge - .5)*1.1));
  float a = reach*(.35 + .9*plunge)*(.55 + 1.6*bub)*(1. - .25*lay);
  float colm = fbm(vec2(vP.x*.24 + lay*13., vP.y*.07 - uTime*.25));
  a *= (1. - smoothstep(.9, 1., dep))*(1. - smoothstep(70., 76., abs(vP.x)))*smoothstep(0., .12, dep)*(.3 + 1.1*smoothstep(.3, .68, colm));
  vec3 col = mix(uPool*2.2 + uAmber*.4, uWhite, .55 + .45*bub)*(uSunCol*.28 + uSkyCol*.4)*(1.1 - .5*dep)*(.3 + 1.05*plunge)*vec3(.6, .9, .77)*.85;
  // fib = the grain of the white and of the skirt (fibres beyond 26 m from the eye, clouds nearer: below); topN = the
  // noise that frays the curtain's top and the skirt's lower edge
  float fib = vn(vec2(vP.x*5.5 + lay*7., vP.y*.6 + uTime*(3.4 - lay*.7)))*.6 + vn(vec2(vP.x*15., vP.y*1.5 + uTime*5.2))*.4;
  float topN = vn(vec2(vP.x*.9 + lay*5., uTime*.5))*.7 + vn(vec2(vP.x*3.1, uTime*1.1 + lay))*.3;
  // NEAR THE EYE THE GRAIN AND THE FRAYING ARE CLOUDS (fib and topN; the lines above them do not read this distance).
  // By the true distance from the eye to this point of the curtain, with no step:
  // beyond 26 m fib and topN are the two lines above; from 26 m in they go over, wholly by 12 m, to clouds. The clouds
  // are read on a field of the curtain's own x (each curtain's 7 m across from the last) and y, which rises .3 m a
  // second, is turned by 37 degrees and is shifted each way by up to .4 by a noise of 2 m cells: fib's are three
  // noises of 1.1 m, .43 m and .18 m cells (shares .5, .32, .18), topN's two of 2.4 m and .77 m cells (shares .7, .3)
  float nearK = 1. - smoothstep(12., 26., length(vP - uCam));
  if (nearK > 0.) {
    vec2 cq = mat2(.8, .6, -.6, .8)*vec2(vP.x + lay*7., vP.y - uTime*.3);
    cq += (vec2(vn(cq*.5 + 3.), vn(cq*.5 + 19.)) - .5)*.8;
    fib = mix(fib, vn(cq*.9)*.5 + vn(cq*2.3 + 7.)*.32 + vn(cq*5.6 + 11.)*.18, nearK);
    topN = mix(topN, vn(cq*.42 + 23.)*.7 + vn(cq*1.3 + 31.)*.3, nearK);
  }
  vec3 white = uWhite*(uSunCol*.3 + uSkyCol*.5)*vec3(.8, 1., .92)*(.5 + .75*fib)*(1.05 - .35*dep);
  if (uJet > .001) {
    // from close by the plunging columns are the world's own (bodies of white that stand free in the water); the
    // curtains only back them: a thin haze of bubbles that frays down from the froth ceiling, dark water below it
    float top = smoothstep(0., 1., (-.12 - vP.y)/(.2 + .8*topN));
    a = mix(a, min(a*.2, .04)*top, uJet);
  }
  // seen from within 12 to 26 m, the two inner curtains hang a ragged skirt of froth under the ceiling, down to 1 to
  // 3 m (like every curtain it has no strength at the ceiling's height and comes to its whole strength under it: THE
  // CURTAIN BEGINS UNDER THE CEILING, below). Its lower edge is drawn by the noise alone (long tongues, short tongues, fibres; nearer the eye
  // than 26 m topN and fib are going over to the clouds above), never by the mesh, and it is thin where fib is low
  float sk = -vP.y + (topN - .5)*2.2 + (fib - .5)*1.5 + (vn(vec2(vP.x*.33 + lay*3., 1.7 + uTime*.15)) - .5)*2.6;
  float skirt = lay > 1.5 ? 0. : (1. - smoothstep(.7, mix(3.4, 2., uJet), sk))*(.3 + .7*smoothstep(.22, .6, fib))*(1. - smoothstep(70., 76., abs(vP.x)));
  skirt *= max(uJet, 1. - smoothstep(12., 26., length(vP - uCam)));
  a = max(a, skirt*.8); col = mix(col, white, skirt);
  // THE CURTAIN BEGINS UNDER THE CEILING. -.78 exp(-max(z, 0)/6.5) smoothstep(-.6, 1.5, z) is the height, under its
  // own level, at which the world lays the lower river's surface over the boil at each row of that surface's mesh
  // (rows at z .35, 1.89, 3.48 m and on: .32, .58 and .46 m under; between two rows the mesh runs straight, which from
  // 1.89 m out is within 4 mm of this height and between .35 and 1.89 m lies up to .15 m above it). At this height,
  // and above it, a curtain has no strength; it comes to its whole strength .15 to .75 m under it (by topN), at every
  // distance from the eye
  a *= smoothstep(0., 1., (-.78*exp(-max(vP.z, 0.)/6.5)*smoothstep(-.6, 1.5, vP.z) - vP.y)/(.15 + .6*topN));
  ${FOG_ADD}
  gl_FragColor = vec4(col*uBub.y, clamp(a*mix(1.25, 1., uBub.x), 0., .92));
  #ifdef USE_FOG
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK*uBub.x);
  #endif
}`,
  });
}

// ---------------------------------------------------------------- light presets
const HOURS = {
  day: { sun: [-0.816, 0.574, -0.071], col: '#FFF4E0', I: 2.6, sky: [0.3, 0.44, 0.66], hor: [0.075, 0.13, 0.1], gnd: [0.1, 0.12, 0.09] },
  evening: { sun: [0.6, 0.26, 0.76], col: '#FFAE6A', I: 2.5, sky: [0.24, 0.3, 0.52], hor: [0.16, 0.12, 0.08], gnd: [0.1, 0.08, 0.07] },
  dawn: { sun: [-0.95, 0.12, -0.28], col: '#FFBCA4', I: 1.8, sky: [0.4, 0.4, 0.55], hor: [0.2, 0.17, 0.17], gnd: [0.1, 0.09, 0.1] },
  night: { sun: [-0.6, 0.6, -0.5], col: '#BFD0FF', I: 0.55, sky: [0.03, 0.05, 0.1], hor: [0.012, 0.018, 0.025], gnd: [0.01, 0.015, 0.02] },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, nz = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const season = opts.season || 'september', weather = opts.weather || 'clear', hour = HOURS[opts.hour] ? opts.hour : 'day';
  const detail = ctx.quality?.detail ?? 1, density = cl(opts.density ?? 1, 0.5, 1.5);
  const duration = opts.duration ?? 45, strikeU = opts.strikeU ?? 0.775;

  // ---- shared uniforms
  const H = HOURS[hour], grey = weather === 'clear' ? 0 : 1;
  const shared = {
    uTime: { value: 0 }, uKeyT: { value: 0 }, uKeyOn: { value: 0 },
    uSun: { value: new THREE.Vector3(...(opts.sunDir || H.sun)).normalize() },
    uSunCol: { value: new THREE.Color(H.col).multiplyScalar(H.I * (grey ? 0.3 : 1)) },
    uSkyCol: { value: new THREE.Color(...(grey ? [0.42, 0.46, 0.5].map((v) => v * (hour === 'night' ? 0.15 : 1)) : H.sky)) },
    uGndCol: { value: new THREE.Color(...H.gnd) },
    uCam: { value: new THREE.Vector3(0, 10, 100) }, uUnderC: { value: new THREE.Color(0.07, 0.19, 0.125) },
  };
  const wu = {
    uWhite: { value: new THREE.Color(pal[5]) }, uPool: { value: new THREE.Color(pal[2]) }, uAmber: { value: new THREE.Color(pal[1]) },
    uHorizon: { value: new THREE.Color(...(grey ? [0.12, 0.15, 0.14].map((v) => v * (hour === 'night' ? 0.15 : 1)) : H.hor)) },
    uSolid: { value: opts.water === false ? 0 : 1 }, uUnder: { value: new THREE.Color(0.07, 0.19, 0.125) }, uEye: { value: new THREE.Vector2(0, 0) },
  };

  // ---- layout: flow over the lip, bears, the two leap lines (all per seed)
  const sx = rng.range(0, 200);
  const nBears = cl(Math.round(opts.bears ?? (season === 'july' ? 12 : season === 'october' ? 3 : 7)), 2, 12);
  const apexX = rng.range(13.5, 19), leapX = apexX + 7.5, failX = rng.range(-30, -22);
  const bx = [failX, apexX];
  const okX = (x, gap) => bx.every((b) => Math.abs(b - x) >= gap) && !(x > apexX + 2 && x < leapX + 10);
  if (nBears >= 5) { for (const s of [-1, 1]) { const x = failX + s * rng.range(11.5, 14); if (okX(x, 10)) bx.push(x); } }
  for (let tries = 0; bx.length < nBears && tries < 600; tries++) { const x = rng.range(-64, 64); if (okX(x, nBears > 8 ? 9.5 : 11.5)) bx.push(x); }
  const teeth = []; for (let i = 0; i < 7; i++) { const x = rng.range(-70, 70); if (Math.abs(x - leapX) > 6 && bx.every((b) => Math.abs(b - x) > 3)) teeth.push([x, rng.range(1.2, 2.8)]); }
  const flowAt = (x) => {
    let f = 0.5 + 0.4 * nz.fbm2(x * 0.045 + sx, 3.1, 3) + 0.2 * nz.n2(x * 0.23 + sx, 9.7);
    f += 0.6 * Math.exp(-(((x - leapX) / 3.5) ** 2));
    for (const t of teeth) f -= 0.8 * Math.exp(-(((x - t[0]) / t[1]) ** 2));
    for (const b of bx) f = mixn(f, 0.55, Math.exp(-(((x - b) / 3) ** 2)));
    return cl(f, 0.05, 1) * ss(77, 72, Math.abs(x));
  };
  const crestAt = (x) => 5.85 - 0.9 * flowAt(x), wlAt = (x) => 5.97 - 0.3 * flowAt(x);
  const bears = bx.map((x, i) => {
    const scale = (season === 'october' ? 1.22 : 1) * rng.range(0.9, 1.1), z = -1.45 * scale - rng.range(0, 0.5);
    const yaw = i === 1 ? rng.range(0.38, 0.5) : i === 0 ? rng.range(-0.12, 0.12) : rng.range(-0.5, 0.5);
    return { x, z, y: 0, yaw, scale, girth: rng.range(0.96, 1.16), phase: rng(), tint: rng(), period: i === 1 ? 12 : rng.range(10.5, 17), offset: i === 1 ? 5 : rng.range(0, 17), keyed: i === 1 ? 1 : 0 };
  });
  const bumps = []; for (let i = 0; i < 12; i++) bumps.push([rng.range(-72, 72), rng.range(-34, -7), rng.range(1.4, 3.2), rng.range(1.6, 3.4)]);
  for (const b of bumps) if (Math.abs(b[0] - leapX) < 9.5) b[0] += (b[0] < leapX ? -1 : 1) * 12;      // none on the leap line: the landing is clear water
  const shoulder = (x, z) => ss(75, 82, Math.abs(x) + 2.5 * nz.n2(x * 0.11 + sx, z * 0.11));
  const rockTop = (x, z) => {
    let y = 3.3 + 0.7 * nz.fbm2(x * 0.06 + sx, z * 0.06, 3);
    for (const b of bumps) { const d2 = ((x - b[0]) ** 2 + (z - b[1]) ** 2) / (b[2] * b[2]); if (d2 < 6) y += b[3] * Math.exp(-d2) * (0.8 + 0.3 * nz.n2(x * 0.7, z * 0.7)); }
    y = mixn(y, crestAt(x) + 0.1 * nz.n2(x * 0.6, z * 0.6 + sx), ss(-9, -0.6, z));
    for (const b of bears) { const d = Math.hypot(x - b.x, z - b.z - 0.3); if (d < 3.6) y = mixn(y, b.y, ss(3.6, 1.7, d)); }
    const sh = shoulder(x, z); if (sh > 0) y = mixn(y, 9 + 3.2 * nz.fbm2(x * 0.09, z * 0.09 + sx, 3) + 0.4 * nz.n2(x * 0.5, z * 0.5), sh);
    return y;
  };
  for (const b of bears) b.y = crestAt(b.x) - 0.06;
  await ctx.yield();

  const object = new THREE.Group(); object.name = 'salmon-falls-ledge';

  // ---- the basalt ledge: upstream bed, lip with notches and teeth, undercut face, rubble apron, pool floor
  {
    const NX = 200, NS = 44, P = new Float32Array((NX + 1) * (NS + 1) * 3), C = new Float32Array((NX + 1) * (NS + 1) * 3), idx = [];
    const moss = mul(hexLin(pal[4]), 1.7);
    for (let i = 0; i <= NX; i++) {
      const x = -XR + (2 * XR * i) / NX, top0 = rockTop(x, 0), sh = shoulder(x, 0);
      for (let j = 0; j <= NS; j++) {
        let y, z;
        if (j <= 18) { z = -46 * Math.pow(1 - j / 18, 1.7); y = rockTop(x, z); }
        else if (j <= 21) { const k = j - 18; z = [0, 0.22, 0.34, 0.36][k]; y = top0 - [0, 0.12, 0.42, 0.9][k]; }
        else if (j <= 38) {
          const t = (j - 21) / 17; y = mixn(top0 - 0.9, BED, t);
          z = 0.36 - 0.14 * (top0 - y) * (1 - 0.4 * t) + 0.45 * nz.n2(x * 0.22 + sx, y * 0.12) + 0.22 * nz.n2(x * 0.6, y * 0.33 + sx) + ss(-3.6, -7, y) * 2.6;
        } else {
          const t = (j - 38) / 6, zb = 0.36 - 0.14 * (top0 - BED) * 0.6 + 2.6; z = mixn(zb, 14, t); y = BED + 0.5 * nz.fbm2(x * 0.1, z * 0.1 + sx, 2) * t;
        }
        if (j > 18) z += sh * (2.5 + 2 * nz.n2(x * 0.15, y * 0.15 + sx)) * ss(BED, 2, y) + ss(78, 88, Math.abs(x)) * (11 + 2 * nz.n2(y * 0.2, x * 0.2 + sx)) * (j <= 38 ? 1 : 1 - (j - 38) / 6);
        const o = (i * (NS + 1) + j) * 3; P[o] = x; P[o + 1] = y; P[o + 2] = z;
        const v = 0.8 + 0.3 * nz.n2(x * 0.13 + sx, y * 0.2 + z * 0.13), warm = 0.5 + 0.5 * nz.n2(x * 0.05, z * 0.05 + 40);
        let c = [0.115 * v * (1 + 0.15 * warm), 0.108 * v, 0.108 * v * (1.05 - 0.15 * warm)];
        if (y > 5 && y < 6.6 && flowAt(x) < 0.3) c = mix3(c, moss, 0.5);
        C[o] = c[0]; C[o + 1] = c[1]; C[o + 2] = c[2];
      }
      if (i % 12 === 11) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0; i < NX; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1, c = b + 1, d = a + 1; idx.push(a, d, c, a, c, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(idx);
    await ctx.yield();
    g.computeVertexNormals();
    await ctx.yield();
    const m = rockMaterial(shared); m.uniforms.uMoss.value.setRGB(...mul(hexLin(pal[4]), 1.9));
    const mesh = new THREE.Mesh(g, m); mesh.name = 'ledge'; object.add(mesh);
  }
  await ctx.yield();

  // ---- water: upper river, pool + boil, falls sheets, bubble wall
  const grid = (nx, ns, fn, extra) => {            // fn(i, j, x) -> [x, y, z, ...extra]
    const n = (nx + 1) * (ns + 1), P = new Float32Array(n * 3), E = extra ? new Float32Array(n * extra) : null, idx = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ns; j++) {
      const r = fn(i, j), o = i * (ns + 1) + j; P[o * 3] = r[0]; P[o * 3 + 1] = r[1]; P[o * 3 + 2] = r[2];
      for (let k = 0; k < (extra || 0); k++) E[o * extra + k] = r[3 + k];
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < ns; j++) { const a = i * (ns + 1) + j, b = a + ns + 1, c = b + 1, d = a + 1; idx.push(a, d, c, a, c, b); }
    return { P, E, idx, n };
  };
  const bearU = []; for (let i = 0; i < 12; i++) { const b = bears[i]; bearU.push(b ? new THREE.Vector4(b.x, b.z + 0.2 * b.scale, 2.3 * b.scale, 1) : new THREE.Vector4(0, -999, 1, 0)); }
  {
    const r = grid(150, 30, (i, j) => {
      const x = -XR + (2 * XR * i) / 150, t = j / 30, z = -70 * (1 - t) * (1 - t) - 0.6, f = flowAt(x);
      return [x, mixn(LIP, wlAt(x) + 0.02, ss(-5, -0.6, z)), z, f];
    }, 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(r.P, 3)); g.setAttribute('aFlow', new THREE.BufferAttribute(r.E, 1)); g.setIndex(r.idx);
    const m = upperMaterial(shared, wu); m.uniforms.uBears.value = bearU;
    const mesh = new THREE.Mesh(g, m); mesh.name = 'upperWater'; mesh.renderOrder = 1; object.add(mesh);
  }
  await ctx.yield();
  let poolMesh;
  {
    const r = grid(110, 40, (i, j) => [-XR + (2 * XR * i) / 110, 0.03, -0.5 + 72.5 * Math.pow(j / 40, 1.6)]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(r.P, 3)); g.setIndex(r.idx);
    const m = poolMaterial(shared, wu); m.depthWrite = opts.water !== false;
    poolMesh = new THREE.Mesh(g, m); poolMesh.name = 'pool'; poolMesh.renderOrder = 1; object.add(poolMesh);
  }
  await ctx.yield();
  {
    const NXs = 240, NSs = 14, parts = [], P = [], S = [], idx = []; let base = 0;
    for (let lay = 0; lay < 3; lay++) {
      const r = grid(NXs, NSs, (i, j) => {
        const x = -76 + (152 * i) / NXs, s = j / NSs, f = flowAt(x), wl = wlAt(x) + 0.02 + 0.02 * lay;
        const zl = 2.0 + 1.5 * f + 0.38 * lay + 0.25 * nz.n2(x * 0.3 + lay * 7, sx), d = (wl + 0.7) * s * s;
        return [x, wl - d, -0.6 + (zl + 0.6) * s, s, lay, f, d];
      }, 4);
      for (let k = 0; k < r.P.length; k++) P.push(r.P[k]);
      for (let k = 0; k < r.E.length; k++) S.push(r.E[k]);
      for (let k = 0; k < r.idx.length; k++) idx.push(r.idx[k] + base);
      base += r.n; parts.push(r);
      await ctx.yield();
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4)); g.setIndex(idx);
    await ctx.yield();
    g.computeVertexNormals();
    await ctx.yield();
    const mesh = new THREE.Mesh(g, sheetMaterial(shared, wu)); mesh.name = 'falls'; mesh.renderOrder = 3; object.add(mesh);
  }
  if (opts.bubbleWall !== false) {
    const P = [], S = [], idx = []; let base = 0;
    for (let lay = 0; lay < 3; lay++) {
      const r = grid(120, 8, (i, j) => { const x = -76 + (152 * i) / 120, dep = j / 8; return [x, 0.0 - dep * 6.8, [3.4, 5.4, 8.2][lay] + nz.n2(x * 0.1 + lay * 9, sx) * 0.8 + dep * (lay - 1) * 1.2, dep, lay]; }, 2);
      for (let k = 0; k < r.P.length; k++) P.push(r.P[k]);
      for (let k = 0; k < r.E.length; k++) S.push(r.E[k]);
      for (let k = 0; k < r.idx.length; k++) idx.push(r.idx[k] + base);
      base += r.n;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 2)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, bubbleMaterial(shared, wu)); mesh.name = 'bubbleWall'; mesh.renderOrder = 2; object.add(mesh);
  }
  await ctx.yield();

  // instanced-quad helper for the sprite systems
  const quadGeo = (count, attrs) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k]), 4));
    g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 8, 0), 120);
    return g;
  };
  // pick an x across the lip weighted by flow (where the water is, the spray is)
  const flowX = (lo = -72, hi = 72) => { for (let k = 0; k < 12; k++) { const x = rng.range(lo, hi); if (rng() < flowAt(x) + 0.12) return x; } return rng.range(lo, hi); };

  // ---- plume
  let plumeMat = null;
  if (opts.plume !== false) {
    const n = Math.round(380 * (0.6 + 0.4 * detail)), iA = [], iB = [];
    for (let i = 0; i < n; i++) {
      const tall = rng() < 0.55, top = tall ? rng.range(12, 21) : rng.range(2, 4.6);
      iA.push(tall ? rng.range(-74, 74) : flowX(), rng.range(1.5, 5.5), rng(), (tall ? rng.range(6.5, 10.5) : rng.range(1.5, 2.8)));
      iB.push(1 / rng.range(tall ? 11 : 6, tall ? 18 : 10), rng.range(-0.5, 0.5), rng(), top);
    }
    plumeMat = plumeMaterial(shared, wu); plumeMat.uniforms.uPlume.value = (weather === 'clear' ? 1 : 1.5) * (opts.plumeOpacity ?? 1);
    const mesh = new THREE.Mesh(quadGeo(n, { iA, iB }), plumeMat); mesh.name = 'plume'; mesh.renderOrder = 5; mesh.frustumCulled = false; object.add(mesh);
  }
  await ctx.yield();

  // keyed bear: choose its loop so that the clock at u = 0 (the portal preview) finds it idle
  { const b = bears[1], c0 = -strikeU * duration; for (let p = 12; p <= 17; p += 0.5) { const t0 = (((c0 + 5) % p) + p) % p - 5; if (t0 > 3.6 && t0 < p - 7) { b.period = p; break; } } }

  // ---- bears
  const instanced = (base, count, attrs) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
    for (const k of ['position', 'normal', 'color', 'aAux']) g.setAttribute(k, base.getAttribute(k));
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1]));
    g.instanceCount = count; return g;
  };
  let bearTris = 0, bearBase = null, bearMat = null;
  const turnU = { value: new THREE.Vector4(0, 1, 0, 0) };      // one head turn for the lip bears and for the fish in their jaws
  {
    const base = await bearGeometry(rng, pal, ctx); bearTris = base.index.count / 3; bearBase = base;
    await ctx.yield();
    const iPos = [], iPar = [], iStrike = [];
    for (const b of bears) { iPos.push(b.x, b.y, b.z, b.yaw); iPar.push(b.scale, b.girth, b.phase, b.tint); iStrike.push(b.period, b.offset, b.keyed); }
    bearMat = bearMaterial(shared, turnU);
    const mesh = new THREE.Mesh(instanced(base, bears.length, { iPos: [iPos, 4], iPar: [iPar, 4], iStrike: [iStrike, 3] }), bearMat);
    mesh.name = 'bears'; mesh.frustumCulled = false; object.add(mesh);
    for (const b of bears) { b.mouth = mouthAtSnap(b); b.head = placeBear([0, 2.95, 4.0], b); }
  }
  await ctx.yield();

  // ---- salmon on ballistic arcs + every drop they and the bears throw
  const dP = [], dV = [], dT = [];
  const drop = (p, v, life, size, period, offset, keyed, start) => { dP.push(p[0], p[1], p[2], life); dV.push(v[0], v[1], v[2], size); dT.push(period, offset, keyed, start); };
  const fA = [], fB = [], fC = [], fD = [], fE = [], fFar = []; let nFish = 0;      // fFar: 1 = drawn with the far fish geometry
  const fArc = [];
  const addFish = (p0, v0, T, type, period, offset, keyed, b, rng0 = rng, big = 1) => {
    const rng = rng0;
    const seed = rng(), size = rng.range(0.85, 1.15) * (season === 'october' ? 0.92 : 1) * big;
    fA.push(p0[0], p0[1], p0[2], T); fB.push(v0[0], v0[1], v0[2], type); fC.push(period, offset, keyed, seed);
    fD.push(b ? b.x : 0, b ? b.y : 0, b ? b.z : 0, b ? b.yaw : 0); fE.push(b ? b.scale : 1, b ? b.girth : 1, b ? b.phase : 0, size); fFar.push(0); nFish++;
    fArc.push({ p0, v0, T, type, keyed, b, size, d: dP.length / 4 });      // what offRoute needs of this fish (d: the first of its drops)
    const at = (t) => [p0[0] + v0[0] * t, p0[1] + v0[1] * t - 0.5 * G * t * t, p0[2] + v0[2] * t], vel = (t) => [v0[0], v0[1] - G * t, v0[2]];
    const ts = (v0[1] - Math.sqrt(Math.max(v0[1] * v0[1] + 2 * G * p0[1], 0))) / G, st = type === 2 ? 5 - T : 0;
    const s0 = at(ts);
    for (let k = 0; k < 6; k++) { const a = rng() * 6.283, r = rng.range(1.5, 3.8); drop([s0[0], 0.1, s0[2]], [Math.cos(a) * r, rng.range(4, 9.5), Math.sin(a) * r], rng.range(0.5, 0.9), rng.range(0.07, 0.13), period, offset, keyed, st + ts + rng() * 0.06); }
    for (let k = 0; k < 8; k++) { const te = ts + (T - ts) * ((k + rng()) / 8) * 0.85, p = at(te), v = vel(te); drop(p, [v[0] * 0.5 + rng.range(-1.5, 1.5), v[1] * 0.5 + rng.range(-1, 2), v[2] * 0.5 + rng.range(-1.5, 1.5)], rng.range(0.45, 0.8), rng.range(0.05, 0.1), period, offset, keyed, st + te); }
    if (type < 2) {
      // (more of both for the leapers, the big drops first: drawn from a stream of this fish's own, so that nothing
      // else's draws move)
      const er = makeRng((Math.floor(seed * 1e6) * 31 + 7) >>> 0);
      for (let k = 0; k < 5; k++) { const a = er() * 6.283, r = er.range(0.8, 2.6); drop([s0[0], 0.1, s0[2]], [Math.cos(a) * r + v0[0] * 0.3, er.range(6, 11), Math.sin(a) * r + v0[2] * 0.4], er.range(0.6, 1.0), er.range(0.16, 0.3), period, offset, keyed, st + ts + er() * 0.08); }
      for (let k = 0; k < 5; k++) { const te = ts + (T - ts) * ((k + er()) / 5) * 0.6, p = at(te), v = vel(te); drop(p, [v[0] * 0.6 + er.range(-1, 1), v[1] * 0.6 + er.range(-1.5, 0.5), v[2] * 0.6 + er.range(-1, 1)], er.range(0.5, 0.9), er.range(0.11, 0.2), period, offset, keyed, st + te); }
      const e = at(T), ye = type === 1 ? LIP + 0.1 : 0.1;
      for (let k = 0; k < 8; k++) { const a = rng() * 6.283, r = rng.range(2, 5); drop([e[0], ye, e[2]], [Math.cos(a) * r, rng.range(5, 11), Math.sin(a) * r + (type === 0 ? 1.5 : 0)], rng.range(0.6, 1.0), rng.range(0.1, 0.2), period, offset, keyed, T + rng() * 0.05); }
    } else {
      const m = b.mouth, rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw), fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
      for (let k = 0; k < 24; k++) { const a = rng() * 6.283, r = rng.range(2, 8); drop([m.x, m.y, m.z], [Math.cos(a) * r, rng.range(1, 9), Math.sin(a) * r], rng.range(0.5, 1.0), rng.range(0.08, 0.15), period, offset, keyed, 4.86 + rng() * 0.16); }
      for (let k = 0; k < 36; k++) {
        const side = rng.sign() * rng.range(4, 10), up = rng.range(2, 8.5), fw = rng.range(-2.5, 2.5), o = rng.range(-0.9, 0.9);
        drop([m.x + rx * o - fx * 0.5, m.y + 0.4, m.z + rz * o - fz * 0.5], [rx * side + fx * fw, up, rz * side + fz * fw], rng.range(0.6, 1.1), rng.range(0.07, 0.14), period, offset, keyed, 5 + rng.range(0.5, 1.8));
      }
    }
  };
  for (const b of bears) {                                   // one fish per bear, taken at the snap
    const m = b.mouth, T = rng.range(0.84, 0.98);
    const p0 = b.keyed ? [leapX - 2.6, -1, 7.2] : [m.x + rng.range(-2.5, 2.5), -1, m.z + rng.range(2.6, 5)];
    addFish(p0, [(m.x - p0[0]) / T, (m.y - p0[1]) / T + 0.5 * G * T, (m.z - p0[2]) / T], T, 2, b.period, b.offset, b.keyed, b);
  }
  const keep = { f: fA.length, d: dP.length, n: nFish };
  const nAmb = Math.round(62 * density * (season === 'july' ? 2 : season === 'october' ? 0.4 : 1));
  for (let i = 0; i < nAmb; i++) {
    let x = 0;
    for (let k = 0; k < 20; k++) { x = rng() < 0.4 ? rng.pick(bears).x + rng.range(-6, 6) : flowX(-70, 70); if ((x < apexX - 4.5 || x > leapX + 9) && Math.abs(x - failX) > 4 && Math.abs(x) < 72) break; }
    const nearBear = bears.some((b) => Math.abs(b.x - x) < 3.6), clear = !nearBear && rng() < 0.2;
    const z0 = rng.range(3.5, 9), h = clear ? rng.range(7.5, 8.9) : rng.range(2.0, 5.6), yEnd = clear ? LIP : 0;
    const vy = Math.sqrt(2 * G * (h + 1)), T = (vy + Math.sqrt(vy * vy - 2 * G * (yEnd + 1))) / G;
    const z1 = clear ? rng.range(-6, -2.6) : rng.range(0.7, 3.2), period = T + rng.range(1.5, 4.0);
    addFish([x, -1, z0], [rng.range(-1.5, 1.5), vy, (z1 - z0) / T], T, clear ? 1 : 0, period, rng.range(0, period), 0, null);
  }
  // Those were drawn and are now put back: the leapers are laid out again from a stream of their own (so the ledge and
  // everything after it keep their random draws). More than half of them rise from the stretch between the two leap
  // lines, which the run along the face looks at from 30 to 40 m: these are the largest of the run (1.15), jump higher against the
  // white sheet, wait less between jumps, and two in five clear the lip beside the bears.
  fA.length = fB.length = fC.length = fD.length = fE.length = keep.f; dP.length = dV.length = dT.length = keep.d; nFish = keep.n; fFar.length = keep.n;
  fArc.length = keep.n;
  {
    const ar = makeRng((((ctx.seed ?? 1) | 0) * 2749 + 77) >>> 0), mid0 = failX + 4.5, mid1 = apexX - 5;
    const flowXr = (lo, hi) => { for (let k = 0; k < 12; k++) { const x = ar.range(lo, hi); if (ar() < flowAt(x) + 0.12) return x; } return ar.range(lo, hi); };
    // (July has twice September's leapers up to 115: at high density the doubled crowd alone drew 97k triangles)
    const nLeap = Math.round(72 * (season === 'july' ? Math.min(density * 2, 1.6) : season === 'october' ? density * 0.4 : density));
    for (let i = 0; i < nLeap; i++) {
      const mid = i < nLeap * 0.56;
      let x = 0;
      for (let k = 0; k < 20; k++) { x = mid ? ar.range(mid0, mid1) : ar() < 0.4 ? ar.pick(bears).x + ar.range(-6, 6) : flowXr(-70, 70); if ((x < apexX - 4.5 || x > leapX + 9) && Math.abs(x - failX) > 4 && Math.abs(x) < 72) break; }
      const nearBear = bears.some((b) => Math.abs(b.x - x) < 3.6), clear = !nearBear && ar() < (mid ? 0.42 : 0.2);
      const z0 = ar.range(3.5, 9), h = clear ? ar.range(7.5, 9.3) : mid ? ar.range(3.3, 6.3) : ar.range(2.0, 5.6), yEnd = clear ? LIP : 0;
      const vy = Math.sqrt(2 * G * (h + 1)), T = (vy + Math.sqrt(vy * vy - 2 * G * (yEnd + 1))) / G;
      const z1 = clear ? ar.range(-6, -2.6) : ar.range(0.7, 3.2), period = T + (mid ? ar.range(0.7, 2.3) : ar.range(1.5, 4.0));
      addFish([x, -1, z0], [ar.range(-1.5, 1.5), vy, (z1 - z0) / T], T, clear ? 1 : 0, period, ar.range(0, period), 0, null, ar, mid ? 1.15 : 1);
      // the eye comes near the face on the two leap lines only: a leaper more than 10 m to the side of both is never
      // nearer than that and is drawn with the far geometry
      fFar[nFish - 1] = x > failX - 9 && x < failX + 10 ? 0 : x > apexX - 11 && x < leapX + 12 ? 0 : 1;
    }
  }
  let fishTris = 0;
  {
    await ctx.yield();
    const base = salmonGeometry(pal, season); fishTris = base.index.count / 3;
    await ctx.yield();
    const fishMat = salmonMaterial(shared, turnU), lod = [[], []];
    for (let i = 0; i < nFish; i++) lod[fFar[i] ? 1 : 0].push(i);
    const pick = (src, list) => { const o = new Float32Array(list.length * 4); for (let k = 0; k < list.length; k++) for (let j = 0; j < 4; j++) o[k * 4 + j] = src[list[k] * 4 + j]; return o; };
    for (let t = 0; t < 2; t++) {
      const list = lod[t]; if (!list.length) continue;
      const geo = t ? salmonGeometry(pal, season, 8, 1) : base;
      const mesh = new THREE.Mesh(instanced(geo, list.length, { iA: [pick(fA, list), 4], iB: [pick(fB, list), 4], iC: [pick(fC, list), 4], iD: [pick(fD, list), 4], iE: [pick(fE, list), 4] }), fishMat);
      mesh.name = t ? 'salmon-far' : 'salmon'; mesh.frustumCulled = false; object.add(mesh);
      for (let k = 0; k < list.length; k++) { fArc[list[k]].at = mesh.geometry.attributes; fArc[list[k]].slot = k * 4; }
      await ctx.yield();
    }
  }
  await ctx.yield();
  const nFoot = Math.round(1500 * detail);
  for (let i = 0; i < nFoot; i++) {
    const x = flowX(-74, 74), vy = rng.range(4, 12.5), life = Math.min((2 * vy) / G, 1.2) * rng.range(0.7, 1), period = life + rng.range(0.2, 1.6);
    drop([x, 0.2, rng.range(1.2, 4.4)], [rng.range(-2, 2), vy, rng.range(0, 9)], life, rng.range(0.06, 0.14), period, rng.range(0, period), 0, 0);
  }
  for (const b of bears) for (let i = 0; i < 26; i++) {       // water breaking round their legs at the lip
    const vy = rng.range(2, 5.5), life = (2 * vy) / G, period = life + rng.range(0.2, 1.2);
    drop([b.x + rng.range(-1.8, 1.8) * b.scale, LIP + 0.05, b.z + rng.range(0.5, 2.4)], [rng.range(-2, 2), vy, rng.range(0.5, 4)], life, rng.range(0.05, 0.11), period, rng.range(0, period), 0, 0);
  }
  const nDrops = dP.length / 4, dropMat = dropMaterial(shared);
  {
    const mesh = new THREE.Mesh(quadGeo(nDrops, { iP: dP, iV: dV, iT: dT }), dropMat);
    mesh.name = 'drops'; mesh.renderOrder = 6; mesh.frustumCulled = false; object.add(mesh);
  }

  // ---- anchors, API
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), apex = bears[1];
  const anchors = {
    lipY: LIP, poolY: 0, bedY: BED, leapX, failX, apexBear: 1, apexMouth: apex.mouth.clone(), plumeTop: 27,
    sunDir: shared.uSun.value.clone(), bounds: { radius: 95 },
    flyThrough: [V3(leapX + 7, -3, 26), V3(leapX + 2, -3, 14), V3(leapX + 0.4, -0.2, 7.4), V3(leapX, 5.4, 2.6), V3(leapX, 8.6, 0), V3(leapX, 8.0, -4.5), V3(leapX, 6.0, -9), V3(leapX, 5.0, -15), V3(leapX, 6.5, -40)],
    failedLeap: [V3(failX, -3, 22), V3(failX, 0, 14), V3(failX, 3.5, 9), V3(failX + 1.5, 1.6, 7), V3(failX + 4, -1.8, 9)],
    portalSeat: { position: V3(leapX, LIP + 0.5, -115), facing: V3(0, 0, 1) },
    viewpoints: { far: V3(0, 1.2, 160), slant: V3(-32, 0.5, 46), foot: V3(failX, 3.5, 9), apex: V3(leapX, 8.6, 0) },
    bears: bears.map((b) => ({ position: V3(b.x, b.y, b.z), yaw: b.yaw, scale: b.scale, head: b.head.clone(), mouth: b.mouth.clone() })),
  };
  const inv = new THREE.Matrix4(), size = new THREE.Vector2();
  let keyed = false;
  const hero = {
    object, radius: 46, height: 22, center: V3(0, 5, 0), anchors, ground: true, groundY: -0.35,
    cost: { bearTriangles: bearTris, fishTriangles: fishTris, fish: nFish, drops: nDrops },
    surfaceAt: (x, z) => (z > -0.6 ? 0 : mixn(LIP, wlAt(x), ss(-5, -0.6, z))),
    uniforms: shared, waterUniforms: wu, flowAt, crestAt, rockTop, bearTurn: bearMat.uniforms.uTurn,
    addBears(list, o = {}) {
      const iPos = [], iPar = [], iStrike = [];
      for (const b of list) { iPos.push(b.x, b.y, b.z, b.yaw ?? 0); iPar.push(b.scale ?? 1, b.girth ?? 1, b.phase ?? 0, b.tint ?? 0.5); iStrike.push(b.period ?? 14, b.offset ?? 0, 0); }
      const m = o.own ? bearMaterial(shared) : bearMat;
      if (o.own && o.subK !== undefined) m.uniforms.uSubK.value = o.subK;
      if (o.own && o.silK !== undefined) m.uniforms.uSilK.value = o.silK;
      const mesh = new THREE.Mesh(instanced(bearBase, list.length, { iPos: [iPos, 4], iPar: [iPar, 4], iStrike: [iStrike, 3] }), m);
      mesh.name = o.name || 'moreBears'; mesh.frustumCulled = false; object.add(mesh);
      return { mesh, rear: m.uniforms.uRear, rear2: m.uniforms.uRear2, triangles: bearTris * list.length };
    },
    setStrikeClock(s) { keyed = true; shared.uKeyOn.value = 1; shared.uKeyT.value = s; },
    setProgress(u) { hero.setStrikeClock((u - strikeU) * duration); },
    setLight(l = {}) {
      if (l.sunDir) { shared.uSun.value.set(l.sunDir.x ?? l.sunDir[0], l.sunDir.y ?? l.sunDir[1], l.sunDir.z ?? l.sunDir[2]).normalize(); anchors.sunDir.copy(shared.uSun.value); }
      if (l.sunColor) shared.uSunCol.value.set(l.sunColor).multiplyScalar(l.sunIntensity ?? 2.6);
      if (l.sky) shared.uSkyCol.value.set(l.sky);
      if (l.horizon) wu.uHorizon.value.set(l.horizon);
      if (l.ground) shared.uGndCol.value.set(l.ground);
    },
    update(dt, time, camera) {
      shared.uTime.value = time;
      object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
      shared.uCam.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); dropMat.uniforms.uVH.value = Math.max(size.y, 1); }
    },
    dispose() {},
  };
  // The ledge is laid before the world has a route. Once the route stands the world calls offRoute with its walk of
  // the route's line (walk.near, walk.dist, walk.body; walk.clear is the clearance it asks of a body), and every
  // leaper's and every taken fish's whole arc is held off the whole of that line: a visitor may arrive at any clock,
  // so nothing ties the instant of a leap to the place of the eye on the route. An arc that comes nearer than the
  // clearance to any place of the route gets another start: the one nearest the drawn start, in the box its law
  // draws starts from, that clears. Where no start of that box clears, a taken fish's box grows to either side by
  // the least that clears, to no more than twice its width, and the start is the one at that least width that
  // clears (the nearest to the drawn start if more than one does); where even that fails, the start of the grown
  // box that keeps the most. A leaper's law has no side to grow: where no start of its box clears, the one of its
  // box that keeps the most.
  //   A taken fish keeps its flight time T and is thrown anew from the moved start, so that every arc still ends at
  //   its bear's mouth at the snap.
  //   A leaper keeps its line across the face (x, and with it all its law asks of x: off the bears, off the two leap
  //   lines, the near or the far body, whether it may clear the lip), its height, its time and the place it comes
  //   down at; its start goes nearer to the face or farther from it (z0, which its law draws from 3.5 to 9 m out).
  // The drops a fish throws go with it. The keyed bear's fish is as it was. Returns what was moved.
  hero.offRoute = async (walk, pause = async () => {}) => {
    const C = walk.clear, dA = object.getObjectByName('drops').geometry.attributes, dPa = dA.iP.array, dVa = dA.iV.array, dTa = dA.iT.array, moved = [];
    // gap: the least clearance of one arc, counted no higher than the clearance: a taken fish's from 0.3 s before
    // its start, where it begins to grow, to the mouth at T; a leaper's from its start to 0.45 s past its fall,
    // where it has shrunk to nothing. What is walked is the arc alone. A taken fish is drawn on past T, held in its
    // bear's jaws, and over the last 0.04 s before T it is drawn off the arc toward those jaws: there it is at the
    // bear's own place, which the head carries, and is not walked. Given a floor lo it only tells whether the arc
    // keeps lo, and returns at the first clearance under it.
    // The walk goes as fast as it safely can. The measure is walk.body's: five points along the spine, one size to
    // either end, less 0.17 of the size, as the world measures a body beside the route (of the fins and of the
    // thrash beyond those points it says nothing). None of the five is farther from the middle than one size: while
    // the middle is farther from the route than 1.17 sizes and the floor, the walk goes on by the rest of that
    // distance. Nearer, the body is measured, and the next step is the time in which none of the five points
    // can close what the measure leaves above the floor (rate: the arc's top speed, the turn of the body along
    // its path, never faster than G / vh, and the growing of the body, 1.17 sizes at 1.5 / 0.18 a second at most:
    // 9.75 sizes a second), though never less than the lesser of 10 ms and the time its fastest point takes over 2 cm.
    const gap = (sel, p, v, T, type, size, lo) => {
      const t0 = type === 2 ? -0.3 : 0, t1 = type === 2 ? T : T + 0.45, vh = Math.hypot(v[0], v[2]);
      const top = Math.max(Math.hypot(vh, v[1] - G * t0), Math.hypot(vh, v[1] - G * t1)), rate = top + size * (G / Math.max(vh, 0.001) + 9.75);
      let best = C, ref = lo === undefined ? C : lo;
      for (let t = t0; ;) {
        const s = Math.min(t, t1), sz = size * (type === 2 ? ss(-0.3, -0.12, s) : 1 - ss(T + 0.2, T + 0.45, s));
        const x = p[0] + v[0] * s, y = p[1] + v[1] * s - 0.5 * G * s * s, z = p[2] + v[2] * s, wy = v[1] - G * s, sp = Math.hypot(vh, wy);
        const spare = walk.dist(sel, x, y, z) - 1.17 * size - ref;
        if (spare > 0.02) t += spare / top;
        else {
          const g = walk.body(sel, x, y, z, v[0] / sp, wy / sp, v[2] / sp, sz);
          if (g < ref && lo !== undefined) return g;
          if (g < best) { best = g; if (lo === undefined) ref = g; }
          t += Math.max((g - ref) / rate, Math.min(0.01, 0.02 / (sp + size * G * vh / (sp * sp))));
        }
        if (s >= t1) return best;
      }
    };
    let work = 0;
    for (const A of fArc) {
      // (the keyed bear's fish is not on the clock: strikeTau gives it and its bear the strike clock that the world
      // sets at every update from the place of the eye on the route (setStrikeClock), so at any one place of the eye
      // it is at the same instant of its arc on every visit, whatever the clock: it stays as it was laid)
      if (A.keyed) continue;
      const { p0, v0, T, type, size } = A, m = type === 2 ? A.b.mouth : null, z1 = p0[2] + v0[2] * T, reach = C + 1.17 * size;
      // every start its law may draw: a taken fish's up to 2.5 m to either side of the mouth and 2.6 to 5 m out from
      // it, a leaper's on its own line 3.5 to 9 m out from the face; and the throw from there (a taken fish to be at
      // the mouth at T, a leaper to come down where it was drawn to)
      const box = type === 2 ? [-2.5, 2.5, 2.6, 5] : [0, 0, 3.5, 9];
      const start = type === 2 ? (a, c) => [m.x + a, p0[1], m.z + c] : (a, c) => [p0[0], p0[1], c];
      const vel = type === 2 ? (p) => [(m.x - p[0]) / T, v0[1], (m.z - p[2]) / T] : (p) => [v0[0], v0[1], (z1 - p[2]) / T];
      // the route's points that an arc from any start of the box could come near
      const t0 = type === 2 ? -0.3 : 0, t1 = type === 2 ? T : T + 0.45, tm = Math.min(Math.max(v0[1] / G, t0), t1), yAt = (t) => p0[1] + v0[1] * t - 0.5 * G * t * t;
      let x0 = Infinity, x1 = -Infinity, zz0 = Infinity, zz1 = -Infinity;
      for (const a of [box[0], box[1]]) for (const c of [box[2], box[3]]) { const p = start(a, c), v = vel(p); for (const t of [t0, t1]) { const x = p[0] + v[0] * t, z = p[2] + v[2] * t; x0 = Math.min(x0, x); x1 = Math.max(x1, x); zz0 = Math.min(zz0, z); zz1 = Math.max(zz1, z); } }
      const sel = walk.near(x0 - reach, x1 + reach, Math.min(yAt(t0), yAt(t1)) - reach, yAt(tm) + reach, zz0 - reach, zz1 + reach);
      if (!sel.length) continue;
      const was = gap(sel, p0, v0, T, type, size);
      if (was >= C) continue;
      // the starts of the box on a lattice of a quarter of a metre (0.24 m out from the mouth), the nearest to the
      // drawn start first: the first that clears. Failing that a taken fish's box grows (below), and the grown box
      // has the last word for it: a taken fish that no start of the grown box betters stays where it was drawn. A
      // leaper gets the one of this list that keeps the most (asked from the far end of the list, and measured in
      // full only where it keeps what the best so far keeps), and stays where it was drawn if none betters that.
      const na = type === 2 ? 20 : 0, nc = type === 2 ? 10 : 22, cand = [];
      const a0 = type === 2 ? p0[0] - m.x : 0, c0 = type === 2 ? p0[2] - m.z : p0[2];
      for (let ia = 0; ia <= na; ia++) for (let ic = 0; ic <= nc; ic++) { const a = na ? box[0] + (box[1] - box[0]) * ia / na : 0, c = box[2] + (box[3] - box[2]) * ic / nc; cand.push([Math.hypot(a - a0, c - c0), a, c]); }
      cand.sort((q, r) => q[0] - r[0]);
      let at = null, most = was;
      for (const q of cand) {
        if (!(++work & 31)) await pause();
        const p = start(q[1], q[2]); if (gap(sel, p, vel(p), T, type, size, C) >= C) { at = q; most = C; break; }
      }
      // Where no start of that box clears, a taken fish's box grows to either side by the least that clears, to no
      // more than twice its width (to 2 x 2.5 = 5 m to either side of the mouth, still 2.6 to 5 m out). The half
      // width goes up by the lattice's quarter of a metre (ten steps from 2.5 to 5 m) until a start at that width,
      // on either side and at one of the lattice's eleven distances out, clears; then it is halved back six times
      // toward the last width that failed: the width kept clears, and the width 0.25 / 64 m (under 4 mm) narrower
      // does not. That is the least width that clears as far as these steps tell (a narrower width that clears
      // between two steps that fail is not looked for). The
      // start is the one at that width that clears, the nearest to the drawn start if more than one does. Where
      // none clears even at twice the width: of the grown box's lattice (41 by 11 starts), the one that keeps the
      // most. wide: the route's points that an arc from any start of the grown box could come near.
      let wide = null;
      if (!at && type === 2) {
        const far = 2 * box[1], da = (box[1] - box[0]) / na;
        let wx0 = Infinity, wx1 = -Infinity, wz0 = Infinity, wz1 = -Infinity;
        for (const a of [-far, far]) for (const c of [box[2], box[3]]) { const p = start(a, c), v = vel(p); for (const t of [t0, t1]) { const x = p[0] + v[0] * t, z = p[2] + v[2] * t; wx0 = Math.min(wx0, x); wx1 = Math.max(wx1, x); wz0 = Math.min(wz0, z); wz1 = Math.max(wz1, z); } }
        wide = walk.near(wx0 - reach, wx1 + reach, Math.min(yAt(t0), yAt(t1)) - reach, yAt(tm) + reach, wz0 - reach, wz1 + reach);
        // edge: of the starts at the half width w (either side, the lattice's distances out) that clear, the nearest
        // to the drawn start; null where none clears
        const edge = async (w) => {
          let q = null;
          for (const a of [-w, w]) for (let ic = 0; ic <= nc; ic++) {
            if (!(++work & 31)) await pause();
            const c = box[2] + (box[3] - box[2]) * ic / nc, p = start(a, c);
            if (gap(wide, p, vel(p), T, type, size, C) >= C) { const d = Math.hypot(a - a0, c - c0); if (!q || d < q[0]) q = [d, a, c]; }
          }
          return q;
        };
        let w = box[1], q = null;
        for (let k = 1; k <= na / 2 && !q; k++) { w = box[1] + k * da; q = await edge(w); }
        if (q) {
          let lo = w - da, hi = w;
          for (let k = 0; k < 6; k++) { const mid = (lo + hi) / 2, r = await edge(mid); if (r) { hi = mid; q = r; } else lo = mid; }
          at = q; most = C;
        } else for (let ia = 0; ia <= 2 * na; ia++) for (let ic = 0; ic <= nc; ic++) {
          if (!(++work & 31)) await pause();
          const a = -far + da * ia, c = box[2] + (box[3] - box[2]) * ic / nc, p = start(a, c), v = vel(p);
          if (gap(wide, p, v, T, type, size, most) >= most) { const g = gap(wide, p, v, T, type, size); if (g > most) { at = [Math.hypot(a - a0, c - c0), a, c]; most = g; } }
        }
      }
      if (!at && !wide) for (let k = cand.length - 1; k >= 0; k--) {
        if (!(++work & 31)) await pause();
        const q = cand[k], p = start(q[1], q[2]), v = vel(p);
        if (gap(sel, p, v, T, type, size, most) >= most) { const g = gap(sel, p, v, T, type, size); if (g > most) { at = q; most = g; } }
      }
      await pause();
      if (!at) { moved.push({ type, was, now: was, from: p0, to: p0 }); continue; }
      let a = at[1], c = at[2];
      // (a start of the grown box stays at the least width found: it is not brought back toward the drawn start)
      if (most >= C && !wide) {
        // and from the lattice's place back toward the drawn start, as far as the arc still clears (to 1/64 of the way)
        let lo = 0, hi = 1;
        for (let k = 0; k < 6; k++) { const mid = (lo + hi) / 2, p = start(a0 + (a - a0) * mid, c0 + (c - c0) * mid); if (gap(sel, p, vel(p), T, type, size, C) >= C) hi = mid; else lo = mid; }
        a = a0 + (a - a0) * hi; c = c0 + (c - c0) * hi;
      }
      const p = start(a, c), v = vel(p), iA = A.at.iA.array, iB = A.at.iB.array;
      iA[A.slot] = p[0]; iA[A.slot + 2] = p[2]; iB[A.slot] = v[0]; iB[A.slot + 2] = v[2];
      // its drops, as addFish laid them: six at the place it breaks the surface, eight along the arc at half its
      // velocity, and for a leaper five more at the surface (0.3 and 0.4 of the start's velocity) and five along
      // the arc (0.6); the eight where a leaper comes down and the drops at a bear's mouth are where they were
      const ts = (v0[1] - Math.sqrt(Math.max(v0[1] * v0[1] + 2 * G * p0[1], 0))) / G, st = type === 2 ? 5 - T : 0;
      const go = (k, te, kx, kz) => { const j = (A.d + k) * 4; dPa[j] = p[0] + v[0] * te; dPa[j + 2] = p[2] + v[2] * te; dVa[j] += (v[0] - v0[0]) * kx; dVa[j + 2] += (v[2] - v0[2]) * kz; };
      for (let k = 0; k < 6; k++) go(k, ts, 0, 0);
      for (let k = 6; k < 14; k++) go(k, dTa[(A.d + k) * 4 + 3] - st, 0.5, 0.5);
      if (type < 2) { for (let k = 14; k < 19; k++) go(k, ts, 0.3, 0.4); for (let k = 19; k < 24; k++) go(k, dTa[(A.d + k) * 4 + 3] - st, 0.6, 0.6); }
      moved.push({ type, was, now: most, from: p0, to: p });
      A.p0 = p; A.v0 = v;
    }
    return moved;
  };
  return hero;
}
