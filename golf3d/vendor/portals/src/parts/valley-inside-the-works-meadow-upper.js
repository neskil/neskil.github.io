// valley-inside-the-works, the meadow: THE UPPER VALLEY'S PLANTING. Above the scar the lens flies 10 to 20 m over the
// meadow and sees it from some 20 m ahead to the valley's head, so here every plant stands in its real form as far as
// it can be told: tall hay in clumps over a sward of grass tufts, cow parsley, foxgloves, drifts of daisy and clover,
// bluebells in the trees' shade, and yellow flags and reeds down both banks of the upper river. It is full within 16 m of the flown line in plan and
// thins out to 34 m, thickest on the banks and where the line is lowest; beyond that the sward of tufts goes on at half
// its count from wall to wall, with a scatter of the tall kinds, so that no lawn shows anywhere in the picture.
// THINNING BY DISTANCE. A stretch's plants of one kind lie in a dealt order; the n-th is drawn out to a range of its own
// (the material's mode 3: D0 + D1 / (1 + n / K) metres, 150 at most), growing from its root as the eye comes inside
// it, and the stretch's count is cut to those in reach of where the flown line's own point stands (never the lens).
// It is drawn by that law alone from every place of the line, the lower valley's too (the upper meadow shows through
// the fall's notch and over the valley's sides). The plants at the scar's very top lie first in their stretch's order,
// so that the skyline's fringe is what a far place draws first.
// AS RICH AS THE FIRST FLOWER BED: within 12 m of the flown line (thinning to 26 m) each flower has broad drifts of its
// own (rich: how thick it stands at their heart), whatever the field says; the plain tufts pay for them (a wider
// lattice). NO STRETCH IS ONE GREEN: the grass lies in sweeps of lighter and darker green (a tint by place), the hay
// stands in broad patches of seed heads, and two MOWN PATHS wind up the valley, one on either hand of the line: on a
// path nothing tall grows, and the tufts are cut short and pale.
// CLEAR AIR: counted as in the lower meadow (top and mid-height against the plan's routeDistance, less the plant's
// breadth and lean); one that would come within 2.9 m is left out. Streams: 'meadow-upper-' + the kind's name.
import * as P from './valley-inside-the-works-plan.js';
import { CH, routeAt, bare, smooth } from './valley-inside-the-works-meadow-field.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';
import { sugarMaterial } from './valley-inside-the-works-meadow-sugar.js';

export const UP_TOP = -44.5, UP_SEG = 30, UP_END = -226, UP_MAX = 150;      // (UP_MAX: the furthest any of it is drawn from)
// a kind's law up here: its lattice (m), how thick it stands at a drift's heart, the field's channel it keeps to, the
// least of it anywhere (base), its own drifts beside the line (rich), its scatter beyond the band (far), how far it gives way in a tree's shade (shade),
// whether it is a green thing that the scar's rim darkens (green), and its reach [D0, D1, K, the metres it grows over]
const LAWS = [
  { name: 'hay', cell: 1.55, peak: 0.95, chan: CH.tall, clump: 1, far: 0.18, green: 1, reach: [34, 150, 80, 10] },
  { name: 'tuft', cell: 1.0, peak: 0.8, chan: CH.open, far: 0.42, shade: 0.35, green: 1, low: 1, reach: [40, 150, 300, 10] },
  { name: 'daisy', cell: 0.9, peak: 0.8, chan: CH.daisy, rich: 0.55, low: 1, reach: [26, 100, 45, 8] },
  { name: 'clover', cell: 0.95, peak: 0.7, chan: CH.clover, rich: 0.5, low: 1, reach: [26, 100, 35, 8] },
  { name: 'parsley', cell: 2.0, peak: 0.85, chan: CH.parsley, base: 0.22, rich: 0.35, far: 0.12, reach: [40, 110, 16, 12] },
  { name: 'foxglove', cell: 1.4, peak: 0.85, chan: CH.fox, base: 0.05, rich: 0.4, far: 0.1, reach: [40, 110, 11, 12] },
  { name: 'bluebell', cell: 1.1, peak: 0.9, chan: CH.shade, far: 1, rich: 0.3, low: 1, reach: [26, 90, 30, 8] },
  { name: 'iris', cell: 1.0, peak: 0.95, chan: CH.wet, bank: 1, green: 1, reach: [46, 150, 30, 10] },
  { name: 'reed', cell: 1.2, peak: 0.9, chan: CH.wet, bank: 1, green: 1, reach: [50, 160, 30, 12] },
];

