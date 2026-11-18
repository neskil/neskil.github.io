// valley-inside-the-works, the meadow: THE REST OF THE VALLEY, at the scale it is seen from. Beyond the planting by the
// flown line the meadow is the turf's own drift-coloured map and, standing on it, cheap forms that are drawn whole at
// any range: a fringe of reeds and yellow flags down both banks of the whole river, a tall border of cow parsley,
// foxgloves and hay along the foot of both long walls, ferns and small flowers on the scar's ledges. And THE FIELD
// WALLS: dry-stone walls dealt by the plan, one to each 40 m of the valley, each running whole from the foot of a
// long wall to the river's bank or to 16 m of the flown line (see dealWalls).
// Clear air: a fringe plant near the flown line is cut down or left out by the same count as the planting's (2.9 m);
// BEHIND THE ENTRY none stands with its top inside the tube of 8.5 m about the straight the plan lays there.
// THE GREAT PIPE'S SIGHT (the field file's wedge): on it a reed of the fringe stands no taller than 3.3 m, and a field
// wall ends 1.2 m short of it.
// Streams of the seed: 'meadow-far' the river's fringe, 'meadow-far-border' the long walls' borders, 'meadow-far-scar'
// the scar's ferns and grass; 'meadow-walls-lower' and 'meadow-walls-upper' the field walls' places in each valley,
// 'meadow-wall-stones-' + a wall's name the stones of that wall.
import * as P from './valley-inside-the-works-plan.js';
import { CH, bare, sightGap, SIGHT } from './valley-inside-the-works-meadow-field.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';

