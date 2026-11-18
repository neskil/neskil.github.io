// NET UP THE PILLAR: hero set piece. The great pillar and everything on it.
//
// WHAT IT IS
//   272 m of conglomerate, one warm iron-grey, smooth and massive: a bundle of rounded buttresses with clefts between (sides and
//   back), rounded shoulders, spherical aprons at the foot; level beds as fine partings (massive beds of 15 to 35 m, two or three
//   zones of thin ones); a few hard beds make broken, stepping ledges with angular undercut lips; pebbles, cobbles and sockets in the
//   shader by world position. (x -120..0, z -65..60, foot y -32, court y 240.) One closed, lofted mesh whose haul
//   face is cut fine where the flown line passes (cells of 0.5 m within 14 m of the line, 1 m to 27 m, 2 m to 46 m), with real ledges, overhangs under the
//   hard beds, a hermit's cave (a true hollow), eight black water streaks, thin washes, a walled niche, whitened ledges; and on it the monks' way
//   (platform, 26 hung ladders, iron door), the cave's wall, door, ladders and kerchiefs, the hoist house on six struts with
//   its hatch, open joists, turning capstan and four walkers, the tower, the edge row (kitchen, cells and gallery, striking
//   board), the monastery behind, the ledge garden, the light line and its three baskets.
//   Since M3 the sides and the back are a crag (creases between waisted shafts, two deep clefts, bands of scoops, one to three cave
//   mouths, bushes, scrub and fallen blocks). Since m3b THE HAUL FACE HAS RELIEF that only stands back from its old surface and is
//   nothing within 3 m of an anchor: bed planes that step (true ledges and undercuts of 0.3 to 1.2 m in broken runs), two or three
//   bands of scoops and honeycomb alcoves under a bed plane, two flat-backed clefts beside the haul line, a slight waist (see
//   makeHaulRelief; anchors.haulRelief says where they stand), with a few bushes, one small fig and two clusters of mud nests on it.
//   Since M4 THE WALL BESIDE THE NET is a cliff with a hermitage: the haul face's bedding dips 1 to 2 degrees and steps by 0.15 to
//   0.5 m every 8 to 15 m, each group of beds by itself (the bedding's lift: ledges, planes, bands, the shader's lines and courses and
//   the mesh's own rows move with it; a lifted bed is held to its band's cap, so no clear number shrinks); two or three mid bays 3 to
//   6 m deep and notches round both corners of the face (standing back only); three or four new cells of a cliff hermitage between
//   y 30 and y 135 (a walled-up cave mouth with a timber front, door, window, balcony on struts, pent roof, chimney hole and soot,
//   washing, jars, a basket on a cord, basil; ladders hung on pegs in chains that go down to a ledge where one lies below, one plank
//   walk, and THE WAY UP: under the lowest cell the ladders go on down to 10 m over the wall's foot; anchors.haulRelief.hermitage); lenses of ochre, rust
//   and buff along the beds; six to ten black streaks born at a ledge, a sill or the brow, lime runs, droppings, soot (a table of
//   uniforms; it lies on the great pillar only, by the streak table's own gate); bushes of 2 to 4 m, a fig of 5 to 7 m, ivy curtains of 5 to 12 m and tufts on the ledges.
//   Since polish round 2 THE WAY TO THE LOWER LEDGE (buildWayside; anchors.haulRelief.wayside): a timber stair on raking struts from the
//   platform to the lower ledge, a limewashed chapel with a bell wall at that ledge's south end, a cypress beyond it.
//   The baked shade is soft-edged (0.1 m and 0.08 m per metre of throw); its light takes the rock's own hue, a breath cooler, and on
//   rock that faces the sun a thrown shade keeps half of the world's shade light (so it stands under the lit rock beside it).
//   The rock's shader (shared by every pillar): conglomerate as stones over a threshold of the kit's cell height, in two sizes, on
//   three planes, in coarse and sandy courses and lenses, fading by the pixel's footprint; upright streaks at the column's plumb
//   foot, none where the rock is sheltered (a baked attribute) or faces down; lichen in crusts; baked sun-shade with a soft edge.
//   Since polish round E (the near rock by the pixel's footprint): the footprint is the filter's own (its short axis, or its long
//   axis over the reach of the cell texture's anisotropy); a layer of stones stays until its largest fall under about a pixel;
//   every fourth and every sixteenth parting is a firmer one that stays in sight where the hairlines crowd; a mark's edge (streak,
//   run, lens) follows the stones where the stones are seen. And SHELTERED TIMBER IS DARK (OLD): in the hoist house what the floor
//   and the slates keep the weather off (the floor's frame and joists, the boards' undersides, the boards under the slates).
//
// FRAME (the brief's, not the guide's): x = metres out from the mean plane of the haul face, y = metres above the stage deck,
//   z = metres along the face (+z south-south-east). Add `object` at the origin with no turn.
//
// export async function buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time), dispose(), ground: false,
//     rockMaterial, strata, faceX(z, y), lipX(z), setSun(dir, sunLinear, skyLinear), mats }
//   opts: wet 0..1, snow 0..1, lamps 0..1, palette (the brief's seven colours), kerchiefs (9..20 on the cord, default 14),
//         sunDir [x,y,z] (default the brief's 0.38,0.44,0.82: baked rock shadows and the part's own small shaders use it),
//         sunColor, skyColor (linear, for the ribbons and cloths), line [[x,y,z],...] the flown line if it is not the brief's journey
//         (the fine cells follow it), terrain (a makeTerrain result: the rock shares its textures, cloud shadows and baked shade),
//         mats (a structures makeMaterials set to share), detailTexture, bounce (0..2, default 1: sunlight thrown back into the shade,
//         blue-violet after the palette's sixth colour; it scales with the scene's first directional light; 0 turns it off).
//   update(dt, time) takes no camera. It only writes uniform values.
//   Also returned for the world round it: uniforms (uTime, uBufH, uSunD, uSunC, uSkyC, uPilB: shared by reference) and colors (the linear colour table).
//   export const tools = { makeRibbons, ribbonMaterial, makeMovers, moverMaterial, addBounce, banded, openings, figure }: the part's own collectors and
//   wall rules, so that the neighbours' monasteries, threads of rope and crosses are made of the same stuff and share its programs.
//   (tools.monasteryMaterials(ctx) is the material set the monasteries share: the hero's own once buildHero has run with this ctx.)
//
// export function makePillar(ctx, spec) -> { mesh, geometry, topY, outline, radiusAt(y), material, beds, lip, shoulder }
//   The same lofted, bedded column for the neighbours. spec: { x, z (plan centre), footY, topY, width (mean, m),
//   shape: 'column' | 'sugarloaf' | 'tusk' | 'spindle' | 'square' | 'obelisk' | 'dome', name (its stream: makeRng(hashSeed(name + ':' + ctx.seed))),
//   material (pass hero.rockMaterial so every pillar is one material and one program; without it a new one is made),
//   depth (other plan size, default width), columns (default: one every 9 m of girth, 24 to 36, and one on each cleft's and streak's middle
//   and edges), skirt (m below footY, default 10), beds (pass hero.beds to share the great pillar's hard beds by height), overhangs (true: a
//   row under each lip), and since M2, all optional: built (true: the top is sheer, no rounded shoulder, for a top that is walled),
//   topWidth (m: a tapering shape is cut level where it is that wide), streaks (0..1, how much of the SHARED streak table lies on it:
//   default 0 with a shared material, because that table is drawn for the great pillar's girth and stands as black slots on a small one) }.
//   Since M3 a neighbour is no drum: its plan is a bundle of three to six unequal lobes with re-entrant creases (two deep clefts on a
//   great one), swelling and waisting by noise, most of them leaning 2 to 6 degrees, some with a second lower summit; aprons, blocks,
//   scrub and ivy at the foot; bands of scoops and cave mouths along its beds, a hermit's shelf on some, bushes and small trees on
//   ledges and in clefts; its marking is the shader's upright streaks (no streaks of its own any more); grass on its ledges of over 1 m; a face turned from
//   spec.sunDir is a little darker. Streams of its own: name + ':lobes', ':lean', ':hollows', ':hermit', ':growth', ':buttress', ':aprons', ':ledge-runs'.
//   outline: [[x, z], ...] of the top rim in world plan, counter-clockwise; flat-topped shapes (column, square, obelisk, spindle) can be built on.
//   The array also carries outline.lip ([[x, z], ...]: where a wall is footed so that it stands flush on the face; the rim lies a rounded
//   shoulder further in), outline.drop (m under topY the rock is met there), outline.shoulder (mean radius, 0 if sheer), outline.topY.
//   About 0.7k (a low dome) to 9.7k triangles (the world's eleven: 42.5 to 43.9k together) and 6 to 110 ms each with no yield: between pillars
//   await ctx.yield(), or use
// export async function makePillarAsync(ctx, spec): the same, handing frames back as it goes (no stretch over 6 ms).
//
// export function makeMonastery(ctx, spec) -> { object, mesh, triangles, radius, size, roofs, center, hoist: { position, foot }, smoke: [Vector3], dispose() }
//   A monastery covering a pillar's top from edge to edge, in world coordinates (add object at the origin). spec: { outline (a makePillar
//   result's outline: its lip is used if it carries one), topY (default outline.topY), x, z (only if no outline is given), size: 'great' |
//   'middle' | 'small' | 'ruin' (default by the top's least reach r from its middle: 30 m, 17 m; an asked size is stepped down if the top is
//   under 24 m / 13.6 m; a top under 6.5 m is first cased in a ten-sided masonry terrace), name (its streams: name + ':monastery:' + what),
//   sunDir (walls and roofs turned from it are darker in their tone), snow (0..1), lamps (bool: some slots glow), palette, and optional:
//   toward [x, z] (the hoist's edge looks that way, else a bearing of its stream), footY (the ground: the rope stops 1.5 m over it),
//   ribbons (a tools.makeRibbons collector: the rope goes into it; else the mesh carries the rope as a 0.12 m stick), rope / net (false:
//   none), mats (a material set; default the one cached by ctx), builder (an S.Builder to add to: then no mesh is made, object is empty, and
//   several monasteries are ONE mesh of the caller's: new THREE.Mesh(builder.toGeometry(), tools.monasteryMaterials(ctx).facades)) }.
//   great: 7 to 10 wings round the lip (tall ranges 7 to 12 m on 7 in 10 of it, low wings, a short curtain wall, a gate's gap), two or three
//   with a timber gallery on raking struts, buttresses, the domed church with apses to +x and a porch, the refectory with its apse, the
//   kitchen on the edge, a cistern, 3 to 10 houses, a garden, washing, 4 to 6 cypresses, the hoist tower with its balcony-house, rope and net.
//   middle: 3 to 5 wings, one or two galleries, a smaller church, refectory, kitchen, cistern, at most one house, garden, 2 to 4 cypresses.
//   small: one house on the lip, a curtain wall with a gap or two, a chapel, the hoist tower, two cypresses, a cistern if r > 10 m.
//   ruin: broken stepped walls on about 6 in 10 of the lip, one gable end with its window open, half an apse, rubble, a fig; hoist.foot 0.
//   Since M3 A SKYLINE: on the hoist's side and on one more side the ranges on the lip stand three to five storeys (10 to 18 m) under roofs
//   that rise half their depth, with wall-gables through the eaves, galleries in two tiers or closed balcony rooms on struts, two or three
//   outer chimneys, a chapel's drum (6.4 m) and dome through the roof of the widest, some walls limewashed; the tower 6 to 8 m over the
//   highest ridge on its side; two cypresses by the lip and (m3b) two tall ones behind the tall ranges, 7 to 11 m over their ridges.
//   One draw call each (one material, no light of its own), or one for all of them with a shared builder; about 4.7 to 8.8k / 3.1 to 5.5k /
//   1.35 to 1.66k / 0.4 to 0.65k triangles (great / middle / small / ruin; the world's seven 24.7 to 27.0k together) and 1 to 6 ms a step.
// export async function makeMonasteryAsync(ctx, spec): the same with yields between its steps (no stretch over 6 ms).
//
// ANCHORS (frame above): see the end of buildHero. anchors.clear holds the plain numbers of the clear-air law.
// COST  112k to 126k triangles by seed with the world's flown line (rock 87 to 99k of which the haul face's relief and cells 12 to 16k,
//       growth 1k, built 12.7 to 14.1k, movers 7.9 to 9.9k, ribbons and cloths 2.6 to 3.4k), 6 draw calls, no lights of its own; 0.9 to
//       1.2 s of building in yields (M4 added 5.2 to 9.2k triangles: cells' mesh and parts, ladders, curtains, tufts, larger bushes).
import * as THREE from 'three';
import * as T from '../kit/terrain.js';
import * as S from '../kit/structures.js';
import { detailTextureSteps } from '../kit/terrain/textures.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// M4b P3 (addendum 15): HOW AN UPRIGHT JOINT LEAVES THE PLUMB at height y (ph: its own phase): it STEPS ASIDE every 10 to 16 m of
// height (by turns 0.25 to 0.5 m to either side, over 1.4 m), and between sways 0.36 m in waves of 7.3 m and 0.18 m in waves of
// 4.3 m. Nothing over y 199 (whole under 190) nor under y -12 (whole over -2): the brow and the foot keep their vertices.
const fr1 = (v) => v - Math.floor(v);
const SWAY_MAX = 1.05;
function swayAt(ph, y) {
  const f = sstep(-12, -2, y) * (1 - sstep(190, 199, y)); if (f <= 0) return 0;
  const P = 10 + 6 * fr1(ph * 3.7), t = (y + 60) / P + fr1(ph * 5.1), k = Math.floor(t);
  const a = ((k & 1) ? 1 : -1) * (0.25 + 0.25 * fr1(Math.sin(k * 12.9898 + ph * 7.7) * 43758.5453)), b = ((k & 1) ? -1 : 1) * (0.25 + 0.25 * fr1(Math.sin((k + 1) * 12.9898 + ph * 7.7) * 43758.5453));
  return f * (lerp(a, b, sstep(1 - 1.4 / P, 1, t - k)) + 0.36 * Math.sin(y * 0.86 + ph * 5.3) + 0.18 * Math.sin(y * 1.46 + ph * 2.9));
}
const lin = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- places (the brief's 'space' and 'built'; see rules-try1.txt of the build) ----------
const TOP = 240, FOOT = -32, SKIRT = -44;
const PC = [-60, -2.5], PA = 60, PB = 62.5;                     // plan centre and half sizes of the great pillar
const OLD = [0.089, 0.051, 0.027];                             // ROUND E: sheltered timber, dark and warm (linear); see buildHouse
const HATCH = { x0: 9, x1: 25, z0: -4.8, z1: 10.2, y: 240 };    // the opening (16 by 15, centred 17, 2.7)
const RING = [13, 251.5, 4], LINE_DIR = [-0.3234, 0.9397, 0.1114];   // portal ring centre; the last straight (heading 71, 70 degrees up)
const BLOCK = [10, 260, 5], LEAD = [10, 260, 22.5], CAP = [17, 240, 22.5], LIGHT = [10, 259.5, 15];
const CAVE = { z0: -25.5, z1: -18.5, y0: 44, y1: 48.5, depth: 5.5 };
const WAY_Z = -44, PLAT_Y = 8, DOOR_Y = 196, GARDEN = { y: 231, z0: -58, z1: -42 };
const FRAMES = [-6, 11.5, 30], STRUT_Z = [-6.5, 12.0, 30.5];      // struts lapped on the frames' outer faces: half a post, half a strut and a 75 mm packing off the frame's line

// The flown line of the brief's 'journey', integrated from its own table (heading 40 to 1 s, then 10.2 degrees a second to 39 s;
// its speeds and pitches), set so that its nearest pass is 10 m from the mean plane, then the last straight to the ring.
function journeyLine() {
  const SP = [[0, 8.6], [5, 9.4], [10, 9.5], [15, 7.1], [40, 7.0], [48, 7.6]], PI = [[0, 0], [5, 0], [10, 22], [15, 56], [17, 63], [35, 63], [40, 70]];
  const tab = (A, t) => { for (let i = 0; i < A.length - 1; i++) if (t <= A[i + 1][0]) return lerp(A[i][1], A[i + 1][1], (t - A[i][0]) / (A[i + 1][0] - A[i][0])); return A[A.length - 1][1]; };
  const pts = []; let x = 101 + 2.1, y = 5, z = 0;
  for (let i = 0; i <= 3700; i++) {
    const t = i * 0.01, h = (t < 1 ? 40 : 40 + 10.2 * (t - 1)) * DEG, p = tab(PI, t) * DEG, v = tab(SP, t);
    if (i % 50 === 0) pts.push([x, y, z]);
    x -= Math.sin(h) * Math.cos(p) * v * 0.01; z += Math.cos(h) * Math.cos(p) * v * 0.01; y += Math.sin(p) * v * 0.01;
  }
  const s0 = [RING[0] - LINE_DIR[0] * 60, RING[1] - LINE_DIR[1] * 60, RING[2] - LINE_DIR[2] * 60];
  while (pts.length && pts[pts.length - 1][1] > s0[1] - 6) pts.pop();
  pts.push(s0, [RING[0], RING[1], RING[2]]);
  return pts;
}
function segDist2(px, py, pz, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz;
  const t = l2 > 0 ? clamp(((px - a[0]) * dx + (py - a[1]) * dy + (pz - a[2]) * dz) / l2, 0, 1) : 0;
  const ex = a[0] + dx * t - px, ey = a[1] + dy * t - py, ez = a[2] + dz * t - pz;
  return ex * ex + ey * ey + ez * ez;
}
function lineDist(line, x, y, z) { let b = 1e18; for (let i = 0; i < line.length - 1; i++) { const d = segDist2(x, y, z, line[i], line[i + 1]); if (d < b) b = d; } return Math.sqrt(b); }

// a smooth periodic 1D table of n values in 0..1 (value noise, `waves` lobes round the ring)
function ringNoise(rng, n, waves) {
  const k = new Float32Array(waves); for (let i = 0; i < waves; i++) k[i] = rng();
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const f = (i / n) * waves, a = Math.floor(f), t = f - a, w = t * t * (3 - 2 * t); out[i] = lerp(k[a % waves], k[(a + 1) % waves], w); }
  return out;
}
const ringAt = (tab, u) => { const n = tab.length, f = ((u % 1) + 1) % 1 * n, i = Math.floor(f), t = f - i; return lerp(tab[i % n], tab[(i + 1) % n], t); };

// ---------- beds: massive beds 15 to 35 m with fine partings, two or three zones of thin beds; a few hard beds make broken ledges ----------
// Returns the hard beds [{ y (ledge top), tb (thickness of the hard layer), step (the ledge's second height, m above or below), w, u, ha, hb, duty }]
// with .partings (every bed plane, ascending) and .tones (one [tone, warmth] for each bed between partings). `fixed`: ledge tops with a
// duty (they get no runs of their own: the caller sets where they stand); the last of them is the top.
function makeBeds(rng, y0, y1, fixed = [], few = false) {
  const H = y1 - y0, zones = [], nz = H > 150 ? rng.int(2, 3) : H > 70 ? 1 : 0;
  for (let tries = 0; zones.length < nz && tries < 60; tries++) { const c = rng.range(y0 + 0.14 * H, y1 - 0.14 * H), t = rng.range(18, 30); if (zones.every((q) => Math.abs(q.c - c) > 45)) zones.push({ c, a: c - t / 2, b: c + t / 2 }); }
  zones.sort((p, q) => p.a - q.a);
  const partings = []; let y = y0 - rng.range(0, 12);
  while (y < y1 - 2.5) {
    const z = zones.find((q) => y >= q.a - 0.01 && y < q.b), nx = zones.find((q) => q.a > y);
    let step = z ? rng.range(2.5, 6) : rng.range(15, 35);
    if (!z && nx && y + step > nx.a - 6) step = Math.max(6, nx.a - y);                  // a massive bed ends where a zone of thin beds begins
    y += step; if (y < y1 - 2.5 && y > y0) partings.push(y);
  }
  const duty = fixed.filter((v) => v <= y1).sort((a, b) => a - b), beds = duty.map((v) => ({ y: v, tb: v === y1 ? 2.2 : 1.4, step: 0, w: 0, u: 0.5, ha: 8, hb: 1.6, duty: true }));
  const want = few ? clamp(Math.round(H / 60), 1, 4) : clamp(Math.round(H / 34), 2, 9) - (H > 200 ? rng.int(0, 2) : 0), cand = partings.slice();
  for (let n = 0, tries = 0; n < want && cand.length && tries < 200; tries++) {
    const v = cand.splice(rng.int(0, cand.length - 1), 1)[0];
    if (v > y1 - 14 || v < y0 + 4 || beds.some((b) => Math.abs(b.y - v) < 16)) continue;
    const up = v < y1 - 20 && rng.chance(0.5);
    beds.push({ y: v, tb: rng.range(1.2, 2.6), step: (up ? 1 : -1) * rng.range(1, 2.5), w: rng.range(0.55, 1), u: rng.range(0.3, 0.9), ha: rng.range(6, 12), hb: 1.6, duty: false }); n++;
  }
  beds.sort((a, b) => a.y - b.y);
  if (!beds.length || beds[beds.length - 1].y < y1 - 0.01) beds.push({ y: y1, tb: 2.2, step: 0, w: 0, u: 0.5, ha: 8, hb: 1.6, duty: true });
  beds.partings = partings;
  beds.tones = []; for (let i = 0; i <= partings.length; i++) beds.tones.push([rng.range(0.9, 1.07), rng.range(0, 0.12)]);
  return beds;
}

// ---------- M3 R1: a neighbour is no drum. Its plan is a BUNDLE OF LOBES: three to six unequal rounded buttresses with re-entrant
// creases between them (the creases stand at fixed places of the girth, so that a column of the mesh lies in each); each lobe's reach
// swells and wanes with height on two waves of its own and swells toward the foot; one to three creases carry a DEEP CLEFT (narrow,
// most of the height); on half of the wider pillars one lobe ends lower under a round cap: a second, bare summit beside the top.
// Returns { n, lobes, creases, at(u, y) -> out [factor on the plan radius, occlusion 0..1, cleft depth m], marks(Lp, near), rows() }.
function makeLobes(P, H, W) {
  const r = P.rngLobes, kind = P.kind, R = W / 2, rel = kind === 'dome' || kind === 'sugarloaf' ? 0.5 : kind === 'square' ? 0.6 : 1;
  const n = W < 20 ? 3 : W < 45 ? r.int(3, 4) : W < 90 ? r.int(4, 5) : r.int(5, 6), wts = [], L = [], C = [], u0 = r();
  let sum = 0, u = u0; for (let i = 0; i < n; i++) { const w = r.range(0.45, 1.7); wts.push(w); sum += w; }
  for (let i = 0; i < n; i++) {
    const wd = wts[i] / sum;
    L.push({ ua: u, ub: u + wd, c: u + wd * r.range(0.4, 0.6), e: 1 + rel * r.range(-0.16, 0.14), A1: rel * r.range(0.06, 0.12), L1: r.range(80, 160), p1: r.range(0, TAU),
      A2: rel * r.range(0.03, 0.06), L2: r.range(30, 60), p2: r.range(0, TAU), foot: r.range(0.12, 0.3), pw: r.range(0.45, 0.7), yd: 1e9, cap: 1 });
    C.push({ u, k: rel * r.range(0.08, 0.3), kA: r.range(0.25, 0.5), kL: r.range(50, 120), kp: r.range(0, TAU), deep: null, yd: 1e9, cap: 1 });
    u += wd;
  }
  // a crease is no ruled line: it wanders by 1.5 to 4 m over 60 to 140 m of height and by a third of that over 25 to 50 m (never more than
  // an eighth of the narrower lobe beside it); the mesh's columns follow it row by row
  for (let i = 0; i < n; i++) { const c = C[i], wmin = Math.min(wts[i], wts[(i + n - 1) % n]) / sum; c.wA = Math.min(r.range(1.5, 4) / P.LpRing, 0.12 * wmin); c.wL = r.range(60, 140); c.wp = r.range(0, TAU); c.wA2 = c.wA * r.range(0.25, 0.4); c.wL2 = r.range(25, 50); c.wp2 = r.range(0, TAU); }
  const uAt = (c, y) => c.u + c.wA * Math.sin(y / c.wL * TAU + c.wp) + c.wA2 * Math.sin(y / c.wL2 * TAU + c.wp2), U = new Float64Array(n + 1); let yU = NaN;
  const Rr = new Float64Array(n);
  const places = (y) => { if (y !== yU) { const t = clamp((y - P.footY) / H, 0, 1); for (let i = 0; i < n; i++) { U[i] = uAt(C[i], y); Rr[i] = reach(L[i], y, t); } U[n] = U[0] + 1; yU = y; } };
  // deep clefts
  const nDeep = W < 45 ? 1 : W < 90 ? r.int(1, 2) : r.int(2, 3), order = []; for (let i = 0; i < n; i++) order.push(i);
  for (let i = n - 1; i > 0; i--) { const j = r.int(0, i), q = order[i]; order[i] = order[j]; order[j] = q; }
  for (let i = 0; i < Math.min(nDeep, n); i++) {
    const ya = P.footY + H * r.range(0, 0.15), yb = P.topY - Math.max(12, 0.08 * H), D = Math.min(12, R * r.range(0.22, 0.38)) * (rel < 1 ? 0.7 : 1);
    if (yb - ya > 20) C[order[i]].deep = { w: clamp(0.12 * W, 2.5, 7), D, ya, yb, wl: r.range(25, 60), ph: r.range(0, TAU) };
  }
  // the second summit
  let dying = -1;
  if (W >= 24 && kind !== 'dome' && kind !== 'sugarloaf' && r.chance(0.65)) {
    dying = r.int(0, n - 1); if (P.built) for (let i = 0; i < n; i++) if (wts[i] < wts[dying]) dying = i;   // under a built top it is the narrowest lobe that ends lower (the top keeps its room)
    const l = L[dying]; l.yd = P.footY + H * r.range(0.62, 0.86); l.cap = clamp(r.range(0.8, 1.2) * 0.5 * R, 4, Math.max(4, P.topY - l.yd - 6)); l.e = Math.max(l.e, 1.06);
    for (const c of [C[dying], C[(dying + 1) % n]]) { c.yd = l.yd; c.cap = l.cap; if (c.deep) c.deep.yb = Math.min(c.deep.yb, l.yd - 4); }
  }
  // a lobe's reach swells and wanes by NOISE, not by a wave (a wave stacks even tiers like a candle's): bellies 60 to 150 m apart, lesser ones 25 to 50 m
  const n2 = P.noise.n2, reach = (l, y, t) => l.e * (1 + 1.7 * l.A1 * n2(l.p1 + y / (l.L1 * 0.5), l.p2) + 1.7 * l.A2 * n2(l.p2 * 3 + y / (l.L2 * 0.5), l.p1)) + l.foot * Math.pow(1 - t, 2.5);
  // a built top keeps its room: the creases close to four tenths of their depth over the last 45 m, and a dying lobe's creases deepen less
  const kAt = (c, y) => { const k = c.k * (1 + c.kA * Math.sin(y / c.kL * TAU + c.kp)) * (P.built ? 1 - 0.6 * sstep(P.topY - 45, P.topY - 8, y) : 1); return y > c.yd ? lerp(k, Math.max(k, (P.built ? 0.18 : 0.3) * rel + 0.06), sstep(c.yd, c.yd + c.cap, y)) : k; };
  const out = [1, 0, 0];
  const at = (uu, y) => {
    places(y); let v = uu - U[0]; v -= Math.floor(v); v += U[0];
    let i = 0; while (i < n - 1 && v >= U[i + 1]) i++;
    const l = L[i], ca = C[i], cb = C[(i + 1) % n], ua = U[i], ub = U[i + 1], lc = clamp(l.c, ua + 0.2 * (ub - ua), ub - 0.2 * (ub - ua));
    const e = Rr[i], ra = Math.min(e, Rr[(i + n - 1) % n]) * (1 - kAt(ca, y)), rb = Math.min(e, Rr[(i + 1) % n]) * (1 - kAt(cb, y));
    const chord = lerp(ra, rb, (v - ua) / (ub - ua)), chC = lerp(ra, rb, (lc - ua) / (ub - ua));
    const x = v < lc ? (lc - v) / (lc - ua) : (v - lc) / (ub - lc), life = y < l.yd ? 1 : y > l.yd + l.cap ? 0 : Math.sqrt(Math.max(0, 1 - ((y - l.yd) / l.cap) ** 2));
    out[0] = chord + Math.max(0, e - chC) * Math.pow(Math.max(0, 1 - Math.pow(x, 2.2)), l.pw) * life;
    const c = v < lc ? ca : cb, kk = kAt(c, y); let occ = x > 0.7 ? ((x - 0.7) / 0.3) ** 2 * Math.min(1, kk / 0.2) * 0.7 : 0, slot = 0;
    if (c.deep) {
      const d = Math.abs(v - (v < lc ? ua : ub)) * P.LpRing / (c.deep.w * 0.5);
      if (d < 1) { const f = sstep(c.deep.ya, c.deep.ya + 8, y) * (1 - sstep(c.deep.yb - 8, c.deep.yb, y)); slot = c.deep.D * (0.65 + 0.35 * Math.sin(y / c.deep.wl * TAU + c.deep.ph)) * (1 - d * d) * f; occ = Math.max(occ, Math.sqrt(1 - d * d) * f); }
    }
    out[1] = occ; out[2] = slot; return out;
  };
  // where the mesh must have a column (m along the girth) and a ring
  const marks = (Lp, near, y) => {
    const m = []; places(y);
    for (let i = 0; i < n; i++) {
      const l = L[i], ua = U[i], ub = U[i + 1]; m.push(ua * Lp);
      if (near) m.push(l.c * Lp, (ua + 0.2 * (l.c - ua)) * Lp, (ub - 0.2 * (ub - l.c)) * Lp);
      if (C[i].deep) for (const q of near ? [-0.5, -0.25, 0.25, 0.5] : [-0.5, 0.5]) m.push(ua * Lp + q * C[i].deep.w);
    }
    return m;
  };
  const rows = () => (dying < 0 ? [] : [0, 0.35, 0.65, 0.85, 0.96, 1].map((f) => L[dying].yd + f * L[dying].cap));
  return { n, lobes: L, creases: C, at, marks, rows, dying, uAt };
}

// ---------- the pillar's shape: a seeded plan outline lofted through taper, lean, clefts, waists and the beds ----------
// P: { cx, cz, a, b, n, footY, topY, skirtY, kind, haul, rng, noise, beds, lobe, waist, flare, ledge (scale of ledge widths) }
function makeShape(P) {
  const rng = P.rng, K = 1024, { cx, cz, footY, topY, skirtY } = P, H = topY - footY;
  const lobeA = ringNoise(rng, 64, 5), lobeB = ringNoise(rng, 128, 13);
  const bx = new Float32Array(K + 1), bz = new Float32Array(K + 1), ex = new Float32Array(K + 1), ez = new Float32Array(K + 1), sK = new Float32Array(K + 1), wxK = new Float32Array(K + 1);
  for (let k = 0; k <= K; k++) {
    const th = -Math.PI + TAU * (k % K) / K, c = Math.cos(th), s = Math.sin(th), at = Math.abs(th);
    const nn = P.haul && P.nBack ? lerp(P.nBack, P.n, 1 - sstep(48 * DEG, 75 * DEG, at)) : P.n;
    let r = Math.pow(Math.pow(Math.abs(c / P.a), nn) + Math.pow(Math.abs(s / P.b), nn), -1 / nn);
    const wn = P.haul ? sstep(40 * DEG, 58 * DEG, at) : 1, wx = P.haul ? 1 - sstep(44 * DEG, 56 * DEG, at) : 0;
    r *= 1 + wn * P.lobe * ((ringAt(lobeA, k / K) - 0.5) * 1.4 + (ringAt(lobeB, k / K) - 0.5) * 0.6);
    bx[k] = r * c; bz[k] = r * s; wxK[k] = wx;
    const dx = lerp(c, 1, wx), dz = lerp(s, 0, wx), l = Math.hypot(dx, dz) || 1; ex[k] = dx / l; ez[k] = dz / l;
    sK[k] = k ? sK[k - 1] + Math.hypot(bx[k] - bx[k - 1], bz[k] - bz[k - 1]) : 0;
  }
  const Lp = sK[K], NI = 2048, inv = new Float32Array(NI + 1);
  for (let i = 0, k = 0; i <= NI; i++) { const s = Lp * i / NI; while (k < K - 1 && sK[k + 1] < s) k++; inv[i] = k + clamp((s - sK[k]) / Math.max(1e-6, sK[k + 1] - sK[k]), 0, 1); }
  const kOf = (s) => { const f = (((s / Lp) % 1) + 1) % 1 * NI, i = Math.floor(f); return lerp(inv[i], inv[i + 1], f - i); };
  const smp = (A, kf) => { const i = Math.min(K - 1, Math.floor(kf)); return lerp(A[i], A[i + 1], kf - i); };
  // taper and lean of the axis by kind (t = 0 foot .. 1 top)
  const kind = P.kind || 'column', leanA = rng.range(0, TAU), leanM = P.haul ? 0 : kind === 'tusk' ? rng.range(0.3, 0.42) * P.a * 2 : kind === 'spindle' ? rng.range(0.05, 0.12) * P.a : rng.range(0, 0.04) * P.a;
  let tEnd = 1;
  const tp = (t) => {
    t = clamp(t, 0, 1) * tEnd;
    if (kind === 'sugarloaf') return Math.sqrt(Math.max(0.0004, 1 - Math.pow(t, 2.2) * 0.985));
    if (kind === 'dome') return Math.sqrt(Math.max(0.0004, 1 - t * t * 0.995));
    if (kind === 'tusk') return 1 - 0.74 * Math.pow(t, 1.3);
    if (kind === 'obelisk') return 1 - 0.5 * t;
    if (kind === 'spindle') return 0.82 + 0.18 * Math.cos(t * 5.3) - 0.2 * t;
    if (kind === 'square') return 1;
    return P.haul ? 1 : 1 - 0.07 * t * t;
  };
  if (P.topWidth && tp(1) * Math.min(P.a, P.b) * 2 < P.topWidth) { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { tEnd = (lo + hi) / 2; if (tp(1) * Math.min(P.a, P.b) * 2 > P.topWidth) lo = tEnd; else hi = tEnd; } tEnd = lo; }   // the summit cut level where the rock is that wide
  // M3: most neighbours LEAN, straight with height (2 to 6 degrees, the top never further off than 0.3 of the width), from a stream of its own
  let leanT = 0;
  if (!P.haul && P.rngLean) { const q = P.rngLean, wide = Math.min(P.a, P.b) * 2; leanT = Math.min(Math.tan((kind === 'tusk' ? 0 : kind === 'spindle' ? q.range(1, 3) : q.chance(0.75) ? q.range(2, 6) : q.range(0, 1)) * DEG) * H, 0.3 * wide); }
  const axis = (t, o) => { const q = leanM * t * t + leanT * t; o[0] = Math.cos(leanA) * q; o[1] = Math.sin(leanA) * q; };
  // big shape table G(s, y): flare of the foot, waists, clefts, buttresses, scallops
  const GS = 256, gy0 = skirtY, GY = Math.ceil((topY - skirtY) / 4) + 2, G = new Float32Array(GS * GY), feats = [];
  const nCleft = P.haul ? rng.int(3, 5) : rng.int(1, 3), W = Math.min(P.a, P.b) * 2;
  for (let i = 0; i < nCleft + (P.haul ? rng.int(1, 2) : 1); i++) {
    const out = i >= nCleft, wd = rng.range(10, 26) * Math.min(1, W / 125 + 0.25), ya = footY + H * rng.range(-0.1, 0.45), yb = out ? footY + H * rng.range(0.3, 0.75) : topY + 20;
    feats.push({ u: P.haul ? 0.5 + rng.sign() * rng.range(0.2, 0.47) : rng(), wd, d: (out ? rng.range(4, 9) : -rng.range(6, 15)) * Math.min(1, W / 90 + 0.1), ya: out ? footY - 60 : ya, yb });
  }
  const scal = []; if (P.haul) for (let i = 0; i < 3; i++) scal.push({ z: rng.range(-40, 38), y: rng.range(96, 186), rz: rng.range(9, 16), ry: rng.range(12, 22), d: rng.range(1, 2.6) });
  // The great forms, each from a stream of its own. BUTTRESSES: 3 to 6 rounded shafts on the sides and back (never on the haul face's
  // plane), each 3.5 to 9 % of the girth wide (15 to 40 m on the great pillar), a half-ellipse nose, swaying with height; four in ten
  // die out under a rounded cap. CLEFTS: the inward features above, 6 to 12 m wide, 4 to 10 m deep. APRONS: segments of great spheres
  // at the foot (no flared skirt).
  const rb = P.rngButtress || rng.fork('buttress'), ra = P.rngAprons || rng.fork('aprons'), gk = Math.min(1, Lp / 440), butt = [], aprons = [];
  const wnAt = (u) => (P.haul ? 1 - smp(wxK, inv[Math.round((((u % 1) + 1) % 1) * NI)]) : 1), uGap = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
  for (let tries = 0, want = P.haul ? rb.int(3, 6) : rb.int(2, 4); butt.length < want && tries < 300; tries++) {
    const w = Lp * (P.haul ? rb.range(0.035, 0.09) : rb.range(0.1, 0.22)), u = rb(), p = w * (P.haul ? rb.range(0.2, 0.32) : rb.range(0.12, 0.2)), sway = rb.range(1.5, 4) * gk, per = rb.range(90, 160), ph = rb.range(0, TAU), dies = rb.chance(0.4), yd = footY + H * rb.range(0.5, 0.85), cap = rb.range(25, 40);
    if (wnAt(u - (w * 0.5 + sway + 1) / Lp) < 0.999 || wnAt(u + (w * 0.5 + sway + 1) / Lp) < 0.999 || wnAt(u) < 0.999) continue;
    if (butt.some((q) => uGap(q.u, u) * Lp < (q.w + w) * 0.5 + 6 + q.sway + sway)) continue;
    butt.push({ u, w, p, sway, per, ph, yd: dies ? yd : 1e9, cap });
  }
  const clefts = feats.filter((f) => f.d < 0).slice(0, P.haul ? 4 : 2);
  let lob = null;
  if (!P.haul && P.rngLobes) { butt.length = 0; clefts.length = 0; P.LpRing = Lp; lob = makeLobes(P, H, W); }                    // a neighbour: the bundle of lobes takes their place
  for (const f of clefts) {
    const k1 = clamp((f.wd / Math.min(1, W / 125 + 0.25) - 10) / 16, 0, 1), k2 = clamp((-f.d / Math.min(1, W / 90 + 0.1) - 6) / 9, 0, 1);
    if (P.haul) { f.cw = lerp(6, 12, k1) * Math.max(0.35, gk); f.cd = lerp(4, 10, k2) * Math.max(0.3, gk); }
    else { f.cw = Math.max(5, Lp * lerp(0.05, 0.1, k1)); f.cd = f.cw * lerp(0.18, 0.3, k2); f.yb = f.ya + H * lerp(0.4, 0.7, (k1 * 7.3 + k2 * 3.1) % 1); f.soft = true; }   // a neighbour's cleft: broad, shallow, dying out at both ends
  }
  for (let i = 0, n = ra.int(5, 8); i < n; i++) {
    const u = (i + ra.range(0.15, 0.85)) / n, R = ra.range(20, 42) * Math.max(0.3, gk), b = ra.range(7, 18) * Math.max(0.3, gk), yc = footY + ra.range(-12, 2) * Math.max(0.3, gk);
    aprons.push({ u, R, b, yc });
  }
  const apronAt = (u, y, wx) => {
    let g = 0;
    for (const a of aprons) {
      const d = uGap(a.u, u) * Lp, dy = y - a.yc, b = wx > 0 ? Math.min(a.b, lerp(a.b, 7, wx)) : a.b, q = a.R * a.R - d * d - dy * dy; if (q <= 0) continue;
      let v = Math.sqrt(q) - (a.R - b); if (v <= 0) continue;
      if (P.haul && wx > 0) v *= lerp(1, 1 - sstep(-16, -6, y), wx);                        // on the haul face an apron ends below y -6
      if (v > g) g = v;
    }
    return g;
  };
  function* fillG() { for (let j = 0; j < GY; j++) { if ((j & 3) === 3) yield; for (let i = 0; i < GS; i++) {
    const u = i / GS, y = gy0 + j * 4, kf = inv[Math.round(u * NI)], wx = smp(wxK, kf), wn = P.haul ? 1 - wx : 1, t = clamp((y - footY) / H, 0, 1), tk = P.haul ? 1 : clamp(tp(t), 0.15, 1);
    let g = apronAt(u, y, wx);
    g += wn * P.waist * P.noise.fbm2(Math.cos(u * TAU) * 1.7 + 9.1, Math.sin(u * TAU) * 1.7 + y / 60, 3);
    if (P.haul) g += wn * 7 * Math.pow(1 - t, 1.5);                                         // the body thickens toward the foot
    for (const q of butt) {
      const uc = q.u + q.sway * Math.sin(y / q.per * TAU + q.ph) / Lp, e = uGap(uc, u) * Lp / (q.w * 0.5); if (e >= 1) continue;
      const life = y < q.yd ? 1 : Math.sqrt(Math.max(0, 1 - ((y - q.yd) / q.cap) ** 2));
      g += wn * tk * q.p * life * Math.sqrt(1 - e * e);
    }
    for (const f of clefts) {
      let du = Math.abs(u - f.u); du = Math.min(du, 1 - du) * Lp / f.cw;
      if (f.soft) { if (du < 0.5) g -= tk * f.cd * 0.5 * (1 + Math.cos(du * TAU)) * sstep(f.ya - 0.06 * H, f.ya + 0.06 * H, y) * (1 - sstep(f.yb - 0.06 * H, f.yb + 0.06 * H, y)); }
      else if (du < 2.5) g -= wn * tk * f.cd * Math.exp(-du * du * 2.2) * sstep(f.ya - 14, f.ya + 14, y) * (1 - sstep(f.yb - 14, f.yb + 14, y));
    }
    if (P.haul && wx > 0) { const z = cz + smp(bz, kf); g -= wx * (0.35 + 1.6 * sstep(-0.1, 0.5, P.noise.fbm2(z / 40 + 31.7, y / 100 + 5.3, 2))); for (const c of scal) { const q = 1 - ((z - c.z) / c.rz) ** 2 - ((y - c.y) / c.ry) ** 2; if (q > 0) g -= wx * c.d * Math.min(1, q * 2.2); } }
    G[j * GS + i] = g;
  } } }
  // the shoulder: on the sides and back the top rounds off as a quarter circle (radius by a ring noise); none where the haul face's lip is built on
  const shK = P.built ? 0.5 : 1, shR = ringNoise(rb, 64, 7), shLo = P.haul ? 6 : clamp(0.12 * W, 2.5, 10) * 0.8 * shK, shHi = P.haul ? 10 : clamp(0.12 * W, 2.5, 10) * 1.2 * shK, flatTop = tp(1) > 0.5;   // M3: a built top keeps a shoulder of half size
  const shoulderR = (u) => lerp(shLo, shHi, ringAt(shR, u));
  const shoulderAt = (u, y, wn) => { if (!flatTop || wn <= 0) return 0; const R = shoulderR(u), q = (y - (topY - R)) / R; return q <= 0 ? 0 : wn * R * (1 - Math.sqrt(Math.max(0, 1 - Math.min(1, q) ** 2))); };
  const Gat = (u, y) => {
    const fi = (((u % 1) + 1) % 1) * GS, i0 = Math.floor(fi), i1 = (i0 + 1) % GS, ti = fi - i0, fj = clamp((y - gy0) / 4, 0, GY - 1.001), j0 = Math.floor(fj), tj = fj - j0;
    return lerp(lerp(G[j0 * GS + i0], G[j0 * GS + i1], ti), lerp(G[(j0 + 1) * GS + i0], G[(j0 + 1) * GS + i1], ti), tj);
  };
  // upright joints of the haul face (they only stand back from the mean plane): the fig's crack at z -31, two chimneys and two cracks
  // that wander as they climb, pinch and open, and keep clear of the cave's mouth and of the ladders' line
  const joints = [];
  if (P.haul) {
    joints.push({ z: -31, w: 1.7, d: 1.1, ya: 40, yb: 118, sl: 0, ph: rng.range(0, TAU), wob: 0.4, wl: 0.05, pin: 0.2 });
    const free = (z, w) => Math.abs(z + 22) > 8 + w * 0.5 && Math.abs(z + 44) > 5.5 + w * 0.5 && joints.every((j) => Math.abs(j.z - z) > 11);
    for (let tries = 0; joints.length < 5 && tries < 400; tries++) {
      const chim = joints.length < 3, z = rng.range(-55, 51), w = chim ? rng.range(4.5, 7.5) : rng.range(1.4, 2.4), d = chim ? rng.range(1.8, 3.4) : rng.range(0.7, 1.4);
      const ya = rng.range(-44, 100), span = rng.range(90, 230), sl = rng.range(-0.015, 0.015), ph = rng.range(0, TAU), wob = rng.range(1.2, 2.6), wl = rng.range(0.055, 0.09), pin = rng.range(0.25, 0.55);
      if (free(z, w)) joints.push({ z, w, d, ya, yb: ya + span, sl, ph, wob, wl, pin, sw: true });
    }
  }
  // BAYS of the haul face: it is the flank of great shafts. Three broad recesses that only stand BACK from the mean plane, none where
  // a placed thing or an anchor stands (the monks' way, the cave and its ladders, the niche, the fig's crack, everything above y 190).
  const bays = [];
  if (P.haul && P.rngBays) { const r = P.rngBays;
    for (const [z0, z1, y0, y1] of [[6, 22, -40, 40], [28, 46, -40, 40], [-26, -12, 70, 90]]) bays.push({ z: r.range(z0, z1), a: r.range(7, 14), d: r.range(2.5, 5), ya: r.range(y0, y1), yb: r.range(120, 185), sw: r.range(1, 3), ph: r.range(0, TAU) }); }
  const boxOut = (z, y, z0, z1, y0, y1) => 1 - sstep(z0 - 4, z0, z) * (1 - sstep(z1, z1 + 4, z)) * sstep(y0 - 4, y0, y) * (1 - sstep(y1, y1 + 4, y));
  const bayAt = (z, y) => {
    let g = 0;
    for (const q of bays) { const e = Math.abs(z - q.z - q.sw * Math.sin(y * 0.03 + q.ph)) / q.a; if (e < 1 && y > q.ya - 20 && y < q.yb + 20) g = Math.max(g, q.d * 0.5 * (1 + Math.cos(e * Math.PI)) * sstep(q.ya - 20, q.ya, y) * (1 - sstep(q.yb, q.yb + 20, y))); }
    if (g <= 0) return 0;
    return g * (1 - sstep(170, 190, y)) * boxOut(z, y, -48.5, -39.5, -1e3, 1e3) * boxOut(z, y, -35, -5.5, 16, 62) * boxOut(z, y, -34, -28, 36, 122);
  };
  const jointZ0 = (j, y) => j.z + j.sl * (y - (j.ya + j.yb) * 0.5) + j.wob * Math.sin(y * j.wl + j.ph) + 0.25 * Math.sin(y * 0.31 + j.ph * 3);
  // M4b P3: the two chimneys and the two cracks sway and step aside (swayAt; not the fig's crack, which holds the old fig), but not
  // toward the cave (nothing within 5.2 m of its middle between y 16 and 62, whole at 7.2 m) nor toward the monks' way (4.5 m, whole
  // at 6.5 m). The sway lies from the moment the relief has found its cells (sway.on), so they are found on the joints as they were.
  const sway = { on: false };
  const swayJ = (j, y, zb) => { if (!sway.on || !j.sw) return zb; const s = swayAt(j.ph, y); if (s === 0) return zb;
    return zb + s * lerp(1, sstep(5.2, 7.2, Math.abs(zb + 22)), sstep(8, 16, y) * (1 - sstep(62, 70, y))) * sstep(4.5, 6.5, Math.abs(zb + 44)); };
  const jointZ = (j, y) => swayJ(j, y, jointZ0(j, y));
  // (POLISH 1, the build's time: a joint leaves its unswayed line by 1.04 m at the most (swayAt: 0.5 + 0.36 + 0.18, times shares of one
  // at the most), so a point farther from that line than half the joint's width and 1.05 m is outside it whatever the sway, and the
  // sway is not asked. The same numbers, sooner; so too in the relief's cutK and for the clefts, SWAY_MAX.)
  const jointAt = (z, y) => {
    let g = 0;
    for (const j of joints) {
      if (y < j.ya - 12 || y > j.yb + 12) continue;
      const zb = jointZ0(j, y); if (Math.abs(z - zb) >= j.w * 0.5 + SWAY_MAX) continue;
      const q = 1 - Math.abs(z - swayJ(j, y, zb)) / (j.w * 0.5);
      if (q > 0) g = Math.max(g, j.d * q * (2 - q) * (1 - j.pin * (0.5 + 0.5 * Math.sin(y * 0.07 + j.ph * 2))) * sstep(j.ya - 12, j.ya + 12, y) * (1 - sstep(j.yb - 12, j.yb + 12, y)));
    }
    return g;
  };
  return { P, K, Lp, bx, bz, ex, ez, wxK, sK, kOf, smp, tp, axis, Gat, H, rng, extra: null, lob, hollowAt: null, fillG, joints, jointZ, jointZ0, sway, jointAt, butt, clefts, aprons, shoulderAt, shoulderR, uGap, bays, bayAt, flatTop };   // run fillG() to the end before use
}

// The ledges: for every hard bed and each of its two heights a table of widths round the ring (broken runs), and the offset
// function of the surface. A ledge only stands back from the wall: flush hard layer with an angular lip, an undercut under it,
// the wall above standing back by the ledge's width and returning over `ha` metres.
function addBeds(sh, beds) {
  const { P, Lp } = sh, rr = P.rngRuns || P.rng, NL = 256, nb = beds.length, wT = [], wT2 = [], ds = Lp / NL, lk = Math.max(0.35, P.ledge);
  const wxAt = (k) => (P.haul ? sh.smp(sh.wxK, sh.kOf(k * ds)) : 0);
  for (let i = 0; i < nb; i++) {
    const b = beds[i], a = new Float32Array(NL), c = new Float32Array(NL), wob = ringNoise(rr, NL, 41);
    if (!b.duty || b.y >= P.topY - 0.01) {
      let s = rr.range(0, 40), up = rr.chance(0.5); const end = Lp + s;
      while (s < end) {
        const len = Math.min(rr.range(10, 60), Math.max(10, Lp * 0.3)), k0 = Math.round(s / ds), k1 = Math.round((s + len) / ds), T = b.step && up ? c : a;
        for (let k = k0; k <= k1; k++) {
          const kk = ((k % NL) + NL) % NL, e = Math.min(k - k0, k1 - k) * ds, wx = wxAt(kk);
          const v = b.w * lerp(2.5 * lk, 1.5, wx) * (0.55 + 0.45 * wob[kk]) * sstep(0, 3, e);
          if (v > T[kk] && a[kk] + c[kk] === 0) T[kk] = v;
        }
        s += len + rr.range(8, 45); up = !up;
      }
    }
    wT.push(a); wT2.push(c);
  }
  const levels = [];                                                                       // every ledge height: [top, bed index, table]
  beds.forEach((b, i) => { levels.push({ L: b.y, b, T: wT[i] }); if (b.step) levels.push({ L: b.y + b.step, b, T: wT2[i] }); });
  levels.sort((p, q) => p.L - q.L);
  const out2 = [0, 0];                                                                     // [offset, undercut depth] of the last call
  const hAt = (u, y) => {
    let h = 0, un = 0;
    for (let n = 0; n < levels.length; n++) {
      const lv = levels[n], b = lv.b, L = lv.L; if (y > L + b.ha || y < L - b.tb - b.hb) continue;
      if (y > L - b.tb && y <= L) continue;
      const w = ringAt(lv.T, u); if (w <= 0) continue;
      if (y > L) { const f = (y - L) / b.ha, v = -w * (1 - f * f * (3 - 2 * f)); if (v < h) h = v; }
      else { const f = 1 - (L - b.tb - y) / b.hb, v = -Math.min(0.95, b.u * (0.5 + 0.6 * w)) * f * f; if (v < h) h = v; if (-v > un) un = -v; }
    }
    out2[0] = h; out2[1] = un; return h;
  };
  sh.beds = beds; sh.wT = wT; sh.wT2 = wT2; sh.levels = levels; sh.hAt = hAt; sh.NL = NL;
  sh.underAt = (u, y) => { hAt(u, y); return out2[1]; };
  // the wash under a hard bed (0..1): it rises over the first 2 m under an undercut run and is gone 6 m below (m3b B3: no hard top)
  sh.washAt = (u, y) => { let m = 0; for (const lv of levels) { const yb = lv.L - lv.b.tb; if (y > yb || y < yb - 6) continue; const w = ringAt(lv.T, u); if (w > 0) m = Math.max(m, Math.min(1, w / 0.5) * (1 - (yb - y) / 6) * sstep(0, 2, yb - y)); } return m; };
  const ax = [0, 0];
  // offset of the surface along the column's own direction at perimeter s and height y (kf: the column's place in the outline table)
  sh.off = (s, y, kf) => {
    const u = s / Lp, wx = P.haul ? sh.smp(sh.wxK, kf) : 0, RL = wx > 0 ? sh.relief : null, z = wx > 0 ? P.cz + sh.smp(sh.bz, kf) : 0, yq = RL && !sh.noLift ? RL.qOf(z, y) : y;   // M4: yq, the bed's own height
    let hA = hAt(u, yq); if (hA < 0 && RL && !sh.noLift) hA *= 1 - wx * RL.cutK(z, y);                    // M4b P3: a joint runs THROUGH a hard bed: no lip, no undercut inside a cleft or a joint (never forward of the surface without ledges)
    let o = sh.Gat(u, y) + hA - sh.shoulderAt(u, y, 1 - wx);
    if (sh.lob) { const q = sh.lob.at(u, y), tk = clamp(sh.tp((y - P.footY) / sh.H), 0.15, 1); o += tk * (Math.hypot(sh.smp(sh.bx, kf), sh.smp(sh.bz, kf)) * (q[0] - 1) - q[2]); }
    if (sh.hollowAt) o -= sh.hollowAt(s, y, wx);
    if (P.haul && wx > 0) { if (sh.joints.length) o -= wx * sh.jointAt(z, y); if (sh.bays.length) o -= wx * sh.bayAt(z, y); if (RL) o -= wx * RL.at(z, y, yq)[0]; }
    if (sh.endAt) o -= sh.endAt(s, y);                                                      // M4: the end bays round the face's corners
    if (sh.capBand && (yq !== y || sh.capAll) && y >= 0 && y < 200) { const ex = sh.smp(sh.ex, kf); if (ex > 0.3) { const lim = (sh.capBand[Math.floor(y / 10)] - P.cx - sh.smp(sh.bx, kf)) / ex; if (o > lim) o = lim; } }   // M4: a lifted bed keeps within its band's number
    return sh.extra ? sh.extra(s, y, kf, o) : o;
  };
  // M4: the height a row of the mesh stands at in column s (the haul face's rows are lifted with the bedding)
  sh.liftY = (s, y) => { if (!sh.relief) return y; const kf = sh.kOf(s); return sh.smp(sh.wxK, kf) > 0 ? y + sh.relief.lift(P.cz + sh.smp(sh.bz, kf), y) : y; };
  sh.point = (s, y, o) => {
    const kf = sh.kOf(s), t = (y - P.footY) / sh.H, q = sh.tp(t), off = sh.off(s, y, kf); sh.axis(clamp(t, 0, 1), ax);
    o[0] = P.cx + ax[0] + q * sh.smp(sh.bx, kf) + sh.smp(sh.ex, kf) * off; o[1] = y; o[2] = P.cz + ax[1] + q * sh.smp(sh.bz, kf) + sh.smp(sh.ez, kf) * off;
    return o;
  };
  // the haul side (theta -90..90 degrees): perimeter s of a given z, and the face's x at (z, y). Exact where the columns stand along +x.
  const K = sh.K, k0 = K / 4, k1 = 3 * K / 4;
  sh.faceS = (z) => {
    const zz = z - P.cz; let lo = k0, hi = k1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sh.bz[m] < zz) lo = m; else hi = m; }
    const t = clamp((zz - sh.bz[lo]) / Math.max(1e-6, sh.bz[hi] - sh.bz[lo]), 0, 1);
    return lerp(sh.sK[lo], sh.sK[hi], t);
  };
  sh.faceX = (z, y) => { const s = sh.faceS(z), kf = sh.kOf(s); return P.cx + sh.smp(sh.bx, kf) + sh.smp(sh.ex, kf) * sh.off(s, y, kf); };
  // depth of a point inside the rock (m; negative outside), for baked shadows. Haul side by z, elsewhere by bearing.
  const o3 = [0, 0, 0];
  sh.depthAt = (x, y, z) => {
    if (y > P.topY) return -1;
    const t = clamp((y - P.footY) / sh.H, 0, 1), q = sh.tp(t); sh.axis(t, ax);
    const dx = x - P.cx - ax[0], dz = z - P.cz - ax[1];
    if (P.haul && dx > 20 && Math.abs(dz) < 56) return sh.faceX(z, y) - x;
    const th = Math.atan2(dz, dx), kf = (th + Math.PI) / TAU * K, i = Math.min(K - 1, Math.floor(kf)), s = lerp(sh.sK[i], sh.sK[i + 1], kf - i);
    sh.point(s, y, o3); void q;
    return Math.hypot(o3[0] - P.cx - ax[0], o3[2] - P.cz - ax[1]) - Math.hypot(dx, dz);
  };
  return sh;
}

// the heights a panel must have a row at: the ledges' lips, corners and undercuts, the shoulder's quarter round, the ends
function featureRows(sh, y0, y1, o = {}) {
  const ys = [y0, y1];
  for (const lv of sh.levels) {
    const L = lv.L, yb = L - lv.b.tb;
    if (o.lean) { if (!o.fewShoulder) ys.push(yb - lv.b.hb); ys.push(yb, L, L + 0.01); if (!lv.b.duty && lv.T.some((w) => w > 0.7)) ys.push(L + 0.02); continue; }   // a neighbour: the undercut and its shade end with a ring of their own
    ys.push(yb, L - 0.02, L, L + 0.01); if (o.fine) ys.push(L + 0.02); if (o.under !== false) ys.push(yb - 0.02);
  }
  const R = sh.shoulderR ? Math.max(sh.shoulderR(0.1), sh.shoulderR(0.4), sh.shoulderR(0.65), sh.shoulderR(0.9)) : 0;
  if (R > 0 && sh.tp(1) > 0.5) for (const f of o.fewShoulder ? [1.1, 0.62, 0.26, 0.05] : [1.1, 0.85, 0.62, 0.42, 0.26, 0.13, 0.05]) ys.push(y1 - R * f);
  return ys.filter((y) => y >= y0 && y <= y1).sort((a, b) => a - b);
}
// fill a sorted list of heights so that no gap is wider than gap(yMid)
function fillRows(feat, gap) {
  const rows = [];
  for (const y of feat) {
    const last = rows.length ? rows[rows.length - 1] : null;
    if (last !== null && y - last < 0.008) continue;
    if (last !== null) { const m = Math.ceil((y - last) / gap((last + y) / 2) - 0.01); for (let k = 1; k < m; k++) rows.push(last + (y - last) * k / m); }
    rows.push(y);
  }
  return rows;
}

// ---------- mesher: rows of differing column counts zipped into one indexed mesh ----------
// panels: [{ rows: [y ascending], cols(y) -> ascending s values in [s0, s1), the first exactly s0 }], in order round the ring.
// A generator: it yields between chunks so that buildHero can hand frames back; makePillar drains it at once.
function* loftSteps(sh, panels, o = {}) {
  const P = sh.P, Lp = sh.Lp, capM = o.capColumns || 72, capF = o.capRings || [0.985, 0.93, 0.8, 0.55, 0.25];
  let nw = 0;
  for (const p of panels) { p.S = []; p.start = []; let k = 0; for (const y of p.rows) { const c = p.cols(y); p.S.push(c); p.start.push(nw); nw += c.length; if ((++k & 31) === 0) yield; } }   // the engine's yield is free when asked often
  const topN = panels.reduce((a, p) => a + p.S[p.S.length - 1].length, 0), nv = nw + topN + capM * capF.length + 1 + panels[0].rows.length, dups = [];
  const pos = new Float32Array(nv * 3), sv = new Float32Array(nv), kind = new Uint8Array(nv), q = [0, 0, 0];
  let n = 0;
  // M4: where the bedding lifts the rows, no 10 m band of the face (y 0..200) may come out further than THE SAME MESH UNLIFTED: the
  // caps are measured first (every vertex where it stood, the lifted ones as their unlifted twins), then the lifted vertices are set
  const lifts = !!(sh.liftY && sh.relief), cap = lifts ? new Float32Array(20).fill(-1e9) : null, late = [];
  const capOf = (yy) => { if (yy >= 0 && yy < 200 && q[2] > -60 && q[2] < 56 && q[0] > -30) { const k = Math.floor(yy / 10); if (q[0] > cap[k]) cap[k] = q[0]; } };
  if (lifts) sh.capBand = null;
  for (const p of panels) for (let r = 0; r < p.rows.length; r++) {
    const c = p.S[r], y = p.rows[r], own = lifts && sh.relief.cellRow(y);   // a row that only a cell brought: not measured, and held to the band's cap
    for (let i = 0; i < c.length; i++) {
      const yy = lifts ? sh.liftY(c[i], y) : y; sv[n] = c[i];
      if (own) late.push(n, yy);
      else if (yy !== y) { late.push(n, yy); sh.noLift = true; sh.point(c[i], y, q); sh.noLift = false; capOf(y); }
      else { sh.point(c[i], y, q); pos[n * 3] = q[0]; pos[n * 3 + 1] = q[1]; pos[n * 3 + 2] = q[2]; if (lifts) capOf(y); }
      n++; if ((n & 47) === 0) yield;
    }
  }
  if (lifts) { sh.capBand = cap; sh.capAll = true; for (let j = 0; j < late.length; j += 2) { const v = late[j]; sh.point(sv[v], late[j + 1], q); pos[v * 3] = q[0]; pos[v * 3 + 1] = q[1]; pos[v * 3 + 2] = q[2]; if ((j & 94) === 94) yield; } sh.capAll = false; }
  let idx = new Uint32Array(nv * 7), ni = 0;
  const tri = (a, b, c) => { if (ni + 3 > idx.length) { const g = new Uint32Array(idx.length * 2); g.set(idx); idx = g; } idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; };
  // zip two chains of vertex indices by their keys; flip chooses the side that faces out
  const zip = (ia, ka, ib, kb, flip) => {
    const na = ia.length, nb = ib.length; let i = 0, j = 0;
    while (i < na - 1 || j < nb - 1) {
      if (i < na - 1 && (j === nb - 1 || ka[i + 1] <= kb[j + 1])) { if (flip) tri(ia[i], ib[j], ia[i + 1]); else tri(ia[i], ia[i + 1], ib[j]); i++; }
      else { if (flip) tri(ia[i], ib[j], ib[j + 1]); else tri(ia[i], ib[j + 1], ib[j]); j++; }
    }
  };
  const run = (start, len) => { const a = new Array(len); for (let i = 0; i < len; i++) a[i] = start + i; return a; };
  for (const p of panels) for (let r = 0; r < p.rows.length - 1; r++) { zip(run(p.start[r], p.S[r].length), p.S[r], run(p.start[r + 1], p.S[r + 1].length), p.S[r + 1], true); if ((r & 15) === 0) yield; }
  for (let j = 0; j < panels.length; j++) {                                           // the seams between panels (or a lone panel's own seam)
    const a = panels[j], b = panels[(j + 1) % panels.length]; let first = b.rows.map((y, r) => b.start[r]);
    if (j === panels.length - 1) first = first.map((v) => { pos.copyWithin(n * 3, v * 3, v * 3 + 3); sv[n] = sv[v] + Lp; dups.push(v, n); return n++; });   // the ring closes on a copy, one whole turn of s on
    zip(a.rows.map((y, r) => a.start[r] + a.S[r].length - 1), a.rows, first, b.rows, false);
  }
  yield;
  // the top: a copy of the rim (so the brow's edge stays crisp) and rings stepping in to the middle
  const rim = [], rimK = []; let cxs = 0, czs = 0;
  for (const p of panels) { const r = p.rows.length - 1, c = p.S[r]; for (let i = 0; i < c.length; i++) { const v = p.start[r] + i; pos.copyWithin(n * 3, v * 3, v * 3 + 3); sv[n] = c[i]; kind[n] = 1; rim.push(n); rimK.push(c[i] < panels[0].S[0][0] ? c[i] + Lp : c[i]); cxs += pos[v * 3]; czs += pos[v * 3 + 2]; n++; } }
  cxs /= rim.length; czs /= rim.length;
  let prev = rim.concat([rim[0]]), prevK = rimK.concat([rimK[0] + Lp]);
  const s00 = rimK[0];
  for (const f of capF) {
    const ring = [], ringK = [];
    for (let i = 0; i < capM; i++) { const s = s00 + Lp * i / capM; sh.point(s, P.topY, q); pos[n * 3] = cxs + (q[0] - cxs) * f; pos[n * 3 + 1] = P.topY; pos[n * 3 + 2] = czs + (q[2] - czs) * f; sv[n] = s; kind[n] = 1; ring.push(n); ringK.push(s); n++; }
    ring.push(ring[0]); ringK.push(s00 + Lp);
    zip(prev, prevK, ring, ringK, true); prev = ring; prevK = ringK;
  }
  pos[n * 3] = cxs; pos[n * 3 + 1] = P.topY; pos[n * 3 + 2] = czs; kind[n] = 1;
  for (let i = 0; i < capM; i++) tri(prev[i], n, prev[i + 1]);
  n++;
  yield;
  // smooth normals
  const nrm = new Float32Array(nv * 3);
  for (let t = 0; t < ni; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (((t / 3) & 4095) === 0) yield;
  }
  for (let i = 0; i < dups.length; i += 2) { const a = dups[i] * 3, c = dups[i + 1] * 3; for (let k = 0; k < 3; k++) { const v = nrm[a + k] + nrm[c + k]; nrm[a + k] = v; nrm[c + k] = v; } }
  for (let i = 0; i < nv; i++) { const a = i * 3, l = Math.hypot(nrm[a], nrm[a + 1], nrm[a + 2]); if (l > 1e-12) { nrm[a] /= l; nrm[a + 1] /= l; nrm[a + 2] /= l; } else nrm[a + 1] = 1; }
  return { pos, nrm, sv, kind, idx: idx.subarray(0, ni), nv, rimOutline: rim.map((v) => [pos[v * 3], pos[v * 3 + 2]]), rimS: rim.map((v) => sv[v]) };
}

// baked light and colour per vertex, then the geometry. o: { sun [x,y,z], rock [r,g,b], sOff, capColor(x,z), inside(x,y,z) }
function* bakeSteps(sh, M, o) {
  const { pos, nrm, sv, kind, nv } = M, P = sh.P, L = o.sun, base = o.rock, noise = P.noise, nb = sh.beds.length;
  const col = new Float32Array(nv * 3), pil = new Float32Array(nv * 4), cov = new Float32Array(nv * 4), foot = new Float32Array(nv * 2), rel = new Float32Array(nv * 3), TS = [0.3, 0.7, 1.3, 2.2, 3.6, 6, 9.5, 15, 23, 34];
  for (let i = 0; i < nv; i++) {
    const a = i * 3, x = pos[a], y = pos[a + 1], z = pos[a + 2], s = sv[i], u = s / sh.Lp;
    pil[i * 4] = s * (o.sScale || 1) + (o.sOff || 0); pil[i * 4 + 1] = P.topY - y;
    if (kind[i] === 2) {                                                                    // an extra (a bush, a block, a wall): its colour, cover and shade come with it
      const j = i - M.x0; col[a] = M.xcol[j * 3]; col[a + 1] = M.xcol[j * 3 + 1]; col[a + 2] = M.xcol[j * 3 + 2]; cov[i * 4] = M.xcov[j]; pil[i * 4 + 2] = 1; pil[i * 4 + 3] = M.xao[j];
      foot[i * 2] = x; foot[i * 2 + 1] = z; continue;
    }
    const kf = sh.kOf(s); foot[i * 2] = P.cx + sh.smp(sh.bx, kf); foot[i * 2 + 1] = P.cz + sh.smp(sh.bz, kf);       // the column's plumb foot: what falls down the rock keeps it
    if (kind[i]) {
      const c = o.capColor ? o.capColor(x, z) : mul3(base, 0.9);
      col[a] = c[0]; col[a + 1] = c[1]; col[a + 2] = c[2]; pil[i * 4 + 2] = 1; pil[i * 4 + 3] = 1; cov[i * 4] = c[3] ?? 1; cov[i * 4 + 3] = o.streakTable ?? 1; continue;
    }
    let occ = 0;
    if (nrm[a] * L[0] + nrm[a + 1] * L[1] + nrm[a + 2] * L[2] > 0.02) for (let k = 0; k < TS.length; k++) {
      const t = TS[k], d = sh.depthAt(x + nrm[a] * 0.06 + L[0] * t, y + nrm[a + 1] * 0.06 + L[1] * t, z + nrm[a + 2] * 0.06 + L[2] * t);
      if (d > 0) { occ = Math.max(occ, sstep(0, 0.1 + 0.08 * t, d)); if (occ > 0.98) break; }   // M4 W3: the edge widens with the throw (1 to 2 m on the face at 10 to 20 m)
    }
    let yq = y, rAo = 1, rSh = 0, pits = 0, cellIn = 0, jc = 0;                                      // M4: yq, the bed's own height here (the haul face's bedding dips and steps)
    if (sh.relief) { const wx = sh.smp(sh.wxK, kf); if (wx > 0) { const zz = P.cz + sh.smp(sh.bz, kf); yq = sh.relief.qOf(zz, y); jc = sh.relief.jogC(zz, yq); const q = sh.relief.at(zz, y, yq); rAo = lerp(1, q[3], wx); rSh = q[1] * wx; pits = q[2] * wx; cellIn = q[4] * wx; } }
    const und = sh.underAt(u, yq); let ao = lerp(1, 0.55, clamp(und / 0.6, 0, 1)) * rAo, shel = Math.max(clamp(und / 0.3, 0, 1), rSh);   // under a hard bed's lip (m3b B3: SHELTER 0..1, where no water falls)
    if (sh.scoopAt) shel = Math.max(shel, sstep(0.3, 0.7, sh.scoopAt(s, y)));
    if (sh.lob) ao *= 1 - 0.5 * sh.lob.at(u, y)[1];                                         // in a crease of the bundle, in a deep cleft
    else { const du = 6 / sh.Lp, conc = (sh.Gat(u - du, y) + sh.Gat(u + du, y)) * 0.5 - sh.Gat(u, y); if (conc > 0) ao *= 1 - 0.35 * sstep(0, 4, conc); }   // in a cleft
    if (sh.cragAt) ao *= 1 - 0.5 * sh.cragAt(s, y);
    let tone = 1 + 0.08 * noise.fbm3(Math.cos(u * TAU) * 3, Math.sin(u * TAU) * 3, y / 40, 2);
    cov[i * 4 + 1] = o.white ? o.white(x, yq, z) : 0; cov[i * 4 + 2] = sh.washAt(u, yq); cov[i * 4 + 3] = o.streakTable ?? 1;
    if (o.soft) for (const q of o.soft) {                                                   // a neighbour's own soft streaks: darker tone, widening downward
      const dep = (P.topY - y) / q.len; if (dep < 0 || dep > 1) continue;
      const e = sh.uGap(q.u, u) * sh.Lp / (q.w * 0.5 * (1 + 0.8 * dep)); if (e < 1) tone *= 1 - q.a * (1 - e) * sstep(0, 0.04, dep) * (1 - sstep(0.6, 1, dep));
    }
    let grass = 0;
    if (o.grass) for (const lv of sh.levels) { if (lv.b.duty || yq < lv.L - 0.012 || yq > lv.L + 0.016) continue; const w = ringAt(lv.T, u); if (w > 0.7) grass = Math.max(grass, clamp((w - 0.7) / 0.9, 0, 1)); }
    let ins = o.inside ? o.inside(x, y, z) : 0;
    if (sh.caveAt) { const c = sh.caveAt(s, y); if (c > 0) { ins = Math.max(ins, c); occ = Math.max(occ, c); } }   // a cave mouth: no sun inside
    if (cellIn > 0) { ins = Math.max(ins, cellIn); occ = Math.max(occ, cellIn); }           // M4: a cell's cave
    if (ins > 0) { ao *= lerp(1, 0.28, ins); tone *= lerp(1, 0.5, ins); shel = Math.max(shel, ins); }
    rel[i * 3] = shel; rel[i * 3 + 1] = pits; rel[i * 3 + 2] = y - yq + jc;   // M4b P3: the colours take the whole jog (jc: what the rock's own jog lacks of it here)
    if (o.facing) tone *= lerp(o.facing, 1, sstep(-0.3, 0.3, nrm[a] * L[0] + nrm[a + 1] * L[1] + nrm[a + 2] * L[2]));
    tone *= 0.82 + 0.18 * ao;
    col[a] = base[0] * tone; col[a + 1] = base[1] * tone; col[a + 2] = base[2] * tone;
    if (grass > 0) { const gk = 0.75 + 0.5 * noise.n2(x * 0.7 + 3.1, z * 0.7), gc = o.grass; col[a] = gc[0] * gk; col[a + 1] = gc[1] * gk; col[a + 2] = gc[2] * gk; cov[i * 4] = 0.9 * grass; }
    pil[i * 4 + 2] = 1 - occ; pil[i * 4 + 3] = ao;
    if ((i & 31) === 0) yield;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aPil', new THREE.BufferAttribute(pil, 4)); g.setAttribute('aCov', new THREE.BufferAttribute(cov, 4)); g.setAttribute('aFoot', new THREE.BufferAttribute(foot, 2)); g.setAttribute('aRel', new THREE.BufferAttribute(rel, 3));
  g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(M.idx) : new Uint16Array(M.idx), 1));
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

// ---------- the bed table for the shader (the kit's makeStrata form, built from the ledge list so colour and relief agree) ----------
function makeBedTable(beds, rng, pal) {
  // One warm iron-grey. A bed differs from its neighbour by a little in tone and warmth; a parting is a fine dark line with a paler lip
  // under it. Alpha = how coarse the conglomerate's course is at that height (level courses 2 to 6 m thick: cobbly or sandy).
  const base = -60, span = 312, N = 2048, data = new Uint8Array(N * 4), px = span / N;
  const grey = mix3(lin(pal[0]), lin('#6e6a66'), 0.45), brown = lin('#75573f'), parts = beds.partings || [], tones = beds.tones || [[1, 0]];
  const quiet = (tn) => [1 + (tn[0] - 0.985) * 0.35, tn[1] * 0.5];                         // M3: the beds go quiet: tones within 3 %, a parting a fine line
  const course = []; { let y = base; while (y < base + span) { const t = rng.range(2, 6); course.push({ y0: y, y1: y + t, k: rng.chance(0.45) ? rng.range(0.75, 1) : rng.range(0.1, 0.4) }); y += t; } }
  const mean = [0, 0, 0], rows = []; let bi = 0, ci = 0;
  for (let i = 0; i < N; i++) {
    const yy = base + (i + 0.5) * px; while (bi < parts.length && yy > parts[bi] + 0.15) bi++; while (ci < course.length - 1 && yy >= course[ci].y1) ci++;
    const tn = quiet(tones[Math.min(bi, tones.length - 1)]), c0 = mix3(grey, brown, tn[1]);
    let k = tn[0] * (1 + 0.025 * (rng() - 0.5));
    const up = bi < parts.length ? parts[bi] - yy : 1e9;                                    // metres below the next parting above
    if (up < 0.15 && up > -0.15) k = 0.87; else if (up >= 0.15 && up < 0.6) k *= 1.04 - 0.02 * (up - 0.15) / 0.45;
    const cs = course[ci], e = Math.min(yy - cs.y0, cs.y1 - yy), ck = lerp(0.5, cs.k, clamp(e / 0.5, 0, 1));
    for (let c = 0; c < 3; c++) { const v = clamp(c0[c] * k, 0, 1); data[i * 4 + c] = Math.round(Math.sqrt(v) * 255); mean[c] += v / N; }
    data[i * 4 + 3] = Math.round(ck * 255);
  }
  { let lo = base; for (let i = 0; i <= parts.length; i++) { const hi = i < parts.length ? parts[i] : base + span; if (hi > lo) { const tn = quiet(tones[Math.min(i, tones.length - 1)]), c = mul3(mix3(grey, brown, tn[1]), tn[0]); rows.push({ y0: lo - base, y1: hi - base, hard: 0.5, color: new THREE.Color(c[0], c[1], c[2]) }); lo = hi; } } }
  const texture = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
  return { texture, beds: rows, span, base, steps: beds.map((q) => q.y - base).filter((v) => v > 0 && v < span), meanColor: new THREE.Color(mean[0], mean[1], mean[2]), ledges: beds,
    bedAt(yw) { let v = (yw - base) % span; if (v < 0) v += span; for (const r of rows) if (v < r.y1) return r; return rows[rows.length - 1]; } };
}

// ---------- the rock material: the kit's rock (beds, triplanar detail, scene lights, fog, shadows) plus a layer of ours ----------
// streaks: [{ s (m along the perimeter), w (m), len 0..1 }]. The streak table is a 1024-texel ring: r = strength, g = length.
function makeStreakTexture(streaks, Lp, rng) {
  const N = 1024, data = new Uint8Array(N * 4), rill = ringNoise(rng, N, 331);
  for (let i = 0; i < N; i++) {
    const s = (i + 0.5) / N * Lp; let v = 0, len = 0;
    for (const k of streaks) { let d = Math.abs(s - ((k.s % Lp) + Lp) % Lp); d = Math.min(d, Lp - d); const q = 1 - sstep(k.w * 0.1, k.w * 0.5, d); if (q > v) { v = q * k.a; len = k.len; } }
    data[i * 4] = Math.round(255 * clamp(v * (0.8 + 0.3 * rill[i]), 0, 1)); data[i * 4 + 1] = Math.round(255 * len); data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}
const ROCK_FRAG = /* glsl */`
{ vec3 wpp = vTWorld; vec3 wnn = normalize(vTNormal);
  // M4b P6: NO GLOWING PIXEL. At the edge of a sliver (a bush's facet, a block's corner, far off) the rasterizer reads what the vertices
  // carry beyond the triangle: a cover of 50, a colour under nought. Every such value is held to its own range here, the colour that
  // comes in and the colour that goes out to 0..1; the shade's hue (SHADE_HUE) takes no more than twice the light it stands for.
  vec4 cov = clamp(vCov, 0., 1.); vec2 rel = clamp(vRel.xy, 0., 1.); gPilOcc = clamp(vPil.w, 0., 1.);
  gPilLit = smoothstep(0., 1., vPil.z);                               // M4 W3: the baked sun-shade as it was baked (soft over 1 to 2 m; m3b's firmer edge is withdrawn)
  float steepK = 1. - smoothstep(.35, .7, wnn.y);
  float sn = vPil.x * uPil.w;
  vec4 nzz = texture2D(tDetail, vec2(sn * uPilK.x, wpp.y * .021));
  vec4 smr = texture2D(tDetail, vec2(sn * uPilK.y + nzz.r * .3, wpp.y * .012));
  float smB = texture2D(tDetail, vec2(sn * uPilK.y + nzz.r * .3, wpp.y * .012), 3.).r;   // M4 W2: the 11 m field read three mips down (waves of 1.4 m and more): what gates a run, a strand, a wash
  float byq = wpp.y - vRel.z + (nzz.r - .5) * 1.6;                    // M4 W1: the bed's own height here (the bedding dips and steps; baked). M4b P3: and the colours of the beds wander by up to 0.8 m about it in waves of 6 to 12 m (the 91 m field), so that no colour's edge is a ruled line
  vec3 cc = clamp(diffuseColor.rgb, 0., 1.);
  // m3b B2 and B3: CONGLOMERATE. The kit's cell texture is a pavement of flat-topped stones; a STONE here is what stands above a
  // threshold of that height, so stones are islands in a sandy ground. Two layers (1.45 m to the tile: pebbles and cobbles of 7 to
  // 40 cm; 5.3 m, turned 31 degrees: cobbles and boulders to 1.4 m), looked up on THREE planes by the fourth power of the normal, so
  // nothing is drawn out along a roof, a tread or a chamfer (that was the sideways smear). Coarse and sandy stuff lie in level
  // courses (the bed table's alpha) and lenses 4 to 9 m long; the threshold moves with a field of 9 m, so no repeat shows the same
  // stones. It fades by the footprint of a pixel on the rock (fp, metres).
  // ROUND E: THE FOOTPRINT IS THE FILTER'S OWN. fp stood as the length of fwidth, which on a wall seen along itself is the
  // footprint's LONG axis: the stones went by the long axis while a pixel still held them across the short one, and with the cell
  // texture's filter reaching only twice the short axis they were blurred along the wall besides: the wall read as drawn out. Now
  // the cell texture is filtered along the long axis as far as the renderer gives, to 16 times the short one (makeRockMat), and
  // fp is the greater of the short axis and of the long axis over that reach (uPilM.y), times 1.41: face on and upright it is what
  // it was. A filter by the pixel's footprint alone; nothing by a place of the flight, a time or where the eye looks. What else
  // goes by fp goes with it on a face seen at a slant: the hairlines' least width, the lichen's crusts, the rain's threads.
  vec3 tw = wnn * wnn; tw *= tw; tw /= max(tw.x + tw.y + tw.z, 1e-4);
  vec2 pw = tw.xz / max(tw.x + tw.z, 1e-4);
  vec3 fdx = dFdx(wpp), fdy = dFdy(wpp); float fl1 = length(fdx), fl2 = length(fdy);
  float fp = max(min(fl1, fl2), max(fl1, fl2) / max(uPilM.y, 1.)) * 1.41;
  float bsy = (byq - uTGlow.w) * uTStrata.y;
  vec4 bd0 = texture2D(tStrata, vec2(bsy, .5));
  vec4 lens = texture2D(tDetail, vec2(sn * floor(uPilK.x * 2.5 + .5) + .13, byq * .111 + .4));
  vec3 wq = wpp + vec3(.6, .5, .8) * ((nzz.r - .5) * 1.2);             // a slow warp (the 91 m by 47 m field): no fold, nothing drawn out
  vec2 vv = vec2(wq.x * .8 + wq.z, wq.y + wq.x * .3);
  vec4 hue = texture2D(tDetail, vv * .41 + .3), vary = texture2D(tDetail, vv * .111 + .7);
  float coarse = clamp(bd0.a * .6 + (lens.r - .5) * 1.6 + .2, 0., 1.);
  float th1 = max(mix(.80, .52, coarse) + (vary.r - .5) * .34, .45), th2 = max(mix(1., .70, coarse * coarse) + (vary.r - .5) * .34, .6);
  mat2 r2 = mat2(.857, .515, -.515, .857);
  vec4 a1 = texture2D(tCell, wq.zy * .69), b1 = texture2D(tCell, wq.xy * .69), c1 = texture2D(tCell, wq.xz * .69);
  vec4 a2 = texture2D(tCell, r2 * wq.zy * .189 + .37), b2 = texture2D(tCell, r2 * wq.xy * .189 + .37), c2 = texture2D(tCell, r2 * wq.xz * .189 + .37);
  float h1 = a1.r * tw.x + b1.r * tw.z + c1.r * tw.y, h2 = a2.r * tw.x + b2.r * tw.z + c2.r * tw.y;
  vec3 gs1 = tw.x * vec3(0., a1.b - .5, a1.g - .5) + tw.z * vec3(b1.g - .5, b1.b - .5, 0.) + tw.y * vec3(c1.g - .5, 0., c1.b - .5);
  vec2 ga = (a2.gb - .5) * r2, gb2 = (b2.gb - .5) * r2, gc = (c2.gb - .5) * r2;
  vec3 gs2 = tw.x * vec3(0., ga.y, ga.x) + tw.z * vec3(gb2.x, gb2.y, 0.) + tw.y * vec3(gc.x, 0., gc.y);
  float congl = 1. - cov.x, f1 = (1. - smoothstep(.10, .34, fp)) * congl, f2 = (1. - smoothstep(.45, 1.4, fp)) * congl;
  // ROUND E: rag, the stones' own height about its middle (layer 2 about .55, layer 1 about its mean), each layer's share fading
  // with that layer by the footprint: what a mark's edge follows where the stones are seen (see THE EDGES below)
  float rag = (h2 - .55) * .5 * f2 + (h1 - uPilM.x) * .35 * f1;
  float hp = mix(uPilM.x, h1, .35);
  float m1 = smoothstep(th1 - .03, th1 + .03, h1) * f1;
  float th2x = mix(th2, .70, rel.y);                                  // in a honeycomb the stones of layer 2 are PITS
  float m2 = smoothstep(th2x - .03, th2x + .03, h2) * f2;
  float e1 = clamp((h1 - th1) / max(1. - th1, .08), 0., 1.), e2 = clamp((h2 - th2x) / max(1. - th2x, .08), 0., 1.);
  float rim1 = (1. - m1) * smoothstep(th1 - .16, th1 - .02, h1) * f1, rim2 = (1. - m2) * smoothstep(th2x - .2, th2x - .02, h2) * f2;
  float sgn = 1. - 2. * max(smoothstep(.6, .64, nzz.b), rel.y);       // one stone in eight fell out: a socket
  float st2 = m2 * max(sgn, 0.), so2 = m2 * max(-sgn, 0.), s1 = m1 * (1. - m2);
  vec3 sc1 = mix(vec3(.74, .74, .77), vec3(1.), smoothstep(.36, .40, hue.r));
  sc1 = mix(sc1, vec3(1.10, .86, .70), smoothstep(.50, .54, hue.r)); sc1 = mix(sc1, vec3(1.28, 1.25, 1.18), smoothstep(.62, .66, hue.r));
  vec3 sc2 = mix(vec3(.74, .74, .77), vec3(1.), smoothstep(.36, .40, vary.r));
  sc2 = mix(sc2, vec3(1.10, .86, .70), smoothstep(.50, .54, vary.r)); sc2 = mix(sc2, vec3(1.28, 1.25, 1.18), smoothstep(.62, .66, vary.r));
  vec3 c0 = cc;
  cc = c0 * mix(1., 1.03 * (1. - .25 * max(rim1 * (1. - m2), rim2)) * (1. + .12 * (h1 - uPilM.x) * f1), congl);
  cc = mix(cc, c0 * sc1 * mix(.95, 1.25, e1), s1);
  cc = mix(cc, c0 * sc2 * mix(.95, 1.25, e2), st2);
  cc = mix(cc, c0 * mix(.6, .45, rel.y), so2);
  // POLISH 1: THE GRAIN AT A FEW METRES. The close wall read as soft, blotched and smeared: the kit's relief has no wave under 15 cm, so
  // at 10 to 30 m every lump lay over a dozen pixels, and under the raking sun the lumps stood as grey and gold blotches. Four things,
  // none of which reads a place of the flight or a time; the picture's size is read only as a filter against shimmer (b, d: the
  // footprint of a pixel) and by the textures' own mips (c):
  // (a) the kit's relief stands at two thirds within 60 m of the eye and whole from 200 m (a near rule by the eye's distance, as the
  //     kit's own two are: the same at any picture size; the far pillars as before);
  // (b) the stones are a little likelier in the sandy courses and A STONE HAS A RIM: its upper edge lit, its under edge shaded, by the
  //     stone's own slope (a socket the other way), in any light; a layer of stones fades out, as before, by the footprint of a pixel
  //     on the rock (fp), a filter against shimmer alone: since ROUND E from where its middle stones fall under two pixels to
  //     where its largest fall under about one (layer 1, 7 to 40 cm: fp 10 to 34 cm; layer 2, to 1.4 m: 45 cm to 1.4 m); from
  //     polish 1 it went a third sooner (7 to 22 cm; 30 to 90 cm), and at 50 to 100 m on a small picture the wall stood nearly
  //     without a stone;
  // (c) GRAIN: between the stones the sandy ground has a grain of its own, the kit's noise at 1.1 m to the tile on three planes (waves
  //     of 2 to 27 cm), in the light and faintly in the colour; it fades by the texture's own mips;
  // (d) PARTINGS: hairlines along the beds, about 0.7 m apart, wandering a little, in broken lengths; they dip and step with the
  //     bedding. A line is drawn by its distance in pixels (never under 0.6 of a pixel wide, 3 cm at arm's length) and fades where
  //     the lines would crowd.
  gTGrad *= mix(.65, 1., smoothstep(60., 200., length(vViewPosition)));
  gTGrad += (10. * s1 + 14. * 4. * m1 * (1. - m1) * (1. - m2) * f1) * gs1 + (10. * m2 + 14. * 4. * m2 * (1. - m2) * f2) * sgn * gs2;
  cc *= 1. - clamp(1.1 * gs1.y * s1 + 1.3 * gs2.y * sgn * m2, -.4, .45) * congl;
  vec4 fa = texture2D(tDetail, wpp.zy * .9 + .21), fb = texture2D(tDetail, wpp.xy * .9 + .57), fc = texture2D(tDetail, wpp.xz * .9 + .11);
  float grK = congl * (1. - max(s1, m2));
  gTGrad += 1.3 * grK * (tw.x * vec3(0., fa.b - .5, fa.g - .5) + tw.z * vec3(fb.g - .5, fb.b - .5, 0.) + tw.y * vec3(fc.g - .5, 0., fc.b - .5));
  cc *= 1. + .2 * grK * (fa.r * tw.x + fb.r * tw.z + fc.r * tw.y - .5);
  float bn = byq * 1.4 + (texture2D(tDetail, vec2(sn * floor(uPilK.x * 1.5 + .5) + .37, byq * .031), 2.5).r - .5) * 1.6;
  float bw = max(fwidth(bn), 1e-4), bpx = (.5 - abs(fract(bn) - .5)) / bw, bhw = max(.6, .015 / max(fp, 1e-4));
  float part = (1. - smoothstep(bhw, bhw + .8, bpx)) * (1. - smoothstep(.10, .24, bw)) * steepK * congl
    * smoothstep(.43, .57, texture2D(tDetail, vec2(sn * floor(uPilK.x * 2. + .5) + byq * .05, byq * .31)).r);
  cc *= 1. - .2 * part;
  // ROUND E: THE PARTINGS STAY IN SIGHT. The hairlines above stand 0.7 m apart and go where they would crowd (from 10 to 4 pixels
  // apart): at 50 to 100 m on a small picture the wall had no line on it, only soft marks, and read as smeared. Every FOURTH
  // parting (2.9 m apart) and every SIXTEENTH (11 m) is a firmer one, a bed's ledge. Each kind is drawn as the hairlines are, by
  // its distance in pixels (a fifth of a pixel wider; the sixteenth a half), and goes in its turn where its own kind would crowd:
  // so at any distance some beds are seen, four pixels apart and more. In broken lengths (each line by a row of its own of the
  // kit's noise) and stronger or fainter with the 9 m field (vary); at the most a quarter dark (the sixteenth three tenths), with
  // a paler lip over it (a fifth, two to three pixels). They dip, step and wander with the bedding as the hairlines do, on the
  // steep rock only. By the footprint alone: nothing reads a place of the flight, a time or where the eye looks. As with the
  // hairlines, which kind is in sight and how wide a line is in metres go by the picture's size: a larger picture holds the
  // finer kind farther off and draws every line thinner on the rock.
  { float bnA = bn * .25, bwA = max(fwidth(bnA), 1e-4), dA = fract(bnA + .5) - .5, pxA = abs(dA) / bwA;
    float gA = smoothstep(.47, .57, texture2D(tDetail, vec2(sn * floor(uPilK.x * 1.5 + .5) + .61, floor(bnA + .5) * .173 + .11)).r) * (.5 + .5 * smoothstep(.35, .65, vary.r));
    float kA = (1. - smoothstep(.10, .24, bwA)) * steepK * congl * gA;
    float bnB = bn * .0625, bwB = max(fwidth(bnB), 1e-4), dB = fract(bnB + .5) - .5, pxB = abs(dB) / bwB;
    float gB = smoothstep(.42, .54, texture2D(tDetail, vec2(sn * floor(uPilK.x + .5) + .23, floor(bnB + .5) * .271 + .57)).r) * (.6 + .4 * smoothstep(.35, .65, vary.r));
    float kB = (1. - smoothstep(.10, .24, bwB)) * steepK * congl * gB;
    float hw = bhw + .2;
    float lnA = (1. - smoothstep(hw, hw + .8, pxA)) * kA, lnB = (1. - smoothstep(hw + .3, hw + 1.1, pxB)) * kB;
    float lipA = smoothstep(hw, hw + .8, pxA) * (1. - smoothstep(hw + 1.6, hw + 3.2, pxA)) * step(0., dA) * kA;
    float lipB = smoothstep(hw + .3, hw + 1.1, pxB) * (1. - smoothstep(hw + 2.2, hw + 4.2, pxB)) * step(0., dB) * kB;
    cc *= (1. - max(.26 * lnA, .30 * lnB)) * (1. + .22 * max(lipA, lipB)); }
  // M4 W5: COLOUR IN LARGE. Lenses along the beds, 10 to 40 m long and 3 to 6 m thick (two fields 141 m by 24 m to the tile, read
  // one and a half mips down, so their edges are soft over 1 to 2 m), a ninth of the face each: ochre, rust-red, pale buff. They
  // dip and step with the bedding.
  // ROUND E: THE EDGES. Every broad mark on the rock (a lens of colour here; a run, a pale run and a brow's streak below) ended
  // softly over a half to two metres at any distance, and near the eye that is a smear. rag (the stones' height about its middle,
  // fading with the stones by the footprint) is added to the mark's field before its threshold, and the thresholds are narrower
  // (the lenses' a half of their width, the runs' and pale runs' 0.45, the brow's streaks drawn in to the middle 56 in 100 of
  // their ramp): near the eye a mark ends raggedly along the stones; far off, where no stone is seen, along its own field as
  // before, a little firmer. The born streaks, the washes and the whitewash are as they were; the lichen and the rain's gloss
  // keep their own fields and give way to a streak or a run along its new edge.
  float lzR = rag * .04;
  float lzN = floor(uPilK.x * .6 + .5);
  float lzA = texture2D(tDetail, vec2(sn * lzN + .21, byq * .0417 + .37), 1.5).r, lzB = texture2D(tDetail, vec2(sn * lzN + .64, byq * .0417 + .83), 1.5).r;
  float ochK = smoothstep(.675, .705, lzA + lzR) * congl, rusK = (1. - smoothstep(.295, .325, lzA + lzR)) * congl, bufK = smoothstep(.675, .705, lzB + lzR) * (1. - ochK) * (1. - rusK) * congl;
  cc *= mix(vec3(1.), vec3(1.10, .98, .78), ochK); cc *= mix(vec3(1.), vec3(1.04, .80, .68), rusK); cc *= mix(vec3(1.), vec3(1.15, 1.11, 1.0), bufK);
  // thin ochre and rust washes under the hard beds' lips
  float stain = cov.z * smoothstep(.5, .72, smB + (nzz.g - .5) * .5) * steepK;
  vec3 stc = mix(vec3(.60, .38, .16), vec3(.40, .19, .10), smoothstep(.4, .7, nzz.b));
  cc = mix(cc, cc * .62 + stc * .4, stain * .3);
  // where the jackdaws sit: whitewash down from a lip
  cc = mix(cc, min(vec3(.74, .73, .68), c0 * 2.4), cov.y * (.45 + .55 * smoothstep(.35, .6, smB)) * .8);
  // M3 R2: THE BEDS ARE QUIET: a parting is a fine line, drawn in broken lengths (the kit's own ring of it is faint)
  vec3 bdA = texture2D(tStrata, vec2(bsy + .45 * uTStrata.y, .5)).rgb, bdB = texture2D(tStrata, vec2(bsy - .45 * uTStrata.y, .5)).rgb;
  float bedL = clamp((dot(bdA + bdB, vec3(.1667)) - dot(bd0.rgb, vec3(.3333))) * 22., 0., 1.);
  float bedK = smoothstep(.5, .6, texture2D(tDetail, vec2(sn * uPilK.x * 3. + byq * .37, byq * .11)).r);
  cc *= 1. - .34 * bedL * bedK * steepK;
  // M3 R2: THE MARKING IS UPRIGHT. What runs down a rock keeps its column: every field here is looked up at the plumb foot of the
  // column in the world's plan (vFoot, m), so a streak holds its place whatever the rock does on its way down, on every pillar.
  // DRIFTS (300 m to the tile) say where streaks stand; in a drift two fields of lines (34 m and 8 m to the tile: lines of 0.5 to 6 m)
  // make them; a streak begins at the lip or lower and is 20 to 150 m long (a field 55 m to the tile); denser under a hard bed's lip
  // and in the clefts. Between them paler buff runs; yellow-grey lichen in patches. All fade by the textures' own mips.
  float drift = texture2D(tDetail, vFoot * .0033 + .11).r;
  // m3b B3: NO SMEAR. No water falls where the rock is sheltered (rel.x, baked: under an undercut or a roof, in a cave, a scoop, an
  // alcove) nor on rock that faces down; the wash under a hard bed begins softly and stands in runs; a streak wanders 0.13 m at
  // most (it runs plumb); the shade's share of the streak count ends where the shelter begins.
  float openK = (1. - rel.x) * (1. - smoothstep(.3, .6, -wnn.y));
  // M4 W2: NO PINSTRIPE. The lines were drawn by a field of 8 m to the tile (waves of 0.12 to 0.5 m) and by gates of 1.8 m and 11 m to
  // the tile along the face; now the run field (34 m) is read two mips down (finest wave 2.1 m) beside one of 90 m: runs 0.5 to 4 m wide.
  vec2 fpw = vFoot + vec2(1., .7) * ((smB - .5) * .25);
  float lnM = texture2D(tDetail, fpw * .0294 + .31, 2.).r, lnF = texture2D(tDetail, vFoot * .0111 + .67).r;
  vec4 runF = texture2D(tDetail, vFoot * .0182 + .53);
  float lines = lnM * .62 + lnF * .38;
  float dens = smoothstep(.45, .58, drift) + .8 * cov.z * smoothstep(.42, .6, lnM) + .5 * (1. - gPilOcc) * (1. - rel.x);
  float lth = mix(.67, .54, min(dens, 1.)) - .04 * clamp(dens - 1., 0., 1.);
  float runG = clamp((runF.g - .5) * 3. + .5, 0., 1.), runB = clamp((runF.b - .5) * 3. + .5, 0., 1.);
  float lenS = 20. + 130. * runG;
  float winA = smoothstep(.3, 3., vPil.y) * (1. - smoothstep(.5, 1., vPil.y / lenS)) * smoothstep(.46, .54, runF.r);
  float tB = fract(wpp.y / 170. + runF.r * 1.3 + runB);
  float winB = (1. - smoothstep(.975, 1., tB)) * smoothstep(1. - lenS / 170., 1. - lenS / 310., tB);
  float runK = texture2D(tDetail, vec2(dot(vFoot, vec2(.013, .017)), wpp.y * .01)).r;     // a streak comes and goes as it falls: one strength across it, changing over 12 to 25 m of height
  float strU = smoothstep(lth - .027, lth + .036, lines + rag * .10) * max(winA, winB) * steepK * openK * (1. - cov.x) * (.35 + .65 * smoothstep(.36, .6, runK));
  // M4b P5: THE STREAKS KEEP A FLOOR. Every dark of water (the runs, the brow's streaks, the born ones, the soot) is one multiplier sM,
  // the least of them and never their product: a broad streak (over 1 m) stands at .47 of the rock beside it and no lower (dry; cool
  // by a twentieth), after rain at .39 with its gloss; a thread under a metre may go to .30. The recess shade then takes a streak
  // no lower than it takes the rock (SHADE_HUE).
  float sB = mix(.44, .36, uPil.x);
  float sM = mix(1., sB, strU * (.55 + .4 * smoothstep(.4, .7, lnM)));
  float pale = (1. - smoothstep(.399, .431, lines + rag * .08)) * (1. - strU) * steepK * openK * (.4 + .6 * smoothstep(.4, .6, runF.r));
  cc = mix(cc, cc * vec3(1.26, 1.15, .96), pale * .8);
  float lich = smoothstep(.64, .74, mix(texture2D(tDetail, wpp.zy * .021 + .2).r, texture2D(tDetail, wpp.xy * .021 + .7).r, pw.y)) * steepK * (1. - strU) * smoothstep(.4, .6, vary.r);
  cc = mix(cc, vec3(.34, .33, .22), lich * .28);
  gTWet = max(gTWet, strU * uPil.x * .7);
  // black water streaks from the brow: the darkest thing on the rock, widening as they fall, fading out below; soft-edged until
  // ROUND E, now with the firmer, ragged edge of THE EDGES above (rag at .6 on the table's value; the middle 56 in 100 of the ramp)
  float su = sn + ((nzz.r - .5) * .7 + (smB - .5) * .15) * uPil.w;
  vec4 skk = texture2D(tStreak, vec2(su, .5));
  float slen = 96. + 44. * skk.g;
  float sdep = clamp(vPil.y / slen, 0., 1.);
  float sth = mix(.75, .2, sqrt(sdep));
  float strk = smoothstep(.22, .78, smoothstep(sth - .34, sth + .3, skk.r * (.72 + .56 * smB) + rag * .6)) * smoothstep(.4, 4., vPil.y) * (1. - smoothstep(.72, 1., sdep)) * steepK * openK * cov.w;          // cov.w: the shared streak table lies on this pillar
  sM = min(sM, mix(1., sB, strk * (.86 + .12 * uPil.x)));
#ifdef PIL_BORN
  // M4 W5: BORN STREAKS (the great pillar's haul face): black water born at a ledge, a cell's sill, the cave's ledge or under the brow,
  // 15 to 80 m long, in strands of half a metre and more, strongest in its first third; a lime run beside some; white droppings
  // under the nests; soot over a chimney hole. uBorn: z, depth of the birth below the top, length, half-width; uBornK: water, pale,
  // dry dark, taper.
  { float bW = 0., bT = 0., bP = 0., bS = 0.;
    for (int i = 0; i < 24; i++) {
      vec4 A = uBorn[i], B = uBornK[i];
      float t = (vPil.y - A.y) / max(A.z, 1.), tc = clamp(t, 0., 1.);
      float e = abs(vFoot.y - A.x) / max(A.w * (1. - B.w * tc), .05), ke = 1. - smoothstep(.35, 1., e);
      float k = ke * smoothstep(0., .9, vPil.y - A.y) * (1. - smoothstep(.45, 1., t));
      float thin = 1. - smoothstep(.7, 1.1, 2. * A.w * (1. - B.w * tc));                 // a strand under a metre wide
      bW = max(bW, k * B.x * (1. - thin)); bT = max(bT, k * B.x * thin); bP = max(bP, k * B.y); bS = max(bS, ke * tc * tc * step(t, 1.) * B.z);   // soot rises: strongest at the hole
    }
    float bF = steepK * step(-35., vFoot.x) * (1. - cov.x) * cov.w;   // cov.w: only the pillar whose table this is (a neighbour shares the material)
    bW *= bF * openK * (.55 + .45 * smoothstep(.3, .62, smB)); bT *= bF * openK * (.55 + .45 * smoothstep(.3, .62, smB)); bP *= bF * smoothstep(.34, .62, smB + (nzz.g - .5) * .3); bS *= bF;
    sM = min(sM, min(mix(1., sB, bW * .9), mix(1., .22, bT * .9)));
    cc = mix(cc, min(vec3(.78, .76, .69), c0 * 2.4), bP * .5);
    sM = min(sM, mix(1., .44, bS * .9));
    gTWet = max(gTWet, max(bW, bT) * uPil.x * .8);
  }
#endif
  cc *= sM * mix(vec3(.94, .94, 1.09), vec3(1.), smoothstep(.45, 1., sM));
  // m3b B4: LICHEN in crusts of 0.3 to 1.5 m (lobed blotches of a field of 3 m, in clusters), a grey-green or ochre tint of the rock
  // under it, only where the drift of streaks is low and no streak stands
  float crust = smoothstep(.60, .64, texture2D(tDetail, vv * .33 + vec2(.2, .6)).r) * smoothstep(.5, .62, vary.r) * (1. - smoothstep(.44, .52, drift)) * steepK * congl * (1. - strU) * (1. - strk) * (1. - smoothstep(.04, .12, fp));
  cc = mix(cc, mix(cc * vec3(1.30, 1.38, 1.20) + vec3(.03, .04, .025), cc * vec3(1.22, 1.10, .84), smoothstep(.5, .56, hue.r)), crust * .5);
  float thr = smoothstep(.7, .82, texture2D(tDetail, vec2(sn * uPilK.w, wpp.y * .045 + uPil.z * .22)).r) * strk * uPil.x * (1. - smoothstep(.006, .02, fp));
  cc += vec3(.2, .23, .27) * thr * .12;
  gTWet = max(gTWet, strk * uPil.x);
  // what lies on the top: turf, paving, trodden earth (the vertex colour)
  cc = mix(cc, clamp(vColor.rgb, 0., 1.) * (.82 + .36 * smr.r) * (.86 + .3 * hp), cov.x);
  // snow on what lies level; none on the sheer rock
  float snowK = uPil.y * smoothstep(.5, .78, wnn.y + (smr.r - .5) * .3);
  cc = mix(cc, vec3(.80, .85, .93) * mix(.8, 1., gPilLit), snowK);
  gTSnow = max(gTSnow, snowK * .6);
  gPilM = mix(clamp(sM, .2, 1.), 1., max(cov.x, snowK));
  diffuseColor.rgb = clamp(cc, 0., 1.);
}
`;
function makeRockMat(strata, o) {
  const dry = lin('#857f66'), topC = mix3(dry, [0.8, 0.85, 0.93], 0);
  // the rock's own grain (after the fourth showing, where every viewer called the rock soft at close range): the kit's relief, cracks and
  // bedding stand at 0.6, 0.15 and 0.8 and its fine detail at 0.35 (they stood at 0.1, 0.04, 0 and 0.12); the forms stay sheer and smooth
  const mat = T.makeRockMaterial({ terrain: o.terrain || undefined, strataTable: strata, detailTexture: o.detailTexture, rng: o.rng, strata: 0.45, varnish: 0.06, strataWarp: 0.5, bump: 0.6,
    top: new THREE.Color(topC[0], topC[1], topC[2]), topAmount: 0.8, topSlope: [0.6, 0.86], contact: [1, 0, 0], cracks: 0.15, bedRelief: 0.8, roughness: 0.93, wetRoughness: 0.2, detail: 0.35 });
  const U = { tStreak: { value: o.streakTex }, uPil: { value: new THREE.Vector4(o.wet || 0, o.snow || 0, 0, 1 / o.Lp) }, uPilB: o.bounceU || { value: new THREE.Color(0.164, 0.208, 0.4) },
    uPilK: { value: new THREE.Vector4(Math.round(o.Lp * 0.011), Math.round(o.Lp * 0.09), Math.round(o.Lp * 0.23), Math.round(o.Lp * 0.55)) }, uPilM: { value: new THREE.Vector2(0.3, 0) } };
  if (mat.cellMap) { mat.cellMap.anisotropy = 16; mat.cellMap.needsUpdate = true; }      // ROUND E: the stones' texture filtered along the footprint's long axis (the renderer holds it to its own most); the ground that shares it gains the same
  { const d = mat.cellMap && mat.cellMap.image && mat.cellMap.image.data; if (d) { let m = 0; for (let i = 0; i < d.length; i += 16) m += d[i]; U.uPilM.value.x = m / (d.length / 16) / 255; } }   // the stones' mean height: the far tone is the plain tone
  const kit = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    kit(sh, r); Object.assign(sh.uniforms, U); U.uPilM.value.y = Math.min(16, r && r.capabilities ? r.capabilities.getMaxAnisotropy() : 1);   // ROUND E: the reach of the cell texture's filter, for fp
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aPil; attribute vec4 aCov; attribute vec2 aFoot; attribute vec3 aRel; varying vec4 vPil; varying vec4 vCov; varying vec2 vFoot; varying vec3 vRel;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vPil = aPil; vCov = aCov; vFoot = aFoot; vRel = aRel;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tStreak; uniform vec4 uPil, uPilK; uniform vec3 uPilB; uniform vec2 uPilM;\n#ifdef PIL_BORN\nuniform vec4 uBorn[24]; uniform vec4 uBornK[24];\n#endif\n varying vec4 vPil; varying vec4 vCov; varying vec2 vFoot; varying vec3 vRel; float gPilLit, gPilOcc, gPilM;')
      .replace('#include <alphamap_fragment>', ROCK_FRAG + '\n#include <alphamap_fragment>')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + BOUNCE.replace('PIL_LIT', 'gPilLit *') + ' reflectedLight.directDiffuse *= gPilLit; reflectedLight.directSpecular *= gPilLit; reflectedLight.indirectSpecular *= gPilOcc;' + SHADE_HUE)
      .replace('float sy = wp.y + (tm.r', 'float sy = wp.y - vRel.z + (texture2D(tDetail, vec2(vPil.x * uPil.w * uPilK.x, wp.y * .021)).r - .5) * 1.6 + (tm.r');   // M4 W1: the kit's own ring of beds is read at the bed's own height too (M4b P3: with the same wander as the part's own colours)
  };
  if (o.born) { U.uBorn = { value: o.born.A }; U.uBornK = { value: o.born.K }; mat.defines = Object.assign(mat.defines || {}, { PIL_BORN: '' }); }
  mat.customProgramCacheKey = () => 'net-up-the-pillar-rock-28' + (o.born ? '-born' : '');
  mat.streakMap = o.streakTex;                                                          // a plain property: the engine's disposer finds it
  mat.userData.pil = U.uPil; mat.userData.bounce = U.uPilB; mat.userData.Lp = o.Lp;
  return mat;
}

// Sunlight thrown back into the shade by the lit country round about, so that shade is blue-violet and never black under the brief's
// lights. It scales with the scene's first directional light and adds nothing without one.
// M4 W3: SHADE THAT IS SHADE. The light of the shade (the sky's and the thrown-back sunlight, which the world sets blue-violet) keeps
// its brightness on rock, but .92 of its hue goes to the rock's own colour leaning cool (x .94, .98, 1.08: the rock's own grey, a
// breath cooler). And where the rock FACES the sun, a shade thrown on it keeps half of that light: on a face the sun rakes (the haul
// face: cosine .38) the world's fill stood as bright as the sunlit rock, so the shade read as blue paint of the same brightness.
// Rock that faces away from the sun is as it was.
// M4b P6 and P5: the light that comes in and the rock's colour are held at nought and over; the hue takes no more than twice the
// greatest channel of the light it stands for (a colour near nought with a channel under it made a pixel of thousands: the cyan
// square); the recess shade (.3 + .7 of the baked occlusion) is applied here, and where a streak stands (gPilM under 1) it takes
// the streak no lower than .45 of the shade's light or than the rock beside it would stand, whichever is less. (Addendum 15: the
// recess shade and the half kept by a thrown shade on sun-facing rock together never under .5, nor under .85 where the rock looks
// straight down: the sky's light is halved there already.)
const SHADE_HUE = /* glsl */` { vec3 ind = max(reflectedLight.indirectDiffuse, vec3(0.)); float il = dot(ind, vec3(.2126, .7152, .0722));
  vec3 own = max(diffuseColor.rgb, vec3(0.)) * vec3(.94, .98, 1.08); own *= il / max(dot(own, vec3(.2126, .7152, .0722)), 1e-3);
  own = min(own, vec3(2. * max(ind.r, max(ind.g, ind.b))));
  float pX = .3 + .7 * gPilOcc;
#if NUM_DIR_LIGHTS > 0
  pX *= 1. - .5 * (1. - gPilLit) * smoothstep(0., .3, dot(normal, directionalLights[0].direction));
#endif
  float pF = .5;
#if NUM_HEMI_LIGHTS > 0
  pF += .35 * clamp(-dot(normal, hemisphereLights[0].direction), 0., 1.);
#endif
  pX = max(pX, pF);
  reflectedLight.indirectDiffuse = mix(ind, own, .92) * max(pX, .45 / gPilM);
 }`;
const BOUNCE = /* glsl */`
#if NUM_DIR_LIGHTS > 0
  reflectedLight.indirectDiffuse += diffuseColor.rgb * uPilB * directionalLights[0].color * (RECIPROCAL_PI * (1. - .8 * PIL_LIT smoothstep(-.1, .35, dot(normal, directionalLights[0].direction))));
#endif
`;
function addBounce(m, U, key) {
  const kit = m.onBeforeCompile, k0 = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = (sh, r) => {
    if (kit) kit(sh, r); sh.uniforms.uPilB = U.uPilB;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uPilB;').replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + BOUNCE.replace('PIL_LIT', ''));
  };
  m.customProgramCacheKey = () => k0 + key;
  return m;
}
const drain = (it) => { let r; while (!(r = it.next()).done); return r.value; };

// ---------- M3 R3: HOLLOWS stand in bands along a bed: shallow scoops (deepest under their upper lip) and cave mouths (flat floor,
// arched roof, dark inside by the baked occlusion). o: { bands, min, most, caves, y0, y1, avoid [[ya, yb]], fine, free(s, half, y, h) }.
// Sets sh.hollowAt (the surface stands back by it) and sh.caveAt; returns { bands, rows, colsAt(y, base), count, caves }.
const ringGap = (d, L) => { d = Math.abs(d) % L; return Math.min(d, L - d); };
function makeHollows(sh, r, o) {
  const Lp = sh.Lp, bands = [], rowMap = new Map(); let caves = o.caves, total = 0, nCaves = 0;
  const blocked = (y, h) => sh.levels.some((lv) => y + h / 2 > lv.L - lv.b.tb - lv.b.hb - 1.5 && y - h / 2 < lv.L + 4) || (o.avoid || []).some((q) => y + h / 2 > q[0] - 2 && y - h / 2 < q[1] + 2) || bands.some((b) => Math.abs(b.y - y) < (b.h + h) / 2 + 10);
  for (let tries = 0; bands.length < o.bands && tries < 240 && o.y1 - o.y0 > 12; tries++) {
    const h = r.range(6, 10), y = r.range(o.y0 + h / 2, o.y1 - h / 2); if (blocked(y, h)) continue;
    const band = { y, h, list: [] }, left = o.bands - bands.length, nc = caves > 0 ? (caves >= left ? Math.ceil(caves / left) : r.chance(caves / left) ? 1 : 0) : 0, want = Math.min(r.int(o.min || 2, 5), (o.most || 14) - total);
    for (let t2 = 0; band.list.length < want + nc && t2 < 90; t2++) {
      const cave = band.list.length < nc, a = cave ? r.range(2, 4) : r.range(1.5, 5), sc = r.range(0, Lp);
      if (!o.free(sc, a + 2.5, y, h) || band.list.some((q) => ringGap(q.s - sc, Lp) < q.a + a + 3)) continue;
      const b = cave ? h / 2 : Math.min(h / 2, r.range(0.6, 1) * Math.max(a, 2)), dy = cave ? 0 : r.range(-1, 1) * Math.min(h / 4, h / 2 - b);
      band.list.push({ s: sc, a, b, dy, d: cave ? a * r.range(0.8, 1.1) : a * r.range(0.25, 0.4), cave });
    }
    if (!band.list.length) continue;
    for (const q of band.list) { if (q.cave) { nCaves++; caves--; } else total++; }
    band.rows = (o.fine ? [-1, -0.85, -0.35, 0.25, 0.7, 1] : [-1, -0.8, 0, 0.7, 1]).map((f) => y + f * h / 2);
    band.marks = []; for (const q of band.list) for (const e of o.fine ? (q.cave ? [-1, -0.85, -0.4, 0, 0.4, 0.85, 1] : [-1, -0.6, -0.2, 0.2, 0.6, 1]) : [-1, -0.6, 0, 0.6, 1]) band.marks.push((((q.s + e * q.a) % Lp) + Lp) % Lp);
    for (const yr of band.rows) rowMap.set(yr, band);
    bands.push(band);
  }
  const shapeAt = (b, q, s, y) => {
    const ds = ringGap(s - q.s, Lp); if (ds >= q.a) return 0; const yy = (y - b.y - q.dy) / q.b; if (yy <= -1 || yy >= 1) return 0; const qx = ds / (q.cave && yy > 0 ? q.a * Math.sqrt(1 - 0.8 * yy * yy) : q.a); if (qx >= 1) return 0;   // a cave's mouth is arched
    return q.cave ? Math.sqrt(Math.sqrt(1 - qx * qx)) * (yy < -0.85 ? (yy + 1) / 0.15 : Math.sqrt(Math.max(0, 1 - ((yy + 0.85) / 1.85) ** 2))) : Math.sqrt(1 - qx * qx) * (1 - yy * yy) * (1 + 0.6 * yy) / 1.09;
  };
  const prev = sh.hollowAt;
  sh.hollowAt = (s, y, wx) => { const g0 = prev ? prev(s, y, wx) : 0; let g = 0; for (const b of bands) { if (Math.abs(y - b.y) >= b.h / 2) continue; for (const q of b.list) { const v = q.d * shapeAt(b, q, s, y); if (v > g) g = v; } } return g0 + g; };
  const prevS = sh.scoopAt;
  sh.scoopAt = (s, y) => { let g = prevS ? prevS(s, y) : 0; for (const b of bands) { if (Math.abs(y - b.y) >= b.h / 2) continue; for (const q of b.list) { const v = shapeAt(b, q, s, y); if (v > g) g = v; } } return g; };
  sh.caveAt = (s, y) => { let g = 0; for (const b of bands) { if (Math.abs(y - b.y) >= b.h / 2) continue; for (const q of b.list) if (q.cave) g = Math.max(g, Math.min(1, 1.4 * shapeAt(b, q, s, y))); } return g; };
  // the columns of a band's rows: the base columns and each hollow's own (base columns nearer than 0.7 m to one of them give way)
  const cache = new Map();
  const colsAt = (y, base, s0 = 0, span = Lp) => {
    const band = rowMap.get(y); if (!band) return base; let c = cache.get(y); if (c) return c;
    const mk = band.marks.map((v) => (v < s0 ? v + Lp : v)).filter((v) => v > base[0] + 0.7 && v < base[0] + span - 0.7).sort((p, q) => p - q).filter((v, i, a) => i === 0 || v - a[i - 1] > 0.5);
    c = base.filter((v, i) => i === 0 || !mk.some((m) => Math.abs(m - v) < 0.7)).concat(mk).sort((p, q) => p - q); cache.set(y, c); return c;
  };
  return { bands, rows: bands.flatMap((b) => b.rows), colsAt, count: total, caves: nCaves };
}

// ---------- M3 R3: what grows and lies on a rock, gathered into the pillar's own mesh ----------
// cover 1 = the vertex colour shows (leaves, wood, a dry wall); cover 0 = the rock's own stuff (a fallen block).
function makeExtras() {
  const pos = [], nrm = [], col = [], cov = [], ao = [], idx = [];
  const v = (x, y, z, nx, ny, nz, c, k, cv, a) => { pos.push(x, y, z); nrm.push(nx, ny, nz); col.push(c[0] * k, c[1] * k, c[2] * k); cov.push(cv); ao.push(a); return pos.length / 3 - 1; };
  const X = { pos, nrm, col, cov, ao, idx,
    // a lump: a top and two rings of five; ax = its width's direction in plan [x, z], radii rx (along ax), ry (up), rz (across)
    blob(c, ax, rx, ry, rz, colr, r, cv = 1) {
      const top = v(c[0], c[1] + ry * 0.8, c[2], 0, 1, 0, colr, 1.15, cv, 1), base = pos.length / 3, az = [-ax[1], ax[0]];
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 5; i++) {
        const a = (i + 0.5 * ring + r.range(-0.2, 0.2)) / 5 * TAU, rr = (ring ? 0.8 : 1) * r.range(0.8, 1.15), ca = Math.cos(a) * rr, sa = Math.sin(a) * rr;
        const dx = ax[0] * ca * rx + az[0] * sa * rz, dz = ax[1] * ca * rx + az[1] * sa * rz, dy = (ring ? -0.5 : 0.3) * ry, l = Math.hypot(dx, dy, dz) || 1;
        v(c[0] + dx, c[1] + dy, c[2] + dz, dx / l, dy / l + 0.25, dz / l, colr, ring ? 0.62 : r.range(0.85, 1.05), cv, ring ? 0.6 : 0.9);
      }
      for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; idx.push(top, base + j, base + i, base + i, base + j, base + 5 + i, base + j, base + 5 + j, base + 5 + i); }
    },
    // a flat-sided face a, b (bottom, b to the right seen from outside), c, d (top)
    face(A, B, C, D, colr, k, cv, a0 = 0.7, a1 = 1) {
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = v(A[0], A[1], A[2], nx, ny, nz, colr, k, cv, a0), i1 = v(B[0], B[1], B[2], nx, ny, nz, colr, k, cv, a0), i2 = v(C[0], C[1], C[2], nx, ny, nz, colr, k, cv, a1), i3 = v(D[0], D[1], D[2], nx, ny, nz, colr, k, cv, a1);
      idx.push(i0, i1, i2, i0, i2, i3);
    },
    // a block: four sides and a top, its corners thrown by `jit` (0 = a true box); ang turns its width from +x toward -z
    block(c, ang, w, d, y0, y1, colr, r, cv = 0, jit = 1) {
      const ca = Math.cos(ang), sa = Math.sin(ang), p = [];
      for (let k = 0; k < 8; k++) {
        const up = k & 4, f = up ? 1 - jit * r.range(0.2, 0.55) : 1, lx = (k & 1 ? 0.5 : -0.5) * w * f * (1 + jit * r.range(-0.15, 0.1)), lz = (k & 2 ? 0.5 : -0.5) * d * f * (1 + jit * r.range(-0.15, 0.1));
        p.push([c[0] + lx * ca + lz * sa, up ? y1 - jit * r.range(0, 0.6) * (y1 - c[1]) : y0, c[2] - lx * sa + lz * ca]);
      }
      const k0 = r.range(0.95, 1.2);
      X.face(p[2], p[3], p[7], p[6], colr, k0, cv); X.face(p[1], p[0], p[4], p[5], colr, k0 * 0.95, cv); X.face(p[3], p[1], p[5], p[7], colr, k0 * 1.04, cv); X.face(p[0], p[2], p[6], p[4], colr, k0 * 0.9, cv);
      X.face(p[6], p[7], p[5], p[4], colr, k0 * 1.1, cv, 1, 1);
    },
    // a thin plate from A to B, `w` wide along the plan direction t, facing n (a rail, a rung)
    plate(A, B, t, w, n, colr) {
      const hx = t[0] * w / 2, hz = t[1] * w / 2, a = [A[0] - hx, A[1], A[2] - hz], b = [A[0] + hx, A[1], A[2] + hz], c = [B[0] + hx, B[1], B[2] + hz], d = [B[0] - hx, B[1], B[2] - hz];
      const gx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), gz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      if (gx * n[0] + gz * n[1] >= 0) X.face(a, b, c, d, colr, 1, 1, 1, 1); else X.face(b, a, d, c, colr, 1, 1, 1, 1);
    },
  };
  return X;
}
// add the extras to a lofted mesh (before the bake)
function appendExtras(M, X) {
  const nx = X.pos.length / 3; if (!nx) return M;
  const nv = M.nv + nx, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), sv = new Float32Array(nv), kind = new Uint8Array(nv), idx = new Uint32Array(M.idx.length + X.idx.length);
  pos.set(M.pos.subarray(0, M.nv * 3)); nrm.set(M.nrm.subarray(0, M.nv * 3)); sv.set(M.sv.subarray(0, M.nv)); kind.set(M.kind.subarray(0, M.nv)); pos.set(X.pos, M.nv * 3); nrm.set(X.nrm, M.nv * 3);
  for (let i = 0; i < nx; i++) { kind[M.nv + i] = 2; const a = (M.nv + i) * 3, l = Math.hypot(nrm[a], nrm[a + 1], nrm[a + 2]) || 1; nrm[a] /= l; nrm[a + 1] /= l; nrm[a + 2] /= l; }
  idx.set(M.idx); for (let i = 0; i < X.idx.length; i++) idx[M.idx.length + i] = X.idx[i] + M.nv;
  return Object.assign({}, M, { pos, nrm, sv, kind, idx, nv, x0: M.nv, xcol: X.col, xcov: X.cov, xao: X.ao, rockTris: M.idx.length / 3 });
}
// Dress a rock: dark bushes and a few small trees on the true ledges, bushes in the deep clefts, scrub and ivy at the foot, fallen blocks
// round it (each footed far under the ground), a hermit's dry wall and ladder at a cave. o: { r, rock, groundY, free(s), clefts
// [{ s, ya, yb, w }], blocks [a, b], scrub [a, b], hermit { band, q }, size }.
function dressRock(sh, X, o) {
  const P = sh.P, Lp = sh.Lp, r = o.r, a3 = [0, 0, 0], b3 = [0, 0, 0], free = o.free || (() => true), k = o.size || 1;
  const leaf = [[0.06, 0.1, 0.04], [0.085, 0.115, 0.045], [0.1, 0.105, 0.05]], wood = [0.13, 0.09, 0.06];
  const tan = (s, y) => { sh.point(s - 0.7, y, a3); sh.point(s + 0.7, y, b3); const tx = b3[0] - a3[0], tz = b3[2] - a3[2], l = Math.hypot(tx, tz) || 1; return [tx / l, tz / l]; };
  const gy = (x, z) => (o.ground ? o.ground(x, z) : o.groundY), gs = (s) => { if (!o.ground) return o.groundY; sh.point(s, o.groundY, a3); return o.ground(a3[0], a3[2]); };
  const bush = (c, t, rad, rz) => X.blob(c, t, rad * r.range(0.9, 1.3), rad * r.range(0.7, 1), rz, leaf[r.int(0, 2)], r);
  const tree = (c, t, h) => { const tk = h * r.range(0.4, 0.55), cr = h * r.range(0.28, 0.36); X.block(c, r.range(0, TAU), 0.3, 0.3, c[1] - 0.6, c[1] + tk, wood, r, 1, 0); X.blob([c[0], c[1] + tk + 0.35 * (h - tk), c[2]], t, cr, 0.65 * (h - tk), cr, leaf[r.int(0, 1)], r); };
  let nb = 0;
  if (o.ledges !== false) for (const lv of sh.levels) {
    if (lv.b.duty) continue;
    for (let s = r.range(0, 8); s < Lp && nb < (o.bushes || 40); s += r.range(7, 15)) {
      const w = ringAt(lv.T, s / Lp); if (w < 0.7 || !free(s, lv.L)) continue; nb++;
      const t = tan(s, lv.L - 0.3); sh.point(s, lv.L - 0.3, a3); const n = [t[1], -t[0]], inn = Math.min(0.5 * w, w - 0.3), c = [a3[0] - n[0] * inn, lv.L, a3[2] - n[1] * inn];
      if (r.chance(1 / 6)) tree(c, t, r.range(3, 5)); else { const rad = r.range(0.5, 1.2); bush([c[0], c[1] + rad * 0.4, c[2]], t, rad, Math.min(rad, 0.5 * w + 0.35)); }
    }
  }
  for (const c of o.clefts || []) for (let i = 0, n = r.int(2, 5); i < n && c.yb - c.ya > 30; i++) {
    const y = r.range(c.ya + 10, c.yb - 10), cs = c.sAt ? c.sAt(y) : c.s, t = tan(cs, y), n2 = [t[1], -t[0]], rad = Math.min(c.w * 0.4, r.range(0.8, 1.6)); sh.point(cs, y, a3);
    bush([a3[0] + n2[0] * 0.7, y, a3[2] + n2[1] * 0.7], t, rad, rad);
  }
  for (let i = 0, n = r.int(o.scrub[0], o.scrub[1]); i < n; i++) {
    const s = r.range(0, Lp), y = gs(s) + r.range(-0.5, 2.5), ivy = r.chance(0.35), ry = r.range(1.5, 3) * k, rad = r.range(1.2, 2.4) * Math.max(0.6, k); if (!free(s, y)) continue;
    const t = tan(s, y), n2 = [t[1], -t[0]]; sh.point(s, y, a3);
    if (ivy) X.blob([a3[0] + n2[0] * 0.15, y + ry * 0.3, a3[2] + n2[1] * 0.15], t, r.range(2.5, 5) * k, ry, 0.6, leaf[0], r); else bush([a3[0] + n2[0] * 0.6, y + 0.4, a3[2] + n2[1] * 0.6], t, rad, rad * 0.8);
  }
  for (let i = 0, n = r.int(o.blocks[0], o.blocks[1]); i < n; i++) {
    const s = r.range(0, Lp), dist = r.range(1, 10) * k, size = r.range(2, 7) * k, dd = size * r.range(0.6, 1), hk = r.range(0.25, 0.5), ang = r.range(0, TAU); if (!free(s, o.groundY)) continue;
    const g0 = gs(s), t = tan(s, g0), n2 = [t[1], -t[0]]; sh.point(s, g0, a3);
    const bx = a3[0] + n2[0] * (dist + size / 2), bz = a3[2] + n2[1] * (dist + size / 2), g1 = gy(bx, bz);
    X.block([bx, g1, bz], ang, size, dd, Math.min(P.skirtY, g1 - size) - 2, g1 + size * hk, o.rock, r, 0, 1);
  }
  if (o.hermit) {                                                                          // the hermit's shelf: a dry wall across the cave's mouth, a ladder beside it
    const { band, q } = o.hermit, yf = band.y - band.h / 2 * 0.85; sh.point(q.s - q.a - 0.4, yf, a3); sh.point(q.s + q.a + 0.4, yf, b3);
    const tx = b3[0] - a3[0], tz = b3[2] - a3[2], l = Math.hypot(tx, tz) || 1, t = [tx / l, tz / l], n2 = [t[1], -t[0]], len = l * 0.68;
    X.block([a3[0] + t[0] * (len / 2 + 0.2) - n2[0] * 0.25, yf + 0.5, a3[2] + t[1] * (len / 2 + 0.2) - n2[1] * 0.25], Math.atan2(-t[1], t[0]), len, 0.5, yf - 0.4, yf + 1.1, [0.36, 0.33, 0.27], r, 1, 0.25);
    const sl = q.s + q.a + 0.9, ll = r.range(6, 12), nseg = Math.ceil(ll / 2), pts = [];
    for (let i = 0; i <= nseg; i++) { const y = yf + 0.7 - ll * i / nseg; sh.point(sl, y, a3); pts.push([a3[0] + n2[0] * 0.3, y, a3[2] + n2[1] * 0.3]); }
    for (let i = 0; i < nseg; i++) {
      const A = pts[i], B = pts[i + 1];
      for (const e of [-0.26, 0.26]) X.plate([A[0] + t[0] * e, A[1], A[2] + t[1] * e], [B[0] + t[0] * e, B[1], B[2] + t[1] * e], t, 0.12, n2, wood);
      for (let j = 0; j < 4; j++) { const f = (j + 0.5) / 4, c = [lerp(A[0], B[0], f), lerp(A[1], B[1], f), lerp(A[2], B[2], f)]; X.plate([c[0], c[1] - 0.04, c[2]], [c[0], c[1] + 0.04, c[2]], t, 0.52, n2, wood); }
    }
  }
}
const PALETTE = ['#8E8478', '#B98A4A', '#D9A62E', '#A8472F', '#5F93CF', '#3E4660', '#D8C7A4'];
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// The neighbours' column: see the header. The steps are a generator so that the async form can hand frames back.
function* pillarSteps(ctx, spec) {
  const core = ctx.core, name = spec.name || 'pillar', rng = core.makeRng(core.hashSeed(name + ':' + ctx.seed)), noise = core.makeNoise(core.hashSeed(name + ':noise:' + ctx.seed));
  const kind = spec.shape || 'column', w = spec.width || 60, d = spec.depth || w * (kind === 'square' ? 1 : rng.range(0.86, 1.16));
  const footY = spec.footY ?? 0, topY = spec.topY ?? 100, skirtY = footY - (spec.skirt ?? 10);
  const P = { cx: spec.x || 0, cz: spec.z || 0, a: w / 2, b: d / 2, n: kind === 'square' ? 9 : kind === 'obelisk' ? 6 : rng.range(2.6, 4.2), footY, topY, skirtY, kind, haul: false, rng, noise,
    built: !!spec.built, topWidth: spec.topWidth || 0, lobe: kind === 'square' ? 0.015 : 0.07, waist: clamp(w / 40, 0.3, 2.5) * (kind === 'square' ? 0.25 : 1), flare: clamp(w * 0.25, 3, 16), ledge: clamp(w / 100, 0.45, 1),
    rngLobes: core.makeRng(core.hashSeed(name + ':lobes:' + ctx.seed)), rngLean: core.makeRng(core.hashSeed(name + ':lean:' + ctx.seed)),
    rngButtress: core.makeRng(core.hashSeed(name + ':buttress:' + ctx.seed)), rngAprons: core.makeRng(core.hashSeed(name + ':aprons:' + ctx.seed)), rngRuns: core.makeRng(core.hashSeed(name + ':ledge-runs:' + ctx.seed)) };
  const sh = makeShape(P); yield* sh.fillG();
  const fixed = spec.beds ? spec.beds.map((b) => b.y).filter((y) => y < topY - 6 && y > skirtY) : [];
  const beds = makeBeds(rng, skirtY, topY, fixed, true);
  for (const b of beds) if (!b.duty) { b.step = 0; b.w = Math.max(b.w, 0.8); }                // M3: few ledges, each a true one at one height
  if (spec.beds) for (const b of beds) { const h = spec.beds.find((q) => q.y === b.y); if (h) { b.tb = h.tb ?? b.tb; b.duty = false; b.w = 0.8; } }   // a shared bed makes ledges here too
  addBeds(sh, beds);
  // M3: seen close (within 330 m of the haul line's plumb at x 17, z 2.7, or spec.near) a pillar takes the finer mesh and the larger budget
  const near = spec.near ?? Math.hypot((spec.x || 0) - 17, (spec.z || 0) - 2.7) < 330, lob = sh.lob, Lp = sh.Lp, large = w >= 40 && sh.H >= 60, groundY = spec.groundY ?? footY + 3;
  // hollows: bands of scoops and cave mouths, clear of the creases, of the ledges and of a dying lobe's cap
  const rh = core.makeRng(core.hashSeed(name + ':hollows:' + ctx.seed)), dl = lob.dying >= 0 ? lob.lobes[lob.dying] : null;
  const nCave = large ? rh.int(1, 3) : w >= 24 && sh.H > 40 && rh.chance(0.4) ? 1 : 0;
  const hol = makeHollows(sh, rh, { bands: large ? (near ? 3 : 2) : nCave, min: large ? 3 : 1, most: large ? 14 : 2, caves: nCave, y0: groundY + 8, y1: topY - 16, avoid: dl ? [[dl.yd, dl.yd + dl.cap]] : [], fine: near,
    free: (sc, half) => lob.creases.every((c) => ringGap(c.u * Lp - sc, Lp) > half + 1.4 * c.wA * Lp + (c.deep ? c.deep.w * 0.5 : 0)) });
  // columns: one every 9 m of girth (near: 6 m), and one in every crease, on every lobe's middle, across every deep cleft
  const nc = spec.columns || (near ? clamp(Math.round(Lp / 6), 24, 44) : clamp(Math.round(Lp / 9), 20, 32)), sep = near ? 1.6 : 2.4;
  const colCache = new Map();
  const colsOf = (y) => {                                                                   // the creases wander: each ring has its own columns
    let c = colCache.get(y); if (c) return c;
    const mk = lob.marks(Lp, near, y).map((v) => ((v % Lp) + Lp) % Lp).sort((a, b) => a - b).filter((v, i, a) => v > 1.2 && v < Lp - 1.2 && (i === 0 || v - a[i - 1] > 1.2));
    c = [0]; for (let i = 1; i < nc; i++) { const v = Lp * i / nc; if (!mk.some((m) => Math.abs(m - v) < sep)) c.push(v); }
    for (const m of mk) c.push(m); c.sort((a, b) => a - b); c = hol.colsAt(y, c); colCache.set(y, c); return c;
  };
  const cols = colsOf((footY + topY) / 2);
  // rows: a level ring at most every 9 m (near: 6 m), closer where the rock tapers fast; the gap widens until the mesh is within its budget
  const feat = featureRows(sh, skirtY, topY, { under: !!spec.overhangs, lean: true, fewShoulder: !near }).concat(lob.rows(), hol.rows).filter((y) => y >= skirtY && y <= topY).sort((a, b) => a - b);
  const budget = spec.triangles || (near ? 7400 : 3800); let rows, gap0 = near ? 6 : 9;
  for (;;) {
    const taperGap = (y) => { const t = clamp((y - footY) / sh.H, 0.01, 0.99), k = Math.abs(sh.tp(t + 0.01) - sh.tp(t - 0.01)) / 0.02; return clamp(0.06 * sh.H / Math.max(k, 1e-3), 1.5, gap0); };
    rows = fillRows(feat, taperGap); if (2 * rows.length * cols.length <= budget || gap0 >= (near ? 14 : 20)) break; gap0 += 1;
  }
  let M = yield* loftSteps(sh, [{ rows, cols: colsOf }], { capColumns: Math.min(nc, 24), capRings: [0.9, 0.5] });
  let material = spec.material;
  if (!material) {
    const strata = makeBedTable(beds, rng, PALETTE), streaks = [];
    for (let i = 0; i < 6; i++) streaks.push({ s: rng() * sh.Lp, w: rng.range(3, 6), len: rng(), a: rng.range(0.6, 1) });
    material = makeRockMat(strata, { rng, streakTex: makeStreakTexture(streaks, sh.Lp, rng), Lp: sh.Lp });
    material.userData.rockMean = [strata.meanColor.r, strata.meanColor.g, strata.meanColor.b];
  }
  const LpRef = material.userData.Lp || sh.Lp, sScale = Math.max(1, Math.round(sh.Lp / LpRef)) * LpRef / sh.Lp;       // the ring is a whole number of turns of the shared patterns
  const rockMean = material.userData.rockMean || lin(PALETTE[0]);
  // what grows and lies on it (its own stream), and the hermit's shelf (spec.hermit, or three large pillars in ten by their stream)
  const X = makeExtras(), hb = hol.bands.slice().sort((p, q) => p.y - q.y).find((b) => b.list.some((q) => q.cave));
  const hermit = (spec.hermit ?? (large && core.makeRng(core.hashSeed(name + ':hermit:' + ctx.seed)).chance(0.3))) && hb ? { band: hb, q: hb.list.find((q) => q.cave) } : null;
  dressRock(sh, X, { r: core.makeRng(core.hashSeed(name + ':growth:' + ctx.seed)), rock: mul3(rockMean, 0.92), groundY, ground: typeof spec.ground === 'function' ? spec.ground : null, size: clamp(sh.H / 60, 0.4, 1), hermit,
    clefts: lob.creases.filter((c) => c.deep).map((c) => ({ s: c.u * Lp, sAt: (y) => lob.uAt(c, y) * Lp, ya: c.deep.ya, yb: c.deep.yb, w: c.deep.w })), blocks: near ? [8, 14] : [5, 9], scrub: near ? [12, 16] : [8, 12], bushes: near ? 40 : 18 });
  yield;
  M = appendExtras(M, X);
  const geometry = yield* bakeSteps(sh, M, { sun: unit(spec.sunDir || material.userData.sun || [0.38, 0.44, 0.82]), rock: rockMean, sOff: rng.int(0, 7) * LpRef / 8, sScale,
    streakTable: spec.streaks ?? (spec.material ? 0 : 1), grass: mix3(rockMean, lin('#7c7a48'), 0.6), facing: 0.94 });
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'pillar:' + name; mesh.castShadow = mesh.receiveShadow = true;
  const o2 = [0, 0, 0];
  // the top's plan, and with it the LIP: where a wall standing on this top is footed so that it stands flush on the face (the rim lies a
  // rounded shoulder further in). outline.lip[i] = [x, z] on the face, outline.drop[i] = how far under topY the rock is met there.
  const outline = M.rimOutline, lip = [], drop = []; let shoulder = 0;
  for (let i = 0; i < outline.length; i++) {
    const u = M.rimS[i] / sh.Lp, R = sh.flatTop ? sh.shoulderR(u) : 0, dy = 0.4 * R; sh.point(M.rimS[i], topY - dy, o2);
    lip.push(R > 0 ? [o2[0], o2[2]] : outline[i]); drop.push(dy); shoulder += R / outline.length;
  }
  // outline.over[i]: how deep in the rock a plumb line hung 3 m outside lip point i comes on its way down to three tenths of the height (m; under 0 = it hangs free)
  const over = [], mx = lip.reduce((a, p) => a + p[0], 0) / lip.length, mz = lip.reduce((a, p) => a + p[1], 0) / lip.length;
  for (let i = 0; i < lip.length; i++) { const dx = lip[i][0] - mx, dz = lip[i][1] - mz, l = Math.hypot(dx, dz) || 1, px = lip[i][0] + dx / l * 3, pz = lip[i][1] + dz / l * 3; let m = -1e9; for (let y = topY - 6; y > footY + 0.3 * sh.H; y -= 8) m = Math.max(m, sh.depthAt(px, y, pz)); over.push(m); }
  yield;
  outline.lip = lip; outline.drop = drop; outline.shoulder = shoulder; outline.topY = topY; outline.over = over;
  return { mesh, geometry, material, topY, outline, lip, shoulder, beds, near, hermit: !!hermit, hollows: hol.count, caves: hol.caves, lobes: lob.n, secondSummit: dl ? dl.yd + dl.cap : null, rockTriangles: M.rockTris ?? M.idx.length / 3,
    radiusAt(y) { sh.point(0, y, o2); const ax = [0, 0]; sh.axis(clamp((y - footY) / sh.H, 0, 1), ax); return Math.hypot(o2[0] - P.cx - ax[0], o2[2] - P.cz - ax[1]); } };
}
export function makePillar(ctx, spec = {}) { return drain(pillarSteps(ctx, spec)); }
export async function makePillarAsync(ctx, spec = {}) { const it = pillarSteps(ctx, spec); let r; while (!(r = it.next()).done) await ctx.yield(); return r.value; }

// ---------- m3b B1: THE HAUL FACE TAKES RELIEF. Everything here only stands BACK from the surface as it was (so no clear number can
// shrink) and is nothing within 3 m of an anchor (full 4 m further out; nothing under y -8 or over 206, nor beyond z -58 and 53).
// BEDS step: every bed plane (the partings, and minor planes inside the massive beds) may carry a true ledge or an undercut of 0.3 to
// 1.2 m in broken runs; BANDS of scoops and honeycomb alcoves hang under a bed plane; two flat-backed CLEFTS run most of the height
// beside the haul line; the face is slightly WAISTED. Streams of its own: haul-beds, haul-scoops, haul-clefts, haul-waist.
// Returns { at(z, y) -> [standing back, shelter, pits, shade], rows, colsAt(y), levelCap(z, y), cuts, bands, clefts, mask, stepAt }.
async function makeHaulRelief(sh, st, noise, line, tick) {
  const rb = st('haul-beds'), rs = st('haul-scoops'), rc = st('haul-clefts'), rw = st('haul-waist'), levels = sh.levels;
  const rd = st('haul-dip'), ry = st('haul-bays'), rh = st('hermitage');                    // M4: streams of their own
  // the anchors' boxes [z0, z1, y0, y1]: the ways' strip, the cave's mouth, the ledge of cloths, the lower ledge, the cave's ladders, the niche, the fig
  const BOX = [[-47, -41, FOOT, 215], [-26.6, -17.4, 44, 50.5], [-34, -10, 42.6, 44.3], [-33, -11, 22.6, 24.3], [-21.4, -19.6, 24, 44.6], [-10, -7, 53.4, 58], [-32.4, -29.6, 64.8, 68.2]];
  const mask = (z, y) => {
    let m = sstep(-8, -2, y) * (1 - sstep(199, 206, y)) * sstep(-58, -52, z) * (1 - sstep(47, 53, z)); if (m <= 0) return 0;
    for (const q of BOX) { const dz = Math.max(q[0] - z, z - q[1], 0), dy = Math.max(q[2] - y, y - q[3], 0); if (dz < 7 && dy < 7) { m *= sstep(3, 7, Math.hypot(dz, dy)); if (m <= 0) return 0; } }
    return m;
  };
  // bed planes: the partings and, inside a massive bed over 13 m, minor planes; none steps beside a standing hard bed's ledge
  const Y0 = -8, Y1 = 206, nearLedge = (y) => levels.some((lv) => y > lv.L - lv.b.tb - lv.b.hb - 1 && y < lv.L + 2.5), planes = [];
  { const ps = sh.beds.partings.filter((p) => p > Y0 - 40 && p < Y1 + 40); let a = Y0 - 40;
    for (let i = 0; i <= ps.length; i++) {
      const b = i < ps.length ? ps[i] : Y1 + 40;
      if (b - a > 13) { let y = a + rb.range(6, 12); while (y < b - 5) { planes.push(y); y += rb.range(7, 13); } }
      if (i < ps.length) planes.push(b); a = b;
    } }
  const cuts = planes.filter((y) => y > -2 && y < 199 && !nearLedge(y));          // no plane steps where the relief fades out (under -2, over 199)
  // each bed between two cuts: recessed or proud; a recessed bed stands back in broken runs along the face (a table over z, 0.5 m)
  const NZ = 232, ZA = -60, beds = [];
  const runs = (lo, hi) => {
    const T = new Float32Array(NZ); let z = ZA - rb.range(0, hi);
    while (z < ZA + NZ * 0.5) {
      const len = rb.range(lo, hi), k0 = Math.round((z - ZA) * 2), k1 = Math.round((z + len - ZA) * 2), wob = rb.range(0.7, 1);
      for (let k = Math.max(0, k0); k <= Math.min(NZ - 1, k1); k++) T[k] = wob * sstep(0, 3, Math.min(k - k0, k1 - k) * 0.5);
      z += len + rb.range(6, 28);
    }
    return T;
  };
  for (let j = 0; j <= cuts.length; j++) {
    const y0 = j ? cuts[j - 1] : Y0, y1 = j < cuts.length ? cuts[j] : Y1, thin = y1 - y0 < 8, rec = rb.chance(thin ? 0.55 : 0.5), pv = beds[j - 1];
    let d = thin ? rb.range(0.35, 1.2) : rb.range(0.3, 0.9), T = runs(thin ? 18 : 30, thin ? 70 : 90);
    if (rec && pv && pv.d > 0 && Math.abs(pv.d - d) < 0.3) { d = pv.d; T = pv.T; }             // too like the bed under it: one bed
    const ya = Math.max(y0, y1 - 6);
    beds.push({ y0, y1, d: rec ? d : 0, T, ya, ys: Math.max(0.5, y1 - ya) });
  }
  const tz = (T, z) => { const f = clamp((z - ZA) * 2, 0, NZ - 1.001), i = Math.floor(f); return lerp(T[i], T[i + 1], f - i); };
  const bedIx = (y) => { let j = 0; while (j < cuts.length && y >= cuts[j]) j++; return j; };
  // a recessed bed is deepest under the bed over it (its top 6 m deepen from 0.6 to 1): an undercut at its top, a lesser ledge at its foot
  const bedBack = (b, z, y) => (b.d > 0 ? b.d * tz(b.T, z) * lerp(0.6, 1, clamp((y - b.ya) / b.ys, 0, 1)) : 0);
  // BANDS of scoops and honeycomb: each hangs under a cut (its level roof), 25 m apart or more, 4 m clear of a standing ledge
  const bands = [], clearAt = (z0, z1, ya, yb) => { for (let z = z0; z <= z1 + 0.01; z += Math.max(0.25, (z1 - z0) / 4)) for (const y of [ya, (ya + yb) / 2, yb]) if (mask(z, y) < 1) return false; return true; };
  { const cand = cuts.filter((p) => p > 17 && p < 190);
    for (let tries = 0, want = rs.int(2, 3); bands.length < want && tries < 90 && cand.length; tries++) {
      const p = cand[rs.int(0, cand.length - 1)], h = rs.range(3.5, 5);
      if (bands.some((q) => Math.abs(q.p - p) < 25) || levels.some((lv) => p > lv.L - lv.b.tb - lv.b.hb - 4 && p - h < lv.L + 4)) continue;
      const band = { p, h, list: [], honey: [] };
      for (let c = 0, nc = rs.int(1, 2), t2 = 0; c < nc && t2 < 40; t2++) {                 // honeycomb: a row of alcoves under the roof, smaller ones in a second tier
        const n = rs.int(4, 7), cells = [], z0 = rs.range(-50, 38); let z = z0;
        for (let i = 0; i < n; i++) {
          const a = rs.range(0.5, 0.9), hh = rs.range(1, 1.8), d = rs.range(0.3, 0.6), wall = rs.range(0.2, 0.35), two = rs.chance(0.7), dz = rs.range(-0.3, 0.3), ka = rs.range(0.6, 0.8), kh = rs.range(0.5, 0.7), kd = rs.range(0.6, 0.8);
          z += a; cells.push({ z, a, h: hh, d, top: p }); if (two) cells.push({ z: z + dz, a: a * ka, h: hh * kh, d: d * kd, top: p - 2.1 }); z += a + wall;
        }
        if (!clearAt(z0 - 1, z + 1, p - h, p) || band.honey.some((q) => z0 < q.z1 + 2 && z > q.z0 - 2)) continue;
        band.honey.push({ z0, z1: z, cells }); c++;
      }
      for (let t2 = 0, want2 = rs.int(4, 7); band.list.length < want2 && t2 < 120; t2++) {
        const a = rs.range(1.2, 3.2), zc = rs.range(-50, 45), hh = Math.min(h, rs.range(2, 4.5)), d = Math.min(rs.range(0.5, 1.4), 0.45 * a);
        if (!clearAt(zc - a, zc + a, p - hh, p) || band.list.some((q) => Math.abs(q.z - zc) < q.a + a + 1) || band.honey.some((q) => zc + a > q.z0 - 1 && zc - a < q.z1 + 1)) continue;
        band.list.push({ z: zc, a, h: hh, d });
      }
      if (band.list.length + band.honey.length) bands.push(band);
    } }
  // a scoop (or an alcove) hung under its level roof at `top`: deepest a fifth of the way down, its floor sloping out, its foot rounded
  const hang = (q, top, z, y, alc) => {
    const e = Math.abs(z - q.z) / q.a; if (e >= 1) return 0;
    const pl = Math.sqrt(1 - (alc ? e * e * e * e : e * e)), t = (top - y) / (q.h * (0.35 + 0.65 * pl)); if (t <= 0 || t >= 1) return 0;
    const pr = alc ? (t < 0.15 ? 0.85 + t : Math.sqrt(1 - ((t - 0.15) / 0.85) ** 2)) : (t < 0.2 ? 0.8 + 0.2 * Math.sin(t * 2.5 * Math.PI) : Math.pow(Math.cos((t - 0.2) / 0.8 * Math.PI / 2), 1.2));
    return q.d * (alc ? pl : Math.sqrt(pl)) * pr;
  };
  // CLEFTS: flat-backed, steep-flanked (the outer 0.5 m), wandering and pinching as they climb, dying out over 10 m at both ends
  const clefts = [[-3, 1], [9, 16]].map(([a, b]) => ({ z: rc.range(a, b), hw: rc.range(1.5, 3), D: rc.range(1.2, 2.6), ya: rc.range(-4, 12), yb: rc.range(168, 198), A: rc.range(0.8, 1.6), L: rc.range(50, 90), ph: rc.range(0, TAU), pin: rc.range(0.25, 0.5), pl: rc.range(30, 60), pp: rc.range(0, TAU) }));
  // M4b P3: a cleft's flanks are no ruled lines: its middle sways and steps aside (swayAt), its width swells and shrinks by an eighth
  // in waves of 5.3 m (from the moment the cells are found, as the joints' sway)
  const cleftZ = (c, y) => c.z + c.A * Math.sin(y / c.L * TAU + c.ph) + (sh.sway.on ? swayAt(c.pp * 3 + 1, y) : 0);
  // how far z lies from a cleft's middle, where it can lie within w of it (else a great number): the same numbers as cleftZ gives, sooner
  const cleftE = (c, y, z, w) => { const z0 = c.z + c.A * Math.sin(y / c.L * TAU + c.ph); if (!sh.sway.on) return Math.abs(z - (z0 + 0)); if (Math.abs(z - z0) >= w + SWAY_MAX) return 1e9; return Math.abs(z - (z0 + swayAt(c.pp * 3 + 1, y))); };
  const cleftW = (c, y) => c.hw * (1 - c.pin * (0.5 + 0.5 * Math.sin(y / c.pl * TAU + c.pp))) * (sh.sway.on ? 1 + 0.125 * Math.sin(y * 1.19 + c.pp * 5) * sstep(-12, -2, y) * (1 - sstep(190, 199, y)) : 1);
  const cleftLife = (c, y) => sstep(c.ya, c.ya + 10, y) * (1 - sstep(c.yb - 10, c.yb, y));
  // M4b P3: how far (0..1) a point lies INSIDE an upright joint: a cleft of the relief (whole over its flat back, falling over its
  // flank) or a joint of the shape (whole over its inner three fifths). There no hard bed keeps its lip and no recessed bed its step.
  const cutK = (z, y) => { let k = 0;
    for (const c of clefts) { const life = cleftLife(c, y); if (life <= 0) continue; const w = cleftW(c, y), e = cleftE(c, y, z, w); if (e >= w) continue; const inner = Math.max(0.2, w - 0.5); k = Math.max(k, life * (e < inner ? 1 : (w - e) / (w - inner))); }
    for (const j of sh.joints) { if (y < j.ya - 12 || y > j.yb + 12 || Math.abs(z - sh.jointZ0(j, y)) >= j.w * 0.5 + SWAY_MAX) continue; const q = 1 - Math.abs(z - sh.jointZ(j, y)) / (j.w * 0.5); if (q > 0) k = Math.max(k, Math.min(1, 2.5 * q) * sstep(j.ya - 12, j.ya + 12, y) * (1 - sstep(j.yb - 12, j.yb + 12, y))); }
    return k; };
  // the WAIST: two slow hollows of the whole face
  const W = [{ y: rw.range(70, 140), a: rw.range(0.6, 1.8), up: rw.range(35, 60), dn: rw.range(35, 60) }, { y: rw.range(20, 190), a: rw.range(0.4, 1), up: rw.range(35, 60), dn: rw.range(35, 60) }], wph = rw.range(0, 50);
  const waist = (z, y) => { let g = 0; for (const q of W) { const e = (y - q.y) / (y > q.y ? q.up : q.dn); if (e > -1 && e < 1) g += q.a * 0.5 * (1 + Math.cos(e * Math.PI)); } return g > 0 ? g * (0.8 + 0.2 * noise.n2(z / 60 + wph, y / 120)) : 0; };
  await tick();
  // ---- M4 W4: MID BAYS (stream 'haul-bays'): flat-floored, steep-flanked recesses of the two free fields of the face, each over a
  // height of its own, swaying as it climbs; where two stand side by side the nose between them dies out above a height of its own.
  // They take the greater of themselves and the three old dents (sh.bayAt), so they only stand back.
  const mids = [], mkBay = (z0, z1, a0, a1, y0, y1) => { const d = ry.range(3, 6), a = ry.range(a0, a1); return { z: ry.range(z0, z1), a, d, fw: clamp(d * ry.range(0.75, 1), 3, 4.5), ya: ry.range(y0, y1), yb: ry.range(120, 185), up: ry.range(6, 10), dn: ry.range(10, 18), sw: ry.range(1.5, 3), sl: ry.range(60, 140), ph: ry.range(0, TAU) }; };
  { const two = ry.chance(0.7), b1 = mkBay(12, 18, 6, 9, -5, 30), b2 = mkBay(33, 39, 6, 8.5, -5, 45), b0 = mkBay(18, 32, 8, 11, -5, 30), b3 = mkBay(-27, -18, 6, 9, 72, 95), yn = ry.range(90, 150);
    if (two) { const gap = (b2.z - b2.a) - (b1.z + b1.a); if (gap < 4) { b1.a -= (4 - gap) / 2; b2.a -= (4 - gap) / 2; }
      const za = b1.z + b1.a, zb = b2.z - b2.a, d = 0.7 * Math.min(b1.d, b2.d);
      mids.push(b1, b2, { z: (za + zb) / 2, a: (zb - za) / 2 + 3.2, d, fw: 3, ya: yn, yb: Math.min(b1.yb, b2.yb), up: 8, dn: 12, sw: 0, sl: 100, ph: 0, bridge: true }); }
    else mids.push(b0);
    mids.push(b3); }
  const bayG = (q, z, y) => {
    const life = sstep(q.ya, q.ya + q.dn, y) * (1 - sstep(q.yb - q.up, q.yb, y)); if (life <= 0) return 0;
    const e = Math.abs(z - q.z - q.sw * Math.sin(y / q.sl * TAU + q.ph)) / q.a, f = 1 - q.fw / q.a;
    return e >= 1 ? 0 : q.d * life * (e < f ? 1 : 0.5 * (1 + Math.cos(Math.PI * (e - f) / (1 - f))));
  };
  const midAt = (z, y) => { let g = 0; for (const q of mids) { const v = bayG(q, z, y); if (v > g) g = v; } return g > 0 ? Math.max(0, g - sh.bayAt(z, y)) : 0; };
  // ---- M4 W4: END BAYS: two to four notches round each corner of the face (they stand back along each column's own direction), so
  // that the wall's outline is a broken one. v runs along the perimeter from the bay's a end; none above y 188 nor under y 4.
  const Lp = sh.Lp, ends = [];
  for (const neg of [true, false]) {
    const a = neg ? sh.faceS(-60) - ry.range(12, 16) : sh.faceS(ry.range(44, 47)), b = neg ? sh.faceS(-51.5) : sh.faceS(55) + ry.range(10, 14), fa = neg ? ry.range(6, 8) : 3.5, fb = neg ? 3.5 : ry.range(6, 8), list = [];
    for (let y = ry.range(4, 22), n = 0; n < 4; n++) { const h = ry.range(20, 55), d = ry.range(2, 6), up = ry.range(5, 9), dn = ry.range(8, 14), gap = ry.range(10, 25); if (y + h > 188) break; list.push({ y0: y, y1: y + h, d, up, dn }); y += h + gap; }
    ends.push({ a, len: b - a, fa, fb, list });
  }
  const endAt = (s, y) => {
    if (y < 4 || y > 188) return 0; let g = 0;
    for (const e of ends) {
      let v = s - e.a; v -= Math.floor(v / Lp) * Lp; if (v >= e.len) continue;
      const ps = sstep(0, e.fa, v) * (1 - sstep(e.len - e.fb, e.len, v)); if (ps <= 0) continue;
      for (const q of e.list) if (y > q.y0 && y < q.y1) g = Math.max(g, q.d * ps * sstep(q.y0, q.y0 + q.dn, y) * (1 - sstep(q.y1 - q.up, q.y1, y)));
    }
    return g;
  };
  // ---- M4 W6: THE CELLS of the hermitage (stream 'hermitage'): three or four walled-up cave mouths beside the hermit's own, in the two
  // windows 8 to 32 m to either side of the haul line's plumb, one at least in each third of y 30..135 (the hermit's cave stands in
  // the lowest), each with its floor on a bed plane, 12 m apart or more; none within 7 m of an anchor's box, in a cleft, a chimney,
  // a band of scoops or a standing ledge; none whose balcony of 0.9 m would stand within 9.2 m of the flown line.
  const cells = [], cellAt = (c, z, y) => { const e = (z - c.zc) / c.hw; if (e <= -1 || e >= 1) return 0; const e2 = e * e, t = (y - c.y0) / (c.h * (1 - 0.45 * e2 * e2)); return t <= 0 || t >= 1 ? 0 : c.dep * Math.sqrt(1 - 0.8 * e2) * (1 - 0.3 * t * t); };
  // ---- M4 W1: THE BEDDING DIPS AND STEPS (stream 'haul-dip'). lift(z, q): how far the bed whose own height is q stands above (or
  // below) it at z. Everything that lies on a bed of the haul face is read at the bed's own height q = qOf(z, y): the standing
  // ledges (sh.off), the planes, recessed beds and bands here, the shader's table (the baked shift), and the mesh's rows are lifted
  // with it. Beds nearer than 4.5 m are one GROUP and move as one (flat in q over the group and 0.6 m beyond, so a ring 2 cm from
  // its neighbour stays so); between groups the lift blends, never steeper than 0.3. No lift within 3 m of an anchor's box or a cell
  // (whole at 15 m), over y 199, under y -12, nor at the face's ends.
  const BOXD = BOX.slice();                                                               // (the cells' boxes join it when they are placed)
  const maskD = (z, y) => {
    let m = sstep(-12, -2, y) * (1 - sstep(185, 199, y)) * sstep(-58, -52, z) * (1 - sstep(35, 53, z)); if (m <= 0) return 0;
    for (const q of BOXD) { const dz = Math.max(q[0] - z, z - q[1], 0), dy = Math.max(q[2] - y, y - q[3], 0); if (dz < 15 && dy < 15) { m *= sstep(3, 15, Math.hypot(dz, dy)); if (m <= 0) return 0; } }
    return m;
  };
  const groups = [];
  { const keys = planes.slice(); for (const lv of levels) keys.push(lv.L, lv.L - lv.b.tb); keys.sort((a, b) => a - b);
    for (const y of keys) { if (y < -14 || y > 203) continue; const g = groups[groups.length - 1]; if (g && y - g.hi < 4.5) g.hi = y; else groups.push({ lo: y, hi: y }); }
    const dip0 = rd.sign() * Math.tan(rd.range(1, 2) * DEG), ZP = 5;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i], S = g.S = new Float32Array(NZ), dip = dip0 + Math.tan(rd.range(-0.3, 0.3) * DEG), bps = []; let lvl = rd.range(-0.3, 0.3); const L0 = lvl;
      for (let zb = ZA + rd.range(2, 12); zb < ZA + NZ * 0.5; zb += rd.range(8, 15)) { let dl = rd.sign() * rd.range(0.15, 0.5); const w = rd.range(0.8, 1.6); if (Math.abs(lvl + dl) > 0.6) dl = -dl; lvl += dl; bps.push([zb, dl, w]); }
      for (let k = 0; k < NZ; k++) { const zz = ZA + 0.5 * k; let v = L0 + dip * (zz - ZP); for (const q of bps) v += q[1] * sstep(q[0] - q[2] / 2, q[0] + q[2] / 2, zz); S[k] = clamp(v, -2.4, 2.4); }
      if (i) { const pv = groups[i - 1], lim = 0.2 * (g.lo - pv.hi - 1.2); for (let k = 0; k < NZ; k++) S[k] = clamp(S[k], pv.S[k] - lim, pv.S[k] + lim); }
      g.dip = dip; g.bps = bps;
    }
  }
  await tick();
  const NG = groups.length;
  // ---- M4b P3: NO RULED LINE (stream 'haul-jogs'). Over the dip and its steps every group of beds JOGS: it stands by turns 0.26 to 0.4 m
  // over and under its place, changing over 0.8 to 1.3 m of run every 3 to 15 m (in the middle of each cleft and joint that lives at its
  // height: the bed steps where the joint crosses it; between them evenly, a seventh to either side; 2.4 m clear of a step of the dip, so that
  // the two never undo one another). So no bed's edge, ledge or colour runs level over 15 m. The jogs lie on the ROCK wherever the old
  // lift is not held: nothing within 1.5 m of an old thing's box (whole at 3 m; the two ledge strips are no boxes here: the ledges
  // of the cave jog beyond its mouth and its ladders), nothing within 0.5 m of a cell's box (whole at 2 m), none over y 203 (whole to 200.5), under
  // y -12, nor at the face's ends (z -58 to -54, 49 to 53). On the beds' COLOURS they lie everywhere (jogC: baked with the lift).
  const rj = st('haul-jogs'), BOXJ = [0, 1, 4, 5, 6].map((i) => BOX[i].concat([1.5, 3])); let jogOn = false;
  sh.sway.on = true;                                                                      // (the jogs are set where the joints WILL stand)
  for (const g of groups) {
    const J = g.J = new Float32Array(NZ), ym = (g.lo + g.hi) / 2, fix = [ZA + 1], pts = [], zEnd = ZA + NZ * 0.5 - 1;
    for (const c of clefts) if (cleftLife(c, ym) > 0.5) fix.push(cleftZ(c, ym));
    for (const j of sh.joints) if (ym > j.ya && ym < j.yb) { const zj = sh.jointZ(j, ym); if (zj > ZA + 6 && zj < zEnd - 6 && fix.every((v) => Math.abs(v - zj) > 3)) fix.push(zj); }
    fix.sort((a, b) => a - b); fix.push(zEnd);
    for (let i = 0; i < fix.length - 1; i++) {
      const a = fix[i], gap = fix[i + 1] - a, n = Math.max(0, Math.ceil(gap / 8) - 1), step = gap / (n + 1); if (i) pts.push(a);
      for (let k = 1; k <= n; k++) { let zj = a + step * (k + rj.range(-0.15, 0.15)); for (const q of g.bps) if (Math.abs(zj - q[0]) < 2.4) zj = q[0] + (zj >= q[0] ? 2.4 : -2.4); pts.push(zj); }
    }
    pts.sort((a, b) => a - b);
    // (addendum 15) every block between two jogs is TILTED: over and under its place by turns as before, never nearer to it than
    // 0.26 to 0.32 m (so the edge of a held place is a jog as well), and from there it runs away at 2.5 to 5 degrees (0.42 m at the
    // most), up or down the face's length as its own number says. So no stretch of a bed is level, and a jog is 0.52 m or more.
    const z0 = [ZA], st0 = [], sl = [], wd = []; let sg = rj.sign();
    for (let i = 0; i <= pts.length; i++) {
      const zb = i < pts.length ? pts[i] : zEnd + 1, len = Math.max(1, zb - z0[i]), near = rj.range(0.26, 0.32), rise = Math.min(Math.tan(rj.range(2.5, 5) * DEG) * len, 0.42), out = rj() < 0.5;
      st0.push(sg * (out ? near : near + rise)); sl.push(sg * (out ? 1 : -1) * rise / len); wd.push(rj.range(0.8, 1.3)); z0.push(zb); sg = -sg;
    }
    for (let k = 0; k < NZ; k++) { const zz = ZA + 0.5 * k; let v = st0[0] + sl[0] * (zz - z0[0]); for (let i = 0; i < pts.length; i++) { const t = sstep(pts[i] - wd[i] / 2, pts[i] + wd[i] / 2, zz); if (t > 0) v = lerp(v, st0[i + 1] + sl[i + 1] * (zz - z0[i + 1]), t); } J[k] = v; }
    g.jogs = pts;
  }
  sh.sway.on = false;
  const fadeJ = (z, y) => sstep(-12, -2, y) * (1 - sstep(200.5, 203, y)) * sstep(-58, -54, z) * (1 - sstep(49, 53, z));
  const maskJ = (z, y) => {
    let m = fadeJ(z, y); if (m <= 0) return 0;
    for (const q of BOXJ) { const dz = Math.max(q[0] - z, z - q[1], 0), dy = Math.max(q[2] - y, y - q[3], 0); if (dz < q[5] && dy < q[5]) { m *= sstep(q[4], q[5], Math.hypot(dz, dy)); if (m <= 0) return 0; } }
    return m;
  };
  const lift = (z, q) => {
    if (!NG) return 0; const m = maskD(z, q), mj = jogOn ? maskJ(z, q) : 0; if (m <= 0 && mj <= 0) return 0;
    let i = 0; while (i < NG - 1 && q > groups[i + 1].lo - 0.6) i++;
    const g = groups[i], a = tz(g.S, z); if (i === NG - 1 || q <= g.hi + 0.6) return mj > 0 ? m * a + mj * tz(g.J, z) : m * a;
    const n = groups[i + 1], t = sstep(g.hi + 0.6, n.lo - 0.6, q); return mj > 0 ? m * lerp(a, tz(n.S, z), t) + mj * lerp(tz(g.J, z), tz(n.J, z), t) : m * lerp(a, tz(n.S, z), t);
  };
  // what the beds' colours jog by beyond the rock's own jog at (z, q): the whole jog where the rock's is held
  const jogC = (z, q) => {
    if (!NG || !jogOn) return 0; const f = fadeJ(z, q); if (f <= 0) return 0; const k = f - maskJ(z, q); if (k <= 0) return 0;
    let i = 0; while (i < NG - 1 && q > groups[i + 1].lo - 0.6) i++;
    const g = groups[i]; if (i === NG - 1 || q <= g.hi + 0.6) return k * tz(g.J, z);
    return k * lerp(tz(g.J, z), tz(groups[i + 1].J, z), sstep(g.hi + 0.6, groups[i + 1].lo - 0.6, q));
  };
  const qOf = (z, y) => { const d0 = lift(z, y); if (d0 === 0) return y; let q = y - d0; q = y - lift(z, q); q = y - lift(z, q); return y - lift(z, q); };
  // out: [stands back by (m), shelter, pits, occlusion, inside a cell, y - q]. y: the true height; yq: the bed's own height there (M4)
  const out = [0, 0, 0, 1, 0, 0];
  const core = (z, y, yq) => {
    out[0] = out[1] = out[2] = out[4] = 0; out[3] = 1; out[5] = y - yq; const m = mask(z, y); if (m <= 0) return out;
    const j = bedIx(yq), b = beds[j]; let g = bedBack(b, z, yq), shel = 0, pits = 0, ao = 1, ins = 0;
    if (j < cuts.length && b.d > 0) { const D = b.d * tz(b.T, z) - bedBack(beds[j + 1], z, b.y1); if (D > 0.1) shel = sstep(0.1, 0.3, D) * clamp(1 - (b.y1 - yq) / (1.5 * D), 0, 1); }   // under the bed over it
    if (g > 0) { const ck = cutK(z, y); if (ck > 0) { g *= 1 - ck; shel *= 1 - ck; } }      // M4b P3: no recessed bed inside a joint
    for (const q of bands) {
      if (yq >= q.p || yq < q.p - q.h - 0.6) continue; let v = 0, f = 0;
      for (const s of q.list) { const w = hang(s, q.p, z, yq, false); if (w > v) { v = w; f = w / s.d; } }
      for (const hc of q.honey) {
        if (z < hc.z0 - 1.5 || z > hc.z1 + 1.5) continue; pits = Math.max(pits, sstep(hc.z0 - 1.5, hc.z0, z) * (1 - sstep(hc.z1, hc.z1 + 1.5, z)) * sstep(q.p - q.h - 0.6, q.p - q.h + 0.4, yq));
        for (const s of hc.cells) { const w = hang(s, s.top, z, yq, true); if (w > v) { v = w; f = w / s.d; } }
      }
      if (v > 0) { g += v; shel = Math.max(shel, sstep(0.3, 0.7, f)); ao *= 1 - 0.4 * Math.min(1, v); }
    }
    for (const c of clefts) {
      const life = cleftLife(c, y); if (life <= 0) continue; const w = cleftW(c, y), e = cleftE(c, y, z, w); if (e >= w) continue;
      const inner = Math.max(0.2, w - 0.5), k = e < inner ? 1 - 0.12 * (e / inner) ** 2 : (w - e) / (w - inner); g += c.D * life * k; ao *= 1 - 0.125 * c.D * life * k;
    }
    g += midAt(z, y);                                                                    // M4: the mid bays
    for (const c of cells) { const v = cellAt(c, z, y); if (v > 0) { g += v; ins = sstep(0.4, 2, v); shel = 1; ao *= 1 - 0.45 * ins; } }   // M4: a cell's cave
    ao *= 1 - 0.3 * shel;
    out[0] = m * (g + waist(z, y)); out[1] = m * shel; out[2] = m * pits; out[3] = lerp(1, ao, m); out[4] = m * ins; return out;
  };
  const at = (z, y, yq) => core(z, y, yq === undefined ? qOf(z, y) : yq), atQ = (z, q) => core(z, q + lift(z, q), q);
  // the mesh's share: three rings at each plane that steps (2 cm apart at its proud corner), a ring every 0.75 m in a band; a column
  // AT each of a cleft's four edges; cells of 1 m across a scoop and 0.5 m across a honeycomb
  const rings = [], bandRows = [], stepAt = (p, z) => atQ(z, p + 1e-4)[0] - atQ(z, p - 1e-4)[0];              // over 0: a ledge that wide; under 0: a roof that deep
  await tick();
  for (const p of cuts) {
    let pos = 0, neg = 0; for (let z = -52; z <= 47; z += 1) { const v = stepAt(p, z); if (v > 0) pos += v; else neg -= v; }
    if (pos + neg < 3) continue;
    rings.push([p, neg >= pos]); if ((rings.length & 3) === 3) await tick();
  }
  { const ringP = rings.map((q) => q[0]).sort((p, q) => p - q), WIN = [[-29.3, -5.3], [10.7, 34.7]], TH = [[30, 65], [65, 100], [100, 135]], want = rh.int(3, 4), uOf = (z) => sh.faceS(z) / Lp;
    const free = (zc, hw, p, h) => {
      for (const zz of [zc - hw - 1.5, zc, zc + hw + 1.5]) for (const yy of [p - 2, p + h / 2, p + h + 1.5]) {
        if (mask(zz, yy) < 1) return false;
        if (line && lineDist(line, sh.faceX(zz, yy) + 0.9, yy, zz) < 9.2) return false;
      }
      if (Math.hypot(zc + 22, p - 44) < 14 || Math.abs(p - 44) < 4 || cells.some((c) => Math.hypot(c.zc - zc, c.p - p) < 12 || Math.abs(c.p - p) < 5)) return false;   // at different heights
      for (const c of clefts) if ((cleftLife(c, p) > 0 || cleftLife(c, p + h) > 0) && Math.abs(zc - cleftZ(c, p + h / 2)) < hw + cleftW(c, p + h / 2) + 1.5) return false;
      for (const j of sh.joints) if (p + h > j.ya - 12 && p < j.yb + 12 && Math.abs(zc - sh.jointZ(j, p + h / 2)) < hw + j.w * 0.5 + 1.5) return false;
      for (const q of bands) if (p - 2 < q.p + 0.5 && p + h + 1.5 > q.p - q.h - 0.6) { if (q.list.some((sc) => Math.abs(sc.z - zc) < sc.a + hw + 1) || q.honey.some((hc) => zc + hw > hc.z0 - 1 && zc - hw < hc.z1 + 1)) return false; }
      for (const lv of levels) if (p - 2.5 < lv.L + 0.5 && p + h + 1.5 > lv.L - lv.b.tb - lv.b.hb) for (const zz of [zc - hw, zc, zc + hw]) if (ringAt(lv.T, uOf(zz)) > 0.05) return false;
      return true;
    };
    for (let i = 0; i < want; i++) for (let tries = 0, ok = false; !ok && tries < 150; tries++) {
      if ((tries & 15) === 15) await tick();
      const t3 = rh.int(0, 2), t = i < 4 ? [1, 2, 0, 0][i] : t3, win = WIN[rh.int(0, 1)], hw = rh.range(2, 4), h = rh.range(2.6, 3.6), dep = rh.range(2.2, 3), fz = rh(), fp = rh();   // one in the middle third, one in the top, two in the lowest (where the old cave and its ledges are), then any
      const zc = lerp(win[0] + hw, win[1] - hw, fz), inT = (p) => p >= TH[t][0] && p + h <= TH[t][1], ps = (tries < 60 ? ringP : tries < 110 ? cuts : []).filter(inT);
      const p = ps.length ? ps[Math.min(ps.length - 1, Math.floor(fp * ps.length))] : tries < 110 ? null : Math.round(lerp(TH[t][0], TH[t][1] - h, fp) * 2) / 2;   // a ring's plane; then any stepping plane; then a bedding joint of its own
      if (p === null || !free(zc, hw, p, h)) continue;
      cells.push({ zc, hw, p, y0: p - 0.01, h, dep, third: t }); ok = true;
    }
    for (const c of cells) { c.side = rh.sign(); c.chz = c.zc - c.side * rh.range(0.3, 0.6) * c.hw; c.soot = rh.range(2.5, 4); c.wallIn = rh.range(0.5, 0.7); c.wallK = rh.range(0.75, 0.9); c.top = (z) => { const e = (z - c.zc) / c.hw, e2 = e * e; return c.p + c.h * (1 - 0.45 * e2 * e2); };
      c.own = !ringP.includes(c.p); BOXD.push([c.zc - c.hw - 1, c.zc + c.hw + 1, c.p - 1.5, c.p + c.h + 1]); BOXJ.push([c.zc - c.hw - 1, c.zc + c.hw + 1, c.p - 1.5, c.p + c.h + 1, 0.5, 2]); } }
  jogOn = sh.sway.on = true;                                                                           // M4b P3: the cells are found on the bedding as it was; the jogs lie from here on
  for (const q of bands) { bandRows.push(q.p - 0.02, q.p, q.p + 0.02); if (q.honey.length) bandRows.push(q.p - 2.12, q.p - 2.1); for (let y = q.p - 0.75; y > q.p - q.h - 0.4; y -= 0.75) bandRows.push(y); }
  // lv(y): the mesh's level at that height (0: cells of 0.5 m .. 3: 4 m). Far from the flown line a plane takes two rings and a cleft three columns.
  const cellRow = (y) => cells.some((c) => y > c.p - 0.05 && y < c.p + c.h + 0.65 && (c.own || y > c.p + 0.5));
  const rowsFor = (lv) => { const o = bandRows.slice(); for (const c of cells) { if (c.own) o.push(c.p - 0.02, c.p); if (lv(c.p) >= 2) for (let y = c.p + 1; y < c.p + c.h + 0.6; y += 1) o.push(y); } for (const [p, roof] of rings) { if (lv(p) >= 2) o.push(p - 0.02, p); else if (roof) o.push(p - 0.02, p, p + 0.02); else o.push(p - 0.04, p - 0.02, p); } return o; };
  const colsAt = (yr, lv) => { const o = []; for (const c of clefts) { const y = yr + lift(c.z, yr); if (cleftLife(c, y) <= 0) continue; const zc = cleftZ(c, y), w = cleftW(c, y), inner = Math.max(0.2, w - 0.5); if (lv(zc, y) >= 2) o.push(zc - w, zc, zc + w); else o.push(zc - w, zc - inner, zc + inner, zc + w); } return o; };
  const levelCap = (z, y, lv) => { for (const c of cells) if (y > c.p - 0.6 && y < c.p + c.h + 0.8 && Math.abs(z - c.zc) < c.hw + 0.8) return lv >= 2 ? 1 : 0; for (const q of bands) { if (y > q.p + 0.05 || y < q.p - q.h - 0.6) continue; for (const hc of q.honey) if (z > hc.z0 - 0.6 && z < hc.z1 + 0.6) return 0; for (const s of q.list) if (Math.abs(z - s.z) < s.a + 0.6) return 1; } return 3; };
  return { at, atQ, qOf, lift, jogC, maskJ, maskD, cutK, bedY: (z, q) => q + lift(z, q), endAt, cellRow, boxes: BOX, rowsFor, colsAt, levelCap, cuts, beds, bands, clefts, cleftZ, cleftW, cleftLife, mask, stepAt, mids, ends, cells, groups };
}

// ---------- the great pillar ----------
async function buildRock(ctx, env) {
  const { st, core, seed, opts, pal, sun, line } = env;
  const rng = st('pillar'), noise = core.makeNoise(core.hashSeed('pillar-noise:' + seed));
  const P = { cx: PC[0], cz: PC[1], a: PA, b: PB, n: rng.range(4.4, 5.6), nBack: rng.range(2.6, 3.4), footY: FOOT, topY: TOP, skirtY: SKIRT, kind: 'column', haul: true, rng, noise, lobe: 0.1, waist: 7, flare: 22, ledge: 1,
    rngButtress: st('buttress'), rngAprons: st('aprons'), rngRuns: st('ledge-runs'), rngBays: st('bays') };
  const sh = makeShape(P); await ctx.yield();
  for (const _ of sh.fillG()) await ctx.yield();
  const beds = makeBeds(st('beds'), SKIRT, TOP, [24, 44, GARDEN.y, TOP]);
  for (const b of beds) { if (b.y === TOP) { b.tb = 3.4; b.w = 0.8; b.u = 0.7; } if (b.y === GARDEN.y) { b.tb = 1; b.u = 0.15; } }
  addBeds(sh, beds);
  const zOfTab = (k) => { const kf = sh.kOf(k / 256 * sh.Lp); return sh.smp(sh.wxK, kf) > 0.5 ? P.cz + sh.smp(sh.bz, kf) : 1e9; };
  beds.forEach((b, i) => {                                                               // ledges with a duty: the cave way, the garden
    for (let k = 0; k < 256; k++) {
      const z = zOfTab(k);
      if (b.y === GARDEN.y) sh.wT[i][k] = 3.1 * sstep(GARDEN.z0 - 1, GARDEN.z0 + 3, z) * (1 - sstep(GARDEN.z1 - 3, GARDEN.z1 + 1, z));
      if (b.y === 24) sh.wT[i][k] = 1.25 * sstep(-33, -30, z) * (1 - sstep(-14, -11, z));
      if (b.y === 44) sh.wT[i][k] = 1.0 * sstep(-34, -31, z) * (1 - sstep(-13, -10, z));
    }
  });
  // M3 R4: THE SIDES AND THE BACK ARE A CRAG. Everything here only stands BACK from the surface as it was (so no clear number can
  // shrink): re-entrant creases between rounded shafts, each shaft waisted on two waves of its own, two deep narrow clefts. Nothing
  // where the haul face's weight is over 0, nothing within 30 m of the top, nothing under the foot's aprons (y under -10).
  { const rc = st('crag'), Lp = sh.Lp, K = sh.K, cr = [], waists = [], out = [0, 0];
    const sa = Math.max(sh.faceS(55) + 8, sh.sK[Math.ceil((56 + 180) / 360 * K)] + 1), sb = Math.min(sh.faceS(-60) + Lp - 8, sh.sK[Math.floor((180 - 56) / 360 * K)] + Lp - 1);
    for (let tries = 0, want = rc.int(5, 7); cr.length < want && tries < 300; tries++) {
      const sc = cr.length === 0 ? sa + rc.range(16, 30) : cr.length === 1 ? sb - rc.range(16, 30) : rc.range(sa + 8, sb - 8); if (cr.some((q) => Math.abs(q.s - sc) < 34)) continue;   // one crease stands 16 to 30 m beyond each end of the haul face: the flank the stage sees
      cr.push({ s: sc, hw: rc.range(16, 28), d: rc.range(5, 11), A: rc.range(0.25, 0.45), L: rc.range(60, 140), ph: rc.range(0, TAU), deep: null, wA: rc.range(1.5, 3.5), wL: rc.range(60, 140), wp: rc.range(0, TAU) });   // wA: it wanders as it climbs
    }
    cr.sort((p, q) => p.s - q.s);
    for (const i of [rc.int(0, cr.length - 1), rc.int(0, cr.length - 1)]) if (!cr[i].deep && i > 0 && i < cr.length - 1) cr[i].deep = { w: rc.range(5, 7), D: rc.range(8, 12), ya: rc.range(6, 40), yb: TOP - rc.range(45, 70), wl: rc.range(25, 60), ph: rc.range(0, TAU) };
    for (let i = 0; i <= cr.length; i++) waists.push({ a: i ? cr[i - 1].s : sa, b: i < cr.length ? cr[i].s : sb, A1: rc.range(2, 5), L1: rc.range(60, 140), p1: rc.range(0, TAU), A2: rc.range(1, 2.5), L2: rc.range(30, 60), p2: rc.range(0, TAU) });
    const fadeY = (y) => sstep(-10, 12, y) * (1 - sstep(TOP - 60, TOP - 30, y));
    const inS = (v) => { v = ((v % Lp) + Lp) % Lp; return v < sa - 20 ? v + Lp : v; }, sAt = (q, y) => q.s + q.wA * Math.sin(y / q.wL * TAU + q.wp);
    const crag = (s, y) => {
      out[0] = out[1] = 0; const fy = fadeY(y), v = inS(s); if (fy <= 0 || v <= sa || v >= sb) return out;
      const edge = sstep(sa, sa + 14, v) * (1 - sstep(sb - 14, sb, v)); let g = 0, occ = 0;
      for (const w of waists) if (v > w.a && v < w.b) { g += Math.sin((v - w.a) / (w.b - w.a) * Math.PI) * (w.A1 * clamp(0.5 + 0.8 * noise.n2(w.p1 + y / (w.L1 * 0.5), w.p2), 0, 1) + w.A2 * clamp(0.5 + 0.8 * noise.n2(w.p2 * 3 + y / (w.L2 * 0.5), w.p1), 0, 1)); break; }   // by noise, not by a wave (no even tiers)
      for (const q of cr) {
        const d = Math.abs(v - sAt(q, y)); if (d >= q.hw) continue; const x = d / q.hw;
        g += q.d * (1 + q.A * Math.sin(y / q.L * TAU + q.ph)) * (1 - Math.pow(1 - Math.pow(1 - x, 2.2), 0.55)); if (x < 0.3) occ = Math.max(occ, ((0.3 - x) / 0.3) ** 2 * 0.7);
        if (q.deep && d < q.deep.w / 2) { const e = d / (q.deep.w / 2), f = sstep(q.deep.ya, q.deep.ya + 8, y) * (1 - sstep(q.deep.yb - 8, q.deep.yb, y)); g += q.deep.D * (0.65 + 0.35 * Math.sin(y / q.deep.wl * TAU + q.deep.ph)) * (1 - e * e) * f; occ = Math.max(occ, Math.sqrt(1 - e * e) * f); }
      }
      out[0] = g * fy * edge; out[1] = occ * Math.min(1, fy * edge * 2); return out;
    };
    sh.hollowAt = (s, y, wx) => (wx > 0 ? 0 : crag(s, y)[0]); sh.cragAt = (s, y) => crag(s, y)[1]; sh.crag = { cr, sa, sb, inS, sAt };
    // R3 on it: three bands of scoops and one to three cave mouths, on the sides and the back
    const rh = st('hollows');
    env.hol = makeHollows(sh, rh, { bands: 3, min: 3, most: 14, caves: rh.int(1, 3), y0: 14, y1: TOP - 34, fine: true,
      free: (sc, half) => { const v = inS(sc); return v > sa + 16 + half && v < sb - 16 - half && cr.every((q) => Math.abs(v - q.s) > half + 1 + q.wA + (q.deep ? q.deep.w * 0.5 : 0)); } });
  }
  // the lean of the brow, the cave, and the brow dressed back under the hatch bay (9 m and more from the last straight)
  sh.extra = (s, y, kf, o) => {
    const wx = sh.smp(sh.wxK, kf); if (wx <= 0) return o;
    const z = P.cz + sh.smp(sh.bz, kf);
    if (y > 200) { const ln = 7.9 * Math.pow((y - 200) / 40, 1.6); o += wx * ln; const ex = sh.smp(sh.ex, kf), cap = (ln - 0.35 - (P.cx + sh.smp(sh.bx, kf))) / Math.max(ex, 0.3); if (ex > 0.3 && o > cap) o = cap; }
    if (y > CAVE.y0 + 0.005 && y < CAVE.y1 && z > CAVE.z0 && z < CAVE.z1) { const zn = (z + 22) / 3.5, yn = (y - CAVE.y0) / 4.5; o = Math.min(o, -(0.9 + (CAVE.depth - 0.9) * Math.sqrt(Math.max(0, 1 - 0.8 * zn * zn)) * (1 - 0.3 * yn * yn))); }
    if (y > 196 && z > -13 && z < 18.5) { const e = 1 - sstep(-13, -10, z) + sstep(15.5, 18.5, z), lim = 17 + 0.3441 * (TOP - y) - 9.6 + 4 * e - (P.cx + sh.smp(sh.bx, kf)); if (o > lim) o = lim; }
    return o;
  };
  await ctx.yield();
  sh.relief = await makeHaulRelief(sh, st, noise, line, () => ctx.yield());                                         // m3b B1 (it only stands back); M4: bays, cells, the bedding's lift
  sh.endAt = sh.relief.endAt;
  env.sh = sh; env.beds = beds; env.relief = sh.relief;
  env.faceX = (z, y) => sh.faceX(z, y); env.lipX = (z) => sh.faceX(z, TOP);
  await ctx.yield();
  return sh;
}

// ---------- M4: THE SITES OF THE HAUL FACE, by place (after the mesh, before the rock's material): the runs of true ledge of the
// relief, where the bushes, the fig and the nests stand (m3b's streams, dealt as before; W7's sizes), and the BORN table of the
// shader: black water streaks (stream 'born-streaks'), lime runs, droppings under the nests, the fig's root stain, the cells' soot.
async function haulSites(ctx, env) {
  const RL = env.relief, { st, line } = env, fx = env.faceX, r2 = (v) => Math.round(v * 100) / 100, S = { runs: [], bushes: [], fig: null, nests: [], born: [] };
  if (!RL) return S;
  const far = (x, y, z, rad) => lineDist(line, x, y, z) - rad >= 9.5;
  // runs of true ledge: a bed plane that steps back 0.3 m or more over 1.5 m or more of the face
  for (const p of RL.cuts) { let z0 = null, wsum = 0, n = 0;
    for (let z = -52; z <= 47.01; z += 0.5) { const w = RL.stepAt(p, z), on = w >= 0.3 && RL.mask(z, RL.bedY(z, p)) >= 1;
      if (on) { if (z0 === null) { z0 = z; wsum = 0; n = 0; } wsum += w; n++; } if ((!on || z > 46.9) && z0 !== null) { if (z - z0 >= 1.5) S.runs.push({ p, z0, z1: z - 0.5, w: wsum / n, wAt: (zz) => RL.stepAt(p, zz) }); z0 = null; } }
    await ctx.yield(); }
  // and the lips of the standing hard beds (0.3 m wide or more), where no anchor stands
  { const sh = env.sh; for (const lv of sh.levels) { if (lv.b.duty || lv.L < 2 || lv.L > 195) continue; const wAt = (zz) => ringAt(lv.T, sh.faceS(zz) / sh.Lp) * (1 - RL.cutK(zz, RL.bedY(zz, lv.L))); let z0 = null;
    for (let z = -52; z <= 47.01; z += 0.5) { const on = wAt(z) >= 0.3 && RL.mask(z, RL.bedY(z, lv.L)) >= 1; if (on && z0 === null) z0 = z; if ((!on || z > 46.9) && z0 !== null) { if (z - z0 >= 1.5) S.runs.push({ p: lv.L, z0, z1: z - 0.5, w: 0.5, wAt, lip: true }); z0 = null; } } } }
  // bushes (stream 'face-bushes' as m3b dealt it; W7: 2 to 4 m)
  { const r = st('face-bushes'), want = r.int(5, 9);
    for (let tries = 0; S.bushes.length < want && tries < 300; tries++) {
      const onLedge = r.chance(0.6), size = lerp(2, 4, (r.range(0.5, 1.2) - 0.5) / 0.7), tone = r(), ph = r.range(0, TAU), pick = r(), zr = r.range(-50, 45), yr = r.range(8, 190), side = r.sign(), n = r.int(2, 3);
      const jit = [r.range(-1, 1), r.range(-1, 1), r.range(-1, 1), r.range(0.8, 1.1), r.range(0.8, 1.1), r.range(0.8, 1.1)];
      let x, y, z;
      if (onLedge) { const p = RL.cuts[Math.min(RL.cuts.length - 1, Math.floor(pick * RL.cuts.length))], w = RL.stepAt(p, zr); if (!(w >= 0.3)) continue; z = zr; y = RL.bedY(z, p); x = fx(z, y + 0.12) + Math.min(0.6 * w, 0.4); }
      else { const c = RL.clefts[pick < 0.5 ? 0 : 1]; y = yr; if (RL.cleftLife(c, y) < 1) continue; z = RL.cleftZ(c, y) + side * (RL.cleftW(c, y) - 0.45); x = fx(z, y) + 0.1; }
      if (RL.mask(z, y) < 1 || RL.mask(z, y + 2) < 1 || !far(x + 0.3 * size, y + 0.45 * size, z, 0.55 * size) || S.bushes.some((q) => Math.hypot(q.at[1] - y, q.at[2] - z) < 6) || RL.cells.some((c) => Math.abs(z - c.zc) < c.hw + 2.5 && y > c.p - 16 && y < c.p + c.h + 3)) continue;
      S.bushes.push({ at: [x, y, z], size, tone, ph, n, jit, onLedge });
    } }
  // the fig (stream 'face-fig'; W7: a crown of 5 to 7 m in a cleft's corner)
  { const r = st('face-fig'), crown = st('face-growth').range(5, 7);
    for (let tries = 0; !S.fig && tries < 120; tries++) {
      const c = RL.clefts[r.chance(0.5) ? 0 : 1], y = r.range(30, 150), side = r.sign(), ph = r.range(0, TAU);
      if (RL.cleftLife(c, y) < 1) continue; const z = RL.cleftZ(c, y) + side * (RL.cleftW(c, y) - 0.5), x = fx(z, y);
      if (RL.mask(z, y) < 1 || RL.mask(z, y + 4) < 1 || !far(x + 0.3 * crown, y + 0.45 * crown, z, 0.55 * crown) || S.bushes.some((q) => Math.hypot(q.at[1] - y, q.at[2] - z) < 7) || RL.cells.some((q) => Math.abs(z - q.zc) < q.hw + 4 && y > q.p - 16 && y < q.p + q.h + 5)) continue;
      S.fig = { at: [x, y, z], crown, ph, rng: r };
    } }
  await ctx.yield();
  // nests (stream 'face-nests' as m3b dealt it)
  { const r = st('face-nests'), cand = [];
    for (const p of RL.cuts) for (let z = -50; z <= 45; z += 1) { const yb = RL.bedY(z, p); if (-RL.stepAt(p, z) >= 0.45 && RL.mask(z, yb - 0.3) >= 1 && far(fx(z, yb - 0.2) + 0.3, yb - 0.2, z, 0.3)) cand.push([p, z]); }
    for (let tries = 0; S.nests.length < 2 && cand.length && tries < 60; tries++) { const q = cand[r.int(0, cand.length - 1)]; if (S.nests.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > 15 && (o[0] !== q[0] || tries > 40))) S.nests.push(q); }
    S.nestRng = r; }
  await ctx.yield();
  // BORN: [z, y of the birth, length, half-width, water, pale, dry dark, taper]
  const rs = st('born-streaks'), want = rs.int(6, 10), dark = [], add = (z, y, len, hw, kw, kp, ks, tp, what) => S.born.push({ z, y, len, hw, k: [kw, kp, ks, tp], what });
  const tryDark = (z, y, what) => {
    const len0 = rs.range(15, 80), hw = rs.range(0.4, 1.25), a = rs.range(0.75, 1), tp = rs.range(0.2, 0.5), lime = rs.chance(0.4), sd = rs.sign(), off = rs.range(0.3, 0.6), hw2 = rs.range(0.2, 0.5), kl = rs.range(0.6, 0.9), ap = rs.range(0.6, 0.85);
    const len = Math.min(len0, y + 6); if (len < 15 || dark.length >= want || dark.some((q) => Math.abs(q[0] - z) < 4 + hw && y - len < q[1] && q[1] - q[2] < y)) return;
    dark.push([z, y, len]); add(z, y, len, hw, a, 0, 0, tp, what);
    if (lime) add(z + sd * (hw + off), y, len * kl, hw2, 0, ap, 0, 0.2, 'lime run');
  };
  for (const c of RL.cells) { const k = rs.chance(0.7), f = rs.range(-0.6, 0.6); if (k) tryDark(c.zc + f * c.hw, c.p - 0.3, "a cell's sill"); }
  tryDark(rs.range(-30, -14), 22.5, "the cave's lower ledge"); tryDark(rs.range(-50, 46), TOP - 3.6, 'the brow');
  for (let tries = 0; dark.length < want && S.runs.length && tries < 80; tries++) { const q = S.runs[rs.int(0, S.runs.length - 1)], z = lerp(q.z0, q.z1, rs()); tryDark(z, RL.bedY(z, q.p) - 0.05, 'a ledge of the relief'); }
  for (const [p, zc] of S.nests) add(zc, RL.bedY(zc, p) - 0.35, rs.range(3, 6), rs.range(1.3, 2), 0, 0.9, 0, 0.3, 'droppings');
  if (S.fig) add(S.fig.at[2], S.fig.at[1] - 0.4, rs.range(6, 10), rs.range(0.7, 1), 0.75, 0, 0, 0.3, "the fig's root stain");
  for (const c of RL.cells) add(c.chz, c.top(c.chz) + c.soot, c.soot + 0.25, 0.85, 0, 0, 0.9, 0.6, 'soot');
  S.born.length = Math.min(S.born.length, 24);
  const A = [], K = []; for (let i = 0; i < 24; i++) { const q = S.born[i]; A.push(q ? new THREE.Vector4(q.z, TOP - q.y, q.len, q.hw) : new THREE.Vector4(0, 0, 1, 1)); K.push(q ? new THREE.Vector4(q.k[0], q.k[1], q.k[2], q.k[3]) : new THREE.Vector4(0, 0, 0, 0)); }
  S.bornU = { A, K }; S.r2 = r2;
  return S;
}

async function meshRock(ctx, env) {
  const { sh, beds, line, st, opts, sun } = env, P = sh.P;
  const run = async (it) => { let r; while (!(r = it.next()).done) await ctx.yield(); return r.value; };
  // distance from the face to the flown line (a table over z and y): it sets the size of the cells, by place
  const DZ0 = -64, DNZ = 62, DNY = Math.floor((TOP - SKIRT) / 2) + 1, DT = new Float32Array(DNZ * DNY);
  for (let j = 0; j < DNY; j++) { const y = SKIRT + 2 * j, x = y > 200 ? 7.9 * Math.pow((y - 200) / 40, 1.6) : 0; for (let i = 0; i < DNZ; i++) DT[j * DNZ + i] = lineDist(line, x, y, DZ0 + 2 * i); if ((j & 7) === 7) await ctx.yield(); }
  const distAt = (z, y) => {
    const fi = clamp((z - DZ0) / 2, 0, DNZ - 1.001), fj = clamp((y - SKIRT) / 2, 0, DNY - 1.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    return lerp(lerp(DT[j * DNZ + i], DT[j * DNZ + i + 1], a), lerp(DT[(j + 1) * DNZ + i], DT[(j + 1) * DNZ + i + 1], a), b);
  };
  const levelOf = (d) => (d < 14 ? 0 : d < 27 ? 1 : d < 46 ? 2 : 3);
  const rowLevel = (y) => { let m = 3; for (let z = -60; z <= 55; z += 2) m = Math.min(m, levelOf(distAt(z, y))); return m; };
  env.distAt = distAt;
  // the haul face: columns on a 0.5 m lattice of z, thinned by level; rows at every bed feature, filled to the same rule
  const Z0 = -60, NK = 230, sLat = new Float32Array(NK + 1); for (let k = 0; k <= NK; k++) sLat[k] = sh.faceS(Z0 + 0.5 * k);
  const s0 = sLat[0], s1 = sLat[NK], kA = Math.round((CAVE.z0 - Z0) * 2), kB = Math.round((CAVE.z1 - Z0) * 2);
  const sA = [sh.faceS(CAVE.z0 - 0.04), sh.faceS(CAVE.z0 + 0.04)], sB = [sh.faceS(CAVE.z1 - 0.04), sh.faceS(CAVE.z1 + 0.04)];
  const haulCols = (y) => {
    const out = [], inCave = y > CAVE.y0 + 0.005 && y < CAVE.y1 - 0.005, must = new Set(), RL = sh.relief, exact = RL ? RL.colsAt(y, (z, yy) => levelOf(distAt(z, yy))) : [];
    for (const j of sh.joints) if (y > j.ya - 12 && y < j.yb + 12) { const zc = sh.jointZ(j, y); for (const q of j.w > 3 ? [-0.5, -0.25, 0, 0.25, 0.5] : [-0.5, 0, 0.5]) must.add(Math.round((zc + q * j.w - Z0) * 2)); }
    for (let k = 0; k < NK; k++) {
      const z = Z0 + 0.5 * k; let lv = levelOf(distAt(z, y)); if (inCave && z > CAVE.z0 - 1.2 && z < CAVE.z1 + 1.2) lv = 0;
      if (RL && lv > 0) lv = Math.min(lv, RL.levelCap(z, y, lv));
      if (k && k % (1 << lv) && !must.has(k)) continue;
      if (k && exact.length && exact.some((e) => Math.abs(e - z) < 0.2)) continue;      // it gives way to a column at a cleft's edge
      if (inCave && k === kA) out.push(sA[0], sA[1]); else if (inCave && k === kB) out.push(sB[0], sB[1]); else out.push(sLat[k]);
    }
    if (exact.length) { for (const e of exact) out.push(sh.faceS(e)); out.sort((a, b) => a - b); }
    return out;
  };
  // (m3b: the relief's rings join the rows; over y 199, where the relief ends, every ring stays where it was, so the brow's clear numbers keep their vertices)
  const feat0 = featureRows(sh, SKIRT, TOP, { fine: true }).concat([CAVE.y1 - 0.02, CAVE.y1 + 0.02]).sort((a, b) => a - b), gapOf = (y) => 0.5 * (1 << rowLevel(y));
  const rows0 = fillRows(feat0, gapOf), yPin = rows0.find((y) => y >= 199);
  const hrows = sh.relief ? fillRows(feat0.filter((y) => y < yPin).concat(sh.relief.rowsFor(rowLevel).filter((y) => y < yPin - 0.01), [yPin]).sort((a, b) => a - b), gapOf).concat(rows0.filter((y) => y > yPin)) : rows0;
  // the other three faces: a column every 3.5 m and one on every buttress edge and cleft line; rows at the ledges and 7 m apart at most
  const len = sh.Lp - (s1 - s0), nc = Math.round(len / 3.5), rc = []; for (let i = 0; i < nc; i++) rc.push(s1 + len * i / nc);
  const inRest = (s) => { let v = ((s % sh.Lp) + sh.Lp) % sh.Lp; if (v < s1) v += sh.Lp; return v; };
  for (const q of sh.butt) for (const e of [-0.5, 0.5]) rc.push(inRest(q.u * sh.Lp + e * q.w));
  for (const f of sh.clefts) rc.push(inRest(f.u * sh.Lp));
  rc.sort((a, b) => a - b);
  const rcols = [rc[0]]; for (let i = 1; i < rc.length; i++) if (rc[i] - rcols[rcols.length - 1] > 0.9 && rc[i] < s0 + sh.Lp - 0.9) rcols.push(rc[i]);
  const hol = env.hol, rrows = fillRows(featureRows(sh, SKIRT, TOP, {}).concat(hol ? hol.rows : []).sort((a, b) => a - b), () => 7);
  await ctx.yield();
  // M3: a column in every crease of the crag and across each deep cleft, row by row (they wander as they climb)
  const restCols = (y) => {
    if (!sh.crag) return rcols; const mk = [];
    for (const q of sh.crag.cr) { const c = sh.crag.sAt(q, y); mk.push(inRest(c)); if (q.deep) for (const e of [-0.5, -0.25, 0.25, 0.5]) mk.push(inRest(c + e * q.deep.w)); }
    const base = rcols.filter((v, i) => i === 0 || !mk.some((m) => Math.abs(m - v) < 0.9)).concat(mk.filter((m) => m > rcols[0] + 0.9 && m < s0 + sh.Lp - 0.9)).sort((a, b) => a - b);
    return hol ? hol.colsAt(y, base, s1, len) : base;
  };
  let M = await run(loftSteps(sh, [{ rows: hrows, cols: haulCols }, { rows: rrows, cols: restCols }], { capColumns: 96, capRings: [0.985, 0.95, 0.86, 0.7, 0.5, 0.25] }));
  const sites = env.sites = await haulSites(ctx, env);                                    // M4: by place, on the finished surface
  // streaks: eight on the haul face, nine metres apart or more; four lesser ones round the back
  const rs = st('streaks'), streaks = [], zs = [];
  for (let tries = 0; zs.length < 8 && tries < 400; tries++) { const z = rs.range(-52, 48); if (zs.every((q) => Math.abs(q - z) > 9)) zs.push(z); }
  for (const z of zs) streaks.push({ s: sh.faceS(z), w: rs.range(3, 6), len: rs(), a: rs.range(0.8, 1), z });
  // round the back the water comes down the clefts and beside the buttresses
  const places = sh.clefts.map((f) => f.u * sh.Lp).concat(sh.butt.map((q) => (q.u - 0.5 * q.w / sh.Lp) * sh.Lp), sh.butt.map((q) => (q.u + 0.5 * q.w / sh.Lp) * sh.Lp));
  for (let i = 0; i < 4; i++) { const sr = s1 + len * rs.range(0.06, 0.94); streaks.push({ s: i < places.length ? places[i] : sr, w: rs.range(3, 6), len: rs(), a: rs.range(0.5, 0.8) }); }
  { const rb2 = st('back-streaks'); for (let i = 4; i < Math.min(places.length, 9); i++) streaks.push({ s: places[i], w: rb2.range(3, 6), len: rb2(), a: rb2.range(0.5, 0.85) }); }
  const strata = makeBedTable(beds, st('bed-colours'), env.pal);
  let detail = opts.detailTexture || (opts.terrain && opts.terrain.detailTexture);
  if (!detail) detail = await run(detailTextureSteps({ rng: st('rock-detail') }));
  const mat = makeRockMat(strata, { rng: st('rock-detail'), streakTex: makeStreakTexture(streaks, sh.Lp, rs), Lp: sh.Lp, wet: env.wet, snow: env.snow, terrain: opts.terrain, detailTexture: detail, bounceU: env.U.uPilB, born: sites.bornU });
  mat.userData.rockMean = [strata.meanColor.r, strata.meanColor.g, strata.meanColor.b]; mat.userData.sun = sun;
  await ctx.yield();
  const inside = (x, y, z) => (z > CAVE.z0 && z < CAVE.z1 && y > CAVE.y0 && y < CAVE.y1 && x < -0.4 ? sstep(0.3, 3.5, -x) : 0);
  // where the jackdaws sit: the y 24 ledge for z -29..-22, and the first hard-bed run above y 70 that crosses z -14..2
  const perch = [{ L: 24, z0: -29, z1: -22 }];
  for (const lv of sh.levels) { if (lv.L < 70 || lv.L > 190 || lv.b.duty) continue; let a = 1e9, e = -1e9; for (let z = -14; z <= 2; z += 1) if (ringAt(lv.T, sh.faceS(z) / sh.Lp) > 0.2) { a = Math.min(a, z); e = Math.max(e, z); } if (e - a >= 4) { perch.push({ L: lv.L, z0: a, z1: e }); break; } }
  const white = (x, y, z) => { if (x < -30) return 0; let m = 0; for (const p of perch) if (y < p.L + 0.05 && y > p.L - 2.7 && z > p.z0 - 1 && z < p.z1 + 1) m = Math.max(m, sstep(p.z0 - 1, p.z0 + 0.5, z) * (1 - sstep(p.z1 - 0.5, p.z1 + 1, z)) * sstep(p.L - 2.7, p.L - 0.4, y)); return m; };
  env.perch = perch;
  // M3 R3/R4: what grows and lies on the sides and the back (never on the haul face): bushes and small trees on the ledges and in the
  // deep clefts, scrub, ivy and fallen blocks at the foot (the ground's height from the terrain where the world gives one)
  { const X = makeExtras(), cg = sh.crag, T = opts.terrain, ground = typeof opts.ground === 'function' ? opts.ground : T && typeof T.surfaceAt === 'function' ? (x, z) => T.surfaceAt(x, z) : null;
    const freeS = (sc, y) => { const v = cg.inS(sc); return v > cg.sa + 6 && v < cg.sb - 6 && y < TOP - 30; };
    dressRock(sh, X, { r: st('growth'), rock: mul3(mat.userData.rockMean, 0.92), groundY: 0, ground, free: freeS, blocks: [8, 14], scrub: [12, 16], bushes: 40,
      clefts: cg.cr.filter((q) => q.deep).map((q) => ({ s: q.s, sAt: (y) => cg.sAt(q, y), ya: q.deep.ya, yb: q.deep.yb, w: q.deep.w })) });
    await ctx.yield(); env.tris.growth = X.idx.length / 3; M = appendExtras(M, X); }
  const geo = await run(bakeSteps(sh, M, { sun, rock: mat.userData.rockMean, capColor: env.capColor, inside, white }));
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'great-pillar'; mesh.castShadow = mesh.receiveShadow = true;
  env.root.add(mesh); env.rockMat = mat; env.strata = strata; env.streaks = streaks; env.tris.rock = M.idx.length / 3; env.rimOutline = M.rimOutline;
  env.rows = hrows.length;
  await ctx.yield();
}

// ---------- collectors for the small things ----------
// Ribbons: every thin thing (ladder rails and rungs, cords, lines, rails, chains) is a quad that turns to the eye and is held to
// a least width in pixels in the vertex shader. seg(a, b, width m, colour, least pixels).
function makeRibbons() {
  const P = [], O = [], C = [], W = []; const I = [];
  const seg = (a, b, w, c, px = 1.5) => {
    const n = P.length / 3;
    for (let k = 0; k < 4; k++) { const p = k < 2 ? a : b, q = k < 2 ? b : a, sd = (k === 0 || k === 3) ? -1 : 1; P.push(p[0], p[1], p[2]); O.push(q[0], q[1], q[2]); C.push(c[0], c[1], c[2]); W.push(sd * (k < 2 ? 1 : -1), w * 0.5, px); }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const poly = (pts, w, c, px) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], w, c, px); };
  const sag = (a, b, drop, n, w, c, px) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - drop * 4 * t * (1 - t), lerp(a[2], b[2], t)]); } poly(pts, w, c, px); return pts; };
  const geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOther', new THREE.Float32BufferAttribute(O, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3));
    g.setIndex(I); g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  };
  return { seg, poly, sag, geometry, get triangles() { return I.length / 3; } };
}
function ribbonMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), vertexColors: true, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aOther; attribute vec3 aW; uniform float uBufH; varying vec3 vCol; varying float vA;
      #include <fog_pars_vertex>
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); vec3 q = (modelViewMatrix * vec4(aOther, 1.)).xyz;
        vec3 t = q - mvPosition.xyz; vec3 sd = cross(t, mvPosition.xyz); float l = length(sd); sd = l > 1e-6 ? sd / l : vec3(1., 0., 0.);
        float px = 2. * max(-mvPosition.z, .01) / (projectionMatrix[1][1] * max(uBufH, 1.));          // one pixel, in metres, at this depth
        float hw = max(aW.y, aW.z * px * .5);
        vA = max(.34, sqrt(clamp(aW.y / hw, 0., 1.)));                 // held to its least width, it thins in strength instead
        mvPosition.xyz += sd * aW.x * hw;
        vCol = color; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunC, uSkyC; varying vec3 vCol; varying float vA;
      #include <fog_pars_fragment>
      void main() { gl_FragColor = vec4(vCol * (uSkyC + uSunC * .55), vA);
        #include <fog_fragment>
      }`,
  });
}
// Cloths: quads of 4 by 3 cells hung by their top edge; they flap in the vertex shader. add(a, b, drop, colour, phase): top edge a..b.
function makeCloths() {
  const P = [], C = [], A = [], I = [];
  const add = (a, b, drop, c, ph, amp = 1) => {
    const n = P.length / 3, NU = 4, NV = 3;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, v = j / NV; P.push(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - drop * v, lerp(a[2], b[2], u)); C.push(c[0], c[1], c[2]); A.push(u, v, ph, amp); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const q = n + j * (NU + 1) + i; I.push(q, q + NU + 1, q + 1, q + 1, q + NU + 1, q + NU + 2); }
  };
  const geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aCl', new THREE.Float32BufferAttribute(A, 4));
    g.setIndex(I); g.computeBoundingBox(); g.boundingBox.expandByScalar(0.6); g.boundingSphere = g.boundingBox.getBoundingSphere(new THREE.Sphere()); return g;
  };
  return { add, geometry, get triangles() { return I.length / 3; } };
}
function clothMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), vertexColors: true, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aCl; uniform float uTime; varying vec3 vCol; varying vec3 vN;
      #include <fog_pars_vertex>
      void main() {
        float v = aCl.y, ph = aCl.z, w = uTime * 3.1 + ph;
        float gust = .55 + .45 * sin(uTime * .7 + ph * .37) * sin(uTime * .31 + ph);          // the wind comes and goes; it blows along the face
        float a = aCl.w * v * (.25 + .75 * v);
        vec3 p = position;
        float s1 = sin(w + aCl.x * 3.1 + v * 4.2), s2 = sin(w * 1.7 + aCl.x * 5.3 - v * 6.1);
        p.z += a * (.26 * gust + .07 * s1); p.y += a * (.16 * gust + .04 * s2); p.x += a * (.05 * s1 + .03 * s2);
        vN = normalize(vec3(1., .25 * s2 * a, -.5 * gust * a - .5 * s1 * a));
        vCol = color;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunC, uSkyC, uSunD; varying vec3 vCol; varying vec3 vN;
      #include <fog_pars_fragment>
      void main() { float d = abs(dot(normalize(vN), uSunD));
        gl_FragColor = vec4(min(vCol, vec3(.62)) * (uSkyC + uSunC * (.22 + .62 * d)), 1.);   // M4b P6: a cloth is a lit surface: no colour of it over .62 (half again the rock's brightest stone under the cloth's own light)
        #include <fog_fragment>
      }`,
  });
}

// Movers: one lit mesh for everything that moves as a body. Each vertex carries a pivot and a rule (aAnim: mode, phase, a, b):
//   1 turns about the upright through its pivot, one round in 9 s (capstan, drum, walkers; a = 1 adds a footfall)
//   2 rises a m/s over a span of b metres and begins again, shrinking to nothing in the last 1.2 m at either end (baskets)
//   3 rocks about the level axis through its pivot that lies along z: a radians at b radians a second (diggers, servants, mallet, board)
//   4 sways with height above its pivot: a metres a metre, b radians a second (fig, bushes, cypresses)
//   5 spins about the level axis along x through its pivot at a radians a second (sheaves)
function makeMovers() {
  const b = new S.Builder(8192), marks = [];
  const anim = (from, piv, mode, phase = 0, p1 = 0, p2 = 0) => marks.push([from, b.nv, piv[0], piv[1], piv[2], mode, phase, p1, p2]);
  const geometry = () => {
    const g = b.toGeometry(), n = b.nv, piv = new Float32Array(n * 3), an = new Float32Array(n * 4);
    for (const m of marks) for (let i = m[0]; i < m[1]; i++) { piv[i * 3] = m[2]; piv[i * 3 + 1] = m[3]; piv[i * 3 + 2] = m[4]; an[i * 4] = m[5]; an[i * 4 + 1] = m[6]; an[i * 4 + 2] = m[7]; an[i * 4 + 3] = m[8]; }
    g.setAttribute('aPiv', new THREE.BufferAttribute(piv, 3)); g.setAttribute('aAnim', new THREE.BufferAttribute(an, 4)); g.deleteAttribute('win'); g.deleteAttribute('uv'); g.clearGroups();
    if (g.boundingBox) { g.boundingBox.expandByScalar(4); g.boundingBox.min.y = -30; g.boundingSphere = g.boundingBox.getBoundingSphere(new THREE.Sphere()); }
    return g;
  };
  return { b, anim, geometry };
}
function moverMaterial(U) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPiv; attribute vec4 aAnim; uniform float uTime;')
      .replace('#include <beginnormal_vertex>', /* glsl */`#include <beginnormal_vertex>
        float mMode = aAnim.x, mAng = 0.;
        if (mMode > .5 && mMode < 1.5) mAng = uTime * .6981317 + aAnim.y;
        else if (mMode > 2.5 && mMode < 3.5) mAng = aAnim.z * sin(uTime * aAnim.w + aAnim.y);
        else if (mMode > 4.5) mAng = uTime * aAnim.z + aAnim.y;
        float mC = cos(mAng), mS = sin(mAng);
        if (mMode > .5 && mMode < 1.5) objectNormal.xz = vec2(mC * objectNormal.x + mS * objectNormal.z, -mS * objectNormal.x + mC * objectNormal.z);
        else if (mMode > 2.5 && mMode < 3.5) objectNormal.xy = vec2(mC * objectNormal.x - mS * objectNormal.y, mS * objectNormal.x + mC * objectNormal.y);
        else if (mMode > 4.5) objectNormal.yz = vec2(mC * objectNormal.y - mS * objectNormal.z, mS * objectNormal.y + mC * objectNormal.z);`)
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
        vec3 mD = transformed - aPiv;
        if (mMode > .5 && mMode < 1.5) { mD.xz = vec2(mC * mD.x + mS * mD.z, -mS * mD.x + mC * mD.z); transformed = aPiv + mD; transformed.y += .035 * abs(sin(uTime * 5.2 + aAnim.y * 7.)) * aAnim.z; }
        else if (mMode > 1.5 && mMode < 2.5) { float mSp = max(aAnim.w, 3.), mH = mod(aAnim.y + uTime * aAnim.z, mSp), mK = smoothstep(0., 1.2, mH) * (1. - smoothstep(mSp - 1.2, mSp, mH));
          transformed = aPiv + mD * mK; transformed.y += mH; transformed.z += .1 * sin(uTime * .9 + aAnim.y) * mK; }
        else if (mMode > 2.5 && mMode < 3.5) { mD.xy = vec2(mC * mD.x - mS * mD.y, mS * mD.x + mC * mD.y); transformed = aPiv + mD; }
        else if (mMode > 3.5 && mMode < 4.5) { float mG = sin(uTime * aAnim.w + aAnim.y + position.z * .7) * .6 + sin(uTime * aAnim.w * 2.3 + aAnim.y * 1.7) * .4; float mY = max(mD.y, 0.); transformed.z += aAnim.z * mY * mG; transformed.x += aAnim.z * mY * mG * .2; }
        else if (mMode > 4.5) { mD.yz = vec2(mC * mD.y - mS * mD.z, mS * mD.y + mC * mD.z); transformed = aPiv + mD; }`);
  };
  m.customProgramCacheKey = () => 'net-up-the-pillar-movers-1';
  return m;
}
// M4b P4: RUBBLE (addendum 15: no grid of equal stones). A wall men piled up from the cliff's own stone: the stones are the cells of
// an UNEQUAL NET (each stone has a reach of its own, so one is twice another: 0.3 to 1.1 m long, 0.25 to 0.6 m high, their corners
// round), in ROUGH COURSES (their middles keep to a course within an eighth of its height, freely along it; the courses wave), each
// stone of its own tone (the conglomerate's cool grey, plain, warm and pale), lighter above and darker below; between them the
// washed mortar, pale and sandy, 3 to 6 cm. Drawn by place (the wall's own plane in the part's frame; a top by its plan) on a mesh
// of its own ('rubble'); beyond 0.3 m to the pixel the wall's mean tone. (Nine cells in a loop of constant bounds; no texture, no
// derivative inside it; the roots clamped.)
const RUBBLE_FRAG = /* glsl */`
{ vec3 rAn = abs(vRubN);
  vec2 rq = rAn.y > .6 ? vRubP.xz : (rAn.x > rAn.z ? vRubP.zy : vRubP.xy);
  float rPx = max(length(dFdx(rq)), length(dFdy(rq)));
  vec2 rG = vec2(rq.x / .62 + .30 * sin(rq.y * 1.9 + 1.), rq.y / .40 + .30 * sin(rq.x * 1.1 + 1.3) + .45 * sin(rq.x * .37 + rq.y * .2));
  vec2 rCell = floor(rG), rF = rG - rCell, rPn = vec2(0.);
  float rD1 = 9., rD2 = 9., rHa = 0., rHb = 0.;
  for (int rj = -1; rj <= 1; rj++) for (int ri = -1; ri <= 1; ri++) {
    vec2 rO = vec2(float(ri), float(rj)), rId = rCell + rO;
    float rH1 = rubH(rId), rH2 = rubH(rId + vec2(7.3, 1.9)), rH3 = rubH(rId + vec2(3.1, 5.7));
    vec2 rP = rO + vec2(.12 + .76 * rH1, .38 + .24 * rH2) - rF;
    float rD = dot(rP, rP) / (.6 + .7 * rH3);
    if (rD < rD1) { rD2 = rD1; rD1 = rD; rHa = rH3; rHb = rH2; rPn = rP; } else if (rD < rD2) { rD2 = rD; }
  }
  float rE = sqrt(max(rD2, 1e-6)) - sqrt(max(rD1, 1e-6));
  float rAa = clamp(rPx * 2.5, .015, .4);
  float rStone = smoothstep(.055 - rAa, .055 + rAa, rE);
  float rHc = rubH(vec2(rHa * 91.7, rHb * 37.3));
  vec3 rTone = rHc < .28 ? vec3(.80, .82, .88) : (rHc < .62 ? vec3(1.) : (rHc < .86 ? vec3(1.14, .93, .76) : vec3(1.26, 1.21, 1.10)));
  rTone *= (.74 + .46 * rHa) * (1. - .16 * (1. - smoothstep(.055, .3, rE))) * (1. - .45 * clamp(rPn.y, -.3, .3));
  vec3 rJoint = vec3(.70, .66, .58) * (.9 + .2 * rHb);
  diffuseColor.rgb *= mix(mix(rJoint, rTone, rStone), vec3(.90, .87, .80), smoothstep(.10, .30, rPx));
}
`;
function rubbleMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRubP; varying vec3 vRubN;').replace('#include <begin_vertex>', '#include <begin_vertex>\n vRubP = position; vRubN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRubP; varying vec3 vRubN;\nfloat rubH(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }').replace('#include <color_fragment>', '#include <color_fragment>\n' + RUBBLE_FRAG);
  };
  m.customProgramCacheKey = () => 'net-up-the-pillar-rubble-2';
  return m;
}
// the rubble's own tone: the cliff's (its dry colour and the bed table's mean), a breath paler
const rubTone = (env) => { const d = lin('#857f66'), m = env.strata && env.strata.meanColor; return mul3(m ? mix3(d, [m.r, m.g, m.b], 0.45) : d, 1.1); };
// a robed figure with no face, feet at the origin, looking along +z. o: { robe, skin, hat, arms: 'down' | 'push' | 'dig' }
function figure(b, o) {
  b.col(o.robe, 0.72, 1).surf(0);
  b.lathe(0, 0, 0, [[0.29, 0], [0.26, 0.45], [0.19, 1.0], [0.215, 1.3], [0.09, 1.47]], 7, { smooth: true });
  const hy = o.arms === 'push' ? 1.04 : o.arms === 'dig' ? 0.8 : 0.82, hz = o.arms === 'down' ? 0.08 : 0.42;
  for (const sx of [-1, 1]) b.beam([sx * 0.2, 1.3, 0], [sx * (o.arms === 'down' ? 0.25 : 0.13), hy, hz], 0.1, 0.11);
  b.col(o.skin, 0.85, 1).sphere(0, 1.585, 0.02, 0.105, 6, 4);
  if (o.hat) { b.col(o.hat, 0.9, 1); b.cyl(0, 1.63, 0, 0.1, 0.108, 0.15, 7); }
  if (o.arms === 'dig') { b.col([0.2, 0.15, 0.1]); b.beam([0.0, 0.95, 0.4], [0.0, 0.05, 0.75], 0.045); }      // the mattock's haft
}

// ---------- what hangs on the haul face: the monks' way, the cave's things, nests, the fig, brushwood, the garden ----------
async function buildFace(ctx, env) {
  const { b, rb, cl, mv, C, st } = env, fx = env.faceX, r = st('face'), note = env.note;
  const maxX = (z, y0, y1) => { let m = -1e9; for (let y = y0; y <= y1; y += 0.5) m = Math.max(m, fx(z, y)); return m; };
  const ladder = (z, y0, y1, skew, pegs) => {                                           // rails and rungs are ribbons; it hangs plumb from two oak pegs
    const x = maxX(z, y0, y1) + 0.3, zt = z + skew;
    for (const s of [-0.22, 0.22]) rb.seg([x, y0, z + s], [x, y1, zt + s], 0.07, C.oak, 1.5);
    const n = Math.round((y1 - y0) / 0.33);
    for (let i = 1; i < n; i++) { const t = i / n, zz = lerp(z, zt, t), yy = lerp(y0, y1, t); rb.seg([x, yy, zz - 0.22], [x, yy, zz + 0.22], 0.035, C.oak, 1.0); }
    if (pegs) for (const s of [-0.3, 0.3]) { b.col(C.oakDark, 0.7, 1).surf(0); b.beam([fx(zt + s, y1 - 0.1) - 0.3, y1 - 0.14, zt + s], [x + 0.14, y1 - 0.05, zt + s], 0.11, 0.11); }
    note('ladders and pegs', x + 0.2, y0, y1, z - 0.6, z + 0.6);
    return x;
  };
  // THE MONKS' WAY: 26 lengths of 7 m at z -44 from the platform to the iron door; the top length drawn up
  let y = PLAT_Y + 0.4;
  for (let i = 0; i < 25; i++) { ladder(WAY_Z + (i % 2 ? 0.35 : -0.35), y, y + 7, r.range(-0.12, 0.12), true); y += 7.2; if (i % 6 === 5) await ctx.yield(); }
  { const z = WAY_Z + 1.5, x = ladder(z, y + 5, y + 12, 0, false); b.col(C.oakDark, 0.7, 1).surf(0); b.beam([fx(z, y + 13) - 0.3, y + 13, z], [x + 0.2, y + 13.05, z], 0.12, 0.12); rb.seg([x, y + 12, z], [x + 0.1, y + 13, z], 0.04, C.rope, 1.5); }
  { const xw = fx(WAY_Z, DOOR_Y + 1), z = WAY_Z;                                         // the iron door in its stone frame, a plank sill on two pegs
    b.col(C.stone, 0.8, 1).surf(S.SURF.MASONRY, 0, 0.7);
    b.box(xw - 0.5, DOOR_Y - 0.1, z - 0.8, xw + 0.14, DOOR_Y + 1.95, z - 0.45, { m: 1, capStyle: S.SURF.MASONRY }); b.box(xw - 0.5, DOOR_Y - 0.1, z + 0.45, xw + 0.14, DOOR_Y + 1.95, z + 0.8, { m: 1, capStyle: S.SURF.MASONRY });
    b.box(xw - 0.5, DOOR_Y + 1.7, z - 0.8, xw + 0.2, DOOR_Y + 2.05, z + 0.8, { m: 1, bottom: true, capStyle: S.SURF.MASONRY });
    b.col(C.iron, 0.8, 1).surf(0); b.box(xw - 0.12, DOOR_Y, z - 0.45, xw - 0.05, DOOR_Y + 1.7, z + 0.45, {});
    b.col([0.03, 0.03, 0.03]); b.box(xw - 0.5, DOOR_Y, z - 0.45, xw - 0.13, DOOR_Y + 1.7, z + 0.45, { top: false });
    b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(xw - 0.2, DOOR_Y - 0.14, z - 0.9, xw + 0.95, DOOR_Y - 0.06, z + 0.9, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
    b.col(C.oakDark, 0.7, 1).surf(0); for (const s of [-0.7, 0.7]) b.beam([xw - 0.4, DOOR_Y - 0.22, z + s], [xw + 0.95, DOOR_Y - 0.2, z + s], 0.12, 0.12);
    env.doorAt = [xw, DOOR_Y, z];
  }
  // the platform at the ladders' foot, with bales and two lay servants roping them
  { let xr = 1e9; for (let z = -47; z <= -41; z += 0.5) xr = Math.min(xr, fx(z, PLAT_Y)); const X1 = 4.5;
    b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(xr - 0.3, PLAT_Y - 0.1, -47, X1, PLAT_Y, -41, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
    b.col(C.timberDark, 0.75, 1).surf(0);
    for (const z of [-46.6, -44, -41.4]) { b.beam([xr - 0.4, PLAT_Y - 0.24, z], [X1 + 0.15, PLAT_Y - 0.24, z], 0.2, 0.26); b.beam([fx(z, PLAT_Y - 4.5) - 0.3, PLAT_Y - 4.6, z], [X1 - 0.7, PLAT_Y - 0.36, z], 0.2, 0.22); }
    for (const z of [-46.9, -44.9, -42.9, -41.1]) { b.beam([X1 - 0.08, PLAT_Y, z], [X1 - 0.08 + r.range(-0.05, 0.08), PLAT_Y + 1.05, z + r.range(-0.06, 0.06)], 0.09, 0.09); }
    rb.sag([X1 - 0.08, PLAT_Y + 1.0, -46.9], [X1 - 0.08, PLAT_Y + 1.0, -41.1], 0.05, 6, 0.07, C.oak, 1.5);
    const bale = (x, yy, z, ry) => { b.tr(x, yy, z, ry); b.col(C.sack, 0.8, 1.05).surf(0); b.box(-0.5, 0, -0.32, 0.5, 0.56, 0.32, {}); b.pop();
      for (const s of [-0.25, 0.25]) { const c = Math.cos(ry), sn = Math.sin(ry), px = x + s * c, pz = z - s * sn; rb.poly([[px + 0.34 * sn, yy + 0.02, pz + 0.34 * c], [px + 0.34 * sn, yy + 0.58, pz + 0.34 * c], [px - 0.34 * sn, yy + 0.58, pz - 0.34 * c], [px - 0.34 * sn, yy + 0.02, pz - 0.34 * c]], 0.03, C.rope, 1.2); } };
    const bx0 = Math.max(xr, 0) + 0.9;
    bale(bx0, PLAT_Y, -45.6, 0.1); bale(bx0 + 0.1, PLAT_Y, -44.8, -0.08); bale(bx0, PLAT_Y, -43.9, 0.05); bale(bx0 + 0.05, PLAT_Y + 0.57, -45.2, 0.2); bale(bx0, PLAT_Y + 0.57, -44.3, -0.15); bale(bx0 + 1.2, PLAT_Y, -42.4, 1.2);
    for (const [fxp, fz, ry] of [[bx0 + 1.05, -45.0, -1.45], [bx0 + 1.95, -42.9, -2.5]]) {
      const v0 = mv.b.nv; mv.b.tr(fxp, PLAT_Y, fz, ry); figure(mv.b, { robe: C.robeLay, skin: C.skin, hat: C.capLay, arms: 'dig' }); mv.b.pop();
      mv.anim(v0, [fxp, PLAT_Y + 0.75, fz], 3, r.range(0, TAU), 0.2, r.range(1.1, 1.6));
    }
    note('platform', X1 + 0.2, PLAT_Y - 5, PLAT_Y + 2, -47.2, -40.8);
  }
  await ctx.yield();
  // THE CAVE: dry-stone wall 0.7 m inside the lip (full height with a plank door over the south 3.3 m, a breast wall over the rest), three ladders from the ledge at 24
  { const y0 = CAVE.y0, y1 = CAVE.y1, zm = -21.8, xa = -0.95, xb = -0.45;
    const rw = env.rw; rw.col(rubTone(env), 0.74, 1.05).surf(0);                          // M4b P4: rubble (a mesh and a material of its own); the breast wall's top uneven; a timber lintel over the door
    { const zs = [CAVE.z0 - 0.1, CAVE.z0 + 1.1, CAVE.z0 + 2.5, zm], hs = [0.92, 0.74, 1.0]; for (let i = 0; i < 3; i++) rw.box(xa, y0, zs[i], xb, y0 + hs[i], zs[i + 1], {}); }
    rw.box(xa, y0, zm, xb, y1 + 0.05, -20.5, {}); rw.box(xa, y0, -19.6, xb, y1 + 0.05, CAVE.z1 + 0.1, {}); rw.box(xa, y0 + 1.83, -20.5, xb, y1 + 0.05, -19.6, { bottom: true });
    b.col(C.oakDark, 0.75, 1).surf(0); b.beam([xb - 0.07, y0 + 1.74, -20.85], [xb - 0.07, y0 + 1.74, -19.25], 0.22, 0.18);
    b.col(C.timber, 0.7, 1).surf(S.SURF.PLANKS); b.box(xb - 0.16, y0 + 0.02, -20.5, xb - 0.1, y0 + 1.65, -19.6, { m: 1 });
    b.col([0.02, 0.02, 0.02]).surf(0); b.box(xa + 0.05, y0 + 0.02, -20.5, xb - 0.17, y0 + 1.65, -19.6, { top: false });
    let yy = 24.3; for (let i = 0; i < 3; i++) { ladder(-20.5 + (i % 2 ? 0.3 : -0.3), yy, yy + 6, r.range(-0.1, 0.1), true); yy += 6.75; }
    // the cord of kerchiefs across the mouth, and three on poles
    const N = clamp(Math.round(env.opts.kerchiefs ?? 14), 9, 20), a = [0.15, y1 - 0.3, CAVE.z0 - 0.1], e = [0.15, y1 - 0.5, CAVE.z1 + 0.1], cols = [C.kRed, C.kSaffron, C.kWhite, C.kIndigo, C.kGreen];
    for (const p of [a, e]) { b.col(C.oakDark, 0.7, 1).surf(0); b.beam([fx(p[2], p[1]) - 0.3, p[1] - 0.02, p[2]], [p[0] + 0.05, p[1], p[2]], 0.08, 0.08); }
    const pts = rb.sag(a, e, 0.5, 2 * N + 2, 0.025, C.rope, 1.5); let lastC = -1;
    for (let i = 0; i < N; i++) { let ci = r.int(0, 4); if (ci === lastC) ci = (ci + 1 + r.int(0, 3)) % 5; lastC = ci; const p = pts[2 * i + 1], q = pts[2 * i + 2]; cl.add([p[0], p[1], p[2] + 0.02], [q[0], q[1], q[2] - 0.03], r.range(0.42, 0.56), mul3(cols[ci], r.range(0.85, 1.05)), r.range(0, 40), 1); }
    for (const [z, py] of [[CAVE.z0 - 0.9, y0 + 2.5], [-22, y1 + 0.8], [CAVE.z1 + 0.9, y0 + 2.8]]) {
      const x0 = fx(z, py) - 0.2, tip = [x0 + 1.5 * Math.cos(40 * DEG), py + 1.5 * Math.sin(40 * DEG), z], mid = [lerp(x0, tip[0], 0.64), lerp(py, tip[1], 0.64), z];
      rb.seg([x0, py, z], tip, 0.045, C.oak, 1.5); cl.add(tip, [mid[0], mid[1], z + 0.02], 0.5, cols[r.int(0, 4)], r.range(0, 40), 0.8);
      note('kerchief poles', tip[0] + 0.12, py - 0.6, tip[1] + 0.1, z - 0.2, z + 0.5);
    }
    note('kerchief cord and cloths', 0.15 + 0.12, y1 - 1.6, y1, CAVE.z0 - 0.2, CAVE.z1 + 0.5);
  }
  await ctx.yield();
}

async function buildFaceLife(ctx, env) {
  const { b, mv, C, st, beds } = env, fx = env.faceX, r = st('face-life'), note = env.note;
  // swifts' mud nests in three clusters under the brow's top bed
  { const yb = TOP - 3.4; for (let c = 0; c < 3; c++) { const zc = r.range(-44, 44); for (let i = 0; i < r.int(4, 6); i++) { const z = zc + r.range(-2.2, 2.2), yy = yb - r.range(0.12, 0.3); b.col(mul3(C.mud, r.range(0.8, 1.1)), 0.7, 1).surf(0); b.sphere(fx(z, yy) + 0.04, yy, z, r.range(0.14, 0.19), 6, 3, { sy: 0.85 }); } } }
  // the wild fig in its crack at (0, 66, -31): crown 2.5 m across
  { const v0 = mv.b.nv, root = [fx(-31, 66) - 0.2, 66, -31], B = mv.b;
    B.col(C.figWood, 0.7, 1).surf(0); B.tube([root, [root[0] + 0.25, 66.35, -30.95], [-0.3, 66.7, -31.05], [-0.1, 67.05, -31]], (t) => 0.09 - 0.05 * t, 5);
    for (let i = 0; i < 6; i++) {                                                          // M4b P2: an open crown (the same numbers of the stream as before): six leaf masses, three lesser ones, three twigs
      const a = r.range(0, TAU), q = r.range(0.15, 0.6), rr = r.range(0.48, 0.64), gold = r(), dy = r.range(-0.3, 0.35), lc = mix3(C.figLeaf, C.figGold, i % 3 === 1 ? 0.3 + 0.6 * gold : 0.5 * gold), c = [q * Math.cos(a) * 0.9, 67 + dy, -31 + q * Math.sin(a)], r1 = 0.6 * rr;
      leafMass(B, c, r1 * 0.9, r1 * 0.7, r1, a + i, mul3(lc, 1.0), mul3(lc, 0.42));
      if (i % 2 === 0) { leafMass(B, [c[0] + 0.2 * Math.cos(a), c[1] + 0.2, c[2] + 0.28 * Math.sin(a)], 0.22, 0.16, 0.24, a + 2 * i, mul3(lc, 1.08), mul3(lc, 0.45)); B.col(C.figWood, 0.75, 1); B.tube([[-0.2, 66.75, -31.03], [c[0], c[1] - 0.2 * r1, c[2]]], 0.022, 3); }
    }
    mv.anim(v0, root, 4, r.range(0, TAU), 0.045, 1.3); note('fig', 1.4, 64.8, 68.2, -32.4, -29.6);
  }
  // brushwood and dry grass on every ledge over 0.7 m wide (the cave's lip and the ladders' feet stay bare)
  let count = 0;
  for (const lv of env.sh.levels) {
    const L = lv.L; if (L < -6 || L > 226) continue;
    for (let z = -56; z <= 52; z += 2.5) {
      const zz = z + r.range(-0.9, 0.9), Ly = env.relief ? env.relief.bedY(zz, L) : L, xin = fx(zz, Ly + 0.12), w = fx(zz, Ly - 0.12) - xin, keep = r.chance(0.7), rad = r.range(0.3, 0.55), tone = r(), ph = r.range(0, TAU);
      if (w < 0.7 || !keep || count > 220) continue;
      if ((L === CAVE.y0 && zz > CAVE.z0 - 1 && zz < CAVE.z1 + 1) || Math.abs(zz + 20.5) < 1.3 || Math.abs(zz - WAY_Z) < 1.6) continue;
      const rr = Math.min(0.42 * w, rad), v0 = mv.b.nv, p = [xin + 0.5 * w, Ly + 0.02, zz];
      mv.b.col(mix3(C.dryGrass, C.brush, tone), 0.6, 1.1).surf(0); mv.b.sphere(p[0], p[1] + rr * 0.55, p[2], rr, 5, 3, { sy: 0.75 });
      mv.anim(v0, p, 4, ph, 0.05, 1.7); count++;
    }
    await ctx.yield();
  }
  // the ledge garden 9 m under the brow: beds of earth, rows of greens, two monks digging
  { const gy = GARDEN.y;
    for (let z = GARDEN.z0 + 2.5; z < GARDEN.z1 - 2.5; z += 2.2) {
      const xi = Math.max(fx(z, gy + 0.3), fx(z + 1.8, gy + 0.3)) + 0.35, xo = Math.min(fx(z, gy - 0.12), fx(z + 1.8, gy - 0.12)) - 0.45; if (xo - xi < 0.8) continue;
      b.col(C.earth, 0.85, 1).surf(0); b.box(xi, gy - 0.02, z, xo, gy + 0.09, z + 1.8, {});
      for (let k = 0; k < 4; k++) for (const xx of [lerp(xi, xo, 0.25), lerp(xi, xo, 0.72)]) { b.col(mix3(C.greens, C.figGold, r() * 0.4), 0.7, 1.1); b.sphere(xx, gy + 0.16, z + 0.25 + k * 0.43, r.range(0.11, 0.17), 5, 3, { sy: 0.8 }); }
    }
    for (const [z, ry] of [[-52.6, -Math.PI / 2], [-46.4, Math.PI / 2]]) {
      const x = lerp(fx(z, gy + 0.3), fx(z, gy - 0.12), ry < 0 ? 0.62 : 0.42), v0 = mv.b.nv;
      mv.b.tr(x, gy + 0.05, z, ry); figure(mv.b, { robe: C.robeMonk, skin: C.skin, hat: C.hatMonk, arms: 'dig' }); mv.b.pop();
      mv.anim(v0, [x, gy + 0.8, z], 3, r.range(0, TAU), 0.24, r.range(1.3, 1.7));
    }
    note('garden and diggers', env.lipX(-50) - 3.5, gy - 0.2, gy + 2, GARDEN.z0, GARDEN.z1);
  }
  env.tufts = count;
}

// M4b P2: A LEAF MASS: a lumpy piece (no ball: its girth swells and shrinks three times round, and twice more aslant), 30 triangles,
// lit above and dark beneath (top and low colours), mottled round. c: its middle; rx, ry, rz: half sizes; ph: its own phase.
function leafMass(B, c, rx, ry, rz, ph, top, low, nu = 5) {
  return B.grid(nu, 3, (u, v) => { const a = -TAU * u, e = (v - 0.5) * Math.PI, ce = Math.cos(e), k = 1 + 0.26 * Math.sin(3 * a + ph) * ce + 0.16 * Math.sin(2 * a + 1.7 * ph + 3 * e); return [c[0] + rx * k * ce * Math.cos(a), c[1] + ry * k * Math.sin(e), c[2] + rz * k * ce * Math.sin(a)]; },
    { colorFn: (u, v) => mul3(mix3(low, top, sstep(0.2, 0.8, v)), 0.9 + 0.14 * Math.sin(5 * TAU * u + ph)) });
}
// m3b B4: LIFE ON THE HAUL FACE, by place and by streams of its own (face-bushes, face-fig, face-nests): five to nine bushes rooted
// on the relief's ledges and in the clefts' corners, one small fig (crown 1.8 m) in a cleft, two clusters of martins' mud cups under
// roofs of the relief 0.45 m deep or more (no birds: the world flies them). None within 7 m of an anchor's box; no outermost point
// nearer than 9.5 m to the flown line (so the least clear number of the part stays the brow's).
async function buildHaulLife(ctx, env) {
  const RL = env.relief, life = env.haulLife = [], S0 = env.sites; if (!RL || !S0) return;
  const { b, mv, C, st, line } = env, fx = env.faceX, note = env.note, B = mv.b, r2 = (v) => Math.round(v * 100) / 100, rg = st('face-growth'); rg.range(5, 7);   // (its first number is the fig's crown, dealt with the sites)
  const far = (x, y, z, rad) => lineDist(line, x, y, z) - rad >= 9.5;
  const DARK = mul3(C.cypress, 0.8), OLV = mul3(C.olive, 0.5), RUST = lin('#8a5a2c'), rb = env.rb;
  // M4 W7: BUSHES of 2 to 4 m: a stem and four to six lobes, dark green and olive, darker below
  for (const q of S0.bushes) {
    const [x, y, z] = q.at, size = q.size, R = 0.5 * size, v0 = B.nv, n = q.n + 2 + (rg.chance(0.5) ? 1 : 0), cx = x + 0.3 * size, cy = y + 0.45 * size;
    B.col(C.figWood, 0.7, 1).surf(0); B.tube([[x - 0.2, y - 0.05, z], [x + 0.1, y + 0.15 * size, z], [cx, cy - 0.2 * R, z]], (t) => (0.04 - 0.02 * t) * size, 4);
    // M4b P2 (addendum 16): AN OPEN CROWN. From the stem's head four or five BRANCHES fan out up and along the face (as the net sees
    // them; 70 to 88 hundredths of the half width long, leaning out into the air), each with a pad of leaves at its end and one or two
    // lesser pads along it, left and right by turns: flat pads (0.55 to 0.8 as high as wide), air and the branches between them, an
    // outline of its own. Olive and dark green, the ends lighter; a pad in seven gone yellow, one in seven rust (October). Within
    // the old bounds.
    const nb = n > 5 ? 5 : 4, green = mix3(mix3(DARK, OLV, q.tone), C.greens, 0.2), F = [cx, cy - 0.2 * R, z], th0 = rg.range(-0.15, 0.15);
    for (let i = 0; i < nb; i++) {
      const th = th0 - 1.1 + 2.2 * (i + rg.range(0.25, 0.75)) / nb, l = R * rg.range(0.7, 0.88), ox = R * rg.range(0.1, 0.4), cs = Math.cos(th), sn = Math.sin(th);
      const E = [F[0] + ox, F[1] + l * cs, z + clamp(l * sn, -0.72 * R, 0.72 * R)], M = [(F[0] + E[0]) / 2 + 0.05 * R, (F[1] + E[1]) / 2 + 0.1 * l, (z + E[2]) / 2], km = rg() < 0.6 ? 3 : 2;
      B.col(C.figWood, 0.75, 1).surf(0); B.tube([F, M, E], (t) => (0.022 - 0.012 * t) * size, 3);
      for (let k = 0; k < km; k++) {
        const t = k === 0 ? 1 : k === 1 ? rg.range(0.5, 0.68) : rg.range(0.28, 0.4), sd = (k === 1 ? 1 : -1) * (i & 1 ? 1 : -1), rr = R * (k === 0 ? rg.range(0.2, 0.26) : rg.range(0.15, 0.2)), oct = rg(), fl = rg.range(0.55, 0.8), wz = rg.range(1, 1.15);
        const A = t < 0.5 ? F : M, Bq = t < 0.5 ? M : E, f = t < 0.5 ? 2 * t : 2 * t - 1, off = k === 0 ? 0 : sd * 0.7 * rr;
        const c = [lerp(A[0], Bq[0], f) + (k === 0 ? 0 : 0.1 * R), lerp(A[1], Bq[1], f) + 0.3 * rr - off * sn, lerp(A[2], Bq[2], f) + off * cs];
        const top = oct > 0.86 ? mix3(green, RUST, 0.45) : oct > 0.72 ? mix3(green, C.figGold, 0.3) : mul3(green, k === 0 ? 1.12 : 0.95);
        leafMass(B, c, rr * 0.9, rr * fl, rr * wz, q.ph + i * 1.7 + k, mul3(top, 1.25), mul3(top, 0.5), k === 0 ? 5 : 4);
      }
    }
    mv.anim(v0, q.at, 4, q.ph, 0.03, 1.5); life.push({ kind: q.onLedge ? 'bush on a ledge' : 'bush in a cleft', at: q.at.map(r2), size: r2(size) });
    note('bushes of the haul face', x + 0.85 * size, y - 0.2, y + size, z - 0.6 * size, z + 0.6 * size);
  }
  await ctx.yield();
  // M4 W7: THE FIG, a crown of 5 to 7 m out of a cleft's corner (its roots' dark stain below is in the rock's born table)
  if (S0.fig) { const [x, y, z] = S0.fig.at, cr = S0.fig.crown, R = 0.5 * cr, r = S0.fig.rng, v0 = B.nv, root = [x - 0.15, y, z], cx = x + 0.3 * cr, cy = y + 0.45 * cr;
    B.col(C.figWood, 0.7, 1).surf(0); B.tube([root, [x + 0.3, y + 0.5, z + 0.1], [x + 0.7, y + 1.3, z - 0.1], [cx - 0.2, cy - 0.35 * R, z]], (t) => 0.2 - 0.1 * t, 5);
    B.tube([[x + 0.7, y + 1.3, z - 0.1], [cx, cy - 0.15 * R, z - 0.5 * R]], (t) => 0.1 - 0.04 * t, 4); B.tube([[x + 0.5, y + 0.9, z], [cx - 0.1, cy - 0.1 * R, z + 0.55 * R]], (t) => 0.1 - 0.04 * t, 4);
    for (let i = 0; i < 9; i++) {
      const old = i < 5, a = old ? r.range(0, TAU) : TAU * (i - 5 + rg()) / 4, q = (old ? r.range(0.1, 0.45) : rg.range(0.3, 0.5)) * 1.25, rr = (old ? r.range(0.34, 0.46) : rg.range(0.3, 0.42)) / 0.9, dy = (old ? r.range(-0.25, 0.3) : rg.range(-0.3, 0.35)) / 0.9, gold = (old ? r() : rg()) * 0.35, sp = 1.24;   // (addendum 16: the masses half as far again from the middle, a seventh smaller: air between)
      // M4b P2: an open crown: nine leaf masses and three lesser ones, a third of them gone yellow (a fig in October), twigs between
      const lc = mix3(mix3(C.figLeaf, C.cypress, 0.35), C.figGold, i % 3 === 1 ? 0.35 + 1.4 * gold : gold), c = [cx + 0.45 * R * q * sp * Math.cos(a), cy + dy * R, z + R * q * sp * Math.sin(a)], r1 = 0.5 * rr * R;
      leafMass(B, c, r1 * 0.9, r1 * 0.7, r1, S0.fig.ph + i * 1.3, mul3(lc, 0.95), mul3(lc, 0.4));
      if (i % 3 === 0) leafMass(B, [c[0] + 0.12 * R * Math.cos(a), c[1] + 0.16 * R, c[2] + 0.22 * R * Math.sin(a)], 0.14 * R, 0.1 * R, 0.14 * R, S0.fig.ph + i * 2.1, mul3(lc, 1.05), mul3(lc, 0.45));
      if (i % 2 === 1) { B.col(C.figWood, 0.75, 1); B.tube([[cx - 0.1 * R, cy - 0.25 * R, z], [c[0], c[1] - 0.3 * r1, c[2]]], 0.05, 3); }
    }
    mv.anim(v0, root, 4, S0.fig.ph, 0.025, 1.3); life.push({ kind: 'fig in a cleft', at: [x, y, z].map(r2), size: r2(cr) }); note('fig of the haul face', x + 0.85 * cr, y, y + cr, z - 0.6 * cr, z + 0.6 * cr); }
  // nests (m3b, as dealt; the droppings under them are in the rock's born table)
  { const r = S0.nestRng, MUD = mix3(C.mud, lin('#b9a88a'), 0.55);
    for (const [p, zc] of S0.nests) {
      const n = r.int(7, 12), yb = RL.bedY(zc, p); let k = 0, xm = -1e9;
      for (let i = 0; i < n; i++) {
        const z = zc + r.range(-1.7, 1.7), yy = RL.bedY(z, p) - r.range(0.1, 0.26), rad = r.range(0.15, 0.2), tone = r.range(0.85, 1.1); if (-RL.stepAt(p, z) < 0.3) continue;
        const x = fx(z, yy) + 0.05; b.col(mul3(MUD, tone), 0.7, 1).surf(0); b.sphere(x, yy, z, rad, 5, 3, { sy: 0.85 }); k++; xm = Math.max(xm, x + rad);
      }
      if (k) { life.push({ kind: 'mud nests under a roof', at: [r2(xm), r2(yb), r2(zc)], cups: k }); note('mud nests of the haul face', xm + 0.05, yb - 0.5, yb, zc - 2, zc + 2); }
    } }
  await ctx.yield();
  // M4 W7: IVY OR CAPER CURTAINS (stream 'face-curtains'): four to seven, each rooted on a true ledge of the relief and hanging 5 to
  // 12 m over its lip, 2 to 5 m wide, in five to eight strands that lie on the rock where it stands out and hang free where it stands back
  { const r = st('face-curtains'), rp = st('face-hangers'), want = r.int(4, 7), runs = S0.runs.filter((q) => q.z1 - q.z0 >= 2.5), done = [];
    for (let tries = 0; done.length < want && runs.length && tries < 160; tries++) {
      const q = runs[r.int(0, runs.length - 1)], wd = Math.min(r.range(2, 5), q.z1 - q.z0), len = r.range(5, 12), f = r(), ns = r.int(5, 8), tone = r(), ph = r.range(0, TAU);
      const zc = lerp(q.z0 + wd / 2, q.z1 - wd / 2, f), yt = RL.bedY(zc, q.p); let ok = yt - len > 2 && !done.some((o) => Math.abs(o[0] - zc) < 9 && Math.abs(o[1] - yt) < 16);
      for (let t = 0; t <= 1 && ok; t += 0.25) { const yy = yt - len * t; if (RL.mask(zc, yy) < 1 || !far(fx(zc, yy) + 0.6, yy, zc, wd / 2) || RL.cells.some((c) => Math.abs(zc - c.zc) < c.hw + wd / 2 + 1.5 && yy > c.p - 3 && yy < c.p + c.h + 5)) ok = false; }
      if (!ok) continue;
      // M4b P1: A HANGING PLANT (caper, ivy) in place of the curtain: five to eight narrow strands out of the ledge's crack, each a thin
      // stem (a ribbon) set with small leaves (0.2 to 0.36 m, a triangle each, left and right by turns, each tilted its own way, so
      // each takes the sun its own way), of unequal length, ragged below, air between them; the whole 1.2 to 2.4 m wide and 3 to 8 m
      // long; two leaf masses at its root. (The curtain's numbers are still drawn, so each plant stands where its curtain stood;
      // its own numbers come from a stream of their own, 'face-hangers'.)
      for (let j = 0; j < ns; j++) { r.range(-0.3, 0.3); r.range(0.45, 1); r.range(1, 1.5); r.range(0.8, 1.1); } for (let i = 0; i < 9; i++) r();
      const wn = Math.min(2.4, 1.2 + 0.4 * (wd - 2), wd), ln = 3 + (len - 5) * 5 / 7, base = mix3(mix3(C.greens, OLV, 0.3 + 0.5 * tone), DARK, 0.25); let xo = -1e9;
      b.col(base, 1, 1).surf(0);
      for (let j = 0; j < ns; j++) {
        const zj = zc - wn / 2 + wn * (j + 0.5 + rp.range(-0.35, 0.35)) / ns, lj = ln * rp.range(0.4, 1), sg = clamp(Math.round(lj / 0.9), 2, 8), drift = rp.range(-0.35, 0.35), yj = RL.bedY(zj, q.p) + 0.1, pts = [[fx(zj, yj) + 0.12, yj, zj]];
        let side = rp.sign(), nl = 0;
        for (let k = 1; k <= sg; k++) {
          const pv = pts[k - 1], yk = yj - lj * k / sg, zk = zj + 0.12 * Math.sin(1.9 * k + 2.4 * j + ph) + drift * k / sg, xk = Math.max(fx(zk, yk) + 0.1, fx(zk, (yk + pv[1]) / 2) + 0.1, pv[0] - 0.25), m = Math.max(1, Math.round((pv[1] - yk) / 0.42));
          pts.push([xk, yk, zk]); xo = Math.max(xo, xk + 0.25);
          for (let i = 0; i < m && nl < 14; i++, nl++) {
            const t = (i + rp.range(0.2, 0.8)) / m, P = [lerp(pv[0], xk, t), lerp(pv[1], yk, t), lerp(pv[2], zk, t)], l = lerp(0.36, 0.2, (k - 1 + t) / sg) * rp.range(0.8, 1.2), out = rp.range(0.03, 0.22), gone = rp() > 0.86, lc = mul3(gone ? mix3(base, C.figGold, 0.4) : base, 0.7 + 0.75 * rp());
            const Bv = [P[0] + out, P[1] - 0.75 * l, P[2] + side * 0.5 * l], Cv = [P[0] + 0.5 * out + 0.02, P[1] - 0.08 * l, P[2] + side * 0.85 * l];
            if (side > 0) b.tri(P, Cv, Bv, lc); else b.tri(P, Bv, Cv, lc);                  // (its face to the air)
            side = -side;
          }
        }
        rb.poly(pts, 0.035, mul3(C.figWood, 0.8), 1.2);
      }
      for (let i = 0; i < 2; i++) { const zz = zc + wn * (i - 0.5) * 0.4 + rp.range(-0.2, 0.2), yy = RL.bedY(zz, q.p), rr = rp.range(0.3, 0.45), v0 = B.nv, lc = mul3(base, rp.range(0.9, 1.15)); B.surf(0); leafMass(B, [fx(zz, yy + 0.25) + 0.3, yy + 0.25, zz], rr * 0.8, rr * 0.6, rr * 1.2, ph + i, mul3(lc, 1.25), mul3(lc, 0.5)); mv.anim(v0, [fx(zz, yy + 0.25), yy, zz], 4, ph + i, 0.03, 1.6); xo = Math.max(xo, fx(zz, yy + 0.25) + 0.3 + 1.2 * rr); }
      done.push([zc, yt]); life.push({ kind: 'ivy curtain', at: [r2(xo), r2(yt), r2(zc)], length: r2(ln), width: r2(wn) }); note('curtains of the haul face', xo + 0.05, yt - len, yt + 1, zc - wd / 2 - 0.5, zc + wd / 2 + 0.5);
    } }
  await ctx.yield();
  // M4 W7: TUFTS OF DRY GRASS along every run of true ledge (stream 'face-tufts'): one every 1.2 to 2.5 m, 0.3 to 0.6 m high
  { const r = st('face-tufts'); let n = 0;
    for (const q of S0.runs) { for (let z = q.z0 + r.range(0.2, 1.2); z < q.z1; z += r.range(1.2, 2.5)) {
      const sz = r.range(0.3, 0.6), tone = r(), lean = r.range(-0.15, 0.15), y = RL.bedY(z, q.p), w = q.wAt(z); if (!(w >= 0.25)) continue;
      const x = fx(z, y + 0.1) + Math.min(0.5 * w, 0.3); if (!far(x, y + 0.3, z, 0.4) || RL.cells.some((c) => Math.abs(z - c.zc) < c.hw + 1 && Math.abs(y - c.p) < 1)) continue;
      b.col(mix3(C.dryGrass, C.brush, tone * 0.7), 0.7, 1.25).surf(0); b.tri([x - 0.4 * sz, y, z - 0.4 * sz], [x + 0.4 * sz, y, z + 0.1 * sz], [x + lean, y + sz, z + lean]); b.tri([x + 0.3 * sz, y, z - 0.35 * sz], [x - 0.1 * sz, y, z + 0.45 * sz], [x + 0.1 - lean, y + 0.85 * sz, z + 0.12]); b.tri([x + 0.35 * sz, y, z + 0.4 * sz], [x + 0.35 * sz, y, z - 0.4 * sz], [x + 0.3, y + 0.7 * sz, z - lean]); n++;
    } }
    env.haulTufts = n; if (n) life.push({ kind: 'tufts of dry grass on the true ledges', count: n }); }
  await ctx.yield();
}

// ---------- M4 W6: THE CLIFF HERMITAGE (streams 'hermitage' for the cells' places, at the relief; 'hermitage-things' here). Each cell:
// a rubble wall inside the mouth's lip (dark above it), a timber front with a low door and one small window, a pent roof of planks
// or slabs, a plank balcony on oblique beams with a rail, a chimney hole (its soot on the rock is in the born table), water jars,
// pots of basil; on some a line of washing, a basket on a cord, on one a plain cross. Under each a chain of hung ladders; one plank
// walk on pegs along a bed. No figure, no letter, no face. No part within 9.0 m of the flown line (a balcony is shortened to it).
async function buildHermitage(ctx, env) {
  const RL = env.relief, H = env.hermitage = { cells: [], ladders: [], walk: null, least: 1e9 }; if (!RL || !RL.cells.length) return;
  const { b, rb, cl, C, st, line } = env, fx = env.faceX, note = env.note, r = st('hermitage-things'), r1 = (v) => Math.round(v * 10) / 10, NC = RL.cells.length;
  const dist = (x, y, z) => lineDist(line, x, y, z), seen = (x, y, z) => { const d = dist(x, y, z); if (d < H.least) H.least = d; return d; };
  const maxX = (z, y0, y1) => { let m = -1e9; for (let y = y0; y <= y1 + 1e-6; y += 0.5) m = Math.max(m, fx(z, y)); return m; };
  const RUB = rubTone(env), rw = env.rw, POT = mix3(C.tile, lin('#a8623f'), 0.5), DARKH = [0.022, 0.02, 0.018];
  // the old things' boxes (way strip, cave mouth, ledge of cloths, lower ledge, cave's ladders, niche, fig): a ladder keeps 1.5 m from a thing and
  // does not cross a ledge, but it may stand on one
  const hits = (z, y0, y1) => z < -50 || z > 46 || RL.boxes.some((q, i) => { const led = i === 2 || i === 3, m = led ? 0.4 : 1.5, dl = led ? RL.lift(z, q[3]) : 0; return z > q[0] - m && z < q[1] + m && y1 > q[2] + dl - (led ? 0 : m) && y0 < q[3] + dl - (led ? 0.35 : -m); });
  // a place to stand at z between two heights, the highest: the cave's two ledges (y 44 and y 24) and the runs of true ledge
  const runs = env.sites ? env.sites.runs : [];
  const standAt = (z, yHi, yLo) => { let best = null; const t = (y) => { if (y <= yHi && y >= yLo && (best === null || y > best)) best = y; };
    if (z > -32 && z < -12.5) { t(RL.bedY(z, 44)); t(RL.bedY(z, 24)); }                   // M4b: the ledges jog with their beds
    for (const q of runs) if (z >= q.z0 && z <= q.z1 && q.wAt(z) >= 0.3) t(RL.bedY(z, q.p));
    return best; };
  // a ladder hung from two oak pegs (rails and rungs are ribbons): plumb, or (stands) with its foot on a ledge and leaning on the wall; null when
  // it would come within 9.05 m of the flown line, on an old thing or across a cell
  const ladder = (z, y0, y1, skew, stands) => {
    const zt = z + skew; let xT = maxX(z, y0, y1) + 0.3, xF = xT;
    if (stands) { xT = fx(z, y1 - 0.1) + 0.3; xF = Math.min(xT, fx(z, y0 + 0.2) + 0.45); let d = 0; for (let i = 1; i < 12; i++) { const t = i / 12, yy = lerp(y0, y1, t); d = Math.max(d, fx(lerp(z, zt, t), yy) + 0.15 - lerp(xF, xT, t)); } xT += d; xF += d; }
    const x = Math.max(xT, xF);
    for (const yy of [y0, (y0 + y1) / 2, y1]) if (dist(x + 0.25, yy, z) < 9.05) return null;
    if (hits(z, y0, y1) || RL.cells.some((c) => Math.abs(z - c.zc) < c.hw + 0.3 && y0 < c.p + c.h && y1 > c.p + 1.2)) return null;
    for (const sg of [-0.22, 0.22]) rb.seg([xF, y0, z + sg], [xT, y1, zt + sg], 0.07, C.oak, 1.5);
    const n = Math.round((y1 - y0) / 0.36); for (let i = 1; i < n; i++) { const t = i / n, zz = lerp(z, zt, t), yy = lerp(y0, y1, t), xx = lerp(xF, xT, t); rb.seg([xx, yy, zz - 0.22], [xx, yy, zz + 0.22], 0.035, C.oak, 1.0); }
    b.col(C.oakDark, 0.7, 1).surf(0); for (const sg of [-0.3, 0.3]) b.beam([fx(zt + sg, y1 - 0.1) - 0.3, y1 - 0.14, zt + sg], [xT + 0.14, y1 - 0.05, zt + sg], 0.11, 0.11);
    seen(x + 0.2, y0, z); seen(x + 0.2, y1, z); note('ladders of the hermitage', x + 0.2, y0, y1, z - 0.6, z + 0.6); H.ladders.push({ z: r1(z), y0: r1(y0), y1: r1(y1) });
    return xF;
  };
  // the plan of a chain from a height `top` at z going to `side`: to a stand if one lies 6 to 42 m below (equal ladders of 6 to 14 m, each foot
  // 0.6 to 1.2 m aside of the next head, half a metre of overlap), else the cell's own one to three ladders with a loose end
  const lowest = RL.cells.reduce((a, c) => (a === null || c.p < a.p ? c : a), null), GROUND = FOOT + 10;
  const chainPlan = (q, z, top, side) => {
    let st = null, n = q.nl, lens = q.ll, ground = false;
    for (let m = 1; m <= 4; m++) { let zf = z; for (let k = 0; k < m - 1; k++) zf += side * q.ls[k % 3];
      const s2 = standAt(zf, top - 6, top - 42); if (s2 === null) continue; const T = top - s2 - 0.25;
      if (Math.max(1, Math.ceil((T - 0.5) / 13.5)) === m) { const L = (T + 0.5 * (m - 1)) / m; st = s2; n = m; lens = [L, L, L, L]; break; } }
    // THE WAY UP: under the lowest cell, where the wall's foot is free (z 5 and more: no knoll, no way), the ladders go on down to 10 m over the foot
    if (q.c === lowest && top === q.p + 0.9 && Math.min(z, z + side * 8) >= 5) { st = null; const T = top - GROUND, m = Math.max(1, Math.ceil((T - 0.5) / 13.5)), L = (T + 0.5 * (m - 1)) / m; n = m; lens = [L]; ground = true; }
    return { side, z, top, n, lens, stand: st, ground };
  };
  const hang = (q, ch) => { let z = ch.z, y1 = ch.top, n = 0;
    for (let k = 0; k < ch.n; k++) {
      const y0 = y1 - ch.lens[Math.min(k, ch.lens.length - 1)], last = k === ch.n - 1; if (y0 < (ch.ground ? GROUND - 0.5 : 6)) break; const x = ladder(z, y0, y1, (q.jt[k % 8] - 0.5) * 0.2, ch.ground || (last && ch.stand !== null)); if (x === null) break; n++;
      if (last && ch.stand === null) rb.seg([x, y0, z], [x + 0.05, y0 - 1.2, z + 0.1], 0.03, C.rope, 1.2);
      z += ch.side * q.ls[k % 3]; y1 = y0 + 0.5;
    }
    return n; };
  const crossAt = r.int(0, NC - 1), washAt = r.int(0, NC - 1), basketAt = r.int(0, NC - 1), plans = [];
  for (let ci = 0; ci < NC; ci++) {
    const c = RL.cells[ci], p = c.p, zc = c.zc, hw = c.hw, sd = c.side;
    // this cell's numbers, all drawn first
    const fw = r.range(1.6, 2.4), fh = r.range(1.9, 2.15), fo = r.range(0.15, 0.4), bl = Math.min(r.range(2.5, 5), 2 * hw + 1.2), pj0 = r.range(0.9, 1.6), ro = r.range(0.5, 0.9), slab = r.chance(0.5), nj = r.int(2, 3), nb = r.int(2, 4);
    const wash = r.chance(0.35) || ci === washAt, bask = r.chance(0.25) || ci === basketAt, cord = r.range(6, 15), nl = r.int(1, 3), lz = r.sign(), tw = [r.range(0.08, 0.35), r.range(0.08, 0.35), r.range(0.08, 0.35), r.range(0.08, 0.35)], jt = [r(), r(), r(), r(), r(), r(), r(), r()];
    const ll = [r.range(6, 14), r.range(6, 14), r.range(6, 14)], ls = [r.range(0.6, 1.2), r.range(0.6, 1.2), r.range(0.6, 1.2)], nw = r.int(3, 6), walkL = r.range(8, 16);
    const zf = zc + sd * Math.min(fo * hw, hw - 0.45 - fw / 2), zl = zf - fw / 2, zr = zf + fw / 2, za = clamp(zf - bl / 2, zc - hw - 0.8, zc + hw + 0.8 - bl), zb = za + bl;
    let xs = -1e9; for (let z = Math.min(za, zc - hw); z <= Math.max(zb, zc + hw) + 1e-6; z += 0.5) xs = Math.max(xs, fx(z, p - 0.3));   // the sill: the rock under the floor
    const xw = xs - c.wallIn, z0 = zc - hw - 0.25, z1 = zc + hw + 0.25, wt = (z) => Math.min(p + c.wallK * c.h, c.top(z) - 0.08);
    // the rubble wall, its top uneven; over the timber front a lintel piece
    rw.col(RUB, 0.74, 1.05).surf(0);                                                       // M4b P4: rubble, not brick
    const piece = (a, e, k) => { if (e - a < 0.15) return; const m = (a + e) / 2; rw.box(xw - 0.45, p - 0.3, a, xw, Math.max(p + 0.6, Math.min(wt(a), wt(m)) - tw[k]), m, {}); rw.box(xw - 0.45, p - 0.3, m, xw, Math.max(p + 0.6, Math.min(wt(m), wt(e)) - tw[k + 1]), e, {}); };
    piece(z0, zl, 0); piece(zr, z1, 2); rw.box(xw - 0.45, p + fh, zl, xw, Math.max(p + fh + 0.15, Math.min(wt(zl), wt(zr)) - 0.05), zr, { bottom: true });
    // the timber front: planks, a low door and one small window (dark), posts and a lintel
    const zd = zf - sd * (fw / 2 - 0.55), zn = zf + sd * (fw / 2 - 0.45);
    b.col(C.timber, 0.7, 1).surf(S.SURF.PLANKS); b.box(xw - 0.1, p, zl, xw + 0.06, p + fh, zr, { m: 1 });
    b.col(DARKH).surf(0); for (const [ya, ye, zm, hf] of [[p + 0.04, p + 1.39, zd, 0.35], [p + 1.15, p + 1.55, zn, 0.175]]) b.quad([xw + 0.07, ya, zm + hf], [xw + 0.07, ya, zm - hf], [xw + 0.07, ye, zm - hf], [xw + 0.07, ye, zm + hf]);
    b.col(C.oakDark, 0.7, 1); for (const zz of [zl, zr]) b.beam([xw + 0.03, p, zz], [xw + 0.03, p + fh, zz], 0.13, 0.13); b.beam([xw + 0.03, p + fh, zl - 0.1], [xw + 0.03, p + fh, zr + 0.1], 0.13, 0.15);
    if (ci === crossAt) { b.col(mul3(C.oak, 1.3), 0.9, 1); b.beam([xw + 0.1, p + 1.45, zd], [xw + 0.1, p + 1.97, zd], 0.06, 0.06); b.beam([xw + 0.1, p + 1.8, zd - 0.17], [xw + 0.1, p + 1.8, zd + 0.17], 0.06, 0.06); }
    // the pent roof over the front: planks or slabs on two rafters
    { const ra = zl - 0.25, re = zr + 0.25, ry = Math.min(p + fh + 0.4, c.top(ra) - 0.12, c.top(re) - 0.12), rx = xw + 0.3 + ro;
      if (slab) b.col(mul3(C.slate, 0.95), 0.85, 1.05).surf(S.SURF.MASONRY, 0, 0.6); else b.col(mul3(C.timber, 0.92), 0.85, 1).surf(S.SURF.PLANKS);
      b.quad([rx, ry - 0.32, re], [rx, ry - 0.32, ra], [xw - 0.02, ry, ra], [xw - 0.02, ry, re], [0, 0, re - ra, 1.2]);
      b.col(C.timberDark, 0.8, 1).surf(0); b.quad([rx, ry - 0.36, ra], [rx, ry - 0.36, re], [xw - 0.02, ry - 0.04, re], [xw - 0.02, ry - 0.04, ra]);
      b.col(C.oakDark, 0.7, 1); for (const zz of [ra + 0.15, re - 0.15]) b.beam([xw - 0.05, ry - 0.07, zz], [rx - 0.03, ry - 0.39, zz], 0.08, 0.1); b.beam([rx, ry - 0.36, ra], [rx, ry - 0.36, re], 0.06, 0.09);
      seen(rx, ry, zf); }
    // the floor inside the lip, and the balcony: it stands out pj (0.9 to 1.6 m), less where the flown line is near, on oblique beams, with a rail
    let pj = pj0; const clr = (pp) => { let m = 1e9; for (const zz of [za, (za + zb) / 2, zb]) for (const yy of [p - 1.9, p + 1.9]) m = Math.min(m, dist(xs + pp + 0.12, yy, zz)); return m; };
    while (pj > 0.45 && clr(pj) < 9.05) pj -= 0.1;
    const bal = pj > 0.45; if (!bal) pj = 0.12;
    b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(xw, p - 0.02, zc - hw + 0.25, xs + 0.05, p + 0.05, zc + hw - 0.25, { m: 1, capStyle: S.SURF.PLANKS, capM: 1 });
    b.box(xs - 0.05, p - 0.03, za, xs + pj, p + 0.05, zb, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
    if (bal) { const ns = clamp(Math.round(bl / 1.4), 2, 4), np = Math.max(2, Math.round(bl / 1.25)), xr = xs + pj - 0.06; b.col(C.oakDark, 0.7, 1).surf(0);
      for (let i = 0; i < ns; i++) { const zz = za + 0.2 + (bl - 0.4) * i / (ns - 1); b.beam([fx(zz, p - 1.9) - 0.25, p - 1.9, zz], [xs + pj - 0.12, p - 0.12, zz], 0.13, 0.15); }
      for (let i = 0; i <= np; i++) { const zz = lerp(za + 0.06, zb - 0.06, i / np); rb.seg([xr, p + 0.05, zz], [xr + (jt[i % 8] - 0.5) * 0.06, p + 1.02, zz], 0.07, C.oakDark, 1.5); }
      rb.seg([xr, p + 1.0, za], [xr, p + 1.0, zb], 0.06, C.oak, 1.5); rb.seg([xr, p + 0.55, za], [xr, p + 0.55, zb], 0.04, C.oak, 1.2);
      for (const zz of [za, zb]) rb.seg([xs, p + 1.0, zz], [xr, p + 1.0, zz], 0.05, C.oak, 1.2); }
    plans.push({ c, ci, p, zc, hw, sd, xs, xw, pj, bal, za, zb, zf, zd, bl, wt, nj, nb, wash, bask, cord, nl, lz, ll, ls, nw, walkL, jt });
    seen(xs + pj + 0.05, p + 1.0, za); seen(xs + pj + 0.05, p + 1.0, zb); seen(xs + pj + 0.05, p - 0.1, (za + zb) / 2);
    if ((ci & 1) === 1) await ctx.yield();
  }
  await ctx.yield();
  // ONE PLANK WALK on pegs along a bed, 8 to 16 m, from a balcony's end (first the end away from the cell's ladder side, then the other; the
  // first cell where it can be laid has it); the cell's ladders then take its other end
  let walk = null;
  for (const q of plans) { for (const dw of [-q.lz, q.lz]) {
      const zs = dw > 0 ? q.zb : q.za, planks = []; let xp = null;
      for (let k = 0; k * 1.3 < q.walkL; k++) {
        const zk = zs + dw * 1.3 * k, ze = zk + dw * 1.3, y = RL.bedY((zk + ze) / 2, q.p), xk = Math.max(fx(zk, y - 0.2), fx(ze, y - 0.2), fx((zk + ze) / 2, y - 0.2));
        if (RL.mask(ze, y) < 1 || RL.mask(ze, y + 1.5) < 1 || dist(xk + 0.75, y + 1, ze) < 9.05 || (xp !== null && Math.abs(xk - xp) > 0.9) || RL.cells.some((c) => c !== q.c && Math.abs(ze - c.zc) < c.hw + 1 && Math.abs(y - c.p) < 5)) break;
        planks.push([zk, ze, y, xk]); xp = xk;
      }
      if (planks.length * 1.3 >= 8) { walk = { q, dw, planks }; break; } }
    if (walk) break; }
  for (const q of plans) {
    const { c, ci, p, zc, hw, sd, xs, xw, pj, bal, za, zb, zf, bl, wt, jt } = q, xr = xs + pj - 0.06;
    // the chimney hole in the wall and its soot on the stones (the soot on the rock above is in the rock's born table)
    { const hy = wt(c.chz) - 0.5; b.col(DARKH).surf(0); b.quad([xw + 0.09, hy, c.chz + 0.17], [xw + 0.09, hy, c.chz - 0.17], [xw + 0.09, hy + 0.3, c.chz - 0.17], [xw + 0.09, hy + 0.3, c.chz + 0.17]);
      b.col([0.085, 0.075, 0.07]); b.quad([xw + 0.085, hy + 0.3, c.chz + 0.3], [xw + 0.085, hy + 0.3, c.chz - 0.3], [xw + 0.085, wt(c.chz) + 0.02, c.chz - 0.42], [xw + 0.085, wt(c.chz) + 0.02, c.chz + 0.42]); }
    // water jars by the wall, pots of basil at the edge
    b.col(POT, 0.75, 1.05).surf(0); for (let k = 0; k < q.nj; k++) b.lathe(xw + 0.3 + 0.1 * (k % 2), p + 0.05, zc - sd * (0.2 + 0.22 * k) * hw, [[0.1, 0], [0.21, 0.2], [0.12, 0.45], [0.14, 0.5]], 5, { smooth: true });
    for (let k = 0; k < q.nb; k++) { const zz = sd > 0 ? za + 0.35 + 0.42 * k : zb - 0.35 - 0.42 * k, xx = bal ? xr - 0.2 : xs - 0.12; b.col(POT, 0.8, 1).surf(0); b.cyl(xx, p + 0.05, zz, 0.09, 0.12, 0.17, 5); b.col(mix3(C.greens, lin('#6fa23c'), 0.5), 0.7, 1.15); b.sphere(xx, p + 0.36, zz, 0.17, 5, 3, { sy: 0.9 }); }
    // a line of washing over the rail, between two poles at the balcony's ends (or between two pegs across the mouth)
    if (q.wash) { const xl = bal ? xr : xs + 0.12, a = [xl, p + 1.82, za + 0.05], e = [xl, p + 1.76, zb - 0.05], wc = [C.kWhite, C.sack, C.kWhite, mul3(C.robeMonk, 2.2), C.kWhite, C.sack];
      b.col(C.oakDark, 0.7, 1).surf(0); for (const pt of [a, e]) { if (bal) b.beam([pt[0], p + 1.0, pt[2]], [pt[0], pt[1] + 0.04, pt[2]], 0.06, 0.06); else b.beam([fx(pt[2], pt[1]) - 0.3, pt[1] - 0.02, pt[2]], [pt[0] + 0.04, pt[1], pt[2]], 0.07, 0.07); }
      const pts = rb.sag(a, e, 0.16, 2 * q.nw + 2, 0.02, C.rope, 1.5);
      for (let i = 0; i < q.nw; i++) cl.add(pts[2 * i + 1], pts[2 * i + 2], 0.5 + 0.4 * jt[i], mul3(wc[i], 0.85 + 0.15 * jt[7 - i]), 40 * jt[(i + 3) % 8], 0.7);
      seen(xl + 0.1, p + 1.8, (za + zb) / 2); }
    // a basket on a cord from a short jib at the rail
    if (q.bask && bal) { const zk = zf + sd * 0.4, yb = p + 1.0 - q.cord, xk = Math.max(xr + 0.32, maxX(zk, yb - 0.4, p - 2) + 0.4);
      if (xk - xr < 0.7 && dist(xk + 0.28, yb, zk) >= 9.05 && RL.mask(zk, yb) >= 1) {
        b.col(C.oakDark, 0.7, 1).surf(0); b.beam([xr - 0.3, p + 1.02, zk], [xk + 0.05, p + 1.08, zk], 0.07, 0.07); rb.seg([xk, p + 1.06, zk], [xk, yb + 0.3, zk], 0.025, C.rope, 1.3);
        b.col(C.basket, 0.75, 1.05); b.cyl(xk, yb, zk, 0.19, 0.25, 0.3, 6); seen(xk + 0.26, yb, zk); note('basket of the hermitage', xk + 0.27, yb, p + 1.1, zk - 0.3, zk + 0.3); q.basket = r1(q.cord); } }
    // a chain of one to three hung ladders under the balcony's end (each foot 0.6 to 1.2 m aside of the next head; the last hangs loose)
    { const mk = (side) => chainPlan(q, (side > 0 ? zb : za) + side * 0.45, p + 0.9, side), order = walk && walk.q === q ? [mk(-walk.dw)] : [mk(q.lz), mk(-q.lz)].sort((a, e) => (e.stand !== null || e.ground) - (a.stand !== null || a.ground));
      let n = hang(q, order[0]), used = order[0]; if (!n && order.length > 1) { n = hang(q, order[1]); if (n) used = order[1]; }
      q.ladders = n; q.side = used.side; q.stand = n === used.n && used.stand !== null ? r1(used.stand) : n === used.n && used.ground ? 'the foot' : null; }
    note('cell of the hermitage', xs + pj + 0.14, p - 2, p + c.h + 0.6, Math.min(za, zc - hw) - 0.4, Math.max(zb, zc + hw) + 0.4);
    H.cells.push({ z: r1(zc), y: r1(p), width: r1(2 * hw), height: r1(c.h), depth: r1(c.dep), balcony: bal ? r1(pj) : 0, ladders: q.ladders, stand: q.stand, washing: !!q.wash, basket: q.basket || 0, cross: ci === crossAt });
    if ((ci & 1) === 1) await ctx.yield();
  }
  // the walk itself (planned before the ladders): planks, pegs, a hand rope on pins, and a chain down from its end
  if (walk) { const { q, dw, planks } = walk, pins = [];
    for (const [zk, ze, y, xk] of planks) { b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(xk - 0.1, y - 0.01, Math.min(zk, ze), xk + 0.62, y + 0.05, Math.max(zk, ze), { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
      b.col(C.oakDark, 0.7, 1).surf(0); b.beam([xk - 0.35, y - 0.08, ze], [xk + 0.64, y - 0.06, ze], 0.1, 0.1); pins.push([xk + 0.06, y + 1.0, ze]); seen(xk + 0.66, y, ze); }
    const f = planks[0], l = planks[planks.length - 1]; rb.poly([[f[3] + 0.06, f[2] + 1.0, f[0]]].concat(pins), 0.03, C.rope, 1.3);
    note('plank walk of the hermitage', Math.max(...planks.map((v) => v[3])) + 0.7, Math.min(...planks.map((v) => v[2])) - 0.2, Math.max(...planks.map((v) => v[2])) + 1.1, Math.min(f[0], l[1]), Math.max(f[0], l[1]));
    { const ch = chainPlan(q, l[1] + dw * 0.5, l[2] + 0.9, dw); if (ch.stand === null) { ch.n = 1; ch.lens = [q.ll[2] * 0.7]; } hang(q, ch); }   // down from its end: to a ledge if one is there
    H.walk = { z0: r1(f[0]), z1: r1(l[1]), y: r1(f[2]), length: r1(planks.length * 1.3) }; }
  H.least = Math.round(H.least * 100) / 100;
  await ctx.yield();
}

// things a stranger can size, by place (rules-m1): a walled-up hermit's niche with a little window, a dead juniper on the cave's
// ledge, old pegs and a hanging rope's end by the monks' way. (The two whitened ledges are in the rock's bake: see meshRock.)
async function buildSizes(ctx, env) {
  const { b, rb, C, st } = env, fx = env.faceX, r = st('known-sizes'), note = env.note;
  { const z0 = -10, z1 = -7, y0 = 55.6, y1 = 58; let lo = 1e9, hi = -1e9;
    for (let z = z0; z <= z1; z += 0.5) for (let y = y0; y <= y1; y += 0.4) { const x = fx(z, y); lo = Math.min(lo, x); hi = Math.max(hi, x); }
    const xw = hi + 0.12, zm = -8.5;
    env.rw.col(rubTone(env), 0.78, 1.04).surf(0); env.rw.box(lo - 0.6, y0, z0, xw, y1, z1, { bottom: true });   // M4b P4: rubble
    b.col([0.02, 0.02, 0.02]).surf(0); b.quad([xw + 0.015, y0 + 1.25, zm + 0.2], [xw + 0.015, y0 + 1.25, zm - 0.2], [xw + 0.015, y0 + 1.75, zm - 0.2], [xw + 0.015, y0 + 1.75, zm + 0.2]);
    b.col(C.oakDark, 0.8, 1).surf(0); b.beam([xw + 0.03, y0 + 1.8, zm - 0.38], [xw + 0.03, y0 + 1.8, zm + 0.38], 0.1, 0.12);
    b.col(mul3(C.stone, 1.05), 0.9, 1).surf(0); b.box(xw, y0 + 1.17, zm - 0.3, xw + 0.14, y0 + 1.25, zm + 0.3, { bottom: true });
    for (const [dz, dy] of [[-0.7, -0.7], [-0.1, -1.4], [0.5, -2.1]]) { const z = zm + dz, y = y0 + dy; b.col(mul3(C.oakDark, r.range(0.7, 1)), 0.7, 1).surf(0); b.beam([fx(z, y) - 0.3, y - 0.03, z], [fx(z, y) + 0.42, y + 0.02, z], 0.09, 0.09); }
    note('walled niche and pegs', xw + 0.2, y0 - 2.2, y1, z0, z1); env.niche = [xw, (y0 + y1) / 2, zm];
  }
  { const z = -29.6, L = env.relief ? env.relief.bedY(z, 44) : 44, xin = fx(z, L + 0.12), w = Math.max(0.4, fx(z, L - 0.12) - xin), root = [xin + 0.45 * w, L, z], grey = lin('#8a8478');   // the dead juniper, 1.7 m (M4b: on the ledge where it lies; the ledge jogs with its bed)
    b.col(grey, 0.75, 1.05).surf(0); b.tube([root, [root[0] + 0.08, L + 0.5, z + 0.06], [root[0] + 0.2, L + 1.0, z - 0.05], [root[0] + 0.18, L + 1.7, z + 0.05]], (t) => 0.075 - 0.05 * t, 5);
    for (const [h, dx, dz, len] of [[0.55, 0.5, 0.35, 0.8], [0.8, 0.2, -0.6, 0.75], [1.05, 0.55, -0.15, 0.6], [1.25, -0.05, 0.45, 0.5], [1.45, 0.3, 0.2, 0.4]]) {
      const p = [root[0] + 0.12 + 0.05 * h, L + h, z], q = [p[0] + dx * len, p[1] + 0.35 * len, p[2] + dz * len];
      b.col(mul3(grey, r.range(0.85, 1.1)), 0.8, 1); b.tube([p, [lerp(p[0], q[0], 0.5), lerp(p[1], q[1], 0.5) + 0.06, lerp(p[2], q[2], 0.5)], q], (t) => 0.035 - 0.022 * t, 4);
      rb.seg(q, [q[0] + dx * 0.25, q[1] + 0.2, q[2] + dz * 0.25 + 0.05], 0.012, grey, 1.0);
    }
    note('dead juniper', root[0] + 0.9, L, L + 1.8, z - 0.8, z + 0.8); env.juniper = root;
  }
  for (let i = 0; i < 5; i++) { const z = -46.6 + 0.3 * i, y = 60 + 1.5 * i; b.col(mul3(C.oakDark, r.range(0.65, 1)), 0.7, 1).surf(0); b.beam([fx(z, y) - 0.3, y - 0.03, z], [fx(z, y) + 0.45, y + 0.02, z], 0.09, 0.09); }
  { const z = -42.2, y = 121, x = fx(z, y) + 0.4; b.col(C.oakDark, 0.7, 1).surf(0); b.beam([x - 0.7, y - 0.03, z], [x + 0.06, y + 0.02, z], 0.1, 0.1);
    let xm = x; for (let yy = y - 6; yy < y; yy += 0.5) xm = Math.max(xm, fx(z, yy) + 0.12);
    rb.poly([[x, y, z], [xm, y - 2, z + 0.03], [xm, y - 4.2, z - 0.02], [xm, y - 6, z + 0.04]], 0.05, C.rope, 1.5);
    for (const d of [-0.07, 0.06]) rb.seg([xm, y - 6, z + 0.04], [xm + 0.03, y - 6.3, z + 0.04 + d], 0.02, C.rope, 1.0);
    note('old pegs and rope end by the way', xm + 0.15, 60, y + 0.1, -46.7, z + 0.2); env.ropeEnd = [xm, y - 6, z];
  }
  await ctx.yield();
}

// ---------- (polish round 2) THE WAY TO THE LOWER LEDGE: a stair, a chapel, a cypress ----------
// The cave's three ladders stand on the lower ledge (y 24, z -31 to -13), and nothing led to that ledge: the face between the monks'
// platform and those ladders was bare rock, and it is the stretch the net's first look out holds as its near flank. Now, by the plan:
//   THE STAIR, timber, hung on the face on raking struts as the platform is: from the platform's north end (z -41, y 8) up to the
//   ledge's own floor 2.5 m short of the cave's ladders (z -23), about 44 degrees, one landing half way, treads 0.95 m, a rail on posts.
//   THE CHAPEL at the ledge's south end (z -30.6 to -26.6): limewashed, 2.6 m to the eaves, a tiled pent roof against the rock, the
//   door in its north end (the ledge is the way to it), two small windows to the valley, a bell wall over the door's end with one bell
//   and an iron cross; it stands 1.1 m past the ledge's lip on three raking struts.
//   A CYPRESS on the ledge's last metre beyond the chapel, 5 to 6.5 m, where the ledge still runs there (none where it does not).
// By place alone: the face's own surface (faceX) and the ledge's own floor, which the bedding jogs seed by seed. A stream of its own.
// Called last, so every vertex and every mover made before it keeps its number. Nothing of it is nearer the flown line than 25 m.
async function buildWayside(ctx, env) {
  const { b, rb, mv, C, st, line } = env, fx = env.faceX, r = st('wayside'), note = env.note, B = mv.b, r2 = (v) => Math.round(v * 100) / 100;
  const LIME = mix3(mul3(lin('#ddd5c2'), 0.9), C.snow, env.snow * 0.15), DARK = [0.03, 0.027, 0.024], snowK = env.snow * 0.92, TILE = env.snow > 0.5 ? 0 : S.SURF.TILES;
  // the lower ledge's own floor at z (the bedding jogs it between y 22.6 and 24.3): the height at which the face steps back 0.6 m within a
  // quarter of a metre and stays back a metre higher (the undercut under the ledge's nose is shallower and closes again); null where no ledge is
  const floorAt = (z) => { for (let y = 22.3; y <= 25.8; y += 0.05) { const x0 = fx(z, y - 0.25); if (fx(z, y) < x0 - 0.6 && fx(z, y + 1) < x0 - 0.5) return y; } return null; };
  const lipAt = (z, f) => fx(z, f - 0.3);                                               // the ledge's nose, under its floor
  const W = env.wayside = { stair: null, chapel: null, cypress: null, least: 1e9 }, seen = (x, y, z) => { W.least = Math.min(W.least, lineDist(line, x, y, z)); };
  const headZ = -23, headY = floorAt(headZ);
  // ---- the chapel ----
  const zc0 = -30.6, zc1 = -26.6; let F = -1e9, lip = -1e9, back = 1e9, on = 0, n = 0;
  for (let z = zc0; z <= zc1 + 1e-6; z += 0.4) { const f = floorAt(z); n++; if (f != null) { F = Math.max(F, f); on++; lip = Math.max(lip, lipAt(z, f)); } }
  if (headY == null || on < 0.7 * n) { W.least = null; return; }                          // no ledge on this rock: nothing is hung in the air
  F += 0.06; for (let z = zc0; z <= zc1 + 1e-6; z += 0.4) for (let y = F + 0.2; y <= F + 3.8; y += 0.6) back = Math.min(back, fx(z, y));
  const x1 = lip + 1.1, xb = back - 0.3, He = 2.6, Hr = He + 0.25 + 0.42 * (x1 - xb), zm = (zc0 + zc1) / 2;
  const Px = (X) => (u, y) => [X, y, -u], Pz = (Z) => (u, y) => [u, y, Z];                // a wall's own sheet: seen from outside, u runs to the right
  const opening = (P, u, y0, w, h) => { const hw = w / 2, ys = y0 + h - hw; b.col(DARK).surf(0); b.quad(P(u - hw, y0), P(u + hw, y0), P(u + hw, ys), P(u - hw, ys));
    for (let k = 0; k < 4; k++) { const a0 = Math.PI * k / 4, a1 = Math.PI * (k + 1) / 4; b.tri(P(u, ys), P(u + hw * Math.cos(a0), ys + hw * Math.sin(a0)), P(u + hw * Math.cos(a1), ys + hw * Math.sin(a1))); } };
  b.col(C.oakDark, 0.7, 1).surf(0);
  for (const z of [zc0 + 0.3, zm, zc1 - 0.3]) b.beam([fx(z, F - 1.3) - 0.25, F - 1.3, z], [x1 - 0.12, F - 0.3, z], 0.16, 0.18);      // short braces: the stair passes under them with 2 m of headroom
  b.beam([x1 - 0.08, F - 0.3, zc0 - 0.15], [x1 - 0.08, F - 0.3, zc1 + 0.15], 0.18, 0.2);
  b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(xb, F - 0.2, zc0 - 0.1, x1 + 0.1, F - 0.04, zc1 + 0.1, { m: 1, bottom: true, top: false });
  b.col(LIME, 0.86, 1.04).surf(0); b.box(xb, F - 0.04, zc0, x1, F + He, zc1, { top: false });
  for (const [Z, s] of [[zc1, 1], [zc0, -1]]) { const p = [x1, F + He, Z], q = [xb, F + He, Z], t = [xb, F + Hr - 0.05, Z]; if (s > 0) b.tri(q, p, t); else b.tri(p, q, t); }   // the end walls up to the roof
  b.col(mix3(mul3(C.tile, r.range(0.92, 1.06)), C.snow, snowK), 0.85, 1.05).surf(TILE);
  b.quad([x1 + 0.35, F + He - 0.12, zc1 + 0.3], [x1 + 0.35, F + He - 0.12, zc0 - 0.3], [xb, F + Hr, zc0 - 0.3], [xb, F + Hr, zc1 + 0.3], [0, 0, zc1 - zc0 + 0.6, 2]);
  b.col(C.timberDark, 0.8, 1).surf(0); b.quad([x1 + 0.35, F + He - 0.16, zc0 - 0.3], [x1 + 0.35, F + He - 0.16, zc1 + 0.3], [xb, F + Hr - 0.04, zc1 + 0.3], [xb, F + Hr - 0.04, zc0 - 0.3]);
  { const xd = clamp((lip + back) / 2 + 0.1, xb + 0.75, x1 - 0.75); opening(Pz(zc1 + 0.03), xd, F, 0.8, 1.85);                    // the door, on the ledge
    for (const u of [-zc0 - 1.1, -zc1 + 1.1]) opening(Px(x1 + 0.03), u, F + 1.15, 0.38, 0.8); }                                      // two windows to the valley
  // the bell wall over the door's end: two piers, a head, a little pitched cap, one bell, an iron cross
  { const xa = x1 - 1.5, xe = x1 - 0.1, z0 = zc1 - 0.3, z1 = zc1, y0 = F + He - 0.1, yo = y0 + 1.15, yt = yo + 0.4, xm = (xa + xe) / 2;
    b.col(LIME, 0.9, 1.04).surf(0); b.box(xa, y0, z0, xa + 0.32, yo, z1, { top: false }); b.box(xe - 0.32, y0, z0, xe, yo, z1, { top: false }); b.box(xa, yo, z0, xe, yt, z1, { bottom: true, top: false });
    b.tri([xa, yt, z1], [xe, yt, z1], [xm, yt + 0.4, z1]); b.tri([xe, yt, z0], [xa, yt, z0], [xm, yt + 0.4, z0]);
    b.col(mix3(mul3(C.tile, 0.95), C.snow, snowK), 0.9, 1.05).surf(TILE);
    b.quad([xa - 0.1, yt - 0.03, z0 - 0.08], [xa - 0.1, yt - 0.03, z1 + 0.08], [xm, yt + 0.44, z1 + 0.08], [xm, yt + 0.44, z0 - 0.08]); b.quad([xe + 0.1, yt - 0.03, z1 + 0.08], [xe + 0.1, yt - 0.03, z0 - 0.08], [xm, yt + 0.44, z0 - 0.08], [xm, yt + 0.44, z1 + 0.08]);
    b.col(C.oakDark, 0.7, 1).surf(0); b.beam([xa + 0.3, yo - 0.08, (z0 + z1) / 2], [xe - 0.3, yo - 0.08, (z0 + z1) / 2], 0.07, 0.07);
    b.col(mul3(lin('#6b5a34'), 0.8), 0.7, 1.1); b.lathe(xm, yo - 0.5, (z0 + z1) / 2, [[0.19, 0], [0.17, 0.1], [0.1, 0.3], [0.03, 0.4]], 6, { smooth: true });
    rb.seg([xm, yt + 0.4, (z0 + z1) / 2], [xm, yt + 1.25, (z0 + z1) / 2], 0.06, C.iron, 1.5); rb.seg([xm - 0.24, yt + 0.98, (z0 + z1) / 2], [xm + 0.24, yt + 0.98, (z0 + z1) / 2], 0.06, C.iron, 1.5);
    W.chapel = { z0: zc0, z1: zc1, floor: r2(F), front: r2(x1), back: r2(xb), eaves: r2(F + He), crossTop: r2(yt + 1.25) };
    note('chapel of the lower ledge', x1 + 0.45, F - 1.4, yt + 1.3, zc0 - 0.4, zc1 + 0.4); seen(x1 + 0.35, F + He, zc1 + 0.3); seen(x1 + 0.35, F + He, zc0 - 0.3); seen(xm, yt + 1.25, zc1); }
  await ctx.yield();
  // ---- the cypress beyond the chapel ----
  { const z = zc0 - 0.8, f = floorAt(z), xl = f != null ? lipAt(z, f) : 0;
    if (f != null) { const h = r.range(5, 6.5), w = r.range(0.5, 0.62), x = xl - 0.36, v0 = B.nv, g = mix3(C.cypress, C.snow, env.snow * 0.55);
      B.col(C.figWood, 0.8, 1).surf(0); B.cyl(x, f - 0.15, z, 0.11, 0.08, 0.9, 5, { cap: false });
      B.lathe(x, f + 0.45, z, [[0.2 * w, 0], [0.8 * w, 0.6], [w, 1.7], [0.82 * w, h * 0.55], [0.45 * w, h * 0.82], [0.04, h - 0.45]], 7, { smooth: true, colors: [mul3(g, 0.55), mul3(g, 0.7), mul3(g, 0.85), g, mul3(g, 1.12), mul3(g, 1.25)] });
      mv.anim(v0, [x, f, z], 4, r.range(0, TAU), 0.012, 1.1);
      W.cypress = { at: [r2(x), r2(f), z], height: r2(h) }; note('cypress of the lower ledge', x + w + 0.1, f, f + h, z - w - 0.1, z + w + 0.1); seen(x + w, f + h, z); } }
  // ---- the stair ----
  { const z0 = -41, run0 = headZ - z0, LAND = 1.4, H = headY - PLAT_Y, ns = Math.round(H / 0.23), rise = H / ns, run = (run0 - LAND) / ns, n1 = Math.ceil(ns / 2), TW = 0.95;
    const zAt = (i) => z0 + i * run + (i >= n1 ? LAND : 0), yAt = (i) => PLAT_Y + (i + 1) * rise, raw = [];
    for (let i = 0; i <= ns; i++) { const z = zAt(Math.min(i, ns - 1)) + (i === ns ? run : 0.5 * run), y = yAt(Math.min(i, ns - 1)); raw.push(Math.max(fx(z, y - 0.6), fx(z, y), fx(z, y + 0.5), fx(z, y + 1.1))); }
    const xi = raw.map((_, i) => { let m = -1e9; for (let k = Math.max(0, i - 3); k <= Math.min(ns, i + 3); k++) m = Math.max(m, raw[k]); return m; });
    const xs = xi.map((_, i) => { let a = 0, c = 0; for (let k = Math.max(0, i - 2); k <= Math.min(ns, i + 2); k++) { a += xi[k]; c++; } return a / c + 0.05; });      // the stair's inner line: off every bulge, and even
    const tread = mix3(C.timber, C.snow, env.snow * 0.5), out = [];
    b.col(tread, 0.85, 1).surf(S.SURF.PLANKS);
    for (let i = 0; i < ns; i++) { const z = zAt(i), y = yAt(i), xa = Math.min(raw[i], xs[i]) - 0.2, xo = xs[i] + TW;
      b.box(xa, y - 0.06, z, xo, y, z + run + 0.04, { sides: false, bottom: true, m: 1, capStyle: S.SURF.PLANKS, capM: 1 });
      if (i === n1 - 1) b.box(xa, y - 0.06, z + run, xo, y, z + run + LAND + 0.04, { sides: false, bottom: true, m: 1, capStyle: S.SURF.PLANKS, capM: 1 });      // the landing
      out.push([xo, y, z + run]); }
    out.unshift([xs[0] + TW, PLAT_Y, z0]);
    // the outer edge tread by tread, with the landing's far end; and every k-th point of it, the landing's two ends always among them
    const nodes = out.slice(0, n1 + 1).concat([[out[n1][0], out[n1][1], out[n1][2] + LAND]], out.slice(n1 + 1)), last = nodes.length - 1;
    const picks = (k) => { const P = []; for (let i = 0; i < n1; i += k) P.push(i); P.push(n1, n1 + 1); for (let i = n1 + 1 + k; i < last; i += k) P.push(i); P.push(last); return P; };
    b.col(mul3(C.timber, 0.92), 0.8, 1).surf(0);                                            // the outer string, in lengths of five treads
    { const P = picks(5); for (let i = 0; i < P.length - 1; i++) { const p = nodes[P[i]], q = nodes[P[i + 1]]; b.beam([p[0], p[1] - 0.16, p[2]], [q[0], q[1] - 0.16, q[2]], 0.1, 0.3); } }
    b.col(C.oakDark, 0.7, 1).surf(0);                                                       // raking struts from the rock, every sixth tread
    for (const i of picks(6).slice(1)) { const p = nodes[i]; b.beam([fx(p[2], p[1] - 2.2) - 0.25, p[1] - 2.2, p[2]], [p[0] - 0.08, p[1] - 0.3, p[2]], 0.13, 0.15); }
    const rail = [];                                                                         // posts every third tread, one rail, one rope under it
    for (const i of picks(3)) { const p = nodes[i], q = [p[0] - 0.04, p[1], p[2]]; rb.seg(q, [q[0] + (r() - 0.5) * 0.05, q[1] + 1.0, q[2]], 0.07, C.oakDark, 1.5); rail.push([q[0], q[1] + 1.0, q[2]]); }
    rb.poly(rail, 0.07, C.oak, 1.5); rb.poly(rail.map((p) => [p[0], p[1] - 0.45, p[2]]), 0.035, C.rope, 1.2);
    let mx = -1e9; for (const p of out) mx = Math.max(mx, p[0]);
    W.stair = { from: [r2(out[0][0]), PLAT_Y, z0], to: [r2(out[ns][0]), r2(headY), headZ], treads: ns, rise: r2(rise), run: r2(run), landingAfter: n1 };
    note('stair to the lower ledge', mx + 0.15, PLAT_Y - 2.3, headY + 1.1, z0, headZ + 0.2); seen(out[ns][0], headY + 1, headZ); seen(out[n1][0], out[n1][1] + 1, out[n1][2]); seen(out[0][0], PLAT_Y + 1, z0); }
  W.least = r2(W.least);
  await ctx.yield();
}

// rubble walls banded with brick: courses of stone 0.9 to 1.4 m with a brick band between
function banded(b, C, rng, x0, z0, x1, z1, y0, y1, o = {}) {
  let y = y0, k = 0;
  while (y < y1 - 0.01) {
    const brick = k % 2 === 1, h = Math.min(y1 - y, brick ? 0.24 : rng.range(0.9, 1.4));
    if (brick) b.col(C.brick, 0.9, 1).surf(S.SURF.MASONRY, 0, 0.32); else b.col(mul3(C.stone, rng.range(0.9, 1.06)), k ? 0.95 : 0.78, 1).surf(S.SURF.MASONRY, 0, 0.75);
    b.box(x0, y, z0, x1, y + h, z1, { m: 1, top: y + h >= y1 - 0.01 && !!o.top, capStyle: S.SURF.MASONRY, capM: 1 });
    y += h; k++;
  }
}
// small dark openings (unglazed) with a plank shutter beside some; side: 0 +x, 1 -x, 2 +z, 3 -z
function openings(b, C, rng, side, a0, a1, fixedCoord, y, n, o = {}) {
  const w = o.w ?? 0.5, h = o.h ?? 0.8, e = 0.02;
  for (let i = 0; i < n; i++) {
    const t = lerp(a0, a1, (i + 0.5) / n) + rng.range(-0.25, 0.25), f = fixedCoord + (side === 0 || side === 2 ? e : -e);
    const q = (u0, u1, c, lift = 0) => { b.col(c).surf(0); const ff = f + (side === 0 || side === 2 ? lift : -lift);
      if (side === 0) b.quad([ff, y, u1], [ff, y, u0], [ff, y + h, u0], [ff, y + h, u1]); else if (side === 1) b.quad([ff, y, u0], [ff, y, u1], [ff, y + h, u1], [ff, y + h, u0]);
      else if (side === 2) b.quad([u0, y, ff], [u1, y, ff], [u1, y + h, ff], [u0, y + h, ff]); else b.quad([u1, y, ff], [u0, y, ff], [u0, y + h, ff], [u1, y + h, ff]); };
    q(t - w / 2, t + w / 2, [0.025, 0.022, 0.02]);
    if (o.shutter && rng.chance(0.6)) q(t + w / 2 + 0.03, t + w / 2 + 0.03 + w * 0.9, mul3(C.timber, rng.range(0.7, 1)), 0.03);
    if (o.list) o.list.push([side === 0 || side === 1 ? f : t, y + h / 2, side === 0 || side === 1 ? t : f, side]);
  }
}

// ---------- THE HOIST HOUSE: floor y 240, x 8..28, z -6..30, on six raking struts; hatch bay and capstan bay; and the tower ----------
const roofY = (x) => (x >= 10.5 ? 262 - (x - 10.5) * (7.8 / 18.3) : 262 - (10.5 - x) * (2.5 / 3));
async function buildHouse(ctx, env) {
  const { b, rb, mv, C, st } = env, fx = env.faceX, r = st('house'), Y = TOP, H = HATCH, note = env.note;
  const tim = (k = 1) => b.col(mul3(C.timber, k * r.range(0.9, 1.08)), 0.82, 1).surf(0);
  // ROUND E: SHELTERED TIMBER IS DARK. From below the house read as a pale slatted square on pale sticks (six of eight visitors
  // named it). Timber bleaches where sun and rain reach it; what the floor and the slates keep them off stays dark old wood (OLD):
  // the floor's own frame (the bearers on the frames, the edge beams, the hatch's trimmers, the fascia and the bearers' ends, the
  // capstan bay's joists, blocking and trimmer: timD), the undersides of the floor's boards (the hatch bay's soffit, the planks'
  // under faces) and the boards under the slates. The deck, the kerb, the posts, the struts and their knees and ledgers stand in
  // the weather and keep their tone, and so do the capstan's footstep and drum under the open floor; so, by choice, does the
  // roof's own frame (plates, ties, king posts, rafters, purlins), pale against its dark boards. A colour of the timber by where it stands in the house: nothing by the eye, the flight or the hour.
  // Each takes the same draw of the house's stream as before, so nothing else is dealt otherwise.
  const timD = (k = 1) => b.col(mul3(OLD, k * r.range(0.9, 1.08)), 0.82, 1).surf(0);
  const planks = (x0, z0, x1, z1) => { b.col(mul3(C.timber, r.range(0.95, 1.1)), 1, 1).surf(S.SURF.PLANKS); b.box(x0, Y - 0.03, z0, x1, Y + 0.05, z1, { m: 1, capStyle: S.SURF.PLANKS, capM: 1 }); b.col(mul3(OLD, 0.8), 1, 1).surf(S.SURF.PLANKS); b.quad([x0, Y - 0.035, z0], [x1, Y - 0.035, z0], [x1, Y - 0.035, z1], [x0, Y - 0.035, z1], [0, 0, x1 - x0, z1 - z0]); };
  // bearers on the three frames, edge beams, the trimmers and kerb of the hatch
  for (const z of FRAMES) { timD(0.9); b.beam([env.lipX(z) - 2, Y - 0.48, z], [z < 0 ? 29.5 : 28.3, Y - 0.48, z], 0.6, 0.9); }
  for (const x of [8.2, 28]) { timD(0.9); b.beam([x, Y - 0.43, -6.25], [x, Y - 0.43, 30.25], 0.45, 0.8); }
  timD(0.85); b.beam([H.x0 - 0.2, Y - 0.43, -7.4], [H.x0 - 0.2, Y - 0.43, 11.5], 0.4, 0.8); b.beam([H.x1 + 0.4, Y - 0.43, -7.4], [H.x1 + 0.4, Y - 0.43, 11.5], 0.4, 0.8);
  b.beam([H.x0 - 0.2, Y - 0.43, H.z0 - 0.4], [H.x1 + 0.4, Y - 0.43, H.z0 - 0.4], 0.4, 0.8); b.beam([H.x0 - 0.2, Y - 0.43, H.z1 + 0.2], [H.x1 + 0.2, Y - 0.43, H.z1 + 0.2], 0.4, 0.8);
  // the hatch bay is boarded under its joists as well: from below a soffit with the square of the hatch cut in it; a fascia all round
  { const ys = Y - 0.84, soffit = (x0, z0, x1, z1) => { b.col(mul3(OLD, r.range(0.8, 0.95) * 0.85), 1, 1).surf(S.SURF.PLANKS); b.quad([x0, ys, z0], [x1, ys, z0], [x1, ys, z1], [x0, ys, z1], [0, 0, x1 - x0, z1 - z0]); };
    soffit(8, -7.4, H.x0, 11.5); soffit(H.x1 + 0.2, -7.4, 29.4, 11.5); soffit(H.x0, -7.4, H.x1 + 0.2, H.z0 - 0.2); soffit(H.x0, H.z1, H.x1 + 0.2, 11.5);
    timD(0.9); b.beam([29.3, Y - 0.4, -7.4], [29.3, Y - 0.4, 11.5], 0.2, 0.88); b.beam([8, Y - 0.4, -7.3], [29.4, Y - 0.4, -7.3], 0.2, 0.88);
    for (let z = -4.5; z < 11; z += 2.5) { timD(0.8); b.beam([28.2, Y - 0.95, z], [29.4, Y - 0.95, z], 0.25, 0.25); }      // the oversail's bearers' ends
  }
  planks(8, -6, H.x0 - 0.25, 11.5); planks(H.x1 + 0.25, -7.4, 29.4, 11.5); planks(H.x0 - 0.25, -7.4, H.x1 + 0.25, H.z0 - 0.25); planks(H.x0 - 0.25, H.z1 + 0.25, H.x1 + 0.25, 11.5);
  tim(1.05);                                                                             // the kerb stands outside the opening: its inner faces are the opening's edge
  b.box(H.x0 - 0.25, Y + 0.05, H.z0 - 0.25, H.x0, Y + 0.36, H.z1 + 0.25, {}); b.box(H.x1, Y + 0.05, H.z0 - 0.25, H.x1 + 0.25, Y + 0.36, H.z1 + 0.25, {});
  b.box(H.x0, Y + 0.05, H.z0 - 0.25, H.x1, Y + 0.36, H.z0, {}); b.box(H.x0, Y + 0.05, H.z1, H.x1, Y + 0.36, H.z1 + 0.25, {});
  // the capstan bay: open joists along x every metre (two trimmed for the baskets' way), the ring walk, two gangways
  for (let k = 1; k <= 18; k++) { const z = 11.5 + k, trimmed = k === 3 || k === 4; timD(0.8); b.beam([trimmed ? 12.4 : 8.2, Y - 0.38, z], [28, Y - 0.38, z], 0.4, 0.7); }
  for (const x of [11.2, 24.6]) { timD(0.75); b.beam([x, Y - 0.4, 11.8], [x, Y - 0.4, 29.7], 0.14, 0.5); }      // blocking between the joists
  timD(0.8); b.beam([12.4, Y - 0.38, 13.5], [12.4, Y - 0.38, 16.5], 0.4, 0.7);
  b.col(C.timber, 1, 1).surf(S.SURF.PLANKS);
  for (let i = 0; i < 16; i++) {
    const a0 = TAU * i / 16, a1 = TAU * (i + 1) / 16, P = (rad, a, yy) => [CAP[0] + rad * Math.cos(a), yy, CAP[2] + rad * Math.sin(a)];
    b.col(mul3(C.timber, r.range(0.9, 1.12)), 1, 1).surf(S.SURF.PLANKS); b.quad(P(2.3, a1, Y + 0.05), P(3.7, a1, Y + 0.05), P(3.7, a0, Y + 0.05), P(2.3, a0, Y + 0.05), [0, 0, 1.4, 1.2]);
    b.col(C.timberDark).surf(0); b.quad(P(2.3, a0, Y - 0.01), P(3.7, a0, Y - 0.01), P(3.7, a1, Y - 0.01), P(2.3, a1, Y - 0.01));
  }
  planks(8, 21.6, 13.4, 23.4); planks(16.2, 11.5, 17.8, 18.9);
  tim(0.8); b.beam([CAP[0], Y - 2.3, CAP[2] - 2.6], [CAP[0], Y - 2.3, CAP[2] + 2.6], 0.36, 0.36);       // the capstan's footstep, hung by iron straps
  for (const s of [-2.4, 2.4]) rb.seg([CAP[0], Y - 2.2, CAP[2] + s], [CAP[0], Y - 0.3, CAP[2] + s * 0.98], 0.06, C.iron, 1.5);
  await ctx.yield();
  // posts, plates, ties, king posts, ridge and rafters; one rail
  const posts = [];
  for (const z of FRAMES) for (const x of z === 11.5 ? [8.4, 18.2, 28] : [8.4, 28]) { tim(); b.beam([x, Y + 0.05, z], [x, roofY(x) - 0.45, z], 0.45, 0.45); posts.push([x, z]); }
  for (const x of [8.4, 28]) { tim(0.95); b.beam([x, roofY(x) - 0.3, -6.6], [x, roofY(x) - 0.3, 30.6], 0.32, 0.36); }
  tim(0.95); b.beam([10.5, 261.45, -6.9], [10.5, 261.45, 30.9], 0.34, 0.4);
  for (const z of FRAMES) { tim(0.92); b.beam([8.4, 254.0, z], [28, 254.0, z], 0.36, 0.4); b.beam([10.5, 254.2, z], [10.5, 261.3, z], 0.32, 0.32); b.beam([10.5, 258.2, z], [15.6, 254.2, z], 0.2, 0.22); }
  // knee braces 0.25 m square with 1.6 m legs at every post: to the tie beam, and (on the two plate lines) to the plate
  for (const [x, z] of posts) {
    for (const sx of x < 9 ? [1] : x > 27 ? [-1] : [-1, 1]) { tim(0.9); b.beam([x, 252.4, z], [x + sx * 1.6, 253.9, z], 0.25, 0.25); }
    if (x < 9 || x > 27) for (const sz of z < 0 ? [1] : z > 29 ? [-1] : [-1, 1]) { tim(0.9); b.beam([x, roofY(x) - 1.95, z], [x, roofY(x) - 0.4, z + sz * 1.6], 0.25, 0.25); }
  }
  // common rafters 0.25 by 0.35 every 1.5 m, two purlins a slope
  for (let z = -6.75; z <= 30.76; z += 1.5) { tim(0.85); b.beam([10.5, 261.55, z], [28.9, roofY(28.9) - 0.27, z], 0.25, 0.35); b.beam([10.5, 261.55, z], [7.45, roofY(7.45) - 0.27, z], 0.25, 0.35); }
  for (const x of [16.4, 22.3]) { tim(0.9); b.beam([x, roofY(x) - 0.62, -6.9], [x, roofY(x) - 0.62, 30.9], 0.3, 0.36); }
  // the roof: stone slates in eleven courses a slope (each course's butt stands 5 cm over the next), boards under them, eaves and
  // barge boards, a stone ridge roll
  const slate = mix3(C.slate, C.snow, env.snow * 0.92), roofQ = (xa, xb) => {
    const ya = roofY(xa), yb = roofY(xb), sl = Math.hypot(xb - xa, yb - ya), NC = xb > xa ? 11 : 3, dn = [(ya - yb) / sl * 0, 0.05];
    for (let i = 0; i < 6; i++) {
      const za = -7.1 + 38.2 * i / 6, zb = -7.1 + 38.2 * (i + 1) / 6, tone = r.range(0.88, 1.1);
      for (let c = 0; c < NC; c++) {
        const x0 = lerp(xa, xb, c / NC), x1 = lerp(xa, xb, (c + 1) / NC), y0 = roofY(x0), y1 = roofY(x1) + dn[1], v0 = sl * c / NC, v1 = sl * (c + 1) / NC;
        b.col(mul3(slate, tone * (0.94 + 0.12 * ((c * 7 + i * 3) % 5) / 4)), 0.86, 1.04).surf(env.snow > 0.5 ? 0 : S.SURF.TILES);
        if (xb < xa) b.quad([x1, y1, za], [x1, y1, zb], [x0, y0, zb], [x0, y0, za], [za + 7.1, v0, zb + 7.1, v1]); else b.quad([x1, y1, zb], [x1, y1, za], [x0, y0, za], [x0, y0, zb], [za + 7.1, v0, zb + 7.1, v1]);
      }
    }
    b.col(mul3(OLD, 0.75), 1, 1).surf(S.SURF.PLANKS); if (xb < xa) b.quad([xb, yb - 0.1, 31.1], [xb, yb - 0.1, -7.1], [xa, ya - 0.1, -7.1], [xa, ya - 0.1, 31.1], [0, 0, 38.2, sl]); else b.quad([xb, yb - 0.1, -7.1], [xb, yb - 0.1, 31.1], [xa, ya - 0.1, 31.1], [xa, ya - 0.1, -7.1], [0, 0, 38.2, sl]);
    tim(0.8); b.beam([xb, yb - 0.12, -7.1], [xb, yb - 0.12, 31.1], 0.08, 0.3);                  // the eaves board
    for (const z of [-7.14, 31.14]) { tim(0.85); b.beam([xa, ya - 0.1, z], [xb, yb - 0.1, z], 0.08, 0.32); }   // barge boards
  };
  roofQ(10.5, 29.1); roofQ(10.5, 7.3);
  b.col(mul3(slate, 0.82), 0.9, 1).surf(S.SURF.MASONRY, 0, 0.5); b.beam([10.5, 262.06, -7.2], [10.5, 262.06, 31.2], 0.5, 0.3);
  for (const [a, e] of [[[28, -6], [28, 30]], [[8.4, -6], [28, -6]], [[8.4, 30], [28, 30]]]) {
    rb.seg([a[0], Y + 1.1, a[1]], [e[0], Y + 1.1, e[1]], 0.1, C.oak, 1.5);
    const n = Math.round(Math.hypot(e[0] - a[0], e[1] - a[1]) / 3); for (let i = 1; i < n; i++) { const x = lerp(a[0], e[0], i / n), z = lerp(a[1], e[1], i / n); tim(0.9); b.beam([x, Y + 0.05, z], [x, Y + 1.12, z], 0.12, 0.12); }
  }
  // the six struts, lapped on the outer faces of the frames, footed in the rock at y 222
  env.struts = [];
  for (const zc of STRUT_Z) { const foot = [fx(zc, 222) - 0.5, 222, zc]; for (const hx of [17.5, 27.6]) { tim(0.88); b.beam(foot, [hx, Y - 0.5, zc], 0.4, 0.45); env.struts.push({ foot, head: [hx, Y - 0.5, zc], thick: 0.4, deep: 0.45 }); }
    b.col(mul3(C.stone, 0.8), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.6); b.box(foot[0] - 0.2, 221.3, zc - 0.5, foot[0] + 0.9, 222.15, zc + 0.5, { m: 1, capStyle: S.SURF.MASONRY, capM: 1 }); }
  // iron straps on the struts, a ledger between each pair, a knee from each strut to the bearer over it
  for (const q of env.struts) {
    const f = q.foot, h = q.head, at = (t) => [lerp(f[0], h[0], t), lerp(f[1], h[1], t), lerp(f[2], h[2], t)];
    for (const t of [0.08, 0.5, 0.93]) { b.col(mix3(C.iron, C.timber, 0.5), 0.9, 1).surf(0); b.beam(at(t - 0.006), at(t + 0.006), 0.5, 0.56); }      // rusted iron, half way to the timber's tone: as black bands on pale posts they read as stray black squares from under the house (the second strangers)
    const k0 = at(0.86); tim(0.85); b.beam(k0, [h[0] - 3.4, Y - 0.9, f[2]], 0.25, 0.25);
  }
  for (const zc of STRUT_Z) { const f = env.struts.find((q) => q.foot[2] === zc).foot, t = (232 - 222) / (Y - 0.5 - 222); tim(0.85); b.beam([lerp(f[0], 17.5, t) - 0.3, 232, zc], [lerp(f[0], 27.6, t) + 0.3, 232, zc], 0.3, 0.34); }
  await ctx.yield();
  // the wall toward the court: weatherboards from floor to plate on the capstan bay with a doorway at the gangway; on the hatch bay
  // only a boarded breast (the portal's ring crosses that plane higher up)
  { const x = 8.4, yT = roofY(x) - 0.45, board = (z0, z1, y0, y1) => { b.col(mul3(C.timber, r.range(0.78, 0.95)), 1, 1).surf(S.SURF.PLANKS); b.box(x - 0.3, y0, z0, x - 0.22, y1, z1, { m: 1, capStyle: S.SURF.PLANKS, capM: 1 }); };
    board(11.75, 21.6, Y + 0.05, yT); board(23.4, 29.75, Y + 0.05, yT); board(21.6, 23.4, Y + 2.25, yT); board(-5.75, 11.25, Y + 0.05, Y + 1.15);
    tim(0.8); b.beam([x - 0.26, Y + 2.25, 21.5], [x - 0.26, Y + 2.25, 23.5], 0.16, 0.2); b.beam([x - 0.26, Y + 1.15, -5.75], [x - 0.26, Y + 1.15, 11.25], 0.14, 0.1);
    for (const z of [16.6, 26.6]) { tim(0.85); b.beam([x - 0.2, Y + 0.05, z], [x - 0.2, yT, z], 0.2, 0.2); } }
  // things of the work: the hook pole leaning at the hatch's east post, a plank stage in the capstan bay's corner with bales, baskets
  // and a coil of rope, two lanterns (dark by day)
  { const px = 27.55, pz = 10.85; b.col(C.oak, 0.85, 1).surf(0); b.beam([px - 0.45, Y + 0.06, pz - 0.5], [px, Y + 4.2, pz], 0.07, 0.07);
    rb.poly([[px, Y + 4.2, pz], [px - 0.02, Y + 4.42, pz - 0.04], [px - 0.2, Y + 4.4, pz - 0.2], [px - 0.24, Y + 4.22, pz - 0.24]], 0.035, C.iron, 1.5);
    planks(22, 24.6, 28, 29.8);
    const rs = st('house-things'), bale = (x, yy, z, ry) => { b.tr(x, yy, z, ry); b.col(mul3(C.sack, rs.range(0.8, 1.02)), 0.8, 1.05).surf(0); b.box(-0.5, 0, -0.32, 0.5, 0.56, 0.32, {}); b.pop(); };
    bale(26.9, Y + 0.05, 28.9, 0.05); bale(26.85, Y + 0.05, 28.1, -0.06); bale(25.7, Y + 0.05, 28.95, 0.1); bale(26.9, Y + 0.62, 28.5, 0.3); bale(25.75, Y + 0.05, 28.2, 1.5); bale(26.2, Y + 0.62, 28.7, -0.2); bale(27.0, Y + 0.05, 27.2, 1.62);
    for (const [x, z] of [[23.2, 29.0], [24.1, 29.1], [23.5, 28.1], [23.3, 29.0]]) { const up = x === 23.3 ? 0.6 : 0; b.col(mul3(C.basket, rs.range(0.8, 1.1)), 0.7, 1.05).surf(0); b.lathe(x, Y + 0.05 + up, z, [[0, 0], [0.3, 0], [0.4, 0.28], [0.43, 0.6], [0.4, 0.62], [0.36, 0.3], [0, 0.06]], 8, {}); }
    b.col(C.rope, 0.8, 1.05).surf(0); for (let k = 0; k < 4; k++) b.lathe(24.9, Y + 0.05 + k * 0.1, 26.0, [[0.36, 0], [0.62, 0], [0.62, 0.1], [0.36, 0.1]], 10, {});
    for (const [x, z] of [[14, 20.5], [23, 27]]) { const y = 252.9;
      rb.seg([x, y + 0.5, z], [x, roofY(x) - 0.7, z], 0.03, C.iron, 1.5);
      b.col(C.iron, 0.9, 1).surf(0); b.frustum(x, z, 0.36, 0.36, 0.1, 0.1, y + 0.36, y + 0.5, { m: 1 }); b.box(x - 0.15, y - 0.05, z - 0.15, x + 0.15, y, z + 0.15, { bottom: true });
      b.col([0.2, 0.19, 0.16]).surf(0); b.box(x - 0.12, y, z - 0.12, x + 0.12, y + 0.36, z + 0.12, { top: false }); }
    note('hook pole, stage, bales, lanterns (capstan bay and east side)', 28, Y, 253.5, 10.3, 29.8);
  }
  env.posts = posts;
  await ctx.yield();
}

// the capstan and its walkers, the blocks and their rope, the light line and its baskets, the tower and the store
async function buildHoist(ctx, env) {
  const { b, rb, mv, C, st } = env, r = st('hoist'), Y = TOP, B = mv.b, note = env.note;
  // capstan: barrel, four bars, rope coils, and a spoked drum under the floor on the same shaft. One round in 9 s.
  { const v0 = B.nv, ph = r.range(0, TAU), cx = CAP[0], cz = CAP[2];
    B.col(C.oakDark, 0.8, 1).surf(0); B.cyl(cx, Y - 2.15, cz, 0.3, 0.3, 2.2, 8); B.lathe(cx, Y, cz, [[0.6, 0], [0.55, 0.25], [0.5, 0.9], [0.62, 0.95], [0.62, 1.3], [0.3, 1.42], [0, 1.42]], 8, { facet: true });
    B.col(C.rope, 0.85, 1.05); B.lathe(cx, Y + 0.28, cz, [[0.56, 0], [0.63, 0.04], [0.63, 0.5], [0.56, 0.54]], 8, {});
    for (let i = 0; i < 4; i++) { const a = TAU * i / 4; B.col(mul3(C.timber, 1.08), 0.9, 1); B.beam([cx + 0.3 * Math.cos(a), Y + 1.1, cz + 0.3 * Math.sin(a)], [cx + 3.25 * Math.cos(a), Y + 1.1, cz + 3.25 * Math.sin(a)], 0.15, 0.15); }
    B.col(mul3(C.timber, 0.92), 0.85, 1); B.lathe(cx, Y - 1.85, cz, [[0, 0], [1.5, 0], [1.5, 0.09], [1.0, 0.1], [1.0, 1.15], [1.5, 1.16], [1.5, 1.25], [0.3, 1.25]], 12, { facet: true });
    B.col(C.rope, 0.8, 1.05); B.lathe(cx, Y - 1.72, cz, [[1.08, 0], [1.1, 0.5], [1.05, 0.95]], 12, {});
    for (let i = 0; i < 8; i++) { const a = TAU * (i + 0.5) / 8; B.col(i % 2 ? C.oakDark : mul3(C.timber, 1.15)); B.beam([cx + 0.2 * Math.cos(a), Y - 1.9, cz + 0.2 * Math.sin(a)], [cx + 1.46 * Math.cos(a), Y - 1.9, cz + 1.46 * Math.sin(a)], 0.16, 0.1); }
    mv.anim(v0, [cx, Y, cz], 1, ph, 0, 0);
    for (let i = 0; i < 4; i++) {                                                         // a walker behind each bar end, leaning into it
      const a = TAU * i / 4, w0 = B.nv, m = new THREE.Matrix4().makeRotationY(-a).setPosition(cx, Y + 0.06, cz);
      B.push(m); B.push(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.2, Math.PI, 0, 'YXZ')).setPosition(3.0, 0, 0.5));
      figure(B, { robe: mul3(C.robeMonk, r.range(0.8, 1.3)), skin: C.skin, hat: C.hatMonk, arms: 'push' }); B.pop(); B.pop();
      mv.anim(w0, [cx, Y, cz], 1, ph, 1, 0);
    }
    note('capstan and walkers (sweep r 3.35 about 17, 22.5)', CAP[0] + 3.35, Y - 2, Y + 2, CAP[2] - 3.35, CAP[2] + 3.35);
  }
  // blocks under the ridge: cheeks hung on iron straps, sheaves that turn; the rope from the block to the lead block, down, and in to the barrel
  const block = (p, rad, spin, ph) => {
    b.col(C.oakDark, 0.8, 1).surf(0); for (const s of [-0.11, 0.11]) b.box(p[0] + s - 0.03, p[1] - rad - 0.12, p[2] - rad * 0.7, p[0] + s + 0.03, p[1] + rad + 0.16, p[2] + rad * 0.7, { bottom: true });
    rb.seg([p[0], p[1] + rad + 0.1, p[2]], [p[0] + 0.45, roofY(p[0] + 0.45) - 0.5, p[2]], 0.06, C.iron, 1.5);
    const v0 = B.nv; B.push(new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(p[0] + 0.07, p[1], p[2]));
    B.col(mul3(C.timber, 1.1), 0.75, 1.1).surf(0); B.lathe(0, 0, 0, [[0, 0], [rad, 0], [rad, 0.14], [0, 0.14]], 6, { facet: true }); B.pop();
    mv.anim(v0, p, 5, ph, spin, 0);
  };
  block(BLOCK, 0.36, 2.2, r.range(0, TAU)); block(LEAD, 0.3, -2.2, r.range(0, TAU)); block(LIGHT, 0.2, 2.6, r.range(0, TAU));
  rb.sag([BLOCK[0], BLOCK[1] + 0.36, BLOCK[2]], [LEAD[0], LEAD[1] + 0.3, LEAD[2]], 0.12, 6, 0.06, C.rope, 1.5);
  rb.poly([[LEAD[0], LEAD[1], LEAD[2] + 0.3], [10.2, Y + 0.62, CAP[2] + 0.3], [CAP[0] - 0.4, Y + 0.6, CAP[2] + 0.5]], 0.06, C.rope, 1.5);
  b.col(C.oakDark, 0.8, 1).surf(0); b.box(9.9, Y + 0.05, CAP[2] + 0.05, 10.5, Y + 0.55, CAP[2] + 0.55, {});
  // THE LIGHT LINE and its three baskets, 94 m apart, 2 m/s
  { const yLo = -26, span = LIGHT[1] - 3.5 - yLo, ph = r.range(0, span);
    rb.seg([LIGHT[0], LIGHT[1] - 0.2, LIGHT[2]], [LIGHT[0], yLo, LIGHT[2]], 0.03, C.rope, 1.5);
    for (let i = 0; i < 3; i++) {
      const v0 = B.nv, p = [LIGHT[0], yLo, LIGHT[2]];
      B.col(mul3(C.basket, r.range(0.85, 1.1)), 0.7, 1.05).surf(0); B.lathe(p[0], p[1], p[2], [[0, 0], [0.3, 0], [0.4, 0.28], [0.43, 0.6], [0.4, 0.62], [0.36, 0.3], [0, 0.06]], 8, {});
      B.col(C.sack, 0.8, 1); B.sphere(p[0], p[1] + 0.5, p[2], 0.33, 6, 3, { sy: 0.6 });
      B.col(C.rope); for (let k = 0; k < 3; k++) { const a = TAU * k / 3; B.beam([p[0] + 0.4 * Math.cos(a), p[1] + 0.6, p[2] + 0.4 * Math.sin(a)], [p[0], p[1] + 1.5, p[2]], 0.035, 0.035); }
      mv.anim(v0, p, 2, ph + i * span / 3, 2, span);
    }
    env.lightLine = { top: [LIGHT[0], LIGHT[1], LIGHT[2]], bottom: [LIGHT[0], yLo, LIGHT[2]], speed: 2, span, baskets: 3, phase: ph };
    note('light line and baskets', LIGHT[0] + 0.55, yLo, LIGHT[1], LIGHT[2] - 0.6, LIGHT[2] + 0.6);
  }
  await ctx.yield();
  // the square stone tower beside the house on the lip, 9 m wide, 26 m tall; the store behind the capstan bay
  { let x1 = 1e9; for (let z = 30.5; z <= 39.5; z += 1.5) x1 = Math.min(x1, env.lipX(z)); x1 -= 0.3; const x0 = x1 - 9, z0 = 30.5, z1 = 39.5, rt = st('tower');
    banded(b, C, rt, x0, z0, x1, z1, Y - 0.6, Y + 22.5);
    b.col(mul3(C.stone, 1.05), 0.9, 1).surf(S.SURF.MASONRY, 0, 0.5); b.box(x0 - 0.2, Y + 22.5, z0 - 0.2, x1 + 0.2, Y + 22.85, z1 + 0.2, { m: 1, bottom: true });
    b.col(mix3(C.tile, C.snow, env.snow * 0.92), 0.85, 1.05).surf(S.SURF.TILES); b.hip(x0, z0, x1, z1, Y + 22.85, 3.15, { overhang: 0.5, ridge: 0 });
    for (const [sd, f] of [[0, x1], [1, x0], [2, z1], [3, z0]]) for (const yy of [Y + 6, Y + 12.5, Y + 18.6]) openings(b, C, rt, sd, (sd < 2 ? z0 : x0) + 2, (sd < 2 ? z1 : x1) - 2, f, yy, yy > Y + 18 ? 2 : 1, { w: 0.5, h: yy > Y + 18 ? 1.3 : 0.9 });
    env.tower = { x0, x1, z0, z1, top: Y + 26 };
    let sx1 = 1e9; for (let z = 13; z <= 29; z += 2) sx1 = Math.min(sx1, env.lipX(z)); sx1 -= 1.2; const sx0 = sx1 - 12;
    banded(b, C, rt, sx0, 13, sx1, 29, Y - 0.4, Y + 4.2);
    b.col(mix3(mul3(C.tile, 0.95), C.snow, env.snow * 0.92), 0.85, 1.05).surf(S.SURF.TILES); b.gable(sx0, 13, sx1, 29, Y + 4.2, 1.9, { alongX: false, overhang: 0.45, wallColor: C.stone, wallStyle: S.SURF.MASONRY, m: 1 });
    openings(b, C, rt, 0, 14.5, 27.5, sx1, Y + 1.9, 3, { w: 0.6, h: 0.9, shutter: true }); openings(b, C, rt, 1, 15, 27, sx0, Y + 0.02, 1, { w: 1.1, h: 2.0 });
  }
  await ctx.yield();
}

// ---------- THE TOP: the edge row on the brow (no parapet anywhere) and, behind, the monastery ----------
// a plain range: banded rubble walls, a tiled gable roof, small dark openings. Returns its box, or null where the rock gives no room.
function range(env, rng, x0, z0, x1, z1, h, o = {}) {
  const { b, C, sh } = env, Y = TOP;
  if (!o.edge) for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) if (sh.depthAt(x, Y - 1, z) < 1.2) return null;      // edge-row buildings stand on the lip by their own rule
  banded(b, C, rng, x0, z0, x1, z1, Y - 0.4, Y + h);
  const alongX = o.alongX ?? (x1 - x0 >= z1 - z0), rise = o.rise ?? 0.34 * Math.min(x1 - x0, z1 - z0);
  b.col(mix3(mul3(C.tile, rng.range(0.82, 1.08)), C.snow, env.snow * 0.92), 0.85, 1.05).surf(env.snow > 0.5 ? 0 : S.SURF.TILES);
  b.gable(x0, z0, x1, z1, Y + h, rise, { alongX, overhang: 0.45, wallColor: C.stone, wallStyle: S.SURF.MASONRY, m: 1 });
  const floors = h > 5.6 ? 2 : 1;
  for (let f = 0; f < floors; f++) {
    const yy = Y + 1.3 + f * 3.1;
    if (!o.blank || !o.blank.includes(0)) openings(b, C, rng, 0, z0 + 0.8, z1 - 0.8, x1, yy, Math.max(1, Math.round((z1 - z0) / 3.4)), { shutter: true, list: f === floors - 1 ? o.list : null });
    openings(b, C, rng, 1, z0 + 0.8, z1 - 0.8, x0, yy, Math.max(1, Math.round((z1 - z0) / 4.2)), { shutter: true });
    openings(b, C, rng, 2, x0 + 0.8, x1 - 0.8, z1, yy, Math.max(1, Math.round((x1 - x0) / 4.2)), { shutter: true });
    openings(b, C, rng, 3, x0 + 0.8, x1 - 0.8, z0, yy, Math.max(1, Math.round((x1 - x0) / 4.2)), { shutter: true });
  }
  return { x0, z0, x1, z1, top: Y + h + rise };
}
async function buildEdgeRow(ctx, env) {
  const { b, rb, cl, mv, C, st } = env, fx = env.faceX, r = st('edge-row'), Y = TOP, B = mv.b, note = env.note;
  const lipMin = (z0, z1) => { let m = 1e9; for (let z = z0; z <= z1; z += 1) m = Math.min(m, env.lipX(z)); return m; };
  // the kitchen: square, a steep stone roof open at the top (the whole building is a chimney)
  { const x1 = lipMin(-33.5, -26.5) - 0.3, x0 = x1 - 7, z0 = -33.5, z1 = -26.5, cx = (x0 + x1) / 2, cz = -30;
    banded(b, C, r, x0, z0, x1, z1, Y - 0.4, Y + 5);
    b.col(mix3(mul3(C.slate, 1.05), C.snow, env.snow * 0.9), 0.8, 1.05).surf(S.SURF.MASONRY, 0, 0.6); b.frustum(cx, cz, 7.5, 7.5, 1.5, 1.5, Y + 5, Y + 12, { m: 1, top: false });
    b.col([0.02, 0.018, 0.016]).surf(0); b.quad([cx - 0.75, Y + 11.9, cz + 0.75], [cx + 0.75, Y + 11.9, cz + 0.75], [cx + 0.75, Y + 11.9, cz - 0.75], [cx - 0.75, Y + 11.9, cz - 0.75]);
    openings(b, C, r, 0, z0 + 1.5, z1 - 1.5, x1, Y + 1.6, 1, { w: 0.6, h: 0.8 }); openings(b, C, r, 1, z0 + 2, z1 - 2, x0, Y + 0.02, 1, { w: 1, h: 1.9 });
    env.kitchen = { smoke: [cx, Y + 12.2, cz], x0, x1, z0, z1 };
  }
  // the cells with their timber gallery beyond the lip on oblique beams
  { const z0 = -52, z1 = -38, x1 = lipMin(z0, z1) - 0.3, x0 = x1 - 6.5, list = [];
    const box = range(env, r, x0, z0, x1, z1, 6.4, { alongX: false, list, edge: true });
    const gy = Y + 3.25, gx = x1 + 1.6;
    b.col(C.timber, 0.9, 1).surf(S.SURF.PLANKS); b.box(x1, gy - 0.08, z0 + 0.4, gx, gy, z1 - 0.4, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
    for (const z of [z0 + 0.6, z0 + 3.9, z0 + 7.1, z0 + 10.3, z1 - 0.6]) {
      b.col(mul3(C.timberDark, 1.1), 0.8, 1).surf(0); b.beam([fx(z, Y - 2.8) - 0.4, Y - 2.8, z], [gx - 0.1, gy - 0.2, z], 0.22, 0.24); b.beam([x1 - 0.2, gy - 0.2, z], [gx + 0.05, gy - 0.2, z], 0.18, 0.2);
      b.beam([gx - 0.1, gy, z], [gx - 0.1, gy + 2.25, z], 0.14, 0.14);
    }
    rb.seg([gx - 0.1, gy + 1.0, z0 + 0.6], [gx - 0.1, gy + 1.0, z1 - 0.6], 0.08, C.oak, 1.5);
    b.col(mix3(mul3(C.tile, 0.9), C.snow, env.snow * 0.92), 0.85, 1.05).surf(S.SURF.TILES); b.quad([gx + 0.25, gy + 2.2, z1 - 0.2], [gx + 0.25, gy + 2.2, z0 + 0.2], [x1, gy + 3.0, z0 + 0.2], [x1, gy + 3.0, z1 - 0.2], [0, 0, 13.6, 2]);
    b.col(C.timberDark).surf(0); b.quad([gx + 0.25, gy + 2.14, z0 + 0.2], [gx + 0.25, gy + 2.14, z1 - 0.2], [x1, gy + 2.94, z1 - 0.2], [x1, gy + 2.94, z0 + 0.2]);
    b.col(mul3(C.stone, 0.95), 0.85, 1).surf(S.SURF.MASONRY, 0, 0.5); b.box(x0 + 1.2, Y + 6.4, -48.4, x0 + 1.9, Y + 9.3, -47.7, { m: 1 });
    env.cells = { box, lampAt: list, chimney: [x0 + 1.55, Y + 9.5, -48.05], gallery: [gx, gy, z0, z1] };
    note('cells gallery', gx + 0.4, Y - 3.2, gy + 3.2, z0, z1);
    // washing on a line from the gallery's last post to a pole toward the kitchen
    const pa = [x1 - 0.6, Y + 2.3, z1 + 0.2], pb = [x1 - 0.9, Y + 2.2, -34.3]; b.col(C.oakDark).surf(0); b.beam([pb[0], Y, pb[2]], [pb[0], Y + 2.3, pb[2]], 0.1, 0.1);
    const pts = rb.sag(pa, pb, 0.25, 10, 0.02, C.rope, 1.5), wc = [C.kWhite, C.sack, C.kWhite, C.kIndigo, C.kWhite];
    for (let i = 0; i < 5; i++) cl.add(pts[2 * i], pts[2 * i + 1], r.range(0.5, 0.95), mul3(wc[i], r.range(0.85, 1)), r.range(0, 40), 0.7);
  }
  // the striking board on the lip at z -14: a 2 m plank hung by chains in a timber frame, and its monk
  { const xl = env.lipX(-14) - 0.7, z = -14, rr = st('board');
    b.col(C.timber, 0.85, 1).surf(0); for (const s of [-1.35, 1.35]) b.beam([xl, Y, z + s], [xl, Y + 2.45, z + s], 0.16, 0.16); b.beam([xl, Y + 2.45, z - 1.6], [xl, Y + 2.45, z + 1.6], 0.16, 0.18);
    const v0 = B.nv, piv = [xl, Y + 2.36, z];
    B.col(mul3(C.timber, 1.25), 0.9, 1).surf(0); B.box(xl - 0.03, Y + 1.25, z - 1.0, xl + 0.03, Y + 1.57, z + 1.0, { bottom: true });
    B.col(C.iron); for (const s of [-0.8, 0.8]) B.beam([xl, Y + 1.57, z + s], [xl, Y + 2.36, z + s], 0.03, 0.03);
    mv.anim(v0, piv, 3, rr.range(0, TAU), 0.045, 3.6);
    const mx = xl - 0.75; b.tr(mx, Y, z + 0.2, Math.PI / 2); figure(b, { robe: C.robeMonk, skin: C.skin, hat: C.hatMonk, arms: 'down' }); b.pop();
    const a0 = B.nv, sh = [mx + 0.05, Y + 1.32, z + 0.42];
    B.col(C.robeMonk, 0.8, 1); B.beam(sh, [mx + 0.42, Y + 1.5, z + 0.42], 0.1, 0.1); B.col(C.oak); B.beam([mx + 0.4, Y + 1.5, z + 0.42], [mx + 0.62, Y + 1.46, z + 0.2], 0.05, 0.05); B.box(mx + 0.56, Y + 1.38, z + 0.12, mx + 0.68, Y + 1.54, z + 0.28, { bottom: true });
    mv.anim(a0, sh, 3, rr.range(0, TAU), 0.3, 3.6);
    env.board = [xl, Y + 1.4, z]; note('striking board', xl + 0.2, Y, Y + 2.6, z - 1.7, z + 1.7);
  }
  // five cypresses: by the kitchen, at the church's east end, on the south turf
  { const rc = st('cypresses'), at = [[env.lipX(-21) - 4.5, -21], [-27, 1], [-27, 19], [env.lipX(44) - 3.5, 44], [env.lipX(49.5) - 6, 49.5]];
    for (const [x, z] of at) {
      const h = rc.range(9, 13), w = rc.range(0.8, 1.05), v0 = B.nv, g = mix3(C.cypress, C.snow, env.snow * 0.55);
      B.col(C.figWood, 0.8, 1).surf(0); B.cyl(x, Y - 0.2, z, 0.16, 0.12, 1.4, 5, { cap: false });
      B.lathe(x, Y + 0.7, z, [[0.2 * w, 0], [0.75 * w, 0.9], [0.95 * w, 2.6], [0.8 * w, h * 0.55], [0.45 * w, h * 0.82], [0.05, h - 0.7]], 7, { smooth: true, colors: [mul3(g, 0.55), mul3(g, 0.7), mul3(g, 0.85), g, mul3(g, 1.12), mul3(g, 1.25)] });
      mv.anim(v0, [x, Y, z], 4, rc.range(0, TAU), 0.012, 1.1);
    }
    env.cypresses = at;
  }
  await ctx.yield();
}

async function buildMonastery(ctx, env) {
  const { b, rb, C, st, sh } = env, r = st('monastery'), Y = TOP;
  const tiles = (k = 1) => b.col(mix3(mul3(C.tile, k * r.range(0.86, 1.06)), C.snow, env.snow * 0.92), 0.85, 1.05).surf(env.snow > 0.5 ? 0 : S.SURF.TILES);
  // a tiled dome on a drum of banded masonry, with a plain iron cross
  const dome = (cx, cz, rad, y0, drumH) => {
    for (let k = 0; k < 3; k++) { const ya = y0 + drumH * k / 3, yb = y0 + drumH * (k + 1) / 3; if (k === 1) b.col(C.brick, 0.95, 1).surf(S.SURF.MASONRY, 0, 0.32); else b.col(C.stone, 0.9, 1).surf(S.SURF.MASONRY, 0, 0.6); b.lathe(cx, ya, cz, [[rad, 0], [rad, yb - ya]], 12, { facet: true, m: 1 }); }
    for (let i = 0; i < 12; i += 2) { const a = TAU * (i + 0.5) / 12, ca = Math.cos(a), sa = Math.sin(a), rr = rad * Math.cos(Math.PI / 12) + 0.03, t = [-sa * 0.22, ca * 0.22]; b.col([0.03, 0.028, 0.025]).surf(0);
      b.quad([cx + rr * ca - t[0], y0 + drumH * 0.2, cz + rr * sa - t[1]], [cx + rr * ca + t[0], y0 + drumH * 0.2, cz + rr * sa + t[1]], [cx + rr * ca + t[0], y0 + drumH * 0.8, cz + rr * sa + t[1]], [cx + rr * ca - t[0], y0 + drumH * 0.8, cz + rr * sa - t[1]]); }
    const prof = [[rad + 0.25, 0]]; for (let i = 1; i <= 5; i++) { const a = (Math.PI / 2) * i / 5; prof.push([Math.max(0.001, (rad + 0.1) * Math.cos(a)), (rad * 0.86) * Math.sin(a) + 0.12]); }
    tiles(0.95); b.lathe(cx, y0 + drumH, cz, prof, 12, { smooth: true, m: 1 });
    const ty = y0 + drumH + rad * 0.86 + 0.1; rb.seg([cx, ty, cz], [cx, ty + 1.7, cz], 0.07, C.iron, 1.5); rb.seg([cx, ty + 1.15, cz - 0.45], [cx, ty + 1.15, cz + 0.45], 0.07, C.iron, 1.5);
    return ty + 1.7;
  };
  // the church: a cross-in-square, 14 by 16, apse to the east (+x), porch on columns to the west
  { const x0 = -47, x1 = -33, z0 = 2, z1 = 18, cx = -40, cz = 10, rc = st('church');
    banded(b, C, rc, x0, z0, x1, z1, Y - 0.4, Y + 6.2);
    tiles(); b.hip(x0, z0, x1, z1, Y + 6.2, 1.2, { overhang: 0.4, ridge: 0.3 });
    banded(b, C, rc, x0 - 0.02, cz - 3, x1 + 0.02, cz + 3, Y + 6.2, Y + 7.6); banded(b, C, rc, cx - 3, z0 - 0.02, cx + 3, z1 + 0.02, Y + 6.2, Y + 7.6);
    tiles(1.02); b.gable(x0, cz - 3, x1, cz + 3, Y + 7.6, 1.5, { alongX: true, overhang: 0.35, wallColor: C.stone, wallStyle: S.SURF.MASONRY }); b.gable(cx - 3, z0, cx + 3, z1, Y + 7.6, 1.5, { alongX: false, overhang: 0.35, wallColor: C.stone, wallStyle: S.SURF.MASONRY });
    env.churchTop = dome(cx, cz, 3.1, Y + 8.3, 3.6);
    b.col(C.stone, 0.8, 1).surf(S.SURF.MASONRY, 0, 0.7); b.lathe(x1, Y - 0.4, cz, [[2.6, 0], [2.6, 5.2]], 10, { arc: Math.PI, start: -Math.PI / 2, m: 1 });
    tiles(0.9); b.lathe(x1, Y + 4.8, cz, [[2.8, 0], [0.01, 1.4]], 10, { arc: Math.PI, start: -Math.PI / 2, m: 1 });
    for (const z of [z0 + 1.5, z0 + 5.8, z1 - 5.8, z1 - 1.5]) { b.col(C.marble, 0.85, 1).surf(0); b.cyl(x0 - 3.2, Y, z, 0.22, 0.19, 2.9, 7); b.box(x0 - 3.5, Y + 2.9, z - 0.3, x0 - 2.9, Y + 3.15, z + 0.3, {}); }
    tiles(0.92); b.quad([x0 - 3.8, Y + 3.2, z0], [x0 - 3.8, Y + 3.2, z1], [x0, Y + 4.4, z1], [x0, Y + 4.4, z0], [0, 0, 16, 4]);
    b.col(C.timberDark).surf(0); b.quad([x0 - 3.8, Y + 3.14, z1], [x0 - 3.8, Y + 3.14, z0], [x0, Y + 4.34, z0], [x0, Y + 4.34, z1]);
    openings(b, C, rc, 1, cz - 0.1, cz + 0.1, x0, Y + 0.02, 1, { w: 1.3, h: 2.3 }); openings(b, C, rc, 2, x0 + 2, x1 - 2, z1, Y + 2.6, 3, { w: 0.4, h: 1.2 }); openings(b, C, rc, 3, x0 + 2, x1 - 2, z0, Y + 2.6, 3, { w: 0.4, h: 1.2 });
    env.church = [cx, Y + 9, cz];
  }
  await ctx.yield();
  // the chapel, the apsed refectory, the cell ranges round the paved court
  { const rc = st('chapel'), x0 = -25, x1 = -19, z0 = -48, z1 = -40;
    if (range(env, rc, x0, z0, x1, z1, 4.4, { alongX: false, rise: 1.3 })) dome((x0 + x1) / 2, (z0 + z1) / 2, 1.5, Y + 5.2, 1.3); }
  { const rf = st('refectory'), x0 = -75, x1 = -67, z0 = -25, z1 = -5;
    if (range(env, rf, x0, z0, x1, z1, 5.4, { alongX: false })) {
      b.col(C.stone, 0.8, 1).surf(S.SURF.MASONRY, 0, 0.7); b.lathe((x0 + x1) / 2, Y - 0.4, z0, [[3, 0], [3, 5]], 10, { arc: Math.PI, start: Math.PI, m: 1 });
      tiles(0.9); b.lathe((x0 + x1) / 2, Y + 4.6, z0, [[3.2, 0], [0.01, 1.5]], 10, { arc: Math.PI, start: Math.PI, m: 1 });
    } }
  env.ranges = [];
  for (const [x0, z0, x1, z1, h] of [[-60, -58, -30, -52, 6.2], [-92, -14, -86, 30, 6.2], [-62, 44, -14, 50, 5.2], [-64, 24, -52, 30, 4.2], [-16, -24, -9, -12, 4.6]]) {
    let q = null; for (let k = 0; k < 3 && !q; k++) { const sx = Math.sign(-60 - (x0 + x1) / 2) * 3 * k, sz = Math.sign(-2.5 - (z0 + z1) / 2) * 3 * k; q = range(env, st('range' + x0), x0 + sx, z0 + sz, x1 + sx, z1 + sz, h, {}); }
    if (q) env.ranges.push(q);
  }
  // more of the house, simply: the west cells that close the court, the guest house, the bakehouse at the back (left out where the rock gives no room)
  for (const [x0, z0, x1, z1, h] of [[-82, 4, -76, 36, 6.2], [-52, -42, -38, -34, 5], [-108, -22, -98, -6, 4.2]]) { const q = range(env, st('range' + x0 + ':' + z0), x0, z0, x1, z1, h, {}); if (q) env.ranges.push(q); }
  // the cistern's kerb in the court, and the orchard on the back turf
  b.col(C.stone, 0.85, 1).surf(S.SURF.MASONRY, 0, 0.5); b.lathe(-24, Y + 0.05, 30, [[1.7, 0], [1.7, 0.75], [1.35, 0.75], [1.35, 0.15]], 12, { facet: true, m: 1 });
  b.col([0.05, 0.07, 0.08]).surf(0); b.lathe(-24, Y + 0.2, 30, [[1.35, 0], [0.001, 0]], 12, {});
  { const ro = st('orchard'), B = env.mv.b;
    for (const xx of [-111, -104, -97]) for (const zz of [3, 11, 19, 27, 35]) {
      const x = xx + ro.range(-1.4, 1.4), z = zz + ro.range(-1.4, 1.4), rad = ro.range(1.2, 1.8), th = ro.range(1.3, 1.9), tone = ro(), ph = ro.range(0, TAU);
      if (sh.depthAt(x, Y - 1, z) < 4 || (env.ranges || []).some((q) => x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2)) continue;
      const v0 = B.nv, g = mix3(mix3(C.olive, C.figGold, tone * 0.35), C.snow, env.snow * 0.5);
      B.col(C.figWood, 0.8, 1).surf(0); B.cyl(x, Y - 0.1, z, 0.14, 0.1, th + 0.3, 5, { cap: false });
      B.col(g, 0.7, 1.12); B.sphere(x, Y + th + rad * 0.55, z, rad, 6, 4, { sy: 0.72 });
      env.mv.anim(v0, [x, Y, z], 4, ph, 0.012, 1.4);
    } }
  // the paved court (big flags) between them
  b.col(mul3(C.paving, 1), 1, 1).surf(S.SURF.MASONRY, 0, 1.6); b.quad([-66, Y + 0.08, 42], [-10, Y + 0.08, 42], [-10, Y + 0.08, -26], [-66, Y + 0.08, -26], [0, 0, 56, 68]);
  void sh; await ctx.yield();
}

// ---------- buildHero ----------
export async function buildHero(ctx, opts = {}) {
  const core = ctx.core, seed = ctx.seed, st = (name) => core.makeRng(core.hashSeed(name + ':' + seed));
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : PALETTE;
  const wet = clamp(+opts.wet || 0, 0, 1), snow = clamp(+opts.snow || 0, 0, 1), lamps = clamp(opts.lamps === true ? 1 : +opts.lamps || 0, 0, 1);
  const sun = unit(opts.sunDir || [0.38, 0.44, 0.82]);
  const C = { timber: lin('#877763'), timberDark: lin('#5a4d40'), oak: lin('#7c6b56'), oakDark: lin('#54463a'), stone: mix3(lin(pal[0]), lin(pal[6]), 0.3), brick: mix3(lin(pal[3]), lin('#8a5a44'), 0.5),
    tile: mix3(lin(pal[3]), lin('#8a5a44'), 0.28), slate: lin('#7c7a72'), iron: lin('#2b2826'), sack: lin(pal[6]), rope: lin('#9a8660'), skin: lin('#a9805e'), robeMonk: lin('#231f1e'), hatMonk: lin('#141212'), robeLay: lin('#8d7f66'), capLay: lin('#6b4a34'),
    mud: lin('#5b5044'), figWood: lin('#6a6258'), figLeaf: lin('#7f9340'), figGold: lin(pal[2]), dryGrass: lin('#8f8454'), brush: lin('#5e5c3a'), earth: lin('#4a3a2c'), greens: lin('#55773a'), basket: lin('#9c7a48'),
    cypress: lin('#2c4631'), olive: lin('#6f7f58'), marble: lin('#cfc8b8'), paving: lin('#8f897e'), snow: [0.8, 0.85, 0.93], turf: lin('#84864a'), ground: lin('#93866d'),
    kRed: lin('#b3342a'), kSaffron: lin(pal[2]), kWhite: lin('#e6dfcf'), kIndigo: lin('#2c3b78'), kGreen: lin('#3d7646') };
  const U = { uTime: { value: 0 }, uBufH: { value: 720 }, uSunD: { value: new THREE.Vector3(sun[0], sun[1], sun[2]) },
    uSunC: { value: new THREE.Color().setRGB(...(opts.sunColor || mul3(lin('#FFE9C8'), 3.2 / Math.PI))) }, uSkyC: { value: new THREE.Color().setRGB(...(opts.skyColor || mul3(lin('#9DB9E6'), 1.2 / Math.PI))) } };
  { const sc = lin(pal[5]), m = Math.max(sc[0], sc[1], sc[2], 1e-3), k = 0.4 * (opts.bounce == null ? 1 : clamp(+opts.bounce || 0, 0, 2)); U.uPilB = { value: new THREE.Color(sc[0] / m * k, sc[1] / m * k, sc[2] / m * k) }; }
  const root = new THREE.Group(); root.name = 'net-up-the-pillar';
  const clearList = [], env = { st, core, seed, opts, pal, sun, line: opts.line || journeyLine(), root, tris: {}, wet, snow, C, U,
    b: new S.Builder(16384), rw: new S.Builder(1024), rb: makeRibbons(), cl: makeCloths(), mv: makeMovers(),
    note: (what, x, y0, y1, z0, z1) => clearList.push({ what, maxX: Math.round(x * 100) / 100, y0: Math.round(y0 * 10) / 10, y1: Math.round(y1 * 10) / 10, z0: Math.round(z0 * 10) / 10, z1: Math.round(z1 * 10) / 10 }) };
  // what lies on the flat top: turf by the lip and at the back, paving in the court, trodden earth between
  env.capColor = (x, z) => {
    const lipD = env.lipX(clamp(z, -60, 55)) - x;
    if (((z > -25 && z < -7) || (z > 40 && z < 53)) && lipD < 10) return [C.turf[0], C.turf[1], C.turf[2], 1];
    if (x < -84) return [C.turf[0] * 0.92, C.turf[1] * 0.95, C.turf[2] * 0.9, 1];
    if (x > -66 && x < -10 && z > -26 && z < 42) return [C.paving[0], C.paving[1], C.paving[2], 1];
    return [C.ground[0], C.ground[1], C.ground[2], 1];
  };
  await buildRock(ctx, env); await meshRock(ctx, env);
  await buildFace(ctx, env); await buildFaceLife(ctx, env); await buildHaulLife(ctx, env); await buildHermitage(ctx, env); await buildSizes(ctx, env); await buildHouse(ctx, env); await buildHoist(ctx, env); await buildEdgeRow(ctx, env); await buildMonastery(ctx, env); await buildWayside(ctx, env);
  // after rain: drops leave the lip under each streak and break to mist 35 m down
  if (wet > 0) { const rd = st('drips'), B = env.mv.b; for (const k of env.streaks) if (k.z != null) for (let i = 0; i < 3; i++) {
    const p = [env.lipX(k.z) + 0.15, TOP - 35, k.z + rd.range(-0.6, 0.6) * k.w * 0.3], v0 = B.nv;
    B.col([0.62, 0.7, 0.8]).surf(0); B.lathe(p[0], p[1], p[2], [[0, 0], [0.035, 0.08], [0.02, 0.4], [0, 0.5]], 4, {}); env.mv.anim(v0, p, 2, rd.range(0, 35), -9, 35);
    env.note('drips', p[0] + 0.1, TOP - 35, TOP, p[2] - 0.2, p[2] + 0.2); } }
  await ctx.yield();
  const ownMats = !opts.mats, mats = opts.mats || S.makeMaterials({ night: 0, sky: { sunDir: sun } });
  if (ownMats) for (const m of mats.facades) addBounce(m, U, '-pillar-bounce');
  MONASTERY_MATS.set(ctx, mats);                                                           // the neighbours' monasteries are of the same stuff and programs
  const built = new THREE.Mesh(env.b.toGeometry(), mats.facades); built.name = 'built'; built.castShadow = built.receiveShadow = true; root.add(built);
  const rubble = new THREE.Mesh(env.rw.toGeometry(), addBounce(rubbleMaterial(), U, '-b')); rubble.name = 'rubble'; rubble.castShadow = rubble.receiveShadow = true; root.add(rubble);   // M4b P4
  await ctx.yield();
  const movers = new THREE.Mesh(env.mv.geometry(), addBounce(moverMaterial(U), U, '-b')); movers.name = 'movers'; movers.receiveShadow = true; root.add(movers);
  await ctx.yield();
  const ribMat = ribbonMaterial(); Object.assign(ribMat.uniforms, U); const ribbons = new THREE.Mesh(env.rb.geometry(), ribMat); ribbons.name = 'ribbons'; root.add(ribbons);
  const clMat = clothMaterial(); Object.assign(clMat.uniforms, U); const cloths = new THREE.Mesh(env.cl.geometry(), clMat); cloths.name = 'cloths'; root.add(cloths);
  // two cell windows on the gallery, lamplit when opts.lamps
  { const list = env.cells.lampAt.slice(), rl = st('lamps'), P = [], I = [];
    for (let n = 0; n < 2 && list.length; n++) { const q = list.splice(rl.int(0, list.length - 1), 1)[0], x = q[0] + 0.012, y = q[1], z = q[2], k = P.length / 3; P.push(x, y - 0.4, z + 0.25, x, y - 0.4, z - 0.25, x, y + 0.4, z - 0.25, x, y + 0.4, z + 0.25); I.push(k, k + 1, k + 2, k, k + 2, k + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    const lc = mix3([0.03, 0.026, 0.022], mul3(lin('#ffb45e'), 4.5), lamps), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(lc[0], lc[1], lc[2]) })); m.name = 'lamps'; root.add(m); env.lampMesh = m; }
  await ctx.yield();
  env.tris.built = env.b.triangles; env.tris.movers = env.mv.b.triangles; env.tris.ribbons = env.rb.triangles; env.tris.cloths = env.cl.triangles; env.tris.lamps = 4; env.tris.rubble = env.rw.triangles;
  env.clearList = clearList; env.mats = mats; env.ownMats = ownMats; env.meshes = { built, movers, ribbons, cloths, rubble };
  return finishHero(ctx, env);
}

// the notes of what stands proud of the face, one for each kind of thing at each place (z in 4 m steps)
function mergeNotes(list) {
  const by = new Map();
  for (const n of list) {
    const key = n.what + ':' + Math.round((n.z0 + n.z1) / 8), q = by.get(key);
    if (!q) by.set(key, { ...n }); else { q.maxX = Math.max(q.maxX, n.maxX); q.y0 = Math.min(q.y0, n.y0); q.y1 = Math.max(q.y1, n.y1); q.z0 = Math.min(q.z0, n.z0); q.z1 = Math.max(q.z1, n.z1); }
  }
  return [...by.values()];
}

function finishHero(ctx, env) {
  const { U, root, sun } = env, rockMat = env.rockMat, V = (a) => new THREE.Vector3(a[0], a[1], a[2]), r1 = (v) => Math.round(v * 10) / 10;
  // the plain numbers of the clear-air law: the greatest x of the rock on the haul face (|z| < 60) by 10 m band of height
  const pos = root.children[0].geometry.attributes.position, bands = [];
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); if (z < -60 || z > 56 || x < -30 || y < 0) continue; const k = Math.min(23, Math.floor(y / 10)); bands[k] = Math.max(bands[k] ?? -1e9, x); }
  const H = HATCH, d = LINE_DIR, perp = (px, pz) => { const vx = px - 17, vz = pz - 2.7, al = vx * d[0] + vz * d[2]; return Math.sqrt(Math.max(0, vx * vx + vz * vz - al * al)); };
  const anchors = {
    portalSeat: { position: V(RING), facing: V([-d[0], -d[1], -d[2]]), direction: V(d), radius: 7, tilt: 70 },        // facing: back down the line of the haul
    hatch: { center: V([17, 240, 2.7]), x0: H.x0, x1: H.x1, z0: H.z0, z1: H.z1, y: 240, kerbTop: 240.36 },
    block: V(BLOCK), leadBlock: V(LEAD), capstan: V(CAP), capstanPeriod: 9,
    cave: { center: V([0, 46.25, -22]), z0: CAVE.z0, z1: CAVE.z1, y0: CAVE.y0, y1: CAVE.y1, depth: CAVE.depth },
    platform: V([2, PLAT_Y, WAY_Z]), door: V(env.doorAt), waysFoot: V([0.5, PLAT_Y + 0.4, WAY_Z]),
    smoke: { kitchen: V(env.kitchen.smoke), cell: V(env.cells.chimney) },
    lightLine: { top: V(env.lightLine.top), bottom: V(env.lightLine.bottom), speed: 2, span: env.lightLine.span, baskets: 3 },
    board: V(env.board), church: V(env.church), churchCross: env.churchTop, tower: env.tower, garden: V([env.lipX(-50) - 1.6, GARDEN.y, -50]), fig: V([0, 66, -31]),
    streaks: env.streaks.filter((k) => k.z != null).map((k) => ({ z: k.z, width: k.w, length: 96 + 44 * k.len })), cypresses: env.cypresses.map((p) => V([p[0], TOP, p[1]])),
    viewUp: V([17, 240, 12]), line: env.line.map(V), sunDir: V(sun), top: TOP, foot: FOOT,
    // m3b: the relief of the haul face (it only stands back): the bed planes that step, the bands of hollows, the two clefts, what grows and nests there
    haulRelief: env.relief ? { planes: env.relief.cuts.map(r1), bands: env.relief.bands.map((q) => ({ y: r1(q.p), height: r1(q.h), scoops: q.list.map((s) => ({ z: r1(s.z), halfWidth: r1(s.a), height: r1(s.h), depth: r1(s.d) })), honeycombs: q.honey.map((hc) => ({ z0: r1(hc.z0), z1: r1(hc.z1), alcoves: hc.cells.length })) })),
      clefts: env.relief.clefts.map((c) => ({ z: r1(c.z), halfWidth: r1(c.hw), depth: r1(c.D), y0: r1(c.ya), y1: r1(c.yb), wander: r1(c.A) })), life: env.haulLife || [],
      // M4 (additions): the mid bays and the end bays' notches, the bedding's dip, the born streaks, the hermitage
      bays: env.relief.mids.map((q) => ({ z: r1(q.z), halfWidth: r1(q.a), depth: r1(q.d), y0: r1(q.ya), y1: r1(q.yb) })), endBays: env.relief.ends.map((e) => e.list.map((q) => ({ y0: r1(q.y0), y1: r1(q.y1), depth: r1(q.d) }))),
      dipDegrees: env.relief.groups.length ? r1(Math.atan(env.relief.groups[0].dip) / DEG) : 0, born: (env.sites ? env.sites.born : []).map((q) => ({ what: q.what, z: r1(q.z), y: r1(q.y), length: r1(q.len), width: r1(2 * q.hw) })), hermitage: env.hermitage || null, wayside: env.wayside || null } : null,
    clear: {
      rockMaxXByBand: bands.map((x, k) => ({ y0: k * 10, y1: k * 10 + 10, maxX: Math.round(x * 100) / 100 })),
      browUnderHatchBay: { z0: -10, z1: 15.5, rule: 'x <= 17 + 0.3441 * (240 - y) - 9.6', lipX: 7.4 },
      onFace: mergeNotes(env.clearList),
      hatchOpening: { x0: H.x0, x1: H.x1, z0: H.z0, z1: H.z1, kerbFromLine: [perp(H.x0, 2.7), perp(H.x1, 2.7), perp(17, H.z0), perp(17, H.z1)].map((v) => Math.round(v * 100) / 100) },
      struts: env.struts.map((s) => ({ foot: s.foot.map((v) => Math.round(v * 100) / 100), head: s.head, thick: s.thick, deep: s.deep })),
      capstan: { center: CAP, reach: 3.35, walkersAt: 3.0, ringWalkOuter: 3.7 },      // bars and walkers sweep to 3.35 m (16.2 m from the line); the fixed plank walk reaches 3.7 posts: env.posts, portalBall: { center: RING, radius: 7.6 }, nothingBeyondXBelowBrow: 1.4,
    },
  };
  const tmp = new THREE.Vector2(), tris = env.tris, total = Object.values(tris).reduce((a, v) => a + v, 0);
  return {
    object: root, radius: 195, height: 310, center: new THREE.Vector3(-55, 110, -2), anchors, ground: false,       // radius: the ball that holds it all (foot skirt y -44 to the tower's roof y 266)
    rockMaterial: rockMat, strata: env.strata, beds: env.beds, mats: env.mats, triangles: { ...tris, total }, faceX: env.faceX, lipX: env.lipX,
    uniforms: U, colors: env.C,                                             // for the world's own thin things and built things: the part's shared uniforms and colour table
    // dir: unit vector to the sun; colours linear, already times intensity over pi (what a white lambert surface would return)
    setSun(dir, sunLinear, skyLinear) { if (dir) U.uSunD.value.set(dir.x ?? dir[0], dir.y ?? dir[1], dir.z ?? dir[2]).normalize(); if (sunLinear) U.uSunC.value.copy(sunLinear); if (skyLinear) U.uSkyC.value.copy(skyLinear); },
    update(dt, time) {
      U.uTime.value = time; rockMat.userData.pil.value.z = time;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(tmp); U.uBufH.value = tmp.y; }
      if (env.ownMats) env.mats.update(dt, time);
    },
    dispose() { if (rockMat.streakMap) rockMat.streakMap.dispose(); if (env.strata && env.strata.texture) env.strata.texture.dispose(); },
  };
}

// ---------- THE NEIGHBOURS' MONASTERIES ----------
// One material set for every monastery of a world (cached by ctx; buildHero's own set is used when it exists), so they share programs.
const MONASTERY_MATS = new WeakMap();
function monasteryMats(ctx, spec) {
  if (spec.mats) return spec.mats;
  let m = MONASTERY_MATS.get(ctx);
  if (!m) { const U = { uPilB: { value: new THREE.Color(0.164, 0.208, 0.4) } }; m = S.makeMaterials({ night: 0, sky: { sunDir: unit(spec.sunDir || [0.38, 0.44, 0.82]) } }); for (const q of m.facades) addBounce(q, U, '-pillar-bounce'); MONASTERY_MATS.set(ctx, m); }
  return m;
}
const MON_C = (pal) => ({ timber: lin('#877763'), timberDark: lin('#5a4d40'), oak: lin('#7c6b56'), oakDark: lin('#54463a'), stone: mul3(mix3(lin(pal[0]), lin(pal[6]), 0.3), 0.7), brick: mul3(mix3(lin(pal[3]), lin('#8a5a44'), 0.5), 0.8),
  tile: mul3(mix3(lin(pal[3]), lin('#8a5a44'), 0.45), 0.78), slate: lin('#7c7a72'), iron: lin('#2b2826'), snow: [0.8, 0.85, 0.93], cypress: lin('#2c4631'), figLeaf: mul3(lin('#667a3a'), 0.75), figWood: lin('#6a6258'), turf: mul3(lin('#84864a'), 0.66),
  earth: lin('#4a3a2c'), greens: lin('#55773a'), rope: lin('#9a8660'), sack: lin(pal[6]), kWhite: lin('#e6dfcf'), kIndigo: lin('#2c3b78'), marble: lin('#cfc8b8'), paving: mul3(lin('#8f897e'), 0.72), lime: mul3(lin('#ddd5c2'), 0.72), face: () => 1 });
// ---------- the neighbours' monasteries: their wall, roof and timber rules ----------
const MON_DARK = [0.025, 0.022, 0.02], MON_GLOW = [1, 0.72, 0.36];
// One wall face from a to c in plan, seen from outside with a on the left; feet at fa and fc, top at y1. Level bands of grey-ochre rubble
// with two of brick (counted from the top's level Y), a shaded strip under the eaves, and rows of small dark slots: real holes with one
// dark liner 0.35 m behind them. Nothing stands proud of the wall: at 400 m a thing 3 cm proud of a wall flickers.
// o: rows [{ y0, y1, w, t: [metres from a] }], shade (m under the top that the eaves shade), tone, plain (no brick), lamps, see (no liner)
function monWall(b, C, a, c, fa, fc, Y, y1, o = {}) {
  const dx = c[0] - a[0], dz = c[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.05 || y1 - Math.min(fa, fc) < 0.05) return;
  const ux = dx / len, uz = dz / len, nx = -uz, nz = ux, h = y1 - Y, shade = o.shade ?? 0.9, tone = (o.tone ?? 1) * C.face(nx, nz), rows = o.rows || [], f1 = Math.max(fa, fc);
  const bands = o.plain || h < 2.4 ? [] : [Y + 0.38 * h, Y + 0.72 * h].map((y) => { for (const r of rows) if (y + 0.3 > r.y0 && y < r.y1) y = r.y0 - 0.3; return y; });
  let cuts = [y1]; if (shade > 0) cuts.push(y1 - shade); for (const y of bands) cuts.push(y, y + 0.3); for (const r of rows) cuts.push(r.y0, r.y1); if (o.lime != null) cuts.push(o.lime);
  cuts = cuts.filter((y) => y > f1 + 0.05 && y <= y1).sort((p, q) => p - q).filter((y, i, l) => i === 0 || y - l[i - 1] > 0.02);
  const G = (y) => lerp(0.8, 1, sstep(Y - 1.5, Y + 2.5, y)) * (shade > 0 && y > y1 - shade - 0.01 ? lerp(0.8, 0.5, (y - (y1 - shade)) / shade) : 1);
  const P = (t, y) => [a[0] + ux * t, y, a[1] + uz * t];
  let ya = null;
  for (const yb of cuts) {
    const m = ((ya ?? f1) + yb) / 2, brick = bands.some((y) => m > y && m < y + 0.3), row = rows.find((r) => m > r.y0 && m < r.y1), dark = shade > 0 && m > y1 - shade;
    if (o.lime != null && m > o.lime) b.col(mul3(C.lime, tone), dark ? 0.8 : G(ya ?? f1), dark ? 0.5 : G(yb)).surf(0);                      // M3: limewash, bright in the sun
    else if (brick) b.col(mul3(C.brick, tone), G(ya ?? f1), dark ? 0.5 : G(yb)).surf(S.SURF.MASONRY, 0, 0.32); else b.col(mul3(C.stone, tone), dark ? 0.8 : G(ya ?? f1), dark ? 0.5 : G(yb)).surf(S.SURF.MASONRY, 0, 0.75);
    const ts = [0]; if (row) for (const t of row.t) ts.push(t - row.w / 2, t + row.w / 2); ts.push(len);
    for (let i = 0; i < ts.length; i += 2) { const t0 = ts[i], t1 = ts[i + 1]; if (t1 - t0 < 0.02) continue;
      b.quad(P(t0, ya ?? lerp(fa, fc, t0 / len)), P(t1, ya ?? lerp(fa, fc, t1 / len)), P(t1, yb), P(t0, yb), [t0, ya ?? f1, t1, yb]); }
    ya = yb;
  }
  for (const r of rows) {
    if (!r.t.length || o.see) continue;
    b.col(MON_DARK).surf(0); b.quad([a[0] - nx * 0.35, r.y0 - 0.25, a[1] - nz * 0.35], [c[0] - nx * 0.35, r.y0 - 0.25, c[1] - nz * 0.35], [c[0] - nx * 0.35, r.y1 + 0.25, c[1] - nz * 0.35], [a[0] - nx * 0.35, r.y1 + 0.25, a[1] - nz * 0.35]);
    if (o.lamps) { b.col(MON_GLOW).surf(S.SURF.GLOW, 0, 1); r.t.forEach((t, i) => { if ((i + (o.lampAt || 0)) % 3) return; const p = (tt, y) => [a[0] + ux * tt - nx * 0.2, y, a[1] + uz * tt - nz * 0.2];
      b.quad(p(t - r.w / 2 - 0.1, r.y0 - 0.05), p(t + r.w / 2 + 0.1, r.y0 - 0.05), p(t + r.w / 2 + 0.1, r.y1 + 0.05), p(t - r.w / 2 - 0.1, r.y1 + 0.05)); }); }
  }
}
// the rows of slots of a wall len long whose top is y1 and which stands h above the top's level: one row high under the eaves,
// a second of smaller ones on a wall of 8.5 m and more
function monRows(rng, len, y1, h, o = {}) {
  if (h < 3.2 || len < 2.2) return [];
  const n = Math.max(1, Math.floor((len - 0.8) / rng.range(2.6, 3.4))), t = []; for (let i = 0; i < n; i++) t.push(len * (i + 0.5) / n);
  const rows = [{ y0: y1 - 2.1 - (o.down || 0), y1: y1 - 1.1 - (o.down || 0), w: 0.55, t }];
  if (o.tall) { for (let k = 1; h - 2.1 - 3.4 * k > 5.5 && k < 4; k++) rows.push({ y0: y1 - 2.1 - 3.4 * k, y1: y1 - 1.2 - 3.4 * k, w: 0.5, t: t.filter((_, i) => (i + k) % 2 === 0) }); }   // M3: the two lowest storeys are blind
  else if (h >= 8.5 && !o.one) rows.push({ y0: y1 - 5.3, y1: y1 - 4.7, w: 0.4, t: t.filter((_, i) => i % 2 === 0) });
  return rows;
}
// a three-sided stick from p to q (a strut, a post, a rope that the mesh carries itself)
function monStick(b, p, q, w) {
  const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz) || 1; let sx = -dz, sz = dx, sl = Math.hypot(sx, sz); if (sl < 1e-4) { sx = 1; sz = 0; sl = 1; } sx /= sl; sz /= sl;
  const tx = dx / l, ty = dy / l, tz = dz / l, vx = -sz * ty, vy = sz * tx - sx * tz, vz = sx * ty, r = w * 0.58, K = [];
  for (let k = 0; k < 3; k++) { const a = k * TAU / 3, ca = Math.cos(a) * r, sa = Math.sin(a) * r; K.push([sx * ca + vx * sa, vy * sa, sz * ca + vz * sa]); }
  for (let k = 0; k < 3; k++) { const e = K[k], f = K[(k + 1) % 3]; b.quad([p[0] + f[0], p[1] + f[1], p[2] + f[2]], [p[0] + e[0], p[1] + e[1], p[2] + e[2]], [q[0] + e[0], q[1] + e[1], q[2] + e[2]], [q[0] + f[0], q[1] + f[1], q[2] + f[2]], [0, 0, w, l]); }
}
// a cypress: a dark spindle
function monCypress(b, C, x, y, z, h, k) {
  const r = h * 0.1; b.col(mul3(C.cypress, k), 0.6, 1.15).surf(0);
  b.lathe(x, y, z, [[0.12, 0], [r * 0.8, h * 0.1], [r, h * 0.32], [r * 0.7, h * 0.66], [0.04, h]], 6, { smooth: true });
}
// a house in the builder's present frame: x0..x1 by z0..z1, walls from foot to Y + h, a tiled gable along its longer side with deep eaves
function monHouse(b, C, rng, x0, z0, x1, z1, foot, Y, h, o = {}) {
  const c = [[x0, z1], [x1, z1], [x1, z0], [x0, z0]], alongX = o.alongX ?? (x1 - x0 >= z1 - z0), span = alongX ? z1 - z0 : x1 - x0, rise = o.rise ?? span * 0.36, tone = o.tone ?? rng.range(0.92, 1.06);
  for (let i = 0; i < 4; i++) { const p = c[i], q = c[(i + 1) % 4], len = Math.hypot(q[0] - p[0], q[1] - p[1]), gableEnd = alongX ? i % 2 === 1 : i % 2 === 0;
    monWall(b, C, p, q, foot, foot, Y, Y + h, { rows: o.rows === false || (gableEnd && !o.endRows) ? [] : monRows(rng, len, Y + h, h, { one: true }), shade: gableEnd ? 0 : 0.9, tone, lamps: o.lamps, lampAt: i }); }
  b.col(o.tile || C.tile, 0.85, 1.05).surf(S.SURF.TILES); b.gable(x0, z0, x1, z1, Y + h, rise, { alongX, overhang: o.eaves ?? 0.75, wallColor: mul3(C.stone, tone), wallStyle: S.SURF.MASONRY, m: 1 });
  return Y + h + rise;
}
// the plan of a top: its lip made counter-clockwise, the edges with their outward normals, the corners' normals (mitred), the middle,
// the least and the greatest reach from it. D: how far under the top's level the rock is met at each lip point.
function monPlan(lipIn, dropIn, overIn) {
  let L = lipIn.map((p) => [p[0], p[1]]), D = dropIn ? Array.from(dropIn) : L.map(() => 0), A = 0, cx = 0, cz = 0; const V = overIn ? Array.from(overIn) : L.map(() => 0);
  const n = L.length; for (let i = 0; i < n; i++) { const p = L[i], q = L[(i + 1) % n]; A += (p[0] * q[1] - q[0] * p[1]) / 2; }
  if (A < 0) { L.reverse(); D.reverse(); V.reverse(); A = -A; }
  for (let i = 0; i < n; i++) { const p = L[i], q = L[(i + 1) % n], k = (p[0] * q[1] - q[0] * p[1]) / (6 * A); cx += (p[0] + q[0]) * k; cz += (p[1] + q[1]) * k; }
  const E = [], N = []; let per = 0;
  for (let i = 0; i < n; i++) { const p = L[i], q = L[(i + 1) % n], len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1e-6, ux = (q[0] - p[0]) / len, uz = (q[1] - p[1]) / len; E.push({ len, ux, uz, nx: uz, nz: -ux, s: per }); per += len; }
  for (let i = 0; i < n; i++) { const e = E[(i + n - 1) % n], f = E[i]; let x = e.nx + f.nx, z = e.nz + f.nz; const l = Math.hypot(x, z) || 1; x /= l; z /= l; N.push([x, z, 1 / Math.max(0.55, x * f.nx + z * f.nz)]); }
  const clear = (x, z) => { let m = 1e9; for (let i = 0; i < n; i++) { const p = L[i], e = E[i], t = clamp((x - p[0]) * e.ux + (z - p[1]) * e.uz, 0, e.len); m = Math.min(m, Math.hypot(x - p[0] - e.ux * t, z - p[1] - e.uz * t)); } return m; };
  let far = 0; for (const p of L) far = Math.max(far, Math.hypot(p[0] - cx, p[1] - cz));
  return { L, D, V, E, N, n, per, cx, cz, r: clear(cx, cz), far, clear, at: (i) => ((i % n) + n) % n,
    inset: (i, d) => { i = ((i % n) + n) % n; return [L[i][0] - N[i][0] * N[i][2] * d, L[i][1] - N[i][1] * N[i][2] * d]; } };
}
// a wing is no deeper than the lip's bend lets it be: its inner eaves keep at least a quarter of each edge's length
function monFitDepth(pl, w) {
  let d = w.d;
  for (let t = 0; t < 8; t++) {
    let ok = true;
    for (let j = 0; j < w.k && ok; j++) { const i = pl.at(w.i0 + j), e = pl.E[i], p = pl.inset(i, d + 0.75), q = pl.inset(i + 1, d + 0.75); ok = (q[0] - p[0]) * e.ux + (q[1] - p[1]) * e.uz >= 0.25 * e.len; }
    if (ok) break; d *= 0.8;
  }
  return d;
}
// a wing along the lip from corner w.i0 over w.k edges: its outer wall stands on the lip from corner to corner (so that it is flush with
// the rock's own facets), the inner wall w.d further in, a tiled roof over both with deep eaves (a ridge, or one slope falling to the court)
function monWing(b, C, rng, pl, w, Y, o) {
  const { L, D, E } = pl, d = w.d, h = w.h, rise = w.pent ? 0.3 * d : w.tall ? 0.5 * d : 0.36 * d, ov = w.type === 'range' ? 1.1 : 0.75, tile = mul3(o.tile, w.tone), yw = Y + h, yr = yw + rise, lime = w.lime ? Y + 3.6 : null;   // M3: deep eaves on a range
  const eo = w.pent ? 0.3 : ov, ey = yw - (w.pent ? rise * ov / d : rise * ov / (d / 2)), S3 = (p, y) => [p[0], y, p[1]];
  let gSince = 99, gNext = 0;
  const sec = []; for (let j = 0; j <= w.k; j++) { const i = pl.at(w.i0 + j); sec.push({ i, O: L[i], I: pl.inset(i, d), R: w.pent ? pl.inset(i, 0) : pl.inset(i, d / 2), EO: pl.inset(i, -eo), EI: pl.inset(i, d + ov), f: Y - D[i] - 1.2 }); }
  for (let j = 0; j < w.k; j++) {
    const p = sec[j], q = sec[j + 1], e = E[p.i], top = w.pent ? yr : yw, sl = Math.hypot(d / 2 + ov, rise);
    monWall(b, C, q.O, p.O, q.f, p.f, Y, top, { rows: monRows(rng, e.len, top, top - Y, { tall: w.tall }), shade: w.gal ? 3.5 : 0.9, tone: w.tone, lamps: o.lamps, lampAt: j, lime, plain: !!w.tall });
    monWall(b, C, p.I, q.I, Y, Y, Y, yw, { rows: w.type === 'range' ? monRows(rng, e.len, yw, h, { one: true }) : [], tone: w.tone * 0.97, lamps: o.lamps, lampAt: j + 1, lime });
    b.col(mul3(tile, 0.5 + 0.5 * C.face(e.nx, e.nz)), 0.85, 1.05).surf(S.SURF.TILES);
    if (!w.pent) b.quad(S3(q.EO, ey), S3(p.EO, ey), S3(p.R, yr), S3(q.R, yr), [0, 0, e.len, sl]);
    b.col(mul3(tile, 0.5 + 0.5 * C.face(-e.nx, -e.nz)), 0.85, 1.05); b.quad(S3(p.EI, ey), S3(q.EI, ey), S3(q.R, yr), S3(p.R, yr), [0, 0, e.len, w.pent ? Math.hypot(d + ov, rise) : sl]);
    b.col(mul3(C.timberDark, 0.5)).surf(0);                                                // the eaves' undersides
    if (!w.pent) b.quad(S3(p.EO, ey), S3(q.EO, ey), S3(q.O, yw), S3(p.O, yw));
    b.quad(S3(q.EI, ey), S3(p.EI, ey), S3(p.I, yw), S3(q.I, yw));
    // M3 R5: a WALL-GABLE: the outer wall runs up through the eaves into a gable 4 to 5 m wide with a cross roof of its own
    if (w.gables && !w.pent && e.len >= 2.5 && (gSince += e.len) >= gNext) {
      gSince = 0; gNext = rng.range(9, 14);
      const gw = Math.min(rng.range(4, 5), e.len + 1.5), gh = Math.min(rng.range(2.6, 3.6), rise * 0.95), tm = e.len * rng.range(0.4, 0.6), xp = gh * (d / 2) / rise, yp = yw + gh;
      const P = (t, out, y) => [p.O[0] + e.ux * t + e.nx * out, y, p.O[1] + e.uz * t + e.nz * out];
      b.col(mul3(w.lime ? C.lime : C.stone, w.tone * C.face(e.nx, e.nz)), 0.9, 1).surf(w.lime ? 0 : S.SURF.MASONRY, 0, 0.75); b.tri(P(tm + gw / 2, 0, yw), P(tm - gw / 2, 0, yw), P(tm, 0, yp));
      b.col(mul3(tile, 0.5 + 0.5 * C.face(e.nx, e.nz)), 0.85, 1.05).surf(S.SURF.TILES);
      for (const sg of [-1, 1]) { const A = P(tm + sg * (gw / 2 + 0.35), 0.4, yw - 0.3), F = P(tm, 0.4, yp), K = P(tm, -xp, yp), V = P(tm + sg * (gw / 2 + 0.35), 0, yw - 0.3); if (sg > 0) b.quad(A, F, K, V); else b.quad(V, K, F, A); }
    }
  }
  if (w.dome) {                                                                            // M3 R5: a chapel in the upper storey: its drum and dome stand through the roof at the lip
    const s0 = sec[w.k >> 1], s1 = sec[(w.k >> 1) + 1] || s0, x = (s0.R[0] + s1.R[0]) / 2, z = (s0.R[1] + s1.R[1]) / 2, rd = Math.min(w.domeR || 2, d * 0.42), hd = 6.4, y0 = yr - rise * 0.6;
    b.col(mul3(C.stone, 1.06), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75).lathe(x, y0, z, [[rd, 0], [rd, rise * 0.6 + hd]], 10, { m: 1 });
    b.col(mul3(o.tile, 1.05), 0.9, 1.1).surf(S.SURF.TILES).lathe(x, yr + hd - 0.05, z, [[rd + 0.35, 0], [rd * 0.93, rd * 0.36], [rd * 0.66, rd * 0.66], [rd * 0.3, rd * 0.84], [0.03, rd * 0.9]], 10, { smooth: true });
    const top = yr + hd + rd * 0.9; b.col(C.iron).surf(0).beam([x, top - 0.3, z], [x, top + 1.8, z], 0.16); b.beam([x - 0.5 * E[s0.i].ux, top + 1.2, z - 0.5 * E[s0.i].uz], [x + 0.5 * E[s0.i].ux, top + 1.2, z + 0.5 * E[s0.i].uz], 0.16);
  }
  if (w.stack) { const j = Math.min(w.k - 1, (w.k >> 1) + 1), p = sec[j], e = E[p.i], t = e.len * 0.3, x = p.O[0] + e.ux * t - e.nx * 0.6, z = p.O[1] + e.uz * t - e.nz * 0.6, y1 = yw + rng.range(2, 3);   // M3 R5: a chimney at the outer wall, over the eaves
    b.col(mul3(C.stone, 0.85), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75).box(x - 0.5, yw - 0.6, z - 0.5, x + 0.5, y1, z + 0.5, { capColor: MON_DARK, capStyle: 0 }); o.smoke.push([x, y1 + 0.3, z]); }
  for (const [s, a, c] of [[sec[0], 'O', 'I'], [sec[w.k], 'I', 'O']]) {                    // the two ends: a wall and its gable
    monWall(b, C, s[a], s[c], a === 'O' ? s.f : Y, c === 'O' ? s.f : Y, Y, yw, { shade: 0, tone: w.tone, plain: true, lime });
    b.col(mul3(lime != null ? C.lime : C.stone, w.tone)).surf(lime != null ? 0 : S.SURF.MASONRY, 0, 0.75);
    if (w.pent) b.tri(S3(s[a], yw), S3(s[c], yw), S3(s.O, yr)); else b.tri(S3(s[a], yw), S3(s[c], yw), S3(s.R, yr));
  }
  if (w.type === 'range' && w.chimney) { const s = sec[w.k >> 1], t = sec[(w.k >> 1) + 1] || s, x = (s.R[0] + t.R[0]) / 2 - (w.pent ? pl.N[s.i][0] * d * 0.6 : 0), z = (s.R[1] + t.R[1]) / 2 - (w.pent ? pl.N[s.i][1] * d * 0.6 : 0), y1 = yr + 1.3;
    b.col(mul3(C.stone, 0.85), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75).box(x - 0.4, yw, z - 0.4, x + 0.4, y1, z + 0.4, { capColor: MON_DARK, capStyle: 0 }); o.smoke.push([x, y1 + 0.3, z]); }
}
// a curtain wall along the lip (0.8 m thick, a flat top), or a ruin's broken wall in stepped pieces
function monCurtain(b, C, rng, pl, i, Y, h, o = {}) {
  const { L, D, E } = pl, j = pl.at(i + 1), e = E[pl.at(i)], t = 0.8, pieces = o.broken ? Math.max(1, Math.round(e.len / rng.range(1.6, 3))) : 1, S3 = (p, y) => [p[0], y, p[1]];
  const O0 = L[pl.at(i)], O1 = L[j], I0 = pl.inset(i, t), I1 = pl.inset(i + 1, t), f0 = Y - D[pl.at(i)] - 1.2, f1 = Y - D[j] - 1.2, mixP = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
  let hh = h, last = o.prev ?? 0;
  for (let k = 0; k < pieces; k++) {
    if (o.broken) hh = clamp(hh + rng.range(-1.3, 1.3), 1.5, 5.5);
    const k0 = k / pieces, k1 = (k + 1) / pieces, a = mixP(O0, O1, k0), c = mixP(O0, O1, k1), ia = mixP(I0, I1, k0), ic = mixP(I0, I1, k1), y1 = Y + hh;
    monWall(b, C, c, a, lerp(f0, f1, k1), lerp(f0, f1, k0), Y, y1, { shade: 0, tone: o.tone, plain: o.broken });
    monWall(b, C, ia, ic, Y, Y, Y, y1, { shade: 0, tone: (o.tone || 1) * 0.94, plain: true });
    b.col(mix3(mul3(C.stone, 1.08), C.snow, o.snow || 0)).surf(S.SURF.MASONRY, 0, 0.75); b.quad(S3(c, y1), S3(a, y1), S3(ia, y1), S3(ic, y1));
    if (o.broken || k === 0) { const lo = Math.min(last, hh); b.col(mul3(C.stone, 0.9)).surf(S.SURF.MASONRY, 0, 0.75);          // the step between two pieces, the end of a run
      if (hh > last) b.quad(S3(a, Y + lo), S3(ia, Y + lo), S3(ia, y1), S3(a, y1)); else if (last > hh) b.quad(S3(ia, Y + lo), S3(a, Y + lo), S3(a, Y + last), S3(ia, Y + last)); }
    last = hh;
  }
  if (o.end) { b.col(mul3(C.stone, 0.9)).surf(S.SURF.MASONRY, 0, 0.75); b.quad(S3(I1, Y), S3(O1, Y), S3(O1, Y + last), S3(I1, Y + last)); }
  return last;
}
// a battered buttress at lip corner i: 1.1 m wide, 0.9 m proud at its foot 2.5 m under the lip, 0.35 m proud at its head
function monButtress(b, C, pl, i, Y, yHead, tone) {
  i = pl.at(i); const p = pl.L[i], N = pl.N[i], tx = -N[1], tz = N[0], yf = Y - pl.D[i] - 1.2, P = (out, side, y) => [p[0] + N[0] * out * 0.6 + tx * side * 1.1, y, p[1] + N[1] * out + tz * side * 1.1];
  b.col(mul3(C.stone, tone * C.face(N[0], N[1])), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75);
  b.quad(P(0.9, 1, yf), P(0.9, -1, yf), P(0.35, -1, yHead), P(0.35, 1, yHead), [0, yf, 2.2, yHead]);
  b.quad(P(-0.4, 1, yf), P(0.9, 1, yf), P(0.35, 1, yHead), P(-0.4, 1, yHead + 0.7)); b.quad(P(0.9, -1, yf), P(-0.4, -1, yf), P(-0.4, -1, yHead + 0.7), P(0.35, -1, yHead));
  b.quad(P(0.35, 1, yHead), P(0.35, -1, yHead), P(-0.4, -1, yHead + 0.7), P(-0.4, 1, yHead + 0.7)); b.col(mul3(C.stone, 0.5)).quad(P(0.9, -1, yf), P(0.9, 1, yf), P(-0.4, 1, yf), P(-0.4, -1, yf));
}
// a timber gallery hung on a wing's outer wall over the void: plank parapet, posts, a roof of its own, raking struts from the wall below
function monGallery(b, C, pl, w, top, o, pj = 1.8, down = 3.4) {
  const yg = top - down;
  for (let j = 0; j < w.k; j++) {
    const i = pl.at(w.i0 + j), e = pl.E[i], a0 = pl.L[i], t0 = j === 0 ? 0.8 : 0, t1 = e.len - (j === w.k - 1 ? 0.8 : 0); if (t1 - t0 < 2) continue;
    const P = (t, out, y) => [a0[0] + e.ux * t + e.nx * out, y, a0[1] + e.uz * t + e.nz * out];
    b.col(mul3(C.timberDark, 0.6)).surf(S.SURF.PLANKS); b.quad(P(t0, pj, yg - 0.15), P(t1, pj, yg - 0.15), P(t1, 0, yg - 0.15), P(t0, 0, yg - 0.15));
    b.col(C.timber, 0.8, 1); b.quad(P(t1, pj, yg - 0.15), P(t0, pj, yg - 0.15), P(t0, pj, yg + 1), P(t1, pj, yg + 1), [0, 0, t1 - t0, 1.15]);
    b.quad(P(t0, pj, yg - 0.15), P(t0, 0, yg - 0.15), P(t0, 0, yg + 1), P(t0, pj, yg + 1)); b.quad(P(t1, 0, yg - 0.15), P(t1, pj, yg - 0.15), P(t1, pj, yg + 1), P(t1, 0, yg + 1));
    b.col(mul3(o.tile, 0.9), 0.85, 1.05).surf(S.SURF.TILES); b.quad(P(t1, pj + 0.3, yg + 2.15), P(t0, pj + 0.3, yg + 2.15), P(t0, 0, yg + 2.6), P(t1, 0, yg + 2.6), [0, 0, t1 - t0, pj + 0.4]);
    b.col(mul3(C.timberDark, 0.45)).surf(0); b.quad(P(t0, pj + 0.3, yg + 2.08), P(t1, pj + 0.3, yg + 2.08), P(t1, 0, yg + 2.53), P(t0, 0, yg + 2.53));
    const m = Math.max(2, Math.round((t1 - t0) / 2.8) + 1); b.col(C.timberDark, 0.8, 1).surf(S.SURF.PLANKS);
    for (let q = 0; q < m; q++) { const t = lerp(t0 + 0.12, t1 - 0.12, q / (m - 1));
      b.quad(P(t + 0.09, pj, yg + 1), P(t - 0.09, pj, yg + 1), P(t - 0.09, pj, yg + 2.2), P(t + 0.09, pj, yg + 2.2)); monStick(b, P(t, 0.05, yg - 2.2), P(t, pj - 0.1, yg - 0.1), 0.2); }
  }
}
// M3 R5: a closed balcony room hung on a wall over the void (lip edge i, t m along it): plank walls with a dark slot, a roof of its own,
// two raking struts from the wall below
function monBalcony(b, C, pl, i, t, wd, pj, yf, o) {
  i = pl.at(i); const e = pl.E[i], a0 = pl.L[i], P = (tt, out, y) => [a0[0] + e.ux * tt + e.nx * out, y, a0[1] + e.uz * tt + e.nz * out], t0 = t - wd / 2, t1 = t + wd / 2, k = C.face(e.nx, e.nz);
  b.col(mul3(C.timberDark, 0.5)).surf(S.SURF.PLANKS); b.quad(P(t0, pj, yf), P(t1, pj, yf), P(t1, 0, yf), P(t0, 0, yf));
  for (const [ya, yb, c] of [[yf, yf + 1.1, mul3(C.timber, k)], [yf + 1.1, yf + 1.8, MON_DARK], [yf + 1.8, yf + 2.6, mul3(C.timber, k)]]) {
    b.col(c, c === MON_DARK ? 1 : 0.85, 1).surf(c === MON_DARK ? 0 : S.SURF.PLANKS); b.quad(P(t1, pj, ya), P(t0, pj, ya), P(t0, pj, yb), P(t1, pj, yb), [0, ya, wd, yb]); }
  b.col(mul3(C.timber, 0.85), 0.85, 1).surf(S.SURF.PLANKS); b.quad(P(t0, pj, yf), P(t0, 0, yf), P(t0, 0, yf + 2.6), P(t0, pj, yf + 2.6)); b.quad(P(t1, 0, yf), P(t1, pj, yf), P(t1, pj, yf + 2.6), P(t1, 0, yf + 2.6));
  b.col(mul3(o.tile, 0.92), 0.85, 1.05).surf(S.SURF.TILES); b.quad(P(t1 + 0.3, pj + 0.4, yf + 2.5), P(t0 - 0.3, pj + 0.4, yf + 2.5), P(t0 - 0.3, 0, yf + 3.2), P(t1 + 0.3, 0, yf + 3.2), [0, 0, wd + 0.6, pj + 0.5]);
  b.col(C.timberDark, 0.8, 1).surf(S.SURF.PLANKS); for (const tt of [t0 + 0.3, t1 - 0.3]) monStick(b, P(tt, 0.05, yf - 2.4), P(tt, pj - 0.15, yf - 0.05), 0.22);
}
// the hoist tower (the builder's frame: origin on the lip, +z outward): square, a pyramid roof, and a timber balcony-house on two raking
// struts over the drop. Returns the place in that frame where its rope hangs.
function monTower(b, C, rng, Y, foot, w, ht, pj, o) {
  const c = [[-w / 2, 0], [w / 2, 0], [w / 2, -w], [-w / 2, -w]], f = [foot, foot, Y, Y];
  for (let i = 0; i < 4; i++) monWall(b, C, c[i], c[(i + 1) % 4], f[i], f[(i + 1) % 4], Y, Y + ht, { rows: monRows(rng, w, Y + ht, ht, ht > 14 ? { tall: true } : { one: true }), tone: 1.04, lamps: o.lamps, lampAt: i });
  b.col(o.tile, 0.85, 1.05).surf(S.SURF.TILES).hip(-w / 2, -w, w / 2, 0, Y + ht, w * 0.45, { overhang: 0.8, ridge: 0 });
  const hw = 1.8, yf = Y + (ht > 14 ? ht - 6.6 : 0.55 * ht), y1 = yf + 1.1, y2 = yf + 2, y3 = yf + 2.7;
  b.col(mul3(C.timberDark, 0.6)).surf(S.SURF.PLANKS); b.quad([-hw, yf - 0.2, 0], [hw, yf - 0.2, 0], [hw, yf - 0.2, pj], [-hw, yf - 0.2, pj]);
  for (const [ya, yb] of [[yf - 0.2, y1], [y2, y3]]) { b.col(C.timber, 0.82, 1).surf(S.SURF.PLANKS); b.wall(-hw, pj, hw, pj, ya, yb, { m: 1 }); b.wall(hw, pj, hw, 0, ya, yb, { m: 1 }); b.wall(-hw, 0, -hw, pj, ya, yb, { m: 1 }); }
  b.col(MON_DARK).surf(0); b.wall(-hw + 0.3, pj - 0.3, hw - 0.3, pj - 0.3, y1 - 0.1, y2 + 0.1); b.wall(hw - 0.3, pj - 0.3, hw - 0.3, 0, y1 - 0.1, y2 + 0.1); b.wall(-hw + 0.3, 0, -hw + 0.3, pj - 0.3, y1 - 0.1, y2 + 0.1);
  b.col(C.timberDark, 0.8, 1).surf(S.SURF.PLANKS); for (const sx of [-1, 1]) { monStick(b, [sx * (hw - 0.08), y1, pj - 0.08], [sx * (hw - 0.08), y2, pj - 0.08], 0.18); b.beam([sx * 1.3, yf - 4, 0.05], [sx * 1.3, yf - 0.25, pj - 0.8], 0.3); }
  b.col(mul3(o.tile, 0.92), 0.85, 1.05).surf(S.SURF.TILES); b.quad([-hw - 0.3, y3, pj + 0.4], [hw + 0.3, y3, pj + 0.4], [hw + 0.3, y3 + 0.6, 0], [-hw - 0.3, y3 + 0.6, 0], [0, 0, hw * 2 + 0.6, pj + 0.5]);
  b.col(mul3(C.timberDark, 0.45)).surf(0); b.quad([hw + 0.3, y3 - 0.08, pj + 0.4], [-hw - 0.3, y3 - 0.08, pj + 0.4], [-hw - 0.3, y3 + 0.52, 0], [hw + 0.3, y3 + 0.52, 0]);
  return [0, yf - 0.2, pj - 0.9];
}
// the kitchen on the precipice's edge (same frame): square, under a steep stone roof open at its top
function monKitchen(b, C, rng, Y, foot, w, o) {
  const c = [[-w / 2, 0], [w / 2, 0], [w / 2, -w], [-w / 2, -w]], f = [foot, foot, Y, Y], h = 4.6, yt = Y + h + w * 0.8;
  for (let i = 0; i < 4; i++) monWall(b, C, c[i], c[(i + 1) % 4], f[i], f[(i + 1) % 4], Y, Y + h, { rows: monRows(rng, w, Y + h, h, { one: true }), tone: 0.96, lamps: o.lamps, lampAt: i });
  b.col(mix3(C.slate, C.snow, (o.snow || 0) * 0.9), 0.8, 1.05).surf(S.SURF.MASONRY, 0, 0.5).frustum(0, -w / 2, w + 0.9, w + 0.9, 1.3, 1.3, Y + h - 0.1, yt, { top: false });
  b.col(mul3(C.stone, 0.8)).surf(S.SURF.MASONRY, 0, 0.75).box(-0.75, yt - 0.3, -w / 2 - 0.75, 0.75, yt + 0.5, -w / 2 + 0.75, { capColor: MON_DARK, capStyle: 0 });
  return [0, yt + 0.9, -w / 2];
}
// an apse on a wall (the builder's frame: its flat side at x, z; it swells toward +x), under half a tiled cone
function monApse(b, C, x, z, r, y0, h, tile, tone = 1) {
  b.col(mul3(C.stone, tone), 0.82, 1).surf(S.SURF.MASONRY, 0, 0.75).lathe(x, y0, z, [[r, 0], [r, h]], 8, { arc: Math.PI, start: -Math.PI / 2, m: 1 });
  b.col(tile, 0.85, 1.05).surf(S.SURF.TILES).lathe(x, y0, z, [[r + 0.35, h - 0.12], [0.04, h + r * 0.55]], 8, { arc: Math.PI, start: -Math.PI / 2 });
}
// the church (the builder's frame: its middle, +x east): a cross in a square, the cross arms higher, a sixteen-sided drum with eight slots
// under a tiled dome with a plain iron cross, apses on the east end, a porch on four columns at the west door of a great one
function monChurch(b, C, rng, Y, g, o) {
  const hw = g ? 5.5 : 4, hl = g ? 6.5 : 4.75, h = g ? 7.5 : 6, arm = g ? 2.4 : 1.8, rd = g ? 2.9 : 2.1, hd = g ? 5.5 : 4.2, xc = g ? 0.8 : 0.4, tile = o.tile, st = mul3(C.stone, 1.03);
  const c = [[-hl, hw], [hl, hw], [hl, -hw], [-hl, -hw]];
  for (let i = 0; i < 4; i++) { const len = i % 2 ? hw * 2 : hl * 2; monWall(b, C, c[i], c[(i + 1) % 4], Y - 0.3, Y - 0.3, Y, Y + h, { rows: i % 2 ? [] : monRows(rng, len, Y + h, h, { one: true }), tone: 1.03, lamps: o.lamps, lampAt: i }); }
  b.col(tile, 0.85, 1.05).surf(S.SURF.TILES).hip(-hl, -hw, hl, hw, Y + h, 1, { overhang: 0.6, ridge: 0.5 });
  const ya = Y + h + 1.6, ra = arm * 0.62, G = { overhang: 0.5, wallColor: st, wallStyle: S.SURF.MASONRY, m: 1 };
  b.col(st, 0.85, 1).surf(S.SURF.MASONRY, 0, 0.75).box(-hl, Y + h, -arm, hl, ya, arm, { top: false, m: 1 }).box(xc - arm, Y + h, -hw, xc + arm, ya, hw, { top: false, m: 1 });
  b.col(tile, 0.85, 1.05).surf(S.SURF.TILES).gable(-hl, -arm, hl, arm, ya, ra, { alongX: true, ...G }).gable(xc - arm, -hw, xc + arm, hw, ya, ra, { alongX: false, ...G });
  const yd = ya + ra - 0.4, pt = (k) => [xc + rd * Math.cos(k * TAU / 16), rd * Math.sin(k * TAU / 16)], fl = 2 * rd * Math.sin(TAU / 32);
  for (let k = 0; k < 16; k++) monWall(b, C, pt(k + 1), pt(k), yd, yd, yd, yd + hd, { plain: true, shade: 0.5, tone: 1.05, rows: k % 2 ? [{ y0: yd + 0.9, y1: yd + hd - 0.8, w: 0.45, t: [fl / 2] }] : [], lamps: o.lamps, lampAt: 0 });
  b.col(tile, 0.9, 1.1).surf(S.SURF.TILES).lathe(xc, yd + hd - 0.05, 0, [[rd + 0.35, 0], [rd * 0.93, rd * 0.36], [rd * 0.66, rd * 0.66], [rd * 0.3, rd * 0.84], [0.03, rd * 0.9]], 12, { smooth: true });
  const top = yd + hd + rd * 0.9, ch = g ? 2.4 : 1.8;
  b.col(C.iron).surf(0).beam([xc, top - 0.3, 0], [xc, top + ch, 0], 0.16); b.beam([xc, top + ch * 0.68, -ch * 0.27], [xc, top + ch * 0.68, ch * 0.27], 0.16);
  if (g) { monApse(b, C, hl, 0, 2.4, Y - 0.3, h + 0.6, tile, 1.03); monApse(b, C, hl, 3.6, 1.3, Y - 0.3, h - 1.4, tile, 1.03); monApse(b, C, hl, -3.6, 1.3, Y - 0.3, h - 1.4, tile, 1.03); }
  else monApse(b, C, hl, 0, 1.9, Y - 0.3, h - 0.4, tile, 1.03);
  if (g) { const zb = hw - 1, x0 = -hl - 3.2, yl = Y + 3.3, yh = Y + 3.9;
    b.col(tile, 0.85, 1.05).surf(S.SURF.TILES).quad([x0, yl, -zb], [x0, yl, zb], [-hl, yh, zb], [-hl, yh, -zb], [0, 0, zb * 2, 3.3]);
    b.col(mul3(C.timberDark, 0.45)).surf(0).quad([x0, yl - 0.1, zb], [x0, yl - 0.1, -zb], [-hl, yh - 0.1, -zb], [-hl, yh - 0.1, zb]);
    b.col(C.marble, 0.85, 1).surf(0); for (let k = 0; k < 4; k++) b.cyl(x0 + 0.35, Y, -zb + 0.3 + (zb * 2 - 0.6) * k / 3, 0.24, 0.2, yl - Y, 6, { cap: false }); }
  return top + ch;
}
// a cistern's low round roof
function monCistern(b, C, x, Y, z, r, tile) {
  b.col(C.stone, 0.82, 1).surf(S.SURF.MASONRY, 0, 0.75).lathe(x, Y, z, [[r, 0], [r, 1.1]], 10, { m: 1 }); b.col(tile, 0.85, 1.05).surf(S.SURF.TILES).lathe(x, Y, z, [[r + 0.3, 1.02], [0.04, 1.05 + r * 0.42]], 10);
}
// a chapel (the builder's frame: its middle, +x east): a small house under a hipped roof, a round drum and dome with an iron cross, an apse
function monChapel(b, C, rng, Y, o) {
  const hl = 3, hw = 2.25, h = 3.6, c = [[-hl, hw], [hl, hw], [hl, -hw], [-hl, -hw]], rd = 1.3, yd = Y + h + 0.7;
  for (let i = 0; i < 4; i++) monWall(b, C, c[i], c[(i + 1) % 4], Y - 0.3, Y - 0.3, Y, Y + h, { rows: i % 2 ? [] : [{ y0: Y + h - 1.9, y1: Y + h - 1.1, w: 0.45, t: [1.6, 4.4] }], tone: 1.04, lamps: o.lamps, lampAt: i });
  b.col(o.tile, 0.85, 1.05).surf(S.SURF.TILES).hip(-hl, -hw, hl, hw, Y + h, 1.1, { overhang: 0.6, ridge: 0.35 });
  b.col(mul3(C.stone, 1.05), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75).lathe(0, yd - 0.4, 0, [[rd, 0], [rd, 1.6]], 8, { m: 1 });
  b.col(o.tile, 0.9, 1.1).surf(S.SURF.TILES).lathe(0, yd + 1.15, 0, [[rd + 0.3, 0], [rd * 0.9, rd * 0.4], [rd * 0.55, rd * 0.75], [0.03, rd * 0.92]], 8, { smooth: true });
  const top = yd + 1.15 + rd * 0.92; b.col(C.iron).surf(0).beam([0, top - 0.2, 0], [0, top + 1.4, 0], 0.14); b.beam([0, top + 0.95, -0.4], [0, top + 0.95, 0.4], 0.14);
  monApse(b, C, hl, 0, 1.3, Y - 0.3, h - 0.5, o.tile, 1.04);
}
// The monastery's first steps: the plan, the size, the terrace under a top too small, the wings round the lip, the hoist tower, the kitchen.
function* monRingSteps(ctx, spec) {
  const core = ctx.core, name = spec.name || 'monastery', st = (k) => core.makeRng(core.hashSeed(name + ':monastery:' + k + ':' + ctx.seed));
  const pal = Array.isArray(spec.palette) && spec.palette.length >= 7 ? spec.palette : PALETTE, C = MON_C(pal), snow = clamp(spec.snow || 0, 0, 1), lamps = !!spec.lamps;
  // a wall turned from the look's sun is 0.78 of one turned to it (baked in its tone: the walls must part into a bright side and a shaded one)
  { const sd = unit(spec.sunDir || [0.38, 0.44, 0.82]), sl = Math.hypot(sd[0], sd[2]) || 1, sx = sd[0] / sl, sz = sd[2] / sl; C.ry = 0;
    C.face = (nx, nz) => { const c = Math.cos(C.ry), s = Math.sin(C.ry); return lerp(0.78, 1, sstep(-0.25, 0.35, (nx * c + nz * s) * sx + (-nx * s + nz * c) * sz)); };
    C.tr = (bb, x, z, ry) => { C.ry = ry; bb.tr(x, 0, z, ry); }; C.pop = (bb) => { bb.pop(); C.ry = 0; }; }
  let rim = spec.outline && spec.outline.length > 2 ? spec.outline : null;
  if (!rim) { rim = []; for (let k = 0; k < 24; k++) rim.push([(spec.x || 0) + 12 * Math.cos(k * TAU / 24), (spec.z || 0) + 12 * Math.sin(k * TAU / 24)]); }
  const Y = spec.topY ?? rim.topY ?? 0, b = spec.builder || new S.Builder(4096), tri0 = b.triangles, smoke = [], tile = mix3(C.tile, C.snow, snow * 0.92), o = { tile, lamps, smoke, snow }, S3 = (p, y) => [p[0], y, p[1]];
  let pl = monPlan(rim.lip || rim, rim.lip ? rim.drop : null, rim.lip && rim.over ? rim.over : null), roofs = 0, hoist = null;
  let size = spec.size || (pl.r >= 30 ? 'great' : pl.r >= 17 ? 'middle' : 'small');
  if (size === 'great' && pl.r < 21) size = 'middle'; if (size === 'middle' && pl.r < 13.6) size = 'small';   // what is asked, as far as the top can hold it
  if (pl.r < 6.5) {                                                                        // a top too small to stand a house on is cased in a ten-sided masonry terrace
    const R = 7.2, Rb = clamp(pl.far + 0.6, 4.5, R), dec = [], low = [], cx = pl.cx, cz = pl.cz;
    for (let k = 0; k < 10; k++) { const a = k * TAU / 10, ca = Math.cos(a), sa = Math.sin(a); dec.push([cx + R * ca, cz + R * sa]); low.push([cx + Rb * ca, cz + Rb * sa]); }
    b.col(mul3(C.stone, 0.97), 0.72, 1).surf(S.SURF.MASONRY, 0, 0.75);
    for (let k = 0; k < 10; k++) { const j = (k + 1) % 10; b.quad(S3(low[j], Y - 6.5), S3(low[k], Y - 6.5), S3(dec[k], Y + 0.3), S3(dec[j], Y + 0.3), [0, 0, 4.4, 6.8]); }
    pl = monPlan(dec, null); rim = dec; if (size !== 'ruin') size = 'small';
  }
  const great = size === 'great', mid = size === 'middle', small = size === 'small', { L, D, E, n } = pl, wings = [];
  yield;
  if (size !== 'ruin') {
    // the hoist's edge looks toward spec.toward if that is given, else along a bearing of its own stream; the kitchen stands well round from it
    const rw = st('wings'), bear = spec.toward ? Math.atan2(spec.toward[1] - pl.cz, spec.toward[0] - pl.cx) : rw.range(0, TAU), bx = Math.cos(bear), bz = Math.sin(bear);
    let iT = 0, best = -1e9; for (let i = 0; i < n; i++) { const sc = E[i].nx * bx + E[i].nz * bz + 0.04 * Math.min(E[i].len, 6) - clamp(0.08 * Math.max(0, pl.V[i], pl.V[pl.at(i + 1)]), 0, 1.2); if (sc > best) { best = sc; iT = i; } }   // M3: and where the rope hangs free of the rock below
    const fixed = new Array(n).fill(null); fixed[iT] = 'tower'; if (!small) fixed[pl.at(iT + Math.round(n * rw.range(0.3, 0.7)))] = 'kitchen';
    const mean = small ? 8 : pl.per / (great ? rw.int(7, 10) : rw.int(3, 5)), lo = small ? 10 : mean * 0.75, hi = small ? 14 : mean * 1.25, dMax = pl.r * (small ? 0.6 : 0.42), iH0 = pl.at(iT + Math.round(n * rw.range(0.3, 0.7))), iH = small ? pl.at(iT + 1) : iH0;   // M3: a small one's house stands beside its tower, toward the hollow
    const gaps = small ? [pl.at(iT + 2 + rw.int(0, 3)), rw.chance(0.5) ? pl.at(iT - 2 - rw.int(0, 3)) : -1] : [];
    wings.push({ i0: iT, k: 1, type: small ? 'curtain' : 'low', h: small ? rw.range(3, 3.6) : rw.range(3.8, 4.6), d: Math.min(rw.range(4.5, 6), dMax), pent: false, tone: rw.range(0.92, 1.06), tower: true }); wings[0].d = monFitDepth(pl, wings[0]);
    let i = pl.at(iT + 1), left = n - 1, prev = 'low';
    while (left > 0) {
      if (fixed[i]) { wings.push({ i0: i, k: 1, type: 'curtain', h: 3, tone: 1, kitchen: true }); i = pl.at(i + 1); left--; prev = 'curtain'; continue; }
      const target = rw.range(lo, hi), house = small && i === iH; let k = 0, len = 0;
      if (small && !house) { k = 1; len = E[i].len; } else while (k < left && !fixed[pl.at(i + k)] && (k === 0 || len < target)) { len += E[pl.at(i + k)].len; k++; }
      const p = rw(); let type = small ? (house ? 'range' : gaps.includes(i) ? 'gap' : 'curtain') : p < 0.7 ? 'range' : p < 0.84 ? 'low' : p < 0.94 ? 'curtain' : 'gap';
      if (type === 'gap' && prev === 'gap') type = 'low'; if (!small && len < 5 && type !== 'gap') type = 'curtain';
      if (!small && (type === 'gap' || type === 'curtain')) { const most = type === 'gap' ? 7 : 14; while (k > 1 && len > most) { k--; len -= E[pl.at(i + k)].len; } }   // the lip is left bare for a gate's width, walled low for two
      const w = { i0: i, k, len, type, tone: rw.range(0.9, 1.08), pent: !small && rw.chance(0.4), chimney: rw.chance(0.6) };
      if (type === 'range') { w.h = small ? rw.range(5.5, 7) : rw.range(7, 12); w.d = Math.min(small ? rw.range(5.5, 6.5) : rw.range(5.5, 8), dMax); }
      else if (type === 'low') { w.h = rw.range(3.8, 5); w.d = Math.min(rw.range(4.5, 6), dMax); } else w.h = rw.range(3, 3.6);
      if (w.d) w.d = monFitDepth(pl, w);
      wings.push(w); i = pl.at(i + k); left -= k; prev = type;
    }
    // the galleries hang on the ranges that look nearest a bearing of their own stream
    const rg = st('gallery'), gb = rg.range(0, TAU), ranges = wings.filter((w) => w.type === 'range');
    const face = (w) => { const e = E[pl.at(w.i0 + (w.k >> 1))]; return e.nx * Math.cos(gb) + e.nz * Math.sin(gb); };
    ranges.sort((p, q) => face(q) - face(p)).slice(0, great ? rg.int(2, 3) : mid ? rg.int(1, 2) : rg.chance(0.6) ? 1 : 0).forEach((w) => { w.gal = 1; });
    // M3 R5: A SKYLINE. On the hoist's side and on one more side (a bearing 100 to 180 degrees round, its own stream) what stands on the
    // lip is a range of three to five storeys (10 to 18 m; 13 to 18 on a great top), never a pent roof: wall-gables through its eaves,
    // galleries in two tiers or closed balcony rooms on struts, a chimney at the outer wall on two or three of them, a chapel's drum
    // and dome through the roof of the widest one on the hoist's side. Three ranges in ten are limewashed above their first storey.
    const rt = st('tall'), b2 = bear + rt.sign() * rt.range(100, 180) * DEG, bigTop = pl.far > 45, lookAt = (w, a) => { const e = E[pl.at(w.i0 + (w.k >> 1))]; return e.nx * Math.cos(a) + e.nz * Math.sin(a); };
    let stacks = rt.int(2, 3), domeW = null;
    wings.forEach((w, wi) => {
      if (w.tower || w.kitchen || w.type === 'gap') return;
      const tall = small ? w.type === 'range' : lookAt(w, bear) > 0.5 || lookAt(w, b2) > 0.5, byTower = wi === 1 || wi === wings.length - 1;
      if (w.type === 'range' && !tall) { w.pent = w.pent && rt.chance(0.5); w.lime = rt.chance(0.3); }
      if (!tall) return;
      if (!w.d) { w.d = Math.min(rt.range(5.5, 8), dMax); w.len = w.len || E[w.i0].len; }
      w.type = 'range'; w.tall = true; w.pent = false; w.gables = true; w.lime = rt.chance(0.3); w.chimney = false;
      w.h = small ? rt.range(9, 12) : 3.4 * (byTower ? rt.int(3, 4) : rt.int(4, 5)) + rt.range(-0.2, 1); w.d = monFitDepth(pl, w);
      if (small || rt.chance(0.55)) { w.gal = small ? 1 : 2; w.pj = rt.range(2, 3); } else { w.gal = 0; w.rooms = rt.int(1, 3); w.pj = rt.range(2, 3); }
      if (stacks > 0 && w.len > 6) { w.stack = true; stacks--; }
      if ((small || lookAt(w, bear) > 0.5) && (!domeW || w.len > domeW.len)) domeW = w;
    });
    if (!domeW) domeW = wings.filter((w) => w.tall).sort((p, q) => q.len - p.len)[0] || null;
    if (domeW && domeW.d >= 3.6) { domeW.dome = true; domeW.domeR = great ? 3 : 2.5; roofs++; }
    // the hoist tower stands 6 to 8 m over the highest ridge on its side, and the whole at least an eighth of the top's width high
    const ridge = (w) => (w.type === 'range' || w.type === 'low' ? w.h + (w.pent ? 0.3 : w.tall ? 0.5 : 0.36) * w.d : 0), tw = great ? 5.8 : mid ? 5 : 4.2;
    const towerH = clamp(Math.max(great ? 12 : mid ? 10 : 8, wings.reduce((m, w) => (w.tower || lookAt(w, bear) > 0.5 ? Math.max(m, ridge(w)) : m), 0) + st('tower-height').range(6, 8), 0.25 * pl.far - 0.45 * tw), 8, 30);
    yield;
    for (let wi = 0; wi < wings.length; wi++) { const w = wings[wi];
      if (w.type === 'range' || w.type === 'low') {
        monWing(b, C, st('wing:' + w.i0), pl, w, Y, o); if (!w.tower) roofs++;
        const top = Y + w.h + (w.pent ? 0.3 * w.d : 0);
        if (w.gal) { monGallery(b, C, pl, w, top, o, w.pj || 1.8, 3.4); if (w.gal > 1 && w.h > 9.5) monGallery(b, C, pl, w, top, o, (w.pj || 1.8) - 0.3, 6.8); }
        if (w.rooms) { const rb = st('rooms:' + w.i0); let made = 0;                          // closed balcony rooms, 3 to 4.5 m wide, 2 to 3 m out
          for (let j = 0; j < w.k && made < w.rooms; j++) { const e = E[pl.at(w.i0 + j)], wd = rb.range(3, 4.5); if (e.len < wd - 1.2) continue; monBalcony(b, C, pl, w.i0 + j, e.len * 0.5, wd, w.pj, top - 3.4 - (made % 2 ? 3.4 : 0) - rb.range(0.4, 1), o); made++; j += 1; } }
        // a buttress only where two wings meet (the fins of M2 read as battlements): 2.2 m wide, its head at 45 % of the lower wall
        if (w.type === 'range' && wi > 0 && wings[wi - 1].type !== 'gap' && pl.N[w.i0][2] < 1.4) monButtress(b, C, pl, w.i0, Y, Y + 0.45 * Math.min(w.h, wings[wi - 1].h || w.h), w.tone);
      } else if (w.type === 'curtain') {
        const rc = st('curtain:' + w.i0); for (let j = 0; j < w.k; j++) monCurtain(b, C, rc, pl, w.i0 + j, Y, w.h, { prev: j ? w.h : 0, end: j === w.k - 1, tone: w.tone, snow });
      }
      if (w.tower || w.kitchen) {
        const e = E[w.i0], p = L[w.i0], q = L[pl.at(w.i0 + 1)], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, ry = Math.atan2(e.nx, e.nz), foot = Y - Math.max(D[w.i0], D[pl.at(w.i0 + 1)]) - 1.2;
        const toWorld = (v) => [mx + v[0] * Math.cos(ry) + v[2] * Math.sin(ry), v[1], mz - v[0] * Math.sin(ry) + v[2] * Math.cos(ry)];
        C.tr(b, mx, mz, ry);
        if (w.kitchen) { smoke.push(toWorld(monKitchen(b, C, st('kitchen'), Y, foot, 5.5, o))); roofs++; }
        else { const at = toWorld(monTower(b, C, st('tower'), Y, foot, tw, towerH, small ? 4 : 5, o)); roofs++;
          let ft = st('hoist').range(40, 90); if (spec.footY != null) ft = Math.max(4, Math.min(ft, at[1] - spec.footY - 1.5)); hoist = { at, foot: ft }; }
        C.pop(b);
      }
      yield;
    }
  }
  return { core, name, st, C, snow, lamps, rim, Y, b, tri0, smoke, tile, o, pl, size, wings, roofs, hoist };
}
// The monastery's steps. See the header for the spec and the return.
function* monasterySteps(ctx, spec) {
  const M = yield* monRingSteps(ctx, spec), { st, C, snow, rim, Y, b, smoke, tile, o, pl, size, wings } = M, great = size === 'great', mid = size === 'middle', small = size === 'small', ruin = size === 'ruin';
  let roofs = M.roofs, hoist = M.hoist;
  // what stands inside: each thing takes the first place of its own stream that is clear of the wings and of what stands already
  const dep = new Array(pl.n).fill(0), placed = []; let depSum = 0;                           // how deep the lip's edge is built on
  for (const w of wings) for (let j = 0; j < w.k; j++) dep[pl.at(w.i0 + j)] = w.tower || w.kitchen ? 6.5 : w.type === 'gap' ? 0 : (w.d || 0.8) + 0.75;
  for (let i = 0; i < pl.n; i++) depSum += dep[i] * pl.E[i].len / pl.per;
  const free = (x, z) => { let m = 1e9; for (let i = 0; i < pl.n; i++) { const p = pl.L[i], e = pl.E[i], t = clamp((x - p[0]) * e.ux + (z - p[1]) * e.uz, 0, e.len); m = Math.min(m, Math.hypot(x - p[0] - e.ux * t, z - p[1] - e.uz * t) - dep[i]); } return m; };
  const inside = (x, z) => { let c = false; for (let i = 0, j = pl.n - 1; i < pl.n; j = i++) { const p = pl.L[i], q = pl.L[j]; if ((p[1] > z) !== (q[1] > z) && x < (q[0] - p[0]) * (z - p[1]) / (q[1] - p[1]) + p[0]) c = !c; } return c; };
  const fits = (x, z, rad) => inside(x, z) && free(x, z) >= rad + 1 && placed.every((q) => Math.hypot(x - q[0], z - q[1]) >= rad + q[2] + 0.8);
  const place = (rng, rad, tries = 14, r0 = 0, r1 = 1) => { for (let t = 0; t < tries; t++) { const a = rng.range(0, TAU), d = pl.far * rng.range(r0, r1), x = pl.cx + d * Math.cos(a), z = pl.cz + d * Math.sin(a); if (fits(x, z, rad)) { placed.push([x, z, rad]); return [x, z]; } } return null; };
  if (!ruin) {
    const rc = st('church'), rad = great ? 8.6 : 6.2, at = small ? null : place(rc, rad, 16, 0, 0.3);
    if (at) { C.tr(b, at[0], at[1], 0); monChurch(b, C, rc, Y + 0.3, great, o); C.pop(b); roofs++; }
    else { const hs = wings.find((w) => w.type === 'range'), he = hs ? pl.E[pl.at(hs.i0 + (hs.k >> 1))] : null, sh = Math.min(2, pl.r * 0.25);                // the chapel: clear of the house if it can be, else against it
      const p = place(rc, 3.9, 16, 0, 0.5) || (small ? [pl.cx - (he ? he.nx * sh : 0), pl.cz - (he ? he.nz * sh : 0)] : null); if (p) { C.tr(b, p[0], p[1], 0); monChapel(b, C, rc, Y + 0.3, o); C.pop(b); roofs++; if (!placed.some((q) => q[0] === p[0] && q[1] === p[1])) placed.push([p[0], p[1], 3.9]); } }
    yield;
    if (!small) {                                                                          // the refectory with its apse: a long house, where three rounds along it are clear
      const rr = st('refectory'), hw = great ? 3.5 : 2.75, hl = great ? 8.5 : 5.5, h = great ? 5.5 : 4.6;
      for (let t = 0; t < 20; t++) {
        const a = rr.range(0, TAU), d = pl.far * rr.range(0.1, 0.8), x = pl.cx + d * Math.cos(a), z = pl.cz + d * Math.sin(a), ry = rr.chance(0.5) ? a : a + Math.PI / 2, ux = Math.cos(ry), uz = -Math.sin(ry), e = hl - hw;
        if (![-1, 0, 1].every((k) => fits(x + ux * e * k, z + uz * e * k, hw + 0.6))) continue;
        for (const k of [-1, 0, 1]) placed.push([x + ux * e * k, z + uz * e * k, hw + 0.6]);
        C.tr(b, x, z, ry); monHouse(b, C, rr, -hl, -hw, hl, hw, Y, Y + 0.3, h, { tile, lamps: o.lamps, alongX: true }); monApse(b, C, hl, 0, hw * 0.62, Y, h * 0.8, tile); C.pop(b); roofs++; break;
      }
    }
    const rk = st('cistern'), cr = small ? 1.8 : rk.range(2.6, 3.4), cp = small && pl.r <= 10 ? null : place(rk, cr + 0.5, 14, 0.1, 0.8); if (cp) { monCistern(b, C, cp[0], Y + 0.3, cp[1], cr, tile); roofs++; }
    yield;
    const rh = st('houses'), court = Math.PI * Math.max(0, pl.r - depSum - 1) ** 2, nh = great ? rh.int(3, 6) + clamp(Math.floor((court - 2500) / 900), 0, 4) : mid ? rh.int(0, 1) : 0;
    for (let k = 0; k < nh; k++) {
      const hl = rh.range(3, 4), hw = rh.range(2.25, 3), h = rh.range(3.6, 5.5), p = place(rh, Math.hypot(hl, hw) * 0.9, 12, 0.15, 0.9); if (!p) continue;
      C.tr(b, p[0], p[1], (rh.chance(0.5) ? 0 : Math.PI / 2) + rh.range(-0.3, 0.3)); monHouse(b, C, rh, -hl, -hw, hl, hw, Y, Y + 0.3, h, { tile: mul3(tile, rh.range(0.9, 1.08)), lamps: o.lamps }); C.pop(b); roofs++;
    }
    if (!small) {                                                                          // a patch of garden in a low wall, and the washing on a line
      const rgd = st('garden'), ga = great ? 4.5 : 3, gc = great ? 3 : 2, p = place(rgd, Math.hypot(ga, gc) * 0.9, 12, 0.1, 0.9);
      if (p) { C.tr(b, p[0], p[1], rgd.range(0, TAU)); b.col(mul3(C.stone, 0.95)).surf(S.SURF.MASONRY, 0, 0.75).box(-ga, Y + 0.3, -gc, ga, Y + 0.7, gc, { capColor: mix3(C.earth, C.snow, snow * 0.8), capStyle: 0 });
        for (let k = 0; k < 4; k++) { const x = -ga + 0.6 + (ga * 2 - 1.2) * k / 3; b.col(mix3(mul3(C.greens, 0.8 + 0.1 * k), C.snow, snow * 0.6)).surf(0).box(x - 0.45, Y + 0.7, -gc + 0.4, x + 0.45, Y + 0.95, gc - 0.4); } C.pop(b); }
      const rl = st('washing'), q = place(rl, 2.6, 12, 0.1, 0.9);
      if (q) { const a = rl.range(0, TAU), ux = Math.cos(a), uz = Math.sin(a), y0 = Y + 0.3; b.col(C.timberDark).surf(0);
        for (const s of [-1, 1]) monStick(b, [q[0] + ux * 2.4 * s, y0, q[1] + uz * 2.4 * s], [q[0] + ux * 2.4 * s, y0 + 2.2, q[1] + uz * 2.4 * s], 0.12);
        for (let k = 0; k < 5; k++) { const t = -1.9 + k * 0.95, w = 0.36, hh = rl.range(0.7, 1.2), A = [q[0] + ux * (t - w), y0 + 2.1 - hh, q[1] + uz * (t - w)], B = [q[0] + ux * (t + w), y0 + 2.1 - hh, q[1] + uz * (t + w)], T0 = [A[0], y0 + 2.1, A[2]], T1 = [B[0], y0 + 2.1, B[2]];
          b.col(k % 3 === 1 ? C.kIndigo : C.kWhite, 0.85, 1).surf(0); b.quad(A, B, T1, T0); b.quad(B, A, T0, T1); } }
    }
    const rt = st('cypress'), nt = great ? rt.int(4, 6) : mid ? rt.int(2, 4) : 2;
    const lowW = wings.filter((w) => !w.tower && !w.kitchen && !w.tall).sort((p, q) => (p.d || 0) - (q.d || 0)); let atLip = 0;
    for (const w of lowW) {                                                                // M3 R5: two stand within 3 m of the lip, behind a curtain, in a gap or behind the lowest wings
      if (atLip >= 2) break; const i = pl.at(w.i0 + (w.k >> 1)), e = pl.E[i], p = pl.L[i], inn = (w.type === 'gap' ? 1.6 : w.type === 'curtain' ? 2.4 : (w.d || 0) + 2.2), x = p[0] + e.ux * e.len * 0.5 - e.nx * inn, z = p[1] + e.uz * e.len * 0.5 - e.nz * inn;
      if (!inside(x, z) || placed.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] + 1.2)) continue;
      placed.push([x, z, 1.3]); monCypress(b, C, x, Y + 0.3, z, rt.range(11, 17) * (small ? 0.8 : 1), rt.range(0.85, 1.15)); atLip++;
    }
    for (let k = atLip; k < nt + 1; k++) { const p = place(rt, 1.3, 14, 0.1, 0.95); if (p) monCypress(b, C, p[0], Y + 0.3, p[1], rt.range(11, 17) * (small ? 0.8 : 1), rt.range(0.85, 1.15)); }
    // m3b C3: two TALL cypresses behind the tall ranges (the one that carries the dome, then the longest), 7 to 11 m over their ridges,
    // so that trees stand in the outline from below on the built-up side too (a stream of their own)
    { const rq = st('tall-cypress'), tl = wings.filter((w) => w.tall && w.d).sort((p, q) => (q.dome ? 1e3 : 0) + (q.len || 0) - (p.dome ? 1e3 : 0) - (p.len || 0)); let made = 0;
      for (const w of tl) { if (made >= 2) break; const up = rq.range(7, 11), kk = rq.range(0.85, 1.1), first = rq.chance(0.5) ? 0.25 : 0.75, i = pl.at(w.i0 + (w.k >> 1)), e = pl.E[i], p = pl.L[i];
        for (const t of [first, 1 - first]) { const x = p[0] + e.ux * e.len * t - e.nx * (w.d + 2.4), z = p[1] + e.uz * e.len * t - e.nz * (w.d + 2.4);
          if (!inside(x, z) || free(x, z) < 1 || placed.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] + 1)) continue;
          placed.push([x, z, 1.3]); monCypress(b, C, x, Y + 0.3, z, w.h + 0.5 * w.d + up, kk); made++; break; } } }
  }
  yield;
  return yield* monFinishSteps(ctx, spec, M, { roofs, hoist, place, fits, placed });
}
// The monastery's last steps: a ruin's walls, what lies on the top, the rope and the net, the mesh.
function* monFinishSteps(ctx, spec, M, K) {
  const { st, C, snow, rim, Y, b, smoke, tile, pl, size, name } = M, ruin = size === 'ruin', S3 = (p, y) => [p[0], y, p[1]]; let { roofs, hoist } = K;
  if (ruin) {
    const rr = st('ruin'), on = []; for (let i = 0; i < pl.n; i++) on.push(rr() < 0.63);
    let last = 0; for (let i = 0; i < pl.n; i++) { if (!on[i]) { last = 0; continue; } last = monCurtain(b, C, rr, pl, i, Y, last || rr.range(2, 4.5), { broken: true, prev: last, end: !on[pl.at(i + 1)], tone: rr.range(0.88, 1.02), snow }); }
    yield;
    const p = K.place(rr, 3.6, 16, 0, 0.5) || [pl.cx, pl.cz], hw = Math.min(3, pl.r * 0.45), h = 4.6, ry = rr.range(0, TAU), win = [{ y0: Y + 2.2, y1: Y + 3.6, w: 0.8, t: [hw] }];
    C.tr(b, p[0], p[1], ry);                                                               // one gable end still standing, its window open to the sky
    monWall(b, C, [0.4, -hw], [0.4, hw], Y, Y, Y, Y + h, { rows: win, see: true, shade: 0, plain: true }); monWall(b, C, [-0.4, hw], [-0.4, -hw], Y, Y, Y, Y + h, { rows: win, see: true, shade: 0, plain: true, tone: 0.9 });
    b.col(C.stone).surf(S.SURF.MASONRY, 0, 0.75); b.tri([0.4, Y + h, -hw], [0.4, Y + h, hw], [0.4, Y + 7, 0]); b.col(mul3(C.stone, 0.9)); b.tri([-0.4, Y + h, hw], [-0.4, Y + h, -hw], [-0.4, Y + 7, 0]);
    for (const s of [-1, 1]) { b.quad([-0.4 * s, Y, hw * s], [0.4 * s, Y, hw * s], [0.4 * s, Y + h, hw * s], [-0.4 * s, Y + h, hw * s]); b.quad([-0.4 * s, Y + h, hw * s], [0.4 * s, Y + h, hw * s], [0.4 * s, Y + 7, 0], [-0.4 * s, Y + 7, 0]); }
    if (pl.r > 7) b.col(mul3(C.stone, 0.95), 0.8, 1).lathe(2.4 + hw * 0.4, Y, 0, [[2.2, 0], [2.2, 2.6], [1.6, 2.6], [1.6, 0]], 6, { arc: Math.PI * 0.7, start: -Math.PI * 0.2, facet: true });   // half an apse
    C.pop(b);
    for (let k = 0; k < 3; k++) { const q = K.place(rr, 1.4, 10, 0.1, 0.9); if (q) b.col(mul3(C.stone, rr.range(0.8, 1)), 0.75, 1).surf(S.SURF.MASONRY, 0, 0.75).sphere(q[0], Y + 0.1, q[1], rr.range(1.2, 2), 6, 3, { sy: 0.4 }); }
    const f = K.place(rr, 2, 12, 0.1, 0.8) || [pl.cx + 1.5, pl.cz + 1.5];                    // a fig: five balls of leaf on a crooked stem
    b.col(C.figWood).surf(0); monStick(b, [f[0], Y, f[1]], [f[0] + 0.3, Y + 1.8, f[1] - 0.2], 0.3);
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + rr.range(0, 1), d = k ? rr.range(0.9, 1.5) : 0; b.col(mul3(C.figLeaf, rr.range(0.8, 1.1)), 0.7, 1.1).surf(0).sphere(f[0] + 0.3 + d * Math.cos(a), Y + 2.2 + (k ? rr.range(-0.5, 0.4) : 0.6), f[1] - 0.2 + d * Math.sin(a), rr.range(0.9, 1.4), 6, 4); }
    const e = pl.E[0]; hoist = { at: [pl.L[0][0] + e.nx * 0.5, Y, pl.L[0][1] + e.nz * 0.5], foot: 0 };
  }
  // what lies on the top: flags, with turf where its stream says (mostly turf on a small top, turf and earth in a ruin), 0.3 m over the rock's cap
  const rp = st('paving'), turfK = ruin ? 0.85 : size === 'small' ? 0.6 : 0.25, n = rim.length; let A = 0; for (let i = 0; i < n; i++) { const p = rim[i], q = rim[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
  const pc = rim.map(() => mix3(rp.chance(turfK) ? mul3(C.turf, rp.range(0.8, 1.1)) : mul3(C.paving, rp.range(0.9, 1.05)), C.snow, snow * 0.9)), mc = mix3(ruin ? C.turf : C.paving, C.snow, snow * 0.9), cc = [pl.cx, Y + 0.3, pl.cz];
  b.col(mc).surf(0); for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (A > 0) b.tri(cc, S3(rim[j], Y + 0.3), S3(rim[i], Y + 0.3), mc, pc[j], pc[i]); else b.tri(cc, S3(rim[i], Y + 0.3), S3(rim[j], Y + 0.3), mc, pc[i], pc[j]); }
  // the rope and the net at its end: the rope goes to the caller's ribbon collector if one is given, else the mesh carries it as a thin stick
  if (hoist && hoist.foot > 0) {
    const a = hoist.at, e = [a[0], a[1] - hoist.foot + 1.7, a[2]];
    if (spec.net !== false) { b.col(C.sack, 0.7, 1).surf(0).sphere(a[0], a[1] - hoist.foot + 0.85, a[2], 0.8, 6, 4, { sy: 1.1 }); }
    if (spec.ribbons) spec.ribbons.seg(a, e, 0.05, mul3(C.rope, 0.8)); else if (spec.rope !== false) { b.col(mul3(C.rope, 0.7)).surf(0); monStick(b, a, e, 0.12); }
  }
  yield;
  const object = new THREE.Group(); object.name = 'monastery:' + name; let mesh = null;
  if (!spec.builder) { mesh = new THREE.Mesh(b.toGeometry(), monasteryMats(ctx, spec).facades); mesh.name = 'monastery:' + name; mesh.castShadow = mesh.receiveShadow = true; object.add(mesh); }
  return { object, mesh, triangles: b.triangles - M.tri0, radius: pl.far + 8, size, roofs, center: new THREE.Vector3(pl.cx, Y, pl.cz),
    hoist: { position: new THREE.Vector3(hoist.at[0], hoist.at[1], hoist.at[2]), foot: hoist.foot }, smoke: smoke.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    dispose() { if (mesh) mesh.geometry.dispose(); } };
}
export function makeMonastery(ctx, spec = {}) { return drain(monasterySteps(ctx, spec)); }
export async function makeMonasteryAsync(ctx, spec = {}) { const it = monasterySteps(ctx, spec); let r; while (!(r = it.next()).done) await ctx.yield(); return r.value; }

// the collectors and wall rules, for the world file (see the header)
export const tools = { makeRibbons, ribbonMaterial, makeMovers, moverMaterial, addBounce, banded, openings, figure, monasteryMaterials: (ctx, spec = {}) => monasteryMats(ctx, spec) };
