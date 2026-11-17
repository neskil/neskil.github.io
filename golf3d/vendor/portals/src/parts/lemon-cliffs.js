// THE MAJOLICA DOME: hero set piece for "The Lemon Cliffs".
//
// What it is (local space, origin at the base centre, +Y up, front / sea / downhill toward +Z):
//   - a stone podium terrace 60 x 52 m, 16 m high (piazza level y = 16) with a buttress arcade,
//     balustrade, fountain, cafe with a lemon-striped awning, two umbrella pines, bougainvillea;
//   - an octagonal church with a drum and a majolica dome 24 m across and 16 m high clad in about
//     6,000 instanced glazed tiles in zig-zag bands of lemon, sea-green and cobalt. Every tile is
//     really tilted by a few degrees, and each one flares flat white when its own facet mirrors the
//     sun to the camera, so the glint runs over the dome as the camera moves (and twinkles a little
//     on its own: uTime drifts the tilt);
//   - a 42 m campanile with a green copper cap, bells, and a party of swifts pouring round it;
//   - the top 30 m of the lemon stair (80 steps, y 16 -> 0, z 30 -> 60) under a pergola heavy with
//     lemons and trembling cut-out leaves;
//   - two strings of bunting from the campanile and a laundry line, flapping;
//   - 40 pigeons on the piazza that burst upward with setProgress(u).
//
// STYLE (flat gouache poster): every fragment is one of exactly two flat tones:
//     sunlit = albedo * uGain            shade = mix(albedo * vec3(.40,.38,.72), violet #3E3A5C, .28)
//   chosen by  step(0.06, dot(N, sun)) * hardShadow,  no diffuse falloff, no outlines, no textures.
//   The hard shadow is ONE depth map of the hero rendered once from the sun at build time (3072 px
//   ortho, 4 taps sharpened with smoothstep = one-texel edge). All of it is in hero-local space, so
//   the hero can be moved / rotated freely; the sun turns with it unless you call setSun(dirLocal).
//   uniforms.uCloudK (0..1 cover, default 0) and uCloudT (time) add drifting hard-edged cloud shadows.
//   uniforms.uTone (vec3, default 1) multiplies both tones: the world sets it for its hour of day.
//   To use the world's own shadow map instead call setShadowMap(depthTexture, matrix, texel, bias)
//   where matrix maps HERO-LOCAL positions to shadow uv+depth (0..1).
//   Scene lights are ignored (custom ShaderMaterials, linear HDR out, scene fog supported).
//
// opts:
//   palette  [cobalt, cream, ochre, coral, teal, violet, lemon] hex strings (brief palette default)
//   sunDir   THREE.Vector3 or [x,y,z], hero-local direction TO the sun (default 78 deg up, a little
//            out to sea and to one side)
//   shadow   false to skip the baked shadow map (default true)
//   progress initial pigeon burst progress 0..1 (default 0)
//
// returned extras: setProgress(u) (0 pigeons sit, 0..1 they burst and wheel; key it to the camera's
//   arrival over the piazza), setSun(dir), setShadowMap(...), uniforms (shared uniform holders).
//
// anchors (hero-local):
//   domeCenter, domeRadius(12), domeHeight(16), domeBaseY   the tiled dome
//   domePass      8 ordered points passing the dome about 5.5 m off the tiles and 6 m over the
//                 facade pediment, 24 m above the piazza (pigeons burst below)
//   piazza        point 7 m over the piazza centre (pigeon burst)      fountain: fountain top
//   stairTop / stairBottom   camera points 2.8 m above the treads (2 m below the fruit)
//   stairLine     ordered points: low over the piazza, then down the stair under the pergola
//                 (4 m to each side wall, fruit 2 m overhead: the close pass the brief asks for)
//   flyThrough    = domePass: the safe (>= 6 m clear) camera line past the hero: a tangent pass on
//                 the seaward side of the dome travelling toward -X with the dome on the right,
//                 one stretch of a left-hand descending helix of radius 90 m
//   side          +1 / -1: which side (x) the campanile stands on this seed
//   portalSeat    { position, facing } for a 14 m portal 26 m beyond the stair foot facing back up
//                 the stair (the brief seats the real portal on the breakwater; this is a fallback)
//   campanileTop, swiftCenter, viewpoints { reveal, tiles, stair }, sunDir
//
// Size: radius 46, height 64 (x -31..31, z -23..62). Cost: about 111k triangles, 7 draw calls
// (static, tiles, leaves, lemons, cloth, birds, fountain), no lights, one 3072 depth target
// (freed in dispose()), build about 300 ms + one depth render. Lighting expected: white noon,
// bloom on (tile glints write 5.0, uniforms.uGain scales sunlit tones, tileMat uPow / uGlint).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#2F7FD1', '#FFF4DC', '#F4B860', '#E8846B', '#2BB5B0', '#3E3A5C', '#F5D21F'];

// ---------------------------------------------------------------- shaders
const GLSL_TONE = /* glsl */`
uniform sampler2D uShadowMap; uniform float uUseShadow, uShTexel, uShBias, uGain, uCloudK, uCloudT; uniform vec3 uViolet, uTone;
float clHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float clNoise(vec2 q){ vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(clHash(i), clHash(i + vec2(1.0, 0.0)), f.x), mix(clHash(i + vec2(0.0, 1.0)), clHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float cloudLit(vec2 xz){            // a few round, scalloped puffs of shade drifting over the town (hero-local xz; uCloudK 0 = none); thinned over the terrace itself
  vec2 q = xz + uCloudT * vec2(9.0, 3.5);
  float n = 0.8 * clNoise(q * 0.006) + 0.2 * clNoise(q * 0.03);
  n -= 0.35 * (1.0 - smoothstep(60.0, 130.0, length(xz - vec2(0.0, 10.0))));
  return 1.0 - step(1.0 - uCloudK * 1.5, n) * step(0.001, uCloudK);
}
float shadowLit(vec3 sh){
  if (uUseShadow < 0.5) return 1.0;
  if (sh.x < 0.0 || sh.x > 1.0 || sh.y < 0.0 || sh.y > 1.0 || sh.z > 1.0) return 1.0;
  float z = sh.z - uShBias, o = uShTexel * 0.5, s = 0.0;
  s += step(z, texture2D(uShadowMap, sh.xy + vec2(-o, -o)).r);
  s += step(z, texture2D(uShadowMap, sh.xy + vec2( o, -o)).r);
  s += step(z, texture2D(uShadowMap, sh.xy + vec2(-o,  o)).r);
  s += step(z, texture2D(uShadowMap, sh.xy + vec2( o,  o)).r);
  return smoothstep(0.3, 0.7, s * 0.25);
}
vec3 poster(vec3 col, float lit){
  vec3 shade = mix(col * vec3(0.40, 0.38, 0.72), uViolet, 0.28);
  return mix(shade, col * uGain, lit) * uTone;
}`;

const POSTER_VERT = /* glsl */`
#include <fog_pars_vertex>
uniform mat4 uShadowMat; uniform float uTime, uNOff; uniform vec3 uSun;
varying vec3 vSh; varying vec3 vCol; varying vec3 vN; varying vec3 vLp;
#ifdef INST
attribute vec3 aCol; attribute float aRnd;
#endif
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef INST
    #ifdef LEAF
      float w = sin(uTime * (1.6 + aRnd * 1.7) + aRnd * 40.0);
      p.y += w * 0.10 * length(position.xz); p.x += w * 0.05 * position.y;
    #endif
    #ifdef CLOTH
      p.z += sin(uTime * (3.0 + aRnd * 2.5) + position.y * 4.0 + position.x * 2.5 + aRnd * 30.0) * 0.2 * (-position.y);
      p.x += sin(uTime * 1.3 + aRnd * 17.0) * 0.06 * (-position.y);
    #endif
    #ifdef LEMON
      float sw = sin(uTime * (0.9 + aRnd) + aRnd * 30.0) * 0.07 * (0.3 - position.y);
      p.x += sw;
      p *= 1.0 + 0.6 * smoothstep(45.0, 110.0, distance(cameraPosition, (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz));   // the accent carries from the helix
    #endif
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix) * n); vCol = aCol;
  #else
    vCol = color;
  #endif
  #if defined(LEAF) || defined(CLOTH)
    if (dot(n, uSun) < 0.0) n = -n;
  #endif
  vN = n; vLp = p;
  vSh = (uShadowMat * vec4(p + n * uNOff, 1.0)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const POSTER_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uSun; uniform float uTime, uWobble;
varying vec3 vSh; varying vec3 vCol; varying vec3 vN; varying vec3 vLp;
${GLSL_TONE}
void main(){
  float lit = step(LIT_EDGE, dot(normalize(vN), uSun));
  vec3 sh = vSh;
  sh.xy += vec2(sin(uTime * 1.7 + vLp.x * 0.9 + vLp.y), cos(uTime * 1.3 + vLp.z * 0.9)) * uWobble;
  lit *= shadowLit(sh) * cloudLit(vLp.xz);
  gl_FragColor = vec4(poster(vCol, lit), 1.0);
  #include <fog_fragment>
}`;

