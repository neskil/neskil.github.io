// THE TURNING HERD - hero set piece for the world "reindeer-cyclone".
// (header: see HERO NOTES block below; kept short here, full hand-off notes follow the imports)
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { Geo } from '../kit/fauna.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// HERO NOTES
// WHAT   A reindeer cyclone: ~3000 animals, each running anticlockwise on its own ring (rings 2.2 m apart,
//   r 66..200 m) at the speed its radius demands (11 m/s extended trot outside, 6 m/s at r 90, a 1.4 m/s
//   walk at the rim of the eye), seeded on a four-arm trailing spiral that winds tighter as the clock runs.
//   Every animal throws a true projected blue shadow (ray-cast against a capsule reindeer in the shadow
//   card's fragment shader, so legs scissor in the shadow and its length follows the sun). Breath jets in
//   time with the stride, hooves kick powder, a 25 m wreath of steam and powder leans east. In the calm eye
//   (r < 62) ~150 cows and calves stand, chew, paw and lie round a frost-split granite erratic whose 8 m
//   cleft takes the exit portal. The piece brings its own snow: a 340 m disc (trampled annulus with
//   concentric hoof-track grooves, wind-combed sastrugi outside, feeding craters and scoured heath in the
//   eye, sparkle) that the world's terrain should meet at y = 0 (the disc fades out from r 300 to 340).
// LOCAL SPACE  origin = centre of the eye at snow level. +Y up. +X = east, +Z = south (the front: the sun
//   is due south, 17 degrees up). Animals run east -> north -> west -> south. Lake surface y = 0.
// SIZE   herd radius 205 m, snow disc 340 m, steam to y ~ 28, boulder 13 m tall. hero.radius / height /
//   center are a framing for the viewer (radius 95, height 60); the true radius is hero.trueRadius = 340.
// ROUND 2 The arms and lanes are of equal width and a dense ring of walkers closes the eye; the arms are printed on the
//   snow as blue-grey bands (darker with distance). The eye floor is a marched height field: feeding craters with
//   thrown lips, self-shadow and lichen floors (hero.craters lists them, from the same hash as the shader), wind
//   crust and hoof pocks near the lens. An aisle of cows and calves lines the last straight 4.6..5.4 m from the
//   lens (hero.eyeSpots). The erratic is two stacks of joint-bounded blocks (exact clipped polytopes: flat faces,
//   hard edges), with talus and a real drift mesh through the cleft. On rare visits a white cow (iA.x > 900,
//   driven by uLead/uLeadB through hero.setLead(u)) leads the lens down the slide, and another stands in the cleft.
// ROUND 3 The route no longer crosses high over the eye: it dives off the crest, slants low over the north-eastern arms,
//   joins a 122 m left wheel at the rim of the eye and rides it outward with the herd (west, south into the sun, east),
//   then slides inward and takes the last straight. From u 0.2 on the lens is 2.2..6 m up among the animals. Lying
//   animals fold their forelegs, keep the neck upright and the head level; coats take the light of the snow on their
//   shade side; breath and powder are sphere-shaded sprites; the snow under the lens is churned (ruts along the rings,
//   crumbs). Thin shadow lines (legs, neck, antlers) keep a width of about a pixel and stay joined to the hooves.
// ROUND 5 THE HIGH PASS (the route is changed on purpose): after the rim of the eye the lens climbs a left-hand spiral over
//   the western arms to 36 m (the whole figure from above, side-lit, the rings turning at their own speeds), comes down
//   into the south-western arms, runs east along the outer edge of the herd and only then slides inward. The gaze is the
//   hero's (hero.gazeAt(u), handed to the engine by the world as one point of interest, hero.gazePoi). Outside the
//   trampled ring the snow is a height field (GROUND_GLSL, shared with the world's land): fields of sastrugi with short
//   shadows, and the trails the herd trod down from the col.
// ROUND 7 ONE PLACE EACH. Every animal has one place on its ring for the whole flight: nothing changes place and nothing
//   is drawn or hidden by a clock. The river beside the lens's lane is seeded in makeSlots as slots like any other, by
//   rules of the world: files on the rings and half-rings beside the lane on both sides (3.3 m off and outward), the big
//   bare-headed bulls on the outside, and no body nearer the lens's line than 2.2 m at any sample of the low route
//   (0.8 m apart). On every ring within ten metres of that lane the herd runs closed up, nose to tail (three to four
//   metres from animal to animal). The aisle is lined out to the rim of the eye: a kerb of lying animals, cows and
//   calves standing and pawing behind them. Levels of detail are dealt out afresh every frame by distance from the lens
//   (any camera, any window), with a margin so that none flickers; breath and powder of the animals beside the lens
//   come in with nearness. The erratic's blocks are broken to leaning points (no level tops), each block has its own
//   tone, old skin is dark and new breaks pale, hoar furs the faces the sun does not reach.
// ROUND 8 RULES OF THE WORLD ONLY.
//   The lens rides 2.2 m above the lake wherever it is low among the animals (one height from the foot of the descent
//   to the rim of the eye, reached by one smooth descent from the high pass).
//   The gaze of the high pass is one rule: the lens looks at the lake, at a point 2.14 times its own height from under
//   it (25 degrees below the horizon), on the bearing of the erratic but never nearer the sun's bearing than SUN_OFF
//   (62 degrees): the near rings lie under that look, the eye, the erratic and the far bank beyond them, and the sun's
//   disc stands outside it. As the lens comes down past the top it looks ahead on the snow, the same angle off the sun.
//   There is no single staged bull: the ring 4.6 m outside the lens's lane (BULL_R) carries a file of antlered young
//   animals at the river's own spacing along the whole run, phases by lot; on the run the gaze rests on the point of
//   that ring that lies from the lens toward the sun. Their neighbours obey the rules of every slot.
//   The forty stragglers trot down the five printed trails from the col (trailXZ: the same lines GROUND_GLSL prints),
//   spread over each trail by lot and moved by the herd clock; at the foot each turns onto a ring outside the outer arm
//   and runs on with the herd. They stand on the ground the world hands in (opts.ground, hero.setGround).
//   Far animals: one rule by each animal's own distance from the lens (FAR_GLSL: a single coefficient for size, tone and
//   steam, in any camera at any place). The arms printed on the snow go, with distance, toward the mean of bodies and
//   snow, never to the body colour, so that lanes and arms stay apart.
//   Steam hangs over the aisle before the cleft and curls up the erratic's sunlit faces (sprite type 4); nothing but the
//   sun lights the way out.
//   Every group of animals draws from a named stream of its own (FK in buildHero).
// COST   ~295k triangles at most in the herd at detail 1 (the densest look of the low flight), 11 draw calls (snow,
//   shadow cards, 4 herd levels, beds, boulder, drift, 2 sprite sets), no lights, no textures, ~260 ms build. Levels by
//   distance: full build (964 tris) within 15 m, 230 tris to 38 m, 140 to 68 m, 22-tri prisms beyond (hero.tiers =
//   { caps, counts (this frame: three nearer builds, the rest, near sprites), triangles }); ctx.quality.detail thins
//   the far herd evenly and the sprites.
// LIGHT  All ShaderMaterials lit by uniforms in LOCAL space (no scene lights are read): a low pale-gold sun
//   and a blue sky fill with a warm snow bounce. hero.setLight({ sunDir (toward the sun, local), sunColor,
//   sunIntensity, sky, skyIntensity, bounce, shadowTint, shadowStrength }) re-lights everything, shadows
//   included. Snow recipe to match in the world's terrain: albedo cream (palette 0) x (sun x n.l / sin(el)
//   x 0.56) warmed to palette 1 on sun-facing drift faces + sky blue (palette 3) x 0.3; shade is palette 2;
//   flat lit snow lands near 0.72. Scene fog is honoured everywhere (fog chunks).
// OPTS   palette  7 hex strings in brief order: lit snow, warm drift face, shadow blue, sky blue, sun gold,
//                 dark coat/legs, cream ruff
//        stragglers  N late animals trotting down the trails from the col (default 0; the world asks for forty)
//        ground   (x, z) => height of the land in metres (the stragglers stand on it; the lake is 0); hero.setGround(fn) refines it
//        hour     'noon' (default) | 'lastSun' (sun 4 deg up, rose snow, violet 20 m shadows) | 'moon'
//        weather  'clear' (default) | 'blizzard' (knee-deep flowing spindrift) | 'overcast' (soft light)
//        season   'march' (default) | 'april' (wet grey snow, heath patches, bulls bare)
//        density  0.73..1.13 scales the 3000 animals (the world passes at most 1.08)      arms  3..5 (default: per seed, mostly 4)
//        paleHerd true: most of the herd pale             whiteCow true/false (default: 1 seed in 8)
//        boulder  false to omit the erratic               snow  false to omit the snow disc
//        sunDir   [x,y,z] local, toward the sun (overrides hour)
// CLOCK  hero.setClock(seconds) sets the herd clock; hero.setProgress(u) = setClock(hero.clockAt(u)), the
//   time the camera reaches u on hero.anchors.flyThrough at hero.pace(u) (hero.duration seconds in all).
//   Besides the spiral, escorts and the river's files are seeded beside the camera's own lane so the run and the slide
//   pass through a river of bodies; if the clock ever differs from the route's, animals step round the lens.
//   Call setProgress(u) every frame, plus an offset of your own while u is 0 if the herd should turn in the
//   portal preview (hero.setClock(hero.clockAt(0) - previewSeconds) keeps the lane assertion valid from
//   u > 0 only if you blend the offset out before u ~ 0.5). If neither is called the clock is update()'s time.
//   The route was sampled against this clock at build: no animal's body ever comes within 2.2 m of the lens.
// ANCHORS (local space)
//   flyThrough  ordered points for makePath(): crest entry 48 m up heading west, the dive down the lee slope, the
//               slant over the north-eastern arms (10 m down to 4 m), the 122 m left wheel from the rim of the eye
//               outward (4.3 m down to 2.2 m), the run east inside the southern arm, the slide inward with the animals
//               (sideways speed matched to each ring), the 64 m straight into the cleft.
//   portalSeat  { position (portal centre, in the cleft), base (ground under it), facing (unit vector the
//               portal looks along, toward the arriving camera), width 8, height 10 }
//   viewpoints  { above, wheel, arm, slide, aisle }: camera positions for the brief's key frames
//   eye { center, radius }, boulderTop (raven perch), cleftDir, sunDir, wind (east), uMarks { dive1, wheel0,
//               wheel1, run, slide0, straight0 } (u at the section joins; run = middle of the run east,
//               where the spiral is phased so that the camera is inside an arm)

const TAU = Math.PI * 2;
const DEF_PALETTE = ['#FBE7DA', '#F4B8A6', '#5B7DB6', '#A9CBE2', '#FFC46A', '#4B3B32', '#E9E0CF'];
const R_EYE = 62, R_IN = 66, R_OUT = 200, RING = 2.2, T_REF = 36;
// levels of detail by distance from the lens (metres): an animal takes a nearer build inside LOD_IN, gives it up beyond LOD_OUT;
// at most LOD_CAP animals in each of the three nearer builds; the near sprites fade in between PUFF_FADE[0] and [1], and
// the second half of them (a jet at every stride, powder from every hoof) between PUFF_NEAR[0] and [1]
const LOD_IN = [15, 38, 68], LOD_OUT = [17.5, 42, 74], LOD_CAP = [140, 520, 760], PUFF_FADE = [40, 27], PUFF_NEAR = [20, 13], PUFF_CAP = 3400;

// speed (m/s) on a ring of radius r; the same formula is in HERD_GLSL
const speedOf = (r) => 1.4 + 4.6 * smoothstep(64, 92, r) + 5 * smoothstep(92, 165, r);

// The camera route in local space, and the clock (seconds) at which the camera reaches each u.
// ROUND 3: the lens no longer crosses high above the eye. It leaves the crest, dives down the lee slope, slants low over
// the north-eastern arms (10 m down to 4 m), joins a left wheel of 122 m radius among the walkers at the rim of the eye
// and rides that wheel outward with the herd (west, then south into the sun, then east), and only then slides inward.
// ROUND 4: the wheel is ridden from inside. The slant runs tangent onto a ring at the rim of the eye (walkers 5.5 m either
// side); the lens rides that ring for eighty-six degrees, north round to west, looking across the quiet eye into the low sun,
// then spirals outward through the arms, south into the sun and east, to the outer arm where the slide begins.
const RIM_R = R_IN + 2.5 * RING;      // between two rings: the rows beside the lens walk 5.5 m off on either side
// ROUND 5: THE HIGH PASS. The route is changed on purpose: after the slant onto the rim of the eye the lens leaves the rim
// at once, crosses the north-western arms outward at antler height and climbs a left-hand spiral over the western arms
// (radius 138 m) to 36 m, so that from the west the whole turning figure lies below, the eye and the erratic beyond the
// near rings; it comes down steeply into the south-western arms, wheels outward low into the sun to the outer edge of the
// herd, runs east along that edge (a file of antlered young animals trots on the sun side), and only then slides inward.
// ROUND 8: LOW_Y, the brief's 2.2 m, is the lens's height wherever it is low among the animals: the descent from the top
// is one smooth curve down to it, and the run along the outer edge and the whole slide keep it.
const TOP_R = 138, TOP_Y = 36, LOW_Y = 2.2, RUN_R = R_IN + 57.5 * RING, BULL_R = RUN_R + 4.6, D2R = Math.PI / 180;
const TH_A = 92 * D2R, TH_R1 = 135 * D2R, TH_TOP = 181 * D2R, TH_LOW = 213 * D2R, TH_RUN = 246 * D2R, TH_S = 277 * D2R;
function buildRoute() {
  const pts = [[352, 48, -30], [330, 47.6, -30], [308, 43.8, -30], [286, 35.5, -30], [264, 27, -30.2], [244, 21, -31.2]];
  const plen = () => { let d = 0; for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); return d; };
  const dDive = plen();
  // the slant: over the outer arms at sixteen metres (the arms read as bands under the lens), down to antler height by the rim
  const S = [224, -34.6], thJ = Math.atan2(-S[1], S[0]) + Math.acos(RIM_R / Math.hypot(S[0], S[1])), J = [RIM_R * Math.cos(thJ), -RIM_R * Math.sin(thJ)];
  for (const f of [0, 0.17, 0.34, 0.51, 0.68, 0.85]) pts.push([lerp(S[0], J[0], f), lerp(17, 3.3, smoothstep(0, 1, f)), lerp(S[1], J[1], f)]);
  // rim, outward leg, climb, top, descent, low outward wheel, run along the outer edge: one polar curve r(th), y(th)
  const rOf = (th) => RIM_R + (TOP_R - RIM_R) * smoothstep(TH_A, TH_R1, th) + (RUN_R - TOP_R) * smoothstep(TH_TOP + 14 * D2R, TH_RUN, th);
  const yOf = (th) => { if (th <= TH_TOP) return 3.3 + (TOP_Y - 3.3) * smoothstep(TH_A + 2 * D2R, TH_TOP, th); const e = 1 - smoothstep(TH_TOP, TH_RUN, th), e2 = e * e; return LOW_Y + (TOP_Y - LOW_Y) * e2 * e2; };
  const put = (th) => { const r = rOf(th); pts.push([r * Math.cos(th), yOf(th), -r * Math.sin(th)]); return plen(); };
  const dWheel0 = put(thJ), D = {};
  let th = thJ;
  for (const [tEnd, name] of [[TH_A, 'rim1'], [TH_TOP, 'top'], [TH_LOW, 'low1'], [TH_RUN, 'wheel1'], [TH_S, 'run1']]) {
    const n = Math.max(1, Math.round((tEnd - th) * rOf((th + tEnd) / 2) / 19));
    for (let i = 1; i <= n; i++) D[name] = put(th + (tEnd - th) * i / n);
    th = tEnd;
  }
  // the slide inward from the outer edge: tangential speed eases from 13 m/s toward the animals' own speed at each ring
  let dist = plen(), r = RUN_R, t = 0, acc = 0; const dt = 0.02, V = 13; let dSlide0 = dist;
  while (r > R_IN) {
    const b = smoothstep(0.8, 3.0, t), vt = lerp(V, 0.8 * speedOf(r) * smoothstep(63, 80, r), b), vr = Math.sqrt(Math.max(0, V * V - vt * vt));
    if (b === 0) dSlide0 = dist;
    th += (vt / r) * dt; r -= vr * dt; t += dt; acc += V * dt; dist += V * dt;
    if (acc >= 20 && r > R_IN + 9) { acc = 0; pts.push([r * Math.cos(th), LOW_Y, -r * Math.sin(th)]); }
  }
  const cx = Math.cos(th), cz = -Math.sin(th), dStraight0 = dist;
  for (const rr of [66, 45, 24, 2]) pts.push([rr * cx, lerp(4.4, 2.6, smoothstep(2, 66, rr)), rr * cz]);
  const path = makePath(pts), L = path.length, k = L / (dist + 64);       // rescale marks to the true length
  const mD = dDive * k, m0 = dWheel0 * k, mR = D.rim1 * k, mT = D.top * k, mL = D.low1 * k, m1 = D.wheel1 * k, mS = D.run1 * k, m2 = dSlide0 * k, m3 = dStraight0 * k;
  // 30 m/s down the slope and over the arms, 22 at the rim and up the climb, 15 over the top (the long look down), 20 down
  // again, easing to 14.5 by the outer edge (the run and the slide: a little faster than the animals beside the lens), 12 at
  // the cleft
  const speedAt = (d) => 30 - 8 * smoothstep(m0 - 70, m0 + 8, d) - 7 * smoothstep(mT - 100, mT - 22, d) + 5 * smoothstep(mT + 16, mT + 60, d) - 5.5 * smoothstep(mL - 10, m1 - 30, d) - 2.5 * smoothstep(m3 + 10, L, d);
  const N = 512, tab = new Float32Array(N + 1);
  for (let i = 1; i <= N; i++) tab[i] = tab[i - 1] + (L / N) / speedAt(((i - 0.5) / N) * L);
  const duration = tab[N];
  const clockAt = (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); };
  const pace = (u) => speedAt(clamp(u, 0, 1) * L) / (L / duration);
  return { pts, path, L, duration, clockAt, pace, cleft: [cx, cz], rim: [thJ, TH_A + 0.9],
    marks: { dive1: mD / L, wheel0: m0 / L, rim1: mR / L, top: mT / L, low1: mL / L, wheel1: m1 / L, run1: mS / L, slide0: m2 / L, straight0: m3 / L } };
}

