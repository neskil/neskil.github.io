// AFTER THE SIXTH SUN, the hero part: the observatory under the sky. A round drum of pale dressed stone 14 m tall and
// 26 m across, a railed gallery at its top, a white-painted dome of riveted plates (13 m radius) with a slit 5 m wide
// open from the drum to 15 degrees past the zenith, two shutter leaves parked either side, the rim of a telescope
// tube just inside, a torch flickering on the inner wall; two small domes and a low college range to the east; a
// dozen watchers on the gallery, three with torches. Origin at the drum's base centre, +Y up, front (the door) +Z.
// The dome is a child group turned by setTurn(angle); setFire(k) raises the torches (0 by day: nobody has lit one yet).
import * as THREE from 'three';

function makeAcc() {
  const p = [], n = [], c = [];
  const A = {
    p, n, c,
    v(x, y, z, nx, ny, nz, col) { p.push(x, y, z); n.push(nx, ny, nz); c.push(col[0], col[1], col[2]); },
    tri(a, b, d, col, na, nb, nd) {
      let N = na;
      if (!N) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2]; let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; const l = Math.hypot(x, y, z) || 1; N = [x / l, y / l, z / l]; nb = N; nd = N; }
      A.v(a[0], a[1], a[2], N[0], N[1], N[2], col); A.v(b[0], b[1], b[2], nb[0], nb[1], nb[2], col); A.v(d[0], d[1], d[2], nd[0], nd[1], nd[2], col);
    },
    quad(a, b, d, e, col, na, nb, nd, ne) { A.tri(a, b, d, col, na, nb, nd); A.tri(a, d, e, col, na, nd, ne); },
    // a box centred at (cx, cy, cz), turned by ry about Y
    box(cx, cy, cz, sx, sy, sz, col, ry = 0, top = col) {
      const cs = Math.cos(ry), sn = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const P = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
      const q = [P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz)];
      A.quad(q[0], q[1], q[2], q[3], col); A.quad(q[5], q[4], q[7], q[6], col); A.quad(q[1], q[5], q[6], q[2], col); A.quad(q[4], q[0], q[3], q[7], col);
      A.quad(q[3], q[2], q[6], q[7], top); A.quad(q[4], q[5], q[1], q[0], col);
    },
    // surface of revolution about the axis x = ox, z = oz: profile [[r, y], ...] from the bottom up, smooth round the axis
    lathe(ox, oz, prof, seg, colAt, a0 = 0, a1 = Math.PI * 2) {
      for (let j = 0; j < prof.length - 1; j++) {
        const [r0, y0] = prof[j], [r1, y1] = prof[j + 1]; let ny = r0 - r1, nr = y1 - y0; const l = Math.hypot(ny, nr) || 1; ny /= l; nr /= l;
        for (let i = 0; i < seg; i++) {
          const t0 = a0 + (a1 - a0) * i / seg, t1 = a0 + (a1 - a0) * (i + 1) / seg, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
          const col = typeof colAt === 'function' ? colAt(i, j) : colAt;
          A.quad([ox + s0 * r0, y0, oz + c0 * r0], [ox + s1 * r0, y0, oz + c1 * r0], [ox + s1 * r1, y1, oz + c1 * r1], [ox + s0 * r1, y1, oz + c0 * r1], col,
            [s0 * nr, ny, c0 * nr], [s1 * nr, ny, c1 * nr], [s1 * nr, ny, c1 * nr], [s0 * nr, ny, c0 * nr]);
        }
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      g.computeBoundingSphere(); return g;
    },
    get triangles() { return p.length / 9; },
  };
  return A;
}
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// a hemisphere of plates, sliced along x so that a slit between x = -w and +w has straight edges. Quads with |x| < w and
// alpha < open (alpha: 0 at the +z horizon, pi/2 at the zenith) are left out.
function domeShell(A, R, y0, w, open, rng, white, sx = 20, sa = 14) {
  const xs = []; for (let i = 0; i <= sx; i++) { const t = -1 + 2 * i / sx; xs.push(R * Math.sin(t * Math.PI / 2)); }
  // put slice lines exactly on the slit's edges
  if (w > 0) { let bi = 0, bj = 0; xs.forEach((x, i) => { if (Math.abs(x + w) < Math.abs(xs[bi] + w)) bi = i; if (Math.abs(x - w) < Math.abs(xs[bj] - w)) bj = i; }); xs[bi] = -w; xs[bj] = w; }
  const P = (x, al) => { const r = Math.sqrt(Math.max(0, R * R - x * x)); return [x, y0 + r * Math.sin(al), r * Math.cos(al)]; };
  const Nn = (q) => [q[0] / R, (q[1] - y0) / R, q[2] / R];
  for (let i = 0; i < sx; i++) for (let j = 0; j < sa; j++) {
    const a0 = Math.PI * j / sa, a1 = Math.PI * (j + 1) / sa, xm = (xs[i] + xs[i + 1]) / 2;
    if (w > 0 && Math.abs(xm) < w && (a0 + a1) / 2 < open) continue;
    const q0 = P(xs[i], a0), q1 = P(xs[i + 1], a0), q2 = P(xs[i + 1], a1), q3 = P(xs[i], a1);
    const col = shade(white, 0.9 + 0.12 * rng());
    A.quad(q0, q1, q2, q3, col, Nn(q0), Nn(q1), Nn(q2), Nn(q3));
  }
}

