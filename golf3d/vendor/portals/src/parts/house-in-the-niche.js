// The House in the Niche: hero set piece.
//
// WHAT IT IS
//   The front of an eighteenth-century Swahili coral-stone merchant's house (Lamu), built at FULL size
//   (five times life, as the brief's room is): 90 m wide, 110 m tall to the ridge of its thatched roof
//   shade, with the carved door 16 m wide and 22 m tall, sill at y = 7, door centre at (0, 18, 0).
//   Scaled by 1/16 about its door centre it is the 5.6 m model that stands in the central niche; at
//   scale 1 it is the gateway the camera dives through. One mesh, one material, so a world can afford
//   six of them (see makeLevel()).
//   Parts, front to back: stair and stone benches (baraza) up to the sill; a stepped coral-stone
//   surround with a stepped hood on dentils and a chain border of real links; the wooden door frame (chip-carved
//   in the shader, with real rosettes on jambs and lintel and a row of bosses); two door leaves of dark oiled
//   hardwood, each a board with stiles and five rails standing proud of four sunk panels (chain borders and a net of cut
//   flowers in the shader, real rosettes on the rails) and twelve smooth polished brass domes 1.8 m across with finials,
//   lit at a rake by the room ahead (one highlight each in that room's colour, a shadow thrown toward the hinge), and
//   the carved centre post, hinged in the vertex shader; a 30 m passage
//   (z 0..-30) with cushioned benches, three real lamp niches a side (brass lamps with flames that light the plaster
//   round them, a ewer), a carved frieze and dado, a slab floor and a pole ceiling, single sided, facing inward; a carved
//   balcony on brackets; shuttered windows whose blue shutters stand open; string courses, spouts,
//   a stepped parapet; a roof terrace with a thatched (makuti) shade on poles; white curtains.
//
// SPACE (local): origin at the base centre of the front wall, +Y up, front toward +Z. The wall plane
//   is z = 0; benches and stair reach z = +9; the house block runs back to z = -30, which is the
//   stairhead of the room behind (room-local origin = local (0, 0, -30); room floor y = 0 = local y 0).
//
// LIGHT: self-lit, no three.js lights needed or used. One ShaderMaterial with analytic light:
//   a sun (direction TO the light, in the hero's own unrotated axes = room-local axes), a sky colour
//   from above, a bounce colour from below, analytic cast shadows of balcony, hood and thatch, and for
//   the passage a glow from each end (front: sky; back: the door light = the next room's hour).
//   handle.setLight({ sun:[x,y,z], sunColor, sky, bounce, door, doorStrength, glow, wind }) sets it;
//   handle.setLook('morning'|'noon'|'storm'|'sunset'|'night') sets one of the brief's five hours.
//   It supports scene fog (three.js fog chunks). Emissive parts stay tinted and under about 3.
//   THE DARK BEHIND AN ARCH: uniforms uDarkK (0: off, the default), uDark (the colour of that dark) and uArchInv (world to the
//   room whose arch the house stands behind). The front's parts further than 20 m from the arch's opening go into uDark by
//   their metres (wholly at 65 m); the passage and the leaves do not. A world sets the three; the hero alone is unchanged.
//
// OPTS: palette (7 hex strings, the brief's by default: lime, cobalt, green-gold, rose, indigo, umber,
//   flame), look (one of the five hours; default picked by seed), back (true: close the block with side
//   and rear walls so it can be seen alone; a world passes false), impostor (true: a painted picture of
//   the next room at the passage end, see below), progress (0..1, the door's first setProgress; 0.25).
//   plinth (true: a forecourt 12 m deep and the 70 m block it stands on, for a world that moves the house).
//   The five looks keep the brief's sun directions with z mirrored so the front, which faces +z, is lit.
//
// HANDLE (returned by buildHero and by makeLevel): object, radius 64, height 110, center, anchors,
//   update(dt, time, camera), setProgress(q), setLight(), setLook(), setImpostor(k), uniforms, dispose().
//   setProgress(q): q 0..1 is the dive (0 while the camera crosses the room, 1 at the door). The leaves
//   swing from ajar (72 degrees) to flat against the passage walls (90 degrees), the impostor fades so that the true room shows,
//   and the curtains stream. Driven by the world from u, never from the clock.
//   makeLevel(): another handle that SHARES the geometry and the compiled program (material.clone())
//   with its own uniforms: one per level of the recursion. Created in build(), never in update().
//   The impostor is a second small mesh (a quad at z = -29.6): a shader picture of the room behind
//   (floor, niche wall, tiers of niches, the dark arch and the speck that is its own model) in the door
//   light colour, flickering as curtains would. Use it for the level whose inside is not drawn.
//
// ANCHORS (local, full size; multiply by the level's scale):
//   doorCenter (0,18,0)        pivot for the 1/16 scaling and the point the path passes through
//   doorSill (0,7,0), doorSize {w:16,h:22}, modelScale 1/16
//   roomOrigin (0,0,-30)       where room-local (0,0,0) of the room behind sits
//   portalSeat { position (0,18,-1.5), facing (0,0,1), radius 7 }  a 14 m ring inside the stone reveal,
//                              in front of the hinges, framed by the door frame
//   flyThrough [..]            straight line through the door and passage at y 18; clearance 6.5 m to
//                              the bosses of the open leaves, 8 m to the frame, 11 m to sill, lintel and passage floor
//   viewpoints { front, close, below }  good camera places looking at lookAt
//   lookAt (0,24,0), balcony, thatch, lampNiche  for pois
//
// COST: about 39k triangles and 1 draw call per level (2 with the impostor); build about 200 ms in short steps.
//   ctx.quality.detail thins only the terrace pots and the pole ceiling.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#F4F1E6', '#2A4FA8', '#B9B24A', '#E58A7A', '#1B2450', '#3B2A20', '#F2A33A'];
const DOOR_W = 16, DOOR_H = 22, SILL = 7, DEPTH = 30, WALL_T = 3, W = 90, WALL_H = 88;
// material ids (aMH.x); +16 marks an interior (passage) face
const M_PLASTER = 0, M_WOOD = 1, M_CARVED = 2, M_BRASS = 3, M_THATCH = 4, M_CLOTH = 5, M_VOID = 6, M_LATTICE = 7, M_PAINT = 8, M_FLAME = 9, M_LEAF = 10, M_IN = 16;

