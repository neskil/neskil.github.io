// THE GOLDEN CITY AND ITS BRIDGE: the city on its island (round two). The flight comes to it along the bridge and ends in it, so
// it is built to be seen from 1,800 m, from the middle distance and from 20 to 60 m:
//  THE ISLAND: four terraces; each cliff a made retaining wall of dark stone (ribs, courses, an arcade lit from within under its
//   brow, all by shader and filtered) with tall buttresses of golden stone, gold capped, at every bay; the tops paved.
//  THE PALACE on the top terrace: the plan's rank of thirteen fluted golden tubes with seams of warm light, collars and slanted
//   lids; a taller-between rank behind them, two lower ranks before them, a great lit portal at its foot, the hall behind.
//  THE BUILDINGS (instanced, four forms): stepped towers with setbacks, round drums under domes, slim capped towers, long halls
//   with colonnades along the terraces' edges. THE SPIRES: tapered shafts with two collars and a bright finial.
//  THE CITY'S GATE: two fluted towers (middles x -24 and 24, skins never nearer x 0 than 16 m, tops 110 m), a gable (top y 52)
//   over a deep arch lit from within. THE WAY UP: a paved way with low lamps from the gate's back to the foot of the ring's
//   pedestal, and two broad flights of steps either side of it (x 24 to 40) up to the second terrace.
//  THE RING'S PLATFORM: a round golden deck (middle (0, 88), radius 12, top y 77) with a low rim on a fluted pedestal standing on
//   the first terrace, joined to the second terrace's brow by a short span.
//  ROUND THREE (the update): THE FALLS: four (six on a dense deal), each a real fall: a curved sheet of white streaked water,
//   16 to 24 m wide, leaving the gold lip of a bastion and dropping plumb to the sea, mist standing at its foot, foam on the
//   water before it, its image under it; at typed bearings either side of the gate (0.55 and 1.05 rad, dense also 1.6), so the
//   north-east one is passed close on the wall run. THE WATER BY THE RING: two falls 14 m wide, now PLUMB, each from the lip of
//   a bastion 17 m square standing out from the second terrace's wall (middles about 51 m from the line, nothing nearer it than
//   40.7 m), into basins, and two rills beside the paved way. THE WALL'S FOOT stands in the water: whatever of the city stands
//   in the sea is dark and wet over its lowest 3 to 4.6 m (by the material), and there is no band at the waterline.
//   THE TWO OUTWORKS in the still sea east of the bridge, each with its image. TYPED PLACES: OUTWORK ONE, middle (207, -524);
//   OUTWORK TWO, middle (210, -275). Each a round bastion 44 m across at the water and 25 m high (pier caps to 29.9 m), lit
//   arcades, six buttresses, a gold cornice, a parapet; on it one slim spire with a lit crown (88 m and 76 m from the deck).
//   Nothing of an outwork lies farther than 23.3 m in plan from its middle. THE MOUNTAINS: the range behind the city, moonlit,
//   and a second, farther, lower range that carries the horizon round to the east and the west (see buildRange).
// THE CLEAR WAY: within 22 m either side of x 0, from z -10 to z 88, nothing of this part stands above y 58 but the gable (top 52)
// and the platform's own deck and pedestal; every scatter keeps out of |x| < 64 north of z 112 and out of |x| < 14 everywhere.
// Everything stands on the plan's places; the scatters are dealt from named streams, every die before any test. Each solid thing
// is drawn a second time, turned over, as its image in the sea.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as PLAN from './asgard-bridge-of-light-plan.js';
import { twin } from './asgard-bridge-of-light-mat.js';
import { cityMat, veilMat, rangeMat } from './asgard-bridge-of-light-citymat.js';

const { CITY, TERR, PALACE, GATE } = PLAN, PLAT = PLAN.PLAT || { x: 0, z: 88, r: 12, deck: 77 };
const K = { wall: 0, gold: 1, flute: 2, cliff: 3, pave: 4, light: 5, stone: 6, hall: 7, tower: 8 };
// the island's outline is not a true circle: its radius swells and pinches a little with the bearing (the same rule for the rock and for what hugs it)
const swell = (a) => 1 + 0.022 * Math.sin(a * 5 + 0.7) + 0.014 * Math.sin(a * 11 + 2.1) + 0.008 * Math.sin(a * 23);
const at = (a, r, y) => new THREE.Vector3(CITY.x + r * swell(a) * Math.sin(a), y, CITY.z + r * swell(a) * Math.cos(a));      // bearing a: 0 south, pi north (toward the bridge)
const TAU = Math.PI * 2;

