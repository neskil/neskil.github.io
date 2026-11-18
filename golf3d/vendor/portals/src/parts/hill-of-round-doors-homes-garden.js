// hill-of-round-doors, the homes: ONE GARDEN laid into a geo in the home's own space (x along the front, y up from
// the garden's level, z out from the front toward the lane): porch step and flagged path, picket fence and gate,
// bench, flower beds along the wall and inside the fence, a vegetable patch with cabbages and a bean row, a washing
// line, a barrow, window boxes, a porch lamp, a cat. Everything that stands is asked of `clear(x, y, z)` first (true
// where the flown line is more than 8 m away with a margin): what is not clear is left out or kept lower.
import { DOOR, frontTop } from './hill-of-round-doors-plan.js';
import { KIND, mul, mix } from './hill-of-round-doors-homes-geo.js';
import * as PL from './hill-of-round-doors-homes-plants.js';

const WOODS = [[0.82, 0.8, 0.72], [0.78, 0.7, 0.52], [0.36, 0.27, 0.18]];        // fence paints: white, cream, weathered oak (linear)
const STONE = [0.56, 0.52, 0.44], OAK = [0.3, 0.2, 0.11], CLOTHS = [[0.85, 0.85, 0.82], [0.8, 0.74, 0.6], [0.5, 0.62, 0.8], [0.82, 0.5, 0.46]];

// a run of pickets from (x0, z0) to (x1, z1) (along x or along z), facing (nx, nz): posts, two rails, pointed pales;
// k: how high it stands (1: 1.3 m)
export function fence(G, x0, z0, x1, z1, nx, nz, col, k = 1) {
  const len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len, n = Math.max(2, Math.round(len / 0.3)), dark = mul(col, 0.7);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n * len, cx = x0 + dx * t, cz = z0 + dz * t, w = 0.075, h = (1.02 + 0.06 * ((i * 7) % 3)) * k;
    const a = G.vert(cx - dx * w, 0.06, cz - dz * w, nx, 0, nz, dark, KIND.PAINT), b = G.vert(cx + dx * w, 0.06, cz + dz * w, nx, 0, nz, dark, KIND.PAINT);
    const c = G.vert(cx + dx * w, h, cz + dz * w, nx, 0, nz, col, KIND.PAINT), d = G.vert(cx - dx * w, h, cz - dz * w, nx, 0, nz, col, KIND.PAINT), e = G.vert(cx, h + 0.16 * k, cz, nx, 0, nz, col, KIND.PAINT);
    G.tri(a, b, c); G.tri(a, c, d); G.tri(d, c, e);
  }
  const bx = Math.abs(dx) > 0.5;
  for (const y of [0.3 * k, 0.8 * k]) G.box(Math.min(x0, x1) - (bx ? 0 : 0.03), y, Math.min(z0, z1) - (bx ? 0.03 : 0), Math.max(x0, x1) + (bx ? 0 : 0.03), y + 0.1, Math.max(z0, z1) + (bx ? 0.03 : 0), dark, KIND.PAINT, 0, { skip: 'b' });
  const posts = Math.max(1, Math.round(len / 2.4));
  for (let i = 0; i <= posts; i++) { const px = x0 + (x1 - x0) * i / posts, pz = z0 + (z1 - z0) * i / posts; G.box(px - 0.09, -0.1, pz - 0.09, px + 0.09, 1.34 * k, pz + 0.09, col, KIND.PAINT, 0, { skip: 'b', low: dark }); }
}

// a garden bench with a back, its seat along x, facing +z, at (x, z)
export function bench(G, x, z, len, col) {
  const h = len / 2, dark = mul(col, 0.65);
  G.box(x - h, 0.86, z - 0.3, x + h, 0.96, z + 0.38, col, KIND.BOARDS, 0.23);
  G.box(x - h, 1.2, z - 0.36, x + h, 1.75, z - 0.28, col, KIND.BOARDS, 0.3);
  for (const sx of [-1, 1]) {
    const px = x + sx * (h - 0.1);
    G.box(px - 0.07, 0, z - 0.36, px + 0.07, 1.8, z - 0.24, dark, KIND.PAINT, 0, { skip: 'b' });
    G.box(px - 0.07, 0, z + 0.26, px + 0.07, 1.22, z + 0.38, dark, KIND.PAINT, 0, { skip: 'b' });
    G.box(px - 0.08, 1.22, z - 0.36, px + 0.08, 1.31, z + 0.42, col, KIND.PAINT);
  }
}

