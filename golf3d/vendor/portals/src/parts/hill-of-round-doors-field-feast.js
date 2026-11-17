// hill-of-round-doors, the field builder's part: THE FEAST laid under and about the party tree, and the made things by
// the mill. Trestle tables with white cloths, hemmed and with a bright runner, laid with food that has its own form
// (tiered cakes, pies, long and round loaves, bowls of fruit, cheeses on plates, jugs with mugs about them); benches;
// round tents and ridge tents of striped cloth with valances, poles and finials; casks upright and on stands; a cart
// with casks and sacks; two ponies grazing. All of it is laid into one Solid in frames that stand on the plan's
// ground, takes the scene's light and the lanterns' painted light, and does not move. No one sits at the tables.
import { MILL, ROAD } from './hill-of-round-doors-plan.js';
import { KIND, TAU, mul3, limb, turned, Solid } from './hill-of-round-doors-field-geo.js';

const ball = (G, at, r, c, sides = 5) => turned(G, at, [[0.001, 0], [r * 0.85, r * 0.45], [r * 0.85, r * 1.45], [0.001, r * 1.95]], { sides, c });
// a round end for a cask or a wheel's hub: a fan about the middle c, facing along x (s: +1 or -1)
function disc(G, c, s, r, col, sides = 9) {
  for (let k = 0; k < sides; k++) {
    const a0 = TAU * k / sides, a1 = TAU * (k + 1) / sides, p = (a) => [c[0], c[1] + r * Math.cos(a), c[2] + r * Math.sin(a)];
    if (s > 0) G.tface(c, p(a0), p(a1), col, KIND.planks); else G.tface(c, p(a1), p(a0), col, KIND.planks);
  }
}

// THE FOOD: each takes a place on the table's top (at) and its dice
const FOOD = [
  (G, rng, at, P) => {                                           // a tiered cake, iced, a cherry on top
    const ice = P.icing[Math.floor(rng() * P.icing.length)], s = 0.85 + 0.4 * rng();
    turned(G, at, [[0.001, 0], [0.27 * s, 0], [0.27 * s, 0.15 * s], [0.19 * s, 0.16 * s], [0.19 * s, 0.29 * s], [0.12 * s, 0.3 * s], [0.12 * s, 0.4 * s], [0.001, 0.41 * s]], { sides: 9, col: (i) => (i === 2 || i === 4 || i === 6 ? mul3(ice, 1.08) : mul3(ice, 0.82)) });
    ball(G, [at[0], at[1] + 0.4 * s, at[2]], 0.045, P.red);
  },
  (G, rng, at, P) => turned(G, at, [[0.001, 0], [0.23, 0], [0.27, 0.07], [0.21, 0.1], [0.1, 0.135], [0.001, 0.145]], { sides: 8, kind: KIND.crust, col: (i) => (i === 2 ? mul3(P.crust, 0.7) : P.crust) }),   // a pie
  (G, rng, at, P) => turned(G, at, [[0.001, 0], [0.12, 0.01], [0.15, 0.08], [0.11, 0.15], [0.001, 0.17]], { sides: 6, kind: KIND.crust, c: mul3(P.crust, 0.8 + 0.3 * rng()), squash: [2.1, 1] }),   // a long loaf
  (G, rng, at, P) => turned(G, at, [[0.001, 0], [0.17, 0.02], [0.2, 0.1], [0.13, 0.19], [0.001, 0.22]], { sides: 7, kind: KIND.crust, c: mul3(P.crust, 0.75 + 0.3 * rng()) }),                    // a round loaf
  (G, rng, at, P) => {                                           // a bowl of fruit
    turned(G, at, [[0.08, 0], [0.11, 0.02], [0.21, 0.1], [0.23, 0.12]], { sides: 8, c: P.pot });
    for (let k = 0; k < 4; k++) { const a = TAU * (k + rng()) / 3, r = k < 3 ? 0.09 : 0; ball(G, [at[0] + r * Math.cos(a), at[1] + (k < 3 ? 0.06 : 0.14), at[2] + r * Math.sin(a)], 0.062, P.fruit[Math.floor(rng() * P.fruit.length)]); }
  },
  (G, rng, at, P) => {                                           // a cheese on a plate
    turned(G, at, [[0.001, 0.005], [0.13, 0.005], [0.17, 0.03]], { sides: 8, c: P.plate });
    turned(G, at, [[0.001, 0.01], [0.115, 0.01], [0.12, 0.09], [0.001, 0.095]], { sides: 8, c: P.cheese });
  },
  (G, rng, at, P) => {                                           // a jug, and mugs about it
    const c = rng() < 0.5 ? P.pot : P.glaze;
    turned(G, at, [[0.001, 0], [0.075, 0], [0.105, 0.06], [0.115, 0.15], [0.07, 0.25], [0.055, 0.31], [0.078, 0.35]], { sides: 7, c });
    G.beam([at[0] + 0.06, at[1] + 0.3, at[2]], [at[0] + 0.17, at[1] + 0.22, at[2]], 0.03, 0.03, c); G.beam([at[0] + 0.17, at[1] + 0.22, at[2]], [at[0] + 0.11, at[1] + 0.1, at[2]], 0.03, 0.03, c);
    for (let k = 0, n = 2 + Math.floor(rng() * 2); k < n; k++) { const a = rng() * TAU, r = 0.24 + 0.1 * rng(); turned(G, [at[0] + r * Math.cos(a), at[1], at[2] + r * Math.sin(a) * 0.6], [[0.001, 0], [0.045, 0], [0.052, 0.115], [0.04, 0.115], [0.001, 0.1]], { sides: 6, col: (i) => (i > 2 ? P.ale : P.mug) }); }
  },
];

