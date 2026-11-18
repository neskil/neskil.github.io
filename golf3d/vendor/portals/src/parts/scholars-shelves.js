// THE ENFILADE: hero set piece of "scholars-shelves" (The Scholar's Shelves).
//
// A Joseon chaekgeori (painted bookshelf screen) built in reverse perspective. A leopard-pelt curtain hangs before
// nine compartments on one axis, each 1.26 times the last in every dimension and flaring by the same 1.26 inside
// itself, so the whole case is a stepped horn 690 m long: 60 m wide and 24 m high at its mouth, 475 m wide at the
// back wall of the last hall. Every box in it is wider and taller at its far end and shows its front, both sides
// and its top at once. Side cells either hand hold stacks of slipcased books that slide out toward the aisle like
// organ stops as the camera nears, with a second tier of smaller stacks, bottles, fruit bowls and orchid pots on a
// shelf board. Folding-screen walls of six panels divide the compartments and hinge aside; hanging scrolls drop
// from their rollers and unroll down the uprights; a pair of jade rings with tassels swings from every lintel. The
// first compartment holds the long vermilion table whose edges spread apart ahead, an inkstone, and a bamboo brush
// pot the size of a well. The ninth compartment is the hall, open to the paper above: seven pagodas of stacked books
// with the top volume open and its pages fanning, a white vase 62 m tall holding the season's flowers whose petals
// come down the size of sails (and lie where they landed), a round lattice window in the back wall, and over it, on
// the cornice, a folk-painting tiger-cat with round green eyes, paws over the ledge and a striped tail swinging.
//
// LOCAL SPACE  This piece IS the world's space, so its frame is the brief's and not "base centre": the flight axis
//              is local -Z at y = 0, the entry point is the origin, the curtain hangs at z -32, compartment fronts
//              are at z -36, -58, -85, -119, -162, -216, -285, -371, -480 and the back wall at z -690. Front faces
//              +Z. Floors lie 0.42 of each height below the axis (y -10 at the first front, -64 at the hall's, -80
//              at the back wall), ceilings 0.58 above. Add hero.object to the scene at the origin, unrotated.
// SIZE         x -240..240, y -80..115, z 0..-691. radius 330, height 190, center (0, 20, -400).
// VIEWING      It is an interior: an orbit shows only the plain boards of its outside. Fly anchors.flyThrough.
// COST         19k-21k triangles (about 23k with the rare hall or plum blossom), 4 draw calls: still geometry, moving
//              geometry, the cat, the paper dome (6 with the rare hall). Two shader programs for everything painted
//              (FRAG with and without the ANIM vertex paths) plus the cat and the paper. No lights, no textures.
//              Build about 60 ms of script (110-190 ms on the test renderer), yielding between steps.
// LIGHTING     None wanted and none used: every material is an unlit ShaderMaterial that writes the pigment's linear
//              colour. Return post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1,
//              vignette: 0, grain: 0 } } and no scene fog (pass opts.fog: true only if the scene really has fog;
//              the fog chunks are in the shaders). Set scene.background to the paper tan (palette[0]); the piece
//              brings its own camera-following paper dome with fibres and flecks (hero.paper).
//
// OPTS         palette    7 hex strings in brief order: paper tan, ink, indigo, malachite, vermilion, white, ochre
//              backs      'indigo' | 'vermilion' | 'ink'   shelf backs (default: by seed, indigo most often)
//              flower     'peony' | 'lotus' | 'chrysanthemum' | 'plum'   what stands in the vase (default: by seed)
//              cat        'striped' | 'spotted'            (default: by seed)
//              curtain    'leopard' | 'tiger' | false      (default: by seed; false leaves the curtain to the world)
//              rare       true builds the second hall and lets the hall's right wall hinge (default ctx.vary.rare)
//              petals     multiplier for falling petals (default 1; already scaled by ctx.quality.detail)
//              paper      false leaves out the paper dome
//              inkScale   multiplier for the ink line width (default 1: 1.5 px at 450 lines, 2.6 px at 1080)
//              fog        true lets scene fog tint the piece (default false, by the brief)
//              What was chosen is in hero.look = { backs, flower, cat, curtain, rare }.
//
// PROGRESS     hero.setProgress(u) with the path's u (0..1) every frame, before hero.update(dt, time, camera).
//              Without it the piece takes u from the camera's depth (u = -z / 690 in local space). From u:
//                curtain    hangs already parted when first seen (lift 0.8: an arch over the room, its sides hanging to the
//                           floor) and gathers from the middle over u 0..0.04 into a swag about 9 m overhead
//                walls      walls 1..4 are already folding when the flight begins (they start at u -0.016, -0.012, -0.008,
//                           -0.004 and are done by 0.028) so that the first view is the table against four open doorways; walls 2..4
//                           fold flatter than the rest, which keeps the nested openings near one apparent size.
//                           Then 0.07, 0.13, 0.22 (two doorways always stand open beyond the one ahead) and the hall's own
//                           wall at 0.46: the hall stands clear from u 0.50. Every panel carries three painted ledges of
//                           things (books, jars, clocks, fruit, seals, go boards, scrolls ...) that fold aside with it
//                cases      each sliding case starts 0.55 to 1.25 compartment depths before the camera reaches it
//                scrolls    start 2.5 aisle half-widths ahead of the camera and take 1.5 (they are at fronts 4, 5, 6
//                           and one more by seed, so one pair is always unrolling in view between u 0.1 and 0.4)
//                rare       the hinging leaf swings out over u 0.60..0.84 (0.8 rad; setFold(1.6) is the same)
//              Overrides (pass null to return to the schedule): setCurtain(0..1), setHinge(i, 0..1), setFold(0..1),
//              setCatLook(x, y) with x, y in -1..1 or lookCatAt(localPoint) to turn the cat's head and eyes after
//              the magpie (without them the cat looks about by itself). On time: petals, pages, tassels, brush tips,
//              orchid leaves, flower heads, the cat's tail, ears and blink, the jade rings, the curtain's sway.
//
// ANCHORS      (local = world)
//   entry          (0, 0, 0)
//   portalSeat     { position (0, 0, -690), normal (0, 0, 1), radius 7, eyeRadius 8 }: the clear eye of the lattice
//                  window, a real hole in the wall; the 14 m circle portal sits in it, level
//   flyThrough     22 points down the axis: a 5 m weave through compartments 3-5, a 14 m bow to the right round the
//                  vase (z -495..-604), the last 86 m straight, square on the window and the cat. Nothing solid within 8 m of it: sliding cases stop
//                  9 shelf units from the axis, falling petals and flower heads keep clear of the strip x 0..14.
//                  hero.flyX(z) gives the same line as a function.
//   viewpoints     { statement, scrolls, hallReveal, linger, window }: camera positions for the brief's frames
//   curtainPlane, fronts, heights, table { near, far }, brushPot { position, radius, rimY } (in compartment 2, 15.6 m right of the axis)
//   vase { position, mouth, radius }, flowerHeads [{ position, radius }], pagodaTops [Vector3] (perches for the magpie)
//   cornice { y, zFront }, catHead, catTailTip, windowCentre
//   rare { gaze, hinge, jamb, vase, from, to }: where to turn the gaze for the rare event (see RARE EVENT)
//   table { near, far, halfNear, halfFar, b }, inkstone (the magpie's first perch)
//   hero.scaleAt(z) is the horn's scale s(z); hero.shelfPoint(a, b, z) maps shelf units to local space: the aisle
//   is |a| < 15, side cells 15..30, floor b = -10.08, ceiling b = 13.92, and a thing at (a, b) keeps its place in
//   every compartment.
//
// STYLE, and how to match it (hero.kit builds more in the same paint and the same two shader programs):
//   1. One law of space: model in shelf units and place at (a * s(z), b * s(z), z). kit.prism(batch, a0, a1, b0, b1,
//      zFront, zBack, { f, faces }) does it and adds the object's own flare f about its foot; never a true cuboid.
//   2. Pigment: each face carries [base, second, pattern]: two palette slots and a pattern id (kit.pigment, kit.pattern:
//      grain, page lines, stripes, tortoise hexagons, coins, sprinkled clouds, inset band, rosettes, title slip,
//      scroll bands, and cut-out shapes petal / leaf / disc / lotus). Flat colour, no light, 3 % paper tooth.
//      The palette is the uniform array uPal: slots 0-6 the brief's seven, 7 shelf back, 8 its motif, 9-10 flower,
//      11 fur, 12 second motif; change a slot's colour to regrade (hero.uniforms.uPal.value[i]).
//   3. Ink: every quad draws an even ink line along its own edges in the fragment shader (aQ runs 0..1 across the
//      face; an edge is switched off by holding aQ at 0.5), width uInk pixels, never under 1.5 px and never more
//      than a quarter of the face; round things (kit.lathe) get their silhouette from the view angle; cut-outs
//      (kit.card) from the shape's own distance field. Pattern lines fade out before they can shimmer.
//   4. Faces of one box differ in pigment or pattern (white page-block end, patterned cloth front, ochre top).
//   kit.makeBatch(false | true) -> batch; kit.finish(batch) -> Mesh. Moving things set batch.A / batch.B per vertex
//   (kinds 1-13 in VERT: fold, slide on u, unroll on u, swing, falling petal, sway, turn by uniform, curtain, lathe,
//   spin, slide by uniform, travelling wave, widening ring).
//
// RARE EVENT   On a rare visit the hall is built for it: the back wall stops 54 m right of the window (a banded jamb),
//              and everything beyond is the hinging leaf, the hall's right wall with its return along the back. It
//              swings about the front right corner like a great door, and behind the back wall's line, parallel to
//              it, stands the neighbouring leaf: a second hall a fifth larger, on a contrasting ground, with three
//              book towers and a vase of lotus. From the linger the opening spans 20 to 56 degrees right of the
//              flight line, so it fills the right third of a frame that still holds the window and the cat, with
//              the steady camera as well; a poi at anchors.rare.gaze (weight about 0.6) centres it for the sweeping
//              one. The right-hand far towers, the last right upright and the far stacks are left out on that visit.
// WEAKNESS     The cornice is at y 30 rather than the brief's 70, and 22 m deep rather than 40, so that the cat is in
//              frame over the window from the hall's door until u 0.88 (higher or deeper, the ledge lies across the
//              top of the frame through the linger). The table is
//              30 m by 6.4 to 26 m and stands 18 m behind the curtain (the brief: 40 m, 5 to 22 m, at the front)
//              so that its spreading edges are seen whole while the hem rises.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#D9C39A', '#1F1A17', '#1F3460', '#3F8F6B', '#C8432B', '#F4EEDD', '#C9952F'];
// pigment slots (indices into the uPal uniform array)
const TAN = 0, INK = 1, IND = 2, MAL = 3, VER = 4, WHT = 5, OCH = 6, BACK = 7, MOTIF = 8, FLOWER = 9, FLOWER2 = 10, FUR = 11, MOTIF2 = 12;
// pattern ids (see FRAG)
const P_FLAT = 0, P_GRAIN = 1, P_PAGES = 2, P_STRIPE = 3, P_HEX = 4, P_COIN = 5, P_CLOUD = 6, P_BAND = 7, P_ROSETTE = 8,
  P_SLIP = 11, P_SCROLL = 12, P_BANDX = 13, P_PETAL = 20, P_LEAF = 21, P_DISC = 22, P_PETALEDGE = 23, P_LOTUS = 24, P_FRUIT = 25, P_GRID = 26, P_EYE = 27, P_RING = 28, P_HOOP = 29;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the horn (reverse perspective as a law of space)
// Compartment fronts, heights and the scale s(z): everything is modelled in "shelf units" (a, b) and placed at
// world (a * s(z), b * s(z), z), so parallel edges spread apart with distance and every box is larger at its far end.
const FRONT_Z = [-36, -58, -85, -119, -162, -216, -285, -371, -480, -690];
const FRONT_H = [24, 30, 38, 48, 60, 76, 96, 121, 152, 190];
const FLOOR_B = -10.08, CEIL_B = 13.92, AISLE_A = 15, CELL_A = 30;   // shelf units: floor, ceiling, aisle half-width, outer wall
function hornS(z) {
  if (z >= FRONT_Z[0]) return 1;
  for (let i = 0; i < 9; i++) {
    if (z >= FRONT_Z[i + 1]) { const t = (FRONT_Z[i] - z) / (FRONT_Z[i] - FRONT_Z[i + 1]); return (FRONT_H[i] + (FRONT_H[i + 1] - FRONT_H[i]) * t) / 24; }
  }
  return FRONT_H[9] / 24;
}

// a small seeded generator of its own, so that added detail never moves the draws of ctx.rng
function miniRng(label) {
  let a = 2166136261 >>> 0; const str = String(label);
  for (let i = 0; i < str.length; i++) { a ^= str.charCodeAt(i); a = Math.imul(a, 16777619); }
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------- geometry batch
function makeBatch(anim) {
  return { anim, pos: [], uv: [], q: [], pig: [], a: [], b: [], idx: [], n: 0, P: [TAN, INK, 0], A: [0, 0, 0, 0], B: [0, 0, 0, 0], ox: 0 };
}
function vtx(bt, c, u, v, w, qx, qy) {
  bt.pos.push(c[0] + bt.ox, c[1], c[2]); bt.uv.push(u * w, v * w, w); bt.q.push(qx, qy);
  const P = bt.P; bt.pig.push(P[0], P[1], P[2]);
  if (bt.anim) { const A = bt.A, B = bt.B; bt.a.push(A[0], A[1], A[2], A[3]); bt.b.push(B[0], B[1], B[2], B[3]); }
  return bt.n++;
}
function dist3(p, q) { const x = p[0] - q[0], y = p[1] - q[1], z = p[2] - q[2]; return Math.sqrt(x * x + y * y + z * z); }
// Quad c0..c3 = bottom-left, bottom-right, top-right, top-left. uv rectangle (u0,v0)-(u1,v1). em: which edges get
// an ink line (1 left, 2 right, 4 bottom, 8 top). Trapezoids get projective uv weights so patterns spread with the flare.
function quad(bt, c0, c1, c2, c3, u0, v0, u1, v1, em = 15) {
  const qa = em & 1 ? 0 : 0.5, qb = em & 2 ? 1 : 0.5, qc = em & 4 ? 0 : 0.5, qd = em & 8 ? 1 : 0.5;
  // projective weights: for a trapezoid the weight of a corner is the length of the parallel edge it lies on
  let w0 = 1, w1 = 1, w2 = 1, w3 = 1;
  const eb = dist3(c0, c1), et = dist3(c3, c2), el = dist3(c0, c3), er = dist3(c1, c2);
  const r1 = Math.abs(eb - et) / Math.max(eb + et, 1e-6), r2 = Math.abs(el - er) / Math.max(el + er, 1e-6);
  if (r1 > r2 && r1 > 1e-3 && eb > 1e-6 && et > 1e-6) { const m = Math.max(eb, et); w0 = w1 = eb / m; w2 = w3 = et / m; }
  else if (r2 > 1e-3 && el > 1e-6 && er > 1e-6) { const m = Math.max(el, er); w0 = w3 = el / m; w1 = w2 = er / m; }
  const i = vtx(bt, c0, u0, v0, w0, qa, qc); vtx(bt, c1, u1, v0, w1, qb, qc); vtx(bt, c2, u1, v1, w2, qb, qd); vtx(bt, c3, u0, v1, w3, qa, qd);
  bt.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
}
// quad with explicit uv per corner and no projective weights (for fans, rings and ribbons)
function rawQuad(bt, c0, c1, c2, c3, t0, t1, t2, t3, em = 0, pre = null) {
  const qa = em & 1 ? 0 : 0.5, qb = em & 2 ? 1 : 0.5, qc = em & 4 ? 0 : 0.5, qd = em & 8 ? 1 : 0.5;
  if (pre) pre(0, c0); const i = vtx(bt, c0, t0[0], t0[1], 1, qa, qc);
  if (pre) pre(1, c1); vtx(bt, c1, t1[0], t1[1], 1, qb, qc);
  if (pre) pre(2, c2); vtx(bt, c2, t2[0], t2[1], 1, qb, qd);
  if (pre) pre(3, c3); vtx(bt, c3, t3[0], t3[1], 1, qa, qd);
  bt.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
}
// horn point: shelf units (a, b) at depth z -> world
function hp(a, b, z) { const s = hornS(z); return [a * s, b * s, z]; }

// The prism: a box in shelf units, a0..a1 by b0..b1, from z0 (front, toward the viewer) back to z1 (< z0). Its back face
// is larger than its front by the horn and again by `f` (the object's own flare) about the anchor (ax, ay as fractions
// of its width and height: 0.5, 0 keeps the foot on the floor). faces: { front, back, left, right, top, bottom } each
// [base, second, pattern] or null/undefined to skip. k = pattern scale (uv per shelf unit).
function prism(bt, a0, a1, b0, b1, z0, z1, o = {}) {
  const f = o.f ?? 1, ax = o.axAbs ?? a0 + (a1 - a0) * (o.ax ?? 0.5), ay = o.ayAbs ?? b0 + (b1 - b0) * (o.ay ?? 0), k = o.k ?? 1, uo = o.uo ?? 0;
  const s0 = hornS(z0), s1 = hornS(z1);
  const F = (a, b) => [a * s0, b * s0, z0];
  const K = (a, b) => [(ax + (a - ax) * f) * s1, (ay + (b - ay) * f) * s1, z1];
  const dn = (z0 - z1) / s0, w = a1 - a0, h = b1 - b0, fc = o.faces || {};
  const set = (spec) => { bt.P[0] = spec[0]; bt.P[1] = spec[1] ?? INK; bt.P[2] = spec[2] ?? 0; };
  const em = o.em ?? 15;
  if (fc.front) { set(fc.front); quad(bt, F(a0, b0), F(a1, b0), F(a1, b1), F(a0, b1), uo, 0, uo + w * k, h * k, em); }
  if (fc.back) { set(fc.back); quad(bt, K(a0, b0), K(a1, b0), K(a1, b1), K(a0, b1), uo, 0, uo + w * k, h * k, em); }
  if (fc.left) { set(fc.left); quad(bt, F(a0, b0), K(a0, b0), K(a0, b1), F(a0, b1), uo, 0, uo + dn * k, h * k, em); }
  if (fc.right) { set(fc.right); quad(bt, F(a1, b0), K(a1, b0), K(a1, b1), F(a1, b1), uo, 0, uo + dn * k, h * k, em); }
  if (fc.top) { set(fc.top); quad(bt, F(a0, b1), F(a1, b1), K(a1, b1), K(a0, b1), uo, 0, uo + w * k, dn * k, em); }
  if (fc.bottom) { set(fc.bottom); quad(bt, F(a0, b0), F(a1, b0), K(a1, b0), K(a0, b0), uo, 0, uo + w * k, dn * k, em); }
}
// (o.axAbs / o.ayAbs give the anchor in shelf units instead, so stacked boxes can share one flare.)
// shorthand: the same three pigments on front / sides / top that every box in the painting shows
function box(bt, a0, a1, b0, b1, z0, z1, front, side, top, o = {}) {
  o.faces = { front, left: side, right: side, top, bottom: o.bottom === undefined ? side : o.bottom, back: o.back };
  prism(bt, a0, a1, b0, b1, z0, z1, o);
}
// flat cut-out card in world space: centre c, half-axes ux, uy (vectors); uv runs -1..1; the shape is cut in the shader
function card(bt, c, ux, uy, base, second, pat) {
  bt.P[0] = base; bt.P[1] = second; bt.P[2] = pat;
  const p = (sx, sy) => [c[0] + ux[0] * sx + uy[0] * sy, c[1] + ux[1] * sx + uy[1] * sy, c[2] + ux[2] * sx + uy[2] * sy];
  quad(bt, p(-1, -1), p(1, -1), p(1, 1), p(-1, 1), -1, -1, 1, 1, 0);
}
// lathe in world space: rings = [[radius, y, base, second, pattern, uvRepeat, edges], ...] bottom to top (edges: 1 = ink
// line along the band's lower rim, 2 = upper rim, default both); each band between two
// rings takes the pigments of its lower ring. Normals go to aB for the silhouette ink line (kind 9).
function lathe(bt, cx, cz, rings, seg = 28) {
  const A0 = bt.A.slice(), B0 = bt.B.slice();
  for (let r = 0; r < rings.length - 1; r++) {
    const R0 = rings[r], R1 = rings[r + 1], dr = R1[0] - R0[0], dy = R1[1] - R0[1], dl = Math.hypot(dr, dy) || 1;
    const ny = -dr / dl, nr = dy / dl, rep = R0[5] ?? 6, eb = R0[6] ?? 3, qy0 = eb & 1 ? 0 : 0.5, qy1 = eb & 2 ? 1 : 0.5;
    bt.P[0] = R0[2]; bt.P[1] = R0[3] ?? INK; bt.P[2] = R0[4] ?? 0; bt.A[0] = 9;
    for (let i = 0; i < seg; i++) {
      const t0 = (i / seg) * TAU, t1 = ((i + 1) / seg) * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      const base = bt.n, u0 = (i / seg) * rep, u1 = ((i + 1) / seg) * rep;
      bt.B[0] = c0 * nr; bt.B[1] = ny; bt.B[2] = s0 * nr;
      vtx(bt, [cx + c0 * R0[0], R0[1], cz + s0 * R0[0]], u0, 0, 1, 0.5, qy0); const iTL = bt.n; vtx(bt, [cx + c0 * R1[0], R1[1], cz + s0 * R1[0]], u0, 1, 1, 0.5, qy1);
      bt.B[0] = c1 * nr; bt.B[2] = s1 * nr;
      vtx(bt, [cx + c1 * R0[0], R0[1], cz + s1 * R0[0]], u1, 0, 1, 0.5, qy0); vtx(bt, [cx + c1 * R1[0], R1[1], cz + s1 * R1[0]], u1, 1, 1, 0.5, qy1);
      bt.idx.push(base, base + 2, base + 3, base, base + 3, iTL);
    }
  }
  bt.A = A0; bt.B = B0;
}
function finishBatch(bt, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bt.pos), 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array(bt.uv), 3));
  g.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(bt.q), 2));
  g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(bt.pig), 3));
  if (bt.anim) {
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(bt.a), 4));
    g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(bt.b), 4));
  }
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(bt.idx), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -345), 900);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.matrixAutoUpdate = false;
  return m;
}