// a wooden barrow standing at (x, z), its wheel toward (fx, fz)
function barrow(G, x, z, fx, fz, col) {
  G.pushYaw(x, 0, z, fx, fz);
  const dark = mul(col, 0.6);
  G.poly([[-0.45, 0.62, -0.75], [0.45, 0.62, -0.75], [0.3, 0.62, 0.55], [-0.3, 0.62, 0.55]], dark, KIND.BOARDS, 0.2, { out: [0, 1, 0] });
  for (const s of [-1, 1]) G.poly([[s * 0.45, 0.62, -0.75], [s * 0.3, 0.62, 0.55], [s * 0.42, 1.06, 0.72], [s * 0.6, 1.06, -0.9]], col, KIND.BOARDS, 0.2, { out: [s, 0.3, 0] });
  G.poly([[-0.3, 0.62, 0.55], [0.3, 0.62, 0.55], [0.42, 1.06, 0.72], [-0.42, 1.06, 0.72]], col, KIND.BOARDS, 0.2, { out: [0, 0.3, 1] });
  G.poly([[-0.45, 0.62, -0.75], [0.45, 0.62, -0.75], [0.6, 1.06, -0.9], [-0.6, 1.06, -0.9]], col, KIND.BOARDS, 0.2, { out: [0, 0.3, -1] });
  G.tube([-0.09, 0.42, 0.95], [0.09, 0.42, 0.95], 0.42, 0.42, 10, dark, KIND.PAINT, 0, { caps: true });
  for (const s of [-1, 1]) {
    G.tube([s * 0.36, 0.86, -0.7], [s * 0.5, 0.98, -1.75], 0.04, 0.035, 4, col, KIND.PAINT);
    G.tube([s * 0.3, 0.62, 0.3], [s * 0.12, 0.42, 0.95], 0.04, 0.04, 4, dark, KIND.PAINT);
    G.box(s * 0.4 - 0.04, 0, -0.55, s * 0.4 + 0.04, 0.62, -0.45, dark, KIND.PAINT, 0, { skip: 'bt' });
  }
  G.pop();
}

// a washing line between two posts along x at depth z: cloths (plain sheets and towels) the wind stirs
function washing(G, x0, x1, z, r) {
  for (const px of [x0, x1]) { G.box(px - 0.07, 0, z - 0.07, px + 0.07, 2.75, z + 0.07, OAK, KIND.PAINT, 0, { skip: 'b' }); G.box(px - 0.4, 2.6, z - 0.05, px + 0.4, 2.7, z + 0.05, OAK, KIND.PAINT); }
  G.tube([x0, 2.66, z + 0.03], [x1, 2.66, z + 0.03], 0.02, 0.02, 3, [0.7, 0.68, 0.6], KIND.PAINT);
  let x = x0 + 0.35;
  for (let k = 0; k < 6 && x < x1 - 0.6; k++) {
    const w = 0.5 + 0.7 * r(), h = 0.8 + 1.0 * r(), c = CLOTHS[Math.floor(r() * CLOTHS.length)], gap = 0.12 + 0.3 * r();
    if (x + w > x1 - 0.3) break;
    const rows = 3, first = G.vertices;
    for (let j = 0; j <= rows; j++) for (const xx of [x, x + w]) G.vert(xx, 2.64 - h * j / rows, z + 0.03, 0, 0.1, 1, mul(c, 1 - 0.12 * j / rows), KIND.PLASTER, xx * 3, j, 0, 0.3 * (j / rows) * (j / rows));
    for (let j = 0; j < rows; j++) { const a = first + j * 2; G.tri(a, a + 1, a + 2); G.tri(a + 1, a + 3, a + 2); }
    x += w + gap;
  }
}