// a trestle table L metres long (along the frame's x), laid; its benches. Its feet are at the frame's y.
const FS = 1.55;                                                // the feast's food is big: it is seen from the air
// the frame's place for a local point (so that a thing just laid can be grown about its own foot, or a rope's ends told)
export const world = (G, q) => { const f = G.f; return f ? [f[0] + q[0] * f[3] + q[2] * f[4], f[1] + q[1], f[2] - q[0] * f[4] + q[2] * f[3]] : q; };
const grow = (G, n0, at, k) => { const c = world(G, at); for (let i = n0; i < G.count; i++) for (let j = 0; j < 3; j++) G.p[i * 3 + j] = c[j] + (G.p[i * 3 + j] - c[j]) * k; };
export function table(G, rng, L, P, great) {
  const h = 0.78, w = 1.3, ex = L / 2 - 0.55, bright = rng() < 0.6, cloth = bright ? P.runners[Math.floor(rng() * P.runners.length)] : P.cloth, run = bright ? P.cloth : P.runners[Math.floor(rng() * P.runners.length)], drop = 0.34 + 0.12 * rng();
  for (const s of [-1, 1]) { for (const k of [-1, 1]) G.beam([s * ex, h - 0.06, k * 0.1], [s * ex, -0.12, k * 0.44], 0.09, 0.07, P.wood, KIND.plain, [1, 0, 0]); G.beam([s * ex, 0.36, -0.3], [s * ex, 0.36, 0.3], 0.06, 0.08, P.wood, KIND.plain); }
  G.beam([-ex, 0.36, 0], [ex, 0.36, 0], 0.07, 0.1, P.wood, KIND.plain);
  G.box([-L / 2, h - 0.06, -w / 2], [L / 2, h, w / 2], P.wood, KIND.planks, 'xXzZy');
  // the cloth: its top, and its fall along both sides and both ends with a hem that rises and dips; the runner on it
  const y = h + 0.012, n = Math.max(4, Math.round(L / 0.8)), ox = L / 2 + 0.03, oz = w / 2 + 0.03;
  G.face([-ox, y, oz], [ox, y, oz], [ox, y, -oz], [-ox, y, -oz], cloth, KIND.cloth);
  G.face([-ox + 0.2, y + 0.006, 0.26], [ox - 0.2, y + 0.006, 0.26], [ox - 0.2, y + 0.006, -0.26], [-ox + 0.2, y + 0.006, -0.26], run, KIND.cloth);
  const hem = (i) => y - drop + (i % 2 ? 0.07 : 0);
  for (const s of [1, -1]) for (let i = 0; i < n; i++) {
    const x0 = -ox + 2 * ox * i / n, x1 = -ox + 2 * ox * (i + 1) / n, z = s * (oz + 0.015), shade = mul3(cloth, 0.86);
    const A = [x0, hem(i), z], B = [x1, hem(i + 1), z], Cc = [x1, y, s * oz], D = [x0, y, s * oz];
    if (s > 0) G.face(A, B, Cc, D, (p) => (p[1] < y - 0.05 ? shade : cloth), KIND.cloth); else G.face(B, A, D, Cc, (p) => (p[1] < y - 0.05 ? shade : cloth), KIND.cloth);
  }
  for (const s of [1, -1]) { const x = s * (ox + 0.015), A = [x, y - drop, s * oz], B = [x, y - drop, -s * oz], Cc = [s * ox, y, -s * oz], D = [s * ox, y, s * oz]; G.face(A, B, Cc, D, mul3(cloth, 0.9), KIND.cloth); }
  // the food along it
  for (let x = -L / 2 + 0.6 + 0.2 * rng(); x < L / 2 - 0.5; x += 0.95 + 0.4 * rng()) {
    const f = FOOD[Math.floor(rng() * FOOD.length)], at = [x, y + 0.008, (rng() - 0.5) * 0.3], n0 = G.count;
    if (great && Math.abs(x) < 1.2) continue;
    f(G, rng, at, P); grow(G, n0, at, FS);
  }
  if (great) {                                                  // one great cake of five tiers, with a red fruit on each step and on top
    const ice = P.icing[0], pink = P.icing[1], prof = [[0.001, 0]];
    for (let t = 0; t < 5; t++) { const r = 0.56 - 0.1 * t; prof.push([r, t * 0.24], [r, t * 0.24 + 0.23]); }
    prof.push([0.001, 1.2]);
    turned(G, [0, y, 0], prof, { sides: 12, col: (i) => (i % 2 ? pink : ice) });
    for (let t = 0; t < 5; t++) for (let k = 0; k < 6; k++) { const a = TAU * (k + t * 0.5) / 6, r = 0.51 - 0.1 * t; ball(G, [r * Math.cos(a), y + t * 0.24 + 0.23, r * Math.sin(a)], 0.035, P.red, 4); }
    ball(G, [0, y + 1.2, 0], 0.07, P.red, 6);
  }
}
export function bench(G, L, P) {
  G.box([-L / 2, 0.42, -0.15], [L / 2, 0.47, 0.15], P.wood, KIND.planks);
  for (const s of [-1, 0, 1]) G.box([s * (L / 2 - 0.3) - 0.03, -0.1, -0.13], [s * (L / 2 - 0.3) + 0.03, 0.42, 0.13], mul3(P.wood, 0.85), KIND.plain, 'xXzZ');
}

