// SIXTY FOUNTAINS: hero set piece: "the largest house, last, fires two guns whose jets cross as a pointed arch".
//
// WHAT IT IS
//   The great gassho ("praying hands") farmhouse of the valley on its dry-stone terrace: a 30 m long, 24 m
//   tall thatched prism with a sagging ridge, a metre-thick thatch slab cut to show three stepped layers at
//   eave and verge, a ridge cap of fat straw bundles under long poles, crossed pins and rope, a dark timber
//   gable of four storeys of paper screens, a stone-weighted shingle lean-to over the veranda, curtains of
//   drying persimmons, radishes and corn, firewood, a ladder, reed snow-fence mats half put up, an indigo
//   door cloth, stone lanterns and steps. Either side of the forecourt stands a hydrant hut whose roof halves
//   flip open on hinges to bare a brass gun; the two guns throw crossing fans of water (ballistic streak
//   ribbons + bead droplets + mist) that meet about 30 m up as a pointed arch echoing the gable and fall as
//   bead curtains left and right of a dry gap, in which the exit portal stands. Frost steam smokes off the
//   sunlit roof slope and blue hearth smoke seeps from the ridge.
//
// FRAME (local space, metres)
//   Origin = centre of the terrace footprint at valley-floor level, +Y up. The front gable faces +Z (down
//   the valley, toward the arriving camera). Terrace top y = 1.5 (anchors.terrace). Gable wall plane
//   z = 7, house body z = 7-L .. 7, ridge y = 25.5. radius 32 (house, huts and arch; the low terrace corners
//   reach 39), height 37 (jet crowns).
//
// OPTS
//   palette    7 hex strings [cedar black, weathered thatch, sky blue, water white, persimmon, red, ginkgo]
//   progress   initial 0..1 eruption state (default 1 = both fans standing, so the piece shows alone)
//   sunDir     [x,y,z] WORLD direction toward the sun for the water/steam/thatch shaders. If omitted it is
//              read every few frames from the first DirectionalLight found in the scene the hero is in.
//   sunColor   hex, default '#FFF1D6'
//   wind       [x,y,z] WORLD m/s drift of veils and steam (default [0.9, 0, 1.6], down-valley)
//   houseLength, storeys (3|4), fruit (0..1 persimmon share vs radish/corn), steam (false = no roof vapour),
//   snow (0..1 snow lying on the thatch), paperGlow (HDR glow of the paper screens, for dusk; 0 by day)
//
// PROGRESS (never wall-clock): hero.setProgress(p), p 0..1 for the whole piece, or hero.setProgress(p, i)
//   for gun i (0 = west/-X hut, 1 = east/+X hut). 0 = huts shut, no water. 0..0.12 the roof halves bang
//   open; 0.12..1 the column jumps from the gun and the fan unfurls and falls (the water front is the flight
//   time, so the shape is right at every p); 1 = standing fan, looping on `time`. hero.fire(seconds = 2.4)
//   latches a timed rise from the current value instead (call it once when u crosses your threshold);
//   hero.progress reads the value back; setProgress cancels a running fire(). With progress 0 nothing runs, as the brief requires at u = 0.
//
// ANCHORS (local space; apply hero.object.matrixWorld)
//   portalSeat   { position (0, 9, 21), facing (0,0,1), radius 7 }  centre of the 14 m portal, 14 m in front
//                of the gable, facing the arriving camera; its rim clears the terrace by 0.5 m.
//   flyThrough   6 points on the straight level approach (0, 9, 96 -> 21): >= 6 m from every solid; the
//                crossing jets pass 20 m overhead and the veils fall >= 13 m to either side.
//   viewpoints   reveal (high, east of front), approach (start of the last straight), eaveSide (sun side).
//   guns[2]      { muzzle, toward } of the two brass guns;  crossing = where the two jets cross;
//   fallZones[2] centres of the two veil landing zones (wet stone, ripple rings, mist);
//   gableApex, ridge [front, back], smokeVents[], roofPerches[] (ridge-cap points for crows),
//   terrace { y, xMin, xMax, zMin, zMax } and stairs { z0, z1, halfWidth } for carving terrain.
//
// ALSO EXPORTED: Geo, GLSL_NOISE, makeVapour, makeThatchMaterial and buildRoof (async; with NZ, ND, NV, CS, BS, PS, nB
//   resolution options) so the world builds the other houses of the valley in the same hand; and
//   makeFountains(guns, opts), which builds the same water for any number of guns in 3 draw calls
//   (fan ribbons, bead droplets, mist) so the world can raise the other 58 fans in the same hand. See the
//   comment on the function. The hero uses it for its own two guns.
//
// COST  80-90k triangles by seed (fruit 21k, solids 45k, thatch 16k, water 6k + 3k points), 13 draw calls,
//   about 150-200 ms build. No lights of its own. ctx.quality.detail thins droplets, tufts and steam only.
// LIGHT  made for the brief's morning: a warm directional key (about 3) three-quarter behind the piece, a
//   cold blue hemisphere fill, pale blue exponential fog. Solids are MeshStandardMaterial (vertex colour),
//   water and vapour are unlit linear-HDR ShaderMaterials with scene fog; silver comes from a forward
//   scatter lobe toward the sun (peaks about 1.6-2). No spectral colour anywhere.
import * as THREE from 'three';

