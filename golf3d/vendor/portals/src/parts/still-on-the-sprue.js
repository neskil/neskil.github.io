// STILL ON THE SPRUE: hero set piece. THE GREAT FRAME and THE LONGWING.
//
// What it is: a moulding frame (sprue) 220 m wide and 140 m tall in oxblood kit plastic, standing in the
// local XY plane (origin at the base centre, +Y up, its "front" faces +Z, where the camera comes from).
// It holds the 62 parts of one creature, the Longwing: 4 clear amber ribbed wings (70 x 30 m), 14 sand hull
// half-shells, 20 streamer tail links, 2 head halves, 6 fin vanes, 8 struts, 8 hinge pins. One progress value
// makes every part tremble, twist three times on its gates, snap free with a puff of swarf, hop out to the
// dock 50 m in front of the Frame, and seat with a small overshoot (order: hull, head, tail, struts, wings).
// Whole, the Longwing beats once and lifts over the Frame's top bar, leaving part-shaped holes of sky.
//
// opts:
//   palette   array of hex strings, brief order [sand, sea-grey, oxblood, amber, olive, pale, slate]
//   detail    0.6..1 (default 1): thins the swarf only; the Frame and the Longwing never thin
//   sunDir    THREE.Vector3 or [x,y,z], direction TOWARD the sun in the hero's local space
//             (default: port quarter, 50 degrees up, for a camera flying toward local (0.64,0,-0.77))
//   wings     2 or 4 (default 4; 2 builds only the fore pair, the hind bays stand empty)
//   contact   false to leave out the three contact-shadow quads at y 0.07 (feet and bottom runner)
//   pathDir   [x,y,z] the camera's heading in local space (default [0.643,0,-0.766]); wing4Via [x,y,z]; flight [[U,x,y,z],...]
//   slip      [[U,x,y,z,yaw,roll],...] where the Longwing's frame rides while its hull is built (the world keeps it
//             60 to 100 m off the camera's bow, so the shells are seen seating); it must end at the dock before U 0.555
//   partVia   (kind, index, side, U, home) -> [x,y,z] | null: a point the hull shells ('shell') and the last six tail
//             links ('link') pass through half way, so they cross the camera's bow; debug: a query string, viewer only
//   dock      [x,y,z] local position of the dock (default [61,75,49])
// Hooks on the returned hero:
//   setProgress(u)   the WORLD's path u (0..1). Timeline in U below. Never wall-clock. Until it is first
//                    called the piece plays itself on a 40 s loop so the viewer is never a frozen diorama.
//   setSun(dir, keyHex, fillHex)  change the sun direction / light colours (uniforms only).
//   uniforms         the shared uniform block (uSun, uKey, uFill, uSky, uTime ...).
//   partLocal(i, v), partQuaternion(i, q)  where part i is now, in LOCAL space (wings are parts 0..3: use them
//                    to slide the amber ground patches along the sun ray); ids: 0-3 wings, 4-17 hull shells,
//                    18-19 head, 20-39 tail links, 40-47 struts, 48-55 hinge pins, 56-61 fin vanes.
// Timeline (U = setProgress value): hull shells nose to tail 0.22-0.56 (each hop 0.057 long, then the pair's gap closes over 0.035; halves staggered),
//   tail links 1-14 0.50-0.58, head 0.53-0.58, struts, pins, vanes 0.50-0.55, wings 1-3 0.52-0.585, wing 4 leaves
//   at 0.52, flies a long loop passing beside the camera line and seats at 0.60, the beat 0.61-0.64, the lift over
//   the top bar follows opts.flight (wings held high while it clears), the last six tail links leave at 0.65-0.68
//   and chase it; then it flies on down-valley (anchors.flight).
// anchors (local space): see the bottom of the file, each one is commented there.
// Size: radius ~135, height 140 (the Longwing clears the top bar at about y 175).
// Cost: about 129k triangles, 9 draw calls (frame, parts, amber x2 passes x2 sides, swarf, contact), no lights, no textures.
// Lighting: none from the scene. Everything is the unlit POLYSTYRENE shader of the brief's styleNote with
//   the sun as a uniform (wrapped key + cool fill, soft sheen, thin edges bleeding light when backlit),
//   scene fog supported. Clear amber is drawn twice: a multiply pass and an additive pass, no depth write.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const PAL = ['#E8E0CF', '#93A6AA', '#8E3B32', '#F0A94A', '#7C8455', '#DDE9EA', '#5C6B73'];
const FW = 220, FH = 140, RR = 0.6;        // frame width, height, runner radius
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------------------------------------------
// Geometry accumulator: indexed, smooth normals computed at the end, so shared vertices are soft and
// duplicated vertices are hard edges. Per vertex: position, colour, aux = (thinness 0..1, part id).
class Geo {
  constructor() { this.P = []; this.C = []; this.A = []; this.I = []; this.part = -1; this.col = [1, 1, 1]; this.m = null; this._v = new THREE.Vector3(); }
  get count() { return this.P.length / 3; }
  v(x, y, z, thin = 0, col = this.col) {
    if (this.m) { const p = this._v.set(x, y, z).applyMatrix4(this.m); x = p.x; y = p.y; z = p.z; }
    this.P.push(x, y, z); this.C.push(col[0], col[1], col[2]); this.A.push(thin, this.part);
    return this.P.length / 3 - 1;
  }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  // grid of nu x nv cells from fn(u, v, out[3]) -> thinness (or undefined); closeU wraps the u direction
  grid(nu, nv, fn, closeU = false, colFn = null) {
    const o = [0, 0, 0], base = this.count, cu = closeU ? nu : nu + 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i < cu; i++) {
      const u = i / nu, w = j / nv, t = fn(u, w, o) || 0;
      this.v(o[0], o[1], o[2], t, colFn ? colFn(u, w) : this.col);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * cu + i, b = base + j * cu + (i + 1) % cu, c = b + cu, d = a + cu;
      this.quad(a, b, c, d);
    }
    return base;
  }
  // surface of revolution about the axis from point a along unit dir d: profile = [[radius, height, thin], ...]
  lathe(a, d, profile, sides = 12, col = this.col) {
    const ax = new THREE.Vector3(d[0], d[1], d[2]).normalize();
    const e1 = new THREE.Vector3(0, 0, 1).cross(ax); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize();
    const e2 = new THREE.Vector3().crossVectors(ax, e1);
    const n = profile.length - 1;
    return this.grid(sides, n, (u, w, o) => {
      const k = Math.round(w * n), r = profile[k][0], h = profile[k][1], c = Math.cos(u * TAU) * r, s = Math.sin(u * TAU) * r;
      o[0] = a[0] + ax.x * h + e1.x * c + e2.x * s; o[1] = a[1] + ax.y * h + e1.y * c + e2.y * s; o[2] = a[2] + ax.z * h + e1.z * c + e2.z * s;
      return profile[k][2] || 0;
    }, true, () => col);
  }
  // a round runner between two points with rounded ends
  rod(a, b, r, sides = 12, col = this.col, thin = 0) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
    return this.lathe(a, d, [[0, -r * 0.55, thin], [r * 0.8, -r * 0.3, thin], [r, 0, thin], [r, L, thin], [r * 0.8, L + r * 0.3, thin], [0, L + r * 0.55, thin]], sides, col);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('acol', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('aux', new THREE.Float32BufferAttribute(this.A, 2));
    // lathe tips and plate centres leave triangles with two corners on one point: they draw nothing, so drop them
    const P = this.P, I = this.I, J = [];
    const same = (a, b) => Math.abs(P[a * 3] - P[b * 3]) + Math.abs(P[a * 3 + 1] - P[b * 3 + 1]) + Math.abs(P[a * 3 + 2] - P[b * 3 + 2]) < 1e-7;
    for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; if (!(same(a, b) || same(b, c) || same(a, c))) J.push(a, b, c); }
    g.setIndex(J);
    g.computeVertexNormals();
    return g;
  }
  // The same geometry as build(), made in short steps so that no step stalls the page: the attributes one by one, the
  // triangles in runs of ten thousand, and the normals summed face by face and normalised exactly as three.js does it.
  async buildSteps(ctx) {
    const g = new THREE.BufferGeometry(), pos = new THREE.Float32BufferAttribute(this.P, 3);
    g.setAttribute('position', pos); await ctx.yield();
    g.setAttribute('acol', new THREE.Float32BufferAttribute(this.C, 3)); await ctx.yield();
    g.setAttribute('aux', new THREE.Float32BufferAttribute(this.A, 2)); await ctx.yield();
    const P = this.P, I = this.I, J = [];
    const same = (a, b) => Math.abs(P[a * 3] - P[b * 3]) + Math.abs(P[a * 3 + 1] - P[b * 3 + 1]) + Math.abs(P[a * 3 + 2] - P[b * 3 + 2]) < 1e-7;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t], b = I[t + 1], c = I[t + 2]; if (!(same(a, b) || same(b, c) || same(a, c))) J.push(a, b, c);
      if (t % 30000 === 29997) await ctx.yield();
    }
    g.setIndex(J); await ctx.yield();
    const F = pos.array, N = new Float32Array(F.length);
    for (let t = 0; t < J.length; t += 3) {
      const a = J[t] * 3, b = J[t + 1] * 3, c = J[t + 2] * 3;
      const cx = F[c] - F[b], cy = F[c + 1] - F[b + 1], cz = F[c + 2] - F[b + 2], ax = F[a] - F[b], ay = F[a + 1] - F[b + 1], az = F[a + 2] - F[b + 2];
      const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
      N[a] += x; N[a + 1] += y; N[a + 2] += z; N[b] += x; N[b + 1] += y; N[b + 2] += z; N[c] += x; N[c + 1] += y; N[c + 2] += z;
      if (t % 30000 === 29997) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0; i < N.length; i += 3) { const x = N[i], y = N[i + 1], z = N[i + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1); N[i] = x * k; N[i + 1] = y * k; N[i + 2] = z * k; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    return g;
  }
}

