// Hero set piece for "Museum of Frozen Weather": THE ROTUNDA TORNADO.
//
// A funnel of grey-gold dust 150 m tall (about 14 m wide at the floor, flaring to about 80 m of wisps at the top) standing on a
// mirror-black marble floor above its own reflection, with a rowing boat, a small wooden house (lit windows),
// a bicycle, twenty chairs, a grand piano and a long drift of pages hung in orbit around it, a helical ribbon
// of autumn leaves being drawn up it, a brass-and-velvet rope ring, a blank brass plaque and the caretaker's
// little red-and-cream tethered balloon with its brush on a pole.
//
// HOW IT IS DONE (style: clean architectural render; all colour belongs to the weather)
//   - Funnel: ONE raymarched volume inside a lathe hull (front faces only; back faces when the camera is inside).
//     Density is a noise-eroded shell around a bent axis, sampled in a twisted rotating frame, so the streaks are
//     helices; lit by one key direction with a one-tap self shadow (warm lit side, cool grey shadow side) and a
//     cool daylight glow where the top meets the oculus. Premultiplied alpha, scene fog honoured.
//   - Floor: opaque polished-black disc whose shader marches the SAME density along the mirrored view ray, so
//     the funnel stands on a true moving reflection, and adds an analytic reflection of the rotunda (white drum,
//     coffered dome, bright oculus, brass cornice line). Debris is not reflected. Brass inlay rings and ticks.
//   - Debris: merged vertex-coloured meshes (MeshStandardMaterial, lit by the world's lights) moved on orbits
//     on the CPU (24 objects). Leaves / pages / gold motes: one instanced quad set animated in the vertex shader,
//     drawn twice (once normally, once after the volume for the instances on the camera's side of the funnel).
//
// opts
//   palette      array of 7 hex strings (brief order: marble, sky-white, grey vein, brass, black, violet, amber)
//   progress     initial wake 0..1 (default 1 = turning at full speed; the world should pass 0 and drive setProgress)
//   gust         initial leaf-ribbon front 0..1 (default 1 = ribbon fully drawn up the funnel)
//   floor        true: build the mirror floor disc (radius opts.floorRadius, default 90 = the whole rotunda floor)
//   curb         true: white marble base moulding ring at the floor edge (pass false inside real walls)
//   room         { radius: 90, spring: 130, top: 220, oculus: 15 }  rotunda the floor reflects; false = no room
//   lightDir     [x,y,z] direction TOWARD the key light (default 30 degrees off vertical, from -X/+Z)
//   balloon      true: caretaker's balloon
//   steps        raymarch steps (default 56; the step length scales with 56/steps, so fewer steps still cross the funnel)
//   colors       { key, amb, sky }: [r,g,b] linear or hex; relights the dust, floor reflection and leaves for another hour
//                also { self: 0.1 } the dust's own amber glow (raise it at night), { room: [r,g,b] } multiplier on the reflected
//                rotunda, { oculus: [r,g,b] } the oculus as the floor mirrors it (default 5 x sky)
//   balloonAt    [x, z] stand the balloon somewhere else (the world moves it to dust the hurricane), with balloonTether (m),
//                balloonScale and balloonYaw (radians; the pole points along local +X before the yaw)
//
// returned extras
//   setProgress(u)  0 = frozen (2% speed) ... 1 = full speed. Eased inside; includes the "breath" swell at ~0.15.
//                   Drive it from camera path distance (brief: wake window 215-300 m), never from wall-clock time.
//   setGust(u)      0 = no leaves yet, 1 = ribbon reaches the oculus (leaves enter at anchors.leafEntry).
//   hullRadiusAt(y) outer radius of the dust at height y (for clearance tests).
//
// anchors (local space; origin = funnel foot on the floor, +Y up, the enfilade door is at +Z, the exit at -Z)
//   center        look-at point for the reveal and the orbit
//   doorIn        { position, direction } where the camera enters the rotunda (12 m up, heading -Z)
//   exitDoor      { position, direction } where it leaves for the hurricane hall (90 m up, heading -Z)
//   portalSeat    { position, facing } fallback seat for a 14 m portal in the exit opening (the brief's real
//                 portal is the hurricane's eye, which is not part of this piece)
//   flyThrough    ordered points of the brief's half orbit: in at +Z, round the -X side at 62 m radius rising
//                 12 -> 90 m, out at -Z. Travels WITH the rotation, so debris drifts past slowly. Everything solid
//                 stays inside radius 50, so the line has >= 10 m clearance; leaves and pages may brush the camera.
//   viewpoints    { reveal, orbitLow, orbitHigh } good camera positions (look at center)
//   leafEntry     { position, direction } hand-off point for the world's leaf gust
//   funnelTop, oculus, balloon   points of interest
//
// size   radius 40 (dust), solid debris out to 50, floor 90; height 150 (dust haze to 165).
// cost   about 53k triangles, 11 draw calls, no lights, one 32^3 noise texture; fill-rate is the real cost
//        (the march on the funnel's pixels, opts.steps long, plus an 18-step march on the floor pixels that mirror it).
// light  expects a cool hemisphere light plus one directional key for the debris (the funnel and floor shade
//        themselves from opts.lightDir); bloom on; thin pale fog is fine.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, smoothstep, bell } from '../kit/core.js';

const DEFAULT_PALETTE = ['#F4F1EA', '#DCE6EE', '#C9CED3', '#B08D57', '#14181E', '#CFC4FF', '#D98A3A'];
const TH = 150;                       // funnel height, metres
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------
// shared GLSL: the dust density field (used by the volume and by the floor's reflection march)
// ---------------------------------------------------------------------------------------------------------
const DENS_GLSL = /* glsl */`
  precision highp sampler3D;
  uniform sampler3D uNoise;
  uniform float uPhase, uRise, uBreath;
  uniform vec4 uShape;   // base radius, flare radius, flare exponent, twist (rad per metre)
  uniform vec4 uBend;    // amplitude, angle, turns along height, wobble phase
  const float TH = 150.0;
  float nz(vec3 p) { vec3 q = p * 32.0; vec3 f = fract(q); q = floor(q) + f * f * (3.0 - 2.0 * f); return textureLod(uNoise, (q + 0.5) / 32.0, 0.).r; }   // explicit level: called from marching loops (Direct3D)
  vec2 tAxis(float y) {
    float h = clamp(y / TH, 0.0, 1.0); float a = uBend.y + h * uBend.z + uBend.w;
    return uBend.x * sin(3.14159 * h) * (0.7 + 0.3 * h) * vec2(cos(a), sin(a));
  }
  float tRw(float h) { float fl = smoothstep(0.8, 1.08, h); return (uShape.x + uShape.y * pow(max(h, 0.0), uShape.z) + 9.0 * fl * fl) * (1.0 + 0.08 * uBreath); }
  float tTh(float h) { return 1.2 + 3.6 * clamp(h, 0.0, 1.1); }
  float tDens(vec3 p, int oct) {
    float h = p.y / TH;
    if (p.y < 0.0 || h > 1.1) return 0.0;
    vec2 d = p.xz - tAxis(p.y); float r = length(d);
    float Rw = tRw(h), th = tTh(h);
    bool inSkirt = p.y < 14.0 && r < 27.0;
    if (r > Rw + 3.2 * th && !inSkirt) return 0.0;
    float a = -(uPhase + uShape.w * p.y); float ca = cos(a), sa = sin(a);
    vec2 q = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
    vec3 tc = vec3(q.x, (p.y - uRise) * 0.3, q.y) * 0.0052;
    float n0 = nz(tc * vec3(0.41, 0.33, 0.41) + vec3(0.19, 0.0, 0.83));   // big lumps and ropes
    float n1 = nz(tc), n = n1;
    if (oct > 1) { float n2 = nz(tc * 2.3 + vec3(0.37, uPhase * 0.004, 0.11)); n = n1 * 0.62 + n2 * 0.38;
      if (oct > 2) { float n3 = nz(tc * 5.7 + vec3(0.71, -uPhase * 0.006, 0.53)); n = n1 * 0.46 + n2 * 0.32 + n3 * 0.22;
        n += (nz(tc * 15.1 + vec3(0.13, uPhase * 0.011, 0.59)) - 0.5) * 0.25; } }                 // fine dust that breaks up the bands and the silhouette
    float x = (r - Rw - ((n1 - 0.5) * 1.8 + (n0 - 0.5) * 2.6) * th) / th;
    float shell = x < 0.0 ? mix(0.16, 1.0, exp(-x * x * 1.6)) : exp(-x * x * 0.58);
    float dens = shell * smoothstep(0.37, 0.63, n + shell * 0.34 + (n0 - 0.5) * 0.3);
    dens *= 1.0 - smoothstep(0.80, 1.08, h + (n - 0.5) * 0.5);
    if (inSkirt) {
      float sk = exp(-p.y / 4.2) * smoothstep(27.0, 8.0, r) * smoothstep(0.40, 0.78, n);
      dens = max(dens, sk * 0.75);
    }
    return dens;
  }
`;

