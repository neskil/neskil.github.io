// THE WHITE STACK: hero set piece of "gannet-stack-gale".
//
// A 170 m dolerite sea stack built of columnar tiers (three of them broad terraces, so the silhouette has shoulders;
// the summit's rim is the top tier's own broken edge), guano under the ledge lips where the birds are thick (since order 5:
// close to, one stain hanging from a seated lip across the columns, on dark basalt, with stretches of lip bare; from afar,
// since order 4, a pale line at every seated lip and a stain of tongues under it: stripes, tier over tier) and
// thinning into runs over black columns (546 flutes round the stack, of uneven width since order 4: each a prism turned its own way, a dark crack either side)
// (close to: treads that are pavements of six-sided column ends, a
// band of barnacles over the weed at the waterline, a foam apron along the shelf's lip; the side toward the sun is
// lit bright by its own bearing from the axis, the same from anywhere),
// with a frieze of nesting gannets on every ledge (three levels of detail, all animated in the vertex
// shader; beside the climb the nests trail weed tails that whip in the wind, one bird in three has a downy chick
// beside it (or, in late August, a brown fledgling: opts.season) and a few pairs fence bills), a turning tower of flying gannets round and above it, and the swell that detonates in its arch.
//
// SPACE (local = the brief's world axes): origin on the stack's axis at mean sea level, +Y up, +X east,
//   +Z south (the camera's entry side, "front"), -Z north. The arch runs north-south at x = 40
//   (30 m wide, 26 m high); the east leg stands at x 55..69. Foot radius ~45 m (69 m at the prow), summit
//   radius ~28 m at y = 170. The rock goes down to y = -4; the skirt is awash at y ~ +1.
//
// SIZE: radius 72 (rock), height 170. The tower of flyers is 120 m in radius, from y 60 to 470 (sheared 80 m
//   downwind at the top): see anchors.tower.
//
// OPTS: season ('june' default | 'august'), palette (the brief's 7 hex strings), sunDir (Vector3, direction TO the sun; default north-west, 8 degrees up),
//   sunColor / sunIntensity, skyColor, shadeColor (ambient from above / from below), windDir (Vector3, direction
//   the wind blows TO; default east-north-east), fullBirds (1500), midBirds (2400), cardBirds (cap, 14000),
//   towerBirds (3900; one in eleven is a 'hanger' that steps off a ledge or hangs on the wind to land, on ledges away
//   from the climb; tower birds fade out within 24 m of the lens so none is a paper dart in the face), burstPeriod (8.5 s),
//   tower (true), burst (true). ctx.quality.detail thins cards, tower and spray only.
//   MEND 6 (added behind the dealt birds, each from a stream of its own, so the deal above is as it was): the places the
//   seating rule leaves empty away from the climb and the summit's empty cells are seated ('gannet-frieze:' + seed; about
//   1,500 to 1,900 birds: mids inside the mid band, cards beyond); every sixteenth of the compass carries at least
//   towerBirds / 150 hangers ('gannet-trickle:'; about 150 to 210 more, on ledges 62 to 158 m up and 30 m of height or
//   more from the climb's line); the wheel has a quarter more birds ('gannet-tower:'; the design's 6,000 to the world's
//   4,800; none dealt between 165 and 228 m, where the route's line crosses the wheel). hero.counts.friezeMids,
//   friezeCards and towerMore say how many.
//   MEND 7 (the rock's shader alone: no geometry, no bird, no draw): DARK COLUMNAR ROCK, STAINED. The whitewash is no longer a
//   tongue to every flute under every lip: close to it is streaks on dark basalt (uneven in length, width and start, stretches
//   of lip bare), from afar it lies in fields where the birds are thick (windward, broad ledges, the summit) and thins
//   elsewhere; the ledges' floors are mud and wet rock with the whitewash in splashes. See makeRockMaterial (riser, tread).
//   ORDER 4 (the rock's and the burst's shaders alone: no geometry, no bird, no draw, no triangle): mend 7 read from afar as dark
//   boxes with flat white faces and close to as dark teal sheet metal with rust. FROM AFAR the white is now a stain that hangs
//   from the lips, stripes tier over tier: every seated lip shows its pale line and a stain of tongues under it (longer where
//   the birds are thick, never more than 0.58 of the riser, so never a face and never to the foot); the fields lie across
//   several tiers with soft borders; the whitewash's noises are keyed by the lip's height, not the tier's number, so the white
//   no longer ends on a corner line where a ledge steps; the far rock between the stains is dark slate, lit warm on the sun's
//   flank, not pure black; a ledge, a crack or a joint thinner than a pixel fades in proportion (no hair lines). CLOSE TO the
//   columns are STONE: uneven widths (gsCell), cross joints at uneven heights staggered from column to column, each column
//   a prism turned its own way, one in six broken back under its lip; the rock is black and neutral: the teal was the slate
//   floor's sky cyan through the grade (now two thirds of the way to neutral, cool), the sky's sheen on wet ribs all the way
//   up (the rock is wet black below 8 m, three tenths as wet by 30 m) and the sky on the cracks' edges; the rust was the broad
//   lobe of the key on dark ribs and thin cream wash under the warm key (the lobe is a fifth close to, a thin wash is grey);
//   the lit faces get the key again over the slate floor (half of mend 7's darkening back, as light: warm dark grey); the
//   whitewash close by is bent over under the seated birds' own white. The lichen (above about 100 to 130 m, uLichen) stains
//   a little more and its grain fades by the pixel. THE BURST has its soft body again (the shade inside it stands at 0.36 of
//   the sky, between live's 0.8 and the 0.22 that left the droplets as loose white dots); fingers and veil as they were.
//
// HOOKS: hero.setLight({ sunDir, sunColor, sunIntensity, skyColor, shadeColor }) re-lights everything at once.
//   hero.setBurst(p): p in 0..1 is the progress of ONE arch detonation (0 = the swell hits the west pier,
//   ~0.12 = fan at full height, 1 = veil gone). Until it is first called the burst loops by itself every
//   burstPeriod seconds; call setBurst(-1) to hand it back to the clock. hero.uniforms holds the shared uniforms.
//   The burst is 900 sprites of thrown water (soft-edged translucent sheets drawn out into ligaments along their
//   flight, each shaded as a rounded lump with its slot side lit and its thin edges taking the brass light; narrow
//   ligaments thrown clear that arc over under gravity and the wind and break into beads from the tail up; mist
//   that drifts off downwind) and 420 soft, torn
//   droplets streaked along their fall (none larger than about a ninetieth of its distance from the lens), from two sources: the fan off the south-west pier (west of the opening, so
//   the keyhole stays clear) and a front of smaller bursts that runs north up the west wall inside the arch;
//   hero.update(dt, time, camera) keeps the droplets at least a pixel wide (uPx).
//   The arch itself is modelled rock: wall columns 0.75-1.2 m wide and a honeycomb vault of broken column ends,
//   shaded as the stack's own wet black dolerite (green bounce from the surge, brass from the north mouth).
//
// ANCHORS (local space):
//   archAxis      { from, to }: the camera line through the arch, south mouth to north mouth, 11 m up.
//   archCenter    middle of the arch opening; burstOrigin: where the fan stands (the foot of the west pier, south side).
//   flyThrough    ordered points of the climb: a left-hand helix at least 7 m off the wall beside it (8 to 11 m on
//                 average) from (north-west, 30 m) to (south-south-west, 170 m). The 1500 full-detail birds sit
//                 shoulder to shoulder on the ledges beside this line (those ledges are packed first).
//   helixAt(v)    function, v 0..1 -> Vector3 on that helix (same line, any sampling).
//   lipRadius(theta, y) function: outermost rock radius near height y at angle theta (x = r cos, z = r sin).
//   wallRadius(theta, y) function: the wall beside a flyer at height y (rock at that height and lips within 4.5 m).
//   ledgeAt(theta, y, out) function: the ledge lip nearest height y at that angle, as a point (the world lands birds there).
//   summit        centre of the summit floor; viewpoints: entry (south, low), climb, crest.
//   tower         { center, radius, yMin, yMax, shear (Vector3 offset of the top) }.
//   rockColumn(theta) -> (y): the outermost rock DRAWN at that bearing within half a metre of the height y
//                 (faces with their columns' steps, lips, cap, the awash shelf; the arch's opening counts as rock).
//   rockGeometry  the rock's own mesh as drawn (positions and index: faces, ledges, cap, the awash shelf, the arch's lining),
//                 for clearances against its triangles.
//   windDir, sunDir: as used. No portalSeat: the brief's portal is under the boil, 270 m to leeward, the world's job.
//
// COST: about 225k to 252k triangles by seed (counted on 200 seeds; rock 48k to 58k, the rest birds) and 7 draw calls (rock 1, full birds 1,
//   chicks 1, mid birds 1, cards 1, tower 1, burst 1), no lights.
// ROCK SHADER (makeRockMaterial), by kind of surface: risers (columns, guano crust ending in a lumpy lip with dribbles;
//   MEND 6: the whitewash is white (the birds' own cream, mean albedo 0.64 0.61 0.52 where live's was a tan 0.48 0.45 0.37) and
//   follows the birds: each riser's curtain is as long as the ledge above it is full (aFill, from the form's own ledge widths; a
//   ledge the seating rule leaves bare has black rock under it), thick crust bridges the cracks between the flutes, each tongue
//   ends in a point, and the lowest 1.15 m of every riser is bare black rock behind the frieze of the ledge below.
//   MEND 7 REWROTE WHERE AND HOW FAR THE WHITEWASH RUNS (the law stands at the riser, in the shader): it lies where the birds
//   are thick (a slow noise of the stack's own place, raised a little on the windward bearings (uWindTo: the wind's own
//   bearing, nothing of the eye), under the broad ledges and toward the summit; none under an empty ledge; less beside and
//   over the arch), in pours of uneven length with bare stretches of lip between and a short crust under a seated lip; the near
//   law holds whole at 22 m and is mixed out to 90 m, the far law holds from 90 m (by the eye's distance, never its facing), and
//   the bare columns close to are dark basalt. (Mend 7 had streaks close to and fields of white from afar; both are rewritten.)
//   ORDER 4: from afar the white is a stain that hangs from the lips, stripes tier over tier, never a face. ORDER 5: close to, the white is ONE STAIN hanging from the seated lip across the columns'
//   borders; its lower edge wanders in tongues wider and narrower than a column (no gated pours with upright sides: they were
//   white boards beside dark boards). From afar (90 m and more) nothing is changed. Mend 6's cover by halves (windward half of a riser, lee a quarter) no longer stands.
//   The far lift of the lit flank is given to the whitewash only (the
//   bare rock between the curtains keeps a small lift of its own, retuned in order 4: see its line in the shader), so the stripes hold from the run-in;
//   its fine flake octaves fade with distance so the edge never breaks into pixel flakes; the shaded side keeps a
//   slate ambient and, within 75 m, a slate floor (0.046 to 0.09 linear in the golden hour, lower at night by the mood's colours: the world's grade turns anything under 0.04 to pure black) under every recess: nothing beside the climb is black but the cracks; the columns' uneven widths, their cracks, staggered joints and turned faces are order 4's, one pattern of the stack that is the same on every seed (its hashes carry no seed)), treads (a trampled whitewashed floor with nests at pecking distance: weed ring, pale saucer, mud between; seen from below, under an overhang, the same slate floor from any distance;
//   the summit floor has no drawn nests, only mottled trampled guano under its sitting birds), the skirt (tar-black kelp shelf, foam as lace, white water pouring off its lip) and, from far off,
//   the sunward flank and the sunward silhouette edge lifted to cream (above the wet foot, which stays dark to the waterline) so the west side blazes on every seed.
// LIGHT: self-lit ShaderMaterials (they ignore scene lights so the whites can be held): one hard low key (uSunDir),
//   hemisphere ambient (uSkyCol above, uShadeCol below), scene fog honoured. Birds on the summit take a warm bounce
//   off the pale floor on their shaded sides (cream bodies against the low sun, not slate). Lit plumage peaks near 0.9, below bloom.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const H = 170, ARCH_X = 40, ARCH_HW = 15, ARCH_SPRING = 13, ARCH_TOP = 26, ARCH_CW = 1.1, TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#12161C', '#3B4650', '#1D564E', '#2E9A7E', '#F4F0E4', '#E3B04B', '#7FE6C8'];
const DEV_CLOSE = 0; // dev only: 1..3 moves the part viewer close to the face

const smax = (a, b, k) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const wrapPi = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const wrap2 = (a) => { a %= TAU; return a < 0 ? a + TAU : a; };
const archHalf = (y) => (y <= ARCH_SPRING ? ARCH_HW : y >= ARCH_TOP ? 0 : ARCH_HW * Math.sqrt(1 - ((y - ARCH_SPRING) / (ARCH_TOP - ARCH_SPRING)) ** 2));

// ---------------------------------------------------------------------------------------------
// The stack's form: tiers of columns. Everything else (birds, helix, arch lining) asks this object.
// ---------------------------------------------------------------------------------------------
function makeForm(rng, noise) {
  const P = {
    bodyR: rng.range(44, 46.5), eastFlat: rng.range(6, 9), prowX: rng.range(67, 71), prowW: rng.range(15.5, 17.5),
    prowY0: rng.range(36, 46), prowY1: rng.range(88, 108), nAmp: rng.range(2.0, 3.2), nOff: rng.range(0, 50),
    lean: rng.range(0.35, 0.6), taper: rng.range(0.82, 1.0),
  };
  const feats = []; // chimneys (negative) and overhangs (positive)
  const nCh = rng.int(3, 5);
  for (let k = 0; k < nCh; k++) feats.push({ th: rng.range(1.2, TAU - 1.2), w: rng.range(0.06, 0.12), d: -rng.range(2.2, 4.5), y0: rng.range(10, 90), y1: rng.range(110, 175) });
  for (let k = 0; k < 2; k++) { const y0 = rng.range(40, 110); feats.push({ th: rng.range(1.3, TAU - 1.3), w: rng.range(0.25, 0.45), d: rng.range(1.6, 3.2), y0, y1: y0 + rng.range(22, 40) }); }
  // big forms: buttresses and recesses running most of the height, and shoulders (terraces) that set a sector back
  const nBig = rng.int(4, 6);
  for (let k = 0; k < nBig; k++) feats.push({ th: rng.range(0.9, TAU - 0.9), w: rng.range(0.22, 0.5), d: rng.range(2.5, 6) * (rng.chance(0.45) ? -1 : 0.8), y0: rng.range(-20, 50), y1: rng.range(90, 200) });
  const nSh = rng.int(2, 3);
  for (let k = 0; k < nSh; k++) feats.push({ th: rng.range(1.0, TAU - 1.0), w: rng.range(0.4, 0.8), d: -rng.range(3.5, 7), y0: rng.range(35, 135), y1: 400, sharp: 1 });
  const waistA = rng.range(1.2, 3), waistP = rng.range(0, TAU);
  // terraces: most of the stack's taper is taken in three steps (filled in at the end of this function, after every
  // other draw), so the silhouette has shoulders and three ledges are broad shelves carpeted with birds
  const terr = []; let terrSum = 0;
  const inset = (y) => {
    let v = (P.bodyR - 28 - terrSum) * Math.pow(clamp(y / H, 0, 1), P.taper) + waistA * Math.sin(clamp(y / H, 0, 1) * Math.PI) * Math.sin(y * 0.045 + waistP);
    for (const t of terr) v += t.d * smoothstep(t.y, t.y + 0.5, y);
    return v;
  };
  function shapeR(th, y) {
    const S = inset(y), tw = wrapPi(th), c = Math.cos(tw), s = Math.abs(Math.sin(tw));
    let r = P.bodyR - S - P.eastFlat * Math.exp(-(tw / 0.9) * (tw / 0.9)) * (1 - 0.6 * smoothstep(60, 150, y));
    if (c > 0.15) {
      const up = smoothstep(P.prowY0, P.prowY1, y);
      const X = lerp(P.prowX, r, up) - S * 0.5, w = P.prowW * (1 - 0.5 * up) - S * 0.4;
      r = smax(r, Math.min(X, w / Math.max(s, 1e-3)), 2.0) - 0.4;
    }
    r += P.nAmp * noise.fbm3(Math.cos(tw) * 1.7 + P.nOff, Math.sin(tw) * 1.7, y * 0.013, 3);
    for (const f of feats) {
      if (y <= f.y0 || y >= f.y1) continue;      // (its height terms are exactly zero there)
      const d = wrapPi(th - f.th) / f.w; if (Math.abs(d) > 3) continue;
      r += f.d * (f.sharp ? smoothstep(2.2, 1.2, Math.abs(d)) : Math.exp(-d * d)) * smoothstep(f.y0, f.y0 + (f.sharp ? 1 : 8), y) * (1 - smoothstep(f.y1 - 8, f.y1, y));
    }
    return r;
  }
  // tiers: nominal base heights; tier 0 stands in the sea
  const yb = [-4, rng.range(5, 7.5)];
  while (yb[yb.length - 1] < H - 9.5) yb.push(yb[yb.length - 1] + rng.range(4.6, 9));
  yb.push(H);
  const nT = yb.length - 1;
  // global blocks: breakpoints where ledges step up or down
  const blocks = [0];
  for (;;) { const nx = blocks[blocks.length - 1] + rng.range(9, 26) / 40; if (nx > TAU - 0.2) break; blocks.push(nx); }
  const nB = blocks.length, off = [];
  for (let i = 0; i <= nT; i++) { const a = new Float32Array(nB); if (i > 0) for (let b = 0; b < nB; b++) a[b] = (i === nT ? 0.5 : 1.7) * rng.range(-1, 1) * (rng.chance(0.3) ? 0.2 : 1); off.push(a); }
  const blockOf = (th) => { th = wrap2(th); let b = nB - 1; while (b > 0 && blocks[b] > th) b--; return b; };
  const tierY = (i, th) => yb[i] + off[i][blockOf(th)];
  const wob = new Float32Array(nT + 1); for (let i = 0; i <= nT; i++) wob[i] = rng.range(0, 100);
  for (const [ya, yb2] of [[46, 62], [90, 108], [130, 146]]) { const t = { y: rng.range(ya, yb2), d: rng.range(2.6, 4.6) }; terr.push(t); terrSum += t.d; }
  // (the last angle asked of each tier is kept: footR / topR ask the same one two or three times running)
  const rawTh = new Float64Array(nT + 2).fill(NaN), rawV = new Float64Array(nT + 2);
  const raw = (i, th) => {
    if (rawTh[i] === th) return rawV[i];
    const v = shapeR(th, Math.max(yb[i], 0)) + 1.25 * noise.n2(Math.cos(th) * 5.5 + wob[i], Math.sin(th) * 5.5 - wob[i]);
    rawTh[i] = th; rawV[i] = v; return v;
  };
  // each tier is set back from the one below by at least a bird's width where it can be (LEDGE), so ledges run on
  // as unbroken shelves; overhangs still happen where the tier below was itself held back
  const LEDGE = 0.62;
  const footR = (i, th) => (i === 0 ? raw(0, th) : Math.min(raw(i, th), raw(i - 1, th) + P.lean - LEDGE));
  const topR = (i, th) => footR(i, th) + P.lean;
  const tierAt = (y, th) => { const b = blockOf(th); let i = 0; while (i < nT - 1 && yb[i + 1] + off[i + 1][b] < y) i++; return i; };      // (one block lookup, not one a tier)
  // rock surface radius at (th, y), and the outermost lip near a height (for clearances)
  const surfR = (th, y) => { const i = tierAt(y, th), y0 = tierY(i, th), y1 = tierY(i + 1, th); return footR(i, th) + P.lean * clamp((y - y0) / Math.max(y1 - y0, 0.1), 0, 1); };
  const lipRadius = (th, y) => { let m = 0; for (let i = 0; i < nT; i++) { const yt = yb[i + 1]; if (yt > y - 11 && yt < y + 6) m = Math.max(m, topR(i, th) + 0.35); } return m || topR(nT - 1, th); };
  // the wall beside a flyer at height y: the rock at that height and every lip within 4.5 m above or below it
  const wallRadius = (th, y) => { let m = surfR(th, clamp(y, 0, H)); const b = blockOf(th); for (let i = 0; i < nT; i++) { const yt = yb[i + 1] + off[i + 1][b]; if (yt > y - 4.5 && yt < y + 4.5) m = Math.max(m, topR(i, th) + 0.3); } return m; };
  // the ledge lip nearest a height: { r, y }
  const ledgeNear = (th, y) => { let bi = 0, bd = 1e9; for (let i = 0; i < nT - 1; i++) { const d = Math.abs(tierY(i + 1, th) - y); if (d < bd) { bd = d; bi = i; } } return { r: topR(bi, th), y: tierY(bi + 1, th) }; };
  return { P, yb, nT, blocks, nB, blockOf, tierY, footR, topR, surfR, lipRadius, wallRadius, ledgeNear, shapeR };
}