// ---------------------------------------------------------------- geometry accumulator
// Collects transformed copies of small source geometries into one non-indexed buffer with
// position, normal, color and aMH (material id, hinge side / cloth weight).
export class Acc {
  constructor(maxTris) {
    const n = maxTris * 3;
    this.pos = new Float32Array(n * 3); this.nor = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.mh = new Float32Array(n * 2);
    this.n = 0; this.max = n; this._m3 = new THREE.Matrix3(); this._v = new THREE.Vector3(); this._c = new THREE.Color();
  }
  // geo: non-indexed BufferGeometry; m: Matrix4; color: THREE.Color; o: { mat, hinge, ao(x,y,z)->mult, w(x,y,z)->weight }
  add(geo, m, color, o = {}) {
    const gp = geo.attributes.position.array, gn = geo.attributes.normal.array, cnt = gp.length / 3;
    if (this.n + cnt > this.max) return;
    const e = m.elements, m3 = this._m3.getNormalMatrix(m).elements, mat = o.mat ?? M_PLASTER, hinge = o.hinge ?? 0;
    const flip = m.determinant() < 0;
    for (let i = 0; i < cnt; i++) {
      // a mirrored matrix turns the winding round: swap the 2nd and 3rd corner of each triangle
      const s = flip ? (i % 3 === 1 ? i + 1 : i % 3 === 2 ? i - 1 : i) : i;
      const x = gp[s * 3], y = gp[s * 3 + 1], z = gp[s * 3 + 2], k = (this.n + i) * 3;
      const px = e[0] * x + e[4] * y + e[8] * z + e[12], py = e[1] * x + e[5] * y + e[9] * z + e[13], pz = e[2] * x + e[6] * y + e[10] * z + e[14];
      this.pos[k] = px; this.pos[k + 1] = py; this.pos[k + 2] = pz;
      const nx = gn[s * 3], ny = gn[s * 3 + 1], nz = gn[s * 3 + 2];
      let ax = m3[0] * nx + m3[3] * ny + m3[6] * nz, ay = m3[1] * nx + m3[4] * ny + m3[7] * nz, az = m3[2] * nx + m3[5] * ny + m3[8] * nz;
      const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
      this.nor[k] = ax; this.nor[k + 1] = ay; this.nor[k + 2] = az;
      const a = o.ao ? o.ao(px, py, pz) : 1;
      this.col[k] = color.r * a; this.col[k + 1] = color.g * a; this.col[k + 2] = color.b * a;
      const k2 = (this.n + i) * 2; this.mh[k2] = mat; this.mh[k2 + 1] = o.wa ? o.wa[s] : o.w ? o.w(px, py, pz) : hinge;
    }
    this.n += cnt;
  }
  build() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col.slice(0, n * 3), 3));
    g.setAttribute('aMH', new THREE.BufferAttribute(this.mh.slice(0, n * 2), 2));
    return g;
  }
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
// matrix from position, euler rotation and scale
export function M(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _q.setFromEuler(_e.set(rx, ry, rz)); return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
export const ni = (g) => { const r = g.index ? g.toNonIndexed() : g; if (r !== g) g.dispose(); r.computeVertexNormals(); return r; };
// flat-shaded copy keeps crisp carved edges; smooth lathe keeps its own normals
export const niSmooth = (g) => { const r = g.index ? g.toNonIndexed() : g; if (r !== g) g.dispose(); return r; };

// Bevelled box, centred, unit-free: w x h x d with bevel b (front toward +z).
export function bevelBox(w, h, d, b) {
  b = Math.min(b, w * 0.45, h * 0.45, d * 0.45);
  const s = new THREE.Shape(); const x = w / 2 - b, y = h / 2 - b;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -(d - 2 * b) / 2); return ni(g);
}
// Pointed (or cusped) arch outline as a Shape: width w, straight sides to hs, then a pointed arch rising `rise`.
export function archPath(target, w, hs, rise, y0 = 0, n = 7, cw = false) {
  const pts = [[-w / 2, y0], [w / 2, y0], [w / 2, y0 + hs]];
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([w / 2 * Math.cos(t * Math.PI / 2) * (1 - 0.18 * Math.sin(t * Math.PI)), y0 + hs + rise * Math.pow(Math.sin(t * Math.PI / 2), 0.85)]); }
  pts.push([0, y0 + hs + rise]);
  for (let i = n - 1; i >= 1; i--) { const t = i / n; pts.push([-w / 2 * Math.cos(t * Math.PI / 2) * (1 - 0.18 * Math.sin(t * Math.PI)), y0 + hs + rise * Math.pow(Math.sin(t * Math.PI / 2), 0.85)]); }
  pts.push([-w / 2, y0 + hs]);
  if (cw) pts.reverse();
  target.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) target.lineTo(pts[i][0], pts[i][1]); target.closePath();
  return target;
}
// Turned profile -> lathe (smooth round, crisp along the profile is not needed at this size)
export function lathe(profile, segs = 10) {
  return niSmooth(new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segs));
}
// A carved rosette, radius 1, lying in the xy plane and rising toward +z: ring, petals with a ridge, a boss.
export function rosetteGeo(petals = 8) {
  const pos = [];
  const tri = (a, b, c) => pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const N = petals * 2;
  for (let i = 0; i < N; i++) { // outer ring: a raised bead with two slopes
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const r = [1.0, 0.9, 0.78], z = [0, 0.14, 0.02];
    for (let k = 0; k < 2; k++) {
      const A = [Math.cos(a0) * r[k], Math.sin(a0) * r[k], z[k]], B = [Math.cos(a1) * r[k], Math.sin(a1) * r[k], z[k]];
      const C = [Math.cos(a1) * r[k + 1], Math.sin(a1) * r[k + 1], z[k + 1]], D = [Math.cos(a0) * r[k + 1], Math.sin(a0) * r[k + 1], z[k + 1]];
      tri(A, B, C); tri(A, C, D);
    }
  }
  for (let i = 0; i < petals; i++) { // petals: a lens with a ridge down the middle
    const a = (i / petals) * Math.PI * 2, h = Math.PI / petals * 0.86, c = Math.cos(a), s = Math.sin(a);
    const P = (r, da, z) => [Math.cos(a + da) * r, Math.sin(a + da) * r, z];
    const root = P(0.2, 0, 0.1), tip = P(0.76, 0, 0.03), mid = [c * 0.5, s * 0.5, 0.2], L = P(0.5, h, 0.0), R = P(0.5, -h, 0.0);
    tri(root, R, mid); tri(R, tip, mid); tri(tip, L, mid); tri(L, root, mid);
  }
  for (let i = 0; i < 8; i++) { // centre boss
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    const A = [Math.cos(a0) * 0.24, Math.sin(a0) * 0.24, 0.05], B = [Math.cos(a1) * 0.24, Math.sin(a1) * 0.24, 0.05];
    const C = [Math.cos(a1) * 0.12, Math.sin(a1) * 0.12, 0.22], D = [Math.cos(a0) * 0.12, Math.sin(a0) * 0.12, 0.22];
    tri(A, B, C); tri(A, C, D); tri(D, C, [0, 0, 0.27]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}

// A door boss of radius 1 standing on the plane z = 0 and rising toward +z: a rolled foot ring, a smooth round dome
// (smooth normals, enough rings that its outline stays round at the closest pass) and a small turned finial.
// big = true is the 2 m boss of the leaves; false a light one for the lintel and the centre post.
export function bossParts(big) {
  const ring = [[1.0, 0], [1.0, 0.06], [0.965, 0.115], [0.905, 0.125], [0.87, 0.1]], n = big ? 8 : 4, t1 = 1.42;
  for (let i = 0; i <= n; i++) { const t = 0.06 + (t1 - 0.06) * (i / n); ring.push([0.86 * Math.cos(t), 0.09 + 0.6 * Math.sin(t)]); }
  const dome = lathe(ring, big ? 22 : 12); dome.rotateX(Math.PI / 2);
  const fin = lathe([[0.13, 0.655], [0.085, 0.72], [0.15, 0.75], [0.175, 0.805], [0.14, 0.865], [0.06, 0.93], [0.0, 0.985]], big ? 9 : 6); fin.rotateX(Math.PI / 2);
  return [dome, fin];
}

// ---------------------------------------------------------------- shaders
const VERT = /* glsl */`
attribute vec3 color;
attribute vec2 aMH;
uniform float uTime, uDoor, uWind;
varying vec3 vCol, vN, vL, vW, vP0, vN0, vT;
varying vec2 vMH;
varying float vCD;
#include <fog_pars_vertex>
void main() {
  vec3 p = position, n = normal;
  vP0 = position; vN0 = normal; vMH = aMH; vCol = color;
  float mat = aMH.x > 15.5 ? aMH.x - 16. : aMH.x;
  vec3 an = abs(normal);
  vec3 t = an.z > max(an.x, an.y) ? vec3(1., 0., 0.) : (an.x > an.y ? vec3(0., 0., 1.) : vec3(1., 0., 0.));
  if (abs(mat - 5.) < 0.5) {
    // cloth: aMH.y is how free the vertex is (0 at the rail, 1 at the hem)
    float w = aMH.y, ph = position.x * 0.35 + position.y * 0.22;
    float g = sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.9 + ph * 2.3) * 0.25;
    p.z += w * (0.5 + 0.5 * g + uWind * (2.2 + 1.2 * g));
    p.x += w * 0.25 * sin(uTime * 0.9 + position.y * 0.5) * (1. + uWind);
    p.y += w * uWind * 0.8;
    n = normalize(n + vec3(0.35 * cos(uTime * 1.3 + ph) * w, 0., 0.));
  } else if (abs(mat - 4.) < 0.5) {
    // thatch: the shaggy lower edge of each tier lifts in the wind (aMH.y = 1 on that edge)
    float w = aMH.y, ph = position.x * 1.3 + position.z * 0.9;
    float g = sin(uTime * 2.6 + ph) + 0.5 * sin(uTime * 4.3 + ph * 1.7);
    p.y += w * g * (0.1 + 0.4 * uWind);
    p.xz += normal.xz * w * (0.5 + 0.5 * g) * (0.08 + 0.5 * uWind);
  } else if (abs(mat - 9.) < 0.5) {
    // a lamp flame: aMH.y / 0.45 is the height above the wick
    float h = aMH.y / 0.45, ph = position.z * 1.7;
    p.z += h * h * (0.16 * sin(uTime * 3.1 + ph) + 0.09 * sin(uTime * 7.3 + ph * 2.));
    p.y += h * 0.1 * sin(uTime * 11. + ph);
  } else if (abs(aMH.y) > 0.5) {
    // door leaf: modelled shut in the plane z = -3, swung inward about its hinge by uDoor
    float h = sign(aMH.y), a = uDoor * h, c = cos(a), s = sin(a);
    vec2 d = p.xz - vec2(8. * h, -3.);
    p.xz = vec2(8. * h, -3.) + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
    n.xz = vec2(n.x * c - n.z * s, n.x * s + n.z * c);
    t.xz = vec2(t.x * c - t.z * s, t.x * s + t.z * c);
  }
  vN = n; vL = p; vT = t;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz;
  vCD = distance(cameraPosition, wp.xyz) / max(length(modelMatrix[0].xyz), 1e-5);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uBounce, uDoorCol, uGlowCol, uCoral, uLampCol;
uniform float uDoorStr, uGlow, uTime, uDarkK;
uniform mat4 uArchInv;
uniform vec3 uDark;
uniform vec3 uBoxMin[3];
uniform vec3 uBoxMax[3];
varying vec3 vCol, vN, vL, vW, vP0, vN0, vT;
varying vec2 vMH;
varying float vCD;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p) { return vn(p) * 0.58 + vn(p * 2.3 + 7.1) * 0.29 + vn(p * 5.1 + 3.7) * 0.13; }
// chip-carved lattice of rosettes, 0 (cut) .. 1 (proud); p in metres
float carve(vec2 p) {
  vec2 c = p / 1.45, f = fract(c) - 0.5;
  float r = length(f), a = atan(f.y, abs(f.x) + 1e-4);
  float pet = 0.5 + 0.5 * cos(a * 8.);
  float h = smoothstep(0.035, 0.1, r) * smoothstep(0.37, 0.3, r) * (0.35 + 0.65 * pet * pet);
  h += smoothstep(0.035, 0.0, abs(r - 0.415)) * 0.9;
  float d = abs(f.x) + abs(f.y);
  h += smoothstep(0.6, 0.68, d) * (0.55 + 0.45 * step(0.5, fract(d * 9.)));
  h += smoothstep(0.08, 0.02, r) * 0.9;
  return clamp(h, 0., 1.);
}
// a chain of oval links along x, each joined to the next by a link seen edge on; p in metres, 0 (ground) .. 1 (proud)
float chainH(vec2 p) {
  float f = fract(p.x / 0.62) - 0.5, v = p.y / 0.26;
  float ring = smoothstep(0.2, 0.08, abs(length(vec2(f * 2.25, v)) - 0.72));
  float bar = smoothstep(0.34, 0.2, abs(v)) * smoothstep(0.26, 0.36, abs(f));
  return max(max(ring, bar) * smoothstep(1.3, 1.05, abs(v)), 0.75 * smoothstep(0.34, 0.12, abs(abs(v) - 2.05)));
}
// the ground of a sunk door panel: a net of small lozenges, each with a cut flower
float panelH(vec2 p) {
  vec2 q = vec2(p.x + p.y, p.x - p.y) / 0.82, f = fract(q) - 0.5;
  float r = length(f), a = atan(f.y, abs(f.x) + 1e-4);
  float h = smoothstep(0.5, 0.42, max(abs(f.x), abs(f.y))) * 0.55;
  h += smoothstep(0.34, 0.26, r) * (0.25 + 0.2 * cos(a * 4.)) + smoothstep(0.1, 0.05, r) * 0.3;
  return clamp(h, 0., 1.);
}
// four-point stars pierced through shutters; 1 = hole
float stars(vec2 p) {
  vec2 f = abs(fract(p / 1.15 + vec2(0., 0.5 * floor(p.x / 1.15))) - 0.5);
  float d = sqrt(f.x) + sqrt(f.y);
  return 1. - smoothstep(0.52, 0.6, d);
}
float boxShadow(vec3 p, vec3 L) {
  vec3 Ld = mix(vec3(1e-4), L, step(vec3(1e-4), abs(L)));
  vec3 inv = 1. / Ld;
  float s = 1.;
  for (int i = 0; i < 3; i++) {
    vec3 t0 = (uBoxMin[i] - p) * inv, t1 = (uBoxMax[i] - p) * inv;
    vec3 a = min(t0, t1), b = max(t0, t1);
    float tn = max(max(a.x, a.y), max(a.z, 0.05)), tf = min(min(b.x, b.y), b.z);
    s *= 1. - 0.92 * smoothstep(0., 1.2, tf - tn);
  }
  return s;
}
void main() {
  float interior = step(15.5, vMH.x);
  float mat = vMH.x - 16. * interior;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 an = abs(vN0);
  vec2 pc = an.z > max(an.x, an.y) ? vP0.xy : (an.x > an.y ? vP0.zy : vP0.xz);
  vec3 T = normalize(vT + vec3(1e-5, 0., 0.));
  vec3 B = an.y > max(an.x, an.z) ? vec3(0., 0., 1.) : vec3(0., 1., 0.);
  vec3 L = normalize(uSunDir + vec3(0., 1e-5, 0.));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  vec3 alb = vCol;
  float gloss = 0., emis = 0., thin = 0., leafAo = 1., leafSh = 1.;
  vec2 bump = vec2(0.);
  if (mat < 0.5) {            // limewashed coral plaster
    float n1 = fbm(pc * 0.33), n2 = fbm(pc * 2.3 + 5.);
    alb *= 0.82 + 0.26 * n1;
    float wallish = 1. - smoothstep(0.4, 0.7, an.y);
    float st = vn(vec2(pc.x * 1.9, pc.y * 0.07 + 3.));
    alb *= 1. - 0.13 * smoothstep(0.55, 0.95, st) * wallish * vec3(1.1, 0.95, 0.8);
    float ragp = smoothstep(0.68, 0.74, fbm(pc * 0.21 + 11.) + 0.2 * smoothstep(26., 2., vP0.y) - 0.1) * (1. - 0.85 * interior);
    float pit = vn(pc * 5.5);
    float rim = ragp * (1. - ragp) * 4.;
    alb = mix(alb, uCoral * (0.6 + 0.55 * pit), ragp * 0.66) * (1. - 0.25 * rim);
    alb *= 1. - 0.25 * smoothstep(8., 0., vP0.y) * wallish * (0.5 + 0.5 * n2);   // damp rising from the ground
    bump = (vec2(fbm(pc * 2.3 + vec2(5.12, 5.)), fbm(pc * 2.3 + vec2(5., 5.12))) - n2) * (1.2 + 3. * ragp);
    // carved plasterwork: the walls of the passage carry a frieze of rosettes between chain borders and a polished dado,
    // its floor is laid in slabs, and the reveal of the doorway is carved all over like the frame it holds
    float sideW = step(0.6, an.x), revl = (1. - interior) * sideW * step(abs(abs(vP0.x) - 8.), 0.15) * step(7.2, vP0.y) * step(vP0.y, 28.9);
    float yb = vP0.y > 18.5 ? 24.4 : 12.4;
    float fr = interior * sideW * step(abs(vP0.y - yb), 1.3) + revl;
    float tro = fbm(vec2(pc.x * 0.55 + 2. * vn(pc * 0.2), pc.y * 1.3) + 9.);       // trowel sweeps, seen in the raking light of the room ahead
    alb *= 1. - interior * (0.14 * tro - 0.06);
    // the passage walls are ruled in the wet plaster into courses of blocks, each a shade of its own, the joints cut in
    vec2 bq = vec2(pc.x / 3.3 + 0.5 * floor(pc.y / 2.05), pc.y / 2.05), bf = abs(fract(bq) - 0.5);
    float crs = interior * sideW * step(11.2, vP0.y) * (1. - step(abs(vP0.y - yb), 1.4));
    float jx = smoothstep(0.468, 0.492, bf.x), jy = smoothstep(0.45, 0.488, bf.y);
    alb *= 1. - crs * (0.34 * max(jx, jy) - 0.12 * (h21(floor(bq) + 3.7) - 0.5));
    bump += crs * vec2(jx * sign(fract(bq.x) - 0.5), jy * sign(fract(bq.y) - 0.5)) * 0.9;
    bump += interior * (vec2(fbm(vec2(pc.x * 0.55 + 0.1, pc.y * 1.3) + 9.), fbm(vec2(pc.x * 0.55, pc.y * 1.3 + 0.1) + 9.)) - fbm(vec2(pc.x * 0.55, pc.y * 1.3) + 9.)) * 1.7;
    if (fr > 0.5) {
      vec2 cq = revl > 0.5 ? vec2(pc.x + 0.05, pc.y - 7.3) : vec2(pc.x, pc.y - yb + 0.725);
      float h0 = carve(cq), hx = carve(cq + vec2(0.035, 0.)), hy = carve(cq + vec2(0., 0.035));
      float band = revl > 0.5 ? 1. : step(abs(vP0.y - yb), 0.74);
      vec2 ch = vec2(pc.x + pc.y, pc.x - pc.y) * 1.6;
      float lk = smoothstep(0.1, 0.2, abs(length(fract(ch) - 0.5) - 0.3));
      bump += mix((fract(ch) - 0.5) * (1. - lk) * 1.6, vec2(h0 - hx, h0 - hy) * 3., band);
      alb *= mix(0.78 + 0.26 * lk, 0.62 + 0.5 * h0, band);
    }
    float dado = interior * sideW * step(vP0.y, 11.1);
    alb *= 1. - dado * 0.2;
    alb = mix(alb, alb * vec3(1.02, 0.9, 0.8), dado * 0.8);
    float flr = interior * step(0.6, an.y) * step(vP0.y, 8.);
    vec2 sl = abs(fract(vec2(vP0.x / 2.667 + 0.5 * floor(vP0.z / 2.25), vP0.z / 2.25)) - 0.5);
    alb *= 1. - flr * (0.4 * smoothstep(0.46, 0.49, max(sl.x, sl.y)) + 0.16 * h21(floor(vec2(vP0.x / 2.667 + 0.5 * floor(vP0.z / 2.25), vP0.z / 2.25))) - 0.1 * smoothstep(5., 1., abs(vP0.x)));
  } else if (mat < 1.5) {     // plain wood: grain along the long way
    float g = vn(vec2(pc.x * 9., pc.y * 0.45)) * 0.6 + vn(vec2(pc.x * 23., pc.y * 1.1)) * 0.4;
    alb *= 0.7 + 0.55 * g;
    bump = vec2(g - vn(vec2(pc.x * 9. + 0.9, pc.y * 0.45)), 0.) * 0.5;
    gloss = 0.12;
  } else if (mat < 2.5) {     // chip-carved wood
    float h0 = carve(pc), hx = carve(pc + vec2(0.035, 0.)), hy = carve(pc + vec2(0., 0.035));
    bump = vec2(h0 - hx, h0 - hy) * 3.2;
    float g = vn(vec2(pc.x * 7., pc.y * 0.6));
    alb *= (0.5 + 0.8 * h0) * (0.8 + 0.4 * g);
    gloss = 0.1 + 0.45 * h0;
  } else if (mat < 3.5) {     // brass
    gloss = 1.;
  } else if (mat < 4.5) {     // thatch
    float s1 = vn(vec2(pc.x * 7., pc.y * 0.6)), s2 = vn(vec2(pc.x * 19., pc.y * 1.7));
    float lay = fract(vP0.y / 1.6 + 0.2 * vn(vec2(pc.x * 0.8, 1.)));
    alb *= (0.55 + 0.6 * s1) * (0.75 + 0.35 * s2) * (0.6 + 0.5 * lay);
    bump = vec2(s2 - 0.5, 0.) * 0.6;
  } else if (mat < 5.5) {     // cotton
    alb *= 0.9 + 0.1 * sin(pc.x * 9.);
    thin = 1.;
  } else if (mat < 6.5) {     // the dark of a window
    emis = 0.55;
  } else if (mat < 7.5) {     // lattice
    vec2 q = vec2(pc.x + pc.y, pc.x - pc.y) / 0.95;
    vec2 f = abs(fract(q) - 0.5);
    float hole = (1. - smoothstep(0.24, 0.31, f.x)) * (1. - smoothstep(0.24, 0.31, f.y));
    alb *= 0.75 + 0.4 * vn(pc * 2.);
    alb = mix(alb, alb * 0.07, hole);
    emis = hole * 0.7;
    bump = vec2(f.x - 0.25, f.y - 0.25) * 0.5 * (1. - hole);
    gloss = 0.1;
  } else if (mat < 8.5) {     // painted shutter with pierced stars and worn edges
    float hole = stars(pc);
    float worn = smoothstep(0.6, 0.72, fbm(pc * 1.1 + 2.));
    float plank = abs(fract(pc.x / 1.1) - 0.5);
    alb = mix(alb, vec3(0.2, 0.13, 0.09), worn * 0.7);
    alb *= 0.8 + 0.3 * vn(vec2(pc.x * 6., pc.y * 0.5));
    alb *= 0.7 + 0.3 * smoothstep(0.0, 0.06, 0.5 - plank);
    alb = mix(alb, vec3(0.012, 0.014, 0.03), hole);
    emis = hole * 0.5;
    gloss = 0.15 * (1. - hole);
  } else if (mat < 9.5) {     // a lamp flame
    alb = vec3(0.);
  } else {                    // a leaf of the great door: oiled hardwood. Stiles and rails stand proud (z > -2.3 when shut)
    // and carry a chain border; the sunk panels are cut in a net of flowers; each boss sits in its own shadow
    float ax = abs(vP0.x), ly = vP0.y - 7.15, face = step(0.7, an.z), proud = step(-2.3, vP0.z);
    float g = vn(vec2(ax * 8., ly * 0.35)) * 0.6 + vn(vec2(ax * 21., ly * 0.9)) * 0.4;
    alb *= 0.6 + 0.6 * g;
    bump = vec2(g - vn(vec2(ax * 8. + 0.8, ly * 0.35)), 0.) * 0.35;
    gloss = 0.3;
    float rd = (fract((ly - 0.75) / 5.05 + 0.5) - 0.5) * 5.05;                 // height above the nearest rail's centre line
    float onStile = step(ax, 0.72) + step(7.28, ax);
    vec2 cp = onStile > 0.5 ? vec2(ly, ax < 4. ? ax - 0.41 : ax - 7.59) : vec2(ax, rd);
    float h0 = chainH(cp), hx = chainH(cp + vec2(0.03, 0.)), hy = chainH(cp + vec2(0., 0.03));
    float sx = vP0.x < 0. ? -1. : 1.;
    vec2 cb = onStile > 0.5 ? vec2(sx * (h0 - hy), h0 - hx) : vec2(sx * (h0 - hx), h0 - hy);
    vec2 pp = vec2(ax, ly);
    float p0 = panelH(pp), px = panelH(pp + vec2(0.03, 0.)), py = panelH(pp + vec2(0., 0.03));
    // the boss this point is nearest to, its contact shade and the shadow it throws toward the hinge, away from the room's light
    vec2 bc = vec2(clamp(floor((ax - 0.525) / 2.25), 0., 2.) * 2.25 + 1.65, clamp(floor((ly - 0.75) / 5.05), 0., 3.) * 5.05 + 3.275);
    vec2 bd = pp - bc; float br = length(bd);
    float seat = smoothstep(1.02, 0.9, br);                                      // a plain turned seat under each dome
    float pan = (1. - proud) * face;
    bump += face * mix(cb * 3.4 * proud, vec2(sx * (p0 - px), p0 - py) * 3. * (1. - seat), pan);
    alb *= mix(1., mix(0.62 + 0.55 * h0, (0.5 + 0.75 * p0) * (1. - seat) + seat * 0.8, pan), face);
    gloss += face * mix(0.35 * h0, 0.3 * p0, pan);
    float edge = min(min(abs(rd) - 0.75, ax - 0.72), 7.28 - ax);                 // distance into the sunk panel from its frame
    leafAo = mix(1., (1. - 0.62 * smoothstep(1.6, 0.86, br)) * (0.55 + 0.45 * smoothstep(0., 0.5, edge)), pan);
    leafSh = mix(1., 1. - 0.8 * smoothstep(1.0, 0.45, length((bd - vec2(1.25, -0.12)) / vec2(1.55, 0.8))), pan);
  }
  N = normalize(N + T * bump.x + B * bump.y);
  float ndl = dot(N, L);
  vec3 amb = mix(uBounce, uSky, 0.5 + 0.5 * N.y);
  vec3 lit;
  float sh = 0.;
  // the open leaves stand inside the passage: light them as the passage is lit
  float inside = max(interior, smoothstep(-3.05, -3.6, vL.z) * step(abs(vL.x), 8.4) * step(vL.y, 29.5) * step(6.5, vL.y));
  // the light of the room ahead, as it falls on whatever stands in the passage: low, from the far end, a little from the middle
  vec3 Lk = normalize(vec3(-sign(vL.x) * 0.42, 0.14, -1.));
  float flick = 0.86 + 0.09 * sin(uTime * 0.9) + 0.05 * sin(uTime * 2.3 + 1.);
  // rippling as the room's curtains and the sea move
  float rip = 0.72 + 0.56 * vn(vec2(vL.z * 0.33 + uTime * 0.8, vL.y * 0.3 + vL.x * 0.2 - uTime * 0.35));
  float leaf = step(0.5, abs(vMH.y)) * (step(mat, 3.5) + step(9.5, mat));
  vec3 key = uDoorCol * uDoorStr * flick * rip, nl = vec3(0.);
  float rk = max(dot(N, Lk), 0.);
  if (inside > 0.5) {
    float zf = clamp(-vL.z / 30., 0., 1.);
    vec3 front = (uSky * 0.95 + uSunCol * 0.1) * exp(-zf * 6.) * clamp(0.55 + 0.8 * N.z, 0.08, 1.2) + uBounce * 0.5 * exp(-zf * 12.) + uDoorCol * uDoorStr * 0.04;
    // walls, floor and benches take the room's light at a rake, so trowel marks and carving stand out; the stretch of wall
    // beside the eye falls back into shade
    float nearK = 0.08 + 0.92 * smoothstep(5., 28., vCD);
    vec3 back = key * 1.05 * exp(-(1. - zf) * 2.5) * clamp(0.2 + 1.5 * rk + 0.38 * max(N.y, 0.), 0.1, 1.6) * (0.62 + 0.38 * smoothstep(30., 14., vL.y)) * nearK;
    // the four lamps in the wall niches: each lights a couple of metres of plaster and leaves the rest to the doors
    for (int i = 0; i < 2; i++) {
      vec3 tl = vec3(sign(vL.x) * 8.47, 16.9, i == 0 ? -13.5 : -25.5) - vL;
      float d2 = dot(tl, tl), fk = 0.84 + 0.1 * sin(uTime * 9.1 + float(i) * 2.3 + sign(vL.x)) + 0.06 * sin(uTime * 15.7 + float(i) * 4.1);
      nl += uLampCol * fk * (max(dot(N, tl * inversesqrt(max(d2, 0.01))), 0.) * 0.75 + 0.25) * (0.8 / (1. + d2 * 0.5) + 1.9 * exp(-d2 * 0.7));
    }
    // the leaves are dark oiled wood: the room ahead is their key light, raking along them so that every rail, link and cut
    // flower has a lit side and each boss throws its shadow; the daylight behind us only fills the near sides
    vec3 fill = (uSky * 0.8 + uSunCol * 0.1) * exp(-zf * 2.6) * clamp(0.32 + 0.9 * N.z, 0.05, 1.2);
    // (the niche lamps count for more on them when the room ahead is dim: by moonlight the wood is still seen to be wood)
    float lampK = 0.15 + 0.55 * smoothstep(1.25, 0.3, dot(uDoorCol, vec3(0.21, 0.72, 0.07)) * uDoorStr);
    vec3 leafLit = key * (0.1 + 1.5 * rk * leafSh) * leafAo + (fill + uLampCol * lampK * (0.45 + 0.55 * rk)) * leafAo + nl * 0.6;
    // the timber overhead takes a little of the lit floor and of the niche lamps, thrown up: the passage has a roof, not a void
    float topK = interior * step(0.5, mat) * step(mat, 2.5) * smoothstep(25.5, 27.5, vL.y);
    vec3 roof = (key * (0.06 + 0.2 * exp(-(1. - zf) * 2.)) + uLampCol * 0.17 + uSky * 0.15 * exp(-zf * 4.)) * (0.45 + 0.55 * max(-N.y, 0.)) * topK;
    lit = mix(front + back + uSky * 0.012 + nl + roof, leafLit, leaf);
  } else {
    sh = boxShadow(vL + N * 0.35, L);
    // the doorway and its frame take the sun as if it stood in front of the house, so both jambs are lit alike,
    // and the light of the room behind spills onto their inner faces
    float dzone = step(abs(vL.x), 13.6) * step(5.5, vL.y) * step(vL.y, 37.) * step(vL.z, 3.2);
    vec3 Ld = normalize(vec3(-sign(vL.x) * 0.45, max(L.y, 0.25), max(abs(L.z), 0.6)));
    ndl = mix(ndl, dot(N, Ld), dzone);
    float d = mix(max(ndl, 0.), abs(ndl) * 0.6 + 0.25, thin);
    // cloud and curtain shade drifting over the front
    float dap = 0.58 + 0.42 * smoothstep(0.25, 0.75, vn(vL.xy * 0.045 + vec2(uTime * 0.2, uTime * 0.07)));
    lit = uSunCol * d * mix(sh, 0.6 + 0.4 * sh, dzone) * dap * mix(1., 0.8, dzone) + amb * (0.78 + 0.22 * dap) + dzone * uDoorCol * uDoorStr * 0.2 * (abs(N.x) * 0.8 + 0.2);
  }
  vec3 col = alb * lit;
  // gloss: a tinted highlight and, on brass, the surroundings
  vec3 Hh = normalize(L + V + vec3(0., 1e-5, 0.));
  float brass = step(0.99, gloss);
  float sp = pow(max(dot(N, Hh), 0.), mix(12., 48., brass)) * sh * step(0., ndl);
  vec3 R = reflect(-V, N);
  float zfc = clamp(-vL.z / 30., 0., 1.);
  // polished brass is a mirror of where it stands. In the open: sky above, ground below, the sun's glare.
  vec3 envOut = mix(uBounce, uSky, smoothstep(-0.4, 0.6, R.y)) * mix(0.45, 1.3, smoothstep(-0.5, 0.8, R.y)) + uSunCol * 0.25 * smoothstep(0.5, 0.95, dot(R, L)) * sh;
  // In the passage: the bright room ahead (one soft band of its colour), the dim day behind, the dark ceiling and the floor,
  // and the niche lamps as small warm glints. All smooth: a dome shows one clean gradient, not a pattern.
  float toRoom = smoothstep(0.1, 0.92, -R.z), up = smoothstep(-0.75, 0.3, R.y);
  vec3 envIn = key * (1.25 * toRoom * toRoom + 0.1) * mix(0.3, 1., up) + uSky * 0.85 * smoothstep(0.15, 0.9, R.z) * exp(-zfc * 2.6) * mix(0.4, 1., up) + uLampCol * 0.07;
  for (int i = 0; i < 4; i++) {
    vec3 tl = vec3((i < 2 ? 8.47 : -8.47), 17.4, (i == 0 || i == 2) ? -13.5 : -25.5) - vL;
    float rl = max(dot(R, tl * inversesqrt(max(dot(tl, tl), 0.01))), 0.), rl2 = rl * rl, rl8 = rl2 * rl2 * rl2 * rl2;
    envIn += uLampCol * (1.5 * pow(rl, 70.) + 0.5 * rl8 / (1. + 0.25 * dot(tl, tl))) * inside * brass;
  }
  vec3 tintB = mix(vCol, vec3(0.92, 0.8, 0.52), 0.3);
  // the underside of every dome and knob sits in its own shade
  float under = 0.42 + 0.58 * smoothstep(-0.8, 0.35, N.y);
  col = mix(col, mix(vCol * (envOut * 1.25 + lit * 0.3), tintB * (envIn * 1.2 + lit * 0.1) * under, inside), brass * 0.88);
  // one crisp highlight in the colour of the room ahead, with a soft bloom of it round it
  // (it stands on the upper shoulder of each dome, clear of the finial, where a mirror would show the room's brightest thing)
  vec3 Hs = normalize(normalize(vec3(-sign(vL.x) * 0.1, 0.62, -0.78)) + V + vec3(0., 1e-5, 0.));
  float nds = max(dot(N, Hs), 0.), nds8 = nds * nds * nds * nds; nds8 *= nds8;
  float hot = pow(nds8, 9.) * 5.2 + nds8 * nds8 * 0.55;
  col += inside * brass * mix(uDoorCol, vec3(1.), 0.22) * uDoorStr * flick * hot;
  vec3 Hk = normalize(Lk + V + vec3(0., 1e-5, 0.));
  float ndh = max(dot(N, Hk), 0.), ndh8 = ndh * ndh * ndh * ndh; ndh8 *= ndh8;
  // oiled wood takes a low sheen from the same light
  col += inside * leaf * (1. - brass) * key * (0.5 + 0.5 * alb / max(max(alb.r, alb.g), max(alb.b, 0.02))) * ndh8 * ndh * gloss * 0.3 * leafSh * leafAo;
  col += uSunCol * sp * gloss * mix(vec3(0.35), vCol * 4., brass) * (1. - inside * leaf);
  // lamplight behind lattice, stars and windows after dark
  col += uGlowCol * uGlow * emis * (0.8 + 0.2 * sin(uTime * 2.3 + vP0.x * 0.7) * sin(uTime * 3.7 + vP0.y));
  // a flame: white-gold at the wick, amber at the tip, soft at its edge
  float fh = clamp(vMH.y / 0.45, 0., 1.), fe = max(dot(N, V), 0.);
  col += step(8.5, mat) * step(mat, 9.5) * uLampCol * mix(vec3(2.6, 2.5, 2.1), vec3(1.5, 0.8, 0.3), smoothstep(0.1, 0.95, fh)) * (0.5 + 0.5 * fe) * (0.85 + 0.15 * sin(uTime * 11. + vP0.z));
  // The dark behind the arch (a world that stands this house behind an arch sets uDarkK, uDark and uArchInv; otherwise nothing).
  // uArchInv takes a world point into the room whose arch it is: the opening is 20 m wide from a sill at 8 to a crown at 36 in
  // the wall's face z = -110. Whatever of the front is further than the 20 m gap from that opening goes into the dark by its
  // metres, wholly at 65 m (the eaves of the thatch); the passage and the open leaves are inside the house and keep their light.
  vec3 ap = (uArchInv * vec4(vW, 1.)).xyz;
  float ad = length(vec3(max(abs(ap.x) - 10., 0.), max(ap.y - 36., 0.) + max(8. - ap.y, 0.), max(-110. - ap.z, 0.)));
  col = mix(col, uDark, smoothstep(20., 65., ad) * (1. - step(0.5, inside)) * uDarkK);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// The painted room at the far end of the passage (see header).
const IMP_VERT = /* glsl */`
varying vec2 vUv;
#include <fog_pars_vertex>
void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const IMP_FRAG = /* glsl */`
uniform vec3 uDoorCol, uShade, uNext, uChina;
uniform float uDoorStr, uTime, uAlpha;
varying vec2 vUv;
#include <fog_pars_fragment>
float h11(float x) { return fract(sin(x * 91.7) * 4375.5); }
void main() {
  // wall coordinates in metres of the room behind: x -35..35, y 0..44, seen at scale 0.27 about eye height 18
  vec2 w = vec2((vUv.x - 0.5) * 16., vUv.y * 22. + 7. - 18.) / 0.27 + vec2(0., 18.);
  float flick = 0.86 + 0.09 * sin(uTime * 0.9) + 0.05 * sin(uTime * 2.3 + 1.);
  float cur = 0.75 + 0.25 * smoothstep(-6., 6., w.x - 14. - 9. * sin(uTime * 0.6));     // a curtain's shadow sliding in
  vec3 wall = uDoorCol * (0.66 + 0.2 * smoothstep(0., 44., w.y)) * cur;
  // tiers of niches
  vec2 cell = vec2(5.8, 7.4), id = floor((w - vec2(0., 3.)) / cell), f = fract((w - vec2(0., 3.)) / cell) - 0.5;
  float nw = 0.3 + 0.08 * h11(id.x + id.y * 7.), top = 0.28 - (f.x * f.x) * 2.2;
  float niche = step(abs(f.x), nw) * step(-0.3, f.y) * step(f.y, top);
  float china = niche * smoothstep(0.17, 0.12, length(vec2(f.x, (f.y + 0.14) * 1.25))) * step(0.3, h11(id.x * 3. + id.y));
  // the central arch, dark, and the speck in it
  float ah = 26. - 0.07 * w.x * w.x + step(abs(w.x), 10.) * 2. * (1. - abs(w.x) / 10.);
  float arch = step(abs(w.x), 10.) * step(8., w.y) * step(w.y, 8. + ah);
  float inWall = step(abs(w.x), 35.) * step(0., w.y) * step(w.y, 44.);
  vec3 col = wall;
  col = mix(col, uShade * 0.5 + uDoorCol * 0.12, niche * (1. - arch));
  col = mix(col, uChina, china * (1. - arch) * 0.9);
  col = mix(col, uShade * 0.06, arch);
  vec2 m = (w - vec2(0., 8.)) / vec2(2.8, 6.9);
  float model = step(abs(m.x), 1.) * step(0., m.y) * step(m.y, 0.82 + 0.18 * (1. - abs(m.x)));
  col = mix(col, uDoorCol * 0.55, model);
  col = mix(col, uNext * 2.2, step(abs(m.x), 0.2) * step(0.08, m.y) * step(m.y, 0.3));
  // floor with a pool of light, ceiling in shade
  float fl = step(w.y, 0.);
  vec3 floorc = uDoorCol * (0.42 + 0.5 * smoothstep(0.0, 1., 1. - abs(w.x * 0.03 + w.y * 0.05 + 0.6))) * (0.8 + 0.2 * sin(w.x * 1.4));
  col = mix(col, floorc, fl);
  col = mix(col, uShade * 0.2 + uDoorCol * 0.05, step(44., w.y));
  col = mix(uShade * 0.12, col, max(inWall, max(fl, step(44., w.y))) );
  vec2 mp = vUv * vec2(16., 22.) * 1.6 + vec2(uTime * 0.11, -uTime * 0.07);
  float mote = step(0.985, h11(floor(mp.x) + floor(mp.y) * 57.)) * smoothstep(0.35, 0.1, length(fract(mp) - 0.5)) * (0.5 + 0.5 * sin(uTime * 1.7 + floor(mp.x)));
  col += uDoorCol * mote * 0.5;
  gl_FragColor = vec4(col * uDoorStr * flick, uAlpha);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- small builders
export function quadGeo(a, b, c, d) { // counter-clockwise seen from the lit side
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3)); g.computeVertexNormals(); return g;
}
const I4 = new THREE.Matrix4();
const tone = (c, rng, amt = 0.08) => c.clone().multiplyScalar(1 + (rng() - 0.5) * 2 * amt);

// Window openings of the front: x centre, sill y, width, straight height, arch rise, kind
function windowList(cfg) {
  const L = [];
  L.push({ x: -29, y: 13, w: 6.5, hs: 7, rise: 2.6, kind: 'bars' }, { x: 29, y: 13, w: 6.5, hs: 7, rise: 2.6, kind: 'bars' });
  L.push({ x: -30, y: 40, w: 9, hs: 11, rise: 4, kind: 'shut' }, { x: 30, y: 40, w: 9, hs: 11, rise: 4, kind: 'shut' });
  L.push({ x: 0, y: 38, w: 10, hs: 13, rise: 4, kind: 'balcony' });
  const n = cfg.upperWin, span = n === 3 ? 27 : 16, w = n === 3 ? 9 : 7.5;
  for (let i = 0; i < n; i++) L.push({ x: (i - (n - 1) / 2) * span, y: 66, w, hs: 9.5, rise: 3.6, kind: i % 2 === (n === 3 ? 1 : 0) ? 'curtain' : 'shut' });
  return L;
}

// The shell: front wall with its openings, benches and stair, string courses, pilasters, parapet,
// terrace floor, optional side and rear walls, and the passage (interior faces).
async function buildShell(acc, C, cfg, rng, wins, detail, Y) {
  // front wall, 3 m thick, with real reveals
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, WALL_H); sh.lineTo(-W / 2, WALL_H); sh.closePath();
  const dh = new THREE.Path(); dh.moveTo(-DOOR_W / 2, SILL); dh.lineTo(-DOOR_W / 2, SILL + DOOR_H); dh.lineTo(DOOR_W / 2, SILL + DOOR_H); dh.lineTo(DOOR_W / 2, SILL); dh.closePath();
  sh.holes.push(dh);
  for (const w of wins) { const h = new THREE.Path(); archPath(h, w.w, w.hs, w.rise, w.y, 6, true); h.currentPoint.set(0, 0); for (const c of h.curves) { c.v1.x += w.x; c.v2.x += w.x; } sh.holes.push(h); }
  const wall = ni(new THREE.ExtrudeGeometry(sh, { depth: WALL_T, bevelEnabled: false, curveSegments: 1 }));
  await Y();
  wall.translate(0, 0, -WALL_T);
  // reveals are darker than the face: baked by depth
  acc.add(wall, I4, C.lime, { ao: (x, y, z) => (z < -0.2 ? 0.62 : 1) });
  wall.dispose();
  await Y();
  // window voids, sills, raised hoods
  for (const w of wins) {
    await Y();
    acc.add(quadGeo([w.x - w.w / 2 - 0.2, w.y - 0.2, -2.7], [w.x + w.w / 2 + 0.2, w.y - 0.2, -2.7], [w.x + w.w / 2 + 0.2, w.y + w.hs + w.rise + 0.2, -2.7], [w.x - w.w / 2 - 0.2, w.y + w.hs + w.rise + 0.2, -2.7]), I4, C.void, { mat: M_VOID });
    const ring = new THREE.Shape(); archPath(ring, w.w + 2.4, w.hs + 0.6, w.rise + 1.3, 0, 6);
    const hole = new THREE.Path(); archPath(hole, w.w + 0.1, w.hs + 0.1, w.rise, 0.5, 6, true); ring.holes.push(hole);
    const rg = ni(new THREE.ExtrudeGeometry(ring, { depth: 0.35, bevelEnabled: true, bevelSize: 0.22, bevelThickness: 0.3, bevelSegments: 1, curveSegments: 1 }));
    acc.add(rg, M(w.x, w.y - 0.6, 0.05), tone(C.lime, rng, 0.04).multiplyScalar(1.04)); rg.dispose();
    const sill = bevelBox(w.w + 3.4, 0.9, 2.0, 0.25); acc.add(sill, M(w.x, w.y - 0.75, 0.9), tone(C.stone, rng)); sill.dispose();
    const br = bevelBox(0.9, 1.6, 1.3, 0.3);
    for (const s of [-1, 1]) acc.add(br, M(w.x + s * (w.w / 2 + 0.6), w.y - 1.9, 0.55), tone(C.stone, rng));
    br.dispose();
  }
  await Y();
  // benches (baraza) either side of the stair, in two steps, and the stair itself
  const b1 = bevelBox(33, 4.2, 8.6, 0.5), b2 = bevelBox(33, 2.8, 5.0, 0.45), cap = bevelBox(33.8, 0.6, 5.6, 0.2);
  for (const s of [-1, 1]) {
    acc.add(b1, M(s * 28, 2.1, 4.3), tone(C.stone, rng, 0.05));
    acc.add(b2, M(s * 28, 5.6, 2.5), tone(C.lime, rng, 0.05));
    acc.add(cap, M(s * 28, 7.2, 2.7), tone(C.stone, rng, 0.05).multiplyScalar(1.05));
  }
  b1.dispose(); b2.dispose(); cap.dispose();
  for (let i = 0; i < 7; i++) { // seven steps up to the sill, each a worn slab
    const st = bevelBox(22.4 - i * 0.25, 1.0, 1.5 + (i === 6 ? 1.2 : 0), 0.18);
    acc.add(st, M(0, i + 0.5, 9.0 - i * 1.3 - (i === 6 ? 0.2 : 0)), tone(i % 2 ? C.stone : C.lime, rng, 0.06)); st.dispose();
    if (i < 6) { const fill = bevelBox(22, 1.0, 9.0 - i * 1.3 - 0.6, 0.1); acc.add(fill, M(0, i + 0.5, (9.0 - i * 1.3 - 0.6) / 2), C.stone); fill.dispose(); }
  }
  await Y();
  // string courses, cornice, corner pilasters
  const course = bevelBox(W + 1.6, 1.5, 1.4, 0.35), thin = bevelBox(W + 0.8, 0.7, 0.9, 0.2);
  for (const y of [33.5, 61.5]) { acc.add(course, M(0, y, 0.4), tone(C.stone, rng, 0.04)); acc.add(thin, M(0, y - 1.4, 0.3), tone(C.lime, rng, 0.04)); }
  acc.add(course, M(0, WALL_H - 0.9, 0.7, 0, 0, 0, 1.02, 1.3, 1.6), tone(C.stone, rng, 0.04));
  course.dispose(); thin.dispose();
  const pil = bevelBox(3.4, WALL_H - 7, 0.9, 0.3);
  for (const s of [-1, 1]) acc.add(pil, M(s * 43.2, 7 + (WALL_H - 7) / 2, 0.3), tone(C.lime, rng, 0.03).multiplyScalar(1.03));
  pil.dispose();
  await Y();
  // parapet all round the terrace, with stepped or pointed merlons on the front and sides
  const par = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), g = bevelBox(len + 2, 4.2, 2, 0.3); acc.add(g, M((x0 + x1) / 2, WALL_H + 2.1, (z0 + z1) / 2, 0, Math.atan2(-(z1 - z0), x1 - x0)), tone(C.lime, rng, 0.04)); g.dispose(); };
  par(-44, -1, 44, -1); par(-44, -DEPTH + 1, 44, -DEPTH + 1); par(-44, -1, -44, -DEPTH + 1); par(44, -1, 44, -DEPTH + 1);
  const mer = [bevelBox(5.2, 1.5, 2.2, 0.25), bevelBox(3.5, 1.4, 2.0, 0.25), bevelBox(1.8, 1.4, 1.8, 0.25)];
  const spike = ni(new THREE.ConeGeometry(2.3, 4.2, 4, 1)); spike.rotateY(Math.PI / 4);
  const merlon = (x, z, ry) => {
    const c = tone(C.lime, rng, 0.06);
    if (cfg.merlon === 0) { for (let k = 0; k < 3; k++) acc.add(mer[k], M(x, WALL_H + 4.9 + k * 1.4, z, 0, ry), c); }
    else { acc.add(mer[0], M(x, WALL_H + 4.9, z, 0, ry), c); acc.add(spike, M(x, WALL_H + 7.6, z, 0, ry, 0, 1, 1, 0.42), c); }
  };
  for (let i = 0; i < 12; i++) merlon(-41.25 + i * 7.5, -1, 0);
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) merlon(s * 44, -5.5 - i * 6.4, Math.PI / 2);
  mer.forEach((g) => g.dispose()); spike.dispose();
  await Y();
  // terrace floor, a shade darker toward the middle where the thatch stands
  acc.add(quadGeo([-45, WALL_H, 0], [45, WALL_H, 0], [45, WALL_H, -DEPTH], [-45, WALL_H, -DEPTH]), I4, C.stone.clone().multiplyScalar(0.9));
  if (cfg.plinth) { // a forecourt and the block it stands on, so the house never floats while a world moves it (opts.plinth)
    acc.add(quadGeo([-W / 2, 0, 12], [W / 2, 0, 12], [W / 2, 0, 0], [-W / 2, 0, 0]), I4, C.stone.clone().multiplyScalar(0.88));
    acc.add(quadGeo([-W / 2, -70, 12], [W / 2, -70, 12], [W / 2, 0, 12], [-W / 2, 0, 12]), I4, C.stone.clone().multiplyScalar(0.8), { ao: (x, y) => 0.35 + 0.65 * smoothstep(-40, 0, y) });
  }
  if (cfg.back) { // side and rear walls so the block can stand alone
    acc.add(quadGeo([45, 0, 0], [45, 0, -DEPTH], [45, WALL_H, -DEPTH], [45, WALL_H, 0]), I4, C.lime.clone().multiplyScalar(0.96));
    acc.add(quadGeo([-45, 0, -DEPTH], [-45, 0, 0], [-45, WALL_H, 0], [-45, WALL_H, -DEPTH]), I4, C.lime.clone().multiplyScalar(0.96));
    acc.add(quadGeo([45, 0, -DEPTH], [8, 0, -DEPTH], [8, WALL_H, -DEPTH], [45, WALL_H, -DEPTH]), I4, C.lime);
    acc.add(quadGeo([-8, 0, -DEPTH], [-45, 0, -DEPTH], [-45, WALL_H, -DEPTH], [-8, WALL_H, -DEPTH]), I4, C.lime);
    acc.add(quadGeo([8, SILL + DOOR_H, -DEPTH], [-8, SILL + DOOR_H, -DEPTH], [-8, WALL_H, -DEPTH], [8, WALL_H, -DEPTH]), I4, C.lime);
    acc.add(quadGeo([8, 0, -DEPTH], [-8, 0, -DEPTH], [-8, SILL, -DEPTH], [8, SILL, -DEPTH]), I4, C.lime);
  }
  await Y();
  // the passage: floor, walls, ceiling facing inward; benches, lamp niches, a ceiling of poles
  const IN = { mat: M_PLASTER + M_IN }, x0 = DOOR_W / 2, y0 = SILL, y1 = SILL + DOOR_H, zA = -WALL_T, zB = -DEPTH;
  acc.add(quadGeo([-x0, y0, zA], [x0, y0, zA], [x0, y0, zB], [-x0, y0, zB]), I4, C.stone, IN);
  acc.add(quadGeo([-x0, y1, zB], [x0, y1, zB], [x0, y1, zA], [-x0, y1, zA]), I4, C.wood.clone().multiplyScalar(0.7), { mat: M_WOOD + M_IN });
  // each wall is a slab with three real lamp niches cut into it: a recess 1 m deep with a warm back, a brass lamp
  // and a flame in the outer two, a brass ewer in the middle one (the shader lights the plaster round each flame)
  const archPts = (w, hs, rise, cx, by, n = 6) => {
    const pts = [[cx - w / 2, by], [cx + w / 2, by], [cx + w / 2, by + hs]];
    for (let i = 1; i < n; i++) { const t = i / n; pts.push([cx + w / 2 * Math.cos(t * Math.PI / 2) * (1 - 0.18 * Math.sin(t * Math.PI)), by + hs + rise * Math.pow(Math.sin(t * Math.PI / 2), 0.85)]); }
    pts.push([cx, by + hs + rise]);
    for (let i = n - 1; i >= 1; i--) { const t = i / n; pts.push([cx - w / 2 * Math.cos(t * Math.PI / 2) * (1 - 0.18 * Math.sin(t * Math.PI)), by + hs + rise * Math.pow(Math.sin(t * Math.PI / 2), 0.85)]); }
    pts.push([cx - w / 2, by + hs]);
    return pts.map((q) => new THREE.Vector2(q[0], q[1]));
  };
  const NZ = NICHE_Z, NW = 3.0, NHS = 3.3, NRISE = 2.0, NY = y0 + NICHE_Y, ND = 1.0;
  const lampG = lathe([[0.0, 0], [0.6, 0.05], [0.25, 0.3], [0.7, 0.8], [0.8, 1.3], [0.45, 1.8], [0.2, 2.0], [0.3, 2.3], [0.0, 2.5]], 8);
  const ewer = lathe([[0.0, 0], [0.5, 0], [0.6, 0.15], [0.35, 0.55], [0.3, 0.9], [0.62, 1.4], [0.7, 1.8], [0.4, 2.3], [0.2, 2.6], [0.3, 2.8], [0.0, 2.9]], 8);
  const flame = lathe([[0.0, 0], [0.2, 0.18], [0.24, 0.4], [0.14, 0.8], [0.0, 1.2]], 6);
  const jar = lathe([[0.0, 0], [0.5, 0], [0.9, 0.6], [1.0, 1.2], [0.8, 1.8], [0.5, 2.1], [0.62, 2.3], [0.5, 2.35], [0.0, 2.2]], 9);
  const bench = bevelBox(1.7, 2.6, 16.5, 0.3), cush = bevelBox(1.5, 0.35, 5.2, 0.15);
  const nring = new THREE.Shape(archPts(NW + 1.2, NHS + 0.35, NRISE + 0.6, 0, -0.35, 5)); nring.holes.push(new THREE.Path(archPts(NW, NHS, NRISE, 0, 0, 5)));
  const ng = ni(new THREE.ExtrudeGeometry(nring, { depth: 0.16, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.14, bevelSegments: 1, curveSegments: 1 }));
  for (const s of [-1, 1]) {
    await Y();
    // shape x runs along the passage: world z = s * shape x (see the turn below), so one outline serves both walls mirrored
    const xa = s > 0 ? zB : -zA, xb = s > 0 ? zA : -zB;
    const wsh = new THREE.Shape([[xa, y0], [xb, y0], [xb, y1], [xa, y1]].map((q) => new THREE.Vector2(q[0], q[1])));
    for (const z of NZ) wsh.holes.push(new THREE.Path(archPts(NW, NHS, NRISE, s > 0 ? z : -z, NY)));
    const wg = ni(new THREE.ExtrudeGeometry(wsh, { depth: ND, bevelEnabled: false, curveSegments: 1 }));
    // s = +1: turn -90 degrees about y (shape x -> world z, extrusion -> world -x); s = -1: +90 degrees (shape x -> world -z, extrusion -> world +x)
    acc.add(wg, M(s * (x0 + ND), 0, 0, 0, -s * Math.PI / 2, 0), C.lime, { ...IN, ao: (x) => (Math.abs(x) > x0 + 0.05 ? 0.78 : 1) }); wg.dispose();
    await Y();
    acc.add(bench, M(s * (x0 - 0.85), y0 + 1.3, -20.6), tone(C.stone, rng, 0.05), IN);
    acc.add(cush, M(s * (x0 - 0.85), y0 + 2.75, -17.2 - (s > 0 ? 0 : 6.4)), s > 0 ? C.kanga.clone().multiplyScalar(0.8) : C.blue.clone().multiplyScalar(0.9), { mat: M_CLOTH + M_IN, w: () => 0 });
    acc.add(jar, M(s * (x0 - 0.9), y0 + 2.6, s > 0 ? -26.6 : -14.4, 0, 0, 0, 0.8), tone(C.clay, rng, 0.1), IN);
    for (let k = 0; k < 3; k++) {
      const z = NZ[k], ry = -s * Math.PI / 2;
      acc.add(ng, M(s * (x0 - 0.02), NY, z, 0, ry), tone(C.lime, rng, 0.05).multiplyScalar(1.04), IN);
      const bq = s > 0 ? quadGeo([x0 + ND - 0.02, NY - 0.2, z + 1.7], [x0 + ND - 0.02, NY + 5.6, z + 1.7], [x0 + ND - 0.02, NY + 5.6, z - 1.7], [x0 + ND - 0.02, NY - 0.2, z - 1.7])
        : quadGeo([-x0 - ND + 0.02, NY - 0.2, z - 1.7], [-x0 - ND + 0.02, NY + 5.6, z - 1.7], [-x0 - ND + 0.02, NY + 5.6, z + 1.7], [-x0 - ND + 0.02, NY - 0.2, z + 1.7]);
      acc.add(bq, I4, C.lime.clone().lerp(C.clay, 0.3).multiplyScalar(0.85), IN); bq.dispose();
      if (k === 1) acc.add(ewer, M(s * (x0 + 0.47), NY, z, 0, 0, 0, 0.65), tone(C.brass, rng, 0.08), { mat: M_BRASS + M_IN });
      else {
        acc.add(lampG, M(s * (x0 + 0.47), NY, z, 0, 0, 0, 0.6), tone(C.brass, rng, 0.08), { mat: M_BRASS + M_IN });
        acc.add(flame, M(s * (x0 + 0.47), NY + 1.4, z, 0, 0, 0, 0.4, 0.62, 0.4), C.flame, { mat: M_FLAME + M_IN, w: (x, y) => clamp((y - NY - 1.4) / 0.75, 0, 1) * 0.45 });
      }
    }
  }
  bench.dispose(); cush.dispose(); ng.dispose(); lampG.dispose(); ewer.dispose(); flame.dispose(); jar.dispose();
  await Y();
  const pole = ni(new THREE.CylinderGeometry(0.42, 0.5, DOOR_W, 6, 1, true)), nPoles = Math.round(17 * detail);
  for (let i = 0; i < nPoles; i++) acc.add(pole, M(0, y1 - 0.5, zA - 1 - (i + 0.5) * ((DEPTH - WALL_T - 1) / nPoles), 0, 0, Math.PI / 2 + (rng() - 0.5) * 0.03), tone(C.wood, rng, 0.25), { mat: M_WOOD + M_IN });
  pole.dispose();
  const pbeam = bevelBox(0.9, 1.1, DEPTH - WALL_T, 0.2);
  for (const s of [-1, 1]) acc.add(pbeam, M(s * (x0 - 0.5), y1 - 1.3, (zA + zB) / 2), tone(C.wood, rng, 0.1), { mat: M_CARVED + M_IN });
  pbeam.dispose();
}
// lamp niches of the passage: their z, the height of their sills above the door sill, and where the flames are (for the shader)
const NICHE_Z = [-13.5, -19.5, -25.5], NICHE_Y = 8.0;

// The door: coral-stone surround with a chain of real links, the carved wooden frame with its
// rosettes, the hood, and the two leaves (modelled shut in the reveal, hinged in the vertex shader).
async function buildDoor(acc, C, cfg, rng, Y) {
  const CELL = 1.45, x0 = DOOR_W / 2, yT = SILL + DOOR_H;
  const ros = rosetteGeo(8), ros12 = rosetteGeo(12);
  const boss = bossParts(false);
  // wooden frame: inner bead, carved band two cells wide, outer bead; lintel four cells tall
  const beadV = ni(new THREE.CylinderGeometry(0.42, 0.42, DOOR_H + 0.4, 6, 1)), jamb = bevelBox(CELL * 2, DOOR_H - 0.25, 1.3, 0.1);
  for (const s of [-1, 1]) {
    acc.add(beadV, M(s * (x0 + 0.33), SILL + DOOR_H / 2, 1.05), tone(C.wood, rng, 0.1).multiplyScalar(1.15), { mat: M_WOOD });
    acc.add(jamb, M(s * (x0 + 0.7 + CELL), SILL + 0.25 + (DOOR_H - 0.25) / 2, 0.75), C.wood, { mat: M_CARVED });
    acc.add(beadV, M(s * (x0 + 0.7 + CELL * 2 + 0.3), SILL + DOOR_H / 2, 1.0, 0, 0, 0, 1.1, 1, 1.1), tone(C.wood, rng, 0.1), { mat: M_WOOD });
    // foot and capital plates with a rosette each
    for (const y of [SILL + 1.7, yT - 1.6]) {
      const pl = bevelBox(3.1, 3.1, 0.5, 0.2); acc.add(pl, M(s * (x0 + 0.7 + CELL), y, 1.5), tone(C.wood, rng, 0.08).multiplyScalar(1.1), { mat: M_WOOD }); pl.dispose();
      acc.add(ros, M(s * (x0 + 0.7 + CELL), y, 1.72, 0, 0, 0, 1.4, 1.4, 1.5), tone(C.wood, rng, 0.08).multiplyScalar(1.35), { mat: M_WOOD });
    }
  }
  beadV.dispose(); jamb.dispose();
  const linW = CELL * 16, lintel = bevelBox(linW, CELL * 4, 1.5, 0.12);
  acc.add(lintel, M(0, yT + CELL * 2, 0.85), C.wood, { mat: M_CARVED }); lintel.dispose();
  const plank = bevelBox(linW - 3.2, CELL * 2.4, 0.5, 0.2); acc.add(plank, M(0, yT + CELL * 2, 1.75), tone(C.wood, rng, 0.06).multiplyScalar(1.12), { mat: M_WOOD }); plank.dispose();
  const nR = cfg.rosettes, stepR = (linW - 3.2) / nR;
  for (let i = 0; i < nR; i++) {
    const x = (i - (nR - 1) / 2) * stepR, big = i === (nR - 1) / 2;
    acc.add(big ? ros12 : ros, M(x, yT + CELL * 2, 2.0, 0, 0, (i * 0.37) % 0.6, big ? 1.72 : 1.42, big ? 1.72 : 1.42, 1.7), tone(C.wood, rng, 0.08).multiplyScalar(big ? 1.5 : 1.3), { mat: M_WOOD });
    if (i < nR - 1) { const m = M(x + stepR / 2, yT + CELL * 2, 2.0, 0, 0, 0, 0.42, 0.42, 0.46), bc = tone(C.brass, rng, 0.1); for (const g of boss) acc.add(g, m, bc, { mat: M_BRASS }); }
  }
  const beadH = ni(new THREE.CylinderGeometry(0.42, 0.42, linW + 1.2, 6, 1)); beadH.rotateZ(Math.PI / 2);
  acc.add(beadH, M(0, yT + 0.15, 1.2), tone(C.wood, rng, 0.1).multiplyScalar(1.15), { mat: M_WOOD });
  acc.add(beadH, M(0, yT + CELL * 4 + 0.2, 1.1), tone(C.wood, rng, 0.1), { mat: M_WOOD }); beadH.dispose();
  await Y();
  // threshold
  const thr = bevelBox(DOOR_W + 6.4, 0.6, 3.6, 0.2); acc.add(thr, M(0, SILL - 0.05, -0.2), tone(C.stone, rng, 0.04).multiplyScalar(0.9)); thr.dispose();
  await Y();
  // stone surround: stepped pilasters with base and capital, hood with dentils
  const pilA = bevelBox(3.6, 30, 1.7, 0.3), pilB = bevelBox(1.5, 31.4, 1.0, 0.25), blk = bevelBox(4.6, 2.2, 2.4, 0.35);
  const px = x0 + 0.7 + CELL * 2 + 0.75 + 1.8;
  for (const s of [-1, 1]) {
    acc.add(pilA, M(s * px, SILL + 15, 0.6), tone(C.lime, rng, 0.03).multiplyScalar(1.03));
    acc.add(pilB, M(s * (px + 2.5), SILL + 15.7, 0.35), tone(C.stone, rng, 0.04));
    acc.add(blk, M(s * px, SILL + 1.1, 0.8), tone(C.stone, rng, 0.04));
    acc.add(blk, M(s * px, SILL + 28.9, 0.8), tone(C.stone, rng, 0.04));
  }
  pilA.dispose(); pilB.dispose(); blk.dispose();
  const hoodY = yT + CELL * 4 + 1.5, hood = bevelBox(2 * px + 7.5, 1.9, 3.6, 0.4), hood2 = bevelBox(2 * px + 4, 1.1, 2.6, 0.3), dent = bevelBox(0.9, 0.9, 1.0, 0.15);
  acc.add(hood, M(0, hoodY, 1.5), tone(C.stone, rng, 0.03).multiplyScalar(1.05)); acc.add(hood2, M(0, hoodY + 1.45, 1.1), tone(C.lime, rng, 0.03));
  for (let i = -11; i <= 11; i++) acc.add(dent, M(i * 1.55, hoodY - 1.35, 2.1), tone(C.lime, rng, 0.06));
  hood.dispose(); hood2.dispose(); dent.dispose();
  await Y();
  // chain border: oval links lying flat alternate with links seen edge on, up both pilasters and across under the hood
  const link = ni(new THREE.TorusGeometry(0.5, 0.16, 4, 8)), lc = C.stone.clone().multiplyScalar(1.12);
  const chain = (ax, ay, bx, by) => {
    const len = Math.hypot(bx - ax, by - ay), n = Math.round(len / 1.05), rz = Math.atan2(by - ay, bx - ax);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = lerp(ax, bx, t), y = lerp(ay, by, t), m = new THREE.Matrix4();
      m.multiply(M(x, y, 1.52, 0, 0, rz)).multiply(M(0, 0, 0, i % 2 ? Math.PI / 2 : 0, 0, 0, 1.3, 0.9, 1));
      acc.add(link, m, tone(lc, rng, 0.07));
    }
  };
  chain(-px, SILL + 2.6, -px, SILL + 27.4); chain(px, SILL + 2.6, px, SILL + 27.4);
  link.dispose();
  await Y();
  // leaves: dark hardwood framed in deep relief. Each leaf is a board with two stiles and five rails standing proud of it
  // (chain borders and carving are cut in the shader, which knows this layout: see the leaf branch of FRAG), rosettes on
  // the three middle rails, and in each of the four sunk panels a row of three polished brass domes 1.8 m across.
  // The right leaf carries the carved centre post. Modelled shut in the reveal, hinged in the vertex shader.
  const IN = M_IN, lr = rng.fork('door-leaves');
  for (let i = 0; i < 41; i++) rng();          // the old leaves drew 42 numbers here: keep the rest of the house as it was
  const yb = SILL + 0.15, LH = DOOR_H - 0.3, LEAF = M_LEAF + IN;
  const board = bevelBox(7.8, LH, 0.5, 0.12), stile = bevelBox(0.62, LH, 0.85, 0.17), rail = bevelBox(6.56, 1.5, 0.8, 0.17), bead = bevelBox(6.5, 0.2, 0.3, 0.09);
  const [domeG, finG] = bossParts(true);
  for (const s of [-1, 1]) {
    const o = { hinge: s }, wc = tone(C.leafWood, lr, 0.05);
    acc.add(board, M(s * 4, yb + LH / 2, -2.75), wc.clone().multiplyScalar(0.86), { ...o, mat: LEAF });
    for (const ax of [0.41, 7.59]) acc.add(stile, M(s * ax, yb + LH / 2, -2.575), tone(wc, lr, 0.05), { ...o, mat: LEAF });
    for (let k = 0; k < 5; k++) {
      const y = yb + 0.75 + k * 5.05;
      acc.add(rail, M(s * 4, y, -2.56), tone(wc, lr, 0.06), { ...o, mat: LEAF });
      // a bead under and over each sunk panel, so its edge is a step and not a line
      if (k < 4) acc.add(bead, M(s * 4, y + 0.9, -2.42), wc.clone().multiplyScalar(1.12), { ...o, mat: M_WOOD + IN });
      if (k > 0) acc.add(bead, M(s * 4, y - 0.9, -2.42), wc.clone().multiplyScalar(1.12), { ...o, mat: M_WOOD + IN });
      if (k > 0 && k < 4) for (let c = 0; c < 3; c++) acc.add(ros, M(s * (1.65 + c * 2.25), y, -2.17, 0, 0, c * 0.4 + k, 0.6, 0.6, 0.95), tone(wc, lr, 0.08).multiplyScalar(1.45), { ...o, mat: M_WOOD + IN });
    }
    await Y();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const m = M(s * (1.65 + c * 2.25), yb + 3.275 + r * 5.05, -2.5, 0, 0, 0, 0.9, 0.9, 0.9), bc = tone(C.brass, lr, 0.07);
      acc.add(domeG, m, bc, { ...o, mat: M_BRASS + IN }); acc.add(finG, m, bc, { ...o, mat: M_BRASS + IN });
    }
    await Y();
  }
  board.dispose(); stile.dispose(); rail.dispose(); bead.dispose(); domeG.dispose(); finG.dispose();
  const post = bevelBox(1.4, DOOR_H - 0.5, 0.9, 0.2), o = { hinge: 1 };
  acc.add(post, M(0.15, SILL + DOOR_H / 2, -2.1), C.leafWood.clone().multiplyScalar(1.2), { ...o, mat: M_CARVED + IN }); post.dispose();
  await Y();
  for (let i = 0; i < 7; i++) { const m = M(0.15, SILL + 2.2 + i * 2.95, -1.66, 0, 0, 0, 0.36, 0.36, 0.42), bc = tone(C.brass, lr, 0.08); for (const g of boss) acc.add(g, m, bc, { ...o, mat: M_BRASS + IN }); }
  const fin = lathe([[0.0, -0.7], [0.5, -0.5], [0.75, 0], [0.5, 0.45], [0.2, 0.7], [0.0, 1.0]], 8);
  acc.add(fin, M(0.15, yT - 0.9, -1.6, Math.PI / 2, 0, 0, 0.9, 0.9, 0.9), tone(C.brass, lr, 0.1), { ...o, mat: M_BRASS + IN }); fin.dispose();
  ros.dispose(); ros12.dispose(); boss.forEach((g) => g.dispose());
  return { hood: [new THREE.Vector3(-(px + 3.4), hoodY - 0.7, 0), new THREE.Vector3(px + 3.4, hoodY + 1.6, 3.0)], px };
}

// Cloth panel hanging in the xy plane from its top edge; weight 0 at the rail, 1 at the hem.
function clothGeo(w, h, gather = 5) {
  const g = new THREE.PlaneGeometry(w, h, 6, 7), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin((x / w) * Math.PI * gather) * 0.28 * (0.4 + 0.6 * (0.5 - y / h))); }
  g.translate(0, -h / 2, 0); return ni(g);
}

// Balcony, shutters, bars and curtains.
async function buildOpenings(acc, C, cfg, rng, wins, Y) {
  const CELL = 1.45, bw = cfg.balW * CELL, fy = 39.6, ty = 38 * CELL, bz = 5.6;
  const postG = lathe([[0.5, 0], [0.5, 0.05], [0.34, 0.08], [0.44, 0.15], [0.5, 0.21], [0.35, 0.29], [0.29, 0.5], [0.29, 0.72], [0.42, 0.8], [0.3, 0.86], [0.45, 0.94], [0.5, 1]], 8);
  // corbels and floor
  const corb = bevelBox(1.1, 1.5, bz - 0.4, 0.25), floor = bevelBox(2 * bw + 1.6, 0.9, bz + 0.6, 0.25);
  const nC = Math.round(bw / 1.6);
  for (let i = -nC; i <= nC; i++) acc.add(corb, M(i * (bw / nC), fy - 1.0, bz / 2 - 0.2), tone(C.wood, rng, 0.12), { mat: M_WOOD });
  acc.add(floor, M(0, fy, bz / 2), tone(C.wood, rng, 0.05), { mat: M_WOOD }); corb.dispose(); floor.dispose();
  await Y();
  // posts along the front and at the wall
  const nB = cfg.balW >= 10 ? 6 : 5, pH = ty - fy - 0.4, bayW = (2 * bw) / nB;
  for (let i = 0; i <= nB; i++) acc.add(postG, M(-bw + i * bayW, fy + 0.4, bz - 0.5, 0, 0, 0, 1.25, pH, 1.25), tone(C.wood, rng, 0.1).multiplyScalar(1.1), { mat: M_WOOD });
  for (const s of [-1, 1]) acc.add(postG, M(s * bw, fy + 0.4, 0.9, 0, 0, 0, 1.25, pH, 1.25), tone(C.wood, rng, 0.1), { mat: M_WOOD });
  await Y();
  // balustrade and screens of lattice; a hand rail; an open band (style 1) or a small shutter band (style 0)
  const lat = (x0, x1, y0, y1, z, side) => {
    const g = side ? quadGeo([0, y0, x1], [0, y0, x0], [0, y1, x0], [0, y1, x1]) : quadGeo([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]);
    acc.add(g, side ? M(side * z, 0, 0, 0, 0, 0, side, 1, 1) : M(0, 0, z), tone(C.wood, rng, 0.08), { mat: M_LATTICE }); g.dispose();
  };
  const railY = fy + 5.4, topY = cfg.balStyle === 0 ? ty - 0.2 : ty - 3.6, midY = cfg.balStyle === 0 ? railY + 4.2 : ty - 3.6;
  lat(-bw, bw, fy + 0.4, railY, bz - 0.55, 0); lat(0.9, bz - 0.5, fy + 0.4, railY, bw, 1); lat(0.9, bz - 0.5, fy + 0.4, railY, bw, -1);
  if (cfg.balStyle === 0) { lat(-bw, bw, midY, topY, bz - 0.55, 0); lat(0.9, bz - 0.5, midY, topY, bw, 1); lat(0.9, bz - 0.5, midY, topY, bw, -1); }
  else { lat(-bw, bw, topY, ty - 0.2, bz - 0.55, 0); lat(0.9, bz - 0.5, topY, ty - 0.2, bw, 1); lat(0.9, bz - 0.5, topY, ty - 0.2, bw, -1); }
  const rail = bevelBox(2 * bw + 1.2, 0.7, 0.9, 0.2), railS = bevelBox(0.9, 0.7, bz - 0.4, 0.2);
  for (const y of cfg.balStyle === 0 ? [railY, midY] : [railY, topY]) {
    acc.add(rail, M(0, y, bz - 0.5), tone(C.wood, rng, 0.08).multiplyScalar(1.15), { mat: M_WOOD });
    for (const s of [-1, 1]) acc.add(railS, M(s * bw, y, bz / 2 + 0.2), tone(C.wood, rng, 0.08).multiplyScalar(1.1), { mat: M_WOOD });
  }
  rail.dispose(); railS.dispose();
  await Y();
  // dark behind the open band, curtains in it that blow out
  acc.add(quadGeo([-bw, fy + 0.4, 0.5], [bw, fy + 0.4, 0.5], [bw, ty, 0.5], [-bw, ty, 0.5]), I4, C.void, { mat: M_VOID });
  const cg = clothGeo(bayW * 0.9, midY - railY + 1.5);
  for (let i = 0; i < nB; i++) if (cfg.balStyle === 1 || i % 2 === 0) acc.add(cg, M(-bw + (i + 0.5) * bayW, midY - 0.1, bz - 1.2), tone(C.cloth, rng, 0.05), { mat: M_CLOTH, w: (x, y) => clamp((midY - 0.1 - y) / (midY - railY + 1.5), 0, 1) });
  cg.dispose();
  await Y();
  // carved fascia one cell tall, then the awning of thatch on a board
  const fas = bevelBox(2 * bw + 1.0, CELL, 0.7, 0.08), fasS = bevelBox(0.7, CELL, bz, 0.08);
  acc.add(fas, M(0, ty + CELL / 2, bz - 0.35), C.wood.clone().multiplyScalar(1.1), { mat: M_CARVED });
  for (const s of [-1, 1]) acc.add(fasS, M(s * (bw + 0.15), ty + CELL / 2, bz / 2), C.wood.clone().multiplyScalar(1.05), { mat: M_CARVED });
  fas.dispose(); fasS.dispose();
  const aw = bevelBox(2 * bw + 3.6, 0.8, bz + 3.2, 0.3), slope = 0.36;
  acc.add(aw, M(0, ty + CELL + 1.5, bz / 2 + 0.6, slope), tone(C.thatch, rng, 0.06), { mat: M_THATCH }); aw.dispose();
  const drop = bevelBox(2 * bw + 3.0, 1.3, 0.35, 0.12);
  acc.add(drop, M(0, ty + CELL + 0.05, bz + 1.95, -0.2), tone(C.thatch, rng, 0.06).multiplyScalar(0.8), { mat: M_THATCH }); drop.dispose();
  postG.dispose();
  await Y();
  // shutters, bars, curtains
  const bar = bevelBox(0.42, 1, 0.42, 0.1);
  for (const w of wins) {
    if (w.kind === 'shut') {
      const lh = w.hs + w.rise * 0.45, leaf = bevelBox(w.w / 2 - 0.1, lh, 0.34, 0.1), fr = bevelBox(0.5, lh + 0.3, 0.55, 0.12);
      for (const s of [-1, 1]) {
        const ang = s * rng.range(1.0, 1.9), col = tone(C.blue, rng, 0.12), m = new THREE.Matrix4();
        m.multiply(M(w.x + s * (w.w / 2 + 0.1), w.y + lh / 2, 0.75, 0, ang, 0)).multiply(M(-s * (w.w / 4), 0, 0));
        acc.add(leaf, m, col, { mat: M_PAINT });
        const m2 = new THREE.Matrix4(); m2.multiply(M(w.x + s * (w.w / 2 + 0.1), w.y + lh / 2, 0.75, 0, ang, 0)).multiply(M(-s * (w.w / 2 - 0.2), 0, 0));
        acc.add(fr, m2, col.clone().multiplyScalar(0.8), { mat: M_PAINT });
      }
      leaf.dispose(); fr.dispose();
    } else if (w.kind === 'bars') {
      for (let i = 0; i < 5; i++) acc.add(bar, M(w.x + (i - 2) * (w.w / 5.4), w.y + (w.hs + w.rise) / 2, -1.0, 0, 0.78, 0, 1, w.hs + w.rise, 1), tone(C.wood, rng, 0.2).multiplyScalar(0.7), { mat: M_WOOD });
      acc.add(bar, M(w.x, w.y + w.hs * 0.55, -1.0, 0, 0, Math.PI / 2, 1, w.w, 1), tone(C.wood, rng, 0.2).multiplyScalar(0.7), { mat: M_WOOD });
    } else if (w.kind === 'curtain') {
      const h = w.hs + w.rise * 0.5, cg2 = clothGeo(w.w * 0.96, h, 4);
      acc.add(cg2, M(w.x, w.y + h, -1.3), tone(C.cloth, rng, 0.05), { mat: M_CLOTH, w: (x, y) => clamp((w.y + h - y) / h, 0, 1) * 0.8 }); cg2.dispose();
      const rod = bevelBox(w.w + 0.6, 0.4, 0.4, 0.1); acc.add(rod, M(w.x, w.y + h + 0.1, -1.2), tone(C.wood, rng, 0.1), { mat: M_WOOD }); rod.dispose();
    }
  }
  bar.dispose();
  return { balcony: [new THREE.Vector3(-bw - 0.6, fy - 0.2, 0), new THREE.Vector3(bw + 0.6, ty + CELL + 2.4, bz + 0.6)], bw, ty };
}

// Plasterwork on the plain wall: carved medallions, a frieze of small blind niches under the cornice, wooden spouts.
async function buildOrnament(acc, C, cfg, rng, bw, Y) {
  const med = rosetteGeo(12), back = ni(new THREE.CylinderGeometry(1.12, 1.2, 0.3, 16, 1));
  back.rotateX(Math.PI / 2);
  const medal = (x, y, r) => {
    acc.add(back, M(x, y, 0.12, 0, 0, 0, r, r, 1), tone(C.stone, rng, 0.04));
    acc.add(med, M(x, y, 0.27, 0, 0, rng() * 0.5, r, r, r * 0.8), tone(C.lime, rng, 0.03).multiplyScalar(1.05));
  };
  if (cfg.upperWin === 3) { medal(-13.5, 73, 2.5); medal(13.5, 73, 2.5); } else { for (const x of [-24, -8, 8, 24]) medal(x, 73.5, 1.9); }
  const mx = (bw + 25.2) / 2; medal(-mx, 49, 2.1); medal(mx, 49, 2.1);
  medal(-36.5, 24, 1.6); medal(36.5, 24, 1.6);
  med.dispose(); back.dispose();
  await Y();
  const ring = new THREE.Shape(); archPath(ring, 2.7, 2.3, 1.5, 0, 4);
  const hole = new THREE.Path(); archPath(hole, 1.8, 2.0, 1.1, 0.35, 4, true); ring.holes.push(hole);
  const rg = ni(new THREE.ExtrudeGeometry(ring, { depth: 0.16, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.14, bevelSegments: 1, curveSegments: 1 }));
  const inner = new THREE.Shape(); archPath(inner, 1.9, 2.0, 1.15, 0.3, 4);
  const ig = ni(new THREE.ShapeGeometry(inner, 1));
  for (let i = 0; i < 24; i++) {
    if ((i & 7) === 0) await Y();
    const x = -40.25 + i * 3.5;
    acc.add(rg, M(x, 81.4, 0.04), tone(C.lime, rng, 0.04).multiplyScalar(1.03));
    acc.add(ig, M(x, 81.4, 0.03), tone(i % 3 === 1 ? C.blue.clone().lerp(C.lime, 0.55) : C.stone, rng, 0.08).multiplyScalar(0.62));
  }
  rg.dispose(); ig.dispose();
  await Y();
  const spout = bevelBox(1.0, 0.8, 5.0, 0.2), lip = bevelBox(1.4, 0.5, 1.2, 0.15);
  for (const x of [-37, -12.5, 12.5, 37]) {
    acc.add(spout, M(x, WALL_H - 1.2, 2.6, 0.16), tone(C.wood, rng, 0.2), { mat: M_WOOD });
    acc.add(lip, M(x, WALL_H - 1.75, 4.9, 0.16), tone(C.wood, rng, 0.2).multiplyScalar(0.8), { mat: M_WOOD });
  }
  spout.dispose(); lip.dispose();
}

// Roof terrace: the thatched (makuti) shade on poles, in shaggy tiers, plus pots, a lamp niche and a cloth on the balcony rail.
async function buildRoof(acc, C, cfg, rng, detail, bal, Y) {
  const tw = cfg.thatchHalf, zF = 0.8, zR = -27.5, zM = -13.5, yE = 98.2, yR = 110, ridge = cfg.thatchHip ? tw - 9 : tw + 2.5, ex = tw + 3.2;
  // roof surface: t = 0 at the eave, 1 at the ridge
  const hx = (t) => lerp(ex, ridge, t), fz = (t) => lerp(zF, zM, t), rz = (t) => lerp(zR, zM, t), ry = (t) => lerp(yE, yR, t);
  const pos = [], wts = [], TIERS = 5;
  const tri = (a, b, c) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); wts.push(a[3], b[3], c[3]); };
  for (let k = 0; k < TIERS; k++) {
    const t0 = k / TIERS, t1 = Math.min(1, (k + 1.25) / TIERS), out = 0.55, dropY = 0.75;
    // four sides: front, right, back, left; each a strip from lower (jagged, pushed out) to upper edge
    const corners = (t, o) => [[-hx(t) - o, fz(t) + o], [hx(t) + o, fz(t) + o], [hx(t) + o, rz(t) - o], [-hx(t) - o, rz(t) - o]];
    const lo = corners(t0, out), hi = corners(t1, 0);
    for (let sd = 0; sd < 4; sd++) {
      const a0 = lo[sd], a1 = lo[(sd + 1) % 4], b0 = hi[sd], b1 = hi[(sd + 1) % 4];
      const n = Math.max(2, Math.round(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / 2.6));
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const u = i / n, jag = (rng() - 0.5) * 0.9 - (i % 2) * 0.45;
        const L = [lerp(a0[0], a1[0], u), ry(t0) - dropY + jag, lerp(a0[1], a1[1], u), 1], H = [lerp(b0[0], b1[0], u), ry(t1), lerp(b0[1], b1[1], u), 0];
        if (prev) { tri(prev[0], L, H); tri(prev[0], H, prev[1]); }
        prev = [L, H];
      }
    }
  }
  await Y();
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.computeVertexNormals();
  acc.add(tg, I4, C.thatch, { mat: M_THATCH, wa: wts, ao: (x, y) => 0.8 + 0.3 * smoothstep(yE, yR, y) + (rng() - 0.5) * 0.12 }); tg.dispose();
  const roll = ni(new THREE.CylinderGeometry(1.0, 1.0, 2 * ridge + 2.4, 7, 4)); roll.rotateZ(Math.PI / 2);
  acc.add(roll, M(0, yR - 0.15, zM), C.thatch.clone().multiplyScalar(1.15), { mat: M_THATCH }); roll.dispose();
  await Y();
  // dark underside, poles, beams and braces
  acc.add(quadGeo([-ex, yE - 0.3, zR], [ex, yE - 0.3, zR], [ex, yE - 0.3, zF], [-ex, yE - 0.3, zF]), I4, C.wood.clone().multiplyScalar(0.45), { mat: M_WOOD });
  const pole = ni(new THREE.CylinderGeometry(0.42, 0.55, 1, 6, 1)), beam = bevelBox(2 * tw + 3, 0.8, 0.8, 0.2), brace = bevelBox(0.45, 4.6, 0.45, 0.1);
  const nP = Math.max(3, Math.round(tw / 4.6));
  for (const z of [-3.6, -26.2]) {
    for (let i = 0; i <= nP; i++) {
      const x = -tw + (2 * tw * i) / nP;
      acc.add(pole, M(x, WALL_H + (yE - WALL_H) / 2, z, (rng() - 0.5) * 0.04, rng() * 6, (rng() - 0.5) * 0.04, 1, yE - WALL_H, 1), tone(C.wood, rng, 0.2), { mat: M_WOOD });
      if (i < nP) acc.add(brace, M(x + 1.5, yE - 2.1, z, 0, 0, -0.75), tone(C.wood, rng, 0.2), { mat: M_WOOD });
      if (i > 0) acc.add(brace, M(x - 1.5, yE - 2.1, z, 0, 0, 0.75), tone(C.wood, rng, 0.2), { mat: M_WOOD });
    }
    acc.add(beam, M(0, yE - 0.5, z), tone(C.wood, rng, 0.1), { mat: M_WOOD });
  }
  pole.dispose(); beam.dispose(); brace.dispose();
  await Y();
  // clay pots with shrubs on the benches and jars on the terrace
  const pot = lathe([[0.0, 0], [0.55, 0], [0.9, 0.5], [1.0, 1.0], [0.8, 1.5], [0.6, 1.7], [0.75, 1.85], [0.62, 1.9]], 9);
  const leafG = ni(new THREE.OctahedronGeometry(1, 0));
  const shrub = (x, y, z, s) => {
    acc.add(pot, M(x, y, z, 0, rng() * 6, 0, s, s, s), tone(C.clay, rng, 0.12));
    for (let i = 0; i < 22; i++) { const a = rng() * 6.283, r = Math.sqrt(rng()) * 1.5 * s, hgt = (1.9 + rng() * 2.6) * s, k = s * (0.45 + rng() * 0.4);
      acc.add(leafG, M(x + Math.cos(a) * r, y + hgt, z + Math.sin(a) * r, rng() * 1.2 - 0.6, a, rng() * 1.2 - 0.6, k * 1.5, k * 0.35, k * 0.8), tone(C.leaf, rng, 0.35).lerp(C.thatch, rng() * 0.3), { mat: M_CLOTH, w: () => 0.1 }); }
  };
  shrub(-(cfg.potX), 7.5, 3.4, 1.5); shrub(cfg.potX + 3, 7.5, 2.6, 1.2);
  if (cfg.thirdPot) shrub(-cfg.potX - 9, 7.5, 2.4, 1.0);
  const nJ = Math.round(5 * detail);
  for (let i = 0; i < nJ; i++) acc.add(pot, M((tw + 6 + rng() * 6) * (i % 2 ? 1 : -1), WALL_H, -6 - rng() * 16, 0, rng() * 6, 0, 1.3 + rng() * 0.8), tone(C.clay, rng, 0.15));
  pot.dispose(); leafG.dispose();
  await Y();
  // a lamp niche beside the door with a brass lamp
  const lx = -(bal.px + 8.5), ly = SILL + 10, nr = new THREE.Shape(); archPath(nr, 4.4, 3.4, 2.4, 0, 5);
  const nh = new THREE.Path(); archPath(nh, 3.0, 3.0, 1.9, 0.45, 5, true); nr.holes.push(nh);
  const ng = ni(new THREE.ExtrudeGeometry(nr, { depth: 0.3, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.2, bevelSegments: 1, curveSegments: 1 }));
  acc.add(ng, M(lx, ly, 0.05), tone(C.lime, rng, 0.03).multiplyScalar(1.04)); ng.dispose();
  acc.add(quadGeo([-1.5, 0.45, 0], [1.5, 0.45, 0], [1.5, 5.3, 0], [-1.5, 5.3, 0]), M(lx, ly, 0.08), C.void, { mat: M_VOID });
  const lamp = lathe([[0.0, 0], [0.6, 0.05], [0.25, 0.3], [0.7, 0.8], [0.8, 1.3], [0.45, 1.8], [0.2, 2.0], [0.3, 2.3], [0.0, 2.5]], 8);
  acc.add(lamp, M(lx, ly + 0.5, 0.75, 0, 0, 0, 0.85), C.brass, { mat: M_BRASS }); lamp.dispose();
  // a rose cloth thrown over the balcony rail
  const kg = clothGeo(4.6, 5.2, 3), kx = bal.bw * cfg.kangaX, ky = 39.6 + 5.9;
  acc.add(kg, M(kx, ky, 5.75), C.kanga, { mat: M_CLOTH, w: (x, y) => clamp((ky - y) / 5.2, 0, 1) * 0.35 }); kg.dispose();
  return { thatch: [new THREE.Vector3(-ex + 0.5, yE - 0.3, zR + 0.5), new THREE.Vector3(ex - 0.5, yE + 2.5, zF - 0.5)], lamp: new THREE.Vector3(lx, ly + 2, 1.5) };
}

// ---------------------------------------------------------------- the five hours
// Sun directions are the brief's with z mirrored, so that the front (which faces +z) is lit as it
// would be standing in the open; a world sets its own with setLight().
const LOOKS = {
  morning: { sun: [0.78, 0.45, 0.44], sunColor: ['#fff4e0', 1.75], sky: ['#9db8e8', 0.5], bounce: ['#e8dcc0', 0.3], door: ['#fff3d8', 1.8], next: ['#B9B24A', 1], glow: 0, wind: 0.12 },
  noon: { sun: [0.25, 0.94, 0.22], sunColor: ['#fff0cc', 2.25], sky: ['#c8d4e8', 0.34], bounce: ['#c89a60', 0.5], door: ['#B9B24A', 1.9], next: ['#E58A7A', 1], glow: 0, wind: 0.2 },
  storm: { sun: [-0.35, 0.55, 0.75], sunColor: ['#d6d27a', 0.75], sky: ['#76828f', 0.6], bounce: ['#8d9458', 0.36], door: ['#E58A7A', 2.0], next: ['#1B2450', 1], glow: 0.06, wind: 1.0 },
  sunset: { sun: [-0.88, 0.22, 0.42], sunColor: ['#ff9272', 2.3], sky: ['#6a58b0', 0.3], bounce: ['#E58A7A', 0.3], door: ['#3348a8', 1.5], next: ['#F2A33A', 1], glow: 0.14, wind: 0.25 },
  night: { sun: [0.55, 0.62, 0.56], sunColor: ['#a8c0ff', 0.95], sky: ['#2a3a7a', 0.34], bounce: ['#141c44', 0.4], door: ['#9fd0ff', 2.4], next: ['#F2A33A', 1], glow: 1.7, wind: 0.05 },
};
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  // per-seed character of the house
  const cfg = {
    upperWin: rng.chance(0.5) ? 3 : 5, balW: rng.pick([9, 10, 11]), balStyle: rng.chance(0.5) ? 0 : 1, merlon: rng.chance(0.55) ? 0 : 1,
    thatchHalf: rng.range(22, 31), thatchHip: rng.chance(0.65), rosettes: rng.pick([5, 7]), potX: rng.range(17, 24), thirdPot: rng.chance(0.5),
    kangaX: rng.range(-0.7, 0.7), back: opts.back !== false, plinth: opts.plinth === true,
  };
  const warm = rng.range(-1, 1), lookName = opts.look && LOOKS[opts.look] ? opts.look : rng.pick(['morning', 'noon', 'storm', 'sunset', 'night']);
  const lime = P[0].clone().multiplyScalar(0.8).lerp(P[3], 0.03 + 0.03 * warm);
  const C = {
    lime, stone: lime.clone().lerp(P[3], 0.14).lerp(P[5], 0.12), void: P[4].clone().multiplyScalar(0.12),
    wood: P[5].clone().lerp(new THREE.Color('#8a5636'), 0.5 + 0.12 * warm), brass: P[6].clone().lerp(P[2], 0.18).multiplyScalar(0.85),
    thatch: P[2].clone().lerp(P[5], 0.42).lerp(new THREE.Color('#8f8a78'), 0.35), blue: P[1].clone().lerp(P[4], rng.range(0, 0.3)),
    cloth: P[0].clone().multiplyScalar(0.84), clay: P[3].clone().lerp(P[5], 0.35), leaf: P[2].clone().lerp(new THREE.Color('#2f5a2a'), 0.6),
    kanga: rng.chance(0.5) ? P[3].clone().multiplyScalar(0.9) : P[1].clone().lerp(P[3], 0.25), flame: P[6].clone(),
  };
  C.leafWood = P[5].clone().lerp(new THREE.Color('#7a3f24'), 0.52 + 0.08 * warm);

  const wins = windowList(cfg), acc = new Acc(72000);
  await ctx.yield();
  const Y = () => ctx.yield();
  await buildShell(acc, C, cfg, rng, wins, detail, Y);
  await ctx.yield();
  const door = await buildDoor(acc, C, cfg, rng, Y);
  await ctx.yield();
  const bal = await buildOpenings(acc, C, cfg, rng, wins, Y);
  await ctx.yield();
  await buildOrnament(acc, C, cfg, rng, bal.bw, Y);
  await ctx.yield();
  const roof = await buildRoof(acc, C, cfg, rng, detail, { px: door.px, bw: bal.bw }, Y);
  await ctx.yield();
  const geo = acc.build();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 55, -12), 80);
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(-50, 0, -32), new THREE.Vector3(50, 112, 12));
  await ctx.yield();

  const boxes = [bal.balcony, door.hood, roof.thatch];
  const baseMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uDoor: { value: 1.4 }, uWind: { value: 0.1 },
      uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.6) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uSky: { value: new THREE.Color(0.3, 0.4, 0.6) },
      uBounce: { value: new THREE.Color(0.2, 0.2, 0.2) }, uDoorCol: { value: new THREE.Color(1, 1, 1) }, uDoorStr: { value: 2 },
      uGlow: { value: 0 }, uGlowCol: { value: P[6].clone().multiplyScalar(1.6) }, uLampCol: { value: P[6].clone().lerp(new THREE.Color('#ffd9a0'), 0.25).multiplyScalar(1.5) }, uCoral: { value: lime.clone().lerp(P[3], 0.4).lerp(P[5], 0.2).multiplyScalar(0.8) },
      uBoxMin: { value: boxes.map((b) => b[0].clone().addScalar(0.3)) }, uBoxMax: { value: boxes.map((b) => b[1].clone().addScalar(-0.3)) },
      uArchInv: { value: new THREE.Matrix4() }, uDark: { value: new THREE.Color(0, 0, 0) }, uDarkK: { value: 0 },
    }]),
  });
  const impGeo = new THREE.PlaneGeometry(DOOR_W, DOOR_H);
  const baseImp = new THREE.ShaderMaterial({
    vertexShader: IMP_VERT, fragmentShader: IMP_FRAG, fog: true, transparent: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uAlpha: { value: 1 }, uDoorStr: { value: 2 }, uDoorCol: { value: new THREE.Color(1, 1, 1) },
      uShade: { value: P[4].clone() }, uNext: { value: new THREE.Color(1, 1, 1) }, uChina: { value: P[1].clone().multiplyScalar(0.8) },
    }]),
  });
  const owned = [geo, impGeo, baseMat, baseImp];

  const anchors = {
    doorCenter: new THREE.Vector3(0, SILL + DOOR_H / 2, 0), doorSill: new THREE.Vector3(0, SILL, 0), doorSize: { w: DOOR_W, h: DOOR_H }, modelScale: 1 / 16,
    roomOrigin: new THREE.Vector3(0, 0, -DEPTH),
    portalSeat: { position: new THREE.Vector3(0, 18, -1.5), facing: new THREE.Vector3(0, 0, 1), radius: 7 },
    flyThrough: [[0, 18, 70], [0, 18, 30], [0, 18, 10], [0, 18, 0], [0, 18, -15], [0, 18, -DEPTH]].map((p) => new THREE.Vector3(...p)),
    viewpoints: { front: new THREE.Vector3(0, 30, 120), close: new THREE.Vector3(0, 18, 14), below: new THREE.Vector3(-22, 10, 46) },
    lookAt: new THREE.Vector3(0, 24, 0), balcony: new THREE.Vector3(0, 48, 5), thatch: new THREE.Vector3(0, 104, -13), lampNiche: roof.lamp.clone(),
  };

  function makeHandle(mat, imp) {
    const object = new THREE.Group(); object.name = 'house-in-the-niche';
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'house-front'; object.add(mesh);
    const impostor = new THREE.Mesh(impGeo, imp); impostor.name = 'room-picture'; impostor.position.set(0, SILL + DOOR_H / 2, -DEPTH + 0.4);
    impostor.visible = opts.impostor !== false; impostor.frustumCulled = true; object.add(impostor);
    const u = mat.uniforms, ui = imp.uniforms;
    let wind = 0.1, q = 0, impK = 1;
    const apply = () => { u.uDoor.value = lerp(1.26, 1.571, smoothstep(0, 1, q)); u.uWind.value = wind + 0.5 * smoothstep(0.3, 1, q); ui.uAlpha.value = impK; };
    const h = {
      object, mesh, impostor, radius: 64, height: 110, center: new THREE.Vector3(0, 46, -6), anchors, ground: true, groundY: 0,
      uniforms: u, impostorUniforms: ui, look: lookName, looks: Object.keys(LOOKS), config: cfg,
      // sun: direction TO the light [x,y,z]; colours: THREE.Color, hex string or [hex, strength]
      setLight(o = {}) {
        const c = (dst, v) => { if (v === undefined) return; if (Array.isArray(v)) dst.set(v[0]).multiplyScalar(v[1]); else dst.set(v); };
        if (o.sun) { u.uSunDir.value.set(o.sun[0], o.sun[1], o.sun[2]); if (u.uSunDir.value.lengthSq() < 1e-6) u.uSunDir.value.set(0, 1, 0); u.uSunDir.value.normalize(); }
        c(u.uSunCol.value, o.sunColor); c(u.uSky.value, o.sky); c(u.uBounce.value, o.bounce); c(u.uGlowCol.value, o.glowColor);
        if (o.door !== undefined) { c(u.uDoorCol.value, o.door); const m = Math.max(u.uDoorCol.value.r, u.uDoorCol.value.g, u.uDoorCol.value.b, 1e-3);
          if (Array.isArray(o.door)) { u.uDoorCol.value.multiplyScalar(1 / o.door[1]); u.uDoorStr.value = o.door[1]; } else if (m > 1) { u.uDoorCol.value.multiplyScalar(1 / m); u.uDoorStr.value = m; }
          ui.uDoorCol.value.copy(u.uDoorCol.value); }
        if (o.doorStrength !== undefined) u.uDoorStr.value = o.doorStrength;
        ui.uDoorStr.value = u.uDoorStr.value;
        if (o.next !== undefined) c(ui.uNext.value, o.next);
        if (o.glow !== undefined) u.uGlow.value = o.glow;
        if (o.wind !== undefined) { wind = o.wind; apply(); }
        return h;
      },
      setLook(name) { const L = LOOKS[name] || LOOKS.morning; h.look = LOOKS[name] ? name : 'morning'; return h.setLight(L); },
      setProgress(v) { q = clamp(v, 0, 1); apply(); },
      setImpostor(k) { impK = clamp(k, 0, 1); impostor.visible = impK > 0.003; apply(); },
      update(dt, time) { u.uTime.value = time; ui.uTime.value = time; },
      makeLevel() { const m2 = mat.clone(), i2 = imp.clone(); owned.push(m2, i2); const lv = makeHandle(m2, i2); lv.setLook(h.look); return lv; },
      dispose() { for (const o of owned) o.dispose(); },
    };
    return h;
  }
  const hero = makeHandle(baseMat, baseImp);
  hero.setLook(lookName);
  hero.setProgress(opts.progress ?? 0.25);
  return hero;
}
