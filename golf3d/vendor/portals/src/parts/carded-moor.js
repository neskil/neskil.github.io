// THE SNAG: hero set piece of "carded-moor" (Wool on the Thorn).
// A 60 m woolsack tor of stacked grey felt boulders that has snagged a cloud of raw white fleece. The fleece is an
// opaque lumpy root mound (about 130 m across, heaped against the lee and south sides of the tor between y 25 and
// y 47) drawn downwind into a streamer a kilometre long that thins, sags and tears into wisps and is renewed from the
// root on a 71 s loop. Combed strands slide east over it at 14 m/s, loose locks tear off and tumble, fibres stream off
// the two top boulders (the thorns), two stags stand under the overhang with wool breath (opts.moreStags adds others
// of the group where the world has slabs for them). When the world passes opts.ground (its own land, local), the fleece is
// cut along a line 13 m east of the fly line and heaped on the lee side and up the east thorn (the tower), nothing of it
// lies under the land, and the lens never enters it. Round the journey's end the fleece is built to be seen from 7 m: every
// lump there carries smaller billows down to a metre (parts.fleeceNear, grown in within 236 m), creases between billows are
// baked lavender, each billow wears soft camera-facing tufts (parts.tufts: the fibre halo of every outline), and any ribbon
// seen close is narrowed to a strand a few pixels wide. Nothing is discarded from the lumps: no plate, seam or cut corner.
//
// FRAME    Origin = centre of the tor's base (the hilltop, +50 m in the brief), +Y up. Local compass: -Z north,
//          +X east (downwind: the gale blows toward +X), +Z south = the front the journey looks at. The camera's final
//          approach comes from azimuth opts.approach (default 22.5 deg east of south, i.e. it travels north-north-west).
//          Sun of the brief (east-south-east, 25 deg up) is toward (0.84, 0.42, 0.35).
// SIZE     radius 80 (tor + root mound; the streamer runs on to x = +1060), height 80. Thorn tops y 80 and y 75.
// OPTS     palette   7 hex strings in the brief's order [heather, moss, peat, raw white, granite, sky blue, russet]
//          hour      'morning' (default) | 'gold' (06:30, low ENE sun, lavender shadows) | 'moon' (silver on blue-black)
//          weather   'gale' (default) | 'fog' (more teased mist round the root) | 'shower' (grey roving skeins hang
//                    under the streamer)
//          season    'august' (default) | 'rut' (rusted cap, stags roaring, bigger breath) | 'june' (green cap)
//          approach  radians, azimuth the camera arrives from, measured from +Z toward +X (default 0.3927)
//          stags     true (default) | false: the two stags and their rock shoulder (move them: hero.parts.stags)
//          cap       true (default) | false: the felt hill (275 m radius, profile hero.hillAt(x, z)) and loose boulders
//                    under the tor. Pass false when the world's own terrain carries the tor.
//          stagSeat  Vector3: where the stags' rock shoulder sits (default 14 m left of the fly line, 196 m out)
//          moreStags [{ x, y, z (local feet), yaw, size }] further stags; stagScale = the scale the world gives parts.stags
//          ground    (x, z) local -> height of the world's own land (the crest under the thorns), see above
//          light     { sunDir, sunColor, fill, bounce, rim } as setLight
//          passage   true (default) | false: the camera-following wool veil and lens strands (only for a world that flies INTO the wool)
//          thornTops [tall, short] heights of the two thorn tips (default [80, 75]); the wool tower follows the east one
//          thornRise [tall, short] metres each thorn stands above its thornTops height (default 0): the stacks as tall cairns, see column()
// ANCHORS  (local space)
//          portalSeat   { position (0,47,0), normal (toward the arriving camera, pitched 5 deg), radius 7 }
//          flyThrough   ordered points: flank -> under the overhang -> into the wool -> furrow -> portal centre.
//                       Boulders stay >= 7 m from this line; the fleece is soft and is 2.2 m under it in the furrow.
//          woolEntry / woolExit   where that line pierces the underside and leaves the top of the mound
//          thorns       [{ top, base, radius } x2] west (taller) and east thorn
//          stagShoulder position of the stags' rock shoulder; overhang  a point on the underside above them
//          streamer     { root, tail, width: [90, 25] }; furrow { from, to }
//          viewpoints   [{ position, target, note }] composed stills (entry axis, stags, furrow)
//          windDir (1,0,0), windSpeed 14, sunDir (toward the brief's sun)
// HOOKS    update(dt, time, camera) animates everything and computes how deep the camera is in the wool from its
//          position (a place, never wall-clock). insideAt(worldPos) returns that 0..1 value so the world can ramp
//          its own fog or exposure; setInside(v|null) overrides it; setProgress(u) is not needed.
//          setLight({ sunDir, sunColor, fill, bounce, rim }) relights every material (linear THREE.Colors, colours
//          already multiplied by intensity). setWind(strength 0..1.5) scales strand speed and fibre lift.
// STYLE    Needle felt, done in the fragment chunk FELT below (copy it for the rest of the world): wrapped diffuse
//          (N.L*0.5+0.5)^1.5, no specular; lavender fill from above and in shadow; fuzz rim (1-N.V)^3 broken by
//          fibre noise and stronger sunward; carded flecks = base colour mixed toward a warm and a cool neighbour by
//          value noise stretched 4:1 in object space; needle dimples = jittered dots in object space that darken 8%
//          and dent the normal; flecks and dimples fade out by fwidth of the object coordinate so nothing crawls;
//          nap = sin bands 60 m wide travelling +X at 14 m/s that shift tone 12% (same function as GLSL nap()).
// LIGHT    Does not read three.js lights. Defaults are the brief's: cream key 1.2 from ESE, lavender-blue fill 0.42,
//          heather bounce. Sunlit fleece tops reach about 1.0-1.1 (a breath of bloom at threshold 0.9); albedo 0.78.
//          Every material honours scene fog. No lights of its own, no textures.
// COST     (the fleece has a light build, parts.fleeceLo, drawn instead of the full one beyond 300 m: same material)
//          about 141k triangles, 8 draw calls (tor+hill cap, fleece, strands, stag shoulder, stags, breath, and the
//          veil + lens strands only while the camera is in the wool), 300-400 ms build on the slow test machine.
//          ctx.quality.detail thins strands, fuzz and fringe only.
// FLEECE   The fleece shader's combed strands follow the size of a pixel (two cross-faded octaves), curl with a warp of their
//          own, and its bump comes from differences of a smooth relief at small world offsets, not from screen derivatives.
//          Crowns that face the sky or the sun are cream, undersides and creases lavender. A ragged fringe of wisps hangs
//          from the south and west rim. opts.footWool = [{ x, y, z, r, tuft }] (local) adds raw wool to boulders at the tor's foot.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { Geo } from '../kit/fauna/common.js';