// ---------------------------------------------------------------------------------------------
// Rock geometry: tiers (riser + tread), summit cap, skirt, the arch lining (wall columns + honeycomb vault). One indexed mesh, no normals
// (the shader takes facet normals from derivatives, which is what columnar rock wants).
// aData = (kind, lip, riserH, hash): kind 0 riser (lip = metres below the lip), 1 tread (lip = metres in
// from the lip), 2 skirt (lip = metres out from the foot), 3 the arch's lining (see the arch block below).
// ---------------------------------------------------------------------------------------------
// the columns' steps in and out (JIT) and their bulge; the awash shelf's four rings at a bearing, [radius, height]
// each, from its inner edge fr (jit: its column's step)
const JIT = 0.3, BULGE = 0.22;
const shelfRings = (noise, th, fr, jit) => {
  const cx = Math.cos(th), sz = Math.sin(th), n1 = noise.n2(cx * 9 + 3, sz * 9), n2 = noise.n2(cx * 5 - 7, sz * 5 + 2);
  return [fr, 1.9 + 0.7 * n1 + jit, fr + 4.5 + 1.5 * n2, 1.1 + 0.6 * n1, fr + 9.5 + 2.5 * n2, 0.2 + 0.5 * n2, fr + 13 + 2.5 * n2, -3.5];
};
async function buildRockGeometry(form, rng, noise, ctx) {
  const pos = [], dat = [], idx = [], fil = []; let fillNow = 0;      // fil -> aFill: how full the ledge on top of a riser is (set per column edge below; 0 everywhere else)
  const V = (th, r, y, kind, lip, rh, h) => { pos.push(Math.cos(th) * r, y, Math.sin(th) * r); dat.push(kind, lip, rh, h); fil.push(fillNow); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => { idx.push(a, b, c, a, c, d); };
  const { nT, blocks, nB, tierY, footR, topR } = form;
  let skirtCols = null;
  for (let i = 0; i < nT; i++) {
    // columns of this tier: every block boundary is a column boundary
    const cols = [];
    for (let b = 0; b < nB; b++) {
      const t0 = blocks[b], t1 = b + 1 < nB ? blocks[b + 1] : TAU, rr = Math.max(18, footR(i, (t0 + t1) * 0.5));
      let t = t0;
      while (t < t1 - 1e-5) {
        let w = rng.range(1.25, 2.5) / rr; if (t + w > t1 - 0.7 / rr) w = t1 - t;
        cols.push({ a: t, b: t + w, jit: rng.range(-JIT, JIT) * (rng.chance(0.2) ? 0.25 : 1), drop: 0, mf: rng.range(0.3, 0.7), bulge: rng.range(-BULGE, BULGE), h: rng() });
        t += w;
      }
    }
    await ctx.yield();
    const first = pos.length / 3, last = i === nT - 1;
    const vc = []; // vertex columns: base index of 5 verts each
    for (const c of cols) {
      if (vc.length % 20 === 18) await ctx.yield();
      for (let e = 0; e < 2; e++) {
        const eps = 0.03 / 40, th = e === 0 ? c.a + eps : c.b - eps;
        const fr = footR(i, th) + c.jit, tr = topR(i, th) + c.jit, yF = tierY(i, th), yT = tierY(i + 1, th);
        const yB = yT - Math.min(c.drop, (yT - yF) * 0.3), rh = yB - yF, yM = lerp(yF, yB, c.mf);
        // THE WHITEWASH FOLLOWS THE BIRDS (aFill). By the seating rule of collectSpots a ledge under 9.5 m or narrower than
        // 0.42 m carries no bird: its riser gets 0.12 (a trace under the lip, the rock black). A seated ledge gives
        // 0.85 (a single file) to 1.5 (2.6 m wide: three rows and more; the summit's rim too): the shader multiplies the
        // length of this riser's curtain by it. No chance in it: the form's own widths.
        const wl = last ? 3 : tr - c.jit - footR(i + 1, th);
        fillNow = last || (yT > 9.5 && wl >= 0.42) ? lerp(0.85, 1.5, smoothstep(0.42, 2.6, wl)) : 0.12;
        const base = V(th, fr, yF, 0, rh, rh, c.h);
        V(th, lerp(fr, tr, c.mf) + c.bulge, yM, 0, yB - yM, rh, c.h);
        V(th, tr, yB, 0, 0, rh, c.h);
        V(th, tr, yB, 1, 0, rh, c.h);
        const ir = last ? tr - 2.2 : footR(i + 1, th) - 0.4;
        V(th, ir, last ? yT + 0.35 : yT + 0.04, 1, Math.max(tr - ir, 0.1), rh, c.h);
        vc.push(base);
      }
    }
    fillNow = 0;
    const n = vc.length;
    for (let k = 0; k < n; k++) {
      const a = vc[k], b = vc[(k + 1) % n];
      quad(a, b, b + 1, a + 1); quad(a + 1, b + 1, b + 2, a + 2); quad(a + 3, b + 3, b + 4, a + 4);
    }
    if (i === 0) skirtCols = cols;
    if (last) { // summit cap: two more rings and a centre
      const ring = [];
      await ctx.yield();
      for (const c of cols) for (let e = 0; e < 2; e++) {
        const th = e === 0 ? c.a + 1e-3 : c.b - 1e-3, r0 = topR(i, th) - 2.2, y = H + 0.35;
        const m = V(th, r0 * 0.6, y + 1.2 + 1.3 * noise.n2(Math.cos(th) * 3, Math.sin(th) * 3), 1, 6, 4, c.h);
        V(th, r0 * 0.27, y + 2.2 + 1.2 * noise.n2(Math.cos(th) * 2 + 9, Math.sin(th) * 2), 1, 9, 4, c.h);
        ring.push(m);
      }
      const cen = V(0, 0, H + 3.2, 1, 12, 4, 0.5);
      for (let k = 0; k < n; k++) {
        const a = vc[k] + 4, b = vc[(k + 1) % n] + 4, c = ring[k], d = ring[(k + 1) % n];
        quad(a, b, d, c); quad(c, d, d + 1, c + 1); idx.push(c + 1, d + 1, cen);
      }
    }
    void first;
    await ctx.yield();
  }
  { // skirt: a wave-cut shelf 12 m wide, awash
    const vc = [];
    for (const c of skirtCols) for (let e = 0; e < 2; e++) {
      if (vc.length % 30 === 29) await ctx.yield();
      const th = e === 0 ? c.a + 1e-3 : c.b - 1e-3, s = shelfRings(noise, th, footR(0, th) + c.jit - 0.4, c.jit);
      const base = V(th, s[0], s[1], 2, 0, 0, c.h);
      V(th, s[2], s[3], 2, 4.5, 0, c.h);
      V(th, s[4], s[5], 2, 9.5, 0, c.h);
      V(th, s[6], s[7], 2, 13, 0, c.h);
      vc.push(base);
    }
    const n = vc.length;
    for (let k = 0; k < n; k++) { const a = vc[k], b = vc[(k + 1) % n]; quad(a, b, b + 1, a + 1); quad(a + 1, b + 1, b + 2, a + 2); quad(a + 2, b + 2, b + 3, a + 3); }
  }
  await ctx.yield();
  { // the arch: a gateway of real columns, continuous with the stack. Walls: vertical columns 0.75-1.2 m wide, each
    // standing in or out by its own depth, with the steps between them as faces of their own. Vault: the broken ends
    // of the columns above, a honeycomb of six-sided cells hanging at their own heights (stepped, never a smooth hoop).
    // aData = (3, e, a, hash): e = 0 on a cell's rim, 1 at its centre; a = -1 / +1 on a wall column's two edges.
    // The fragment shader cuts the stack's shell to the same stepped outline (ARCH_CW below), always inside this lining.
    const mouthZ = (x, y, sgn) => { let lo = 0, hi = 90; for (let it = 0; it < 14; it++) { const z = (lo + hi) * 0.5; if (Math.hypot(x, z) < form.surfR(Math.atan2(sgn * z, x), Math.max(y, 0))) lo = z; else hi = z; } return sgn * (lo + 0.45); };
    const push = (x, y, z, e, a, h) => { pos.push(x, y, z); dat.push(3, e, a, h); fil.push(0); return pos.length / 3 - 1; };
    const cl = (z, r) => Math.max(r[0], Math.min(r[1], z));
    const WY = [-4, 1, 5, 9, 12.2, 15.6], NW = WY.length;
    let zTop = -1e9, zBot = 1e9;
    for (const s of [-1, 1]) {
      const x0 = ARCH_X + s * ARCH_HW, rg = [];
      for (const y of WY) { rg.push([mouthZ(x0, y, -1), mouthZ(x0, y, 1)]); await ctx.yield(); }
      let z1 = -1e9, z0 = 1e9; for (const r of rg) { z1 = Math.max(z1, r[1]); z0 = Math.min(z0, r[0]); }
      zTop = Math.max(zTop, z1); zBot = Math.min(zBot, z0);
      let z = z1, px = null, n = 0;
      while (z > z0) {
        const w = rng.range(0.75, 1.2), h = rng(), d = 0.15 + 0.8 * Math.pow(rng(), 1.6) + 0.35 * (0.5 + 0.5 * noise.n2(z * 0.13, s * 9));
        const xs = [], a = [], b = [];
        for (let j = 0; j < NW; j++) {
          const x = x0 + s * (d + (j > 0 && j < NW - 1 ? rng.range(-0.1, 0.1) : 0)); xs.push(x);
          a.push(push(x, WY[j], cl(z, rg[j]), 1, -1, h)); b.push(push(x, WY[j], cl(z - w, rg[j]), 1, 1, h));
        }
        for (let j = 0; j + 1 < NW; j++) quad(a[j], b[j], b[j + 1], a[j + 1]);
        if (px) { // the step between this column and the last
          const p = [], q = [];
          for (let j = 0; j < NW; j++) { const zz = cl(z, rg[j]); p.push(push(px[j], WY[j], zz, 1, 0, h)); q.push(push(xs[j], WY[j], zz, 1, 0, h)); }
          for (let j = 0; j + 1 < NW; j++) quad(p[j], q[j], q[j + 1], p[j + 1]);
        }
        px = xs; z -= w;
        if (++n % 16 === 0) await ctx.yield();
      }
    }
    await ctx.yield();
    const NX = 30, CW = ARCH_CW, CL = 1.25, NZc = Math.ceil((zTop - zBot) / CL) + 2, Z0 = zTop + CL, ROW = NZc + 2;
    const E = (ix) => { const q = Math.min(Math.abs((ix + 0.5 - NX / 2) * CW) / ARCH_HW, 1); return ARCH_SPRING + (ARCH_TOP - ARCH_SPRING) * Math.sqrt(1 - q * q); };
    const Yc = new Float32Array(NX * ROW), Hc = new Float32Array(NX * ROW), rgC = [];
    for (let ix = 0; ix < NX; ix++) {
      for (let iz = -1; iz <= NZc; iz++) { const r1 = rng(), r2 = rng(); Yc[ix * ROW + iz + 1] = E(ix) + 0.2 + 1.0 * r1 * r1 + 0.7 * (0.5 + 0.5 * noise.n2(ix * 0.35 + 4, iz * 0.3)); Hc[ix * ROW + iz + 1] = r2; }
      const xm = clamp(ARCH_X + (ix + 0.5 - NX / 2) * CW, ARCH_X - ARCH_HW + 0.2, ARCH_X + ARCH_HW - 0.2);
      rgC.push([mouthZ(xm, E(ix) + 0.6, -1), mouthZ(xm, E(ix) + 0.6, 1)]);
      if (ix % 3 === 2) await ctx.yield();
    }
    const node = (ixe, hz) => [ARCH_X + (ixe - NX / 2) * CW + (((hz + ixe) & 1) ? -1 : 1) * 0.18 * CW + 0.06 * noise.n2(ixe * 7.3 + 1, hz * 3.1), Z0 - hz * CL * 0.5 + 0.1 * noise.n2(ixe * 5.1, hz * 4.7 + 9)];
    for (let ix = 0; ix < NX; ix++) {
      const r = rgC[ix];
      for (let iz = 0; iz < NZc; iz++) {
        const hz = 2 * iz + (ix & 1), zA = Z0 - hz * CL * 0.5;
        if (zA - CL > r[1] + 0.3 || zA < r[0] - 0.3) continue;
        const Y = Yc[ix * ROW + iz + 1], h = Hc[ix * ROW + iz + 1];
        const nd = [node(ix, hz), node(ix, hz + 1), node(ix, hz + 2), node(ix + 1, hz + 2), node(ix + 1, hz + 1), node(ix + 1, hz)];
        const vs = nd.map((q) => push(q[0], Y, cl(q[1], r), 0, 0, h));
        const cen = push((nd[1][0] + nd[4][0]) * 0.5, Y + rng.range(-0.14, 0.1), cl(zA - CL * 0.5, r), 1, 0, h);
        for (let k = 0; k < 6; k++) idx.push(vs[k], vs[(k + 1) % 6], cen);
        const side = (P, Q, jx, jz) => { // the face between this cell and a neighbour: it belongs to whichever hangs lower
          const Yn = Yc[jx * ROW + jz + 1], hh = Y < Yn ? h : Hc[jx * ROW + jz + 1];
          quad(push(P[0], Y, cl(P[1], r), 1, 0, hh), push(Q[0], Y, cl(Q[1], r), 1, 0, hh), push(Q[0], Yn, cl(Q[1], r), 1, 0, hh), push(P[0], Yn, cl(P[1], r), 1, 0, hh));
        };
        side(nd[2], nd[3], ix, iz + 1);
        if (ix + 1 < NX) { side(nd[3], nd[4], ix + 1, (ix & 1) ? iz + 1 : iz); side(nd[4], nd[5], ix + 1, (ix & 1) ? iz : iz - 1); }
      }
      await ctx.yield();
    }
  }
  await ctx.yield();
  // (the summit's rim is the top tier's own broken edge)
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  await ctx.yield();
  g.setAttribute('aData', new THREE.BufferAttribute(new Float32Array(dat), 4));
  g.setAttribute('aFill', new THREE.BufferAttribute(new Float32Array(fil), 1));
  await ctx.yield();
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 85, 0), 125);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Shared GLSL: the light every surface of the hero uses, and value noise.
// ---------------------------------------------------------------------------------------------
export const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uShadeCol;
vec3 gsLight(vec3 alb, vec3 n, float occl) {
  float ndl = max(dot(n, uSunDir), 0.);
  vec3 amb = mix(uShadeCol, uSkyCol, n.y * .5 + .5) * (.55 + .45 * occl);
  amb += uSunCol * .1 * smoothstep(-.7, .4, dot(n, uSunDir));
  return alb * (uSunCol * ndl * occl + amb);
}`;
const NOISE_GLSL = /* glsl */`
float h11(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h13(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;

function makeRockMaterial(shared, look) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uRock: { value: look.rock }, uGuanoCol: { value: look.guano }, uAlgae: { value: look.algae },
      uGuano: { value: look.guanoAmt }, uLichen: { value: look.lichenAmt }, uSeed: { value: look.seed },
      uWindTo: { value: new THREE.Vector2(look.wind ? look.wind.x : 0.92, look.wind ? look.wind.z : -0.38).normalize() },      // (mend 6) where the wind blows to, level
    }]),
    vertexShader: /* glsl */`
      attribute vec4 aData; attribute float aFill;
      varying vec3 vP, vV; varying vec4 vD; varying float vFill;
      #include <fog_pars_vertex>
      void main() {
        vD = aData; vP = position; vFill = aFill;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        vV = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRock, uGuanoCol, uAlgae; uniform float uGuano, uLichen, uSeed, uTime; uniform vec2 uWindTo;
      varying vec3 vP, vV; varying vec4 vD; varying float vFill;
      ${LIGHT_GLSL}
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      // (order 4) a ruled line cut into cells with UNEVEN borders: every whole number's border stands up to a quarter to either side
      // of it, by its own hash (key picks the family; per closes the ring). Returns the cell's number, the place inside it (0..1)
      // and its width (0.5 to 1.5): neighbours differ, some cells are twice as wide as others.
      vec3 gsCell(float x, float key, float per) {
        float i = floor(x), a = i + .5 * (h11(mod(i, per) * 3.7 + key) - .5), b = i + 1. + .5 * (h11(mod(i + 1., per) * 3.7 + key) - .5);
        if (x < a) { b = a; i -= 1.; a = i + .5 * (h11(mod(i, per) * 3.7 + key) - .5); }
        else if (x >= b) { a = b; i += 1.; b = i + 1. + .5 * (h11(mod(i + 1., per) * 3.7 + key) - .5); }
        return vec3(mod(i, per), (x - a) / (b - a), b - a);
      }
      void main() {
        float kind = vD.x;
        float axr = abs(vP.x - ${ARCH_X.toFixed(1)});
        if (kind < 2.5 && vP.y < ${ARCH_TOP.toFixed(1)} && axr < ${ARCH_HW.toFixed(1)}) {
          // the opening is cut column by column (the lining's own columns), so its outline is stepped, not a hoop
          float q = min((floor((axr + ${(ARCH_CW * 0.25).toFixed(3)}) / ${ARCH_CW.toFixed(2)}) + .5) * ${(ARCH_CW / ARCH_HW).toFixed(5)}, 1.);
          if (vP.y < ${ARCH_SPRING.toFixed(1)} + ${(ARCH_TOP - ARCH_SPRING).toFixed(1)} * sqrt(max(1. - q * q, 0.))) discard;
        }
        vec3 nv = normalize(cross(dFdx(vV), dFdy(vV)) + vec3(0., 0., 1e-9));
        vec3 n = normalize((vec4(nv, 0.) * viewMatrix).xyz), n0 = n;      // (n0: the facet's own normal, before the flutes turn it)
        // three ranges of detail: fine (inside 45 m), mid (cracks, joints, grain: to 260 m), far (streak lengths: to 700 m)
        float dist = length(vV), fine = 1. - smoothstep(10., 36., dist), detail = 1. - smoothstep(70., 260., dist), far = 1. - smoothstep(380., 700., dist);
        float nearK = 1. - smoothstep(22., 90., dist);      // (the band of distance live's own tongues use: all near at 22 m, all far from 90 m)
        vec3 p = vP;
        float fw = max(fwidth(vP.y), max(fwidth(vP.x), fwidth(vP.z)));      // metres to a pixel
        // columnar jointing: 546 flutes round the stack (0.46 m wide at 40 m from the axis), the same on every facet,
        // so streaks and cracks run on across triangles; in the arch the flutes stand along its length. A riser's
        // tier id comes from the height of its lip (height + metres below the lip), which no facet edge breaks.
        float ang = atan(p.z, abs(p.x) < 1e-3 ? 1e-3 : p.x), tier = kind < .5 ? floor((p.y + vD.y) * .731 + .37) : 0.;
        vec3 t3 = kind > 2.5 ? vec3(0., 0., 1.) : vec3(-sin(ang), 0., cos(ang));
        // (order 4) THE COLUMNS ARE STONE, NOT RIBS. The 546 flutes have uneven widths (gsCell: a half to one and a half of the mean,
        // by the flute's own number: the same from every eye), their cross joints lie at uneven heights staggered from column to
        // column, every column is a prism whose flat face is turned its own way and bevelled into its cracks (even round ribs read
        // as sheet metal or planks whatever their colour), and here and there one is broken back under its lip (the riser, below).
        vec3 cc = gsCell(ang * 86.8986 + .25 * sin(p.y * .21 + uSeed), 1.3, 546.);
        float cid = cc.x, cf = cc.y, cw = cc.z;
        float cs = cf * cf * (3. - 2. * cf), c0 = h11(cid * 13.7 + tier * 5.1 + uSeed), c1 = h11(mod(cid + 1., 546.) * 13.7 + tier * 5.1 + uSeed);
        float cellN = c0, cellS = mix(c0, c1, cs), cellF = h11(floor(ang * 14.4831) * 7.3 + tier * 5.1 + uSeed);
        float cellH = mix(.3, mix(cellF, cellS, detail), far);
        float edge = min(cf, 1. - cf) * cw, cols = kind < .5 || kind > 2.5 ? 1. : 0.;      // (edge: in mean flutes, so a crack is as wide beside a narrow column as beside a broad one)
        float crack = (1. - smoothstep(.0, .09, edge)) * detail * step(.01, cols);
        // each column is broken into blocks of its own length by cross joints
        float jy = p.y * (.3 + .45 * h11(cid * 5.3 + 2.9)) + 9. * h11(cid * 3.1 + 1.7);
        vec3 jc = gsCell(jy, cid * 1.37 + 7.1, 4096.);
        float blk = h11(cid * 7.7 + jc.x * 3.3), jd = min(jc.y, 1. - jc.y) * jc.z;      // (jd: how far from the nearest cross joint, in mean blocks)
        float tilt = (h11(cid * 9.1 + 4.3) - .5) * .7 + (cf - .5) * .2 + sign(cf - .5) * smoothstep(.26, .5, abs(cf - .5)) * .45, bkK = kind < .5 ? 1.4 * nearK : fine;
        // (the flutes, their cracks, joints and turned faces above and below are order 4's lines; colM is one flute's
        // width in metres at this radius, for the terms further down that measure from a crack in metres; two of them act out to 260 m)
        float rr = max(length(p.xz), 8.), colM = rr * .011508;
        if (kind > 2.5) {
          // the arch's lining is modelled column by column: its cracks follow the real edges (vD.y, vD.z), its
          // tone and joints the column's own number (vD.w)
          cellN = cellS = cellH = vD.w; edge = min(vD.y, 1. - abs(vD.z));
          float ew = max(.07, fwidth(edge) * 1.5);
          crack = (1. - smoothstep(0., ew, edge)) * (.07 / ew) * detail;
          cf = .5 + .5 * vD.z;
          jy = p.y * (.32 + .4 * vD.w) + 23. * vD.w; blk = fract(h11(floor(jy) * 3.3 + 1.7) + vD.w);
          jd = .5 - abs(fract(jy) - .5); tilt = (cf - .5) * .75;      // (the lining's modelled columns keep live's own joints and turn)
        }
        n = normalize(n + t3 * tilt * detail * cols);
        float joint = (1. - smoothstep(.0075, .035, jd)) * detail * step(.01, cols);
        n = normalize(n + t3 * (blk - .5) * .22 * bkK * cols);      // (each block of a riser's column stands a little its own way through the near band, not only inside 36 m)
        // rock grain: facets, a little relief in the normal, finer close to
        float g1 = vn3(p * vec3(2.3, 0.7, 2.3) + uSeed), g2 = vn3(p * 7. + 3.), g3 = vn3(p * vec3(9., 4., 9.) + 5.);
        n = normalize(n + detail * .22 * (vec3(g1, vn3(p * 2.9 + 11.), g2) - .5) + fine * .3 * (vec3(g3, g2, vn3(p * 11. + 9.)) - .5));
        vec3 alb = uRock * (0.6 + 0.3 * vD.w + 0.3 * g1 + .4 * mix(cellH, cellN, detail)) * (1. - .5 * joint) * (1. - .7 * crack) * mix(1., .86 + .28 * blk, bkK);
        alb = mix(alb, alb * vec3(1.25, 1.02, .85), smoothstep(.55, .8, vn3(p * .21 + uSeed)));
        float y = p.y, occl = 1., spec = 0., wet = 0., gu = 0.; vec3 gcol = vec3(0.);
        float sect = .35 + .65 * smoothstep(.18, .62, vn3(p * vec3(.045, .02, .045) + uSeed * 1.7));
        // nothing nests round the opening: the spray keeps the rock black there, a dark frame for the keyhole
        float archK = 1. - (1. - smoothstep(15.5, 20., axr + 1.5 * (g1 - .5))) * (1. - smoothstep(27., 33., y + 2. * g1));
        if (kind < .5) {
          // riser: black columns. Guano is caked thick and lumpy under the lip (a lobe to each column), thins into
          // ragged runs, and stops: the lower third to half of every riser is dark wet rock, at arm's length as from 300 m
          float d = vD.y, rh = max(vD.z, .5);
          // the finest octaves of the crust's edge fade as they near a pixel in size (they broke it into pixel flakes at 7-12 m)
          float k13 = 1. - smoothstep(.15, .5, fw * 13.), k19 = 1. - smoothstep(.15, .5, fw * 19.);
          vec2 qa = p.xz / rr * 40.;      // along the face only, so streaks run true down a leaning wall
          // (order 4) the whitewash's noises are keyed by the lip's HEIGHT (tq: one cell to 7.7 m), no longer by the tier's number:
          // where a ledge steps up or down at a block's border the number jumped and every noise with it, so the white ended in
          // a straight cut on the corner line; now it runs on across the corner and only the lip steps. kf1: the 0.9 m noises
          // fade to their mean as they near a pixel in size.
          float lipY = p.y + d, tq = lipY * .13, kf1 = 1. - smoothstep(.15, .5, fw * 1.1);
          float n1 = vn3(vec3(qa.x * .6, uSeed + tq, qa.y * .6));
          float n2 = mix(.5, vn3(vec3(qa.x * 3.1, 4.7, qa.y * 3.1)), far);
          float n3 = mix(.5, vn3(vec3(qa.x * 9., p.y * .3, qa.y * 9.)), detail);
          float gT = vn3(vec3(qa.x * .13, uSeed + 11. + tq, qa.y * .13)), zone = smoothstep(.56, .86, gT);      // about a third of sectors carry long curtains
          // THE SEVENTH MEND: DARK COLUMNAR ROCK, STAINED. The whitewash is no coat and no comb. All of it is a law of the stack's own
          // place (bearing, height, tier, the ledge's fullness vFill, the wind's bearing) and of the distance band live's own
          // tongues use (nearK: all near at 22 m, all far from 90 m); of the eye only its distance is read, never its facing; nothing reads the route or the seed's still.
          //  WHERE THE BIRDS ARE THICK (gather): a slow noise of the place (17 m along the face, 20 m of height) with the tier's own,
          //  raised on the windward bearings, under the broad ledges and toward the summit, none under an empty ledge, and fewer
          //  beside and over the arch (within 24 to 40 m of its axis, under 36 to 52 m), where the burst's spray washes the lips.
          // (order 4: where a ledge narrows to nothing across one panel its fullness runs down in a straight ramp, and the pours' lengths
          // with it: the white ended on a straight slant, a triangle. Close to, each column takes the ramp at its own step: order 5, a small
          // one, a third of what it was (a column's own share in the white is small against the stain's), and the ramp is taken by the
          // place's own noises along the lip (1.7 m and 0.3 m): the slant wanders in tongues.)
          float wwB = smoothstep(-.2, .8, -dot(normalize(p.xz + vec2(1e-4, 0.)), uWindTo)), seat = smoothstep(.3, .8, vFill + nearK * (.12 * (c0 - .5) + .3 * (n1 - .5) + .12 * (n2 - .5))), broad = smoothstep(.85, 1.5, vFill);
          float gN = vn3(vec3(qa.x * .06, lipY * .05 + uSeed * 2.3, qa.y * .06));
          // (order 4) FROM AFAR THE FIELDS LIE ACROSS SEVERAL TIERS WITH SOFT BORDERS: the slow noise of the place counts more (0.85 for
          // 0.6), the 7.7 m one less (0.15 for 0.45), the border is wider (0.4 to 0.66), windward and summit count a little more
          float gather = smoothstep(mix(.4, .44, nearK), mix(.66, .6, nearK), mix(.85, .6, nearK) * gN + mix(.15, .45, nearK) * gT + mix(.16, .1, nearK) * wwB + .08 * broad + mix(.25, .2, nearK) * smoothstep(120., 160., lipY)) * seat
            * (1. - .45 * (1. - smoothstep(24., 40., axr + 6. * (gN - .5))) * (1. - smoothstep(36., 52., lipY)));
          //  WHERE A LIP POURS (sw over thr) AND HOW FAR EACH POUR RUNS (L): noises of the place at 3 m, 0.9 m, 0.27 m and 8 cm along
          //  the lip, each tier its own. Close to (order 5) nothing is gated: one stain along a seated lip whose length wanders by
          //  these noises (mend 7 had streaks on stone there, two fifths of a full lip pouring); from afar: see ORDER 4 below
          //  (mend 7's far law, a gathered stretch pouring along nearly all its lip and to the foot, made whole faces white).
          //  (order 4) FROM AFAR THE WHITE IS A STAIN THAT HANGS FROM THE LIPS, NEVER A FACE: stripes, tier over tier. Every seated lip
          //  shows its pale line (the apron below, ungated from afar) and a stain under it: tongues by the 3 m and 0.9 m noises
          //  (much finer than a face's width), 0.28 of the riser where the birds are thin to 0.5 where they are thick plus each
          //  tongue's own length, and never more than 0.58 of the riser: no pour reaches the foot from afar, none lies corner to
          //  corner. (It was: a gathered stretch pours along nearly all its lip and to the foot: whole faces white, the next dark.)
          //  (ORDER 5) CLOSE TO, THE WHITE IS ONE STAIN THAT HANGS FROM THE LIP AND RUNS ACROSS THE COLUMNS' BORDERS. Order 4's near law
          //  gated the lip into pours by the place's noises along the lip alone: a pour's sides stood upright from the lip to the foot, as
          //  wide as a column or a few (white boards beside dark boards, a fence). Now, close to, nothing is gated (Wk is 1 at 22 m): the
          //  stain lies along the whole seated lip and its LENGTH wanders (Ln): a sum of the place's noises at 3 m, 0.9 m, 0.27 m and 8 cm
          //  along the lip, the wide ones carrying most of it (so a long tongue is a wide one and no side is upright for long), drawn
          //  toward long where the birds are thick and toward a short crust where they are thin (gather). The place the tongues are read
          //  at drifts along the lip with height (qw: 0.35 m to either side, over 2 m of height), so a tongue's sides wander as they run
          //  down. The far law (nearK 0, from 90 m) is as it was in every value; between 22 and 90 m the two are mixed.
          //  (The shares .55 / .29 / .11 / .05 and the knee .4 wide were tuned on the bench's whole field at chance places, beside live:
          //  with more on the fine noises and a narrower knee a gap stood as a dark spire one column wide with upright sides, and a
          //  thinly seated lip carried next to no white where live has tongues.)
          float wv = (vn3(vec3(qa.x * .5, p.y * .45, qa.y * .5) + 7.) - .5) * .7 * nearK; vec2 qw = qa + t3.xz * wv;
          float a1 = vn3(vec3(qw.x * .33, uSeed * 1.3 + tq, qw.y * .33)), b1 = mix(.5, vn3(vec3(qw.x * 1.1, 3.1 + tq, qw.y * 1.1)), kf1);
          float b2 = mix(.5, vn3(vec3(qw.x * 3.7, 7.7 + tq, qw.y * 3.7)), far), b3 = mix(.5, vn3(vec3(qw.x * 12., 1.3 + tq, qw.y * 12.)), nearK * k13);
          float sw = mix(.55, .15, nearK) * a1 + mix(.45, .35, nearK) * b1 + mix(0., .35, nearK) * b2 + .15 * nearK * b3;
          float thr = mix(mix(.62, .3, gather), mix(.56, .52, gather), nearK), eW = mix(.1 + .3 * fw, .025, nearK), Wk = mix(smoothstep(thr - eW, thr + eW, sw), 1., nearK);
          float e1 = mix(.5, vn3(vec3(qw.x * .8, 5.3 + tq, qw.y * .8)), kf1), e2 = mix(.5, vn3(vec3(qw.x * 2.9, 9.3 + tq, qw.y * 2.9)), far);
          float L0 = min(rh * (mix(mix(.28, .42, nearK), mix(.5, 1., nearK), gather) + .5 * e1 * e1 * e1 + mix(.1, .25, nearK) * zone + mix(.05, .2, nearK) * (e2 - .5) + .3 * (1. - nearK) * (a1 - .5)) * mix(.75, 1., smoothstep(thr, thr + .12, sw)) * sect * uGuano * mix(.12, mix(.9, 1.2, broad), seat), rh * mix(.58, .88, nearK));
          float Tn = .55 * a1 + .29 * b1 + .11 * b2 + .05 * b3, tlo = mix(.36, .22, gather), Tk = smoothstep(tlo, tlo + .4, Tn);
          float Ln = min(rh * (.1 + .78 * Tk + .2 * (e2 - .5) * Tk) * sect * uGuano * mix(.12, mix(.9, 1.2, broad), seat), rh * .88);
          float L = mix(L0, Ln, nearK);
          float rag = (n3 - .5) * .9 + (vn3(vec3(qa.x * 2.3, 1.9, qa.y * 2.3)) - .5) * .8 * detail + (vn3(vec3(qa.x * 21., p.y * 1.1, qa.y * 21.)) - .5) * .4 * nearK * k19;
          float dd = d + rag * (.2 + .12 * L), v = dd / max(L, .2);
          float sN = vn3(vec3(qa.x * 7., p.y * .7, qa.y * 7.)) * .6 + mix(.5, vn3(vec3(qa.x * 19., p.y * 2.3, qa.y * 19.)), k19) * .4;
          // (a pour's end: from afar a soft-edged tongue; close to it thins into dribbles and flecks, as before)
          // (order 4: from afar a tongue ends over the last quarter of its length, never sharper than a pixel: fwL)
          float fwL = fw / max(L, .2), tailS = 1. - smoothstep(.5 - .25, 1.1, v), cov = Wk * tailS;
          float cake = Wk * mix(1. - smoothstep(mix(.72, .5, nearK) - fwL, 1.05 + fwL, v), smoothstep(-.07, .07, tailS - sN * .9), nearK * .4);
          //  THE APRON: a short crust under a seated lip (0.1 to 1 m, its own depth by the place), none along the bare stretches
          //  (order 4: from afar it lies along EVERY seated lip, a little deeper, its edge no sharper than a pixel: the tier's pale line.
          //  Close to, the lip itself keeps a crust of 0.1 to 0.26 m all along, so the line a tier shows from afar is there at arm's length too)
          float apD = (mix(.25, .1, nearK) + .3 * n3 + .3 * b1) * mix(1., 1.3, broad), apron = (1. - smoothstep(.3 * apD - fw, apD + fw, d + .3 * rag * apD)) * .95 * seat * mix(1., smoothstep(thr - .03 - .05, thr - .03 + .05, sw), nearK);
          apron = max(apron, (1. - smoothstep(.04, .1 + .16 * n3, d)) * .9 * seat);
          //  LIGHT AND SHADE IN THE WHITE: the upper part of a pour is thick crust, its lower part a thin wash (less of it, and grey: below)
          float thinK = smoothstep(.35, .95, v);
          gu = max(cake * mix(1., .62, thinK), apron);
          // spatter on the dark rock below: flecks and dribbles, sparse
          gu = max(gu, smoothstep(.7, .78, vn3(p * vec3(8., 5., 8.) + 3.)) * smoothstep(.45, .7, vn3(p * 1.7 + 31.)) * detail * .4 * (1. - .85 * nearK));      // (from a little way off; at arm's length the flecks were round spots on a plate)
          // (the rock shows at column edges and joints in patches only: ruled lines all over would read as planks)
          float bare = smoothstep(.42, .7, vn3(p * vec3(1.1, .6, 1.1) + 17.));
          // where the crust is thick (the upper part of the curtain) it bridges the cracks between the flutes and fills their
          // hollows: one white band under the lip, breaking into tongues lower down, not a row of planks
          float thick = max(cake * (1. - smoothstep(.35, .8, v)), apron);
          gu *= smoothstep(6.5, 15., y + 3. * n1) * (1. - mix(.55, .55 + .4 * bare, fine) * crack * (1. - .85 * thick) * mix(.15, 1., nearK)) * (1. - .4 * joint * fine * bare * (1. - .85 * thick)) * archK;
          // THE BLACK FOOT: no whitewash reaches the lowest 1.15 m of a riser (a sitting bird's height) and it thins out over
          // the 1 to 1.7 m above that, so the frieze of the ledge below stands cream against black rock at every distance
          // (order 4: close to, the fade above the black foot starts at a height of each column's own, up to 2 m higher: a long pour
          // feathers out in tongues there and does not end on one level line)
          gu *= 1. - smoothstep(rh - (2.1 + .7 * n1) - 2. * nearK * (.6 * e2 + .4 * sN), rh - 1.15, d);
          // (order 4) HERE AND THERE A COLUMN IS BROKEN BACK UNDER ITS LIP (about one in six, 0.3 to 1.3 m down, by its own number): the
          // face in the notch is in the lip's shade and carries little whitewash, its floor is a pale sill: the lip line steps
          // (order 5: in the one stain the notches stood as black squares, missing tiles; the notch's face now keeps three quarters of its
          // whitewash and half of that shade: a step in the white, not a hole)
          float brk = step(.82, h11(cid * 3.3 + tier * 7.9 + 2.1)) * nearK, brD = .3 + h11(cid * 6.1 + tier * 2.3 + 9.);
          float notch = brk * (1. - smoothstep(brD - .04, brD + .04, d)), sill = brk * smoothstep(brD - .04, brD + .02, d) * (1. - smoothstep(brD + .03, brD + .18, d));
          gu = max(gu * (1. - .25 * notch), .85 * sill * seat);
          n = normalize(mix(n, vec3(0., 1., 0.), .55 * sill));
          n = normalize(mix(n, n0, .7 * thick * gu));
          // close to, it is caked and splattered, not painted: rock shows through in pocks and at the column edges
          float spl = vn3(vec3(p.x + p.y * .35, p.y - p.z * .3, p.z + p.x * .4) * 6.5) * .55 + mix(.5, vn3(vec3(p.x + p.z * .6 + p.y * .3, p.y - p.x * .4, p.z - p.x * .7) * 13. + 7.), k13) * .45, drip2 = vn3(vec3(qa.x * 23., p.y * 1.3, qa.y * 23.));      // (sheared, so the noise's grid never lines up with the wall)
          gu *= mix(1., .4 + .6 * smoothstep(.34, .52, spl + .25 * (gu - .5)), fine) * (1. - .6 * fine * bare * (1. - smoothstep(.0, .2, edge)));
          gu *= mix(1., .5 + .5 * smoothstep(.28, .5, vn3(p * vec3(2.6, 1.7, 2.6) + 3.)), fine * .85);      // thin, scuffed patches the size of a bird
          // (no whitewash is run down the joints: the gap between two flutes stays dark, as live draws it)
          // the crust's lumps are in its colour (l0, below); its normal is live's own line, so the flutes' own turn reads through it
          vec3 lp = p * vec3(5., 3.2, 5.) + 1.; float l0 = vn3(lp);
          n = normalize(n + fine * gu * .5 * (vec3(spl, drip2, vn3(p * 31. + 3.)) - .5));
          // (mend 7) THE BARE COLUMNS ARE DARK BASALT, NOT OCHRE BOARDS: close to, the rock between the streaks loses most of its warm
          // cast and half its lightness (live's slate floor and the sky on the cracks' edges stay); each face keeps a tone of its own, less
          // (order 4) THE ROCK IS BLACK AND ITS HUE STANDS APART FROM THE SEA'S. The albedo stays as dark as mend 7 made it; its cast is
          // now the one that turns the low key into a warm dark GREY on the lit faces (the key over a neutral albedo read as rust).
          // The lightness that comes back comes back as LIGHT, on lit faces only (the lighting below); so does the teal's cure.
          alb = mix(alb, dot(alb, vec3(.3333)) * vec3(.8, 1., 1.35), .8 * nearK) * mix(1., .5, nearK);
          // (order 4: the lichen's fine grain fades as it nears a pixel in size, and it stains a little more: it is the design's warmth
          // on the upper tiers, rusty orange and sea-ivory where the white is thin)
          float k43 = 1. - smoothstep(.15, .5, fw * 4.3);
          float lich = smoothstep(.56, .7, vn3(p * .55 + 20.)) * (.35 + .65 * mix(.5, smoothstep(.3, .6, vn3(p * 4.3)), k43)) * smoothstep(98., 128., y + 14. * n1) * uLichen;
          vec3 lc = mix(vec3(.50, .22, .035), vec3(.42, .43, .33), step(.6, vn3(p * .17 + 40.)));
          // (order 5: close to, the stone is half as light as live's and the lichen was not: it stood as bright orange paint beside the
          // one stain. Close to it takes three quarters of its tone and live's own share; from 90 m every value is as it was.)
          alb = mix(alb, lc * mix(.8, .6, nearK), lich * (1. - gu) * (.5 - .2 * nearK + .3 * n3));
          // the foot of the riser is wet and darker; rust weeps from a few joints
          float foot = smoothstep(.25, .7, d / rh);
          // (close to, the columns must read: each face its own tone, lifted out of black; from far off the riser stays black)
          alb *= mix(1., .8, foot) * mix(1., 1.02 + .4 * (c0 - .5), nearK);
          alb = mix(alb, alb * vec3(1.35, .98, .7), smoothstep(.6, .8, vn3(vec3(qa.x * 3.3, p.y * .35 + 5., qa.y * 3.3))) * foot * .28 * detail * (1. - .6 * nearK)
            * mix(1., clamp(1.6 * (1. - smoothstep(0., .14, edge * colM)) + 1.6 * joint, 0., 1.6), nearK));      // close to, the rust keeps to the joints it weeps from
          wet = max(wet, (1. - gu) * (.25 + .4 * foot) * mix(1., .3, smoothstep(8., 30., y)));      // (order 4: the rock is wet black below 8 m; by 30 m up it is three tenths as wet: the sky's sheen on wet ribs, seen along the wall, was half of the teal sheet metal)
          float drip = vn3(vec3(qa.x * 15., p.y * .7, qa.y * 15.)), old = vn3(p * vec3(.9, .5, .9) + 23.);
          // THE WHITEWASH IS WHITE. Its fresh crust has the birds' own cream (the design's albedo 0.78: uGuanoCol x 1.03 at the
          // middle of this bracket); age, stain, thin runs and lumps only grey it a little (they were brown: live's mean
          // was 0.48 0.45 0.37, a tan; now 0.64 0.61 0.52 against the birds' 0.74 0.71 0.64, counted over every riser the
          // climb, the crest and the run-in see)
          gcol = uGuanoCol * (.91 + .1 * n3 + .08 * cellH) * mix(vec3(1.), vec3(.98, .96, .9), n2 * (1. - smoothstep(0., 2.5, d)));
          gcol *= mix(vec3(1.), vec3(.92, .89, .82), smoothstep(.4, .72, old) * (1. - .35 * cake));      // older layers under the fresh: a little greyer and warmer
          gcol *= mix(1., .8, smoothstep(.3, 1., d / max(L, .3)) * n1) * mix(1., (.7 + .5 * drip) * (.76 + .48 * drip2), fine) * (1. - .4 * joint * (1. - .85 * thick)) * (.8 + .36 * l0) * (1. - .3 * (1. - smoothstep(0., .1, edge * colM)) * detail * (1. - .6 * thick) * mix(.15, 1., nearK));      // lumps, and a groove where a crack runs under the crust (thick crust hides the columns' cross joints and all but a trace of the groove: caked guano, not whitewashed masonry)
          gcol *= mix(1., .72, thinK * (1. - apron)) * (1. - .4 * smoothstep(.58, .74, vn3(vec3(qa.x * 6.3, p.y * .11 + 9., qa.y * 6.3))) * (1. - .5 * thick));      // (mend 7) the thin wash is grey, the wet runs (0.16 m wide, metres long) darker; the thick crust stays pale
          // nest stain: a warm smear 0.2-1.1 m below each lip
          gcol = mix(gcol, gcol * vec3(.93, .87, .76), smoothstep(.15, .4, d) * (1. - smoothstep(.7, 1.2, d)) * (.35 + .65 * n3) * .55 * detail);
          gcol = mix(dot(gcol, vec3(.3333)) * vec3(.95, .98, 1.07), gcol, mix(1., smoothstep(.2, .7, gu), nearK));      // (order 4) close to, a thin wash is a grey bloom on the stone, not cream paint thinned
          alb = mix(alb, gcol * .5, .14 * cov * (1. - gu) * nearK);      // a thin grey wash round the dribbles
          alb = mix(alb, gcol, gu);
          occl = mix(.45, 1., smoothstep(0., 1.6, rh - d)) * mix(.8, 1., smoothstep(0., .5, d)) * (1. - .3 * notch);
          // a column that stands proud of its neighbour shades it along the crack, on the side away from the light
          float sT = dot(uSunDir, t3), cN = sT > 0. ? c1 : h11(mod(cid - 1., 546.) * 13.7 + tier * 5.1 + uSeed), eN = (sT > 0. ? 1. - cf : cf) * cw * colM;
          occl *= 1. - .6 * (1. - smoothstep(0., .06 + .5 * max(cN - c0, 0.), eN)) * step(c0, cN) * smoothstep(.05, .3, abs(sT)) * detail * (1. - mix(.9, .5, nearK) * cake);
        } else if (kind < 1.5) { // tread: a whitewashed, trampled floor: nests at pecking distance, each a dark ring of weed round a pale saucer, mud between
          float sp = mix(.5, vn3(p * 5.), detail), up0 = n.y;
          float mot = vn3(p * vec3(1.3, .5, 1.3) + 9.);
          gu = clamp(.55 + .45 * sect + .2 * uGuano - .25 * smoothstep(.6, .8, sp), 0., 1.) * smoothstep(8., 14., y) * smoothstep(-.2, .3, up0) * archK;      // the lowest ledges are in the splash: wet black rock, no whitewash (one of them read as a pale slab by the south-west pier)
          // (mend 7) THE FLOOR IS TRAMPLED MUD AND WET ROCK WITH THE WHITEWASH IN SPLASHES (it was white all over, and a white bird was lost
          // on it): by the summit's own trampling noise, a little more of it under the broad ledges; the summit floor as it was
          float topK = smoothstep(168., 170.5, y) * step(.5, up0), kfS = 1. - smoothstep(.1, .28, fw);
          // (order 4) NOTHING THINNER THAN A PIXEL: a ledge seen so flat that its whole width (0.42 to 2.6 m, read back from vFill) is less
          // than a pixel and a half loses its whitewash in proportion; such white slivers were the far stack's hair-thin line shimmer
          gu *= mix(clamp((.42 + 3.35 * clamp(vFill - .85, 0., .65)) / (1.5 * max(fwidth(vD.y), 1e-4)), 0., 1.), 1., topK);
          float tr0 = vn3(p * vec3(.33, .2, .33) + 4.) * .5 + vn3(p * vec3(1.1, .4, 1.1) + 17.) * .3 + mix(.5, vn3(p * vec3(3.7, .5, 3.7) + 29.), kfS) * .2, tramp = smoothstep(.25, .75, tr0);
          gu *= mix(.3, 1., smoothstep(.45, .6, tr0 + .06 * smoothstep(.85, 1.5, vFill)) * (1. - topK) + topK);
          gcol = uGuanoCol * (.8 + .12 * sp + .14 * mot) * mix(vec3(.96, .94, .88), vec3(1.), mot) * mix(1., .78 + .4 * g3, fine);      // (the white tread: a tone under the risers' fresh crust)
          // close to, a tread is the ends of the columns under it: a pavement of six-sided heads half a metre across,
          // each its own tone and tilt, the whitewash worn through along the joints and off the proud heads
          vec2 hq = p.xz * 2.05 + .25 * vec2(vn3(p * .7 + 3.), vn3(p * .7 + 19.)), hs = vec2(1., 1.7320508), ha = mod(hq, hs) - .5 * hs, hb = mod(hq - .5 * hs, hs) - .5 * hs, hg = dot(ha, ha) < dot(hb, hb) ? ha : hb;
          float hd = .5 - max(abs(hg.x), dot(abs(hg), vec2(.5, .8660254))), hh = h13(vec3(floor((hq - hg) * 2. + .5), 9.)), hK = (1. - smoothstep(.05, .2, fw)) * step(.5, up0);
          float hj = (1. - smoothstep(.0, .035 + 2. * fw, hd)) * hK;
          alb *= mix(1., .78 + .44 * hh, hK) * (1. - .6 * hj);
          gu *= 1. - hK * (.5 * hj + .3 * smoothstep(.62, .8, hh) * smoothstep(.35, .6, sp));
          // the rows wander, a quarter of the places are bare, every nest has its own size and a ring broken by trampling
          vec2 nq = p.xz / .82 + vec2(.3 * sin(p.z * 1.3 + uSeed) + .13 * sin(p.x * 2.9 + p.z * 1.7), .3 * sin(p.x * 1.1 - uSeed) + .13 * sin(p.z * 3.1 - p.x * 1.3)), ni = floor(nq), nf = fract(nq) - .5;
          float nh = h13(vec3(ni, 7.)), nsz = .72 + .5 * h13(vec3(ni, 11.)), nr = length(nf - (vec2(nh, h13(vec3(ni, 3.))) - .5) * .5) / nsz;
          float nestK = (1. - smoothstep(22., 60., dist)) * step(.26, nh) * step(.5, up0);
          float ring = smoothstep(.11, .16, nr) * (1. - smoothstep(.2, .27, nr)) * smoothstep(.28, .55, vn3(p * 6.5 + 3.) + .3 * nh);
          // (the summit floor keeps this to 45 m and is a tone darker than the ledges' whitewash further off, so the birds on it stand above it)
          // (the summit floor carries no drawn nests: from the crest a floor of rings read as a stamped pattern. Its birds
          // bring their own; the floor is trampled guano, darker than the ledges' whitewash and mud-dark in irregular
          // patches of every size, so the cream bodies stand two tones above it)
          nestK *= 1. - topK;
          gcol = mix(gcol, gcol * vec3(.56, .52, .42), nestK * smoothstep(.3, .5, nr * nsz + .2 * (sp - .5)) * (.45 + .5 * mot));      // trampled, damp ground between the nests
          gcol *= mix(vec3(1.), mix(.66, .9, tramp) * vec3(1., .97, .9), topK);
          // each bird on the summit stands in rows 0.82 m apart: a short shadow lies down-sun of every place
          vec2 gq = (p.xz + 34.) / .82, gi = floor(gq + .5), gf = (gq - gi) * .82, dn = -normalize(uSunDir.xz + vec2(1e-4, 0.));
          float al = clamp(dot(gf, dn) - .06, 0., .5), smear = (1. - smoothstep(.07, .19, length(gf - dn * (al + .06)))) * (1. - .55 * al / .5);
          gcol *= 1. - .55 * smear * topK * kfS * step(h13(vec3(gi, 5.)), .9) * smoothstep(2.4, 3.2, vD.y);      // (no bird stands on the outer 2.7 m of the floor)
          gcol = mix(gcol, vec3(.15, .125, .07) * (.7 + .6 * sp), nestK * ring * .62);                               // the ring of weed
          gcol *= 1. + nestK * .2 * (1. - smoothstep(.02, .13, nr));                                                   // the pale saucer
          alb = mix(alb, gcol, gu);
          occl = mix(.6, 1., smoothstep(-.3, .2, up0)) * (1. - .22 * nestK * ring);
          // the floor's own facets are smoothed away (they showed as a slab's edges from the crest); its relief is the nests' and the grain's
          n = normalize(mix(n, vec3(0., 1., 0.), .75 * step(.5, up0)) + (vec3(g1, .5, g2) - .5) * .28 * step(.5, up0) + vec3(nf.x, 0., nf.y) * ring * nestK * 1.6
            + vec3(hh - .5, 0., fract(hh * 7.3) - .5) * .3 * hK + vec3(hg.x, 0., hg.y) * hj * .9);
        } else if (kind < 2.5) { // skirt: tar-black shelf under heaving kelp, water sheeting off it, foam
          n = normalize(mix(n, vec3(0., 1., 0.), .72) + .35 * (vec3(g1, .5, g2) - .5));
          float k = smoothstep(.45, .7, vn3(p * vec3(.9, .3, .9) + 5.));
          alb = mix(uRock * .45, vec3(.075, .06, .02), k);
          float heave = .7 * sin(uTime * .74 + p.x * .21 + p.z * .17);
          float kelp = smoothstep(.5, .68, vn3(vec3(p.x * .7 + heave, 7., p.z * .7 - heave))) * smoothstep(.35, .6, vn3(vec3(p.x * 4.5 + heave * 2., 2., p.z * 1.4)));
          alb = mix(alb, vec3(.105, .075, .02) * (.6 + .9 * g2), kelp * .85);
          float wash = .5 + .5 * sin(uTime * .74 - vD.y * .45 + 6.28 * vn3(p * .06));
          // white water: lace (thin walls where slow noises cross a level, never a sheet) in the runnels, and
          // streams pouring off the outer lip as each wave drains
          float l1 = vn3(vec3(p.x * .5 + uTime * .5, uTime * .25, p.z * .5)), l2 = vn3(vec3(p.xz * 1.9, uTime * .9).xzy), l3 = vn3(vec3(p.xz * 5.3, uTime * 1.4).xzy);
          // (the two noises sum close to their mean nearly everywhere, so the walls are cut narrow: a wide band was a sheet, and the shelf read as pale concrete)
          float lace = (1. - smoothstep(.004, .016 + .028 * wash, abs(l1 * .6 + l2 * .4 - .5))) * (.4 + .6 * l3);
          lace = max(lace, (1. - smoothstep(.003, .02, abs(l2 * .55 + l3 * .45 - .52))) * .55 * (.3 + .7 * wash));
          float pour = smoothstep(8., 11., vD.y) * smoothstep(.6, .8, vn3(vec3(ang * 46., vD.y * .4 - uTime * 1.2, 2.)) * .75 + .25 * l3) * (.5 + .5 * wash);
          // (the lace is faint and soft; the white water is the apron: a ragged fringe along the outer lip that swells and drains with each wave)
          float apron = smoothstep(6.5 - 3. * wash, 11.5, vD.y + 3. * (l1 - .5)) * smoothstep(.3, .62, l2 * .6 + l3 * .4 + .25 * wash) * (.45 + .55 * wash);
          float foam = clamp(max(max(lace * (.1 + .25 * wash), pour * .85), apron * .8), 0., 1.);
          alb = mix(alb, vec3(.56, .64, .62) * (.72 + .4 * l3), foam * .9);
          wet = (1. - foam) * .55;
        } else { // the arch's lining: the stack's own black rock, wet, slimed green to the tide line
          float tide = 1. - smoothstep(3., 10.5, y + 2.5 * g1);
          alb = mix(alb * 1.3, mix(alb * .7, uAlgae * .36, smoothstep(.3, .8, g2)), tide * .75);
          wet = 1.;
        }
        float low = 1. - smoothstep(5., 10.5, y + 2.5 * g1);
        if (kind < 1.5) { alb = mix(alb, mix(alb * .5, uAlgae * .22, smoothstep(.3, .9, g1) * .6), low); wet = max(wet, low); }
        // the waterline: over the weed a band of barnacles (4 to 10 m: the swell's reach): a grey-buff crust that
        // thickens and thins down each column face and is rough close to; the rock stays dark under it
        if (kind < 1.5 || kind > 2.5) {
          float by = y + 2. * g1, bn = vn3(p * vec3(2.6, .5, 2.6) + 13.) * .6 + vn3(p * vec3(11., 6., 11.) + 5.) * .4;
          float barn = smoothstep(3.5, 5.5, by) * (1. - smoothstep(7.5, 10.5, by)) * smoothstep(.34, .7, bn);
          alb = mix(alb, vec3(.19, .185, .15) * mix(1., .6 + .8 * vn3(p * 23. + 5.), fine), barn * mix(.22, .42, fine) * (1. - gu));
        }
        vec3 vdir = normalize((vec4(-normalize(vV), 0.) * viewMatrix).xyz);
        vec3 hv = normalize(uSunDir + vdir);
        float ndv = max(dot(n, vdir), 0.), fres = pow(max(1. - ndv, 0.), 3.), sunL = dot(uSunCol, vec3(.3333));
        vec3 seaCol = vec3(.07, .3, .24) * sunL;                 // light thrown up by the green water
        vec3 col;
        if (kind > 2.5) {
          // inside the arch: slate light from the south mouth, brass from the north one, green from the surge below,
          // and the wet rock mirroring whichever of them it faces; never black
          float open = smoothstep(6., 34., abs(p.z)), north = 1. - smoothstep(-30., 14., p.z);
          float cau = vn3(vec3(p.x * .45, p.y * .45 - uTime * .7, p.z * .45 + uTime * .35));
          vec3 Lm = normalize(vec3(${ARCH_X.toFixed(1)}, 9., -78.) - p), r = reflect(-vdir, n);
          float hm = max(dot(n, normalize(Lm + vdir)), 0.);
          vec3 amb = mix(uShadeCol, uSkyCol, n.y * .5 + .5) * (.4 + .6 * open) + uSkyCol * .7 * max(n.z, 0.) * (1. - .6 * north);
          amb += uSunCol * (1.1 * max(dot(n, Lm), 0.) * (.35 + .65 * north) + .03);
          amb += seaCol * 4.4 * (.16 + .84 * exp(-max(y, 0.) / 9.)) * (.65 - .35 * n.y) * (.5 + 1. * cau);
          vec3 env = uSunCol * 1.1 * smoothstep(.2, .9, -r.z) * smoothstep(-.4, .1, r.y) + uSkyCol * .6 * smoothstep(.2, .9, r.z) * smoothstep(-.4, .1, r.y)
            + seaCol * 1.6 * smoothstep(0., .6, -r.y) * (.6 + .8 * cau);
          // water runs down the columns in threads: only those glint
          float streak = smoothstep(.62, .8, vn3(vec3(p.x * 4.5, p.y * .35 + uTime * .5, p.z * 4.5)));
          col = alb * amb * (1. - .35 * crack) + env * (.02 + .26 * fres) * (.55 + .45 * streak)
            + uSunCol * (pow(hm, 90.) * .35 * streak + pow(hm, 12.) * .07 * north);
        } else {
          // wet rock glints only where water runs down it in threads: a broad sheen would turn every lit column face into a pale board
          float ndh = max(dot(n, hv), 0.), thr = smoothstep(.55, .8, vn3(vec3(p.x * 4.5, p.y * .35 + 3., p.z * 4.5)));
          spec = kind > 1.5 ? wet * pow(ndh, 90.) * .8 * (.25 + .75 * thr) : wet * pow(ndh, 120.) * (.12 + 1.1 * thr) + (1. - gu) * mix(.03, .006, nearK * step(kind, .5)) * pow(ndh, 10.);      // (order 4: close to, the risers' broad lobe in the key's colour is a fifth: on dark ribs it was the rust of the sheet metal)      // the shelf glints in threads too: a broad lobe under the low sun made it a pale slab
          col = gsLight(alb, n, occl) + uSunCol * spec * occl + uSkyCol * wet * (.03 + .32 * fres * (kind > 1.5 ? .55 : 1.));
          // the low key wraps round guano, so the flank beside the light is a bright edge; the sea lights the foot
          float sd = dot(n, uSunDir), wrap = max((sd + .7) / 1.7, 0.) - max(sd, 0.);
          float farK = smoothstep(60., 170., dist);      // from far off the lit flank must read as one bright edge of the tower
          vec2 sxz = normalize(uSunDir.xz + vec2(1e-4, 0.)), pxz = normalize(p.xz + vec2(1e-4, 0.));
          float flank = smoothstep(-.6, .4, dot(pxz, sxz));      // the side of the tower toward the light
          // and the rock whose own bearing from the axis lies within about 50 degrees of the light's blazes whatever the
          // seed has put there (a recess or a terrace takes little of the flank term): the sun's rule, the same from
          // anywhere (the far-range factor is the same one every other far term here carries)
          float rim = smoothstep(.62, .97, dot(pxz, sxz)) * smoothstep(115., 215., dist) * step(kind, 1.5);
          col += gcol * gu * uSunCol * (wrap * mix(mix(.8, .3, step(kind, .5)), 1.25, farK) + farK * (.3 * smoothstep(-.8, -.1, sd) * (1. - max(sd, 0.)) + mix(1.6, 2.1, smoothstep(170., 260., dist)) * flank * (1. - .6 * max(sd, 0.))) + 1.7 * rim) * mix(occl, 1., .5 * rim);      // (the far terms are live's times 0.74, the flank's 0.69: the whitewash's old mean albedo over its new is 0.75 and the windward curtains are longer, so no more of the lit flank's white stands at 250 and over than did in live: 0.8 and 1.2% of it on two seeds, as before)
          col += (alb * 1.6 + uGuanoCol * .2) * uSunCol * (flank * farK + 1.5 * rim) * (1. - gu) * (1. - low) * step(kind, 1.5);      // and the spray-lit rock of that flank (order 4's lift, 1.6 and .2: the bare rock of the lit flank stays dark between the white curtains, so the stripes hold from the run-in), above the wet foot (low): for about 4 m up from the waterline, thinning out by about 9 m, the rock keeps its own dark tone
          // close to, a face turned from the light is slate with form (sky off the sea and the spray), never black
          float nearR = (1. - smoothstep(30., 75., dist)) * step(kind, .5), shadeK = (1. - smoothstep(-.05, .3, sd)) * nearR;
          float fillN = max(dot(n, normalize(vec3(-uSunDir.x, .3, -uSunDir.z))), 0.);
          // (order 4) THE TEAL WAS THIS SLATE: the sky's own cyan (0.30 0.38 0.42 in the golden hour) comes off the grade as the sea's green
          // (38 55 51 of 255 on the floor below). The floor's light is now two thirds of the way to neutral with a cool cast: slate, not sea.
          vec3 sl0 = uSkyCol * .6 + uShadeCol * .4, slate = mix(vec3(dot(sl0, vec3(.3333))), sl0, .35) * vec3(.95, .97, 1.1);
          col += slate * (.1 + .1 * fillN) * shadeK * (1. - .5 * gu) * (.85 + .3 * c0) * (1. - .7 * crack) * max(occl, .5);
          // and nothing beside the climb is black but the cracks: the foot of a riser and a column in its neighbour's shade keep
          // a slate floor with the column's own tone in it (a crack is as dark against its rib as live's albedo makes it:
          // 0.3 of it), and the edge beside each crack catches the sky
          float dk = 1. - smoothstep(.015, .07, dot(col, vec3(.3333)));
          // a tread seen from below (the soffit under an overhanging tier) is rock in shade too: the same slate floor, from any distance
          float under = step(.5, kind) * step(kind, 1.5) * smoothstep(.1, .5, -n.y);
          // (in the golden hour the grade's toe turns anything under 0.04 linear to pure black, so the floor sits at 0.046 to 0.09: 18 to 80 of 255 on screen; only the cracks go under. By night the toe and the mood's colours are lower and the floor was not measured there)
          // (order 4) the floor now has the STONE in it: each column its own tone (proud ones lighter), each block its own, the cross
          // joints dark, the prism faces turned to or from the sky's fill; and from afar every riser keeps a floor of 0.16 (the far
          // rock between the stains is dark slate, not pure black). kc: the columns' tones fade as a column nears a pixel in
          // width; lw: a crack or a joint thinner than a pixel loses its darkness in proportion (no hair lines from afar).
          float kc = 1. - smoothstep(.25, .6, fw / colM), lw = clamp(.06 / max(fw, 1e-4), 0., 1.);
          col = max(col, slate * (max(max(nearR, under) * .23, .16 * step(kind, .5)) * mix(1., (.775 + .45 * c0) * mix(1., .88 + .24 * blk, nearK) * (.8 + .8 * fillN) * (.93 + .14 * g1), kc) * (1. - .7 * crack * lw) * (1. - .5 * joint * lw)));
          // (order 4) HALF OF MEND 7'S DARKENING BACK ON THE LIT FACES, AS LIGHT: the key again over the slate floor, on the bare rock of the
          // risers close by (the floor alone made a sunlit column as dark as a shaded one); warm dark grey, the cracks black
          col += alb * uSunCol * (max(sd, 0.) * occl * .8 * nearK * step(kind, .5) * (1. - gu));
          col += slate * (.12 * smoothstep(0., .035, edge * colM) * (1. - smoothstep(.06, .2, edge * colM)) * nearR * detail * dk * (1. - gu));
          col += alb * seaCol * .9 * exp(-max(y, 0.) / 9.) * (.65 - .35 * n.y);
          // (order 4) NO BLOWN WHITE CLOSE BY: the risers' whitewash is bent over at 0.78 of a white lit by half the key and six tenths of
          // the sky (what is over keeps 0.15 of its excess), and its wrap of the key close by is 0.3 (was 0.8: the birds' own is
          // 0.17); so its lit value stays under the seated birds' own white and they stand out against it
          float gl = dot(col, vec3(.3333)), gk = .78 * dot(uGuanoCol * (uSunCol * .5 + uSkyCol * .6), vec3(.3333));
          col *= mix(1., min(1., (gk + .15 * max(gl - gk, 0.)) / max(gl, 1e-4)), gu * (1. - farK) * step(kind, .5));
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

// ---------------------------------------------------------------------------------------------
// Where the birds sit: every ledge at pecking distance, and the summit floor.
// ---------------------------------------------------------------------------------------------
const HELIX_T0 = -0.75 * Math.PI, HELIX_T1 = -1.46 * Math.PI, HELIX_Y0 = 30, HELIX_Y1 = 170;
// height along the helix: a little quicker low down, where the stack is wide, and eased at the top, where it is narrow
const helixY = (v) => lerp(HELIX_Y0, HELIX_Y1, (v - 0.08 * v * v * v) / 0.92);
// how far (in metres of height) a ledge spot is from the climb's helix; 900 on the far side of the stack
const offHelix = (th, y) => {
  const v = wrap2(HELIX_T0 - th) / (HELIX_T0 - HELIX_T1);
  if (v > 1.12 && v < TAU / (HELIX_T0 - HELIX_T1) - 0.1) return 900;
  const vv = v > 1.12 ? v - TAU / (HELIX_T0 - HELIX_T1) : v;
  return Math.abs(y - helixY(clamp(vv, 0, 1)) + 1);
};
async function collectSpots(form, rng, noise, ctx) {
  // gaps (mend 6): the places this rule visits and leaves empty away from the climb (a bare stretch of a ledge, one
  // place in seventeen, the summit's holes). They are only written down here, with the draws the rule has always made
  // for them: buildHero seats them from a stream of its own, so the frieze has no bare stretch and no seat of the
  // rule's own moves.
  const { nT, tierY, footR, topR, blockOf } = form, spots = [], gaps = [];
  const capY = (th, r) => {
    const r0 = topR(nT - 1, th) - 2.2, f = clamp(r / Math.max(r0, 1), 0, 1), c = Math.cos(th), s = Math.sin(th);
    const y0 = H + 0.35, y1 = y0 + 1.2 + 1.3 * noise.n2(c * 3, s * 3), y2 = y0 + 2.2 + 1.2 * noise.n2(c * 2 + 9, s * 2), y3 = H + 3.2;
    return f > 0.6 ? lerp(y1, y0, (f - 0.6) / 0.4) : f > 0.27 ? lerp(y2, y1, (f - 0.27) / 0.33) : lerp(y3, y2, f / 0.27);
  };
  const score = (th, y) => offHelix(th, y) + rng();
  for (let i = 0; i < nT - 1; i++) {
    let th = rng.range(0, 0.02), pass = 0;
    while (th < TAU) {
      if (++pass % 24 === 0) await ctx.yield();
      const rr = topR(i, th), y = tierY(i + 1, th), beside = offHelix(th, y) < 24, dth = (beside ? 0.66 : 0.8) / rr;   // beside the climb: shoulder to shoulder
      const b = blockOf(th);
      if (y > 9.5 && blockOf(th - 0.55 / rr) === b && blockOf(th + 0.55 / rr) === b) {
        const pitch = beside ? 0.54 : 0.68, width = rr - footR(i + 1, th), rows = width < 0.42 ? 0 : clamp(Math.floor((width - 0.2) / pitch), 1, 6);
        const occ = noise.n2(th * 7 + i * 3.3, i * 1.7);                                      // (beside the climb every place is taken)
        for (let row = 0; row < rows; row++) {
          const j1 = rng(), j2 = rng(), keep = rng(), empty = beside ? keep > 0.985 : (occ < -0.6 || keep > 0.94);
          if (empty && beside) continue;
          const t2 = th + (j1 - 0.5) * 0.3 * dth + (row % 2) * 0.5 * dth, r = topR(i, t2) - Math.min(0.36, width * 0.5) - row * pitch - j2 * 0.08;
          const x = Math.cos(t2) * r, z = Math.sin(t2) * r;
          if (y < ARCH_TOP + 1.5 && Math.abs(x - ARCH_X) < archHalf(y - 1.5) + 1.2) continue;
          if (empty) { gaps.push({ x, y: y + 0.04, z, sc: offHelix(t2, y) + 0.5 + row * 1.5 }); continue; }
          spots.push({ x, y: y + 0.04, z, sc: score(t2, y) + row * 1.5 });
        }
      }
      th += dth;
    }
    await ctx.yield();
  }
  for (let gx = -34; gx <= 34; gx += 0.82) { if (Math.round(gx / 0.82) % 3 === 0) await ctx.yield(); for (let gz = -34; gz <= 34; gz += 0.82) {
    const j1 = rng(), j2 = rng(), keep = rng();
    const x = gx + (j1 - 0.5) * 0.4, z = gz + (j2 - 0.5) * 0.4, r = Math.hypot(x, z), th = Math.atan2(z, x);
    if (r > topR(nT - 1, th) - 2.7) continue;
    if (keep > 0.9 || noise.n2(x * 0.13 + 50, z * 0.13) < -0.62) { gaps.push({ x, y: capY(th, r) + 0.03, z, sc: 990 }); continue; }
    spots.push({ x, y: capY(th, r) + 0.03, z, sc: 60 + keep * 30 });
  } }
  await ctx.yield();
  // the same order as one stable sort, done as short sorted runs and merges so no build step runs long
  let runs = [];
  for (let i = 0; i < spots.length; i += 1500) { runs.push(spots.slice(i, i + 1500).sort((p, q) => p.sc - q.sc)); await ctx.yield(); }
  while (runs.length > 1) {
    const next = [];
    for (let i = 0; i < runs.length; i += 2) {
      if (i + 1 >= runs.length) { next.push(runs[i]); break; }
      const A = runs[i], B = runs[i + 1], out = new Array(A.length + B.length);
      let ia = 0, ib = 0, k = 0;
      while (ia < A.length && ib < B.length) out[k++] = B[ib].sc < A[ia].sc ? B[ib++] : A[ia++];
      while (ia < A.length) out[k++] = A[ia++];
      while (ib < B.length) out[k++] = B[ib++];
      next.push(out);
      await ctx.yield();
    }
    runs = next;
  }
  const out = runs[0] || []; out.gaps = gaps;
  return out;
}

// ---------------------------------------------------------------------------------------------
// Bird models. Local space: +Z toward the bill, +Y up, feet at y = 0, metres.
// attributes: color, aAnim (head weight | -1 for the nest, wing side * weight, bill 0..1), aOpen (open-wing pose)
// ---------------------------------------------------------------------------------------------
function birdColors(pal) {
  const cream = new THREE.Color(pal[4]).multiplyScalar(0.86), saff = new THREE.Color(pal[5]); saff.setRGB(saff.r * 0.98, saff.g * 0.8, saff.b * 0.5);
  return { cream, saff, black: new THREE.Color(0.018, 0.018, 0.022), bill: new THREE.Color(0.36, 0.45, 0.52), nest: new THREE.Color('#4A4630') };
}
function finishBird(P, C, A, O, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(A), 3));
  g.setAttribute('aOpen', new THREE.BufferAttribute(new Float32Array(O), 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
function fullBirdGeometry(pal) {
  const K = birdColors(pal), P = [], C = [], A = [], O = [], I = [];
  const v = (x, y, z, c, hw, ws = 0, bl = 0, o = null) => { P.push(x, y, z); C.push(c.r, c.g, c.b); A.push(hw, ws, bl); if (o) O.push(o[0], o[1], o[2]); else O.push(x, y, z); return P.length / 3 - 1; };
  // spine: [z, y, rx, ry, colour top, colour bottom, head weight]
  const sp = [[-0.27, 0.115, 0.082, 0.065, K.black, K.cream, 0], [-0.07, 0.215, 0.142, 0.165, K.cream, K.cream, 0], [0.09, 0.385, 0.122, 0.135, K.cream, K.cream, 0],
    [0.148, 0.575, 0.06, 0.066, K.cream.clone().lerp(K.saff, 0.85), K.cream.clone().lerp(K.saff, 0.3), 0.35], [0.19, 0.705, 0.052, 0.058, K.saff, K.saff.clone().lerp(K.cream, 0.15), 1]];
  const tail = v(0, 0.04, -0.46, K.black, 0), rings = [];      // the breast rests in the nest: no daylight under a sitting bird
  for (let r = 0; r < sp.length; r++) {
    const [z, y, rx, ry, ct, cb, hw] = sp[r], a = sp[Math.max(r - 1, 0)], b = sp[Math.min(r + 1, sp.length - 1)];
    let tz = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tz, ty); tz /= l; ty /= l;
    const ring = [];
    for (let k = 0; k < 5; k++) { const an = Math.PI / 2 + (k / 5) * TAU, cx = Math.cos(an), sy = Math.sin(an); ring.push(v(cx * rx, y + sy * ry * tz, z - sy * ry * ty, sy > 0.2 ? ct : cb, hw)); }
    rings.push(ring);
  }
  const bill = v(0, 0.672, 0.345, K.bill, 1, 0, 1);
  for (let k = 0; k < 5; k++) {
    const k1 = (k + 1) % 5;
    I.push(tail, rings[0][k1], rings[0][k]);
    for (let r = 0; r + 1 < rings.length; r++) I.push(rings[r][k], rings[r][k1], rings[r + 1][k1], rings[r][k], rings[r + 1][k1], rings[r + 1][k]);
    I.push(rings[4][k], rings[4][k1], bill);
  }
  for (const sx of [-1, 1]) { // folded wings that can open and shake
    const a = v(sx * 0.13, 0.43, 0.10, K.cream, 0), b = v(sx * 0.146, 0.3, -0.02, K.cream, 0);
    const c = v(sx * 0.125, 0.21, -0.2, K.cream, 0, sx * 0.55, 0, [sx * 0.5, 0.5, 0.03]), d = v(sx * 0.045, 0.12, -0.48, K.black, 0, sx, 0, [sx * 0.93, 0.46, -0.07]);
    I.push(a, b, c, b, d, c);
  }
  K.nest.lerp(K.cream, 0.3);
  // the nest: a drum of weed (a four-sided mat under the bird) and two weed tails that trail downwind of it and whip
  // (their tips carry aAnim.x = -2; the material moves them). Six triangles, as the six-sided disc had.
  const nc = v(0, 0.08, -0.04, K.nest, -1), n0 = P.length / 3;
  for (let k = 0; k < 4; k++) { const an = (k / 4) * TAU + 0.6; v(Math.cos(an) * 0.25, -0.02, Math.sin(an) * 0.25 - 0.04, K.nest.clone().multiplyScalar(0.7 + 0.3 * (k % 2)), -1); }
  for (let k = 0; k < 4; k++) I.push(nc, n0 + (k + 1) % 4, n0 + k);
  const weed = new THREE.Color('#4A4630').multiplyScalar(1.5);
  for (const sx of [-1, 1]) { const a = v(sx * 0.14, 0.03, -0.17, K.nest, -1), b = v(sx * 0.21, 0.03, -0.1, K.nest, -1), c = v(sx * (0.27 + 0.05 * sx), 0.07, -0.56 - 0.08 * sx, weed, -2); I.push(a, b, c); }
  return finishBird(P, C, A, O, I);
}
// A chick (June: grey-white down, dark face and bill, a third of a metre tall) or, scaled up and brown, a fledgling
// (late August). 12 triangles; it shares the adults' material, so it bows, begs and looks about on its own seed.
function chickGeometry(august) {
  const down = august ? new THREE.Color(0.2, 0.14, 0.1) : new THREE.Color(0.6, 0.61, 0.6), low = down.clone().multiplyScalar(august ? 0.7 : 0.74), cap = august ? new THREE.Color(0.26, 0.19, 0.14) : new THREE.Color(0.7, 0.7, 0.68);
  const face = new THREE.Color(0.05, 0.05, 0.06), P = [], C = [], A = [], O = [], I = [];
  const v = (x, y, z, c, hw, bl = 0) => { P.push(x, y, z); C.push(c.r, c.g, c.b); A.push(hw, 0, bl); O.push(x, y, z); return P.length / 3 - 1; };
  const r = [v(0.1, 0.02, 0.11, low, 0), v(-0.1, 0.02, 0.11, low, 0), v(-0.11, 0.02, -0.1, low, 0), v(0.11, 0.02, -0.1, low, 0)], hump = v(0, 0.22, -0.03, down, 0);
  for (let k = 0; k < 4; k++) I.push(r[k], hump, r[(k + 1) % 4]);
  const cl = v(-0.05, 0.25, 0.1, face, 1), cr = v(0.05, 0.25, 0.1, face, 1), top = v(0, 0.33, 0.07, cap, 1), bill = v(0, 0.245, 0.2, face, 1, 1);
  I.push(hump, cl, top, hump, top, cr, cl, cr, top, cl, bill, cr, r[1], cl, hump, r[0], hump, cr, r[1], r[0], cr, r[1], cr, cl);
  return finishBird(P, C, A, O, I);
}
function midBirdGeometry(pal) {
  // 11 triangles: a low body (a ridge from tail to back, shoulders on the floor, a breast), an upright neck that goes
  // from cream to saffron, a head and a bill. Seen from above (the summit from the crest) it is a white teardrop with
  // a yellow head, not a cone.
  const K = birdColors(pal), P = [], C = [], A = [], O = [], I = [];
  const v = (x, y, z, c, hw, bl = 0) => { P.push(x, y, z); C.push(c.r, c.g, c.b); A.push(hw, 0, bl); O.push(x, y, z); return P.length / 3 - 1; };
  const tail = v(0, 0.05, -0.46, K.black, 0), back = v(0, 0.4, -0.06, K.cream, 0), sl = v(-0.17, 0.09, -0.02, K.cream.clone().multiplyScalar(0.8), 0), sr = v(0.17, 0.09, -0.02, K.cream.clone().multiplyScalar(0.8), 0), breast = v(0, 0.1, 0.2, K.cream, 0);
  I.push(tail, sl, back, tail, back, sr, back, sl, breast, back, breast, sr);
  const nl = v(-0.07, 0.3, 0.1, K.cream, 0), nr = v(0.07, 0.3, 0.1, K.cream, 0), hc = v(0, 0.7, 0.19, K.saff, 0.7);
  I.push(back, nl, hc, nl, nr, hc, nr, back, hc);
  const h = [v(0, 0.775, 0.17, K.saff, 1), v(0.062, 0.66, 0.2, K.saff, 1), v(-0.062, 0.66, 0.2, K.saff, 1)], bill = v(0, 0.675, 0.36, K.bill, 1, 1);
  I.push(h[0], h[1], bill, h[1], h[2], bill, h[2], h[0], bill, h[0], h[2], h[1]);
  return finishBird(P, C, A, O, I);
}

// Behaviour shared by modelled birds and cards: one slot of a few seconds per bird, picked by its seed.
// out: x pitch of the head (+ down), y head yaw, z neck stretch, w wings open; lean in the return value.
const BEHAVE_GLSL = /* glsl */`
float gsBehave(float s, float t, out vec4 b) {
  float ph = t / (2.4 + 1.8 * h11(s * 7.13)) + s * 37.;
  float k = floor(ph), f = fract(ph), beh = h11(s * 91.7 + k * 1.37);
  float e = smoothstep(0., .22, f) * (1. - smoothstep(.72, 1., f)), lean = 0.;
  b = vec4(.06 * sin(t * 1.3 + s * 50.), .45 * sin(t * .8 + s * 40.) * sin(t * .31 + s * 9.), 0., 0.);
  if (beh < .26) { }
  else if (beh < .47) { b.x += 1.05 * e; lean = .28 * e; }
  else if (beh < .63) { b.x += .6 * e * (.5 + .5 * sin(f * 44.)); lean = .1 * e; }
  else if (beh < .76) { b.y += .6 * e * sin(f * 52.); b.x -= .35 * e; }
  else if (beh < .88) { b.x -= 1.15 * e; b.z = .14 * e; }
  else { b.w = e; b.z = .05 * e; }
  return lean;
}`;

function makeBirdMaterial(shared) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      attribute vec3 aAnim, aOpen, iPos; attribute vec4 iRot;
      uniform float uTime;
      varying vec3 vCol, vN; varying float vBill, vAo, vWrap;
      ${NOISE_GLSL}
      ${BEHAVE_GLSL}
      #include <fog_pars_vertex>
      void main() {
        // iRot.y = seed, + 2 or + 4 for the two birds of a fencing pair (which share one seed)
        float fz = floor(iRot.y * .5 + .01), s = iRot.y - 2. * fz; vec4 b; float lean = gsBehave(s, uTime, b);
        if (fz > .5) {      // a pair fencing bills: necks up, bills crossing and clattering side to side, in bouts
          float on = smoothstep(-.25, .15, sin(uTime * .5 + s * 40.)), sg = fz > 1.5 ? -1. : 1.;
          b = mix(b, vec4(-.5 + .14 * sin(uTime * 7. + s * 9.), sg * .42 * sin(uTime * 10.5 + s * 20.), .13, 0.), on); lean = mix(lean, .17, on);
        }
        vec3 p = position, n = normal;
        // the nest's weed tails whip in the wind (aAnim.x = -2 at their tips)
        p += step(aAnim.x, -1.5) * vec3(.1 * sin(uTime * 9. + s * 40.) + .05 * sin(uTime * 17. + s * 13.), .03 + .07 * sin(uTime * 13. + s * 21.), .04 * sin(uTime * 11. + s * 5.));
        vAo = mix(.35, 1., smoothstep(.05, .45, position.y)) * mix(.75, 1., smoothstep(-.6, .3, normal.y));
        float isBird = step(-.5, aAnim.x), hw = max(aAnim.x, 0.), w = abs(aAnim.y);
        float fl = fract(uTime / (2.4 + 1.8 * h11(s * 7.13)) + s * 37.);
        p = mix(p, aOpen + vec3(0., .16 * sin(fl * 75.) * w, .05 * sin(fl * 75. + 1.) * w), b.w * step(.01, w));
        vec3 piv = vec3(0., .55, .13), q = p - piv;
        q.y *= 1. + b.z * hw * 2.;
        float a = b.x * hw, ca = cos(a), sa = sin(a);
        q.yz = vec2(q.y * ca - q.z * sa, q.z * ca + q.y * sa); n.yz = vec2(n.y * ca - n.z * sa, n.z * ca + n.y * sa);
        a = b.y * hw; ca = cos(a); sa = sin(a);
        q.xz = vec2(q.x * ca + q.z * sa, q.z * ca - q.x * sa); n.xz = vec2(n.x * ca + n.z * sa, n.z * ca - n.x * sa);
        p = q + piv;
        a = lean * isBird; ca = cos(a); sa = sin(a);
        p.yz = vec2(p.y * ca - p.z * sa, p.z * ca + p.y * sa); n.yz = vec2(n.y * ca - n.z * sa, n.z * ca + n.y * sa);
        ca = cos(iRot.x); sa = sin(iRot.x);
        p.xz = vec2(p.x * ca + p.z * sa, p.z * ca - p.x * sa); n.xz = vec2(n.x * ca + n.z * sa, n.z * ca - n.x * sa);
        p = p * iRot.z + iPos;
        vCol = color * iRot.w; vBill = aAnim.z; vN = normalize(mat3(modelMatrix) * n);
        vWrap = mix(.4, 1., smoothstep(150., 171., iPos.y));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol, vN; varying float vBill, vAo, vWrap;
      ${LIGHT_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 alb = mix(vCol, vec3(.02), smoothstep(.03, .08, vBill) * (1. - smoothstep(.2, .3, vBill)));
        // plumage takes the low key round its edge and the sky on its shaded side (blue-grey, never the floor's grey):
        // on the summit, seen against the light, each bird is a cream body above the floor. The lit side is unchanged.
        float sd = dot(n, uSunDir), wrap = max((sd + .85) / 1.85, 0.) - max(sd, 0.);
        float topW = clamp((vWrap - .4) / .6, 0., 1.);      // on the summit the pale floor throws the low sun back up: shaded sides are cream, not slate
        gl_FragColor = vec4(gsLight(alb, n, vAo) + alb * (uSunCol * .42 * wrap + (uSkyCol * .3 + uSunCol * .3 * topW) * (1. - max(sd, 0.))) * vWrap * vAo, 1.);
        #include <fog_fragment>
      }`,
  });
  mat.vertexColors = true;
  Object.assign(mat.uniforms, shared);
  return mat;
}