// ---------------------------------------------------------------------------------------------------------
// small geometry toolkit: a bag of vertex-coloured pieces merged into one BufferGeometry
// ---------------------------------------------------------------------------------------------------------
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function M(px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
function makeBag(rng) {
  const list = [];
  const bag = {
    // color: THREE.Color or (x,y,z) => THREE.Color evaluated in the piece's own space; glow: emissive multiplier
    add(geo, color, m, glow = 0, jitter = 0.05) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      if (!g.attributes.normal) g.computeVertexNormals();
      const pos = g.attributes.position, n = pos.count;
      const col = new Float32Array(n * 3), gl = new Float32Array(n).fill(glow);
      const j = 1 + (rng() - 0.5) * 2 * jitter;
      for (let i = 0; i < n; i++) {
        const c = typeof color === 'function' ? color(pos.getX(i), pos.getY(i), pos.getZ(i)) : color;
        col[i * 3] = c.r * j; col[i * 3 + 1] = c.g * j; col[i * 3 + 2] = c.b * j;
      }
      if (m) g.applyMatrix4(m);
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('glow', new THREE.BufferAttribute(gl, 1));
      list.push(g);
      return bag;
    },
    box(w, h, d, color, m, glow = 0, r = 0) {
      const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 1, Math.min(r, w * 0.49, h * 0.49, d * 0.49)) : new THREE.BoxGeometry(w, h, d);
      return bag.add(geo, color, m, glow);
    },
    // tapered tube from a to b (arrays), radius ra at a and rb at b
    tube(a, b, ra, rb, color, seg = 7, glow = 0) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
      const geo = new THREE.CylinderGeometry(rb, ra, len, seg, 1);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      const m = new THREE.Matrix4().compose(A.add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
      return bag.add(geo, color, m, glow);
    },
    merge(other, m) { for (const g of other.list) { const c = g.clone(); if (m) c.applyMatrix4(m); list.push(c); } return bag; },
    build() { const g = mergeGeometries(list, false); for (const x of list) x.dispose(); g.computeBoundingSphere(); return g; },
    list,
  };
  return bag;
}
const tint = (hex, mul = 1, towards = null, t = 0) => { const c = new THREE.Color(hex); if (towards) c.lerp(new THREE.Color(towards), t); return c.multiplyScalar(mul); };

// standard material for every solid thing: vertex colours, plus a per-vertex "glow" emissive channel
function makeSolidMaterial(roughness = 0.72) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0.0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * (vGlow + 0.10);');
  };
  mat.customProgramCacheKey = () => 'fwm-solid-glow';
  return mat;
}

// ---------------------------------------------------------------------------------------------------------
// debris builders (each returns a bag centred on its own centre of mass, real-world-ish proportions)
// ---------------------------------------------------------------------------------------------------------
function buildBoat(rng, P) {
  const bag = makeBag(rng), L = 7.2, B = 2.3, D = 0.95, N = 16, Mj = 10;
  const cream = tint(P[0], 0.78), wood = tint(P[6], 0.55, '#6b4a2a', 0.5), band = tint(P[4], 2.2, '#31525e', 0.6), keelC = tint('#7a2f22', 0.8);
  const pos = [], idx = [];
  const sect = (u, v) => {
    const w = (B / 2) * Math.pow(1 - Math.pow(u, 2.6), 0.55) * (0.72 + 0.28 * smoothstep(0, 0.35, u));
    const dp = D * (1 - 0.45 * u * u * u), top = 0.42 * Math.pow(u, 2.5) + 0.05 * (1 - u) * (1 - u);
    const a = v * Math.PI / 2, s = Math.sin(a), c = Math.cos(a);
    return [w * Math.sign(s) * Math.pow(Math.abs(s), 0.72), top - dp * Math.pow(Math.max(c, 0), 0.85), (u - 0.45) * L];
  };
  for (let i = 0; i <= N; i++) for (let j = 0; j <= Mj; j++) pos.push(...sect(i / N, (j / Mj) * 2 - 1));
  for (let i = 0; i < N; i++) for (let j = 0; j < Mj; j++) { const a = i * (Mj + 1) + j, b = a + 1, c = a + Mj + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const c0 = pos.length / 3; pos.push(0, sect(0, 1)[1] - 0.1, sect(0, 0)[2]);          // transom fan
  for (let j = 0; j < Mj; j++) idx.push(c0, j + 1, j);
  const hull = new THREE.BufferGeometry(); hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hull.setIndex(idx); hull.computeVertexNormals();
  bag.add(hull, (x, y) => (y < -0.5 ? keelC : y > -0.02 - 0.0 * x ? wood : (y > -0.22 ? band : cream)), null, 0, 0.02);
  for (const sd of [-1, 1]) {                                                           // gunwale rails
    const pts = []; for (let i = 0; i <= N; i++) { const s = sect(i / N, sd); pts.push(new THREE.Vector3(s[0], s[1] + 0.03, s[2])); }
    bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 5), wood);
  }
  for (const u of [0.2, 0.45, 0.68]) { const s = sect(u, 0.62); bag.box(Math.abs(s[0]) * 2 + 0.05, 0.06, 0.34, wood, M(0, s[1], s[2]), 0, 0.02); }   // thwarts
  bag.tube([0, -D, -0.45 * L + 0.2], [0, -D * 0.6, 0.5 * L], 0.07, 0.05, keelC, 5);                                                         // keel
  for (const sd of [-1, 1]) {                                                           // oars, shipped askew
    const a = [sd * 1.15, 0.12, 0.2], b = [sd * (2.9 + rng() * 0.5), 0.5 + rng() * 0.7, -1.5 - rng()];
    bag.tube([sd * 0.2, -0.1, 0.9], b, 0.045, 0.04, wood, 5);
    bag.box(0.05, 0.3, 1.0, cream, new THREE.Matrix4().lookAt(new THREE.Vector3(...b), new THREE.Vector3(sd * 0.2, -0.1, 0.9), new THREE.Vector3(0, 1, 0)).setPosition(b[0], b[1], b[2]), 0, 0.02);
    bag.add(new THREE.TorusGeometry(0.09, 0.025, 5, 10), tint(P[3], 0.9), M(a[0] * 0.95, 0.1, a[2], Math.PI / 2, 0, 0));                         // rowlocks
  }
  bag.tube([0, 0.3, 0.52 * L], [0.3, -1.6, 0.52 * L + 1.2], 0.03, 0.03, tint(P[0], 0.6), 4);                                                 // painter rope
  return bag;
}

function buildHouse(rng, P) {
  const bag = makeBag(rng), W = 6, D = 7, H = 4, RH = 2.7;
  const wall = tint(P[0], 0.74), trim = tint(P[0], 0.9), slate = tint(P[4], 2.6, '#3f4a57', 0.5), dark = tint(P[4], 1.6), brick = tint('#8a5a44', 0.7);
  const lamp = new THREE.Color(1.0, 0.66, 0.3), doorC = tint(P[3], 0.75), woodD = tint('#5a4634', 0.8);
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H); sh.lineTo(0, H + RH); sh.lineTo(-W / 2, H); sh.closePath();
  bag.add(new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }), wall, M(0, 0, -D / 2));
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 9; i++) bag.box(0.09, 0.47, D + 0.06, wall, M(sd * (W / 2 + 0.03), 0.24 + i * 0.44, 0, 0, 0, sd * 0.1));              // clapboards
    for (const z of [-D / 2, D / 2]) bag.box(0.22, H, 0.22, trim, M(sd * W / 2, H / 2, z), 0, 0.03);                                        // corner boards
    const len = Math.hypot(W / 2, RH) + 0.7, ang = Math.atan2(RH, W / 2);                                                                    // roof: shingle courses
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7, cx = sd * (W / 2 + 0.45 - t * len * Math.cos(ang) * 1.0), cy = H - 0.28 + t * len * Math.sin(ang);
      bag.box(len / 7 + 0.16, 0.12, D + 1.0, slate, M(cx, cy + 0.16, 0, 0, 0, -sd * (ang + 0.07) + (sd > 0 ? 0 : Math.PI)), 0, 0.03);
    }
    for (const z of [-1.7, 1.7]) window(sd * (W / 2 + 0.09), 2.2, z, sd > 0 ? Math.PI / 2 : -Math.PI / 2, 1.1, 1.5);
  }
  function window(x, y, z, ry, w, h) {
    const m = M(x, y, z, 0, ry, 0);
    bag.box(w + 0.28, h + 0.28, 0.1, trim, m, 0, 0.03);
    bag.box(w, h, 0.14, lamp, m, 3.2 + rng() * 2.0, 0);
    bag.box(0.07, h, 0.18, trim, m); bag.box(w, 0.07, 0.18, trim, m);
    bag.box(w + 0.5, 0.1, 0.3, trim, M(x, y - h / 2 - 0.16, z, 0, ry, 0), 0, 0.03);
  }
  bag.add(new THREE.CylinderGeometry(0.2, 0.2, D + 1.1, 6), tint(P[3], 0.8), M(0, H + RH + 0.2, 0, Math.PI / 2, 0, 0));                     // ridge
  window(-1.7, 2.2, D / 2 + 0.03, 0, 1.1, 1.5); window(1.6, 2.2, -D / 2 - 0.03, Math.PI, 1.1, 1.5); window(-1.5, 2.2, -D / 2 - 0.03, Math.PI, 1.1, 1.5);
  bag.add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 14), lamp, M(0, H + 1.2, D / 2 + 0.04, Math.PI / 2, 0, 0), 3.5);                       // attic roundel
  bag.add(new THREE.TorusGeometry(0.52, 0.08, 5, 16), trim, M(0, H + 1.2, D / 2 + 0.08));
  bag.box(1.25, 2.5, 0.12, trim, M(1.2, 1.25, D / 2 + 0.03), 0, 0.03); bag.box(1.0, 2.25, 0.16, doorC, M(1.2, 1.15, D / 2 + 0.04), 0, 0.03);  // door
  bag.add(new THREE.SphereGeometry(0.07, 6, 5), tint(P[3], 1.1), M(0.85, 1.15, D / 2 + 0.16));
  bag.box(2.2, 0.2, 1.1, trim, M(1.2, -0.05, D / 2 + 0.55), 0, 0.04); bag.box(1.8, 0.2, 0.6, trim, M(1.2, -0.28, D / 2 + 1.1), 0, 0.04);      // steps
  bag.box(0.85, 2.6, 0.85, brick, M(-1.4, H + RH - 0.2, -1.2), 0, 0.03); bag.box(1.05, 0.2, 1.05, dark, M(-1.4, H + RH + 1.15, -1.2), 0, 0.04);
  bag.add(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 8), brick, M(-1.4, H + RH + 1.5, -1.2));
  bag.box(W + 0.3, 0.35, D + 0.3, dark, M(0, -0.17, 0), 0, 0.05);                                                                           // sill plate
  for (let i = 0; i < 9; i++) {                                                                                                               // torn-up foundation posts
    const x = ((i % 3) - 1) * (W / 2 - 0.3), z = (Math.floor(i / 3) - 1) * (D / 2 - 0.3), l = 0.6 + rng() * 1.5;
    bag.tube([x, -0.3, z], [x + (rng() - 0.5) * 0.5, -0.3 - l, z + (rng() - 0.5) * 0.5], 0.14, 0.09, woodD, 5);
  }
  for (let i = 0; i < 9; i++) {                                                                                                               // a length of picket fence, still attached
    const t = i * 0.42, m = M(-W / 2 - 0.6 - t * 0.82, -0.9 - t * 0.55 + Math.sin(i) * 0.05, D / 2 - 0.4 + t * 0.3, 0.1 * i, 0.3, 0.55 + i * 0.03);
    bag.box(0.16, 1.2, 0.05, trim, m, 0, 0.02);
  }
  bag.tube([-W / 2 - 0.4, -0.75, D / 2 - 0.35], [-W / 2 - 3.6, -3.0, D / 2 + 0.75], 0.04, 0.04, trim, 4);
  return bag;
}

