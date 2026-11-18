// Three Shadows Each: the stone of the place. One maker of natural stone needles in unit space (the world instances
// it by the thousand), the maker of a GIANT (a great slender needle in metres, upright or toppled), and the hero: the
// tallest of the giants, one rock among rocks. Unworked stone only: rough, knobbly, a little bent; nothing here is built.
import * as THREE from 'three';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
// buff, grey-brown, dark brown, the pale of the tops
export const STONE = ['#d2bca2', '#ad9880', '#77634f', '#eaddc8'].map(lin);
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// The needle's own taper: half width (in foot widths) at height t (0 foot, 1 tip). The shadow strips of the world use
// the same law, so a shadow has its needle's outline.
export const needleTaper = (t, pw, tipR) => 0.5 * (tipR + (1 - tipR) * Math.pow(Math.max(0, 1 - t), pw));

// One needle in unit space: foot at y = 0 (a skirt runs a little under the ground), tip at y = 1, foot about 1 wide.
// Weathered stone: round in section, lumpy, a little bent, shaded smoothly (shared normals). The world scales it by
// (width, height, width). o: { rings, sides, lean, bend, knob }. userData: where the tip stands over the foot (in foot
// widths), the taper's two numbers and how far the stone reaches from its axis.
// NO STONE HAS A HEAD. Every line of the skin that runs up the stone (each of its `sides`) stands, at every ring, no
// farther from the stone's own axis than it stood at the ring below: the swells, benches, lumps and hollows of the
// shape can only step the stone IN as it rises, so it is nowhere wider than it is lower down, it has no neck and no
// knob, and it ends in a point (or, o.end 'slant', in a break on the slant: a stone that has lost its top).
export function makeNeedleGeometry(rng, o = {}) {
  const rings = o.rings ?? 10, sides = o.sides ?? 7, TAU = Math.PI * 2;
  // o.leanDir, o.leanExact, o.bendDir, o.bendExact (radians, foot widths): a lean and a bow that are given, not dealt
  // (every die is drawn whatever the options are; an option that is given takes the place of its die)
  const dLeanA = rng.range(0, TAU), dLean = rng.range(0.15, 1), dBendA = rng.range(0, TAU), dBend = rng.range(0.2, 1);
  const leanA = o.leanDir ?? dLeanA, lean = o.leanExact ?? (o.lean ?? 0.9) * dLean;
  const bendA = o.bendDir ?? dBendA, bend = o.bendExact ?? (o.bend ?? 0.32) * dBend;
  const kn = [rng.range(1.5, 3.5), rng.range(0, TAU), rng.range(4, 8), rng.range(0, TAU)];
  const dPw = rng.range(0.75, 1.15), dTipR = rng.range(0.08, 0.16), knob = o.knob ?? 0.2;
  const pw = o.pw ?? dPw, tipR = o.tipR ?? dTipR;
  const nLedge = rng.range(2.5, 6), phLedge = rng.range(0, TAU), dLedge = rng.range(0.07, 0.17), ledge = o.ledge ?? dLedge;
  const twist = rng.range(-1.2, 1.2), strata = rng.range(3, 7), sph = rng.range(0, TAU), tone = rng.range(0.96, 1.06);
  // a stone that has lost its top breaks on the slant, never square across (o.slant: how far its broken end tilts, in heights)
  const slA = rng.range(0, TAU), dSlant = rng.range(0.07, 0.16), slant = o.end === 'slant' ? (o.slant ?? dSlant) : 0;
  // lumps and hollows: places on the skin where the stone swells or is eaten away
  const lumps = [];
  for (let k = 0; k < (o.lumps ?? 9); k++) lumps.push([rng.range(0, TAU), rng.range(0.03, 0.95), rng.range(0.45, 1.1), rng.range(0.04, 0.13), rng.range(-0.26, 0.42)]);
  const pos = [], col = [], idx = [], lim = new Array(sides).fill(Infinity);
  const colAt = (y, k) => {
    // beds of stone: buff and grey-brown in turn, with thin dark beds between, and a top third that is a little paler.
    // (ONE STONE AT ONE HEIGHT: nothing here darkens or pales a stone by its own size, so that a small needle and a
    // giant are alike at the same height over the ground; the damp, darker foot is drawn by the world in metres.)
    const ph = y * strata * TAU + sph + k * 1.1, band = 0.5 + 0.5 * Math.sin(ph), dark = Math.pow(Math.max(0, Math.sin(ph * 2.3 + 1.7)), 6);
    let c = mix3(STONE[1], STONE[0], band);
    c = mix3(c, STONE[2], Math.min(0.85, 0.25 * k + 0.6 * dark));
    c = mix3(c, STONE[3], Math.min(1, Math.max(0, (y - 0.66) * 2.6)) * (0.1 + 0.1 * band));
    return [c[0] * tone, c[1] * tone, c[2] * tone];
  };
  for (let i = 0; i <= rings; i++) {
    const t0 = i / rings, t = -0.05 + 1.05 * Math.pow(t0, 1.15), tt = Math.max(0, t);
    // o.even: below this share of its height the stone is of one width (a trunk that does not flare toward its foot)
    const te = Math.max(tt, o.even ?? 0);
    let r = needleTaper(te, pw, tipR);
    r *= 1 + 0.5 * knob * (0.6 * Math.sin(kn[0] * te * TAU + kn[1]) + 0.4 * Math.sin(kn[2] * te * TAU + kn[3])) * (1 - 0.5 * te);
    r *= 1 + ledge * Math.tanh(3 * Math.sin(te * TAU * nLedge + phLedge));
    if (t < 0 && !o.even) r *= 1.15;
    const cx = lean * tt * Math.cos(leanA) + bend * Math.sin(tt * Math.PI) * Math.cos(bendA);
    const cz = lean * tt * Math.sin(leanA) + bend * Math.sin(tt * Math.PI) * Math.sin(bendA);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * TAU + twist * tt;
      let m = 1 + rng.range(-0.03, 0.03);
      for (const L of lumps) { let da = Math.abs(a - L[0]) % TAU; if (da > Math.PI) da = TAU - da; m += L[4] * Math.exp(-((da / L[2]) ** 2) - (((tt - L[1]) / L[3]) ** 2)); }
      // never farther from the axis than the ring below (the stone only steps in as it rises)
      const jy = rng.range(-0.18, 0.18) / rings, rr = Math.min(r * Math.max(0.55, m), lim[j]), y = t + (i > 0 && i < rings ? jy : 0) + slant * Math.cos(a - slA) * tt * tt * tt * (1 + rng.range(-0.25, 0.25));
      lim[j] = rr;
      pos.push(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr);
      const c = colAt(tt, rng.range(0, 1) ** 2), sh = rng.range(0.9, 1.06) * (0.8 + 0.25 * Math.min(1, m));
      col.push(c[0] * sh, c[1] * sh, c[2] * sh);
    }
  }
  const tx = lean * Math.cos(leanA), tz = lean * Math.sin(leanA);
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
    if ((i + j) % 2) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  if (!slant) {
    // the point: one vertex over the last ring
    const tipI = pos.length / 3; pos.push(tx, 1.0 + 0.35 / rings, tz); { const c = colAt(1, 0); col.push(c[0], c[1], c[2]); }
    for (let j = 0; j < sides; j++) idx.push(rings * sides + j, tipI, rings * sides + (j + 1) % sides);
  } else {
    // the break: a rough face of the same weathered stone across the slanted last ring (vertices of its own, so its edge stays sharp)
    const base = pos.length / 3; let mx = 0, my = 0, mz = 0;
    for (let j = 0; j < sides; j++) { const q = (rings * sides + j) * 3; pos.push(pos[q], pos[q + 1], pos[q + 2]); const c = colAt(1, rng()); col.push(c[0], c[1], c[2]); mx += pos[q] / sides; my += pos[q + 1] / sides; mz += pos[q + 2] / sides; }
    pos.push(mx, my + 0.012 * rng.range(0.5, 2.5), mz); { const c = colAt(1, rng()); col.push(c[0], c[1], c[2]); }
    for (let j = 0; j < sides; j++) idx.push(base + j, base + sides, base + (j + 1) % sides);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx); g.computeVertexNormals();
  g.userData = { tipX: tx, tipZ: tz, pw, tipR, reach: Math.max(lean, bend) + 0.9 };
  return g;
}

