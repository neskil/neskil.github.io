// The Shaft Between the Hexagons: the hero set piece. One six-sided gallery cell, built exactly (shelf walls, the low
// rail, two lamps, the wall piers) in its makes (full, full with shut doors, middle, far, rim) and tiled by instancing into a honeycomb round
// vast air shafts. The make of a cell is fixed at build by the distance of its nearest point to the route's line: nothing changes where
// it is. Books are drawn by the wall shader (blank spines of several heights and colours, worn gilt bands, no letters).
// Also here: the librarians (robed simple figures), the falling pages, the lamps' halos, the vestibule with its spiral
// stair and mirror, and the round chamber whose wall is one great book's spine.
import * as THREE from 'three';

// EYE: the height of the route's line over a gallery floor: 2.5 m over the top of the rails it crosses (RAILH + 2.5).
export const AP = 9, PITCH = 8, CLEAR = 7, WALL = 6.5, RAILH = 1.8, EYE = 4.3;
export const SQ3 = Math.sqrt(3), HR = AP * 2 / SQ3, WR = WALL * 2 / SQ3;
// axial hex directions; side i of a cell faces direction DIRS[i]; the angle of side i is i * 60 degrees (0 = +x)
export const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
export const cellXZ = (q, r) => [2 * AP * (q + r / 2), AP * SQ3 * r];
export const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
const mod = (a, n) => ((a % n) + n) % n;
// which shaft (lattice 4i, 4j) a cell belongs to as part of its empty cluster, or null for a gallery
export function shaftOf(q, r) {
  const i = Math.round(q / 4), j = Math.round(r / 4);
  for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) if (hexDist(q - 4 * a, r - 4 * b) <= 1) return [a, b];
  return null;
}
// a gallery's open sides (those that face a shaft's cell) and its kind
export function galleryInfo(q, r) {
  const open = [];
  for (let i = 0; i < 6; i++) open.push(shaftOf(q + DIRS[i][0], r + DIRS[i][1]) ? 1 : 0);
  let first = -1, corner = false;
  for (let i = 0; i < 6; i++) if (open[i] && open[mod(i + 3, 6)]) { corner = true; first = Math.min(i, mod(i + 3, 6)); }
  if (!corner) for (let i = 0; i < 6; i++) if (open[i] && open[mod(i + 1, 6)]) first = i;
  // an edge gallery has a vestibule door in each wall opposite an open side (world sides first + 3 and first + 4)
  return { open, corner, rot: first, doors: corner ? [] : [mod(first + 3, 6), mod(first + 4, 6)] };
}

// ---------------------------------------------------------------- a small merged-geometry builder
// attributes: position, normal, uv, aMat (material id). Material ids:
// 0 wood  1 shelf wall (books by the shader)  2 floor  3 ceiling  4 rail  5 lamp globe  6 the great spine  7 vellum / paper
// 8 dark (door mouths, hollows)  9 chamber stone  10 rail panel cut through  11 rail panel painted  12 a glowing page
export function makeGB() {
  const P = [], N = [], U = [], M = [], I = [];
  const gb = {
    get triangles() { return I.length / 3; },
    quad(a, b, c, d, mat, uv = [0, 0, 1, 1]) {
      const n = P.length / 3;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (const p of [a, b, c, d]) { P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); M.push(mat); }
      U.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]);
      I.push(n, n + 1, n + 2, n, n + 2, n + 3);
      return gb;
    },
    // a box between two corners in a frame: origin o, unit axes ex, ey, ez (arrays), extents along each
    box(o, ex, ey, ez, x0, x1, y0, y1, z0, z1, mat, skip = '') {
      const pt = (x, y, z) => [o[0] + ex[0] * x + ey[0] * y + ez[0] * z, o[1] + ex[1] * x + ey[1] * y + ez[1] * z, o[2] + ex[2] * x + ey[2] * y + ez[2] * z];
      // a left-handed frame would wind every face inward: mirror the box along its first axis instead
      const det = (ex[1] * ey[2] - ex[2] * ey[1]) * ez[0] + (ex[2] * ey[0] - ex[0] * ey[2]) * ez[1] + (ex[0] * ey[1] - ex[1] * ey[0]) * ez[2];
      if (det < 0) { const k = x0; x0 = x1; x1 = k; skip = skip.replace('l', 'L').replace('r', 'l').replace('L', 'r'); }
      const c = [pt(x0, y0, z0), pt(x1, y0, z0), pt(x1, y1, z0), pt(x0, y1, z0), pt(x0, y0, z1), pt(x1, y0, z1), pt(x1, y1, z1), pt(x0, y1, z1)];
      if (!skip.includes('f')) gb.quad(c[4], c[5], c[6], c[7], mat);
      if (!skip.includes('b')) gb.quad(c[1], c[0], c[3], c[2], mat);
      if (!skip.includes('r')) gb.quad(c[5], c[1], c[2], c[6], mat);
      if (!skip.includes('l')) gb.quad(c[0], c[4], c[7], c[3], mat);
      if (!skip.includes('t')) gb.quad(c[7], c[6], c[2], c[3], mat);
      if (!skip.includes('u')) gb.quad(c[0], c[1], c[5], c[4], mat);
      return gb;
    },
    // a lat-long ball
    ball(cx, cy, cz, rad, nu, nv, mat) {
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const p = (a, b) => { const th = a / nu * Math.PI * 2, ph = b / nv * Math.PI; return [cx + rad * Math.sin(ph) * Math.cos(th), cy + rad * Math.cos(ph), cz + rad * Math.sin(ph) * Math.sin(th)]; };
        gb.quad(p(i, j + 1), p(i + 1, j + 1), p(i + 1, j), p(i, j), mat);
      }
      return gb;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 1));
      g.setIndex(I);
      return g;
    },
  };
  return gb;
}

// ---------------------------------------------------------------- one gallery cell
// Cell space: origin at the middle of the floor, +y up, side i's outward normal at i * 60 degrees from +x toward +z.
// kind 'edge': open sides 0 and 1, a vestibule door in each wall opposite them (sides 3 and 4). kind 'corner': open
// sides 0 and 3, four shelf walls. make 3 is the rim alone (slab edge, rail, posts) for the well in the chamber's floor.
// make 0 full (shelf boards in relief, turned balusters, the door cut open), 1 middle, 2 far, 4 the full make with its
// doors drawn shut by the shader as the middle make draws them (for a full cell with no vestibule behind its doors).
// The two lamps hang 3.6 m either side of the middle on the line square to the cell's own mirror line (the line through
// the stair corner), so that every way across the cell, door to rail, passes them alike: 3.12 m to the side. With the
// eye at 4.3 m a globe at the full of its swing stays 2.5 m off the route's line (3.32 - 0.55 globe - 0.25 swing).
export const SHELF_Y = [0.25, 1.55, 2.85, 4.15, 5.45, 6.75], DOOR_W = 3.6, DOOR_H = 6.2;
export const LAMPS = [[-1.8, 5.45, 3.118], [1.8, 5.45, -3.118]], LAMP_R = 0.55, SWING = 0.25;
// The vestibule (see vestibuleGeometry for its space). lamp: the vestibule's ONE lamp, a small globe (lampR) on a rod in the air of the stair niche, 0.7 m inside the niche's
// mouth and 5.45 m up. This one constant gives the globe its place (vestibuleGeometry), the library shader its light for
// every vestibule and niche stair (LIB_FRAG), and the world file its glow (the halo point): they cannot part. It does
// not swing. With the eye at 4.3 m on the passage's middle line the globe stays 2.51 m off the route's line.
export const VEST = { half: 2.5, w: DOOR_W / 2, nicheX: 1.3, nicheZ: -4.45, stairZ: -3.15, stairScale: 0.78, mirrorX: 1.9, mirrorY0: 0.5, mirrorY1: 5.6, lamp: [0, 5.45, -2.5], lampR: 0.24 };
function rimGeometry(gb, open) {
  const hv = (rad, k) => [rad * Math.cos((30 + 60 * k) * Math.PI / 180), rad * Math.sin((30 + 60 * k) * Math.PI / 180)];
  const vquad = (p, q, y0, y1, mat, uv) => gb.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], mat, uv);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, n = [Math.cos(a), Math.sin(a)], t = [-Math.sin(a), Math.cos(a)], h = HR / 2;
    const at = (ap, s) => [n[0] * ap + t[0] * s, n[1] * ap + t[1] * s];
    if (open[i]) {
      vquad(at(AP, h), at(AP, -h), -1, 0, 0);
      vquad(at(AP - 0.25, h), at(AP - 0.25, -h), 0, RAILH, 10, [0, 0, 13, 1]);
      vquad(at(AP - 0.25, -h), at(AP - 0.25, h), 0, RAILH, 10, [0, 0, 13, 1]);
    }
    const co = hv(HR, i);
    if (open[i] || open[(i + 1) % 6]) gb.box([co[0] * 0.972, 0, co[1] * 0.972], [1, 0, 0], [0, 1, 0], [0, 0, 1], -0.26, 0.26, 0, RAILH + 0.25, -0.26, 0.26, 4, 'u');
  }
  return gb.build();
}
export function cellGeometry(kind, make) {
  const gb = makeGB(), open = kind === 'edge' ? [1, 1, 0, 0, 0, 0] : [1, 0, 0, 1, 0, 0], doors = kind === 'edge' ? [3, 4] : [];
  if (make === 3) return rimGeometry(gb, open);
  const full = make === 0 || make === 4, cut = make === 0;
  const X = [1, 0, 0], Y = [0, 1, 0];
  const vquad = (p, q, y0, y1, mat, uv) => gb.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], mat, uv);
  const hv = (rad, k) => [rad * Math.cos((30 + 60 * k) * Math.PI / 180), rad * Math.sin((30 + 60 * k) * Math.PI / 180)];
  // floor and ceiling over the whole lattice hexagon
  const v = [0, 1, 2, 3, 4, 5].map((k) => hv(HR, k)), f3 = (p, y) => [p[0], y, p[1]];
  gb.quad(f3(v[3], 0), f3(v[2], 0), f3(v[1], 0), f3(v[0], 0), 2, [0, 0, 1, 1]);
  gb.quad(f3(v[5], 0), f3(v[4], 0), f3(v[3], 0), f3(v[0], 0), 2, [0, 0, 1, 1]);
  gb.quad(f3(v[0], CLEAR), f3(v[1], CLEAR), f3(v[2], CLEAR), f3(v[3], CLEAR), 3);
  gb.quad(f3(v[0], CLEAR), f3(v[3], CLEAR), f3(v[4], CLEAR), f3(v[5], CLEAR), 3);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, n = [Math.cos(a), Math.sin(a)], t = [-Math.sin(a), Math.cos(a)];
    const at = (ap, s) => [n[0] * ap + t[0] * s, n[1] * ap + t[1] * s];
    const N3 = [n[0], 0, n[1]], T3 = [t[0], 0, t[1]];
    if (!open[i]) {
      const h = WR / 2;
      if (doors.includes(i) && cut) {
        // the wall cut open: two shelved parts, a lintel, a wooden frame round the mouth
        const ud = DOOR_W / 2 / WR;
        vquad(at(WALL, -h), at(WALL, -DOOR_W / 2), 0, CLEAR, 1, [0, 0, 0.5 - ud, 1]);
        vquad(at(WALL, DOOR_W / 2), at(WALL, h), 0, CLEAR, 1, [0.5 + ud, 0, 1, 1]);
        vquad(at(WALL, -DOOR_W / 2), at(WALL, DOOR_W / 2), DOOR_H, CLEAR, 0);
        for (const sg of [-1, 1]) gb.box([0, 0, 0], T3, Y, N3, sg * DOOR_W / 2 - 0.22, sg * DOOR_W / 2 + 0.22, 0, DOOR_H + 0.25, WALL - 0.3, WALL + 0.05, 0, 'fu');
        gb.box([0, 0, 0], T3, Y, N3, -DOOR_W / 2 - 0.22, DOOR_W / 2 + 0.22, DOOR_H, DOOR_H + 0.3, WALL - 0.34, WALL + 0.05, 0, 'f');
      } else {
        vquad(at(WALL, -h), at(WALL, h), 0, CLEAR, 1, doors.includes(i) ? [2, 0, 3, 1] : [0, 0, 1, 1]);
      }
      if (full) {
        // shelf boards and uprights in relief (the shader draws the same boards on the plainer makes)
        const spans = doors.includes(i) ? [[-h, -DOOR_W / 2 - 0.22], [DOOR_W / 2 + 0.22, h]] : [[-h, h]];
        for (const [s0, s1] of spans) {
          for (const y of SHELF_Y) gb.box([0, 0, 0], T3, Y, N3, s0, s1, y - 0.07, y + 0.07, WALL - 0.2, WALL, 0, 'flr');
          const nu = doors.includes(i) ? 1 : 3;
          for (let k = 0; k <= nu; k++) { const s = s0 + (s1 - s0) * k / nu; gb.box([0, 0, 0], T3, Y, N3, s - 0.08, s + 0.08, 0, CLEAR, WALL - 0.22, WALL, 0, 'ftu'); }
        }
      }
    } else {
      // open side: the slab's edge, the low rail at the lattice edge
      const h = HR / 2;
      vquad(at(AP, h), at(AP, -h), -1, 0, 0);
      if (full) {
        gb.box([0, 0, 0], T3, Y, N3, -h, h, RAILH - 0.16, RAILH, AP - 0.42, AP - 0.08, 4);
        gb.box([0, 0, 0], T3, Y, N3, -h, h, 0, 0.22, AP - 0.4, AP - 0.1, 4, 'u');
        const nb = 13;
        for (let k = 0; k < nb; k++) { const s = -h + (k + 0.5) * 2 * h / nb; gb.box([0, 0, 0], T3, Y, N3, s - 0.09, s + 0.09, 0.22, RAILH - 0.16, AP - 0.34, AP - 0.16, 4, 'tu'); }
      } else {
        // a panel: in the middle make the shader cuts the balusters out of it (material 10, both faces); in the far
        // make the same balusters are painted on it, the gaps dark (material 11, one face). Which it is comes of the
        // cell's make, fixed at build: never of the eye's distance.
        vquad(at(AP - 0.25, h), at(AP - 0.25, -h), 0, RAILH, make === 1 ? 10 : 11, [0, 0, 13, 1]);
        if (make === 1) vquad(at(AP - 0.25, -h), at(AP - 0.25, h), 0, RAILH, 10, [0, 0, 13, 1]);
      }
    }
    // the corner between side i and side i + 1
    const j = (i + 1) % 6, ci = hv(WR, i), co = hv(HR, i);
    if (open[i] !== open[j]) {
      // a pier: the end of the 5 m wall between two galleries, facing the open side
      if (open[i]) vquad(co, ci, 0, CLEAR, 0, [0, 0, 0.4, 1]); else vquad(ci, co, 0, CLEAR, 0, [0, 0, 0.4, 1]);
    } else if (open[i] && (make < 2 || full)) {
      gb.box([co[0] * 0.972, 0, co[1] * 0.972], X, Y, [0, 0, 1], -0.26, 0.26, 0, RAILH + 0.25, -0.26, 0.26, 4, 'u');
    }
  }
  if (make < 2 || full) for (const L of LAMPS) {
    gb.ball(L[0], L[1], L[2], LAMP_R, full ? 10 : 6, full ? 6 : 4, 5);
    gb.box([L[0], 0, L[2]], X, Y, [0, 0, 1], -0.04, 0.04, L[1] + LAMP_R - 0.05, CLEAR, -0.04, 0.04, 4, 'tu');
  }
  return gb.build();
}

