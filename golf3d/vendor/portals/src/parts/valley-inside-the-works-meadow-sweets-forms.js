// valley-inside-the-works, the meadow: THE SWEETS' FORMS. Four shapes in triangles, each made once and drawn many
// times (see the sweets' own file): a candy cane, a great lollipop, a toadstool, a gumdrop.
// Every vertex carries, besides its place and its normal:
//   aS = (u, v, part, rise): two numbers the material paints by, the part's number (the list is in the material's
//        file), and how much of the thing's own rise the vertex takes. A form is made with a stick or a stem ONE unit
//        long; the material lifts each vertex by rise x (the thing's own length less one), so one form stands for
//        sticks of every length and its head is never stretched;
//   aO = an offset in METRES, added whatever the thing's size: what keeps its own measure (a lollipop's stick and its
//        disc's thickness, the depth a foot goes into the ground).
// A form's unit: the cane's own thickness; the lollipop's disc radius; the toadstool's cap radius; the gumdrop's base
// radius. Triangles: cane 190, lollipop 132, toadstool 128, gumdrop 40.

function maker() {
  const pos = [], nor = [], st = [], off = [], idx = [];
  const M = {
    // one vertex: its place, its normal (made unit here), its paint (u, v, part, rise), its offset in metres
    v(p, n, s, o = [0, 0, 0]) {
      const l = Math.hypot(n[0], n[1], n[2]) || 1;
      pos.push(p[0], p[1], p[2]); nor.push(n[0] / l, n[1] / l, n[2] / l); st.push(s[0], s[1], s[2], s[3]); off.push(o[0], o[1], o[2]);
      return pos.length / 3 - 1;
    },
    // a ring of n + 1 vertices (the first stands twice, so that a number can run 0 to 1 round it): f(turn) -> [p, n, s, o]
    ring(n, f) { const first = pos.length / 3; for (let k = 0; k <= n; k++) { const a = f((k % n) / n, k / n); M.v(a[0], a[1], a[2], a[3]); } return first; },
    // the triangles between two rings, and from a ring to one vertex (flip turns their faces the other way)
    band(r0, r1, n, flip) { for (let k = 0; k < n; k++) { const a = r0 + k, b = r1 + k; if (flip) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); } },
    fan(r0, c, n, flip) { for (let k = 0; k < n; k++) { if (flip) idx.push(r0 + k, r0 + k + 1, c); else idx.push(r0 + k, c, r0 + k + 1); } },
    build(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(st, 4)); g.setAttribute('aO', new THREE.Float32BufferAttribute(off, 3));
      g.setIndex(idx); g.userData.triangles = idx.length / 3;
      return g;
    },
  };
  return M;
}

// THE CANDY CANE: a round stick, one unit thick, that rises plumb and hooks over at the top like a crook: a half circle
// (its middle line CANE.bend in radius) and a short end that hangs down, closed by a blunt tip. It hooks toward +x.
// u is the length along its middle line (in thicknesses), v the turn round it: the material winds the stripe by them.
// CANE.reach: how far the crook's outside stands from the stick's own axis, in thicknesses.
export const CANE = { sides: 10, bend: 1.25, hook: 7, drop: 0.55, foot: 0.6, reach: 2 * 1.25 + 0.5, over: 1.25 + 0.5 };
export function caneForm(THREE) {
  const M = maker(), n = CANE.sides, Rb = CANE.bend, rings = [];
  // a ring round the middle line at c: n1 the way out of the bend there, t the line's own direction, lean how far the
  // ring's normals lean along it (the tip's ring)
  const ring = (c, n1, t, u, rise, lean = 0) => M.ring(n, (turn, v) => {
    const a = turn * 6.2832, ca = Math.cos(a), sa = Math.sin(a), d = [ca * n1[0], ca * n1[1], sa];
    return [[c[0] + 0.5 * d[0], c[1] + 0.5 * d[1], 0.5 * d[2]], [d[0] + lean * t[0], d[1] + lean * t[1], d[2]], [u, v, 1, rise]];
  });
  rings.push(ring([0, -CANE.foot, 0], [-1, 0, 0], [0, 1, 0], -CANE.foot, 0), ring([0, 1, 0], [-1, 0, 0], [0, 1, 0], 1, 1));
  for (let j = 1; j <= CANE.hook; j++) {
    const f = Math.PI * j / CANE.hook, cf = Math.cos(f), sf = Math.sin(f);
    rings.push(ring([Rb - Rb * cf, 1 + Rb * sf, 0], [-cf, sf, 0], [sf, cf, 0], 1 + Rb * f, 1));
  }
  const end = [2 * Rb, 1 - CANE.drop, 0], uEnd = 1 + Rb * Math.PI + CANE.drop;
  rings.push(ring(end, [1, 0, 0], [0, -1, 0], uEnd, 1));
  for (let i = 0; i + 1 < rings.length; i++) M.band(rings[i], rings[i + 1], n, true);
  const tip = ring(end, [1, 0, 0], [0, -1, 0], uEnd, 1, 0.8);
  M.fan(tip, M.v([end[0], end[1] - 0.3, 0], [0, -1, 0], [uEnd + 0.3, 0.5, 1, 1]), n, true);
  return M.build(THREE);
}

