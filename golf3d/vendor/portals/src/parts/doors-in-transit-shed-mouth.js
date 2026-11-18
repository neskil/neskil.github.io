// doors-in-transit: THE MOUTH TO THE FAR STORE (a piece of the joiner's shed, made for the closer version). The -z end
// wall, behind the bay, stands open from the plan's FAR.x0 to FAR.x1 and from the floor to FAR.top. This piece builds
// what closes the cut, all of it closed forms through the wall's whole depth (nothing of it is a single sheet):
//   - THE JAMBS: the wall's own brick piers at FAR.x0 and FAR.x1, as they stood (stone foot, band, stone cap), now
//     carried back through the wall, so that the faces turned to the opening are whole from front to back;
//   - THE GIRDER'S SEATS: a padstone on a corbel, standing out of each jamb's inner face under the girder's end;
//   - THE GIRDER, in the hall's green iron, from FAR.top to FAR.top + FAR.girder (its top lies under the screen's stone
//     sill, which stays): two flanges, each a closed box as deep as the wall (the lower one's underside is the opening's
//     soffit), and between them two lattice webs, one near the hall and one near the store: verticals at every panel,
//     one diagonal a panel, the two webs' diagonals leaning opposite ways (seen together they cross); the end panels
//     are plate. Its ends run into the jambs.
//   - THE SILL in the floor: the paving's mesh carried on for the wall's depth between the jambs (the floor's own
//     material draws it as stone by its place, and lets the hall's light die on it).
// Nothing of the shed stands beyond the sill's far edge: the far store begins there (the works').
import { FAR } from './doors-in-transit-plan.js';
import { rod } from './doors-in-transit-shed-bay.js';

// depth: the wall's depth at the opening (the sill's width); front: how far the flanges and seats stand before the
// wall's face; flange: a flange's thickness; under: the girder's top lies this far under the springing (the screen's
// sill comes down to there); panels: the girder's panels
export const MOUTH = { depth: 2.5, front: 0.5, flange: 0.45, under: 0.2, panels: 26 };

// brick: the walls' mesh; iron: the hall's iron; floor: the paving; kit: the shed's wallKit; W(a, y, d): the end wall's
// frame (a along the wall, y up, d toward the hall); o: the wall's dress { pierW, pierD, band } and its top.
// Returns { triangles: how many this piece added }.
export function buildMouth(brick, iron, floor, kit, W, o, top) {
  const k = kit(brick, W), D = MOUTH.depth, F = MOUTH.front, before = brick.triangles() + iron.triangles() + floor.triangles();
  // a block like the kit's, with its back as well
  const solid = (a0, a1, yb, yt, d1, skip) => { k.block(a0, a1, yb, yt, -D, d1, skip); brick.quad(W(a1, yb, -D), W(a0, yb, -D), W(a0, yt, -D), W(a1, yt, -D)); };
  const hw = o.pierW / 2, y0 = FAR.top, y1 = FAR.top + FAR.girder - MOUTH.under;
  for (const pa of [FAR.x0, FAR.x1]) {
    const s = pa < 0 ? 1 : -1, face = pa + s * hw;                          // s: toward the opening; face: the jamb's inner face
    brick.set({ kind: 0, w: 1 }); solid(pa - hw, pa + hw, 2.4, top - 2.8, o.pierD, 'ud');
    brick.set({ kind: 1, w: 1 }); solid(pa - hw - 0.3, pa + hw + 0.3, 0, 2.4, o.pierD + 0.4, 'd');
    solid(pa - hw - 0.5, pa + hw + 0.5, top - 2.8, top, o.pierD + 0.9, '');
    solid(pa - hw - 0.2, pa + hw + 0.2, o.band, o.band + 1.4, o.pierD + 0.5, '');
    for (const [out, yb, yt] of [[1.5, y0 - 1.4, y0], [0.9, y0 - 2.4, y0 - 1.4]]) solid(Math.min(face - s * 0.2, face + s * out), Math.max(face - s * 0.2, face + s * out), yb, yt, F, '');
  }
  brick.set({ kind: 0, w: 1 });
  // the girder: its ends 0.2 m inside the jambs' brick
  const xa = FAR.x0 + hw - 0.2, xb = FAR.x1 - hw + 0.2, f = MOUTH.flange, n = MOUTH.panels, pl = (xb - xa) / n;
  const box = (ya, yb) => {
    iron.quad(W(xa, ya, F), W(xb, ya, F), W(xb, yb, F), W(xa, yb, F)); iron.quad(W(xb, ya, -D), W(xa, ya, -D), W(xa, yb, -D), W(xb, yb, -D));
    iron.quad(W(xa, yb, F), W(xb, yb, F), W(xb, yb, -D), W(xa, yb, -D)); iron.quad(W(xa, ya, -D), W(xb, ya, -D), W(xb, ya, F), W(xa, ya, F));
    iron.quad(W(xb, ya, F), W(xb, ya, -D), W(xb, yb, -D), W(xb, yb, F)); iron.quad(W(xa, ya, -D), W(xa, ya, F), W(xa, yb, F), W(xa, yb, -D));
  };
  iron.set({ kind: 0, w: 1 }); box(y0, y0 + f); box(y1 - f, y1);
  const ya = y0 + f, yb = y1 - f;
  for (const [d, lean] of [[F - 0.25, 0], [-D + 0.25, 1]]) {
    iron.set({ kind: 0, w: 1 });                                            // the end panels: plate
    for (const i of [0, n - 1]) iron.quad(W(xa + i * pl, ya, d), W(xa + (i + 1) * pl, ya, d), W(xa + (i + 1) * pl, yb, d), W(xa + i * pl, yb, d));
    iron.set({ kind: 2, w: 1 });
    for (let i = 1; i < n; i++) rod(iron, W(xa + i * pl, ya, d), W(xa + i * pl, yb, d), 0.2, 0.12);
    for (let i = 1; i < n - 1; i++) { const up = (i + lean) % 2 === 0; rod(iron, W(xa + i * pl, up ? ya : yb, d), W(xa + (i + 1) * pl, up ? yb : ya, d), 0.1, 0.17); }
  }
  iron.set({ kind: 0, w: 1 });
  // the sill: the floor carried on between the jambs for the wall's depth
  const a = W(FAR.x0, 0, 0), b = W(FAR.x1, 0, 0), c = W(FAR.x1, 0, -D), e = W(FAR.x0, 0, -D);
  floor.set({ kind: 0, w: 1 }).quad(a, b, c, e);
  return { triangles: brick.triangles() + iron.triangles() + floor.triangles() - before };
}
