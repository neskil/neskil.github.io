// The Titan's Strait: hero set piece. Ichthyotitan, 25 m, swimming a metre or two under glass-clear
// water beside her own hard shadow on pale sand, with five hybodont sharks, the breath and (optional)
// a stage of sand and water so she can be judged alone.
//
// SPACE  Local y = 0 is the WATER SURFACE (seat hero.object at y 0 of the world's sea, rotation about Y
//        only, no scale). She heads toward +Z; her mid-body is over the origin; her left is +X (the
//        camera's side in the brief), her right and her shadow are toward -X. The sea floor is the
//        plane y = floorY (default -12, the channel).
// SIZE   animal 25 m: snout tip z +11, tail tip z -14, flipper tips x +-4.3; with her shadow a 19 m circle;
//        floor -12 to plume top +3.3. (The returned radius 13 / height 24 / center only frame the viewer's orbit.)
// OPTS   palette  brief palette (array of 7 hex strings)        detail   0.6..1, thins plume sprites only
//        stage    true: adds a 260 m sand disc and a water disc (set false in the world and build the real
//                 floor and water; see STYLE below for how to match)
//        floorY   -12        depth      -2.9 (spine depth)      sunDir  THREE.Vector3 toward the sun, WORLD space
//                 (default: 38 deg up, 130 deg left of her heading, as the brief; opts.sunElev 28 for the low sun)
//        sharks   5        momentShift  0: added to every u of the breath moment (the world drives tilt, lift and puff itself
//        after setProgress: blow at u 0.60, roll 0.60-0.73, puff standing to 0.72).
//        The puff leans forward and to her RIGHT (-X), away from a camera on her left: side-on one bushy cloud with a double crown,
//        from behind a V. The shadow is sand lit by the sky alone (SHADE_GLSL, uShadowK), nearly neutral on water under 8 m deep.
// HOOKS  setProgress(u)   the world's journey u: drives distance swum (bend phase, so she never slides), the
//                         tilt at 0.60, the lift of the snout base and the breath (0.58-0.66). Until it is
//                         called, update() runs a demo loop from the clock so the viewer shows every moment.
//        setSwim(metres), setTilt(0..1), setBreath(0..1) drive the same things separately if wanted.
//        setSun(dirWorld), setFloorY(y), headWorld(target) (where the water hump / foam belongs),
//        uniforms (shared object: uSun, uSunRefr, uFloorY, uTintK ... change values, never the set).
// ANCHORS (local) spine: mid-body; head, snoutTip, nostrils, eyeL, tailTip; shadowCentre (on the floor);
//        passLine: ordered points of the world's overtaking line (to her right above the strip between her and her
//        shadow, then across her back to her left), always more than 6 m clear of her; viewpoints.entry / .pass / .breath; portalSeat: none on the animal
//        (the ring belongs in the cleft): given as a point 150 m ahead-left at y 9 facing back, as a hint only.
// EXPORTS buildHybodont(rng) -> BufferGeometry (2 m shark, same attributes), SEA_GLSL (tint + caustic chunk), SAND_GLSL, SHADE_GLSL
//        so the world's own floor, placodonts and fish can sit in the same water.
// COST   about 40k triangles and 8 draw calls with the stage (34k and 6 without: her 9.6k mesh and the
//        sharks are each drawn twice, once as shadow); build ~60 ms in five yielded steps; no lights, no textures.
// LIGHT  Unlit by scene lights: every material is a ShaderMaterial lit by the uniforms uSun / uSunCol /
//        uSkyCol (hard afternoon sun behind-left, sky fill, sand bounce on the belly). Fog: scene fog.
// STYLE  Naturalistic. Nothing is drawn through the water plane: each underwater surface tints ITSELF by its
//        depth and the length of the sight line through water (seaTint in SEA_GLSL), so the water mesh is only
//        a faint sky fresnel. The shadow is her own mesh drawn again, flattened along the refracted sun
//        (36 deg from vertical) onto y = floorY + 0.05, opaque, shaded as sand without sun or caustics.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#B4492C', '#EFE3C8', '#7CCBB8', '#1F6F74', '#22262C', '#9CC3DA', '#E9A66B'];
const LEN = 25, NOSE_Z = 11;            // d = distance from the snout tip; rest z = NOSE_Z - d

// ---------------------------------------------------------------------------------------------- GLSL
const NOISE_GLSL = /* glsl */`
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h12(i), h12(i+vec2(1.,0.)), f.x), mix(h12(i+vec2(0.,1.)), h12(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= .5; } return s; }
`;
// Shared sea look: tint by depth and sight line, caustic net. Needs uniforms uTime, uTintA, uTintB, uTintFar, uTintK.
export const SEA_GLSL = /* glsl */`
uniform float uTime, uTintK;
uniform vec3 uTintA, uTintB, uTintFar, uAbsorb;
float gSeaAdd = .11;                                  // how much of the water's own colour is laid over a surface (her black back takes less)
// c: lit colour of a surface under water; depth: metres below the surface; wp: world position
vec3 seaTint(vec3 c, float depth, vec3 wp){
  depth = max(depth, 0.);
  vec3 v = cameraPosition - wp; float vl = max(length(v), 1e-3);
  float cosv = clamp(abs(v.y) / vl, .16, 1.);
  float under = cameraPosition.y > 0. ? depth / cosv : vl;          // sight line through water, metres
  under = min(under, 400.);
  // light goes down, then comes back up: each colour dies at its own rate (red within a few metres, green and blue slowly), so
  // the 1-3 m banks stay pale aqua over cream sand and the 12 m channel is a deep clear turquoise
  float pl = (depth * .55 + min(under, 60.) * .45) * (uTintK / .072);
  vec3 tr = exp(-pl * vec3(.26, .050, .034) * (vec3(1.) + (vec3(1.) - uAbsorb) * .6));
  float k = 1. - tr.g;
  vec3 tint = mix(uTintA, uTintB, smoothstep(1.5, 11., depth));
  float far = smoothstep(60., 300., under);
  vec3 body = c * tr + tint * (gSeaAdd * 2.6 * k);
  return mix(body, uTintFar * 1.1, far * .85);
}
// a moving net of bright lines, 0..1 (two scrolling layers of folded noise)
float caustic(vec2 p, float t){
  vec2 q = p * .42 + vec2(t * .11, -t * .07);
  float a = abs(vn(q + vn(q * 1.7 + 3.) * .9) - .5);
  vec2 r = p * .63 + vec2(-t * .09, t * .12) + 11.;
  float b = abs(vn(r + vn(r * 1.5 - 5.) * .9) - .5);
  float n = (1. - smoothstep(0., .09, a)) * .7 + (1. - smoothstep(0., .07, b)) * .6;
  return clamp(n, 0., 1.);
}
`;
// Her motion, shared by the body and its shadow so the two can never disagree.
// aData = (ring 0 back .. 1 belly, spine z used for the bend, limb id 0 body 1-4 flippers, paint mask); aRoot = limb root
const DEFORM_GLSL = /* glsl */`
uniform float uPhase, uAmp, uTilt, uLift, uRise, uDepth, uTrim;
float bendAt(float s){
  float a = smoothstep(.30, 1., s); a = a * sqrt(a) * uAmp;
  float head = (1. - smoothstep(0., .34, s)) * uAmp * -.10;
  return (a + head) * sin(uPhase - s * 5.2);
}
vec3 titanDeform(vec3 p, vec4 d, vec3 root, inout vec3 n){
  // flippers trim: a slow feathering about the root, the near front one raised with the tilt
  if (d.z > .5) {
    float side = sign(root.x), fore = step(d.z, 2.5);
    float ang = sin(uTrim + d.z * 1.7) * .07 + uTilt * (side > 0. ? mix(.10, .20, fore) : -.12);
    float c = cos(ang * side), s = sin(ang * side);
    vec3 q = p - root; q.xy = vec2(c * q.x - s * q.y, s * q.x + c * q.y); p = root + q;
    n.xy = vec2(c * n.x - s * n.y, s * n.x + c * n.y);
  }
  float sz = d.y, s = clamp((${NOSE_Z.toFixed(1)} - sz) / ${LEN.toFixed(1)}, 0., 1.);
  // the head and shoulders lift for the breath
  float lf = 1. - smoothstep(.06, .34, s);
  p.y += uLift * lf;
  // sideways wave growing toward the tail; sections turn with the slope so nothing shears
  float x0 = bendAt(s), e = .012;
  float slope = (bendAt(s + e) - bendAt(s - e)) / (2. * e) / -${LEN.toFixed(1)};
  float inv = inversesqrt(1. + slope * slope), ca = inv, sa = slope * inv;
  vec3 q = p - vec3(0., 0., sz);
  p = vec3(x0 + ca * q.x + sa * q.z, q.y, sz - sa * q.x + ca * q.z);
  n = vec3(ca * n.x + sa * n.z, n.y, -sa * n.x + ca * n.z);
  // roll about her long axis: +X (the camera's side) rises
  float ct = cos(uTilt * .56), st = sin(uTilt * .56);
  p.xy = vec2(ct * p.x - st * p.y, st * p.x + ct * p.y);
  n.xy = vec2(ct * n.x - st * n.y, st * n.x + ct * n.y);
  p.y += uDepth + uRise;
  // never through the surface: everything above -0.9 m is pressed under an asymptote at -0.6 m
  float over = p.y + .9;
  if (over > 0.) p.y = -.9 + .3 * (1. - exp(-over / .3));
  return p;
}
`;