// THE GREAT LOLLIPOP: a flat round disc (radius one unit) that stands in the plane of its stick, on the stick's top.
// The disc's two faces are flat and drawn in a little at the edge, with a rounded rim between them; its thickness and
// the stick's are in metres (aO). The paint's (u, v) is the place in the disc's own plane, from its middle.
// LOLLY.centre: the height of the disc's middle over the stick's unit length, in disc radii.
export const LOLLY = { sides: 20, stick: 0.15, stickSides: 6, half: 0.2, edge: 0.13, centre: 0.96 };
export function lollipopForm(THREE) {
  const M = maker(), n = LOLLY.sides, m = LOLLY.stickSides, c = 1 + LOLLY.centre;
  // the stick: its foot half a metre in the ground, its top inside the disc
  const stick = (y, rise, dy) => M.ring(m, (turn) => {
    const a = turn * 6.2832, d = [Math.cos(a), 0, Math.sin(a)];
    return [[0, y, 0], d, [0, 0, 0, rise], [LOLLY.stick * d[0], dy, LOLLY.stick * d[2]]];
  });
  M.band(stick(0, 0, -0.5), stick(1, 1, 0.3), m);
  const rim = (side) => M.ring(n, (turn) => {
    const a = turn * 6.2832, x = Math.cos(a), y = Math.sin(a);
    return side ? [[x, c + y, 0], [0.55 * x, 0.55 * y, 0.83 * side], [x, y, 2, 1], [-LOLLY.edge * x, -LOLLY.edge * y, LOLLY.half * side]]
      : [[x, c + y, 0], [x, y, 0], [x, y, 2, 1]];
  });
  const mid = rim(0);
  for (const side of [1, -1]) {
    const e = rim(side), centre = M.v([0, c, 0], [0, 0, side], [0, 0, 2, 1], [0, 0, LOLLY.half * side]);
    M.fan(e, centre, n, side > 0); M.band(e, mid, n, side < 0);
  }
  return M.build(THREE);
}

// A DOME by its profile (rings of [radius, height] from the rim up, then the top): the toadstool's cap and the gumdrop.
// The paint's (u, v) is the place on the dome laid out flat about its top, the way round kept and the way out measured
// along the dome's own surface: in metres' worth of units from the top (metric), or 0 at the top to 1 at the rim.
function dome(M, n, prof, top, base, part, rise, sink, metric) {
  const arc = [0], at = (i) => (i < prof.length ? prof[i] : [0, top]);
  for (let i = 1; i <= prof.length; i++) arc.push(arc[i - 1] + Math.hypot(at(i)[0] - at(i - 1)[0], at(i)[1] - at(i - 1)[1]));
  const total = arc[prof.length];
  const rings = prof.map(([r, h], i) => {
    const a = i ? prof[i - 1] : [r, h - 0.3], b = at(i + 1), tx = b[0] - a[0], ty = b[1] - a[1];      // the profile's direction here, toward the top
    const q = metric ? total - arc[i] : 1 - arc[i] / total;
    return M.ring(n, (turn) => {
      const an = turn * 6.2832, x = Math.cos(an), z = Math.sin(an);
      return [[r * x, base + h, r * z], [ty * x, -tx, ty * z], [q * x, q * z, part, rise], [0, i ? 0 : -sink, 0]];
    });
  });
  for (let i = 0; i + 1 < rings.length; i++) M.band(rings[i], rings[i + 1], n);
  M.fan(rings[rings.length - 1], M.v([0, base + top, 0], [0, 1, 0], [0, 0, part, rise]), n);
}

// THE TOADSTOOL: a stout stem one unit high (a little bulbous at the foot, drawn in under the cap, its foot 0.4 m in
// the ground) and a domed cap of radius one unit on it, closed underneath. The stem's paint: (turn, height).
// The underside's: the place under the cap from its middle (the material rules the gills by it).
// TOAD.cap: the cap's height over the stem's top, in cap radii.
export const TOAD = { sides: 12, stemSides: 8, prof: [[1.0, 0.0], [0.93, 0.2], [0.7, 0.4], [0.36, 0.52]], cap: 0.56, stem: 0.3 };
export function toadstoolForm(THREE) {
  const M = maker(), n = TOAD.sides, m = TOAD.stemSides;
  const stem = [[TOAD.stem, 0, 0, -0.4], [0.25, 0.45, 0.45, 0], [0.2, 1.1, 1, 0]].map(([r, y, rise, sink]) => M.ring(m, (turn, v) => {
    const a = turn * 6.2832, d = [Math.cos(a), 0, Math.sin(a)];
    return [[r * d[0], y, r * d[2]], [d[0], 0.1, d[2]], [v, y, 4, rise], [0, sink, 0]];
  }));
  M.band(stem[0], stem[1], m); M.band(stem[1], stem[2], m);
  dome(M, n, TOAD.prof, TOAD.cap, 1, 3, 1, 0, false);
  const under = M.ring(n, (turn) => { const a = turn * 6.2832, x = Math.cos(a), z = Math.sin(a); return [[x, 1, z], [0.3 * x, -1, 0.3 * z], [x, z, 5, 1]]; });
  M.fan(under, M.v([0, 1.08, 0], [0, -1, 0], [0, 0, 5, 1]), n, true);
  return M.build(THREE);
}

// THE GUMDROP: a dome of base radius one unit, steep in the flank and round in the shoulder, its foot 0.2 m in the
// ground. Its paint is in units of its own radius: the material turns it into metres, so the sugar's grain is one size.
export const GUM = { sides: 8, prof: [[1.0, 0.0], [0.88, 0.55], [0.6, 0.92]], top: 1.02 };
export function gumdropForm(THREE) {
  const M = maker();
  dome(M, GUM.sides, GUM.prof, GUM.top, 0, 6, 0, 0.2, true);
  return M.build(THREE);
}