// a picnic rug spread on the grass: a chequered cloth, a wicker hamper with its lid ajar, two dishes and cushions
function rug(G, rng, P) {
  const w = 1.5, d = 1.15, a = P.runners[Math.floor(rng() * P.runners.length)], b = P.cloth, wick = mul3(P.sack, 0.8), n0 = G.count;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x0 = -w + 2 * w * i / 4, x1 = -w + 2 * w * (i + 1) / 4, z0 = -d + 2 * d * j / 3, z1 = -d + 2 * d * (j + 1) / 3;
    G.face([x0, 0.05, z1], [x1, 0.05, z1], [x1, 0.05, z0], [x0, 0.05, z0], (i + j) % 2 ? a : b, KIND.cloth);
  }
  G.box([-1.05, 0.05, -0.3], [-0.35, 0.42, 0.24], wick, KIND.thatch, 'xXzZ'); G.box([-1.08, 0.42, -0.33], [-0.32, 0.47, 0.27], mul3(wick, 0.82), KIND.thatch);
  G.face([-1.08, 0.47, 0.27], [-0.32, 0.47, 0.27], [-0.32, 0.82, 0.02], [-1.08, 0.82, 0.02], mul3(wick, 1.1), KIND.thatch);
  { const at = [0.45, 0.06, -0.2], f = FOOD[Math.floor(rng() * FOOD.length)], m0 = G.count; f(G, rng, at, P); grow(G, m0, at, 1.45); }
  for (const [x, z] of [[1.15, -0.7], [-0.15, 0.78]]) { const c = P.runners[Math.floor(rng() * P.runners.length)]; G.box([x - 0.28, 0.05, z - 0.24], [x + 0.28, 0.19, z + 0.24], c, KIND.cloth, 'xXzZY'); }   // cushions
  return G.count - n0;
}

// a heap of firewood: split logs stacked in rows between two stakes
function woodpile(G, rng, P) {
  const bark = mul3(P.wood, 0.6);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) {
    const r = 0.13 + 0.04 * rng(), z = (i - (5 - row) / 2) * 0.33 + 0.03 * (rng() - 0.5), y = 0.14 + row * 0.27, x = 0.08 * (rng() - 0.5), tone = mul3(bark, 0.85 + 0.4 * rng());
    limb(G, [[x - 0.55, y, z], [x + 0.55, y, z]], [r, r], { sides: 6, kind: KIND.bark, c0: tone, c1: tone });
  }
  for (const s of [-1, 1]) limb(G, [[0, -0.2, s * 1.12], [0, 1.25, s * 1.12]], [0.05, 0.04], { sides: 5, kind: KIND.plain, cap: false, c0: P.wood, c1: P.wood });
}

// a guy rope from the frame's point a (a pole's head or an eave) out and down to a peg in the grass at b: the rope is
// told in the world's places (for the strings' ribbons), the peg is driven aslant
function guy(G, a, b, ropes, P) {
  ropes.push([world(G, a), world(G, [b[0], 0.12, b[2]])]);
  const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
  G.beam([b[0] + dx / l * 0.12, 0.36, b[2] + dz / l * 0.12], [b[0] - dx / l * 0.06, -0.12, b[2] - dz / l * 0.06], 0.07, 0.07, P.wood, KIND.plain);
}

// THE MARQUEE: a big open-sided tent, its striped roof on poles, a pointed valance all round, guy ropes to pegs.
// -> the heads of its three king poles, in the world's places
export function marquee(G, rng, P, pair, ropes) {
  const L = 15, w = 4.6, hw = 2.7, top = 5.4, n = 12, [c1, c2] = pair, x = L / 2, kings = [];
  for (let k = 0; k < n; k++) {
    const x0 = -x + L * k / n, x1 = x0 + L / n, c = k % 2 ? c1 : c2, o = k % 2 ? c2 : c1;
    for (const s of [1, -1]) {
      G.face([x0, hw, s * w], [x1, hw, s * w], [x1, top, 0], [x0, top, 0], s > 0 ? c : mul3(c, 0.92), KIND.cloth);
      G.tface([x0, hw, s * (w + 0.02)], [x1, hw, s * (w + 0.02)], [(x0 + x1) / 2, hw - 0.6, s * (w + 0.05)], o, KIND.cloth);
    }
  }
  for (const s of [1, -1]) {
    G.tface([s * x, hw, w], [s * x, hw, -w], [s * x, top, 0], c2, KIND.cloth);
    for (let k = 0; k < 6; k++) { const z0 = -w + 2 * w * k / 6, z1 = z0 + 2 * w / 6; G.tface([s * (x + 0.02), hw, z0], [s * (x + 0.02), hw, z1], [s * (x + 0.05), hw - 0.6, (z0 + z1) / 2], k % 2 ? c1 : c2, KIND.cloth); }
    for (let k = 0; k < 5; k++) {
      const px = -x + L * k / 4;
      limb(G, [[px, -0.2, s * w], [px, hw + 0.05, s * w]], [0.08, 0.07], { sides: 5, kind: KIND.plain, c0: P.wood, c1: P.wood, cap: false });
      guy(G, [px, hw, s * w], [px, 0, s * (w + 2.4)], ropes, P);
    }
  }
  for (const s of [-1, 0, 1]) {
    limb(G, [[s * x * 0.98, -0.2, 0], [s * x * 0.98, top + 0.8, 0]], [0.11, 0.08], { sides: 6, kind: KIND.plain, c0: P.wood, c1: P.wood, cap: false });
    ball(G, [s * x * 0.98, top + 0.75, 0], 0.14, P.gold, 6); kings.push(world(G, [s * x * 0.98, top + 0.8, 0]));
    if (s) guy(G, [s * x, top, 0], [s * (x + 3.4), 0, 0], ropes, P);
  }
  return kings;
}