// ---------------------------------------------------------------- shaders: flat pigment + ink line, no light
const VERT = /* glsl */`
attribute vec3 aUv; attribute vec2 aQ; attribute vec3 aP;
varying vec3 vUv; varying vec2 vQ; varying vec3 vP; varying float vNdv;
#ifdef ANIM
attribute vec4 aA; attribute vec4 aB;
uniform float uTime; uniform float uU; uniform float uHinge[10]; uniform float uAng[8];
vec3 rotA(vec3 p, float ax, float a) {
  float c = cos(a), s = sin(a);
  if (ax < 0.5) return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
  if (ax < 1.5) return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}
float ease(float x) { x = clamp(x, 0., 1.); return x * x * (3. - 2. * x); }
#endif
#include <fog_pars_vertex>
void main() {
  vec3 p = position; vUv = aUv; vQ = aQ; vP = aP; vNdv = 1.;
#ifdef ANIM
  float k = aA.x;
  if (k < 0.5) {
  } else if (k < 1.5) {                       // folding screen panel: aA = (1, wall, panel, s)  aB = (side * width, hinge x, widest angle, 0)
    int wi = int(aA.y + 0.5);
    float th = clamp(uHinge[wi], 0., 1.) * aB.z, pw = abs(aB.x);
    p.x = aB.y - aB.x * (aA.z + aA.w) * cos(th);
    p.z -= pw * sin(th) * (mod(aA.z, 2.) < 0.5 ? aA.w : 1. - aA.w);
  } else if (k < 2.5) {                       // sliding case: aA = (2, delay, duration, distance along x)
    p.x += aA.w * ease((uU - aA.y) / max(aA.z, 1e-4));
  } else if (k < 3.5) {                       // unrolling scroll: aA = (3, delay, duration, v)  aB = (length, phase, sway, 0)
    float e = ease((uU - aA.y) / max(aA.z, 1e-4));
    p.y -= min(aA.w, e) * aB.x;
    p.x += aB.z * sin(uTime * 1.3 + aB.y) * (0.25 + 0.75 * e);
  } else if (k < 4.5) {                       // swing about an axis on time: aA = (4, phase, speed, amplitude)  aB = (pivot, axis)
    p = aB.xyz + rotA(p - aB.xyz, aB.w, aA.w * sin(uTime * aA.z + aA.y));
  } else if (k < 5.5) {                       // falling petal: aA = (5, phase, fall speed, spin)  aB = (x, top y, z, fall range)
    float f = fract(uTime * aA.z / max(aB.w, 1.) + aA.y);
    float sc = smoothstep(0., 0.05, f) * (1. - smoothstep(0.95, 1., f));
    vec3 l = rotA(p * sc, 2., aA.y * 17. + 0.7 * sin(uTime * aA.w * 1.3 + aA.y * 5.));
    l = rotA(l, 0., 0.95 * sin(uTime * aA.w * 2.2 + aA.y * 40.));
    l = rotA(l, 1., 0.55 * sin(uTime * aA.w * 1.7 + aA.y * 9.));
    p = vec3(aB.x + sin(uTime * 0.45 + aA.y * 31.) * aB.w * 0.02, aB.y - f * aB.w, aB.z + f * aB.w * 0.5) + l;
  } else if (k < 6.5) {                       // sway: aA = (6, phase, speed, weight)  aB = (direction * amplitude, 0)
    p += aB.xyz * (sin(uTime * aA.z + aA.y) * aA.w);
  } else if (k < 7.5) {                       // turn about an axis by a uniform: aA = (7, index, gain, 0)  aB = (pivot, axis)
    int ai = int(aA.y + 0.5);
    p = aB.xyz + rotA(p - aB.xyz, aB.w, uAng[ai] * aA.z);
  } else if (k < 8.5) {                       // curtain: aA = (8, across -1..1, down 0..1, 0)  aB = (height, 0, 0, 0); uAng[2] lifts it
    float lift = clamp(uAng[2], 0., 1.) * (1. - 0.75 * abs(aA.y) * aA.y * aA.y);
    p.y -= aA.z * aB.x * (1. - 0.78 * lift);
    p.z += aA.z * (0.9 * lift * sin(aA.y * 24.) + 0.35 * sin(uTime * 0.9 + aA.y * 3. + aA.z * 5.));
    p.x += 0.25 * sin(uTime * 0.7 + aA.z * 4.) * aA.z;
  } else if (k < 9.5) {                       // lathe: aB.xyz = normal, for the silhouette line
    vec3 wn = normalize(mat3(modelMatrix) * aB.xyz + vec3(0., 1e-6, 0.));
    vec3 wv = cameraPosition - (modelMatrix * vec4(p, 1.)).xyz;
    vNdv = abs(dot(wn, wv / max(length(wv), 1e-4)));
  } else if (k < 10.5) {                      // spin about an axis on time: aA = (10, phase, speed, 0)  aB = (pivot, axis)
    p = aB.xyz + rotA(p - aB.xyz, aB.w, uTime * aA.z + aA.y);
  } else if (k < 11.5) {                      // slide by a uniform: aA = (11, index, 0, 0)  aB = (offset at 1, 0)
    int ai = int(aA.y + 0.5);
    p += aB.xyz * uAng[ai];
  } else if (k < 12.5) {                      // travelling wave: aA = (12, phase, speed, weight)  aB = (direction * amplitude, bob)
    p += aB.xyz * (sin(uTime * aA.z + aA.y) * aA.w);
    p.y += aB.w * (0.5 + 0.5 * sin(uTime * aA.z * 0.5 + aA.y * 0.5));
  } else {                                    // widening ring: aA = (13, phase, speed, 0)  aB = (centre, 0): grows from the centre, then starts again
    p = aB.xyz + (p - aB.xyz) * (0.12 + 0.88 * fract(uTime * aA.z + aA.y));
  }
#endif
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
uniform vec3 uPal[13]; uniform float uInk;
varying vec3 vUv; varying vec2 vQ; varying vec3 vP; varying float vNdv;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float aa(float d, float w) { return 1. - smoothstep(w - 0.6, w + 0.6, d); }
void main() {
  int ib = int(vP.x + 0.5), ic = int(vP.y + 0.5);
  vec3 base = uPal[ib], sec = uPal[ic], ink = uPal[1];
  float pat = floor(vP.z + 0.5);
  vec2 uv = vUv.xy / max(vUv.z, 1e-5);
  vec2 fw = max(fwidth(uv), vec2(1e-6)); float fl = max(fw.x, fw.y);
  vec2 fq = max(fwidth(vQ), vec2(1e-6));
  float fn = max(fwidth(vNdv), 1e-6);
  // shape cards (uv -1..1): width profile along the petal / leaf, all derivatives taken here at top level
  float t = clamp(uv.y * 0.5 + 0.5, 0., 1.);
  float arch = sqrt(max(4. * t * (1. - t), 0.));
  float wPeony = 0.92 * arch * (0.4 + 0.6 * t) + 0.045 * cos(uv.x * 12.) * t;
  float wLeaf = 0.52 * sin(3.14159 * sqrt(t)) * (1. - 0.25 * t);
  float wLotus = 0.6 * arch * (1. - 0.45 * t * t);
  float wv = pat > 23.5 ? wLotus : (pat > 20.5 && pat < 21.5 ? wLeaf : wPeony);
  float dS = pat > 21.5 && pat < 22.5 ? 1. - length(uv) : wv - abs(uv.x);
  float dSpx = dS / max(fwidth(dS), 1e-6);
  float dS2 = 1. - length(uv);
  float dS2px = dS2 / max(fwidth(dS2), 1e-6);
  float vx = uv.x / max(wv, 0.05) * 1.5 + 0.5;
  float vxpx = abs(fract(vx) - 0.5) / max(fwidth(vx), 1e-6);
  vec3 col = base; float k = 0.;
  if (pat < 0.5) {
  } else if (pat < 1.5) {                     // wood grain: fine wavering ink lines along u
    float g = uv.y * 1.5 + 0.09 * sin(uv.x * 0.9 + floor(uv.y * 1.5) * 1.7) + 0.03 * sin(uv.x * 3.1);
    k = aa(abs(fract(g) - 0.5) / (fw.y * 1.5), 0.75) * smoothstep(2.5, 6., 1. / (fw.y * 1.5)) * 0.6;
  } else if (pat < 2.5) {                     // page block: fine lines stacked in v
    k = aa(abs(fract(uv.y * 3.) - 0.5) / (fw.y * 3.), 0.7) * smoothstep(2.5, 6., 1. / (fw.y * 3.)) * 0.55;
  } else if (pat < 3.5) {                     // stripes along u
    float d = (0.25 - abs(fract(uv.x) - 0.5)) / fw.x;
    col = mix(base, sec, mix(0.5, smoothstep(-0.6, 0.6, d), smoothstep(2., 5., 1. / fw.x)));
  } else if (pat < 4.5) {                     // tortoise-shell hexagons
    vec2 r = vec2(1., 1.7320508), hh = r * 0.5;
    vec2 a = mod(uv, r) - hh, b = mod(uv - hh, r) - hh;
    vec2 g = abs(dot(a, a) < dot(b, b) ? a : b);
    float e = 0.5 - max(g.x, dot(g, vec2(0.5, 0.8660254)));
    col = mix(base, sec, aa(e / fl, max(1., 0.045 / fl)) * smoothstep(3., 7., 1. / fl));
  } else if (pat < 5.5) {                     // coins: overlapping circles
    vec2 p1 = fract(uv) - 0.5, p2 = fract(uv + 0.5) - 0.5;
    float e = min(abs(length(p1) - 0.5), abs(length(p2) - 0.5));
    col = mix(base, sec, aa(e / fl, max(0.9, 0.04 / fl)) * smoothstep(3., 7., 1. / fl));
  } else if (pat < 6.5) {                     // sprinkled cloud motif
    vec2 c = floor(uv), p = fract(uv) - 0.5; float h = h21(c);
    p -= (vec2(h21(c + 7.3), h21(c + 3.1)) - 0.5) * 0.3;
    if (h > 0.42) {
      float d = length(p - vec2(0., 0.02)) - 0.17;
      d = min(d, length(p - vec2(-0.17, -0.03)) - 0.11);
      d = min(d, length(p - vec2(0.16, -0.04)) - 0.12);
      d = max(d, -(p.y + 0.09));
      d = min(d, max(abs(p.y + 0.105) - 0.02, abs(p.x - 0.1) - 0.27));
      vec3 sc2 = ic == 8 && h > 0.7 ? uPal[12] : sec;         // on the shelf backs some clouds take the second motif pigment
      col = mix(base, sc2, (1. - smoothstep(-0.6, 0.6, d / fl)) * smoothstep(1.5, 4., 0.3 / fl));
    }
  } else if (pat < 7.5 || (pat > 12.5 && pat < 13.5)) {   // inset band of the second pigment along the face (7 across q.y, 13 across q.x)
    float qq = pat < 7.5 ? vQ.y : vQ.x, fqq = pat < 7.5 ? fq.y : fq.x;
    float d = (0.2 - abs(qq - 0.5)) / fqq;
    col = mix(base, sec, smoothstep(-0.6, 0.6, d));
    k = aa(abs(d), 0.6) * 0.8;
  } else if (pat < 8.5) {                     // leopard rosettes
    vec2 c = floor(uv), p = fract(uv) - 0.5; float h = h21(c);
    p -= (vec2(h21(c + 1.7), h21(c + 9.2)) - 0.5) * 0.3;
    float r = length(p), an = atan(p.y, abs(p.x) < 1e-5 ? 1e-5 : p.x), rr = 0.2 + 0.09 * h;
    float d = max(abs(r - rr) - 0.06, -(sin(an * 3. + h * 20.) + 0.5) * 0.1);
    col = mix(col, sec, 1. - smoothstep(-0.6, 0.6, (r - rr + 0.06) / fl));
    col = mix(col, ink, 1. - smoothstep(-0.6, 0.6, d / fl));
  } else if (pat < 11.5) {                    // blank title slip
    vec2 d2 = (vec2(0.3, 0.13) - abs(vQ - 0.5)) / fq; float d = min(d2.x, d2.y);
    col = mix(base, sec, smoothstep(-0.6, 0.6, d));
    k = aa(abs(d), 0.7);
  } else if (pat < 12.5) {                    // hanging scroll: cloth borders, bands, a painted disc
    float sb = min(uv.x, 1. - uv.x), band = fract(uv.y / 5.);
    if (sb < 0.13) col = sec;
    else if (band < 0.1) col = uPal[4];
    else if (band > 0.5 && band < 0.58) col = uPal[3];
    else if (length(vec2(uv.x - 0.5, (band - 0.3) * 5. * 0.3)) < 0.19) col = uPal[6];
    k = aa(abs(sb - 0.13) / fw.x, 0.6);
  } else if (pat > 24.5 && pat < 25.5) {      // cut fruit: skin of the base pigment, white pith, flesh of the second, ink seeds
    if (dS2 < 0.) discard;
    float r = length(uv);
    col = r > 0.84 ? base : (r > 0.74 ? uPal[5] : sec);
    float sa = atan(uv.y, abs(uv.x) < 1e-5 ? 1e-5 : uv.x) * 1.9099, sr = r * 4.;
    vec2 sp = vec2(fract(sa) - 0.5, (fract(sr) - 0.5) * 0.45);
    float seed = (0.16 - length(sp)) * step(r, 0.68) * step(0.2, r) * step(0.5, h21(floor(vec2(sa, sr)) + 3.));
    k = max(max(aa(dS2px, uInk), aa(abs(r - 0.74) / fl, 0.7)), smoothstep(0., 0.06, seed));
  } else if (pat > 25.5 && pat < 26.5) {      // grid: ink lines on the integer uv lines (the go board)
    vec2 g2 = abs(fract(uv + 0.5) - 0.5) / fw;
    k = aa(min(g2.x, g2.y), 0.8) * smoothstep(2., 5., 1. / fl);
  } else if (pat > 26.5 && pat < 27.5) {      // peacock eye: disc of rings, base / second / indigo / ink heart
    if (dS2 < 0.) discard;
    float r = length(uv * vec2(1., 0.8) + vec2(0., 0.1));
    col = r > 0.62 ? base : (r > 0.42 ? sec : (r > 0.2 ? uPal[2] : ink));
    k = aa(dS2px, uInk);
  } else if (pat > 27.5 && pat < 28.5) {      // ring: a rim of the base pigment round a field of the second
    if (dS2 < 0.) discard;
    float r = length(uv);
    col = r > 0.8 ? base : sec;
    k = max(aa(dS2px, uInk), aa(abs(r - 0.8) / fl, 0.7));
  } else if (pat > 28.5 && pat < 29.5) {      // hoop: only a rim of the base pigment, nothing inside
    float r = length(uv);
    if (dS2 < 0. || r < 0.8) discard;
  } else if (pat < 21.5 && pat > 20.5) {      // leaf: two flat tones, ink midrib
    if (dS < 0.) discard;
    col = uv.x < 0. ? base : mix(base, ink, 0.26);
    k = max(aa(dSpx, uInk), aa(abs(uv.x) / fw.x, 0.7) * step(t, 0.9));
  } else if (pat < 22.5 && pat > 21.5) {      // disc with a centre
    if (dS < 0.) discard;
    float r = length(uv);
    col = r < 0.45 ? sec : base;
    k = max(aa(dSpx, uInk), aa(abs(r - 0.45) / fl, 0.7));
  } else {                                    // petals (20 stepped, 23 edged with the second pigment, 24 lotus)
    if (dS < 0.) discard;
    float st = t < 0.3 ? 0.42 : (t < 0.58 ? 0.2 : 0.);
    col = pat > 22.5 && pat < 23.5 ? (dS < 0.16 ? sec : base) : mix(base, sec, st);
    k = max(aa(dSpx, uInk), aa(vxpx, 0.6) * step(0.06, t) * step(t, 0.74) * 0.7);
  }
  // even ink line along every face edge, and the silhouette of round things
  vec2 e2 = min(vQ, 1. - vQ) / fq;
  float lw = min(uInk, min(1. / fq.x, 1. / fq.y) * 0.25);
  k = max(k, aa(min(e2.x, e2.y), lw));
  k = max(k, aa(vNdv / fn, uInk * 1.3) * step(vNdv, 0.9995));
  col *= 0.985 + 0.03 * h21(floor(uv * vec2(2.5, 31.)));      // paper tooth, within 3 %
  gl_FragColor = vec4(mix(col, ink, clamp(k, 0., 1.)), 1.);
  #include <fog_fragment>
}`;

