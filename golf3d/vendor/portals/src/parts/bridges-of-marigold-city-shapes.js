// bridges-of-marigold, the city: SHAPES that several pieces lay into the accumulator (city-geo): a frame to place
// things by their own axes, an arched wall, a dome in gores, a flight of steps, a parapet with piers, a lit opening.
// A frame F = frame(x, y, z, yaw): F.p(lx, ly, lz) is the world place of a point given along the thing's own x (to
// its right seen from in front), up, and its own z (out of its front); yaw turns it about y as the blocks are turned.
export function frame(x, y, z, yaw = 0) {
  const s = Math.sin(yaw), c = Math.cos(yaw);
  return { x, y, z, yaw, p: (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c], sub(lx, ly, lz, turn = 0) { const q = this.p(lx, ly, lz); return frame(q[0], q[1], q[2], yaw + turn); } };
}
export function boxF(G, F, lx, ly, lz, w, h, d, bottom = true) { const q = F.p(lx, ly, lz); return G.box(q[0], q[1], q[2], w, h, d, F.yaw, bottom); }

// A wall with a round-headed way through it: the wall's front is the frame's z = 0 plane and it is `depth` thick
// behind that; the way is 2 * half wide, springs at height `spring` and the wall rises to `top`. Only the part
// between the two jambs is laid (the piers either side are blocks of the caller's).
export function archWall(G, F, half, spring, top, depth, seg = 12, back = true) {
  const P = [];
  for (let i = 0; i <= seg; i++) { const a = Math.PI * (1 - i / seg); P.push([half * Math.cos(a), spring + half * Math.sin(a)]); }
  for (let i = 0; i < seg; i++) {
    const a = P[i], b = P[i + 1];
    G.quad(F.p(a[0], a[1], 0), F.p(b[0], b[1], 0), F.p(b[0], top, 0), F.p(a[0], top, 0));
    if (back) G.quad(F.p(b[0], b[1], -depth), F.p(a[0], a[1], -depth), F.p(a[0], top, -depth), F.p(b[0], top, -depth));
    G.quad(F.p(b[0], b[1], 0), F.p(a[0], a[1], 0), F.p(a[0], a[1], -depth), F.p(b[0], b[1], -depth));
  }
  G.quad(F.p(-half, top, 0), F.p(half, top, 0), F.p(half, top, -depth), F.p(-half, top, -depth));
  return G;
}

// A dome in n gores and m rings on a round drum's top; colours alternate gore by gore (glazed tiles laid in stripes).
export function dome(G, x, y, z, r, h, n, m, colA, colB, kind = 1, v = 0.3) {
  const at = (i, j) => { const a = i * Math.PI * 2 / n, t = (j / m) * Math.PI / 2; return [x + r * Math.cos(t) * Math.sin(a), y + h * Math.sin(t), z + r * Math.cos(t) * Math.cos(a)]; };
  for (let i = 0; i < n; i++) {
    G.col(i % 2 ? colB : colA).aux(kind, v);
    for (let j = 0; j < m; j++) {
      if (j === m - 1) G.tri(at(i, j), at(i + 1, j), [x, y + h, z]);
      else G.quad(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
    }
  }
  return G;
}

// A flight of n solid steps climbing along the frame's -z from its origin (bottom edge at z = 0): each `run` deep
// and `rise` high, `w` wide, standing down to the foot of the flight.
export function steps(G, F, n, w, rise, run) {
  for (let i = 0; i < n; i++) boxF(G, F, 0, 0, -(i + 0.5) * run, w, (i + 1) * rise, run, false);
  return G;
}

// A parapet from a to b (level, at their own heights): a low wall `h` high and `t` thick with a pier and a ball
// every `bay` metres. Colours and kinds are the caller's (set before); piers take colB.
export function parapet(G, a, b, h, t, bay, col, colB, kind = 0, v = 0.3) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz); if (L < 0.5) return G;
  const yaw = Math.atan2(dx, dz) - Math.PI / 2, n = Math.max(1, Math.round(L / bay));
  G.col(col).aux(kind, v).box((a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2, L, h, t, yaw, false);
  G.col(colB).aux(kind, v + 0.1);
  for (let i = 0; i <= n; i++) {
    const s = i / n, px = a[0] + dx * s, pz = a[2] + dz * s, py = a[1] + (b[1] - a[1]) * s;
    G.box(px, py, pz, t + 0.3, h + 0.3, t + 0.3, yaw, false);
    G.prism(px, pz, py + h + 0.3, py + h + 0.75, 0.32, 0.05, 6, 0, false);
  }
  return G;
}