// ------------------------------------------------------------------------------------------ geometry
// Small indexed builder: position, aData (ring, spineZ, limb, paint), aRoot, aCol.
function makeBuilder() {
  const pos = [], data = [], root = [], col = [], idx = [];
  const B = {
    count: 0,
    v(x, y, z, ring, sz, limb = 0, paint = 0, r = null, c = null) {
      pos.push(x, y, z); data.push(ring, sz, limb, paint);
      if (r) root.push(r[0], r[1], r[2]); else root.push(0, 0, sz);
      if (c) col.push(c.r, c.g, c.b); else col.push(0, 0, 0);
      return B.count++;
    },
    tri(a, b, c) { idx.push(a, b, c); },
    // rings: array of arrays of vertex ids, all the same length, each closed
    skin(rings, flip = true) {
      for (let i = 0; i < rings.length - 1; i++) {
        const A = rings[i], C = rings[i + 1], n = A.length;
        for (let j = 0; j < n; j++) {
          const j1 = (j + 1) % n;
          if (flip) { idx.push(A[j], A[j1], C[j], A[j1], C[j1], C[j]); } else { idx.push(A[j], C[j], A[j1], A[j1], C[j], C[j1]); }
        }
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aData', new THREE.Float32BufferAttribute(data, 4));
      g.setAttribute('aRoot', new THREE.Float32BufferAttribute(root, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    },
  };
  return B;
}
// smooth sampler through rows [d, a, b, ...] (Hermite with finite-difference tangents)
function sampler(rows) {
  const n = rows.length, m = rows[0].length - 1;
  const tan = rows.map((r, i) => { const p = rows[Math.max(0, i - 1)], q = rows[Math.min(n - 1, i + 1)]; const o = []; for (let k = 1; k <= m; k++) o.push((q[k] - p[k]) / Math.max(1e-6, q[0] - p[0])); return o; });
  return (d, out = []) => {
    let i = 0; while (i < n - 2 && d > rows[i + 1][0]) i++;
    const a = rows[i], b = rows[i + 1], h = b[0] - a[0], t = clamp((d - a[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    for (let k = 0; k < m; k++) out[k] = h00 * a[k + 1] + h10 * h * tan[i][k] + h01 * b[k + 1] + h11 * h * tan[i + 1][k];
    return out;
  };
}
// Ichthyotitan in profile, as distances from the snout tip (m): [d, halfWidth, dorsal, ventral].
// Skull 3.6 m, more than half of it a straight scissor snout 0.5 m wide at its base; no neck; widest
// (3 m by 3 m) a third of the way back; a long even taper to a tail stock taller than it is wide.
const BODY = [
  [0.00, 0.045, 0.05, 0.05], [0.12, 0.085, 0.075, 0.08], [1.00, 0.165, 0.125, 0.14], [2.00, 0.25, 0.20, 0.215],
  [2.35, 0.37, 0.40, 0.30], [2.75, 0.52, 0.56, 0.42], [3.60, 0.84, 0.82, 0.74], [5.00, 1.20, 1.14, 1.16],
  [6.60, 1.42, 1.37, 1.45], [8.30, 1.50, 1.45, 1.55], [10.5, 1.43, 1.38, 1.48], [12.5, 1.26, 1.22, 1.31],
  [15.0, 0.98, 0.99, 1.05], [17.5, 0.66, 0.74, 0.77], [20.0, 0.38, 0.52, 0.52], [22.0, 0.21, 0.36, 0.36],
  [23.6, 0.12, 0.25, 0.25], [24.6, 0.07, 0.16, 0.16], [25.0, 0.02, 0.05, 0.05],
];
const bodyAt = sampler(BODY);
// the backbone runs level, then its last 5 m bends about 25 degrees down into the lower lobe of the tail
const axisY = (d) => { const x = d - 19.6; return x > 0 ? -0.47 * x * x / (x + 1.1) : 0; };
const TAIL_TOP = sampler([[19.0, 0.60], [20.0, 0.62], [20.6, 0.86], [21.0, 0.97], [21.35, 0.72], [21.75, 0.14], [22.3, -0.42], [23.0, -0.80], [24.0, -1.33], [24.8, -1.86], [25.3, -2.25]]);
const TAIL_BOT = sampler([[19.0, -0.58], [20.0, -0.62], [21.0, -1.01], [22.2, -1.62], [23.2, -2.08], [24.2, -2.45], [24.9, -2.50], [25.3, -2.31]]);

async function buildTitan(rng, ctx) {
  const B = makeBuilder(), tmp = [];
  // ---- body: 132 stations x 32, denser over the head and the tail
  const NS = 132, NR = 32, rings = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, d = LEN * (t + 0.035 * Math.sin(t * Math.PI * 2) * -1);
    const [w, top, bot] = bodyAt(clamp(d, 0, LEN), tmp), ay = axisY(d), z = NOSE_Z - d, ring = [];
    const head = 1 - smoothstep(2.0, 3.8, d), jaw = (1 - smoothstep(3.0, 3.7, d)) * smoothstep(0.1, 0.5, d);
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
      // section: fuller than an ellipse on the flank, a faint keel on the back of the trunk, flatter belly
      let x = w * Math.sign(sa) * Math.pow(Math.abs(sa), 0.86);
      let y = ca >= 0 ? top * Math.pow(ca, 0.92) : -bot * Math.pow(-ca, 0.88);
      // the mouth: a shallow groove along the jaw line, and the snout's flat scissor sides
      const groove = Math.exp(-Math.pow((ca + 0.18) / 0.11, 2)) * jaw;
      x *= 1 - 0.10 * groove; x *= 1 - 0.06 * head * (1 - Math.abs(ca));
      // brow over the eye and the cheek behind it
      const brow = Math.exp(-Math.pow((d - 2.7) / 0.35, 2)) * Math.exp(-Math.pow((ca - 0.62) / 0.22, 2));
      x *= 1 + 0.10 * brow; y += 0.03 * brow;
      ring.push(B.v(x, y + ay, z, (1 - ca) * 0.5, z, 0, 0));
    }
    rings.push(ring);
  }
  B.skin(rings);
  await ctx.yield();
  // ---- tail blade: a thin vertical sheet, low upper lobe, long lower lobe carrying the backbone
  {
    const rs = [], N = 30, R = 10;
    for (let i = 0; i <= N; i++) {
      const d = lerp(19.0, 25.3, i / N), top = TAIL_TOP(d, tmp)[0], bot = TAIL_BOT(d, tmp)[0], z = NOSE_Z - d;
      const th = 0.012 + 0.06 * Math.sin(Math.PI * Math.min(1, i / N * 1.02)) * (1 - 0.5 * i / N), ring = [];
      for (let j = 0; j < R; j++) {
        const a = (j / R) * Math.PI * 2, ca = Math.cos(a), f = ca * 0.5 + 0.5;
        // trailing edge raked back a little so the lobes read as fins, not as a paddle
        ring.push(B.v(th * Math.sin(a), lerp(bot, top, f), z - 0.10 * Math.abs(ca), 0.16, z, 0, 0));
      }
      rs.push(ring);
    }
    B.skin(rs);
  }
  // ---- low back fin at mid-body: 0.6 m high, 2.6 m along the base, swept back
  {
    const rs = [], N = 16, R = 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N, d = lerp(11.4, 14.0, t), base = bodyAt(d, tmp)[1] - 0.06, z = NOSE_Z - d;
      const h = 0.62 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.8) * (1 - 0.25 * t) + 0.02, th = 0.02 + 0.09 * Math.sin(Math.PI * t), ring = [];
      for (let j = 0; j < R; j++) {
        const a = (j / R) * Math.PI * 2, f = Math.cos(a) * 0.5 + 0.5;
        ring.push(B.v(th * Math.sin(a) * (1 - 0.8 * f), base + h * f, z - 0.55 * f * f, 0.02, z, 0, 0));
      }
      rs.push(ring);
    }
    B.skin(rs);
  }
  // ---- four flippers: long narrow blades held out sideways, swept back 40 degrees, leading edge thick
  const flipper = (limb, side, d, len) => {
    const [w, , bot] = bodyAt(d, tmp), root = [side * w * 0.80, -bot * 0.42, NOSE_Z - d];
    const sw = 40 * Math.PI / 180, dr = (limb < 3 ? 9 : 12) * Math.PI / 180;
    const u = new THREE.Vector3(side * Math.cos(sw) * Math.cos(dr), -Math.sin(dr), -Math.sin(sw) * Math.cos(dr));
    const c = new THREE.Vector3(side * Math.sin(sw), 0, Math.cos(sw));
    const n = new THREE.Vector3().crossVectors(c, u); if (n.y < 0) n.negate(); n.normalize();
    const N = 22, R = 12, rs = [], C0 = 0.235 * len, P = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const t = Math.pow(i / N, 0.9), tt = t * t;
      const chord = C0 * (0.62 + 0.38 * smoothstep(0, 0.2, t)) * (1 - 0.30 * t) * Math.sqrt(Math.max(0.0004, 1 - Math.pow(t, 6)));
      const th = 0.19 * (1 - 0.68 * t) * (0.35 + 0.65 * Math.sqrt(Math.max(0.0004, 1 - Math.pow(t, 8))));
      const ring = [];
      for (let j = 0; j < R; j++) {
        const a = (j / R) * Math.PI * 2, cc = Math.cos(a), sn = Math.sin(a);
        P.set(root[0], root[1], root[2]).addScaledVector(u, len * t).addScaledVector(c, cc * chord * 0.5 - 0.085 * len * tt - 0.1 * chord)
          .addScaledVector(n, sn * th * (0.72 + 0.42 * cc) - 0.05 * len * tt);
        ring.push(B.v(P.x, P.y, P.z, 0.5 - 0.40 * sn, root[2], limb, 0, root));
      }
      rs.push(ring);
    }
    B.skin(rs, side < 0);
  };
  flipper(1, 1, 5.0, 3.6); flipper(2, -1, 5.0, 3.6); flipper(3, 1, 15.0, 2.8); flipper(4, -1, 15.0, 2.8);
  // ---- painted details: eye with its bony ring at the base of the snout, nostrils just ahead of it
  const disc = (d, deg, radii, cols, stretch, bulge) => {
    for (const side of [1, -1]) {
      const [w, top, bot] = bodyAt(d, tmp), a = deg * Math.PI / 180, sa = Math.sin(a), ca = Math.cos(a);
      const px = side * w * Math.pow(sa, 0.86) * 1.05, py = ca >= 0 ? top * Math.pow(ca, 0.92) : -bot * Math.pow(-ca, 0.88), z = NOSE_Z - d;
      const o = new THREE.Vector3(side * sa / w, ca / (ca >= 0 ? top : bot), 0.3).normalize();
      const e1 = new THREE.Vector3(0, 0, 1).addScaledVector(o, -o.z).normalize(), e2 = new THREE.Vector3().crossVectors(o, e1);
      const S = 18, P = new THREE.Vector3(), mk = (r, k, lift, col) => {
        const an = (k / S) * Math.PI * 2;
        P.set(px, py, z).addScaledVector(o, lift).addScaledVector(e1, Math.cos(an) * r * stretch).addScaledVector(e2, Math.sin(an) * r);
        return B.v(P.x, P.y, P.z, 0, z, 0, 1, null, col);
      };
      const centre = mk(0, 0, bulge, cols[0]); let prev = null;
      for (let q = 0; q < radii.length; q++) {
        const ring = []; const lift = bulge * (1 - Math.pow(radii[q] / radii[radii.length - 1], 2)) + (q === radii.length - 1 ? -0.012 : 0.012);
        for (let k = 0; k < S; k++) ring.push(mk(radii[q], k, lift, cols[q + 1]));
        for (let k = 0; k < S; k++) {
          const k1 = (k + 1) % S;
          if (!prev) B.tri(centre, ring[k], ring[k1]); else { B.tri(prev[k], ring[k], ring[k1]); B.tri(prev[k], ring[k1], prev[k1]); }
        }
        prev = ring;
      }
    }
  };
  const C = (h, m = 1) => new THREE.Color(h).multiplyScalar(m);
  disc(2.66, 64, [0.07, 0.10, 0.15, 0.185], [C('#040608'), C('#07090c'), C('#3a2f1c'), C('#a39c88'), C('#1b1e22')], 1.08, 0.045);
  disc(2.16, 34, [0.03, 0.055], [C('#030405'), C('#050608'), C('#2b2e33')], 1.9, -0.01);
  await ctx.yield();
  const geo = B.build();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -3, -1.5), 22);
  return geo;
}

