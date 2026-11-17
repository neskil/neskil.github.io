// valley-inside-the-works: THE PIPES' FEET (the world builder's): how each of the rank's seven pipes stands in the
// pool at z = PIPES.riseZ. Each stands in A CAST-IRON SHOE ON A LOW ROUND STONE PAD, as the hall's columns stand in
// their bases on stone:
//   THE PAD: a round of dressed stone standing in the pool, its top 0.36 m over the liquid (the plan's liquidY), its
//   edge chamfered, its side plumb and going on 0.7 m under the liquid. The pipe draws the pool's liquid in under
//   it. The liquid's rings round the pads are the chocolate part's, which reads the pads' places and radii here:
//   PIPE_PADS.
//   THE SHOE, of the gantry's painted iron: a base ring bolted down on the pad by eight square-headed bolts; a short
//   boot standing in it, tapered, with a plinth band at its foot and a neck band at its top; and round the neck A
//   DRIP EDGE: a collar with a sloped top and a sharp rim, which throws clear whatever runs down the glass. The
//   glass begins inside the collar.
// All of it goes into the pipes' one iron mesh (the maker M of …-pipes-iron.js): no draw call of its own. The stone
// is told from the iron by its paint kind, -1, for which the iron's shader paints no chips and gives no gloss.
// Nothing here is cut, sized, shown or lit by the eye's place.
import * as P from './valley-inside-the-works-plan.js';
import { IRON } from './valley-inside-the-works-pipes-iron.js';

const SIDES = 16;                                    // faces round a foot
const STONE = [0.6, 0.55, 0.45];                     // dressed stone, linear: about the tone of the shed's stone piers
// the pad: its top over the liquid and its side's reach under it (metres), its radius, its chamfer; the base ring:
// its radius, its thickness, its bolts and their circle; the boot with its collar: its height from the ring's top to
// the collar's rim, where the glass begins
const PAD = { over: 0.36, under: 0.7, r: 0.69, chamfer: 0.04 };
const RING = { r: 0.62, thick: 0.1, bolts: 8, circle: 0.585 };
const BOOT = 0.85;
// where a pipe's glass begins, in metres over the liquid (for the pipes part)
export const SHOE = { glass: PAD.over + RING.thick + BOOT };
// THE PADS' PLACES AND RADII, one entry for each pipe of the rank, for whoever draws the liquid round them: x, z: the
// pad's plumb axis; r: its radius where the liquid meets it (its side is plumb there, from 0.7 m under the liquid up
// to the chamfer); top: the height of its top (PAD.over above the plan's liquidY there).
export const PIPE_PADS = Array.from({ length: P.PIPES.count }, (_, i) => ({
  x: P.pipeX(i), z: P.PIPES.riseZ, r: PAD.r, top: P.liquidY(P.PIPES.riseZ) + PAD.over,
}));

// A TURNED FORM about the plumb axis at (x, z): the profile pts ([radius, height] each) swept round it. Every piece
// of the profile is a band of its own, lit square to the piece, and its front is the side that lies on the right as
// the profile is walked with the axis on the left: outward for a piece going up, upward for a piece going in,
// downward for a piece going out. kind: what the iron's shader paints on it (0 plain iron, -1 stone).
function lathe(M, x, z, pts, colr, kind = 0) {
  for (let k = 0; k + 1 < pts.length; k++) {
    const [r0, y0] = pts[k], [r1, y1] = pts[k + 1], l = Math.hypot(r1 - r0, y1 - y0) || 1, nr = (y1 - y0) / l, ny = (r0 - r1) / l;
    const first = M.pos.length / 3;
    for (let j = 0; j <= SIDES; j++) {
      const f = (j / SIDES) * Math.PI * 2, sx = Math.sin(f), cz = Math.cos(f), n = [nr * sx, ny, nr * cz];
      M.v([x + r0 * sx, y0, z + r0 * cz], n, colr, 0, 0, kind);
      M.v([x + r1 * sx, y1, z + r1 * cz], n, colr, 0, 0, kind);
    }
    for (let j = 0; j < SIDES; j++) { const q = first + 2 * j; M.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
}

// ONE FOOT, on the pad `pad` (an entry of PIPE_PADS), from under the liquid up to where the glass comes out of it
function addFoot(M, pad) {
  const { x, z, top } = pad, t1 = top + RING.thick;
  // the stone pad: its side from under the liquid, its chamfer, its top (which runs in under the base ring)
  lathe(M, x, z, [[PAD.r, top - PAD.over - PAD.under], [PAD.r, top - PAD.chamfer], [PAD.r - PAD.chamfer, top], [RING.r - 0.03, top]], STONE, -1);
  // the base ring: its rim and its top (which runs in under the boot), and a square bolt head at each of its bolts
  lathe(M, x, z, [[RING.r, top], [RING.r, t1], [0.5, t1]], IRON.sage);
  for (let k = 0; k < RING.bolts; k++) {
    const f = (k + 0.5) / RING.bolts * Math.PI * 2, d = [Math.sin(f), 0, Math.cos(f)];
    M.box([x + RING.circle * d[0], t1 + 0.03, z + RING.circle * d[2]], [0, 1, 0], d, [d[2], 0, -d[0]], 0.03, 0.03, 0.04, IRON.sageDark, 'XYyZz');
  }
  // the boot: the plinth band at its foot, a chamfer, the body, TAPERED (7.5 cm in a side over its 0.6 m), and
  // (a step out) the neck band
  lathe(M, x, z, [[0.55, t1], [0.55, t1 + 0.07], [0.54, t1 + 0.1], [0.465, t1 + 0.7], [0.5, t1 + 0.7], [0.5, t1 + 0.8]], IRON.sage);
  // the drip edge round the neck: its underside, its sharp rim, and its sloped top, up to the glass
  lathe(M, x, z, [[0.5, t1 + 0.8], [0.6, t1 + 0.8], [0.6, t1 + BOOT], [P.PIPES.across / 2 + 0.02, t1 + BOOT + 0.12]], IRON.sageDark);
}
// ALL SEVEN FEET, into the pipes' one iron mesh M
export function addFeet(M) { for (const pad of PIPE_PADS) addFoot(M, pad); }
