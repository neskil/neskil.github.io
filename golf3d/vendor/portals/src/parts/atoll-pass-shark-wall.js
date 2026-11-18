// Hero set piece for "atoll-pass-shark-wall" (The Pass): THE WALL.
// Some nine hundred grey reef sharks hanging nose-into-the-tide across a coral amphitheatre: a sheet 80 m
// wide, 20 m tall and 115 m deep, thickest round the lens' line and thinning to the flanks. Five populations
// (search "---- stations"): the TUNNEL (about 115 animals on a ring 1.4-2 m off the flyThrough line from z = 83 to
// z = -40, so that from the bend to the far side two or three hang whole a few metres ahead of the lens and dart out of
// the picture as it arrives: see THE CLEAR CONE under anchors), the SHEET (600, ranks
// behind ranks), the VANGUARD (38 low over the sand up-current), the STEP (54 at the lens' height from the canyon
// mouth to the sheet, 3-16 m off its line: the large profiles between the lens and the mass) and the FRONT (140:
// the sheet's leading face carried up-current to z = 75, so the bend looks into ranks, not across sand at a shoal).
// The world adds more with addSharks(): stragglers and a rear guard of some 235 down the exit canyon.
// Every animal holds station on a slow tail beat, the whole sheet sways together like wind through
// wheat, single sharks slip back a body length and beat forward again, and the sheet opens a tunnel
// round the lens as the camera flies through it and closes behind. No two near animals are alike: lengths run from
// 1.4 to 2.8 m, each has a tone of its own (dark slate to bronze, a dark saddle, a paler flank, a white belly), three in
// ten hang nose-up or nose-down, a third hold a heading up to 25 degrees off the rest, each at a small bank, and nearly
// four in ten of those well off the lens' line peel off on their own clocks: a slow banked turn of some 65 degrees, up
// (or, for a few, down) and 3.4 m aside with the body curved into it, and back, so a handful are turned in any frame
// (all hashed from the station, see attrsOf; SHARK_VERT "turner"; only animals more than 8 m off the line, and each
// straightens out while the lens is within 7 m, so none is ever seen turned toward the camera; and any
// animal within 7 m whose heading lies within 53 degrees of the line of sight swings broadside: none is seen end-on).
// THE PACERS (addPacer, PACER_VERT): up to fourteen (PACERS) large animals that are not stations of this file at all. The
// world places each one every frame (a matrix in the hero's local space, a stroke gain, a body bend and a tail-beat phase):
// each holds a station of its own in the wall, 1.2 m and more off the lens' line (the world's rule: one every 8 to 10 m of
// that line), slipping back and beating forward; the ranks ease off every pacer's axis in space (uPacA / uPacB: within its
// radius, all round it, the same rule for each) and close again behind it. Same model (close-up lod), same shading.
// Past the sheet stands the 8 m coral head (the manta cleaning station) the camera slides by on its way out.
//
// Frame (local space, metres): origin on the amphitheatre floor under the middle of the sheet, +Y up.
//   y = 0 is the floor (-30 m in the brief), y = 30 is the sea surface. The camera arrives from +Z
//   flying toward -Z; the sharks face +Z turned by the crossing angle (seeded 50-56 degrees: at the
//   brief's 30 every animal left of the lens was seen nose-on) toward +X, and the heading fans a further
//   14 degrees on the camera's left (and another 17 within 8 m of the lens' line on that side), so flanks, fins and
//   tails read on both sides and no near animal is seen nose-on. The current runs along -anchors.heading. The sheet
//   spans y = 4 .. 24.
// Drawing: every shark mesh is sorted along z and the number of instances drawn follows the lens (update(): "windows").
//   While the camera looks down the current, animals more than 14 m behind it are dropped, the world's rear guard waits
//   until it is within 125 m, and the tunnel's close-up model (lod 2) is kept to the animals from 5 m behind the lens
//   to 14 m ahead (the same animals are drawn with the ranks' model further ahead). A camera looking any other way (the
//   part viewer) draws everything. So the wall costs at most about 185k triangles in any frame.
//
// opts:
//   palette     brief palette [cobalt, mint, jade, white, tanPink, deepTeal, orange]
//   count       sharks in the sheet (default 600; the far ranks are thinned by ctx.quality.detail; the tunnel and
//               vanguard scale with it)
//   crossAngle  degrees between the camera line (-Z) and the sharks' heading (default: seeded 50-56)
//   halfWidth   half width of the amphitheatre the sheet must stay inside (default 41)
//   bounce      colour of the light the sand throws back up into bellies (default: from sunColor)
//   standalone  'auto' (default) | true | false. The world normally supplies water fog (FogExp2 ~0.009),
//               the canyon floor and the water backdrop. Standalone adds the piece's own: an 80 m haze,
//               a water dome with Snell's window and a rippled sand floor. 'auto' turns them on only
//               when the scene it is added to has no dense fog (the part viewer).
//   coralHead   true (default): build the 8 m coral head at anchors.coralHead
//   sunDir      Vector3 toward the sun in the hero's local frame (default 78 degrees up, astern and
//               20 degrees left of a camera flying -Z)
//   sunColor, skyLight, deepLight   hex colours of the key, the down-welling and up-welling light
//   haze, hazeDeep                  hex colours of the standalone haze (default #1B7FA6 / palette[5])
//   footDark    0..1 (default 0): for looks with the sun high. The foot and the shaded lower half of every reef wall take
//               a tone two steps below the water's own, turned olive, the underside of each rim is darker, and the
//               reef's own extra haze is halved: far walls stand as rock to the sand instead of fading into the blue
//
// Exports for the world: sharkGeometry(lod) (unit shark, nose +Z; lod 0 near, 1 far, 2 close-up) and makeWriter()
//   (rock vertex format aCol rgb+occlusion, aMat 0 sand / 1 rock / 2 plate coral / 3 mound coral); the return value
//   carries rockMaterial (ROCK_FRAG: crust in soft lobed patches of olive, ochre and pink coralline read through one slow
//   warp, raised encrusting colonies, a few wandering crevices (the centre lines of a slow field stretched up the wall, on a
//   quarter of the rock, never a net), a few shadowed pockets, polyp cups only where a cup spans a dozen pixels; nothing on
//   the rock is cellular (the only cell fields are the lobes of the mound corals themselves and the polyps); a
//   caustic net that reaches 30 m down on open sand, slow pools of shaft light (swShaft, shared with the sharks), screen-space relief;
//   the reef is lit by the writer's occlusion, which carries height: warm and caustic-dappled on the upper third of a
//   wall or the crown of a dome (aCol.a over 0.8), draining at the foot and in creases (0.5 and under) to a deep olive-teal
//   that keeps the crust's hue and sits below the tone of the water behind, so a wall stands as solid rock to its foot;
//   with footDark (the noon looks) a tall wall also carries three or four dark vertical creases (the centre lines of a
//   slow field stretched up the wall), a shadow band under its rim and broad olive / ochre patches, and its caustic net
//   is at half strength: a weathered face, not a smooth lit slab;
//   pale-rimmed coral domes, and a little distance haze of its own on top of the scene fog).
//   Sixth polish pass: the caustic net is projected three ways and blended by the modelled normal (never stretched where
//   a wall turns), the crust's strata are 2.3 : 1 instead of 6 : 1; down the exit canyon (local z under -52) distant reef
//   goes to the water's clean blue tone for tone (warm coral stays near the lens and in the shafts), the sand's ripples
//   wander, fork and lie in patches, and its pale rivers are short lenses. The ranks stand in knots and gaps (attrsOf:
//   a little over half the 26 m cells of the wall close up toward their own middle).
//   Seventh pass: the exit canyon's walls keep their warm crust to some 35 m from the lens (the cool cast comes in from 36
//   to 74 m, six tenths at most) and carry the one sun-projected caustic net again, in broad warm swirls; the forked sand
//   ripples there are a third gentler.
//   Eighth pass, THE REEF AT ARM'S LENGTH (a rule in space: the fine grain within 14 m of the lens, gone by 30 m; plates
//   and plate tiers within 30 m, gone by 60 m): the encrusting colonies take crisp edges, plate tiers a metre or two
//   across stand out of the wall with a pocket of shadow under each, two generations of plates stand on the crust (a
//   forearm to a metre across, and a hand across; thresholded fields, never a cell net), each with a lit lip, a pale
//   growing rim and a pocket of shadow under its lower lip (the same field read a hand higher up the wall); the crust is
//   pitted and grained at 11 and 4 cm; and the caustic net lies on the faces that look up (ledges, crowns, plate lips)
//   and never in the shadow under a plate: an upright face beside the lens has none (down the exit canyon the walls keep
//   the seventh pass's net beyond some 44 m, and a seventh of it within 20 m).
// Returned extras: addSharks(points, lod, { rng, range, back, name, offset }) (more of the same animals, see the end of
//   buildHero), addPacer({ length, variant, phase }) -> { mesh, length, place(matrix, on, stroke, bend, beat, clear) }
//   (one large animal the world places itself, at most fourteen (PACERS); call it in build()), uniforms (shared light / motion uniforms), setProgress(u) is NOT needed: the
//   parting is keyed to the camera handed to update(dt, time, camera), so it always coincides with the
//   lens. setParting(k) scales it (0 = sharks never move aside), setLight({sunDir, sunColor, skyLight,
//   deepLight}) relights, setStandalone(bool) forces the standalone dressing on or off.
//
// anchors (all local space):
//   heading        unit vector the sharks face (the current runs the other way)
//   flyThrough     ordered camera points: the bend 96 m out, into the sheet at -15 m, out at -17 m,
//                  10 m left of the coral head level with its crown, then down toward the scour bowl.
//                  The only solid near the line is the coral head (10 m clear); the sharks themselves
//                  clear the lens by parting (SHARK_VERT: pushed off the line inside 2.4 m, never nearer
//                  than 1.35 m; tunnel stations keep nose and tail off the line; and THE CLEAR CONE: no station
//                  animal stands inside the picture within 2 m ahead of the lens. Whoever would, swims up or down
//                  out of the frame as the lens comes within 6 m: a shove eased over 4 m of approach, with a surge along its own
//                  heading, the nose pitched the way it goes and a hard tail stroke, at its full size (nothing is
//                  ever drawn small or faded), and it settles back behind the lens: uGate, search "clear cone".
//                  The shove is full from side to side of the picture and eases to nothing over the 1.5 m beyond each
//                  side edge: a bounded slope, so an animal the frame sweeps toward is clear before the edge reaches
//                  it and none is thrown out in one frame. The large animals that slide by 1.2 m and more off the
//                  line are the world's pacers, which the cone does not touch.)
//   viewpoints     bend: where the wall first resolves (75 m out); inside: the heart of the sheet
//   sheet          { center, size:[80,20,80], yMin, yMax } axis: size z is measured along heading
//   coralHead      { position (base centre), crownY, radius }
//   mantaOrbit     { center, radius, y } a circle round the coral head clear of every shark
//   escortLanes    two points either side of the exit line where escort sharks can run
//   portalSeat     { position, facing } suggestion for the 14 m ring on the lagoon lip (centre at
//                  -10 m), facing back up a 20 degree climb; nothing of the hero stands near it
//   surfaceY, floorY
//
// Size: the sheet is 80 x 20 x 80 m (bounding radius ~57 about [0, 14, 0]); the coral head stands
//   outside it at [11, 0, -64]. The returned radius 24 / height 24 only frame the part viewer's orbit
//   so that it rides inside the edge of the sheet, where the piece is meant to be seen.
// Cost: at most about 185k triangles in 12 draw calls in any frame, and each pacer adds one call and one close-up model (the
//   world's ten to fourteen: up to 14 calls and 7.8k triangles more; the ranks' vertex shader runs its parting loop over all
//   fourteen slots, an empty slot moving nothing) (tunnel ~140 animals: 560 triangles each near the lens
//   in five runs, 312 further ahead; near sharks 148 x 312, step 54 x 312, front 34 x 312 + ~105 x 112, far sharks ~490 x 112
//   thinned by ctx.quality.detail, coral head 9k); standalone adds 2 calls and ~6k triangles. No lights, no
//   textures, build ~110 ms in steps of a few ms (it yields). Far ranks are drawn up to 1.4x longer and 2.6x stouter beyond ~30 m so
//   the wall reads as animals from the bend instead of specks; the cheat dissolves on approach.
// Lighting: self-lit from its own uniforms (no scene lights needed): a high warm key from astern,
//   mint-blue light from above, deep teal from below, crawling caustics on every upward face down to
//   18 m, and scene fog. It wants open, lit, hazy water behind it (fog ~#1B7FA6), never a wall.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0B3C9C', '#8DF3D6', '#17B093', '#F6FCF8', '#D9AF98', '#0C5078', '#FF7B2E'];
const SURFACE_Y = 30;

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uSunDir, uSunColor, uSkyLight, uDeepLight;
uniform vec3 uHazeCol, uHazeDeep, uCamLocal;
uniform float uHaze, uSurfaceY;
uniform float uFootK;   // 0..1: how far the foot of the reef is tied to a tone below the water's own (the high-sun looks)
// crawling caustic net: bright thin lines where three warped sine fields cancel
float swCaustic(vec2 p, float t){
  float w = sin(p.x * 1.1 + sin(p.y * 0.9 + t) * 1.3 + t * 0.7)
          + sin(p.y * 1.3 - sin(p.x * 0.8 - t * 0.8) * 1.2 + t * 0.5)
          + sin((p.x + p.y) * 0.8 + sin((p.x - p.y) * 0.7 + t * 0.6));
  float c = 1.0 - min(abs(w) * 0.42, 1.0);
  c = c * c; c = c * c;
  return c * c;
}
float swCaustics(vec3 lp, float t){
  // projected along the (steep) sun direction so the net slides coherently over bodies
  vec2 p = lp.xz - uSunDir.xz * (lp.y / max(uSunDir.y, 0.2));
  float c = swCaustic(p * 0.85, t * 1.3) + 0.6 * swCaustic(p * 1.9 + 7.3, t * 1.7 + 2.0);
  // strongest near the surface, gone 18 m down
  return c * smoothstep(uSurfaceY - 22.0, uSurfaceY - 6.0, lp.y);
}
// sun shafts as they land: slow pools of light some fifteen metres across, wandering down-sun, 0 between shafts .. 1 inside one
// (the sharks, the sand and the reef all read the same field, so a shaft rakes across backs and floor together)
float swShaft(vec3 lp, float t){
  vec2 p = lp.xz - uSunDir.xz * (lp.y / max(uSunDir.y, 0.2));
  float a = sin(p.x * 0.23 + 1.7 * sin(p.y * 0.11 + t * 0.13) + t * 0.21) * sin(p.y * 0.19 - 1.3 * sin(p.x * 0.09 - t * 0.11) + t * 0.17);
  return smoothstep(0.08, 0.7, a);
}
// colour of open water in a direction (the dome shows it, the haze fades to it)
vec3 swWater(vec3 dir){
  float h = dir.y;
  vec3 col = mix(uHazeCol, uHazeDeep, (1.0 - smoothstep(-0.75, 0.08, h)));
  col = mix(col, uHazeCol * 1.55 + uSkyLight * 0.10, smoothstep(0.05, 0.8, h));
  return col;
}
vec3 swHaze(vec3 col, vec3 lp){
  vec3 d = lp - uCamLocal;
  float dist = length(d);
  float f = 1.0 - exp(-uHaze * uHaze * dist * dist);
  return mix(col, swWater(d / max(dist, 1e-3)), f);
}
// daylight thins with depth: 1 at the surface, ~0.43 on the floor 30 m down
float swDepth(float y){ return exp(-max(uSurfaceY - y, 0.0) * 0.028); }
float swHash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float swNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(swHash(i), swHash(i + vec3(1,0,0)), f.x), mix(swHash(i + vec3(0,1,0)), swHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(swHash(i + vec3(0,0,1)), swHash(i + vec3(1,0,1)), f.x), mix(swHash(i + vec3(0,1,1)), swHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

// ---------------------------------------------------------------- the shark (unit length, nose +Z)
// rows: [z, dorsal y, ventral y, half width]
const BODY = [
  [0.487, 0.011, -0.007, 0.020], [0.462, 0.025, -0.015, 0.039], [0.425, 0.040, -0.026, 0.053],
  [0.365, 0.055, -0.043, 0.064], [0.290, 0.067, -0.057, 0.070], [0.205, 0.076, -0.066, 0.072],
  [0.110, 0.080, -0.070, 0.070], [0.010, 0.076, -0.066, 0.062], [-0.090, 0.066, -0.056, 0.050],
  [-0.190, 0.052, -0.043, 0.036], [-0.275, 0.038, -0.029, 0.024], [-0.340, 0.027, -0.018, 0.016],
  [-0.388, 0.021, -0.013, 0.010],
];
const bodyAt = (z) => {
  let i = 0; while (i < BODY.length - 2 && BODY[i + 1][0] > z) i++;
  const a = BODY[i], b = BODY[i + 1], t = clamp((a[0] - z) / (a[0] - b[0]), 0, 1);
  return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
};

// info per vertex: x = part (0 body, 1 first dorsal, 2 caudal, 3 pectoral, 4 small fins),
// y = trailing-edge weight, z = tip weight
// smooth (Catmull-Rom) reading of the same outline, for the close-up LOD
const bodySmooth = (z) => {
  let i = 0; while (i < BODY.length - 2 && BODY[i + 1][0] > z) i++;
  const p0 = BODY[Math.max(0, i - 1)], p1 = BODY[i], p2 = BODY[i + 1], p3 = BODY[Math.min(BODY.length - 1, i + 2)], t = clamp((p1[0] - z) / (p1[0] - p2[0]), 0, 1);
  const cr = (k) => { const a = p0[k], b = p1[k], c = p2[k], d = p3[k]; return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - 3 * c + d - a) * t * t * t); };
  return [cr(1), cr(2), Math.max(0.004, cr(3))];
};
// lod 0: the wall's near ranks (312 triangles). lod 1: far ranks (112). lod 2: the animals that slide past the lens
// (12 sides, 21 smoothed rows, ~560 triangles).
export function sharkGeometry(lod) {
  const near = lod !== 1, hero = lod === 2, sides = hero ? 12 : near ? 10 : 6;
  const rowsZ = hero ? BODY.flatMap((r, i) => (i < 8 ? [r[0], (r[0] + BODY[i + 1][0]) * 0.5] : [r[0]])) : near ? BODY.map((r) => r[0]) : [0.47, 0.40, 0.29, 0.13, -0.06, -0.24, -0.388];
  const pos = [], info = [], idx = [];
  const v = (x, y, z, part = 0, edge = 0, tip = 0) => { pos.push(x, y, z); info.push(part, edge, tip); return pos.length / 3 - 1; };
  // body loft
  const rows = [];
  for (const z of rowsZ) {
    const [top, bot, w] = hero ? bodySmooth(z) : bodyAt(z), yc = lerp(bot, top, 0.42), row = [];
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const x = w * Math.sign(sn) * Math.pow(Math.abs(sn), 0.82);
      const y = cs > 0 ? yc + (top - yc) * Math.pow(cs, 0.9) : yc - (yc - bot) * Math.pow(-cs, 0.72);
      row.push(v(x, y, z));
    }
    rows.push(row);
  }
  const nose = v(0, 0.001, 0.5), n = rows.length, lastZ = rowsZ[n - 1], [lt, lb] = bodyAt(lastZ), tail = v(0, (lt + lb) * 0.5, lastZ - 0.012);
  for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; idx.push(rows[0][j], rows[0][j1], nose, rows[n - 1][j1], rows[n - 1][j], tail); }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const j1 = (j + 1) % sides, a = rows[i][j], b = rows[i][j1], c = rows[i + 1][j1], d = rows[i + 1][j];
    idx.push(a, d, c, a, c, b);
  }
  // fin strips: lead[] and trail[] are matched outlines (base -> tip) of [x, y, z]
  const strip = (lead, trail, part, flip = false) => {
    const m = lead.length, L = [], T = [];
    for (let i = 0; i < m; i++) { const t = i / (m - 1); L.push(v(lead[i][0], lead[i][1], lead[i][2], part, 0, t)); T.push(v(trail[i][0], trail[i][1], trail[i][2], part, 1, t)); }
    for (let i = 0; i < m - 1; i++) { if (flip) idx.push(L[i], L[i + 1], T[i + 1], L[i], T[i + 1], T[i]); else idx.push(L[i], T[i + 1], L[i + 1], L[i], T[i], T[i + 1]); }
  };
  const pick = (arr) => (near ? arr : [arr[0], arr[arr.length >> 1], arr[arr.length - 1]]);
  const back = (z) => bodyAt(z)[0], belly = (z) => bodyAt(z)[1];
  // first dorsal: a thin wedge (two skins apart at the base, meeting at the trailing edge)
  const dL = [[0.150, back(0.15) - 0.006], [0.118, back(0.12) + 0.040], [0.090, back(0.09) + 0.072], [0.064, back(0.06) + 0.094], [0.040, back(0.04) + 0.103]];
  const dT = [[0.012, back(0.01) + 0.004], [0.036, back(0.04) + 0.028], [0.040, back(0.04) + 0.058], [0.036, back(0.04) + 0.086], [0.030, back(0.03) + 0.100]];
  for (const sx of near ? [-1, 1] : [0]) {
    const th = [0.0075, 0.006, 0.0045, 0.003, 0.0008];
    strip(pick(dL.map((p, i) => [sx * th[i], p[1], p[0]])), pick(dT.map((p) => [0, p[1], p[0]])), 1, sx < 0);
  }
  // second dorsal and anal
  strip([[0, back(-0.215) - 0.004, -0.205], [0, back(-0.24) + 0.026, -0.243]], [[0, back(-0.262) - 0.002, -0.262], [0, back(-0.27) + 0.008, -0.278]], 4);
  strip([[0, belly(-0.22) + 0.004, -0.215], [0, belly(-0.25) - 0.026, -0.252]], [[0, belly(-0.268) + 0.002, -0.268], [0, belly(-0.28) - 0.007, -0.284]], 4, true);
  // caudal: long upper lobe with its terminal notch, short lower lobe
  const cuL = [[-0.372, 0.022], [-0.412, 0.062], [-0.448, 0.102], [-0.476, 0.134], [-0.498, 0.158]];
  const cuT = [[-0.418, 0.006], [-0.440, 0.044], [-0.462, 0.086], [-0.486, 0.116], [-0.500, 0.140]];
  strip(pick(cuL.map((p) => [0, p[1], p[0]])), pick(cuT.map((p) => [0, p[1], p[0]])), 2);
  const clL = [[-0.372, -0.013], [-0.402, -0.046], [-0.432, -0.080]], clT = [[-0.418, 0.006], [-0.428, -0.032], [-0.444, -0.074]];
  strip(clL.map((p) => [0, p[1], p[0]]), clT.map((p) => [0, p[1], p[0]]), 2, true);
  // pectorals (long, falcate, drooped) and pelvics
  for (const sx of [-1, 1]) {
    const pL = [[0.058, -0.040, 0.240], [0.098, -0.058, 0.205], [0.138, -0.074, 0.162], [0.170, -0.086, 0.118], [0.190, -0.094, 0.078]];
    const pT = [[0.060, -0.044, 0.172], [0.092, -0.057, 0.150], [0.128, -0.071, 0.122], [0.162, -0.084, 0.096], [0.186, -0.093, 0.072]];
    strip(pick(pL.map((p) => [sx * p[0], p[1], p[2]])), pick(pT.map((p) => [sx * p[0], p[1], p[2]])), 3, sx > 0);
    strip([[sx * 0.030, belly(-0.10) + 0.010, -0.098], [sx * 0.058, belly(-0.12) - 0.014, -0.138]],
      [[sx * 0.026, belly(-0.15) + 0.008, -0.150], [sx * 0.050, belly(-0.15) - 0.012, -0.158]], 4, sx > 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // make sure the hull faces outward (the fins are double-sided sheets)
  const nrm = g.attributes.normal; let out = 0;
  for (const row of rows) for (const i of row) out += nrm.getX(i) * pos[i * 3] + nrm.getY(i) * pos[i * 3 + 1];
  if (out < 0) { const hullEnd = sides * 6 + (n - 1) * sides * 6; for (let i = 0; i < hullEnd; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}

// ---------------------------------------------------------------- shark material
const PACERS = 14;   // how many pacers the hero carries (addPacer): the most the world's rule can ask for, one every 8 m of 105 m of line
const SHARK_VERT = /* glsl */`
attribute vec3 aInfo;
attribute vec3 iPos;
attribute vec4 iA;   // length (m), phase, tail beat Hz, variant
attribute vec4 iB;   // yaw jitter, pitch jitter, slip period, slip phase
uniform vec3 uCamDir;
uniform vec2 uHead;   // sin, cos of the heading
uniform vec4 uSway;   // amplitude, wavenumber, omega, yaw gain
uniform float uPart;
uniform vec3 uCamFwd, uCamRt, uCamUp;   // the lens' gaze, right and up (local space)
uniform vec4 uGate;   // tan of half the horizontal / vertical field of view; the clear cone's far end: fully open at .z m, untouched beyond .w m
uniform vec4 uPacA[${PACERS}], uPacB[${PACERS}];   // the pacers (see addPacer): centre xyz + the radius the ranks keep clear of its axis (0: none); heading xyz + half length
varying vec3 vModel, vN, vLocal, vInfo;
varying vec4 vInst;
#include <fog_pars_vertex>
${GLSL_COMMON}
vec3 swRotY(vec3 v, float s, float c){ return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
void main(){
  // (a quiet cheat: animals far down the corridor are drawn a third larger, so the wall reads as sharks from the bend)
  float len = iA.x * (1.0 + 0.35 * smoothstep(38.0, 100.0, length(iPos - uCamLocal))), ph = iA.y;
  vec3 fwd = vec3(uHead.x, 0.0, uHead.y), lat = vec3(uHead.y, 0.0, -uHead.x);
  // ---- where this animal hangs: shared sway, slow wander, the slip-and-recover
  float along = dot(iPos, fwd);
  float swPh = uSway.y * along + uSway.z * uTime + dot(iPos, lat) * 0.035 + iPos.y * 0.06;
  float sway = uSway.x * sin(swPh), swayYaw = uSway.w * cos(swPh);
  float sp = fract(uTime / max(iB.z, 1.0) + iB.w) * 4.0;
  float slip = smoothstep(0.0, 0.62, sp) * (1.0 - smoothstep(0.66, 1.0, sp));
  float kick = smoothstep(0.56, 0.72, sp) * (1.0 - smoothstep(0.9, 1.05, sp));
  vec3 drift = vec3(sin(uTime * 0.23 + ph * 11.0), 0.6 * sin(uTime * 0.17 + ph * 17.0), sin(uTime * 0.19 + ph * 23.0)) * 0.3;
  // a few animals (the fraction of iA.w marks them) peel off: a slow banked turn out of the rank, up and aside, and back
  // into station, the body curved into the turn; each on its own clock, so at any moment a handful are turned
  float turner = step(0.2, fract(iA.w)), tcy = fract(uTime / (17.0 + 15.0 * fract(ph * 3.7)) + fract(ph * 23.1));
  float tOn = smoothstep(0.0, 0.22, tcy) * (1.0 - smoothstep(0.50, 0.80, tcy)) * turner;
  float tOut = smoothstep(0.08, 0.5, tcy) * (1.0 - smoothstep(0.62, 1.0, tcy)) * turner;
  // (no animal within seven metres of the lens is turned: a turner straightens out and holds station as we come)
  float tFar = smoothstep(7.0, 11.0, length(iPos - uCamLocal));
  tOn *= tFar; tOut *= tFar;
  float tSg = fract(ph * 37.0) < 0.5 ? -1.0 : 1.0, tUp = fract(ph * 53.0) < 0.6 ? 1.0 : -0.7;   // (most peel up and aside, some down)
  vec3 C = iPos + lat * sway - fwd * (slip * len * 1.05) + drift + (lat * (tSg * 3.4) + vec3(0.0, 1.5 * tUp, 0.0) - fwd * 1.6) * tOut;
  // ---- the parting: a tunnel opens along the lens' line of travel and closes behind it
  vec3 rel = C - uCamLocal;
  float s = dot(rel, uCamDir);
  vec3 perp = rel - s * uCamDir;
  float d = length(perp);
  vec3 pdir = mix(lat, perp / max(d, 1e-3), step(0.05, d));
  float wAx = smoothstep(-9.0, -2.5, s) * (1.0 - smoothstep(7.0, 17.0, s)) * uPart;
  float inside = max(0.0, 1.0 - d / 2.4);
  C += pdir * (wAx * 1.6 * inside * inside);
  // the ranks give way to a pacer (a large animal holding station among them, see addPacer): whoever hangs within its
  // radius is eased off its axis, never nearer than three quarters of that radius, and settles back when it has gone
  // (a rule in space: the offset is measured from the pacer's own axis, all round it, wherever the lens is)
  for (int i = 0; i < ${PACERS}; i++) {
    vec3 q = C - uPacA[i].xyz; float tq = clamp(dot(q, uPacB[i].xyz), -uPacB[i].w, uPacB[i].w);
    vec3 qd = q - uPacB[i].xyz * tq; float ql = length(qd), qk = max(0.0, 1.0 - ql / max(uPacA[i].w, 1e-3));
    C += qd / max(ql, 1e-3) * (uPacA[i].w * qk * qk);
  }
  // never through the lens, whatever the heading
  float dc = length(C - uCamLocal);
  C += (C - uCamLocal) / max(dc, 1e-3) * max(0.0, 1.35 - dc) * uPart;
  // ---- the lens' clear cone: within uGate.z metres ahead no animal stands inside the picture. The frame at s metres is an
  // rounded rectangle of half axes tan * s (plus the animal's own half length and girth); whoever would be inside it swims out of
  // the frame, up or down, as the lens comes within uGate.w metres: an eased shove that covers four metres of travel, the
  // nose pitched the way it goes, a surge along its own heading and a hard tail stroke. It leaves as a shark, at its
  // full size (nothing is ever drawn small), crosses the frame's edge moving fast, holds outside while we pass and
  // settles back behind us.
  vec3 rl = C - uCamLocal;
  float gs = dot(rl, uCamFwd), gx = dot(rl, uCamRt), gy = dot(rl, uCamUp);
  float gT = clamp((uGate.w - gs) / max(uGate.w - uGate.z, 0.1), 0.0, 1.0);
  // (sixth polish pass) the shove is eased in over 4 m of the lens' approach (uGate.w 6 m, it was 2.4 m of approach: an animal covered
  // three metres in a fifth of a second and was gone in a frame or two), and what it must clear is the frame at uGate.z,
  // never the wider frame at its own range: an animal eases a metre or two off the lens' line while it is still ahead,
  // and nobody further out is moved at all
  float gate = gT * gT * (3.0 - 2.0 * gT) * smoothstep(-3.5, -0.8, gs) * uPart;
  float gsc = clamp(gs, 0.0, uGate.z);
  float gax = uGate.x * gsc + 0.55 * len + 0.35, gay = uGate.y * gsc + 0.32 * len + 0.6;
  float gSg = dot(iPos - uCamLocal, uCamUp) + 0.4 * (fract(ph * 9.7) - 0.5) >= 0.0 ? 1.0 : -1.0;
  // (the profile across the frame has a bounded slope: full from side to side of the picture, then eased to nothing over
  // the 1.5 m beyond each side edge. So an animal the frame sweeps toward as the lens turns is already on its way while
  // it is still outside the picture and is clear of it, above or below, by the time the edge reaches it. The old rounded
  // rectangle was vertical at its ends: an animal its edge swept over stood in the picture and was thrown a full frame
  // height in one twenty-fifth of a second)
  float gNeed = max(0.0, gay * (1.0 - smoothstep(gax, gax + 1.5, abs(gx))) - gSg * gy), gPush = gNeed * gate;
  C += uCamUp * (gSg * gPush);
  float gShear = min(1.0, gPush * 0.8);
  C += fwd * (0.9 * gShear);
  float side = sign(dot(pdir, lat) + 1e-4);
  float shear = max(wAx * min(1.0, inside * 2.2), gShear);
  float flick = min(1.5, shear + kick);
  // ---- the body: a travelling wave that grows to the tail
  vec3 p = position;
  float t01 = 0.5 - p.z;
  float amp = (0.010 + 0.082 * t01 * t01) * (1.0 + 1.3 * flick);
  float dAmp = 0.164 * t01 * (1.0 + 1.3 * flick);
  float beat = uTime * 6.2832 * iA.z * (1.0 + 0.9 * flick) + ph * 6.2832 - t01 * 4.2;
  p.xy *= 1.0 + 0.85 * smoothstep(26.0, 110.0, length(rel));
  p.x += amp * sin(beat) + tSg * tOn * 0.42 * (p.z * p.z - 0.05);
  float slope = -dAmp * sin(beat) + 4.2 * amp * cos(beat);
  vec3 n = normalize(vec3(normal.x, normal.y, normal.z - slope * normal.x));
  // fins trail the stroke a little
  p.x += aInfo.z * step(0.5, aInfo.x) * 0.012 * sin(beat - 0.9);
  // roll (belly toward the lens while shearing aside), pitch, yaw
  // (each animal also hangs at a small bank of its own, so no two near ones share a pose)
  float ro = -side * 0.36 * shear + 0.05 * sin(uTime * 0.31 + ph * 31.0) - tSg * 0.62 * tOn + 0.30 * (fract(ph * 13.7) - 0.5) * step(0.45, fract(ph * 5.3));
  float cr = cos(ro), sr = sin(ro);
  p.xy = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr); n.xy = vec2(n.x * cr - n.y * sr, n.x * sr + n.y * cr);
  float pi = iB.y + 0.03 * sin(uTime * 0.21 + ph * 13.0) - gSg * 0.30 * gShear - 0.30 * tUp * tOn, cp = cos(pi), spi = sin(pi);
  p.yz = vec2(p.y * cp - p.z * spi, p.y * spi + p.z * cp); n.yz = vec2(n.y * cp - n.z * spi, n.y * spi + n.z * cp);
  float yaw = iB.x + swayYaw + side * 0.24 * shear - 0.10 * kick * sin(ph * 40.0) + tSg * 1.15 * tOn;
  // no animal within a dozen metres is seen end-on: where the line of sight comes within 53 degrees of its heading (the
  // near animals on the camera's left) it swings broadside as the lens comes, up to 53 degrees, and swings back behind us
  vec2 gr = C.xz - uCamLocal.xz; gr /= max(length(gr), 1e-3);
  float hx0 = sin(yaw) * uHead.y + cos(yaw) * uHead.x, hz0 = cos(yaw) * uHead.y - sin(yaw) * uHead.x;
  float gc = hx0 * gr.x + hz0 * gr.y, gsn = hx0 * gr.y - hz0 * gr.x;
  yaw += (gsn >= 0.0 ? 1.0 : -1.0) * (gc >= 0.0 ? 1.0 : -1.0) * (1.0 - smoothstep(7.0, 12.0, length(C - uCamLocal))) * max(0.0, abs(gc) - 0.6) * 2.3;
  float cy = cos(yaw), sy = sin(yaw);
  p = swRotY(swRotY(p, sy, cy), uHead.x, uHead.y);
  n = swRotY(swRotY(n, sy, cy), uHead.x, uHead.y);
  // far ranks are drawn a little stouter so the wall still reads as animals, not specks, from the bend
  float far = smoothstep(26.0, 110.0, length(C - uCamLocal));
  vec3 local = C + p * (len * (1.0 + 0.4 * far));
  vModel = position; vN = n; vLocal = local; vInfo = aInfo; vInst = vec4(iA.w, ph, shear, len);
  vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// A pacer: one large animal placed by the world every frame (uPM: its frame in the hero's local space), not a station.
// The same model, the same stroke and the same fragment shader as the ranks; no parting, no clear cone, no sway.
const PACER_VERT = /* glsl */`
attribute vec3 aInfo;
uniform mat4 uPM;     // the animal's own frame in the hero's local space (rotation and position, no scale)
uniform vec4 uPA;     // length (m), phase / tone, variant, tail-beat phase (radians, run on by the world)
uniform vec3 uPB;     // stroke gain (0 cruising .. 1.5 a hard flick), body bend (a C toward its own +x), unused
varying vec3 vModel, vN, vLocal, vInfo;
varying vec4 vInst;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float t01 = 0.5 - p.z, fl = uPB.x;
  float amp = (0.010 + 0.082 * t01 * t01) * (1.0 + 1.3 * fl), dAmp = 0.164 * t01 * (1.0 + 1.3 * fl);
  float beat = uPA.w - t01 * 4.2;
  p.x += amp * sin(beat) + uPB.y * (p.z * p.z - 0.05);
  float slope = -dAmp * sin(beat) + 4.2 * amp * cos(beat) + 2.0 * uPB.y * p.z;
  vec3 n = normalize(vec3(normal.x, normal.y, normal.z - slope * normal.x));
  p.x += aInfo.z * step(0.5, aInfo.x) * 0.012 * sin(beat - 0.9);
  vec3 local = (uPM * vec4(p * uPA.x, 1.0)).xyz;
  vModel = position; vN = normalize(mat3(uPM) * n); vLocal = local; vInfo = aInfo; vInst = vec4(uPA.z, uPA.y, fl, uPA.x);
  vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHARK_FRAG = /* glsl */`
uniform vec3 uBack, uBelly, uBronze, uBounce;
varying vec3 vModel, vN, vLocal, vInfo;
varying vec4 vInst;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 m = vModel;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamLocal - vLocal);
  float part = vInfo.x, isFin = step(0.5, part), variant = vInst.x;
  float px = fwidth(m.z) + fwidth(m.y) + 1e-5;
  float mott = swNoise(m * vec3(60.0, 60.0, 34.0) + vInst.y * 50.0);
  // ---- countershading: bronze-grey back, paler flank, white belly with a wavering edge
  // (each animal a tone of its own, from dark slate to bronze; a dark saddle along the back, a flank one step paler, and
  // the white belly meeting it on a crisp wavering line about the widest part of the body)
  float line = mix(0.002, -0.020, smoothstep(-0.38, 0.25, m.z)) + 0.006 * sin(m.z * 21.0 + vInst.y * 9.0);
  float belly = (1.0 - smoothstep(line - 0.010, line + 0.010, m.y + (mott - 0.5) * 0.010));
  float dorsal = smoothstep(0.010, 0.066, m.y);
  vec3 back = mix(uBack * 0.92, uBronze, 0.10 + 0.62 * fract(vInst.y * 7.31)) * (0.64 + 0.56 * fract(vInst.y * 3.17 + 0.37)) * (0.86 + 0.28 * mott);
  vec3 alb = mix(back * 1.16 + 0.014, back * 0.60, dorsal);
  alb = mix(alb, uBelly, belly * (1.0 - isFin));
  // blacktip: a pale wedge along the flank
  alb = mix(alb, uBelly * 0.8, step(0.5, variant) * step(variant, 1.5) * (1.0 - isFin) * (1.0 - smoothstep(0.0, 0.022, abs(m.y - 0.004 + m.z * 0.05))) * (1.0 - smoothstep(-0.05, 0.2, m.z)) * smoothstep(-0.36, -0.2, m.z) * 0.6);
  // ---- fins
  float under = (1.0 - smoothstep(-0.3, 0.1, N.y));
  vec3 fin = back * (1.0 - 0.35 * vInfo.z);
  fin = mix(fin, uBelly * 0.92, under * step(2.5, part) * (1.0 - 0.5 * vInfo.z));        // pale undersides of the paired fins
  float margin = smoothstep(0.50, 0.80, vInfo.y);
  float isCaudal = step(1.5, part) * step(part, 2.5);
  fin = mix(fin, vec3(0.012), margin * isCaudal * step(variant, 1.5));                    // the black trailing margin of the tail
  float tipMark = smoothstep(0.62, 0.86, vInfo.z);
  fin = mix(fin, vec3(0.012), tipMark * step(0.5, variant) * step(variant, 1.5));         // blacktip
  fin = mix(fin, uBelly, max(tipMark, smoothstep(0.72, 0.92, vInfo.y)) * step(1.5, variant)); // silvertip
  alb = mix(alb, fin, isFin);
  // ---- eye, gill slits, mouth (only on the hull; filtered away with distance)
  float body = 1.0 - isFin, detail = clamp(1.6 - px * 90.0, 0.0, 1.0);
  // the eye: a shadowed socket, a dark gold-grey iris darker still at its rim, a slit pupil and a glint (never a plain dot)
  vec2 ev = vec2(m.z - 0.432, (m.y - 0.010) * 1.05);
  float e = length(ev), eR = 0.0118;
  float eyeSide = smoothstep(0.016, 0.026, abs(m.x)) * body;
  float eye = (1.0 - smoothstep(eR, eR + px, e)) * eyeSide;
  float socket = (1.0 - smoothstep(eR * 0.9, eR * 2.0, e)) * eyeSide;
  float pupil = 1.0 - smoothstep(0.0, px, length(vec2(ev.x * 2.6, ev.y)) - 0.0076);
  vec3 eyeCol = mix(vec3(0.20, 0.185, 0.13), vec3(0.035, 0.035, 0.035), smoothstep(eR * 0.62, eR * 0.98, e));
  eyeCol = mix(eyeCol, vec3(0.006), pupil);
  float glint = (1.0 - smoothstep(0.0015, 0.0015 + px, length(ev - vec2(0.0036, 0.0042)))) * eye * detail;
  alb *= 1.0 - 0.32 * socket * detail;
  alb = mix(alb, eyeCol, eye * detail);
  // five gill slits: thin, bowed, the forward ones longer, each with the pale edge of its flap behind it
  float gy = m.y + 0.004, gz = (m.z - 0.226 - m.y * 0.22 + 14.0 * gy * gy) / 0.0135, gi = clamp(floor(gz), 0.0, 4.0);
  float gTop = 0.011 + 0.0022 * gi, gBot = -0.023 - 0.0016 * gi;
  float gMask = step(0.0, gz) * step(gz, 5.0) * smoothstep(gBot, gBot + 0.007, m.y) * (1.0 - smoothstep(gTop - 0.007, gTop, m.y)) * body;
  float gW = fwidth(m.z) / 0.0135 + 1e-4, gf = fract(gz) - 0.5;
  float gill = (1.0 - smoothstep(0.050, 0.050 + gW, abs(gf))) * gMask * clamp(1.6 - gW * 2.2, 0.0, 1.0);
  alb *= 1.0 - 0.60 * gill;
  alb *= 1.0 + 0.10 * (1.0 - smoothstep(0.0, 0.14, abs(gf + 0.17))) * gMask * detail * (1.0 - belly);
  float ring = abs(length(vec2(m.x, (m.z - 0.366) * 0.95)) - 0.041);
  float mouth = (1.0 - smoothstep(0.0022, 0.0022 + px, ring)) * step(0.372, m.z) * (1.0 - smoothstep(-0.016, -0.006, m.y)) * body;
  alb *= 1.0 - 0.38 * mouth * detail;
  // lateral line and nostril-fine speckle on the back
  alb *= 1.0 - 0.10 * detail * body * (1.0 - smoothstep(0.0015, 0.0015 + px, abs(m.y - 0.018 - m.z * 0.02))) * (1.0 - belly);
  // ---- light: high key with caustics on the back, sky light above, deep light below
  float ndl = clamp((dot(N, uSunDir) + 0.22) / 1.22, 0.0, 1.0);
  // (the caustic net reaches the whole sheet, on upward faces only: light ripples along every back, the flanks stay calm)
  vec2 cq = vLocal.xz - uSunDir.xz * (vLocal.y / max(uSunDir.y, 0.2));
  float caus = (swCaustic(cq * 0.85, uTime * 1.3) + 0.6 * swCaustic(cq * 1.9 + 7.3, uTime * 1.7 + 2.0)) * smoothstep(uSurfaceY - 30.0, uSurfaceY - 7.0, vLocal.y) * smoothstep(-0.1, 0.45, N.y);
  vec3 amb = mix(uDeepLight, uSkyLight, N.y * 0.5 + 0.5);
  float dl = swDepth(vLocal.y);
  // the lit sand throws light back up: bellies read pale, not black (strongest low over the floor)
  amb += uBounce * clamp(0.15 - N.y, 0.0, 1.0) * (0.55 + 0.45 * (1.0 - smoothstep(3.0, 22.0, vLocal.y)));
  float shaft = swShaft(vLocal, uTime);                                            // a shaft of sun rakes across the ranks
  vec3 col = alb * (uSunColor * dl * ndl * (0.55 + 2.0 * caus) * (0.74 + 1.25 * shaft) + amb * (0.45 + 0.55 * dl));
  vec3 H = normalize(uSunDir + V);
  float ndh = max(dot(N, H), 0.0), ndv = max(dot(N, V), 0.0);
  col += uSunColor * dl * 0.10 * pow(ndh, 28.0) * (1.0 - belly) * (0.5 + caus);
  float fres = 1.0 - ndv; fres = fres * fres * fres;
  col += (uSkyLight + uSunColor * 0.35 * shaft * dl) * fres * (0.06 + 0.42 * smoothstep(-0.1, 0.7, N.y));          // the pale rim along the back
  col += (uSkyLight * 1.2 + uSunColor * 0.3) * glint;
  col = swHaze(col, vLocal);
  gl_FragColor = vec4(col, 1.0);
  // in the world's water the far ranks fade to a tone a little darker than the haze behind them, so the wall
  // holds as silhouettes from the bend instead of dissolving
  #ifdef FOG_EXP2
    float swF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * mix(0.62, 1.0, smoothstep(0.86, 1.0, swF)), swF);
  #else
    #include <fog_fragment>
  #endif
}`;

// ---------------------------------------------------------------- rock / sand material (coral head, standalone floor)
const ROCK_VERT = /* glsl */`
attribute vec4 aCol;    // rgb albedo, a = occlusion
attribute float aMat;   // 0 sand, 1 rock, 2 plate coral, 3 mound coral
varying vec3 vN, vLocal;
varying vec4 vCol;
varying float vMat;
#include <fog_pars_vertex>
void main(){
  vN = normal; vLocal = position; vCol = aCol; vMat = aMat;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
uniform vec3 uPink, uOchre, uOlive, uBounce;
uniform vec2 uFlow;
varying vec3 vN, vLocal;
varying vec4 vCol;
varying float vMat;
#include <fog_pars_fragment>
${GLSL_COMMON}
// one cellular lookup: x = distance to the nearest cell centre, y = distance to the cell wall (F2 - F1), z = cell id
vec3 swCell(vec3 p){
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)), c = i + g;
    vec3 o = vec3(swHash(c), swHash(c + 17.3), swHash(c + 41.9));
    float d = length(g + 0.15 + 0.7 * o - f);
    if (d < f1) { f2 = f1; f1 = d; id = o.x; } else if (d < f2) { f2 = d; }
  }
  return vec3(f1, f2 - f1, id);
}
void main(){
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 lp = vLocal;
  // materials: 0 sand, 1 rock, 2 plate coral, 3 mound coral
  float sand = 1.0 - step(0.5, vMat), mound = clamp(vMat - 2.0, 0.0, 1.0) * (1.0 - sand), plate = clamp(1.0 - abs(vMat - 2.0), 0.0, 1.0) * (1.0 - sand);
  float rock = clamp(1.0 - sand - plate - mound, 0.0, 1.0);
  float mpp = length(fwidth(lp));                                           // metres per pixel, roughly
  // What a pixel can still resolve. Every pattern is drawn only while one of its features spans a good many pixels, and
  // hands over to the next coarser one beyond: grain (4 cm) and polyps (12 cm cells, only on the nearest two or three
  // metres), mottling (11 cm and 32 cm), crevices (4-13 cm wide, to about 25 m), colony lobes and pockets (0.5-1.5 m),
  // crust patches (2-3 m, at every range). Nothing on the rock is cellular: there is no net of cell walls to read as paving.
  float creK = clamp(1.6 - mpp * 9.0, 0.0, 1.0), lobeK = clamp(1.6 - mpp * 4.5, 0.0, 1.0), patchK = clamp(1.7 - mpp * 2.4, 0.0, 1.0), n2K = clamp(1.7 - mpp * 26.0, 0.0, 1.0);
  float n3K = clamp(1.7 - mpp * 85.0, 0.0, 1.0), polyK = clamp(1.6 - mpp * 70.0, 0.0, 1.0), fineK = clamp(1.6 - mpp * 110.0, 0.0, 1.0);
  // the fine fields are read in a frame turned well off the world's axes: a canyon wall is close to an axis plane, and a
  // lattice cut square-on by it shows as rows of square cells; cut obliquely it shows as uneven patches
  vec3 lr = vec3(dot(lp, vec3(0.869, 0.391, 0.304)), dot(lp, vec3(0.410, -0.912, 0.0)), dot(lp, vec3(0.277, 0.125, -0.953)));
  float n2 = swNoise(lr * 3.1 + 11.0), n3 = swNoise(lr * 9.0 + 5.0), n4 = swNoise(lr * 23.0 + 3.0);
  float m2 = mix(0.5, n2, n2K), m3 = mix(0.5, n3, n3K), m4 = mix(0.5, n4, fineK);
  float nB = swNoise(lp * 0.3 + 7.7);                                       // broad and soft: what the crust bands follow
  vec3 Ng = N;                                                              // the modelled normal, before the painted relief
  float solid = 1.0 - sand, hy = smoothstep(4.0, 24.0, lp.y);              // hy: height in the water column
  // warm: 1 on the sunlit upper part of a wall, the crown of a dome or a boulder (the writer's occlusion carries that
  // height: 0.5 at a wall's foot, 1 at its rim), 0 in its foot, its creases and its undercuts; a little less with depth
  float warm = smoothstep(0.48, 0.82, vCol.a) * (0.88 + 0.12 * hy) * solid;
  // every patch edge is read through one slow warp, so borders come out lobed and scalloped, never straight
  vec3 wv = 1.5 * (vec3(swNoise(lp * 0.37 + 3.1), nB, swNoise(lp * 0.37 + 41.3)) - 0.5) + 0.25 * (m2 - 0.5), wq = lr + wv, wl = lp + wv;
  float cA = swNoise(wq * 0.46 + 21.0), cB = swNoise(wq * 0.71 + 57.0), cC = swNoise(wq * 1.25 + 13.0);
  vec3 alb = vCol.rgb;
  // THE REEF AT ARM'S LENGTH (eighth pass; a rule in space: each part of it is full within its own range of the lens and
  // fades out beyond, wherever the lens is, and is drawn only while a pixel resolves it). A wall that near was broad soft blotches under a net of light: painted clay. Within that range the
  // encrusting colonies take a crisp edge a few centimetres wide, two more generations of plates stand on the crust (a
  // forearm to a metre across, and a hand across), each with a lit lip, a pale growing rim and a pocket of shadow under
  // its lower edge; the crust is pitted and grained (11 cm and 4 cm), and the caustic net lies on the faces that look up.
  // (the three ranges: pits and grain to 14 m, gone by 30; hand-sized plates to 18 m, gone by 36; the large plates, the
  // colonies' crisp edges and the plate tiers to 30 m, gone by 60: most of a canyon wall in the picture is 10 to 40 m off)
  float dCam = length(lp - uCamLocal), nearK = (1.0 - smoothstep(14.0, 30.0, dCam)) * rock, nearB = (1.0 - smoothstep(18.0, 36.0, dCam)) * rock, nearA = (1.0 - smoothstep(30.0, 60.0, dCam)) * rock;
  // ---- rock: crust in soft lobed patches two or three metres across (olive low and in the shade, ochre, dusty rose toward
  // the light), with pink coralline crust blotched over it, thickest on shaded and overhung faces
  float st = swNoise(vec3(lp.y * 0.7 + 0.5 * nB, 0.30 * (lp.x + lp.z), 3.7));   // (2.3 : 1 along the wall; it was 6 : 1 and warped twice as far: stretched swirls where a wall turned)
  float tone = 0.58 * cA + 0.42 * st + 0.18 * (cC - 0.5);
  vec3 crust = mix(uOlive, uOchre, smoothstep(0.34, 0.54, tone));
  crust = mix(crust, uPink, smoothstep(0.50, 0.68, tone) * 0.85);
  float coralline = smoothstep(0.50, 0.70, cB + 0.24 * (cC - 0.5) + 0.20 * (1.0 - smoothstep(-0.5, 0.35, N.y)));
  crust = mix(crust, uPink * vec3(1.04, 0.84, 1.0), coralline * 0.72);
  alb = mix(alb, crust, rock * 0.64);
  // encrusting colonies: raised soft lobes half a metre to a metre across, paler toward the middle, each kind its own tint
  float colF = swNoise(wq * 1.05 + 71.0) + 0.10 * (m2 - 0.5);
  float colonyS = mix(smoothstep(0.58, 0.72, colF), clamp(0.5 + (colF - 0.62) / max(length(vec2(dFdx(colF), dFdy(colF))), 0.012) * 0.8, 0.0, 1.0), nearA) * rock, colCore = smoothstep(0.66, 0.88, colF), bare = rock * (1.0 - colonyS);
  vec3 colTint = mix(mix(uOchre, uPink, smoothstep(0.38, 0.62, swNoise(lp * 0.21 + 33.0))), uOlive * 1.18, smoothstep(0.58, 0.78, swNoise(lp * 0.23 + 88.0)));
  alb = mix(alb, colTint * (0.80 + 0.32 * colCore), colonyS * 0.52 * mix(0.5, 1.0, patchK));
  float live = max(mound, colonyS);
  // a few wandering crevices: the centre lines of a slow field stretched up the wall (they run with the buttresses, wander,
  // and never meet in a net), on about a quarter of the rock, their width uneven; and shadowed pockets, lens-shaped hollows
  // lying across the face as under small overhangs
  float cv = swNoise(vec3(wl.x * 0.50, lp.y * 0.16 + 0.4 * nB, wl.z * 0.50) + 5.3);
  float cvG = length(vec2(dFdx(cv), dFdy(cv))) / max(mpp, 1e-5);          // its slope per metre along the surface
  float cvD = abs(cv - 0.5) / max(cvG, 0.03);                             // metres to the crevice's centre line
  float cvW = mix(0.035, 0.13, swNoise(lp * 0.9 + 15.0));
  float crack = (1.0 - smoothstep(cvW * 0.35, cvW + mpp, cvD)) * smoothstep(0.50, 0.72, swNoise(lp * 0.3 + 11.0)) * bare * creK;
  float pkF = swNoise(vec3(wl.x * 0.62, wl.y * 1.25, wl.z * 0.62) + 91.0);
  float pocket = smoothstep(0.75, 0.92, pkF + 0.10 * (1.0 - smoothstep(-0.6, 0.2, Ng.y))) * rock * patchK;   // (a few: one face in twelve)
  float under = (1.0 - smoothstep(-0.6, 0.0, Ng.y)) * solid;                      // the underside of an overhang, a dish or a dome
  alb *= mix(1.0, 1.05 * (0.89 + 0.15 * mix(0.7, smoothstep(0.1, 0.7, n3), n3K)) * (0.90 + 0.20 * m4) * (0.93 + 0.14 * m2) * (0.92 + 0.16 * mix(0.5, cC, lobeK)), rock);
  alb = mix(alb, alb * vec3(0.60, 0.72, 0.82), crack);
  alb = mix(alb, alb * vec3(0.52, 0.64, 0.72), pocket * 0.7);
  // ---- the reef at arm's length: plates, their rims and the pockets under them, pits and grain (see nearK above)
  // (the same fields are read again a hand's breadth higher up the wall: where a plate stands just above a point and none
  // on it, that point lies under the plate's lower lip and is in its shadow)
  vec3 lrUp = vec3(0.391, -0.912, 0.125);                                   // straight up, in the turned frame the fields are read in
  vec3 qa = wq * 1.7 + 101.0, qb = (lr + 0.35 * wv) * 4.3 + 57.0;
  float fA = swNoise(qa) + 0.16 * (n2 - 0.5) + 0.05 * (n3 - 0.5), fAu = swNoise(qa + lrUp * 0.24) + 0.16 * (n2 - 0.5) + 0.05 * (n3 - 0.5);
  float fB = swNoise(qb) + 0.10 * (n3 - 0.5), fBu = swNoise(qb + lrUp * 0.21) + 0.10 * (n3 - 0.5);
  // (an edge is a pixel and a third wide measured across itself, whatever angle the face is seen at: the field's own
  // gradient on the screen gives the distance to the edge in pixels. A width taken from fwidth alone smears every edge
  // on a wall seen along its length, which is how a canyon wall is seen.)
  float gA = max(length(vec2(dFdx(fA), dFdy(fA))), 0.012), gB = max(length(vec2(dFdx(fB), dFdy(fB))), 0.016);
  float mppN = sqrt(length(dFdx(lp)) * length(dFdy(lp))), plKA = clamp(1.8 - mppN * 7.0, 0.0, 1.0) * nearA, plK = clamp(1.8 - mppN * 18.0, 0.0, 1.0) * nearB;
  float plateA = clamp(0.5 + (fA - 0.55) / gA * 0.8, 0.0, 1.0) * plKA, plateB = clamp(0.5 + (fB - 0.61) / gB * 0.8, 0.0, 1.0) * plK;
  float rimA = plateA * (1.0 - smoothstep(0.57, 0.62, fA)), rimP = plateB * (1.0 - smoothstep(0.63, 0.69, fB));
  float lipA = clamp(0.5 + (fAu - 0.55) / gA * 0.8, 0.0, 1.0) * plKA * (1.0 - plateA), lipB = clamp(0.5 + (fBu - 0.61) / gB * 0.8, 0.0, 1.0) * plK * (1.0 - plateB);
  // (each generation its own tints and its own step of tone: the large plates deep olive, cream-ochre or pink coralline by
  // the slow crust fields, the hand-sized ones pale rose or deep olive-brown by the 32 cm field, so neighbours differ)
  float kA = 0.6 * cB + 0.4 * cC;
  vec3 tintA = mix(mix(uOlive * 0.76, uOchre * 1.28 + 0.04, smoothstep(0.39, 0.43, kA)), uPink * vec3(1.14, 0.84, 1.02), smoothstep(0.53, 0.57, kA)) * (0.84 + 0.32 * cA);
  vec3 tintB = mix(uOlive * vec3(0.66, 0.58, 0.52), uPink * vec3(1.12, 0.96, 1.0) + 0.04, smoothstep(0.46, 0.54, n2));
  alb = mix(alb, tintA * (0.86 + 0.26 * smoothstep(0.60, 0.85, fA)), plateA * mix(0.58, 0.86, nearK));   // (strongest beside the lens; further off the plates are a step of tone, not a patchwork)
  alb = mix(alb, tintB * (0.90 + 0.2 * m3), plateB * mix(0.55, 0.80, nearK));
  alb = mix(alb, alb * 1.25 + 0.04, max(rimA * (1.0 - plateB), rimP) * 0.75);
  // plate tiers: shelves of plate coral a metre or two across and half as tall on the face (the pockets' own slow field,
  // which lies across the wall, cut crisp), each standing proud with a pale lip, and under every one a pocket of shadow a
  // forearm deep: the same field read 35 cm higher up the wall. They carry the wall's relief out to the range the canyon
  // is mostly seen at.
  float fS = pkF + 0.10 * (n2 - 0.5) + 0.06 * (cC - 0.5), fSu = swNoise(vec3(wl.x * 0.62, wl.y * 1.25 + 0.44, wl.z * 0.62) + 91.0) + 0.10 * (n2 - 0.5) + 0.06 * (cC - 0.5);
  float gS = max(length(vec2(dFdx(fS), dFdy(fS))), 0.008), tierK = clamp(1.7 - mppN * 2.6, 0.0, 1.0) * nearA * (1.0 - smoothstep(0.80, 0.95, abs(Ng.y)));   // (on walls and leaning faces: a shelf has no meaning on the reef top)
  float tier = clamp(0.5 + (fS - 0.61) / gS * 0.8, 0.0, 1.0) * tierK, tierLip = clamp(0.5 + (fSu - 0.61) / gS * 0.8, 0.0, 1.0) * tierK * (1.0 - tier);
  vec3 tintS = mix(uOchre * 1.16 + 0.03, mix(uOlive * 0.92, uPink * vec3(1.06, 0.90, 1.0), smoothstep(0.52, 0.58, cB)), smoothstep(0.44, 0.50, cA));
  alb = mix(alb, tintS * (0.88 + 0.24 * smoothstep(0.62, 0.90, fS)) * (0.92 + 0.16 * m2), tier * 0.54 * (1.0 - plateA));
  alb = mix(alb, alb * 1.22 + 0.035, tier * (1.0 - smoothstep(0.61, 0.66, fS)) * 0.7);
  alb = mix(alb, alb * vec3(0.40, 0.50, 0.62), tierLip * 0.8);
  // pits and grain: the crust is pocked (dark pits 4 to 5 cm across, finer ones 2 cm) and its tone is grained
  float g3K = clamp(1.9 - mppN * 42.0, 0.0, 1.0) * nearK, g4K = clamp(1.8 - mppN * 80.0, 0.0, 1.0) * nearK;
  float pit3 = (1.0 - smoothstep(0.17, 0.33, n3)) * g3K, pit4 = (1.0 - smoothstep(0.18, 0.34, n4)) * g4K;
  alb *= (1.0 + 0.30 * (n3 - 0.5) * g3K + 0.22 * (n4 - 0.5) * g4K) * (1.0 - 0.42 * pit3) * (1.0 - 0.34 * pit4);
  alb = mix(alb, alb * vec3(0.44, 0.54, 0.66), max(lipA, 0.8 * lipB) * 0.75);
  // ---- the high-sun looks (uFootK): under a noon sun a far wall is one pale sheet unless its own structure is drawn. So
  // there: a few dark creases run up the face between the buttresses (the centre lines of a slow field stretched up the
  // wall, ten to twenty metres apart, each half a metre to a metre and a half wide at any range), a band of shadow lies
  // under the rim's overhang (from the writer's occlusion, which carries height), and the crust's patches are told apart
  // by tone as well as hue. Walls only (not the reef top, the sand, the coral domes or the boulders at the foot).
  float wallK = uFootK * rock * (1.0 - smoothstep(0.55, 0.85, abs(Ng.y)));
  float crF = swNoise(vec3(wl.x * 0.085, lp.y * 0.02 + 0.3 * nB, wl.z * 0.085) + 61.0);
  float crGr = length(vec2(dFdx(crF), dFdy(crF))) / max(mpp, 1e-5);
  float crease2 = (1.0 - smoothstep(0.30, 0.95 + mpp, abs(crF - 0.5) / max(crGr, 0.012))) * wallK;
  float rimB = smoothstep(0.80, 0.88, vCol.a) * (1.0 - smoothstep(0.93, 0.985, vCol.a)) * smoothstep(13.0, 17.0, lp.y) * wallK;
  alb *= mix(1.0, mix(0.70, 1.10, smoothstep(0.36, 0.62, cA)), wallK * 0.9);
  alb = mix(alb, alb * vec3(0.38, 0.50, 0.58), crease2 * 0.92);
  alb *= 1.0 - 0.52 * rimB;
  // ---- mound corals: smooth lobes (a soft dome inside each cell, a shaded crease between two), each lobe a tone of its own
  // (the one cellular field left, and only on the coral domes themselves, where lobes are what a brain coral is)
  float dome = 0.5, crease = 0.0, cz = 0.5, lobeW = mound * lobeK;
  if (lobeW > 0.004) {
    vec3 ce = swCell(lp * 2.3 + 0.15 * (n2 - 0.5) + 0.7 * (nB - 0.5));
    dome = smoothstep(0.0, 0.55, ce.y); crease = 1.0 - smoothstep(0.0, 0.40, ce.y); cz = ce.z;
  }
  alb *= mix(1.0, (0.96 + 0.07 * dome) * (1.0 - 0.08 * crease) * (0.92 + 0.16 * cz), lobeW);
  // ---- polyps: cups (a dark pit inside a pale ring, the seam between two cups barely darker: never a net of tiles),
  // looked up (a second cellular field) only where a pixel can show them
  float pk = polyK * live, cup = 0.5, pit = 0.0, pz = 0.5;
  if (pk > 0.004) {
    vec3 pc = swCell(lr * 8.0 + 0.5 * (n2 - 0.5) + 1.3 * (n3 - 0.5));   // (warped: cups of uneven size, not a ruled grid)
    cup = smoothstep(0.10, 0.30, pc.x) * smoothstep(0.0, 0.12, pc.y); pit = 1.0 - smoothstep(0.05, 0.22, pc.x); pz = pc.z;
  }
  alb *= mix(1.0, (0.88 + 0.22 * cup) * (1.0 - 0.45 * pit) * (0.96 + 0.08 * pz), pk);
  alb *= mix(1.0, 0.92 + 0.16 * m2, live);
  alb *= mix(1.0, 0.84 + 0.32 * m3, plate);
  // a dome of living coral is palest on its crown
  alb = mix(alb, alb * 1.12 + 0.03, mound * smoothstep(0.0, 0.9, Ng.y));
  // ---- relief from the same fields (screen-space bump; derivatives are taken here, outside any loop): colony lobes stand
  // proud, pockets are hollow, and a crevice is cut in only while it is several pixels wide (a bump of a line two pixels
  // wide comes out as a staircase; beyond that range the crevice is its dark line alone)
  // (and the crust itself is knobbly: soft bosses a hand to a forearm across, shaded by the key, out to some forty metres)
  float knob = swNoise(wl * 2.6 + 27.0) * clamp(1.6 - mpp * 11.0, 0.0, 1.0);
  float h = bare * 0.15 * (0.24 * n3 * n3K + 0.12 * n4 * fineK) + rock * 0.10 * knob
          + 0.14 * tier - 0.05 * tierLip + 0.080 * plateA + 0.022 * smoothstep(0.55, 0.85, fA) * plKA + 0.036 * plateB + 0.030 * (n3 - 0.5) * g3K + 0.012 * (n4 - 0.5) * g4K - 0.030 * pit3 - 0.010 * pit4 - 0.035 * max(lipA, lipB) - crack * 0.05 * clamp(1.6 - mpp * 30.0, 0.0, 1.0) - pocket * 0.14 - crease2 * 0.22
          + colonyS * (0.05 + 0.06 * colCore) * patchK + lobeW * 0.02 * dome + pk * 0.02 * (0.6 * cup - 0.5 * pit);
  vec3 dpx = dFdx(lp), dpy = dFdy(lp);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  N = normalize(abs(det) * N - sign(det) * (dhx * r1 + dhy * r2) + N * 1e-7);
  // sand: current ripples square to the flow, pale rivers along it
  vec2 q = lp.xz;
  float along = dot(q, uFlow), across = dot(q, vec2(uFlow.y, -uFlow.x));
  float exitK = (1.0 - smoothstep(-84.0, -52.0, lp.z));
  // (down the exit canyon the ripples wander and fork and lie in patches with bare sand between: one even field of them
  // read from the bowl as ruled streaks across the whole floor)
  float rPh = along * 7.0 + 2.2 * swNoise(vec3(q * 0.35, 3.0)) + 1.1 * sin(across * 0.6) + exitK * (3.0 * swNoise(vec3(q * 0.9, 21.0)) + 3.0 * swNoise(vec3(q * 0.21, 25.0)));   // (seventh pass: the fine warp at two thirds, it cut the ripples into dark dashes)
  float ripA = clamp(1.5 - fwidth(rPh) * 0.55, 0.0, 1.0) * mix(1.0, smoothstep(0.36, 0.66, swNoise(vec3(q * 0.16, 29.0))), exitK * 0.9);
  float rip = sin(rPh) * ripA;
  float wa = across + 5.0 * swNoise(vec3(q * 0.07, 1.0)) + 2.0 * swNoise(vec3(q * 0.21, 4.0));
  float river = smoothstep(0.5, 0.78, swNoise(vec3(wa * 0.13, along * 0.035, 9.0))) * 0.55;
  // (down the exit canyon, z under -60, the pale rivers are broken into short lenses a few metres long: seen along their
  // length from the bowl they were continuous pale streaks)
  river *= mix(1.0, smoothstep(0.34, 0.62, swNoise(vec3(q * 0.23, 17.0))) * 0.8, exitK);
  alb = mix(alb, alb * (0.84 + 0.2 * (1.0 - 0.3 * exitK) * rip) * (1.0 + 0.55 * river) * (0.88 + 0.24 * n2), sand);
  N = normalize(N + sand * vec3(uFlow.x, 0.0, uFlow.y) * cos(rPh) * 0.28 * (1.0 - 0.34 * exitK) * ripA);
  // rubble flecks on the sand
  // (seventh pass: down the exit canyon and in the bowl they are half as dark, and gone 22 m from the lens: seen low along
  // the floor there, each was a dark dash)
  alb = mix(alb, alb * mix(0.55, 0.78, exitK), sand * smoothstep(0.80, 0.90, swNoise(lp * vec3(2.3, 0.0, 2.3) + 40.0)) * (1.0 - river) * (1.0 - exitK * smoothstep(7.0, 22.0, length(lp - uCamLocal))));
  // ---- light. Sand takes the plain key; the reef takes a wrapped key, so that its upright faces catch the sun and the
  // caustic net (skewed by the face's own lean, so it dapples a wall instead of streaking down it)
  float sdn = dot(N, uSunDir);
  float ndl = mix(clamp((sdn + 0.15) / 1.15, 0.0, 1.0), clamp((sdn + 0.7) / 1.7, 0.0, 1.0), solid);
  // (the net is projected three ways and blended by the modelled normal: down the sun on faces that look up, and square on
  // to each upright face in that face's own plane. One projection skewed by the normal drew the net out into long swirls
  // wherever a wall turned)
  // (seventh pass) down the exit canyon (exW) the reef takes the one projection down the sun again, skewed by the face's own
  // lean: there the walls are seen along their length, and that net lies on them as broad warm swirls of light where the
  // square-on nets drew a fine bright mesh over the whole face, which with the cool cast read as ice
  float exW = exitK * solid;
  vec2 cp = lp.xz - uSunDir.xz * (lp.y / max(uSunDir.y, 0.2)) + Ng.xz * (lp.y * 0.55 * exW);
  // (on the reef the net is gone 18 m down; on open sand a larger, softer net still crawls at 30 m, so no floor is ever bare)
  float cScale = mix(0.85, 0.5, sand);
  float wT = mix(mix(smoothstep(0.30, 0.72, abs(Ng.y)), 1.0, exW), 1.0, sand), wX = Ng.x * Ng.x, wZ = Ng.z * Ng.z, wS = (1.0 - wT) / max(wX + wZ, 1e-4), caus = 0.0;
  if (wT > 0.01) caus += wT * (swCaustic(cp * cScale, uTime * 1.3) + 0.6 * swCaustic(cp * (cScale * 2.25) + 7.3, uTime * 1.7 + 2.0));
  if (wX * wS > 0.01) { vec2 c1 = vec2(lp.z + 0.4 * lp.y, lp.y * 1.15 + 3.0); caus += wX * wS * (swCaustic(c1 * 0.85, uTime * 1.3) + 0.6 * swCaustic(c1 * 1.9 + 7.3, uTime * 1.7 + 2.0)); }
  if (wZ * wS > 0.01) { vec2 c2 = vec2(lp.x - 0.4 * lp.y, lp.y * 1.15 + 11.0); caus += wZ * wS * (swCaustic(c2 * 0.85, uTime * 1.3) + 0.6 * swCaustic(c2 * 1.9 + 7.3, uTime * 1.7 + 2.0)); }
  caus *= mix(smoothstep(uSurfaceY - 22.0, uSurfaceY - 6.0, lp.y), 0.22 + 0.78 * smoothstep(uSurfaceY - 34.0, uSurfaceY - 9.0, lp.y), sand);
  caus *= 1.0 - 0.35 * exW * smoothstep(36.0, 74.0, dCam);   // (the net is a third dimmer on the far, cool walls of the exit)
  // (eighth pass) on the reef the net lies on the faces that look up: ledges, the tops of buttresses and boulders, the upper
  // lip of every plate (the painted relief counts). An upright face keeps none of it beside the lens and a little of it far
  // off, where the net is all that tells a wall from the water; down the exit canyon the walls keep theirs (the seventh
  // pass's broad warm swirls, which that stretch is lit by) beyond some 44 m of the lens; nearer, an upright face gives up
  // most of it (all but a seventh within 20 m) and shows its plates and their shadows instead.
  { float upF = smoothstep(0.10, 0.60, Ng.y + 0.8 * (N.y - Ng.y));
    caus *= mix(1.0, upF, solid * mix(1.0 - 0.45 * smoothstep(18.0, 40.0, dCam), 0.85 * (1.0 - smoothstep(20.0, 44.0, dCam)), exitK));
    caus *= 1.0 - 0.85 * max(tierLip, max(lipA, 0.8 * lipB)); }                // (and none in the pocket of shadow under a plate)
  float shaft = swShaft(lp, uTime);
  vec3 amb = mix(uDeepLight, uSkyLight, N.y * 0.5 + 0.5) + uBounce * clamp(0.2 - N.y, 0.0, 1.0) * 0.5 * solid;
  float dl = swDepth(lp.y);
  // (the sunlit part of the reef loses less of the key to depth than open sand does: it must read as lit, deep in the bowl too)
  vec3 light = uSunColor * mix(dl, 1.0, 0.45 * warm) * ndl * (0.6 + mix(1.7, 2.0 * (1.0 - 0.5 * uFootK), solid) * caus) * mix(0.80 + 0.95 * shaft, 0.90 + 0.45 * shaft, solid) * mix(1.0, mix(0.6, 1.3, warm), solid) + amb * (0.4 + 0.6 * dl);
  // the sunlit rim of the reef keeps its own warm colours (little water between it and the sun); down the face the
  // water's cast grows, but the crust's own colours still show through it: the foot of a wall is rock, never a pane of water
  light = mix(light, vec3(dot(light, vec3(0.3, 0.5, 0.2))), mix(0.36, 0.72, warm) * solid);
  float ao = mix(vCol.a, vCol.a * (0.5 + 0.5 * vCol.a), rock) * (1.0 - (0.42 * pocket + mix(0.28, 0.55, uFootK) * under) * solid) * (1.0 - 0.5 * max(max(lipA, 0.8 * lipB), 1.1 * tierLip));
  // shadows have a colour: creases, undercuts, pockets and the foot of the reef drain to a deep olive-teal that keeps the
  // crust's hue and sits well below the tone of the water behind, so the wall stands as a solid dark mass to its foot
  float aL = dot(alb, vec3(0.3333));
  vec3 shade = mix((uDeepLight * 0.75 + uHazeDeep * 0.35) * (0.4 + aL), alb * (uDeepLight * 1.25 + uSkyLight * 0.30) + uHazeDeep * 0.06, 0.62);
  // (under a high sun the crown is bright and the foot would drain to exactly the water's blue, a wall that reads as a
  // veil: there the foot is tied to the water's own colour taken two steps down and turned toward olive, and it reaches
  // further up the face, so the wall stands as rock to the sand)
  shade = mix(shade, (uHazeCol * 0.50 + alb * 0.09) * vec3(0.90, 1.0, 0.80), uFootK);
  vec3 col = alb * light * ao + shade * (1.0 - ao) * solid;
  col = mix(col, shade, (1.0 - warm) * mix(0.10, 0.42, uFootK) * solid);
  // pale growing rims on the coral domes
  vec3 V = normalize(uCamLocal - lp);
  float fres = 1.0 - max(dot(Ng, V), 0.0);
  col += mound * (alb * 0.6 + 0.12) * (uSkyLight * 0.8 + uSunColor * 0.25 * dl) * fres * fres * (0.3 + 0.7 * smoothstep(-0.3, 0.5, Ng.y));
  col = swHaze(col, lp);
  // (sixth polish pass) down the exit canyon the reef goes to the water's own clean blue with distance, tone for tone: warm
  // coral beside the lens and wherever the sun lands on a crown, blue rock and blue shadow beyond some forty metres (the
  // crust's ochre and rose under teal light read from the bowl as a muddy purple-green)
  // (seventh pass: the cast began 13 m from the lens and reached eight tenths by 44 m, so the near walls of the exit lost
  // their ochre and rose and read as pale ice under the net. Now every wall within some 35 m keeps its warm crust, and the
  // cast comes in from 36 m to 74 m, where the water has half taken the reef anyway, to six tenths at most)
  { float dC = length(lp - uCamLocal), blueK = exitK * smoothstep(36.0, 74.0, dC) * solid * (0.6 - 0.25 * warm * smoothstep(0.5, 1.0, shaft));
    vec3 cool = uHazeCol * 0.95 + uSkyLight * 0.30 + uHazeDeep * 0.15;
    col = mix(col, cool * (dot(col, vec3(0.3, 0.5, 0.2)) / max(dot(cool, vec3(0.3, 0.5, 0.2)), 1e-3)), blueK); }
  gl_FragColor = vec4(col, 1.0);
  // the water takes the reef a little sooner than the scene's fog alone would: crisp beside the lens, an eighth haze thirty
  // metres on, a quarter across the amphitheatre (the walls there stay solid rock: they fade into the blue only with distance)
  #ifdef USE_FOG
    float hzD = max(vFogDepth, 0.0) * mix(0.011, 0.0088 * (1.0 - 0.5 * uFootK), solid);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-hzD * hzD));
  #endif
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- standalone water dome
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DOME_FRAG = /* glsl */`
varying vec3 vDir;
${GLSL_COMMON}
void main(){
  vec3 dir = normalize(vDir);
  vec3 col = swWater(dir);
  // Snell's window: the sky squeezed into a wobbling disc 48 degrees wide, ringed by dark
  float az = atan(dir.z, abs(dir.x) < 1e-4 ? 1e-4 : dir.x);
  float wob = 0.012 * sin(az * 7.0 + uTime * 1.3) + 0.009 * sin(az * 13.0 - uTime * 1.9) + 0.006 * sin(az * 23.0 + uTime * 2.6);
  float edge = 0.665 + wob;
  float win = smoothstep(edge - 0.012, edge + 0.035, dir.y);
  vec2 sp = dir.xz / max(dir.y, 0.15) * 14.0;
  float rip = swCaustic(sp * 0.55, uTime * 1.5), rip2 = swCaustic(sp * 1.3 + 4.0, uTime * 2.1);
  vec3 sky = mix(vec3(0.16, 0.50, 0.86), vec3(0.62, 0.90, 1.0), 0.35 + 0.5 * rip) * 1.15;
  float sd = max(dot(dir, uSunDir), 0.0);
  float s2 = sd * sd; s2 *= s2; s2 *= s2; s2 *= s2;            // sd^16
  float s4 = s2 * s2; s4 *= s4;                                // sd^64
  sky += uSunColor * (0.5 * s2 + (1.6 + 2.2 * rip2) * s4 * s4);
  float ring = (1.0 - smoothstep(edge - 0.03, edge + 0.02, dir.y)) * smoothstep(0.30, 0.62, dir.y);
  col = mix(col, uHazeDeep * 0.9 + uHazeCol * 0.25, ring * 0.55);
  col = mix(col, sky, win);
  // sun shafts fanning down from the window
  vec3 ax = normalize(cross(uSunDir, vec3(0.0, 0.0, 1.0)));
  vec3 ay = cross(uSunDir, ax);
  float sx = dot(dir, ax), sy = dot(dir, ay);
  float sa = atan(sy, abs(sx) < 1e-4 ? 1e-4 : sx);
  float sh = 0.5 + 0.5 * sin(sa * 29.0 + sin(sa * 6.0 + uTime * 0.21) * 1.6 + uTime * 0.11);
  sh = sh * sh * sh * (0.35 + 0.65 * (0.5 + 0.5 * sin(sa * 67.0 - uTime * 0.17 + 1.7)));
  float fall = smoothstep(-0.55, 0.25, dir.y) * (1.0 - smoothstep(edge - 0.32, edge + 0.02, dir.y)) * smoothstep(0.1, 0.7, sd);
  col += uSunColor * vec3(0.5, 0.95, 1.0) * sh * fall * 0.06;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- small geometry writer for the rock pieces
// What BufferGeometry.computeVertexNormals() does for an indexed geometry (three r170): the same arithmetic in the same
// order on the same 32-bit arrays, so every normal comes out bit for bit the same, but done in slices with the page
// handed back in between (the library call is one uninterruptible step of 5 to 15 ms on the canyon's meshes).
export async function vertexNormalsInSlices(ctx, g) {
  const pos = g.getAttribute('position').array, ix = g.index.array, nrm = new Float32Array(pos.length);
  for (let i = 0; i < ix.length; i += 3) {
    if (i % 9000 === 0) await ctx.yield?.();
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2];
    const ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
    const n0 = nrm[a] + x, n1 = nrm[a + 1] + y, n2 = nrm[a + 2] + z, n3 = nrm[b] + x, n4 = nrm[b + 1] + y, n5 = nrm[b + 2] + z, n6 = nrm[c] + x, n7 = nrm[c + 1] + y, n8 = nrm[c + 2] + z;
    nrm[a] = n0; nrm[a + 1] = n1; nrm[a + 2] = n2; nrm[b] = n3; nrm[b + 1] = n4; nrm[b + 2] = n5; nrm[c] = n6; nrm[c + 1] = n7; nrm[c + 2] = n8;
  }
  for (let o = 0; o < nrm.length; o += 3) {
    if (o % 18000 === 0) await ctx.yield?.();
    const x = nrm[o], y = nrm[o + 1], z = nrm[o + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    nrm[o] = x * k; nrm[o + 1] = y * k; nrm[o + 2] = z * k;
  }
  const attr = new THREE.BufferAttribute(nrm, 3); attr.needsUpdate = true;
  g.setAttribute('normal', attr);
}

export function makeWriter() {
  const pos = [], col = [], mat = [], idx = [];
  return {
    pos, idx,
    v(x, y, z, c, ao, m) { pos.push(x, y, z); col.push(c.r, c.g, c.b, ao); mat.push(m); return pos.length / 3 - 1; },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    tri(a, b, c) { idx.push(a, b, c); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 1));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    },
    // build() with the page handed back between its parts: the same attributes in the same order, the same normals
    async buildAsync(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await ctx.yield?.();
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4)); await ctx.yield?.();
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 1));
      g.setIndex(idx); await ctx.yield?.();
      await vertexNormalsInSlices(ctx, g);
      return g;
    },
  };
}

