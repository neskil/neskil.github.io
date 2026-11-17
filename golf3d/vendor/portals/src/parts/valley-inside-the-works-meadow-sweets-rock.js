// valley-inside-the-works, the meadow: ROCK CANDY ON THE SCAR. Clusters of sugar crystals (clear pink, amber and
// white prisms) grow from the scar's ledges and along its lip on both sides of the fall, in the sweets' own material
// (part 7 of its paint: clear sugar, every face a facet of its own).
// One instanced mesh of one prism: six sides and a six-sided point, 18 triangles. A cluster roots on one of the
// scar's own spots (a ledge or the rim): 3 to 6 prisms leaning out from the face every way, the first the longest,
// 0.9 to 3 m long. None within 9 m of the fall's middle (the wet rock stays clean), and a prism whose root or point
// would come within 4 m of the flown line (the plan's routeDistance, its own breadth taken off) is left out.
// At most 420 prisms: 7,560 triangles and one draw call. They are put away with the scar.
// Stream: 'meadow-rock-candy' (a spot's dice are all drawn before its tests).
import * as P from './valley-inside-the-works-plan.js';

const COLOURS = [[0.62, 0.2, 0.3], [0.62, 0.36, 0.06], [0.62, 0.6, 0.55]];      // pink, amber, white, in linear light
const MOST = 420, BODY = 0.72;

// the prism: its axis from y 0 to 1, a unit across; flat faces (each its own vertices and normal)
export function crystalForm(THREE) {
  const pos = [], nor = [], aS = [], aO = [];
  const face = (a, b, c) => {
    let n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    // (a face looks away from the axis: its corners are turned round if they run the other way)
    if (n[0] * (a[0] + b[0] + c[0]) + n[2] * (a[2] + b[2] + c[2]) < 0) { const t = b; b = c; c = t; n = [-n[0], -n[1], -n[2]]; }
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    for (const p of [a, b, c]) { pos.push(p[0], p[1], p[2]); nor.push(n[0] / l, n[1] / l, n[2] / l); aS.push(0, p[1], 7, 0); aO.push(0, 0, 0); }
  };
  for (let k = 0; k < 6; k++) {
    const a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3, p0 = [0.5 * Math.cos(a0), 0, 0.5 * Math.sin(a0)], p1 = [0.5 * Math.cos(a1), 0, 0.5 * Math.sin(a1)];
    const q0 = [p0[0], BODY, p0[2]], q1 = [p1[0], BODY, p1[2]];
    face(p0, p1, q1); face(p0, q1, q0); face(q0, q1, [0, 1, 0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4)); g.setAttribute('aO', new THREE.Float32BufferAttribute(aO, 3));
  g.userData.triangles = pos.length / 9;
  return g;
}

// rockCandy(THREE, rngFor, spots, material) -> { mesh (or null), owned, triangles, count, minClear }
// spots: the scar's own (kind 0 a ledge, 1 the rim); material: the sweets' one material
export function rockCandy(THREE, rngFor, spots, material) {
  const rng = rngFor('meadow-rock-candy'), mid = P.riverX(P.FALL_Z), list = [];
  let minClear = 1e9;
  for (const f of spots) {
    const keep = rng(), many = rng(), hue = rng(), dice = []; for (let i = 0; i < 36; i++) dice.push(rng());
    if (f.kind > 1 || Math.abs(f.x - mid) < 9 || keep > 0.7 || list.length >= MOST) continue;
    const n = 3 + Math.floor(many * 4);
    for (let i = 0; i < n && list.length < MOST; i++) {
      const d = dice.slice(6 * i, 6 * i + 6), len = (i ? 0.9 + 1.2 * d[0] : 1.9 + 1.1 * d[0]), thick = len * (0.24 + 0.12 * d[1]);
      // (it leans out of the face, toward the lower valley, and up, spread every way)
      let dir = [(d[2] - 0.5) * 1.8, 0.45 + 0.9 * d[3], 0.35 + 0.8 * d[4]]; const l = Math.hypot(dir[0], dir[1], dir[2]); dir = dir.map((v) => v / l);
      const root = [f.x + (d[5] - 0.5) * 0.9, f.y - 0.12 * len * dir[1], f.z - 0.12 * len * dir[2]], tip = [root[0] + dir[0] * len, root[1] + dir[1] * len, root[2] + dir[2] * len];
      const clear = Math.min(P.routeDistance(root[0], root[1], root[2]), P.routeDistance(tip[0], tip[1], tip[2])) - 0.5 * thick;
      if (clear < 4) continue;
      minClear = Math.min(minClear, clear);
      list.push({ root, dir, len, thick, colour: COLOURS[Math.min(2, Math.floor((hue + 0.35 * d[1]) % 1 * 3))] });
    }
  }
  if (!list.length) return { mesh: null, owned: [], triangles: 0, count: 0, minClear };
  const form = crystalForm(THREE), n = list.length, A = new Float32Array(3 * n), V = new Float32Array(4 * n), mesh = new THREE.InstancedMesh(form, material, n), m4 = new THREE.Matrix4();
  list.forEach((c, i) => {
    // the prism's own frame: its axis along dir, two unit vectors square to it
    const up = Math.abs(c.dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], ex = [c.dir[1] * up[2] - c.dir[2] * up[1], c.dir[2] * up[0] - c.dir[0] * up[2], c.dir[0] * up[1] - c.dir[1] * up[0]], el = Math.hypot(ex[0], ex[1], ex[2]);
    for (let k = 0; k < 3; k++) ex[k] /= el;
    const ez = [ex[1] * c.dir[2] - ex[2] * c.dir[1], ex[2] * c.dir[0] - ex[0] * c.dir[2], ex[0] * c.dir[1] - ex[1] * c.dir[0]], t = c.thick, L = c.len;
    m4.set(ex[0] * t, c.dir[0] * L, ez[0] * t, c.root[0], ex[1] * t, c.dir[1] * L, ez[1] * t, c.root[1], ex[2] * t, c.dir[2] * L, ez[2] * t, c.root[2], 0, 0, 0, 1);
    mesh.setMatrixAt(i, m4); A.set(c.colour, 3 * i); V.set([1, 1 / L, 0, 0], 4 * i);
  });
  form.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); form.setAttribute('aB', new THREE.InstancedBufferAttribute(A, 3)); form.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 4));
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'valley-sweets-rock-candy';
  return { mesh, owned: [form, mesh], triangles: n * form.userData.triangles, count: n, minClear };
}