// The feeding craters are drawn by the snow shader from a hashed grid; the same hash here (single precision, so it
// agrees with the shader to about 0.01) tells the world where they are: { x, z, R, sure }.
const frJ = (x) => x - Math.floor(x);
function hash2J(x, y) {
  let qx = frJ(Math.fround(x * 0.1031)), qy = frJ(Math.fround(y * 0.1031)), qz = qx;
  const d = Math.fround(qx * (qy + 33.33) + qy * (qz + 33.33) + qz * (qx + 33.33)); qx += d; qy += d; qz += d;
  return frJ(Math.fround(Math.fround(qx + qy) * Math.fround(qz)));
}
const vn2J = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash2J(ix, iy), b = hash2J(ix + 1, iy), c = hash2J(ix, iy + 1), d = hash2J(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
// The bowls sit on a warped, turned lattice and only where a slow mask says so, so they come in loose clusters with calm
// snow between; sizes vary two to one. CRATER_GLSL below is the same function.
const CR_ROT = [0.891, 0.454], CR_WARP = 1.7;
const crWarp = (x, z) => [CR_WARP * (vn2J(x * 0.13 + 3.7, z * 0.13 + 3.7) - 0.5), CR_WARP * (vn2J(x * 0.13 + 41.3, z * 0.13 + 41.3) - 0.5)];
function craterList() {
  const out = [];
  for (let j = -17; j < 17; j++) for (let i = -17; i < 17; i++) {
    const h = hash2J(i + 9.7, j + 9.7), m = vn2J(i * 0.31 + 17, j * 0.31 + 17); if (h < 0.18 || m < 0.545) continue;
    const R = lerp(0.45, 1.1, hash2J(i + 3.1, j + 3.1)), jit = 2 * Math.max(0, 0.48 - 0.38 * R);
    const u = (i + 0.5 + (hash2J(i, j) - 0.5) * jit) * 4.2, v = (j + 0.5 + (hash2J(i + 7.3, j + 7.3) - 0.5) * jit) * 4.2, rc = Math.hypot(u, v);
    if (rc > 56.5 || rc < 15.5) continue;
    // back from the lattice to the lake: undo the turn, then the warp (fixed point; the warp is gentle)
    const qx = CR_ROT[0] * u + CR_ROT[1] * v, qz = -CR_ROT[1] * u + CR_ROT[0] * v; let x = qx, z = qz;
    for (let k = 0; k < 8; k++) { const w = crWarp(x, z); x = qx - w[0]; z = qz - w[1]; }
    out.push({ x, z, R, sure: h > 0.22 && m > 0.585 });
  }
  return out;
}

// ---------------------------------------------------------------- the trails from the col (the stragglers' lines)
// The five trails GROUND_GLSL prints from the col to the outer arm (trailH there: the same numbers), each in two strands.
// trailXZ(i, strand, s, out): the point s metres down trail i (0..4) from the col, on strand 0 (the main one) or 1.
const TRAIL_O = [331, -8], TR_N = 96, TR_S0 = -42, TR_DS = 3, TR_W = TR_N + 4, TR_ROWS = 10;
function trailXZ(i, strand, s, out) {
  const ez = -104 + 41 * i, ex = Math.sqrt(43260 - ez * ez) - TRAIL_O[0], ey = ez - TRAIL_O[1], len = Math.hypot(ex, ey), dx = ex / len, dz = ey / len;
  let l = -(4.2 * Math.sin(s * 0.043 + i * 2.1) + 1.3 * Math.sin(s * 0.127 + i * 5)) * smoothstep(0, 34, s);
  if (strand) l += 2.2 + 2.4 * Math.sin(s * 0.061 + i * 3.3);
  out[0] = TRAIL_O[0] + dx * s + dz * l; out[1] = TRAIL_O[1] + dz * s - dx * l;
  return out;
}
// The table the shaders read (a float texture, TR_W x TR_ROWS, one row for each strand of each trail): TR_N samples
// (x, height of the ground, z, the ground's slope across the trail) every TR_DS metres from TR_S0, then four texels, one
// for each ring a straggler may join (JOIN_R): (metres down the trail where the trail meets that ring, the ring angle
// there, the ring's radius). ground(x, z) is the land's height (the lake and the hero's snow are 0).
const JOIN_R = [4, 5, 6, 7].map((k) => BULL_R + RING * k);
function trailTable(ground, data, row0 = 0, row1 = TR_ROWS) {
  const q = [0, 0], a = [0, 0], b = [0, 0], gy = (x, z) => (ground ? Math.max(0, ground(x, z)) : 0);
  for (let row = row0; row < row1; row++) {
    const i = row >> 1, st = row & 1;
    for (let k = 0; k < TR_N; k++) {
      const sm = TR_S0 + k * TR_DS; trailXZ(i, st, sm, q); trailXZ(i, st, sm - 0.5, a); trailXZ(i, st, sm + 0.5, b);
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1, nx = tz / tl, nz = -tx / tl, o = (row * TR_W + k) * 4;
      data[o] = q[0]; data[o + 1] = gy(q[0], q[1]); data[o + 2] = q[1]; data[o + 3] = (gy(q[0] + nx, q[1] + nz) - gy(q[0] - nx, q[1] - nz)) / 2;
    }
    // (down the trail the rings are met from the outermost inward: one walk finds all four)
    for (let k = 3, sm = 0; k >= 0; k--) {
      for (; sm < 230; sm += 0.25) { trailXZ(i, st, sm, q); if (Math.hypot(q[0], q[1]) <= JOIN_R[k]) break; }
      const o = (row * TR_W + TR_N + k) * 4; data[o] = sm; data[o + 1] = Math.atan2(-q[1], q[0]); data[o + 2] = JOIN_R[k]; data[o + 3] = 0;
    }
  }
  return data;
}
// Where a straggler is at herd clock t (the same sums as slotFrame in HERD_GLSL): out = [x, y, z, slope across].
// code = (trail * 2 + strand) * 4 + ring, s0 = metres down the trail at clock 0, vT = its pace on the trail.
function trailPos(data, code, s0, vT, t, out) {
  const row = code >> 2, o = (row * TR_W + TR_N + (code & 3)) * 4, sJ = data[o], thJ = data[o + 1], rJ = data[o + 2], tJ = (sJ - s0) / vT;
  const w = smoothstep(tJ - 2.2, tJ + 2.2, t), th = thJ + (speedOf(rJ) / rJ) * (t - tJ);
  const f = clamp((s0 + vT * t - TR_S0) / TR_DS, 0, TR_N - 1.001), k = Math.floor(f), m = f - k, p = (row * TR_W + k) * 4;
  for (let c = 0; c < 4; c++) out[c] = data[p + c] + (data[p + 4 + c] - data[p + c]) * m;
  out[0] += (rJ * Math.cos(th) - out[0]) * w; out[1] *= 1 - w; out[2] += (-rJ * Math.sin(th) - out[2]) * w; out[3] *= 1 - w;
  return out;
}

// Slots: every animal is (ring radius, start angle). Runners are seeded by rejection against a spiral mask
// laid out at clock T_REF, kept 2.9 m apart along their ring and rejected if they ever come within 3.4 m
// of the camera. Returns rows sorted by closest approach (nearest first). F = the named random streams, one for each
// group of animals (escorts, runners, aisle, bowls, rimside, eye, trails, young): no group's draws can move another's.
async function makeSlots(F, noise, route, P, pause) {
  let rng = F.escorts;
  // camera samples for the low part of the flight
  // (from the foot of the dive on; the room an animal must leave round the lens shrinks as the lens rises above the antlers)
  const M = 1300, u0 = route.marks.dive1 - 0.02, sr = [], sth = [], st = [], sy = [], su = [], sc2 = [], v = new THREE.Vector3();
  for (let i = 0; i <= M; i++) {
    const u = u0 + (1 - u0) * (i / M); route.path.pointAt(u, v);
    if (v.y > 14) continue;
    const c = v.y < 3.6 ? 3.4 : v.y < 4.6 ? 3.0 : v.y < 6 ? 2.2 : 0;
    sr.push(Math.hypot(v.x, v.z)); sth.push(Math.atan2(-v.z, v.x)); st.push(route.clockAt(u)); sy.push(v.y); su.push(u); sc2.push(c * c);
    if (i % 260 === 259) await pause();
  }
  const S = sr.length, rows = [], rings = [], nRing = Math.floor((R_OUT - R_IN) / RING) + 1;
  for (let i = 0; i < nRing; i++) rings.push([]);
  const ringS = rings.map((_, k) => { const r = R_IN + k * RING, a = []; for (let j = 0; j < S; j++) if (sc2[j] > 0 && Math.abs(sr[j] - r) < 12) a.push(j); return a; });
  const approach = (k, r, th0, om, out) => {         // min horizontal distance to the lens, and time spent near it
    let best = 1e9, near = 0, bad = 0; const list = ringS[k];
    for (let i = 0; i < list.length; i++) {
      const j = list[i];
      const d2 = r * r + sr[j] * sr[j] - 2 * r * sr[j] * Math.cos(th0 + om * st[j] - sth[j]);
      if (d2 < best) best = d2; if (d2 < sc2[j]) bad = 1; if (d2 < 100) near++;
    }
    out.d = Math.sqrt(Math.max(0, best)); out.near = near; out.bad = bad;
  };
  const wrapPi = (x) => { x %= TAU; return x > Math.PI ? x - TAU : x < -Math.PI ? x + TAU : x; };
  const res = { d: 0, near: 0, bad: 0 }, armN = P.arms, period = P.period, armPhase = P.armPhase, mk = route.marks;
  // room round the lens, against every low sample of the route (0.8 m apart, sorted into one-metre bins of radius): no
  // BODY (a capsule from rump to muzzle along the animal's own heading) comes nearer the lens than 2.2 m while the lens
  // is among the animals (1.8 m, then 1 m, as it rises above the antlers). Runners beside the lens's lane, parallel to
  // it, may therefore trot 3.3 m off; one that crosses its line keeps its muzzle and its rump clear of it.
  const bins = new Map();
  for (let j = 0; j < S; j++) if (sc2[j] > 0) { const b = Math.floor(sr[j]); let l = bins.get(b); if (!l) bins.set(b, l = []); l.push(j); }
  const clearAll = (r, th0, om) => {
    let best = 1e9;
    for (let b = Math.floor(r - 4.5); b <= Math.floor(r + 4.5); b++) {
      const l = bins.get(b); if (!l) continue;
      for (let i = 0; i < l.length; i++) {
        const j = l[i], th = th0 + om * st[j], c = Math.cos(th), sn = Math.sin(th), dx = sr[j] * Math.cos(sth[j]) - r * c, dz = -sr[j] * Math.sin(sth[j]) + r * sn;
        const along = -dx * sn - dz * c, perp = dx * c - dz * sn, da = along - clamp(along, -0.9, 1.37), d = Math.hypot(da, perp) - 0.32;
        if (d < Math.sqrt(sc2[j]) - 1.2) return -1; if (d < best) best = d;
      }
    }
    return best;
  };
  // on the rare visit the white cow runs ahead of the lens: her line is kept free as well
  const cow = [], tg = new THREE.Vector3(), cp = new THREE.Vector3();
  if (P.whiteCow) {
    const uB = (mk.straight0 * route.L - 14.2) / route.L;
    for (let j = 0; j < S; j++) {
      const u = su[j]; if (u <= mk.low1 + 0.005 || u >= uB) continue;
      const sd = Math.min(route.L - 0.5, u * route.L + 6.2 + 60 * (1 - smoothstep(mk.low1 + 0.01, mk.wheel1 - 0.02, u))); route.path.posAtDist(sd, cp); route.path.tangentAtDist(sd, tg); const l = Math.hypot(tg.x, tg.z) || 1;
      const kx = cp.x + tg.z / l * 1.9, kz = cp.z - tg.x / l * 1.9; cow.push(kx, kz, st[j], Math.hypot(kx, kz));
    }
  }
  const cowClear = (r, th0, om) => { for (let j = 0; j < cow.length; j += 4) { if (Math.abs(cow[j + 3] - r) > 2.7) continue; const th = th0 + om * cow[j + 2], dx = r * Math.cos(th) - cow[j], dz = -r * Math.sin(th) - cow[j + 1]; if (dx * dx + dz * dz < 6.8) return false; } return true; };
  await pause();
  // every animal that runs off the ring grid (the young animals' file on BULL_R and all beyond it): [radius, angle at T_REF], so that none is seeded into another
  const outer = [], outerFree = (r, ang) => { for (const q of outer) if (Math.abs(q[0] - r) < 1.7 && Math.abs(wrapPi(q[1] - ang)) * r < 3.4) return false; return true; };
  const uR0 = mk.low1 - 0.014, uR1 = mk.straight0 + 0.012, nSmp = Math.ceil((uR1 - uR0) * route.L / 2.4);
  const river = [0, 0, 0, 0, 0];      // seeded, tried, no room on the ring, the young animals' file, too near the lens
  // ---- the young animals' file: the ring 4.6 m outside the lens's lane along the outer edge (BULL_R, the sun side) carries
  // antlered young animals (young bulls keep their antlers into the spring) nose to tail at the river's own spacing, along
  // the whole stretch of that ring that is ever within 14 m of the lens, from 14 m behind it to 46 m ahead; places and builds
  // by lot (their own stream). The ring is filled first; every other slot then keeps the room of the rule from it (below:
  // 3.4 m along the ring for any animal within 1.7 m of its radius). The lens's own room holds as for every slot.
  if (P.river) {
    const R = F.young, r = BULL_R, om = speedOf(r) / r; let a0 = 1e9, a1 = -1e9, prev = 0, first = true;
    for (let i = 0; i <= nSmp; i++) {
      const u = lerp(uR0, uR1, i / nSmp); route.path.pointAt(u, v);
      if (v.y > 6.5 || Math.abs(Math.hypot(v.x, v.z) - r) > 14) continue;
      let a = Math.atan2(-v.z, v.x) - om * (route.clockAt(u) - T_REF);
      if (first) { first = false; prev = a; } else { a = prev + wrapPi(a - prev); prev = a; }
      if (a < a0) a0 = a; if (a > a1) a1 = a;
    }
    await pause();
    let n = 0;
    if (a1 >= a0) for (let a = a0 - 14 / r; a < a1 + 46 / r; a += (3.25 + 0.75 * R()) / r) {
      const sz = R(), sd = R(), an = R(), tn = R(), th0 = a - om * T_REF;
      const d = clearAll(r, th0, om); if (d < 0 || (cow.length && !cowClear(r, th0, om))) continue;
      outer.push([r, a]); river[3]++;
      rows.push({ r, th: th0, sc: 0.98 + 0.19 * sz, seed: sd, state: 0, ant: 1 + Math.floor(an * 3), tint: tn * 0.9, yaw: 0, d, near: 0, young: 1 });
      if ((++n & 15) === 15) await pause();
    }
  }
  await pause();
  // escorts: animals seeded beside the camera's own lane, so the run and the slide pass through a river of bodies
  for (let j = 0; j < S; j += 5) {
    if (j % 100 === 0) await pause();
    if (sy[j] > 12) continue;
    const inSlide = su[j] > mk.slide0 + 0.01 && su[j] < mk.straight0 - 0.02, inWheel = (su[j] > mk.wheel0 - 0.07 && su[j] < mk.rim1 + 0.04) || (su[j] > mk.low1 - 0.02 && su[j] <= mk.slide0 + 0.01);
    for (let e = 0; e < (inWheel ? 12 : inSlide ? 12 : 5); e++) {
      // (through the slide the nearest row on the inner side keeps 4.8..7 m from the lens's line; nothing rides nearer than four metres)
      const off = (e & 1 ? 1 : -1) * (e < 2 ? (inSlide ? (e === 0 ? rng.range(4.8, 7) : rng.range(4.2, 5.4)) : rng.range(4.0, 6.2)) : e > 4 ? rng.range(4.0, 14) : rng.range(4.6, 9.5 + 1.6 * sy[j])), k = Math.round((sr[j] + off - R_IN) / RING), lat = e > 4 ? rng.range(-4, 30) : rng.range(-9, 14), bull = rng() < 0.08, pale = rng() < P.paleShare, sd = rng(), tn = rng();
      if (k < 0 || k >= nRing) continue;
      const r = R_IN + k * RING, om = speedOf(r) / r, ang = sth[j] + lat / r - om * (st[j] - T_REF), ring = rings[k], gap = 2.9 / r; let ok = true;
      for (let i = 0; i < ring.length; i++) { let d = Math.abs(ring[i] - ang) % TAU; if (d > Math.PI) d = TAU - d; if (d < gap) { ok = false; break; } }
      if (!ok || (r > 194.5 && !outerFree(r, ang))) continue;
      approach(k, r, ang - om * T_REF, om, res);
      if (res.bad) continue;
      ring.push(ang);
      rows.push({ r, th: ang - om * T_REF, sc: bull ? 1.1 : 0.88 + 0.14 * sd, seed: sd, state: 0, ant: bull ? 0 : 1 + Math.floor(tn * 3), tint: (pale ? 1 : 0) + tn * 0.9, yaw: 0, d: res.d, near: res.near });
    }
  }
  await pause();
  rng = F.runners;
  let tries = 0;
  while (rows.length < P.runners + 300 && tries++ < P.runners * 60) {
    if ((tries & 511) === 0) await pause();
    const rr = rng() < 0.08 ? rng.range(R_IN - 1, 80) : Math.sqrt(lerp(R_IN * R_IN, (R_OUT + 3) * (R_OUT + 3), rng())), k = clamp(Math.round((rr - R_IN) / RING), 0, nRing - 1), r = R_IN + k * RING;
    const ang = rng() * TAU, a = ((((ang + armPhase) * armN / TAU + r / period) % 1) + 1) % 1;
    const wob = noise.n2(r * 0.021 + 7, Math.floor((ang + armPhase) * armN / TAU + r / period) * 3.1), frac = 0.5 + 0.07 * wob;   // arm and lane each about half of the period
    const inArm = smoothstep(0, 0.07, a) * smoothstep(frac, frac - 0.07, a) * smoothstep(77, 82, r), rim = smoothstep(80, 75, r) * 0.9, edge = smoothstep(R_OUT + 3, R_OUT - 12, r);
    if (rng() > Math.max(inArm, rim) * (0.35 + 0.65 * edge)) continue;
    const ring = rings[k], gap = 2.9 / r; let ok = true;
    for (let j = 0; j < ring.length; j++) { let d = Math.abs(ring[j] - ang) % TAU; if (d > Math.PI) d = TAU - d; if (d < gap) { ok = false; break; } }
    if (!ok || (r > 194.5 && !outerFree(r, ang))) continue;
    const om = speedOf(r) / r, th0 = ang - om * T_REF;
    approach(k, r, th0, om, res);
    if (res.bad) continue;
    ring.push(ang);
    const bull = rng() < (r > 187 ? 0.5 : 0.06), pale = rng() < P.paleShare, pied = !pale && rng() < 0.035;
    rows.push({ r, th: th0, sc: bull ? rng.range(1.06, 1.18) : rng.range(0.86, 1.02), seed: rng(), state: 0, ant: bull ? 0 : 1 + Math.floor(rng() * 3), tint: (pale ? 1 : pied ? 2 : 0) + rng() * 0.9, yaw: 0, d: res.d, near: res.near });
  }
  await pause();
  // ---- THE STRAGGLERS: late animals trotting down the five trails the herd trod from the col (the lines GROUND_GLSL prints),
  // in file, each trail at its own pace. Each trail holds an equal share of them and each is put by lot inside its own
  // stretch of the trail, from the col to the foot; all move by the herd clock. Where its trail meets the ring it was
  // dealt (JOIN_R: four rings outside the outer arm) a straggler turns onto that ring and runs on with the herd. Rules: 3.7 m
  // from the next on its trail, 3.6 m from any other that has joined its ring, never within 3.6 m of the lens's line where
  // the lens is low. A row holds { r: 800 + code, th: metres down the trail at clock 0, yaw: pace } (code = trail, strand, ring).
  const joined = [];
  if (P.stragglers > 0 && P.trail) {
    const R = F.trails, nS = P.stragglers, per = Math.ceil(nS / 5), T = P.trail, q = [0, 0, 0, 0], pace = [], put = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) pace.push(R.range(4.4, 5.6));
    for (let n = 0; n < nS; n++) {
      const i = n % 5, share = Math.floor(n / 5), lot = R(), strand = R() < 0.36 ? 1 : 0, kRing = Math.floor(R() * 4), sd = R(), tn = R(), sz = R(), an = R(), pale = R() < P.paleShare;
      const row = i * 2 + strand, code = row * 4 + kRing, o = (row * TR_W + TR_N + kRing) * 4, sJ = T[o], thJ = T[o + 1], rJ = T[o + 2], vT = pace[i], om = speedOf(rJ) / rJ;
      let s0 = 4 + (sJ - 10) * (share + 0.12 + 0.76 * lot) / per, ok = false;
      for (let tr = 0; tr < 7 && !ok; tr++, s0 -= 3.7) {
        ok = true;
        for (const s1 of put[i]) if (Math.abs(s1 - s0) < 3.7) { ok = false; break; }
        const angT = thJ + om * (T_REF - (sJ - s0) / vT);
        if (ok) for (const j of joined) if (j[0] === rJ && Math.abs(wrapPi(j[1] - angT)) * rJ < 3.6) { ok = false; break; }
        if (ok) for (let j = 0; j < S; j += 2) { if (!sc2[j]) continue; trailPos(T, code, s0, vT, st[j], q); const dx = q[0] - sr[j] * Math.cos(sth[j]), dz = q[2] + sr[j] * Math.sin(sth[j]); if (dx * dx + dz * dz < 13) { ok = false; break; } }
        if (ok) { put[i].push(s0); joined.push([rJ, angT]); rows.push({ r: 800 + code, th: s0, sc: 0.88 + 0.2 * sz, seed: sd, state: 0, ant: 1 + Math.floor(an * 3), tint: (pale ? 1 : 0) + tn * 0.9, yaw: vT, d: 600 + n, near: 0, trail: 1 }); }
      }
      if ((n & 7) === 7) await pause();
    }
    for (const j of joined) outer.push(j);
  }
  await pause();
  // ---- THE RIVER (round 7: every animal has ONE place on its ring for the whole flight; nothing changes place, nothing
  // is drawn or hidden by a clock). Where the lens comes down from the high pass, runs east along the outer edge and
  // slides inward, the herd itself stands thick round its lane: files 3.4 to 15 m off on both sides and ahead, overlapping
  // flank behind rump (between two rings, half a ring off, an animal runs where both neighbours leave it three metres),
  // the outer files on the sun side so that their long shadows cross the lens's lane, leaders far ahead in the lane itself.
  // The rule is the herd's: these are slots like any other, seeded where the lens will be when it passes; lanes between
  // the arms stay thinner than the arms. No body ever comes nearer the lens's line than the room every slot leaves it
  // (tested against every sample of the low route, 0.8 m apart).
  if (P.river) {
    let rq = (Math.floor(Math.abs(P.armPhase) * 1e5) ^ 0x7f4a7c15) >>> 0;
    const rv = () => { rq = (rq + 0x6d2b79f5) | 0; let t = Math.imul(rq ^ (rq >>> 15), 1 | rq); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const omOf = (r) => speedOf(r) / r, occ = new Map(), okey = (r) => Math.round(r * 10);
    outer.length = 0; for (const j of joined) outer.push(j);
    const note = (r, ang) => { const k = okey(r); let l = occ.get(k); if (!l) occ.set(k, l = []); l.push(ang); if (r > 194.5) outer.push([r, ang]); };
    for (const s of rows) if (s.state === 0 && s.r < 800) note(s.r, s.th + omOf(s.r) * T_REF);
    const room = (r, ang, th0, om, td) => {
      const list = occ.get(okey(r));
      if (list) for (let j = 0; j < list.length; j++) if (Math.abs(wrapPi(list[j] - ang)) * r < 3.0) return false;
      if (r > 194.5) return outerFree(r, ang);
      for (const dr of [-RING / 2, RING / 2]) {
        const l2 = occ.get(okey(r + dr)); if (!l2) continue;
        const a2 = th0 + om * td - omOf(r + dr) * (td - T_REF);
        for (let j = 0; j < l2.length; j++) if (Math.abs(wrapPi(l2[j] - a2)) * r < 3.1) return false;
      }
      return true;
    };
    await pause();
    // ---- the files beside the lens's lane. On every ring that lies within ten metres of the lens's line, either side, as
    // it passes (from four metres behind it to thirty-six ahead), the herd runs closed up: nose to tail, three to four
    // metres from one animal to the next, every one fitted against the neighbour already on its ring. The two files next
    // to the lane are full, the next are four fifths full, the outer ones thinner (and thinner still where a lane of the
    // spiral crosses); the lens's own ring is filled as well, so that rumps run straight ahead of it wherever the lens
    // never reaches them. A place on a ring is tried once for each of the five distances; the same rules as for every slot
    // hold (room on the ring and the half-rings, the lens's own room at every sample of the low route).
    {
      const LANES = [3.3, 5.5, 7.7, 9.9, 0], KEEP = [1, 0.84, 0.62, 0.42, 0.9], seen = new Set();
      const h01 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
      // the angle nearest to `ang` on ring r that leaves `gap` metres to the neighbours behind and ahead (NaN: no such place)
      const fit = (r, ang, gap) => {
        const list = occ.get(okey(r)); let lo = -1e9, hi = 1e9;
        if (list) for (let j = 0; j < list.length; j++) { const d = wrapPi(list[j] - ang) * r; if (d <= 0) { if (d > lo) lo = d; } else if (d < hi) hi = d; }
        if (hi - lo < 2 * gap) return NaN;
        return ang + (lo > -gap ? gap + lo : hi < gap ? hi - gap : 0) / r;
      };
      for (let i = 0; i <= nSmp; i++) {
        await pause();
        const u = lerp(uR0, uR1, i / nSmp), td = route.clockAt(u); route.path.pointAt(u, v); route.path.tangentAt(u, tg);
        if (v.y > 6.5) continue;
        const hl = Math.hypot(tg.x, tg.z) || 1, hx = tg.x / hl, hz = tg.z / hl;
        for (let a = 0; a < 9; a++) {
          const li = a >> 1, l = (a & 1 ? -1 : 1) * LANES[li];
          for (let fw = -4; fw <= 36; fw += 1.6) {
            const x = v.x + hx * fw + hz * l, z = v.z + hz * fw - hx * l, th = Math.atan2(-z, x); let r = Math.hypot(x, z);
            if (r > BULL_R - 1.1) r = BULL_R + RING * Math.max(0, Math.round((r - BULL_R) / RING)); else r = R_IN + RING * Math.round((r - R_IN) / RING);
            if (r < R_IN - 0.1 || r > BULL_R + 5.2 * RING) continue;
            const om = omOf(r), angT = th - om * (td - T_REF), site = Math.round(angT * r / 1.6), key = (okey(r) * 4096 + (((site % 4096) + 4096) % 4096)) * 8 + li;
            if (seen.has(key)) continue;
            seen.add(key);
            const arm = ((((angT + armPhase) * armN / TAU + r / period) % 1) + 1) % 1, lane = arm > 0.5 && r < R_OUT;
            if (h01(site, r) > KEEP[li] * (lane && li > 1 && li < 4 ? 0.5 : 1)) continue;
            river[1]++;
            const ang = fit(r, angT, 3.05 + 0.85 * h01(site + 0.5, r));
            if (!(ang === ang)) { river[2]++; continue; }
            const th0 = ang - om * T_REF;
            if (!room(r, ang, th0, om, td)) { river[2]++; continue; }
            const d = clearAll(r, th0, om); if (d < 0 || (cow.length && !cowClear(r, th0, om))) { river[4]++; continue; }
            note(r, ang); river[0]++;
            // (as in the river below: the big bare-headed bulls on the outside, the antlered cows and young animals next to the lens)
            const q5 = h01(site, r + 1), w = h01(site, r + 2), sd = h01(site, r + 3), tn = h01(site, r + 4), bare = q5 < (r > BULL_R + 2.5 * RING ? 0.55 : 0.04), pale = w < P.paleShare, pied = !pale && w > 0.965;
            rows.push({ r, th: th0, sc: bare ? 1.06 + 0.1 * sd : 0.87 + 0.15 * sd, seed: sd, state: 0, ant: bare ? 0 : 1 + Math.floor(tn * 3), tint: (pale ? 1 : pied ? 2 : 0) + tn * 0.9, yaw: 0, d, near: 0 });
          }
        }
      }
    }
    await pause();
    for (let i = 0; i <= nSmp; i++) {
      if ((i & 3) === 3) await pause();
      const u = lerp(uR0, uR1, i / nSmp), td = route.clockAt(u); route.path.pointAt(u, v); route.path.tangentAt(u, tg);
      if (v.y > 6.5) continue;
      const hl = Math.hypot(tg.x, tg.z) || 1, hx = tg.x / hl, hz = tg.z / hl, run = u < mk.slide0 + 0.004;
      for (let e = 0; e < (run ? P.riverTries[0] : P.riverTries[1]); e++) {
        const q1 = rv(), q2 = rv(), q3 = rv(), q4 = rv(); let l, fw;
        if (q1 < 0.06) { l = (q2 - 0.5) * 2.2; fw = 18 + 46 * q3; }                                  // leaders in the lens's own lane, far ahead
        else { const sg = q1 < 0.53 ? 1 : -1; l = sg * (2.9 + (run && sg < 0 ? 20 : 12) * Math.pow(q2, 1.5)); fw = run ? -5 + 52 * q3 : -6 + 40 * q3; }      // l > 0: the inner side
        const x = v.x + hx * fw + hz * l, z = v.z + hz * fw - hx * l, th = Math.atan2(-z, x), al = Math.abs(l); let r = Math.hypot(x, z);
        if (r > BULL_R - 1.1) r = BULL_R + RING * Math.max(0, Math.round((r - BULL_R) / RING));
        else { const stp = al < 10.5 ? RING / 2 : RING; r = R_IN + stp * Math.round((r - R_IN) / stp); }
        if (r < R_IN - 0.1 || r > BULL_R + 9.2 * RING) continue;
        const om = omOf(r), th0 = th - om * td, ang = th0 + om * T_REF;
        // inside an arm the river runs full; across a lane it thins (the lanes stay open, seen from above), but for the files next to the lens
        const a = ((((ang + armPhase) * armN / TAU + r / period) % 1) + 1) % 1, lane = a > 0.5 && r < R_OUT;
        if (q4 > (al < 7.5 ? 0.95 : al < 11 ? 0.7 : 0.45) * (lane && al > 5.5 ? (al < 9.5 ? 0.7 : 0.4) : 1)) continue;
        river[1]++;
        if (!room(r, ang, th0, om, td)) { river[2]++; continue; }
        const d = clearAll(r, th0, om); if (d < 0 || (cow.length && !cowClear(r, th0, om))) { river[4]++; continue; }
        note(r, ang); river[0]++;
        // the big bulls, bare-headed, run on the outside; the antler forest belongs to the cows and the young animals nearer the lens
        const q5 = rv(), w = rv(), sd = rv(), tn = rv(), bare = q5 < (r > BULL_R + 2.5 * RING ? 0.55 : 0.04), pale = w < P.paleShare, pied = !pale && w > 0.965;
        rows.push({ r, th: th0, sc: bare ? 1.06 + 0.1 * sd : 0.87 + 0.15 * sd, seed: sd, state: 0, ant: bare ? 0 : 1 + Math.floor(tn * 3), tint: (pale ? 1 : pied ? 2 : 0) + tn * 0.9, yaw: 0, d, near: 0 });
      }
    }
    await pause();
  }
  // the eye: cows and calves, never translating. First the aisle: two rows either side of the last straight,
  // the inner one 4.6..5.8 m from the lens (calves lying, cows standing or pawing), then the rest of the eye.
  const [cx, cz] = route.cleft, eye = [];
  const eyePut = (x, z, calf, state, yaw, d, tint, R = rng, rMax = 59.5, clear = 4.4, gap2 = 7.3) => {
    const r = Math.hypot(x, z); if (r < 16.5 || r > rMax) return false;
    if (route.path.nearestXZ(x, z).dist < clear) return false;
    for (const c of P.craters) if ((c.x - x) * (c.x - x) + (c.z - z) * (c.z - z) < (c.R + 0.45) * (c.R + 0.45)) return false;      // nobody stands in a bowl
    for (const e of eye) if ((e.x - x) * (e.x - x) + (e.z - z) * (e.z - z) < gap2) return false;
    eye.push({ x, z }); const pale = R() < P.paleShare;
    rows.push({ r, th: Math.atan2(-z, x), sc: calf ? R.range(0.7, 0.78) : R.range(0.92, 1.02), seed: R(), state, ant: calf ? 4 : 1 + Math.floor(R() * 3), tint: tint ?? ((pale ? 1 : 0) + R() * 0.9), yaw, d, near: 0 });
    return true;
  };
  const facing = (side, turn) => Math.atan2(side * cz * Math.cos(turn) + cx * Math.sin(turn), -side * cx * Math.cos(turn) + cz * Math.sin(turn));   // toward the aisle, turned by `turn`
  if (P.whiteCow) {      // the second white cow: standing in the mouth of the cleft, on the sunlit side, watching us come
    const al = 10.6, la = 6.1, x = cx * al - cz * la, z = cz * al + cx * la; eye.push({ x, z });
    rows.push({ r: Math.hypot(x, z), th: Math.atan2(-z, x), sc: 1.04, seed: 0.61, state: 1, ant: 1, tint: 3.5, yaw: Math.atan2(cx * 0.9 + cz * 0.44, cz * 0.9 - cx * 0.44), d: 3.6, near: 0 });
  }
  rng = F.aisle;
  for (let i = 0; i < 14; i++) for (const side of [-1, 1]) {
    const al = 15.5 + i * 2.95 + rng.range(-0.3, 0.3) + (side > 0 ? 1.4 : 0), calf = ((i + (side > 0 ? 1 : 0)) & 1) === 1;
    const la = side * (calf ? rng.range(4.6, 5.1) : rng.range(4.7, 5.4)), q = rng();
    const yaw1 = facing(side, rng.range(-1.7, 1.7));
    for (const da of [0, 0.85, -0.85, 1.5]) if (eyePut(cx * (al + da) - cz * la, cz * (al + da) + cx * la, calf, calf ? (q < 0.45 ? 2 : 1) : (q < 0.4 ? 3 : 1), yaw1, 3.5 + Math.abs(la) * 0.01)) break;
    const al2 = al + 1.5, la2 = side * rng.range(8.0, 10.4), q2 = rng(), yaw2 = facing(side, rng.range(-2.4, 2.4));
    for (const da of [0, 0.9, -0.9]) if (eyePut(cx * (al2 + da) - cz * la2, cz * (al2 + da) + cx * la2, q2 < 0.3, q2 < 0.3 ? 2 : q2 < 0.6 ? 3 : 1, yaw2, 8)) break;
  }
  // cows pawing at the lip of a bowl, head down into it: every cluster of craters has its animals
  rng = F.bowls;
  for (let i = 0; i < P.craters.length; i++) {
    const c = P.craters[i]; if (!c.sure || rng() < 0.42) continue;
    const a = rng() * TAU, dd = c.R + 0.95, x = c.x + Math.cos(a) * dd, z = c.z + Math.sin(a) * dd, al = x * cx + z * cz, la = Math.abs(-x * cz + z * cx);
    if (al > 0 && la < 11) continue;
    eyePut(x, z, false, 3, Math.atan2(c.x - x, c.z - z), Math.max(Math.hypot(x, z), 20));
  }
  // the side of the eye that the lens rides past (north round to west): cows and calves near the rim, so that the quiet
  // centre is peopled when it is looked across from the ring
  rng = F.rimside;
  for (let i = 0, t = 0; i < 46 && t < 1200; t++) {
    const th = route.rim[0] - 0.15 + rng() * (route.rim[1] - route.rim[0] + 0.55), rr = rng.range(40, 59), calf = rng() < 0.35, q = rng();
    if (eyePut(rr * Math.cos(th), -rr * Math.sin(th), calf, calf ? (q < 0.6 ? 2 : 1) : (q < 0.25 ? 2 : q < 0.5 ? 3 : 1), rng() * TAU, Math.max(RIM_R - rr, 6))) i++;
  }
  rng = F.eye; tries = 0;
  while (eye.length < P.eye + 46 && tries++ < P.eye * 80) {
    const a = rng() * TAU, rr = Math.sqrt(lerp(17 * 17, 58 * 58, rng())), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const al = x * cx + z * cz, la = Math.abs(-x * cz + z * cx);
    if (al > 0 && la < 11) continue;
    if (Math.abs(x) < 16 && z < -8 && z > -52 && rng() < 0.7) continue;            // fewer in the boulder's shadow
    const calf = rng() < 0.2, q = rng();
    eyePut(x, z, calf, calf ? (q < 0.55 ? 2 : 1) : (q < 0.2 ? 2 : q < 0.4 ? 3 : 1), rng() * TAU, Math.max(rr, 20));
  }
  // ---- the aisle, out to the rim of the eye (round 7): along the whole last straight, from where the lens leaves the last
  // walkers to the mouth of the cleft, cows and calves stand, lie and paw within 4.5 to 12 m on both sides: a kerb of
  // animals lying, an inner row of cows and calves standing and pawing, a second row of cows, a third further out. They are turned away from the aisle's mouth, so the
  // lens comes on them from behind and beside. Every bowl beside the aisle has a cow pawing at its lip. (Its own random
  // numbers; places already taken are left as they are.)
  {
    let aq = (Math.floor(Math.abs(P.armPhase) * 1e5) ^ 0x3c6ef372) >>> 0;
    const av = () => { aq = (aq + 0x6d2b79f5) | 0; let t = Math.imul(aq ^ (aq >>> 15), 1 | aq); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    av.range = (a, b) => a + (b - a) * av();
    const inward = (turn) => { const c = Math.cos(turn), sn = Math.sin(turn); return Math.atan2(-cx * c + cz * sn, -cx * sn - cz * c); };      // toward the erratic, turned by `turn`
    for (const c of P.craters) {
      if (!c.sure) continue;
      const al = c.x * cx + c.z * cz, la = -c.x * cz + c.z * cx; if (al < 14 || al > 63 || Math.abs(la) < 3.2 || Math.abs(la) > 12.5) continue;
      const sd = la > 0 ? 1 : -1, dx = -cz * sd * 0.8 + cx * 0.6, dz = cx * sd * 0.8 + cz * 0.6, px = c.x + dx * (c.R + 0.95), pz = c.z + dz * (c.R + 0.95);
      eyePut(px, pz, false, 3, Math.atan2(c.x - px, c.z - pz), 5, undefined, av, 64.3);
    }
    for (let al = 14; al < 64.4; al += 1.45) for (const side of [-1, 1]) for (let band = 0; band < 4; band++) {
      const q = av(), q2 = av(), q3 = av(), q4 = av(), q5 = av();
      if ((band === 0 && q5 > 0.5) || (band === 3 && q5 > 0.62)) continue;
      // the kerb: animals lying 3.7 to 4.5 m from the lens's line, half a metre high, under the lens as it passes above them
      const la = side * (band === 0 ? 3.7 + 0.8 * q : band === 1 ? 4.6 + 1.3 * q : band === 2 ? 6.5 + 1.9 * q : 9 + 3.6 * q), a2 = al + (q2 - 0.5) * 1.2, calf = band === 0 ? q3 < 0.7 : band === 1 ? q3 < 0.36 : q3 < 0.3;
      const state = band === 0 ? 2 : calf ? (q4 < 0.3 ? 2 : 1) : (q4 < 0.12 ? 2 : q4 < 0.4 ? 3 : 1);
      eyePut(cx * a2 - cz * la, cz * a2 + cx * la, calf, state, inward((q5 - 0.5) * 2.6), 3.6 + band, undefined, av, 64.3, band === 0 ? 3.6 : 4.4, band === 0 ? 4.2 : 5.3);
    }
  }
  // the lucky white cow that leads the camera down the slide: not on a ring, driven by uniforms (iA.x > 900 marks her)
  if (P.whiteCow) rows.push({ r: 999, th: 0, sc: 1.04, seed: 0.37, state: 0, ant: 1, tint: 3.5, yaw: 0, d: 0, near: 0 });
  await pause();
  // ---- the lens's room, held for every runner alike and along the whole low route (the samples 0.8 m apart and the points
  // midway between them): no body (a capsule from rump to muzzle, of the animal's own size, along its own heading) is ever
  // nearer the lens's line in plan than 2.2 m while the lens is among the animals (1.8 m, then 1 m, as it rises above the
  // antlers). A runner that would come nearer is not part of the herd.
  {
    const bins = new Map(), lx = new Float32Array(S), lz = new Float32Array(S);
    for (let j = 0; j < S; j++) { lx[j] = sr[j] * Math.cos(sth[j]); lz[j] = -sr[j] * Math.sin(sth[j]); if (sc2[j] > 0) { const b = Math.floor(sr[j]); let l = bins.get(b); if (!l) bins.set(b, l = []); l.push(j); } }
    let out = 0, n = 0;
    for (const s of rows) {
      if (s.state !== 0 || s.r > 800 || s.d > 5) continue;
      if ((++n & 31) === 0) await pause();
      const om = speedOf(s.r) / s.r, a0 = -0.9 * s.sc, a1 = 1.37 * s.sc; let bad = false;
      for (let b = Math.floor(s.r - 5); b <= Math.floor(s.r + 5) && !bad; b++) {
        const l = bins.get(b); if (!l) continue;
        for (let i = 0; i < l.length && !bad; i++) {
          const j = l[i], need = Math.sqrt(sc2[j]) - 1.2, j2 = j + 1 < S && su[j + 1] - su[j] < 0.002 ? j + 1 : j;
          for (let h = 0; h < (j2 === j ? 1 : 2); h++) {
            const f = h * 0.5, t = st[j] + (st[j2] - st[j]) * f, th = s.th + om * t, c = Math.cos(th), sn = Math.sin(th);
            const dx = lx[j] + (lx[j2] - lx[j]) * f - s.r * c, dz = lz[j] + (lz[j2] - lz[j]) * f + s.r * sn, along = -dx * sn - dz * c, perp = dx * c - dz * sn;
            if (Math.hypot(along - clamp(along, a0, a1), perp) - 0.32 < need) { bad = true; break; }
          }
        }
      }
      if (bad) { s.out = 1; out++; }
    }
    if (out) { const keep = rows.filter((s) => !s.out); rows.length = 0; for (const s of keep) rows.push(s); }
    river.push(out);
  }
  await pause();
  rows.sort((a, b) => a.d - b.d);
  rows.eyeSpots = eye; rows.river = river;
  return rows;
}

// ---------------------------------------------------------------- reindeer geometry (three tiers)
// Local animal space: +Z forward, +Y up, metres for an animal 1.15 m at the shoulder.
// aAnim = (trot phase | neck weight, distance down the leg 0..1 | tine flag, part, walk phase)
//   part: 0 body, 1 leg, 2 neck/head, 3 tail, 5 ear, 6 antler.   aPivot = hip / pedicle / ear root.   aGlow = fur mask.
const NECK = [0, 0.95, 0.5];
const LEGS = [   // x, pivot y, z, trot phase, walk phase
  [-0.125, 0.86, 0.40, 0.0, 0.25], [0.125, 0.86, 0.40, 0.5, 0.75], [-0.13, 0.90, -0.50, 0.5, 0.0], [0.13, 0.90, -0.50, 0.0, 0.5]];

function reindeerGeometry(tier, C) {
  const g = new Geo(), mixc = (a, b, t) => a.clone().lerp(b, t);
  const neckW = (z) => clamp((z - NECK[2]) / 0.28, 0, 1);
  if (tier === 2) {
    // far prism: rump tip, hip ring, shoulder ring, nose; 4 leg spikes; 2 antler spikes (22 triangles)
    const rt = g.v(0, 0.95, -0.8, C.rump), nose = g.v(0, 1.0, 1.26, C.face);
    const ring = (z, top, bot, w, cTop, cSide, cBot) => [g.v(0, top, z, cTop), g.v(-w, (top + bot) * 0.52, z, cSide), g.v(0, bot, z, cBot), g.v(w, (top + bot) * 0.52, z, cSide)];
    const a = ring(-0.5, 1.1, 0.6, 0.26, C.coat, C.flank, C.belly), b = ring(0.44, 1.15, 0.5, 0.25, mixc(C.coat, C.ruff, 0.5), mixc(C.flank, C.ruff, 0.35), mixc(C.belly, C.ruff, 0.6));
    for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; g.tri(rt, a[j1], a[j]); g.quad(a[j], a[j1], b[j1], b[j]); g.tri(b[j], b[j1], nose); }
    g.anim([b[0], b[3] + 1], () => [0.25, 0, 2, 0]); g.anim([nose, nose + 1], () => [1, 0, 2, 0]);
    for (const [x, py, z, tp, wp] of LEGS) {
      const s = g.n; g.v(x, py * 0.72, z - 0.08, C.leg); g.v(x, py * 0.72, z + 0.08, C.leg); g.v(x, 0, z, C.leg); g.tri(s, s + 1, s + 2);
      g.anim([s, s + 3], (px, y) => [tp, 1 - y / py, 1, wp]); g.pivot([s, s + 3], x, py, z);
    }
    for (const sx of [-1, 1]) { const s = g.n; g.v(sx * 0.05, 1.2, 0.98, C.horn); g.v(sx * 0.12, 1.24, 0.8, C.horn); g.v(sx * 0.4, 1.95, 0.84, C.horn); g.tri(s, s + 1, s + 2);
      g.anim([s, s + 3], () => [1, 0, 6, 0]); g.pivot([s, s + 3], sx * 0.06, 1.2, 0.93); }
    return g.build();
  }
  const hi = tier === 0, lo = tier === 3, sides = hi ? 12 : lo ? 6 : 8;       // tier 3: a lighter middle tier for the 15..30 m ring
  // torso: rump, croup, barrel, deep chest
  const rows = hi
    ? [[-0.85, 0.9, 0, 0], [-0.825, 0.9, 0.065, 0.095], [-0.76, 0.895, 0.145, 0.18], [-0.64, 0.885, 0.222, 0.248], [-0.47, 0.875, 0.262, 0.27], [-0.25, 0.885, 0.234, 0.236], [0.0, 0.86, 0.26, 0.275], [0.25, 0.835, 0.268, 0.325], [0.43, 0.85, 0.232, 0.33], [0.57, 0.885, 0.165, 0.245], [0.7, 0.91, 0, 0]]
    : lo ? [[-0.84, 0.9, 0, 0], [-0.66, 0.885, 0.2, 0.235], [-0.24, 0.88, 0.24, 0.245], [0.3, 0.84, 0.262, 0.32], [0.56, 0.875, 0.17, 0.25], [0.7, 0.9, 0, 0]]
    : [[-0.84, 0.9, 0, 0], [-0.72, 0.89, 0.17, 0.2], [-0.32, 0.88, 0.25, 0.25], [0.28, 0.835, 0.266, 0.322], [0.56, 0.88, 0.17, 0.245], [0.7, 0.905, 0, 0]];
  const body = g.loft(rows.map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides, top: C.coat, belly: C.belly, shade: [-0.8, -0.25] });
  // the big muscles over the tops of the legs (full detail only): haunch and shoulder stand proud of the barrel
  if (hi) for (const sx of [-1, 1]) {
    g.blob(sx * 0.165, 0.775, -0.47, 0.112, 0.245, 0.215, C.coat, C.belly, 6, 3);
    g.blob(sx * 0.15, 0.765, 0.385, 0.098, 0.235, 0.175, C.coat, C.belly, 6, 3);
  }
  const trunk = [body[0], g.n];
  g.glow(trunk, 1);
  // (the white rump patch is drawn by the fragment shader from the rest position: soft-edged, irregular, onto the haunch)
  g.paint(trunk, (x, y, z, c) => {
    const h = (y - 0.55) / 0.6;
    if (h > 0.12 && h < 0.5) c.lerp(C.flank, 0.75 * smoothstep(0.12, 0.25, h) * smoothstep(0.5, 0.36, h));     // dark flank stripe
    c.lerp(C.ruff, 0.8 * smoothstep(0.4, 0.6, z) * smoothstep(1.12, 0.8, y));                                  // cream chest and point of the shoulder
    c.lerp(C.ruff, 0.3 * smoothstep(0.66, 0.58, y) * smoothstep(-0.5, -0.2, z));                               // paler belly line
    c.multiplyScalar(0.86 + 0.14 * smoothstep(0.6, 1.1, y));
  });
  // legs: straight in the rest pose, posed by two-bone IK in the vertex shader
  for (const [x, py, z, tp, wp] of LEGS) {
    const front = z > 0, th = front ? 1 : 1.3, kz = front ? 0.012 : -0.03;
    const ys = hi ? [1, 0.8, 0.5, 0.42, 0.2, 0.085, 0.04, 0] : lo ? [1, 0.45, 0] : [1, 0.45, 0.08, 0];
    const rs = hi ? [0.085 * th, 0.07 * th, 0.043, 0.047, 0.03, 0.036, 0.058, 0.064] : lo ? [0.08 * th, 0.048, 0.056] : [0.08 * th, 0.046, 0.036, 0.062];
    const r = g.tube(ys.map((f) => [x, py * f, z + (f > 0.3 && f < 0.6 ? kz : 0) + (f < 0.05 ? 0.02 : 0)]), rs, hi ? 5 : 3, C.leg, C.leg);
    if (hi) { const s = g.n, c0 = g.v(x, 0, z + 0.02, C.hoof); for (let j = 0; j < 5; j++) g.tri(c0, s - 5 + j, s - 5 + (j + 1) % 5); }
    g.anim([r[0], g.n], (px, y) => [tp, clamp(1 - y / py, 0, 1), 1, wp]); g.pivot([r[0], g.n], x, py, z); g.glow([r[0], g.n], (px, y) => (y > 0.1 ? 1 : 0));
    g.paint([r[0], g.n], (px, y, pz, c) => { if (y < 0.05) c.copy(C.hoof); else if (y < 0.2) c.lerp(C.ruff, 0.5 * smoothstep(0.2, 0.1, y)); else if (y > 0.55) c.lerp(C.flank, smoothstep(0.55, 0.8, y)); });
  }
  // neck: low and forward, deep at the throat
  const n0 = g.n, nP = hi ? [[0, 0.93, 0.44], [0, 0.98, 0.62], [0, 1.03, 0.8], [0, 1.08, 0.95], [0, 1.1, 1.02]] : lo ? [[0, 0.93, 0.44], [0, 1.09, 1.0]] : [[0, 0.93, 0.44], [0, 1.0, 0.72], [0, 1.09, 1.0]];
  const neck = g.tube(nP, hi ? [0.2, 0.165, 0.13, 0.105, 0.09] : lo ? [0.2, 0.095] : [0.2, 0.14, 0.09], hi ? 8 : lo ? 4 : 5, mixc(C.coat, C.ruff, 0.8), mixc(C.coat, C.ruff, 0.55), { flatten: 0.72 });
  g.glow(neck, 1);
  // head: long, held level, dark face and pale muzzle
  const hp = 0.3, ch = Math.cos(hp), sh = Math.sin(hp), h0 = g.n;
  const hrows = hi ? [[-0.1, 0.0, 0, 0], [-0.04, 0.0, 0.085, 0.095], [0.1, 0.0, 0.092, 0.1], [0.24, -0.015, 0.066, 0.075], [0.34, -0.025, 0.056, 0.06], [0.385, -0.03, 0, 0]]
    : [[-0.08, 0.0, 0, 0], [0.04, 0.0, 0.09, 0.1], [0.3, -0.02, 0.058, 0.064], [0.385, -0.03, 0, 0]];
  const head = g.loft(hrows.map(([z, y, rx, ry]) => ({ z, y, rx, ry })), { sides: hi ? 8 : lo ? 4 : 5, top: C.face, belly: mixc(C.face, C.ruff, 0.5) });
  g.paint(head, (x, y, z, c) => { c.lerp(C.ruff, 0.7 * smoothstep(0.27, 0.34, z)); if (z > (hi ? 0.33 : 0.365) && (y < 0.03 || z > 0.365)) c.copy(C.hoof); if (hi && z > 0.05 && z < 0.12 && Math.abs(x) > 0.07 && y > 0) c.copy(C.hoof); });
  g.glow(head, (x, y, z) => (z < 0.3 ? 1 : 0));
  g.move([h0, g.n], (p) => { const y = p.y * 1.15, z = p.z * 1.12; p.x *= 1.15; p.y = y * ch - z * sh + 1.13; p.z = y * sh + z * ch + 1.0; });
  for (const sx of [-1, 1]) {
    // ears
    if (!lo) {
    const e = g.fan([[sx * 0.075, 1.2, 0.97], [sx * 0.2, 1.27, 0.9], [sx * 0.15, 1.2, 0.93]], C.coat, mixc(C.coat, C.ruff, 0.4));
    g.anim(e, (x) => [1, clamp((Math.abs(x) - 0.075) / 0.12, 0, 1), 5, 0]); g.pivot(e, sx * 0.075, 1.2, 0.97);
    }
    // antlers: a C-shaped beam sweeping back, up and forward, with brow, bez, rear and crown tines
    const a0 = g.n, B = [[sx * 0.06, 1.2, 0.93], [sx * 0.17, 1.42, 0.76], [sx * 0.3, 1.68, 0.7], [sx * 0.37, 1.87, 0.8], [sx * 0.34, 1.98, 0.97]];
    const tines = [[B[0], [sx * 0.05, 1.27, 1.12], [sx * 0.02, 1.36, 1.24]], [B[1], [sx * 0.22, 1.5, 0.95], [sx * 0.2, 1.6, 1.06]], [B[2], [sx * 0.36, 1.7, 0.52], null], [B[3], [sx * 0.47, 1.99, 0.72], null], [B[3], [sx * 0.3, 2.02, 0.84], null], [B[4], [sx * 0.22, 2.06, 1.1], null]];
    if (hi) {
      g.tube(B, [0.034, 0.03, 0.025, 0.02, 0.006], 4, C.horn, C.hornTip);
      for (const [p, q, q2] of tines) { const tr = g.tube(q2 ? [p, q, q2] : [p, q], q2 ? [0.021, 0.018, 0.004] : [0.019, 0.004], 3, C.horn, C.hornTip); g.anim(tr, () => [0, 1, 0, 0]); }
    } else {
      const off = (p, w) => [p[0] + sx * w * 0.5, p[1] - w * 0.3, p[2] + w];
      const Bs = lo ? [B[0], B[2], B[4]] : B;
      g.strip(Bs, Bs.map((p, i) => off(p, 0.075 * (1 - i / (Bs.length - 0.6)))), C.horn, C.hornTip);
      for (const [p, q, q2] of tines.slice(0, lo ? 3 : 5)) { const s = g.n; g.v(p[0], p[1] - 0.035, p[2], C.horn); g.v(p[0], p[1] + 0.035, p[2] + 0.035, C.horn); const tp = q2 || q; g.v(tp[0], tp[1], tp[2], C.hornTip); g.tri(s, s + 1, s + 2); }
    }
    g.anim([a0, g.n], (x, y, z, i) => [1, g.a[i * 4 + 1], 6, 0]); g.pivot([a0, g.n], sx * 0.06, 1.2, 0.93);
  }
  // ruff and throat mane: layered cream fin cards under the neck
  const fin = (th, drop, c) => { const top = [], bot = [], n = hi ? 4 : 2; for (let i = 0; i <= n; i++) { const t = i / n, z = 0.5 + t * 0.48, y = 0.84 + t * 0.2, d = drop * Math.sin((0.25 + 0.75 * t) * Math.PI) * (1 - 0.3 * t); top.push([Math.sin(th) * 0.07, y, z]); bot.push([Math.sin(th) * (0.07 + d * 0.5), y - d * Math.cos(th), z - d * 0.25]); }
    const r = g.strip(top, bot, mixc(C.ruff, C.coat, 0.2), c); g.glow(r, 1); };
  fin(0, 0.26, C.ruff); if (hi) { fin(0.6, 0.2, C.ruff); fin(-0.6, 0.2, C.ruff); }
  if (!lo) { const mb = g.blob(0, 0.83, 0.7, hi ? 0.115 : 0.105, 0.2, 0.21, mixc(C.ruff, C.coat, 0.12), C.ruff, hi ? 6 : 5, hi ? 4 : 3); g.glow(mb, 1); }
  // everything from the neck up nods about the neck base
  for (let i = n0; i < g.n; i++) { if (g.a[i * 4 + 2] === 0) { g.a[i * 4 + 2] = 2; g.a[i * 4] = neckW(g.p[i * 3 + 2]); } }
  // tail: short white flag
  const t0 = g.fan([[0, 1.0, -0.78], [0.045, 0.93, -0.86], [0, 0.84, -0.9], [-0.045, 0.93, -0.86]], C.rump, C.rump);
  g.anim(t0, (x, y) => [0, clamp((1.0 - y) / 0.16, 0, 1), 3, 0]); g.pivot(t0, 0, 1.0, -0.78);
  return g.build();
}