// THE MOWN PATHS: how far a place lies from the nearer of the two (each winds beside the flown line, by the plan's line and z alone)
const pathGap = (x, z) => { const xr = routeAt(z)[0]; return Math.min(Math.abs(x - xr - 13 - 5 * Math.sin(z / 19)), Math.abs(x - xr + 15 + 4 * Math.sin(z / 23 + 1.3))); };
// one kind's deal: every candidate's dice first, then the tests. out[stretch] = [[order, x, y, z, yaw, sx, sy, sz, r, g, b], ...]
async function dealUp(ctx, o, field, L, K, dens, out, nth = 0) {
  const rng = o.rngFor('meadow-upper-' + L.name), cell = L.cell / Math.sqrt(dens), top = K.form.userData.top * (K.tallK || 1), rad = K.form.userData.rad;
  let n = 0, minClear = 1e9, left = 0, count = 0;
  for (let z = UP_TOP; z > UP_END; z -= cell) {
    const line = routeAt(z), xr = line[0];
    for (let x = -79; x < 79; x += cell) {
      const jx = rng(), jz = rng(), keep = rng(), sz = rng(), yaw = rng() * 6.2832, tn = rng(), ord = rng();
      if (++n % 400 === 0) await ctx.yield();
      const px = x + (jx - 0.5) * cell, pz = z + (jz - 0.5) * cell;
      if (bare(px, pz)) continue;
      const lat = Math.abs(px - xr);
      // (a flower's own broad drifts beside the line: a noise of its own for each kind, so the colours take turns)
      const drift = L.rich ? L.rich * (1 - smooth(12, 26, lat)) * smooth(-0.25, 0.25, field.noise.n2(px / 17 + 31.7 * nth, pz / 23 - 12.9 * nth)) : 0;
      let want = L.peak * Math.max(field.at(L.chan, px, pz), L.base || 0, drift);
      if (L.bank) want *= (K.where ? K.where(px, pz) : 1) * (1 - smooth(40, 56, lat));
      else want *= Math.max(1 - smooth(16, 34, lat), L.far || 0);
      if (keep >= want * 4.6) continue;                       // (nothing below can make it more than 4.6 times as likely)
      const mown = pathGap(px, pz) < 1.5;
      if (mown && !L.low) continue;                           // (nothing tall on a mown path)
      if (field.wallDistance(px, pz) < 1.5) continue;         // (off the field walls and the sweets)
      const ground = dryHeight(px, pz);
      if (!L.bank) {
        want *= Math.min((1 + 0.9 * (1 - smooth(1.5, 8, P.bankDistance(px, pz)))) * (1.15 - 0.45 * smooth(11, 21, line[1] - ground)), 1.7);
        // (the hay: in clumps, and the clumps in broad patches of seed heads)
        if (L.clump) want *= (0.4 + 1.2 * smooth(-0.15, 0.45, field.noise.n2(px / 4.7 + 9.1, pz / 4.7 - 3.3))) * (0.5 + 1.15 * smooth(-0.1, 0.4, field.noise.n2(px / 21 + 4.4, pz / 27 + 8.1)));
        if (K.shun) want *= 1 - (L.shade || 0.85) * field.at(CH.shade, px, pz);
      }
      if (keep >= want) continue;
      const y = ground - 0.03, s = K.size[0] + (K.size[1] - K.size[0]) * sz * sz, h = top * s;
      const d = Math.min(P.routeDistance(px, y + h, pz), P.routeDistance(px, y + 0.6 * h, pz)) - 1.8 * rad * s - 0.09 * h;   // (1.8: its breadth far off)
      if (d < 2.9) { left++; continue; }
      if (d < minClear) minClear = d;
      const c = K.tint(tn), seg = Math.max(0, Math.floor((UP_TOP - pz) / UP_SEG)), sy = s * (K.tallK || 1) * (L.green && pz > -50 ? 0.45 + 0.55 * tn : 1) * (mown && L.green ? 0.3 : 1);      // (the rim's grass stands at every height up to its own; a path's is mown)
      // (the sweeps: a green thing is lighter and yellower here, darker and bluer there; a mown path is pale)
      if (L.green) { const k = mown ? 1.25 : smooth(-0.4, 0.4, field.noise.n2(px / 41 + 17.3, pz / 57 - 8.8)); c[0] *= 0.7 + 0.75 * k; c[1] *= 0.76 + 0.5 * k; c[2] *= 0.95 - 0.2 * k; }
      // (the grass of the scar's very edge, seen from below against the light, keeps to the meadow's deep green: drier and darker toward the rim)
      if (L.green && pz > -50) { const e = smooth(-50, -46.5, pz); c[0] *= 1 - 0.12 * e; c[1] *= 1 - 0.4 * e; c[2] *= 1 - 0.3 * e; }
      (out[seg] || (out[seg] = [])).push([ord - (pz > -52 ? 1 : 0), px, y, pz, yaw, s, sy, s, c[0], c[1], c[2]]); count++;
    }
  }
  return { minClear, left, count };
}

