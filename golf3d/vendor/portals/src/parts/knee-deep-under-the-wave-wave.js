// KNEE-DEEP UNDER THE WAVE, part WAVE (film worlds D): the one great wave. Its body from the foot's apron to the
// end of the back, its crest uneven by the law's lift; its face LIT THROUGH by the hole from the crest far down
// (jade, turquoise, a deep clear teal low), laced with crisp ropes and threads of running foam, its wavelets glinting
// with the burning crest, tongues and patches of white water at its foot; its glowing lip, its burning spray, the
// mist at its foot; its back a deep rich teal behind the crest (no image of the hole in it; sparse crisp lacing), going to the
// calm sea's own look down its lower third and dissolving into the sea at its toe; and the far next wave.
//   buildWave(ctx, { path, light }) -> { object, uniforms, update(time, s, camera), dispose() }
// THE LAW places everything: the body is built in the wave's own frame (local z = xi, metres south of the crest
// line; the law's waveHeight) and update() only moves it to crestZ(s) and the next wave to nextCrestZ(s), by metres
// flown. The clock moves only what loops: the foam's run up the face and down the back, the part's own slow swells
// (at most 5.4 m either way, inside the law's WAVE.swell), the ripples, the spray's and the mist's drift.
// The eye is read for these only: the direction of view of the water's mirror (the sky, and on the face the hole
// in it and the glints of the burning crest on the wavelets) and of the look down through the water to the bed
// (down the back, by the sea part's rule), the pixel's footprint (a size of pattern leaves the picture before the
// pixel can no longer show it; a thin line is kept a pixel and a half wide and as much fainter),
// air by distance (kdHaze), and the thinning of the two media (spray, mist) by their true distance to the eye
// inside the kit's near range only (the law's WAY.eye). THE WAY THROUGH THE SPRAY AND THE MIST IS A RULE OF PLACE
// (the law's WAY): the sheets are thin near the fixed line the route takes through them in the wave's own frame.
// ALL LIGHT IS BY THE PLACE: the hole's light through the face and the
// burning of the spray are functions of the height on the wave and of x, never of the eye.
// A PLACING, SAID HERE: the hole stands due north behind the whole wave; the glow through the face and the burning
// of the crest's spray are laid brightest within some 1500 m of x = 0, where the route climbs (to be seen from the
// way: true for the whole climb, on every seed), and fall to pale and cold far along the crest.
// THE PROFILE IS THE LAW'S: every height and slope here is the law's waveHeight / waveSlope, baked into the grids
// row by row (aProf) or handed to a shader as numbers the law computed; no shader carries a copy of its formula.
// What a seed deals: four phases of the swells and of the foam's and the spray's pattern (a stream of the part's
// own); every deal is the same look.
// Draw calls: the body (1; drawn with the see-through things, first of them, because its toe dissolves), the
// spray and the mist as one mesh of eight large sheets (1: one torn veil along the crest, slit into streaming strands, with droplets thrown beyond it, curtains that
// fall down the upper face where the crest peaks, banks of mist with gaps over the foot, the next wave's fringe), the next wave (1: a far wave of its own uneven skyline, lit
// through, 24 km either way so that its ends are lost in the air).
import * as THREE from 'three';
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';
import { WAVE, SEA, CREST, WAY, waveHeight, waveSlope, crestZ, nextCrestZ } from './knee-deep-under-the-wave-law.js';
import { SEA_WATER_GLSL } from './knee-deep-under-the-wave-sea.js';       // the sea's water rule (seaMirror, seaWater, the sand's two colours): it stands once, there

const f = (v) => { const s = String(+(+v).toFixed(5)); return /[.e]/.test(s) ? s : s + '.'; };   // a number as a GLSL float
const FLOW = 13;          // metres a second the water runs through the wave's form (up the face, down the back)
const ENDS = 1500;        // metres over which the wave's height (and its swells) die away at each far end
const NEAR = 1500;        // metres: the breadth about x = 0 of the bell within which the hole's light through the wave and the spray's burning are laid brightest
const NEAR2 = f(NEAR * NEAR);   // (its square, as the shaders use it)

// ---- what every shader of the part shares: the wave's measures and the part's own slow swells
const PARS = /* glsl */`
uniform float uTime;
uniform vec4 uSeed;                       // four phases dealt from the seed (radians)
const float WH = ${f(WAVE.height)}, WF = ${f(WAVE.face)}, WB = ${f(WAVE.back)}, WPI = 3.14159265;
// the part's own swells at (x east, xi south of the crest): x their height in metres (at most 5.4 either way),
// y and z their slopes east and south. Four slow trains that cross the wave slantwise.
vec3 kwSwell(float x, float xi) {
  float a1 = x * 0.0110 + xi * 0.0060 + mod(uTime * 0.21, 6.2831853) + uSeed.x;
  float a2 = -x * 0.0230 + xi * 0.0130 - mod(uTime * 0.17, 6.2831853) + uSeed.y;
  float a3 = x * 0.0047 - xi * 0.0190 + mod(uTime * 0.11, 6.2831853) + uSeed.z;
  float a4 = x * 0.0520 + xi * 0.0310 + mod(uTime * 0.33, 6.2831853) + uSeed.w;
  return vec3(2.2 * sin(a1) + 1.5 * sin(a2) + 1.1 * sin(a3) + 0.6 * sin(a4),
    0.0242 * cos(a1) - 0.0345 * cos(a2) + 0.00517 * cos(a3) + 0.0312 * cos(a4),
    0.0132 * cos(a1) + 0.0195 * cos(a2) - 0.0209 * cos(a3) + 0.0186 * cos(a4));
}
// the swells die away toward both feet (the wave meets the calm sea level) and toward its far ends
float kwEnv(float x, float xi) {
  return (1. - smoothstep(WF - 110., WF, xi)) * smoothstep(-WB, -WB + 160., xi) * (1. - smoothstep(${f(WAVE.halfWidth - ENDS)}, ${f(WAVE.halfWidth)}, abs(x)));
}
// THE LAW'S crestLift(x), from the law's own numbers (CREST; added by the lead): the wave's whole height at x is its
// height in the route's plane times this; exactly 1 at x = 0 and level there (the route crosses through a saddle)
float kwLift(float x) {
  float n = ${CREST.terms.map(([a, w, ph]) => `${f(a)} * (0.5 + 0.5 * sin(x / ${f(w)} * 6.2831853 + ${f(ph)}))`).join(' + ')};
  return 1. + (1. - exp(-x * x / ${f(2 * CREST.saddle * CREST.saddle)})) * n;
}
`;