// Hybodont shark, 2 m: blunt head, two low back fins each with a spine in front, broad side fins, a tail
// whose upper lobe is twice the lower. Snout at z +0.9, tail tip z -1.1. Same attributes as the titan
// (aData.y = rest z drives the tail wave). Exported for the world's own shoals of escorts.
const SHARK = sampler([[0, 0.03, 0.03, 0.03], [0.05, 0.10, 0.075, 0.07], [0.22, 0.165, 0.13, 0.12], [0.55, 0.19, 0.175, 0.16], [0.9, 0.17, 0.17, 0.15],
  [1.3, 0.11, 0.12, 0.105], [1.6, 0.06, 0.075, 0.065], [1.85, 0.03, 0.05, 0.04], [2.05, 0.008, 0.02, 0.02]]);
const SH_TOP = sampler([[1.55, 0.07], [1.72, 0.13], [1.88, 0.25], [2.04, 0.37], [2.09, 0.36]]);
const SH_BOT = sampler([[1.55, -0.065], [1.68, -0.17], [1.76, -0.14], [1.86, 0.02], [2.02, 0.27], [2.09, 0.33]]);
export function buildHybodont(rng) {
  const B = makeBuilder(), tmp = [], Z0 = 0.9, k = rng ? rng.range(0.94, 1.06) : 1;
  const rings = [], NS = 30, NR = 14;
  for (let i = 0; i <= NS; i++) {
    const d = 2.05 * Math.pow(i / NS, 1.15), [w, top, bot] = SHARK(d, tmp), ring = [];
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
      ring.push(B.v(w * k * Math.sign(sa) * Math.pow(Math.abs(sa), 0.9), ca >= 0 ? top * ca : bot * ca * 0.95 - 0.02 * (1 - ca * ca) * 0, Z0 - d, (1 - ca) * 0.5, Z0 - d));
    }
    rings.push(ring);
  }
  B.skin(rings);
  // a thin vertical or flat sheet between two edge curves
  const sheet = (n, fn, ringVal, flip) => {
    const rs = [];
    for (let i = 0; i <= n; i++) {
      const ring = [], q = fn(i / n);   // q = [ax,ay,az, bx,by,bz, thicknessDir(0 x | 1 y), th]
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2, f = Math.cos(a) * 0.5 + 0.5, s = Math.sin(a) * q[7];
        const x = lerp(q[0], q[3], f) + (q[6] === 0 ? s : 0), y = lerp(q[1], q[4], f) + (q[6] === 1 ? s : 0), z = lerp(q[2], q[5], f);
        ring.push(B.v(x, y, z, typeof ringVal === 'function' ? ringVal(Math.sin(a)) : ringVal, z));
      }
      rs.push(ring);
    }
    B.skin(rs, flip);
  };
  // tail
  sheet(14, (t) => { const d = lerp(1.55, 2.09, t); return [0, SH_BOT(d, tmp)[0], Z0 - d, 0, SH_TOP(d, tmp)[0], Z0 - d - 0.02, 0, 0.004 + 0.014 * Math.sin(Math.PI * t)]; }, 0.3, true);
  // two back fins, low triangles, each with a pale spine standing along its front edge
  const pale = new THREE.Color('#d8d2c2');
  for (const [d0, h, len] of [[0.62, 0.17, 0.30], [1.22, 0.14, 0.25]]) {
    sheet(8, (t) => { const d = d0 + len * t, base = SHARK(d, tmp)[1] - 0.02, hh = h * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.9) * (1 - 0.35 * t);
      return [0, base, Z0 - d, 0, base + hh + 0.004, Z0 - d - 0.10 * hh / h, 0, 0.003 + 0.012 * Math.sin(Math.PI * t)]; }, 0.05, true);
    const base = SHARK(d0, tmp)[1] - 0.03, s0 = [0, base, Z0 - d0 + 0.015], s1 = [0, base + h * 1.12, Z0 - d0 - 0.075];
    const ids = [];
    for (let e = 0; e < 2; e++) for (let j = 0; j < 4; j++) {
      const a = j / 4 * Math.PI * 2, r = e ? 0.003 : 0.014, p = e ? s1 : s0;
      ids.push(B.v(p[0] + Math.cos(a) * r, p[1], p[2] + Math.sin(a) * r, 0, Z0 - d0, 0, 1, null, pale));
    }
    for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; B.tri(ids[j], ids[4 + j], ids[j1]); B.tri(ids[j1], ids[4 + j], ids[4 + j1]); }
  }
  // broad side fins and small hip fins, flat, angled down and back
  for (const side of [1, -1]) for (const [d0, span, chord, droop] of [[0.42, 0.36, 0.26, 0.10], [1.12, 0.17, 0.13, 0.06]]) {
    const w = SHARK(d0, tmp)[0] * 0.8, bot = SHARK(d0, tmp)[2];
    sheet(8, (t) => { const cs = chord * (1 - 0.72 * t), x = side * (w + span * t), y = -bot * 0.55 - droop * t, zc = Z0 - d0 - 0.20 * span * t - 0.3 * chord * t;
      return [x, y, zc - cs, x, y + 0.004, zc, 1, 0.003 + 0.012 * (1 - t)]; }, (s) => 0.5 - 0.4 * s, side > 0);
  }
  const g = B.build(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -0.1), 1.3);
  return g;
}