// A heap of fallen stone for a needle's foot, in foot widths: a few rounded stones half sunk in the crust round the
// origin, none higher than about 0.4. Scaled by the world with one number (the foot's width), so the stones keep their
// shape. Each stone: a low ring, a shoulder ring and a crown, shaded smoothly. o.small: the least size a stone may be
// dealt as a share of the common least (1 by default; a rubble of many unlike sizes takes less, and then most of its
// stones are small and a few large). o.strew [dx, dz, k]: the heap is strewn k times as far along that way as across it.
export function makeHeapGeometry(rng, o = {}) {
  const n = o.count ?? 5, pos = [], col = [], idx = [], TAU = Math.PI * 2, M = 6, small = o.small ?? 1, strew = o.strew || null;
  for (let k = 0; k < n; k++) {
    const a = rng.range(0, TAU), d = rng.range(0.5, o.reach ?? 1.15), sq = rng.range(0, 1), s = (0.16 * small + (0.36 - 0.16 * small) * Math.pow(sq, small < 1 ? 2.2 : 1)) * (1.25 - Math.min(d, 1.3) * 0.5);
    let ox = Math.cos(a) * d, oz = Math.sin(a) * d;
    if (strew) { const al = ox * strew[0] + oz * strew[1]; ox += strew[0] * al * (strew[2] - 1); oz += strew[1] * al * (strew[2] - 1); }
    const a0 = rng.range(0, TAU), sx = rng.range(0.8, 1.3), sz = rng.range(0.8, 1.3), hh = rng.range(0.6, 1.0);
    const tone = rng.range(0.82, 1.1), base = mix3(STONE[1], STONE[rng.chance(0.5) ? 0 : 2], rng.range(0.1, 0.7)), v0 = pos.length / 3;
    const cy = Math.cos(a0), sy = Math.sin(a0);
    for (const [rr, yy] of [[1.0, -0.12], [0.78, 0.5]]) for (let q = 0; q < M; q++) {
      const b = (q / M) * TAU + rng.range(-0.2, 0.2), r = s * rr * rng.range(0.82, 1.15), lx = Math.cos(b) * r * sx, lz = Math.sin(b) * r * sz;
      pos.push(ox + lx * cy - lz * sy, s * hh * (yy + rng.range(-0.06, 0.06)), oz + lx * sy + lz * cy);
      const sh = tone * rng.range(0.9, 1.08) * (yy < 0 ? 0.8 : 1); col.push(base[0] * sh, base[1] * sh, base[2] * sh);
    }
    pos.push(ox + rng.range(-0.15, 0.15) * s, s * hh * rng.range(0.85, 1.0), oz + rng.range(-0.15, 0.15) * s); col.push(base[0] * tone * 1.08, base[1] * tone * 1.08, base[2] * tone * 1.08);
    for (let q = 0; q < M; q++) { const q1 = (q + 1) % M; idx.push(v0 + q, v0 + M + q, v0 + q1, v0 + q1, v0 + M + q, v0 + M + q1, v0 + M + q, v0 + 2 * M, v0 + M + q1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// bake a unit needle into metres: width w, height h, turned by yaw, standing at (x, z)
// A LOOSE STONE OF THE LAST PLAIN: one closed, faceted lump about its own middle, about a metre in reach (the world
// scales it): twenty faces for a stone by the line, eight for one far from it. Every corner is pushed in or out by
// its own die and aside, and the whole is squeezed three ways, so no two shapes are alike; each face has its own tone.
export function makeBoulderGeometry(rng, faces = 20) {
  const t = (1 + Math.sqrt(5)) / 2;
  const V = faces === 20 ? [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
    : [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const F = faces === 20 ? [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
    : [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
  // (the eight-faced one is pushed about more, and askew, so that it reads as a shard of stone and never as a cut gem)
  const sq = [rng.range(0.75, 1.2), rng.range(0.55, 1.0), rng.range(0.75, 1.2)], lo = faces === 20 ? 0.72 : 0.5, sk = faces === 20 ? 0.12 : 0.45;
  const P = V.map((v) => { const k = rng.range(lo, 1.12) / Math.hypot(v[0], v[1], v[2]);
    return [(v[0] * k + rng.range(-sk, sk)) * sq[0], (v[1] * k + rng.range(-sk, sk)) * sq[1], (v[2] * k + rng.range(-sk, sk)) * sq[2]]; });
  const base = mix3(STONE[1], STONE[rng.chance(0.5) ? 0 : 3], rng.range(0.2, 0.8)), pos = [], col = [], nor = [];   // (of the paler stone)
  for (const f of F) {
    const a = P[f[0]], b = P[f[1]], c = P[f[2]], ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const tone = rng.range(0.84, 1.1);
    for (const q of [a, b, c]) { pos.push(q[0], q[1], q[2]); nor.push(nx, ny, nz); col.push(base[0] * tone, base[1] * tone, base[2] * tone); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  return g;
}

function bakeNeedle(g, w, h, yaw, x, z) {
  const m = new THREE.Matrix4().makeRotationY(yaw); m.scale(new THREE.Vector3(w, h, w)); m.setPosition(x, 0, z);
  g.applyMatrix4(m); g.computeVertexNormals();
  const c = Math.cos(yaw), s = Math.sin(yaw), tx = g.userData.tipX * w, tz = g.userData.tipZ * w;
  return { x, z, w, h, tipX: tx * c + tz * s, tipZ: -tx * s + tz * c, pw: g.userData.pw, tipR: g.userData.tipR };
}
// (extra: further attributes that every geometry of the list carries, as [name, size], merged with the three)
export function mergeGeoms(list0, extra = []) {
  const list = list0.map((g) => { if (!g.index) return g; const f = g.toNonIndexed(); g.dispose(); return f; });
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3), N = new Float32Array(n * 3), X = extra.map((e) => new Float32Array(n * e[1])); let o = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o); C.set(g.attributes.color.array, o); N.set(g.attributes.normal.array, o);
    extra.forEach((e, k) => X[k].set(g.attributes[e[0]].array, o / 3 * e[1]));
    o += g.attributes.position.count * 3; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('color', new THREE.BufferAttribute(C, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  extra.forEach((e, k) => out.setAttribute(e[0], new THREE.BufferAttribute(X[k], e[1])));
  return out;
}
// The stones of a heap, one by one (a heap's stones are 13 vertices and 18 triangles each, in the order they were
// dealt): each stone's first vertex, its middle and how far it reaches from that middle on the ground.
export function heapStones(g) {
  const P = g.attributes.position, out = [];
  for (let v0 = 0; v0 + 13 <= P.count; v0 += 13) {
    let cx = 0, cy = 0, cz = 0, rad = 0;
    for (let i = v0; i < v0 + 13; i++) { cx += P.getX(i) / 13; cy += P.getY(i) / 13; cz += P.getZ(i) / 13; }
    for (let i = v0; i < v0 + 13; i++) rad = Math.max(rad, Math.hypot(P.getX(i) - cx, P.getZ(i) - cz));
    out.push({ v0, cx, cy, cz, rad });
  }
  return out;
}
// A heap with only the stones that `keep` keeps (the others are not drawn: their triangles leave the index).
export function keepStones(g, keep) {
  const old = g.index.array, idx = [];
  heapStones(g).forEach((st, k) => { if (keep(st)) for (let i = k * 54; i < k * 54 + 54; i++) idx.push(old[i]); });
  g.setIndex(idx); return g;
}

// A GIANT: one great needle in metres standing at (o.x, o.z), o.h tall and o.w wide at the foot, with o.fused lesser
// spires grown into its foot (none in this world) and its fallen stone heaped round it (given apart from the body, as
// `rubble`: the world draws it as loose stone). o.broken: one that has lost its top.
// o.leanTo [dx, dz] and o.bow [bx, bz] (metres): where its upper end stands over its foot and how far it bows at mid
// height, for the one that has toppled and leans. Returns the geometries (baked in metres) and the casters of its shadows.
export function makeGiant(rng, o) {
  const parts = [], casters = [], TAU = Math.PI * 2; let rubble = null;
  const dPw = rng.range(0.7, 0.9), dYaw = rng.range(0, TAU);
  // a giant that has lost its top ends in a break on the slant (o.broken); every other ends in a point
  const shape = o.broken
    ? { rings: 26, sides: 18, lean: 0.25, bend: 0.15, knob: 0.2, pw: 0.3, tipR: 0.62, lumps: 30, ledge: 0.1, end: 'slant', slant: 0.02 }
    : { rings: 44, sides: 18, lean: 0.7, bend: 0.45, knob: 0.24, pw: dPw, lumps: 44 };
  if (o.leanTo) {
    // THE TOPPLED ONE: a trunk of one width over its lower three tenths (it does not flare toward the place where it
    // broke from its bed), tapering from there to a point
    const bow = o.bow || [0, 0];
    Object.assign(shape, { leanDir: Math.atan2(o.leanTo[1], o.leanTo[0]), leanExact: Math.hypot(o.leanTo[0], o.leanTo[1]) / o.w,
      bendDir: Math.atan2(bow[1], bow[0]), bendExact: Math.hypot(bow[0], bow[1]) / o.w, knob: 0.14, pw: 0.62, tipR: 0.12, lumps: 30, even: 0.3 });
  }
  const g = makeNeedleGeometry(rng, shape);
  casters.push(bakeNeedle(g, o.w, o.h, o.leanTo ? 0 : dYaw, o.x, o.z)); parts.push(g);
  const a0 = rng.range(0, TAU);
  for (let k = 0; k < (o.fused ?? 0); k++) {
    const a = a0 + k * rng.range(1.6, 2.6), d = o.w * rng.range(0.42, 0.62), w = o.w * rng.range(0.34, 0.55), h = o.h * rng.range(0.22, 0.5);
    const f = makeNeedleGeometry(rng, { rings: 22, sides: 12, lean: 0.8, bend: 0.5, lumps: 18 });
    casters.push(bakeNeedle(f, w, h, rng.range(0, TAU), o.x + Math.cos(a) * d, o.z + Math.sin(a) * d)); parts.push(f);
  }
  if (!o.leanTo) {
    const hs = o.w * 0.6, heap = makeHeapGeometry(rng, { count: 9, reach: 1.3 });
    heap.applyMatrix4(new THREE.Matrix4().makeScale(hs, hs, hs).setPosition(o.x, 0, o.z)); heap.computeVertexNormals(); rubble = heap;
  } else {
    // where it broke from its bed lies ONE HEAP OF RUBBLE of the same kind as the heaps at other stones' feet, of
    // many unlike sizes (most of its stones small, a few large), all round the break and strewn twice as far along
    // the way it fell as across it. No piece is like the next, none lies in a row, none is paler than the rest.
    const hs = o.w * 0.6, ll = Math.hypot(o.leanTo[0], o.leanTo[1]) || 1;
    const heap = makeHeapGeometry(rng, { count: 34, reach: 1.5, small: 0.3, strew: [o.leanTo[0] / ll, o.leanTo[1] / ll, 2] });
    heap.applyMatrix4(new THREE.Matrix4().makeScale(hs, hs, hs).setPosition(o.x, 0, o.z)); heap.computeVertexNormals(); rubble = heap;
  }
  return { parts, casters, rubble };
}

// THE HERO: the tallest of the giants (400 m, foot 40 m, as the world stands it: slender), a little bent, its fallen stone heaped round
// it (opts.fused: lesser spires grown into its foot, none by default). Origin at its foot, +Y up. One rock among
// rocks: the world stands the rest of the giants apart from it. opts.material: the world's own stone material (so the three suns' lights fall on it
// as on every other needle).
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.core.makeRng(ctx.core.hashSeed('tse-hero:' + ctx.seed));
  const H = opts.height ?? 400, W = opts.width ?? 40;
  const giant = makeGiant(rng, { x: 0, z: 0, h: H, w: W, fused: opts.fused ?? 0 });
  await ctx.yield?.();
  const geom = mergeGeoms(giant.parts), needles = giant.casters;
  const own = !opts.material;
  const material = opts.material || new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geom, material); mesh.name = 'tse-hero';
  const object = new THREE.Group(); object.add(mesh);
  if (own) { object.add(new THREE.HemisphereLight('#bcd8f0', '#b08a70', 1.6)); const d = new THREE.DirectionalLight('#fff0dc', 2.6); d.position.set(30, 40, 20); object.add(d); }
  return {
    object, rubble: giant.rubble, radius: W * 1.2, height: H, center: new THREE.Vector3(0, H * 0.45, 0),
    anchors: { foot: new THREE.Vector3(0, 0, 0), top: new THREE.Vector3(needles[0].tipX, H, needles[0].tipZ) },
    needles, ground: true, groundY: 0,
    update() {}, dispose() { geom.dispose(); },
  };
}

// THE PYRAMID: the one worked thing of the place, AND THE JOURNEY'S END. A great stepped pyramid of dressed stone, in
// metres, its base's middle at the origin, +Y up, its stair on the face that looks along +Z. HALF AGAIN AS LARGE AS
// IT WAS IN EVERY MEASURE (a base of 690 m, 330 m high) AND OF FINER COURSES, so that it reads as large as it is:
// eighteen tiers of 16.5 m (two courses of 8.25 m), each stepping in by 15 m (the lowest 690 m square, the
// eighteenth 180 m: the terrace), a plain square house of four courses (75 m square, 33 m high) on the terrace with
// ONE DOORWAY, DEEP, DARK AND PLAIN (9 m wide, 19 m high, 12 m deep, its walls going dark inward, and far inside it
// a faint cool light on its back wall: no fire, nothing lettered, no emblem), and one BROAD STAIR of 72 great steps
// (60 m wide) up the middle of the +Z face from the ground to the terrace BETWEEN TWO SIDE WALLS that stand over it
// in steps, tier by tier. Every measure is ours. The lower seventeen tiers, the stair and its walls are one solid;
// THE UPPER COURSES ARE BLOCKS OF THEIR OWN (the terrace's tier and the house, in blocks of 15 by 8.25 by 15 m), each
// laid by the world with its own dice (the world leaves every one on its bed: the pyramid stays whole). Returns { solid, blockGeo, doorGeo, blocks, door, courses } with blocks as
// [x, y, z, course] (the block's middle; its course counted from the topmost, 0) and door as one such for the one
// tall piece that carries the doorway (three courses high; its course is its topmost one's). The solid carries, at
// every vertex, what it is (aPyr: 0 a tier or a block, 1 the stair, 2 a side wall, 3 the inside of the doorway). The faces' courses, joints and shade are
// drawn by PYRAMID_DRESS below; here only the shapes and their tone.
export const PYRAMID = { half: 345, height: 330, top: 37.5, course: 8.25, tier: 16.5, step: 15, block: 15, tiers: 18, stairHalf: 30, stairOut: 26, wall: 7.5, stone: 7.5, bed: 4.125 };
export function makePyramid(rng) {
  const { half: HALF, course: CH, tier: TIER, step: STEP, block: BLK, tiers: NT, stairHalf: SW, stairOut: OUT, wall: WW } = PYRAMID, HOUSE = 5, HC = 4, LOOSE = 1, ROSE = lin('#cfae98');
  const tone = () => { const k = rng.range(0.9, 1.06), c = mix3(ROSE, STONE[1], rng.range(0.1, 0.45)); return [c[0] * k, c[1] * k, c[2] * k]; };
  // one face of a box (four corners, counter-clockwise seen from outside) with its facing and a tone at each corner (or one for all)
  const quad = (P, a, b, c, d, n, t, tb, tc, td) => { const T = tb ? [t, tb, tc, t, tc, td] : [t, t, t, t, t, t]; [a, b, c, a, c, d].forEach((q, i) => { P.pos.push(q[0], q[1], q[2]); P.col.push(T[i][0], T[i][1], T[i][2]); P.nor.push(n[0], n[1], n[2]); P.kind.push(P.k || 0); }); };
  // a box's top and four sides (no underside: every box of the pyramid stands on stone or on the ground); back false: no -Z side
  const box = (P, x0, x1, y0, y1, z0, z1, t, back = true) => {
    quad(P, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], t.map((q) => q * 1.06));
    quad(P, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], t);
    if (back) quad(P, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], t);
    quad(P, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], t.map((q) => q * 0.97));
    quad(P, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], t.map((q) => q * 0.97));
  };
  const bag = () => ({ pos: [], col: [], nor: [], kind: [], k: 0 }), S = bag();
  // the seventeen solid tiers
  for (let i = 0; i < NT - LOOSE; i++) { const w = HALF - STEP * i; box(S, -w, w, TIER * i, TIER * (i + 1), -w, w, tone()); }
  // the stair: 72 slabs of 4.125 m, each lying 3.75 m farther back than the one under it and running back to the riser
  // of its own tier (so the uncovered front of each is one tread); its front stands 26 m out from the tiers' own edges
  const RISE = TIER / 4, RUN = STEP / 4, stairT = tone().map((q) => q * 1.08);
  S.k = 1;
  for (let k = 0; k < NT * 4; k++) { const zr = HALF - STEP * Math.floor(k / 4), zf = HALF + OUT - RUN * k; box(S, -SW, SW, RISE * k, RISE * (k + 1), zr, zf, stairT.map((q) => q * (0.97 + 0.06 * ((k * 7) % 3) / 2)), false); }
  // its two side walls: to each hand of the stair one great block to a tier, 7.5 m thick, standing from the tier's own
  // face out to 22.5 m before it and 4 m higher than the tier: together two walls that climb in steps and stand over
  // the stair all the way (by a hand's breadth at the least, by a tier at the most)
  S.k = 2;
  for (let i = 0; i < NT; i++) { const z0 = HALF - STEP * i, t = stairT.map((q) => q * 0.94); for (const sx of [-1, 1]) box(S, Math.min(sx * SW, sx * (SW + WW)), Math.max(sx * SW, sx * (SW + WW)), TIER * i, TIER * (i + 1) + 4, z0, z0 + 22.5, t, false); }
  const geo = (P) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P.pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(P.col), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(P.nor), 3)); g.setAttribute('aPyr', new THREE.BufferAttribute(new Float32Array(P.kind), 1)); return g; };
  const solid = geo(S);
  // one loose block (its middle at the origin; an underside too, since it leaves its bed)
  const hx = BLK / 2, hy = CH / 2, hz = BLK / 2, bt = [ROSE[0] * 0.98, ROSE[1] * 0.98, ROSE[2] * 0.98];
  const under = (P, x, y, z) => quad(P, [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0], bt.map((q) => q * 0.8));
  const B = bag(); box(B, -hx, hx, -hy, hy, -hz, hz, bt); under(B, hx, hy, hz);
  // THE PIECE WITH THE DOORWAY: three courses high. Its opening is cut 12 m into it; the walls, the roof and the
  // floor of the opening go from half the stone's tone at the front to all but black inside; the back wall is all
  // but black at its edges and carries a faint cool light at its middle.
  const D = bag(), dy = 1.5 * CH, dw = 4.5, dh = -dy + 19, zb = hz - 12, dim = bt.map((q) => q * 0.45), dark = [0.012, 0.011, 0.012], cool = [0.07, 0.12, 0.2];
  quad(D, [-hx, dy, hz], [hx, dy, hz], [hx, dy, -hz], [-hx, dy, -hz], [0, 1, 0], bt.map((q) => q * 1.06));
  quad(D, [hx, -dy, -hz], [-hx, -dy, -hz], [-hx, dy, -hz], [hx, dy, -hz], [0, 0, -1], bt);
  quad(D, [hx, -dy, hz], [hx, -dy, -hz], [hx, dy, -hz], [hx, dy, hz], [1, 0, 0], bt.map((q) => q * 0.97));
  quad(D, [-hx, -dy, -hz], [-hx, -dy, hz], [-hx, dy, hz], [-hx, dy, -hz], [-1, 0, 0], bt.map((q) => q * 0.97));
  quad(D, [-hx, -dy, hz], [-dw, -dy, hz], [-dw, dy, hz], [-hx, dy, hz], [0, 0, 1], bt);
  quad(D, [dw, -dy, hz], [hx, -dy, hz], [hx, dy, hz], [dw, dy, hz], [0, 0, 1], bt);
  quad(D, [-dw, dh, hz], [dw, dh, hz], [dw, dy, hz], [-dw, dy, hz], [0, 0, 1], bt);
  D.k = 3;
  quad(D, [-dw, -dy, hz], [-dw, -dy, zb], [-dw, dh, zb], [-dw, dh, hz], [1, 0, 0], dim, dark, dark, dim);
  quad(D, [dw, -dy, zb], [dw, -dy, hz], [dw, dh, hz], [dw, dh, zb], [-1, 0, 0], dark, dim, dim, dark);
  quad(D, [-dw, dh, zb], [dw, dh, zb], [dw, dh, hz], [-dw, dh, hz], [0, -1, 0], dark, dark, dim, dim);
  quad(D, [-dw, -dy, hz], [dw, -dy, hz], [dw, -dy, zb], [-dw, -dy, zb], [0, 1, 0], dim, dim, dark, dark);
  { const c = [0, (dh - dy) / 2, zb], k = [[-dw, -dy, zb], [dw, -dy, zb], [dw, dh, zb], [-dw, dh, zb]];
    for (let i = 0; i < 4; i++) for (const [q, t] of [[k[i], dark], [k[(i + 1) % 4], dark], [c, cool]]) { D.pos.push(q[0], q[1], q[2]); D.col.push(t[0], t[1], t[2]); D.nor.push(0, 0, 1); D.kind.push(3); } }
  D.k = 0; under(D, hx, dy, hz);
  // where the loose blocks lie: the house on the terrace (four courses) and the terrace's own tier (two)
  const blocks = []; let door = null;
  const lay = (half, y0, nc, courseTop, isHouse) => {
    const n = Math.round(2 * half / BLK), mid = (n - 1) / 2;
    for (let c = 0; c < nc; c++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (isHouse && b === n - 1 && a === mid && c < 3) { if (c === 0) door = [0, y0 + dy, -half + BLK * (b + 0.5), courseTop + (nc - 1 - 2)]; continue; }
      blocks.push([-half + BLK * (a + 0.5), y0 + CH * (c + 0.5), -half + BLK * (b + 0.5), courseTop + (nc - 1 - c)]);
    }
  };
  lay(HOUSE * BLK / 2, TIER * NT, HC, 0, true);
  for (let i = NT - 1; i >= NT - LOOSE; i--) lay(HALF - STEP * i, TIER * i, 2, HC + 2 * (NT - 1 - i), false);
  return { solid, blockGeo: geo(B), doorGeo: geo(D), blocks, door, half: HALF, height: TIER * NT + CH * HC, top: HOUSE * BLK / 2, stairOut: OUT, courses: HC + 2 * LOOSE };
}