// ---------------------------------------------------------------- the library's one shader
// Light is worked out in the space of the ROOM an instance stands in, at the true places of that room's lamps: a gallery
// has its two lamps on rods (LAMPS, the same places in every cell, swinging), a vestibule its one globe in the stair
// niche (VEST.lamp, still). Every instance carries its room (iRoom: where its own origin lies in the room's space, x and
// z; its scale; the room's kind, 0 a gallery, 1 a vestibule): a cell, a prop built in cell space and a vestibule are
// their own room; a gallery's stair stands at the stair corner of its gallery, a niche's stair in the niche of its
// vestibule. No lit term is taken at a place turned or moved with an instance of its own. Plus a low warm fill and the
// shaft's dusk; fog thickens to the depth colour and, far off, the cold haze.
const GLSL_COMMON = /* glsl */`
  float h11(float n) { return fract(sin(n) * 43758.5453); }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 h23(vec2 p) { return fract(sin(vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)))) * 43758.5453); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
const LIB_VERT = /* glsl */`
  attribute float aMat;
  #ifdef USE_INSTANCING
  attribute vec4 iSeed; attribute vec4 iRoom;
  #endif
  uniform vec4 uSeedOne; uniform float uTime;
  // vSeed, vSway and vKind are the instance's own (alike at every vertex of it): they go flat, so that no pixel gets
  // them a last bit off by interpolation (the flicker's hash would turn that bit into a weave of two brightnesses)
  varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNL; varying vec2 vUv; varying float vMat; flat varying vec4 vSeed; flat varying vec2 vSway;
  varying vec3 vRoom; flat varying float vKind;
  void main() {
    vLocal = position; vNL = normal; vUv = uv; vMat = aMat;
    vec4 p = vec4(position, 1.);
    // the lamps hang on rods and swing a little in the draught of the shaft, each gallery's its own way (the halo swings
    // with the same numbers); the light on the walls goes with them
    #ifdef USE_INSTANCING
    vSeed = iSeed;
    float hs = iSeed.x;
    vec3 swL = transpose(mat3(instanceMatrix)) * (vec3(cos(hs * 40.), 0., sin(hs * 40.)) * ${SWING.toFixed(2)} * sin(uTime * 1.6 + hs * 25.));
    // (a vestibule's globe hangs still: no sway there, of the globe or of its light)
    vSway = swL.xz * (1. - iRoom.w);
    vRoom = position * iRoom.z + vec3(iRoom.x, 0., iRoom.y); vKind = iRoom.w;
    float toRod = min(length(position.xz - vec2(${LAMPS[0][0].toFixed(3)}, ${LAMPS[0][2].toFixed(3)})), length(position.xz - vec2(${LAMPS[1][0].toFixed(3)}, ${LAMPS[1][2].toFixed(3)})));
    float rod = (aMat > 3.5 && aMat < 4.5 && position.y > 5.8 && toRod < 0.07) ? clamp((7. - position.y) / 1.55, 0., 1.) : 0.;
    p.xz += vSway * max(rod, (aMat > 4.5 && aMat < 5.5) ? 1. : 0.);
    p = instanceMatrix * p;
    #else
    vSeed = uSeedOne; vSway = vec2(0.); vRoom = position; vKind = 0.;
    #endif
    vec4 w = modelMatrix * p; vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const LIB_BOOKS = /* glsl */`
  // blank spines of several heights and colours on five long shelves; x across the wall in metres, y up
  vec3 bookWall(float x, float y, vec4 seed, vec3 wood, float blur, out float gilt) {
    gilt = 0.;
    float s = (y - 0.25) / 1.3, row = floor(s), fy = fract(s) * 1.3;
    if (y < 0.25 || y > 6.75) return wood * 0.8;
    if (fy < 0.07 || fy > 1.23) return wood * 1.15;
    float bay = floor(x / 2.502), fb = fract(x / 2.502) * 2.502;
    if (fb < 0.08 || fb > 2.422) return wood;
    float key = seed.x * 91.7 + row * 7.31;
    // the crimson hexagon's books are smaller than the others
    float bx = x / mix(0.17, 0.105, seed.z), id = floor(bx), fx = fract(bx);
    vec3 h = h23(vec2(id, key)), h2 = h23(vec2(id + 31., key + 5.));
    // the shelves are well filled: one bay in fifty stands empty (half of them in a stripped gallery), one book in
    // fifty is missing from its row, and the books stand 0.74 to 1.14 m tall under boards 1.16 m apart
    float emptied = step(h21(vec2(bay + row * 13., seed.x * 57.)), 0.02 + 0.5 * step(0.93, seed.x));
    float tall = (0.74 + 0.4 * h.y) * mix(1., 0.66, seed.z), yb = fy - 0.07;
    float isBook = step(0.07, fx) * step(yb, tall) * (1. - emptied) * step(0.02, h.x);
    // bindings: leather browns and ochres, a dull red, and the district's own (green or black)
    vec3 c = mix(vec3(0.30, 0.16, 0.08), vec3(0.52, 0.36, 0.17), h.z);
    c = mix(c, vec3(0.36, 0.08, 0.06), step(0.82, h2.x));
    c = mix(c, vec3(0.62, 0.54, 0.38), step(0.9, h2.y));
    vec3 dist = seed.y < 0.5 ? c : (seed.y < 1.5 ? vec3(0.07, 0.24, 0.13) : vec3(0.045, 0.045, 0.06));
    c = mix(c, dist * (0.7 + 0.6 * h.z), step(0.5, seed.y) * step(h2.z, 0.72));
    c = mix(c, mix(vec3(0.55, 0.05, 0.05), vec3(0.75, 0.42, 0.10), step(0.7, h2.x)) * (0.7 + 0.5 * h.z), seed.z);
    float rnd = 0.62 + 0.38 * cos((fx - 0.535) * 2.9);
    float band = step(0.55, h2.y) * (step(abs(yb - tall * 0.78), 0.022) + step(abs(yb - tall * 0.70), 0.012) + step(abs(yb - tall * 0.16), 0.022));
    gilt = band * isBook * (1. - blur) * (0.5 + 0.5 * h.x);
    vec3 book = c * rnd + vec3(0.75, 0.55, 0.2) * gilt * 0.5;
    // the back and the insides of a shelf are warm wood that takes the lamps' light like the rest of the wall: lightest
    // low in the compartment, in the shade of the board above toward its top; never under a third of the wood's own tone
    vec3 back = wood * mix(0.56, 0.33, smoothstep(0.45, 1.2, fy));
    // (in the crimson hexagon the shelves are lined with dark red cloth, so the room keeps its red)
    back = mix(back, vec3(0.16, 0.03, 0.025) * (0.8 + 0.4 * wood.r / 0.3), seed.z);
    vec3 sharp = mix(back, book, isBook);
    vec3 avg = mix(wood * 0.5, mix(vec3(0.36, 0.22, 0.11), dist, step(0.5, seed.y) * 0.6), 0.82 * (1. - emptied));
    avg = mix(avg, vec3(0.5, 0.12, 0.06), seed.z * 0.8 * (1. - emptied));
    return mix(sharp, avg, blur);
  }
`;
const LIB_FRAG = /* glsl */`
  uniform float uTime, uFogK, uGutter, uGlobe;
  uniform vec3 uLampCol, uCrimCol, uAmb, uDepth, uHaze;
  varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNL; varying vec2 vUv; varying float vMat; flat varying vec4 vSeed; flat varying vec2 vSway;
  varying vec3 vRoom; flat varying float vKind;
  ${GLSL_COMMON}
  ${LIB_BOOKS}
  void main() {
    float mat = floor(vMat + 0.5), dist = length(vWorld - cameraPosition);
    vec3 n = normalize(vNL);
    float grain = 0.75 + 0.5 * vnoise(vec2((vLocal.x + vLocal.z) * 1.7, vLocal.y * 14.));
    vec3 wood = vec3(0.30, 0.165, 0.075) * grain;
    // the two lamps: which are lit comes with the cell; in the redder hour half of them gutter
    float code = floor(vSeed.w + 0.5), onA = step(0.5, mod(code, 2.)), onB = step(1.5, code);
    // (the crimson hexagon's lamps are tended by those who kneel there: they do not gutter)
    float gut = step(0.5, h11(vSeed.x * 9.1)) * uGutter * (1. - vSeed.z);
    // the flames are never still: each gallery's lamps waver at their own slow beat, with a small quick tremor
    float breathe = 1. + 0.11 * sin(uTime * 2.6 + vSeed.x * 30.) + 0.08 * sin(uTime * 3.7 + vSeed.x * 50.) + 0.03 * sin(uTime * 6.5 + vSeed.x * 70.);
    float flick = breathe * (1. - gut * (0.45 + 0.35 * sin(uTime * (5. + 4. * h11(vSeed.x * 3.3)) + vSeed.x * 40.) * sin(uTime * 1.7 + vSeed.x * 11.)));
    vec3 lampCol = mix(uLampCol, uCrimCol * 1.15, vSeed.z);
    vec3 alb = wood, emis = vec3(0.);
    if (mat == 0.) { float pk = (vLocal.x + vLocal.z) * 1.3; alb *= (0.86 + 0.28 * h11(floor(pk))) * (1. - 0.45 * step(fract(pk), 0.035) * step(abs(n.y), 0.5)) * (1. - 0.35 * step(abs(vLocal.y - 1.3), 0.035) - 0.35 * step(abs(vLocal.y - 5.9), 0.035)); }
    float fwx = fwidth(vUv.x) * ${WR.toFixed(4)};
    float giltK = 0.;
    if (mat == 1.) {
      float door = step(1.5, vUv.x), u = vUv.x - 2. * door, x = u * ${WR.toFixed(4)}, y = vUv.y * ${CLEAR.toFixed(1)};
      float blur = smoothstep(0.25, 0.9, fwx / 0.17);
      alb = bookWall(x, y, vSeed, wood, blur, giltK);
      float dx = abs(x - ${(WR / 2).toFixed(4)});
      float inDoor = door * step(dx, ${(DOOR_W / 2 + 0.22).toFixed(2)}) * step(y, ${(DOOR_H + 0.28).toFixed(2)});
      float mouth = door * step(dx, ${(DOOR_W / 2).toFixed(2)}) * step(y, ${DOOR_H.toFixed(2)});
      alb = mix(alb, wood * 1.1, inDoor);
      alb = mix(alb, vec3(0.012, 0.009, 0.008), mouth);
      emis += mouth * lampCol * 0.05 * smoothstep(${DOOR_H.toFixed(1)}, 0., y);
      alb *= 0.55 + 0.45 * smoothstep(0., 1.0, y);
    } else if (mat == 2.) {
      float bd = floor(vLocal.x / 0.62), run = vLocal.z + 1.7 * h11(bd * 3.1);
      float pl = h21(vec2(bd, floor(run / 3.4)));
      alb = vec3(0.33, 0.19, 0.095) * (0.7 + 0.5 * pl) * grain;
      float seam = step(fract(vLocal.x / 0.62), 0.045) + step(fract(run / 3.4), 0.012);
      alb *= 1. - 0.5 * clamp(seam, 0., 1.);
      // worn pale round the middle, where the librarians walk
      alb = mix(alb, vec3(0.42, 0.30, 0.17), 0.35 * smoothstep(5.5, 1., length(vLocal.xz)) * vnoise(vLocal.xz * 0.9));
    } else if (mat == 3.) {
      float ang = atan(vLocal.z, vLocal.x + 1e-5), rad = length(vLocal.xz);
      float beam = step(abs(fract(ang * 0.95493 + 0.5) - 0.5), 0.035 / max(rad * 0.33, 0.2)) + step(abs(rad - 4.4), 0.16) + step(abs(rad - 7.3), 0.16);
      alb = mix(vec3(0.44, 0.37, 0.26), wood * 0.9, clamp(beam, 0., 1.));
    } else if (mat == 4.) {
      alb = wood * 0.85 + vec3(0.03, 0.02, 0.0);
    } else if (mat == 10. || mat == 11.) {
      // the rail as a panel: cut through between the balusters in the middle make (10), painted in the far make (11)
      float solid = step(0.9, vUv.y) + step(vUv.y, 0.12) + step(abs(fract(vUv.x) - 0.5), 0.17);
      if (solid < 0.5 && mat == 10.) discard;
      alb = wood * (solid < 0.5 ? 0.35 : 0.85);
    } else if (mat == 5.) {
      float on = mix(onB, onA, step(0., vLocal.z));
      alb = vec3(0.5, 0.42, 0.28);
      emis = lampCol * (uGlobe * on * flick * (0.8 + 0.2 * n.y) + 0.04);
    } else if (mat == 7.) {
      float hatch = step(0.55, fract(vUv.y * 13.)) * step(0.12, vUv.x) * step(vUv.x, 0.88) * step(h11(floor(vUv.y * 13.) + vSeed.x * 7.), 0.85);
      alb = mix(vec3(0.62, 0.53, 0.36), vec3(0.3, 0.29, 0.27), hatch * 0.75);
    } else if (mat == 12.) {
      // an open page of the crimson hexagon: coloured shapes that stir (no letters), inside a cream margin
      vec2 pp = vUv * vec2(3., 2.2) + vSeed.x * 9.;
      float f1 = sin(pp.x * 2.1 + uTime * 0.6) * sin(pp.y * 2.7 - uTime * 0.45) + 0.5 * sin((pp.x + pp.y) * 3.3 + uTime * 0.8);
      vec3 pic = 0.5 + 0.5 * cos(6.2831 * (f1 * 0.35 + vUv.x * 0.25 + vec3(0.0, 0.33, 0.67)));
      pic = mix(pic, vec3(1., 0.75, 0.25), step(0.82, fract(f1 * 1.5 + 0.2)));
      float inside = step(0.08, vUv.x) * step(vUv.x, 0.92) * step(0.1, vUv.y) * step(vUv.y, 0.9) * (1. - step(abs(vUv.x - 0.5), 0.015));
      alb = vec3(0.6, 0.5, 0.34);
      emis = pic * inside * (0.9 + 0.25 * sin(uTime * 1.3 + vSeed.x * 20.));
    } else if (mat == 8.) {
      alb = vec3(0.012, 0.01, 0.01);
    } else if (mat == 9.) {
      alb = vec3(0.3, 0.26, 0.2) * (0.8 + 0.4 * vnoise(vLocal.xz * 0.7));
    }
    vec3 lit = uAmb * (0.75 + 0.25 * n.y);
    // faces turned out to the shaft take its dusk: cool shade against the warm rooms
    lit += uHaze * 1.5 * clamp(dot(n.xz, vLocal.xz) / max(length(vLocal.xz), 0.5), 0., 1.) * smoothstep(5., 8., length(vLocal.xz));
    // the room's lamps at their true places in the room's space (vRoom): a gallery's two (A and B, swinging), or a
    // vestibule's one globe, which burns by lamp code 2 in lamp B's stead (lamp A is out there)
    vec3 dA = vec3(${LAMPS[0][0].toFixed(3)} + vSway.x, ${LAMPS[0][1].toFixed(2)}, ${LAMPS[0][2].toFixed(3)} + vSway.y) - vRoom;
    vec3 dB = mix(vec3(${LAMPS[1][0].toFixed(3)} + vSway.x, ${LAMPS[1][1].toFixed(2)}, ${LAMPS[1][2].toFixed(3)} + vSway.y), vec3(${VEST.lamp[0].toFixed(3)}, ${VEST.lamp[1].toFixed(2)}, ${VEST.lamp[2].toFixed(3)}), vKind) - vRoom;
    float a2 = dot(dA, dA), b2 = dot(dB, dB);
    float nA = clamp(dot(n, dA) / sqrt(max(a2, 1e-4)), 0., 1.), nB = clamp(dot(n, dB) / sqrt(max(b2, 1e-4)), 0., 1.);
    // (the lamps hang 2.9 m from the nearest wall, where round 1's hung 4 m: the fall-off is 26 / (14 + d2), which gives
    // the floor under a lamp and the far walls what 22 / (8 + d2) gave them and keeps the near wall from burning out)
    lit += lampCol * flick * (onA * (0.24 + 0.76 * nA) * 26. / (14. + a2) + onB * (0.24 + 0.76 * nB) * 26. / (14. + b2));
    lit = min(lit, vec3(2.4));
    vec3 col = alb * lit + emis + vec3(1., 0.72, 0.3) * giltK * lit * 0.5;
    // a gleam on the floor under each lit lamp
    if (mat == 2.) col += lampCol * flick * 0.10 * (onA * exp(-dot(dA.xz, dA.xz) * 0.3) + onB * exp(-dot(dB.xz, dB.xz) * 0.3));
    float f = 1. - exp(-dist * uFogK);
    col = mix(col, mix(uDepth, uHaze, smoothstep(50., 300., dist)), clamp(f, 0., 1.));
    gl_FragColor = vec4(col, 1.);
  }
`;
export function makeLibraryMaterial(look) {
  const uniforms = {
    uTime: { value: 0 }, uFogK: { value: look.fogK }, uGutter: { value: look.gutter }, uGlobe: { value: look.globe },
    uLampCol: { value: look.lampCol }, uCrimCol: { value: look.crimCol }, uAmb: { value: look.amb },
    uDepth: { value: look.depth }, uHaze: { value: look.haze }, uSeedOne: { value: new THREE.Vector4(0.37, 0, 0, 3) },
  };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: LIB_VERT, fragmentShader: LIB_FRAG });
}