// The coral head: an undercut bommie 8 m tall, its crown built of mound-coral domes, terraced with
// table corals and footed with a rubble apron.
async function buildCoralHead(ctx, W, rng, noise, P, cx, cz, H) {
  const nu = 56, nv = 30, seedA = rng.range(0, 50), lobes = rng.int(3, 5), lean = rng.range(-0.6, 0.6);
  const c = new THREE.Color(), base = new THREE.Color('#9b8d88'), top = P.ochre.clone().lerp(P.olive, 0.35), rose = P.pink.clone();
  const info = { knob: 0 };
  const radiusAt = (a, t) => {
    const prof = t < 0.74 ? lerp(3.4, 2.4, smoothstep(0.0, 0.24, t)) + 2.3 * smoothstep(0.2, 0.72, t)
      : 4.7 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.74) / 0.262, 2)));
    const lobe = 1 + 0.16 * Math.sin(a * lobes + seedA + t * 2.0) + 0.09 * Math.sin(a * (lobes * 2 + 1) - seedA * 1.7);
    const ca = Math.cos(a), sa = Math.sin(a);
    const n = noise.fbm3(ca * 1.3 + seedA, t * 3.2, sa * 1.3, 3);
    // mound colonies: rounded domes with creases between them
    const k1 = 1 - Math.abs(noise.n3(ca * 3.1 + seedA, t * 6.5, sa * 3.1)), k2 = 1 - Math.abs(noise.n3(ca * 7.3, t * 15 + seedA, sa * 7.3));
    info.knob = k1 * 0.7 + k2 * 0.3;
    const grow = smoothstep(0.08, 0.45, t);
    return prof * lobe * (0.84 + 0.18 * n) + grow * (0.62 * k1 * k1 + 0.2 * k2 * k2 - 0.3);
  };
  const at = (a, t, out) => { const r = radiusAt(a, t), y = -1 + t * (H + 1); out[0] = cx + Math.cos(a) * r + lean * t * t * 1.4; out[1] = y + 0.25 * info.knob * smoothstep(0.6, 0.95, t); out[2] = cz + Math.sin(a) * r; return out; };
  const rows = [], p = [0, 0, 0];
  for (let j = 0; j <= nv; j++) {
    await ctx.yield?.();
    const t = j / nv, row = [];
    for (let i = 0; i < nu; i++) {
      const a = (i / nu) * Math.PI * 2; at(a, Math.min(t, 0.998), p);
      const shade = noise.n3(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5), crease = smoothstep(0.25, 0.8, info.knob);
      c.copy(base).lerp(rose, 0.45 * smoothstep(0.55, 0.1, t)).lerp(top, smoothstep(0.35, 0.85, t) * (0.45 + 0.3 * shade));
      c.multiplyScalar(0.8 + 0.3 * crease);
      const ao = (0.4 + 0.6 * smoothstep(0.04, 0.6, t)) * (0.5 + 0.5 * crease);
      row.push(W.v(p[0], p[1], p[2], c, ao, t > 0.52 ? 3 : 1));       // the crown is living mound coral (polyps), the stem bare rock
    }
    rows.push(row);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const i1 = (i + 1) % nu; W.quad(rows[j][i], rows[j + 1][i], rows[j + 1][i1], rows[j][i1]); }
  await ctx.yield?.();
  // table corals: thin lobed dishes on short stalks, terraced up the sunlit crown
  const plates = 30, sandy = new THREE.Color('#b9aca0'), tints = [P.ochre, P.olive, P.pink, P.ochre.clone().lerp(P.pink, 0.5)];
  for (let k = 0; k < plates; k++) {
    if (k % 6 === 5) await ctx.yield?.();
    const a = rng.range(0, Math.PI * 2), t = rng.range(0.4, 0.94), R = rng.range(0.55, 1.45) * (t > 0.8 ? 0.8 : 1), seg = 18;
    at(a, t, p);
    const ox = p[0] + Math.cos(a) * R * 0.3, oz = p[2] + Math.sin(a) * R * 0.3, oy = p[1] + rng.range(0.25, 0.5);
    const tiltA = a + rng.range(-0.6, 0.6), tilt = rng.range(0.02, 0.16), tint = sandy.clone().lerp(rng.pick(tints), rng.range(0.3, 0.6)).multiplyScalar(rng.range(0.8, 1.05)), ph = rng.range(0, 6.28);
    const hgt = (x, z) => -(x * Math.cos(tiltA) + z * Math.sin(tiltA)) * tilt;
    const mid = W.v(ox, oy - 0.12, oz, c.copy(tint).multiplyScalar(0.72), 0.85, 2);
    const under = W.v(ox - Math.cos(a) * R * 0.3, oy - 0.42, oz - Math.sin(a) * R * 0.3, c.copy(base).multiplyScalar(0.7), 0.35, 1);
    const r1 = [], r2 = [], r3 = [], r4 = [];
    for (let i = 0; i < seg; i++) {
      const b = (i / seg) * Math.PI * 2, rr = R * (0.88 + 0.09 * Math.sin(b * 3 + ph) + 0.06 * Math.sin(b * 5 - ph * 2));
      const x1 = Math.cos(b) * rr * 0.55, z1 = Math.sin(b) * rr * 0.55, x2 = Math.cos(b) * rr, z2 = Math.sin(b) * rr;
      const rib = i % 2 ? 0.66 : 1;                                                                                     // radial ribs
      r1.push(W.v(ox + x1, oy - 0.04 + hgt(x1, z1) + (i % 2 ? -0.02 : 0.02), oz + z1, c.copy(tint).multiplyScalar(0.86 * rib), 0.95, 2));
      r2.push(W.v(ox + x2, oy + 0.05 + hgt(x2, z2) + (i % 2 ? -0.03 : 0.03), oz + z2, c.copy(tint).lerp(P.white, 0.4).multiplyScalar(rib), 1, 2));   // pale growing rim
      r3.push(W.v(ox + x2 * 0.96, oy - 0.08 + hgt(x2, z2), oz + z2 * 0.96, c.copy(tint).multiplyScalar(0.5), 0.55, 2));
      r4.push(W.v(ox + x2 * 0.3, oy - 0.15 + hgt(x2, z2) * 0.3, oz + z2 * 0.3, c.copy(tint).multiplyScalar(0.4), 0.4, 2));
    }
    for (let i = 0; i < seg; i++) {
      const i1 = (i + 1) % seg;
      W.tri(mid, r1[i1], r1[i]); W.quad(r1[i], r1[i1], r2[i1], r2[i]); W.quad(r2[i], r2[i1], r3[i1], r3[i]); W.quad(r3[i], r3[i1], r4[i1], r4[i]); W.tri(r4[i], r4[i1], under);
    }
  }
  await ctx.yield?.();
  // rubble apron and scour boulders round the foot
  const rocks = 34;
  for (let k = 0; k < rocks; k++) {
    const a = rng.range(0, Math.PI * 2), d = rng.range(3.6, 9), s = rng.range(0.25, 0.9) * (1.2 - d / 13), ph = rng.range(0, 9);
    const rx = cx + Math.cos(a) * d, rz = cz + Math.sin(a) * d, ry = s * 0.2, nu2 = 7, nv2 = 4, rr = [], sq = rng.range(0.55, 0.85);
    c.copy(base).lerp(rng.chance(0.4) ? rose : top, rng.range(0.1, 0.4)).multiplyScalar(rng.range(0.7, 1.05));
    for (let j = 0; j <= nv2; j++) {
      const row = [], la = (j / nv2) * Math.PI;
      for (let i = 0; i < nu2; i++) {
        const lo = (i / nu2) * Math.PI * 2, bump = 0.78 + 0.3 * Math.sin(lo * 2 + ph + j) + 0.16 * Math.sin(lo * 3 - ph * 2 + j * 1.7);
        const sr = Math.sin(la) * s * bump;
        row.push(W.v(rx + Math.cos(lo) * sr * 1.3, ry + Math.cos(la) * s * sq, rz + Math.sin(lo) * sr, c, 0.5 + 0.5 * smoothstep(-0.5, 0.6, Math.cos(la)), 1));
      }
      rr.push(row);
    }
    for (let j = 0; j < nv2; j++) for (let i = 0; i < nu2; i++) { const i1 = (i + 1) % nu2; W.quad(rr[j][i], rr[j][i1], rr[j + 1][i1], rr[j + 1][i]); }
  }
}