// The astronomers' terrace on the west side of the drum (toward the saddle the flight goes through): a paved shelf with a parapet, instruments on
// tripods aimed at the sky, a table, and people standing by them in twos and threes. No lamp. Hero-local coordinates; the world adds it to the hero's
// object. rng: a seeded stream of its own (taken by the world after every earlier one).
export function buildTerrace(rng, lit) {
  const A = makeAcc(), stone = [0.62, 0.57, 0.46], stoneDk = [0.4, 0.37, 0.31], brass = [0.5, 0.4, 0.2], wood = [0.24, 0.18, 0.12], iron = [0.16, 0.15, 0.15];
  const R = 13, Y = 0.55, R1 = 27, a0 = 3.55, a1 = 5.9;
  // the retaining wall in four courses of big blocks (each block two segments long, the courses breaking joint), under a coping that carries the balustrade
  A.lathe(0, 0, [[R1 + 0.3, -5], [R1 + 0.12, -3.7], [R1 + 0.08, -2.3], [R1 + 0.04, -0.9], [R1, Y - 0.12]], 40, (i, j) => shade(stone, 0.7 + 0.24 * (((((i + j) >> 1) * 7 + j * 3) % 5) / 4)), a0, a1);
  A.lathe(0, 0, [[R1, Y - 0.12], [R1 + 0.2, Y - 0.12], [R1 + 0.2, Y + 0.12], [R1 - 0.5, Y + 0.12], [R1 - 0.5, Y]], 40, (i, j) => shade(stone, j === 2 ? 1.12 : j === 0 ? 0.6 : 0.9), a0, a1);
  { const NB = Math.round((a1 - a0) * R1 / 0.78);      // balusters, a pier at every eighth, and the rail they carry
    for (let k = 0; k <= NB; k++) { const a = a0 + (a1 - a0) * k / NB, pier = k % 8 === 0, rr = R1 - 0.15, w = pier ? 0.42 : 0.15, h = pier ? 0.98 : 0.64;
      A.box(Math.sin(a) * rr, Y + 0.12 + h / 2, Math.cos(a) * rr, w, h, w, shade(stone, pier ? 1.0 : 0.86), a, shade(stone, 1.14)); }
    A.lathe(0, 0, [[R1 - 0.36, Y + 0.76], [R1 + 0.06, Y + 0.76], [R1 + 0.06, Y + 0.9], [R1 - 0.36, Y + 0.9], [R1 - 0.36, Y + 0.76]], 40, (i, j) => shade(stone, j === 2 ? 1.14 : j === 0 ? 0.55 : 0.92), a0, a1); }
  // the paving: flags laid in six rings, each flag a shade of its own, the rings breaking joint
  { const NR = 6, pr = []; for (let j = 0; j <= NR; j++) pr.push([R1 - 0.5 - (R1 - 0.5 - R - 1.0) * j / NR, Y]);
    A.lathe(0, 0, pr, 56, (i, j) => shade(stoneDk, 0.72 + 0.42 * (((((i + (j % 2)) >> 1) * 5 + j * 7 + ((i + (j % 2)) >> 1) * j) % 7) / 6)), a0, a1); }
  for (const a of [a0, a1]) { const s = Math.sin(a), c = Math.cos(a); A.box(s * (R + 7.5), Y / 2 - 2.2, c * (R + 7.5), 0.5, Y + 5.3, 13, shade(stone, 0.8), a); }      // its two end walls
  // a tube between two points (four sides)
  const tube = (p, q, r, col) => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz) || 1, ux = -dz / (Math.hypot(dx, dz) || 1), uz = dx / (Math.hypot(dx, dz) || 1);
    const vx = (dy * uz) / l, vy = (dz * ux - dx * uz) / l, vz = (-dy * ux) / l;
    const ring = (o) => [[o[0] + ux * r, o[1], o[2] + uz * r], [o[0] + vx * r, o[1] + vy * r, o[2] + vz * r], [o[0] - ux * r, o[1], o[2] - uz * r], [o[0] - vx * r, o[1] - vy * r, o[2] - vz * r]];
    const c0 = ring(p), c1 = ring(q); for (let i = 0; i < 4; i++) { const k = (i + 1) % 4; A.quad(c0[i], c0[k], c1[k], c1[i], col); } };
  const person = (x, z, yaw, col) => { A.box(x, Y + 0.72, z, 0.46, 1.44, 0.3, col, yaw); A.box(x, Y + 1.58, z, 0.24, 0.26, 0.24, [0.55, 0.42, 0.34], yaw); };
  const cloth = [[0.3, 0.26, 0.22], [0.42, 0.36, 0.3], [0.2, 0.2, 0.26], [0.5, 0.45, 0.4], [0.34, 0.2, 0.18]];
  const NI = 5; let people = 0;
  for (let k = 0; k < NI; k++) {
    const a = a0 + (a1 - a0) * (k + 0.3 + 0.4 * rng()) / NI, rr = R + 5 + 6.5 * rng(), x = Math.sin(a) * rr, z = Math.cos(a) * rr, hgt = 1.25 + 0.3 * rng();
    for (let j = 0; j < 3; j++) { const b = j / 3 * 6.283 + a; tube([x + Math.cos(b) * 0.7, Y, z + Math.sin(b) * 0.7], [x, Y + hgt, z], 0.04, wood); }      // a tripod
    // the instrument on it: a brass tube aimed up at the northern sky, a counterweight, a small finder beside it
    const az = Math.PI + (rng() - 0.5) * 1.3, el = 0.3 + 0.6 * rng(), len = 1.3 + 1.2 * rng(), dx = Math.sin(az) * Math.cos(el), dy = Math.sin(el), dz = Math.cos(az) * Math.cos(el);
    tube([x - dx * len * 0.4, Y + hgt + 0.1 - dy * len * 0.4, z - dz * len * 0.4], [x + dx * len * 0.6, Y + hgt + 0.1 + dy * len * 0.6, z + dz * len * 0.6], 0.09 + 0.05 * rng(), brass);
    A.box(x, Y + hgt + 0.02, z, 0.24, 0.2, 0.24, iron, az);
    const n = 1 + Math.floor(rng() * 3);
    for (let j = 0; j < n; j++) { const b = az + Math.PI + (j - (n - 1) / 2) * 0.9 + (rng() - 0.5) * 0.4, d = 0.9 + 0.5 * rng(); person(x + Math.sin(b) * d, z + Math.cos(b) * d, b + Math.PI, cloth[(k + j) % 5]); people++; }
  }
  // a table of charts and clockwork by the stair foot, two more people at it
  { const a = a1 - 0.5, rr = R + 4, x = Math.sin(a) * rr, z = Math.cos(a) * rr; A.box(x, Y + 0.78, z, 2.4, 0.1, 1.1, wood, a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.box(x + sx * Math.cos(a) * 1.05 + sz * Math.sin(a) * 0.45, Y + 0.38, z - sx * Math.sin(a) * 1.05 + sz * Math.cos(a) * 0.45, 0.1, 0.76, 0.1, wood, a);
    A.box(x, Y + 0.93, z, 0.5, 0.2, 0.4, brass, a + 0.4); person(x + Math.sin(a) * 1.1, z + Math.cos(a) * 1.1, a + Math.PI, cloth[1]); person(x - Math.sin(a) * 1.0 + 0.5, z - Math.cos(a) * 1.0, a, cloth[2]); people += 2; }
  const mesh = new THREE.Mesh(A.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  if (lit) lit(mesh.material, 1e5);      // (second hand mend, N2b) the terrace takes the light of the lamps that stand on it and of the building's own
  return { object: mesh, triangles: A.triangles, people };
}

// (second hand mend, N2b) THE BUILDING STANDS IN ITS OWN LIGHT. Its lamps (the hall's light out of the door, every lit window, the gallery's torches)
// light the pale stone round them, and the lamps that people carry light its foot and the terrace they stand on. Light added to the stone's own
// colour, as strong as each lamp burns and no more: the same at every hour, with no share of the sky's state, the clock or the eye in it.
// U: { uLamp: xyz in the building's own metres and the lamp's strength, uLampQ: 1 / reach squared, uLampAt: where the building stands,
//      uPool: the world's pools of carried lamplight (x, z, strength, 1 / reach squared), uPoolY: the height over which that light dies up a wall }
const NLAMP = 40;
function lampLit(material, U) {
  const NP = U.uPool.value.length;
  material.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLampW;').replace('#include <project_vertex>', '#include <project_vertex>\nvLampW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vLampW; uniform vec4 uLamp[${NLAMP}]; uniform float uLampQ[${NLAMP}]; uniform vec3 uLampAt; uniform vec4 uPool[${NP}]; uniform vec4 uPoolBox[2]; uniform vec2 uPoolY;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 hp = vLampW - uLampAt, ll = vec3(0.0);
          for (int k = 0; k < ${NLAMP}; k++) { vec3 dd = hp - uLamp[k].xyz; float a = max(0.0, 1.0 - dot(dd, dd)*uLampQ[k]); ll += vec3(1.0, 0.66, 0.27)*(uLamp[k].w*a*a); }
          float low = 1.0 - smoothstep(uPoolY.x, uPoolY.y, hp.y);
          // (cost only, C1: outside the two boxes that hold every lit carried pool the sum is nothing; the boxes are the world's, from the lamps' places)
          if ((all(greaterThan(vLampW.xz, uPoolBox[0].xy)) && all(lessThan(vLampW.xz, uPoolBox[0].zw))) || (all(greaterThan(vLampW.xz, uPoolBox[1].xy)) && all(lessThan(vLampW.xz, uPoolBox[1].zw)))) {
            for (int k = 0; k < ${NP}; k++) { vec2 dd = vLampW.xz - uPool[k].xy; float a = max(0.0, 1.0 - dot(dd, dd)*uPool[k].w); ll += vec3(1.0, 0.5, 0.14)*(uPool[k].z*a*a*low); }
          }
          vec3 fl = diffuseColor.rgb*ll; float fm = max(fl.r, max(fl.g, fl.b)); totalEmissiveRadiance += fl*(0.42/(0.42 + fm)); }`); };
}

export async function buildHero(ctx, opts = {}) {
  const rng = (opts.rng || ctx.rng).fork('observatory');
  const stone = [0.62, 0.57, 0.46], stoneDk = [0.4, 0.37, 0.31], white = [0.8, 0.79, 0.75], dark = [0.035, 0.03, 0.035], roof = [0.3, 0.27, 0.25], iron = [0.16, 0.15, 0.15];
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const R = 13, H = 14;

  // ---- the drum, its plinth, cornice, pilasters, door and blind slits
  const A = makeAcc();
  { // the wall is laid in nine courses of dressed blocks, each block a shade of its own
    const prof = [[R + 1.1, -6], [R + 1.1, 0.9], [R + 0.5, 1.3], [R + 0.12, 1.5], [R, 2.0]], NC = 9, ch = (H - 3.6) / NC, row = [-1, -1, -1, -1];      // row: which course a band of the profile is (-1 none, -2 a joint's ledge, -3 its recess, -4 its underside)
    for (let k = 0; k < NC; k++) { const y1 = 2.0 + ch * (k + 1);
      if (k < NC - 1) { prof.push([R, y1 - 0.05], [R - 0.08, y1 - 0.05], [R - 0.08, y1 + 0.05], [R, y1 + 0.05]); row.push(k, -2, -3, -4); } else { prof.push([R, y1]); row.push(k); } }
    prof.push([R + 0.3, H - 1.2], [R + 0.7, H - 0.5], [R + 2.3, H - 0.35], [R + 2.3, H]);
    const blk = Array.from({ length: 48 * (NC + 1) }, () => 0.88 + 0.2 * rng());
    A.lathe(0, 0, prof, 48, (i, j) => { const r = j < row.length ? row[j] : -5;
      return shade(stone, r >= 0 ? 0.76 + (blk[r * 48 + ((i + (r % 2)) >> 1) * 2] - 0.88) * 1.7 : r === -2 ? 1.05 : r === -3 ? 0.42 : r === -4 ? 0.5 : j < 2 ? 0.7 : j === prof.length - 3 ? 0.6 : 0.95); }); }
  for (let k = 0; k < 64; k++) { const a = (k + 0.5) / 64 * Math.PI * 2; A.box(Math.sin(a) * (R + 1.45), H - 0.62, Math.cos(a) * (R + 1.45), 0.5, 0.36, 1.3, shade(stone, 0.82), a); }      // corbels under the gallery
  await ctx.yield();
  for (let k = 0; k < 16; k++) {      // pilasters between the bays; every bay has a tall blind slit (dark: no window is lit on this world)
    const a = (k + 0.5) / 16 * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    A.box(s * (R + 0.25), 7, c * (R + 0.25), 1.3, 11.6, 0.6, shade(stone, 1.06), a);
    const b = k / 16 * Math.PI * 2, sb = Math.sin(b), cb = Math.cos(b);
    if (k !== 0) A.box(sb * (R + 0.02), 7.4, cb * (R + 0.02), 0.9, 4.6, 0.24, dark, b);
  }
  // a string course above the slits and, high in every bay, a small square window with its sill (dark, like every window here)
  A.lathe(0, 0, [[R + 0.02, 9.9], [R + 0.24, 10.0], [R + 0.24, 10.25], [R + 0.02, 10.35]], 48, shade(stone, 1.1));
  for (let k = 0; k < 16; k++) { const b = k / 16 * Math.PI * 2, sb = Math.sin(b), cb = Math.cos(b); A.box(sb * (R + 0.03), 11.45, cb * (R + 0.03), 0.8, 0.9, 0.24, dark, b); A.box(sb * (R + 0.1), 10.9, cb * (R + 0.1), 1.1, 0.14, 0.34, shade(stone, 1.12), b); }
  // the outer stair: a stone flight that climbs round the drum's south-west quarter from the terrace to a landing under the gallery, with an iron rail
  { const NS = 38, a0 = 5.95, a1 = 4.3, w = 1.5, rr = R + 0.2 + w / 2, ro = R + 0.2 + w - 0.08; let prev = null;
    for (let k = 0; k < NS; k++) {
      const a = a0 + (a1 - a0) * (k + 0.5) / NS, y = 0.5 + (H - 1.4) * (k + 1) / NS, sa = Math.sin(a), ca = Math.cos(a);
      A.box(sa * rr, y / 2 - 1.5, ca * rr, 0.66, y + 3, w, shade(stone, 0.9 + 0.1 * (k % 2)), a, shade(stone, 1.12));
      const top = [sa * ro, y + 1.0, ca * ro];
      if (k % 3 === 0) A.box(sa * ro, y + 0.5, ca * ro, 0.09, 1.0, 0.09, iron, a);
      if (prev) A.quad([prev[0], prev[1] - 0.09, prev[2]], [top[0], top[1] - 0.09, top[2]], top, prev, iron);
      prev = top;
    } }
  await ctx.yield();
  A.box(0, 2.9, R + 0.25, 4.4, 5.8, 0.9, shade(stone, 1.08), 0); A.box(0, 2.5, R + 0.62, 2.6, 5.0, 0.3, dark, 0);      // the door, open and dark
  A.box(0, 0.35, R + 2.6, 6, 0.7, 4.4, stoneDk, 0); A.box(0, 0.15, R + 5.2, 7.4, 0.3, 2.4, stoneDk, 0);      // steps
  // ---- the gallery: floor ring, posts and rail
  A.lathe(0, 0, [[R + 2.3, H], [R - 0.2, H + 0.02]], 48, shade(stoneDk, 1.1));
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; A.box(Math.sin(a) * (R + 2.1), H + 0.55, Math.cos(a) * (R + 2.1), 0.14, 1.1, 0.14, iron, a); }
  A.lathe(0, 0, [[R + 2.18, H + 1.05], [R + 2.18, H + 1.17], [R + 2.02, H + 1.17], [R + 2.02, H + 1.05]], 40, iron);
  A.lathe(0, 0, [[R + 2.12, H + 0.55], [R + 2.12, H + 0.6], [R + 2.08, H + 0.6]], 40, iron);
  // the dome's seat: a low ring the dome turns on
  A.lathe(0, 0, [[R + 0.25, H], [R + 0.25, H + 0.7], [R - 0.1, H + 0.75]], 48, shade(stone, 0.85));
  await ctx.yield();

  // ---- the college range and the two small domes to the east
  const X0 = 22;
  A.box(X0 + 16, 3.6, -9, 34, 7.2, 8, stone, 0); A.box(X0 + 16, 7.25, -9, 34.8, 0.3, 8.8, shade(stone, 1.1), 0);
  { const rz = -9, y = 7.4, hw = 4.4, x0 = X0 - 1.2, x1 = X0 + 33.2;      // a pitched roof
    A.quad([x0, y, rz + hw], [x1, y, rz + hw], [x1, y + 3.2, rz], [x0, y + 3.2, rz], roof); A.quad([x1, y, rz - hw], [x0, y, rz - hw], [x0, y + 3.2, rz], [x1, y + 3.2, rz], roof);
    A.tri([x0, y, rz - hw], [x0, y, rz + hw], [x0, y + 3.2, rz], stone); A.tri([x1, y, rz + hw], [x1, y, rz - hw], [x1, y + 3.2, rz], stone); }
  for (let k = 0; k < 9; k++) { A.box(X0 + 1.5 + k * 3.7, 3.3, -4.96, 1.0, 3.0, 0.2, dark, 0); A.box(X0 + 3.3 + k * 3.7, 3.4, -4.7, 0.7, 6.8, 0.7, shade(stone, 1.05), 0); }      // deep unlit openings between buttresses
  A.box(X0 + 6, 1.1, 2, 9, 2.2, 0.7, stoneDk, 0); A.box(X0 + 25, 1.1, 5, 16, 2.2, 0.7, stoneDk, 0.12);      // garden walls
  const small = [[30, 0, 4], [41.5, 0, 9]];
  for (const [sx, sy, sz] of small) {
    A.lathe(sx, sz, [[4.5, -3], [4.5, 0.5], [4.1, 0.8], [4.1, 5.0], [4.4, 5.3], [4.4, 5.7], [4.0, 5.7]], 20, (i, j) => shade(stone, j === 3 ? 0.92 + 0.1 * ((i * 3) % 4) / 4 : 0.85));
    A.box(sx, 1.6, sz + 4.15, 1.3, 2.6, 0.2, dark, 0);
    // its dome: white plates, a dark slit toward the north
    const dp = []; for (let e = 0; e <= 6; e++) { const t = e / 6 * Math.PI / 2; dp.push([4.05 * Math.cos(t) + 0.02, 5.7 + 4.05 * Math.sin(t)]); }
    A.lathe(sx, sz, dp, 20, (i, j) => (i === 10 && j > 0 ? dark : shade(white, 0.88 + 0.12 * ((i * 5 + j * 3) % 4) / 4)));
  }
  await ctx.yield();
  const base = new THREE.Mesh(A.geometry(), mat); group.add(base);
  let triangles = A.triangles;

  // ---- the turning dome: plates, slit rails, the two shutter leaves, the telescope's rim
  const dome = new THREE.Group(); dome.position.y = H + 0.7; group.add(dome);
  const D = makeAcc(), OPEN = Math.PI / 2 + 15 * Math.PI / 180, W = 2.5;
  domeShell(D, R, 0, W, OPEN, rng, white);
  await ctx.yield();
  // rivet bands: thin raised hoops, and a skirt
  for (const lat of [0.16, 0.5, 0.86, 1.2]) { const r = (R + 0.05) * Math.cos(lat), y = (R + 0.05) * Math.sin(lat); D.lathe(0, 0, [[r + 0.09, y - 0.1], [r + 0.02, y + 0.12]], 40, shade(white, 0.78), 0.2, Math.PI * 2 - 0.2); }
  D.lathe(0, 0, [[R + 0.3, -0.7], [R + 0.3, 0.25], [R + 0.02, 0.5]], 48, shade(white, 0.86));
  // the seams between the plates stand up as ribs, from the skirt over the crown and down the back (none across the slit)
  for (let i = 1; i < 20; i++) {
    const x = R * Math.sin((-1 + 2 * i / 20) * Math.PI / 2); if (Math.abs(x) < W + 0.5) continue;
    const r = Math.sqrt(R * R - x * x) + 0.1, hw = 0.11, cl = shade(white, 0.68);
    for (let j = 0; j < 14; j++) { const b0 = Math.PI * j / 14, b1 = Math.PI * (j + 1) / 14;
      D.quad([x - hw, r * Math.sin(b0), r * Math.cos(b0)], [x + hw, r * Math.sin(b0), r * Math.cos(b0)], [x + hw, r * Math.sin(b1), r * Math.cos(b1)], [x - hw, r * Math.sin(b1), r * Math.cos(b1)], cl); }
  }
  for (const sgn of [-1, 1]) {      // slit rails and the parked shutter leaf on each side
    for (let j = 0; j < 12; j++) {
      const a0 = OPEN * j / 12, a1 = OPEN * (j + 1) / 12, x = sgn * W, r0 = Math.sqrt(R * R - x * x) + 0.12;
      const p0 = [x, r0 * Math.sin(a0), r0 * Math.cos(a0)], p1 = [x, r0 * Math.sin(a1), r0 * Math.cos(a1)], o = 0.42;
      D.quad([x - o * sgn, p0[1] * 1.02, p0[2] * 1.02], [x + o * sgn, p0[1] * 1.02, p0[2] * 1.02], [x + o * sgn, p1[1] * 1.02, p1[2] * 1.02], [x - o * sgn, p1[1] * 1.02, p1[2] * 1.02], shade(white, 0.7));
      const xo = sgn * (W + 2.6), r1 = Math.sqrt(R * R - xo * xo) + 0.3, r2 = Math.sqrt(R * R - x * x) + 0.3;
      const q0 = [x + 0.25 * sgn, r2 * Math.sin(a0), r2 * Math.cos(a0)], q1 = [xo, r1 * Math.sin(a0), r1 * Math.cos(a0)], q2 = [xo, r1 * Math.sin(a1), r1 * Math.cos(a1)], q3 = [x + 0.25 * sgn, r2 * Math.sin(a1), r2 * Math.cos(a1)];
      const cl = shade(white, 0.97 + 0.06 * (j % 2));
      if (sgn > 0) D.quad(q0, q1, q2, q3, cl); else D.quad(q1, q0, q3, q2, cl);
    }
  }
  // the telescope: a dark tube laid toward the slit, its pale rim just inside the opening
  { const el = 52 * Math.PI / 180, ax = [0, Math.sin(el), Math.cos(el)], u = [1, 0, 0], v = [0, -ax[2], ax[1]];
    const ring = (rad, dist) => Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2, cs = Math.cos(a) * rad, sn = Math.sin(a) * rad; return [u[0] * cs + v[0] * sn + ax[0] * dist, u[1] * cs + v[1] * sn + ax[1] * dist, u[2] * cs + v[2] * sn + ax[2] * dist]; });
    const r0 = ring(1.2, 10.6), r1 = ring(1.34, 10.5), r2 = ring(1.2, 2.5), r3 = ring(0.95, 10.6);
    for (let i = 0; i < 20; i++) { const k = (i + 1) % 20; D.quad(r1[i], r1[k], r0[k], r0[i], [0.74, 0.68, 0.5]); D.quad(r0[i], r0[k], r3[k], r3[i], [0.6, 0.55, 0.4]); D.quad(r2[i], r2[k], r1[k], r1[i], [0.2, 0.17, 0.12]); }
  }
  const domeMesh = new THREE.Mesh(D.geometry(), mat); dome.add(domeMesh); triangles += D.triangles;
  const doorU = { uTime: { value: 0 }, uFire: { value: 0 } };
  { const dg = new THREE.BufferGeometry();      // two quads: the doorway (upright, facing out) and the top step (flat); uv.x across, uv.y up or outward
    dg.setAttribute('position', new THREE.Float32BufferAttribute([-1.25, 0.05, R + 0.8, 1.25, 0.05, R + 0.8, 1.25, 4.95, R + 0.8, -1.25, 4.95, R + 0.8, -2.6, 0.76, R + 0.85, 2.6, 0.76, R + 0.85, 2.6, 0.76, R + 4.75, -2.6, 0.76, R + 4.75], 3));
    dg.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0, -1, 0, 1, 1, 0, 1, 1, 1, 1, -1, 1, 1], 3)); dg.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
    const dm = new THREE.Mesh(dg, new THREE.ShaderMaterial({ uniforms: doorU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'attribute vec3 aQ; varying vec3 vQ; void main(){ vQ = aQ; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
      fragmentShader: /* glsl */`uniform float uTime, uFire; varying vec3 vQ;
        // (torches in a room, not a furnace mouth: two small yellow lights well inside the hall, each with its own flicker, and what they throw on the step)
        void main(){ float f1 = 0.7 + 0.3*sin(uTime*7.3)*sin(uTime*4.1 + 1.7) + 0.1*sin(uTime*19.0), f2 = 0.7 + 0.3*sin(uTime*5.9 + 2.0)*sin(uTime*3.3 + 0.4) + 0.1*sin(uTime*23.0 + 1.0);
          float x = clamp(vQ.x, -1.0, 1.0), y = clamp(vQ.y, 0.0, 1.0);
          float door = (exp(-((x + 0.42)*(x + 0.42)*5.0 + (y - 0.3)*(y - 0.3)*9.0))*f1 + 0.7*exp(-((x - 0.5)*(x - 0.5)*6.0 + (y - 0.24)*(y - 0.24)*11.0))*f2)*0.26 + 0.03;
          float step1 = exp(-(x*x*3.0 + y*y*3.5))*(1.0 - x*x*x*x)*(1.0 - y)*0.12*(0.5*f1 + 0.5*f2);
          gl_FragColor = vec4(vec3(1.0, 0.7, 0.27)*(mix(door, step1, vQ.z)*uFire), 1.0); }` }));
    dm.renderOrder = 4; dm.frustumCulled = false; group.add(dm); triangles += 4; }
  // the inside, seen through the slit: black, with the flicker of one torch on the far wall
  const inner = new THREE.Mesh(new THREE.SphereGeometry(R - 0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x030304, side: THREE.BackSide })); dome.add(inner); triangles += 24 * 12 * 2;
  const fireU = { uTime: { value: 0 }, uFire: { value: 0 }, uFall: { value: 0 } }, flickU = { uTime: fireU.uTime, uFire: { value: 0 } };
  const flick = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.ShaderMaterial({ uniforms: flickU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime, uFire; varying vec2 vUv; void main(){ vec2 q = vUv - vec2(0.5, 0.3); float g = exp(-dot(q, q)*9.0); float f = 0.75 + 0.25*sin(uTime*9.0)*sin(uTime*5.3 + 1.0) + 0.1*sin(uTime*23.0); gl_FragColor = vec4(vec3(1.0, 0.68, 0.25)*(g*f*uFire*0.5), 1.0); }' }));
  flick.position.set(0, 4.2, -R + 1.6); dome.add(flick); triangles += 2;
  await ctx.yield();

  // ---- the watchers on the gallery (twelve; six hold torches: every other one) and their flames
  const F = makeAcc(), cloth = [[0.3, 0.26, 0.22], [0.42, 0.36, 0.3], [0.2, 0.2, 0.26], [0.5, 0.45, 0.4]];
  const torchPts = [];
  for (let k = 0; k < 12; k++) {
    const a = (k < 8 ? -0.75 + k * 0.21 + 0.06 * rng() : 1.4 + (k - 8) * 1.1 + 0.3 * rng()), rr = R + 1.55, x = Math.sin(a) * rr, z = Math.cos(a) * rr, col = cloth[k % 4];
    F.box(x, H + 0.72, z, 0.46, 1.44, 0.3, col, a); F.box(x, H + 1.58, z, 0.24, 0.26, 0.24, [0.55, 0.42, 0.34], a);
    if (k % 2 === 1) { const tx = x + Math.cos(a) * 0.34, tz = z - Math.sin(a) * 0.34; F.box(tx, H + 1.55, tz, 0.07, 0.9, 0.07, [0.2, 0.14, 0.08], a); torchPts.push(new THREE.Vector3(tx, H + 2.12, tz)); }
  }
  const folk = new THREE.Mesh(F.geometry(), mat); group.add(folk); triangles += F.triangles;
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 2, 0, -1, 2, 0], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  fg.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(torchPts.flatMap((p) => [p.x, p.y, p.z])), 3)); fg.instanceCount = torchPts.length;
  // THE SCHOLARS' TORCHLIGHT (fix round 3): they kindle their torches one after another well before the dark, in this building only. Every light has
  // a moment of its own along the dusk (0 = its beginning, 1 = the snap), dealt from a stream of its own (scholars): the hall behind the door first,
  // then the rooms behind the tall windows and the small ones above (not every room: 6 in 10 and 45 in 100), the torch inside the dome, and the six
  // on the gallery. One of the gallery's torches is the one that falls and goes out when the Stars swell (setFall).
  const sr = opts.scholars || ((i) => () => ((i = (i * 16807 + 11) % 2147483647) / 2147483647))(7);
  const kDoor = 0.03 + 0.2 * sr(), kSlit = 0.12 + 0.5 * sr(), fallen = Math.min(torchPts.length - 1, Math.floor(sr() * torchPts.length));
  const torchK = torchPts.map(() => 0.1 + 0.82 * sr());
  fg.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(torchPts.flatMap((p, i) => [torchK[i], i === fallen ? 1 : 0])), 2));
  const winU = { uTime: fireU.uTime, uFire: { value: 0 } }, wins = [];
  for (let k = 0; k < 16; k++) for (const tall of [true, false]) { const lit = sr() < (tall ? 0.6 : 0.45), at = 0.06 + 0.88 * sr(), ph = sr(), side = sr() - 0.5;
    if (!lit || (tall && k === 0)) continue;      // (bay 0 is the door's; each opening takes its four draws whether it is lit or not)
    wins.push({ b: k / 16 * Math.PI * 2, y: tall ? 7.4 : 11.45, hw: tall ? 0.4 : 0.36, hh: tall ? 2.2 : 0.41, at, ph, side }); }
  if (wins.length) { const wg = new THREE.InstancedBufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); wg.setIndex([0, 1, 2, 0, 2, 3]);
    wg.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(wins.flatMap((w) => [Math.sin(w.b) * (R + 0.17), w.y, Math.cos(w.b) * (R + 0.17), w.b])), 4));
    wg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(wins.flatMap((w) => [w.hw, w.hh, w.at, w.ph])), 4));
    wg.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(wins.map((w) => w.side)), 1)); wg.instanceCount = wins.length;
    const wm = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: winU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec4 aC, aS; attribute float aT; uniform float uTime, uFire; varying vec3 vQ; varying float vK;
        void main(){ vQ = vec3(position.xy, aT); float ph = aS.w*40.0;
          vK = smoothstep(aS.z, aS.z + 0.03, uFire)*(0.74 + 0.26*sin(uTime*(6.1 + 3.0*aS.w) + ph)*sin(uTime*3.7 + ph*1.7));
          vec3 p = vec3(aC.x + cos(aC.w)*position.x*aS.x, aC.y + position.y*aS.y, aC.z - sin(aC.w)*position.x*aS.x);
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.0); if (vK < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,
      // a room with a torch in it: the light is low in the opening and to one side, and the window's bar crosses it
      fragmentShader: /* glsl */`varying vec3 vQ; varying float vK;
        void main(){ float x = clamp(vQ.x, -1.0, 1.0), y = clamp(vQ.y, -1.0, 1.0), dx = x - vQ.z*1.2, dy = y + 0.45;
          float g = 0.22 + 0.78*exp(-(dx*dx*1.6 + dy*dy*1.4)), bar = smoothstep(0.03, 0.12, abs(x))*smoothstep(0.02, 0.06, abs(y - 0.2));
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.28)*(g*(0.3 + 0.7*bar)*vK*0.42), 1.0); }` }));
    wm.renderOrder = 4; wm.frustumCulled = false; group.add(wm); triangles += wins.length * 2; }
  const flames = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: fireU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    // (fix round 3, S4: each flame stands upright along the world's up and turns about its own place toward the eye's PLACE; nothing is offset in
    // the picture's own axes. The card is three times the flame's box so that it holds the torch's glow in the air, sigma 0.4 m, as the road's do.)
    vertexShader: /* glsl */`attribute vec3 aPos; attribute vec2 aK; uniform float uTime, uFire, uFall; varying vec2 vQ, vM; varying float vS, vOn;
      void main(){ float fall = aK.y*uFall; vec3 p0 = aPos; p0.y -= fall*fall*15.0; p0.xz *= 1.0 + 0.09*fall;      // (the one that falls: over the rail and down the wall, and out)
        vOn = smoothstep(aK.x, aK.x + 0.03, uFire)*(1.0 - aK.y*smoothstep(0.5, 1.0, uFall));
        vec3 wc = (modelMatrix*vec4(p0, 1.0)).xyz, te = cameraPosition - wc, right = normalize(vec3(te.z, 0.0, -te.x) + vec3(1e-5, 0.0, 0.0));
        float s = 0.34*(0.85 + 0.15*sin(uTime*11.0 + aPos.x*3.0));
        vec2 q = vec2(position.x*3.0, (position.y - 1.0)*3.0 + 1.0);      // the flame's own box is x -1..1, y 0..2
        float lean = 0.3*clamp(q.y, 0.0, 2.0)*(0.6 + 0.4*sin(uTime*3.1 + aPos.z));
        vec3 wp = wc + right*((q.x + lean)*s) + vec3(0.0, q.y*1.15*s, 0.0);
        vQ = q; vM = vec2(q.x, (q.y - 0.7)*1.15)*s; vS = aPos.x;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0); if (vOn < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,
    fragmentShader: /* glsl */`uniform float uTime, uFire; varying vec2 vQ, vM; varying float vS, vOn;
      void main(){ float inB = step(abs(vQ.x), 1.0)*step(0.0, vQ.y)*step(vQ.y, 2.0), y = clamp(vQ.y, 0.0, 2.0)*0.5; float w = (1.0 - y)*(0.35 + 0.65*y*2.0*(1.0 - y)*2.0); float d = abs(vQ.x + 0.12*sin(y*9.0 - uTime*13.0 + vS))/max(w, 1e-3);
        float f = max(1.0 - d, 0.0)*smoothstep(0.0, 0.12, y)*(1.0 - smoothstep(0.75, 1.0, y))*inB; float core = max(1.0 - length(vec2(vQ.x*2.2, (vQ.y - 0.35)*1.5)), 0.0);
        float glow = exp(-min(dot(vM, vM)/0.32, 40.0))*(1.0 - smoothstep(2.2, 3.0, max(abs(vQ.x), abs(vQ.y - 1.0))));
        gl_FragColor = vec4((vec3(1.0, 0.5, 0.1)*f*2.0 + vec3(1.0, 0.85, 0.5)*core*core*4.0 + vec3(1.0, 0.5, 0.13)*glow*0.4)*vOn, 1.0); }` }));
  flames.frustumCulled = false; group.add(flames); triangles += torchPts.length * 2;

  // (second hand mend, N2b) the lamps the building is lit by: where each stands, how far its light reaches (m), how strong it is, its moment along
  // the dusk (the same as its flame's) and the phase of its flicker. The hall's light out of the door; each lit window, from just outside its
  // opening; each torch on the gallery (the one that falls takes its light down the wall with it, and out).
  // (the last thing, Q1c) each lamp's light falls off within a few metres, so the stone between one lit opening and the next is dark: 4 m from the
  // door, 2.6 m from a tall window (the bays are 5.1 m apart), 1.5 m from a small one, 3 m from a torch on the gallery
  const lamps = [{ x: 0, y: 2.4, z: R + 1.6, r: 4, s: 0.55, at: kDoor, ph: 0.31, fall: false }];
  for (const w of wins) { const tall = w.hh > 1; lamps.push({ x: Math.sin(w.b) * (R + 0.4), y: w.y - (tall ? 0.8 : 0), z: Math.cos(w.b) * (R + 0.4), r: tall ? 2.6 : 1.5, s: tall ? 0.5 : 0.4, at: w.at, ph: w.ph, fall: false }); }
  torchPts.forEach((q, i) => lamps.push({ x: q.x, y: q.y, z: q.z, r: 3, s: 0.7, at: torchK[i], ph: 0.13 + 0.17 * i, fall: i === fallen }));
  const lampU = { uLamp: { value: Array.from({ length: NLAMP }, () => new THREE.Vector4(0, 0, 0, 0)) }, uLampQ: { value: new Float32Array(NLAMP) }, uLampAt: { value: new THREE.Vector3() },
    uPool: { value: opts.pools || [new THREE.Vector4(0, 0, 0, 0)] },
    uPoolBox: { value: opts.poolBox || [new THREE.Vector4(1e9, 1e9, -1e9, -1e9), new THREE.Vector4(1e9, 1e9, -1e9, -1e9)] } };
  lamps.slice(0, NLAMP).forEach((l, j) => { lampU.uLamp.value[j].set(l.x, l.y, l.z, 0); lampU.uLampQ.value[j] = 1 / (l.r * l.r); });
  const lit = (material, top) => lampLit(material, { ...lampU, uPoolY: { value: new THREE.Vector2(top, top + 2.5) } });
  lit(mat, 2);      // (a carried lamp is some 2.4 m up: its light dies up the wall between 2 m and 4.5 m)
  let fireK = 0, fallK = 0;
  const lampsNow = (time) => { group.getWorldPosition(lampU.uLampAt.value);
    for (let j = 0; j < Math.min(NLAMP, lamps.length); j++) { const l = lamps[j], t = Math.min(1, Math.max(0, (fireK - l.at) / 0.03)), f = l.fall ? Math.min(1, Math.max(0, (fallK - 0.5) / 0.5)) : 0, v = lampU.uLamp.value[j];
      v.y = l.y - (l.fall ? fallK * fallK * 15 : 0); v.w = l.s * t * t * (3 - 2 * t) * (1 - f * f * (3 - 2 * f)) * (0.86 + 0.14 * Math.sin(time * (6.1 + 3 * l.ph) + l.ph * 40) * Math.sin(time * 3.7 + l.ph * 68)); } };

  let inWorld = false;
  const api = {
    object: group, radius: 30, height: 30, center: new THREE.Vector3(6, 14, 0), triangles, dome, material: mat,
    anchors: { torches: torchPts, top: new THREE.Vector3(0, H + 0.7 + R, 0) },
    // the bearing of the slit: 0 = front (+Z), turning counter-clockwise seen from above
    setTurn(a) { dome.rotation.y = a; },
    // k: how far the dusk has come (0 = its beginning, 1 = the snap and after): each light is kindled at its own moment along it
    setFire(k) { const on = (at) => { const t = Math.min(1, Math.max(0, (k - at) / 0.03)); return t * t * (3 - 2 * t); }; fireK = k; fireU.uFire.value = k; winU.uFire.value = k; doorU.uFire.value = on(kDoor); flickU.uFire.value = on(kSlit); api.doorLit = doorU.uFire.value; },
    // k: 0 = held, 1 = fallen and out (the one torch on the gallery that drops when the Stars swell)
    setFall(k) { fallK = k; fireU.uFall.value = k; },
    doorLit: 0, lights: { door: kDoor, slit: kSlit, windows: wins.length, torches: torchPts.length, fallen },
    // the door's facts for whoever walks in at it (this part's own metres, the door toward +Z): the front of its dark, half its width, and the two
    // steps before it as [nearer edge, farther edge, half width, height of the tread]
    door: { face: R + 0.77, half: 1.3, steps: [[R + 0.4, R + 4.8, 3, 0.7], [R + 4.0, R + 6.4, 3.7, 0.3]] },
    // alone in the viewer the dome turns slowly with its torches lit; in the world the world drives both
    update(dt, time) { fireU.uTime.value = time; doorU.uTime.value = time; if (!inWorld) { api.setFire(1); dome.rotation.y = 0.35 + 0.08 * time; } lampsNow(time); },
    // (second hand mend) lit(material, top): another thing of the building (the terrace) takes the same lamps' light
    lit,
    world() { inWorld = true; api.setFire(0); return api; },
    ground: true, groundY: 0,
  };
  return api;
}
