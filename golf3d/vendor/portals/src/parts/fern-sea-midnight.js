// fern-sea-midnight: THE GREEN ARCTIC SEA, 49 million years ago (Azolla interval, Ellesmere, 78 N).
// Hero set piece: "the sea that is taken for a meadow and then breathes": one fine-grained emerald-and-rust
// lawn of floating fern riding a 70 m swell, combed by an echelon of hornless brontotheres (Palaeosyops) wading
// chest-deep, each tearing a tea-black sparkling lane that heals from the sides behind it; calves swimming at
// their flanks; rafts of stilt-legged ducks (Presbyornis) sitting on the mat and riding every crest.
//
// LOCAL SPACE  origin = centre of the echelon at time 0 (water level at rest is y = 0), +Y up, the herd wades
//   toward +Z (the world's north-west). Default sun is to the herd's right (-X), 7 degrees up; the swell comes
//   from the herd's front-right (north) and travels toward (+X, -Z).
// SIZE   radius 2.5 / height 4 are only the viewer's orbit hints (the bull and his calf at the centre); the sea disc itself is opts.seaRadius
//   (default 620 m) and the echelon is ~180 m wide. ground: false (the piece is its own ground).
// COST   about 150k triangles (sea 32k, up to 15 hero waders 4.4k each, the rest light ones at 1.2k, 180 ducks 110, breath) in
//   5 draw calls, 5 shader programs, no lights, no render targets; build ~130 ms, longest step ~20 ms.
// LIGHT  No three.js lights are read. Everything is shaded by its own uniforms: a low warm key (opts.sunDir,
//   opts.sunColor), an aqua sky fill and an analytic sky for the water's reflection. hero.setLight({ sunDir,
//   sunColor, skyZenith, skyHorizon }) relights it. Open water sparkle is the only thing above 1.0 (bloom).
// OPTS   palette [emerald, rust, teaBlack, gold, slate, lime, cream]; detail 0.6..1 (thins ducks and grid, never the
//   herd); seaRadius; swell (crest to trough, m, 1.6); shelf {x,z,radius,damp} (where the swell is damped to
//   0.3); herd (count, default 21); calves (6); ducks (220); herdSpeed (1.2 m/s); herdStart (m along +Z at
//   time 0); fan {x,z,radius} (the river's open black fan; default none in view: far behind the herd);
//   sunDir [x,y,z] (toward the sun, local); shadowTex + shadowRect [x0,z0,x1,z1] (the world's baked redwood
//   shadow bars, sampled bent by the swell); lateSeason 0..1 (share of rust).
// ANCHORS (local space, metres)
//   flyThrough  ordered points of leg C in the herd's frame (review 2): in behind the far end of the sun-side wing
//               (x < -7, a clean line through WING.o trailing back at ECH_SLOPE, the bull 7 m ahead of it), 4.6 m behind
//               the animals so their lanes pass under; across the line through its wide gap (WING.breakAt); then 6 m
//               AHEAD of the line at 1.1 m so each wader passes in profile, head first; then past the hero bull's
//               sun-lit flank abeam at 4 m and across ahead of his nose;  heroBull: that bull's position at time 0.
//   (polish 2) ROUTE: leg C runs the whole sun-side wing 3.6 m AHEAD of the waders' noses at 1.1 m, looking along them toward the low sun,
//   four leaders wading on the other side of the route; legs D and E wind through a drowned forest (layoutRoute: a left bend, a long
//   right sweep, a short avenue to the ring). The sun-side wing and the leaders wade knee- to hock-deep (legs in view); the far wing
//   chest-deep. The mat is coloured by the floe, lit by a raking sun (lumps and lips), and open water carries sky, the boles' own
//   red-brown reflections (seaMaterial uRefl, re-chosen each frame by the world), the forest (uPools[6]) and the ring's glow (uRing).
//   Waders stand chest-deep (the water line half-way up the barrel, depth 0.63-0.69 of the shoulder scale), heads
//   carried forward and up; uRefl[8] on the sea material lays trunk reflections (x, z, radius, height) on open water.
//   herdHeading, herdSpeed, laneLength: so the world can extend/animate; herdAt(time) -> Vector3 offset.
//   portalSeat  { position, facing }: a seat 190 m ahead-left of the herd, 7 m up, facing back at the comb.
//   viewpoints  good camera stations { position, target }.
//   swellFrom   unit vector the swell comes from;  waterY 0.
// SEA SPACE  The piece rides with its herd: the herd stays at the local origin and the lawn, swell, ducks, fan,
//   tears, rain and shadow texture live in "sea space" = local + (0, 0, herdStart + herdSpeed * time). To keep the
//   sea fixed in the world, set hero.object.position = base + anchors.herdAt(time) every frame; then sea space
//   is world space minus base. Leave the object still (the viewer does) and the lawn slides under the herd.
// PROGRESS  hero.setProgress(u) (0..1 of the world's journey) drives the scripted things: uSink (u 0.09-0.14:
//   bank animals made with makeBrontoHerd, kind 3, wade uniforms.uWalk metres the way they face, forequarters
//   tipping down first, and sink to the chest); uniforms.uChan is a lobe where the shelf does not damp the swell, the squall's rain coins
//   (u 0.60-0.80; place them with hero.seaMaterial.uniforms.uRain.value.set(x, z, radius, k), sea space) and
//   the sitting ducks leaving in a wave (u 0.44-0.52). Until setProgress is first called a light shower plays
//   beside the herd. hero.setTear(i, x, z, radius) opens one of 8 analytic holes (sea space).
//   hero.update(dt, time, camera, herdTime) takes the herd's own clock as an optional 4th argument; seaMaterial
//   uniforms uLead / uLeadB open a straight lead of black water (the world's rare event, and its last healing lane).
//   (review 3) uniforms.uSwPh is a phase added to the main swell's clock and uniforms.uChanG the swell's gain inside the uChan lobe: the
//   world keys its first crest to the journey with them. seaMaterial uFanAxis (unit xz; zero = off) keeps the fan's edge free of its big
//   bays within 18 m of that axis; uRustAt (x, z, radius, amount) asks for a rust patch. The swell also reads by height now (lit crests,
//   deep troughs), pads of 3 m and 9 m keep crisp edges to 60 m, and wide leads of sparkle open along every crest's back.
//   hero.heightAt(x, z, time) is the JS twin of the shader swell (sea space) for anything the world floats.
// EXPORTS  buildHero, buildBrontothere (geometry), makeBrontoHerd (instanced waders for the shelf and exit bank,
//   sharing hero.uniforms), SWELL_GLSL (swellAt for the world's own floating things), makeSeaUniforms.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2FA35A', '#A8432B', '#14110D', '#F0C060', '#5B6478', '#8DB25A', '#F4EFE6'];
const TAU = Math.PI * 2;
const lin = (hex) => new THREE.Color(hex);
// (polish 1) The sun-side wing is ONE LINE with the bull at its head (WING.o, herd frame), running out toward the low sun and trailing back
// at ECH_SLOPE: wader k (1..n) stands wingS(k) metres along it from the bull (negative = outward), a wide gap after the fourth.
export const ECH_SLOPE = 0.35;
export const WING = { o: [-4, 0], n: 14, first: 7, step: 6.6, gapAfter: 4, gap: 10 };
const WING_AT = [0, 7, 11.4, 21, 26.2, 30.4, 36.4, 47.5, 52.2, 61.5, 67, 71.4, 79.5, 85.5, 90.6, 100, 106, 112];      // (polish 2) pairs, threes and gaps, never a ruled queue
export const wingS = (k) => -(WING_AT[Math.min(k, WING_AT.length - 1)] + Math.max(0, k - WING_AT.length + 1) * 6);
const EL = Math.hypot(1, ECH_SLOPE), EX = 1 / EL, EZ = ECH_SLOPE / EL;
export const wingXZ = (sA, d) => [WING.o[0] + EX * sA + EZ * d, WING.o[1] + EZ * sA - EX * d];      // d < 0 is ahead of the line, d > 0 behind it (where the lanes lie)

// ---------------------------------------------------------------- the route (the world flies it; tools/tests can lay it out without a renderer)
export const ROUTE = { DUR: 46, HERD_SPEED: 1.15, ESTEP: 34, A_LEN: 59, SHELF_AT: 39.5, RB: 31, RD: 30, RL: 50, DL: 1.0, N2: [-0.7071, 0.7071], E2: [-0.7071, -0.7071],
  A_PROFILE: [[0, 4.8], [11, 3.5], [22, 2.05], [30, 1.5], [36, 1.8], [41, 2.2], [46, 2.2], [52, 1.75], [58, 1.7]],      // leg A: metres north of the entry, height
  // leg C in the wing's own frame: [sA, d, y]. In along the line's own extension (the bull broadside dead ahead against the sun, his wing
  // stacked behind him), across his bows, along the first four waders 3.7 m ahead of their noses, through the gap, and down the rest
  // of the wing from 4 to 5 m behind it, their lanes passing under us, to the open sea beyond its end.
  C: [[21, -2.0, 1.8], [17, -1.5, 1.6], [10, -1.6, 1.2], [4.5, -3.4, 1.1], [-1.5, -4.6, 1.05], [-10, -3.9, 1.9], [-20, -3.7, 3.6], [-30, -3.6, 6.0], [-40, -3.6, 7.8], [-50, -3.7, 7.6],
    [-60, -3.6, 4.2], [-72, -3.7, 1.6], [-84, -3.6, 1.15], [-96, -3.8, 1.3], [-108, -2.5, 1.1], [-120, 1, 0.75], [-135, 4, 1.1], [-150, 6.5, 2.0]] };   // (polish 3) ONE RISE right after the bull, over the head of the wing: from 14 m the lanes lie below as a comb of black strokes burning toward the sun; then down to skim the carpet into the grove
export const herdD = (u) => ROUTE.HERD_SPEED * ROUTE.DUR * u;      // the echelon's travel is keyed to the journey, not the clock
export async function layoutRoute(yieldFn = async () => {}) {
  const { N2, E2, A_LEN, A_PROFILE, ESTEP, RB, RD } = ROUTE, TAU = Math.PI * 2;
  const Ch = ROUTE.C.map(([sA, d, y]) => { const q = wingXZ(sA, d); return [q[0], y, q[1]]; });
  const us = Ch.map((c, i) => 0.25 + 0.3 * i / (Ch.length - 1));
  const hd = (a, b) => { const l = Math.hypot(b[0] - a[0], b[2] - a[2]); return [(b[0] - a[0]) / l, (b[2] - a[2]) / l]; };
  let out = null;
  for (let it = 0; it < 3; it++) {
    await yieldFn();
    const C = Ch.map((c, i) => [c[0], c[1], c[2] + herdD(us[i])]);
    // B: a RIGHT-hand arc from north round toward the sun and onto C; A: A_LEN m north before it
    const h0 = hd(C[0], C[1]), bc = [C[0][0] - RB * h0[1], C[0][2] + RB * h0[0]], aN = Math.atan2(N2[1], N2[0]); let aC = Math.atan2(h0[1], h0[0]); if (aC < aN) aC += TAU;
    const B = []; for (let k = 0; k <= 3; k++) { const a = lerp(aN, aC, k / 4); B.push([bc[0] + RB * Math.sin(a), 2.5, bc[1] - RB * Math.cos(a)]); }
    // A: north out of the river mouth, down at once to skim the river's fan, lifting over the first crest beside the bull's shelf
    const P = []; A_PROFILE.forEach(([sN, y]) => { const w = 3.6 * (1 - smoothstep(30, 46, sN)), d = A_LEN - sN; P.push([B[0][0] - N2[0] * d - E2[0] * w, y, B[0][2] - N2[1] * d - E2[1] * w]); });
    B[0][1] = 1.6; B[1][1] = 1.45; B[2][1] = 1.5; B[3][1] = 1.7;      // (polish 3) skimming the carpet past the Gastornis bank
    P.push(...B, ...C);
    // D: a right-hand arc through the drowned grove, ending east-south-east; E: 5 x ESTEP m dead straight, climbing 2 -> 7 m
    // (polish 2) D is THE DROWNED FOREST: a left-hand bend in among the boles, then a long right-hand sweep that swings the low sun
    // through the frame behind them; E is a short avenue, level and low over the black water for its first 22 m, then 60 m dead
    // straight climbing to the ring. (Before: 54 m of arc and 170 m straight at the ring over open lawn: three stills of one view.)
    const n = C.length, h1 = hd(C[n - 2], C[n - 1]), e0 = C[n - 1], phi0 = Math.atan2(h1[1], h1[0]), phiE = 247.5 * Math.PI / 180;
    const arc = (S, phi, sg, Rr, dA, ns, yOf) => { const c = [S[0] - Rr * sg * Math.sin(phi), S[2] + Rr * sg * Math.cos(phi)];
      for (let k = 1; k <= ns; k++) { const a = phi + sg * dA * k / ns; P.push([c[0] + Rr * sg * Math.sin(a), yOf(k / ns), c[1] - Rr * sg * Math.cos(a)]); } return phi + sg * dA; };
    const phi1 = arc(e0, phi0, -1, ROUTE.RL, ROUTE.DL, 3, (s) => lerp(2.2, 1.7, s)), dl = P[P.length - 1];
    let phi2 = phi1; while (phiE - phi2 > TAU) phi2 += TAU; while (phiE < phi2) phi2 -= TAU;
    arc(dl, phi2, 1, RD, phiE - phi2, 7, (s) => lerp(1.7, 2.2, s * s) - 0.25 * Math.sin(Math.PI * s));
    const e = P[P.length - 1], dir = [Math.cos(phiE), Math.sin(phiE)];
    // (polish 3) the sweep runs straight into the last 60 m: the ring comes out from behind the island the sweep rounds, it is not faced for three stills
    for (let k = 1; k <= 3; k++) P.push([e[0] + dir[0] * 20 * k, 2.2 + 1.6 * k, e[2] + dir[1] * 20 * k]);
    const path = makePath(P);
    await yieldFn();
    out = { points: P, path, exitDir: dir, c0: C[0], c1: C[n - 1], d1: e, dl, cBull: C[4], cGap: C[8], cEnd: C[14], ech: [EX, EZ], shelfAlong: ROUTE.SHELF_AT };
    C.forEach((c, i) => { us[i] = path.nearestXZ(c[0], c[2]).u; });        // where we really are when we get there: place the herd by that
  }
  return out;
}

// ---------------------------------------------------------------- shared GLSL
// the low sun's long shadows of the animals that stand whole (and a soft contact shade under each): 0 lit .. 1 shaded
export const SHADE_GLSL = /* glsl */`
uniform vec4 uShad[10];
float castShade(vec2 p, vec2 sd){ float s = 0.;
  for (int i = 0; i < 10; i++) { vec4 c = uShad[i]; float hw = max(c.z, 1e-3), on = step(0.01, c.z); vec2 r = p - c.xy; float al = -dot(r, sd), ac = abs(r.x * sd.y - r.y * sd.x);
    float w = hw * (1. + 0.05 * max(al, 0.));
    float k = (1. - smoothstep(w * 0.45, w, ac)) * smoothstep(-hw * 1.5, hw * 0.5, al) * (1. - smoothstep(c.w * 0.35, max(c.w, 0.1), al));
    float ao = 1. - smoothstep(hw * 0.7, hw * 2.4, length(r));
    s = max(s, on * max(k * 0.8, ao * 0.6)); }
  return s; }
`;
export const SWELL_GLSL = /* glsl */`
uniform float uTime;
uniform vec4 uSw1;   // dir.x, dir.z, wavenumber, amplitude (main swell)
uniform vec4 uSw2;   // cross-chop
uniform vec2 uSwW;   // angular speeds
uniform vec4 uShelf; // centre x, z, radius, damping inside
uniform vec4 uChan;  // the river channel, where the shelf does not damp the swell: centre x, z, full within, none beyond
uniform float uChanG;
uniform vec3 uCamL;  // camera in local space
uniform float uSwPh; // phase added to the main swell's clock (the world keys the first crest to its journey with it)
float shelfK(vec2 p){ float d = length(p - uShelf.xy); return max(mix(uShelf.w, 1., smoothstep(uShelf.z, uShelf.z * 1.5 + 50., d)), uChanG * (1. - smoothstep(uChan.z, uChan.w, length(p - uChan.xy)))); }
// returns xyz = displacement of a floating point resting at p (y up); grad = d(height)/d(x,z); crest = -1..1 phase height
vec3 swellAt(vec2 p, out vec2 grad, out float crest){
  float far = 1. - smoothstep(380., 600., length(p - uCamL.xz));
  float nearK = 1. - smoothstep(110., 190., length(p - uCamL.xz));
  float a1 = uSw1.w * shelfK(p) * far, a2 = uSw2.w * nearK;
  float t1 = dot(uSw1.xy, p) * uSw1.z - uSwW.x * uTime - uSwPh;
  float t2 = dot(uSw2.xy, p) * uSw2.z - uSwW.y * uTime;
  float s1 = sin(t1), c1 = cos(t1), s2 = sin(t2), c2 = cos(t2);
  // a slightly peaked crest: add a touch of the second harmonic
  float h = a1 * (s1 - 0.12 * cos(2. * t1)) + a2 * s2;
  grad = uSw1.xy * (uSw1.z * a1 * (c1 + 0.24 * sin(2. * t1))) + uSw2.xy * (uSw2.z * a2 * c2);
  crest = s1;
  vec2 hz = -uSw1.xy * (a1 * 0.55 * c1) - uSw2.xy * (a2 * 0.4 * c2);
  return vec3(hz.x, h, hz.y);
}
`;