// base geometry -> instanced geometry with per-slot attributes iA (r, theta0, scale, seed), iB (state, antler, tint, yaw)
function instanced(base, rows, from, to) {
  const g = new THREE.InstancedBufferGeometry(), n = to - from, A = new Float32Array(n * 4), B = new Float32Array(n * 4);
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (let i = 0; i < n; i++) { const s = rows[from + i]; A.set([s.r, s.th, s.sc, s.seed], i * 4); B.set([s.state, s.ant, s.tint, s.yaw], i * 4); }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 360);
  return g;
}

// ---------------------------------------------------------------- shaders
// Shared by animals, shadow cards and sprites: where a slot is at a given clock, and its gait.
// THE FAR HERD, one rule (round 8): how far an animal is from the lens, 0 at 110 m to 1 at 380 m, wherever the lens is
// and whichever camera looks. K_FAR is the single coefficient: a far animal is drawn 1 + K_FAR * far times its size (so
// that it stays a body with its stroke of shadow, and the lanes between the arms stay open), its coat is darker and its
// rump paler by the same measure, and the steam over it is as much denser.
const FAR_GLSL = /* glsl */`
#define K_FAR .7
float farOf(float d){ return smoothstep(110., 380., d); }
`;
const HERD_GLSL = /* glsl */`
${FAR_GLSL}uniform float uClock, uTime;
uniform vec4 uLead; uniform vec3 uLeadB;      // the led animal (iA.x > 900): xyz position, w speed; forward x, forward z, gait cycle
// the stragglers' trails (trailTable); a straggler has 800 < iA.x < 900
uniform highp sampler2D uTrail;
attribute vec4 iA, iB;
// set by slotFrame for a straggler: its gait cycle, the slope of the ground under it
float gCyc = 0.; vec2 gGrad = vec2(0.);
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float speedOf(float r){ return 1.4 + 4.6 * smoothstep(64., 92., r) + 5. * smoothstep(92., 165., r); }
float strideOf(float v){ return 1.1 + 1.3 * smoothstep(1.4, 6., v) + smoothstep(6., 11., v); }
float dutyOf(float v){ return .62 - .22 * smoothstep(1.4, 6., v) - .11 * smoothstep(6., 11., v); }
// a straggler at clock t: down its trail at its own pace, then (blended in over 4.4 s) round the ring it joins; w = how far it has joined
vec4 trailPos(float t, int row, vec4 J, float s0, float vT, out float w){
  float tJ = (J.x - s0) / vT, th = J.y + speedOf(J.z) / J.z * (t - tJ);
  w = smoothstep(tJ - 2.2, tJ + 2.2, t);
  float f = clamp((s0 + vT * t - (${TR_S0}.)) / ${TR_DS}., 0., ${TR_N - 1.001}); int k = int(f);
  vec4 T = mix(texelFetch(uTrail, ivec2(k, row), 0), texelFetch(uTrail, ivec2(k + 1, row), 0), f - float(k));
  return vec4(mix(T.xyz, vec3(J.z * cos(th), 0., -J.z * sin(th)), w), T.w * (1. - w));
}
void slotFrame(float t, out vec3 base, out vec3 fwd, out float v){
  gGrad = vec2(0.);
  if(iA.x > 900.){ fwd = vec3(uLeadB.x, 0., uLeadB.y); v = uLead.w; base = vec3(uLead.x, 0., uLead.z) - fwd * (v * (uClock - t)); return; }
  if(iA.x > 800.){
    int code = int(iA.x - 799.5), row = code / 4; float s0 = iA.y, vT = max(iB.w, .5), w, w2;
    vec4 J = texelFetch(uTrail, ivec2(${TR_N} + code - row * 4, row), 0);
    vec4 P = trailPos(t, row, J, s0, vT, w), A = trailPos(t - .2, row, J, s0, vT, w2), B = trailPos(t + .2, row, J, s0, vT, w2);
    vec3 dv = B.xyz - A.xyz; float dl = max(length(dv), 1e-4), hl = max(length(dv.xz), 1e-4);
    base = P.xyz; fwd = dv / dl; v = dl / .4;
    vec2 fx = dv.xz / hl; gGrad = fx * (dv.y / hl) + vec2(fx.y, -fx.x) * P.w;
    float tJ = (J.x - s0) / vT, vR = speedOf(J.z), cT = vT / (strideOf(vT) * iA.z);
    gCyc = mix(cT * t, cT * tJ + vR * (t - tJ) / (strideOf(vR) * iA.z), w) + iA.w * 17.;
    return;
  }
  float r = iA.x, th0 = iA.y;
  v = iB.x < .5 ? speedOf(r) : 0.;
  float th = th0 + v / r * t, c = cos(th), s = sin(th);
  base = vec3(r * c, 0., -r * s); fwd = vec3(-s, 0., -c);
  if(iB.x > .5) fwd = vec3(sin(iB.w), 0., cos(iB.w));
}
// 0 standing .. 1 lying (state 2: they get up and lie down again on a slow cycle)
float lieOf(){ return (iB.x > 1.5 && iB.x < 2.5) ? smoothstep(-.55, -.25, sin(uTime * .11 + iA.w * 40.)) : 0.; }
float cycOf(float v){ return iA.x > 900. ? uLeadB.z : iA.x > 800. ? gCyc : uClock * v / (strideOf(v) * iA.z) + iA.w * 17.; }
// one foot relative to its rest spot, in unscaled animal metres: x forward, y lift. During stance the foot
// travels back exactly one stride per cycle, i.e. at body speed: it is fixed in the world.
vec2 footOf(float cyc, float tp, float wp, float v, float front){
  if(iB.x > .5){
    vec2 f = vec2((h11(iA.w * 9. + tp * 3. + wp) - .5) * .16, 0.);
    if(iB.x > 2.5 && front > .5 && tp < .25){ float a = uTime * 5.2 + iA.w * 20., on = smoothstep(.1, .5, sin(uTime * .5 + iA.w * 30.)); f = mix(f, vec2(.16 + .2 * sin(a), .13 * max(cos(a), 0.)), on); }
    return f;
  }
  float trot = smoothstep(2., 4.5, v), ph = fract(cyc + mix(wp, tp, trot)), beta = dutyOf(v), a = .5 * beta * strideOf(v);
  if(ph < beta) return vec2(a * (1. - 2. * ph / beta), 0.);
  float s = (ph - beta) / (1. - beta), e = s * s * (3. - 2. * s);
  return vec2(-a + 2. * a * e, sin(3.14159 * s) * mix(.09, .24, trot) * (front > .5 ? 1. : .8));
}
// body height offset: crouch, trot bounce, lying down
float bodyOf(float cyc, float v){
  float trot = smoothstep(2., 4.5, v);
  return -.04 - .045 * trot + .03 * trot * sin(cyc * 12.566 + 1.2) + .012 * (1. - trot) * step(.1, v) * sin(cyc * 12.566) - .36 * lieOf();
}
`;
const NOISE_GLSL = /* glsl */`
float hash3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float vnoise2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y); }
float fbm2(vec2 p){ return vnoise2(p) * .5 + vnoise2(p * 2.03 + 11.) * .25 + vnoise2(p * 4.01 + 5.) * .125 + vnoise2(p * 8.1) * .0625; }
`;