const DEF_PALETTE = ['#0E1C18', '#6B5B45', '#5C9AD4', '#F3F8FB', '#F07A1C', '#B4261C', '#E8BC2A'];
const TAN60 = Math.tan(Math.PI / 3), COS60 = 0.5, SIN60 = Math.sin(Math.PI / 3);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------------------------------------------
// Geometry accumulator: non-indexed triangles with per-vertex colour and an optional vec4 extra.
class Geo {
  constructor(nExtra = 0) { this.p = []; this.n = []; this.c = []; this.e = []; this.nExtra = nExtra; this.ex = [0, 0, 0, 0]; this.m = null; this._v = new THREE.Vector3(); }
  get tris() { return this.p.length / 9; }
  tp(a) { if (!this.m) return a; const v = this._v.set(a[0], a[1], a[2]).applyMatrix4(this.m); return [v.x, v.y, v.z]; }
  vert(a, nx, ny, nz, col, s) {
    this.p.push(a[0], a[1], a[2]); this.n.push(nx, ny, nz); this.c.push(col[0] * s, col[1] * s, col[2] * s);
    for (let i = 0; i < this.nExtra; i++) this.e.push(this.ex[i]);
  }
  // flat triangle (points already in local space unless raw = false)
  tri(a, b, c, col, sa = 1, sb = 1, sc = 1, exs = null) {
    a = this.tp(a); b = this.tp(b); c = this.tp(c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (exs) this.ex = exs[0]; this.vert(a, nx, ny, nz, col, sa);
    if (exs) this.ex = exs[1]; this.vert(b, nx, ny, nz, col, sb);
    if (exs) this.ex = exs[2]; this.vert(c, nx, ny, nz, col, sc);
  }
  quad(a, b, c, d, col, sa = 1, sb = 1, sc = 1, sd = 1, exs = null) {
    this.tri(a, b, c, col, sa, sb, sc, exs && [exs[0], exs[1], exs[2]]);
    this.tri(a, c, d, col, sa, sc, sd, exs && [exs[0], exs[2], exs[3]]);
  }
  // box: centre, size; o = { ry, tx, tz (top taper), gb (bottom shade), top (top shade), lean [dx,dz] of the top, noBottom }
  box(cx, cy, cz, sx, sy, sz, col, o = {}) {
    const ry = o.ry || 0, tx = o.tx ?? 1, tz = o.tz ?? 1, gb = o.gb ?? 0.78, ts = o.top ?? 1.06, lean = o.lean || [0, 0];
    const cr = Math.cos(ry), sr = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const P = (x, y, z) => [cx + x * cr + z * sr, cy + y, cz - x * sr + z * cr];
    const b0 = P(-hx, -hy, -hz), b1 = P(hx, -hy, -hz), b2 = P(hx, -hy, hz), b3 = P(-hx, -hy, hz);
    const t0 = P(-hx * tx + lean[0], hy, -hz * tz + lean[1]), t1 = P(hx * tx + lean[0], hy, -hz * tz + lean[1]), t2 = P(hx * tx + lean[0], hy, hz * tz + lean[1]), t3 = P(-hx * tx + lean[0], hy, hz * tz + lean[1]);
    this.quad(b3, b2, t2, t3, col, gb, gb, 1, 1); this.quad(b1, b0, t0, t1, col, gb, gb, 1, 1);
    this.quad(b2, b1, t1, t2, col, gb, gb, 1, 1); this.quad(b0, b3, t3, t0, col, gb, gb, 1, 1);
    this.quad(t3, t2, t1, t0, col, ts, ts, ts, ts);
    if (!o.noBottom) this.quad(b0, b1, b2, b3, col, gb * 0.7, gb * 0.7, gb * 0.7, gb * 0.7);
  }
  // rectangular beam between two points, section w (sideways) x h (up-ish)
  beam(p0, p1, w, h, col, o = {}) {
    const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const len = d.length() || 1; d.divideScalar(len);
    const ref = Math.abs(d.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(d, ref).normalize(), u = new THREE.Vector3().crossVectors(s, d).normalize();
    const C = (p, a, b) => [p[0] + s.x * a * w / 2 + u.x * b * h / 2, p[1] + s.y * a * w / 2 + u.y * b * h / 2, p[2] + s.z * a * w / 2 + u.z * b * h / 2];
    const a0 = C(p0, -1, -1), a1 = C(p0, 1, -1), a2 = C(p0, 1, 1), a3 = C(p0, -1, 1), e0 = C(p1, -1, -1), e1 = C(p1, 1, -1), e2 = C(p1, 1, 1), e3 = C(p1, -1, 1);
    const g = o.gb ?? 0.8, k1 = o.k1 ?? 1;
    this.quad(a0, e0, e1, a1, col, g, g * k1, g * k1, g); this.quad(a2, e2, e3, a3, col, 1.05, 1.05 * k1, 1.05 * k1, 1.05);
    this.quad(a1, e1, e2, a2, col, 0.92, 0.92 * k1, k1, 1); this.quad(a3, e3, e0, a0, col, 1, k1, 0.92 * k1, 0.92);
    if (!o.noCaps) { this.quad(a0, a1, a2, a3, col, g, g, 1, 1); this.quad(e1, e0, e3, e2, col, g, g, 1, 1); }
  }
  // round tapered cylinder between two points with smooth normals; cap = paint the end discs with capCol
  cyl(p0, p1, r0, r1, sides, col, o = {}) {
    p0 = this.tp(p0); p1 = this.tp(p1);
    const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
    const ref = Math.abs(d.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(d, ref).normalize(), u = new THREE.Vector3().crossVectors(s, d).normalize();
    const k0 = o.k0 ?? 1, k1 = o.k1 ?? 1, ring = [];
    for (let i = 0; i <= sides; i++) { const a = (i / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); ring.push([s.x * ca + u.x * sa, s.y * ca + u.y * sa, s.z * ca + u.z * sa]); }
    const at = (p, r, q) => [p[0] + q[0] * r, p[1] + q[1] * r, p[2] + q[2] * r];
    const save = this.m; this.m = null;
    for (let i = 0; i < sides; i++) {
      const q0 = ring[i], q1 = ring[i + 1], A = at(p0, r0, q0), B = at(p0, r0, q1), C = at(p1, r1, q1), D = at(p1, r1, q0);
      const sh0 = 0.82 + 0.18 * q0[1], sh1 = 0.82 + 0.18 * q1[1];
      this.vert(A, q0[0], q0[1], q0[2], col, k0 * sh0); this.vert(C, q1[0], q1[1], q1[2], col, k1 * sh1); this.vert(B, q1[0], q1[1], q1[2], col, k0 * sh1);
      this.vert(A, q0[0], q0[1], q0[2], col, k0 * sh0); this.vert(D, q0[0], q0[1], q0[2], col, k1 * sh0); this.vert(C, q1[0], q1[1], q1[2], col, k1 * sh1);
      if (o.cap) {
        const cc = o.capCol || col;
        this.vert(p0, -d.x, -d.y, -d.z, cc, 0.8); this.vert(A, -d.x, -d.y, -d.z, cc, 1); this.vert(B, -d.x, -d.y, -d.z, cc, 1);
        this.vert(p1, d.x, d.y, d.z, cc, 0.8); this.vert(C, d.x, d.y, d.z, cc, 1); this.vert(D, d.x, d.y, d.z, cc, 1);
      }
    }
    this.m = save;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.nExtra) g.setAttribute('aX', new THREE.Float32BufferAttribute(this.e, this.nExtra));
    g.computeBoundingSphere();
    return g;
  }
  async buildSlowly(ctx) {   // build() for a big piece: hands the page back between attributes
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await ctx.yield();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await ctx.yield();
    if (this.nExtra) { g.setAttribute('aX', new THREE.Float32BufferAttribute(this.e, this.nExtra)); await ctx.yield(); }
    g.computeBoundingSphere();
    return g;
  }
}

// Drying food on a cord, made to be seen from arm's length (the world's eave house hangs the same two). G is a Geo whose aX is
// (depth along the cord, phase, cloth): the caller sets G.ex first. They take no random draws: variety comes from a hash of the place.
const foodHash = (x, y, z, k) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + k * 4.137) * 43758.5453; return s - Math.floor(s); };
// A long white radish hung by its leaves: a green-stained shoulder, a round body, a tapering tail, three crossed leaves tied to the cord at yTop.
function hangRadish(G, x, yTop, z, tipDx, tone, sides = 8, dim = 1) {
  const h = (k) => foodHash(x, yTop, z, k), lx = tipDx / 0.65, lz = (h(1) - 0.5) * 0.09, y0 = yTop - 0.22, at = (d) => [x + lx * d, y0 - d, z + lz * d];
  const k = (0.6 + (tone - 0.7) * 0.83) * dim, cream = mul([0.86, 0.84, 0.76], k), stain = mul(mix3([0.86, 0.84, 0.76], [0.5, 0.58, 0.36], 0.8), k * (0.92 + 0.16 * h(2)));
  G.cyl(at(0), at(0.06), 0.035, 0.075, sides, stain, { k0: 0.85 });
  G.cyl(at(0.06), at(0.39), 0.075, 0.06, sides, cream, { k0: 0.94 });
  G.cyl(at(0.39), at(0.65), 0.06, 0.012, sides, cream, { k1: 0.84 });
  const rot = h(3) * 3.1416;
  for (let i = 0; i < 3; i++) {
    const a = rot + i * 1.047 + (h(4 + i) - 0.5) * 0.4, ca = Math.cos(a), sa = Math.sin(a), w0 = 0.014, w1 = 0.034 + 0.02 * h(7 + i), g = mul([0.2, 0.3, 0.1], (0.8 + 0.5 * h(10 + i)) * dim);
    G.quad([x - ca * w0, yTop + 0.03, z - sa * w0], [x + ca * w0, yTop + 0.03, z + sa * w0], [x + ca * w1, y0 + 0.012, z + sa * w1], [x - ca * w1, y0 + 0.012, z - sa * w1], g, 1.3, 1.3, 0.8, 0.8);
  }
}
// A cob of corn from p0 (the stem end, on the cord) down to p1: kernel rows as alternate light and dark strips, a capped tip, pale husks peeled back up the cord.
function hangCorn(G, p0, p1, col, sides = 7, dim = 1, husks = 3) {
  const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize(), ref = Math.abs(d.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3().crossVectors(d, ref).normalize(), u = new THREE.Vector3().crossVectors(s, d).normalize(), ring = [], a0 = foodHash(p0[0], p0[1], p0[2], 1) * 6.2832;
  for (let i = 0; i <= sides; i++) { const a = a0 + (i / sides) * 6.2832, ca = Math.cos(a), sa = Math.sin(a); ring.push([s.x * ca + u.x * sa, s.y * ca + u.y * sa, s.z * ca + u.z * sa]); }
  const at = (p, r, q) => [p[0] + q[0] * r, p[1] + q[1] * r, p[2] + q[2] * r], c = mul(col, dim), r0 = 0.05, r1 = 0.035, tip = mul(c, 0.6);
  for (let i = 0; i < sides; i++) {
    const q0 = ring[i], q1 = ring[i + 1], kk = i % 2 ? 1.12 : 0.88, A = at(p0, r0, q0), B = at(p0, r0, q1), C = at(p1, r1, q1), D = at(p1, r1, q0);
    G.vert(A, q0[0], q0[1], q0[2], c, kk); G.vert(C, q1[0], q1[1], q1[2], c, kk * 0.9); G.vert(B, q1[0], q1[1], q1[2], c, kk);
    G.vert(A, q0[0], q0[1], q0[2], c, kk); G.vert(D, q0[0], q0[1], q0[2], c, kk * 0.9); G.vert(C, q1[0], q1[1], q1[2], c, kk * 0.9);
    if (husks > 2) { G.vert(p1, d.x, d.y, d.z, tip, 0.8); G.vert(C, d.x, d.y, d.z, tip, 1); G.vert(D, d.x, d.y, d.z, tip, 1); }
  }
  const husk = mul([0.8, 0.72, 0.5], 0.7 * dim);
  for (let i = 0; i < husks; i++) {
    const j = Math.floor((i * sides) / husks), q0 = ring[j], q1 = ring[j + 1], out = 0.015 + 0.03 * foodHash(p0[0], p0[1], p0[2], 2 + i), up = 0.07 + 0.05 * foodHash(p0[0], p0[1], p0[2], 5 + i);
    const A = at(p0, r0, q0), B = at(p0, r0, q1), T0 = [A[0] + q0[0] * out - d.x * up, A[1] + q0[1] * out - d.y * up, A[2] + q0[2] * out - d.z * up], T1 = [B[0] + q1[0] * out * 0.6 - d.x * up * 0.85, B[1] + q1[1] * out * 0.6 - d.y * up * 0.85, B[2] + q1[2] * out * 0.6 - d.z * up * 0.85];
    G.quad(A, B, T1, T0, husk, 0.75, 0.75, 1.15, 1.2);
  }
}

const GLSL_NOISE = /* glsl */`
float sfHash(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
float sfN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(sfHash(i), sfHash(i+vec2(1.,0.)), f.x), mix(sfHash(i+vec2(0.,1.)), sfHash(i+vec2(1.,1.)), f.x), f.y); }
float sfFbm(vec2 p){ return 0.5*sfN(p) + 0.3*sfN(p*2.07+13.1) + 0.2*sfN(p*4.3+41.7); }
`;

// ---------------------------------------------------------------------------------------------------
// Water. One trajectory shared by ribbons and droplets: a parcel launched at (time - t) keeps its launch
// azimuth, so a sweeping gun bends its own fan; horizontal speed dies off (spray drag) so the rise is a
// near-straight spear, the crown hooks over and the fall hangs almost plumb, then drifts down-wind.
const GLSL_TRAJ = /* glsl */`
uniform float uTime; uniform float uProg[NG]; uniform vec3 uWind; uniform float uBufH;
const float GR = 9.8;
vec3 sfTraj(vec3 gun, mat3 rot, vec4 a, vec4 b, float t, float Tap, float drift, vec2 e){      // e: the gun's own sweep rate (rad/s), and how far its fall is carried down-wind
  float launch = uTime - t;
  float az = a.x + b.x*sin(launch*e.x + b.y) + b.w + 0.022*b.z*sin(launch*2.7 + a.w*40.);
  float pulse = 1. + 0.026*sin(launch*4.3 + a.w*17.) + 0.012*sin(launch*9.7 + a.w*5.);
  float h = a.y*pulse*(1. - exp(-1.0*t/Tap));
  float y = GR*Tap*pulse*t - 0.5*GR*t*t;
  vec3 p = gun + rot*vec3(sin(az), 0., cos(az))*h + vec3(0., y, 0.);
  p += rot*vec3(cos(az), 0., -sin(az))*(sin(t*1.7 + a.w*31. + uTime*0.6)*0.05*t*t*b.z);
  float tf = max(t - Tap, 0.);      // seconds past the crest: the falling veil is a sheet of spray, and the wind takes it further than it takes the solid jet
  return p + uWind*(drift*t*t + e.y*tf*tf);
}
float sfProg(float gi){ return uProg[int(max(gi, 0.) + 0.5)]; }
`;

// makeFountains(guns, opts) -> { object, uniforms, count, setProgress(i, p), getProgress(i), update(dt, time, camera, renderer) }
//   guns[i] (all in the local space of the returned object): { position [x,y,z] muzzle, azimuth (rad, 0 = +Z,
//     PI/2 = +X: the way the fan is thrown), range (m, where the far streams land; default 15), apex (m above
//     the muzzle; default 28), spread (0..1 share of range covered by the fan; default 0.45), apexSpread (0.14), lateral (rad of
//     sideways scatter; 0.05), sweep (rad either way; 0.35), sweepPhase, sweepPhaseAdd (0: added to it), sweepRate (rad/s; 0.42), fallDrift (0: m/s2 the wind adds to the fall past the crest, per m/s of wind),
//     steam ([{ p: [x,y,z], v: [x,y,z], s: [size0, size1, life, phase], alpha }]: puffs that rise where the fan lands while it stands; the caller draws them), tearAt (0.3: share of the flight after which the jet breaks into streaks), floorY (where the fall ends; default
//     position.y - 2), strips (24), segments are opts.segments (16), drops (350), width (1), mist (true) }
//   opts: { rng (required), sunDir [x,y,z] world, sunColor, wind [x,y,z] world m/s, water (hex), shade (hex),
//     segments, detail (0..1 thins droplets) }.  Progress per gun as described in the header (0 dry .. 1 standing).
//   Keep object unscaled (rotation and translation only). Call update every frame; pass ctx.renderer.
export function makeFountains(guns, opts = {}) {
  const rng = opts.rng, NG = Math.max(1, guns.length), SEG = opts.segments || 16, detail = opts.detail ?? 1;
  const sun = new THREE.Vector3(0.71, 0.37, -0.6).normalize(); if (opts.sunDir) sun.fromArray(opts.sunDir).normalize();
  const wind = new THREE.Vector3(0.9, 0, 1.6); if (opts.wind) wind.fromArray(opts.wind);
  const U = {
    uTime: { value: 0 }, uProg: { value: new Float32Array(NG) }, uWind: { value: wind },
    uBufH: { value: 1080 }, uSunSide: { value: 1 }, uSun: { value: sun }, uSunCol: { value: new THREE.Color(opts.sunColor || '#FFF1D6') },
    uWater: { value: new THREE.Color(opts.water || '#F3F8FB') }, uShade: { value: new THREE.Color(opts.shade || '#7FA3C8') },
    uFogTop: { value: new THREE.Vector3(0, 0, 0) }, uSkyK: { value: 0 }, uMistK: { value: 1.6 }, uGlowK: { value: 1 },      // uMistK: how much the mist of the fall shows; uGlowK: the warm light the water takes from a low sun behind it
         // uSkyK: 1 = streams seen against the sky are shaded blue-grey with silver edges (a day look); 0 = as lit (dusk)
    // (uFogTop)      // a fog bank the water stands in: top at y = x + y*worldZ, z = how much of the water under it is hidden (0 = none)
  };
  const fogU = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mkU = () => Object.assign({}, fogU, U);
  const defs = { NG }, gunSweep = [];      // gunSweep[i]: [sweep (rad), phase, rate (rad/s)] of gun i, for whoever must know which way a fan leans (its image in still water)
  // ---- ribbons -------------------------------------------------------------------------------------
  const iGun = [], iA = [], iB = [], iC = [], iD = [], dGun = [], dA = [], dB = [], dC = [], dD = [], mP = [], mV = [], mS = [], mK = [];
  guns.forEach((g, gi) => {
    const P = g.position, R = g.range ?? 15, AP = g.apex ?? 28, spread = g.spread ?? 0.45, lat = g.lateral ?? 0.05, aps = g.apexSpread ?? 0.14;
    const sw = g.sweep ?? 0.35, sp = (g.sweepPhase ?? rng.range(0, 6.28)) + (g.sweepPhaseAdd ?? 0), fl = g.floorY ?? P[1] - 2, n = g.strips ?? 24, wd = g.width ?? 1, rate = g.sweepRate ?? opts.sweepRate ?? 0.42, fd = g.fallDrift ?? 0; gunSweep.push([sw, sp, rate]);
    const one = (k, jit) => { // k 0..1 across the fan: 0 = longest, flattest stream
      const r = R * (1 - spread * k) * (1 + jit * rng.range(-0.04, 0.04)), ap = AP * (1 - aps + aps * Math.pow(k, 0.7)) * (1 + jit * rng.range(-0.03, 0.03));
      const tap = Math.sqrt((2 * Math.max(ap, 0.5)) / 9.8), tfl = tap + Math.sqrt((2 * Math.max(ap + P[1] - fl, 0.5)) / 9.8);
      return [r / (1 - Math.exp(-tfl / tap)), ap];   // sfTraj reaches 1 - exp(-t/Tap) of a.y, so this lands the stream at r
    };
    const thin = Math.min(1, 15 / n);   // many overlapping streams: each one thinner before the tear, so the jet never saturates
    for (let i = 0; i < n; i++) {
      const k = (i + rng()) / n, [r, ap] = one(k, 1);
      iGun.push(P[0], P[1], P[2], gi); iA.push(g.azimuth ?? 0, r, ap, rng());
      iB.push(sw, sp, rng.range(0.5, 1.5), rng.range(-lat, lat)); iC.push(fl, rng.range(0.02, 0.07), wd * rng.range(0.75, 1.3), (g.tearAt ?? 0.3) + rng.range(-0.04, 0.05)); iD.push(thin * rng.range(0.75, 1.15), rate, k, fd);
    }
    const nd = Math.round((g.drops ?? 350) * detail);
    for (let i = 0; i < nd; i++) {
      const k = rng(), [r, ap] = one(k, 2.5);
      dGun.push(P[0], P[1], P[2], gi); dA.push(g.azimuth ?? 0, r, ap, rng());
      dB.push(sw, sp, rng.range(0.6, 2.2), rng.gauss() * lat * 1.3); dC.push(fl, rng.range(0.03, 0.11), rng.range(0.09, 0.26) * wd, rng()); dD.push(rate, fd);
    }
    if (g.mist !== false) {
      const az = g.azimuth ?? 0, dx = Math.sin(az), dz = Math.cos(az), m0 = mK.length;
      for (let i = 0; i < 9; i++) { // landing mist, rolling out low along the fall line
        const h = R * (1 - spread * rng()) * rng.range(0.92, 1.02), o = rng.range(-2, 2);
        mP.push(P[0] + dx * h + dz * o, fl + rng.range(0.6, 3.5), P[2] + dz * h - dx * o, gi); mV.push(rng.range(-0.3, 0.3), rng.range(0.25, 0.9), rng.range(-0.3, 0.3), 0.9);
        mS.push(rng.range(2.5, 4), rng.range(6, 9), rng.range(4.5, 8), rng()); mK.push(rng.range(0.035, 0.065)*1.6, 0, 0.5, 1);
      }
      for (let i = 0; i < 4; i++) { // crown spray torn off the top and carried down-wind
        const h = R * (1 - spread * rng()) * rng.range(0.6, 0.95);
        mP.push(P[0] + dx * h, P[1] + AP * rng.range(0.72, 0.98), P[2] + dz * h, gi); mV.push(dx * 0.6, rng.range(-2.2, -0.8), dz * 0.6, 0.55);
        mS.push(rng.range(2, 3.5), rng.range(5, 8), rng.range(4, 6.5), rng()); mK.push(rng.range(0.035, 0.06), 0, 1.0, 1);
      }
      if (g.haze !== false) for (let i = 0; i < 5; i++) { // the veil's own haze: a soft lit body behind the streaks of the fall, sinking with it
        const h = R * (1 - spread * rng()) * rng.range(0.85, 1.0);
        mP.push(P[0] + dx * h, fl + (P[1] + AP - fl) * rng.range(0.25, 0.72), P[2] + dz * h, gi); mV.push(dx * 0.3, rng.range(-3.0, -1.5), dz * 0.3, 0.7);
        mS.push(rng.range(3.2, 4.8), rng.range(6, 8.5), rng.range(3, 5), rng()); mK.push(rng.range(0.028, 0.045), 0, 0.9, 0.6);
      }
      for (let i = 0; i < 2; i++) { // hiss at the nozzle
        mP.push(P[0], P[1] + 0.5, P[2], gi); mV.push(dx * 1.2, 1.4, dz * 1.2, 0.14);
        mS.push(0.8, 3.2, rng.range(1.6, 2.4), rng()); mK.push(0.16, 0, 0.6, 0.4);
      }
      if (g.mistAlpha !== undefined) for (let i = m0; i < mK.length; i += 4) mK[i] *= g.mistAlpha;
    }
    if (g.steam) for (const q of g.steam) { mP.push(q.p[0], q.p[1], q.p[2], gi); mV.push(q.v[0], q.v[1], q.v[2], 0.8); mS.push(q.s[0], q.s[1], q.s[2], q.s[3]); mK.push(q.alpha, 0, 0.7, 1); }      // steam off the thatch where this fan lands, once it stands (no draws here: the caller's own)
  });
  const strip = new THREE.PlaneGeometry(2, 1, 1, SEG); strip.translate(0, 0.5, 0);
  const fanG = new THREE.InstancedBufferGeometry(); fanG.index = strip.index; fanG.setAttribute('position', strip.getAttribute('position'));
  const ia = (arr) => new THREE.InstancedBufferAttribute(new Float32Array(arr), 4);
  fanG.setAttribute('iGun', ia(iGun)); fanG.setAttribute('iA', ia(iA)); fanG.setAttribute('iB', ia(iB)); fanG.setAttribute('iC', ia(iC)); fanG.setAttribute('iD', ia(iD));
  fanG.instanceCount = iGun.length / 4;
  const fanM = new THREE.ShaderMaterial({
    uniforms: mkU(), defines: defs, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iGun; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
      varying vec2 vUv; varying float vAge; varying float vTs; varying float vFront; varying float vSeed; varying vec3 vW; varying float vSideSun; varying float vTear; varying float vPulse; varying float vThin; varying float vNear; varying float vCov; varying float vGun; varying float vMid; varying vec2 vVeil;
      uniform vec3 uSun;
      #include <fog_pars_vertex>
      ${GLSL_TRAJ}
      ${GLSL_NOISE}
      void main(){
        float prog = sfProg(iGun.w);
        float Tap = sqrt(2.*max(iA.z, 0.5)/GR);
        float Tfl = Tap + sqrt(2.*max(iA.z + iGun.y - iC.x, 0.5)/GR);
        float s = position.y;
        float t = Tfl*s*(0.6 + 0.4*s);
        vec3 gw = (modelMatrix*vec4(iGun.xyz, 1.)).xyz; mat3 rot = mat3(modelMatrix);
        vec3 p0 = sfTraj(gw, rot, iA, iB, t, Tap, iC.y, iD.yw);
        vec3 p1 = sfTraj(gw, rot, iA, iB, t + 0.06, Tap, iC.y, iD.yw);
        vec3 tg = p1 - p0; tg /= max(length(tg), 1e-4);
        vec3 toCam = cameraPosition - p0; float dist = max(length(toCam), 1e-3);
        vec3 sd = cross(tg, toCam); sd /= max(length(sd), 1e-4);
        float a = t/Tfl;
        float w = iC.z*(0.04 + 0.42*smoothstep(0.0, iC.w, a) + 0.5*smoothstep(iC.w, 1.0, a));
        float pl = sfN(vec2(iGun.w*7.3 + 0.5, (uTime - t)*4.5));   // pressure pulses, shared by every stream of a gun
        w *= 0.7 + 0.6*pl; vPulse = pl;
        float apA = Tap/Tfl;      // (where along the stream its crest is)
        { vec3 thr = rot*vec3(sin(iA.x), 0., cos(iA.x)); float es = dot(thr.xz, uSun.xz)/max(length(uSun.xz), 1e-3);      // which end of the veil is the sun's: its far streams if it throws toward the sun, its near ones if away
          vVeil = vec2(apA, mix(iD.z, 1. - iD.z, smoothstep(-0.35, 0.35, es))); }
        vNear = 1. - smoothstep(7., 13., dist);                       // close to the lens a ribbon is a few thin ropes, never a metre-wide lobe
        vMid = 1. - smoothstep(18., 74., dist);                       // within about 40 m a fan is threads, beads and gaps the scene shows through, never a white sheet
        w = mix(w, min(w, 0.35), vNear);
        float wTrue = w;
        w = max(w, dist*2.4/(max(projectionMatrix[1][1], 0.1)*uBufH)); vThin = iD.x;
        vCov = mix(1., clamp(wTrue/max(w, 1e-4), 0., 1.), 1. - smoothstep(70., 150., dist));      // a stream held at its least width pays for it in alpha (near and middle distance only: far fans keep their light)
        vec3 p = p0 + sd*(position.x*w);
        float tau = clamp((prog - 0.12)/0.88, 0., 1.)*Tfl*1.14;
        vUv = vec2(position.x, s); vAge = a; vTs = t; vFront = t - tau; vSeed = iA.w; vW = p; vSideSun = dot(sd, uSun); vTear = iC.w; vGun = iGun.w*3.71 + 0.5;
        vec4 mvPosition = viewMatrix*vec4(p, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vAge; varying float vTs; varying float vFront; varying float vSeed; varying vec3 vW; varying float vSideSun; varying float vTear; varying float vPulse; varying float vThin; varying float vNear; varying float vCov; varying float vGun; varying float vMid; varying vec2 vVeil;
      uniform float uTime; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uWater; uniform vec3 uShade; uniform vec3 uFogTop; uniform float uSkyK; uniform float uGlowK;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        // Varyings that change across a ribbon are clamped to their own range before use: on a ribbon a pixel or less wide, multisampling evaluates them outside
        // the triangle, and an unclamped one inside a product lit single pixels as glowing squares (antialiased frames only; nothing moves without it).
        float c = clamp(vUv.x, -1., 1.), a = clamp(vAge, 0., 1.), L = uTime - vTs, sd = vSeed*61.7;
        float nr = clamp(vNear, 0., 1.), md = clamp(vMid, 0., 1.), cov = clamp(vCov, 0., 1.), pls = clamp(vPulse, 0., 1.), thin = clamp(vThin, 0., 1.2), sideSun = clamp(vSideSun, -1., 1.);
        // Water, not static: every break in a stream is a long thread that travels with it (metres along the flow, a hand across) and the
        // alpha is a soft ramp, never a switch; each stream has a bright core and translucent edges.
        float n1 = sfN(vec2(c*1.4 + sd, L*1.5));
        float n2 = sfN(vec2(c*3.4 + sd*1.7, L*3.6));
        float n3 = sfN(vec2(c*mix(mix(7.5, 13., md), 12., nr) + sd*0.37, L*mix(8., 11., md)));
        float tear = smoothstep(vTear - 0.14, vTear + 0.12, a);
        float apA = clamp(vVeil.x, 0.2, 0.8), sunw = clamp(vVeil.y, 0., 1.);
        float crest = smoothstep(apA - 0.2, apA - 0.04, a)*(1. - smoothstep(apA + 0.05, apA + 0.24, a)), fall = smoothstep(apA + 0.06, apA + 0.3, a);      // the crest of the stream, and its fall
        float rope = sfN(vec2(c*2.3 + sd*0.7, L*4.5));       // long streaks that travel with the water: the jet is ropes, not a plank
        float body = mix(0.5*n1 + 0.5*rope, 0.3*n1 + 0.4*n2 + 0.3*n3, mix(0.25 + 0.75*tear, 1., nr));
        body = mix(body, 0.16*n1 + 0.3*n2 + 0.54*n3, md*(1. - nr));      // near the eye the fine threads carry the stream
        float thr = mix(0.12, 0.38 + (vSeed - 0.5)*0.14 + 0.1*smoothstep(0.5, 1., a), tear) + (0.5 - pls)*mix(0.3, 0.14, tear);
        thr += md*mix(0.3, 0.15, tear);                                   // and more of each ribbon is gap: the village is seen between the threads
        float k = smoothstep(thr, thr + mix(mix(0.5, 0.36, tear), 0.1, md), body);
        k = max(k, 1. - smoothstep(0.0, 0.02, a));
        float ac = abs(c) + (n2 - 0.5)*mix(0.2, 0.34, tear)*(1. - 0.5*nr);
        float prof = clamp(1. - ac*ac, 0., 1.); prof *= prof;
        float core = exp(-ac*ac*mix(14., 7., tear));
        float alpha = (prof*(mix(0.1, 0.0, md) + 0.9*k) + 0.3*core*k)*mix(0.6*mix(thin, 1., smoothstep(0.0, 0.03, 0.03 - a)), 0.5*mix(1., thin, 0.7*(1. - smoothstep(0.22, 0.6, a))), tear);
        alpha *= mix(1., mix(0.45, 1., cov), tear);
        alpha *= mix(1., 0.35 + 0.65*smoothstep(0.25, 0.7, sfN(vec2(vSeed*91., L*5.))), tear*(1. - cov));      // a torn stream finer than a pixel comes and goes along its length: threads, never a wire and never dots
        alpha *= 1. - 0.45*nr;
        // The crest: there the water has lost its speed and breaks into beads, a run of them along every stream, each travelling with the water (seconds along the
        // flow are short lengths there). The fall: the streaks open into one soft sheet, most of it on the sun's end of the veil; near the eye it stays threads.
        float beadC = smoothstep(0.46, 0.64, sfN(vec2(c*3.1 + sd*2.3, L*17.)));
        alpha *= mix(1., 0.22 + 1.2*beadC, 0.85*crest);
        alpha += (1. - alpha)*fall*prof*(0.02 + 0.05*sfN(vec2(c*1.3 + sd, L*1.1)))*(0.4 + 0.8*sunw)*(1. - md);
        float dash = smoothstep(0.42, 0.62, sfN(vec2(c*5. + sd*2.3, L*26.)));      // near the eye a torn thread is a run of beads: short dashes that travel with the water
        alpha *= mix(1., 0.25 + 0.95*dash, md*tear*(1. - 0.5*nr));
        { float gapN = 0.6*sfN(vec2(vGun, L*3.2)) + 0.4*sfN(vec2(vSeed*37., L*4.));      // the rising column is pulses of water that travel up the jet, never a smooth white wedge
          alpha *= mix(1., 0.42 + 0.58*smoothstep(0.25, 0.7, gapN), smoothstep(0.015, 0.06, a)*(1. - smoothstep(0.3, 0.55, a))); }      // (while the streams still run bundled together, torn or not)
        alpha *= 1. - smoothstep(-0.2, 0.0, vFront);
        alpha *= smoothstep(0.0, 0.015, a)*(1. - smoothstep(0.93, 1.0, a));
        alpha *= mix(1., smoothstep(-3., 1., vW.y - (uFogTop.x + uFogTop.y*vW.z)), uFogTop.z);      // the jet punches out of the fog bank
        if (alpha < 0.004) discard;
        vec3 V = cameraPosition - vW; float dcam = max(length(V), 1e-4); V /= dcam;
        float fs = clamp(dot(-V, uSun), 0., 1.); fs *= fs; float fw = fs; fs = fs*fs*fs;
        float lit = clamp(mix(0.55, 0.36, uGlowK) + 0.45*c*sideSun + 0.25*uSun.y, 0., 1.);      // the body of the fan is in its own shade: blue-grey, so its silver edges and beads have something to shine against
        vec3 col = mix(uShade, uWater, clamp(lit*mix(0.55, 1., k) + 0.55*core, 0., 1.));
        col = mix(col, uShade*0.8, 0.4*(1. - rope)*nr*(1. - core));      // a jet at arm's length shows shade between its ropes
        float bead = smoothstep(0.55, 0.9, n3)*tear;
        bead = max(bead, 0.9*dash*smoothstep(0.5, 0.8, k)*md*tear);      // (near the eye each dash is a bead that flashes)
        col *= 1. + 0.3*bead + 0.35*smoothstep(-0.9, -0.15, vFront)*step(vFront, 0.)*step(-1.5, vFront);
        col = mix(col, uShade*0.6, 0.3*smoothstep(0.05, 0.3, -V.y)*(1. - fs)*uSkyK);      // looking up at the sky a stream is blue-grey with silver edges, so it reads against a bright sky; against the wall it is as it was
        col += uSunCol*((0.1 + 0.9*fs)*(0.35 + 0.65*k) + 0.2*core*k);      // the core of each stream is solid water: it takes the sun whole
        col += uSunCol*(uGlowK*((0.16 + 0.5*fw)*tear*(1. - smoothstep(0.55, 0.95, a)) + 0.3*bead));      // the torn crown is lit through by the low sun: a warm glow, and beads that flash
        { float gl = 0.5 + 0.5*sin(uTime*(7. + 9.*vSeed) + floor(L*17.)*2.4 + sd);      // each bead of the crest flashes as it turns in the sun: white, a little over the water's own brightness
          col += uWater*(1.1*beadC*crest*gl*gl*gl*gl*(0.45 + 0.55*fw));
          col += (uWater*0.22 + uSunCol*0.14)*(sunw*sunw*fall*(0.5 + 0.5*k)); }      // and the veil is brightest along its sunward edge
        col = clamp(col, vec3(0.), vec3(2.2));
        gl_FragColor = vec4(col, clamp(alpha, 0., 1.));
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));
      }`,
  });
  const fans = new THREE.Mesh(fanG, fanM); fans.frustumCulled = false; fans.renderOrder = 6;
  // ---- bead droplets -------------------------------------------------------------------------------
  const dropG = new THREE.BufferGeometry();
  dropG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((dGun.length / 4) * 3), 3));
  const fa = (arr) => new THREE.Float32BufferAttribute(new Float32Array(arr), 4);
  dropG.setAttribute('iGun', fa(dGun)); dropG.setAttribute('iA', fa(dA)); dropG.setAttribute('iB', fa(dB)); dropG.setAttribute('iC', fa(dC)); dropG.setAttribute('iD', new THREE.Float32BufferAttribute(new Float32Array(dD), 2));
  const dropM = new THREE.ShaderMaterial({
    uniforms: mkU(), defines: defs, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 iGun; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec2 iD;
      varying float vAl; varying float vSeed; varying float vFs; varying vec2 vDir; varying float vNb; varying float vCr;
      uniform vec3 uSun; uniform vec3 uFogTop;
      #include <fog_pars_vertex>
      ${GLSL_TRAJ}
      void main(){
        float prog = sfProg(iGun.w);
        float Tap = sqrt(2.*max(iA.z, 0.5)/GR);
        float Tfl = Tap + sqrt(2.*max(iA.z + iGun.y - iC.x, 0.5)/GR);
        float cyc = uTime/Tfl + iC.w*7.;
        float t = fract(cyc)*Tfl;
        float sd = fract(iA.w*91.7 + floor(cyc)*0.618);
        float a = t/Tfl;
        vec3 gw = (modelMatrix*vec4(iGun.xyz, 1.)).xyz; mat3 rot = mat3(modelMatrix);
        vec3 p = sfTraj(gw, rot, iA, iB, t, Tap, iC.y, iD);
        vec3 pv = sfTraj(gw, rot, iA, iB, t + 0.05, Tap, iC.y, iD) - p;      // where it is going: a falling drop is seen as a short streak, never a dot
        vec3 j = vec3(fract(sd*13.1), fract(sd*37.7), fract(sd*71.3)) - 0.5;
        p += j*(0.25 + 2.6*a*a);
        float tau = clamp((prog - 0.12)/0.88, 0., 1.)*Tfl*1.14;
        vec4 mvPosition = viewMatrix*vec4(p, 1.);
        gl_Position = projectionMatrix*mvPosition;
        float px = iC.z*(0.6 + 0.9*a)*projectionMatrix[1][1]*uBufH*0.5/max(-mvPosition.z, 0.5);
        gl_PointSize = clamp(px*3.4, 3., 44.);
        { vec4 cB = projectionMatrix*viewMatrix*vec4(p + pv, 1.);
          vec2 dd = (cB.xy/max(abs(cB.w), 1e-3) - gl_Position.xy/max(abs(gl_Position.w), 1e-3))*vec2(projectionMatrix[1][1]/max(projectionMatrix[0][0], 1e-3), 1.);
          float dl = length(dd); vDir = dl > 1e-6 ? dd/dl : vec2(0., -1.); }
        vec3 V = cameraPosition - p; float dcam = max(length(V), 1e-4); V /= dcam;
        vNb = 1. - smoothstep(16., 60., dcam);      // within about 40 m a drop is a distinct bead with a short tail
        float fs = max(dot(-V, uSun), 0.); fs *= fs; vFs = fs*fs*fs;
        { float apA = Tap/Tfl; vCr = smoothstep(apA - 0.2, apA - 0.04, a)*(1. - smoothstep(apA + 0.05, apA + 0.24, a)); }      // at the crest of its flight a drop hangs and turns in the sun
        vAl = smoothstep(mix(0.8, 0.3, vCr), mix(2.6, 1.3, vCr), px)*(1. - smoothstep(-0.25, 0., t - tau))*smoothstep(0.03, 0.2, a)*(1. - smoothstep(0.93, 1., a));      // (the beads of the crest are seen from further off than the drops of the fall: they are what glints)
        vAl *= mix(1., smoothstep(-3., 1., p.y - (uFogTop.x + uFogTop.y*p.z)), uFogTop.z);
        vSeed = sd;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying float vAl; varying float vSeed; varying float vFs; varying vec2 vDir; varying float vNb; varying float vCr;
      uniform float uTime; uniform vec3 uSunCol; uniform vec3 uWater;
      #include <fog_pars_fragment>
      void main(){
        vec2 q = (gl_PointCoord - 0.5)*vec2(2., -2.);
        float al = dot(q, vDir), ax = dot(q, vec2(-vDir.y, vDir.x));
        float streak = (1. - smoothstep(0.35, 1., abs(al)))*(1. - smoothstep(0.06, 0.26, abs(ax)))*(0.55 + 0.45*smoothstep(-0.6, 0.6, al));      // a streak, brightest at its head
        float head = 1. - smoothstep(0.1, 0.3, length(q - vDir*0.42));                                                                              // and near the eye a round bead at its head
        float alpha = vAl*max(streak*(1. - 0.35*vNb), 1.4*head*vNb);
        if (alpha < 0.01) discard;
        float tw = step(0.72, fract(vSeed*57.3 + floor(uTime*7. + vSeed*9.)*0.381));
        float cr = clamp(vCr, 0., 1.), gl = 0.5 + 0.5*sin(uTime*(6. + 8.*fract(vSeed*7.7)) + vSeed*40.); gl *= gl; gl *= gl;      // the crest's beads flash white, each at its own beat
        vec3 col = max(uWater*(1.02 + 0.9*cr*gl) + uSunCol*(0.18 + 1.1*vFs + 0.3*tw + 0.35*head*vNb), vec3(0.));
        gl_FragColor = vec4(col, clamp(alpha*0.7, 0., 1.));
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));
      }`,
  });
  const drops = new THREE.Points(dropG, dropM); drops.frustumCulled = false; drops.renderOrder = 7;
  // ---- mist ----------------------------------------------------------------------------------------
  const mist = makeVapour({ P: mP, V: mV, S: mS, K: mK }, mkU(), NG); mist.renderOrder = 5;
  const object = new THREE.Group(); object.name = 'fountains'; object.add(mist, fans, drops);
  const size = new THREE.Vector2(); let fireKeys = null;
  return {
    object, uniforms: U, count: guns.length, fans, drops, mist, gunSweep,
    // Water in the order its guns fire. orderByFiring(keys) (keys: one number per gun, the caller's own measure of when it fires; call it once, when they are
    // known) puts every gun's ribbons, drops and puffs in that order; after that setFired(key) sends to be drawn only those of guns whose number is at or under
    // key: a gun that has not fired has no water, and none of it is drawn. Never called: everything is always drawn.
    orderByFiring(keys) {
      const sortAttrs = (geo, names, gunName, isInst) => { const ga = geo.getAttribute(gunName), n = ga.count, gun = Array.from({ length: n }, (_, i) => ga.getW(i)), ord = gun.map((_, i) => i).sort((a, b) => keys[gun[a]] - keys[gun[b]] || a - b);
        for (const nm of names) { const at = geo.getAttribute(nm), w = at.itemSize, src = at.array.slice(); ord.forEach((si, k) => { for (let q = 0; q < w; q++) at.array[k * w + q] = src[si * w + q]; }); at.needsUpdate = true; }
        return ord.map((i) => keys[gun[i]]); };
      fireKeys = { fan: sortAttrs(fanG, ['iGun', 'iA', 'iB', 'iC', 'iD'], 'iGun'), drop: sortAttrs(dropG, ['iGun', 'iA', 'iB', 'iC', 'iD'], 'iGun'), mist: sortAttrs(mist.geometry, ['iP', 'iV', 'iS', 'iK'], 'iP') };
    },
    setFired(key) {
      if (!fireKeys) return; const cnt = (ks) => { let lo = 0, hi = ks.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ks[m] <= key) lo = m + 1; else hi = m; } return lo; };
      const nf = cnt(fireKeys.fan), nd = cnt(fireKeys.drop), nm = cnt(fireKeys.mist);
      fanG.instanceCount = nf; fans.visible = nf > 0; dropG.setDrawRange(0, nd); drops.visible = nd > 0; mist.geometry.instanceCount = nm; mist.visible = nm > 0;
    },
    setProgress(i, p) { U.uProg.value[i] = Math.min(1, Math.max(0, p)); },
    getProgress(i) { return U.uProg.value[i]; },
    update(dt, time, camera, renderer) {
      U.uTime.value = time;
      if (renderer) { renderer.getDrawingBufferSize(size); U.uBufH.value = size.y; }
    },
  };
}