export async function farMeadow(ctx, o, field, mats, loForms, scarSpots, meshesFrom) {
  const THREE = o.THREE, group = new THREE.Group(), rng = o.rngFor('meadow-far'), rb = o.rngFor('meadow-far-border'), rs = o.rngFor('meadow-far-scar');
  const LL = { tuft: [[], [], []], disc: [[], [], []], puff: [[], [], []] }, L = { tuft: null, disc: null, puff: null };      // [the lower valley down to z 30, from there to the scar's top, the upper valley]
  const zone = (z) => { const i = z > 30 ? 0 : z > -44.5 ? 1 : 2; L.tuft = LL.tuft[i]; L.disc = LL.disc[i]; L.puff = LL.puff[i]; };
  group.name = 'valley-far';
  let minClear = 1e9;
  const clear = (x, y, z, h) => {
    const lean = 0.12 * h + 0.5, d = P.routeDistance(x, y + h, z) - lean;
    if (z > P.ENTRY.z && P.routeDistance(x, Math.min(y + h, P.ENTRY.y), z) < 8.5 + lean) return false;      // (the tube behind the entry)
    if (d < minClear && d >= 2.9) minClear = d;
    return d >= 2.9;
  };
  // the river's fringe: reeds where the bank's own noise says reeds, yellow flags elsewhere
  for (let z = 208, n = 0; z > P.HEAD_Z + 2; z -= 2.2) {
    for (const side of [-1, 1]) {
      const jz = rng(), jd = rng(), sz = rng(), yaw = rng() * 6.2832, kind = rng(), keep = rng();
      const pz = z + (jz - 0.5) * 2, x = P.riverX(pz) + side * (P.riverHalfWidth(pz) + 1.05 + 1.6 * jd);      // (behind the shore: a metre and more off the bank line)
      if (++n % 200 === 0) await ctx.yield();
      if (bare(x, pz) || keep > 0.25 + 0.75 * field.at(CH.wet, x, pz) || field.wallDistance(x, pz) < 1.4) continue;      // (... off the field walls and the sweets)
      const y = dryHeight(x, pz) - 0.05, reed = field.noise.n2(x / 8.5 + 3.3, pz / 8.5 - 7.1) < -0.05;
      zone(pz);
      let s = 0.8 + 0.5 * sz, h = (reed ? 3.9 : 2.7) * s;
      // (the great pipe's sight: on its wedge a reed stands no taller than 3.3 m, its plume with it under SIGHT.tall)
      if (h > SIGHT.tall - 0.7 && sightGap(x, pz) < 1.5) { s *= (SIGHT.tall - 0.7) / h; h = SIGHT.tall - 0.7; }
      if (!clear(x, y, pz, h)) { s *= 0.6; h *= 0.6; if (!clear(x, y, pz, h)) continue; }
      L.tuft.push(x, y, pz, yaw, 1.1 * s, h, 1.1 * s, 0.055, 0.19, 0.06);
      if (reed) L.puff.push(x, y + 0.86 * h, pz, yaw, 0.14 * s, 0.24 * h, 0.14 * s, 0.36, 0.25, 0.11);
      else if (kind < 0.8) L.disc.push(x + 0.2, y + 0.94 * h, pz, yaw, 0.34 * s, 0.34 * s, 0.34 * s, 0.66, 0.52, 0.06);
    }
  }
  // the borders at the foot of the two long walls: the tallest things of the meadow stand where it stops
  for (let z = 206, n = 0; z > -226; z -= 1.7) {
    for (const side of [-1, 1]) {
      const jz = rb(), jd = rb(), sz = rb(), yaw = rb() * 6.2832, kind = rb(), keep = rb(), tn = rb();
      const pz = z + (jz - 0.5) * 1.7, x = side * (77.7 - 5.2 * jd * jd);      // (from the kerb of the shed's gutter, 2 m off the brick, inward)
      if (++n % 200 === 0) await ctx.yield();
      if (bare(x, pz) || keep > 0.85 || field.wallDistance(x, pz) < 1.6) continue;      // (... off the field walls and the sweets)
      const y = dryHeight(x, pz) - 0.05, s = 0.8 + 0.5 * sz, fox = field.at(CH.fox, x, pz), par = field.at(CH.parsley, x, pz);
      zone(pz);
      L.tuft.push(x, y, pz, yaw, 1.3 * s, 1.5 * s, 1.3 * s, 0.06 + 0.02 * tn, 0.18 + 0.04 * tn, 0.035);
      if (kind < 0.42 + 0.3 * (par - fox)) for (let u = 0; u < 3; u++) { const a = yaw + u * 2.1; L.disc.push(x + Math.cos(a) * 0.6 * s, y + (2.5 + 0.5 * (u === 0)) * s, pz + Math.sin(a) * 0.6 * s, a, 0.46 * s, 0.3 * s, 0.46 * s, 0.6, 0.61, 0.52); }
      else if (kind < 0.8) L.puff.push(x, y + 1.5 * s, pz, yaw, 0.22 * s, 2.3 * s, 0.22 * s, 0.5 + 0.15 * tn, 0.18, 0.42);
      else L.puff.push(x, y + 1.4 * s, pz, yaw, 0.11 * s, 0.8 * s, 0.11 * s, 0.42, 0.3, 0.11);
    }
  }
  // the scar: ferns and small flowers rooted on its ledges, along its rim and in its clefts (the scar's own spots);
  // few on the wet rock within 11 m of the fall's middle, and from there out the face is dressed, most thickly along its lip. ITS TOP EDGE is no even band: the long grass up there
  // stands in patches with bare stone between (a noise along the scar), short and long, in the meadow's own deep
  // greens with dry straw among them, with daisies, buttercups and clover standing in it; and at the rim itself
  // tufts hang over the edge and down the face.
  zone(-40);
  for (const f of scarSpots) {
    const keep = rs(), sz = rs(), yaw = rs() * 6.2832, kind = rs(), jx = rs() - 0.5, tn = rs(), fl = rs();
    const turf = f.kind === 3, ax = Math.abs(f.x), patch = 0.5 + 0.5 * field.noise.n2(f.x / 3.7 + 5.1, f.z / 2.9 + 9.3);
    if (keep > (turf ? (ax < 11 ? 0.1 : 0.2 + 0.75 * patch) : ax < 11 ? 0.12 : f.kind === 1 ? 0.7 : f.kind === 2 ? 0.7 : 0.5)) continue;
    const s = 0.55 + 0.6 * sz, x = f.x + jx * (turf ? 1.5 : 0.8);
    if (!clear(x, f.y, f.z, (turf ? 2.0 : 0.9) * s)) continue;
    // the grass's green: the turf's own, a little yellower or bluer plant by plant, and straw where the patch is thin
    const dry = Math.max(0, 0.75 - patch) * tn, gr = [0.04 + 0.025 * tn + 0.1 * dry, 0.115 + 0.045 * tn + 0.02 * dry, 0.026 + 0.012 * tn];
    if (turf) {
      const h = (0.7 + 1.3 * kind * kind) * s, z = f.z + (kind - 0.5) * 0.8;
      L.tuft.push(x, f.y - 0.04, z, yaw, (0.75 + 0.4 * tn) * s, h, (0.75 + 0.4 * tn) * s, gr[0], gr[1], gr[2]);
      if (fl < 0.14) L.disc.push(x + 0.2, f.y + 0.8 * h, z, yaw, 0.17, 0.17, 0.17, 0.62, 0.62, 0.57);
      else if (fl < 0.22) L.disc.push(x - 0.2, f.y + 0.7 * h, z, yaw, 0.12, 0.12, 0.12, 0.66, 0.52, 0.06);
      else if (fl < 0.3) L.puff.push(x, f.y + 0.55 * h, z, yaw, 0.1, 0.3, 0.1, 0.52, 0.17, 0.34);
      continue;
    }
    L.tuft.push(x, f.y - 0.02, f.z, yaw, 0.9 * s, (f.kind === 2 ? 1.1 : 0.75) * s, 0.9 * s, gr[0] * 1.1, gr[1] * 1.25, gr[2] * 1.4);
    if (f.kind === 1 && fl < 0.6) L.tuft.push(x + 0.3 * jx, f.y + 0.06, f.z + 0.42, yaw + 1.3, 0.8 * s, -(0.8 + 1.3 * fl) * s, 0.8 * s, gr[0], gr[1] * 0.95, gr[2]);      // (hanging over the edge)
    if (kind < 0.3) L.disc.push(x + 0.3, f.y + 0.55 * s, f.z, yaw, 0.16, 0.16, 0.16, 0.62, 0.62, 0.57);
    else if (kind < 0.5) L.puff.push(x - 0.2, f.y + 0.35 * s, f.z, yaw, 0.1, 0.3, 0.1, 0.52, 0.17, 0.34);
  }
  await ctx.yield();
  const made = [];
  for (const k of ['tuft', 'disc', 'puff']) made.push(...meshesFrom(THREE, { 0: LL[k][0], 1: LL[k][1], 2: LL[k][2] }, loForms[k], mats.still, 1, 'still-' + k, group));
  const of = (i) => { const a = made.filter((m) => m.userData.seg === i); return { meshes: a, triangles: a.reduce((s, m) => s + m.userData.triangles, 0), drawCalls: a.length }; };
  const n = (k) => (LL[k][0].length + LL[k][1].length + LL[k][2].length) / 10;
  return { object: group, zones: [of(0), of(1), of(2)], minClear, counts: { tuft: n('tuft'), disc: n('disc'), puff: n('puff') } };
}