// Kicked-up snow hanging knee-high over the trampled ring: an exponential layer (scale height uHaze4.y) between the lens and
// the point shaded. hazeA = how much of the point it hides; hazeMix lays it on, glowing where the view runs toward the sun.
const HAZE_GLSL = /* glsl */`
uniform vec3 uHazeCol, uHazeGold; uniform vec4 uHaze4;      // x strength, y scale height, z time
float hazeA(vec3 p, vec3 cam){
  float r = length(p.xz), ring = smoothstep(60., 78., r) * smoothstep(224., 198., r);
  float K = uHaze4.x * ring * mix(1., .22, smoothstep(4.5, 13., cam.y));      // seen from the air the layer is a thin veil: the rings read dark through it
  if(K < .0005) return 0.;
  float H = uHaze4.y, D = distance(p, cam);
  float tau = K * D * H * abs(exp(-max(p.y, 0.) / H) - exp(-max(cam.y, 0.) / H)) / max(abs(cam.y - p.y), .03);
  float n = vnoise2(p.xz * .1 + vec2(uHaze4.z * .33, -uHaze4.z * .21)) * .6 + vnoise2(p.xz * .33 - vec2(uHaze4.z * .5, uHaze4.z * .28)) * .4;
  return (1. - exp(-tau * (.4 + 1.2 * n))) * .86;
}
vec3 hazeMix(vec3 c, vec3 p, vec3 cam, vec3 sunDir){
  float a = hazeA(p, cam);
  if(a < .002) return c;
  vec3 d = p - cam; float fs = max(dot(d / max(length(d), 1e-3), sunDir), 0.); fs *= fs; fs *= fs;
  return mix(c, uHazeCol + uHazeGold * fs, a);
}`;

const DEER_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${HERD_GLSL}
attribute vec4 aAnim; attribute vec3 aPivot; attribute float aGlow;
uniform vec3 uCamL, uNeck, uPale; uniform float uThin;
varying vec3 vColor, vN, vP, vL, vBase; varying vec4 vInfo;
void main(){
  float sc = iA.z, state = iB.x, part = aAnim.z, v;
  vec3 base, fwd; slotFrame(uClock, base, fwd, v);
  // if the clock ever leaves the route's own (a paused camera), animals step round the lens instead of through it
  vec2 dcam = base.xz - uCamL.xz; float dlen = length(dcam);
  base.xz += dcam / max(dlen, .05) * max(0., 2.8 - dlen) * step(uCamL.y, 4.4) * step(iB.x, .5);
  float cyc = cycOf(v), by = bodyOf(cyc, v), trot = smoothstep(2., 4.5, v), lie = lieOf();
  vec3 p = position, n = normal;
  if(part > .5 && part < 1.5){
    // leg: two-bone IK in the (z, y) plane from the hip to the planted (or swinging) foot
    float front = step(0., aPivot.z), Lg = aPivot.y;
    vec2 ft = footOf(cyc, aAnim.x, aAnim.w, v, front);
    // lying: forelegs folded, the knees on the snow in front of the chest and the cannons tucked back under it; hind legs
    // folded beside the belly, hocks back, feet forward. Nothing goes under the snow.
    vec2 F = vec2(mix(ft.x, front > .5 ? -.05 : .3, lie), -(Lg + by) + ft.y + lie * .05);
    float d = max(length(F), .06), st = max(1., d / (Lg * .997)), L1 = Lg * .55 * st, L2 = Lg * .45 * st;
    vec2 fh = F / d, pr = vec2(-fh.y, fh.x);
    float ca = clamp((L1 * L1 + d * d - L2 * L2) / (2. * L1 * d), -1., 1.), sa = sqrt(max(1. - ca * ca, 0.));
    vec2 K = L1 * (ca * fh + (front > .5 ? sa : -sa) * pr), u1 = K / L1, u2 = (F - K) / L2;
    float t = aAnim.y * Lg * st, k = smoothstep(L1 - .05, L1 + .05, t);
    vec2 c = t < L1 ? u1 * t : K + u2 * (t - L1);
    vec2 ub = normalize(mix(u1, u2, k) + vec2(0., -1e-4)), nb = vec2(-ub.y, ub.x);
    vec2 zy = vec2(aPivot.z, aPivot.y + by) + c + nb * (p.z - aPivot.z);
    vec2 nzy = n.z * nb - n.y * ub;
    p.z = zy.x; p.y = zy.y; n.z = nzy.x; n.y = nzy.y;
    p.x += sign(aPivot.x) * lie * (front > .5 ? .05 : .11);
  } else {
    if(part > 5.5){
      // antlers: one mesh, shaped per animal (three builds and the calf's spikes); bare bulls collapse them
      vec3 d = p - aPivot; float var = iB.y;
      vec3 s = var < .5 ? vec3(0.) : var < 1.5 ? vec3(1.) : var < 2.5 ? vec3(1.3, .86, 1.12) : var < 3.5 ? vec3(.78, 1.12, .9) : vec3(.5, .42, .5);
      if(var > 3.5) d = mix(d, vec3(d.x * .3, d.y, d.z * .3), aAnim.y);
      d *= s * (.88 + .26 * h11(iA.w * 5.)); d.z -= d.y * d.y * .14 * (h11(iA.w * 3.) - .3);
      p = aPivot + d;
    }
    if(part > 4.5 && part < 5.5){ float fl = pow(max(sin(uTime * 1.3 + iA.w * 50. + sign(aPivot.x)), 0.), 12.); p.z -= aAnim.y * .07 * fl; p.y -= aAnim.y * .03 * fl; }
    if(part > 2.5 && part < 3.5){ p.x += aAnim.y * .04 * sin(uTime * 3. + iA.w * 30.); p.y += aAnim.y * .06 * trot; }
    if(part > 1.5 && (part < 2.5 || part > 4.5)){
      // neck and head nod with the stride; standing animals look about and chew; pawing ones lower the head
      float w = aAnim.x, graze = state > 2.5 ? smoothstep(0., .6, sin(uTime * .5 + iA.w * 30.)) : 0.;
      float idle = state > .5 ? .035 * sin(uTime * .7 + iA.w * 20.) + .018 * sin(uTime * 4.4 + iA.w * 9.) * step(.5, h11(iA.w * 7.)) : 0.;
      float ang = .05 * trot * sin(cyc * 12.566 + 2.2) + .05 * (1. - trot) * step(.1, v) * sin(cyc * 6.2832) + idle + 1.0 * graze - .92 * lie + (h11(iA.w * 13.) - .5) * .16, a = w * ang;
      vec3 d = p - uNeck; float c = cos(a), s = sin(a);
      d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); n.yz = vec2(n.y * c - n.z * s, n.z * c + n.y * s);
      float yw = w * (state > .5 ? .5 * sin(uTime * .23 + iA.w * 60.) : .04 * sin(cyc * 6.2832 + 1.));
      d.x += d.z * yw;
      p = uNeck + d;
      if(lie > .001){
        // a lying animal carries its neck upright and its head level, above the line of the back: the head turns back down about its own joint
        vec3 hr = vec3(0., 1.12, .98) - uNeck; float ca = cos(ang), sa = sin(ang);
        vec3 hj = uNeck + vec3((hr.z * ca + hr.y * sa) * yw, hr.y * ca - hr.z * sa, hr.z * ca + hr.y * sa);
        float b = .66 * lie * (part > 4.5 ? 1. : smoothstep(.86, 1., position.z)), cb = cos(b), sb = sin(b);
        vec3 e = p - hj; e.yz = vec2(e.y * cb - e.z * sb, e.z * cb + e.y * sb); n.yz = vec2(n.y * cb - n.z * sb, n.z * cb + n.y * sb);
        p = hj + e;
      }
    }
    if(part < .5 && state > .5){ p.x *= 1. + .03 * sin(uTime * 1.9 + iA.w * 40.) * smoothstep(.5, 0., abs(p.z - .05)) + lie * mix(.44, .08, smoothstep(.56, 1., p.y)); p.y += lie * .12 * smoothstep(.95, .15, abs(p.z + .08)) * smoothstep(.78, 1.05, p.y); }      // breathing; a lying body spreads at the belly (a pear, not a log) and its back rounds
    p.y += by;
  }
  // (a straggler on the slope stands square to the ground under it: fwd follows the trail downhill)
  vec3 side = normalize(vec3(fwd.z, 0., -fwd.x)), up = cross(fwd, side);
  p *= sc * (1. + K_FAR * farOf(distance(base, uCamL)));
  vec3 lp = base + side * p.x + up * (p.y - .05) + fwd * p.z;
  vec3 ln = normalize(side * n.x + up * n.y + fwd * n.z + vec3(0., 1e-5, 0.));
  if(part > 5.5) lp += ln * clamp(distance(lp, uCamL) * uThin - .02, 0., .11) * step(.5, iB.y);
  // pale and white animals keep dark eyes, nose and hooves, greyer lower legs and a shaded belly
  float code = floor(iB.z), jit = fract(iB.z), keep = smoothstep(.018, .032, dot(color, vec3(.333)));
  float isLeg = step(.5, part) * step(part, 1.5), lowLeg = isLeg * smoothstep(.4, .85, aAnim.y);
  float under = step(part, .5) * smoothstep(.1, -.7, normal.y) * smoothstep(.8, .6, position.y);
  vec3 col = color * (.84 + .32 * jit);
  vBase = col;
  if(code > .5 && code < 1.5) col = mix(col, uPale * (.8 + .2 * jit), (.62 * aGlow + .2) * keep * (1. - .82 * lowLeg) * (1. - .5 * under));
  if(code > 2.5) col = mix(col, mix(mix(vec3(.67, .65, .61), vec3(.36, .33, .3), under * .85), mix(vec3(.46, .43, .39), vec3(.2, .18, .16), smoothstep(.2, .75, aAnim.y)), isLeg), (.5 + .46 * aGlow) * keep);
  vColor = col; vN = ln; vP = lp; vL = position; vInfo = vec4(aGlow, code, iA.w, lie);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const DEER_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${HAZE_GLSL}
