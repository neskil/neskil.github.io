// valley-inside-the-works, THE SHED: the head wall (z -230) and the head of the valley. Five round windows, each an iron
// ring with radial and ringed glazing bars like a wheel, the four glazed ones with swirled sugar glass of two colours
// (each its own pair, dealt); the MIDDLE one, at the plan's EXIT, is an open iron ring only, whose inner edge laps the
// way out's disc (the plan's EXIT_RADIUS) by 5 cm. Round it on the brick, wholly outside the iron frame, a ROSETTE OF
// SEPARATE SWEETS twice the ring's width across: a wreath of forty gumdrops, then twelve peppermint discs and twelve
// humbugs, under a great arch of brick banded with stone that springs from the two middle piers. The sweets glow
// steadily by their own material; no light is added to the scene and nothing of it lights the ring. In the wall's own
// plane nothing of ours stands nearer the exit's axis than the iron ring's edge; in
// front of it the last lattice girder (z -220) hangs with its underside 4.9 m above that axis, 8.5 m before the ring.
// Seven iron collars where the pipes pass through; the gallery under the windows with stairs down to the terrace; the
// stone terrace with its four troughs, each with a granite roller that travels to and fro by the plan's rollerZ.
import * as P from './valley-inside-the-works-plan.js';
import { KIND, LACE, PANE } from './valley-inside-the-works-shed-mats.js';
import { WALLS, TOP, GAL, PLINTH_TOP, inFrame, gallery, gutter, groundAt, lamp } from './valley-inside-the-works-shed-walls.js';
import { stair } from './valley-inside-the-works-shed-stairs.js';

// (slot: the half width of the iron-collared slot in the head wall through which a roller's rod slides)
export const ROLLER = { axis: P.TROUGH.level + 0.6, radius: 1.5, frame: 0.35, wheel: 0.42, wheelX: 3.1, wheelZ: 1.8, slot: 0.9 };

