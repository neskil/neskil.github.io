// doors-in-transit: THE QUIET BAY (a piece of the joiner's shed). A small brick-and-stone pavilion standing alone at the
// -z end of the arena, open toward +z, where the marked door stops: the way out. Of the hall's own family: brick with
// bands, stone, glazed tile, iron and glass. Its back wall is flat: a tiled dado, upright panels of plain tile between flat
// stone pilasters, a stone band, a tiled frieze and a cornice, and over it a gable with one long flat panel of banded tile,
// rising above the roof; a pitched roof of obscured glass on iron ribs with a ridge lantern lets the light down; the spur's
// rail is carried on iron brackets from the back wall to a braced stop; iron gates hang folded back against the jambs of
// the mouth; the floor is tiled.
// Nothing stands in it and nothing is lettered. There is no lamp: an inside face only adds 8.5 per cent of its own colour
// times the sun's (the brick's material does that), and the engine draws the way out itself.
import { BAY, SPUR } from './doors-in-transit-plan.js';

// the roof's iron ribs: nine of them, from just inside the mouth to the back wall, this far apart (the floor's material
// lays its ladder of light by the same number)
export const BAY_ROOF_Z0 = BAY.zFront + 0.2, BAY_RIBS = 8, BAY_RIB_STEP = (BAY_ROOF_Z0 - BAY.zBack) / BAY_RIBS;

// a straight iron bar from a to b: hw = half its width, hh = half its depth (the iron's material is two-sided)
export function rod(mesh, a, b, hw, hh) {
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  let sx, sy, sz, ux, uy, uz;
  if (Math.abs(dy) > 0.99) { sx = 1; sy = 0; sz = 0; ux = 0; uy = 0; uz = 1; } else {
    const sl = Math.hypot(dz, dx); sx = dz / sl; sy = 0; sz = -dx / sl;              // across: level, square to the bar
    ux = sy * dz - sz * dy; uy = sz * dx - sx * dz; uz = sx * dy - sy * dx;          // and square to both
  }
  const c = (p, i, j) => [p[0] + sx * hw * i + ux * hh * j, p[1] + sy * hw * i + uy * hh * j, p[2] + sz * hw * i + uz * hh * j];
  for (const [i0, j0, i1, j1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) mesh.quad(c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0));
  return mesh;
}