// ------------------------------------------------------------------------------------------ shading
// Pale shell sand in ripples 0.4 m apart, olive algal turf in patches, shell-gravel streaks. Exported so the
// world's own sea floor can be the same sand the shadow is painted on.
export const SAND_GLSL = /* glsl */`
uniform vec3 uSand, uTurf;
vec3 sandCol(vec2 p, float dist, out float rip){
  // ripples 0.4 m apart, sharp-crested; they fade only where a pixel can no longer hold them
  float warp = fbm(p * .09) * 14. + vn(p * .5) * 1.7;
  float phs = (p.x * .82 + p.y * .57) * 15.7 + warp;
  float fade = (1. - smoothstep(.45, 1.4, fwidth(phs))) * (.45 + .55 * vn(p * .21 + 5.));
  float r1 = sin(phs) + .35 * sin(2. * phs + 1.2);
  // their big sisters, sand waves 1.7 m apart that fork and die out: these hold to a hundred metres, down on the channel floor too
  float ph2 = (p.x * .86 + p.y * .51) * 3.7 + fbm(p * .06 + 3.) * 9. + vn(p * .33) * 1.3;
  float fade2 = (1. - smoothstep(.45, 1.4, fwidth(ph2))) * (.35 + .65 * vn(p * .11 + 9.));
  float r2 = sin(ph2) + .4 * sin(2. * ph2 + 1.1);
  float bars = sin((p.x * .6 - p.y * .8) * .55 + fbm(p * .03 + 7.) * 6.);
  rip = r1 * fade * .55 + r2 * fade2 * .85;
  vec3 c = uSand * (.86 + .05 * bars + .08 * (fbm(p * .35 + 3.) - .5)) * (1. + .05 * rip);
  // shell gravel: pale streaks drawn out along the tide, flecked with whole shells
  float gr = smoothstep(.56, .66, fbm(vec2(p.x * .05 + p.y * .03, p.y * .22 - p.x * .12) + 21.) + (vn(p * 2.7) - .5) * .07);
  float fleck = smoothstep(.62, .8, vn(p * 6.5)) * (1. - smoothstep(25., 70., dist));
  c = mix(c, uSand * vec3(1.13, 1.12, 1.10) * (.9 + .16 * fleck), gr * .75);
  c *= 1. - .30 * gr * (1. - smoothstep(.25, .45, vn(p * 11.))) * (1. - smoothstep(20., 60., dist));
  // algal turf: dark olive patches 2-6 m across, their edges ragged and defined, tufted inside
  float tf = fbm(p * .30 + 40.) + (vn(p * 1.3) - .5) * .17 + (vn(p * 4.7) - .5) * .10 + (vn(p * 13.) - .5) * .05;
  float mead = smoothstep(.40, .66, fbm(p * .037 + 12.));               // turf gathers in a few meadows; between them open sand
  tf -= (1. - mead) * .10;
  float turf = smoothstep(.668, .700, tf);
  float rim = smoothstep(.64, .668, tf) * (1. - turf);                   // a thin fringe of single tufts round each patch
  vec3 tc = uTurf * (.85 + .75 * vn(p * 3.1)) * (.75 + .6 * vn(p * 15.)) + uSand * .10;      // polish2: olive and tufted; from the air it was ink blots
  tc = mix(tc, uTurf * vec3(1.9, 1.5, 1.0), smoothstep(.55, .8, vn(p * 2.3 + 7.)) * .5);      // rusty and olive, never one ink
  c = mix(c, tc, turf * .66 + rim * .40 * step(.5, vn(p * 9.)));
  return c;
}
`;
const SKIN_VERT_TAIL = /* glsl */`
  vRest = position; vData = aData; vCol = aCol;
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * n;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;
const SKIN_FRAG = /* glsl */`
uniform vec3 uSunRefr, uSunCol, uSkyCol, uBounce, uBack, uBelly, uScarCol;
uniform float uSeed, uTitan, uEdge, uSaddle;
uniform vec4 uScar[6];
varying vec3 vRest, vN, vW, vCol; varying vec4 vData;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
  float ring = vData.x, zr = vRest.z, d = ${NOSE_Z.toFixed(1)} - zr;
  float near = 1. - smoothstep(14., 48., dist);
  // counter-shading: slate above, pale below, meeting in a ragged, mottled line on the flank
  float k = mix(6., 1., uTitan);                       // pattern scale: sharks are small
  float edge = uEdge + (fbm(vec2(zr * .45 * k + uSeed, ring * 2.5)) - .5) * .11;
  float rag = (vn(vec2(zr * 2.1 * k + uSeed * 3., ring * 10.)) - .5) * .16 + (vn(vec2(zr * 6.5 * k, ring * 26.) + uSeed) - .5) * .09;
  float m = ring - edge + rag * exp(-abs(ring - edge) * 5.);
  float bel = smoothstep(-.012, .012, m);
  vec3 back = uBack * mix(1., 1.7, uTitan) * (.70 + .7 * fbm(vec2(zr * .7 * k, ring * 2.4) + uSeed));      // slate, never a black cut-out
  // a faint paler saddle behind the head, fine speckle close to
  float sad = smoothstep(3.5, 4.4, d) * (1. - smoothstep(5.4, 7.4, d)) * (1. - smoothstep(.10, .40, ring)) * uTitan;
  back = mix(back, back * 2.2 + vec3(.016, .017, .018), sad * uSaddle * (.55 + .45 * vn(vec2(zr * 1.3, ring * 8.))));
  back *= 1. + (vn(vec2(zr, ring * 3.) * 26. * k) - .5) * .5 * near;
  vec3 belly = uBelly * (.86 + .2 * fbm(vec2(zr * 1.1 * k, ring * 6.) + 9.));
  belly = mix(belly, uBack * 1.6, smoothstep(.62, .8, vn(vec2(zr * 2.3 * k + uSeed, ring * 11.))) * (1. - smoothstep(.0, .22, m)) * .7);
  vec3 alb = mix(back, belly, bel);
  // old scars: pale scratches, a few long ones along the flank and back
  float sc = 0.;
  for (int i = 0; i < 6; i++) {
    vec4 q = uScar[i];
    float u = (q.x - zr) / max(q.z, .05), v = (ring - q.y) * 3. - q.w * (u - .5) - .012 * sin(u * 7. + float(i));
    float tw = .004 + .010 * sin(u * 3.1416) ;
    float two = min(abs(v), abs(v - .05 - .02 * u));                 // raked in pairs
    sc = max(sc, (1. - smoothstep(tw, tw + .012, two)) * step(0., u) * step(u, 1.) * smoothstep(.2, .5, vn(vec2(u * 9. + float(i) * 5., v * 30.))));
  }
  alb = mix(alb, uScarCol, sc * .36 * uTitan * step(vData.z, .5));
  // the mouth: a dark line along the scissor jaws
  float mouth = (1. - smoothstep(.007, .026, abs(ring - .592))) * (1. - smoothstep(3.05, 3.5, d)) * smoothstep(.04, .3, d) * uTitan * step(vData.z, .5);
  alb = mix(alb, vec3(.004, .005, .006), mouth * .9);
  alb = mix(alb, vCol, vData.w);
  // light: hard sun refracted down through the surface with a caustic net on her back, sky fill, sand bounce on the belly
  float ndl = dot(N, uSunRefr), lit = smoothstep(-.05, .25, ndl) * max(ndl, 0.);
  float ca = caustic(vW.xz * 1.5 + vW.y * .7, uTime * 1.3) * smoothstep(.05, .55, N.y);   // the net of light the surface throws on her back
  float netK = mix(.45, 1.5, uTitan) * mix(1., .35, smoothstep(60., 160., dist));
  vec3 L = uSunCol * lit * (.78 + netK * ca) + uSkyCol * (.42 + .58 * N.y) * .62 + uBounce * (max(-N.y, 0.) * .55 + .08);
  vec3 col = alb * L;
  // wet skin: a broad soft sheen along the back so the round of her body reads
  vec3 H = normalize(uSunRefr + V + vec3(0., 1e-3, 0.));
  float nh = max(dot(N, H), 0.), sp = nh * nh; sp *= sp; sp *= sp; sp *= sp;
  float fr = 1. - max(dot(N, V), 0.); fr = fr * fr * fr;
  col += uSunCol * sp * .03 * smoothstep(0., .2, ndl) + uSkyCol * fr * .05 * mix(1., near, uTitan) + uSunCol * ca * .02 * smoothstep(0., .3, ndl);
  gSeaAdd = mix(.11, .12, uTitan);      // a veil of the water's own colour over her: she is IN the sea
  col = seaTint(col, -vW.y, vW);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// Light that reaches sand in shadow: sky alone. In the channel it is the cool half-light of the brief; on the 1-3 m banks, where
