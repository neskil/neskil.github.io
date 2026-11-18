// THE HERD THAT LEAVES THE WALL - hero set piece for the world "running-wall".
//
// Chauvet's horses, aurochs and giant deer as paintings that slide along limestone, cycle their legs, trail two
// ghost sets of legs and a ghost head, then unroll round the rock edge into daylight as low-relief animals a
// third as thick as life and gallop on in their own red dust. One system does both states: every runner is a
// lofted profile figure bent along its own baked track (a row of a float texture); the track carries a relief
// value, and at relief 0 the figure is pressed to 3 percent thickness 5 cm off the rock (a painting), at 1 it is
// a bas-relief. Because relief is read per vertex the head and forelegs round out while the hindquarters are
// still paint. Legs are two-bone IK in the vertex shader; the gait phase is distance run / stride and a stance
// foot is held at one track point while the body passes over it, so nothing skates at any speed.
//
// TWO MODES
//   stand-alone (no opts.path; what tools/shot.mjs _part shows): a carousel. Two painted limestone shelters on
//     a circle of radius 19 m (origin = its centre on the ground, +Y up, the painted faces look toward +Z,
//     "front" is azimuth 15 deg). ~40 runners lap it clockwise seen from above: onto wall B at its west edge,
//     along it as paint, a leap in relief across an 8 m gap, along wall A, off its east edge (the peel), round
//     the open ground in relief past the front, and back into the rock. A hearth burns under wall B (torch pool
//     on the frieze, charcoal smoke). Rock, hand stencils, palm-dot panels, ground and grass signs included.
//   path mode (opts.path = the world's makePath, in the hero's local space: leave hero.object at identity):
//     no rock is built. 40 escort horses (index 0 = the black stallion) and a frieze of ~34 looping figures.
//     In the cave (path distance < mouthU x length) every figure rides the wall lines returned in
//     anchors.wallLines (path +/- half width: hall 16 m for 30 m, gallery 4.5 m, mouth 7 m; override with
//     opts.cave) at heights 0.3..5 m: BUILD THE SHELL'S WALLS SMOOTH AND VERTICAL ON THOSE LINES in that band.
//     Past the mouth each figure unrolls over 4 m, drops to opts.heightAt and fans to its lane (5..40 m either
//     side, lanes follow the path, opts.avoid = [{x,z,r}] pushes them round set pieces, the last 100 m keep
//     opts.portalClear = 10 m off the axis so the herd splits round the ring). Frieze figures leave at 15 m/s by
//     the clock and dissolve into the rock 140 m out; escorts are keyed to progress.
//
// PROGRESS  hero.setProgress(u) with the camera's path fraction every frame (path mode). Cave: escorts sit on the
//   walls and overtake at 15 m/s per 12 m/s of camera; from the mouth on they hold station on the camera
//   (so their speed is the camera's), stallion 5 m ahead, 11 m to the right, closing to opts.stallionLat = 5 m
//   for u 0.22..0.40. If setProgress is never called u is taken from the camera passed to update().
//   hero.runnerAt(i, out) = local position of runner i now (for pois). hero.setTorch(pos, intensity),
//   hero.setSun(dir), hero.uniforms (uSun, uTorch xyz+intensity, uTorchCol, uMouth xyz+reach, uFade, uSnow...).
//   WORLD EXTENSIONS (path mode): opts.species = more species objects (same shape as buildHorse's result, plus optional
//   gaitOff [4 leg phases], tail [lift, wiggle, back, swing], coat(rng), noGhost), numbered from 3; opts.escort = species
//   index of the escorts other than the stallion; opts.laneFn(d, side, lane) -> lane; opts.actors = figures the world
//   scripts: { sp, sample(t) -> [x,y,z,relief,cave,presence,dust], scale, ochre, fill, red, antler, stride }, the world
//   sets actor.t (0..1 along its own track) each frame and reads hero.actorAt(actor). uniforms.uTorchR = torch pool size.
//   hero.rescale(actor, s) resizes one figure while it runs; opts.stallionScale (1.1) sizes the stallion.
//
// OPTS  palette [rock, pale rock, tan, charcoal, yellow ochre, red ochre] (brief order)
//       hour 'morning' | 'golden' | 'night' (engraved: clay film, figures scraped pale)   weather 'clear' | 'loess' | 'snow'
//       horses, aurochs, deer (stand-alone counts)   horses (escorts, 30..48), frieze (path mode)   speed (wall, 15 m/s)
//       sunDir [x,y,z] toward the sun   grainTexture (share one; otherwise hero.grainTexture is built here)
//       path, mouthU (0.13), eye (2.3), heightAt(x,z), dustAt(x,z) 0..1, cave {hallHalf, galleryHalf, mouthHalf, hallLen},
//       avoid, laneMin, portalClear, stallionLat   rock / ground: false to omit the stand-alone setting
//
// ANCHORS (local space)
//   stand-alone: portalSeat {position [0,7.2,0], facing, radius 7} in the middle of the ring; flyThrough = 4
//     points in over the herd from the front (>= 6 m above backs and antlers); viewpoints {front, peel, gap,
//     frieze, abreast}: {position, target}; peelEdge, returnEdge, gap {from,to}; walls {radius, spansDeg,
//     friezeHeight, overhangY, rockOuterRadius, crownY}; ring {inner, outer, lapSeconds}; hearth; sunDir.
//   path mode: mouth {position, facing, u, halfWidth, height}; wallLines {left, right (floor polylines every 4 m),
//     friezeBand}; portalSeat {position = path end, facing, radius, clear}; flyThrough (the path itself);
//     lanes {min, max, stallion {side, lateral, closeLateral, closeFrom, closeTo, ahead}}; sunDir.
//
// SIZE  stand-alone: hero.radius 14 is the VIEWING radius of the ring about hero.center (-1.3, 3.2, -4.8); the
//   rock reaches 28.5 m from the origin and 15 m up; ground apron to 420 m (flat inside 34 m). Path mode: the
//   whole path. Horses 1.5 m at the withers / 1.85 m to the ears, aurochs 1.8 m, stag 2.0 m with antlers to 3.5 m.
// COST  stand-alone 72-78k triangles, 9 draw calls; path mode ~124k, 7 draw calls; 190-270 ms build; two textures
//   (256 RGBA8 grain, a float track table read with texelFetch); no lights, no blending, no render targets.
// LIGHT  none from the scene: this is the brief's pigment shading (style 'none'). Bare rock = grain texture,
//   raked from uSun; every pigment goes through rwDab so it breaks on the grain; shade is a charcoal smudge on
//   faces turned from uSun (uShade) and a smudge sign under each animal; the contour is the distance to the
//   profile outline (aPaint.w) thresholded with noise re-seeded floor(time x 8), never thinner than 1.6 px;
//   ghosts are the legs+head subset drawn twice, lagging 0.42 m and 0.08 of a cycle each, stippled (no
//   blending anywhere). Bloom comes only from calcite glints and the flame. Scene fog is honoured.
//   The world should shade terrain, sky and its other animals with PIGMENT_GLSL + makeGrainTexture (exported),
//   and can build more figures with Fig / addLeg / FIG_VERT / FIG_FRAG / TRACK_GLSL / bakeRow (exported).
//   Give the stand-alone piece a pale cream sky; it was judged with bg=day.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const DEFAULT_PALETTE = ['#E9DFC8', '#F7F2E6', '#BBA988', '#2B2623', '#D29B3E', '#A8432A'];
const TAU = Math.PI * 2;
const sstep = (a, b, x) => smoothstep(a, b, x);