const NOISE_GLSL = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p + n * 31.7 + 7.13)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.13 + 17.1) + 0.2 * vnoise(p * 4.31 + 3.7); }
`;

// shared uniforms: every material in the piece references these same objects
export function makeSeaUniforms(opts = {}) {
  const P = opts.palette || DEFAULT_PALETTE;
  const swell = opts.swell ?? 1.6;
  const sh = opts.shelf || { x: 0, z: 10, radius: 120, damp: 0.3 };
  const sd = new THREE.Vector3(...(opts.sunDir || [-0.955, 0.122, -0.27])).normalize();
  const d1 = new THREE.Vector2(0.72, -0.69).normalize(), d2 = new THREE.Vector2(-0.83, -0.55).normalize();
  return {
    uTime: { value: 0 },
    uSw1: { value: new THREE.Vector4(d1.x, d1.y, TAU / 70, swell * 0.5) },
    uSw2: { value: new THREE.Vector4(d2.x, d2.y, TAU / 23, 0.1) },
    uSwW: { value: new THREE.Vector2(TAU / 7, TAU / 3.84) },
    uShelf: { value: new THREE.Vector4(sh.x, sh.z, sh.radius, sh.damp) },
    uChan: { value: new THREE.Vector4(0, -1e5, 1, 2) },
    uChanG: { value: 1 },                           // gain of the swell inside the channel lobe (the world's first crest stands full height there)
    uSwPh: { value: 0 },
    uCamL: { value: new THREE.Vector3(0, 3, 40) },
    uSunDir: { value: sd },
    uSunCol: { value: lin(opts.sunColor || P[3]).multiplyScalar(2.6) },
    uSkyZen: { value: lin('#8FC3CF') },
    uSkyHor: { value: lin(P[6]).lerp(lin(P[3]), 0.25) },
    uHerd: { value: new THREE.Vector2(0, 0) },      // herd travel offset (x, z), local
    uSink: { value: 0 },                            // shelf animals: 0 standing whole on the mud, 1 chest-deep
    uLift: { value: 0 },                            // duck wave: 0 sitting, 1 gone
    uWalk: { value: opts.walk ?? 5.5 },
    uShad: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 1)) },   // long shadows of things that stand whole: x, z, half width, length (world sets them)             // metres a bank animal wades as it sinks
  };
}

// JS twin of swellAt's height (without the camera-distance fades, which only tame far aliasing)
function makeHeightAt(U) {
  return (x, z, t) => {
    const s1 = U.uSw1.value, s2 = U.uSw2.value, w = U.uSwW.value, sh = U.uShelf.value;
    const ch = U.uChan.value, d = Math.hypot(x - sh.x, z - sh.y), k = Math.max(lerp(sh.w, 1, smoothstep(sh.z, sh.z * 1.5 + 50, d)), U.uChanG.value * (1 - smoothstep(ch.z, ch.w, Math.hypot(x - ch.x, z - ch.y))));
    const t1 = (s1.x * x + s1.y * z) * s1.z - w.x * t - U.uSwPh.value, t2 = (s2.x * x + s2.y * z) * s2.z - w.y * t;
    return s1.w * k * (Math.sin(t1) - 0.12 * Math.cos(2 * t1)) + s2.w * Math.sin(t2);
  };
}

// ---------------------------------------------------------------- herd layout (one rigid echelon)
// Returns animals in herd space: { x, z, s (scale), kind: 0 cow | 1 bull | 2 calf | 3 shelf pair, ph, tint }
function layoutHerd(rng, o) {
  const n = o.herd ?? 21, list = [];
  // The sun-side wing (x < 0, the one the fly-through follows) is always a clean echelon trailing back at
  // ECH_SLOPE, 8.6 m apart, so the route can pass 4 m behind every tail; the far wing varies by seed (echelon on, or a vee).
  const slant = (rng.chance(0.5) ? 1 : -1) * rng.range(0.28, 0.42), vee = slant > 0 || rng.chance(0.3);
  const kb = Math.min(WING.n, n - 1);                       // twelve on the sun-side wing: the rest lead away on the far one
  for (let k = 0; k < n; k++) {
    const j = k - kb;                                      // 0 = the hero bull, negative = the sun-side wing
    const jx = rng.range(-1.3, 1.3), jz = rng.range(-2.2, 2.2);
    let x, z, lead = false, front = false;
    if (j < 0) { const kk = -j, dd = 0.6 + jz * 0.45;      // (polish 2) a loose band, never a queue: staggered up to 3.3 m back from the line the route follows
      const q = wingXZ(wingS(kk) + jx * 0.6, dd); x = q[0]; z = q[1]; }
    // (polish 2) FOUR LEADERS wade ahead of the line on the other side of the route (6 to 9 m to our left as we fly along the wing, sun-lit
    // where the wing is back-lit), each opposite a gap in the line, so its lane runs back across our path and between the waders:
    // we fly THROUGH the herd, lanes passing under us
    else if (j >= 1 && j <= 4) { const q = wingXZ(-[16.2, 36, 57, 76.5][j - 1] + jx * 0.5, -(10.8 + (jz + 2.2) * 0.6)); x = q[0]; z = q[1]; lead = true; }
    else if (j === 5) { const q = wingXZ(3.1, 0.7); x = q[0]; z = q[1]; lead = true; front = true; }      // (polish 4) a cow wades at the bull's shoulder on our side: the nearest animal of the pass, large against the sun
    else { const jj = Math.max(1, j - 4); x = 2 + 7.5 * jj + jx; z = 17 + jj * 7.5 * (vee ? 0.5 : 0.36) + jz; }     // the far wing always LEADS: it lies ahead-left of the route's legs A and B
    let bull = k === kb || rng.chance(0.3);
    if (k === kb) { x = -4; z = 0; }                       // the bull the camera passes closest
    if (j === -1 || j === -4 || j === -7 || j === 5) bull = false; if (j === -3 || j === -5 || j === -9) bull = true;  // a cow beside him, another tusked bull three places down the wing
    list.push({ x, z, s: bull ? rng.range(1.04, 1.12) : rng.range(0.9, 1.0), kind: bull ? 1 : 0, ph: rng(), tint: rng.range(-1, 1), lane: 1, j, lead, front });
  }
  // calves swim at a flank, a little behind the shoulder; the bull's own calf on his far (shaded) flank
  const nc = o.calves ?? 6, order = list.map((_, i) => i).sort((a, b) => Math.abs(list[a].x + 4) - Math.abs(list[b].x + 4));
  for (let c = 0; c < nc && c < n; c++) {
    const m = list[order[c === 0 ? 0 : Math.min(n - 1, c * 3 - 1)]], side = c === 0 ? -1 : m.j < 0 ? 1 : (rng.chance(0.5) ? 1 : -1);   // the bull's own calf swims just astern of him on the NEAR (sun) side, wholly in view
    list.push({ x: m.x + side * (c === 0 ? rng.range(0.25, 0.4) : rng.range(1.12, 1.3)), z: m.z - (c === 0 ? rng.range(2.3, 2.45) : rng.range(0.5, 1.4)), s: rng.range(0.46, 0.52), kind: 2, ph: rng(), tint: rng.range(-1, 1), lane: 0.34 });
  }
  return list;
}

// One RGBA8 texture, rigid in herd space: R = distance to the lane's centre line (0..4 m), G = metres behind the
// chest (0..40), B = lane width scale, A = the animal's long low-sun shadow on the lawn.
async function bakeLanes(ctx, herd, sunDir, W = 512, H = 256) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const a of herd) { x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); z0 = Math.min(z0, a.z); z1 = Math.max(z1, a.z); }
  x0 -= 14; x1 += 14; z0 -= 44; z1 += 8;
  const data = new Uint8Array(W * H * 4), sx = (x1 - x0) / W, sz = (z1 - z0) / H;
  const sl = Math.hypot(sunDir.x, sunDir.z) || 1, shx = -sunDir.x / sl, shz = -sunDir.z / sl;   // shadow runs down-sun
  const shLen = Math.min(11, 0.75 / Math.max(0.05, sunDir.y));
  for (let j = 0; j < H; j++) {
    if (j % 4 === 0) await ctx.yield();
    const z = z0 + (j + 0.5) * sz;
    for (let i = 0; i < W; i++) {
      const x = x0 + (i + 0.5) * sx;
      let best = 4, bd = 40, bw = 1, shadow = 0;
      for (let k = 0; k < herd.length; k++) {
        const a = herd[k], dx = x - a.x;
        if (dx > 13 || dx < -13) continue;
        const head = a.z + 1.75 * a.s, back = head - z;            // the lane opens at the chest and muzzle: the animal fills its head
        if (dx < 4 && dx > -4) {
          const dist = back < 0 ? Math.hypot(dx, back * 2.2) : Math.abs(dx);
          const dn = dist / a.lane;
          if (dn < best && back < 40 * a.lane) { best = dn; bd = Math.max(0, back) / a.lane; bw = a.lane; }
        }
        // shadow: a tapering bar from the body down-sun
        const rx = x - a.x, rz = z - (a.z + 0.4 * a.s), al = rx * shx + rz * shz, ac = Math.abs(rx * shz - rz * shx);
        if (al > -0.6 && al < shLen * a.s) {
          const w = 1.25 * a.s * (1 - 0.35 * al / (shLen * a.s));
          shadow = Math.max(shadow, clamp(1.3 - ac / w, 0, 1) * clamp(1 - al / (shLen * a.s), 0, 1) ** 0.6 * clamp((al + 0.6) * 2, 0, 1));
        }
      }
      const o = (j * W + i) * 4;
      data[o] = Math.round(best / 4 * 255); data[o + 1] = Math.round(Math.min(1, bd / 40) * 255); data[o + 2] = Math.round(bw * 255); data[o + 3] = Math.round(shadow * 255);
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return { tex, rect: new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)) };
}

// polar grid, fine at the centre, coarse at the rim
function seaGeometry(R, detail) {
  const NR = Math.round(100 * detail), NA = Math.round(160 * detail), pos = new Float32Array((NR + 1) * NA * 3 + 3), idx = [];
  let p = 3;   // vertex 0 = centre
  for (let i = 0; i <= NR; i++) {
    const t = (i + 1) / (NR + 1), r = R * (0.03 * t + 0.97 * t * t * t);
    for (let j = 0; j < NA; j++) { const a = ((j + (i % 2) * 0.5) / NA) * TAU; pos[p++] = Math.sin(a) * r; pos[p++] = 0; pos[p++] = Math.cos(a) * r; }
  }
  for (let j = 0; j < NA; j++) idx.push(0, 1 + j, 1 + (j + 1) % NA);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = 1 + i * NA + j, b = 1 + i * NA + (j + 1) % NA, c = a + NA, d = b + NA;
    if (i % 2 === 0) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R + 5);
  return g;
}

// ---------------------------------------------------------------- the sea: one shader, mat or open water
const SEA_VERT = /* glsl */`
${SWELL_GLSL}
uniform vec2 uHerd;
varying vec2 vRest; varying vec3 vPosL; varying vec2 vGrad; varying vec2 vCrest;
#include <fog_pars_vertex>
void main(){
  vec2 ps = position.xz + uHerd;                      // sea space = local + the herd's travel (the piece rides with its herd)
  vec2 g; float c; vec3 d = swellAt(ps, g, c);
  vec3 p = position + d;
  vRest = ps; vPosL = vec3(ps.x, 0., ps.y) + d; vGrad = g; vCrest = vec2(c, shelfK(ps));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SEA_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCamL, uSunDir, uSunCol, uSkyZen, uSkyHor;
uniform vec4 uSw1; uniform vec2 uHerd;
uniform vec3 uEmerald, uRust, uLime, uTea, uGold;
uniform sampler2D uLaneTex; uniform vec4 uLaneRect;
uniform sampler2D uShadowTex; uniform vec4 uShadowRect;
uniform vec4 uFan; uniform vec2 uFanAxis; uniform vec4 uTears[8]; uniform vec4 uRain, uRustAt; uniform vec2 uSeason, uSeed;
uniform vec4 uRefl[8];        // trunks that lay a reflection on open water: x, z, radius at the water, height
uniform vec4 uLeads, uPools[6], uRing; uniform vec3 uRingCol;   // uRing: the exit ring's x, z, radius, centre height: its glow lies on the water   // floes: x width gain (m), y share of the sea that stays closed lawn, z floe size (m), w crest opening; pools: x, z, radius, raggedness
uniform vec4 uLead, uLeadB, uLoose, uLogA, uGrove; uniform vec2 uLogB;   // (polish k1) uLogA: the drifting trunk's x, z and unit axis; uLogB: its half length and radius (radius < 0 = none); uGrove: x, z, radius, gain of the drowned forest, whose water mirrors trunks and crowns
   // uLoose: where the world wants the mat worked loose (x, z, radius, gain): wide glinting cracks between the rafts   // the rare lead: start x, z, unit dir x, z; half width, open from, open to (metres along)
varying vec2 vRest; varying vec3 vPosL; varying vec2 vGrad; varying vec2 vCrest;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SHADE_GLSL}
// nearest feature point of a jittered grid: x = distance (0..~0.7 cells), y = that cell's hash
vec2 cellN(vec2 q){ vec2 i = floor(q), f = fract(q); float d = 9., h = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + hash22(i + o) - f; float dd = dot(r, r); if (dd < d) { d = dd; h = hash21(i + o + 3.7); } }
  return vec2(sqrt(d), h); }
// distance to the nearest cell BORDER of a jittered grid (0 on the border, ~0.5 at a cell's heart), in cells
float cellE(vec2 q){ vec2 i = floor(q), f = fract(q); float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + hash22(i + o) - f; float dd = dot(r, r);
    if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
  return 0.5 * (sqrt(d2) - sqrt(d1)); }
// the cell a point lies in: x = its hash, yz = its feature point (in cells): one tone, one colour per floe
vec3 cellF(vec2 q){ vec2 i = floor(q), f = fract(q); float d = 9.; vec3 r3 = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 hp = o + hash22(i + o); vec2 r = hp - f; float dd = dot(r, r);
    if (dd < d) { d = dd; r3 = vec3(hash21(i + o + 3.7), i + hp); } }
  return r3; }
// the clump a point lies in: xy = vector to its heart (in cells, |xy| up to ~0.7), z = its hash
vec3 cellV(vec2 q){ vec2 i = floor(q), f = fract(q); float d = 9.; vec3 r3 = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + hash22(i + o) - f; float dd = dot(r, r);
    if (dd < d) { d = dd; r3 = vec3(r, hash21(i + o + 3.7)); } }
  return r3; }
