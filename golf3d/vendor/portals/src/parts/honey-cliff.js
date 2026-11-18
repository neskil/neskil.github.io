// THE HONEY CLIFF: hero set piece for "honey-cliff" (The Honey Cliff).
//
// A weathered ochre-and-grey overhanging cliff, 660 m wide, with two flat roofs: beds of clearly unequal
// thickness (every 56 m of height one massive bed 22 to 34 m thick, plain and spalled, between stacks of
// beds under 4 m) that stand proud or back (mesh and shader share the bed formulas), thrown by three
// faults, cut by a few wandering master joints that run through many beds, streaked with seepage,
// lichened, with mossy terraces on the lower roof. Twelve half-moon combs of the giant
// Himalayan honeybee hang under them like golden shields (six under the upper roof, six staggered
// under the lower one), each cloaked in a near-black curtain of bees. The curtain is alive at
// three matching levels: a shell shader that paints every bee (bands, tawny thorax, smoky wings)
// on the comb itself, ~2,000 instanced 14-triangle bees on the upper tier and ~480 instanced
// 97-triangle bees (legs, banded abdomen, wings) along the close pass. All three read ONE wave
// function: a defence wave is a ring that leaves a source point at 45 m/s; behind its front
// every bee flips its abdomen up 85 degrees about the thorax pivot and shows pale, so a pale band
// about 6 m wide runs across a comb and jumps to the next. Bees never translate (feet are fixed);
// only the ~26 walkers round the tear move, on straight tracks with planted feet.
// Comb four is the window (bare honey crown, lit through from behind), comb six is torn: a 23 m
// bite with a cut face of broken cells, bare hexagon cells round it, wax shards and honey falling
// in ropes that coil. Behind the tear the cleft opens as a ragged, wax-crusted crack (a collar of rock
// stands proud round it) and runs 80 m through water-worn rock (dipping strata of ochre, cream and umber,
// cupped with scallops, lit warm from the portal end), hung with thick round-lobed flanges of old wax
// rooted in the wall, whose lips catch the portal's light, to the portal seat. Nothing crosses the cleft:
// hero.clearance reports the least distance from the route to combs, rock and wax.
// THE ROUTE (anchors.flyThrough): down the bough's line and in on the torn comb (50 m off it), north 45 to 60 m off the
// curtains of the upper tier, sinking to between the tiers; out over the gorge to the north-east, a left turn 150 m off
// the north horn (the whole face three-quarters on, the tree far beyond its south end), and a climbing run back in to comb
// one and the ladder at the horn (anchors.route gives the index of each beat: comb6, north, tiers, vista, far, ladder), then the close
// pass south: slalom along the curtains, behind comb four, round comb five, through the tear, down the cleft.
//
// ORIENTATION  origin = foot of the back wall at the middle of the bay, +Y up. The cliff FACES +Z
//              (east in the brief), north is +X, south is -X. Upper roof underside y = 210, lower
//              roof y = 110; rock runs from y = -70 to 300 and x = -330..330 (continue it with your
//              own terrain beyond that and below). Comb 1 is at the north horn (x ~ +180), comb 6
//              (torn) at x ~ -184. Back wall z = zBack(x) (-40 mid-bay .. 0 at the horns), combs
//              hang 26 m in front of it, the roof lip is 38 m in front of it.
// SIZE         radius 340; rock spans y -70..300 (hero.height = 200 is only the viewer's orbit hint), center (0,165,0).
// COST         about 190k triangles, 7 draw calls, ~400 ms build (yields between steps), no lights, no textures.
//              ctx.quality.detail thins only the 14-triangle bees.
// LIGHTING     All materials are ShaderMaterials lit by uniforms, not by scene lights (linear HDR,
//              scene fog supported). Give it the sun: opts.sunDir (TOWARD the sun, hero-local) or
//              hero.setSun(dirLocal, colour, skyColour, bounceColour) at any time. Default is the
//              brief's 08:15 sun, 32 degrees up, 20 degrees south of the wall normal: (-0.29,0.53,0.80).
//              The roof shadow band on the combs (8 m at the default sun), the comb shadows on the
//              wall and the light transmitted through honey are all computed from that direction.
//              Bare sunlit wax reaches ~1.6, the window behind comb four and the honey ropes 2-3.
//              hero.setPortalLight(colour, intensity, mouthIntensity) lights the cleft walls and flanges from
//              the portal seat, and the lip of the mouth and the wall round it from just inside the mouth.
// DRIVING IT   hero.setProgress(u) every frame with the world's u: launches the defence waves of
//              the brief (u .30 buzzard sweep from the south end, .645 the wave that breaks
//              toward the camera on the close pass, .84/.872 hornet lunges at comb five, .905 the
//              tear) with age = (u - u0) * opts.journeySeconds. Until it is called the piece runs
//              a looping demo (a wave every 6.5 s). hero.launchWave(x, y) starts a time-driven ring
//              at a local point. hero.setAbscond(p) 0..1 unravels the curtain of comb three from
//              the top (rare event). hero.uniforms exposes everything (uCalm slows the curtain).
//              hero.setSchedule(waves, seconds) replaces the wave list and the journey length after build.
//              hero.uniforms.uPx: the height of the drawing buffer in pixels, set by the world every frame (bees under a
//              pixel and a half across are not drawn; the shell's painted cloak stands for them).
//              hero.rockMaterial([r, g, b, density]) makes another material of the cliff's rock (for the mountain round the
//              slab); the optional haze fades it into the air with distance, beyond |x| 330 only.
//              hero.clearance = { combs, rock, wax }: least distance (m) from flyThrough to each solid.
// OPTS         palette [scarlet, sky, ochre rock, honey gold, bee black, pale wax, haze]
//              sunDir [x,y,z], sunColor, skyColor, bounceColor (hex or Color; linear HDR scale via
//              sunIntensity 2.8, skyIntensity 0.6), hour 'morning' | 'dawn' | 'golden' (low rose sun,
//              no roof shadow, slow curtains), season 'spring' | 'autumn' (honey crowns 1.6x deeper),
//              weather 'clear' | 'rain' (dark wet rock), journeySeconds (41.6), waves (list of
//              { u, x, y } to replace the schedule).
// ANCHORS      (all hero-local)
//   flyThrough   ordered points: the way in and round to the ladder at the north horn (see THE ROUTE),
//                the close pass south as a slalom that swings out to 15-20 m
//                in front of combs one to three (so each curtain is met nearly face on) and in to
//                9 m between them, through the gap behind comb four (the window), out past comb
//                five, a climbing wheel out over the gorge that lines up on the cleft, through the
//                tear and down the cleft. Checked at build: >= 6 m from every solid (hero.clearance).
//   secondPassStart  index into flyThrough where the close pass starts
//   portalSeat   { position, direction (the way the camera travels, 18 degrees down),
//                  facing (= -direction), radius 7 }: the 14 m portal, tilt: true
//   combs        12 x { center, normal, tangent, halfWidth, depth, top, tier, index }
//   tear         { position, radius } the centre of the bite in comb six
//   window       { position, lookAt, lookAtSouth } behind comb four looking at the sun through it
//   cleftMouth   centre of the mouth in the wall; hero.cleftFrame { d, r, u, at(s, phi, rad, out) }, hero.cleftLength
//   also         hero.wallPoint(x, y, out) -> [x, y, z, ny, nz] on the displaced wall; hero.ledgesAt(x, y0, y1) ->
//                [{ y, width }] ledges where a bed stands back (for plants); hero.holeR(phi) the mouth's outline
//   buzzardLine  [from, to] 25 m off the upper curtains, south to north
//   hornetStation  point 14 m off comb five; ladderSeat / torchSeat under the roof at the north horn
//   roofLip      20 points along the upper roof lip (ferns)
import * as THREE from 'three';

const DEF_PALETTE = ['#D01F2B', '#2E5C8A', '#C08A4A', '#F2A51E', '#1E1712', '#EADBA8', '#DCE8F2'];
const ROOF_U = 210, ROOF_L = 110, Y_LO = -70, Y_HI = 300, X_HALF = 330;
const JUT_U = 38, JUT_L = 34, OUT_U = 26, OUT_L = 22;
const HALF_PI = Math.PI / 2, CLEFT_LEN = 80;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the bay (identical formulas in GLSL below) ----
function zBack(x) { const c = Math.cos(Math.min(1, Math.max(-1, x / 260)) * HALF_PI); return -40 * c * c; }
function zBackSlope(x) { if (Math.abs(x) >= 260) return 0; return 40 * (HALF_PI / 260) * Math.sin(2 * x / 260 * HALF_PI); }
function jutF(x) { return 0.22 + 0.78 * (1 - sstep(215, 300, Math.abs(x))); }

const GLSL_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunL, uSunCol, uSkyCol, uBounceCol;
uniform float uTime, uCalm, uShadowK;
uniform vec4 uWave[4];
uniform vec2 uAbs;
float hash11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float zBackF(float x){ float c = cos(clamp(x/260., -1., 1.)*1.5707963); return -40.*c*c; }
float jutG(float x){ return 0.22 + 0.78*(1. - smoothstep(215., 300., abs(x))); }
// 1 = sunlit, 0 = in the shadow of a roof (hero-local point)
float roofLit(vec3 p){
  float j = jutG(p.x), zb = zBackF(p.x);
  float hU = ${ROOF_U}. - p.y, dU = max(zb + ${JUT_U}.*j - p.z, 0.);
  float lU = smoothstep(-1.6, 1.6, hU - dU*uShadowK);
  lU = mix(lU, 1., step(hU, -1.));
  float hL = ${ROOF_L}. - p.y, dL = max(zb + ${JUT_L}.*j - p.z, 0.);
  float lL = smoothstep(-1.6, 1.6, hL - dL*uShadowK);
  lL = mix(lL, 1., step(hL, -1.));
  return mix(lU*lL, 1., smoothstep(332., 350., abs(p.x)));
}
// defence wave: 0..1 abdomen flip at a hero-local point; jit delays one bee against its neighbours
float waveAt(vec2 p, float jit){
  float f = 0.;
  for (int i = 0; i < 4; i++){
    vec4 w = uWave[i];
    float x = w.w*45. - distance(p, w.xy) - jit*1.6;
    float pulse = smoothstep(0., 2., x)*(1. - smoothstep(5.5, 11., x));
    f = max(f, pulse*step(0., w.w)*(1. - smoothstep(420., 560., w.w*45.)));
  }
  return f;
}
vec3 sunShade(vec3 alb, vec3 N, vec3 V, float lit, float gloss, float spec){
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 amb = mix(uBounceCol, uSkyCol, N.y*0.5 + 0.5) + uSunCol*vec3(0.075, 0.066, 0.058)*(1. - lit);   // under a roof the sunlit rock below throws warm light up
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  return alb*(uSunCol*ndl*lit + amb) + uSunCol*spec*pow(max(dot(N, H), 0.), gloss)*lit*step(0.001, ndl);
}
`;

// curtain coverage, shared by the shell shader and by the placement of the instanced bees
const GLSL_COVER = /* glsl */`
// c = (cx, d, side, rho); k = (index, seed, crown depth, coverage)
float curtain(vec4 c, vec4 k, float bareTop){
  float wob = 0.05*sin(c.x*0.31 + k.y*17.) + 0.04*sin(c.y*0.42 + k.y*31. + c.x*0.11) + 0.03*sin(c.x*0.9 - c.y*0.7 + k.y*5.);
  float edge = 0.87 + 0.8*wob - (1. - k.w)*0.22 - (1. - c.z)*0.03;
  float m = 1. - smoothstep(edge - 0.045, edge + 0.045, c.w);
  float top = bareTop*(1. + 1.5*wob);
  m *= smoothstep(top - 1.6, top + 1.6, c.y + 0.01);
  float fr = uAbs.y*(60.) - 6.;
  m *= mix(1., smoothstep(fr, fr + 5., c.y), step(abs(k.x - uAbs.x), 0.5));
  return m;
}
`;
function curtainJS(cx, d, side, rho, comb) {
  const s = comb.seed;
  const wob = 0.05 * Math.sin(cx * 0.31 + s * 17) + 0.04 * Math.sin(d * 0.42 + s * 31 + cx * 0.11) + 0.03 * Math.sin(cx * 0.9 - d * 0.7 + s * 5);
  const edge = 0.87 + 0.8 * wob - (1 - comb.cover) * 0.22 - (1 - side) * 0.03;
  let m = 1 - sstep(edge - 0.045, edge + 0.045, rho);
  const top = comb.bareTop * (1 + 1.5 * wob);
  m *= sstep(top - 1.6, top + 1.6, d + 0.01);
  return m;
}

// ---- comb layout ----
function makeCombs(rng, season) {
  const xsU = [180, 108, 38, -42, -116, -184], hwU = [30, 30, 28.5, 26, 28.5, 30];
  const combs = [];
  for (let i = 0; i < 12; i++) {
    const up = i < 6;
    const x = up ? xsU[i] : 216 - (i - 6) * 72 + rng.range(-4, 4);
    const hw = up ? hwU[i] + rng.range(-0.8, 0.8) : rng.range(22, 31);
    const dep = up ? rng.range(38, 42) : rng.range(28, 41);
    const s = zBackSlope(x), il = 1 / Math.hypot(1, s);
    const c = {
      index: i, tier: up ? 0 : 1, x, hw, dep, top: (up ? ROOF_U : ROOF_L) + 1.2,
      z: zBack(x) + (up ? OUT_U : OUT_L),
      t: new THREE.Vector3(il, 0, s * il), n: new THREE.Vector3(-s * il, 0, il),
      seed: rng(), lop: rng.range(-0.07, 0.07), ph: [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)],
      crown: (up ? rng.range(13, 17) : rng.range(9, 14)) * (season === 'autumn' ? 1.6 : 1),
      cover: rng.range(0.72, 1), bareTop: (rng.chance(0.45) ? rng.range(10.5, 13.5) : rng.range(8.5, 11)) * (up ? 1 : 0.7), age: rng.range(0, 1),
    };
    if (i === 3) { c.bareTop = rng.range(13, 15.5); c.crown = Math.max(c.crown, 17); c.cover = 0.95; c.age = 0.15; }  // the window
    if (i === 5) { c.crown = Math.max(c.crown, 19); c.bareTop = 7 + rng.range(0, 3); c.cover = 0.9; }                      // the torn comb
    if (i <= 2) { c.cover = i ? rng.range(0.9, 1) : Math.max(c.cover, 0.9); c.bareTop = Math.min(c.bareTop, 10.5); }                     // close pass: well cloaked
    combs.push(c);
  }
  return combs;
}
// rim of comb c at angle a (0..PI): returns [cx, d]
function rimAt(c, a) {
  const co = Math.cos(a), si = Math.sin(a);
  const w = 1 + 0.035 * Math.sin(3 * a + c.ph[0]) + 0.025 * Math.sin(5 * a + c.ph[1]) + 0.012 * Math.sin(11 * a + c.ph[2]);
  const wr = 1 + (w - 1) * Math.min(1, si * 4);
  const d = c.dep * si * wr;
  return [c.hw * Math.sign(co) * Math.pow(Math.abs(co), 1.24) * wr + c.lop * d, d];
}
// half thickness of comb c at (rho, d)
function halfThick(c, rho, cx, d) {
  const crownF = 1 - sstep(c.crown * 0.55, c.crown * 1.2, d);
  const lump = 0.12 * Math.sin(cx * 0.55 + c.seed * 40) * Math.sin(d * 0.47 + c.seed * 9);
  const body = 0.8 + 2.3 * crownF + lump;
  const rim = Math.sqrt(Math.max(0, 1 - Math.pow(rho, 6)));
  return 0.16 + body * rim * (0.35 + 0.65 * sstep(0, 3, d + 1.2));
}
// rho (0 centre top .. 1 rim) of a point (cx, d) of comb c, by bisection on the rim angle
function rhoAt(c, cx, d) {
  if (d <= 0.001) return Math.abs(cx) / c.hw;
  let lo = 0.0005, hi = Math.PI - 0.0005;
  for (let k = 0; k < 22; k++) {
    const a = (lo + hi) / 2, r = rimAt(c, a);
    if (cx * r[1] - d * r[0] > 0) hi = a; else lo = a;
  }
  const r = rimAt(c, (lo + hi) / 2);
  return Math.hypot(cx, d) / Math.max(1e-3, Math.hypot(r[0], r[1]));
}
function combPoint(c, cx, d, cz, out) {
  return out.set(c.x + c.t.x * cx + c.n.x * cz, c.top - d, c.z + c.t.z * cx + c.n.z * cz);
}
// the bite in comb six: radius at polar angle th about its centre (same formula in GLSL)
function biteR(b, th) { return b.r * (1 + 0.11 * Math.sin(3 * th + b.p1) + 0.07 * Math.sin(7 * th + b.p2) + 0.035 * Math.sin(13 * th + b.p3) + 0.38 * sstep(0.3, 1, Math.sin(th))); }

// ---- the camera line ----
// Out of the bough (the world builds it along `entry`) the line bears left for the torn comb, turns north 50 m before it
// and runs along the upper tier, sinking; swings right, out over the gorge, turns left 150 m off the north horn and climbs
// back in to the honey hunters' ladder under the roof, where it turns south and
// flies the close pass south as a slalom: out to ~15-20 m before each comb and
// cutting back in, so the heading meets every curtain at 20-30 degrees and the face (not the edge) of the comb is what
// lies ahead. Through the gap behind comb four (the window, flown toward its back face), out past comb five, a wheeling
// loop out over the gorge and a straight run down the axis of the cleft: through the tear in comb six, into the mouth,
// to the portal.
export function makeFlyThrough() {
  const pts = [];
  // the bough's axis: from 254 m short of a point 90 m off comb five, straight at comb three (x north, z out from the wall)
  const Jx = -140, Jz = zBack(-140) + OUT_U + 90, c3x = 38, c3z = zBack(38) + OUT_U;
  const dl = Math.hypot(c3x - Jx, c3z - Jz), d0 = [(c3x - Jx) / dl, (c3z - Jz) / dl], S = [Jx - d0[0] * 254, Jz - d0[1] * 254];
  // the way to the ladder, as waypoints [north, height, out from the wall] (the world flies the bough's first 104 m itself)
  const ax = (d) => [S[0] + d0[0] * d, 180.3, S[1] + d0[1] * d];
  const W = [
    ax(130),                                                                                       // on down the bough's line
    [-230, 181.5, 152], [-218, 183.5, 129], [-211, 185.5, 108], [-204, 187, 91],                   // in on the torn comb, to 50 m before it
    [-190, 188, 76], [-166, 187.5, 65], [-130, 184, 56], [-88, 175.5, 49], [-46, 166, 46],         // north, 45 to 60 m off the curtains, sinking
    [-4, 159.5, 46], [32, 157, 47], [60, 156.5, 50],                                               // both tiers ahead and to the left
    [99.3, 155, 76], [138.6, 151, 102], [177.9, 146, 127.9], [217.2, 140, 153.9], [260, 134, 182],          // out over the gorge, north-east, sinking
    [283, 131, 188], [302, 129.5, 176], [306.5, 130, 154],                                             // the far turn: round to the left, 150 m off the horn, the whole cliff behind the left shoulder
    [288, 141, 126], [268, 155, 102], [249, 169, 80], [234, 180, 62.5], [223, 185.4, 49.5], [213, 187.1, 40], [203, 187.45, 34.94],   // the dive back in on the face of comb one, past the ladder that hangs over the roof's lip
  ];
  for (const q of W) pts.push([q[0], q[1], q[2]]);
  const route = { comb6: 4, north: 7, tiers: 12, vista: 15, far: 20, ladder: pts.length - 3, pass: pts.length };      // pass: the first point of the close pass (x 194)      // indices of the beats in pts
  const zc = (x) => zBack(x) + OUT_U;
  const P = (x, y, off) => pts.push([x, y, zc(x) + off]);
  const cosw = (a, b, x0, x1, x) => (a + b) / 2 + (a - b) / 2 * Math.cos(Math.PI * (x0 - x) / (x0 - x1));   // a at x0 .. b at x1
  // distance off the comb line along the slalom: peaks just north of each comb, troughs abeam its middle
  const off = (x) => x > 203 ? 13.5 - 16 * sstep(203, 243, x) : x > 176 ? cosw(13.5, 9, 203, 176, x) : x > 140 ? cosw(9, 19.5, 176, 140, x) : x > 104 ? cosw(19.5, 8.5, 140, 104, x)
    : x > 70 ? cosw(8.5, 19.5, 104, 70, x) : cosw(19.5, 8.8, 70, 34, x);
  let secondPassStart = pts.length;
  for (let x = 194; x >= 34; x -= 9) { if (x === 140) secondPassStart = pts.length; P(x, 187 + 2.6 * sstep(240, 100, x), off(x)); }
  P(34, 189.6, 8.8);
  P(21, 189.7, 8.2); P(8.5, 190.2, 5); P(-3, 191.2, -0.5); P(-13.5, 192.6, -7.5); P(-25, 193.8, -13.6);   // into the gap, deep into the alley behind comb four
  P(-40, 194.6, -15.8); P(-56, 193.6, -12.5); P(-68, 192, -8); P(-78, 190.3, 0);                 // toward its back face (the window), out through the next gap
  P(-87, 189.2, 7.5); P(-96, 188.2, 12.5); P(-106, 187.6, 15); P(-119, 187.8, 15.8); P(-132, 188.6, 17.5);   // comb five from 15 m, hornets between
  // the wheel: left and out over the gorge, then right through 140 degrees onto the axis of the cleft
  const c18 = Math.cos(18 * Math.PI / 180), s18 = Math.sin(18 * Math.PI / 180), aF = 82 * Math.PI / 180;
  const dir = new THREE.Vector3(-Math.cos(aF) * c18, -s18, -Math.sin(aF) * c18);
  const xm = -190, M = new THREE.Vector3(xm, 182.5, zBack(xm));
  const S0 = -42, E = new THREE.Vector3().copy(M).addScaledVector(dir, S0);
  const hx = dir.x / c18, hz = dir.z / c18, R = 24;
  const C = [E.x - hz * R, E.z + hx * R];                              // centre of the right-hand arc (to the right of the heading)
  [[132, 0.5], [99, 2.6], [66, 3.4], [33, 2.2]].forEach(([deg, up]) => {
    const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);  // the point deg degrees of turn before the end
    const rx = E.x - C[0], rz = E.z - C[1];
    pts.push([C[0] + rx * ca + rz * sa, E.y + up, C[1] - rx * sa + rz * ca]);
  });
  for (const s of [S0, -26, -10, 6, 24, 42, 60, CLEFT_LEN]) pts.push([M.x + dir.x * s, M.y + dir.y * s, M.z + dir.z * s]);
  return { pts, secondPassStart, mouth: M, dir, portal: new THREE.Vector3().copy(M).addScaledVector(dir, CLEFT_LEN), entry: { S, d0 }, route };
}

// ---- small geometry builder ----
function makeBuilder(extra = {}) {
  const pos = [], idx = [], att = {};
  for (const k in extra) att[k] = [];
  return {
    pos, idx, att, extra,
    v(x, y, z, a = {}) { pos.push(x, y, z); for (const k in extra) { const src = a[k]; for (let i = 0; i < extra[k]; i++) att[k].push(src ? src[i] ?? 0 : 0); } return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    geometry(normals = true) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      for (const k in extra) g.setAttribute(k, new THREE.Float32BufferAttribute(att[k], extra[k]));
      g.setIndex(idx);
      if (normals) g.computeVertexNormals();
      return g;
    },
  };
}

// ---- the rock ----
// The wall is a stack of beds 3 to 13 m thick. Each bed stands proud of or back from its neighbours, is undercut along
// its foot and rounded at its shoulder (no bed is cut into blocks: joints are only painted). The mesh is displaced by this
// profile and the shader paints the same beds (identical formulas in BED_GLSL), so shadow lines, joints and tone agree.
// three flexures carry the beds up or down by a bed's thickness over some 24 m of wall (the beds bend through them, they
// do not step), so no course runs the length of the wall and no bedding plane ever jogs at a right angle
function bedFault(x, y) { const k = y - 180; return 7 * sstep(-12, 12, x - 150 - 0.25 * k) - 9 * sstep(-13, 13, x + 20 + 0.35 * k) + 6 * sstep(-11, 11, x + 262 - 0.2 * k); }
function bedWarp(x, y) { return y + 0.06 * x + 5.5 * Math.sin(x * 0.0113 + 1.3) + 2.4 * Math.sin(x * 0.031 + 0.4) + bedFault(x, y); }
// Beds of clearly unequal thickness: the rate of bedC swings between about 0.03 and 0.27 per metre, so every 56 m of height
// there is one massive bed 22 to 34 m thick (behind the upper combs, behind the lower ones, high on the face), a bed of 8 to
// 12 m either side of it, and between those a stack of beds under 4 m.
function bedC(yw) { return yw * 0.15 + 0.964 * Math.sin(yw * 0.112 + 0.935) + 0.084 * Math.sin(yw * 0.19 + 2.1); }
function bedDc(yw) { return 0.15 + 0.108 * Math.cos(yw * 0.112 + 0.935) + 0.016 * Math.cos(yw * 0.19 + 2.1); }
function bedO(i) { return 0.62 * Math.sin(i * 2.399 + 0.5) + 0.38 * Math.sin(i * 5.71 + 1.9); }
// (the rock is not cut into blocks: its few joints are painted by the shader, leaning and dying out inside a bed)
// out: [metres proud of the wall, bed index, 0..1 up the bed, 0]
function bedDisp(x, y, out) {
  const yw = bedWarp(x, y), c = bedC(yw), i = Math.floor(c), f = c - i, T = 1 / Math.max(bedDc(yw), 0.03);
  out[0] = 1.9 * bedO(i) - 1.1 * (1 - sstep(0, Math.min(0.14, 3 / T), f)) - 0.7 * sstep(1 - Math.min(0.18, 3 / T), 1, f);
  out[1] = i; out[2] = f; out[3] = 0;
  return out;
}
const BED_GLSL = /* glsl */`
float bedO(float i){ return 0.62*sin(i*2.399 + 0.5) + 0.38*sin(i*5.71 + 1.9); }
float bedWarp(vec3 P){ float k = P.y - 180.;
  return P.y + 0.06*P.x + 5.5*sin(P.x*0.0113 + 1.3) + 2.4*sin(P.x*0.031 + 0.4)
    + 7.*smoothstep(-12., 12., P.x - 150. - 0.25*k) - 9.*smoothstep(-13., 13., P.x + 20. + 0.35*k) + 6.*smoothstep(-11., 11., P.x + 262. - 0.2*k); }