const DEF_PALETTE = ['#8B5FA3', '#6E8B3D', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'];
const WIND = 14, STREAM_LEN = 1000;

// ---------------------------------------------------------------- shared GLSL (the felt style)
export const FELT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uFillCol, uBounceCol, uRimCol;
uniform float uTime, uWindK;
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
// gust bands 60 m wide crossing toward +X at 14 m/s
float nap(vec3 w){ float a = w.x - uTime * 14., c = w.z; return sin(a * .1047 + sin(c * .021) * 1.7 + sin(c * .057 + a * .013) * .8); }
// a material may widen and brighten the fuzz rim for small things seen close (set both in main() before felt())
float gRimK = 1., gRimW = 0., gDimK = 1.;      // gDimK: strength of the needle dimples (raw fleece has almost none)
float gSun = 1.;      // share of the direct sun that reaches the point, 0..1 (cast shade: a material sets it before felt())
// base: linear albedo. N, V unit, world space. obj: stable object-space position (metres). grain: pattern scale.
vec3 felt(vec3 base, vec3 N, vec3 V, vec3 obj, vec3 world, float grain, float ao, float napK){
  vec3 q = obj * grain;
  float fw = (abs(dFdx(q.x)) + abs(dFdy(q.x)) + abs(dFdx(q.y)) + abs(dFdy(q.y)) + abs(dFdx(q.z)) + abs(dFdy(q.z)));
  float fadeF = 1. - smoothstep(.25, .9, fw * 2.2), fadeD = 1. - smoothstep(.2, .7, fw * 1.6);
  // carded flecks: three related hues
  float f1 = vn3(q * vec3(2.2, .55, 2.2) + 7.3), f2 = vn3(q.zxy * vec3(.6, 2.6, 2.6) + 19.1);
  vec3 warm = base * vec3(1.13, 1.0, .84), cool = base * vec3(.84, .9, 1.14);
  vec3 col = mix(base, mix(warm, cool, step(.5, f2)), fadeF * smoothstep(.56, .7, abs(f1 - f2) + f1 * .45) * .6);
  col *= 1. + (f1 - .5) * .16 * fadeF;
  // needle dimples
  vec3 dq = q * 1.6, ci = floor(dq), cf = fract(dq) - .5;
  vec3 jit = (vec3(h13(ci), h13(ci + 17.), h13(ci + 41.)) - .5) * .5;
  vec3 dv = cf - jit; float dd = dot(dv, dv), dim = (1. - smoothstep(.006, .05, dd)) * fadeD * gDimK;
  col *= 1. - .1 * dim;
  N = normalize(N + dv * dim * 1.6);
  // fibre noise for the rim
  float fib = vn3(q * vec3(5., 5., 1.2) + 3.) * fadeF + .5 * (1. - fadeF);
  float wrap = dot(N, uSunDir) * .5 + .5; float key = wrap * sqrt(wrap) * gSun;
  float up = N.y * .5 + .5;
  vec3 light = uSunCol * key + uFillCol * (.45 + .55 * up) * (1. - .45 * key) + uBounceCol * (1. - up);
  col *= 1. + .12 * napK * nap(world);
  vec3 outc = col * light * ao;
  float fr = 1. - clamp(dot(N, V), 0., 1.);
  outc += uRimCol * (fr * fr * mix(fr, 1., gRimW)) * (.35 + .9 * fib) * (.3 + .7 * key) * (.4 + .6 * ao) * gRimK;
  return outc;
}
`;
const VERT_HEAD = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uWindK;
varying vec3 vWorld, vObj, vNrm, vCol;
`;
const FRAG_HEAD = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vWorld, vObj, vNrm, vCol;
` + FELT;

export function lightFor(hour) {
  const c = (h, k) => new THREE.Color(h).multiplyScalar(k);
  // 'early': the morning look's low warm sun, 15 degrees up in the east and a little ahead of the entry heading (long shadows, rim light)
  // (round 7: 13.5 degrees up and 62 degrees right of the entry heading, so from the entry the Snag is lit three-quarters from behind: warm on its right edges, lavender on the faces turned to the lens)
  if (hour === 'early') return { sunDir: new THREE.Vector3(0.859, 0.233, -0.457).normalize(), sunColor: c('#ffd9a6', 1.55), fill: c('#9aa0e6', 0.5), bounce: c('#8B5FA3', 0.17), rim: c('#ffe2ba', 0.74) };
  if (hour === 'gold') return { sunDir: new THREE.Vector3(0.86, 0.14, -0.49).normalize(), sunColor: c('#ffc98a', 1.35), fill: c('#9c9be0', 0.4), bounce: c('#8B5FA3', 0.14), rim: c('#ffe2c0', 0.5) };
  if (hour === 'moon') return { sunDir: new THREE.Vector3(0.62, 0.5, 0.6).normalize(), sunColor: c('#b9c8ee', 0.42), fill: c('#3f4f8c', 0.16), bounce: c('#2a2440', 0.06), rim: c('#cfdcff', 0.22) };
  return { sunDir: new THREE.Vector3(0.837, 0.423, 0.347).normalize(), sunColor: c('#fff0d2', 1.2), fill: c('#aeb2ea', 0.42), bounce: c('#8B5FA3', 0.16), rim: c('#fff6e6', 0.42) };
}

// unit icosphere, indexed, cached per detail
const ICO = new Map();
function ico(detail) {
  if (ICO.has(detail)) return ICO.get(detail);
  let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const o = { pos: g.attributes.position.array.slice(), idx: Array.from(g.index.array) }; g.dispose(); ICO.set(detail, o); return o;
}
// growing typed buffers for merged geometry
class Buf {
  constructor(layout) { this.layout = layout; this.d = {}; this.keys = Object.keys(layout); this.sz = this.keys.map((k) => layout[k]); this.arr = this.keys.map((k) => (this.d[k] = [])); this.idx = []; this.n = 0; }
  push(v) { const K = this.keys; for (let j = 0; j < K.length; j++) { const a = v[K[j]], d = this.arr[j], n = this.sz[j]; for (let i = 0; i < n; i++) d.push(a[i]); } return this.n++; }
  build(normals = false) {
    const g = new THREE.BufferGeometry();
    for (const k in this.layout) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(this.d[k]), this.layout[k]));
    g.setIndex(this.n > 65535 ? new THREE.BufferAttribute(new Uint32Array(this.idx), 1) : new THREE.BufferAttribute(new Uint16Array(this.idx), 1));
    if (normals) g.computeVertexNormals();
    return g;
  }
  // the same geometry with its normals, handing the page back between the copy and the normals
  async buildAsync(ctx) { const g = this.build(false); await ctx.yield?.(); g.computeVertexNormals(); return g; }
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('snag') : ctx.rng, noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const [cHeather, cMoss, cPeat, cWhite, cGranite, cSky, cRusset] = pal;
  const hour = opts.hour || 'morning', weather = opts.weather || 'gale', season = opts.season || 'august';
  const L = lightFor(hour);
  const group = new THREE.Group(); group.name = 'the-snag';
  const mats = [];
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const baseU = () => ({ ...fogU(), uTime: { value: 0 }, uWindK: { value: 1 }, uSunDir: { value: L.sunDir.clone() }, uSunCol: { value: L.sunColor.clone() },
    uFillCol: { value: L.fill.clone() }, uBounceCol: { value: L.bounce.clone() }, uRimCol: { value: L.rim.clone() } });

  // ---------------------------------------------------------------- frame of the approach
  const az = opts.approach ?? 0.3927;
  const Ax = Math.sin(az), Az = Math.cos(az), Rx = Math.cos(az), Rz = -Math.sin(az);   // A: from tor toward the arriving camera; R: camera right
  const xz = (lat, s) => [Rx * lat + Ax * s, Rz * lat + Az * s];
  const sOf = (x, z) => x * Ax + z * Az, latOf = (x, z) => x * Rx + z * Rz;
  const PATH = [[0, 47], [60, 41.75], [90, 38], [115, 27], [150, 10.7], [200, -14]];       // [s, y]
  const pathY = (s) => { if (s <= 0) return 47 - s * 0.0875; for (let i = 1; i < PATH.length; i++) if (s <= PATH[i][0]) { const a = PATH[i - 1], b = PATH[i]; return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0])); } return -14 - (s - 200) * 0.5; };
  const flyPts = [[250, -38], [200, -14], [150, 10.7], [115, 27], [90, 38], [60, 41.75], [30, 44.4], [0, 47]].map(([s, y]) => { const p = xz(0, s); return new THREE.Vector3(p[0], y, p[1]); });
  // distance from a point to the fly line (only the part above y 8, where the tor and wool are)
  const flyDist = (x, y, z) => { const s = clamp(sOf(x, z), -10, 160), lat = latOf(x, z), ds = sOf(x, z) - s, dy = y - pathY(s); return Math.sqrt(lat * lat + dy * dy * 0.92 + ds * ds); };

  // ---------------------------------------------------------------- the root mound as two height fields
  // The wool is heaped on the lee (east) side of the crest the journey climbs: its centre stands MC_LAT to the right of the
  // fly line and its west edge is cut along a line EDGE_LAT right of it, so the heather crest, the west thorn and the moor
  // beyond stay in the open and the fleece laps onto the crest's east side, round the east thorn's foot.
  const MC_LAT = 50, MC_S = 38, EDGE_LAT = 13, Y_MID = 33;
  const MC = { x: Rx * MC_LAT + Ax * MC_S, z: Rz * MC_LAT + Az * MC_S };
  const groundAt = typeof opts.ground === 'function' ? opts.ground : null;    // (x, z) local -> height of the world's land there
  const gY = (x, z) => (groundAt ? groundAt(x, z) : -1e3);
  const thO = Math.atan2(-MC.z, -MC.x), fo = rng.range(0, 50), lobeA = rng.range(4, 8);
  const sminR = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
  const footR = (th) => { const cl = Math.cos(th) * Rx + Math.sin(th) * Rz;
    const r = 64 + 11 * Math.max(0, Math.cos(th - thO)) ** 2 + lobeA * noise.n2(Math.cos(th) * 1.1 + fo, Math.sin(th) * 1.1) + 3 * noise.n2(Math.cos(th) * 3.1, Math.sin(th) * 3.1 + fo)
      + 10 * Math.max(0, Math.cos(th - 0.15)) ** 3;   // drawn out a little downwind
    return cl < -0.08 ? sminR(r, (MC_LAT - EDGE_LAT) / -cl * (1 + 0.07 * noise.n2(Math.cos(th) * 2.6 - fo, Math.sin(th) * 2.6)), 9) : r; };
  const bumps = [];
  for (let i = 0; i < 64; i++) { const th = rng.range(0, 6.2832), rr = Math.sqrt(rng()) * 0.92 * footR(th); bumps.push({ x: MC.x + Math.cos(th) * rr, z: MC.z + Math.sin(th) * rr, r: rng.range(9, 19), h: rng.range(2.2, 6.5), hb: rng.range(0.5, 3.2) }); }
  const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
  const rhoAt = (x, z) => { const dx = x - MC.x, dz = z - MC.z; return Math.sqrt(dx * dx + dz * dz) / footR(Math.atan2(dz, dx)); };
  const moundAt = (x, z, rho = rhoAt(x, z)) => {
    const T = Math.sqrt(Math.max(0, 1 - rho * rho * rho));
    let st = 0, sb = 0;
    for (let i = 0; i < bumps.length; i++) { const b = bumps[i], dx = (x - b.x) / (b.r * 1.7), dz = (z - b.z) / b.r, k = 1 - dx * dx - dz * dz; if (k > 0) { const kk = k * (2 - k); let v = b.h * kk; v *= v; st += v * v; v = b.hb * kk; v *= v; sb += v * v; } }
    const s0 = sOf(x, z), wedge = lerp(1, 0.68, smoothstep(15, 105, s0));          // the wool is heaped highest against the tor
    let top = Y_MID + T * wedge * (8.5 + Math.sqrt(Math.sqrt(st)) + 1.5 * noise.fbm2(x * 0.03 + fo, z * 0.085, 3));
    for (let i = 0; i < thorns.length; i++) { const dx = x - thorns[i].base.x, dz = z - thorns[i].base.z; top -= 6.5 * Math.exp(-(dx * dx + dz * dz) / 170); }   // the thorns stand clear
    const bottom = Y_MID - T * (5.2 + Math.sqrt(Math.sqrt(sb)) + 6 * Math.exp(-(x * x + z * z) / 800)); top = Math.max(top, bottom + 1.2 * T);
    return { top, bottom, T };
  };
  const insideLocal = (x, y, z) => {
    const rho = rhoAt(x, z); if (rho > 1.05) return 0;
    const m = moundAt(x, z, rho), aB = smoothstep(-9, -1.5, y - m.bottom), aT = 1 - smoothstep(0.8, 2.0, y - m.top);
    return Math.min(aB, aT) * (1 - smoothstep(0.93, 1.05, rho));
  };

  // the hill the tor stands on (assumed profile: rounded top, steepening to about 25 degrees on the flank)
  const hillAt = (x, z) => { const r = Math.hypot(x, z); return 3.2 * Math.exp(-(r * r) / 1100) - 0.0012 * Math.max(0, r - 95) ** 2 - 0.00006 * r * r; };

  // ---------------------------------------------------------------- the tor: stacked woolsack boulders
  const boulders = [];   // { x, y, z, rx, ry, rz, yaw, tilt, tiltAz, det, thorn }
  const addB = (lat, s, y0, rx, ry, rz, o = {}) => { const p = xz(lat, s); boulders.push({ x: p[0], y: y0 + ry, z: p[1], rx, ry, rz, yaw: rng.range(0, 6.28), tilt: rng.range(0, 0.1), tiltAz: rng.range(0, 6.28), det: 3, seed: rng.range(0, 99), ...o }); };
  // the tor is a cluster of columns of stacked slabs (woolsack weathering): two tall thorn columns either side of
  // the portal seat, a low saddle between them and buttress stacks round the foot
  const thorns = [];
  const column = (lat, s, topY, rBase, rTop, o = {}) => {
    const b0 = boulders.length;
    let y = -1.8; const eggH = o.thorn ? (o.tall ? rng.range(15.5, 17.5) : rng.range(13, 15)) : 0, bodyTop = topY - eggH * 0.9, lean = o.lean || 0;
    while (y < bodyTop - 0.4) {
      const t = clamp(y / Math.max(bodyTop, 1), 0, 1), r = lerp(rBase, rTop, Math.pow(t, 0.75)) * rng.range(0.9, 1.1);
      let h = rng.range(6.4, 9.4) * (0.7 + 0.3 * r / 8); if (bodyTop - (y + h * 0.88) < 3.2) h = (bodyTop - y) / 0.88 + 0.01;
      const k = 1 - t * 0.6;
      addB(lat + rng.range(-1.3, 1.3) * k, s + rng.range(-1.3, 1.3) * k, y, r * rng.range(1.0, 1.18), h / 2, r * rng.range(0.9, 1.05), { det: o.thorn && y > 24 ? 5 : 4, thorn: o.thorn && y > 30 ? 1 : 0, tilt: rng.range(0, 0.06) });
      boulders[boulders.length - 1].x += lean * t * t;
      y += h * 0.88;
    }
    if (o.thorn) { const p = xz(lat, s), ry = eggH / 2;
      boulders.push({ x: p[0] + lean + 0.3, y: topY - ry, z: p[1], rx: rTop * 0.84, ry, rz: rTop * 0.74, yaw: 0, tilt: -rng.range(0.14, 0.22), tiltAz: 0, det: 6, seed: rng.range(0, 99), thorn: 2, egg: 1 });
      thorns.push({ top: new THREE.Vector3(p[0] + lean + 1.8, topY, p[1]), base: new THREE.Vector3(p[0], 38, p[1]), radius: rTop, tall: o.tall }); }
    // opts.thornRise: the thorn stands this much taller than topY (the wool tower still follows topY). The stack is rebuilt from a
    // stream of its own, so the main stream has drawn exactly what it drew for the short one and the fleece is unchanged. A cairn of
    // broad and narrow stones in turn: slim where the portal passes, a belly two thirds of the way up, a neck, a long leaning tip.
    if (o.thorn && o.rise > 0) { boulders.length = b0; const th = thorns[thorns.length - 1], r2 = makeRng(hashSeed('snag-tall:' + (ctx.seed ?? 0) + (lat < 0 ? ':w' : ':e')));
      const top2 = topY + o.rise, egg2 = o.tall ? 23 : 19, body2 = top2 - egg2 * 0.9, ln = 3.6, p0 = xz(lat, s); let yy = -1.8, k = 0;
      while (yy < body2 - 0.4) { const t = clamp(yy / body2, 0, 1), prof = lerp(8.3, 6.6, t * Math.sqrt(t)) * (1 + 0.38 * Math.exp(-(((t - 0.63) / 0.17) ** 2)));
        const r = prof * (k % 2 ? r2.range(0.76, 0.88) : r2.range(1.0, 1.14)); let h = r2.range(7.6, 11.4) * (0.7 + 0.3 * r / 8) * (k % 2 ? 0.74 : 1); if (body2 - (yy + h * 0.88) < 3.6) h = (body2 - yy) / 0.88 + 0.01;
        const kk = 1 - t * 0.45, p = xz(lat + r2.range(-1.5, 1.5) * kk, s + r2.range(-1.5, 1.5) * kk);
        boulders.push({ x: p[0] + ln * t * t, y: yy + h / 2, z: p[1], rx: r * r2.range(1.0, 1.16), ry: h / 2, rz: r * r2.range(0.9, 1.05), yaw: r2.range(0, 6.28), tilt: r2.range(0, 0.07), tiltAz: r2.range(0, 6.28), det: yy > 24 && yy < 118 ? 5 : 4, seed: r2.range(0, 99), thorn: yy > 30 ? 1 : 0 });
        yy += h * 0.88; k++; }
      boulders.push({ x: p0[0] + ln + 0.3, y: top2 - egg2 / 2, z: p0[1], rx: 6.3, ry: egg2 / 2, rz: 5.6, yaw: 0, tilt: -r2.range(0.14, 0.22), tiltAz: 0, det: 6, seed: r2.range(0, 99), thorn: 2, egg: 1 });
      th.tip = new THREE.Vector3(p0[0] + ln + 1.8, top2, p0[1]); }
  };
  const RISE = Array.isArray(opts.thornRise) ? opts.thornRise : [0, 0];
  const TOPS = Array.isArray(opts.thornTops) ? opts.thornTops : [80, 75];
  const tallW = rng.chance(0.75) ? -1 : 1;   // which thorn is the taller one (usually the upwind, west one)
  for (const sd of [-1, 1]) column(sd * (15.4 + rng.range(0, 0.6)), rng.range(-1.5, 1.5), sd === tallW ? TOPS[0] : TOPS[1], rng.range(10, 11.5), 5.7, { thorn: 1, tall: sd === tallW, lean: 1.2, rise: sd === tallW ? RISE[0] : RISE[1] });
  column(rng.range(-1, 1), rng.range(-4, -1), rng.range(34.5, 37.5), 10.5, 6.2);                       // the saddle, top <= 38
  column(rng.range(-9, -4), rng.range(13, 17), rng.range(20, 27), 9, 6.5); column(rng.range(8, 13), rng.range(11, 15), rng.range(15, 22), 8.5, 6.5);
  column(rng.range(0, 6), rng.range(-19, -14), rng.range(24, 31), 9.5, 6); column(-rng.range(25, 29), rng.range(-2, 6), rng.range(12, 18), 8, 6); column(rng.range(25, 29), rng.range(-8, 0), rng.range(16, 24), 8.5, 6);
  if (rng.chance(0.6)) column(rng.range(-22, -16), rng.range(-16, -11), rng.range(9, 14), 7.5, 6);
  thorns.sort((a, b) => (a.tall ? -1 : 1));
  // keep every stone 7 m clear of the fly line: shrink offenders
  for (const b of boulders) { const d = flyDist(b.x, b.y, b.z) - Math.max(b.rx, b.ry, b.rz); if (d < 7.4) { const k = clamp((Math.max(b.rx, b.ry, b.rz) + d - 7.4) / Math.max(b.rx, b.ry, b.rz), 0.3, 1); b.rx *= k; b.rz *= k; b.ry *= k; } }

  const cGranA = cGranite.clone(), cGranDark = cGranite.clone().multiplyScalar(0.6).lerp(new THREE.Color('#5a5878'), 0.35), cLichen = cGranite.clone().lerp(new THREE.Color('#c9c4b0'), 0.5), cMossy = cGranite.clone().lerp(cMoss, 0.55);
  const tmpC = new THREE.Color(), e3 = new THREE.Euler(), q3 = new THREE.Quaternion(), v3 = new THREE.Vector3();
  const torBuf = new Buf({ position: 3, color: 3, aAo: 1 });
  const pushBoulder = (b, buf) => {
    const I = ico(b.det), n = I.pos.length / 3, base = buf.n, ex = b.egg ? 2.2 : 3.4;
    q3.setFromEuler(e3.set(Math.sin(b.tiltAz) * b.tilt, b.yaw, Math.cos(b.tiltAz) * b.tilt, 'YXZ'));
    const tone = 0.72 + 0.26 * ((b.seed * 7.13) % 1), groove = 0.25 + ((b.seed * 3.7) % 1) * 0.5;
    for (let i = 0; i < n; i++) {
      let dx = I.pos[i * 3], dy = I.pos[i * 3 + 1], dz = I.pos[i * 3 + 2];
      const m = Math.pow(Math.abs(dx) ** ex + Math.abs(dy) ** ex + Math.abs(dz) ** ex, -1 / ex);   // rounded block
      dx *= m; dy *= m; dz *= m;
      if (b.egg) { const t = dy * 0.5 + 0.5; const k = 1 - 0.56 * t * Math.sqrt(t); dx *= k; dz *= k; }           // thorn tip tapers
      const nz = noise.fbm3(dx * 1.3 + b.seed, dy * 1.3, dz * 1.3 + b.seed * 0.7, 3), fine = noise.n3(dx * 4.1 + b.seed, dy * 4.1, dz * 4.1);
      const gr = Math.exp(-(((dy - (groove - 0.5) * 0.9) / 0.07) ** 2)) * (b.egg ? 0.3 : 1);             // a bedding joint round the block
      const k = 1 + 0.11 * nz + 0.022 * fine - 0.05 * gr;
      v3.set(dx * b.rx * k, dy * b.ry * k, dz * b.rz * k).applyQuaternion(q3);
      const wy = b.y + v3.y, upF = clamp(dy * 1.4 + 0.2, 0, 1);
      tmpC.copy(cGranA).multiplyScalar(tone * (0.92 + 0.12 * nz) * (b.plain ? 0.62 : 1));
      tmpC.lerp(cLichen, clamp(upF * (0.02 + 0.5 * noise.n3(dx * 2 + 5, dy * 2, dz * 2 + b.seed)), 0, 0.4));
      if (wy < 24 && !b.plain) tmpC.lerp(cMossy, clamp((0.75 - wy / 32) * upF * (0.5 + noise.n3(dx * 1.7, b.seed, dz * 1.7)), 0, 0.7));
      tmpC.lerp(cGranDark, clamp(0.55 * gr + (0.5 - dy) * 0.35, 0, 0.75));
      buf.push({ position: [b.x + v3.x, wy, b.z + v3.z], color: [tmpC.r, tmpC.g, tmpC.b], aAo: [clamp(0.62 + 0.38 * (dy * 0.5 + 0.5) + 0.2 * upF, 0.5, 1)] });
    }
    for (let i = 0; i < I.idx.length; i++) buf.idx.push(base + I.idx[i]);
  };
  // (stones the world's land has buried are not built: the crest under the thorns swallows the lower tor)
  for (const b of boulders) b.buried = b.y + b.ry * 0.9 < gY(b.x, b.z) - 0.6;
  for (const b of boulders) { if (!b.buried) { ico(b.det); await ctx.yield?.(); pushBoulder(b, torBuf); } await ctx.yield?.(); }
  await ctx.yield?.();

  // ---------------------------------------------------------------- felt hill cap and loose boulders (same mesh as the tor)
  if (opts.cap !== false) {
    const capA = season === 'rut' ? cHeather.clone().lerp(cRusset, 0.55) : season === 'june' ? cMoss.clone().lerp(cHeather, 0.15) : cHeather.clone();
    const capB = cMoss.clone().multiplyScalar(0.9), capC = cPeat.clone().lerp(cHeather, 0.25), NA = 64, NR = 24, base = torBuf.n, co = rng.range(0, 40);
    for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) {
      const r = 275 * Math.pow(j / NR, 1.5), a = (i / NA) * 6.2832, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const nub = noise.fbm2(x * 0.09 + co, z * 0.09, 3), y = hillAt(x, z) + nub * 0.9 - 0.4;
      const k = noise.fbm2(x * 0.022 + co, z * 0.022 - co, 2), blae = smoothstep(46, 22, r) * 0.75 + smoothstep(0.1, 0.5, k) * 0.35;
      tmpC.copy(capA).multiplyScalar(0.62 + 0.3 * nub + 0.22 * noise.n2(x * 0.011 - co, z * 0.03)).lerp(capB, clamp(blae, 0, 0.9)).lerp(capC, smoothstep(0.25, 0.6, -k) * 0.6);
      torBuf.push({ position: [x, y, z], color: [tmpC.r, tmpC.g, tmpC.b], aAo: [0.72 + 0.28 * smoothstep(14, 40, r)] });
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = base + j * NA + i, b = base + j * NA + (i + 1) % NA, c = a + NA, d = b + NA; torBuf.idx.push(a, b, c, b, d, c); }
    const nLoose = 12 + rng.int(0, 5);
    for (let i = 0; i < nLoose; i++) { const a = rng.range(0, 6.2832), r = rng.range(25, 56), x = Math.cos(a) * r, z = Math.sin(a) * r, rr = rng.range(1.4, 3.6);
      if (flyDist(x, 0, z) < rr + 8) continue;
      pushBoulder({ x, y: hillAt(x, z) + rr * 0.25, z, rx: rr * rng.range(0.9, 1.3), ry: rr * rng.range(0.55, 0.8), rz: rr, yaw: rng.range(0, 6.28), tilt: rng.range(0, 0.25), tiltAz: rng.range(0, 6.28), det: 2, seed: rng.range(0, 99) }, torBuf); }
  }
  await ctx.yield?.();
  { // the wool shades what stands under it
    const P = torBuf.d.position, AO = torBuf.d.aAo;
    for (let i = 0; i < torBuf.n; i++) { if ((i & 1023) === 1023) await ctx.yield?.(); const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], rho = rhoAt(x, z); if (rho < 1) { const m = moundAt(x, z, rho); if (y < m.bottom + 2) AO[i] *= lerp(1, 0.6, m.T * smoothstep(60, 8, m.bottom - y)); } }
  }
  await ctx.yield?.();
  const torMat = new THREE.ShaderMaterial({
    fog: true, uniforms: baseU(),
    vertexShader: VERT_HEAD + /* glsl */`attribute float aAo; varying float vAo;
      void main(){ vObj = position; vCol = color; vAo = aAo; vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`varying float vAo;
      void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
        gl_FragColor = vec4(felt(vCol, N, V, vObj, vWorld, 1.5, vAo, .55), 1.);
        #include <fog_fragment>
      }`,
    vertexColors: true,
  });
  const torMesh = new THREE.Mesh(await torBuf.buildAsync(ctx), torMat); torMesh.name = 'tor'; group.add(torMesh); mats.push(torMat);
  await ctx.yield?.();

  // ---------------------------------------------------------------- the fleece: mound sheets, rim lumps and the travelling streamer (one mesh)
  // Two builds of it: the full one, and a light one (coarser sheets, lumps two steps coarser) drawn while the Snag is more
  // than 300 m off, where the difference is under a pixel. Same material, so the switch compiles nothing.
  const flBuf = new Buf({ position: 3, aLump: 4, aKind: 1, aAo: 1 }), flLo = new Buf({ position: 3, aLump: 4, aKind: 1, aAo: 1 });
  const sheets = async (buf, NA, NR) => {
    const topBase = buf.n, cache = [];
    const P = (j, i) => { const rho = Math.pow(j / NR, 0.8), th = (i / NA) * 6.2832, R = footR(th) * rho; return [MC.x + Math.cos(th) * R, MC.z + Math.sin(th) * R, rho]; };
    for (let j = 0; j <= NR; j++) { for (let i = 0; i < NA; i++) { const [x, z, rho] = P(j, i), m = moundAt(x, z, rho); cache.push(m.bottom, m.T); buf.push({ position: [x, m.top, z], aLump: [0, 0, 0, 0.5], aKind: [0], aAo: [0.84 + 0.16 * clamp((m.top - 35) / 8, 0, 1)] }); } await ctx.yield?.(); }
    const botBase = buf.n; await ctx.yield?.();
    for (let j = 0; j < NR; j++) { for (let i = 0; i < NA; i++) { const [x, z] = P(j, i), k = (j * NA + i) * 2; buf.push({ position: [x, cache[k], z], aLump: [0, 0, 0, 0], aKind: [0], aAo: [lerp(1, 0.8, cache[k + 1])] }); } if (j % 8 === 7) await ctx.yield?.(); }
    await ctx.yield?.();
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) {
      const i1 = (i + 1) % NA, a = topBase + j * NA + i, b = topBase + j * NA + i1, c = a + NA, d = b + NA; buf.idx.push(a, b, c, b, d, c);
      const e = botBase + j * NA + i, f = botBase + j * NA + i1, g = j === NR - 1 ? topBase + NR * NA + i : e + NA, h = j === NR - 1 ? topBase + NR * NA + i1 : f + NA; buf.idx.push(e, g, f, f, g, h);
    }
  };
  await sheets(flBuf, 92, 23);
  await ctx.yield?.();
  await sheets(flLo, 92, 22);
  await ctx.yield?.();
  const lumpInto = (buf, o, det) => { const I = ico(det), n = I.pos.length / 3, base = buf.n;
    for (let i = 0; i < n; i++) {
      const dx = I.pos[i * 3], dy = I.pos[i * 3 + 1], dz = I.pos[i * 3 + 2];
      const am = o.amp || 1, k = 1 + 0.2 * am * noise.fbm3(dx * 1.25 + o.seed, dy * 1.25, dz * 1.25 - o.seed, 2) + 0.06 * am * noise.n3(dx * 3.1, dy * 3.1 + o.seed, dz * 3.1);
      const fy = dy < 0 && !o.round ? 0.62 : 1, ox = dx * o.rx * k, oy = dy * o.ry * k * fy, oz = dz * o.rz * k;
      buf.push({ position: [o.x + ox, o.y + oy, o.z + oz], aLump: o.kind === 2 ? [ox, oy, oz, 0] : o.kind ? o.lump : [0, 0, 0, 1], aKind: [o.kind], aAo: [o.ao * (dy < 0 ? lerp(1, o.round ? 0.9 : 0.82, -dy) : 1)] });
    }
    for (let i = 0; i < I.idx.length; i++) buf.idx.push(base + I.idx[i]); return base; };
  const pushLump = (o) => {   // o: { x,y,z (0 for travellers), rx,ry,rz, det, seed, lump:[..], kind, ao }
    o.v0 = lumpInto(flBuf, o, o.det); o.vn = flBuf.n - o.v0; lumpInto(flLo, o, o.det >= 3 ? 2 : 1); };
  const statics = [];        // the lumps near the journey's end that carry smaller billows (see the kids below)
  const seat = xz(0, 0), rimLumps = [];
  const eT = thorns.find((t) => latOf(t.base.x, t.base.z) > 0) || thorns[0], eLat = latOf(eT.base.x, eT.base.z), eS = sOf(eT.base.x, eT.base.z), eTop = eT.top.y;   // the east thorn
  const lumpOK = (x, y, z, r) => flyDist(x, y, z) > r + 7 && Math.hypot(x - seat[0], z - seat[1]) > r + 11;
  { // rim lumps round the mound's edge, crowns on its top, heaps against the tor
    const nRim = 52;
    for (let i = 0; i < nRim; i++) { if (i % 2 === 1) await ctx.yield?.(); const th = (i + rng.range(-0.3, 0.3)) / nRim * 6.2832, R = footR(th) * rng.range(0.8, 0.99), r = rng.range(6.5, 12.5) * (i % 4 === 3 ? 0.6 : 1), x = MC.x + Math.cos(th) * R, z = MC.z + Math.sin(th) * R, y = Y_MID + rng.range(-3.5, 3.5);
      const rx = r * rng.range(1.25, 1.6), ry = r * rng.range(0.8, 1.0), sd = rng.range(0, 99);
      if (!lumpOK(x, y, z, r * 1.5) || y + ry * 0.6 < gY(x, z)) continue;
      const L0 = { x, y, z, rx, ry, rz: r, det: 3, seed: sd, lump: [0, 0, 0, 0], kind: 0, ao: 1, amp: 1.6 }; pushLump(L0); rimLumps.push(L0); }
    await ctx.yield?.();
    { // the cut west edge: a row of smaller billows along the crest's east side, 8 m and more from the fly line, sitting on
      // the heather where the land stands higher than the wool's edge (so the fleece laps onto the crest in soft heaps)
      const rl = makeRng(hashSeed('snag-edge:' + (ctx.seed ?? 0)));
      for (let s0 = -20, k = 0; s0 < 116; s0 += rl.range(5.2, 7.6), k++) { await ctx.yield?.();
        const r = rl.range(3.6, 6.8) * (k % 3 === 2 ? 1.25 : 1), rx = r * rl.range(1.1, 1.35), ry = r * rl.range(0.8, 1.0), lat = Math.max(EDGE_LAT + rl.range(0.5, 5), rx + 8.6), p = xz(lat, s0 + rl.range(-1, 1));
        const g = gY(p[0], p[1]), y = Math.max(Y_MID + rl.range(-1, 2.5), g - ry * 0.25), sd = rl.range(0, 99);
        if (Math.hypot(p[0] - seat[0], p[1] - seat[1]) < rx + 9.5 || flyDist(p[0], y, p[1]) < rx + 6.5) continue;
        const L0 = { x: p[0], y, z: p[1], rx, ry, rz: r, det: s0 > -12 && s0 < 78 ? 4 : 3, seed: sd, lump: [0, 0, 0, 0], kind: 0, ao: 1, amp: 1.7 }; pushLump(L0); rimLumps.push(L0); statics.push(L0); }
      // raised tufts and locks on the crowns of the rim billows, so the outline of the mass is broken, never one clean curve
      for (let i = 0, n = Math.min(34, rimLumps.length * 2); i < n; i++) { const b = rimLumps[rl.int(0, rimLumps.length - 1)], a = rl.range(0, 6.2832), q = rl.range(0, 0.62), r = rl.range(1.6, 3.1);
        const x = b.x + Math.cos(a) * b.rx * q, z = b.z + Math.sin(a) * b.rz * q, y = b.y + b.ry * (0.72 * Math.sqrt(1 - q * q) + 0.1);
        if (flyDist(x, y, z) < r * 1.4 + 6.5) continue;
        const L1 = { x, y, z, rx: r * rl.range(1.2, 1.7), ry: r * rl.range(0.75, 1.0), rz: r, det: 2, seed: rl.range(0, 99), lump: [0, 0, 0, 0], kind: 0, ao: 1, amp: 1.5 }; pushLump(L1); statics.push(L1); }
      // The tower: wool heaped up the lee side of the east thorn to its tip and over it, so the cloud stands taller than the
      // crest from every side and the thorn is plainly what holds it. Tiers of billows, each smaller and further west than the last.
      const TOWER = [];
      for (let y0 = 50, k = 0; y0 < eTop - 8.5; y0 += 10.4, k++) { const t = clamp((y0 - 50) / Math.max(1, eTop - 58), 0, 1), r0 = lerp(9.6, 6.2, t);
        TOWER.push([lerp(11, 8.2, t), 6 - 5 * t, y0 + 2, r0], [lerp(21, 15.5, t), -7 + (k % 2) * 4, y0 + 1, r0 * 1.05], [lerp(15, 12, t), lerp(20, 9, t), y0, r0 * 0.9], [lerp(29, 21, t), 9 - 12 * t, y0, r0 * 0.95]); }
      TOWER.push([7.6, 0, eTop - 5, 6], [14, 5, eTop - 3.5, 6.4], [20, -2, eTop - 6, 5.6], [10.5, 1, eTop + 3.5, 4.8]);
      for (let k = 0; k < TOWER.length; k++) { await ctx.yield?.(); const [dl, ds, y0, r] = TOWER[k], p = xz(eLat + dl + rl.range(-0.8, 0.8), eS + ds + rl.range(-1.5, 1.5)), rx = r * rl.range(1.15, 1.3), ry = r * rl.range(0.78, 0.92);
        if (flyDist(p[0], y0, p[1]) < rx + 6.5) continue;
        const L0 = { x: p[0], y: y0 + rl.range(-0.8, 0.8), z: p[1], rx, ry, rz: r, det: 3, seed: rl.range(0, 99), lump: [0, 0, 0, 0], kind: 0, ao: k < 4 ? 0.92 : 1, amp: 1.4 }; pushLump(L0); statics.push(L0); if (k >= 4) rimLumps.push(L0); }
    }
    await ctx.yield?.();
    for (let i = 0; i < 16; i++) { if (i % 2 === 1) await ctx.yield?.(); const th = rng.range(0, 6.2832), R = footR(th) * Math.sqrt(rng()) * 0.8, x = MC.x + Math.cos(th) * R, z = MC.z + Math.sin(th) * R, r = rng.range(5, 9), m = moundAt(x, z), y = m.top - r * 0.2;
      if (!lumpOK(x, y, z, r * 1.6 + 6) || y + r * 0.3 < gY(x, z)) continue;
      pushLump({ x, y, z, rx: r * rng.range(1.4, 1.9), ry: r * 0.55, rz: r, det: 2, seed: rng.range(0, 99), lump: [0, 0, 0, 0], kind: 0, ao: 1 }); }
  }
  for (let i = 0, n = 9 + rng.int(0, 3); i < n; i++) { if (i % 2 === 1) await ctx.yield?.();   // wool heaped against the lee (east) and south sides of the stack, bridging rock and cloud
    const a = rng.range(-0.5, 2.0), rr = rng.range(13, 25), x = Math.cos(a) * rr, z = Math.sin(a) * rr, r = rng.range(4.5, 8), y = rng.range(15, 25);
    const rx = r * rng.range(1.2, 1.6), ry = r * rng.range(0.6, 0.8), sd = rng.range(0, 99);
    if (y + ry * 0.5 < gY(x, z)) continue;                                   // (buried in the crest the world builds under the thorns)
    pushLump({ x, y, z, rx, ry, rz: r, det: 3, seed: sd, lump: [0, 0, 0, 0], kind: 0, ao: 0.86 });
  }
  { const rf = makeRng(hashSeed('snag-foot:' + (ctx.seed ?? 0)));      // raw wool caught on the lee side of the boulders round the tor's foot
    for (const f of (opts.footWool || [])) if (f.tuft) { const L0 = { x: f.x + f.r * 0.4, y: f.y + f.r * 0.45, z: f.z + rf.range(-0.2, 0.2) * f.r, rx: f.r * rf.range(0.75, 1.0), ry: f.r * rf.range(0.34, 0.46), rz: f.r * rf.range(0.55, 0.75), det: f.r > 2.3 ? 2 : 1, seed: rf.range(0, 99), lump: [0, 0, 0, 0], kind: 0, ao: 0.9, amp: 1.5 };
      pushLump(L0); if (flyDist(L0.x, L0.y, L0.z) < 32) statics.push(L0); } }
  await ctx.yield?.();
  // ---------------------------------------------------------------- the billows of the near fleece (their own mesh, drawn within 236 m)
  // Round the journey's end (the west edge of the mound, the tower on the east thorn, the crowns beside the crest) every lump
  // carries smaller billows, and where the lens passes close those carry smaller ones still, down to a metre: the heap is
  // cauliflower all the way in, with a baked lavender crease wherever one billow meets another, and no lump is ever a smooth
  // ball with a pattern on it. The kids swell out of their parents as the lens comes within 236 m (uGrow), so nothing pops.
  // On top of that every near billow wears soft tufts (camera-facing locks of its own colour, see tuftMat): they stand out
  // past each outline as a fibre halo.
  const nearBuf = new Buf({ position: 3, aLump: 4, aKind: 1, aAo: 1 }), tfBuf = new Buf({ position: 3, aQ: 2, aN: 3, aT: 4 }), kids = [];
  const stats = { statics: 0, kids: 0, kept: 0, tris: 0, tufts: 0, L: [0, 0, 0, 0] };
  {
    const rk = makeRng(hashSeed('snag-kids:' + (ctx.seed ?? 0)));
    for (const b of rimLumps) if (!statics.includes(b) && flyDist(b.x, b.y, b.z) - b.rz < 46) statics.push(b);
    const kOf = (o, dx, dy, dz) => { const am = o.amp || 1; return 1 + 0.2 * am * noise.fbm3(dx * 1.25 + o.seed, dy * 1.25, dz * 1.25 - o.seed, 2) + 0.06 * am * noise.n3(dx * 3.1, dy * 3.1 + o.seed, dz * 3.1); };
    const minR = (d) => clamp(d * 0.09, 0.75, 4.6);        // the smallest billow worth building at this distance from the fly line
    const kidsOf = (P, level) => {
      const nC = level === 1 ? (P.fd - P.rz > 30 ? 7 : 10) : level === 2 ? 7 : 5, ph = rk.range(0, 6.2832), rm = Math.cbrt(P.rx * P.ry * P.rz);
      for (let i = 0; i < nC; i++) {
        const dy = 1 - (i + 0.5) / nC * 1.45, rr = Math.sqrt(Math.max(0, 1 - dy * dy)), a = ph + i * 2.39996 + rk.range(-0.3, 0.3), dx = Math.cos(a) * rr, dz = Math.sin(a) * rr;
        const ratio = rk.range(0.36, 0.5), jx = rk.range(1.05, 1.3), jy = rk.range(0.8, 0.96), sd = rk.range(0, 99);
        const face = dx * Rx + dz * Rz, south = dx * Ax + dz * Az;      // > 0: away from the fly line (east) / back toward the arriving lens
        if (level === 1 ? !(face < 0.3 || south > 0.15 || dy > 0.5) : !(face < 0.15 || dy > 0.6)) continue;
        const k = kOf(P, dx, dy, dz), fy = dy < 0 && !P.round ? 0.62 : 1, rc = clamp(rm * ratio, 0.75, 4.8);
        const nx = dx / P.rx, ny = dy / P.ry, nz = dz / P.rz, nl = Math.hypot(nx, ny, nz) || 1;
        const x = P.x + dx * P.rx * k - nx / nl * rc * 0.3, y = P.y + dy * P.ry * k * fy - ny / nl * rc * 0.3, z = P.z + dz * P.rz * k - nz / nl * rc * 0.3;
        const fd = flyDist(x, y, z), la = latOf(x, z), ss = sOf(x, z);
        if (fd < rc * 1.2 + 7 || Math.hypot(x - seat[0], z - seat[1]) < rc + 10 || y + rc * 0.35 < gY(x, z)) continue;
        if (Math.hypot(la - eLat, ss - eS) < 8 + rc * 0.5 && la < eLat + 5 && y < eTop - 4) continue;       // the east thorn's west face stays bare stone
        const K = { x, y, z, rx: rc * jx, ry: rc * jy, rz: rc, seed: sd, amp: 0.85, kind: 2, ao: 1, round: 1, level, fd, det: fd - rc < (level === 1 ? 13 : 15) ? 2 : 1, keep: true, sub: [] };
        kids.push(K); if (P.sub) P.sub.push(K);
        if (level < 3 && rc > Math.max(minR(fd - rc) * 1.6, 1.5)) kidsOf(K, level + 1);
      }
    };
    for (let i = 0; i < statics.length; i++) { const P = statics[i]; P.fd = flyDist(P.x, P.y, P.z);
      if (Math.cbrt(P.rx * P.ry * P.rz) > Math.max(minR(P.fd - P.rz) * 1.6, 1.5)) kidsOf(P, 1);
      if (i % 3 === 2) await ctx.yield?.(); }
    // the budget: every first-level billow stays (they carry the cloud's outline from afar); of the smaller ones the furthest
    // from the fly line go first, each with whatever sits on it (so none loses its seat)
    const triOf = (K) => (K.det === 2 ? 180 : 80), CAP = 20000;
    let total = 0, small = 0; for (const K of kids) { total += triOf(K); if (K.level > 1) small += triOf(K); }
    const drop = (K) => { if (!K.keep) return; K.keep = false; total -= triOf(K); small -= triOf(K); for (const c of K.sub) drop(c); };
    if (small > CAP) { const order = kids.filter((K) => K.level > 1).sort((a, b) => (b.fd - b.rz) - (a.fd - a.rz)); for (const K of order) { if (small <= CAP) break; drop(K); } }
    stats.statics = statics.length; stats.kids = kids.length; stats.tris = total;
    await ctx.yield?.();
    for (let i = 0, n = 0; i < kids.length; i++) { const K = kids[i]; if (!K.keep) continue; K.v0 = lumpInto(nearBuf, K, K.det); K.vn = nearBuf.n - K.v0; stats.kept++; stats.L[K.level]++; if (++n % 6 === 0) await ctx.yield?.(); }
    await ctx.yield?.();
    // creases: how close each vertex lies to the surface of another lump (ellipsoids in a grid of 6 m cells)
    const all = statics.concat(kids.filter((K) => K.keep)), CELL = 6, grid = new Map(), keyOf = (i, j, k) => (i + 512) + (j + 512) * 1024 + (k + 512) * 1048576;
    for (let n = 0; n < all.length; n++) { const Lp = all[n], ex = Lp.rx * 1.4 + 0.4, ey = Lp.ry * 1.4 + 0.4, ez = Lp.rz * 1.4 + 0.4; Lp.rmin = Math.min(Lp.rx, Lp.ry, Lp.rz);
      for (let i = Math.floor((Lp.x - ex) / CELL); i <= Math.floor((Lp.x + ex) / CELL); i++) for (let j = Math.floor((Lp.y - ey) / CELL); j <= Math.floor((Lp.y + ey) / CELL); j++) for (let k = Math.floor((Lp.z - ez) / CELL); k <= Math.floor((Lp.z + ez) / CELL); k++) {
        const key = keyOf(i, j, k); let c = grid.get(key); if (!c) { c = []; grid.set(key, c); } c.push(Lp); }
      if (n % 24 === 23) await ctx.yield?.(); }
    const occl = (px, py, pz, own) => { const c = grid.get(keyOf(Math.floor(px / CELL), Math.floor(py / CELL), Math.floor(pz / CELL))); if (!c) return 1; let ao = 1;
      for (let n = 0; n < c.length; n++) { const Lp = c[n]; if (Lp === own) continue; const qx = (px - Lp.x) / Lp.rx, qy = (py - Lp.y) / Lp.ry, qz = (pz - Lp.z) / Lp.rz, q = Math.sqrt(qx * qx + qy * qy + qz * qz);
        if (q < 0.94) return -1; const t = (q - 1) * Lp.rmin, sc = 0.36 * Math.min(own.rmin, Lp.rmin) + 0.12; if (t < sc) ao = Math.min(ao, smoothstep(-0.12 * sc, sc, t)); }
      return ao; };
    let work = 0;
    for (let n = 0; n < all.length; n++) { const Lp = all[n], isKid = Lp.kind === 2, buf = isKid ? nearBuf : flBuf, P = buf.d.position, AO = buf.d.aAo;
      const nearLens = Lp.fd - Lp.rz < 27, rc = Lp.rz, pT = !nearLens ? 0 : isKid ? (Lp.vn < 60 ? 0.9 : 0.5) : 0.3;
      for (let v = Lp.v0; v < Lp.v0 + Lp.vn; v++) { if ((v & 31) === 31) await ctx.yield?.(); const px = P[v * 3], py = P[v * 3 + 1], pz = P[v * 3 + 2], ao = occl(px, py, pz, Lp); AO[v] *= ao < 0 ? 0.5 : lerp(0.5, 1, ao);
        if (pT <= 0 || ao < 0) continue; const q = rk(), sz = rk.range(0.34, 0.56), ang = rk.range(-0.7, 0.7), sd = rk();
        let nx = px - Lp.x, ny = py - Lp.y, nz = pz - Lp.z; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        if (q > pT || tfBuf.n > 26000 || (nx * Rx + nz * Rz > 0.45 && nx * Ax + nz * Az < 0.1 && ny < 0.35) || py + ny * 0.5 < gY(px + nx * 0.5, pz + nz * 0.5)) continue;
        const size = isKid ? clamp(rc * sz * 1.25, 0.42, 1.6) : clamp(rc * sz * 0.45, 1.0, 1.9), b0 = tfBuf.n, T = [size, ang, sd, lerp(0.5, 1, Math.max(ao, 0))];
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tfBuf.push({ position: [px, py, pz], aQ: [cx, cy], aN: [nx, ny, nz], aT: T });
        tfBuf.idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3); }
      work += Lp.vn; if (work > 500) { work = 0; await ctx.yield?.(); } }
    stats.tufts = tfBuf.n / 4;
  }
  await ctx.yield?.();
  const ROOT = new THREE.Vector3(MC.x + 40, 35.5, MC.z + 4), nStream = Math.round(118 + rng.int(0, 10));
  const sag = rng.range(9, 16), meander = rng.range(0, 6.28), meanderA = rng.range(14, 26);
  for (let i = 0; i < nStream; i++) { const r = rng.range(12.5, 20);
    pushLump({ x: 0, y: 0, z: 0, rx: r * rng.range(1.6, 2.1), ry: r * rng.range(0.5, 0.66), rz: r * rng.range(0.9, 1.1), det: 1, seed: rng.range(0, 99), lump: [(i + rng()) / nStream, clamp(rng.gauss() * 0.5, -1, 1), rng.range(-1, 1), rng.range(0, 99)], kind: 1, ao: 1, amp: 1.3 });
    await ctx.yield?.(); }
  const streamGLSL = /* glsl */`
    uniform vec3 uRoot; uniform vec4 uStream;   // x phase offset (travel / length), y sag, z meander phase, w meander amplitude
    vec3 streamCentre(float ph){ float X = ph * ${STREAM_LEN.toFixed(1)};
      return uRoot + vec3(X, -uStream.y * smoothstep(0., .75, ph) + 4.5 * sin(X * .0105 + uStream.z) * smoothstep(.05, .3, ph), uStream.w * sin(X * .0058 + uStream.z) * smoothstep(.04, .4, ph)); }
    vec2 streamHalf(float ph){ return vec2(mix(14., 34., smoothstep(0., .07, ph)) * mix(1., .3, pow(max(ph, 0.), .7)), mix(6.5, 2.4, ph)); }
  `;
  // the colour and light of raw fleece, shared by the lumps and by the tufts that stand on them: cream on every crown that
  // faces the sky or the sun, lavender underneath and in the creases; light soaks through to the underside and the shaded flank
  const WOOL = /* glsl */`uniform vec3 uWool, uShade;
    vec3 woolBase(float up, float sun, float ao){ float crown = smoothstep(.22, .64, up * .58 + sun * .42);
      vec3 b = mix(uShade * .9, uWool, crown); return mix(b, uShade * .72, (1. - ao) * .9); }
    // fleece scatters: the key wraps a little way round every billow, and the shaded side glows lilac with light from inside
    // (less of it underneath). Top about .8, shaded flank about .5, underside about .37: form, but never slate.
    vec3 woolLit(vec3 base, vec3 N, vec3 Nb, vec3 V, vec3 obj, vec3 world, float ao){ float up = N.y * .5 + .5;
      vec3 c = felt(base, normalize(Nb + uSunDir * .25 + vec3(0., .2, 0.)), V, obj, world, .8, mix(.74, 1., ao), .5) * 1.15;
      c += uWool * (uSunCol * .24 + uFillCol * .5) * (1. - smoothstep(-.35, .55, dot(N, uSunDir))) * mix(.6, 1., smoothstep(0., .5, up)) * mix(.6, 1., ao);
      return c; }
  `;
  const growU = { value: 0 }, woolU = () => ({ uWool: { value: cWhite.clone().multiplyScalar(0.78 / Math.max(cWhite.r, cWhite.g, cWhite.b)) }, uShade: { value: new THREE.Color('#b9b3d6') }, uGrow: growU });
  const fleeceMat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...baseU(), ...woolU(), uRoot: { value: ROOT }, uStream: { value: new THREE.Vector4(0, sag, meander, meanderA) } },
    vertexShader: VERT_HEAD + streamGLSL + /* glsl */`attribute vec4 aLump; attribute float aKind, aAo; uniform float uGrow; varying float vAo, vTail;
      void main(){ vec3 p = position; vObj = position; vTail = 0.;
        if (aKind > 1.5) p -= aLump.xyz * (1. - uGrow);            // a near billow swells out of its parent
        else if (aKind > .5) { float ph = fract(aLump.x + uStream.x); vec2 hw = streamHalf(ph);
          float tear = mix(1., .3 + .7 * step(.45, fract(aLump.w * 7.31)), smoothstep(.3, .75, ph));
          float sc = smoothstep(0., .05, ph) * mix(1., .2, smoothstep(.1, .95, ph)) * tear * (1. - smoothstep(.9, 1., ph));
          p = streamCentre(ph) + vec3(0., aLump.z * hw.y + sin(uTime * .35 + aLump.w) * .7, aLump.y * hw.x) + position * sc;
          vObj = position + aLump.w * 13.; vTail = ph + .001; }
        vCol = vec3(1.); vAo = aAo; vec4 w = modelMatrix * vec4(p, 1.); vWorld = w.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_HEAD + WOOL + /* glsl */`varying float vAo, vTail;
      // The relief of combed fleece at a point q (already slid downwind and curled): locks a metre or so across and half-metre
      // staples at fixed sizes, both smooth (no ridge, no crease), plus strands whose width follows the size of a pixel there
      // (two octaves cross-faded), so they stay a few pixels wide at any distance. The bump comes from differences of this
      // height at small offsets, never from screen derivatives of it. parts = strand tone, lock tone.
      float woolH(vec3 q, float s0, float lf, float k1, out vec2 parts){
        float lock = vn3(vec3(q.x * .3, q.y * .8, q.z * .8) + 4.) - .5;
        float curl = vn3(vec3(q.x * .7 + q.y * .45, q.y * 1.9 - q.x * .35, q.z * 2.) + 9.) - .5;
        float sa = vn3(vec3(q.x * .09 * s0, q.yz * s0 + 9.)) - .5, sb = vn3(vec3(q.x * .045 * s0, q.yz * (s0 * .5) + 9.)) - .5;
        parts = vec2(mix(sa, sb, lf), lock + curl * .6);
        return (lock * .8 + curl * .34) * k1 + mix(sa, sb * 2., lf) * .36 / s0; }
      void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
        // the snagged wool creeps downwind over its billows; the streamer's lumps travel themselves
        float sl = vWorld.x - uTime * mix(2.6, 14., step(.0005, vTail)) * uWindK, fz = abs(dFdx(vWorld.z)) + abs(dFdy(vWorld.z)) + abs(dFdx(vWorld.y)) + abs(dFdy(vWorld.y));
        float k1 = 1. - smoothstep(.3, 1.1, fz * .36);
        float lod = clamp(log2(max(fz, 1e-3) * 2.6), -3., 3.5), l0 = floor(lod), lf = lod - l0, s0 = exp2(-l0), e = .3 / s0;
        vec3 ws = vec3(sl, vWorld.y, vWorld.z);
        // the combing wanders and curls: no strand runs straight for long
        vec3 cw = vec3(0., vn3(ws * vec3(.05, .2, .2) + 31.) - .5, vn3(ws * vec3(.05, .2, .2) + 57.) - .5) * 2.6
                + vec3(0., vn3(ws * vec3(.25, .8, .8) + 13.) - .5, vn3(ws * vec3(.25, .8, .8) + 71.) - .5) * (.55 * k1);
        vec3 q = ws + cw; vec2 pr, pq;
        float h0 = woolH(q, s0, lf, k1, pr), hx = woolH(q + vec3(e * 4., 0., 0.), s0, lf, k1, pq), hy = woolH(q + vec3(0., e, 0.), s0, lf, k1, pq), hz = woolH(q + vec3(0., 0., e), s0, lf, k1, pq);
        vec3 G = vec3((hx - h0) * .25, hy - h0, hz - h0) / e;
        float up = N.y * .5 + .5, sun = dot(N, uSunDir) * .5 + .5;
        vec3 Nb = normalize(N - .62 * mix(.55, 1., smoothstep(.2, .62, up)) * (G - N * dot(N, G)) + N * 1e-5);
        vec3 base = woolBase(up, sun, vAo);
        // between locks and between strands the wool is a shade deeper and bluer; every strand is cream on its crown
        // (plainer on the undersides, which are seen from below as broad faces: no streaked sheet)
        // (and plainer still far off; seen close, the combing shows as strands a few pixels wide)
        float cr = clamp(.45 - pr.y * 1.3 - pr.x * 1.5, 0., 1.), sK = mix(.4, 1., smoothstep(.2, .62, up)) * (1. + .7 * (1. - smoothstep(.04, .2, fz)));
        base = mix(base, base * vec3(.82, .82, .97), min(cr * .42 * sK, .8));
        base *= 1. + (.1 * pr.x + .07 * pr.y - .04) * sK;
        gRimK = .55; gRimW = .25; gDimK = .2;      // (a faint rim only: a bright one rings every billow like a bubble)
        gl_FragColor = vec4(woolLit(base, N, Nb, V, vObj, vWorld, vAo), 1.);
        #include <fog_fragment>
      }`,
  });
  await ctx.yield?.();
  const fleece = new THREE.Mesh(await flBuf.buildAsync(ctx), fleeceMat); fleece.name = 'fleece'; fleece.frustumCulled = false; fleece.visible = false; group.add(fleece); mats.push(fleeceMat);
  await ctx.yield?.();
  const fleeceLo = new THREE.Mesh(await flLo.buildAsync(ctx), fleeceMat); fleeceLo.name = 'fleece'; fleeceLo.frustumCulled = false; group.add(fleeceLo);
  await ctx.yield?.();
  const fleeceNear = new THREE.Mesh(await nearBuf.buildAsync(ctx), fleeceMat); fleeceNear.name = 'fleece-billows'; fleeceNear.frustumCulled = false; fleeceNear.visible = false; group.add(fleeceNear);
  await ctx.yield?.();
  // tufts: a lock of wool standing on a point of a billow, along its normal and leaning downwind, turned about that normal
  // toward the lens. It shows only where the billow turns away from the lens (the outline, where it stands past the edge as a
  // fringe of fibres in the billow's own colour and light) and fades out where the billow faces the lens, so no card is seen.
  const tuftMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...baseU(), ...woolU() },
    vertexShader: VERT_HEAD + /* glsl */`attribute vec2 aQ; attribute vec3 aN; attribute vec4 aT; uniform float uGrow; varying vec2 vQ; varying vec3 vT;
      void main(){ float size = aT.x, sd = aT.z, v = aQ.y * .65 + .35;                    // v: -.3 (inside the billow) .. 1 (the tip)
        vec4 w0 = modelMatrix * vec4(position, 1.); vec3 Nw = normalize(mat3(modelMatrix) * aN + vec3(0., 1e-5, 0.));
        vec3 toC = cameraPosition - w0.xyz; float dist = length(toC); vec3 f = toC / max(dist, 1e-3); float nf = dot(Nw, f);
        vec3 T = cross(Nw, f); float tl = length(T); T = tl > 1e-3 ? T / tl : vec3(1., 0., 0.);
        float sway = .13 * sin(uTime * 2.6 * uWindK + sd * 40.) + .06 * sin(uTime * 5.3 + sd * 17.);
        vec3 O = normalize(Nw + vec3(.5 + sway, .12 + .5 * sway, .3 * sway) * (1. + min(Nw.x, 0.)) * max(v, 0.));
        vec3 p = w0.xyz + O * (v * size * 1.2) + T * (size * (aQ.x * .78 * (1. + .4 * v) + aT.y * .45 * v));
        vQ = vec2(aQ.x, v); vT = vec3(uGrow * (1. - smoothstep(75., 120., dist)) * smoothstep(2., 4.5, dist) * (1. - smoothstep(.3, .78, abs(nf))), sd, aT.w);
        vWorld = p; vObj = p; vCol = vec3(1.); vNrm = Nw;
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_HEAD + WOOL + /* glsl */`varying vec2 vQ; varying vec3 vT;
      void main(){ float x = vQ.x, v = vQ.y, sd = vT.y, fw = abs(dFdx(x)) + abs(dFdy(x));
        // fibres run outward and curl
        float xs = x * 4.5 + .8 * sin(v * 2.8 + sd * 31.) * v + sd * 17.;
        float f1 = vn3(vec3(xs, v * 1.2 + sd * 9., sd * 3.)), f2 = vn3(vec3(xs * 2.3, v * 2. - sd * 5., sd * 7. + 4.));
        float fib = mix(f1 * .6 + f2 * .4, .5, smoothstep(.06, .2, fw * 4.5));
        float side = 1. - x * x, body = smoothstep(-.3, -.04, v) * (1. - smoothstep(0., .5, v)), fringe = (1. - smoothstep(.4, 1., v)) * smoothstep(.37, .6, fib + (.3 - v) * .45);
        float a = max(body * .72, fringe * .82) * side * side * vT.x; if (a < .012) discard;
        vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
        vec3 base = woolBase(N.y * .5 + .5, dot(N, uSunDir) * .5 + .5, vT.z) * (.96 + .1 * fib);
        gRimK = 0.; gDimK = 0.;
        gl_FragColor = vec4(woolLit(base, N, N, V, vObj, vWorld, vT.z) * (.97 + .08 * fringe * (1. - body)), a);
        #include <fog_fragment>
      }`,
  });
  if (!tfBuf.n) { for (let i = 0; i < 4; i++) tfBuf.push({ position: [0, -900, 0], aQ: [0, 0], aN: [0, 1, 0], aT: [0.01, 0, 0, 1] }); tfBuf.idx.push(0, 1, 2); }
  const tufts = new THREE.Mesh(tfBuf.build(false), tuftMat); tufts.name = 'fleece-tufts'; tufts.frustumCulled = false; tufts.renderOrder = 2; tufts.visible = false; group.add(tufts); mats.push(tuftMat);
  await ctx.yield?.();
  await ctx.yield?.();

  // ---------------------------------------------------------------- strands, wisps, loose locks, snagged fibres (one blended ribbon mesh)
  // kinds: 0 combed strand draped on the mound (texture slides), 1 strand / wisp travelling with the streamer,
  //        2 loose lock that tears off, tumbles and dissolves, 3 fibre snagged on a boulder, 4 grey shower skein
  const rbBuf = new Buf({ position: 3, aUV: 2, aRib: 4, aExt: 4 });
  const ribbon = (segs, at, rib, ext) => { const base = rbBuf.n;
    for (let i = 0; i <= segs; i++) { const u = i / segs, p = at(u); for (const v of [-1, 1]) rbBuf.push({ position: p, aUV: [u, v], aRib: rib, aExt: ext }); }
    for (let i = 0; i < segs; i++) { const a = base + i * 2; rbBuf.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  const thin = (n) => Math.max(4, Math.round(n * detail));
  for (let i = 0, n = thin(230); i < n; i++) { if (i % 8 === 7) await ctx.yield?.();   // combed strands on the mound, more of them in and beside the furrow
    let x0, z0; const len = rng.range(24, 70);
    if (i % 2 === 0) { const p = xz(rng.range(15, 60), rng.range(-12, 102)); x0 = p[0] - len * 0.4; z0 = p[1]; } else { const th = rng.range(0, 6.2832), R = footR(th) * Math.sqrt(rng()) * 0.95; x0 = MC.x + Math.cos(th) * R - len * 0.4; z0 = MC.z + Math.sin(th) * R; }
    const lift = rng.range(0.12, 0.45), over = false;       // they stop at the wool's edge: none lies across the heather crest under the fly line
    ribbon(10, (u) => { const x = x0 + u * len, rho = rhoAt(x, z0), m = moundAt(x, z0, Math.min(rho, 1)), g = gY(x, z0), yw = rho > 1 ? Y_MID - (rho - 1) * 26 - 0.5 : m.top + lift;
      return [x, yw > g + 0.1 ? yw : over || latOf(x, z0) > EDGE_LAT + 3 ? g + 0.22 : g - 3, z0]; }, [rng.range(0.7, 2.6), len, rng.range(0, 99), 0], [rng.chance(0.45) ? rng.range(0.5, 1) : 0, 0, 0, 1]);
  }
  await ctx.yield?.();
  for (let i = 0, n = thin(250); i < n; i++) { if (i % 30 === 29) await ctx.yield?.();   // streamer strands (thin, long) and teased wisps (wide), travelling
    const wisp = i % 5 < 2, len = wisp ? rng.range(25, 70) : rng.range(50, 170), vert = rng.range(-1, 1);
    ribbon(12, (u) => [u * len, 0, 0], [wisp ? rng.range(3, 8) : rng.range(0.8, 2.6), len, rng.range(0, 99), 1], [rng(), clamp(rng.gauss() * 0.6, -1.25, 1.25), vert > 0 ? 0.5 + vert * 0.9 : vert * 1.2, wisp ? rng.range(0.1, 0.7) : rng.range(0, 0.3)]);
  }
  for (let i = 0, n = 30 + rng.int(0, 12); i < n; i++) {   // loose locks: start somewhere on the fleece top
    const onMound = i % 3 === 0; let sx, sy, sz;
    if (onMound) { const th = rng.range(-1.6, 1.6), R = footR(th) * rng.range(0.3, 0.95); sx = MC.x + Math.cos(th) * R; sz = MC.z + Math.sin(th) * R; sy = moundAt(sx, sz).top + 1; if (flyDist(sx, sy, sz) < 16) { sx += 30; sz += 8; sy = moundAt(sx, sz).top + 1; } }
    else { const ph = rng.range(0.03, 0.6); sx = ROOT.x + ph * STREAM_LEN; sy = ROOT.y - sag * smoothstep(0, 0.75, ph) + 7; sz = ROOT.z + rng.range(-20, 20); }
    const len = rng.range(4, 8);
    ribbon(6, (u) => [(u - 0.5) * len, 0, 0], [rng.range(1.2, 2.4), len, rng.range(0, 99), 2], [sx, sy, sz, rng.range(9, 17)]);
  }
  { // fibres snagged on the thorns and the upper stones, streaming downwind
    const hosts = boulders.filter((b) => !b.buried && (b.thorn || b.y > 14)), thornB = boulders.filter((q) => q.thorn && !q.buried), nF = thin(96);
    for (let i = 0; i < nF; i++) { const b = i % 3 < 2 ? rng.pick(thornB) : rng.pick(hosts);
      const d = v3.set(rng.range(-0.2, 1), rng.range(-0.15, 1), rng.range(-1, 1)).normalize(), ax = b.x + d.x * b.rx * 0.9, ay = b.y + d.y * b.ry * 0.93, az2 = b.z + d.z * b.rz * 0.9;
      const len = rng.range(2.2, 7.5) * (b.thorn ? 1.3 : 1);
      ribbon(6, () => [ax, ay, az2], [rng.range(0.14, 0.34), len, rng.range(0, 99), 3], [0, 0, 0, rng.range(0.6, 1)]); }
    // long pennants of raw wool flying from the upper stones of both thorns
    const rp = makeRng(hashSeed('snag-pennants:' + (ctx.seed ?? 0)));
    for (let i = 0; i < 16 && thornB.length; i++) { const b = thornB[rp.int(0, thornB.length - 1)], ax = b.x + rp.range(0.2, 0.8) * b.rx, ay = b.y + rp.range(-0.3, 0.8) * b.ry, az2 = b.z + rp.range(-0.6, 0.6) * b.rz;
      ribbon(8, () => [ax, ay, az2], [rp.range(0.7, 1.7) * 0.55, rp.range(9, 22) * 0.6, rp.range(0, 99), 3], [rp.range(-0.06, 0.12), rp.range(0.1, 0.4), rp.range(0, 0.02), rp.range(0.7, 0.95)]); }
  }
  await ctx.yield?.();
  for (let i = 0, n = thin(420); i < n; i++) { if (i % 20 === 19) await ctx.yield?.();   // fuzz: fine fibres lifting off the fleece top, densest beside the furrow
    let x, z; if (i % 2 === 0) { const p = xz(rng.range(13, 46), rng.range(-10, 106)); x = p[0]; z = p[1]; } else { const th = rng.range(0, 6.2832), R = footR(th) * Math.sqrt(rng()) * 0.97; x = MC.x + Math.cos(th) * R; z = MC.z + Math.sin(th) * R; }
    const m = moundAt(x, z), near = Math.abs(latOf(x, z)) < 24 && sOf(x, z) < 110, len = near ? rng.range(0.8, 1.9) : rng.range(1.4, 4.2), y = Math.max(m.top, gY(x, z)) + 0.05;
    ribbon(6, () => [x, y, z], [near ? rng.range(0.06, 0.14) : rng.range(0.1, 0.3), len, rng.range(0, 99), 3], [near ? rng.range(0.05, 0.2) : rng.range(0.12, 0.5), 0, 0, rng.range(0.6, 1)]);
  }
  for (let i = 0, n = thin(46); i < n; i++) {   // a fringe hanging from the underside round the tor, streaming downwind
    const a = rng.range(0, 6.2832), rr = rng.range(6, 42), x = MC.x + Math.cos(a) * rr * 1.4, z = MC.z + Math.sin(a) * rr * 1.4; if (rhoAt(x, z) > 0.9) continue; const m = moundAt(x, z);
    const wd = rng.range(0.25, 0.7), ln = rng.range(4, 10), sd = rng.range(0, 99), up = -rng.range(0.25, 0.6), al = rng.range(0.6, 0.9); if (m.bottom < gY(x, z) + 1) continue;
    ribbon(6, () => [x, m.bottom + 0.3, z], [wd, ln, sd, 3], [up, 0, 0, al]);
  }
  { // The ragged lower edge: wisps and locks hanging from the underside and from the rim lumps on the south and west (the
    // sides the journey looks at), trailing downwind, shaded lavender. Their own random stream, so nothing else moves.
    const rw = makeRng(hashSeed('snag-wisps:' + (ctx.seed ?? 0)));
    const thOf = (b) => { let t = Math.atan2(b.z - MC.z, b.x - MC.x); if (t < -1.2) t += 6.2832; return t; }, nearLumps = rimLumps.filter((b) => { const t = thOf(b); return t > 0.15 && t < 3.7; });
    for (let i = 0, n = thin(250); i < n; i++) { if (i % 20 === 19) await ctx.yield?.();
      let x, y, z;
      if (i % 3 === 0 && nearLumps.length) { const b = nearLumps[rw.int(0, nearLumps.length - 1)], a = rw.range(0, 6.2832), q = rw.range(0.2, 0.9); x = b.x + Math.cos(a) * b.rx * q; z = b.z + Math.sin(a) * b.rz * q; y = b.y - b.ry * 0.6 * Math.sqrt(Math.max(0, 1 - q * q)) + 0.3; }
      else { const th = rw.range(0.25, 3.4), rho = 1 - 0.3 * rw() * rw(), R = footR(th) * rho; x = MC.x + Math.cos(th) * R; z = MC.z + Math.sin(th) * R; y = moundAt(x, z, Math.min(rho, 1)).bottom + 0.25; }
      y = Math.max(y, gY(x, z) + 0.3);
      if (flyDist(x, y, z) < 12) continue;
      const wide = i % 2 === 0, len = wide ? rw.range(5, 11) : rw.range(3, 8);
      ribbon(8, () => [x, y, z], [wide ? rw.range(1.2, 2.7) : rw.range(0.3, 0.8), len, rw.range(0, 99), 3], [-rw.range(0.15, 0.5), rw.range(0.3, 0.75), rw.range(0.04, 0.08), rw.range(0.65, 0.95)]);
    }
    // fine fibres lifting downwind off the crowns of the rim billows
    await ctx.yield?.();
    for (let i = 0, n = thin(130); i < n && rimLumps.length; i++) { if (i % 20 === 19) await ctx.yield?.(); const b = rimLumps[rw.int(0, rimLumps.length - 1)], a = rw.range(0, 6.2832), q = rw.range(0, 0.7);
      const x = b.x + Math.cos(a) * b.rx * q, z = b.z + Math.sin(a) * b.rz * q, y = b.y + b.ry * 0.86 * Math.sqrt(1 - q * q);
      ribbon(6, () => [x, y, z], [rw.range(0.1, 0.32), rw.range(1.6, 4.6), rw.range(0, 99), 3], [rw.range(0.1, 0.4), 0, 0, rw.range(0.6, 0.9)]); }
    // Loose wisps over the heather either side of the crest (kind 5: a fine fibre that tapers to nothing at BOTH ends and
    // curls as it streams). None is rooted within 7 m of the fly line or reaches it, so nothing crosses the portal's disc.
    await ctx.yield?.();
    for (let i = 0, n = thin(24); i < n; i++) { const left = i % 2 === 0, len = left ? rw.range(2.2, 4) : rw.range(3, 6.5), lat = left ? -rw.range(12.5, 22) : rw.range(7.5, 11.5), s0 = rw.range(-6, 104), p = xz(lat, s0), g = gY(p[0], p[1]);
      const y = (g > -500 ? g : pathY(s0) - 5) + rw.range(0.7, 2.4);
      ribbon(10, () => [p[0], y, p[1]], [rw.range(0.06, 0.12), len, rw.range(0, 99), 5], [rw.range(0.02, 0.3), rw.range(0, 0.3), rw.range(0.01, 0.05), rw.range(0.55, 0.85)]); }
    // locks lifting downwind off the crowns of the near billows: fine fibres, and a few thicker tapered locks
    await ctx.yield?.();
    { const near = kids.filter((K) => K.keep && K.fd - K.rz < 30);
      for (let i = 0, n = Math.min(thin(150), near.length * 2); i < n && near.length; i++) { if (i % 20 === 19) await ctx.yield?.(); const K = near[rw.int(0, near.length - 1)], a = rw.range(0, 6.2832), q = rw.range(0, 0.75), thick = i % 9 === 0;
        const x = K.x + Math.cos(a) * K.rx * q, z = K.z + Math.sin(a) * K.rz * q, y = K.y + K.ry * 0.9 * Math.sqrt(1 - q * q);
        ribbon(8, () => [x, y, z], [thick ? rw.range(0.35, 0.7) : rw.range(0.07, 0.2), (thick ? rw.range(2.2, 4.2) : rw.range(1, 3)) * (0.6 + 0.4 * Math.min(1, K.rz / 2)), rw.range(0, 99), 3], [rw.range(0.12, 0.5), 0, rw.range(0.01, 0.06), rw.range(0.6, 0.9)]); } }
    for (const f of (opts.footWool || [])) for (let k = 0; k < 3; k++) {       // wool streaming off the boulders round the tor's foot
      const ax = f.x + rw.range(-0.4, 0.4) * f.r, ay = f.y + f.r * rw.range(0.3, 0.62), az2 = f.z + rw.range(-0.4, 0.4) * f.r;
      ribbon(8, () => [ax, ay, az2], [k === 0 ? rw.range(0.9, 1.6) : rw.range(0.3, 0.7), rw.range(4, 9) * (k === 0 ? 0.7 : 1), rw.range(0, 99), 3], [rw.range(-0.08, 0.1), rw.range(0, 0.3), 0, rw.range(0.75, 1)]); }
  }
  if (weather === 'shower') for (let i = 0; i < 18; i++) { const len = rng.range(25, 60); ribbon(8, (u) => [0, 0, 0], [rng.range(4, 9), len, rng.range(0, 99), 4], [rng.range(0.05, 0.7), rng.range(-0.9, 0.9), -1, 0]); }
  await ctx.yield?.();
  const ribMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...baseU(), uRoot: { value: ROOT }, uStream: fleeceMat.uniforms.uStream, uWool: { value: cWhite.clone().multiplyScalar(0.78 / Math.max(cWhite.r, cWhite.g, cWhite.b)) }, uShade: { value: new THREE.Color('#b9b3d6') }, uGrey: { value: cGranite.clone().lerp(cSky, 0.3).multiplyScalar(0.8) } },
    vertexShader: VERT_HEAD + streamGLSL + /* glsl */`attribute vec2 aUV; attribute vec4 aRib, aExt; varying vec2 vUV; varying vec4 vRib; varying float vA, vShade;
      void main(){ float u = aUV.x, kind = aRib.w, len = aRib.y, sd = aRib.z; vec3 c = position, T = vec3(1., 0., 0.); float a = 1., sh = 0.; float t = uTime;
        if (kind < .5) { sh = aExt.x; c.y += sin(u * 9. + t * 1.3 + sd) * .22 * uWindK; c.z += sin(u * 5. - t * .9 + sd * 2.) * .3; }
        else if (kind < 1.5 || (kind > 3.5 && kind < 4.5)) { float ph = fract(aExt.x + uStream.x), pu = ph + (kind < 1.5 ? u * len / ${STREAM_LEN.toFixed(1)} : 0.); vec2 hw = streamHalf(min(pu, 1.));
          c = streamCentre(min(pu, 1.)) + vec3(0., aExt.z * hw.y * 1.25 + sin(u * 6. + t * .7 + sd) * .8, aExt.y * hw.x * 1.1 + sin(u * 4. + sd + t * .4) * 1.5);
          a = smoothstep(.0, .05, ph) * (1. - smoothstep(.88, 1., pu)) * smoothstep(aExt.w, aExt.w + .15, pu); sh = clamp(-aExt.z, 0., 1.) * .8;
          if (kind > 3.5) { c += vec3(-u * len * .4 - u * u * len * .3, -u * len, sin(u * 3. + t * .5 + sd) * 2.); T = normalize(vec3(-.5, -1., 0.)); sh = 1.; a *= .55 * (1. - u * u); } }
        else if (kind < 2.5) { float life = fract(t / aExt.w + sd * .37), age = life * aExt.w, ang = age * 1.1 + sd, cs = cos(ang), sn = sin(ang);
          vec3 l = vec3(position.x * cs, position.x * sn, position.x * sin(ang * .6) * .4);
          c = aExt.xyz + vec3(age * 16.5 * uWindK, sin(life * 3.1416) * (5. + 6. * fract(sd * 1.7)) - life * life * 9., sin(age * .5 + sd) * 5.) + l; T = normalize(vec3(cs, sn, .2));
          a = smoothstep(0., .08, life) * (1. - smoothstep(.45, 1., life)); }
        else { float w = u * len; c += vec3(w * (.95 - .15 * u), (sin(w * 1.1 - t * 5.5 * uWindK + sd) * .16 + sin(w * .45 - t * 2.3 + sd * 3.) * .22) * w * .3 - w * w * .012 + w * aExt.x - w * w * aExt.z, (sin(w * .8 - t * 4.1 * uWindK + sd * 5.) * .2 + sin(t * .7 + sd) * .25) * w * .35); a = aExt.w * (1. - u * u * .8); sh = aExt.y; }
        vec4 wp = modelMatrix * vec4(c, 1.); vec3 toC = cameraPosition - wp.xyz; float dist = length(toC);
        vec3 side = cross(T, toC / max(dist, 1e-3)) + vec3(0., 1e-4, 0.); side = normalize(side);
        // a snagged lock tapers from its full width at the root to nothing at its tip
        float taper = kind > 4.5 ? sin(clamp(u, 0., 1.) * 3.1416) : kind > 2.5 && kind < 3.5 ? (1. - .94 * u * sqrt(u)) : sin(clamp(u, .02, .98) * 3.1416) * .6 + .4;
        a *= smoothstep(1.6, 4.5, dist);
        // seen close, every strand is a few pixels wide and a lock a dozen: never a band across the frame
        float wd = aRib.x * taper, wmin = dist * .0032; wd = min(wd, max(dist * (kind > 2.5 && kind < 3.5 ? .028 : .019), wmin));
        a *= clamp(wd / max(wmin, 1e-4), 0., 1.); wd = max(wd, wmin);
        wp.xyz += side * aUV.y * wd * .5;
        vUV = aUV; vRib = aRib; vA = a; vShade = sh; vWorld = wp.xyz; vObj = c; vNrm = vec3(0., 1., 0.); vCol = vec3(1.);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`uniform vec3 uWool, uShade, uGrey; varying vec2 vUV; varying vec4 vRib; varying float vA, vShade;
      void main(){ float kind = vRib.w, len = vRib.y, sd = vRib.z, v = vUV.y;
        float scroll = kind < .5 ? uTime * 14. * uWindK * .22 : 0.;
        float lines = 2. + vRib.x * 1.6, fwv = abs(dFdx(v)) + abs(dFdy(v));
        float fib = vn3(vec3(vUV.x * len * .22 - scroll, v * lines, sd)) * .65 + vn3(vec3(vUV.x * len * .5 - scroll * 2.2, v * lines * 2.7, sd + 5.)) * .35;
        fib = mix(fib, .5, smoothstep(.25, .8, fwv * lines));
        float edge = 1. - v * v, ends = smoothstep(0., .12, vUV.x) * (1. - smoothstep(.8, 1., vUV.x));
        if (kind > 2.5 && kind < 3.5) ends = 1. - smoothstep(.75, 1., vUV.x);
        if (kind > 4.5) ends = smoothstep(0., .3, vUV.x) * (1. - smoothstep(.6, 1., vUV.x));
        float a = smoothstep(.34, .62, fib * .75 + edge * .42) * edge * ends * vA;
        if (kind > 1.5 && kind < 2.5) a = smoothstep(.3, .75, fib * .55 + edge * .5) * edge * ends * vA * .85;
        if (a < .01) discard;
        vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
        vec3 N = normalize(vec3(0., .85, 0.) + V * .5);
        float key = dot(N, uSunDir) * .5 + .5; key *= sqrt(key);
        vec3 base = mix(uWool, uShade, vShade * .8); if (kind > 3.5 && kind < 4.5) base = uGrey;
        vec3 c = base * (uSunCol * key * mix(1., .55, vShade) + uFillCol * mix(.85, 1.3, vShade) + uBounceCol * .3) * (.74 + .52 * fib) * (1. + .1 * nap(vWorld));
        gl_FragColor = vec4(c, a * .92);
        #include <fog_fragment>
      }`,
  });
  await ctx.yield?.();
  const ribbons = new THREE.Mesh(rbBuf.build(false), ribMat); ribbons.name = 'strands'; ribbons.frustumCulled = false; ribbons.renderOrder = 3; group.add(ribbons); mats.push(ribMat);
  await ctx.yield?.();

  // ---------------------------------------------------------------- two stags on a rock shoulder under the overhang, with wool breath
  const stagGroup = new THREE.Group(); stagGroup.name = 'stags';
  const stagSeat = (() => { if (opts.stagSeat) return new THREE.Vector3().copy(opts.stagSeat); const p = xz(-14, 196); return new THREE.Vector3(p[0], hillAt(p[0], p[1]) + 1.0, p[1]); })();
  let stagMat = null, puffMat = null;
  if (opts.stags !== false) {
    stagGroup.position.copy(stagSeat);
    const shBuf = new Buf({ position: 3, color: 3, aAo: 1 });
    pushBoulder({ x: 0, y: -1.25, z: 0, rx: 3.6, ry: 1.25, rz: 2.5, yaw: rng.range(-0.3, 0.3), tilt: 0.03, tiltAz: 0, det: 4, seed: rng.range(0, 99), plain: 1 }, shBuf);
    for (let i = 0; i < 5; i++) { const a = rng.range(0, 6.28), r = rng.range(2.8, 4.6), rr = rng.range(0.8, 1.6); pushBoulder({ x: Math.cos(a) * r, y: -1.9 - rng.range(0, 0.7), z: Math.sin(a) * r * 0.8, rx: rr * 1.3, ry: rr * 0.7, rz: rr, yaw: rng.range(0, 6.28), tilt: rng.range(0, 0.2), tiltAz: rng.range(0, 6.28), det: 2, seed: rng.range(0, 99), plain: 1 }, shBuf); }
    stagGroup.add(new THREE.Mesh(await shBuf.buildAsync(ctx), torMat));
    await ctx.yield?.();
    // one felt stag, facing +Z, 2.1 m to the antler tips
    const g = new Geo(), K = 0.8, cCoat = cRusset.clone().lerp(cPeat, 0.6).multiplyScalar(0.5), cBel = cCoat.clone().lerp(cPeat, 0.5), cDark = cPeat.clone().multiplyScalar(0.7), cHorn = cPeat.clone().lerp(new THREE.Color('#b9a98a'), 0.45), cRump = cCoat.clone().lerp(new THREE.Color('#e6d8b8'), 0.6);
    const body = g.loft([{ z: -0.84, y: 1.04, rx: 0, ry: 0 }, { z: -0.74, y: 1.04, rx: 0.17, ry: 0.2 }, { z: -0.46, y: 1.02, rx: 0.26, ry: 0.3 }, { z: 0, y: 0.97, rx: 0.28, ry: 0.31 }, { z: 0.42, y: 1.0, rx: 0.26, ry: 0.35 }, { z: 0.68, y: 1.07, rx: 0.2, ry: 0.29 }, { z: 0.84, y: 1.12, rx: 0, ry: 0 }], { sides: 12, top: cCoat, belly: cBel, shade: [-0.75, -0.1] });
    g.anim(body, () => [0, 1, 0, 0]); g.paint(body, (x, y, z, c) => { if (z < -0.6 && y > 0.95) c.lerp(cRump, clamp((-0.6 - z) * 6, 0, 0.8)); });
    for (const sx of [-1, 1]) for (const fr of [1, 0]) { const z = fr ? 0.5 : -0.56, x = sx * 0.15, kz = fr ? 0.03 : -0.1;
      g.tube([[x, 1.0, z], [x, 0.74, z + (fr ? 0 : -0.04)], [x, 0.5, z + kz], [x, 0.26, z + (fr ? 0 : -0.02)], [x, 0.07, z + 0.01], [x, 0, z + 0.03]], fr ? [0.12, 0.085, 0.058, 0.046, 0.05, 0.058] : [0.15, 0.1, 0.06, 0.046, 0.05, 0.058], 7, cCoat, cDark); }
    await ctx.yield?.();
    const n0 = g.n, NB = [0, 1.14, 0.6];
    const neck = g.tube([[0, 1.02, 0.52], [0, 1.24, 0.7], [0, 1.5, 0.86], [0, 1.72, 0.98]], [0.27, 0.22, 0.165, 0.13], 10, cCoat, cCoat, { flatten: 0.8 });
    g.paint(neck, (x, y, z, c) => { c.lerp(cDark, 0.35 * clamp((1.6 - y) * 1.6, 0, 1)); });      // the dark maned neck
    g.blob(0, 1.78, 1.05, 0.105, 0.115, 0.17, cCoat, cBel, 9, 5);
    const muz = g.tube([[0, 1.77, 1.12], [0, 1.72, 1.26], [0, 1.69, 1.37], [0, 1.685, 1.4]], [0.095, 0.07, 0.056, 0], 8, cCoat, cDark);
    for (const sx of [-1, 1]) {
      await ctx.yield?.();      // one antler a step
      g.blob(sx * 0.092, 1.81, 1.1, 0.018, 0.022, 0.026, new THREE.Color('#0b0907'), null, 5, 3);
      g.tube([[sx * 0.08, 1.84, 0.98], [sx * 0.17, 1.9, 0.93], [sx * 0.25, 1.93, 0.9]], [0.03, 0.045, 0], 5, cCoat, cBel, { flatten: 0.4 });
      const beam = [[sx * 0.06, 1.88, 1.0], [sx * 0.17, 2.06, 0.9], [sx * 0.31, 2.28, 0.85], [sx * 0.39, 2.48, 0.92], [sx * 0.37, 2.66, 1.04]];
      g.tube(beam, [0.062, 0.056, 0.048, 0.038, 0], 5, cHorn);
      g.tube([[sx * 0.08, 1.92, 0.99], [sx * 0.11, 1.98, 1.14], [sx * 0.13, 2.1, 1.24]], [0.044, 0.034, 0], 4, cHorn);       // brow tine
      g.tube([[sx * 0.17, 2.06, 0.9], [sx * 0.24, 2.12, 1.04], [sx * 0.27, 2.24, 1.12]], [0.04, 0.03, 0], 4, cHorn);      // bez
      g.tube([[sx * 0.31, 2.28, 0.85], [sx * 0.41, 2.33, 0.98], [sx * 0.45, 2.45, 1.05]], [0.038, 0.028, 0], 4, cHorn);     // trez
      g.tube([[sx * 0.39, 2.48, 0.92], [sx * 0.48, 2.6, 0.9], [sx * 0.52, 2.72, 0.94]], [0.02, 0.016, 0], 4, cHorn);        // crown
      g.tube([[sx * 0.39, 2.48, 0.92], [sx * 0.33, 2.6, 0.82], [sx * 0.31, 2.7, 0.8]], [0.02, 0.015, 0], 4, cHorn);
    }
    await ctx.yield?.();
    for (let i = n0; i < g.n; i++) { const t = clamp(((g.p[i * 3 + 1] - 1.05) * 0.83 + (g.p[i * 3 + 2] - 0.55) * 0.55) / 0.55, 0, 1); g.a[i * 4] = t; g.a[i * 4 + 1] = 0; g.pv[i * 3] = NB[0]; g.pv[i * 3 + 1] = NB[1]; g.pv[i * 3 + 2] = NB[2]; }
    const tail = g.tube([[0, 1.12, -0.8], [0, 1.02, -0.9], [0, 0.9, -0.9]], [0.05, 0.045, 0], 5, cRump);
    g.move([0, g.n], (p) => { p.multiplyScalar(K); }); for (let i = 0; i < g.pv.length; i++) g.pv[i] *= K;
    await ctx.yield?.();
    const sg = g.build();
    await ctx.yield?.();
    stagMat = new THREE.ShaderMaterial({
      fog: true, vertexColors: true, uniforms: { ...baseU(), uRoar: { value: season === 'rut' ? 1 : 0 } },
      vertexShader: VERT_HEAD + /* glsl */`attribute vec4 aAnim; attribute vec3 aPivot; uniform float uRoar;
        void main(){ vec3 p = position, n = normal; float sd = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * .9, w = aAnim.x;
          float roar = uRoar * smoothstep(.2, .8, sin(uTime * .45 + sd));
          float turn = (sin(uTime * .31 + sd) * .6 + sin(uTime * .13 + sd * 2.) * .4) * .6 * w * (1. - .7 * roar), pitch = (-.55 * roar - .05 * sin(uTime * .5 + sd)) * w;
          vec3 q = p - aPivot; float c = cos(turn), s = sin(turn); q.xz = vec2(c * q.x + s * q.z, -s * q.x + c * q.z); n.xz = vec2(c * n.x + s * n.z, -s * n.x + c * n.z);
          c = cos(pitch); s = sin(pitch); q.yz = vec2(c * q.y - s * q.z, s * q.y + c * q.z); n.yz = vec2(c * n.y - s * n.z, s * n.y + c * n.z);
          p = aPivot + q; p.x *= 1. + .025 * sin(uTime * 1.7 + sd) * aAnim.y;
          vObj = position; vCol = color; mat4 im = modelMatrix * instanceMatrix; vec4 wp = im * vec4(p, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(im) * n);
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: FRAG_HEAD + /* glsl */`
        void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
          gl_FragColor = vec4(felt(vCol, N, V, vObj, vWorld, 11., 1., .25), 1.);
          #include <fog_fragment>
        }`,
    });
    // (opts.moreStags: others of the bachelor group, standing where the world has put a slab for each: hero-local feet, yaw, size)
    const more = Array.isArray(opts.moreStags) ? opts.moreStags : [], NSTAG = 2 + more.length, gS = opts.stagScale || 1;
    const stags = new THREE.InstancedMesh(sg, stagMat, NSTAG); stags.frustumCulled = false; stags.name = 'stags';
    // they stand broadside to the arriving camera, heads toward the tor, a little apart and not parallel
    const faceTor = Math.atan2(-Ax, -Az), m4 = new THREE.Matrix4(), muzzles = [];
    for (let i = 0; i < 2; i++) { const yaw = faceTor + (i ? rng.range(0.9, 1.4) : rng.range(-0.5, -0.1)) * (rng.chance(0.5) ? 1 : 1), sc = i ? rng.range(0.9, 0.96) : rng.range(1.0, 1.06), px = i ? rng.range(1.5, 2.2) : rng.range(-1.9, -1.2), pz = i ? rng.range(-1.1, -0.4) : rng.range(0.2, 0.8);
      m4.compose(v3.set(px, -0.07, pz), q3.setFromEuler(e3.set(0, yaw, 0)), new THREE.Vector3(sc, sc, sc)); stags.setMatrixAt(i, m4);
      muzzles.push({ m: m4.clone(), sd: px * 1.7 + pz * 0.9 }); }
    for (let i = 0; i < more.length; i++) { const o = more[i], px = (o.x - stagSeat.x) / gS, py = (o.y - stagSeat.y) / gS, pz = (o.z - stagSeat.z) / gS, sc = o.size || 1;
      m4.compose(v3.set(px, py, pz), q3.setFromEuler(e3.set(0, o.yaw || 0, 0)), new THREE.Vector3(sc, sc, sc)); stags.setMatrixAt(2 + i, m4);
      muzzles.push({ m: m4.clone(), sd: px * 1.7 + pz * 0.9 }); }
    stags.instanceMatrix.needsUpdate = true; stagGroup.add(stags); mats.push(stagMat);
    // breath: small puffs of wool leaving the muzzle and taken by the wind (camera-facing soft tufts)
    await ctx.yield?.();
    const NP = 7, pb = new Buf({ position: 3, aPuff: 4, aMuz: 4, aCol0: 3, aCol1: 3 });
    for (let s = 0; s < NSTAG; s++) { const e = muzzles[s].m.elements; for (let k = 0; k < NP; k++) { const base = pb.n; for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pb.push({ position: [cx, cy, 0], aPuff: [k / NP, muzzles[s].sd, rng.range(0, 99), s], aMuz: [e[12], e[13], e[14], Math.atan2(e[8], e[10])], aCol0: [e[0], e[1], e[2]], aCol1: [e[8], e[9], e[10]] }); pb.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); } }
    puffMat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, uniforms: { ...baseU(), uRoar: stagMat.uniforms.uRoar, uWool: { value: cWhite.clone().multiplyScalar(0.8) }, uBig: { value: (season === 'rut' ? 1.5 : 1) * (hour === 'gold' ? 1.4 : 1) } },
      vertexShader: VERT_HEAD + /* glsl */`attribute vec4 aPuff, aMuz; attribute vec3 aCol0, aCol1; uniform float uRoar, uBig; varying vec2 vQ; varying float vA, vS;
        void main(){ float T = 3.4, life = fract(uTime / T + aPuff.x + aPuff.z * .37), t0 = uTime - life * T, sd = aPuff.y;
          float roar = uRoar * smoothstep(.2, .8, sin(t0 * .45 + sd));
          float turn = (sin(t0 * .31 + sd) * .6 + sin(t0 * .13 + sd * 2.) * .4) * .6 * (1. - .7 * roar), pitch = -.55 * roar - .05 * sin(t0 * .5 + sd);
          vec3 q = vec3(0., 1.685, 1.42) * ${K.toFixed(2)} - vec3(0., 1.14, .6) * ${K.toFixed(2)}; float c = cos(turn), s = sin(turn); q.xz = vec2(c * q.x + s * q.z, -s * q.x + c * q.z);
          c = cos(pitch); s = sin(pitch); q.yz = vec2(c * q.y - s * q.z, s * q.y + c * q.z); q += vec3(0., 1.14, .6) * ${K.toFixed(2)};
          vec3 right = aCol0, fwd = aCol1, sc3 = vec3(length(aCol0)); vec3 m = aMuz.xyz + right * q.x + vec3(0., q.y * sc3.x, 0.) + fwd * q.z;
          vec3 f2 = normalize(fwd * c + vec3(0., 1e-4, 0.));
          float breath = smoothstep(.0, .25, sin(t0 * 1.85 + sd * 3.) * .5 + .5);    // out-breaths only
          vec3 p = m + f2 * (.12 + life * .5) + vec3(life * life * 7.5 * uWindK + life * .4, life * .55 + sin(life * 9. + aPuff.z) * .06, sin(life * 5. + aPuff.z * 2.) * .25 * life);
          float size = (.1 + .62 * sqrt(life)) * uBig; vA = smoothstep(0., .06, life) * (1. - smoothstep(.35, 1., life)) * breath * .92; vS = aPuff.z; vQ = position.xy;
          vec4 wp = modelMatrix * vec4(p, 1.); vec4 mvPosition = viewMatrix * wp; mvPosition.xy += position.xy * size; vWorld = wp.xyz; vObj = p; vNrm = vec3(0., 1., 0.); vCol = vec3(1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: FRAG_HEAD + /* glsl */`uniform vec3 uWool; varying vec2 vQ; varying float vA, vS;
        void main(){ float r2 = dot(vQ, vQ); float n = vn3(vec3(vQ * 2.6, vS)); float a = (1. - smoothstep(.25, 1., r2 + (n - .5) * .7)) * vA; if (a < .01) discard;
          vec3 c = uWool * (uSunCol * (.55 + .3 * vQ.y) + uFillCol * .8) * (.85 + .3 * n);
          gl_FragColor = vec4(c, a);
          #include <fog_fragment>
        }`,
    });
    const puffs = new THREE.Mesh(pb.build(false), puffMat); puffs.frustumCulled = false; puffs.renderOrder = 4; stagGroup.add(puffs); mats.push(puffMat);
    group.add(stagGroup);
  }
  await ctx.yield?.();

  // ---------------------------------------------------------------- the passage: a wool veil round the lens and strands streaming past it
  let veil = null, lens = null, veilMat = null, lensMat = null;
  if (opts.passage !== false) {
    const woolLit = cWhite.clone().multiplyScalar(0.8);
    veilMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uInside: { value: 0 }, uBright: { value: 0 }, uLit: { value: woolLit.clone().multiply(L.sunColor).multiplyScalar(0.95) }, uDim: { value: new THREE.Color(0.46, 0.46, 0.56).multiplyScalar(hour === 'moon' ? 0.3 : 1) } },
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(mat3(modelMatrix) * position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform float uTime, uInside, uBright; uniform vec3 uLit, uDim; varying vec3 vDir;
        float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
        float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
        void main(){ vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
          float st = vn3(vec3(d.x * 1.3 - uTime * 2.6, d.y * 7., d.z * 7.)) * .45 + vn3(vec3(d.x * 2.6 - uTime * 4.4, d.y * 19., d.z * 19. + 4.)) * .35 + vn3(vec3(d.x * 5. - uTime * 7., d.y * 47., d.z * 47. + 8.)) * .2;
          st = smoothstep(.42, .74, st);
          float b = clamp(uBright + d.y * .22 * (1. - uBright), 0., 1.);
          vec3 c = mix(uDim, uLit, b * b * (3. - 2. * b)) * (.6 + .42 * st);
          // teased thin: opaque along the strands, open between them, closing only when the lens is wholly inside the fleece
          float a = clamp(uInside * mix(.1 + 1.02 * st, 1.3, smoothstep(.9, 1., uInside)), 0., 1.);
          gl_FragColor = vec4(c, a); }`,
    });
    veil = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 3), veilMat); veil.frustumCulled = false; veil.renderOrder = 60; veil.visible = false; group.add(veil);
    const lb = new Buf({ position: 3, aUV: 2, aSeed: 4 }), SEG = 8;
    for (let i = 0; i < 80; i++) { const sd = [rng(), rng(), rng(), rng()], len = rng.range(5, 12), wdt = rng.range(0.1, 0.5), base = lb.n;
      for (let k = 0; k <= SEG; k++) for (const v of [-1, 1]) lb.push({ position: [(k / SEG) * len, wdt, len], aUV: [k / SEG, v], aSeed: sd });
      for (let k = 0; k < SEG; k++) { const a = base + k * 2; lb.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    lensMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uWindK: { value: 1 }, uInside: { value: 0 }, uBright: { value: 0 }, uCam: { value: new THREE.Vector3() }, uLit: { value: woolLit.clone().multiply(L.sunColor).multiplyScalar(1.12) }, uDim: { value: new THREE.Color(0.3, 0.3, 0.4).multiplyScalar(hour === 'moon' ? 0.3 : 1) } },
      vertexShader: /* glsl */`attribute vec2 aUV; attribute vec4 aSeed; uniform float uTime, uWindK, uInside; uniform vec3 uCam; varying vec2 vUV; varying float vA, vT;
        void main(){ vec3 box = vec3(26., 9., 9.); float u = aUV.x, len = position.z;
          vec3 b = fract(aSeed.xyz + vec3(uTime * 14. * uWindK / box.x, 0., 0.) - uCam / box);
          vec3 c = uCam + (b - .5) * box + vec3(position.x, sin(u * 5. + uTime * 3. + aSeed.w * 40.) * .18 + sin(u * 2. + aSeed.w * 9.) * .4, sin(u * 4. - uTime * 2.2 + aSeed.w * 23.) * .22);
          vec3 toC = uCam - c; float dist = length(toC); vec3 side = normalize(cross(vec3(1., 0., 0.), toC / max(dist, 1e-3)) + vec3(0., 1e-4, 0.));
          float wd = max(position.y * (sin(clamp(u, .03, .97) * 3.1416) * .7 + .3) * mix(.4, 1., smoothstep(.65, .95, uInside)), dist * .0034);   // (finer in the thin skein)
          c += side * aUV.y * wd * .5;
          vA = uInside * smoothstep(0., .12, b.x) * (1. - smoothstep(.62, .78, b.x + u * len / box.x * .5)) * smoothstep(1.4, 3.6, dist) * (1. - smoothstep(6.5, 9.5, dist));
          if (aSeed.w <= .45) vA *= smoothstep(.65, .95, uInside);        // the grey strands belong to the thick of the wool, not to the thin skein
          vUV = aUV; vT = aSeed.w;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(c, 1.); }`,
      fragmentShader: /* glsl */`uniform float uBright; uniform vec3 uLit, uDim; varying vec2 vUV; varying float vA, vT;
        void main(){ float e = 1. - vUV.y * vUV.y; float a = e * vA * smoothstep(0., .1, vUV.x) * (1. - smoothstep(.85, 1., vUV.x)); if (a < .01) discard;
          vec3 c = vT > .45 ? uLit * (.9 + .5 * uBright) : uDim * (.7 + .6 * uBright);
          gl_FragColor = vec4(c, a * .85); }`,
    });
    lens = new THREE.Mesh(lb.build(false), lensMat); lens.frustumCulled = false; lens.renderOrder = 61; lens.visible = false; group.add(lens);
  }

  // ---------------------------------------------------------------- anchors
  const P3 = (lat, s, y) => { const p = xz(lat, s); return new THREE.Vector3(p[0], y, p[1]); };
  let woolEntry = flyPts[3].clone(), woolExit = flyPts[4].clone();
  { let was = 0; for (let i = 0; i <= 200; i++) { const s = 160 - i * 0.5, x = Ax * s, z = Az * s, y = pathY(s), rho = rhoAt(x, z); let inn = 0; if (rho < 1) { const m = moundAt(x, z, rho); inn = y > m.bottom && y < m.top ? 1 : 0; } if (inn && !was) woolEntry = new THREE.Vector3(x, y, z); if (!inn && was) woolExit = new THREE.Vector3(x, y, z); was = inn; } }
  const pitch = 0.0873, seatN = new THREE.Vector3(Ax * Math.cos(pitch), -Math.sin(pitch), Az * Math.cos(pitch));
  const anchors = {
    portalSeat: { position: new THREE.Vector3(seat[0], 47, seat[1]), normal: seatN, radius: 7 },
    flyThrough: flyPts, woolEntry, woolExit,
    thorns: thorns.map((t) => ({ top: t.top, base: t.base, radius: t.radius })),
    stagShoulder: stagSeat.clone(), overhang: (() => { const p = xz(-6, 112), m = moundAt(p[0], p[1]); return new THREE.Vector3(p[0], m.bottom, p[1]); })(),
    streamer: { root: ROOT.clone(), tail: new THREE.Vector3(ROOT.x + STREAM_LEN, ROOT.y - sag, ROOT.z), width: [90, 25] },
    furrow: { from: P3(0, 92, pathY(92) - 2.2), to: P3(0, 0, 42.5) },
    viewpoints: [
      { position: P3(40, 430, -30), target: new THREE.Vector3(60, 30, 20), note: 'the axis from the south: tor, root and the streamer running off right' },
      { position: P3(3, 212, -17.5), target: P3(-14, 150, 22), note: 'stags dark under the wool' },
      { position: P3(0, 84, 40.2), target: new THREE.Vector3(seat[0], 47, seat[1]), note: 'the furrow, the thorns and the portal seat' },
    ],
    windDir: new THREE.Vector3(1, 0, 0), windSpeed: WIND, sunDir: L.sunDir.clone(),
  };

  // ---------------------------------------------------------------- runtime
  let windK = 1, forcedInside = null, insideNow = 0; const camL = new THREE.Vector3();
  const insideAt = (worldPos) => { camL.copy(worldPos); group.worldToLocal(camL); return insideLocal(camL.x, camL.y, camL.z); };
  const setLight = (o = {}) => { for (const m of mats) { const u = m.uniforms; if (o.sunDir) u.uSunDir.value.copy(o.sunDir).normalize(); if (o.sunColor) u.uSunCol.value.copy(o.sunColor); if (o.fill) u.uFillCol.value.copy(o.fill); if (o.bounce) u.uBounceCol.value.copy(o.bounce); if (o.rim) u.uRimCol.value.copy(o.rim); }
    if (veilMat && o.sunColor) { veilMat.uniforms.uLit.value.copy(cWhite).multiplyScalar(0.8 * 0.95).multiply(o.sunColor); lensMat.uniforms.uLit.value.copy(cWhite).multiplyScalar(0.8 * 1.12).multiply(o.sunColor); } };
  if (opts.light) setLight(opts.light);
  const update = (dt, time, camera) => {
    for (const m of mats) { m.uniforms.uTime.value = time; m.uniforms.uWindK.value = windK; }
    fleeceMat.uniforms.uStream.value.x = (time * WIND / STREAM_LEN) % 1;
    if (!camera) return;
    group.updateWorldMatrix(true, false);
    camL.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(camL);
    { const d2 = camL.x * camL.x + camL.z * camL.z, far = d2 > 300 * 300, grow = 1 - smoothstep(196, 236, Math.sqrt(d2)); fleece.visible = !far; fleeceLo.visible = far;
      growU.value = grow; fleeceNear.visible = tufts.visible = grow > 0.002; }
    if (!veil) return;
    const ins0 = insideLocal(camL.x, camL.y, camL.z), sk = 0;
    const ins = forcedInside !== null ? forcedInside : ins0; insideNow = ins;
    const on = ins > 0.003; veil.visible = on; lens.visible = on;
    if (on) {
      const rho = Math.min(rhoAt(camL.x, camL.z), 1), m = moundAt(camL.x, camL.z, rho);
      const b = sk > ins0 ? 1 : smoothstep(m.bottom - 4, Math.max(m.top, m.bottom + 6) + 1, camL.y);
      veil.position.copy(camL); veilMat.uniforms.uTime.value = time; veilMat.uniforms.uInside.value = sk > ins0 ? sk * 0.2 : ins; veilMat.uniforms.uBright.value = b;
      lensMat.uniforms.uTime.value = time; lensMat.uniforms.uWindK.value = windK; lensMat.uniforms.uInside.value = smoothstep(0.05, 0.6, ins) * (sk > ins0 ? 0.6 : 1); lensMat.uniforms.uBright.value = b; lensMat.uniforms.uCam.value.copy(camL);
    }
  };
  update(0, 0, null);

  return {
    object: group, radius: 80, height: 60, center: new THREE.Vector3(18, 27, 22), anchors,
    ground: true, groundY: -44,
    parts: { tor: torMesh, fleece, fleeceLo, fleeceNear, tufts, strands: ribbons, stags: stagGroup, veil, lens }, stats,
    update, insideAt, hillAt, moundAt,
    get inside() { return insideNow; },
    setInside(v) { forcedInside = v === null || v === undefined ? null : clamp(v, 0, 1); },
    setLight, setWind(k) { windK = clamp(k, 0, 1.5); },
    dispose() {},
  };
}
