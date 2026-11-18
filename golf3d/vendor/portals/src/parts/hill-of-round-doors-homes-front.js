// hill-of-round-doors, the homes: one FRONT laid into a geo in the home's own space (x along the front, to the
// right seen from outside; y up from the garden's level; z out of the hill): the arched wall on the plan's front
// line with its round holes, the course that edges the arch, the turf lip that roofs the gap to the mound and its
// ragged fringe, the round door deep in its reveal with knob and strap hinges, round windows, a chimney.
import { frontTop, DOOR, HALL, groundY } from './hill-of-round-doors-plan.js';
import { KIND, mul, mix } from './hill-of-round-doors-homes-geo.js';

const LIP_OUT = 0.4, LIP_UP = 0.14;                                                     // the turf lip: how far it stands out before the wall and over the outline, metres
const COURSE = 0.5, PROUD = 0.13;                                                       // the arch course: breadth, standing out
export const WALL = 0.5;                                                                // the wall's thickness

// The outline of a front: points from the right foot over the top to the left foot, each with its outward normal.
export function outlineOf(home, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI / 2 - Math.PI * i / n, u = home.w * Math.sin(t), y = i === 0 || i === n ? 0 : frontTop(home, u);
    pts.push({ x: u, y, t });
  }
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    pts[i].nx = ty; pts[i].ny = -tx;                          // the way runs right to left, so the outside is to its right
    if (i === 0) { pts[i].nx = 1; pts[i].ny = 0; } if (i === n) { pts[i].nx = -1; pts[i].ny = 0; }
  }
  let s = 0; for (let i = 0; i <= n; i++) { if (i) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); pts[i].s = s; }
  return pts;
}

// The wall's face with its holes, the course round the arch, and the lip. d: the home's deal (colours, kinds, holes).
export function layWall(G, home, d, look, n) {
  const O = outlineOf(home, n), wallC = d.wall, turf = d.turf;
  const outline = [[-home.w, -0.7], [home.w, -0.7]];
  for (const p of O) outline.push([p.x, p.y]);
  const holes = d.holes.map((h) => G.circle(h.x, h.y, h.r, h.seg));
  G.face(outline, holes, 0, wallC, d.wallKind, d.wallPar);
  // the course that edges the arch: a band standing proud of the wall, its inner side, and its feet
  const cc = d.course, cd = mul(d.course, 0.62);
  for (let i = 0; i < n; i++) {
    const a = O[i], b = O[i + 1];
    const ai = [a.x - a.nx * COURSE, a.y - a.ny * COURSE], bi = [b.x - b.nx * COURSE, b.y - b.ny * COURSE];
    G.poly([[ai[0], ai[1], PROUD], [a.x, a.y, PROUD], [b.x, b.y, PROUD], [bi[0], bi[1], PROUD]], [cc, cd, cd, cc], d.courseKind, 0,
      { uv: [[0, a.s], [COURSE, a.s], [COURSE, b.s], [0, b.s]], out: [0, 0, 1] });
    G.poly([[ai[0], ai[1], 0], [ai[0], ai[1], PROUD], [bi[0], bi[1], PROUD], [bi[0], bi[1], 0]], [cd, cc, cc, cd], d.courseKind, 0,
      { uv: [[COURSE + PROUD, a.s], [COURSE, a.s], [COURSE, b.s], [COURSE + PROUD, b.s]], out: [-a.nx, -a.ny, 0] });
  }
  for (const sgn of [1, -1]) { const x0 = sgn * home.w, x1 = sgn * (home.w - COURSE); G.box(Math.min(x0, x1), -0.7, 0, Math.max(x0, x1), 0.02, PROUD, cc, d.courseKind, 0, { skip: 'bk' }); }
  // the turf lip: a sod edge over the wall's top that runs back over the gap and then sinks gently into the mound
  // behind it (its last row lies under the land's ground). Its top wears the ground's own sward (the look's turf by
  // the land's law, in the material) and is shaded by the ground's own normal on the mound just behind it, a metre
  // across as the land's mesh has it: lip and mound are one roof of turf, with no band between them.
  const soil = mul(turf, 0.42), under = mul(turf, 0.25), sw = d.sward || turf;
  const rows = [[LIP_OUT, LIP_UP], [-0.6, LIP_UP], [-2.2, 0.06], [-3.6, -0.9]];
  const nr = rows.length, first = G.vertices, gAt = (u, v) => groundY(home.x + home.fz * u - home.fx * v, home.z - home.fx * u - home.fz * v);
  for (let i = 0; i <= n; i++) {
    const p = O[i], uc = Math.max(-home.w + 0.5, Math.min(home.w - 0.5, p.x));
    let nx = gAt(uc - 0.5, 3) - gAt(uc + 0.5, 3), ny = 1, nz = gAt(uc, 3.5) - gAt(uc, 2.5); const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    for (let r = 0; r < nr; r++) {
      // (over the last home's hall the last row stays shallow: the hall's own turf roof closes the ground there)
      const k = r === nr - 1 && home.kind === 'top' && Math.abs(p.x) < HALL.half - 0.2 ? -0.3 : rows[r][1];
      G.vert(p.x + p.nx * k, p.y + p.ny * k, rows[r][0], nx, ny, nz, sw, KIND.TURF, p.s, -rows[r][0]);
    }
  }
  for (let i = 0; i < n; i++) for (let r = 0; r < nr - 1; r++) { const a = first + i * nr + r, b = a + nr; G.tri(a, a + 1, b); G.tri(a + 1, b + 1, b); }
  for (let i = 0; i < n; i++) {                     // the sod's cut edge over the wall and its underside
    const a = O[i], b = O[i + 1];
    const top = (p, k) => [p.x + p.nx * k, p.y + p.ny * k];
    const a1 = top(a, LIP_UP), b1 = top(b, LIP_UP), a0 = top(a, -0.16), b0 = top(b, -0.16);
    const ta = mul(turf, d.lipTint[i % d.lipTint.length]), tb = mul(turf, d.lipTint[(i + 1) % d.lipTint.length]);
    G.poly([[a0[0], a0[1], LIP_OUT], [a1[0], a1[1], LIP_OUT], [b1[0], b1[1], LIP_OUT], [b0[0], b0[1], LIP_OUT]], [soil, mul(ta, 0.8), mul(tb, 0.8), soil], KIND.EARTH, 0, { out: [0, 0, 1] });
    G.poly([[a0[0], a0[1], PROUD], [a0[0], a0[1], LIP_OUT], [b0[0], b0[1], LIP_OUT], [b0[0], b0[1], PROUD]], under, KIND.EARTH, 0, { out: [-a.nx, -a.ny, 0] });
  }
  return O;
}