// ------------------------------------------------------------------------------------------------
// The shared calcite grain: one tileable 256 RGBA texture.
//   R fine crystalline height   G broad blotch (pigment mask)   B mid streaks (line wobble)   A sparkle seeds
// ------------------------------------------------------------------------------------------------
export async function makeGrainTexture(rng, ctx) {
  const S = 256, data = new Uint8Array(S * S * 4);
  const lattice = (L) => { const a = new Float32Array(L * L); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const octs = (list) => list.map(([L, amp, ridged]) => ({ L, amp, ridged, a: lattice(L) }));
  const sample = (o, x, y) => {
    const L = o.L, fx = (x / S) * L, fy = (y / S) * L, x0 = Math.floor(fx), y0 = Math.floor(fy);
    let tx = fx - x0, ty = fy - y0; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const x1 = (x0 + 1) % L, y1 = (y0 + 1) % L, a = o.a;
    const v = lerp(lerp(a[y0 * L + x0], a[y0 * L + x1], tx), lerp(a[y1 * L + x0], a[y1 * L + x1], tx), ty);
    return o.ridged ? 1 - Math.abs(2 * v - 1) : v;
  };
  const sum = (os, x, y) => { let s = 0, w = 0; for (const o of os) { s += sample(o, x, y) * o.amp; w += o.amp; } return s / w; };
  const R = octs([[8, 0.7, 0], [16, 0.8, 1], [32, 1.0, 0], [64, 0.9, 1], [128, 0.55, 0]]);
  const WX = octs([[8, 1, 0], [32, 0.5, 0]]), WY = octs([[8, 1, 0], [32, 0.5, 0]]);
  const G = octs([[4, 1, 0], [8, 0.7, 0], [16, 0.45, 0], [64, 0.2, 0]]);
  const B = octs([[8, 1, 0], [16, 0.8, 1], [32, 0.5, 0]]);
  for (let y = 0, i = 0; y < S; y++) {
    for (let x = 0; x < S; x++, i += 4) {
      const wx = x + (sum(WX, x, y) - 0.5) * 34 + S, wy = y + (sum(WY, x, y) - 0.5) * 34 + S;
      data[i] = clamp((sum(R, wx % S, wy % S) - 0.5) * 2.1 + 0.5, 0, 1) * 255;
      data[i + 1] = clamp((sum(G, x, y) - 0.5) * 2.0 + 0.5, 0, 1) * 255;
      data[i + 2] = clamp((sum(B, x, y) - 0.5) * 1.9 + 0.5, 0, 1) * 255;
      data[i + 3] = rng() * 255;
    }
    if ((y & 15) === 15) await ctx?.yield?.();   // sixteen rows a step
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------------------------------------------
// PIGMENT_GLSL: the whole style in one fragment chunk (exported so the world can paint its terrain,
// cliffs, sky and other animals with exactly the same hand).
//   rwGrain2(p)        two-scale grain lookup in a plane (p in metres)  -> (height, blotch, streak, sparkle seed)
//   rwRock(h, blot)    bare limestone colour for a grain height
//   rwDab(amt, h, s)   dry-brush coverage: pigment amount 0..1 laid over grain height h; it catches the high
//                      grain and skips the pits. Use for EVERY pigment so paint always breaks on the bumps.
//   rwRake(h, hSun)    sun raking the bump: h sampled again a little way toward the sun
//   rwCave(col,wp,c)   torch pool + daylight from the mouth, falling to charcoal (c = 0 outdoors, 1 in the cave)
//   rwSpark(g, wp)     calcite glint (HDR, the only thing here that blooms)
//   rwHand(p)          signed distance (in hand lengths) to a spread left hand, for stencils
// ------------------------------------------------------------------------------------------------
export const PIGMENT_GLSL = /* glsl */`
uniform sampler2D uGrain;
uniform vec3 uRock, uPale, uChar, uOchre, uRed, uSun, uTorchCol, uDark, uShade;
uniform vec4 uTorch, uMouth, uHearth;
uniform float uTime, uFade, uSnow, uTorchR, uTorchBack, uEngr, uGlim;
vec4 rwGrain2(vec2 p){
  vec4 a = texture2D(uGrain, p * 0.55), b = texture2D(uGrain, p * 0.093 + vec2(0.37, 0.11));
  return vec4(a.r * 0.62 + b.r * 0.38, b.g * 0.65 + a.g * 0.35, a.b, a.a);
}
vec3 rwRock(float h, float blot){
  vec3 c = mix(uRock * 0.5, mix(uRock, uPale, 0.45) * 0.76, smoothstep(0.2, 0.9, h)) * (0.9 + 0.16 * blot);
  c *= vec3(1.04, 0.965, 0.84);
  return mix(c, vec3(0.86, 0.87, 0.85), uSnow * smoothstep(0.5, 0.25, h));
}
float rwDab(float amt, float h, float soft){
  return smoothstep(0.5 - soft, 0.5 + soft, amt * 0.95 + (h - 0.5) * 1.1);
}
float rwRake(float h, float hSun){ return clamp((h - hSun) * 2.6, -0.34, 0.3); }
vec3 rwCave(vec3 col, vec3 wp, float cave){
  vec3 dt = wp - uTorch.xyz;
  dt.z *= mix(1.0, uTorchBack, step(0.0, dt.z));
  float tl = uTorch.w * exp(-dot(dt, dt) / max(uTorchR, 1.0));
  float ml = exp(-distance(wp, uMouth.xyz) / max(uMouth.w, 1.0));
  // two ember beds (the world's hearths: uHearth xyz, strength; the second is mirrored across the axis)
  vec3 h1 = wp - uHearth.xyz, h2 = wp - vec3(0.5 - uHearth.x, uHearth.y, uHearth.z - 3.0);
  float hl = uHearth.w * (exp(-dot(h1, h1) / 70.0) + exp(-dot(h2, h2) / 70.0));   // an ember bed lights some 8 m round it, no more
  tl += hl;
  float L = tl + ml;
  vec3 lit = col * (uTorchCol * tl + vec3(1.0, 0.96, 0.88) * ml) / max(L, 1e-3);
  vec3 c = mix(uDark * (0.3 + 1.7 * dot(col, vec3(0.3333))), lit, smoothstep(0.05, 0.9, L));
  return mix(col, c, clamp(cave, 0.0, 1.0));
}
vec3 rwSpark(vec4 g, vec3 wp){
  vec3 vd = wp - cameraPosition;
  float tw = max(sin(dot(vd, vec3(3.1, 2.3, 2.7)) + g.a * 160.0 + uTime * 1.3), 0.0);
  tw *= tw; tw *= tw; tw *= tw;
  return uPale * (smoothstep(0.955, 1.0, g.a) * tw * 3.2);
}
float rwSeg(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * t) - r;
}
float rwHand(vec2 p){
  float d = length(max(abs(p - vec2(0.0, -0.18)) - vec2(0.15, 0.17), 0.0)) - 0.07;
  d = min(d, rwSeg(p, vec2(-0.15, 0.04), vec2(-0.25, 0.36), 0.048));
  d = min(d, rwSeg(p, vec2(-0.05, 0.07), vec2(-0.08, 0.50), 0.052));
  d = min(d, rwSeg(p, vec2(0.05, 0.07), vec2(0.07, 0.53), 0.052));
  d = min(d, rwSeg(p, vec2(0.15, 0.04), vec2(0.22, 0.44), 0.048));
  d = min(d, rwSeg(p, vec2(0.18, -0.20), vec2(0.40, 0.02), 0.055));
  d = min(d, rwSeg(p, vec2(-0.08, -0.36), vec2(0.08, -0.36), 0.12));
  return d;
}
`;

function pigmentUniforms(pal, grain) {
  const C = (h) => new THREE.Color(h);
  return {
    uGrain: { value: grain },
    uRock: { value: C(pal[0]) }, uPale: { value: C(pal[1]) }, uTan: { value: C(pal[2]) },
    uChar: { value: C(pal[3]) }, uOchre: { value: C(pal[4]) }, uRed: { value: C(pal[5]) },
    uSun: { value: new THREE.Vector3(-0.55, 0.62, 0.56).normalize() },
    uTorch: { value: new THREE.Vector4(0, -100, 0, 0) }, uTorchCol: { value: new THREE.Color(1.5, 0.95, 0.5) },
    uMouth: { value: new THREE.Vector4(0, 0, 0, 22) }, uHearth: { value: new THREE.Vector4(0, -1000, 0, 0) },
    uTime: { value: 0 }, uFade: { value: 1500 }, uSnow: { value: 0 }, uTorchR: { value: 70 }, uTorchBack: { value: 1 }, uEngr: { value: 0 }, uGlim: { value: 1 }, uShLen: { value: 1 }, uDark: { value: C(pal[3]).multiplyScalar(1.15) }, uShade: { value: C(pal[3]).multiplyScalar(2.5) },
  };
}

// ------------------------------------------------------------------------------------------------
// Figure builder: animals as lofted profile tubes. Local space: +X nose, +Y up, Z = thickness.
// Attributes: position / normal (rest pose, full life thickness), aPaint (ochre, charcoal, red, distance in
// metres from the profile outline), aSkin (bone, param, across-leg offset, part).
// Bones: 0 trunk, 1 neck+head (param = nod weight), 2 tail (param = 0..1 along it), 3..6 legs
// (fore near, fore far, hind near, hind far; param = distance down the leg from the pivot).
// ------------------------------------------------------------------------------------------------
export class Fig {
  constructor() { this.p = []; this.n = []; this.c = []; this.s = []; this.idx = []; this.gidx = []; this.nv = 0; }
  vert(x, y, z, nx, ny, nz, paint, edge, bone, param, xoff, part) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(paint[0], paint[1], paint[2], edge);
    this.s.push(bone, param, xoff, part); return this.nv++;
  }
  tri(a, b, c, ghost) { this.idx.push(a, b, c); if (ghost) this.gidx.push(a, b, c); }
  // st: [x, y, ry, rz] stations along a spine in the profile plane
  tube(st, o = {}) {
    const K = o.sides || 8, n = st.length, zc = o.z || 0, bone = o.bone || 0, part = o.part || 0, ghost = !!o.ghost;
    const rings = [];
    for (let j = 0; j < n; j++) {
      const a = st[Math.max(j - 1, 0)], b = st[Math.min(j + 1, n - 1)], s = st[j];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const px = -ty, py = tx, ry = Math.max(s[2], 1e-3), rz = Math.max(s[3], 1e-3), ring = [];
      const f = j / (n - 1), zj = zc + (o.zBow ? o.zBow(f) : 0);
      for (let k = 0; k < K; k++) {
        const an = (k / K) * TAU, ca = Math.cos(an), sa = Math.sin(an);
        let nx = px * ca / ry, ny = py * ca / ry, nz = sa / rz; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const paint = o.paint ? o.paint(f, ca, s, j) : [0, 0, 0];
        const param = o.param ? o.param(f, s, j) : 0;
        const edge = o.flat ? 0 : ry * (1 - Math.abs(ca)) + (o.edgeBias || 0);
        ring.push(this.vert(s[0] + px * ry * ca, s[1] + py * ry * ca, zj + rz * sa, nx, ny, nz, paint, edge, bone, param, o.leg ? ry * ca : 0, part));
      }
      rings.push(ring);
    }
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < K; k++) {
      const a = rings[j][k], b = rings[j][(k + 1) % K], c = rings[j + 1][k], d = rings[j + 1][(k + 1) % K];
      this.tri(a, c, b, ghost); this.tri(b, c, d, ghost);
    }
    for (const [j, flip] of [[0, false], [n - 1, true]]) {
      if ((j === 0 && o.openStart) || (j > 0 && o.openEnd)) continue;
      const s = st[j], f = j / (n - 1), paint = o.paint ? o.paint(f, 0, s, j) : [0, 0, 0];
      const cv = this.vert(s[0], s[1], zc + (o.zBow ? o.zBow(f) : 0), flip ? 1 : -1, 0, 0, paint, o.flat ? 0 : s[2], bone, o.param ? o.param(f, s, j) : 0, 0, part);
      for (let k = 0; k < K; k++) { const a = rings[j][k], b = rings[j][(k + 1) % K]; if (flip) this.tri(a, cv, b, ghost); else this.tri(a, b, cv, ghost); }
    }
  }
  // flat sheet in the profile plane: pts outline polygon [[x,y],...] fanned from c; two-sided by winding both ways
  sheet(c, pts, o = {}) {
    const paint = o.paint || [0, 1, 0], bone = o.bone || 0, part = o.part || 0, zf = o.zf || (() => o.z || 0), ghost = !!o.ghost;
    const pm = o.param || (() => 0);
    for (const sg of [1, -1]) {
      const cv = this.vert(c[0], c[1], zf(c[0], c[1]), 0, 0, sg, paint, o.edge ?? 0.06, bone, pm(c[0], c[1]), 0, part), ids = [];
      for (const q of pts) ids.push(this.vert(q[0], q[1], zf(q[0], q[1]), 0, 0, sg, paint, 0, bone, pm(q[0], q[1]), 0, part));
      for (let i = 0; i < ids.length - 1; i++) { if (sg > 0) this.tri(cv, ids[i], ids[i + 1], ghost); else this.tri(cv, ids[i + 1], ids[i], ghost); }
    }
  }
  build() {
    const mk = (idx) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', this._pos); g.setAttribute('normal', this._nrm);
      g.setAttribute('aPaint', this._col); g.setAttribute('aSkin', this._skin);
      g.setIndex(idx); return g;
    };
    this._pos = new THREE.Float32BufferAttribute(this.p, 3); this._nrm = new THREE.Float32BufferAttribute(this.n, 3);
    this._col = new THREE.Float32BufferAttribute(this.c, 4); this._skin = new THREE.Float32BufferAttribute(this.s, 4);
    return { body: mk(this.idx), ghost: mk(this.gidx), tris: this.idx.length / 3, ghostTris: this.gidx.length / 3 };
  }
}

// points along the top (sign +1) or bottom (-1) outline of a spine
function ridge(st, sign = 1) {
  const out = [];
  for (let j = 0; j < st.length; j++) {
    const a = st[Math.max(j - 1, 0)], b = st[Math.min(j + 1, st.length - 1)], s = st[j];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    out.push({ x: s[0] - ty * s[2] * sign, y: s[1] + tx * s[2] * sign, px: -ty * sign, py: tx * sign });
  }
  return out;
}

export function addLeg(fig, bone, hx, hy, L1, L2, L3, zc, thick, hind, dark) {
  const Lt = L1 + L2 + L3, k = thick;
  const st = [
    [0.14, (hind ? 0.20 : 0.15) * k, 0.10 * k], [0.32, (hind ? 0.155 : 0.12) * k, 0.085 * k], [L1, 0.07 * k, 0.06 * k],
    [L1 + L2 * 0.5, 0.047 * k, 0.042 * k], [L1 + L2, 0.058 * k, 0.05 * k], [L1 + L2 + L3 * 0.55, 0.05 * k, 0.045 * k], [Lt, 0.07 * k, 0.06 * k],
  ].map(([l, rx, rz]) => [hx, hy - l, rx, rz]);
  fig.tube(st, {
    sides: 6, z: zc, bone, part: 1, leg: true, ghost: true, openStart: true,
    param: (f, s) => hy - s[1],
    paint: (f, ca, s) => { const l = hy - s[1], c = sstep(L1 * 0.72, L1 * 1.12, l); return [Math.max(dark ? 0.2 : 0.62 * (1 - c), 0), Math.max(c, dark), 0]; },
  });
}

function addEye(fig, x, y, z, r, w) {
  const pts = []; for (let i = 0; i <= 6; i++) pts.push([x + Math.cos(i / 6 * TAU) * r, y + Math.sin(i / 6 * TAU) * r * 0.7]);
  for (const sg of [1, -1]) fig.sheet([x, y], pts, { z: sg * z, paint: [0, 1, 0], bone: 1, param: () => w, edge: 0 });
}

function addMane(fig, neck, j0, j1, hgt, rng, w0, w1) {
  const top = ridge(neck, 1);
  for (let j = j0; j < j1; j++) {
    const a = top[j], b = top[j + 1], n = 3, pts = [[a.x - a.px * 0.03, a.y - a.py * 0.03], [b.x - b.px * 0.03, b.y - b.py * 0.03]];
    for (let i = n; i >= 0; i--) {
      const f = i / n, h = hgt * (0.75 + 0.5 * rng()) * (i % 2 ? 1 : 0.72);
      pts.push([lerp(a.x, b.x, f) + lerp(a.px, b.px, f) * h, lerp(a.y, b.y, f) + lerp(a.py, b.py, f) * h]);
    }
    pts.push(pts[0]);
    const w = lerp(w0, w1, (j - j0 + 0.5) / (j1 - j0));
    fig.sheet([(a.x + b.x) / 2, (a.y + b.y) / 2], pts, { paint: [0, 1, 0], bone: 1, param: () => w, edge: 0 });
  }
}