// A line of cut-paper flags from a to b, sagging `sag` at its middle: a cord and n flags of the given size hanging from
// it, their colours taken in turn from `cols`, their cut-out (flower, sun, leaf) in turn too. Both faces are laid.
export function flagLine(G, a, b, n, sag, w, hgt, cols, first = 0) {
  const at = (s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s - sag * 4 * s * (1 - s), a[2] + (b[2] - a[2]) * s];
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]), hs = Math.min(0.5 / n, (w / 2) / Math.max(L, 0.01));
  G.col([0.5, 0.48, 0.45]).aux(7, 0.6);
  for (let i = 0; i < 4; i++) G.beam(at(i / 4), at((i + 1) / 4), 0.05);
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n, p = at(s - hs), q = at(s + hs), lo = (v) => [v[0], v[1] - hgt, v[2]];
    G.col(cols[(i + first) % cols.length]).aux(10, (i + first) % 3);
    G.sheet(lo(p), lo(q), q, p); G.sheet(lo(p), lo(q), q, p, true);
  }
  return G;
}

// A band of carved stone round an arch (between the radii r0 and r1, springing at `spring`), `proud` of the frame's
// front plane, with its outer edge; and helpers of the gate's dress.
export function archBand(G, F, r0, r1, spring, proud, seg = 14) {
  const P = (r, i) => { const a = Math.PI * (1 - i / seg); return [r * Math.cos(a), spring + r * Math.sin(a)]; };
  for (let i = 0; i < seg; i++) {
    const a = P(r0, i), b = P(r0, i + 1), c = P(r1, i + 1), d = P(r1, i);
    G.quad(F.p(a[0], a[1], proud), F.p(b[0], b[1], proud), F.p(c[0], c[1], proud), F.p(d[0], d[1], proud));
    G.quad(F.p(d[0], d[1], proud), F.p(c[0], c[1], proud), F.p(c[0], c[1], 0), F.p(d[0], d[1], 0));
  }
  return G;
}

// A small dome of glazed tiles on an eight-sided drum with one lit band all round (never single openings side by side); r is the drum's radius; about 2.1 + 1.9 r high.
export function cupola(G, x, y, z, r, yaw, colA, colB, wall) {
  G.col(wall).aux(1, 0.55).prism(x, z, y, y + 1.5, r, r, 8, yaw, true);
  G.col([1, 0.62, 0.26]).aux(2, 1.4).prism(x, z, y + 0.4, y + 1.15, r + 0.03, r + 0.03, 8, yaw, false);
  dome(G, x, y + 1.5, z, r * 0.96, r * 0.95, 8, 3, colA, colB, 1, 0.5);
  G.col([0.9, 0.85, 0.7]).aux(1, 0.8).prism(x, z, y + 1.5 + r * 0.95, y + 2.1 + r * 0.95, 0.16, 0.03, 5, 0, false);
  return G;
}

// A belfry on the frame's origin: a square tower s wide and hb high with an open lit arch in each face, a pale band and
// a pointed cap of tiles (1.5 m more).
export function belfry(G, B, s, hb, wall) {
  G.col(wall).aux(1, 0.6); boxF(G, B, 0, 0, 0, s, hb, s, false);
  G.col([0.7, 0.66, 0.58]).aux(1, 0.7); boxF(G, B, 0, hb, 0, s + 0.3, 0.2, s + 0.3, true);
  for (let j = 0; j < 4; j++) {
    const P = B.sub(0, hb - 1.9, 0, j * Math.PI / 2), z = s / 2 + 0.03;
    G.col([1, 0.6, 0.22]).aux(2, 1.3).quad(P.p(-0.5, 0, z), P.p(0.5, 0, z), P.p(0.5, 1.2, z), P.p(-0.5, 1.2, z)); G.tri(P.p(-0.5, 1.2, z), P.p(0.5, 1.2, z), P.p(0, 1.65, z));
  }
  G.col([0.5, 0.19, 0.08]).aux(4, 0).prism(B.x, B.z, B.y + hb + 0.2, B.y + hb + 1.5, s * 0.78, 0.05, 4, B.yaw + Math.PI / 4, false);
  return G;
}

// A lit opening on a wall: a warm pane (a light of its own) in a frame, laid just proud of the frame's z = 0 plane.
export function litPane(G, F, lx, ly, w, h, col, strength, frameCol, arched = false) {
  const z = 0.06, hw = w / 2;
  G.col(frameCol).aux(1, 0.5); boxF(G, F, lx, ly - 0.18, 0.02, w + 0.36, 0.18, 0.22); boxF(G, F, lx - hw - 0.1, ly, 0.02, 0.2, h, 0.14); boxF(G, F, lx + hw + 0.1, ly, 0.02, 0.2, h, 0.14);
  G.col(col).aux(2, strength);
  G.quad(F.p(lx - hw, ly, z), F.p(lx + hw, ly, z), F.p(lx + hw, ly + h, z), F.p(lx - hw, ly + h, z));
  if (arched) { const s = 6; for (let i = 0; i < s; i++) { const a0 = Math.PI * (1 - i / s), a1 = Math.PI * (1 - (i + 1) / s); G.tri(F.p(lx, ly + h, z), F.p(lx + hw * Math.cos(a1), ly + h + hw * Math.sin(a1), z), F.p(lx + hw * Math.cos(a0), ly + h + hw * Math.sin(a0), z)); } }
  else boxF(G.col(frameCol).aux(1, 0.5), F, lx, ly + h, 0.02, w + 0.36, 0.18, 0.2);
  return G;
}