// window boxes in the door's own paint, and a lantern on a bracket beside the door (alight by the look)
export function layWallDress(G, d, r, clear, limit = 0) {
  for (const w of d.windows) {
    const ro = w.r + 0.17, y = w.y - ro - 0.02, half = Math.min(ro * 0.8, Math.abs(w.x) - limit), x0 = w.x - half, x1 = w.x + half, col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)];
    if (half < 0.4 || !clear(x0, y, 0.4) || !clear(x1, y, 0.4)) continue;
    G.box(x0, y, 0.05, x1, y + 0.32, 0.46, d.paint, KIND.PAINT, 0, { skip: 'kt', low: mul(d.paint, 0.6) });
    PL.boxFlowers(G, x0 + 0.06, x1 - 0.06, y + 0.3, 0.27, col, r);
  }
  const s = d.hinge, x = s * (d.door.r + d.door.rimW + 0.22), y = d.door.y + d.door.r * 0.62, iron = d.iron;
  if (!clear(x, y, 0.4)) return;
  G.box(x - 0.03, y + 0.36, 0, x + 0.03, y + 0.42, 0.42, iron, KIND.PAINT);
  G.tube([x, y + 0.36, 0.36], [x, y + 0.24, 0.36], 0.015, 0.015, 3, iron, KIND.PAINT);
  G.tube([x, y + 0.14, 0.36], [x, y + 0.26, 0.36], 0.17, 0.02, 6, iron, KIND.PAINT, 0, { caps: true });
  G.tube([x, y - 0.2, 0.36], [x, y - 0.16, 0.36], 0.1, 0.13, 6, iron, KIND.PAINT, 0, { caps: true });
  for (let k = 0; k < 4; k++) { const t = k / 4 * 6.283 + 0.785, px = x + Math.cos(t) * 0.13, pz = 0.36 + Math.sin(t) * 0.13; G.tube([px, y - 0.16, pz], [px, y + 0.14, pz], 0.012, 0.012, 3, iron, KIND.PAINT); }
  G.ball(x, y - 0.03, 0.36, 0.085, 6, 4, [1, 0.7, 0.3], KIND.FLAME, G.phase(x, y, 0.36), 1, 1.4, 1);   // its flicker's phase by its place in the world
}

// a sitting cat at (x, y, z) looking toward +z: body, head, ears, a tail the wind does not move but which curls
export function cat(G, x, y, z, col) {
  const dark = mul(col, 0.6);
  G.ball(x, y + 0.3, z, 0.26, 7, 5, col, KIND.PAINT, 0, 0.85, 1.15, 1, dark);
  G.ball(x, y + 0.66, z + 0.1, 0.17, 7, 5, col, KIND.PAINT, 0, 1, 0.9, 0.95, dark);
  for (const s of [-1, 1]) G.poly([[x + s * 0.03, y + 0.76, z + 0.1], [x + s * 0.16, y + 0.76, z + 0.1], [x + s * 0.11, y + 0.93, z + 0.1]], col, KIND.PAINT, 0, { out: [0, 0, 1] });
  G.tube([x + 0.16, y + 0.1, z - 0.12], [x + 0.42, y + 0.06, z + 0.16], 0.055, 0.04, 5, col, KIND.PAINT, 0, { cb: dark });
}

