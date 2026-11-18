// green-gate-past-the-poppies: THE TREE CROWNS BY THE ROAD (a part of the field).
// Sources: real oaks, limes and elms in leaf in a low afternoon sun; words alone.
//
// WHAT IT MAKES. A broadleaf by the road is the kit's own tree below the crown (its trunk and boughs are kept, vertex
// for vertex) and a new crown over them, in two layers that stand in the same place with the same lean:
//   THE MASSES: every lobe of the kit's crown, read back from the kit's geometry (its centre, breadth and sway), is
//     rebuilt as one round mass of shade leaves: its shading runs from the lobe's OWN CENTRE outward (never from its
//     faces), so the sun lights its top and leaves its underside dark; it is cut by the kit's leaf sheet, so the
//     inside of the lobe and a little sky show through it. The masses cast the crown's shadow.
//   THE SPRAYS: small cards of a few leaves standing out of each lobe's surface and lying on it, more of them on the
//     side of a lobe that faces out of the crown (its outline), sunlit yellow-green at their tips, mid green on the
//     flanks, deep shade green under the lobe and in the hollows between lobes. They take the kit's wind by the
//     kit's own vertex weights (the lobe's sway as the kit dealt it; a flutter that grows to the tip).
// No sheet of its own is drawn: masses and sprays are cut from the kit's leaf sheet (its cell of broad leaves), a
// spray from one half of that cell so that its leaves fan out from the foot of the card.
//
// WHICH TREES (a rule of the place): a tree whose trunk stands within LEAF_NEAR metres of the road's centre line
// takes this crown; every other tree keeps the kit's crown as it is. Nothing here asks where anything is seen from.
// NO CROWN GROWS: no leaf of a new crown stands farther from the trunk's axis than the kit's crown reaches, higher
// than its top, or lower than its lowest leaf (the outer crown's lowest leaf beyond 0.45 of the radius, the measure
// the field part's clear air over the lane is counted from): a card that would is not grown.
// THE COST: a mass is 20 triangles where the kit's lobe is 36 to 48; every lobe is dealt LEAF_SPRAYS cards (two
// triangles each; a card's breadth goes by its lobe's, so every lobe is clothed alike), and the sprays cast no
// shadow, so they are drawn once.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';