float coins(vec2 p, float cell, float k, float seed){
  vec2 q = p / cell, id = floor(q), f = fract(q);
  vec2 h = hash22(id + seed);
  float life = fract(uTime / 2.2 + h.x * 7.);
  float on = step(h.y, k);
  vec2 c = 0.3 + 0.4 * hash22(id + seed + floor(uTime / 2.2 + h.x * 7.) * 3.1);
  float r = cell * (0.16 + 0.14 * h.y / max(k, 0.05)) * (1. - life * life) * smoothstep(0., 0.05, life);
  return (r - length(f - c) * cell) * on - (1. - on);
}
float sparkle(vec2 p, float cs, float px, float dens){
  vec2 q = p / cs, id = floor(q), f = fract(q) - 0.5;
  vec2 h = hash22(id);
  float on = step(1. - dens, h.x);
  float tw = 0.5 + 0.5 * sin(uTime * (2.5 + 3.5 * h.y) + h.x * 60.);
  tw = tw * tw; tw = tw * tw;
  vec2 c = (hash22(id + 3.3) - 0.5) * 0.5;
  float r = max(0.16, px / cs * 0.9);
  return on * tw * smoothstep(r, r * 0.35, length(f - c)) * min(1., 0.16 / r) * min(1., 0.16 / r) * 6.;
}
void main(){
  vec2 p = vRest;
  vec3 toCam = uCamL - vPosL; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  vec2 ddx = dFdx(p), ddy = dFdy(p);
  float px = max(length(abs(ddx) + abs(ddy)), 1e-4);       // metres of sea per pixel (long axis)
  float pxA = sqrt(max(abs(ddx.x * ddy.y - ddx.y * ddy.x), 1e-8));   // and by footprint area
  float pg = pow(px, 0.45) * pow(pxA, 0.55);                 // what the grain fades on: between the long axis and the area, so the lawn keeps its grain at grazing angles
  // ---- open-water field f (metres, > 0 is water)
  float n1 = fbm3(p * 0.9), n2 = vnoise(p * 5.3), n3 = fbm3(p * 0.21 + 31.);
  float rag = (n1 - 0.5) * 1.5 + (n2 - 0.5) * 0.35;
  vec2 luv = (p - uHerd - uLaneRect.xy) * uLaneRect.zw;
  vec4 lt = texture2D(uLaneTex, clamp(luv, 0., 1.));
  float inside = step(0., luv.x) * step(luv.x, 1.) * step(0., luv.y) * step(luv.y, 1.);
  float lat = lt.r * 4., back = lt.g * 40., lw = max(lt.b, 0.2);
  float age = back / 30.;
  float wob = fbm3(p * vec2(0.9, 0.23) + 40.);                      // streaks along the lane: pinches and bellies
  // one lane about the animal's own width at its chest (2.5 m), tight where the mat is being pushed aside, raggeder and narrower as it heals
  float halfW = 1.2 * (1. - smoothstep(0.08, 1., age) * 0.85) * (0.72 + 0.56 * wob) + 0.3 * (n3 - 0.5);
  float fLane = (halfW - lat + rag * (0.3 + 1.2 * age) + (vnoise(p * vec2(1.9, 0.6) + 21.) - 0.5) * (0.4 + 0.6 * age) - smoothstep(0.7, 1.12, age) * 2.4) * lw;
  float bow = (1. - smoothstep(0.0, 0.1, age)) * inside * smoothstep(-0.75, -0.3, fLane) * step(0.6, lw);     // fern bunched up at the chest and shoulders
  fLane = min(fLane, (fbm3(p * 0.75 + 70.) - 0.02 - 0.62 * age * age) * 2.5 + 0.9 * (1. - smoothstep(0., 0.12, age)));   // rafts left in the lane, more as it heals
  fLane = max(fLane, (1.75 - lat * 0.95 - max(back - 3.0, 0.) * 0.9 + rag * 0.7) * step(0.6, lw));      // (polish 2) the wallow each wader stands in: open water all round its legs
  fLane = mix(-3., fLane, inside);
  float f = fLane;
  // the river's fan: ragged edge, torn rafts drifting in it
  float fanE = abs(dot(p - uFan.xy, vec2(-uFanAxis.y, uFanAxis.x)));                                  // metres off the fan's axis (the world's entry line), if it gives one
  float dF = uFan.z - length(p - uFan.xy) + (fbm3(p * 0.045 + 5.) - 0.5) * 10. * mix(1., smoothstep(5., 18., fanE), step(0.5, dot(uFanAxis, uFanAxis))) + rag * 1.1;
  float raft = min((0.5 - fbm3(p * 0.16 + 9.)) * 9. + dF * 0.2, (0.36 - fbm3(p * 0.53 + 3.)) * 3. + 0.5 + dF * 0.05);   // (polish 4) torn rafts adrift in the fan, large and small
  f = max(f, min(dF, raft));
  // (polish 1) THE MAT IS FLOES: the swell works the lawn into rafts ten to forty metres across with leads of open water between
  // them, wide where a low-frequency field says the mat is loose and shut where it is tight; every lead opens a little on the
  // crest and closes in the trough. Open water shows wherever we look, so the lawn reads as what it is: a floating skin on a sea.
  vec2 pw = p + (vec2(vnoise(p * 0.11 + 3.), vnoise(p * 0.11 + 17.)) - 0.5) * 4.5 + (vec2(n1, fbm3(p * 0.9 + 50.)) - 0.5) * 1.2;
  float loose = fbm3((p + uSeed) * 0.012 + 5.) - uLeads.y + 0.12 * (n3 - 0.5);
  float lwid = (0.42 + clamp(loose * 4.5, -0.62, 0.62)) * uLeads.x + uLeads.w * vCrest.x * clamp(vCrest.y, 0., 1.2);
  float e1 = cellE(pw / uLeads.z) * uLeads.z, e2 = cellE(pw / (uLeads.z * 0.31) + 9.) * uLeads.z * 0.31;
  float fFloe = max(lwid - e1, lwid * 0.26 - 0.1 - e2) + rag * 0.5;
  fFloe = min(fFloe, (fbm3(p * 0.6 + 23.) - 0.3) * 3. + 0.8);                       // crumbs of fern adrift in the leads
  f = max(f, fFloe);
  float dPool = -1000.;
  { float pn = (fbm3(p * 0.05 + 15.) - 0.5), dP = -1000.;                                                 // pools the world asks for (the drowned forest's floor, a wallow)
    float dS = -1000.;                                                                                      // (polish 4) a wallow (a pool under 8 m) is all open water: no raft closes it over the animal's legs
    for (int i = 0; i < 6; i++) { vec4 pl = uPools[i]; float dd = pl.z - length(p - pl.xy) + pn * pl.w + rag * 1.1; if (pl.z < 8.) dS = max(dS, dd); else dP = max(dP, dd); }
    float raft2 = (0.6 - fbm3(p * 0.19 + 29.)) * 8.;
    f = max(f, max(min(dP, raft2 + dP * 0.15), dS)); dPool = dP; }
  float crack = 0.;
  // analytic tears and rain coins
  for (int i = 0; i < 8; i++) { vec4 t = uTears[i]; f = max(f, t.z - length(p - t.xy) + (rag * 0.95 + (n2 - 0.5) * 0.5) * min(1., t.z)); }
  { vec2 lp = p - uLead.xy; float la = dot(lp, uLead.zw), lc = abs(lp.x * uLead.w - lp.y * uLead.z);
    float fl = min(uLeadB.x - lc + rag * 1.6 + (fbm3(p * 0.05 + 3.) - 0.5) * 7., min(la - uLeadB.y, uLeadB.z - la) * 0.4 + rag);
    f = max(f, fl); }
  // (polish 4) HAIR CRACKS: the lawn is a skin of rafts a few metres across lying edge to edge; between them the swell works open thin
  // cracks of tea-black water that glint, wider on each crest and where the mat is loose, shut where it is tight. A floating skin.
  // (polish k1) THE SWELL'S LIGHT AND SHADE AT A STRIDE'S SCALE. The cross-chop and a shorter wind sea ride the carpet in long low ridges that wander and
  // fork (shading only: the surface is not moved), travelling slowly; hair cracks open along each ridge's back and shut in its trough.
  vec2 wd1 = vec2(-0.834, -0.552), wd2 = vec2(-0.349, -0.937);
  float wph1 = dot(p, wd1) * 0.84 - uTime * 0.9 + 5. * vnoise(p * 0.045 + 3.) + 1.6 * n1, wph2 = dot(p, wd2) * 1.9 - uTime * 1.5 + 4. * vnoise(p * 0.09 + 21.);
  float wamp = 0.5 + 0.9 * vnoise(p * 0.03 + 9.), ridgeH = (sin(wph1) * 0.62 + sin(wph2) * 0.38) * wamp;
  float e3 = cellE(pw / 4.7 + 4.) * 4.7;
  float lk = uLoose.w * (1. - smoothstep(uLoose.z * 0.4, uLoose.z, length(p - uLoose.xy)));
  float cw = (0.03 + 0.09 * smoothstep(0.4, 0.75, fbm3(p * 0.06 + 12.)) + 0.05 * clamp(vCrest.x, 0., 1.) + 0.2 * lk) * max(smoothstep(0.36, 0.62, vnoise(p * 0.23 + 3.)), lk);
  cw += 0.07 * smoothstep(0.3, 0.9, ridgeH) * smoothstep(0.3, 0.6, vnoise(p * 0.5 + 8.));
  float fCrack = cw - e3 + (n2 - 0.5) * 0.05 + (n1 - 0.5) * 0.06 - max(px - 2.5 * cw, 0.);
  float fNoCrack = f; f = max(f, fCrack);
  float crackK = step(fNoCrack, fCrack) * step(fNoCrack, -0.02);                 // this open water is a hair crack
  float rk = uRain.w * (1. - smoothstep(uRain.z * 0.6, uRain.z, length(p - uRain.xy)));
  vec2 pr = vec2(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y);
  float rc = max(max(coins(p, 0.31, rk, 1.7), coins(pr + 0.37, 0.47, rk * 0.8, 9.2)), coins(pr.yx * 1.13 + 5.1, 0.23, rk * 0.6, 4.4));
  float fMain = f;
  f = max(f, rc);
  float water = max(smoothstep(-px, px, f), max(crack, step(px, 0.25) * 0. + smoothstep(-px, px, rc) * clamp(0.12 / px, 0., 1.)));
  // ---- shared light
  vec3 N = normalize(vec3(-vGrad.x, 1., -vGrad.y));
  float h = vPosL.y;
  vec2 suv = (p - normalize(uSunDir.xz + vec2(1e-4)) * (-8. * h) - uShadowRect.xy) * uShadowRect.zw;
  float bar = texture2D(uShadowTex, suv).r;
  { vec2 sdn = normalize(uSunDir.xz + vec2(1e-4)); vec2 sp = vec2(dot(p, sdn), p.x * sdn.y - p.y * sdn.x);      // (polish 4) crowns are not walls: the low sun comes through them in long slots of light
    bar = mix(bar, 1., 0.9 * smoothstep(0.46, 0.66, 0.6 * vnoise(sp * vec2(0.035, 0.42) + 3.) + 0.4 * vnoise(sp * vec2(0.09, 1.1) + 11.))); }
  float sun = (1. - lt.a * inside * 0.85 * (1. - 0.8 * water)) * bar * (1. - castShade(p, normalize(uSunDir.xz + vec2(1e-4))) * (1. - 0.6 * water));      // (polish 3) an animal's shadow lies on the mat, not as a hard band on open water
  // ---- the mat
  // (polish 4) A QUILT WITH FORM, locked to the sea at three scales (a clump of rosettes 5 cm across, a pad a hand and a half across, a
  // cushion as long as a stride). Each clump is a low dome with its own tone, a lit shoulder toward the low sun, a shaded one away
  // and a dark crease against its neighbours: crisp edges at every distance, where there was a soft mottle that read as blur.
  float dirK = clamp((uSunCol.r - 0.6) / 1.2, 0.3, 1.);            // under a pewter sky the light has little direction
  vec2 sd2 = normalize(uSunDir.xz + vec2(1e-4));
  float rake = clamp(0.3 / max(uSunDir.y, 0.08), 0.5, 2.6) * dirK;
  // THE NAP: clumps three to six pixels across at every distance (never smaller than a rosette), cross-faded octave to octave, so the
  // carpet is fine-grained from one metre and from two hundred; never a cobble, never a pad
  float nl = log2(max(pg, 0.0035) * 3.2 / 0.02), n0 = floor(nl), nf = nl - n0, s0 = 0.02 * exp2(n0);
  vec3 c1 = cellV(p / s0), c2 = cellV(p / (2. * s0) + 5.), c3 = cellV(p * 1.31 + 9.);
  float napK = 1. - smoothstep(0.5, 2.5, pg);                              // beyond a couple of hundred metres the nap is haze
  float w1 = (1. - nf) * napK, w2 = nf * napK, w3 = 1. - smoothstep(0.16, 0.5, pg * 1.31);
  float ln1 = length(c1.xy), ln2 = length(c2.xy), ln3 = length(c3.xy);
  // RUST IN DRIFTS AND WINDROWS: sun-reddened fern lies in broad drifts whose edges the wind has combed out into long streaks; every
  // boundary is frayed pad by pad (never a blur, never a ruled edge)
  vec2 wdir = vec2(0.8, 0.6), pwr = vec2(dot(p + uSeed, wdir), dot(p + uSeed, vec2(-wdir.y, wdir.x)));
  float drift = fbm3((p + uSeed) * 0.0062 + 11.), wrow = fbm3(pwr * vec2(0.011, 0.075) + 2.), wfine = fbm3(pwr * vec2(0.06, 0.52) + 7.);
  float rustN = 0.34 * drift + 0.44 * wrow + 0.22 * wfine - (0.16 + 0.2 * uSeason.y) * (1. - bar)      // fern reddens in strong light: in the trees' shade it stays green
    + uRustAt.w * (1. - smoothstep(uRustAt.z * 0.45, uRustAt.z, length(p - uRustAt.xy)));      // the world may ask for a rust patch somewhere
  float fray = (n1 - 0.5) * 0.06 + (c3.z - 0.5) * 0.1 * w3 + (vnoise(p * 6.1 + 2.) - 0.5) * 0.07 * (1. - smoothstep(0.1, 0.4, pg));
  float rustK = smoothstep(uSeason.x - 0.02, uSeason.x + 0.02, rustN + fray);
  float rustE = smoothstep(0.07, 0.0, abs(rustN + fray - uSeason.x));                         // the mixed fringe where red and green rosettes mingle
  vec3 green = mix(uEmerald * vec3(0.72, 0.8, 0.9), uLime * 0.74, smoothstep(0.5, 0.78, wfine) * 0.4 + smoothstep(0.52, 0.8, drift) * 0.25);   // older deep emerald, younger lime in streaks down the wind
  vec3 base = mix(green, mix(uRust, uEmerald * 0.6, 0.3) * vec3(0.66, 0.92, 1.0), rustK * (0.8 + 0.2 * n2));
  base = mix(base, mix(uLime, uRust, 0.55) * 0.72, rustE * 0.4);
  base *= (1. + (wrow - 0.5) * 0.5) * (0.94 + 0.12 * n1) * (0.86 + 0.28 * fbm3(p * 0.031 + 40.));
  // the 2 cm rosettes themselves, only where they resolve
  float qf = 1. - smoothstep(0.004, 0.014, px), cf = 1. - smoothstep(0.03, 0.09, px);
  vec2 q = p * 46., qi = floor(q), qfr = fract(q); float dq = 9.;
  if (qf > 0.001) {
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)); vec2 c = o + hash22(qi + o) - qfr; dq = min(dq, dot(c, c)); }
  } else dq = 0.2;
  base *= mix(1., 1.25 - 1.1 * sqrt(dq), qf * 0.5);
  float grain = (vnoise(p * 9.1 + 4.) - 0.5) * (1. - w2) * (1. - smoothstep(0.1, 0.5, pg)) + (vnoise(p * 2.3 + 8.) - 0.5) * (1. - w3) * (1. - smoothstep(0.4, 1.6, pg));
  float tone = (1. + (c1.z - 0.5) * 0.5 * w1 + (c2.z - 0.5) * 0.5 * w2) * (1. + (c3.z - 0.5) * 0.14 * w3) * (1. + 0.3 * grain);
  float crease = smoothstep(0.36, 0.56, ln1) * w1 * 0.5 + smoothstep(0.36, 0.56, ln2) * w2 * 0.5;
  float padSeam = crease * 2.;
  float relief = -(dot(c1.xy, sd2) * w1 + dot(c2.xy, sd2) * w2) * 1.25 - dot(c3.xy, sd2) * w3 * 0.12;    // > 0 on the shoulder that faces the sun
  base *= tone * (1. - crease);
  float fleck = step(0.86, c1.z) * w1 + step(0.86, c2.z) * w2;
  base = mix(base, base * vec3(1.4, 1.14, 0.6), fleck * 0.4 * (1. - rustK));                                  // clumps of fresh yellow growth
  base = mix(base, uEmerald * 0.62, fleck * 0.6 * rustK);                                                      // green clumps surviving in the rust
  // the swell reads by light: slopes turned to the low sun are lit yellow-green, slopes turned away fall to deep emerald; and by
  // height: the low sun catches every crest's back and leaves the trough before it deep
  float swK = clamp(vCrest.y, 0., 1.5) * dirK, crH = clamp(vCrest.x, -1., 1.);
  float lit = clamp(0.5 + dot(vGrad, uSunDir.xz) * -15. * dirK / mix(1., max(vCrest.y, 0.2), 0.75) + swK * (0.4 * crH + 0.3 * smoothstep(0.8, 1., crH)), 0.14, 1.5);
  lit += dirK * 0.26 * crH * (1. - smoothstep(90., 320., dist));                                               // (polish 4) even on the damped shelf each crest's back is a band of light
  float troughK = swK * smoothstep(0.1, -0.9, crH);
  float ridgeK = 1. - smoothstep(70., 280., dist);
  float ridgeS = -(cos(wph1) * dot(wd1, sd2) * 0.62 + cos(wph2) * dot(wd2, sd2) * 0.38) * wamp;      // > 0 on the slope turned to the sun
  lit += (ridgeS * 0.34 * rake + 0.2 * ridgeH * dirK) * ridgeK;
  float seamK = (1. - smoothstep(0.0, 0.55, e3)) * (1. - smoothstep(0.25, 1.4, px));               // the mat is a skin of rafts lying edge to edge: each seam a low dark line
  float raftT = cellF(pw / 4.7 + 4.).x;
  base *= (1. + (raftT - 0.5) * 0.2 * (1. - smoothstep(0.3, 2., px))) * (1. - 0.3 * seamK);
  base = mix(base, base * vec3(1.22, 1.1, 0.72), clamp(ridgeS, 0., 1.) * 0.4 * ridgeK * dirK * (1. - rustK));      // the lit slope is yellow-green
  float det = ddx.x * ddy.y - ddx.y * ddy.x; det = (det < 0. ? -1. : 1.) * max(abs(det), 1e-9);
  float gfx = dFdx(fMain), gfy = dFdy(fMain);
  vec2 gf = vec2(gfx * ddy.y - gfy * ddx.y, gfy * ddx.x - gfx * ddy.x) / det;
  float lipSun = clamp(dot(gf, sd2) * 1.1, -1., 1.) * (1. - smoothstep(0.1, 0.4, px));   // > 0: open water lies on the sun side of this edge
  float lipK = smoothstep(-0.34, -0.05, fMain) * (1. - water);
  lit = clamp(lit + relief * 0.62 * rake + lipK * lipSun * 0.5 * rake, 0.1, 1.9);
  float rim = max(smoothstep(-0.13, -0.02, fMain) * (1. - 0.3 * step(fNoCrack, -0.4)), 0.5 * smoothstep(-0.05, -0.01, rc)) * (1. - water);
  base = mix(base, mix(uLime * 0.85, uRust * 0.85, step(0.6, vnoise(p * 0.8 + 13.))), rim * 0.55 * (1. - smoothstep(0.03, 0.2, px)));        // torn edges are lime, or rust where the sun has reddened them (polish k1: on hair cracks too)
  base = mix(base, mix(uEmerald, uLime, 0.75) * (0.62 + 0.75 * vnoise(p * 9. + 2.) * vnoise(p * 23.)), bow * 0.85);
  vec3 fill = mix(uSkyZen, vec3(1.), 0.25) * mix(0.5, 0.5, dirK) * (1. - 0.3 * troughK) * (1. - 0.35 * crease) * (1. + 0.24 * ridgeH * ridgeK);
  vec3 mat = base * (fill * mix(vec3(0.74, 1., 1.55), vec3(1.12, 1., 0.98), rustK * 0.85) + uSunCol * vec3(0.95, 1., 1.15) * (0.36 * lit * sun * mix(1., 0.76, rustK)));
  mat = mix(vec3(dot(mat, vec3(0.3, 0.6, 0.1))), mat, 0.9);
  { vec2 vxz = -V.xz / max(length(V.xz), 1e-3); float sAz = clamp(dot(vxz, sd2), 0., 1.), gz = 1. - clamp(V.y, 0., 1.);      // toward the low sun the nap is backlit: each clump's far shoulder glows through the frond
    mat += mix(uLime, vec3(1., 0.8, 0.36), 0.35) * uSunCol * (0.12 * sAz * sAz * sAz * gz * gz * gz * sun * dirK * (1. - 0.5 * padSeam) * (1. - 0.45 * rustK) * clamp(0.6 + relief * 1.6, 0., 1.6)); }
  mat *= 1. + 0.5 * rustK * (1. - dirK);                               // under a pewter sky the rust stays a warm red-brown, never a dark purple
  mat *= mix(vec3(0.66, 0.84, 0.9), vec3(1.), bar);                    // the redwoods' long bars: deep bottle green
  mat *= 1. - 0.4 * smoothstep(0.03, 0.0, abs(f + 0.02)) * (1. - smoothstep(0.02, 0.1, px));   // the dark seam under the lip
  float logD = 99., logD2 = 99.;
  { vec2 lr = p - uLogA.xy; float la2 = clamp(dot(lr, uLogA.zw), -uLogB.x, uLogB.x); logD = length(lr - uLogA.zw * la2);
    vec2 lr2 = lr + normalize(V.xz + vec2(1e-4)) * 0.9; float lb2 = clamp(dot(lr2, uLogA.zw), -uLogB.x, uLogB.x); logD2 = length(lr2 - uLogA.zw * lb2); }
  float logR = max(uLogB.y, 0.05), logOn = step(0., uLogB.y);
  mat = mix(mat, mat * 0.42, logOn * (1. - smoothstep(logR * 0.9, logR * 2.6, logD)));                                   // the trunk's contact shade on the carpet
  mat = mix(mat, mix(uEmerald, uLime, 0.7) * (0.3 + 0.5 * vnoise(p * 9. + 2.)) * (0.5 + 0.5 * sun), logOn * (1. - smoothstep(logR * 1.0, logR * 1.7, logD)) * 0.7);   // fern bunched up against its flank
  // ---- open water: tea-black, carrying the sky at grazing angles, packed with gold sparkle
  vec2 rp = p * 1.7 + uTime * vec2(0.21, -0.17);
  float rip = vnoise(rp), rip2 = vnoise(rp * 3.3 + 7.7 + uTime * vec2(-0.3, 0.2));
  vec3 Nw = normalize(N + vec3(rip - 0.5, 0., vnoise(rp + 7.7) - 0.5) * 0.07 + vec3(rip2 - 0.5, 0., vnoise(rp * 3.3 - 4.1) - 0.5) * 0.025 * (1. - smoothstep(0.05, 0.4, px)));
  float nv = clamp(dot(Nw, V), 0., 1.);
  float fres = 0.06 + 0.94 * (1. - nv) * (1. - nv) * (1. - nv) * mix(0.7, 1., 1. - nv);                // (polish 2) the water carries sky at every angle: never a black cutout
  vec3 R = reflect(-V, Nw); R.y = abs(R.y);
  float edge = mix(smoothstep(0., 0.16 + px, f), 0.08 + 0.6 * lk, crackK);                    // the mat's thickness shades its own rim
  // (polish 1) Open water is a MIRROR at grazing angles: it carries the sky (cream and gold toward the low sun, aqua away from it),
  // tea-black only where we look down into it; cat's-paws of wind and the nearest trunks' reflections break the mirror.
  float sunAz = max(dot(normalize(R.xz + vec2(1e-4)), normalize(uSunDir.xz + vec2(1e-4))), 0.); sunAz *= sunAz; sunAz *= sunAz;
  vec3 skyC = mix(mix(uSkyHor, uSkyZen, 0.72) * 0.46, uSkyZen * 0.36, smoothstep(0.02, 0.4, R.y)) + uSunCol * vec3(1., 0.8, 0.5) * (0.3 * sunAz * sunAz * (1. - smoothstep(0., 0.3, R.y)));   // (polish 3) tea-dark water carries a DEEP sky; only the sun's own path is bright
  float farK = smoothstep(12., 70., dist);
  float smear = 0., smearG = 0.;                              // reflections of the nearest trunks, laid toward the eye
  vec2 rw = vec2(vnoise(p * 2.3 + uTime * 0.5) - 0.5, vnoise(p * 2.3 + 9. - uTime * 0.4) - 0.5) * 0.5;      // ripples break the mirror
  for (int i = 0; i < 8; i++) { vec4 tr = uRefl[i]; vec2 tv = uCamL.xz - tr.xy; float D = max(length(tv), 1e-3); vec2 td = tv / D;
    vec2 rel = p - tr.xy + rw; float al = dot(rel, td), ac = abs(rel.x * td.y - rel.y * td.x);
    float hgt = al * uCamL.y / max(D - al, 0.5);               // the height on the tree that this point of water mirrors
    float crown = step(6., hgt) * 2.4 * max(1. - hgt / max(tr.w, 1.), 0.);
    float pr = max(1. - al / D, 0.05), w = (tr.z * (0.35 + 0.65 / (1. + hgt * 0.45)) + crown) * pr;
    // (polish k1) THE MIRROR IS RIPPLED: a bole's reflection is whole at its foot and, the higher up the trunk it mirrors, the more it slips sideways
    // ripple by ripple and breaks into dashes with sky between them (as the ring's own light does). Never a straight bar across the water.
    float hk = smoothstep(1.5, 11., hgt), sl = rel.x * td.y - rel.y * td.x;
    float q1 = vnoise(vec2(al * 1.25 - uTime * 0.7 + tr.x, sl * 0.3 + 3.)), q2 = vnoise(vec2(al * 3.6 + uTime * 0.9, sl * 0.7 + tr.y));
    ac = abs(sl + ((q1 - 0.5) * 2.2 + (q2 - 0.5) * 0.9) * pr * (0.12 + 0.88 * hk));
    float dashT = mix(1., smoothstep(0.3, 0.6, 0.6 * q1 + 0.4 * q2) * (0.5 + 0.5 * smoothstep(0.3, 0.7, vnoise(vec2(al * 7.1 - uTime * 1.7, sl * 1.1)))), 0.2 + 0.8 * hk);
    float sm = smoothstep(w, w * mix(0.6, 0.2, hk), ac) * step(0., al) * step(hgt, tr.w) * (1. - smoothstep(22., 34., D)) * dashT * (1. - 0.4 * smoothstep(0.3, 0.95, hgt / max(tr.w, 1.)));
    if (sm > smear) { smear = sm; smearG = step(7.5, hgt); } }
  float ringK = 0.;
  { vec2 tv = uCamL.xz - uRing.xy; float D = max(length(tv), 1e-3); vec2 td = tv / D; vec2 rel = p - uRing.xy + rw * 1.6;
    float al = dot(rel, td), ac = abs(rel.x * td.y - rel.y * td.x), hg = al * uCamL.y / max(D - al, 0.5), hh = clamp((hg - uRing.w) / max(uRing.z, 1e-3), -1., 1.);
    // (polish f3) THE RING'S LIGHT ON RIPPLED WATER: never a mirror image with edges. A soft column of glow under the ring, stretched
    // toward the eye well past the mirrored disc, broken into dashes that lie along the ripples and slip sideways with them.
    float persp = max(1. - al / D, 0.05), hn = clamp((hg - uRing.w) / max(uRing.z, 1e-3), -6., 6.);   // -1 foot of the ring .. 1 its top (mirrored), beyond: the stretch
    float rr1 = vnoise(vec2(al * 1.15 - uTime * 0.7, ac * 0.22 + 3.)), rr2 = vnoise(vec2(al * 3.4 + uTime * 0.9, ac * 0.5 + 11.));
    float slip = ((rr1 - 0.5) * 3.2 + (rr2 - 0.5) * 1.3) * persp * (0.35 + 0.65 * smoothstep(-1., 1.5, hn));
    float wr = uRing.z * (0.5 + 0.45 * sqrt(max(1. - hh * hh, 0.))) * persp, xr = (ac + abs(slip)) / max(wr, 1e-3);
    float colK = exp(-min(xr * xr * 1.7, 30.));                                                       // soft across: no side to it
    float lenK = smoothstep(-1.5, -0.45, hn) * (1. - smoothstep(0.5, 3.4, hn));                       // soft along: fades in at the foot, dies away toward the eye
    float dash = smoothstep(0.34, 0.66, 0.6 * rr1 + 0.4 * rr2) * (0.55 + 0.45 * smoothstep(0.3, 0.7, vnoise(vec2(al * 7.3 - uTime * 1.9, ac * 0.9))));
    ringK = colK * lenK * step(0., al) * (1. - smoothstep(110., 170., D)) * (0.16 + 0.84 * dash) * mix(1.15, 0.7, smoothstep(0.5, 3., hn)); }
  float paw = smoothstep(0.5, 0.6, fbm3(p * vec2(1.3, 0.22) + uTime * vec2(0.05, 0.02))) * (0.55 + 0.6 * vnoise(p * vec2(7.1, 2.3) + uTime * vec2(0.9, 0.4)));          // cat's-paws: ruffled water is darker, flat water brighter (polish k1: each has an edge and a ruffle inside; a soft blotch read as smear)
  vec2 sv = p - uCamL.xz; float su = length(sv); vec2 sn = sv / max(su, 1e-3);
  float streak = vnoise(vec2(su * 1.9 - uTime * 0.6, (sn.x * 37. + sn.y * 11.) * 0.9) + rw * 2.) * 0.6 + vnoise(vec2(su * 5.1 + uTime * 0.9, (sn.x * 11. - sn.y * 37.) * 1.7)) * 0.4;   // wavelets lie across the line of sight: bright sky and dark tea in thin bands
  float nearW = 1. - smoothstep(0.04, 0.2, px);                                                                              // (polish k1) close to, the water has wavelets a hand long: thin crisp dashes of sky on tea
  float wl1 = vnoise(vec2(su * 3.4 - uTime * 1.2, sn.x * 21. + sn.y * 8.) + rw * 2.), wl2 = vnoise(vec2(su * 8.3 + uTime * 1.9, sn.x * 9. - sn.y * 43.) + 5.);
  float wavelet = smoothstep(0.5, 0.62, 0.6 * wl1 + 0.4 * wl2) - 0.6 * smoothstep(0.42, 0.3, 0.6 * wl1 + 0.4 * wl2);
  float mir = clamp(fres * mix(0.84, 1.18, smoothstep(0.2, 0.8, streak)) * (1. + 0.55 * wavelet * nearW), 0., 0.62) * mix(1., 0.72, paw) * (0.86 + 0.28 * rip) * mix(0.35, 1., edge);
  // every wader stands IN the water: its dark reflection lies on it toward the eye, and rings run out from its chest and flanks
  vec2 Vn = normalize(V.xz + vec2(1e-4));
  vec4 l2 = texture2D(uLaneTex, clamp(luv - Vn * 0.8 * uLaneRect.zw, 0., 1.)), l3 = texture2D(uLaneTex, clamp(luv - Vn * 1.7 * uLaneRect.zw, 0., 1.));
  float body = inside * max(smoothstep(0.95, 0.4, l2.r * 4.) * step(l2.g * 40., 3.1), 0.7 * smoothstep(0.8, 0.3, l3.r * 4.) * step(l3.g * 40., 3.1));
  float wake = inside * smoothstep(5., 0.5, back) * smoothstep(2.0, 0.7, lat);
  float churn = inside * smoothstep(1.25, 0.3, lat) * step(back, 3.3) * step(0.25, back) * step(0.6, lw);
  mir *= (1. - 0.3 * body) * (1. + 0.45 * wake * sin(lat * 11. - uTime * 3.5 + back * 2.));
  float fringe = (1. - smoothstep(0.0, 0.11 + 0.12 * n2, f)) * (0.55 + 0.45 * n1) * (1. - 0.85 * crackK);      // (polish k1) a hand's width (it was a soft halo half a metre wide: \"smeared water\")              // fern hanging under the lip, fading into the deep
  vec3 deep = mix(uTea * 1.4 + vec3(0.012, 0.012, 0.011) * (0.4 + 0.6 * sun), mix(uEmerald, uLime, 0.45) * mix(vec3(1.), vec3(1.5, 0.62, 0.42), rustK) * (0.2 + 0.16 * sun), fringe * 0.8);
  vec3 wat = deep * (1. - 0.75 * mir) + skyC * mir;
  wat *= 1. - 0.5 * (1. - smoothstep(0.0, 0.38, f)) * max(-lipSun, 0.) * dirK;                   // the lip's own shadow on the water behind it
  vec3 reflC = mix(vec3(0.15, 0.085, 0.05), vec3(0.03, 0.075, 0.03), smearG) * (0.5 + 0.5 * sun);   // the trunk's own red-brown, its crown's green: mirrored where the water mirrors, sunk in tea where we look down
  wat = mix(wat, deep * (1. - 0.75 * mir) + reflC * (mir + 0.1), smear * mix(0.95, 0.8, smearG) * mix(0.4, 1., edge));
  wat = mix(wat, vec3(0.022, 0.025, 0.03) + skyC * 0.04, 0.7 * body);
  wat = mix(wat, vec3(0.05, 0.03, 0.02) * (0.5 + 0.5 * sun) + deep * 0.3, logOn * 0.8 * (1. - smoothstep(logR * 0.9, logR * 2.2, min(logD, logD2))));      // the trunk's own dark image and wet line on the water beside it
  wat += uRingCol * ringK * 0.5 * mix(0.4, 1., edge) * (1. - 0.7 * smear);
  // (polish 2) in the drowned forest the water mirrors the FOREST: dark wavering bars of trunk and crown with bright sky between them
  { vec2 vd = normalize(p - uCamL.xz + vec2(1e-4));
    float sa = vd.x * 9. + vd.y * 4.;                                                                           // (polish k1) the mirrored trunks slip sideways ripple by ripple and break into dashes: never straight bars across the ring's light
    float slipF = (vnoise(vec2(su * 1.1 - uTime * 0.6, sa)) - 0.5) * 2. + (vnoise(vec2(su * 3.3 + uTime * 0.8, sa * 2.3 + 7.)) - 0.5) * 0.9;
    float strk = smoothstep(0.4, 0.62, 0.62 * vnoise(vd * 27. + 3. + rw * 0.25 + slipF * 0.2) + 0.38 * vnoise(vd * 73. + rw * 0.7 + slipF * 0.5));
    strk *= 0.22 + 0.78 * smoothstep(0.34, 0.6, vnoise(vec2(su * 2.2 - uTime * 0.9, sa * 1.7 + 3.)));
    float forestK = max(smoothstep(-8., 6., dPool), uGrove.w * (1. - smoothstep(uGrove.z * 0.75, uGrove.z, length(p - uGrove.xy)))), canopy = smoothstep(0.1, 0.42, R.y) * 0.6;                    // overhead it is crowns the water carries, not sky
    wat = mix(wat, vec3(0.026, 0.04, 0.027) + deep * 0.55, max(strk * 0.6 * smoothstep(0.12, 0.45, mir), canopy * smoothstep(0.05, 0.3, mir)) * forestK * (1. - smear)); }
  wat += (skyC * 0.4 + uSunCol * 0.05 * sun) * churn * smoothstep(0.52, 0.8, vnoise(p * 9. + uTime * vec2(1.7, -1.3)) * 0.6 + vnoise(p * 23. - uTime * 2.1) * 0.4);   // water churned white round the legs
  float sp = pow(max(dot(R, uSunDir), 0.), 24.);
  float toSun = smoothstep(0.8, 0.995, dot(V.xz, -uSunDir.xz) / max(length(V.xz) * length(uSunDir.xz), 1e-3));   // the glitter path
  float pm = mix(pxA, px, 0.5);
  float lvl = log2(max(pm, 0.004) * 3.0 / 0.05), l0 = floor(lvl), lf = lvl - l0, cs = 0.05 * exp2(l0), dens = mix(0.01, 0.62, toSun * toSun) * (0.3 + 0.7 * smoothstep(0.3, 0.7, vnoise(p * vec2(0.5, 0.5) + uTime * vec2(0.07, -0.05)))); float laneG = inside * smoothstep(30., 2., back) * step(0.6, lw); dens = max(dens, mix(0.14, 0.55, toSun) * laneG);      // (polish 3) glitter is the sun's path, not an even speckle
  float glint = mix(sparkle(p, cs, pm, dens), sparkle(p + 13.1, cs * 2., pm, dens), lf);
  wat += uGold * vec3(1., 0.8, 0.5) * min(glint * (2.6 + 9. * sp), 6.) * sun * mix(0.15, 1., edge) * max(0.1 + 0.9 * toSun, 0.9 * laneG) * mix(1., 0.3, smoothstep(0.25, 1.6, px)) * (1. - 0.7 * smear) * (1. - 0.8 * body);
  wat += uSunCol * vec3(1., 0.74, 0.4) * (toSun * toSun * (1. - nv) * (1. - nv) * 0.13 * (0.3 + 2.2 * rip * rip2) * mix(0.3, 1., edge) * bar * (1. - 0.8 * smear) * (1. - 0.7 * body));   // the sun's road: molten toward the horizon
  vec3 col = mix(mat, wat, water);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function makeSeaMaterial(U, P, lane, o) {
  const fan = o.fan || { x: 0, z: -520, radius: 150 };
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  const sr = o.shadowRect || [0, 0, 1, 1];
  const tears = []; for (let i = 0; i < 8; i++) tears.push(new THREE.Vector4(0, 0, -1000, 0));
  const late = o.lateSeason ?? 0;
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U,
    uEmerald: { value: lin(P[0]) }, uRust: { value: lin(P[1]) }, uLime: { value: lin(P[5]) }, uTea: { value: lin(P[2]) }, uGold: { value: lin(P[3]) },
    uLaneTex: { value: lane.tex }, uLaneRect: { value: lane.rect },
    uShadowTex: { value: o.shadowTex || white }, uShadowRect: { value: new THREE.Vector4(sr[0], sr[1], 1 / Math.max(1e-3, sr[2] - sr[0]), 1 / Math.max(1e-3, sr[3] - sr[1])) },
    uFan: { value: new THREE.Vector4(fan.x, fan.z, fan.radius, 0) }, uFanAxis: { value: new THREE.Vector2(0, 0) }, uLead: { value: new THREE.Vector4(0, 0, 1, 0) }, uLoose: { value: new THREE.Vector4(0, 0, 1, 0) }, uLogA: { value: new THREE.Vector4(0, 0, 0, 1) }, uLogB: { value: new THREE.Vector2(1, -1) }, uGrove: { value: new THREE.Vector4(0, 0, 1, 0) }, uLeadB: { value: new THREE.Vector4(-1000, 0, 0, 0) }, uTears: { value: tears },
    uRefl: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, -1)) }, uRain: { value: new THREE.Vector4(60, 120, 90, 0) }, uRustAt: { value: new THREE.Vector4(0, 0, 1, 0) }, uLeads: { value: new THREE.Vector4(1.9, 0.43, 24, 0.5) }, uRing: { value: new THREE.Vector4(0, 0, -1, 0) }, uRingCol: { value: new THREE.Color(0.8, 0.95, 0.9) }, uPools: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -1000, 1)) }, uSeason: { value: new THREE.Vector2(lerp(0.54, 0.4, late), late) }, uSeed: { value: o.seedShift || new THREE.Vector2() },
  };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, fog: true, side: THREE.DoubleSide });
}

