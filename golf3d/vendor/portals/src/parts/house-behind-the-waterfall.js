// The House Behind the Waterfall: the set pieces. The great fall (its outer face, white with form, and its inner face, a bright
// shaking curtain), the cliff it falls from with the gallery behind the water, the cave beyond (the iron bridge over the underground
// water, the gate, the hall of stone with its furniture, the empty seat and the moon-door), the light of the cave (what comes through
// the falling water, the shafts from the roof's crack, the ring's own light), the mist, and the monkey maker.
// Everything here is built from the numbers of the place that the world hands in (PLACE below holds the same numbers for the viewer).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as T from '../kit/terrain.js';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// The place in metres: y = 0 is the lake under the fall, z grows to the south, the fall's foot is at x = 0, z = FALL.out.
export const PLACE = {
  // the fall: its lip over the lake, its breadth, where its sheet stands when it passes the gallery, the rock's line under the lip
  H: 76, W: 50, sheetZ: 11.5, lipZ: 3,
  // the gallery behind the water: floor, ceiling, half breadth, front edge and back wall
  galY: 8, galTop: 28, galHalf: 22, galFront: 7, galBack: -9,
  // the mouth of the cave in the gallery's back wall, the bridge (its line, its two ends, its deck, its breadth), the water under it
  mouthX: -5, bridgeX: -10, bridgeZ0: -22, bridgeZ1: -66, deckY: 8.6, bridgeW: 5, underY: -5.4,
  // (round 3, A5) the ramp of iron plate at the bridge's head: so many metres from the deck's edge down into the passage's floor
  headRamp: 3.1,
  // the hall: its line, its two ends, its half breadth, its crown over the floor; the step, the seat, the ring
  hallX: -10, hallZ0: -70, hallZ1: -242, hallHalf: 32, hallHigh: 34, stepH: 1.5, seatH: 6.35 /* (round 3, A8) 0.15 m lower than it was: its back's top lies 2.55 m under the way through the ring's middle */, seatBack: 9, ringR: 8.5, rimR: 11,
};

// Small noise for shaders (value noise, no sin): hash, 2D and 3D noise, a short fractal sum.
export const NOISE_GLSL = /* glsl */`
float hHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float hHash3(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hHash(i), hHash(i + vec2(1., 0.)), f.x), mix(hHash(i + vec2(0., 1.)), hHash(i + vec2(1., 1.)), f.x), f.y); }
float hNoise3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(hHash3(i), hHash3(i + vec3(1., 0., 0.)), f.x), mix(hHash3(i + vec3(0., 1., 0.)), hHash3(i + vec3(1., 1., 0.)), f.x), f.y);
  float b = mix(mix(hHash3(i + vec3(0., 0., 1.)), hHash3(i + vec3(1., 0., 1.)), f.x), mix(hHash3(i + vec3(0., 1., 1.)), hHash3(i + vec3(1., 1., 1.)), f.x), f.y);
  return mix(a, b, f.z); }
float hFbm(vec2 p) { return hNoise(p) * .5 + hNoise(p * 2.03 + 7.1) * .3 + hNoise(p * 4.1 + 3.7) * .2; }
`;

// THE AIR BELONGS TO THE PLACE A THING STANDS IN (round 3, A6). The scene's fog is the day's and nothing writes it by where the eye
// is. What stands behind the fall's sheet wears the cave's own air (uCaveAir: its colour and its density) as its own constants;
// what goes or lies on both sides of the sheet wears the two mixed by the lit point's OWN z: the day's air to 1 m behind the
// sheet's plane, the cave's from 16 m behind it (airBehind). For a fragment shader, after the kit's fog lines:
//   airFog(colour, k): the colour in the air, k = 0 the day's, 1 the cave's;  airAmt(k): how much of the air lies before it.
export const AIR_GLSL = /* glsl */`
uniform vec4 uCaveAir;
float airBehind(float z, float sheetZ) { return 1. - smoothstep(sheetZ - 16., sheetZ - 1., z); }
float airAmt(float k) {
#if defined(USE_FOG) && defined(FOG_EXP2)
  float d = mix(fogDensity, uCaveAir.w, k);
  return 1. - exp(-d * d * vFogDepth * vFogDepth);
#else
  return fxFog();
#endif
}
vec3 airFog(vec3 c, float k) {
#if defined(USE_FOG) && defined(FOG_EXP2)
  return mix(c, mix(fogColor, uCaveAir.rgb, k), airAmt(k));
#else
  return fxApplyFog(c);
#endif
}
`;
const NO_AIR = () => ({ value: new THREE.Vector4(0, 0, 0, 0) });

// A mesh builder: smooth grids, boxes, lathes and tubes merged into one indexed geometry with position, normal, colour and a kind
// (0 stone, 1 floor, 2 iron, 3 soot, 4 the bright slot of the roof's crack).
export function makeBuilder(mirror = false) {
  const P = [], N = [], C = [], K = [], I = [];
  const m = new THREE.Matrix4(), v = new THREE.Vector3(), n3 = new THREE.Matrix3();
  let hasM = false;
  const api = {
    get triangles() { return I.length / 3; },
    // every part added after this call is moved by: a turn about y, then a shift
    at(x, y, z, rotY = 0, s = 1) { m.makeRotationY(rotY); m.scale(v.set(s, s, s)); m.setPosition(x, y, z); n3.getNormalMatrix(m); hasM = true; return api; },
    home() { hasM = false; return api; },
    vert(x, y, z, nx, ny, nz, col, kind = 0) {
      if (hasM) { v.set(x, y, z).applyMatrix4(m); x = v.x; y = v.y; z = v.z; v.set(nx, ny, nz).applyMatrix3(n3).normalize(); nx = v.x; ny = v.y; nz = v.z; }
      if (mirror) { x = -x; nx = -nx; }
      P.push(x, y, z); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); K.push(kind); return P.length / 3 - 1;
    },
    // a grid of nu by nv cells over fn(u, v) -> [x, y, z]; normals from the grid's own neighbours; colour from colFn(point, normal, u, v);
    // keep(u, v) false leaves a cell out (a hole). flip turns the faces round.
    grid(nu, nv, fn, colFn, { flip = false, kind = 0, keep = null } = {}) {
      const pts = [], base = P.length / 3;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(fn(i / nu, j / nv));
      const at = (i, j) => pts[clamp(j, 0, nv) * (nu + 1) + clamp(i, 0, nu)];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1), p = at(i, j);
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = d[0] - c[0], wy = d[1] - c[1], wz = d[2] - c[2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l; if (flip) { nx = -nx; ny = -ny; nz = -nz; }
        const nn = [nx, ny, nz];
        api.vert(p[0], p[1], p[2], nx, ny, nz, colFn(p, nn, i / nu, j / nv), kind);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        if (keep && !keep((i + 0.5) / nu, (j + 0.5) / nv)) continue;
        const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
        if (flip) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c);
      }
      return api;
    },
    // a box with flat faces: centre, sizes, colour; top lightens, underside darkens a little
    box(cx, cy, cz, sx, sy, sz, col, kind = 0) {
      const c0 = [cx, cy, cz], h = [sx / 2, sy / 2, sz / 2];
      for (let a = 0; a < 3; a++) for (const s of [1, -1]) {
        const u = (a + 1) % 3, w = (a + 2) % 3, nn = [0, 0, 0]; nn[a] = s;
        const k = a === 1 ? (s > 0 ? 1.08 : 0.7) : 0.94, c = [col[0] * k, col[1] * k, col[2] * k], q = [];
        for (const [su, sw] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const p = [c0[0], c0[1], c0[2]]; p[a] += s * h[a]; p[u] += su * h[u]; p[w] += sw * h[w];
          q.push(api.vert(p[0], p[1], p[2], nn[0], nn[1], nn[2], c, kind));
        }
        if (s > 0) I.push(q[0], q[1], q[2], q[1], q[3], q[2]); else I.push(q[0], q[2], q[1], q[1], q[2], q[3]);
      }
      return api;
    },
    // a lathe about the y axis through (cx, cz): profile [[r, y], ...] from bottom to top, with sides round
    lathe(cx, cy, cz, profile, sides, col, kind = 0, shade = null) {
      const n = profile.length - 1;
      return api.grid(sides, n, (u, t) => { const k = Math.min(n, Math.round(t * n)), a = u * TAU; return [cx + Math.cos(a) * profile[k][0], cy + profile[k][1], cz - Math.sin(a) * profile[k][0]]; },
        (p, nn, u, t) => (shade ? shade(col, t) : col), { kind });
    },
    // a tube along points [[x, y, z], ...] with a radius (number or function of 0..1)
    tube(points, radius, sides, col, kind = 0) {
      const n = points.length - 1, rf = typeof radius === 'function' ? radius : () => radius;
      const fr = points.map((p, i) => { const a = points[Math.max(0, i - 1)], b = points[Math.min(n, i + 1)]; const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        const s = new THREE.Vector3().crossVectors(t, Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize(); return { s, w: new THREE.Vector3().crossVectors(s, t) }; });
      return api.grid(sides, n, (u, t) => { const k = Math.min(n, Math.round(t * n)), a = u * TAU, r = rf(k / n), f = fr[k], c = Math.cos(a) * r, d = -Math.sin(a) * r;
        return [points[k][0] + f.s.x * c + f.w.x * d, points[k][1] + f.s.y * c + f.w.y * d, points[k][2] + f.s.z * c + f.w.z * d]; }, () => col, { kind });
    },
    build(withKind = true) {
      if (mirror) for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); if (withKind) g.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere(); return g;
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ the monkey
// A small macaque-like monkey, about 0.55 m from rump to shoulder and 0.42 m at the shoulder, standing on four legs along +z.
// Every vertex carries the part it belongs to (0 trunk, 1 head, 2 and 3 the arms, 4 and 5 the legs, 6 the tail, 7 a peach, 8 a bowl),
// how far down its limb it lies (0 at the joint, 1 at the paw) and its joint; the shader poses it (running, leaping, sitting).
const EYE = lin('#1a120c'), FUR = lin('#b5793f'), FUR_DARK = lin('#8a5a30'), FUR_PALE = lin('#d6a868'), SKIN = lin('#e8c08a'), PEACH = lin('#f08a4b'), BLUSH = lin('#f4a7b9'), BOWL = lin('#8f9c94');
export const MONKEY = { hipY: 0.40, hipZ: -0.19, shoulderZ: 0.19, limb: 0.40, neck: [0, 0.47, 0.25], tail: [0, 0.44, -0.25] };
// far = true gives the same animal in fewer faces (no ears, eyes or muzzle, three-sided limbs, a shorter mesh of the tail), with the same
// parts, weights and joints, so the same shader poses it: it is what a troop's band wears while every one of its members is far off.
function monkeyGeometry(far = false) {
  const P = [], N = [], C = [], B = [], V = [], I = [];
  const vert = (p, n, c, part, w, pivot) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); B.push(part, w); V.push(pivot[0], pivot[1], pivot[2]); return P.length / 3 - 1; };
  const quads = (base, nu, nv, wrap) => { const row = wrap ? nu : nu + 1;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * row + i, b = base + j * row + (i + 1) % row, c = a + row, d = b + row; I.push(a, b, c, b, d, c); } };
  // an ellipsoid: nu round its long axis (z), nv along it; colFn(direction) gives the colour
  const blob = (c, r, nu, nv, colFn, part, pivot, w = 0) => { const base = P.length / 3;
    for (let j = 0; j <= nv; j++) { const t = j / nv, a = Math.PI * t, s = Math.sin(a), z = -Math.cos(a);
      for (let i = 0; i < nu; i++) { const b = TAU * i / nu, d = [Math.cos(b) * s, Math.sin(b) * s, z];
        const n = [d[0] / r[0], d[1] / r[1], d[2] / r[2]], l = Math.hypot(n[0], n[1], n[2]);
        vert([c[0] + d[0] * r[0], c[1] + d[1] * r[1], c[2] + d[2] * r[2]], [n[0] / l, n[1] / l, n[2] / l], colFn(d), part, w, pivot); } }
    quads(base, nu, nv, true); };
  // a limb hanging down from its joint: rings of nu, the weight running 0 to 1; the last ring is the paw (pale)
  const limb = (j, len, r0, r1, nu, nv, part, x) => { const base = P.length / 3;
    // (B5: the last ring is the paw: broad and long, flat under the wrist, pale)
    for (let k = 0; k <= nv; k++) { const t = k / nv, paw = k === nv, r = lerp(r0, r1, t), y = j[1] - len * t;
      for (let i = 0; i < nu; i++) { const a = TAU * i / nu, d = [Math.cos(a), 0, Math.sin(a)];
        vert([j[0] + d[0] * r * (paw ? 1.7 : 1), y, j[2] + d[2] * r * (paw ? 2.3 : 1) + (paw ? 0.045 : 0)], d, t > 0.8 ? SKIN : mix3(FUR, FUR_DARK, 0.3 * t), part, t, j); } }
    quads(base, nu, nv, true);
    const tip = vert([j[0], j[1] - len - 0.012, j[2] + 0.045], [0, -1, 0], SKIN, part, 1, j), last = base + nv * nu;
    for (let i = 0; i < nu; i++) I.push(last + i, tip, last + (i + 1) % nu); void x; };
  const M = MONKEY, hip = [0, M.hipY, M.hipZ];
  // trunk: back darker, belly paler
  blob([0, 0.41, 0], [0.105, 0.115, 0.29], far ? 5 : 7, far ? 3 : 5, (d) => (d[1] > 0.3 ? mix3(FUR, FUR_DARK, 0.45) : d[1] < -0.4 ? FUR_PALE : FUR), 0, hip);
  // head, with a pale face on its front, a muzzle and two ears
  const neck = M.neck, hc = [0, 0.55, 0.34];
  blob(hc, [0.1, 0.1, 0.105], far ? 5 : 7, far ? 3 : 5, (d) => (d[2] > 0.45 && d[1] < 0.55 ? SKIN : d[1] > 0.5 ? FUR_DARK : FUR), 1, neck);
  if (!far) { blob([0, 0.522, 0.43], [0.052, 0.045, 0.05], 5, 2, () => mix3(SKIN, BLUSH, 0.25), 1, neck);
    for (const s of [-1, 1]) blob([s * 0.1, 0.585, 0.325], [0.022, 0.04, 0.035], 3, 2, () => SKIN, 1, neck);
    // (B5) two dark eyes set in the pale face under the brow
    for (const s of [-1, 1]) blob([s * 0.04, 0.572, 0.428], [0.017, 0.019, 0.012], 3, 2, () => EYE, 1, neck); }
  // arms and legs
  for (const s of [-1, 1]) limb([s * 0.075, M.hipY, M.shoulderZ], M.limb, 0.042, 0.027, far ? 3 : 4, far ? 2 : 3, s < 0 ? 2 : 3, s);
  for (const s of [-1, 1]) limb([s * 0.08, M.hipY, M.hipZ], M.limb, 0.05, 0.03, far ? 3 : 4, far ? 2 : 3, s < 0 ? 4 : 5, s);
  // tail: a thin tube lying back from the rump, weight 0 to 1 along it
  { const base = P.length / 3, t0 = M.tail, nv = far ? 4 : 8, nu = 3;
    for (let k = 0; k <= nv; k++) { const t = k / nv, r = lerp(0.034, 0.017, t);
      for (let i = 0; i < nu; i++) { const a = TAU * i / nu, d = [Math.cos(a), Math.sin(a), 0]; vert([t0[0] + d[0] * r, t0[1] + d[1] * r, t0[2] - 0.56 * t], d, mix3(FUR, FUR_DARK, 0.5), 6, t, t0); } }
    quads(base, nu, nv, true); }
  // what it may carry before its face: a peach (part 7) or a stone bowl (part 8); the shader shows one or neither
  blob([0, 0.5, 0.5], [0.062, 0.062, 0.062], 4, 2, (d) => (d[0] > 0.2 ? mix3(PEACH, BLUSH, 0.6) : PEACH), 7, neck);
  { const base = P.length / 3, c = [0, 0.5, 0.52], nu = 6;
    for (const [r, y] of far ? [[0.035, -0.045], [0.105, 0.03]] : [[0.035, -0.045], [0.1, 0.0], [0.105, 0.03]]) for (let i = 0; i < nu; i++) { const a = TAU * i / nu, d = [Math.cos(a), 0.3, Math.sin(a)]; vert([c[0] + d[0] * r, c[1] + y, c[2] + d[2] * r], d, BOWL, 8, 0, neck); }
    quads(base, nu, far ? 1 : 2, true);
    const mid = vert([c[0], c[1] - 0.02, c[2]], [0, 1, 0], [BOWL[0] * 0.55, BOWL[1] * 0.55, BOWL[2] * 0.55], 8, 0, neck), top = base + (far ? 1 : 2) * nu;
    for (let i = 0; i < nu; i++) I.push(top + i, top + (i + 1) % nu, mid); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aBone', new THREE.Float32BufferAttribute(B, 2)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(V, 3));
  g.setIndex(new THREE.Uint16BufferAttribute(I, 1));
  return g;
}