const TILE_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol; attribute vec3 aN; attribute float aRnd;
uniform mat4 uShadowMat; uniform float uTime, uPow; uniform vec3 uSun;
varying vec3 vSh; varying vec3 vCol; varying float vLitN; varying float vSpec; varying vec2 vXZ;
void main(){
  vec3 p = (instanceMatrix * vec4(position, 1.0)).xyz;
  vec3 c = instanceMatrix[3].xyz;
  vec3 nj = normalize(mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
  nj = normalize(nj + (nj - aN) * 0.55 * sin(uTime * (0.7 + aRnd) + aRnd * 50.0));   // heat twinkle
  vec3 wc = (modelMatrix * vec4(c, 1.0)).xyz;
  vec3 v = normalize(cameraPosition - wc);
  vec3 sunW = normalize(mat3(modelMatrix) * uSun), nW = normalize(mat3(modelMatrix) * nj);
  vSpec = pow(max(dot(nW, normalize(sunW + v)), 0.0), uPow);    // constant over the tile: flat flare
  vLitN = dot(aN, uSun); vCol = aCol;
  vSh = (uShadowMat * vec4(p + aN * 0.22, 1.0)).xyz; vXZ = p.xz;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const TILE_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform float uGlint;
varying vec3 vSh; varying vec3 vCol; varying float vLitN; varying float vSpec; varying vec2 vXZ;
${GLSL_TONE}
void main(){
  float lit = step(0.05, vLitN) * shadowLit(vSh) * cloudLit(vXZ);
  vec3 c = poster(vCol, lit);
  float hi = step(0.5, vSpec), lo = step(0.07, vSpec) * (1.0 - hi);
  c = mix(c, vec3(1.0, 0.99, 0.93) * uGlint, hi * lit);
  c = mix(c, mix(vCol, vec3(1.0, 0.98, 0.9), 0.62) * 1.25, lo * lit);
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;

// swifts (aKind 0) loop round a centre; pigeons (aKind 1) sit until uProgress bursts them
const BIRD_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aA; attribute vec4 aB; attribute vec3 aCol;   // aA: home xyz + kind, aB: radius, phase, speed, rnd
uniform float uTime, uProgress;
varying vec3 vCol;
void main(){
  float kind = aA.w, rnd = aB.w;
  vec3 p = position; vec3 pos; vec3 fwd; float flap; float sc = 1.0;
  if (kind < 0.5) {
    float a = uTime * aB.z + aB.y;
    float r = aB.x * (1.0 + 0.25 * sin(a * 2.0 + rnd * 9.0));
    pos = aA.xyz + vec3(cos(a) * r, sin(a * 3.0 + rnd * 20.0) * 3.5 + sin(a * 0.7 + rnd * 5.0) * 4.0, sin(a) * r);
    fwd = normalize(vec3(-sin(a), 0.25 * cos(a * 3.0 + rnd * 20.0), cos(a)) * sign(aB.z));
    flap = sin(uTime * 22.0 + rnd * 60.0) * step(0.35, fract(uTime * 0.45 + rnd * 7.0));   // flap, then glide
  } else {
    float e = clamp((uProgress - rnd * 0.25) / 0.75, 0.0, 1.0);
    float k = 1.0 - (1.0 - e) * (1.0 - e);
    float a = aB.y + k * 2.4 * aB.z + uTime * 0.25 * aB.z * step(0.001, e);
    float r = aB.x * k;
    pos = aA.xyz + vec3(cos(a) * r, k * (9.0 + rnd * 16.0) + sin(a * 2.0) * 1.5 * k, sin(a) * r);
    fwd = normalize(vec3(-sin(a) * sign(aB.z), 0.6 * (1.0 - k), cos(a) * sign(aB.z)));
    if (e < 0.001) { fwd = vec3(cos(aB.y * 7.0), 0.0, sin(aB.y * 7.0)); p.x *= 0.25; p.y = abs(p.x) * 0.2 + max(p.y, 0.0); }
    flap = sin(uTime * 17.0 + rnd * 60.0) * step(0.001, e);
    sc = 1.0;
  }
  p.y += abs(p.x) * flap * 0.75; p.x *= 1.0 - 0.3 * abs(flap);
  vec3 rt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fwd);
  pos += (rt * p.x + up * p.y + fwd * p.z) * sc;
  vCol = aCol;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
#include <fog_pars_fragment>
varying vec3 vCol;
void main(){ gl_FragColor = vec4(vCol, 1.0);
  #include <fog_fragment>
}`;

// fountain: flat white bands sliding down a parabolic sheet
const WATER_VERT = /* glsl */`
#include <fog_pars_vertex>
varying vec2 vUv2; varying vec3 vLp;
void main(){ vUv2 = uv; vLp = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uColA, uColB;
varying vec2 vUv2; varying vec3 vLp;
void main(){
  float a = atan(vLp.z, vLp.x);
  float band = fract(vUv2.y * 5.0 - uTime * 1.4 + sin(a * 6.0) * 0.15);
  float strand = step(0.25, fract(a * 9.0 / 6.2832 + sin(vUv2.y * 9.0 - uTime * 3.0) * 0.08));
  if (band > 0.62) discard;
  if (strand < 0.5) discard;
  gl_FragColor = vec4(mix(uColA, uColB, step(0.3, band)), 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- helpers
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function M(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
function flat(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }
function archShape(w, h, round = 1) {       // rectangle with a (semi)circular head, base at y = 0
  const s = new THREE.Shape(), r = w / 2, hh = Math.max(h - r * round, 0.01);
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh);
  if (round > 0) s.absellipse(0, hh, r, r * round, 0, Math.PI, false); else s.lineTo(-r, hh);
  s.lineTo(-r, 0);
  return s;
}

// A depth bake draws every object of `scene` with the one material `mat`, and three makes a program of it for each kind of
// object (plain, instanced). Made by the bake's own first draws they are used the moment they are linked, and the page
// stands still until the driver has compiled them. So they are made here, for the very objects and under the very target
// of the bake, and waited for with the page handed back (handBack: the build's yield); the bake then finds them finished.
// Nothing is drawn or changed.
export async function depthProgramsReady(r, rt, scene, cam, mat, handBack) {
  const before = new Set(r.info.programs), prevRT = r.getRenderTarget(), face = r.getActiveCubeFace(), mip = r.getActiveMipmapLevel();
  const each = { traverseVisible() {}, traverse(fn) { scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { const p = Object.create(o); p.material = mat; fn(p); } }); } };
  r.setRenderTarget(rt);                                // a program is specific to the kind of buffer it draws into
  try { r.compile(each, cam, scene); } catch (e) { /* made by the bake's first draws instead */ } finally { r.setRenderTarget(prevRT, face, mip); }
  const fresh = r.info.programs.filter((p) => !before.has(p));
  for (let n = 0; n < 300; n++) {                       // three hundred drawn frames at most; a program that never reports is used as it is
    let pending = 0; for (const p of fresh) { try { if (!p.isReady()) pending++; } catch (e) { /* disposed meanwhile */ } }
    if (!pending) break;
    await handBack();                                   // one drawn frame a round, never a timer: the callers hand in ctx.frame, which always waits for the next frame
  }
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('majolica-dome') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cobalt, creamRaw, ochre, coral, teal, violet, lemon] = pal;
  const mix = (a, b, t, k = 1) => a.clone().lerp(b, t).multiplyScalar(k);
  const cream = creamRaw.clone().multiplyScalar(0.86);
  const stone = mix(creamRaw, ochre, 0.38, 0.78);
  const paving = mix(creamRaw, ochre, 0.16, 0.8);
  const terracotta = mix(coral, ochre, 0.15, 0.72);
  const pink = mix(coral, creamRaw, 0.45, 0.85);
  const shutter = mix(teal, violet, 0.4, 0.7);
  const dark = mix(violet, cobalt, 0.2, 0.75);
  const gold = mix(ochre, lemon, 0.3, 0.95);
  const copper = mix(teal, creamRaw, 0.38, 0.85);
  const grout = mix(cobalt, violet, 0.55, 0.6);
  const leafA = new THREE.Color('#2C6A37'), leafB = new THREE.Color('#1B4A2E'), pineC = new THREE.Color('#3F8050');
  const bougA = mix(coral, new THREE.Color('#E23E8A'), 0.6), bougB = mix(coral, new THREE.Color('#E23E8A'), 0.3);

  // per-seed variety
  const side = rng.chance(0.5) ? 1 : -1;                 // which side the campanile stands on
  const towerCol = rng.pick([ochre.clone().multiplyScalar(0.85), pink, mix(coral, ochre, 0.4, 0.82)]);
  const bodyCol = rng.pick([cream, mix(creamRaw, ochre, 0.3, 0.84), mix(creamRaw, coral, 0.22, 0.86)]);
  const nRibs = rng.pick([8, 8, 12]);
  const teeth = rng.pick([8, 12, 16]);                   // zig-zag teeth round the dome
  const bandRows = rng.int(4, 6);                        // tile rows per colour band
  const zigAmp = rng.range(1.6, 2.6);
  const bandOrder = rng.shuffle([0, 1, 2]);
  const awningCol = rng.chance(0.75) ? lemon : coral;

  const PY = 16;                                         // piazza level
  const DX = -side * 6, DZ = -3;                         // dome axis
  const DOME_R = 12, DOME_H = 16, DOME_Y = 35;
  const CX = side * 20.5, CZ = 3;                        // campanile
  const FX = side * 6, FZ = 22.5;                        // fountain
  const STAIR_Z0 = 30, STAIR_RUN = 30, STAIR_W = 8;
  const treadY = (z) => PY - Math.max(0, Math.min(STAIR_RUN, z - STAIR_Z0)) * (PY / STAIR_RUN);
  const SLOPE = Math.atan2(PY, STAIR_RUN);

  const parts = [];
  function put(g, col, m, flatShade = false) {
    let n = g.index ? g.toNonIndexed() : g;
    if (m) n.applyMatrix4(m);
    if (flatShade) n.computeVertexNormals();
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k);
    const cnt = n.attributes.position.count, c = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    n.setAttribute('color', new THREE.BufferAttribute(c, 3));
    parts.push(n);
  }
  const box = (w, h, d, col, x, y, z, ry = 0, rx = 0, rz = 0) => put(new THREE.BoxGeometry(w, h, d), col, M(x, y, z, ry, 1, 1, 1, rx, rz));
  const cyl = (rt, rb, h, seg, col, x, y, z, fl = false, ry = 0) => put(new THREE.CylinderGeometry(rt, rb, h, seg, 1), col, M(x, y, z, ry), fl);
  const lathe = (pts, seg, col, x, y, z, fl = false, ry = 0) => put(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg), col, M(x, y, z, ry), fl);
  // flat panel standing on a wall whose outward normal points at angle th (0 = +Z)
  const panel = (shape, col, x, y, z, th) => put(new THREE.ShapeGeometry(shape, 10), col, M(x, y, z, th));
  const disc = (r0, r1, col, x, y, z, seg = 40) => put(r0 > 0 ? new THREE.RingGeometry(r0, r1, seg) : new THREE.CircleGeometry(r1, seg), col, M(x, y, z, 0, 1, 1, 1, -Math.PI / 2));

  // ---------- podium terrace
  box(60, PY, 52, stone, 0, PY / 2, 4);
  box(61.2, 1.6, 53.2, mix(stone, violet, 0.12, 0.92), 0, 0.8, 4);
  box(60.9, 0.5, 52.9, cream, 0, PY - 0.25, 4);
  box(59.6, 0.12, 51.6, paving, 0, PY + 0.0, 4);
  await ctx.yield?.();
  const archDark = mix(stone, violet, 0.5, 0.62);
  const bigArch = archShape(5.2, 10.5), bigArchRim = archShape(6.2, 11.2);
  for (const ax of [-25, -17.5, -10, 10, 17.5, 25]) {
    panel(bigArchRim, mix(stone, creamRaw, 0.4, 0.95), ax, 1.6, 30.05, 0);
    panel(bigArch, archDark, ax, 1.6, 30.1, 0);
    box(1.5, PY - 1, 0.9, stone, ax + 3.75 * Math.sign(ax) * -1, PY / 2, 30.3);     // buttress between arches
  }
  await ctx.yield?.();
  for (const sx of [-1, 1]) {
    for (const az of [-15, -6, 3, 12, 21]) {
      panel(bigArchRim, mix(stone, creamRaw, 0.4, 0.95), sx * 30.05, 1.6, az, sx * Math.PI / 2);
      panel(bigArch, archDark, sx * 30.1, 1.6, az, sx * Math.PI / 2);
    }
    for (const az of [-19.5, -10.5, -1.5, 7.5, 16.5, 25.5]) box(0.9, PY - 1, 1.5, stone, sx * 30.3, PY / 2, az);
  }
  await ctx.yield?.();
  for (const ax of [-24, -12, 0, 12, 24]) {
    panel(bigArchRim, mix(stone, creamRaw, 0.4, 0.95), ax, 1.6, -22.05, Math.PI);
    panel(bigArch, archDark, ax, 1.6, -22.1, Math.PI);
  }
  for (const ax of [-30, -18, -6, 6, 18, 30]) box(1.5, PY - 1, 0.9, stone, ax, PY / 2, -22.3);
  box(60.5, 0.45, 52.5, mix(stone, creamRaw, 0.45, 0.98), 0, PY - 2.6, 4);
  await ctx.yield?.();
  // balustrade with piers and geranium pots
  const railRun = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.round(len / 1.3);
    box(0.5, 0.22, len, cream, (x0 + x1) / 2, PY + 1.1, (z0 + z1) / 2, ry);
    box(0.55, 0.2, len, cream, (x0 + x1) / 2, PY + 0.1, (z0 + z1) / 2, ry);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      if (i % 5 === 0) {
        box(0.75, 1.45, 0.75, cream, x, PY + 0.72, z); box(0.95, 0.16, 0.95, stone, x, PY + 1.5, z);
        cyl(0.3, 0.2, 0.42, 8, terracotta, x, PY + 1.79, z);
        put(new THREE.IcosahedronGeometry(0.42, 0), i % 10 === 0 ? mix(coral, new THREE.Color('#D8322E'), 0.6) : leafA, M(x, PY + 2.2, z, t * 9, 1.15, 0.8, 1.15), true);
      } else cyl(0.11, 0.15, 0.82, 6, cream, x, PY + 0.6, z);
    }
  };
  railRun(-29.6, 29.6, -STAIR_W / 2 - 0.9, 29.6); railRun(STAIR_W / 2 + 0.9, 29.6, 29.6, 29.6);
  await ctx.yield?.();
  railRun(-29.6, -21.6, -29.6, 29.6); await ctx.yield?.(); railRun(29.6, -21.6, 29.6, 29.6);
  await ctx.yield?.();
  // paving rings round the fountain
  disc(6.2, 7.0, mix(ochre, creamRaw, 0.3, 0.8), FX, PY + 0.09, FZ);
  disc(4.2, 4.6, mix(teal, creamRaw, 0.45, 0.8), FX, PY + 0.09, FZ);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    put(new THREE.CircleGeometry(0.75, 4), i % 2 ? mix(cobalt, creamRaw, 0.3, 0.8) : mix(ochre, creamRaw, 0.1, 0.85), M(FX + Math.sin(a) * 5.4, PY + 0.09, FZ + Math.cos(a) * 5.4, a, 1, 1, 1, -Math.PI / 2));
  }
  await ctx.yield?.();

  // ---------- church: octagon body, facade, drum
  const AP = 15 * Math.cos(Math.PI / 8);                                   // apothem of the octagon
  cyl(15, 15, 12, 8, bodyCol, DX, PY + 6, DZ, true, Math.PI / 8);
  cyl(15.45, 15.45, 1.1, 8, stone, DX, PY + 0.55, DZ, true, Math.PI / 8);
  cyl(15.75, 15.3, 0.7, 8, terracotta, DX, PY + 12.2, DZ, true, Math.PI / 8);
  cyl(15.2, 15.2, 0.35, 8, cream, DX, PY + 11.6, DZ, true, Math.PI / 8);
  cyl(12.9, 15.5, 1.5, 8, terracotta, DX, PY + 13.25, DZ, true, Math.PI / 8);
  const tallWin = archShape(2.1, 5.6), tallRim = archShape(2.9, 6.3), shut = archShape(0.95, 5.2, 0);
  for (let i = 1; i < 8; i++) {
    const th = i * Math.PI / 4, nx = Math.sin(th), nz = Math.cos(th);
    for (const off of [-3.4, 3.4]) {
      const wx = DX + nx * (AP + 0.04) + nz * off, wz = DZ + nz * (AP + 0.04) - nx * off;
      panel(tallRim, cream, wx, PY + 3.0, wz, th);
      panel(tallWin, shutter, wx + nx * 0.04, PY + 3.3, wz + nz * 0.04, th);
      panel(shut, mix(shutter, teal, 0.25), wx + nx * 0.08 + nz * 0.02, PY + 3.4, wz + nz * 0.08 - nx * 0.02, th);
    }
    box(1.0, 12, 0.5, mix(bodyCol, creamRaw, 0.5, 0.95), DX + nx * (AP + 0.1), PY + 6, DZ + nz * (AP + 0.1), th);
  }
  // facade toward the sea
  const fz = DZ + AP + 1.6;
  box(15.5, 13.5, 5, bodyCol, DX, PY + 6.75, fz);
  box(16.3, 0.7, 5.6, terracotta, DX, PY + 13.6, fz);
  box(16.0, 0.4, 5.3, cream, DX, PY + 9.2, fz);
  const ped = new THREE.Shape(); ped.moveTo(-8.3, 0); ped.lineTo(8.3, 0); ped.lineTo(0, 3.6); ped.lineTo(-8.3, 0);
  put(new THREE.ExtrudeGeometry(ped, { depth: 5.4, bevelEnabled: false }), bodyCol, M(DX, PY + 13.95, fz - 2.7), true);
  const ped2 = new THREE.Shape(); ped2.moveTo(-6.2, 0); ped2.lineTo(6.2, 0); ped2.lineTo(0, 2.6); ped2.lineTo(-6.2, 0);
  put(new THREE.ShapeGeometry(ped2), mix(teal, creamRaw, 0.5, 0.82), M(DX, PY + 14.3, fz + 2.74));
  for (const s2 of [-1, 1]) {   // raking cornices
    box(9.4, 0.42, 5.9, terracotta, DX + s2 * 4.2, PY + 15.9, fz, 0, 0, -s2 * Math.atan2(3.6, 8.3));
    for (const px of [3.4, 6.8]) { box(1.0, 9, 0.45, cream, DX + s2 * px, PY + 4.6, fz + 2.6); box(1.3, 0.5, 0.6, stone, DX + s2 * px, PY + 0.4, fz + 2.65); box(1.3, 0.35, 0.6, cream, DX + s2 * px, PY + 9.0, fz + 2.7); }
    panel(archShape(1.5, 3.4), shutter, DX + s2 * 5.1, PY + 2.6, fz + 2.53, 0);
  }
  panel(archShape(4.6, 7.6), cream, DX, PY, fz + 2.53, 0);
  panel(archShape(3.5, 6.8), mix(shutter, violet, 0.3, 0.8), DX, PY, fz + 2.57, 0);
  box(0.12, 5.0, 0.1, mix(shutter, teal, 0.3), DX, PY + 2.5, fz + 2.6);
  put(new THREE.CircleGeometry(2.2, 28), cream, M(DX, PY + 11.5, fz + 2.53));
  put(new THREE.CircleGeometry(1.75, 28), cobalt.clone().multiplyScalar(0.8), M(DX, PY + 11.5, fz + 2.57));
  for (let i = 0; i < 8; i++) box(0.14, 3.5, 0.06, cream, DX, PY + 11.5, fz + 2.6, 0, 0, (i / 8) * Math.PI);
  put(new THREE.CircleGeometry(0.5, 12), lemon, M(DX, PY + 11.5, fz + 2.66));
  for (let i = 0; i < 3; i++) box(8 - i * 1.2, 0.25, 2.4 - i * 0.6, cream, DX, PY + 0.12 + i * 0.25, fz + 3.3 - i * 0.3);
  // drum
  const DRUM_Y = PY + 13.9, DRUM_H = DOME_Y - DRUM_Y;
  cyl(12.3, 12.3, DRUM_H, 48, cream, DX, DRUM_Y + DRUM_H / 2, DZ);
  cyl(12.8, 12.95, 0.5, 48, terracotta, DX, DRUM_Y + 0.25, DZ);
  lathe([[12.3, 0], [12.75, 0.12], [12.95, 0.45], [12.6, 0.62], [12.05, 0.7]], 48, mix(creamRaw, ochre, 0.25, 0.85), DX, DOME_Y - 0.62, DZ);
  const drumWin = archShape(1.5, 3.1), drumRim = archShape(2.1, 3.6);
  for (let i = 0; i < 16; i++) {
    const th = (i / 16) * Math.PI * 2, nx = Math.sin(th), nz = Math.cos(th);
    panel(drumRim, mix(creamRaw, ochre, 0.3, 0.84), DX + nx * 12.33, DRUM_Y + 0.75, DZ + nz * 12.33, th);
    panel(drumWin, i % 2 ? shutter : mix(cobalt, violet, 0.35, 0.7), DX + nx * 12.38, DRUM_Y + 0.95, DZ + nz * 12.38, th);
    const t2 = th + Math.PI / 16;
    box(0.7, DRUM_H - 0.9, 0.5, mix(creamRaw, ochre, 0.12, 0.88), DX + Math.sin(t2) * 12.4, DRUM_Y + DRUM_H / 2 - 0.1, DZ + Math.cos(t2) * 12.4, t2);
  }
  await ctx.yield?.();

  // ---------- the dome: shell, ribs, lantern
  const PHI_MAX = Math.acos(1.9 / DOME_R);
  const domeAt = (phi) => ({ r: DOME_R * Math.cos(phi), y: DOME_Y + DOME_H * Math.sin(phi) });
  const domeN = (phi) => { const a = DOME_H * Math.cos(phi), b = DOME_R * Math.sin(phi), l = Math.hypot(a, b); return { nr: a / l, ny: b / l }; };
  { const pts = []; for (let j = 0; j <= 22; j++) { const d = domeAt((j / 22) * PHI_MAX); pts.push([d.r - 0.05, d.y - DOME_Y]); } lathe(pts, 72, grout, DX, DOME_Y, DZ); }
  {
    const pos = [], RJ = 18, ribCol = mix(creamRaw, ochre, 0.1, 0.88);
    const P = (th, phi, lift, sideW) => {
      const d = domeAt(phi), n = domeN(phi), r = d.r + n.nr * lift;
      return [DX + Math.sin(th) * r + Math.cos(th) * sideW, d.y + n.ny * lift, DZ + Math.cos(th) * r - Math.sin(th) * sideW];
    };
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    for (let k = 0; k < nRibs; k++) {
      const th = (k / nRibs) * Math.PI * 2 + Math.PI / nRibs;
      for (let j = 0; j < RJ; j++) {
        const p0 = (j / RJ) * PHI_MAX, p1 = ((j + 1) / RJ) * PHI_MAX, w0 = 0.34 - 0.16 * (j / RJ), w1 = 0.34 - 0.16 * ((j + 1) / RJ);
        const TL0 = P(th, p0, 0.3, -w0), TR0 = P(th, p0, 0.3, w0), TL1 = P(th, p1, 0.3, -w1), TR1 = P(th, p1, 0.3, w1);
        const BL0 = P(th, p0, -0.1, -w0), BR0 = P(th, p0, -0.1, w0), BL1 = P(th, p1, -0.1, -w1), BR1 = P(th, p1, -0.1, w1);
        tri(TL0, TR0, TR1); tri(TL0, TR1, TL1); tri(TR0, BR0, BR1); tri(TR0, BR1, TR1); tri(TL0, BL1, BL0); tri(TL0, TL1, BL1);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    put(g, ribCol, null);
  }
  const LY = DOME_Y + DOME_H * Math.sin(PHI_MAX);                         // lantern base
  lathe([[2.55, 0], [2.6, 0.3], [2.25, 0.55], [2.0, 0.7]], 20, cream, DX, LY - 0.1, DZ);
  cyl(1.3, 1.3, 2.7, 8, dark, DX, LY + 1.95, DZ, true);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; cyl(0.17, 0.2, 2.7, 8, cream, DX + Math.sin(a) * 1.72, LY + 1.95, DZ + Math.cos(a) * 1.72); }
  lathe([[1.9, 0], [2.25, 0.15], [2.3, 0.4], [2.0, 0.5]], 20, cream, DX, LY + 3.3, DZ);
  lathe([[2.0, 0], [1.85, 0.7], [1.4, 1.5], [0.8, 2.1], [0.3, 2.5], [0.14, 3.1]], 20, cobalt.clone().multiplyScalar(0.82), DX, LY + 3.8, DZ);
  put(new THREE.IcosahedronGeometry(0.5, 1), gold, M(DX, LY + 7.2, DZ));
  box(0.16, 2.2, 0.16, gold, DX, LY + 8.6, DZ); box(1.1, 0.16, 0.16, gold, DX, LY + 8.95, DZ);

  // ---------- campanile
  const R2 = Math.SQRT2, TB = PY;                                          // tower base
  box(7.8, 2.2, 7.8, stone, CX, TB + 1.1, CZ); box(7.3, 0.5, 7.3, cream, CX, TB + 2.4, CZ);
  cyl(3.1 * R2, 3.4 * R2, 28, 4, towerCol, CX, TB + 14, CZ, true, Math.PI / 4);
  for (const sy of [9.5, 18.5, 27.6]) box(6.95 - sy * 0.02, 0.5, 6.95 - sy * 0.02, cream, CX, TB + sy, CZ);
  const slit = archShape(0.9, 2.8), slitRim = archShape(1.5, 3.3);
  for (let k = 0; k < 4; k++) {
    const th = k * Math.PI / 2, nx = Math.sin(th), nz = Math.cos(th);
    for (const [sy, hw] of [[4.5, 3.37], [12.5, 3.28], [21.0, 3.19]]) {
      if (k === 0 && sy > 20) continue;
      panel(slitRim, cream, CX + nx * (hw + 0.02), TB + sy - 0.2, CZ + nz * (hw + 0.02), th);
      panel(slit, dark, CX + nx * (hw + 0.06), TB + sy, CZ + nz * (hw + 0.06), th);
    }
    // corner quoins
    const cx2 = Math.sin(th + Math.PI / 4) * 3.3 * R2, cz2 = Math.cos(th + Math.PI / 4) * 3.3 * R2;
    for (let q = 0; q < 9; q++) box(0.9, 0.9, 0.9, mix(towerCol, creamRaw, 0.55, 0.95), CX + cx2 * (1 - q * 0.0105), TB + 3.4 + q * 3.0, CZ + cz2 * (1 - q * 0.0105));
    // belfry piers, bells
    const px = Math.sin(th + Math.PI / 4) * 2.55 * R2, pz = Math.cos(th + Math.PI / 4) * 2.55 * R2;
    box(1.35, 7, 1.35, towerCol, CX + px, TB + 31.5, CZ + pz);
    panel(archShape(3.75, 6.2), dark, CX + nx * 2.3, TB + 28.2, CZ + nz * 2.3, th);
    box(3.9, 1.0, 1.2, towerCol, CX + nx * 2.6, TB + 34.6, CZ + nz * 2.6, th);
    box(4.4, 0.9, 0.5, cream, CX + nx * 3.05, TB + 28.6, CZ + nz * 3.05, th);
    lathe([[0.8, 0], [0.62, 0.14], [0.46, 0.6], [0.34, 1.05], [0.06, 1.15]], 10, gold, CX + nx * 2.75, TB + 30.9, CZ + nz * 2.75);
    box(0.1, 1.6, 0.1, dark, CX + nx * 2.75, TB + 32.8, CZ + nz * 2.75);
  }
  box(4.3, 7, 4.3, dark, CX, TB + 31.5, CZ);
  // clock on the sea face
  put(new THREE.CircleGeometry(1.75, 24), gold, M(CX, TB + 23.4, CZ + 3.24));
  put(new THREE.CircleGeometry(1.45, 24), cream, M(CX, TB + 23.4, CZ + 3.28));
  box(0.14, 1.2, 0.05, dark, CX, TB + 23.95, CZ + 3.31); box(0.12, 0.85, 0.05, dark, CX + 0.3, TB + 23.6, CZ + 3.31, 0, 0, -1.1);
  box(7.6, 0.7, 7.6, cream, CX, TB + 35.45, CZ); box(7.0, 0.4, 7.0, terracotta, CX, TB + 36.0, CZ);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; cyl(0.0, 0.42, 1.7, 6, cream, CX + Math.sin(a) * 4.5, TB + 37.05, CZ + Math.cos(a) * 4.5, true); }
  cyl(2.55, 2.8, 2.6, 8, cream, CX, TB + 37.5, CZ, true, Math.PI / 8);
  for (let k = 0; k < 8; k++) { const th = k * Math.PI / 4; panel(archShape(0.8, 1.7), dark, CX + Math.sin(th) * 2.63, TB + 36.6, CZ + Math.cos(th) * 2.63, th); }
  cyl(3.1, 2.9, 0.4, 8, mix(copper, violet, 0.15), CX, TB + 39.0, CZ, true, Math.PI / 8);
  lathe([[3.0, 0], [2.75, 0.6], [2.0, 2.0], [1.1, 3.7], [0.5, 5.3], [0.14, 6.6]], 8, copper, CX, TB + 39.2, CZ, true, Math.PI / 8);
  put(new THREE.IcosahedronGeometry(0.42, 1), gold, M(CX, TB + 46.1, CZ));
  box(0.14, 2.0, 0.14, gold, CX, TB + 47.3, CZ); box(0.95, 0.14, 0.14, gold, CX, TB + 47.65, CZ);
  const TOWER_TOP = TB + 48.3;
  await ctx.yield?.();

  // ---------- cafe with the lemon awning, fountain, pines
  const KX = -side * 23.5, KZ = 21;
  box(9, 7.5, 8, pink, KX, PY + 3.75, KZ); box(9.5, 0.45, 8.5, cream, KX, PY + 7.6, KZ);
  box(9.2, 0.8, 0.3, pink, KX, PY + 8.2, KZ + 3.95); box(9.2, 0.8, 0.3, pink, KX, PY + 8.2, KZ - 3.95);
  box(0.3, 0.8, 8.2, pink, KX + 4.45, PY + 8.2, KZ); box(0.3, 0.8, 8.2, pink, KX - 4.45, PY + 8.2, KZ);
  const kth = side * Math.PI / 2, knx = side;                              // face toward the piazza centre
  for (const oz of [-2.4, 0, 2.4]) {
    put(new THREE.PlaneGeometry(1.3, 1.9), shutter, M(KX + knx * 4.53, PY + 5.6, KZ + oz, kth));
    box(0.2, 0.14, 1.6, cream, KX + knx * 4.6, PY + 4.55, KZ + oz);
    put(new THREE.IcosahedronGeometry(0.3, 0), mix(coral, new THREE.Color('#D8322E'), 0.6), M(KX + knx * 4.75, PY + 4.85, KZ + oz, oz, 1.6, 0.8, 1), true);
  }
  panel(archShape(1.7, 3.0), dark, KX + knx * 4.53, PY, KZ - 1.6, kth);
  for (let i = 0; i < 9; i++) box(3.4, 0.1, 0.8, i % 2 ? creamRaw.clone().multiplyScalar(0.9) : awningCol, KX + knx * 6.0, PY + 3.4, KZ - 3.2 + i * 0.8, 0, 0, -knx * 0.33);
  for (const oz of [-3.5, 3.5]) cyl(0.05, 0.05, 2.9, 5, dark, KX + knx * 7.55, PY + 1.45, KZ + oz);
  for (const [tx, tz] of [[6.2, -2], [6.4, 0.6], [6.0, 2.6]]) {             // empty cafe tables and chairs
    cyl(0.5, 0.5, 0.06, 10, cream, KX + knx * tx, PY + 0.85, KZ + tz); cyl(0.05, 0.05, 0.8, 5, dark, KX + knx * tx, PY + 0.45, KZ + tz);
    for (const cs of [-1, 1]) { box(0.42, 0.06, 0.42, teal, KX + knx * tx, PY + 0.52, KZ + tz + cs * 0.8); box(0.42, 0.55, 0.05, teal, KX + knx * tx, PY + 0.85, KZ + tz + cs * 1.0); }
  }
  cyl(0.06, 0.06, 2.6, 5, dark, KX + 1.5, PY + 9.1, KZ - 1); cyl(0.1, 2.1, 0.8, 10, coral, KX + 1.5, PY + 10.5, KZ - 1, true);   // roof parasol
  cyl(0.9, 0.9, 1.6, 10, mix(cobalt, creamRaw, 0.6, 0.85), KX - 2.2, PY + 8.7, KZ + 1.4);                                       // water tank
  // fountain
  lathe([[3.0, 0], [3.1, 0.55], [2.95, 0.8], [2.65, 0.8], [2.6, 0.5]], 28, cream, FX, PY, FZ);
  put(new THREE.CircleGeometry(2.62, 28), mix(teal, creamRaw, 0.2, 0.85), M(FX, PY + 0.62, FZ, 0, 1, 1, 1, -Math.PI / 2));
  lathe([[0.55, 0], [0.3, 0.5], [0.24, 1.9], [0.5, 2.25], [1.25, 2.5], [1.3, 2.62]], 16, cream, FX, PY + 0.4, FZ);
  put(new THREE.CircleGeometry(1.22, 16), mix(teal, creamRaw, 0.2, 0.85), M(FX, PY + 2.98, FZ, 0, 1, 1, 1, -Math.PI / 2));
  cyl(0.1, 0.16, 1.0, 8, cream, FX, PY + 3.4, FZ);
  // umbrella pines: leaning trunks here, parasol blobs of flat cut-out foliage
  const pines = [[-side * 26, -15, 11.5], [side * 26.5, 24.5, 9.5], [side * 25, -17, 13]];
  const trunkC = mix(coral, violet, 0.35, 0.5);
  for (const [px, pz, ph] of pines) {
    const lean = rng.range(-0.12, 0.12), lz = rng.range(-0.1, 0.1);
    put(new THREE.CylinderGeometry(0.26, 0.55, ph, 7, 1), trunkC, M(px + lean * ph / 2, PY + ph / 2, pz + lz * ph / 2, 0, 1, 1, 1, lz, -lean));
    const tx = px + lean * ph, tz = pz + lz * ph, nb = 6;
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * Math.PI * 2 + rng(), rr = b === 0 ? 0 : rng.range(2.2, 3.4), s = b === 0 ? 4.2 : rng.range(2.4, 3.3);
      put(new THREE.IcosahedronGeometry(1, 1), b % 2 ? pineC : mix(pineC, leafB, 0.5), M(tx + Math.cos(a) * rr, PY + ph + (b === 0 ? 0.5 : rng.range(-0.3, 0.3)), tz + Math.sin(a) * rr, rng() * 6, s, s * 0.33, s), true);
    }
  }

  // ---------- the lemon stair (top 30 m) and its pergola frame
  {
    const sh = new THREE.Shape(); sh.moveTo(STAIR_Z0 - 0.5, -2); sh.lineTo(STAIR_Z0 + STAIR_RUN + 3.0, -2); sh.lineTo(STAIR_Z0 - 0.5, PY - 0.18); sh.lineTo(STAIR_Z0 - 0.5, -2);
    put(new THREE.ExtrudeGeometry(sh, { depth: 9.6, bevelEnabled: false }), stone, M(4.8, 0, 0, -Math.PI / 2), true);
  }
  const NS = 80, RISE = PY / NS, RUN = STAIR_RUN / NS;
  const riserCols = [mix(cobalt, creamRaw, 0.25, 0.8), cream, mix(teal, creamRaw, 0.2, 0.82), cream, lemon.clone().multiplyScalar(0.9), cream];
  for (let i = 0; i < NS; i++) {
    const yTop = PY - (i + 1) * RISE, z0 = STAIR_Z0 + i * RUN;
    box(STAIR_W, 0.5, RUN + 0.04, i % 20 === 19 ? stone : paving, 0, yTop - 0.25, z0 + RUN / 2);
    const rc = i % 4 === 0 ? riserCols[(i / 4) % riserCols.length | 0] : cream;
    put(new THREE.PlaneGeometry(STAIR_W, RISE * 0.82), rc, M(0, yTop - RISE * 0.5 + RISE, z0 + RUN + 0.045 - RUN, 0));
  }
  const NB = 10, BL = STAIR_RUN / NB, postTops = [];
  for (let k = 0; k < NB; k++) {
    const zc = STAIR_Z0 + (k + 0.5) * BL, top = treadY(STAIR_Z0 + k * BL) + 0.95 - RISE * 1;
    const beamY = treadY(zc) + 5.7;
    for (const sx of [-1, 1]) {
      const x = sx * (STAIR_W / 2 + 0.38);
      box(0.72, 5.0, BL + 0.02, cream, x, top - 2.5, zc); box(0.95, 0.18, BL + 0.12, stone, x, top + 0.05, zc);
      cyl(0.19, 0.26, beamY - top - 0.2, 8, cream, x, (beamY + top) / 2, zc);
      box(0.62, 0.22, 0.62, cream, x, beamY - 0.2, zc); box(0.5, 0.3, 0.5, stone, x, top + 0.28, zc);
    }
    box(STAIR_W + 2.6, 0.26, 0.3, mix(creamRaw, ochre, 0.3, 0.8), 0, beamY, zc);
    postTops.push([zc, beamY]);
  }
  const purlinLen = Math.hypot(STAIR_RUN, PY) + 1.5;
  for (const px of [-4.6, -2.3, 0, 2.3, 4.6]) box(0.16, 0.18, purlinLen, mix(creamRaw, ochre, 0.4, 0.74), px, treadY(STAIR_Z0 + STAIR_RUN / 2) + 5.92, STAIR_Z0 + STAIR_RUN / 2, 0, SLOPE);
  await ctx.yield?.();

  // ---------- bunting from the campanile and a laundry line (ropes here, cloth instanced below)
  const clothInst = [];
  {
    const buntCols = [coral, creamRaw.clone().multiplyScalar(0.9), mix(teal, creamRaw, 0.15, 0.9), mix(cobalt, creamRaw, 0.25, 0.9), ochre];
    const washCols = [creamRaw.clone().multiplyScalar(0.92), creamRaw.clone().multiplyScalar(0.92), mix(coral, creamRaw, 0.5), mix(cobalt, creamRaw, 0.55), mix(teal, creamRaw, 0.5)];
    const line = (ax, ay, az, bx, by, bz, sag, n, kind) => {
      const ry = Math.atan2(-(bz - az), bx - ax), SEG = 7;
      const at = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t - sag * 4 * t * (1 - t), az + (bz - az) * t];
      for (let i = 0; i < SEG; i++) {
        const a = at(i / SEG), b = at((i + 1) / SEG), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const g = new THREE.BoxGeometry(len, 0.07, 0.07); g.rotateZ(Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])));
        put(g, dark, M((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, ry));
      }
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5 + (kind ? rng.range(-0.25, 0.25) : 0)) / n, c = at(t);
        const w = kind ? rng.pick([0.8, 0.9, 1.5, 1.7]) : 0.62, h = kind ? (w > 1.2 ? rng.range(1.5, 1.9) : rng.range(0.8, 1.0)) : 0.85;
        clothInst.push({ m: M(c[0], c[1] - 0.03, c[2], ry, w, h, 1), c: kind ? rng.pick(washCols) : buntCols[i % buntCols.length] });
      }
    };
    const apexZ = DZ + 15 * Math.cos(Math.PI / 8) + 1.6 + 2.9;
    line(CX - side * 3.3, PY + 18.5, CZ + 1.5, DX + side * 0.3, PY + 17.9, apexZ, 2.2, 22, 0);
    const poleX = side * 13.5; cyl(0.07, 0.1, 6.2, 6, dark, poleX, PY + 3.1, 29.2);
    line(CX - side * 1.0, PY + 9.6, CZ + 3.5, poleX, PY + 6.1, 29.2, 1.4, 20, 0);
    line(-side * 23.5 + side * 4.5, PY + 6.9, 18.2, DX - side * 7.8, PY + 6.6, apexZ - 3.2, 0.5, 5, 1);
  }

  // ---------- shared uniforms and materials
  const sun = new THREE.Vector3();
  if (opts.sunDir) { opts.sunDir.isVector3 ? sun.copy(opts.sunDir) : sun.fromArray(opts.sunDir); sun.normalize(); }
  else { const el = THREE.MathUtils.degToRad(78), az = -side * rng.range(0.5, 1.0); sun.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); }
  const SHADOW_E = 58, SHADOW_SIZE = (ctx.quality?.mobile || ctx.quality?.level === 'low') ? 2048 : 3072;
  // one depth-only material for every bake (the world reuses it): a single tiny program instead of compiling every poster shader inside build
  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide, fog: false });
  const U = {
    uShadowMap: { value: null }, uUseShadow: { value: 0 }, uShTexel: { value: 1 / SHADOW_SIZE }, uShBias: { value: 0.0012 },
    uShadowMat: { value: new THREE.Matrix4() }, uGain: { value: 1.06 }, uViolet: { value: violet.clone() },
    uTime: { value: 0 }, uSun: { value: sun }, uProgress: { value: opts.progress ?? 0 }, uTone: { value: new THREE.Vector3(1, 1, 1) }, uCloudK: { value: 0 }, uCloudT: { value: 0 },
  };
  const mat = (vs, fs, defines, extra = {}, own = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...own }, vertexShader: vs, fragmentShader: fs, defines, fog: true, ...extra });
  const wob = 0.03 / (SHADOW_E * 2);
  const posterMat = mat(POSTER_VERT, POSTER_FRAG, { LIT_EDGE: '0.06' }, { vertexColors: true }, { uNOff: { value: 0.12 }, uWobble: { value: wob } });
  const leafMat = mat(POSTER_VERT, POSTER_FRAG, { LIT_EDGE: '0.3', INST: '', LEAF: '' }, { side: THREE.DoubleSide }, { uNOff: { value: 0.4 }, uWobble: { value: wob * 2 } });
  const lemonMat = mat(POSTER_VERT, POSTER_FRAG, { LIT_EDGE: '0.1', INST: '', LEMON: '' }, {}, { uNOff: { value: 0.2 }, uWobble: { value: wob * 2 } });
  const clothMat = mat(POSTER_VERT, POSTER_FRAG, { LIT_EDGE: '0.05', INST: '', CLOTH: '' }, { side: THREE.DoubleSide }, { uNOff: { value: 0.3 }, uWobble: { value: wob } });
  const tileMat = mat(TILE_VERT, TILE_FRAG, {}, {}, { uPow: { value: 250 }, uGlint: { value: 5.0 } });
  const birdMat = mat(BIRD_VERT, BIRD_FRAG, {}, { side: THREE.DoubleSide });
  const waterMat = mat(WATER_VERT, WATER_FRAG, {}, { side: THREE.DoubleSide }, { uColA: { value: new THREE.Color(1.25, 1.25, 1.2) }, uColB: { value: mix(teal, creamRaw, 0.6) } });

  const root = new THREE.Group(); root.name = 'majolica-dome';
  const staticMesh = new THREE.Mesh(mergeGeometries(parts, false), posterMat);
  for (const g of parts) g.dispose();
  root.add(staticMesh);
  await ctx.yield?.();

  // ---------- the tiles
  {
    const w = 0.43, h = 0.46, pitchW = 0.462, pitchH = 0.40;
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute([
      -w / 2, h / 2, 0, -w / 2, -h * 0.12, 0, w / 2, h / 2, 0,
      w / 2, h / 2, 0, -w / 2, -h * 0.12, 0, w / 2, -h * 0.12, 0,
      -w / 2, -h * 0.12, 0, 0, -h / 2, 0, w / 2, -h * 0.12, 0], 3));
    tg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(9).fill([0, 0, 1]).flat(), 3));
    const glaze = [lemon.clone().multiplyScalar(0.92), mix(teal, creamRaw, 0.08, 0.85), cobalt.clone().multiplyScalar(0.85)];
    const sep = creamRaw.clone().multiplyScalar(0.88);
    const mats = [], cols = [], ns = [], rnds = [];
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), T = new THREE.Vector3(), Mm = new THREE.Vector3(), N = new THREE.Vector3(), m4 = new THREE.Matrix4();
    const triw = (x) => Math.abs((x - Math.floor(x)) * 2 - 1);
    let phi = 0.012, row = 0;
    while (true) {
      const ds = Math.hypot(DOME_R * Math.sin(phi), DOME_H * Math.cos(phi));
      const pc = phi + (pitchH * 0.5) / ds, d = domeAt(pc), n = domeN(pc);
      if (d.r < 2.45) break;
      const cnt = Math.max(8, Math.round((Math.PI * 2 * d.r) / pitchW)), sx = (Math.PI * 2 * d.r) / cnt / pitchW;
      for (let i = 0; i < cnt; i++) {
        const th = ((i + (row % 2) * 0.5) / cnt) * Math.PI * 2, st = Math.sin(th), ct = Math.cos(th);
        N.set(st * n.nr, n.ny, ct * n.nr); T.set(ct, 0, -st); Mm.crossVectors(N, T);
        const loose = rng() < 0.06, amp = loose ? 0.2 : 0.052;
        Z.copy(N).addScaledVector(T, rng.gauss() * amp).addScaledVector(Mm, rng.gauss() * amp).normalize();
        X.copy(T).addScaledVector(Z, -T.dot(Z)).normalize(); Y.crossVectors(Z, X);
        m4.makeBasis(X.clone().multiplyScalar(sx), Y, Z).setPosition(DX + st * d.r + N.x * 0.08, d.y + N.y * 0.08, DZ + ct * d.r + N.z * 0.08);
        mats.push(...m4.elements);
        const b = row / bandRows + triw((th / (Math.PI * 2)) * teeth) * zigAmp, fb = b - Math.floor(b);
        const base = row < 2 || fb < 0.17 ? sep : glaze[bandOrder[Math.floor(b) % 3]];
        const v = 0.9 + rng() * 0.16;
        cols.push(base.r * v, base.g * v, base.b * v); ns.push(N.x, N.y, N.z); rnds.push(rng());
      }
      phi += pitchH / ds; row++;
    }
    const count = rnds.length;
    const tiles = new THREE.InstancedMesh(tg, tileMat, count);
    tiles.instanceMatrix.array.set(mats); tiles.instanceMatrix.needsUpdate = true;
    tg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(cols), 3));
    tg.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(ns), 3));
    tg.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(rnds), 1));
    tiles.name = 'tiles'; root.add(tiles);
  }
  await ctx.yield?.();

  // ---------- foliage: one instanced cut-out leaf cluster for pergola vines and bougainvillea
  {
    const lp = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rng() * 0.6, droop = rng.range(-0.5, 0.25), L = rng.range(0.5, 0.75), W = L * 0.34;
      const dir = new THREE.Vector3(Math.cos(a), droop, Math.sin(a)).normalize(), sd = new THREE.Vector3(-Math.sin(a), rng.range(-0.3, 0.3), Math.cos(a)).normalize();
      const o = dir.clone().multiplyScalar(0.08), mid = dir.clone().multiplyScalar(L * 0.45), tip = dir.clone().multiplyScalar(L);
      const l = mid.clone().addScaledVector(sd, W), r = mid.clone().addScaledVector(sd, -W);
      lp.push(o.x, o.y, o.z, l.x, l.y, l.z, tip.x, tip.y, tip.z, o.x, o.y, o.z, tip.x, tip.y, tip.z, r.x, r.y, r.z);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.computeVertexNormals();
    const mats = [], cols = [], rnds = [], lemonSpots = [], m4 = new THREE.Matrix4();
    const addLeaf = (x, y, z, s, col) => {
      m4.copy(M(x, y, z, rng() * 6.28, s, s, s, rng.range(-0.4, 0.4), rng.range(-0.4, 0.4))); mats.push(...m4.elements);
      const v = 0.85 + rng() * 0.3; cols.push(col.r * v, col.g * v, col.b * v); rnds.push(rng());
    };
    const nz2 = ctx.noise, off = rng() * 50;
    for (let i = 0; i < 1900; i++) {                                         // pergola canopy, with gaps for sun dapple
      const x = rng.range(-5.4, 5.4), z = rng.range(STAIR_Z0 + 0.3, STAIR_Z0 + STAIR_RUN + 0.6);
      if (nz2.n2(x * 0.22 + off, z * 0.22) + nz2.n2(x * 0.9, z * 0.9 + off) * 0.35 < -0.08 && Math.abs(x) < 4.9) continue;
      const y = treadY(z) + 6.1 + rng.range(-0.1, 0.45);
      addLeaf(x, y, z, rng.range(0.9, 1.6), rng() < 0.5 ? leafA : leafB);
      if (lemonSpots.length < 560 && rng() < 0.5) {
        const topSide = rng() < 0.3 || Math.abs(x) > 4.3;                     // some fruit rides on top so it reads from the air
        lemonSpots.push([x + rng.range(-0.3, 0.3), y + (topSide ? rng.range(0.35, 0.6) : -rng.range(0.25, 0.5)), z + rng.range(-0.3, 0.3), topSide ? 1 : 0]);
      }
    }
    for (let i = 0; i < 330; i++) {                                          // hanging fringes and post vines
      const sx = rng.sign(), z = rng.range(STAIR_Z0, STAIR_Z0 + STAIR_RUN), dr = rng() * rng() * 3.2;
      addLeaf(sx * rng.range(4.6, 5.5), treadY(z) + 5.9 - dr, z, rng.range(0.8, 1.3), rng() < 0.6 ? leafA : leafB);
    }
    const cascades = [[-21, 30.5, 0], [-13.5, 30.5, 0], [15, 30.5, 0], [23.5, 30.5, 0], [-30.5, 8, -1], [30.5, -3, 1], [30.5, 17, 1]];
    for (const [cx0, cz0, sdx] of cascades) {
      if (rng() < 0.2) continue;
      const len = rng.range(6, 12), wid = rng.range(2.2, 4.2), nL = Math.round(len * wid * 3.4);
      for (let i = 0; i < nL; i++) {
        const t = Math.pow(rng(), 0.8), ww = wid * (1 - t * 0.65) * rng.range(-1, 1), out = 0.25 + rng() * 0.5 * (1 - t);
        const y = PY + 1.5 - t * len + rng.range(-0.3, 0.3);
        const x = sdx ? cx0 + sdx * (out - 0.3) : cx0 + ww, z = sdx ? cz0 + ww : cz0 + out - 0.2;
        addLeaf(x, y, z, rng.range(1.3, 2.1), rng() < 0.16 ? leafA : rng() < 0.5 ? bougA : bougB);
      }
    }
    for (const sx of [-1, 1]) for (let i = 0; i < 70; i++) {                 // bougainvillea along the outer stair walls
      const z = rng.range(STAIR_Z0 + 1, STAIR_Z0 + STAIR_RUN * 0.75);
      addLeaf(sx * (STAIR_W / 2 + 0.85 + rng() * 0.3), treadY(z) + rng.range(-1.2, 1.3), z, rng.range(1.2, 1.9), rng() < 0.2 ? leafB : sx > 0 ? bougA : bougB);
    }
    const leaves = new THREE.InstancedMesh(lg, leafMat, rnds.length);
    leaves.instanceMatrix.array.set(mats);
    lg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(cols), 3));
    lg.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(rnds), 1));
    leaves.name = 'leaves'; root.add(leaves);

    // lemons: the accent, hanging under the vine
    const prof = [[0.001, -0.37], [0.04, -0.335], [0.105, -0.27], [0.14, -0.18], [0.11, -0.085], [0.035, -0.02], [0.001, 0]];
    const gg = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 6);
    gg.deleteAttribute('uv');
    const lm = [], lc = [], lr = [], lemA = lemon.clone().multiplyScalar(0.95), lemB = mix(lemon, ochre, 0.35, 0.95);
    for (const [x, y, z, tp] of lemonSpots) {
      const s = rng.range(0.85, 1.25) * (tp ? 1.25 : 1), tl = tp ? 1.2 : 0.2;
      m4.copy(M(x, y, z, rng() * 6.28, s, s, s, rng.range(-tl, tl), rng.range(-tl, tl))); lm.push(...m4.elements);
      const c = rng() < 0.8 ? lemA : lemB; lc.push(c.r, c.g, c.b); lr.push(rng());
    }
    const lemons = new THREE.InstancedMesh(gg, lemonMat, lr.length);
    lemons.instanceMatrix.array.set(lm);
    gg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(lc), 3));
    gg.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(lr), 1));
    lemons.name = 'lemons'; root.add(lemons);
  }
  await ctx.yield?.();

  {
    const cg = new THREE.PlaneGeometry(1, 1, 4, 3); cg.translate(0, -0.5, 0); cg.deleteAttribute('uv');
    const cloth = new THREE.InstancedMesh(cg, clothMat, clothInst.length), cc = [], cr = [];
    clothInst.forEach((ci, i) => { cloth.setMatrixAt(i, ci.m); const v = 0.92 + rng() * 0.12; cc.push(ci.c.r * v, ci.c.g * v, ci.c.b * v); cr.push(rng()); });
    cg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(cc), 3));
    cg.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(cr), 1));
    cloth.name = 'cloth'; root.add(cloth);
  }
  // ---------- swifts round the campanile, pigeons on the piazza
  const swiftCenter = new THREE.Vector3(CX, TOWER_TOP - 9, CZ);
  let birds;
  {
    const bg = new THREE.InstancedBufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.28, 0.85, 0, -0.22, 0.05, 0, -0.12, 0, 0, 0.28, -0.05, 0, -0.12, -0.85, 0, -0.22,
      0, 0, 0.5, 0.1, 0, -0.1, -0.1, 0, -0.1, 0.1, 0, -0.1, 0, 0, -0.55, -0.1, 0, -0.1,
      0, 0.02, 0.42, 0, 0.2, 0.05, 0, 0.02, -0.4], 3));
    const A = [], B = [], Cc = [], NSW = 110, NPG = 40;
    const swiftCol = mix(violet, cobalt, 0.1, 0.55), pigA = mix(creamRaw, violet, 0.25, 0.8), pigB = mix(cobalt, creamRaw, 0.6, 0.7);
    for (let i = 0; i < NSW; i++) {
      A.push(swiftCenter.x, swiftCenter.y + rng.range(-6, 5), swiftCenter.z, 0);
      B.push(rng.range(6.5, 16), rng() * 6.28, rng.range(0.55, 1.1) * (rng() < 0.85 ? 1 : -1), rng());
      Cc.push(swiftCol.r, swiftCol.g, swiftCol.b);
    }
    for (let i = 0; i < NPG; i++) {
      let x, z; do { x = FX + rng.range(-12, 12) - side * 3; z = FZ + rng.range(-5.5, 6); } while (Math.hypot(x - FX, z - FZ) < 3.6);
      A.push(x, PY + 0.1, z, 1);
      B.push(rng.range(7, 20), rng() * 6.28, rng.range(1, 1.7) * rng.sign(), rng());
      const c = rng() < 0.5 ? pigA : pigB; Cc.push(c.r, c.g, c.b);
    }
    bg.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4));
    bg.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
    bg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(Cc), 3));
    bg.instanceCount = NSW + NPG;
    birds = new THREE.Mesh(bg, birdMat); birds.frustumCulled = false; birds.name = 'birds'; root.add(birds);
  }
  // ---------- fountain water
  let water;
  {
    const a = new THREE.LatheGeometry([[2.05, 0.66], [1.92, 1.7], [1.68, 2.55], [1.34, 3.02]].map((p) => new THREE.Vector2(p[0], p[1])), 32);
    const b = new THREE.LatheGeometry([[1.0, 3.02], [0.92, 4.0], [0.6, 4.75], [0.1, 5.05]].map((p) => new THREE.Vector2(p[0], p[1])), 24);
    const wg = mergeGeometries([a, b], false); a.dispose(); b.dispose();
    water = new THREE.Mesh(wg, waterMat); water.position.set(FX, PY, FZ); water.name = 'fountain-water'; root.add(water);
  }

  // ---------- the baked sun shadow (one depth map, hero-local space)
  let shadowRT = null;
  const shCam = new THREE.OrthographicCamera(-SHADOW_E, SHADOW_E, SHADOW_E, -SHADOW_E, 40, 260);
  // one child per step when a yield is handed in (build), all at once otherwise (setSun)
  async function bakeShadow(yieldFn) {
    const r = ctx.renderer;
    if (!r || opts.shadow === false) return;
    if (!shadowRT) {
      shadowRT = new THREE.WebGLRenderTarget(SHADOW_SIZE, SHADOW_SIZE, { depthBuffer: true, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
      shadowRT.depthTexture = new THREE.DepthTexture(SHADOW_SIZE, SHADOW_SIZE);
      shadowRT.depthTexture.minFilter = shadowRT.depthTexture.magFilter = THREE.NearestFilter;
    }
    const ctr = new THREE.Vector3(0, 30, 19);
    shCam.position.copy(ctr).addScaledVector(sun, 150);
    shCam.up.set(0, Math.abs(sun.y) > 0.9 ? 0 : 1, Math.abs(sun.y) > 0.9 ? -1 : 0);
    shCam.lookAt(ctr); shCam.updateMatrixWorld(true); shCam.updateProjectionMatrix();
    // the map is baked in hero-local space: render the hero at identity whatever its current parent / transform
    const parent = root.parent, pm = root.matrix.clone(), auto = root.matrixAutoUpdate;
    const sc = new THREE.Scene(); sc.overrideMaterial = depthMat;
    root.matrixAutoUpdate = false; root.matrix.identity(); sc.add(root); root.updateMatrixWorld(true);
    U.uUseShadow.value = 0; U.uShadowMap.value = null;
    const kids = root.children.slice(), vis = kids.map((o) => o.visible), cast = kids.filter((o, k) => vis[k] && o !== birds && o !== water);
    try {
      // in the build the bake's programs are made and waited for first (setSun bakes later, with the same programs)
      if (yieldFn) { await depthProgramsReady(r, shadowRT, sc, shCam, depthMat, ctx.frame || yieldFn); await yieldFn(); }
      for (let i = 0; i < cast.length; i++) {
        for (const o of kids) o.visible = o === cast[i];
        const strips = yieldFn ? 6 : 1;                     // scissor strips, so no single draw fills the whole map in one step
        for (let k = 0; k < strips; k++) {
          const prevRT = r.getRenderTarget(), prevAuto = r.autoClear, y0 = Math.round(SHADOW_SIZE * k / strips), y1 = Math.round(SHADOW_SIZE * (k + 1) / strips);
          try {
            r.autoClear = false;
            if (i === 0 && k === 0) { shadowRT.scissorTest = false; r.setRenderTarget(shadowRT); r.clear(); }
            shadowRT.scissor.set(0, y0, SHADOW_SIZE, y1 - y0); shadowRT.scissorTest = true;
            r.setRenderTarget(shadowRT); r.render(sc, shCam);
          } finally { shadowRT.scissorTest = false; shadowRT.scissor.set(0, 0, SHADOW_SIZE, SHADOW_SIZE); r.setRenderTarget(prevRT); r.autoClear = prevAuto; }
          if (yieldFn) await yieldFn();
        }
      }
    } finally {
      kids.forEach((o, k) => { o.visible = vis[k]; });
      sc.remove(root); root.matrix.copy(pm); root.matrixAutoUpdate = auto;
      if (parent) parent.add(root);
      root.updateMatrixWorld(true);
    }
    U.uShadowMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(shCam.projectionMatrix).multiply(shCam.matrixWorldInverse);
    U.uShadowMap.value = shadowRT.depthTexture; U.uShTexel.value = 1 / SHADOW_SIZE; U.uShBias.value = 0.26 / 220; U.uUseShadow.value = 1;
  }
  await ctx.yield?.();
  await bakeShadow(ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();

  // ---------- anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const domeCenter = V(DX, DOME_Y + DOME_H * 0.5, DZ);
  // tangent pass on the seaward side of the dome, travelling toward -X with the dome on the right:
  // one stretch of a left-hand descending helix of radius 90 m centred out over the cove
  const domePass = [];
  for (const dx of [44, 30, 16, 5, -6, -18, -31, -44]) {
    domePass.push(V(DX + dx, 41 + dx * 0.0865, DZ + 17 + (90 - Math.sqrt(8100 - dx * dx))));
  }
  const stairPt = (z, lift = 2.8) => V(0, treadY(z) + lift, z);
  const stairLine = [V(0, PY + 3.4, 14 + 6), V(0, PY + 3.0, 26), stairPt(31), stairPt(40), stairPt(50), stairPt(59), V(0, 3.4, 66), V(0, 5.5, 78)];
  const anchors = {
    domeCenter, domeRadius: DOME_R, domeHeight: DOME_H, domeBaseY: DOME_Y,
    domePass, piazza: V(0, PY + 7, 22), fountain: V(FX, PY + 5.2, FZ),
    stairTop: stairPt(31), stairBottom: stairPt(59), stairLine,
    flyThrough: [...domePass.map((p) => p.clone())],
    portalSeat: { position: V(0, 8, 86), facing: V(0, 0, -1) },
    campanileTop: V(CX, TOWER_TOP, CZ), swiftCenter: swiftCenter.clone(),
    viewpoints: {
      reveal: V(-side * 20, 62, 95),
      tiles: V(DX - 9, 44, DZ + 15.5),
      stair: V(0, 7, 74),
    },
    sunDir: sun.clone(), side,
  };

  return {
    object: root, radius: 46, height: 64, center: V(0, 33, 8), anchors,
    ground: true, groundY: 0,
    uniforms: U, depthMaterial: depthMat,
    update(dt, time) { U.uTime.value = time; },
    setProgress(u) { U.uProgress.value = Math.max(0, Math.min(1, u)); },
    setSun(dir) { sun.copy(dir).normalize(); anchors.sunDir.copy(sun); bakeShadow(); },
    setShadowMap(texture, matrix, texel = 1 / 4096, bias = 0.0012) {
      U.uShadowMap.value = texture; U.uShadowMat.value.copy(matrix); U.uShTexel.value = texel; U.uShBias.value = bias; U.uUseShadow.value = texture ? 1 : 0;
    },
    dispose() { depthMat.dispose(); if (shadowRT) { shadowRT.depthTexture?.dispose(); shadowRT.dispose(); shadowRT = null; } },
  };
}