function buildPiano(rng, P) {
  const bag = makeBag(rng), lac = tint(P[4], 1.25), brass = tint(P[3], 1.0), ivory = tint(P[0], 0.85), gold = tint(P[3], 1.15, '#e6c26a', 0.5);
  const outline = () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.5, 0); s.lineTo(1.5, 0.9); s.bezierCurveTo(1.5, 1.6, 0.95, 1.5, 0.9, 2.1); s.bezierCurveTo(0.85, 2.6, 0.3, 2.75, 0, 2.5); s.closePath(); return s; };
  const flat = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  const body = new THREE.ExtrudeGeometry(outline(), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 10 });
  bag.add(body, lac, M(0, 0.66, 0).multiply(flat));
  const plate = new THREE.ExtrudeGeometry(outline(), { depth: 0.02, bevelEnabled: false, curveSegments: 10 });
  bag.add(plate, gold, M(0.08, 1.03, -0.3, 0, 0, 0, 0.9, 1, 0.86).multiply(flat), 0.25);                                 // gilded frame under the lid
  for (let i = 0; i < 14; i++) bag.tube([0.16 + i * 0.085, 1.056, -0.4], [0.16 + i * 0.05, 1.056, -1.5 - (13 - i) * 0.06], 0.006, 0.006, ivory, 3, 0.6);  // strings
  const lid = new THREE.ExtrudeGeometry(outline(), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 10 });
  bag.add(lid, lac, M(0, 1.07, 0, 0, 0, 0.62).multiply(flat));
  bag.tube([1.3, 1.05, -0.9], [1.02, 1.8, -0.9], 0.018, 0.014, brass, 4);                                                // prop stick
  bag.box(1.5, 0.08, 0.3, lac, M(0.75, 0.74, 0.14), 0, 0.02);                                                           // key bed
  bag.box(1.36, 0.035, 0.24, ivory, M(0.75, 0.80, 0.16));                                                               // white keys
  for (let i = 0; i < 22; i++) if (i % 7 !== 2 && i % 7 !== 6) bag.box(0.03, 0.03, 0.14, lac, M(0.1 + i * 0.06, 0.825, 0.11));
  bag.box(0.07, 0.16, 0.34, lac, M(0.035, 0.84, 0.14), 0, 0.02); bag.box(0.07, 0.16, 0.34, lac, M(1.465, 0.84, 0.14), 0, 0.02);   // cheeks
  bag.box(1.1, 0.34, 0.03, lac, M(0.75, 1.2, -0.12, -0.25, 0, 0), 0, 0.01);                                              // music desk
  for (const [x, z] of [[0.16, -0.1], [1.34, -0.1], [0.42, -2.25]]) {
    bag.tube([x, 0.66, z], [x, 0.1, z], 0.085, 0.05, lac, 8); bag.add(new THREE.SphereGeometry(0.06, 7, 5), brass, M(x, 0.05, z));
  }
  bag.tube([0.66, 0.66, -0.16], [0.7, 0.12, -0.1], 0.025, 0.025, lac, 5); bag.tube([0.84, 0.66, -0.16], [0.8, 0.12, -0.1], 0.025, 0.025, lac, 5);
  bag.box(0.3, 0.07, 0.1, lac, M(0.75, 0.12, -0.1), 0, 0.02);
  for (const x of [0.67, 0.75, 0.83]) bag.box(0.035, 0.015, 0.14, brass, M(x, 0.09, 0.0));
  // stool, drifting just off the keyboard
  bag.box(0.62, 0.1, 0.36, tint('#5b1a22', 0.9), M(0.75, 0.52, 0.85, 0.3, 0.2, 0.1), 0, 0.04);
  for (const [x, z] of [[-0.25, -0.13], [0.25, -0.13], [-0.25, 0.13], [0.25, 0.13]]) bag.tube([0.75 + x, 0.48 + z * 0.3, 0.85 + z], [0.75 + x * 1.1, 0.02 + z * 0.3, 0.72 + z * 1.2], 0.03, 0.02, lac, 5);
  return bag;       // centre it later: about (0.75, 0.7, -1.2)
}

function buildBicycle(rng, P) {
  const bag = makeBag(rng), frame = tint(P[6], 0.8), tyre = tint(P[4], 1.5), rim = tint(P[3], 1.0), cream = tint(P[0], 0.8), saddle = tint('#5a3a24', 0.8);
  const R = 0.34, wheel = (x) => {
    bag.add(new THREE.TorusGeometry(R, 0.028, 6, 26), tyre, M(x, R, 0));
    bag.add(new THREE.TorusGeometry(R - 0.035, 0.012, 4, 26), rim, M(x, R, 0));
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; bag.tube([x + Math.cos(a) * (R - 0.04), R + Math.sin(a) * (R - 0.04), 0], [x - Math.cos(a) * (R - 0.04), R - Math.sin(a) * (R - 0.04), 0], 0.006, 0.006, rim, 3); }
    bag.add(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6), rim, M(x, R, 0, Math.PI / 2, 0, 0));
    bag.add(new THREE.TorusGeometry(R + 0.05, 0.022, 4, 12, Math.PI * 0.8), frame, M(x, R, 0, 0, 0, Math.PI * 0.15));          // mudguard
  };
  wheel(-0.52); wheel(0.6);
  const A = [-0.52, R, 0], B = [-0.06, 0.29, 0], S = [-0.2, 0.86, 0], Ht = [0.4, 0.9, 0], Hb = [0.45, 0.7, 0], F = [0.6, R, 0];
  for (const [a, b, r] of [[B, S, 0.022], [S, Ht, 0.02], [B, Hb, 0.024], [Ht, Hb, 0.026]]) bag.tube(a, b, r, r, frame, 6);
  for (const z of [-0.05, 0.05]) { bag.tube([A[0], A[1], z], [B[0], B[1], z * 0.5], 0.013, 0.013, frame, 4); bag.tube([A[0], A[1], z], [S[0], S[1] - 0.06, z * 0.4], 0.012, 0.012, frame, 4); bag.tube([Hb[0], Hb[1], z * 0.6], [F[0], F[1], z], 0.014, 0.012, frame, 4); }
  bag.tube(S, [-0.23, 0.98, 0], 0.016, 0.016, rim, 5); bag.box(0.26, 0.05, 0.13, saddle, M(-0.25, 1.0, 0, 0, 0, 0.05), 0, 0.02);
  bag.tube(Ht, [0.38, 1.06, 0], 0.016, 0.016, rim, 5); bag.tube([0.38, 1.06, -0.26], [0.38, 1.06, 0.26], 0.014, 0.014, rim, 5);
  for (const z of [-0.26, 0.26]) bag.tube([0.38, 1.06, z], [0.26, 1.08, z * 1.12], 0.018, 0.018, saddle, 5);
  bag.add(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 14), rim, M(B[0], B[1], 0.045, Math.PI / 2, 0, 0));
  bag.tube([B[0], B[1], 0.07], [B[0] + 0.12, B[1] - 0.12, 0.07], 0.01, 0.01, rim, 4); bag.tube([B[0], B[1], -0.07], [B[0] - 0.12, B[1] + 0.12, -0.07], 0.01, 0.01, rim, 4);
  bag.box(0.09, 0.02, 0.07, tyre, M(B[0] + 0.12, B[1] - 0.12, 0.11)); bag.box(0.09, 0.02, 0.07, tyre, M(B[0] - 0.12, B[1] + 0.12, -0.11));
  bag.box(0.3, 0.2, 0.34, cream, M(0.62, 0.92, 0), 0, 0.03); bag.box(0.26, 0.04, 0.3, tint(P[6], 0.5), M(0.62, 1.03, 0));          // basket + a loaf of leaves
  bag.add(new THREE.SphereGeometry(0.035, 6, 5), new THREE.Color(1, 0.85, 0.6), M(0.5, 0.82, 0), 4.0);                              // lamp
  return bag;
}