// Soft camera-facing puffs in one instanced draw: P = origin xyz + gun index (-1 = always on), V = velocity
// xyz + progress threshold (gun index -2 / -3 = only while the sun is on the local +X / -X side), S = size0, size1, life (s), phase, K = alpha, blue (0 mist .. 1 woodsmoke), wind share, wobble.
function makeVapour(d, uniforms, NG) {
  const quad = new THREE.PlaneGeometry(2, 2);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  const ia = (arr) => new THREE.InstancedBufferAttribute(new Float32Array(arr), 4);
  g.setAttribute('iP', ia(d.P)); g.setAttribute('iV', ia(d.V)); g.setAttribute('iS', ia(d.S)); g.setAttribute('iK', ia(d.K));
  g.instanceCount = d.P.length / 4;
  const m = new THREE.ShaderMaterial({
    uniforms, defines: { NG }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 iP; attribute vec4 iV; attribute vec4 iS; attribute vec4 iK;
      varying vec2 vUv; varying float vAl; varying float vBlue; varying float vSeed; varying float vFs;
      uniform float uTime; uniform float uProg[NG]; uniform vec3 uWind; uniform vec3 uSun; uniform float uSunSide; uniform float uMistK;
      #include <fog_pars_vertex>
      void main(){
        float life = max(iS.z, 0.1);
        float age = fract(uTime/life + iS.w);
        vec3 o = (modelMatrix*vec4(iP.xyz, 1.)).xyz + mat3(modelMatrix)*iV.xyz*(age*life) + uWind*(iK.z*age*life);
        o.x += sin(age*5. + iS.w*40.)*0.5*iK.w; o.z += cos(age*4. + iS.w*23.)*0.5*iK.w;
        float size = mix(iS.x, iS.y, age);
        vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 p = o + (rt*position.x + up*position.y)*size;
        float gate = iP.w < -0.5 ? (iP.w < -1.5 ? step(0., iP.w < -2.5 ? -uSunSide : uSunSide) : 1.) : smoothstep(iV.w, iV.w + 0.12, uProg[int(max(iP.w, 0.) + 0.5)]);
        vAl = iK.x*mix(uMistK, 1., step(0.5, iK.y))*gate*smoothstep(0., 0.22, age)*(1. - smoothstep(0.45, 1., age));
        vUv = position.xy; vBlue = iK.y; vSeed = iS.w*17.;
        vec3 V = cameraPosition - o; float dcam = max(length(V), 1e-4); V /= dcam;
        vAl *= iP.w > -0.5 ? mix(0.18, 1., smoothstep(12., 66., dcam)) : 1.;
             // a fan's own mist thins within 40 m of the eye: the water there is threads and beads, and the scene shows through (roof steam and smoke are as they were)
        float fs = max(dot(-V, uSun), 0.); vFs = fs*fs*fs + 0.3*fs;      // a narrow lobe and a broad one: mist anywhere toward the sun's side of the sky takes its warmth
        vec4 mvPosition = viewMatrix*vec4(p, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vAl; varying float vBlue; varying float vSeed; varying float vFs;
      uniform float uTime; uniform vec3 uSunCol; uniform vec3 uWater;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float r = length(vUv);
        float n = sfFbm(vUv*1.7 + vSeed + vec2(0., -uTime*0.12));
        float alpha = clamp(vAl, 0., 4.)*(1. - smoothstep(0.15, 1., r + (n - 0.5)*0.55));
        if (alpha < 0.003) discard;
        float fsv = clamp(vFs, 0., 1.3);      // (kept to its own range: multisampling can run a varying past it on an edge-on card)
        vec3 mistC = uWater*(0.7 + 0.25*n) + uSunCol*(0.08 + 0.7*fsv);
        vec3 smokeC = vec3(0.36, 0.47, 0.66)*(0.75 + 0.4*n) + uSunCol*(0.35*fsv);
        gl_FragColor = vec4(max(mix(mistC, smokeC, vBlue), vec3(0.)), clamp(alpha, 0., 1.));
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------
// Thatch: MeshStandardMaterial (scene lights, fog) with procedural straw. aX = (along m, down-slope m, kind, tip)
// kind 0 slope (0..0.4 = 0.4 x the share of the way from ridge to eave, which the snow reads), 1 cut straw ends (down = layer
// coordinate), 2 bundles and ridge cap, 3 underside (reed layers, rafters, lit only by uBounce, the light thrown up off the
// ground), 5 tufts. uSnow lays a slab of snow with a ragged lip above the eave, slid strips and blue shade (albedo capped near
// 0.6, no straw rim on it); a running fan cuts dark wet stripes through it (tSfWet and uSfWet*: see below; off unless given).
function makeThatchMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  // the wet mask is the world's to give (tSfWet: its village map, uSfWetR: x0, 1/w, z0, 1/h, uSfWetK: mirror, on, u; uSfWetH: x, z, radius, threshold in u); off by default
  const WET = { tSfWet: { value: null }, uSfWetR: { value: new THREE.Vector4(0, 1, 0, 1) }, uSfWetK: { value: new THREE.Vector4(1, 0, 0, 0) }, uSfWetH: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 9)) },
    uSfMist: { value: new THREE.Vector4(0, 0, 0, 0) }, uSfMistC: { value: new THREE.Color(1, 1, 1) } };      // a fog bank the roofs stand in (the world's to give): top y = x + y*worldZ, z = extinction per metre, w = strength (0 = none)
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, WET, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aX; varying vec4 vTh; varying vec3 vON; varying vec3 vOP; varying vec4 vSfW; varying float vSfY; uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTh = aX; vON = normal; vOP = position;
        transformed.xz += vec2(sin(uTime*2.3 + position.z*1.7 + position.x), cos(uTime*1.9 + position.x*1.3))*(0.05*max(aX.w, 0.));
        { vec4 sfw = vec4(position, 1.); vec3 sfu = vec3(normal.x > 0. ? -1. : 1., 0., 0.);      // world xz, and the way up the slope, for the wet stripes
          #ifdef USE_INSTANCING
            sfw = instanceMatrix*sfw; sfu = mat3(instanceMatrix)*sfu;
          #endif
          sfw = modelMatrix*sfw; sfu = mat3(modelMatrix)*sfu; vSfW = vec4(sfw.xz, sfu.xz); vSfY = sfw.y; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <fog_fragment>', `{ float sfTop = uSfMist.x + uSfMist.y*vSfW.y;      // standing in the fog bank: the lower roof dissolves into it, more with distance
          float sfM = (1. - smoothstep(sfTop - 4., sfTop + 2., vSfY))*mix(0.6, 1., 1. - smoothstep(sfTop - 9.5, sfTop - 5., vSfY))*(1. - exp(-length(vViewPosition)*uSfMist.z*(cameraPosition.y > sfTop ? clamp((sfTop - vSfY)/max(cameraPosition.y - vSfY, 1e-3), 0., 1.) : 1.)))*uSfMist.w*(1. - smoothstep(-440., -400., vSfW.y));      // palest at the feet
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uSfMistC, sfM); }
        #include <fog_fragment>`)
      .replace('#include <common>', `#include <common>
        varying vec4 vTh; varying vec3 vON; varying vec3 vOP; varying vec4 vSfW; varying float vSfY; uniform vec4 uSfMist; uniform vec3 uSfMistC; uniform float uTime;
        uniform float uSunSide; uniform vec3 uSunW; uniform vec3 uMoss; uniform vec3 uFrost; uniform vec3 uFresh; uniform vec4 uPatch[3]; uniform float uSL; uniform float uSnow; uniform float uBounce;
        uniform sampler2D tSfWet; uniform vec4 uSfWetR; uniform vec4 uSfWetK; uniform vec4 uSfWetH[3];
        ${GLSL_NOISE}
        // Where a running fan lands (world xz): the village map's wet channel, gated by the wave's threshold at that z, plus three hand-placed discs.
        float sfWetAt(vec2 w){
          vec2 q = vec2(w.x*uSfWetK.x, w.y);
          vec2 uv = vec2((q.x - uSfWetR.x)*uSfWetR.y, (q.y - uSfWetR.z)*uSfWetR.w);
          float inb = step(0.004, uv.x)*step(uv.x, 0.996)*step(0.004, uv.y)*step(uv.y, 0.996);
          float thr = mix(0.2, 0.56, clamp((-424. - q.y)/465., 0., 1.)) + 0.03;      // the world's village wave (its WAVE0 and WAVE1)
          float m = textureLod(tSfWet, clamp(uv, 0., 1.), 0.).b*inb*smoothstep(thr, thr + 0.035, uSfWetK.z);
          for (int i = 0; i < 3; i++) { vec4 h = uSfWetH[i]; float d = length(w - h.xy)/max(h.z, 0.1); m = max(m, (1. - smoothstep(0.5, 1., d))*smoothstep(h.w, h.w + 0.035, uSfWetK.z)); }
          return m*uSfWetK.y;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float sfSnowM;
        {
          float along = vTh.x, down = vTh.y, kind = vTh.z;
          vec3 b = diffuseColor.rgb; sfSnowM = 0.;
          float shaded = smoothstep(-0.2, 0.2, -vON.x*uSunSide);
          if (kind < 0.5) {
            float rag = (sfN(vec2(along*2.3, floor(down/0.6)*7.3)) - 0.5)*0.3 + (sfN(vec2(along*9., down*0.4)) - 0.5)*0.14;
            float cq = down/0.6 + rag, cf = fract(cq), cid = floor(cq);
            float st = sfN(vec2(along*34., down*1.3 + cid*5.)), st2 = sfN(vec2(along*80., down*3.));
            float crs = mix(0.46, 1., smoothstep(0., 0.2, cf))*(1. + 0.24*smoothstep(0.76, 1., cf));
            b *= crs;
            b *= 0.88 + 0.24*sfHash(vec2(cid, 3.));
            b *= 0.72 + 0.38*st + 0.18*st2;
            b *= 0.66 + 0.62*sfN(vec2(along*0.55, down*0.09 + 3.));
            for (int i = 0; i < 3; i++) {
              vec4 pp = uPatch[i];
              float e = (sfN(vec2(along*3., down*3.) + float(i)*9.) - 0.5)*0.5;
              float pa = (1. - smoothstep(pp.z - 0.15, pp.z + 0.1, abs(along - pp.x) + e))*(1. - smoothstep(pp.w - 0.15, pp.w + 0.1, abs(down - abs(pp.y)) + e));
              b = mix(b, uFresh*(0.7 + 0.5*st)*mix(0.5, 1., smoothstep(0., 0.2, cf)), 0.6*pa*step(0., pp.y*vON.x));
            }
            float mN = sfFbm(vec2(along*0.3, down*0.28) + 7.);
            float moss = smoothstep(0.5, 0.78, mN + shaded*0.2 + (down/uSL)*0.16 - 0.15 + (st - 0.5)*0.12);
            b = mix(b, uMoss*(0.6 + 0.8*st), moss*0.8);
            float fr = shaded*mix(0.45, 1., smoothstep(0.3, 0.85, cf))*(0.3 + 0.7*smoothstep(0.3, 0.65, sfFbm(vec2(along*0.6, down*0.45) + 31.)))*(0.45 + 0.75*st2)*(0.5 + 0.8*st);
            b = mix(b, uFrost, min(fr*0.95, 0.55)*(1. - 0.7*moss));
            // wet: where a fan lands and where that water runs down to the eave, in streaks
            float wet0 = max(sfWetAt(vSfW.xy), max(sfWetAt(vSfW.xy + vSfW.zw*3.5), 0.85*sfWetAt(vSfW.xy + vSfW.zw*7.)));
            float wet = smoothstep(0.28, 0.68, wet0 + (sfN(vec2(along*1.1, down*0.1) + 5.) - 0.5)*0.55);
            b *= mix(vec3(1.), vec3(0.4, 0.42, 0.46), wet);
            // the patter: where a fan's water is coming down on the straw, each drop throws up a white crown for a moment and a ring that runs out and dies.
            // (Three to the metre; they fade to nothing before a crown is finer than a pixel.)
            { float pk = smoothstep(0.35, 0.7, sfWetAt(vSfW.xy))*(1. - smoothstep(0.03, 0.11, fwidth(along)*3.2));
              vec2 pc = vec2(along, down)*3.2, pid = floor(pc); float ph = sfHash(pid + 3.1), tt = fract(uTime*(1.1 + 0.9*ph) + ph*17.);
              vec2 pf = fract(pc) - 0.5 - (vec2(sfHash(pid + 7.7), sfHash(pid + 1.9)) - 0.5)*0.5; float rr = length(pf);
              float crown = (1. - smoothstep(0.03, 0.1, rr))*(1. - smoothstep(0.0, 0.3, tt)), ring = (1. - smoothstep(0.012, 0.05, abs(rr - 0.34*tt)))*(1. - tt)*(1. - tt);
              b = mix(b, vec3(0.86, 0.9, 0.96), pk*max(crown, 0.5*ring)*step(sfHash(pid + 5.3), 0.8)); }
            // snow (kind carries 0.4 x the share of the slope from ridge to eave): it lies in a slab with a ragged lower lip above the eave, thins among the
            // ridge bundles, has slid off in strips, keeps the roof's courses as soft steps, and is cut to dark wet thatch by the water
            float dn = clamp(kind*2.5, 0., 1.), gapM = (1. - dn)*14.;
            float lipAt = 0.9 + 1.7*sfN(vec2(along*0.33, 2.)) + 0.5*sfN(vec2(along*1.9, 9.));
            float cov = smoothstep(0.26, 0.5, sfFbm(vec2(along*0.21, down*0.17) + 3.) + 0.62*uSnow - 0.2 + 0.12*shaded + (st - 0.5)*0.1);
            float slid = smoothstep(0.78, 0.87, sfN(vec2(along*0.8 + 4., down*0.05)) + 0.1*dn)*smoothstep(0.3, 0.65, dn);
            float low = smoothstep(lipAt - 0.14, lipAt + 0.14, gapM + (st - 0.5)*0.25);
            float sn = cov*low*(1. - 0.9*slid*(1. - 0.5*shaded))*smoothstep(0.9, 2.6, down + (st2 - 0.5)*1.2)*(1. - wet)*step(0.01, uSnow)*min(1., uSnow*1.6);
            sn *= mix(1., smoothstep(0.4, 1.6, -vTh.w - 1. + (st - 0.5)*1.2 + (sfN(vec2(down*0.7, along*0.2 + 5.)) - 0.5)*1.1), step(0.5, -vTh.w));      // ragged at the verges: the slab does not end in a ruled line
            vec3 snC = mix(vec3(0.6, 0.61, 0.63), vec3(0.43, 0.5, 0.63), 0.75*smoothstep(0.3, 1., dn) + 0.15*(1. - cov));
            snC *= mix(1., 0.68 + 0.32*smoothstep(0., 0.55, cf), 0.9)*(0.93 + 0.14*st2);          // the courses, drifted over
            snC *= 0.9 + 0.2*sfN(vec2(along*0.25, down*0.2));                                     // drifts: a slow tone across the slab
            snC *= 1. + 0.12*(1. - smoothstep(0., 0.45, gapM - lipAt));                           // the lip of the slab catches the light
            b *= 1. - 0.5*smoothstep(lipAt - 0.5, lipAt - 0.14, gapM)*(1. - low)*step(0.01, uSnow)*cov;   // and throws a shadow on the straw under it
            b = mix(b, snC, sn); sfSnowM = sn;
          } else if (kind < 1.5) {
            float layer = fract(down), lid = floor(down);
            b *= (0.55 + 0.6*smoothstep(0.35, 0.65, sfN(vec2(along*9., down*46.))))*(0.66 + 0.6*sfN(vec2(along*7., down*5.3 + 2.)));   // straw ends, in bundles: the stipple is stretched along the eave, so it still reads when the edge is seen along its length
            float seam = smoothstep(0.4, 0.5, abs(fract(along/0.6 + sfHash(vec2(lid, 3.))) - 0.5)); b *= 1. - 0.3*seam;      // a seam between bundles about every 0.6 m
            b *= vec3(1.0, 0.88, 0.68);
            b *= mix(0.88, 1.06, step(0.5, fract(lid*0.5)))*(0.92 + 0.16*sfHash(vec2(lid*3.7 + 1.3, 5.1)));                            // each of the three layers has its own tone (a little: more made the steps read as planks)
            b *= mix(0.1, 1., smoothstep(0.0, 0.2, layer))*(0.82 + 0.26*sfN(vec2(along*1.3, lid*5.)));   // a wide dark shadow under each step
            b *= 1. + 0.2*smoothstep(0.8, 1., layer);
            b = mix(b, uFrost, shaded*0.18*sfN(vec2(along*3., down*9.)));
          } else if (kind < 2.5) {
            b *= 0.66 + 0.55*sfN(vec2(vOP.z*42., vOP.y*4. + vOP.x*4.));
            float wetB = smoothstep(0.3, 0.7, sfWetAt(vSfW.xy)); b *= mix(1., 0.55, wetB);
            sfSnowM = min(1., uSnow*1.5)*smoothstep(0.3, 0.9, vON.y)*smoothstep(0.3, 0.62, sfN(vOP.zx*vec2(0.8, 2.3) + 3.))*0.85*(1. - wetB);     // snow in patches on the bundles: the straw shows
            b = mix(b, vec3(0.58, 0.6, 0.64), sfSnowM);
          } else if (kind < 3.5) {
            float reed = (0.55 + 0.5*sfN(vec2(along*26., down*1.7)))*(0.72 + 0.56*sfN(vec2(along*60., down*13.)));   // reed bundles with a fine weave
            float lay = mix(0.6, 1., smoothstep(0., 0.3, fract(down/0.62)));
            float raf = smoothstep(0.4, 0.47, abs(fract(along/1.15) - 0.5)), pur = smoothstep(0.42, 0.48, abs(fract(down/2.1 + 0.5) - 0.5));
            b *= 0.3*reed*lay; b = mix(b, vec3(0.035, 0.028, 0.022), max(raf, pur)*0.5);
          } else {
            b *= 0.8 + 0.4*sfHash(floor(vOP.xz*9.));
          }
          diffuseColor.rgb = b;
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 vd = normalize(vViewPosition);
          float fres = 1. - abs(dot(vd, normal)); fres *= fres*fres;
          vec3 sunV = (viewMatrix*vec4(uSunW, 0.)).xyz;
          float back = smoothstep(-0.35, 0.6, dot(sunV, -vd));
          float cutDown = step(0.5, vTh.z)*step(vTh.z, 1.5)*(1. - smoothstep(-0.6, -0.15, vON.y));     // cut straw ends that face the ground
          totalEmissiveRadiance += diffuseColor.rgb*vec3(2.6, 2.3, 1.7)*(fres*back*step(vTh.z, 2.5)*(1. - 0.85*cutDown)*(1. - 0.9*sfSnowM)) + diffuseColor.rgb*(0.9*back*step(4.5, vTh.z)*step(vTh.z, 5.5))
            + diffuseColor.rgb*vec3(1.0, 0.86, 0.66)*(uBounce*step(2.5, vTh.z)*step(vTh.z, 3.5))
            + diffuseColor.rgb*vec3(1.0, 0.9, 0.72)*(0.9*uBounce*cutDown);   // the cut straw ends of the eave face the ground: lit by what it throws back
        }`);
  };
  return m;
}