// little water lies over it, a nearly neutral 40 percent darker (no blue puddles). Exported for the world's own small shadows.
export const SHADE_GLSL = /* glsl */`
uniform vec3 uSkyCol, uSunCol, uShadowK; uniform float uShade;
vec3 shadeLight(float depth, float rip){
  vec3 deep = uSkyCol * uShadowK, bank = (uSunCol * .8 + uSkyCol) * vec3(.565, .61, .585);
  return mix(bank, deep, smoothstep(1.5, 8., depth)) * uShade * (1. + .2 * rip);
}
`;
const SHADOW_FRAG = /* glsl */`
varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
${SAND_GLSL}
${SHADE_GLSL}
void main(){
  float rip; float dist = length(cameraPosition - vW);
  vec3 a = sandCol(vW.xz, dist, rip);
  vec3 col = a * shadeLight(-vW.y, rip);       // the same sand, lit by the sky alone: ripples and turf run on through it, no caustics
  col = seaTint(col, -vW.y, vW);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// flatten along the refracted sun onto the floor (world space; object unscaled, y 0 on the water)
const SHADOW_VERT_TAIL = /* glsl */`
  vec4 wp = modelMatrix * vec4(p, 1.);
  float t = (wp.y - uFloorY) / max(uSunRefr.y, .2);
  wp.xyz -= uSunRefr * t; wp.y = uFloorY + .05;
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