// Where a monkey is and what it does, from its own numbers and the world's clock alone (shared by its body and its ground shadow): nothing
// of it reads the metres flown or where the eye is (but the reach of sight below, a make by distance).
// iA, iB hold its course by its mode (iC.x): 0 it sits at a place (and may bounce there on the clock); 1 it runs rounds about a centre on the
// clock, sitting a share of each round; 2 it runs a bank's trail to and fro along its own lane on the clock; 3 it leaps from the rock in
// through the sheet, runs to a place in the gallery, rests, and comes out again the same way, a round on the clock (one body); 4 it runs
// in over the bridge to a place in the hall and out again, a round on the clock; 5 it goes to and fro along a line on the clock; 6 it
// swings on a vine on the clock. iC = mode, phase, size, what it carries; iE = arc, look, sun.
// A trail (mode 2): iA = the metres of the stream's own length at its lane's lower and upper end, metres beyond the water's edge at the
// lower and at the upper end (the sign names the bank); iB.x = its ground speed in metres a second, iB.y the share of a crossing it rests.
const MONKEY_PLACE = /* glsl */`
attribute vec4 iA, iB, iC, iD, iE;
uniform float uTime, uSheetZ; uniform sampler2D tGround, tCourse; uniform vec4 uGBox, uWayA, uWayB, uArc; uniform vec2 uCBox;
const float STRIDE = 2.0;
vec2 groundAt(vec2 xz) { return textureLod(tGround, (xz - uGBox.xy) * uGBox.zw, 0.).rg; }
vec4 courseAt(float z) { return textureLod(tCourse, vec2((z - uCBox.x) * uCBox.y, .25), 0.); }
// the z at which the stream's course has run s metres of its own length from its lower end (the course picture's second row)
float arcZ(float s) { return uArc.z + s * uArc.w + textureLod(tCourse, vec2(s * uArc.x + uArc.y, .75), 0.).x; }
// a trail's x at z: so many metres beyond the water's edge, on the bank the lane's sign names
float laneX(float z, float lane) { vec4 c = courseAt(z); return c.x + sign(lane) * (c.z + abs(lane)) * c.y; }
vec3 rotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 rotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
struct Mk { vec3 pos; float yaw, sit, air, gait, pitch, lift, show, sun, cave; };
Mk monkeyPlace() {
  Mk m; float mode = iC.x, ph = iC.y;
  m.pos = iA.xyz; m.yaw = iA.w; m.sit = 1.; m.air = 0.; m.gait = 0.; m.pitch = 0.; m.lift = 0.; m.show = 1.; m.sun = iE.z;
  if (mode < .5) {
    float b = iB.w;
    if (b > 0.) { float t = fract(uTime * iB.z + ph); m.lift = b * 4. * t * (1. - t); m.sit = 1. - .75 * smoothstep(0., .3, t) * (1. - smoothstep(.7, 1., t)); m.air = .6 * (1. - m.sit); }
  } else if (mode < 1.5) {
    float r = max(iB.x, .3), dwell = clamp(iB.z, 0., .9), period = 3.883 * r / max(abs(iB.y), .2) / (1. - dwell);
    float turns = uTime / period + ph, k = floor(turns), f = fract(turns), e = clamp((f - dwell) / (1. - dwell), 0., 1.);
    e = e * e * (3. - 2. * e);
    float a = (k + e) * 3.883 * sign(iB.y) + ph * 40.;
    m.pos.xz = iA.xz + r * vec2(cos(a), sin(a));
    vec2 vel = vec2(-sin(a), cos(a)) * sign(iB.y);
    m.yaw = atan(vel.x, vel.y);
    if (iA.y < -500.) { vec2 g = groundAt(m.pos.xz); m.pos.y = g.x; m.sun = g.y; vec2 g2 = groundAt(m.pos.xz + vel * .7); m.pitch = -atan((g2.x - g.x) / .7); }
    m.sit = 1. - smoothstep(.02, .1, e) * (1. - smoothstep(.9, .98, e));
    m.gait = (k + e) * 3.883 * r / STRIDE;
    m.lift = iB.w * abs(sin(m.gait * 3.1416)) * (1. - m.sit);
  } else if (mode < 2.5) {
    // a trail (a habit on the clock): the runner goes to and fro along its own lane, between the stream's own metres iA.x (the lane's lower
    // end) and iA.y (its upper end), at its own ground speed (iB.x, metres a second), resting a share iB.y of each crossing at the end it
    // has reached, where it sits and turns about; every phase reads, and nothing of it knows where the eye is
    float len = max(iA.x - iA.y, 1.), rest = clamp(iB.y, 0., .8), period = 2. * len / max(iB.x, .5) / (1. - rest);
    float t = fract(uTime / period + ph) * 2., back = step(1., t), e = clamp((t - back - rest) / (1. - rest), 0., 1.), hd = 1. - 2. * back;
    float arc = iA.x - (back > .5 ? 1. - e : e) * len, z = arcZ(arc), arrive = 1. - smoothstep(iA.y, iA.y + 14., arc);
    float x = laneX(z, mix(iA.z, iA.w, arrive)), arc2 = arc - .8, z2 = arcZ(arc2), a2 = 1. - smoothstep(iA.y, iA.y + 14., arc2), x2 = laneX(z2, mix(iA.z, iA.w, a2));
    vec2 g = groundAt(vec2(x, z)), g2 = groundAt(vec2(x2, z2));
    // (its heading up the stream, turned about while it rests: half a turn at each end, so it sets off the way it has come)
    m.pos = vec3(x, g.x, z); m.sun = g.y; m.yaw = atan(x2 - x, z2 - z) + 3.1416 * ((1. - back) + smoothstep(0., rest, t - back));
    float go = smoothstep(.4, 4., arc - iA.y) * smoothstep(.4, 4., iA.x - arc);
    m.pitch = -atan((g2.x - g.x) / .8) * hd * go;
    m.sit = 1. - go; m.gait = (iA.x - arc) / STRIDE + ph;
    m.lift = .1 * abs(sin(m.gait * 3.1416)) * go;
  } else if (mode < 3.5) {
    // a leaper's round (a habit on the clock), one body: it sits at its place on the rock (iA.xyz), leaps in through the sheet to its landing
    // on the gallery's floor (iB.xy = x, z; uWayB.w the floor's height) at iD.w metres a second, runs on to its own place (iB.zw) at iE.w
    // metres a second, rests there, runs back, leaps out again to its seat and rests; the whole round takes iA.w seconds and what is left
    // of them after the going is rested, a share on the rock and the remainder in the gallery; every phase reads
    vec3 a = iA.xyz, b = vec3(iB.x, uWayB.w, iB.y), c = vec3(iB.z, uWayB.w, iB.w);
    float lenL = max(distance(a.xz, b.xz), .5), lenR = max(distance(b.xz, c.xz), .01), arc = iE.x, tL = lenL / max(iD.w, 1.), tR = lenR / max(iE.w, .5);
    float idle = max(iA.w - 2. * (tL + tR), .2), r1 = idle * (.35 + .3 * fract(ph * 5.7)), r2 = idle - r1, t = fract(uTime / iA.w + ph) * iA.w;
    // q: the share of the leap done (0 on the rock, 1 on the floor); dr: metres run from the landing; turn: half turns made (0 going in, 1 coming out)
    float q = 1., dr = 0., turn = 0., run = 1.;
    if (t < r1) { q = 0.; run = 0.; turn = 1. + smoothstep(0., r1, t); }
    else if (t < r1 + tL) { q = (t - r1) / tL; run = 0.; }
    else if (t < r1 + tL + tR) dr = (t - r1 - tL) * iE.w;
    else if (t < r1 + tL + tR + r2) { dr = lenR; turn = smoothstep(0., r2, t - r1 - tL - tR); }
    else if (t < r1 + tL + 2. * tR + r2) { dr = lenR - (t - r1 - tL - tR - r2) * iE.w; turn = 1.; }
    else { q = clamp(1. - (t - r1 - tL - 2. * tR - r2) / tL, 0., 1.); run = 0.; turn = 1.; }
    float hd = 1. - 2. * step(.5, turn) * (1. - step(1.5, turn));
    if (run < .5) { float moving = smoothstep(0., .04, q) * (1. - smoothstep(.96, 1., q));
      m.pos = mix(a, b, q); m.yaw = atan(b.x - a.x, b.z - a.z) + 3.1416 * turn; m.lift = arc * 4. * q * (1. - q); m.air = moving; m.sit = 1. - moving;
      m.pitch = -atan(arc * 4. * (1. - 2. * q) / lenL) * hd * moving;
    } else { float moving = smoothstep(0., .8, dr) * (1. - smoothstep(lenR - .6, lenR, dr));
      vec2 dir = normalize(c.xz - b.xz + vec2(1e-4));
      m.pos = mix(b, c, dr / lenR); m.yaw = atan(dir.x, dir.y) + 3.1416 * turn; m.sit = 1. - moving; m.gait = dr / STRIDE + ph;
      m.lift = (.1 + .16 * fract(ph * 7.3)) * abs(sin(m.gait * 3.1416)) * moving; }
  } else if (mode > 5.5) {
    // a swing (mode 6, on the clock): it hangs by its hands from a vine fixed at iA.xyz, iB.z m long, and swings in the upright plane along
    // iB.xy as a pendulum of that length does (period 2 pi sqrt(length / g)), iB.w radians to either hand; every phase reads
    float len = max(iB.z, 1.), th = iB.w * sin(uTime * sqrt(9.81 / len) + ph * 6.2832), reach = len + .85 * iC.z;
    vec3 at = iA.xyz + reach * vec3(iB.x * sin(th), -cos(th), iB.y * sin(th)); vec2 g = groundAt(at.xz);
    m.pos = vec3(at.x, g.x, at.z); m.lift = at.y - g.x; m.sun = g.y; m.yaw = atan(iB.x, iB.y); m.sit = 0.; m.air = 1.; m.pitch = -1.25 - th;
  } else if (mode > 4.5) {
    // to and fro along a line (mode 5, on the clock): from iA.xyz to (iB.x, iE.x, iB.y) and back at iB.z metres a second, resting a share
    // iB.w of each crossing at the end it has reached; the line sags iE.w m in its middle (a log's bow); every phase reads
    vec3 a = iA.xyz, b = vec3(iB.x, iE.x, iB.y); float len = max(distance(a.xz, b.xz), .5), rest = clamp(iB.w, 0., .8), period = 2. * len / max(iB.z, .2) / (1. - rest);
    float t = fract(uTime / period + ph) * 2., back = step(1., t), e = clamp((t - back - rest) / (1. - rest), 0., 1.), go = smoothstep(0., .08, e) * (1. - smoothstep(.92, 1., e));
    vec2 dir = normalize(b.xz - a.xz + vec2(1e-4)) * (1. - 2. * back);
    float along = back > .5 ? 1. - e : e;
    m.pos = mix(a, b, along); m.pos.y -= iE.w * sin(3.1416 * along); m.yaw = atan(dir.x, dir.y); m.sit = 1. - go; m.gait = e * len / STRIDE + ph; m.lift = .08 * abs(sin(m.gait * 3.1416)) * go;
  } else {
    // one runner's round (a habit on the clock): from its place in the gallery to the bridge's head, over the bridge, to the gate, to its own
    // place in the hall, a rest there, and back out the same way to a rest in the gallery (uWayA: the bridge's x, the z of its head and
    // foot, the deck's height; uWayB: the gate's x and z, the floor's height, the gallery's height; the head is the foot of the ramp
    // before the deck). iB.z is its ground speed in metres a
    // second, iB.w the share of each crossing it rests at the end it has reached. Going in it keeps iA.z metres to one hand of the
    // bridge's and the gate's middle, coming out the same to the other hand, so none meets another head on; every phase reads.
    float rest = clamp(iB.w, .02, .8), lane = iA.z;
    vec3 w0 = vec3(iA.x, uWayB.w, iA.y), w4 = vec3(iB.x, uWayB.z, iB.y), c1 = vec3(uWayA.x, uWayA.w, uWayA.y), c2 = vec3(uWayA.x, uWayA.w, uWayA.z), c3 = vec3(uWayB.x, uWayB.z, uWayB.y);
    // (the round's time is taken on the middle line, the same for both hands)
    float period = 2. * (distance(w0, c1) + distance(c1, c2) + distance(c2, c3) + max(distance(c3, w4), .01)) / max(iB.z, .5) / (1. - rest);
    float t = fract(uTime / period + ph) * 2., back = step(1., t), e = clamp((t - back - rest) / (1. - rest), 0., 1.), hd = 1. - 2. * back;
    vec3 w1 = c1 + vec3(lane * hd, 0., 0.), w2 = c2 + vec3(lane * hd, 0., 0.), w3 = c3 + vec3(lane * hd, 0., 0.);
    float l1 = distance(w0, w1), l2 = distance(w1, w2), l3 = distance(w2, w3), l4 = max(distance(w3, w4), .01), tot = l1 + l2 + l3 + l4;
    float d = (back > .5 ? 1. - e : e) * tot, sg = d, lg = l1; vec3 a = w0, b = w1;
    if (d > l1 + l2 + l3) { a = w3; b = w4; sg = d - l1 - l2 - l3; lg = l4; } else if (d > l1 + l2) { a = w2; b = w3; sg = d - l1 - l2; lg = l3; } else if (d > l1) { a = w1; b = w2; sg = d - l1; lg = l2; }
    vec2 dir = normalize(b.xz - a.xz + vec2(1e-4)), prp = vec2(dir.y, -dir.x);
    float moving = smoothstep(0., .6, d) * (1. - smoothstep(tot - .6, tot, d));
    float wv = d * .45 + ph * 40., wd = .42 * moving * smoothstep(0., 2., sg) * (1. - smoothstep(lg - 2., lg, sg)); vec2 vel = (dir + prp * (.45 * wd * cos(wv))) * hd;
    // (while it rests it turns about: half a turn at each end, so it sets off the way it has come)
    m.pos = mix(a, b, clamp(sg / max(lg, .01), 0., 1.)); m.pos.xz += prp * (wd * sin(wv)); m.yaw = atan(vel.x, vel.y) + 3.1416 * (1. - smoothstep(0., rest, t - back));
    // (round 3, A5) its feet are on the floor as built: the house's troop is given the picture of the house's own floors (the gallery's
    // and the passage's floor, the ramp, the deck, the gate's threshold, the hall's floor) in the place of the land's
    m.pos.y = groundAt(m.pos.xz).x;
    m.sit = 1. - moving; m.gait = d / STRIDE + ph; m.lift = (.1 + .16 * fract(ph * 7.3)) * abs(sin(m.gait * 3.1416)) * moving;
  }
  // behind the fall's sheet it is lit by the cave's light (the two lights meet across 2 m at the sheet)
  m.cave = 1. - smoothstep(uSheetZ - 1., uSheetZ + 1., m.pos.z);
  // (round 3, A13) no monkey sinks away by the eye's distance: a band is drawn or is not by the world's sight test
  return m;
}
`;
// The pose: joints turned about x (a positive angle swings a paw back, lowers the head, raises the tail), blended between the run, the leap
// and the sit; then the trunk tipped about the hips, the hips lowered, and the whole animal sized, pitched, turned and set down.
// B5, one who sits: the back is bent (the trunk's fore half, with the head and the arms, curls forward about the middle of the spine),
// the haunches are broad and the knees stand out to either hand, the head is turned its own way and goes on turning; the tail lies
// behind and curls up at its tip, the curl opening and closing and swaying on the clock. In a run the tail is carried up in a bow; in a
// leap it streams behind in a moving curve.
const MONKEY_POSE = /* glsl */`
attribute vec2 aBone; attribute vec3 aPivot;
void monkeyPose(inout vec3 p, inout vec3 n, Mk m) {
  float part = aBone.x, w = aBone.y, ph = iC.y, c = m.gait * 6.2832, right = step(2.5, part) * step(part, 3.5) + step(4.5, part) * step(part, 5.5);
  c += right * .45;
  float fid = sin(uTime * .9 + ph * 40.), scratch = smoothstep(.72, .95, sin(uTime * .55 + ph * 17.)) * m.sit * step(2.5, part) * step(part, 3.5);
  float tau = mix(mix(.16 * sin(c + .9), -1.05 + .04 * fid, m.sit), -.05, m.air), seated = m.sit * (1. - m.air), hunch = (.42 + .04 * fid) * seated;
  vec3 hip = vec3(0., ${MONKEY.hipY}, ${MONKEY.hipZ});
  if (part > 1.5 && part < 5.5) {
    bool arm = part < 3.5;
    float up = arm ? mix(mix(.75 * sin(c), .85 - 2.3 * scratch, m.sit), -1.0, m.air) : mix(mix(.85 * sin(c + 2.2), -1.9, m.sit), -.5, m.air);
    float bend = arm ? mix(mix(-.9 * max(0., sin(c + 1.2)), -.25 - 1.5 * scratch, m.sit), -.45, m.air) : mix(mix(max(0., sin(c + 4.1)), 2.1, m.sit), 1.7, m.air);
    vec3 q = p - aPivot, kn = vec3(0., -${(MONKEY.limb / 2).toFixed(3)}, 0.);
    float lw = smoothstep(.4, .6, w);
    q = mix(q, rotX(q - kn, bend) + kn, lw); n = mix(n, rotX(n, bend), lw);
    p = aPivot + rotX(q, up); n = rotX(n, up);
    if (!arm) { float splay = sign(aPivot.x) * .75 * seated; p = aPivot + rotY(p - aPivot, splay); n = rotY(n, splay); p.x += sign(aPivot.x) * .03 * seated; }
  } else if (part > .5 && part < 1.5 || part > 6.5) {
    float nod = -tau * .85 - hunch * .75 + (iE.y + .08 * fid) * m.sit - .25 * m.air, turn = (.45 * sin(uTime * .7 + ph * 23.) + .55 * sin(ph * 57.)) * m.sit;
    vec3 q = rotY(p - aPivot, turn); n = rotY(n, turn);
    p = aPivot + rotX(q, nod); n = rotX(n, nod);
    if ((part > 6.5 && part < 7.5 && abs(iC.w - 1.) > .5) || (part > 7.5 && abs(iC.w - 2.) > .5)) p = aPivot;
  } else if (part > 5.5) {
    float sway = sin(uTime * 1.3 + ph * 31.), curl = mix(mix(1.1 + .3 * sin(c * .5), 2.3 + .9 * sway, m.sit), 1.3 + .8 * sin(uTime * 6. + ph * 9. - w * 3.), m.air);
    float lift = mix(mix(.6 + .2 * sin(c), .12 - tau, m.sit), .3, m.air) + w * w * curl, side2 = w * .7 * sin(uTime * .8 + ph * 29.) * m.sit;
    vec3 q = rotY(rotX(p - aPivot, lift), side2); p = aPivot + q; n = rotY(rotX(n, lift), side2);
  } else {
    // the trunk: broad haunches where it sits
    p.x *= 1. + .4 * seated * (1. - smoothstep(-.22, .04, p.z));
  }
  // the bent back: the fore half of the trunk, the head, the arms and what is carried curl forward about the middle of the spine
  if (part < 3.5 || part > 6.5) { vec3 sp = vec3(0., .41, 0.); float hw = part < .5 ? smoothstep(-.06, .2, p.z) : 1.; p = sp + rotX(p - sp, hunch * hw); n = rotX(n, hunch * hw); }
  if (part < 3.5 || part > 5.5) { p = hip + rotX(p - hip, tau); n = rotX(n, tau); }
  p.y -= .24 * m.sit * (1. - m.air);
  p *= iC.z * m.show;
  p = rotX(p, m.pitch); n = rotX(n, m.pitch);
  p = rotY(p, m.yaw); n = rotY(n, m.yaw);
  p += m.pos + vec3(0., m.lift, 0.);
}
`;