float bedC(float yw){ return yw*0.15 + 0.964*sin(yw*0.112 + 0.935) + 0.084*sin(yw*0.19 + 2.1); }
float bedDc(float yw){ return 0.15 + 0.108*cos(yw*0.112 + 0.935) + 0.016*cos(yw*0.19 + 2.1); }
`;
// the mouth of the cleft: a ragged crack, radius at angle phi in the cleft's own cross-section (same in GLSL)
function holeR(phi) {
  const c = Math.cos(phi), si = Math.sin(phi), b = si > 0 ? 15.5 : 21;
  const r = 1 / Math.pow(Math.pow(Math.abs(c / 12.5), 2.2) + Math.pow(Math.abs(si / b), 2.2), 1 / 2.2);
  return r * (1 + 0.085 * Math.sin(3 * phi + 0.7) + 0.06 * Math.sin(5 * phi + 2.1) + 0.04 * Math.sin(9 * phi + 4) + 0.03 * Math.sin(14 * phi + 1.3));
}
const HOLE_GLSL = /* glsl */`
float holeR(float phi){
  float c = cos(phi), si = sin(phi), b = si > 0. ? 15.5 : 21.;
  float r = 1./pow(pow(abs(c/12.5), 2.2) + pow(abs(si/b), 2.2) + 1e-9, 1./2.2);
  return r*(1. + 0.085*sin(3.*phi + 0.7) + 0.06*sin(5.*phi + 2.1) + 0.04*sin(9.*phi + 4.) + 0.03*sin(14.*phi + 1.3));
}
`;
function profileAt(x) {
  const j = jutF(x), jl = JUT_L * j, ju = JUT_U * j;
  return [[26, Y_LO], [14, -35], [5, 0], [1, 35], [0, 70], [0, 100], [0.3, 108.5], [jl * 0.25, 110.2], [jl * 0.6, 110.6], [jl * 0.92, 111.6],
    [jl + 0.5, 115.5], [jl * 0.9, 122], [jl * 0.55, 128], [jl * 0.2, 135], [0.5, 145], [0, 160], [0, 185], [0, 203], [0.3, 208.6],
    [ju * 0.25, 210.2], [ju * 0.6, 210.6], [ju * 0.93, 211.8], [ju + 1, 216.5], [ju - 1.5, 228], [ju - 6, 250], [ju - 13, 275], [ju - 22, Y_HI]];
}
// rows per profile segment: fine where the wall is seen between the tiers, coarse under the roofs
const PROFILE_SUB = [10, 10, 10, 10, 9, 3, 2, 1, 2, 2, 5, 6, 7, 8, 8, 14, 10, 3, 2, 1, 2, 2, 4, 6, 7, 7];
// what the big forms and the beds add to the profile at (x, y): metres along the profile's outward normal
function wallDisp(noise, x, y, zo, ny, mouthF, smooth) {
  const under = Math.max(0, -ny), wallW = 1 - sstep(0.45, 0.95, Math.abs(ny));
  const big = noise.fbm3(x * 0.011, y * 0.022, zo * 0.02, 4);
  const butt = noise.ridged2(x * 0.016 + 7, y * 0.0035, 3);
  const fine = noise.n3(x * 0.07, y * 0.11, zo * 0.07);
  const amp = 1 + 1.7 * sstep(222, 262, y) + 1.3 * sstep(100, 55, y);
  const bd = bedDisp(x, y, _bd);
  let disp = (3.4 * big * amp + 2.6 * (butt - 0.4) * amp + 0.5 * fine) * (1 - 0.72 * under) + bd[0] * (0.25 + 0.75 * wallW) * (1 - under);
  // where the rock slopes back (the top of the lower roof) every bed is a tread and a riser
  const yw = bedWarp(x, y), T = 1 / Math.max(0.075, bedDc(yw));
  disp += sstep(0.3, 0.62, ny) * (bd[2] - 0.5) * Math.min(T, 9) * 0.6;
  const nearRoof = Math.max(0, 1 - Math.abs(y - ROOF_U) / 7) + Math.max(0, 1 - Math.abs(y - ROOF_L) / 7);
  disp *= 1 - 0.55 * Math.min(1, nearRoof);
  // (the big forms alone, without the beds: the surface the light is worked out on)
  if (smooth) smooth[0] = (3.4 * big * amp + 2.6 * (butt - 0.4) * amp) * (1 - 0.72 * under) * (1 - 0.55 * Math.min(1, nearRoof)) * mouthF;
  return disp * mouthF;
}
const _bd = [0, 0, 0, 0];
async function buildCliff(ctx, noise, mouthF, pathDist) {
  const NX = 176, B = makeBuilder({ color: 3 }), sm = [], _sm = [0];
  const rows = PROFILE_SUB.reduce((a, b) => a + b, 0) + 1;
  for (let ix = 0; ix <= NX; ix++) {
    const x = -X_HALF + (2 * X_HALF * ix) / NX, P = profileAt(x), zb = zBack(x);
    for (let k = 0; k < P.length; k++) {
      const last = k === P.length - 1, n = last ? 1 : PROFILE_SUB[k];
      for (let s = 0; s < n; s++) {
        const f = last ? 0 : s / n, a = P[k], b = last ? P[k] : P[k + 1];
        const zo = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        const p0 = P[Math.max(0, k - (s === 0 ? 1 : 0))], p1 = P[Math.min(P.length - 1, k + 1)];
        let tz = p1[0] - p0[0], ty = p1[1] - p0[1]; const tl = Math.hypot(tz, ty) || 1; tz /= tl; ty /= tl;
        const nz = ty, ny = -tz;                       // outward normal of the profile
        const under = Math.max(0, -ny);                // roof underside: keep it calm
        const mf = mouthF(x, y);
        let disp = wallDisp(noise, x, y, zo, ny, mf, _sm); const disp0 = disp;
        // never nearer the camera line than 7 m (the alley behind the combs is only 26 m wide)
        if (y > 150 && y < 218 && mf > 0.5) for (let it = 0; it < 4; it++) {
          const d = pathDist(x, y + ny * disp, zb + zo + nz * disp);
          if (d >= 7.2) break;
          disp -= (7.3 - d) * 1.15;
        }
        const tone = 0.5 + 0.5 * noise.fbm2(x * 0.008 + 3, y * 0.012, 3), stain = 0.5 + 0.5 * noise.n2(x * 0.05, y * 0.012 + 9);
        B.v(x, y + ny * disp, zb + zo + nz * disp, { color: [tone, stain, under] });
        const ds = _sm[0] + disp - disp0; sm.push(x, y + ny * ds, zb + zo + nz * ds);
      }
    }
    await ctx.yield();
  }
  for (let ix = 0; ix < NX; ix++) for (let r = 0; r < rows - 1; r++) {
    const a = ix * rows + r, b = a + rows;
    B.quad(a, b, b + 1, a + 1);
  }
  await ctx.yield();
  const g = B.geometry(false);
  await ctx.yield();
  // The light is worked out on the wall's big forms, not on the displaced beds: the mesh is far too coarse to carry a bed
  // of two or three metres, and normals taken from it shaded the wall in soft wavy bands that crossed the true bedding.
  // The beds are drawn crisp by the shader (tone steps, lip shadows, lit ledge tops, cracks).
  const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.Float32BufferAttribute(sm, 3)); gs.setIndex(g.index);
  await ctx.yield();
  gs.computeVertexNormals();
  await ctx.yield();
  g.setAttribute('normal', gs.attributes.normal);
  return g;
}

// radius of the cleft wall at distance s along its axis and angle phi (>= 9.7 m everywhere); periodic in phi
function cleftRad(noise, s, phi) {
  const a = 9.8 + 4.2 * (1 - sstep(0, 60, s)), b = 9.8 + 9.5 * (1 - sstep(0, 66, s));
  const c = Math.cos(phi), si = Math.sin(phi);
  const r = 1 / Math.pow(Math.pow(Math.abs(c / a), 2.6) + Math.pow(Math.abs(si / b), 2.6), 1 / 2.6);
  const n = noise.fbm3(c * 2.2 + 11, si * 2.2, s * 0.09, 3);
  return r + 2.4 * Math.abs(n) * sstep(-3, 6, s) + 0.5 * Math.abs(noise.n3(c * 2.6, si * 2.6 + 5, s * 0.4));
}
// the tunnel takes the shape of the ragged mouth where it meets the wall and its own shape 10 m in
function tubeRad(noise, s, phi) { return holeR(phi) + (cleftRad(noise, s, phi) - holeR(phi)) * sstep(1, 11, s); }
function cleftFrame(fly) {
  const d = fly.dir, r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
  const u = new THREE.Vector3().crossVectors(r, d).normalize();
  const at = (s, phi, rad, out) => out.copy(fly.mouth).addScaledVector(d, s).addScaledVector(r, Math.cos(phi) * rad).addScaledVector(u, Math.sin(phi) * rad);
  return { d, r, u, at };
}
// where the ray of the mouth's edge at angle phi (radius rad) meets the wall: distance along the axis (negative = outside)
function makeLipS(F, wallZ) {
  const tmp = new THREE.Vector3();
  return (phi, rad) => {
    let s = 0;
    for (let k = 0; k < 5; k++) { F.at(s, phi, rad, tmp); s += (tmp.z - wallZ(tmp.x, tmp.y)) / Math.max(0.3, -F.d.z); }
    return s;
  };
}
// The cleft: a collar of rock that stands proud of the wall round the ragged mouth and rolls into the tunnel, then the tunnel.
async function buildCleft(ctx, noise, fly, lipS) {
  const F = cleftFrame(fly), B = makeBuilder({ color: 3 }), NS = 48, tmp = new THREE.Vector3();
  const LIP = [[4.6, 1.2], [3.0, -0.7], [1.5, -1.5], [0.3, -1.0], [-0.15, 0.6]];     // radius beyond the mouth's edge, metres into the wall
  const fixed = []; for (let s = 16; s <= CLEFT_LEN + 4.01; s += 3) fixed.push(s);
  const NR = LIP.length + 3 + fixed.length, swAt = [];
  for (let i = 0; i < NS; i++) { const phi = (i / NS) * Math.PI * 2; swAt.push(lipS(phi, holeR(phi))); }     // where the wall is, once per spoke
  await ctx.yield();
  for (let k = 0; k < NR; k++) for (let i = 0; i <= NS; i++) {
    const phi = ((i % NS) / NS) * Math.PI * 2, c = Math.cos(phi), si = Math.sin(phi), Rh = holeR(phi), sw = swAt[i % NS];
    let s, rad;
    if (k < LIP.length) { rad = Rh + LIP[k][0] + (k > 0 && k < 4 ? 0.5 * noise.n3(c * 3, si * 3, k * 0.7) : 0); s = sw + LIP[k][1]; }
    else if (k < LIP.length + 3) { const t = (k - LIP.length + 1) / 3; s = sw + 0.6 + (13 - sw - 0.6) * t; rad = Rh - 0.15 + (cleftRad(noise, s, phi) - Rh + 0.15) * sstep(0, 1, t); }
    else { s = fixed[k - LIP.length - 3]; rad = cleftRad(noise, s, phi); }
    F.at(s, phi, rad, tmp);
    B.v(tmp.x, tmp.y, tmp.z, { color: [0.45 + 0.25 * noise.n3(c * 1.5, si * 1.5, s * 0.08), 0.5 + 0.5 * noise.n3(c * 2, si * 2 + 9, s * 0.05), 0] });
    if (i === NS && (k & 3) === 3) await ctx.yield();     // every fourth ring
  }
  for (let k = 0; k < NR - 1; k++) for (let i = 0; i < NS; i++) {
    const a = k * (NS + 1) + i, b = a + NS + 1;
    B.quad(a, a + 1, b + 1, b);
  }
  await ctx.yield();
  const cap = B.v(fly.mouth.x + F.d.x * (CLEFT_LEN + 7), fly.mouth.y + F.d.y * (CLEFT_LEN + 7), fly.mouth.z + F.d.z * (CLEFT_LEN + 7), { color: [0.1, 0.5, 0] });
  const base = (NR - 1) * (NS + 1);
  for (let i = 0; i < NS; i++) B.tri(base + i, base + i + 1, cap);
  return B.geometry();
}

const ROCK_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vLocal, vWorld, vN, vNL, vTone;
#include <fog_pars_vertex>
void main(){
  vLocal = position; vTone = color; vNL = normal;
  vec4 wp = modelMatrix*vec4(position, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
${GLSL_COMMON}
${BED_GLSL}
${HOLE_GLSL}
uniform vec3 uRock, uPale, uPortalPos, uPortalCol, uGlowPos, uGlowCol, uWinPos, uWinCol, uMouth, uMr, uMu, uMd;
uniform vec4 uCombA[12];
uniform vec4 uCleft, uHaze, uSea;               // uCleft: 1 = the cliff (cut the mouth), how strongly the beds show, 1 = the cleft mesh. uHaze: aerial haze (rock beyond the slab)
uniform float uWet;
varying vec3 vLocal, vWorld, vN, vNL, vTone;
#include <fog_pars_fragment>
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  float n = dot(i, vec3(1., 57., 113.));
  return mix(mix(mix(hash11(n), hash11(n + 1.), f.x), mix(hash11(n + 57.), hash11(n + 58.), f.x), f.y),
             mix(mix(hash11(n + 113.), hash11(n + 114.), f.x), mix(hash11(n + 170.), hash11(n + 171.), f.x), f.y), f.z);
}
float fbm(vec3 p){ return 0.5*vnoise(p) + 0.25*vnoise(p*2.03 + 3.1) + 0.125*vnoise(p*4.1 + 7.7) + 0.0625*vnoise(p*8.3 + 1.3); }
vec2 vor(vec2 p){   // x: half the gap between the two nearest cell centres (0 on a cell's edge); y: the cell's own number
  vec2 ip = floor(p), fp = p - ip; float d1 = 8., d2 = 8., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j));
    float hh = hash21(ip + g);
    float d = length(g + vec2(hh, fract(hh*57.31 + 0.37)) - fp);
    float n = step(d, d1);
    d2 = min(d2, max(d, d1)); id = mix(id, hh, n); d1 = min(d1, d);
  }
  return vec2(0.5*(d2 - d1), id);
}
void main(){
  vec3 P = vLocal;
  // the mouth of the cleft is a ragged crack; the collar of the cleft mesh covers the cut
  vec3 qm = P - uMouth; vec2 mb = vec2(dot(qm, uMr), dot(qm, uMu));
  float mrho = length(mb), mEdge = mrho - holeR(atan(mb.y, mb.x + step(mrho, 1e-4)*1e-3));
  float mAx = dot(qm, uMd), nearMouth = step(abs(mAx), 16.);
  if (uCleft.x > 0.5 && mEdge < 1.3 && nearMouth > 0.5) discard;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float under = smoothstep(0.35, 0.8, -N.y), top = smoothstep(0.35, 0.8, N.y);
  float bedK = uCleft.y, wallW = (1. - under)*(1. - 0.7*top)*bedK;
  float fwP = length(fwidth(P)) + 1e-5;
  float lod1 = 1. - smoothstep(0.25, 1.1, fwP), lod2 = 1. - smoothstep(0.08, 0.4, fwP), lod3 = 1. - smoothstep(0.015, 0.07, fwP);
  float lodB = 1. - smoothstep(0.6, 2.4, fwP);                                       // far away the beds melt into an average
  // ---- the beds: tone bed by bed, bedding planes, joints, laminae ----
  float yw = bedWarp(P) + 1.2*(vnoise(P*vec3(0.05, 0.02, 0.05)) - 0.5);
  float bc = bedC(yw), bedI = floor(bc), bedF = bc - bedI;
  float T = 1./max(bedDc(yw), 0.03);                                                // thickness of this bed, metres
  float massive = smoothstep(7., 15., T);                                           // the 20 to 30 m beds are plain; the thin stacks are laminated
  float bedVis = 1. - smoothstep(0.1, 0.4, fwP/T);                                  // a bed under three pixels thick melts into the face: from far off only the great beds show
  float wE = max(0.16, fwP*1.3);
  float pxB = fwidth(bc)*T + 1e-4;                                                  // one pixel, measured ACROSS the beds, in metres
  // tone bed by bed, eased across each bedding plane so the edge never stair-steps
  float eF = clamp(wE*1.3/T, 0.004, 0.45), tUp = smoothstep(1. - eF, 1., bedF)*0.5, tDn = (1. - smoothstep(0., eF, bedF))*0.5;
  float hb1r = hash11(bedI*1.31 + 7.);
  float hb1 = mix(mix(hb1r, hash11((bedI + 1.)*1.31 + 7.), tUp), hash11((bedI - 1.)*1.31 + 7.), tDn);
  float hb2 = mix(mix(hash11(bedI*2.17 + 3.), hash11((bedI + 1.)*2.17 + 3.), tUp), hash11((bedI - 1.)*2.17 + 3.), tDn);
  hb1 = mix(0.42, hb1, bedVis); hb2 = mix(0.55, hb2, bedVis);
  float sideF = 1. - 0.9*smoothstep(0.6, 0.9, abs(normalize(vNL + vec3(0., 1e-5, 0.)).x));                             // a face seen end-on to the beds (a buttress side) carries no painted courses
  wallW *= sideF;
  float shade0 = 1. - roofLit(P);                                                    // under a roof everything is softer
  // (how strongly a bedding plane is cracked belongs to the PLANE, not to the bed on either side of it: a value that
  // changed at the plane itself cut every crack in two along its middle, and the bump made dashes of the cut)
  float planeI = floor(bc + 0.5);
  float alongK = (0.5 + 0.5*smoothstep(0.3, 0.62, vnoise(vec3(P.x*0.07, planeI*3.1, 1.))))*(0.6 + 0.4*step(0.35, hash11(planeI*5.3 + 2.)))*bedVis;
  float crackD = min(bedF, 1. - bedF)*T, crackW = max(wE*(1.5 + 2.*shade0), 2.2*pxB);
  float crack = (1. - smoothstep(min(wE*0.4, crackW*0.3), crackW, crackD))*lodB*alongK*(1. - 0.35*shade0);
  // THE BUMP IS BAND-LIMITED. Screen derivatives are taken per 2x2 block of pixels, so any feature of the height field
  // narrower than about four pixels shades as a row of dashes. Every line that goes into the height is therefore a
  // groove at least 4.5 px wide on each side (crackH, jointH, the lamina steps, the plate edges); the thin lines
  // themselves (cracks, partings, hairlines, pocks) are drawn in the colour only, where each pixel is its own.
  float crackH = (1. - smoothstep(0., max(crackW, 4.5*pxB), crackD))*lodB*alongK*(1. - 0.35*shade0);
  // joints: no blocks. In the thicker beds a few short cracks open, each leaning 10 to 25 degrees its own way, wandering,
  // and dying out inside the bed well short of its bedding planes: nothing ever meets a bedding plane, least of all squarely
  float hgt = (bedF - 0.5)*T;
  float jLean = mix(0.19, 0.46, hash11(bedI*3.7 + 1.))*(hash11(bedI*1.9 + 4.) < 0.3 ? -1. : 1.);
  float jq = (P.x + jLean*hgt + 3.2*vnoise(vec3(P.x*0.021, P.y*0.1, bedI*1.3)))*0.019 + 3.1*sin(bedI*4.3);
  jq += 0.3*sin(jq*2.3 + bedI*2.1);
  float jI = floor(jq + 0.5), jd = abs(jq - jI)/0.019;
  float jOn = step(0.5, hash11(jI*7.3 + bedI*1.7)), jA = hash11(jI*3.1 + bedI*5.9);
  float jFade = smoothstep(0.08 + 0.3*jA, 0.3 + 0.3*jA, bedF)*(1. - smoothstep(0.55 + 0.25*jA, 0.8 + 0.18*jA, bedF));
  float jK = jOn*jFade*lodB*smoothstep(4.5, 9., T)*0.8, jPx = min(fwidth(jq), 0.03)/0.019;
  float joint = (1. - smoothstep(wE*0.4, max(wE*1.6, 2.2*jPx), jd))*jK, jointH = (1. - smoothstep(0., max(wE*1.6, 4.5*jPx), jd))*jK;
  // master joints: a few wandering cracks that run through many beds, each leaning 10 to 23 degrees, fading in and out
  float mjx = P.x + 0.3*(P.y - 180.) + 9.*vnoise(vec3(P.x*0.006, P.y*0.035, 1.)) + 2.6*vnoise(vec3(P.x*0.03, P.y*0.16, 5.));
  float mjc = mjx/72. + 0.33*sin(mjx*0.031), mjI = floor(mjc + 0.5);
  float mjs = (mjc - mjI)*72. + 0.12*(2.*hash11(mjI*5.3 + 1.) - 1.)*(P.y - 180.), mjd = abs(mjs);
  float mjOn = step(0.3, hash11(mjI*7.1 + 2.))*smoothstep(0.3, 0.55, vnoise(vec3(mjI*3.3, P.y*0.013, 8.)));
  float master = (1. - smoothstep(wE*0.6, wE*2.4 + 0.25, mjd))*mjOn*uCleft.y*sideF*(1. - smoothstep(1.2, 4., fwP));
  joint = max(joint, master)*(1. - 0.3*shade0); jointH = max(jointH, master)*(1. - 0.3*shade0);
  float hk = 0.5;
  float mTone = (hash11((mjI - step(mjs, 0.))*3.1 + 5.) - 0.5)*mjOn*(1. - smoothstep(8., 28., mjd));   // the rock weathers a little differently either side of one
  float thin = 1. - massive;
  // laminae: near-level, calm (no loops), with a crisp parting here and there
  float lamY = yw + 0.25*vnoise(vec3(P.x*0.035, P.y*0.05, bedI));
  float lamQ = lamY*(0.8 + 1.5*hb1r);
  // (each lamina is one crisp course with its own tone and its own small step in the face: nothing soft, nothing stretched)
  float lq = lamQ*1.3 + 0.4*sin(lamQ*0.83 + bedI*2.);
  float lqf = min(fwidth(lq), 1.);
  float lI = floor(lq), lF = lq - lI, lw = clamp(max(fwP*(1.1 + 2.*hb1r)*1.6 + 0.03, 1.5*lqf), 0.03, 1.), lwH = clamp(max(lw*1.6, 4.5*lqf), 0.08, 1.);
  float ltA = hash11(lI*1.7 + bedI*3.1), ltB = hash11((lI + 1.)*1.7 + bedI*3.1);
  float lt = mix(ltA, ltB, smoothstep(1. - lw, 1., lF)), ltH = mix(ltA, ltB, smoothstep(1. - lwH, 1., lF));
  // the laminae of one bed are not those of the next: they fade out toward both of its bedding planes, so nothing jumps there
  float eL = clamp(max(wE*2.2, 0.22)/T, 0.02, 0.5), lamWin = smoothstep(0., eL, bedF)*(1. - smoothstep(1. - eL, 1., bedF));
  float lamK = mix(0.3, 1., thin)*(1. - smoothstep(0.3, 0.9, lw))*lamWin;
  float lam = mix(0.5, lt, lamK), lamH = mix(0.5, ltH, lamK*(1. - smoothstep(0.45, 1., lwH)));
  // a parting runs along the MIDDLE of its own course (the course number is the same on both sides of the line), at least 1.5 px wide
  float lpQ = lamQ*0.5 + 0.3*hb1r, lpI = floor(lpQ), lpD = abs(lpQ - lpI - 0.5), lpW = max(fwidth(lpQ)*1.5, 0.012);
  float parting = (1. - smoothstep(lpW*0.35, lpW, lpD))*step(0.45, hash11(lpI*3.7 + bedI))*lod2*(0.35 + 0.65*thin)*lamWin*(1. - smoothstep(0.3, 0.5, lpW))
    *smoothstep(0.3, 0.6, vnoise(vec3(P.x*0.05, lpI, 3.)));
  float fineLo = vnoise(P*vec3(0.45, 1.2, 0.45));
  float fine = 0.62*fineLo + 0.38*mix(0.5, vnoise(P*vec3(1.3, 3.1, 1.3) + 5.), lod2);
  float grain = mix(0.5, 0.6*vnoise(P*vec3(4.1, 9., 4.1) + 2.) + 0.4*vnoise(P*13.7), lod3);
  float big = fbm(P*vec3(0.011, 0.017, 0.011) + 5.);
  float flake = vnoise(P*vec3(0.16, 0.5, 0.16) + 9.);                               // roof undersides spall in scallops
  // close to, the stone is crisp: hairline cracks along the iso-lines of two noises, pock marks, and on the roof undersides
  // the edges of spalled plates (drawn in the plane of the roof, so they never stretch)
  // (each hairline is sized from the pixel footprint of its OWN coordinate: never under 1.5 px wide, and it thins out to
  // nothing as its true width falls below a pixel, far off or at a grazing angle, instead of breaking into dots)
  float hn1 = vnoise(P*vec3(0.31, 0.47, 0.31) + 41.) - 0.5, hn2 = vnoise(P*vec3(1.05, 1.6, 1.05) + 23.) - 0.5;
  float hf1 = fwidth(hn1) + 1e-5, hf2 = fwidth(hn2) + 1e-5;
  float hw1 = max(0.03, hf1*1.5), hw2 = max(0.045, hf2*1.5);
  float hair = (1. - smoothstep(hw1*0.3, hw1, abs(hn1)))*lod2*smoothstep(0.35, 0.6, vnoise(P*0.06 + 77.))*clamp(0.045/hw1, 0., 1.)
    + 0.7*(1. - smoothstep(hw2*0.3, hw2, abs(hn2)))*lod3*clamp(0.07/hw2, 0., 1.);
  float pn = vnoise(P*2.6 + 13.), pf = fwidth(pn);
  float pock = smoothstep(0.71, 0.77 + pf, pn)*lod3*(1. - smoothstep(0.03, 0.1, pf));
  vec2 pw2 = P.xz*vec2(0.6, 1.) + 3.2*vec2(vnoise(vec3(P.xz*0.11, 2.)), vnoise(vec3(P.xz*0.11, 6.)));
  vec2 v1 = vor(pw2*0.21), v2 = vor(pw2*0.83 + 3.7);
  float plateE = (1. - smoothstep(0., (0.05 + fwP*0.8)*0.21, v1.x))*lod1 + 0.55*(1. - smoothstep(0., (0.02 + fwP*0.8)*0.83, v2.x))*lod2;
  float plateK = 0.25 + 0.75*smoothstep(0.32, 0.56, vnoise(vec3(P.xz*0.075, 14.)));           // the cracks come and go: never a whole paving
  float plateH = ((1. - smoothstep(0., (0.12 + fwP*3.2)*0.21, v1.x))*lod1 + 0.55*(1. - smoothstep(0., (0.06 + fwP*3.2)*0.83, v2.x))*lod2)*plateK;
  plateE *= plateK;
  // (a plate's own tone and level ease to the mean at its edge, where the crack is: no step under the crack)
  float plateT = mix(0.5, v1.y, lod1*smoothstep(0., (0.05 + fwP*0.8)*0.42, v1.x))*0.6 + mix(0.5, v2.y, lod2*smoothstep(0., (0.02 + fwP*0.8)*1.66, v2.x))*0.4;
  // a massive bed is not blank: it weathers in broad hollows and spalled plates
  float plate = fbm(P*vec3(0.06, 0.09, 0.06) + 17.), spall = smoothstep(0.46, 0.5, plate)*massive*uCleft.y;
  // the cleft: water-worn strata of uneven thickness that dip across the tunnel, cupped with scallops
  float cz = uCleft.z, sAx = mAx;
  float ys = P.y*0.94 + P.x*0.31 + 1.6*vnoise(P*vec3(0.07, 0.05, 0.07) + 3.) + 0.5*sin(sAx*0.21);
  float sc0 = ys*0.42 + 0.75*sin(ys*0.33 + 1.) + 0.4*sin(ys*0.9 + 2.);
  float sI = floor(sc0), sF = sc0 - sI, sE = clamp(fwP*2.2 + 0.03, 0.03, 0.4);
  float sT = hash11(sI*1.7 + 3.), sT2 = hash11(sI*3.3 + 9.);
  float sEdge = smoothstep(0., sE, sF)*(1. - smoothstep(1. - sE, 1., sF));
  float cupA = abs(2.*vnoise(vec3(mb*0.33, sAx*0.2) + 11.) - 1.), cupB = abs(2.*vnoise(vec3(mb*0.8, sAx*0.46) + 4.) - 1.);
  float scallop = smoothstep(0., 0.42, cupA)*0.7 + smoothstep(0., 0.5, cupB)*0.3*lod1;
  float h = -wallW*lodB*(crackH + jointH)*0.8 + (lamH - 0.5)*0.5*wallW + fine*0.45*lod1 + (grain - 0.5)*0.3 + (flake - 0.5)*1.2*under*lod1
    - under*(plateH*0.9 - plateT*0.7*lod1)
    + spall*0.5*wallW*lod1 + cz*((sT - 0.5)*1.5*sEdge - (1. - sEdge)*0.5 - scallop*1.3);
  // bump from the height field (derivatives taken once, outside any loop)
  vec3 dpx = dFdx(vWorld), dpy = dFdy(vWorld);
  float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 g = (hx*r1 + hy*r2)/(abs(det) + 1e-5)*sign(det + 1e-9);
  N = normalize(N - clamp(g*0.9, -1., 1.)*mix(0.08, 1., lod1) + vec3(0., 1e-5, 0.));
  // ---- colour: a dull ochre that goes buff and grey bed by bed, darker toward the foot ----
  vec3 grey = vec3(dot(uRock, vec3(0.3, 0.55, 0.15)))*vec3(1.0, 0.97, 0.9);
  vec3 base = mix(uRock*vec3(0.95, 0.88, 0.78), grey, clamp(0.2 + 0.45*hb1*hb1 + 0.32*(big - 0.5) + 0.09*(hk - 0.5) + 0.12*mTone, 0.05, 0.9));
  float val = mix(0.82, mix(0.6, 1.05, 0.88*hb2 + 0.12*hk), lodB*bedK*(1. - 0.45*massive))*mix(0.8, 1.12, vTone.x)*(0.84 + 0.32*lam)*(0.84 + 0.32*grain)*(1. + 0.1*spall - 0.12*massive*(plate - 0.5));
  // From far off, where the single beds have melted into the face, the wall is a few GREAT beds (four courses each, so
  // their planes are bedding planes close to): each its own tone, a crisp shadow line at least 2 px deep under its lip.
  float gq = bc*0.25, gI = floor(gq), gF = gq - gI, Tg = 4.*T;
  float farB = (1. - bedVis)*bedK*(1. - under)*(1. - 0.7*top)*sideF*(1. - uCleft.z);
  float gE = clamp(wE*1.3/Tg, 0.002, 0.3), gUp = smoothstep(1. - gE, 1., gF)*0.5, gDn = (1. - smoothstep(0., gE, gF))*0.5;
  float gTone = mix(mix(hash11(gI*1.9 + 11.), hash11((gI + 1.)*1.9 + 11.), gUp), hash11((gI - 1.)*1.9 + 11.), gDn);
  float gProud = hash11(gI*3.3 + 2.);                                               // which lips stand proud enough to throw a shadow
  float gWl = max(1.3, 2.3*fwP), gLip = (1. - smoothstep(gWl*0.55, gWl, (1. - gF)*Tg))*step(0.3, gProud)*farB;
  float gLedge = (1. - smoothstep(gWl*0.5, gWl*0.95, (1. - gF)*Tg))*step(gProud, 0.3)*farB;      // the great beds that stand back show the lit top of the bed below instead
  val *= mix(1., 0.72 + 0.58*gTone, farB)*(1. - 0.6*gLip)*(1. + 0.3*gLedge);
  // provinces of the face: rust where iron has bled, cream where lime has washed it
  float prov = fbm(P*vec3(0.0052, 0.011, 0.0052) + 31.);
  base = mix(base, base*vec3(1.1, 0.8, 0.6), smoothstep(0.5, 0.7, prov)*0.6*bedK);
  base = mix(base, mix(base, uPale*0.66, 0.6), (1. - smoothstep(0.3, 0.46, prov))*0.55*bedK);
  vec3 alb = base*val*mix(0.62, 1., smoothstep(40., 175., P.y));
  alb *= (1. - 0.5*hair*(1. - under))*(1. - 0.35*pock*(1. - under))*(1. - 0.42*parting*wallW);
  alb *= mix(1., (0.84 + 0.3*plateT)*(1. - 0.6*plateE), under*(1. - cz));
  // the rock of the cleft: bands of ochre, cream and umber with dark partings, polished pale on the lips of the scallops
  vec3 strat = mix(mix(uRock*0.62, uPale*0.5, smoothstep(0.35, 0.75, sT)), vec3(0.085, 0.05, 0.03), smoothstep(0.72, 0.9, sT2));
  strat *= (0.72 + 0.28*sEdge)*(0.8 + 0.4*fine)*(0.72 + 0.5*(1. - smoothstep(0., 0.3, cupA)));
  alb = mix(alb, strat, cz);
  // seepage: dark varnish streaks hang from the lips and ledges, broad stains under them, pale lime streaks between
  // (they are laid out along the face, round the horns as well: sC runs with the rock where it turns; and each hangs from the
  // lip of its own great bed and is gone by the next, so no streak runs the height of the wall)
  float sC = P.x - P.z*clamp(P.x/200., -1., 1.), hangA = 0.16 + 0.84*gF*gF;
  float sx = vnoise(vec3(sC*0.33 + gI*5.3, yw*0.016, 3.)), sx2 = mix(0.5, vnoise(vec3(sC*1.1, yw*0.05, 7.)), 1. - smoothstep(0.1, 0.45, fwP));   // (a streak narrower than a pixel is left out)
  float streak = smoothstep(0.55, 0.7, sx*0.75 + sx2*0.25)*(1. - under)*smoothstep(0.15, 0.6, vTone.y + 0.2)*(1. - smoothstep(0.5, 1.7, fwP))*hangA;
  float wide = smoothstep(0.56, 0.68, vnoise(vec3(sC*0.085 + 13. + gI*7.31, yw*0.006, 5.)))*(1. - under)*(0.6 + 0.4*sx2)*(1. - uCleft.z)*hangA;
  float limeS = smoothstep(0.62, 0.8, vnoise(vec3(sC*0.21 + 40. + gI*3.7, yw*0.02, 11.)))*(1. - under)*hangA;
  alb = mix(alb, alb*vec3(0.4, 0.42, 0.47), max(streak*0.75, wide*0.62));
  alb = mix(alb, uPale*0.6, limeS*0.3*(0.5 + 0.5*fine));
  // lichen: grey-green sheets, a sulphur crust; rubble, moss and leaf mould on the ledge tops; soot under the roofs
  float lich = smoothstep(0.57, 0.68, fbm(P*0.035 + 9.))*smoothstep(0.3, 0.55, fine + 0.25*lam)*(1. - under);
  alb = mix(alb, vec3(0.2, 0.25, 0.17)*(0.7 + 0.6*grain), lich*(0.72 + 0.16*shade0)*(1. - uCleft.z));
  float crust = smoothstep(0.7, 0.8, vnoise(P*0.19 + 23.))*smoothstep(0.4, 0.7, grain + 0.2*top)*(1. - under);
  alb = mix(alb, vec3(0.42, 0.4, 0.16), crust*0.45*(1. - uCleft.z));
  float veg = top*smoothstep(0.22, 0.55, 0.55*fine + 0.45*vnoise(P*0.11 + 3.) + 0.25*(big - 0.5))*bedK;
  alb = mix(alb, mix(vec3(0.07, 0.11, 0.035), vec3(0.17, 0.15, 0.08), fine)*(0.6 + 0.8*grain), veg*0.88);
  alb *= 1. - 0.35*under*smoothstep(0.4, 0.75, vnoise(P*0.07 + 31.));
  alb *= (1. - crack*0.5*wallW)*(1. - joint*0.4*wallW);
  float pxF = clamp(1.5*pxB/T, 0.001, 0.2);                                          // a pixel and a half, as a fraction of this bed
  alb *= 1. - 0.4*wallW*lodB*bedVis*(1. - smoothstep(0., min(0.16, 2.2/T), bedF))*smoothstep(0., pxF, bedF);                      // the undercut foot of every bed sits in its own shade
  // ---- light: roof shadow, the shadow line under every bed that stands proud, comb shadows, old wax scars ----
  float inT = uCleft.z*smoothstep(2., 16., mAx);                                    // down the cleft the day is left behind
  float lit = (1. - shade0)*(1. - inT);
  float dUp = 1.9*(bedO(bedI + 1.) - bedO(bedI)), reach = max(dUp, 0.)*uShadowK;
  lit *= 1. - 0.85*wallW*lodB*bedVis*smoothstep(0.1, 0.7, dUp)*(1. - smoothstep(reach*0.8, reach*1.15 + 0.5, (1. - bedF)*T))*(1. - smoothstep(1. - pxF, 1., bedF));
  // the top of a bed that stands proud of the one above is a ledge in the sun: a pale line, at least a pixel and a half deep
  float ledge = smoothstep(0.1, 0.7, -dUp)*(1. - smoothstep(0., max(min(-dUp*0.9, 1.4), 1.6*pxB), (1. - bedF)*T))*wallW*lodB*bedVis;
  alb *= 1. + 0.38*ledge;
  float scar = 0., fill = 0.;
  float lz = max(uSunL.z, 0.08);
  for (int i = 0; i < 12; i++){
    vec4 c = uCombA[i];
    float top2 = i < 6 ? ${ROOF_U}. : ${ROOF_L}.;
    float t = (c.y - P.z)/lz;
    vec3 hp = P + uSunL*t;
    float e = length(vec2((hp.x - c.x)/c.z, (top2 - hp.y)/c.w));
    lit *= 1. - step(0., t)*step(hp.y, top2 + 1.)*(1. - smoothstep(0.9, 1.06, e))*0.92;
    // ghost of an abandoned comb beside this one, and the attachment line on the roof
    float ge = length(vec2((P.x - c.x - 37.)/(c.z*0.62), (top2 - P.y)/(c.w*0.7)));
    float on = step(P.y, top2)*step(top2 - 40., P.y)*(1. - under);
    scar = max(scar, (1. - smoothstep(0.0, 0.09, abs(ge - 1.)))*on);
    fill = max(fill, (1. - smoothstep(0.7, 1., ge))*on);
    scar = max(scar, under*(1. - smoothstep(1.5, 4.5, abs(P.z - c.y)))*(1. - smoothstep(c.z, c.z + 5., abs(P.x - c.x)))*step(abs(P.y - top2), 6.));
  }
  alb = mix(alb, uPale*0.5*(0.7 + 0.6*fine), fill*0.42*smoothstep(0.25, 0.6, lam + 0.3*fine));
  alb = mix(alb, uPale*0.62, scar*(0.35 + 0.4*fine));
  // old wax crusts the lip of the cleft and runs down the wall below it
  float crustM = uCleft.x*nearMouth*(1. - smoothstep(1.5, 8., mEdge + 6.*(fineLo - 0.5)));
  float dripM = uCleft.x*nearMouth*step(mb.y, 0.)*(1. - smoothstep(4., 14., abs(mb.x)))*smoothstep(0.42, 0.7, vnoise(vec3(P.x*0.9, 5., 1.)))*(1. - smoothstep(0., 30., mEdge));
  float collar = uCleft.z*(1. - smoothstep(-1., 5., mAx + 5.*(fineLo - 0.5)));
  alb = mix(alb, uPale*0.64*(0.72 + 0.5*lam)*vec3(1., 0.93, 0.8), clamp(crustM*0.85 + dripM*0.5 + collar*0.8, 0., 0.88));
  alb *= mix(1., 0.68, uWet);
  vec3 alb0 = alb;
  alb = mix(alb, vec3(dot(alb, vec3(0.35, 0.5, 0.15)))*vec3(1.0, 0.93, 0.92), (1. - lit)*0.36);   // ochre in shade goes brown, not red
  vec3 col = sunShade(alb, N, V, lit, mix(18., 40., uWet), 0.03 + 0.2*uWet)*mix(1., 0.42, inT);
  vec3 NL = normalize(mix(normalize(vNL + vec3(0., 1e-5, 0.))*(gl_FrontFacing ? 1. : -1.), N, 0.6*uCleft.z) + vec3(0., 1e-5, 0.));
  vec3 toP = uPortalPos - P; float dp = length(toP) + 1e-3;
  float ndP = max(dot(NL, toP/dp), 0.), ndPb = max(dot(N, toP/dp), 0.);
  col += alb0*uPortalCol*mix(0.2 + 0.4*ndP, 0.26 + 0.5*ndP + 0.75*ndPb, uCleft.z)/(1. + dp*dp/mix(500., 2800., uCleft.z)) + alb0*uPortalCol*0.06*inT;
  vec3 toG = uGlowPos - P; float dg = length(toG) + 1e-3;                             // the light that spills out of the mouth
  col += alb0*uGlowCol*(0.3 + 0.7*max(dot(NL, toG/dg), 0.))/(1. + dg*dg/mix(900., 220., uCleft.z));
  vec3 toW = uWinPos - P; float dw = length(toW) + 1e-3;                              // amber thrown on the wall behind the window comb
  col += alb0*uWinCol*max(dot(NL, toW/dw), 0.)/(1. + dw*dw/300.);
  col = mix(col, uHaze.rgb, (1. - exp(-max(distance(cameraPosition, vWorld) - 150., 0.)*uHaze.w))*smoothstep(330., 520., abs(P.x)));
  col = mix(col, uSea.rgb, uSea.w*(1. - smoothstep(-25., 75., vWorld.y)));           // the foot of the rock is lost in the cloud it stands in
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---- combs: 12 lofted half-moon shells in one mesh ----
async function buildCombs(ctx, combs) {
  const NA = 36, NR = 12, B = makeBuilder({ aC: 4, aK: 4, aT: 3 }), p = new THREE.Vector3();
  for (const c of combs) {
    const K = [c.index, c.seed, c.crown, c.cover];
    const ring = (side) => {
      const start = B.pos.length / 3;
      for (let k = 0; k <= NR; k++) {
        const rho = 1 - Math.pow(1 - k / NR, 1.6);
        for (let i = 0; i <= NA; i++) {
          const r = rimAt(c, (i / NA) * Math.PI), cx = r[0] * rho, d = r[1] * rho, th = halfThick(c, rho, cx, d);
          combPoint(c, cx, d, side * th, p);
          B.v(p.x, p.y, p.z, { aC: [cx, d, side, rho], aK: K, aT: [th, c.bareTop, c.age] });
        }
      }
      return start;
    };
    const f = ring(1), b = ring(-1);
    for (let k = 0; k < NR; k++) for (let i = 0; i < NA; i++) {
      const a = k * (NA + 1) + i, a2 = a + NA + 1;
      B.quad(f + a, f + a2, f + a2 + 1, f + a + 1);
      B.quad(b + a, b + a + 1, b + a2 + 1, b + a2);
    }
    // rim strip joining the two faces
    const rs = B.pos.length / 3;
    for (let i = 0; i <= NA; i++) {
      const r = rimAt(c, (i / NA) * Math.PI), th = halfThick(c, 1, r[0], r[1]);
      for (const sgn of [1, -1]) { combPoint(c, r[0] * 1.004, r[1] * 1.004, sgn * th, p); B.v(p.x, p.y, p.z, { aC: [r[0], r[1], 0, 1], aK: K, aT: [th, c.bareTop, c.age] }); }
    }
    for (let i = 0; i < NA; i++) { const a = rs + i * 2; B.quad(a, a + 1, a + 3, a + 2); }
    await ctx.yield();
  }
  return B.geometry();
}

// ---- the tear in comb six: cut face, shards; and the wax flanges of the cleft ----
async function buildWaxParts(ctx, rng, noise, combs, bite, fly, pal, lipS) {
  const B = makeBuilder({ color: 3, aW: 4 }), c = combs[5], p = new THREE.Vector3(), p2 = new THREE.Vector3();
  const ropeSeats = [], walkSeats = [];
  const NT = 120; let prev = null, uAlong = 0;
  for (let i = 0; i <= NT; i++) {
    const th = (i / NT) * Math.PI * 2, r = biteR(bite, th);
    const cx = bite.cx + r * Math.cos(th), d = bite.d + r * Math.sin(th);
    const rho = d > 0.4 ? rhoAt(c, cx, d) : 2;
    if (rho > 0.992) { prev = null; continue; }
    const ht = halfThick(c, rho, cx, d), honey = 1 - sstep(c.crown * 0.8, c.crown * 1.05, d);
    uAlong += r * (Math.PI * 2 / NT);
    const row = [];
    for (let k = 0; k <= 4; k++) {
      const v = k / 2 - 1, rag = (k === 0 || k === 4) ? 0 : rng.range(0.05, 0.55) * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + k)));
      const cxr = cx - Math.cos(th) * rag, dr = d - Math.sin(th) * rag;       // ragged, into the hole only
      combPoint(c, cxr, dr, v * ht, p);
      const tint = 0.75 + 0.25 * rng();
      row.push(B.v(p.x, p.y, p.z, { color: [pal.wax.r * tint, pal.wax.g * tint, pal.wax.b * tint], aW: [uAlong, v * ht, 1, honey] }));
    }
    if (prev) for (let k = 0; k < 4; k++) B.quad(prev[k], row[k], row[k + 1], prev[k + 1]);
    prev = row;
    // honey ropes hang from the upper arc where it cuts the honey crown
    if (Math.sin(th) < -0.15 && honey > 0.4) ropeSeats.push({ cx, d, ht, th });
    walkSeats.push({ cx, d, th, rho });
  }
  // curled shards of comb left hanging on the torn edge
  for (let s = 0; s < 44; s++) {
    const th = rng.range(0, Math.PI * 2), r = biteR(bite, th);
    const cx = bite.cx + r * Math.cos(th), d = bite.d + r * Math.sin(th);
    if (d < 0.5 || rhoAt(c, cx, d) > 0.97) continue;
    const ht = halfThick(c, rhoAt(c, cx, d), cx, d), sgn = rng.sign(), len = rng.range(0.5, 1.5), wid = rng.range(0.35, 0.9), curl = rng.range(0.4, 1.3);
    const tx = -Math.sin(th), ty = Math.cos(th);            // along the edge
    const rows = [];
    for (let k = 0; k <= 3; k++) {
      const f = k / 3, into = len * f * 0.75, sag = len * f * f * 0.5;
      const w = wid * (1 - 0.3 * f * f) * (0.8 + 0.4 * Math.abs(Math.sin(s * 3.1 + k * 1.9)));
      const row = [];
      for (const e of [-1, 1]) {
        const qx = cx - Math.cos(th) * into + tx * w * e, qd = d - Math.sin(th) * into + ty * w * e + sag;
        combPoint(c, qx, qd, sgn * (ht * 0.9 + curl * f * f), p);
        const tint = 0.8 + 0.2 * f;
        row.push(B.v(p.x, p.y, p.z, { color: [pal.wax.r * tint * 0.6, pal.wax.g * tint * 0.55, pal.wax.b * tint * 0.45], aW: [f, e, 0, 0.3] }));
      }
      rows.push(row);
    }
    for (let k = 0; k < 3; k++) B.quad(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]);
  }
  await ctx.yield();
  // flanges of pale old wax: thick scalloped shelves with rolled lips, in stacked tiers. They stand off the cleft wall,
  // crust the lip of the mouth, and a ring of them frames the portal.
  const F = cleftFrame(fly), q0 = new THREE.Vector3(), gd = new THREE.Vector3(), td = new THREE.Vector3();
  // along the growth, across, roll of the lip, tint. The root flares and is sunk into the rock, so a shelf grows out of the wall.
  const PROF = [[-0.34, -1.0, 0, 0.34], [0.04, -0.66, 0.04, 0.44], [0.42, -0.48, 0.22, 0.58], [0.82, -0.33, 0.7, 0.8], [1.0, 0, 1, 1], [0.84, 0.29, 0.8, 0.8], [0.45, 0.44, 0.25, 0.52], [0.04, 0.62, 0.04, 0.42], [-0.34, 1.0, 0, 0.32]];
  const shelf = (base, grow, thick, len, H, th, lean, hMax) => {
    const NSEG = 14, rows = [], ph = rng.range(0, 1), nl = rng.range(1.4, 2.8), tone = rng.range(0.82, 1.08), dip = rng.range(0.3, 0.42);
    for (let k = 0; k <= NSEG; k++) {
      const f = k / NSEG, env = Math.sin(Math.PI * f);
      base(f, q0); grow(f, gd); thick(f, td);
      // a scalloped outline: round lobes with a notch between them, never a point
      const lobe = Math.sqrt(Math.abs(Math.sin(Math.PI * (f * nl + ph))));
      const h = Math.min(H * Math.pow(env, 0.5) * (1 - dip + dip * lobe), hMax(f));
      const tk = th * (0.35 + 0.65 * Math.sqrt(env)), row = [];
      for (const [g, w, roll, tint0] of PROF) {
        const across = w * tk * Math.min(1, 0.35 + h / Math.max(0.2, H)) + lean * roll * roll * Math.min(1, h / Math.max(0.2, H));
        p.copy(q0).addScaledVector(gd, g * Math.max(h, 0.5)).addScaledVector(td, across);
        const tint = tint0 * tone * (0.88 + 0.12 * noise.n3(p.x * 0.4, p.y * 0.4, p.z * 0.4));
        row.push(B.v(p.x, p.y, p.z, { color: [(pal.pale.r * 0.7 + 0.3) * tint, (pal.pale.g * 0.7 + 0.3) * tint * 0.9, (pal.pale.b * 0.7 + 0.3) * tint * 0.72], aW: [f * len, Math.max(0, g), 0, 0] }));
      }
      rows.push(row);
    }
    for (let k = 0; k < NSEG; k++) for (let j = 0; j < PROF.length - 1; j++) B.quad(rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]);
  };
  const inward = (phi, o) => o.copy(F.r).multiplyScalar(-Math.cos(phi)).addScaledVector(F.u, -Math.sin(phi));
  const tunnelFlange = (s, phi0, arc, H, lean, tiers) => {
    for (let t = 0; t < tiers; t++) {
      const st = s + t * rng.range(0.75, 1.15) * (lean < 0 ? -1 : 1), arcT = arc * (1 - 0.1 * t), ph0 = phi0 + rng.range(-0.1, 0.1) * t;
      const phiAt = (f) => ph0 + (f - 0.5) * arcT;
      // the root follows the wall smoothed over the shelf's own length (a root that followed every bed would be a saw)
      const rAt = (f) => { let a = 0; for (let j = -3; j <= 3; j++) a += tubeRad(noise, st, phiAt(f + j * 0.07)); return a / 7 + 0.4; };
      shelf((f, o) => F.at(st, phiAt(f), rAt(f), o), (f, o) => inward(phiAt(f), o), (f, o) => o.copy(F.d),
        arcT * 12, (H + 0.6) * (1 - 0.24 * t), 0.5 + 0.42 * H, lean, (f) => rAt(f) - 7.6);
    }
  };
  const mouthFlange = (phi0, arc, H, tiers) => {
    for (let t = 0; t < tiers; t++) {
      const arcT = arc * (1 - 0.12 * t), ph0 = phi0 + rng.range(-0.08, 0.08) * t, al = 0.6 - 0.22 * t, ca = Math.cos(al), sa = Math.sin(al);
      const phiAt = (f) => ph0 + (f - 0.5) * arcT;
      shelf((f, o) => { const phi = phiAt(f), Rh = holeR(phi); return F.at(lipS(phi, Rh) - 1.1 + 0.3 * t, phi, Rh + 1.0 + 0.95 * t, o); },
        (f, o) => inward(phiAt(f), o).multiplyScalar(sa).addScaledVector(F.d, -ca),
        (f, o) => inward(phiAt(f), o).multiplyScalar(-ca).addScaledVector(F.d, -sa),
        arcT * 13, H * (1 - 0.2 * t), 0.5 + 0.34 * H, 0.5, () => (1.0 + 0.95 * t) / sa);
    }
  };
  for (let i = 0; i < 10; i++) mouthFlange((i / 10) * 6.283 + rng.range(-0.12, 0.12), rng.range(0.6, 0.9), rng.range(2.2, 3.8), i % 3 === 0 ? 3 : 2);
  await ctx.yield();
  for (let i = 0; i < 22; i++) {
    tunnelFlange(5 + (i + rng()) * (CLEFT_LEN - 12) / 22, i * 2.4 + rng.range(-0.5, 0.5), rng.range(0.7, 1.35), rng.range(1.5, 2.9), rng.range(-1.0, 1.0), i % 3 === 0 ? 3 : 2);
    await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < 12; i++) tunnelFlange(CLEFT_LEN - 1.8 + (i % 3) * 0.7, (i / 12) * 6.283 + rng.range(-0.1, 0.1), rng.range(0.75, 1.1), rng.range(1.6, 2.6), rng.range(-1.4, -0.5), 2);
  await ctx.yield();
  const wg = B.geometry(false);
  await ctx.yield();
  wg.computeVertexNormals();
  return { geometry: wg, ropeSeats, walkSeats };
}

const WAX_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aW;
varying vec3 vLocal, vWorld, vN, vNL, vCol; varying vec4 vW;
#include <fog_pars_vertex>
void main(){
  vLocal = position; vCol = color; vW = aW; vNL = normal;
  vec4 wp = modelMatrix*vec4(position, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WAX_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uHoney, uPortalPos, uPortalCol, uGlowPos, uGlowCol, uMouth, uMd;
varying vec3 vLocal, vWorld, vN, vNL, vCol; varying vec4 vW;
#include <fog_pars_fragment>
void main(){
  float face = gl_FrontFacing ? 1. : -1.;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.))*face;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  vec3 alb = vCol; float gloss = 14., spec = 0.06;
  float cut = step(0.5, vW.z);
  // cut face of the comb: cells seen side-on (tubes across the thickness, a midrib), honey glazing the crown part
  float fwu = fwidth(vW.x);
  float cell = abs(fract(vW.x/0.22) - 0.5);
  float wall = smoothstep(0.34 - fwu*2.3, 0.34 + fwu*2.3, cell)*(1. - smoothstep(0.1, 0.3, fwu));
  float mid = 1. - smoothstep(0.03, 0.09, abs(vW.y));
  vec3 cutCol = mix(vCol*0.34, vCol*1.05, max(wall, mid));
  float drip = smoothstep(0.35, 0.75, sin(vW.x*1.9)*0.5 + 0.5)*vW.w;
  cutCol = mix(cutCol, uHoney*0.85, clamp(vW.w*0.55 + drip*0.4, 0., 0.9));
  alb = mix(alb, cutCol, cut);
  gloss = mix(gloss, 70., cut*vW.w); spec = mix(spec, 0.9, cut*vW.w);
  // old flange wax: a honey-tan body with growth ridges parallel to the lip, and a pale rolled lip
  float fl = 1. - cut, fg = clamp(vW.y, 0., 1.);
  float ridge = sin(vW.y*26. + sin(vW.x*0.5)*1.4)*(1. - smoothstep(0.1, 0.5, fwidth(vW.y)*26.));
  // the ghost of the cells the wax was built in: a faint net of hexagons across the body of the flange
  vec2 hp = vec2(vW.x*2.2*1.1547, vW.y*5.5); hp.y += mod(floor(hp.x), 2.)*0.5; hp = abs(fract(hp) - 0.5);
  float cellE = (1. - smoothstep(0.03, 0.17, abs(max(hp.x*1.5 + hp.y, hp.y*2.) - 1.)))*(1. - smoothstep(0.1, 0.4, fwidth(vW.x)*2.5))*smoothstep(0.06, 0.25, fg)*(1. - smoothstep(0.68, 0.86, fg));
  alb = mix(alb, alb*vec3(0.62, 0.47, 0.3)*(0.8 + 0.25*ridge)*(0.55 + 0.45*smoothstep(0., 0.6, fg))*(0.9 + 0.14*sin(vW.x*2.3 + vW.y*3.))*(1. - 0.3*cellE), fl);
  alb = mix(alb, vCol*vec3(1., 0.9, 0.7), smoothstep(0.78, 0.96, fg)*fl);
  float inT = fl*smoothstep(2., 16., dot(vLocal - uMouth, uMd));                    // down the cleft the day is left behind
  float lit = roofLit(vLocal)*(1. - inT);
  vec3 col = sunShade(alb*mix(1., 0.55, fl*lit), N, V, lit, gloss, spec)*mix(1., 0.36, inT);
  // thin wax lets the sun through
  float back = max(dot(-N, uSunDir), 0.);
  col += uSunCol*alb*vec3(1., 0.72, 0.3)*back*lit*mix(0.3*smoothstep(0.4, 1., fg), 0.3, cut);
  vec3 toP = uPortalPos - vLocal; float dp = length(toP) + 1e-3;
  vec3 NL = normalize(vNL + vec3(0., 1e-5, 0.))*face;
  float nP = dot(NL, toP/dp);
  float pk = mix(0.5*(0.12 + 0.9*max(nP, 0.) + 0.3*max(-nP, 0.)*smoothstep(0.3, 1., fg)), 0.3 + 0.5*abs(nP) + 0.6*max(-nP, 0.), cut);
  col += alb*uPortalCol*vec3(1., 0.86, 0.6)*pk/(1. + dp*dp/mix(1200., 300., cut));
  // a flange between us and the portal is a sheet of old wax with the light behind it: amber, deepest at the thick root
  col += alb*uPortalCol*vec3(1., 0.6, 0.22)*fl*max(-nP, 0.)*mix(0.22, 1.25, smoothstep(0.05, 0.9, fg))/(1. + dp*dp/2200.);
  // the lip of a flange glows with the light behind it: the portal down the cleft, the glow in the mouth
  float lipT = fl*smoothstep(0.6, 0.98, fg);
  col += alb*uPortalCol*vec3(1., 0.62, 0.25)*lipT*(0.35 + 0.65*pow(1. - abs(dot(N, V)), 2.))*2.2/(1. + dp*dp/2600.);
  vec3 toG = uGlowPos - vLocal; float dg = length(toG) + 1e-3;
  col += alb*uGlowCol*vec3(1., 0.8, 0.5)*fl*(0.25 + 0.5*max(dot(NL, toG/dg), 0.) + 0.9*lipT)/(1. + dg*dg/260.);
  col += alb*uSkyCol*fl*inT*max(dot(NL, toG/dg), 0.)*1.5/(1. + dg*dg/1600.);          // daylight from the mouth behind us models the near side
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---- the comb shell: wax, hexagon cells, honey, and the far level of the bee curtain ----
const SHELL_VERT = /* glsl */`
attribute vec4 aC, aK; attribute vec3 aT;
varying vec4 vC, vK; varying vec3 vT, vLocal, vWorld, vN;
#include <fog_pars_vertex>
void main(){
  vC = aC; vK = aK; vT = aT; vLocal = position;
  vec4 wp = modelMatrix*vec4(position, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHELL_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_COVER}
uniform vec3 uHoney, uPale, uRock, uBeeDark;
uniform vec4 uBite; uniform vec3 uBiteP;
varying vec4 vC, vK; varying vec3 vT, vLocal, vWorld, vN;
#include <fog_pars_fragment>
vec4 hexCell(vec2 p){
  const vec2 s = vec2(1., 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.))/s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy*s, p - (hC.zw + 0.5)*s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
}
float hexDist(vec2 p){ p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
float vnoise2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  float cx = vC.x, d = vC.y, rho = vC.w;
  float isRim = 1. - smoothstep(0.02, 0.98, abs(vC.z));
  float side = vC.z < 0. ? -1. : 1.;
  vec2 q = vec2(cx, d);
  float fw = max(fwidth(cx), fwidth(d)) + 1e-5;
  float lowN = vnoise2(q*0.23 + vK.y*50.);
  // the bite
  float bare = 0.;
  if (abs(vK.x - uBite.w) < 0.5){
    vec2 bp = q - uBite.xy; bp.x += step(dot(bp, bp), 1e-8)*1e-3;
    float th = atan(bp.y, bp.x);
    float R = uBite.z*(1. + 0.11*sin(3.*th + uBiteP.x) + 0.07*sin(7.*th + uBiteP.y) + 0.035*sin(13.*th + uBiteP.z) + 0.38*smoothstep(0.3, 1., sin(th)));
    float bl = length(bp);
    if (bl < R) discard;
    bare = 1. - smoothstep(R + 2., R + 7., bl + 3.*lowN);
  }
  vec3 Ng = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) Ng = -Ng;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  vec3 T = normalize(vec3(Ng.z, 0., -Ng.x) + vec3(1e-4, 0., 0.))*side;
  vec3 Dn = vec3(0., -1., 0.);
  float m = curtain(vec4(cx, d, side, rho), vK, vT.y)*(1. - isRim)*(1. - bare);
  float mOther = curtain(vec4(cx, d, -side, rho), vK, vT.y)*(1. - bare);
  float lit = roofLit(vLocal);

  // ---------- wax ----------
  float crown = 1. - smoothstep(vK.z*0.82, vK.z*1.05, d + 2.5*(lowN - 0.5));
  vec2 hp = q/0.22;
  vec4 hc = hexCell(hp);
  float e = hexDist(hc.xy), hid = hash21(hc.zw + vK.y*7.);
  float aa = fw/0.22;
  float cellLod = (1. - smoothstep(0.09, 0.32, aa))*(1. - isRim);                     // no cells on the rim: seen edge-on they were a dotted strip
  float wall = smoothstep(0.39 - aa, 0.39 + aa, e);
  vec2 vt = vec2(dot(V, T), dot(V, Dn));
  float vn = max(abs(dot(V, Ng)), 0.3);
  float floorVis = 1. - smoothstep(0.33 - aa, 0.33 + aa, hexDist(hc.xy - vt/vn*0.6));
  float newWax = smoothstep(0.82, 1., rho);
  vec3 waxBase = mix(mix(uPale, uHoney, 0.8)*0.54, mix(uRock, uHoney, 0.5)*0.5, clamp(0.25 + 0.6*vT.z - newWax + 0.3*lowN, 0., 1.)*(1. - crown*0.5));
  // capped honey: dull pale domes, with patches of openH, glistening cells
  float fineK = 1. - smoothstep(0.2, 0.6, fw);                                          // detail finer than a pixel or two is left to the average
  float openH = mix(0.3, smoothstep(0.58, 0.66, 0.6*vnoise2(q*0.5 + 19.) + 0.4*vnoise2(q*1.7 + 7.)), fineK)*crown + bare*mix(0.6, step(0.35, hid), cellLod);
  openH = clamp(openH, 0., 1.);
  vec3 capCol = mix(uPale*0.52, uHoney*0.7, 0.5 + 0.25*hid + 0.2*lowN)*(0.78 + 0.4*hid*cellLod)*(1.0 - 0.3*e*e*4.*cellLod);
  capCol = mix(capCol, capCol*0.5, wall*cellLod);
  vec3 cellIn = mix(waxBase*0.5, waxBase*0.13, floorVis);
  vec3 honeyIn = mix(uHoney*0.8, uHoney*0.4, floorVis);
  vec3 openCol = mix(mix(cellIn, honeyIn, crown), waxBase*1.12, wall);
  vec3 detail = mix(mix(openCol, capCol, crown*(1. - openH)), openCol, 1. - crown);
  vec3 avg = mix(waxBase*0.62, mix(uPale*0.56, uHoney*0.74, 0.62), crown*(1. - openH*0.5));
  vec3 wax = mix(avg, detail, cellLod);
  float wGloss = mix(12., 90., openH*crown), wSpec = mix(0.05, 0.9*floorVis*cellLod + 0.1, openH*crown);
  vec3 Nw = normalize(Ng + (T*hc.x + Dn*hc.y)*0.9*cellLod*crown*(1. - openH) + vec3(0., 1e-5, 0.));

  // ---------- the curtain, far level: one painted bee per tile ----------
  vec2 g = vec2(0.6, 0.95);
  vec2 qw = q + 0.55*vec2(vnoise2(q*0.31 + 3.), vnoise2(q*0.31 + 41.));
  vec2 tq = qw/g; float row = floor(tq.y);
  tq.x += 0.5*mod(row, 2.) + 0.37*hash11(row*1.7 + vK.y*91.);
  vec2 id = floor(tq), f = fract(tq) - 0.5;
  float h1 = hash21(id + vK.y*13. + side*3.), h2 = fract(h1*37.7), h3 = fract(h1*91.3);
  vec2 pc = vLocal.xy + vec2(-f.x*g.x, f.y*g.y);
  float beeLod = 1. - smoothstep(0.07, 0.2, fw);                                         // single bees are painted only while each is four pixels or more
  float flipB = waveAt(pc, h1);
  float flipS = waveAt(vLocal.xy, lowN*0.6);
  float present = step(h3, m*1.03 - 0.02);
  float ang = (h2 - 0.5)*1.1 + 0.13*sin(uTime*1.3*uCalm + h1*50.) + 0.06*sin(uTime*3.1*uCalm + h2*50.);
  float ca = cos(ang), sa = sin(ang);
  vec2 p = (f + (vec2(h1, h2) - 0.5)*vec2(0.34, 0.24))*g;
  p = vec2(ca*p.x + sa*p.y, -sa*p.x + ca*p.y);
  float ab = fw/0.17 + 0.04;
  float breathe = 1. + 0.05*sin(uTime*4.*uCalm + h1*40.);
  vec2 ra = vec2(0.165*breathe, 0.40*(1. - 0.5*flipB));
  vec2 pa = (p - vec2(0., 0.14 - 0.12*flipB))/ra;
  float ea = length(pa);
  float abd = 1. - smoothstep(1. - ab, 1. + ab, ea);
  float tho = 1. - smoothstep(1. - ab, 1. + ab, length((p - vec2(0., -0.3))/0.165));
  float hed = 1. - smoothstep(1. - ab, 1. + ab, length((p - vec2(0., -0.5))/vec2(0.115, 0.095)));
  float fan = step(0.86, h3)*0.5 + flipB;
  vec2 wq = vec2(abs(p.x), p.y) - vec2(0.1 + 0.1*fan, 0.1 - 0.12*flipB);
  float wr = 0.3 + 0.5*fan; float cw = cos(wr), sw = sin(wr);
  wq = vec2(cw*wq.x - sw*wq.y, sw*wq.x + cw*wq.y);
  float wing = 1. - smoothstep(1. - ab, 1. + ab, length(wq/vec2(0.085, 0.36)));
  float bandP = fract((p.y - 0.14 + 0.4)/0.8*5.2 + 0.25);
  float band = smoothstep(0.8, 0.87, bandP)*(1. - smoothstep(0.94, 1., bandP));
  vec3 paleB = uPale*0.56;
  vec3 abdCol = mix(uBeeDark, uPale*0.36, band*0.85);
  abdCol = mix(abdCol, vec3(0.2, 0.11, 0.035), smoothstep(0.0, -0.16, p.y)*0.8);
  abdCol = mix(abdCol, paleB, flipB*0.8);
  vec3 thoCol = vec3(0.14, 0.078, 0.021)*(0.75 + 0.5*h2);
  vec3 beeCol = uBeeDark*0.45;
  float cov = 0.;
  beeCol = mix(beeCol, abdCol, abd); cov = max(cov, abd);
  beeCol = mix(beeCol, mix(vec3(0.07, 0.058, 0.05), paleB*1.1, flipB*0.8), wing*0.62); cov = max(cov, wing*0.85);
  beeCol = mix(beeCol, thoCol, tho); cov = max(cov, tho);
  beeCol = mix(beeCol, uBeeDark*0.7, hed); cov = max(cov, hed);
  cov *= present;
  // packed bees below show through the gaps as darkness
  float under = smoothstep(0.35, 0.6, m);
  vec3 Nb = normalize(Ng + (T*pa.x + Dn*pa.y)*0.75*abd + (T*p.x*3.)*tho + vec3(0., 1e-5, 0.));
  // far average of the same curtain: dark, mottled, with the pale wave running through it
  // (every term here is filtered by the pixel's footprint on the comb: from 150 to 300 m the cloak is smooth satin, not speckle)
  float mott = mix(0.5, vnoise2(q*1.3 + vec2(0., uTime*0.05*uCalm)), 1. - smoothstep(0.16, 0.5, fw));
  float mf = 1. - smoothstep(0.2, 0.6, fw);
  // (a cloak of dark bodies, tawny thoraxes and smoky wings: umber, stirring, with the sun glancing off the wings)
  float stir = vnoise2(q*0.42 + vec2(uTime*0.11*uCalm, uTime*0.07*uCalm) + vK.y*9.);
  vec3 cloak = mix(uBeeDark*1.15, vec3(0.062, 0.03, 0.009), 0.25 + 0.45*mott)*mix(0.72 + 0.4*stir, 0.5 + 0.95*stir, fineK);
  vec3 farCol = mix(cloak, uPale*0.36, flipS*0.85);
  float sheen = pow(vnoise2(q*1.9 + vec2(uTime*0.35*uCalm, -uTime*0.22*uCalm)), 5.)*2.2*mf;
  float twk = pow(vnoise2(q*2.3 + vec2(uTime*0.5*uCalm, -uTime*0.31*uCalm)), 7.)*smoothstep(0.35, 0.7, stir + 0.2)*(1. - smoothstep(0.12, 0.4, fw));

  // ---------- compose ----------
  vec3 albNear = mix(mix(wax, uBeeDark*0.3, under), beeCol, cov);
  vec3 albFar = mix(wax, farCol, m);
  vec3 alb = mix(albFar, albNear, beeLod);
  float beeAmt = mix(m, max(cov, under), beeLod);
  vec3 N = normalize(mix(Nw, mix(Ng, Nb, beeLod), beeAmt) + vec3(0., 1e-5, 0.));
  // from far off the curtain is one dark umber cloak, mottled and stirring; the wave lifts it
  float nearB = mix(0.3, 1., beeLod);
  float gloss = mix(wGloss, 52., beeAmt), spec = mix(wSpec, (0.04 + 0.22*wing*beeLod*cov + sheen*0.08)*nearB + 0.05*flipS, beeAmt);
  vec3 col = sunShade(alb, N, V, lit, gloss, spec);
  // sun rim on bee backs so they stand out of the dark
  float rimL = pow(1. - max(dot(N, V), 0.), 3.)*max(dot(Ng, uSunDir), 0.)*lit;
  col += uSunCol*rimL*beeAmt*vec3(0.5, 0.36, 0.2)*0.3*nearB;
  // wings catching the sun here and there over the whole cloak (a slow glitter, never a flash)
  col += uSunCol*vec3(0.62, 0.5, 0.34)*twk*beeAmt*max(dot(Ng, uSunDir), 0.)*lit*mix(0.5, 0.22, beeLod);
  // ---------- honey: the capped crown holds the light and glows, runs of it creep down the wax ----------
  float bareK = (1. - beeAmt)*(1. - isRim);
  float cellGlow = mix(0.62, (1. - 0.75*wall)*(0.55 + 0.6*hid), cellLod);
  float inner = crown*(0.5 + 0.5*smoothstep(0., 3.5, d))*(0.75 + 0.5*lowN);
  vec3 amber = mix(vec3(1., 0.44, 0.07), vec3(1., 0.62, 0.17), hid*cellLod);
  col += uSunCol*amber*inner*cellGlow*bareK*mix(0.34, 0.4, lit);
  float runN = vnoise2(vec2(cx*1.15 + vK.y*37., d*0.07 + vK.y*11.));
  float runW = smoothstep(0.66, 0.74, runN)*smoothstep(vK.z*0.35, vK.z*0.9, d)*(1. - smoothstep(vK.z*1.25, vK.z*2.1, d + 6.*(lowN - 0.5)))*(1. - smoothstep(0.2, 0.7, fw));
  float runG = pow(0.5 + 0.5*sin(d*1.7 - uTime*0.9 + hash11(floor(cx*1.15 + vK.y*37.))*40.), 10.);
  col = mix(col, uSunCol*vec3(0.95, 0.5, 0.09)*(0.26 + 0.34*lit), runW*bareK*0.85);
  col += uSunCol*vec3(1., 0.85, 0.6)*runW*bareK*runG*(0.25 + 0.75*lit)*0.6;
  // ---------- light through wax and honey ----------
  float thick = 2.*vT.x;
  vec3 sig = mix(vec3(0.06, 0.2, 0.7), vec3(0.09, 0.36, 1.3), crown);
  vec3 Tm = exp(-sig*max(thick, 0.)*0.85)*vec3(1., 0.66, 0.26);
  float back = max(dot(-Ng, uSunDir), 0.);
  float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd; fwd *= fwd;
  // The curtains are a stained-glass window from behind: the far curtain dims the light in soft blotches, this one is
  // a crawling silhouette; light leaks between the bodies, pricks through the gaps and glows in the wings.
  vec2 pq = q/0.5 + 0.3*vec2(vnoise2(q*0.9 + 3.), vnoise2(q*0.9 + 31.));
  float prick = step(0.5, hash21(floor(pq) + 5.))*(1. - smoothstep(0.16, 0.46, length(fract(pq) - 0.5)))*(0.6 + 0.4*sin(uTime*2.3*uCalm + hash21(floor(pq))*30.));
  float blockO = 1. - mOther*(0.42 + 0.32*vnoise2(q*1.7 + vec2(17., uTime*0.07*uCalm)));
  float bodyS = max(max(abd, tho), hed)*present, wingS = wing*present*(1. - bodyS);
  float leakNear = (1. - 0.96*bodyS)*(0.4 + 0.75*prick)*(1. - 0.35*wingS);
  float leakFar = 0.26 + 0.16*mott + 0.3*prick*mf*mf;
  float blockS = mix(1., mix(leakFar, leakNear, beeLod), smoothstep(0.3, 0.6, m));
  vec3 trans = uSunCol*Tm*back*(0.42 + 0.62*fwd)*mix(0.45, 1., lit)*blockO*blockS;
  trans *= mix(1., 0.62 + 0.55*wall + 0.3*(hid - 0.5), cellLod*(1. - beeAmt))*(0.8 + 0.4*lowN);     // the cells show in the light
  // amber held in the fur and the wings of the bees that stand against the light
  trans += vec3(0.75, 0.42, 0.13)*back*beeAmt*(0.085 + 0.3*pow(1. - max(dot(N, V), 0.), 2.5) + 0.22*wingS*beeLod);
  // the thin rim scatters whatever sun reaches it
  trans += uSunCol*mix(uPale, uHoney, 0.6)*isRim*lit*(0.25 + 1.2*fwd)*0.28;
  col += trans;
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---- instanced bees (near: legs, wings, antennae; mid: a 14-triangle back) ----
// local frame: +Y toward the head, +Z out of the comb, feet on z = 0. aP = (part, weight, leg phase / wing side, body coord)
// parts: 0 abdomen, 1 thorax, 2 head, 3 wing, 4 leg or antenna
function loft(B, rings, sides, part, tip) {
  const starts = [];
  rings.forEach((r, k) => {
    starts.push(B.pos.length / 3);
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (part === 0 ? 0.3 : 0);
      B.v(Math.cos(a) * r.rx, r.y, r.zc + Math.sin(a) * r.rz, { aP: [part, r.w ?? 1, 0, r.b ?? k / (rings.length - (tip ? 0 : 1))] });
    }
  });
  const fwd = rings[1].y > rings[0].y;
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < sides; i++) {
    const a = starts[k] + i, b = starts[k] + (i + 1) % sides, c = starts[k + 1] + (i + 1) % sides, d = starts[k + 1] + i;
    if (fwd) B.quad(a, d, c, b); else B.quad(a, b, c, d);
  }
  if (tip) {
    const t = B.v(0, tip.y, tip.zc, { aP: [part, 1, 0, 1] }), s = starts[rings.length - 1];
    for (let i = 0; i < sides; i++) { if (fwd) B.tri(s + i, t, s + (i + 1) % sides); else B.tri(s + i, s + (i + 1) % sides, t); }
  }
}
function buildNearBee() {
  const B = makeBuilder({ aP: 4 });
  loft(B, [{ y: 0.1, rx: 0.06, rz: 0.05, zc: 0.17, b: 0 }, { y: -0.03, rx: 0.16, rz: 0.13, zc: 0.18, b: 0.18 }, { y: -0.24, rx: 0.19, rz: 0.16, zc: 0.19, b: 0.48 },
    { y: -0.46, rx: 0.14, rz: 0.12, zc: 0.18, b: 0.78 }], 5, 0, { y: -0.66, zc: 0.16 });
  loft(B, [{ y: 0.12, rx: 0.08, rz: 0.07, zc: 0.19, w: 0, b: 0 }, { y: 0.28, rx: 0.18, rz: 0.16, zc: 0.21, w: 0, b: 0 }, { y: 0.43, rx: 0.08, rz: 0.08, zc: 0.19, w: 0, b: 0 }], 5, 1, null);
  loft(B, [{ y: 0.44, rx: 0.07, rz: 0.06, zc: 0.18, w: 0, b: 0 }, { y: 0.53, rx: 0.12, rz: 0.09, zc: 0.17, w: 0, b: 0 }], 4, 2, { y: 0.61, zc: 0.15 });
  for (const sx of [-1, 1]) {
    // wing: root, outer, tip, inner
    const w = [[0.07, 0.34, 0.37, 0], [0.27, -0.08, 0.385, 0.6], [0.2, -0.56, 0.37, 1], [0.05, -0.2, 0.375, 0.5]].map((q) => B.v(q[0] * sx, q[1], q[2], { aP: [3, q[3], sx, q[3]] }));
    if (sx > 0) B.quad(w[0], w[3], w[2], w[1]); else B.quad(w[0], w[1], w[2], w[3]);
    // legs: hip, knee, foot as a ribbon
    const hipY = [0.36, 0.28, 0.2], kneeY = [0.5, 0.27, 0.04], footY = [0.64, 0.25, -0.17], footX = [0.42, 0.55, 0.5];
    for (let l = 0; l < 3; l++) {
      const phase = ((l + (sx > 0 ? 1 : 0)) % 2) * 0.5;
      const pts = [[0.1, hipY[l], 0.12, 0], [0.34, kneeY[l], 0.27, 0.5], [footX[l], footY[l], 0.0, 1]];
      const ids = [];
      for (const q of pts) for (const e of [-1, 1]) ids.push(B.v(q[0] * sx, q[1] + e * 0.028 * (1.3 - q[3] * 0.6), q[2], { aP: [4, q[3], phase, 0] }));
      for (let k = 0; k < 2; k++) { const a = k * 2; if (sx > 0) B.quad(ids[a], ids[a + 1], ids[a + 3], ids[a + 2]); else B.quad(ids[a], ids[a + 2], ids[a + 3], ids[a + 1]); }
    }
    const an = [[0.04, 0.58, 0.2], [0.085, 0.6, 0.2], [0.2, 0.84, 0.1]].map((q) => B.v(q[0] * sx, q[1], q[2], { aP: [4, 0, 0, 0] }));
    B.tri(an[0], an[1], an[2]);
  }
  return B.geometry();
}
function buildMidBee() {
  const B = makeBuilder({ aP: 4 });
  const ring = (y, hw, z0, z1, part, b) => [[-hw, z0], [0, z1], [hw, z0]].map((q) => B.v(q[0], y, q[1], { aP: [part, part === 0 ? 1 : 0, 0, b] }));
  const A = ring(0.1, 0.07, 0.1, 0.22, 0, 0), Bm = ring(-0.2, 0.19, 0.08, 0.36, 0, 0.42), tip = B.v(0, -0.66, 0.14, { aP: [0, 1, 0, 1] });
  B.quad(A[0], Bm[0], Bm[1], A[1]); B.quad(A[1], Bm[1], Bm[2], A[2]); B.tri(Bm[0], tip, Bm[1]); B.tri(Bm[1], tip, Bm[2]);
  const T1 = ring(0.12, 0.09, 0.1, 0.3, 1, 0), T2 = ring(0.38, 0.16, 0.1, 0.39, 1, 0.1), hd = B.v(0, 0.62, 0.15, { aP: [1, 0, 0, 1] });
  B.quad(T1[0], T1[1], T2[1], T2[0]); B.quad(T1[1], T1[2], T2[2], T2[1]); B.tri(T2[0], T2[1], hd); B.tri(T2[1], T2[2], hd);
  for (const sx of [-1, 1]) {
    const w = [[0.05, 0.32, 0.38, 0], [0.29, -0.14, 0.385, 0.6], [0.1, -0.57, 0.37, 1]].map((q) => B.v(q[0] * sx, q[1], q[2], { aP: [3, q[3], sx, q[3]] }));
    if (sx > 0) B.tri(w[0], w[2], w[1]); else B.tri(w[0], w[1], w[2]);
  }
  return B.geometry();
}
const BEE_VERT = /* glsl */`
${GLSL_COMMON}
attribute vec4 aP, aInfo; attribute vec3 aWhere;
uniform float uPx;
varying vec3 vLocal, vWorld, vN; varying vec4 vP; varying vec3 vI; varying float vBack;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  vec3 ip = instanceMatrix[3].xyz;
  // a bee under about a pixel and a half across is not drawn (it was sparkle on the far curtains): the painted cloak stands for it
  float pxw = 0.42*projectionMatrix[1][1]*uPx*0.5/max(distance(cameraPosition, (modelMatrix*vec4(ip, 1.)).xyz), 0.5);
  float seed = aInfo.x, part = aP.x, ct = uTime*uCalm;
  float flip = waveAt(ip.xy, seed);
  float isLeg = step(3.5, part), isWing = step(2.5, part)*(1. - isLeg), isAbd = 1. - step(0.5, part);
  // abdomen: pitch up about the petiole (the defence flip), and a breathing pump
  float ang = isAbd*(flip*1.48 + 0.06*sin(ct*4. + seed*40.));
  vec3 piv = vec3(0., 0.1, 0.17);
  float ca = cos(ang), sa = sin(ang);
  vec3 q = p - piv; q.y *= 1. + isAbd*0.05*sin(ct*5.3 + seed*17.);
  p = piv + vec3(q.x, ca*q.y + sa*q.z, -sa*q.y + ca*q.z);
  n = vec3(n.x, ca*n.y + sa*n.z, -sa*n.y + ca*n.z);
  // wings: lift with the flip, spread and shimmer when fanning
  float fanner = aInfo.y;
  vec3 root = vec3(0.07*aP.z, 0.34, 0.37);
  float spread = isWing*aP.z*(0.85*fanner + 0.55*flip), lift = isWing*(0.75*flip + 0.25*fanner);
  float cs = cos(spread), ss = sin(spread), cl = cos(lift), sl = sin(lift);
  q = p - root; q = vec3(cs*q.x - ss*q.y, ss*q.x + cs*q.y, q.z);
  q = vec3(q.x, cl*q.y + sl*q.z, -sl*q.y + cl*q.z);
  q.z += isWing*aP.y*fanner*0.06*sin(uTime*11. + seed*30.);
  p = root + q;
  // walkers: the body advances at v; a foot in stance moves back at exactly v, so it stays put on the wax
  float v = aInfo.z, L = max(aInfo.w, 1.);
  float walk = step(0.001, v);
  float tu = fract(uTime*v/L + seed*7.);
  float ph = fract(uTime*2. + aP.z + seed*3.);            // 0.5 s cycle, half of it in stance
  float S = v*0.25;
  float sw = clamp((ph - 0.5)*2., 0., 1.); sw = sw*sw*(3. - 2.*sw);
  float fy = ph < 0.5 ? S*(0.5 - ph*2.) : S*(sw - 0.5);
  float fz = ph < 0.5 ? 0. : 0.11*sin(3.14159*clamp((ph - 0.5)*2., 0., 1.));
  p.y += walk*isLeg*aP.y*fy; p.z += walk*isLeg*aP.y*fz;
  // everyone else shuffles on the spot: the body turns a little, feet stay where they are
  float tw = (1. - walk)*(0.12*sin(ct*1.3 + seed*50.) + 0.05*sin(ct*3.1 + seed*90.))*(1. - isLeg*aP.y);
  float ct2 = cos(tw), st2 = sin(tw);
  p = vec3(ct2*p.x - st2*p.y, st2*p.x + ct2*p.y, p.z + (1. - isLeg*aP.y)*0.015*sin(ct*2.3 + seed*70.));
  n = vec3(ct2*n.x - st2*n.y, st2*n.x + ct2*n.y, n.z);
  float sc = mix(1., smoothstep(0., 0.07, tu)*(1. - smoothstep(0.93, 1., tu)), walk);
  float fr = uAbs.y*60. - 6.;
  sc *= 1. - step(abs(aWhere.x - uAbs.x), 0.5)*(1. - smoothstep(fr, fr + 5., aWhere.y));
  sc *= smoothstep(1.1, 2.2, pxw);
  p = p*sc + vec3(0., walk*(tu - 0.5)*L, 0.);
  vec4 lp = instanceMatrix*vec4(p, 1.);
  vLocal = lp.xyz;
  vec4 wp = modelMatrix*lp;
  vWorld = wp.xyz;
  vN = mat3(modelMatrix)*(mat3(instanceMatrix)*n);
  vP = aP; vI = vec3(flip, seed, fanner); vBack = step(aWhere.z, 0.);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uPale, uBeeDark;
varying vec3 vLocal, vWorld, vN; varying vec4 vP; varying vec3 vI; varying float vBack;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float part = vP.x, flip = vI.x, b = vP.w;
  vec3 paleB = uPale*0.56;
  float bp = fract(b*4.7 + 0.12);
  float band = smoothstep(0.78, 0.86, bp)*(1. - smoothstep(0.93, 1., bp));
  vec3 abd = mix(uBeeDark, uPale*0.36, band*0.85);
  abd = mix(abd, vec3(0.2, 0.11, 0.035), (1. - smoothstep(0.06, 0.24, b))*0.8);
  abd = mix(abd, paleB, flip*0.8);
  vec3 tho = mix(vec3(0.14, 0.078, 0.021)*(0.75 + 0.5*fract(vI.y*7.3)), uBeeDark*0.7, smoothstep(0.45, 0.62, b));
  vec3 wing = mix(vec3(0.045, 0.038, 0.033), paleB*1.1, max(flip*0.8, vI.z*0.25));
  vec3 alb = part < 0.5 ? abd : part < 1.5 ? tho : part < 2.5 ? uBeeDark*0.7 : part < 3.5 ? wing : uBeeDark*0.8;
  float isWing = step(2.5, part)*(1. - step(3.5, part));
  // beyond 30 m a bee is a dark body in a dark cloak: wings, fur and rim are left to the close pass; a flipped abdomen stays pale
  float nearK = 1. - smoothstep(26., 75., distance(cameraPosition, vWorld));
  alb = mix(mix(uBeeDark*0.8, alb, max(flip*step(part, 0.5), flip*isWing*0.7)), alb, nearK);
  float lit = roofLit(vLocal);
  vec3 col = sunShade(alb, N, V, lit, mix(26., 90., isWing), mix(0.05, 0.16, isWing)*mix(0.15, 1., nearK));
  float rim = pow(1. - max(dot(N, V), 0.), 3.)*(0.35 + 0.65*max(dot(N, uSunDir), 0.))*lit;
  col += uSunCol*rim*vec3(0.5, 0.36, 0.2)*0.32*mix(0.1, 1., nearK);
  col += uSkyCol*isWing*pow(1. - max(dot(N, V), 0.), 4.)*mix(0.08, 0.3, flip)*nearK;
  float shadeSide = smoothstep(0.2, -0.3, dot(N, uSunDir));
  col += vec3(0.62, 0.4, 0.16)*max(1. - lit, shadeSide)*(0.03 + 0.2*pow(1. - max(dot(N, V), 0.), 2.5));   // fur catching the amber of the combs in shade
  col += vec3(0.8, 0.44, 0.13)*shadeSide*vBack*(0.05 + 0.13*isWing + 0.2*pow(1. - max(dot(N, V), 0.), 2.));   // against the light of the comb behind them
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---- honey ropes: tubes posed in the vertex shader; position = (s 0..1, angle, 0) ----
const ROPE_VERT = /* glsl */`
${GLSL_COMMON}
attribute vec3 aBase; attribute vec4 aR;
varying vec3 vLocal, vWorld, vN; varying float vS;
#include <fog_pars_vertex>
void main(){
  float s = position.x, a = position.y;
  float len = aR.x*(1. + 0.05*sin(uTime*0.4 + aR.z));
  float k = len*0.55;
  float coil = aR.w*s*s*(0.4 + 0.6*s), dcoil = aR.w*(0.8*s + 1.8*s*s);
  float th = s*k - uTime*1.5 + aR.z;
  vec3 sway = vec3(sin(uTime*0.6 + aR.z*2.), 0., cos(uTime*0.47 + aR.z))*0.35*s*s;
  vec3 c = aBase + vec3(cos(th)*coil, -s*len, sin(th)*coil) + sway;
  vec3 tg = normalize(vec3(-sin(th)*coil*k + cos(th)*dcoil, -len, cos(th)*coil*k + sin(th)*dcoil));
  vec3 b1 = normalize(cross(tg, vec3(0., 0., 1.)) + vec3(1e-4, 0., 0.));
  vec3 b2 = cross(tg, b1);
  float bead = pow(0.5 + 0.5*sin(s*len*1.25 - uTime*2.1 + aR.z*3.), 8.);
  float r = aR.y*(0.36 + 0.64*exp(-s*9.))*(1. + 1.5*bead*(0.25 + s));
  r += aR.y*0.9*(1. - smoothstep(0., 0.03, s));             // the root flares where it leaves the comb
  vec4 wc = modelMatrix*vec4(c, 1.);
  r = max(r, distance(cameraPosition, wc.xyz)*0.0016)*(1. - smoothstep(0.93, 1., s));
  vec3 nl = b1*cos(a) + b2*sin(a);
  vec3 lp = c + nl*r;
  vLocal = lp; vS = s*len - uTime*2.1;
  vec4 wp = modelMatrix*vec4(lp, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix)*nl;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ROPE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uHoney;
varying vec3 vLocal, vWorld, vN; varying float vS;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float lit = mix(0.3, 1., roofLit(vLocal));
  float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd;
  float fres = pow(1. - max(dot(N, V), 0.), 3.);
  vec3 col = sunShade(uHoney*0.5, N, V, lit, 110., 1.2);
  col += uSunCol*uHoney*vec3(1., 0.85, 0.6)*(0.34 + 1.2*fwd + 0.1*sin(vS*1.3))*lit*(1. - 0.5*fres);   // sun held inside the honey
  col += uSkyCol*fres*0.8;
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;
function buildRopes(ropes) {
  const SIDES = 5, pos = [], base = [], par = [], idx = [];
  ropes.forEach((r) => {
    const SEG = r.seg || 36, o = pos.length / 3;
    for (let k = 0; k <= SEG; k++) for (let i = 0; i < SIDES; i++) {
      pos.push(k / SEG, (i / SIDES) * Math.PI * 2, 0); base.push(r.p.x, r.p.y, r.p.z); par.push(r.len, r.r0, r.phase, r.coil);
    }
    for (let k = 0; k < SEG; k++) for (let i = 0; i < SIDES; i++) {
      const a = o + k * SIDES + i, b = o + k * SIDES + (i + 1) % SIDES, c = a + SIDES, d = b + SIDES;
      idx.push(a, c, b, b, c, d);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(par, 4));
  g.setIndex(idx);
  return g;
}

// ---- where the instanced bees sit ----
async function placeBees(ctx, rng, combs, bite, walkSeats, nearMax, midMax) {
  const near = [], mid = [], walkers = [], P = new THREE.Vector3();
  const tryPush = (list, c, cx, d, side) => {
    const rho = rhoAt(c, cx, d);
    if (rho > 0.97 || d < 0.8) return;
    if (curtainJS(cx, d, side, rho, c) < 0.6) return;
    if (c.index === 5 && Math.hypot(cx - bite.cx, d - bite.d) < bite.r * 1.15 + 5) return;
    combPoint(c, cx, d, side * (halfThick(c, rho, cx, d) + 0.04), P);
    list.push({ p: P.clone(), side, c, d, rot: rng.range(-0.5, 0.5), s: rng.range(0.9, 1.14), seed: rng(), fan: rng.chance(0.09) ? 1 : 0, v: 0, L: 0, dir: null });
  };
  const scan = (list, c, side, sx, sd, d0, d1, skip) => {
    for (let d = d0; d < d1; d += sd) for (let cx = -c.hw; cx < c.hw; cx += sx) {
      const dd = d + rng.range(-0.4, 0.4) * sd, xx = cx + rng.range(-0.4, 0.4) * sx;
      if (skip && skip(dd)) continue;
      tryPush(list, c, xx, dd, side);
    }
  };
  for (const i of [0, 1, 2]) { const c = combs[i]; scan(near, c, 1, i ? 1.22 : 1.5, i ? 1.55 : 1.8, c.top - 195.8, c.top - 183.2); }
  await ctx.yield();
  for (let i = 0; i < 6; i++) {
    const c = combs[i], band = (d) => i <= 2 && d > c.top - 195.8 && d < c.top - 183.2;
    scan(mid, c, 1, 1.6, 1.75, 1.5, c.dep, band);
    await ctx.yield();
  }
  scan(mid, combs[3], -1, 1.7, 1.9, 1.5, combs[3].dep, null);
  scan(mid, combs[2], -1, 3.2, 3.2, 1.5, combs[2].dep, null);
  scan(mid, combs[4], -1, 3.2, 3.2, 1.5, combs[4].dep, null);
  rng.shuffle(near); rng.shuffle(mid);
  near.length = Math.min(near.length, nearMax); mid.length = Math.min(mid.length, midMax);
  // walkers on the bare cells round the tear: straight tracks, planted feet
  const c = combs[5];
  for (let k = 0; k < 400 && walkers.length < 26 && walkSeats.length; k++) {
    const s = rng.pick(walkSeats), off = rng.range(1.6, 6), L = rng.range(5, 9), side = rng.chance(0.7) ? 1 : -1;
    const tsg = rng.sign(), mixo = rng.range(-0.35, 0.35);
    let dx = -Math.sin(s.th) * tsg + Math.cos(s.th) * mixo, dd = Math.cos(s.th) * tsg + Math.sin(s.th) * mixo; const dl = Math.hypot(dx, dd); dx /= dl; dd /= dl;
    const cx = s.cx + Math.cos(s.th) * off, d = s.d + Math.sin(s.th) * off;
    let ok = true;
    for (let f = -0.5; f <= 0.5001 && ok; f += 0.25) {
      const x2 = cx + dx * L * f, d2 = d + dd * L * f, th2 = Math.atan2(d2 - bite.d, x2 - bite.cx);
      if (d2 < 1 || rhoAt(c, x2, d2) > 0.9 || Math.hypot(x2 - bite.cx, d2 - bite.d) < biteR(bite, th2) + 1.1) ok = false;
    }
    if (!ok) continue;
    const rho = rhoAt(c, cx, d);
    combPoint(c, cx, d, side * (halfThick(c, rho, cx, d) + 0.03), P);
    const dir = new THREE.Vector3(c.t.x * dx, -dd, c.t.z * dx).normalize();
    walkers.push({ p: P.clone(), side, c, d, rot: 0, s: rng.range(0.95, 1.1), seed: rng(), fan: 0, v: rng.range(0.7, 1.15), L, dir });
  }
  return { near: near.concat(walkers), mid, walkers: walkers.length };
}
function makeBeeMesh(geom, mat, list) {
  const mesh = new THREE.InstancedMesh(geom, mat, Math.max(1, list.length));
  mesh.count = list.length;
  const info = new Float32Array(Math.max(1, list.length) * 4), where = new Float32Array(Math.max(1, list.length) * 3);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), m = new THREE.Matrix4();
  list.forEach((b, i) => {
    Z.copy(b.c.n).multiplyScalar(b.side);
    if (b.dir) Y.copy(b.dir);
    else { X.crossVectors(up, Z).normalize(); Y.copy(up).multiplyScalar(Math.cos(b.rot)).addScaledVector(X, Math.sin(b.rot)); }
    X.crossVectors(Y, Z).normalize();
    m.makeBasis(X, Y, Z).scale(new THREE.Vector3(b.s, b.s, b.s)).setPosition(b.p);
    mesh.setMatrixAt(i, m);
    info.set([b.seed, b.fan, b.v, b.L], i * 4); where.set([b.c.index, b.d, b.side], i * 3);
  });
  geom.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
  geom.setAttribute('aWhere', new THREE.InstancedBufferAttribute(where, 3));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  if (mesh.boundingSphere) mesh.boundingSphere.radius += 12;
  return mesh;
}

// distance from a hero-local point to the nearest comb solid (analytic)
function combDistance(combs, bite, p) {
  let best = Infinity;
  for (const c of combs) {
    const rx = p.x - c.x, rz = p.z - c.z;
    const cx = rx * c.t.x + rz * c.t.z, cz = rx * c.n.x + rz * c.n.z, d = c.top - p.y;
    if (Math.abs(cz) > 40 || Math.abs(cx) > c.hw + 40) continue;
    const dc = Math.max(d, 0.01), rho = rhoAt(c, cx, dc), rl = Math.hypot(cx, dc);
    let dIn = rho > 1 ? rl * (1 - 1 / rho) : 0;
    if (d < 0) dIn = Math.hypot(dIn, -d) * 0;      // above the comb top there is roof, handled by the rock
    const th = halfThick(c, Math.min(rho, 1), cx, dc) + 0.7;   // + the bees standing on it
    let dist = Math.hypot(dIn, Math.max(0, Math.abs(cz) - th));
    if (c.index === 5) {
      const bl = Math.hypot(cx - bite.cx, dc - bite.d), R = biteR(bite, Math.atan2(dc - bite.d, cx - bite.cx));
      if (bl < R) dist = Math.hypot(R - bl - 0.6, Math.max(0, Math.abs(cz) - th));
    }
    if (d > -2) best = Math.min(best, dist);
  }
  return best;
}

const toColor = (c, fallback) => (c && c.isColor ? c.clone() : new THREE.Color(c ?? fallback));

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('honey-cliff-hero') : ctx.rng, noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const palette = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const hour = opts.hour === 'night' ? 'dawn' : (opts.hour || 'morning'), low = hour === 'dawn' || hour === 'golden';
  const pal = { rock: palette[2], honey: palette[3], dark: palette[4], pale: palette[5], wax: palette[5].clone().lerp(palette[3], 0.45) };

  // ---- layout ----
  const combs = makeCombs(rng, opts.season || 'spring');
  const fly = makeFlyThrough();
  const curve = new THREE.CatmullRomCurve3(fly.pts.map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'centripetal');
  const NSAMP = 520, samples = curve.getSpacedPoints(NSAMP);
  const distPath = (x, y, z, from = 0) => { let b = Infinity; for (let i = from; i <= NSAMP; i++) { const s = samples[i], dx = s.x - x, dy = s.y - y, dz = s.z - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  // where the line goes through comb six: the bite is centred there
  const c6 = combs[5], bite = { cx: 6, d: 26, r: 12.6, p1: rng.range(0, 6.28), p2: rng.range(0, 6.28), p3: rng.range(0, 6.28) };
  for (let i = Math.floor(NSAMP * 0.6); i < NSAMP; i++) {
    const a = samples[i], b = samples[i + 1];
    const za = (a.x - c6.x) * c6.n.x + (a.z - c6.z) * c6.n.z, zb = (b.x - c6.x) * c6.n.x + (b.z - c6.z) * c6.n.z;
    if (za > 0 && zb <= 0 && Math.abs((a.x - c6.x) * c6.t.x + (a.z - c6.z) * c6.t.z) < c6.hw) { const f = za / (za - zb), x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f; bite.cx = (x - c6.x) * c6.t.x + (z - c6.z) * c6.t.z; bite.d = c6.top - (a.y + (b.y - a.y) * f); break; }
  }
  const tearPos = combPoint(c6, bite.cx, bite.d, 0, new THREE.Vector3());
  await ctx.yield();

  // ---- uniforms shared by every material ----
  const sunL = new THREE.Vector3().fromArray(opts.sunDir || (low ? [-0.33, 0.21, 0.92] : [-0.29, 0.53, 0.8])).normalize();
  const sunCol = toColor(opts.sunColor, low ? '#ffbe8f' : '#fff3df').multiplyScalar(opts.sunIntensity ?? (low ? 2.3 : 2.5));
  const skyCol = toColor(opts.skyColor, palette[1].clone().lerp(palette[6], 0.42)).multiplyScalar(opts.skyIntensity ?? 0.6);
  const bounceCol = toColor(opts.bounceColor, palette[2].clone().lerp(palette[1].clone().lerp(palette[6], 0.5), 0.6)).multiplyScalar(0.34);
  const U = {
    uSunDir: { value: sunL.clone() }, uSunL: { value: sunL }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uBounceCol: { value: bounceCol },
    uTime: { value: 0 }, uCalm: { value: low ? 0.45 : 1 }, uShadowK: { value: 0.66 },
    uWave: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, -1)) }, uAbs: { value: new THREE.Vector2(-5, 0) }, uPx: { value: 450 },
    uHoney: { value: pal.honey }, uPale: { value: pal.pale }, uRock: { value: pal.rock },
    uBeeDark: { value: pal.dark.clone().multiplyScalar(1.7).add(new THREE.Color(0.006, 0.0045, 0.004)) },
    uPortalPos: { value: fly.portal.clone() }, uPortalCol: { value: pal.honey.clone().lerp(pal.pale, 0.5).multiplyScalar(1.6) },
    uCombA: { value: combs.map((c) => new THREE.Vector4(c.x, c.z, c.hw, c.dep)) },
    uWet: { value: opts.weather === 'rain' ? 1 : 0 }, uHaze: { value: new THREE.Vector4(0, 0, 0, 0) }, uSea: { value: new THREE.Vector4(0, 0, 0, 0) },      // uSea: the colour of a cloud sea the rock stands in, and how far its foot is lost in it (0 = no sea)
    uBite: { value: new THREE.Vector4(bite.cx, bite.d, bite.r, 5) }, uBiteP: { value: new THREE.Vector3(bite.p1, bite.p2, bite.p3) },
    uMouth: { value: fly.mouth.clone() }, uMr: { value: new THREE.Vector3() }, uMu: { value: new THREE.Vector3() }, uMd: { value: fly.dir.clone() },
    uGlowPos: { value: fly.mouth.clone().addScaledVector(fly.dir, 5) }, uGlowCol: { value: pal.honey.clone().lerp(pal.pale, 0.4).multiplyScalar(1.5) },
    uWinPos: { value: new THREE.Vector3() }, uWinCol: { value: new THREE.Color(0, 0, 0) },
  };
  const FR = cleftFrame(fly); U.uMr.value.copy(FR.r); U.uMu.value.copy(FR.u);
  // amber thrown on the wall by the window comb: stronger the more squarely the sun meets its front
  const c4w = combs[3];
  const setWindowLight = () => { U.uWinPos.value.copy(combPoint(c4w, 0, 12, -3, new THREE.Vector3())); U.uWinCol.value.setRGB(1, 0.5, 0.13).multiplyScalar(0.5 * Math.max(0, c4w.n.dot(sunL)) * Math.max(sunCol.r, 0.2)); };
  setWindowLight();
  const setShadow = () => { U.uShadowK.value = Math.min(4, Math.max(0, sunL.y) / Math.max(sunL.z, 0.08)); };
  setShadow();
  const mat = (vs, fs, extra = {}, side = THREE.DoubleSide) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, side, fog: true,
  });

  const object = new THREE.Group(); object.name = 'honey-cliff-hero';
  // ---- rock ----
  const mouthF = (x, y) => sstep(0.55, 1.1, Math.hypot((x - fly.mouth.x) / 26, (y - fly.mouth.y) / 30)) * 0.9 + 0.1;
  const iPass = Math.floor(NSAMP * 0.5);
  const cliffGeo = await buildCliff(ctx, noise, mouthF, (x, y, z) => distPath(x, y, z, iPass));
  const cliff = new THREE.Mesh(cliffGeo, mat(ROCK_VERT, ROCK_FRAG, { uCleft: { value: new THREE.Vector4(1, 1, 0, 0) } }));
  object.add(cliff);
  await ctx.yield();
  // the displaced wall at (x, y): [x, y, z, ny, nz] (the analytic surface the mesh samples; plants and the lip of the cleft sit on it)
  const wallPoint = (x, y, out = []) => {
    const P = profileAt(x); let k = 0; while (k < P.length - 2 && y > P[k + 1][1]) k++;
    const a = P[k], b = P[k + 1], f = Math.min(1, Math.max(0, (y - a[1]) / Math.max(1e-3, b[1] - a[1]))), zo = a[0] + (b[0] - a[0]) * f;
    let tz = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tz, ty) || 1; tz /= tl; ty /= tl;
    const nz = ty, ny = -tz, mf = mouthF(x, y), zb = zBack(x);
    let disp = wallDisp(noise, x, y, zo, ny, mf);
    if (y > 150 && y < 218 && mf > 0.5) for (let it = 0; it < 4; it++) { const d = distPath(x, y + ny * disp, zb + zo + nz * disp, iPass); if (d >= 7.2) break; disp -= (7.3 - d) * 1.15; }
    out[0] = x; out[1] = y + ny * disp; out[2] = zb + zo + nz * disp; out[3] = ny; out[4] = nz;
    return out;
  };
  // ledges at column x between y0 and y1: the top of every bed whose upper neighbour stands back
  const ledgesAt = (x, y0, y1) => {
    const res = []; let prev = Math.floor(bedC(bedWarp(x, y0)));
    for (let y = y0 + 0.25; y < y1; y += 0.25) {
      const i = Math.floor(bedC(bedWarp(x, y)));
      if (i !== prev) { const w = 1.9 * (bedO(prev) - bedO(i)); if (w > 0.5) res.push({ y: y - 0.12, width: w }); prev = i; }
    }
    return res;
  };
  const _wp = [];
  const lipS = makeLipS(FR, (x, y) => wallPoint(x, Math.min(y, 203), _wp)[2]);
  const cleftGeo = await buildCleft(ctx, noise, fly, lipS);
  object.add(new THREE.Mesh(cleftGeo, mat(ROCK_VERT, ROCK_FRAG, { uCleft: { value: new THREE.Vector4(0, 0, 1, 0) } })));
  await ctx.yield();
  // ---- combs ----
  const combGeo = await buildCombs(ctx, combs);
  object.add(new THREE.Mesh(combGeo, mat(SHELL_VERT, SHELL_FRAG)));
  await ctx.yield();
  const wax = await buildWaxParts(ctx, rng, noise, combs, bite, fly, pal, lipS);
  object.add(new THREE.Mesh(wax.geometry, mat(WAX_VERT, WAX_FRAG)));
  await ctx.yield();
  // ---- honey ropes ----
  const ropes = [], rp = new THREE.Vector3();
  const seats = rng.shuffle(wax.ropeSeats.slice());
  for (const s of seats) {
    if (ropes.length >= 8) break;
    const cz = rng.pick([-0.9, -0.5, 0, 0.5, 0.9]) * s.ht;
    combPoint(c6, s.cx - Math.cos(s.th) * 0.25, s.d - Math.sin(s.th) * 0.25, cz, rp);
    if (ropes.some((r) => r.p.distanceTo(rp) < 2.4)) continue;
    const coil = rng.range(0.5, 1.4); let len = rng.range(15, 36);
    for (let k = 0; k <= 10; k++) {
      const f = k / 10;
      if (distPath(rp.x, rp.y - f * len, rp.z, 300) < 6.5 + coil * f * f + 0.6) { len = len * (f - 0.1); break; }
    }
    if (len < 5) continue;
    ropes.push({ p: rp.clone(), len, r0: rng.range(0.26, 0.48), phase: rng.range(0, 6.28), coil });
  }
  // every comb drips: strands of honey hang from the lower rim and from the foot of the honey crown, stretching and beading
  // (never across the camera line)
  for (const c of combs) {
    const n = c.tier ? 3 : 5;
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (0.5 + (k - (n - 1) / 2) * 0.13 + rng.range(-0.035, 0.035)), rim = rimAt(c, a), side = k % 2 ? -0.5 : 0.6;
      const cx = rim[0] * 0.992, d = rim[1] * 0.992;
      combPoint(c, cx, d, side * halfThick(c, 0.99, cx, d), rp);
      let len = (c.tier ? rng.range(6, 13) : rng.range(8, 19)) * (k === (n - 1) / 2 ? 1.25 : 1);
      const coil = rng.range(0.12, 0.4), r0 = rng.range(0.24, 0.4), phase = rng.range(0, 6.28);
      if (c.index === 5 && Math.hypot(cx - bite.cx, d - bite.d) < bite.r * 1.5) continue;
      for (let j = 0; j <= 8; j++) {
        const f = j / 8;
        if (distPath(rp.x, rp.y - f * len, rp.z, 200) < 7 + coil) { len = len * (f - 0.13); break; }
      }
      if (len < 3) continue;
      ropes.push({ p: rp.clone(), len, r0, phase, coil, seg: 14 });
    }
    await ctx.yield();
  }
  const ropeMesh = new THREE.Mesh(buildRopes(ropes), mat(ROPE_VERT, ROPE_FRAG));
  ropeMesh.frustumCulled = false; object.add(ropeMesh);
  await ctx.yield();
  // ---- bees ----
  const placed = await placeBees(ctx, rng, combs, bite, wax.walkSeats, 560, Math.round(2700 * (0.5 + 0.5 * detail)));
  await ctx.yield();
  const beeMat = mat(BEE_VERT, BEE_FRAG);
  object.add(makeBeeMesh(buildNearBee(), beeMat, placed.near));
  await ctx.yield();
  object.add(makeBeeMesh(buildMidBee(), beeMat, placed.mid));
  await ctx.yield();

  // ---- clearance of the camera line (>= 6 m from every solid) ----
  const clearance = { combs: Infinity, rock: Infinity, wax: Infinity };
  for (let i = 0; i <= NSAMP; i += 2) { const d = combDistance(combs, bite, samples[i]); if (d < clearance.combs) { clearance.combs = d; clearance.combsAt = samples[i].toArray().map((v) => Math.round(v)); } }
  await ctx.yield();
  const vertClear = async (geo, skipMouth) => {
    const a = geo.attributes.position.array; let best = Infinity;
    for (let i = 0; i < a.length; i += 3) {
      const x = a[i], y = a[i + 1], z = a[i + 2];
      if (i % 12000 === 0) await ctx.yield();     // every 4,000 vertices
      if (y < 150 || y > 216) continue;
      if (skipMouth) { const qx = x - fly.mouth.x, qy = y - fly.mouth.y, qz = z - fly.mouth.z, ma = qx * FR.r.x + qy * FR.r.y + qz * FR.r.z, mb = qx * FR.u.x + qy * FR.u.y + qz * FR.u.z; if (Math.abs(qx * FR.d.x + qy * FR.d.y + qz * FR.d.z) < 16 && Math.hypot(ma, mb) < holeR(Math.atan2(mb, ma)) + 1.3) continue; }
      const d = distPath(x, y, z); if (d < best) best = d;
    }
    return best;
  };
  clearance.rock = await vertClear(cliffGeo, true);
  await ctx.yield();
  clearance.rock = Math.min(clearance.rock, await vertClear(cleftGeo, false));
  await ctx.yield();
  clearance.wax = await vertClear(wax.geometry, false);

  // ---- waves ----
  let journey = opts.journeySeconds ?? 41.6;
  const c5 = combs[4];
  let schedule = (opts.waves || [
    { u: 0.30, x: -215, y: 190 }, { u: 0.645, x: combs[3].x, y: 194 },
    { u: 0.84, x: c5.x + 8, y: 190 }, { u: 0.872, x: c5.x - 10, y: 184 }, { u: 0.905, x: tearPos.x, y: tearPos.y },
  ]).slice().sort((a, b) => a.u - b.u);
  const demo = []; for (let i = 0; i < 9; i++) { const c = combs[rng.int(0, 11)]; demo.push({ x: c.x + rng.range(-20, 20), y: c.top - rng.range(8, 30) }); }
  demo[0] = { x: -215, y: 190 };
  const manual = [];
  let progress = -1, lastTime = 0;
  const setWaves = (time) => {
    const W = U.uWave.value; let n = 0;
    const put = (x, y, age) => { if (n < 4 && age >= 0 && age < 14) W[n++].set(x, y, 0, age); };
    for (let i = manual.length - 1; i >= 0; i--) { const a = time - manual[i].t0; if (a > 14 || a < 0) manual.splice(i, 1); else put(manual[i].x, manual[i].y, a); }
    if (progress >= 0) {
      for (let i = schedule.length - 1; i >= 0; i--) put(schedule[i].x, schedule[i].y, (progress - schedule[i].u) * journey);
    } else {
      const k = Math.floor(time / 6.5);
      for (let j = 0; j < 3; j++) { const id = k - j; if (id >= 0) { const s = demo[id % demo.length]; put(s.x, s.y, time - id * 6.5); } }
    }
    while (n < 4) W[n++].w = -1;
  };

  // ---- anchors ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const c4 = combs[3], behind4 = combPoint(c4, 0, c4.top - 194.5, -15.8, new THREE.Vector3());
  const anchors = {
    flyThrough: fly.pts.map((q) => V3(q[0], q[1], q[2])), secondPassStart: fly.secondPassStart, entry: fly.entry, route: fly.route,
    portalSeat: { position: fly.portal.clone(), direction: fly.dir.clone(), facing: fly.dir.clone().negate(), radius: 7 },
    cleftMouth: fly.mouth.clone(),
    combs: combs.map((c) => ({ index: c.index, tier: c.tier, center: combPoint(c, 0, c.dep * 0.45, 0, new THREE.Vector3()), normal: c.n.clone(), tangent: c.t.clone(), halfWidth: c.hw, depth: c.dep, top: c.top })),
    tear: { position: tearPos.clone(), radius: bite.r },
    window: { position: behind4, lookAt: combPoint(c4, -3, 9.5, 0, new THREE.Vector3()), lookAtSouth: combPoint(c4, -17, 10, 0, new THREE.Vector3()) },
    buzzardLine: [V3(-250, 192, zBack(-250) + OUT_U + 25), V3(-110, 190, zBack(-110) + OUT_U + 25), V3(40, 190, zBack(40) + OUT_U + 25), V3(250, 192, zBack(250) + OUT_U + 25)],
    hornetStation: combPoint(c5, 0, c5.top - 188, 8, new THREE.Vector3()),
    ladderSeat: V3(242, ROOF_U - 0.5, 22), torchSeat: V3(259, ROOF_U - 0.5, 12.5),
    roofLip: Array.from({ length: 20 }, (_, i) => { const x = -285 + i * 30; return V3(x, ROOF_U + 3, zBack(x) + JUT_U * jutF(x)); }),
    sunDir: sunL.clone(),
  };

  const center = V3(0, 165, 0), radius = 340, height = 200;

  const hero = {
    object, radius, height, center, anchors, ground: false, groundY: Y_LO,
    uniforms: U, clearance, combs,
    info: { triangles: 0, ropes: ropes.length, nearBees: placed.near.length, midBees: placed.mid.length, walkers: placed.walkers },
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); },
    setSchedule(waves, seconds) { schedule = waves.slice().sort((p, q) => p.u - q.u); if (seconds) journey = seconds; },
    launchWave(x, y) { manual.push({ x, y, t0: lastTime }); if (manual.length > 3) manual.shift(); },
    setAbscond(p, combIndex = 2) { U.uAbs.value.set(p > 0 ? combIndex : -5, Math.min(1, Math.max(0, p))); },
    setSun(dirLocal, color, sky, bounce) {
      if (dirLocal) { sunL.copy(dirLocal).normalize(); setShadow(); }
      if (color) sunCol.copy(color); if (sky) skyCol.copy(sky); if (bounce) bounceCol.copy(bounce);
      setWindowLight();
    },
    // haze: [r, g, b, density] fades this rock into the air with distance, beyond the slab only (|x| > 330)
    rockMaterial(haze) { return mat(ROCK_VERT, ROCK_FRAG, { uCleft: { value: new THREE.Vector4(0, 1, 0, 0) }, uHaze: { value: new THREE.Vector4().fromArray(haze || [0, 0, 0, 0]) } }); },
    profileAt, zBack, jutF, wallPoint, ledgesAt, holeR, lipS, cleftFrame: FR, cleftLength: CLEFT_LEN, bedDisp,
    setPortalLight(color, intensity = 1.6, mouth = intensity * 0.8) { U.uPortalCol.value.copy(toColor(color)).multiplyScalar(intensity); U.uGlowCol.value.copy(toColor(color)).multiplyScalar(mouth); },
    update(dt, time, camera) {
      lastTime = time;
      U.uTime.value = time;
      object.updateMatrixWorld();
      U.uSunDir.value.copy(sunL).transformDirection(object.matrixWorld);
      setWaves(time);
    },
    dispose() {},
  };
  object.traverse((o) => { if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; hero.info.triangles += n * (o.isInstancedMesh ? o.count : 1); } });
  return hero;
}