export async function plantUpper(ctx, o, field, kinds, mats, loForms, meshesFrom) {
  const THREE = o.THREE, group = new THREE.Group(), meshes = [], stats = {}, owned = [], byName = {};
  group.name = 'valley-upper-planting';
  for (const k of kinds) byName[k.name] = k;
  // the sward's own filler: a tuft of long grass, taller than it is wide, in the hay's greens
  byName.tuft = { form: loForms.tuft, size: [0.6, 1.0], tallK: 2.3, shun: true, tint: (t) => [0.06 + 0.03 * t, 0.17 + 0.07 * t, 0.03 + 0.015 * t] };
  let minClear = 1e9;
  for (const L of LAWS) {
    const K = byName[L.name], out = {}, r = await dealUp(ctx, o, field, L, K, mats.dens, out, LAWS.indexOf(L));
    stats[L.name] = r; minClear = Math.min(minClear, r.minClear);
    await ctx.yield();
    const mat = sugarMaterial(THREE, mats.shared, 3, L.reach), lists = {};
    owned.push(mat);
    for (const seg of Object.keys(out)) {
      const a = out[seg].sort((p, q) => p[0] - q[0]), flat = [];
      for (const p of a) for (let i = 1; i < 11; i++) flat.push(p[i]);
      lists[seg] = flat;
    }
    await ctx.yield();
    for (const m of meshesFrom(THREE, lists, K.form, mat, UP_SEG, 'upper-' + L.name, group)) {
      const u = m.userData;
      u.z1 = UP_TOP - u.seg * UP_SEG; u.z0 = u.z1 - UP_SEG; u.full = m.count; u.law = L.reach; u.each = K.form.userData.triangles;
      meshes.push(m);
    }
    await ctx.yield();
  }
  // what a place of the flown line draws: a stretch ahead of it (or under it), cut to the plants in reach of its near
  // edge (the others' own material has drawn them in to nothing there); thin (0..1) is the part's own even thinning,
  // set once so that every view stands inside the budget
  let thin = 1;
  const show = (eyeZ, apply = true) => {
    let t = 0, c = 0;
    for (const m of meshes) {
      const u = m.userData, d0 = Math.max(0, eyeZ - u.z1), L = u.law;
      let k = 0;
      if (u.z0 < eyeZ + 4 && d0 < UP_MAX) k = d0 <= L[0] ? u.full : Math.min(u.full, Math.ceil(L[2] * (L[1] / (d0 - L[0]) - 1)));
      k = Math.max(0, Math.min(k, Math.floor(u.full * thin)));
      if (apply) { m.count = k; m.visible = k > 0; }
      if (k > 0) { t += k * u.each; c++; }
    }
    return [t, c];
  };
  return { object: group, show, setThin(f) { thin = Math.min(Math.max(f, 0.05), 1); return thin; }, minClear, stats, owned, meshes: meshes.length };
}