// LEAF_NEAR: metres from the road's centre line. Every tree the field part stands BY the road stands inside it: the
// avenue, the great trees of the farmland, the lane's rims and oaks, the lone thorns of the deep field (dealt up to
// 32 m off the brick) and the sward's three trees (dealt up to 75 m back from the road, the deepest set-back the
// field part deals to a roadside tree), with 5 m to spare. The hedges, orchards and the lines between far plots are
// not roadside trees: they keep the kit's crowns.
export const LEAF_NEAR = 80;
// LEAF_SPRAYS: the cards dealt to one lobe (see THE COST; about two in three are grown: fewer on a lobe's inward
// side, none outside the kit crown's bounds). LEAF_CHUNKS: the stretches of the road the crowns are drawn in (four:
// the farmland, the field's edge with the lane's first half, the lane's end with the deep field, the sward).
export const LEAF_SPRAYS = 28, LEAF_CHUNKS = 4;
// a mass reaches MASS of its lobe's radius (the kit's lobes overlap, so the masses close the crown against the sky
// behind and leave gaps at its edge); SQUASH and FOOT are the kit's own lobe: lower than broad, flatter below
const MASS = 0.7, SQUASH = 0.74, FOOT = 0.8;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
// three greens of a tree in leaf in low sun: the sunlit leaf (yellow-green), the leaf in open shade, the leaf inside
const SUNLIT = lin('#a3bd52'), OPEN = lin('#47782f'), DEEP = lin('#1d4222');
const CELL = flora.LEAF_CELLS.cluster, UM = (CELL[0] + CELL[2]) / 2, VM = (CELL[1] + CELL[3]) / 2, UR = (CELL[2] - CELL[0]) / 2, VR = (CELL[3] - CELL[1]) / 2;
const TAU = Math.PI * 2, sat = (x) => Math.min(1, Math.max(0, x)), mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const streamOf = (ctx, name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

// What a kit broadleaf is made of: its wood (the first vertices, with no leaf weight), and its lobes: every part of
// the foliage that hangs together as more than one card is a lobe's inner mass, twelve points round its centre.
export function crownLobes(geo) {
  const P = geo.attributes.position, W = geo.attributes.wind, ix = geo.index.array, n = P.count;
  let wood = 0; while (wood < n && W.getZ(wood) < 0.5) wood++;
  let woodIdx = 0; while (woodIdx < ix.length && ix[woodIdx] < wood && ix[woodIdx + 1] < wood && ix[woodIdx + 2] < wood) woodIdx += 3;
  const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
  for (let i = woodIdx; i < ix.length; i += 3) { const a = find(ix[i]); par[find(ix[i + 1])] = a; par[find(ix[i + 2])] = a; }
  const sets = new Map(); for (let i = wood; i < n; i++) { const r = find(i); let L = sets.get(r); if (!L) sets.set(r, L = []); L.push(i); }
  const lobes = [], R = geo.userData.radius, out2 = 0.2 * R * R; let low = 1e9, lowIn = 1e9, top = -1e9;
  for (let i = wood; i < n; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (y < lowIn) lowIn = y; if (y > top) top = y; if (x * x + z * z > out2 && y < low) low = y; }
  for (const L of sets.values()) {
    if (L.length <= 4) continue;
    let x = 0, y = 0, z = 0, sway = 0; for (const i of L) { x += P.getX(i); y += P.getY(i); z += P.getZ(i); sway += W.getX(i); }
    x /= L.length; y /= L.length; z /= L.length; sway /= L.length;
    let q = 0; for (const i of L) { const dx = P.getX(i) - x, dz = P.getZ(i) - z; q += dx * dx + dz * dz; }
    // (the kit's inner mass stands at 0.68 of the lobe's radius; twelve even points carry two thirds of r squared in the level plane)
    lobes.push({ c: [x, y, z], r: Math.sqrt(1.5 * q / L.length) / 0.68, sway });
  }
  let cx = 0, cy = 0, cz = 0; for (const l of lobes) { cx += l.c[0]; cy += l.c[1]; cz += l.c[2]; }
  const m = lobes.length || 1; cx /= m; cy /= m; cz /= m;
  let cr = 0, rm = 0; for (const l of lobes) { cr = Math.max(cr, Math.hypot(l.c[0] - cx, l.c[1] - cy, l.c[2] - cz)); rm += l.r / m; }
  cr += rm; cy -= 0.25 * cr;                       // (the crown's middle sits low in it, as the kit shades it)
  return { wood, woodIdx, lobes, centre: [cx, cy, cz], reach: cr, radius: R, low, lowIn, top };
}

// a growing geometry in the kit's own layout (position, normal, colour, wind [sway m, flutter, leaf, glow], sheet uv)
function grower() {
  const G = { p: [], n: [], c: [], w: [], t: [], i: [], count: 0 };
  G.v = (p, nr, col, sway, flutter, u, v, leaf = 1) => { G.p.push(p[0], p[1], p[2]); G.n.push(nr[0], nr[1], nr[2]); G.c.push(col[0], col[1], col[2]); G.w.push(sway, flutter, leaf, 0); G.t.push(u, v); return G.count++; };
  G.build = (from) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(G.c, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(G.w, 4));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(G.t, 2));
    g.setIndex(G.count > 65535 ? new THREE.Uint32BufferAttribute(G.i, 1) : new THREE.Uint16BufferAttribute(G.i, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    g.userData = { ...from.userData, triangles: G.i.length / 3 };     // (the kit's own height and radius: both layers sink and scale as the kit's tree does)
    return g;
  };
  return G;
}
const unit = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const SOLID = new THREE.IcosahedronGeometry(1, 0).attributes.position;      // twenty faces, three points each, on the unit ball

// leafCrown(geo, rng): the two layers of one tree shape. geo: a kit broadleaf geometry (it is read, never changed).
// -> { body (the kit's wood and the masses), sprays, lobes, cards }
export function leafCrown(geo, rng) {
  const K = crownLobes(geo), B = grower(), S = grower(), C = K.centre, R2 = K.radius * K.radius, out2 = 0.2 * R2;
  const src = geo.attributes, ix = geo.index.array;
  // THE WOOD, as the kit grew it
  for (let i = 0; i < K.wood; i++) {
    B.p.push(src.position.getX(i), src.position.getY(i), src.position.getZ(i)); B.n.push(src.normal.getX(i), src.normal.getY(i), src.normal.getZ(i));
    B.c.push(src.color.getX(i), src.color.getY(i), src.color.getZ(i)); B.w.push(src.wind.getX(i), src.wind.getY(i), src.wind.getZ(i), src.wind.getW(i)); B.t.push(src.uv.getX(i), src.uv.getY(i)); B.count++;
  }
  for (let i = 0; i < K.woodIdx; i++) B.i.push(ix[i]);
  // the green of a leaf at p on a lobe, by how high it sits on its lobe and in the crown, and how deep in the crown
  const green = (dy, p, k, inside) => {
    const q = [p[0] - C[0], p[1] - C[1], p[2] - C[2]], s = mix(dy * 0.5 + 0.5, sat(0.5 + 0.6 * q[1] / K.reach), 0.45), ao = sat(0.3 + 0.8 * Math.hypot(q[0], q[1], q[2]) / K.reach) * k;
    if (inside) { const t = 0.7 * sstep(0.15, 1, s); return [mix(DEEP[0], OPEN[0], t) * ao, mix(DEEP[1], OPEN[1], t) * ao, mix(DEEP[2], OPEN[2], t) * ao]; }      // (a mass is shade leaf: never the sunlit green)
    const a = s < 0.55 ? DEEP : OPEN, b = s < 0.55 ? OPEN : SUNLIT, t = s < 0.55 ? sstep(0, 0.55, s) : sstep(0.55, 1, s);
    return [mix(a[0], b[0], t) * ao, mix(a[1], b[1], t) * ao, mix(a[2], b[2], t) * ao];
  };
  // the shading normal of a leaf at p of the lobe at c: from the lobe's own centre outward, leaning a third toward the crown's own outward
  const round = (p, c) => { const a = unit(p[0] - c[0], (p[1] - c[1]) / SQUASH, p[2] - c[2]), b = unit(p[0] - C[0], p[1] - C[1], p[2] - C[2]); return unit(a[0] * 0.68 + b[0] * 0.32, a[1] * 0.68 + b[1] * 0.32, a[2] * 0.68 + b[2] * 0.32); };
  const on = (c, r, d, k) => [c[0] + d[0] * r * k, c[1] + d[1] * r * k * SQUASH * (d[1] < 0 ? FOOT : 1), c[2] + d[2] * r * k];
  const fits = (p) => { const h2 = p[0] * p[0] + p[2] * p[2]; return h2 <= R2 && p[1] <= K.top && p[1] >= (h2 > out2 ? K.low : K.lowIn); };
  let cards = 0;
  for (const l of K.lobes) {
    const c = l.c, r = l.r, tint = rng.range(0.88, 1.12), out = unit(c[0] - C[0], c[1] - C[1], c[2] - C[2]);
    // THE MASS: a lumped ball (three slow waves over it), every face cut from the middle of the sheet's cell at its own turn
    const wv = []; for (let k = 0; k < 3; k++) wv.push([rng.range(-3, 3), rng.range(-3, 3), rng.range(-3, 3), rng() * TAU]);
    for (let f = 0; f < 20; f++) {
      const turn = rng() * TAU, flip = rng() < 0.5 ? -1 : 1;
      for (let k = 0; k < 3; k++) {
        const d = [SOLID.getX(f * 3 + k), SOLID.getY(f * 3 + k), SOLID.getZ(f * 3 + k)];
        let lump = 0; for (const q of wv) lump += Math.sin(d[0] * q[0] + d[1] * q[1] + d[2] * q[2] + q[3]);
        const p = on(c, r, d, MASS * (1 + 0.1 * lump / 3)), a = turn + flip * k * TAU / 3;
        B.i.push(B.v(p, round(p, c), green(d[1], p, 0.85 * tint, true), l.sway, 0.7, UM + Math.cos(a) * UR * 0.9, VM + Math.sin(a) * VR * 0.9));
      }
    }
    // THE SPRAYS of this lobe
    for (let k = 0; k < LEAF_SPRAYS; k++) {
      // every die of a card is drawn before any test
      const y = rng.range(-1, 1), th = rng() * TAU, keep = rng(), stand = rng() < 0.55, half = r * rng.range(0.21, 0.32), tall = rng.range(0.9, 1.25), at = rng(), jx = rng() - 0.5, jy = rng() - 0.5, jz = rng() - 0.5, fu = rng() < 0.5, fv = rng() < 0.5, lit = rng.range(0.86, 1.14);
      const rr = Math.sqrt(1 - y * y), d = [Math.cos(th) * rr, y, Math.sin(th) * rr], face = d[0] * out[0] + d[1] * out[1] + d[2] * out[2];
      if (keep > 0.42 + 0.58 * sat(0.6 + 0.65 * face)) continue;                 // (more on the lobe's side that faces out of the crown, the outline; four in ten stay on its inward side, which the road sees from under the crown)
      const tg = unit(d[1] * jz - d[2] * jy, d[2] * jx - d[0] * jz, d[0] * jy - d[1] * jx), sd = unit(d[1] * tg[2] - d[2] * tg[1], d[2] * tg[0] - d[0] * tg[2], d[0] * tg[1] - d[1] * tg[0]);
      const u0 = fu ? CELL[2] : CELL[0], u1 = fu ? CELL[0] : CELL[2], P = [], uv = [], fl = [];
      if (stand) {     // a spray standing out of the surface: its foot on the lobe, its leaves fanning out from the foot (half the cell)
        const f = on(c, r, d, mix(0.74, 0.92, at)), ax = unit(d[0] * 0.8 + tg[0] * 0.5, d[1] * 0.8 + tg[1] * 0.5 - 0.14, d[2] * 0.8 + tg[2] * 0.5), h = half * tall, vt = fv ? CELL[1] : CELL[3];
        P.push([f[0] - sd[0] * half, f[1] - sd[1] * half, f[2] - sd[2] * half], [f[0] + sd[0] * half, f[1] + sd[1] * half, f[2] + sd[2] * half],
          [f[0] + sd[0] * half + ax[0] * h, f[1] + sd[1] * half + ax[1] * h, f[2] + sd[2] * half + ax[2] * h], [f[0] - sd[0] * half + ax[0] * h, f[1] - sd[1] * half + ax[1] * h, f[2] - sd[2] * half + ax[2] * h]);
        uv.push([u0, VM], [u1, VM], [u1, vt], [u0, vt]); fl.push(0.6, 0.6, 1.5, 1.5);
      } else {         // a spray lying on the surface like a shingle, drooping a little (the whole cell)
        const f = on(c, r, d, mix(0.9, 1.02, at)), ax = unit(tg[0] * 0.85 + d[0] * 0.35, tg[1] * 0.85 + d[1] * 0.35 - 0.2, tg[2] * 0.85 + d[2] * 0.35);
        for (const [a, b] of [[-1, -1], [-1, 1], [1, 1], [1, -1]]) P.push([f[0] + ax[0] * half * a + sd[0] * half * b, f[1] + ax[1] * half * a + sd[1] * half * b, f[2] + ax[2] * half * a + sd[2] * half * b]);
        uv.push([u0, CELL[3]], [u1, CELL[3]], [u1, CELL[1]], [u0, CELL[1]]); fl.push(0.6, 0.6, 1.5, 1.5);
      }
      if (!(fits(P[0]) && fits(P[1]) && fits(P[2]) && fits(P[3]))) continue;     // (NO CROWN GROWS)
      const i0 = S.count;
      for (let q = 0; q < 4; q++) { const g = green(d[1], P[q], (q < 2 ? 0.82 : 1.08) * lit * tint); if (q >= 2) for (let e = 0; e < 3; e++) g[e] = mix(g[e], SUNLIT[e] * tint, 0.22 * sat(0.5 + d[1])); S.v(P[q], round(P[q], c), g, l.sway, fl[q], uv[q][0], uv[q][1]); }
      S.i.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); cards++;
    }
  }
  return { body: B.build(geo), sprays: S.build(geo), lobes: K.lobes.length, cards };
}