${FAR_GLSL}
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uCamL, uPale, uDriftCol, uSnow, uShade; uniform float uDrift, uTime;
varying vec3 vColor, vN, vP, vL, vBase; varying vec4 vInfo;
void main(){
  float vFur = vInfo.x, vTint = vInfo.y, vSeed = vInfo.z, lie = vInfo.w;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  vec3 toCam = uCamL - vP; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  vec3 alb = vColor;
  float near = smoothstep(45., 8., dist), close = smoothstep(26., 5., dist), white = step(2.5, vTint);
  // the white rump patch: soft-edged, breaking up onto the haunch and running a little way down the back of the thigh
  float rn = vnoise(vL * vec3(8., 6., 8.) + vSeed * 13.) - .5 + .45 * (vnoise(vL * 25. + vSeed * 5.) - .5);
  float rump = smoothstep(-.63, -.76, vL.z + rn * .1) * smoothstep(.17, .06, abs(vL.x) + rn * .08) * smoothstep(.7, .82, vL.y + rn * .1) * vFur;
  alb = mix(alb, vec3(.66, .64, .6), rump * (1. - white));
  // the face: a dark muzzle and a dark eye against the cream cheek (they stay dark on a pale or white animal)
  float muz = smoothstep(1.325, 1.365, vL.z + rn * .02) * smoothstep(1.2, 1.1, vL.y);
  float eyeD = length(vec3(abs(vL.x) - .094, vL.y - 1.15, vL.z - 1.12));
  alb = mix(alb, vec3(.022, .018, .016), max(muz, 1. - smoothstep(.022, .04, eyeD)) * step(1.02, vL.z));
  if(vTint > 1.5 && vTint < 2.5) alb = mix(alb, uPale, .9 * vFur * smoothstep(.56, .64, vnoise(vL * 3.3 + vSeed * 19.)));   // pied
  // one pale animal in three is pied the other way: brown saddle patches over the back and the haunch, the head and legs left pale
  if(vTint > .5 && vTint < 1.5 && fract(vSeed * 7.31 + .13) < .34){
    float sad = vnoise(vL * vec3(2.7, 2.3, 2.9) + vSeed * 19.) + .3 * smoothstep(.74, 1.02, vL.y) - .3 * smoothstep(.55, 1.05, vL.z) - .25 * smoothstep(.6, .3, vL.y);
    alb = mix(alb, vBase, .94 * vFur * smoothstep(.5, .57, sad));
  }
  // the coat: hair lies along the body and hangs on the throat mane and the legs; frosted guard hairs on the back
  float hang = max(smoothstep(.42, .56, vL.z) * smoothstep(1.02, .88, vL.y), smoothstep(.6, .48, vL.y));
  vec3 fq = vL * mix(vec3(64., 26., 9.), vec3(58., 7., 46.), hang) + vSeed * 31.;
  float fur = vnoise(fq), fur2 = vnoise(fq * 2.6 + 9.);
  alb *= 1. + vFur * near * ((fur - .5) * .44 + (fur2 - .5) * .34 * close);
  alb = mix(alb, alb * 1.4 + .02, vFur * .3 * close * smoothstep(.25, .8, N.y) * smoothstep(.42, .62, fur2));
  // keep the winter coat dark against snow from a distance (ruff and rump stay pale); beside the lens it is grey-brown and takes light
  alb *= mix(mix(.55, 1., smoothstep(.1, .42, dot(alb, vec3(.333)))), 1., max(.5 * close, .8 * smoothstep(85., 30., dist)));
  float lowS = 1. - smoothstep(.1, .24, uSunDir.y);                 // the last sun: coats stay brown, never black
  alb = mix(alb, alb * 1.5 + .012, max(.6 * lie, .45 * lowS * close));
  float ndl = dot(N, uSunDir), dif = max(ndl, 0.) * .78 + .22 * max(ndl * .6 + .4, 0.);
  float ao = mix(.5, 1., smoothstep(.2, .95, vL.y)) * (1. - .1 * lie * smoothstep(.75, .45, vL.y));
  vec3 c = alb * (mix(uBounce * (1. + .9 * smoothstep(90., 20., dist)), uSkyCol * (1. + .4 * close), N.y * .5 + .5) * ao * (1. + .35 * smoothstep(90., 20., dist)) + uSunCol * dif * mix(.38, .54, close));
  // a pale coat is lit like the snow it stands on: cream where the sun reaches it, the blue of the snow's shade where it does
  // not, darker under the belly; so a white animal has a lit side and a shade side and is not a flat cut-out
  // (round 6: no wrapped sunlight on the shade side, a lit side no brighter than sunlit snow, the belly and the inner legs darker,
  // a warm rim where the sun grazes the coat: the form reads in full sun)
  float paleK = smoothstep(.3, .6, dot(alb, vec3(.333))) * vFur, pUnder = smoothstep(.15, -.65, N.y);
  c = mix(c, alb * ((uShade * 1.02 + uBounce * .85) * ao * (.74 + .26 * N.y) * (1. - .34 * pUnder) + uSunCol * max(ndl, 0.) * .45), paleK * .88);
  c += uSunCol * vec3(1., .74, .5) * paleK * .16 * pow(1. - max(dot(N, V), 0.), 2.) * smoothstep(-.15, .45, ndl) * (.4 + .6 * near);
  float fr = pow(1. - max(dot(N, V), 0.), 3.);
  c += (uSkyCol * .3 + uSunCol * (.2 + alb) * smoothstep(-.1, .9, dot(-V, uSunDir))) * fr * (.12 + .3 * vFur) * (.3 + .7 * near) * (1. + .7 * close);   // fur halo, gold when backlit
  c += (uSunCol * .55 + uSkyCol * .5) * (.05 + alb) * (lie * .7 + lowS * .5) * near * vFur * smoothstep(.3, .9, N.y);      // light along the back of a resting animal
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  c += uSunCol * vFur * close * .035 * pow(max(dot(N, H), 0.), 9.) * (.5 + fur2) + uSkyCol * vFur * close * .05 * smoothstep(.35, .95, N.y);   // sheen: gold on the sun side, sky on the back
  // rime on the back of an animal that has been lying in the snow
  float kk = clamp(ndl / max(uSunDir.y, .07), 0., 1.6);
  c = mix(c, mix(uShade, uSnow * (.3 + .44 * kk), smoothstep(0., .5, kk)), lie * .42 * smoothstep(.45, .9, N.y) * smoothstep(.3, .75, vnoise(vL * vec3(23., 23., 12.) + vSeed * 7.)) * vFur);
  // from far off: dark bodies, pale ruff and rump dots, the more so the farther the animal is (the one rule of distance, FAR_GLSL)
  float farK = K_FAR * farOf(dist);
  c *= mix(1., mix(.5 - .2 * farK, 1.2 + .7 * farK, smoothstep(.1, .3, dot(alb, vec3(.333)))), smoothstep(75., 200., dist));
  if(uDrift > 0.){ float dn = vnoise(vec3(vP.xz * .35 - vec2(uTime * 2.4, 0.), uTime * .3)); c = mix(c, uDriftCol * (.9 + .25 * dn), min(1., uDrift * 1.25) * smoothstep(.56, .1, vP.y - .2 * dn) * (.65 + .35 * dn) * (.4 + .6 * smoothstep(45., 75., length(vP.xz)))); }
  c = hazeMix(c, vP, uCamL, uSunDir);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// Feeding craters in the eye: pawed bowls, each with a lip of thrown snow, in loose clusters. p = lake position + cwarp(lake
// position), metres. Height in metres; rel = distance from the bowl's centre / its radius (9 where there is none).
const CRATER_GLSL = /* glsl */`
vec2 cwarp(vec2 p){ return ${CR_WARP.toFixed(2)} * (vec2(vnoise2(p * .13 + 3.7), vnoise2(p * .13 + 41.3)) - .5); }
float craterH(vec2 p, out float rel){
  vec2 pr = vec2(${CR_ROT[0]} * p.x - ${CR_ROT[1]} * p.y, ${CR_ROT[1]} * p.x + ${CR_ROT[0]} * p.y);
  vec2 cp = pr / 4.2, ci = floor(cp);
  float cR = mix(.45, 1.1, hash2(ci + 3.1)), jit = 2. * max(0., .48 - .38 * cR);
  vec2 cj = ci + .5 + (vec2(hash2(ci), hash2(ci + 7.3)) - .5) * jit, cd = (cp - cj) * 4.2;
  float rc = length(cj) * 4.2;
  rel = 9.;
  if(hash2(ci + 9.7) < .2 || vnoise2(ci * .31 + 17.) < .565 || rc > 56.5 || rc < 15.5) return 0.;
  rel = length(cd) / cR;
  float lump = vnoise2(p * 4.7 + 13.), x = rel - 1.1;
  return -.3 * (1. - smoothstep(.52, .95, rel)) * (.45 + .6 * cR) + (.04 + .08 * lump) * (.6 + .5 * cR) * exp(-x * x * 14.);
}`;
// distance between a ray (the line of sight to the sun) and a segment: x = distance, y = ray parameter
const CAP_GLSL = /* glsl */`
vec2 capD(vec3 ro, vec3 rd, vec3 a, vec3 b){
  vec3 ba = b - a, oa = ro - a;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float s = clamp((baoa - bard * rdoa) / max(baba - bard * bard, 1e-4), 0., 1.);
  vec3 c = a + ba * s; float t = max(dot(c - ro, rd), 0.);
  return vec2(length(ro + rd * t - c), t);
}`;
const FOG_K = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogK = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  float fogK = 0.;
#endif`;

// Shadow cards: one ground quad per animal, stretched away from the sun; the fragment shader ray-casts
// toward the sun against a capsule reindeer in the animal's own frame (legs from the same gait functions).
const SHADOW_VERT = /* glsl */`
#include <fog_pars_vertex>
${HERD_GLSL}
uniform vec3 uSunDir, uCamS; uniform float uShLen;
varying vec3 vQ, vSunA; varying vec4 vFz, vFy, vInfo; varying vec2 vUv, vW;
void main(){
  vec3 base, fwd; float v; slotFrame(uClock, base, fwd, v); vUv = position.xy;
  float sc = iA.z * (1. + K_FAR * farOf(distance(base, uCamS))), cyc = cycOf(v), lie = lieOf();
  vec2 sh = -normalize(uSunDir.xz + vec2(1e-5, 0.)), pb = vec2(-sh.y, sh.x);
  float tall = (iB.y < .5 ? 1.3 : iB.y > 3.5 ? 1.5 : 2.1) * (1. - .5 * lie);
  float len = tall * sc * uShLen + 1.3;
  vec2 g = base.xz + sh * mix(-1.5, len, position.x) + pb * position.y * 1.75 * sc;
  // (the card lies on the ground under the animal: the lake, or for a straggler the slope, by its gradient gGrad)
  vec3 lp = vec3(g.x, base.y + dot(gGrad, g - base.xz) + .03, g.y), side = normalize(vec3(fwd.z, 0., -fwd.x)), up = cross(fwd, side), rel = lp - base; vW = g;
  vQ = vec3(dot(rel, side), dot(rel, up) + .02, dot(rel, fwd)) / sc;
  vSunA = vec3(dot(uSunDir, side), dot(uSunDir, up), dot(uSunDir, fwd));
  vec2 f0 = footOf(cyc, 0., .25, v, 1.), f1 = footOf(cyc, .5, .75, v, 1.), f2 = footOf(cyc, .5, 0., v, 0.), f3 = footOf(cyc, 0., .5, v, 0.);
  vFz = vec4(f0.x, f1.x, f2.x + lie * .22, f3.x + lie * .22); vFy = vec4(f0.y, f1.y, f2.y, f3.y);
  vInfo = vec4(bodyOf(cyc, v), iB.y, lie, sc);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADOW_FRAG = /* glsl */`
#include <fog_pars_fragment>
${NOISE_GLSL}
${CRATER_GLSL}
${CAP_GLSL}
${HAZE_GLSL}
uniform vec3 uShCol, uCamS; uniform float uShStr;
varying vec3 vQ, vSunA; varying vec4 vFz, vFy, vInfo; varying vec2 vUv, vW;
float k = 0., px = 0., pt = 0.;
vec3 ro, rd;
void cap(vec3 a, vec3 b, float r){ vec2 d = capD(ro, rd, a, b); float soft = .02 + .011 * d.y + px; k = max(k, (1. - smoothstep(r - soft, r + soft, d.x)) * min(1., 1.6 * r / (r + soft))); }
// legs, neck and antlers: once a pixel covers more ground than the member is wide it keeps three quarters of a pixel and most of its strength,
// so every shadow stays joined to its hooves and keeps an animal's outline
void capT(vec3 a, vec3 b, float r){ vec2 d = capD(ro, rd, a, b); float rr = max(r, .75 * pt), soft = .012 + .006 * d.y + .55 * pt; k = max(k, (1. - smoothstep(rr - soft, rr + soft, d.x)) * max(.62, min(1., 1.6 * r / (r + soft)))); }
void main(){
  ro = vQ; rd = normalize(vSunA); px = min(.7 * length(fwidth(vQ.xz)), .5);
  float pf = min(1.2 * min(length(dFdx(vQ.xz)), length(dFdy(vQ.xz))), .5);
  pt = min(.5 * (px + pf), .22);
  float by = vInfo.x, var = vInfo.y;
  cap(vec3(0., .87 + by, -.58), vec3(0., .85 + by, .42), .265);
  capT(vec3(0., .98 + by, .5), vec3(0., 1.1 + by, 1.24), .115);
  capT(vec3(-.125, .8 + by, .4), vec3(-.125, vFy.x, .4 + vFz.x), .05);
  capT(vec3(.125, .8 + by, .4), vec3(.125, vFy.y, .4 + vFz.y), .05);
  capT(vec3(-.13, .84 + by, -.5), vec3(-.13, vFy.z, -.5 + vFz.z), .055);
  capT(vec3(.13, .84 + by, -.5), vec3(.13, vFy.w, -.5 + vFz.w), .055);
  if(var > .5){
    float s = var > 3.5 ? .45 : 1.; vec3 b0 = vec3(.06, 1.2 + by, .93);
    vec3 m = vec3(.3, .48, -.23) * s, e = vec3(.34, .78, .04) * s, f = vec3(.2, .4, .13) * s;
    capT(b0, b0 + m, .04); capT(b0 + m, b0 + e, .04); capT(b0 + m * .35, b0 + f, .03);
    b0.x = -b0.x; m.x = -m.x; e.x = -e.x; f.x = -f.x;
    capT(b0, b0 + m, .04); capT(b0 + m, b0 + e, .04); capT(b0 + m * .35, b0 + f, .03);
  }
  // far away the capsules fall below a pixel: carry the shadow as one soft stroke
  k = max(k, smoothstep(.12, .4, pf) * smoothstep(.1, .17, vUv.x) * smoothstep(.92, .7, vUv.x) * smoothstep(.36 + .4 * pf, .16, abs(vUv.y)));
  ${FOG_K}
  k *= uShStr * (1. - fogK) * smoothstep(1., .55, abs(vUv.y)) * smoothstep(0., .04, vUv.x) * smoothstep(1., .9, vUv.x);
  // a shadow crossing a pawed bowl: the dark floor is not snow, leave it be
  if(k > .01 && dot(vW, vW) < 3500.){ float rel; craterH(vW + cwarp(vW), rel); k *= mix(.2, 1., smoothstep(.5, .85, rel)); }
  k *= 1. - hazeA(vec3(vW.x, .03, vW.y), uCamS);
  if(k < .004) discard;
  // blended toward the colour of shaded snow: where shadows overlap, or fall on the printed arms, the blue stays this blue
  gl_FragColor = vec4(uShCol, k);
  #include <fog_fragment>
}`;

// Wind-carved snow outside the trampled ring, as a height field in metres, so that the low sun can light it and it can throw
// short shadows: rows of sastrugi (a steep nose into the wind, a tail thinning downwind) in a frame turned 48 degrees from
// east-west, at three sizes; and the trails the herd trod coming down from the col to the outer arm. The world's land uses
// the same functions, so the two surfaces agree where they meet.
export const GROUND_GLSL = /* glsl */`
float sasH(vec2 w, vec2 cell, float seed){
  vec2 g = w / cell; float row = floor(g.y); g.x += hash2(vec2(row, seed)) * 7.3;
  vec2 gi = vec2(floor(g.x), row), f = g - gi;
  float h1 = hash2(gi + seed), h2 = hash2(gi + seed + 3.7), h3 = hash2(gi + seed + 9.1);
  float u = f.x / (.62 + .38 * h2), v = (f.y - .5 - (h1 - .5) * .2) * 2., wd = (.5 + .36 * h1) * (.5 + .5 * smoothstep(0., .45, u));
  // they stand in fields, with smooth snow between the fields
  float on = step(h3, .15 + .7 * vnoise2(gi * .13 + seed));
  return on * cell.y * smoothstep(0., .09, u) * (1. - .5 * u) * (1. - smoothstep(.78, 1., u)) * (1. - smoothstep(wd * .3, wd, abs(v)));
}
// the trails: each a trench some two and a half metres wide trodden by animals in file, two strands that part and join
float trailH(vec2 q, float fw){
  float h = 0., wd = max(1.25, fw * .8);
  if(q.x > 118. && q.x < 345.){
    vec2 p = q - vec2(331., -8.);
    for(int i = 0; i < 5; i++){
      float fi = float(i), ez = -104. + 41. * fi; vec2 E = vec2(sqrt(43260. - ez * ez) - 331., ez + 8.); float len = length(E); vec2 d = E / len;
      float s = dot(p, d), l = p.x * d.y - p.y * d.x;
      l += (4.2 * sin(s * .043 + fi * 2.1) + 1.3 * sin(s * .127 + fi * 5.)) * smoothstep(0., 34., s);
      float l2 = l - 2.2 - 2.4 * sin(s * .061 + fi * 3.3);
      float m = max(1. - smoothstep(wd * .55, wd, abs(l)), 1. - smoothstep(wd * .4, wd * .75, abs(l2)));
      h = max(h, m * smoothstep(-3., 5., s) * (1. - smoothstep(len + 30., len + 62., s)));
    }
  }
  return -.15 * h * min(1., 1.6 / wd) * (.5 + .5 * vnoise2(q * 3.1));
}
// k = how much of the large, the middle and the small sastrugi is still resolved
float groundH(vec2 q, vec3 k, float fw){
  vec2 w = vec2(q.x * .669 + q.y * .743, q.y * .669 - q.x * .743);
  w.y += 1.7 * sin(w.x * .045 + 1.7 * sin(w.y * .031));
  float h = sasH(w + 5., vec2(15., 7.), 9.) * .06 * k.x + trailH(q, fw);
  if(k.y > .001) h += sasH(w, vec2(5.2, 2.6), 1.) * .11 * k.y;
  if(k.z > .001) h += sasH(w + 13., vec2(1.9, .95), 5.) * .1 * k.z;
  return h;
}
// xy = the slope of the ground, z = the shadow a ridge on the sun side throws on this point
vec3 groundRelief(vec2 q, vec2 sunXZ, float tanEl, float fw, float nearK){
  vec3 k = vec3(1. - smoothstep(1.4, 4., fw), 1. - smoothstep(.5, 1.5, fw), nearK * (1. - smoothstep(.2, .6, fw)));
  float e = max(.1, fw * .7), h0 = groundH(q, k, fw);
  vec2 g = vec2(groundH(q + vec2(e, 0.), k, fw) - h0, groundH(q + vec2(0., e), k, fw) - h0) / e;
  float sh = 0.;
  for(int i = 0; i < 4; i++){
    float fi = float(i), t = .35 + .5 * fi * (1. + .45 * fi);
    sh = max(sh, smoothstep(0., .05, groundH(q + sunXZ * t, k, fw) - h0 - t * tanEl));
  }
  return vec3(g, sh);
}
// heath tussocks standing out of the snow: x = the tuft, y = its short shadow on the snow beyond it; dens = share of cells that hold one
vec2 tussock(vec2 q, vec2 sunXZ, float cs, float dens){
  vec2 g = q / cs, gi = floor(g), f = g - gi;
  float h1 = hash2(gi + 21.3), h2 = hash2(gi + 47.1), rad = .12 + .08 * h2;
  vec2 lat = vec2(-sunXZ.y, sunXZ.x), d = f - (vec2(.5) + sunXZ * (.2 + .12 * (h1 - .5)) + lat * (.2 * (hash2(gi + 5.5) - .5)));
  float tuft = 1. - smoothstep(rad * .55, rad, length(d) + (vnoise2(q * 6. / cs) - .5) * .09);
  vec2 ds = d + sunXZ * (rad * 1.3);
  float shd = 1. - smoothstep(.65, 1., length(vec2(dot(ds, lat) / (rad * .85), dot(ds, sunXZ) / (rad * 1.5))));
  return vec2(tuft, shd * (1. - tuft)) * step(hash2(gi + 77.7), dens);
}
`;

// the one point of interest the world hands the engine (hero.gazeAt)
export const GAZE_POI = { from: 0.033, to: 1, weight: 0.88, fade: 0.0735 };

// The snow disc: sastrugi outside, the trampled annulus with ring grooves and the turning arms' fresh churn,
// feeding craters and a scoured islet in the eye, the boulder's long shadow, sparkle.
const SNOW_VERT = /* glsl */`
#include <fog_pars_vertex>
varying vec3 vP;
void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SNOW_FRAG = /* glsl */`
#include <fog_pars_fragment>
${NOISE_GLSL}
${CAP_GLSL}
${HAZE_GLSL}
${GROUND_GLSL}
uniform vec3 uSunDir, uGold, uCamL, uSnow, uWarm, uShade, uHeath, uLichen, uB1, uB2;
uniform float uClock, uTime, uArms, uPeriod, uArmPhase, uWet, uDrift, uBoulder, uGlint;
varying vec3 vP;
float speedOf(float r){ return 1.4 + 4.6 * smoothstep(64., 92., r) + 5. * smoothstep(92., 165., r); }
${CRATER_GLSL}
// wind crust (low plates) and hoof pocks; dens = share of cells holding a print
float detailH(vec2 p, float dens){
  float h = .45 * smoothstep(.36, .64, vnoise2(p * 1.9 + 3.)) + .3 * smoothstep(.34, .66, vnoise2(p * 5.3 + 11.)) + .15 * vnoise2(p * 17.);
  vec2 g = p * 2.3, gi = floor(g), gc = gi + .5 + (vec2(hash2(gi + 1.7), hash2(gi + 5.9)) - .5) * .55;
  float sz = .55 + .75 * hash2(gi + 8.1);
  float pk = step(hash2(gi + 2.3), dens) * smoothstep(.26 * sz, .03 * sz, length((g - gc) * vec2(1., .7 + .6 * hash2(gi + 4.4))));      // a print is a soft dimple, shaded, seldom deep enough to hold its own shadow
  return h * .024 - pk * .036;
}
// the floor of the trampled ring under the lens (height in metres): a trench of churned snow (clods, crumbs, slabs of crust
// left standing) and over it the prints of the last animals through, in lines along the rings, a print every stride
float churnH(vec2 p){
  float r = length(p);
  float lump = vnoise2(p * 2.3 + 7.) * .5 + vnoise2(p * 5.7 + 3.) * .32 + vnoise2(p * 13.1 + 9.) * .18;
  float slab = smoothstep(.52, .6, vnoise2(p * .8 + 31.) + .25 * (vnoise2(p * 3.9 + 5.) - .5));
  float ln = floor(r * 1.7), rl = (ln + .5) / 1.7, arc = atan(p.y, -p.x) * rl * 1.55 + hash2(vec2(ln, 3.)) * 9.;      // (the seam lies due east, where the lens never comes low)
  float st = floor(arc); vec2 jit = vec2(hash2(vec2(ln, st)), hash2(vec2(st, ln + 7.))) - .5;
  vec2 d = vec2((r - rl) - jit.x * .26, (fract(arc) - .5 - jit.y * .4) / 1.55);
  float pr = step(.3, hash2(vec2(ln + 11., st))) * (1. - smoothstep(.05, .125, length(d * vec2(1.3, 1.))));
  return .05 * (lump - .5) * (1. - .6 * slab) + .022 * slab - .06 * pr;
}
void main(){
  vec2 q0 = vP.xz, q = q0; float dist = distance(uCamL, vP), r0 = length(q0);
  vec3 V = (uCamL - vP) / max(dist, 1e-3);
  vec2 sunXZ = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float lowSun = clamp(uSunDir.y * 3.4, .35, 1.), tanEl = uSunDir.y / max(length(uSunDir.xz), .05);
  // ---- the eye floor is a height field: march the line of sight into it, so bowls have depth and lips hide what is behind them
  float eyeK = smoothstep(63., 58., r0), hgt = 0., rel = 9., crSh = 0., tmp; vec2 cgrad = vec2(0.);
  if(eyeK > 0.){
    vec2 cw = cwarp(q0);
    float K = smoothstep(70., 35., dist) * smoothstep(.05, .2, V.y);
    if(K > .01){
      vec2 dv = V.xz / max(V.y, .05) * K;
      float hPrev = .17, dPrev = .1, hHit = -.36;
      for(int i = 0; i < 7; i++){
        float hh = .17 - .53 * float(i + 1) / 7., d = hh - craterH(q0 + cw + dv * hh, tmp);
        if(d <= 0.){ hHit = mix(hh, hPrev, clamp(d / min(d - dPrev, -1e-4), 0., 1.)); break; }
        hPrev = hh; dPrev = d;
      }
      q = q0 + dv * hHit;
    }
    hgt = craterH(q + cw, rel);
    cgrad = vec2(craterH(q + cw + vec2(.05, 0.), tmp) - hgt, craterH(q + cw + vec2(0., .05), tmp) - hgt) / .05;
    for(int i = 0; i < 4; i++){
      float t = .14 * float(i + 1) * (1. + .5 * float(i));
      crSh = max(crSh, smoothstep(0., .04, craterH(q + cw + sunXZ * t, tmp) - (hgt + t * tanEl)));
    }
  }
  float r = length(q), fwr = fwidth(r0);
  // broad soft drifts; flattened where hooves have packed the snow, calm in the eye
  float tr = smoothstep(59., 67., r) * smoothstep(215., 203., r), eyeM = smoothstep(63., 57., r);
  vec2 sq = q * vec2(.07, .13); float e = .3;
  float h0 = fbm2(sq), hx = fbm2(sq + vec2(e * .07, 0.)), hz = fbm2(sq + vec2(0., e * .13));
  float relief = mix(mix(.75, .8, eyeM), .32, tr) * lowSun;
  vec3 n = vec3(-(hx - h0) / e * relief, 1., -(hz - h0) / e * relief);
  // the arms as they stand now (printed on the snow further down): fresh churn under the animals, clean packed lanes between
  float ang = atan(-q.y, abs(q.x) < 1e-4 ? 1e-4 : q.x), om = speedOf(max(r, 1.)) / max(r, 1.);
  float a = fract((ang - om * (uClock - ${T_REF}.) + uArmPhase) * uArms / 6.28318 + r / uPeriod);
  float arm = max(smoothstep(0., .08, a) * smoothstep(.54, .45, a) * smoothstep(77., 82., r), smoothstep(81., 76., r)) * tr;
  // outside the trampled ring: sastrugi with their short shadows, and the trails down from the col. On the eastern side, where
  // the lens comes down off the slope, the wind has carved the snow again between the outer arms, and the trails run on to them
  float eastK = smoothstep(128., 150., r) * smoothstep(88., 128., q0.x) * (1. - smoothstep(.02, .5, arm));
  float fwq = length(fwidth(q0)) * .7, gK = max(1. - tr, .9 * eastK) * (1. - eyeM) * (1. - smoothstep(3., 6., fwq)), gSh = 0., gTr = 0.;
  if(gK > .001){
    vec3 gr = groundRelief(q0, sunXZ, tanEl, fwq, smoothstep(70., 12., dist));
    n.xz -= gr.xy * gK * (.55 + .45 * lowSun); gSh = gr.z * gK;
    gTr = clamp(-trailH(q0, fwq) * 9., 0., 1.) * gK;
  }
  if(eyeM > .001){      // small sharp drifts in the eye: short blue streaks, not long smears
    vec2 s2 = q * vec2(.22, .5) + 31.; float a0 = fbm2(s2), ax = fbm2(s2 + vec2(.03, 0.)), az = fbm2(s2 + vec2(0., .1));
    n.xz -= vec2(ax - a0, az - a0) / .2 * .7 * eyeM * lowSun * smoothstep(75., 18., dist);
  }
  n.xz -= cgrad;
  // near detail everywhere the lens comes low: crust plates, hoof pocks
  float nearD = smoothstep(42., 7., dist) * lowSun, pockM = 0.;
  if(nearD > .001){
    float dens = mix(.14 + .3 * smoothstep(.4, .65, vnoise2(q * .31 + 5.)), .3 + .4 * smoothstep(.3, .7, vnoise2(q * .45 + 9.)), tr), ee = clamp(dist * .004, .015, .12);
    float d0 = detailH(q, dens), dx = detailH(q + vec2(ee, 0.), dens), dz = detailH(q + vec2(0., ee), dens);
    n.xz -= vec2(dx - d0, dz - d0) / ee * nearD * (1. - .6 * smoothstep(.5, .3, rel));
    pockM = smoothstep(-.004, -.022, d0) * nearD;
  }
  n = normalize(n);
  // under the lens in the trampled ring: ruts worn along the rings and clods of churned snow, raked by the low sun
  float nearT = tr * smoothstep(55., 6., dist) * lowSun, clodT = smoothstep(24., 4., dist);
  if(nearT > .001){
    vec2 rdir = q / max(r, 1.);
    n = normalize(n + vec3(rdir.x, 0., rdir.y) * sin((r - ${R_IN}.) * ${(TAU / RING).toFixed(4)} + 2.2 * vnoise2(q * .23 + 61.)) * .04 * smoothstep(.25, .7, vnoise2(q * .17 + 7.)) * nearT * (1. - smoothstep(.5, 1.5, fwr))
      + vec3(vnoise2(q * 6.3 + 3.) - .5, 0., vnoise2(q * 6.3 + 17.) - .5) * .22 * nearT * clodT);
  }
  float chK = tr * smoothstep(27., 8., dist), chLow = 0., chHi = 0.;
  if(chK > .001){
    float ee = clamp(dist * .006, .02, .16), c0 = churnH(q), cx1 = churnH(q + vec2(ee, 0.)), cz1 = churnH(q + vec2(0., ee));
    n = normalize(n - vec3(cx1 - c0, 0., cz1 - c0) / ee * chK * lowSun);
    chLow = smoothstep(-.012, -.045, c0) * chK; chHi = smoothstep(.008, .03, c0) * chK;
  }
  float near = smoothstep(70., 8., dist);
  float churn = vnoise2(q * 1.7) * .6 + vnoise2(q * 5.9) * .4 * near;
  float groove = (.5 + .5 * cos((r - ${R_IN}.) * ${(TAU / RING).toFixed(4)})) * (1. - smoothstep(.5, 1.5, fwr));
  // what the pawing reaches: lichen cushions and heath on the bowl floors; the scoured islet round the erratic
  float floorM = 1. - smoothstep(.56, .74, rel + (vnoise2(q * 9.) - .5) * .25);
  float patchy = fbm2(q * .23 + 3.), islet = smoothstep(19., 11., r + (patchy - .5) * 10.) * uBoulder;
  float isletB = islet * smoothstep(.55, .6, fbm2(q * .9) + (vnoise2(q * 6.) - .5) * .16) * .8;
  float bare = max(max(floorM, isletB), uWet * tr * (1. - arm) * smoothstep(.5, .7, patchy));
  float cush = smoothstep(.5, .62, vnoise2(q * 5.1 + 40.) * .7 + vnoise2(q * 13. + 3.) * .3);
  vec3 soil = mix(uHeath * (.6 + .8 * vnoise2(q * 17.)), uLichen * (.85 + .4 * vnoise2(q * 23. + 9.)), cush);
  soil = mix(soil, uSnow * .8, smoothstep(.62, .75, vnoise2(q * 11. + 70.)) * .6 * floorM);             // crumbs of snow fallen in
  // light
  float ndl = dot(n, uSunDir), kk = clamp(ndl / max(uSunDir.y, .07), 0., 2.);
  vec3 alb = mix(uSnow, uWarm, .55 * smoothstep(1.15, 2., kk));
  alb *= 1. - tr * (.05 + .09 * arm + .1 * churn * (.4 + .6 * arm) + .02 * groove) - uWet * .12;
  // the arms printed on the snow: with distance the print goes toward the mean of the bodies with their shadows and the lit
  // snow between them (half and half at most), never to the tone of the bodies, so that arm and lane stay apart from far off
  alb = mix(alb, uShade * 1.5, min(.5, arm * (mix(.2, .36, smoothstep(14., 60., dist)) + .1 * churn) * (1. + 1.2 * smoothstep(50., 280., dist))));
  float pock = smoothstep(.62, .72, vnoise2(q * 9.5 + 17.) * .65 + vnoise2(q * 21. + 3.) * .35) * smoothstep(30., 5., dist) * tr;
  alb = mix(alb, uShade * 1.9, max(pock * .2, pockM * .22));
  alb = mix(alb, uShade * 1.75, chLow * .42) * (1. + .14 * chHi);          // blue prints and troughs, sunlit crumbs
  alb = mix(alb, uShade * 1.8, gTr * .42);
  float flow = vnoise2(q * vec2(.03, .24) + vec2(-uTime * 1.1, uTime * .05));
  alb *= 1. + (1. - tr) * (1. - eyeM) * .1 * smoothstep(.55, .9, flow);
  vec3 lit = alb * (.30 + .44 * pow(max(kk, 1e-3), .7));
  vec3 soilLit = soil * uSnow * 1.25 * (.3 + .7 * min(kk, 1.3));
  lit = mix(lit, soilLit, bare * .9);
  vec3 shade = mix(uShade, uShade * (soil * 1.6 + .4), bare * .9);
  float sh = 0.;
  if(uBoulder > .5 && r < 90.){
    vec2 d1 = capD(vP, uSunDir, uB1 + vec3(0., 1.5, 0.), uB1 + vec3(0., 8.4, 0.)), d2 = capD(vP, uSunDir, uB2 + vec3(0., 1.5, 0.), uB2 + vec3(0., 6.2, 0.));
    float n1 = (fbm2(q * .35) - .5) * 1.6;
    sh = max(1. - smoothstep(4.4, 5.2 + d1.y * .03, d1.x + n1), 1. - smoothstep(4.2, 5.0 + d2.y * .03, d2.x - n1));
  }
  vec3 c = mix(shade, lit, smoothstep(-.3, .62, kk) * (1. - sh * .96) * (1. - crSh * .94) * (1. - gSh * .9));
  // sparkle: fixed grains that flash as the view turns
  vec2 gi = floor(q * 27.); float gh = hash2(gi);
  float gl = step(.985, gh) * pow(max(sin(gh * 911. + dot(V.xz, vec2(31., 23.)) + V.y * 47.), 0.), 24.) * smoothstep(34., 5., dist) * (1. - sh) * (1. - bare) * (1. - crSh);
  c += uGold * gl * uGlint;
  if(uDrift > 0.){
    // ground blizzard: the snow surface is seen through a flowing layer; bright ribbons stream downwind over a bluer ground
    vec2 w = q0 * vec2(.036, .58) + vec2(-uTime * .7, uTime * .03);
    float a1 = vnoise2(w), a2 = vnoise2(w * vec2(2.3, 2.9) + vec2(-uTime * 1.4, 7.)), a3 = vnoise2(w * vec2(5.1, 9.) + vec2(-uTime * 2.6, 3.));
    float rib = smoothstep(.53, .7, a1 * .55 + a2 * .4 + a3 * .22 * smoothstep(90., 10., dist));
    float fs = pow(max(dot(-V.xz / max(length(V.xz), 1e-3), sunXZ), 0.), 2.);
    float nearB = smoothstep(260., 40., dist);       // from the air the flowing layer thins, so the spiral still reads through it
    c = mix(c, uShade * 1.2 + uSnow * .1, uDrift * (.36 + .26 * nearB));
    c = mix(c, uSnow * .86 + uGold * (.06 + .24 * fs), min(1., uDrift * 1.15) * rib * (.45 + .55 * nearB));
  }
  c = hazeMix(c, vP, uCamL, uSunDir);
  gl_FragColor = vec4(c, 1. - smoothstep(300., 338., r0));
  #include <fog_fragment>
}`;

// Breath, kicked powder and the standing wreath of steam: one instanced billboard draw.
// iS = (type 0 breath | 1 powder | 2 wreath | 3 ground haze | 4 steam round the erratic, phase, size, random)
const PUFF_VERT = /* glsl */`
#include <fog_pars_vertex>
${HERD_GLSL}
attribute vec4 iS;
uniform vec3 uCamL, uCamR, uCamU, uSunDir, uGold, uPuffLit, uPuffShade; uniform float uHaze; uniform vec4 uNear;
varying vec2 vUv; varying vec4 vCol, vLd; varying float vSeed, vFs;
void main(){
  float type = iS.x, sc = iA.z, v, size, alpha, nearA, nearB, wide = 1.; vec3 base, fwd, pos;
  if(type < 1.5){
    slotFrame(uClock, base, fwd, v);
    float run = step(.5, v), period = run > .5 ? strideOf(v) * sc / max(v, .1) : 3.4, m = (type < .5 && run > .5) ? 3. : 1.;
    float cyc = run > .5 ? cycOf(v) : uTime / period + iA.w * 17.;
    float f = fract(cyc / m + iS.y), age = f * m * period;
    // (the breath of the young animals' file, iS.z > 1.2, is dragged along in each one's wake: a plume, not a string of puffs)
    slotFrame(uClock - age * run * (type < .5 && iS.z > 1.2 ? .2 : 1.), base, fwd, v);
    vec3 side = normalize(vec3(fwd.z, 0., -fwd.x));
    if(type < .5){
      float lie = lieOf();
      // a jet ahead of the muzzle, no larger than the head; a runner leaves it behind, so it lifts clear of the back as it goes
      pos = base + fwd * (1.52 * sc) + vec3(0., (.98 - .34 * lie) * sc, 0.);
      pos += fwd * (.5 * (1. - exp(-4. * age))) + vec3(.5 * age, .08 + (run > .5 ? 1.5 : .4) * age, 0.) + side * ((iS.w - .5) * (.34 + .5 * age));
      size = sc * iS.z * (.08 + (run > .5 ? .27 : .3) * pow(min(age, .8), .7));
      alpha = smoothstep(0., .06, f) * pow(1. - f, 1.6) * (run > .5 ? .5 : .3) * (.55 + .45 * iS.z);
      if(iS.z > 1.2){
        // the young animals' file: a plume no larger than the head, let out on the sun side of the muzzle and trailing back and up
        // over the neck, so that head, eye and muzzle stay dark and sharp against the glow
        float sg = dot(side, uSunDir) > 0. ? 1. : -1.;
        pos = base + fwd * (1.5 * sc - .45 * age) + vec3(0., 1.02 * sc + .05 + .78 * age, 0.) + side * (sg * (.22 + .3 * age) + (iS.w - .5) * .16);
        size = sc * (.075 + .2 * pow(min(age, .8), .7));
        alpha = smoothstep(0., .05, f) * smoothstep(.95, .3, f) * .5;
      }
    } else {
      float tk = smoothstep(1.2, 9., v);
      pos = base + fwd * ((iS.y < .25 ? .55 : -.45) * sc - .7 * age * (.4 + tk)) + side * ((iS.w - .5) * (.5 + age));
      // powder stays below the belly line
      pos.y = base.y + .06 + (2.2 * age - 3.4 * age * age) * (.25 + .5 * iS.w) * (.4 + tk);
      pos.x += .5 * age;
      size = sc * (.15 + .68 * age) * (.5 + .6 * tk); wide = 1.7;
      alpha = smoothstep(0., .1, f) * (1. - f) * .6 * tk * run * (1. + .3 * smoothstep(9., 4., uCamL.y));
    }
    nearA = .9; nearB = 2.6;
  } else if(type > 3.5){
    // steam round the erratic: the breath of the animals of the eye hangs in the calm air before the cleft, and where the
    // rock stands in the sun it curls up the lit faces. iA.xyz = where a billow starts, iB = (how far it rises, drift x, drift z, seconds)
    float f = fract(uTime / iB.w + iS.y);
    pos = iA.xyz + vec3(iB.y * f, iB.x * pow(f, .8), iB.z * f);
    size = iS.z * (.8 + .9 * f);
    alpha = min(uHaze, 1.5) * .15 * smoothstep(0., .25, f) * smoothstep(1., .4, f);
    nearA = 4.; nearB = 12.;
  } else if(type > 2.5){
    // the knee-high haze of kicked-up snow that rolls round with the herd: low wide billows, gold against the sun
    float r = iA.x, f = fract(uTime / 11. + iA.w), th = iA.y + .5 * speedOf(r) / r * uClock;
    pos = vec3(r * cos(th) + 3. * f, .2 + .3 * f, -r * sin(th));
    size = iA.z * (.8 + .3 * f); wide = 4.6;
    alpha = uHaze * iS.z * smoothstep(0., .25, f) * smoothstep(1., .5, f) * mix(1., .35, smoothstep(4.5, 13., uCamL.y));
    nearA = 5.; nearB = 16.;
  } else {
    float r = iA.x, f = fract(uTime / 30. + iA.w), th = iA.y + .55 * speedOf(r) / r * uClock * (1. - iB.x);      // iB.x = 1: the standing curtain on the sun side
    pos = vec3(r * cos(th) + 24. * f, 2. + mix(25., 12., iB.x) * pow(f, .8), -r * sin(th));
    size = iA.z * (.65 + .7 * f);
    alpha = uHaze * iS.z * smoothstep(0., .2, f) * smoothstep(1., .55, f);
    nearA = 16.; nearB = 55.;
  }
  vec3 toP = pos - uCamL; float dist = length(toP); vec3 vd = toP / max(dist, 1e-3);
  alpha *= smoothstep(nearA, nearB, dist) * (type > 1.5 ? 1. : mix(1., .55, smoothstep(22., 75., dist)));
  // the sprites dealt to the animals beside the lens come in with nearness (iB.w = 1: the second half of them, which come in nearer still)
  // (beside the lens the powder at the hooves and the jets of breath stand out a little more than across the lake)
  if(uNear.x > 0.) alpha *= smoothstep(uNear.x, uNear.y, dist) * mix(1., smoothstep(uNear.z, uNear.w, dist), step(.5, iB.w)) * (type > .5 ? 1.35 : 1.15);
  float fs = pow(max(dot(vd, uSunDir), 0.), 6.), back = 0.;
  // against the sun breath and kicked powder light up: larger, denser, gold
  if(type < 1.5){ float bl = pow(max(dot(vd, uSunDir), 0.), 2.5); size *= 1. + .45 * bl * (type < .5 && iS.z > 1.2 ? 0. : 1.); alpha = min(alpha * (1. + 1.1 * bl), .8); }
  float cloud = type < 1.5 ? 1. : 0., steam = type > 3.5 ? 1. : 0.;
  if(cloud + steam < .5){
    // looked at toward the sun the wreath lights up: a gold wall of steam and powder between the herd and the taiga
    back = pow(max(dot(vd, uSunDir), 0.), 3.) * smoothstep(30., 13., uCamL.y);
    // looked down through, the wreath is thin; the farther a billow stands from the lens the denser it is drawn (the one rule
    // of distance, FAR_GLSL); the curtain (iB.x = 1) shows against the sun, and its eastern end stands only for a lens above the antlers
    alpha *= mix(1., .4, abs(vd.y)) * (1. + 1.5 * K_FAR * farOf(dist)) * mix(1., .12 + 1.2 * back, iB.x) * mix(1., smoothstep(2.5, 3.8, uCamL.y), iB.x * step(-1.69, iA.y));
    // from among the animals one looks along the wreath through many billows: thinner there, so that the taiga and the sky stand behind it
    alpha *= mix(.42, .5, smoothstep(4.5, 14., uCamL.y));
    alpha = min(alpha, mix(.7, .3, iB.x));      // the curtain glows, it does not wall off the taiga and the sky behind it
  }
  if(alpha < .004) size = 0.;
  vec3 pc = mix(uPuffShade, uPuffLit, .72 + .28 * iS.w);
  // breath and powder are lit as small clouds in the fragment shader (sun side, shade side, a glow against the sun); the wreath and
  // the steam round the erratic stay soft veils, pale where the sun is behind the lens and gold where the lens looks toward it
  pc = steam > .5 ? uPuffLit * (.96 + .12 * iS.w) + uGold * .55 * fs : cloud < .5 ? mix(pc + uGold * .5 * fs, uGold * .62 + uPuffLit * .42, back * (.55 + .45 * iB.x)) : uPuffLit * (1.22 + .14 * iS.w);
  vCol = vec4(pc, alpha); vFs = cloud * fs;
  vLd = vec4(dot(uSunDir, uCamR), dot(uSunDir, uCamU), -dot(uSunDir, vd), cloud);
  vUv = position.xy; vSeed = iS.w * 37. + iA.w * 11.;
  vec3 lp = pos + (uCamR * (position.x * wide) + uCamU * position.y) * size;
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
#include <fog_pars_fragment>
${NOISE_GLSL}
uniform vec3 uPuffShade, uGold;
varying vec2 vUv; varying vec4 vCol, vLd; varying float vSeed, vFs;
void main(){
  float d = length(vUv), n = vnoise2(vUv * 2.2 + vSeed) * .6 + vnoise2(vUv * 5. - vSeed) * .4;
  float a = vCol.a * smoothstep(1., .15, d + (n - .5) * .5);
  if(a < .002) discard;
  vec3 c = vCol.rgb * (.85 + .3 * n);
  if(vLd.w > .5){
    vec3 nn = vec3(vUv, sqrt(max(1. - d * d, 0.)));
    float wrap = dot(nn, vLd.xyz) * .5 + .5 + (n - .5) * .35;
    c = mix(uPuffShade * (.84 + .3 * n), vCol.rgb * (.9 + .22 * n), smoothstep(.3, .72, wrap));
    c += vCol.rgb * .45 * smoothstep(0., -.8, vLd.z) * smoothstep(.3, .95, d) + uGold * 2.2 * vFs * (.45 + .6 * n);
  }
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the frost-split erratic
const ROCK_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute float aEdge; attribute vec2 aTone;
varying vec3 vP, vN; varying float vEdge; varying vec2 vTone;
void main(){ vP = position; vN = normal; vEdge = aEdge; vTone = aTone; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// Frost-split granite: every face is a flat fracture plane with its own tone, every block has its own (vTone.x), and a
// face is either the old weathered skin (dark, varnished, lichened) or a pale clean break (vTone.y); joints are a few
// straight dark cracks; lichen sits in patches; ledges hold snow; hoar furs the windward (west) side, the faces the sun
// does not reach and the arrises.
const ROCK_FRAG = /* glsl */`
#include <fog_pars_fragment>
${NOISE_GLSL}
${CAP_GLSL}
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uSnow, uShade, uRock, uLichen, uGold, uCamL, uB1, uB2;
uniform vec2 uCleft;
varying vec3 vP, vN; varying float vEdge; varying vec2 vTone;
void main(){
  vec3 Nf = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamL - vP + vec3(0., 1e-4, 0.));
  float tone = clamp(vTone.x, .5, 1.3), fresh = clamp(vTone.y, 0., 1.);
  float dist = distance(uCamL, vP), near = smoothstep(60., 10., dist);
  // one tone per fracture plane, then grain: feldspar, quartz and biotite flecks
  float face = hash3(floor(Nf * 6. + .5) + floor(dot(vP, Nf) * .7));
  // (grain finer than the eye resolves goes to its mean between 25 m and 60 m: from across the eye a face is a plane with one tone)
  float farR = smoothstep(25., 60., dist);
  float big = vnoise(vP * .3), mid = vnoise(vP * 2.1 + 7.), fine = mix(vnoise(vP * 9.) * .6 + vnoise(vP * 31.) * .4, .5, farR);
  vec3 alb = uRock * (.62 + .5 * face) * (.76 + .42 * big) * (.9 + .2 * mid) * tone;
  // the old skin is darker and browner (rock varnish, rain streaks down the face); a new break is pale and clean
  float streak = vnoise(vP * vec3(1.3, .16, 1.3) + 61.);
  alb = mix(alb * vec3(.68, .62, .58) * (.76 + .44 * streak), alb * vec3(1.3, 1.27, 1.24) + .015, fresh);
  float zone = smoothstep(.3, .62, vnoise(vP * .5 + 11.)) * (1. - .6 * fresh);      // the speckle comes in patches, not evenly
  alb *= 1. + (fine - .5) * .4 * near;
  alb = mix(alb, uRock * vec3(1.5, 1.32, 1.2), smoothstep(.62, .7, vnoise(vP * 14. + 3.)) * .34 * near * zone);       // pale feldspar
  alb = mix(alb, vec3(.03), smoothstep(.7, .76, vnoise(vP * 23. + 40.)) * .4 * near * zone);                          // biotite
  // three joint sets: sheeting near the horizontal and two steep ones; a few wide dark cracks, broken by a mask
  float w = .028 + .0025 * dist;
  float j1 = abs(fract(dot(vP, vec3(.06, .31, -.04)) + .08 * mid) - .5) / .31, j2 = abs(fract(dot(vP, vec3(.21, .03, .14)) + .1 * big) - .5) / .25, j3 = abs(fract(dot(vP, vec3(-.12, .02, .2)) + .09 * mid) - .5) / .23;
  float crack = max(smoothstep(w, w * .3, j1) * step(.42, vnoise(vP * .23 + 3.)), max(smoothstep(w, w * .3, j2) * step(.5, vnoise(vP * .19 + 9.)), smoothstep(w, w * .3, j3) * step(.55, vnoise(vP * .21 + 15.))));
  alb *= 1. - .78 * crack;
  // bump: the plane is rough at close range
  vec3 N = normalize(Nf + (vec3(vnoise(vP * 5. + 1.), vnoise(vP * 5. + 17.), vnoise(vP * 5. + 31.)) - .5) * .32 * near + (vec3(mid, big, fine) - .5) * .1);
  // lichen in patches: grey-green crusts, a little yellow map lichen, dark seep streaks below ledges
  float lp = smoothstep(.56, .62, vnoise(vP * .9 + 20.) + (fine - .5) * .3) * smoothstep(-.6, .2, Nf.y) * mix(smoothstep(.3, .55, vnoise(vP * 5.3 + 4.)), .5, farR);
  alb = mix(alb, uLichen * (.75 + .5 * fine), lp * .7 * (1. - .85 * fresh));
  float yl = smoothstep(.7, .74, vnoise(vP * 2.3 + 55.) + (fine - .5) * .34) * mix(smoothstep(.35, .6, vnoise(vP * 7. + 12.)), .5, farR);
  alb = mix(alb, vec3(.3, .29, .12), yl * .55 * (1. - fresh));
  alb *= 1. - .4 * smoothstep(.55, .8, vnoise(vP * vec3(1.9, .22, 1.9) + 80.)) * smoothstep(.5, -.2, Nf.y);
  // arrises: fresh pale chips along the edges of each plane
  float edge = smoothstep(.1, .0, vEdge + (fine - .5) * .08);
  alb = mix(alb, uRock * 1.5, edge * .35);
  // snow on what faces the sky, hoar on the windward faces and along the arrises
  float cap = smoothstep(.56, .74, Nf.y + (vnoise(vP * .8) - .5) * .3 + (fine - .5) * .1);      // (steep broken roofs keep only patches)
  float lee = max(smoothstep(.2, .85, -Nf.x), .35 * smoothstep(.15, .7, -dot(Nf, uSunDir)));
  // (hoar in patches at close range; from across the eye a veil that thickens toward the top of each face)
  float hoar = lee * mix(smoothstep(.4, .62, vnoise(vP * 2.6 + 70.) + edge * .5 + (fine - .5) * .3), .22 + .5 * smoothstep(1., 11., vP.y), farR) * .75;
  float foot = smoothstep(.06, -.06, vP.y - .25 - 1.1 * vnoise(vP * .7 + 33.) - (fine - .5) * .3);                                // snow plastered on the foot
  float sn = max(max(cap, hoar), foot);
  // the other half's shadow (the sun is low: the sunlit half shades the cleft)
  float bx = vP.x * uCleft.y - vP.z * uCleft.x, sh = 0.;
  if(dot(Nf, uSunDir) > 0.){
    vec3 ro = vP + Nf * .05;
    if(bx > 0.){ vec2 d1 = capD(ro, uSunDir, uB1 + vec3(0., 1.5, 0.), uB1 + vec3(0., 9.4, 0.)); sh = (1. - smoothstep(3.2, 4.0 + d1.y * .03, d1.x + (big - .5) * 1.2)) * step(.3, d1.y); }
  }
  float ndl = dot(N, uSunDir), dif = max(ndl, 0.) * (1. - sh);
  float ao = mix(.5, 1., smoothstep(0., 4., vP.y)) * mix(.75, 1., smoothstep(0., .25, vEdge));
  vec3 rock = alb * (mix(uBounce * 1.3, uSkyCol, N.y * .5 + .5) * ao + uSunCol * dif * .62);
  float kk = clamp(ndl / max(uSunDir.y, .07), 0., 2.) * (1. - sh);
  vec3 snow = mix(uShade, uSnow * (.30 + .44 * pow(max(kk, 1e-3), .7)), smoothstep(0., .5, kk));
  vec3 c = mix(rock, snow, sn);
  c += uSkyCol * .2 * pow(1. - max(dot(N, V), 0.), 3.);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// The drift banked against the erratic: the snow recipe on a real surface
const MOUND_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute float aOcc;
varying vec3 vP, vN; varying float vOcc;
void main(){ vP = position; vN = normal; vOcc = aOcc; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MOUND_FRAG = /* glsl */`
#include <fog_pars_fragment>
${NOISE_GLSL}
${CAP_GLSL}
uniform vec3 uSunDir, uGold, uCamL, uSnow, uWarm, uShade, uB1, uB2; uniform float uGlint;
varying vec3 vP, vN; varying float vOcc;
float rip(vec2 p){ return .7 * vnoise2(p * vec2(.9, 3.1)) + .14 * smoothstep(.35, .65, vnoise2(p * 2.3 + 9.)) + .1 * vnoise2(p * 13.); }
void main(){
  vec2 q = vP.xz; float dist = distance(uCamL, vP); vec3 V = (uCamL - vP) / max(dist, 1e-3);
  float lowSun = clamp(uSunDir.y * 3.4, .35, 1.), ee = clamp(dist * .004, .02, .15);
  float r0 = rip(q), rx = rip(q + vec2(ee, 0.)), rz = rip(q + vec2(0., ee));
  vec3 n = normalize(normalize(vN + vec3(0., 1e-5, 0.)) - vec3(rx - r0, 0., rz - r0) / ee * .07 * lowSun * smoothstep(60., 6., dist));
  float ndl = dot(n, uSunDir), kk = clamp(ndl / max(uSunDir.y, .07), 0., 2.);
  vec3 alb = mix(uSnow, uWarm, .55 * smoothstep(1.15, 2., kk));
  vec3 lit = alb * (.30 + .44 * pow(max(kk, 1e-3), .7));
  vec2 d1 = capD(vP, uSunDir, uB1 + vec3(0., 1.5, 0.), uB1 + vec3(0., 8.4, 0.)), d2 = capD(vP, uSunDir, uB2 + vec3(0., 1.5, 0.), uB2 + vec3(0., 6.2, 0.));
  float n1 = (fbm2(q * .35) - .5) * 1.6;
  float sh = max(1. - smoothstep(4.4, 5.2 + d1.y * .03, d1.x + n1), 1. - smoothstep(4.2, 5.0 + d2.y * .03, d2.x - n1));
  vec3 c = mix(uShade, lit, smoothstep(0., .5, kk) * (1. - sh * .96));
  c = mix(c, uShade * 1.02, vOcc * .78);                  // the blue hollow under a lying animal
  vec2 gi = floor(q * 27.); float gh = hash2(gi);
  c += uGold * uGlint * (1. - vOcc) * step(.985, gh) * pow(max(sin(gh * 911. + dot(V.xz, vec2(31., 23.)) + V.y * 47.), 0.), 24.) * smoothstep(34., 5., dist) * (1. - sh);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// A joint-bounded granite block: the unit cube cut by oblique fracture planes (exact convex clipping, so flat faces
// meet at hard edges). Returns polygons { n, pts, f } in unit space, wound anticlockwise seen from outside; f = how fresh
// the break is (0 = the old weathered skin of the block, 1 = a pale new fracture).
function cutBox(cuts) {
  const F = (n, a, b, c, d) => ({ n, pts: [a, b, c, d], f: 0 });
  const c = (x, y, z) => [x, y, z];
  let polys = [
    F([1, 0, 0], c(1, -1, -1), c(1, 1, -1), c(1, 1, 1), c(1, -1, 1)), F([-1, 0, 0], c(-1, -1, 1), c(-1, 1, 1), c(-1, 1, -1), c(-1, -1, -1)),
    F([0, 1, 0], c(-1, 1, 1), c(1, 1, 1), c(1, 1, -1), c(-1, 1, -1)), F([0, -1, 0], c(-1, -1, -1), c(1, -1, -1), c(1, -1, 1), c(-1, -1, 1)),
    F([0, 0, 1], c(-1, -1, 1), c(1, -1, 1), c(1, 1, 1), c(-1, 1, 1)), F([0, 0, -1], c(1, -1, -1), c(-1, -1, -1), c(-1, 1, -1), c(1, 1, -1))];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const [n, h, fr] of cuts) {
    const cap = [], out = [];
    for (const poly of polys) {
      const res = [], P = poly.pts, m = P.length;
      for (let i = 0; i < m; i++) {
        const a = P[i], b = P[(i + 1) % m], da = dot(a, n) - h, db = dot(b, n) - h;
        if (da <= 0) res.push(a);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; res.push(p); cap.push(p); }
      }
      if (res.length >= 3) out.push({ n: poly.n, pts: res, f: poly.f });
    }
    if (cap.length >= 3) {
      const ce = [0, 0, 0]; for (const p of cap) { ce[0] += p[0] / cap.length; ce[1] += p[1] / cap.length; ce[2] += p[2] / cap.length; }
      const ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = [ref[1] * n[2] - ref[2] * n[1], ref[2] * n[0] - ref[0] * n[2], ref[0] * n[1] - ref[1] * n[0]], v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      const ang = (p) => Math.atan2((p[0] - ce[0]) * v[0] + (p[1] - ce[1]) * v[1] + (p[2] - ce[2]) * v[2], (p[0] - ce[0]) * u[0] + (p[1] - ce[1]) * u[1] + (p[2] - ce[2]) * u[2]);
      cap.sort((a, b) => ang(a) - ang(b));
      const pts = []; for (const p of cap) { const q = pts[pts.length - 1]; if (!q || Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) > 1e-5) pts.push(p); }
      if (pts.length >= 3) out.push({ n, pts, f: fr ?? 0.6 });
    }
    polys = out;
  }
  return polys;
}
// write one block (unit-space polygons under matrix M) as fans; aEdge = approximate distance to the face's own edge, metres
function emitBlock(out, polys, M, tone) {
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ce = new THREE.Vector3(), nn = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (const poly of polys) {
    const W = poly.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(M)), m = W.length;
    ce.set(0, 0, 0); for (const p of W) ce.addScaledVector(p, 1 / m);
    nn.set(0, 0, 0); for (let i = 0; i < m; i++) { e1.subVectors(W[i], ce); e2.subVectors(W[(i + 1) % m], ce); nn.add(e1.cross(e2)); }
    if (nn.lengthSq() < 1e-10) continue; nn.normalize();
    let inr = 1e9; for (let i = 0; i < m; i++) { e1.subVectors(W[(i + 1) % m], W[i]); const l = e1.length(); if (l < 1e-6) continue; e2.subVectors(ce, W[i]); inr = Math.min(inr, e2.cross(e1).length() / l); }
    for (let i = 0; i < m; i++) {
      a.copy(ce); b.copy(W[i]); c.copy(W[(i + 1) % m]);
      out.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); out.n.push(nn.x, nn.y, nn.z, nn.x, nn.y, nn.z, nn.x, nn.y, nn.z); out.e.push(inr, 0, 0); out.t.push(tone, poly.f, tone, poly.f, tone, poly.f);
    }
  }
}

// The erratic: two leaning halves of frost-split granite, each a stack of joint-bounded blocks (a tall slab whose
// inner face is the planar wall of the cleft, a buttress, split-off plates, a perched block), talus at the foot,
// and a drift of snow banked against the rock and through the cleft. Boulder frame: +Z = out of the cleft toward
// the arriving camera, +X = the camera's right; the tall half is at -X (the sunlit side).
async function boulderGeometry(FK, noise, cleft, pause) {
  const [cx, cz] = cleft, out = { p: [], n: [], e: [], t: [] }, halves = [];
  const toLocal = new THREE.Matrix4().makeBasis(new THREE.Vector3(cz, 0, -cx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(cx, 0, cz));
  const M = new THREE.Matrix4(), T = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler();
  const norm = (n) => { const l = Math.hypot(n[0], n[1], n[2]); return [n[0] / l, n[1] / l, n[2] / l]; };
  const block = (r, c, h, rot, cuts, lean) => {
    M.compose(new THREE.Vector3(c[0], c[1], c[2]), q.setFromEuler(eu.set(rot[0], rot[1], rot[2])), new THREE.Vector3(h[0], h[1], h[2]));
    if (lean) { T.makeTranslation(lean[0], 0, 0).multiply(new THREE.Matrix4().makeRotationZ(-lean[1])).multiply(new THREE.Matrix4().makeTranslation(-lean[0], 0, 0)); M.premultiply(T); }
    M.premultiply(toLocal);
    emitBlock(out, cutBox(cuts), M, 0.78 + 0.4 * r());
  };
  // fracture sets: top corners and edges go first (frost), a few vertical edges are chamfered
  const cutsFor = (r, nTop, nSide, sx, keepInner) => {
    const cs = [];
    for (let i = 0; i < nTop; i++) { let nx = r.range(0.35, 1) * r.sign(); if (keepInner && nx * sx < 0 && i > 0) nx = -nx; cs.push([norm([nx, r.range(0.5, 1.1), r.range(0.3, 1) * r.sign()]), r.range(1.02, 1.3)]); }
    for (let i = 0; i < nSide; i++) { let nx = r.range(0.6, 1) * r.sign(); if (keepInner && nx * sx < 0) nx = -nx; cs.push([norm([nx, r.range(-0.12, 0.2), r.range(0.6, 1) * r.sign()]), r.range(1.14, 1.32)]); }
    return cs;
  };
  // no block keeps a level top: three fracture planes, a third of a turn apart and each at its own pitch, break it to an
  // uneven point or ridge (k = pitch in the block's own proportions, h = how far below the old top the planes meet)
  const roofFor = (r, k0, k1, h0, h1) => {
    const cs = [], a0 = r() * TAU;
    for (let i = 0; i < 3; i++) { const a = a0 + i * TAU / 3 + r.range(-0.35, 0.35), k = r.range(k0, k1), l = Math.hypot(k, 1); cs.push([[Math.cos(a) * k / l, 1 / l, Math.sin(a) * k / l], r.range(h0, h1) / l, r() < 0.5 ? r.range(0.5, 1) : 0]); }
    return cs;
  };
  // ... and its sides lean in toward the top (never the wall of the cleft)
  const taperFor = (r, sx, keepInner, t0, t1) => {
    const cs = [];
    for (const [ax, sg] of [[0, 1], [0, -1], [2, 1], [2, -1]]) {
      if (keepInner && ax === 0 && sg * sx < 0) continue;
      const t = r.range(t0, t1), n = [0, t, 0], l = Math.hypot(1, t); n[ax] = sg;
      cs.push([[n[0] / l, n[1] / l, n[2] / l], (1 - t * r.range(0.1, 0.9)) / l, 0]);
    }
    return cs;
  };
  for (const sx of [-1, 1]) {
    const r = FK['half' + sx], tall = sx < 0, H = tall ? 13 : r.range(11.2, 11.8), hx = r.range(2.75, 3.05), hz = r.range(5.3, 5.8), lean = r.range(0.09, 0.15), x0 = sx * (4.1 + hx);
    // the main slab: inner face planar (the wall of the cleft), top broken to a leaning point
    const cuts = [...taperFor(r, sx, true, 0.1, 0.24), ...roofFor(r, 0.28, 0.55, 0.5, 0.8), ...cutsFor(r, 5, 2, sx, true)];
    cuts.push([norm([-sx * 0.5, 1, r.range(-0.2, 0.2)]), 1.26]);                     // the inner top edge is broken back a little
    block(r, [x0, H / 2 - 0.7, r.range(-0.3, 0.3)], [hx, H / 2 + 0.7, hz], [0, sx * r.range(-0.04, 0.04), 0], cuts, [sx * 4.1, sx * lean]);
    await pause();
    // buttress on the outside: a lower step, its top a ledge for snow
    const bh = H * r.range(0.26, 0.34);
    block(r, [sx * (4.1 + 2 * hx + 0.5), bh - 0.6, r.range(-1.6, 0.6)], [r.range(1.5, 1.9), bh + 0.6, r.range(3.2, 4)], [0, sx * r.range(0.1, 0.28), sx * r.range(0.03, 0.09)], [...taperFor(r, sx, false, 0.12, 0.3), ...roofFor(r, 0.2, 0.42, 0.72, 0.92), ...cutsFor(r, 4, 2, sx, false)], null);
    // a plate split off the front, standing a hand's breadth proud of the slab and lower: stepped ledges
    const ph = H * r.range(0.3, 0.42);
    block(r, [x0 + sx * r.range(0.5, 1.1), ph - 0.6, hz + 0.55], [hx * r.range(0.7, 0.85), ph + 0.6, r.range(0.75, 1.05)], [r.range(0.02, 0.07), sx * r.range(-0.12, 0.12), 0], [...roofFor(r, 0.25, 0.5, 0.6, 0.88), ...cutsFor(r, 4, 1, sx, true)], [sx * 4.1, sx * lean * 0.6]);
    // a second, lower step in front of that one
    block(r, [x0 + sx * r.range(1.2, 1.9), ph * 0.4 - 0.5, hz + 1.9], [hx * 0.55, ph * 0.4 + 0.5, r.range(0.7, 0.9)], [r.range(0.05, 0.12), sx * r.range(-0.3, 0.3), sx * 0.05], [...roofFor(r, 0.2, 0.4, 0.7, 0.92), ...cutsFor(r, 4, 1, sx, false)], null);
    // rear block
    const rh = H * r.range(0.22, 0.3);
    block(r, [x0 + sx * r.range(-0.2, 0.8), rh - 0.6, -hz - 0.9], [hx * 0.8, rh + 0.6, r.range(1.1, 1.5)], [-r.range(0.03, 0.09), sx * r.range(-0.15, 0.15), 0], [...roofFor(r, 0.25, 0.5, 0.6, 0.9), ...cutsFor(r, 4, 1, sx, true)], null);
    await pause();
    // a perched block on the tall half, a wedge on the other
    // (each lodged in the broken top of its slab, a pointed capstone, not a box set on a shelf)
    if (tall) block(r, [x0 + sx * 0.4, H * 0.79, -1.2], [1.5, 1.25, 2.0], [0.05, 0.5, -0.1], [...taperFor(r, sx, false, 0.15, 0.3), ...roofFor(r, 0.3, 0.6, 0.45, 0.75), ...cutsFor(r, 3, 2, sx, false)], [sx * 4.1, sx * lean]);
    else block(r, [x0 + sx * 0.9, H * 0.76, 1.3], [1.3, 1.05, 1.7], [-0.08, -0.4, 0.14], [...taperFor(r, sx, false, 0.15, 0.3), ...roofFor(r, 0.3, 0.6, 0.45, 0.75), ...cutsFor(r, 3, 1, sx, false)], [sx * 4.1, sx * lean]);
    // talus: angular fallen blocks, half buried, never in the aisle
    for (let i = 0; i < 7; i++) {
      const front = i < 3, s = front ? r.range(0.35, 0.62) : r.range(0.45, 1.15);
      const bx = front ? sx * r.range(4.6, 7.6) : sx * r.range(7.5, 13.5), bz = front ? hz + r.range(2.6, 4.4) : r.range(-9, 7.5);
      if (sx < 0 && Math.hypot(bx + 6.1, bz - 10.6) < 2.6) continue;                     // where the white cow stands
      block(r, [bx, s * r.range(0.1, 0.45), bz], [s * r.range(0.8, 1.5), s * r.range(0.6, 1), s * r.range(0.8, 1.4)], [r.range(-0.5, 0.5), r() * TAU, r.range(-0.5, 0.5)], cutsFor(r, 3, 2, sx, false), null);
    }
    halves.push(new THREE.Vector3(sx * (4.1 + hx + 0.6), 0, 0).applyMatrix4(toLocal));
    await pause();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out.n, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(out.e, 1)); g.setAttribute('aTone', new THREE.Float32BufferAttribute(out.t, 2));
  // the drift: a polar sheet, banked against the rock and saddled through the cleft, sinking under the snow disc at its rim
  const NR = 26, NA = 96, dp = new Float32Array((NR + 1) * NA * 3), di = [], v = new THREE.Vector3();
  const rectD = (x, z, ox, hxr, hzr) => Math.hypot(Math.max(Math.abs(x - ox) - hxr, 0), Math.max(Math.abs(z) - hzr, 0));
  const driftH = (x, z) => {
    const d = Math.min(rectD(x, z, -7.4, 3.5, 6.6), rectD(x, z, 7.4, 3.5, 6.6)), rr = Math.hypot(x, z);
    const lump = 0.5 + 0.5 * noise.fbm2(x * 0.22 + 40, z * 0.22, 3), fine = noise.n2(x * 0.9, z * 0.9 + 7);
    let h = (0.75 + 0.75 * lump) * Math.exp(-d / 1.7) + 0.05 * fine * Math.exp(-d / 4);
    h += 0.45 * Math.exp(-(x * x) / 30) * smoothstep(13, 6, Math.abs(z)) * (0.6 + 0.8 * lump);     // the saddle through the cleft
    return h * smoothstep(17, 9.5, rr + 2.5 * (lump - 0.5)) - 0.07 * smoothstep(10, 17, rr);
  };
  for (let j = 0, k = 0; j <= NR; j++) for (let i = 0; i < NA; i++, k += 3) {
    const rr = 17 * Math.pow(j / NR, 0.8), a = (i / NA) * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    v.set(x, driftH(x, z), z).applyMatrix4(toLocal); dp[k] = v.x; dp[k + 1] = v.y; dp[k + 2] = v.z;
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA, c = a + NA, d = b + NA; di.push(a, b, c, b, d, c); }
  await pause();
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('aOcc', new THREE.BufferAttribute(new Float32Array(dp.length / 3), 1)); dg.setIndex(di); dg.computeVertexNormals();
  return { geometry: g, halves, drift: dg };
}

// Snow beds: every animal that lies in the eye rests in a dished hollow with a raised, lumpy rim of pressed snow, so the
// body meets the snow in a curve (never the flat lake plane) and sits in its own blue contact shadow.
async function bedGeometry(rows, noise, sun, pause) {
  const P = [], O = [], I = [], SEG = 16, RHO = [0, 0.5, 0.8, 1.03, 1.42, 2.05], Y = [0.012, 0.03, 0.062, 0.095, 0.04, -0.03], OC = [0.9, 0.8, 0.42, 0.05, 0, 0];
  const sl = Math.hypot(sun.x, sun.z) || 1, tanEl = Math.max(sun.y, 0.05) / sl, sdx = sun.x / sl, sdz = sun.z / sl;
  let count = 0;
  for (const s of rows) {
    if (s.state !== 2) continue;
    const bx = s.r * Math.cos(s.th), bz = -s.r * Math.sin(s.th), fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), sx = fz, sz = -fx, a = 1.0 * s.sc, b = 0.5 * s.sc, c = -0.06 * s.sc, n0 = P.length / 3, ph = s.seed * 40;
    P.push(bx + fx * c, Y[0], bz + fz * c); O.push(1);
    for (let j = 1; j < RHO.length; j++) for (let i = 0; i < SEG; i++) {
      const an = (i / SEG) * TAU, ca = Math.cos(an), sa = Math.sin(an), lump = 0.72 + 0.56 * (0.5 + 0.5 * noise.n2(ca * 1.9 + ph, sa * 1.9 + j * 0.35)), wob = 1 + 0.12 * noise.n2(ca * 1.3 + ph + 9, sa * 1.3);
      const lx = b * RHO[j] * sa * wob * (j > 3 ? 1.12 : 1), lz = c + a * RHO[j] * ca * wob;
      const y = Y[j] * (j === 2 || j === 3 ? lump : 1) * (0.55 + 0.6 * s.sc);
      // the animal's own shadow on its bed (the shadow cards lie under the bed): march toward the sun against the lying body
      let hit = 0;
      if (j > 2) { const ux = sdx * sx + sdz * sz, uz = sdx * fx + sdz * fz, tm = Math.min(0.66 * s.sc / tanEl, 2.6); for (let k = 1; k <= 8; k++) { const t = tm * k / 8, qx = (lx + ux * t) / (0.33 * s.sc), qz = (lz - c + uz * t + 0.05) / (0.8 * s.sc), e = qx * qx + qz * qz; if (e < 1 && y + t * tanEl < 0.64 * s.sc * Math.sqrt(1 - e) + 0.04) { hit = 1; break; } } }
      P.push(bx + sx * lx + fx * lz, y, bz + sz * lx + fz * lz); O.push(Math.max(OC[j], hit * 0.78));
    }
    for (let i = 0; i < SEG; i++) I.push(n0, n0 + 1 + i, n0 + 1 + (i + 1) % SEG);
    for (let j = 0; j < RHO.length - 2; j++) for (let i = 0; i < SEG; i++) { const p0 = n0 + 1 + j * SEG + i, p1 = n0 + 1 + j * SEG + (i + 1) % SEG; I.push(p0, p0 + SEG, p1, p1, p0 + SEG, p1 + SEG); }
    count++;
    if (count % 24 === 0) await pause();
  }
  if (!count) return null;
  await pause();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOcc', new THREE.Float32BufferAttribute(O, 1)); g.setIndex(I); g.computeVertexNormals();
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  g.userData.count = count;
  return g;
}

// ---------------------------------------------------------------- lighting presets
function lightPreset(P, hour, weather, season, az) {
  const c = (h) => new THREE.Color(h), white = new THREE.Color(1, 1, 1);
  let el = 17, L = { sunColor: white.clone().lerp(c(P[4]), 0.35), sunIntensity: 2.1, sky: c(P[3]), skyIntensity: 0.55, bounce: c(P[0]).multiplyScalar(0.4), snow: c(P[0]), warm: c(P[1]), shade: c(P[2]).multiplyScalar(0.95),
    gold: c(P[4]), shadowStrength: 1, glint: 2.6, haze: 1, drift: 0, wet: 0 };
  if (hour === 'lastSun') { el = 4; L.sunColor = c('#ff9a6a'); L.sunIntensity = 1.7; L.snow = c(P[1]).lerp(c('#f2a0a8'), 0.4); L.warm = c('#ff8a6a'); L.shade = c('#5a4fa0').multiplyScalar(0.8); L.sky = c('#7f7fc8'); L.gold = c('#ff8a50'); L.bounce = c(P[1]).multiplyScalar(0.3); }
  else if (hour === 'moon') { el = 34; az += 0.5; L.sunColor = c('#a9c4ff'); L.sunIntensity = 0.5; L.snow = c('#5f7fb8').multiplyScalar(0.75); L.warm = c('#8fa8d8'); L.shade = c('#16244a'); L.sky = c('#1c2a55'); L.skyIntensity = 0.5; L.gold = c('#cfe0ff'); L.bounce = c('#22335a').multiplyScalar(0.5); L.glint = 1.6; }
  if (weather === 'overcast') { L.sunIntensity *= 0.3; L.skyIntensity *= 1.7; L.shadowStrength = 0.3; L.snow = L.snow.clone().lerp(c('#d9dde2'), 0.7).multiplyScalar(0.82); L.warm = L.snow.clone(); L.shade = L.shade.clone().lerp(L.snow, 0.55); L.glint = 0; L.sky = L.sky.clone().lerp(white, 0.5); }
  if (weather === 'blizzard') { L.drift = 0.85; L.haze = 1.6; L.shadowStrength *= 0.6; L.glint = 0; }
  if (season === 'april') { L.wet = 1; L.snow = L.snow.clone().lerp(c('#b9c0c8'), 0.35); L.glint *= 0.4; }
  const e = (el * Math.PI) / 180;
  L.sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
  return L;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('reindeer-cyclone'), noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).slice(0, 7);
  const hour = opts.hour || 'noon', weather = opts.weather || 'clear', season = opts.season || 'march';
  const col = (h) => new THREE.Color(h);
  const route = buildRoute();
  await ctx.yield();

  // ---- slots
  const arms = clamp(Math.round(opts.arms ?? (rng() < 0.7 ? 4 : rng() < 0.5 ? 3 : 5)), 3, 5), density = clamp(opts.density ?? rng.range(0.94, 1.04), 0.73, 1.13);
  const total = Math.round(3000 * density), eyeN = Math.round(150 * Math.min(1, density + 0.1)), period = 27.5 * (4 / arms) * rng.range(0.95, 1.05);
  const paleShare = opts.paleHerd ? 0.7 : 1 / 15;
  // turn the spiral so that the run east (between uMarks.wheel1 and slide0) is inside an arm when the camera gets there
  const uRun = lerp(route.marks.wheel1, route.marks.slide0, 0.5), pRun = route.path.pointAt(uRun), rRun = Math.hypot(pRun.x, pRun.z);
  const armPhase = (0.3 - rRun / period) * TAU / arms - (Math.atan2(-pRun.z, pRun.x) - (speedOf(rRun) / rRun) * (route.clockAt(uRun) - T_REF));
  route.marks.run = uRun;
  const whiteCow = opts.whiteCow ?? rng.chance(1 / 8), craters = craterList();
  // ---- light
  const az = rng.range(-0.07, 0.07), L = lightPreset(P, hour, weather, season, az);
  if (opts.sunDir) L.sunDir.set(opts.sunDir[0], opts.sunDir[1], opts.sunDir[2]).normalize();
  // ---- the named random streams (round 8): every group of animals and of sprites draws from its own, so that no group's
  // count of draws can move another's picks. The five the source always took come first, the new ones after them.
  const FK = {};
  for (const k of ['half-1', 'half1', 'puffs', 'billows', 'curtain', 'escorts', 'runners', 'aisle', 'bowls', 'rimside', 'eye', 'trails', 'young', 'gate']) FK[k] = rng.fork(k);
  // ---- the stragglers' trails: a table of the five printed trails over the land (the world hands in its ground; see trailTable)
  const trailData = new Float32Array(TR_W * TR_ROWS * 4);
  for (let row = 0; row < TR_ROWS; row += 2) { trailTable(opts.ground, trailData, row, row + 2); await ctx.yield(); }
  const trailTex = new THREE.DataTexture(trailData, TR_W, TR_ROWS, THREE.RGBAFormat, THREE.FloatType);
  trailTex.minFilter = trailTex.magFilter = THREE.NearestFilter; trailTex.generateMipmaps = false; trailTex.needsUpdate = true;
  await ctx.yield();
  let rows = await makeSlots(FK, noise, route, { runners: total - eyeN, eye: eyeN, arms, period, paleShare, armPhase, whiteCow, craters, trail: trailData, river: opts.river !== false, riverTries: opts.riverTries || [30, 44], stragglers: Math.max(0, Math.round(opts.stragglers || 0)) }, ctx.yield);
  await ctx.yield();
  const eyeSpots = rows.eyeSpots;
  // ---- THE GAZE: the point the lens looks at (the world hands it to the engine as one long point of interest). Down the
  // slope and over the outer arms it rests on the ground ahead, drawn toward the eye; coming down among the animals it
  // settles on the sun side of the erratic.
  // THE HIGH PASS (round 8) is one rule of the world, with no table. As the lens rises above the antlers (3.6 m to 7.5 m)
  // the look goes over to a point ON THE LAKE, HIGH_K times the lens's own height from under it (so twenty-five degrees
  // below the horizon wherever the lens is), on the bearing of the erratic; but never nearer the sun's bearing than
  // SUN_OFF: where the sun stands behind the erratic (north-west of the eye) the look is turned off to the east of the
  // erratic by what is wanting, so that the erratic stands on its sunward side and the sun's disc just beyond its edge.
  // So along the whole climb and the top the rings under the lens, the eye with the erratic, and the far bank behind
  // them lie in one look, and of the sun only the glare comes in. Past the top the same height brings the look back
  // (27 m down to 6 m) to a point 26 m ahead on the snow, which keeps the same SUN_OFF from the sun's bearing for as
  // long as the lens heads toward the sun. On the outer edge the look turns to the file of young animals on the sun
  // side, then across the inner arms to the massif and the erratic, and settles on the cleft.
  const gzP = new THREE.Vector3(), gzT = new THREE.Vector3(), gzA = new THREE.Vector3(), gzB = new THREE.Vector3(), MK = route.marks;
  const sunH0 = Math.hypot(L.sunDir.x, L.sunDir.z) || 1, sunX = L.sunDir.x / sunH0, sunZ = L.sunDir.z / sunH0, eyeB = new THREE.Vector3(sunX * 14, -3, sunZ * 14);
  const seatP = new THREE.Vector3(route.pts[route.pts.length - 1][0], 5, route.pts[route.pts.length - 1][2]);
  const HIGH_K = 2.14, SUN_OFF = 1.08, sunBear = Math.atan2(sunX, sunZ), soft = (x) => (x > 0 ? x * x / (x + 0.08) : 0);
  const aim = (u, bear, pitch, dist, out) => {      // a point `dist` metres from the lens, `bear` left of its heading, `pitch` below the horizon (radians)
    route.path.pointAt(u, gzP); route.path.tangentAt(u, gzT); const l = Math.hypot(gzT.x, gzT.z) || 1, hx = gzT.x / l, hz = gzT.z / l, cb = Math.cos(bear), sb = Math.sin(bear), cp = Math.cos(pitch);
    return out.set(gzP.x + (hx * cb + hz * sb) * cp * dist, gzP.y - Math.sin(pitch) * dist, gzP.z + (hz * cb - hx * sb) * cp * dist);
  };
  // the look of the high pass from the lens at gzP: 60 m along the line to that point on the lake (bearings are measured
  // from south toward east; `sep` = how far east of the sun's bearing the erratic stands, seen from the lens)
  const wrapA = (x) => { x %= TAU; return x > Math.PI ? x - TAU : x < -Math.PI ? x + TAU : x; };
  const highAim = (out) => {
    const eb = Math.atan2(-gzP.x, -gzP.z), sep = wrapA(eb - sunBear), b = eb + soft(SUN_OFF - Math.abs(sep)) * (sep < 0 ? -1 : 1), k = 60 / Math.hypot(HIGH_K, 1);
    return out.set(gzP.x + Math.sin(b) * HIGH_K * k, gzP.y - k, gzP.z + Math.cos(b) * HIGH_K * k);
  };
  // the look ahead on the snow: 0.2 rad left of the heading, or as far left as keeps it SUN_OFF from the sun's bearing
  // (the sun ahead or to the right of the heading; a sun that stands well to the left is left where it is)
  const aheadAim = (u, out) => {
    route.path.tangentAt(u, gzT); const l = Math.hypot(gzT.x, gzT.z) || 1, hx = gzT.x / l, hz = gzT.z / l;
    const sunRight = Math.atan2(hx * sunZ - hz * sunX, hx * sunX + hz * sunZ);
    aim(u, 0.2 + soft(SUN_OFF - sunRight - 0.2) * smoothstep(-0.9, -0.4, sunRight), 0, 26, out).y = 0.4;
    return out;
  };
  // the place on the young animals' ring (BULL_R) that lies from the lens toward the sun, at the height of a shoulder
  const fileAt = (u, out) => {
    route.path.pointAt(u, gzP); const bq = gzP.x * sunX + gzP.z * sunZ, cq = gzP.x * gzP.x + gzP.z * gzP.z - BULL_R * BULL_R, sd = Math.min(-bq + Math.sqrt(Math.max(0, bq * bq - cq)), 14);
    route.path.tangentAt(u, gzT); const l = Math.hypot(gzT.x, gzT.z) || 1;
    return out.set(gzP.x + sunX * sd + gzT.x / l * 1.5, 1.6, gzP.z + sunZ * sd + gzT.z / l * 1.5);
  };
  const gazeAt = (u, out) => {
    route.path.pointAt(Math.min(1, u + 0.03), out); out.y *= 0.25; out.x *= 0.55; out.z *= 0.55;
    out.lerp(eyeB, smoothstep(0.135, 0.255, u));
    route.path.pointAt(u, gzP); const y = gzP.y;
    if (u > MK.wheel0 && u <= MK.top) out.lerp(highAim(gzA), smoothstep(3.6, 7.5, y));
    else if (u > MK.top) { highAim(gzA); out.copy(gzA.lerp(aheadAim(u, gzB), smoothstep(27, 6, y))); }
    if (u > 0.74 && u < 0.84) out.lerp(fileAt(u, gzB), smoothstep(0.745, 0.772, u) * (1 - smoothstep(0.797, 0.83, u)));
    if (u > 0.79) { aim(u, (whiteCow ? 34 : 62) * D2R, 0, 40, gzA).y = 0.9; out.lerp(gzA, smoothstep(0.8, 0.835, u)); }
    if (u > 0.86) out.lerp(seatP, smoothstep(0.872, 0.93, u));
    return out;
  };
  // (round 7: the river of bodies round the lens's lane is seeded in makeSlots, every animal in one place for the whole
  // flight; nothing is moved or taken out for any view. Levels of detail are dealt out by distance, every frame: below.)
  const isYoung = (s) => s.young === 1;
  // on slower machines the far herd is thinned evenly (never the eye, the stragglers, the young animals' file, or what the lens passes close to)
  if (detail < 1) { const es = rows.eyeSpots, rr = rows.river; rows = rows.filter((s) => s.state > 0 || s.r > 800 || isYoung(s) || s.d < 30 || s.seed < 0.25 + 0.75 * detail); rows.eyeSpots = es; rows.river = rr; }
  if (season === 'april') for (const s of rows) if (s.sc > 1.05) s.ant = 0;

  // ---- shared uniforms
  const fogU = THREE.UniformsLib.fog;
  const U = {
    uClock: { value: 0 }, uTime: { value: 0 }, uTrail: { value: trailTex }, uCamL: { value: new THREE.Vector3(0, 60, 250) }, uCamR: { value: new THREE.Vector3(1, 0, 0) }, uCamU: { value: new THREE.Vector3(0, 1, 0) },
    uSunDir: { value: L.sunDir.clone() }, uSunCol: { value: new THREE.Color() }, uSkyCol: { value: new THREE.Color() }, uBounce: { value: new THREE.Color() }, uGold: { value: new THREE.Color() },
    uSnow: { value: new THREE.Color() }, uWarm: { value: new THREE.Color() }, uShade: { value: new THREE.Color() }, uShTint: { value: new THREE.Color() }, uShCol: { value: new THREE.Color() }, uShStr: { value: 1 }, uShLen: { value: 3.3 },
    uPuffLit: { value: new THREE.Color() }, uPuffShade: { value: new THREE.Color() }, uDriftCol: { value: new THREE.Color() }, uDrift: { value: 0 }, uHaze: { value: 1 }, uGlint: { value: 2.6 }, uWet: { value: 0 },
    uHazeCol: { value: new THREE.Color() }, uHazeGold: { value: new THREE.Color() }, uHaze4: { value: new THREE.Vector4(0.05, 0.55, 0, 0) },
    uCamS: { value: null }, uPale: { value: col(P[6]).multiplyScalar(0.64) }, uNeck: { value: new THREE.Vector3(...NECK) }, uThin: { value: 0.0016 },
    uHeath: { value: col('#3a2428').lerp(col(P[5]), 0.4) }, uLichen: { value: col('#9aa58c').multiplyScalar(0.8) }, uRock: { value: col(P[5]).lerp(col(P[6]), 0.42) },
    uLead: { value: new THREE.Vector4(1e5, 0, 1e5, 0) }, uLeadB: { value: new THREE.Vector3(0, 1, 0) },
    uCleft: { value: new THREE.Vector2(route.cleft[0], route.cleft[1]) },
    uArms: { value: arms }, uPeriod: { value: period }, uArmPhase: { value: armPhase }, uBoulder: { value: opts.boulder === false ? 0 : 1 }, uB1: { value: new THREE.Vector3() }, uB2: { value: new THREE.Vector3() },
  };
  U.uCamS.value = U.uCamL.value;
  const _hz = new THREE.Color();
  const setLight = (o = {}) => {
    Object.assign(L, o);
    if (o.sunDir) L.sunDir = (o.sunDir.isVector3 ? o.sunDir.clone() : new THREE.Vector3(...o.sunDir)).normalize();
    for (const k of ['sunColor', 'sky', 'bounce', 'snow', 'warm', 'shade', 'gold']) if (!L[k].isColor) L[k] = col(L[k]);
    U.uSunDir.value.copy(L.sunDir); U.uSunCol.value.copy(L.sunColor).multiplyScalar(L.sunIntensity); U.uSkyCol.value.copy(L.sky).multiplyScalar(L.skyIntensity); U.uBounce.value.copy(L.bounce);
    U.uGold.value.copy(L.gold); U.uSnow.value.copy(L.snow); U.uWarm.value.copy(L.warm); U.uShade.value.copy(L.shade);
    const t = L.shadowTint ? col(L.shadowTint) : new THREE.Color(clamp(L.shade.r / (L.snow.r * 0.74), 0.05, 1), clamp(L.shade.g / (L.snow.g * 0.74), 0.05, 1), clamp(L.shade.b / (L.snow.b * 0.74), 0.05, 1));
    U.uShTint.value.copy(t); U.uShCol.value.copy(L.shade).multiplyScalar(0.93); U.uShStr.value = L.shadowStrength; U.uShLen.value = Math.min(1 / Math.tan(Math.max(0.03, Math.asin(clamp(L.sunDir.y, 0.02, 1)))), 9.5);
    U.uPuffLit.value.copy(L.snow).lerp(L.sunColor, 0.3).multiplyScalar(Math.max(0.34 * L.sunIntensity + 0.2, 0.72)); U.uPuffShade.value.copy(L.sky).lerp(L.snow, 0.45).multiplyScalar(0.62);
    U.uHazeCol.value.copy(L.shade).lerp(_hz.copy(L.snow).multiplyScalar(0.74), 0.74); U.uHazeGold.value.copy(L.gold).multiplyScalar(0.2 * Math.min(L.sunIntensity, 2.4)); U.uHaze4.value.x = L.hazeK ?? 0.05; U.uHaze4.value.y = L.hazeH ?? 0.55;
    U.uDriftCol.value.copy(L.snow).multiplyScalar(0.72); U.uDrift.value = L.drift; U.uHaze.value = L.haze; U.uGlint.value = L.glint; U.uWet.value = L.wet;
  };
  setLight();
  const mat = (vs, fs, keys, extra = {}) => { const u = { ...THREE.UniformsUtils.clone(fogU) }; for (const k of keys) u[k] = U[k]; return new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: u, fog: true, ...extra }); };
  const object = new THREE.Group(); object.name = 'reindeer-cyclone';
  const add = (geo, m, order) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = order; me.matrixAutoUpdate = false; object.add(me); return me; };

  // ---- snow disc
  if (opts.snow !== false) {
    const g = new THREE.RingGeometry(0.01, 340, 96, 13); g.rotateX(-Math.PI / 2);
    await ctx.yield();
    add(g, mat(SNOW_VERT, SNOW_FRAG, ['uSunDir', 'uGold', 'uCamL', 'uSnow', 'uWarm', 'uShade', 'uHeath', 'uLichen', 'uB1', 'uB2', 'uClock', 'uTime', 'uArms', 'uPeriod', 'uArmPhase', 'uWet', 'uDrift', 'uBoulder', 'uGlint', 'uHazeCol', 'uHazeGold', 'uHaze4'], { transparent: true }), -2);
  }
  // ---- boulder
  let boulderTop = new THREE.Vector3(0, 0, 0);
  if (opts.boulder !== false) {
    const b = await boulderGeometry(FK, noise, route.cleft, ctx.yield); U.uB1.value.copy(b.halves[0]); U.uB2.value.copy(b.halves[1]);
    add(b.geometry, mat(ROCK_VERT, ROCK_FRAG, ['uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uSnow', 'uShade', 'uRock', 'uLichen', 'uGold', 'uCamL', 'uB1', 'uB2', 'uCleft']), 0);
    add(b.drift, mat(MOUND_VERT, MOUND_FRAG, ['uSunDir', 'uGold', 'uCamL', 'uSnow', 'uWarm', 'uShade', 'uB1', 'uB2', 'uGlint']), 0);
    const p = b.geometry.attributes.position; let top = -1; for (let i = 0; i < p.count; i++) if (p.getY(i) > top) { top = p.getY(i); boulderTop.fromBufferAttribute(p, i); }
  }
  await ctx.yield();

  // ---- the herd: four levels of detail, dealt out afresh every frame by each animal's distance from the lens (any
  // camera, any window): full detail within about 16 m, the middle build to 40 m, the light build to 70 m, the 22-triangle
  // prism beyond. An animal changes its build, never its place; between two builds it keeps the one it has until it is
  // clearly past the line (T_IN / T_OUT), so nothing flickers. Each level is one instanced mesh whose slots are rewritten
  // in hero.update (a few thousand floats: no shader, no material and no mesh is made or changed after build).
  const dark = col(P[5]), cream = col(P[6]);
  const C = { coat: dark.clone().lerp(cream, 0.055), belly: dark.clone().lerp(cream, 0.22), flank: dark.clone().multiplyScalar(0.95), ruff: cream.clone().multiplyScalar(0.84), rump: new THREE.Color(0.78, 0.76, 0.72),
    leg: dark.clone().multiplyScalar(0.85), hoof: dark.clone().multiplyScalar(0.3), face: dark.clone().multiplyScalar(0.8), horn: dark.clone().multiplyScalar(0.8).lerp(cream, 0.16), hornTip: cream.clone().multiplyScalar(0.62) };
  const deerKeys = ['uLead', 'uLeadB', 'uClock', 'uTime', 'uTrail', 'uCamL', 'uNeck', 'uPale', 'uThin', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uDriftCol', 'uDrift', 'uSnow', 'uShade', 'uHazeCol', 'uHazeGold', 'uHaze4'];
  const deerMat = mat(DEER_VERT, DEER_FRAG, deerKeys, { vertexColors: true, side: THREE.DoubleSide });
  const N = rows.length, SLOT = new Float32Array(N * 8), OMG = new Float32Array(N), LV = new Uint8Array(N).fill(3), leadI = rows.findIndex((s) => s.r > 900);
  // (KIND: 1 = a straggler on its trail, 2 = one of the young animals' file; neither is dealt the sprites of the animals beside the lens: they carry their own)
  const KIND = new Uint8Array(N), tp4 = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) { const s = rows[i]; SLOT.set([s.r, s.th, s.sc, s.seed, s.state, s.ant, s.tint, s.yaw], i * 8); OMG[i] = s.state === 0 && s.r < 800 ? speedOf(s.r) / s.r : 0; KIND[i] = s.r > 800 && s.r < 900 ? 1 : isYoung(s) ? 2 : 0; }
  const CAP = [LOD_CAP[0], LOD_CAP[1], LOD_CAP[2], N], T_IN2 = LOD_IN.map((d) => d * d), T_OUT2 = LOD_OUT.map((d) => d * d), tierOf = [0, 1, 3, 2], LOD = [], tris = [];
  const dynAttr = (n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
  for (let t = 0; t < 4; t++) {
    const base = reindeerGeometry(tierOf[t], C), g = new THREE.InstancedBufferGeometry(), A = dynAttr(CAP[t], 4), B = dynAttr(CAP[t], 4); tris.push(base.index.count / 3);
    g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    g.setAttribute('iA', A); g.setAttribute('iB', B); g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 360);
    add(g, deerMat, 1); LOD.push({ g, A, B });
    await ctx.yield();
  }
  // ---- snow beds under the animals that lie in the eye
  let beds = 0;
  {
    const bg = await bedGeometry(rows, noise, L.sunDir, ctx.yield);
    if (bg) { beds = bg.userData.count; add(bg, mat(MOUND_VERT, MOUND_FRAG, ['uSunDir', 'uGold', 'uCamL', 'uSnow', 'uWarm', 'uShade', 'uB1', 'uB2', 'uGlint'], { side: THREE.DoubleSide }), 0); }
  }
  await ctx.yield();
  // ---- shadows: a card per animal, laid toward the shade colour
  {
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3)); base.setIndex([0, 1, 2, 0, 2, 3]);
    const m = mat(SHADOW_VERT, SHADOW_FRAG, ['uLead', 'uLeadB', 'uClock', 'uTime', 'uTrail', 'uSunDir', 'uShLen', 'uShCol', 'uShStr', 'uCamS', 'uHazeCol', 'uHazeGold', 'uHaze4'], { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    add(instanced(base, rows, 0, rows.length), m, -1);
  }
  await ctx.yield();
  // ---- breath, powder, wreath: the whole herd's sprites (one draw), and beside the lens a second set, dealt out with the
  // levels of detail: a jet of breath at every stride and powder from every hoof of the animals near the lens, which fade
  // in with nearness (uNear) so that none appears at a line
  const puffKeys = ['uLead', 'uLeadB', 'uClock', 'uTime', 'uTrail', 'uCamL', 'uCamR', 'uCamU', 'uSunDir', 'uGold', 'uPuffLit', 'uPuffShade', 'uHaze'], quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  const puffMat = (near) => { const m = mat(PUFF_VERT, PUFF_FRAG, puffKeys, { transparent: true, depthWrite: false, side: THREE.DoubleSide }); m.uniforms.uNear = { value: new THREE.Vector4(near ? PUFF_FADE[0] : 0, near ? PUFF_FADE[1] : 1, PUFF_NEAR[0], PUFF_NEAR[1]) }; return m; };
  {
    const A = [], B = [], S = [], srng = FK.puffs;
    const put = (s, type, ph, size) => { A.push(s.r, s.th, s.sc, s.seed); B.push(s.state, s.ant, s.tint, s.yaw); S.push(type, ph, size, srng()); };
    rows.forEach((s) => {
      if (s.state > 0) { put(s, 0, srng(), 1); if (srng() < 0.55) put(s, 0, srng(), 1.15); return; }      // the standing and the lying: slow steam that hangs
      // the young animals' file on the sun side of the lens's lane: from each a plume of breath streaming back over its shoulder, lit through by the sun
      if (isYoung(s)) { for (let k = 0; k < 5; k++) put(s, 0, k / 5, 1.6); for (let k = 0; k < 4; k++) put(s, 1, k / 4, 1); return; }
      // a straggler on the slope: breath at the muzzle, powder from the hooves
      if (s.trail) { put(s, 0, srng(), 1); put(s, 0, srng(), 1); put(s, 1, 0, 1); put(s, 1, 0.5, 1); return; }
      if (srng() < 0.3 * detail) put(s, 0, srng(), 1); if (srng() < 0.4 * detail) put(s, 1, srng() < 0.5 ? 0 : 0.5, 1);
    });
    // the rolling ground haze (type 3)
    { const hrng = FK.billows, nB = Math.round(560 * detail); for (let i = 0; i < nB; i++) { A.push(Math.sqrt(lerp(72 * 72, 206 * 206, hrng())), hrng() * TAU, hrng.range(0.55, 0.9), hrng()); B.push(0, 0, 0, 0); S.push(3, 0, hrng.range(0.3, 0.5), hrng()); } }
    const nH = Math.round(170 * detail);
    for (let i = 0; i < nH; i++) { const r = srng() < 0.6 ? srng.range(150, 208) : Math.sqrt(lerp(78 * 78, 205 * 205, srng())); A.push(r, srng() * TAU, srng.range(15, 27), srng()); B.push(0, 0, 0, 0); S.push(2, 0, srng.range(0.2, 0.33), srng()); }
    // the standing curtain: steam and powder hanging over the southern arms, faint from the side, a lit wall against the sun
    const nC = Math.round(84 * detail), crng = FK.curtain;
    for (let i = 0; i < nC; i++) { A.push(crng.range(170, 218), -Math.PI / 2 + crng.range(-1.1, -0.12), crng.range(9, 14), crng()); B.push(1, 0, 0, 0); S.push(2, 0, crng.range(0.14, 0.22), crng()); }
    // ... and its eastern end, which stands only for a lens above the antlers (it hangs over the lane the lens rides along the outer edge)
    for (let i = 0; i < Math.round(32 * detail); i++) { A.push(crng.range(176, 218), -Math.PI / 2 + crng.range(-0.12, 0.33), crng.range(9, 14), crng()); B.push(1, 0, 0, 0); S.push(2, 0, crng.range(0.14, 0.22), crng()); }
    // steam round the erratic (type 4; round 8: the only light on the way out is the sun's, on breath and on the rock). The
    // breath of the animals that line the aisle hangs over them on both sides, more than five metres from the lens's line,
    // and thicker beside the mouth of the cleft; where a half of the erratic stands in the sun steam curls up its lit face.
    // Nothing is put inside the cleft itself. (al, la) = metres along the cleft's direction from the centre, and across it.
    if (opts.boulder !== false) {
      const R = FK.gate, cx = route.cleft[0], cz = route.cleft[1], dq = 0.5 + 0.5 * detail, nSt = Math.round(40 * dq), nMouth = Math.round(18 * dq), nFace = Math.round(72 * dq);
      const steam = (al, la, y0, rise, secs, size) => { A.push(al * cx - la * cz, y0, al * cz + la * cx, R()); B.push(rise, R.range(0.5, 1.6), R.range(-0.4, 0.4), secs); S.push(4, R(), size, R()); };
      for (let i = 0; i < nSt; i++) steam(R.range(12, 60), R.sign() * R.range(5.2, 12), R.range(1.4, 2.4), R.range(1.2, 2.6), R.range(14, 22), R.range(2.2, 3.6));
      for (let i = 0; i < nMouth; i++) steam(R.range(5, 16), R.sign() * R.range(5, 9.5), R.range(0.8, 2), R.range(2, 4), R.range(12, 18), R.range(2, 3.2));
      for (let i = 0; i < nFace; i++) {
        // a point on the outline of one half (about 5.8 m by 11 m, its centre 7 m off the cleft's axis) on its outer, front or back face
        const sx = i & 1 ? 1 : -1, f = R(), t = R.range(-1, 1), y0 = R.range(0.6, 5), rise = R.range(5, 9), secs = R.range(9, 15), size = R.range(1.8, 3);
        const al = f < 0.5 ? t * 6.2 : (f < 0.8 ? 1 : -1) * 6.5, la = sx * (f < 0.5 ? 10.9 : 7 + t * 3.6), nA = f < 0.5 ? 0 : f < 0.8 ? 1 : -1, nL = f < 0.5 ? sx : 0;
        if ((nA * cx - nL * cz) * sunX + (nA * cz + nL * cx) * sunZ > 0.15) steam(al, la, y0, rise, secs, size);
      }
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(quad, 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4));
    g.instanceCount = S.length / 4;
    add(g, puffMat(false), 3);
  }
  const PCAP = Math.round(PUFF_CAP * (0.5 + 0.5 * detail)), NP = { g: new THREE.InstancedBufferGeometry(), A: dynAttr(PCAP, 4), B: dynAttr(PCAP, 4), S: dynAttr(PCAP, 4) };
  NP.g.setAttribute('position', new THREE.BufferAttribute(quad, 3)); NP.g.setIndex([0, 1, 2, 0, 2, 3]);
  NP.g.setAttribute('iA', NP.A); NP.g.setAttribute('iB', NP.B); NP.g.setAttribute('iS', NP.S); NP.g.instanceCount = 0;
  add(NP.g, puffMat(true), 3);
  // [sprite type, phase] of the sprites a runner near the lens is given: the first four within PUFF_FADE[0] metres, the other
  // four within PUFF_NEAR[0] + 2 (each set fades in from nothing as the lens comes nearer: none appears at a line)
  const NEAR_PUFFS = [0, 0, 0, 0.5, 1, 0, 1, 0.5, 0, 0.25, 0, 0.75, 1, 0.25, 1, 0.75], PF2 = PUFF_FADE[0] * PUFF_FADE[0], PN2 = (PUFF_NEAR[0] + 2) * (PUFF_NEAR[0] + 2), cnt = [0, 0, 0, 0, 0];
  const deal = (px, py, pz, clk) => {
    const hy = (py - 1) * (py - 1), lead = U.uLead.value, pA = NP.A.array, pB = NP.B.array, pS = NP.S.array; let np = 0;
    cnt[0] = cnt[1] = cnt[2] = cnt[3] = 0;
    for (let i = 0, o = 0; i < N; i++, o += 8) {
      let x, z, vy = hy;
      if (i === leadI) { x = lead.x; z = lead.z; }
      else if (KIND[i] === 1) { trailPos(trailData, Math.round(SLOT[o] - 800), SLOT[o + 1], SLOT[o + 7], clk, tp4); x = tp4[0]; z = tp4[2]; vy = (py - 1 - tp4[1]) * (py - 1 - tp4[1]); }
      else { const r = SLOT[o], th = SLOT[o + 1] + OMG[i] * clk; x = r * Math.cos(th); z = -r * Math.sin(th); }
      const dx = x - px, dz = z - pz, d2 = dx * dx + dz * dz + vy;
      const lin = d2 < T_IN2[0] ? 0 : d2 < T_IN2[1] ? 1 : d2 < T_IN2[2] ? 2 : 3, lout = d2 < T_OUT2[0] ? 0 : d2 < T_OUT2[1] ? 1 : d2 < T_OUT2[2] ? 2 : 3;
      let l = LV[i]; if (l > lin) l = lin; else if (l < lout) l = lout; LV[i] = l;
      while (cnt[l] >= CAP[l]) l++;
      const q = cnt[l]++ * 4, a = LOD[l].A.array, b = LOD[l].B.array;
      a[q] = SLOT[o]; a[q + 1] = SLOT[o + 1]; a[q + 2] = SLOT[o + 2]; a[q + 3] = SLOT[o + 3]; b[q] = SLOT[o + 4]; b[q + 1] = SLOT[o + 5]; b[q + 2] = SLOT[o + 6]; b[q + 3] = SLOT[o + 7];
      if (d2 < PF2 && SLOT[o + 4] === 0 && KIND[i] === 0) {
        const list = NEAR_PUFFS, n = d2 < PN2 ? 16 : 8, sd = SLOT[o + 3];
        for (let k = 0; k < n && np < PCAP; k += 2, np++) {
          const p = np * 4, h = Math.abs(Math.sin(sd * 127.1 + k * 31.7) * 43758.5453) % 1;
          pA[p] = SLOT[o]; pA[p + 1] = SLOT[o + 1]; pA[p + 2] = SLOT[o + 2]; pA[p + 3] = sd; pB[p] = 0; pB[p + 1] = SLOT[o + 5]; pB[p + 2] = SLOT[o + 6]; pB[p + 3] = k < 8 ? 0 : 1;
          pS[p] = list[k]; pS[p + 1] = list[k + 1]; pS[p + 2] = 1; pS[p + 3] = h;
        }
      }
    }
    for (let t = 0; t < 4; t++) { const G = LOD[t]; G.g.instanceCount = cnt[t]; for (const at of [G.A, G.B]) { at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(4, cnt[t] * 4)); at.needsUpdate = true; } }
    NP.g.instanceCount = np; cnt[4] = np; for (const at of [NP.A, NP.B, NP.S]) { at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(4, np * 4)); at.needsUpdate = true; }
  };
  { const p0 = route.pts[0]; deal(p0[0], p0[1], p0[2], 0); }
  await ctx.yield();

  // ---- anchors
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]), at = (u) => route.path.pointAt(u), [cx, cz] = route.cleft, end = V3(route.pts[route.pts.length - 1]);
  const anchors = {
    flyThrough: route.pts.map(V3),
    portalSeat: { position: end.clone(), base: new THREE.Vector3(end.x, 0, end.z), facing: new THREE.Vector3(cx, 0, cz), width: 8, height: 10 },
    viewpoints: { above: at(route.marks.top), wheel: at(0.63), arm: at(uRun), slide: at(0.87), aisle: at(0.965) },
    eye: { center: new THREE.Vector3(0, 0, 0), radius: R_EYE }, boulderTop, cleftDir: new THREE.Vector3(cx, 0, cz), sunDir: L.sunDir.clone(), wind: new THREE.Vector3(1, 0, 0), uMarks: route.marks,
  };
  let clock = null;
  const inv = new THREE.Matrix4();
  // the led cow (rare visits): she comes back to 6.5 m ahead of the lens for the run and the whole slide, then slows at
  // the rim of the eye, steps aside and stands as we pass. Everything is a function of u (tables made here).
  const LD = { on: !!whiteCow, u0: route.marks.low1 + 0.005, N: 400, s: null, cyc: null, uB: (route.marks.straight0 * route.L - 14.2) / route.L, p: new THREE.Vector3(), t: new THREE.Vector3() };
  if (LD.on) {
    const strideJ = (v) => 1.1 + 1.3 * smoothstep(1.4, 6, v) + smoothstep(6, 11, v);
    const sAt = (u) => (u <= LD.uB ? u * route.L + 6.2 + 60 * (1 - smoothstep(route.marks.low1 + 0.01, route.marks.wheel1 - 0.02, u)) : LD.uB * route.L + 6.2 + 14 * (1 - Math.exp(-(u - LD.uB) * route.L / 14)));
    LD.s = new Float32Array(LD.N + 1); LD.cyc = new Float32Array(LD.N + 1); LD.v = new Float32Array(LD.N + 1);
    for (let i = 0; i <= LD.N; i++) {
      const u = LD.u0 + (1 - LD.u0) * (i / LD.N); LD.s[i] = sAt(u);
      if (i) { const dt = Math.max(1e-4, route.clockAt(u) - route.clockAt(LD.u0 + (1 - LD.u0) * ((i - 1) / LD.N))), v = Math.max(0, LD.s[i] - LD.s[i - 1]) / dt; LD.v[i] = v; LD.cyc[i] = LD.cyc[i - 1] + (LD.s[i] - LD.s[i - 1]) / (strideJ(v) * 1.04); }
    }
    LD.v[0] = LD.v[1];
  }
  const setLead = (u) => {
    if (!LD.on || u < LD.u0) { U.uLead.value.set(1e5, 0, 1e5, 0); return; }
    const x = clamp((u - LD.u0) / (1 - LD.u0), 0, 1) * LD.N, i = Math.min(LD.N - 1, Math.floor(x)), f = x - i, sd = lerp(LD.s[i], LD.s[i + 1], f);
    route.path.posAtDist(Math.min(sd, route.L), LD.p); route.path.tangentAtDist(Math.min(sd, route.L - 0.5), LD.t); LD.t.y = 0; LD.t.normalize();
    const lat = -(1.9 + 2.9 * smoothstep(LD.uB, LD.uB + 0.03, u));        // on the inside of the turn, where the gaze is
    U.uLead.value.set(LD.p.x - LD.t.z * lat, 0, LD.p.z + LD.t.x * lat, lerp(LD.v[i], LD.v[i + 1], f));
    U.uLeadB.value.set(LD.t.x, LD.t.z, lerp(LD.cyc[i], LD.cyc[i + 1], f));
  };
  const hero = {
    object, path: route.path, radius: 95, height: 60, trueRadius: 340, center: new THREE.Vector3(0, 4, 0), anchors, ground: true, groundY: -0.4,
    duration: route.duration, pace: route.pace, clockAt: route.clockAt, count: rows.length, tiers: { caps: CAP, counts: cnt, triangles: tris }, arms, whiteCow, light: L, craters, eyeSpots, beds,
    gazeAt, gazePoi: GAZE_POI, river: rows.river, slots: rows, setLight, setLead,
    // the land under the stragglers' trails: (x, z) => height in metres (call it in build, once the land's surface is made)
    setGround(fn) { trailTable(fn, trailData); trailTex.needsUpdate = true; }, setClock(t) { clock = t; }, setProgress(u) { clock = route.clockAt(u); setLead(u); },
    update(dt, time, camera) {
      U.uTime.value = time; U.uClock.value = clock ?? time; U.uHaze4.value.z = time;
      if (camera) {
        inv.copy(object.matrixWorld).invert();
        U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
        U.uCamR.value.setFromMatrixColumn(camera.matrixWorld, 0).transformDirection(inv); U.uCamU.value.setFromMatrixColumn(camera.matrixWorld, 1).transformDirection(inv);
      }
      deal(U.uCamL.value.x, U.uCamL.value.y, U.uCamL.value.z, U.uClock.value);
    },
    dispose() {},
  };
  return hero;
}