// ---------------------------------------------------------------- Palaeosyops, a hornless brontothere
// Side silhouette as shares of its 2.6 m: skull the front fifth, long, low and dished, blunt square muzzle with
// an overhanging lip; short thick level neck; low hump over the shoulders (the highest point, 1.3 m); deep barrel;
// rump a little lower; short pillar legs with elbow and hock; 25 cm tufted tail. Model space: metres, nose +Z,
// feet on y = 0. Parts (aPart.x): 0 trunk, 1 head, 2/3 ears, 4 tail, 5 FL, 6 FR, 7 HL, 8 HR, 9 tusks.
class Builder {
  constructor() { this.p = []; this.t = []; this.a = []; this.pv = []; this.idx = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, tone, part, pivot) { this.p.push(x, y, z); this.t.push(tone[0], tone[1], tone[2], tone[3]); this.a.push(part[0], part[1], part[2], part[3]); this.pv.push(pivot[0], pivot[1], pivot[2]); return this.n - 1; }
  // rings: [{ z, y, x, rx, t, b, n }] (t / b = half heights above / below y, n = superellipse exponent); axis 'z' or a frame fn
  loft(rings, sides, tone, part, pivot, frame) {
    const rows = [], start = this.n;
    for (const r of rings) {
      const row = [], e = 2 / (r.n || 2);
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * TAU, c = Math.cos(th), s = Math.sin(th);
        const lx = (r.x || 0) + r.rx * Math.sign(s) * Math.abs(s) ** e, ly = (c > 0 ? r.t : r.b) * Math.sign(c) * Math.abs(c) ** e;
        const q = frame ? frame(r, lx, ly) : [lx, r.y + ly, r.z];
        row.push(this.v(q[0], q[1], q[2], typeof tone === 'function' ? tone(q, r) : tone, typeof part === 'function' ? part(q, r) : part, pivot));
      }
      rows.push(row);
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides; this.idx.push(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j], rows[i + 1][j1], rows[i][j1]);
    }
    // caps
    for (const [row, flip] of [[rows[0], 1], [rows[rows.length - 1], 0]]) {
      let cx = 0, cy = 0, cz = 0; for (const i of row) { cx += this.p[i * 3]; cy += this.p[i * 3 + 1]; cz += this.p[i * 3 + 2]; }
      const i0 = row[0], c = this.v(cx / sides, cy / sides, cz / sides, [this.t[i0 * 4], this.t[i0 * 4 + 1], this.t[i0 * 4 + 2], this.t[i0 * 4 + 3]], [this.a[i0 * 4], this.a[i0 * 4 + 1], this.a[i0 * 4 + 2], this.a[i0 * 4 + 3]], pivot);
      for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; if (flip) this.idx.push(c, row[j], row[j1]); else this.idx.push(c, row[j1], row[j]); }
    }
    return [start, this.n];
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('aTone', new THREE.Float32BufferAttribute(this.t, 4));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.pv, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    return g;
  }
}
// Catmull-Rom through ring parameters, so a dozen authored sections become a smooth hull
function spline(rings, sub) {
  if (sub <= 1) return rings;
  const out = [], keys = Object.keys(rings[0]), N = rings.length;
  for (let i = 0; i < N - 1; i++) {
    const p0 = rings[Math.max(0, i - 1)], p1 = rings[i], p2 = rings[i + 1], p3 = rings[Math.min(N - 1, i + 2)];
    for (let s = 0; s < sub; s++) {
      const t = s / sub, t2 = t * t, t3 = t2 * t, r = {};
      for (const k of keys) r[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      r.rx = Math.max(0.004, r.rx); r.t = Math.max(0.004, r.t); r.b = Math.max(0.004, r.b);
      out.push(r);
    }
  }
  out.push(rings[N - 1]);
  return out;
}
const R = (z, y, rx, t, b, n = 2.2, x = 0) => ({ z, y, rx, t, b, n, x });
const HEAD_K = [1.22, 1.26, 1.34];             // head enlargement about the occiput: x, y, z
const HIDE = [1, 1, 1, 0];                       // aTone: rgb multiplier, a = 0 procedural hide | 1 flat colour

export function buildBrontothere(o = {}) { const it = brontoSteps(o); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the same build in short steps: the caller's yield runs between trunk, head, limbs and the final assembly (loading without stalls)
export async function buildBrontothereAsync(o = {}, yieldFn = async () => {}) { const it = brontoSteps(o); let r = it.next(); while (!r.done) { await yieldFn(); r = it.next(); } return r.value; }
function* brontoSteps(o = {}) {
  const hi = (o.detail ?? 1) >= 0.75, sub = hi ? 3 : 1, S = hi ? 16 : 10, SL = hi ? 12 : 8;
  const B = new Builder(), Z3 = [0, 0, 0];
  // ---- trunk: rump -> hip -> barrel -> shoulder hump -> neck
  // (review 2: the rump is broad, square and nearly as high as the mid-back, the hump a modest rise, so that chest-deep the
  //  animal shows a level hoofed mammal's back with hips, not a wedge)
  const trunk = spline([
    R(-1.16, 0.95, 0.08, 0.08, 0.09), R(-1.12, 0.92, 0.26, 0.27, 0.3, 2.3), R(-0.99, 0.885, 0.375, 0.352, 0.385, 2.35), R(-0.68, 0.86, 0.41, 0.395, 0.42, 2.3),
    R(-0.34, 0.84, 0.415, 0.372, 0.44, 2.25), R(0.0, 0.85, 0.405, 0.40, 0.45, 2.2), R(0.28, 0.9, 0.375, 0.505, 0.47, 2.0), R(0.47, 0.93, 0.315, 0.455, 0.44, 2.0),
    R(0.65, 0.94, 0.24, 0.315, 0.33, 2.1), R(0.8, 0.95, 0.2, 0.235, 0.25, 2.2), R(0.95, 0.955, 0.19, 0.205, 0.215, 2.2)], sub);
  const tr = B.loft(trunk, S, HIDE, (q) => [0, smoothstep(0.45, 0.95, q[2]), 0, 0], [0, 0.95, 0.5]);
  // muscle: shoulders, haunches, the swell of the belly, withers ridge
  const bumps = [[0.3, 0.86, 0.36, 0.3, 0.07], [0.3, 0.6, 0.32, 0.22, 0.05], [0.24, 0.92, -0.7, 0.32, 0.06], [0.26, 0.62, -0.62, 0.24, 0.05]];
  const hips = [[0.27, 1.22, -0.7, 0.15, 0.062], [0.2, 1.33, 0.36, 0.17, 0.04], [0.0, 1.22, -1.07, 0.12, 0.035]];   // hip points, shoulder blade tops, tail root: pushed UP
  for (let i = tr[0]; i < tr[1]; i++) {
    const x = B.p[i * 3], y = B.p[i * 3 + 1], z = B.p[i * 3 + 2], sx = x < 0 ? -1 : 1;
    let push = 0;
    for (const b of bumps) { const d2 = (Math.abs(x) - b[0]) ** 2 + (y - b[1]) ** 2 + (z - b[2]) ** 2; push += b[4] * Math.exp(-d2 / (b[3] * b[3])); }
    B.p[i * 3] = x + sx * push * smoothstep(0.02, 0.15, Math.abs(x));
    if (y > 0.95) { let up = 0; for (const b of hips) { const d2 = (Math.abs(x) - b[0]) ** 2 + (y - b[1]) ** 2 + (z - b[2]) ** 2; up += b[4] * Math.exp(-d2 / (b[3] * b[3])); }
      up -= 0.022 * Math.exp(-(x * x) / 0.0036) * smoothstep(0.1, -0.1, z) * smoothstep(-1.0, -0.8, z);          // the spine furrow between the loin muscles
      B.p[i * 3 + 1] = y + up; }
    // a shallow spine furrow behind the hump and neck creases (rings of skin) at the throat-latch
    if (z > 0.52 && z < 0.9) { const k = 1 - 0.075 * (0.5 + 0.5 * Math.sin((z - 0.52) * 46)) * smoothstep(0.52, 0.6, z) * (1 - smoothstep(0.82, 0.9, z)); B.p[i * 3] = B.p[i * 3] * k; B.p[i * 3 + 1] = 0.92 + (B.p[i * 3 + 1] - 0.92) * k; }
  }
  yield;
  // ---- head: long, low, dished; the cranium rises behind the eye, the nasals lift a little, square muzzle
  const HP = [0, 0.97, 0.86];                    // head pivot (occiput)
  const headStart = B.n;
  const head = spline([
    R(0.86, 0.95, 0.17, 0.19, 0.2), R(0.98, 0.965, 0.178, 0.185, 0.2, 2.3), R(1.1, 0.955, 0.165, 0.15, 0.2, 2.4), R(1.21, 0.935, 0.14, 0.118, 0.185, 2.5),
    R(1.31, 0.915, 0.122, 0.105, 0.165, 2.7), R(1.4, 0.905, 0.118, 0.108, 0.145, 3.0), R(1.47, 0.895, 0.118, 0.105, 0.125, 3.4), R(1.515, 0.885, 0.108, 0.09, 0.105, 3.4), R(1.535, 0.875, 0.07, 0.055, 0.07, 3.0)], sub);
  B.loft(head, hi ? 16 : 9, (q) => {
    // mouth line and the pale lower lip are painted in the shader from model position; nostrils here
    return HIDE;
  }, [1, 1, 0, 0], HP);
  // overhanging upper lip: a thick pad drooping over the front of the mouth
  B.loft(spline([R(1.4, 0.86, 0.105, 0.05, 0.035, 3), R(1.47, 0.845, 0.118, 0.06, 0.05, 3), R(1.53, 0.835, 0.108, 0.06, 0.055, 3), R(1.56, 0.83, 0.06, 0.035, 0.035, 2.6)], hi ? 2 : 1), hi ? 12 : 7, [0.86, 0.84, 0.86, 0], [1, 1, 0, 0], HP);
  // cheek / jaw muscle and brow, as low mounds
  for (const sx of [-1, 1]) {
    B.loft(spline([R(0.95, 0.86, 0.02, 0.05, 0.05, 2, sx * 0.13), R(1.03, 0.85, 0.05, 0.1, 0.1, 2, sx * 0.135), R(1.13, 0.84, 0.045, 0.085, 0.08, 2, sx * 0.125), R(1.2, 0.84, 0.015, 0.03, 0.03, 2, sx * 0.115)], hi ? 2 : 1), hi ? 8 : 5, HIDE, [1, 1, 0, 0], HP);
    // eye: small, far forward, dark with one bright highlight; a brow over it
    const ez = 1.235, ey = 0.985, ex = sx * 0.118;
    B.loft([R(ez - 0.03, ey, 0.004, 0.006, 0.006, 2, ex), R(ez - 0.018, ey, 0.014, 0.022, 0.022, 2, ex + sx * 0.008), R(ez, ey, 0.018, 0.027, 0.027, 2, ex + sx * 0.012), R(ez + 0.018, ey, 0.014, 0.022, 0.022, 2, ex + sx * 0.008), R(ez + 0.03, ey, 0.004, 0.006, 0.006, 2, ex)], 6, [0.02, 0.017, 0.015, 1], [1, 1, 0, 0], HP);
    B.loft([R(ez + 0.002, ey + 0.012, 0.004, 0.005, 0.005, 2, ex + sx * 0.027), R(ez + 0.01, ey + 0.012, 0.004, 0.005, 0.005, 2, ex + sx * 0.027)], 4, [3.2, 3.0, 2.6, 1], [1, 1, 0, 0], HP);
    B.loft(spline([R(ez - 0.07, ey + 0.035, 0.01, 0.012, 0.012, 2, sx * 0.11), R(ez - 0.01, ey + 0.04, 0.022, 0.02, 0.016, 2, sx * 0.115), R(ez + 0.06, ey + 0.02, 0.01, 0.012, 0.012, 2, sx * 0.105)], 2), 6, [0.8, 0.8, 0.8, 0], [1, 1, 0, 0], HP);
    // nostril
    B.loft([R(1.5, 0.925, 0.004, 0.004, 0.004, 2, sx * 0.06), R(1.515, 0.92, 0.02, 0.014, 0.014, 2, sx * 0.062), R(1.535, 0.915, 0.012, 0.01, 0.01, 2, sx * 0.058)], 6, [0.03, 0.025, 0.025, 1], [1, 1, 0, 0], HP);
    // round ear set far back: a cupped disc on a short stalk, flicking about its base
    const eb = [sx * 0.135, 1.09, 0.93], erow = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5, w = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7 * 0.074 + 0.012; erow.push({ z: 0, y: 0, rx: w, t: 0.016, b: 0.016, n: 2, u: t }); }
    B.loft(erow, hi ? 8 : 5, (q, r) => (r.u > 0.3 ? [0.62, 0.6, 0.62, 0] : HIDE), [sx < 0 ? 2 : 3, 1, 0, 0], eb,
      (r, lx, ly) => { const up = r.u * 0.185, cup = ly * 1 - Math.abs(lx) * 0.35; return [eb[0] + sx * (up * 0.5 + cup * 0.6) + lx * 0.25, eb[1] + up * 0.86 + ly * 0.2, eb[2] - up * 0.12 + lx * 0.95 * sx + cup * 0.3]; });
    // bull's blunt canine tusk at the mouth corner (collapsed in the shader on cows and calves)
    const tb = [sx * 0.105, 0.845, 1.4];
    B.loft([{ u: 0, rx: 0.017, t: 0.017, b: 0.017, n: 2 }, { u: 0.5, rx: 0.015, t: 0.015, b: 0.015, n: 2 }, { u: 0.85, rx: 0.01, t: 0.01, b: 0.01, n: 2 }, { u: 1, rx: 0.004, t: 0.004, b: 0.004, n: 2 }], 6, [0.82, 0.76, 0.6, 1], [9, 1, 0, 0], tb,
      (r, lx, ly) => [tb[0] + sx * (r.u * 0.035 + ly * 0.3) + lx * 0.2, tb[1] - r.u * 0.085 + ly * 0.2, tb[2] + r.u * 0.03 + lx]);
  }
  // the skull is a fifth of the animal: everything on the head is enlarged about the occiput (HEAD_K; the shader maps back)
  for (let i = headStart; i < B.n; i++) for (let k = 0; k < 3; k++) {
    B.p[i * 3 + k] = HP[k] + (B.p[i * 3 + k] - HP[k]) * HEAD_K[k];
    B.pv[i * 3 + k] = HP[k] + (B.pv[i * 3 + k] - HP[k]) * HEAD_K[k];
  }
  yield;
  return yield* finishBrontothere(B, hi, SL, Z3);
}

function* finishBrontothere(B, hi, SL, Z3) {
  const sub = hi ? 2 : 1;
  // (review 3) Limbs as anatomy, not panels: each leg is ONE round loft (12 sides, elliptical section) whose top rings lie buried inside
  // the trunk and swell out of it as the shoulder or the haunch (no flat face, no seam line), then a rounded elbow / stifle,
  // a tapering forearm / gaskin, the knob of the carpus / the point of the hock, a cannon bone and a spreading hoofed foot.
  const L = (y, z, x, rx, t, b, n = 2.0) => ({ y, z, x, rx, t, b, n });
  const fore = [L(1.04, 0.33, 0.1, 0.09, 0.1, 0.1), L(0.92, 0.34, 0.185, 0.145, 0.17, 0.165), L(0.78, 0.345, 0.238, 0.152, 0.185, 0.18), L(0.64, 0.315, 0.258, 0.122, 0.14, 0.175),
    L(0.53, 0.33, 0.262, 0.108, 0.118, 0.13), L(0.39, 0.355, 0.26, 0.09, 0.096, 0.098), L(0.29, 0.37, 0.258, 0.093, 0.106, 0.09), L(0.18, 0.368, 0.257, 0.077, 0.08, 0.08), L(0.075, 0.38, 0.257, 0.094, 0.112, 0.092, 2.5), L(0.0, 0.395, 0.257, 0.108, 0.135, 0.096, 2.7)];
  const hind = [L(1.06, -0.66, 0.1, 0.1, 0.12, 0.12), L(0.94, -0.67, 0.195, 0.155, 0.21, 0.2), L(0.79, -0.66, 0.243, 0.158, 0.22, 0.205), L(0.63, -0.6, 0.258, 0.125, 0.165, 0.15),
    L(0.49, -0.675, 0.26, 0.105, 0.115, 0.125), L(0.35, -0.79, 0.258, 0.086, 0.086, 0.108), L(0.215, -0.765, 0.257, 0.075, 0.078, 0.078), L(0.075, -0.725, 0.257, 0.092, 0.108, 0.092, 2.5), L(0.0, -0.705, 0.257, 0.104, 0.128, 0.094, 2.7)];
  const legs = [[5, -1, fore, 0.3, 0.37], [6, 1, fore, 0.3, 0.37], [7, -1, hind, 0.35, -0.79], [8, 1, hind, 0.35, -0.79]];
  for (const [id, sx, rings, ky, kz] of legs) {
    const piv = [sx * 0.24, 0.9, rings[1].z];
    B.loft(spline(rings, sub), SL, (q) => (q[1] < 0.035 ? [0.16, 0.14, 0.13, 1] : HIDE), (q) => [id, smoothstep(ky + 0.05, ky - 0.05, q[1]), ky, kz], piv,
      (r, lx, ly) => [sx * lx, r.y, r.z + ly]);      // (lx already carries the ring's x: the old frame added it twice, which stood the near legs proud of the flank as panels)
    // hoofed toes: four in front, three behind, as dark nails round the front of the pad
    const nt = id < 6.5 ? 4 : 3, fz = rings[rings.length - 1].z, fr = 0.1;
    for (let k = 0; k < nt; k++) {
      const a = (k - (nt - 1) / 2) * 0.62, cx = sx * 0.255 + Math.sin(a) * fr * 0.95, cz = fz + Math.cos(a) * fr * 1.12;
      B.loft([{ y: 0.075, z: cz - 0.012, x: cx, rx: 0.02, t: 0.014, b: 0.014, n: 2 }, { y: 0.04, z: cz + 0.008, x: cx, rx: 0.031, t: 0.026, b: 0.024, n: 2.4 }, { y: 0.0, z: cz + 0.014, x: cx, rx: 0.034, t: 0.03, b: 0.026, n: 2.4 }], hi ? 6 : 4,
        [0.11, 0.1, 0.09, 1], [id, 1, ky, kz], piv, (r, lx, ly) => [r.x + (lx - r.x) * Math.cos(a) + ly * Math.sin(a), r.y, r.z + ly * Math.cos(a) - (lx - r.x) * Math.sin(a)]);
    }
  }
  yield;
  // tail: 25 cm, hanging, with a tuft
  const tb = [0, 1.14, -1.165], trow = [];
  for (let i = 0; i <= 6; i++) { const u = i / 6, tuft = smoothstep(0.6, 0.85, u) * (1 - smoothstep(0.92, 1, u)); trow.push({ u, rx: lerp(0.032, 0.012, u) + tuft * 0.02, t: lerp(0.03, 0.012, u) + tuft * 0.014, b: lerp(0.03, 0.012, u) + tuft * 0.014, n: 2 }); }
  B.loft(trow, hi ? 7 : 5, (q, r) => (r.u > 0.6 ? [0.35, 0.33, 0.33, 0] : HIDE), (q, r) => [4, r.u, 0, 0], tb, (r, lx, ly) => [lx, tb[1] - r.u * 0.3 + ly * 0.25, tb[2] - 0.04 * Math.sin(r.u * 2.4) - ly]);
  yield;
  const g = B.build();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.7, 0.2), 1.7);
  return g;
}