// bare mulberry paper at infinity: long pale fibres and a few darker flecks, fixed in world direction
const PAPER_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const PAPER_FRAG = /* glsl */`
uniform vec3 uPaper; uniform vec3 uInkC;
varying vec3 vDir;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float fibres(vec2 p, float ang, float n) {
  float c = cos(ang), s = sin(ang); p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) * n;
  vec2 cell = floor(p * vec2(0.12, 1.)); float h = h21(cell);
  float y = fract(p.y) - 0.5 + 0.25 * sin(p.x * 0.35 + h * 6.28);
  float x = fract(p.x * 0.12) - 0.5;
  return step(0.72, h) * (1. - smoothstep(0.02, 0.07, abs(y))) * (1. - smoothstep(0.3, 0.45, abs(x)));
}
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 ad = abs(d);
  vec2 p = ad.z > max(ad.x, ad.y) ? d.xy / ad.z : (ad.x > ad.y ? d.zy / ad.x : d.xz / ad.y);
  float f = fibres(p, 0.4, 26.) + fibres(p + 3.7, 1.9, 34.) + fibres(p - 1.3, 2.7, 22.);
  vec2 fc = floor(p * 70.), ff = fract(p * 70.) - 0.5;
  float fleck = step(0.975, h21(fc)) * (1. - smoothstep(0.12, 0.3, length(ff - (vec2(h21(fc + 2.1), h21(fc + 5.3)) - 0.5) * 0.4)));
  vec3 col = uPaper * (1. + 0.07 * min(f, 1.)) ;
  col = mix(col, mix(uPaper, uInkC, 0.3), fleck * 0.7);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- the piece
const MID_B = 1.3;                    // shelf units: the board half way up each side cell
const HALL_TOP = 9.2;
const CORN_B = 4.17;                  // shelf units: top of the cornice ledge over the window (about 30 m up at its front edge)                 // shelf units: top of the hall's side walls (the hall is the open top shelf)
const CORN_D = 22;                    // depth of the cornice ledge (the cat lies at its front edge)
const RARE_X = 54;                    // rare visit: the hall's back wall ends this far right of the axis; beyond it the wall is part of the hinging leaf
const uOfZ = (z) => -z / 690;         // path progress at which the camera is at depth z (straight axis, 690 m)
// Screen wall i (1..8) starts to fold at WALL_OPEN[i] and takes WALL_DUR[i]. The first four ripple open behind the
// rising curtain so that the first clear view is the table against open doorways. WALL_WIDE is how far each folds
// (radians at the hinge; 1.1593 leaves 0.6 of the aisle clear): walls 2..4 fold flatter than the first, so that from
// the curtain the four openings stand one inside the other at nearly one apparent size instead of shrinking away.
const WALL_OPEN = [0, -0.016, -0.012, -0.008, -0.004, 0.07, 0.13, 0.22, 0.46];
const WALL_DUR = [0.03, 0.024, 0.026, 0.028, 0.032, 0.03, 0.03, 0.035, 0.04];
const WALL_WIDE = [1.1593, 1.25, 1.45, 1.5, 1.5, 1.1593, 1.1593, 1.1593, 1.1593];
const wallOpenAt = (i) => WALL_OPEN[i];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = hex.slice(0, 7).map((h) => new THREE.Color(h));
  // per-seed look (every draw is made even when an option overrides it, so the layout below stays the same)
  const pBacks = rng.pick(['indigo', 'indigo', 'indigo', 'vermilion', 'ink']);
  const pFlower = rng.pick(['peony', 'peony', 'lotus', 'chrysanthemum', 'plum']);
  const pCat = rng.pick(['striped', 'striped', 'spotted']);
  const pCurtain = rng.pick(['leopard', 'leopard', 'tiger']);
  const backs = opts.backs || pBacks, flower = opts.flower || pFlower, catKind = opts.cat || pCat;
  const rare = opts.rare ?? !!(ctx.vary && ctx.vary.rare);
  const curtainKind = opts.curtain === false ? 'none' : typeof opts.curtain === 'string' ? opts.curtain : catKind === 'spotted' ? 'leopard' : pCurtain;
  const colors = pal.map((c) => c.clone());
  colors[BACK] = pal[backs === 'vermilion' ? VER : backs === 'ink' ? INK : IND].clone();
  colors[MOTIF] = pal[OCH].clone();
  colors[FLOWER] = pal[flower === 'chrysanthemum' ? OCH : WHT].clone();
  colors[FLOWER2] = pal[flower === 'chrysanthemum' ? WHT : VER].clone();
  colors[FUR] = pal[OCH].clone();
  colors[MOTIF2] = pal[backs === 'ink' ? WHT : OCH].clone();         // the night screen is black lacquer sprinkled with gold and pearl: ochre clouds and white ones

  const U = {
    uPal: { value: colors }, uInk: { value: 1.7 * (opts.inkScale ?? 1) }, uTime: { value: 0 }, uU: { value: 0 },
    uHinge: { value: new Float32Array(10) }, uAng: { value: new Float32Array(8) },
  };
  const mkMat = (anim) => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, fog: !!opts.fog,
    defines: anim ? { ANIM: 1 } : {}, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
  });
  const matS = mkMat(false), matM = mkMat(true);
  const S = makeBatch(false), M = makeBatch(true);
  const object = new THREE.Group(); object.name = 'scholars-shelves';

  const facing = (bt, a0, a1, b0, b1, z, k, em = 15) => quad(bt, hp(a0, b0, z), hp(a1, b0, z), hp(a1, b1, z), hp(a0, b1, z), a0 * k, b0 * k, a1 * k, b1 * k, em);
  const wallQ = (bt, a, b0, b1, z0, z1, k, em = 0) => { const dn = (z0 - z1) / hornS(z0); quad(bt, hp(a, b0, z0), hp(a, b0, z1), hp(a, b1, z1), hp(a, b1, z0), 0, b0 * k, dn * k, b1 * k, em); };
  const floorQ = (bt, a0, a1, b, z0, z1, k, em = 0) => { const dn = (z0 - z1) / hornS(z0); quad(bt, hp(a0, b, z0), hp(a0, b, z1), hp(a1, b, z1), hp(a1, b, z0), 0, a0 * k, dn * k, a1 * k, em); };
  const setP = (bt, a, b, c) => { bt.P[0] = a; bt.P[1] = b; bt.P[2] = c; };
  const setA = (bt, a, b, c, d) => { bt.A[0] = a; bt.A[1] = b; bt.A[2] = c; bt.A[3] = d; };
  const setB = (bt, a, b, c, d) => { bt.B[0] = a; bt.B[1] = b; bt.B[2] = c; bt.B[3] = d; };
  const still = (bt) => { setA(bt, 0, 0, 0, 0); setB(bt, 0, 0, 0, 0); };
  const kB = backs === 'ink' ? 0.46 : 0.3;                            // cloud motif repeat on the shelf backs
  const FB = [TAN, VER, P_BAND], FBX = [TAN, VER, P_BANDX], GR = [TAN, INK, P_GRAIN], OS = [OCH, INK, P_FLAT], TF = [TAN, INK, P_FLAT];

  // ---- the stepped horn: nine compartments, each larger than the last
  for (let i = 0; i < 9; i++) {
    const z0 = FRONT_Z[i], z1 = FRONT_Z[i + 1], D = z0 - z1, hall = i === 8, top = hall ? HALL_TOP : CEIL_B;
    const fd = i === 0 ? 1.4 : 0.05 * (FRONT_Z[i - 1] - z0);         // the frame stands this far proud of the compartment's front
    setP(S, TAN, INK, P_GRAIN);
    floorQ(S, -CELL_A, -AISLE_A, FLOOR_B, z0, z1, 0.55, 8); floorQ(S, -AISLE_A, -9.9, FLOOR_B, z0, z1, 0.55, 4); floorQ(S, 9.9, AISLE_A, FLOOR_B, z0, z1, 0.55, 8); floorQ(S, AISLE_A, CELL_A, FLOOR_B, z0, z1, 0.55, 4);
    setP(S, MAL, INK, P_FLAT); floorQ(S, -9.9, -9, FLOOR_B, z0, z1, 1, 12); floorQ(S, 9, 9.9, FLOOR_B, z0, z1, 1, 12);
    setP(S, TAN, OCH, P_HEX); floorQ(S, -9, 9, FLOOR_B, z0, z1, 0.3, 0);          // the runner: a woven mat down the aisle
    setP(S, TAN, INK, P_GRAIN);
    if (!hall) { floorQ(S, -CELL_A, -AISLE_A, CEIL_B, z0, z1, 0.55, 8); floorQ(S, -AISLE_A, AISLE_A, CEIL_B, z0, z1, 0.55, 12); floorQ(S, AISLE_A, CELL_A, CEIL_B, z0, z1, 0.55, 4); }
    wallQ(S, -CELL_A - 0.3, FLOOR_B, top, z0, z1, 0.55, 15);          // the outside of the case: plain boards
    if (!hall) wallQ(S, CELL_A + 0.3, FLOOR_B, top, z0, z1, 0.55, 15);
    setP(S, BACK, MOTIF, P_CLOUD);
    wallQ(S, -CELL_A, FLOOR_B, top, z0, z1, kB);
    if (!hall) {
      wallQ(S, CELL_A, FLOOR_B, top, z0, z1, kB);
      const zp = z1 + 0.5 * 0.05 * D;                                 // cell partitions: an indigo back facing us in every cell
      facing(S, -CELL_A, -AISLE_A, FLOOR_B, CEIL_B, zp, kB, 15); facing(S, AISLE_A, CELL_A, FLOOR_B, CEIL_B, zp, kB, 15);
    } else {                                                          // the hall's right wall is one leaf of the screen: it can hinge (rare event)
      setP(M, BACK, MOTIF, P_CLOUD); setA(M, 7, 1, -1, 0); setB(M, CELL_A * hornS(z0), 0, z0, 1);
      wallQ(M, CELL_A, FLOOR_B, top, z0, z1, kB, 15);
      setP(M, TAN, INK, P_GRAIN); wallQ(M, CELL_A + 0.3, FLOOR_B, top, z0, z1, 0.55, 15);
      if (rare) {                                                     // the leaf reads as one tall panel: a banded head rail and sill along its whole length
        setP(M, TAN, VER, P_BAND);
        const band = (b0, b1) => quad(M, hp(CELL_A - 0.12, b0, z0), hp(CELL_A - 0.12, b0, z1), hp(CELL_A - 0.12, b1, z1), hp(CELL_A - 0.12, b1, z0), 0, 0, 1, 1, 15);
        band(top - 1.1, top); band(FLOOR_B, FLOOR_B + 0.9);
      }
      still(M);
    }
    // frame of the opening: lintel, sill, posts (tan boards with a vermilion edge band)
    const zq = z0 + fd;
    prism(S, -CELL_A, CELL_A, CEIL_B - 0.8, CEIL_B, zq, z0, { faces: { front: FB, bottom: GR }, k: 0.55 });
    prism(S, -CELL_A, CELL_A, FLOOR_B, FLOOR_B + 0.4, zq, z0, { faces: { front: FB, top: TF } });
    for (const sd of [-1, 1]) {
      const pa = sd * AISLE_A, po = sd * (CELL_A - 0.45);
      prism(S, pa - 0.7, pa + 0.7, FLOOR_B + 0.4, CEIL_B - 0.8, zq, z0, { faces: { front: FBX, left: OS, right: OS } });
      prism(S, po - 0.45, po + 0.45, FLOOR_B + 0.4, CEIL_B - 0.8, zq, z0, { faces: { front: FBX, left: OS, right: OS } });
      // uprights inside the compartment, between aisle and cell
      const nUp = hall ? 3 : 1;
      for (let j = 1; j <= nUp; j++) {
        if (rare && hall && sd > 0 && j === 3) continue;              // the rare visit keeps the sight line to the opening leaf clear
        const zm = z0 - (j / (nUp + 1)) * D;
        prism(S, pa - 0.6, pa + 0.6, FLOOR_B, top, zm, zm - 0.045 * D, { faces: { front: FBX, left: OS, right: OS, top: hall ? TF : null } });
      }
    }
    if (i !== 7) {                                                    // a shelf board half way up each side cell
      for (const sd of [-1, 1]) prism(S, sd > 0 ? AISLE_A + 0.7 : -CELL_A + 0.9, sd > 0 ? CELL_A - 0.9 : -AISLE_A - 0.7, MID_B, MID_B + 0.45, z0 - 0.03 * D, rare && hall && sd > 0 ? z0 - 0.42 * D : z1 + 0.05 * D, { faces: { front: FB, top: TF, bottom: GR, back: rare && hall && sd > 0 ? FB : null }, k: 0.55 });
    }
    if (hall) {                                                       // rail along the top of the hall's side walls
      for (const sd of [-1, 1]) prism(S, sd * AISLE_A - 0.6, sd * AISLE_A + 0.6, HALL_TOP, HALL_TOP + 0.5, z0, rare && sd > 0 ? z0 - 0.55 * D : z1, { faces: { front: FB, left: FB, right: FB, top: TF, bottom: GR, back: rare && sd > 0 ? FB : null }, k: 0.55 });
    }
    if ((i & 1) === 1) await ctx.yield();
  }

  // ---- what the screen walls show. Every panel of a chaekgeori is itself a painting of shelves: each panel here carries
  // three small ledges with things on them (books, a moon jar of peacock feathers, fruit, a clock, seals, a go board,
  // an incense burner, spectacles, a gourd, coral) or things that hang (a scroll), a different arrangement on every wall.
  // They are made of the panel's own folding quads (kind 1), so they fold aside with the wall and stand before the red.
  const mr = miniRng('panels:' + ctx.seed), pick = (arr) => arr[Math.min(arr.length - 1, (mr() * arr.length) | 0)];
  const night = backs === 'ink', ACC = backs === 'vermilion' ? IND : VER, DK = backs === 'vermilion' ? IND : MAL, LINE = night ? OCH : INK;
  let PC = null;                                                      // the panel being painted: { fold, i, k, s, zw, pw, y0 } or a fixed wall { a0, dir, s, zw, pw, y0 }
  const pv = (X, Y, zo, u, v, qx, qy) => {
    if (PC.fold) { setA(M, 1, PC.i, PC.k, X / 5); return vtx(M, [0, PC.y0 + Y * PC.s, PC.zw + zo * PC.pw], u, v, 1, qx, qy); }
    return vtx(S, [(PC.a0 + PC.dir * X) * PC.s, PC.y0 + Y * PC.s, PC.zw + zo * PC.pw], u, v, 1, qx, qy);
  };
  const pIdx = (n) => (PC.fold ? M : S).idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  // an upright rectangle on the panel: X 0..5 across, Y in shelf units above the panel's foot, zo in panel widths toward the viewer
  const pRect = (X0, X1, Y0, Y1, zo, base, sec, pat, ku = 1, em = 15) => {
    setP(PC.fold ? M : S, base, sec, pat);
    const scr = pat === P_SCROLL, u0 = scr ? 0 : X0 * ku, u1 = scr ? 1 : X1 * ku;
    const qa = em & 1 ? 0 : 0.5, qb = em & 2 ? 1 : 0.5, qc = em & 4 ? 0 : 0.5, qd = em & 8 ? 1 : 0.5;
    const n = pv(X0, Y0, zo, u0, Y0 * ku, qa, qc); pv(X1, Y0, zo, u1, Y0 * ku, qb, qc); pv(X1, Y1, zo, u1, Y1 * ku, qb, qd); pv(X0, Y1, zo, u0, Y1 * ku, qa, qd);
    pIdx(n);
  };
  // a cut-out (uv -1..1, shape cut in the shader), centre, half-sizes, turned by rot; em 1 gives a plain rectangle its ink edge
  const pCard = (cx, cy, hw, hh, rot, zo, base, sec, pat, em = 0) => {
    setP(PC.fold ? M : S, base, sec, pat);
    const c = Math.cos(rot), sn = Math.sin(rot), qa = em ? 0 : 0.5, qb = em ? 1 : 0.5;
    const n = pv(cx - c * hw + sn * hh, cy - sn * hw - c * hh, zo, -1, -1, qa, qa); pv(cx + c * hw + sn * hh, cy + sn * hw - c * hh, zo, 1, -1, qb, qa);
    pv(cx + c * hw - sn * hh, cy + sn * hw + c * hh, zo, 1, 1, qb, qb); pv(cx - c * hw - sn * hh, cy - sn * hw + c * hh, zo, -1, 1, qa, qb);
    pIdx(n);
  };
  // a ledge standing out of the panel (wider at the wall than at its lip, by the law of this space) with a banded lip
  const pLedge = (Y, X0 = 0.55, X1 = 4.45) => {
    setP(PC.fold ? M : S, OCH, INK, P_FLAT);
    const n = pv(X0 - 0.2, Y, 0.065, 0, 0, 0, 0); pv(X1 + 0.2, Y, 0.065, 1, 0, 1, 0); pv(X1, Y - 0.12, 0.21, 1, 1, 1, 1); pv(X0, Y - 0.12, 0.21, 0, 1, 0, 1);
    pIdx(n);
    pRect(X0, X1, Y - 0.5, Y - 0.1, 0.21, TAN, ACC, P_BAND);
  };
  const Z1 = 0.12, Z2 = 0.14, Z3 = 0.16;
  const SHORT = [
    (b) => {                                                         // books lying in a pile, a cup on top
      let y = b; const n = 2 + ((mr() * 3) | 0);
      for (let j = 0; j < n; j++) {
        const w = 1.75 - 0.13 * j + mr() * 0.15, c = 2.5 + (mr() - 0.5) * 0.3, cv = pick([MAL, OCH, WHT, TAN, ACC]), h = 0.72 + mr() * 0.25;
        if (j % 2) pRect(c - w, c + w, y, y + h, Z1, WHT, INK, P_PAGES, 1.3); else pRect(c - w, c + w, y, y + h, Z1, cv, cv === WHT ? TAN : WHT, P_SLIP);
        y += h;
      }
      pCard(2.5, y + 0.42, 0.5, 0.42, 0, Z2, WHT, DK, P_RING);
    },
    (b) => {                                                         // a dish of fruit: pomegranate, melon, a peach, a citron
      const c = 2.5; pRect(c - 0.5, c + 0.5, b, b + 0.4, Z1, DK, INK, 0); pRect(c - 1.75, c + 1.75, b + 0.4, b + 0.85, Z1, WHT, DK, P_BAND);
      pCard(c - 0.9, b + 1.65, 0.85, 0.85, 0.3, Z2, VER, WHT, P_FRUIT);
      if (mr() < 0.5) pCard(c + 0.85, b + 1.7, 0.9, 0.9, -0.4, Z2 + 0.004, MAL, VER, P_FRUIT); else pCard(c + 0.85, b + 1.75, 0.8, 0.95, 0, Z2 + 0.004, WHT, VER, P_PETALEDGE);
      pCard(c, b + 2.75, 0.72, 0.72, 0, Z3, OCH, TAN, P_DISC); pCard(c + 0.95, b + 3.05, 0.28, 0.6, -0.9, Z3 + 0.004, MAL, INK, P_LEAF);
    },
    (b) => {                                                         // inkstone, ink stick, water dropper, a brush laid across
      pRect(0.9, 3.3, b, b + 0.85, Z1, MAL, WHT, P_COIN, 1.6); pCard(2.1, b + 1.02, 0.95, 0.3, 0, Z2, INK, IND, P_DISC);
      pRect(3.55, 4.0, b, b + 2.5, Z1, night ? IND : INK, OCH, P_BAND);
      pCard(1.25, b + 1.75, 0.5, 0.5, 0, Z2, WHT, ACC, P_DISC);
      pCard(2.3, b + 2.75, 0.1, 1.25, 1.25, Z3, TAN, ACC, P_BAND, 1); pCard(0.92, b + 2.3, 0.2, 0.42, 1.25, Z3, WHT, INK, P_LOTUS);
    },
    (b) => {                                                         // round spectacles on an open book
      pRect(0.8, 4.2, b, b + 0.45, Z1, DK, INK, 0); pRect(0.95, 2.45, b + 0.45, b + 1.25, Z1, WHT, INK, P_PAGES, 1.4); pRect(2.55, 4.05, b + 0.45, b + 1.25, Z1, WHT, INK, P_PAGES, 1.4);
      pCard(1.72, b + 2.2, 0.74, 0.74, 0, Z2, LINE, TAN, P_RING); pCard(3.28, b + 2.2, 0.74, 0.74, 0, Z2, LINE, TAN, P_RING);
      pRect(2.4, 2.6, b + 2.14, b + 2.3, Z2, LINE, LINE, 0, 1, 0);
    },
    (b) => {                                                         // seals of stone on vermilion paste, each with a knob
      const hs = [2.3, 3.1, 1.7], cs = [WHT, MAL, OCH];
      for (let j = 0; j < 3; j++) {
        const x = 0.95 + j * 1.1;
        pRect(x, x + 0.85, b, b + 0.32, Z1, ACC, INK, 0); pRect(x, x + 0.85, b + 0.32, b + hs[j], Z1, cs[j], cs[j] === WHT ? DK : WHT, j === 1 ? P_COIN : P_FLAT, 2.2);
        pCard(x + 0.42, b + hs[j] + 0.3, 0.32, 0.32, 0, Z2, cs[(j + 1) % 3], INK, P_DISC);
      }
    },
    (b) => {                                                         // a go board seen from above, as this painting sees everything, with its stones
      const ku = 2.34;
      pRect(1.0, 4.0, b, b + 0.5, Z1, TAN, INK, P_GRAIN, 1); pRect(1.0, 4.0, b + 0.5, b + 3.4, Z1, OCH, INK, P_GRID, ku);
      const m0 = Math.ceil((b + 0.75) * ku), m1 = Math.floor((b + 3.2) * ku);
      for (let j = 0; j < 9; j++) { const gx = 3 + ((mr() * 7) | 0), gy = m0 + ((mr() * (m1 - m0 + 1)) | 0), c = j % 2 ? WHT : INK; pCard(gx / ku, gy / ku, 0.19, 0.19, 0, Z2 + j * 0.001, c, c, P_DISC); }
    },
    (b) => {                                                         // a gourd bottle on a cord, a cup beside it
      const c = 2.2, col = pick([OCH, MAL, WHT]);
      pCard(c, b + 1.15, 1.2, 1.15, 0, Z1, col, col, P_DISC); pCard(c, b + 2.72, 0.76, 0.72, 0, Z2, col, col, P_DISC);
      pRect(c - 0.16, c + 0.16, b + 3.32, b + 3.8, Z1, DK, INK, 0); pRect(c - 0.8, c + 0.8, b + 2.0, b + 2.22, Z3, ACC, INK, 0);
      pCard(c + 0.95, b + 1.45, 0.22, 0.62, Math.PI, Z3, ACC, OCH, P_LEAF);
      pRect(3.6, 4.3, b, b + 0.75, Z1, WHT, DK, P_BAND);
    },
    (b) => {                                                         // an incense burner on two feet, its smoke in three puffs
      const c = 2.5; pRect(c - 1.0, c - 0.68, b, b + 0.7, Z1, OCH, INK, 0); pRect(c + 0.68, c + 1.0, b, b + 0.7, Z1, OCH, INK, 0);
      pCard(c, b + 1.5, 1.5, 1.0, 0, Z2, OCH, DK, P_RING); pRect(c - 0.9, c + 0.9, b + 2.3, b + 2.6, Z1, DK, INK, 0); pCard(c, b + 2.85, 0.3, 0.3, 0, Z2, ACC, ACC, P_DISC);
      for (let j = 0; j < 3; j++) pCard(c + (j % 2 ? 0.4 : -0.25), b + 3.4 + j * 0.42, 0.24 + j * 0.09, 0.2 + j * 0.07, 0, Z3 + j * 0.002, WHT, WHT, P_DISC);
    },
  ];
  const TALL = [
    (b) => {                                                         // a moon jar holding peacock feathers
      const c = 2.5; pRect(c - 0.75, c + 0.75, b, b + 0.3, Z1, DK, INK, 0); pCard(c, b + 1.55, 1.45, 1.3, 0, Z2, WHT, pick([DK, OCH, ACC]), P_DISC); pRect(c - 0.5, c + 0.5, b + 2.75, b + 3.15, Z1, WHT, DK, P_BAND);
      for (let j = -1; j <= 1; j++) {
        const an = j * 0.42 + (mr() - 0.5) * 0.1, L = 1.7 + mr() * 0.6, sx = Math.sin(an), cy = Math.cos(an);
        pCard(c + sx * L * 0.5, b + 3.15 + cy * L * 0.5, 0.05, L * 0.5, -an, Z2, OCH, OCH, 0);
        pCard(c + sx * (L + 0.45), b + 3.15 + cy * (L + 0.45), 0.5, 0.62, -an, Z3 + j * 0.002, MAL, OCH, P_EYE);
      }
    },
    (b) => {                                                         // a pendulum clock with a dial of dots
      const c = 2.5; pRect(c - 1.5, c + 1.5, b, b + 0.5, Z1, TAN, ACC, P_BAND); pRect(c - 1.2, c + 1.2, b + 0.5, b + 2.6, Z1, OCH, INK, P_HEX, 2.2); pRect(c - 0.7, c + 0.7, b + 0.8, b + 2.3, Z2, WHT, INK, 0);
      pRect(c - 0.05, c + 0.05, b + 1.3, b + 2.3, Z3, OCH, OCH, 0, 1, 0); pCard(c, b + 1.25, 0.3, 0.3, 0, Z3, OCH, ACC, P_DISC);
      pRect(c - 1.4, c + 1.4, b + 2.6, b + 5.0, Z1, MAL, WHT, P_COIN, 2.2); pCard(c, b + 3.8, 1.05, 1.05, 0, Z2, WHT, WHT, P_DISC);
      for (let j = 0; j < 8; j++) { const an = (j / 8) * TAU; pCard(c + Math.sin(an) * 0.78, b + 3.8 + Math.cos(an) * 0.78, 0.08, 0.08, 0, Z3, INK, INK, 0); }
      pCard(c + 0.17, b + 3.97, 0.045, 0.3, -0.75, Z3 + 0.002, INK, INK, 0); pCard(c - 0.2, b + 3.6, 0.045, 0.3, -0.75, Z3 + 0.002, INK, INK, 0);
      pRect(c - 0.9, c + 0.9, b + 5.0, b + 5.4, Z1, ACC, INK, 0);
    },
    (b) => {                                                         // a brush rack: four brushes hang by their loops, tips down
      pRect(0.9, 4.1, b, b + 0.4, Z1, DK, INK, 0); pRect(1.0, 1.25, b + 0.4, b + 5.2, Z1, OCH, INK, 0); pRect(3.75, 4.0, b + 0.4, b + 5.2, Z1, OCH, INK, 0); pRect(0.75, 4.25, b + 5.0, b + 5.4, Z2, TAN, ACC, P_BAND);
      for (let j = 0; j < 4; j++) {
        const x = 1.6 + j * 0.6, L = 2.2 + mr() * 1.2, sh = pick([TAN, MAL, WHT, OCH]);
        pRect(x - 0.11, x + 0.11, b + 5.0 - L, b + 5.0, Z1, sh, ACC, P_BAND); pCard(x, b + 5.0 - L - 0.45, 0.2, 0.5, Math.PI, Z2, WHT, INK, P_LOTUS);
      }
    },
    (b) => {                                                         // a round fan on a stand, a tassel at its grip
      const c = 2.5; pRect(c - 0.9, c + 0.9, b, b + 0.45, Z1, DK, INK, 0); pRect(c - 0.12, c + 0.12, b + 0.45, b + 2.4, Z1, OCH, INK, 0);
      pCard(c, b + 3.8, 1.75, 1.6, 0, Z2, pick([OCH, MAL, TAN]), WHT, P_RING); pCard(c, b + 3.8, 0.55, 0.55, 0, Z3, ACC, OCH, P_DISC); pCard(c + 0.3, b + 1.75, 0.2, 0.55, Math.PI, Z3, ACC, OCH, P_LEAF);
    },
    (b) => {                                                         // a branch of coral in a pot
      const c = 2.5; pRect(c - 0.7, c + 0.7, b, b + 0.35, Z1, DK, INK, 0); pRect(c - 1.2, c + 1.2, b + 0.35, b + 1.9, Z1, WHT, DK, P_HEX, 2.4); pRect(c - 1.35, c + 1.35, b + 1.9, b + 2.2, Z2, DK, INK, 0);
      const br = (x, y, an, L, w, d) => {
        pCard(x + Math.sin(an) * L * 0.5, y + Math.cos(an) * L * 0.5, w, L * 0.5 + w * 0.5, -an, Z2 + d * 0.003, ACC, ACC, 0);
        if (d >= 3) return;
        const tx = x + Math.sin(an) * L, ty = y + Math.cos(an) * L;
        br(tx, ty, an - 0.45 - mr() * 0.2, L * 0.68, w * 0.78, d + 1); br(tx, ty, an + 0.4 + mr() * 0.2, L * 0.62, w * 0.78, d + 1);
      };
      br(c, b + 2.1, -0.05, 1.35, 0.15, 0);
    },
  ];
  const pScroll = (b, top) => {                                      // a hanging scroll, banded, with tasselled roller: it hangs from the rail above and needs no ledge
    const c = 2.5, w = 1.25, L = Math.min(5.4, top - b - 1.4), y1 = top - 0.15, cloth = pick([MAL, OCH, DK, TAN]);
    pRect(c - w - 0.2, c + w + 0.2, y1 - 0.3, y1, Z2, OCH, INK, 0); pRect(c - w, c + w, y1 - 0.3 - L, y1 - 0.3, Z1, WHT, cloth, P_SCROLL, 1.7);
    pRect(c - w - 0.25, c + w + 0.25, y1 - 0.62 - L, y1 - 0.3 - L, Z2, OCH, INK, 0);
    for (const e of [-1, 1]) pCard(c + e * (w + 0.12), y1 - 1.15 - L, 0.2, 0.55, Math.PI, Z3, ACC, OCH, P_LEAF);
  };
  // the three fields of a panel: [ledge height, top of the field] in shelf units above the panel's foot
  const FIELDS = [[2.05, 7.75], [9.35, 16.3], [17.75, 22.0]];
  let deckS = [], deckT = [];
  const draw = (deck, n) => { if (!deck.length) { for (let j = 0; j < n; j++) deck.push(j); for (let j = n - 1; j > 0; j--) { const q = (mr() * (j + 1)) | 0, t = deck[j]; deck[j] = deck[q]; deck[q] = t; } } return deck.pop(); };
  const paintPanel = () => {
    for (let f = 0; f < 3; f++) {
      const b = FIELDS[f][0], top = FIELDS[f][1], r = mr();
      if (f < 2 && r < 0.2) { pScroll(b, top); continue; }
      pLedge(b);
      if (f === 2 || r > 0.72) SHORT[draw(deckS, SHORT.length)](b); else TALL[draw(deckT, TALL.length)](b);
    }
  };
  // ---- folding-screen walls at fronts 1..8: six panels, three hinge to each side (uHinge[i] 0 closed .. 1 open)
  for (let i = 1; i < 9; i++) {
    const zw = FRONT_Z[i] - 0.4, s = hornS(zw), pw = (2 * AISLE_A * s) / 6, pu = pw / s;
    const y0 = (FLOOR_B + 0.4) * s, y1 = (CEIL_B - 0.8) * s, hu = (y1 - y0) / s;
    const panel = (side, k, sA, sB, vA, vB, zoff, em) => {
      const ya = y0 + (y1 - y0) * vA, yb = y0 + (y1 - y0) * vB, uk = kB;
      const put = (sv, y, qx, qy) => { setA(M, 1, i, k, sv); vtx(M, [0, y, zw + zoff], (k + sv) * pu * uk + i * 3.3, ((y - y0) / s) * uk, 1, qx, qy); };
      const n = M.n; put(sA, ya, 0, 0); put(sB, ya, 1, 0); put(sB, yb, 1, 1); put(sA, yb, 0, 1);
      M.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    };
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
      setB(M, side * pw, side * AISLE_A * s, WALL_WIDE[i], 0);
      setP(M, TAN, VER, P_FLAT); panel(side, k, 0, 1, 0, 1, 0);
      const inx = 0.1, iny = (0.1 * pu) / hu;
      setP(M, BACK, MOTIF, P_CLOUD); panel(side, k, inx, 1 - inx, iny * 2.2, 1 - iny * 1.2, 0.04 * pw);
      setP(M, backs === 'vermilion' ? IND : VER, OCH, P_FLAT); panel(side, k, inx, 1 - inx, iny * 0.7, iny * 1.6, 0.04 * pw);
      setP(M, TAN, VER, P_FLAT); panel(side, k, inx, 1 - inx, 0.345, 0.37, 0.06 * pw); panel(side, k, inx, 1 - inx, 0.72, 0.745, 0.06 * pw);
      PC = { fold: true, i, k, s, zw, pw, y0 }; paintPanel();
    }
    still(M);
    await ctx.yield();
  }
  await ctx.yield();

  // ---- the same painted ledges, fixed: two on the far partition of every side cell (above its shelf board), a row under
  // the round window and one either side of it, so that no shelf back or wall stands as a plain field of its pigment
  const paintFixed = (xc, yBase, z, sc, pwz, tall) => {
    PC = { fold: false, a0: xc / sc - 2.5, dir: 1, s: sc, zw: z, pw: pwz, y0: yBase - 0.6 * sc };
    pLedge(0.6); (tall ? TALL[draw(deckT, TALL.length)] : SHORT[draw(deckS, SHORT.length)])(0.6);
  };
  for (let i = 0; i < 8; i++) {
    const D = FRONT_Z[i] - FRONT_Z[i + 1], zp = FRONT_Z[i + 1] + 0.025 * D, sh = hornS(zp);
    for (const sd of [-1, 1]) for (const a of [18.9, 26.1]) paintFixed(sd * a * sh, 2.7 * sh, zp + 0.01 * D, sh * 1.42, 2.2 * sh, mr() < 0.75);
  }
  {
    const zW = FRONT_Z[9] + 0.5;
    for (const x of [-34, 0, 34]) paintFixed(x, -61, zW, 4.8, 5, true);
    for (const x of [-70, 70]) if (!(rare && x > 0)) paintFixed(x, -30, zW, 4.8, 5, true);
  }
  await ctx.yield();

  // ---- a pair of jade rings with vermilion tassels hangs from every lintel and swings
  for (let i = 0; i < 9; i++) {
    const fd = i === 0 ? 1.4 : 0.05 * (FRONT_Z[i - 1] - FRONT_Z[i]), z = FRONT_Z[i] + fd * 0.5, s = hornS(z), yT = (CEIL_B - 0.8) * s;
    for (const sd of [-1, 1]) {
      const x = sd * 7.5 * s, ph = rng.range(0, TAU);
      setA(M, 4, ph, 1.1, 0.16); setB(M, x, yT, z, 2);
      setP(M, VER, INK, P_FLAT); rawQuad(M, [x - 0.07 * s, yT - 1.5 * s, z], [x + 0.07 * s, yT - 1.5 * s, z], [x + 0.07 * s, yT, z], [x - 0.07 * s, yT, z], [0, 0], [1, 0], [1, 1], [0, 1], 3);
      card(M, [x, yT - 2.0 * s, z + 0.02 * s], [0.62 * s, 0, 0], [0, 0.62 * s, 0], MAL, i % 2 ? WHT : OCH, P_DISC);
      card(M, [x, yT - 3.7 * s, z + 0.04 * s], [0.5 * s, 0, 0], [0, -1.15 * s, 0], VER, OCH, P_LEAF);
    }
  }
  still(M);

  // ---- slipcases stacked in the side cells; they slide out toward the aisle like organ stops as the camera nears
  const covers = [MAL, OCH, WHT, TAN, MAL, OCH, WHT, backs === 'indigo' ? VER : IND, VER];
  const caseStack = (bt, i, side, zc0, zc1, rows, a0, a1, hC, slideP, bBase = FLOOR_B) => {
    const s = hornS(zc0), D = FRONT_Z[i] - FRONT_Z[i + 1];
    for (let r = 0; r < rows; r++) {
      const b0 = bBase + r * hC, b1 = b0 + hC * 0.93;
      const cov = rng.pick(covers), topP = rng.pick([OCH, MAL, TAN, WHT].filter((c) => c !== cov));
      const pat = rng.pick([P_FLAT, P_HEX, P_COIN, P_STRIPE, P_SLIP, P_SLIP, P_PAGES]);
      const front = pat === P_PAGES ? [WHT, INK, P_PAGES] : pat === P_SLIP ? [cov, cov === WHT ? TAN : WHT, P_SLIP] : [cov, cov === WHT || cov === TAN ? MAL : rng.pick([WHT, INK, OCH]), pat];
      const end = rng.chance(0.65) ? [WHT, INK, P_PAGES] : [cov === WHT ? MAL : cov, WHT, P_SLIP];
      const jit = rng.range(-0.5, 0.5), slides = rng.chance(slideP) && !(i === 1 && side > 0), dist = rng.range(3, 7.5) * (i === 2 || i === 7 ? 1 : 0.68) * s, lead = rng.range(0.55, 1.25), dur = rng.range(0.012, 0.026);
      if (slides) setA(bt, 2, uOfZ(zc0) - (lead * D) / 690, dur, -side * dist); else setA(bt, 0, 0, 0, 0);
      const lo = side > 0 ? a0 + jit : -a1 + jit, hi = side > 0 ? a1 + jit : -a0 + jit;
      prism(bt, lo, hi, b0, b1, zc0, zc1, { k: 0.8, uo: r * 1.37, faces: { front, left: side > 0 ? end : null, right: side < 0 ? end : null, top: [topP, INK, P_FLAT], bottom: [topP, INK, P_FLAT] } });
    }
    setA(bt, 0, 0, 0, 0);
  };
  // small things for the upper tier: bottle, fruit bowl, orchid pot (flat-banded lathes and cut-outs)
  const ornament = (bt, a, b, z, kind) => {
    const s = hornS(z), x = a * s, y = b * s, c1 = rng.pick([WHT, MAL, OCH, WHT]), c2 = rng.pick([IND, VER, MAL, OCH].filter((c) => c !== c1 && !(c === IND && backs === 'indigo')));
    const R = (rows) => rows.map((q) => [q[0] * s, y + q[1] * s, q[2], q[3] ?? INK, q[4] ?? 0, q[5] ?? 6, q[6] ?? 3]).concat([[0.01, y + rows[rows.length - 1][1] * s - 0.05 * s]]);
    still(bt);
    if (kind === 0) {
      lathe(bt, x, z, R([[1.0, 0, c2, INK, 0, 6, 1], [1.5, 0.4, c1, INK, 0, 6, 1], [2.3, 2.2, c1, c2, P_CLOUD, 7, 3], [2.25, 3.5, c1, INK, 0, 6, 0], [0.95, 5.3, c2, INK, 0, 6, 3], [0.7, 5.9, c1, INK, 0, 6, 0], [0.75, 7.0, c2, INK, 0, 6, 3], [1.15, 7.5, INK]]), 20);
    } else if (kind === 1) {
      lathe(bt, x, z, R([[1.3, 0, c2, INK, 0, 6, 1], [1.5, 0.5, c1, c2, P_COIN, 14, 3], [3.3, 2.6, c2, INK, 0, 6, 3], [3.4, 3.0, INK]]), 20);
      for (let j = 0; j < 4; j++) {
        const fx = x + (j - 1.5) * 1.5 * s, fy = y + (3.6 + (j % 2) * 1.5 + (j === 1 ? 0.6 : 0)) * s, fr = (1.25 + 0.2 * (j % 2)) * s;
        card(bt, [fx, fy, z + (0.3 + j * 0.12) * s], [fr, 0, 0], [0, fr, 0], j % 2 ? OCH : VER, j % 2 ? VER : OCH, P_DISC);
      }
    } else {
      lathe(bt, x, z, R([[1.5, 0, c1, INK, 0, 6, 1], [2.6, 1.3, c1, c2, P_HEX, 18, 3], [2.7, 2.6, c2, INK, 0, 6, 3], [1.9, 3.3, c1, INK, 0, 6, 0], [2.1, 3.8, INK]]), 20);
      for (let j = 0; j < 7; j++) {                                    // orchid leaves that sway
        const la = (j - 3) * 0.3 + rng.range(-0.08, 0.08), L = rng.range(3.4, 5.2) * s, ph = rng.range(0, TAU);
        const dx = Math.sin(la), dy = Math.cos(la);
        setA(bt, 6, ph, 0.9, 1); setB(bt, 0.35 * s * dy, -0.35 * s * dx, 0, 0);
        card(bt, [x + dx * L, y + 3.6 * s + dy * L, z + j * 0.06 * s], [dy * L * 0.3, -dx * L * 0.3, 0], [dx * L, dy * L, 0], MAL, INK, P_LEAF);
      }
      still(bt);
    }
  };
  for (let i = 0; i < 9; i++) {
    const z0 = FRONT_Z[i], D = z0 - FRONT_Z[i + 1], cols = i === 7 ? 4 : i === 8 ? 5 : 2;
    for (const side of [-1, 1]) for (let c = 0; c < cols; c++) {
      if (rare && i === 8 && side > 0 && c >= 2) continue;              // the rare visit keeps the far right of the hall clear for the hinging leaf
      const zc0 = z0 - D * (0.1 + (c / cols) * 0.86), zc1 = zc0 - (D * 0.86 * 0.8) / cols;
      if (i === 7) { caseStack(M, i, side, zc0, zc1, 10, 17.2, 28.2, 2.15, 0.75); continue; }
      caseStack(M, i, side, zc0, zc1, rng.int(2, 5), 17.2, 28.2, 2.0, i === 2 ? 0.75 : 0.4);
      const up = rng.int(0, 5), zo = zc0 - (zc0 - zc1) * 0.5;
      if (up <= 1) caseStack(M, i, side, zc0 - (zc0 - zc1) * 0.12, zc1 + (zc0 - zc1) * 0.12, rng.int(2, i === 8 ? 3 : 5), 18.6, 26.4, 1.6, i === 2 ? 0.7 : 0.3, MID_B + 0.45);
      else if (up <= 4) ornament(M, side * rng.range(20.5, 24.5), MID_B + 0.45, zo, up - 2);
    }
    if ((i & 1) === 1) await ctx.yield();
  }
  await ctx.yield();

  // ---- hanging scrolls on the uprights: they drop from their rollers and unroll (progress), tassels swing (time)
  const scrollAt = (zs, side, wU, lenU, cloth) => {
    const s = hornS(zs), x = side * AISLE_A * s, w = wU * s * 0.5, yT = (CEIL_B - 1.7) * s, len = lenU * s, z = zs + 0.012 * 690 * 0.02 * s;
    const delay = uOfZ(zs) - (2.5 * AISLE_A * s) / 690, dur = (1.5 * AISLE_A * s) / 690, ph = rng.range(0, TAU), n = 16;
    setP(M, OCH, INK, P_FLAT); still(M);                                             // top rod (fixed)
    rawQuad(M, [x - w * 1.12, yT, z], [x + w * 1.12, yT, z], [x + w * 1.12, yT + 0.45 * s, z], [x - w * 1.12, yT + 0.45 * s, z], [0, 0], [1, 0], [1, 1], [0, 1], 15);
    setP(M, WHT, cloth, P_SCROLL);
    for (let j = 0; j < n; j++) {
      const v0 = j / n, v1 = (j + 1) / n;
      const pre = (c) => { const v = c < 2 ? v1 : v0; setA(M, 3, delay, dur, v); setB(M, len, ph, 0.1 * s * v, 0); };
      rawQuad(M, [x - w, yT, z], [x + w, yT, z], [x + w, yT, z], [x - w, yT, z], [0, v1 * lenU], [1, v1 * lenU], [1, v0 * lenU], [0, v0 * lenU], 3, pre);
    }
    setA(M, 3, delay, dur, 1); setB(M, len, ph, 0.1 * s, 0);                         // the roller rides the free end
    setP(M, OCH, INK, P_FLAT);
    rawQuad(M, [x - w * 1.08, yT - 0.32 * s, z + 0.05 * s], [x + w * 1.08, yT - 0.32 * s, z + 0.05 * s], [x + w * 1.08, yT + 0.32 * s, z + 0.05 * s], [x - w * 1.08, yT + 0.32 * s, z + 0.05 * s], [0, 0], [1, 0], [1, 1], [0, 1], 15);
    for (const e of [-1, 1]) {
      const kx = x + e * w * 1.2;
      setP(M, VER, INK, P_FLAT); setB(M, len, ph, 0.1 * s, 0);
      rawQuad(M, [kx - 0.22 * s, yT - 0.42 * s, z + 0.08 * s], [kx + 0.22 * s, yT - 0.42 * s, z + 0.08 * s], [kx + 0.22 * s, yT + 0.42 * s, z + 0.08 * s], [kx - 0.22 * s, yT + 0.42 * s, z + 0.08 * s], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      setB(M, len, ph + e, 0.45 * s, 0);                                             // tassel
      card(M, [kx, yT - 1.7 * s, z + 0.1 * s], [0.42 * s, 0, 0], [0, -1.35 * s, 0], VER, OCH, P_LEAF);
    }
    still(M);
  };
  const scrollFronts = [4, 5, 6, rng.pick([2, 3, 7])];
  for (const i of scrollFronts) {
    const fd = 0.05 * (FRONT_Z[i - 1] - FRONT_Z[i]), cloth = rng.pick([MAL, OCH, IND]);
    for (const side of [-1, 1]) scrollAt(FRONT_Z[i] + fd, side, 3.6, rng.range(14.5, 17), cloth);
  }
  await ctx.yield();

  // ---- the curtain at z -32: a pelt with a vermilion border, lifted from the middle into a swag (uAng[2])
  if (curtainKind !== 'none') {
    const cw = 34, ch = 28, yT = 15.5, z = -32, nx = 40, ny = 30, tiger = curtainKind === 'tiger';
    setB(M, ch, 0, 0, 0);
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
      const x0 = -cw / 2 + (ix / nx) * cw, x1 = -cw / 2 + ((ix + 1) / nx) * cw, v0 = iy / ny, v1 = (iy + 1) / ny;
      const hem = iy === ny - 1, border = ix < 2 || ix >= nx - 2 || iy >= ny - 3 || iy < 1;
      setP(M, hem ? IND : border ? VER : FUR, tiger ? INK : WHT, hem || border ? P_FLAT : tiger ? P_STRIPE : P_ROSETTE);
      const pre = (j, c) => setA(M, 8, c[0] / (cw / 2), j < 2 ? v1 : v0, 0);
      const tu = (x, v) => (tiger ? [(v * ch) / 2.4 + 0.22 * Math.sin(x * 0.55 + v * 9), x / 2.4] : [x / 2.5, (v * ch) / 2.5]);
      rawQuad(M, [x0, yT, z], [x1, yT, z], [x1, yT, z], [x0, yT, z], tu(x0, v1), tu(x1, v1), tu(x1, v0), tu(x0, v0), (ix === 0 ? 1 : 0) | (ix === nx - 1 ? 2 : 0) | (hem ? 4 : 0) | (iy === ny - 3 || iy === 1 ? (border && iy === ny - 3 ? 8 : 0) : 0), pre);
    }
    still(M); setP(M, OCH, INK, P_FLAT);                              // the rod, the cord and its tassels
    rawQuad(M, [-cw / 2 - 1.2, yT - 0.1, z + 0.2], [cw / 2 + 1.2, yT - 0.1, z + 0.2], [cw / 2 + 1.2, yT + 0.7, z + 0.2], [-cw / 2 - 1.2, yT + 0.7, z + 0.2], [0, 0], [1, 0], [1, 1], [0, 1], 15);
    for (const sd of [-1, 1]) {
      setA(M, 4, sd, 1.2, 0.22); setB(M, sd * 13.5, yT, z + 0.4, 2);
      setP(M, VER, INK, P_FLAT); rawQuad(M, [sd * 13.5 - 0.14, yT - 4.2, z + 0.4], [sd * 13.5 + 0.14, yT - 4.2, z + 0.4], [sd * 13.5 + 0.14, yT, z + 0.4], [sd * 13.5 - 0.14, yT, z + 0.4], [0, 0], [1, 0], [1, 1], [0, 1], 3);
      card(M, [sd * 13.5, yT - 5.6, z + 0.45], [0.75, 0, 0], [0, -1.6, 0], VER, OCH, P_LEAF);
    }
    still(M);
  }

  // ---- compartment 1: the long vermilion table whose edges spread apart, the brush pot, the inkstone
  // The table stands back from the curtain (near end 18 m behind it) so that it is seen whole, from 15 m and more,
  // while the hem is still rising: 6.4 m wide at our end, 26 m at the far end, 30 m long, running through the first
  // screen wall. Its edges spread on screen until the camera is within 9 m of the near end.
  const VF = [backs === 'vermilion' ? IND : VER, INK, P_FLAT];
  const TZ0 = -50, TZ1 = -80, TW0 = 3.2, TW1 = 13, ta = TW0 / hornS(TZ0), tf = TW1 / (ta * hornS(TZ1)), TB = -7.5;   // a low writing table: the lower it stands, the more of its top the eye gets
  const EDG = [OCH, backs === 'vermilion' ? IND : VER, P_COIN];
  prism(S, -ta, ta, TB - 0.75, TB, TZ0, TZ1, { f: tf, ay: 1, k: 2, faces: { front: [TAN, VF[0], P_BAND], top: VF, left: EDG, right: EDG, bottom: OS } });
  prism(S, -ta * 0.86, ta * 0.86, TB - 0.1, TB + 0.03, TZ0 - 0.5, TZ1 + 0.5, { f: tf, ay: 1, faces: { top: [OCH, INK, P_FLAT] } });
  prism(S, -ta * 0.78, ta * 0.78, TB - 0.1, TB + 0.06, TZ0 - 0.9, TZ1 + 0.9, { f: tf, ay: 1, faces: { top: VF } });
  for (const [t, dl] of [[0.03, 1.4], [0.5, 1.6], [0.93, 2.0]]) {
    const zl = TZ0 + (TZ1 - TZ0) * t, hw = ((TW0 + (TW1 - TW0) * t) / hornS(zl)) * 0.86;
    for (const sd of [-1, 1]) prism(S, sd * hw - 0.28, sd * hw + 0.28, FLOOR_B, TB - 0.75, zl, zl - dl, { f: 1.15, faces: { front: OS, left: [MAL, INK, P_FLAT], right: [MAL, INK, P_FLAT] } });
  }
  const inkZ = -54.6, inkB = TB + 0.65;                               // the inkstone, with a wet pool whose rings cross it
  prism(S, -1.3, 1.3, TB, inkB, inkZ, inkZ - 4.6, { f: 1.42, faces: { front: [MAL, WHT, P_COIN], left: [IND, INK, P_FLAT], right: [IND, INK, P_FLAT], top: [MAL, INK, P_FLAT] }, k: 1.4 });
  const pool = hp(0, inkB + 0.2, inkZ - 2.7);
  {
    still(M); card(M, [pool[0], pool[1] + 0.05, pool[2]], [1.6, 0, 0], [0, 0, -1.8], INK, IND, P_DISC);
    for (let j = 0; j < 3; j++) {                                    // rings widening across the pool, one after another
      setA(M, 13, j / 3, 0.42, 0); setB(M, pool[0], pool[1] + 0.09 + j * 0.02, pool[2], 0);
      card(M, [pool[0], pool[1] + 0.09 + j * 0.02, pool[2]], [1.45, 0, 0], [0, 0, -1.63], WHT, INK, P_HOOP);
    }
    still(M);
  }
  const pot = { x: 15.7, z: -72, y: FLOOR_B * hornS(-72), r: 4.7, h: 9.6 };
  {
    const { x, z, y, r } = pot, B = OCH, W = backs === 'indigo' ? WHT : TAN;
    still(M);
    lathe(M, x, z, [
      [r * 0.94, y, INK, INK, 0, 6, 0], [r * 0.97, y + 0.5, B, INK, 0, 6, 1], [r, y + 3.1, B, INK, 0, 6, 3], [r * 1.035, y + 3.3, B, INK, 0, 6, 3],
      [r, y + 3.5, B, INK, 0, 6, 1], [r, y + 5.4, W, IND, P_HEX, 22, 3], [r, y + 7.3, B, INK, 0, 6, 3], [r * 1.035, y + 7.5, B, INK, 0, 6, 3],
      [r, y + 7.7, B, INK, 0, 6, 1], [r * 1.02, y + 9.2, VER, INK, 0, 6, 3], [r * 0.97, y + 9.6, INK, INK, 0, 6, 0], [0.01, y + 9.3, INK, INK, 0, 6, 0],
    ], 28);
    const nb = 7;
    for (let j = 0; j < nb; j++) {                                   // brushes: flat painted shafts, tips that nod
      const t = (j + 0.5) / nb - 0.5, bx = x + t * r * 1.5, lean = t * 0.55 + rng.range(-0.06, 0.06), L = rng.range(11.5, 14.5), hw = rng.range(0.22, 0.32);
      const by = y + 8.9, zz = z + rng.range(-1.2, 1.2), tx = bx + Math.sin(lean) * L, ty = by + Math.cos(lean) * L, ph = rng.range(0, TAU);
      const px = Math.cos(lean) * hw, py = -Math.sin(lean) * hw, shaft = rng.pick([TAN, MAL, OCH, IND, WHT]);
      const pre = (c) => { setA(M, 6, ph, 1.1, c < 2 ? 0 : 1); setB(M, 0.5, 0, 0, 0); };
      setP(M, shaft, VER, P_BANDX);
      rawQuad(M, [bx - px, by - py, zz], [bx + px, by + py, zz], [tx + px, ty + py, zz], [tx - px, ty - py, zz], [0, 0], [1, 0], [1, 1], [0, 1], 15, pre);
      setA(M, 6, ph, 1.1, 1.15); setB(M, 0.5, 0, 0, 0);
      const tl = rng.range(1.5, 2.2);
      card(M, [tx + Math.sin(lean) * tl * 0.9, ty + Math.cos(lean) * tl * 0.9, zz + 0.05], [Math.cos(lean) * tl * 0.5, -Math.sin(lean) * tl * 0.5, 0], [Math.sin(lean) * tl, Math.cos(lean) * tl, 0], j % 3 === 0 ? INK : WHT, INK, P_LOTUS);
    }
    setA(M, 4, 1.3, 1.6, 0.35); setB(M, x - r * 0.5, y + 8.6, z + r * 0.9, 2);      // loop and tassel on the rim
    card(M, [x - r * 0.5, y + 6.9, z + r * 0.9], [0.5, 0, 0], [0, -1.7, 0], VER, OCH, P_LEAF);
    still(M);
  }
  await ctx.yield();

  // ---- the hall's back wall with the round window, its lattice, and the cornice
  const zB = FRONT_Z[9], sB = hornS(zB), winR = 22, eyeR = 8;
  {
    const X = CELL_A * sB, XR = rare ? RARE_X : X, Y0 = FLOOR_B * sB, Y1 = HALL_TOP * sB, angs = [];
    for (let j = 0; j < 48; j++) angs.push((j / 48) * TAU);
    for (const [cx, cy] of [[XR, Y1], [-X, Y1], [-X, Y0], [XR, Y0]]) angs.push((Math.atan2(cy, cx) + TAU) % TAU);
    angs.sort((p, q) => p - q);
    const edge = (an) => { const c = Math.cos(an), sn = Math.sin(an); const t = Math.min(c > 1e-6 ? XR / c : c < -1e-6 ? -X / c : 1e9, sn > 1e-6 ? Y1 / sn : sn < -1e-6 ? Y0 / sn : 1e9); return [c * t, sn * t, zB]; };
    const uvw = (p) => [(p[0] / sB) * kB, (p[1] / sB) * kB];
    setP(S, BACK, MOTIF, P_CLOUD);
    for (let j = 0; j < angs.length; j++) {
      const a0 = angs[j], a1 = j + 1 < angs.length ? angs[j + 1] : angs[0] + TAU;
      const i0 = [Math.cos(a0) * winR, Math.sin(a0) * winR, zB], i1 = [Math.cos(a1) * winR, Math.sin(a1) * winR, zB], o0 = edge(a0), o1 = edge(a1);
      rawQuad(S, i0, i1, o1, o0, uvw(i0), uvw(i1), uvw(o1), uvw(o0), 0);
      const bk = (q) => [q[0], q[1], zB - 0.8], uvb = (q) => [(q[1] / sB) * 0.55, (q[0] / sB) * 0.55];
      setP(S, TAN, INK, P_GRAIN); rawQuad(S, bk(i0), bk(i1), bk(o1), bk(o0), uvb(i0), uvb(i1), uvb(o1), uvb(o0), 0); setP(S, BACK, MOTIF, P_CLOUD);
    }
    const ring = (bt, r0, r1, z, em) => {
      for (let j = 0; j < 48; j++) {
        const a0 = (j / 48) * TAU, a1 = ((j + 1) / 48) * TAU;
        rawQuad(bt, [Math.cos(a0) * r0, Math.sin(a0) * r0, z], [Math.cos(a1) * r0, Math.sin(a1) * r0, z], [Math.cos(a1) * r1, Math.sin(a1) * r1, z], [Math.cos(a0) * r1, Math.sin(a0) * r1, z], [0, 0], [1, 0], [1, 1], [0, 1], em);
      }
    };
    setP(S, TAN, VER, P_BAND); ring(S, winR - 0.4, winR + 3.4, zB + 1.0, 12);
    setP(S, VER, OCH, P_FLAT); ring(S, eyeR, eyeR + 1.5, zB + 0.9, 12);
    const half = 0.6, lim = winR - 0.2, er = eyeR + 0.7;
    for (let j = -4; j <= 3; j++) {                                   // lattice: vermilion bars, verticals in front of horizontals
      const x = (j + 0.5) * 5.4, yo = Math.sqrt(lim * lim - x * x), yi = Math.abs(x) < er ? Math.sqrt(er * er - x * x) : 0;
      const segs = yi > 0 ? [[yi, yo], [-yo, -yi]] : [[-yo, yo]];
      for (const [p0, p1] of segs) {
        setP(S, VER, INK, P_FLAT);
        rawQuad(S, [x - half, p0, zB + 0.7], [x + half, p0, zB + 0.7], [x + half, p1, zB + 0.7], [x - half, p1, zB + 0.7], [0, 0], [1, 0], [1, 1], [0, 1], 3);
        rawQuad(S, [p0, x - half, zB + 0.4], [p0, x + half, zB + 0.4], [p1, x + half, zB + 0.4], [p1, x - half, zB + 0.4], [0, 0], [1, 0], [1, 1], [0, 1], 3);
      }
    }
    for (let j = -4; j <= 3; j++) for (let l = -4; l <= 3; l++) {     // ochre studs where the bars cross
      const x = (j + 0.5) * 5.4, y = (l + 0.5) * 5.4, r = Math.hypot(x, y);
      if (r > lim - 1.2 || r < er + 1.2) continue;
      card(S, [x, y, zB + 0.85], [0.95, 0, 0], [0, 0.95, 0], OCH, VER, P_DISC);
    }
    const cR = rare ? RARE_X / sB : CELL_A;
    prism(S, -CELL_A, cR, CORN_B - 0.87, CORN_B, zB + CORN_D, zB, { faces: { front: FB, bottom: GR, top: TF, right: rare ? FB : null }, k: 0.55 });
    // carved corbels under the ledge: three stepped tiers, patterned, the top one banded like the shelf boards
    const TIERS = [[0.74, 17, 0.5, FB, [TAN, VER, P_BAND], GR], [0.6, 12, 0.5, [OCH, INK, P_HEX], [MAL, WHT, P_COIN], OS], [0.46, 7, 0.5, [MAL, WHT, P_COIN], [OCH, MAL, P_HEX], [VER, INK, P_FLAT]]];
    for (const a of [-26, -19, -11.5, -5.6, 5.6, 11.5, 19, 26]) {
      if (a + 0.8 > cR) continue;
      let b = CORN_B - 0.87;
      for (const [hw, dp, h, fr, sd, bt] of TIERS) { prism(S, a - hw, a + hw, b - h, b, zB + dp, zB, { f: 1.0, k: 2.4, faces: { front: fr, left: sd, right: sd, bottom: bt } }); b -= h; }
    }
    if (rare) {
      setP(S, TAN, TAN, P_FLAT); ring(S, 7.6, 27, zB - 1.4, 0);       // paper behind the lattice, so that the window still shows plain paper and not the hall next door
      // the jamb the leaf closes against, and the leaf's return: the right of the back wall swings away with the right wall
      setP(S, TAN, VER, P_BANDX); rawQuad(S, [XR - 6, Y0, zB + 0.3], [XR, Y0, zB + 0.3], [XR, Y1, zB + 0.3], [XR - 6, Y1, zB + 0.3], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      setP(S, OCH, INK, P_FLAT); rawQuad(S, [XR, Y0, zB + 0.3], [XR, Y0, zB - 0.8], [XR, Y1, zB - 0.8], [XR, Y1, zB + 0.3], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      setA(M, 7, 1, -1, 0); setB(M, CELL_A * hornS(FRONT_Z[8]), 0, FRONT_Z[8], 1);
      const q0 = [XR + 0.4, Y0, zB], q1 = [X, Y0, zB], q2 = [X, Y1, zB], q3 = [XR + 0.4, Y1, zB], bk = (q) => [q[0], q[1], zB - 0.8];
      setP(M, BACK, MOTIF, P_CLOUD); rawQuad(M, q0, q1, q2, q3, uvw(q0), uvw(q1), uvw(q2), uvw(q3), 15);
      setP(M, TAN, INK, P_GRAIN); rawQuad(M, bk(q0), bk(q1), bk(q2), bk(q3), [0, 0], [12, 0], [12, 11], [0, 11], 15);
      setP(M, TAN, VER, P_BANDX); rawQuad(M, [XR + 0.4, Y0, zB + 0.3], [XR + 7, Y0, zB + 0.3], [XR + 7, Y1, zB + 0.3], [XR + 0.4, Y1, zB + 0.3], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      setP(M, OCH, INK, P_FLAT); rawQuad(M, [XR + 0.4, Y0, zB + 0.3], [XR + 0.4, Y0, zB - 0.8], [XR + 0.4, Y1, zB - 0.8], [XR + 0.4, Y1, zB + 0.3], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      setP(M, TAN, VER, P_BAND);                                      // head rail and sill carried round the return
      rawQuad(M, [XR + 7, Y1 - 1.1 * sB, zB + 0.35], [X, Y1 - 1.1 * sB, zB + 0.35], [X, Y1, zB + 0.35], [XR + 7, Y1, zB + 0.35], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      rawQuad(M, [XR + 7, Y0, zB + 0.35], [X, Y0, zB + 0.35], [X, Y0 + 0.9 * sB, zB + 0.35], [XR + 7, Y0 + 0.9 * sB, zB + 0.35], [0, 0], [1, 0], [1, 1], [0, 1], 15);
      still(M);
    }
  }
  await ctx.yield();

  // ---- book pagodas: stacked volumes sharing one flare, the top one open with its pages fanning
  const pagodaTops = [];
  const pagoda = (bt, btM, aC, zc, depth, n, wU, hU, f, hue) => {
    const z0 = zc + depth / 2, z1 = zc - depth / 2, s0 = hornS(z0), s1 = hornS(z1);
    const cov = [MAL, OCH, WHT, backs === 'indigo' ? VER : IND, TAN];
    let b = FLOOR_B;
    for (let v = 0; v < n - 1; v++) {
      const wide = v % 2 === 0, w = wU * (1 - 0.032 * v) * (wide ? 1 : 0.78), h = hU * (wide ? 1.12 : 0.84), ja = rng.range(-0.28, 0.28);
      const zz0 = wide ? z0 : z0 - depth * 0.06, zz1 = wide ? z1 : z1 + depth * 0.06;
      const c1 = cov[(hue + v) % cov.length], c2 = cov[(hue + v + 2) % cov.length];
      const front = wide ? [c1, c1 === WHT ? TAN : WHT, P_SLIP] : [WHT, INK, P_PAGES];
      const side = wide ? [c2, c2 === WHT || c2 === TAN ? MAL : WHT, rng.pick([P_HEX, P_COIN, P_STRIPE, P_FLAT])] : [c1 === WHT ? OCH : c1, INK, P_FLAT];
      prism(bt, aC + ja - w / 2, aC + ja + w / 2, b, b + h, zz0, zz1, { f, axAbs: aC, ayAbs: FLOOR_B, k: 0.9, uo: v * 2.3, faces: { front, left: side, right: side, top: [wide ? OCH : c2 === OCH ? MAL : c2, INK, P_FLAT] } });
      b += h;
    }
    const w = wU * 0.86, ox = bt.ox;
    prism(bt, aC - w * 0.56, aC + w * 0.56, b, b + 0.28, z0, z1, { f, axAbs: aC, ayAbs: FLOOR_B, faces: { front: [cov[hue % cov.length] === WHT ? MAL : cov[hue % cov.length], INK, P_FLAT], left: OS, right: OS, top: [WHT, INK, P_PAGES] } });
    const PF = [aC * s0 + ox, (b + 0.3) * s0, z0], PK = [aC * s1 + ox, (FLOOR_B + (b + 0.3 - FLOOR_B) * f) * s1, z1];
    const Lf = w * 0.52 * s0, Lb = w * 0.52 * f * s1, du = (depth / s0) * 0.5, ph0 = rng.range(0, TAU);
    setP(btM, WHT, INK, P_PAGES);
    for (const sd of [-1, 1]) for (let j = 0; j < 6; j++) {
      const th = 0.16 + j * 0.24, dx = sd * Math.cos(th), dy = Math.sin(th);
      const pre = (c) => { const P = c === 0 || c === 1 ? PF : PK; setA(btM, 4, ph0 + j * 0.55 + (sd > 0 ? 0 : 1.4), 0.8, 0.07 + 0.022 * j); setB(btM, P[0], P[1], P[2], 2); };
      const sox = btM.ox; btM.ox = 0;
      rawQuad(btM, PF, [PF[0] + dx * Lf, PF[1] + dy * Lf, z0], [PK[0] + dx * Lb, PK[1] + dy * Lb, z1], PK, [0, 0], [0, w * 0.4], [du, w * 0.4], [du, 0], 15, pre);
      btM.ox = sox;
    }
    still(btM);
    pagodaTops.push(new THREE.Vector3(aC * s0 + ox, (b + 0.3) * s0 + Lf * 0.7, zc + depth * 0.3));
    return (b - FLOOR_B) * s0;
  };
  {
    const leftFour = rng.chance(0.5), zs = [[-522, -578, -640, -676], [-506, -556, -622, -668]];
    let hue = rng.int(0, 4);
    for (let sd = 0; sd < 2; sd++) {
      const cnt = (sd === 0) === leftFour ? 4 : 3;
      for (let j = 0; j < cnt; j++) {
        if (rare && sd === 1 && j >= 2) continue;                      // the rare visit leaves the sight line to the hinging leaf open
        const zc = zs[sd][j] + rng.range(-5, 5), s = hornS(zc), x = (sd === 0 ? -1 : 1) * rng.range(54, 76), n = rng.int(9, 13);
        const total = rng.range(88, 122) / s, hU = total / ((n - 1) * 0.98);
        pagoda(S, M, x / s, zc, rng.range(26, 34), n, rng.range(4.6, 5.8), hU, 1.2, hue); hue += rng.int(1, 2);
      }
      await ctx.yield();
    }
  }

  // ---- the vase and its flowers
  const vase = { x: -24, z: -600, y: FLOOR_B * hornS(-600) };
  const flowerHeads = [];
  const FL = {
    peony: { heads: 9, R: [9, 12], rings: [[8, 1, 0.42, 0], [7, 0.72, 0.4, 0.5], [5, 0.45, 0.42, 1]], pat: P_PETAL, leaves: 3, stem: MAL, stemW: 0.8 },
    lotus: { heads: 7, R: [10, 13], rings: [[9, 1, 0.3, 0], [7, 0.74, 0.3, 0.5], [5, 0.48, 0.3, 1]], pat: P_LOTUS, leaves: 2, stem: MAL, stemW: 0.7 },
    chrysanthemum: { heads: 11, R: [8, 10.5], rings: [[13, 1, 0.26, 0], [11, 0.76, 0.26, 0.5], [8, 0.5, 0.27, 1]], pat: P_LOTUS, leaves: 3, stem: MAL, stemW: 0.7 },
    plum: { heads: 26, R: [3.2, 4.6], rings: [[5, 1, 0.55, 0]], pat: P_PETAL, leaves: 0, stem: INK, stemW: 1.1 },
  }[flower] || null;
  const buildVase = (bt, vx, vz, vy, sc, bandP) => {
    const r = (q) => q * sc, y = (q) => vy + q * sc;
    lathe(bt, vx, vz, [
      [r(7), y(0), IND, INK, 0, 6, 1], [r(8), y(2.5), WHT, INK, 0, 6, 1], [r(12.3), y(13), WHT, INK, 0, 6, 0], [r(13), y(19), WHT, bandP, P_CLOUD, 9, 3],
      [r(12.5), y(29), WHT, INK, 0, 6, 0], [r(9.4), y(40), WHT, INK, 0, 6, 0], [r(5.6), y(48), bandP, INK, 0, 6, 3], [r(5.3), y(51), WHT, INK, 0, 6, 0],
      [r(6.3), y(57.5), bandP, INK, 0, 6, 3], [r(7.6), y(61), INK, INK, 0, 6, 0], [r(6.6), y(62), INK, INK, 0, 6, 0], [0.01, y(60)],
    ], 32);
  };
  const buildFlowers = (bt, F, mx, my, mz, sc, sway, mir = 1) => {
    const clearOf = (x, y) => Math.hypot(x < 0 ? -x : x > 14 ? x - 14 : 0, y);
    for (let hI = 0; hI < F.heads; hI++) {
      let th = -1.3 + ((hI + rng.range(0.1, 0.9)) / F.heads) * 1.9, Lr = rng.range(36, 84) * sc;
      const R = rng.range(F.R[0], F.R[1]) * sc, hz = mz + rng.range(-16, 14) * sc;
      let hx = 0, hy = 0;
      for (let it = 0; it < 24; it++) { hx = mx + mir * Math.sin(th) * Lr; hy = my + Math.cos(th) * Lr * 0.95; if (!sway || clearOf(hx, hy) > R + 10) break; th -= 0.07; Lr = Math.min(Lr + 2, 92 * sc); }
      const ph = rng.range(0, TAU), sp = rng.range(0.45, 0.8), amp = sway ? rng.range(1.0, 2.0) * sc : 0, sdx = 0.92, sdy = 0.35;
      const swayV = (wt) => { if (sway) { setA(bt, 6, ph, sp, wt); setB(bt, sdx * amp, sdy * amp, 0, 0); } };
      // stem: a flat ribbon on a bezier from the mouth
      const cx = mx + (hx - mx) * 0.12, cy = my + (hy - my) * 0.7, cz = mz + (hz - mz) * 0.5, nS = 9, hw = F.stemW * sc * (F.heads > 20 ? 0.6 : 1);
      const bz = (t) => { const u = 1 - t; return [u * u * mx + 2 * u * t * cx + t * t * hx, u * u * my + 2 * u * t * cy + t * t * hy, u * u * mz + 2 * u * t * cz + t * t * hz]; };
      const nrm = (t) => { const p = bz(Math.max(0, t - 0.02)), q = bz(Math.min(1, t + 0.02)); const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
      setP(bt, F.stem, INK, P_FLAT);
      for (let j = 0; j < nS; j++) {
        const t0 = j / nS, t1 = (j + 1) / nS, p0 = bz(t0), p1 = bz(t1), n0 = nrm(t0), n1 = nrm(t1);
        const pre = (c) => swayV((c < 2 ? t0 : t1) ** 2);
        rawQuad(bt, [p0[0] - n0[0] * hw, p0[1] - n0[1] * hw, p0[2]], [p0[0] + n0[0] * hw, p0[1] + n0[1] * hw, p0[2]], [p1[0] + n1[0] * hw, p1[1] + n1[1] * hw, p1[2]], [p1[0] - n1[0] * hw, p1[1] - n1[1] * hw, p1[2]], [0, 0], [1, 0], [1, 1], [0, 1], 3, pre);
      }
      for (let l = 0; l < F.leaves; l++) {
        const t = 0.3 + (l / Math.max(1, F.leaves)) * 0.5 + rng.range(-0.05, 0.05), p = bz(t), n = nrm(t), sgn = l % 2 ? 1 : -1, ll = rng.range(5.5, 7.5) * sc, la = rng.range(0.3, 0.9);
        const dx = n[0] * sgn * Math.cos(la) - n[1] * Math.sin(la), dy = n[1] * sgn * Math.cos(la) + n[0] * Math.sin(la);
        const dl = Math.hypot(dx, dy) || 1, ex = dx / dl, ey = dy / dl;
        swayV(t * t);
        card(bt, [p[0] + ex * ll, p[1] + ey * ll, p[2] + 0.4 * sgn], [-ey * ll * 0.9, ex * ll * 0.9, 0], [ex * ll, ey * ll, 0], MAL, INK, P_LEAF);
      }
      // head: rings of flat petals round a centre, tilted to look down at the path
      const tau = Math.min(0.6, Math.max(0, hy / 110)), yaw = rng.range(-0.3, 0.3);
      const e1 = [Math.cos(yaw), 0, Math.sin(yaw)], e2 = [0, Math.cos(tau), Math.sin(tau)], nz = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      for (let l = 0; l < (F.pads || 0); l++) {                       // lotus pads: round malachite leaves on the stems
        const p = bz(0.42 + 0.2 * (hI % 2)), pr = 8.5 * sc, sg = hI % 2 ? 1 : -1;
        swayV(0.3); card(bt, [p[0] + sg * pr * 0.8, p[1], p[2] + 0.5 * sg], [pr, 0, 0], [0, pr * 0.72, 0], MAL, MAL, P_RING);
      }
      const kind = F.white ? 0 : hI % 3, base = F.white ? WHT : kind === 1 ? FLOWER2 : FLOWER, sec = F.white ? VER : kind === 1 ? WHT : FLOWER2, pat = kind === 2 && F.pat === P_PETAL ? P_PETALEDGE : F.pat;
      swayV(1);
      for (const [cnt, len, wid, lay] of F.rings) {
        const off = rng.range(0, TAU);
        for (let j = 0; j < cnt; j++) {
          const a = off + (j / cnt) * TAU + rng.range(-0.08, 0.08), ca = Math.cos(a), sa = Math.sin(a), L = R * len * 0.5 * rng.range(0.9, 1.08), W = R * wid * (0.75 + 0.25 * len);
          const d = [e1[0] * ca + e2[0] * sa, e1[1] * ca + e2[1] * sa, e1[2] * ca + e2[2] * sa], pp = [-e1[0] * sa + e2[0] * ca, -e1[1] * sa + e2[1] * ca, -e1[2] * sa + e2[2] * ca];
          const lz = lay * 0.5 * sc + j * 0.03 * sc;
          card(bt, [hx + d[0] * L + nz[0] * lz, hy + d[1] * L + nz[1] * lz, hz + d[2] * L + nz[2] * lz], [pp[0] * W, pp[1] * W, pp[2] * W], [d[0] * L, d[1] * L, d[2] * L], base, sec, pat);
        }
      }
      const cr = R * (F.rings.length > 1 ? 0.17 : 0.3), lz = 1.6 * sc;
      card(bt, [hx + nz[0] * lz, hy + nz[1] * lz, hz + nz[2] * lz], [e1[0] * cr, e1[1] * cr, e1[2] * cr], [e2[0] * cr, e2[1] * cr, e2[2] * cr], OCH, flower === 'lotus' ? MAL : VER, P_DISC);
      if (sway) flowerHeads.push({ position: new THREE.Vector3(hx, hy, hz), radius: R });
    }
    still(bt);
  };
  still(M);
  buildVase(M, vase.x, vase.z, vase.y, 1, IND);
  if (FL) buildFlowers(M, FL, vase.x, vase.y + 60, vase.z, 1, true);
  await ctx.yield();

  // ---- petals: sails in the hall, smaller up the enfilade, each the size its room demands (thinned by quality)
  {
    const plum = flower === 'plum', nPet = Math.round((plum ? 1300 : 300) * detail * (opts.petals ?? 1)), pS = plum ? 0.24 : 1;
    const pPat = FL ? (FL.pat === P_LOTUS ? P_LOTUS : P_PETAL) : P_PETAL;
    for (let i = 0; i < nPet; i++) {
      const inHall = rng.chance(0.55), r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng(), r6 = rng(), r7 = rng();
      let x, z, yTop, range, half, sp;
      if (inHall) {
        z = -675 + r1 * 175; const s = hornS(z); half = (6 + 3 * r2) * pS; const m = half * 1.15 + 7;
        x = r3 < 0.66 ? -95 + r4 * (95 - m) : 14 + m + r4 * (86 - m);
        yTop = 25 + 50 * r5; range = yTop - FLOOR_B * s * 0.98; sp = (0.5 + 0.4 * r6) * s;
      } else {
        z = -470 + r1 * 430; const s = hornS(z); half = (0.8 + 0.4 * r2) * s * pS; const m = half * 1.15 + 12, lim = AISLE_A * s * 0.92;
        x = (r3 < 0.5 ? -1 : 1) * (m + r4 * Math.max(0.5, lim - m));
        yTop = CEIL_B * s * 0.96; range = (CEIL_B - FLOOR_B) * s * 0.95; sp = (0.5 + 0.4 * r6) * s;
      }
      const w = half * 0.62, kind = i % 7;
      setP(M, kind === 2 || kind === 5 ? FLOWER2 : FLOWER, kind === 2 || kind === 5 ? WHT : FLOWER2, kind === 6 && pPat === P_PETAL ? P_PETALEDGE : pPat);
      setA(M, 5, r7, sp, (0.25 + 0.4 * r5) * (r2 < 0.5 ? -1 : 1)); setB(M, x, yTop, z, range);
      rawQuad(M, [-w, -half, 0], [w, -half, 0], [w, half, 0], [-w, half, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], 0);
      if ((i & 255) === 255) await ctx.yield();
    }
    still(M);
    const nFall = Math.round((plum ? 260 : 70) * detail);
    for (let i = 0; i < nFall; i++) {                                 // those that have landed lie on the boards
      const inHall = i % 3 !== 0, z = inHall ? rng.range(-682, -492) : rng.range(-470, -60), s = hornS(z), half = (inHall ? rng.range(6, 9) : rng.range(0.8, 1.2) * s) * pS;
      const lim = (inHall ? CELL_A - 4 : AISLE_A - 2) * s, x = rng.range(-lim, lim), ro = rng.range(0, TAU), ca = Math.cos(ro), sa = Math.sin(ro), w = half * 0.62;
      const P = (lx, lz) => { const px = x + ca * lx - sa * lz, pz = z + sa * lx + ca * lz; return [px, FLOOR_B * hornS(pz) + (0.1 + (i % 9) * 0.012) * s, pz]; };
      const kind = i % 7;
      setP(S, kind === 2 || kind === 5 ? FLOWER2 : FLOWER, kind === 2 || kind === 5 ? WHT : FLOWER2, kind === 6 && pPat === P_PETAL ? P_PETALEDGE : pPat);
      rawQuad(S, P(-w, -half), P(w, -half), P(w, half), P(-w, half), [-1, -1], [1, -1], [1, 1], [-1, 1], 0);
    }
  }

  // ---- the cat on the cornice: a painted cut-out (its own shader), and its hanging tail (a striped ribbon that swings)
  const corniceY = CORN_B * hornS(zB + CORN_D), catZ = zB + CORN_D + 0.7;
  const catU = { uPal: U.uPal, uInk: U.uInk, uTime: U.uTime, uCat: { value: new THREE.Vector4(0, 0, 0, catKind === 'spotted' ? 1 : 0) } };
  const catMat = new THREE.ShaderMaterial({ vertexShader: CAT_VERT, fragmentShader: CAT_FRAG, side: THREE.DoubleSide, fog: !!opts.fog, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...catU } });
  const catGeo = new THREE.BufferGeometry();
  {
    const x0 = -38, x1 = 34, y0 = -9, y1 = 28;
    catGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-x0, corniceY + y0, catZ, -x1, corniceY + y0, catZ, -x1, corniceY + y1, catZ, -x0, corniceY + y1, catZ]), 3));
    catGeo.setAttribute('aC', new THREE.BufferAttribute(new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]), 2));
    catGeo.setIndex([0, 1, 2, 0, 2, 3]);
  }
  const catMesh = new THREE.Mesh(catGeo, catMat); catMesh.frustumCulled = false; catMesh.matrixAutoUpdate = false;
  {
    const P0 = [-22, corniceY + 3.2], P1 = [-33.5, corniceY + 5], P2 = [-31.5, corniceY - 22], P3 = [-35, corniceY - 46], nT = 16, ph = rng.range(0, TAU);
    const bz = (t) => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1]]; };
    const nr = (t) => { const p = bz(Math.max(0, t - 0.02)), q = bz(Math.min(1, t + 0.02)), dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
    const wt = (t) => { const k = Math.max(0, t - 0.22) / 0.78; return k * k; };
    setP(M, FUR, catKind === 'spotted' ? WHT : INK, catKind === 'spotted' ? P_ROSETTE : P_STRIPE);
    for (let j = 0; j < nT; j++) {
      const t0 = j / nT, t1 = (j + 1) / nT, p0 = bz(t0), p1 = bz(t1), n0 = nr(t0), n1 = nr(t1), h0 = 1.7 + 0.9 * t0, h1 = 1.7 + 0.9 * t1;
      const pre = (c) => { setA(M, 6, ph, 0.9, wt(c === 0 || c === 1 ? t0 : t1)); setB(M, 6, 0, 0, 0); };
      rawQuad(M, [p0[0] - n0[0] * h0, p0[1] - n0[1] * h0, catZ + 0.3], [p0[0] + n0[0] * h0, p0[1] + n0[1] * h0, catZ + 0.3], [p1[0] + n1[0] * h1, p1[1] + n1[1] * h1, catZ + 0.3], [p1[0] - n1[0] * h1, p1[1] - n1[1] * h1, catZ + 0.3],
        [t0 * 11, 0], [t0 * 11, 1], [t1 * 11, 1], [t1 * 11, 0], 3, pre);
    }
    setA(M, 6, ph, 0.9, 1); setB(M, 6, 0, 0, 0);
    card(M, [P3[0], P3[1] - 0.6, catZ + 0.5], [3.0, 0, 0], [0, 3.0, 0], INK, INK, P_DISC);
    still(M);
  }
  await ctx.yield();

  // ---- rare event: the neighbouring leaf of the screen, a second hall with its own towers and a vase of lotus.
  // It stands behind the main hall's back wall, to the right of the window, parallel to it (the next leaf of a flat
  // screen) and a fifth larger, as the law of this space asks of anything further away. The hinging leaf (the hall's
  // right wall with its return, the right of the back wall beyond RARE_X) uncovers it.
  let rareS = null, rareM = null;
  const R2 = { k: 1.193, x: 250, z: -69.6 };                          // local -> world: scale, then shift (local z -520 lands on the back wall's line)
  if (rare) {
    const S2 = makeBatch(false), M2 = makeBatch(true), Y0 = FLOOR_B * sB, YF = FLOOR_B * hornS(-520), YT = 12.5 * sB, k = 0.3 / sB, X = 215;
    const G2 = backs === 'vermilion' ? IND : VER, B2 = backs === 'vermilion' ? VER : IND;
    setP(S2, G2, OCH, P_CLOUD);                                        // the neighbouring leaf is painted on another ground
    rawQuad(S2, [-X, Y0, zB], [X, Y0, zB], [X, YT, zB], [-X, YT, zB], [-X * k, Y0 * k], [X * k, Y0 * k], [X * k, YT * k], [-X * k, YT * k], 0);
    setP(S2, TAN, B2, P_BAND); rawQuad(S2, [-X, YT - 9, zB + 0.6], [X, YT - 9, zB + 0.6], [X, YT, zB + 0.6], [-X, YT, zB + 0.6], [0, 0], [1, 0], [1, 1], [0, 1], 15);
    setP(S2, TAN, B2, P_BAND); rawQuad(S2, [-X, Y0, zB + 0.6], [X, Y0, zB + 0.6], [X, Y0 + 7, zB + 0.6], [-X, Y0 + 7, zB + 0.6], [0, 0], [1, 0], [1, 1], [0, 1], 15);
    setP(S2, TAN, INK, P_GRAIN);
    rawQuad(S2, [-X, YF, -520], [-X, Y0, zB], [X, Y0, zB], [X, YF, -520], [0, -16], [13, -16], [13, 16], [0, 16], 3);
    setP(S2, TAN, OCH, P_HEX);
    rawQuad(S2, [-118, YF + 0.3, -520], [-118, Y0 + 0.3, zB], [-18, Y0 + 0.3, zB], [-18, YF + 0.3, -520], [0, -4.5], [6.5, -4.5], [6.5, -0.7], [0, -0.7], 15);
    let hue = rng.int(0, 4);
    for (const [ax, zc] of [[-16.8, -589], [0.24, -585], [4.52, -672.5]]) { pagoda(S2, M2, ax, zc, 26, rng.int(10, 12), rng.range(3.0, 3.5), rng.range(1.6, 1.9), 1.2, hue); hue += 2; }
    pagodaTops.length = Math.max(0, pagodaTops.length - 3);
    still(M2);
    const vx = -67.9, vz = -604, vy = FLOOR_B * hornS(vz);
    buildVase(M2, vx, vz, vy, 0.9, MAL);
    buildFlowers(M2, { heads: 6, R: [12, 15], rings: [[7, 1, 0.52, 0], [5, 0.66, 0.5, 0.5]], pat: P_PETALEDGE, white: true, pads: 1, leaves: 0, stem: MAL, stemW: 0.8 }, vx, vy + 54, vz, 0.9, false, -1);
    rareS = finishBatch(S2, matS); rareM = finishBatch(M2, matM);
    await ctx.yield();
  }

  const meshS = finishBatch(S, matS);
  await ctx.yield();
  const meshM = finishBatch(M, matM);
  object.add(meshS, meshM, catMesh);
  if (rareS) {
    const m4 = new THREE.Matrix4().makeTranslation(R2.x, 0, R2.z).multiply(new THREE.Matrix4().makeScale(R2.k, R2.k, R2.k));   // further, so larger: the law of this space
    for (const m of [rareS, rareM]) { m.matrix.copy(m4); object.add(m); }
  }
  let paper = null;
  if (opts.paper !== false) {
    paper = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({ vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.BackSide, depthWrite: false, uniforms: { uPaper: { value: colors[TAN] }, uInkC: { value: colors[INK] } } }));
    paper.renderOrder = -1; paper.frustumCulled = false; object.add(paper);
  }
  await ctx.yield();

  // ---- progress, update, anchors
  const _wp = new THREE.Vector3(), _sz = new THREE.Vector2();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const flyX = (z) => (z < -85 && z > -216 ? 5 * Math.sin(((z + 85) / 131) * TAU) : 0) + 14 * sm(-495, -545, z) * (1 - sm(-556, -604, z));
  const hingeSet = new Float32Array(10).fill(-1);
  let progress = -1, foldSet = -1, curtainSet = -1, catOn = false, lastU = 0;
  const catSet = { x: 0, y: 0 };
  const catHead = new THREE.Vector3(23, corniceY + 13.5, catZ);
  function update(dt, time, camera) {
    U.uTime.value = time;
    let u = progress;
    if (u < 0) { camera.getWorldPosition(_wp); object.worldToLocal(_wp); u = Math.min(1, Math.max(0, -_wp.z / 690)); }
    lastU = u; U.uU.value = u;
    const hg = U.uHinge.value;
    for (let i = 1; i < 9; i++) hg[i] = hingeSet[i] >= 0 ? hingeSet[i] : sm(WALL_OPEN[i], WALL_OPEN[i] + WALL_DUR[i], u);
    U.uAng.value[2] = curtainSet >= 0 ? curtainSet : 0.8 + 0.2 * sm(0.0, 0.04, u);   // already parted when first seen: it frames the room, then gathers overhead
    U.uAng.value[1] = foldSet >= 0 ? foldSet : rare ? 0.8 * sm(0.6, 0.84, u) : 0;
    const cu = catU.uCat.value;
    if (catOn) { cu.x += (catSet.x - cu.x) * Math.min(1, dt * 2.5); cu.y += (catSet.y - cu.y) * Math.min(1, dt * 2.5); }
    else { cu.x = 0.75 * Math.sin(time * 0.33) + 0.2 * Math.sin(time * 0.9 + 1); cu.y = 0.5 * Math.sin(time * 0.21 + 2); }
    const bl = (time * 0.23) % 1; cu.z = bl > 0.96 ? Math.sin(((bl - 0.96) / 0.04) * Math.PI) : 0;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_sz); U.uInk.value = Math.min(4.5, Math.max(1.5, (_sz.y / 420) * (opts.inkScale ?? 1))); }
  }

  const center = new THREE.Vector3(0, 20, -400);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    entry: V(0, 0, 0),
    portalSeat: { position: V(0, 0, zB), normal: V(0, 0, 1), radius: 7, eyeRadius: eyeR },
    flyThrough: [0, -36, -60, -85, -118, -150, -183, -216, -285, -371, -480, -503, -520, -537, -550, -566, -580, -592, -606, -632, -660, -690].map((z) => V(flyX(z), 0, z)),
    viewpoints: { statement: V(0, 0, -44), scrolls: V(0, 0, -186), hallReveal: V(0, 0, -380), linger: V(14, 0, -566), window: V(0, 0, -655) },
    curtainPlane: { position: V(0, 0, -32), width: 34, height: 28 },
    fronts: FRONT_Z.slice(), heights: FRONT_H.slice(),
    table: { near: V(0, TB * hornS(TZ0), TZ0), far: V(0, TB * hornS(TZ1), TZ1), halfNear: TW0, halfFar: TW1, b: TB },
    inkstone: V(0, inkB * hornS(inkZ - 1.2), inkZ - 1.2),
    brushPot: { position: V(pot.x, pot.y, pot.z), radius: pot.r, rimY: pot.y + pot.h },
    vase: { position: V(vase.x, vase.y, vase.z), mouth: V(vase.x, vase.y + 61, vase.z), radius: 13 },
    flowerHeads, pagodaTops,
    cornice: { y: corniceY, zFront: zB + CORN_D }, catHead,
    rare: { gaze: V(118, 55, -800), hinge: V(CELL_A * hornS(FRONT_Z[8]), 0, FRONT_Z[8]), jamb: V(RARE_X, 0, zB), vase: V(R2.x - 67.9 * R2.k, 0, R2.z - 604 * R2.k), from: 0.6, to: 0.84 }, catTailTip: V(-35, corniceY - 46, catZ),
    windowCentre: V(0, 0, zB),
  };
  const hero = {
    object, radius: 330, height: 190, center, anchors, ground: false, groundY: FLOOR_B * sB,
    look: { backs, flower, cat: catKind, curtain: curtainKind, rare },
    uniforms: U, paper,
    update,
    setProgress(u) { progress = u == null ? -1 : Math.min(1, Math.max(0, u)); },
    setHinge(i, v) { if (i >= 1 && i <= 8) hingeSet[i] = v == null ? -1 : Math.min(1, Math.max(0, v)); },
    setFold(v) { foldSet = v == null ? -1 : Math.min(1.7, Math.max(0, v)) * 0.5; },
    setCurtain(v) { curtainSet = v == null ? -1 : Math.min(1, Math.max(0, v)); },
    setCatLook(x, y) { catOn = x != null; if (catOn) { catSet.x = Math.min(1, Math.max(-1, x)); catSet.y = Math.min(1, Math.max(-1, y || 0)); } },
    lookCatAt(p) { catOn = true; catSet.x = Math.min(1, Math.max(-1, -(p.x - catHead.x) / 70)); catSet.y = Math.min(1, Math.max(-1, (p.y - catHead.y) / 50)); },
    scaleAt: hornS, shelfPoint: (a, b, z) => V(a * hornS(z), b * hornS(z), z), flyX, wallOpenAt, uOfZ,
    get progress() { return lastU; },
    // the style kit: build more things in the same paint (same shader programs, so nothing new to compile)
    kit: {
      setA, setB, setP, still, vtx,
      pigment: { TAN, INK, IND, MAL, VER, WHT, OCH, BACK, MOTIF, FLOWER, FLOWER2, FUR },
      pattern: { FLAT: P_FLAT, GRAIN: P_GRAIN, PAGES: P_PAGES, STRIPE: P_STRIPE, HEX: P_HEX, COIN: P_COIN, CLOUD: P_CLOUD, BAND: P_BAND, BANDX: P_BANDX, ROSETTE: P_ROSETTE, SLIP: P_SLIP, SCROLL: P_SCROLL, PETAL: P_PETAL, LEAF: P_LEAF, DISC: P_DISC, PETALEDGE: P_PETALEDGE, LOTUS: P_LOTUS, FRUIT: P_FRUIT, GRID: P_GRID, EYE: P_EYE, RING: P_RING, HOOP: P_HOOP },
      makeBatch, prism, box, quad, rawQuad, card, lathe, hp,
      finish: (bt) => finishBatch(bt, bt.anim ? matM : matS),
      materials: { still: matS, moving: matM },
    },
    dispose() {},
  };
  return hero;
}

// ---------------------------------------------------------------- the cat: a folk-painting tiger-cat drawn as one flat cut-out
const CAT_VERT = /* glsl */`
attribute vec2 aC; varying vec2 vC;
#include <fog_pars_vertex>
void main() {
  vC = aC;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CAT_FRAG = /* glsl */`
uniform vec3 uPal[13]; uniform float uInk; uniform float uTime; uniform vec4 uCat;   // turn, tilt, blink, spotted
varying vec2 vC;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ell(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return (length(q) - 1.) * min(r.x, r.y); }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h); }
void main() {
  vec2 p = vC;
  float px = max(max(fwidth(p.x), fwidth(p.y)), 1e-5), lw = max(0.34, uInk * px), hl = lw * 0.5;
  float turn = uCat.x, tilt = uCat.y;
  vec2 H = vec2(-23. + 1.6 * turn, 13.5 + 0.7 * tilt);
  vec2 F = H + vec2(3.3 * turn, 1.5 * tilt - 0.5);
  float tw = 0.9 * max(0., sin(uTime * 6.)) * step(0.86, sin(uTime * 0.53 + 1.));
  float dBody = ell(p, vec2(3., 7.), vec2(25., 7.6));
  dBody = min(dBody, ell(p, vec2(19.5, 9.), vec2(10.5, 10.)));
  dBody = min(dBody, ell(p, vec2(-13., 8.5), vec2(9.5, 9.)));
  dBody = max(dBody, -p.y);
  float dPaw = min(ell(p, vec2(-15., -2.), vec2(3.1, 4.6)), ell(p, vec2(-7., -2.2), vec2(3.1, 4.4)));
  float dEar = min(ell(p, H + vec2(-6.7, 7.3 + tw), vec2(3.4, 3.9)), ell(p, H + vec2(6.7, 7.3), vec2(3.4, 3.9)));
  float dEarIn = min(ell(p, H + vec2(-6.7 + 0.5 * turn, 7.1 + tw), vec2(1.7, 2.2)), ell(p, H + vec2(6.7 + 0.5 * turn, 7.1), vec2(1.7, 2.2)));
  float dHead = min(ell(p, H, vec2(10.4, 9.2)), dEar);
  float dAll = min(min(dBody, dPaw), dHead);
  if (dAll > hl) discard;
  vec3 fur = uPal[11], wht = uPal[5], ink = uPal[1], ver = uPal[4], mal = uPal[3];
  vec3 col = fur; float k = 0.;
  if (uCat.w < 0.5) {                                   // tiger stripes, thick at the spine, tapering to the belly
    float tp = smoothstep(1.5, 10., p.y);
    float sd = (abs(fract((p.x + 0.45 * p.y) / 4.4) - 0.5) - 0.2 * tp) * 4.4;
    k = (1. - smoothstep(-px, px, sd)) * step(0.02, tp);
  } else {                                              // or leopard rosettes
    vec2 g = p / 3.6, c = floor(g), q = fract(g) - 0.5; float h = h21(c);
    q -= (vec2(h21(c + 1.7), h21(c + 9.2)) - 0.5) * 0.3;
    float r = length(q), an = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x), rr = 0.2 + 0.09 * h;
    float d = max(abs(r - rr) - 0.065, -(sin(an * 3. + h * 20.) + 0.5) * 0.1) * 3.6;
    if (r < rr - 0.06) col = uPal[0];
    k = 1. - smoothstep(-px, px, d);
  }
  if (ell(p, vec2(2., 0.), vec2(21., 3.4)) < 0.) { col = wht; k = 0.; }          // belly
  if (dPaw < 0.) {                                      // paws hang over the ledge
    col = wht; k = 0.;
    k = max(k, 1. - smoothstep(hl * 0.6 - px, hl * 0.6 + px, min(seg(p, vec2(-15.9, -6.), vec2(-15.9, -4.4)), seg(p, vec2(-14.1, -6.), vec2(-14.1, -4.4)))));
    k = max(k, 1. - smoothstep(hl * 0.6 - px, hl * 0.6 + px, min(seg(p, vec2(-7.9, -6.), vec2(-7.9, -4.4)), seg(p, vec2(-6.1, -6.), vec2(-6.1, -4.4)))));
  }
  k = max(k, (1. - smoothstep(hl - px, hl + px, abs(dPaw))) * step(dPaw, hl));
  if (dHead < 0.) {                                     // the head, drawn over the body
    col = fur; k = 0.;
    vec2 q = p - F, qa = vec2(abs(q.x), q.y);
    if (dEarIn < 0.) col = ver;
    float bars = min(min(seg(q, vec2(-2.3, 6.4), vec2(2.3, 6.4)), seg(q, vec2(-3., 4.9), vec2(3., 4.9))), seg(q, vec2(-1.9, 3.5), vec2(1.9, 3.5))) - 0.36;
    bars = min(bars, min(seg(qa, vec2(9.2, 1.2), vec2(6.6, 0.4)), seg(qa, vec2(8.9, -1.6), vec2(6.4, -1.5))) - 0.3);
    if (uCat.w < 0.5) k = max(k, 1. - smoothstep(-px, px, bars));
    float dMuz = ell(p, F + vec2(0., -3.3), vec2(4.7, 3.2));
    if (dMuz < 0.) { col = wht; k = 0.; }
    k = max(k, 1. - smoothstep(hl * 0.6 - px, hl * 0.6 + px, abs(dMuz)));
    vec2 ec = vec2(3.9, 1.4), er = vec2(2.5, 2.5 * (1. - 0.9 * uCat.z));
    float dEye = ell(qa, ec, er);
    if (dEye < 0.) {
      col = wht; k = 0.;
      vec2 io = vec2(0.5 * turn, 0.3 * tilt);
      float dI = min(length(q - vec2(ec.x, ec.y) - io), length(q - vec2(-ec.x, ec.y) - io)) - 1.75;
      float dP = min(length(q - vec2(ec.x, ec.y) - io * 1.7), length(q - vec2(-ec.x, ec.y) - io * 1.7)) - 0.8;
      if (dI < 0.) col = mal;
      if (dP < 0.) col = ink;
    }
    k = max(k, 1. - smoothstep(hl * 0.8 - px, hl * 0.8 + px, abs(dEye)));
    if (ell(q, vec2(0., -1.75), vec2(1.3, 0.9)) < 0.) { col = ver; k = 0.; }
    float mouth = min(seg(q, vec2(0., -2.6), vec2(0., -3.7)), min(abs(length(qa - vec2(1.3, -3.7)) - 1.3) + step(-3.7, q.y) * 9., 9.));
    float whisk = min(min(seg(qa, vec2(3.4, -3.), vec2(9.6, -2.)), seg(qa, vec2(3.4, -3.7), vec2(9.9, -4.2))), seg(qa, vec2(3.2, -4.4), vec2(9.2, -6.2)));
    k = max(k, 1. - smoothstep(hl * 0.5 - px, hl * 0.5 + px, min(mouth, whisk)));
    k = max(k, 1. - smoothstep(hl - px, hl + px, abs(dHead)));
  }
  k = max(k, 1. - smoothstep(hl - px, hl + px, abs(dAll)));
  k = max(k, (1. - smoothstep(hl - px, hl + px, abs(dBody))) * step(0., dHead) * step(0.2, p.y));
  col *= 0.985 + 0.03 * h21(floor(p * vec2(0.6, 7.)));
  gl_FragColor = vec4(mix(col, ink, clamp(k, 0., 1.)), 1.);
  #include <fog_fragment>
}`;