export function buildBay(brick, iron, glass, floor, wallKit) {
  const x0 = BAY.x0, x1 = BAY.x1, zf = BAY.zFront, zb = BAY.zBack, T = 1.4, H = BAY.height, IN = 1.2;
  const EX = x1 + T, EH = H + 1.6, LX = 1.6, LY = 25.6, pitch = (LY - EH) / (EX - LX);     // eaves, the lantern's foot, the roof's pitch
  const roofAt = (x) => EH + (EX - Math.abs(x)) * pitch;                                   // the glass over a place
  const gab = (x) => EH + 2.0 + (EX - Math.abs(x)) * 0.74;                                 // the back gable's top line
  const zS = SPUR.endZ, slit = { y0: 2.2, y1: SPUR.rail + 1.6, hw: 1.2 };
  const stone = (w = 1) => brick.set({ kind: 1, w }), bricks = (w = 1) => brick.set({ kind: 2, w }), tiles = (w = 1) => brick.set({ kind: 3, w }), plain = (w = 1) => brick.set({ kind: 4, w });
  const kit = (W) => { const k = wallKit(brick, W); k.W = W; return k; };
  const face = (k, pts) => brick.poly(pts.map((p) => k.W(p[0], p[1], p[2] || 0)));

  // ---- a side wall, inside: plain banded brick between stone pilasters, a tiled dado, a string course; in its middle a
  // tall slit: the right wall's lets the spur's rail in, the left wall's is a window of the same shape
  const sideIn = (k, a0, a1, aS, glaze) => {
    const s0 = aS - slit.hw, s1 = aS + slit.hw;
    bricks(IN); k.rect(a0, s0, 0, EH); k.rect(s1, a1, 0, EH); k.rect(s0, s1, 0, slit.y0); k.rect(s0, s1, slit.y1, EH);
    stone(IN);                                                             // the slit's reveals, half the wall deep
    face(k, [[s1, slit.y0, -T / 2], [s1, slit.y0, 0], [s1, slit.y1, 0], [s1, slit.y1, -T / 2]]); face(k, [[s0, slit.y0, 0], [s0, slit.y0, -T / 2], [s0, slit.y1, -T / 2], [s0, slit.y1, 0]]);
    face(k, [[s0, slit.y0, 0], [s1, slit.y0, 0], [s1, slit.y0, -T / 2], [s0, slit.y0, -T / 2]]); face(k, [[s0, slit.y1, -T / 2], [s1, slit.y1, -T / 2], [s1, slit.y1, 0], [s0, slit.y1, 0]]);
    if (glaze) { glass.set({ kind: 2, w: 1.05 }); glass.poly([[s0, slit.y0], [s1, slit.y0], [s1, slit.y1], [s0, slit.y1]].map((p) => k.W(p[0], p[1], -T / 2)), [[0, 0], [2.4, 0], [2.4, slit.y1 - slit.y0], [0, slit.y1 - slit.y0]]); }
    for (const [b0, b1, sk] of [[a0, s0 - 0.3, 'ld'], [s1 + 0.3, a1, 'rd']]) {
      stone(IN); k.block(b0, b1, 0, 1.6, 0, 0.35, sk); k.block(b0, b1, 4.6, 5.0, 0, 0.24, sk); k.block(b0, b1, 14.4, 15.2, 0, 0.32, sk);
      tiles(IN); k.rect(b0, b1, 1.6, 4.6, 0.06);
    }
    stone(IN);
    for (const pa of [aS - 3.6, aS + 3.6]) { k.block(pa - 0.6, pa + 0.6, 1.6, 14.4, 0, 0.5, 'ud'); k.block(pa - 0.8, pa + 0.8, 0, 2.0, 0, 0.7, 'd'); k.block(pa - 0.8, pa + 0.8, 13.5, 14.4, 0, 0.7); }
  };
  sideIn(kit((a, y, d) => [x0 + d, y, -a]), -zf, -zb, -zS, true);            // the left wall: a = -z from the mouth to the back
  sideIn(kit((a, y, d) => [x1 - d, y, a]), zb, zf, zS, false);               // the right wall: a = z from the back to the mouth

  // ---- a side wall, outside: two round-headed blind arches either side of the slit, a plinth, a corbelled eaves course
  const sideOut = (k, a0, a1, aS, glaze) => {
    const s0 = aS - slit.hw, s1 = aS + slit.hw;
    bricks(); k.rect(a0, s0, 0, 5); k.rect(s1, a1, 0, 5); k.rect(s0, s1, 0, slit.y0); k.rect(s0, s1, slit.y1, EH); k.rect(a0, s0, 14, EH); k.rect(s1, a1, 14, EH);
    for (const [b0, b1] of [[a0, s0], [s1, a1]]) { bricks(); k.arched(b0, b1, 5, 14, [[(b0 + b1) / 2, 1.9, 9.6]], T / 2, 8, null, 0.86); }
    stone();
    face(k, [[s1, slit.y0, -T / 2], [s1, slit.y0, 0], [s1, slit.y1, 0], [s1, slit.y1, -T / 2]]); face(k, [[s0, slit.y0, 0], [s0, slit.y0, -T / 2], [s0, slit.y1, -T / 2], [s0, slit.y1, 0]]);
    face(k, [[s0, slit.y0, 0], [s1, slit.y0, 0], [s1, slit.y0, -T / 2], [s0, slit.y0, -T / 2]]); face(k, [[s0, slit.y1, -T / 2], [s1, slit.y1, -T / 2], [s1, slit.y1, 0], [s0, slit.y1, 0]]);
    if (glaze) { glass.set({ kind: 2, w: 1.05 }); glass.poly([[s0, slit.y0], [s1, slit.y0], [s1, slit.y1], [s0, slit.y1]].map((p) => k.W(p[0], p[1], -T / 2 + 0.02)), [[0, 0], [2.4, 0], [2.4, slit.y1 - slit.y0], [0, slit.y1 - slit.y0]]); }
    stone(); k.block(a0, s0 - 0.3, 0, 1.6, 0, 0.35, 'ld'); k.block(s1 + 0.3, a1, 0, 1.6, 0, 0.35, 'rd');
    k.block(a0, a1, EH - 1.0, EH + 0.05, 0, 0.5, 'lr');                      // the eaves course, on a row of brick dentils
    bricks(1.04); for (let a = a0 + 0.4; a < a1 - 0.5; a += 1.0) k.block(a, a + 0.5, EH - 1.6, EH - 1.0, 0, 0.4, 'u');
  };
  sideOut(kit((a, y, d) => [x0 - T - d, y, a]), zb - T, zf, zS, true);
  sideOut(kit((a, y, d) => [x1 + T + d, y, -a]), -zf, -zb + T, -zS, false);

  // ---- the back wall, inside: a flat wall behind the door's place. A tiled dado, four upright panels of plain tile between
  // five flat stone pilasters (one stands on the hall's axis, so that no panel sits behind the door), a stone band, a
  // tiled frieze, a cornice on stone blocks. Nothing round-headed here, nothing that follows the door's outline.
  let k = kit((a, y, d) => [a, y, zb + d]);
  const FY = 18, PIL = [-9.8, -4.9, 0, 4.9, 9.8], PW = 0.65;                 // where the gable begins; the pilasters' middles, half their width
  bricks(IN); k.rect(x0, x1, 0, FY);
  stone(IN); k.block(x0, x1, 0, 1.6, 0, 0.35, 'lrd');
  for (const pa of PIL) { k.block(pa - PW, pa + PW, 1.6, 13.2, 0, 0.4, 'ud'); k.block(pa - PW - 0.2, pa + PW + 0.2, 13.2, 14.0, 0, 0.55, 'u'); }
  for (let i = 0; i < PIL.length - 1; i++) {
    const q0 = PIL[i] + PW + 0.35, q1 = PIL[i + 1] - PW - 0.35;
    tiles(IN); k.rect(q0, q1, 1.6, 4.6, 0.06); plain(IN); k.rect(q0, q1, 5.8, 12.6, 0.06);       // the dado in bands; an upright panel of plain tile
    stone(IN); k.block(PIL[i] + PW, PIL[i + 1] - PW, 4.6, 5.0, 0, 0.24, 'lr');       // the dado's rail; the panel's plain stone border
    k.block(q0 - 0.2, q1 + 0.2, 5.6, 5.8, 0, 0.2); k.block(q0 - 0.2, q1 + 0.2, 12.6, 12.8, 0, 0.2);
    k.block(q0 - 0.2, q0, 5.8, 12.6, 0, 0.2, 'ud'); k.block(q1, q1 + 0.2, 5.8, 12.6, 0, 0.2, 'ud');
  }
  stone(IN); k.block(x0, x1, 14.0, 14.5, 0, 0.6, 'lr');                       // the stone band
  tiles(IN); k.rect(x0, x1, 14.5, 16.0, 0.3);                                // the tiled frieze
  stone(IN); k.block(x0, x1, 16.0, 16.9, 0, 1.2, 'lr');                       // the cornice, on stone blocks
  for (let a = x0 + 0.6; a < x1 - 0.8; a += 1.6) k.block(a, a + 0.7, 15.4, 16.0, 0.3, 0.8, 'u');
  // the gable over it: its own brick, and across it one long flat panel of tile in bands within a plain stone border
  // (no arch here, and no pair of anything)
  tiles(IN); k.rect(-5.0, 5.0, 18.5, 20.5, 0.08);
  stone(IN); k.block(-5.3, 5.3, 18.2, 18.5, 0, 0.22); k.block(-5.3, 5.3, 20.5, 20.8, 0, 0.22);
  k.block(-5.3, -5.0, 18.5, 20.5, 0, 0.22, 'ud'); k.block(5.0, 5.3, 18.5, 20.5, 0, 0.22, 'ud');
  bricks(IN); k.rect(-5.4, 5.4, FY, 22.2);
  face(k, [[x0, FY], [-5.4, FY], [-5.4, gab(5.4)], [x0, gab(x0)]]); face(k, [[5.4, FY], [x1, FY], [x1, gab(x1)], [5.4, gab(5.4)]]);
  face(k, [[-5.4, 22.2], [5.4, 22.2], [5.4, gab(5.4)], [0, gab(0)], [-5.4, gab(5.4)]]);
  face(k, [[x1, EH], [EX, EH], [EX, gab(EX)], [x1, gab(x1)]]); face(k, [[-EX, EH], [x0, EH], [x0, gab(x0)], [-EX, gab(EX)]]);
  // ---- the back wall, outside: three tall blind arches, a stone band, the gable; stone copings, kneelers and a finial
  k = kit((a, y, d) => [-a, y, zb - T - d]);
  bricks(); k.arched(-EX, EX, 0, 14.5, [[-7, 2.3, 9.6], [0, 2.7, 10.4], [7, 2.3, 9.6]], 0.7, 8); k.rect(-EX, EX, 14.5, FY);
  face(k, [[-EX, FY], [EX, FY], [EX, gab(EX)], [0, gab(0)], [-EX, gab(EX)]]);
  stone(); k.block(-EX, EX, 14.5, 15.4, 0, 0.3, 'lr'); k.block(-EX, EX, 0, 1.6, 0, 0.35, 'lrd');
  bricks(); brick.quad([-EX, EH, zb - T], [-EX, EH, zb], [-EX, gab(EX), zb], [-EX, gab(EX), zb - T]); brick.quad([EX, EH, zb], [EX, EH, zb - T], [EX, gab(EX), zb - T], [EX, gab(EX), zb]);
  stone();
  const zF = zb + 0.35, zK = zb - T - 0.35, xa = EX + 0.5, ya = gab(xa), yb = gab(0);
  for (const sg of [-1, 1]) {
    const Q = (p0, p1, p2, p3) => { const m = (p) => [p[0] * -sg, p[1], p[2]]; return sg < 0 ? brick.quad(m(p0), m(p1), m(p2), m(p3)) : brick.quad(m(p3), m(p2), m(p1), m(p0)); };
    // (written for the left rake, x from -xa up to 0; the right one is its mirror)
    Q([-xa, ya + 0.6, zF], [0, yb + 0.6, zF], [0, yb + 0.6, zK], [-xa, ya + 0.6, zK]);              // the coping's top
    Q([-xa, ya - 0.05, zF], [0, yb - 0.05, zF], [0, yb + 0.6, zF], [-xa, ya + 0.6, zF]);            // its face toward the bay
    Q([0, yb - 0.05, zK], [-xa, ya - 0.05, zK], [-xa, ya + 0.6, zK], [0, yb + 0.6, zK]);            // its face toward the end wall
    Q([-xa, ya - 0.05, zK], [-xa, ya - 0.05, zF], [-xa, ya + 0.6, zF], [-xa, ya + 0.6, zK]);        // its low end
    Q([-xa, ya - 0.05, zK], [0, yb - 0.05, zK], [0, yb - 0.05, zF], [-xa, ya - 0.05, zF]);          // its underside
    brick.box(Math.min(sg * 11.9, sg * 13.2), Math.max(sg * 11.9, sg * 13.2), EH + 0.05, ya + 0.2, zK, zF);   // a kneeler
    brick.quad([sg < 0 ? -EX : x1, EH, zf + 0.2], [sg < 0 ? x0 : EX, EH, zf + 0.2], [sg < 0 ? x0 : EX, EH, zb], [sg < 0 ? -EX : x1, EH, zb]);   // the side wall's top
  }
  brick.box(-0.7, 0.7, yb + 0.3, yb + 2.3, zK - 0.1, zF + 0.1, 'du');
  { const t = [0, yb + 3.5, (zK + zF) / 2], c = [[-0.7, zF + 0.1], [0.7, zF + 0.1], [0.7, zK - 0.1], [-0.7, zK - 0.1]];
    for (let i = 0; i < 4; i++) brick.poly([[c[i][0], yb + 2.3, c[i][1]], [c[(i + 1) % 4][0], yb + 2.3, c[(i + 1) % 4][1]], t]); }
  // ---- the mouth: stone quoins, the tiled floor on a low step, an iron beam, a stone cornice on brick dentils
  k = kit((a, y, d) => [a, y, zf + d]);
  stone(); k.rect(-EX, x0, 0, H + 1.5); k.rect(x1, EX, 0, H + 1.5); k.rect(x0, x1, 0, 0.35);
  floor.set({ kind: 2, w: 1 }); floor.quad([x0, 0.35, zf], [x1, 0.35, zf], [x1, 0.35, zb], [x0, 0.35, zb]);
  iron.set({ kind: 0, w: 1 }); iron.box(-EX, EX, H, H + 1.5, zf - 0.35, zf + 0.35, 'lr');
  stone(); brick.box(-EX - 0.5, EX + 0.5, H + 1.45, H + 2.8, zf - 0.45, zf + 0.85);
  bricks(1.04); for (let x = -EX + 0.25; x < EX - 0.4; x += 1.0) brick.box(x, x + 0.5, H + 0.9, H + 1.45, zf + 0.35, zf + 0.75, 'k');
  // ---- the roof: two slopes of fine-barred glass from the eaves to a ridge lantern, a glazed gable over the mouth
  const za = BAY_ROOF_Z0, sl = Math.hypot(EX - LX, LY - EH), LT = LY + 1.4, RT = LT + 0.9, yg = H + 2.8, xg = EX - (yg - EH) / pitch;
  const pane = (pts, uv) => { glass.set({ kind: 3, w: 0.95 }); glass.poly(pts, uv); glass.set({ kind: 3, w: 1.15 }); glass.poly(pts.slice().reverse(), uv.slice().reverse()); };
  for (const sg of [-1, 1]) {
    const m = (x, y, z) => [x * -sg, y, z], fl = (pts, uv) => (sg < 0 ? pane(pts, uv) : pane(pts.slice().reverse(), uv.slice().reverse()));
    fl([m(-EX, EH, za), m(-LX, LY, za), m(-LX, LY, zb), m(-EX, EH, zb)], [[za, 0], [za, sl], [zb, sl], [zb, 0]]);                 // a slope
    fl([m(-LX, LY, zb), m(-LX, LY, za), m(-LX, LT, za), m(-LX, LT, zb)], [[zb, 0], [za, 0], [za, 1.4], [zb, 1.4]]);               // the lantern's side
    fl([m(-LX, LT, za), m(0, RT, za), m(0, RT, zb), m(-LX, LT, zb)], [[za, 0], [za, 1.84], [zb, 1.84], [zb, 0]]);                 // its little slope
  }
  pane([[-xg, yg, za], [xg, yg, za], [LX, LY, za], [-LX, LY, za]], [[-xg, yg], [xg, yg], [LX, LY], [-LX, LY]]);                  // the gable over the mouth
  pane([[-LX, LY, za], [LX, LY, za], [LX, LT, za], [0, RT, za], [-LX, LT, za]], [[-LX, LY], [LX, LY], [LX, LT], [0, RT], [-LX, LT]]);
  // ---- its iron: nine ribs a side under the glass, the lantern's posts and rafters, purlins and a ridge
  iron.set({ kind: 2, w: 1 });
  for (let i = 0; i <= BAY_RIBS; i++) {
    const z = za - BAY_RIB_STEP * i + (i === 0 ? 0.15 : i === BAY_RIBS ? -0.15 : 0);
    for (const sg of [-1, 1]) { rod(iron, [sg * (EX - 0.2), EH - 0.3, z], [sg * LX, LY - 0.3, z], 0.13, 0.26); rod(iron, [sg * LX, LY - 0.3, z], [sg * LX, LT, z], 0.1, 0.1); rod(iron, [sg * LX, LT, z], [0, RT - 0.05, z], 0.08, 0.1); }
  }
  for (const [x, y] of [[0, RT - 0.05], [-LX, LY - 0.3], [LX, LY - 0.3], [-LX, LT], [LX, LT], [-7, roofAt(7) - 0.35], [7, roofAt(7) - 0.35]]) rod(iron, [x, y, za], [x, y, zb], 0.11, 0.14);
  rod(iron, [0, yg, za + 0.12], [0, LY, za + 0.12], 0.14, 0.12); for (const sg of [-1, 1]) rod(iron, [sg * 5.6, yg, za + 0.12], [sg * 5.6, roofAt(5.6) - 0.3, za + 0.12], 0.12, 0.12);
  // ---- the spur's rail carried from the back wall: gallows brackets (an arm over the rail, a strut, a wall plate), and
  // at the rail's end a braced stop plate behind the works' own block
  iron.set({ kind: 3, w: 1 });
  const ry = SPUR.rail + 1.12, bracket = (x, zw, hw, top = 13.0) => {
    rod(iron, [x, ry, zw - 0.2], [x, ry, zS + 0.7], hw, 0.25); rod(iron, [x, 9.2, zw], [x, ry - 0.28, zS - 1.9], hw * 0.8, 0.16);
    iron.box(x - 0.32, x + 0.32, 8.5, top, zw - 0.05, zw + 0.07);
  };
  bracket(4.9, zb + 0.4, 0.17); bracket(-4.9, zb + 0.4, 0.17); bracket(9.8, zb + 0.4, 0.15);
  bracket(SPUR.bufferX - 1.0, zb + 0.07, 0.17, 12.6);                           // (on a tile panel: its wall plate ends under the panel's top border)
  iron.box(SPUR.bufferX - 1.15, SPUR.bufferX - 0.48, SPUR.rail - 0.7, ry - 0.25, zS - 0.8, zS + 0.8);      // the stop plate, under the last arm
  // ---- iron gates in the hall's own green paint: four leaves a side, each an eighth of the mouth wide (the eight
  // would close it), folded back in a stack against each jamb, where three hinge bars on the jamb's face carry them.
  // A leaf's tone falls from the mouth's side outward (w over 1 also tells the iron's material to give the gates the
  // sky's fill), so that the bars are seen in shade as in sun
  const GW = (x1 - x0) / 8;
  iron.set({ kind: 2, w: 1.1 });
  for (const sg of [-1, 1]) for (const y of [1.5, 6.0, 10.5]) iron.box(Math.min(sg * (x1 + 0.11), sg * (x1 + 1.28)), Math.max(sg * (x1 + 0.11), sg * (x1 + 1.28)), y - 0.22, y + 0.22, zf, zf + 0.36);
  for (const sg of [-1, 1]) for (let j = 0; j < 4; j++) {
    iron.set({ kind: 2, w: [1.25, 1.12, 1.05, 1.05][j] });
    const x = sg * (x1 + 0.2 + j * 0.33), at = (t, y) => [x, y, zf + 0.5 + GW * t];
    rod(iron, at(0, 0.3), at(0, 12.0), 0.09, 0.14); rod(iron, at(1, 0.3), at(1, 12.0), 0.09, 0.14);
    for (const y of [0.7, 5.4, 11.2]) rod(iron, at(0, y), at(1, y), 0.06, 0.16);
    for (let i = 1; i <= 6; i++) rod(iron, at(i / 7, 0.7), at(i / 7, 11.9), 0.045, 0.045);
    for (let i = 0; i < 7; i++) rod(iron, at((i + 0.5) / 7, 0.7), at((i + 0.5) / 7, 2.5), 0.035, 0.035);
  }
}