// The round door: a rim of shaped stones (or bricks on edge, or timber) standing proud, the reveal, and (unless
// o.leaf is false) the leaf of broad painted boards deep in it, a brass knob in its very middle and two strap
// hinges on one side. sun: the way to the sun in the home's own space, for the shade the reveal lays on the leaf.
export function layDoor(G, d, sun, o = {}) {
  const D = d.door, r = D.r, cy = D.y, seg = D.seg, zr = 0.16, zl = o.depth !== undefined ? -o.depth : -(WALL - 0.08);
  const rim = d.rim, back = mul(rim, 0.45);
  G.ring(0, cy, zr, r, r + D.rimW, seg, mul(rim, 0.9), rim, d.rimKind, d.rimPar);
  G.barrel(0, cy, r + D.rimW, 0, zr, seg, mul(rim, 0.65), rim, d.rimKind, d.rimPar, false);
  G.barrel(0, cy, r, zl, zr, seg, back, rim, d.rimKind, d.rimPar, true);
  if (o.leaf === false) return;
  const depth = zr - zl, ox = sun.z > 0.12 ? sun.x / sun.z * depth : 0, oy = sun.z > 0.12 ? sun.y / sun.z * depth : 0;
  const rings = [0.5, 0.78, 0.9, 0.965, 1], ao = [1, 1, 0.9, 0.72, 0.5];
  const shade = (x, y, k) => { const m = Math.min(1, Math.max(0, (r - Math.hypot(x + ox, y + oy)) / 0.3)); return mul(d.paint, k * (0.5 + 0.5 * m * m * (3 - 2 * m))); };
  const c0 = G.vert(0, cy, zl, 0, 0, 1, shade(0, 0, 1), KIND.BOARDS, 0, 0, D.board);
  const first = G.vertices;
  for (let j = 0; j < rings.length; j++) for (let i = 0; i <= seg; i++) {
    const t = i / seg * Math.PI * 2, x = Math.cos(t) * r * rings[j], y = Math.sin(t) * r * rings[j];
    G.vert(x, cy + y, zl, 0, 0, 1, shade(x, y, ao[j]), KIND.BOARDS, x, y, D.board);
  }
  for (let i = 0; i < seg; i++) G.tri(c0, first + i, first + i + 1);
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < seg; i++) { const a = first + j * (seg + 1) + i, b = a + seg + 1; G.tri(a, b, a + 1); G.tri(a + 1, b, b + 1); }
  layKnob(G, 0, cy, zl, d.brass, D.knob, D.detail);
  layStraps(G, cy, r, zl, d.hinge, d.iron, D.detail);
}