// THE PYRAMID'S FACES ARE DRESSED STONE (the law of its colour, for the fragment shader of the world's stone; it
// stands where the standing stone has its beds). Everything is read in the pyramid's own axes at rest (uPyrInv
// brings a place of the world into it; a loose block carries its place at rest, so its marks go with it), and the
// face a place lies on is read from those axes' own slopes on the screen.
// A RISER (a face that stands): BEDS OF DRESSED STONES 4.125 m high (two to a course of the great blocks, four to
// a tier, one to a step of the stair) with a joint between them, and in each bed STONES 7.5 m long with a joint
// between them, set off from those of the bed under it (half a stone and a seeded part more): fine courses, so
// that the pyramid reads as large as it is. Every stone has a tone of its own (within a tenth) and is a little
// darker toward its joints; a bed's joint is 0.44 m wide and darker than the joints between its stones (0.32 m);
// each is told by the screen's own dots, so far off it is a soft line and never a row of dashes. EVERY STEP HAS A LIT EDGE AND A SHADOW UNDER IT, AS
// LONG AS THE STEP: the top tenth of a riser is lighter (the edge of the step, which takes the sky), the fifth
// under it darker (the shade under that edge), and the lowest three tenths darken toward the foot, where the riser
// meets the tread it stands on (a riser is a tier's face, a step of the stair, a block of a side wall, or the
// house's wall; THE TERRACE HAS AN EDGE: its tier's lit edge and the shade under it are twice as deep). WEATHERING:
// dark streaks run down from the top of each riser, where the tread above sheds, and the whole is mottled a tenth
// either way over tens of metres. THE STAIR LIES IN ITS WALLS' SHADE along both of them (darker by up to four
// tenths within 7 m of a wall).
// A TREAD (a face that lies): paving of the same 7.5 m stones, a little paler and greyer than the risers (dust),
// darker by four tenths where it meets the riser that stands on it.
// NO THIN PALE LEVEL DASH OR SLIT IS DRAWN ANYWHERE: the only pale line of a step is its own lit edge, whole from
// end to end. The inside of the doorway carries none of this: it is plain and dark.
// THE ROW'S LIGHT ON THE STAIR (tseQ: the share of the row's light a place takes; the world adds that light to the
// stone's own): the stair, its two walls and the house take it whole; a tier's lit edge takes it too, and more
// than the stair (the terrace edges catch it); every other face takes none. And only above the light's front,
// which stands at the terrace when the row has formed and comes down the stair to its foot by the world's own
// measure (uRowLit: x how far the row has formed, y how far down the light has come), soft over one tier.
const P_ = PYRAMID, F_ = (x) => x.toFixed(3);
export const PYRAMID_DRESS = /* glsl */`
float tseQ = 0.;
{ vec3 tseLp = (uPyrInv * vec4(vTseP, 1.)).xyz, tseFn = normalize(cross(dFdx(tseLp), dFdy(tseLp)));
  float tseK = floor(vTsePyrK + .5), tseRim = max(abs(tseLp.x), abs(tseLp.z));
  float tseMo = .9 + .2 * tseFbm(vec2(tseLp.x + tseLp.z, tseLp.y * 1.7) * .011 + 5.);
  if (tseK > 2.5) { }
  else if (abs(tseFn.y) < .7){
    float tseAl = abs(tseFn.x) > abs(tseFn.z) ? tseLp.z : tseLp.x;
    float tseCy = tseLp.y / ${F_(P_.bed)} + 1e-4, tseCi = floor(tseCy), tseFy = tseCy - tseCi;
    float tseBs = tseAl / ${F_(P_.stone)} + (.5 * mod(tseCi, 2.) + .37 * tseHash(vec2(tseCi, 2.3))) + 100., tseBi = floor(tseBs), tseFs = tseBs - tseBi;
    float tseDy = min(tseFy, 1. - tseFy) * ${F_(P_.bed)}, tseDs = min(tseFs, 1. - tseFs) * ${F_(P_.stone)};
    float tseJy = 1. - smoothstep(.22, .22 + max(fwidth(tseLp.y), .04), tseDy), tseJs = 1. - smoothstep(.16, .16 + max(fwidth(tseAl), .04), tseDs);
    float tsePil = (1. - smoothstep(0., .8, tseDy)) + (1. - smoothstep(0., .8, tseDs));
    float tseTerr = ${F_(P_.tier * P_.tiers)}, tseFoot, tseSpan;
    if (tseK == 1.) { tseSpan = ${F_(P_.tier / 4)}; tseFoot = floor(tseLp.y / tseSpan + 1e-4) * tseSpan; }
    else if (tseK == 2.) { tseFoot = max(floor((tseLp.y - 4.) / ${F_(P_.tier)} + 1e-4) * ${F_(P_.tier)} + 4., 0.); tseSpan = tseFoot < 1. ? ${F_(P_.tier + 4)} : ${F_(P_.tier)}; }
    else if (tseLp.y > tseTerr + .01) { tseFoot = tseTerr; tseSpan = ${F_(P_.height - P_.tier * P_.tiers)}; }
    else { tseSpan = ${F_(P_.tier)}; tseFoot = floor(tseLp.y / tseSpan + 1e-4) * tseSpan; }
    float tseHh = clamp((tseFoot + tseSpan - tseLp.y) / tseSpan, 0., 1.);
    float tseLw = (tseK == 0. && tseFoot > tseTerr - ${F_(P_.tier)} - .1 && tseFoot < tseTerr - .1) ? .2 : .1;
    float tseLip = 1. - smoothstep(tseLw * .6, tseLw, tseHh), tseSh = smoothstep(tseLw * .6, tseLw, tseHh) * (1. - smoothstep(tseLw * 1.2, tseLw * 3., tseHh));
    float tseSk = smoothstep(.52, .85, tseNoise(vec2(tseAl * .21, tseFoot * .37 + 3.))) * (1. - smoothstep(.1, .9, tseHh));
    diffuseColor.rgb *= tseMo * (.91 + .18 * tseHash(vec2(tseBi, tseCi))) * (1. - .4 * tseJy) * (1. - .2 * tseJs) * (1. - .07 * tsePil) * mix(1., .58, smoothstep(.7, 1., tseHh))
      * (1. + .16 * tseLip) * (1. - .3 * tseSh) * (1. - .22 * tseSk);
    if (tseK == 1.) diffuseColor.rgb *= mix(.62, 1., smoothstep(0., 7., ${F_(P_.stairHalf)} - abs(tseLp.x)));
    tseQ = tseK == 0. && tseLp.y < tseTerr + .01 ? 1.6 * tseLip : 1.;
  } else {
    vec2 tseB2 = tseLp.xz / ${F_(P_.stone)} + 100., tseF2 = fract(tseB2);
    float tseJ = max(1. - smoothstep(.2, .2 + max(fwidth(tseLp.x), .04), min(tseF2.x, 1. - tseF2.x) * ${F_(P_.stone)}), 1. - smoothstep(.2, .2 + max(fwidth(tseLp.z), .04), min(tseF2.y, 1. - tseF2.y) * ${F_(P_.stone)}));
    float tseTerr = ${F_(P_.tier * P_.tiers)}, tseAo = 1.;
    if (tseK == 0. && tseLp.y < tseTerr - 1.) { float tseIn = tseRim - (${F_(P_.half)} - ${F_(P_.step)} * floor(tseLp.y / ${F_(P_.tier)} + .5)); tseAo = mix(.6, 1., smoothstep(0., 5., tseIn)) * (1. + .1 * smoothstep(${F_(P_.step - 1.5)}, ${F_(P_.step)}, tseIn)); }
    else if (tseK == 0. && tseLp.y < tseTerr + 1.) tseAo = mix(.6, 1., smoothstep(0., 6., tseRim - ${F_(P_.top)}));
    else if (tseK == 1.) { float tseKk = floor(tseLp.y / ${F_(P_.tier / 4)} + .5); tseAo = mix(.6, 1., smoothstep(0., 1.3, tseLp.z - (${F_(P_.half + P_.stairOut)} - ${F_(P_.step / 4)} * tseKk))) * mix(.62, 1., smoothstep(0., 7., ${F_(P_.stairHalf)} - abs(tseLp.x))); }
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.333))), .25) * 1.12 * tseMo * (.93 + .14 * tseHash(floor(tseB2) + tseLp.y)) * (1. - .35 * tseJ) * tseAo;
    tseQ = tseK == 1. || tseLp.y > tseTerr + 1. ? 1. : 0.;
  }
  { float tseQy = ${F_(P_.tier * P_.tiers + 8)} * (1. - uRowLit.y) - 8.;
    tseQ *= uRowLit.x * smoothstep(tseQy - 8., tseQy + 8., tseLp.y); }
}`;

