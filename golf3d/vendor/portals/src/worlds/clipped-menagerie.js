// clipped-menagerie: a topiary garden that is forever growing shaggy and gold and forever being sheared back to
// crisp two-tone planes by blades nobody sees. Style rules (see src/parts/clipped-menagerie.js): three plants and
// gravel; a face is one flat tone (sun or shade); the uncut growth is gold in two tones and hangs in rows of tufts;
// lines are arrises; leaves only on edges as cut cards; shadows are the hull laid flat in one shade of the gravel, the
// rake's lines running through them; the sky is one flat blue with a few flat clouds, cut round like box balls;
// distance is rank behind rank. post.flat: no tone map.
//
// Handedness: travelling +Z the viewer's LEFT is +X. The Peacock stands at (30, 280) facing us (rotated PI); the
// Kilometre Wall we ride runs along x 60 so that "off the right edge" drops toward the Long Walk on x 30; the back
// hedge (12 m, under the eye) stands on x 82. The sun stands behind us and to the left at every hour: 110 degrees
// round toward +X in the morning deal, 160 at dawn, 128 in the golden hour, so the faces the way shows are lit.
//
// THE UNIT OF EVERY CUT IS THE ROUTE METRE: s, the metres of route the eye has flown (update writes s = u x L, u being
// the share of the route's own length). A shearing front reaches a form so many metres of route ahead of the eye's
// pass of it; that is a law of the place, typed below where each zone is built, the same for the whole stretch and on
// every seed. A cut below 0 was made before we came (that many days of regrowth, a state); 1e6: not while we are here.
// Nothing is begun, ended, moved, lit, faded or hidden by a clock, a share of the flight, a seed or the lens.
// THIS VISIT'S DEAL (chooseLook): the hour, the season, the cast of forms, their count and whether the rare long cut runs
// in the court come from the engine's ctx.vary (hour, density, rare: one visit in eight) and the world's own streams.
// A deal says WHAT stands in the garden on this visit; it never says when a thing begins: every cut keeps its place.
// THE LAWS, where each is typed:
//   the course      flightPath() and build(): the wall top at 20 m, 5.95 m over its cut plane; one climb from between
//                   the second and third arches to a crest before the fan; EYE_OUT 36 and EYE_ON 14 (the course runs
//                   down our eye's own axis, through its middle); the marks M (route metres of named places)
//   the wall        WALL_RUN 1.57 m of wall to a metre of route; three fronts WALL_AHEAD 14, 10 and 6 m ahead of the
//                   eye at the start; the back hedge's front stands 72 m ahead of the eye at the start and runs at the
//                   same rate; a finial with the right-hand front, top to foot in 1.9 m
//   the Walk        WALK_LEAD 24, WALK_SPAN 17 (a form cut as we pass, the dove among them); ARCH_LEAD 36, ARCH_SPAN 19
//   the court       COURT_LEAD 19, COURT_SPAN 14 (a lesser form found as we pass); the rare long cut LONG_SPAN 38
//   the Peacock     in the part: BODY_LEAD 340, BODY_SPAN 58 (its head is out of the gold as we come in), TAIL_LEAD
//                   230, TAIL_SWEEP 163, TAIL_UNDER 6, TAIL_RIM 27, EYE_AFTER 7 (the whole fan stands cut 46 m of
//                   route short of our pass through it)
//   the moon gate   GATE_LEAD 140, GATE_SPAN 78: the ring stands whole for the last 62 m of route (its last clippings
//                   are down about 37 m short of it); GW_LEAD 28, GW_SPAN 19
//   the blackbirds  BIRD_LEAD 19 (and up to 7 more by the bird's own chance), BIRD_FLY 28, BIRD_RISE 9, BIRD_WAYS;
//                   one on the wall top lifts 1 m of route after the last of the wall's fronts has passed its spot
//   the pace, the looks   speed() and pois, by the marks
// CLEAR AIR BY PLACE (counted from the eye's course, whatever the turn; 2.5 m and more: 2.0 and the camera's sway):
//   a leaf card, a clipping (its whole fall), litter, a string, an eddy's whole ring, a blackbird (its whole visit
//   replayed) that would come nearer is not made or is dealt again; a whole form a corner of which would stand within
//   3.1 m of the course is not made (formLay); each rule stands where the thing is built. THE BODIES (bodyAt): an eddy
//   turns, a blackbird works and flies and litter lies only where no form, wall, hedge, arch, pier, tower or part of
//   the Peacock stands; a form that stands on the ground is made only where its foot stands in none of those that
//   are built, and not in another form (footInBody: neighbours may touch at their rims). A falling clipping is asked the
//   course and the Kilometre Wall alone (it lies where it comes down from above on the wall's top, its chamfers or a
//   pier's top; one that would meet the wall's upright face from the side is not made); it may fall past a form's own
//   face. On the wall litter lies on the top, the chamfers and the piers' tops, and not in a finial's foot.
//   A clipping leaves its place up to 1.9 m of route after the front has reached it, by its own chance (at the moon
//   gate, whose pool adds a chance of its own, up to 3.8 m): a front sheds a shower, not a sheet.
// PLACED TO BE SEEN FROM THE WAY (typed; the same on every seed): the sun stands on the side the course passes the
//   Peacock on; leaf cards stand denser on faces near the course (setDensity: within 28, 70 and 180 m of it); litter
//   lies within 15 m of it; the eddies turn 6 to 30 m from it; the blackbirds work spots beside it; a lesser form of
//   the court is found (cut as we pass) only within 46 m of it; the court's forms keep off the line from our eye of
//   the fan to the gate; the gate stands in a round gable between low shoulders, with two tall piers, two towers
//   with cake-stands and an avenue of forms, tallest at its far end, either side of that line; ten great forms and
//   the far ranks stand beyond the shoulders; the dove of the Walk stands 8.4 m to the left of the course; a pier of
//   yew stands under each finial on the wall's Walk side.
// LIT BY RULE, NOT BY THE SUN (typed; the same on every seed and at every hour): the piers under the finials take the
//   light as if the wall behind them cast no shade on them (their tag lets them off the wall's shade box), so that the
//   wall's long face reads in two tones; by the sun alone only their top 1 to 3 m would be lit, and they stand in the
//   wall's own flat shadow on the gravel. The moon gate's reveal is shade at every hour (the gate's shade box is solid
//   through the opening).
// THE HEAVIEST DEAL of eighty seeds counted, the world flown alone: 420,798 built triangles on seed 69 (a count in node of what
//   is built; the page draws what is in sight).
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import {
  buildHero, heroPlan, STYLE, STYLE_GLSL, setStylePalette, makeFacets, makeCards, makeTackle, hullMaterial, shadowMaterial,
  cardMaterial, clippingMaterial, DEFAULT_PALETTE, DEFAULT_TONES, RAKE_GLSL,
} from '../parts/clipped-menagerie.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PX = 30, PZ = 280;                 // the Peacock / court centre
const WALL_X = 60, WALL_H = 14, HEDGE_X = 82, HEDGE_H = 12, HD = HEDGE_H - 26, GATE_Z = 432, GATE_X = 36, GATE_Y = 10;
// the gate's gable: GABLE_R m round the gate's own centre, between shoulders SHOULDER m high that run out to the two
// towers, TOWER_X m either side of the gate's axis
const GABLE_R = 13, SHOULDER = 12, TOWER_X = 34;

// ---- form library: everything is flat-normalled facets pushed into a makeFacets() builder -------------------------
// a placement: local (x, y, z) -> world, with yaw, a lean (old forms lean up to 8 degrees) and a scale
function placement(px, py, pz, yaw = 0, lean = 0, leanDir = 0, s = 1) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), lx = Math.sin(leanDir) * Math.tan(lean), lz = Math.cos(leanDir) * Math.tan(lean);
  return (x, y, z) => { const X = x * s + y * s * lx, Y = y * s, Z = z * s + y * s * lz; return V(px + X * cy + Z * sy, py + Y, pz - X * sy + Z * cy); };
}
// grid of facets from a parametric surface (u, v, i, j) -> Vector3
function sheet(F, nu, nv, fn, o, wrapU = false) {
  const g = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) g.push(wrapU && i === nu ? g[j * (nu + 1)] : fn(i / nu, j / nv, i, j));
  const c = V(0, 0, 0);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = g[j * (nu + 1) + i], b = g[j * (nu + 1) + i + 1], cc = g[(j + 1) * (nu + 1) + i + 1], d = g[(j + 1) * (nu + 1) + i];
    c.copy(a).add(b).add(cc).add(d).multiplyScalar(0.25);
    F.quad(a, b, cc, d, typeof o === 'function' ? o(i, j, c) : o);
  }
}
// lathe: prof = [[r, y], ...] bottom to top, n sides; opt.radial(t, y) multiplies r (spirals, bellies), jit wanders arrises
function lathe(F, xf, prof, n, o, rng, opt = {}) {
  const jit = opt.jit ?? 0.12, ph = opt.phase ?? 0, radial = opt.radial, tw = opt.twist ?? 0;
  const rows = prof.map(([r, y], k) => {
    const row = [];
    for (let i = 0; i < n; i++) {
      const t = ph + (i + (opt.stagger ? (k % 2) * 0.5 : 0)) / n * TAU + tw * y, rr = r <= 0.001 ? 0 : (r * (radial ? radial(t, y) : 1) + rng.range(-jit, jit));
      row.push(xf(Math.sin(t) * rr + (opt.cx ?? 0), y + (r <= 0.001 ? 0 : rng.range(-jit, jit) * 0.5), Math.cos(t) * rr + (opt.cz ?? 0)));
    }
    return row;
  });
  for (let k = 0; k < prof.length - 1; k++) {
    const L = rows[k], U = rows[k + 1], ref = xf(opt.cx ?? 0, (prof[k][1] + prof[k + 1][1]) / 2 - (opt.refDrop ?? 0), opt.cz ?? 0);
    const oo = typeof o === 'function' ? o(k) : o;
    for (let i = 0; i < n; i++) {
      const i1 = (i + 1) % n;
      if (prof[k + 1][0] <= 0.001) F.tri(L[i], L[i1], U[i], { ...oo, ref });
      else if (prof[k][0] <= 0.001) F.tri(L[i], U[i1], U[i], { ...oo, ref });
      else F.quad(L[i], L[i1], U[i1], U[i], { ...oo, ref });
    }
  }
}
// loft: a swept body whose spine lies in the local YZ plane; rings = [[y, z, rx, ry], ...]; staggered triangles
function loft(F, xf, rings, ns, o, rng, jit = 0.1) {
  const pts = rings.map(([y, z, rx, ry], j) => {
    const a = rings[Math.max(0, j - 1)], b = rings[Math.min(rings.length - 1, j + 1)];
    let ty = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;      // spine tangent
    const row = [];
    for (let i = 0; i < ns; i++) {
      const t = (i + (j % 2) * 0.5) / ns * TAU, c = Math.cos(t) * ry, s = Math.sin(t) * rx;             // e2 = (0, tz, -ty) x ... in-plane normal
      row.push(xf(s + rng.range(-jit, jit), y + c * tz + rng.range(-jit, jit), z - c * ty + rng.range(-jit, jit)));
    }
    return row;
  });
  for (let j = 0; j < rings.length - 1; j++) {
    const L = pts[j], U = pts[j + 1], ref = xf(0, (rings[j][0] + rings[j + 1][0]) / 2, (rings[j][1] + rings[j + 1][1]) / 2), oo = { ...o, ref };
    for (let i = 0; i < ns; i++) {
      const i1 = (i + 1) % ns;
      if (j % 2 === 0) { F.tri(L[i], L[i1], U[i], oo); F.tri(L[i1], U[i1], U[i], oo); } else { F.tri(L[i], L[i1], U[i1], oo); F.tri(L[i], U[i1], U[i], oo); }
    }
  }
  const cap = (row, r) => { const c = xf(0, r[0], r[1]), ref = xf(0, r[0] - 0.01, r[1]); for (let i = 0; i < ns; i++) F.tri(row[i], row[(i + 1) % ns], c, { ...o, ref, edge: 0 }); };
  cap(pts[0], rings[0]); cap(pts[pts.length - 1], rings[rings.length - 1]);
}
// plate: a thick flat shape (a fan tail, a comb, an ear): outline = [[y, z], ...] in the local YZ plane, half thickness w
function plate(F, xf, outline, w, o, rng, cx = 0) {
  let my = 0, mz = 0; for (const p of outline) { my += p[0]; mz += p[1]; } my /= outline.length; mz /= outline.length;
  const n = outline.length, ref = xf(cx, my, mz), A = outline.map((p) => xf(cx - w, p[0], p[1])), B = outline.map((p) => xf(cx + w, p[0], p[1]));
  const ca = xf(cx - w, my, mz), cb = xf(cx + w, my, mz);
  for (let i = 0; i < n; i++) {
    const i1 = (i + 1) % n;
    F.tri(A[i], A[i1], ca, { ...o, ref }); F.tri(B[i], B[i1], cb, { ...o, ref }); F.quad(A[i], A[i1], B[i1], B[i], { ...o, ref });
  }
}