// ------------------------------------------------------------------------------------------ the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const col = (h, m = 1) => new THREE.Color(h).multiplyScalar(m);
  const floorY = opts.floorY ?? -12, depth = opts.depth ?? -2.9;
  const group = new THREE.Group(); group.name = 'titan-strait-hero';

  // sun: 38 degrees up, 130 degrees to the left of her heading (behind the camera's left shoulder)
  const elev = (opts.sunElev ?? 38) * Math.PI / 180, az = 130 * Math.PI / 180;
  const sunDir = opts.sunDir ? opts.sunDir.clone().normalize()
    : new THREE.Vector3(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev));
  const refr = new THREE.Vector3();
  const setSun = (d) => {
    sunDir.copy(d).normalize(); if (sunDir.y < 0.15) { sunDir.y = 0.15; sunDir.normalize(); }
    const hx = sunDir.x / 1.333, hz = sunDir.z / 1.333;         // Snell: the sun stands 36 deg from the vertical under water
    refr.set(hx, Math.sqrt(Math.max(0.05, 1 - hx * hx - hz * hz)), hz).normalize();
  };
  setSun(sunDir);

  // per-seed character: her tone, how high the pale belly climbs, her scars
  const seed = rng.range(0, 50), tone = rng.range(0.85, 1.2), edge = rng.range(0.545, 0.60);
  const scars = [];
  for (let i = 0; i < 6; i++) scars.push(new THREE.Vector4(rng.range(-9, 7.5), rng.range(0.06, 0.5), rng.range(0.6, 2.4), rng.range(-1.3, 1.3)));
  const U = {     // shared by every material of the piece: change values, never the set
    uTime: { value: 0 }, uTintK: { value: 0.072 }, uAbsorb: { value: new THREE.Color(0.07, 0.85, 0.96) },
    uTintA: { value: col(pal[2]) }, uTintB: { value: col('#55B5A8') }, uTintFar: { value: col(pal[3]) },
    uSunRefr: { value: refr }, uSun: { value: sunDir }, uFloorY: { value: floorY },
    uSunCol: { value: new THREE.Color(0.80, 0.69, 0.55) }, uSkyCol: { value: new THREE.Color(0.44, 0.54, 0.66) },
    uBounce: { value: new THREE.Color(0.50, 0.52, 0.42) },
    uSand: { value: col(pal[1], 0.72) }, uTurf: { value: col('#434A2A') }, uShade: { value: 1.0 }, uShadowK: { value: new THREE.Color(0.72, 0.84, 0.82) },
    uPhase: { value: 0 }, uAmp: { value: 2.5 }, uTilt: { value: 0 }, uLift: { value: 0 }, uRise: { value: 0 },
    uDepth: { value: depth }, uTrim: { value: 0 },
    uBreath: { value: 0 }, uDrift: { value: 0 }, uHead: { value: new THREE.Vector3(0, 0, 8.6) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const VARY = 'varying vec3 vRest, vN, vW, vCol; varying vec4 vData;';
  const ATTR = 'attribute vec4 aData; attribute vec3 aRoot, aCol;';

  // ---- her
  const titanGeo = await buildTitan(rng, ctx);
  await ctx.yield();
  const saddle = rng.range(0.45, 1.0);
  const skinU = (extra) => ({ ...fogU(), ...U, uSeed: { value: seed }, uSaddle: { value: saddle }, uScar: { value: scars }, uScarCol: { value: col('#8E9290') }, ...extra });
  const titanMat = new THREE.ShaderMaterial({
    fog: true, uniforms: skinU({ uBack: { value: col(pal[4], tone) }, uBelly: { value: col('#D9D2C0', 0.8) }, uTitan: { value: 1 }, uEdge: { value: edge } }),
    vertexShader: `${ATTR}\n${VARY}\n#include <fog_pars_vertex>\n${DEFORM_GLSL}\nvoid main(){ vec3 n = normal; vec3 p = titanDeform(position, aData, aRoot, n);\n${SKIN_VERT_TAIL}}`,
    fragmentShader: SKIN_FRAG,
  });
  const titan = new THREE.Mesh(titanGeo, titanMat); titan.frustumCulled = false; titan.renderOrder = 2; group.add(titan);
  const shadowU = () => ({ ...fogU(), ...U });
  const titanShadowMat = new THREE.ShaderMaterial({
    fog: true, uniforms: shadowU(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: `${ATTR}\nuniform vec3 uSunRefr; uniform float uFloorY; varying vec3 vW;\n#include <fog_pars_vertex>\n${DEFORM_GLSL}\nvoid main(){ vec3 n = normal; vec3 p = titanDeform(position, aData, aRoot, n);\n${SHADOW_VERT_TAIL}}`,
    fragmentShader: SHADOW_FRAG,
  });
  const titanShadow = new THREE.Mesh(titanGeo, titanShadowMat); titanShadow.frustumCulled = false; titanShadow.renderOrder = 1; group.add(titanShadow);

  // ---- the escort: five hybodonts weaving 2-4 m down along her right flank, in and out of her shadow
  const nShark = opts.sharks ?? 5;
  const sharkBase = buildHybodont(rng), sharkGeo = new THREE.InstancedBufferGeometry();
  sharkGeo.index = sharkBase.index; for (const k of Object.keys(sharkBase.attributes)) sharkGeo.setAttribute(k, sharkBase.attributes[k]);
  const iA = new Float32Array(nShark * 4), iB = new Float32Array(nShark * 4);
  for (let i = 0; i < nShark; i++) {
    const f = (i + rng.range(0.2, 0.8)) / nShark;
    iA.set([-rng.range(2.9, 5.4), -rng.range(2.4, 4.2), lerp(7.5, -6.5, f) + rng.range(-1, 1), rng()], i * 4);
    iB.set([rng.range(0.5, 1.1), rng.range(0.25, 0.6), rng.range(1.2, 2.6), rng.range(0.88, 1.12)], i * 4);
  }
  sharkGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); sharkGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  sharkGeo.instanceCount = nShark;
  const SHARK_DEFORM = /* glsl */`
attribute vec4 iA, iB; uniform float uTime;
vec3 sharkDeform(vec3 p, inout vec3 n){
  float s = clamp((.9 - aData.y) / 2.05, 0., 1.), ph = iA.w * 6.2832, t = uTime;
  p.x += sin(t * 6.2832 + ph - s * 4.6) * (.015 + .17 * s * s);          // one tail-wave a second
  p *= iB.w;
  float wx = sin(t * .23 + ph) * iB.x + sin(t * .41 + ph * 2.3) * iB.x * .4;
  float dwx = cos(t * .23 + ph) * iB.x * .23 + cos(t * .41 + ph * 2.3) * iB.x * .164;
  float wz = sin(t * .15 + ph * 1.7) * iB.z, wy = sin(t * .19 + ph * 3.1) * iB.y;
  float yaw = dwx * .9, inv = inversesqrt(1. + yaw * yaw), c = inv, sn = yaw * inv;   // nose follows the weave
  p.xz = vec2(c * p.x + sn * p.z, -sn * p.x + c * p.z); n.xz = vec2(c * n.x + sn * n.z, -sn * n.x + c * n.z);
  return p + vec3(iA.x + wx, iA.y + wy, iA.z + wz);
}`;
  const sharkMat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: skinU({ uBack: { value: col('#6B6456', 0.8) }, uBelly: { value: col('#CFC6B2', 0.9) }, uTitan: { value: 0 }, uEdge: { value: 0.56 } }),
    vertexShader: `${ATTR}\n${VARY}\n#include <fog_pars_vertex>\n${SHARK_DEFORM}\nvoid main(){ vec3 n = normal; vec3 p = sharkDeform(position, n);\n${SKIN_VERT_TAIL}}`,
    fragmentShader: SKIN_FRAG,
  });
  const sharks = new THREE.Mesh(sharkGeo, sharkMat); sharks.frustumCulled = false; sharks.renderOrder = 2; group.add(sharks);
  const sharkShadowMat = new THREE.ShaderMaterial({
    fog: true, uniforms: shadowU(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: `${ATTR}\nuniform vec3 uSunRefr; uniform float uFloorY; varying vec3 vW;\n#include <fog_pars_vertex>\n${SHARK_DEFORM}\nvoid main(){ vec3 n = normal; vec3 p = sharkDeform(position, n);\n${SHADOW_VERT_TAIL}}`,
    fragmentShader: SHADOW_FRAG,
  });
  const sharkShadows = new THREE.Mesh(sharkGeo, sharkShadowMat); sharkShadows.frustumCulled = false; sharkShadows.renderOrder = 1; group.add(sharkShadows);
  await ctx.yield();

  // ---- the stage (optional): sand floor and the water's skin, so the piece can be judged alone
  const stage = opts.stage !== false, R_STAGE = 260;
  if (stage) {
    const sandGeo = new THREE.CircleGeometry(R_STAGE, 72); sandGeo.rotateX(-Math.PI / 2); sandGeo.translate(0, floorY, 0);
    const sandMat = new THREE.ShaderMaterial({
      fog: true, uniforms: shadowU(),
      vertexShader: `varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
      fragmentShader: /* glsl */`
uniform vec3 uSkyCol, uSunCol, uSunRefr; uniform float uShade;
varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SEA_GLSL}
${SAND_GLSL}
void main(){
  float rip; float dist = length(cameraPosition - vW);
  vec3 a = sandCol(vW.xz, dist, rip);
  float ca = caustic(vW.xz, uTime);
  vec3 L = uSunCol * uSunRefr.y * (1. + .12 * rip) * (.94 + .34 * ca) + uSkyCol * uShade;
  vec3 col = seaTint(a * L, -vW.y, vW);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
    });
    const sand = new THREE.Mesh(sandGeo, sandMat); sand.renderOrder = 0; group.add(sand);
    // water: a polar grid, fine near her, carrying the small swell and the smooth hump that travels over her head
    const NRg = 40, NSg = 72, wp = [], wi = [];
    for (let i = 0; i <= NRg; i++) for (let j = 0; j < NSg; j++) { const r = R_STAGE * Math.pow(i / NRg, 2.3), a = j / NSg * Math.PI * 2; wp.push(Math.sin(a) * r, 0, Math.cos(a) * r + 8 * (1 - i / NRg)); }
    for (let i = 0; i < NRg; i++) for (let j = 0; j < NSg; j++) { const a = i * NSg + j, b = i * NSg + (j + 1) % NSg, c = a + NSg, d = b + NSg; wi.push(a, c, b, b, c, d); }
    const waterGeo = new THREE.BufferGeometry(); waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); waterGeo.setIndex(wi);
    waterGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R_STAGE + 10);
    const WAVE = /* glsl */`
uniform float uTime, uLift; uniform vec3 uHead;
float swell(vec2 p){ float t = uTime;
  float h = sin(p.x * .21 + p.y * .13 + t * .55) * .06 + sin(p.x * -.11 + p.y * .29 + t * .43 + 1.7) * .05 + sin(p.x * .53 - p.y * .47 + t * .9) * .015;
  vec2 q = p - uHead.xz; h += (.10 + .16 * uLift) * exp(-dot(q, q) / 9.);
  return h; }`;
    const waterMat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false,
      uniforms: { ...fogU(), ...U, uZen: { value: col('#5E93C4') }, uPale: { value: col(pal[5]) }, uHor: { value: col('#EAD9BC') } },
      vertexShader: `varying vec3 vW; varying vec2 vL;\n#include <fog_pars_vertex>\n${WAVE}\nvoid main(){ vec3 p = position; vL = p.xz; p.y += swell(p.xz); vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
      fragmentShader: /* glsl */`