// ---------------------------------------------------------------- tiling: cells -> instanced meshes
// cells: [{ x, y, z, rot (0..5), kind 'edge'|'corner', make 0|1|2, seed [hash, district, crimson, lamps], chunk,
// room [x, z, scale, kind] (see the shader: where the instance's origin lies in its room's space; left out, the instance
// is its own room, a gallery) }]
// One InstancedMesh per (kind, make, chunk), each with its own bounding sphere so that whole chunks leave the picture.
const OWN_ROOM = [0, 0, 1, 0];
export async function makeCells(cells, material, geos, pause) {
  const group = new THREE.Group(), by = new Map();
  for (const c of cells) { const k = c.kind + '|' + c.make + '|' + (c.chunk || 0); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Yax = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let triangles = 0;
  for (const [k, list] of by) {
    const [kind, make] = k.split('|'), geo = geos[kind][+make];
    if (!geo.boundingSphere) { geo.computeBoundingBox(); geo.computeBoundingSphere(); }
    const mesh = new THREE.InstancedMesh(geo, material, list.length), seeds = new Float32Array(list.length * 4), rooms = new Float32Array(list.length * 4);
    list.forEach((c, i) => {
      q.setFromAxisAngle(Yax, -c.rot * Math.PI / 3);
      mesh.setMatrixAt(i, m.compose(p.set(c.x, c.y, c.z), q, one.setScalar(c.scale || 1)));
      seeds.set(c.seed, i * 4); rooms.set(c.room || OWN_ROOM, i * 4);
    });
    // the make's own buffers are shared by every chunk; only the per-cell seeds are this mesh's own
    const g = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv', 'aMat']) g.setAttribute(name, geo.getAttribute(name));
    g.setIndex(geo.index); g.boundingBox = geo.boundingBox; g.boundingSphere = geo.boundingSphere;
    g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 4)); g.setAttribute('iRoom', new THREE.InstancedBufferAttribute(rooms, 4));
    mesh.geometry = g;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
    triangles += geo.index.count / 3 * list.length;
    if (pause && group.children.length % 3 === 0) await pause();
  }
  return { object: group, triangles, meshes: group.children.length };
}
// cell space -> world for a cell record (the same turn as the instancing uses)
export function cellToWorld(c, lx, ly, lz, out = new THREE.Vector3()) {
  const a = c.rot * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
  return out.set(c.x + lx * ca - lz * sa, c.y + ly, c.z + lx * sa + lz * ca);
}