const BRONTO_VERT = /* glsl */`
${SWELL_GLSL}
uniform vec2 uHerd; uniform float uHerdDist, uSink, uWalk;
uniform vec4 uBankA; uniform vec2 uBankB;   // (polish k1) a bank animal that walks down its own mudbank: the bank's x, z, yaw, radius; its stretch and height (height 0 = off). uWalk is then the metres walked.
attribute vec4 aTone, aPart; attribute vec3 aPivot; attribute vec4 iA, iB;
varying vec3 vModel, vN, vPosL; varying vec4 vTone; varying vec4 vInst; varying float vWet, vHead;
#include <fog_pars_vertex>
vec3 rX(vec3 p, vec3 c, float a){ p -= c; float cs = cos(a), sn = sin(a); return vec3(p.x, cs * p.y - sn * p.z, sn * p.y + cs * p.z) + c; }
vec3 rXn(vec3 n, float a){ float cs = cos(a), sn = sin(a); return vec3(n.x, cs * n.y - sn * n.z, sn * n.y + cs * n.z); }
void main(){
  float id = aPart.x, sc = iB.x, kind = iB.z;
  float calf = step(1.5, kind) * step(kind, 2.5), shelf = step(2.5, kind), bull = step(0.5, kind) * step(kind, 1.5) + step(3.5, kind) * step(kind, 4.5);   // (polish k1) kind 4 is a bank bull: tusks
  float wk = uBankB.y > 0. ? uWalk : uSink * uSink * uWalk;
  vec3 p = position, n = normal;
  // (polish 1) LONGER LEGS: the body is carried 0.2 m higher and every leg stretched to match, so the belly clears the ground by
  // nearly half the shoulder height (a heavy tapir, not a hippo); done here so the hide is still painted in its authored coordinates
  float isLeg = step(4.5, id) * step(id, 8.5);
  p.y = mix(p.y + 0.2, p.y * 1.2, isLeg);
  vec3 piv = aPivot; piv.y = mix(piv.y + 0.2, piv.y * 1.2, isLeg);
  vec2 root = iA.xy + mix(uHerd, vec2(sin(iA.w), cos(iA.w)) * wk, shelf);   // bank animals wade off the way they face
  vec2 g; float cr; vec3 sw = swellAt(root + vec2(0., 0.9 * sc), g, cr);
  float swim = calf * step(0.9, iA.z); calf = swim;                  // (polish 2) only a calf out of its depth swims
  float rootY = mix(-iA.z * sc, sw.y - 0.84 * sc, swim);
  rootY = mix(rootY, mix(-iA.z, -0.84 * sc, smoothstep(0.42, 1.0, uSink)), shelf);
  if (uBankB.y > 0.) { vec2 bd = root - uBankA.xy; float bc = cos(uBankA.z), bs = sin(uBankA.z);      // her feet follow the mud's own profile down to the rim, then she sinks to the chest
    float blz = (bd.x * bs + bd.y * bc) / max(uBankA.w * uBankB.x, 1e-3), blx = (bd.x * bc - bd.y * bs) / max(uBankA.w, 1e-3), br = min(1., length(vec2(blx, blz)));
    float gy = uBankB.y * ((1. - br * br) * (1. - br * br) - 0.6 * br * br * br); gy *= gy < 0. ? 2.6 : 1.;
    rootY = mix(rootY, max(gy, -0.84 * sc), shelf); }
  float water = (sw.y - rootY) / sc;                                  // water line in model metres
  float dist = mix(uHerdDist, wk, shelf);
  float ph = (dist / (1.45 * sc) + iB.y) * 6.2832;
  float t = uTime + iB.y * 40.;
  // legs: four-beat walk, LH, LF, RH, RF; carpus folds back, hock folds forward on the swing
  if (id > 4.5 && id < 8.5) {
    float lp = ph + (id < 5.5 ? 0.25 : id < 6.5 ? 0.75 : id < 7.5 ? 0. : 0.5) * 6.2832;
    float a = -0.4 * sin(lp), lift = max(0., cos(lp)), dk = id < 6.5 ? 1. : -1.;
    vec3 knee = vec3(piv.x, aPart.z * 1.2, aPart.w);
    p = mix(p, rX(p, knee, dk * 0.75 * lift), aPart.y); n = mix(n, rXn(n, dk * 0.75 * lift), aPart.y);
    p = rX(p, piv, a); n = rXn(n, a);
  }
  // head and neck: chin rides the water, one nod a stride, a toss when it blows (every 6 s)
  float bl = fract(t / 6.), toss = smoothstep(0., 0.05, bl) * (1. - smoothstep(0.1, 0.3, bl));
  float hv = fract(iB.y * 7.31), graze = (0.5 + 0.5 * sin(t * 0.37 + hv * 40.)) * hv * hv;      // some carry the head level, some lower it to the fern and crop
  float ha = -clamp((water - 0.76) / 0.6, 0., 0.62) * (1. - calf) + mix(mix(-0.16, 0.5, graze), -0.22, max(shelf, calf)) + 0.05 * sin(2. * ph + 0.6) - 0.2 * toss - 0.3 * calf - 0.07 * bull;
  float hw = id < 0.5 ? aPart.y * 0.55 : (id < 3.5 || id > 8.5) ? 1. : 0.;
  vec3 HP = vec3(0., 1.17, 0.86);
  if (id > 1.5 && id < 3.5) {                                       // ears flick, each on its own clock
    float fk = sin(t * (id < 2.5 ? 1.7 : 2.3) + id * 2.); fk = fk * fk; fk = fk * fk; fk = fk * fk * fk;
    p = rX(p, piv, 0.9 * fk + 0.25 * toss);
  }
  if (id > 8.5) p = mix(piv, p, bull);
  p = mix(p, rX(p, HP, ha), hw); n = mix(n, rXn(n, ha), hw);
  if (id > 3.5 && id < 4.5) { float ta = 0.5 * sin(ph + 1.) * aPart.y + 0.3 * sin(t * 2.1) * aPart.y; p.x += (piv.y - p.y) * ta; }
  // trunk: sway over the planted feet, bob, breathe
  float breathe = 1. + 0.018 * sin(t * 1.5) * smoothstep(0.6, 0., abs(position.z + 0.1));
  p.x = p.x * breathe + 0.028 * sin(ph);
  p.y += 0.012 * sin(2. * ph);
  p = rX(p, vec3(0., 0.8, 0.), -0.12 * calf + 0.012 * sin(ph * 2. + 1.));
  { float tip = 0.2 * sin(3.1416 * clamp(uSink * 1.25, 0., 1.)) * shelf; p = rX(p, vec3(0., 0., -0.7), tip); n = rXn(n, tip); }   // forequarters go down first
  float cy = cos(iA.w), sy = sin(iA.w);
  vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z) * sc;
  vec3 pl = vec3(root.x, rootY, root.y) + q;
  vN = vec3(cy * n.x + sy * n.z, n.y, -sy * n.x + cy * n.z);
  vModel = position; vPosL = pl; vTone = aTone; vInst = vec4(kind, iB.w, sc, shelf);
  vHead = (id > 0.5 && id < 3.5) || id > 8.5 ? 1. : 0.;
  vWet = mix(uSw1.w * shelfK(root) * 0.9 + uSw2.w * 0.7 + 0.04, mix(iA.z > 0. ? 0.06 : -1., 0.42, uSink), shelf);   // (a bank animal placed with a positive depth is a wader: wet to the splash line)   // local y the crests reach: wet below
  vec4 mvPosition = modelViewMatrix * vec4(pl - vec3(uHerd.x, 0., uHerd.y), 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BRONTO_FRAG = /* glsl */`