// ---- species ------------------------------------------------------------------------------------
function buildHorse(rng) {
  const f = new Fig(), j = (a) => a * (0.94 + 0.12 * rng());
  const belly = j(0.37), wd = j(1);
  const trunk = [[-1.03, 1.2, 0.05, 0.04], [-0.96, 1.18, 0.2, 0.16], [-0.76, 1.14, 0.33, 0.27], [-0.45, 1.1, 0.36, 0.3], [-0.1, 1.07, belly, 0.31],
    [0.25, 1.08, 0.38, 0.3], [0.5, 1.12, 0.38, 0.27], [0.7, 1.13, 0.3, 0.2], [0.83, 1.15, 0.14, 0.1]].map((s) => [s[0], s[1], s[2], s[3] * wd]);
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.6 + 0.5 * ca - 0.12 * sstep(0.3, 0.6, t) * sstep(0.75, 0.45, t), 0.3 * sstep(0.5, 1, ca), 0] });
  const neck = [[0.45, 1.2, 0.3, 0.17], [0.72, 1.42, 0.22, 0.13], [0.94, 1.61, 0.17, 0.105], [1.07, 1.68, 0.15, 0.1], [1.21, 1.57, 0.14, 0.09],
    [1.35, 1.42, 0.108, 0.075], [1.45, 1.31, 0.086, 0.062], [1.49, 1.265, 0.058, 0.045]];
  f.tube(neck, { sides: 8, bone: 1, ghost: true, param: (t) => sstep(0, 0.6, t), paint: (t, ca) => [0.7 + 0.35 * ca, 0.92 * sstep(0.74, 0.96, t), 0] });
  addMane(f, neck, 0, 3, 0.15, rng, 0.15, 0.8);
  for (const sg of [1, -1]) f.sheet([1.03, 1.8], [[0.98, 1.76], [1.09, 1.77], [1.03 + 0.02 * sg, 1.95], [0.98, 1.76]], { z: sg * 0.06, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 1, edge: 0 });
  addEye(f, 1.15, 1.6, 0.092, 0.026, 1);
  f.tube([[-0.98, 1.27, 0.07, 0.04], [-1.22, 1.24, 0.085, 0.045], [-1.5, 1.12, 0.1, 0.04], [-1.75, 0.93, 0.085, 0.03], [-1.9, 0.72, 0.03, 0.015]],
    { sides: 6, bone: 2, flat: true, param: (t) => t, paint: () => [0, 1, 0] });
  const F = [0.5, 1.05, 0.5, 0.46], H = [-0.7, 1.08, 0.52, 0.47], L3 = 0.21;
  addLeg(f, 3, F[0], F[1], F[2], F[3], L3, 0.14, 1.14, false, 0); addLeg(f, 4, F[0], F[1], F[2], F[3], L3, -0.14, 1.14, false, 0);
  addLeg(f, 5, H[0], H[1], H[2], H[3], L3 - 0.01, 0.15, 1.14, true, 0); addLeg(f, 6, H[0], H[1], H[2], H[3], L3 - 0.01, -0.15, 1.14, true, 0);
  return { ...f.build(), fore: F, hind: H, L3, gait: [1.38, 0.46, 0.055, 0.05], neck: [0.5, 1.25, 0.11, 1.05], height: 1.85, len: 2.5, stride: 8.4 };
}

function buildAurochs(rng) {
  const f = new Fig();
  const trunk = [[-1.43, 1.42, 0.05, 0.04], [-1.36, 1.38, 0.22, 0.17], [-1.1, 1.3, 0.38, 0.3], [-0.6, 1.22, 0.42, 0.34], [-0.1, 1.18, 0.46, 0.37],
    [0.4, 1.22, 0.52, 0.38], [0.75, 1.3, 0.52, 0.34], [1.0, 1.25, 0.4, 0.25], [1.15, 1.22, 0.18, 0.12]];
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.25, 0.78 - 0.5 * sstep(0.8, 1, ca), 0] });
  const neck = [[0.75, 1.35, 0.42, 0.22], [1.1, 1.42, 0.32, 0.17], [1.4, 1.4, 0.24, 0.14], [1.62, 1.28, 0.19, 0.12], [1.82, 1.1, 0.14, 0.1], [1.93, 0.98, 0.1, 0.08], [1.97, 0.93, 0.05, 0.04]];
  f.tube(neck, { sides: 8, bone: 1, ghost: true, param: (t) => sstep(0, 0.6, t), paint: (t) => [0.2, 0.85 - 0.75 * sstep(0.8, 0.95, t), 0] });
  for (const sg of [1, -1]) {
    const h = [[1.42, 1.56, 0.06, 0.05], [1.52, 1.76, 0.055, 0.045], [1.72, 1.92, 0.045, 0.04], [1.93, 1.95, 0.03, 0.028], [2.06, 2.1, 0.01, 0.01]];
    f.tube(h, { sides: 5, bone: 1, ghost: true, param: () => 0.7, zBow: (t) => sg * (0.1 + 0.26 * Math.sin(Math.PI * t * 0.85)), paint: (t) => [0.12, sstep(0.55, 0.95, t), 0], edgeBias: -0.012 });
    f.sheet([1.36, 1.5], [[1.42, 1.5], [1.3, 1.44], [1.22, 1.56], [1.42, 1.5]], { z: sg * 0.14, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 0.7, edge: 0 });
  }
  addEye(f, 1.6, 1.36, 0.118, 0.03, 0.8);
  f.tube([[-1.38, 1.5, 0.05, 0.035], [-1.58, 1.42, 0.04, 0.03], [-1.76, 1.1, 0.035, 0.025], [-1.86, 0.78, 0.06, 0.03], [-1.9, 0.56, 0.02, 0.015]],
    { sides: 5, bone: 2, flat: true, param: (t) => t, paint: () => [0, 1, 0] });
  const F = [0.72, 1.2, 0.58, 0.5], H = [-1.0, 1.22, 0.6, 0.5], L3 = 0.24;
  addLeg(f, 3, F[0], F[1], F[2], F[3], L3, 0.17, 1.2, false, 0.8); addLeg(f, 4, F[0], F[1], F[2], F[3], L3, -0.17, 1.2, false, 0.8);
  addLeg(f, 5, H[0], H[1], H[2], H[3], L3, 0.18, 1.2, true, 0.8); addLeg(f, 6, H[0], H[1], H[2], H[3], L3, -0.18, 1.2, true, 0.8);
  return { ...f.build(), fore: F, hind: H, L3, gait: [1.6, 0.5, 0.05, 0.045], neck: [0.8, 1.38, 0.09, 1.2], height: 2.1, len: 3.4, stride: 8.4 };
}

function buildDeer(rng) {
  const f = new Fig();
  const trunk = [[-1.26, 1.45, 0.05, 0.04], [-1.19, 1.42, 0.2, 0.15], [-0.95, 1.38, 0.34, 0.26], [-0.5, 1.34, 0.36, 0.28], [0, 1.32, 0.38, 0.29],
    [0.45, 1.4, 0.46, 0.3], [0.72, 1.5, 0.5, 0.28], [0.95, 1.42, 0.34, 0.2], [1.08, 1.4, 0.15, 0.1]];
  f.tube(trunk, { sides: 8, bone: 0, paint: (t, ca) => [0.42 + 0.3 * ca, 0.5 * sstep(0.45, 0.8, t) * sstep(0.3, 1, ca), 0] });
  const neck = [[0.72, 1.55, 0.36, 0.18], [1.0, 1.85, 0.22, 0.13], [1.2, 2.12, 0.16, 0.11], [1.3, 2.25, 0.14, 0.1], [1.48, 2.2, 0.12, 0.085], [1.65, 2.1, 0.09, 0.07], [1.76, 2.03, 0.05, 0.045]];
  f.tube(neck, { sides: 8, bone: 1, ghost: true, param: (t) => sstep(0, 0.6, t), paint: (t, ca) => [0.5 + 0.25 * ca, 0.85 * sstep(0.72, 0.98, t) + 0.45 * sstep(0.3, 0, t), 0] });
  addEye(f, 1.42, 2.25, 0.097, 0.028, 1);
  for (const sg of [1, -1]) {
    f.sheet([1.33, 2.4], [[1.3, 2.34], [1.42, 2.36], [1.4 + 0.03 * sg, 2.55], [1.3, 2.34]], { z: sg * 0.08, paint: [0, 1, 0], bone: 1, ghost: true, param: () => 1, edge: 0 });
    // palmate antler (part 2: folded away on hinds): beam + palm with tines, spreading outward in z
    const zf = (x, y) => sg * (0.07 + 0.5 * Math.hypot(x - 1.28, y - 2.34));
    const o = { zf, paint: [0.5, 0.12, 0], bone: 1, part: 2, param: () => 1, edge: 0.16 };
    const ob = { ...o, edge: 0.05 };
    f.sheet([1.15, 2.56], [[1.25, 2.32], [1.34, 2.36], [1.12, 2.8], [0.98, 2.74], [1.25, 2.32]], ob);
    f.sheet([1.36, 2.5], [[1.24, 2.4], [1.3, 2.36], [1.58, 2.66], [1.24, 2.4]], ob);
    const c = [0.72, 3.0], jit = () => (rng() - 0.5) * 0.09;
    const pts = [[1.1, 2.72], [1.14 + jit(), 3.3 + jit()], [0.96, 3.1], [0.86 + jit(), 3.52 + jit()], [0.72, 3.2], [0.52 + jit(), 3.54 + jit()], [0.48, 3.2],
      [0.2 + jit(), 3.44 + jit()], [0.3, 3.1], [-0.06 + jit(), 3.2 + jit()], [0.2, 2.96], [-0.02 + jit(), 2.84 + jit()], [0.42, 2.8], [0.8, 2.74], [1.1, 2.72]];
    f.sheet(c, pts, o);
  }
  f.tube([[-1.2, 1.55, 0.06, 0.04], [-1.34, 1.5, 0.06, 0.035], [-1.44, 1.38, 0.02, 0.015]], { sides: 5, bone: 2, flat: true, param: (t) => t, paint: () => [0, 1, 0] });
  const F = [0.68, 1.38, 0.64, 0.58], H = [-0.9, 1.4, 0.66, 0.58], L3 = 0.25;
  addLeg(f, 3, F[0], F[1], F[2], F[3], L3, 0.14, 0.95, false, 0); addLeg(f, 4, F[0], F[1], F[2], F[3], L3, -0.14, 0.95, false, 0);
  addLeg(f, 5, H[0], H[1], H[2], H[3], L3, 0.15, 0.95, true, 0); addLeg(f, 6, H[0], H[1], H[2], H[3], L3, -0.15, 0.95, true, 0);
  return { ...f.build(), fore: F, hind: H, L3, gait: [1.72, 0.6, 0.085, 0.06], neck: [0.8, 1.6, 0.07, 1.35], height: 2.4, len: 3.0, stride: 9.2 };
}

// ------------------------------------------------------------------------------------------------
// Tracks: every runner owns one row of a float texture (N + 1 samples, read with texelFetch and blended by
// hand): xyz = position, w = distance run. The matching aux row holds (relief 0 painting .. 1 low relief,
// cave 0..1, presence 0..1, dust 0..1). Figures are bent along their row, which is what lets a painting
// follow a curved wall and unroll round the rock edge.
// ------------------------------------------------------------------------------------------------
export const TRACK_GLSL = /* glsl */`
uniform sampler2D uTrack;
uniform float uTrackN, uRows, uClosed;
vec4 rwTrk(float i, float row){ return texelFetch(uTrack, ivec2(int(i + 0.5), int(row + 0.5)), 0); }
void rwTrack(float t, float row, out vec4 P, out vec3 T, out vec4 aux, out float met){
  float tt = uClosed > 0.5 ? fract(t) : clamp(t, 0.0, 1.0);
  float f = tt * uTrackN, i0 = min(floor(f), uTrackN - 1.0), fr = f - i0;
  vec4 a = rwTrk(i0, row), b = rwTrk(i0 + 1.0, row);
  vec4 pm = rwTrk(uClosed > 0.5 ? mod(i0 - 1.0 + uTrackN, uTrackN) : max(i0 - 1.0, 0.0), row);
  vec4 pn = rwTrk(uClosed > 0.5 ? mod(i0 + 2.0, uTrackN) : min(i0 + 2.0, uTrackN), row);
  P = mix(a, b, fr);
  T = mix(b.xyz - pm.xyz, pn.xyz - a.xyz, fr);
  aux = mix(rwTrk(i0, row + uRows), rwTrk(i0 + 1.0, row + uRows), fr);
  met = max((b.w - a.w) * uTrackN, 1e-3);
}
`;