// ---------------------------------------------------------------- the lamps' halos: one point for every lamp, near and far
// lamps: [{ x, y, z, on (0..1), hash, crim, rod (1 = a globe hung on a rod: it swings as the globe does; 0 = it stays) }]. Sized in metres and by the drawing buffer; far ones never fall under a pixel
// and a half, so the lamps of the far floors stay as a grain of gold.
export function makeHalos(lamps, look) {
  const n = lamps.length, pos = new Float32Array(n * 3), dat = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const l = lamps[i], a = i * 3, b = i * 4; pos[a] = l.x; pos[a + 1] = l.y; pos[a + 2] = l.z; dat[b] = l.on; dat[b + 1] = l.hash; dat[b + 2] = l.crim || 0; dat[b + 3] = l.rod ? 1 : 0; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDat', new THREE.BufferAttribute(dat, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uniforms = { uTime: { value: 0 }, uPx: { value: 500 }, uLampCol: { value: look.lampCol }, uCrimCol: { value: look.crimCol }, uGutter: { value: look.gutter },
    uFogK: { value: look.fogK * 0.42 }, uGain: { value: look.halo }, uSize: { value: 3.4 } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aDat; uniform float uTime, uPx, uGutter, uFogK, uSize; varying vec3 vC; varying float vK;
      ${GLSL_COMMON}
      void main() {
        // only a globe on a rod swings (aDat.w); a hand lamp's glow, the great lamp's and a niche's stay where they are
        vec3 sw = vec3(cos(aDat.y * 40.), 0., sin(aDat.y * 40.)) * ${SWING.toFixed(2)} * aDat.w * sin(uTime * 1.6 + aDat.y * 25.);
        vec4 mv = modelViewMatrix * vec4(position + sw, 1.); gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 0.1), px = uSize * uPx / d * mix(0.42, 1., step(0.5, aDat.x));
        float gut = step(0.5, h11(aDat.y * 9.1)) * uGutter * (1. - aDat.z);
        float flick = (1. + 0.11 * sin(uTime * 2.6 + aDat.y * 30.) + 0.08 * sin(uTime * 3.7 + aDat.y * 50.) + 0.03 * sin(uTime * 6.5 + aDat.y * 70.)) * (1. - gut * (0.45 + 0.35 * sin(uTime * (5. + 4. * h11(aDat.y * 3.3)) + aDat.y * 40.) * sin(uTime * 1.7 + aDat.y * 11.)));
        // under a pixel and a half the point keeps its size and gives up brightness instead
        float small = clamp(px / 2.5, 0., 1.);
        gl_PointSize = clamp(px, 2.5, 120.);
        // a lamp near the eye is its globe; the halo comes up with distance
        vK = aDat.x * flick * small * small * exp(-d * uFogK) * mix(0.07, 1., smoothstep(6., 40., d));
        vC = vec3(aDat.z);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLampCol, uCrimCol; uniform float uGain; varying vec3 vC; varying float vK;
      void main() {
        vec2 c = gl_PointCoord - 0.5; float r2 = clamp(dot(c, c) * 4., 0., 1.);
        float g = (1. - r2); g = g * g * (0.35 + 0.65 * g * g);
        gl_FragColor = vec4(mix(uLampCol, uCrimCol, vC.x) * g * vK * uGain, 1.);
      }` });
  const points = new THREE.Points(g, mat); points.frustumCulled = false; points.renderOrder = 5;
  return { object: points, uniforms, count: n };
}

// ---------------------------------------------------------------- the spiral stair: one turn per floor, a plain helix round a newel
// plain: the make for stairs beyond the full cells (treads, risers and the handrail's outer face; no baluster, no rim)
export function stairGeometry(radius = 1.35, treads = 14, plain = false) {
  const gb = makeGB(), Y = [0, 1, 0];
  for (let k = 0; k < treads; k++) {
    const a0 = k / treads * Math.PI * 2, a1 = (k + 1.08) / treads * Math.PI * 2, y = k / treads * PITCH;
    const p = (r, a, yy) => [r * Math.cos(a), yy, r * Math.sin(a)];
    // tread: top, underside, riser
    gb.quad(p(0.2, a0, y), p(0.2, a1, y), p(radius, a1, y), p(radius, a0, y), 0);
    gb.quad(p(0.2, a0, y - 0.2), p(radius, a0, y - 0.2), p(radius, a1, y - 0.2), p(0.2, a1, y - 0.2), 0);
    gb.quad(p(0.2, a0, y - PITCH / treads), p(radius, a0, y - PITCH / treads), p(radius, a0, y), p(0.2, a0, y), 0);
    if (!plain) gb.quad(p(radius, a0, y - 0.2), p(radius, a0, y), p(radius, a1, y), p(radius, a1, y - 0.2), 0);
    // the outer handrail and one baluster
    const y1 = y + PITCH / treads;
    gb.quad(p(radius, a0, y + 1.5), p(radius, a1, y1 + 1.5), p(radius, a1, y1 + 1.66), p(radius, a0, y + 1.66), 4);
    gb.quad(p(radius, a1, y1 + 1.5), p(radius, a0, y + 1.5), p(radius, a0, y + 1.66), p(radius, a1, y1 + 1.66), 4);
    if (plain) continue;
    const am = (a0 + a1) / 2, c = p(radius - 0.05, am, y);
    gb.box(c, [1, 0, 0], Y, [0, 0, 1], -0.05, 0.05, 0, 1.55, -0.05, 0.05, 4, 'tu');
  }
  gb.box([0, 0, 0], [1, 0, 0], Y, [0, 0, 1], -0.22, 0.22, 0, PITCH, -0.22, 0.22, 0, 'tu');
  return gb.build();
}

// ---------------------------------------------------------------- librarians: robed simple figures
// pose: 'read' (an open book in both hands, head bowed), 'lean' (bent over the rail on the forearms), 'carry' (an armful
// of books), 'sleep' (standing, head dropped, hands in the sleeves), 'kneel', 'climb' (a hand forward, a small lamp).
// Figure space: feet at the origin, facing +x, 4.6 m tall. aPart: 0 robe, 1 head, 2 arms and what they hold.
export const FIG_H = 4.6;
export function figureGeometry(pose) {
  const P = [], N = [], C = [], A = [], I = [];
  const kneel = pose === 'kneel', lean = pose === 'lean' ? 0.5 : pose === 'read' ? 0.08 : pose === 'sleep' ? 0.12 : kneel ? 0.3 : 0.05;
  const top = kneel ? 2.5 : 3.75, cl = Math.cos(lean), sl = Math.sin(lean);
  // lean the upper body forward about the hips
  const bend = (x, y, z) => { const hip = kneel ? 0.9 : 2.0; if (y <= hip) return [x, y, z]; const dy = y - hip; return [x * cl + dy * sl, hip + dy * cl - x * sl, z]; };
  const push = (pts, col, part, flat) => {
    const n = P.length / 3, [a, b, c, d] = pts.map((p) => bend(p[0], p[1], p[2]));
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    for (const p of [a, b, c, d]) { P.push(p[0], p[1], p[2]); N.push(nx / l, ny / l, nz / l); C.push(col[0], col[1], col[2]); A.push(part, flat || 0); }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const ring = (y, rx, rz, k, cx = 0) => { const a = k / 8 * Math.PI * 2; return [cx + rx * Math.cos(a), y, rz * Math.sin(a)]; };
  const tube = (y0, r0x, r0z, y1, r1x, r1z, col, part, cx0 = 0, cx1 = 0) => { for (let k = 0; k < 8; k++) push([ring(y0, r0x, r0z, k + 1, cx0), ring(y0, r0x, r0z, k, cx0), ring(y1, r1x, r1z, k, cx1), ring(y1, r1x, r1z, k + 1, cx1)], col, part); };
  const R = [1, 1, 1], SKIN = [0.42, 0.28, 0.19];
  // robe (colour 1,1,1 = tinted per figure by the shader), shoulders, hood and face
  tube(0, kneel ? 1.0 : 0.82, kneel ? 0.9 : 0.74, top * 0.55, 0.6, 0.62, R, 0, kneel ? -0.5 : 0, 0);
  tube(top * 0.55, 0.6, 0.62, top, 0.42, 0.7, R, 0);
  tube(top, 0.42, 0.7, top + 0.22, 0.2, 0.22, R, 0);
  const hy = top + 0.5, hx = 0.12;
  tube(top + 0.15, 0.3, 0.3, hy, 0.4, 0.4, R, 1, 0, hx); tube(hy, 0.4, 0.4, hy + 0.36, 0.22, 0.22, R, 1, hx, hx - 0.05);
  push([[hx - 0.05 - 0.2, hy + 0.36, -0.2], [hx - 0.05 - 0.2, hy + 0.36, 0.2], [hx - 0.05 + 0.2, hy + 0.36, 0.2], [hx - 0.05 + 0.2, hy + 0.36, -0.2]], R, 1);
  push([[hx + 0.36, hy - 0.26, 0.2], [hx + 0.36, hy - 0.26, -0.2], [hx + 0.4, hy + 0.14, -0.2], [hx + 0.4, hy + 0.14, 0.2]], SKIN, 1);
  // arms: two sleeves from the shoulders to the hands
  const hand = pose === 'lean' ? [1.25, top - 1.5] : pose === 'sleep' ? [0.55, top - 1.35] : pose === 'climb' ? [0.95, top - 0.9] : [0.9, top - 1.15];
  for (const sg of [-1, 1]) {
    const s = [0.1, top - 0.25, sg * 0.62], h = [hand[0], hand[1], sg * (pose === 'sleep' ? 0.12 : 0.34)];
    push([[s[0], s[1] - 0.3, s[2]], [h[0], h[1] - 0.2, h[2]], [h[0], h[1] + 0.2, h[2]], [s[0], s[1] + 0.25, s[2]]].map((p) => p), R, 2);
    push([[h[0], h[1] - 0.2, h[2]], [s[0], s[1] - 0.3, s[2] + sg * 0.3], [s[0], s[1] + 0.25, s[2] + sg * 0.3], [h[0], h[1] + 0.2, h[2]]], R, 2);
    if (sg > 0) push([[s[0], s[1] + 0.25, s[2]], [h[0], h[1] + 0.2, h[2]], [h[0], h[1] + 0.2, h[2] + 0.2], [s[0], s[1] + 0.25, s[2] + 0.3]], R, 2);
    else push([[h[0], h[1] + 0.2, h[2]], [s[0], s[1] + 0.25, s[2]], [s[0], s[1] + 0.25, s[2] - 0.3], [h[0], h[1] + 0.2, h[2] - 0.2]], R, 2);
  }
  const VEL = [0.66, 0.57, 0.4], LEA = [0.2, 0.1, 0.05];
  if (pose === 'read' || kneel) {
    // an open book: two cream leaves tilted toward the face (grey hatching by the shader: flat = 1), a leather back
    const bx = hand[0] + 0.1, by = hand[1] + 0.22;
    push([[bx - 0.3, by + 0.02, 0], [bx + 0.32, by + 0.3, 0], [bx + 0.32, by + 0.42, 0.62], [bx - 0.3, by + 0.14, 0.62]], VEL, 2, 1);
    push([[bx - 0.3, by + 0.14, -0.62], [bx + 0.32, by + 0.42, -0.62], [bx + 0.32, by + 0.3, 0], [bx - 0.3, by + 0.02, 0]], VEL, 2, 1);
    push([[bx - 0.3, by + 0.08, -0.66], [bx - 0.3, by + 0.08, 0.66], [bx + 0.36, by + 0.36, 0.66], [bx + 0.36, by + 0.36, -0.66]], LEA, 2);
  }
  if (pose === 'carry') for (let k = 0; k < 4; k++) {
    const y = hand[1] + 0.18 + k * 0.24, w = 0.42 - 0.03 * (k % 2), x0 = hand[0] - 0.42, x1 = hand[0] + 0.3, col = [[0.3, 0.12, 0.07], [0.12, 0.2, 0.12], [0.36, 0.26, 0.12], [0.1, 0.09, 0.1]][k];
    push([[x1, y, w], [x1, y, -w], [x1, y + 0.22, -w], [x1, y + 0.22, w]], col, 2);
    push([[x0, y, w], [x1, y, w], [x1, y + 0.22, w], [x0, y + 0.22, w]], VEL, 2);
    push([[x1, y, -w], [x0, y, -w], [x0, y + 0.22, -w], [x1, y + 0.22, -w]], VEL, 2);
    if (k === 3) push([[x0, y + 0.22, w], [x1, y + 0.22, w], [x1, y + 0.22, -w], [x0, y + 0.22, -w]], col, 2);
  }
  if (pose === 'climb') {
    // a small lamp in the forward hand (flat = 2: it glows)
    const lx = hand[0] + 0.15, ly = hand[1] + 0.1;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, b = a + Math.PI / 2, r = 0.17; push([[lx + r * Math.cos(b), ly, r * Math.sin(b)], [lx + r * Math.cos(a), ly, r * Math.sin(a)], [lx + r * Math.cos(a), ly + 0.4, r * Math.sin(a)], [lx + r * Math.cos(b), ly + 0.4, r * Math.sin(b)]], [1, 0.8, 0.45], 2, 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 2));
  g.setIndex(I);
  return g;
}

// people: [{ pose, x, y, z, yaw, cell: { x, y, z, rot }, robe: [r,g,b], hash, lamps (0..3), crim, glow (1: he holds a
// small lamp whose glow is laid at his hand: its light falls on his robe) }] standing figures, and
// climbers: [{ x, y, z (the stair's axis at the foot of its range), range (m), rot (the stair's turn), robe, hash, speed }].
// Everything they do runs on the world clock from a start phase of their own (hash): it reads well at any clock.
export function makeLibrarians(people, climbers, look) {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 }, uFogK: { value: look.fogK }, uLampCol: { value: look.lampCol }, uCrimCol: { value: look.crimCol }, uAmb: { value: look.amb },
    uDepth: { value: look.depth }, uHaze: { value: look.haze }, uHand: { value: look.handLamp } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide, vertexColors: true,
    vertexShader: /* glsl */`
      attribute vec2 aPart; attribute vec4 iPos; attribute vec4 iCell; attribute vec3 iCol; attribute vec4 iDat;
      uniform float uTime;
      varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNL; varying vec3 vCol; varying vec3 vFig; varying vec4 vDat; varying float vFlat;
      vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
      void main() {
        vec3 p = position, n = normal; float h = iDat.x, t = uTime, climb = step(0.5, iDat.y);
        // the head turns and nods now and then; the hands and what they hold rise and fall with the breath
        if (aPart.x > 0.5 && aPart.x < 1.5) { float tu = 0.55 * sin(t * 0.31 + h * 40.) * smoothstep(0.2, 0.9, sin(t * 0.13 + h * 9.)); p.xz = rot(p.xz - vec2(0.1, 0.), tu) + vec2(0.1, 0.); n.xz = rot(n.xz, tu); }
        if (aPart.x > 1.5) p.y += 0.05 * sin(t * 0.9 + h * 20.) + 0.12 * smoothstep(0.93, 1., sin(t * 0.5 + h * 31.));
        p.x += 0.035 * (p.y / 4.6) * sin(t * 0.7 + h * 17.) + climb * 0.1 * (p.y / 4.6) * sin(t * 2.2 + h * 5.);
        float yaw = iPos.w; vec3 base = iPos.xyz;
        // one who carries an armful walks a small round of his own (1 m) at his own pace
        if (climb < 0.5 && iDat.z > 0.) { float wa = h * 6.2832 + t * iDat.z; base.xz += vec2(cos(wa), sin(wa)); yaw = wa + 1.5708; p.y += 0.05 * abs(sin(t * iDat.z * 3.4 + h * 9.)); }
        if (climb > 0.5) {
          float range = iPos.w, s = mod(h * range + t * iDat.z, range), a = s / ${PITCH.toFixed(1)} * 6.2831853 + iCell.w;
          base += vec3(cos(a) * 0.86, s, sin(a) * 0.86); yaw = a + 1.5708;
          // he grows from nothing over the first metre of his stair's range and shrinks to nothing over the last: the
          // loop never shows a figure vanishing or appearing whole
          p *= smoothstep(0., 1., s) * smoothstep(0., 1., range - s);
        }
        p.xz = rot(p.xz, yaw); n.xz = rot(n.xz, yaw);
        vec3 w = base + p;
        vec3 l = w - iCell.xyz; l.xz = rot(l.xz, -iCell.w); vec3 nl = n; nl.xz = rot(nl.xz, -iCell.w);
        vLocal = mix(l, vec3(0., 4., 0.), climb); vNL = nl; vWorld = w; vFig = position; vDat = iDat; vFlat = aPart.y;
        vCol = color.g > 0.95 ? iCol : color.rgb;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFogK, uHand; uniform vec3 uLampCol, uCrimCol, uAmb, uDepth, uHaze;
      varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNL; varying vec3 vCol; varying vec3 vFig; varying vec4 vDat; varying float vFlat;
      void main() {
        vec3 n = normalize(vNL); if (!gl_FrontFacing) n = -n;
        float dist = length(vWorld - cameraPosition), climb = step(0.5, vDat.y);
        float code = floor(vDat.w + 0.5), glow = step(7.5, code); code -= 8. * glow;
        float crim = step(3.5, code); code -= 4. * crim;
        float onA = max(step(0.5, mod(code, 2.)), climb), onB = step(1.5, code);
        vec3 lampCol = mix(uLampCol, uCrimCol, crim);
        vec3 alb = vCol * (0.62 + 0.38 * clamp(vFig.y / 4.6, 0., 1.));
        // pages: cream with grey hatching, never a letter
        if (vFlat > 0.5 && vFlat < 1.5) { float hz = abs(vFig.z); alb = mix(alb, vec3(0.3, 0.29, 0.27), 0.7 * step(0.5, fract(vFig.x * 9.)) * step(0.08, hz) * step(hz, 0.54)); }
        vec3 lit = uAmb * (0.75 + 0.25 * n.y);
        vec3 dA = vec3(${LAMPS[0][0].toFixed(3)}, ${LAMPS[0][1].toFixed(2)}, ${LAMPS[0][2].toFixed(3)}) - vLocal, dB = vec3(${LAMPS[1][0].toFixed(3)}, ${LAMPS[1][1].toFixed(2)}, ${LAMPS[1][2].toFixed(3)}) - vLocal;
        float a2 = dot(dA, dA), b2 = dot(dB, dB);
        float nA = clamp(dot(n, dA) / sqrt(max(a2, 1e-4)), 0., 1.), nB = clamp(dot(n, dB) / sqrt(max(b2, 1e-4)), 0., 1.);
        lit += lampCol * (onA * (0.3 + 0.7 * nA) * 26. / (14. + a2) + onB * (0.3 + 0.7 * nB) * 26. / (14. + b2));
        // (held lower than in round 1, 0.95 for 1.25: the lamps now hang nearer the walls where the readers stand)
        lit = min(lit, vec3(0.95));
        // the small lamp a figure holds at night lights the front of his robe from the hand: only on a figure who holds
        // one (his glow is laid at the hand: a standing or kneeling figure; never one who carries an armful) and on a
        // climber, whose lamp is in his forward hand
        lit += uLampCol * uHand * max(glow, climb) * 0.5 * smoothstep(-0.2, 0.8, vFig.x) * smoothstep(4.4, 2.2, vFig.y);
        vec3 col = alb * lit;
        if (vFlat > 1.5) col = uLampCol * (2.2 + 2.2 * max(uHand, climb));
        float f = 1. - exp(-dist * uFogK);
        col = mix(col, mix(uDepth, uHaze, smoothstep(50., 300., dist)), clamp(f, 0., 1.));
        gl_FragColor = vec4(col, 1.);
      }` });
  const add = (geo, list, fill) => {
    if (!list.length) return;
    const g = geo.clone(), n = list.length, iPos = new Float32Array(n * 4), iCell = new Float32Array(n * 4), iCol = new Float32Array(n * 3), iDat = new Float32Array(n * 4);
    list.forEach((f, i) => fill(f, i, iPos, iCell, iCol, iDat));
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iCell', new THREE.InstancedBufferAttribute(iCell, 4));
    g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3)); g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 4));
    const mesh = new THREE.InstancedMesh(g, mat, n); mesh.frustumCulled = false; group.add(mesh);
  };
  const poses = {};
  for (const f of people) (poses[f.pose] || (poses[f.pose] = [])).push(f);
  let triangles = 0;
  for (const pose of Object.keys(poses)) {
    const geo = figureGeometry(pose); triangles += geo.index.count / 3 * poses[pose].length;
    add(geo, poses[pose], (f, i, iPos, iCell, iCol, iDat) => {
      iPos.set([f.x, f.y, f.z, f.yaw], i * 4); iCell.set([f.cell.x, f.cell.y, f.cell.z, f.cell.rot * Math.PI / 3], i * 4);
      iCol.set(f.robe, i * 3); iDat.set([f.hash, 0, f.pose === 'carry' ? 0.3 + 0.25 * f.hash : 0, f.lamps + (f.crim ? 4 : 0) + (f.glow ? 8 : 0)], i * 4);
    });
    geo.dispose();
  }
  const cg = figureGeometry('climb'); triangles += cg.index.count / 3 * climbers.length;
  add(cg, climbers, (f, i, iPos, iCell, iCol, iDat) => {
    iPos.set([f.x, f.y, f.z, f.range], i * 4); iCell.set([0, 0, 0, f.rot], i * 4); iCol.set(f.robe, i * 3); iDat.set([f.hash, 1, f.speed, 3], i * 4);
  });
  cg.dispose();
  return { object: group, uniforms, triangles };
}

// ---------------------------------------------------------------- the falling pages (and now and then a whole book)
// drops: [{ x, z, y0, y1, n, book (0|1), spots: [[x,z]...] or a spread (m), keep(x,z), away(x,z), slip(x,z) }]: each thing falls from
// y1 to y0 again and again at its own speed and tumble, from a start phase of its own, so the fall looks alike at every
// clock. A place that fails keep after twelve tries is moved by away (never parked). A drop may give place(rng)
// instead: { x, z, y1, ox, oz, sOut }: the thing leaves (ox, oz) and reaches (x, z) over its first sOut metres of fall.
// Every thing grows from nothing over the first metre of its range and shrinks to nothing over the last, so the loop
// never shows a thing appearing or vanishing at its full size.
// A leaf side-slips as it falls, by a slip of its own (metres each way on x and on z, a number of the instance): the
// drop's slip(x, z) gives it by the room its resting place has; a drop without one gets the full slip, PAGE_SLIP. A
// book drops straight (slip 0).
export const PAGE_SLIP = 1.4;
export async function makePages(drops, rng, look, pause) {
  const uniforms = { uTime: { value: 0 }, uFogK: { value: look.fogK }, uDepth: { value: look.depth }, uHaze: { value: look.haze }, uGain: { value: look.pageGain }, uLampCol: { value: look.lampCol } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vWorld; varying vec4 vB;
      mat3 rotAxis(vec3 ax, float a) { float c = cos(a), s = sin(a), o = 1. - c;
        return mat3(o * ax.x * ax.x + c, o * ax.x * ax.y + ax.z * s, o * ax.z * ax.x - ax.y * s, o * ax.x * ax.y - ax.z * s, o * ax.y * ax.y + c, o * ax.y * ax.z + ax.x * s, o * ax.z * ax.x + ax.y * s, o * ax.y * ax.z - ax.x * s, o * ax.z * ax.z + c); }
      void main() {
        float h = iB.x, range = max(iA.w, 1.), sp = iB.y, t = uTime;
        float s = mod(h * range + t * sp, range);
        vec3 ax = normalize(vec3(sin(h * 61.), 0.35 + 0.3 * cos(h * 17.), cos(h * 61.)));
        mat3 R = rotAxis(ax, t * (0.6 + 1.5 * fract(h * 7.3)) * (1. + iB.w) + h * 30.) ;
        vec3 p = R * (position * iB.z * smoothstep(0., 1., s) * smoothstep(0., 1., range - s));
        // a leaf side-slips as it falls, by its own slip (iC.w); a book drops straight (its slip is 0)
        float slip = iC.w;
        // a thing thrown from a shelf goes out fast and loses its way outward as it falls (out = 1 once it is clear)
        float fo = iC.z > 0.001 ? clamp(s / max(iC.z, 0.001), 0., 1.) : 1., outw = 1. - (1. - fo) * (1. - fo);
        vec2 at = mix(iC.xy, iA.xz, outw);
        vec3 c = vec3(at.x + slip * outw * sin(t * 0.6 + h * 50.), iA.y - s, at.y + slip * outw * cos(t * 0.47 + h * 23.));
        vec3 w = c + p; vWorld = w; vUv = uv; vN = R * normal; vB = iB;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uFogK, uGain; uniform vec3 uDepth, uHaze, uLampCol; varying vec2 vUv; varying vec3 vN; varying vec3 vWorld; varying vec4 vB;
      void main() {
        vec3 n = normalize(vN); float dist = length(vWorld - cameraPosition);
        float hatch = step(0.5, fract(vUv.y * 11.)) * step(0.12, vUv.x) * step(vUv.x, 0.88) * step(0.1, vUv.y) * step(vUv.y, 0.9);
        vec3 page = mix(vec3(0.86, 0.78, 0.6), vec3(0.42, 0.41, 0.39), hatch * 0.6);
        vec3 cover = mix(vec3(0.3, 0.13, 0.06), vec3(0.1, 0.2, 0.12), step(0.6, fract(vB.x * 13.)));
        // a book: leather on the broad faces, the cream of the leaves on the edges
        vec3 alb = mix(page, mix(vec3(0.7, 0.62, 0.45), cover, step(0.5, abs(n.z))), vB.w);
        float l = 0.34 + 0.66 * abs(n.y * 0.6 + n.x * 0.5);
        vec3 col = alb * l * uGain * (0.55 * uLampCol + 0.25);
        float f = 1. - exp(-dist * uFogK);
        col = mix(col, mix(uDepth, uHaze, smoothstep(50., 300., dist)), clamp(f, 0., 1.));
        gl_FragColor = vec4(col, 1.);
      }` });
  const group = new THREE.Group(); let triangles = 0;
  for (const book of [0, 1]) {
    const list = drops.filter((d) => (d.book || 0) === book), n = list.reduce((a, d) => a + d.n, 0);
    if (!n) continue;
    const g = book ? new THREE.BoxGeometry(0.85, 0.24, 1.15) : new THREE.PlaneGeometry(0.8, 1.05);
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4); let i = 0;
    for (const d of list) for (let k = 0; k < d.n; k++, i++) {
      // (the places are sought against the route's line: a breath every sixty things, so no step of the build is long)
      if (pause && i % 60 === 59) await pause();
      let x = d.x, z = d.z, y1 = d.y1, ox = 0, oz = 0, sOut = 0, ok = false;
      if (d.place) { const pl = d.place(rng); x = pl.x; z = pl.z; y1 = pl.y1; ox = pl.ox; oz = pl.oz; sOut = pl.sOut; ok = true; }
      else if (d.spots) for (let tries = 0; tries < 12 && !ok; tries++) { const s = d.spots[Math.floor(rng() * d.spots.length)], a = rng() * 6.2832, r = Math.sqrt(rng()) * (AP - 0.8); x = s[0] + r * Math.cos(a); z = s[1] + r * Math.sin(a); ok = !d.keep || d.keep(x, z); }
      else for (let tries = 0; tries < 12 && !ok; tries++) { const a = rng() * 6.2832, r = Math.sqrt(rng()) * d.spread; x = d.x + r * Math.cos(a); z = d.z + r * Math.sin(a); ok = !d.keep || d.keep(x, z); }
      if (!ok && d.away) { const q = d.away(x, z); x = q[0]; z = q[1]; }
      if (!d.place) { ox = x; oz = z; }
      iA.set([x, y1, z, y1 - d.y0], i * 4); iC.set([ox, oz, sOut, book ? 0 : d.slip ? d.slip(x, z) : PAGE_SLIP], i * 4);
      iB.set([rng(), book ? 3.4 + 2 * rng() : 1.5 + 1.6 * rng(), book ? 0.9 + 0.5 * rng() : 0.8 + 0.7 * rng(), book], i * 4);
    }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
    const mesh = new THREE.InstancedMesh(g, mat, n); mesh.frustumCulled = false; group.add(mesh);
    triangles += n * (book ? 12 : 2);
  }
  return { object: group, uniforms, triangles };
}