// ---------------------------------------------------------------- THE FOUR SMALL RISEN THINGS (written by a second
// builder to the world's own five lines; laid in here whole)
// THE GROUND LETS GO. When the three suns have drawn into one row, the loose things of the plain
// leave it and rise slowly toward the row: plates of the salt crust, the frost as a fine glitter, the brine in dark
// beads and in thin ropes that stand up out of the pools. A slow, grave lifting of the place itself: no wind in it.
//
// THE LAW OF EVERY PIECE (in its vertex shader, from its own seeded attributes and uRise alone): it lets go at its own
// start s (0 to 0.7 of the progress, dealt without regard to where it lies, so near and far ones go early and late
// alike); it has no size while uRise <= s; it rises as the square of (uRise - s), the earliest to about 240 m
// when the progress is whole; it turns as it rises; it drifts less than 3 m sideways, mostly toward the row. The
// world's clock gives only a slow turn and the frost's twinkle. Nothing is kept from one moment to the next.

const TAU = Math.PI * 2;
// what this part declares for itself (the world's own string, put first, declares the suns, the sky's light and the clock)
const DECL = /* glsl */`
uniform float uRise; uniform vec3 uRowDir, uCrust, uRim, uBrine, uFrostCol;
`;
// the law, for the vertex shaders
const LAW = /* glsl */`
// how far the progress has gone since a piece let go of the ground (nought until then)
float riseGone(float s){ return max(uRise - s, 0.); }
// a piece's size: none on the ground, whole a little after it has let go
float riseSize(float s){ float g = riseGone(s); return g <= 0. ? 0. : smoothstep(0., .045, g); }
// where a piece's middle is: over its home by the square of the progress gone, and a few metres aside (2 m toward the
// row's bearing and 0.9 m its own way, less than 3 m in all; far: the share of that a piece takes)
vec3 riseAt(vec2 home, float s, float lift, float ph, float far){
  float g = riseGone(s), k = smoothstep(0., .5, g) * far;
  vec2 r = uRowDir.xz / max(length(uRowDir.xz), .05);
  vec2 d = (r * 2. + vec2(cos(ph), sin(ph)) * .9) * k;
  return vec3(home.x + d.x, 240. * lift * g * g, home.y + d.y);
}
// a turn of p about the unit axis ax by the angle a
vec3 riseTurn(vec3 p, vec3 ax, float a){ float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1. - c); }
`;
// light and air, for the fragment shaders: as the ground has them
const LIGHT = /* glsl */`
vec3 riseLit(vec3 alb, vec3 n){
  vec3 l = uAmb;
  for (int i = 0; i < 3; i++) l += uSunE[i] * (.25 + .75 * max(dot(n, uSunDir[i]), 0.));
  return alb * l;
}
vec3 riseAir(vec3 col, vec3 toEye){
  float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3), lv = vec3(-V.x, .02, -V.z);
  return mix(col, tseAir(lv / max(length(lv), 1e-3)), tseFog(dist));
}
`;

