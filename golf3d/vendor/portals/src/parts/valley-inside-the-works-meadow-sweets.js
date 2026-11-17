// valley-inside-the-works, the meadow: THE SWEETS AS PLANTS (built). Candy canes, great lollipops, toadstools and
// gumdrops stand in the meadow as its tallest and brightest plants. Where each stands is the deal's (the sweets'
// deal file); what each is made of is the forms' and the material's (their own files).
// Each kind is ONE instanced mesh of one form, all four in one material: four draw calls, and at most 108 x 190 +
// 142 x 132 + 97 x 128 + 450 x 40 = 69,680 triangles when all stand in the picture (the deal's own counts).
// A sweet is drawn whole at any range. One is put away only when it lies behind the flown line's own point for good
// (the line's z falls all the way and the lens looks up the valley): once the line's point is 6 m and the sweet's own
// reach past it. A kind's instances stand in the order in which they go, so a place of the line draws the first so
// many of each mesh.
import { sweetsMaterial } from './valley-inside-the-works-meadow-sweets-mat.js';
import { caneForm, lollipopForm, toadstoolForm, gumdropForm } from './valley-inside-the-works-meadow-sweets-forms.js';

const NAMES = ['canes', 'lollipops', 'toadstools', 'gumdrops'];

// buildSweets(THREE, look, deal) -> { object, owned, material, counts, triangles, drawCalls, show(z, apply), update(time) }
// show(z): draws what a place of the flown line (its z) has not yet behind it, and says what that costs: [triangles, draw calls]
export function buildSweets(THREE, look, deal) {
  const object = new THREE.Group(), material = sweetsMaterial(THREE, look), owned = [material], kinds = [], m4 = new THREE.Matrix4();
  object.name = 'valley-sweets';
  [caneForm, lollipopForm, toadstoolForm, gumdropForm].forEach((make, kind) => {
    // (the z at which a sweet goes: its own, less its reach in plan and 6 m)
    const list = deal.list.filter((c) => c.kind === kind).map((c) => ({ c, goes: c.z - Math.max(...c.solid.map((s) => Math.hypot(s[0] - c.x, s[1] - c.z) + s[2])) - 6 }));
    const n = list.length; if (!n) return;
    list.sort((a, b) => a.goes - b.goes);
    const form = make(THREE), A = new Float32Array(3 * n), B = new Float32Array(3 * n), V = new Float32Array(4 * n), mesh = new THREE.InstancedMesh(form, material, n);
    list.forEach(({ c }, i) => {
      const F = c.F, s = c.s, sy = c.sy;
      // the thing's frame (how it leans), its size, its foot's place; its turn about its own axis is the material's (aV)
      m4.set(F[0][0] * s, F[1][0] * sy, F[2][0] * s, c.x, F[0][1] * s, F[1][1] * sy, F[2][1] * s, c.y, F[0][2] * s, F[1][2] * sy, F[2][2] * s, c.z, 0, 0, 0, 1);
      mesh.setMatrixAt(i, m4); A.set(c.A, 3 * i); B.set(c.B, 3 * i); V.set([c.L, 1 / s, c.turn, c.speed], 4 * i);
    });
    form.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); form.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
    form.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 4));
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'valley-sweets-' + NAMES[kind];
    object.add(mesh); owned.push(form, mesh);
    kinds.push({ mesh, goes: list.map((e) => e.goes), each: form.userData.triangles });
  });
  const show = (z, apply = true) => {
    let triangles = 0, calls = 0;
    for (const k of kinds) {
      let lo = 0, hi = k.goes.length;      // how many of this kind the line's point at z has not yet behind it
      while (lo < hi) { const mid = (lo + hi) >> 1; if (k.goes[mid] <= z) lo = mid + 1; else hi = mid; }
      if (apply) { k.mesh.count = lo; k.mesh.visible = lo > 0; }
      triangles += lo * k.each; if (lo) calls++;
    }
    return [triangles, calls];
  };
  const all = show(1e9, false);
  return {
    object, owned, material, counts: deal.counts, triangles: all[0], drawCalls: all[1], show,
    update(time) { material.userData.uniforms.uSweetTime.value = time; },
  };
}