uniform vec3 uCamL, uSunDir, uSunCol, uSkyZen, uSkyHor;
uniform vec3 uSlate, uPale, uWetC, uEmerald, uLime;
varying vec3 vModel, vN, vPosL; varying vec4 vTone; varying vec4 vInst; varying float vWet, vHead;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 toCam = uCamL - vPosL; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  vec3 m = mix(vModel, vec3(0., 0.97, 0.86) + (vModel - vec3(0., 0.97, 0.86)) / vec3(${HEAD_K[0].toFixed(3)}, ${HEAD_K[1].toFixed(3)}, ${HEAD_K[2].toFixed(3)}), step(0.5, vHead));   // the head was enlarged about the occiput: paint it in its authored coordinates
  float kind = vInst.x, calf = step(1.5, kind) * step(kind, 2.5) + step(4.5, kind);   // (polish k1) kind 5: a calf on a bank or wading, paler with cream dashes like the swimmers
  float near = 1. - smoothstep(30., 90., dist);
  // ---- hide: slate above, pale throat and belly, one broad pattern, one fine breakup
  float under = smoothstep(0.1, -0.55, N.y) * smoothstep(0.95, 0.6, m.y);
  float throat = smoothstep(0.9, 0.78, m.y) * smoothstep(0.5, 0.8, m.z) * smoothstep(0.3, -0.3, N.y + 0.2);
  float jaw = smoothstep(0.86, 0.8, m.y) * step(1.0, m.z);
  float broad = fbm3(m.zy * vec2(2.2, 3.1) + vInst.y * 9.);
  float fine = vnoise(m.zy * 70. + m.x * 31.) * 0.6 + vnoise(m.zy * vec2(22., 90.)) * 0.4;      // short hair, combed down
  vec3 slate = mix(uSlate, vec3(dot(uSlate, vec3(0.3, 0.6, 0.1))), 0.72) * vec3(1.0, 0.97, 0.93);
  vec3 hide = slate * (0.54 + 0.66 * broad);
  hide = mix(hide, hide * vec3(1.12, 1.02, 0.86), smoothstep(0.45, 0.75, broad) * 0.5);        // warmer, dustier saddles
  hide *= 1. - 0.5 * smoothstep(0.98, 1.28, m.y + 0.12 * broad) * smoothstep(0.9, -0.9, m.z);   // dark saddle along the back
  hide *= 1. + 0.14 * smoothstep(0.42, 0.0, length((m.zy - vec2(-0.15, 0.82)) * vec2(0.6, 1.)));          // paler flank
  hide = mix(hide, uPale, clamp(max(under, max(throat, jaw * 0.8)) * 0.85, 0., 1.));
  hide *= 1. + (fine - 0.5) * 0.5 * near;
  { float wr = smoothstep(0.07, 0.0, abs(vnoise(m.zy * vec2(23., 31.) + m.x * 9.) - 0.5)) + 0.6 * smoothstep(0.06, 0.0, abs(vnoise(m.zy * vec2(9., 14.) + m.x * 5. + 3.) - 0.5));   // (polish 3) the hide is skin: a net of fine wrinkles, deeper folds
    hide *= 1. - 0.1 * min(wr, 1.) * (1. - smoothstep(10., 30., dist)); }
  hide *= 1. - 0.14 * smoothstep(1.0, 1.3, m.z) * smoothstep(0.84, 0.9, m.y) - 0.12 * smoothstep(1.08, 1.16, m.y) * step(0.85, m.z) * step(m.z, 1.05);   // a little darker on the face and ear backs
  // creases: skin rings at the neck, folds behind the elbow and at the stifle, the mouth line, the dished face
  float neck = smoothstep(0.52, 0.6, m.z) * (1. - smoothstep(0.82, 0.9, m.z));
  float crease = neck * smoothstep(0.35, 0.0, 0.5 + 0.5 * sin((m.z - 0.52) * 46. + 1.5708)) * 0.22;
  float flank = step(0.12, abs(m.x));
  crease += smoothstep(0.035, 0.0, abs(m.z - (0.47 - (m.y - 1.0) * 0.42))) * smoothstep(0.6, 0.75, m.y) * smoothstep(1.3, 1.15, m.y) * flank * 0.32;   // shoulder blade
  crease += smoothstep(0.04, 0.0, abs(m.z - (-0.42 - (m.y - 0.9) * 0.3))) * smoothstep(0.6, 0.72, m.y) * smoothstep(1.16, 1.0, m.y) * flank * 0.26;    // haunch
  crease += smoothstep(0.5, 1., sin(m.z * 52. + m.y * 9.)) * smoothstep(-0.36, -0.2, m.z) * smoothstep(0.24, 0.1, m.z) * smoothstep(0.62, 0.72, m.y) * smoothstep(1.02, 0.9, m.y) * flank * 0.05;   // ribs
  float mouthY = 0.838 - (m.z - 1.3) * 0.06;
  crease += smoothstep(0.012, 0.002, abs(m.y - mouthY)) * smoothstep(1.16, 1.24, m.z) * smoothstep(0.05, 0.09, abs(m.x)) * 0.8;
  crease += smoothstep(0.03, 0.0, abs(m.z - (0.2 + (m.y - 0.7) * 0.25))) * smoothstep(0.52, 0.6, m.y) * smoothstep(0.86, 0.74, m.y) * flank * 0.3;        // the fold behind the elbow
  crease += smoothstep(0.03, 0.0, abs(m.z - (-0.5 + (m.y - 0.7) * 0.5))) * smoothstep(0.5, 0.6, m.y) * smoothstep(0.84, 0.72, m.y) * flank * 0.26;      // and in front of the stifle
  crease += smoothstep(0.03, 0.0, abs(m.x)) * smoothstep(1.0, 1.15, m.y) * smoothstep(0.2, 0.0, m.z) * 0.3;                                              // the spine line along the loins
  crease += smoothstep(0.02, 0.0, abs(m.y - (0.9 + 0.5 * (m.z - 1.05) * (m.z - 1.05)))) * smoothstep(1.0, 1.08, m.z) * smoothstep(1.4, 1.3, m.z) * smoothstep(0.06, 0.1, abs(m.x)) * 0.22;   // cheek furrow under the eye
  hide *= 1. - clamp(crease * 1.25, 0., 0.5) * mix(0.6, 1., near);
  hide = mix(hide, hide * 1.25 + 0.03, smoothstep(1.3, 1.5, m.z) * smoothstep(0.9, 0.84, m.y) * 0.5);   // paler lips
  // calves: paler, with rows of cream dashes
  float dash = step(0.15, sin(m.z * 19. + floor(m.y * 7.) * 2.1)) * step(0.33, vnoise(vec2(m.z * 5., floor(m.y * 7.) * 3.7))) * smoothstep(0.03, 0.012, abs(fract(m.y * 7.) - 0.5) * 0.143) * smoothstep(0.62, 0.72, m.y) * smoothstep(1.2, 1.1, m.y) * step(m.z, 0.6);
  hide = mix(hide, mix(hide * 1.35 + 0.02, vec3(0.85, 0.78, 0.6), dash * 0.7 * (1. - smoothstep(5., 13., dist))), calf);   // (the dashes melt into the paler coat with distance: no speckle)
  hide *= 1. + vInst.y * 0.09; hide.r *= 1. + vInst.y * 0.05;
  // wet below the reach of the crests, with a tide-mark of fern stuck along the flank
  float wl = vWet + (0.24 + (fbm3(m.zy * 5.) - 0.5) * 0.3) * vInst.z;      // (polish 3) wet to the splash line: the legs and the belly's lower curve are dark and shining
  float wet = smoothstep(wl + 0.03, wl - 0.03, vPosL.y);
  hide = mix(hide, uWetC * 1.25 + min(hide, slate) * 0.3, wet);
  // the tide-mark: a thin broken line of fine fern specks at the reach of the crests, and a few stray specks below it
  float fleck = step(0.42, vnoise(m.zy * vec2(95., 70.) + 3.)) * smoothstep(0.026 * vInst.z, 0.0, abs(vPosL.y - wl + 0.012)) * smoothstep(0.3, 0.45, vnoise(m.zy * vec2(6.5, 2.) + 5.));
  fleck += step(0.9, vnoise(m.zy * vec2(120., 150.) + 8.)) * wet * 0.45 * near;
  vec3 fern = mix(uEmerald, uLime, vnoise(m.zy * 50.));
  vec3 alb = mix(hide, fern, clamp(fleck, 0., 1.) * step(m.z, 1.05) * (1. - vInst.w * 0.6));
  alb = mix(alb, vTone.rgb, vTone.a) * mix(vTone.rgb, vec3(1.), vTone.a);
  // ---- light: gold key on the sun side, aqua fill, green bounce from the lawn, a wet sheen
  float ndl = dot(N, uSunDir);
  float key = smoothstep(-0.1, 0.8, ndl);
  vec3 fill = mix(uEmerald * 0.16 + uSkyHor * 0.2 + uSkyZen * 0.1, mix(uSkyZen, vec3(0.62), 0.6), N.y * 0.5 + 0.5) * 1.2;
  fill *= 0.56 + 0.44 * smoothstep(0.35, 1.0, m.y + N.y * 0.25);                      // the body shades its own underside (never to black)
  fill *= mix(vec3(0.88, 1.0, 1.1), vec3(1.), key) * 1.12;                              // aqua-slate on the side turned from the sun
  // form on the shaded side: the open sky away from the sun models shoulder, haunch, barrel and face (review 3: no flat olive side)
  vec3 Fd = normalize(vec3(-uSunDir.x, 0.55, -uSunDir.z));
  float fd = max(dot(N, Fd), 0.);
  float against = clamp(0.5 - 0.5 * dot(V, uSunDir), 0., 1.);
  fill *= (0.7 + 0.62 * fd * fd) * mix(0.78, 1.25, against * against);
  float nv = clamp(dot(N, V), 0., 1.);
  float rimK = (1. - nv) * (1. - nv);
  float gold = max(uSunCol.r - uSunCol.b, 0.) / max(uSunCol.r, 1e-3);                 // 0 under a pewter sky: no warm rim in drizzle
  vec3 keyC = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.6, 0.1))) * vec3(0.96, 1., 1.06), 0.78) * (1. - 0.4 * wet);   // (polish 2) slate stays slate in gold light
  vec3 col = alb * (fill + keyC * key * 0.62);
  // The low sun rims whatever edge is turned to it. When it stands BEHIND the animal the rim is a hard gold band two or three pixels
  // wide, confined to the silhouette (nv low), so a back seen from above is never bleached; when it is behind us, a soft warm edge.
  float band = smoothstep(0.6, 0.14, nv) * smoothstep(-0.6, 0.1, ndl);
  float soft = rimK * (0.35 + 0.65 * (1. - nv)) * smoothstep(-0.45, 0.25, ndl);
  float gk = 0.3 + 0.7 * gold;
  float topline = band * smoothstep(0.25, 0.75, N.y) * (1. - against);                    // sun behind us: a warm line along back, hump and the top of the face
  col += uSunCol * vec3(1., 0.84, 0.6) * (alb * 1.3 + 0.1) * (band * against * against * 2.0 + soft * 0.13 + topline * 0.3) * gk * (1. - 0.3 * wet);
  // ears are thin: the sun behind them glows through
  float ear = smoothstep(1.085, 1.12, m.y) * step(0.84, m.z) * step(m.z, 1.08) * vHead;
  col += uSunCol * vec3(1., 0.62, 0.42) * alb * ear * against * against * 1.1 * gold;
  col += uSkyZen * rimK * rimK * 0.10 * (1. - key) + mix(uSkyZen, uSkyHor, 0.5) * (0.05 + 0.1 * rimK) * wet * (N.y * 0.5 + 0.5);      // wet hide glistens with the sky: never black on black water
  // short-haired hide is matt: only a broad low sheen where it is wet (no white hot-spots)
  vec3 Hh = normalize(uSunDir + V + vec3(0., 1e-3, 0.));
  float sh = max(dot(N, Hh), 0.); sh *= sh; sh *= sh; sh *= sh;
  col += uSunCol * sh * 0.07 * wet * (1. - vTone.a * 0.5);
  col = mix(col, vTone.rgb, step(2.5, vTone.r) * vTone.a);                  // the eye's highlight stays bright
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function makeBrontoMaterial(U, P) {
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uHerdDist: { value: 0 }, uBankA: { value: new THREE.Vector4(0, 0, 0, 1) }, uBankB: { value: new THREE.Vector2(1, 0) },
    uSlate: { value: lin(P[4]) }, uPale: { value: lin('#B9B2A3') }, uWetC: { value: lin('#2E3038') }, uEmerald: { value: lin(P[0]) }, uLime: { value: lin(P[5]) } };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: BRONTO_VERT, fragmentShader: BRONTO_FRAG, fog: true, side: THREE.DoubleSide });
}
function instanceHerd(geo, mat, list) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; for (const k of Object.keys(geo.attributes)) g.setAttribute(k, geo.attributes[k]);
  const iA = new Float32Array(list.length * 4), iB = new Float32Array(list.length * 4);
  list.forEach((a, i) => { iA.set([a.x, a.z, a.depth ?? 0.48, a.yaw ?? 0], i * 4); iB.set([a.s, a.ph, a.kind, a.tint], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = list.length;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- assembly
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, P = opts.palette || DEFAULT_PALETTE, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const object = new THREE.Group(); object.name = 'fern-sea-midnight-hero';
  const U = makeSeaUniforms({ ...opts, palette: P });
  const heightAt = makeHeightAt(U);
  const herdSpeed = opts.herdSpeed ?? 1.2, herdStart = opts.herdStart ?? 0;
  // per-seed variety: echelon slant or vee, who is a bull, where the rust lies (the sea shader hashes world xz,
  // so the piece is shifted in pattern space), swell phase
  const seedShift = new THREE.Vector2(rng.range(-400, 400), rng.range(-400, 400));
  const herd = layoutHerd(rng, opts);
  // (polish 1) belly- to chest-deep: the whole barrel, the shoulders and the elbows stand out of the water
  // (polish 2) THE SHELF SHOALS under the sun-side wing: the bull and the waders the route passes stand knee- to hock-deep, legs
  // working in full view (chest-deep they were read as sacks lying on the water); the wing deepens outward to the belly, and the
  // far wing wades chest-deep as before. A calf beside a wading mother wades too; only those in deep water swim.
  for (const a of herd) { if (a.kind === 2) continue; const r = rng.range(0, 1), w = rng.range(-1, 1), kk = a.lead ? 3 : a.j <= 0 ? -a.j : 99;
    a.depth = kk <= 5 ? lerp(0.24, 0.34, r) : kk <= 14 ? lerp(0.26, 0.4, r) : lerp(0.5, 0.66, r);      // (the whole sun-side wing and the leaders: legs in view on every seed)
    a.yaw = w * (kk <= 14 ? 0.22 : 0.07); }
  for (const a of herd) { if (a.kind !== 2) continue; let m = null, bd = 1e9; for (const b of herd) { if (b.kind === 2) continue; const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < bd) { bd = d; m = b; } }
    const d = m.depth * m.s / a.s; a.depth = d < 0.86 ? d : 1; a.yaw = m.yaw; }
  await ctx.yield();
  const lane = await bakeLanes(ctx, herd, U.uSunDir.value);
  await ctx.yield();
  const seaR = opts.seaRadius ?? 620;
  const seaGeo = seaGeometry(seaR, detail);
  await ctx.yield();
  const seaMat = makeSeaMaterial(U, P, lane, { ...opts, seedShift });
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.frustumCulled = false; sea.name = 'sea';
  object.add(sea);
  await ctx.yield();
  // the herd: hero model for the nine nearest the fly-through and the first calf, the light model for the rest
  const geoHi = await buildBrontothereAsync({ detail: 1 }, ctx.yield);
  await ctx.yield();
  const geoLo = await buildBrontothereAsync({ detail: 0.5 }, ctx.yield);
  await ctx.yield();
  const brontoMat = makeBrontoMaterial(U, P);
  const near = (a) => (a.front ? 0.5 : a.lead ? a.j * 2.6 - 1.1 : a.j <= 0 ? -a.j : a.j * 4 + 9);        // the bull and the twelve nearest of the sun-side wing: the fly-through passes each within 8 m
  const adults = herd.filter((a) => a.kind < 2).sort((a, b) => near(a) - near(b));
  const calves = herd.filter((a) => a.kind === 2);
  const hiList = adults.slice(0, 10).concat(calves.slice(0, 1)), loList = adults.slice(10).concat(calves.slice(1));
  const herdHi = instanceHerd(geoHi, brontoMat, hiList), herdLo = instanceHerd(geoLo, brontoMat, loList.length ? loList : hiList.slice(0, 1));
  herdLo.visible = loList.length > 0;
  object.add(herdHi, herdLo);
  await ctx.yield();
  const extras = await buildExtras(ctx, { U, P, herd, detail, object, opts, heightAt });

  const bull = adults[0];
  const anchors = {
    waterY: 0,
    herdHeading: new THREE.Vector3(0, 0, 1), herdSpeed, laneLength: 30,
    herdAt: (time, out = new THREE.Vector3()) => out.set(0, 0, herdStart + herdSpeed * time),
    heroBull: new THREE.Vector3(bull.x, 0.6, bull.z),
    swellFrom: new THREE.Vector3(-U.uSw1.value.x, 0, -U.uSw1.value.y),
    flyThrough: ROUTE.C.map(([sA, d, y]) => { const q = wingXZ(sA, d); return new THREE.Vector3(q[0], y, q[1]); }),      // leg C in the herd's frame (see ROUTE.C)
    portalSeat: { position: new THREE.Vector3(-110, 7, 150), facing: new THREE.Vector3(0.59, 0, -0.81) },
    viewpoints: [
      { name: 'comb from behind', position: new THREE.Vector3(30, 3, -55), target: new THREE.Vector3(-4, 0.5, 0) },
      { name: 'bull close', position: new THREE.Vector3(1.5, 2.2, -6), target: new THREE.Vector3(-4, 0.7, 1) },
      { name: 'echelon broadside, sun side', position: new THREE.Vector3(-34, 2.5, 22), target: new THREE.Vector3(0, 0.5, 0) },
    ],
  };
  const camL = new THREE.Vector3();
  let progress = -1;
  const hero = {
    object, radius: 2.5, height: 4, center: new THREE.Vector3(-2.5, 2.6, 0.5), anchors, ground: false, groundY: 0,
    uniforms: U, seaMaterial: seaMat, heightAt, herd, seedShift, brontoGeometry: geoHi,
    setLight(l = {}) {
      if (l.sunDir) U.uSunDir.value.copy(l.sunDir).normalize();
      if (l.sunColor) U.uSunCol.value.copy(l.sunColor);
      if (l.skyZenith) U.uSkyZen.value.copy(l.skyZenith);
      if (l.skyHorizon) U.uSkyHor.value.copy(l.skyHorizon);
    },
    setTear(i, x, z, radius) { seaMat.uniforms.uTears.value[clamp(i | 0, 0, 7)].set(x, z, radius > 0 ? radius : -1000, 0); },
    setProgress(u) { progress = u; extras.setProgress(u, seaMat); },
    update(dt, time, camera, herdTime = time) {          // herdTime: the world keys the echelon's travel to its journey
      U.uTime.value = time;
      const d = herdStart + herdSpeed * herdTime;
      U.uHerd.value.set(0, d); brontoMat.uniforms.uHerdDist.value = d;
      object.updateWorldMatrix(true, false);
      camL.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camL);
      U.uCamL.value.set(camL.x, camL.y, camL.z + d);     // sea space
      if (progress < 0) extras.ambient(time, seaMat);
      extras.update(dt, time, camera);
    },
    dispose() {},
  };
  return hero;
}