async function headWall(kit) {
  const { solid, glass } = kit, W = WALLS.head, Wn = P.WINDOW, T = P.TERRACE, sq = 8.6, y0 = Wn.y - sq, y1 = Wn.y + sq, shade = 0.6;
  // the brick face, cut round each window
  solid.set({ kind: KIND.brick, w: shade, col: [1, 1, 1] });
  solid.quad([W.a0, -2, 0], [W.a1, -2, 0], [W.a1, y0, 0], [W.a0, y0, 0]);
  solid.quad([W.a0, y1, 0], [W.a1, y1, 0], [W.a1, TOP, 0], [W.a0, TOP, 0]);
  let from = W.a0;
  const n = 32, R = 7.9, rng = kit.o.rngFor('shed-head'), pairs = [0, 1, 2, 3];
  // which glazed window takes which pair of sugar colours: dealt by the shed's own stream
  for (let i = 3; i > 0; i--) { const j = Math.min(i, Math.floor(rng() * (i + 1))), t = pairs[i]; pairs[i] = pairs[j]; pairs[j] = t; }
  for (const xc of Wn.xs) {
    solid.set({ kind: KIND.brick, w: shade, col: [1, 1, 1] });
    solid.quad([from, y0, 0], [xc - sq, y0, 0], [xc - sq, y1, 0], [from, y1, 0]);
    const edge = (t) => { const c = Math.cos(t), s = Math.sin(t), m = sq / Math.max(Math.abs(c), Math.abs(s)); return [xc + c * m, Wn.y + s * m, 0]; };
    for (let i = 0; i < n; i++) {
      const t0 = Math.PI * 2 * i / n, t1 = Math.PI * 2 * (i + 1) / n;
      solid.quad([xc + R * Math.cos(t0), Wn.y + R * Math.sin(t0), 0], edge(t0), edge(t1), [xc + R * Math.cos(t1), Wn.y + R * Math.sin(t1), 0]);
    }
    from = xc + sq;
    // a ring of bricks on end round the opening, a finger proud of the face
    solid.set({ kind: KIND.brick, w: shade, col: [0.84, 0.78, 0.78] });
    for (let i = 0; i < n; i++) {
      const t0 = Math.PI * 2 * i / n, t1 = Math.PI * 2 * (i + 1) / n, ra = 7.95, rb = 8.72, u0 = t0 * 8.4, u1 = t1 * 8.4;
      solid.quad([xc + ra * Math.cos(t0), Wn.y + ra * Math.sin(t0), 0.07], [xc + rb * Math.cos(t0), Wn.y + rb * Math.sin(t0), 0.07], [xc + rb * Math.cos(t1), Wn.y + rb * Math.sin(t1), 0.07], [xc + ra * Math.cos(t1), Wn.y + ra * Math.sin(t1), 0.07],
        [[0.02, u0], [0.66, u0], [0.66, u1], [0.02, u1]]);
    }
    // the cast-iron ring: a moulded rim, a flat face with bolt bosses, and the reveal through the wall. The way out's
    // ring has an inner band as well, set a little back, whose edge laps the plan's opening (EXIT_RADIUS) by 5 cm, so
    // that no rim of open hole shows between the engine's disc and the iron.
    const wayOut = Math.abs(xc - P.EXIT.x) < 1, lap = P.EXIT_RADIUS - 0.05;
    solid.set({ kind: KIND.iron, w: 0, col: [1, 1, 1] });
    solid.lathe([xc, Wn.y, 0], 2, [[8.05, 0], [8.05, 0.22], [Wn.radius, 0.5], [7.0, 0.5]].concat(wayOut ? [[7.0, 0.36], [lap, 0.36], [lap, -1.4]] : [[7.0, -1.4]]), 48, { uPer: 46 });
    for (let i = 0; i < 24; i++) {
      const t = Math.PI * 2 * (i + 0.5) / 24, bx = xc + 7.3 * Math.cos(t), by = Wn.y + 7.3 * Math.sin(t);
      solid.box(bx - 0.15, bx + 0.15, by - 0.15, by + 0.15, 0.5, 0.66, 'k');
    }
    await kit.ctx.yield();
    if (wayOut) await wreath(solid, rng, xc, Wn.y, () => kit.ctx.yield());
    if (!wayOut) {                                               // swirled sugar glass in every ring but the way out's
      const pts = [];
      for (let i = 0; i < 40; i++) { const t = Math.PI * 2 * i / 40; pts.push([xc + 7.02 * Math.cos(t), Wn.y + 7.02 * Math.sin(t), -0.7]); }
      glass.set({ kind: PANE.wheel, w: pairs.pop(), col: [1, 1, 1] });
      glass.poly(pts, pts.map((q) => [q[0] - xc, q[1] - Wn.y]));
    }
    await kit.ctx.yield();
  }
  solid.set({ kind: KIND.brick, w: shade, col: [1, 1, 1] });
  solid.quad([from, y0, 0], [W.a1, y0, 0], [W.a1, y1, 0], [from, y1, 0]);
  // piers at the column rows, the stone bands, and the plinth as high as the ground or the terrace stands
  for (const a of P.COLUMN_X) {
    solid.set({ kind: KIND.brick, w: shade, col: [1, 1, 1] }); solid.box(a - 1.3, a + 1.3, -2, 53.2, 0, 0.7, 'kdu');
    solid.set({ kind: KIND.ashlar, w: 0.7 });                      // stone bands round it, so that a pier reads as a pier square on
    for (const yb of [33.2, 35.9, 40.0, 46.4, 49.6]) solid.box(a - 1.4, a + 1.4, yb, yb + 0.45, 0, 0.8, 'k');
  }
  solid.set({ kind: KIND.ashlar, w: 0.55 });
  solid.box(W.a0, W.a1, 29.1, 29.8, 0, 0.22, 'lrk');
  solid.box(W.a0, P.EXIT.x - 10.3, 53.2, 54.1, 0, 0.36, 'lk');      // (the upper band and its corbel table stop against the great arch)
  solid.box(P.EXIT.x + 10.3, W.a1, 53.2, 54.1, 0, 0.36, 'rk');
  for (let a = W.a0 + 0.6; a < W.a1; a += 1.25) if (Math.abs(a - P.EXIT.x) > 11.5) solid.box(a - 0.26, a + 0.26, 52.66, 53.2, 0, 0.28, 'ku');     // a corbel table under it
  for (let a = W.a0; a < W.a1 - 0.1; a += 8) {
    const b = Math.min(a + 8, W.a1), on = (a + b) / 2 > T.x0 && (a + b) / 2 < T.x1;
    let g = -1e9; for (let q = a; q <= b; q += 2) g = Math.max(g, groundAt(W, q, 0.6));
    const top = on ? T.top + 0.9 : Math.min(Math.max(Math.min(g + 2.0, 28.9), g + 0.5), PLINTH_TOP);
    solid.set({ kind: KIND.ashlar, w: 0.35 });
    solid.box(a, b, -2, top, 0, 0.3, 'lrkdu');
    solid.quad([a, top, 0.3], [b, top, 0.3], [b, top + 0.3, 0], [a, top + 0.3, 0]);
  }
  // the seven collars where the pipes pass through: a STEPPED rank, each at the plan's (pipeX(i), pipePortY(i)) and
  // PIPE_COLLAR in radius, each on a round stone pad of its own, a hand proud of the brick. Where two pads would meet
  // they are cut along the line half way between their ports and a 4 cm joint is left, so neighbours never overlap.
  const C = P.PIPE_COLLAR, PAD = 1.2, sc = C / 0.98, ports = [];
  for (let i = 0; i < P.PIPES.count; i++) ports.push([P.pipeX(i), P.pipePortY(i)]);
  for (let i = 0; i < ports.length; i++) {
    const x = ports[i][0], py = ports[i][1];
    let pad = [];
    for (let j = 0; j < 24; j++) { const t = Math.PI * 2 * j / 24; pad.push([x + PAD * Math.cos(t), py + PAD * Math.sin(t)]); }
    for (let other = 0; other < ports.length; other++) {
      if (other === i) continue;
      const dx = ports[other][0] - x, dy = ports[other][1] - py, l = Math.hypot(dx, dy), lim = l / 2 - 0.02;
      if (lim >= PAD) continue;
      const past = (q) => ((q[0] - x) * dx + (q[1] - py) * dy) / l - lim, cut = [];        // over 0: beyond the joint
      for (let j = 0; j < pad.length; j++) {
        const a = pad[j], b = pad[(j + 1) % pad.length], sa = past(a), sb = past(b);
        if (sa <= 0) cut.push(a);
        if ((sa <= 0) !== (sb <= 0)) { const t = sa / (sa - sb); cut.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      pad = cut.filter((q, j) => { const p = cut[(j + cut.length - 1) % cut.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-4; });
    }
    solid.set({ kind: KIND.ashlar, w: 0.8, col: [1, 1, 1] });
    solid.poly(pad.map((q) => [q[0], q[1], 0.16]), pad.map((q) => [(q[0] - x) * 0.25 + 0.9 + 5.4 * i, (q[1] - py) * 0.25 + 0.45]));
    for (let j = 0; j < pad.length; j++) { const a = pad[j], b = pad[(j + 1) % pad.length]; solid.quad([a[0], a[1], 0.16], [a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 0.16]); }
    solid.set({ kind: KIND.iron, w: 0, col: [1, 1, 1] });
    solid.lathe([x, py, 0.16], 2, [[C, 0], [C, 0.26], [0.8 * sc, 0.4], [0.62 * sc, 0.4], [0.62 * sc, 0.04]], 16, { uPer: 5 });
    const hole = [];
    for (let j = 0; j < 12; j++) { const t = Math.PI * 2 * j / 12; hole.push([x + 0.63 * sc * Math.cos(t), py + 0.63 * sc * Math.sin(t), 0.2]); }
    solid.set({ kind: KIND.plain, w: 0, col: [0.03, 0.03, 0.03] });
    solid.poly(hole);
  }
  // an iron-collared slot for each roller's rod
  const ry = ROLLER.axis + ROLLER.frame, sl = ROLLER.slot;
  for (const x of P.TROUGH_X) {
    solid.set({ kind: KIND.iron, w: 0, col: [1, 1, 1] });
    solid.box(x - sl, x + sl, ry + 0.4, ry + 0.75, 0, 0.32, 'k');
    solid.box(x - sl, x + sl, ry - 0.75, ry - 0.4, 0, 0.32, 'k');
    solid.box(x - sl, x - 0.5, ry - 0.4, ry + 0.4, 0, 0.32, 'kud');
    solid.box(x + 0.5, x + sl, ry - 0.4, ry + 0.4, 0, 0.32, 'kud');
    solid.set({ kind: KIND.plain, w: 0, col: [0.03, 0.03, 0.03] });
    solid.quad([x - 0.5, ry - 0.4, 0.05], [x + 0.5, ry - 0.4, 0.05], [x + 0.5, ry + 0.4, 0.05], [x - 0.5, ry + 0.4, 0.05]);
  }
}
// THE WREATH: forty gumdrop jewels of frosted sugar on the brick round the way out's iron frame, in the wall's own
// frame (z out of its face). Each stands by itself, 0.84 to 1.1 m across, wholly outside the iron frame (a hand's gap
// of 0.2 m from its outer rim, so 1.75 m outside the opening's rim) and a quarter metre and more from its neighbours:
// separate sweets, never a closed band. Sizes and colours are dealt by the shed's own stream, no two neighbours
// alike. Each glows steadily by its own material; no light is added and nothing of it lights the ring.
async function wreath(solid, rng, x, y, pause) {
  const n = 40, hues = [[0.72, 0.02, 0.04], [0.85, 0.26, 0.02], [0.85, 0.62, 0.04], [0.1, 0.52, 0.06], [0.82, 0.1, 0.28], [0.3, 0.08, 0.6]], picked = [];
  const shape = [[1, 0], [0.96, 0.3], [0.84, 0.62], [0.6, 0.9], [0.24, 1.06]], ROUND = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];   // a gumdrop: [radius, height] in its own radius; twelve round
  for (let i = 0; i < n; i++) {
    const t = Math.PI * 2 * (i + 0.5) / n, s = Math.sin(t), r = 0.42 + 0.13 * rng(), R = 8.25 + r;
    let hue = Math.floor(rng() * 6) % 6;
    while (hue === picked[i - 1] || (i === n - 1 && hue === picked[0])) hue = (hue + 1) % 6;
    picked.push(hue);
    const rows = shape.map(([q, h]) => ROUND.map((j) => [x + R * Math.cos(t) + q * r * Math.cos(t + j * Math.PI / 6), y + R * s + q * r * Math.sin(t + j * Math.PI / 6), h * r]));
    solid.set({ kind: KIND.sugar, w: 0, col: hues[hue] }).skin(rows, (a, j) => [0.5236 * r * j, shape[a][1] * r], { wrap: true });
    solid.poly(rows[rows.length - 1]);
    if (i % 8 === 7) await pause();
  }
}
// THE ROSETTE's outer circle, beyond the wreath: twelve great peppermint discs, each a pinwheel of six arms, and
// between them twelve striped humbugs lying along the circle; all on the wall's face between 9.5 and 12.4 m from the
// way out's axis, so the whole rosette is twice the ring's width across. By place alone: no dice.
async function rosette(solid, x, y, pause) {
  const RC = 10.95, R = 1.4, RED = [0.78, 0.03, 0.05], GREEN = [0.05, 0.5, 0.12], AMBER = [0.85, 0.4, 0.02], PLUM = [0.34, 0.04, 0.44];
  for (let i = 0; i < 24; i++) {
    const t = Math.PI / 2 + Math.PI * 2 * i / 24, c = Math.cos(t), s = Math.sin(t), cx = x + RC * c, cy = y + RC * s;
    if (i % 2 === 0) {                                             // a disc: a striped rim, a bevel, and the pinwheel face
      const hue = i % 6 === 2 ? GREEN : RED, r1 = R - 0.18, face = [];
      solid.set({ kind: KIND.mint, w: 1, col: hue }).lathe([cx, cy, 0], 2, [[R, 0], [R, 0.3], [r1, 0.46]], 20, { uPer: 2.76, a0: t - 0.6388, a1: t - 0.6388 + Math.PI * 2 });
      for (let j = 0; j < 20; j++) { const a = Math.PI * 2 * j / 20; face.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), 0.46]); }
      solid.set({ w: 0 }).poly(face, face.map((q) => [(q[0] - cx) * c + (q[1] - cy) * s, (q[1] - cy) * c - (q[0] - cx) * s]));
    } else {                                                       // a humbug: a pillow pinched flat at both ends
      const rows = [-1, -0.86, -0.5, 0, 0.5, 0.86, 1].map((q) => {
        const half = 0.62 * (0.78 + 0.22 * (1 - q * q)), high = 0.62 * Math.sqrt(1 - q * q), row = [];
        for (let j = 0; j <= 6; j++) {
          const n = half * Math.cos(Math.PI * j / 6), h = high * Math.sin(Math.PI * j / 6);
          row.push([cx - s * q + c * n, cy + c * q + s * n, h]);
        }
        return row;
      });
      solid.set({ kind: KIND.mint, w: 1, col: i % 4 === 1 ? AMBER : PLUM }).skin(rows, (a, j) => [5 + [-1, -0.86, -0.5, 0, 0.5, 0.86, 1][a], 0.3 * j], { to: [cx, cy, 6] });
    }
    if (i % 4 === 3) await pause();
  }
}
// THE GREAT ARCH over the way out, springing from the two middle piers at the ring's own height: an inner order of
// brick on end, an outer order of brick banded with stone (every third voussoir), and a stone hood mould; stone
// imposts under its feet. Its soffit is 12.4 m from the way out's axis, so the rosette lies inside it.
async function arch(solid, x, y, pause) {
  const n = 36, at = (r, t, z) => [x + r * Math.cos(t), y + r * Math.sin(t), z];
  // one order, from z0 to z1 out of the wall; parts: f its face at z1 between r0 and r1, s its soffit at r0, b its back at r1
  const order = (r0, r1, z0, z1, stone, parts) => {
    for (let i = 0; i < n; i++) {
      const t0 = Math.PI * i / n, t1 = Math.PI * (i + 1) / n, u0 = t0 * r1, u1 = t1 * r1, st = stone(i), wide = 0.02 + 0.83 * (r1 - r0);
      solid.set(st ? { kind: KIND.ashlar, w: 0.7, col: [1, 1, 1] } : { kind: KIND.brick, w: 0.6, col: [0.9, 0.82, 0.8] });
      if (parts.includes('f')) solid.quad(at(r0, t0, z1), at(r1, t0, z1), at(r1, t1, z1), at(r0, t1, z1), st ? [[0.1, 0.08], [1.1, 0.08], [1.1, 0.82], [0.1, 0.82]] : [[0.02, u0], [wide, u0], [wide, u1], [0.02, u1]]);
      if (parts.includes('s')) solid.quad(at(r0, t1, z0), at(r0, t0, z0), at(r0, t0, z1), at(r0, t1, z1));
      if (parts.includes('b')) solid.quad(at(r1, t0, z0), at(r1, t1, z0), at(r1, t1, z1), at(r1, t0, z1));
    }
  };
  order(12.4, 12.9, 0, 0.45, () => false, 'fs'); await pause();
  order(12.9, 14.5, 0.45, 0.95, (i) => i % 3 === 1, 'fs'); await pause();
  order(14.5, 14.8, 0.95, 1.05, () => true, 'fs'); await pause();
  order(14.8, 14.8, 0, 1.05, () => true, 'b');                     // (the hood's back, down to the wall's face)
  solid.set({ kind: KIND.ashlar, w: 0.7, col: [1, 1, 1] });
  for (const sx of [-1, 1]) solid.box(x + Math.min(sx * 12.3, sx * 15.6), x + Math.max(sx * 12.3, sx * 15.6), y - 0.75, y, 0, 1.15, 'k');
}
// the terrace of dressed stone against the head wall, and on it the four long troughs, each running out at its front
// in a stone lip over the terrace's edge (the chocolate in them and the ribbons from them are the chocolate builder's)
function terrace(kit) {
  const { solid } = kit, T = P.TERRACE, TR = P.TROUGH, wall = 0.6, front = T.z0 + 0.45;
  solid.set({ kind: KIND.ashlar, w: 0.5, col: [1, 1, 1] });
  solid.box(T.x0, T.x1, 15.5, T.top - 0.5, T.z1, T.z0, 'ukd');
  solid.set({ w: 0.75 });
  solid.box(T.x0 - 0.25, T.x1 + 0.25, T.top - 0.5, T.top, T.z1, T.z0 + 0.25, 'k');
  for (const cx of P.TROUGH_X) {
    const hw = TR.width / 2;
    solid.set({ kind: KIND.ashlar, w: 0.85, col: [1, 1, 1] });
    solid.box(cx - hw - wall, cx - hw, T.top, TR.rim, TR.z1 - wall, front, 'd');
    solid.box(cx + hw, cx + hw + wall, T.top, TR.rim, TR.z1 - wall, front, 'd');
    solid.box(cx - hw, cx + hw, T.top, TR.rim, TR.z1 - wall, TR.z1, 'dlr');
    solid.box(cx - hw, cx + hw, T.top - 0.9, TR.level - 0.15, TR.z0 - 0.3, front, 'lr');       // the lip
    solid.set({ w: 0.25, col: [0.8, 0.78, 0.76] });
    solid.quad([cx - hw, T.top + 0.1, TR.z0 - 0.3], [cx + hw, T.top + 0.1, TR.z0 - 0.3], [cx + hw, T.top + 0.1, TR.z1], [cx - hw, T.top + 0.1, TR.z1]);
  }
}