// THE DRAWN BODY'S TRUE REACH (round 3, A2): how far a monkey's body reaches in each of its ways of holding itself, READ FROM THE MAKE:
// every vertex of the shape above is posed by the pose's own law (posePoint: MONKEY_POSE line for line, in the place's numbers) over
// the whole of what the clock can make of it (every phase of the stride, the fidget, the scratch, the head's turn and look, the tail's
// sway and curl, the blends between sitting, going and the air), at a size of 1, about the point it stands on. Kept for each way:
// its foot, its top and how far out it reaches from the upright through the point it stands on, for every pitch the ground, a leap
// or a swing can give it.
//   sit: one who sits still; hop: one who hops or bounces at its place; run: one who goes on its feet, with its starting and stopping
//   and its rests; leap: a leaper between the rock and the floor; swing: one who hangs by its hands.
// monkeyBody(way, size, pitch0, pitch1) gives [foot, top, rho] in metres about the point it stands on (the stride's or the hop's own
// lift is not in it): the upright round body that holds every vertex for every pitch between the two.
const mixN = (a, b, t) => a + (b - a) * t, stepN = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function posePoint(o, x, y, z, part, w, px, py, pz, sit, air, q) {
  const M = MONKEY, mix = mixN, ss = stepN;
  const right = part === 3 || part === 5 ? 1 : 0, c = q.c + right * 0.45, fid = q.fid, scratch = q.scratch * sit * (part === 3 ? 1 : 0);
  const tau = mix(mix(0.16 * Math.sin(c + 0.9), -1.05 + 0.04 * fid, sit), -0.05, air), seated = sit * (1 - air), hunch = (0.42 + 0.04 * fid) * seated;
  let cc, sn, t;
  if (part > 1.5 && part < 5.5) { const arm = part < 3.5;
    const up = arm ? mix(mix(0.75 * Math.sin(c), 0.85 - 2.3 * scratch, sit), -1.0, air) : mix(mix(0.85 * Math.sin(c + 2.2), -1.9, sit), -0.5, air);
    const bend = arm ? mix(mix(-0.9 * Math.max(0, Math.sin(c + 1.2)), -0.25 - 1.5 * scratch, sit), -0.45, air) : mix(mix(Math.max(0, Math.sin(c + 4.1)), 2.1, sit), 1.7, air);
    let qy = y - py, qz = z - pz; const kn = -M.limb / 2, lw = ss(0.4, 0.6, w);
    // (the knee, then the joint: turned about x, y' = y cos a - z sin a, z' = y sin a + z cos a)
    cc = Math.cos(bend); sn = Math.sin(bend); t = qy - kn; const by = t * cc - qz * sn + kn, bz = t * sn + qz * cc; qy = mix(qy, by, lw); qz = mix(qz, bz, lw);
    cc = Math.cos(up); sn = Math.sin(up); y = py + qy * cc - qz * sn; z = pz + qy * sn + qz * cc;
    // (the knees out to either hand: turned about y, x' = x cos a + z sin a, z' = -x sin a + z cos a)
    if (!arm) { const sg = Math.sign(px), splay = sg * 0.75 * seated; cc = Math.cos(splay); sn = Math.sin(splay); const dx = x - px, dz = z - pz; x = px + dx * cc + dz * sn + sg * 0.03 * seated; z = pz - dx * sn + dz * cc; }
  } else if (part === 1 || part > 6.5) { const nod = -tau * 0.85 - hunch * 0.75 + (q.look + 0.08 * fid) * sit - 0.25 * air, turn = q.turn * sit;
    cc = Math.cos(turn); sn = Math.sin(turn); const dx = x - px, dz = z - pz, qx = dx * cc + dz * sn, qz = -dx * sn + dz * cc, qy = y - py;
    cc = Math.cos(nod); sn = Math.sin(nod); x = px + qx; y = py + qy * cc - qz * sn; z = pz + qy * sn + qz * cc;
  } else if (part === 6) { const curl = mix(mix(1.1 + 0.3 * Math.sin(c * 0.5), 2.3 + 0.9 * q.sway, sit), 1.3 + 0.8 * Math.sin(q.theta - w * 3), air);
    const lift = mix(mix(0.6 + 0.2 * Math.sin(c), 0.12 - tau, sit), 0.3, air) + w * w * curl, side2 = w * 0.7 * q.side * sit;
    cc = Math.cos(lift); sn = Math.sin(lift); const dy = y - py, dz = z - pz, qy = dy * cc - dz * sn, qz = dy * sn + dz * cc, dx = x - px;
    cc = Math.cos(side2); sn = Math.sin(side2); x = px + dx * cc + qz * sn; y = py + qy; z = pz - dx * sn + qz * cc;
  } else x *= 1 + 0.4 * seated * (1 - ss(-0.22, 0.04, z));
  if (part < 3.5 || part > 6.5) { const a = hunch * (part < 0.5 ? ss(-0.06, 0.2, z) : 1); cc = Math.cos(a); sn = Math.sin(a); t = y - 0.41; y = 0.41 + t * cc - z * sn; z = t * sn + z * cc; }
  if (part < 3.5 || part > 5.5) { cc = Math.cos(tau); sn = Math.sin(tau); const dy = y - M.hipY, dz = z - M.hipZ; y = M.hipY + dy * cc - dz * sn; z = M.hipZ + dy * sn + dz * cc; }
  o[0] = x; o[1] = y - 0.24 * sit * (1 - air); o[2] = z; return o; }
let monkeyWays = null;
export function monkeyReach() {
  if (monkeyWays) return monkeyWays;
  if (!monkeyBase) { monkeyBase = monkeyGeometry(); monkeyFar = monkeyGeometry(true); }
  const P0 = monkeyBase.getAttribute('position').array, BN = monkeyBase.getAttribute('aBone').array, PV = monkeyBase.getAttribute('aPivot').array, nv = P0.length / 3, o = [0, 0, 0];
  // (each way is kept for the pitches it can be given: one who sits or hops at a place stands level; one who runs takes the ground's
  // slope and a leaper its arc's, to 0.8 either way, by 0.1 to 0.4 and by 0.2 beyond; a swinger hangs pitched down by 0.2 to 2.2)
  const way = (at) => { const n = at.length, W = { at, n, foot: new Float32Array(n).fill(1e9), top: new Float32Array(n).fill(-1e9), rho: new Float32Array(n).fill(0), cs: new Float32Array(n), sn: new Float32Array(n) };
    for (let k = 0; k < n; k++) { W.cs[k] = Math.cos(at[k]); W.sn[k] = Math.sin(at[k]); } return W; };
  const take = (W, sit, air, q) => { const F = W.foot, T = W.top, R = W.rho, cs = W.cs, sn = W.sn, n = W.n; for (let i = 0; i < nv; i++) { const part = Math.round(BN[i * 2]);
      // (what the pose of a part does not read is not walked for it: the stride's phase and the fidget are read by all)
      const opts = part === 3 ? q.scr : part === 1 || part > 6.5 ? q.head : part === 6 ? q.tail : q.one;
      for (let e = 0; e < opts.length; e++) { posePoint(o, P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2], part, BN[i * 2 + 1], PV[i * 3], PV[i * 3 + 1], PV[i * 3 + 2], sit, air, opts[e]);
        // (pitched by a: the height is y cos a - z sin a, the reach along the heading y sin a + z cos a; the breadth stays)
        const x2 = o[0] * o[0], y = o[1], z = o[2];
        for (let k = 0; k < n; k++) { const y1 = y * cs[k] - z * sn[k], z1 = y * sn[k] + z * cs[k], h = x2 + z1 * z1; if (y1 > T[k]) T[k] = y1; if (y1 < F[k]) F[k] = y1; if (h > R[k]) R[k] = h; } } } };
  // what the clock can make of each part where it sits (all of it scaled by how much it sits: one wholly on its feet or in the air
  // reads none of it): the fidget (-1, 1), the scratch (0, 1), the look (0 to 0.55 down the nose) and the head's turn (-1, 0, 1),
  // the tail's sway and its swing to the side (-1, 0, 1 each); in the air the tail's moving curve (eight phases). Between two ways of
  // holding itself the ends of each are walked.
  const sets = (c, sit, air, ends) => { const base = { c, fid: 0, scratch: 0, look: 0, turn: 0, sway: 0, side: 0, theta: 0 }, one = [], scr = [], head = [], tail = [], tri = ends ? [-1, 1] : [-1, 0, 1], nth = air > 0 ? 8 : 1;
    if (!(sit > 0)) { for (let k = 0; k < nth; k++) tail.push({ ...base, theta: k / nth * TAU }); return { one: [base], scr: [base], head: [base], tail }; }
    for (const fid of ends ? [0] : [-1, 1]) { one.push({ ...base, fid }); for (const scratch of [0, 1]) scr.push({ ...base, fid, scratch });
      for (const look of [0, -0.55]) for (const turn of tri) head.push({ ...base, fid, look, turn });
      for (const sway of tri) for (const sd of tri) for (let k = 0; k < (air > 0 ? 4 : 1); k++) tail.push({ ...base, fid, sway, side: sd, theta: k / 4 * TAU }); }
    return { one, scr, head, tail }; };
  const slopes = [-0.8, -0.6, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8], hung = [-2.2, -2, -1.8, -1.6, -1.4, -1.2, -1, -0.8, -0.6, -0.4, -0.2];
  const W = { sit: way([0]), hop: way([0]), run: way(slopes), leap: way(slopes), swing: way(hung) }, sitting = sets(0, 1, 0, false);
  take(W.sit, 1, 0, sitting); take(W.run, 1, 0, sitting);
  W.hop.foot[0] = W.sit.foot[0]; W.hop.top[0] = W.sit.top[0]; W.hop.rho[0] = W.sit.rho[0]; W.leap.foot.set(W.run.foot); W.leap.top.set(W.run.top); W.leap.rho.set(W.run.rho);
  // (one who hops: sit 1 to 0.25 with the air 0.6 of what is left; a leaper: the air's share and the sit's sum to one)
  for (const k of [0.25, 0.5, 0.75, 1]) { take(W.hop, 1 - 0.75 * k, 0.45 * k, sets(0, 1 - 0.75 * k, 0.45 * k, true)); take(W.leap, 1 - k, k, sets(0, 1 - k, k, true)); }
  take(W.swing, 0, 1, sets(0, 0, 1, true));
  // (one who runs: the stride's phase round twice, for the tail's bow turns at half its rate; going, and between going and sitting)
  for (let j = 0; j < 16; j++) { const c = j / 16 * 2 * TAU; take(W.run, 0, 0, sets(c, 0, 0, true)); if (j % 4 === 0) for (const sit of [0.33, 0.67]) take(W.run, sit, 0, sets(c, sit, 0, true)); }
  for (const k in W) for (let d = 0; d < W[k].n; d++) W[k].rho[d] = Math.sqrt(W[k].rho[d]);
  return (monkeyWays = W);
}
// [foot, top, rho] in metres for a way of holding itself at a size, for every pitch between the two given; null where a pitch lies
// outside what is kept for that way (such a body is not placed). (Between two of the kept pitches a reach is at most the greater of
// the two over the cosine of half their step.)
export function monkeyBody(wayName, size, pitch0 = 0, pitch1 = pitch0) { const W = monkeyReach()[wayName], at = W.at, lo = Math.min(pitch0, pitch1), hi = Math.max(pitch0, pitch1);
  if (lo < at[0] - 1e-6 || hi > at[W.n - 1] + 1e-6) return null;
  let k0 = 0, k1 = W.n - 1; while (k0 < W.n - 1 && at[k0 + 1] <= lo + 1e-6) k0++; while (k1 > 0 && at[k1 - 1] >= hi - 1e-6) k1--;
  let foot = 1e9, top = -1e9, rho = 0, step = 0; for (let k = k0; k <= k1; k++) { foot = Math.min(foot, W.foot[k]); top = Math.max(top, W.top[k]); rho = Math.max(rho, W.rho[k]); if (k > k0) step = Math.max(step, at[k] - at[k - 1]); }
  const wide = 1 / Math.cos(step / 2);
  return [foot * (foot < 0 ? wide : 1 / wide) * size, top * wide * size, rho * wide * size]; }

// The monkey maker: one troop from a list of { mode, a: [4], b: [4], ph, size, carry (0 none, 1 a peach, 2 a bowl), tint: [r, g, b], arc, look, sun }.
// Mode 2 is a trail runner: a: [the lane's lower and upper end in the stream's own metres, metres beyond the water's edge at either end],
// b: [metres a second, share of rest, 0, 0]. Mode 3 is a leaper's round: a: [rock x, y, z, the round's seconds], b: [landing x, z, its own
// place x, z], arc (the leap's height), kLeap and kRun (its speed in the air and on the floor, metres a second).
// Mode 4 is one runner's round in over the bridge and out: a: [gallery x, gallery z, lane (metres from the middle), 0], b: [hall x, hall z,
// metres a second, share of rest].
// Mode 5 goes to and fro on a line: a: [x, y, z, 0] one end, b: [x, z of the other end, metres a second, share of rest], arc: the other end's y,
// kRun: the line's sag. Mode 6 swings on a vine: a: [where the vine is fixed, 0], b: [the swing's direction x, z, the vine's length, radians].
// u holds the uniforms the troop reads: uTime (the world's clock), tGround (height and sun of the ground), uGBox, tCourse, uCBox, uArc,
// uKeyDir, uKeyCol, uSky, uGround (its light) and uRipple (1 where the key light is the water's and shakes); for a troop that goes through the
// sheet also uSheetZ and the cave's light (uKeyDir2, uKeyCol2, uSky2, uGround2). Two draw calls: bodies, ground shadows.
// The band wears the near shape or the far one (setFar): the world sets the far one on the metres of the way that lie more than 45 m
// from every place any member of the band ever stands at (worked in build from the way and those places).
let monkeyBase = null, monkeyFar = null;
export function makeMonkeys(list, u, { shadows = true } = {}) {
  if (!monkeyBase) { monkeyBase = monkeyGeometry(); monkeyFar = monkeyGeometry(true); }
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4), D = new Float32Array(n * 4), E = new Float32Array(n * 4);
  list.forEach((m, i) => { A.set(m.a, i * 4); B.set(m.b, i * 4); C.set([m.mode, m.ph, m.size, m.carry || 0], i * 4); D.set([m.tint[0], m.tint[1], m.tint[2], m.kLeap || 0], i * 4); E.set([m.arc || 0, m.look || 0, m.sun ?? 1, m.kRun || 0], i * 4); });
  const inst = { iA: new THREE.InstancedBufferAttribute(A, 4), iB: new THREE.InstancedBufferAttribute(B, 4), iC: new THREE.InstancedBufferAttribute(C, 4), iD: new THREE.InstancedBufferAttribute(D, 4), iE: new THREE.InstancedBufferAttribute(E, 4) };
  const wear = (base) => { const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
    for (const k of ['position', 'normal', 'color', 'aBone', 'aPivot']) g.setAttribute(k, base.getAttribute(k));
    for (const k in inst) g.setAttribute(k, inst[k]);
    g.instanceCount = n; return g; };
  const geo = wear(monkeyBase), geoFar = wear(monkeyFar);
  const uniforms = { ...fx.fogUniforms(), uTime: u.uTime, tGround: u.tGround, uGBox: u.uGBox, tCourse: u.tCourse, uCBox: u.uCBox,
    uKeyDir: u.uKeyDir, uKeyCol: u.uKeyCol, uSky: u.uSky, uGround: u.uGround, uRipple: u.uRipple,
    uWayA: u.uWayA || { value: new THREE.Vector4() }, uWayB: u.uWayB || { value: new THREE.Vector4() }, uArc: u.uArc || { value: new THREE.Vector4() },
    // the second light (the cave's) for a troop that goes through the sheet; uSheetZ is the sheet's z (a troop that never does keeps it far away)
    // (round 3, A6) the air: uAirZ is the z of the plane behind which the cave's air begins (far to the north for a troop under the
    // sky: the day's air; far to the south for the house's troop: the cave's; the sheet's own z for those who leap through it)
    uCaveAir: u.uCaveAir || NO_AIR(), uAirZ: u.uAirZ || { value: -1e6 },
    uSheetZ: u.uSheetZ || { value: -1e6 }, uKeyDir2: u.uKeyDir2 || u.uKeyDir, uKeyCol2: u.uKeyCol2 || u.uKeyCol, uSky2: u.uSky2 || u.uSky, uGround2: u.uGround2 || u.uGround };
  const mat = new THREE.ShaderMaterial({ uniforms, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + MONKEY_PLACE + MONKEY_POSE + /* glsl */`
      varying vec3 vN, vCol, vW; varying float vSun, vIn;
      void main() { Mk m = monkeyPlace(); vec3 p = position, n = normal; monkeyPose(p, n, m);
        vN = n; vCol = color * iD.rgb; vW = p; vSun = m.sun; vIn = m.cave;
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + AIR_GLSL + NOISE_GLSL + /* glsl */`
      uniform vec3 uKeyDir, uKeyCol, uSky, uGround, uKeyDir2, uKeyCol2, uSky2, uGround2; uniform float uRipple, uTime, uAirZ; varying vec3 vN, vCol, vW; varying float vSun, vIn;
      void main() {
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.), v = normalize(cameraPosition - vW);
        vec3 kd = normalize(mix(uKeyDir, uKeyDir2, vIn)), kc = mix(uKeyCol, uKeyCol2, vIn), sk = mix(uSky, uSky2, vIn), gr = mix(uGround, uGround2, vIn);
        float key = max(dot(n, kd) * .7 + .3, 0.); key *= key;
        float rip = mix(1., .65 + .7 * hNoise(vW.xy * .5 + vec2(vW.z * .3, uTime * 1.3)), max(uRipple, vIn));
        vec3 amb = mix(gr, sk, n.y * .5 + .5);
        float rim = clamp(1. - dot(n, v), 0., 1.); rim = rim * rim * rim;
        vec3 col = vCol * (amb + kc * key * mix(vSun, 1., vIn) * rip) + rim * .1 * (sk + kc * mix(vSun, 1., vIn) * .5);
        gl_FragColor = vec4(airFog(col, airBehind(vW.z, uAirZ)), 1.); }` });
  const body = new THREE.Mesh(geo, mat); body.frustumCulled = false;
  const object = new THREE.Group(); object.add(body);
  let shadow = null;
  if (shadows) {
    // the ground shadow: a soft dark disc under each animal, on the ground it stands on, gone while it is in the air
    const sg = new THREE.InstancedBufferGeometry(), sp = [0, 0, 0], si = [];
    for (let i = 0; i < 8; i++) { const a = TAU * i / 8; sp.push(Math.cos(a), 0, Math.sin(a)); si.push(0, 1 + (i + 1) % 8, 1 + i); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
    for (const k in inst) sg.setAttribute(k, inst[k]);
    sg.instanceCount = n;
    const smat = new THREE.ShaderMaterial({ uniforms, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: fx.GLSL_FOG_PARS_VERT + MONKEY_PLACE + /* glsl */`
        varying float vA, vZ;
        void main() { Mk m = monkeyPlace(); float r = length(position.xz); vZ = m.pos.z;
          vec3 p = position * vec3(.36, 0., .5) * iC.z * m.show; p = rotY(rotX(p, m.pitch), m.yaw) + m.pos + vec3(0., .05, 0.);
          vA = (1. - r) * .62 * (1. - smoothstep(.15, 1.6, m.lift)) * m.show;
          vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
      fragmentShader: fx.GLSL_FOG_PARS_FRAG + AIR_GLSL + /* glsl */`
        uniform float uAirZ; varying float vA, vZ; void main() { float a = clamp(vA, 0., 1.); gl_FragColor = vec4(vec3(.02, .03, .05), a * (1. - airAmt(airBehind(vZ, uAirZ)))); }` });
    shadow = new THREE.Mesh(sg, smat); shadow.frustumCulled = false; shadow.renderOrder = 1; object.add(shadow);
  }
  return { object, body, shadow, uniforms, count: n, geometries: [geo, geoFar], setFar(far) { const g = far ? geoFar : geo; if (body.geometry !== g) body.geometry = g; },
    triangles: n * (monkeyBase.index.count / 3 + (shadows ? 8 : 0)), trianglesFar: n * (monkeyFar.index.count / 3 + (shadows ? 8 : 0)) };
}