// ---------------------------------------------------------------- the vestibule: a narrow passage in the 5 m of wall between two galleries
// Vestibule space: origin in the middle of the passage floor, x along the passage (2.5 either way), z across (1.8 either
// way). On the +z side a mirror; on the -z side a niche with a spiral stair (the stair itself is a stair instance).
export function vestibuleGeometry() {
  const gb = makeGB(), V = VEST;
  const vq = (p, q, y0, y1, mat, uv) => gb.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], mat, uv);
  vq([V.half, V.w], [-V.half, V.w], 0, DOOR_H, 0, [0, 0, 0.4, 1]);
  vq([-V.half, -V.w], [-V.nicheX, -V.w], 0, DOOR_H, 0, [0, 0, 0.2, 1]);
  vq([V.nicheX, -V.w], [V.half, -V.w], 0, DOOR_H, 0, [0, 0, 0.2, 1]);
  vq([-V.nicheX, V.nicheZ], [V.nicheX, V.nicheZ], 0, PITCH, 0, [0, 0, 0.3, 1]);
  vq([-V.nicheX, -V.w], [-V.nicheX, V.nicheZ], 0, PITCH, 0, [0, 0, 0.3, 1]);
  vq([V.nicheX, V.nicheZ], [V.nicheX, -V.w], 0, PITCH, 0, [0, 0, 0.3, 1]);
  gb.quad([-V.half, DOOR_H, -V.w], [V.half, DOOR_H, -V.w], [V.half, DOOR_H, V.w], [-V.half, DOOR_H, V.w], 3);
  gb.quad([-V.nicheX, PITCH, V.nicheZ], [V.nicheX, PITCH, V.nicheZ], [V.nicheX, PITCH, -V.w], [-V.nicheX, PITCH, -V.w], 8);
  vq([-V.nicheX, -V.w], [V.nicheX, -V.w], DOOR_H, PITCH, 8);
  // the niche's globe and the rod it hangs by, down from the niche's ceiling (material 5 glows by lamp code 2: lamp B)
  gb.ball(V.lamp[0], V.lamp[1], V.lamp[2], V.lampR, 8, 5, 5);
  gb.box([V.lamp[0], 0, V.lamp[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1], -0.03, 0.03, V.lamp[1] + V.lampR - 0.03, PITCH, -0.03, 0.03, 4, 'tu');
  return gb.build();
}
// The mirror: it shows, by the reflected ray, a second passage of shelves and lamps running away behind the glass.
export function makeMirrors(list, look) {
  const V = VEST, g = new THREE.PlaneGeometry(2 * V.mirrorX, V.mirrorY1 - V.mirrorY0);
  g.rotateY(Math.PI); g.translate(0, (V.mirrorY0 + V.mirrorY1) / 2, V.w - 0.04);
  const uniforms = { uTime: { value: 0 }, uLampCol: { value: look.lampCol }, uAmb: { value: look.amb }, uDepth: { value: look.depth } };
  const mat = new THREE.ShaderMaterial({ uniforms,
    vertexShader: /* glsl */`
      varying vec3 vLocal; varying vec3 vCamL; varying vec2 vUv;
      void main() {
        vLocal = position; vUv = uv;
        vCamL = (inverse(instanceMatrix) * vec4(cameraPosition, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uLampCol, uAmb, uDepth; varying vec3 vLocal; varying vec3 vCamL; varying vec2 vUv;
      ${GLSL_COMMON}
      ${LIB_BOOKS}
      void main() {
        vec3 d = normalize(vLocal - vCamL); d.z = abs(d.z) + 1e-3;
        vec3 o = vLocal;
        // behind the glass a second passage runs beside ours: as wide and as high, shelves on its far wall, a lamp every 9 m
        float tf = d.y < 0. ? (0. - o.y) / min(d.y, -1e-4) : 1e5, tc = d.y > 0. ? (6.2 - o.y) / max(d.y, 1e-4) : 1e5;
        float tw = 3.6 / d.z;
        float t = min(min(tf, tc), min(tw, 120.));
        vec3 h = o + d * t; float gilt = 0.;
        vec3 wood = vec3(0.30, 0.165, 0.075);
        vec3 alb = wood * 0.9;
        if (t == tw) alb = bookWall(h.x + 40., h.y * 1.13, vec4(0.41, 0., 0., 3.), wood, smoothstep(8., 40., t), gilt);
        else if (t == tc) alb = vec3(0.42, 0.35, 0.25);
        // door posts of the galleries that open off it, every 9 m
        float post = step(abs(fract(h.x / 9.) - 0.5), 0.035) * step(tw - 0.01, t);
        alb = mix(alb, wood * 1.2, post);
        float lx = (floor(h.x / 9.) + 0.5) * 9.;
        vec3 dl = vec3(lx, 5.3, o.z + 1.8) - h; float l2 = dot(dl, dl);
        vec3 col = alb * (uAmb + uLampCol * 22. / (8. + l2));
        // the lamps themselves, as far as the ray runs, ahead and behind
        float k0 = floor(o.x / 9.);
        for (int i = -5; i < 6; i++) {
          vec3 L = vec3((k0 + float(i) + 0.5) * 9., 5.3, o.z + 1.8) - o; float tl = clamp(dot(L, d), 0., t); vec3 q = L - d * tl;
          col += uLampCol * (1.8 * exp(-dot(q, q) * 4.) + 0.2 * exp(-dot(q, q) * 0.45)) * exp(-tl * 0.03) * (1. + 0.05 * sin(uTime * 0.8 + float(i)));
        }
        col = mix(col, uDepth * 1.5, 1. - exp(-t * 0.02));
        // the silvering is old: a little dark, speckled at the rim; a narrow wooden frame
        vec2 e = min(vUv, 1. - vUv); float rim = min(e.x * ${(2 * VEST.mirrorX).toFixed(1)}, e.y * ${(VEST.mirrorY1 - VEST.mirrorY0).toFixed(1)});
        col *= 0.86 - 0.3 * smoothstep(0.5, 0.1, rim) * vnoise(vUv * 40.);
        col = mix(wood * (uAmb + uLampCol * 0.35), col, step(0.14, rim));
        gl_FragColor = vec4(col, 1.);
      }` });
  const mesh = new THREE.InstancedMesh(g, mat, Math.max(1, list.length)); mesh.count = list.length;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Yax = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  list.forEach((v, i) => { q.setFromAxisAngle(Yax, -v.rot * Math.PI / 3); mesh.setMatrixAt(i, m.compose(new THREE.Vector3(v.x, v.y, v.z), q, one)); });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- the round chamber: one room without corners
// Its wall is the spine of one great book running all the way round (leather, five raised bands, worn gilt tooling, no
// letters); one great lamp hangs in the middle (the portal hangs in its place). The well of the shaft opens in its floor.
// o: { center: Vector3 (floor level), radius, wallH, well: [x, z] (the shaft's axis), lamp: Vector3, look }
// The shallow dome: five straight spans from the wall's top to the crown, which stands 0.3 of the radius over the wall.
// domeRing(R, H, k): the radius and the height over the floor of its ring k (0 the wall's top, 5 the crown);
// domeY(R, H, r): the height of its surface at r m from the room's middle (what hangs from the dome ends there).
const DOME_SPANS = 5;
export const domeRing = (R, H, k) => { const t = k / DOME_SPANS; return [R * Math.cos(t * Math.PI / 2), H + 0.3 * R * Math.sin(t * Math.PI / 2)]; };
export function domeY(R, H, r) {
  for (let k = DOME_SPANS; k > 0; k--) { const a = domeRing(R, H, k), b = domeRing(R, H, k - 1); if (r <= b[0]) return a[1] + (b[1] - a[1]) * (r - a[0]) / (b[0] - a[0]); }
  return H;
}
export function makeChamber(o) {
  const gb = makeGB(), R = o.radius, H = o.wallH, SEG = 96, cx = o.center.x, cy = o.center.y, cz = o.center.z;
  // the tooled panels of the great spine: as many to the round as keep a panel 48.7 m wide (twelve round a wall of 93 m)
  const PANELS = Math.max(6, Math.round(2 * Math.PI * R / 48.7));
  const P = (r, a, y) => [cx + r * Math.cos(a), cy + y, cz + r * Math.sin(a)];
  const bands = [0.06, 0.25, 0.44, 0.63, 0.82, 0.96];
  for (let i = 0; i < SEG; i++) {
    const a0 = i / SEG * Math.PI * 2, a1 = (i + 1) / SEG * Math.PI * 2, u0 = i / SEG, u1 = (i + 1) / SEG;
    // the wall, with the raised bands standing 0.9 m proud of the leather
    let y = 0;
    for (const b of bands) {
      const yb = b * H, hb = 0.022 * H;
      gb.quad(P(R, a0, y), P(R, a1, y), P(R, a1, yb - hb), P(R, a0, yb - hb), 6, [u0, y / H, u1, (yb - hb) / H]);
      gb.quad(P(R, a0, yb - hb), P(R, a1, yb - hb), P(R - 0.9, a1, yb - hb * 0.5), P(R - 0.9, a0, yb - hb * 0.5), 6, [u0, 2, u1, 2]);
      gb.quad(P(R - 0.9, a0, yb - hb * 0.5), P(R - 0.9, a1, yb - hb * 0.5), P(R - 0.9, a1, yb + hb * 0.5), P(R - 0.9, a0, yb + hb * 0.5), 6, [u0, 2, u1, 2]);
      gb.quad(P(R - 0.9, a0, yb + hb * 0.5), P(R - 0.9, a1, yb + hb * 0.5), P(R, a1, yb + hb), P(R, a0, yb + hb), 6, [u0, 2, u1, 2]);
      y = yb + hb;
    }
    gb.quad(P(R, a0, y), P(R, a1, y), P(R, a1, H), P(R, a0, H), 6, [u0, y / H, u1, 1]);
    // the floor in rings (the shader cuts the well out of it) and the shallow dome
    const rf = [0.2, R * 0.2, R * 0.45, R * 0.72, R];
    for (let k = 0; k < 4; k++) gb.quad(P(rf[k], a0, 0), P(rf[k], a1, 0), P(rf[k + 1], a1, 0), P(rf[k + 1], a0, 0), 9);
    const dome = (k) => domeRing(R, H, k);
    for (let k = 0; k < DOME_SPANS; k++) { const d0 = dome(k), d1 = dome(k + 1); gb.quad(P(d0[0], a0, d0[1]), P(d0[0], a1, d0[1]), P(d1[0], a1, d1[1]), P(d1[0], a0, d1[1]), 3); }
  }
  const uniforms = { uTime: { value: 0 }, uLamp: { value: o.lamp.clone() }, uLampCol: { value: o.look.lampCol }, uAmb: { value: o.look.amb }, uDepth: { value: o.look.depth },
    uFogK: { value: o.look.fogK * 0.35 }, uWell: { value: new THREE.Vector2(o.well[0], o.well[1]) }, uCen: { value: o.center.clone() }, uGain: { value: o.look.chamberGain } };
  const mat = new THREE.ShaderMaterial({ uniforms,
    vertexShader: /* glsl */`
      attribute float aMat; varying vec3 vWorld; varying vec3 vN; varying vec2 vUv; varying float vMat;
      void main() { vWorld = position; vN = normal; vUv = uv; vMat = aMat; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFogK, uGain; uniform vec3 uLamp, uLampCol, uAmb, uDepth, uCen; uniform vec2 uWell;
      varying vec3 vWorld; varying vec3 vN; varying vec2 vUv; varying float vMat;
      ${GLSL_COMMON}
      void main() {
        float mat = floor(vMat + 0.5); vec3 n = normalize(vN); vec3 alb; float gold = 0.;
        vec2 rel = vWorld.xz - uCen.xz; float rad = length(rel), ang = atan(rel.y, rel.x + 1e-5);
        if (mat == 9.) {
          // the well: the seven cells of the shaft's cluster
          vec2 w = vWorld.xz - uWell; float r = w.y / ${(AP * SQ3).toFixed(4)}, q = w.x / ${(2 * AP).toFixed(1)} - r * 0.5;
          float x = q, z = r, y = -q - r, rx = floor(x + 0.5), ry = floor(y + 0.5), rz = floor(z + 0.5);
          float dx = abs(rx - x), dy = abs(ry - y), dz = abs(rz - z);
          if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
          if (max(abs(rx), max(abs(ry), abs(rz))) < 1.5) discard;
          float ringf = fract(rad / 6.5), spoke = fract(ang * 5.0930 + floor(rad / 6.5) * 0.5);
          float pl = h21(vec2(floor(rad / 6.5), floor(ang * 5.0930 + floor(rad / 6.5) * 0.5)));
          alb = mix(vec3(0.27, 0.15, 0.07), vec3(0.42, 0.30, 0.16), pl) * (0.8 + 0.4 * vnoise(vWorld.xz * 1.3));
          alb *= 1. - 0.45 * clamp(step(ringf, 0.03) + step(spoke, 0.012), 0., 1.);
          gold = step(abs(ringf - 0.5), 0.02) * step(0.5, fract(rad / 13.)) * 0.6;
        } else if (mat == 6.) {
          // leather: the grain, the hollows either side of each raised band, tooled panels with gilt rules and lozenges
          // (up: the panels' own coordinate, one to a panel; four gilt dots and four studs to a panel)
          float band = step(1.5, vUv.y), v = vUv.y, u = vUv.x * 96., up = vUv.x * ${PANELS.toFixed(1)};
          float lea = 0.75 + 0.5 * vnoise(vec2(u * 3.1, vWorld.y * 1.7)) * vnoise(vec2(u * 0.4, vWorld.y * 0.21) + 7.);
          alb = vec3(0.42, 0.16, 0.075) * lea;
          vec2 pc = vec2(fract(up) - 0.5, fract(v * 5.26 - 0.1) - 0.5);
          float frame = step(abs(max(abs(pc.x) * 1.0, abs(pc.y) * 1.0) - 0.40), 0.012) + step(abs(max(abs(pc.x), abs(pc.y)) - 0.36), 0.005);
          float loz = step(abs(abs(pc.x) * 1.6 + abs(pc.y) * 1.2 - 0.3), 0.012) + step(abs(pc.x) * 1.6 + abs(pc.y) * 1.2, 0.07);
          float dots = step(length(vec2(fract(up * 4.) - 0.5, (fract(v * 5.26 - 0.1) - 0.93) * 6.)), 0.16);
          gold = (1. - band) * clamp(frame + loz + dots, 0., 1.) * (0.45 + 0.55 * vnoise(vec2(u * 2., vWorld.y * 0.9)));
          alb = mix(alb, vec3(0.5, 0.2, 0.09) * lea, band);
          gold += band * step(abs(fract(up * 4.) - 0.5), 0.06) * 0.5;
        } else {
          // the dome: dark coffers between gilt ribs, a small gilt boss in each
          vec2 cf = vec2(fract(ang * 3.8197), fract(rad / 9.)) - 0.5; float edge = max(abs(cf.x), abs(cf.y));
          float rib = step(0.455, edge);
          alb = vec3(0.20, 0.115, 0.06) * (0.45 + 1.1 * smoothstep(0.1, 0.455, edge));
          alb = mix(alb, vec3(0.42, 0.27, 0.11), rib);
          gold = rib * 0.35 + step(length(cf * vec2(1., 0.6)), 0.05) * 0.8;
        }
        vec3 dl = uLamp - vWorld; float d2 = dot(dl, dl), ndl = clamp(dot(n, dl) / sqrt(max(d2, 1e-4)), 0., 1.);
        float breathe = 1. + 0.04 * sin(uTime * 0.7);
        vec3 lit = uAmb * 1.2 + uLampCol * uGain * breathe * (0.25 + 0.75 * ndl) * (0.30 + 600. / (400. + d2));
        // held under white to the last metre: over 0.9 the light is pressed in toward 1.5 at the most (its colour kept),
        // so the floor, the ribs and the leather next to the great lamp keep their colour and their shade
        float lmax = max(lit.r, max(lit.g, lit.b)), knee = lmax < 0.9 ? lmax : 0.9 + (lmax - 0.9) / (1. + (lmax - 0.9) * 1.6);
        lit *= knee / max(lmax, 1e-3);
        vec3 col = alb * lit + vec3(1., 0.7, 0.28) * gold * lit * 0.6;
        float dist = length(vWorld - cameraPosition);
        col = mix(col, uDepth, clamp(1. - exp(-dist * uFogK), 0., 1.));
        gl_FragColor = vec4(col, 1.);
      }` });
  const mesh = new THREE.Mesh(gb.build(), mat);
  return { object: mesh, uniforms, triangles: gb.triangles };
}

// ---------------------------------------------------------------- the look (colours and levels shared by every maker)
export function makeLook(hour = 'day') {
  const look = {
    lampCol: new THREE.Color(1.0, 0.78, 0.44), crimCol: new THREE.Color(1.0, 0.33, 0.15), amb: new THREE.Color(0.2, 0.15, 0.105), depth: new THREE.Color(0.055, 0.05, 0.085), haze: new THREE.Color(0.07, 0.13, 0.215),
    fogK: 0.0085, gutter: 0, globe: 5.5, halo: 1.0, pageGain: 1.0, handLamp: 0, chamberGain: 1.6, out: 0.04,
  };
  if (hour === 'golden') { look.lampCol = new THREE.Color(1.0, 0.62, 0.3); look.gutter = 1; look.amb = new THREE.Color(0.21, 0.135, 0.09); look.out = 0.1; }
  if (hour === 'night') { look.amb = new THREE.Color(0.13, 0.125, 0.15); look.out = 0.6; look.handLamp = 1; look.depth = new THREE.Color(0.035, 0.035, 0.065); look.pageGain = 0.8; }
  return look;
}

// ---------------------------------------------------------------- the hero alone: one shaft with its twelve galleries, eleven floors
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.core.makeRng(ctx.core.hashSeed('shaft-hero:' + ctx.seed));
  const look = opts.look || makeLook('day'), mat = makeLibraryMaterial(look);
  const geos = { edge: [0, 1, 2].map((m) => cellGeometry('edge', m)), corner: [0, 1, 2].map((m) => cellGeometry('corner', m)) };
  const cells = [], lamps = [], people = [];
  for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
    if (hexDist(q, r) !== 2) continue;
    const gi = galleryInfo(q, r), [x, z] = cellXZ(q, r);
    for (let f = -5; f <= 5; f++) {
      const c = { x, y: f * PITCH, z, rot: gi.rot, kind: gi.corner ? 'corner' : 'edge', make: Math.abs(f) <= 1 ? 1 : 2, seed: [rng(), 0, 0, 3], chunk: 0 };
      cells.push(c);
      for (const L of LAMPS) { const w = cellToWorld(c, L[0], L[1], L[2]); lamps.push({ x: w.x, y: w.y, z: w.z, on: 1, hash: c.seed[0], rod: 1 }); }
      if (rng() < 0.3) { const w = cellToWorld(c, AP - 1.3, 0, 0); people.push({ pose: rng() < 0.5 ? 'lean' : 'read', x: w.x, y: w.y, z: w.z, yaw: gi.rot * Math.PI / 3, cell: c, robe: [0.3, 0.26, 0.2], hash: rng(), lamps: 3 }); }
    }
    await ctx.yield();
  }
  const object = new THREE.Group();
  const tiles = await makeCells(cells, mat, geos, () => ctx.yield()), halos = makeHalos(lamps, look), folk = makeLibrarians(people, [], look);
  const spots = [[0, 0]]; for (const d of DIRS) spots.push(cellXZ(d[0], d[1]));
  const pages = await makePages([{ x: 0, z: 0, y0: -44, y1: 48, n: 260, spots }], rng, look);
  object.add(tiles.object, halos.object, folk.object, pages.object);
  const size = new THREE.Vector2();
  return {
    object, radius: 46, height: 48, center: new THREE.Vector3(0, 4, 0), anchors: {}, ground: false,
    update(dt, time) {
      mat.uniforms.uTime.value = time; halos.uniforms.uTime.value = time; folk.uniforms.uTime.value = time; pages.uniforms.uTime.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); halos.uniforms.uPx.value = size.y * 0.8; }
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------- moths round the lamps
// lamps: [{ x, y, z, s }] (the lit lamps of the galleries within 46 m of the line); a few moths circle each on tilted
// rings of their own, from start phases of their own; s (0..1) draws a lamp's rings in (the fullest ring is 2.06 m at
// s = 1, with 0.25 m of bobbing: MOTH_REACH). Points, sized in metres.
export const MOTH_REACH = 2.06 + 0.25;
export function makeMoths(lamps, rng, per = 4) {
  const n = lamps.length * per, pos = new Float32Array(n * 3), dat = new Float32Array(n * 4);
  lamps.forEach((l, i) => { for (let k = 0; k < per; k++) { const j = i * per + k; pos.set([l.x, l.y, l.z], j * 3); dat.set([rng(), (0.75 + 0.9 * rng()) * (l.s === undefined ? 1 : l.s), (rng() < 0.5 ? -1 : 1) * (1.1 + 1.6 * rng()), rng() * 6.2832], j * 4); } });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDat', new THREE.BufferAttribute(dat, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uniforms = { uTime: { value: 0 }, uPx: { value: 500 } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aDat; uniform float uTime, uPx; varying float vA;
      void main() {
        float a = aDat.w + uTime * aDat.z, r = aDat.y * (1. + 0.25 * sin(uTime * 1.3 + aDat.x * 40.)), tilt = (aDat.x - 0.5) * 1.6;
        vec3 p = position + vec3(cos(a) * r, sin(a) * r * sin(tilt) + 0.25 * sin(uTime * 2.1 + aDat.x * 20.), sin(a) * r * cos(tilt));
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 0.1), px = 0.36 * uPx / d;
        gl_PointSize = clamp(px, 1.5, 22.);
        // the wings beat: the fleck brightens and dims many times a second
        vA = (0.55 + 0.45 * sin(uTime * 23. + aDat.x * 90.)) * clamp(px / 1.5, 0., 1.) * smoothstep(90., 40., d);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() { vec2 c = gl_PointCoord - 0.5; float a = clamp(1. - dot(c, c) * 4., 0., 1.); gl_FragColor = vec4(vec3(0.95, 0.82, 0.6) * 0.9, a * a * vA * 0.9); }` });
  const points = new THREE.Points(g, mat); points.frustumCulled = false; points.renderOrder = 4;
  return { object: points, uniforms, count: n };
}