// ---------------------------------------------------------------------------------------------------
// Shaders. One vertex shader for everything: PARTS meshes carry a part id per vertex and are placed by
// uPos[id] (xyz, w = stress whitening 0..1) and uQuat[id]; the Frame flexes about its feet instead.
const NP = 64;
const VERT = /* glsl */`
attribute vec3 acol; attribute vec2 aux;
uniform vec4 uPos[${NP}]; uniform vec4 uQuat[${NP}]; uniform float uTime; uniform float uFlex; uniform float uPix;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vO; varying float vThin; varying float vSt;
#include <fog_pars_vertex>
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
void main() {
  vec3 p = position; vec3 n = normal; float st = 0.0;
  vO = position;
#ifdef PARTS
  int id = int(clamp(aux.y, 0.0, ${NP - 1}.0) + 0.5);
  vec4 q = uQuat[id]; vec4 t = uPos[id];
  p = qrot(q, p) + t.xyz; n = qrot(q, n); st = t.w;
#else
  float k = clamp(p.y / ${FH}.0, 0.0, 1.2); k *= k;
  p.z += uFlex * k * sin(uTime * 0.55 + p.x * 0.012);
  p.x += uFlex * 0.25 * k * sin(uTime * 0.37 + 1.3);
  // far away, runners swell so they never fall under about two pixels (no shimmer in the avenue view)
  float dcam = length(cameraPosition - (modelMatrix * vec4(p, 1.0)).xyz);
  p += normal * clamp(dcam * uPix * 1.0 - 0.55, 0.0, 3.0);
#endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = mat3(modelMatrix) * n; vC = acol; vThin = aux.x; vSt = st;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG_HEAD = /* glsl */`
uniform vec3 uSun; uniform vec3 uKey; uniform vec3 uFill; uniform vec3 uSky; uniform vec3 uAmber; uniform vec3 uTrA; uniform vec3 uTrB; uniform vec3 uHot; uniform float uFire; uniform float uPix;
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vO; varying float vThin; varying float vSt;
#include <fog_pars_fragment>
float fogAmt() {
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.0;
#endif
}
`;

// POLYSTYRENE: wrapped key, cool fill, one broad soft highlight, thin places bleeding light, no black.
const FRAG_PLASTIC = FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = vN; float nl = length(N); N = nl > 1e-5 ? N / nl : vec3(0.0, 1.0, 0.0);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float inside = 0.0;
#ifdef DSIDE
  if (!gl_FrontFacing) { N = -N; inside = 1.0; }
#endif
  // surface tells as small normal offsets, faded by distance (never by derivatives):
  // ejector-pin circles on a 2.6 m grid of the part's own flat faces, shallow sink dimples between
  float fade = clamp(1.0 - dist * uPix * 2.0 / 0.12, 0.0, 1.0);
  vec2 cell = fract(vO.xy / 2.6 + 0.5) - 0.5; float cr = length(cell) * 2.6;
  float ring = smoothstep(0.30, 0.34, cr) * (1.0 - smoothstep(0.36, 0.40, cr));
  float dimple = 1.0 - smoothstep(0.0, 0.30, cr);
  N = normalize(N + fade * (ring * 0.35 - dimple * 0.06) * vec3(cell.x, cell.y, 0.0) / max(length(cell), 0.05) * 0.5);
  float ndl = dot(N, uSun);
  float wrap = clamp((ndl + 0.6) / 1.6, 0.0, 1.0);
  vec3 col = mix(max(vC, vec3(0.0)), vec3(0.86, 0.84, 0.80), clamp(vSt, 0.0, 1.0) * 0.5);
  float lit = smoothstep(-0.25, 0.75, ndl);
  vec3 body = col * (mix(uFill * (0.50 + 0.10 * N.y), uKey * 1.12, lit) + uKey * 0.10 * max(-N.y, 0.0));   // a harder terminator; the lit floor bounces up
  body += (vec3(0.018, 0.020, 0.026) + col * 0.08) * (1.0 - lit);       // a floor of sky light on the shadow side: never black
  body *= 1.0 - 0.27 * inside;                              // hollow backs sit deeper, so an open end reads as hollow
  body -= col * 0.05 * fade * ring;                         // the pin witness mark itself
  vec3 H = uSun + V; float hl = length(H); H = hl > 1e-4 ? H / hl : N;
  float nh = clamp(dot(N, H), 0.0, 1.0); float nv = clamp(dot(N, V), 0.0, 1.0);
  float s2 = nh * nh; float s4 = s2 * s2; float s10 = s4 * s4 * s2;
  float f = 1.0 - nv;
  float toward = 0.5 + 0.5 * dot(-V, uSun);
  vec3 sheen = 0.16 * s10 * uKey + 0.07 * f * f * f * uSky + col * uKey * 0.45 * f * f * toward * toward;   // and a rim of light on whatever stands against the sun
  vec3 bleed = clamp(vThin, 0.0, 1.0) * (0.5 - 0.5 * ndl) * 0.45 * mix(col, vec3(1.0), 0.5) * (0.3 + 0.7 * toward) * uKey;
  gl_FragColor = vec4(body + sheen + bleed, 1.0);
  #include <fog_fragment>
}`;

// CLEAR AMBER: pass MUL multiplies what is behind by the transmittance (deeper in ribs and at grazing
// angles); pass ADD lays the sheen, the edge bleed and the fire of the sun seen through the wing on top.
const FRAG_AMBER = FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = vN; float nl = length(N); N = nl > 1e-5 ? N / nl : vec3(0.0, 1.0, 0.0);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  if (!gl_FrontFacing) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0); float g = 1.0 - nv; float rib = clamp(vC.r, 0.0, 1.0);
  float fa = fogAmt();
  float fade = clamp(1.0 - dist * uPix * 2.0 / 0.5, 0.0, 1.0);
  float fl = sin(vO.z * 6.2832 / 1.1); float flute = fade * (1.0 - rib) * smoothstep(0.55, 0.98, fl);   // moulded flutes along the span
  float scar = clamp(vC.g, 0.0, 1.0);
#ifdef AMBER_MUL
  float k = clamp(rib * 0.85 + g * g * 0.7 + flute * 0.3, 0.0, 1.0);
  vec3 T = mix(uTrA, uTrB, k);
  T = mix(T, vec3(0.86, 0.84, 0.80), max(clamp(vSt, 0.0, 1.0) * 0.3, scar * 0.5));
  gl_FragColor = vec4(mix(T, vec3(1.0), fa), 1.0);
#else
  float ndl = dot(N, uSun);
  vec3 H = uSun + V; float hl = length(H); H = hl > 1e-4 ? H / hl : N;
  float nh = clamp(dot(N, H), 0.0, 1.0); float s2 = nh * nh; float s4 = s2 * s2; float s10 = s4 * s4 * s2;
  float through = clamp(dot(-V, uSun), 0.0, 1.0);            // looking through the wing toward the sun
  float fire = through * through * through;
  float thin = clamp(vThin, 0.0, 1.0);
  float face = 0.3 + 0.7 * nv;                               // edge-on layers stack up: keep their sum in hue
  vec3 c = uAmber * (0.08 + 0.13 * rib + 0.04 * g) * face;   // honey: light scattered in the plastic
  c += mix(uAmber, uHot, 0.45) * uFire * fire * face * face * (0.35 + 0.65 * rib + 0.4 * thin);   // honey to fire, never white
  c += scar * vec3(0.30, 0.28, 0.24) + flute * 0.07 * uAmber * (0.5 + 0.5 * ndl);
  c += thin * 0.3 * uAmber * (0.5 - 0.5 * ndl) * face + 0.10 * s10 * uKey + 0.04 * g * g * g * uSky * face;
  gl_FragColor = vec4(c * (1.0 - fa), 1.0);