uniform vec3 uZen, uPale, uHor;
varying vec3 vW; varying vec2 vL;
#include <fog_pars_fragment>
${WAVE}
void main(){
  float e = .35;
  float hx = swell(vL + vec2(e, 0.)) - swell(vL - vec2(e, 0.)), hz = swell(vL + vec2(0., e)) - swell(vL - vec2(0., e));
  vec3 N = normalize(vec3(-hx / (2. * e), 1., -hz / (2. * e)));      // (local frame; the piece only ever turns about Y)
  vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
  float nv = clamp(dot(N, V), 0., 1.), f = 1. - nv, f5 = f * f; f5 = f5 * f5 * f;
  float F = .02 + .98 * f5;
  vec3 Rr = reflect(-V, N); float up = clamp(Rr.y, 0., 1.);
  vec3 sky = mix(mix(uHor, uPale, smoothstep(0., .16, up)), uZen, smoothstep(.12, .85, up));
  // sun behind us: no glare path; the skin shows only as pale sky far off and as a breath of sheen near
  float a = clamp(F * 1.05 + .012, 0., .96);
  // the smooth hump that travels over her head shows as a lens of pale sky; slow slicks give the glass a skin
  vec2 q = vL - uHead.xz; float hump = exp(-dot(q, q) / 7.);
  float slick = sin(vL.x * .29 + vL.y * .17 + uTime * .11) * sin(vL.y * .23 - vL.x * .09 - uTime * .08);
  slick = slick * slick * (.5 + .5 * sin(vL.x * .05 - vL.y * .07 + uTime * .03));
  a = clamp(a + hump * (.05 + .16 * uLift / 1.55) + .05 * slick, 0., .96);
  gl_FragColor = vec4(sky * .92, a);
  #include <fog_fragment>
}`,
    });
    const water = new THREE.Mesh(waterGeo, waterMat); water.renderOrder = 6; group.add(water);
  }
  await ctx.yield();

  // ---- the breath: a low, bushy, forward-leaning double puff from the two nostrils ahead of her eyes.
  // Everything is a function of uBreath (0..1 over the breath window), so it runs with the journey.
  const NOSTRIL = new THREE.Vector3(0, -0.15, NOSE_Z - 2.16), T_BREATH = 5.0, B_BLOW = 0.12;
  // Three kinds of sprite: the bushy body of each lobe, small fast wisps that fray its edge and top, and fine spray that
  // falls off its trailing edge. Late-born sprites are slower, so the foot of the puff stays low while the top leans forward.
  const nPuff = Math.round(560 * detail), pg = new THREE.InstancedBufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
  const pA = new Float32Array(nPuff * 4), pV = new Float32Array(nPuff * 4);
  // (the plume has its own generator; the loop below only draws what the first plume drew from the world's, so that everything
  // the world builds after the hero stays where it was for a given seed)
  for (let i = 0, n0 = Math.round(160 * detail); i < n0; i++) { rng(); rng(); rng.range(0, 1); rng(); rng.gauss(); rng.gauss(); rng.gauss(); }
  for (let i = 0, rng = makeRng(hashSeed('plume:' + Math.floor(seed * 1e6))); i < nPuff; i++) {
    const side = i % 5 < 3 ? 1 : -1, core = rng(), kind = (i % 20) < 6 ? 0 : (i % 20) < 11 ? 1 : 2, delay = Math.pow(rng(), 1.5) * (kind === 2 ? 0.24 : 0.17);      // polish1: mostly fine spray; the billows are thin mist
    const size = (kind === 0 ? rng.range(0.55, 1.35) : kind === 1 ? rng.range(0.22, 0.55) : rng.range(0.03, 0.075)) * (side > 0 || kind === 2 ? 1 : 0.88);
    const spread = kind === 0 ? 0.20 : kind === 1 ? 0.34 : 0.38, slow = 1 - 0.45 * delay / 0.17;
    const speed = (kind === 0 ? lerp(1.6, 9.6, Math.pow(core, 0.8)) : kind === 1 ? lerp(5.5, 12.5, core) : lerp(5, 15, core)) * Math.max(0.4, slow) * (side > 0 ? 1.08 : 0.94);
    pA.set([side, delay, size, rng()], i * 4);                                                  // jet, birth delay, size, seed
    pV.set([(side > 0 ? -0.05 : -1.05) + rng.gauss() * spread, (side > 0 ? 0.80 : 0.98) + rng.gauss() * spread * 0.5, (side > 0 ? 1.12 : 0.62) + rng.gauss() * spread, speed], i * 4);   // direction, speed
  }
  pg.setAttribute('pA', new THREE.InstancedBufferAttribute(pA, 4)); pg.setAttribute('pV', new THREE.InstancedBufferAttribute(pV, 4));
  pg.instanceCount = nPuff;
  const plumeMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogU(), uBreath: U.uBreath, uSun: U.uSun, uNostril: { value: NOSTRIL }, uLit: { value: new THREE.Color(0.97, 0.94, 0.87) }, uShadeC: { value: new THREE.Color(0.40, 0.50, 0.64) } },
    vertexShader: /* glsl */`
attribute vec4 pA, pV; uniform float uBreath; uniform vec3 uNostril, uSun;
varying vec2 vUv; varying vec4 vK; varying vec4 vSun;
#include <fog_pars_vertex>
void main(){
  float age = (uBreath - ${B_BLOW} - pA.y) * ${T_BREATH.toFixed(1)};
  float live = step(0., age) * step(uBreath, .999);
  float spray = step(pA.z, .11);
  vec3 dir = normalize(pV.xyz + vec3(0., 1e-3, 0.));
  float reach = pV.w * (1. - exp(-age * 2.4)) / 2.4;
  vec3 c = uNostril + vec3(pA.x * .20 - .15, 0., .1) + dir * reach;
  c.y += .25 - mix(.10, 1.5, spray) * age * age * (.5 + pA.w);    // the cloud sinks slowly; the spray falls out of it as fine rain
  c.x -= age * (.55 + .4 * pA.w) + sin(age * 2. + pA.w * 40.) * .12;   // it leans and drifts off to her right, clear of her head and of our line
  c.z -= (age - (1. - exp(-age * 1.4)) / 1.4) * 1.3 * (1. - .12 * pA.w) * (1. + .8 * spray);   // blown at her speed, it stops in the air while she swims on
  c.y = max(c.y, .05);
  float size = pA.z * (.30 + .95 * (1. - exp(-age * 1.3))) * live;
  float al = smoothstep(0., .10, age) * (1. - smoothstep(mix(1.1, .7, spray), mix(3.4, 2.0, spray), age));
  vUv = position.xy; vK = vec4(al * live, pA.w, age, spray);
  vSun = vec4(normalize((viewMatrix * vec4(uSun, 0.)).xyz + vec3(0., 1e-4, 0.)), mix(.5, 1., smoothstep(.3, 2.3, c.y)) * mix(.82, 1., pA.w));   // w: the foot of the cloud lies in its own shade
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.);
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uLit, uShadeC;
varying vec2 vUv; varying vec4 vK; varying vec4 vSun;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.) discard;
  // a ragged, cauliflower edge: the disc is eaten back by three sizes of noise, more as it ages and thins
  float n = vn(vUv * 2.3 + vK.y * 57.) * .5 + vn(vUv * 5.6 - vK.y * 31.) * .3 + vn(vUv * 12. + vK.y * 11.) * .2;
  float dens = (1. - r2) * (1. - r2) - n * (.50 + .14 * vK.z) + .08;      // thin, soft-edged mist: many veils laid over one another, never a ball
  // polish2: each veil is faint and fades to nothing at its rim (the puff was a hard white shape); only the fine spray is solid
  float a = smoothstep(0., mix(1.1, .12, vK.w), dens) * vK.x * mix(.105, .6, vK.w);
  if (a < .004) discard;
  // each billow is a little ball: lit where it faces the sun, blue-grey on its far side and in the folds between billows
  vec3 nb = vec3(vUv, sqrt(max(1. - r2, 0.)));
  float l = clamp((.5 + .5 * dot(nb, vSun.xyz) + .35 * (dens - .45) + (n - .45) * .5) * vSun.w, 0., 1.);
  gl_FragColor = vec4(mix(mix(uShadeC, uLit, .30), uLit, max(max(smoothstep(.34, .86, l), vK.w), .7 * smoothstep(1.4, 2.8, vK.z))), a);      // as it thins it is all lit mist
  #include <fog_fragment>
}`,
  });
  const plume = new THREE.Mesh(pg, plumeMat); plume.frustumCulled = false; plume.renderOrder = 8; group.add(plume);
  // foam where the snout base lifts the surface, widening into a ring; fine rain rings downwind as the puff falls
  const foamGeo = new THREE.PlaneGeometry(14, 14); foamGeo.rotateX(-Math.PI / 2);
  const foamMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogU(), uBreath: U.uBreath, uNostril: { value: NOSTRIL } },
    vertexShader: /* glsl */`
