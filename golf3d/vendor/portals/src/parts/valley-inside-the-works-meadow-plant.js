// valley-inside-the-works, the meadow: THE PLANTING. The meadow is dealt as a meadow grows: each kind on its own
// loose lattice, kept where the field says its drift lies (so plants stand in drifts and patches, never as an even
// scatter and never in rows), each with its own size, turn and tint.
//   NEAR THE FLOWN LINE (15.5 m either side, from behind the entry to the scar's foot) every plant stands in its real
//   form; the same plant has a far form (a disc, a puff, a tuft) that takes over 15 to 20 m from the eye. Out to 30 m
//   either side the meadow stands in far forms only, thinner. Beyond, see the far piece; above the scar, the upper piece.
//   CLEAR AIR: every plant's top, with its lean, is counted against the plan's routeDistance; one that would come within
//   2.9 m is cut shorter until it does not, or left out. The smallest distance that stands is handed back (minClear).
//   BEHIND THE ENTRY (the planting begins 16 m behind it) only the low kinds stand within 8.5 m of the straight the
//   plan lays there (by the plan's routeDistance): clover, daisy, hay and the sward; no reed, flag or cow parsley.
//   No plant stands within 1.4 m of a field wall's line, nor inside a sweet's cover or within a hand of it (the
//   field's wallDistance answers for both: see the part's own file).
//   THE GREAT PIPE'S SIGHT: a plant whose blades would stand over the field file's wedge is held under 4 m there
//   (the tallest reeds and foxgloves are the only ones it touches).
// Streams of the seed: 'meadow-' + the kind's name deals that kind's places; look.density scales every count (by the part's own law, mats.dens).
import * as P from './valley-inside-the-works-plan.js';
import { CH, routeAt, bare, sightGap, SIGHT } from './valley-inside-the-works-meadow-field.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';

// (Z_TOP, the table's 16 m and its 16 places, Z_HI_END and NEAR are typed again in the sugar material's far forms' law: the two move together)
export const HI_SEG = 12, LO_SEG = 24, Z_TOP = 166, Z_HI_END = -36, Z_LO_END = -44, NEAR = 15.5, REACH = 30;
// WHEN A STRETCH IS DRAWN, for a place z of the flown line's own point: real forms from 3 m behind it to 20.5 m ahead,
// far forms from 4 m behind to 43 m ahead (beyond those ranges the material has drawn them in to nothing). While the
// line's point stands at the entry, the stretches behind it are drawn too: the lens that looks in through the way
// in flies the straight behind the entry, and one of a plant's two forms must stand for it.
const atEntry = (z) => z > P.ENTRY.z - 0.5;
export const hiOn = (z0, z1, z) => (z0 < z + 3 || atEntry(z)) && z1 > z - 20.5;
export const loOn = (z0, z1, z) => (z0 < z + 4 || atEntry(z)) && z1 > z - 43;
export const routeTable = () => { const a = new Float32Array(16); for (let i = 0; i < 16; i++) a[i] = routeAt(Z_TOP - 16 * i)[0]; return a; };
const tableX = (t, z) => { const f = Math.min(Math.max((Z_TOP - z) / 16, 0), 14.999), i = Math.floor(f); return t[i] + (t[i + 1] - t[i]) * (f - i); };