// buildLeafCrowns(ctx, o): the roadside trees with their new crowns.
//   o.variants: the kit's tree shapes (a point's v picks its shape)       o.points: the placed trees ({ x, y, z, s, rot, v, d, u })
//   o.material: the trees' own wind material (the kit's leaf sheet)       o.common: the scatter's options the field part gives its trees
// -> { object, rest (the points beyond LEAF_NEAR: they keep the kit's crowns), near, count, triangles, shapes }
// The masses and the sprays are two scatters over the same points from two equal streams, so every tree's lean,
// stretch and tint are the same in both. The shapes come from the stream 'gate-leaf-crowns' of the world's seed.
export async function buildLeafCrowns(ctx, o) {
  const near = [], rest = []; for (const p of o.points) (p.d <= LEAF_NEAR ? near : rest).push(p);
  const rng = streamOf(ctx, 'gate-leaf-crowns'), bodies = [], sprays = [], shapes = [];
  for (let k = 0; k < o.variants.length; k++) { const c = leafCrown(o.variants[k], rng.fork('shape' + k)); bodies.push(c.body); sprays.push(c.sprays); shapes.push({ lobes: c.lobes, cards: c.cards, body: c.body.userData.triangles, sprays: c.sprays.userData.triangles }); await ctx.yield(); }
  const object = new THREE.Group(), opts = { ...o.common, material: o.material, points: near, chunks: LEAF_CHUNKS };
  const body = flora.makeScatter({ ...opts, variants: bodies, rng: streamOf(ctx, 'gate-leaf-stand'), castShadow: true }); object.add(body.object); await ctx.yield();
  const leaf = flora.makeScatter({ ...opts, variants: sprays, rng: streamOf(ctx, 'gate-leaf-stand'), castShadow: false }); object.add(leaf.object);
  return { object, rest, near, count: near.length, triangles: body.triangles + leaf.triangles, shapes };
}