uniform float uBreath; uniform vec3 uNostril; varying vec2 vP; varying float vAge;
#include <fog_pars_vertex>
void main(){
  vAge = (uBreath - ${B_BLOW - 0.07}) * ${T_BREATH.toFixed(1)};
  vP = position.xz;
  float ag = max(vAge - .364, 0.);
  vec3 p = position + vec3(uNostril.x - 2.5, .04, uNostril.z - (ag - (1. - exp(-ag * 1.4)) / 1.4) * 1.3);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform float uBreath; varying vec2 vP; varying float vAge;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float age = vAge, live = step(0., age) * step(uBreath, .999);
  vec2 q = vP - vec2(2.5, 0.); float r = length(q);
  float n = fbm(q * 2.3 + 3.) , n2 = vn(q * 7.);
  float rad = .35 + 1.05 * (1. - exp(-age * 1.1)) + age * .12;
  float ring = (1. - smoothstep(.0, .46 + .2 * n, abs(r - rad + (n - .5) * .9))) * smoothstep(.38, .62, fbm(q * 3.1 + 9.)) * (.4 + .6 * n2);
  float core = (1. - smoothstep(.2, rad, r)) * (1. - smoothstep(.0, 1.1, age)) * (.5 + .5 * n2);
  float a = (ring * (1. - smoothstep(1.2, 3.6, age)) + core) * smoothstep(0., .25, age);
  // where the plume comes down to her right the glass is pricked into a soft pale patch (no drawn rings)
  vec2 dq = vP - vec2(-.8, 1.2); float rr = (1. - smoothstep(.6, 2.6, length(dq))) * smoothstep(1.4, 2.4, age) * smoothstep(.45, .8, vn(vP * 9. + age * 1.5)) * n2;
  a = clamp(a * .8 + rr * .22 * (1. - smoothstep(3.2, 4.0, age)), 0., 1.) * live;
  if (a < .004) discard;
  gl_FragColor = vec4(vec3(1.25, 1.24, 1.2) * (.8 + .2 * n2), a);
  #include <fog_fragment>
}`,
  });
  const foam = new THREE.Mesh(foamGeo, foamMat); foam.frustumCulled = false; foam.renderOrder = 7; group.add(foam);
  await ctx.yield();

  // ---- the journey hooks
  let driven = false, swim = 0;
  const setSwim = (m) => { swim = m; U.uPhase.value = (m / 25) * Math.PI * 2; };          // one bend cycle per body length swum
  const setTilt = (t) => { U.uTilt.value = clamp(t, 0, 1); };
  const setBreath = (b) => { U.uBreath.value = clamp(b, 0, 1); };
  // m is the journey's u around the breath: tilt toward the camera at 0.60, snout base up, puff, down again by 0.665
  const momentShift = opts.momentShift ?? 0;
  const moment = (m0) => {
    const m = m0 - momentShift;
    setTilt(smoothstep(0.553, 0.598, m) * (1 - smoothstep(0.618, 0.668, m)));
    const up = smoothstep(0.578, 0.597, m) * (1 - smoothstep(0.606, 0.640, m));
    U.uLift.value = 1.55 * up; U.uRise.value = 0.5 * smoothstep(0.560, 0.597, m) * (1 - smoothstep(0.610, 0.66, m));
    setBreath((m - 0.58) / 0.08);
  };
  const swimAt = (u) => (u <= 0.4 ? 165 * u : 66 + 290 * (u - 0.4));
  const setProgress = (u) => { driven = true; setSwim(swimAt(u)); moment(u); };
  const headWorld = (target = new THREE.Vector3()) => { group.updateWorldMatrix(true, false); return target.copy(U.uHead.value).applyMatrix4(group.matrixWorld); };
  const shadowOff = () => { const t = (depth - floorY) / refr.y; return new THREE.Vector3(-refr.x * t, floorY, -refr.z * t); };

  const anchors = {
    spine: new THREE.Vector3(0, depth, 0), head: new THREE.Vector3(0, depth + 0.3, 8.3), snoutTip: new THREE.Vector3(0, depth, NOSE_Z),
    nostrils: NOSTRIL.clone(), eyeL: new THREE.Vector3(0.55, depth + 0.25, NOSE_Z - 2.66), tailTip: new THREE.Vector3(0, depth - 2.4, NOSE_Z - LEN),
    shadowCentre: shadowOff(),
    // the world's overtaking line (her frame): 21 m behind her mid-body and 3 m to her RIGHT, above the strip of sand between her and
    // her shadow, then closing and crossing over her back to 6 m on her left for the breath
    passLine: [[0.6, 6.4, -23], [-2.3, 8, -22.5], [-3.3, 8.7, -21], [-2.5, 8.4, -17], [0.9, 8, -10.4], [5.5, 7.4, -4.2], [9.7, 6.9, -2.6]].map((p) => new THREE.Vector3(...p)),
    flyThrough: [[-3.3, 8.7, -21], [0.9, 8, -10.4], [5.5, 7.4, -4.2], [9.7, 6.9, -2.6]].map((p) => new THREE.Vector3(...p)),
    viewpoints: {
      entry: { from: new THREE.Vector3(22, 31, -112), lookAt: new THREE.Vector3(-2.5, -6, 2) },
      pass: { from: new THREE.Vector3(6, 8.5, -6), lookAt: new THREE.Vector3(-2, -5, 4) },
      breath: { from: new THREE.Vector3(6, 6.3, 1), lookAt: new THREE.Vector3(0, 0.6, 9) },
    },
    portalSeat: { position: new THREE.Vector3(45, 9, 150), facing: new THREE.Vector3(0, 0, -1), note: 'hint only: the ring belongs in the cleft' },
  };
  return {
    object: group, radius: 13, height: 24, center: new THREE.Vector3(-2, 6, 1.5), anchors,   // viewer framing only (the orbit stays 1-18 m above the water); true size is in the header   // viewer framing only (the orbit stays 1-18 m above the water); true size is in the header   // viewer framing: looks down from 6-25 m, as the flight does
    ground: false, groundY: floorY,
    uniforms: U, setProgress, setSwim, setTilt, setBreath, setSun, headWorld,
    parts: { titan, titanShadow, sharks, sharkShadows, plume, foam },
    setFloorY(y) { U.uFloorY.value = y; },
    swimAt,
    update(dt, time, camera) {
      U.uTime.value = time; U.uTrim.value = time * 0.55;
      if (!driven) {          // alone in the viewer: swim by the clock and loop the breath every 11 s
        setSwim(time * 5);
        moment(0.535 + ((time % 11) / 11) * 0.145);
      }
    },
    dispose() {},
  };
}