// Cards: one triangle per bird, drawn and antialiased in the fragment shader, turned to the camera.
function makeCardMaterial(shared, pal) {
  const K = birdColors(pal);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCream: { value: K.cream }, uSaff: { value: K.saff.clone().multiplyScalar(1.1) }, uNest: { value: K.nest } }]),
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iRot;
      uniform float uTime;
      varying vec2 vUv; varying vec4 vB; varying vec3 vR, vU, vF; varying vec2 vSide, vFar;
      ${NOISE_GLSL}
      ${BEHAVE_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vec3 c = (modelMatrix * vec4(iPos, 1.)).xyz;
        vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 r = normalize(vec3(cr.x, 0., cr.z) + vec3(1e-5, 0., 0.));
        vec3 u = normalize(mix(vec3(0., 1., 0.), cu, .65));
        vec4 b; float lean = gsBehave(iRot.y, uTime, b); vB = b; vB.z += lean;
        vec3 f = vec3(sin(iRot.x), 0., cos(iRot.x));
        float sd = dot(f, r);
        vSide = vec2(sd < 0. ? -1. : 1., mix(.5, 1., abs(sd)));
        vUv = position.xy; vR = r; vU = u; vF = normalize(cross(r, u));
        vec3 wp = c + (r * position.x * .55 + u * position.y * .9) * iRot.z;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        vFar = vec2(smoothstep(22., 60., -mvPosition.z), mix(.4, 1., smoothstep(150., 171., c.y)));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCream, uSaff, uNest;
      varying vec2 vUv; varying vec4 vB; varying vec3 vR, vU, vF; varying vec2 vSide, vFar;
      ${LIGHT_GLSL}
      #include <fog_pars_fragment>
      float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba * h); }
      void main() {
        vec2 m = vec2(vUv.x * .55 * vSide.x / vSide.y, vUv.y * .9);
        float px = max(max(fwidth(vUv.x) * .55, fwidth(vUv.y) * .9), 1e-4);
        vec2 hc = vec2(.17, .68) + vec2(.16 * vB.x, -.2 * max(vB.x, 0.) + .09 * max(-vB.x, 0.) + .2 * vB.z * 0.);
        vec2 bd = m - vec2(-.03, .31); float ca = cos(.6), sa = sin(.6);
        bd = vec2(bd.x * ca + bd.y * sa, bd.y * ca - bd.x * sa) / vec2(.27, .15);
        float lb = length(bd), body = 1. - smoothstep(1. - px * 5., 1. + px * 5., lb);
        float farK = clamp(vFar.x, 0., 1.), rh = clamp(max(.062, mix(.5, 1.05, farK) * px), .062, .135);      // beyond 25 m the head is drawn larger, two pixels across from 60 to 130 m (mend 6: .66 and .18 before; at 100 m a card showed 2 px of saffron of its 29, now 4); the cap keeps the head under half the body's area, so from 150 m out a row of birds is cream touched with saffron, not an orange line: the saffron must survive
        float neck = 1. - smoothstep(-px, px, seg(m, vec2(.1, .43), hc) - rh * .9);
        float head = 1. - smoothstep(-px, px, length(m - hc) - rh);
        float bill = 1. - smoothstep(-px, px, seg(m, hc, hc + vec2(.16, -.035)) - .02);
        float tail = 1. - smoothstep(-px, px, seg(m, vec2(-.2, .22), vec2(-.44, .07)) - .04);
        float open = vB.w * (1. - smoothstep(-px, px, seg(m, vec2(-.05, .5), vec2(-.5, .78 + .1 * sin(vB.w * 40.))) - .05));
        vec2 nd = (m - vec2(0., .03)) / vec2(.3, .07); float nest = 1. - smoothstep(1. - px * 6., 1. + px * 6., length(nd));
        float a = max(max(max(body, neck), max(head, bill)), max(max(tail, nest), open));
        if (a < .02) discard;
        vec3 alb = uNest * .8;
        alb = mix(alb, vec3(.02), tail);
        alb = mix(alb, uCream * (1. - .42 * (1. - smoothstep(-.75, .3, bd.y)) * (1. - open)), max(body, open));      // the belly is in its own shade: a body, not a white chip
        alb = mix(alb, mix(uCream, uSaff * (1. + .35 * farK), smoothstep(mix(.4, .3, farK), .62, m.y)), neck);
        alb = mix(alb, vec3(.33, .42, .5), bill * (1. - head));
        alb = mix(alb, uSaff * (1. + .5 * farK), head);
        vec2 n2 = clamp(mix(bd * vec2(.9, .9), (m - hc) / rh, head), -1., 1.) * .8;
        vec3 n = normalize(vR * n2.x * vSide.x + vU * (n2.y + .25) + vF * sqrt(max(1. - dot(n2, n2), .05)));
        float sd = dot(n, uSunDir), wrap = max((sd + .85) / 1.85, 0.) - max(sd, 0.);
        float topW = clamp((vFar.y - .4) / .6, 0., 1.);      // the summit floor's warm bounce, as on the modelled birds
        vec3 col = gsLight(alb, n, 1.) + alb * (uSunCol * .42 * wrap + (uSkyCol * .3 + uSunCol * .3 * topW) * (1. - max(sd, 0.))) * clamp(vFar.y, 0., 1.) * (1. - nest * (1. - max(max(body, neck), head)));
        gl_FragColor = vec4(col, a * step(abs(vUv.x), 1.) * step(vUv.y, 1.));
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  return mat;
}