// ---------------------------------------------------------------- Presbyornis rafts and the waders' breath
function duckGeometry() {
  const B = new Builder(), grey = [0.17, 0.2, 0.25, 1], cream = [0.42, 0.38, 0.29, 1], black = [0.025, 0.025, 0.03, 1], white = [0.6, 0.6, 0.57, 1], slate = [0.1, 0.12, 0.16, 1];
  B.loft([R(-0.31, 0.15, 0.012, 0.01, 0.01), R(-0.2, 0.115, 0.07, 0.04, 0.05), R(-0.05, 0.1, 0.105, 0.075, 0.085), R(0.1, 0.1, 0.1, 0.075, 0.09), R(0.21, 0.12, 0.05, 0.045, 0.05)], 6,
    (q) => (q[1] < 0.075 ? cream : q[2] < -0.17 ? black : (q[2] > -0.13 && q[2] < -0.06 && q[1] < 0.15) ? white : grey), [0, 0, 0, 0], [0, 0, 0]);
  const nb = [0, 0.13, 0.17];
  B.loft([{ u: 0, rx: 0.03, t: 0.03, b: 0.03, n: 2 }, { u: 0.55, rx: 0.02, t: 0.02, b: 0.02, n: 2 }, { u: 1, rx: 0.02, t: 0.02, b: 0.02, n: 2 }], 4, grey, (q, r) => [1, r.u, 0, 0], nb,
    (r, lx, ly) => [lx, nb[1] + r.u * 0.21, nb[2] + 0.04 * Math.sin(r.u * 2.6) + ly]);
  B.loft([R(0.165, 0.355, 0.012, 0.012, 0.012), R(0.2, 0.362, 0.036, 0.034, 0.032), R(0.245, 0.355, 0.032, 0.028, 0.028), R(0.268, 0.342, 0.028, 0.012, 0.012, 3), R(0.355, 0.33, 0.034, 0.007, 0.007, 3)], 5,
    (q) => (q[2] > 0.262 ? slate : q[2] > 0.225 && Math.abs(q[0]) > 0.02 && q[1] > 0.36 ? black : grey), [1, 1, 0, 0], nb);
  return B.build();
}
const DUCK_VERT = /* glsl */`
${SWELL_GLSL}
uniform vec2 uHerd; uniform float uLift;
attribute vec4 aTone, aPart; attribute vec3 aPivot; attribute vec4 iA, iB;
varying vec3 vN, vPosL, vCol;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; float t = uTime + iB.x * 30., w = aPart.y * step(0.5, aPart.x);
  float look = 0.8 * sin(t * 0.43 + iB.x * 20.) * w, dipS = sin(t * 0.31 + iB.x * 50.), dip = dipS * dipS; dip = dip * dip; dip = dip * dip * dip * step(0.5, iB.z) * w;
  vec3 q = p - aPivot; float c = cos(look), s = sin(look); q = vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z);
  c = cos(dip * 1.9); s = sin(dip * 1.9); q = vec3(q.x, c * q.y - s * q.z, s * q.y + c * q.z);
  p = mix(p, q + aPivot, step(0.5, aPart.x));
  vec2 g; float cr; vec3 sw = swellAt(iA.xy, g, cr);
  float lift = clamp(uLift * 3. - iB.y * 2., 0., 1.);
  float cy = cos(iA.z), sy = sin(iA.z), sc = iA.w * (1. - lift) * smoothstep(4.5, 7., length(iA.xy - uCamL.xz));   // (polish 3) no bird sits under the lens, cut by the frame
  vec3 r = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z) * sc;
  r.y += dot(g, r.xz) + 0.012 * sin(t * 2.3);                                  // ride the slope, paddle-bob
  vec3 pl = vec3(iA.x, 0.01, iA.y) + sw + r + vec3(sy, 0.7, cy) * (lift * lift * 14.);
  vN = vec3(cy * n.x + sy * n.z, n.y, -sy * n.x + cy * n.z); vPosL = pl; vCol = aTone.rgb * (0.9 + 0.2 * iB.w);
  vec4 mvPosition = modelViewMatrix * vec4(pl - vec3(uHerd.x, 0., uHerd.y), 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DUCK_FRAG = /* glsl */`