export async function buildHead(kit) {
  const { solid, lace, glass, ctx } = kit, W = WALLS.head, T = P.TERRACE;
  inFrame(solid, W); inFrame(lace, W); inFrame(glass, W);
  await headWall(kit);
  await ctx.yield();
  await rosette(solid, P.EXIT.x, P.WINDOW.y, () => ctx.yield());
  await ctx.yield();
  await arch(solid, P.EXIT.x, P.WINDOW.y, () => ctx.yield());
  await ctx.yield();
  // the gallery under the windows, with a stair down to the terrace at each end of the troughs
  const floor = () => T.top, gaps = [stair(kit, W, 5.4, 1, P.SHED.gallery, floor, true), stair(kit, W, 49.9, 1, P.SHED.gallery, floor, true)];
  // under the gallery lies the terrace's top where the terrace stands, the plan's ground elsewhere; a joist and its
  // bracket that would come down on a roller's rod slot stand half a metre clear of the slot's collar instead
  const clear = ROLLER.slot + 0.5;
  await gallery(kit, W, W.a0, W.a1, gaps, true, {
    under: (a, d) => (a > T.x0 - 0.25 && a < T.x1 + 0.25 ? T.top : groundAt(W, a, d)),
    seat: (a) => { for (const x of P.TROUGH_X) if (Math.abs(a - x) < clear) return x + (a < x ? -clear : clear); return a; },
  });
  for (const a of P.COLUMN_X) lamp(kit, a, 38.4);
  await gutter(kit, W, W.a0, T.x0 - 0.5);
  await gutter(kit, W, T.x1 + 0.5, W.a1);
  solid.frame(null); lace.frame(null); glass.frame(null);
  await ctx.yield();
  terrace(kit);
  await ctx.yield();
  rollers(kit);
  await ctx.yield();
}