// THE FIELD WALLS, DEALT BY THE PLAN. The valley is walked in even stretches of 40 m (the lower valley from the down
// wall to the pool, z 210 to -30; the upper valley from behind the scar's top to the head pool, z -52 to -212) and
// each stretch is dealt one wall from its valley's stream: its z, its side and its slant are drawn. A wall runs WHOLE
// from the tall border at the foot of the long wall on its side (6.5 m from the brick: the shed's gutter, stairs and
// doors keep that strip) toward the river, and ends 1.5 m short of the river's bank or, where the flown line comes
// first, 16 m from the line in plan (the plan's routeDistanceXZ, which counts the straight behind the entry: the
// band where every plant has its real form stays free of stone), or 1.2 m short of the great pipe's wedge (the
// field file: a wall with its copes stands over 4 m). A try's dice are drawn before its tests, six tries
// a stretch: a wall that would pass within 3.5 m of a column of the hall, within 7 m of the cream spring or within
// the first hawthorn's crown and 3 m, that would touch the scar or the head pool's end, or that would be shorter
// than 24 m, is not built; a stretch whose six tries all fail has no wall.
const WALL_EVERY = 40, WALL_KEEP = 16, WALL_X = 73.5;
// dealWalls(o, hero, rest) -> { lines, distance }. rest: a pause the caller hands in; it is taken between two
// stretches, when every die of the stretch is drawn, and draws none itself.
export async function dealWalls(o, hero, rest = async () => {}) {
  const lines = [];
  const column = (x, z) => { const k = Math.round((200 - z) / 20); for (const cx of P.COLUMN_X) if (Math.hypot(x - cx, z - P.columnZ(k)) < 3.5) return true; return false; };
  const deal = async (rng, zFrom, zTo, valley) => {
    for (let za = zFrom, n = 0; za - WALL_EVERY > zTo - 1e-6; za -= WALL_EVERY, n++) {
      let done = false;
      for (let t = 0; t < 6; t++) {
        const fz = rng(), sd = rng() < 0.5 ? -1 : 1, slant = (rng() - 0.5) * 0.18;
        if (done) continue;
        const z0 = za - WALL_EVERY * (0.2 + 0.6 * fz), x0 = sd * WALL_X, l = Math.hypot(1, slant), dx = -sd / l, dz = slant / l;
        let len = 0, bad = false;
        for (let d = 0; d < 160 && !bad; d += 0.5) {
          const x = x0 + dx * d, z = z0 + dz * d;
          if (P.bankDistance(x, z) < 1.5 || P.routeDistanceXZ(x, z) < WALL_KEEP || sightGap(x, z) < 1.2) break;
          bad = column(x, z) || (z < -30 && z > -52) || z < P.HEAD_Z + 5 || Math.hypot(x - P.CREAM.x, z - P.CREAM.z) < 7 || Math.hypot(x - hero.x, z - hero.z) < hero.crown + 3;
          len = d;
        }
        if (bad || len < 24) continue;
        const B = [x0 + dx * len, z0 + dz * len];
        lines.push({ A: [x0, z0], B, name: valley + '-' + n, zone: valley === 'upper' ? 2 : Math.min(z0, B[1]) > 30 ? 0 : 1 }); done = true;
      }
      await rest();
    }
  };
  await deal(o.rngFor('meadow-walls-lower'), P.SHED.zDown, -30, 'lower');
  await deal(o.rngFor('meadow-walls-upper'), -52, -212, 'upper');
  // how near a place is to a wall's line (metres: true within 20 m of a wall, and never under 20 further off)
  const distance = (x, z) => {
    let best = 1e9;
    for (const { A, B } of lines) {
      if (z > Math.max(A[1], B[1]) + 20 || z < Math.min(A[1], B[1]) - 20) continue;
      const dx = B[0] - A[0], dz = B[1] - A[1], t = Math.min(Math.max(((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz), 0), 1);
      best = Math.min(best, Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t));
    }
    return best;
  };
  return { lines, distance };
}