function instanced(base, count, iPos, iRot, extra) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  g.setAttribute('iRot', new THREE.InstancedBufferAttribute(iRot, 4));
  if (extra) for (const k of Object.keys(extra)) g.setAttribute(k, extra[k]);
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 200, 0), 400);
  return g;
}

// ---------------------------------------------------------------------------------------------
// The tower: flyers on analytic orbits, all turning anticlockwise seen from above, with density waves.
// ---------------------------------------------------------------------------------------------
function flyerGeometry(pal) {
  const K = birdColors(pal), P = [], C = [], W = [], I = [];
  const v = (x, z, c, sx = 0, w = 0) => { P.push(x, 0, z); C.push(c.r, c.g, c.b); W.push(sx, w); return P.length / 3 - 1; };
  const nose = v(0, 0.5, K.saff), tail = v(0, -0.46, K.cream), bl = v(-0.075, 0.04, K.cream), br = v(0.075, 0.04, K.cream);
  I.push(nose, br, bl, tail, bl, br);
  for (const sx of [-1, 1]) {
    const a = v(sx * 0.07, 0.2, K.cream, sx, 0), b = v(sx * 0.07, -0.1, K.cream, sx, 0), c = v(sx * 0.5, 0.15, K.cream, sx, 0.5), d = v(sx * 0.47, -0.1, K.cream.clone().multiplyScalar(0.5), sx, 0.5), e = v(sx * 0.94, -0.05, K.black, sx, 1);
    I.push(a, b, c, b, d, c, c, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W), 2));
  g.setIndex(I);
  return g;
}
function makeTowerMaterial(shared, tw) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWindDir: { value: tw.wind }, uShear: { value: tw.shear }, uWave: { value: new THREE.Vector3(tw.arms, tw.pitch, tw.rise) } }]),
    vertexShader: /* glsl */`
      attribute vec2 aW; attribute vec4 iOrb; attribute vec4 iFly;
      uniform float uTime; uniform vec3 uShear, uWave, uWindDir;
      varying vec3 vCol, vN;
      #include <fog_pars_vertex>
      void main() {
        float s = iOrb.w, t = uTime;
        float th = iOrb.z - iFly.x * t;
        th += (.62 / uWave.x) * sin(uWave.x * th - iOrb.y * uWave.y + t * uWave.z);
        float y = iOrb.y + 7. * sin(t * .21 + s * 30.) + 3. * sin(t * .53 + s * 77.);
        float r = iOrb.x * (1. + .07 * sin(th * 3. + s * 11.)) + 4. * sin(t * .17 + s * 50.);
        float sh = smoothstep(60., 470., y); sh *= sqrt(sh);
        vec3 fw = vec3(sin(th), 0., -cos(th));
        fw = normalize(fw + vec3(0., .12 * sin(t * .4 + s * 21.), 0.));
        float bank = clamp(16. / max(r, 12.), .12, .8) + .12 * sin(t * .9 + s * 13.);
        float vis = 1., hang = step(.5, iFly.w);
        if (hang > .5) { // birds that step off a ledge into the updraft, or hang on the wind coming in to land
          float cy = fract(t / (6. + 3. * fract(s * 7.3)) + s * 13.);
          cy = mix(cy, 1. - cy, step(.5, fract(s * 3.7)));
          th = iOrb.z + .02 * sin(t * .5 + s * 9.);
          r = iOrb.x + mix(.2, 12., smoothstep(0., .75, cy)) + .6 * sin(t * .9 + s * 5.);
          y = iOrb.y + .5 + 4. * smoothstep(0., .3, cy) - 8. * cy * cy + .8 * sin(t * .7 + s * 3.);
          vis = smoothstep(0., .07, cy) * (1. - smoothstep(.86, 1., cy));
          sh = 0.;
          fw = normalize(-uWindDir + vec3(0., .25 - .3 * cy, 0.));
          bank = .3 * sin(t * 1.3 + s * 4.);
        }
        vec3 toC = vec3(-cos(th), 0., -sin(th));
        vec3 c = uShear * sh + vec3(cos(th) * r, y, sin(th) * r);
        vec3 up = normalize(vec3(0., cos(bank), 0.) + toC * sin(bank));
        vec3 rt = normalize(cross(up, fw)); up = cross(fw, rt);
        // wing beat: 3.5 a second, with glides
        float glide = smoothstep(.15, .55, sin(t * .43 + s * 20.) + .35 * sin(t * 1.1 + s * 5.));
        float A = mix(mix(.08, .8, glide), .3, hang), ph = t * mix(22., 31., hang) + s * 100.;
        float a1 = A * sin(ph) + .1 + .4 * hang, a2 = a1 + A * .9 * sin(ph - .9);
        vec3 p = position; vec3 n = vec3(0., 1., 0.);
        float w = aW.y, sx = aW.x;
        if (w > .25) {
          float dx = abs(p.x) - .07;
          vec2 mid = vec2(.07 + .43 * cos(a1), .43 * sin(a1));
          vec2 q = w > .75 ? mid + .45 * vec2(cos(a2), sin(a2)) : vec2(.07 + (dx / .43) * .43 * cos(a1), (dx / .43) * .43 * sin(a1));
          p.x = sx * q.x; p.y = q.y;
          float an = w > .75 ? a2 : a1; n = vec3(-sx * sin(an), cos(an), 0.);
        } else if (abs(sx) > .5) { n = vec3(-sx * sin(a1), cos(a1), 0.); }
        p.y -= .12 * A * sin(ph) * (1. - w);
        // far off a bird keeps about two pixels of wing (the tower must not thin to dust from the entry); from 24 m in
        // to 9 these simple birds draw back to nothing (the modelled flyers are the ones made to be seen near). Inside
        // the clear air (2 m and its half span from the lens) none is drawn back: PLACE keeps them out of it (clearAir)
        float cd = distance((modelMatrix * vec4(c, 1.)).xyz, cameraPosition);
        p *= iFly.y * vis * (1.3 + clamp((cd - 30.) / 130., 0., 2.1)) * max(smoothstep(9., 24., cd), step(cd, 2. + 1.23 * iFly.y));      // (and wings that read as wings at 50 to 150 m)
        vec3 wp = c + rt * p.x + up * p.y + fw * p.z;
        vN = normalize(mat3(modelMatrix) * (rt * n.x + up * n.y));
        vCol = mix(color, mix(vec3(.11, .075, .05), color, .12), iFly.z);
        vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol, vN;
      ${LIGHT_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
        n = normalize(n + uSunDir * .35); // thin feathers pass some light
        gl_FragColor = vec4(gsLight(vCol, n, 1.), 1.);
        #include <fog_fragment>
      }`,
  });
  mat.vertexColors = true;
  Object.assign(mat.uniforms, shared);
  return mat;
}

