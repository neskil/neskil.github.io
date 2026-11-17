// hill-of-round-doors, the land builder's part: WHAT GROWS WHERE, by place alone. One function says of any place of
// the plan's ground how long its grass is and what else the place is; the ground's paint, the instanced blades and
// the things that stand on the land all ask it, so that paint and plants agree. The land is cut
// into small hedged fields (the far country's own lattice, land-glsl.js): each field is pasture grazed short, or hay
// standing long, or just mown; islands of long grass come from the seed's noise; the rest is
// the plan's: lawn on the party field and in the gardens, turf on the mounds, the way's earth, its crown and verges,
// the wet margin of the stream.
import { groundY, WATER } from './hill-of-round-doors-plan.js';
import { wayAt, homeAt, fieldAt, inHall, onBridge } from './hill-of-round-doors-land-lines.js';
import { FAR, farField, farKind } from './hill-of-round-doors-land-glsl.js';

const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// noise: the land's own seeded noise; farSeed: the visit's draw that deals the fields their kinds
export function makeKinds(noise, farSeed) {
  const w = { d: 0, s: 0, y: 0, up: 0 }, h = { mound: 0, garden: 0, front: 0 }, f = { gx: 0, gy: 0, e: 0, across: false };
  // the seed's drifts alone (what the ground's vertices carry): out.long the islands of long grass in a pasture
  // (more of them in the valley than on the hill)
  function fields(x, z, y, out) {
    const hill = ss(9, 24, y);
    const n1 = noise.fbm2(x * 0.0125 + 3.1, z * 0.0125 - 1.7, 3) * 0.5 + 0.5, n2 = noise.n2(x * 0.052 + 17, z * 0.052) * 0.5 + 0.5;
    out.long = ss(0.5, 0.68, n1 * 0.75 + n2 * 0.35 + (1 - hill) * 0.12 - hill * 0.08);
    return out;
  }
  // everything of a place: the drifts above, its field, and the plan's masks laid over them. y: the ground's height
  // there if the caller has it (else the plan's is asked).
  // out: long (how long the grass is, 0 short to 1 long), field (the field's own number), hay and mown (the field's
  // kind), edge (metres to the field's nearest hedge line), lawn, mound, garden, front, earth (how bare the way is),
  // crown, verge, wet, way (metres from the way's middle), up (the way's hill side +1, valley side -1), water (true
  // in the stream), y, grows (false where nothing of the land's may stand: water, the hall, the bridge)
  function at(x, z, out, y) {
    if (y === undefined) y = groundY(x, z);
    out.y = y; fields(x, z, y, out);
    wayAt(x, z, w); homeAt(x, z, h); farField(x, z, f);
    const wd = w.d, rag = (noise.n2(x * 0.9, z * 0.9) * 0.5) * 0.9, k = farKind(f.gx, f.gy, farSeed);
    out.field = k; out.edge = f.e; out.across = f.across; out.mown = k >= FAR.mown; out.hay = k >= FAR.hay && k < FAR.mown;
    out.way = wd; out.up = w.up; out.wayY = w.y; out.mound = h.mound; out.garden = h.garden; out.front = h.front;
    out.lawn = Math.max(1 - ss(0.92, 1.06, fieldAt(x, z)), h.garden);
    out.crown = 1 - ss(0.6, 1.25, wd + rag * 0.7);
    out.earth = Math.min(1, (1 - ss(2.5, 3.5, wd + rag)) * (1 - out.crown * 0.82) * 0.9);
    out.verge = ss(2.6, 3.4, wd) * (1 - ss(4.2, 5.8, wd)) * (1 - h.garden);
    out.wet = 1 - ss(WATER + 0.25, WATER + 1.7, y);
    out.water = y < WATER + 0.12;
    const stand = out.hay ? ss(1.2, 3.2, f.e) : 0;
    let L = Math.max(out.mown ? 0 : out.long * 0.75, stand) * (1 - out.lawn) * (1 - h.mound) * ss(3.2, 5.5, wd);
    L = Math.max(L, out.wet * (1 - out.lawn) * 0.8); L = Math.max(L * (1 - out.earth), out.verge * 0.75);
    out.long = L;
    out.grows = !out.water && !inHall(x, z) && !onBridge(x, z, 0.6);
    return out;
  }
  return { fields, at, farSeed };
}