// THE WALLS' STONE: dry-stone, 4 m high, battered, with a row of upright cope stones; they wear the ground's
// limestone. One geometry for the walls handed in; each wall's stones come from that wall's own stream.
export async function fieldWalls(THREE, rngFor, lines, rest = async () => {}) {
  const pos = [], nor = [], col = [], gg = [];
  const tri = (a, b, c, k) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) { nor.push(nx / l, ny / l, nz / l); col.push(k, k, k * 0.97); gg.push(9, 1); }
  };
  const quad = (a, b, c, d, k) => { tri(a, b, c, k); tri(a, c, d, k); };
  for (const { A, B, name } of lines) {
    await rest();      // (the build's own pause between two walls: it draws no dice)
    const rng = rngFor('meadow-wall-stones-' + name);
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / len, dz = (B[1] - A[1]) / len, nx = -dz, nz = dx, N = Math.round(len / 2.2);
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = A[0] + (B[0] - A[0]) * t, z = A[1] + (B[1] - A[1]) * t;
      const y = dryHeight(x, z) - 0.3, h = 3.6 + 0.5 * rng(), wb = 0.95, wt = 0.6, k = 0.82 + 0.2 * rng();
      const cur = { a: [x + nx * wb, y, z + nz * wb], b: [x - nx * wb, y, z - nz * wb], c: [x - nx * wt, y + h, z - nz * wt], d: [x + nx * wt, y + h, z + nz * wt], k };
      if (prev) {
        quad(prev.a, cur.a, cur.d, prev.d, k); quad(cur.b, prev.b, prev.c, cur.c, k * 0.9); quad(prev.d, cur.d, cur.c, prev.c, 1.05 * k);
        // the copes: upright stones along the top, each a little out of line
        for (let c = 0; c < 3; c++) {
          const u0 = c / 3 + 0.03, u1 = (c + 1) / 3 - 0.03, ch = 0.4 + 0.35 * rng(), lean = (rng() - 0.5) * 0.2, kk = 0.8 + 0.3 * rng();
          const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];
          const p0 = mix(prev.d, cur.d, u0), p1 = mix(prev.d, cur.d, u1), q0 = mix(prev.c, cur.c, u0), q1 = mix(prev.c, cur.c, u1), up = (p, s) => [p[0] + dx * lean, p[1] + ch * s, p[2] + dz * lean];
          quad(p0, p1, up(p1, 1), up(p0, 0.85), kk); quad(q1, q0, up(q0, 0.85), up(q1, 1), kk * 0.9); quad(up(p0, 0.85), up(p1, 1), up(q1, 1), up(q0, 0.85), kk * 1.05);
          quad(q0, p0, up(p0, 0.85), up(q0, 0.85), kk * 0.75); quad(p1, q1, up(q1, 1), up(p1, 1), kk * 0.75);
        }
      }
      if (i === 0) quad(cur.b, cur.a, cur.d, cur.c, k * 0.8);        // a wall's two ends
      if (i === N) quad(cur.a, cur.b, cur.c, cur.d, k * 0.8);
      prev = cur;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(gg, 2));
  if (pos.length) g.computeBoundingSphere();
  g.userData.triangles = pos.length / 9;
  let minClear = 1e9;      // clear air: the nearest any stone of these walls comes to the flown line
  for (let v = 0; v < pos.length; v += 3) if (Math.abs(pos[v] - 3) < 30) minClear = Math.min(minClear, P.routeDistance(pos[v], pos[v + 1], pos[v + 2]));
  g.userData.minClear = minClear;
  return g;
}