// One kind's deal. kind = { name, cell, chan, peak, form (geometry), size [lo, hi], tint, far(plant, push), ... }
// push(list, x, y, z, yaw, sx, sy, sz, r, g, b)
export async function dealKind(ctx, o, field, kind, table, out) {
  const rng = o.rngFor('meadow-' + kind.name), dens = out.dens, cell = kind.cell / Math.sqrt(dens);
  const top = kind.form.userData.top, rad = kind.form.userData.rad;
  let n = 0, minClear = 1e9, cut = 0, left = 0;
  for (let z = Z_TOP; z > (kind.nearOnly ? Z_HI_END : Z_LO_END); z -= cell) {
    const xr = routeAt(z)[0];
    for (let x = xr - REACH; x < xr + REACH; x += cell) {
      // every candidate's dice first, then the tests
      const jx = rng(), jz = rng(), keep = rng(), sz = rng(), yaw = rng() * 6.2832, tn = rng(), far = rng();
      if (++n % 400 === 0) await ctx.yield();
      const px = x + (jx - 0.5) * cell, pz = z + (jz - 0.5) * cell;
      if (bare(px, pz)) continue;
      const lat = Math.abs(px - tableX(table, pz)), hi = pz >= Z_HI_END && pz <= Z_TOP && lat <= NEAR;
      if (!hi && Math.abs(px - xr) > REACH) continue;
      let want = kind.peak * (kind.chan < 0 ? 1 : field.at(kind.chan, px, pz));
      if (kind.shun) want *= 1 - 0.85 * field.at(CH.shade, px, pz);
      if (kind.where) want *= kind.where(px, pz);
      if (!hi) want *= kind.thin;
      if (keep >= want) continue;
      const y = dryHeight(px, pz) - 0.03;
      let s = kind.size[0] + (kind.size[1] - kind.size[0]) * sz * sz;
      // (the great pipe's sight: a plant whose blades would stand over its wedge is held 0.3 m under SIGHT.tall)
      if (top * s > SIGHT.tall - 0.3 && sightGap(px, pz) < rad * s) s = (SIGHT.tall - 0.3) / top;
      if (pz > P.ENTRY.z && !kind.low && P.routeDistance(px, Math.min(y + top * s, P.ENTRY.y), pz) < 8.5 + rad * s + 0.09 * top * s) continue;      // (the tube behind the entry: its breadth and its lean are counted)
      if (field.wallDistance(px, pz) < 1.4) continue;      // (off the field walls and the sweets)
      // clear air: the top at its furthest lean against the flown line
      if (lat < 12) {
        let ok = false;
        for (let tries = 0; tries < 5; tries++) {
          const h = top * s, d = Math.min(P.routeDistance(px, y + h, pz), P.routeDistance(px, y + 0.6 * h, pz)) - rad * s - 0.09 * h;
          if (d >= 2.9) { ok = true; if (d < minClear) minClear = d; break; }
          s *= 0.82; cut++;
        }
        if (!ok) { left++; continue; }
      }
      const c = kind.tint(tn);
      if (hi) { const seg = Math.max(0, Math.floor((Z_TOP - pz) / HI_SEG)); (out.hi[kind.name][seg] || (out.hi[kind.name][seg] = [])).push(px, y, pz, yaw, s, s, s, c[0], c[1], c[2]); }
      kind.far({ x: px, y, z: pz, yaw, s, c, hi, far }, out.push);
    }
  }
  return { minClear, cut, left };
}