// Standalone sand floor: a polar disc with dunes, a scour moat round the coral head and haze to nothing.
async function buildFloor(ctx, W, noise, P, hx, hz, withHead) {
  const seg = 72, rings = 28, R = 300, c = new THREE.Color(), rows = [];
  const centre = W.v(0, 0, 0, P.sand, 1, 0);
  for (let j = 1; j <= rings; j++) {
    if (j % 3 === 0) await ctx.yield?.();
    const r = R * Math.pow(j / rings, 1.7), row = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const dh = Math.hypot(x - hx, z - hz);
      let y = 0.55 * noise.fbm2(x * 0.035, z * 0.035, 3) + 0.2 * noise.n2(x * 0.15, z * 0.15) - 0.3;
      if (withHead) y -= 0.9 * smoothstep(13, 6, dh) * smoothstep(2.5, 5.5, dh);
      c.copy(P.sand).multiplyScalar(0.9 + 0.12 * noise.n2(x * 0.06 + 9, z * 0.06));
      row.push(W.v(x, y, z, c, withHead ? 0.6 + 0.4 * smoothstep(3, 9, dh) : 1, 0));
    }
    rows.push(row);
  }
  await ctx.yield?.();
  for (let i = 0; i < seg; i++) W.tri(centre, rows[0][(i + 1) % seg], rows[0][i]);
  for (let j = 0; j < rings - 1; j++) for (let i = 0; i < seg; i++) { const i1 = (i + 1) % seg; W.quad(rows[j][i], rows[j][i1], rows[j + 1][i1], rows[j + 1][i]); }
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('shark-wall'), rngWall = rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [, mint, jade, white, tan, deep] = pal;
  const object = new THREE.Group(); object.name = 'shark-wall';

  // ---- seeded character of this wall
  const crossDeg = opts.crossAngle ?? rng.range(50, 56), A = crossDeg * Math.PI / 180;
  const fwd = new THREE.Vector3(Math.sin(A), 0, Math.cos(A)), lat = new THREE.Vector3(Math.cos(A), 0, -Math.sin(A));
  const swayPeriod = rng.range(6.2, 7.8), swayLen = rng.range(32, 46);
  const nx = rng.range(0, 100), nz = rng.range(0, 100);
  const hazeCol = new THREE.Color(opts.haze ?? '#1B7FA6').offsetHSL(rng.range(-0.012, 0.012), 0, rng.range(-0.015, 0.02));
  const hazeDeep = new THREE.Color(opts.hazeDeep ?? deep);
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.071, 0.978, 0.195)).normalize();
  const sunColor = opts.sunColor ? new THREE.Color(opts.sunColor) : new THREE.Color('#FFF8EA').multiply(new THREE.Color(0.50, 0.84, 0.95)).multiplyScalar(1.7);
  const skyLight = opts.skyLight ? new THREE.Color(opts.skyLight) : mint.clone().multiplyScalar(0.34).add(hazeCol.clone().multiplyScalar(0.95));
  const deepLight = opts.deepLight ? new THREE.Color(opts.deepLight) : deep.clone().multiplyScalar(1.3).add(hazeCol.clone().multiplyScalar(0.28));

  const shared = {
    uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunColor: { value: sunColor }, uSkyLight: { value: skyLight },
    uDeepLight: { value: deepLight }, uHazeCol: { value: hazeCol }, uHazeDeep: { value: hazeDeep },
    uCamLocal: { value: new THREE.Vector3(0, 14, 400) }, uHaze: { value: 0 }, uSurfaceY: { value: SURFACE_Y },
    uBounce: { value: opts.bounce ? new THREE.Color(opts.bounce) : sunColor.clone().multiply(new THREE.Color(0.20, 0.23, 0.21)) },
    uFootK: { value: clamp(opts.footDark ?? 0, 0, 1) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---- stations. Three populations, all the same animal on the same heading:
  //   (1) the tunnel: animals hanging within arm's length of the lens' line for the whole crossing (close-up LOD);
  //   (2) the sheet: a ragged slab across the amphitheatre, thickest round that line and thinning to the flanks;
  //   (3) the vanguard: a few dozen low over the sand up-current of the sheet, which the bend sees first.
  const total = Math.max(60, Math.round(opts.count ?? 600)), share = Math.min(1, total / 600);
  const HX = 11, HZ = -64, HEAD_H = 8, halfW = opts.halfWidth ?? 41;
  const lineY = (z) => 14 + z * (z > 0 ? 0.022 : 0.03);
  // a hash grid keeps the spacing test cheap (cells of 7.5 m, larger than any spacing asked for)
  const CELL = 7.5, grid = new Map(), cellOf = (v) => Math.floor(v / CELL) + 64;
  const put = (o) => { const k = cellOf(o.x) + 128 * (cellOf(o.y) + 128 * cellOf(o.z)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(o); return o; };
  const clearOf = (x, y, z, sp) => {
    const cx = cellOf(x), cy = cellOf(y), cz = cellOf(z), s2 = sp * sp;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const cell = grid.get(cx + i + 128 * (cy + j + 128 * (cz + k)));
      if (!cell) continue;
      for (let n = 0; n < cell.length; n++) { const q = cell[n], dx = q.x - x, dy = (q.y - y) * 1.55, dz = q.z - z; if (dx * dx + dy * dy + dz * dz < s2) return false; }
    }
    return true;
  };
  const tunnel = [];
  { let ang = rng.range(0, 6.28), z = 45;
    while (z > -40 && tunnel.length < Math.round(100 * share)) {
      const deep = z < -30, r = deep ? rng.range(1.6, 3.6) : rng.range(1.35, 1.95);
      ang += 2.4 + rng.range(-0.3, 0.3);
      let x = Math.cos(ang) * r * 1.2; const dy = Math.sin(ang) * r * 0.85;
      if (Math.abs(dy) < 0.75 && Math.abs(x) < 1.65) x = (x < 0 ? -1 : 1) * 1.65;      // a body 2.5 m long, turned across our line, must not reach it
      tunnel.push(put({ x, y: lineY(z) + dy, z, line: r, big: true }));
      z -= deep ? rng.range(1.6, 2.4) : rng.range(0.7, 1.05);
    }
  }
  await ctx.yield?.();
  const pts = [];
  for (let tries = 0; tries < 60000 && pts.length < total; tries++) {
    if (tries % 300 === 299) await ctx.yield?.();
    const x = rng.range(-halfW - 4, halfW + 4), z = rng.range(-50, 50), y = rng.range(4, 24);
    const line = Math.hypot(x, (y - lineY(z)) * 1.3), core = Math.exp(-(line * line) / 240);
    if (rng() > (0.2 + 0.8 * core) * (z < -12 ? lerp(1, 0.6, smoothstep(-12, -48, z)) : 1)) continue;
    // ragged envelope: scalloped top and bottom, torn flanks and faces
    const e1 = noise.n2(x * 0.045 + nx, z * 0.045 + nz), e2 = noise.n2(x * 0.05 - nz, z * 0.05 + nx + 30), e3 = noise.n2(z * 0.06 + nx, y * 0.12 + nz), e4 = noise.n2(x * 0.06 + nz, y * 0.12 - nx);
    if (y > 22.8 + 1.6 * e1 || y < 4.6 + 1.6 * e2 || Math.abs(x) > halfW - 2 + 3.5 * e3 || z > 43 + 5 * e4 || z < -39 + 4 * e4) continue;
    if (line < 2.7) continue;                                    // the tunnel owns the line itself
    const sp = lerp(3.3, 5.6, smoothstep(0.75, 0.1, core));
    if (clearOf(x, y, z, sp)) pts.push(put({ x, y, z, line }));
  }
  await ctx.yield?.();
  const vanguard = [];
  for (let tries = 0; tries < 2000 && vanguard.length < Math.round(38 * share); tries++) {
    const z = rng.range(47, 81), w = lerp(30, 11, smoothstep(47, 81, z)), x = rng.range(-w, w), y = rng.range(3.7, 5.2) + 5.5 * rng() * rng();
    if (clearOf(x, y, z, 4.2)) vanguard.push(put({ x, y, z, line: 99 }));
  }
  await ctx.yield?.();
  // the STEP: some twenty animals hanging in the mouth of the amphitheatre at the lens' own height, off its line, so the
  // bend sees a few large sharks in profile before the mass (their own random stream: the rest of the wall is undisturbed)
  const stepRng = makeRng('shark-wall-step:' + (ctx.seed ?? 0)), stepList = [];
  for (let tries = 0; tries < 2500 && stepList.length < Math.round(34 * share); tries++) {
    const z = stepRng.range(48, 90), hw = z >= 90 ? 13 : 13 + 34.5 * smoothstep(90, 62, z), w = Math.min(16, hw - 5.5);
    const x = (stepRng.chance(0.5) ? 1 : -1) * stepRng.range(4.5, Math.max(5.5, w)), yl = z > 70 ? 16.5 + (z - 70) * 0.0577 : 15 + (z - 46) * 0.0625, y = yl + stepRng.range(-5, 1.5);
    if (clearOf(x, y, z, 4.6)) stepList.push(put({ x, y, z, line: 99, big: Math.abs(x) < 11 }));
  }
  await ctx.yield?.();
  // THE FRONT (its own random stream too): the wall carried 23 m up-current into the mouth of the amphitheatre, so that
  // the bend looks into ranks of animals instead of across sand at a far shoal. The tunnel runs on to z = 83 (the first
  // animals slide past as the lens comes off the bend), twenty more large animals hang at the lens' height in the middle
  // of the bend's view (3-9 m off its line), and the sheet's leading face stands at z = 75.
  const frontRng = makeRng('shark-wall-front:' + (ctx.seed ?? 0));
  const lineP = (z) => (z > 46 ? 15 + (z - 46) * 0.0625 : lineY(z));
  const hwAt = (z) => (z >= 90 ? 13 : z >= 62 ? 13 + 34.5 * smoothstep(90, 62, z) : 47.5);
  const tunnel2 = [], step2 = [], front = [];
  { let ang = frontRng.range(0, 6.28), z = 83;
    while (z > 45.7 && tunnel2.length < Math.round(46 * share)) {
      const r = frontRng.range(1.4, 2.1); ang += 2.4 + frontRng.range(-0.3, 0.3);
      let x = Math.cos(ang) * r * 1.2; const dy = Math.sin(ang) * r * 0.85;
      if (Math.abs(dy) < 0.75 && Math.abs(x) < 1.65) x = (x < 0 ? -1 : 1) * 1.65;
      tunnel2.push(put({ x, y: lineP(z) + dy, z, line: r, big: true }));
      z -= frontRng.range(0.8, 1.2);
    } }
  for (let tries = 0; tries < 1500 && step2.length < Math.round(20 * share); tries++) {
    const z = frontRng.range(50, 88), x = (frontRng.chance(0.5) ? 1 : -1) * frontRng.range(3.2, Math.min(9, hwAt(z) - 6)), y = lineP(z) + frontRng.range(-3, 2.4);
    if (clearOf(x, y, z, 4.0)) step2.push(put({ x, y, z, line: 99, big: true }));
  }
  await ctx.yield?.();
  for (let tries = 0; tries < 9000 && front.length < Math.round(140 * share); tries++) {
    if (tries % 300 === 299) await ctx.yield?.();
    const z = frontRng.range(43, 75), w = Math.min(halfW + 2, hwAt(z) - 7), x = frontRng.range(-w, w), y = frontRng.range(4.5, 24);
    const line = Math.hypot(x, (y - lineP(z)) * 1.3), core = Math.exp(-(line * line) / 260);
    if (frontRng() > (0.22 + 0.78 * core) * lerp(1, 0.45, smoothstep(58, 75, z))) continue;
    if (line < 2.8) continue;
    if (clearOf(x, y, z, lerp(3.3, 5.4, smoothstep(0.75, 0.1, core)))) front.push(put({ x, y, z, line }));
  }
  await ctx.yield?.();
  front.sort((p, q) => p.line - q.line);
  pts.sort((p, q) => p.line - q.line);
  await ctx.yield?.();
  const lod0 = Math.min(pts.length, Math.round(110 * share));
  const nearList = pts.slice(0, lod0).concat(vanguard), nearCount = nearList.length;
  const farCount = Math.max(0, Math.round((pts.length - lod0) * clamp(detail, 0.5, 1)));
  const frontNear = Math.min(front.length, Math.round(34 * share)), frontFar = Math.max(0, Math.round((front.length - frontNear) * clamp(detail, 0.5, 1)));
  // a dozen blacktips and silvertips among the grey reefs (some seeds have none)
  const guests = rng.chance(0.8) ? rng.int(8, 14) : 0, guestSet = new Map();
  for (let i = 0; i < guests; i++) guestSet.set(rng.int(0, Math.max(0, Math.min(pts.length, lod0 + 80) - 1)), rng.chance(0.6) ? 1 : 2);

  const sharkUniforms = {
    ...fogU(), ...shared,
    uCamDir: { value: new THREE.Vector3(0, 0, -1) }, uHead: { value: new THREE.Vector2(Math.sin(A), Math.cos(A)) },
    uSway: { value: new THREE.Vector4(0.6, (Math.PI * 2) / swayLen, (Math.PI * 2) / swayPeriod, 0.11) }, uPart: { value: 1 },
    uCamFwd: { value: new THREE.Vector3(0, 0, -1) }, uCamRt: { value: new THREE.Vector3(1, 0, 0) }, uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uGate: { value: new THREE.Vector4(1.07, 0.6, 2.0, 6.0) },
    uPacA: { value: Array.from({ length: PACERS }, () => new THREE.Vector4(0, -999, 0, 0)) }, uPacB: { value: Array.from({ length: PACERS }, () => new THREE.Vector4(0, 0, 1, 1)) },
    uBack: { value: new THREE.Color(0.165, 0.17, 0.172) }, uBronze: { value: tan.clone().multiplyScalar(0.36).lerp(new THREE.Color(0.24, 0.21, 0.17), 0.4) },
    uBelly: { value: white.clone().multiplyScalar(0.86) }, uBounce: shared.uBounce,
  };
  const sharkMat = new THREE.ShaderMaterial({ uniforms: sharkUniforms, vertexShader: SHARK_VERT, fragmentShader: SHARK_FRAG, fog: true, side: THREE.DoubleSide });
  await ctx.yield?.();
  // Per-animal attributes are drawn in list order (so a list's animals never change when lists are added), then the
  // instances are laid out in whatever order a mesh wants: every shark mesh is sorted along z and the number of instances
  // drawn follows the lens (update(), "windows"), so animals well behind it, or beyond sight ahead, cost nothing.
  const hashOf = (p, k) => { const v = Math.sin(p.x * 12.9898 + p.y * 78.233 + p.z * 37.719 + k * 4.137) * 43758.5453; return v - Math.floor(v); };
  const attrsOf = (list, offset, rng = rngWall) => {
    const n = list.length, iPos = new Float32Array(n * 3), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const p = list[i], variant = guestSet.get(offset + i) ?? 0;
      // (a tunnel animal hangs no more than 1.2 m above or below the lens' line, until it darts aside)
      iPos.set([p.x, p.big && (p.line ?? 99) < 5 ? lineP(p.z) + (p.y - lineP(p.z)) * 0.72 : p.y, p.z], i * 3);
      const len0 = p.big ? rng.range(2.25, 2.65) : variant === 2 ? rng.range(2.4, 2.9) : variant === 1 ? rng.range(1.7, 2.0) : rng.range(1.85, 2.3);
      // size, pose and who peels off are hashed from the station itself (no draw from the stream, so no animal has moved):
      // a sixth are juveniles from 1.4 m, a sixth large animals to 2.8 m; three in ten hang nose-up or nose-down; one in
      // six of those well off the lens' line is a turner (iA.w + 0.25: see SHARK_VERT)
      const h1 = hashOf(p, 1), h2 = hashOf(p, 2), h3 = hashOf(p, 3);
      const len = clamp(len0 * (h1 < 0.16 ? lerp(0.62, 0.76, h1 / 0.16) : h1 < 0.84 ? lerp(0.80, 1.04, (h1 - 0.16) / 0.68) : lerp(1.08, 1.24, (h1 - 0.84) / 0.16)), 1.4, 2.8);
      const turner = !p.big && (p.line ?? 0) > 6 && Math.hypot(p.x, p.y - lineP(p.z)) > 8 && h2 > 0.62 ? 0.25 : 0, tip = h3 > 0.7 ? (hashOf(p, 4) - 0.5) * 0.24 : 0;
      const veer = !p.big && h3 < 0.36 ? (hashOf(p, 5) - 0.5) * 0.9 : 0;     // a third of the ranks hold a heading up to 25 degrees off the rest
      iA.set([len, rng(), rng.range(0.52, 0.8) * (1.7 / len), variant + turner], i * 4);
      // heading: a little of its own, and the current fans as it spills across the amphitheatre (more broadside on the
      // camera's left; within 8 m of the lens' line on that side a further 17 degrees, so no near animal is seen nose-on)
      const ld = Math.hypot(p.x, p.y - lineP(p.z));
      iB.set([veer + rng.gauss() * 0.07 + 0.25 * smoothstep(6, -20, p.x) + 0.30 * smoothstep(0.4, -2.2, p.x) * (1 - smoothstep(8, 13, ld)), rng.gauss() * 0.025 + tip, rng.range(16, 44), rng()], i * 4);
    }
    // (sixth polish pass) knots and gaps: the ranks well off the lens' line (9 m and more) are gathered, cell by cell of
    // 26 m of corridor, 14 m of depth and one flank, toward the middle of their own cell: a little over half the cells
    // close up into a knot (each animal comes 30 to 50 % of the way in, never nearer the line than 8.5 m), the rest stay
    // loose, so the wall is clumps and open water instead of an even pattern. Hashed from the stations: no draw is spent
    const cells = new Map(), keyOf = (p) => Math.floor(p.z / 26 + 0.37 * Math.sign(p.x)) * 64 + Math.floor(p.y / 14) * 4 + (p.x > 0 ? 1 : 0);
    const loose = (p) => !p.big && Math.hypot(p.x, p.y - lineP(p.z)) > 9;
    for (let i = 0; i < n; i++) { const p = list[i]; if (!loose(p)) continue; const k = keyOf(p), c = cells.get(k) || [0, 0, 0, 0]; c[0] += p.x; c[1] += p.y; c[2] += p.z; c[3]++; cells.set(k, c); }
    for (let i = 0; i < n; i++) {
      const p = list[i]; if (!loose(p)) continue;
      const k = keyOf(p), c = cells.get(k), hv = Math.sin(k * 12.9898 + 4.7) * 43758.5453, h = hv - Math.floor(hv);
      if (c[3] < 3 || h > 0.56) continue;
      const f = 0.30 + 0.20 * hashOf(p, 6), x = lerp(p.x, c[0] / c[3], f), y = lerp(p.y, c[1] / c[3], f), z = lerp(p.z, c[2] / c[3], f);
      if (Math.hypot(x, y - lineP(z)) > 8.5) iPos.set([x, y, z], i * 3);
    }
    return { n, iPos, iA, iB };
  };
  const joinAttrs = (a, b) => {
    const cat = (x, y) => { const o = new Float32Array(x.length + y.length); o.set(x); o.set(y, x.length); return o; };
    return { n: a.n + b.n, iPos: cat(a.iPos, b.iPos), iA: cat(a.iA, b.iA), iB: cat(a.iB, b.iB) };
  };
  const baseGeo = [null, null, null], windows = [], pacers = [];
  // order: which of A's animals, and in what order. win: { asc, off, back, swap } (see update)
  const shoal = (lod, At, order, name, win = null, uncull = false) => {
    const base = baseGeo[lod] || (baseGeo[lod] = sharkGeometry(lod)), g = new THREE.InstancedBufferGeometry();
    g.setIndex(base.index); for (const k of ['position', 'normal', 'aInfo']) g.setAttribute(k, base.attributes[k]);
    const n = order.length, iPos = new Float32Array(n * 3), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), zs = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const j = order[i];
      iPos.set(At.iPos.subarray(j * 3, j * 3 + 3), i * 3); iA.set(At.iA.subarray(j * 4, j * 4 + 4), i * 4); iB.set(At.iB.subarray(j * 4, j * 4 + 4), i * 4); zs[i] = At.iPos[j * 3 + 2];
    }
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    g.instanceCount = n;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 14, 0), 100);
    const mesh = new THREE.Mesh(g, sharkMat); mesh.name = name;
    if (uncull) mesh.frustumCulled = false;
    object.add(mesh);
    if (win && n) windows.push({ mesh, g, zs, n, ...win });
    return mesh;
  };
  const byZ = (At, dir) => { const o = Array.from({ length: At.n }, (_, i) => i); o.sort((i, j) => dir * (At.iPos[i * 3 + 2] - At.iPos[j * 3 + 2])); return o; };
  const BEHIND = { asc: true, off: 14 };            // drawn until the lens is 14 m past them
  // (the three draws below are the wall's own random stream, in the order they have always been made)
  const tunA = attrsOf(tunnel, 5e5), nearA = attrsOf(nearList, 0), farA = attrsOf(pts.slice(lod0, lod0 + farCount), nearCount);
  await ctx.yield?.();
  // the tunnel: the close-up model only for the animals from 5 m behind the lens to 14 m ahead of it (five short runs of
  // the line, each hidden once the lens is past it); further ahead the same animals are drawn with the ranks' model
  // (four of every five tunnel stations are kept, taken along the line: about one animal at arm's length a metre)
  const tunAll = joinAttrs(attrsOf(tunnel2, 6e5, frontRng), tunA), tunOrder = byZ(tunAll, -1).filter((_, i) => i % 5 !== 2), RUNS = 5, per = Math.ceil(tunOrder.length / RUNS);
  for (let r = 0; r < RUNS; r++) shoal(2, tunAll, tunOrder.slice(r * per, (r + 1) * per), 'sharks-tunnel', { asc: false, off: 14, back: 5 });
  shoal(0, tunAll, tunOrder.slice().reverse(), 'sharks-tunnel-ahead', { asc: true, off: -14, swap: true });
  await ctx.yield?.();
  shoal(0, nearA, byZ(nearA, 1), 'sharks-near', BEHIND);
  await ctx.yield?.();
  if (farCount > 0) shoal(1, farA, byZ(farA, 1), 'sharks-far', BEHIND);
  await ctx.yield?.();
  const stepA = joinAttrs(attrsOf(stepList, 2e5, stepRng), attrsOf(step2, 7e5, frontRng));
  if (stepA.n) shoal(0, stepA, byZ(stepA, 1), 'sharks-step', BEHIND);
  await ctx.yield?.();
  const frontA = attrsOf(front.slice(0, frontNear + frontFar), 8e5, frontRng), fz = (lo, hi) => byZ(frontA, 1).filter((i) => i >= lo && i < hi);
  if (frontNear) shoal(0, frontA, fz(0, frontNear), 'sharks-front-near', BEHIND);
  if (frontFar) shoal(1, frontA, fz(frontNear, frontNear + frontFar), 'sharks-front-far', BEHIND);
  await ctx.yield?.();

  // ---- coral head and the standalone dressing
  const P = {
    sand: tan.clone().lerp(white, 0.3).multiplyScalar(0.62), white: white.clone().multiplyScalar(0.8),
    ochre: new THREE.Color('#D69A45'), olive: new THREE.Color('#928C62'), pink: tan.clone().lerp(new THREE.Color('#D97C92'), 0.45),
  };
  const rockUniforms = () => ({ ...fogU(), ...shared, uPink: { value: P.pink }, uOchre: { value: P.ochre }, uOlive: { value: P.olive }, uBounce: shared.uBounce, uFlow: { value: new THREE.Vector2(fwd.x, fwd.z) } });
  const rockMat = new THREE.ShaderMaterial({ uniforms: rockUniforms(), vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true, side: THREE.DoubleSide });
  const withHead = opts.coralHead !== false;
  if (withHead) {
    const W = makeWriter(); await buildCoralHead(ctx, W, rng.fork('head'), noise, P, HX, HZ, HEAD_H);
    await ctx.yield?.();
    const head = new THREE.Mesh(await W.buildAsync(ctx), rockMat); head.name = 'coral-head'; object.add(head);
  }
  await ctx.yield?.();
  const Wf = makeWriter(); await buildFloor(ctx, Wf, noise, P, HX, HZ, withHead);
  await ctx.yield?.();
  const floor = new THREE.Mesh(await Wf.buildAsync(ctx), rockMat); floor.name = 'standalone-floor'; floor.visible = false; object.add(floor);
  await ctx.yield?.();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 24), new THREE.ShaderMaterial({ uniforms: { ...shared }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
  dome.name = 'standalone-water'; dome.renderOrder = -0.5; dome.frustumCulled = false; dome.visible = false; object.add(dome);

  // ---- per-frame
  let forced = opts.standalone === true ? true : opts.standalone === false ? false : null;
  const camL = new THREE.Vector3(), prev = new THREE.Vector3(), fw = new THREE.Vector3(), vel = new THREE.Vector3(), inv = new THREE.Matrix4();
  let first = true;
  const update = (dt, time, camera) => {
    shared.uTime.value = time;
    let root = object; while (root.parent) root = root.parent;
    const fog = root !== object ? root.fog : null;
    const dense = !!fog && ((fog.isFogExp2 && fog.density >= 0.004) || (fog.isFog && fog.far < 400));
    const standalone = forced ?? !dense;
    floor.visible = standalone; dome.visible = standalone; shared.uHaze.value = standalone ? 0.0095 : 0;
    if (!camera) return;
    object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
    // read the camera's world matrix (the portal-preview camera has its matrix set directly and matrixAutoUpdate off;
    // getWorldDirection / updateMatrixWorld would rewrite it, so an ordinary camera alone is refreshed first)
    if (camera.matrixAutoUpdate !== false) camera.updateMatrixWorld();
    camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
    fw.set(0, 0, -1).transformDirection(camera.matrixWorld).transformDirection(inv);
    // the tunnel follows the lens' line of travel; a parked or teleported camera falls back to its gaze
    const dir = sharkUniforms.uCamDir.value;
    vel.subVectors(camL, prev); const speed = dt > 1e-4 ? vel.length() / dt : 0;
    const target = (!first && speed > 1 && speed < 60) ? vel.normalize() : fw;
    if (first || !(dt > 1e-4)) dir.copy(target); else dir.lerp(target, 1 - Math.exp(-dt * 5)).normalize();
    if (!(dir.lengthSq() > 0.5)) dir.copy(fw);
    prev.copy(camL); first = false;
    shared.uCamLocal.value.copy(camL);
    // the clear cone follows the gaze and the lens' real field of view (a tall phone screen has a wider vertical one)
    { const me = camera.matrixWorld.elements, pe = camera.projectionMatrix.elements, G = sharkUniforms.uGate.value;
      sharkUniforms.uCamFwd.value.copy(fw);
      sharkUniforms.uCamRt.value.set(me[0], me[1], me[2]).transformDirection(inv);
      sharkUniforms.uCamUp.value.set(me[4], me[5], me[6]).transformDirection(inv);
      G.x = 1 / Math.max(pe[0], 0.2); G.y = 1 / Math.max(pe[5], 0.2); }
    dome.position.copy(camL);
    // windows: how many instances of each z-sorted shark mesh to draw. While the lens looks down the current (-Z, as it does
    // from the dive to the portal) animals well behind it are dropped, far ones wait until they are within sight, and the
    // tunnel's close-up model is kept to the animals near the lens. A camera looking any other way (the part viewer) draws all.
    const cull = fw.z < -0.3, cz = camL.z;
    for (const w of windows) {
      const zs = w.zs; let n = w.n, vis = true;
      if (cull) {
        let lo = 0, hi = w.n;
        if (w.asc) { const v = cz + w.off; while (lo < hi) { const m = (lo + hi) >> 1; if (zs[m] <= v) lo = m + 1; else hi = m; } }
        else { const v = cz - w.off; while (lo < hi) { const m = (lo + hi) >> 1; if (zs[m] > v) lo = m + 1; else hi = m; } vis = w.back === undefined || zs[w.n - 1] < cz + w.back; }
        n = lo;
      } else if (w.swap) n = 0;
      w.g.instanceCount = n; w.mesh.visible = vis && n > 0;
    }
  };

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    object, radius: 24, height: 24, center: V(0, 14, 0),
    anchors: {
      heading: fwd.clone(), crossAngle: crossDeg,
      flyThrough: [V(0, 18, 96), V(0, 16.5, 70), V(0, 15, 46), V(0, 14.5, 20), V(0, 14, 0), V(0, 13.4, -24), V(0, 12.6, -46), V(0, 9.2, -64), V(-1, 5, -90)],
      viewpoints: { bend: V(0, 17, 78), inside: V(0, 14, 0), exit: V(0, 12.6, -46) },
      sheet: { center: V(0, 14, 0), size: [80, 20, 80], yMin: 4, yMax: 24 },
      coralHead: { position: V(HX, 0, HZ), crownY: HEAD_H, radius: 5 },
      mantaOrbit: { center: V(HX, 10.5, HZ), radius: 7, y: 10.5 },
      escortLanes: [V(-9, 9, -70), V(7, 12, -40)],
      portalSeat: { position: V(-4, 20, -186), facing: V(0, -0.342, 0.94) },
      surfaceY: SURFACE_Y, floorY: 0,
    },
    uniforms: { ...shared, ...sharkUniforms },
    rockMaterial: rockMat,   // the world builds its canyon with makeWriter() in the hero's local frame and adds it to `object`
    count: tunOrder.length + nearCount + farCount + stepA.n + frontNear + frontFar,
    // more of the same animals anywhere in the hero's local frame (the world strews stragglers down the exit): [{x, y, z}]
    // opt.range: draw only the animals within that many metres ahead of the lens (and hide the mesh once all are opt.back m behind it)
    addSharks(points, lod = 0, opt = {}) {
      if (!points || !points.length) return null;
      const At = attrsOf(points, 1e6 + (opt.offset ?? 0), opt.rng ?? rngWall);
      return shoal(lod, At, byZ(At, -1), opt.name ?? 'sharks-stragglers', opt.range ? { asc: false, off: opt.range, back: opt.back ?? 14 } : null, true);
    },
    // A pacer: one large animal (the close-up model) that the world places every frame, for the large sharks that hold
    // station beside the lens' line. At most PACERS (fourteen: one slot each in uPacA / uPacB, round which the ranks part). Returns { mesh, place(M, on, stroke, bend, beat, clear) }: M is the animal's frame
    // in the hero's local space (a rotation and a position: nose along +Z, back along +Y), stroke 0..1.5, bend the C of
    // its body, beat its tail-beat phase in radians, clear the radius the ranks keep off its axis (they part round it).
    addPacer(o = {}) {
      const i = pacers.length; if (i >= PACERS) return null;
      const len = o.length ?? 2.7, M = new THREE.Matrix4();
      const uPA = new THREE.Vector4(len, o.phase ?? 0.31 + 0.23 * i, o.variant ?? 0, 0), uPB = new THREE.Vector3(0, 0, 0);
      const mat = new THREE.ShaderMaterial({ uniforms: { ...sharkUniforms, uPM: { value: M }, uPA: { value: uPA }, uPB: { value: uPB } }, vertexShader: PACER_VERT, fragmentShader: SHARK_FRAG, fog: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(baseGeo[2] || (baseGeo[2] = sharkGeometry(2)), mat); mesh.name = 'shark-pacer'; mesh.frustumCulled = false; mesh.visible = false; object.add(mesh);
      const A = sharkUniforms.uPacA.value[i], B = sharkUniforms.uPacB.value[i], e = M.elements;
      const pc = { mesh, length: len, place(m, on, stroke = 0, bend = 0, beat = 0, clear = 2.0) {
        mesh.visible = !!on;
        if (!on) { A.set(0, -999, 0, 0); return; }
        M.copy(m); uPB.set(stroke, bend, 0); uPA.w = beat;
        A.set(e[12], e[13], e[14], clear); B.set(e[8], e[9], e[10], len * 0.46);
      } };
      pacers.push(pc); return pc;
    },
    setParting(k) { sharkUniforms.uPart.value = clamp(k, 0, 1); },
    setStandalone(on) { forced = on === null || on === undefined ? null : !!on; },
    setLight(l = {}) {
      if (l.sunDir) sunDir.copy(l.sunDir).normalize();
      if (l.sunColor) sunColor.set(l.sunColor); if (l.skyLight) skyLight.set(l.skyLight); if (l.deepLight) deepLight.set(l.deepLight);
      if (l.haze) hazeCol.set(l.haze); if (l.hazeDeep) hazeDeep.set(l.hazeDeep);
    },
    update,
    dispose() {},
    ground: false, groundY: 0,
  };
}