// a round tent of striped gores, R metres across its wall: wall (one gore left open for a door), a bell of a roof,
// a valance in the other colour, the pole's head and a finial
export function roundTent(G, rng, R, P, pair, ropes) {
  const n = 12, hw = 2.3, top = hw + R * 0.9, mid = hw + (top - hw) * 0.45, a0 = rng() * TAU, door = Math.floor(rng() * n), [c1, c2] = pair;
  for (let k = 0; k < n; k++) {
    const p = (j, r, y) => [r * Math.cos(a0 + TAU * (k + j) / n), y, r * Math.sin(a0 + TAU * (k + j) / n)], c = k % 2 ? c1 : c2, o = k % 2 ? c2 : c1;
    if (k !== door) G.face(p(1, R, -0.1), p(0, R, -0.1), p(0, R, hw), p(1, R, hw), (q) => mul3(c, q[1] < 0.3 ? 0.78 : 1), KIND.cloth);
    G.face(p(1, R + 0.25, hw), p(0, R + 0.25, hw), p(0, R * 0.4, mid), p(1, R * 0.4, mid), c, KIND.cloth);
    G.tface(p(1, R * 0.4, mid), p(0, R * 0.4, mid), [0, top, 0], c, KIND.cloth);
    G.tface(p(1, R + 0.27, hw), p(0, R + 0.27, hw), p(0.5, R + 0.29, hw - 0.5), o, KIND.cloth);          // the valance: a point to each gore
  }
  limb(G, [[0, top - 0.3, 0], [0, top + 0.75, 0]], [0.07, 0.05], { sides: 5, kind: KIND.plain, c0: P.wood, c1: P.wood, cap: false });
  ball(G, [0, top + 0.7, 0], 0.13, P.gold, 6);
  if (ropes) for (let k = 0; k < n; k += 2) { const a = a0 + TAU * k / n; guy(G, [(R + 0.25) * Math.cos(a), hw, (R + 0.25) * Math.sin(a)], [(R + 2.1) * Math.cos(a), 0, (R + 2.1) * Math.sin(a)], ropes, P); }
}

// a ridge tent L metres long (its ridge along the frame's x), open along its front (+z) under a valance
export function ridgeTent(G, rng, L, P, pair, top = 3.6, ropes = null) {
  const w = 2.7, hw = top - 1.7, n = Math.max(4, Math.round(L / 1.25)), [c1, c2] = pair, x = L / 2;
  for (let k = 0; k < n; k++) {
    const x0 = -x + L * k / n, x1 = x0 + L / n, c = k % 2 ? c1 : c2, o = k % 2 ? c2 : c1;
    G.face([x0, hw, w], [x1, hw, w], [x1, top, 0], [x0, top, 0], c, KIND.cloth); G.face([x1, hw, -w], [x0, hw, -w], [x0, top, 0], [x1, top, 0], mul3(c, 0.92), KIND.cloth);
    G.face([x1, -0.1, -w], [x0, -0.1, -w], [x0, hw, -w], [x1, hw, -w], (q) => mul3(c, q[1] < 0.3 ? 0.78 : 0.95), KIND.cloth);
    G.tface([x0, hw, w + 0.02], [x1, hw, w + 0.02], [(x0 + x1) / 2, hw - 0.5, w + 0.04], o, KIND.cloth);
  }
  G.face([x, -0.1, w], [x, -0.1, -w], [x, hw, -w], [x, hw, w], c1, KIND.cloth); G.tface([x, hw, w], [x, hw, -w], [x, top, 0], c2, KIND.cloth);
  G.face([-x, -0.1, -w], [-x, -0.1, w], [-x, hw, w], [-x, hw, -w], c1, KIND.cloth); G.tface([-x, hw, -w], [-x, hw, w], [-x, top, 0], c2, KIND.cloth);
  for (const s of [-1, 0, 1]) limb(G, [[s * (x - 0.05), -0.2, w - 0.05], [s * (x - 0.05), hw + 0.05, w - 0.05]], [0.06, 0.05], { sides: 5, kind: KIND.plain, c0: P.wood, c1: P.wood, cap: false });
  for (const s of [-1, 1]) { limb(G, [[s * x, top - 0.2, 0], [s * x, top + 0.55, 0]], [0.06, 0.045], { sides: 5, kind: KIND.plain, c0: P.wood, c1: P.wood, cap: false }); ball(G, [s * x, top + 0.5, 0], 0.11, P.gold, 6); }
  if (ropes) for (const s of [-1, 0, 1]) for (const k of [-1, 1]) guy(G, [s * (x - 0.05), hw, k * w], [s * (x - 0.05), 0, k * (w + 1.8)], ropes, P);
}

// a cask: upright on the ground (lying false) or on its side along the frame's x on a stand
export function cask(G, rng, r, len, P, lying) {
  const tone = mul3(P.cask, 0.8 + 0.35 * rng()), prof = [[0.8, 0], [0.93, 0.2], [1, 0.5], [0.93, 0.8], [0.8, 1]], hoops = [0.08, 0.3, 0.7, 0.92];
  if (!lying) {
    turned(G, [0, 0, 0], [[0.001, 0], ...prof.map((q) => [q[0] * r, q[1] * len]), [r * 0.72, len - 0.04], [0.001, len - 0.04]], { sides: 9, kind: KIND.planks, c: tone });
    for (const t of hoops) { const rr = r * (0.8 + 0.2 * Math.sin(Math.PI * t)) + 0.012; turned(G, [0, len * t, 0], [[rr, -0.03], [rr, 0.03]], { sides: 9, c: P.iron }); }
    return;
  }
  const y = r + 0.42;
  limb(G, prof.map((q) => [(q[1] - 0.5) * len, y, 0]), prof.map((q) => q[0] * r), { sides: 9, kind: KIND.planks, cap: false, c0: tone, c1: tone });
  for (const t of hoops) { const rr = r * (0.8 + 0.2 * Math.sin(Math.PI * t)) + 0.012, x = (t - 0.5) * len; limb(G, [[x - 0.03, y, 0], [x + 0.03, y, 0]], [rr, rr], { sides: 9, kind: KIND.plain, cap: false, c0: P.iron, c1: P.iron }); }
  disc(G, [len / 2 - 0.04, y, 0], 1, r * 0.78, mul3(tone, 0.9)); disc(G, [-len / 2 + 0.04, y, 0], -1, r * 0.78, mul3(tone, 0.9));
  G.beam([len / 2 - 0.04, y - r * 0.5, 0], [len / 2 + 0.16, y - r * 0.5, 0], 0.05, 0.05, P.gold);                 // the tap
  for (const s of [-1, 1]) { G.box([s * len * 0.3 - 0.06, y - r * 1.02, -r * 0.85], [s * len * 0.3 + 0.06, y - r * 0.55, r * 0.85], P.wood, KIND.plain); for (const k of [-1, 1]) G.beam([s * len * 0.3, y - r * 0.9, k * r * 0.6], [s * len * 0.3, -0.1, k * r * 0.8], 0.09, 0.09, P.wood, KIND.plain, [1, 0, 0]); }
}