// THE GARDEN. r: the home's garden stream; clear(x, y, z): is this place clear of the flown line; tier: 'near',
// 'mid' or 'far'. Returns the places hens may peck ([x, z, turn] in the home's space).
export function layGarden(G, home, d, r, clear, tier, density) {
  const w = home.w, rich = tier === 'near' || tier === 'top', stone = STONE, wood = WOODS[Math.floor(r() * WOODS.length)], theme = Math.floor(r() * 3), vs = r() < 0.5 ? -1 : 1, benchSide = r() < 0.5 ? -1 : 1;
  const seedCat = r(), drying = r() < 0.7;
  // the porch step and the flagged path
  const lift = G.lift; G.lift = null;                                   // the steps lie level whatever the ground does
  G.box(-1.9, -0.4, 0, 1.9, 0.25, 2.1, stone, KIND.FLAGS, 0, { skip: 'bk', low: mul(stone, 0.7) });
  G.box(-1.45, 0.25, 0, 1.45, DOOR.sill - 0.02, 1.3, mul(stone, 1.1), KIND.FLAGS, 0, { skip: 'bk', low: mul(stone, 0.8) });
  G.lift = lift;
  if (tier === 'far') return layFarBeds(G, home, d, r, clear);
  // the fence line: as far out as the flown line's clear air lets a 1.5 m thing stand, at most 6 m
  let fz = 6; for (let k = 0; k < 16 && !(clear(-w - 1, 1.6, fz) && clear(0, 1.6, fz) && clear(w + 1, 1.6, fz)); k++) fz -= 0.25;
  const fenced = fz >= 2.9, gx = 1.15, fx = w + 1.0;
  G.poly([[-1, 0.05, 2.1], [1, 0.05, 2.1], [1, 0.05, fz + 0.5], [-1, 0.05, fz + 0.5]], stone, KIND.FLAGS, 0, { out: [0, 1, 0] });
  if (fenced) {
    fence(G, -fx, fz, -gx, fz, 0, 1, wood); fence(G, gx, fz, fx, fz, 0, 1, wood);
    fence(G, -fx, 0.5, -fx, fz, -1, 0, wood); fence(G, fx, 0.5, fx, fz, 1, 0, wood);
    for (const s of [-1, 1]) G.box(s * gx - 0.11, -0.1, fz - 0.11, s * gx + 0.11, 1.62, fz + 0.11, wood, KIND.PAINT, 0, { skip: 'b', low: mul(wood, 0.7) });
    G.pushYaw(-gx + 0.12, 0, fz, Math.sin(0.95), Math.cos(0.95));       // the gate, standing half open into the garden
    fence(G, 0.06, 0, 2 * gx - 0.3, 0, 0, 1, wood);
    G.pop();
  }
  const inner = tier === 'top' ? 8.7 : 2.2, bx = benchSide * (tier === 'top' ? w - 1.5 : Math.min(w - 2.2, 4.6));
  const seat = clear(bx - 1.2, 1.9, 0.75) && clear(bx + 1.2, 1.9, 0.75);
  if (seat) bench(G, bx, 0.75, 2.3, rich ? mix(wood, OAK, 0.5) : wood);
  if (seat && rich && seedCat < 0.34) cat(G, bx + 0.7 * benchSide, 0.96, 0.8, seedCat < 0.17 ? [0.62, 0.32, 0.1] : [0.09, 0.08, 0.08]);
  layBeds(G, home, d, r, clear, { fz, fenced, bx: seat ? bx : 99, theme, density, rich, inner, henSide: rich ? -vs : 0 });
  const hens = [];
  if (!rich || !fenced) return hens;
  // the vegetable patch on one side of the path, the drying green on the other
  const x0 = 2.3, x1 = w - 0.4, zv = [2.9, 3.9, 4.9].filter((z) => z < fz - 1.5);
  zv.forEach((z, k) => {
    if (k === 1 && clear(vs * (x0 + x1) / 2, 3.2, z)) { PL.beans(G, vs * x0, z, vs, 0, x1 - x0, 2.9, r); return; }
    for (let x = x0 + 0.3; x < x1; x += 1.0) PL.cabbage(G, vs * x, z, k === 2 ? 0.7 : 1, r);
  });
  if (zv.length) G.poly([[vs * x0 - 0.3 * vs, 0.04, 2.4], [vs * x1, 0.04, 2.4], [vs * x1, 0.04, zv[zv.length - 1] + 0.6], [vs * x0 - 0.3 * vs, 0.04, zv[zv.length - 1] + 0.6]], [0.2, 0.13, 0.08], KIND.EARTH, 0, { out: [0, 1, 0] });
  const zl = Math.min(2.35, fz - 2), dry = drying && zl > 2.2 && clear(-vs * 4, 2.9, zl), way = r() < 0.5 ? 1 : -1, j = [r(), r(), r()];
  if (dry) washing(G, -vs * 2.4 - (vs > 0 ? x1 - 2.6 : 0), -vs * 2.4 + (vs < 0 ? x1 - 2.6 : 0), zl, r);
  barrow(G, vs * (x1 - 0.5), Math.min(fz - 1.6, 5.2), -vs * 0.8, 0.6, OAK);
  // hens on the drying green, in a row and all one way, each with room to peck: a hen that moves keeps clear of
  // the cloths, the roses and the next hen
  const hz = fz - 2.1, nh = Math.min(3, Math.floor((x1 - 2.4) / 1.9));
  if (hz >= (dry ? zl + 0.77 : 2.45)) for (let k = 0; k < nh; k++) hens.push([-vs * (3.3 + k * 1.9 + 0.1 * j[k]), hz, way * Math.PI / 2]);
  return hens;
}

// one tall flower by the garden's theme (0 hollyhocks, 1 sunflowers, 2 lupins and hollyhocks), no taller than `cap`
function tall(G, x, z, theme, cap, r) {
  const pick = r(), kind = theme === 0 ? (pick < 0.75 ? 0 : 1) : theme === 1 ? (pick < 0.7 ? 1 : 0) : (pick < 0.6 ? 2 : 0), size = r();
  if (kind === 0) PL.hollyhock(G, x, z, Math.min(cap, 2.5 + 1.1 * size), PL.BLOOMS.hollyhock[Math.floor(r() * PL.BLOOMS.hollyhock.length)], r);
  else if (kind === 1) PL.sunflower(G, x, z, Math.min(cap, 2.5 + 0.9 * size), r);
  else PL.lupin(G, x, z, Math.min(cap, 1.5 + 0.8 * size), PL.BLOOMS.lupin[Math.floor(r() * PL.BLOOMS.lupin.length)], r);
}