// instanced meshes from the lists: one mesh for each kind in each stretch of the valley
export function meshesFrom(THREE, lists, geometry, material, segLen, name, group) {
  const made = [], m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (const key of Object.keys(lists)) {
    const a = lists[key], count = a.length / 10; if (!count) continue;
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    for (let i = 0; i < count; i++) {
      const o = i * 10, c = Math.cos(a[o + 3]), s = Math.sin(a[o + 3]), sx = a[o + 4], sy = a[o + 5], sz = a[o + 6];
      m4.set(c * sx, 0, s * sz, a[o], 0, sy, 0, a[o + 1], -s * sx, 0, c * sz, a[o + 2], 0, 0, 0, 1);
      mesh.setMatrixAt(i, m4); mesh.setColorAt(i, col.setRGB(a[o + 7], a[o + 8], a[o + 9]));
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.name = name + '-' + key; mesh.userData.seg = +key; mesh.userData.z1 = Z_TOP - (+key) * segLen; mesh.userData.z0 = mesh.userData.z1 - segLen;
    mesh.userData.triangles = count * geometry.userData.triangles;
    mesh.computeBoundingSphere(); group.add(mesh); made.push(mesh);
  }
  return made;
}

// THE NEAR MEADOW, whole: deals every kind, joins lists until the draw calls fit, makes the meshes, and says which
// stretches are drawn for a place of the flown line's own point (hiOn, loOn above).
// THE BUDGET is held at the deal. A deal whose heaviest view would stand outside the triangles handed in is dealt
// again thinner, twice at most: the third deal stands as it falls, and a budget of nought or less is no budget.
// THE DRAW CALLS are held at the deal too: while some place of the line would need more of the planting's meshes
// than the cap, the smallest list in that view which has a neighbour of its own kind there is joined to it, and the
// two stretches then come and go as one. Nothing is hidden by where the line is.
const PLACES = []; for (let z = 152; z > -232; z -= 2) PLACES.push(z);      // the places of the line that are counted
export async function plantMeadow(ctx, o, field, kinds, mats, loForms, budget = 0, cap = 0) {
  const THREE = o.THREE, group = new THREE.Group(), table = mats.shared.uRX.value, stats = {};
  group.name = 'valley-planting';
  let items = [], minClear = 1e9, dens = mats.dens, deals = 0, joined = 0;
  const on = (it, z) => (it.hi ? hiOn(it.z0, it.z1, z) : loOn(it.z0, it.z1, z));
  for (let pass = 0; pass < 3; pass++) {
    const lo = { disc: {}, puff: {}, tuft: {} }, hi = {}; minClear = 1e9; deals++; joined = 0;
    const out = { hi, dens, push(form, x, y, z, yaw, sx, sy, sz, r, g, b) { const seg = Math.max(0, Math.floor((Z_TOP - z) / LO_SEG)); (lo[form][seg] || (lo[form][seg] = [])).push(x, y, z, yaw, sx, sy, sz, r, g, b); } };
    for (const kind of kinds) {
      hi[kind.name] = {};
      const r = await dealKind(ctx, o, field, kind, table, out); stats[kind.name] = r; minClear = Math.min(minClear, r.minClear);
      await ctx.yield();
    }
    // every list is one mesh to be: its kind, its stretch's ends, what a plant of it costs
    items = [];
    for (const kind of kinds) for (const key of Object.keys(hi[kind.name])) items.push({ name: 'near-' + kind.name, key, list: hi[kind.name][key], hi: true, geo: kind.form, mat: mats.hi, len: HI_SEG, z1: Z_TOP - (+key) * HI_SEG, z0: Z_TOP - (+key + 1) * HI_SEG });
    for (const f of ['disc', 'puff', 'tuft']) for (const key of Object.keys(lo[f])) items.push({ name: 'far-' + f, key, list: lo[f][key], hi: false, geo: loForms[f], mat: mats.lo, len: LO_SEG, z1: Z_TOP - (+key) * LO_SEG, z0: Z_TOP - (+key + 1) * LO_SEG });
    const cost = (it) => it.list.length / 10 * it.geo.userData.triangles;
    for (let guard = 0; guard < 300 && cap > 0; guard++) {
      let worst = 0, n = 0;
      for (const z of PLACES) { let c = 0; for (const it of items) if (on(it, z)) c++; if (c > n) { n = c; worst = z; } }
      if (n <= cap) break;
      const seen = items.filter((it) => on(it, worst)).sort((p, q) => cost(p) - cost(q));
      let a = null, b = null;
      for (const it of seen) { b = seen.filter((q) => q !== it && q.name === it.name).sort((p, q) => Math.abs(p.z1 - it.z1) - Math.abs(q.z1 - it.z1))[0]; if (b) { a = it; break; } }
      if (!a) break;
      b.list = b.list.concat(a.list); b.z0 = Math.min(a.z0, b.z0); b.z1 = Math.max(a.z1, b.z1); items.splice(items.indexOf(a), 1); joined++;
      if (guard % 2 === 1) await ctx.yield();
    }
    await ctx.yield();
    let heavy = 0;
    for (const z of PLACES) { let t = 0; for (const it of items) if (on(it, z)) t += cost(it); if (t > heavy) heavy = t; }
    if (!(budget > 0) || heavy <= budget || pass === 2) break;
    dens *= 0.96 * budget / heavy;
    await ctx.yield();
  }
  const meshes = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], m = meshesFrom(THREE, { [it.key]: it.list }, it.geo, it.mat, it.len, it.name, group)[0];
    if (m) { m.userData.z0 = it.z0; m.userData.z1 = it.z1; m.userData.hi = it.hi; meshes.push(m); }
    if (i % 12 === 11) await ctx.yield();
  }
  const show = (eyeZ) => {
    let tris = 0, calls = 0;
    for (const m of meshes) { m.visible = on(m.userData, eyeZ); if (m.visible) { tris += m.userData.triangles; calls++; } }
    return [tris, calls];
  };
  // the heaviest view, counted over the whole flown line
  let triangles = 0, drawCalls = 0;
  for (const z of PLACES) { const [t, c] = show(z); if (t > triangles) triangles = t; if (c > drawCalls) drawCalls = c; }
  show(P.ENTRY.z);
  return { object: group, show, triangles, drawCalls, minClear, stats, counts: { meshes: meshes.length, joined, deals, dens: +dens.toFixed(3) } };
}