// a sack, tied at the neck
export const sack = (G, rng, P) => turned(G, [0, 0, 0], [[0.001, 0], [0.27, 0.04], [0.33, 0.3], [0.24, 0.55], [0.09, 0.66], [0.15, 0.76]], { sides: 7, kind: KIND.cloth, c: mul3(P.sack, 0.8 + 0.3 * rng()), squash: [1, 0.8] });

// a cart at rest (its length along the frame's x, its shafts down on the grass ahead of it): bed, sides, two spoked wheels
export function cart(G, rng, P) {
  const y = 0.95, wr = 0.78, wood = P.wood, dark = mul3(P.wood, 0.7);
  G.box([-1.5, y - 0.07, -0.72], [1.5, y, 0.72], wood, KIND.planks);
  for (const s of [-1, 1]) { G.box([-1.5, y, s * 0.72 - 0.03], [1.5, y + 0.5, s * 0.72 + 0.03], wood, KIND.planks); G.box([s * 1.5 - 0.03, y, -0.72], [s * 1.5 + 0.03, y + (s < 0 ? 0.5 : 0.32), 0.72], wood, KIND.planks); }
  G.beam([0, wr, -1.0], [0, wr, 1.0], 0.1, 0.1, dark, KIND.plain);
  for (const s of [-1, 1]) {
    const z = s * 0.9, at = (r, a) => [r * Math.cos(a), wr + r * Math.sin(a), z];
    for (let k = 0; k < 12; k++) { const a0 = TAU * k / 12, a1 = TAU * (k + 1) / 12, am = (a0 + a1) / 2; G.beam(at(wr - 0.05, a0), at(wr - 0.05, a1), 0.08, 0.1, dark, KIND.plain, [Math.cos(am), Math.sin(am), 0]); }
    for (let k = 0; k < 8; k++) G.beam(at(0.08, TAU * k / 8), at(wr - 0.08, TAU * k / 8), 0.05, 0.05, wood, KIND.plain, [0, 0, 1]);
    G.beam([0, wr, z - 0.09], [0, wr, z + 0.09], 0.2, 0.2, dark, KIND.plain);
    G.beam([1.5, y - 0.04, s * 0.5], [3.7, 0.08, s * 0.42], 0.07, 0.09, wood, KIND.plain);
  }
  G.beam([1.3, y - 0.07, 0], [1.3, 0, 0], 0.08, 0.08, dark, KIND.plain, [1, 0, 0]);
}

// a pony grazing: its length along the frame's x, its head down in the grass at +x. coat: { body, dark }. Its neck
// with the head, mane and ears, and its tail, are laid into Solids of their own about the places they turn on (the
// withers, the dock), so that the caller can move them. -> { neck, tail, neckAt, tailAt: the world's places }
export function pony(G, rng, P, coat) {
  const s = 0.9 + 0.18 * rng(), body = coat.body, dark = coat.dark, belly = mul3(body, 0.74), neck = new Solid(), tail = new Solid(), NP = [0.6, 1.16, 0], TP = [-0.9, 1.06, 0];
  const L = (S, o0, pts, rad, o) => limb(S, pts.map((q) => [(q[0] - o0[0]) * s, (q[1] - o0[1]) * s, (q[2] - o0[2]) * s]), rad.map((r) => r * s), { kind: KIND.plain, ...o }), Z = [0, 0, 0];
  L(G, Z, [[-0.95, 0.98, 0], [-0.86, 1.0, 0], [-0.62, 1.08, 0], [-0.1, 1.03, 0], [0.42, 1.07, 0], [0.72, 1.1, 0]], [0.03, 0.22, 0.34, 0.37, 0.33, 0.25], { sides: 8, col: (t, k, ang, p) => (p[1] < 0.93 * s ? belly : body) });
  L(neck, NP, [[0.56, 1.14, 0], [0.92, 0.98, 0], [1.16, 0.66, 0], [1.3, 0.38, 0], [1.4, 0.2, 0], [1.49, 0.08, 0]], [0.24, 0.17, 0.13, 0.135, 0.11, 0.075], { sides: 7, col: (t) => (t > 0.9 ? mul3(body, 0.6) : body) });
  for (const [x, z, hind] of [[0.5, 0.17, 0], [0.5, -0.17, 0], [-0.6, 0.18, 1], [-0.6, -0.18, 1]])
    L(G, Z, [[x, 0.98, z], [x - (hind ? 0.08 : 0), 0.5, z], [x + (hind ? 0 : 0.02), 0.1, z], [x + 0.03, 0, z]], [hind ? 0.16 : 0.12, 0.065, 0.055, 0.075], { sides: 5, cap: false, col: (t) => (t > 0.9 ? P.hoof : t > 0.4 ? dark : body) });
  L(tail, TP, [[-0.9, 1.06, 0], [-1.02, 0.86, 0], [-1.07, 0.45, 0], [-1.05, 0.2, 0]], [0.06, 0.09, 0.07, 0.02], { sides: 5, c0: dark, c1: dark });
  const T = [[0.66, 1.38, 0], [1.03, 1.12, 0], [1.27, 0.75, 0], [1.37, 0.5, 0]].map((q) => [(q[0] - NP[0]) * s, (q[1] - NP[1]) * s, 0]), d = [0, -0.17 * s, 0.1 * s];
  for (let i = 0; i < 3; i++) neck.face(T[i], T[i + 1], [T[i + 1][0], T[i + 1][1] + d[1], d[2]], [T[i][0], T[i][1] + d[1], d[2]], dark, KIND.plain);
  for (const k of [-1, 1]) neck.tface([(1.2 - NP[0]) * s, (0.6 - NP[1]) * s, k * 0.05 * s], [(1.29 - NP[0]) * s, (0.56 - NP[1]) * s, k * 0.05 * s], [(1.2 - NP[0]) * s, (0.75 - NP[1]) * s, k * 0.1 * s], mul3(body, 0.8), KIND.plain);
  return { neck, tail, neckAt: world(G, [NP[0] * s, NP[1] * s, 0]), tailAt: world(G, [TP[0] * s, TP[1] * s, 0]) };
}