// A brass knob on a round back plate, standing out of the plane z0 at (x, y).
export function layKnob(G, x, y, z0, brass, kr, detail) {
  const dark = mul(brass, 0.55), s = detail ? 12 : 8;
  G.ring(x, y, z0 + 0.03, 0, kr * 1.7, s, dark, mul(brass, 0.8), KIND.BRASS);
  G.tube([x, y, z0], [x, y, z0 + kr * 1.3], kr * 0.42, kr * 0.36, s, dark, KIND.BRASS, 0, { cb: brass });
  G.ball(x, y, z0 + kr * 1.75, kr, s, detail ? 8 : 5, brass, KIND.BRASS, 0, 1, 1, 0.82, dark);
}

// Two strap hinges on the side `side` (-1 left, 1 right) of a round leaf of radius r centred (0, cy) in the plane z0.
export function layStraps(G, cy, r, z0, side, iron, detail) {
  const z1 = z0 + 0.06, lit = mul(iron, 1.5);
  for (const dy of [0.45 * r, -0.45 * r]) {
    const y = cy + dy, xe = side * (Math.sqrt(r * r - dy * dy) - 0.04), xt = side * r * 0.12, h0 = 0.11 * r / 2.1, h1 = 0.05 * r / 2.1;
    G.poly([[xe, y - h0, z1], [xt, y - h1, z1], [xt, y + h1, z1], [xe, y + h0, z1]], lit, KIND.PAINT, 0, { out: [0, 0, 1] });
    G.poly([[xe, y + h0, z0], [xe, y + h0, z1], [xt, y + h1, z1], [xt, y + h1, z0]], iron, KIND.PAINT, 0, { out: [0, 1, 0] });
    G.poly([[xe, y - h0, z0], [xe, y - h0, z1], [xt, y - h1, z1], [xt, y - h1, z0]], mul(iron, 0.6), KIND.PAINT, 0, { out: [0, -1, 0] });
    G.ring(xt, y, z1 + 0.004, 0, h1 * 2.3, detail ? 10 : 6, lit, lit, KIND.PAINT);
    if (detail) G.tube([xe - side * 0.05, y - h0 * 1.5, z1], [xe - side * 0.05, y + h0 * 1.5, z1], 0.07, 0.07, 8, iron, KIND.PAINT, 0, { caps: true });
  }
}

// A round window: a painted frame standing proud, its reveal, the pane deep in it (the room behind glows by the
// look), glazing bars in a cross, and a stone sill. w: { x, y, r, seg, seed }.
export function layWindow(G, d, w, detail) {
  const zr = 0.1, zg = -0.3, ri = w.r - 0.13, ro = w.r + 0.17, f = d.frame, fd = mul(f, 0.5), seg = w.seg;
  G.ring(w.x, w.y, zr, ri, ro, seg, mul(f, 0.92), f, KIND.PAINT);
  G.barrel(w.x, w.y, ro, 0, zr, seg, mul(f, 0.7), f, KIND.PAINT, 0, false);
  G.barrel(w.x, w.y, ri, zg, zr, seg, fd, f, KIND.PAINT, 0, true);
  const c0 = G.vert(w.x, w.y, zg, 0, 0, 1, [1, 1, 1], KIND.GLASS, 0, 0, w.seed), first = G.vertices;
  for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2; G.vert(w.x + Math.cos(t) * ri, w.y + Math.sin(t) * ri, zg, 0, 0, 1, [1, 1, 1], KIND.GLASS, Math.cos(t) * 0.9, Math.sin(t) * 0.9, w.seed); }
  for (let i = 0; i < seg; i++) G.tri(c0, first + i, first + i + 1);
  const b = 0.045 * (w.r / 0.85 + 1) / 2, zb = zg + 0.07, bars = detail && w.r > 0.7 ? [-0.36, 0.36] : [0];
  for (const k of bars) {
    const off = k * ri, half = Math.sqrt(ri * ri - off * off);
    G.box(w.x + off - b, w.y - half, zg, w.x + off + b, w.y + half, zb, f, KIND.PAINT, 0, { skip: 'kbt' });
    G.box(w.x - half, w.y + off - b, zg, w.x + half, w.y + off + b, zb, f, KIND.PAINT, 0, { skip: 'klr' });
  }
  const sy = w.y - ro - 0.02;
  G.box(w.x - ro * 0.95, sy - 0.2, 0, w.x + ro * 0.95, sy, 0.34, d.sill, KIND.STONE, 2.2, { skip: 'k', low: mul(d.sill, 0.7) });
}