// ------------------------------------------------------------------------------------------------ the great fall
// Two sheets of falling water, one a little before the other. Every point of a sheet knows how many seconds its water has fallen from the lip
// (y = H - g t t / 2, thrown outward at v0), and the pattern of strands and clumps rides down with the water: it is drawn at (x, t - clock), so a
// clump leaves the lip small and slow and is long and fast at the foot, as falling water is. Outside the sheets are white with form: a normal
// from the pattern's own slope, lit by the sun, blue-grey in the folds, open where the water is thin so the dark of the gallery shows through.
// From behind they are a bright shaking curtain: the day's light coming through the water, the valley dim through it.
// THE WATER SEEN FROM NEAR (B1): a fall is threads of water with air between them, many deep along a line of sight. From 36 m and more the
// threads close into one face; nearer they part, and within 7 m the sheet is seen as what it is: threads 0.15 to 0.5 m broad riding down,
// about half of it air, so that what stands behind it shows through. Within 2 m of the eye a thread thins away (it would be a blur
// across the whole eye). This is the water's own look by its distance from whoever looks, the same at every place of the sheet.
const G = 9.81;
export function fallTime(P, y) { return Math.sqrt(Math.max(0, 2 * (P.H - y) / G)); }
// the outward throw that brings the sheet to P.sheetZ where it passes the middle of the gallery's height
export function fallThrow(P) { return (P.sheetZ - P.lipZ) / fallTime(P, (P.galY + P.galTop) / 2); }
export async function makeFall(P, u, noise, side = 1, pause) {
  const tMax = fallTime(P, -0.6), v0 = fallThrow(P), NU = 44, NV = 46, T0 = -1.1;
  const pos = [], xt = [], idx = [];
  for (let L = 0; L < 2; L++) {
    const base = pos.length / 3;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const uu = i / NU, x = (uu - 0.5) * (P.W + L * 3), t = T0 + (tMax - T0) * j / NV, tf = Math.max(t, 0);
      // the lip is not straight and the throw differs from strand to strand: the sheet has lobes
      const lobe = noise.n2(x * 0.09 + L * 5.1, 3.7) * 0.5 + noise.n2(x * 0.31, 9.2 + L) * 0.22;
      const z = P.lipZ + 0.8 * noise.n2(x * 0.06, 1.1) + (v0 + 0.32 * lobe + L * 0.42) * t + L * 0.25;
      pos.push(side * x, P.H - 0.5 * G * tf * tf + (t < 0 ? 0.25 * t : 0) + 0.15, z); xt.push(x, t, uu, L);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
    if (pause) await pause();
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aXT', new THREE.Float32BufferAttribute(xt, 4)); g.setIndex(idx);
  g.computeBoundingSphere();
  const uniforms = { ...fx.fogUniforms(), uTime: u.uTime, uLit: u.uFallLit, uShade: u.uFallShade, uDeep: u.uFallDeep, uInner: u.uFallInner, uSunDir: u.uSunDir, uTMax: { value: tMax } };
  const mat = new THREE.ShaderMaterial({ uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec4 aXT; varying vec4 vXT; varying vec3 vW; varying float vEye;
      void main() { vXT = aXT; vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); vEye = length(mvPosition.xyz); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + NOISE_GLSL + /* glsl */`
      uniform float uTime, uTMax; uniform vec3 uLit, uShade, uDeep, uInner, uSunDir; varying vec4 vXT; varying vec3 vW; varying float vEye;
      float dens(vec2 q) { return hNoise(vec2(q.x * .2, q.y * .5)) * .46 + hNoise(vec2(q.x * .75 + 3., q.y * 1.6 + 1.3)) * .34 + hNoise(vec2(q.x * 2.4, q.y * 4.8)) * .2; }
      void main() {
        float t = max(vXT.y, 0.), L = vXT.w, uu = clamp(vXT.z, 0., 1.);
        vec2 q = vec2(vXT.x + L * 17., t - uTime * (1. + .08 * L) + L * 2.3);
        float d = dens(q), dx = dens(q + vec2(.4, 0.)) - d, dt = dens(q + vec2(0., .07)) - d;
        // thinner at the two edges, at the foot (spray), and on the outer sheet; whole at the lip
        float edge = smoothstep(0., .1, uu) * (1. - smoothstep(.9, 1., uu));
        float bias = mix(-.34, .1, edge) - .1 * smoothstep(.62, 1., t / uTMax) - L * .2 + .5 * (1. - smoothstep(0., .5, t));
        float body = smoothstep(.34, .6, d + bias);
        // the threads (they ride down with the water as the clumps do), how far they are parted, and the thread at the eye itself
        float th = hNoise(vec2(vXT.x * 2.6 + L * 9., q.y * .3)) * .6 + hNoise(vec2(vXT.x * 7.1 + 5., q.y * .8 + 2.)) * .4;
        float threads = smoothstep(.36, .6, th + (d - .5) * .4), parted = 1. - smoothstep(7., 36., vEye), touch = smoothstep(.4, 2.2, vEye);
        float open = mix(1., threads, parted) * touch;
        if (gl_FrontFacing) {
          vec3 n = normalize(vec3(-dx * 7., dt * 5., 1.));
          float sun = clamp(dot(n, normalize(vec3(uSunDir.x, uSunDir.y, abs(uSunDir.z) + .35))), 0., 1.);
          float fold = smoothstep(.36, .72, d + bias * .5);
          vec3 col = mix(uDeep, mix(uShade, uLit, sun * sun * (.35 + .65 * fold)), fold);
          // the smooth water bending over the lip: glassy, the colour of the pools
          col = mix(col, mix(uDeep * 1.6, uLit, .35 + .4 * d), 1. - smoothstep(-.6, .35, vXT.y));
          gl_FragColor = vec4(fxApplyFog(col), body * (.82 + .18 * fold) * open);
        } else {
          float sh = hNoise(vec2(q.x * .55, q.y * 3.2 + uTime * .7));
          vec3 col = uInner * (.5 + .95 * d + .35 * sh) * (.6 + .4 * edge);
          gl_FragColor = vec4(fxApplyFog(col), mix(.4, .72, body) * mix(1., .3 + .7 * threads, parted) * touch);
        }
      }` });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 2;
  return { object: mesh, uniforms, tMax, v0, triangles: idx.length / 3 };
}

// Mist and spray: soft puffs that turn about their own places to face the eye. Each is born at its place, rises, drifts, swells and thins over
// its own life and is born again (so a foot of a fall boils at every moment of the clock). Lit from above by the day's light, shaded below;
// where the eye sees a puff 42 degrees from the point opposite the sun, the bow's colours lie in it.
// list: [{ p: [x, y, z], size, rise, drift: [x, z], life, ph, op }]
export function makeMist(list, u) {
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  list.forEach((m, i) => { A.set([m.p[0], m.p[1], m.p[2], m.size], i * 4); B.set([m.drift[0], m.rise, m.drift[1], m.life], i * 4); C.set([m.ph, m.op, m.grow ?? 1.6, 0], i * 4); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 4));
  g.instanceCount = n;
  const uniforms = { ...fx.fogUniforms(), uTime: u.uTime, uLit: u.uMistLit, uShade: u.uMistShade, uSunDir: u.uSunDir, uBow: u.uBow, uMistAmt: u.uMistAmt, uCaveAir: u.uCaveAir || NO_AIR(), uAirZ: u.uAirZ || { value: -1e6 } };
  const mat = new THREE.ShaderMaterial({ uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec4 iA, iB, iC; uniform float uTime, uMistAmt; varying vec2 vC; varying vec4 vI; varying vec3 vW;
      void main() {
        float age = fract(uTime / iB.w + iC.x), size = iA.w * mix(.55, iC.z, age);
        vec3 c = iA.xyz + vec3(iB.x, iB.y, iB.z) * age * iB.w;
        vec4 mvPosition = viewMatrix * vec4(c, 1.);
        float near = smoothstep(.25, 1.1, -mvPosition.z / max(size, .01));
        mvPosition.xy += position.xy * size;
        vC = position.xy; vI = vec4(age, iC.y * smoothstep(0., .18, age) * (1. - smoothstep(.55, 1., age)) * near * uMistAmt, iC.x * 37., size);
        vW = (cameraPosition + (inverse(viewMatrix) * vec4(mvPosition.xyz, 0.)).xyz);
        gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + AIR_GLSL + NOISE_GLSL + /* glsl */`
      uniform vec3 uLit, uShade, uSunDir; uniform float uBow, uTime, uAirZ; varying vec2 vC; varying vec4 vI; varying vec3 vW;
      void main() {
        float r = length(vC); if (r > 1.) discard;
        float er = hFbm(vC * 1.7 + vI.z + vec2(0., -vI.x * .8));
        float a = (1. - smoothstep(.25, 1., r + (er - .5) * .7)) * vI.y;
        if (a < .004) discard;
        vec3 col = mix(uShade, uLit, clamp(.55 + .45 * vC.y + (er - .5) * .5, 0., 1.));
        // the bow: 42 degrees round the point opposite the sun; red outside, violet inside; only where the mist is. (Round 3, A14) It
        // stands by the sun's place, the puff's place and the angle of the sight line between them alone, as a bow does: it is no longer
        // dimmed by how near the eye is. A puff at the lens thins by the puff's own rule for a medium at the lens (near, above: its
        // whole strength, the bow in it too, goes from a quarter of its own size to 1.1 of it from the lens).
        float cs = dot(normalize(vW - cameraPosition), -uSunDir), x = (cs - .743) / .05;
        vec3 bow = vec3(smoothstep(-1., -.35, x) * (1. - smoothstep(-.1, .45, x)), smoothstep(-.55, 0., x) * (1. - smoothstep(.2, .75, x)), smoothstep(-.1, .45, x) * (1. - smoothstep(.6, 1., x)));
        col += bow * uBow * .55;
        gl_FragColor = vec4(airFog(col, airBehind(vW.z, uAirZ)), a); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { object: mesh, uniforms, count: n, triangles: n * 2 };
}

// ------------------------------------------------------------------------------------------------ the cave's light
// Everything behind the water is drawn with this one material. Its light: (1) what comes through the falling water, from the curtain's back
// (uCurtain), cool and bright, falling to half at uReach metres, in shaking ripples that slide down as the water does; (2) the shafts from
// the crack in the roof: a point is in a shaft when the line from it toward uShaftDir meets the roof inside the crack; (3) the ring's own
// light at the end of the hall; (4) a soft ambient so no hollow is black. Kinds of surface: 0 stone, 1 the hall's flagged floor, 2 iron
// with rust and rivets, 4 the bright slot of the crack itself.
// The roof's crack, the same in the builder and in the shader: its middle line and its half breadth at z (world x; it opens and pinches
// along its length and closes over 6 m at its two ends).
export const crackMid = (x0, z) => x0 + 2.6 * Math.sin(z * 0.11) + 1.2 * Math.sin(z * 0.29 + 1.7);
export const crackHalf = (c, z) => c.half * clamp(0.5 + 0.5 * Math.sin(z * 0.19 + 0.6) + 0.32 * Math.sin(z * 0.47 + 2), 0, 1.25) * smoothstep(c.zN, c.zN + 6, z) * (1 - smoothstep(c.zS - 6, c.zS, z));
// THE ROCK'S PATTERN (B2), in three dimensions and in the place's own metres, the same on every wall whichever way it faces: the rock's
// skin as a height (lumps of 2.6 m, of 0.95 m, grain of 0.32 m), read through a turned frame so that no part of it lies along a wall;
// every finer part fades out where it would be smaller than what one dot of the picture covers (fw: metres to a dot), so a wall that
// runs away from the eye goes smooth and never sparkles or breaks into squares.
export const ROCK_GLSL = /* glsl */`
const mat3 ROCK_M = mat3(0., .8, .6, -.8, .36, -.48, -.6, -.48, .64);
float rockH(vec3 p, float fw) {
  vec3 q = ROCK_M * p; float h = hNoise3(q * .38) * .5;
  q = ROCK_M * q; h += hNoise3(q * 1.05 + 7.3) * .3 * (1. - smoothstep(.2, .8, fw * 1.05));
  q = ROCK_M * q; h += hNoise3(q * 3.1 + 3.1) * .2 * (1. - smoothstep(.2, .8, fw * 3.1));
  return h; }
// the surface's normal tipped by the slope of a height h (in metres) over the surface
vec3 rockBump(vec3 p, vec3 n, float h) {
  vec3 dpx = dFdx(p), dpy = dFdy(p); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
  return normalize(abs(det) * n - sign(det) * (hx * r1 + hy * r2)); }
`;
export const CAVE_LIGHT_GLSL = /* glsl */`
uniform float uTime; uniform vec3 uAmb, uWater, uCurtain, uShaftDir, uShaftCol, uRing, uRingCol, uFireCol; uniform vec4 uCrack, uReach, uGal, uFire[3];
float crackX(float z) { return uCrack.x + 2.6 * sin(z * .11) + 1.2 * sin(z * .29 + 1.7); }
float crackW(float z) { return uCrack.w * clamp(.5 + .5 * sin(z * .19 + .6) + .32 * sin(z * .47 + 2.), 0., 1.25) * smoothstep(uCrack.z, uCrack.z + 6., z) * (1. - smoothstep(uCrack.y - 6., uCrack.y, z)); }
// how much of a shaft's light reaches p (0..1)
float shaftAt(vec3 p) {
  float k = max(uReach.z - p.y, 0.) / max(uShaftDir.y, .2); vec2 q = p.xz + uShaftDir.xz * k;
  float w = crackW(q.y), d = abs(q.x - crackX(q.y));
  return (1. - smoothstep(w * .2, w + 1.5, d)) * smoothstep(.05, .6, w); }
// how near the crack's light a place is (1 under its line, a half some 22 m from it): what grows in the hall grows by it
float crackNear(vec3 p) { float cz = clamp(p.z, uCrack.z, uCrack.y), cdx = p.x - crackX(cz) + uShaftDir.x * (uReach.z - p.y) / max(uShaftDir.y, .2), cdz = p.z - cz; return 1. / (1. + (cdx * cdx + cdz * cdz) / 500.); }
// the ripples of light thrown by the water: bright thin ridges on a soft ground, sliding down
float waterRipple(vec3 p) {
  vec3 c = p * .8; float fwp = length(fwidth(p));
  float a = hNoise3(c + vec3(.13, .9, .21) * uTime), b = hNoise3(c * 1.9 + vec3(-.2, 1.5, .3) * uTime + a * 1.4);
  float k = 1. - abs(2. * b - 1.);
  // it comes and goes in drifting patches, so that no wall wears it like a pattern
  float drift = smoothstep(.34, .68, hNoise3(p * .09 + vec3(.05, .11, .03) * uTime + 9.));
  // (the ridges stand about 0.7 m apart: where a pixel covers more than a third of that, as on a wall running away from us, the net goes to its mean)
  return mix(k * k * k, .25, smoothstep(.12, .5, fwp)) * drift; }
vec3 caveLight(vec3 p, vec3 n, float ao) {
  vec3 dc = uCurtain - p; float lc = length(dc); dc /= max(lc, .01);
  float att = 1. / (1. + (lc * lc) / (uReach.x * uReach.x));
  float rp = waterRipple(p) * smoothstep(.03, .45, att);
  vec3 l = uWater * att * clamp(dot(n, dc) * .55 + .45, 0., 1.) * (.7 + .9 * rp) * mix(vec3(.84, .96, 1.), vec3(1.1, 1., .8), rp);
  l += uShaftCol * shaftAt(p) * clamp(dot(n, uShaftDir) * .8 + .2, 0., 1.);
  // the crack's light thrown about the hall under it: soft, warm, from above, strongest under its line
  float cz = clamp(p.z, uCrack.z, uCrack.y), cdx = p.x - crackX(cz), cdy = uReach.z - p.y, cdz = p.z - cz;
  l += uShaftCol * vec3(1.02, .94, .8) * uReach.w * (.35 + .65 * clamp(n.y * .6 + .4, 0., 1.)) / (1. + (cdx * cdx + cdz * cdz + .3 * cdy * cdy) / 500.);
  vec3 dr = uRing - p; float lr = length(dr); dr /= max(lr, .01);
  l += uRingCol * clamp(dot(n, dr) * .6 + .4, 0., 1.) / (1. + (lr * lr) / (uReach.y * uReach.y));
  // the stoves' fires: each lights the stone and the floor about it (half at 6 m), flickering on the clock
  for (int i = 0; i < 3; i++) { vec3 df = uFire[i].xyz - p; float lf = length(df); df /= max(lf, .01);
    float fl = .75 + .5 * hNoise(vec2(uTime * 6. + float(i) * 17.3, float(i) * 3.1));
    l += uFireCol * uFire[i].w * fl * clamp(dot(n, df) * .6 + .4, 0., 1.) / (1. + lf * lf / 36.); }
  return l + uAmb * (.62 + .38 * n.y) * ao; }
`;
export function caveUniforms(u) {
  return { ...fx.fogUniforms(), uTime: u.uTime, uAmb: u.uCaveAmb, uWater: u.uWaterLight, uCurtain: u.uCurtain, uShaftDir: u.uShaftDir, uShaftCol: u.uShaftCol,
    uRing: u.uRing, uRingCol: u.uRingCol, uCrack: u.uCrack, uReach: u.uReach, uGal: u.uGal, uFire: u.uFire, uFireCol: u.uFireCol, uPlum: u.uPlum, uPetal: u.uPetal, uCaveAir: u.uCaveAir || NO_AIR() };
}
// Kinds of surface: 0 living rock (the pattern above, beds, wet streaks, moss), 1 the hall's flagged floor (worn flags, moss in the joints,
// puddles that hold the roof's light, fallen petals), 2 iron, 5 a plainly coloured thing (fruit, leaf, flower), 6 the
// walls of the roof's crack, lit by the sky above them, 7 what glows of itself (the embers in a stove's mouth, flickering on the clock).
export function caveMaterial(u) {
  return new THREE.ShaderMaterial({ uniforms: caveUniforms(u), fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute float aKind; varying vec3 vW, vN, vCol; varying float vKind;
      void main() { vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize(mat3(modelMatrix) * normal); vCol = color; vKind = aKind;
        vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + AIR_GLSL + NOISE_GLSL + ROCK_GLSL + CAVE_LIGHT_GLSL + /* glsl */`
      uniform vec4 uPlum; uniform vec3 uPetal; varying vec3 vW, vN, vCol; varying float vKind;
      void main() {
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.), p = vW, alb = vCol, v = normalize(cameraPosition - p);
        float fw = max(length(dFdx(p)), length(dFdy(p))), h = rockH(p, fw), ao = .72 + .56 * (h - .5);
        float wet = 1. / (1. + dot(uCurtain - p, uCurtain - p) / 1600.), grown = max(smoothstep(uGal.y + 1., uGal.y + 11., p.z), crackNear(p));
        float gloss = 0., pud = 0.;
        // the roof's crack is an opening: the roof's own skin (what faces down, up there) is not drawn inside its ragged outline
        if (vKind < .5 && p.y > uReach.z - 4. && n.y < .2) { float w = crackW(p.z); if (w > .35 && abs(p.x - crackX(p.z)) < w - .15 + (hNoise(p.zx * .7) - .5) * .9) discard; }
        vec3 mossC = vec3(.055, .11, .035) * (.7 + .6 * h);
        if (vKind > 6.5) { float fl = .65 + .7 * hNoise(vec2(p.x * 5. + p.z * 5. + uTime * 2.3, p.y * 6. - uTime * 3.1)); gl_FragColor = vec4(airFog(alb * (.6 + 1.6 * fl), 1.), 1.); return; }
        if (vKind > 5.5) {
          // the crack's own walls: rock in the day's light, brighter toward the sky
          alb *= .7 + .6 * h; n = rockBump(p, n, h * .5); alb = mix(alb, mossC * 1.6, .35 * smoothstep(.45, .7, h));
          vec3 sky = uShaftCol * (.16 + .5 * smoothstep(uReach.z, uReach.z + 9., p.y)) * (.35 + .65 * clamp(dot(n, uShaftDir), 0., 1.)) + uAmb * .5;
          gl_FragColor = vec4(airFog(alb * mix(caveLight(p, n, ao) + uShaftCol * .16, sky, smoothstep(uReach.z - 2.5, uReach.z + 1.5, p.y)), 1.), 1.); return; }
        if (vKind > 4.5) {
          gloss = .25;
        } else if (vKind > 1.5) {
          // iron: plates 2.4 m long with seams and rivets, rust where the damp sits
          float seam = abs(fract(p.z / 2.4) - .5) * 2.4, rust = smoothstep(.45, .75, h + .25 * (1. - smoothstep(0., .25, seam)));
          vec2 rv = fract(vec2(p.x, p.z) * 2.5) - .5; float nearK = 1. - smoothstep(.02, .08, fw);
          alb = mix(alb, vec3(.17, .062, .03), rust) * (.8 + .4 * h);
          alb *= 1. - .45 * (1. - smoothstep(.02, .07, seam)) * nearK;
          alb += .1 * (1. - smoothstep(.1, .16, length(rv))) * (1. - smoothstep(.18, .3, seam)) * nearK;
          gloss = .5;
        } else if (vKind > .5) {
          // the flagged floor: slabs about 2.2 m, each a little its own tone, worn pale along the hall's middle
          vec2 g = p.xz / 2.2 + .22 * vec2(hNoise(p.zx * .07), hNoise(p.xz * .07 + 9.));
          g.x += .5 * floor(g.y); vec2 f = fract(g), cell = floor(g);
          float je = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)), joint = smoothstep(.0, .03 + fw * .3, je), jk = 1. - smoothstep(.1, .6, fw);
          alb *= (.84 + .3 * hHash(cell)) * (1. - .42 * (1. - joint) * jk) * (.82 + .36 * h);
          // moss in the joints where the roof's light or the water's damp reaches
          float jm = (1. - smoothstep(.015, .075, je + (hNoise(p.xz * 2.7) - .5) * .05)) * smoothstep(.25, .6, grown) * jk;
          alb = mix(alb, mossC, jm * .9);
          // puddles in the low flags (about one flag in four, in drifts): still water that holds the light above it
          // (pools of their own shape, a metre or two across, lying over the joints, in drifts down the hall)
          float low = smoothstep(.58, .68, hNoise(p.xz * .42 + 21.) * .8 + hNoise(p.xz * 1.3 + 3.) * .2) * smoothstep(.4, .55, hNoise(p.xz * .05 + 21.));
          pud = low * (1. - smoothstep(.15, .8, fw));
          // fallen petals: thick under the plum and before the moon-door, thinning away from them
          float pk = .5 * max(exp(-dot(p.xz - uPlum.xy, p.xz - uPlum.xy) / (uPlum.z * uPlum.z)), exp(-dot(p.xz - uRing.xz, p.xz - uRing.xz) / 240.));
          vec2 pc = floor(p.xz / .24), pf = fract(p.xz / .24) - .5; float pr = hHash(pc);
          if (pr < pk && fw < .12) { float a = pr * 97., c = cos(a), sn = sin(a); vec2 e = vec2(pf.x * c + pf.y * sn, -pf.x * sn + pf.y * c) + (vec2(hHash(pc + 3.), hHash(pc + 5.)) - .5) * .4;
            float pet = 1. - smoothstep(.8, 1., length(e / vec2(.3, .17))); alb = mix(alb, uPetal * (.75 + .5 * hHash(pc + 9.)), pet * (1. - smoothstep(.06, .12, fw))); pud *= 1. - pet; }
          n = rockBump(p, n, h * .06 * (1. - pud));
        } else {
          // living rock: its beds (2.3 m, wandering), a dark crack where two beds meet, every bed its own tone
          float bc = (p.y + 1.6 * hNoise3(p * .09) + .9 * hNoise3(p * vec3(.33, .5, .33) + 4.) + .5 * h) / 2.3, bf = fract(bc);
          // (a crack does not run on like a ruled line: it opens and closes along the bed)
          float crack = (1. - smoothstep(0., .04 + fw * .4, min(bf, 1. - bf))) * (1. - smoothstep(.3, 1.4, fw)) * smoothstep(.38, .62, hNoise3(p * vec3(.23, .7, .23) + 17.));
          alb *= (.62 + .76 * h) * (.9 + .2 * hHash(vec2(floor(bc), 3.))) * (1. - .32 * crack);
          // dark wet streaks down what is steep, where the water's damp reaches; moss on what faces up, where light or damp reaches
          float steep = 1. - smoothstep(.3, .7, abs(n.y)), st = hNoise(vec2(dot(p.xz, vec2(.83, .56)) * 1.6, p.y * .09)) * .7 + .3 * h;
          alb *= 1. - .45 * smoothstep(.5, .72, st) * steep * smoothstep(.15, .6, wet);
          float mo = smoothstep(.15, .6, n.y + .3 * (h - .5)) * smoothstep(.48, .66, hNoise3(p * .6 + 31.) * .55 + h * .45) * smoothstep(.2, .55, grown);
          alb = mix(alb, mossC, mo * .9);
          n = rockBump(p, n, h * .3 + crack * .06);
          gloss = .35 * wet;
        }
        vec3 col = alb * caveLight(p, n, ao);
        // the roof about the crack takes the sky's light at its rim
        if (p.y > uReach.z - 4. && vKind < .5) { float w = crackW(p.z), d = abs(p.x - crackX(p.z)); col += alb * uShaftCol * .16 * (1. - smoothstep(w, w + 4., d)) * smoothstep(.05, .6, w); }
        // wet stone and iron answer the curtain's light with a glint
        vec3 dc = normalize(uCurtain - p); float gl = clamp(dot(reflect(-dc, n), v), 0., 1.); gl *= gl; gl *= gl; gl *= gl;
        col += uWater * gl * (wet * .5 + .12) * gloss * 2.;
        if (pud > 0.) {
          // a puddle: dark, and in it what stands over it: the roof's crack and its shafts, the ring, the bright curtain
          vec3 r = reflect(-v, vec3(0., 1., 0.)); float kr = (uReach.z - p.y) / max(r.y, .05); vec2 q = p.xz + r.xz * kr;
          float w = crackW(q.y), d = abs(q.x - crackX(q.y)), sky = (1. - smoothstep(w * .5, w + 1.2, d)) * smoothstep(.05, .6, w);
          vec3 dr = normalize(uRing - p); float rg = pow(clamp(dot(r, dr), 0., 1.), 90.);
          // (the sky in the crack and the lit dust of the shafts, held to a mirror's share so that a pool is gold and not a white patch)
          vec3 refl = uAmb * .45 + uShaftCol * (.2 * sky + .12 * shaftAt(p + r * 6.)) + uRingCol * rg * 1.4 + uWater * pow(clamp(dot(r, dc), 0., 1.), 40.) * wet * 2.;
          float fr = .12 + .88 * pow(1. - clamp(v.y, 0., 1.), 4.);
          col = mix(col, col * .4 + refl * fr, pud); }
        gl_FragColor = vec4(airFog(col, 1.), 1.); }` });
}

// ------------------------------------------------------------------------------------------------ the house's plan
// Where everything of the house stands, in the place's own metres (x not yet mirrored), dealt from one stream (R). The world lays the route by
// these places and seats the troop on them; buildHero builds them. Along the hall, from the gate: the stove and the jars beside the gate, three
// long tables with their benches (the first 60 m), beds along both walls, the garden under the roof's crack, two pairs of posts, the step,
// the seat, the moon-door.
export function layoutHouse(P, R) {
  const cx = P.hallX, z0 = P.hallZ0, z1 = P.hallZ1, fy = P.deckY, L = {};
  L.floorY = fy; L.ringY = fy + P.stepH + 0.4 + P.ringR; L.ring = [cx, L.ringY, z1];
  // tables: 13 to 16 m long, 2.6 m broad, top 1.1 m over the floor, one after another down the hall, to either hand of its line by turns
  L.tables = []; let s = R.sign();
  for (let i = 0; i < 3; i++) { L.tables.push({ x: cx + s * R.range(4, 7), z: z0 - 17 - i * 19 - R.range(0, 3), len: R.range(13, 16), w: 2.6, top: fy + 1.1, rot: s * R.range(0.05, 0.22) }); s = -s; }
  // the stove beside the gate, on the hand away from the first table, its fire mouths turned to the hall's line (B3: the fires are
  // seen from the way); jars before it, clear of its hearth
  const stoveS = -Math.sign(L.tables[0].x - cx); L.stove = { x: cx + stoveS * 19, z: z0 - 15, rot: -stoveS * Math.PI / 2, w: 7, h: 3.2, d: 3 };
  L.jars = []; for (let i = 0; i < 9; i++) L.jars.push({ x: L.stove.x - stoveS * R.range(3.6, 7.5), z: L.stove.z + R.range(-8, 9), r: R.range(0.5, 1.0), h: R.range(1.1, 2.2) });
  // beds: slabs 3.2 by 1.7 m on blocks, along both walls
  L.beds = []; for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { if (sd === stoveS && i < 2) continue;
    L.beds.push({ x: cx + sd * R.range(22, 26.5), z: z0 - 12 - i * 9.5 - R.range(0, 3), rot: R.range(-0.25, 0.25) + (R.chance(0.3) ? Math.PI / 2 : 0), top: fy + R.range(0.7, 1.1) }); }
  // the roof's crack: its line lies to the east of the hall's line, its light leans to the north-west, so its pools lie on the hall's middle
  L.shaftDir = new THREE.Vector3(0.42, 0.85, 0.3).normalize();
  L.roofY = fy + P.hallHigh - 3; L.crack = { x: cx + 13, zS: z0 - 62, zN: z1 + 8, half: 2.6 };
  const lean = (L.roofY - fy) / L.shaftDir.y; L.pool = { dx: -L.shaftDir.x * lean, dz: -L.shaftDir.z * lean };
  // the garden under the crack's light: clumps of bamboo to either hand of a way through, a plum tree, a pine at its far end, standing stones
  const gz0 = L.crack.zS + L.pool.dz - 4, gz1 = z1 + 44, gx = L.crack.x + L.pool.dx;
  L.garden = { x: cx, z0: gz0, z1: gz1, lightX: gx };
  L.plum = { x: cx + R.sign() * R.range(11.5, 13.5), z: lerp(gz0, gz1, R.range(0.5, 0.65)), h: R.range(11, 13.5) };
  L.bamboo = []; const pSide = Math.sign(L.plum.x - cx);
  for (let i = 0; i < 14; i++) { const t = (i + R.range(0.15, 0.85)) / 14, z = lerp(gz0, gz1, t), sd = i % 2 ? 1 : -1, off = R.range(9, 15), h = R.range(13, 20), sc = R.range(0.9, 1.3);
    if (sd === pSide && Math.abs(z - L.plum.z) < 9) continue;
    L.bamboo.push({ x: cx + sd * off, z, h, s: sc }); }
  L.pine = { x: cx - pSide * R.range(9, 12), z: gz1 - R.range(0, 4), h: R.range(7, 9) };
  L.stones = []; for (let i = 0; i < 7; i++) L.stones.push({ x: cx + R.sign() * R.range(4.5, 13), z: R.range(gz1, gz0), r: R.range(0.7, 1.6), h: R.range(1.2, 3.4) });
  // the step across the hall's end, the seat on it before the ring, two pairs of posts before the step
  L.step = { z: z1 + 20, y: fy + P.stepH }; L.seat = { x: cx, z: z1 + P.seatBack, y: L.step.y, h: P.seatH };
  L.posts = []; for (const dz of [28, 40]) for (const sd of [-1, 1]) L.posts.push({ x: cx + sd * 7, z: z1 + dz, h: R.range(8.5, 10), r: 0.7 });
  // natural columns of rock between the hall's middle and its walls
  L.columns = []; for (const sd of [-1, 1]) for (let z = z0 - R.range(30, 44); z > z1 + 24; z -= R.range(32, 46)) L.columns.push({ x: cx + sd * R.range(15.5, 20), z, r: R.range(1.2, 2.1), lean: R.range(-0.06, 0.06), seed: R.range(0, 99) });
  return L;
}

// THE HOME (B3): what makes the hall lived in from the gate on, laid after the plan from three streams of its own (RS.stoves, RS.heaps,
// RS.hangs). Every number of a thing is drawn first; then its whole body is asked of ok(kind, x, y0, y1, z, r) (the world's margin from
// the way; standing alone, everything stands) and it stands only where that holds.
//   stoves   the plan's own beside the gate, a second down the tables on the other hand, a third before the garden: each 17.5 to 18.5 m
//            from the hall's line (inside the beds), moved up the hall by 2 m until 5.5 m clear of every column; four jars about each
//   heaps    peaches or melons heaped on the floor: at both ends of every table (to its outer hand), by each stove, two before the step
//   garlands flowers and vine slung under the gate's lintel and from post to post down each hand, each with its own sag
//   vines    one down every column from the roof, one and a half to three turns, ending 2.5 to 4 m over the floor
//   strands  sixteen hanging from the two rims of the roof's crack, 3 to 9 m long
// (a vine is asked with what dangles from it: strands of up to 4.5 m; the garlands carry none)
export function layoutHome(P, L, RS, ok = () => true) {
  const cx = P.hallX, z0 = P.hallZ0, z1 = P.hallZ1, fy = L.floorY, H = { stoves: [L.stove], jars: [], heaps: [], garlands: [], vines: [], strands: [] };
  const S = RS.stoves, sd0 = Math.sign(L.stove.x - cx) || 1;
  for (const [sd, zc] of [[-sd0, z0 - 46], [sd0, L.garden.z0 + 5]]) { const off = S.range(17.5, 18.5), dz = S.range(-3, 3), jr = [];
    for (let i = 0; i < 4; i++) jr.push([S.range(3.6, 6.5), S.range(-6, 6), S.range(0.5, 0.9), S.range(1.1, 2)]);
    const x = cx + sd * off; let z = zc + dz, k = 0; while (k < 8 && L.columns.some((c) => Math.hypot(c.x - x, c.z - z) < 5.5 + c.r)) { z -= 2; k++; }
    if (!ok('stoves', x, fy, fy + 9.2, z, 3.8)) continue;
    H.stoves.push({ x, z, rot: -sd * Math.PI / 2, w: 6, h: 3, d: 2.8 });
    for (const j of jr) { const jx = x - sd * j[0], jz = z + j[1]; if (ok('stove jars', jx, fy, fy + j[3], jz, j[2])) H.jars.push({ x: jx, z: jz, r: j[2], h: j[3] }); } }
  // (the fire's place: the middle mouth of each stove, on the hall's side of it, half a metre over the floor)
  for (const st of H.stoves) { const sd = Math.sign(st.x - cx) || 1; st.fire = [st.x - sd * (st.d / 2 - 0.2), fy + 0.75, st.z]; st.top = fy + st.h + 6; }
  const Hp = RS.heaps, heap = (x, z) => { const r = Hp.range(0.8, 1.3), melon = Hp.chance(0.4), turn = Hp.range(0, TAU); if (ok('fruit heaps', x, fy, fy + 0.95 * r, z, r)) H.heaps.push({ x, z, r, melon, turn }); };
  for (const t of L.tables) { const outer = Math.sign(t.x - cx) || 1; for (const e of [-1, 1]) { const k = e * (t.len / 2 + Hp.range(1.6, 2.6)), o = outer * Hp.range(0.8, 2.4); heap(t.x + o + Math.sin(t.rot) * k, t.z + Math.cos(t.rot) * k); } }
  for (const st of H.stoves) { const sd = Math.sign(st.x - cx) || 1; heap(st.x - sd * Hp.range(2.6, 4.2), st.z + Hp.sign() * Hp.range(4.6, 6.2)); }
  for (const sd of [-1, 1]) heap(cx + sd * Hp.range(10, 16), L.step.z + Hp.range(3, 6));
  const Hg = RS.hangs, garland = (a, b2) => { const sag = Hg.range(1.1, 2), turn = Hg.range(0, TAU); let fine = true;
    for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(a[1], b2[1], t) - sag * Math.sin(Math.PI * t); if (!ok('garlands', lerp(a[0], b2[0], t), y - 1.3, y + 0.5, lerp(a[2], b2[2], t), 0.9)) fine = false; }
    if (fine) H.garlands.push({ a, b: b2, sag, turn }); };
  garland([cx - 7.2, fy + 11.7, z0 - 0.3], [cx + 7.2, fy + 11.7, z0 - 0.3]);
  for (let i = 0; i + 2 < L.posts.length; i++) { const p = L.posts[i], q = L.posts[i + 2]; garland([p.x, fy + 0.8 + p.h, p.z], [q.x, fy + 0.8 + q.h, q.z]); }
  for (const c of L.columns) { const turns = Hg.range(1.5, 3), end = Hg.range(2.5, 4), ph = Hg.range(0, TAU), dir = Hg.sign();
    if (ok('vines', c.x, fy, fy + P.hallHigh, c.z, 2.3 * c.r + 1.1)) H.vines.push({ c, turns, end, ph, dir }); }
  for (let i = 0; i < 16; i++) { const t = (i + Hg.range(0.1, 0.9)) / 16, z = lerp(L.crack.zS - 3, L.crack.zN + 3, t), sd = i % 2 ? 1 : -1, len = Hg.range(3, 9), sway = Hg.range(0, TAU), in2 = Hg.range(-0.3, 0.5);
    const w = crackHalf(L.crack, z); if (w < 0.5) continue;
    const x = crackMid(L.crack.x, z) + sd * (w - in2); if (ok('crack vines', x, L.roofY - len - 4.5, L.roofY + 2, z, 1.1)) H.strands.push({ x, z, len, sway, sd }); }
  return H;
}

// ------------------------------------------------------------------------------------------------ the rock behind the water
const STONE = lin('#6f7f78'), STONE_LIT = lin('#9fb7a8'), STONE_WET = lin('#4f6460'), IRON = lin('#3a3d42'), RUST = lin('#8a4a2a'), SOOT = lin('#1c1a18');
// a tunnel along z: one ring at each z of zs, from the left foot over the crown to the right foot; sec(z) -> { cx, hw, top, bot }.
// The rock is pushed in and out along the ring's own radius by noise (lumps of 16 m and of 4 m), so no two rings are alike.
function tunnel(b, zs, sec, noise, tone, nA = 28) {
  const n = zs.length - 1;
  b.grid(nA, n, (u, v) => { const z = zs[Math.min(n, Math.round(v * n))], s = sec(z), a = Math.PI * u, wy = Math.pow(Math.sin(a), 0.6);
    const x = s.cx - Math.cos(a) * s.hw, y = s.bot + wy * (s.top - s.bot), my = s.bot + (s.top - s.bot) * 0.35, rx = x - s.cx, ry = y - my, l = Math.hypot(rx, ry) || 1;
    const d = (1.9 * noise.fbm3(x * 0.05, y * 0.05, z * 0.05, 2) + 0.3 * noise.n3(x * 0.17, y * 0.17, z * 0.17) + 0.5 * noise.n3(x * 0.45, y * 0.45, z * 0.45 + 17)) * Math.min(1, s.hw / 12);
    return [x + rx / l * d, y + ry / l * d * (u > 0.04 && u < 0.96 ? 1 : 0), z + 0.6 * noise.n3(x * 0.1, y * 0.1, z * 0.1 + 50)]; },
  (p, nn) => { const k = 0.5 + 0.5 * noise.n3(p[0] * 0.09 + 20, p[1] * 0.09, p[2] * 0.09); return mix3(mix3(STONE, STONE_LIT, k), tone, 0.35); });
}
// the floor between the two feet of a tunnel's rings
function tunnelFloor(b, zs, sec, noise, col, kind, rough = 0.25) {
  const n = zs.length - 1;
  b.grid(8, n, (u, v) => { const z = zs[Math.min(n, Math.round(v * n))], s = sec(z), x = s.cx + (2 * u - 1) * s.hw * 1.04;
    return [x, s.bot + rough * noise.n2(x * 0.3, z * 0.3), z]; }, () => col, { kind });
}
// the gallery draws in to a rounded end at each hand: how much of its section is left at x (1 in the middle, 0 at the end), the lumps
// of its rock (taken at the place itself, so the end closes without a seam), and the height of its floor at a place. The section draws
// in toward the floor's own height (the floor runs level to the end; the roof comes down to it and the ledge's face under it runs out)
// and toward a line 2 m behind the cliff's face, which bends as the cliff does (so the ledge ends in the cliff and not before it).
export const galSqueeze = (P, x) => Math.pow(Math.max(0, 1 - (x / (P.galHalf + 4)) ** 4), 0.5);
const galLump = (noise, x, y, z) => 0.9 * noise.fbm3(x * 0.08, y * 0.08, z * 0.08 + 9, 3) + 0.3 * noise.n3(x * 0.3, y * 0.3, z * 0.3);
const galMidZ = (x) => 1 + 0.0042 * x * x;
export const galFloorAt = (P, noise, x, z) => P.galY + 0.3 * galLump(noise, x, P.galY, z);
// (the section is drawn in toward the line z = 1 as well, to a third at the ends; the back wall's four beds step back upward, so its foot
// stands their sum out into the gallery; the roof rises 2.6 m from the back wall's top to the drip line)
const galZ = (P, x, zq) => galMidZ(x) + (zq - galMidZ(x)) * (0.35 + 0.65 * galSqueeze(P, x));
const bedStep = (noise, i) => 0.42 + 0.1 * noise.n2(i * 3.3, 1.1), bedSum = (noise) => bedStep(noise, 0) + bedStep(noise, 1) + bedStep(noise, 2) + bedStep(noise, 3);
export const galOpening = (P, x) => { const s = galSqueeze(P, x); return [P.galY - (P.galY + 3.2) * s, P.galY + (P.galTop + 2.6 - P.galY) * s]; };
export const galFootZ = (P, noise, x) => galZ(P, x, P.galBack + bedSum(noise));
export const galRimZ = (P, x) => galZ(P, x, P.galFront);
export const galRoofAt = (P, noise, x, z) => { const sq = galSqueeze(P, x), pz = galMidZ(x), zq = pz + (z - pz) / (0.35 + 0.65 * sq), f = clamp((zq - P.galBack + 0.4) / (P.lipZ + 2.9 - P.galBack), 0, 1), y = P.galY + (P.galTop + 2.6 * f - P.galY) * sq;
  return y + galLump(noise, x, y, z) * (f > 0.75 ? 0.4 : 1); };
const steps = (a, b, d) => { const o = []; for (let z = a; z > b + d * 0.5; z -= d) o.push(z); o.push(b); return o; };
export async function buildShell(b, P, L, noise, pause = async () => {}) {
  const sm = smoothstep;
  // ----- the gallery: a tube along x, open to the south; its section runs from the foot of the ledge's face up to the floor's edge, back along
  // the floor, up the back wall and forward along the ceiling to the drip line. It closes to a rounded end at each hand (the sections stand
  // closer together toward the ends, so the closing is round and not a fan of long triangles).
  const A = [[P.galFront + 1.6, -3.2], [P.galFront, P.galY], [P.galBack, P.galY], [P.galBack - 0.4, P.galTop], [P.lipZ + 2.5, P.galTop + 2.6]];
  // the section's places are not spread evenly: the ledge's face takes 8 of the 60 steps, the floor 8, the back wall 30 (0.67 m each,
  // to carry its beds and ribs), the roof 14; across, 84 steps (0.95 m in the middle, closer toward the ends, so each end closes as a round cap)
  const CUT = [0, 8, 16, 46, 60], NS = 60, NX = 84;
  const along = (t) => { const k = t * NS; let i = 1; while (i < 4 && CUT[i] < k) i++; const f = (k - CUT[i - 1]) / (CUT[i] - CUT[i - 1]); return [lerp(A[i - 1][0], A[i][0], f), lerp(A[i - 1][1], A[i][1], f), i, f]; };
  const GX = P.galHalf + 4, mouthHalf = 10.5, mouthHigh = 14.8;
  // THE GALLERY'S RELIEF (B2), at the scale of a metre. The back wall is beds of rock: at four heights (every 4.3 m, each wandering half
  // a metre along the wall) it steps back 0.32 to 0.52 m, so each bed's top is a ledge (the wall's foot stands that much, 1.7 m in all, out into the gallery: the cliff's own rock stands close behind the wall's top); ribs of flowstone run down it where the water
  // has run (every 4 to 6 m along the wall, 0.7 m proud at the foot, thinning upward); the roof hangs in lumps of 1.5 m; the ledge's
  // face under the floor is bedded as the wall is.
  const BT = bedSum(noise);
  const bedsAt = (x, y) => { let b = 0; for (let i = 0; i < 4; i++) { const yi = P.galY + 3.2 + i * 4.3 + 0.5 * noise.n2(x * 0.1, i * 7.7); b += bedStep(noise, i) * sm(-0.3, 0.3, y - yi); } return b; };
  const ribAt = (x) => { const r = Math.max(0, 1 - 3.2 * Math.abs(noise.n2(x * 0.22 + 3, 5.5))); return r * r; };
  const reliefZ = (x, q) => { const y = q[1];
    if (q[2] === 3) return BT - bedsAt(x, y) + 0.75 * ribAt(x) * (1.1 - 0.6 * q[3]) * sm(0, 0.12, q[3]) * sm(0.5, 0.85, galSqueeze(P, x));
    if (q[2] === 2) return BT * q[3];
    if (q[2] === 1) return 0.5 * bedsAt(x + 40, y + 13.5) * (1 - q[3]);
    return 0; };
  const reliefY = (x, q) => (q[2] === 4 ? -0.55 * Math.max(0, noise.n3(x * 0.55, 9.9, q[0] * 0.55)) * sm(0, 0.15, q[3]) * (1 - sm(0.8, 1, q[3])) : 0);
  // the opening in the back wall has the passage's own outline, drawn out by e metres (the wall's cells are left out to 1.6 m beyond it; the
  // rim of rock below covers where they end)
  const inMouth = (x, y, z, e = 1.6) => z < P.galBack + BT + 2.2 && Math.abs(x - P.mouthX) < mouthHalf + e && y < P.galY + (mouthHigh + 0.9 * e) * Math.pow(Math.max(0, 1 - ((x - P.mouthX) / (mouthHalf + e)) ** 2), 0.3);
  const galAt = (x, v) => { const q = along(v), s = galSqueeze(P, x), pz = galMidZ(x), py = P.galY;
    const flat = q[2] === 2 ? 0.3 : 1, qy = q[1] + reliefY(x, q), qz = q[0] + reliefZ(x, q), Y = py + (qy - py) * s, Z = pz + (qz - pz) * (0.35 + 0.65 * s), d = galLump(noise, x, Y, Z);
    return [x, Y + d * flat * (v > 0.9 ? 0.4 : 1), Z + d * 0.6 * flat]; };
  const galPt = (u, v) => galAt(GX * (0.12 * (2 * u - 1) + 0.88 * Math.sin((u - 0.5) * Math.PI)), v);
  // (the gallery's places and which of its cells are kept are worked out row by row with a breath between; the grid then only reads them)
  const keepCell = (u, v) => { if (Math.abs(GX * (0.12 * (2 * u - 1) + 0.88 * Math.sin((u - 0.5) * Math.PI)) - P.mouthX) >= mouthHalf + 1.6) return true;
    const p = galPt(u, v); return !(inMouth(p[0], p[1], p[2]) && (along(v)[2] === 3 || p[2] < P.galBack + 1.2)); };
  const gp = new Array((NX + 1) * (NS + 1)), gk = new Uint8Array(NX * NS);
  for (let j = 0; j <= NS; j++) { for (let i = 0; i <= NX; i++) gp[j * (NX + 1) + i] = galPt(i / NX, j / NS);
    if (j < NS) for (let i = 0; i < NX; i++) gk[j * NX + i] = keepCell((i + 0.5) / NX, (j + 0.5) / NS) ? 1 : 0;
    if (j % 8 === 7) await pause(); }
  await pause();
  b.grid(NX, NS, (u, v) => gp[Math.round(v * NS) * (NX + 1) + Math.round(u * NX)], (p) => { const k = 0.5 + 0.5 * noise.n3(p[0] * 0.1, p[1] * 0.1 + 30, p[2] * 0.1); return mix3(STONE_WET, STONE, k * 0.8); },
    { keep: (u, v) => gk[Math.floor(v * NS) * NX + Math.floor(u * NX)] === 1 });
  await pause();
  // the rim of the opening: a rounded lip of rock that stands a metre proud of the wall round the passage's outline, turns in to the passage
  // at its inner edge and goes back into the wall at its outer edge (a ring of 36 by 10). It is the wall's own surface (its beds, ribs
  // and lumps, taken at the same place) with the lip's rise added, so it meets the wall along one clean line.
  b.grid(36, 10, (u, v) => { const a = Math.PI * u, e = lerp(-1.4, 4.2, v) + 0.6 * noise.n2(a * 3 + 11, 2.2) * sm(0, 0.3, v);
    const x = P.mouthX - Math.cos(a) * (mouthHalf + e), yq = P.galY - 0.4 + Math.pow(Math.sin(a), 0.6) * (mouthHigh + 0.9 * e + 0.4);
    const s = galSqueeze(P, x), py = P.galY, w = galAt(x, (CUT[2] + (CUT[3] - CUT[2]) * clamp((yq - P.galY) / (P.galTop - P.galY), 0.02, 1)) / NS);
    const dz = -4 + 5 * sm(-1.5, -0.2, e) - 1.3 * sm(1.0, 4.2, e);
    return [x, py + (yq - py) * s, w[2] + dz]; },
  (p) => { const k = 0.5 + 0.5 * noise.n3(p[0] * 0.1, p[1] * 0.1 + 30, p[2] * 0.1); return mix3(STONE_WET, STONE, k * 0.8); });
  await pause();
  // ----- the passage from the mouth, the chamber over the underground water, the narrowing to the gate
  const zsA = []; for (let z = P.galBack + 1.5; z > P.hallZ0 - 0.5;) { zsA.push(z); const near = Math.min(Math.abs(z - P.bridgeZ0), Math.abs(z - P.bridgeZ1)); z -= near < 2.6 ? 0.9 : 1.5; }
  zsA.push(P.hallZ0 - 1);
  const secA = (z) => { const cw = sm(0, 8, P.bridgeZ0 - z) * sm(0, 8, z - P.bridgeZ1), t = clamp((P.galBack - z) / (P.galBack - P.bridgeZ0), 0, 1);
    const pit = sm(0, 1.4, P.bridgeZ0 - 0.4 - z) * sm(0, 1.4, z - P.bridgeZ1 - 0.4);
    // the passage's walls begin behind the gallery's back wall and wider than its opening (they draw in over 6 m), so the opening's
    // rim is the lip of rock built with the gallery and nothing of the passage stands out into it; its floor runs out to meet the gallery's
    const flare = 5 * sm(P.galBack - 7.5, P.galBack - 1.5, z);
    return { cx: lerp(P.mouthX, P.bridgeX, t * t * (3 - 2 * t)), hw: lerp(10.5, 25, cw) - 1.2 * sm(P.hallZ0 + 5, P.hallZ0, z) + flare, top: P.deckY + lerp(14.2, 27, cw) + flare, bot: lerp(P.galY, P.underY - 3.6, pit) }; };
  const zsW = [P.galBack - 1.6, ...zsA.filter((z) => z < P.galBack - 2.5)];
  tunnel(b, zsW, secA, noise, STONE_WET, 34); await pause(); tunnelFloor(b, [P.galBack + 3.6, P.galBack + 1.5, ...zsA.slice(1)], secA, noise, mix3(STONE_WET, STONE, 0.5), 0);
  await pause();
  // ----- the hall: it opens from the gate to its full breadth within 16 m, wanders a little, and draws in to the end wall
  const zsH = steps(P.hallZ0, P.hallZ1 - 1.5, 2.9);
  const secH = (z) => { const t = P.hallZ0 - z, open = sm(0, 16, t), end = lerp(0.72, 1, sm(0, 40, z - P.hallZ1));
    return { cx: P.hallX + 2.5 * Math.sin(t * 0.035) * sm(0, 30, t) * sm(0, 60, z - P.hallZ1), hw: lerp(9.5, P.hallHalf, open) * end, top: P.deckY + lerp(13.6, P.hallHigh, open) * lerp(0.84, 1, sm(0, 40, z - P.hallZ1)), bot: P.deckY - 0.03 }; };
  tunnel(b, zsH, secH, noise, STONE_LIT, 44); await pause(); tunnelFloor(b, zsH, secH, noise, mix3(STONE, STONE_LIT, 0.55), 1, 0.03);
  await pause();
  // ----- the end wall with its round opening, and the moon-door's rim of dressed stone standing 1.1 m proud of it
  const ring = L.ring, zw = P.hallZ1 - 0.9;
  const wallPt = (u, v) => { const x = P.hallX + (2 * u - 1) * 27, y = P.deckY - 0.5 + v * 36; return [x, y, zw + 0.5 * noise.n2(x * 0.15, y * 0.15)]; };
  b.grid(27, 18, wallPt, (p) => mix3(STONE, STONE_LIT, 0.4 + 0.3 * noise.n2(p[0] * 0.1, p[1] * 0.1)), { keep: (u, v) => { const p = wallPt(u, v); return Math.hypot(p[0] - ring[0], p[1] - ring[1]) > P.rimR - 1.4; } });
  const prof = [[P.ringR + 0.25, -1.6], [P.ringR + 0.25, 0.9], [P.ringR + 0.7, 1.15], [P.rimR - 0.35, 1.15], [P.rimR, 0.8], [P.rimR + 0.15, -0.6]];
  b.grid(56, prof.length - 1, (u, v) => { const k = Math.round(v * (prof.length - 1)), a = u * TAU; return [ring[0] + Math.cos(a) * prof[k][0], ring[1] + Math.sin(a) * prof[k][0], zw + prof[k][1]]; },
    (p, nn, u, v) => { const k = Math.round(v * (prof.length - 1)); return mix3(STONE_LIT, [0.8, 0.84, 0.8], k === 2 || k === 3 ? 0.5 : 0.1); });
  return { secA, secH, zsH };
}

// ------------------------------------------------------------------------------------------------ the bridge, the gate, the furniture
// a stove: a long block with three fire mouths (an ember bed glowing in each, the stone above blackened by old fires), a hearth slab
// before it, three pots on it, a flue up its back
function stoveBody(b, s, fy, DARK) {
  b.at(s.x, 0, s.z, s.rot);
  b.box(0, fy + s.h / 2, -0.2, s.w, s.h, s.d - 0.4, STONE);
  b.grid(21, 8, (u, v) => [(u - 0.5) * s.w, fy + v * s.h, s.d / 2 - 0.38], (p) => { let k = 0;
    for (const hx of [-0.3, 0, 0.3]) { const dx = (p[0] - hx * s.w) / 0.7, up = p[1] - fy - 0.5; k = Math.max(k, Math.exp(-dx * dx * (1 + Math.max(0, up) * 0.8)) * (up < 0.75 && Math.abs(dx) < 0.75 ? 1 : Math.exp(-Math.max(0, up - 0.75) * 0.8))); }
    return mix3(STONE_LIT, SOOT, clamp(k * 1.15, 0, 0.96)); });
  for (const hx of [-0.3, 0, 0.3]) b.grid(6, 2, (u, v) => { const a = Math.PI * u, r = 0.5 * v; return [hx * s.w - Math.cos(a) * r, fy + 0.42 + Math.sin(a) * r * 1.3, s.d / 2 - 0.34 + 0.03 * v]; },
    (p, nn, u, v) => mix3(EMBER_HOT, EMBER, v), { kind: 7 });
  b.box(0, fy + 0.2, s.d / 2 + 0.5, s.w + 0.8, 0.4, 1.8, STONE_LIT);
  for (const hx of [-0.3, 0.02, 0.31]) b.lathe(hx * s.w, fy + s.h, -0.2, jarProfile(0.85, 1.0), 9, DARK);
  b.box(0, fy + s.h + 3, -s.d / 2 + 0.3, 2.2, 6, 1.4, STONE);
  b.home();
}
const EMBER = lin('#e2441a'), EMBER_HOT = lin('#ffd060');
const MELON = lin('#5fa44c'), MELON_D = lin('#2a6a38'), PEACH_A = lin('#f08a4b'), PEACH_B = lin('#f6b0a0'), PEACH_C = lin('#f2c46a');
const bowlProfile = (r) => [[0.3 * r, 0], [0.72 * r, 0.16 * r], [r, 0.52 * r], [1.03 * r, 0.6 * r], [0.9 * r, 0.56 * r]];
const jarProfile = (r, h) => [[0.55 * r, 0], [r, 0.28 * h], [0.97 * r, 0.6 * h], [0.6 * r, 0.88 * h], [0.72 * r, h], [0.62 * r, h * 0.97]];
// b takes what is in sight from before the rock (the bridge, the gate); hb takes what stands in the hall behind the gate (given apart so
// that the world may leave the hall's things undrawn while the cliff's rock stands between them and the eye)
export async function buildHouse(b, P, L, R, noise, sec, pause = async () => {}, hb = b) {
  const fy = L.floorY, DARK = mix3(STONE, [0, 0, 0], 0.25), PALE = mix3(STONE_LIT, [0.8, 0.85, 0.8], 0.3);
  // ----- the iron bridge: plates on two girders, posts every 4 m with two chains between them, two arched ribs under the deck
  { const x = P.bridgeX, za = P.bridgeZ0 + 1.5, zb = P.bridgeZ1 - 1.5, len = za - zb, zm = (za + zb) / 2, hw = P.bridgeW / 2;
    b.box(x, P.deckY - 0.14, zm, P.bridgeW, 0.28, len, IRON, 2);
    // (round 3, A5) THE BRIDGE'S HEAD MEETS THE FLOOR. The deck lies 0.6 m over the passage's floor where it begins. A ramp of iron
    // plate, as broad as the deck, runs from the deck's edge down into the passage's floor over P.headRamp metres (its foot sunk
    // under the floor's lowest lumps). The troop's comers and goers run up and down it; at the bridge's foot the gate's threshold
    // lies on the deck's end (their feet are set on the floor as built, by the world).
    { const zr = za + P.headRamp, yf = P.galY - 0.3;
      b.grid(1, 1, (u, v) => [x + (2 * u - 1) * hw, lerp(P.deckY, yf, v), lerp(za - 0.05, zr, v)], () => IRON, { flip: true, kind: 2 });
      for (const s of [-1, 1]) b.grid(1, 1, (u, v) => [x + s * hw, lerp(yf, lerp(P.deckY, yf, u), v), lerp(za - 0.05, zr, u)], () => mix3(IRON, RUST, 0.25), { flip: s > 0, kind: 2 }); }
    for (const s of [-1, 1]) {
      b.box(x + s * (hw - 0.2), P.deckY - 0.6, zm, 0.4, 0.75, len, mix3(IRON, RUST, 0.25), 2);
      const posts = []; for (let z = za - 1.2; z > zb + 1; z -= 4) posts.push(z);
      for (const z of posts) b.box(x + s * (hw - 0.14), P.deckY + 0.7, z, 0.24, 1.4, 0.24, mix3(IRON, RUST, 0.35), 2);
      for (let i = 0; i + 1 < posts.length; i++) for (const yy of [1.3, 0.72]) { const pts = [];
        for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x + s * (hw - 0.14), P.deckY + yy - 0.34 * Math.sin(Math.PI * t), lerp(posts[i], posts[i + 1], t)]); }
        b.tube(pts, 0.065, 4, mix3(IRON, RUST, 0.5), 2); }
      const rib = []; for (let k = 0; k <= 14; k++) { const t = k / 14; rib.push([x + s * (hw - 0.5), P.deckY - 1.0 - 7.5 * (1 - Math.sin(Math.PI * t)) * 0.9, lerp(za + 2, zb - 2, t)]); }
      b.tube(rib, 0.34, 5, mix3(IRON, RUST, 0.4), 2);
      for (let k = 2; k <= 12; k += 2) b.box(x + s * (hw - 0.5), (rib[k][1] + P.deckY - 0.9) / 2, rib[k][2], 0.22, Math.max(0.2, P.deckY - 0.9 - rib[k][1]), 0.22, IRON, 2);
      await pause();
    } }
  // ----- the gate of the house: two square pillars and a double lintel of dressed stone, a threshold
  { const x = P.hallX, z = P.hallZ0 + 1.4, gw = 7.4, gh = 12;
    for (const s of [-1, 1]) { b.box(x + s * (gw + 1.2), fy + gh / 2, z, 2.4, gh, 2.6, PALE); b.box(x + s * (gw + 1.2), fy + 0.5, z, 3.2, 1.0, 3.4, STONE_LIT); }
    b.box(x, fy + gh + 1.1, z, 2 * gw + 6.4, 2.2, 3.0, PALE); b.box(x, fy + gh + 2.7, z, 2 * gw + 4, 1.0, 2.4, STONE_LIT);
    b.box(x, fy + 0.06, z, 2 * gw, 0.3, 3.2, STONE_LIT, 1); }
  await pause();
  b = hb;
  // ----- the tables with their benches, and the bowls and cups on them
  L.bowls = []; L.benchSeats = []; L.tableThings = [];
  for (const t of L.tables) { const outer = Math.sign(t.x - P.hallX) || 1, tc = Math.cos(t.rot), ts = Math.sin(t.rot);
    b.at(t.x, 0, t.z, t.rot);
    b.box(0, t.top - 0.2, 0, t.w, 0.4, t.len, PALE);
    for (const k of [-0.36, 0, 0.36]) b.box(0, (fy + t.top - 0.4) / 2, k * t.len, t.w * 0.7, t.top - 0.4 - fy, 0.6, STONE);
    for (const s of [-1, 1]) { b.box(s * (t.w / 2 + 1.0), fy + 0.5, 0, 0.7, 0.26, t.len * 0.92, STONE_LIT);
      for (const k of [-0.38, 0, 0.38]) b.box(s * (t.w / 2 + 1.0), fy + 0.19, k * t.len, 0.5, 0.38, 0.5, STONE); }
    const nb = Math.round(t.len * 0.8);
    for (let i = 0; i < nb; i++) { const bx = R.range(-0.95, 0.95), bz = (i + R.range(0.2, 0.8)) / nb * t.len - t.len / 2, r = R.range(0.2, 0.36), tall = R.chance(0.25) && bx * outer > 0.1;
      L.tableThings.push({ x: t.x + bx * tc + bz * ts, z: t.z - bx * ts + bz * tc, y0: t.top, y1: t.top + (tall ? 2.2 : 0.6) * r, r: (tall ? 0.6 : 1.03) * r });
      b.lathe(bx, t.top, bz, tall ? jarProfile(r * 0.6, r * 2.2) : bowlProfile(r), 7, mix3(STONE_LIT, [0.85, 0.88, 0.84], R.range(0, 0.6)), 0, (c, v) => (v > 0.9 ? mix3(c, DARK, 0.6) : c)); }
    b.home();
    const c = Math.cos(t.rot), s2 = Math.sin(t.rot);
    for (const s of [-1, 1]) for (let k = -0.42; k <= 0.43; k += 0.12) { const lx = s * (t.w / 2 + 1.0), lz = k * t.len; L.benchSeats.push({ x: t.x + lx * c + lz * s2, y: fy + 0.63, z: t.z - lx * s2 + lz * c, yaw: t.rot + (s > 0 ? -Math.PI / 2 : Math.PI / 2) }); }
    for (let k = -0.4; k <= 0.41; k += 0.2) L.bowls.push({ x: t.x + k * t.len * s2, y: t.top, z: t.z + k * t.len * c });
    await pause();
  }
  // ----- the stove: a long block with three fire mouths, the stone above each blackened by old fires; pots on it, jars about it
  stoveBody(b, L.stove, fy, DARK);
  for (const j of L.jars) b.lathe(j.x, fy, j.z, jarProfile(j.r, j.h), 9, mix3(STONE, STONE_LIT, R.range(0.2, 0.9)), 0, (c, v) => (v > 0.92 ? mix3(c, SOOT, 0.7) : c));
  await pause();
  // ----- the beds: a slab on two blocks with a stone pillow, no two at one height or one turn
  L.bedTops = [];
  for (const d of L.beds) { b.at(d.x, 0, d.z, d.rot);
    b.box(0, d.top - 0.16, 0, 3.2, 0.32, 1.7, PALE); for (const k of [-1.1, 1.1]) b.box(k, (fy + d.top - 0.32) / 2, 0, 0.6, d.top - 0.32 - fy, 1.5, STONE);
    b.box(-1.25, d.top + 0.1, 0, 0.5, 0.2, 1.2, STONE_LIT); b.home(); L.bedTops.push({ x: d.x, y: d.top, z: d.z, rot: d.rot }); }
  await pause();
  // ----- columns of living rock from floor to roof, thick at both ends, each with its own waist, lumps and lean
  const roofAt = (x, z) => { const q = sec(z), k = clamp((x - q.cx) / q.hw, -0.98, 0.98); return q.bot + Math.pow(Math.sqrt(1 - k * k), 0.6) * (q.top - q.bot); };
  for (const c of L.columns) { const top = roofAt(c.x, c.z) + 2.5, h = top - fy + 0.5;
    b.grid(11, 10, (u, v) => { const a2 = u * TAU, y = fy - 0.5 + v * h, w = (2 * v - 1), r = c.r * (0.75 + 0.9 * w * w * w * w + 0.3 * w * w + 0.3 * noise.n3(Math.cos(a2) * 1.3 + c.seed, v * 4, Math.sin(a2) * 1.3));
      return [c.x + c.lean * h * v + Math.cos(a2) * r, y, c.z - Math.sin(a2) * r]; }, (p, nn, u, v) => mix3(STONE, STONE_LIT, 0.35 + 0.4 * noise.n3(p[0] * 0.2, p[1] * 0.12, p[2] * 0.2))); await pause(); }
  await pause();
  // ----- stone that has dripped from the roof: cones of many lengths, thickest over the hall's sides
  L.drips = []; L.teeth = [];
  for (let i = 0; i < 70; i++) { const z = R.range(P.hallZ1 + 6, P.hallZ0 - 8), q = sec(z), x = q.cx + R.sign() * q.hw * R.range(0.12, 0.8), y = roofAt(x, z) + 0.8, len = R.range(1.5, 6.5), r = len * R.range(0.1, 0.17);
    if (Math.abs(x - L.crack.x) < 7 && z < L.crack.zS + 4) continue;
    b.grid(6, 2, (u, v) => { const a2 = u * TAU, rr = r * (1 - v) * (1 - 0.5 * v); return [x + Math.cos(a2) * rr, y - len * v, z - Math.sin(a2) * rr]; }, () => mix3(STONE, STONE_LIT, 0.5));
    L.teeth.push({ x, z, y0: y - len, y1: y, r });
    if (i % 3 === 0) L.drips.push([x, y - len, z]); }
  // ----- the garden's standing stones: tall, waisted, pitted
  for (const g of L.stones) b.grid(8, 6, (u, v) => { const a2 = u * TAU, r = g.r * (0.55 + 0.6 * Math.sin(Math.PI * Math.min(1, v * 1.15)) + 0.35 * noise.n3(Math.cos(a2) + g.x, v * 3, Math.sin(a2) + g.z)) * (v > 0.97 ? 0.05 : 1);
    return [g.x + Math.cos(a2) * r, fy - 0.2 + v * g.h, g.z - Math.sin(a2) * r]; }, (p) => mix3(STONE, PALE, 0.5 + 0.4 * noise.n3(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5)));
  await pause();
  // ----- the step across the hall's end (three rises), the posts before it, and the seat: plain, tall-backed, empty
  { const st = L.step, zb = P.hallZ1 - 1; for (let i = 0; i < 3; i++) { const zf = st.z + (2 - i) * 1.3; b.box(P.hallX, fy + (i + 0.5) * P.stepH / 3, (zf + zb) / 2, 58 - i * 2, P.stepH / 3, zf - zb, i === 2 ? PALE : STONE_LIT, 1); } }
  for (const p of L.posts) { b.box(p.x, fy + 0.4, p.z, 2.1, 0.8, 2.1, STONE_LIT); b.box(p.x, fy + 0.8 + p.h / 2, p.z, 1.3, p.h, 1.3, PALE); b.box(p.x, fy + 0.8 + p.h + 0.25, p.z, 1.9, 0.5, 1.9, STONE_LIT); b.box(p.x, fy + 1.3 + p.h + 0.35, p.z, 1.1, 0.7, 1.1, PALE); }
  { const s = L.seat, W2 = 4.6; b.at(s.x, s.y, s.z, 0);
    b.box(0, 0.3, 0.3, W2 + 1.6, 0.6, 4.6, STONE_LIT); b.box(0, 1.1, 0, W2, 1.0, 3.2, PALE);
    b.box(0, 0.8, 2.3, 2.6, 0.45, 1.1, STONE_LIT);
    for (const sd of [-1, 1]) { b.box(sd * (W2 / 2 - 0.35), 2.4, 0.1, 0.7, 1.6, 2.9, PALE); b.box(sd * (W2 / 2 - 0.35), 3.3, 0.3, 0.9, 0.25, 3.2, STONE_LIT); }
    b.box(0, 1.6 + (s.h - 2.6) / 2, -1.25, W2, s.h - 2.6, 0.7, PALE); b.box(0, s.h - 0.75, -1.25, W2 - 1.0, 0.5, 0.7, PALE); b.box(0, s.h - 0.25, -1.25, W2 - 2.2, 0.5, 0.7, STONE_LIT);
    b.box(0, 1.6 + (s.h - 3.4) / 2, -0.86, W2 - 1.2, s.h - 4.2, 0.1, STONE_LIT);
    b.home(); }
}

// ----- the home's things (B3, B5), built from layoutHome's list H: stoves and their jars, heaps of fruit, and the walls of the roof's
// crack going up to the sky. The hangings (garlands, the vines down the columns, the strands in the crack) are the kit's vines and are
// built by the world from H's places; here each column's vine gets its line on the column's own skin (H.vines[i].pts).
// (a fruit's own shade and size follow from its number in its heap: whole-number scrambling, the same on every machine)
const hash1 = (i, k) => { let h = (Math.imul(i + 1, 374761393) + Math.imul(k + 1, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export async function buildHome(b, P, L, H, noise, sec, pause = async () => {}) {
  const fy = L.floorY, DARK = mix3(STONE, [0, 0, 0], 0.25);
  for (const st of H.stoves) if (st !== L.stove) stoveBody(b, st, fy, DARK);
  H.jars.forEach((j, i) => b.lathe(j.x, fy, j.z, jarProfile(j.r, j.h), 9, mix3(STONE, STONE_LIT, 0.2 + 0.7 * hash1(i, 3)), 0, (c, v) => (v > 0.92 ? mix3(c, SOOT, 0.7) : c)));
  await pause();
  // heaps: a low mound, and on it the fruit in a spiral from the top outward (peaches 0.17 m, blushing; melons 0.3 m, striped)
  H.heaps.forEach((h, hi) => { const n = h.melon ? 10 : 24, fr = h.melon ? 0.3 : 0.17, base = h.melon ? MELON_D : mix3(PEACH_A, [0.2, 0.1, 0.05], 0.5);
    b.lathe(h.x, fy, h.z, [[h.r, 0], [0.8 * h.r, 0.28 * h.r], [0.42 * h.r, 0.6 * h.r], [0.02, 0.72 * h.r]], 7, base, 5);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, a = h.turn + i * 2.39996, rr = 0.88 * h.r * Math.sqrt(t), y = fy + 0.72 * h.r * (1 - Math.pow(t, 0.8)) * 0.96 + fr * 0.25, k = fr * (0.85 + 0.3 * hash1(i, hi));
      const x = h.x + Math.cos(a) * rr, z = h.z + Math.sin(a) * rr;
      if (h.melon) b.grid(6, 3, (u, v) => { const an = u * TAU, ph = (v - 0.5) * Math.PI; return [x + Math.cos(an) * Math.cos(ph) * k * 1.15, y + Math.sin(ph) * k, z - Math.sin(an) * Math.cos(ph) * k * 1.15]; }, (p, nn, u) => (Math.round(u * 6) % 2 ? MELON : MELON_D), { kind: 5 });
      else { const c = mix3(mix3(PEACH_A, PEACH_B, hash1(i, hi + 7)), PEACH_C, 0.5 * hash1(i, hi + 11)); b.lathe(x, y, z, [[0.9 * k, -0.25 * k], [0.82 * k, 0.5 * k], [0.03 * k, k]], 5, c, 5, (cc, v) => (v > 0.7 ? mix3(cc, PEACH_C, 0.4) : cc)); } } });
  await pause();
  // vines down the columns: a spiral 0.25 m off the column's own skin from under the roof to its end over the floor, six places a turn
  const roofAt = (x, z) => { const q = sec(z), k = clamp((x - q.cx) / q.hw, -0.98, 0.98); return q.bot + Math.pow(Math.sqrt(1 - k * k), 0.6) * (q.top - q.bot); };
  H.vines.forEach((vn, vi) => { const c = vn.c, top = roofAt(c.x, c.z) + 2.5, h = top - fy + 0.5, n = Math.round(vn.turns * 6), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, y = lerp(top - 3, fy + vn.end, t), v = (y - fy + 0.5) / h, w = 2 * v - 1, a2 = vn.ph + vn.dir * vn.turns * TAU * t;
      const r = c.r * (0.75 + 0.9 * w * w * w * w + 0.3 * w * w + 0.3 * noise.n3(Math.cos(a2) * 1.3 + c.seed, v * 4, Math.sin(a2) * 1.3)) + 0.25;
      pts.push([c.x + c.lean * h * v + Math.cos(a2) * r, y, c.z - Math.sin(a2) * r]); }
    vn.pts = pts; });
  await pause();
  // the crack's own walls (kind 6): rock going up 11 m from under the roof's skin on both rims, opening a little toward the sky, ragged;
  // what hangs below the roof's skin is lit as the roof is, what stands above it by the sky
  const zc = []; for (let z = L.crack.zN; z < L.crack.zS + 1.2; z += 2.4) zc.push(Math.min(z, L.crack.zS));
  for (const sd of [-1, 1]) b.grid(zc.length - 1, 3, (u, v) => { const z = zc[Math.round(u * (zc.length - 1))], w = crackHalf(L.crack, z), up = [-3.5, 0.5, 5, 11][Math.round(v * 3)];
    const x = crackMid(L.crack.x, z) + sd * (w + 0.5 + 0.1 * Math.max(up, 0) + 0.45 * noise.n3(z * 0.3, up * 0.3, sd * 9)); return [x, L.roofY + up, z]; },
    (p) => mix3(STONE, STONE_LIT, 0.5 + 0.4 * noise.n3(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3)), { kind: 6 });
}

// ------------------------------------------------------------------------------------------------ the cliff of the fall
// The rock's line under the lip and how high its rim stands at x (the fall pours through a notch: the rim rises to either hand of it, 13 to 20 m
// over the lip at 40 m, and from there sinks to some 25 m at the wall's two ends).
export const wallZ = (P, x) => P.lipZ + 0.0042 * x * x;
export const wallTop = (P, x, noise) => { const a = Math.min(Math.abs(x), WALL_HALF), xc = Math.sign(x) * a;
  const a2 = a + 9 * noise.n2(xc * 0.013 + 7.7, 1.3) * (1 - smoothstep(68, 84, a)), ragged = 5 * noise.n2(xc * 0.03, 4.4) + 2.6 * noise.n2(xc * 0.12, 8.1);
  return P.H + (0.002 * a * a + 9 + ragged) * smoothstep(P.W / 2 - 2, P.W / 2 + 13, a) - (P.H - 2) * (0.4 * smoothstep(38, 50, a2) + 0.6 * smoothstep(60, 83, a2)); };
export const WALL_HALF = 84;
// The face: it leans back in ledges (beds of the rock, 9 to 15 m apart) except over the gallery, where it hangs straight from the lip; its
// top turns back 18 m onto the mountain. B4: buttresses of rock stand out of it from the foot upward (every 9 to 14 m along it, 2.4 m
// proud at the foot, thinning upward), so each ledge is a bed carried by the rock under it; by the fall the rock is dark with wet in
// streaks down the face and green with moss. The gallery's opening is left out of it BY THE GALLERY'S OWN OUTLINE (the roof's edge and
// the ledge's foot at each x, galOpening): the face's own points inside the outline are set on it, so the rock closes round the
// opening with no square hole.
const CLIFF_A = lin('#8b8a76'), CLIFF_B = lin('#a39c84'), CLIFF_WET = lin('#4a544c'), CLIFF_STREAK = lin('#3a443e'), CLIFF_MOSS = lin('#46663a');
export async function buildWall(b, P, noise, R, pause) {
  const ledges = []; for (let y = R.range(10, 16); y < P.H + 30; y += R.range(9, 15)) ledges.push({ y, d: R.range(0.8, 2.6) });
  const openHalf = P.galHalf + 4, inOpening = (x, y) => { if (Math.abs(x) >= openHalf) return null; const o = galOpening(P, x), a = o[0] + 0.5, b2 = o[1] - 0.5; return b2 > a && y > a && y < b2 ? [a, b2] : null; };
  const buttress = (x) => { const r = Math.max(0, 1 - 2.6 * Math.abs(noise.n2(x * 0.085 + 1.7, 9.3))); return r * r; };
  const facePt = (u, v) => { const x = (2 * u - 1) * WALL_HALF, top = wallTop(P, x, noise); let y = -5 + v * (top + 5);
    const io = inOpening(x, y); if (io) y = y - io[0] < io[1] - y ? io[0] : io[1];
    const away = smoothstep(P.galHalf + 2, P.galHalf + 16, Math.abs(x)); let back = 0.05 * Math.max(0, y) * away - 2.4 * buttress(x) * away * (1 - 0.5 * clamp(y / Math.max(top, 1), 0, 1));
    for (const l of ledges) back += l.d * away * smoothstep(-0.7, 0.7, y - l.y - 2.5 * noise.n2(x * 0.04, l.y));
    const d = 2.6 * noise.fbm3(x * 0.035, y * 0.035, 7.7, 3) + 0.7 * noise.n3(x * 0.16, y * 0.16, 2.2);
    return [x, y, wallZ(P, x) - back + d * (0.35 + 0.65 * away) * (v > 0.97 ? 0.3 : 1)]; };
  const tone = (p, nn) => { const k = 0.5 + 0.5 * noise.n3(p[0] * 0.05, p[1] * 0.05, 3), wet = 1 - smoothstep(P.W / 2 - 4, P.W / 2 + 10, Math.abs(p[0])), damp = 1 - smoothstep(P.W / 2, P.W / 2 + 30, Math.abs(p[0]));
    const streak = smoothstep(0.05, 0.5, noise.n2(p[0] * 0.21, 5.5 + p[1] * 0.012)), moss = smoothstep(0.1, 0.55, noise.n2(p[0] * 0.13 + 40, p[1] * 0.13));
    return mix3(mix3(mix3(mix3(CLIFF_A, CLIFF_B, k), CLIFF_WET, 0.6 * wet), CLIFF_STREAK, 0.45 * streak * damp), CLIFF_MOSS, 0.4 * moss * damp); };
  // the face's points are worked out row by row with a breath between; the grid then only reads them
  const NU = 72, NV = 44, pts = new Array((NU + 1) * (NV + 1)), tones = new Array((NU + 1) * (NV + 1));
  for (let j = 0; j <= NV; j++) { for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i; pts[k] = facePt(i / NU, j / NV); tones[k] = tone(pts[k]); } if (pause && j % 6 === 5) await pause(); }
  b.grid(NU, NV, (u, v) => pts[Math.round(v * NV) * (NU + 1) + Math.round(u * NU)], (q, nn, u, v) => tones[Math.round(v * NV) * (NU + 1) + Math.round(u * NU)], { keep: (u, v) => { const x = (2 * u - 1) * WALL_HALF; return !inOpening(x, -5 + v * (wallTop(P, x, noise) + 5)); } });
  if (pause) await pause();
  // the top, turned back onto the mountain
  b.grid(72, 4, (u, v) => { const e = pts[NV * (NU + 1) + Math.round(u * NU)]; return [e[0], e[1] + 5 * v + 1.2 * noise.n2(e[0] * 0.08, v * 3), e[2] - 18 * v]; }, tone);
  return { ledges, faceAt: (x, y) => { const top = wallTop(P, x, noise); return facePt((x / WALL_HALF + 1) / 2, clamp((y + 5) / (top + 5), 0, 1)); }, buttress };
}

// The underground water under the bridge: dark and green, sliding toward its hole in the rock (to the east), carrying the curtain's light
// as moving ripples and a little white where it quickens.
export function caveWaterMaterial(u, side) {
  return new THREE.ShaderMaterial({ uniforms: { ...caveUniforms(u), uFlow: { value: side } }, fog: true,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`varying vec3 vW;
      void main() { vW = (modelMatrix * vec4(position, 1.)).xyz; vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + AIR_GLSL + NOISE_GLSL + CAVE_LIGHT_GLSL + /* glsl */`
      uniform float uFlow; varying vec3 vW;
      float wh(vec2 q) { vec2 f = vec2(uTime * 1.1 * uFlow, 0.); return hNoise(q * .5 - f) * .6 + hNoise(q * 1.3 - f * 1.5 + 5.) * .4; }
      void main() {
        vec2 q = vW.xz; float h = wh(q), hx = wh(q + vec2(.35, 0.)) - h, hz = wh(q + vec2(0., .35)) - h;
        vec3 n = normalize(vec3(-hx * 2.2, 1., -hz * 2.2)), v = normalize(cameraPosition - vW);
        float fres = 1. - clamp(dot(n, v), 0., 1.); fres = fres * fres;
        vec3 body = mix(vec3(.02, .12, .13), vec3(.07, .34, .36), h) * caveLight(vW, n, 1.);
        vec3 dc = normalize(uCurtain - vW); float gl = clamp(dot(reflect(-dc, n), v), 0., 1.); gl *= gl; gl *= gl; gl *= gl; gl *= gl;
        // the white where it quickens is soft and little: three sizes of noise laid at three headings (no edge follows a square of the
        // noise), cut with an edge as broad as the noise's own swing
        vec2 qa = mat2(.8, .6, -.6, .8) * q, qb = mat2(.6, -.8, .8, .6) * q;
        float fn = hNoise(qa * vec2(.3, .7) - vec2(uTime * 1.6 * uFlow, 0.)) * .5 + hNoise(qb * 1.9 - vec2(uTime * 2.2 * uFlow, 0.)) * .3 + hNoise(q * 4.3 - vec2(uTime * 1.3 * uFlow, 7.)) * .2;
        float foam = smoothstep(.52, .86, fn);
        vec3 col = body + uWater * (gl * 1.2 + fres * .08) + foam * .35 * caveLight(vW, vec3(0., 1., 0.), 1.);
        gl_FragColor = vec4(airFog(col, 1.), 1.); }` });
}