uniform vec3 uCamL, uSunDir, uSunCol, uSkyZen, uEmerald;
varying vec3 vN, vPosL, vCol;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamL - vPosL + vec3(0., 1e-4, 0.));
  float key = smoothstep(-0.1, 0.8, dot(N, uSunDir)), nv = clamp(dot(N, V), 0., 1.);
  vec3 fill = mix(uEmerald * 0.5, mix(uSkyZen, vec3(0.6), 0.4), N.y * 0.5 + 0.5) * 0.75;
  vec3 col = vCol * (fill + uSunCol * key * 0.42) + uSunCol * (1. - nv) * (1. - nv) * key * 0.05;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const SPRAY_VERT = /* glsl */`
${SWELL_GLSL}
uniform vec2 uHerd;
attribute vec4 iA, iB;
varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
void main(){
  float sc = iA.z, t = uTime + iA.w * 40., bl = fract(t / 6.);
  float life = (bl - 0.03 - iB.x * 0.05) / 0.2, on = step(0., life) * step(life, 1.);
  life = clamp(life, 0., 1.);
  vec2 root = iA.xy + uHerd;
  vec3 dir = normalize(vec3((iB.z - 0.5) * 1.1, 0.5 + iB.w * 0.6, 0.9));
  vec3 pl = vec3(root.x + (iB.y - 0.5) * 0.12, 0.62 * sc, root.y + 1.6 * sc);
  pl += dir * (life * (0.5 + 0.8 * iB.w)) * sc; pl.y -= life * life * 0.35;
  vUv = position.xy; vA = on * (1. - life) * smoothstep(0., 0.12, life) * 0.42;
  vec4 mvPosition = modelViewMatrix * vec4(pl - vec3(uHerd.x, 0., uHerd.y), 1.);
  mvPosition.xy += position.xy * (0.05 + 0.17 * life) * sc * on;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPRAY_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyZen;
varying vec2 vUv; varying float vA;
#include <fog_pars_fragment>
void main(){
  float d = dot(vUv, vUv); float a = (1. - smoothstep(0.15, 1., d)) * vA;
  gl_FragColor = vec4((uSunCol * 0.34 + uSkyZen * 0.3), a);
  #include <fog_fragment>
}`;

// A herd of waders for the world coder: list = [{ x, z, s, kind, ph, tint, depth, yaw }] in sea space minus the
// herd's travel (kind 0 cow, 1 bull, 2 swimming calf, 3 standing on a bank: depth is then the bank's height as a
// NEGATIVE number, and uniform uSink 0..1 walks it off and down). Share U (hero.uniforms) so it rides the same sea.
export function makeBrontoHerd(U, P, list, o = {}) {
  const geo = o.geometry || buildBrontothere({ detail: o.detail ?? 1 }), material = o.material || makeBrontoMaterial(U, P || DEFAULT_PALETTE);
  return { mesh: instanceHerd(geo, material, list), material, geometry: geo };
}

async function buildExtras(ctx, env) {
  const { U, P, herd, detail, object, opts } = env, rng = ctx.rng;
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  // ---- ducks: rafts sitting on the lawn between the lanes (lanes are straight, so a raft between two is never run down)
  const nd = Math.round((opts.ducks ?? 180) * detail), dA = new Float32Array(nd * 4), dB = new Float32Array(nd * 4);
  const xs = herd.map((a) => a.x), clearOf = (x) => xs.every((ax) => Math.abs(x - ax) > 2.9);
  let placed = 0, guard = 0, raft = null;
  while (placed < nd && guard++ < nd * 60) {
    if (!raft || raft.left <= 0) raft = { x: rng.range(-70, 70), z: rng.range(-60, 85), r: rng.range(2.5, 7), left: rng.int(6, 22), yaw: rng.range(0, TAU) };
    const a = rng.range(0, TAU), d = Math.sqrt(rng()) * raft.r, x = raft.x + Math.sin(a) * d * 0.55, z = raft.z + Math.cos(a) * d * 1.5;
    raft.left--;
    if (!clearOf(x) || Math.hypot(x + 4, z) < 3) continue;
    dA.set([x, z, raft.yaw + rng.range(-0.7, 0.7), rng.range(0.92, 1.12)], placed * 4);
    dB.set([rng(), clamp((z + 60) / 150 + rng.range(-0.08, 0.08), 0, 1), rng.chance(0.4) ? 1 : 0, rng.range(-1, 1)], placed * 4);
    placed++;
  }
  await ctx.yield();
  const dg0 = duckGeometry(), dg = new THREE.InstancedBufferGeometry();
  dg.index = dg0.index; for (const k of Object.keys(dg0.attributes)) dg.setAttribute(k, dg0.attributes[k]);
  dg.setAttribute('iA', new THREE.InstancedBufferAttribute(dA, 4)); dg.setAttribute('iB', new THREE.InstancedBufferAttribute(dB, 4));
  dg.instanceCount = placed;
  const duckMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uEmerald: { value: lin(P[0]) } }, vertexShader: DUCK_VERT, fragmentShader: DUCK_FRAG, fog: true, side: THREE.DoubleSide });
  const ducks = new THREE.Mesh(dg, duckMat); ducks.frustumCulled = false; ducks.name = 'ducks';
  object.add(ducks);
  await ctx.yield();
  // ---- breath: each adult blows a low gold-lit puff every 6 s as its head comes up
  const adults = herd.filter((a) => a.kind < 2), NP = 5, sA = new Float32Array(adults.length * NP * 4), sB = new Float32Array(adults.length * NP * 4);
  adults.forEach((a, i) => { for (let k = 0; k < NP; k++) { sA.set([a.x, a.z, a.s, a.ph], (i * NP + k) * 4); sB.set([k / NP, rng(), rng(), rng()], (i * NP + k) * 4); } });
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
  sg.setAttribute('iA', new THREE.InstancedBufferAttribute(sA, 4)); sg.setAttribute('iB', new THREE.InstancedBufferAttribute(sB, 4));
  sg.instanceCount = adults.length * NP;
  const sprayMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, fog: true, transparent: true, depthWrite: false });
  const spray = new THREE.Mesh(sg, sprayMat); spray.frustumCulled = false; spray.renderOrder = 3; spray.name = 'breath';
  object.add(spray);
  return {
    ducks, spray,
    setProgress(u, seaMat) {
      U.uSink.value = smoothstep(0.09, 0.14, u);
      U.uLift.value = smoothstep(0.44, 0.52, u);
      seaMat.uniforms.uRain.value.w = smoothstep(0.6, 0.64, u) * (1 - smoothstep(0.76, 0.8, u));
    },
    ambient(time, seaMat) { seaMat.uniforms.uRain.value.set(26, 24 + U.uHerd.value.y, 20, 0.45); },   // a light shower beside the herd, until the world takes over
    update() {},
  };
}