export const FIG_VERT = /* glsl */`
${TRACK_GLSL}
uniform vec3 uSun;
uniform vec4 uFore, uHind, uGaitP, uNeck, uGaitOff, uTail;
uniform float uL3;
attribute vec4 aPaint, aSkin, iA, iB, iC;
attribute float iT;
varying vec3 vW, vN;
varying vec4 vPaint, vAux, vInst;
varying vec2 vUV, vWallUV, vSun2;
varying float vRed;
#include <fog_pars_vertex>
vec2 rwRot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
void main(){
  float row = iA.x, g = iB.x;
  vec4 Pc, auxc; vec3 Tc; float met;
  rwTrack(iT, row, Pc, Tc, auxc, met);
  float sc0 = mix(iA.z, iA.y, auxc.x);
  float lag = g * 0.42 * sc0;
  float t0 = iT - lag / met;
  float gait = (Pc.w - lag) / max(iA.w, 0.5) + iC.x - g * 0.08;
  float cyc = gait * 6.2831853;
  float bob = uGaitP.z * cos(cyc - 5.4), pit = uGaitP.w * cos(cyc - 0.94);
  vec2 C = vec2(0.0, uNeck.w);
  float bone = aSkin.x;
  vec2 p = position.xy, n2 = normal.xy;
  if (bone < 2.5) {
    float ang = pit;
    if (bone > 1.5) {
      float t = aSkin.y;
      p.y += t * t * (uTail.x + uTail.y * sin(cyc * 2.0 - t * 3.0));
      p.x += t * t * uTail.w * sin(cyc - t * 2.0) - t * uTail.z;
    } else if (bone > 0.5) {
      float nod = -uNeck.z * cos(cyc - 2.2) * aSkin.y;
      p = uNeck.xy + rwRot(p - uNeck.xy, nod); ang += nod;
    }
    p = C + rwRot(p - C, pit) + vec2(0.0, bob);
    n2 = rwRot(n2, ang);
  } else {
    float li = bone - 3.0;
    bool hindL = li > 1.5;
    vec4 G = hindL ? uHind : uFore;
    float off = li < 0.5 ? uGaitOff.x : (li < 1.5 ? uGaitOff.y : (li < 2.5 ? uGaitOff.z : uGaitOff.w));
    float ph = fract(gait + off);
    float Ls = uGaitP.x, duty = clamp(Ls * sc0 / max(iA.w, 0.5), 0.08, 0.6);
    vec2 Ft; float flex = 0.0;
    if (ph < duty) { Ft = vec2(Ls * (0.5 - ph / duty), 0.0); }
    else {
      float q = (ph - duty) / (1.0 - duty), e = q * q * (3.0 - 2.0 * q), sq = sin(q * 3.14159265);
      Ft = vec2(Ls * (-0.5 + e) - 0.2 * Ls * sq * (1.0 - q), uGaitP.y * (hindL ? 0.8 : 1.0) * sq);
      flex = 1.25 * sin(3.14159265 * min(q * 1.5, 1.0));
    }
    Ft.x += G.x + (hindL ? 0.10 : 0.04);
    vec2 H = C + rwRot(G.xy - C, pit) + vec2(0.0, bob);
    float La = G.z, Lb = G.w + uL3;
    vec2 d = Ft - H; float dl = max(length(d), 1e-3); vec2 dn = d / dl;
    float st = clamp(dl / (La + Lb), 1.0, 1.16);
    float la = La * st, lb = Lb * st;
    float dc = clamp(dl, abs(la - lb) + 0.02, (la + lb) * 0.999);
    float a = (la * la - lb * lb + dc * dc) / (2.0 * dc), hh = sqrt(max(la * la - a * a, 0.0));
    vec2 K = H + dn * a + vec2(-dn.y, dn.x) * hh * (hindL ? -1.0 : 1.0);
    vec2 E = H + dn * dc;
    vec2 d1 = (K - H) / la, d2 = (E - K) / lb;
    float l = aSkin.y * st, lf = la + G.w * st;
    vec2 q2 = l < la ? H + d1 * l : K + d2 * (l - la);
    vec2 dir = normalize(mix(d1, d2, smoothstep(la - 0.1, la + 0.1, l)) + vec2(0.0, -1e-4));
    if (l > lf) {
      float fa = -flex * smoothstep(lf, lf + 0.06, l);
      dir = rwRot(d2, fa);
      q2 = K + d2 * (lf - la) + dir * (l - lf);
    }
    vec2 pp = vec2(-dir.y, dir.x);
    p = q2 + pp * aSkin.z;
    n2 = pp * normal.x - dir * normal.y;
  }
  vec4 Pv, aux; vec3 Tv; float m2;
  rwTrack(t0 + p.x * sc0 / met, row, Pv, Tv, aux, m2);
  float rel = aux.x;
  float sc = mix(iA.z, iA.y, rel);
  float thick = mix(0.03, 0.34, rel) * (g > 0.5 ? 0.5 : 1.0);
  vec3 Th = normalize(vec3(Tv.x, 0.0, Tv.z) + vec3(1e-5, 0.0, 0.0));
  vec3 Tn = normalize(Tv + vec3(1e-5, 0.0, 0.0));
  vec3 side = vec3(-Th.z, 0.0, Th.x);
  vec3 lp = Pv.xyz + vec3(0.0, p.y * sc, 0.0) + side * (position.z * sc * thick + iC.z * (1.0 - rel));
  vec3 ln = Tn * n2.x + vec3(0.0, n2.y, 0.0) + side * (normal.z * min(thick * 3.0, 1.0) + 1e-4);
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * ln);
  vPaint = aPaint; vAux = aux; vInst = vec4(g, iB.y, iB.z, iC.y);
  vUV = position.xy * iA.y + vec2(iC.y * 17.0, iC.y * 9.0);
  vWallUV = vec2(Pv.w, lp.y);
  vSun2 = vec2(dot(uSun, Tn), uSun.y);
  vRed = iC.w;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  if (aSkin.w > 1.5 && iB.w < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}
`;