// The uniforms every set piece shares; the world writes the hour's colours and the places into them.
export function makeUniforms(P = PLACE, L = null) {
  const V3 = (x, y, z) => ({ value: new THREE.Vector3(x, y, z) }), COL = (h) => ({ value: new THREE.Color(h) });
  return { uTime: { value: 0 }, uSunDir: V3(0.5, 0.6, 0.62),
    uFallLit: COL('#ffffff'), uFallShade: COL('#8fa6c4'), uFallDeep: COL('#3d5a70'), uFallInner: COL('#fff4cf'),
    uMistLit: COL('#ffffff'), uMistShade: COL('#a9bfd6'), uBow: { value: 1 }, uMistAmt: { value: 1 },
    // (round 3, A6) the cave's own air: its colour and its density; the z of the sheet's plane for what lies on both sides of it
    uCaveAir: { value: new THREE.Vector4(0.05, 0.102, 0.098, 0.0038) }, uAirZ: { value: P.sheetZ },
    uCaveAmb: COL('#5f7f7c'), uWaterLight: COL('#ffe9a8'), uCurtain: V3(0, P.galY + 10, P.sheetZ), uShaftDir: V3(0.42, 0.85, 0.3), uShaftCol: COL('#fff0c8'),
    uRing: V3(P.hallX, P.deckY + 10, P.hallZ1 + 1), uRingCol: COL('#ffe9a8'),
    uCrack: { value: new THREE.Vector4(L ? L.crack.x : P.hallX + 13, L ? L.crack.zS : -132, L ? L.crack.zN : -234, L ? L.crack.half : 2.6) },
    uReach: { value: new THREE.Vector4(54, 24, L ? L.roofY : 39.6, 0.15) },
    uGal: { value: new THREE.Vector4(P.galFront, P.galBack, P.galY, P.galTop) }, uFire: { value: [new THREE.Vector4(0, -99, 0, 0), new THREE.Vector4(0, -99, 0, 0), new THREE.Vector4(0, -99, 0, 0)] }, uFireCol: COL('#ff8a3a'),
    uPlum: { value: new THREE.Vector4(0, 0, 8, 0) }, uPetal: COL('#f8d4e0') };
}