// the beds: tall flowers against the wall (clear of the windows and of the bench), low ones in drifts of one
// colour before them; roses and drifts inside the fence
function layBeds(G, home, d, r, clear, o) {
  const w = home.w, earth = [0.2, 0.13, 0.08], k = (o.rich ? 1 : 1.7) / o.density, lean = !o.rich;      // (a garden far from the line is built of fewer faces)
  for (const s of [-1, 1]) {
    G.poly([[s * o.inner, 0.035, 0.28], [s * (w - 0.35), 0.035, 0.28], [s * (w - 0.35), 0.035, 1.6], [s * o.inner, 0.035, 1.6]], earth, KIND.EARTH, 0, { out: [0, 1, 0] });
    for (let x = o.inner + 0.3; x < w - 0.6; x += 0.85 * k) {
      const jx = (r() - 0.5) * 0.3, jz = r() * 0.25, px = s * (x + jx), cap = Math.max(1.2, frontTop(home, px) + 0.3);
      const byWindow = d.windows.some((q) => Math.abs(px - q.x) < q.r + 0.3), byBench = Math.abs(px - o.bx) < 1.5;
      if (byBench || !clear(px, 1, 0.6)) continue;
      if (byWindow || !clear(px, Math.min(cap, 3.6), 0.6)) { PL.drift(G, px, 0.55 + jz, 0.7, PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)], r, lean); continue; }
      tall(G, px, 0.5 + jz, o.theme, cap, r);
    }
    let col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)], run = 0;
    for (let x = o.inner + 0.2; x < w - 0.5; x += 0.52 * k) {
      if (run-- <= 0) { col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)]; run = 2 + Math.floor(r() * 4); }
      const px = s * (x + (r() - 0.5) * 0.2), pz = 1.15 + r() * 0.3, hh = 0.45 + 0.35 * r();
      if (Math.abs(px - o.bx) < 1.4 || !clear(px, 1, pz)) continue;
      PL.drift(G, px, pz, hh, col, r, lean);
    }
  }
  if (!o.fenced) return;
  const fz = o.fz, fx = w + 0.55;
  for (const s of [-1, 1]) {
    G.poly([[s * 1.7, 0.035, fz - 1.4], [s * fx, 0.035, fz - 1.4], [s * fx, 0.035, fz - 0.2], [s * 1.7, 0.035, fz - 0.2]], earth, KIND.EARTH, 0, { out: [0, 1, 0] });
    for (let x = 2.3; x < fx - 0.5; x += 1.75 * k) {
      const px = s * (x + (r() - 0.5) * 0.3), hh = 1.3 + 0.7 * r(), col = PL.BLOOMS.rose[Math.floor(r() * PL.BLOOMS.rose.length)];
      if (s === o.henSide) PL.drift(G, px, fz - 0.7, 0.6, col, r, lean);            // the hens' side keeps low: no bush where a hen pecks
      else if (clear(px, hh + 0.3, fz - 0.85)) PL.rose(G, px, fz - 0.85, hh, col, r, lean); else PL.drift(G, px, fz - 0.85, 0.6, col, r, lean);
    }
    let col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)], run = 0;
    for (let x = 1.9; x < fx - 0.3; x += 0.6 * k) {
      if (run-- <= 0) { col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)]; run = 2 + Math.floor(r() * 4); }
      PL.drift(G, s * (x + (r() - 0.5) * 0.2), fz - 0.45 - r() * 0.25, 0.4 + 0.3 * r(), col, r, lean);
    }
  }
}

// a far home's garden: a few broad drifts of colour against the wall, cheap and true from afar
function layFarBeds(G, home, d, r, clear) {
  for (const s of [-1, 1]) for (let x = 2.7; x < home.w - 0.6; x += 1.25) {
    const px = s * (x + (r() - 0.5) * 0.3), col = PL.BLOOMS.low[Math.floor(r() * PL.BLOOMS.low.length)], hh = 0.8 + 0.6 * r();
    if (d.windows.some((q) => Math.abs(px - q.x) < q.r) || !clear(px, hh, 0.8)) continue;
    PL.drift(G, px, 0.8, hh, col, r);
  }
  return [];
}