// ---------------------------------------------------------------------------------------------
// The arch detonation: torn sheets of thrown water and bright droplets on ballistic paths, driven by uBurstT
// (seconds into one burst).
// ---------------------------------------------------------------------------------------------
const BURST_SECONDS = 6.2;
function makeBurst(rng, shared, count, wind, drops) {
  const quad = new THREE.BufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  // iO = origin xyz, delay. iV = velocity xyz, half-size (negative: a droplet, a small bright bead streaked along its fall).
  // Two sources. The fan: the swell thrown up the south-west pier, west of the opening, so the keyhole stays clear.
  // The run: the surge bursting up the west wall inside the arch, a front that runs north ahead of the flyer (delay > 1 s,
  // short-lived), so there is thrown water ahead-left all the way through.
  const total = count + drops, o = new Float32Array(total * 4), vel = new Float32Array(total * 4);
  for (let i = 0; i < total; i++) {
    const drop = i >= count, run = i % 5 >= 3, f = rng(), g = rng(), h = rng(), k = rng(), d = rng(), sz = rng();
    // what it is: a sheet of the body (code 0), a strand thrown clear of it (1: faster, so strands make the torn top
    // edge), fine mist (2: slower); the code rides in the size as + 10 * code
    const tk = ((i / 5) | 0) % 20, code = drop ? 0 : tk < 11 ? 0 : tk < 17 ? 1 : 2, vk = drop ? 1.14 : code === 1 ? 1.24 : code === 2 ? 0.8 : 1, sk = code === 1 ? 0.62 : 1;
    if (!run) {
      o.set([lerp(8, 25.5, f), -1, lerp(45, 36.5, f) + 5 * g, d * d * 0.5], i * 4);
      const up = lerp(9, 31, Math.pow(h, 0.6)) * vk;
      vel.set([(lerp(-7, 3.5, k) + (f - 0.5) * 4) * (code === 1 ? 1.3 : 1), up, lerp(-1.5, 5, g * 0.4 + k * 0.6), drop ? -lerp(0.1, 0.28, sz) : lerp(1.3, 2.6, sz) * (0.7 + up / 60) * sk + 10 * code], i * 4);
    } else {
      const z = lerp(33, -22, f);
      o.set([lerp(25.2, 28.5, g), -1, z, (132.8 - z) / 37.4 - 0.9 + d * 0.3], i * 4);
      const up = lerp(7, 16.5, Math.pow(h, 0.7)) * vk;
      vel.set([lerp(0.5, 5, k), up, lerp(-7, -2, k * 0.5 + g * 0.5), drop ? -lerp(0.09, 0.22, sz) : lerp(0.9, 1.7, sz) * (0.75 + up / 50) * sk + 10 * code], i * 4);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(o, 4));
  g.setAttribute('iV', new THREE.InstancedBufferAttribute(vel, 4));
  g.instanceCount = total;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(30, 15, 10), 90);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBurstT: { value: 0 }, uPx: { value: 0.0027 }, uWind: { value: wind.clone() } }]),
    vertexShader: /* glsl */`
      attribute vec4 iO, iV;
      uniform float uBurstT, uPx; uniform vec3 uWind, uSunDir;
      varying vec2 vUv; varying vec4 vA, vRay; varying vec2 vLens, vBend; varying vec4 vSun; varying vec3 vFan;
      #include <fog_pars_vertex>
      void main() {
        float t = uBurstT - iO.w, live = step(0., t), run = step(1., iO.w);
        t = max(t, 0.);
        float drop = step(iV.w, 0.), drag = 1. - exp(-t * .3), life = mix(1., .56, run);
        // what each sprite is: 1 a droplet, 2 fine mist, 3 a strand (a ligament of water at the fan's edge), 0 a sheet
        float code = drop > .5 ? 0. : floor(iV.w * .1 + .001), size0 = iV.w - 10. * code, what = drop > .5 ? 1. : code > 1.5 ? 2. : code > .5 ? 3. : 0.;
        float mist = what == 2. ? 1. : 0.;
        vec3 c = iO.xyz + iV.xyz * (drag / .3) + uWind * (t * t * .4 + mist * t * 2.6) - vec3(0., 2.45 * t * t * (1. - .55 * mist), 0.);
        float a = smoothstep(0., .12, t) * (1. - smoothstep(2.9 * life, 5.2 * life, t)) * smoothstep(-4., .5, c.y) * live;
        a *= 1. - .85 * smoothstep(30.5, 35.5, c.x) * (1. - .5 * mist);                    // nothing white across the keyhole
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        float dz = -mvPosition.z; vec2 off;
        vec3 v = iV.xyz * exp(-t * .3) + uWind * t * .8 - vec3(0., 4.9 * t, 0.);
        vec2 dir = (modelViewMatrix * vec4(v, 0.)).xy; float sp = length(dir); vBend = vec2(0., 1.);
        dir = sp > 1e-3 ? dir / sp : vec2(0., 1.);
        if (what == 1.) {
          // a droplet is never larger than about one part in ninety of its distance from the lens (a bead a hand's
          // breadth across at 3 m was a white oval over the picture); close to, it is fainter and longer
          float size = min(max(-iV.w, dz * uPx * 1.3), max(dz * .011, dz * uPx * 1.3));
          off = dir * position.y * size * (1.6 + min(sp * .09, 3.2)) + vec2(dir.y, -dir.x) * position.x * size;
          a *= smoothstep(2.5, 9., dz) * mix(.45, 1., smoothstep(5., 30., dz)) * (1. - smoothstep(2.4 * life, 4.4 * life, t));
        } else if (what == 2.) {
          float size = size0 * (1.9 + 2.2 * smoothstep(0., 4., t));
          dir = vec2(0., 1.); off = position.xy * size;
          a *= smoothstep(6., 22., dz);
        } else if (what == 3.) {
          // a ligament: a fifth of a sheet's width, drawn out along its flight, and it curves over: the water at its
          // tail left earlier, so it has fallen (and blown downwind) further than the straight line back from its head.
          // The quad is widened to hold that droop; the fragment shader draws the bent strand inside it (vBend).
          // (seen from far off it is a soft torn tongue on the fan's edge, three to five times as long as broad; inside
          // 45 m it is a short torn gust, and inside 26 m it thins away: long bright lines never lie across the wall beside us)
          float nearL = 1. - smoothstep(18., 45., dz);
          float size = size0 * (.5 + .5 * smoothstep(0., 2.2, t)) * (1. + .45 * smoothstep(70., 200., dz));
          float halfL = size * (1.5 + min(sp * .07, 1.2)) * (1. - .45 * nearL), halfW = max(size * mix(.3, .42, nearL), dz * uPx * 2.5);
          vec2 perp = vec2(dir.y, -dir.x), acc = (modelViewMatrix * vec4(uWind * .8 - vec3(0., 4.9, 0.), 0.)).xy;
          float span = min(2. * halfL / max(sp, 3.), 1.), droop = clamp(.5 * dot(acc, perp) * span * span * 2.2, -.8 * halfL, .8 * halfL), wq = halfW + .67 * abs(droop);
          off = dir * position.y * halfL + perp * position.x * wq;
          vBend = vec2(droop / wq, halfW / wq);
          a *= smoothstep(9., 26., dz) * (1. - .5 * run);
        } else {
          // THE FALLING VEIL: a sheet on its way down is drawn out along its fall and thinner across it (and the
          // fragment shader tears it into finer threads): the fan's water comes down as a veil, not as the cloud it rose in
          float size = size0 * (.85 + 1.0 * smoothstep(0., 2.2, t)) * (1. + .3 * smoothstep(70., 200., dz)), fallK = smoothstep(2., 14., -v.y);
          off = dir * position.y * size * (1.25 + min(sp * .04, .7)) * (1. + .7 * fallK) + vec2(dir.y, -dir.x) * position.x * size * (1. - .25 * fallK);
          vBend = vec2(fallK, 1.);
          a *= smoothstep(4., 15., dz) * mix(1., smoothstep(7., 24., dz), run);      // thinned only right at the lens; the run up the wall beside us is thinned further out, so the wall stays solid rock behind it
        }
        // THE FINGERS: the fan's water leaves the pier in tongues. Each sprite of the fan knows the bearing it was thrown
        // on (across the fan) and how hard (its rise); where the tongues' pattern (two sines of that bearing: five to seven
        // tongues across the fan) has a gap, the hard-thrown water is not there. So the fan's upper edge is fingers with air
        // between them, and its body below is whole. A law of each sprite's own throw: no stream, no clock, no eye in it.
        if (run < .5 && what != 2.) {
          float vk = what == 1. ? 1.14 : what == 3. ? 1.24 : 1.;
          float ph = atan(iV.x, iV.y), hard = smoothstep(.42, .8, (iV.y / vk - 9.) / 22.);
          float gap = smoothstep(.38, .6, .5 + .27 * sin(ph * 23. + 1.3) + .23 * sin(ph * 37. + 4.1));
          a *= what == 1. ? mix(1., .2 + .8 * gap, hard) : 1. - .92 * hard * (1. - gap);          // (the droplets keep to the tongues too: few hang loose in the gaps)
        }
        vFan = vec3(mix(vec2(17., 40.), iO.xz, run), run);                                  // the foot of this sprite's burst, and which burst
        vUv = position.xy; vA = vec4(a, iO.w * 9.7 + abs(iV.w) * 3. + iO.x, t / life, what); vLens = vec2(smoothstep(12., 42., dz), smoothstep(70., 200., dz));
        mvPosition.xy += off * step(.001, a);
        // the light in this sprite's own frame (x across, y along its flight, z to the eye), and how nearly we look into it
        vec3 sv = (viewMatrix * vec4(uSunDir, 0.)).xyz;
        float back = max(dot(normalize(c - cameraPosition + vec3(0., 1e-4, 0.)), uSunDir), 0.);
        vSun = vec4(dot(sv.xy, vec2(dir.y, -dir.x)), dot(sv.xy, dir), sv.z, back * back);
        // where this fragment lies on a sphere through its burst, about the eye: sprites that overlap on screen read
        // the same noise there, so light and shade run on from sprite to sprite and the fan is one body of water
        vec3 src = mix(vec3(17., 8., 40.), iO.xyz + vec3(0., 5., 0.), run);
        vRay = vec4(mvPosition.xyz * mat3(viewMatrix), distance(src, cameraPosition));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec4 vA, vRay; varying vec2 vLens, vBend; varying vec4 vSun; varying vec3 vFan;
      ${LIGHT_GLSL}
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      void main() {
        if (vA.x < .003) discard;
        float a; vec3 col;
        float age = clamp(vA.z / 4.2, 0., 1.), u = vUv.x, v = vUv.y, r2 = min(dot(vUv, vUv), 1.);
        float env = max(1. - u * u, 0.) * max(1. - v * v, 0.);
        // THE BURST HAS FORM, AND A SOFT BODY. The lit water is the slot's brass on white; the shade inside the body is a
        // blue-grey under the sky's own tone. (Once lit and shade were both sky-white, .72 and .8 of it, and some five
        // hundred sheets summed to one flat white; then the shade stood so far under it, .22, that the body went grey and
        // mottled and the bright droplets on it read as loose white dots. This is the middle: the body is one soft pale
        // burst again, shaded enough to have a core and a lit flank, and the droplets are its own tone at its edge.)
        vec3 lit = uSunCol * .6 + uSkyCol * .72, shade = uSkyCol * .36 + uShadeCol * .2;
        // every sprite is a rounded lump of spray: its side toward the slot is lit, the other is blue-grey
        float sl = dot(normalize(vec3(u, v, sqrt(max(1. - r2, 0.)) + .35)), vSun.xyz) * .5 + .5, back = vSun.w;
        // WHERE this fragment is in its burst (its place on the sphere through the burst about the eye, so sprites that
        // overlap on screen agree): its height over the sea, how far to the sunward side of the burst's foot it lies, and
        // how deep inside the body. The body's tone is laid by PLACE: shade in the core low down, light on the sunward
        // flank and toward the top where the water is thin, lumps of the place that fall with the water.
        vec3 q = normalize(vRay.xyz + vec3(0., 0., 1e-6)) * vRay.w, wp = q + cameraPosition, qn = q - vec3(0., 1.4 * vA.z, 0.);
        float run = vFan.z, h = wp.y + 1.;
        float side = clamp(dot(wp.xz - vFan.xy, uSunDir.xz) / max(length(uSunDir.xz), 1e-4) / mix(11., 5., run), -1., 1.);
        float core = (1. - smoothstep(.3, 1., abs(wp.x - vFan.x) / (mix(6., 3., run) + .4 * h))) * (1. - smoothstep(.45, 1., h / mix(34., 16., run)));
        float w1 = vn3(qn * .45), w2 = vn3(qn * 1.3 + 9.);
        float body = clamp(.55 - .6 * core + .4 * side + .2 * smoothstep(4., 30., h) + .6 * (w1 - .5) + .45 * (w2 - .5), 0., 1.);
        if (vA.w > 2.5) { // a ligament thrown clear of the body: it arcs over (see the vertex shader) and breaks into beads from the tail up
          float tn = .5 - .5 * v, uc = vBend.x * (tn * tn - .33), uu = (u - uc) / max(vBend.y, .04), prof = max(1. - uu * uu, 0.);
          float n1 = vn3(vec3(vA.y * 3., v * 2.4 - vA.z * .8, vA.y)), brk = clamp(.55 * age + .75 * tn - .12 + .3 * (n1 - .5), 0., 1.);
          float cells = 3.5 + 3. * fract(vA.y * .37), f = fract(v * cells + vA.y * 1.7), bead = 1. - smoothstep(.16, .46, abs(f - .5));
          float drop = step(.45, fract(floor(v * cells + vA.y * 1.7) * .618 + vA.y));          // some beads have already fallen away
          float bd = mix(1., bead * mix(1., drop, smoothstep(.6, .95, brk)), smoothstep(.2, .6, brk));
          a = prof * prof * max(1. - v * v, 0.) * bd * (.6 + .5 * n1) * vA.x * .8;
          col = mix(shade, lit, clamp(.35 + .4 * body + .35 * sl, 0., 1.)) + uSunCol * .3 * back;
        } else if (vA.w > 1.5) { // mist, drifting off downwind
          float soft = 1. - r2, n = vn3(vec3(vUv * 1.7 + vA.y, vA.z * .3));
          a = soft * soft * smoothstep(.15, .85, n + .3 * soft) * vA.x * .28;                 // (the soft spray behind and under the droplets)
          col = mix(shade, lit, .25 + .5 * body + .2 * sl) * (.9 + .2 * n) + uSunCol * .14 * back;
        } else if (vA.w > .5) { // a bead of thrown water, lit by the slot: the droplets at the fan's edge
          // torn along its flight: a soft streak broken by a noise that rides with it, never a clean oval
          float nb = vn3(vec3(u * 2.1 + vA.y * 3., v * 2.6 - vA.z * 1.3, vA.y * 1.7)), pb = max(1. - u * u, 0.) * max(1. - v * v, 0.);
          col = uSunCol * .85 + uSkyCol * .95; a = pb * pb * smoothstep(.22, .7, nb + .4 * pb) * vA.x * .55;
        } else {
          // a sheet: translucent, soft to its edge, drawn out into ligaments along its flight (they thin as it ages);
          // falling (vBend.x), it is a veil of finer threads with more air in it
          float fk = vBend.x;
          float f1 = vn3(vec3(u * (3.2 + 3.5 * fk) + vA.y * 7., v * .9 - vA.z * .5, vA.y * 3.)), f2 = vn3(vec3(u * (8.5 + 6. * fk) - vA.y * 5., v * 2.3 - vA.z * .9, vA.y));
          float fil = f1 * .6 + f2 * .4 + .45 * (w2 - .5);
          float dens = env * env * (.22 + 1.2 * smoothstep(.22 + .34 * age + .12 * fk, .78 + .3 * age, fil));
          a = clamp(dens, 0., 1.) * vA.x * mix(.55, .8, vLens.y) * (1. - .35 * age) * (1. - .25 * fk);
          float thin = 1. - smoothstep(0., .45, dens);
          float li = clamp(body + .5 * (fil - .5) + .22 * (sl - .5) + .25 * thin, 0., 1.);
          col = mix(shade, lit, li) + uSunCol * (.34 * back + .1) * thin;
        }
        if (a < .004) discard;
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, shared);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('white-stack'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).slice();
  while (pal.length < 7) pal.push(DEFAULT_PALETTE[pal.length]);
  const detail = ctx.quality?.detail ?? 1;
  const wind = (opts.windDir ? opts.windDir.clone() : new THREE.Vector3(0.92, 0, -0.38)).setY(0).normalize();
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.7, 0.14, -0.7)).normalize();
  const shared = {
    uTime: { value: 0 }, uSunDir: { value: sunDir },
    uSunCol: { value: new THREE.Color(opts.sunColor || '#FFE9C4').multiplyScalar(opts.sunIntensity ?? 1.2) },
    uSkyCol: { value: opts.skyColor ? new THREE.Color(opts.skyColor) : new THREE.Color(0.26, 0.335, 0.375) },
    uShadeCol: { value: opts.shadeColor ? new THREE.Color(opts.shadeColor) : new THREE.Color(0.105, 0.155, 0.16) },
  };
  const object = new THREE.Group(); object.name = 'white-stack';

  // --- rock
  const form = makeForm(rng.fork('form'), noise);
  await ctx.yield();
  const rockGeo = await buildRockGeometry(form, rng.fork('rock'), noise, ctx);
  // THE ROCK AS DRAWN, for clearances (anchors.rockColumn): at a bearing, the outermost rock within half a metre of
  // a height. The face leans out upward, so it is widest at the band's top or at a lip inside the band; every
  // column may step out by JIT and bulge by BULGE; over the summit the cap's dome (under H + 4) is taken as the top
  // lip's width. Under the shelf's inner height the awash shelf, out to where its top falls below the band. Under
  // the rock's foot (-4) and over the cap nothing. The arch is not cut out: its opening counts as rock. (Asked a
  // bearing at a time it is cheap: the form keeps each tier's last bearing.)
  const rockColumn = (th) => {
    const s = shelfRings(noise, th, form.footR(0, th) + JIT - 0.4, JIT), yt = [];
    for (let i = 0; i < form.nT; i++) yt.push(form.tierY(i + 1, th));
    return (y) => {
      if (y > H + 4.5 || y < -4.5) return 0;
      const lo = y - 0.5, hi = Math.min(y + 0.5, H); let r = form.surfR(th, hi);
      for (let i = 0; i < form.nT; i++) if (yt[i] > lo && yt[i] <= hi) r = Math.max(r, form.topR(i, th));
      for (let q = 0; q < 6; q += 2) if (Math.max(s[q + 1], s[q + 3]) >= lo) r = Math.max(r, (s[q + 3] >= lo ? s[q + 2] : lerp(s[q], s[q + 2], (s[q + 1] - lo) / (s[q + 1] - s[q + 3]))) - JIT - BULGE);
      return r + JIT + BULGE;
    };
  };
  await ctx.yield();
  const lookRng = rng.fork('look');
  const rock = new THREE.Mesh(rockGeo, makeRockMaterial(shared, {
    rock: new THREE.Color('#2A2C2E').multiplyScalar(1.6), guano: new THREE.Color(pal[4]).multiplyScalar(0.84), algae: new THREE.Color(pal[2]),
    guanoAmt: lookRng.range(0.75, 1.15), lichenAmt: lookRng.range(0.45, 1), seed: lookRng.range(0, 40), wind,
  }));
  rock.frustumCulled = false; object.add(rock);
  await ctx.yield();

  // --- ledge birds, three levels of detail
  const spots = await collectSpots(form, rng.fork('spots'), noise, ctx);
  await ctx.yield();
  const nFull = Math.min(opts.fullBirds ?? 1500, spots.length);
  const nMid = Math.min(opts.midBirds ?? 2400, spots.length - nFull);
  const cardCap = Math.round((opts.cardBirds ?? 14000) * detail);
  const brng = rng.fork('birds'), facing = Math.atan2(-wind.x, -wind.z);
  const fill = async (from, to, stride) => {
    const n = Math.max(0, Math.ceil((to - from) / stride)), iPos = new Float32Array(n * 3), iRot = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) {
      const s = spots[from + k * stride], a = brng(), b = brng(), c = brng(), d = brng();
      iPos[k * 3] = s.x; iPos[k * 3 + 1] = s.y; iPos[k * 3 + 2] = s.z;
      iRot[k * 4] = facing + (a < 0.14 ? (b - 0.5) * 5 : (b - 0.5) * 1.1); iRot[k * 4 + 1] = c; iRot[k * 4 + 2] = 1.12 + 0.22 * d; iRot[k * 4 + 3] = 0.9 + 0.1 * a;
      if (k % 1200 === 1199) await ctx.yield();
    }
    return { n, iPos, iRot };
  };
  const birdMat = makeBirdMaterial(shared);
  const fa = await fill(0, nFull, 1);
  // a few pairs fence bills: two neighbours on one ledge are turned to face each other and given one seed (+2 and +4:
  // the material reads the pair and its two sides from that). Drawn from a finished rng, so nothing after it moves.
  const prng = lookRng.fork('pairs'), paired = new Uint8Array(fa.n);
  for (let tries = 0, pairs = 0; tries < 500 && pairs < 28 && fa.n > 2; tries++) {
    const i = Math.floor(prng() * fa.n); if (paired[i]) continue;
    let bj = -1, bd = 0.82 * 0.82;
    for (let j = 0; j < fa.n; j++) { if (j === i || paired[j] || Math.abs(fa.iPos[j * 3 + 1] - fa.iPos[i * 3 + 1]) > 0.15) continue; const dx = fa.iPos[j * 3] - fa.iPos[i * 3], dz = fa.iPos[j * 3 + 2] - fa.iPos[i * 3 + 2], d = dx * dx + dz * dz; if (d < bd && d > 0.2) { bd = d; bj = j; } }
    if (bj < 0) continue;
    const yaw = Math.atan2(fa.iPos[bj * 3] - fa.iPos[i * 3], fa.iPos[bj * 3 + 2] - fa.iPos[i * 3 + 2]), seed = fa.iRot[i * 4 + 1];
    fa.iRot[i * 4] = yaw; fa.iRot[bj * 4] = yaw + Math.PI; fa.iRot[i * 4 + 1] = seed + 2; fa.iRot[bj * 4 + 1] = seed + 4; paired[i] = paired[bj] = 1; pairs++;
    if (tries % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  const full = new THREE.Mesh(instanced(fullBirdGeometry(pal), fa.n, fa.iPos, fa.iRot), birdMat); full.frustumCulled = false; object.add(full);
  await ctx.yield();
  // the season on the ledges beside the climb: a downy chick beside one bird in three (June) or a brown fledgling
  // (late August), tucked on the cliff side of its parent
  const august = opts.season === 'august', nChick = Math.floor(fa.n / 3), cPos = new Float32Array(nChick * 3), cRot = new Float32Array(nChick * 4);
  { let n = 0;
    for (let k = 1; k < fa.n && n < nChick; k += 3) {
      if (paired[k]) continue;
      const x = fa.iPos[k * 3], y = fa.iPos[k * 3 + 1], z = fa.iPos[k * 3 + 2], r = Math.max(Math.hypot(x, z), 1), side = prng() < 0.5 ? -1 : 1, inw = 0.2 + 0.08 * prng(), al = side * (0.14 + 0.1 * prng());
      cPos.set([x - x / r * inw - z / r * al, y, z - z / r * inw + x / r * al], n * 3);
      cRot.set([fa.iRot[k * 4] + (prng() - 0.5) * 1.6, prng(), august ? 1.9 + 0.3 * prng() : 0.9 + 0.3 * prng(), 0.9 + 0.1 * prng()], n * 4); n++;
    }
    const chicks = new THREE.Mesh(instanced(chickGeometry(august), n, cPos, cRot), birdMat); chicks.frustumCulled = false; object.add(chicks); }
  await ctx.yield();
  const ma = await fill(nFull, nFull + nMid, 1);
  await ctx.yield();
  const rest = spots.length - nFull - nMid, stride = Math.max(1, Math.ceil(rest / Math.max(cardCap, 1)));
  const ca = await fill(nFull + nMid, spots.length, stride);
  await ctx.yield();
  // THE FRIEZE HAS NO BARE STRETCH (mend 6). Every place the seating rule leaves empty away from the climb, and every
  // empty cell of the summit floor, takes a bird: the same law of facing (heads to windward, one in seven turned), size
  // and own number as fill(), drawn from a stream of its own, so no bird of the rule's is reseated and 'birds' deals as
  // before. A place nearer the climb's line than the last mid bird is a mid bird, the rest are cards (the same bands
  // by place as the rule's own birds); the cards thin with ctx.quality.detail by the cards' own stride. They ride in
  // the mid and card meshes: no new call.
  const frng = makeRng(hashSeed('gannet-frieze:' + ctx.seed)), midEdge = nMid > 0 ? spots[nFull + nMid - 1].sc : -1, gaps = spots.gaps || [];
  const seat = async (list) => {
    const n = list.length, iPos = new Float32Array(n * 3), iRot = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) {
      const s = list[k], a = frng(), b = frng(), c = frng(), d = frng();
      iPos[k * 3] = s.x; iPos[k * 3 + 1] = s.y; iPos[k * 3 + 2] = s.z;
      iRot[k * 4] = facing + (a < 0.14 ? (b - 0.5) * 5 : (b - 0.5) * 1.1); iRot[k * 4 + 1] = c; iRot[k * 4 + 2] = 1.12 + 0.22 * d; iRot[k * 4 + 3] = 0.9 + 0.1 * a;
      if (k % 1200 === 1199) await ctx.yield();
    }
    return { n, iPos, iRot };
  };
  const join = (p, q) => { const iPos = new Float32Array((p.n + q.n) * 3), iRot = new Float32Array((p.n + q.n) * 4); iPos.set(p.iPos); iPos.set(q.iPos, p.n * 3); iRot.set(p.iRot); iRot.set(q.iRot, p.n * 4); return { n: p.n + q.n, iPos, iRot }; };
  const gm = await seat(gaps.filter((g) => g.sc <= midEdge)), gc = await seat(gaps.filter((g) => g.sc > midEdge).filter((g, k) => k % stride === 0));
  const mAll = join(ma, gm), cAll = join(ca, gc);
  await ctx.yield();
  const mid = new THREE.Mesh(instanced(midBirdGeometry(pal), mAll.n, mAll.iPos, mAll.iRot), birdMat); mid.frustumCulled = false; object.add(mid);
  await ctx.yield();
  const cardBase = new THREE.BufferGeometry();
  cardBase.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-2, 0, 0, 2, 0, 0, 0, 2, 0]), 3));
  cardBase.setIndex([0, 1, 2]);
  const cards = new THREE.Mesh(instanced(cardBase, cAll.n, cAll.iPos, cAll.iRot), makeCardMaterial(shared, pal)); cards.frustumCulled = false; cards.renderOrder = 2; object.add(cards);
  await ctx.yield();

  // --- the tower
  const trng = rng.fork('tower');
  const towerInfo = { wind: wind.clone(), shear: wind.clone().multiplyScalar(trng.range(65, 95)), arms: trng.pick([2, 2, 3]), pitch: trng.range(0.022, 0.034), rise: trng.range(0.22, 0.34) };
  let tower = null, nTower = 0, nMore = 0, clearAir = () => {};
  if (opts.tower !== false) {
    nTower = Math.round((opts.towerBirds ?? 3900) * detail);
    // (mend 6) room behind the dealt birds for the trickle's top-up and the wheel's own (see below)
    const SECT = 16, nNeed = Math.round(nTower / 150), nWheel = Math.round(nTower * 0.25), nRoom = nTower + SECT * nNeed + nWheel;
    const iOrb = new Float32Array(nRoom * 4), iFly = new Float32Array(nRoom * 4);
    // hangers use ledges away from the climb (the spots are sorted by distance from its helix): beside the route
    // the world flies modelled birds in to land
    const lip0 = Math.min(Math.floor(spots.length * 0.3), 6000), nLip = Math.max(0, Math.min(spots.length - lip0, 9000)), hq = {};
    for (let k = 0; k < nTower; k++) {
      const a = trng(), b = trng(), c = trng(), d = trng(), e = trng(), f = trng();
      const y = 60 + 410 * Math.pow(a, 1.55), rin = y < 105 ? 80 : y < 182 ? 70 : 8;      // outside the climb's helix
      const r = Math.sqrt(lerp(rin * rin, 120 * 120, Math.pow(b, 1.25)));
      iOrb.set([r, y, c * TAU, d], k * 4);
      iFly.set([lerp(13, 19, e) / r, 1.0 + 0.35 * f, k % 12 === 5 ? 1 : 0, 0], k * 4);
      if (k % 11 === 3 && nLip > 0) { // a hanger: anchored to a ledge spot
        const sp = spots[hq[k] = lip0 + Math.floor(b * nLip) % nLip];
        iOrb.set([Math.hypot(sp.x, sp.z), sp.y, Math.atan2(sp.z, sp.x), d], k * 4);
        iFly[k * 4 + 1] = 1.15 + 0.2 * f; iFly[k * 4 + 3] = 1;
      }
      if (k % 300 === 299) await ctx.yield();
    }
    await ctx.yield();
    // A STEADY TRICKLE ON EVERY FACE (mend 6). The dealt hangers use the ledges far from the climb, so the faces the
    // climb passes (the lit west side among them) had one flight a second or less. Every sixteenth of the compass now
    // carries at least a hundred-and-fiftieth of the tower as hangers (each steps off its lip or hangs in to land once
    // every 6 to 9 s, by its own number): where the deal left fewer, ledge birds' places are given one more, drawn from
    // a stream of its own. By place they keep clear of the route's line: only ledges 62 to 158 m up, and 30 m or more
    // of height above or below the climb's helix (a hanger swings 12 m out, 5 m up and 8 m down from its lip).
    let nT2 = nTower;
    const sect = (th) => Math.floor(wrap2(th) / TAU * SECT) % SECT;
    {
      const trk = makeRng(hashSeed('gannet-trickle:' + ctx.seed)), have = new Int32Array(SECT), cand = [];
      for (let s = 0; s < SECT; s++) cand.push([]);
      for (let k = 3; k < nTower; k += 11) if (iOrb[k * 4 + 1] <= H) have[sect(iOrb[k * 4 + 2])]++;
      for (let q = 0; q < spots.length; q++) { const sp = spots[q]; if (sp.y < 62 || sp.y > 158) continue; const th = Math.atan2(sp.z, sp.x); if (offHelix(th, sp.y) >= 30) cand[sect(th)].push(q); }
      for (let s = 0; s < SECT; s++) {
        const list = cand[s], need = Math.min(nNeed - have[s], list.length);
        for (let j = 0; j < need; j++) {
          const pick = j + Math.floor(trk() * (list.length - j)), q = list[pick]; list[pick] = list[j];
          const sp = spots[q], d = trk(), f = trk(), juv = trk() < 1 / 12 ? 1 : 0, r = Math.hypot(sp.x, sp.z);
          iOrb.set([r, sp.y, Math.atan2(sp.z, sp.x), d], nT2 * 4); iFly.set([16 / r, 1.15 + 0.2 * f, juv, 1], nT2 * 4); hq[nT2++] = q;
        }
      }
      await ctx.yield();
      // THE WHEEL AT THE DESIGN'S NUMBER (mend 6): a quarter more wheeling birds (the design's 6,000 to the world's
      // 4,800, by the same density), by the dealt birds' own law of height, radius and speed, from a stream of its own.
      // By place they keep out of the heights where the route's line crosses the wheel (its crest, its hang and the top
      // of its fall, 181 to 209 m): none is dealt between 165 and 228 m (a bird rises and falls 10 m about its own
      // height); below that the wheel's inner radius (80 and 70 m) clears the climb as it always has.
      const wrng = makeRng(hashSeed('gannet-tower:' + ctx.seed));
      for (let j = 0, tries = 0; j < nWheel && tries < nWheel * 3; tries++) {
        const a = wrng(), b = wrng(), c = wrng(), d = wrng(), e = wrng(), f = wrng(), juv = wrng() < 1 / 12 ? 1 : 0;
        const y = 60 + 410 * Math.pow(a, 1.55); if (y > 165 && y < 228) continue;
        const rin = y < 105 ? 80 : y < 182 ? 70 : 8, r = Math.sqrt(lerp(rin * rin, 120 * 120, Math.pow(b, 1.25)));
        iOrb.set([r, y, c * TAU, d], nT2 * 4); iFly.set([lerp(13, 19, e) / r, 1.0 + 0.35 * f, juv, 0], nT2 * 4); nT2++; j++;
        if (tries % 300 === 299) await ctx.yield();
      }
    }
    await ctx.yield();
    const tg = instanced(flyerGeometry(pal), nT2, new Float32Array(3), new Float32Array(4), { iOrb: new THREE.InstancedBufferAttribute(iOrb, 4), iFly: new THREE.InstancedBufferAttribute(iFly, 4) });
    nMore = nT2 - nTower;
    tg.deleteAttribute('iPos'); tg.deleteAttribute('iRot');
    await ctx.yield();
    tower = new THREE.Mesh(tg, makeTowerMaterial(shared, towerInfo)); tower.frustumCulled = false; object.add(tower);
    // THE CLEAR AIR, by PLACE. The lens rides the route's line exactly; the world hands that line in (x, y, z every
    // half metre) once it is laid. A wheeler whose whole swept band (all round its orbit: 10 m up and down, 4 m in and
    // out, the three lobes, the shear at its height) comes within 2.5 m and its half span of the line is lifted or
    // dropped by the least step that clears it, inside the tower's bounds; a hanger whose swing off its ledge does so
    // (2.25 m) takes the next clear ledge spot of its list. Every other bird keeps its seat; no draw is taken.
    // Handed back: how many searches found no clear seat (the bird then keeps the seat it was dealt).
    // The sixth mend's tower birds stand under the same law (the polish round's third order): a wheeler of the wheel's own
    // as above; a trickle hanger takes the next clear spot of the trickle's own kind (its own sixteenth of the compass,
    // 62 to 158 m up, 30 m of height or more off the helix). Their failed searches are handed back apart
    // (hangersMore, wheelersMore).
    clearAir = async (line) => {
      const S = towerInfo.shear, L = [], D = [], shK = (y) => { const g = smoothstep(60, 470, y); return g * Math.sqrt(g); };      // L: the line, a point a metre; D: its distance from the sheared axis
      for (let q = 0; q < line.length; q += 6) { const sh = shK(line[q + 1]); L.push(line[q], line[q + 1], line[q + 2]); D.push(Math.hypot(line[q] - S.x * sh, line[q + 2] - S.z * sh)); }
      const band = (N, r, y, s, c) => {
        for (const q of N) {
          const dy = Math.max(Math.abs(L[q + 1] - y) - 10, 0); if (dy >= c) continue;
          const sh = shK(clamp(L[q + 1], y - 10, y + 10)), x = L[q] - S.x * sh, z = L[q + 2] - S.z * sh;
          const dr = Math.max(Math.abs(Math.hypot(x, z) - r * (1 + 0.07 * Math.sin(3 * Math.atan2(z, x) + 11 * s))) - 4, 0); if (dr * dr + dy * dy < c * c) return true;
        }
        return false; };
      const swing = (sp, c) => {
        const r = Math.hypot(sp.x, sp.z), N = []; for (let q = 0; q < L.length; q += 3) if ((L[q] - sp.x) ** 2 + (L[q + 1] - sp.y) ** 2 + (L[q + 2] - sp.z) ** 2 < 900) N.push(q);
        for (let j = 0; N.length && j <= 20; j++) {
          const cy = j / 20, rr = 1 + lerp(0.2, 12, smoothstep(0, 0.75, cy)) / r, x = sp.x * rr, z = sp.z * rr, y = sp.y + 0.5 + 4 * smoothstep(0, 0.3, cy) - 8 * cy * cy, m = c + Math.hypot(1, 0.02 * r * rr);
          for (const q of N) if ((L[q] - x) ** 2 + (L[q + 1] - y) ** 2 + (L[q + 2] - z) ** 2 < m * m) return true;
        }
        return false; };
      let hangers = 0, wheelers = 0, hangersMore = 0, wheelersMore = 0, j;
      for (let k = 0; k < nT2; k++) {
        const r = iOrb[k * 4], y = iOrb[k * 4 + 1], s = iOrb[k * 4 + 3], c = 2.5 + 1.23 * iFly[k * 4 + 1], N = [];
        if (iFly[k * 4 + 3] && k >= nTower) {
          const se = sect(iOrb[k * 4 + 2]), nS = spots.length;
          for (j = 0; j < nS; j++) {
            const sp = spots[(hq[k] + j) % nS], th = Math.atan2(sp.z, sp.x); if (j && (sp.y < 62 || sp.y > 158 || sect(th) !== se || offHelix(th, sp.y) < 30)) continue;
            if (!swing(sp, c - 0.25)) { if (j) iOrb.set([Math.hypot(sp.x, sp.z), sp.y, th], k * 4); break; }
            if (j % 64 === 63) await ctx.yield();
          }
          if (j === nS) hangersMore++;
        } else if (iFly[k * 4 + 3]) {
          for (j = 0; j < nLip; j++) { const sp = spots[lip0 + (hq[k] - lip0 + j) % nLip]; if (!swing(sp, c - 0.25)) { if (j) iOrb.set([Math.hypot(sp.x, sp.z), sp.y, Math.atan2(sp.z, sp.x)], k * 4); break; } if (j % 1024 === 1023) await ctx.yield(); }
          if (j === nLip) hangers++;
        } else {
          for (let q = 0; q < D.length; q++) if (Math.abs(D[q] - r) < 0.07 * r + 9 + c) N.push(q * 3);
          if (N.length && band(N, r, y, s, c)) { for (j = 1; j < 600; j++) { const v = y + (j & 1 ? 0.5 : -0.5) * ((j + 1) >> 1); if (v >= 60 && v <= 470 && r >= (v < 105 ? 80 : v < 182 ? 70 : 8) && !band(N, r, v, s, c)) { iOrb[k * 4 + 1] = v; break; } } if (j === 600) { if (k < nTower) wheelers++; else wheelersMore++; } }
        }
        if (k % 20 === 19) await ctx.yield();
      }
      tg.attributes.iOrb.needsUpdate = true;
      return { hangers, wheelers, hangersMore, wheelersMore };
    };
  }
  await ctx.yield();

  // --- the arch detonation
  const period = opts.burstPeriod ?? 8.5;
  let burst = null, burstP = -1;
  if (opts.burst !== false) { burst = makeBurst(rng.fork('burst'), shared, Math.round(900 * Math.max(detail, 0.7)), wind, Math.round(420 * Math.max(detail, 0.7))); object.add(burst); }
  await ctx.yield();
  const bufSize = new THREE.Vector2();

  // --- anchors
  // the climb's helix: 7 m clear of the wall at the flyer's own height (the rock there and the lips just above and
  // below), eased so the line has no kinks; never inside 36.5 m of the axis (there the helix would pass 60 degrees)
  const HN = 56, hr = new Float32Array(HN + 1), hs = new Float32Array(HN + 1), hw = new Float32Array(HN + 1);
  for (let k = 0; k <= HN; k++) {
    const v = k / HN, th = lerp(HELIX_T0, HELIX_T1, v), y = helixY(v);
    let m = 0; for (let j = -2; j <= 2; j++) m = Math.max(m, form.wallRadius(th + j * 0.03, y));
    hw[k] = Math.max(m + 7, 36.5);
    if (k % 2 === 1) await ctx.yield();
  }
  for (let k = 0; k <= HN; k++) hr[k] = Math.max(hw[Math.max(k - 1, 0)], hw[k], hw[Math.min(k + 1, HN)]);
  for (let pass = 0; pass < 2; pass++) { for (let k = 0; k <= HN; k++) hs[k] = (hr[Math.max(k - 1, 0)] + 2 * hr[k] + hr[Math.min(k + 1, HN)]) / 4; hr.set(hs); }
  for (let k = 0; k <= HN; k++) hr[k] = Math.max(hr[k], hw[k] - 0.5);
  const helixAt = (v, out = new THREE.Vector3()) => {
    v = clamp(v, 0, 1); const f = v * HN, k = Math.min(Math.floor(f), HN - 1), r = lerp(hr[k], hr[k + 1], f - k), th = lerp(HELIX_T0, HELIX_T1, v);
    return out.set(Math.cos(th) * r, helixY(v), Math.sin(th) * r);
  };
  const flyThrough = []; for (let k = 0; k <= 16; k++) flyThrough.push(helixAt(k / 16));
  const anchors = {
    archAxis: { from: new THREE.Vector3(ARCH_X, 11, 60), to: new THREE.Vector3(ARCH_X, 11, -45) },
    archCenter: new THREE.Vector3(ARCH_X, 12, 0), burstOrigin: new THREE.Vector3(21, 0, 30),
    flyThrough, helixAt, lipRadius: form.lipRadius, wallRadius: form.wallRadius,
    ledgeAt: (th, y, out = new THREE.Vector3()) => { const l = form.ledgeNear(th, y); return out.set(Math.cos(th) * l.r, l.y, Math.sin(th) * l.r); },
    summit: new THREE.Vector3(0, H + 2, 0),
    viewpoints: { entry: new THREE.Vector3(40, 7, 317), climb: helixAt(0.5), crest: new THREE.Vector3(55, 206, 58) },
    tower: { center: new THREE.Vector3(0, 0, 0), radius: 120, yMin: 60, yMax: 470, shear: towerInfo.shear.clone() },
    windDir: wind.clone(), sunDir: sunDir.clone(), surfRadius: form.surfR, archHalf, rockColumn, rockGeometry: rockGeo,      // (theta, y): the rock's surface as drawn at height y; (y): the arch's half width there; (theta): see above
  };

  const hero = {
    object, radius: 72, height: H, center: new THREE.Vector3(8, 80, 0), anchors, uniforms: shared, clearAir,
    counts: { chicks: nChick, fullBirds: fa.n, midBirds: ma.n, cardBirds: ca.n, towerBirds: nTower, tiers: form.nT, spots: spots.length, beside: spots.findIndex((q) => q.sc > 12), friezeMids: gm.n, friezeCards: gc.n, towerMore: nMore },
    setLight(l = {}) {
      if (l.sunDir) shared.uSunDir.value.copy(l.sunDir).normalize();
      if (l.sunColor) shared.uSunCol.value.set(l.sunColor).multiplyScalar(l.sunIntensity ?? 1.2);
      if (l.skyColor) shared.uSkyCol.value.set(l.skyColor);
      if (l.shadeColor) shared.uShadeCol.value.set(l.shadeColor);
    },
    setBurst(p) { burstP = p; },
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (burst) {
        burst.material.uniforms.uBurstT.value = burstP >= 0 ? Math.min(burstP, 1) * BURST_SECONDS : time % period;
        // droplets never fall under about a pixel and a half: sized from the drawing buffer, every frame
        if (ctx.renderer && camera && camera.isPerspectiveCamera) { ctx.renderer.getDrawingBufferSize(bufSize); burst.material.uniforms.uPx.value = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(bufSize.y, 1); }
      }
    },
    dispose() {},
    ground: true, groundY: -0.6,
  };
  if (DEV_CLOSE) {
    const v = [0, 0.5, 0.2, 0.85][DEV_CLOSE], p = helixAt(v), l = Math.hypot(p.x, p.z);
    hero.center = new THREE.Vector3(p.x * (1 - 7 / l), p.y, p.z * (1 - 7 / l)); hero.radius = -2; hero.height = 4;
  }
  return hero;
}