// Writes the places into the shared uniforms for a visit mirrored by side.
export function placeUniforms(U, P, L, side) {
  U.uCurtain.value.set(0, P.galY + 10, P.sheetZ); U.uRing.value.set(side * L.ring[0], L.ring[1], L.ring[2] + 1.5);
  U.uShaftDir.value.set(side * L.shaftDir.x, L.shaftDir.y, L.shaftDir.z); U.uCrack.value.set(side * L.crack.x, L.crack.zS, L.crack.zN, L.crack.half); U.uReach.value.z = L.roofY;
}

// the home's lights: a fire in each stove (its middle mouth), and where the plum sheds its petals (px: the plum's place across the hall)
export function homeUniforms(U, L, H, side, px = L.plum.x) {
  H.stoves.slice(0, 3).forEach((st, i) => U.uFire.value[i].set(side * st.fire[0], st.fire[1], st.fire[2], 2.4));
  U.uPlum.value.set(side * px, L.plum.z, 0.75 * L.plum.h, 0);
}

// ------------------------------------------------------------------------------------------------ the hero: cliff, fall, gallery, cave, house
// opts: { P, L, side, U, rockMaterial, crossing: [x, y, z] (where the route goes through the sheet) }. Without opts it stands alone for the viewer.
export async function buildHero(ctx, opts = {}) {
  const P = opts.P || PLACE, side = opts.side || 1, noise = ctx.noise;
  const stream = (n) => ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));
  const ST = { plan: stream('house plan'), ledges: stream('cliff ledges'), rock: stream('cliff rock'), things: stream('house things'), foot: stream('fall mist'), veil: stream('fall veil'), spray: stream('sheet spray'), rays: stream('roof shafts') };
  const L = opts.L || layoutHouse(P, ST.plan), U = opts.U || makeUniforms(P, L);
  // (the home's list comes from the world, which lays it by its margin from its own streams; standing alone the part lays it itself)
  const H = opts.home || layoutHome(P, L, { stoves: stream('house stoves'), heaps: stream('fruit heaps'), hangs: stream('hangings') });
  if (!opts.U) { placeUniforms(U, P, L, side); homeUniforms(U, L, H, side); }
  const object = new THREE.Group();
  // the cliff
  const wb = makeBuilder(side < 0), face = await buildWall(wb, P, noise, ST.ledges, ctx.yield);
  const rockMat = opts.rockMaterial || T.makeRockMaterial({ rng: ST.rock, top: '#4f7a3a', topAmount: 0.75, contact: [8, 0.3, 0] });
  await ctx.yield();
  const wall = new THREE.Mesh(wb.build(false), rockMat); object.add(wall);
  await ctx.yield();
  // the fall
  const fall = await makeFall(P, U, noise, side, ctx.yield); object.add(fall.object);
  await ctx.yield();
  // the gallery, the cave, the house
  const cb = makeBuilder(side < 0), sh = await buildShell(cb, P, L, noise, ctx.yield);
  await ctx.yield();
  const hb = makeBuilder(side < 0);
  await buildHouse(cb, P, L, ST.things, noise, sh.secH, ctx.yield, hb);
  await ctx.yield();
  await buildHome(hb, P, L, H, noise, sh.secH, ctx.yield);
  await ctx.yield();
  const cave = new THREE.Group(), shellGeo = cb.build(true);
  await ctx.yield();
  const shell = new THREE.Mesh(shellGeo, caveMaterial(U)); cave.add(shell);
  // what stands in the hall: a mesh of its own in the shell's material
  const things = new THREE.Mesh(hb.build(true), shell.material); cave.add(things);
  await ctx.yield();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(58, P.bridgeZ0 - P.bridgeZ1 + 6).rotateX(-Math.PI / 2), caveWaterMaterial(U, side));
  water.position.set(side * P.bridgeX, P.underY, (P.bridgeZ0 + P.bridgeZ1) / 2); cave.add(water);
  // the shafts of light under the crack: four sheaves along its line, leaning as the crack's light leans
  const rays = [], S = L.shaftDir;
  for (let i = 0; i < 4; i++) { const z = lerp(L.crack.zS - 9, L.crack.zN + 6, i / 3);
    const r = fx.makeGodRays({ rng: ST.rays, time: U.uTime, position: [side * (L.crack.x + 2.6 * Math.sin(z * 0.11)), L.roofY + 1, z], direction: [-side * S.x, -S.y, -S.z], radius: 9, count: 7, length: 40,
      width: [0.9, 3.4], color: U.uShaftCol.value, intensity: 0.22, fogAmount: 0.3 });
    rays.push(r); cave.add(r.object); await ctx.yield(); }
  object.add(cave);
  await ctx.yield();
  // mist: the foot of the fall boils along its whole breadth, a veil climbs the face, and spray stands in a band along the whole sheet
  // where it passes the gallery (from the ledge's foot to the gallery's roof, 2 m to either side of the sheet): thin puffs, none more
  // than a fifth opaque, sinking with the water (B1: the white at the sheet is water standing at its own place)
  const M = ST.foot, V = ST.veil, SP = ST.spray, puffs = [], zf = P.lipZ + fall.v0 * fall.tMax;
  for (let i = 0; i < 46; i++) puffs.push({ p: [side * M.range(-0.5, 0.5) * (P.W + 6), M.range(0.5, 5), zf + M.range(-2, 9)], size: M.range(7, 15), rise: M.range(0.8, 2.6), drift: [M.range(-0.6, 0.6), M.range(0.4, 2.2)], life: M.range(5, 10), ph: M(), op: M.range(0.34, 0.6), grow: 1.9 });
  for (let i = 0; i < 16; i++) puffs.push({ p: [side * V.range(-0.55, 0.55) * P.W, V.range(8, 46), zf + V.range(-1, 6)], size: V.range(12, 22), rise: V.range(1, 3), drift: [V.range(-0.5, 0.5), V.range(0.3, 1.5)], life: V.range(8, 14), ph: V(), op: V.range(0.1, 0.2), grow: 1.7 });
  for (let i = 0; i < 30; i++) puffs.push({ p: [side * (i + SP()) / 30 * P.W - side * P.W / 2, SP.range(P.galY - 3, P.galTop), P.sheetZ + SP.range(-2, 2)], size: SP.range(2.6, 5), rise: SP.range(-2.2, -0.6), drift: [SP.range(-0.3, 0.3), SP.range(-0.2, 0.5)], life: SP.range(2.2, 4), ph: SP(), op: SP.range(0.09, 0.19), grow: 1.5 });
  const mist = makeMist(puffs, U); object.add(mist.object);
  return {
    object, radius: 90, height: P.H + 14, center: new THREE.Vector3(0, P.H * 0.45, 8), ground: true, groundY: -0.5,
    anchors: { P, L, H }, U, face, wall, fall, cave, shell, things, water, mist, rays, footZ: zf,
    triangles: wb.triangles + fall.triangles + cb.triangles + hb.triangles + mist.triangles,
    update(dt, time, camera) { if (!opts.U) U.uTime.value = time; for (const r of rays) r.update(dt, time, camera); },
  };
}