// one buffer of floats as an attribute
const attr = (g, name, arr, n) => g.setAttribute(name, new THREE.BufferAttribute(arr instanceof Float32Array ? arr : new Float32Array(arr), n));
// how many homes of a kind there are (x, z, d each), at most `most`
const homesOf = (h, most) => Math.min(most, h ? Math.floor(h.length / 3) : 0);
// THE STREAM A HOME'S PIECE DRAWS ITS DICE FROM: its own (o.own, by the number of the home's try among the tries
// dealt, which the homes carry as `tries`), so that a home more or less never deals the piece of another home anew;
// without those, the kind's one stream
const ownOf = (o, H, i) => (o.own && H.tries ? o.own(H.tries[i]) : o.rng);
// a piece's start: 0 to 0.7 of the progress, the later starts a little commoner than the early ones
const startOf = (rng) => 0.7 * Math.pow(rng(), 0.75);

// ---------------------------------------------------------------- PLATES of the salt crust
// Thin polygons of 5 to 7 sides, lying as the crust they were while they let go: 0.8 to 3 m across near the line of
// flight and up to 6 m far from it, one to a home, of 3 to 5 triangles (a fan from one corner). Each corner carries
// its measure from every side of its own plate (in the plate's half widths), so a place on the plate knows how near
// the plate's edge it is: there lies the pale ridge of salt that every polygon of the crust has along its border, and
// a faint bloom of salt inside it. The upper face is the crust's colour, mottled; the under face is the damper,
// darker side that lay beneath.
const PLATE_VERT = /* glsl */`
attribute vec4 aHome, aTurn, aE0; attribute vec3 aE1, aTone;
varying vec3 vW, vN, vE1; varying vec4 vE0, vQ;
void main(){
  float s = aHome.z, g = riseGone(s), b = aTurn.w * uTime + aTone.z;
  // the turn about its level axis grows with the progress since it let go (slowly at first, so no edge dips into
  // the ground it has just left: the divisor is 0.08 and more); the clock sways it a little and turns it in its own plane
  float a = aTurn.y * g * g / max(g + .08, .08) + .3 * sin(aTurn.z * uTime + aTone.z) * smoothstep(0., .12, g);
  vec3 ax = vec3(cos(aTurn.x), 0., sin(aTurn.x));
  vec3 q = vec3(position.x * cos(b) - position.z * sin(b), 0., position.x * sin(b) + position.z * cos(b)) * riseSize(s);
  vec4 w = modelMatrix * vec4(riseTurn(q, ax, a) + riseAt(aHome.xy, s, aHome.w, aTone.z, 1.), 1.);
  vW = w.xyz; vN = riseTurn(vec3(0., 1., 0.), ax, a); vE0 = aE0; vE1 = aE1; vQ = vec4(position.xz, aTone.xy);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const PLATE_FRAG = /* glsl */`