// dress(g, kind, o): tells every face of a geometry which stuff it is and where it is on its wall (see the material's head).
// o.round: the wall goes round the upright axis (its breadth is its girth); o.cells: a whole count of cells round it; o.cell:
// the breadth of a cell in metres; o.y0, o.H: the wall's foot and height if not the geometry's own
function dress(g, kind, o = {}) {
  const p = g.attributes.position, nr = g.attributes.normal, uv = g.attributes.uv, n = p.count, A = new Float32Array(n * 4), F = new Float32Array(n * 4);
  g.computeBoundingBox(); const b = g.boundingBox, y0 = o.y0 ?? b.min.y, H = o.H ?? Math.max(b.max.y - b.min.y, 0.01), cell = o.cell || 4;
  const wx = Math.max(b.max.x - b.min.x, 1e-3), wz = Math.max(b.max.z - b.min.z, 1e-3);
  for (let i = 0; i < n; i++) { let al, fx = 0, fz = 0;
    if (o.round) { al = uv.getX(i); fx = o.cells ? o.cells * cell : Math.PI * wx; }
    else if (Math.abs(nr.getX(i)) > Math.abs(nr.getZ(i))) { al = (p.getZ(i) - b.min.z) / wz; fz = wz; }
    else { al = (p.getX(i) - b.min.x) / wx; fx = wx; }
    A.set([al, kind, p.getY(i) - y0, H], i * 4); F.set([fx, 0, fz, cell], i * 4); }
  g.setAttribute('aA', new THREE.BufferAttribute(A, 4)); g.setAttribute('aF', new THREE.BufferAttribute(F, 4)); return g;
}
// join(list): many dressed geometries as one (plain triangles; only what the material reads is kept)
function join(list) {
  return mergeGeometries(list.map((g) => { const q = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(q.attributes)) if (!['position', 'normal', 'aA', 'aF'].includes(name)) q.deleteAttribute(name);
    return q; }));
}
const cyl = (rTop, rBot, y0, y1, seg, kind, o = {}) => dress(new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg, 1, !!o.open).translate(0, (y0 + y1) / 2, 0), kind, { round: true, ...o });
const box = (w, h, d, kind, o = {}) => dress(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), kind, o);
// a band round the island between two outlines (radius, height), `n` steps round, its pattern in `cells` cells of `cell` metres
function band(n, r0, y0, r1, y1, kind, cells, cell) {
  const P = [], N = [], A = [], F = [], ix = [], H = Math.max(y1 - y0, 0.01);
  for (let i = 0; i <= n; i++) { const a = i / n * TAU, p0 = at(a, r0, y0), p1 = at(a, r1, y1);
    const e1 = p1.clone().sub(p0), e2 = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), nn = e2.cross(e1).normalize();
    P.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); N.push(nn.x, nn.y, nn.z, nn.x, nn.y, nn.z);
    A.push(i / n, kind, 0, H, i / n, kind, y1 - y0, H); F.push(cells * cell, 0, 0, cell, cells * cell, 0, 0, cell);
    if (i < n) { const k = i * 2; ix.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setIndex(ix); return g;
}
// a round fluted tube with its top cut aslant (slope: metres of rise per metre toward +x; turned afterwards), closed by a
// polished lid, with a plinth and collars of polished gold (at shares of its height)
function tube(r, h, slope, turn, flutes, collars, seg = 28) {
  const side = cyl(r, r * 1.03, 0, h, seg, K.flute, { open: true, cells: flutes, cell: TAU * r / flutes });
  const lid = dress(new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2).translate(0, h, 0), K.gold, { y0: 0, H: h });
  for (const g of [side, lid]) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > h - 0.01) p.setY(i, h + slope * p.getX(i)); }
  const parts = [side, lid, cyl(r * 1.1, r * 1.16, 0, Math.min(7, h * 0.06), seg, K.gold)];
  for (const c of collars) parts.push(cyl(r * 1.07, r * 1.07, h * c - 1.6, h * c + 1.6, seg, K.gold, { y0: 0, H: h }));
  const g = join(parts); g.rotateY(turn); return g;
}
// a round shaft with real flutes: every other upright edge is set in by `inset` metres (the shader's flutes lie on them)
function fluted(rTop, rBot, y0, y1, flutes, inset, kind) {
  const seg = flutes * 2, g = new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg, 1, true).translate(0, (y0 + y1) / 2, 0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if ((i % (seg + 1)) & 1) { const x = p.getX(i), z = p.getZ(i), r = Math.max(Math.hypot(x, z), 0.01), k = (r - inset) / r; p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); const nr = g.attributes.normal;
  for (let row = 0; row < 2; row++) { const a = row * (seg + 1), b = a + seg, v = new THREE.Vector3(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize(); nr.setXYZ(a, v.x, v.y, v.z); nr.setXYZ(b, v.x, v.y, v.z); }
  return dress(g, kind, { round: true, cells: flutes, cell: Math.PI * (rTop + rBot) / flutes });
}
// a six-faced block from its eight corners (four of the foot, in order round it, then the four above them); faces wound outward
function hexa(p, kind, o = {}) {
  const c = new THREE.Vector3(); for (const v of p) c.addScaledVector(v, 1 / 8);
  const y0 = o.y0 ?? p[0].y, H = o.H ?? Math.max(p[4].y - p[0].y, 0.01), cell = o.cell || 4, P = [], N = [], A = [], F = [];
  const quad = (a, b, cc, d) => {
    const n = b.clone().sub(a).cross(d.clone().sub(a)).normalize(), flip = n.dot(a.clone().sub(c)) < 0; if (flip) n.negate();
    const W = Math.max(a.distanceTo(b), 0.01), vs = flip ? [[a, 0], [d, 0], [b, 1], [b, 1], [d, 0], [cc, 1]] : [[a, 0], [b, 1], [d, 0], [b, 1], [cc, 1], [d, 0]];
    for (const [v, u] of vs) { P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); A.push(u, kind, v.y - y0, H); F.push(W, 0, 0, cell); } };
  for (let i = 0; i < 4; i++) quad(p[i], p[(i + 1) % 4], p[4 + (i + 1) % 4], p[4 + i]);
  quad(p[4], p[5], p[6], p[7]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); return g;
}
// a block between two level rectangles given in a frame (middle c, unit along u, unit across v): half sizes (a0, b0) at y0, (a1, b1) at y1, the upper one moved s along v
function block(c, u, v, a0, b0, y0, a1, b1, y1, s, kind, o) {
  const pt = (a, b, y, sh) => new THREE.Vector3(c.x + u.x * a + v.x * (b + sh), y, c.z + u.z * a + v.z * (b + sh));
  return hexa([pt(-a0, -b0, y0, 0), pt(a0, -b0, y0, 0), pt(a0, b0, y0, 0), pt(-a0, b0, y0, 0), pt(-a1, -b1, y1, s), pt(a1, -b1, y1, s), pt(a1, b1, y1, s), pt(-a1, b1, y1, s)], kind, o);
}
// an oval outline (half its length A, half its breadth B) as n + 1 places at equal steps of its girth, beginning `o` of the girth
// round from its long end: each [along, across, the outward normal's along, across]; and the girth itself
function oval(A, B, n, o) {
  const M = 720, L = new Float64Array(M + 1), out = []; let px = A, pz = 0;
  for (let i = 1; i <= M; i++) { const th = i / M * TAU, x = A * Math.cos(th), z = B * Math.sin(th); L[i] = L[i - 1] + Math.hypot(x - px, z - pz); px = x; pz = z; }
  for (let i = 0; i <= n; i++) { const s = ((i / n + o) % 1) * L[M]; let lo = 0, hi = M;
    for (let b = 0; b < 12; b++) { const mid = (lo + hi) >> 1; if (L[mid] <= s) lo = mid; else hi = mid; }      // a bounded search of the table
    const th = (lo + (s - L[lo]) / Math.max(L[lo + 1] - L[lo], 1e-9)) / M * TAU, nx = Math.cos(th) / A, nz = Math.sin(th) / B, nl = Math.hypot(nx, nz);
    out.push([A * Math.cos(th), B * Math.sin(th), nx / nl, nz / nl]); }
  return { out, girth: L[M] };
}
// a wall or a level ring between two ovals about one middle c (u along their length; across them v = (u.z, 0, -u.x)): from the
// oval (A0, B0) at y0 to (A1, B1) at y1, n steps round, its pattern in `cells` whole cells. A wall faces outward if it rises
// (inward if it is given from its top down); a level ring faces up if the outer oval is given first, down if the inner
function hoop(c, u, A0, B0, y0, A1, B1, y1, n, o, kind, cells) {
  const lo = oval(A0, B0, n, o), hi = oval(A1, B1, n, o), H = Math.max(Math.abs(y1 - y0), 0.01), W = (lo.girth + hi.girth) / 2, vx = u.z, vz = -u.x, P = [], N = [], A = [], F = [], ix = [];
  for (let i = 0; i <= n; i++) { const [a0, b0, nx, nz] = lo.out[i], [a1, b1] = hi.out[i];
    const p0 = new THREE.Vector3(c.x + u.x * a0 + vx * b0, y0, c.z + u.z * a0 + vz * b0), p1 = new THREE.Vector3(c.x + u.x * a1 + vx * b1, y1, c.z + u.z * a1 + vz * b1);
    const nn = new THREE.Vector3(vx * nx - u.x * nz, 0, vz * nx - u.z * nz).cross(p1.clone().sub(p0)).normalize();
    P.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); N.push(nn.x, nn.y, nn.z, nn.x, nn.y, nn.z);
    A.push(i / n, kind, Math.max(y0 - y1, 0), H, i / n, kind, Math.max(y1 - y0, 0), H); F.push(W, 0, 0, W / cells, W, 0, 0, W / cells);
    if (i < n) { const k = i * 2; ix.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setIndex(ix); return g;
}

// THE MOUNTAINS BEHIND THE CITY (a backdrop; the flight never reaches them): an arc of steep peaks standing in the sea south of
// the city, from east-south-east round the south to west-south-west of its middle (bearings up to 1.3 rad either side of due
// south, sinking into the sea over the last 0.16). Their feet lie 900 m and more from the city's middle; the crest runs 1,310 to
// 1,690 m from it; peaks up to 800 m high toward both sides, deep cols between them. TYPED so that the palace keeps the sky: straight behind it, within
// about 21 degrees either side of due south as seen from the middle of the bridge (0, -650), the range is a LOW SADDLE, 200 m
// at most; it rises to its full height by 32 degrees. A ridged heightfield from the seed's own stream `range` (a shuffled
// table); 181 by 49 places, 17,280 triangles, as many again for its image. ONE group: the peaks (both ranges) and, under it, their
// images. By night they are dark; the great pale moon stands beyond them and lights their snow and crests (see the material)
async function buildRange(ctx, shared, rng) {
  const T = new Uint8Array(512); for (let i = 0; i < 256; i++) T[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), t = T[i]; T[i] = T[j]; T[j] = t; }
  for (let i = 0; i < 256; i++) T[256 + i] = T[i];
  const lat = (x, y) => T[T[x & 255] + (y & 255)] / 255, sm = (v) => { const c = Math.min(1, Math.max(0, v)); return c * c * (3 - 2 * c); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), sx = sm(x - xi), sy = sm(y - yi), a = lat(xi, yi), b = lat(xi + 1, yi), c = lat(xi, yi + 1), d = lat(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
  const ridge = (x, y) => { let s = 0, amp = 0.5, f = 1; for (let o = 0; o < 4; o++) { const n = 1 - Math.abs(2 * vn(x * f + o * 17.3, y * f + o * 9.1) - 1); s += amp * n * n; amp *= 0.5; f *= 2.1; } return s / 0.9375; };
  const range = new THREE.Group(), under = new THREE.Group(); range.name = 'range'; under.name = 'range-image'; under.scale.y = -1; range.add(under);
  // raise(S): one ridged sheet with its image. S: its steps round and outward, the arc's half breadth, the radii of its feet, the
  // crest's radius and wander, the peaks' height and play, the grain's breadth, where it reads the table, where its snow
  // begins, the row that lies on the crest (0: even rows)
  const raise = async (S) => { const { NA, NR, A1, R0, R1 } = S, P = new Float32Array((NA + 1) * (NR + 1) * 3), ix = [];
    for (let i = 0; i <= NA; i++) { const a = -A1 + 2 * A1 * i / NA, rc = S.rc + S.rv * (2 * vn(a * 1.7 + 3.1 + S.off, 0.5) - 1), ends = sm((A1 - Math.abs(a)) / 0.16);
      const Hc = (S.h0 + S.h1 * vn(a * 4.2 + 11 + S.off, 7.7)) * (0.5 + 0.5 * (1 - Math.abs(2 * vn(a * 12 + 5 + S.off, 2.3) - 1)));      // sharp peaks along the crest, deep cols between them
      for (let j = 0; j <= NR; j++) { const r = !S.cr ? R0 + (R1 - R0) * j / NR : j <= S.cr ? R0 + (rc - R0) * j / S.cr : rc + (R1 - rc) * (j - S.cr) / (NR - S.cr);
        const x = CITY.x + r * Math.sin(a), z = CITY.z + r * Math.cos(a), u = r < rc ? (r - R0) / (rc - R0) : 1 - (r - rc) / (R1 - rc);
        const sad = 0.25 + 0.75 * sm((Math.abs(Math.atan2(x, z + 650)) - 0.32) / 0.24), k = (i * (NR + 1) + j) * 3;
        P[k] = x; P[k + 1] = Hc * Math.pow(Math.max(u, 0), 1.6) * (0.45 + 0.55 * ridge(x / S.grain + S.off, z / S.grain)) * ends * sad - 6; P[k + 2] = z;
        if (i < NA && j < NR) { const v = i * (NR + 1) + j, w = v + NR + 1; ix.push(v, v + 1, w, v + 1, w + 1, w); } }
      if (!(i % 12)) await ctx.yield(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(ix); g.computeVertexNormals();
    await ctx.yield();
    const mesh = new THREE.Mesh(g, rangeMat(shared, false, S.snow)); mesh.frustumCulled = false; under.add(twin(mesh, rangeMat(shared, true, S.snow))); range.add(mesh); };
  await raise({ NA: 180, NR: 48, A1: 1.3, R0: 900, R1: 2350, rc: 1500, rv: 190, h0: 560, h1: 240, grain: 380, off: 0, snow: 240, cr: 0 });
  // ROUND THREE: A SECOND, FARTHER, LOWER RANGE behind and beside the first, so that the horizon east and west of the city is
  // not empty: an arc 1.95 rad either side of due south of the city's middle (to a little north of due east and due west; its
  // ends sink into the sea, 700 m and more inside the sea's rim), its feet 2,450 to 3,700 m from the middle, its crest about
  // 3,050 m out, peaks 150 to 490 m, snow from 150 m up; the same low saddle behind the palace. 121 by 9 places, 1,920 triangles
  await raise({ NA: 120, NR: 8, A1: 1.95, R0: 2450, R1: 3700, rc: 3050, rv: 220, h0: 300, h1: 190, grain: 520, off: 40, snow: 150, cr: 5 });
  return range;
}

export async function buildCity(ctx, shared, opts = {}) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('asgard-bridge-of-light:' + name + ':' + ctx.seed)), dens = opts.density || 1;
  const group = new THREE.Group(), images = new THREE.Group(); group.name = 'city'; images.name = 'city-image'; images.scale.y = -1;
  const mat = cityMat(shared, CITY);
  const show = (mesh) => { mesh.frustumCulled = false; group.add(mesh); images.add(twin(mesh)); return mesh; };
  const solidOf = (list) => show(new THREE.Mesh(join(list), mat));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), S = new THREE.Vector3();
  const X1 = new THREE.Vector3(1, 0, 0), Z1 = new THREE.Vector3(0, 0, 1);
  const way = (x, z, pad) => (Math.abs(x) < 64 + pad && z < 112 + pad) || Math.abs(x) < 14 + pad;      // the clear way and the ring's place, with room, and the axis from the ring to the palace's portal: no scatter stands here

  // ---- THE ISLAND: each cliff a retaining wall in bays of about 24 m, each top paved; a buttress of golden stone at every bay
  const NB = [96, 80, 62, 46], foot = [[382, -2], [TERR[0].r1, TERR[0].y + 1.5], [TERR[1].r1, TERR[1].y + 1.5], [TERR[2].r1, TERR[2].y + 1.5]], isl = [], piers = [];
  for (let t = 0; t < 4; t++) { const T = TERR[t], [rf, yf] = foot[t];
    isl.push(band(192, rf, yf, T.r0, T.y, K.cliff, NB[t], TAU * T.r0 / NB[t]), band(192, T.r0, T.y, Math.max(T.r1, 0.5), T.y + 1.5, K.pave, 1, 5));
    for (let i = 0; i < NB[t]; i++) { const a = i / NB[t] * TAU, c0 = at(a, rf, yf), c1 = at(a, T.r0, T.y), u = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), v = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      if (Math.abs(c0.x) < (t === 1 ? 64 : 46) && c0.z < 112) continue;      // none at the gate, by the way up, behind the two veils by the flights or under the ring's span
      const s = c1.clone().sub(c0).dot(v);
      piers.push(block(c0, u, v, 3.4, 3.6, yf - 1, 2.2, 2.6, T.y + 3.2, s, K.stone), block(c1, u, v, 2.7, 3.1, T.y + 3.2, 0.5, 0.6, T.y + 6.4, 0, K.gold)); }
    await ctx.yield(); }
  solidOf(isl); await ctx.yield();
  solidOf(piers); await ctx.yield();

  // ---- THE PALACE on the top terrace. Rank A: the plan's thirteen tubes. Rank B behind and between them, each 6 m short of
  // its taller neighbour, so that it shows in the notch over the lower one. Ranks C and D before them, lower and slimmer (D leaves the middle free for the portal). Every top is
  // cut aslant, falling outward (the middle one toward the front)
  const P = PALACE, lean = (x) => (x > 0 ? Math.PI : 0);
  let tubes = [];
  for (let i = -P.n; i <= P.n; i++) { const k = Math.abs(i), h = P.tall - P.drop * k;
    if (!(i & 1)) await ctx.yield();
    tubes.push(tube(P.r - 0.35 * k, h, 0.8, i ? lean(i) : -Math.PI / 2, 20, [0.4, 0.78]).translate(P.x + i * P.step, P.y, P.z + k * P.back));
    if (i) tubes.push(tube(6.5, h * 0.3, 0.8, lean(i), 12, [0.7], 18).translate(P.x + i * P.step, P.y, P.z - 36 + k * P.back)); }
  await ctx.yield(); solidOf(tubes); tubes = []; await ctx.yield();
  for (let j = -P.n; j < P.n; j++) { const x = j + 0.5, k = Math.abs(x), h = P.tall - P.drop * k;
    if (!(j & 1)) await ctx.yield();
    tubes.push(tube(9.5, h + P.drop / 2 - 6, 0.6, lean(x), 16, [0.9], 20).translate(P.x + x * P.step, P.y, P.z + 17 + k * P.back));
    tubes.push(tube(9, h * 0.56, 0.8, lean(x), 16, [0.5, 0.86], 24).translate(P.x + x * P.step, P.y, P.z - 19 + k * P.back)); }
  solidOf(tubes); await ctx.yield();
  // the great portal at its foot (36 m wide, 105 m tall, 31 m before the middle tube): two fluted pylons, a stepped lintel, five bars of light within; the hall behind the ranks.
  // No scatter stands within 14 m of the line x 0 anywhere on the island (see `way`), so the portal shows over the ring from the bridge
  const pz = P.z - 31, hall = [box(280, 64, 90, K.wall, { cell: 6 }).translate(P.x, P.y, P.z + 89), box(200, 26, 60, K.wall, { cell: 6 }).translate(P.x, P.y + 64, P.z + 92)];
  for (const s of [-1, 1]) hall.push(box(6, 96, 8, K.flute, { cell: 1.5 }).translate(P.x + s * 15, P.y, pz));
  hall.push(box(38, 5, 9, K.gold).translate(P.x, P.y + 96, pz), box(26, 4, 8, K.gold).translate(P.x, P.y + 101, pz), box(24, 96, 1, K.light, { cell: 5 }).translate(P.x, P.y, pz + 2.5));
  solidOf(hall); await ctx.yield();

  // ---- THE BUILDINGS on the three lower terraces: four forms, each one instanced mesh (a unit form, 1 m square and 1 m tall,
  // scaled to its house). Stepped towers with two setbacks and a gold cap; round drums under gold domes; slim capped towers;
  // long halls with colonnades along the terraces' outer edges. Dealt: more candidates than are kept; one that would stand in
  // the clear way, or whose footprint meets one already kept, is left out; at most `most` are kept (400 to 600 by the density)
  const cone = (r, h, seg, y, kind) => dress(new THREE.ConeGeometry(r, h, seg, 1, true).translate(0, y + h / 2, 0), kind, { round: true });
  const forms = [
    join([box(1, 0.52, 1, K.wall), box(0.74, 0.3, 0.74, K.wall).translate(0, 0.52, 0), box(0.5, 0.14, 0.5, K.wall).translate(0, 0.82, 0), cone(0.36, 0.1, 4, 0.96, K.gold).rotateY(Math.PI / 4)]),
    join([cyl(0.5, 0.5, 0, 0.6, 12, K.wall, { open: true }), cyl(0.54, 0.54, 0.6, 0.64, 12, K.gold),
      dress(new THREE.SphereGeometry(0.48, 12, 4, 0, TAU, 0, Math.PI / 2).scale(1, 0.7, 1).translate(0, 0.64, 0), K.gold, { round: true }), cone(0.035, 0.1, 6, 0.97, K.gold)]),
    join([cyl(0.42, 0.5, 0, 0.74, 10, K.wall, { open: true }), cyl(0.6, 0.6, 0.74, 0.77, 10, K.gold), cyl(0.36, 0.4, 0.77, 0.875, 10, K.wall, { open: true }), cone(0.5, 0.125, 10, 0.875, K.gold)]),
    join([box(1, 0.66, 1, K.hall, { cell: 3.6 }), block(new THREE.Vector3(0, 0, 0), X1, Z1, 0.53, 0.56, 0.66, 0.53, 0.01, 1, 0, K.gold)]),
  ];
  await ctx.yield();
  // FOOTPRINTS (a rule of the whole city): a kept house is a level rectangle (its middle, the unit along its length, its half
  // sizes) or a round; a candidate whose footprint meets one already kept, with 1.2 m to spare, is dropped (a round is tried as
  // the square about it against a rectangle). Houses first, then the spires among them; every die is drawn before any test
  const kept = [], GAP = 1.2;
  const meets = (c) => { for (const q of kept) { const dx = q.x - c.x, dz = q.z - c.z, m = q.R + c.R + GAP; if (dx * dx + dz * dz >= m * m) continue;
      if (q.round && c.round) return true;
      let apart = false;
      for (const [ux, uz] of [[c.ux, c.uz], [-c.uz, c.ux], [q.ux, q.uz], [-q.uz, q.ux]]) {
        const pc = c.hw * Math.abs(c.ux * ux + c.uz * uz) + c.hd * Math.abs(c.ux * uz - c.uz * ux), pq = q.hw * Math.abs(q.ux * ux + q.uz * uz) + q.hd * Math.abs(q.ux * uz - q.uz * ux);
        if (Math.abs(dx * ux + dz * uz) > pc + pq + GAP) { apart = true; break; } }
      if (!apart) return true; }
    return false; };
  const br = stream('buildings'), most = Math.max(400, Math.min(600, Math.round(500 * dens))), cand = Math.round(5200 * dens), per = [[], [], [], []]; let nHouse = 0;
  for (let i = 0; i < cand && nHouse < most; i++) {
    if (!(i & 127)) await ctx.yield();
    const t = Math.min(2, Math.floor(br() * 3)), a = br.range(0, TAU), f = br(), die = br(), u1 = br(), u2 = br(), u3 = br(), T = TERR[t];
    const form = die < 0.34 ? 0 : die < 0.50 ? 1 : die < 0.88 ? 2 : 3, round = form === 1 || form === 2;
    const w = form === 0 ? 11 + 9 * u1 : form === 1 ? 13 + 10 * u1 : form === 2 ? 6 + 3.5 * u1 : 30 + 24 * u1;
    const d = form === 0 ? w * (0.8 + 0.25 * u2) : form === 3 ? 10 + 4 * u2 : w;
    const h = (form === 0 ? 30 + 46 * u3 * u3 : form === 1 ? w * (0.8 + 0.6 * u3) : form === 2 ? 44 + 44 * u3 : 12 + 6 * u3) + (form === 3 ? 0 : t * 5);
    // a hall lies along the brow, wholly inside it at both its ends; the others stand between the inner cliff's foot and the brow
    const edge = (b) => T.r0 * swell(b) - d / 2 - 4, da = Math.atan2(w / 2, T.r0), lo = T.r1 + d / 2 + 6, hi = T.r0 - d / 2 - 4.5;
    const rc = form === 3 ? Math.min(edge(a), Math.sqrt(Math.max(edge(a - da) ** 2 - w * w / 4, 1)), Math.sqrt(Math.max(edge(a + da) ** 2 - w * w / 4, 1))) : (lo + (hi - lo) * f) * swell(a);
    const p = new THREE.Vector3(CITY.x + rc * Math.sin(a), T.y + 0.6, CITY.z + rc * Math.cos(a));
    const c = { x: p.x, z: p.z, ux: Math.cos(a), uz: -Math.sin(a), hw: w / 2, hd: d / 2, R: round ? w / 2 : Math.hypot(w, d) / 2, round };
    if (way(p.x, p.z, Math.max(w, d) / 2) || meets(c)) continue;
    kept.push(c); nHouse++; per[form].push([p, a, w, h, d]);
  }
  await ctx.yield();
  for (let k = 0; k < 4; k++) { const mesh = new THREE.InstancedMesh(forms[k], mat, Math.max(per[k].length, 1)); let n = 0; await ctx.yield();
    for (const [p, a, w, h, d] of per[k]) { M.compose(p, Q.setFromAxisAngle(Y, a), S.set(w, h, d)); mesh.setMatrixAt(n++, M); }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; show(mesh); }
  await ctx.yield();

  // ---- THE SPIRES: a tapered shaft on a foot, two collars, a needle, a bright finial; on the three lower terraces, and four typed
  // ones flanking the palace on the top terrace (160 m and 128 m either side of its middle); none as tall as the palace
  const spireForm = join([cyl(0.42, 0.5, 0, 0.035, 6, K.gold), cyl(0.12, 0.34, 0.035, 0.8, 6, K.gold, { open: true, y0: 0, H: 1 }), cyl(0.27, 0.27, 0.5, 0.512, 6, K.gold), cyl(0.2, 0.2, 0.78, 0.79, 6, K.gold),
    cyl(0.02, 0.1, 0.8, 0.965, 6, K.gold, { open: true, y0: 0, H: 1 }), dress(new THREE.SphereGeometry(0.075, 6, 3).scale(1, 0.4, 1).translate(0, 0.975, 0), K.light, { round: true, y0: 0, H: 50 })]);
  const sr = stream('spires'), mostS = Math.round(160 * dens), candS = Math.round(480 * dens), spire = new THREE.InstancedMesh(spireForm, mat, mostS + 4); let si = 0;
  for (let i = 0; i < candS && si < mostS; i++) { const t = Math.min(2, Math.floor(sr() * 3)), a = sr.range(0, TAU), f = sr.range(0.12, 0.9), r = sr.range(4.5, 8), h = sr.range(60, 132) + t * 14, T = TERR[t];
    const p = at(a, T.r1 + (T.r0 - T.r1) * f, T.y + 0.6), c = { x: p.x, z: p.z, ux: 1, uz: 0, hw: r / 2, hd: r / 2, R: r / 2, round: true };
    if (way(p.x, p.z, r) || meets(c)) continue;
    kept.push(c); M.compose(p, Q.identity(), S.set(r, h, r)); spire.setMatrixAt(si++, M); }
  for (const [x, z, h] of [[-160, -24, 190], [160, -24, 190], [-128, -82, 150], [128, -82, 150]]) { M.compose(new THREE.Vector3(CITY.x + x, P.y + 1, CITY.z + z), Q.identity(), S.set(9, h, 9)); spire.setMatrixAt(si++, M); }
  spire.count = si; spire.instanceMatrix.needsUpdate = true; show(spire);
  await ctx.yield();

  // ---- THE CITY'S GATE (the flight passes over its gable between its towers): two fluted towers, their middles at x -24 and 24,
  // nowhere wider than 7.9 m in radius (so no skin nearer x 0 than 16.1 m), stepped in twice under a pointed cap (top y 109.8);
  // between them a gable 34 m wide (eaves y 44, ridge y 52) over a round arch 25 m wide and 30 m high, 13 m deep, lit from within
  const G = GATE, gz = G.z + 5, gate = [];
  // (the line passes between them 17 m off, at y 60 to 75: there the main shaft carries real flutes with slits of light, a belt
  // of small lit ports at y 61.2 to 63.4 between two collars, more flutes above; six collars in all, none wider than 7.6 m)
  for (const s of [-1, 1]) { const tw = [cyl(7.9, 7.9, -2, 12, 24, K.stone), cyl(7.6, 7.6, 12, 13.6, 24, K.gold), fluted(6.2, 7.2, 13.6, 76, 28, 0.32, K.tower),
      cyl(7.5, 7.5, 25.4, 27, 24, K.gold), cyl(7.4, 7.4, 42.4, 44, 24, K.gold), cyl(7.2, 7.2, 59.4, 61, 24, K.gold), cyl(7.1, 7.1, 63.6, 65.2, 24, K.gold),
      cyl(7.6, 7.6, 76, 79, 24, K.gold), fluted(4.8, 5.6, 79, 95, 20, 0.26, K.tower), cyl(6.2, 6.2, 95, 97.2, 20, K.gold), cone(5.6, 12.6, 16, 97.2, K.gold)];
    for (const g of tw) gate.push(g.translate(s * (G.half + 7), 0, gz)); }
  await ctx.yield();
  const sh = new THREE.Shape(); sh.moveTo(-G.half, -2); sh.lineTo(-12.5, -2); sh.lineTo(-12.5, G.arch - 12.5); sh.absarc(0, G.arch - 12.5, 12.5, Math.PI, 0, true);
  sh.lineTo(12.5, -2); sh.lineTo(G.half, -2); sh.lineTo(G.half, G.gable - 8); sh.lineTo(0, G.gable); sh.lineTo(-G.half, G.gable - 8); sh.closePath();
  gate.push(dress(new THREE.ExtrudeGeometry(sh, { depth: 13, bevelEnabled: false, curveSegments: 18 }), K.flute, { cell: 2.4, y0: 0, H: G.gable }).translate(0, 0, gz - 6.5));
  gate.push(box(25.4, G.arch + 2, 0.6, K.light, { cell: 4.2 }).translate(0, -1, gz + 5), box(2 * G.half, 43, 16, K.stone).translate(0, -2, gz + 14.5));
  // PLAIN BANNERS of deep crimson cloth (no device, nothing lettered), hung flat: one on each gate tower's north face (3.6 m wide,
  // y 57 down to y 23, its inner edge 22.2 m from the line, 0.7 m before the widest collar) and three either side on the first
  // terrace's buttresses (the 2nd, 4th and 6th bay from the gate: 2.4 m wide, y 36 down to y 14, along the buttress's face).
  // They stir slowly by the clock (the vertex stage's sway, most at the free lower end)
  const banner = (top, bot, u, wide) => { const segs = 10, BP = [], BN = [], BA = [], BF = [], bi = [], L = top.distanceTo(bot), nn = u.clone().cross(bot.clone().sub(top).normalize()).normalize();
    for (let j = 0; j <= segs; j++) { const c = top.clone().lerp(bot, j / segs);
      for (const sg of [-1, 1]) { BP.push(c.x + u.x * sg * wide / 2, c.y, c.z + u.z * sg * wide / 2); BN.push(nn.x, nn.y, nn.z); BA.push(sg > 0 ? 1 : 0, 9, L * (1 - j / segs), L); BF.push(wide, 0, 0, wide); }
      if (j < segs) { const k = j * 2; bi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(BP, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(BN, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(BA, 4)); g.setAttribute('aF', new THREE.Float32BufferAttribute(BF, 4)); g.setIndex(bi); return g; };
  for (const s of [-1, 1]) { gate.push(banner(new THREE.Vector3(s * 24, 57, gz - 8.3), new THREE.Vector3(s * 24, 23, gz - 8.3), X1, 3.6));
    for (const kb of [2, 4, 6]) { const a = Math.PI + s * kb * TAU / 96, c0 = at(a, 382, -2), c1 = at(a, TERR[0].r0, TERR[0].y), v = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), sh2 = c1.clone().sub(c0).dot(v);
      const face = (y) => { const q = (y + 3) / 46.2, d = 3.6 + (sh2 - 1) * q + 0.7; return new THREE.Vector3(c0.x + v.x * d, y, c0.z + v.z * d); };
      gate.push(banner(face(36), face(14), new THREE.Vector3(-Math.cos(a), 0, Math.sin(a)), 2.4)); } }
  await ctx.yield(); solidOf(gate); await ctx.yield();

  // ---- THE WAY UP (low things only): a paved way 18 m wide from the gate's back to four low steps before the pedestal's plinth,
  // five low lamps either side of it; two broad flights of forty low steps, 14.4 m wide, between low balustrades with gold copings, their middles 32 m either side of the line,
  // climbing from the first terrace (z 62) to the second terrace's brow (z 104.5)
  const wayUp = [box(18, 2.2, 40, K.pave).translate(0, 40, 53)];
  for (let s = 0; s < 4; s++) wayUp.push(box(18, 0.9 * (s + 1), 3, K.stone).translate(0, 42.2, 61.5 + s * 3));
  for (const sx of [-1, 1]) { for (let i = 0; i < 5; i++) wayUp.push(box(0.5, 2.4, 0.5, K.stone).translate(sx * 10.5, 42.2, 36 + i * 8), box(0.9, 0.9, 0.9, K.light).translate(sx * 10.5, 44.6, 36 + i * 8));
    for (let i = 0; i < 40; i++) { const z0 = 62 + i * 1.0625, top = 41.5 + (i + 1) * 0.875; wayUp.push(box(14.4, top - 40, 106.5 - z0, K.stone).translate(sx * 32, 40, (z0 + 106.5) / 2)); }
    for (const bx of [24.6, 39.4]) { const x0 = sx * bx - 0.7, x1 = sx * bx + 0.7, rail = (y, e) => [new THREE.Vector3(x0 - e, y[0], 61), new THREE.Vector3(x1 + e, y[0], 61), new THREE.Vector3(x1 + e, y[1], 106.5), new THREE.Vector3(x0 - e, y[1], 106.5)];
      wayUp.push(hexa([...rail([40, 40], 0), ...rail([42.2, 79.6], 0)], K.stone, { y0: 40, H: 38 }), hexa([...rail([42.2, 79.6], 0.25), ...rail([42.7, 80.1], 0.25)], K.gold)); } }
  // ---- THE RING'S PLATFORM: a round golden deck, middle (PLAT.x, PLAT.z), radius PLAT.r, its top at PLAT.deck, a low rounded rim;
  // under it a flaring head on a fluted pedestal on a stepped plinth on the first terrace; a short span to the second terrace's brow
  const px = PLAT.x, pz2 = PLAT.z, dk = PLAT.deck, plat = [cyl(13, 14, 41, 45.8, 28, K.stone), cyl(9, 10, 45.8, 48.5, 24, K.gold), cyl(4.2, 5.4, 48.5, dk - 7, 20, K.flute, { open: true, cells: 12, cell: 2.5 }),
    cyl(5.8, 5.8, 58, 59.6, 20, K.gold), cyl(PLAT.r - 0.8, 4.4, dk - 7, dk - 1.4, 28, K.gold), cyl(PLAT.r, PLAT.r, dk - 1.4, dk, 40, K.gold),
    dress(new THREE.TorusGeometry(PLAT.r - 0.3, 0.3, 6, 40).rotateX(Math.PI / 2).translate(0, dk + 0.3, 0), K.gold, { round: true })];
  await ctx.yield();
  // the kerbs of the two basins under the veils by the flights and of the two rills beside the paved way (the water itself: see the falls)
  for (const sx of [-1, 1]) wayUp.push(box(20.6, 2.7, 0.8, K.stone).translate(sx * 52, 40, 79.1), box(0.8, 2.7, 11.3, K.stone).translate(sx * 42.1, 40, 84.4), box(0.8, 2.7, 11.3, K.stone).translate(sx * 61.9, 40, 84.4),
    box(0.5, 2.2, 28.5, K.stone).translate(sx * 12.3, 40, 62.25), box(0.5, 2.2, 28.5, K.stone).translate(sx * 15.7, 40, 62.25));
  solidOf(wayUp.splice(0)); await ctx.yield();      // the way, the flights and the kerbs as one solid; the platform as another (shorter steps of work)
  for (const g of plat) wayUp.push(g.translate(px, 0, pz2));
  wayUp.push(box(6.4, 1.2, 9, K.gold).translate(px, dk - 1.2, pz2 + 14.7));
  solidOf(wayUp); await ctx.yield();

  // ---- THE FALLS from the first terrace (four; six on a dense deal). ROUND THREE: each a real fall (see the material): a curved
  // sheet of white water, 16 to 24 m wide, leaving the gold lip of a bastion of golden stone (two gold-capped piers at its
  // hands) and arcing 3.5 m out as it drops the 41.6 m to the sea; standing mist on the water at its foot, an apron of foam on
  // the sea before it; all with its image. TYPED PLACES, so that they are seen from the bridge and from the sea on every seed:
  // about 0.55 and 1.05 of a radian either side of the gate's bearing (192 m and 319 m either side of the line), on a dense
  // deal also 1.6; each dealt a tenth of a radian of play and its width
  const fr = stream('falls'), SIDE = dens > 1 ? [0.55, 1.05, 1.6] : [0.55, 1.05], nF = SIDE.length * 2, VP = [], VA = [], VU = [], VI = []; let nFall = 0;
  const frame = (a) => [new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), new THREE.Vector3(Math.sin(a), 0, Math.cos(a))];      // along the wall; outward
  // the falling sheet: six strips across (its middle bulging `bulge` out), five down (closer at the lip), arcing `arc` out by its foot
  const sheetOf = (a, wide, r, yT, yB, bulge, arc) => { const [t, o] = frame(a), c = at(a, r, 0), k = VP.length / 3, NX = 6, NY = 5, H = yT - yB;
    for (let j = 0; j <= NY; j++) { const q = j / NY, fall = H * q * q;
      for (let i = 0; i <= NX; i++) { const sg = i / NX * 2 - 1, out = bulge * (1 - sg * sg) + arc * q;
        VP.push(c.x + t.x * sg * wide / 2 + o.x * out, yT - fall, c.z + t.z * sg * wide / 2 + o.z * out); VA.push(sg * wide / 2 + a * 300, 0, fall, H); VU.push((sg + 1) / 2, 1 - q);
        if (i < NX && j < NY) { const v = k + j * (NX + 1) + i; VI.push(v, v + NX + 1, v + 1, v + 1, v + NX + 1, v + NX + 2); } } } };
  // the standing mist: an upright soft sheet `high` tall on the water at radius r; the apron: a level sheet on the water from r0 out to r1
  const mist = (a, r, y, wide, high) => { const [t] = frame(a), c = at(a, r, y), k = VP.length / 3;
    for (const [sgn, v] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { VP.push(c.x + t.x * sgn * wide / 2, y + v * high, c.z + t.z * sgn * wide / 2); VA.push(sgn * wide / 2 + a * 300, 1, 0, 1); VU.push(sgn > 0 ? 1 : 0, v); }
    VI.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); };
  const apron = (a, r0, r1, y, wide) => { const [t] = frame(a), k = VP.length / 3;
    for (const [r, v] of [[r0, 0], [r1, 1]]) { const c = at(a, r, y); for (const sgn of [-1, 1]) { VP.push(c.x + t.x * sgn * wide / 2, y, c.z + t.z * sgn * wide / 2); VA.push(sgn * wide / 2 + a * 300, 3, (r1 - r0) * v, 1); VU.push(sgn > 0 ? 1 : 0, v); } }
    VI.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); };
  const bast = [];
  for (let i = 0; i < nF; i++) { const a = Math.PI + (i & 1 ? 1 : -1) * (SIDE[i >> 1] + fr.range(-0.1, 0.1)), W = fr.range(16, 24), sw = swell(a), [t, o] = frame(a), top = TERR[0].y + 0.6;
    nFall++;
    bast.push(block(at(a, 376, 0), t, o, W / 2 + 1.5, 10.5 * sw, -2, W / 2 + 1.5, 10.5 * sw, top, 0, K.stone),      // the bastion: its face 386.5 m from the middle, clear of the wall's batter and buttresses
      block(at(a, 381.5, 0), t, o, W / 2 + 2.1, 5.8 * sw, top, W / 2 + 2.1, 5.8 * sw, top + 1, 0, K.gold));      // its lip of polished gold, over which the water goes
    for (const sg of [-1, 1]) { const c = at(a, 384, 0).addScaledVector(t, sg * (W / 2 + 3.2));
      bast.push(block(c, t, o, 1.9, 3.4 * sw, -3, 1.5, 3 * sw, top + 4, 0, K.stone), block(c, t, o, 1.8, 3.3 * sw, top + 4, 0.3, 0.4, top + 7.4, 0, K.gold)); }
    apron(a, 386.6, 409, 0.25, W + 16); sheetOf(a, W, 387.3, top + 1, 0, 1.4, 3.5); mist(a, 392, 0, W + 30, 17); mist(a, 398, 0, W + 12, 8); }
  // THE WATER BY THE RING (typed places, all of it going by the clock): either side of
  // the two flights of steps a fall 14 m wide, its middle about 51 m from the line, now hangs PLUMB (round three): it leaves the gold lip of a
  // bastion of golden stone 17 m square that stands out from the second terrace's wall to that wall's foot (nothing of it nearer
  // the line than 40.7 m), and drops 35 m into a long basin on the first terrace (19 m by 10 m, a low kerb round it, mist at its
  // foot); the basins drain under the flights into two rills 2.8 m wide, 14 m either side of the line, running beside the paved
  // way toward the gate (z 76 to 48.5)
  const sheet = (x0, x1, z0, y0, z1, y1, speed) => { const k = VP.length / 3;
    for (const [x, z, y, u, v] of [[x0, z0, y0, 0, 0], [x1, z0, y0, 1, 0], [x0, z1, y1, 0, 1], [x1, z1, y1, 1, 1]]) { VP.push(x, y, z); VA.push(0, 2, speed, 0); VU.push(u, v); }
    VI.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); };
  for (const sx of [-1, 1]) { const a = Math.PI - sx * 0.165, [t, o] = frame(a), top = TERR[1].y + 0.6, low = TERR[0].y + 2.3;
    bast.push(block(at(a, 309.5, 0), t, o, 8.5, 8.5, TERR[0].y + 1.5, 8.5, 8.5, top, 0, K.stone), block(at(a, 313.4, 0), t, o, 9.1, 5.2, top, 9.1, 5.2, top + 1, 0, K.gold));
    sheet(sx * 42.5, sx * 61.5, 79.5, low, 90.5, low, 0.3); sheet(sx * 12.55, sx * 15.45, 76, 41.7, 48.5, 40.8, 1.5);
    sheetOf(a, 14, 318.6, top + 1, low, 1, 2.2); mist(a, 322, low, 20, 9); }
  if (bast.length) solidOf(bast);
  await ctx.yield();
  if (VI.length) { const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(VP, 3)); vg.setAttribute('aA', new THREE.Float32BufferAttribute(VA, 4));
    vg.setAttribute('uv', new THREE.Float32BufferAttribute(VU, 2)); vg.setIndex(VI);
    const water = new THREE.Mesh(vg, veilMat(shared)); water.renderOrder = 0.9; water.frustumCulled = false; group.add(water);
    const wim = twin(water, veilMat(shared, true)); wim.renderOrder = 0.35; images.add(wim); }
  // ---- THE TWO OUTWORKS (round three), standing in the still sea east of the bridge, of the wall's own stone and gold, each with
  // its image. TYPED PLACES: OUTWORK ONE, its middle (207, -524); OUTWORK TWO, its middle (210, -275). Each is a ROUND BASTION
  // 44 m across at the water (OUT_R, its one number), its wall battered to 41.8 m at its head 25 m up: the terraces' own wall in
  // six bays (ribs, courses, three arches lit from within to a bay, the arcades turned to the flown line), six buttresses of
  // golden stone standing 1.25 m proud at the bays' joints, gold capped (tops 29.9 m), a cornice of polished gold, a parapet, a
  // paved deck 26.3 m up. On it ONE SLIM SPIRE (88 m tall on ONE, 76 m on TWO, from the deck): a stepped foot, a fluted shaft
  // with slits of light and belts of lit ports, two collars, and a LIT CROWN: a lantern of six lights under a gold cap, a
  // bright finial. Nothing of an outwork lies farther than 23.3 m in plan from its middle
  const OUT_R = 22, lu = new THREE.Vector3(300, 0, 701).normalize(), outs = [];      // lu: the crossing's heading (the design's line); the bays are laid out from it
  for (const [ox, oz, tall] of [[207, -524, 88], [210, -275, 76]]) { const c = new THREE.Vector3(ox, 0, oz), R = OUT_R, top = 25, dk = top + 1.3, n = 60;
    outs.push(hoop(c, lu, R, R, -2, R - 1.1, R - 1.1, top, n, 0, K.cliff, 6), hoop(c, lu, R - 1.1, R - 1.1, top, R - 0.5, R - 0.5, top, n, 0, K.gold, 1),
      hoop(c, lu, R - 0.5, R - 0.5, top, R - 0.5, R - 0.5, dk, n, 0, K.gold, 1), hoop(c, lu, R - 0.5, R - 0.5, dk, R - 1.5, R - 1.5, dk, n, 0, K.gold, 1),
      hoop(c, lu, R - 1.5, R - 1.5, dk, R - 1.5, R - 1.5, dk + 1.3, n, 0, K.stone, 36), hoop(c, lu, R - 1.5, R - 1.5, dk + 1.3, R - 2.3, R - 2.3, dk + 1.3, n, 0, K.stone, 1),
      hoop(c, lu, R - 2.3, R - 2.3, dk + 1.3, R - 2.3, R - 2.3, dk, n, 0, K.stone, 36), hoop(c, lu, R - 2.3, R - 2.3, dk, 0.5, 0.5, dk, n, 0, K.pave, 1));
    await ctx.yield();
    const lo = oval(R, R, 6, 0).out, vx = lu.z, vz = -lu.x;
    for (let k = 0; k < 6; k++) { const [a0, b0, nx, nz] = lo[k], o = new THREE.Vector3(lu.x * nx + vx * nz, 0, lu.z * nx + vz * nz), t = new THREE.Vector3(vx * nx - lu.x * nz, 0, vz * nx - lu.z * nz);
      const p = new THREE.Vector3(c.x + lu.x * a0 + vx * b0, 0, c.z + lu.z * a0 + vz * b0);
      outs.push(block(p, t, o, 1.5, 1.25, -3, 1.2, 1, top + 2.9, -1.1, K.stone), block(p.clone().addScaledVector(o, -1.1), t, o, 1.3, 1.1, top + 2.9, 0.25, 0.25, top + 4.9, 0, K.gold)); }
    const yS = dk + tall * 0.8, sp = [cyl(5.2, 5.8, dk, dk + 3, 20, K.stone), cyl(4, 4.4, dk + 3, dk + 5, 20, K.gold), fluted(1.5, 3.3, dk + 5, yS, 12, 0.2, K.tower),
      cyl(3, 3, dk + tall * 0.3, dk + tall * 0.3 + 1.2, 14, K.gold), cyl(2.4, 2.4, dk + tall * 0.56, dk + tall * 0.56 + 1.1, 14, K.gold), cyl(3.1, 1.7, yS, yS + 1.6, 14, K.gold),
      cyl(2.15, 2.15, yS + 1.6, yS + 7.8, 12, K.light, { open: true, cells: 6, cell: 2.25 }), cyl(2.9, 2.9, yS + 7.8, yS + 8.7, 14, K.gold), cone(2.6, tall * 0.2 - 10.7, 12, yS + 8.7, K.gold),
      dress(new THREE.SphereGeometry(0.9, 8, 5).translate(0, dk + tall - 1.4, 0), K.light, { round: true, y0: dk + tall - 2.4, H: 6 })];      // THE LIT CROWN: a lantern of six lights 6.2 m tall and 4.3 m across between two gold rings, a gold cap, a bright finial
    for (const g of sp) outs.push(g.translate(ox, 0, oz));
    await ctx.yield(); solidOf(outs.splice(0)); await ctx.yield(); }
  // ---- THE MOUNTAINS BEHIND THE CITY: one group (see buildRange), put in by the ONE line that follows the next
  const range = await buildRange(ctx, shared, stream('range'));
  group.add(range);      // strike this one line and the mountains and their image are gone
  // dispose(): frees what this part made (its geometries, its materials, the instanced meshes' buffers); it made no texture
  const dispose = () => { const geos = new Set(), mats = new Set();
    for (const root of [group, images, range]) root.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material) mats.add(o.material); if (o.isInstancedMesh) o.dispose(); });
    for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); };
  return { object: group, image: images, buildings: nHouse, spires: si, falls: nFall, dispose };
}