// ---- recipes: each builds a form about 8-10 units tall at the local origin and returns { h, r, cz } for its lump ----
// B = { F, xf, rng, o(plant, extra) } ; plants: 0 yew (architecture), 1 box (menagerie), 2 golden yew (trimming)
function pedestal(B, ball) {
  const { F, xf, rng, o } = B;
  if (ball) lathe(F, xf, [[0.9, 0], [1.75, 0.7], [2.0, 1.6], [1.6, 2.5], [0.8, 3.0]], 8, o(1), rng, { stagger: true });
  else { lathe(F, xf, [[2.5, 0], [2.4, 1.7], [2.05, 2.2], [0, 2.2]], 9, (k) => o(k === 1 ? 2 : 1), rng); }
  return ball ? 2.8 : 2.1;
}
const RECIPES = {
  dove(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false) - 2.6;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[3.1, -2.4, 0.6, 0.45], [3.5, -1.2, 1.55, 1.3], [4.2, 0.3, 1.95, 1.8], [5.0, 1.5, 1.5, 1.5], [6.0, 2.1, 0.9, 0.9], [6.9, 2.4, 0.78, 0.75], [7.5, 2.9, 0.3, 0.3]]), 7, o(1), rng);
    plate(F, xf, [[3.2 + y0, -1.9], [3.9 + y0, -4.9], [5.5 + y0, -5.3], [4.7 + y0, -1.7]], 1.35, o(1), rng);
    return { h: 7.6 + y0, r: 3.0, cz: -1.2, ez: 0.55 };
  },
  cockerel(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, true) - 2.4;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[2.6, -1.0, 1.0, 0.9], [3.4, -0.2, 1.65, 1.5], [4.6, 0.6, 1.5, 1.5], [5.8, 1.2, 0.9, 0.9], [7.0, 1.5, 0.7, 0.7], [7.8, 1.9, 0.45, 0.4]]), 7, o(1), rng);
    plate(F, xf, [[7.8 + y0, 1.1], [8.9 + y0, 1.4], [8.7 + y0, 2.3], [7.9 + y0, 2.4]], 0.22, o(2), rng);
    plate(F, xf, [[3.0 + y0, -0.9], [5.4 + y0, -2.7], [8.3 + y0, -3.1], [9.1 + y0, -1.9], [7.0 + y0, -1.6], [4.8 + y0, -0.5]], 0.5, o(1), rng);
    return { h: 9.2 + y0, r: 2.7, cz: -0.5, ez: 0.4 };
  },
  swan(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false) - 2.2;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[2.7, -3.2, 0.5, 0.4], [3.0, -1.7, 1.75, 1.2], [3.3, 0.2, 2.05, 1.5], [3.6, 1.6, 1.3, 1.2], [4.7, 2.4, 0.62, 0.6], [6.1, 2.5, 0.5, 0.5], [7.3, 2.2, 0.5, 0.5], [8.0, 2.75, 0.56, 0.5], [7.6, 3.6, 0.22, 0.2]]), 7, o(1), rng);
    plate(F, xf, [[3.4 + y0, -0.6], [4.9 + y0, -3.3], [3.3 + y0, -3.4]], 1.5, o(1), rng);
    return { h: 8.3 + y0, r: 3.0, cz: 0, ez: 0.45 };
  },
  owl(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false);
    lathe(F, xf, [[1.5, y0], [2.1, y0 + 1.5], [2.25, y0 + 3.2], [1.95, y0 + 4.6], [1.6, y0 + 5.4], [0, y0 + 5.7]], 8, o(1), rng, { stagger: true });
    for (const s of [-1, 1]) plate(F, xf, [[y0 + 5.1, -0.3], [y0 + 6.7, 0.1], [y0 + 5.2, 0.6]], 0.3, o(1), rng, s * 1.05);
    return { h: y0 + 6.8, r: 2.8, cz: 0, ez: 0 };
  },
  peacock(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, true) - 2.4;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[2.7, -0.6, 1.0, 0.9], [3.5, 0.1, 1.5, 1.4], [4.6, 0.8, 1.2, 1.2], [5.8, 1.3, 0.6, 0.6], [6.9, 1.5, 0.5, 0.5], [7.5, 1.9, 0.3, 0.3]]), 7, o(1), rng);
    const fan = []; for (let i = 0; i <= 8; i++) { const t = Math.PI * i / 8; fan.push([3.2 + y0 + Math.sin(t) * 5.6, Math.cos(t) * 4.6]); }
    plate(F, (x, y, z) => xf(z, y, -x - 0.9), fan, 0.45, o(1), rng);
    return { h: 9.0 + y0, r: 4.4, cz: -0.3, ez: -0.3 };
  },
  hare(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false) - 2.3;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[2.4, -1.5, 1.2, 1.0], [3.2, -0.9, 1.9, 1.6], [4.4, -0.2, 1.7, 1.6], [5.6, 0.5, 1.15, 1.1], [6.5, 1.0, 0.95, 0.9], [7.0, 1.9, 0.45, 0.4]]), 7, o(1), rng);
    for (const s of [-1, 1]) plate(F, xf, [[6.9 + y0, 0.4], [9.8 + y0, -0.4], [10.1 + y0, 0.2], [7.3 + y0, 1.0]], 0.2, o(1), rng, s * 0.5);
    return { h: 10.2 + y0, r: 2.7, cz: -0.2, ez: 0.2 };
  },
  hound(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false) - 2.2;
    const up = (r) => r.map(([y, z, a, b]) => [y + y0, z, a, b]);
    loft(F, xf, up([[2.5, -2.4, 1.1, 0.9], [3.1, -1.4, 1.6, 1.4], [4.2, -0.2, 1.4, 1.5], [5.6, 0.8, 1.1, 1.2], [6.8, 1.3, 0.85, 0.9], [7.2, 2.3, 0.6, 0.6], [6.9, 3.3, 0.3, 0.3]]), 7, o(1), rng);
    for (const s of [-1, 1]) plate(F, xf, [[7.4 + y0, 0.8], [7.3 + y0, 1.6], [5.9 + y0, 1.3]], 0.16, o(1), rng, s * 0.95);
    plate(F, xf, [[2.9 + y0, -2.2], [5.2 + y0, -3.6], [5.6 + y0, -3.2], [3.5 + y0, -1.6]], 0.3, o(1), rng);
    return { h: 7.8 + y0, r: 3.0, cz: 0, ez: 0.4 };
  },
  snail(B) {
    const { F, xf, rng, o } = B, y0 = pedestal(B, false) - 2.2;
    const shell = []; for (let i = 0; i < 9; i++) { const t = TAU * i / 9; shell.push([5.2 + y0 + Math.sin(t) * 2.7, -0.6 + Math.cos(t) * 2.7]); }
    plate(F, xf, shell, 1.15, o(1), rng); plate(F, xf, shell.map(([y, z]) => [5.2 + y0 + (y - 5.2 - y0) * 0.55, -0.6 + (z + 0.6) * 0.55]), 1.6, o(2), rng);
    loft(F, xf, [[2.5 + y0, -3.4, 0.4, 0.3], [2.8 + y0, -1.5, 1.3, 0.7], [2.9 + y0, 1.2, 1.25, 0.75], [3.6 + y0, 2.9, 0.8, 0.7], [4.7 + y0, 3.5, 0.55, 0.5]], 6, o(1), rng);
    for (const s of [-1, 1]) plate(F, xf, [[4.8 + y0, 3.3], [6.4 + y0, 3.9], [4.9 + y0, 3.8]], 0.12, o(1), rng, s * 0.35);
    return { h: 8.1 + y0, r: 3.2, cz: 0, ez: 0.35 };
  },
  cone(B) { const { F, xf, rng, o } = B; lathe(F, xf, [[2.5, 0], [2.3, 1.2], [1.55, 4.2], [0.8, 7.2], [0, 10]], 8, o(0), rng, { stagger: true, jit: 0.1 }); return { h: 10, r: 2.7, cz: 0, ez: 0, taper: 1 }; },
  spiral(B) {
    const { F, xf, rng, o } = B, prof = []; for (let k = 0; k <= 12; k++) prof.push([k === 12 ? 0 : 2.5 * (1 - k / 12.6), k * 10 / 12]);
    lathe(F, xf, prof, 10, o(0), rng, { jit: 0.06, radial: (t, y) => (Math.sin(t - y * 1.55) > 0.1 ? 1.12 : 0.58) });
    return { h: 10, r: 2.8, cz: 0, ez: 0, taper: 1 };
  },
  cakestand(B) {
    const { F, xf, rng, o } = B, prof = [[0.55, 0]]; let y = 0;
    for (const r of [2.9, 2.2, 1.5]) { prof.push([0.55, y + 1.5], [r, y + 1.5], [r, y + 2.5], [r - 0.45, y + 2.95], [0.5, y + 2.95]); y += 2.95; }
    prof.push([0.4, y + 0.8], [0.75, y + 1.3], [0, y + 2.1]);
    lathe(F, xf, prof, 9, (k) => o((k - 3) % 5 === 0 ? 2 : (k % 5 === 2 && k < 15 ? 2 : 0)), rng, { jit: 0.07 });
    return { h: y + 2.1, r: 3.1, cz: 0, ez: 0 };
  },
  obelisk(B) { const { F, xf, rng, o } = B; lathe(F, xf, [[1.9, 0], [1.9, 1.1], [1.5, 1.4], [1.0, 8.6], [0, 10]], 4, o(0), rng, { jit: 0.05, phase: Math.PI / 4 }); return { h: 10, r: 2.2, cz: 0, ez: 0, taper: 1 }; },
  ball(B) { const { F, xf, rng, o } = B; lathe(F, xf, [[2.2, 0], [2.3, 1.6], [1.9, 2.0], [0.5, 2.0], [0.5, 2.6], [2.0, 3.6], [2.9, 5.4], [2.6, 7.4], [1.4, 8.6], [0, 9.0]], 9, (k) => o(k === 1 ? 2 : (k < 4 ? 0 : 1)), rng, { stagger: false }); return { h: 9, r: 3.1, cz: 0, ez: 0 }; },
};
const NAT_H = { dove: 7.1, cockerel: 9.6, swan: 8.2, owl: 8.9, peacock: 9.4, hare: 9.9, hound: 7.7, snail: 8.0, cone: 10, spiral: 10, cakestand: 10.95, obelisk: 10, ball: 9 };
// the shaggy gold lump a form is cut out of (kind 1): a bumpy mound over { h, r, cz, ez }
function lump(B, L, noise, shag = 1) {
  const { F, xf, rng } = B, K = 6, prof = [], top = L.h * 1.07 + 0.4;
  for (let k = 0; k <= K; k++) { const v = k / K; prof.push([k === K ? 0 : (L.r * 1.12 + 0.3) * (L.taper ? 1 - 0.86 * v : Math.sqrt(Math.max(0, 1 - 0.93 * v * v))), top * v]); }
  const sx = rng.range(0, 40);
  lathe(F, xf, prof, 10, { plant: 0, kind: B.kind || 1, cut: B.cut, edge: 0.34 * shag, fur: 0.075 * shag, len: [0.3, 0.75] }, rng,
    { jit: 0.3, cz: L.cz, stagger: true, radial: (t, y) => (1 + (L.ez || 0) * Math.cos(t) * Math.cos(t)) * (1 + 0.13 * noise.fbm2(Math.sin(t) * 1.7 + sx, y * 0.25 + Math.cos(t) * 1.7, 2)) });
}

// ---- variations chosen once at build -------------------------------------------------------------------------------
function chooseLook(ctx) {
  const r = ctx.rng.fork ? ctx.rng.fork('look-look3') : ctx.rng, vary = ctx.vary || {};
  const hr = r(), sr = r(), cr = r(), br = r(), crisp = r.range(0.3, 0.72);
  const hour = vary.hour === 'dawn' ? 'dawn' : vary.hour === 'golden' ? 'golden' : vary.hour === 'day' ? 'morning' : (hr < 0.5 ? 'morning' : hr < 0.76 ? 'dawn' : 'golden');
  const season = sr < 0.52 ? 'june' : sr < 0.78 ? 'august' : 'frost';
  const cast = cr < 0.55 ? 'birds' : cr < 0.8 ? 'beasts' : 'geometry';
  // the strings and canes are garden twine and bamboo, a dull tan (the part's own default is paler); the moon gate's
  // ring of light keeps the pale tone
  const palette = DEFAULT_PALETTE.slice(), tones = { ...DEFAULT_TONES, tackle: '#B09A66' };
  palette[0] = '#172F26'; palette[1] = '#31573F';                        // yew a step lighter than the part's default, so a yew form in shade keeps its facets
  if (season === 'august') { palette[4] = '#B8692E'; tones.goldShade = '#94501F'; }
  if (season === 'frost') { palette[4] = '#E8EFEA'; palette[5] = '#DADBD3'; tones.goldShade = '#C5D2D0'; tones.damp = '#C3C8C1'; tones.shadow = '#AEB6B4'; tones.shadowDamp = '#9FA8A6'; tones.tackle = '#B8B4A2'; }
  if (hour === 'dawn') { tones.shadow = season === 'frost' ? '#A6B0B6' : '#B2B0A0'; tones.shadowDamp = season === 'frost' ? '#98A2A8' : '#A3A190'; }
  if (hour === 'golden' && season !== 'frost') { palette[5] = '#EBD9B8'; tones.damp = '#D9C49C'; tones.shadow = '#C2AE88'; tones.shadowDamp = '#B29E79'; }
  // The sun stands BEHIND US AND TO THE LEFT at every hour (morning 110 degrees round toward +X and 38 up, dawn 160 and
  // 16, golden 128 and 27): the course passes the Peacock on its left and climbs before the left half of its fan, so
  // the faces the way shows are the lit ones on every visit; the shadows bar the gravel ahead and to the right.
  const el = (hour === 'morning' ? 38 : hour === 'dawn' ? 16 : 27) * Math.PI / 180, az = (hour === 'morning' ? 110 : hour === 'dawn' ? 160 : 128) * Math.PI / 180;
  const sun = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
  const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
  return { hour, season, cast, breeze: br < 0.5, crisp, palette, tones, sun, ring: season === 'frost' ? '#F6F4EA' : '#F3ECD6',
    cloud: hour === 'golden' ? ['#F7EBCD', '#C6CCBF'] : hour === 'dawn' ? ['#F4E6DD', '#B7C6CE'] : ['#F1F3EA', '#B2CCCF'], rare: !!vary.rare, count: Math.round(Math.min(130, Math.max(80, 105 * density))) };
}

function flightPath() {
  // along the wall top 5.95 m over its cut plane (over the finials, 8 m over the back hedge's cut top); out over the right
  // edge until the eye stands clear of the corner, then down to the Walk; under the first two arches at 5 m; from the
  // second arch one long climb (about 33 degrees), under the third arch and out over the court, to a crest level with
  // the Peacock's own crest, in front of our eye of the fan
  const P = [[61.6, 20, 0], [61.6, 20, 14], [61.6, 20, 28], [61.6, 20, 40], [59.9, 20, 49], [56.2, 19.2, 58], [51.5, 16, 66.5], [45.6, 10.4, 77], [38.8, 6.4, 88], [33.2, 5, 98]];
  for (const z of [110, 125, 140]) P.push([30 + 3 * Math.sin(Math.PI * (z - 110) / 30), 5, z]);
  P.push([28.2, 6.4, 155], [30, 10, 170], [32.5, 14.5, 183], [37.5, 21, 196], [43.5, 29, 209], [48.5, 38, 221], [51.5, 48, 232], [52, 57.5, 241.5]);
  return P;
}