// layFeast(G, C, rng, frng, o): where everything stands. rng: the stream 'feast' (places: every candidate's dice are
// drawn before it is tried); frng: the stream 'feast-food' (what is on each table, the tones of things).
// o: { tree: [x, z], crown: the tree's reach, field: the plan's FIELD, ground(x, z), over(x, z) -> { dist },
//      poles: [{ x, z }], density, pause }
// -> { tables, tents, nearTable, nearTent: metres from the flown line in plan, ponies: [[x, z]] }
export async function layFeast(G, C, rng, frng, o) {
  const P = { wood: C('#8a6a45'), cloth: C('#efe9da'), runners: ['#c8442f', '#3c68b0', '#e0a52e', '#7d4a8c', '#2f8f86'].map(C), icing: ['#f6efe2', '#f0b8c6', '#f3dc8c', '#6a4630'].map(C), red: C('#c02a2a'),
    crust: C('#c68a3f'), pot: C('#9a5b3a'), glaze: C('#5d7f95'), plate: C('#e6e0d0'), cheese: C('#e8c04e'), fruit: ['#c8322c', '#e6b730', '#8fb53a', '#e07b28', '#7a2f5e'].map(C), mug: C('#b08a5a'), ale: C('#3a2414'),
    gold: C('#d9a53a'), cask: C('#8b6a44'), iron: C('#2e2a28'), sack: C('#c9b58c'), hoof: C('#1d1814') };
  const pairs = [['#efe6cf', '#c8442f'], ['#efe6cf', '#3c68b0'], ['#f0e2b0', '#d98a2b'], ['#efe6cf', '#7d4a8c']].map((q) => q.map(C));
  const [tx, tz] = o.tree, F = o.field, placed = [], out = { tables: 0, tents: 0, nearTable: Infinity, nearTent: Infinity, ponies: [], ropes: [], kings: [] };
  for (const q of o.poles) placed.push([q.x, q.z, 0.8]);
  const inField = (x, z) => ((x - F.x) / (F.rx - 2)) ** 2 + ((z - F.z) / (F.rz - 2)) ** 2 < 1;
  // a thing of half-length a and half-width b at (x, z) turned by yaw: is its ground in the field, free, and `air` from the line?
  const free = (x, z, yaw, a, b, air) => {
    const c = Math.cos(yaw), s = Math.sin(yaw); let near = Infinity;
    for (const i of [-1, 0, 1]) for (const j of [-1, 1]) {
      const px = x + i * a * c + j * b * s, pz = z - i * a * s + j * b * c;
      if (!inField(px, pz) || Math.hypot(px - tx, pz - tz) < 9.4) return -1;                      // off the field, or on the tree's roots
      near = Math.min(near, o.over(px, pz).dist);
    }
    if (near < air) return -1;
    for (const i of [-1, 0, 1]) { const px = x + i * (a - b) * c, pz = z - i * (a - b) * s; for (const q of placed) if (Math.hypot(q[0] - px, q[1] - pz) < q[2] + b + 0.5) return -1; }
    return near;
  };
  const keep = (x, z, yaw, a, b) => { for (const i of [-1, 0, 1]) placed.push([x + i * (a - b) * Math.cos(yaw), z - i * (a - b) * Math.sin(yaw), b]); };
  const stand = (x, z, yaw, dx = 0, dz = 0) => { const c = Math.cos(yaw), s = Math.sin(yaw), wx = x + dx * c + dz * s, wz = z - dx * s + dz * c; G.frame(wx, o.ground(wx, wz), wz, yaw); };
  const setTable = (x, z, yaw, L, extra) => {
    const a = L / 2 + (extra > 0.45 ? 1.9 : 0.4), near = free(x, z, yaw, a, 1.45, 11); if (near < 0) return;
    keep(x, z, yaw, a, 1.45); out.tables++; out.nearTable = Math.min(out.nearTable, near);
    stand(x, z, yaw); table(G, frng, L, P, out.tables === 1);
    for (const k of [-1, 1]) { stand(x, z, yaw + (frng() - 0.5) * 0.06, 0, k * 0.98); bench(G, L - 0.8, P); }
    if (extra > 0.45) { stand(x, z, yaw + 1.57, 0, (extra > 0.72 ? 1 : -1) * (L / 2 + 1.1)); cask(G, frng, 0.36, 1.0, P, extra > 0.6); }
  };
  // the long tables under the tree, some round it and some pointing at the trunk
  const n1 = Math.round(6 * o.density), most = Math.round(14 * o.density);
  for (let k = 0; k < n1; k++) {                                // in rows of two, one behind the other, round the trunk
    const a = TAU * (k + 0.5 * rng()) / n1, yaw = Math.atan2(-Math.cos(a), -Math.sin(a)), d = [[11.0 + 0.3 * rng(), 6 + 1.5 * rng(), rng()], [13.8 + 0.3 * rng(), 7 + 2 * rng(), rng()]];
    for (const [r, L, extra] of d) setTable(tx + r * Math.cos(a), tz + r * Math.sin(a), yaw, L, extra);
  }
  if (o.pause) await o.pause();
  // the tents: most on the open west of the field, where the round looks across to them (round ones and ridge ones
  // beyond the crown, low ridge tents under its edge, below the lowest lanterns), some on its east edge; their open
  // fronts toward the tree
  const x0 = F.x - F.rx, x1 = F.x + F.rx;
  // THE MARQUEE on the open west of the field, its long side to the tree. Its place is dealt by the stream 'marquee'
  // (o.mrng): between 9 and 19 m in from the field's west rim and within 20 m north or south of the field's middle;
  // the first of thirty such places that lies on the field, clear of the tree's roots and of the poles, and 12.6 m
  // in plan from the flown line. Two long tables stand under it, casks on stands at its end
  for (let k = 0; k < 30 && o.mrng; k++) {
    const x = x0 + 9 + 10 * o.mrng(), z = F.z + (o.mrng() * 2 - 1) * 20, yaw = Math.PI / 2;      // every try draws its dice, used or not
    if (out.kings.length || free(x, z, yaw, 8.2, 5.4, 12.6) < 0) continue;
    keep(x, z, yaw, 8.2, 5.4); out.tents++;
    stand(x, z, yaw); out.kings = marquee(G, frng, P, pairs[0], out.ropes);
    for (const k of [-1, 1]) { stand(x, z, yaw, 0, k * 1.9); table(G, frng, 9, P); stand(x, z, yaw, 0, k * 2.9); bench(G, 8.2, P); out.tables++; }
    for (const k of [-1, 0, 1]) { stand(x, z, yaw, 9.4, k * 1.3); cask(G, frng, 0.42, 1.15, P, true); }
  }
  for (let k = 0; k < 60; k++) {
    const where = rng(), t = rng(), u = rng(), round = rng() < 0.55, R = 2.9 + 0.9 * rng(), L = 6.5 + 3 * rng(), pair = pairs[Math.floor(rng() * pairs.length)];
    const under = where > 0.5 && where < 0.75, x = where < 0.5 ? x0 + 5 + 17 * t : under ? x0 + 21 + 13 * t : x1 - 12 + 7 * t, z = F.z + (u - 0.5) * (F.rz * 0.9);
    if (out.tents >= Math.round(6 * o.density)) continue;
    const a = Math.atan2(z - tz, x - tx), isRound = round && !under, yaw = Math.atan2(-Math.cos(a), -Math.sin(a)), near = isRound ? free(x, z, 0, R + 0.4, R + 0.4, 14) : free(x, z, yaw, L / 2 + 0.3, 3.1, 14);
    if (near < 0 || (!under && Math.hypot(x - tx, z - tz) < o.crown + 4)) continue;
    if (isRound) keep(x, z, 0, R + 0.4, R + 0.4); else keep(x, z, yaw, L / 2 + 0.3, 3.1);
    out.tents++; out.nearTent = Math.min(out.nearTent, near);
    stand(x, z, isRound ? 0 : yaw); if (isRound) roundTent(G, frng, R, P, pair, out.ropes); else ridgeTent(G, frng, L, P, pair, under ? 3.1 : 3.6, out.ropes);
  }
  if (o.pause) await o.pause();
  // more tables out on the west of the field, among the tents
  for (let k = 0; k < 24; k++) { const x = x0 + 8 + 28 * rng(), z = F.z + (rng() - 0.5) * (F.rz * 0.8), L = 5.5 + 2.6 * rng(), yaw = rng() * TAU, extra = rng(); if (out.tables < most) setTable(x, z, yaw, L, extra); }
  if (o.pause) await o.pause();
  // by the mill, on the level ground east of it: the cart with its casks and sacks, casks by the door, two ponies grazing
  const mx = MILL.x1 + 5.5, mz = MILL.z0 + 4.5, cy = rng() * 0.8 - 0.2, coats = [{ body: C('#7b4a2b'), dark: C('#2b1d14') }, { body: C('#b3ab9c'), dark: C('#5a544c') }, { body: C('#9a5a2e'), dark: C('#6e3d1f') }];
  stand(mx, mz, cy); cart(G, frng, P);
  for (const [dx, lying] of [[-0.8, 1], [0.45, 1]]) { stand(mx, mz, cy + 1.57, 0, dx); G.f[1] += 0.53; cask(G, frng, 0.33, 0.9, P, lying); }
  stand(mx, mz, cy, 1.1, 0.1); G.f[1] += 0.95; sack(G, frng, P); stand(mx, mz, cy, -2.3, 0.9); sack(G, frng, P); stand(mx, mz, cy, -2.5, 0.2); sack(G, frng, P);
  stand(MILL.wheel.x + 10.4, MILL.z0 + 8.7, 0); cask(G, frng, 0.4, 1.1, P, false); stand(MILL.wheel.x + 10.7, MILL.z0 + 9.7, 0); cask(G, frng, 0.36, 1.0, P, false);
  const c0 = Math.floor(rng() * 3);
  for (const [dx, dz, k] of [[12.5, 3.5, 0], [9.5, 10.5, 1]]) { const x = MILL.x1 + dx + 2 * rng(), z = MILL.z0 + dz + 2 * rng(), yaw = rng() * TAU; stand(x, z, yaw); out.ponies.push({ x, z, yaw, ...pony(G, frng, P, coats[(c0 + k) % 3]) }); }
  for (const q of out.ponies) q.phase = rng() * TAU;              // when each grazes and flicks its tail: dealt by the stream
  if (o.pause) await o.pause();
  // THE PICNIC at the bank's foot: on the level grass inside the field's rim, wherever the land beyond the rim climbs
  // into a bank, a rug is spread every eight or nine metres along the rim, 3.5 to 9.5 m in from it (dealt by the stream
  // 'bank-picnic', o.prng), with a hamper, dishes and cushions, and a barrel or a bench by every other one. A place is
  // refused on the tree's roots, on anything already standing, or where a thing a metre and a half high would have
  // less than 10 m of clear air from the flown line (o.route, measured in space)
  if (o.prng && o.route) {
    const b = o.prng, rimAt = (phi, d) => { const c = Math.cos(phi), s = Math.sin(phi), nl = Math.hypot(c / F.rx, s / F.rz); return [F.x + F.rx * c + d * c / F.rx / nl, F.z + F.rz * s + d * s / F.rz / nl]; };
    const clear = (x, z, r) => { if (!inField(x, z) || Math.hypot(x - tx, z - tz) < 9.4 || o.route(x, o.ground(x, z) + 1.5, z) < 10) return false; for (const q of placed) if (Math.hypot(q[0] - x, q[1] - z) < q[2] + r + 0.4) return false; return true; };
    const p0 = b() * TAU; out.rugs = 0;
    for (let phi = p0; phi < p0 + TAU;) {
      const inset = 3.5 + 6 * b(), turn = b() * TAU, by = b(), jit = b(), [x, z] = rimAt(phi, -inset), [bx, bz] = rimAt(phi, 8);      // every station draws its dice, used or not
      if (o.ground(bx, bz) - F.y > 3 && clear(x, z, 2.1)) {
        placed.push([x, z, 2.1]); out.rugs++;
        stand(x, z, turn); rug(G, frng, P);
        if (by < 0.3) { stand(x, z, turn, 0, -2.0); bench(G, 2.2, P); } else if (by < 0.6) { stand(x, z, turn, 2.2, 0.3); cask(G, frng, 0.36, 1.0, P, false); }
      }
      // (a bare rug once lay on the bank's own face above each of these. Seen from the lane those read as flat tiles
      // hovering on the slope, so they are taken off; the die for each one's colour is still thrown at the same places,
      // so that everything dealt after it stands where it stood)
      const [sx, sz] = rimAt(phi, 2.5 + 4.5 * by), sy = o.ground(sx, sz);
      if (o.ground(bx, bz) - F.y > 3 && sy - F.y > 0.8 && o.route(sx, sy + 0.6, sz) >= 10) { frng(); G.frame(null); }
      phi += 8.5 * (0.8 + 0.4 * jit) / Math.hypot(F.rx * Math.sin(phi), F.rz * Math.cos(phi));
    }
  }
  if (o.pause) await o.pause();
  // THE CAMP BY THE CART ROAD, laid by the ground: along the field's rim wherever the land beyond it climbs into a bank
  // (8 m out it stands more than 3 m over the field) and the cart road's middle line passes within 20 m, a second row
  // of tents stands with its back to the bank, laid tables before them, a heap of firewood with benches and casks.
  // That stretch of the rim is found from the ground at a hundred bearings round the field's middle, and every place
  // is dealt along it by the stream o.brng, with the feast's own clearances
  if (o.brng && o.ground) {
    const b = o.brng, edge = (phi, inset) => [F.x + (F.rx - inset) * Math.cos(phi), F.z + (F.rz - inset) * Math.sin(phi)], road = ROAD.map((q) => [q[0], q[2]]), arc = [];
    const off = (x, z) => { let m = Infinity; for (let i = 0; i + 1 < road.length; i++) { const p = road[i], q = road[i + 1], dx = q[0] - p[0], dz = q[1] - p[1], t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t)); } return m; };
    for (let i = 0; i < 100; i++) { const phi = i * TAU / 100, c = Math.cos(phi), s = Math.sin(phi), nl = Math.hypot(c / F.rx, s / F.rz), x = F.x + F.rx * c, z = F.z + F.rz * s; if (o.ground(x + 8 * c / F.rx / nl, z + 8 * s / F.rz / nl) - F.y > 3 && off(x, z) < 20) arc.push(phi); }
    let tents = 0, tabs = 0, heap = false;
    for (let k = 0; k < 120 && arc.length; k++) {
      const at = b() * arc.length, phi = arc[Math.floor(at)] + (at % 1 - 0.5) * TAU / 100, ins = b(), round = b() < 0.6, R = 2.3 + 0.7 * b(), L = 5 + 2 * b(), pair = pairs[Math.floor(b() * pairs.length)], extra = b(), what = k % 3;
      const [x, z] = edge(phi, what === 0 ? 5 + 6 * ins : what === 1 ? 12 + 9 * ins : 9 + 6 * ins), a = Math.atan2(z - tz, x - tx), yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
      if (what === 0 && tents < 2) {                            // a tent at the field's edge, its front to the tree
        const near = round ? free(x, z, 0, R + 0.4, R + 0.4, 14) : free(x, z, yaw, L / 2 + 0.3, 3.1, 14); if (near < 0) continue;
        if (round) keep(x, z, 0, R + 0.4, R + 0.4); else keep(x, z, yaw, L / 2 + 0.3, 3.1);
        tents++; out.tents++; out.nearTent = Math.min(out.nearTent, near);
        stand(x, z, round ? 0 : yaw); if (round) roundTent(G, frng, R, P, pair, out.ropes); else ridgeTent(G, frng, L, P, pair, 3.6, out.ropes);
      } else if (what === 1 && tabs < 4) {                      // a laid table before the tents
        const n0 = out.tables; setTable(x, z, yaw, L, extra); if (out.tables > n0) tabs++;
      } else if (what === 2 && !heap) {                         // the firewood, two benches and two casks by it
        if (free(x, z, 0, 2.7, 2.7, 13) < 0) continue;
        keep(x, z, 0, 2.7, 2.7); heap = true; const hy = extra * TAU;
        stand(x, z, hy); woodpile(G, frng, P);
        stand(x, z, hy, 0, 1.9); bench(G, 2.4, P); stand(x, z, hy + 1.57, 0, 2.1); bench(G, 2.2, P);
        stand(x, z, hy, -1.9, -0.6); cask(G, frng, 0.38, 1.05, P, false); stand(x, z, hy, -1.75, 0.45); cask(G, frng, 0.34, 0.95, P, false);
      }
    }
  }
  G.frame(null);
  return out;
}