export const FIG_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec3 vW, vN;
varying vec4 vPaint, vAux, vInst;
varying vec2 vUV, vWallUV, vSun2;
varying float vRed;
#include <fog_pars_fragment>
void main(){
  float rel = vAux.x, g = vInst.x;
  // every lookup and derivative comes before the first discard
  vec4 gr = mix(rwGrain2(vWallUV), rwGrain2(vUV), rel);
  float fr = floor(uTime * 8.0);
  float wob = texture2D(uGrain, vUV * 0.19 + vec2(fract(fr * 0.3713), fract(fr * 0.7391))).b;
  float hs = rwGrain2(mix(vWallUV, vUV, step(0.5, rel)) + vSun2 * 0.02).r;
  float hatchT = texture2D(uGrain, vec2(vUV.x * 0.13 + vUV.y * 0.9, vUV.y * 0.05 - vUV.x * 0.02)).b;
  float fw = max(fwidth(vPaint.w), 1e-4);
  float h = gr.r, pres = vAux.z;
  if (pres < 0.02 || (pres < 0.99 && gr.g * 0.75 + h * 0.25 > pres)) discard;
  // the charcoal contour, redrawn eight times a second: only its position changes
  float lw = max(0.036 + 0.034 * (wob - 0.5), 1.6 * fw);
  float line = 1.0 - smoothstep(lw - fw * 0.7, lw + fw * 0.7, vPaint.w);
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 rock = rwRock(h, gr.g), col = rock;
  vec3 lineCol = mix(uChar, uRed * 0.8, vRed);
  float dist = distance(vW, cameraPosition);
  lineCol *= 1.0 - 0.2 * uEngr * smoothstep(9.0, 22.0, dist);   // engraved: the nearest animal carries the brightest line, the ones behind it are scraped fainter
  float covered = 0.0;
  if (g > 0.5) {
    float keep = max(line, vPaint.y * 0.85 * (1.0 - 0.8 * uEngr)) * (0.86 - 0.12 * g) * (1.0 - 0.45 * uEngr);
    if (rwDab(keep, h, 0.05) < 0.5) discard;
    col = mix(col, lineCol, 0.88); covered = 1.0;
  } else {
    float och = vPaint.x * vInst.y;
    col = mix(col, uOchre * (0.6 + 0.32 * h), rwDab(och + (gr.g - 0.5) * 0.25, h, 0.14) * 0.9);
    float sh = smoothstep(0.3, -0.6, dot(n, uSun)) * rel;
    col = mix(col, uShade, rwDab(sh * 0.82 + (gr.b - 0.5) * 0.3, h, 0.22) * 0.6);
    float fill = max(vPaint.y, vInst.z * (0.62 + 0.3 * gr.g + 0.25 * step(0.8, vInst.z) * (1.0 - uEngr)));   // a black animal is laid on solid: no rock flecks through the stallion at arm's length
    // engraved (night): a filled animal is one unbroken body of dark clay (no dry-brush breaks, no hatching inside it) with
    // its mane, tail and muzzle scraped pale like the contour; the washed animals keep their hatching
    float solid = uEngr * smoothstep(0.4, 0.6, vInst.z);
    float cc = max(mix(rwDab(fill, h, 0.1), smoothstep(0.3, 0.4, fill), solid), rwDab(line, h, 0.12));
    vec3 fillCol = mix(uChar, mix(uRock * 0.42, lineCol * 0.92, smoothstep(0.86, 0.97, vPaint.y)), uEngr);
    float hatch = smoothstep(0.77, 0.83, hatchT) * uEngr * smoothstep(0.05, 0.12, vPaint.w) * (1.0 - solid);
    col = mix(col, mix(fillCol, lineCol, step(fill, line)), cc * 0.95); covered = cc;
    col = mix(col, lineCol, rwDab(hatch * 0.8, h, 0.1) * 0.6);
  }
  col *= 1.0 + rwRake(h, hs) * 0.85;
  col += rwSpark(gr, vW) * 0.4 * (1.0 - covered);
  col = mix(rock, col, mix(1.0, 0.35, smoothstep(0.0, uFade, dist)));
  col = rwCave(col, vW, vAux.y * uGlim);   // uGlim < 1: the pigment glimmers a little beyond the torch pool
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

// ------------------------------------------------------------------------------------------------
// Rock: the shelter wall, its fallen blocks and the ground apron. aRock = (frieze band, cave shade, ground, arc metres)
// ------------------------------------------------------------------------------------------------
const ROCK_VERT = /* glsl */`
attribute vec4 aRock;
varying vec3 vW, vN, vL;
varying vec4 vRock;
#include <fog_pars_vertex>
void main(){
  vL = position; vRock = aRock;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-5, 0.0));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const ROCK_FRAG = /* glsl */`
${PIGMENT_GLSL}
uniform vec4 uRing;
varying vec3 vW, vN, vL;
varying vec4 vRock;
#include <fog_pars_fragment>
float rwHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
vec4 rwTri(vec3 p, vec3 w){ return rwGrain2(p.zy) * w.x + rwGrain2(p.xz) * w.y + rwGrain2(p.xy) * w.z; }
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 w = abs(n); w *= w; w /= (w.x + w.y + w.z + 1e-4);
  vec4 gr = rwTri(vL, w);
  float h = gr.r, hs = rwTri(vL + uSun * 0.022, w).r;
  vec2 wu = vec2(vRock.w, vL.y);
  // every lookup happens before any branch
  float bed = texture2D(uGrain, vec2(vL.y * 0.13 + gr.g * 0.1, 0.31 + vRock.w * 0.004)).b;
  float zone = texture2D(uGrain, wu * 0.021 + 0.5).g;
  float zone2 = texture2D(uGrain, wu * 0.017 + vec2(0.13, 0.71)).g;
  float wipe = texture2D(uGrain, vec2(wu.x * 0.31, wu.y * 0.035) + 0.2).b;
  float field = texture2D(uGrain, vL.xz * 0.011).g;
  float gate = texture2D(uGrain, vec2(wu.x * 0.043, wu.y * 0.37) + 0.6).b;
  vec3 col = rwRock(h, gr.g);
  float fz = vRock.x, gz = vRock.z;
  // ochre staining along the beds
  col = mix(col, uOchre * 0.85, rwDab(bed * 0.75 * (1.0 - gz), h, 0.22) * 0.3);
  // drawn shade: a charcoal smudge on faces turned from the sun, and under the overhang
  float sh = max(smoothstep(0.12, -0.6, dot(n, uSun)), vRock.y * 0.75) * (1.0 - gz);
  col = mix(col, uShade, rwDab(sh * 0.8 + (gr.b - 0.5) * 0.35, h, 0.25) * 0.52);
  // bedding: wavering charcoal lines along the strata, each with a little shade beneath it
  float by = vL.y / 1.3 + (zone - 0.5) * 1.7 + vRock.w * 0.012;
  float bl = abs(fract(by) - 0.5), rockOnly = (1.0 - gz) * (1.0 - fz) * step(0.5, vRock.w);
  float crack = (1.0 - smoothstep(0.02, 0.07, bl)) * smoothstep(0.38, 0.6, gate) * rockOnly;
  col = mix(col, uChar * 1.5, rwDab(crack * 0.9, h, 0.14) * 0.7);
  col = mix(col, uShade, rwDab(smoothstep(0.5, 0.2, fract(by + 0.5)) * 0.42 * rockOnly, h, 0.25) * 0.3);
  // the painted wall: palm-dot panels, hand stencils, torch wipes
  if (fz > 0.01) {
    vec2 c = wu / 0.3, id = floor(c), f = fract(c) - 0.5;
    float hd = rwHash(id);
    float dotm = (1.0 - smoothstep(0.24, 0.33, length(f + (vec2(hd, fract(hd * 7.3)) - 0.5) * 0.25))) * step(0.42, hd);
    float red = dotm * smoothstep(0.73, 0.78, zone) * step(fract(hd * 9.1), 0.82);
    vec2 c2 = (wu + vec2(0.0, 0.3)) / vec2(1.05, 0.85), id2 = floor(c2), f2 = (fract(c2) - 0.5) * vec2(1.05, 0.85);
    float hh = rwHash(id2 + 17.0);
    float ha = (hh - 0.5) * 1.1;
    vec2 hp = vec2(f2.x * cos(ha) - f2.y * sin(ha), f2.x * sin(ha) + f2.y * cos(ha)) / 0.36;
    hp.x *= fract(hh * 5.7) > 0.5 ? 1.0 : -1.0;
    float d = rwHand(hp);
    float hand = step(0.0, d) * (1.0 - smoothstep(0.02, 0.5 + 0.1 * sin(uTime * 1.7 + hh * 40.0), d)) * step(hh, 0.6)
      * smoothstep(0.52, 0.6, zone2) * step(1.0, id2.y) * step(id2.y, 3.0);
    red = max(red, hand * (0.55 + 0.6 * gr.a));
    col = mix(col, uRed, rwDab(red * fz, h, 0.16) * 0.88);
    col = mix(col, uChar * 1.6, rwDab(smoothstep(0.78, 0.98, wipe) * 0.6 * fz, h, 0.2) * 0.45);
  }
  // the ground: grass signs (charcoal and ochre dashes) and the red churn of the hoof ring
  if (gz > 0.5) {
    vec2 c = vL.xz / 0.55, id = floor(c), f = fract(c) - 0.5;
    float hd = rwHash(id), ang = (hd - 0.5) * 1.6 + 0.6;
    vec2 dv = vec2(cos(ang), sin(ang)) * 0.3, o = (vec2(fract(hd * 13.7), fract(hd * 5.1)) - 0.5) * 0.3;
    float dash = 1.0 - smoothstep(0.022, 0.05, rwSeg(f, o - dv, o + dv, 0.0));
    float rr = length(vL.xz);
    float keepOut = smoothstep(uRing.x - 3.0, uRing.x, rr) * (1.0 - smoothstep(uRing.y, uRing.y + 3.0, rr)) * uRing.z;
    dash *= step(0.35 + 0.4 * (1.0 - field), hd) * (1.0 - keepOut);
    col = mix(col, mix(uChar * 1.3, uOchre * 0.9, step(0.6, fract(hd * 3.3))), rwDab(dash * 0.9, h, 0.15) * 0.85);
    col = mix(col, uRed, rwDab(keepOut * (0.1 + 0.5 * gr.b) * (0.45 + 0.6 * field), h, 0.1) * 0.34);
  }
  col *= 1.0 + rwRake(h, hs);
  col += rwSpark(gr, vW);
  col = rwCave(col, vW, vRock.y);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

// one closed rock mass along an arc: inner face exactly on radius Rw (the frieze), overhang, rugged crown and back
function buildShelter(noise, rng, Rw, aHi, aLo, segs, arcBase) {
  // [radial offset from the painted face, height, frieze, drawn shade, roughness, paint on the back]
  const base = [[0, -0.4, 1, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 1.5, 1, 0, 0, 0], [0, 3, 1, 0, 0, 0], [0, 4.5, 1, 0, 0, 0], [0, 6, 1, 0, 0, 0],
    [-0.45, 6.9, 0, 0.8, 0.3, 0], [-1.7, 7.6, 0, 0.8, 0.7, 0], [-2.5, 8.3, 0, 0.5, 1, 0], [-1.7, 9.3, 0, 0, 1, 0], [0.2, 9.9, 0, 0, 1, 0], [0.9, 10.4, 0, 0.4, 1.1, 0],
    [0.7, 12.3, 0, 0, 1.1, 0], [1.4, 13.7, 0, 0, 1.1, 0], [2.7, 14.7, 0, 0, 1.1, 0], [4.3, 14.1, 0, 0, 1.1, 0], [5.4, 11.4, 0, 0, 1.1, 0], [6.2, 10.3, 0, 0, 1.1, 0],
    [6.8, 6.8, 0, 0, 0.9, 0.7], [7.6, 3.2, 0, 0, 0.8, 0.7], [8.6, -0.4, 0, 0, 0.5, 0]];
  const prof = [];
  for (let j = 0; j < base.length; j++) {
    prof.push(base[j]);
    const a = base[j], b = base[j + 1];
    if (b && !(a[2] && b[2])) prof.push(a.map((v, k) => (k === 2 ? 0 : (v + b[k]) / 2)));
  }
  const NP = prof.length, pos = [], rock = [], idx = [];
  const ph = rng() * 50;
  for (let i = 0; i <= segs; i++) {
    const b = lerp(aHi, aLo, i / segs), dEnd = Math.min(aHi - b, b - aLo), endK = sstep(0, 0.3, dEnd);
    const crown = 0.55 + 0.45 * noise.fbm2(b * 2.2 + ph, 3.1, 3) + 0.35 * Math.sin(b * 2.3 + ph);
    for (let j = 0; j < NP; j++) {
      const [dr0, y0, fr, cv, nzk, bp] = prof[j];
      let dr = dr0 > 0 ? dr0 * (0.22 + 0.78 * endK) : dr0 * (0.3 + 0.7 * endK);
      let y = y0 > 6 ? 6 + (y0 - 6) * (0.3 + 0.7 * endK) * clamp(0.75 + 0.5 * crown, 0.5, 1.4) : y0;
      if (!fr) {
        const n1 = noise.fbm3(b * 9 + ph, y * 0.35, dr * 0.3, 3), n2 = noise.n3(b * 31, y * 1.1 + 4, dr);
        const nr = 1 - Math.abs(noise.n3(b * 15 + ph, y * 0.45, 7 + dr * 0.25));
        dr += (n1 * 1.0 + n2 * 0.3 + (nr - 0.62) * 1.1) * nzk * (0.5 + 0.5 * endK);
        if (y0 > 0) y += n1 * 0.5 * Math.min(nzk, 1);
      }
      const r = Rw + dr;
      pos.push(Math.sin(b) * r, y, Math.cos(b) * r);
      const cave = fr ? 0.16 + 0.5 * sstep(1.5, 6, y) : cv;
      rock.push(fr && y0 >= 0 ? 1 : bp * endK, cave * sstep(0, 0.16, dEnd), 0, (aHi - b) * Rw + arcBase);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < NP - 1; j++) {
    const a = i * NP + j, b = a + 1, c = a + NP, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  for (const [i, flip] of [[0, false], [segs, true]]) {   // end faces
    let cx = 0, cy = 0, cz = 0; for (let j = 0; j < NP; j++) { const k = (i * NP + j) * 3; cx += pos[k]; cy += pos[k + 1]; cz += pos[k + 2]; }
    const cv = pos.length / 3; pos.push(cx / NP, cy / NP * 0.8, cz / NP); rock.push(0, 0, 0, 0);
    const base = pos.length / 3;
    for (let j = 0; j < NP; j++) { const k = (i * NP + j) * 3; pos.push(pos[k], pos[k + 1], pos[k + 2]); rock.push(0, 0, 0, 0); }
    const bb = i === 0 ? aHi : aLo, ox = Math.cos(bb) * (flip ? -1 : 1), oz = -Math.sin(bb) * (flip ? -1 : 1);
    const q = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]], A = q(cv), B = q(base + 2), Cc = q(base + 3);
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], nz = e1[0] * e2[1] - e1[1] * e2[0], ok = nx * ox + nz * oz > 0;
    for (let j = 0; j < NP - 1; j++) { if (ok) idx.push(cv, base + j, base + j + 1); else idx.push(cv, base + j + 1, base + j); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 4));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildBoulder(noise, x, y, z, r, seed) {
  const g0 = new THREE.IcosahedronGeometry(1, 2); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
  const g = mergeVertices(g0, 1e-4), p = g.attributes.position, rock = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const k = r * (0.72 + 0.34 * noise.fbm3(vx * 1.3 + seed, vy * 1.3, vz * 1.3, 3) + 0.1 * Math.sign(vx) * Math.abs(vx) ** 3);
    p.setXYZ(i, x + vx * k * 1.25, y + vy * k * 0.78, z + vz * k);
  }
  g.setAttribute('aRock', new THREE.BufferAttribute(rock, 4));
  g.computeVertexNormals();
  return g;
}

function buildGround(noise, flatR, maxR) {
  const radii = [0, 5, 10, 15, 20, 25, 30, 36, 46, 62, 90, 130, 200, 290, maxR], S = 56, pos = [], rock = [], idx = [];
  for (let i = 0; i < radii.length; i++) for (let k = 0; k < S; k++) {
    const r = radii[i], a = (k / S) * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r;
    const y = sstep(flatR, flatR + 60, r) * (noise.fbm2(x * 0.012, z * 0.012, 3) * 9 - 2.5) - 0.02;
    pos.push(x, y, z); rock.push(0, 0, 1, 0);
  }
  for (let i = 0; i < radii.length - 1; i++) for (let k = 0; k < S; k++) {
    const a = i * S + k, b = i * S + (k + 1) % S, c = a + S, d = b + S;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 4));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function mergeRock(list) {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), rock = new Float32Array(nv * 4), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3); nrm.set(g.attributes.normal.array, vo * 3); rock.set(g.attributes.aRock.array, vo * 4);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo;
    vo += g.attributes.position.count; io += ia.length; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('aRock', new THREE.BufferAttribute(rock, 4)); out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