// The ragged fringe of the lip: grass blades hanging over the wall's top and standing along the sod's edge. O: the
// outline; count blades, dealt by rng (a stream of the home's own); each blade is one triangle the wind stirs.
export function layFringe(G, O, d, rng, count) {
  const S = O[O.length - 1].s, turf = d.turf;
  let k = 0;
  for (let b = 0; b < count; b++) {
    const s = rng() * S, hang = rng() < 0.62, len = hang ? 0.3 + 0.6 * rng() * rng() : 0.25 + 0.4 * rng(), wd = 0.07 + 0.09 * rng(), lean = (rng() - 0.5) * 0.5, tone = 0.75 + 0.5 * rng(), zj = rng();
    while (k < O.length - 2 && O[k + 1].s < s) k++;
    if (O[k].s > s) k = 0;
    while (k < O.length - 2 && O[k + 1].s < s) k++;
    const a = O[k], c = O[k + 1], f = (s - a.s) / Math.max(1e-6, c.s - a.s);
    const nx = a.nx + (c.nx - a.nx) * f, ny = a.ny + (c.ny - a.ny) * f, tx = -ny, ty = nx;
    const ex = a.x + (c.x - a.x) * f + nx * LIP_UP, ey = a.y + (c.y - a.y) * f + ny * LIP_UP;
    const root = mul(turf, 0.7 * tone), tip = mix(mul(turf, 1.25 * tone), [0.5 * tone, 0.5 * tone, 0.16 * tone], 0.3);
    if (hang) {
      const z = LIP_OUT + 0.01;
      const v0 = G.vert(ex - tx * wd, ey - ty * wd, z, 0, 0.35, 0.94, root, KIND.LEAF), v1 = G.vert(ex + tx * wd, ey + ty * wd, z, 0, 0.35, 0.94, root, KIND.LEAF);
      const v2 = G.vert(ex + tx * lean, ey + ty * lean - len, z + 0.06 + 0.1 * zj, 0, 0.35, 0.94, tip, KIND.LEAF, 0, 0, 0, 0.05 + 0.12 * len);
      G.tri(v0, v1, v2);
    } else {
      const z = LIP_OUT - 0.02 - 0.5 * zj;
      const v0 = G.vert(ex - tx * wd, ey - ty * wd, z, nx * 0.4, ny * 0.4, 0.9, root, KIND.LEAF), v1 = G.vert(ex + tx * wd, ey + ty * wd, z, nx * 0.4, ny * 0.4, 0.9, root, KIND.LEAF);
      const v2 = G.vert(ex + nx * len + tx * lean, ey + ny * len + ty * lean, z + 0.08, nx * 0.4, ny * 0.4, 0.9, tip, KIND.LEAF, 0, 0, 0, 0.1 + 0.2 * len);
      G.tri(v0, v1, v2);
    }
  }
}

// The chimney: a stubby stack standing out of the mound behind the front, a cap course and clay pots. Returns the
// places (home space) the smoke rises from.
export function layChimney(G, home, d) {
  const C = d.chimney, wx = home.x + home.fz * C.x - home.fx * C.v, wz = home.z - home.fx * C.x - home.fz * C.v;
  const gy = groundY(wx, wz) - home.y, hw = C.w / 2, y0 = gy - 0.8, y1 = gy + C.h, z = -C.v, col = d.stack, low = mul(col, 0.6);
  G.box(C.x - hw, y0, z - hw, C.x + hw, y1, z + hw, col, d.stackKind, d.stackPar, { skip: 'bt', low });
  G.box(C.x - hw - 0.12, y1, z - hw - 0.12, C.x + hw + 0.12, y1 + 0.3, z + hw + 0.12, mul(col, 1.08), d.stackKind, d.stackPar, { low: mul(col, 0.8) });
  const tops = [], pot = d.pot, n = C.pots, seg = d.door.detail ? 10 : 6;
  for (let i = 0; i < n; i++) {
    const px = C.x + (n === 1 ? 0 : (i - 0.5) * C.w * 0.5), ph = 0.6 + 0.25 * ((i * 7 + 3) % 5) / 5;
    G.tube([px, y1 + 0.3, z], [px, y1 + 0.3 + ph, z], 0.3, 0.24, seg, mul(pot, 0.7), KIND.PAINT, 0, { cb: pot });
    const mouth = []; for (let k = 0; k < seg; k++) { const t = k / seg * Math.PI * 2; mouth.push([px + Math.cos(t) * 0.23, y1 + 0.3 + ph - 0.08, z - Math.sin(t) * 0.23]); }
    G.poly(mouth, [0.02, 0.018, 0.016], KIND.PAINT, 0, { out: [0, 1, 0] });      // the sooty mouth of the pot
    tops.push([px, y1 + 0.3 + ph, z]);
  }
  return tops;
}