export default {
  id: 'clipped-menagerie',
  name: 'The Clipped Menagerie',
  category: 'domestic',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const look = chooseLook(ctx);
    const scene = new THREE.Scene();
    setStylePalette(look.palette, look.tones);
    STYLE.uCourt.value.set(PX, PZ, 86);
    // this visit's tones, copied here before the build's first pause (another visit of this world may be built meanwhile)
    const TONES = ['uGold', 'uGoldShade', 'uGravel', 'uDamp', 'uShadow', 'uShadowDamp', 'uSky', 'uTackle', 'uBird'], snap = {};
    for (const k of TONES) snap[k] = STYLE[k].value.clone();
    snap.sunTone = STYLE.uSunTone.value.map((v) => v.clone()); snap.shadeTone = STYLE.uShadeTone.value.map((v) => v.clone());
    scene.background = new THREE.Color(look.palette[6]);
    // this world's own copy of the style values: STYLE is shared by every instance of the module, so each scene
    // writes its own values back just before it is drawn (two visits may be on screen at once across a portal)
    const mine = { s: 0, time: 0, sun: look.sun.clone() };
    const sunLocal = V(-look.sun.x, look.sun.y, -look.sun.z);               // the hero is turned by PI
    const toWorld = (p) => V(PX - p.x, p.y, PZ - p.z);
    const plan = heroPlan(ctx), EYE = toWorld(plan.eye);                   // where our eye of the fan stands on this visit
    // ---- the path: wall top, off the right edge, the Long Walk, the climb to the crest, down through our eye, the gate
    const pts = flightPath();
    // THE COURSE THROUGH OUR EYE (typed; the same on every seed): from the crest it comes down the eye's own axis, from
    // EYE_OUT m out in front of the fan, squarely through the middle of the hollow and EYE_ON m on behind it; the axis
    // points 20 degrees down, nearly at the moon gate, which is first seen through the eye
    const EYE_OUT = 36, EYE_ON = 14, nW = V(-plan.normal.x, plan.normal.y, -plan.normal.z);
    const onAxis = (m) => EYE.clone().addScaledVector(nW, m);
    pts.push([50.5, onAxis(EYE_OUT).y + 1.2, 250], onAxis(EYE_OUT).toArray(), onAxis(22).toArray(), onAxis(10).toArray(), EYE.toArray(), onAxis(-EYE_ON).toArray());
    const d0 = onAxis(-EYE_ON), d1 = V(GATE_X, GATE_Y, 380);
    for (const f of [0.35, 0.7]) pts.push(d0.clone().lerp(d1, f).toArray());
    pts.push([GATE_X, GATE_Y, 380], [GATE_X, GATE_Y, 396], [GATE_X, GATE_Y, 412], [GATE_X, GATE_Y, 426], [GATE_X, GATE_Y, GATE_Z]);
    const path = makePath(pts);
    const L = path.length;
    const clearOf = (x, y, z, r) => path.distanceTo(x, y, z) > r;
    // ---- THE COURSE: the route sampled every half metre. Every law below is counted on it, in metres of route. ------
    const CS = 0.5, CN = Math.ceil(L / CS), cX = new Float32Array(CN + 1), cY = new Float32Array(CN + 1), cZ = new Float32Array(CN + 1);
    { const q = V(0, 0, 0); for (let i = 0; i <= CN; i++) { path.posAtDist(Math.min(L, i * CS), q); cX[i] = q.x; cY[i] = q.y; cZ[i] = q.z; } }
    const CELL = 16, grid = new Map(), gkey = (ix, iy, iz) => (ix + 512) * 1048576 + (iy + 512) * 1024 + iz + 512;
    // gridNear: every cell that holds a sample of the course or lies beside one that does; a place in no such cell has
    // no sample within 16 m, and is answered at once (most of the garden's leaf cards stand far from the course)
    const gridNear = new Set();
    for (let i = 0; i <= CN; i++) {
      const ix = Math.floor(cX[i] / CELL), iy = Math.floor(cY[i] / CELL), iz = Math.floor(cZ[i] / CELL), k = gkey(ix, iy, iz);
      let a = grid.get(k); if (!a) { grid.set(k, a = []); for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) for (let dc = -1; dc <= 1; dc++) gridNear.add(gkey(ix + da, iy + db, iz + dc)); }
      a.push(i);
    }
    // the course's nearest sample to a place, where one lies within 16 m: { i, d }
    const _near = { i: -1, d: 0 };
    const nearCourse = (x, y, z) => {
      let best = 1e18, bi = -1; const ix = Math.floor(x / CELL), iy = Math.floor(y / CELL), iz = Math.floor(z / CELL);
      if (!gridNear.has(gkey(ix, iy, iz))) return null;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        // a cell whose own box lies further off than the best found so far, or than 16 m, holds no nearer sample
        const ex = a < 0 ? x - ix * CELL : a > 0 ? (ix + 1) * CELL - x : 0, ey = b < 0 ? y - iy * CELL : b > 0 ? (iy + 1) * CELL - y : 0, ez = c < 0 ? z - iz * CELL : c > 0 ? (iz + 1) * CELL - z : 0;
        if (ex * ex + ey * ey + ez * ez > (best < 256 ? best : 256)) continue;
        const g = grid.get(gkey(ix + a, iy + b, iz + c)); if (!g) continue;
        for (let q = 0; q < g.length; q++) { const i = g[q], dx = cX[i] - x, dy = cY[i] - y, dz = cZ[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      }
      if (bi < 0 || best > 256) return null; _near.i = bi; _near.d = Math.sqrt(best); return _near;
    };
    const airOf = (x, y, z) => { const n = nearCourse(x, y, z); return n ? n.d : 16; };          // clear air from the course to a place (16: that or more)
    // the route metre of the eye's NEAREST PASS of a place, anywhere in the garden
    const passOf = (x, y, z) => { let best = 1e18, bi = 0; for (let i = 0; i <= CN; i++) { const dx = cX[i] - x, dy = cY[i] - y, dz = cZ[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } } return bi * CS; };
    const sAtZ = (z) => { for (let i = 0; i <= CN; i++) if (cZ[i] >= z) return i * CS; return L; };   // the route metre at which the eye first stands at this z
    // the marks of the route, each the place of a thing: where we leave the wall top, the Walk's first form, the foot
    // of the climb (between the second and third arches), the court's rim, the crest in front of the fan, our eye of the
    // fan, the level run to the gate, the gate
    const M = { leave: sAtZ(40), walk: sAtZ(98), foot: sAtZ(152), rim: sAtZ(PZ - 86), crest: sAtZ(250), eye: passOf(EYE.x, EYE.y, EYE.z), gateWalk: sAtZ(380), gate: L };
    // CLEAR AIR BY PLACE for every leaf card (the parts' facet builder asks this of each one before it is made): 2.6 m
    // from the course (2.0 m, the camera's sway of 0.5 m and a tenth for the spacing of the course's samples) beyond the
    // card's own reach, or it is not made. One thing may stand nearer: a lump's gold shoot at a place the shear reaches
    // 4 m of route or more before the course comes that near (it is gone by then).
    // the first sample of the whole course (every pass of it) that comes within R (16 m at most) of a place; -1: none does
    const firstWithin = (x, y, z, R) => {
      let first = -1; const ix = Math.floor(x / CELL), iy = Math.floor(y / CELL), iz = Math.floor(z / CELL), R2 = R * R;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        const g = grid.get(gkey(ix + a, iy + b, iz + c)); if (!g) continue;
        for (let q = 0; q < g.length; q++) { const i = g[q]; if (first >= 0 && i >= first) continue; const dx = cX[i] - x, dy = cY[i] - y, dz = cZ[i] - z; if (dx * dx + dy * dy + dz * dz < R2) first = i; }
      }
      return first;
    };
    const keepCard = (toW) => (p, reach, cut, kind) => {
      const w = toW ? toW(p) : p, n = nearCourse(w.x, w.y, w.z); if (!n) return true;
      const R = 2.6 + reach; if (n.d >= R) return true;
      if (!kind) return false;
      return cut + 0.8 <= firstWithin(w.x, w.y, w.z, R) * CS - 4;
    };
    // CLEAR AIR BY PLACE FOR A WHOLE FORM: before a form is made it is laid out once on a stream of its own and every
    // corner of that lay-out is measured against the course. A corner of the clipped form within 3.1 m of the course
    // (2.0 m, the camera's sway, and 0.6 for the faces between corners and the wander of the real corners), or a corner
    // of its gold lump that near while the lump stands there (or within 4 m of route after), and the form is not made.
    // It also gives the form's foot (for the eddies and the blackbirds).
    const formLay = (x, z, build) => {
      const pts = [], add = (vs, o) => { for (const v of vs) pts.push(v.x, v.y, v.z, o.kind ? (typeof o.cut === 'function' ? o.cut(v) : o.cut) : 1e9); };
      build({ quad(a, b, c, d, o) { add([a, b, c, d], o); }, tri(a, b, c, o) { add([a, b, c], o); } });
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < pts.length; i += 4) {
        x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); z0 = Math.min(z0, pts[i + 2]); z1 = Math.max(z1, pts[i + 2]);
        const n = nearCourse(pts[i], pts[i + 1], pts[i + 2]); if (!n || n.d >= 3.1) continue;
        if (pts[i + 3] > 1e8 || pts[i + 3] + 0.8 > firstWithin(pts[i], pts[i + 1], pts[i + 2], 3.1) * CS - 4) return null;
      }
      // its foot: about the middle of its plan, the widest reach in each of eight bearings (a bearing takes 0.85 of its
      // neighbours' at least, and 0.3 m for the faces between corners) and its height; the clipped form and its gold lump
      // apart, the lump with the route metre by which the shear has taken all of it (1e6: not while we are here)
      const f = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, rh: new Float32Array(8), rl: new Float32Array(8), hh: 0, hl: 0, gone: -1e9, rMax: 0 };
      for (let i = 0; i < pts.length; i += 4) {
        const dx = pts[i] - f.cx, dz = pts[i + 2] - f.cz, b = Math.floor((Math.atan2(dx, dz) / TAU + 0.5) * 8) % 8, r = Math.hypot(dx, dz);
        if (pts[i + 3] < 1e8) { f.rl[b] = Math.max(f.rl[b], r); f.hl = Math.max(f.hl, pts[i + 1]); f.gone = Math.max(f.gone, pts[i + 3] + 0.8); }
        else { f.rh[b] = Math.max(f.rh[b], r); f.hh = Math.max(f.hh, pts[i + 1]); }
      }
      for (const R of [f.rh, f.rl]) { const c = Float32Array.from(R); for (let b = 0; b < 8; b++) { R[b] = Math.max(c[b], 0.85 * c[(b + 7) % 8], 0.85 * c[(b + 1) % 8]) + 0.3; f.rMax = Math.max(f.rMax, R[b]); } }
      return f;
    };
    // THE BODIES OF THE GARDEN, for whatever must not stand or fly inside one (an eddy's ring, a blackbird): forms by
    // their feet (formLay); the walls, hedges, arches, the Peacock and the gate by their typed measures
    const solids = [], butts = [], wbutts = [], PIER_X = WALL_X - 3.65, PIER_W = 2.2;
    const HEDGES = [[4, 70, 4, 196, 7, 2.2], [-60, 232, -60, 330, 6, 2], [118, 250, 118, 330, 6, 2], [-240, 40, -70, 40, 9, 2.5], [-240, 150, -70, 150, 9, 2.5], [-240, 260, -70, 260, 9, 2.5], [-240, 370, -70, 370, 9, 2.5]];
    const ARCHES = [[110, 12], [140, 15.5], [170, 19.5]];
    // is the place (x, y, z), with m of room round it, inside a body when the eye stands at route metre s?
    // a form's foot: its clipped hull, and its gold lump while that stands
    const formAt = (x, y, z, m, s) => {
      for (let i = 0; i < solids.length; i++) {
        const f = solids[i], dx = x - f.cx, dz = z - f.cz; if (Math.abs(dx) > f.rMax + m || Math.abs(dz) > f.rMax + m) continue;
        const r = Math.hypot(dx, dz), b = Math.floor((Math.atan2(dx, dz) / TAU + 0.5) * 8) % 8;
        if ((y < f.hh + 0.3 + m && r < f.rh[b] + m) || (s < f.gone && y < f.hl + 0.3 + m && r < f.rl[b] + m)) return true;
      }
      return false;
    };
    const bodyAt = (x, y, z, m, s) => formAt(x, y, z, m, s) || builtAt(x, y, z, m, s);
    // what is built: the walls, hedges, arches, piers and towers, the Peacock and the gate
    const builtAt = (x, y, z, m, s) => {
      if (z < 196 + m && Math.abs(x - WALL_X) < 5.1 + m && y < (z > WALL_AHEAD[2] + WALL_RUN * s ? 16.7 : 14.1) + m) return true;      // the Kilometre Wall, under its gold cap ahead of the last front
      if (Math.hypot(x - WALL_X, z - 198.5) < 5.9 + m && y < 22.2 + m) return true;
      if (z < 214 + m && x > HEDGE_X - 3 - 1.1 - m && x < HEDGE_X + 4.2 + m && y < HEDGE_H + 2.1 + m) return true;                          // the back hedge and its cap
      if (x > HEDGE_X - 3 - 4.5 - m && x < HEDGE_X && y < HEDGE_H - 4 + m) for (const zc of butts) if (Math.abs(z - zc) < 2.7 + m) return true;
      if (x > PIER_X - PIER_W - 0.5 - m && x < WALL_X && y < 14.1 + m) for (const zc of wbutts) if (Math.abs(z - zc) < PIER_W + 0.2 + m) return true;   // the piers under the finials
      for (const [x0, z0, x1, z1, h, w] of HEDGES) if (y < h + m && x > Math.min(x0, x1) - w - m && x < Math.max(x0, x1) + w + m && z > Math.min(z0, z1) - w - m && z < Math.max(z0, z1) + w + m) return true;
      for (const [az, H] of ARCHES) if (Math.abs(z - az) < 2.4 + m && Math.abs(x - 30) < 8.9 + m && y < H + 3.9 + m) {
        const sp = H - (H > 14 ? 6.5 : 4), dx = Math.abs(x - 30), R = 6.5 - m;
        if (!(dx < R && y < sp + (H - sp) * Math.sqrt(1 - (dx / R) * (dx / R)) - m)) return true;                                        // not in the arch's own opening
      }
      { const r = Math.hypot(x - PX, z - PZ);                                                                                              // the Peacock: its gold mound until that is cut, its drum, bird and fan
        if (s < M.eye + plan.bodyDone + 2 && r < 57 + m && y < 70 + m) return true;
        if (r < 48.8 + m && y < (r > 35.5 ? 9.3 : r > 23.5 ? 16.3 : 22.3) + m) return true;
        if (Math.hypot(x - PX, z - (PZ - 5)) < 15 + m && y < 57 + m) return true;
        if (Math.hypot(x - (PX + 5), z - (PZ - 10)) < 13 + m && y > 43 - m && y < 68 + m) return true;
        const zf = PZ + 9 + 0.364 * Math.max(0, y - 26.5);
        if (Math.abs(x - PX) < 50 + m && y < 74 + m && z > zf - 11.5 - m && z < zf + 4.5 + m) return true; }
      if (z > GATE_Z - 4.1 - m && z < GATE_Z + 9 + m && y < (Math.abs(x - GATE_X) < GABLE_R + 1.5 + m || Math.abs(x - GATE_X) > TOWER_X - 6 - m ? 25.6 : SHOULDER + 0.3) + m) return true;                                                 // the gate's wall: gable (and the rag before it), shoulders, wings
      for (const sg of [-1, 1]) if (Math.hypot(x - (GATE_X + sg * TOWER_X), z - GATE_Z) < 8.2 + m && y < 51 + m) return true;
      for (const sg of [-1, 1]) if (Math.hypot(x - (GATE_X + sg * 20), z - (GATE_Z - 2.1)) < 3.2 + m && y < 20.8 + m) return true;      // the two tall piers
      return false;
    };
    // the Kilometre Wall under a clipping or a blackbird: its top plane, its two chamfers and the level tops of the piers
    // under the finials (which cover the right chamfer where they stand); -1 off the wall
    const wallTopAt = (x, z) => {
      for (const zc of wbutts) if (Math.abs(z - zc) <= PIER_W && x >= PIER_X - PIER_W && x <= WALL_X - 2.5) return 14.03;
      const dx = Math.abs(x - WALL_X); return z > -30 && z < 196 && dx < 4 ? (dx <= 2.5 ? 14.05 : 14 - 1.0667 * (dx - 2.5)) : -1;
    };
    // BORN IN NO BODY: a form that stands on the ground is not made where its foot (its lump's reach too) would stand in
    // a wall, a hedge, an arch, a pier, a tower or the Peacock's mound or drum: asked at its middle and, in each of
    // eight bearings, at the foot's rim and half way in, as the garden stands when we come. Nor is it made where it
    // would stand IN another form: its middle inside another's clipped hull (or, if it has a hull of its own, inside
    // another's lump), or the half-way place of its foot in any bearing inside another's clipped hull. Neighbours may
    // touch at their rims, as forms planted close do; an uncut neighbour's fur may reach a clipped form's flank; two
    // uncut lumps may grow into each other. The same is asked the other way round (the forms already made, of this
    // one's hull and lump), so that the rule does not turn on which of two forms is made first.
    const footInBody = (f) => {
      if (builtAt(f.cx, 1, f.cz, 0.1, 0) || formAt(f.cx, 1, f.cz, 0, f.hh > 0 ? 0 : 1e9)) return true;
      for (let b = 0; b < 8; b++) {
        const a = ((b + 0.5) / 8 - 0.5) * TAU, sa = Math.sin(a), ca = Math.cos(a), R = Math.max(f.hh > 0 ? f.rh[b] - 0.3 : 0, f.hl > 0 ? f.rl[b] - 0.3 : 0);
        if (builtAt(f.cx + sa * R, 1, f.cz + ca * R, 0.1, 0) || builtAt(f.cx + sa * R * 0.5, 1, f.cz + ca * R * 0.5, 0.1, 0)) return true;
        if (formAt(f.cx + sa * R * 0.5, 1, f.cz + ca * R * 0.5, 0, 1e9)) return true;
      }
      const inMine = (x, z, lump) => { const dx = x - f.cx, dz = z - f.cz, r = Math.hypot(dx, dz), b = Math.floor((Math.atan2(dx, dz) / TAU + 0.5) * 8) % 8; return (f.hh > 0.7 && r < f.rh[b]) || (lump && f.gone > 0 && f.hl > 0.7 && r < f.rl[b]); };
      for (const g of solids) {
        if (Math.abs(g.cx - f.cx) > g.rMax + f.rMax || Math.abs(g.cz - f.cz) > g.rMax + f.rMax) continue;
        if (inMine(g.cx, g.cz, g.hh > 0)) return true;
        for (let b = 0; b < 8; b++) {
          const a = ((b + 0.5) / 8 - 0.5) * TAU, R = 0.5 * Math.max(g.hh > 0 ? g.rh[b] - 0.3 : 0, g.hl > 0 ? g.rl[b] - 0.3 : 0);
          if (inMine(g.cx + Math.sin(a) * R, g.cz + Math.cos(a) * R, false)) return true;
        }
      }
      return false;
    };
    const hero = await buildHero(ctx, { palette: look.palette, tones: look.tones, detail, sun: [sunLocal.x, sunLocal.y, sunLocal.z], flock: true, plan, sEye: M.eye,
      keep: keepCard(toWorld), air: (x, y, z) => airOf(PX - x, y, PZ - z), airWide: (x, y, z) => { const wx = PX - x, wz = PZ - z; let best = 1e18; for (let i = 0; i <= CN; i++) { const dx = cX[i] - wx, dy = cY[i] - y, dz = cZ[i] - wz, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); } });
    hero.object.position.set(PX, 0, PZ); hero.object.rotation.y = Math.PI; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    STYLE.uSun.value.copy(look.sun);
    await ctx.yield();
    // ---- zones: each a facet builder -> hull mesh, flat shadow, leaf cards ------------------------------------------
    const ell = (cx, cy, cz, rx, ry, rz) => (o, d) => {
      const ox = (o.x - cx) / rx, oy = (o.y - cy) / ry, oz = (o.z - cz) / rz, dx = d.x / rx, dy = d.y / ry, dz = d.z / rz;
      const a = dx * dx + dy * dy + dz * dz, b = ox * dx + oy * dy + oz * dz, c = ox * ox + oy * oy + oz * oz - 1;
      if (c < 0) return false; const disc = b * b - a * c; return disc > 0 && -b - Math.sqrt(disc) > 0.3 * a;
    };
    const box = (x0, x1, y1, z0, z1) => (o, d) => {
      let t0 = 0.3, t1 = 1e5;
      for (const [p, v, lo, hi] of [[o.x, d.x, x0, x1], [o.y, d.y, -1, y1], [o.z, d.z, z0, z1]]) {
        if (Math.abs(v) < 1e-6) { if (p < lo || p > hi) return false; continue; }
        let a = (lo - p) / v, b = (hi - p) / v; if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false;
      }
      return true;
    };
    const bigOcc = [box(HEDGE_X - 3, HEDGE_X + 3, HEDGE_H, -300, 196), box(WALL_X - 4, WALL_X + 4, WALL_H, -300, 196), box(-600, GATE_X - TOWER_X, 25, GATE_Z - 1.5, GATE_Z + 8),
      ell(PX, 42, PZ + 16, 44, 30, 8), ell(PX, 30, PZ - 4, 12.5, 12, 13.5), ell(PX, 8, PZ, 40, 12, 40)];
    bigOcc[0].tag = 'hedge'; bigOcc[1].tag = 'wall'; bigOcc[2].tag = 'gate';
    // the rest of the gate's wall: the far wing, the shoulders and the gable (a box inside its round top); the wall's
    // faces and its golden trims carry the tag, so the wall's own boxes do not shade its own outer skin
    for (const b of [box(GATE_X + TOWER_X, 700, 25, GATE_Z - 1.5, GATE_Z + 8), box(GATE_X - TOWER_X, GATE_X + TOWER_X, SHOULDER, GATE_Z - 1.5, GATE_Z + 8), box(GATE_X - 9, GATE_X + 9, GATE_Y + 9, GATE_Z - 1.5, GATE_Z + 8)]) { b.tag = 'gate'; bigOcc.push(b); }
    const zones = [], stats = { hullTris: 0, cards: 0, cardsNotMade: 0, formsNotMade: 0, formsInBody: 0 };
    const zone = (name, cardMax) => {
      const F = makeFacets(rng.fork ? rng.fork('zone-' + name) : rng, look.sun);
      F.occluders.push(...bigOcc); F.keep = keepCard(null);
      const Z = { name, F, cardMax, clipSrc: [] }; zones.push(Z); return Z;
    };
    // card density falls away from the path: the marks are for the eye that passes
    const setDensity = (F, x, y, z, k = 1) => {
      const d = path.distanceTo(x, y, z);
      F.edgeMult = k * (d < 28 ? 1.5 : d < 70 ? 0.8 : d < 180 ? 0.4 : 0.16); F.furMult = k * (d < 28 ? 15 : d < 70 ? 6 : d < 180 ? 2.2 : 0.7);
      return d;
    };
    const damp = [];                                            // [x, z, r] damp discs under every foot
    // one form: type from RECIPES, foot at (x, y0, z), height hgt; stage 'crisp' (cut before we came: 30 to 630 days of
    // regrowth on it, a state by chance), 'shaggy' (a lump, not cut while we are here) or a cut law (a route metre or
    // fn(p) -> route metre): then it is hull and lump both
    // THE LAW FOR A FORM CUT AS WE PASS: the shear reaches its top `lead` m of route short of the eye's nearest pass of
    // it and runs down to its foot over `span` m of route
    const addForm = (Z, type, x, z, hgt, o = {}) => {
      const frng = Z.F.rngForms || (Z.F.rngForms = rng.fork ? rng.fork('forms-' + Z.name) : rng);
      const s = hgt / NAT_H[type], old = o.old ?? frng(), lean = old > 0.55 ? (old - 0.55) / 0.45 * 0.14 : 0, leanDir = frng() * TAU;
      const xf = placement(x, o.y0 ?? 0, z, o.yaw ?? frng() * TAU, o.lean ?? lean, o.leanDir ?? leanDir, s);
      const stage = o.stage ?? 'crisp', cut = stage === 'crisp' ? -(30 + 600 * frng()) : stage === 'shaggy' ? 1e6 : stage;
      let LmK = null;
      const make = (F, r) => {
        const B = { F, xf, rng: r, cut, o: (plant, extra) => ({ plant: o.plant ?? plant, cut, edge: 0.34, fur: 0.035, tag: o.tag, ...extra }) };
        let Lm;
        if (stage === 'shaggy') Lm = { h: NAT_H[type] * 0.96, r: type === 'peacock' ? 4.4 : 2.9, cz: 0, ez: 0.2, taper: (type === 'cone' || type === 'spiral' || type === 'obelisk') ? 1 : 0 };
        else Lm = RECIPES[type](B);
        LmK = Lm;
        if (stage !== 'crisp') { lump({ ...B, kind: o.fast ? 2 : 1 }, Lm, noise, o.shag ?? 1); }
      };
      const bodySeed = Math.floor(frng() * 4294967296) >>> 0;              // the lay-out and the build draw the same numbers: the form measured is the form made
      const lay = formLay(x, z, (D) => make(D, makeRng(bodySeed)));
      if (!lay) { stats.formsNotMade++; return null; }                     // it would stand in the eye's clear air: it is not there
      if ((o.y0 ?? 0) < 0.5 && !o.sure && footInBody(lay)) { stats.formsInBody++; stats['inBody-' + Z.name] = (stats['inBody-' + Z.name] || 0) + 1; if (Z.name !== 'court' && Z.name !== 'far') (stats.inBodyAt = stats.inBodyAt || []).push([Z.name, type, Math.round(x), Math.round(z), Math.round(hgt)]); return null; }   // it would stand in a body: it is not there
      setDensity(Z.F, x, (o.y0 ?? 0) + hgt * 0.5, z, o.dens ?? 1);
      make(Z.F, makeRng(bodySeed));
      solids.push(lay);
      if ((o.y0 ?? 0) < 0.5) damp.push([x, z, 2.9 * s + 0.7]);
      // a ring of n + 1 places round the form's lump at the share v of the lump's height, `proud` m off its face (lump())
      const ring = (v, n = 8, proud = 0.35) => {
        const Lk = LmK, top = Lk.h * 1.07 + 0.4, r0 = (Lk.r * 1.12 + 0.3) * (Lk.taper ? 1 - 0.86 * v : Math.sqrt(Math.max(0, 1 - 0.93 * v * v))), pts = [];
        for (let q = 0; q <= n; q++) { const a = q / n * TAU, rr = r0 * (1 + (Lk.ez || 0) * Math.cos(a) * Math.cos(a)) + proud / s; pts.push(xf(Math.sin(a) * rr, top * v, Math.cos(a) * rr + (Lk.cz || 0))); }
        return pts;
      };
      return { x, z, hgt, s, xf, cut, ring, lean: o.lean ?? lean, leanDir: o.leanDir ?? leanDir, top: xf(0, NAT_H[type], 0) };
    };
    const passCut = (x, y, z, hgt, lead, span) => { const s0 = passOf(x, y + hgt * 0.5, z) - lead; return (p) => s0 + span * (1 - Math.min(1, Math.max(0, (p.y - y) / hgt))); };
    // ---- zone 1: the Kilometre Wall we ride, its finials on their piers, the back hedge with buttresses ------------
    // THE LAW OF THE WALL: three cuts in echelon (top plane, right chamfer, left chamfer) stand WALL_AHEAD m ahead of
    // the eye along the wall when we come in and run on ahead of us, WALL_RUN m of wall to each metre of route flown;
    // the back hedge's top is cut by a fourth front that starts 72 m up the hedge and runs at the same rate
    const WALL_RUN = 1.57, WALL_AHEAD = [14, 10, 6], frontS = (z0) => (p) => (p.z - z0) / WALL_RUN;
    const cutTop = frontS(WALL_AHEAD[0]), cutRight = frontS(WALL_AHEAD[1]), cutLeft = frontS(WALL_AHEAD[2]), cutHedge = frontS(72);
    const ZW = zone('wall', 60000 * detail), FW = ZW.F, wr = rng.fork ? rng.fork('wall') : rng;
    {
      const z0 = -30, z1 = 196, n = Math.round((z1 - z0) / 4), j = (s = 0.15) => wr.range(-s, s);
      // cross-section (x, y) from the right foot over the top to the left foot; right is -X
      const SEC = [[-4, 0], [-4.15, 6.5], [-4, 12.4], [-2.5, 14], [0, 14.05], [2.5, 14], [4, 12.4], [4.15, 6.5], [4, 0]];
      const cutOf = [cutRight, cutRight, cutRight, cutTop, cutTop, cutLeft, cutLeft, cutLeft];
      const nrmOf = [V(-1, 0, 0), V(-1, 0, 0), V(-1, 1, 0), V(0, 1, 0), V(0, 1, 0), V(1, 1, 0), V(1, 0, 0), V(1, 0, 0)];
      FW.edgeMult = 1.5; FW.furMult = 15;
      for (let k = 0; k < SEC.length - 1; k++) {
        const near = k >= 2 && k <= 5;                             // the planes under the eye carry the marks
        sheet(FW, n, 1, (u, v, i, jj) => { const a = SEC[k + jj]; return V(WALL_X + a[0] + (a[1] > 0.1 ? j(0.13) : 0), a[1] + (a[1] > 0.1 ? j(0.07) : 0), z0 + (z1 - z0) * u + j(0.3)); },
          { plant: 0, cut: cutOf[k], nrm: nrmOf[k], edge: near ? 0.5 : 0.12, fur: near ? 0.07 : 0.012, tag: 'wall' });
        await ctx.yield();
      }
      sheet(FW, 2, 2, (u, v) => V(WALL_X - 4 + 8 * u, 14 * v - (v > 0.99 && u !== 0.5 ? 1.6 : 0), z1), { plant: 0, cut: -400, nrm: V(0, 0, 1), edge: 0.3, fur: 0.02 });
      setDensity(FW, WALL_X, 10, z1 + 3, 1);
      lathe(FW, placement(WALL_X, 0, z1 + 2.5, 0.39), [[5.4, 0], [5.0, 13.6], [5.7, 14.4], [5.7, 15.8], [4.2, 16.8], [1.5, 16.8], [1.5, 17.6], [2.5, 18.8], [2.3, 20.4], [0, 22]], 8, (k) => ({ plant: k === 2 || k >= 6 ? 2 : 0, cut: -350, edge: 0.4, fur: 0.06 }), wr, { jit: 0.08 });
      damp.push([WALL_X, z1 + 2.5, 6.8]);
      // the uncut cap: gold fur over the top and both shoulders, sheared away by the three fronts (kind 2: a fast front)
      const CAP = [[-4.9, 8.5], [-4.9, 12.9], [-2.9, 15.0], [0, 15.25], [2.9, 15.0], [4.9, 12.9], [4.9, 8.5]];
      const capCut = [cutRight, cutRight, cutTop, cutTop, cutLeft, cutLeft], capN = [V(-1, 0, 0), V(-1, 1, 0), V(0, 1, 0), V(0, 1, 0), V(1, 1, 0), V(1, 0, 0)];
      for (let k = 0; k < CAP.length - 1; k++) {
        sheet(FW, n, 1, (u, v, i, jj) => { const a = CAP[k + jj], z = z0 + (z1 - z0) * u; return V(WALL_X + a[0] + j(0.2), a[1] + 0.45 * noise.fbm2(z * 0.11, a[0] * 0.4 + 3, 2) + j(0.12), z + j(0.4)); },
          { plant: 0, kind: 2, cut: capCut[k], nrm: capN[k], edge: 0.3, fur: k >= 1 && k <= 4 ? 0.2 : 0.07, len: [0.3, 0.75] });
        await ctx.yield();
      }
      ZW.clipSrc.push({ n: 900, at: () => { const z = wr.range(4, 150), k = wr.int(0, 2), x = WALL_X + (k === 0 ? wr.range(-2.4, 2.4) : k === 1 ? wr.range(-4.6, -2.6) : wr.range(2.6, 4.6)); return { p: V(x, k === 0 ? 15.4 : 14.2, z), cut: (k === 0 ? cutTop : k === 1 ? cutRight : cutLeft)({ z }), floor: k === 0 ? 14.08 : (k === 1 ? (wr() < 0.6 ? 0 : 13.3) : 13.3), out: k === 1 ? -1 : k === 2 ? 1 : 0 }; } });
      ZW.clipSrc.push({ n: 1300, at: () => { const x = WALL_X + wr.range(-3.9, 3.9), z = wr.range(-6, 80), top = wallTopAt(x, z); return { p: V(x, top + 0.07, z), cut: -100, floor: top + 0.03, out: 0, still: 1 }; } });   // litter on the top plane and on both chamfers, each piece on the face under it
      // litter on the gravel within 15 m of the course: along the Walk and the court (two in three), along the Gate Walk
      ZW.clipSrc.push({ n: 2600, at: () => { const d = wr() < 0.66 ? wr.range(M.walk - 16, M.crest) : wr.range(M.gateWalk - 14, M.gate - 5), p = path.posAtDist(d), a = wr() * TAU, r = wr.range(1, 15); return { p: V(p.x + Math.sin(a) * r, 0.05, p.z + Math.cos(a) * r), cut: -100, floor: 0, out: 0, still: 1 }; } });
      // finials every 16 m on the right edge: ball, cone, spiral or dove, 5 m tall, cut by the right-hand front
      const kinds = ['ball', 'cone', 'spiral', 'dove'];
      ZW.finials = [];
      for (let z = 2; z < 192; z += 16) {
        const type = kinds[wr.int(0, 3)], fx = PIER_X;
        // a pier under each finial, on the wall's Walk side: yew from the gravel to the wall's top plane, wide enough
        // to carry the finial's whole foot, so the long face reads in two tones (a pier's face toward us is lit, the
        // wall behind it is not); none where the course drops off the wall (its top keeps 3.1 m and its own half
        // diagonal from the course); the finial has a rule of its own below (4.9 m), so beside the course's turn off the
        // wall a pier may stand bare
        if (clearOf(fx, 14, z, 3.1 + 3.2) && clearOf(fx, 9, z, 3.1 + 3.2)) {
          const xa = fx - PIER_W, xb = WALL_X - 2.5, PY = 14.03, po = { plant: 0, cut: -250, ref: V(fx + 1, 7, z), edge: 0.35, fur: 0.012, tag: 'wall' };
          sheet(FW, 1, 4, (u, v) => V(xa - 0.35 * (1 - v) + (v > 0 && v < 1 ? j(0.08) : 0), PY * v, z - PIER_W + 2 * PIER_W * u), po);
          for (const zs of [z - PIER_W, z + PIER_W]) sheet(FW, 1, 4, (u, v) => { const x0 = xa - 0.35 * (1 - v); return V(x0 + (xb - x0) * u, PY * v, zs); }, po);
          sheet(FW, 1, 1, (u, v) => V(xa + (xb - xa) * u, PY, z - PIER_W + 2 * PIER_W * v), po);
          wbutts.push(z);
        }
        if (!clearOf(fx, 16.5, z, 4.9)) continue;
        const fh = 5 + wr.range(-0.3, 0.5), fyaw = wr.range(-0.5, 0.5);
        const mk = (ty) => addForm(ZW, ty, fx, z, fh, { y0: 14, yaw: ty === 'dove' ? fyaw : undefined, stage: (p) => cutRight({ z }) + 1.9 * (1 - Math.min(1, Math.max(0, (p.y - 14) / 5))), fast: true, plant: ty === 'dove' ? 1 : undefined, old: 0.2, dens: 0.45, shag: 1.2 });
        const f = mk(type) || (type === 'dove' ? mk('ball') : null);        // a dove whose tail would stand in the eye's clear air is a ball instead
        if (f) ZW.finials.push(f);
        await ctx.yield();
      }
      // the back hedge on the left: HEDGE_H (12 m) to its cut top, buttressed, well under the eye; its top is being cut too
      const hx = HEDGE_X - 3, hz1 = 214, hn = Math.round((hz1 - z0) / 6);
      const HSEC = [[0, 0], [-0.25, 0.35 * HEDGE_H], [0, 0.65 * HEDGE_H], [0.1, 24.3 + HD], [1.6, 26 + HD], [3, 26.1 + HD], [4.6, 26 + HD], [6, 24.3 + HD], [6, 0]];
      const hN = [V(-1, 0, 0), V(-1, 0, 0), V(-1, 0, 0), V(-1, 1, 0), V(0, 1, 0), V(0, 1, 0), V(1, 1, 0), V(1, 0, 0)];
      FW.edgeMult = 0.8; FW.furMult = 5;
      for (let k = 0; k < HSEC.length - 1; k++) {
        sheet(FW, hn, 1, (u, v, i, jj) => { const a = HSEC[k + jj]; return V(hx + a[0] + (a[1] > 0.1 ? j(0.16) : 0), a[1] + (a[1] > 0.1 ? j(0.1) : 0), z0 + (hz1 - z0) * u + j(0.4)); },
          { plant: 0, cut: k >= 3 ? cutHedge : -300, nrm: hN[k], edge: k < 5 ? 0.3 : 0.05, fur: k < 5 ? 0.07 : 0, tag: 'hedge' });
        await ctx.yield();
      }
      for (let z = -18; z < hz1 - 6; z += 24) {                   // buttresses: a battered pier with a sloped cap
        const zc = z + j(1.2), w = 2.4, BH = 22 + HD, pr = (y) => 4.2 - 1.6 * (y / BH); butts.push(zc);
        sheet(FW, 3, 3, (u, v, i, jj) => { const y = BH * v, out = pr(y) + (v > 0.99 ? -3.2 : 0); const q = [[0, -w], [-out, -w * 0.8], [-out, w * 0.8], [0, w]][i]; return V(hx + q[0] + j(0.1), y + j(0.08), zc + q[1] + j(0.1)); },
          { plant: 0, cut: -250, ref: V(hx + 1, BH / 2, zc), edge: 0.35, fur: 0.012, tag: 'hedge' });
      }
      const HCAP = [[-0.9, 20.5 + HD], [-0.9, 24.6 + HD], [1.2, 27.0 + HD], [3, 27.3 + HD], [4.8, 27.0 + HD], [6.9, 24.6 + HD]], hcN = [V(-1, 0, 0), V(-1, 1, 0), V(0, 1, 0), V(0, 1, 0), V(1, 1, 0)];
      for (let k = 0; k < HCAP.length - 1; k++) {
        sheet(FW, hn, 1, (u, v, i, jj) => { const a = HCAP[k + jj], z = z0 + (hz1 - z0) * u; return V(hx + a[0] + j(0.25), a[1] + 0.6 * noise.fbm2(z * 0.09 + 20, a[0] * 0.4, 2) + j(0.15), z + j(0.5)); },
          { plant: 0, kind: 2, cut: cutHedge, nrm: hcN[k], edge: 0.3, fur: k < 3 ? 0.16 : 0.03, len: [0.35, 0.85] });
        await ctx.yield();
      }
      ZW.clipSrc.push({ n: 700, at: () => { const z = wr.range(6, 210); return { p: V(hx + wr.range(-1.1, -0.35), wr.range(21.5, 25.5) + HD, z), cut: cutHedge({ z }), floor: 0, out: -0.35 }; } });   // off the cap's front shoulder
    }
    // ---- zone 2: the Long Walk: leaning cones, spirals and birds, three buttress arches, the dove that is found ------
    const CAST = look.cast === 'geometry' ? ['obelisk', 'spiral', 'cakestand', 'cone', 'ball'] : look.cast === 'beasts' ? ['dove', 'hare', 'cockerel', 'hound', 'owl', 'snail', 'swan', 'hare', 'peacock'] : ['dove', 'cockerel', 'swan', 'owl', 'peacock'];
    const ZK = zone('walk', 62000 * detail), FK = ZK.F, kr = rng.fork ? rng.fork('walk') : rng;
    // THE LAWS OF THE WALK: a form cut as we pass (the dove beside the course among them) is reached at its top 24 m of
    // route short of the eye's nearest pass of it, its foot 17 m on; an arch's gold cap is sheared across from its
    // right end, reached 36 m short of the eye's pass under the arch, to its left end 19 m on
    const WALK_LEAD = 24, WALK_SPAN = 17, ARCH_LEAD = 36, ARCH_SPAN = 19;
    const DOVE = { x: 41.3, z: 127, h: 9 };
    const strings = [];                                          // [a, b, width, the route metre after which it is gone] for the tackle
    {
      // the dove (made first; its typed place stands clear of the arches, so it is not asked footInBody): a shaggy lump 9 m tall, its axis 8.4 m to our left, cut from the head down as we pass
      const dv = addForm(ZK, 'dove', DOVE.x, DOVE.z, DOVE.h, { yaw: -2.2, old: 0.1, dens: 1.5, shag: 1.3, stage: passCut(DOVE.x, 0, DOVE.z, DOVE.h, WALK_LEAD, WALK_SPAN), sure: true });
      if (dv) ZK.clipSrc.push({ n: 420, at: () => { const a = kr() * TAU, y = kr.range(1, DOVE.h * 1.05), r = 3.6 * Math.sqrt(Math.max(0.05, 1 - (y / 10) * (y / 10))); return { p: V(DOVE.x + Math.sin(a) * r, y, DOVE.z + Math.cos(a) * r), cut: dv.cut({ y }), floor: 0, out: 0, ox: Math.sin(a), oz: Math.cos(a) }; } });
      let i = 0;
      for (let z = 80; z < 190; z += 9, i++) for (const s of [1, -1]) {
        if (Math.abs(z - 110) < 5 || Math.abs(z - 140) < 5 || Math.abs(z - 170) < 5) continue;
        const x = 30 + s * 13.6, isDove = s > 0 && Math.abs(z - DOVE.z) < 9;
        if (isDove) continue;
        const cone = (i + (s > 0 ? 0 : 1)) % 3 === 0, type = cone ? 'cone' : (kr() < 0.4 ? 'spiral' : CAST[kr.int(0, CAST.length - 1)]);
        const hgt = cone ? kr.range(16.5, 19) : kr.range(9, 14), r = 2.9 * hgt / NAT_H[type];
        const sr = kr(), xx = x + s * Math.max(0, r - 4.4);
        // stages: every one at once. Some are cut as we come up to them, top first
        const stage = sr < 0.36 ? 'crisp' : sr < 0.6 ? 'shaggy' : passCut(xx, 0, z, hgt, WALK_LEAD, WALK_SPAN);
        if (!clearOf(xx, 5, z, r + 5.5)) continue;
        const f = addForm(ZK, type, xx, z, hgt, { yaw: (s > 0 ? -1 : 1) * Math.PI / 2 + kr.range(-0.5, 0.5), stage, lean: cone ? kr.range(0.05, 0.13) : undefined, leanDir: cone ? (s > 0 ? -1 : 1) * Math.PI / 2 + kr.range(-0.4, 0.4) : undefined });
        await ctx.yield();
      }
      if (dv) for (const v of [0.2, 0.4, 0.6, 0.8]) { const R = dv.ring(v, 10); for (let q = 0; q < 10; q++) strings.push([R[q], R[q + 1], 0.07, Math.min(dv.cut(R[q]), dv.cut(R[q + 1])) - 1.5]); }   // four strings round its lump, on the fur
      await ctx.yield();
      // three buttress arches, 13 m wide, each taller than the last (12, 15.5 and 19.5 m), an uncut gold cap on each
      // being sheared across as we come
      for (const [az, H] of ARCHES) {
        const R = 6.5, sp = H - (H > 14 ? 6.5 : 4), ry = H - sp, RO = R + 2.1;
        const inner = (t) => (t < 0.25 ? [-R, sp * t / 0.25] : t > 0.75 ? [R, sp * (1 - t) / 0.25] : [R * Math.cos(Math.PI * (1 - (t - 0.25) / 0.5)), sp + ry * Math.sin(Math.PI * (t - 0.25) / 0.5)]);
        const outer = (t) => (t < 0.25 ? [-RO, (sp + 0.6) * t / 0.25] : t > 0.75 ? [RO, (sp + 0.6) * (1 - t) / 0.25] : [RO * Math.cos(Math.PI * (1 - (t - 0.25) / 0.5)), sp + 0.6 + (ry + 1.5) * Math.sin(Math.PI * (t - 0.25) / 0.5)]);
        const topY = (x) => sp + 0.6 + (ry + 1.5) * Math.sqrt(Math.max(0, 1 - (x / RO) * (x / RO)));
        const capY = (x) => topY(x) + 1.3 - 2.2 * (th + 0.5) / (th + 0.9) + 0.4 * noise.fbm2(x * 0.3, az, 2);   // the gold cap's face where its strings lie, 0.5 m in from its edge
        const N = 16, j = (s = 0.12) => kr.range(-s, s), sA = sAtZ(az), th = 1.3, ref = V(30, sp + 1, az);
        setDensity(FK, 30, 12, az, 1.3);
        const aCut = az === 110 ? -120 : -400, capCut = (p) => sA - ARCH_LEAD + ARCH_SPAN * (p.x - 22) / 16;
        for (const side of [-1, 1]) sheet(FK, N, 1, (u, v, i, jj) => { const q = (jj ? outer : inner)(i / N); return V(30 + q[0] + j(), q[1] + (q[1] > 0.1 ? j() : 0), az + side * th + j(0.08)); }, { plant: 0, cut: aCut, nrm: V(0, 0, side), edge: 0.5, fur: 0.09 });
        sheet(FK, N, 1, (u, v, i, jj) => { const q = inner(i / N); return V(30 + q[0], q[1], az + (jj ? th : -th)); }, (i, jj, c) => ({ plant: 0, cut: aCut, ref: V(30 + (c.x - 30) * 2, c.y < sp ? c.y : 60, az), edge: 0.3, fur: 0.02 }));
        sheet(FK, N, 1, (u, v, i, jj) => { const q = outer(i / N); return V(30 + q[0], q[1], az + (jj ? th : -th)); }, (i, jj, c) => ({ plant: i >= 4 && i < 12 ? 2 : 0, cut: capCut, ref, edge: 0.4, fur: 0.03 }));
        sheet(FK, 10, 2, (u, v) => { const x = -7.6 + 15.2 * u; return V(30 + x, topY(x) + (v === 0.5 ? 1.3 : -0.9) + 0.4 * noise.fbm2(x * 0.3, az, 2), az + (v - 0.5) * 2 * (th + 0.9)); }, { plant: 0, kind: 2, cut: capCut, nrm: V(0, 1, 0), edge: 0.5, fur: 0.25, len: [0.35, 0.85] });
        ZK.clipSrc.push({ n: 200, at: () => { const x = kr.range(-7.5, 7.5); return { p: V(30 + x, topY(x) + 0.8, az + kr.range(-2, 2)), cut: capCut({ x: 30 + x }), floor: 0, out: 0, oz: kr() < 0.5 ? -1 : 1 }; } });
        for (const sz of [-1, 1]) for (let q = 0; q < 8; q++) { const xa = -7.6 + q * 1.9, xb = xa + 1.9; strings.push([V(30 + xa, capY(xa) + 0.45, az + sz * (th + 0.5)), V(30 + xb, capY(xb) + 0.45, az + sz * (th + 0.5)), 0.07, Math.min(capCut({ x: 30 + xa }), capCut({ x: 30 + xb })) - 1.5]); }   // on the cap's fur, 0.45 m proud of its face
        damp.push([30 - 7.6, az, 2.6], [30 + 7.6, az, 2.6]);
        await ctx.yield();
      }
    }
    // ---- zone 3: the round court: the lesser forms in rings round the Peacock, three to seven in ten of them crisp by this visit's chance ----
    const ZC = zone('court', 56000 * detail), cr = rng.fork ? rng.fork('court') : rng;
    // THE LAWS OF THE COURT: a lesser form found as we pass (within 46 m of the course, by chance 45 in a hundred, its
    // nearest pass lying between the court's rim and 35 m short of our eye of the fan) is reached at its top 19 m of
    // route short of that pass, its foot 14 m on. THE RARE LONG CUT: one front enters at the court's near left when the
    // eye crosses the court's rim and crosses the whole court in 38 m of route (each form top to foot in 3 m)
    const COURT_LEAD = 19, COURT_SPAN = 14, LONG_SPAN = 38;
    const longCut = (x, z) => M.rim + LONG_SPAN * Math.min(1, Math.max(0, ((PX + 84 - x) + 0.3 * (z - 196)) / 219));
    const courtForms = [];
    {
      const RINGS = [64, 70, 76, 82], tot = RINGS.reduce((a, b) => a + b, 0);
      for (let ri = 0; ri < RINGS.length; ri++) {
        const R = RINGS[ri], n = Math.round(look.count * 1.5 * R / tot), a0 = cr() * TAU;
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + cr.range(-0.18, 0.18)) / n * TAU, x = PX + Math.sin(a) * R, z = PZ + Math.cos(a) * R;
          const type = CAST[cr.int(0, CAST.length - 1)], hgt = Math.min(12, 5.2 + ri * 0.9 + cr.range(0, 4.4)), rad = 3.0 * hgt / NAT_H[type], sr = cr(), er = cr();
          if ((Math.abs(x - 30) < 8 && z < PZ) || (Math.abs(x - GATE_X) < 42 + rad && z > PZ)) continue;       // the Walk and the Gate Walk (its avenue, wide at this end) run in
          const pd = path.distanceTo(x, hgt * 0.5, z);
          if (pd < rad + 6.2 || !clearOf(x, hgt, z, rad * 0.5 + 6)) continue;
          const s0 = passOf(x, hgt * 0.5, z);
          let stage = sr < look.crisp ? 'crisp' : 'shaggy';
          if (pd < 46 && er < 0.45 && s0 > M.rim && s0 < M.eye - 35) stage = passCut(x, 0, z, hgt, COURT_LEAD, COURT_SPAN);   // found as we pass
          if (look.rare) { const c = longCut(x, z); stage = (p) => c + 3 * (1 - Math.min(1, p.y / hgt)); }
          const yaw = Math.atan2(x - PX, z - PZ) + (cr() < 0.7 ? 0 : Math.PI) + cr.range(-0.4, 0.4);
          const f = addForm(ZC, type, x, z, hgt, { yaw, stage, fast: look.rare });
          if (f) courtForms.push(f);
          await ctx.yield();
        }
      }
      if (look.rare) ZC.clipSrc.push({ n: 1500, at: () => { const f = courtForms[cr.int(0, courtForms.length - 1)], a = cr() * TAU, r = f.hgt * 0.3, y = f.hgt * cr.range(0.3, 1.05); return { p: V(f.x + Math.sin(a) * r, y, f.z + Math.cos(a) * r), cut: longCut(f.x, f.z) + 3 * (1 - Math.min(1, y / f.hgt)), floor: 0, out: 0, ox: Math.sin(a), oz: Math.cos(a) }; } });
    }
    // ---- zone 4: the Gate Walk and the moon gate in its round gable -------------------------------------------------
    const ZG = zone('gate', 46000 * detail), FG = ZG.F, gr = rng.fork ? rng.fork('gate') : rng;
    const gz = GATE_Z - 1.5, gateAng = (x, y) => { let a = Math.atan2(x - GATE_X, -(y - GATE_Y)) + 0.7; if (a < 0) a += TAU; return a / TAU; };   // 0..1 round the rim, starting low on one side
    // THE LAW OF THE MOON GATE: the shear starts low on the rim GATE_LEAD m of route short of the eye's pass through the
    // gate and goes once round it over GATE_SPAN m, so the ring stands whole for the last GATE_LEAD - GATE_SPAN
    // m (more than the whole level run to the gate). A form of the Gate Walk cut as we pass is reached at its top 28 m of
    // route short of the eye's nearest pass of it, its foot 19 m on.
    const GATE_LEAD = 140, GATE_SPAN = 78, GW_LEAD = 28, GW_SPAN = 19;
    const gateCut = (p) => M.gate - GATE_LEAD + GATE_SPAN * gateAng(p.x, p.y);
    // for a facet: its corners' shares round the rim are taken on the side of the seam its centre lies on, so the facet
    // that spans the seam is cut at the seam's own moment and not in one slow sweep
    const gateCutOf = (c) => { const ac = gateAng(c.x, c.y); return (p) => { let a = gateAng(p.x, p.y); if (a - ac > 0.5) a = 0; else if (ac - a > 0.5) a = 1; return M.gate - GATE_LEAD + GATE_SPAN * a; }; };
    {
      const j = (s = 0.12) => gr.range(-s, s), NA = 28;
      const rim = (r, zz) => (i) => { const t = i / NA * TAU; return V(GATE_X + Math.sin(t) * r + j(0.05), GATE_Y + Math.cos(t) * r + j(0.05), zz); };
      // THE GABLE'S OUTLINE (typed; the same on every seed): a round top GABLE_R about the gate's own centre down to the
      // shoulders' face top, then upright sides to the ground; the corner where the two meet and each side's foot are corners of the outline
      const SF = SHOULDER - 1.8, GH = SF - GATE_Y, GW = Math.sqrt(GABLE_R * GABLE_R - GH * GH);
      const outline = (i) => {
        const t = i / NA * TAU, s = Math.sin(t), c = Math.cos(t), sg = s < 0 ? -1 : 1;
        if (c * GABLE_R >= GH) return [s * GABLE_R, c * GABLE_R];
        if (Math.cos((i - sg) / NA * TAU) * GABLE_R >= GH) return [sg * GW, GH];
        // on a bearing from the gate's centre: how far out the outline lies, and whether it is the ground there
        const out = (ii) => { const a = ii / NA * TAU, sa = Math.max(Math.abs(Math.sin(a)), 1e-3), ca = Math.max(Math.abs(Math.cos(a)), 1e-3); return [Math.min(GW / sa, GATE_Y / ca), GATE_Y / ca < GW / sa]; };
        const [k, low] = out(i);
        if (c < 0 && low && !out(i - sg)[1]) return [sg * GW, -GATE_Y];                     // the first corner on the ground is the side's own foot
        return c > 0 ? [sg * GW, Math.min(GH - 0.6, c * k)] : [s * k, c * k];
      };
      const edgeOf = (i) => { const [x, y] = outline(i); return V(GATE_X + x, GATE_Y + y, gz + j(0.1)); };
      setDensity(FG, GATE_X, GATE_Y, gz - 20, 1.2);
      const ringS = (pa, pb, o) => sheet(FG, NA, 1, (u, v, i, jj) => (jj ? pb : pa)(i), o, true);
      ringS(rim(7.5, gz + 4), rim(7.5, gz - 0.2), (i, jj, c) => ({ plant: 2, cut: gateCutOf(c), ref: V(GATE_X + (c.x - GATE_X) * 3, GATE_Y + (c.y - GATE_Y) * 3, gz), edge: 0.3, fur: 0 }));
      ringS(rim(7.5, gz - 0.2), rim(8.3, gz - 0.9), (i, jj, c) => ({ plant: 2, cut: gateCutOf(c), nrm: V(0, 0, -1), edge: 0.8, fur: 0.08 }));
      ringS(rim(8.3, gz - 0.9), rim(9.3, gz - 0.9), (i, jj, c) => ({ plant: 2, cut: gateCutOf(c), nrm: V(0, 0, -1), edge: 0.6, fur: 0.08 }));
      ringS(rim(9.3, gz - 0.9), rim(9.5, gz), (i, jj, c) => ({ plant: 2, cut: gateCutOf(c), ref: V(GATE_X, GATE_Y, gz + 3), edge: 0.6, fur: 0.05 }));
      ringS(rim(9.5, gz), edgeOf, { plant: 0, cut: -300, nrm: V(0, 0, -1), edge: 0.4, fur: 0.1, tag: 'gate' });
      await ctx.yield();
      // the wall beyond the towers either side: battered face, chamfered top, piers every 30 m
      for (const [x0, x1, n, fine] of [[GATE_X + TOWER_X + 2, GATE_X + 135, 13, true], [GATE_X - 135, GATE_X - TOWER_X - 2, 13, true], [GATE_X + 135, 640, 10, false], [-560, GATE_X - 135, 9, false]]) {
        setDensity(FG, (x0 + x1) / 2, 12, gz, fine ? 1 : 0.6);
        sheet(FG, n, 2, (u, v) => V(x0 + (x1 - x0) * u + (u > 0 && u < 1 ? j(0.4) : 0), v * 23.2 + (v > 0 ? j(0.1) : 0), gz + (u > 0 && u < 1 ? j(0.14) : 0) + 0.2 * v), { plant: 0, cut: -300, nrm: V(0, 0, -1), edge: fine ? 0.4 : 0.1, fur: fine ? 0.09 : 0, tag: 'gate' });
        sheet(FG, n, 1, (u, v, i, jj) => V(x0 + (x1 - x0) * u, 23.2 + jj * 1.8 + (jj ? j(0.1) : 0), gz + 0.4 + jj * 1.8), { plant: 2, cut: -300, nrm: V(0, 1, -1), edge: fine ? 0.5 : 0.1, fur: fine ? 0.03 : 0, tag: 'gate' });
        sheet(FG, n, 1, (u, v, i, jj) => V(x0 + (x1 - x0) * u, 25, gz + 2.2 + jj * 8), { plant: 0, cut: -300, nrm: V(0, 1, 0), edge: 0, fur: 0 });
        await ctx.yield();
      }
      // the gable's round top: a golden-yew chamfer and the top itself, 8 m deep, on the outline's own corners
      {
        const top = []; for (let i = -Math.floor(NA / 4); i <= Math.floor(NA / 4); i++) top.push(outline((i + NA) % NA));
        const gp = (i, grow, zz) => { const [x, y] = top[i], l = Math.hypot(x, y); return V(GATE_X + x * (1 + grow / l), GATE_Y + y * (1 + grow / l), zz); };
        setDensity(FG, GATE_X, GATE_Y + GABLE_R, gz, 1);
        sheet(FG, top.length - 1, 1, (u, v, i, jj) => gp(i, jj * 1.3, gz - 0.15 + jj * 1.95), { plant: 2, cut: -300, ref: V(GATE_X, GATE_Y, gz + 6), edge: 0.5, fur: 0.03, tag: 'gate' });
        sheet(FG, top.length - 1, 1, (u, v, i, jj) => gp(i, 1.3, gz + 1.8 + jj * 8.2), { plant: 0, cut: -300, ref: V(GATE_X, GATE_Y, gz + 6), edge: 0, fur: 0 });
      }
      // the shoulders: low walls from the gable's foot out to the towers, SHOULDER m to their chamfered top
      for (const sg of [-1, 1]) {
        const x0 = GATE_X + sg * GW, x1 = GATE_X + sg * (TOWER_X - 4);
        setDensity(FG, (x0 + x1) / 2, SHOULDER, gz, 1);
        sheet(FG, 3, 2, (u, v) => V(x0 + (x1 - x0) * u + (u > 0 && u < 1 ? j(0.3) : 0), v * SF + (v > 0 && v < 1 ? j(0.1) : 0), gz + (u > 0 && u < 1 ? j(0.1) : 0) + 0.1 * v), { plant: 0, cut: -300, nrm: V(0, 0, -1), edge: 0.4, fur: 0.09, tag: 'gate' });
        sheet(FG, 3, 1, (u, v, i, jj) => V(x0 + (x1 - x0) * u, SF + jj * 1.8, gz + 0.1 + jj * 1.8), { plant: 2, cut: -300, nrm: V(0, 1, -1), edge: 0.5, fur: 0.03, tag: 'gate' });
        sheet(FG, 1, 1, (u, v, i, jj) => V(x0 + (x1 - x0) * u, SHOULDER, gz + 1.9 + jj * 8), { plant: 0, cut: -300, nrm: V(0, 1, 0), edge: 0, fur: 0 });
      }
      await ctx.yield();
      // the gate's two towers, TOWER_X m either side of it, each carrying a great cake-stand 22 m tall; and two tall piers
      // of box with golden-yew caps standing 1.1 m into the shoulders' face, 20 m either side of the gate
      for (const s of [-1, 1]) {
        const tx = GATE_X + s * TOWER_X, tz = gz + 1.5;
        setDensity(FG, tx, 20, tz, 1);
        lathe(FG, placement(tx, 0, tz, Math.PI / 4), [[7.4, 0], [6.9, 24.6], [7.9, 25.8], [7.9, 28], [0, 28]], 4, (kk) => ({ plant: kk === 2 ? 2 : 0, cut: -300, edge: 0.4, fur: 0.02 }), gr, { jit: 0.06 });
        addForm(ZG, 'cakestand', tx, tz, 22, { y0: 28, stage: 'crisp', old: 0.15, lean: 0 });
        lathe(FG, placement(GATE_X + s * 20, 0, gz - 0.6, Math.PI / 4), [[2.4, 0], [2.1, 14.5], [2.7, 15.5], [2.7, 17.5], [0, 20.5]], 4, (kk) => ({ plant: kk >= 2 ? 2 : 1, cut: -300, edge: 0.4, fur: 0.02 }), gr, { jit: 0.06 });
        damp.push([GATE_X + s * 20, gz - 0.6, 3.4]);
      }
      for (let k = -4; k <= 4; k++) { if (k === 0 || Math.abs(k) === 1) continue; const px = GATE_X + k * 30 + (k > 0 ? -8 : 8); lathe(FG, placement(px, 0, gz - 0.6, Math.PI / 4), [[2.6, 0], [2.3, 21], [2.9, 22], [2.9, 26.4], [0, 29.5]], 4, (kk) => ({ plant: kk >= 2 ? 2 : 0, cut: -300, edge: 0.4, fur: 0.02 }), gr, { jit: 0.06 }); }
      // the rag: the gate is a ragged gold hole until the cut has gone round its rim
      sheet(FG, 36, 2, (u, v, i, jj) => { const t = u * TAU, r = jj === 0 ? 5.8 + 1.5 * noise.fbm2(Math.sin(t) * 3 + 5, Math.cos(t) * 3, 2) : jj === 1 ? 8.6 : 11.6 + 1.6 * noise.fbm2(Math.sin(t) * 2 + 15, Math.cos(t) * 2, 2); return V(GATE_X + Math.sin(t) * r, GATE_Y + Math.cos(t) * r, gz - (jj === 1 ? 2.3 : jj === 0 ? 1.1 : 0.5) + j(0.15)); },
        (i, jj, c) => ({ plant: 0, kind: 1, cut: gateCutOf(c), nrm: V(0, 0, -1), edge: 1.2, fur: 0.6, len: [0.45, 0.9] }), true);
      ZG.clipSrc.push({ n: 520, at: () => { const t = gr() * TAU, r = gr.range(6.5, 10); const p = V(GATE_X + Math.sin(t) * r, GATE_Y + Math.cos(t) * r, gz - 2.2); return { p, cut: gateCut(p) + gr.range(0, 1.9), floor: 0, out: 0, oz: -1 }; } });
      for (let q = 0; q < 40; q++) { const p = (i) => { const t = i / 40 * TAU; return V(GATE_X + Math.sin(t) * 7.9, GATE_Y + Math.cos(t) * 7.9, gz - 2.45); }; const a = p(q), b = p(q + 1); strings.push([a, b, 0.07, gateCut(a) - 1.5]); }
      await ctx.yield();
      // the Gate Walk: cake-stands and doves, whose shadows rung the gravel
      // THE AVENUE (typed; the same on every seed): its two rows stand 13.5 m either side of the gate's axis for the
      // level run and open to 30 m either side at the far end, so the way down from the fan runs in between them; its
      // forms stand tallest at the far end (2.3 times) and step down to the gate; the stations stand wider apart
      // where the forms are greater; a station whose form would stand in a body, in a neighbour or in the eye's clear
      // air is left empty (of eighty seeds counted: the third station on our right, a dove, on twelve; the far one on
      // our right, by the Peacock's gold mound, on none, though by its measures it could be on a few in a hundred)
      const AVENUE_Z = [344, 360, 373, 385, 397, 409.5];
      for (let i = 0; i < AVENUE_Z.length; i++) for (const s of [1, -1]) {
        const z = AVENUE_Z[i], far = Math.min(1, Math.max(0, (385 - z) / 41)), tall = 1 + 1.3 * far;
        const type = (i + (s > 0 ? 0 : 1)) % 2 === 0 ? 'cakestand' : (look.cast === 'geometry' ? 'obelisk' : far > 0.3 ? 'spiral' : 'dove'), hgt = (type === 'cakestand' ? gr.range(13, 16) : gr.range(10, 13)) * tall, x = GATE_X + s * (13.5 + 16.5 * far);
        if (!clearOf(x, 10, z, 3.2 * hgt / NAT_H[type] + 6)) continue;
        const sr = gr();
        addForm(ZG, type, x, z, hgt, { yaw: (s > 0 ? -1 : 1) * Math.PI / 2 + gr.range(-0.4, 0.4), old: gr() * 0.75, stage: sr < 0.45 ? 'crisp' : sr < 0.62 ? 'shaggy' : passCut(x, 0, z, hgt, GW_LEAD, GW_SPAN) });
        await ctx.yield();
      }
      damp.push([GATE_X, gz - 1, 11]);
    }
    // ---- zone 5: the rest of the garden: great cones, obelisks, cake-stands and uncut mounds standing in rows -------
    const ZF = zone('far', 22000 * detail), fr = rng.fork ? rng.fork('far') : rng;
    {
      const BIG = ['cone', 'obelisk', 'cone', 'ball', 'obelisk', 'cone', 'cakestand'];
      let n = 0;
      for (let gx = -260; gx <= 330; gx += 37) for (let gzz = 10; gzz <= 425; gzz += 37) {
        const x = gx + fr.range(-5, 5), z = gzz + fr.range(-5, 5), type = BIG[fr.int(0, BIG.length - 1)], hgt = fr.range(12, 23), sr = fr();
        const dC = Math.hypot(x - PX, z - PZ);
        if (dC < 96 || (x > 44 && x < 92 && z < 245) || (x > 14 && x <= 44 && z < 76) || (Math.abs(x - 30) < 24 && z > 66 && z < 200) || (Math.abs(x - GATE_X) < 46 && z > 320) || z > GATE_Z - 16) continue;
        if (!clearOf(x, 8, z, 22)) continue;
        addForm(ZF, type, x, z, hgt, { stage: sr < 0.55 ? 'crisp' : 'shaggy', old: fr() * 0.8, dens: 0.7 });
        n++; await ctx.yield();
      }
      // beyond the gate's shoulders: ten great forms of the next room (typed places; a stream of their own), seen over
      // the shoulders from the Gate Walk and over the whole wall from the way down
      {
        const br = rng.fork ? rng.fork('beyond') : rng;
        for (const [bx, bz] of [[-38, 466], [36, 468], [-54, 482], [52, 480], [-66, 502], [64, 500], [-14, 508], [16, 512], [-40, 524], [42, 526]]) {
          addForm(ZF, BIG[br.int(0, BIG.length - 1)], GATE_X + bx + br.range(-3, 3), bz + br.range(-3, 3), br.range(18, 28), { stage: br() < 0.55 ? 'crisp' : 'shaggy', old: br() * 0.8, dens: 0.7 });
          await ctx.yield();
        }
      }
      // low box hedges closing the Walk's right side and the court's rim: rooms, so the gravel is never a bare plain
      const hedge = (x0, z0, x1, z1, h, w, plant, segs) => {
        const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, j = (s) => fr.range(-s, s);
        setDensity(ZF.F, (x0 + x1) / 2, h, (z0 + z1) / 2, 1);
        const SEC = [[-w, 0], [-w, h - 0.8], [-w + 0.8, h], [w - 0.8, h], [w, h - 0.8], [w, 0]];
        for (let k = 0; k < 5; k++) sheet(ZF.F, segs, 1, (u, v, i, jj) => { const a = SEC[k + jj]; return V(x0 + dx * u + nx * a[0] + (a[1] > 0 ? j(0.12) : 0), a[1] + (a[1] > 0 ? j(0.08) : 0), z0 + dz * u + nz * a[0] + (a[1] > 0 ? j(0.12) : 0)); },
          { plant: k === 1 || k === 3 ? 2 : plant, cut: -200 - 400 * fr(), ref: V((x0 + x1) / 2, -200, (z0 + z1) / 2), edge: 0.3, fur: 0.02 });
        damp.push([x0, z0, x1, z1, w + 1.3]);
      };
      for (let k = 0; k < HEDGES.length; k++) { const H = HEDGES[k]; hedge(H[0], H[1], H[2], H[3], H[4], H[5], k < 3 ? 1 : 0, [18, 12, 10, 14, 14, 14, 14][k]); await ctx.yield(); }   // the Walk's right side, the court's two flanks (box); four long yew hedges out on the right
      await ctx.yield();
    }
    // ---- far ranks: seven silhouette strips beyond every wall, each a step taller and bluer; never haze --------------
    {
      const rr = rng.fork ? rng.fork('ranks') : rng, pos = [], mixA = [];
      const tri = (a, b, c, m, g = 0) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); mixA.push(m, g, m, g, m, g); };
      const MIX = [0.36, 0.47, 0.57, 0.65, 0.72, 0.78, 0.83];
      for (let k = 0; k < 7; k++) {
        const d = [530, 650, 820, 1020, 1270, 1570, 1900][k], h = 15 + d * (0.014 + 0.0075 * (k + 1)), zk = d, m = MIX[k], side = 380 + 150 * k;
        const strip = (ax, az, bx, bz) => {
          const l = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(l / (34 + 14 * k)));
          tri([ax, 0, az], [bx, 0, bz], [bx, h, bz], m); tri([ax, 0, az], [bx, h, bz], [ax, h, az], m);
          for (let i = 0; i < n; i++) {                           // finials in silhouette: cone, ball, block
            const t = (i + 0.5 + rr.range(-0.2, 0.2)) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, ux = (bx - ax) / l, uz = (bz - az) / l, s = (7 + 3.2 * k) * rr.range(0.8, 1.25), kind = rr.int(0, 3);
            const P = (a, y) => [x + ux * a, h + y, z + uz * a];
            if (kind === 3) { for (let q = 0; q < 6; q++) { const a0 = q / 6 * Math.PI, a1 = (q + 1) / 6 * Math.PI; tri(P(0, 0), P(Math.cos(a0) * s * 1.1, Math.sin(a0) * s * 1.25), P(Math.cos(a1) * s * 1.1, Math.sin(a1) * s * 1.25), m, 1); } }   // an uncut mound, gold
            else if (kind === 0) tri(P(-s * 0.55, 0), P(s * 0.55, 0), P(0, s * 2.2), m);
            else if (kind === 1) { tri(P(-s * 0.2, 0), P(s * 0.2, 0), P(0, s * 0.6), m); for (let q = 0; q < 9; q++) { const a0 = q / 9 * TAU, a1 = (q + 1) / 9 * TAU; tri(P(0, s * 1.2), P(Math.cos(a0) * s * 0.75, s * 1.2 + Math.sin(a0) * s * 0.75), P(Math.cos(a1) * s * 0.75, s * 1.2 + Math.sin(a1) * s * 0.75), m); } }
            else { tri(P(-s * 0.7, 0), P(s * 0.7, 0), P(s * 0.7, s * 0.9), m); tri(P(-s * 0.7, 0), P(s * 0.7, s * 0.9), P(-s * 0.7, s * 0.9), m); tri(P(-s * 0.45, s * 0.9), P(s * 0.45, s * 0.9), P(0, s * 1.7), m); }
          }
        };
        strip(PX - side - 400, zk, PX + side + 400, zk); strip(PX - side, -260, PX - side, zk); strip(PX + side, -260, PX + side, zk);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aMix', new THREE.Float32BufferAttribute(mixA, 2));
      const m = new THREE.ShaderMaterial({ uniforms: STYLE, side: THREE.DoubleSide,
        vertexShader: `attribute vec2 aMix; varying vec2 vMix; void main(){ vMix = aMix; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `varying vec2 vMix;\n${STYLE_GLSL}\nvoid main(){ gl_FragColor = vec4(mix(vMix.y > .5 ? uGold : uShadeTone[0], uSky, vMix.x), 1.); }` });
      const ranks = new THREE.Mesh(g, m); ranks.frustumCulled = false; ranks.renderOrder = -1; scene.add(ranks);
      // ---- the sky's clouds: sixteen flat cut-outs far beyond the last rank (2.4 to 3 km), each a row of round heads on
      // a level base in two tones (lit above, shade along the base), drifting slowly round the garden on the garden's
      // own clock. Nothing of them reads the lens: a cloud is a plane that faces the garden's middle.
      {
        const cr2 = rng.fork ? rng.fork('clouds') : rng, NC = 16, cA = new Float32Array(NC * 4), cS = new Float32Array(NC);
        for (let k = 0; k < NC; k++) { cA[k * 4] = (k + cr2.range(-0.3, 0.3)) / NC * TAU; cA[k * 4 + 1] = Math.tan(cr2.range(5.5, 25) * Math.PI / 180); cA[k * 4 + 2] = 2400 + 38 * k; cA[k * 4 + 3] = cr2.range(520, 1150); cS[k] = cr2(); }
        const cg = new THREE.InstancedBufferGeometry();
        cg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
        cg.setAttribute('iC', new THREE.InstancedBufferAttribute(cA, 4)); cg.setAttribute('iS', new THREE.InstancedBufferAttribute(cS, 1)); cg.instanceCount = NC;
        const cm = new THREE.ShaderMaterial({ uniforms: { ...STYLE, uLit: { value: new THREE.Color(look.cloud[0]) }, uShade: { value: new THREE.Color(look.cloud[1]) } }, side: THREE.DoubleSide,
          vertexShader: `attribute vec4 iC; attribute float iS; varying vec3 vC;\n${STYLE_GLSL}
void main(){
  float a = iC.x + uTime * .0012;
  vec3 c = vec3(${PX.toFixed(1)} + sin(a) * iC.z, iC.y * iC.z, 240. + cos(a) * iC.z), right = vec3(cos(a), 0., -sin(a));
  vec3 p = c + right * position.x * iC.w + vec3(0., position.y * iC.w * .42, 0.);
  vC = vec3(position.x * 2.38, position.y, iS);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
          fragmentShader: `uniform vec3 uLit; uniform vec3 uShade; varying vec3 vC;
void main(){
  float inC = 0.;
  for (int i = 0; i < 6; i++) {
    float fi = float(i), h = fract(sin(vC.z * 91.7 + fi * 12.9898) * 43758.5453), h2 = fract(sin(vC.z * 33.1 + fi * 78.233) * 12543.21), bell = 1. - abs(fi - 2.5) / 3.2;
    vec2 c = vec2((fi - 2.5) * .36 + (h - .5) * .12, .2 + .42 * bell * (.55 + .45 * h2));
    inC = max(inC, step(length(vC.xy - c), .16 + .2 * bell * (.5 + .5 * h)));
  }
  if (inC < .5 || vC.y < .16) discard;
  gl_FragColor = vec4(vC.y < .3 + .04 * sin(vC.x * 11. + vC.z * 40.) ? uShade : uLit, 1.);
}` });
        const cl = new THREE.Mesh(cg, cm); cl.frustumCulled = false; cl.renderOrder = -2; cl.name = 'clouds'; scene.add(cl);
      }
      await ctx.yield();
    }
    // ---- the gravel: one flat tone, rake lines in the damp tone (rows along the course, rings in the court) ----------
    const flatMat = (tone, extra = {}) => new THREE.ShaderMaterial({ uniforms: STYLE, side: THREE.DoubleSide, ...extra,
      vertexShader: `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`, fragmentShader: `${STYLE_GLSL}\nvoid main(){ gl_FragColor = vec4(${tone}, 1.); }` });
    {
      const gg = new THREE.PlaneGeometry(5200, 5200, 1, 1); gg.rotateX(-Math.PI / 2); gg.translate(PX, 0, 900);
      const gm = new THREE.ShaderMaterial({ uniforms: STYLE, depthWrite: false,
        vertexShader: `varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `varying vec3 vW;\n${STYLE_GLSL}\n${RAKE_GLSL}\nvoid main(){ gl_FragColor = vec4(mix(uGravel, uDamp, mgRake(vW)), 1.); }` });
      const ground = new THREE.Mesh(gg, gm); ground.renderOrder = -4; ground.frustumCulled = false; scene.add(ground);
      // damp at every foot: ragged discs under the forms, bands along the hedges
      const dp = [];
      damp.push([WALL_X - 5.2, -30, WALL_X - 5.2, 196, 1.6], [HEDGE_X - 4, -30, HEDGE_X - 4, 214, 1.8], [-560, GATE_Z - 3.2, 640, GATE_Z - 3.2, 1.8]);
      damp.push([PX, PZ, 50.6]);
      for (const d of damp) {
        if (d.length === 3) { const n = d[2] > 20 ? 48 : 12; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, r0 = d[2] * (1 + 0.06 * Math.sin(i * 2.4 + d[0])), r1 = d[2] * (1 + 0.06 * Math.sin((i + 1) % n * 2.4 + d[0])); dp.push(d[0], 0, d[1], d[0] + Math.sin(a0) * r0, 0, d[1] + Math.cos(a0) * r0, d[0] + Math.sin(a1) * r1, 0, d[1] + Math.cos(a1) * r1); } }
        else { const dx = d[2] - d[0], dz = d[3] - d[1], l = Math.hypot(dx, dz), nx = -dz / l * d[4], nz = dx / l * d[4]; dp.push(d[0] - nx, 0, d[1] - nz, d[2] - nx, 0, d[3] - nz, d[2] + nx, 0, d[3] + nz, d[0] - nx, 0, d[1] - nz, d[2] + nx, 0, d[3] + nz, d[0] + nx, 0, d[1] + nz); }
      }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
      const dm = new THREE.Mesh(dg, flatMat('uDamp', { depthWrite: false })); dm.renderOrder = -3; dm.frustumCulled = false; scene.add(dm);
      await ctx.yield();
    }
    // ---- zone meshes -------------------------------------------------------------------------------------------------
    const hullMat = hullMaterial(), shadMat = shadowMaterial(0), cardMat = cardMaterial();
    for (const Z of zones) {
      const g = await Z.F.geometryAsync(ctx.yield); g.computeBoundingSphere(); g.boundingSphere.radius += 70; await ctx.yield();
      const hull = new THREE.Mesh(g, hullMat); scene.add(hull);
      const sh = new THREE.Mesh(g, shadMat); sh.renderOrder = -2; scene.add(sh);
      await ctx.yield();
      const cards = await makeCards(Z.F.sites, cardMat, Z.cardMax, ctx.yield);
      cards.geometry.boundingSphere = g.boundingSphere.clone(); cards.frustumCulled = true; scene.add(cards);
      stats.hullTris += Z.F.triangles(); stats.cards += cards.geometry.instanceCount; stats[Z.name] = [Z.F.triangles(), Z.F.sites.length / 13]; stats.cardsNotMade += Z.F.dropped;
      await ctx.yield();
    }
    // ---- clippings: pools tied to the fronts; they fall, drift, settle as litter (a closed form of the route metres
    // flown since their cut). BY PLACE: one whose whole fall would come within 2.5 m, its flutter and its own half length
    // of the course is never made; nor is litter that would lie within 3.1 m of it
    const windX = look.breeze ? -2.4 : -0.25;
    {
      const src = zones.flatMap((Z) => Z.clipSrc), total = src.reduce((a, s) => a + Math.round(s.n * detail), 0);
      const cOrg = new Float32Array(total * 3), cVel = new Float32Array(total * 3), cData = new Float32Array(total * 4), cr2 = rng.fork ? rng.fork('clips') : rng;
      let k = 0, tries = 0, notMade = 0;
      for (const s of src) for (let i = 0, n = Math.round(s.n * detail); i < n; i++) {
        const c = s.at(), sp = cr2.range(0.5, 1.6), a = cr2() * TAU, mv = c.still ? 0 : 1;
        const vx = mv * (windX * cr2.range(0.6, 1.3) + (c.ox ?? c.out ?? 0) * sp + Math.sin(a) * 0.4), vz = mv * ((c.oz ?? 0) * sp + Math.cos(a) * 0.5);
        const late = cr2.range(0, 1.9), sd = cr2(), size = cr2() < 0.08 ? cr2.range(1.3, 1.7) : cr2.range(0.55, 1.1);
        // the fall: it lies where it first comes down from above on the wall's top, its chamfers or a pier's top, else on
        // the gravel. Its fall is stepped by quarter seconds until it stands under the floor of its place, and the moment
        // it meets that floor is then found inside the last step by halving it eight times (to a millisecond), so it
        // rests on the face under its own resting place and neither sinks nor jumps. One that at that moment stands
        // 0.1 m and more under the floor has met the wall's upright face from the side (the floor leaps there): not made
        let tl = 0.25, fl = c.floor, near = 16, side = false;
        if (!c.still) {
          near = airOf(c.p.x, c.p.y, c.p.z);
          const fallY = (t) => c.p.y - 5.5 * (t - (1 - Math.exp(-1.3 * t)) / 1.3), floorAt = (t) => Math.max(0, wallTopAt(c.p.x + vx * t, c.p.z + vz * t));
          for (; tl < 30 && fallY(tl) > floorAt(tl); tl += 0.25) near = Math.min(near, airOf(c.p.x + vx * tl, fallY(tl), c.p.z + vz * tl));
          let lo = tl - 0.25;
          for (let q = 0; q < 8; q++) { const mid = (lo + tl) / 2; if (fallY(mid) > floorAt(mid)) lo = mid; else tl = mid; }
          const top = floorAt(tl);
          side = fallY(tl) < top - 0.1; fl = top > 0 ? top + 0.03 : 0;
          near = Math.min(near, airOf(c.p.x + vx * tl, fl, c.p.z + vz * tl));
        }
        if (++tries % 150 === 149) await ctx.yield();
        if (c.still) { const n = nearCourse(c.p.x, c.p.y, c.p.z); if ((n && n.d < 3.1) || (c.p.y < 1 ? bodyAt(c.p.x, 0.1, c.p.z, 0.3, 0) : formAt(c.p.x, c.p.y, c.p.z, 0.3, 0))) { notMade++; continue; } }   // on the wall: not in a finial's foot
        else if (side || near < 2.5 + 0.9 + 1.1 * size) { notMade++; continue; }
        cOrg[k * 3] = c.p.x; cOrg[k * 3 + 1] = c.p.y; cOrg[k * 3 + 2] = c.p.z; cVel[k * 3] = vx; cVel[k * 3 + 1] = tl; cVel[k * 3 + 2] = vz;
        cData[k * 4] = c.cut + late; cData[k * 4 + 1] = sd; cData[k * 4 + 2] = fl; cData[k * 4 + 3] = size;
        k++;
      }
      const cg = new THREE.InstancedBufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute([-0.62, 0, 0, 0, 0, -0.2, 0.62, 0, 0.04, 0, 0, 0.22], 3)); cg.setIndex([0, 1, 2, 0, 2, 3]);
      cg.setAttribute('iOrg', new THREE.InstancedBufferAttribute(cOrg, 3)); cg.setAttribute('iVel', new THREE.InstancedBufferAttribute(cVel, 3)); cg.setAttribute('iData', new THREE.InstancedBufferAttribute(cData, 4));
      cg.instanceCount = Math.max(1, k);
      const clips = new THREE.Mesh(cg, clippingMaterial()); clips.frustumCulled = false; clips.name = 'clippings'; scene.add(clips);
      stats.clips = k; stats.clipsNotMade = notMade;
    }
    // ---- loose leaves turning in small eddies over the gravel: each leaf rides a closed ring on the garden's own clock,
    // so nothing of it begins or ends; each eddy stands at a place of its own (by chance, within 6 to 30 m of the course
    // along the Walk, the court and the Gate Walk) and its whole ring keeps 3 m and more from the course
    {
      const er = rng.fork ? rng.fork('eddies') : rng, nE = Math.round(46 * detail), per = 13, ed = [];
      for (let t = 0; ed.length < nE && t < nE * 30; t++) {
        const d = er() < 0.7 ? er.range(M.walk - 10, M.crest - 10) : er.range(M.gateWalk - 20, M.gate - 8), p = path.posAtDist(d), a = er() * TAU, off = er.range(6, 30), x = p.x + Math.sin(a) * off, z = p.z + Math.cos(a) * off, R = er.range(0.9, 2.2), H = er.range(1.2, 3.6);
        if (airOf(x, H * 0.5, z) < 3 + R + H * 0.5 + 0.6 || bodyAt(x, 1, z, R + 0.9, 0)) continue;   // 0.9: a leaf's own reach, and room
        ed.push([x, z, R, H, er() < 0.5 ? 1 : -1, er.range(0.5, 1.1)]);
      }
      const nL = ed.length * per, ce = new Float32Array(nL * 4), le = new Float32Array(nL * 4);
      ed.forEach(([x, z, R, H, dir, w], e) => { for (let q = 0; q < per; q++) { const i = e * per + q; ce[i * 4] = x; ce[i * 4 + 1] = z; ce[i * 4 + 2] = R * er.range(0.35, 1); ce[i * 4 + 3] = H * er.range(0.15, 1); le[i * 4] = er() * TAU; le[i * 4 + 1] = dir * w * er.range(0.7, 1.3); le[i * 4 + 2] = er(); le[i * 4 + 3] = er.range(0.4, 0.8); } });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.62, 0, 0, 0, 0, -0.2, 0.62, 0, 0.04, 0, 0, 0.22], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aEddy', new THREE.InstancedBufferAttribute(ce, 4)); g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(le, 4)); g.instanceCount = Math.max(1, nL);
      const m = new THREE.ShaderMaterial({ uniforms: STYLE, side: THREE.DoubleSide,
        vertexShader: `attribute vec4 aEddy; attribute vec4 aLeaf; varying vec3 vCol;\n${STYLE_GLSL}
void main(){
  float s = aLeaf.z, ang = aLeaf.x + uTime * aLeaf.y * 1.6;
  vec3 wp = vec3(aEddy.x + sin(ang) * aEddy.z, .25 + aEddy.w * (.5 + .5 * sin(ang * .5 + s * 20.)), aEddy.y + cos(ang) * aEddy.z);
  float yaw = s * 40. + uTime * (1.2 + 2. * s), roll = s * 17. + uTime * (2.2 + 2.6 * s);
  vec3 e1 = vec3(cos(yaw), 0., sin(yaw)), e2 = vec3(-sin(yaw) * cos(roll), sin(roll), cos(yaw) * cos(roll));
  wp += (e1 * position.x + e2 * position.z) * aLeaf.w;
  vCol = s < .6 ? uGold : (s < .76 ? uShadeTone[2] : uSunTone[0]);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`, fragmentShader: `varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }` });
      const air = new THREE.Mesh(g, m); air.frustumCulled = false; air.name = 'eddies'; scene.add(air);
      stats.eddies = ed.length;
    }
    // ---- tackle: taut strings on the wall's and the hedge's edges, the arches' caps, the dove, the court's found forms
    // and the gate's rim; pegs on the wall top ------------------------------------------------------------------------
    {
      for (let z = 4; z < 196; z += 6) {
        for (const [dx, y, cf] of [[-2.9, 15.75, cutTop], [2.9, 15.75, cutTop], [-5.0, 13.3, cutRight], [5.0, 13.3, cutLeft]]) {
          strings.push([V(WALL_X + dx, y, z), V(WALL_X + dx, y, z + 6), 0.07, cf({ z }) - 0.9]);
          strings.push([V(WALL_X + dx, y - 0.9, z), V(WALL_X + dx, y + 0.35, z), 0.09, cf({ z }) - 0.9]);
        }
        strings.push([V(HEDGE_X - 4.0, 25.2 + HD, z), V(HEDGE_X - 4.0, 25.2 + HD, z + 6), 0.08, cutHedge({ z }) - 0.9]);
      }
      for (const f of courtForms) if (typeof f.cut === 'function' && !look.rare) { const R = f.ring(0.5); for (let q = 0; q < 8; q++) strings.push([R[q], R[q + 1], 0.07, Math.min(f.cut(R[q]), f.cut(R[q + 1])) - 1.5]); }   // a string round the lump of each form found as we pass, on its fur
      // BY PLACE, as for a lump's shoot: a string stands 2.5 m and its own half length from the course, or is gone (cut
      // with its edge) 4 m of route or more before the course comes that near
      const keepString = ([a, b, w, hide]) => {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2, n = nearCourse(mx, my, mz); if (!n) return true;
        const R = 2.5 + w + a.distanceTo(b) / 2; if (n.d >= R) return true;
        let i = n.i; while (i > 0) { const dx = cX[i - 1] - mx, dy = cY[i - 1] - my, dz = cZ[i - 1] - mz; if (dx * dx + dy * dy + dz * dz >= R * R) break; i--; }
        return hide <= i * CS - 4;
      };
      const kept = strings.filter(keepString); stats.strings = kept.length; stats.stringsNotMade = strings.length - kept.length;
      scene.add(makeTackle(kept));
      await ctx.yield();
    }
    // ---- blackbirds: flat cut-outs (a planform and a profile) in the darkest tone, each with its hard shadow ---------
    // THE LAW OF THE BLACKBIRDS: each works a spot of its own on the wall's top plane or on the gravel. One on the gravel
    // lifts when the eye is 19 to 26 m of route short of its spot (which, by its own chance); one on the wall sits in the
    // uncut fur and lifts 1 m of route after the last of the wall's three fronts has passed its spot (the eye then 4.6 to
    // 18.9 m short of it). It flies off over the garden by one of six typed ways (BIRD_WAYS: so many metres aside from the
    // route and on along it for every 28 m of route the eye flies after that), rising 9 m in the first such stretch; it
    // is never brought back and never made small. The hop it was in is carried into the lift and dies away over the
    // first BIRD_SETTLE of that stretch, so it neither jumps nor turns at once. BY PLACE: but for that dying hop (0.85 m
    // at most, counted) its place is a function of the eye's place alone, so its whole visit is replayed at the build
    // against the course and the garden's bodies. A spot that lies in a body's foot, or within 2.6 m (and the bird's reach and hop ring) of the eye's own
    // place, is dealt again; from a free spot the bird takes the first of the six ways, tried in turn from one of its own
    // chance, that meets no body (bodyAt) and never comes within 2.6 m and its reach of the eye; a spot with no open way
    // is dealt again, and after 24 spots the bird is not there
    const BIRD_LEAD = 19, BIRD_LEAD_MORE = 7, BIRD_FLY = 28, BIRD_RISE = 9, BIRD_DEALS = 24, BIRD_SETTLE = 0.12;
    const BIRD_WAYS = [[13, 4], [11, 10], [13, -3], [7, 15], [15, 0], [9, -9]];
    const birdFlight = (b, k, o) => { const e = sstep(0, 0.25, k); o.x = b.x + b.sx * 2 * e + b.wx * k; o.y = b.floor + 0.2 * b.scale + BIRD_RISE * Math.sqrt(k) * e; o.z = b.z + b.sz * 2 * e + b.wz * k; o.h = Math.atan2(b.wx, b.wz); o.e = e; return o; };
    // 0: clear; 1: its spot is in a body; 3: it would work too near the eye
    const birdSpot = (b) => {
      const lim = 2.6 + 0.92 * b.scale + 0.85, y = b.floor + 0.4;
      if (b.floor < 1 && bodyAt(b.x, 0.5, b.z, 0.85 + 0.92 * b.scale + 0.3, 0)) return 1;  // it works clear of every foot (its hop ring, its wing, and room)
      for (let i = 0; i <= CN && i * CS <= b.lift; i++) { const dx = cX[i] - b.x, dy = cY[i] - y, dz = cZ[i] - b.z; if (dx * dx + dy * dy + dz * dz < lim * lim) return 3; }
      return 0;
    };
    // is this way open? A body is counted once the bird is 0.75 m from its spot's middle or 1.6 m off its own floor (the
    // place it works was counted above; on the wall, whose top is its floor, by the height alone); while the hop dies
    // away the bird may stand up to 0.85 m off its flight's line, and that is added to its reach
    const birdWay = (b, way) => {
      const o = {}, reach = 0.92 * b.scale;
      b.wx = b.sx * way[0] + b.tx * way[1]; b.wz = b.sz * way[0] + b.tz * way[1];
      for (let i = Math.max(0, Math.floor(b.lift / CS)); i <= CN; i++) {
        const k = (i * CS - b.lift) / BIRD_FLY; if (k <= 0) continue;
        birdFlight(b, k, o);
        const off = 0.85 * (1 - sstep(0, BIRD_SETTLE, k)), lim = 2.6 + reach + off;
        if ((o.y > b.floor + 1.6 || (b.floor < 1 && Math.hypot(o.x - b.x, o.z - b.z) > 0.75)) && bodyAt(o.x, o.y, o.z, reach + 0.4 + off, i * CS)) return false;
        const dx = cX[i] - o.x, dy = cY[i] - o.y, dz = cZ[i] - o.z; if (dx * dx + dy * dy + dz * dz < lim * lim) return false;
      }
      return true;
    };
    const NB = Math.round(46 * (0.5 + 0.5 * detail)), bPos = new Float32Array(NB * 4), bAim = new Float32Array(NB * 4), bExt = new Float32Array(NB * 2), birds = [];
    const bGeo = new THREE.InstancedBufferGeometry();
    {
      // planform: head and beak, a plump body, a fanned tail, round-tipped wings (aWing: how far each vertex follows the flap)
      const P = [], W = [], T = (a, b, c, wa = 0, wb = 0, wc = 0) => { P.push(a[0], 0, a[1], b[0], 0, b[1], c[0], 0, c[1]); W.push(wa, wb, wc); };
      T([0, 0.56], [0.07, 0.42], [-0.07, 0.42]); T([0.07, 0.42], [0.15, 0.1], [-0.15, 0.1]); T([0.07, 0.42], [-0.15, 0.1], [-0.07, 0.42]);
      T([0.15, 0.1], [0.07, -0.3], [-0.07, -0.3]); T([0.15, 0.1], [-0.07, -0.3], [-0.15, 0.1]);
      T([0.07, -0.3], [0.2, -0.72], [-0.2, -0.72]); T([0.07, -0.3], [-0.2, -0.72], [-0.07, -0.3]);
      for (const g of [1, -1]) { T([g * 0.12, 0.3], [g * 0.5, 0.34], [g * 0.12, -0.14], 0, 0.55, 0); T([g * 0.5, 0.34], [g * 0.52, -0.16], [g * 0.12, -0.14], 0.55, 0.55, 0); T([g * 0.5, 0.34], [g * 0.9, 0.02], [g * 0.52, -0.16], 0.55, 1, 0.55); T([g * 0.9, 0.02], [g * 0.78, -0.2], [g * 0.52, -0.16], 1, 0.9, 0.55); }
      const prof = [[0.1, 0.52], [0.2, 0.3], [0.14, -0.1], [0.02, -0.62], [-0.1, 0], [-0.04, 0.34]];
      for (const [a, b] of [[0, 1], [1, 2], [2, 3], [5, 0]]) { P.push(0, prof[4][0], prof[4][1], 0, prof[a][0], prof[a][1], 0, prof[b][0], prof[b][1]); W.push(0, 0, 0); }
      P.push(0.12, 0, 0.06, 0, 0.19, 0.06, -0.12, 0, 0.06, 0.12, 0, 0.06, -0.12, 0, 0.06, 0, -0.11, 0.06); W.push(0, 0, 0, 0, 0, 0);   // a keel, so it reads from behind
      bGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bGeo.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
      bGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(bPos, 4)); bGeo.setAttribute('iAim', new THREE.InstancedBufferAttribute(bAim, 4)); bGeo.setAttribute('iExt', new THREE.InstancedBufferAttribute(bExt, 2));
      bGeo.instanceCount = NB;
      const bm = (shadow) => new THREE.ShaderMaterial({ uniforms: { ...STYLE, uFlat: { value: shadow ? 1 : 0 } }, side: THREE.DoubleSide, polygonOffset: shadow, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: `attribute vec4 iPos; attribute vec4 iAim; attribute vec2 iExt; attribute float aWing; uniform float uFlat;\n${STYLE_GLSL}
void main(){
  float h = iAim.x, wa = iAim.y, span = iAim.w, pitch = iExt.x;
  vec3 f0 = vec3(sin(h), 0., cos(h)), right = vec3(f0.z, 0., -f0.x), fwd = f0 * cos(pitch) + vec3(0., sin(pitch), 0.), up = vec3(0., cos(pitch), 0.) - f0 * sin(pitch);
  vec3 l = vec3(position.x * mix(1., cos(wa) * span, aWing), position.y + aWing * abs(position.x) * sin(wa) * span, position.z);
  vec3 wp = iPos.xyz + (right * l.x + up * l.y + fwd * l.z) * iAim.z;
  if (uFlat > .5) { wp -= uSun * (max(wp.y - iPos.w, 0.) / max(uSun.y, .08)); wp.y = iPos.w + .05; }
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`, fragmentShader: `uniform float uFlat;\n${STYLE_GLSL}\nvoid main(){ gl_FragColor = vec4(uFlat > .5 ? uShadow : uBird, 1.); }` });
      const bs = new THREE.Mesh(bGeo, bm(true)); bs.frustumCulled = false; bs.renderOrder = -1; scene.add(bs);
      const bb = new THREE.Mesh(bGeo, bm(false)); bb.frustumCulled = false; scene.add(bb);
      // where they work: the wall top ahead of us, the Walk, the court gravel, the Gate Walk
      const br = rng.fork ? rng.fork('birds') : rng;
      const _t = V(0, 0, 1);
      const spot = (d, side, off, floor) => { const p = path.posAtDist(d), t = path.tangentAtDist(d, _t), rx = -t.z, rz = t.x, l = Math.hypot(rx, rz) || 1; return { x: p.x + rx / l * side * off, z: p.z + rz / l * side * off, floor, s0: d, side, seed: br(), sx: rx / l * side, sz: rz / l * side, tx: t.x, tz: t.z }; };
      let birdsNotMade = 0; stats.birdDeals = new Array(16).fill(0);   // spots refused, by zone (wall top, Walk, court, Gate Walk) x 4 + the reason (1 in a body's foot, 2 no way open, 3 too near the eye)
      for (let i = 0; i < NB; i++) {
        const k = i / NB;
        let b = null;
        for (let deal = 0; deal < BIRD_DEALS && !b; deal++) {
          if (k < 0.2) { b = spot(7 + (M.leave - 4) * (k / 0.2) + br.range(-2, 2), br() < 0.5 ? -1 : 1, 0, 14.08); b.x = WALL_X + br.range(-0.2, 1.6); }   // the wall's top plane: its hop ring stays on the flat, clear of the finials' feet
          else if (k < 0.5) b = spot(M.walk - 2 + (M.rim - M.walk - 4) * ((k - 0.2) / 0.3) + br.range(-2.4, 2.4), br() < 0.5 ? -1 : 1, br.range(2.2, 9), 0.12);   // the Walk
          else if (k < 0.75) b = spot(M.rim - 6 + (M.crest - M.rim) * ((k - 0.5) / 0.25) + br.range(-1.5, 1.5), br() < 0.5 ? -1 : 1, br.range(3, 14), 0.12);          // the court
          else b = spot(M.gateWalk - 14 + (M.gate - M.gateWalk + 5) * ((k - 0.75) / 0.25) + br.range(-1.5, 1.5), br() < 0.5 ? -1 : 1, br.range(3, 12), 0.12);          // the Gate Walk
          b.scale = br.range(0.55, 0.75); b.lift = b.s0 - BIRD_LEAD - b.seed * BIRD_LEAD_MORE;
          if (b.floor > 1) b.lift = Math.max(b.lift, (b.z - WALL_AHEAD[2]) / WALL_RUN + 1);   // on the wall it sits in the uncut fur until the last of the three fronts has found it
          let why = birdSpot(b);
          if (!why) { why = 2; const w0 = Math.floor(b.seed * 977) % BIRD_WAYS.length; for (let w = 0; w < BIRD_WAYS.length && why; w++) if (birdWay(b, BIRD_WAYS[(w0 + w) % BIRD_WAYS.length])) why = 0; }
          if (why) { stats.birdDeals[(k < 0.2 ? 0 : k < 0.5 ? 4 : k < 0.75 ? 8 : 12) + why]++; b = null; }
          await ctx.yield();
        }
        if (b) birds.push(b); else birdsNotMade++;
      }
      bGeo.instanceCount = birds.length; stats.birds = birds.length; stats.birdsNotMade = birdsNotMade;
    }
    await ctx.yield();
    // ---- this instance's style values, written back into the shared STYLE before every draw of this scene -----------
    const writeStyle = () => {
      for (const k of TONES) STYLE[k].value.copy(snap[k]);
      for (let i = 0; i < 3; i++) { STYLE.uSunTone.value[i].copy(snap.sunTone[i]); STYLE.uShadeTone.value[i].copy(snap.shadeTone[i]); }
      STYLE.uSun.value.copy(mine.sun); STYLE.uS.value = mine.s; STYLE.uTime.value = mine.time;
    };
    scene.onBeforeRender = writeStyle;
    const setBird = (i, x, y, z, floor, heading, wa, scale, span, pitch = (1 - span) * 0.8) => { bExt[i * 2] = pitch; bPos[i * 4] = x; bPos[i * 4 + 1] = y; bPos[i * 4 + 2] = z; bPos[i * 4 + 3] = floor; bAim[i * 4] = heading; bAim[i * 4 + 1] = wa; bAim[i * 4 + 2] = scale; bAim[i * 4 + 3] = span; };
    const _bf = {};
    const updateBirds = (time, s) => {
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i], k = (s - b.lift) / BIRD_FLY, g = k <= 0 ? 1 : 1 - sstep(0, BIRD_SETTLE, k);
        let hx = 0, hy = 0, hz = 0, hh = 0, hs = 0.3;
        if (g > 0) {                                              // working its spot: hop, turn, hop (the garden's own clock)
          const T = time * 1.4 + b.seed * 20, n = Math.floor(T), e = sstep(0.7, 1, T - n), a0 = n * 2.4 + b.seed * 6, a1 = a0 + 2.4;
          hx = (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * e) * 0.8; hz = (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * e) * 0.8;
          hy = Math.sin(e * Math.PI) * 0.24; hh = b.seed * TAU + (n + e) * 1.3; hs = 0.3 + 0.5 * Math.sin(e * Math.PI);
        }
        if (k <= 0) setBird(i, b.x + hx, b.floor + 0.2 * b.scale + hy, b.z + hz, b.floor, hh, 0.35, b.scale, hs);
        else {                                                    // lifting as we come, and away over the garden; the hop dies away (g)
          birdFlight(b, k, _bf);
          const turn = hh - _bf.h, flap = 0.25 + Math.sin(time * 13 + b.seed * 9) * 0.8, fs = 0.3 + 0.7 * _bf.e;
          // a wall bird's shadow lies on the wall's top plane only while, laid at that height, it falls on that plane;
          // after that on the gravel, under the shadow's own place (the bird shader lays it along the sun's line)
          const bx = _bf.x + hx * g, by = _bf.y + hy * g, bz = _bf.z + hz * g;
          let fl = b.floor;
          if (fl > 1) { const q = Math.max(by - fl, 0) / Math.max(look.sun.y, 0.08), sz = bz - look.sun.z * q; if (Math.abs(bx - look.sun.x * q - WALL_X) > 2.5 || sz < -30 || sz > 196) fl = 0; }
          setBird(i, bx, by, bz, fl, _bf.h + (turn - TAU * Math.round(turn / TAU)) * g, flap + (0.35 - flap) * g, b.scale, fs + (hs - fs) * g);
        }
      }
      bGeo.attributes.iPos.needsUpdate = true; bGeo.attributes.iAim.needsUpdate = true; bGeo.attributes.iExt.needsUpdate = true;
    };
    updateBirds(0, 0); writeStyle();
    // THE PACE, by the places of the route (metres a second before the engine's own scaling): 7 along the wall top, 13
    // from the drop into the Walk, slowing to 10 up the climb and to 6.8 over the crest and down the eye's axis (the
    // place to linger), 17 from our eye of the fan down to the Gate Walk, 11 for the level run to the gate
    const speed = (d) => 7 + 6 * sstep(M.leave + 3, M.walk - 21, d) - 3 * sstep(M.foot, M.rim + 10, d) - 3.2 * sstep(M.crest - 34, M.crest, d) + 10.2 * sstep(M.eye, M.eye + 26, d) - 6 * sstep(M.gateWalk - 29, M.gateWalk, d);
    const uOf = (d) => Math.min(1, Math.max(0, d / L));
    return {
      scene, path, duration: 44, pace: (u) => speed(u * L) / 10.5,
      camera: { fov: 62, near: 0.3, far: 3400, lookAhead: 22, sway: 0.5, bank: 0.35 },
      // what the eye turns to, each for a stretch of the route named by its things (a look comes in and lets go over
      // the given share of its own stretch, so the stretches overlap): the Peacock from the drop off the wall until we are
      // 12 m short of the crest; our eye of the fan from 40 m short of the crest until we are 10 m short of the eye;
      // the moon gate, first seen through that eye, from 40 m short of the eye to the end
      pois: [
        { at: V(PX, 40, PZ), from: uOf(M.leave + 3), to: uOf(M.crest - 12), weight: 0.7, fade: 0.14 },
        { at: EYE.clone(), from: uOf(M.crest - 40), to: uOf(M.eye - 10), weight: 0.5, fade: 0.3 },
        { at: V(GATE_X, GATE_Y, GATE_Z), from: uOf(M.eye - 40), to: 1, weight: 0.9, fade: 0.12 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.ring, glow: 0.3, revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        mine.s = u * L; mine.time = time;                          // the eye's place: metres of route flown
        updateBirds(time, mine.s);
        writeStyle();
      },
      dispose() { hero.dispose(); },
      debug: { look, stats, marks: M, hero: hero.stats },
    };
  },
};