function buildChair(rng, P) {
  const bag = makeBag(rng), w = new THREE.Color(0.8, 0.8, 0.8);
  bag.box(0.46, 0.05, 0.46, w, M(0, 0.47, 0), 0, 0.02);
  for (const [x, z] of [[-1, 1], [1, 1]]) bag.tube([x * 0.19, 0.46, z * 0.19], [x * 0.22, 0, z * 0.23], 0.028, 0.018, w, 6);
  for (const x of [-1, 1]) {
    bag.tube([x * 0.2, 1.02, -0.27], [x * 0.21, 0, -0.25], 0.022, 0.02, w, 6);
    bag.tube([x * 0.21, 0.2, -0.24], [x * 0.21, 0.2, 0.22], 0.012, 0.012, w, 4);
  }
  bag.tube([-0.21, 0.24, 0.22], [0.21, 0.24, 0.22], 0.012, 0.012, w, 4);
  bag.box(0.48, 0.1, 0.04, w, M(0, 0.99, -0.275, -0.08, 0, 0), 0, 0.015);
  for (const y of [0.68, 0.82]) bag.box(0.4, 0.05, 0.02, w, M(0, y, -0.265, -0.05, 0, 0));
  return bag;
}

// ---------------------------------------------------------------------------------------------------------
// floor dressing: rope ring, plaque, curb; and the caretaker's balloon
// ---------------------------------------------------------------------------------------------------------
async function buildDressing(rng, P, o, ctx) {
  const bag = makeBag(rng), brass = tint(P[3], 0.95), brassHi = tint(P[3], 1.25, '#e9cf8f', 0.4), velvet = tint('#6a1722', 0.85), marble = tint(P[0], 0.8), vein = tint(P[2], 0.8);
  const N = 28, R = o.ropeR, gap = rng.int(0, N - 1);
  const prof = [[0, 0], [0.3, 0], [0.32, 0.04], [0.2, 0.09], [0.07, 0.14], [0.055, 0.5], [0.05, 1.02], [0.085, 1.06], [0.085, 1.1], [0.05, 1.13], [0.1, 1.2], [0.12, 1.28], [0.08, 1.36], [0, 1.38]].map((p) => new THREE.Vector2(p[0], p[1]));
  const post = new THREE.LatheGeometry(prof, 10);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + 0.11, x = Math.cos(a) * R, z = Math.sin(a) * R;
    bag.add(post.clone(), (px, py) => (py > 1.15 ? brassHi : brass), M(x, 0, z, 0, rng() * 6, 0, 1.25));
    if (i === gap) continue;                                             // one bay left open, the rope unhooked and lying on the floor
    const a2 = ((i + 1) / N) * TAU + 0.11, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, aa = lerp(a, a2, t); pts.push(new THREE.Vector3(Math.cos(aa) * R, 1.36 - 0.42 * (1 - Math.pow(2 * t - 1, 2)), Math.sin(aa) * R)); }
    bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.075, 6), velvet);
    if ((i & 3) === 3) await ctx.yield();
  }
  { const a = (gap / N) * TAU + 0.11, pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new THREE.Vector3(Math.cos(a) * R + Math.cos(a + 1.2) * t * 5 + Math.sin(t * 7) * 0.5, Math.max(0.08, 1.36 - t * 4), Math.sin(a) * R + Math.sin(a + 1.2) * t * 5 + Math.cos(t * 5) * 0.5)); }
    bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.075, 6), velvet); }
  // blank brass plaque on a marble plinth, at the front
  const pm = M(7, 0, R + 5, 0, -0.15, 0);
  bag.add(new THREE.LatheGeometry([[0, 0], [0.75, 0], [0.75, 0.12], [0.62, 0.2], [0.55, 0.3], [0.55, 1.25], [0.62, 1.33], [0.7, 1.4], [0.7, 1.5], [0, 1.5]].map((p) => new THREE.Vector2(p[0], p[1])), 4), (x, y, z) => (Math.sin(x * 9 + y * 5 + z * 7) > 0.92 ? vein : marble), pm.clone().multiply(M(0, 0, 0, 0, Math.PI / 4, 0, 1.3)));
  bag.box(1.5, 0.06, 1.0, brassHi, pm.clone().multiply(M(0, 2.02, 0.1, 0.5, 0, 0)), 0.15, 0.02);
  bag.box(1.62, 0.05, 1.12, brass, pm.clone().multiply(M(0, 2.0, 0.1, 0.5, 0, 0)), 0, 0.02);
  if (o.curb) {                                                           // marble base moulding where the rotunda wall will stand
    const fr = o.floorR, cp = [[fr, -0.5], [fr, 0.02], [fr + 0.5, 0.02], [fr + 0.5, 0.5], [fr + 0.9, 0.62], [fr + 1.1, 0.95], [fr + 1.1, 1.5], [fr + 1.5, 1.7], [fr + 1.5, 2.0], [fr + 3.5, 2.0], [fr + 3.5, -0.5]].map((p) => new THREE.Vector2(p[0], p[1]));
    bag.add(new THREE.LatheGeometry(cp, 96), (x, y, z) => { const a = Math.atan2(z, x) * 40; return Math.sin(a + y * 3) * Math.sin(a * 0.37 + 2) > 0.8 ? vein : marble; }, null, 0, 0);
  }
  return bag;
}

const P3v = (x, y, z) => new THREE.Vector3(x, y, z);
function buildBalloon(rng, P, tetherLen, ropeR = 0.07) {
  const bag = makeBag(rng), red = tint('#a8322a', 0.85), cream = tint(P[0], 0.85), wicker = tint(P[6], 0.5, '#8a6a3e', 0.6), brass = tint(P[3], 1.0), rope = tint(P[0], 0.55);
  const prof = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, a = t * Math.PI * 0.86; prof.push(new THREE.Vector2(3.0 * Math.sin(a) * (t < 0.5 ? 1 : lerp(1, 0.62, (t - 0.5) * 2)), 3.2 * Math.cos(a) - (t > 0.5 ? (t - 0.5) * 3.0 : 0))); }
  prof.reverse();
  const env = new THREE.LatheGeometry(prof, 24).toNonIndexed(); env.computeVertexNormals();
  { // gores: colour per face from its centroid angle
    const p = env.attributes.position, cols = [];
    for (let i = 0; i < p.count; i += 3) { const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      const k = Math.floor(((Math.atan2(cz, cx) + Math.PI) / TAU) * 12 + (cy > 2.2 || (cy < -1.0 && cy > -1.8) ? 0.5 : 0)) % 2; cols.push(k); }
    let f = 0; const base = tetherLen + 5.2;
    bag.add(env, (x, y, z) => (cols[Math.floor(f++ / 3)] ? red : cream), M(0, base, 0), 0, 0);
    bag.add(new THREE.TorusGeometry(0.8, 0.07, 5, 16), brass, M(0, base - 4.4, 0, Math.PI / 2, 0, 0));
    bag.add(new THREE.SphereGeometry(0.16, 8, 6), new THREE.Color(1, 0.7, 0.35), M(0, base - 4.2, 0), 5);            // burner glow
    const by = base - 6.6;
    bag.box(1.3, 1.0, 1.3, wicker, M(0, by, 0), 0, 0.12); bag.add(new THREE.TorusGeometry(0.72, 0.07, 5, 16), tint('#5a3a24', 0.8), M(0, by + 0.5, 0, Math.PI / 2, 0, Math.PI / 4));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bag.tube([x * 0.6, by + 0.5, z * 0.6], [x * 0.56, base - 4.4, z * 0.56], 0.03, 0.03, rope, 4);
    bag.tube([0, 0.1, 0], [0, by - 0.5, 0], ropeR, ropeR, rope, 5);                                                   // tether
    bag.add(new THREE.CylinderGeometry(0.5, 0.62, 0.5, 10), brass, M(0, 0.25, 0)); bag.add(new THREE.TorusGeometry(0.2, 0.05, 5, 10), brass, M(0, 0.6, 0));
    // the long pole and its brush, reaching toward the funnel (+X in balloon space)
    bag.tube([0.4, by + 0.6, 0.2], [10.5, by + 2.6, 0.2], 0.06, 0.045, tint('#8a6a3e', 0.7), 5);
    bag.box(0.5, 1.5, 0.5, brass, M(10.7, by + 2.65, 0.2, 0, 0, -1.37), 0, 0.08);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; bag.tube([11.3, by + 2.76, 0.2], [12.5 + rng() * 0.3, by + 3.0 + Math.sin(a) * 0.6, 0.2 + Math.cos(a) * 0.6], 0.07, 0.02, cream, 4); }
    // a small caretaker's flag of dusters hanging under the basket
    for (let i = 0; i < 4; i++) bag.box(0.3, 0.45, 0.03, i % 2 ? red : cream, M(-0.5 + i * 0.33, by - 0.75, 0.66, 0, 0, (rng() - 0.5) * 0.3));
  }
  return bag;
}