varying vec3 vW, vN, vE1; varying vec4 vE0, vQ;
// the light on a thin plate of salt. For the face a sun stands before: the common law of this part, or what the
// rough crust of the ground takes at that slant where that is more (so a plate that has just let go is as bright as
// the ground it left). For a sun that stands behind the plate: 0.7 of the same (thin salt lets the light through).
vec3 riseThin(vec3 n){
  vec3 l = uAmb;
  for (int i = 0; i < 3; i++){
    float d = dot(n, uSunDir[i]), c = abs(d);
    l += uSunE[i] * (.25 + max(.75 * c, 1.12 * c / (c + .12) - .25) * (d < 0. ? .7 : 1.));
  }
  return l;
}
void main(){
  vec3 toEye = cameraPosition - vW, n = vN / max(length(vN), 1e-3);
  float top = step(0., dot(n, toEye)); n = top > .5 ? n : -n;
  // how near the plate's own edge (in its half widths), and the pale ridge along it
  float e = min(min(min(vE0.x, vE0.y), min(vE0.z, vE0.w)), min(min(vE1.x, vE1.y), vE1.z)), fw = fwidth(e);
  float ridge = 1. - smoothstep(.05, .08 + fw, e), bloom = 1. - smoothstep(.06, .3, e);
  // its mottle in two grains, each kept as far as it is wider than a dot of the screen and then left at its mean
  vec2 q = vQ.xy + vQ.w; float fq = max(fwidth(vQ.x), fwidth(vQ.y));
  float mott = mix(.5, tseNoise(q * 1.7), 1. - smoothstep(.15, .6, fq)) * .6 + mix(.5, tseNoise(q * 6.1 + 9.), 1. - smoothstep(.04, .16, fq)) * .4;
  vec3 alb = uCrust * (.82 + .36 * mott) * vQ.z;
  alb = mix(alb * vec3(.8, .76, .73), alb, top);
  alb = mix(alb, uRim, max(ridge * (.55 + .35 * top), bloom * .3));
  gl_FragColor = vec4(riseAir(alb * riseThin(n), toEye), 1.);
}`;
function makePlates(o) {
  const { U, glsl } = o, H = o.homes && o.homes.plates, N = homesOf(H, 2200);
  const pos = [], home = [], turn = [], e0 = [], e1 = [], tone = [], idx = [];
  for (let i = 0; i < N; i++) {
    const x = H[i * 3], z = H[i * 3 + 1], d = H[i * 3 + 2], rng = ownOf(o, H, i);
    const s = startOf(rng), n = Math.min(7, 5 + Math.floor(rng() * 3)), most = 3 + 3 * Math.min(1, Math.max(0, (d - 30) / 300));
    const R = 0.5 * (0.8 + (most - 0.8) * Math.pow(rng(), 1.7)), lift = rng.range(0.86, 1), ph = rng.range(0, TAU);
    const axis = rng.range(0, TAU), w = rng.range(1.5, 5.5) * (rng.chance(0.5) ? 1 : -1), sway = rng.range(0.25, 0.6), spin = rng.range(0.03, 0.12) * (rng.chance(0.5) ? 1 : -1);
    const tn = rng.range(0.86, 1.12), sd = rng.range(0, 40), a0 = rng.range(0, TAU), flat = rng.range(0.7, 1), v = [], nx = [], nz = [];
    // its corners stand on an oval at unequal steps: the polygon is never dented, and no two of its sides are alike
    for (let k = 0; k < n; k++) { const a = a0 + (k + rng.range(-0.3, 0.3)) * TAU / n; v.push([Math.cos(a) * R, Math.sin(a) * R * flat]); }
    for (let j = 0; j < n; j++) {
      const p = v[j], q = v[(j + 1) % n], ex = q[0] - p[0], ez = q[1] - p[1], l = Math.hypot(ex, ez) || 1;
      const sg = (-p[0] * -ez + -p[1] * ex) >= 0 ? 1 : -1; nx.push(sg * -ez / l); nz.push(sg * ex / l);
    }
    const base = pos.length / 3;
    for (let k = 0; k < n; k++) {
      const dd = [99, 99, 99, 99, 99, 99, 99];
      for (let j = 0; j < n; j++) dd[j] = Math.max(0, (v[k][0] - v[j][0]) * nx[j] + (v[k][1] - v[j][1]) * nz[j]) / R;
      pos.push(v[k][0], 0, v[k][1]); home.push(x, z, s, lift); turn.push(axis, w, sway, spin); tone.push(tn, sd, ph);
      e0.push(dd[0], dd[1], dd[2], dd[3]); e1.push(dd[4], dd[5], dd[6]);
    }
    for (let k = 1; k < n - 1; k++) idx.push(base, base + k + 1, base + k);
  }
  if (!N) return null;
  const g = new THREE.BufferGeometry();
  attr(g, 'position', pos, 3); attr(g, 'aHome', home, 4); attr(g, 'aTurn', turn, 4); attr(g, 'aTone', tone, 3); attr(g, 'aE0', e0, 4); attr(g, 'aE1', e1, 3);
  g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: glsl + DECL + LAW + PLATE_VERT, fragmentShader: glsl + DECL + LIGHT + PLATE_FRAG, side: THREE.DoubleSide }));
}

// ---------------------------------------------------------------- FROST GLITTER
// The frost leaves the ground as a fine glitter: 2 to 5 crystals to a home, strung out in a loose plume (each starts
// a little after its home's own start and stands up to 1.2 m aside of it), 6,000 at most. Each is a point of 1 to 3
// dots of the screen, white with a blue shade, in the suns' and the sky's light; it turns as it rises and so flashes
// now and then (its twinkle: by the clock and by the progress since it let go).
const GLITTER_VERT = /* glsl */`
attribute vec4 aHome, aTurn;
varying vec3 vW; varying vec2 vTw;
void main(){
  float s = aHome.z, g = riseGone(s);
  // (a crystal stands up to 1.2 m aside of its home and drifts three fifths as far as the rest: under 3 m from its home in all)
  vec4 w = modelMatrix * vec4(position + riseAt(aHome.xy, s, aHome.w, aTurn.z, .6), 1.);
  float tw = .5 + .5 * sin(aTurn.y * uTime + aTurn.z + 60. * g);
  vW = w.xyz; vTw = vec2(tw * tw * tw * tw, aTurn.w);
  gl_PointSize = aTurn.x;
  // (no size on the ground: a crystal that has not let go is put out of sight altogether)
  gl_Position = g > 0. ? projectionMatrix * viewMatrix * w : vec4(2., 2., 2., 1.);
}`;
const GLITTER_FRAG = /* glsl */`
varying vec3 vW; varying vec2 vTw;
void main(){
  vec3 toEye = cameraPosition - vW;
  vec3 alb = uFrostCol * mix(vec3(1.), vec3(.8, .92, 1.1), vTw.y);
  vec3 col = alb * (uAmb + (uSunE[0] + uSunE[1] + uSunE[2]) * (.45 + .55 * vTw.x));
  float disc = 1. - smoothstep(.3, .5, length(gl_PointCoord - .5));
  gl_FragColor = vec4(riseAir(col, toEye), disc * (.6 + .4 * vTw.x));
}`;
function makeGlitter(o) {
  const { U, glsl } = o, H = o.homes && o.homes.glitter, MOST = 6000, N = homesOf(H, MOST);
  const pos = [], home = [], turn = [];
  // (homes are taken in their order until the 6,000 crystals are dealt: about 1,700 homes)
  for (let i = 0; i < N && pos.length / 3 < MOST; i++) {
    const x = H[i * 3], z = H[i * 3 + 1], rng = ownOf(o, H, i), s0 = startOf(rng), n = Math.min(5, 2 + Math.floor(rng() * 4));
    for (let k = 0; k < n; k++) {
      const a = rng.range(0, TAU), r = 1.2 * Math.sqrt(rng()), s = Math.min(0.7, s0 + rng.range(0, 0.05)), lift = rng.range(0.86, 1);
      const size = 1 + 2 * Math.pow(rng(), 1.5), rate = rng.range(1.2, 4.5), ph = rng.range(0, TAU), shade = rng();
      // (a crystal past the 6,000th is not kept; the dice of its home are drawn all the same)
      if (pos.length / 3 >= MOST) continue;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); home.push(x, z, s, lift); turn.push(size, rate, ph, shade);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  attr(g, 'position', pos, 3); attr(g, 'aHome', home, 4); attr(g, 'aTurn', turn, 4);
  return new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: glsl + DECL + LAW + GLITTER_VERT, fragmentShader: glsl + DECL + LIGHT + GLITTER_FRAG, transparent: true, depthWrite: false }));
}

// ---------------------------------------------------------------- BEADS of brine
// what brine looks like, for the beads and the ropes: dark in the suns' light, with a soft tint of the sky it faces
// that is strongest where it turns away from the eye. Never a mirror: the tint is a share of the plain air's colour
// (no sun's face in it), bounded, and at most two fifths of what is seen.
const BRINE = /* glsl */`
vec3 riseBrine(vec3 n, vec3 V, float tone){
  vec3 R = reflect(-V, n), up = vec3(R.x, abs(R.y) + .05, R.z);
  vec3 sky = min(tseAir(up / max(length(up), 1e-3)), vec3(.5));
  float k = 1. - clamp(dot(n, V), 0., 1.);
  return mix(riseLit(uBrine * 1.5 * tone + .01, n), sky, .08 + .32 * k * k);
}
`;
// Octahedra (8 triangles each, one to a home) that each hold a rounded bead of 0.15 to 0.9 m: a ball a little taller
// than wide along an axis of its own, which the octahedron just encloses. What is seen of a face is the part of it
// the bead stands behind, and the bead's own roundness lights it: so the brine is a round drop from every side, and
// its turning shows as the slow tumble of its longer way.
const BEAD_VERT = /* glsl */`
attribute vec4 aHome, aTurn; attribute vec3 aTone; attribute vec2 aBall;
varying vec3 vW, vQ, vU, vB;
void main(){
  float s = aHome.z, a = aTurn.w * riseGone(s) + aTone.y * uTime + aTone.x, k = riseSize(s);
  vec3 q = riseTurn(position * k, aTurn.xyz, a);
  vec4 w = modelMatrix * vec4(q + riseAt(aHome.xy, s, aHome.w, aTone.x, 1.), 1.);
  vW = w.xyz; vQ = q; vU = riseTurn(vec3(0., 1., 0.), aTurn.xyz, a); vB = vec3(aBall.x * k, aBall.y, aTone.z);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BEAD_FRAG = /* glsl */`
varying vec3 vW, vQ, vU, vB;
void main(){
  vec3 toEye = cameraPosition - vW, V = toEye / max(length(toEye), 1e-3), u = vU / max(length(vU), 1e-3);
  // the line of sight through this place of the face, met with the bead (measured from the bead's own middle):
  // k squeezes the measure along the bead's longer way (a bead is 1 to 1.2 times as tall as wide, so k is between
  // -0.31 and 0 and A is 0.69 and more; the division is bounded all the same)
  float k = 1. / max(vB.y * vB.y, 1.) - 1., du = -dot(V, u), qu = dot(vQ, u);
  float A = 1. + k * du * du, B = -dot(vQ, V) + k * qu * du, C = dot(vQ, vQ) + k * qu * qu - vB.x * vB.x, D = B * B - A * C;
  if (D < 0.) discard;
  vec3 p = vQ - V * ((-B - sqrt(max(D, 0.))) / max(A, .25)), n = p + k * u * dot(p, u);
  gl_FragColor = vec4(riseAir(riseBrine(n / max(length(n), 1e-4), V, vB.z), toEye), 1.);
}`;
function makeBeads(o) {
  const { U, glsl } = o, H = o.homes && o.homes.beads, N = homesOf(H, 900);
  const pos = [], ball = [], home = [], turn = [], tone = [], idx = [];
  for (let i = 0; i < N; i++) {
    const x = H[i * 3], z = H[i * 3 + 1], rng = ownOf(o, H, i);
    const s = startOf(rng), across = 0.15 + 0.75 * Math.pow(rng(), 2), tall = rng.range(1, 1.2), r = 0.5 * across / tall, lift = rng.range(0.86, 1), ph = rng.range(0, TAU);
    // its axis: any way at all (a point of the ball, dealt evenly)
    const ay = rng.range(-1, 1), aa = rng.range(0, TAU), ar = Math.sqrt(Math.max(0, 1 - ay * ay));
    const w = rng.range(1, 5) * (rng.chance(0.5) ? 1 : -1), wt = rng.range(0.08, 0.3) * (rng.chance(0.5) ? 1 : -1), tn = rng.range(0.8, 1.25), base = pos.length / 3;
    // the octahedron that just encloses the bead (its corners at the square root of three of the bead's half width, and a little over)
    const R = r * Math.sqrt(3) * 1.04;
    for (const c of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      pos.push(c[0] * R, c[1] * R * tall, c[2] * R); ball.push(r, tall);
      home.push(x, z, s, lift); turn.push(Math.cos(aa) * ar, ay, Math.sin(aa) * ar, w); tone.push(ph, wt, tn);
    }
    for (let f = 0; f < 8; f++) {
      const X = f & 1, Y = 2 + ((f >> 1) & 1), Z = 4 + ((f >> 2) & 1), out = ((f & 1) + ((f >> 1) & 1) + ((f >> 2) & 1)) % 2 === 0;
      if (out) idx.push(base + X, base + Y, base + Z); else idx.push(base + X, base + Z, base + Y);
    }
  }
  if (!N) return null;
  const g = new THREE.BufferGeometry();
  attr(g, 'position', pos, 3); attr(g, 'aBall', ball, 2); attr(g, 'aHome', home, 4); attr(g, 'aTurn', turn, 4); attr(g, 'aTone', tone, 3);
  g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: glsl + DECL + LAW + BEAD_VERT, fragmentShader: glsl + DECL + LIGHT + BRINE + BEAD_FRAG }));
}