// THE ROLLERS: in each trough a granite roller lies across it and travels along it by the plan's rollerZ(i, time),
// turning as it goes; its axle hangs in an iron carriage whose four flanged wheels ride the trough's rims, pushed by a
// long rod that slides in and out of its slot in the head wall. Three instanced meshes, moved by the clock alone.
function rollers(kit) {
  const { THREE, mats, object } = kit, R = ROLLER, n = P.TROUGH_X.length, oil = [0.5, 0.47, 0.46];
  const rm = kit.makeMesh(), cm = kit.makeMesh(), wm = kit.makeMesh();
  rm.set({ kind: KIND.granite, w: 0, col: [1, 1, 1] });
  rm.lathe([0, 0, 0], 0, [[1.4, -2.5], [R.radius, -2.4], [R.radius, 2.4], [1.4, 2.5]], 28, { uPer: 9.42, cap: 'both' });
  rm.set({ kind: KIND.iron, w: 0, col: oil });
  for (const sx of [-1, 1]) {                                     // an iron hub plate with four bolts on each end
    rm.box(Math.min(sx * 2.5, sx * 2.6), Math.max(sx * 2.5, sx * 2.6), -0.55, 0.55, -0.55, 0.55);
    for (const [by, bz] of [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]]) rm.box(Math.min(sx * 2.6, sx * 2.72), Math.max(sx * 2.6, sx * 2.72), by - 0.1, by + 0.1, bz - 0.1, bz + 0.1);
  }
  // the carriage, about the roller's axis: axle, hangers over the rims, side bars, a cross-bar behind, the rod and its stays
  cm.set({ kind: KIND.iron, w: 0, col: oil });
  cm.lathe([0, 0, 0], 0, [[0.2, -2.95], [0.2, 2.95]], 8, { uPer: 1.2 });
  const fy = R.frame;
  for (const sx of [-1, 1]) {
    const x0 = Math.min(sx * 2.72, sx * 2.95), x1 = Math.max(sx * 2.72, sx * 2.95), xa = Math.min(sx * 2.72, sx * 3.56), xb = Math.max(sx * 2.72, sx * 3.56);
    cm.box(x0, x1, -0.34, fy + 0.16, -0.32, 0.32);
    cm.box(xa, xb, fy - 0.1, fy + 0.16, -0.26, 0.26);
    cm.bar([sx * 3.5, fy, -2.4], [sx * 3.5, fy, 2.4], 0.16, 0.34, [1, 0, 0]);
    cm.bar([sx * 3.5, fy, -2.4], [0, fy, -5.6], 0.14, 0.2, [0.7071, 0, -0.7071 * sx]);
    for (const sz of [-1, 1]) cm.box(Math.min(sx * 3.3, sx * 3.5), Math.max(sx * 3.3, sx * 3.5), fy - 0.09, fy + 0.09, sz * R.wheelZ - 0.09, sz * R.wheelZ + 0.09);
  }
  cm.bar([-3.58, fy, -2.4], [3.58, fy, -2.4], 0.3, 0.34, [0, 0, 1]);
  cm.lathe([0, fy, 0], 2, [[0.17, -22.6], [0.17, -2.4]], 8, { uPer: 1 });
  // a flanged wheel (its flange toward local +x)
  wm.set({ kind: KIND.iron, w: 0, col: oil });
  wm.lathe([0, 0, 0], 0, [[0.16, -0.14], [R.wheel, -0.14], [R.wheel, 0.1], [0.53, 0.1], [0.53, 0.17], [0.16, 0.17]], 14, { uPer: 2.6 });
  wm.box(-0.2, 0.22, -0.3, 0.3, -0.06, 0.06);                     // a spoke bar, so that the turning shows
  const make = (m, count, name) => {
    const g = m.build(THREE), mesh = new THREE.InstancedMesh(g, mats.solid, count);
    mesh.frustumCulled = false; mesh.name = name; object.add(mesh); kit.owned.push(g, mesh); kit.triangles += m.triangles * count; kit.calls++;
    return mesh;
  };
  const rMesh = make(rm, n, 'shed-rollers'), cMesh = make(cm, n, 'shed-carriages'), wMesh = make(wm, n * 4, 'shed-wheels');
  const mt = new THREE.Matrix4(), rot = new THREE.Matrix4(), flip = new THREE.Matrix4().makeRotationY(Math.PI);
  const place = (time) => {
    for (let i = 0; i < n; i++) {
      const cx = P.TROUGH_X[i], z = P.rollerZ(i, time);
      mt.makeRotationX(z / R.radius); mt.setPosition(cx, R.axis, z); rMesh.setMatrixAt(i, mt);
      mt.makeTranslation(cx, R.axis, z); cMesh.setMatrixAt(i, mt);
      for (let k = 0; k < 4; k++) {
        const sx = k < 2 ? -1 : 1, sz = k % 2 ? 1 : -1;
        rot.makeRotationX((z + sz * R.wheelZ) / R.wheel);
        if (sx < 0) mt.copy(rot); else mt.multiplyMatrices(rot, flip);
        mt.setPosition(cx + sx * R.wheelX, P.TROUGH.rim + R.wheel, z + sz * R.wheelZ);
        wMesh.setMatrixAt(i * 4 + k, mt);
      }
    }
    rMesh.instanceMatrix.needsUpdate = true; cMesh.instanceMatrix.needsUpdate = true; wMesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  kit.movers.push((dt, time) => place(time));
  // the clear air they leave over their whole courses (they stay on the terrace, far from the flown line)
  for (let i = 0; i < n; i++) for (const z of [-223.5, -216.5, -209.5]) kit.air(P.TROUGH_X[i] - 3.6, R.axis + 1.5, z, 'roller');
}