// ------------------------------------------------------------------------------------------------
// Signs that follow the runners: the smudge of shade under each animal (kind 0) and its red hoof dust
// (kind 1..5: dabs born at a fixed point of the track, so they stay put while the animal runs on).
// ------------------------------------------------------------------------------------------------
const SIGN_VERT = /* glsl */`
${TRACK_GLSL}
uniform vec3 uSun;
uniform float uShLen;
attribute vec4 iD;
attribute float iT;
varying vec2 vQ;
varying vec4 vS;
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec4 Pc, auxc; vec3 Tc; float met;
  rwTrack(iT, iD.x, Pc, Tc, auxc, met);
  vec4 wp; float vis, age = 0.0;
  if (iD.y < 0.5) {
    vec3 Th = normalize(vec3(Tc.x, 0.0, Tc.z) + vec3(1e-5, 0.0, 0.0));
    vec3 side = vec3(-Th.z, 0.0, Th.x);
    vec3 sd = normalize(vec3(-uSun.x, 0.0, -uSun.z) + vec3(1e-5, 0.0, 0.0));
    float lk = step(1.5, uShLen);
    vec3 ax = normalize(mix(Th, sd, lk)), ay = vec3(-ax.z, 0.0, ax.x);
    vec3 lp = Pc.xyz + vec3(-uSun.x, 0.0, -uSun.z) * (0.8 * iD.z * mix(1.0, uShLen * 1.5, lk)) + ax * (position.x * 1.7 * iD.z * mix(1.0, uShLen, lk)) + ay * (position.y * 0.75 * iD.z);
    lp.y = Pc.y + 0.05;
    wp = modelMatrix * vec4(lp, 1.0);
    vis = auxc.w * step(0.5, auxc.x);
  } else {
    float span = 11.0;
    age = fract((Pc.w + (iD.y - 1.0) * span / 5.0) / span + iD.w);
    vec4 Pb, auxb; vec3 Tb; float mb;
    rwTrack(iT - (age * span + 0.8 * iD.z) / met, iD.x, Pb, Tb, auxb, mb);
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float sz = iD.z * (0.3 + 0.9 * age);
    wp = modelMatrix * vec4(Pb.xyz + vec3(0.0, (0.12 + 0.75 * age) * iD.z, 0.0), 1.0);
    wp.xyz += (cr * position.x + cu * position.y) * sz;
    vis = (1.0 - age) * auxb.w;
  }
  vQ = position.xy; vS = vec4(iD.y, vis, iD.w, age); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  if (vis < 0.03) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}
`;
const SIGN_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec2 vQ;
varying vec4 vS;
varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec4 gn = texture2D(uGrain, vQ * 0.23 + vS.z * vec2(3.7, 1.3));
  vec4 gw = rwGrain2(vW.xz);
  float st = texture2D(uGrain, vQ * 0.05 + vS.z * vec2(5.1, 2.9) + vec2(0.0, vS.w * 0.03)).a;
  float r = length(vQ);
  vec3 col;
  if (vS.x < 0.5) {
    float d = rwDab((1.0 - r * r) * vS.y * 0.9 + (gn.b - 0.5) * 0.4, gw.r, 0.2);
    if (d < 0.4) discard;
    col = mix(rwRock(gw.r, gw.g), uShade, 0.56 * d);
  } else {
    float v = (1.0 - r) * vS.y;
    if (st + (gn.r - 0.5) * 0.3 < 1.03 - 0.74 * v) discard;
    col = mix(rwRock(gw.r, gw.g), uRed * 0.78, 0.86);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

const FLAME_VERT = /* glsl */`
uniform vec3 uFlamePos;
uniform float uFlameSize, uTime;
attribute vec4 iF;
varying vec2 vQ;
varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(uFlamePos, 1.0);
  float age = 0.0;
  if (iF.x < 0.5) {
    vec3 cr = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
    wp.xyz += cr * (position.x * uFlameSize * 0.8) + vec3(0.0, position.y * uFlameSize * 1.7, 0.0);
  } else {   // charcoal smoke: dabs that rise, spread and thin
    age = fract(uTime * 0.05 + iF.y);
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    wp.xyz += vec3(sin(iF.y * 40.0 + age * 5.0) * 0.8 * age + 2.6 * age * age, 1.5 + 21.0 * age, cos(iF.y * 31.0 + age * 4.0) * 0.8 * age) * uFlameSize;
    wp.xyz += (cr * (position.x * 2.0) + cu * (position.y * 2.0 - 1.0)) * (0.45 + 2.5 * age) * uFlameSize;
  }
  vQ = position.xy + vec2(0.5, 0.0); vK = vec3(iF.x, iF.y, age);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FLAME_FRAG = /* glsl */`
${PIGMENT_GLSL}
varying vec2 vQ;
varying vec3 vK;
#include <fog_pars_fragment>
void main(){
  float n = texture2D(uGrain, vec2(vQ.x * 0.22 + 0.3, vQ.y * 0.17 - uTime * 0.5)).b;
  float n2 = texture2D(uGrain, vec2(vQ.x * 0.45, vQ.y * 0.38 - uTime * 1.05)).r;
  vec4 sm = texture2D(uGrain, (vQ - 0.5) * 0.12 + vK.y * vec2(3.1, 7.7));
  vec3 col;
  if (vK.x < 0.5) {
    float w = 1.0 - vQ.y;
    float shape = w * (1.0 - smoothstep(0.0, 0.42 * w + 0.07, abs(vQ.x - 0.5 + (n - 0.5) * 0.5 * vQ.y)));
    float v = shape * 1.5 + (n2 - 0.5) * 0.65;
    if (v < 0.4) discard;
    col = mix(uRed * 3.0, uOchre * 6.5, smoothstep(0.4, 0.85, v));
    col = mix(col, uPale * 7.5, smoothstep(0.95, 1.35, v)) * uTorch.w;
  } else {
    vec2 q = (vQ - 0.5) * 2.0;
    float v = (1.0 - length(q)) * (1.0 - vK.z) * smoothstep(0.0, 0.06, vK.z);
    if (sm.a * 0.55 + sm.b * 0.45 < 0.94 - 0.85 * v) discard;
    col = uChar * (2.0 + 1.6 * sm.r);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

// ---- baking tracks ---------------------------------------------------------------------------------
// fn(k / N) -> [x, y, z, relief, cave, presence, dust]; returns the length run
export function bakeRow(data, W, rows, row, fn) {
  const N = W - 1; let D = 0, px = 0, py = 0, pz = 0;
  for (let k = 0; k <= N; k++) {
    const s = fn(k / N), o = (row * W + k) * 4, a = ((row + rows) * W + k) * 4;
    if (k > 0) D += Math.hypot(s[0] - px, s[1] - py, s[2] - pz);
    px = s[0]; py = s[1]; pz = s[2];
    data[o] = s[0]; data[o + 1] = s[1]; data[o + 2] = s[2]; data[o + 3] = D;
    data[a] = s[3]; data[a + 1] = s[4]; data[a + 2] = s[5]; data[a + 3] = s[6];
  }
  return D;
}

// the carousel of the stand-alone piece: along the shelter wall as paint, off its east edge, round the
// open ground as low relief, and back into the rock at the west edge
function ringSample(t, o) {
  const a = o.a0 - TAU * t;
  const g = (t - o.g0) / (o.g1 - o.g0), gs = g > 0 && g < 1 ? Math.sin(Math.PI * g) : 0;
  const onWall = t < o.tIn ? sstep(o.tIn - 0.12, o.tIn, t) : 1 - sstep(o.tOut, o.tOut + 0.12, t);
  const lane = o.laneR + o.wob * Math.sin(a * 3 + o.ph) + o.wob * 0.5 * Math.sin(a * 7 + o.ph * 2.3);
  const r = lerp(lane, o.Rw - o.off, onWall) - 0.7 * gs;
  const up = t < o.tIn ? sstep(o.tIn - 0.075, o.tIn - 0.004, t) : 1 - sstep(o.tOut + 0.004, o.tOut + 0.08, t);
  const y = o.wallY * up + 0.55 * Math.sin(Math.PI * up) * Math.min(o.wallY, 1) + 0.75 * gs;
  let rel = t < o.tIn ? 1 - sstep(o.tIn - 0.03, o.tIn + 0.003, t) : sstep(o.tOut - 0.003, o.tOut + 0.03, t);
  rel = Math.max(rel, sstep(o.g0 - 0.004, o.g0 + 0.014, t) * (1 - sstep(o.g1 - 0.014, o.g1 + 0.004, t)));
  const inWall = sstep(o.tIn - 0.01, o.tIn + 0.05, t) * (1 - sstep(o.tOut - 0.05, o.tOut + 0.01, t)) * (1 - sstep(o.g0 - 0.03, o.g0, t) * (1 - sstep(o.g1, o.g1 + 0.03, t)));
  return [Math.sin(a) * r, y, Math.cos(a) * r, rel, 0.62 * inWall, 1, rel * (1 - sstep(0, 0.12, y))];
}

function instanced(base, n, arrays) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in arrays) {
    const a = new THREE.InstancedBufferAttribute(arrays[k], k === 'iT' ? 1 : 4);
    if (k === 'iT') a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute(k, a);
  }
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('running-wall') : ctx.rng, noise = ctx.noise;
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE;
  const detail = ctx.quality?.detail ?? 1;
  const hour = opts.hour || 'morning', weather = opts.weather || 'clear';
  const group = new THREE.Group(); group.name = 'running-wall-hero';
  const ownGrain = !opts.grainTexture, grain = opts.grainTexture || await makeGrainTexture(rng.fork('grain'), ctx);
  const U = pigmentUniforms(pal, grain);
  if (hour === 'golden') {
    U.uRock.value.lerp(new THREE.Color(pal[4]), 0.34); U.uPale.value.lerp(new THREE.Color(pal[4]), 0.2); U.uShLen.value = 2.6;
    U.uShade.value.lerp(new THREE.Color(pal[5]), 0.22).multiplyScalar(0.85);
    U.uSun.value.set(-0.74, 0.3, 0.6).normalize();
  } else if (hour === 'night') {   // the engraved look: a brown clay film, figures scraped out pale
    const clay = new THREE.Color(pal[2]), pale = new THREE.Color(pal[1]);
    U.uRock.value.copy(clay).multiplyScalar(0.27); U.uPale.value.copy(clay).multiplyScalar(0.4); U.uShade.value.copy(clay).multiplyScalar(0.07);
    U.uChar.value.copy(pale).multiplyScalar(0.34); U.uOchre.value.copy(clay).lerp(pale, 0.3).multiplyScalar(0.7);
    U.uRed.value.lerp(clay, 0.5).multiplyScalar(0.8); U.uSun.value.set(-0.6, 0.5, 0.62).normalize(); U.uEngr.value = 1;
  }
  if (weather === 'loess') U.uFade.value = 420; else if (weather === 'snow') U.uSnow.value = 1;
  if (opts.sunDir) U.uSun.value.fromArray(opts.sunDir).normalize();
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  await ctx.yield?.();

  const species = [];
  species.push(buildHorse(rng.fork('horse'))); await ctx.yield?.();
  species.push(buildAurochs(rng.fork('aurochs'))); await ctx.yield?.();
  species.push(buildDeer(rng.fork('deer'))); await ctx.yield?.();
  species.push(...(opts.species || []));
  const escSp = clamp(Math.round(opts.escort ?? 0), 0, species.length - 1), laneFn = opts.laneFn || null;
  await ctx.yield?.();

  // ---- cast and tracks -------------------------------------------------------------------------
  const path = opts.path || null, pathMode = !!path;
  const animals = [];
  const coat = (sp, r) => {
    if (sp > 2) return species[sp].coat ? species[sp].coat(r) : { ochre: 0.7, fill: 0, red: 0, antler: 1 };
    if (sp === 1) return { ochre: 0.6, fill: 0.72 + 0.2 * r(), red: 0, antler: 1 };
    if (sp === 2) return { ochre: 0.8 + 0.3 * r(), fill: 0, red: r() < 0.25 ? 1 : 0, antler: r() < 0.55 ? 1 : 0 };
    const k = r();
    return k < 0.16 ? { ochre: 0.35, fill: 0.66 + 0.2 * r(), red: 0, antler: 1 } : { ochre: 0.72 + 0.42 * r(), fill: 0, red: k > 0.9 ? 1 : 0, antler: 1 };
  };
  const N = pathMode ? 1024 : 256, W = N + 1;
  // stand-alone layout (degrees of azimuth, 0 = +Z, 90 = +X): the runners lap clockwise seen from above. Wall B
  // 292..214, a gap they leap 214..188, wall A 188..135, the peel edge at 135, open ground back round to 292.
  const Rw = 19, DEG = Math.PI / 180, A0 = 28.5 * DEG, tOf = (deg) => (388.5 - deg) / 360;
  const RING = { a0: A0, tIn: tOf(292), g0: tOf(214), g1: tOf(188), tOut: tOf(135) }, wallSpeed = opts.speed ?? 15;
  let L = 0, dM = 0, span = 1, lapT = 1, eye = 2.3, halfW = null; const nEsc = species.map(() => 0);
  if (!pathMode) {
    const cnt = [opts.horses ?? Math.round((28 + rng() * 8) * (0.6 + 0.4 * detail)), opts.aurochs ?? rng.int(4, 7), opts.deer ?? rng.int(3, 5)];
    for (let sp = 0; sp < 3; sp++) for (let i = 0; i < cnt[sp]; i++) animals.push({ sp });
    rng.shuffle(animals);
    const n = animals.length, laneOrder = rng.shuffle(animals.map((_, i) => i));
    animals.forEach((an, i) => {
      const S = species[an.sp], hp = rng.range(1.1, 2.4) * (an.sp === 2 ? 1.1 : 1);
      Object.assign(an, coat(an.sp, rng), {
        row: i, scale: rng.range(0.93, 1.08), scaleWall: hp / S.height, wallY: rng.range(0.3, Math.max(0.4, 5.5 - hp)),
        laneR: 10.6 + 7.6 * ((laneOrder[i] + 0.5) / n), wob: rng.range(0.25, 0.7), ph: rng() * TAU, off: 0.045 + i * 0.0012,
        phase: (i + rng() * 0.7) / n, gaitPh: rng(), seed: rng(), Rw, ...RING,
      });
    });
    lapT = TAU * Rw / wallSpeed;
  } else {
    L = path.length; eye = opts.eye ?? 2.3; dM = (opts.mouthU ?? 0.13) * L; span = L + 80;
    const cave = { hallHalf: 16, galleryHalf: 4.5, mouthHalf: 7, hallLen: 30, flare: 14, ...(opts.cave || {}) };
    halfW = (d) => lerp(lerp(cave.hallHalf, cave.galleryHalf, sstep(cave.hallLen - 2, cave.hallLen + 12, d)), lerp(cave.mouthHalf, cave.finHalf ?? cave.mouthHalf, sstep(dM, dM + (cave.finLen ?? 30), d)), sstep(dM - cave.flare, dM, d));
    const nH = Math.round(opts.horses ?? 40), nF = Math.round((opts.frieze ?? 34) * (0.6 + 0.4 * detail));
    for (let i = 0; i < nH; i++) {   // escorts: horses that run with the camera; number 0 is the stallion
      const lane = i === 0 ? 11 : 6 + 34 * Math.pow((i - 0.5 + rng() * 0.6) / nH, 1.25), side = i === 0 ? 1 : (rng() < 0.55 ? 1 : -1);
      const hp = rng.range(1.2, 2.3);
      animals.push({ sp: i === 0 ? 0 : escSp, ...coat(i === 0 ? 0 : escSp, rng), lane, side, along: i === 0 ? 5 : rng.range(-0.5 * lane - 6, Math.min(1.25 * lane + 4, 58)),
        weave: i === 0 ? 0.6 : rng.range(0.8, 2.6), ph: rng() * TAU, wand: i === 0 ? 1 : rng.range(1, 3), wr: rng.range(0.15, 0.3),
        close: i === 0 ? { lat: opts.stallionLat ?? 5, from: 0.22, to: 0.4 } : null,
        scale: i === 0 ? (opts.stallionScale ?? 1.1) : rng.range(0.92, 1.07), scaleWall: hp / species[i === 0 ? 0 : escSp].height, wallY: rng.range(0.3, Math.max(0.4, 4.6 - hp)),
        off: 0.045 + i * 0.001, gaitPh: rng(), seed: rng(), dEnd: span, loop: false });
    }
    animals[0].ochre = 0.3; animals[0].fill = 0.82; animals[0].red = 0;
    if (opts.sides) for (const k in opts.sides) if (animals[k]) animals[k].side = opts.sides[k];   // the world may seat named escorts
    for (let i = 0; i < nF; i++) {   // the frieze: figures that keep pouring along the walls and out of the mouth
      const k = rng(), sp = k < 0.55 ? 0 : k < 0.8 ? 1 : 2, hp = rng.range(1.1, 2.4) * (opts.friezeScale ?? 1);
      animals.push({ sp, ...coat(sp, rng), lane: rng.range(16, 46), side: i % 2 ? 1 : -1, along: 0, weave: rng.range(1, 3), ph: rng() * TAU, wand: 0, wr: 0, close: null,
        scale: rng.range(0.93, 1.08), scaleWall: hp / species[sp].height, wallY: rng.range(0.3, Math.max(0.4, 4.6 - hp)),
        off: 0.045 + (nH + i) * 0.001, gaitPh: rng(), seed: rng(), dEnd: dM + 140, loop: true, phase: (i + rng() * 0.8) / nF });
    }
    // actors: figures the world scripts itself. { sp, sample(t) -> [x,y,z,relief,cave,presence,dust], ochre, fill, red,
    // antler, scale, gaitPh, seed, stride }; the world sets actor.t (0..1 along its own track) every frame.
    for (const a of opts.actors || []) {
      const an = Object.assign(a, { ext: true, loop: false, t: a.t ?? 0, scale: a.scale ?? 1, scaleWall: a.scale ?? 1, gaitPh: a.gaitPh ?? rng(), seed: a.seed ?? rng(),
        ochre: a.ochre ?? 0.7, fill: a.fill ?? 0, red: a.red ?? 0, antler: a.antler ?? 1 });
      animals.push(an);
    }
    animals.forEach((an, i) => { an.row = i; an.idx = i; if (!an.ext && opts.peelFn) an.peel = opts.peelFn(an); });
  }
  const rows = animals.length;
  const data = new Float32Array(W * rows * 2 * 4);
  const P = new THREE.Vector3(), Tg = new THREE.Vector3();
  const avoid = opts.avoid || [], laneMin = opts.laneMin ?? 5, portalClear = opts.portalClear ?? 10, peel = opts.peel || [0, 0], fan = opts.fan ?? 18;
  const pathSample = (d, an) => {
    path.posAtDist(d, P); path.tangentAtDist(d, Tg);
    let rx = -Tg.z, rz = Tg.x; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    let lane = an.lane + an.weave * Math.sin(d / 41 + an.ph) + an.weave * 0.4 * Math.sin(d / 13 + an.ph * 3);
    if (an.close) { const u = d / L, c = an.close, w = (c.to - c.from) * 0.35; lane = lerp(lane, c.lat, sstep(c.from, c.from + w, u) * (1 - sstep(c.to - w, c.to, u))); }
    lane = Math.max(lane, laneMin, portalClear * sstep(L - 100, L - 45, d));
    if (laneFn) lane = laneFn(d, an.side, lane, an);
    const dP = dM + (an.peel ?? (an.side > 0 ? peel[1] : peel[0]));
    const lat = an.side * lerp(halfW(d) - an.off, lane, sstep(dP, dP + fan, d));
    let x = P.x + rx * lat, z = P.z + rz * lat;
    for (const av of avoid) { const dx = x - av.x, dz = z - av.z, dd = Math.hypot(dx, dz) || 1e-3; if (dd < av.r) { x = av.x + dx / dd * av.r; z = av.z + dz / dd * av.r; } }
    const gy = lerp(P.y - eye, opts.heightAt ? opts.heightAt(x, z) : P.y - eye, sstep(dM - 1, dM + 6, d));
    const up = 1 - sstep(dP + 0.5, dP + 11, d);
    const y = gy + an.wallY * up + 0.5 * Math.sin(Math.PI * up) * Math.min(an.wallY, 1);
    let pres = sstep(0.5, 6, d); if (an.loop) pres *= 1 - sstep(an.dEnd - 34, an.dEnd - 3, d);
    return [x, y, z, sstep(dP - 0.4, dP + 3.6, d), 1 - sstep(dM - 4, dM + 2, d), pres, sstep(dP - 0.4, dP + 3.6, d) * (1 - sstep(0, 0.12, y - gy)) * (opts.dustAt ? opts.dustAt(x, z) : 1)];
  };
  for (let i = 0; i < rows; i++) {
    const an = animals[i], S = species[an.sp];
    an.len = an.ext ? bakeRow(data, W, rows, i, an.sample) : pathMode ? bakeRow(data, W, rows, i, (t) => pathSample(t * an.dEnd, an)) : bakeRow(data, W, rows, i, (t) => ringSample(t, an));
    const st0 = (pathMode ? S.stride : S.stride * 0.78) * an.scale;
    an.stride = an.ext && an.stride ? an.stride : pathMode ? st0 : an.len / Math.max(1, Math.round(an.len / st0));
    await ctx.yield?.();   // one track a step
  }
  const track = new THREE.DataTexture(data, W, rows * 2, THREE.RGBAFormat, THREE.FloatType);
  track.magFilter = track.minFilter = THREE.NearestFilter; track.generateMipmaps = false; track.needsUpdate = true;
  const TU = { uTrack: { value: track }, uTrackN: { value: N }, uRows: { value: rows }, uClosed: { value: pathMode ? 0 : 1 } };
  await ctx.yield?.();

  // ---- the runners: one body mesh and one ghost mesh (legs and head only, drawn twice per animal) per species
  const figs = [];
  let tris = 0, calls = 0;
  for (let sp = 0; sp < species.length; sp++) {
    const all = animals.filter((a) => a.sp === sp), list = [...all.filter((a) => !a.loop), ...all.filter((a) => a.loop)], n = list.length, S = species[sp];
    if (!n) continue;
    nEsc[sp] = list.filter((a) => !a.loop).length;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), bodyT = new Float32Array(n);
    const gA = new Float32Array(n * 8), gB = new Float32Array(n * 8), gC = new Float32Array(n * 8), ghostT = new Float32Array(n * 2);
    list.forEach((an, i) => {
      iA.set([an.row, an.scale, an.scaleWall, an.stride], i * 4); iB.set([0, an.ochre, an.fill, an.antler], i * 4); iC.set([an.gaitPh, an.seed, 0, an.red], i * 4);
      for (let g = 0; g < 2; g++) {
        const o = (i * 2 + g) * 4;
        gA.set([an.row, an.scale, an.scaleWall, an.stride], o); gB.set([g + 1, an.ochre, an.fill, an.antler], o); gC.set([an.gaitPh, an.seed, 0, an.red], o);
      }
    });
    const mat = new THREE.ShaderMaterial({
      vertexShader: FIG_VERT, fragmentShader: FIG_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), ...U, ...TU, uFore: { value: new THREE.Vector4(...S.fore) }, uHind: { value: new THREE.Vector4(...S.hind) },
        uL3: { value: S.L3 }, uGaitP: { value: new THREE.Vector4(...S.gait) }, uNeck: { value: new THREE.Vector4(...S.neck) },
        uGaitOff: { value: new THREE.Vector4(...(S.gaitOff || [0.42, 0.54, 0, 0.1])) }, uTail: { value: new THREE.Vector4(...(S.tail || [0.24, 0.1, 0.12, 0])) } },
    });
    const bodyG = instanced(S.body, n, { iA, iB, iC, iT: bodyT }), ghostG = instanced(S.ghost, n * 2, { iA: gA, iB: gB, iC: gC, iT: ghostT });
    const body = new THREE.Mesh(bodyG, mat), ghost = new THREE.Mesh(ghostG, mat);
    body.frustumCulled = ghost.frustumCulled = false; body.name = 'rw-body-' + sp; ghost.name = 'rw-ghost-' + sp;
    group.add(body); if (!S.noGhost) group.add(ghost);
    figs.push({ sp, list, n, bodyG, ghostG, bodyT, ghostT, mat, iA, gA });
    tris += n * (S.tris + (S.noGhost ? 0 : 2 * S.ghostTris)); calls += S.noGhost ? 1 : 2;
  }
  await ctx.yield?.();

  // ---- shade smudges and hoof dust
  const PUFFS = 5, per = PUFFS + 1, nS = rows * per;
  const iD = new Float32Array(nS * 4), signT = new Float32Array(nS);
  animals.forEach((an, i) => { for (let k = 0; k < per; k++) iD.set([an.row, k, an.scale * (an.sp === 0 ? 1 : clamp(species[an.sp].len / 2.6, 0.5, 2.2)), (an.seed * 7.13 + k * 0.37) % 1], (i * per + k) * 4); });
  const signG = instanced(new THREE.PlaneGeometry(2, 2), nS, { iD, iT: signT });
  const signMat = new THREE.ShaderMaterial({ vertexShader: SIGN_VERT, fragmentShader: SIGN_FRAG, fog: true, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...fogU(), ...U, ...TU } });
  const signs = new THREE.Mesh(signG, signMat); signs.frustumCulled = false; signs.name = 'rw-signs'; group.add(signs);
  tris += nS * 2; calls++;

  // ---- stand-alone setting: the painted shelter, its fallen blocks, a hearth and the ground
  let flameU = null;
  const torchBase = { on: pathMode ? 0 : 1 };
  if (!pathMode && opts.rock !== false) {
    const parts = [buildShelter(noise, rng, Rw, 292 * DEG, 214 * DEG, 60, 1), buildShelter(noise, rng, Rw, 188 * DEG, 135 * DEG, 42, 40)];
    for (const [deg, sg] of [[292, 1], [214, -1], [188, 1], [135, -1]]) for (let k = 0; k < 2; k++) {   // fallen blocks at the broken ends
      const az = (deg + sg * rng.range(2, 9)) * DEG, r = Rw + rng.range(1.5, 7), sz = rng.range(0.6, 1.5);
      parts.push(buildBoulder(noise, Math.sin(az) * r, sz * 0.32, Math.cos(az) * r, sz, deg + k * 7.7));
    }
    const tb = rng.range(232, 270) * DEG, tr = Rw - rng.range(2.6, 3.4), tp = new THREE.Vector3(Math.sin(tb) * tr, 0.25, Math.cos(tb) * tr);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rng() * 0.5; parts.push(buildBoulder(noise, tp.x + Math.cos(a) * 0.62, 0.08, tp.z + Math.sin(a) * 0.62, rng.range(0.2, 0.32), 40 + i)); }
    await ctx.yield?.();
    if (opts.ground !== false) parts.push(buildGround(noise, 34, 420));
    const rockG = mergeRock(parts);
    const rockMat = new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true,
      uniforms: { ...fogU(), ...U, uRing: { value: new THREE.Vector4(10, 18.7, 1, 0) } } });
    const rock = new THREE.Mesh(rockG, rockMat); rock.name = 'rw-rock'; group.add(rock);
    tris += rockG.index.count / 3; calls++;
    const fg = new THREE.PlaneGeometry(1, 1); fg.translate(0, 0.5, 0);
    flameU = { uFlamePos: { value: tp.clone() }, uFlameSize: { value: 1.25 } };
    const NSM = 16, iF = new Float32Array((NSM + 1) * 4);
    for (let i = 1; i <= NSM; i++) { iF[i * 4] = 1; iF[i * 4 + 1] = (i + rng() * 0.6) / NSM; }
    const flameG = instanced(fg, NSM + 1, { iF });
    const flame = new THREE.Mesh(flameG, new THREE.ShaderMaterial({ vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, ...flameU } }));
    flame.frustumCulled = false; flame.name = 'rw-flame'; group.add(flame); tris += 2 * (NSM + 1); calls++;
    U.uTorch.value.set(tp.x, tp.y + 1.0, tp.z, 1);
    U.uMouth.value.set(Math.sin(135 * DEG) * (Rw - 2), 3, Math.cos(135 * DEG) * (Rw - 2), 12);
  } else if (pathMode) {
    path.posAtDist(dM, P); U.uMouth.value.set(P.x, P.y + 1.2, P.z, 22);
  }
  await ctx.yield?.();

  // ---- clock ---------------------------------------------------------------------------------------
  let progress = -1, dc = 0, wallCount = true;
  const herd = (d) => (d >= dM ? d : dM - 1.25 * (dM - d));
  const computeT = (time) => {
    const wk = pathMode ? sstep(dM, dM + 30, dc) : 0, hs = pathMode ? herd(dc) : 0;
    for (const an of animals) {
      if (an.ext) continue;
      if (!pathMode) { const x = time / lapT + an.phase; an.t = x - Math.floor(x); }
      else if (an.loop) { const x = (time * wallSpeed) / an.dEnd + an.phase; an.t = x - Math.floor(x); }
      else an.t = clamp((hs + an.along + (an.wig ?? 1) * (wk * an.wand * Math.sin(time * an.wr + an.ph) + (1 - wk) * 5 * Math.sin(time * 0.6 + an.ph))) / span, 0, 1);
    }
    for (const f of figs) {
      for (let i = 0; i < f.n; i++) { const t = f.list[i].t; f.bodyT[i] = t; f.ghostT[i * 2] = t; f.ghostT[i * 2 + 1] = t; }
      f.bodyG.attributes.iT.needsUpdate = true; f.ghostG.attributes.iT.needsUpdate = true;
    }
    for (let i = 0; i < rows; i++) { const t = animals[i].t; for (let k = 0; k < per; k++) signT[i * per + k] = t; }
    signG.attributes.iT.needsUpdate = true;
  };
  const trackPoint = (row, t, out = new THREE.Vector3()) => {
    const f = clamp(t, 0, 1) * N, i0 = Math.min(Math.floor(f), N - 1), fr = f - i0, o = (row * W + i0) * 4;
    return out.set(lerp(data[o], data[o + 4], fr), lerp(data[o + 1], data[o + 5], fr), lerp(data[o + 2], data[o + 6], fr));
  };
  computeT(0);

  // ---- anchors ---------------------------------------------------------------------------------------
  let anchors, radius, height, center;
  if (!pathMode) {
    radius = 14; height = 9; center = new THREE.Vector3(-1.3, 3.2, -4.8);
    const at = (deg, r, y) => [Math.sin(deg * DEG) * r, y, Math.cos(deg * DEG) * r];
    anchors = {
      portalSeat: { position: [0, 7.2, 0], facing: at(15, 1, 0), radius: 7 },
      flyThrough: [at(15, 80, 11), at(15, 40, 10.6), at(15, 16, 9.8), [0, 7.2, 0]],
      viewpoints: {
        front: { position: at(13, 36, 5.5), target: [0, 2.5, -6] },
        peel: { position: at(108, 29, 2.3), target: at(135, 17, 2) },
        gap: { position: at(201, 36, 2.6), target: at(201, 19, 2.6) },
        frieze: { position: at(60, 6, 2.3), target: at(250, 19, 2.6) },
        abreast: { position: at(60, 24, 2.3), target: at(48, 14, 1.4) },
      },
      peelEdge: { position: at(135, Rw, 0), up: [0, 6, 0] }, returnEdge: { position: at(292, Rw, 0), up: [0, 6, 0] },
      gap: { from: at(214, Rw, 0), to: at(188, Rw, 0) },
      walls: { centre: [0, 0, 0], radius: Rw, spansDeg: [[292, 214], [188, 135]], friezeHeight: 6, overhangY: 8.3, rockOuterRadius: Rw + 9.5, crownY: 15 },
      ring: { inner: 10, outer: 18.7, lapSeconds: lapT },
      hearth: flameU ? flameU.uFlamePos.value.toArray() : null,
      sunDir: U.uSun.value.toArray(),
    };
  } else {
    const wallLine = (side) => { const pts = []; for (let d = 0; d <= dM + 0.01; d += 4) { path.posAtDist(d, P); path.tangentAtDist(d, Tg); const rl = Math.hypot(Tg.x, Tg.z) || 1; pts.push([P.x - Tg.z / rl * side * halfW(d), P.y - eye, P.z + Tg.x / rl * side * halfW(d)]); } return pts; };
    path.posAtDist(dM, P); path.tangentAtDist(dM, Tg);
    radius = L * 0.5; height = 8; center = path.posAtDist(L * 0.5, new THREE.Vector3());
    anchors = {
      mouth: { position: [P.x, P.y - eye, P.z], facing: [Tg.x, Tg.y, Tg.z], u: dM / L, halfWidth: halfW(dM), height: 8 },
      wallLines: { left: wallLine(-1), right: wallLine(1), friezeBand: [0.2, 5.0] },
      portalSeat: { position: path.end.toArray(), facing: path.endTangent.clone().negate().toArray(), radius: 7, clear: portalClear },
      flyThrough: [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1].map((u) => path.pointAt(u).toArray()),
      lanes: { min: laneMin, max: 40, stallion: { side: 1, lateral: animals[0].lane, closeLateral: animals[0].close.lat, closeFrom: 0.22, closeTo: 0.4, ahead: animals[0].along } },
      sunDir: U.uSun.value.toArray(),
    };
  }

  const stats = { triangles: Math.round(tris), calls, animals: rows };
  const hero = {
    object: group, radius, height, center, anchors, ground: pathMode ? false : opts.rock === false || opts.ground === false, groundY: -0.5,
    uniforms: U, grainTexture: grain, stats, animals, species: species.map((s) => ({ height: s.height, length: s.len, stride: s.stride })),
    // world hook: u = the camera's path fraction. Cave figures overtake at 15 m/s per 12 m/s of camera, the
    // escorts hold station on the camera from the mouth on. Without it the piece reads u from the camera.
    setProgress(u) { progress = u; },
    setSun(dir) { U.uSun.value.set(dir.x ?? dir[0], dir.y ?? dir[1], dir.z ?? dir[2]).normalize(); },
    setTorch(pos, intensity = 1) { U.uTorch.value.set(pos.x ?? pos[0], pos.y ?? pos[1], pos.z ?? pos[2], U.uTorch.value.w); torchBase.on = intensity; },
    // local position of runner i (0 = the stallion in path mode) at its current place: feet level, mid body
    // local position of a scripted actor (an element of opts.actors) at its current t
    actorAt(an, out = new THREE.Vector3()) { return trackPoint(an.row, an.t ?? 0, out); },
    // world hook: change one figure's size while it runs (forced perspective for the far silhouettes); buffers only, no program changes
    rescale(an, s) {
      if (an._rs === s) return;
      if (an._fig === undefined) { an._fig = figs.find((f) => f.sp === an.sp) || null; an._fi = an._fig ? an._fig.list.indexOf(an) : -1; }
      const f = an._fig, i = an._fi; if (!f || i < 0) return;
      an._rs = s; f.iA[i * 4 + 1] = s; f.iA[i * 4 + 2] = s;
      for (let g = 0; g < 2; g++) { const o = (i * 2 + g) * 4; f.gA[o + 1] = s; f.gA[o + 2] = s; }
      f.bodyG.attributes.iA.needsUpdate = true; f.ghostG.attributes.iA.needsUpdate = true;
    },
    runnerAt(i, out = new THREE.Vector3()) { const an = animals[clamp(i | 0, 0, rows - 1)]; return trackPoint(an.row, an.t ?? 0, out); },
    update(dt, time, camera) {
      U.uTime.value = time;
      // two eased swells a second, 15 percent
      const sw = Math.sin(time * TAU * 2), sw2 = Math.sin(time * TAU * 0.7 + 1.3);
      U.uTorch.value.w = torchBase.on * (1 + 0.1 * sw * Math.abs(sw) + 0.05 * sw2);
      if (pathMode) {
        let u = progress;
        if (u < 0 && camera) { group.updateMatrixWorld(); P.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(P); u = path.nearestXZ(P.x, P.z).u; }
        dc = clamp(u < 0 ? 0 : u, 0, 1) * L;
        const showWall = dc < dM + 145;   // the frieze figures are far behind after that
        if (showWall !== wallCount) { wallCount = showWall; for (const f of figs) { const k = showWall ? f.n : nEsc[f.sp]; f.bodyG.instanceCount = k; f.ghostG.instanceCount = k * 2; } }
      }
      computeT(time);
    },
    dispose() { track.dispose(); if (ownGrain) grain.dispose(); },
  };
  return hero;
}