// ---------------------------------------------------------------- ROPES of brine
// Thin strands 3 to 25 m tall that stand up out of the pool, three-sided and rounded by their normals, tapering to a
// point: 5 lengths of 6 triangles each. A rope's foot stays in its pool; its top is drawn up from nothing by the
// square of the progress since its start and comes to rest at its own full height; it is as thin as it is short
// while it grows. Its upper part leans toward the row's bearing and sways by the clock (the tallest by 2 m and by
// 0.9 m at its top, a shorter one by as much less as it is shorter), and it twists a little as it is drawn. Its
// brine is the beads' brine.
const ROPE_VERT = /* glsl */`
attribute vec4 aHome, aTurn;
varying vec3 vW, vN;
void main(){
  float s = aHome.z, g = riseGone(s), t = position.y, H = max(aHome.w, 1.);
  float h = H * (1. - exp(-240. * g * g / H)), f = h / H, rad = aTurn.x * sqrt(max(f, 0.));
  float tw = 3. * g + 2. * t, c = cos(tw), sn = sin(tw);
  vec2 ring = vec2(position.x * c - position.z * sn, position.x * sn + position.z * c);
  vec2 r = uRowDir.xz / max(length(uRowDir.xz), .05);
  vec2 side = (r * 2. * smoothstep(0., .5, g) + vec2(cos(aTurn.y), sin(aTurn.y)) * .9 * sin(aTurn.z * uTime + aTurn.w + t * 2.)) * t * t * f * min(H / 25., 1.);
  vec4 w = modelMatrix * vec4(aHome.x + side.x + ring.x * rad, t * h, aHome.y + side.y + ring.y * rad, 1.);
  vW = w.xyz; vN = vec3(normal.x * c - normal.z * sn, normal.y, normal.x * sn + normal.z * c);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const ROPE_FRAG = /* glsl */`