// ---- THE BODY: position = (x, the law's height, xi); aProf = the law's profile at the row: metres along the
// water's skin from the south foot northward (the coordinate the foam runs on: up the face, over the crest and
// down the back), the law's slope, the law's height
const BODY_VERT = /* glsl */`
${PARS}
attribute vec3 aProf;
varying vec3 vW; varying vec3 vL; varying vec2 vP;
void main() {
  vec3 p = position;
  // (the crest is uneven: the law's crestLift lifts the whole profile at x; the rows sunk under the sea stay)
  p.y = p.y * (p.y > 0. ? kwLift(p.x) : 1.) + kwSwell(p.x, p.z).x * kwEnv(p.x, p.z);
  vL = vec3(p.x, p.z, aProf.x); vP = aProf.yz;
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// THE SKIN'S WAVELETS: nineteen trains whose crests lie across the flow. Fifteen run from 56 m down to 5 m from
// crest to crest in even steps of length, each on a bearing of its own within 28 degrees of the flow (so crests
// are short, and no two trains make a lattice); four are the fine ripple (1.1 to 1.9 m). Dealt here once by a
// fixed rule: the same on every seed. Each train fades to nothing (its mean) before a wave of it is under three
// pixels long. A line of GLSL for each: its slope along the flow (gq) and eastward (gx).
const fract1 = (v) => v - Math.floor(v);
const WAVELETS = Array.from({ length: 19 }, (_, i) => {
  const fine = i >= 15, j = i - 15;
  const len = fine ? 1.9 * Math.pow(1.1 / 1.9, j / 3) : 56 * Math.pow(5 / 56, i / 14);
  const ang = (fract1(i * 0.618034 + 0.31) - 0.5) * 2 * (fine ? 22 : 28) * Math.PI / 180, k = 2 * Math.PI / len;
  const amp = fine ? 0.011 : 0.015, band = fine ? 'D' : i < 5 ? 'A' : i < 10 ? 'B' : 'C';
  const speed = (i % 3 === 0 ? -1 : 1) * 0.6 * Math.sqrt(9.81 * k), phase = 6.2832 * fract1(i * 0.754877 + 0.17);
  return `  tr = e${band} * kwTrain(vec2(${f(k * Math.sin(ang))}, ${f(k * Math.cos(ang))}), ${f(phase)} ${i % 2 ? '-' : '+'} b${band} + T * ${f(speed)}, P, Px, Py); `
    + `gq += ${f(amp * Math.cos(ang))} * tr; gx += ${f(amp * Math.sin(ang))} * tr;`;
}).join('\n');
// the body's skin. THE FACE: water lit through by the hole (by the place: height and x) from the crest far down:
// a pale jade under the crest, luminous turquoise over the upper two thirds, a deep clear teal low. On it THE
// FOAM'S LACING, drawn out up the slope: crisp lines in three sizes (16 m, 5.5 m, 1.8 m apart) of uneven width
// (ropes of foam, threads between them, small patches full of bubbles' holes where lines meet), woven by
// noises with no lattice to be told so that they cross, meet and part (long open meshes), denser toward the crest,
// broken by gaps; a size leaves the picture when the pixel can no longer show it and the coarser, still sharp,
// carries on. Short-crested wavelets that take the sky and GLINT with the burning crest; at the foot tongues and
// patches of white water of uneven reach. THE BACK: behind the crest a deep rich teal, deeper than
// the far sea (near water, little air), with no image of the hole and next to no mirror, and a sparse crisp lacing
// carried over from the crest; down its lower part the calm sea's own look (by the sea part's rule) with sharp
// glints of the hole.
const BODY_FRAG = /* glsl */`precision highp float;
//<LIGHT>
${GLSL_HASH}${GLSL_VALUE_NOISE}
${PARS}
${SEA_WATER_GLSL}
varying vec3 vW; varying vec3 vL; varying vec2 vP;
// one train of wavelets at P (metres east, metres along the flow): the cosine of its phase, faded by how much of
// its phase one pixel covers (Px, Py: what one pixel spans of P east and down the picture)
float kwTrain(vec2 K, float ph, vec2 P, vec2 Px, vec2 Py) {
  return (1. - smoothstep(0.75, 2.0, max(abs(dot(K, Px)), abs(dot(K, Py))))) * cos(dot(K, P) + ph);
}
// a noise with no lattice to be told: the mean of two value noises on lattices turned 31 degrees one way and 23
// the other IN CELL SPACE (the cells stay as long-drawn as they are handed in), spread again to the range of one
float kwN(vec2 c) {
  vec2 a = vec2(c.x * 0.857 - c.y * 0.515, c.x * 0.515 + c.y * 0.857), b = vec2(c.x * 0.921 + c.y * 0.391, c.y * 0.921 - c.x * 0.391);
  return 0.5 + 0.7 * (vnoise(a + 17.3) + vnoise(b + 51.9) - 1.);
}
// a crisp line where the noise n crosses its middle: half as wide as w in the noise's own measure, edged by the
// pixel (fw: what one pixel spans of n), never under a pixel and a half wide (then that wide, and as much fainter)
float kwLine(float n, float w, float fw) {
  float we = max(w, 0.75 * fw), aa = 0.6 * fw + 1e-4;
  return (w / we) * (1. - smoothstep(we - aa, we + aa, abs(n - 0.5)));
}
void main() {
  float x = vL.x, xi = vL.y, T = uTime, hgt = vW.y, dep = max(WH - vP.y, 0.), hf = clamp(vP.y / WH, 0., 1.);
  vec3 toP = vW - cameraPosition; float dist = sqrt(max(dot(toP, toP), 1e-4)); vec3 d = toP / dist;
  float env = kwEnv(x, xi);
  vec3 sw = kwSwell(x, xi);
  // the skin's own coordinates: metres east, and metres up the slope less what the water has run (it runs north
  // through the wave's form: up the face, over the crest, down the back)
  vec2 P = vec2(x, vL.z - T * ${f(FLOW)});
  vec2 Px = dFdx(vL.xz), Py = dFdy(vL.xz);
  // a pattern of cells c (east, along the flow) is drawn while a pixel covers under an eighth of a cell and has
  // faded to its mean when it covers a third (its thinnest feature, half a cell, is then a pixel and a half)
#define KW_SEEN(c) (1. - smoothstep(0.12, 0.33, sqrt(max(max(dot(Px / c, Px / c), dot(Py / c, Py / c)), 1e-10))))
  float sL = KW_SEEN(vec2(36., 330.)), s1 = KW_SEEN(vec2(16., 150.)), s2 = KW_SEEN(vec2(5.5, 48.)), s3 = KW_SEEN(vec2(1.8, 15.));
  float huge = vnoise(P * vec2(0.0065, 0.0017) + uSeed.xy * 9.);
  float nL = mix(0.5, kwN(P / vec2(36., 330.) + uSeed.zw * 9.), sL);
  float warp = kwN(P * vec2(0.05, 0.016) + 7.1) - 0.5;
  // THE FOAM'S LACING: three sizes of one net (lines 16 m, 5.5 m and 1.8 m apart, drawn out up the slope). Its
  // lines are thin and crisp (edged by the pixel), never under a pixel and a half wide (a thinner one is drawn that
  // wide and as much fainter), broken by gaps. The three lattice-free noises that weave them (cells 16 by 44 m,
  // 5.5 by 15 m, 1.8 by 5 m):
  float n1 = kwN(P / vec2(16., 44.) + vec2(warp * 1.5, 3.3)), n2 = kwN(P / vec2(5.5, 15.) + vec2(warp * 2.5, 11.9)), n3 = kwN(P / vec2(1.8, 5.) + vec2(warp * 3., 23.1));
  float nM = mix(0.5, n2, s2), nT = mix(0.5, n3, s3);
  float face = smoothstep(-30., -10., xi);                              // 1 on the face and over the crest, 0 on the back
  // how much of it: next to nothing at the foot, more with height, most right under the crest, in denser and
  // thinner reaches; on the back a little of the crest's foam carried over (sparse: the deep water shows), thinning down it
  float cover = mix(0.035 * smoothstep(0.24, 0.5, hf) + 0.05 * exp(min(xi, 0.) / 150.), 0.03 + 0.17 * smoothstep(0.05, 0.75, hf) + 0.20 * smoothstep(0.75, 1., hf), face);
  cover *= clamp(1. + 2.2 * (nL - 0.5) + (huge - 0.5), 0., 2.);
  float wl = 0.006 + 0.07 * cover, gap = smoothstep(0.30, 0.44, warp + 0.5);
  // (the lines run up the slope, one to a mesh's width, each pushed east and west by the noise as it goes; each of
  // the two larger sizes is two such families pushed opposite ways, so that their lines cross, meet and part: long
  // open meshes)
  float m1 = kwN(P / vec2(16., 44.) + vec2(9.7 - warp * 1.5, 41.3)), m2 = kwN(P / vec2(5.5, 15.) + vec2(31.1 - warp * 2.5, 5.7));
  float q1 = P.x / 16. + 0.8 * n1 + 1.5 * nL, r1 = P.x / 16. + 0.37 - 0.8 * m1 + 1.5 * nL, w1 = min(3. * wl, 0.09);
  float q2 = P.x / 5.5 + 0.8 * n2 + 0.9 * n1, r2 = P.x / 5.5 + 0.61 - 0.8 * m2 + 0.9 * n1, q3 = P.x / 1.8 + 0.8 * n3 + 0.9 * n2;
  float fq1 = fwidth(q1), fr1 = fwidth(r1), fq2 = fwidth(q2), fr2 = fwidth(r2), fq3 = fwidth(q3);
  // UNEVEN WIDTHS: along its way a line swells to a rope of foam and thins to a thread (by the other family's noise)
  float ua = 0.45 + 2.6 * smoothstep(0.50, 0.85, m1), ub = 0.45 + 2.6 * smoothstep(0.50, 0.85, n1), uc = 0.45 + 2.2 * smoothstep(0.50, 0.85, m2);
  float a1 = kwLine(fract(q1), w1, fq1), b1 = kwLine(fract(r1), w1, fr1), l1 = max(a1, b1) * s1;
  float rope = max(kwLine(fract(q1), 0.3 * w1 * ua, fq1), kwLine(fract(r1), 0.3 * w1 * ub, fr1)) * s1;   // (the largest size's solid cores)
  float l2 = max(kwLine(fract(q2), wl * ua, fq2), kwLine(fract(r2), wl * ub, fr2)) * s2, l3 = kwLine(fract(q3), wl * uc, fq3) * s3, fine = max(l2, l3);
  // WHERE LINES MEET: small crisp patches of foam (where two widened lines of a size cross), full of bubbles' holes
  float bub = vnoise(P * vec2(2.3, 1.1) + 3.7), holes = clamp((bub - 0.38) / (fwidth(bub) + 1e-4) + 0.5, 0., 1.), wk = min(5. * wl, 0.16);
  float knot = max(kwLine(fract(q2), wk, fq2) * kwLine(fract(r2), wk, fr2) * s2, a1 * b1 * s1) * holes;
  // (a line of the largest size is a band of foam from afar; from near, where the finer sizes show, its inside is
  // a solid rope with their lacing beside it over a thin veil, the water showing through)
  float lace = max(max(l1 * mix(1., 0.12 + 0.88 * fine, s2), fine), max(rope, knot)) * gap;
  // (a size that the pixel can no longer show leaves the picture to the coarser, still sharp; past the coarsest,
  // far off, the net's mean: the face's foam in soft reaches)
  float foam = lace + (1. - s1) * 12. * wl * mix(0.15, 1., face);        // (the back's far mean much the thinner: it keeps its deep tone)
  // THE FOOT: tongues and patches of churned white water of uneven reach (to 13 m of height), with gaps between
  float reach = 13. * smoothstep(0.38, 0.8, 0.6 * vnoise(vec2(x / 85. + uSeed.x, T * 0.03)) + 0.4 * vnoise(vec2(x / 21. + 5.5, T * 0.07 + 2.)));
  float apron = face * smoothstep(0.3, 1.5, reach) * (1. - smoothstep(0.55 * reach, reach + 0.3, hgt)) * (0.3 + 0.7 * smoothstep(0.44, 0.52, nM));
  foam = clamp(max(foam, apron), 0., 1.);
  float milky = clamp(2. * cover, 0., 1.);                              // air under the skin where the foam is dense
  // WHAT LIES ACROSS THE FLOW: the skin's wavelets (the trains dealt above: long ones stronger in the water's
  // large patches, middle and short ones in its smaller ones, each bent a little by a slow noise, never enough to
  // turn a crest round). gq, gx: the slopes they give the skin along the flow and eastward.
  float calmB = mix(0.45, 1., face);                                    // (the back's skin is the calmer)
  float eA = calmB * (0.5 + huge), eB = calmB * (0.4 + 1.2 * nL), eC = calmB * (0.4 + 1.2 * nM), eD = calmB;
  float bA = 4. * huge, bB = 3. * nL, bC = 2. * nM, bD = 2.5 * nT;
  float gq = 0., gx = 0., tr = 0.;
${WAVELETS}
  // the skin's normal: the law's slope with the part's swells, tipped by the wavelets in the skin's own frame
  float lift = kwLift(x), sl = vP.x * lift + sw.z * env;                // (the law's slope, lifted with the uneven crest)
  vec3 tq = vec3(0., -sl, -1.) * inversesqrt(1. + sl * sl);             // along the flow: north, up the face
  vec3 N = normalize(normalize(vec3(-sw.y * env, 1., -sl)) - vec3(gx, 0., 0.) - tq * gq);
  // THE MIRROR, by the sea part's own rule: the sky by the angle of view; what of the hole is brighter than white
  // is thrown back at any angle on the face (on the back only as far as its faint mirror goes)
  float lit = kdLit(vW + vec3(0., 2., 0.)), ndl = max(dot(N, KD_HOLE_DIR), 0.);
  float fr0 = seaMirror(dot(-d, N)), fr = mix(0.02 * fr0, 0.5, face) * fr0;     // (running water: half a mirror on the face; the back next to none: its own deep body shows at every angle)
  vec3 r = reflect(d, N);
  // GLINTS OF THE BURNING CREST on the face: where a wavelet's flank mirrors the burning foot of the crest's
  // spray (its first 20 m over the uneven crest) toward the eye: sharp gold flecks along the wavelets' ridges
  float over = vW.y + r.y * max(xi, 1.) / max(-r.z, 0.05) - WH * lift;
  // (drawn only while the pixel still shows the fine ripple that makes them: from afar there are none)
  float glint = face * smoothstep(0.03, 0.12, -r.z) * smoothstep(-3., 1., over) * (1. - smoothstep(6., 22., over)) * fr0 * s3;
  float under = 1. - smoothstep(-0.12, 0., r.y);     // a mirror that looks down shows the calm sea, which mirrors the sky in its turn
  r.y = abs(r.y) + 0.004; r = normalize(r);
  float open = kdOpen(vW, r) * (1. - 0.45 * under);
  // (the back is rough running water that faces the hole: it carries no image of the hole, only the plain air's)
  vec3 skyR = mix(kdAir(r), kdSky(r), face), hot = max(skyR - vec3(0.85), 0.) * open, mirror = mix(KD_DEEP * 1.6, min(skyR, vec3(0.85)), open);
  // THE WATER UNDER THE MIRROR. The face's own body, before the hole's light through it (below): deep blue low,
  // deep blue-green higher. The back's, high up: a deep rich teal, deeper than the far sea (near water, little
  // air), a little of the hole's light in it; down the back it goes to THE CALM SEA'S OWN LOOK BY THE SEA PART'S OWN RULE (its SEA_WATER_GLSL, imported:
  // seaWater, seaMirror and the sand's two colours; the bed's light and forms are typed here, the sea part does not hand them out: a lit bed of pale sand in large pale and dark forms, seen through so many metres of
  // water that takes the red first): the bed lies knee-deep under the back's lower third, as under the sea, and
  // sinks away above it, so the water goes from the sea's aquamarine through its teal to the back's lit deep teal.
  vec3 deepF = mix(vec3(0.014, 0.046, 0.084), KD_DEEP * 1.3, smoothstep(0.05, 0.5, hf)) * (0.8 + 0.5 * milky) + vec3(0.004, 0.030, 0.030) * milky;
  vec3 deepB = vec3(0.008, 0.062, 0.078) * (0.55 + 0.55 * lit) + vec3(0.016, 0.034, 0.022) * lit * ndl;   // deep rich teal (near water, deeper than the far sea), a little of the hole's light in it
  float big = vnoise(vW.xz * vec2(0.0034, 0.0083) + uSeed.xy * 3.), sink = smoothstep(0.26, 0.62, hf);
  float bedDepth = ${f(SEA.depth)} - 0.42 * smoothstep(0.54, 0.84, big) + 0.55 * (1. - smoothstep(0.14, 0.44, big)) + 40. * sink * sink;
  vec3 dr = refract(d, N, 0.75);
  vec3 sand = mix(SEA_SAND_DARK, SEA_SAND_PALE, clamp(0.47 + 0.4 * smoothstep(0.45, 0.85, big), 0., 1.));
  vec3 seaLook = seaWater(sand * (KD_GOLD * (0.44 * lit) + vec3(0.084, 0.122, 0.168)), bedDepth / max(-dr.y, 0.3), lit);
  vec3 water = mix(mix(seaLook, deepB, smoothstep(0.42, 0.72, hf)), deepF, face);
  // the swells' and the wavelets' sides that turn up to the sky take its fill, those that turn down lose it
  water += vec3(0.050, 0.085, 0.120) * clamp((N.y - inversesqrt(1. + vP.x * vP.x)) * 3.5, -0.15, 1.) * mix(0.4, 1., face);
  water *= 1. + 5. * sw.z * env * face;                                 // (the swells' relief on the face, shaded: their flatter sides lighter)
  // THE HOLE'S LIGHT THROUGH THE WAVE (by the place alone: the height on the face and x; the hole stands due north
  // behind the whole wave, and the glow is laid brightest about x = 0, where the route climbs: a placing to be seen
  // from the way, the same on every seed). The face glows from within from the crest far down: a pale sea-green
  // jade right under the crest (the lead's colour), luminous turquoise over the upper two thirds, a tenth of it
  // left down to 16 m over the foot (a deep clear teal), and a gold-white thread at the very top (a band finer than a pixel keeps its mean).
  // The light comes through the skin: the wavelets' slopes and the water's long thick and thin places show in it.
  float bx = exp(-x * x / ${NEAR2}), up = face * (0.10 * smoothstep(0., 0.04, hf) + 0.16 * smoothstep(0., 0.30, hf) + 0.74 * smoothstep(0.25, 0.95, hf));
  float fd = 0.5 * fwidth(dep), Lg = 2.5 + fd, crown = up * up * up * bx;
  vec3 glow = mix(vec3(0.010, 0.240, 0.235) * (0.55 + 0.45 * bx), vec3(0.070, 0.300, 0.165), crown) * (up * (0.8 + 0.4 * nL) * clamp(1. + 9. * gq, 0.35, 1.7))
    + vec3(0.004, 0.052, 0.058) * (face * smoothstep(0.08, 0.6, hf))
    + vec3(1.0, 0.80, 0.46) * (2.0 * 2.5 / Lg * exp(-dep / Lg) * face * mix(0.35, 1., bx));
  vec3 fill = vec3(0.165, 0.225, 0.300);                                // the sky's fill on white water in the wave's shade
  vec3 foamC = (fill * (0.7 + 0.3 * N.y) + KD_GOLD * mix(0.5, 1., face) * lit * (0.15 + 0.85 * ndl)) * (0.85 + 0.3 * nT) + glow * 0.9
    + vec3(1.0, 0.86, 0.60) * (0.3 * crown);                            // (under the crest the burning spray lights the foam from above)
  // THE LOWER BACK'S GLITTER: sharp glints of the hole on the running water, brightest along the hole's
  // bearing: each a short crisp dash on a wavelet's flank (where its slope along the flow is 0.018 and it is all
  // but level eastward; never under a pixel and a half wide); far off, where the wavelets are finer than the
  // pixel, their mean: a soft warm sheen
  // (only down the back's lower part, where it wears the sea's look: the upper back, the shoulders behind the
  // crest, keeps its deep tone at every angle)
  float fg = fwidth(gq) + 1e-5, gw = max(0.0035, 0.75 * fg), path = (1. - face) * lit * (0.35 + 0.65 * exp(-x * x / 45000.)) * (1. - smoothstep(0.42, 0.72, hf));
  float glit = path * ((0.0035 / gw) * (1. - smoothstep(gw - 0.6 * fg, gw + 0.6 * fg, abs(gq - 0.018))) * (1. - smoothstep(0.012, 0.03, abs(gx))) + 0.012 * (1. - s2));
  vec3 col = mix(mix(water + glow, mirror, fr) + hot * mix(fr, 1., 0.7 * face) + vec3(2.0, 1.36, 0.42) * (glint * bx) + vec3(2.0, 1.72, 1.24) * glit, foamC, foam);
  // THE BACK'S TOE DISSOLVES INTO THE SEA: over its last 12 m of height (some 110 m of ground) the back thins to
  // nothing and the sea part's own surface, which lies under it, shows: no edge where the two meet
  float alpha = mix(smoothstep(0.8, 12., hgt), 1., face);
  gl_FragColor = vec4(kdHaze(col, vW), alpha);
  if (alpha < 0.004) discard;
}`;

// ---- THE SPRAY AND THE MIST: eight large sheets in one mesh. position = (x, v, which): v runs from a sheet's
// root (0) to its top (1). Sheets 0 to 2 are THE BURNING CREST: three curtains that stand across the wind on the
// lip and just behind it, on the UNEVEN crest (the law's lift, kwLift: their roots rise with it, and they stand
// 108 m high in its saddles and up to 156 m on its peaks), rising steeply and leaning back north a little more
// with height; on them ONE TORN VEIL along the whole crest, white-hot at its root (the lip's thin burning
// line), thinner toward its ragged top, slit along the wind into streaming strands,
// and bright droplets carried off downwind. Sheets 3 to 5 are banks of mist over the foot, 3 to 30 m high, uneven
// in reach, with gaps. Sheet 6 is the next wave's own burning fringe on its own crest. Sheet 7 is THE FALLING
// CURTAIN: spray that falls from the lip down the upper face where the uneven crest peaks. All are MEDIA: the lens flies
// through them head-on. WHERE THE LAID LINE PASSES THROUGH A SHEET, THE SHEET IS THIN BY PLACE (the law's WAY: clear
// within WAY.clear metres of the line, whole from WAY.whole metres off it; the line's height in the wave's own frame
// is the law's wayHeight, written out below as KW_WAY): a parting in the veil over the saddle and a gap in the
// foot's mist, standing in the wave's frame, the same for every eye, seed and pace. Of the eye they read only the
// pixel's footprint and, inside the kit's near range (WAY.eye), their true distance, so that no sheet is cut by the
// lens's near plane. Their light is by the place (the height over the crest, and x). The roots' places and heights
// are the law's (computed here).
const SPRAY_XI = [14, 2, -12], MIST_XI = [WAVE.face + 30, WAVE.face, WAVE.face - 30], SPRAY_H = 150;
// (the falling curtains' rows: nine places down the upper face, 16 to 116 m south of the crest line, with the law's heights there)
const FALL_XI = Array.from({ length: 9 }, (_, j) => 16 + 100 * j / 8), FALL_H = FALL_XI.map(waveHeight);
const NEXT_OFF = 5300, NEXT_HALF = 24000;       // the next wave's own skyline: the law's lift read 5.3 km along; its half length
const pick = (k0, a) => `(k < ${f(k0 + 0.5)} ? ${f(a[0])} : k < ${f(k0 + 1.5)} ? ${f(a[1])} : ${f(a[2])})`;
// (the law's way over the wave, for the sheets' vertices: kwWay(xi) is the law's wayHeight between the table's ends)
const WAY_GLSL = /* glsl */`
const float KW_WAY[${WAY.table.length}] = float[${WAY.table.length}](${WAY.table.map(f).join(', ')});
float kwWay(float xi) {
  float t = clamp((${f(WAY.from)} - xi) / ${f(WAY.step)}, 0., ${f(WAY.table.length - 1.001)}); int i = int(t);
  return mix(KW_WAY[i], KW_WAY[i + 1], t - float(i));
}`;
const SPRAY_VERT = /* glsl */`
${PARS}${WAY_GLSL}
varying vec3 vW; varying vec4 vS; varying vec2 vLf; varying float vWay;
void main() {
  float x = position.x, v = position.y, k = position.z;
  float ends = 1. - smoothstep(${f(WAVE.halfWidth - ENDS)}, ${f(WAVE.halfWidth)}, abs(x)), lift = kwLift(x);
  vec3 p = vec3(0.); vLf = vec2(lift, 1.);
  if (k < 2.5) {
    // the crest's sheets stand on the uneven crest (the law's lift) and rise higher where it peaks
    float xi0 = ${pick(0, SPRAY_XI)}, h0 = ${pick(0, SPRAY_XI.map(waveHeight))}, hf = 0.72 + 1.5 * (lift - 1.), hk = ${f(SPRAY_H)} * ends * hf;
    float y0 = h0 * lift * ends + kwSwell(x, xi0).x * kwEnv(x, xi0) - 2.;
    p = vec3(x, y0 + hk * v, xi0 - hk * ((0.12 + 0.1 * k) * v + 0.25 * v * v));
    vLf.y = hf;
  } else if (k > 6.5) {
    // the falling curtain: it hangs from the lip down the upper face, a metre and a half over the water (the law's
    // heights at its nine rows, times the lift), thrown out a little at its middle
    float xi0 = 16. + 100. * v, h0 = ${FALL_H.map((h, j) => (j < 8 ? `v < ${f((j + 0.5) / 8)} ? ${f(h)} : ` : f(h))).join('')};
    p = vec3(x, h0 * lift * ends + kwSwell(x, xi0).x * kwEnv(x, xi0) + 1.5 + 5. * sin(3.14159 * v), xi0);
  } else if (k > 5.5) {
    float l2 = kwLift(x + ${f(NEXT_OFF)});                     // the next wave's fringe, on its own uneven crest
    p = vec3(x, (${f(WAVE.height)} * l2 - 3.) * ends + 170. * ends * v, ${f(-WAVE.next)} - 30. * v);
  } else {
    // the mist's banks over the foot: uneven in height (3 to 30 m) and in reach (14 m either way)
    float xi0 = ${pick(3, MIST_XI)} + 14. * sin(x * 0.0071 + k * 2.3 + uSeed.x), h0 = ${pick(3, MIST_XI.map(waveHeight))};
    float a = 0.5 + 0.5 * sin(x * 0.0113 + k * 1.7 + uSeed.z), b = 0.5 + 0.5 * sin(x * 0.0037 + k * 2.9 + uSeed.y);
    float hk = (3. + 27. * a * b) * ends;
    p = vec3(x, h0 * ends - 0.8 + hk * v, xi0 - 4. * v);
  }
  vS = vec4(x, v, k, ends);
  // (how high this place stands over the laid line, where the line runs past it: p.z is metres south of the crest
  // line; beyond the table's ends the line is far off and no sheet is thinned)
  vWay = (p.z > ${f(WAY.from)} || p.z < ${f(WAY.to)}) ? 1e4 : p.y - kwWay(p.z);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SPRAY_FRAG = /* glsl */`precision highp float;
//<LIGHT>
${GLSL_HASH}${GLSL_VALUE_NOISE}
${PARS}
varying vec3 vW; varying vec4 vS; varying vec2 vLf; varying float vWay;
void main() {
  float x = vS.x, v = vS.y, k = vS.z, T = uTime;
  vec3 toP = vW - cameraPosition; float dist = sqrt(max(dot(toP, toP), 1e-4));
  float alpha = 0.; vec3 col = vec3(0.);
  float fx = fwidth(x), fine = 1. - smoothstep(2.5, 8., fx);            // fx: metres along the crest under one pixel
  if (k < 2.5) {
    float y = v * ${f(SPRAY_H)} * vLf.y, xs = x - 0.35 * y - 0.0035 * y * y;    // all of it leans one way (east), trailing off further as it rises
    float n1 = vnoise(vec2(xs / 70. + k * 5.1 + uSeed.w * 3., T * 0.04 + k));
    // four sizes of torn pattern (cells 16, 5, 1.8 and 0.7 m across, a little drawn out up the wind), each fading
    // to its mean before a cell of it is under three pixels
    float n2 = mix(0.5, vnoise(vec2(xs / 16. + k * 9.7, y / 40. - T * 0.25)), fine);
    float n3 = mix(0.5, vnoise(vec2(xs / 5. + k * 3.3, y / 14. - T * 0.6)), 1. - smoothstep(0.8, 2.2, fx));
    float n4 = mix(0.5, vnoise(vec2(xs / 1.8 + k * 4.3, y / 5.5 - T * 1.1)), 1. - smoothstep(0.3, 0.8, fx));
    float n5 = mix(0.5, vnoise(vec2(xs / 0.7 + k * 7.9, y / 1.3 - T * 2.4)), 1. - smoothstep(0.11, 0.3, fx));
    // ONE VEIL along the whole crest, rooted on the lip, of very uneven height (its top 25 to 100 m up, by a slow
    // noise). PLUMES swell out of it, never apart from it: at most one to a cell of the curtain (cells 90, 125 and
    // 160 m; one in three empty), each with a place, a width (25 to 86 m) and a height of its own (75 to 140 m),
    // breathing; all of it higher where the uneven crest peaks
    float topF = 25. + 75. * n1;
    float W = 90. + 35. * k, cx = xs / W + k * 3.7 + uSeed.w * 5.;
    float id = floor(cx), fc = cx - id;
    vec2 h = hash22(vec2(id, k * 17.3 + 5.)), h2 = hash22(vec2(id + 0.5, k * 9.1 + 2.));
    float plume = smoothstep(0.3, 0.45, h2.y) * (1. - smoothstep(0.35, 1., abs(fc - (0.38 + 0.24 * h.x)) / (0.14 + 0.13 * h.y) + (n2 - 0.5) * 0.7));
    float top = (topF + ((75. + 65. * h2.x) * (0.9 + 0.1 * sin(T * 0.23 + h.x * 6.2832)) - topF) * plume) * vLf.y;
    float tv = y / top, tc = clamp(tv, 0., 1.);
    // THE VEIL: whole and dense at its root (no gap ever reaches the lip), thinner and more see-through toward its
    // top (the stars show through it), its top torn, its edges one pixel wide at any distance. ITS INSIDE: long thin
    // slits along the wind, more of them with height, so that it reads as streaming strands; round it a faint mist.
    // Far off, where the pattern is finer than a pixel, its mean: a soft glowing ragged fringe.
    float e = 0.36 * n2 + 0.28 * n3 + 0.21 * n4 + 0.15 * n5 - (tv - 0.12), aa = clamp(1.3 * fwidth(e), 0.008, 0.2);
    float g = 0.5 * mix(0.5, vnoise(vec2(xs / 5. + k * 2.1 + 40., y / 45. - T * 0.3)), 1. - smoothstep(1., 2.8, fx)) + 0.3 * n4 + 0.2 * n5;
    float eh = g - mix(0.10, 0.50, tc), ah = clamp(1.3 * fwidth(eh), 0.008, 0.2);
    float veil = smoothstep(-aa, aa, e) * smoothstep(-ah, ah, eh);
    alpha = max(veil * mix(0.93, 0.30, smoothstep(0.05, 0.75, tc)), 0.16 * smoothstep(-0.26, 0.02, e)) * smoothstep(0., 0.02, v) * (1. - smoothstep(0.85, 1., v));
    // ITS LIGHT, by the place alone (the height over the crest and x): the hole stands behind it. Within some
    // 1500 m of x = 0 it burns: white-hot in its lowest 8 m (the lip's thin burning line, in strands of up to almost three times white: it blooms), pale
    // gold above, dim gold in the thin trailing tops; far along the crest it is pale and cold
    float bx = exp(-x * x / ${NEAR2});
    vec3 burn = mix(vec3(0.40, 0.27, 0.13), mix(vec3(0.85, 0.60, 0.28), vec3(2.9, 2.5, 1.8), exp(-y / 8.) * smoothstep(0.15, 0.6, 0.5 * n3 + 0.5 * n4)), exp(-y / 45.));
    col = mix(vec3(0.13, 0.17, 0.25) * (0.7 + 0.8 * exp(-y / 30.)), burn, bx) * (0.62 + 0.36 * n3 + 0.40 * n4);   // (its strands show in its light)
    // DROPLETS thrown up and off downwind: bright clots of three sizes (1.7, 0.8 and 0.45 m; the two larger drawn
    // out into short streaks), one at a jittered place in one cell in three, in the veil and well beyond its top; a bead is never under a pixel across
    // (it dims as it is widened, and is gone when it would fill its cell)
    vec2 c1 = vec2((xs - T * 3.) / 14. + k * 13.1, (y - T * 7.) / 16.), i1 = floor(c1), f1 = (c1 - i1 - 0.25 - 0.5 * hash22(i1 + 3.7)) * vec2(1., 0.3);
    vec2 c2 = vec2((xs - T * 3.) / 6.0 + k * 5.7 + 31., (y - T * 6.) / 7.), i2 = floor(c2), f2 = (c2 - i2 - 0.25 - 0.5 * hash22(i2 + 9.1)) * vec2(1., 0.45);
    vec2 c3 = vec2((xs - T * 3.) / 2.5 + k * 3.9 + 57., (y - T * 5.) / 2.8), i3 = floor(c3), f3 = c3 - i3 - 0.25 - 0.5 * hash22(i3 + 5.3);
    float r1 = max(0.06, 0.6 * fx / 14.), r2 = max(0.07, 0.6 * fx / 6.0), r3 = max(0.09, 0.6 * fx / 2.5);
    float bead = step(0.66, hash12(i1 + 71.)) * (1. - smoothstep(0.5 * r1, r1, sqrt(max(dot(f1, f1), 1e-8)))) * min(1., 0.06 / r1) * (1. - smoothstep(0.2, 0.42, r1))
      + step(0.70, hash12(i2 + 17.)) * (1. - smoothstep(0.5 * r2, r2, sqrt(max(dot(f2, f2), 1e-8)))) * min(1., 0.07 / r2) * (1. - smoothstep(0.2, 0.42, r2))
      + step(0.74, hash12(i3 + 43.)) * (1. - smoothstep(0.5 * r3, r3, sqrt(max(dot(f3, f3), 1e-8)))) * min(1., 0.09 / r3) * (1. - smoothstep(0.2, 0.42, r3));
    bead = clamp(bead, 0., 1.) * smoothstep(-0.75, -0.2, e) * (1. - smoothstep(1.3, 2.2, tv)) * smoothstep(0., 0.02, v);
    col = mix(col, mix(vec3(0.5, 0.6, 0.75), vec3(2.8, 2.4, 1.7), bx), bead); alpha = max(alpha, 0.95 * bead);
  } else if (k > 6.5) {
    // THE FALLING CURTAINS: where the uneven crest peaks (the law's lift over some 1.05) the lip throws forward and
    // spray falls down the upper face: strands drawn out down the slope (14, 4.5 and 1.4 m across), falling by the
    // clock, their edges crisp, longer here and shorter there, none in the saddles (none where the route crosses)
    float q = v * 100., c0 = vnoise(vec2(x / 55. + uSeed.w * 7., T * 0.03));
    float s1 = mix(0.5, vnoise(vec2(x / 4.5 + 3.3, (q - T * 9.) / 34.)), 1. - smoothstep(0.7, 2., fx));
    float s2 = mix(0.5, vnoise(vec2(x / 1.4 + 9.1, (q - T * 12.) / 14.)), 1. - smoothstep(0.22, 0.6, fx));
    float s0 = mix(0.5, vnoise(vec2(x / 14. + 5.9, (q - T * 7.) / 70.)), 1. - smoothstep(2.2, 6., fx));        // (fingers 14 m across: what is told of it from afar)
    float e7 = 0.42 * s0 + 0.33 * s1 + 0.25 * s2 + 0.35 * (c0 - 0.5) - (0.22 + 0.36 * v), a7 = clamp(1.3 * fwidth(e7), 0.008, 0.2);
    alpha = mix(0.6, 0.9, 1. - smoothstep(0.7, 2., fx)) * smoothstep(-a7, a7, e7) * smoothstep(1.05, 1.13, vLf.x) * smoothstep(0.25, 0.5, c0) * smoothstep(0., 0.05, v) * (1. - smoothstep(0.8, 1., v));
    // (white water in the wave's own shade, like the foam of the face; only its top, under the lip, takes the burning)
    col = (vec3(0.27, 0.36, 0.44) + mix(vec3(0.), vec3(1.6, 1.3, 0.8), exp(-q / 11.) * exp(-x * x / ${NEAR2}))) * (0.65 + 0.4 * s1 + 0.3 * s2);
  } else if (k > 5.5) {
    // the next wave's spray, far off: a burning ragged fringe on its own uneven crest: plumes of 40 to 170 m with
    // gaps between them, leaning the same way, their edges crisp
    float y = v * 170., xs = x - 0.5 * y;
    float n0 = vnoise(vec2(xs / 330. + 3.1 + uSeed.w, T * 0.015)), n1 = mix(0.5, vnoise(vec2(xs / 85. + 7.7, y / 120. - T * 0.05)), 1. - smoothstep(14., 34., fx));
    float e6 = (0.25 + 0.75 * n0) * (0.6 + 0.8 * n1) - (0.1 + 0.9 * v), a6 = clamp(1.3 * fwidth(e6), 0.02, 0.3);
    alpha = 0.9 * smoothstep(-a6, a6, e6) * smoothstep(0., 0.04, v);
    col = mix(vec3(0.16, 0.20, 0.28), mix(vec3(0.75, 0.52, 0.24), vec3(3.2, 2.7, 1.9), exp(-v * 2.2)), 0.4 + 0.6 * exp(-x * x / 3.2e7));
  } else {
    // the banks of mist over the foot: billows, densest low, ragged at their tops; a bank stands here and not
    // there (gaps), and each is as high and reaches as far as the vertex shader made it: never a ruled line
    float g0 = vnoise(vec2(x / 210. + k * 3.1 + uSeed.x, T * 0.01));
    float n1 = vnoise(vec2(x / 26. + k * 5.3, v * 1.2 - T * 0.1));
    float n2 = mix(0.5, vnoise(vec2(x / 7. + k * 2.9, v * 2.6 - T * 0.2)), 1. - smoothstep(1.5, 5., fx));
    float bil = n1 * 0.65 + n2 * 0.35;
    alpha = 0.85 * (1. - smoothstep(0.25, 1., v + (bil - 0.5) * 0.9)) * smoothstep(0., 0.06, v) * smoothstep(0.30, 0.55, g0 + 0.25 * (n1 - 0.5));
    col = vec3(0.25, 0.32, 0.40) * (0.8 + 0.4 * bil) + KD_GOLD * 0.6 * kdLit(vW);
  }
  // THE WAY THROUGH, by the place (the law's WAY): thin by the distance to the laid line where it passes through this
  // sheet (x is metres off the route's plane, vWay metres over the line). The eye: inside the kit's near range only.
  alpha *= vS.w * smoothstep(${f(WAY.clear)}, ${f(WAY.whole)}, sqrt(x * x + vWay * vWay)) * smoothstep(${f(WAY.eye[0])}, ${f(WAY.eye[1])}, dist);
  gl_FragColor = vec4(kdHaze(col, vW), alpha);
  if (alpha < 0.004) discard;
}`;
// the sheets' grid: columns of 16 m to 800 m either side of the route, then 15% wider each; the spray's sheets of
// 10 rows, the falling curtain's of 8, the mist's of 3; drawn from the far side to the near as the lens meets them (from the south)
function sprayGrid() {
  const xs = [0]; let step = 16;
  while (xs[xs.length - 1] < WAVE.halfWidth) { const x = xs[xs.length - 1]; if (x >= 800) step *= 1.15; xs.push(Math.min(x + step, WAVE.halfWidth)); }
  const cols = [...xs.slice(1).reverse().map((x) => -x), ...xs], pos = [], idx = [];
  for (const [k, nv] of [[6, 2], [2, 10], [1, 10], [0, 10], [7, 8], [5, 3], [4, 3], [3, 3]]) {
    const base = pos.length / 3;
    for (let i = 0; i < cols.length; i++) for (let j = 0; j <= nv; j++) pos.push(cols[i], j / nv, k);
    for (let i = 0; i < cols.length - 1; i++) for (let j = 0; j < nv; j++) {
      const A = base + i * (nv + 1) + j, B = A + 1, C = A + nv + 1, D = C + 1;
      idx.push(A, C, B, B, C, D);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  return g;
}
// ---- THE NEXT WAVE: a far copy of the profile (the law's heights row by row), seen from over the crest under the
// hole as this wave was seen from afar: A FAR WAVE, not a band. Its crest is uneven by the law's lift read
// NEXT_OFF metres along (a skyline of its own); the hole stands behind it too, so its face is lit through
// (luminous turquoise above deep teal, in long shafts), with long pale streaks of foam down it, a gold-white thread
// along its crest (its spray is the seventh sheet of the spray's mesh), banks of pale mist of uneven height with
// gaps at its foot, and the air laying it back (kdHaze). It runs NEXT_HALF metres either way: its ends are never
// in the picture and are lost in the air. (It is far north of this wave: the shared kdLit does not know it.)
const NEXT_VERT = /* glsl */`
${PARS}
attribute vec3 aProf;
varying vec3 vW; varying vec4 vL; varying float vLift;
void main() {
  vec3 p = position; vLift = kwLift(p.x + ${f(NEXT_OFF)});
  if (aProf.z > 0.01) p.y = aProf.z * vLift;                 // the law's height at the row, times the crest's lift at this x
  vL = vec4(p.x, p.z, aProf.x, p.y); vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const NEXT_FRAG = /* glsl */`precision highp float;
//<LIGHT>
${GLSL_HASH}${GLSL_VALUE_NOISE}
${PARS}
varying vec3 vW; varying vec4 vL; varying float vLift;
void main() {
  float x = vL.x, xi = vL.y, q = vL.z, hgt = vW.y, top = WH * vLift, hf = clamp(vL.w / top, 0., 1.), dep = max(top - vL.w, 0.);
  float face = smoothstep(-30., 30., xi), bx = 0.4 + 0.6 * exp(-x * x / 3.2e7), fx = fwidth(x), T = uTime;
  // LONG SHAFTS AND STREAKS down its face: three sizes across (420, 130 and 45 m), each drawn out along the slope,
  // each fading to its mean before a shaft is under three pixels wide
  float nA = mix(0.5, vnoise(vec2(x / 420. + uSeed.x, q / 2600. + uSeed.z)), 1. - smoothstep(60., 150., fx));
  float nB = mix(0.5, vnoise(vec2(x / 130. + 7.3, q / 1500. - T * 0.004)), 1. - smoothstep(20., 48., fx));
  float nC = mix(0.5, vnoise(vec2(x / 45. + 3.1, q / 700. - T * 0.01)), 1. - smoothstep(7., 16., fx));
  float shaft = 0.45 * nA + 0.35 * nB + 0.2 * nC;
  // its water: deep teal low on the face; THE HOLE'S LIGHT THROUGH IT above (the hole stands behind it too):
  // luminous turquoise, jade under the crest, stronger and weaker in the shafts
  vec3 water = mix(vec3(0.006, 0.040, 0.066), vec3(0.010, 0.100, 0.125), smoothstep(0., 0.4, hf));
  float up = smoothstep(0.18, 0.95, hf);
  vec3 glow = mix(vec3(0.012, 0.46, 0.47), vec3(0.17, 0.84, 0.54), up * up) * (up * (0.32 + 1.7 * shaft) * bx);
  // its foam: long pale streaks drawn down the face, more of them toward the crest
  float streak = smoothstep(0.54, 0.64, 0.5 * nB + 0.5 * nC + 0.10 * hf) * smoothstep(0.08, 0.5, hf);
  vec3 foamC = vec3(0.30, 0.40, 0.45) + vec3(0.50, 0.46, 0.32) * (up * bx);
  // its burning crest: a gold-white thread along the uneven skyline (a band finer than a pixel keeps its mean)
  float fd = 0.5 * fwidth(dep), Lg = 7. + fd;
  vec3 thread = vec3(1.0, 0.82, 0.50) * (3.4 * 7. / Lg * exp(-dep / Lg) * bx * smoothstep(-60., 0., xi));
  // THE MIST AT ITS FOOT: banks of uneven height (some 10 to 70 m), with gaps, pale and lit: never a ruled line
  float m1 = vnoise(vec2(x / 520. + 11.3 + uSeed.y, T * 0.006)), m2 = mix(0.5, vnoise(vec2(x / 140. + 4.7, 0.5 + T * 0.01)), 1. - smoothstep(20., 50., fx));
  float mh = 8. + 95. * m1 * m1 * (0.4 + 0.6 * m2);
  float mist = (1. - smoothstep(0.3 * mh, mh, hgt)) * smoothstep(0.16, 0.42, m1 + 0.3 * (m2 - 0.5)) * face;
  vec3 col = mix(water + glow, foamC, 0.6 * streak);
  col = mix(col, vec3(0.50, 0.58, 0.63) + KD_GOLD * (0.3 * bx), 0.9 * mist);
  col = mix(vec3(0.016, 0.055, 0.066), col, face) + thread;                    // (its back is never seen from the way)
  gl_FragColor = vec4(kdHaze(col, vW), 1.);
}`;

const S = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
// the law's height, sunk a little at both feet and beyond them so that no edge shows at the sea
const sunk = (xi) => waveHeight(xi) - 0.8 * (S((xi - (WAVE.face - 40)) / 40) + S((-WAVE.back + 60 - xi) / 60)) - 0.15 * Math.max(0, xi - WAVE.face, -WAVE.back - xi);
// a grid of the profile: cols (x, rising) by rows (xi, falling: from the south foot northward). position = (x, y, xi),
// aProf = (metres along the skin from the first row, the law's slope, the law's height). The wave's height dies
// away over the last 1500 m at both ends.
function profileGrid(cols, rows) {
  const nc = cols.length, nr = rows.length, pos = new Float32Array(nc * nr * 3), q = new Float32Array(nc * nr * 3);
  const ys = rows.map(sunk), qs = rows.map(() => 0);
  for (let j = 1; j < nr; j++) qs[j] = qs[j - 1] + Math.hypot(rows[j] - rows[j - 1], waveHeight(rows[j]) - waveHeight(rows[j - 1]));
  for (let i = 0, k = 0; i < nc; i++) {
    const taper = 1 - S((Math.abs(cols[i]) - (WAVE.halfWidth - ENDS)) / ENDS);
    for (let j = 0; j < nr; j++, k++) { pos[k * 3] = cols[i]; pos[k * 3 + 1] = ys[j] > 0 ? ys[j] * taper : ys[j]; pos[k * 3 + 2] = rows[j]; q[k * 3] = qs[j]; q[k * 3 + 1] = waveSlope(rows[j]); q[k * 3 + 2] = waveHeight(rows[j]); }
  }
  const idx = new Uint32Array((nc - 1) * (nr - 1) * 6);
  for (let i = 0, k = 0; i < nc - 1; i++) for (let j = 0; j < nr - 1; j++) {
    const A = i * nr + j, B = A + 1, C = A + nr, D = C + 1;
    idx[k++] = A; idx[k++] = C; idx[k++] = B; idx[k++] = B; idx[k++] = C; idx[k++] = D;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aProf', new THREE.BufferAttribute(q, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);       // moved by the law every frame: never culled
  return g;
}
// the body's grid: columns of 8 m to 700 m either side of the route, then 13% wider each to the wave's ends; rows
// of 8 m on the face's lower two thirds, of 4 m on its steep upper third, of 2.5 m over the cap and the crest (the
// outline the lens sees from below), then growing from 3 m to 40 m down the back; two rows under the sea beyond
// each foot
function bodyGrid() {
  const xs = [0]; let step = 8;
  while (xs[xs.length - 1] < WAVE.halfWidth) { const x = xs[xs.length - 1]; if (x >= 700) step *= 1.13; xs.push(Math.min(x + step, WAVE.halfWidth)); }
  const cols = [...xs.slice(1).reverse().map((x) => -x), ...xs];
  const rows = [WAVE.face + 14, WAVE.face + 5];
  const third = WAVE.face / 3, cap = WAVE.face / 10;
  for (let xi = WAVE.face; xi > third; xi -= 8) rows.push(xi);
  for (let xi = third; xi > cap; xi -= 4) rows.push(xi);
  for (let xi = cap; xi > -30; xi -= 2.5) rows.push(xi);
  for (let xi = -30, st = 3; xi > -WAVE.back + 20; st = Math.min(st * 1.1, 40), xi -= st) rows.push(xi);
  rows.push(-WAVE.back, -WAVE.back - 6, -WAVE.back - 16);
  return profileGrid(cols, rows);
}
function nextGrid() {
  const xs = [0]; let step = 90;
  while (xs[xs.length - 1] < NEXT_HALF) { const x = xs[xs.length - 1]; if (x >= 5000) step *= 1.12; xs.push(Math.min(x + step, NEXT_HALF)); }
  const cols = [...xs.slice(1).reverse().map((x) => -x), ...xs];
  const rows = [WAVE.face + 20, ...[1, 0.85, 0.7, 0.56, 0.44, 0.33, 0.24, 0.17, 0.12, 0.08, 0.05, 0.03, 0.015, 0].map((t) => t * WAVE.face),
    -20, -60, -140, -260, -400, -560, -720, -860, -WAVE.back, -WAVE.back - 20];
  return profileGrid(cols, rows);
}

export async function buildWave(ctx, opts) {
  const group = new THREE.Group(); group.name = 'wave';
  const light = opts.light, made = [];
  const rng = ctx.core.makeRng(ctx.core.hashSeed('knee-deep-under-the-wave:wave:' + ctx.seed));
  const U = { ...light.uniforms, uTime: { value: 0 }, uSeed: { value: new THREE.Vector4(rng() * 6.2832, rng() * 6.2832, rng() * 6.2832, rng() * 6.2832) } };
  const material = (vertexShader, fragmentShader, more = {}) => {
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader, fragmentShader: fragmentShader.replace('//<LIGHT>', light.GLSL), ...more });
    made.push(m); return m;
  };
  const add = (geometry, mat, order) => {
    const mesh = new THREE.Mesh(geometry, mat); mesh.frustumCulled = false; mesh.renderOrder = order;
    made.push(geometry); group.add(mesh); return mesh;
  };
  // (the body is drawn with the see-through things, first of them all (order -4: after the sea and every solid
  // thing, before the craft's image on the water, the spray and the mist), because its back's toe dissolves)
  const body = add(bodyGrid(), material(BODY_VERT, BODY_FRAG, { transparent: true }), -4);
  await ctx.yield();
  const next = add(nextGrid(), material(NEXT_VERT, NEXT_FRAG), 0);
  await ctx.yield();
  const spray = add(sprayGrid(), material(SPRAY_VERT, SPRAY_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 10);
  await ctx.yield();
  function update(time, s) {
    U.uTime.value = time;
    const z = crestZ(s);
    body.position.z = z; spray.position.z = z; next.position.z = nextCrestZ(s);
  }
  update(0, 0);
  return { object: group, uniforms: U, update, dispose() { for (const m of made) m.dispose(); } };
}