// ---------------------------------------------------------------------------------------------------------
// floor: polished black marble that mirrors the funnel (reflected-ray march) and the rotunda (analytic)
// ---------------------------------------------------------------------------------------------------------
function makeFloorMaterial(U, o) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, {
      uFloorCol: { value: tint(o.P[4], 0.55) }, uBrass: { value: tint(o.P[3], 0.9) }, uMarble: { value: tint(o.P[0], 0.62) },
      uRoom: { value: new THREE.Vector4(o.room ? o.room.radius : 0, o.room ? o.room.spring : 0, o.room ? o.room.top : 0, o.room ? o.room.oculus : 0) },
      uRings: { value: new THREE.Vector3(o.ropeR + 6, o.ropeR + 8.5, o.floorR) },
    }),
    fog: true,
    vertexShader: /* glsl */`
      uniform mat4 uInvModel;
      varying vec3 vLocal; varying vec3 vRo;
      #include <fog_pars_vertex>
      void main() {
        vLocal = position; vRo = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${DENS_GLSL}
      uniform vec3 uFloorCol, uBrass, uMarble, uLight, uColA, uColB, uColSky, uColAmb, uColKey, uRoomLit, uOcu;
      uniform vec4 uRoom; uniform vec3 uRings; uniform float uSigma, uSelfLit;
      varying vec3 vLocal; varying vec3 vRo;
      #include <fog_pars_fragment>
      vec3 roomEnv(vec3 p, vec3 rd) {
        if (uRoom.x < 1.0) return uColSky * (0.25 + 0.5 * rd.y);
        float RR = uRoom.x, ys = uRoom.y, yt = uRoom.z;
        // oculus disc in the plane y = top
        float tt = (yt - p.y) / max(rd.y, 1e-3); vec2 hp = p.xz + rd.xz * tt; float rho = length(hp);
        float oc = 1.0 - smoothstep(uRoom.w - 1.2, uRoom.w + 0.4, rho);
        // wall cylinder
        float b = dot(p.xz, rd.xz), a2 = max(dot(rd.xz, rd.xz), 1e-5), c = dot(p.xz, p.xz) - RR * RR;
        float tw = (-b + sqrt(max(b * b - a2 * c, 0.0))) / a2; vec3 wp = p + rd * tw;
        vec3 col;
        if (wp.y < ys) {                                    // drum: pilasters, bays, brass cornice line
          float az = atan(wp.z, wp.x) * 16.0 / 3.14159;      // 32 bays
          float pil = smoothstep(0.38, 0.44, abs(fract(az) - 0.5));
          float hgt = wp.y / ys;
          col = uMarble * mix(0.30, 0.36, pil) * (0.45 + 0.55 * hgt);
          col *= 1.0 - 0.12 * (1.0 - pil) * smoothstep(0.06, 0.1, hgt) * (1.0 - smoothstep(0.62, 0.7, hgt));   // arched bays in shade
          col += uBrass * 1.6 * (1.0 - smoothstep(0.004, 0.012, abs(hgt - 0.24)));                              // tram rail
          col = mix(col, uMarble * 0.8, 1.0 - smoothstep(0.0, 0.03, abs(hgt - 0.97)));
        } else {                                            // dome: coffers shrinking to the oculus
          float k = clamp((rho - uRoom.w) / max(RR - uRoom.w, 1.0), 0.0, 1.0);    // 0 at oculus rim, 1 at springing
          float az = atan(hp.y, hp.x) * 16.0 / 3.14159; float rg = pow(k, 0.7) * 6.0;
          vec2 cf = abs(fract(vec2(az, rg)) - 0.5);
          float cof = smoothstep(0.30, 0.36, max(cf.x, cf.y));
          col = uMarble * mix(0.40, 0.56, cof) * mix(1.1, 0.6, k);
          col += uBrass * 0.5 * (1.0 - smoothstep(0.0, 0.03, k));
        }
        return mix(col * uRoomLit, uOcu, oc);
      }
      void main() {
        vec3 V = normalize(vLocal - vRo); vec3 R = vec3(V.x, abs(V.y), V.z);
        float r = length(vLocal.xz), az = atan(vLocal.z, vLocal.x);
        // inlays
        float aw = fwidth(r) * 1.2 + 0.02;
        float ring = (1.0 - smoothstep(0.16, 0.16 + aw, abs(r - uRings.x))) + (1.0 - smoothstep(0.16, 0.16 + aw, abs(r - uRings.y)));
        float ta = az * 36.0 / 3.14159; float tw = fwidth(ta) * 1.2;
        float major = step(abs(fract(ta / 9.0 + 0.5) - 0.5), 0.5 / 9.0);
        float tick = (1.0 - smoothstep(mix(0.045, 0.11, major), mix(0.045, 0.11, major) + tw, abs(fract(ta + 0.5) - 0.5))) * step(mix(uRings.x + 0.9, uRings.x, major), r) * step(r, uRings.y);
        float joint = (1.0 - smoothstep(0.0, aw * 0.6 + 0.03, abs(fract(r / 11.0) - 0.5) * 11.0 - 5.45)) * step(uRings.y + 2.0, r);
        float inlay = clamp(ring + tick, 0.0, 1.0);
        // marble body: faint veins
        float vn = nz(vec3(vLocal.xz * 0.0031, 0.37)) + 0.5 * nz(vec3(vLocal.zx * 0.0074, 0.71));
        float vein = 1.0 - smoothstep(0.0, 0.035, abs(vn - 0.78));
        vec3 base = uFloorCol * (0.5 + 0.3 * nz(vec3(vLocal.xz * 0.0011, 0.11))) + vec3(0.014, 0.016, 0.019) * vein;
        base = mix(base, uFloorCol * 0.25, joint * 0.7);
        base += uColA * 0.9 * uSelfLit * exp(-r * r / 700.0);            // the dust's amber light pooled on the floor
        base = mix(base, uBrass * (0.22 + 0.5 * max(uLight.y, 0.0)) * (uRoomLit + uColA * uSelfLit * 2.0 * exp(-r * r / 2600.0)), inlay);
        // reflection: march the dust along the mirrored ray
        vec3 col = vec3(0.0); float T = 1.0;
        float bq = dot(vLocal.xz, R.xz), aq = max(dot(R.xz, R.xz), 1e-5), cq = r * r - 46.0 * 46.0, disc = bq * bq - aq * cq;
        if (disc > 0.0) {
          float sq = sqrt(disc), t0 = max((-bq - sq) / aq, 0.0), t1 = (-bq + sq) / aq;
          t1 = min(t1, (TH * 1.1) / max(R.y, 1e-3));
          float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          float t = t0 + jit * 2.0;
          for (int i = 0; i < 18; i++) {                         // a mirror image: half the funnel's own step count, longer steps, dithered start
            if (t > t1 || T < 0.03) break;
            vec3 p = vLocal + R * t; float h = p.y / TH, th = tTh(h);
            float ds = (0.8 * th + 0.4) * 1.67;
            float dn = tDens(p, 2);
            if (dn > 0.004) {
              float sh = tDens(p + uLight * (1.5 + 2.0 * th), 1);
              float lit = exp(-sh * 2.4);
              vec3 alb = mix(uColA, uColB, clamp(h * 1.1, 0.0, 1.0));
              vec3 c = alb * (uColAmb * (0.4 + 0.6 * h) + uColKey * lit) + uColSky * 0.42 * smoothstep(0.7, 1.06, h) * (0.3 + 0.7 * lit);
              float a = 1.0 - exp(-dn * uSigma * ds);
              col += T * a * c; T *= 1.0 - a;
            }
            t += ds;
          }
        }
        col += T * roomEnv(vLocal, R);
        float cosv = clamp(R.y, 0.0, 1.0);
        float F0 = mix(0.3, 0.6, inlay);
        float F = F0 + (1.0 - F0) * pow(1.0 - cosv, 5.0);
        vec3 refl = col * mix(vec3(1.0), uBrass * 1.6, inlay);
        gl_FragColor = vec4(base + refl * F, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// the funnel: raymarched dust inside a lathe hull
// ---------------------------------------------------------------------------------------------------------
function makeFunnelMaterial(U, steps) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, { uInside: { value: 0 } }),
    defines: { STEPS: steps, STEPK: (56 / Math.max(steps, 8)).toFixed(3) },      // fewer steps are longer steps: the march always crosses the whole funnel
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      uniform mat4 uInvModel;
      varying vec3 vLocal; varying vec3 vRo;
      #include <fog_pars_vertex>
      void main() {
        vLocal = position; vRo = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${DENS_GLSL}
      uniform vec3 uLight, uColA, uColB, uColSky, uColAmb, uColKey;
      uniform float uSigma, uInside, uSelfLit;
      varying vec3 vLocal; varying vec3 vRo;
      #include <fog_pars_fragment>
      void main() {
        if (!gl_FrontFacing && uInside < 0.5) discard;
        vec3 rd = normalize(vLocal - vRo);
        float t = gl_FrontFacing ? length(vLocal - vRo) : 0.0;
        float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        vec3 col = vec3(0.0); float T = 1.0;
        t += jit * 0.9 * STEPK;
        for (int i = 0; i < STEPS; i++) {
          vec3 p = vRo + rd * t; float h = p.y / TH;
          if (p.y < -0.3 || h > 1.11) break;
          vec2 d = p.xz - tAxis(p.y); float r = length(d);
          float Rw = tRw(h), th = tTh(h), fo = Rw + 3.2 * th;
          float outer = max(fo, p.y < 14.0 ? 27.0 : 0.0);
          if (r > outer + 1.6 && dot(d, rd.xz) > 0.0) break;
          float ds = (r > fo ? 1.5 : 0.5 * th + 0.25) * STEPK;
          float dn = tDens(p, 3);
          if (dn > 0.004) {
            float sh = tDens(p + uLight * (1.5 + 2.0 * th), 2);
            float lit = exp(-sh * 4.0);
            float hc = clamp(h, 0.0, 1.0);
            float edge = 1.0 - smoothstep(0.0, 0.5, dn);                      // thin wisps scatter more light
            vec3 alb = mix(uColA, uColB, clamp(hc * 1.1 + edge * 0.15, 0.0, 1.0));
            vec3 c = alb * (uColAmb * (0.4 + 0.6 * hc) + uColKey * lit * (0.85 + 0.5 * edge));
            c += uColA * uSelfLit * (1.0 - hc) * (1.0 + (uSelfLit - 0.1) * 6.0 * exp(-hc * 7.0));   // the dust's own amber light, strongest at the foot
            c += uColSky * 0.42 * smoothstep(0.7, 1.06, h) * (0.3 + 0.7 * lit);   // daylight from the oculus
            float a = 1.0 - exp(-dn * uSigma * ds);
            col += T * a * c; T *= 1.0 - a;
            if (T < 0.02) break;
          }
          t += ds;
        }
        float alpha = 1.0 - T;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(col / alpha, alpha);
        #include <fog_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// leaves, pages and gold motes: instanced quads on helical paths, animated in the vertex shader
// ---------------------------------------------------------------------------------------------------------
function makeLeafMaterial(U, frontPass, P) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, {
      uFrontPass: { value: frontPass ? 1 : 0 },
      uLeafA: { value: tint(P[6], 0.95) }, uLeafB: { value: tint('#a8482a', 0.8) }, uLeafC: { value: tint('#e2c24a', 0.85) }, uPage: { value: tint(P[0], 0.8) },
    }),
    fog: true, side: THREE.DoubleSide, transparent: !!frontPass, depthWrite: true,
    vertexShader: /* glsl */`
      ${DENS_GLSL}
      attribute vec4 aA, aB;
      uniform mat4 uInvModel;
      uniform float uFlow, uFlutter, uGust, uTurns, uFrontPass, uDrift;
      varying vec2 vUv; varying vec3 vN; varying vec4 vInfo;
      #include <fog_pars_vertex>
      float hullR(float h) { float hh = clamp(h, 0.0, 1.0); return tRw(hh) + 2.4 * tTh(hh); }
      void main() {
        float type = aB.x, kind = aB.w, rnd = aA.w; float sc = aB.y; vec3 c; float y, th, rr;
        if (kind < 0.5) {                                   // the gust: in at the door, round and up, out through the oculus
          float s = fract(aA.x + uFlow * 0.034 * (0.85 + 0.3 * rnd));
          float k = smoothstep(0.0, 0.2, s);
          y = 13.0 + 3.0 * sin(s * 40.0 + rnd * 6.0) * (1.0 - k) + 188.0 * pow(max(s - 0.1, 0.0) / 0.9, 1.3);
          float h = y / TH;
          float rH = (hullR(h) + 1.0 + aA.y * 3.5) * (1.0 - 0.85 * smoothstep(1.0, 1.32, h));
          rr = mix(98.0 + aA.y * 8.0, rH, k);
          th = 1.5708 + (aA.z - 0.5) * 0.16 * (1.0 + 3.0 * k) + uTurns * 6.2832 * pow(s, 0.85);
          y += (aA.z - 0.5) * (1.5 + 3.0 * k);
          sc *= smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.92, 1.0, s)) * (1.0 - smoothstep(uGust - 0.04, uGust, s));
          c = vec3(cos(th) * rr, y, sin(th) * rr); c.xz += tAxis(y) * k;
        } else if (kind < 1.5) {                            // loose things circling the funnel
          y = mod(aA.z * TH * 1.04 + uFlow * 2.6 * (0.4 + rnd), TH * 1.04); float h = y / TH;
          rr = hullR(h) + 0.5 + aA.y * aA.y * 24.0;
          th = aA.x * 6.2832 + uPhase * (0.22 + 0.5 / (1.0 + aA.y * 4.0));
          sc *= smoothstep(0.0, 4.0, y) * (1.0 - smoothstep(TH * 0.94, TH * 1.04, y));
          c = vec3(cos(th) * rr, y, sin(th) * rr); c.xz += tAxis(y);
        } else {                                            // the long drift of pages
          float u = aA.x;
          y = mix(20.0, 82.0, u) + (aA.z - 0.5) * 5.0 + 1.5 * sin(u * 23.0 + uPhase * 0.4); float h = y / TH;
          rr = hullR(h) + 4.5 + aA.y * 5.5;
          th = uDrift + u * 5.4 + uPhase * 0.3;
          c = vec3(cos(th) * rr, y, sin(th) * rr); c.xz += tAxis(y);
        }
        vec3 ro = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
        if (uFrontPass > 0.5) { vec2 ax = tAxis(c.y); if (dot(c.xz - ax, ro.xz - ax) < 0.0 || c.y > TH * 1.08) sc = 0.0; }
        // tumble
        vec3 axv = normalize(vec3(sin(rnd * 37.0), cos(rnd * 91.0) * 0.6, sin(rnd * 53.0 + 1.0)));
        float ang = rnd * 40.0 + uFlutter * (1.2 + 3.5 * fract(rnd * 7.3));
        vec2 asp = type < 0.5 ? vec2(1.0, 1.15) : (type < 1.5 ? vec2(0.72, 1.0) : vec2(1.0));
        vec3 v = vec3(position.xy * asp * sc, 0.0), nn = vec3(0.0, 0.0, 1.0);
        float ca = cos(ang), sa = sin(ang);
        v = v * ca + cross(axv, v) * sa + axv * dot(axv, v) * (1.0 - ca);
        nn = nn * ca + cross(axv, nn) * sa + axv * dot(axv, nn) * (1.0 - ca);
        vUv = uv; vN = nn; vInfo = vec4(type, aB.z, rnd, c.y / TH);
        vec4 mvPosition = modelViewMatrix * vec4(c + v, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight, uColSky, uColAmb, uColKey, uLeafA, uLeafB, uLeafC, uPage;
      varying vec2 vUv; varying vec3 vN; varying vec4 vInfo;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float type = vInfo.x; vec3 col; float glow = 0.0;
        if (type < 0.5) {
          float a = atan(p.x, p.y), rad = length(p);
          float lobed = 0.52 + 0.4 * pow(abs(cos(a * 2.5)), 1.5);                         // maple
          float lance = abs(p.x) < 0.52 * pow(max(1.0 - p.y * p.y, 0.0), 0.8) * (1.0 + 0.1 * sin(p.y * 22.0)) ? 2.0 : 0.0;   // beech / oak
          float lim = vInfo.y < 0.4 ? lobed : lance;
          if (rad > lim || (abs(p.x) > 0.05 && p.y < -0.72 && vInfo.y < 0.4)) discard;
          col = vInfo.y < 0.33 ? uLeafA : (vInfo.y < 0.66 ? uLeafB : uLeafC);
          col = mix(col, uLeafA, 0.35 * vInfo.z);
          col *= 0.78 + 0.22 * smoothstep(0.0, 0.08, abs(p.x)) ;                           // midrib
          glow = 0.22;
        } else if (type < 1.5) {
          col = uPage * (0.86 + 0.14 * p.y * sign(vN.y + 0.001));                           // a soft curl
          glow = 0.08;
        } else {
          float rad = length(p); if (rad > 1.0) discard;
          col = vec3(1.0, 0.82, 0.5); glow = 3.0 * (1.0 - rad) * (0.4 + 0.6 * fract(vInfo.z * 13.0));
        }
        float nl = abs(dot(normalize(vN), uLight));
        vec3 lit = col * (uColAmb * (0.55 + 0.45 * vInfo.w) + uColKey * (0.25 + 0.75 * nl)) + col * glow;
        lit += col * uColSky * 0.35 * smoothstep(0.75, 1.1, vInfo.w);
        gl_FragColor = vec4(lit, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// the hero
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('rotunda-tornado') : ctx.rng;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const floorR = opts.floorRadius ?? 90, ropeR = 33;
  const room = opts.room === false ? null : Object.assign({ radius: 90, spring: 130, top: 220, oculus: 15 }, opts.room || {});
  const group = new THREE.Group(); group.name = 'rotunda-tornado';

  // ---- per-seed character ----
  const shape = { baseR: rng.range(4.0, 5.2), flareR: rng.range(20, 24), exp: rng.range(1.45, 2.0), twist: rng.range(0.075, 0.11) };
  const bend = { amp: rng.range(3.0, 6.5), ang: rng() * TAU, turns: rng.range(1.2, 3.6) };
  const tone = rng();                                              // 0 greyer and paler ... 1 more amber
  const turns = rng.range(2.6, 3.6);
  const Rw = (h) => shape.baseR + shape.flareR * Math.pow(Math.max(h, 0), shape.exp) + 9 * Math.pow(smoothstep(0.8, 1.08, h), 2), Th = (h) => 1.2 + 3.6 * clamp(h, 0, 1.1);
  const outerR = (y) => { const h = clamp(y / TH, 0, 1); return Rw(h) + 2.4 * Th(h); };
  const hullR = (y) => { const h = clamp(y / TH, 0, 1.1), hh = Math.min(h, 1); return Math.max(Rw(h) * 1.08 + 3.2 * Th(h), y < 14 ? 27 : 0) + bend.amp * Math.sin(Math.PI * hh) * (0.7 + 0.3 * hh) + 1.2; };

  // ---- noise volume ----
  const nd = new Uint8Array(32 * 32 * 32); for (let i = 0; i < nd.length; i++) nd[i] = Math.floor(rng() * 256);
  const noiseTex = new THREE.Data3DTexture(nd, 32, 32, 32);
  noiseTex.format = THREE.RedFormat; noiseTex.type = THREE.UnsignedByteType; noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter;
  noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping; noiseTex.unpackAlignment = 1; noiseTex.needsUpdate = true;

  const L = new THREE.Vector3(...(opts.lightDir || [-0.38, 0.86, 0.34])).normalize();
  const U = {
    uNoise: { value: noiseTex }, uPhase: { value: rng() * 40 }, uRise: { value: rng() * 200 }, uBreath: { value: 0 },
    uShape: { value: new THREE.Vector4(shape.baseR, shape.flareR, shape.exp, shape.twist) },
    uBend: { value: new THREE.Vector4(bend.amp, bend.ang, bend.turns, 0) },
    uInvModel: { value: new THREE.Matrix4() }, uLight: { value: L }, uSigma: { value: 0.6 },
    uColA: { value: tint(P[6], 0.62, '#8f8678', 0.62 - 0.3 * tone) }, uColB: { value: tint(P[0], 0.74, P[3], 0.18 + 0.2 * tone) },
    uColSky: { value: tint('#EEF4FF', 1.0) }, uColAmb: { value: new THREE.Color(0.27, 0.31, 0.42) }, uColKey: { value: new THREE.Color(1.3, 1.14, 0.9) },
    uFlow: { value: rng() * 30 }, uFlutter: { value: rng() * 30 }, uGust: { value: 1.05 }, uTurns: { value: turns }, uDrift: { value: rng() * TAU },
  };
  U.uSelfLit = { value: 0.1 }; U.uRoomLit = { value: new THREE.Color(1, 1, 1) }; U.uOcu = { value: new THREE.Color() };
  if (opts.colors) {                                               // the world's hour: key, ambient and sky-glow colours of the dust
    const setC = (u, v) => { if (v) { if (Array.isArray(v)) u.value.setRGB(v[0], v[1], v[2]); else u.value.set(v); } };
    setC(U.uColKey, opts.colors.key); setC(U.uColAmb, opts.colors.amb); setC(U.uColSky, opts.colors.sky); setC(U.uRoomLit, opts.colors.room);
    if (typeof opts.colors.self === 'number') U.uSelfLit.value = opts.colors.self;
  }
  U.uOcu.value.copy(U.uColSky.value).multiplyScalar(5);
  if (opts.colors && opts.colors.oculus) U.uOcu.value.setRGB(...opts.colors.oculus);
  await ctx.yield();

  // ---- floor ----
  let floor = null;
  if (opts.floor !== false) {
    const fg = new THREE.CircleGeometry(floorR, 96); fg.rotateX(-Math.PI / 2);
    floor = new THREE.Mesh(fg, makeFloorMaterial(U, { P, room, ropeR, floorR })); floor.position.y = 0.02; floor.name = 'mirror-floor';
    group.add(floor);
  }

  // ---- funnel ----
  const hp = [new THREE.Vector2(28.5, 0), new THREE.Vector2(28.5, 14)];
  for (let y = 14.01; y < TH * 1.1; y += 4.5) hp.push(new THREE.Vector2(hullR(y), y));
  hp.push(new THREE.Vector2(hullR(TH * 1.1), TH * 1.1), new THREE.Vector2(0, TH * 1.1));
  const hullGeo = new THREE.LatheGeometry(hp, 40);
  const funnelMat = makeFunnelMaterial(U, opts.steps ?? 56);
  const funnel = new THREE.Mesh(hullGeo, funnelMat); funnel.renderOrder = 2; funnel.name = 'funnel'; funnel.frustumCulled = false;
  const _c = new THREE.Vector3(), _inv = new THREE.Matrix4();
  funnel.onBeforeRender = (renderer, scene, camera) => {            // per render camera (the portal uses another one)
    _c.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_inv.copy(group.matrixWorld).invert());
    funnelMat.uniforms.uInside.value = (_c.y > -1 && _c.y < TH * 1.1 + 1 && Math.hypot(_c.x, _c.z) < hullR(Math.max(_c.y, 0)) + 1.5) ? 1 : 0;
    funnelMat.uniformsNeedUpdate = true;
  };
  group.add(funnel);
  await ctx.yield();

  // ---- solid things ----
  const solidMat = makeSolidMaterial(0.72), glossMat = makeSolidMaterial(0.28), brassMat = makeSolidMaterial(0.38);
  await ctx.yield();
  const dressBag = await buildDressing(rng, P, { ropeR, floorR, curb: opts.curb !== false && opts.floor !== false }, ctx);
  await ctx.yield();
  const dressing = new THREE.Mesh(dressBag.build(), brassMat); dressing.name = 'ropes-and-plaque';
  group.add(dressing);
  await ctx.yield();

  const orbiters = [];
  const addOrbiter = (mesh, y, extraR, size) => {
    const r = Math.min(outerR(y) + extraR, 47 - size * 0.5);
    const o = { mesh, r, y, th: 0, w: clamp(13 / r, 0.24, 0.6) * rng.range(0.85, 1.15), bobA: rng.range(1, 2.6), bobP: rng() * TAU,
      axis: new THREE.Vector3(rng.gauss(), rng.gauss() * 1.5, rng.gauss()).normalize(), tum: rng.range(0.25, 0.6) * rng.sign(), tum0: rng() * TAU, yaw0: rng() * TAU, size };
    orbiters.push(o); if (mesh) group.add(mesh); return o;
  };
  const centred = (bag, scale, cx, cy, cz, mat) => { const g = bag.build(); g.translate(-cx, -cy, -cz); g.scale(scale, scale, scale); g.computeBoundingSphere(); return new THREE.Mesh(g, mat); };
  const slots = rng.shuffle([0, 1, 2, 3]); const a0 = rng() * TAU;   // heroes spread round the funnel
  const boat = addOrbiter(centred(buildBoat(rng, P), 1.3, 0, -0.3, 0, solidMat), rng.range(19, 26), rng.range(8, 11), 9); boat.th = a0 + slots[0] * TAU / 4 + rng.range(-0.3, 0.3); boat.tum *= 0.5;
  await ctx.yield();
  const piano = addOrbiter(centred(buildPiano(rng, P), 2.0, 0.75, 0.7, -1.2, glossMat), rng.range(36, 47), rng.range(7, 10), 6); piano.th = a0 + slots[1] * TAU / 4 + rng.range(-0.3, 0.3);
  await ctx.yield();
  const house = addOrbiter(centred(buildHouse(rng, P), 1.15, 0, 3.2, 0, solidMat), rng.range(58, 72), rng.range(11, 14), 12); house.th = a0 + slots[2] * TAU / 4 + rng.range(-0.3, 0.3); house.tum *= 0.35;
  house.axis.set(rng.gauss() * 0.4, 1, rng.gauss() * 0.4).normalize();
  await ctx.yield();
  const bike = addOrbiter(centred(buildBicycle(rng, P), 2.7, 0, 0.6, 0, solidMat), rng.range(82, 100), rng.range(6, 9), 5); bike.th = a0 + slots[3] * TAU / 4 + rng.range(-0.3, 0.3); bike.tum *= 1.6;
  boat.mesh.name = 'boat'; piano.mesh.name = 'piano'; house.mesh.name = 'house'; bike.mesh.name = 'bicycle';

  const NCH = 20, chairGeo = buildChair(rng, P).build(); chairGeo.translate(0, -0.5, 0); chairGeo.scale(2.4, 2.4, 2.4);
  const chairs = new THREE.InstancedMesh(chairGeo, solidMat, NCH); chairs.name = 'chairs'; chairs.frustumCulled = false;
  const chairCols = [tint(P[6], 0.7, '#7a4a26', 0.6), tint(P[0], 0.95), tint(P[3], 0.95), tint('#6a1722', 1.0), tint(P[4], 2.0), tint(P[6], 0.9)];
  const chain0 = rng() * TAU, chainStep = rng.range(0.42, 0.62);
  const chairOrb = [];
  for (let i = 0; i < NCH; i++) {
    const y = 9 + 122 * Math.pow((i + rng()) / NCH, 1.1);
    const o = addOrbiter(null, y, rng.range(4, 11), 2); o.th = chain0 + i * chainStep + rng.range(-0.25, 0.25); o.tum *= 2.2; chairOrb.push(o);
    chairs.setColorAt(i, rng.pick(chairCols).clone().multiplyScalar(rng.range(0.85, 1.1)));
  }
  group.add(chairs);
  await ctx.yield();

  // ---- balloon (never frozen) ----
  let balloon = null; const balloonTh = Math.PI * rng.range(1.08, 1.3), balloonR = 45, tether0 = rng.range(30, 40), tether = opts.balloonAt ? (opts.balloonTether ?? tether0) : tether0;
  const balloonK = opts.balloonAt ? (opts.balloonScale ?? 1) : 1;
  const balloonPos = opts.balloonAt ? P3v(opts.balloonAt[0], 0, opts.balloonAt[1]) : P3v(Math.cos(balloonTh) * balloonR, 0, Math.sin(balloonTh) * balloonR);
  if (opts.balloon !== false) {
    balloon = new THREE.Mesh(buildBalloon(rng, P, tether, opts.balloonAt ? 0.11 : 0.07).build(), solidMat); balloon.name = 'caretaker-balloon';
    balloon.position.copy(balloonPos); balloon.rotation.order = 'YXZ'; balloon.rotation.y = opts.balloonAt ? (opts.balloonYaw ?? 0) : Math.PI - balloonTh;
    balloon.scale.setScalar(balloonK); balloon.frustumCulled = false;
    group.add(balloon);
  }

  // ---- leaves, pages, motes ----
  const nStream = 1900, nLoose = 900, nPages = 520, nMotes = 700, nDust = 220, NI = nStream + nLoose + nPages + nMotes + nDust;
  const aA = new Float32Array(NI * 4), aB = new Float32Array(NI * 4);
  let ii = 0; const put = (a0_, a1, a2, type, size, hue, kind) => { aA.set([a0_, a1, a2, rng()], ii * 4); aB.set([type, size, hue, kind], ii * 4); ii++; };
  const pageShare = rng.range(0.1, 0.22);
  for (let i = 0; i < nStream; i++) { const pg = rng() < pageShare; put(rng(), Math.pow(rng(), 1.6), clamp(0.5 + rng.gauss() * 0.22, 0, 1), pg ? 1 : 0, pg ? rng.range(0.7, 1.0) : rng.range(0.45, 0.95), rng(), 0); }
  for (let i = 0; i < nLoose; i++) { const pg = rng() < 0.2; put(rng(), rng(), rng(), pg ? 1 : 0, pg ? rng.range(0.6, 0.9) : rng.range(0.4, 0.8), rng(), 1); }
  for (let i = 0; i < nPages; i++) put(Math.pow(rng(), 0.8), Math.abs(rng.gauss()) * 0.4, clamp(0.5 + rng.gauss() * 0.25, 0, 1), 1, rng.range(0.7, 1.15), rng(), 2);
  for (let i = 0; i < nMotes; i++) put(rng(), rng() * 0.6, Math.pow(rng(), 1.7), 2, rng.range(0.1, 0.24), rng(), 1);
  for (let i = 0; i < nDust; i++) put(rng(), rng() * 0.1, Math.pow(rng(), 1.2), 2, rng.range(0.13, 0.3), rng(), 1);     // fast grit right at the silhouette
  const lg = new THREE.InstancedBufferGeometry(); const quad = new THREE.PlaneGeometry(1, 1);
  lg.index = quad.index; lg.setAttribute('position', quad.attributes.position); lg.setAttribute('uv', quad.attributes.uv);
  lg.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); lg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); lg.instanceCount = NI;
  const leavesBack = new THREE.Mesh(lg, makeLeafMaterial(U, false, P)); leavesBack.frustumCulled = false; leavesBack.name = 'leaves';
  const leavesFront = new THREE.Mesh(lg, makeLeafMaterial(U, true, P)); leavesFront.frustumCulled = false; leavesFront.renderOrder = 3; leavesFront.name = 'leaves-front';
  group.add(leavesBack, leavesFront);
  await ctx.yield();

  // ---- clocks ----
  let progress = clamp(opts.progress ?? 1, 0, 1), lastT = null, phase = U.uPhase.value;
  U.uGust.value = clamp(opts.gust ?? 1, 0, 1) * 1.05;
  const _m = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _pp = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
  const place = (o, out) => {
    const th = o.th + phase * o.w, y = o.y + Math.sin(phase * 0.22 + o.bobP) * o.bobA;
    _pp.set(Math.cos(th) * o.r, y, Math.sin(th) * o.r);
    _qq.setFromAxisAngle(_up, o.yaw0 - th); _q2.setFromAxisAngle(o.axis, o.tum0 + phase * o.tum); _qq.multiply(_q2);
    return out.compose(_pp, _qq, _one);
  };
  const pose = () => {
    for (const o of orbiters) if (o.mesh) { place(o, _m); o.mesh.matrix.copy(_m); o.mesh.matrixAutoUpdate = false; o.mesh.matrixWorldNeedsUpdate = true; }
    for (let i = 0; i < NCH; i++) chairs.setMatrixAt(i, place(chairOrb[i], _m));
    chairs.instanceMatrix.needsUpdate = true;
  };
  pose();

  const P3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const fly = [P3(0, 12, 120), P3(0, 12, 92)];
  for (let i = 1; i <= 7; i++) { const t = i / 8, th = Math.PI / 2 + t * Math.PI, r = 62 + 14 * Math.pow(Math.abs(2 * t - 1), 3); fly.push(P3(Math.cos(th) * r, lerp(12, 90, smoothstep(0.02, 0.98, t)), Math.sin(th) * r)); }
  fly.push(P3(0, 90, -92), P3(0, 90, -130));

  return {
    object: group, radius: 40, height: TH, center: P3(0, 62, 0), ground: true, groundY: -0.45,
    anchors: {
      center: P3(0, 62, 0), funnelTop: P3(0, TH, 0), oculus: P3(0, room ? room.top : 220, 0),
      doorIn: { position: P3(0, 12, 90), direction: P3(0, 0, -1) },
      exitDoor: { position: P3(0, 90, -90), direction: P3(0, 0, -1) },
      portalSeat: { position: P3(0, 90, -90), facing: P3(0, 0, 1) },
      flyThrough: fly,
      viewpoints: { reveal: P3(0, 12, 130), orbitLow: P3(-52, 26, 44), orbitHigh: P3(-48, 84, -44) },
      leafEntry: { position: P3(0, 14, 98), direction: P3(-1, 0, -0.25).normalize() },
      balloon: P3(balloonPos.x, (tether + 3) * balloonK, balloonPos.z),
      floorRadius: floorR, solidRadius: 50,
    },
    hullRadiusAt: hullR,
    setProgress(u) { progress = clamp(u, 0, 1); },
    setGust(u) { U.uGust.value = clamp(u, 0, 1) * 1.05; },
    update(dt, time, camera) {
      const dT = lastT === null ? 0 : time - lastT; lastT = time;
      const e = smoothstep(0.05, 1, progress), sp = 0.02 + 0.98 * e * e;
      phase += dT * 0.8 * sp;
      U.uPhase.value = phase; U.uRise.value += dT * 7.5 * sp; U.uFlow.value += dT * sp; U.uFlutter.value += dT * sp;
      U.uBreath.value = bell(progress, 0.0, 0.42, 0.45);
      U.uBend.value.w = phase * 0.21;
      group.updateWorldMatrix(true, false); U.uInvModel.value.copy(group.matrixWorld).invert();
      pose();
      if (balloon) { balloon.rotation.z = Math.sin(time * 0.43) * 0.035; balloon.rotation.x = Math.sin(time * 0.31 + 1.3) * 0.03; balloon.scale.y = balloonK * (1 + 0.004 * Math.sin(time * 0.9)); }
    },
    dispose() { noiseTex.dispose(); },
  };
}