// The great roof into thatch Geo T (and timber poles into solid Geo S). Returns surf() and sizes.
async function buildRoof(T, S, c, ctx) {   // async: hands the page back between the parts of the roof
  const { z0, z1, ridgeY, dTop, TH, noise, rng, straw, timber } = c;
  const SL = dTop + 1.5, sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const surf = (sgn, d, z, h = 0) => {
    const zt = (z - z0) / (z1 - z0), dn = d / SL;
    const off = h - 0.3 * Math.sin(Math.PI * Math.min(1, dn * 1.05)) * (0.55 + 0.45 * Math.sin(Math.PI * zt)) + 0.24 * sstep(0.8, 1, dn)
      + 0.1 * noise.fbm2(z * 0.2 + sgn * 9, d * 0.22, 3) + 0.035 * noise.n2(z * 0.9, d * 0.8 + sgn * 5);
    return [sgn * (d * COS60 + off * SIN60), ridgeY - c.ridgeSag * Math.sin(Math.PI * zt) - d * SIN60 + off * COS60, z];
  };
  const NZ = c.NZ ?? 46, ND = c.ND ?? 26, CS = c.CS ?? 8, BS = c.BS ?? 8, PS = c.PS ?? 8, zs = [];
  for (let i = 0; i <= NZ; i++) zs.push(z0 + (z1 - z0) * (i / NZ));
  for (const sgn of [1, -1]) {
    // smooth top surface
    const P = [], N = [], C = [];
    for (let j = 0; j <= ND; j++) for (let i = 0; i <= NZ; i++) {
      const d = 0.9 + (dTop - 0.9) * (j / ND), z = zs[i];
      const p = surf(sgn, d, z), pa = surf(sgn, d + 0.3, z), pb = surf(sgn, d, z + 0.3);
      const ax = pa[0] - p[0], ay = pa[1] - p[1], az = pa[2] - p[2], bx = pb[0] - p[0], by = pb[1] - p[1], bz = pb[2] - p[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) * (ny < 0 ? -1 : 1) || 1;
      P.push(p); N.push([nx / l, ny / l, nz / l]);
      const v = 0.86 + 0.2 * noise.fbm2(z * 0.13 + sgn * 31, d * 0.1, 2) + 0.14 * (1 - d / SL) - 0.1 * sstep(0.7, 1, d / SL);
      C.push([v, d, z]);
    }
    await ctx.yield();
    // aX.w < 0 on a slope: -(1 + metres in from the nearer verge), which the snow reads
    const put = (k) => { const p = P[k], n = N[k], q = C[k]; T.ex = [q[2], q[1], 0.4 * Math.min(1, q[1] / dTop), -1 - Math.min(q[2] - z0, z1 - q[2])]; T.vert(p, n[0], n[1], n[2], straw, q[0]); };
    for (let j = 0; j < ND; j++) for (let i = 0; i < NZ; i++) {
      const a = j * (NZ + 1) + i, b = a + 1, d = a + NZ + 1, e = d + 1;
      if (sgn > 0) { put(a); put(e); put(d); put(a); put(b); put(e); } else { put(a); put(d); put(e); put(a); put(e); put(b); }
    }
    await ctx.yield();
    // eave: three stepped layers of cut straw ends, then the smoked underside
    for (let i = 0; i < NZ; i++) {
      const za = zs[i], zb = zs[i + 1]; let d = dTop;
      const Q = (dd, h, z) => surf(sgn, dd, z, h);
      const fq = (A, B, C2, D, col, sh, exs) => (sgn < 0 ? T.quad(A, B, C2, D, col, sh, sh, sh, sh, exs) : T.quad(D, C2, B, A, col, sh, sh, sh, sh, exs && [exs[3], exs[2], exs[1], exs[0]]));
      for (let k = 0; k < 3; k++) {
        const h0 = -k * TH / 3, h1 = -(k + 1) * TH / 3;
        fq(Q(d, h0, za), Q(d + 0.42, h1, za), Q(d + 0.42, h1, zb), Q(d, h0, zb), straw, 1.8, [[za, k, 1, 0], [za, k + 1, 1, 0], [zb, k + 1, 1, 0], [zb, k, 1, 0]]);
        // the step's underside: cut straw too (seen from under the eave it is the edge of that layer)
        fq(Q(d + 0.42, h1, za), Q(d + 0.2, h1, za), Q(d + 0.2, h1, zb), Q(d + 0.42, h1, zb), straw, 1.35, [[za, k + 0.3, 1, 0], [za, k + 0.7, 1, 0], [zb, k + 0.7, 1, 0], [zb, k + 0.3, 1, 0]]);
        d += 0.2;
      }
      let dU = d;
      if (c.eaveBand ?? true) {   // from below, the trimmed edge shows two more layers of straw ends before the smoked reed begins
        dU = d - 1.0;
        fq(Q(d, -TH, za), Q(dU, -TH, za), Q(dU, -TH, zb), Q(d, -TH, zb), straw, 1.35, [[za, 3.02, 1, 0], [za, 4.98, 1, 0], [zb, 4.98, 1, 0], [zb, 3.02, 1, 0]]);
      }
      fq(Q(dU, -TH, za), Q(1.2, -TH, za), Q(1.2, -TH, zb), Q(dU, -TH, zb), straw, 1, [[za, dU, 3, 0], [za, 1.2, 3, 0], [zb, 1.2, 3, 0], [zb, dU, 3, 0]]);
    }
    await ctx.yield();
    // verges: the slab's section at both gable ends, three strata stepping back
    const NV = c.NV ?? 14;
    for (const [zv, dir] of [[z1, 1], [z0, -1]]) for (let j = 0; j < NV; j++) {
      const da = dTop * (j / NV), db = dTop * ((j + 1) / NV), flip = (dir > 0) === (sgn > 0);
      const Q = (dd, h, k) => { const p = surf(sgn, Math.max(dd, 0.02), zv, h); p[2] = zv - dir * k * 0.17; if (dd < 0.05) p[0] = 0; return p; };
      const fq = (A, B, C2, D, sh, exs) => (flip ? T.quad(A, B, C2, D, straw, sh, sh, sh, sh, exs) : T.quad(D, C2, B, A, straw, sh, sh, sh, sh, exs && [exs[3], exs[2], exs[1], exs[0]]));
      for (let k = 0; k < 3; k++) {
        const h0 = -k * TH / 3, h1 = -(k + 1) * TH / 3;
        fq(Q(da, h0, k), Q(da, h1, k), Q(db, h1, k), Q(db, h0, k), 1.2, [[da, k, 1, 0], [da, k + 1, 1, 0], [db, k + 1, 1, 0], [db, k, 1, 0]]);
        T.ex = [da, 0, 3, 0];
        fq(Q(da, h1, k), Q(da, h1, k + 1), Q(db, h1, k + 1), Q(db, h1, k), 1);
      }
    }
    await ctx.yield();
  }
  // ridge cap saddle, fat bundles, hold-down poles, crossed pins, rope
  const capP = (a, z) => { const sgn = a < 0 ? -1 : 1, d = Math.abs(a) * 2.1 + 0.02, lift = 0.5 * Math.cos(a * Math.PI * 0.5) + 0.12; const p = surf(sgn, d, z, lift); if (Math.abs(a) < 1e-3) p[0] = 0; return p; };
  for (let i = 0; i < NZ; i++) for (let j = 0; j < CS; j++) {
    const a0 = -1 + (2 * j) / CS, a1 = a0 + 2 / CS;
    T.quad(capP(a0, zs[i]), capP(a0, zs[i + 1]), capP(a1, zs[i + 1]), capP(a1, zs[i]), straw, 1.15, 1.15, 1.15, 1.15, [[0, 0, 2, 0], [0, 0, 2, 0], [0, 0, 2, 0], [0, 0, 2, 0]]);
  }
  for (const zv of [z0, z1]) for (let j = 0; j < CS; j++) { // close the cap ends
    const a0 = -1 + (2 * j) / CS, a1 = a0 + 2 / CS, A = capP(a0, zv), B = capP(a1, zv), o = surf(1, 0.02, zv, -0.2); o[0] = 0;
    if (zv === z1) T.tri(A, o, B, straw, 1.2, 0.8, 1.2, [[0, 0, 1, 0], [0, 1, 1, 0], [0, 0, 1, 0]]); else T.tri(B, o, A, straw, 1.2, 0.8, 1.2, [[0, 0, 1, 0], [0, 1, 1, 0], [0, 0, 1, 0]]);
  }
  await ctx.yield();
  const perches = [], nB = c.nB ?? Math.round((z1 - z0) / 2.35), pale = mul(straw, 1.25);
  for (let i = 0; i < nB; i++) {
    const z = z0 + 0.9 + (z1 - z0 - 1.8) * (i / (nB - 1)) + rng.range(-0.12, 0.12), r = rng.range(0.34, 0.42);
    const top = surf(1, 0.02, z, 0.95); top[0] = 0; perches.push([0, top[1] + r, z]);
    T.ex = [0, 0, 2, 0];
    for (const sgn of [1, -1]) { const mid = surf(sgn, 1.3, z, 0.78), end = surf(sgn, 2.9 + rng.range(-0.2, 0.25), z + rng.range(-0.1, 0.1), 0.5); T.cyl(top, mid, r, r * 0.95, BS, pale); T.cyl(mid, end, r * 0.95, r * 0.8, BS, pale, { cap: true, capCol: mul(straw, 1.7) }); }
    if (i < nB - 1 && i % 2 === 0) { // crossed pins with a rope lashing
      const zc = z + 1.15, y0 = surf(1, 0.02, zc, 0)[1];
      S.cyl([-1.3, y0 - 0.4, zc - 0.1], [0.62, y0 + 1.6, zc - 0.1], 0.1, 0.075, 5, timber, { cap: true });
      S.cyl([1.3, y0 - 0.4, zc + 0.1], [-0.62, y0 + 1.6, zc + 0.1], 0.1, 0.075, 5, timber, { cap: true });
      S.box(0, y0 + 0.93, zc, 0.34, 0.3, 0.46, mul(straw, 0.75), { gb: 0.9 });
    }
  }
  await ctx.yield();
  for (const sgn of [1, -1]) for (const dd of [0.75, 2.2]) for (let i = 0; i < PS; i++) { // long poles lying on the bundles
    const za = z0 - 0.5 + (z1 - z0 + 1) * (i / PS), zb = z0 - 0.5 + (z1 - z0 + 1) * ((i + 1) / PS);
    S.cyl(surf(sgn, dd, Math.max(z0, za), dd < 1 ? 1.5 : 1.1).map((v, k) => (k === 2 ? za : v)), surf(sgn, dd, Math.min(z1, zb), dd < 1 ? 1.5 : 1.1).map((v, k) => (k === 2 ? zb : v)), 0.07, 0.07, c.PS ? 4 : 5, timber, { cap: i === 0 || i === PS - 1 });
  }
  return { surf, SL, zs, perches };
}

// ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('sixty-fountains-hero'), noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map(lin);
  const [cedar, thatchC, skyC, whiteC, persC, redC, goldC] = pal;
  const sunW = new THREE.Vector3(0.71, 0.37, -0.6).normalize(); if (opts.sunDir) sunW.fromArray(opts.sunDir).normalize();
  const sunSgn = sunW.x >= 0 ? 1 : -1;                         // which long eave gets the fruit and the steam
  const TY = 1.5, L = opts.houseLength ?? rng.range(28, 32), zF = 7, zB = zF - L, WX = 9, ridgeY = TY + 24, dTop = 22, TH = 1.1;
  const storeys = opts.storeys ?? (rng.chance(0.7) ? 4 : 3), fruitShare = opts.fruit ?? rng.range(0.7, 1);
  const tx = { xMin: -26.5, xMax: 26.5, zMin: zB - 4.5, zMax: 31 };
  const timberBase = mix3(mul(cedar, 0.9), [0.085, 0.055, 0.035], 0.6);
  const timber = () => mul(mix3(timberBase, [0.16, 0.12, 0.085], rng() * rng()), rng.range(0.75, 1.3));
  const straw = mix3(mul(thatchC, 1.8), [0.3, 0.29, 0.27], 0.22), reed = [0.3, 0.25, 0.16], paper = mul(whiteC, 0.8), plaster = [0.5, 0.46, 0.38];
  const stoneC = () => { const g = rng.range(0.13, 0.3); return mix3([g, g * 1.02, g * 1.05], rng.chance(0.25) ? [0.12, 0.17, 0.08] : [0.32, 0.3, 0.26], rng() * 0.45); };
  const frostC = [0.6, 0.68, 0.76];
  const S = new Geo(0), T = new Geo(4), W = new Geo(3);         // solids, thatch, swaying soft things
  const fruits = [];                                             // x, y, z, scale, depth, phase, r, g, b
  const anchors = {};

  // ---- terrace: dry-stone wall, earth top with frost, flag path, steps -----------------------------
  {
    const courses = [0.58, 0.5, 0.44];
    const side = (ax, az, bx, bz, nx, nz, skip) => {
      const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax); let y = 0;
      courses.forEach((h, ci) => {
        let t = -rng() * 0.6; const inset = ci * 0.11;
        while (t < len) {
          const w = rng.range(0.7, 1.6), tc = t + w / 2, px = ax + (bx - ax) * (tc / len), pz = az + (bz - az) * (tc / len);
          if (!(skip && Math.abs(px) < skip)) {
            const dep = rng.range(0.55, 0.8), out = 0.32 - inset + rng.range(-0.05, 0.05);
            let col = stoneC(); if (ci === 2 && rng.chance(0.3)) col = mix3(col, frostC, 0.35); if (ci === 0) col = mul(col, 0.8);
            S.box(px + nx * out * 0.5, y + h / 2, pz + nz * out * 0.5, w - 0.04, h - 0.03, dep, col, { ry, tx: rng.range(0.86, 0.98), tz: rng.range(0.8, 0.95), gb: 0.7, noBottom: true, lean: [0, 0] });
          }
          t += w;
        }
        y += h;
      });
    };
    side(tx.xMin, tx.zMax, tx.xMax, tx.zMax, 0, 1, 3.6); side(tx.xMax, tx.zMax, tx.xMax, tx.zMin, 1, 0);
    side(tx.xMax, tx.zMin, tx.xMin, tx.zMin, 0, -1); side(tx.xMin, tx.zMin, tx.xMin, tx.zMax, -1, 0);
    await ctx.yield();
    const nx = 26, nz = Math.round((tx.zMax - tx.zMin) / 2), gx = (i) => tx.xMin + (tx.xMax - tx.xMin) * (i / nx), gz = (j) => tx.zMin + (tx.zMax - tx.zMin) * (j / nz);
    const gc = (x, z) => {
      const e = 0.5 + 0.5 * noise.fbm2(x * 0.09, z * 0.09, 3), f = Math.min(1, Math.max(0, 0.5 + noise.fbm2(x * 0.05 + 9, z * 0.05, 2) * 1.3 - sunSgn * x * 0.02 - (z > zF ? 0.25 : 0)));
      const path = Math.max(0, 1 - Math.abs(x) / 2.6) * (z > zF ? 1 : 0);
      return mix3(mix3(mix3([0.2, 0.165, 0.12], [0.3, 0.26, 0.2], e), [0.34, 0.31, 0.26], path * 0.6), frostC, f * f * 0.5 * (1 - path * 0.7));
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x0 = gx(i), x1 = gx(i + 1), z0 = gz(j), z1 = gz(j + 1), q = [[x0, z1], [x1, z1], [x1, z0], [x0, z0]];
      const idx = [0, 1, 2, 0, 2, 3];
      for (const k of idx) S.vert([q[k][0], TY, q[k][1]], 0, 1, 0, gc(q[k][0], q[k][1]), 1);
    }
    for (let z = zF + 3.2; z < tx.zMax - 0.3;) { // flagstones from the steps to the door
      const d = rng.range(0.7, 1.15), n = rng.int(1, 2);
      for (let k = 0; k < n; k++) S.box((k - (n - 1) / 2) * 1.25 + rng.range(-0.12, 0.12), TY + 0.03, z + d / 2, rng.range(0.95, 1.2), 0.1, d - 0.08, mul(stoneC(), 1.15), { ry: rng.range(-0.08, 0.08), tx: 0.94, tz: 0.94, noBottom: true });
      z += d;
    }
    for (let k = 0; k < 5; k++) S.box(0, TY - 0.15 - k * 0.3, tx.zMax + 0.3 + k * 0.55, 7.2 + k * 0.1, 0.3, 0.75, mul(stoneC(), 1.1), { tx: 0.99, tz: 0.96, gb: 0.75, noBottom: true });
    for (const sx of [-1, 1]) S.box(sx * 4.0, TY - 0.55, tx.zMax + 1.5, 0.7, 1.9, 3.2, stoneC(), { tx: 0.85, tz: 0.9, gb: 0.7, noBottom: true });
    anchors.terrace = { y: TY, ...tx }; anchors.stairs = { z0: tx.zMax, z1: tx.zMax + 3.1, halfWidth: 3.7 };
  }
  await ctx.yield();

  // ---- roof ----------------------------------------------------------------------------------------
  const roof = await buildRoof(T, S, { z0: zB - 1.3, z1: zF + 1.3, ridgeY, dTop, TH, noise, rng, straw, timber: timber(), ridgeSag: rng.range(0.25, 0.45) }, ctx);
  const surf = roof.surf;
  await ctx.yield();

  // ---- long walls under the eaves ------------------------------------------------------------------
  const lattice = (x, y, z, w, h, nxz, face) => { // paper screen with frame and bars; face: [nx, nz] outward
    const [fx, fz] = face, ax = Math.abs(fz), az = Math.abs(fx), tcol = timber();
    const pc = rng.chance(0.2) ? mix3(paper, [0.62, 0.55, 0.36], 0.35) : mul(paper, rng.range(0.9, 1.05));
    S.box(x + fx * 0.05, y, z + fz * 0.05, ax * w + az * 0.06, h, az * w + ax * 0.06, pc, { gb: 0.92, top: 1, noBottom: true });
    const bar = (u, v, bw, bh) => S.box(x + fx * 0.1 + ax * u, y + v, z + fz * 0.1 + az * u, ax * bw + az * 0.07, bh, az * bw + ax * 0.07, tcol, { gb: 1, top: 1, noBottom: true });
    bar(0, h / 2, w + 0.12, 0.09); bar(0, -h / 2, w + 0.12, 0.11); bar(-w / 2, 0, 0.09, h); bar(w / 2, 0, 0.09, h);
    for (let i = 1; i < nxz; i++) bar(-w / 2 + (w * i) / nxz, 0, 0.045, h);
    const ny = Math.max(1, Math.round(h / 0.75)); for (let i = 1; i < ny; i++) bar(0, -h / 2 + (h * i) / ny, w, 0.04);
  };
  for (const sgn of [1, -1]) {
    const x = sgn * WX, nb = Math.round(L / 2.5), bw = L / nb;
    S.box(x, TY + 0.2, (zF + zB) / 2, 0.7, 0.4, L + 0.4, mul(stoneC(), 0.9), { noBottom: true });
    S.box(x, TY + 0.52, (zF + zB) / 2, 0.34, 0.26, L + 0.2, timber(), { noBottom: true });
    for (let i = 0; i <= nb; i++) S.box(x + sgn * 0.06, TY + 2.5, zB + i * bw, 0.32, 4.2, 0.32, timber(), { noBottom: true, gb: 0.7 });
    for (let i = 0; i < nb; i++) {
      const zc = zB + (i + 0.5) * bw, kind = rng();
      if (kind < 0.4) { // plank bay
        for (let k = 0; k < 5; k++) S.box(x - sgn * 0.02 + rng.range(-0.015, 0.015), TY + 2.6, zc + (k - 2) * (bw - 0.3) / 5, 0.08, 4.0, (bw - 0.3) / 5 - 0.015, timber(), { noBottom: true, gb: 0.75 });
      } else {
        S.box(x - sgn * 0.04, TY + 2.6, zc, 0.08, 4.0, bw - 0.3, kind < 0.62 ? mul(plaster, rng.range(0.8, 1.05)) : timber(), { noBottom: true, gb: 0.7 });
        if (kind >= 0.62) lattice(x, TY + 2.0, zc, bw - 0.7, 1.9, 3, [sgn, 0]);
        S.box(x, TY + 0.95, zc, 0.1, 0.6, bw - 0.3, timber(), { noBottom: true });
      }
    }
    S.box(x + sgn * 0.05, TY + 3.2, (zF + zB) / 2, 0.3, 0.3, L + 0.6, timber(), { noBottom: true });
  }
  await ctx.yield();

  // ---- gables --------------------------------------------------------------------------------------
  const yw = (x) => Math.min(TY + 6.1 + (WX - Math.abs(x)) * 6, ridgeY - 2.3 - TAN60 * Math.abs(x));   // wall top under the thatch
  const hwAt = (y) => Math.min(WX, (ridgeY - 2.3 - y) / TAN60);
  const floors = storeys === 4 ? [4.3, 8.7, 12.7, 16.2, 18.9] : [4.3, 9.4, 14.2, 18.4];
  const gable = (zg, dir, front) => {
    const zo = (k) => zg + dir * k;
    for (let i = 0; i < 40; i++) { // board infill, each board its own tone
      const xa = -WX + (i * 2 * WX) / 40, xb = xa + (2 * WX) / 40, col = timber(), k = rng.range(0, 0.03);
      const A = [xa, TY + 0.3, zo(k)], B = [xb, TY + 0.3, zo(k)], C = [xb, yw(xb), zo(k)], D = [xa, yw(xa), zo(k)];
      if (dir > 0) S.quad(A, B, C, D, col, 0.7, 0.7, 1, 1); else S.quad(B, A, D, C, col, 0.7, 0.7, 1, 1);
    }
    for (const sgn of [1, -1]) { // the praying-hands rafters and barge poles
      S.beam([sgn * (WX + 0.5), yw(WX) - 0.75, zo(0.3)], [0, ridgeY - 2.35, zo(0.3)], 0.5, 0.42, timber());
      S.beam([sgn * (WX + 0.2), yw(WX) + 0.95, zo(0.95)], [0, ridgeY - 0.95, zo(0.95)], 0.24, 0.24, timber());
      for (let k = 0; k < 6; k++) { const t = 0.08 + k * 0.17, xx = sgn * (WX + 0.4) * (1 - t), yy = yw(WX) - 0.2 + (ridgeY - 2.0 - yw(WX)) * t; S.cyl([xx, yy, zo(-0.2)], [xx, yy, zo(1.25)], 0.085, 0.07, 5, timber(), { cap: true, capCol: [0.3, 0.24, 0.16] }); }
    }
    for (const px of [-WX, -6, -3, 0, 3, 6, WX]) if (!(front && px === 0)) S.box(px, (TY + yw(px)) / 2, zo(0.1), 0.3, yw(px) - TY, 0.26, timber(), { noBottom: true, gb: 0.7 });
    if (front) for (const px of [-1.75, 1.75]) S.box(px, TY + 1.9, zo(0.12), 0.32, 3.8, 0.3, timber(), { noBottom: true, gb: 0.7 });
    floors.forEach((fy, fi) => {
      const y0 = TY + fy, hw0 = hwAt(y0) + 0.55;
      S.box(0, y0, zo(0.2), hw0 * 2, 0.34, 0.42, timber(), { gb: 0.8 });
      for (const sgn of [1, -1]) S.box(sgn * hw0, y0, zo(0.25), 0.3, 0.4, 0.62, mul(whiteC, 0.5), { gb: 0.8 });   // limed beam ends
      if (fi === floors.length - 1) { // attic vent under the apex
        const hv = hwAt(y0 + 1.5) - 0.2; if (hv > 0.3) { S.box(0, y0 + 0.95, zo(0.08), hv * 2, 1.3, 0.06, [0.012, 0.012, 0.014], { noBottom: true, gb: 1 }); for (let k = -2; k <= 2; k++) S.box(k * hv * 0.38, y0 + 0.95, zo(0.14), 0.07, 1.3, 0.06, timber(), { noBottom: true }); }
        return;
      }
      const y1 = TY + floors[fi + 1], h = y1 - y0 - 1.5, yc = y0 + 0.62 + h / 2, hwT = hwAt(yc + h / 2) - 0.75;
      if (hwT < 0.7) return;
      const n = Math.max(1, Math.floor((hwT * 2) / 1.5)), w = (hwT * 2) / n, mode = rng();
      for (let i = 0; i < n; i++) {
        const xc = -hwT + (i + 0.5) * w;
        if (mode < 0.15 && rng.chance(0.5)) S.box(xc, yc, zo(0.07), w - 0.2, h, 0.07, timber(), { noBottom: true });      // boarded shutter
        else if (rng.chance(0.1)) { S.box(xc, yc, zo(0.04), w - 0.2, h, 0.05, [0.012, 0.012, 0.014], { noBottom: true, gb: 1 }); lattice(xc + w * 0.22, yc, zo(0.04), (w - 0.2) * 0.5, h, 2, [0, dir]); }
        else lattice(xc, yc, zg, w - 0.2, h, 3, [0, dir]);
      }
      S.box(0, y0 + 0.36, zo(0.3), hwT * 2 + 0.5, 0.08, 0.5, timber(), { gb: 0.8 });                                 // sill shelf
    });
  };
  gable(zF, 1, true); await ctx.yield(); gable(zB, -1, false);
  anchors.gableApex = new THREE.Vector3(0, ridgeY + 0.6, zF + 1.3);
  await ctx.yield();

  // ---- things hung, stacked and leaned --------------------------------------------------------------
  const cordC = [0.3, 0.25, 0.15], indigo = mix3([0.025, 0.05, 0.17], mul(skyC, 0.35), 0.25), foodDim = (opts.paperGlow ?? 0) > 1 ? 0.55 : 1;      // at dusk pale food under the eaves is not the brightest thing there
  const hang = (x, y, z, len, ph, force) => { // one straw cord of drying food; sways as a pendulum in the shader
    const kind = force ?? (rng() < fruitShare ? 0 : rng.chance(0.5) ? 1 : 2), e0 = [0, ph, 0], e1 = [len, ph, 0];
    W.quad([x - 0.03, y, z], [x + 0.03, y, z], [x + 0.03, y - len, z], [x - 0.03, y - len, z], cordC, 1, 1, 1, 1, [e0, e0, e1, e1]);
    W.quad([x, y, z - 0.03], [x, y, z + 0.03], [x, y - len, z + 0.03], [x, y - len, z - 0.03], cordC, 1, 1, 1, 1, [e0, e0, e1, e1]);
    if (kind === 0) {
      for (let d = 0.2; d < len; d += 0.165) {
        const c = mul(mix3(persC, [0.36, 0.09, 0.015], rng() < 0.2 ? rng.range(0.3, 0.7) : rng() * 0.15), rng.range(0.8, 1.15));
        fruits.push(x + rng.range(-0.035, 0.035), y - d, z + rng.range(-0.035, 0.035), rng.range(0.082, 0.105), d, ph, c[0], c[1], c[2]);
      }
    } else if (kind === 1) { // corn in bunches
      for (let d = 0.25; d < len; d += 0.3) for (let k = 0; k < 3; k++) {
        const a = rng.range(0, 6.28), cx = x + Math.cos(a) * 0.07, cz = z + Math.sin(a) * 0.07; W.ex = [d, ph, 0];
        const cc = mul(mix3(goldC, [0.75, 0.55, 0.2], rng()), rng.range(0.7, 1)); if (k < 2) hangCorn(W, [cx, y - d, cz], [cx + Math.cos(a) * 0.05, y - d - 0.3, cz + Math.sin(a) * 0.05], cc, 5, foodDim, 2);      // cobs in pairs, hanging close to the cord
      }
    } else { // long white radishes with their tops (seen from 14 m at the nearest: five sides)
      for (let d = 0.1; d < len - 0.5; d += 0.75) { W.ex = [d + 0.4, ph, 0]; const tdx = rng.range(-0.03, 0.03); hangRadish(W, x, y - d, z, tdx, rng.range(0.7, 0.82), 5, foodDim); }
    }
  };
  const logs = (x0, y0, z0, nu, nv, axis, dirn, len) => { // a stack of split firewood, cut ends pale
    for (let v = 0; v < nv; v++) for (let u = 0; u < nu - (v % 2); u++) {
      const r = rng.range(0.11, 0.15), uu = (u + (v % 2) * 0.5) * 0.27 + rng.range(-0.02, 0.02), yy = y0 + 0.14 + v * 0.235, l = len * rng.range(0.85, 1.08);
      const col = mul(mix3([0.2, 0.15, 0.1], [0.11, 0.09, 0.07], rng()), rng.range(0.8, 1.2)), end = mul([0.5, 0.4, 0.26], rng.range(0.7, 1.15));
      if (axis === 'z') S.cyl([x0 + uu, yy, z0], [x0 + uu, yy, z0 + dirn * l], r, r, 5, col, { cap: true, capCol: end });
      else S.cyl([x0, yy, z0 + uu], [x0 + dirn * l, yy, z0 + uu], r, r, 5, col, { cap: true, capCol: end });
    }
  };
  const leanTo = (zg, dir, withFruit) => { // shingle lean-to weighted with river stones, on posts
    const zo = (k) => zg + dir * k, yA = TY + 3.98, yB = TY + 3.12, grey = () => mul(mix3([0.2, 0.19, 0.17], timberBase, rng() * 0.6), rng.range(0.8, 1.25));
    for (let i = 0; i < 46; i++) { const x = -9.66 + i * 0.42 + 0.21, j = rng.range(-0.06, 0.1); S.beam([x, yA + rng.range(0, 0.03), zo(0.1)], [x, yB + j * 0.3, zo(2.75 + j)], 0.4, 0.05, grey(), { gb: 0.7 }); }
    for (const k of [0.95, 2.05]) {
      const y = yA + (yB - yA) * ((k - 0.1) / 2.65) + 0.08; S.box(0, y, zo(k), 19.5, 0.07, 0.1, timber(), { noBottom: true });
      for (let i = 0; i < 13; i++) { const s = rng.range(0.22, 0.38); S.box(-9 + i * 1.5 + rng.range(-0.4, 0.4), y + 0.04 + s * 0.3, zo(k), s * 1.3, s * 0.62, s, mul(stoneC(), 1.2), { ry: rng.range(0, 3), tx: 0.55, tz: 0.6, noBottom: true }); }
    }
    S.box(0, yB - 0.1, zo(2.5), 19.6, 0.24, 0.24, timber(), { gb: 0.8 });
    for (const px of [-9.3, -5.5, -1.85, 1.85, 5.5, 9.3]) { S.box(px, TY + 1.5, zo(2.5), 0.22, 3.0, 0.22, timber(), { noBottom: true, gb: 0.7 }); S.box(px, TY + 0.08, zo(2.5), 0.5, 0.16, 0.5, stoneC(), { tx: 0.8, tz: 0.8, noBottom: true }); }
    if (withFruit) for (const sx of [-1, 1]) for (let x = 2.25; x < 9.1; x += 0.34) { if (Math.abs(x - 5.5) < 0.3) continue; hang(sx * x, yB - 0.24, zo(2.5), rng.range(1.15, 1.75), rng.range(0, 6.28)); }
  };
  leanTo(zF, 1, true); await ctx.yield(); leanTo(zB, -1, false);
  await ctx.yield();
  { // front ground floor: door, cloth, screens, veranda, tubs
    S.box(0, TY + 1.6, zF + 0.05, 3.2, 3.2, 0.08, [0.012, 0.011, 0.012], { noBottom: true, gb: 1 });
    S.box(-0.82, TY + 1.55, zF + 0.16, 1.5, 3.0, 0.07, timber(), { noBottom: true }); S.box(0, TY + 3.28, zF + 0.2, 3.9, 0.3, 0.4, timber());
    for (let k = -1; k <= 1; k++) { // door cloth with a white crest
      const ph = rng.range(0, 6.28), x0 = k * 1.04 - 0.49, x1 = x0 + 0.98, yT = TY + 3.1, z = zF + 0.42, col = mul(indigo, rng.range(0.85, 1.2));
      for (let j = 0; j < 4; j++) { const ya = yT - j * 0.33, yb = ya - 0.33, ea = [j * 0.33, ph, 1], eb = [(j + 1) * 0.33, ph, 1]; W.quad([x0, yb, z], [x1, yb, z], [x1, ya, z], [x0, ya, z], col, 0.85, 0.85, 1, 1, [eb, eb, ea, ea]); }
      const e = [0.7, ph, 1]; W.quad([x0 + 0.27, yT - 0.92, z + 0.012], [x1 - 0.27, yT - 0.92, z + 0.012], [x1 - 0.27, yT - 0.48, z + 0.012], [x0 + 0.27, yT - 0.48, z + 0.012], mul(whiteC, 0.8), 1, 1, 1, 1, [e, e, e, e]);
    }
    for (const sx of [-1, 1]) {
      for (let b = 0; b < 4; b++) {
        const xc = sx * (2.8 + b * 1.75);
        if (sx < 0 && b >= 2) continue;
        lattice(xc, TY + 2.05, zF + 0.1, 1.5, 2.1, 3, [0, 1]); S.box(xc, TY + 0.72, zF + 0.14, 1.6, 0.55, 0.06, timber(), { noBottom: true });
      }
      S.box(sx * 5.5, TY + 0.36, zF + 0.85, 7.1, 0.1, 1.35, mul([0.24, 0.19, 0.13], rng.range(0.8, 1.1)), { gb: 0.8 });
      for (let k = 0; k < 4; k++) S.box(sx * (2.3 + k * 2.1), TY + 0.16, zF + 1.4, 0.16, 0.32, 0.16, timber(), { noBottom: true });
    }
    logs(-9.0, TY + 0.4, zF + 0.3, 14, 6, 'z', 1, 0.85);                                  // firewood under the lean-to, left of the door
    for (const [bx, bz, r, h] of [[7.4, zF + 3.6, 0.55, 1.05], [8.5, zF + 3.9, 0.38, 0.5]]) {
      S.cyl([bx, TY, bz], [bx, TY + h, bz], r * 0.9, r, 10, [0.2, 0.15, 0.1], { cap: true, capCol: [0.05, 0.07, 0.09] });
      for (const t of [0.2, 0.8]) S.cyl([bx, TY + h * t - 0.04, bz], [bx, TY + h * t + 0.04, bz], r * 1.02, r * 1.03, 10, [0.05, 0.045, 0.04]);
    }
  }
  await ctx.yield();
  { // rear: firewood wall and a door
    logs(-8.6, TY, zB - 0.35, 22, 8, 'z', -1, 0.9); logs(3.2, TY, zB - 0.35, 12, 5, 'z', -1, 0.9);
    S.box(0.6, TY + 1.5, zB - 0.08, 1.6, 3.0, 0.08, timber(), { noBottom: true });
  }
  await ctx.yield();
  { // sun-side eave: fruit rail on brackets, a roof ladder left from the last re-thatching
    const x = sunSgn * (WX + 1.3), yR = TY + 3.45;
    S.cyl([x, yR, zB + 1.2], [x, yR + 0.05, zF - 1.2], 0.06, 0.05, 6, timber(), { cap: true });
    for (let z = zB + 1.6; z < zF - 1; z += 4.9) S.beam([sunSgn * WX, yR + 0.25, z], [x + sunSgn * 0.2, yR - 0.06, z], 0.1, 0.12, timber());
    let run = 0;
    for (let z = zB + 1.6; z < zF - 1.4; z += 0.37) {
      run++; if (run % 16 > 12 || Math.abs(z - (zF - 6.2)) < 1.1) continue;
      hang(x, yR - 0.04, z, rng.range(1.5, 2.1), rng.range(0, 6.28));
    }
    const lz = zF - 6.2;
    for (const dz of [-0.3, 0.3]) {
      S.beam([sunSgn * 13.6, TY, lz + dz], surf(sunSgn, dTop + 0.1, lz + dz, 0.3), 0.07, 0.11, timber());
      for (let k = 0; k < 4; k++) S.beam(surf(sunSgn, dTop + 0.1 - k * 3.4, lz + dz, 0.3), surf(sunSgn, dTop - 3.3 - k * 3.4, lz + dz, 0.3), 0.07, 0.11, timber());
    }
    for (let d = dTop - 0.2; d > dTop - 13.4; d -= 0.42) S.cyl(surf(sunSgn, d, lz - 0.3, 0.3), surf(sunSgn, d, lz + 0.3, 0.3), 0.03, 0.03, 4, timber());
    for (let k = 1; k < 13; k++) { const t = k / 13, e = surf(sunSgn, dTop + 0.1, lz, 0.3); S.cyl([sunSgn * 13.6 + (e[0] - sunSgn * 13.6) * t, TY + (e[1] - TY) * t, lz - 0.3], [sunSgn * 13.6 + (e[0] - sunSgn * 13.6) * t, TY + (e[1] - TY) * t, lz + 0.3], 0.03, 0.03, 4, timber()); }
  }
  await ctx.yield();
  { // shade side: reed snow-fence half put up, bare frame for the rest, firewood along the wall
    const o = -sunSgn, x = o * (WX + 1.55), zm = (zF + zB) / 2;
    for (let z = zB + 0.8; z <= zF - 0.6; z += 2.55) S.cyl([x, TY, z], [x + o * -0.18, TY + 3.9, z], 0.075, 0.06, 5, timber(), { cap: true });
    for (const yy of [1.1, 2.9]) S.cyl([x - o * 0.05 * yy, TY + yy, zB + 0.4], [x - o * 0.05 * yy, TY + yy + 0.05, zF - 0.3], 0.05, 0.05, 5, timber(), { cap: true });
    for (let z = zB + 2.05; z < zm - 0.5; z += 2.5) {
      const rc = mul(reed, rng.range(0.8, 1.2)), sl = rng.range(0.25, 0.4);
      for (let k = 0; k < 8; k++) S.box(x + o * (0.12 + (k % 2) * 0.03), TY + 1.75, z - 1.2 + (k + 0.5) * 0.3, 0.06, 3.5, 0.29, mul(rc, rng.range(0.78, 1.18)), { lean: [-o * sl, 0], gb: 0.72, noBottom: true });
      for (const yy of [0.6, 1.7, 2.8]) S.box(x + o * 0.17 - o * sl * (yy / 3.5), TY + yy, z, 0.05, 0.07, 2.44, mul(rc, 0.5), { noBottom: true });
    }
    for (let k = 0; k < 2; k++) S.cyl([x + o * (0.9 + k * 0.5), TY + 0.24, zm + 1 + k * 0.3], [x + o * (1.0 + k * 0.5), TY + 0.24, zm + 3.6 + k * 0.5], 0.24, 0.24, 8, mul(reed, 0.9 + k * 0.2), { cap: true, capCol: mul(reed, 0.5) });   // mats still rolled
    logs(o * (WX + 0.25), TY, zm + 4.5, Math.floor((zF - zm - 6) / 0.27), 6, 'x', o, 0.8);
  }
  await ctx.yield();
  { // forecourt: stone lanterns, a rack of indigo cloth, a rack of radishes
    for (const sx of [-1, 1]) {
      const x = sx * 10.4, z = 27.2, c = stoneC(), mossy = mix3(c, [0.13, 0.19, 0.08], 0.5);
      S.box(x, TY + 0.16, z, 1.0, 0.32, 1.0, c, { tx: 0.85, tz: 0.85, noBottom: true }); S.box(x, TY + 0.95, z, 0.36, 1.3, 0.36, c, { tx: 0.85, tz: 0.85, noBottom: true });
      S.box(x, TY + 1.69, z, 0.92, 0.18, 0.92, c, { tx: 1.1, tz: 1.1 }); S.box(x, TY + 2.06, z, 0.6, 0.56, 0.6, mul(c, 1.1), { noBottom: true });
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S.box(x + ax * 0.3, TY + 2.06, z + az * 0.3, az ? 0.3 : 0.03, 0.3, ax ? 0.3 : 0.03, [0.015, 0.014, 0.013], { gb: 1, noBottom: true });
      S.box(x, TY + 2.5, z, 1.25, 0.34, 1.25, mossy, { tx: 0.3, tz: 0.3, gb: 0.8 }); S.box(x, TY + 2.8, z, 0.22, 0.3, 0.22, mossy, { tx: 0.4, tz: 0.4, noBottom: true });
    }
    const rack = (xa, xb, z, cloth) => {
      for (const px of [xa, (xa + xb) / 2, xb]) S.cyl([px, TY, z], [px, TY + 3.4, z], 0.07, 0.055, 5, timber(), { cap: true });
      for (const yy of [3.15, 2.0]) {
        S.cyl([xa - 0.4, TY + yy, z + 0.08], [xb + 0.4, TY + yy + 0.04, z + 0.08], 0.045, 0.04, 5, mul(goldC, 0.35), { cap: true });
        if (cloth && yy > 3) for (let x = xa + 0.3; x < xb - 1.2; x += rng.range(1.5, 2.2)) {
          const ph = rng.range(0, 6.28), w = rng.range(1.0, 1.5), len = rng.range(1.5, 2.3), col = rng.chance(0.25) ? mul(whiteC, 0.75) : mul(indigo, rng.range(0.8, 1.5)), zz = z + 0.08;
          for (let j = 0; j < 5; j++) { const ya = TY + yy - (j * len) / 5, yb = ya - len / 5, ea = [(j * len) / 5, ph, 1], eb = [((j + 1) * len) / 5, ph, 1]; W.quad([x, yb, zz], [x + w, yb, zz], [x + w, ya, zz], [x, ya, zz], col, 0.85, 0.85, 1, 1, [eb, eb, ea, ea]); }
        } else for (let x = xa; x < xb; x += 0.26) hang(x, TY + yy - 0.03, z + 0.08, yy > 3 ? 0.95 : 1.0, rng.range(0, 6.28), rng.chance(0.85) ? 2 : 1);
      }
    };
    rack(-22.5, -14.5, 12.5 + rng.range(-1, 1), true); rack(14, 22, 12 + rng.range(-1, 1), false);
  }
  await ctx.yield();
  for (const sx of [-1, 1]) { // rice-straw drying racks either side of the house: trestles, two rails, sheaves astride them
    const x = sx * 19.6 + rng.range(-0.6, 0.6), za = zB + 2, zb = zF - 5, n = Math.floor((zb - za) / 3.2);
    for (let i = 0; i <= n; i++) { const z = za + (zb - za) * (i / n); S.cyl([x - 0.55, TY, z], [x + 0.07, TY + 3.35, z], 0.06, 0.05, 5, timber()); S.cyl([x + 0.55, TY, z], [x - 0.07, TY + 3.35, z], 0.06, 0.05, 5, timber()); }
    for (const yy of [3.05, 1.7]) {
      S.cyl([x, TY + yy, za - 0.5], [x, TY + yy + 0.04, zb + 0.5], 0.05, 0.05, 5, timber(), { cap: true });
      for (let z = za; z < zb; z += 0.43) {
        if (rng.chance(yy > 2 ? 0.06 : 0.22)) continue;
        const h = rng.range(1.0, 1.3), c = mul(mix3(straw, [0.5, 0.39, 0.19], rng.range(0.2, 0.75)), rng.range(0.85, 1.2)), sp = yy < 2 ? 0.3 : 0.2;
        T.ex = [0, 0, 2, 0];
        for (const sd of [-1, 1]) T.box(x + sd * sp, TY + yy - h / 2 + 0.1, z + rng.range(-0.03, 0.03), 0.22, h, 0.4, c, { tx: 0.45, tz: 0.55, lean: [-sd * (sp - 0.07), 0], gb: 0.8, top: 1 });
      }
    }
  }
  await ctx.yield();

  // ---- straw tufts: the furry outline of eaves, verges, ridge and slope -----------------------------
  {
    const tuft = (b, dx, dy, dz, len, w, col) => {
      const l = Math.hypot(dx, dy, dz) || 1, a = rng.range(0, 6.28), sx = Math.cos(a) * w, sz = Math.sin(a) * w, e0 = [0, 0, 5, 0], e1 = [0, 0, 5, 1];
      T.tri([b[0] - sx, b[1], b[2] - sz], [b[0] + sx, b[1], b[2] + sz], [b[0] + (dx / l) * len, b[1] + (dy / l) * len, b[2] + (dz / l) * len], col, 0.8, 0.8, 1.2, [e0, e0, e1]);
    };
    const z0 = zB - 1.3, z1 = zF + 1.3, pale = mul(straw, 1.35), green = [0.1, 0.17, 0.05];
    for (const sgn of [1, -1]) {
      for (let i = Math.round((z1 - z0) * 13 * detail); i > 0; i--) tuft(surf(sgn, dTop + rng.range(-0.4, 0.6), rng.range(z0, z1), rng.range(-0.3, 0.04)), sgn * (0.5 + rng.range(-0.3, 0.5)), -0.866 + rng.range(-0.2, 0.5), rng.range(-0.3, 0.3), rng.range(0.3, 0.75), 0.06, pale);
      await ctx.yield();
      for (const [zv, dir] of [[z1, 1], [z0, -1]]) for (let i = Math.round(120 * detail); i > 0; i--) tuft(surf(sgn, rng.range(0.3, dTop), zv, rng.range(-0.2, 0.03)), sgn * rng.range(0, 0.5), rng.range(0, 0.5), dir, rng.range(0.25, 0.55), 0.055, pale);
      await ctx.yield();
      for (let i = Math.round(330 * detail); i > 0; i--) { const sh = sgn !== sunSgn && rng.chance(0.55); tuft(surf(sgn, rng.range(1, dTop), rng.range(z0, z1), 0), sgn * 0.9, -0.2 + rng.range(0, 0.6), rng.range(-0.4, 0.4), rng.range(0.25, 0.5), sh ? 0.09 : 0.05, sh ? green : pale); }
      await ctx.yield();
    }
    for (let i = Math.round((z1 - z0) * 10 * detail); i > 0; i--) { const sgn = rng.sign(); tuft(surf(sgn, rng.range(0.05, 2.6), rng.range(z0, z1), 0.75), sgn * rng.range(-0.2, 0.8), 1, rng.range(-0.5, 0.5), rng.range(0.25, 0.5), 0.05, pale); }
  }
  await ctx.yield();

  // ---- hydrant huts with hinged roof halves and brass guns -------------------------------------------
  const object = new THREE.Group(); object.name = 'sixty-fountains-hero';
  const HZ = 18, HX = 23, PITCH = Math.atan2(1.6, 1.9), LL = Math.hypot(1.9, 1.6) + 0.1, lids = [], lidGeos = [];
  const brass = mul(goldC, 0.9), gunDefs = [];
  [-1, 1].forEach((sx, gi) => {
    S.m = new THREE.Matrix4().makeRotationY(sx < 0 ? 0 : Math.PI).setPosition(sx * HX, TY, HZ);   // hut local +X = toward the forecourt
    S.box(0, 0.1, 0, 3.5, 0.2, 3.5, stoneC(), { tx: 0.96, tz: 0.96, noBottom: true });
    for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.box(px * 1.42, 0.86, pz * 1.42, 0.17, 1.32, 0.17, timber(), { noBottom: true });
    for (let k = 0; k < 7; k++) {
      const u = -1.26 + k * 0.42, top = (x) => 1.25 + (1.9 - Math.abs(x)) * 0.842 - 0.13;
      for (const px of [1, -1]) S.box(px * 1.45, 0.82, u, 0.06, 1.24, 0.4, timber(), { noBottom: true, gb: 0.7 });
      for (const pz of [1, -1]) { // gable ends, boarded up to the roof line on both faces
        const xa = u - 0.2, xb = u + 0.2, z = pz * 1.45, c = timber();
        const A = [xa, 0.2, z], B = [xb, 0.2, z], C = [xb, top(xb), z], D = [xa, top(xa), z];
        if (pz > 0) { S.quad(A, B, C, D, c, 0.7, 0.7, 1, 1); S.quad(B, A, D, C, mul(c, 0.5), 1, 1, 1, 1); } else { S.quad(B, A, D, C, c, 0.7, 0.7, 1, 1); S.quad(A, B, C, D, mul(c, 0.5), 1, 1, 1, 1); }
      }
    }
    S.box(1.49, 1.0, 0.7, 0.03, 0.42, 0.42, mul(redC, 0.9), { noBottom: true, gb: 1 });                 // hydrant plate
    S.cyl([0, 0.2, 0], [0, 1.4, 0], 0.2, 0.17, 8, mul(redC, 0.85)); S.cyl([0, 1.38, 0], [0, 1.5, 0], 0.27, 0.27, 8, mul(redC, 0.6), { cap: true });
    S.cyl([0, 0.55, -0.45], [0, 0.55, 0.45], 0.09, 0.09, 6, mul(redC, 0.7), { cap: true, capCol: brass });
    S.box(0, 1.6, 0, 0.34, 0.26, 0.34, brass, { tx: 0.8, tz: 0.8 });
    S.cyl([0.02, 1.55, 0], [0.52, 2.07, 0], 0.13, 0.08, 8, brass, { k1: 1.2 }); S.cyl([0.46, 2.01, 0], [0.57, 2.12, 0], 0.11, 0.1, 8, mul(brass, 1.3), { cap: true, capCol: [0.02, 0.02, 0.02] });
    S.cyl([-0.1, 1.6, -0.42], [-0.1, 1.6, 0.42], 0.03, 0.03, 5, [0.03, 0.03, 0.03], { cap: true });
    S.cyl([0.1, 0.25, 0.3], [1.2, 0.25, 1.9], 0.07, 0.07, 6, mul(whiteC, 0.45));                           // a length of canvas hose
    S.m = null;
    const hut = new THREE.Group(); hut.position.set(sx * HX, TY, HZ); hut.rotation.y = sx < 0 ? 0 : Math.PI; object.add(hut);
    const thatched = rng.chance(0.62);
    for (const side of [1, -1]) {
      const g = new Geo(4), th = thatched ? 0.3 : 0.06, hw = 1.85;
      if (thatched) {
        g.ex = [0, 0, 1, 0]; g.box(-LL / 2, th / 2, 0, LL, th, hw * 2, mul(straw, 1.15), { gb: 1, top: 1 });
        g.ex = [0, 0, 6, 0]; g.box(-LL / 2, -0.03, 0, LL - 0.12, 0.06, hw * 2 - 0.1, timber(), { gb: 1 });
        const yy = (x, z) => th + 0.015 + 0.07 * Math.sin((-x / LL) * Math.PI) * Math.cos((z / hw) * 1.2);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
          const x0 = -LL + (LL * i) / 4, x1 = x0 + LL / 4, za = -hw + (2 * hw * j) / 4, zb = za + hw / 2, e = (x, z) => [z + gi * 7, LL + x, 0, 0];
          g.quad([x0, yy(x0, zb), zb], [x1, yy(x1, zb), zb], [x1, yy(x1, za), za], [x0, yy(x0, za), za], straw, 1, 1, 1, 1, [e(x0, zb), e(x1, zb), e(x1, za), e(x0, za)]);
        }
        for (let i = 0; i < 46; i++) { const z = rng.range(-hw, hw), e0 = [0, 0, 5, 0], e1 = [0, 0, 5, 1], ridge = i > 30, bx = ridge ? -LL : 0; g.tri([bx, th * rng(), z - 0.05], [bx, th * rng(), z + 0.05], [bx + (ridge ? -0.1 : rng.range(0.2, 0.42)), th + (ridge ? rng.range(0.2, 0.4) : -0.1), z + rng.range(-0.1, 0.1)], mul(straw, 1.3), 0.8, 0.8, 1.2, [e0, e0, e1]); }
      } else {
        g.ex = [0, 0, 6, 0];
        for (let k = 0; k < 7; k++) g.box(-LL / 2 + rng.range(-0.04, 0.04), 0.03 + (k % 2) * 0.03, -hw + (k + 0.5) * (hw * 2 / 7), LL, 0.05, hw * 2 / 7 + 0.05, mul([0.21, 0.2, 0.18], rng.range(0.7, 1.25)), { gb: 1 });
        for (const bx of [-0.5, -LL + 0.5]) g.box(bx, 0.12, 0, 0.12, 0.08, hw * 2 + 0.1, timber(), { gb: 1 });
        for (let k = 0; k < 4; k++) { const s = rng.range(0.2, 0.32); g.box(rng.range(-LL + 0.4, -0.4), 0.2 + s * 0.25, rng.range(-hw + 0.3, hw - 0.3), s * 1.3, s * 0.6, s, mul(stoneC(), 1.2), { tx: 0.55, tz: 0.6, ry: rng() * 3 }); }
      }
      for (const z of [-1.1, 1.1]) g.box(-0.12, -0.02, z, 0.34, 0.05, 0.1, [0.05, 0.035, 0.03], { gb: 1 });   // iron hinge straps
      const pivot = new THREE.Group(); pivot.position.set(side * 1.9, 1.25, 0); pivot.rotation.y = side > 0 ? 0 : Math.PI; hut.add(pivot);
      const geo = g.build(); lidGeos.push(geo);
      lids.push({ pivot, geo, gi, lag: rng.range(0, 0.18), swing: rng.range(1.85, 2.2) });
    }
    gunDefs.push({ position: [sx * (HX - 0.56), TY + 2.11, HZ], azimuth: sx < 0 ? Math.PI / 2 : -Math.PI / 2, sx });
  });
  await ctx.yield();

  // ---- water: two fans crossing as a pointed arch -----------------------------------------------------
  const sweepPh = rng.range(0, 6.28), apexH = rng.range(29, 30.5);
  const F = makeFountains(gunDefs.map((g, i) => ({
    position: g.position, azimuth: g.azimuth, range: 41.2 + rng.range(-0.4, 0.5), spread: 0.1, apex: apexH * rng.range(0.98, 1.02), apexSpread: 0.05, tearAt: 0.31,
    lateral: 0.03, sweep: 0.07, sweepPhase: sweepPh + i * Math.PI, floorY: TY, strips: 34, drops: 1500, width: 1.1,
  })), { rng: rng.fork('water'), sunDir: opts.sunDir, sunColor: opts.sunColor, wind: opts.wind, water: opts.palette?.[3], segments: 22, detail });
  object.add(F.object);
  await ctx.yield();
  const U = F.uniforms, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // frost steam off the sunlit slope and blue hearth smoke seeping through the ridge
  const vents = [];
  if (opts.steam !== false) {
    const d = { P: [], V: [], S: [], K: [] };
    for (const sg of [1, -1]) for (let i = Math.round(44 * detail); i > 0; i--) { // both slopes are seeded; only the sunlit one smokes
      const p = surf(sg, rng.range(2, dTop - 1), rng.range(zB, zF), 0.4);
      d.P.push(p[0], p[1], p[2], sg > 0 ? -2 : -3); d.V.push(sg * rng.range(0.1, 0.5), rng.range(0.6, 1.3), 0, 0);
      d.S.push(rng.range(0.6, 1.2), rng.range(2.6, 4.2), rng.range(4, 7.5), rng()); d.K.push(rng.range(0.05, 0.085), 0, 0.3, 1);
    }
    for (let v = 0; v < 3; v++) {
      const z = zB + L * (0.2 + 0.3 * v + rng.range(-0.06, 0.06)), top = surf(1, 0.02, z, 1.2); vents.push(new THREE.Vector3(0, top[1], z));
      for (let i = 0; i < 6; i++) { d.P.push(rng.range(-0.5, 0.5), top[1] - 0.3, z + rng.range(-1.2, 1.2), -1); d.V.push(0, rng.range(0.7, 1.2), 0, 0); d.S.push(rng.range(0.7, 1.2), rng.range(4, 6), rng.range(6, 9), rng()); d.K.push(rng.range(0.1, 0.16), 1, 0.9, 0.8); }
    }
    const steam = makeVapour(d, Object.assign(fogU(), U), 2); steam.renderOrder = 4; object.add(steam);
  }
  await ctx.yield();
  // wet stone and ripple rings where the two veils land
  const fallZones = gunDefs.map((g) => new THREE.Vector3(-g.sx * 16.6, TY, HZ + 1.2));
  {
    const pos = [], uv = [], gi = [];
    fallZones.forEach((c, i) => { for (const [a, b] of [[-1, -1], [1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]]) { pos.push(c.x + a * 6, TY + 0.05, c.z + b * 6); uv.push(a, b); gi.push(i); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aGun', new THREE.Float32BufferAttribute(gi, 1));
    const wet = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), U, { uSky: { value: new THREE.Color().setRGB(skyC[0], skyC[1], skyC[2]) } }), defines: { NG: 2 }, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`
        attribute float aGun; varying vec2 vUv; varying float vWet; varying vec3 vW; uniform float uProg[NG];
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vWet = smoothstep(0.8, 1., uProg[int(aGun + 0.5)]); vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
          vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying float vWet; varying vec3 vW; uniform float uTime; uniform vec3 uSky; uniform vec3 uSunCol;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          float r = length(vUv) + (sfFbm(vW.xz*0.33) - 0.5)*0.6;
          float m = (1. - smoothstep(0.4, 0.98, r))*vWet;
          vec2 g = vW.xz*1.25; vec2 id = floor(g); vec2 f = fract(g) - 0.5; float h = sfHash(id);
          float ph = fract(uTime*(0.8 + h) + h*7.);
          float ring = (1. - smoothstep(0., 0.05, abs(length(f + (vec2(sfHash(id + 3.), sfHash(id + 7.)) - 0.5)*0.4) - ph*0.42)))*(1. - ph);
          float a = m*(0.55 + 0.4*ring);
          if (a < 0.004) discard;
          gl_FragColor = vec4(mix(vec3(0.015, 0.02, 0.025), uSky, 0.16) + uSunCol*(ring*0.7), clamp(a, 0., 1.));
          #include <fog_fragment>
          gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));
        }`,
    }));
    wet.renderOrder = 1; object.add(wet);
  }

  // ---- materials and meshes ---------------------------------------------------------------------------
  const sideU = U.uSunSide; sideU.value = sunSgn;
  const patches = [0, 1, 2].map(() => new THREE.Vector4(rng.range(zB + 3, zF - 3), rng.sign() * rng.range(4, 17), rng.range(0.8, 1.9), rng.range(0.9, 2.1)));
  const thatchMat = makeThatchMaterial({
    uTime: U.uTime, uSunSide: sideU, uSunW: U.uSun, uMoss: { value: new THREE.Color(0.095, 0.135, 0.05) }, uFrost: { value: new THREE.Color(frostC[0], frostC[1], frostC[2]) },
    uFresh: { value: new THREE.Color(0.62, 0.47, 0.22) }, uPatch: { value: patches }, uSL: { value: roof.SL }, uSnow: { value: opts.snow ?? 0 }, uBounce: { value: opts.bounce ?? 0.5 },
  });
  const SWAY = /* glsl */`
    uniform float uTime;
    vec3 sfSway(float depth, float ph){ return vec3(sin(uTime*1.25 + ph)*0.6 + sin(uTime*2.9 + ph*1.7)*0.25, 0., cos(uTime*1.05 + ph*1.3)*0.5)*(0.05*depth); }`;
  const paperGlow = { value: opts.paperGlow ?? 0 };
  const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  solidMat.onBeforeCompile = (sh) => { // grain, grime, and on the terrace floor: pebbles, frost bloom, fallen ginkgo leaves
    sh.uniforms.uLeaf = { value: new THREE.Color(goldC[0], goldC[1], goldC[2]) }; sh.uniforms.uPaperGlow = paperGlow; sh.uniforms.uFrost = { value: new THREE.Color(frostC[0], frostC[1], frostC[2]) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; uniform vec3 uLeaf; uniform vec3 uFrost; uniform float uPaperGlow;' + GLSL_NOISE)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float pg = smoothstep(0.42, 0.55, min(vColor.r, min(vColor.g, vColor.b)))*step(vON.y, 0.5); totalEmissiveRadiance += vec3(1.0, 0.62, 0.3)*(uPaperGlow*pg*(0.55 + 0.45*sfN(vOP.xy*0.9 + vOP.z))); }')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 an = abs(vON); vec2 q = an.y > 0.6 ? vOP.xz : (an.x > an.z ? vOP.zy : vOP.xy);
          float g1 = sfFbm(q*1.7), g2 = sfN(q*vec2(23., 2.5)), g3 = sfN(q*31.);
          vec3 b = diffuseColor.rgb*(0.68 + 0.36*g1 + 0.2*g2 + 0.12*g3);
          if (vON.y > 0.9 && abs(vOP.y - ${TY.toFixed(2)}) < 0.02) {
            b *= 0.93 + 0.14*smoothstep(0.5, 0.75, sfN(vOP.xz*9.));
            b = mix(b, uFrost, 0.3*smoothstep(0.45, 0.8, sfFbm(vOP.xz*0.45 + 11.))*(0.5 + 0.5*g3));
            float leaf = smoothstep(0.8, 0.86, sfN(vOP.xz*4.7))*smoothstep(0.55, 0.8, sfFbm(vOP.xz*0.11 + 5.));
            b = mix(b, uLeaf*0.7, leaf*0.85);
          }
          diffuseColor.rgb = b; }`);
  };
  const softMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  softMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aX;' + SWAY)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += sfSway(aX.x, aX.y) + vec3(0., 0., 1.)*(sin(position.x*2.6 + position.y*3.1 - uTime*3.4 + aX.y)*0.16*aX.x*aX.z);`);
  };
  const fruitGeo = new THREE.SphereGeometry(1, 5, 3); fruitGeo.scale(1, 0.88, 1);      // seen from 14 m at the nearest: five sides are round enough
  const nF = fruits.length / 9, sw = new Float32Array(nF * 3);
  const fruitMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
  fruitMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uSunW = U.uSun;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 iSw; varying vec3 vFp;' + SWAY)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFp = position; transformed += sfSway(iSw.x, iSw.y)*iSw.z;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunW; varying vec3 vFp;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 fp = normalize(vFp + vec3(0., 1e-3, 0.));      // the calyx: a dark four-pointed cap where the fruit hangs from
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.05, 0.025), 0.85*smoothstep(0.5, 0.66, fp.y)*(1. - smoothstep(0.5, 0.64, abs(fp.x) + abs(fp.z)))); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 vd = normalize(vViewPosition); vec3 sunV = (viewMatrix*vec4(uSunW, 0.)).xyz;
          totalEmissiveRadiance += diffuseColor.rgb*(0.1 + 0.8*smoothstep(-0.3, 0.7, dot(sunV, -vd))); }`);
  };
  const fruitMesh = new THREE.InstancedMesh(fruitGeo, fruitMat, nF), M4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < nF; i++) {
    const o = i * 9, s = fruits[o + 3];
    M4.makeScale(s, s, s).setPosition(fruits[o], fruits[o + 1], fruits[o + 2]); fruitMesh.setMatrixAt(i, M4);
    fruitMesh.setColorAt(i, col.setRGB(fruits[o + 6], fruits[o + 7], fruits[o + 8]));
    sw[i * 3] = fruits[o + 4]; sw[i * 3 + 1] = fruits[o + 5]; sw[i * 3 + 2] = 1 / s;
  }
  fruitGeo.setAttribute('iSw', new THREE.InstancedBufferAttribute(sw, 3)); fruitMesh.frustumCulled = false;
  await ctx.yield();
  const solid = new THREE.Mesh(await S.buildSlowly(ctx), solidMat); await ctx.yield();
  const thatch = new THREE.Mesh(await T.buildSlowly(ctx), thatchMat); await ctx.yield();
  const soft = new THREE.Mesh(await W.buildSlowly(ctx), softMat);
  soft.frustumCulled = false;
  object.add(solid, thatch, soft, fruitMesh);
  for (const l of lids) { l.mesh = new THREE.Mesh(l.geo, thatchMat); l.pivot.add(l.mesh); }
  await ctx.yield();

  // ---- anchors ----------------------------------------------------------------------------------------
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  Object.assign(anchors, {
    portalSeat: { position: V3(0, 9, zF + 14), facing: V3(0, 0, 1), radius: 7 },
    flyThrough: [V3(0, 9, 96), V3(0, 9, 80), V3(0, 9, 64), V3(0, 9, 48), V3(0, 9, 34), V3(0, 9, zF + 14)],
    viewpoints: { reveal: V3(70, 55, 120), approach: V3(0, 9, 91), eaveSide: V3(sunSgn * 30, 6, zF - 4) },
    guns: gunDefs.map((g) => ({ muzzle: V3(...g.position), toward: V3(-g.sx, 0, 0) })),
    crossing: V3(0, 31, HZ), fallZones, ridge: [V3(0, ridgeY, zF + 1.3), V3(0, ridgeY, zB - 1.3)], smokeVents: vents,
    roofPerches: roof.perches.map((p) => V3(p[0], p[1], p[2])),
  });

  // ---- progress, animation ----------------------------------------------------------------------------
  const prog = [0, 0]; let fireRate = 0, frame = 0;
  const applyProgress = () => {
    for (let i = 0; i < 2; i++) F.setProgress(i, prog[i]);
    for (const l of lids) {
      const o = Math.min(1, Math.max(0, (prog[l.gi] - 0.02 * l.lag) / (0.1 + 0.1 * l.lag)));
      const bounce = o < 0.7 ? (o / 0.7) * (o / 0.7) : 1 - 0.13 * Math.sin(((o - 0.7) / 0.3) * Math.PI) * (1 - (o - 0.7) / 0.3);   // bangs open, rebounds once
      l.pivot.rotation.z = -PITCH - l.swing * bounce;
    }
  };
  const hero = {
    object, radius: 32, height: 37, center: V3(0, 14, 10), anchors, ground: true, groundY: 0, fountains: F, fine: [fruitMesh, soft],   // fine: small things a world may hide while the piece is far away
    get progress() { return Math.min(prog[0], prog[1]); },
    setProgress(p, i) { p = Math.min(1, Math.max(0, p)); if (i === undefined) prog[0] = prog[1] = p; else prog[i] = p; fireRate = 0; applyProgress(); },
    fire(seconds = 2.4) { fireRate = 1 / Math.max(0.2, seconds); },
    update(dt, time, camera) {
      if (fireRate > 0) { for (let i = 0; i < 2; i++) prog[i] = Math.min(1, prog[i] + dt * fireRate * (i ? 0.92 : 1)); applyProgress(); if (prog[0] >= 1 && prog[1] >= 1) fireRate = 0; }
      F.update(dt, time, camera, ctx.renderer);
      if (frame++ % 90 === 0) { // follow the scene's key light unless a sun direction was given
        if (!opts.sunDir) {
          let root = object; while (root.parent) root = root.parent;
          let key = null; root.traverse((n) => { if (!key && n.isDirectionalLight) key = n; });
          if (key) { key.updateMatrixWorld(); key.target.updateMatrixWorld(); U.uSun.value.setFromMatrixPosition(key.matrixWorld).sub(col2.setFromMatrixPosition(key.target.matrixWorld)).normalize(); }
        }
        object.updateMatrixWorld(); col2.copy(U.uSun.value).transformDirection(inv.copy(object.matrixWorld).invert());
        sideU.value = col2.x >= 0 ? 1 : -1;
      }
    },
    dispose() { for (const g of lidGeos) g.dispose(); },
  };
  const col2 = new THREE.Vector3(), inv = new THREE.Matrix4();
  hero.setProgress(opts.progress ?? 1);
  return hero;
}

export { Geo, GLSL_NOISE, makeVapour, makeThatchMaterial, buildRoof, hangRadish, hangCorn };