varying vec3 vW, vN;
void main(){
  vec3 toEye = cameraPosition - vW;
  gl_FragColor = vec4(riseAir(riseBrine(vN / max(length(vN), 1e-3), toEye / max(length(toEye), 1e-3), 1.), toEye), 1.);
}`;
function makeRopes(o) {
  const { rng, U, glsl } = o, H = o.homes && o.homes.ropes, N = homesOf(H, 140), RINGS = 5;
  const pos = [], nor = [], home = [], turn = [], idx = [];
  for (let i = 0; i < N; i++) {
    const x = H[i * 3], z = H[i * 3 + 1];
    const s = startOf(rng), tall = 3 + 22 * Math.pow(rng(), 1.6), r0 = (0.05 + 0.008 * tall) * rng.range(0.8, 1.25);
    const dir = rng.range(0, TAU), rate = rng.range(0.25, 0.7), ph = rng.range(0, TAU), a0 = rng.range(0, TAU), base = pos.length / 3;
    for (let j = 0; j <= RINGS; j++) {
      // a foot that spreads a little into the pool, then a taper to the point
      const t = j / RINGS, k = j === 0 ? 1.5 : Math.pow(1 - t, 0.7);
      for (let q = 0; q < 3; q++) {
        const a = a0 + q * TAU / 3;
        pos.push(Math.cos(a) * k, t, Math.sin(a) * k); nor.push(Math.cos(a), 0.1, Math.sin(a));
        home.push(x, z, s, tall); turn.push(r0, dir, rate, ph);
      }
    }
    for (let j = 0; j < RINGS; j++) for (let q = 0; q < 3; q++) {
      const a = base + j * 3 + q, b = base + j * 3 + (q + 1) % 3;
      idx.push(a, a + 3, b, b, a + 3, b + 3);
    }
  }
  if (!N) return null;
  const g = new THREE.BufferGeometry();
  attr(g, 'position', pos, 3); attr(g, 'normal', nor, 3); attr(g, 'aHome', home, 4); attr(g, 'aTurn', turn, 4);
  g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: glsl + DECL + LAW + ROPE_VERT, fragmentShader: glsl + DECL + LIGHT + BRINE + ROPE_FRAG, side: THREE.DoubleSide }));
}

// o = { rng, U, glsl, homes: { plates, glitter, beads, ropes } }: rng, the seeded stream every die is drawn from; U,
// the world's shared uniforms (every material here takes them as they are); glsl, the world's string that is put
// first in every shader; homes, for each kind the x, z and metres from the line of flight of every home (a kind
// takes its homes in their order: 2,200 plates, 900 beads, 140 ropes, and frost homes until 6,000 crystals are dealt).
// Returns the group of the four kinds (each one mesh, never culled, drawn in the order 31 to 34), the triangles in
// it (22,400 at most: plates of 3 to 5, beads of 8, ropes of 30) and how to give it up.
export function makeRising(o) {
  const group = new THREE.Group(); group.name = 'tse-rising';
  const kinds = [['tse-rise-plates', 31, makePlates], ['tse-rise-glitter', 32, makeGlitter], ['tse-rise-beads', 33, makeBeads], ['tse-rise-ropes', 34, makeRopes]];
  let triangles = 0;
  // (EACH KIND'S PIECES ARE DEALT FROM A STREAM OF THEIR OWN (o.rngOf, by the kind's name), so that a home more or
  // less of one kind never deals another kind's pieces anew; AND EACH PIECE FROM ITS OWN (o.rngAt, by the kind's name
  // and the number of its home's try), so that a home more or less never deals another piece of its own kind anew;
  // without them, kind after kind from the one stream)
  for (const [name, order, make] of kinds) {
    const m = make(o.rngOf ? { ...o, rng: o.rngOf(name), own: o.rngAt ? (n) => o.rngAt(name, n) : null } : o); if (!m) continue;
    m.name = name; m.renderOrder = order; m.frustumCulled = false;
    if (m.isMesh) triangles += m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3;
    group.add(m);
  }
  return { group, triangles, dispose() { for (const m of group.children) { m.geometry.dispose(); m.material.dispose(); } } };
}