#endif
}`;

// ---------------------------------------------------------------------------------------------------
// Shared shape helpers
// A bevelled plate from a convex-ish outline [[x,y],...] (CCW seen from +z) between z0 and z1.
function plate(G, outline, z0, z1, bev, thinEdge = 0.6, col = G.col) {
  let ar = 0; for (let i = 0; i < outline.length; i++) { const p = outline[i], q = outline[(i + 1) % outline.length]; ar += p[0] * q[1] - q[0] * p[1]; }
  if (ar < 0) outline = outline.slice().reverse();
  const n = outline.length; let cx = 0, cy = 0;
  for (const p of outline) { cx += p[0] / n; cy += p[1] / n; }
  let rad = 0; for (const p of outline) rad = Math.max(rad, Math.hypot(p[0] - cx, p[1] - cy));
  const ins = clamp(1 - bev / Math.max(rad, 1e-3), 0.3, 0.98);
  const rings = [[0, z0, 0], [ins, z0, 0], [1, z0 + bev, thinEdge], [1, z1 - bev, thinEdge], [ins, z1, 0], [0, z1, 0]];
  return G.grid(n, rings.length - 1, (u, w, o) => {
    const p = outline[Math.round(u * n) % n], r = rings[Math.round(w * (rings.length - 1))];
    o[0] = cx + (p[0] - cx) * r[0]; o[1] = cy + (p[1] - cy) * r[0]; o[2] = r[1]; return r[2];
  }, true, () => col);
}
const roundRect = (cx, cy, w, h, r, k = 3) => {
  const o = [], cs = [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]];
  for (const [sx, sy, q] of cs) for (let i = 0; i <= k; i++) {
    const a = (q + i / k) * Math.PI / 2;
    o.push([cx + sx * (w / 2 - r) + Math.cos(a) * r, cy + sy * (h / 2 - r) + Math.sin(a) * r]);
  }
  return o;
};
// a round runner with rings every ~9 m so it can flex, and an optional flash fin along the parting line
function runner(G, x0, y0, x1, y1, r, sides, fin) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 9)), dx = (x1 - x0) / L, dy = (y1 - y0) / L;
  const prof = [[0, -r * 0.5, 0], [r * 0.82, -r * 0.28, 0]];
  for (let i = 0; i <= n; i++) prof.push([r, (i / n) * L, 0]);
  prof.push([r * 0.82, L + r * 0.28, 0], [0, L + r * 0.5, 0]);
  G.lathe([x0, y0, 0], [dx, dy, 0], prof, sides);
  if (fin) {                                   // flash: a paper-thin fin either side, in the frame plane
    const w = r * 1.55, px = -dy, py = dx;
    G.grid(n, 2, (u, v, o) => { const s = (v - 0.5) * 2; o[0] = x0 + dx * L * u + px * w * s; o[1] = y0 + dy * L * u + py * w * s; o[2] = 0; return 1; });
  }
}

// ---------------------------------------------------------------------------------------------------
// THE GREAT FRAME: outer rectangle, bay runners, sub-runners, ejector discs at junctions, two feet,
// tapered gates (each ends in a pale stub that stays behind when its part snaps off), dot-and-dash tabs,
// and one big blank maker's plate with rows of dots and dashes. One merged mesh.
const X0 = -109.4, X1 = 109.4, YB = 4, YT = 139.4, YA = 30, YC = 104;
const BAY = { w1: [X0, -77], w2: [-77, -44], hull: [-44, 16], tail: [16, 34], w4: [34, 66], w3: [66, 98], pins: [98, X1] };
function frameRuns() {
  const run = [];                                                    // [x0,y0,x1,y1,radius,fin]
  const H = (y, a, b, r = RR, fin = 1) => run.push([a, y, b, y, r, fin]);
  const V = (x, a, b, r = RR, fin = 1) => run.push([x, a, x, b, r, fin]);
  H(YB, X0, X1); H(YT, X0, X1); V(X0, YB, YT); V(X1, YB, YT);        // outer rectangle
  H(YA, X0, X1); H(YC, X0, X1); V(-44, YB, YT); V(16, YB, YT);       // the big cross
  for (const x of [-77, 34, 66, 98]) V(x, YA, YC);                   // wing bays
  const SR = 0.42;
  for (const x of [-29, -14, 1]) V(x, YA, YC, SR, 0);                // hull cells 15 x 18.5
  for (const y of [48.5, 67, 85.5]) H(y, -44, 16, SR, 0);
  V(25, YA, YC, SR, 0);                                              // tail column spine
  for (const x of [-76.7, -14, 62.6]) V(x, YC, YT, SR, 0);           // vane bays
  H(17, X0, -44, SR, 0); H(17, 16, X1, SR, 0); V(-76.7, YB, YA, SR, 0); V(62.7, YB, YA, SR, 0);  // strut bays
  return run;
}
async function buildFrame(G, run, gates, tabs, rng, cols, ctx) {   // yields between its pieces; the order of rng draws is untouched
  G.part = -1; G.col = cols.frame;
  let nR = 0;
  for (const s of run) { runner(G, s[0], s[1], s[2], s[3], s[4], s[4] > 0.5 ? 14 : 10, s[5]); if (++nR % 6 === 0) await ctx.yield(); }
  await ctx.yield();
  // ejector discs where runners meet (collect crossings of horizontals and verticals)
  const hs = run.filter((s) => s[1] === s[3]), vs = run.filter((s) => s[0] === s[2]);
  const junctions = [];
  for (const h of hs) for (const v of vs) {
    if (v[0] >= h[0] - 0.01 && v[0] <= h[2] + 0.01 && h[1] >= v[1] - 0.01 && h[1] <= v[3] + 0.01) junctions.push([v[0], h[1], Math.max(h[4], v[4])]);
  }
  for (const [x, y, r] of junctions) {
    const k = r / RR, R = 1.55 * k, t = 0.8 * k;
    G.lathe([x, y, 0], [0, 0, 1], [[0, -t * 0.86, 0], [R * 0.55, -t * 0.86, 0], [R * 0.62, -t, 0.1], [R * 0.88, -t, 0.1], [R, -t * 0.7, 0.3], [R, t * 0.7, 0.3], [R * 0.88, t, 0.1], [R * 0.62, t, 0.1], [R * 0.55, t * 0.86, 0], [0, t * 0.86, 0]], 12);
  }
  await ctx.yield();
  // two moulded feet with draft, a stepped collar and a rounded toe, broad along x
  for (const fx of [-72, 72]) {
    G.m = new THREE.Matrix4().makeTranslation(fx, 0, 0).multiply(new THREE.Matrix4().makeScale(2.6, 1, 1.25));
    G.lathe([0, 0, 0], [0, 1, 0], [[0, 0, 0], [5.2, 0, 0.5], [5.4, 0.35, 0.8], [5.0, 0.8, 0.2], [3.3, 1.6, 0], [3.0, 1.75, 0.4], [2.6, 1.9, 0], [1.5, 3.3, 0], [0.9, YB, 0]], 20);
    G.m = null;
    for (const s of [-1, 1]) runner(G, fx + s * 9, 1.2, fx + s * 3.2, YB - 0.2, 0.4, 8, 0);   // gussets
  }
  await ctx.yield();
  // gates: tapered from the runner to a thin neck, ending in the stub; the neck and stub are thin and pale
  let nG = 0;
  for (const g of gates) {
    if (++nG % 12 === 0) await ctx.yield();
    const d = [g.to[0] - g.from[0], g.to[1] - g.from[1], 0], L = Math.hypot(d[0], d[1]);
    if (L < 0.05) continue;
    const r0 = g.r || 0.4;
    G.lathe([g.from[0], g.from[1], 0], d, [[r0 * 1.25, 0, 0], [r0, r0 * 0.4, 0], [r0 * 0.7, L * 0.55, 0.3], [r0 * 0.34, L - 0.18, 0.8], [r0 * 0.3, L - 0.04, 1], [0, L, 1]], 8,
      cols.frame);
    const sc = G.count - 8 * 2;                                       // whiten the last two rings (the scar)
    for (let i = sc * 3; i < G.count * 3; i += 3) { G.C[i] = cols.scar[0]; G.C[i + 1] = cols.scar[1]; G.C[i + 2] = cols.scar[2]; }
  }
  // tabs: a little bevelled plate on a short stalk beside each part, carrying raised dots and dashes
  const mark = (x, y, z, dash, k) => {
    if (dash) G.rod([x - 0.22 * k, y, z], [x + 0.22 * k, y, z], 0.085 * k, 5);
    else G.lathe([x, y, z - 0.02], [0, 0, 1], [[0.15 * k, 0, 0], [0.12 * k, 0.09 * k, 0.5], [0, 0.12 * k, 0.5]], 6);
  };
  let nT = 0;
  for (const t of tabs) {
    if (nT++ % 6 === 0) await ctx.yield();
    const w = t.w || 2.6, h = t.h || 1.3, th = 0.16 * (t.k || 1);
    runner(G, t.from[0], t.from[1], t.at[0], t.at[1], 0.2, 6, 0);
    plate(G, roundRect(t.at[0], t.at[1], w, h, 0.3 * Math.min(1, h)), -th, th, 0.07, 0.7);
    const rows = t.rows || 1, n = t.n || rng.int(3, 5);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = t.at[0] + ((i + 0.5) / n - 0.5) * (w - 0.5), y = t.at[1] + (rows > 1 ? ((r + 0.5) / rows - 0.5) * (h - 0.6) : 0);
      mark(x, y, th, rng.chance(0.45), t.ms || 1);
    }
  }
  return { run, junctions };
}

// ---------------------------------------------------------------------------------------------------
// LONGWING PARTS. Each builder writes one part in its own local space (the space it has when seated,
// relative to its dock origin) and returns its gate points (local) so the Frame can grow gates to it.

// Hull profile: half-widths (rx, ry) along the body axis z (nose -30 .. tail +30), a soft spindle.
function hullR(z) {
  const t = clamp((z + 34) / 68, 0.02, 0.98);
  const s = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.62);
  const rx = 1.0 + 6.5 * s;
  return [rx, rx * (0.80 + 0.10 * Math.sin(t * 5.0))];
}
// Head profile along z (-13 beak tip .. 0 neck), local to the head origin.
function headR(z) {
  const t = clamp((z + 13) / 13, 0, 1);
  const rx = 0.25 + 3.4 * Math.pow(t, 0.8) * (1 - 0.32 * smoothstep(0.75, 1, t)) + 0.9 * Math.exp(-((t - 0.62) * (t - 0.62)) / 0.02);
  return [rx, rx * 0.92 + 0.5 * t];
}
// One half of a thin shell split on the x = 0 plane: skin, panel-line step at both ends, parting flange
// with a raised seam bead, end flanges, hollow-back ribs, a stringer, locating pins (side +1) or
// sockets (side -1), and an outside strake.
function shellHalf(G, side, z0, z1, rf, o = {}) {
  const nt = o.nt || 16, nz = o.nz || 10, zc = (z0 + z1) / 2, col = G.col, wall = o.wall || 0.42;
  const R = (w) => rf(lerp(z0, z1, w));
  const ang = (u) => (side > 0 ? u - 0.5 : 0.5 - u) * Math.PI;
  const at = (u, w, k, out) => {
    const a = ang(u), r = R(w), e = Math.min(w, 1 - w) * nz;
    const kk = k * (o.steps === false ? 1 - 0.03 * (1 - smoothstep(0.0, 1.0, e)) : (e < 0.5 ? 0.965 : e < 1.5 ? 1.05 : 1));   // a groove on the joint line, a raised collar beside it
    out[0] = side * Math.cos(a) * r[0] * kk; out[1] = Math.sin(a) * r[1] * kk; out[2] = lerp(z0, z1, w) - zc;
  };
  G.grid(nt, nz, (u, w, out) => { at(u, w, 1, out); return (u < 0.01 || u > 0.99 || w < 0.01 || w > 0.99) ? 0.3 : 0; });
  // parting flanges (the wall seen edge-on) and the seam bead: half a raised ridge on each half, 0.7 m proud of the
  // skin along the top and the bottom, so the closed hull carries a ridge where its halves meet
  const bead = o.bead ?? 0.7;
  for (const ue of [0, 1]) {
    const sgn = Math.sin(ang(ue)) > 0 ? 1 : -1;
    G.grid(3, nz, (u, w, out) => {
      const r = R(w), k = sgn * side > 0 ? Math.round(u * 3) : 3 - Math.round(u * 3), e = Math.min(w, 1 - w) * nz, b = bead * (e < 0.5 ? 0.55 : 1);   // wound so the ridge faces out on all four edges
      out[0] = side * [bead * 0.95, bead * 0.22, 0, 0][k]; out[1] = sgn * (r[1] * [0.992, 1, 1, 1][k] + [0, b, b, 0][k] - (k === 3 ? wall : 0)); out[2] = lerp(z0, z1, w) - zc;
      return k === 1 || k === 2 ? 1 : 0.4;
    });
  }
  for (const we of [0, 1]) G.grid(nt, 1, (u, w, out) => { at(u, we, 1 - w * wall / Math.max(R(we)[0], 1), out); return 0.9; });
  const ribs = o.ribs ?? 2;
  for (let i = 1; i <= ribs; i++) {                                     // hollow-back ribs
    const wr = i / (ribs + 1);
    G.grid(nt, 1, (u, w, out) => { at(u, wr, 1 - w * 0.95 / Math.max(R(wr)[0], 1.2), out); return 0.55; });
  }
  G.grid(nz, 1, (u, w, out) => { at(0.5, u, 1 - w * 0.8 / Math.max(R(u)[0], 1.2), out); return 0.5; });   // stringer
  for (const wp of o.pins || [0.25, 0.75]) for (const sy of [-1, 1]) {
    const r = R(wp), p = [0, sy * (r[1] - wall * 0.55), lerp(z0, z1, wp) - zc];
    if (side > 0) G.lathe(p, [-1, 0, 0], [[0.17, -0.1, 0], [0.17, 0.42, 0.4], [0.11, 0.55, 0.6], [0, 0.58, 0.6]], 6);
    else G.lathe(p, [-1, 0, 0], [[0.3, 0, 0.3], [0.3, 0.5, 0.5], [0.19, 0.5, 0.5], [0.19, 0.05, 0]], 6);
  }
  for (const us of o.strakes || [0.17, 0.36, 0.64, 0.83]) {                           // raised strakes outside
    const a = [0, 0, 0], b = [0, 0, 0]; at(us, 0.14, 1.02, a); at(us, 0.86, 1.02, b);
    G.rod(a, b, o.strakeR || 0.26, 5, col, 0.3);
  }
  for (const [ub, wb] of o.bosses || []) {                                             // pin bosses on the outer skin: a raised round pad with the ejector pin's dish in it
    const c = [0, 0, 0], c2 = [0, 0, 0]; at(ub, wb, 1, c); at(ub, wb, 1.1, c2);
    G.lathe(c, [c2[0] - c[0], c2[1] - c[1], 0], [[1.05, -0.25, 0], [1.0, 0.3, 0.5], [0.72, 0.34, 0.2], [0.62, 0.14, 0], [0, 0.1, 0]], 10);
  }
  const rm = R(0.5), L = z1 - z0, gz = L > 7 ? [-L * 0.25, L * 0.25] : [0];
  const gates = [];
  for (const z of gz) for (const sy of [-1, 1]) gates.push([0, sy * R(0.5 + z / L)[1] * 1.02, z]);
  return { gates, half: [rm[1], L / 2] };
}

// A flat streamer link: a kite-shaped plate with a spine bead, a pin boss in front and an eye behind.
function tailLink(G, len, wid, last) {
  const o = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, c = Math.cos(a), s = Math.sin(a);
    const fz = last ? (c > 0 ? 1.0 : 0.55) : 1, k = last ? 1 + 0.5 * Math.max(0, c) : 1;
    o.push([-s * wid * 0.5 * k * (0.55 + 0.45 * Math.abs(s)), len * 0.5 + c * len * 0.5 * fz]);   // x, z
  }
  // plate() works in xy; build it there and turn it flat (normal y) with a matrix
  const m0 = G.m; G.m = new THREE.Matrix4().makeRotationX(Math.PI / 2);     // (x,y,z) -> (x,-z,y)
  plate(G, o.map((p) => [p[0], p[1]]), -0.09, 0.09, 0.07, 0.9);
  G.m = m0;
  G.rod([0, 0.1, len * 0.12], [0, 0.1, len * 0.9], 0.11, 5, G.col, 0.3);
  G.rod([0, -0.1, len * 0.12], [0, -0.1, len * 0.9], 0.11, 5, G.col, 0.3);
  G.lathe([0, -0.26, 0.02], [0, 1, 0], [[0, 0, 0], [0.3, 0, 0.2], [0.34, 0.08, 0.5], [0.34, 0.44, 0.5], [0.3, 0.52, 0.2], [0, 0.52, 0]], 8);   // pin head
  return { gates: [[-wid * 0.5, 0, len * 0.5], [wid * 0.5, 0, len * 0.5]] };
}

// A hinge pin: shaft, domed head with a slot ring, a split tip.
function hingePin(G, len) {
  G.lathe([0, 0, -len / 2], [0, 0, 1], [[0, -0.25, 0.2], [0.75, -0.2, 0.5], [0.9, 0.0, 0.7], [0.9, 0.3, 0.7], [0.5, 0.42, 0], [0.42, 0.5, 0], [0.42, len - 0.6, 0],
    [0.52, len - 0.5, 0.4], [0.52, len - 0.2, 0.4], [0.3, len, 0.8], [0, len + 0.05, 0.8]], 10);
  return { gates: [[0, 0.44, 0.2], [0, -0.44, 0.2]] };
}

// A strut: a tapered spar along +x with an eye at each end and a collar at mid-length.
function strut(G, len) {
  const r = 0.34;
  G.lathe([0.7, 0, 0], [1, 0, 0], [[0.2, 0, 0.3], [r, 0.5, 0], [r * 1.35, len * 0.5 - 0.9, 0], [r * 1.7, len * 0.5 - 0.75, 0.4], [r * 1.7, len * 0.5 - 0.25, 0.4], [r * 1.35, len * 0.5 - 0.1, 0],
    [r, len - 1.9, 0], [0.2, len - 1.4, 0.3]], 8);
  for (const x of [0, len]) {
    G.lathe([x, 0, -0.22], [0, 0, 1], [[0.3, 0, 0.5], [0.8, 0, 0.5], [0.86, 0.08, 0.8], [0.86, 0.36, 0.8], [0.8, 0.44, 0.5], [0.3, 0.44, 0.5], [0.3, 0, 0.5]], 10);
  }
  return { gates: [[len * 0.28, 0.4, 0], [len * 0.72, 0.4, 0], [len * 0.5, -0.5, 0]] };
}

const flipSince = (G, i0) => { const I = G.I; for (let i = i0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } };

// A fin vane: a swept bevelled plate standing on +y, root along z (0..root), with raised ribs on both
// faces and a root tongue that plugs into the hull.
function finVane(G, root, tall, sweep) {
  const le = (t) => (root * 0.45 + sweep) * Math.pow(t, 1.5), te = (t) => lerp(root, root * 0.8 + sweep, Math.pow(t, 0.75)) - 0.045 * root * Math.abs(Math.sin(3 * Math.PI * t));
  const o = [];
  for (let i = 0; i <= 7; i++) o.push([le(i / 7 * 0.97), tall * (i / 7) * 0.97]);
  o.push([lerp(le(1), te(1), 0.35), tall], [lerp(le(1), te(1), 0.75), tall * 0.985]);
  for (let i = 9; i >= 0; i--) o.push([te(i / 9 * 0.95), tall * (i / 9) * 0.95]);
  const m0 = G.m, base = (m0 ? m0.clone() : new THREE.Matrix4());
  G.m = base.clone().multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2));     // plate x -> +z, plate z -> -x
  plate(G, o, -0.14, 0.14, 0.1, 0.9);
  G.m = m0;
  const P = (a, b, sx) => { const v = new THREE.Vector3(sx, b, a); if (m0) v.applyMatrix4(m0); return [v.x, v.y, v.z]; };
  const mm = G.m; G.m = null;
  for (const sx of [-0.15, 0.15]) for (const k of [0.16, 0.38, 0.6, 0.82]) G.rod(P(root * k, 0.3, sx), P(lerp(le(0.86), te(0.86), k), tall * 0.86, sx), 0.12, 5, G.col, 0.3);
  G.m = mm;
  const t0 = G.m; G.m = base.clone().multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
  plate(G, roundRect(root * 0.5, -0.55, root * 0.7, 1.3, 0.3, 2), -0.3, 0.3, 0.1, 0.5);      // tongue
  G.m = t0;
  return { gates: [[0, tall * 0.02, 0.1], [0, tall * 0.02, root - 0.1], [0, tall, lerp(le(1), te(1), 0.5)]] };
}

// A WING, local: span +x (0..70, or -x when mir = -1), chord along z (leading edge toward -z), top +y.
// acol.r is "depth of plastic" for the amber shader: 0 membrane, up to 1 in spar and ribs.
const WING_L = 70, LINK = 5.2;
function wingM(s, v, mir, out) {                        // membrane point at span s 0..1, chord v 0..1
  const c = 6.5 * (1 - s) * (1 - s) + 51 * Math.pow(Math.max(s, 0), 0.5) * Math.pow(Math.max(1 - s, 0), 0.45);
  const zL = -0.34 * c - 3.0 * Math.sin(s * 2.4) + 2.0 * s * s * 4;
  const cam = Math.sin(Math.PI * Math.pow(v, 0.8)) * 1.5 * (c / 28);
  out[0] = mir * s * WING_L; out[1] = cam + 3.2 * s * s - 0.5 * v * s; out[2] = zL + c * v;
  return c;
}
function buildWing(G, mir, nRib) {
  const i0 = G.I.length, o = [0, 0, 0], a = [0, 0, 0], b = [0, 0, 0];
  const MEM = [0, 0, 0], RIB = [0.7, 0, 0], SPAR = [1, 0, 0], BEAD = [0.55, 0, 0];
  const scal = (s) => 1 - 0.045 * Math.abs(Math.sin(Math.PI * nRib * Math.max(0, s - 0.22) / 0.78));
  const M = (s, v, out) => wingM(s, v * scal(s), mir, out);
  G.grid(44, 12, (u, v, out) => { M(0.012 + 0.988 * u, v, out); return (v > 0.99 || u > 0.995) ? 1 : 0; }, false, () => MEM);
  // ribs: a ridge on top and a deep fin on the hollow back, fanning from the root to the trailing edge and tip
  const cz = (s) => { const c = wingM(s, 0, 1, o); return [o[2], c]; };
  const ribLine = (k, t, out) => {                      // k-th rib, t 0..1 along it -> (s, v): straight in plan, fanning from the root
    const sEnd = Math.min(0.999, 0.22 + 0.78 * (k + 1) / nRib), r0 = cz(0.015), re = cz(sEnd);
    const s = lerp(0.015, sEnd, t), z = lerp(r0[0] + r0[1] * (0.9 - 0.8 * k / (nRib - 1)), re[0] + re[1], t) - 1.2 * Math.sin(Math.PI * t) * (1 - k / nRib);
    const h = cz(s);
    out[0] = s; out[1] = clamp((z - h[0]) / Math.max(h[1], 0.01) / scal(s), 0.02, 1);
  };
  const sv = [0, 0], sv2 = [0, 0], nSeg = 18;
  const ridge = (line, n, wTop, hTop, hBack) => {
    const base = G.count;
    for (let i = 0; i <= n; i++) {
      line(i / n, sv); line(Math.min(1, i / n + 0.01), sv2);
      M(sv[0], sv[1], o); M(sv2[0], sv2[1], a);
      let dx = a[0] - o[0], dz = a[2] - o[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const tp = 1 - 0.55 * (i / n), w = wTop * tp * mir;
      G.v(o[0] + dz * w, o[1] + 0.02, o[2] - dx * w, 0, RIB); G.v(o[0], o[1] + hTop * tp, o[2], 0.5, SPAR); G.v(o[0] - dz * w, o[1] + 0.02, o[2] + dx * w, 0, RIB);
      G.v(o[0], o[1] - 0.02, o[2], 0.2, RIB); G.v(o[0], o[1] - hBack * tp, o[2], 1, RIB);
    }
    for (let i = 0; i < n; i++) { const p = base + i * 5, q = p + 5; G.quad(p, q, q + 1, p + 1); G.quad(p + 1, q + 1, q + 2, p + 2); if (hBack > 0) G.quad(p + 3, p + 4, q + 4, q + 3); }
  };
  for (let k = 0; k < nRib; k++) ridge((t, out) => ribLine(k, t, out), nSeg, 0.42, 0.5, 1.15);
  for (const sc of [0.16, 0.33, 0.5, 0.67, 0.83]) {     // cross veins, bowed toward the tip
    ridge((t, out) => { out[0] = clamp(sc + 0.05 * Math.sin(Math.PI * t), 0, 0.999); out[1] = lerp(0.04, 0.985, t); }, 14, 0.26, 0.3, 0.55);
  }
  // leading-edge spar: a tapering tube; and a thin bead round the trailing edge and tip
  const tube = (line, n, sides, rad, thin, col) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { line(i / n, sv); M(sv[0], sv[1], o); pts.push([o[0], o[1], o[2]]); }
    G.grid(sides, n, (u, w, out) => {
      const i = Math.round(w * n), p = pts[i], q = pts[Math.min(n, i + 1)], pr = pts[Math.max(0, i - 1)];
      let tx = q[0] - pr[0], ty = q[1] - pr[1], tz = q[2] - pr[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = -tz, nz = tx; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;      // horizontal normal
      const bx = ty * nz, by = tz * nx - tx * nz, bz = -ty * nx;                           // binormal
      const r = rad(i / n), c = Math.cos(u * TAU) * r * mir, sn = Math.sin(u * TAU) * r;
      out[0] = p[0] + nx * c + bx * sn; out[1] = p[1] + by * sn; out[2] = p[2] + nz * c + bz * sn; return thin;
    }, true, () => col);
  };
  tube((t, out) => { out[0] = 0.999 * t; out[1] = 0.0; }, 30, 8, (t) => 1.0 - 0.72 * t, 0.15, SPAR);
  tube((t, out) => { if (t < 0.8) { out[0] = 0.02 + 0.978 * (t / 0.8); out[1] = 1; } else { out[0] = 0.999; out[1] = 1 - (t - 0.8) / 0.2; } }, 56, 5, () => 0.2, 1, BEAD);
  if (mir < 0) flipSince(G, i0);
  // root knuckle: the hinge barrel the pin goes through, with two collars
  const zr = [0, 0, 0], zr2 = [0, 0, 0]; M(0.012, 0.0, zr); M(0.012, 1.0, zr2);
  G.lathe([mir * 0.3, 0.2, zr[2] - 0.8], [0, 0, 1], [[0.45, 0, 0.5], [1.25, 0, 0.5], [1.35, 0.15, 0.8], [1.35, 0.9, 0.3], [1.1, 1.0, 0], [1.1, zr2[2] - zr[2] + 0.6, 0], [1.35, zr2[2] - zr[2] + 0.7, 0.3],
    [1.35, zr2[2] - zr[2] + 1.45, 0.8], [1.25, zr2[2] - zr[2] + 1.6, 0.5], [0.45, zr2[2] - zr[2] + 1.6, 0.5]], 12, SPAR);
  const gates = [];
  for (const s of [0.2, 0.52, 0.84]) { M(s, 0, o); gates.push([o[0], o[1], o[2] - (1.0 - 0.72 * s)]); }
  for (const s of [0.3, 0.62]) { M(s, 1, o); gates.push([o[0], o[1], o[2] + 0.2]); }
  return { gates, barrel: [zr[2] - 0.8, zr2[2] + 0.8] };
}

// ---------------------------------------------------------------------------------------------------
// THE PART TABLE: 62 parts, each with a home on the Frame, a dock in the Longwing's own space
// (forward -z, up +y, wings along x), an approach direction for the last slide home, a release u0 and
// a hop length du (both in world path u), and the joint it rides once seated.
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const basisQ = (ex, ey, ez) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(...ex), V3(...ey), V3(...ez)));
const Q_SHELL = () => basisQ([0, 0, 1], [1, 0, 0], [0, 1, 0]);      // local x -> frame z, y -> x, z -> y
const eulerQ = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'));
const SEGZ = [-30, -22, -13, -4, 5, 14, 22, 30];
const WROOT_Z = [-11.9, -11.9, 10.1, 10.1], WSIDE = [1, -1, 1, -1];

function makeParts(rng, nWings) {
  const parts = [];
  const add = (kind, o) => { const p = { id: parts.length, kind, joint: 'hull', gap: V3(0, 0, 0), ...o }; parts.push(p); return p; };
  // 0..3 wings: fore pair (0 right, 1 left), hind pair (2 right, 3 left = "wing four", the last to seat)
  const wb = [BAY.w1, BAY.w2, BAY.w3, BAY.w4];
  const o = [0, 0, 0]; let zmin = 1e9, zmax = -1e9;
  for (let i = 0; i <= 40; i++) { wingM(i / 40, 0, 1, o); zmin = Math.min(zmin, o[2] - 1); wingM(i / 40, 1, 1, o); zmax = Math.max(zmax, o[2]); }
  const zc = (zmin + zmax) / 2;
  for (let w = 0; w < 4; w++) {
    const side = WSIDE[w], fore = w < 2, up = (w === 1 || w === 2) ? -1 : 1;     // up: root at the bottom (+1) or top (-1)
    const rx = hullR(WROOT_Z[w] + 1.9)[0] * 0.86;
    const dq = eulerQ(0, side * (fore ? 0.2 : -0.36), side * (fore ? 0.26 : 0.12));
    const bx = (wb[w][0] + wb[w][1]) / 2;
    // span (local x * side) -> frame y * up; chord z -> frame x; top (local y) -> frame z
    const ex = [0, side * up, 0], ey = [0, 0, 1], ez = [side * up, 0, 0];
    const hq = basisQ(ex, ey, ez);
    add('wing', { side, live: w < nWings || nWings >= 4, hq, hp: V3(bx - side * up * zc, 67 - up * 35, 0), dq, dp: V3(side * rx, 1.5, WROOT_Z[w]), gap: V3(side * 5, 1.5, 0), joint: 'w' + w,
      u0: [0.515, 0.530, 0.545, 0.520][w], du: [0.040, 0.040, 0.040, 0.080][w] });
  }
  // 4..17 hull half-shells (7 segments x right/left), 18..19 head halves, in a 4 x 4 block of cells
  const cellX = [-36.5, -21.5, -6.5, 8.5], cellY = [94.75, 76.25, 57.75, 39.25];
  const order = [0, 1, 2, 3, 4, 5, 6];                               // release order: nose to tail, so the open ribbed end faces the camera
  for (let i = 0; i < 7; i++) for (const side of [1, -1]) {
    const slot = i + 1, row = slot >> 1, colp = (slot & 1) * 2 + (side > 0 ? 0 : 1), k = order.indexOf(i);
    add('shell', { seg: i, side, hq: Q_SHELL(), hp: V3(cellX[colp], cellY[row], 0), dq: new THREE.Quaternion(), dp: V3(0, 0, (SEGZ[i] + SEGZ[i + 1]) / 2), gap: V3(side * 4.5, 0, 0),
      u0: 0.2193 + k * 0.03766 + (side > 0 ? 0 : 0.0193), du: 0.0924, hopEnd: 0.62 });
  }
  for (const side of [1, -1]) add('head', { side, hq: Q_SHELL(), hp: V3(cellX[side > 0 ? 0 : 1], cellY[0] - 1.0, 0), dq: new THREE.Quaternion(), dp: V3(0, 0.4, -29.2), gap: V3(side * 1.8, 0, 0), u0: side > 0 ? 0.532 : 0.542, du: 0.034 });
  // 20..39 tail links in two columns of ten; the last six hang beside wing four's bay
  const rightRows = [10, 11, 14, 15, 16, 17, 18, 19, 12, 13];
  for (let i = 0; i < 20; i++) {
    const colR = i >= 10, row = colR ? rightRows.indexOf(i) : i, late = i >= 14;
    add('link', { link: i, hq: basisQ([-1, 0, 0], [0, 0, 1], [0, 1, 0]), hp: V3(colR ? 29.6 : 20.4, 97.9 - row * 7.05 - 2.6, 0), dq: new THREE.Quaternion(), dp: V3(0, 0, 0), gap: V3(0, 0, 2.5), joint: 't' + i,
      u0: late ? 0.650 + (i - 14) * 0.0055 : 0.497 + i * 0.0044, du: late ? 0.040 : 0.028 });
  }
  // 40..47 struts (two per wing, they ride the wing joint), in the bottom band
  const sb = [[X0, -76.7], [-76.7, -44], [16, 62.7], [62.7, X1]];
  for (let i = 0; i < 8; i++) {
    const w = i >> 1, b = sb[[0, 1, 3, 2][w]], wing = parts[w];
    add('strut', { wing: w, k: i & 1, live: wing.live, hq: new THREE.Quaternion(), hp: V3((b[0] + b[1]) / 2, (i & 1) ? 23.5 : 10.5, 0), dq: new THREE.Quaternion(), dp: V3(0, 0, 0), gap: V3(0, -2.5, 0), joint: 'w' + w,
      u0: wing.u0 + wing.du - 0.012 + (i & 1) * 0.004, du: 0.024 });
  }
  // 48..55 hinge pins (two per wing), stacked in the narrow bay at the starboard end
  for (let i = 0; i < 8; i++) {
    const w = i >> 1, wing = parts[w];
    add('pin', { wing: w, k: i & 1, live: wing.live, hq: Q_SHELL(), hp: V3(103.7, 36.5 + i * 8.7, 0), dq: new THREE.Quaternion(), dp: V3(0, 0, 0), gap: V3(0, 0, (i & 1) ? 4 : -4), joint: 'w' + w,
      u0: wing.u0 + wing.du + 0.002 + (i & 1) * 0.004, du: 0.018 });
  }
  // 56..61 fin vanes in the top band: dorsal, ventral, two tailplanes, two canards
  const vq = () => basisQ([0, 0, 1], [0, 1, 0], [-1, 0, 0]);
  const vane = (root, tall, sweep, bay, dp, rz, u0) => {
    const dq = eulerQ(0, 0, rz), bx = (bay[0] + bay[1]) / 2;
    add('vane', { dims: [root, tall, sweep], hq: vq(), hp: V3(bx + (root + sweep) / 2, (YC + YT) / 2 - tall / 2 + 0.6, 0), dq, dp, gap: V3(0, 2.6, 0).applyQuaternion(dq), u0, du: 0.024 });
  };
  const ry = (z) => hullR(z)[1], rxh = (z) => hullR(z)[0];
  vane(14, 19, 12, [62.6, X1], V3(0, ry(16) * 0.97, 9), 0, 0.498);
  vane(11, 10, 9, [16, 62.6], V3(0, -ry(18) * 0.97, 11), Math.PI, 0.503);
  vane(11, 16, 10, [X0, -76.7], V3(rxh(21) * 0.9, 0.3, 15), -1.33, 0.508);
  vane(11, 16, 10, [-76.7, -44], V3(-rxh(21) * 0.9, 0.3, 15), 1.33, 0.511);
  vane(8, 11, 6, [-44, -14], V3(rxh(-23) * 0.92, 0.2, -27), -1.42, 0.516);
  vane(8, 11, 6, [-14, 16], V3(-rxh(-23) * 0.92, 0.2, -27), 1.42, 0.519);
  for (const p of parts) if (p.live === undefined) p.live = true;
  return parts;
}

// ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-frame') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 5 ? opts.palette : PAL);
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const sand = lin(pal[0]), grey = lin(pal[1]), oxblood = lin(pal[2]), amber = lin(pal[3]), olive = lin(pal[4]);
  // per-seed variety: the Longwing's third plastic, which hull halves show their hollow backs, tail length of curl
  const accent = rng.pick([oxblood, grey, olive, oxblood]);
  const curlSign = rng.chance(0.5) ? 1 : -1, flexPhase = rng.range(0, TAU), tremSeed = rng.range(0, 100);
  const cols = { frame: oxblood, scar: mixc(oxblood, [0.85, 0.83, 0.8], 0.62) };
  const pathDir = V3(...(opts.pathDir || [0.643, 0, -0.766])).normalize();
  const pathRight = V3(-pathDir.z, 0, pathDir.x).normalize();
  const dockP = V3(...(opts.dock || [61, 75, 49]));

  const nRib = rng.int(7, 10), curl = rng.range(0.17, 0.2);
  const dbgWings = 4;
  const parts = makeParts(rng, (opts.wings ?? dbgWings) === 2 ? 2 : 4);
  await ctx.yield();
  const run = frameRuns();
  await ctx.yield();
  const Gp = new Geo(), Gw = new Geo(), Gf = new Geo();
  const gates = [], tabs = [];
  const tmp = V3(0, 0, 0);
  const nearestRunner = (x, y) => {                       // closest point on any runner centre line
    let best = null, bd = 1e9;
    for (const s of run) {
      const cx = clamp(x, Math.min(s[0], s[2]), Math.max(s[0], s[2])), cy = clamp(y, Math.min(s[1], s[3]), Math.max(s[1], s[3]));
      const d = Math.hypot(x - cx, y - cy) - s[4];
      if (d < bd && d > 0.05) { bd = d; best = [cx, cy, s]; }
    }
    return best;
  };
  const iq = new THREE.Quaternion(), nd = V3(0, 0, 0);
  const hang = (p, localGates, r, G, scarCol) => {                    // grow gates from the nearest runner to each gate point
    let first = true;
    for (const g of localGates) {
      tmp.set(g[0], g[1], g[2]).applyQuaternion(p.hq).add(p.hp);
      const n = nearestRunner(tmp.x, tmp.y); if (!n) continue;
      const dx = tmp.x - n[0], dy = tmp.y - n[1], L = Math.hypot(dx, dy) || 1, rr = n[2][4];
      gates.push({ from: [n[0] + dx / L * rr * 0.7, n[1] + dy / L * rr * 0.7], to: [tmp.x, tmp.y], r });
      nd.set(-dx / L, -dy / L, 0).applyQuaternion(iq.copy(p.hq).invert());     // the pale scar the gate leaves on the part
      G.lathe([g[0] - nd.x * 0.1, g[1] - nd.y * 0.1, g[2] - nd.z * 0.1], [nd.x, nd.y, nd.z], [[r * 1.0, 0, 0.6], [r * 0.8, 0.16, 1], [r * 0.45, 0.24, 1], [0, 0.26, 1]], 6, scarCol);
      if (first && p.kind !== 'wing' && L > 2.4) {
        const horiz = n[2][1] === n[2][3], tx = horiz ? 1 : 0, ty = horiz ? 0 : 1, sgn = rng.chance(0.5) ? 1 : -1;
        const fx = n[0] + tx * sgn * 2.3, fy = n[1] + ty * sgn * 2.3, k = Math.min(1.9, L * 0.62);
        tabs.push({ from: [fx, fy], at: [fx + dx / L * k, fy + dy / L * k], w: horiz ? 2.4 : 1.2, h: horiz ? 1.2 : 2.4, n: horiz ? rng.int(3, 4) : 1, rows: horiz ? 1 : rng.int(3, 4) });
        first = false;
      }
    }
  };
  await ctx.yield();
  // ---- wings (amber) ------------------------------------------------------------------------------
  let wingInfo = null;
  for (let w = 0; w < 4; w++) {
    const p = parts[w]; if (!p.live) continue;
    Gw.part = p.id; wingInfo = buildWing(Gw, p.side, nRib);
    await ctx.yield();
    hang(p, wingInfo.gates, 0.5, Gw, [0.5, 1, 0]);
    const bay = [BAY.w1, BAY.w2, BAY.w3, BAY.w4][w], tipUp = (w === 0 || w === 3), yr = tipUp ? YC : YA, s = tipUp ? -1 : 1;
    tabs.push({ from: [bay[0] + 5.5, yr], at: [bay[0] + 5.5, yr + s * 3.0], w: 4.4, h: 2.0, n: 4 + w, rows: 2, ms: 1.7, k: 1.6 });
    await ctx.yield();
  }
  // ---- sand and accent parts ------------------------------------------------------------------------
  const wingPt = (w, s, v, dy) => { const o = [0, 0, 0]; wingM(s, v, parts[w].side, o); return V3(o[0], o[1] + dy, o[2]).applyQuaternion(parts[w].dq).add(parts[w].dp); };
  for (const p of parts) {
    if (p.kind === 'wing' || !p.live) continue;
    Gp.part = p.id; Gp.col = sand; let res = null, gr = 0.3;
    if (p.kind === 'shell') {
      if (p.side < 0) Gp.col = [sand[0] * 0.93, sand[1] * 0.94, sand[2] * 0.965];        // the port halves are another pull of the same sand
      res = shellHalf(Gp, p.side, SEGZ[p.seg], SEGZ[p.seg + 1], hullR, { ribs: 2, nt: 18, nz: 10, bosses: p.seg % 2 ? [[0.27, 0.5], [0.73, 0.5]] : [[0.5, 0.3], [0.5, 0.72]] }); gr = 0.75;
    }
    else if (p.kind === 'head') {
      res = shellHalf(Gp, p.side, -13, 0, headR, { ribs: 1, nt: 14, nz: 14, pins: [0.72], strakes: [0.5], wall: 0.3, steps: false, bead: 0.3, strakeR: 0.13 });
      const ex = headR(-4.6)[0];
      Gp.lathe([p.side * (ex - 0.5), 1.0, -4.6 + 6.5], [p.side, 0, 0], [[1.25, 0, 0], [1.25, 0.5, 0.5], [1.05, 0.62, 0.5], [0.8, 0.5, 0], [0.55, 0.72, 0], [0, 0.8, 0]], 12, accent);   // eye boss
      p.dp.z = -29.2 - 6.5;
    } else if (p.kind === 'link') {
      Gp.col = (p.link % 2) ? accent : sand; if (p.link === 19) Gp.col = accent;
      res = tailLink(Gp, LINK, lerp(5.2, 2.8, p.link / 19) * (p.link === 19 ? 1.9 : 1), p.link === 19);
    } else if (p.kind === 'strut') {
      const w = p.wing, side = parts[w].side, bz = (wingInfo.barrel[0] + wingInfo.barrel[1]) / 2 + (p.k ? 3.5 : -3.5);
      const A = V3(-side * 0.7, -3.4, bz).add(parts[w].dp), B = wingPt(w, p.k ? 0.4 : 0.27, p.k ? 0.5 : 0.14, -1.3);
      const d = B.clone().sub(A), len = d.length();
      p.dp.copy(A); p.dq.setFromUnitVectors(V3(1, 0, 0), d.normalize());
      Gp.col = accent; res = strut(Gp, len); p.hp.x -= len / 2;
    } else if (p.kind === 'pin') {
      const w = p.wing, side = parts[w].side;
      p.dp.set(side * 0.3, 0.2, p.k ? wingInfo.barrel[1] + 0.9 : wingInfo.barrel[0] - 0.9).applyQuaternion(parts[w].dq).add(parts[w].dp);
      p.dq.copy(parts[w].dq); if (p.k) p.dq.multiply(eulerQ(0, Math.PI, 0));
      Gp.col = accent; res = hingePin(Gp, 3.4);
    } else if (p.kind === 'vane') { Gp.col = accent; res = finVane(Gp, p.dims[0], p.dims[1], p.dims[2]); gr = 0.36; }
    hang(p, res.gates, gr, Gp, mixc(Gp.col, [0.86, 0.84, 0.8], 0.6));
    await ctx.yield();
  }
  // the maker's plate in the bottom centre bay: rows of dots and dashes, no words
  tabs.push({ from: [-14, YB], at: [-14, 17], w: 40, h: 13, n: 11, rows: 3, ms: 5.5, k: 3 });
  tabs.push({ from: [-34, YA], at: [-34, 17], w: 0.2, h: 0.2, n: 0, rows: 0 }, { from: [6, YA], at: [6, 17], w: 0.2, h: 0.2, n: 0, rows: 0 });
  await ctx.yield();
  await buildFrame(Gf, run, gates, tabs, rng, cols, ctx);
  await ctx.yield();
  const geoF = await Gf.buildSteps(ctx); await ctx.yield();           // in short steps: no long stall
  const geoP = await Gp.buildSteps(ctx); await ctx.yield();
  const geoW = await Gw.buildSteps(ctx); await ctx.yield();

  // ---- materials (all made here, never in update) -------------------------------------------------------
  const sunLocal = V3(-0.64, 0.766, 0.056);
  if (opts.sunDir) { const s = opts.sunDir; sunLocal.set(s.x ?? s[0], s.y ?? s[1], s.z ?? s[2]); }
  sunLocal.normalize();
  const posArr = new Float32Array(NP * 4), quatArr = new Float32Array(NP * 4);
  for (let i = 0; i < NP; i++) quatArr[i * 4 + 3] = 1;
  const U = {
    uSun: { value: sunLocal.clone() }, uKey: { value: new THREE.Color('#FFF6E6') }, uFill: { value: new THREE.Color('#C9D8E6') },
    uSky: { value: new THREE.Color('#D6E4EA') }, uAmber: { value: new THREE.Color(pal[3]) },
    uTrA: { value: V3(1.0, 0.64, 0.23) }, uTrB: { value: V3(0.90, 0.40, 0.09) }, uHot: { value: V3(1.0, 0.22, 0.02) },   // clear plastic: thin and deep transmittance, hottest glow
    uFire: { value: 0.8 }, uPix: { value: 0.0013 },
    uTime: { value: 0 }, uFlex: { value: 1.0 }, uPos: { value: posArr }, uQuat: { value: quatArr }, uU: { value: 0 }, uPx: { value: 400 },
  };
  const mat = (frag, defines, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: VERT, fragmentShader: frag, defines, fog: true, side: THREE.DoubleSide, ...extra,
  });
  const blendKeep = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
  const matFrame = mat(FRAG_PLASTIC, { DSIDE: 1 });
  const matParts = mat(FRAG_PLASTIC, { DSIDE: 1, PARTS: 1 });
  const matMul = mat(FRAG_AMBER, { PARTS: 1, AMBER_MUL: 1 }, { ...blendKeep, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor });
  const matAdd = mat(FRAG_AMBER, { PARTS: 1 }, { ...blendKeep, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
  await ctx.yield();
  const object = new THREE.Group(); object.name = 'great-frame';
  const mk = (geo, m, order) => { const o = new THREE.Mesh(geo, m); o.frustumCulled = false; o.renderOrder = order; object.add(o); return o; };
  mk(geoF, matFrame, 0); mk(geoP, matParts, 0); mk(geoW, matMul, 5); mk(geoW, matAdd, 6);

  // ---- swarf: a puff of pale chaff at every snap, placed by progress (uU), drifting a little on time ----
  const perPuff = Math.round(14 * detail), nS = parts.length * perPuff;
  const sp = new Float32Array(nS * 3), sv = new Float32Array(nS * 3), ss = new Float32Array(nS * 4);
  for (let i = 0; i < nS; i++) {
    const p = parts[(i / perPuff) | 0], big = p.kind === 'wing' ? 3 : p.kind === 'shell' ? 1.6 : 1;
    const a = rng.range(0, TAU), r = rng.range(0.3, 1), el = rng.range(-0.3, 1);
    tmp.set(p.kind === 'wing' ? rng.range(-2, 2) : 0, 0, 0);
    const hx = p.hp.x + (p.kind === 'wing' ? rng.range(-13, 13) : rng.range(-3, 3) * big), hy = p.hp.y + (p.kind === 'wing' ? rng.range(-33, 33) + (p.hp.y < 67 ? 35 : -35) : rng.range(-3, 3));
    sp[i * 3] = hx; sp[i * 3 + 1] = hy; sp[i * 3 + 2] = rng.range(-0.5, 0.5);
    sv[i * 3] = Math.cos(a) * r * 5 * big; sv[i * 3 + 1] = el * 4 * big; sv[i * 3 + 2] = (2 + Math.abs(Math.sin(a)) * r * 7) * big;
    ss[i * 4] = p.live ? p.u0 : 9; ss[i * 4 + 1] = rng.range(0.35, 0.95) * (0.8 + 0.25 * big) * (p.kind === 'shell' ? 4.5 : 1); ss[i * 4 + 2] = rng.range(0, TAU); ss[i * 4 + 3] = rng.range(0.7, 1.3);
  }
  const geoS = new THREE.BufferGeometry();
  geoS.setAttribute('position', new THREE.BufferAttribute(sp, 3)); geoS.setAttribute('aVel', new THREE.BufferAttribute(sv, 3)); geoS.setAttribute('aSeed', new THREE.BufferAttribute(ss, 4));
  const matSwarf = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uU: U.uU, uTime: U.uTime, uPx: U.uPx, uFlex: U.uFlex, uKey: U.uKey },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      attribute vec3 aVel; attribute vec4 aSeed; uniform float uU; uniform float uTime; uniform float uPx; uniform float uFlex;
      varying float vA; varying float vRot;
      #include <fog_pars_vertex>
      void main() {
        float age = (uU - aSeed.x) / (0.045 * aSeed.w);
        float on = step(0.0, age) * step(age, 1.0);
        float a = clamp(age, 0.0, 1.0);
        float k = clamp(position.y / ${FH}.0, 0.0, 1.2); k *= k;
        vec3 p = position; p.z += uFlex * k * sin(uTime * 0.55 + p.x * 0.012);
        p += aVel * (1.0 - exp(-3.5 * a)) * 1.4;
        p.y -= 9.0 * a * a;
        p.x += sin(uTime * 0.9 + aSeed.z) * 0.8 * a; p.z += cos(uTime * 0.7 + aSeed.z * 1.7) * 0.8 * a;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = on * clamp(aSeed.y * uPx / max(-mvPosition.z, 1.0), 1.5, 40.0);
        if (on < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        vA = on * smoothstep(0.0, 0.04, a) * (1.0 - a * a);
        vRot = aSeed.z + uTime * (1.5 + aSeed.w) ;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uKey; varying float vA; varying float vRot;
      #include <fog_pars_fragment>
      void main() {
        vec2 q = gl_PointCoord - 0.5; float c = cos(vRot), s = sin(vRot);
        q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        float d = abs(q.x) * 1.2 + abs(q.y) * 2.6;                 // a curled sliver, turning as it falls
        float m = 1.0 - smoothstep(0.32, 0.5, d);
        if (m * vA < 0.01) discard;
        gl_FragColor = vec4(vec3(0.82, 0.80, 0.76) * uKey, m * vA * 0.9);
        #include <fog_fragment>
      }`,
  });
  // soft blue contact shadows under the two feet and along the bottom runner: multiply quads just above y 0
  await ctx.yield();
  const cg = new THREE.BufferGeometry(), cp = [], cu = [], ci = [];
  const blob = (x, w, d) => { const b = cp.length / 3; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { cp.push(x + u * w, 0.07, v * d); cu.push(u, v); } ci.push(b, b + 2, b + 1, b, b + 3, b + 2); };
  blob(-72, 20, 10); blob(72, 20, 10); blob(0, 118, 5);
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2)); cg.setIndex(ci);
  const matShadow = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uCol: { value: new THREE.Color('#AEBFD6') } }, fog: true, ...blendKeep, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vUv;\n#include <fog_pars_vertex>\nvoid main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: FRAG_HEAD + 'uniform vec3 uCol; varying vec2 vUv;\nvoid main(){ float d = clamp(1.0 - length(vUv), 0.0, 1.0); float a = d * d * (3.0 - 2.0 * d) * 0.85 * (1.0 - fogAmt()); gl_FragColor = vec4(mix(vec3(1.0), uCol * 0.9, a), 1.0); }',
  });
  const contact = new THREE.Mesh(cg, matShadow); contact.frustumCulled = false; contact.renderOrder = 1; contact.visible = opts.contact !== false; object.add(contact);
  const swarf = new THREE.Points(geoS, matSwarf); swarf.frustumCulled = false; swarf.renderOrder = 7; object.add(swarf);
  await ctx.yield();

  // ---- the one mechanism: every part's pose from one progress value --------------------------------------
  const AX = V3(1, 0, 0), AY = V3(0, 1, 0), AZ = V3(0, 0, 1);
  const TWIST = { wing: [AY, 0.11], shell: [AX, 0.42], head: [AX, 0.42], link: [AX, 0.6], strut: [AX, 0.9], pin: [AY, 0.9], vane: [AX, 0.3] };
  const TW = 0.012, HOP_END = 0.78;
  for (const p of parts) {
    p.pivot = p.hp.clone();
    if (p.kind === 'wing') p.pivot.add(V3(p.side * 35, 0, 4).applyQuaternion(p.hq));
    if (p.kind === 'strut') p.pivot.x += 6;
  }
  const flexZ = (x, y, t) => { let k = clamp(y / FH, 0, 1.2); k *= k; return U.uFlex.value * k * Math.sin(t * 0.55 + x * 0.012); };
  const ease = (t) => t * t * (3 - 2 * t);
  const backOut = (t) => { const s = t - 1; return 1 + 2.2 * s * s * s + 1.2 * s * s; };
  // flight route of the Longwing after the beat: [U, point]; up and over the top bar, then down-valley
  const hole = V3(50, 67, 0);
  const pt = (d, h, s) => V3(hole.x, 0, 0).addScaledVector(pathDir, d).addScaledVector(pathRight, s).setY(h);
  const flight = opts.flight ? opts.flight.map((f) => [f[0], V3(f[1], f[2], f[3])]) : [
    [0.628, dockP.clone()], [0.650, dockP.clone().add(V3(-2, 36, -15))], [0.675, V3(dockP.x - 4, 178, -8)], [0.70, pt(72, 172, 26)],
    [0.76, pt(190, 136, 36)], [0.84, pt(330, 106, 22)], [0.92, pt(480, 122, 30)], [1.0, pt(640, 190, 60)]];
  const curve = new THREE.CatmullRomCurve3(flight.map((f) => f[1]), false, 'centripetal');
  const flightT = (u) => {
    const n = flight.length - 1; if (u <= flight[0][0]) return 0; if (u >= flight[n][0]) return 1;
    for (let i = 0; i < n; i++) if (u < flight[i + 1][0]) return (i + (u - flight[i][0]) / (flight[i + 1][0] - flight[i][0])) / n;
    return 1;
  };
  // arc length along the route, so the tail can lie along the path the hull has just flown (follow-my-leader)
  const NA = 240, arcL = new Float32Array(NA + 1), arcA = V3(0, 0, 0), arcB = V3(0, 0, 0);
  curve.getPoint(0, arcA);
  for (let i = 1; i <= NA; i++) { curve.getPoint(i / NA, arcB); arcL[i] = arcL[i - 1] + arcB.distanceTo(arcA); arcA.copy(arcB); }
  const lenAtT = (t) => { const f = clamp(t, 0, 1) * NA, i = Math.min(NA - 1, f | 0); return lerp(arcL[i], arcL[i + 1], f - i); };
  const tAtLen = (L) => {
    if (L <= 0) return 0; if (L >= arcL[NA]) return 1;
    let lo = 0, hi = NA; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arcL[m] <= L) lo = m; else hi = m; }
    return (lo + (L - arcL[lo]) / Math.max(arcL[hi] - arcL[lo], 1e-5)) / NA;
  };
  const dockQ = eulerQ(0.16, 0, 0);
  // the slip: while the hull is being built the Longwing's frame rides these keys [U, x, y, z, yaw, roll] (the
  // world keeps it about 100 m ahead of the camera), and glides to the dock before the wings seat
  const slip = opts.slip && opts.slip.length > 1 ? opts.slip.map((k) => ({ u: k[0], p: V3(k[1], k[2], k[3]), yaw: k[4] || 0, roll: k[5] || 0 })) : null;
  const slipCurve = slip ? new THREE.CatmullRomCurve3(slip.map((k) => k.p), false, 'centripetal') : null;
  const slipQ = new THREE.Quaternion(), slipE = new THREE.Euler(0, 0, 0, 'YXZ');
  function bodyAt(Uu, outP, outQ) {                              // the Longwing's frame while it is on the slip (false once docked)
    if (!slip || Uu >= slip[slip.length - 1].u) return false;
    const n = slip.length - 1; let i = 0, f = 0;
    if (Uu > slip[0].u) { while (i < n - 1 && Uu > slip[i + 1].u) i++; f = (Uu - slip[i].u) / Math.max(slip[i + 1].u - slip[i].u, 1e-5); }
    slipCurve.getPoint((i + f) / n, outP);
    if (outQ) { const e = f * f * (3 - 2 * f); outQ.setFromEuler(slipE.set(0, lerp(slip[i].yaw, slip[i + 1].yaw, e), lerp(slip[i].roll, slip[i + 1].roll, e))).multiply(dockQ); }
    return true;
  }
  // each hull shell swings out through its own via point near the camera line on its way to the slip
  // (opts.partVia(kind, index, side, U at the half-way moment, home) -> [x, y, z] local, or null); the last six tail links do the same
  for (const p of parts) if (opts.partVia && (p.kind === 'shell' || (p.kind === 'link' && p.link >= 14))) { const v = opts.partVia(p.kind, p.kind === 'shell' ? p.seg : p.link, p.side || 0, p.u0 + (p.kind === 'shell' ? 0.31 : 0.39) * p.du, p.hp); if (v) p.via = V3(v[0], v[1], v[2]); }
  // wing four's detour: it swings out to a point beside the camera line before it curves in to the dock
  const via = V3(...(opts.wing4Via || [-32, 66, 113]));
  const viaQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(pathDir, pathRight, V3().crossVectors(pathDir, pathRight)));
  const viaO = V3(0, 0, 0);
  const Cp = V3(0, 0, 0), Cq = new THREE.Quaternion(), fq = new THREE.Quaternion(), jq = new THREE.Quaternion();
  const P = V3(0, 0, 0), Q = new THREE.Quaternion(), gapW = V3(0, 0, 0), hpos = V3(0, 0, 0), hq = new THREE.Quaternion(), rq = new THREE.Quaternion();
  const c1 = V3(0, 0, 0), t1 = V3(0, 0, 0), t2 = V3(0, 0, 0), outP = V3(0, 0, 0), outQ = new THREE.Quaternion();
  const m4 = new THREE.Matrix4(), tailP = [], tailQ = [], lq = new THREE.Quaternion(), eul = new THREE.Euler(0, 0, 0, 'YXZ');
  const tailS = [], tb = V3(0, 0, 0), fq2 = new THREE.Quaternion(), CqInv = new THREE.Quaternion(), QID = new THREE.Quaternion();
  for (let i = 0; i < 20; i++) { tailP.push(V3(0, 0, 0)); tailQ.push(new THREE.Quaternion()); tailS.push(new THREE.Quaternion()); }
  const flap = [0, 0, 0, 0];
  const bez = (a, c, b, t, o) => { const s = 1 - t; return o.set(s * s * a.x + 2 * s * t * c.x + t * t * b.x, s * s * a.y + 2 * s * t * c.y + t * t * b.y, s * s * a.z + 2 * s * t * c.z + t * t * b.z); };
  let prog = 0, driven = false;

  function pose(Uu, time) {
    // the Longwing's own frame: at the dock, then along the flight route
    const fl = smoothstep(0.63, 0.70, Uu), fT = flightT(Uu);
    curve.getPoint(fT, Cp); curve.getPoint(Math.min(1, fT + 0.01), t1);
    Cq.copy(dockQ);
    const onSlip = bodyAt(Uu, Cp, Cq);
    if (Uu > 0.628 && t1.distanceToSquared(Cp) > 1e-4) {
      t1.y = Cp.y + (t1.y - Cp.y) * (0.3 + 0.7 * smoothstep(0.664, 0.70, Uu));     // level over the top bar: seen from behind and below, wings spread
      m4.lookAt(Cp, t1, AY); fq.setFromRotationMatrix(m4);
      Cq.slerp(fq, smoothstep(0.630, 0.652, Uu));
    }
    Cp.y += Math.sin(time * 0.8) * 0.7 * (1 - fl); if (onSlip) Cp.x += Math.sin(time * 0.53) * 0.5;
    // joints: the single stiff beat at 0.61-0.64, then a slow rowing beat in flight
    const b = (Uu - 0.61) / 0.03, f2 = smoothstep(0.642, 0.675, Uu);
    const hold = smoothstep(0.632, 0.645, Uu) * (1 - smoothstep(0.662, 0.694, Uu));       // wings held out nearly level while it clears the top bar
    for (let w = 0; w < 4; w++) {
      const bb = clamp(b - (w > 1 ? 0.08 : 0), 0, 1);
      flap[w] = 0.5 * Math.sin(TAU * bb) * Math.sin(Math.PI * bb) + f2 * (0.34 * (1 - 0.75 * hold) * Math.sin(time * 1.7 - (w > 1 ? 0.7 : 0)) + 0.05 * hold) + 0.012 * Math.sin(time * 3.1 + w);
    }
    let pq = null;
    const L0 = lenAtT(fT); CqInv.copy(Cq).invert();
    for (let i = 0; i < 20; i++) {
      const bw = clamp(b - i * 0.035, 0, 1);
      const th = lerp(curl, 0.09 * Math.sin(time * 1.5 - i * 0.42), fl) + 0.22 * Math.sin(TAU * bw) * Math.sin(Math.PI * bw) + 0.02 * Math.sin(time * 1.3 - i * 0.6);
      const ps = lerp(curlSign * 0.05, 0.06 * Math.sin(time * 1.1 - i * 0.5), fl);
      lq.setFromEuler(eul.set(th, ps, 0));
      if (i === 0) { tailP[0].set(0, 0, 30.6); tailS[0].copy(lq); } else tailS[i].copy(tailS[i - 1]).multiply(lq);
      // in flight each link also turns to lie along the route where the hull was that many metres ago
      tailQ[i].copy(tailS[i]);
      if (fl > 0.001) {
        const ti = Math.min(0.996, tAtLen(L0 - 33 - i * LINK));
        curve.getPoint(ti, t2); curve.getPoint(ti + 0.004, tb).sub(t2);
        if (tb.lengthSq() > 1e-8) { tb.normalize().negate().applyQuaternion(CqInv); fq2.setFromUnitVectors(AZ, tb); tailQ[i].copy(QID).slerp(fq2, fl).multiply(tailS[i]); }
      }
      if (i > 0) tailP[i].set(0, 0, LINK).applyQuaternion(pq).add(tailP[i - 1]);
      pq = tailQ[i];
    }
    for (const p of parts) {
      if (!p.live) continue;
      // where it sits when seated (P, Q) and the direction it slides home along (gapW)
      if (p.joint === 'hull') { P.copy(p.dp); Q.copy(p.dq); gapW.copy(p.gap); }
      else if (p.joint[0] === 'w') {
        const w = +p.joint[1], root = parts[w].dp;
        jq.setFromAxisAngle(AZ, WSIDE[w] * flap[w]);
        P.copy(p.dp).sub(root).applyQuaternion(jq).add(root); Q.copy(jq).multiply(p.dq); gapW.copy(p.gap).applyQuaternion(jq);
      } else { const i = p.link; P.copy(tailP[i]); Q.copy(tailQ[i]); gapW.copy(p.gap).applyQuaternion(Q); }
      P.applyQuaternion(Cq).add(Cp); Q.premultiply(Cq); gapW.applyQuaternion(Cq);
      const k = (Uu - p.u0) / p.du; let st = 0;
      if (k >= 1) { outP.copy(P); outQ.copy(Q); }
      else {
        // home pose on the flexing Frame: a leaf tremble, then three twists on the gates
        const tw = TWIST[p.kind], j = clamp((Uu - (p.u0 - TW)) / TW, 0, 1), exc = smoothstep(p.u0 - TW - 0.05, p.u0 - TW, Uu);
        const trem = (0.012 + 0.03 * exc) * (Math.sin(time * 23 + p.id * 1.7 + tremSeed) + Math.sin(time * 17.3 + p.id * 2.9));
        const ang = tw[1] * (trem + Math.sin(3 * TAU * j) * (0.35 + 0.65 * j));
        rq.setFromAxisAngle(tw[0], ang);
        hq.copy(rq).multiply(p.hq);
        hpos.copy(p.hp).sub(p.pivot).applyQuaternion(rq).add(p.pivot);
        hpos.z += flexZ(p.pivot.x, p.pivot.y, time);
        st = 0.6 * j;
        if (k < 0) { outP.copy(hpos); outQ.copy(hq); }
        else {
          st = 0.6 * (1 - k);
          t2.copy(P).add(gapW);                                      // the pre-seat point
          if (p.id === 3 && k < 0.9) {                               // wing four's long way round
            viaO.set(p.side * 35, 0, 4).applyQuaternion(viaQ).negate().add(via);
            if (k < 0.55) {
              const e = ease(k / 0.55);
              c1.copy(hpos).add(viaO).multiplyScalar(0.5).addScaledVector(pathRight, 34).add(t1.set(0, 26, 24));
              bez(hpos, c1, viaO, e, outP); outQ.copy(hq).slerp(viaQ, ease(Math.min(1, e * 1.25)));
            } else {
              const e = ease((k - 0.55) / 0.35);
              c1.copy(viaO).add(t2).multiplyScalar(0.5).addScaledVector(pathRight, 22).add(t1.set(0, 34, 10));
              bez(viaO, c1, t2, e, outP); outQ.copy(viaQ).slerp(Q, e);
            }
          } else {
            const hopEnd = p.id === 3 ? 0.9 : (p.hopEnd || HOP_END);
            if (k < hopEnd && p.via && p.kind === 'link') {
              // a late tail link: out to its via point off the camera's bow, a breath there, then away after the Longwing
              const x = k / hopEnd;
              if (x < 0.5) { const a = 1 - x * 2; c1.copy(hpos).add(p.via).multiplyScalar(0.5); c1.y += 2.5; bez(hpos, c1, p.via, 1 - a * a, outP); }
              else { const g0 = x * 2 - 1, g = g0 * g0 * (1.6 - 0.6 * g0); c1.copy(p.via).sub(hpos).multiplyScalar(0.6).add(p.via); c1.y += 3; bez(p.via, c1, t2, g, outP); }
              outQ.copy(hq).slerp(Q, ease(x));
            } else if (k < hopEnd) {
              const e = ease(k / hopEnd), d = hpos.distanceTo(t2);
              if (p.via) c1.copy(hpos).add(t2).multiplyScalar(-0.5).addScaledVector(p.via, 2);      // the curve passes through the via point half way
              else c1.copy(hpos).add(t2).multiplyScalar(0.5).add(t1.set(0, 0.16 * d, 0.34 * d));
              bez(hpos, c1, t2, e, outP); outQ.copy(hq).slerp(Q, e);
            } else { let t = (k - hopEnd) / (1 - hopEnd); if (p.kind === 'shell') t *= t;       // a hull half stands ajar a moment, then closes on its pins
              outP.copy(P).addScaledVector(gapW, 1 - backOut(t)); outQ.copy(Q); }
          }
        }
      }
      const o = p.id * 4;
      posArr[o] = outP.x; posArr[o + 1] = outP.y; posArr[o + 2] = outP.z; posArr[o + 3] = st;
      quatArr[o] = outQ.x; quatArr[o + 1] = outQ.y; quatArr[o + 2] = outQ.z; quatArr[o + 3] = outQ.w;
    }
  }

  // ---- update ------------------------------------------------------------------------------------------
  let sunWorld = null;
  const qs = new URLSearchParams(typeof opts.debug === 'string' ? opts.debug : '');   // viewer debugging only, passed in: the page address is never read
  const dbg = qs.get('prog');                         // viewer only: prog=0.57 holds a moment, prog=cam ties it to the orbit
  const dbg0 = parseFloat(qs.get('p0') || '0.3'), dbg1 = parseFloat(qs.get('p1') || '0.66');
  const size = new THREE.Vector2(), camW = V3(0, 0, 0), wq = new THREE.Quaternion();
  const center = V3(0, 74, 22);
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera) {
      const e = camera.projectionMatrix.elements;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = e[5] * size.y * 0.5; U.uPix.value = 2 / Math.max(e[5] * size.y, 64); }
    }
    let Uu = prog;
    if (!driven) {
      Uu = 0.18 + ((time / 40) % 1) * 0.8;            // nobody is driving: play the whole thing on a loop
      if (dbg === 'cam' && camera) {
        camW.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camW);
        const az = Math.atan2(camW.x - center.x, camW.z - center.z);
        Uu = lerp(dbg0, dbg1, clamp((az + 0.3) / (Math.PI * 1.5), 0, 1));
      } else if (dbg && !isNaN(parseFloat(dbg))) Uu = parseFloat(dbg);
    }
    U.uU.value = Uu;
    if (sunWorld) U.uSun.value.copy(sunWorld);
    else { object.getWorldQuaternion(wq); U.uSun.value.copy(sunLocal).applyQuaternion(wq); }
    pose(Uu, time);
  }
  pose(0, 0);

  // ---- anchors (all in the hero's local space) -----------------------------------------------------------
  const anchors = {
    // the hole wing four leaves: the camera's way through the Frame. 30 m wide (x 34.6..65.4), 70 m tall (y 31..103).
    hole: { position: hole.clone(), normal: V3(0, 0, 1), width: 30.8, height: 72.8 },
    // a safe camera line for the brief's approach (heading local (0.64,0,-0.77)): out in front, under the port
    // wingtip, through the hole 5.5 m from its port runner, and on down-valley. 6 m clear of everything docked.
    flyThrough: [-260, -170, -90, -40, 0, 40, 120].map((d, i) => V3(40.2, [36, 56, 66, 68, 68, 66, 56][i], 0).addScaledVector(pathDir, d)),
    // where the Longwing assembles (its hull centre) and how it faces there (nose to -z, pitched up 9 degrees)
    dock: { position: dockP.clone(), quaternion: dockQ.clone(), span: 150, length: 60 },
    // point the gaze here from u 0.3 to 0.64
    gaze: dockP.clone(),
    // the point beside the camera line that wing four swings out to (its centre), reached at U 0.564
    wing4Via: via.clone(),
    // the Longwing's route after the beat as [U, point]; with the default route it is over the top bar at U 0.675 (a world
    // that passes opts.flight sets its own moment); in flight the tail lies along the route just flown
    flight: flight.map((f) => ({ u: f[0], position: f[1].clone() })),
    // this piece does not seat the exit portal: the olive portal frame stands 420 m down-valley, along exitDir
    exitDir: pathDir.clone(),
    portalSeat: null,
    viewpoints: [
      { name: 'avenue end, the whole screen', position: V3(-150, 30, 330), lookAt: V3(0, 70, 0) },
      { name: 'shells crossing the bow', position: V3(-78, 45, 200), lookAt: dockP.clone() },
      { name: 'wing four beside us', position: via.clone().addScaledVector(pathRight, -10), lookAt: via.clone().addScaledVector(pathDir, 30) },
      { name: 'the beat', position: V3(0, 64, 108), lookAt: dockP.clone() },
      { name: 'in the hole', position: V3(40.2, 68, 6), lookAt: V3(40.2, 68, 0).addScaledVector(pathDir, 80) },
    ],
    sunDir: sunLocal.clone(),
    feet: [V3(-72, 0, 0), V3(72, 0, 0)],
    timeline: { hull: [0.219, 0.557], head: [0.532, 0.576], tail: [0.497, 0.582], vanes: [0.498, 0.543], wings: [0.515, 0.60], beat: [0.61, 0.64], overTopBar: 0.675, lastLinks: [0.650, 0.718] },
  };
  // viewer-only debugging: vr=<radius> and vc=x,y,z bring the orbit of tools/shot.mjs _part closer
  const vr = parseFloat(qs.get('vr') || ''), vc = (qs.get('vc') || '').split(',').map(Number);
  const viewC = vc.length === 3 && !vc.some(isNaN) ? V3(vc[0], vc[1], vc[2]) : center;
  return {
    object, radius: vr > 0 ? vr : 135, height: vr > 0 ? vr : FH, center: viewC, anchors, ground: true, groundY: 0,
    uniforms: U,
    setProgress(u) { driven = true; prog = u; },
    setSun(dirWorld, keyHex, fillHex) {
      if (dirWorld) sunWorld = V3(dirWorld.x ?? dirWorld[0], dirWorld.y ?? dirWorld[1], dirWorld.z ?? dirWorld[2]).normalize();
      if (keyHex) U.uKey.value.set(keyHex); if (fillHex) U.uFill.value.set(fillHex);
    },
    bodyAt,
    bodyNow(p, q) { p.copy(Cp); q.copy(Cq); },                      // the Longwing's frame as last posed (local): for the world's painted shadow
    partLocal(i, target = V3(0, 0, 0)) { return target.set(posArr[i * 4], posArr[i * 4 + 1], posArr[i * 4 + 2]); },
    partQuaternion(i, target = new THREE.Quaternion()) { return target.set(quatArr[i * 4], quatArr[i * 4 + 1], quatArr[i * 4 + 2], quatArr[i * 4 + 3]); },
    update, dispose() {},
  };
}

// shared with the world module (src/worlds/still-on-the-sprue.js): the geometry accumulator and plate helpers
export { Geo, plate, roundRect };
