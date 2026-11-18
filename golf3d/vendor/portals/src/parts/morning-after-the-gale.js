// THE SLEEVE ROOM: hero set piece of "morning-after-the-gale" (after the Tale of Genji scrolls, Heian court workshop, c. 1130).
// One stretch of the first wall line (seven plumb black posts, three black beams on the one diagonal, transom, six reed blinds),
// the curtain of state to port, and behind the hero blind a court lady with her back to us: one outer robe, eleven nested hems,
// a fall of black hair, sleeves and train spilling under the blind. Two matted platforms behind the wall leave the slot we fly through.
//
// SPACE. Everything is authored in PALACE coordinates, position attribute = (p, h, q): p along the long beams, h up, q into depth,
// and sheared in the vertex shader (gShear): x = -hand*0.82p, y = h + 0.57p + 0.58q, z = q. NOTE the sign: flying +Z, starboard
// (screen right) is -X, so beams rise to starboard with x = -0.82p (hand = +1). Floors are y = -0.695*hand*x + 0.58z (+ const).
// Local origin = the floor point under the path at the wall line: put hero.object at world (0, -10, 250). The path runs at
// local (0, 10, z); the threshold is local z = 0; the first tier's floor must END at local z = 1.2 (the hero supplies it from
// z = -70, opts.floor false to leave that to the world) and the next tier lies 172 m below beyond it.
//
// EXPORTS (shade the whole world with these, so the hero is not pasted in):
//   PALETTE, SHEAR, shearPoint(p, q, h, hand)  JS twin of the shader's shear
//   STYLE_GLSL            uniforms + gShear, gBehind/gPulse (gust fronts), gH2, gCell (the chip mosaic) for your own shaders
//   createStyle(opts)     -> { uniforms (shared: uHand uTime uFronts uGain uLoss0 uPx uDraw + pigments), pal, tint(c), coatMaterial(o), mats }
//     coatMaterial({ anim: 0 static | 1 blind | 2 hanging cloth | 3 robe, floor: bool (mats ruled in the shader, uv = (p, q)),
//       blind: bool, under: [su, sv, ou, ov] underdrawing line spacing/offset in uv metres, crackle: m, chip: m, offset })
//     The coat: flat pigment (attribute aCol, linear), hairline crackle, whole chips cut to paper #CDBE98 with grey underdrawing
//     and one shell-white cut line; losses rise behind a gust front; far off they merge to their flat average. uv is in METRES.
//     Attributes: position (p,h,q), uv, aCol, aA, aB (see COAT_VERT per anim; aB.x = extra loss for anim 0/2/3).
//   contourMaterial(style) + makeLines(rng)   ink contour ribbons (>= 1.6 px, shivering; key = pattern size so fine ones drop far off)
//   flakeMaterial(style)  instanced flying chips: aO origin (p,h,q), aF (seed, size, delay m, front 0..2 or 3 = always shedding), aCol
//   makeAcc()             palace-space geometry accumulator; addBar (posts, beams), addBlind, addRobeHeap + addHairAndFolds
//                         (any lady, gentleman or page: scale, rot, bands, top, hair), addCurtain
//   buildHero(ctx, opts)  opts: palette, detail (0.6-1: flakes), hand (+1 | -1 mirrored), worn (more loss), season
//     ('autumn' | 'winter' | 'spring'), floor (false = no tier-one patch), floorExtent [p0, p1, q0], style (share one)
// RETURNS { object, style, radius 62, height 62, center, anchors, heightAt(p, q), setProgress(u), update, dispose }
//   setProgress(u): the WORLD's u. Sets the three gust fronts (world z = 810(2u - c), c = .08 .40 .70, taken relative to the
//   hero's world z - 250) on the shared uniforms, so one call drives every coat, blind, cloth and flake in the world, and the
//   sleeve's drawing-in (u .2 to .3). The blind bellies when front 1 reaches the wall (u .19), is half rolled by u .27 and its
//   port top corner tears. Never called (set-piece viewer): the first gust loops on the clock.
//   anchors (local, already sheared): place (where to put the object in the world), flyThrough (straight line, >= 6 m clear),
//   threshold, lady, ladyTop, curtainEnd, blindHem, bayPosts, wallPosts (7), wallEnds (continue the wall from these), viewpoints.
// COST: about 35k triangles, 7 draw calls, 7 programs, no lights, no textures; build ~100 ms in yielded steps. Unlit, for
//   post { flat: 1, bloom 0 }: colours are written as linear pigments with no tone correction. Expects: paper dome, no fog,
//   camera level and straight along +Z with a 28 degree lens.
import * as THREE from 'three';

export const PALETTE = ['#CDBE98', '#4E9A6A', '#E0562A', '#6C3A78', '#EFEAD9', '#D9A93A', '#1B1716'];
// The oblique shear of the whole world (brief: x = 0.82p, y = 0.57p + 0.58q + h, z = q). Flying +Z with +Y up,
// starboard (screen right) is -X, so for beams that rise to starboard x = -hand * 0.82 p, hand = +1 by default.
export const SHEAR = { kx: 0.82, ky: 0.57, kq: 0.58 };
export function shearPoint(p, q, h, hand = 1, out = new THREE.Vector3()) {
  return out.set(-hand * SHEAR.kx * p, h + SHEAR.ky * p + SHEAR.kq * q, q);
}

// ---- GLSL shared by every surface of the world -------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform float uHand, uTime, uGain, uLoss0;
uniform vec3 uFronts, uPaper, uInk, uWhite;
vec3 gShear(vec3 P){ return vec3(-uHand*0.82*P.x, P.y + 0.57*P.x + 0.58*P.z, P.z); }
// metres behind the furthest-advanced gust front (negative: the gust has not come yet)
float gBehind(float wz){ vec3 d = uFronts - vec3(wz); return max(d.x, max(d.y, d.z)); }
// 0..1 pulse while a front is passing (any of the three)
float gPulse(float wz){ vec3 d = uFronts - vec3(wz);
  vec3 b = smoothstep(vec3(-12.), vec3(8.), d) * (1. - smoothstep(vec3(30.), vec3(110.), d));
  return max(b.x, max(b.y, b.z)); }
vec2 gH2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
// one cell of a seeded mosaic: x = distance to the nearest cell border (cell units), yz = the cell's hash
vec3 gCell(vec2 x){ vec2 n = floor(x), f = fract(x); float d1 = 8., d2 = 8.; vec2 id = vec2(0.), r1 = vec2(0.), r2 = vec2(1., 0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = gH2(n + g);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; r2 = r1; d1 = d; r1 = r; id = n + g; } else if (d < d2) { d2 = d; r2 = r; } }
  vec2 dr = r2 - r1; float e = dot(0.5 * (r1 + r2), dr / max(length(dr), 1e-4));
  return vec3(e, gH2(id + 7.3)); }
`;

const COAT_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aA; attribute vec4 aB;
varying vec2 vUv; varying vec3 vCol; varying float vWz; varying float vLoss; varying vec4 vX;
${STYLE_GLSL}
uniform float uDraw;
void main(){
  vec3 P = position; vUv = uv; vCol = aCol; vLoss = 0.; vX = vec4(0.);
#ifdef USE_INSTANCING
  P = (instanceMatrix * vec4(P, 1.)).xyz;
#endif
  float wz0 = (modelMatrix * vec4(gShear(P), 1.)).z;
#if ANIM == 1
  // blind: aA = (v 0 top..1 hem, length, max roll, seed), aB = (across 0..1, torn flag, top h, plane q)
  float d = gBehind(wz0), v = aA.x, L = aA.y;
  // negative max roll: rolled up from the start. Over 1: the hero's blind, which the gust's leading edge rolls up at once.
  // The others roll one after another outward from the line we fly (the front reaches the far bays of a wall later).
  float r = aA.z < 0. ? -aA.z : aA.z > 1. ? (aA.z - 1.) * smoothstep(-14., 40., d) : aA.z * smoothstep(18., 128., d - 0.3 * abs(P.x));
  float gust = gPulse(wz0);
  float bel = (gust * 6.5 + 0.5 * sin(uTime * 1.1 + aA.w * 6.3) + 0.35 * sin(uTime * 2.3 + aB.x * 5. + aA.w)) * sin(3.1416 * clamp(aB.x, 0., 1.)) ;
  float keep = 1. - r, vv = min(v, keep);
  float h = aB.z - vv * L, q = aB.w + bel * vv * (1.4 - 0.4 * vv) + 0.25 * sin(uTime * 1.7 + aA.w * 3.) * vv;
  float s = max(v - keep, 0.) * L;                       // length wound into the roll
  float R0 = 0.9 + 0.045 * r * L, ang = s / R0 * 1.6, Rs = R0 * (1. - 0.55 * s / max(r * L, 1e-3));
  q += Rs * cos(ang) - R0;
  h += -Rs * sin(ang);
  float torn = aB.y * smoothstep(40., 120., d);          // the torn top corner sags and swings
  float cw = (1. - smoothstep(0., 0.55, aB.x)) * (1. - smoothstep(0., 0.75, v));
  h -= torn * 9. * cw; q += torn * 5. * cw * (0.6 + 0.4 * sin(uTime * 1.9));
  P = vec3(P.x + torn * 3. * cw, h, q);
  vX = vec4(v, keep, aB.x, torn);
#elif ANIM == 2
  // hanging cloth, ribbons: aA = (free weight 0 fixed..1 loose, phase, stream weight, 0)
  float g2 = gPulse(wz0), w = aA.x;
  float rip = sin(uTime * 2.1 + aA.y + P.x * 0.21) * 0.5 + sin(uTime * 3.4 + aA.y * 1.7 + P.y * 0.3) * 0.3;
  P.z += w * (rip * (0.5 + 1.2 * g2 + aA.z * 0.8) + g2 * (2.5 + 9. * aA.z) * w + aA.z * 1.2 * w);
  P.y += w * w * g2 * aA.z * 5.;
  P.x += w * aA.z * (0.4 * sin(uTime * 2.7 + aA.y * 2.3) + 2.5 * g2);
#elif ANIM == 3
  // robes: aA = (drawn-in weight, breathing weight, seed, 0); uDraw 0..1 pulls the near sleeve 3 m in
  P.z += aA.x * uDraw * 3.4; P.y += aA.y * 0.12 * sin(uTime * 0.9 + aA.z);
  P.x += aA.x * uDraw * 0.8;
#endif
#if ANIM != 1
  vLoss = aB.x;
#endif
  vec4 wp = modelMatrix * vec4(gShear(P), 1.); vWz = wp.z;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const COAT_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vCol; varying float vWz; varying float vLoss; varying vec4 vX;
${STYLE_GLSL}
uniform vec4 uUnder;      // underdrawing: (spacing along u, spacing along v, offset u, offset v) in metres; 0 = none
uniform vec2 uScale;      // (crackle cell, chip cell) in metres
uniform vec3 uGreen, uOchre;
uniform float uStrip;   // 0..1: the whole coat lets go in a wave running up the diagonal (the world's rare event); 0 = never
uniform float uPatch;   // size of an abraded patch, in chips (losses are gathered into patches; between them the coat is whole)
// the chip mosaic with what the loss needs: x = distance to the nearest border, yz = the chip's hash; nb = the hash of the chip
// across that border; ctr = the chip's own centre (cell units), so a chip is kept or lost whole
vec3 gCellN(vec2 x, out float nb, out vec2 ctr){ vec2 n = floor(x), f = fract(x); float d1 = 8., d2 = 8.; vec2 id = vec2(0.), id2 = vec2(1.), r1 = vec2(0.), r2 = vec2(1., 0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = gH2(n + g);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; r2 = r1; id2 = id; d1 = d; r1 = r; id = n + g; } else if (d < d2) { d2 = d; r2 = r; id2 = n + g; } }
  vec2 dr = r2 - r1; float e = dot(0.5 * (r1 + r2), dr / max(length(dr), 1e-4));
  nb = gH2(id2 + 7.3).x; ctr = x + r1;
  return vec3(e, gH2(id + 7.3)); }
// how much of the coat is gone at a point (0 whole .. 0.92 the heart of a patch). amt = the sheet's loss; a patch opens from
// its heart outward as amt passes the patch's own hash, so a gust front leaves ragged abrasions and not pepper.
float gPatch(vec2 x, float amt){ vec3 pc = gCell(x + 31.7);
  return clamp((amt * 2.1 - pc.y) * 7., 0., 1.) * smoothstep(0.03, 0.2, pc.x + 0.05 * sin(x.x * 9.1 + x.y * 5.3)) * 0.92; }
float gLine(float dist, float w, float fw){ float hw = max(w, 0.75 * fw); return 1. - smoothstep(hw - 0.5 * fw, hw + 0.5 * fw, dist); }
void main(){
  vec2 fwv = fwidth(vUv); float fw = max(max(fwv.x, fwv.y), 1e-4);
  // a surface seen so edge-on that its marks would stretch more than about three to one keeps only its flat plate
  vec2 jx = dFdx(vUv), jy = dFdy(vUv); float jd = abs(jx.x * jy.y - jx.y * jy.x);
  float ja = dot(jx, jx) + dot(jy, jy), graze = smoothstep(3.0, 4.4, ja / max(jd, 1e-9));
  float fs = sqrt(max(ja, 1e-8));                            // metres per pixel along the most squeezed direction
  vec3 pig = vCol; float lossAdd = 0., ulx = 0.;
#ifdef FLOOR
  // mats 27 (u) by 13.5 (v), shell-white borders along the long sides with ink marks, rows staggered
  float row = floor(vUv.y / 13.5), fy = vUv.y - row * 13.5;
  float ux = vUv.x + mod(row, 2.) * 13.5 + 3. * sin(row * 12.9898);
  float fx = ux - floor(ux / 27.) * 27.;
  float wob = 0.12 * sin(vUv.x * 0.31 + row * 1.7) + 0.08 * sin(vUv.x * 0.83 + row);
  float bd = min(fy, 13.5 - fy) + wob;                      // distance to the long edge
  float fwb = max(fwv.y, 1e-4);                             // the border is ruled along u: its edge is filtered by v alone and stays crisp edge-on
  float border = 1. - smoothstep(0.95 - fwb * 0.5, 0.95 + fwb * 0.5, bd);
  lossAdd = 0.03 * (1. - smoothstep(0.5, 4., bd)) - 0.012;   // mats wear along their borders
  pig = mix(uGreen, uWhite, border);
  float mk = abs(fract(vUv.x / 2.4 + row * 0.37) - 0.5) * 2.4;  // ink marks on the border: a row of lozenges
  float loz = 1. - smoothstep(0.30 - fw, 0.30 + fw, mk * 0.55 + abs(bd - 0.47));
  pig = mix(pig, uInk, border * loz * (1. - smoothstep(0.26, 0.36, fs)) * (1. - graze));   // marks under about 3 px are left out, not greyed
  float seam = gLine(min(fx, 27. - fx), 0.05, max(fwv.x, 1e-4)) * (1. - border);   // mat ends: one thin ink line
  pig = mix(pig, uInk, seam * 0.85 * (1. - smoothstep(1.2, 1.8, fwv.x)));
  ulx = gLine(abs(fx - 1.1 - 0.5 * sin(row * 3.7)), 0.07, fw);          // the mat ends in the underdrawing, staggered like the mats and off by a metre
#endif
#ifdef PLANK
  // planks 4.5 m wide ruled along the beams, butt joints staggered row by row: thin ink lines, left out when under about 3 px apart
  float prow = floor(vUv.y / 4.5), py = vUv.y - prow * 4.5, fwp = max(fwv.y, 1e-4);
  float ps = gLine(min(py, 4.5 - py) + 0.1 * sin(vUv.x * 0.27 + prow * 2.3), 0.07, fwp) * (1. - smoothstep(1.0, 1.6, fwp));
  float pux = vUv.x + 61.7 * fract(prow * 0.618);
  float pj = gLine(abs(pux - floor(pux / 54.) * 54. - 27.), 0.06, max(fwv.x, 1e-4)) * (1. - smoothstep(0.5, 0.9, fwv.x));
  pig = mix(pig, uInk, 0.8 * max(ps, pj * (1. - ps)) * (1. - graze));
  pig = mix(pig, uInk, 0.06 * smoothstep(1.0, 1.6, fwp));
  lossAdd = -0.012;
#endif
#ifdef BLIND
  float v = vX.x, keep = vX.y, ac = vX.z, torn = vX.w;
  lossAdd = -0.045 + 0.06 * smoothstep(0.55, 1., v);       // blinds wear at the hem, where they drag
  float jag = 0.035 * sin(ac * 61. + v * 17.) + 0.05 * sin(ac * 23. - v * 31.) + 0.02 * sin(v * 140.);
  if (torn > 0.01 && ac + v * 0.55 + jag < 0.24 * torn) discard;                 // the bite torn out of the corner
  float reed = abs(fract(vUv.y / 0.9) - 0.5) * 0.9;                             // reeds ruled along the beam direction
  float isO = abs(vCol.r - uOchre.r) + abs(vCol.g - uOchre.g) < 0.03 ? 1. : 0.;
  if (v > 0.972 || v < 0.03) { pig = uGreen; isO = 0.; }                          // the green binding at head and hem: a hard edge, never a blend
  pig = mix(pig, uInk, isO * 0.8 * gLine(reed, 0.035, fw) * (1. - smoothstep(0.15, 0.3, fw)));
  pig = mix(pig, uInk, 0.14 * isO * smoothstep(0.15, 0.3, fw));                 // far off: the flat average of the ruling
  float rl = gLine(abs(v - keep) * 40., 0.12, fw * 1.2) * step(keep, 0.995);     // the ink line where the roll begins
  pig = mix(pig, uInk, rl);
#endif
  // crackle: hairline cracks between hand-sized plates; merged to the flat plate when finer than ~3 px
  vec3 ck = gCell(vUv / uScale.x + 17.);
  vec3 cz = gCell(vUv / (uScale.x * 11.) + 3.1);            // the crackle gathers in a few places; most of a plate is calm flat pigment
  float crk = step(cz.y, 0.24) * smoothstep(0.02, 0.3, cz.x) * (1. - graze) * gLine(ck.x * uScale.x, 0.011, fw) * clamp(0.02 / fw, 0., 1.) * (0.3 + 0.7 * smoothstep(0.02, 0.2, pig.g)) * (1. - smoothstep(uScale.x * 0.12, uScale.x * 0.3, fw));
  vec3 under = mix(uPaper, uInk, 0.45);
  vec3 col = mix(pig, mix(uPaper, under, 0.5), crk * 0.6);
  // losses: whole chips cut out of the coat to the paper below, gathered into a few ragged abraded patches; more open
  // once a gust front has passed. Between patches the coat is unbroken.
  float nb; vec2 ctr; vec3 ch = gCellN(vUv / uScale.y, nb, ctr);
  float d = gBehind(vWz);
  float sw = uStrip > 0. ? smoothstep(0., 70., uStrip * 1150. - (vUv.x + 430.) - 0.25 * (vUv.y + 300.)) : 0.;
  float amt = uLoss0 + vLoss + lossAdd + uGain * smoothstep(-5., 90., d);
  float th = max(gPatch(ctr / uPatch, amt), sw);             // the same for every pixel of a chip
  float thS = max(gPatch(vUv / (uScale.y * uPatch), amt), sw);  // the smooth patch, for far off
  float lost = step(ch.y, th), lostN = step(nb, th);
  float far = smoothstep(uScale.y * 0.13, uScale.y * 0.21, fs);   // chips under about 5 px across: only the patch remains
  vec2 g = vUv + vec2(0.35 * sin(vUv.y * 0.23) + 0.2 * sin(vUv.y * 0.71), 0.35 * sin(vUv.x * 0.19) + 0.2 * sin(vUv.x * 0.57));
  float ul = ulx;
  if (uUnder.x > 0.) { float gx = abs(fract((g.x + uUnder.z) / uUnder.x) - 0.5) * uUnder.x; ul = max(ul, gLine(min(gx, abs(gx - 0.8)), 0.09, fw)); }
  if (uUnder.y > 0.) { float gy = abs(fract((g.y + uUnder.w) / uUnder.y) - 0.5) * uUnder.y; ul = max(ul, gLine(min(gy, abs(gy - 0.95)), 0.09, fw)); }
  // a few loose strokes of the first drawing that the paint never followed
  float fr2 = abs(fract((g.x * 0.42 + g.y * 0.81) / 9.7) - 0.5) * 9.7; ul = max(ul, gLine(fr2, 0.08, fw) * step(0.5, fract(floor((g.x * 0.42 + g.y * 0.81) / 9.7) * 0.37)));
  vec3 pap = mix(uPaper, under, ul * (1. - smoothstep(0.5, 1.5, fw)));
  float edge = gLine(ch.x * uScale.y, 0.07, fw);        // the cut edge: one shell-white line for the coat's thickness, only where paint still stands beside it
  pap = mix(pap, uWhite, edge * (1. - smoothstep(0., 0.4, far)) * (1. - graze) * (1. - lostN) * step(ch.z, 0.8) * (1. - sw));
  float nearK = (1. - far) * (1. - graze);
  col = mix(col, pap, lost * nearK);
  float fp = max(fs / (uScale.y * uPatch), 1e-4) * 3.;       // far off a patch is one flat shape of bare paper with a hard edge; edge-on it is left out
  col = mix(col, uPaper, far * (1. - graze) * smoothstep(0.5 - fp, 0.5 + fp, thS) * (1. - smoothstep(0.1, 0.2, fp)));
  gl_FragColor = vec4(col, 1.);
}`;

// ---- the style object: shared uniforms and material factories ----------------------------------------------
export function createStyle(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const [paper, green, red, purple, white, ochre, ink] = pal;
  const tint = (c) => c.clone().lerp(white, 0.5);             // the only tint allowed: half strength over shell white
  const uniforms = {
    uHand: { value: opts.hand === -1 ? -1 : 1 }, uTime: { value: 0 }, uGain: { value: opts.worn ? 0.2 : 0.09 },
    uLoss0: { value: opts.worn ? 0.12 : 0.05 }, uFronts: { value: new THREE.Vector3(-1e4, -1e4, -1e4) },
    uPaper: { value: paper }, uInk: { value: ink }, uWhite: { value: white }, uGreen: { value: green }, uOchre: { value: ochre },
    uPx: { value: new THREE.Vector2(800, 450) }, uDraw: { value: 0 }, uPatch: { value: opts.worn ? 4.6 : 3.2 },
  };
  const mats = [];
  // coatMaterial({ anim: 0 static | 1 blind | 2 cloth | 3 robe, floor, blind, under:[su,sv,ou,ov], crackle, chip })
  function coatMaterial(o = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uUnder: { value: new THREE.Vector4(...(o.under || [0, 6, 0, 0.6])) },
        uScale: { value: new THREE.Vector2(o.crackle || 0.45, o.chip || 2.4) }, uStrip: { value: 0 }, uPatch: uniforms.uPatch },
      defines: { ANIM: o.anim | 0, ...(o.floor ? { FLOOR: 1 } : {}), ...(o.blind ? { BLIND: 1 } : {}), ...(o.plank ? { PLANK: 1 } : {}) },
      vertexShader: COAT_VERT, fragmentShader: COAT_FRAG, side: THREE.DoubleSide,
    });
    if (o.offset) { m.polygonOffset = true; m.polygonOffsetFactor = -o.offset; m.polygonOffsetUnits = -o.offset * 2; }
    mats.push(m); return m;
  }
  return { uniforms, pal: { paper, green, red, purple, white, ochre, ink }, tint, coatMaterial, mats };
}

// Ink contour: ribbons redrawn over the paint, never thinner than 1.5 px, shivering a finger's width.
export function contourMaterial(style, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, uCol: { value: o.color || style.pal.ink } },
    vertexShader: /* glsl */`
attribute vec3 aDir; attribute vec4 aA; attribute float aDw;   // aA = (side -1/+1, width m, seed, fade key); aDw = drawn-in weight
uniform vec2 uPx; uniform float uDraw; ${STYLE_GLSL}
varying float vK;
void main(){
  vec3 P = position; float sd = aA.z;
  P.z += aDw * uDraw * 3.4; P.x += aDw * uDraw * 0.8;
  P.x += 0.11 * sin(uTime * 1.3 + sd * 9.1) + 0.05 * sin(uTime * 3.1 + sd * 4.7 + P.y * 0.4);
  P.y += 0.09 * sin(uTime * 1.7 + sd * 5.3);
  vec4 a = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(P), 1.);
  vec4 b = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(P + aDir), 1.);
  float wa = max(abs(a.w), 1e-4), wb = max(abs(b.w), 1e-4);
  vec2 dir = (b.xy / wb - a.xy / wa) * uPx; float len = max(length(dir), 1e-5);
  vec2 n = vec2(-dir.y, dir.x) / len;
  float ppm = uPx.y * projectionMatrix[1][1] * 0.5 / wa;
  float px = max(aA.y * ppm, 1.6) * (aA.w > 0. ? smoothstep(2.5, 5., ppm * aA.w) : 1.);
  a.xy += n * aA.x * px / uPx * a.w;
  vK = aA.w; gl_Position = a;
}`,
    fragmentShader: /* glsl */`uniform vec3 uCol; varying float vK; void main(){ gl_FragColor = vec4(uCol, 1.); }`,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
  });
  style.mats.push(m); return m;
}

// Flakes: chips of the coat that lift where a gust front passes and blow forward and up the diagonal.
// Instanced: aO = origin (p, h, q), aF = (seed, size m, delay m, front index 0..2), aCol = pigment.
export function flakeMaterial(style) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms },
    vertexShader: /* glsl */`
attribute vec3 aO; attribute vec4 aF; attribute vec3 aCol;
varying vec3 vCol; varying vec2 vQ; varying float vS;
${STYLE_GLSL}
void main(){
  float sd = aF.x; vec3 O = aO;
  float wz0 = (modelMatrix * vec4(gShear(O), 1.)).z;
  vec3 fr = uFronts - vec3(wz0);
  float d = (aF.w < 0.5 ? fr.x : (aF.w < 1.5 ? fr.y : fr.z)) - aF.z;
  float life = 150. + 160. * fract(sd * 7.31);
  if (aF.w > 2.5) d = mod(uTime * 14. + sd * 53., life);     // index 3: always shedding, on the clock (the small loop)
  float on = step(0., d) * step(d, life);
  float t = max(d, 0.);
  float grow = smoothstep(0., 6., t) * (1. - smoothstep(life * 0.8, life, t));
  // lift, then run ahead (+q) and up the diagonal (+p), fluttering
  float k = 0.55 + 0.5 * fract(sd * 3.7);
  O.z += t * k * 0.92;
  O.x += t * k * (0.25 + 0.3 * fract(sd * 5.1)) + 1.8 * sin(t * 0.09 + sd * 20. + uTime * 1.3);
  O.y += 5. * smoothstep(0., 25., t) + t * (0.02 + 0.1 * fract(sd * 9.7)) + 1.5 * sin(t * 0.13 + sd * 11. + uTime * 1.9);
  float a1 = sd * 40. + t * 0.21 + uTime * (1.5 + 2. * fract(sd * 2.3)), a2 = sd * 17. + t * 0.13 + uTime * 1.1;
  vec3 ax = vec3(cos(a1), sin(a1) * cos(a2), sin(a1) * sin(a2));
  vec3 ay = vec3(-sin(a1) * 0.6, cos(a1) * cos(a2) + 0.2, cos(a1) * sin(a2) + 0.5);
  float sz = aF.y * on * (0.25 + 0.75 * grow);
  // no flake is ever wider than about 3.5 percent of the frame, however near it passes
  vec4 oc = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(O), 1.);
  sz = min(sz, 0.062 * max(oc.w, 0.) / max(projectionMatrix[0][0], 1e-4));
  vec3 P = O + (ax * position.x + ay * position.y) * sz;
  vCol = aCol; vQ = position.xy; vS = sd;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(P), 1.);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uPaper, uInk; varying vec3 vCol; varying vec2 vQ; varying float vS;
void main(){
  // a chipped polygon: the quad with its corners cut by three seeded lines
  float c1 = dot(vQ, vec2(cos(vS * 31.), sin(vS * 31.))), c2 = dot(vQ, vec2(cos(vS * 57. + 2.), sin(vS * 57. + 2.)));
  float c3 = dot(vQ, vec2(cos(vS * 13. + 4.), sin(vS * 13. + 4.)));
  if (c1 > 0.36 || c2 > 0.40 || c3 > 0.33 || abs(vQ.x) + abs(vQ.y) > 0.72) discard;
  vec3 back = mix(uPaper, mix(uPaper, uInk, 0.45), 0.35);
  gl_FragColor = vec4((gl_FrontFacing || fract(vS * 1.37) > 0.12) ? vCol : back, 1.);
}`,
    side: THREE.DoubleSide,
  });
  style.mats.push(m); return m;
}

// ---- geometry accumulator in palace space: position = (p, h, q) -------------------------------------------
// A plain array copied into a typed array in pieces of 60,000 numbers with a yield between (a million-number array
// converted in one go holds the page for tens of milliseconds).
async function typedAsync(arr, Ctor, yld) {
  const n = arr.length, ta = new Ctor(n);
  for (let o = 0; o < n; o += 60000) { const e = Math.min(n, o + 60000); for (let i = o; i < e; i++) ta[i] = arr[i]; await yld(); }
  return ta;
}
export function makeAcc() {
  const pos = [], uv = [], col = [], A = [], B = [], idx = [];
  const acc = {
    count: 0,
    v(p, h, q, u, w, c, a, b) {
      pos.push(p, h, q); uv.push(u, w); col.push(c.r, c.g, c.b);
      if (a) A.push(a[0], a[1], a[2], a[3]); else A.push(0, 0, 0, 0);
      if (b) B.push(b[0], b[1], b[2], b[3]); else B.push(0, 0, 0, 0);
      return acc.count++;
    },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    // a strip between two rows of vertex indices of equal length
    rows(r0, r1) { for (let i = 0; i + 1 < r0.length; i++) acc.quad(r0[i], r0[i + 1], r1[i + 1], r1[i]); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4));
      g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
    // the same geometry in short steps: one attribute per step (a big accumulator's five typed arrays are 10 ms and more each)
    async buildAsync(yld) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(await typedAsync(pos, Float32Array, yld), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(await typedAsync(uv, Float32Array, yld), 2));
      g.setAttribute('aCol', new THREE.BufferAttribute(await typedAsync(col, Float32Array, yld), 3));
      g.setAttribute('aA', new THREE.BufferAttribute(await typedAsync(A, Float32Array, yld), 4));
      g.setAttribute('aB', new THREE.BufferAttribute(await typedAsync(B, Float32Array, yld), 4));
      g.setIndex(new THREE.BufferAttribute(await typedAsync(idx, Uint32Array, yld), 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
    tris() { return idx.length / 3; },
  };
  return acc;
}

// polyline accumulator for contour ribbons: add(points [[p,h,q],...], width m, taper)
export function makeLines(rng) {
  const pos = [], dir = [], A = [], DW = [], idx = []; let n = 0;
  return {
    add(pts, w = 0.12, taper = 0.6, key = 0) {      // key: metres of pattern this line belongs to; it is dropped when that is under ~4 px
      const m = pts.length; if (m < 2) return; const seed = rng() * 100;
      for (let i = 0; i < m; i++) {
        const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, m - 1)], c = pts[i];
        const t = i / (m - 1), wd = w * (1 - taper + taper * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)));
        for (const s of [-1, 1]) { pos.push(c[0], c[1], c[2]); dir.push(b[0] - a[0], b[1] - a[1], b[2] - a[2]); A.push(s, wd, seed, key); DW.push(c[3] || 0); }
        if (i) idx.push(n - 2, n - 1, n + 1, n - 2, n + 1, n);
        n += 2;
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3)); g.setAttribute('aDw', new THREE.Float32BufferAttribute(DW, 1));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
      g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
    async buildAsync(yld) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(await typedAsync(pos, Float32Array, yld), 3));
      g.setAttribute('aDir', new THREE.BufferAttribute(await typedAsync(dir, Float32Array, yld), 3));
      g.setAttribute('aDw', new THREE.BufferAttribute(await typedAsync(DW, Float32Array, yld), 1));
      g.setAttribute('aA', new THREE.BufferAttribute(await typedAsync(A, Float32Array, yld), 4));
      g.setIndex(new THREE.BufferAttribute(await typedAsync(idx, Uint32Array, yld), 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
    tris() { return idx.length / 3; },
  };
}

// A bar of square section in palace space with a slightly unruled edge. axis 'p' (beam) or 'h' (post).
export function addBar(acc, rng, axis, a0, a1, b0, b1, q0, q1, c, loss = 0, wob = 0.14) {
  const n = Math.max(2, Math.round((a1 - a0) / 7)), rows = [[], [], [], []];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, e = i === 0 || i === n ? 0 : 1;
    const j0 = (rng() - 0.5) * 2 * wob * e, j1 = (rng() - 0.5) * 2 * wob * e;
    const cs = [[b0 + j0, q0], [b1 + j1, q0], [b1 + j1, q1], [b0 + j0, q1]];
    for (let k = 0; k < 4; k++) {
      const [b, q] = cs[k], P = axis === 'p' ? [a, b, q] : [b, a, q];
      // two vertices per corner so each face has its own surface coordinates
      rows[k].push([acc.v(P[0], P[1], P[2], a, k * 3.1 + (k % 2 ? q : b), c, null, [loss, 0, 0, 0]),
        acc.v(P[0], P[1], P[2], a, k * 3.1 + 2.2 + (k % 2 ? b : q), c, null, [loss, 0, 0, 0])]);
    }
  }
  for (let k = 0; k < 4; k++) { const r0 = rows[k].map((v) => v[1]), r1 = rows[(k + 1) % 4].map((v) => v[0]); acc.rows(r0, r1); }
  for (const i of [0, n]) acc.quad(rows[0][i][0], rows[1][i][0], rows[2][i][0], rows[3][i][0]);
}

// One reed blind hanging in the plane q = q0 from h = top, between p0 and p0 + W. Animated by the coat shader (anim 1).
export function addBlind(acc, S, rng, p0, W, top, L, q0, rollMax, torn, o = {}) {
  const { green, ochre } = S.pal, seed = rng() * 10, rowsN = o.rows || 40;
  const cols = []; const edge = 1.7, tape = 1.1, field = (W - 2 * edge - 2 * tape) / 3;
  let x = 0; const push = (w, c, n) => { for (let i = 0; i < n; i++) { cols.push([x, x + w / n, c]); x += w / n; } };
  push(edge, green, 1); push(field, ochre, 3); push(tape, green, 1); push(field, ochre, 3); push(tape, green, 1); push(field, ochre, 3); push(edge, green, 1);
  const flip = o.flip ? 1 : 0;           // which top corner tears
  for (const [x0, x1, c] of cols) {
    let prev = null;
    for (let j = 0; j <= rowsN; j++) {
      const v = j / rowsN, cc = c;
      const mk = (xx) => { const ac = xx / W; return acc.v(p0 + xx, top - v * L, q0, xx + seed * 41.3, v * L + Math.floor(seed * 7) * 9, cc, [v, L, rollMax, seed], [flip ? 1 - ac : ac, torn, top, q0]); };
      const row = [mk(x0), mk(x1)];
      if (prev) acc.quad(prev[0], prev[1], row[1], row[0]);
      prev = row;
    }
  }
}

// The wall line: posts, three beams, transom panels, blinds. Returns what was placed, for anchors.
function* buildWall(S, rng, statics, blinds, o) {      // a generator: it pauses after every post, bay and blind so the build can yield
  const { ink, white, green } = S.pal;
  const posts = []; for (let i = -3; i <= 3; i++) posts.push(o.bayP0 + 45 * i);
  const pA = posts[0] - 16, pB = posts[posts.length - 1] + 16;
  addBar(statics, rng, 'p', pA, pB, 0, 1.3, -1.25, 1.25, ink, -0.05);            // threshold
  addBar(statics, rng, 'p', pA, pB, 45, 47.4, -1.2, 1.2, ink, -0.05);            // lower lintel
  addBar(statics, rng, 'p', pA, pB, 55, 58.2, -1.35, 1.35, ink, -0.05);          // upper lintel
  for (const p of posts) {
    const w = 1 + rng.range(-0.08, 0.08);
    addBar(statics, rng, 'h', 0, 60.5, p - w, p + w, -1, 1, ink, -0.05, 0.1);
    addBar(statics, rng, 'h', 0, 2.2, p - w - 0.7, p + w + 0.7, -1.7, 1.7, ink, 0.0, 0.05);   // foot block
    addBar(statics, rng, 'p', p - 3.2, p + 3.2, 58.2, 59.6, -1.9, 1.9, ink, 0.0, 0.05);        // bracket cap over the lintel
    yield;
  }
  // transom between the lintels: shell-white panel with black struts (some bays lost in the gale)
  for (let i = 0; i + 1 < posts.length; i++) {
    const a = posts[i] + 1, b = posts[i + 1] - 1, open = i !== 3 && rng.chance(0.3);
    const lo = [0.08 + rng() * 0.1, 0, 0, 0];
    if (!open) {
      const v0 = statics.v(a, 47.4, 0.3, a, 47.4, white, null, lo), v1 = statics.v(b, 47.4, 0.3, b, 47.4, white, null, lo);
      const v2 = statics.v(b, 55, 0.3, b, 55, white, null, lo), v3 = statics.v(a, 55, 0.3, a, 55, white, null, lo);
      statics.quad(v0, v1, v2, v3);
    }
    const ns = 9; for (let k = 1; k < ns; k++) { if (open && rng.chance(0.5)) continue; const p = a + (b - a) * k / ns + rng.range(-0.25, 0.25);
      addBar(statics, rng, 'h', 47.4, 55, p - 0.32, p + 0.32, -0.3, 0.5, ink, 0, 0.04); }
    // green valance under the lower lintel, in front of the blind's head
    const g0 = statics.v(a, 41.6, -1.6, a, 0, green, null, lo), g1 = statics.v(b, 41.6 + rng.range(-0.3, 0.3), -1.6, b, 0, green, null, lo);
    const g2 = statics.v(b, 45, -1.6, b, 3.4, green, null, lo), g3 = statics.v(a, 45, -1.6, a, 3.4, green, null, lo);
    statics.quad(g0, g1, g2, g3);
    yield;
  }
  // blinds: bay 3 (index of posts[3]..posts[4]) is the hero bay
  const plan = [];
  for (let i = 0; i + 1 < posts.length; i++) {
    let roll, torn = 0;
    if (i === 3) { roll = 1.64; torn = 1; } else if (i === 2) roll = -0.86;      // the bay to port stands open for the curtain
    else { roll = rng.pick([0.15, 0.3, 0.55, 0.75]); torn = rng.chance(0.35) ? 1 : 0; }
    plan.push({ p0: posts[i] + 1, roll, torn });
    addBlind(blinds, S, rng, posts[i] + 1, 43, 45, 40, -1.45, roll, torn, { flip: i === 3 ? o.tearStarboard : rng.chance(0.5), pre: i === 2 });
    yield;
  }
  return { posts, plan };
}

// A robe heap: a court lady seen from behind, as the workshop drew her. One purple outer robe over the mound,
// then nested hems each one band, fanned toward -q (rot 0) in three lobes (train and two sleeves); a flat fall of hair.
// o: { p, q, scale (1 = 30 m across, 20 m high), rot, flat (height factor), lift (m), bands: [THREE.Color...] outermost hem last, top: Color, hair: true, nearSide: -1|1 (which sleeve uDraw pulls in; 0 none), lobes, drapeQ, loss, segs }
// Adds to acc (coat, anim 3) and lines (contours). Returns { heightAt(p,q), radiusAt(theta), top }.
// The work is one generator (robeHeapSteps) that pauses between rows of rings; addRobeHeap runs it straight through and
// addRobeHeapAsync awaits yld() at each pause, so a build can spread a heap over several short steps. Same draws, same order.
export function addRobeHeap(acc, lines, S, rng, o) { const g = robeHeapSteps(acc, lines, S, rng, o); let r = g.next(); while (!r.done) r = g.next(); return r.value; }
export async function addRobeHeapAsync(acc, lines, S, rng, o, yld) { const g = robeHeapSteps(acc, lines, S, rng, o); let r = g.next(); while (!r.done) { if (yld) await yld(); r = g.next(); } return r.value; }
function* robeHeapSteps(acc, lines, S, rng, o) {
  const sc = o.scale || 1, bands = o.bands, nb = bands.length, cr = Math.cos(o.rot || 0), sr = Math.sin(o.rot || 0);
  const NT = o.segs || 160, ink = S.pal.ink, fl = o.flat || 1, lf = o.lift || 0;   // flat: a figure lying low; lift: a hem laid over another's
  // three lobes [angle, length, half width (rad)]: train, starboard sleeve, port sleeve; o.lobes overrides (same draws either way)
  const L0 = [[rng.range(-0.08, 0.08), rng.range(17, 20), rng.range(0.3, 0.36)], [rng.range(0.66, 0.84), rng.range(14, 18), rng.range(0.2, 0.25)], [-rng.range(0.7, 0.9), rng.range(15, 18.5), rng.range(0.21, 0.26)]];
  const LB = o.lobes || L0, tl = LB.map((l) => l[0]), ll = LB.map((l) => l[1]), lw = LB.map((l) => l[2]);
  const ph = [rng() * 6.28, rng() * 6.28, rng() * 6.28];
  const wrap = (t) => Math.atan2(Math.sin(t), Math.cos(t));
  const Rof = (t) => { let r = 13.5 + 0.7 * Math.sin(t * 3 + ph[0]) + 0.4 * Math.sin(t * 7 + ph[1]);
    for (let k = 0; k < 3; k++) { const d = wrap(t - tl[k]) / lw[k]; r += ll[k] * Math.exp(-Math.abs(d * d * d)); }
    r -= 2.2 * Math.exp(-Math.pow(wrap(t - (tl[0] + tl[1]) / 2) / 0.1, 2)) + 2.2 * Math.exp(-Math.pow(wrap(t - (tl[0] + tl[2]) / 2) / 0.1, 2));
    return r; };
  const bwOf = (t, R) => Math.min(1.05, Math.max(0.42, R * 0.042));
  const bj = bands.map(() => rng.range(0.8, 1.2));
  const hBody = (a, b, rho) => {
    const e2 = (a / 8.6) * (a / 8.6) + (b / 7) * (b / 7);
    let h = 14.5 * Math.exp(-Math.pow(e2, 1.25)) + 4.4 * Math.exp(-(a * a + (b - 0.6) * (b - 0.6)) / 8.5);
    h += 8.6 * Math.exp(-(Math.pow((a + 9.6) / 5.4, 2) + Math.pow((b + 1) / 6.2, 2))) + 8.2 * Math.exp(-(Math.pow((a - 9.6) / 5.4, 2) + Math.pow((b + 1) / 6.2, 2)));
    return (h + 2.9 * (1 - rho * rho * rho) + 0.5 * Math.sin(a * 0.9 + ph[2]) * Math.sin(b * 0.7 + ph[1]) * (1 - rho)) * fl;
  };
  const world = (a, b) => [o.p + sc * (a * cr - b * sr), o.q + sc * (a * sr + b * cr)];
  const drape = o.drapeQ === undefined ? null : o.drapeQ;        // a threshold the hems lie over
  const pt = (t, r, rho, lift = 0) => { const a = Math.sin(t) * r, b = -Math.cos(t) * r; const [p, q] = world(a, b);
    let h = sc * hBody(a, b, rho) + lift + lf; if (drape !== null) h = Math.max(h, 1.95 * Math.exp(-Math.pow((q - drape) / 2.3, 2)) + 0.35 + lift);
    const dw = o.nearSide === 0 ? 0 : Math.exp(-Math.pow(wrap(t - tl[(o.nearSide || -1) < 0 ? 2 : 1]) / 0.3, 2)) * Math.max(0, Math.min(1, (rho - 0.42) / 0.4));
    return [p, h, q, dw]; };
  // ring table: fraction rows over the mound, then one row per band edge
  const NM = o.nm || 15, ringsR = [], ringCol = [];
  const Rs = [], BW = [], jit = [];
  for (let i = 0; i <= NT; i++) { const t = -Math.PI + (i / NT) * 2 * Math.PI; Rs.push(Rof(t)); }
  for (let pass = 0; pass < 3; pass++) { const c = Rs.slice(0, NT); for (let i = 0; i <= NT; i++) Rs[i] = 0.25 * c[(i + NT - 1) % NT] + 0.5 * c[i % NT] + 0.25 * c[(i + 1) % NT]; }
  for (let i = 0; i <= NT; i++) BW.push(bwOf(0, Rs[i]));
  for (let k = 0; k <= nb; k++) { const row = []; for (let i = 0; i <= NT; i++) row.push(i === NT ? row[0] : rng.range(-0.16, 0.16)); jit.push(row); }
  const edgeR = (k, i) => { let r = Rs[i]; for (let m = nb - 1; m >= k; m--) r -= BW[i] * bj[m]; return r + jit[k][i] * (k === nb ? 1.6 : 1); };   // k = 0 inner edge of band 0 .. nb outer hem
  const mk = (i, r, c, vrow) => { const t = -Math.PI + (i / NT) * 2 * Math.PI, rho = Math.min(1, r / Rs[i]);
    const P = pt(t, r, rho), dw = P[3];
    return acc.v(P[0], P[1], P[2], t * Math.max(2.5, vrow.rm) * sc, vrow.s * sc, c, [dw, 1 - rho, ph[0], 0], [o.loss || 0, 0, 0, 0]); };
  let prev = null, sAcc = 0, rm = 0;
  for (let j = 0; j <= NM; j++) {                                  // the mound: one outer robe
    const f = Math.pow(j / NM, 0.8); const vrow = { s: f * 16, rm: f * 15 }, row = [];
    for (let i = 0; i <= NT; i++) row.push(mk(i, Math.max(0.02, edgeR(0, i) * f), o.top, vrow));
    if (prev) acc.rows(prev, row); prev = row;
    if (NT > 100 && j % 5 === 4) yield;
  }
  yield;
  sAcc = 16; rm = 15;
  for (let k = 0; k < nb; k++) {                                   // the hems: each band its own strip, edges shared
    const r0 = [], r1 = [], v0 = { s: sAcc, rm }, v1 = { s: sAcc + 1.1, rm: rm + 1 };
    for (let i = 0; i <= NT; i++) { r0.push(mk(i, edgeR(k, i), bands[k], v0)); r1.push(mk(i, edgeR(k + 1, i), bands[k], v1)); }
    acc.rows(r0, r1); sAcc += 1.1; rm += 1;
    if (NT > 100 ? k % 2 === 1 : k % 5 === 4) yield;
  }
  yield;
  // contours: every band edge redrawn in ink, missing it by 5 to 15 cm, in broken strokes that overlap at the lobes
  if (lines) for (let k = 0; k <= nb; k++) {
    let i = 0; const off = rng.range(0.05, 0.15) * (rng.chance(0.5) ? 1 : -1);
    while (i < NT) { const len = rng.int(9, 26), pts = []; const o2 = off + rng.range(-0.05, 0.05);
      for (let m = i; m <= Math.min(NT, i + len); m++) { const t = -Math.PI + (m / NT) * 2 * Math.PI, r = edgeR(k, m) - jit[k][m] * 0.7 + o2; const P = pt(t, r, Math.min(1, r / Rs[m]), 0.1); pts.push(P); }
      lines.add(pts, k === nb ? 0.1 : 0.07, 0.55, k === 0 || k === nb ? 0 : 1); i += len - (rng.chance(0.4) ? 2 : -1); }
    if (NT > 100 ? k % 2 === 1 : k % 5 === 4) yield;
  }
  const heightAt = (p, q) => { const dp = (p - o.p) / sc, dq = (q - o.q) / sc, a = dp * cr + dq * sr, b = -dp * sr + dq * cr;
    const t = Math.atan2(a, -b), r = Math.hypot(a, b), R = Rof(t); return r > R ? -1 : sc * hBody(a, b, r / R); };
  return { heightAt, Rof, pt, tl, world, edgeR, Rs, NT, top: sc * hBody(0, 0.6, 0) };
}

// The fall of hair and the fold lines for a heap made by addRobeHeap. Hair is a flat ink sheet lying on the robes,
// splitting into tapered locks where it pools.
export function addHairAndFolds(acc, lines, S, rng, heap, o = {}) {
  const ink = S.pal.ink, white = S.pal.white, Lh = o.hairLen || 19.5, lift = 0.45, ph = rng() * 6.28;
  const surf = (a, b, l) => { const t = Math.atan2(a, -b), R = heap.Rof(t), r = Math.min(R * 0.95, Math.max(0.02, Math.hypot(a, b))); return heap.pt(t, r, r / R, l); };
  const cen = (s) => [0.9 * Math.sin(s * 4.6 + ph) * s + (o.lean || 0) * s * s * 4, 3.0 - (s + 0.12) / 1.12 * (Lh + 3.0)];
  const wid = (s) => (s < 0.02 ? 3.2 + 2.4 * Math.sqrt(Math.max(0, (s + 0.12) / 0.14)) : 5.6 - 1.7 * Math.min(1, (s - 0.02) / 0.3) + 1.1 * Math.max(0, s - 0.4)) * (o.hairW || 1);
  const NC = 8, NS = 30, sSplit = 0.72; let prev = null;
  if (o.hair !== false) {
    for (let j = 0; j <= NS; j++) {
      const s = -0.12 + (sSplit + 0.12) * j / NS, c = cen(s), w = wid(s), row = [];
      for (let i = 0; i <= NC; i++) { const x = (i / NC - 0.5) * w + (i === 0 || i === NC ? rng.range(-0.12, 0.12) : 0);
        const P = surf(c[0] + x, c[1], lift); row.push(acc.v(P[0], P[1], P[2], x, s * Lh, ink, [0, 0.6, ph, 0], [-0.3, 0, 0, 0])); }
      if (prev) acc.rows(prev, row); prev = row;
    }
    const c0 = cen(sSplit), w0 = wid(sSplit);
    for (let k = 0; k < NC; k++) {                                // the locks
      const x0 = ((k + 0.5) / NC - 0.5) * w0, lw = w0 / NC * 1.15, fan = (k + 0.5 - NC / 2) * rng.range(0.03, 0.08), len = rng.range(4, 9), bend = rng.range(-0.35, 0.35);
      let pr = null;
      for (let j = 0; j <= 7; j++) { const f = j / 7, d = f * len, ang = fan + bend * f * f;
        const cx = c0[0] + x0 + Math.sin(ang) * d, cy = c0[1] - Math.cos(ang) * d, hw = lw * 0.5 * (1 - f * f) + 0.02;
        const A = surf(cx - hw * Math.cos(ang), cy - hw * Math.sin(ang), lift), B = surf(cx + hw * Math.cos(ang), cy + hw * Math.sin(ang), lift);
        const row = [acc.v(A[0], A[1], A[2], x0, d, ink, [0, 0.6, ph, 0], [-0.3, 0, 0, 0]), acc.v(B[0], B[1], B[2], x0 + lw, d, ink, [0, 0.6, ph, 0], [-0.3, 0, 0, 0])];
        if (pr) acc.quad(pr[0], pr[1], row[1], row[0]); pr = row; }
    }
    // the paper tie
    const st = 0.36, ct = cen(st), wt = wid(st) * 0.56;
    const T = [surf(ct[0] - wt, ct[1] + 0.5, lift + 0.2), surf(ct[0] + wt, ct[1] + 0.5, lift + 0.2), surf(ct[0] + wt, ct[1] - 0.5, lift + 0.2), surf(ct[0] - wt, ct[1] - 0.5, lift + 0.2)];
    const ti = T.map((P, i) => acc.v(P[0], P[1], P[2], i % 2, i > 1 ? 1 : 0, white, [0, 0.6, ph, 0], null)); acc.quad(ti[0], ti[1], ti[2], ti[3]);
  }
  if (!lines) return;
  // sleeve wings: two outlines each, doubled where they turn; then long fold strokes down the mound
  for (const sx of [-1, 1]) for (let rep = 0; rep < 3; rep++) {
    const pts = [], r0 = 4.6 + rep * 1.9 + rng.range(-0.3, 0.3), a0 = rng.range(-0.3, 0.1), a1 = Math.PI * rng.range(0.95, 1.2);
    for (let m = 0; m <= 22; m++) { const an = a0 + (a1 - a0) * m / 22; pts.push(surf(sx * (9.6 + Math.cos(an) * r0 * 0.95), -1 - Math.sin(an) * r0 * 1.15, 0.12)); }
    lines.add(pts, 0.085, 0.6, 4);
  }
  const nf = o.folds || 16;
  for (let k = 0; k < nf; k++) {
    const t0 = -Math.PI + (k + rng()) / nf * 2 * Math.PI, f0 = rng.range(0.28, 0.5), f1 = rng.range(0.8, 0.99), cv = rng.range(-0.25, 0.25), pts = [];
    if (Math.abs(t0) < 0.22 && o.hair !== false) continue;
    for (let m = 0; m <= 14; m++) { const f = f0 + (f1 - f0) * m / 14, t = t0 + cv * (f - f0) * (f - f0) * 3;
      const i = Math.round((t + Math.PI) / (2 * Math.PI) * heap.NT), r = heap.edgeR(0, ((i % heap.NT) + heap.NT) % heap.NT) * f;
      pts.push(heap.pt(t, r, Math.min(1, r / heap.Rof(t)), 0.12)); }
    lines.add(pts, 0.08, 0.75, 2.5);
  }
}

// The curtain of state: a black lacquer stand, red-lead cloth panels, purple ribbons that stream, shell-white roundels.
// Cloth goes into `cloth` (coat anim 2), the stand into `statics`. p0..p1 along the beam, in the plane q.
export function addCurtain(cloth, statics, S, rng, p0, p1, q, H = 30, o = {}) {
  const ink = S.pal.ink, red = o.col || S.pal.red, white = o.dot || S.pal.white, purple = o.rib || S.pal.purple, np = o.np || 5, gap = 0.5, pw = (p1 - p0 - gap * (np - 1)) / np;
  if (!o.hung) addBar(statics, rng, 'p', p0 - 2.5, p1 + 2.5, H - 0.2, H + 1.2, q - 0.7, q + 0.7, ink, 0, 0.06);       // crossbar
  for (const p of o.hung ? [] : [p0 + 6, p1 - 6]) {
    addBar(statics, rng, 'h', 0, H, p - 0.6, p + 0.6, q - 0.6, q + 0.6, ink, 0, 0.05);
    addBar(statics, rng, 'p', p - 4.5, p + 4.5, 0, 1.5, q - 2.6, q + 2.6, ink, 0, 0.05);                  // foot
  }
  for (let k = 0; k < np; k++) {
    const a = p0 + k * (pw + gap), phs = rng() * 6.28, hem = rng.range(1.6, 3.2), NX = 4, NY = 12; let prev = null;
    const wOf = (h) => Math.pow(Math.max(0, (H - 0.6 - h) / (H - 0.6)), 1.3);
    for (let j = 0; j <= NY; j++) { const h = H - 0.4 - (H - 0.4 - hem) * j / NY, row = [];
      for (let i = 0; i <= NX; i++) { const p = a + pw * i / NX + (i === 0 || i === NX ? rng.range(-0.1, 0.1) : 0), hh = h + (j === NY ? rng.range(-0.35, 0.35) : 0);
        row.push(cloth.v(p, hh, q - 0.75, p, hh, red, [wOf(hh), phs, 0, 0], [-0.045, 0, 0, 0])); }
      if (prev) cloth.rows(prev, row); prev = row; }
    // roundels, staggered
    for (let m = 0; m < (o.dots || 3); m++) { const cp = a + pw * (m % 2 ? 0.27 : 0.73), chh = H - 5.5 - m * (o.step || 8) - rng.range(0, 1.5), rr = rng.range(1.5, 1.9) * (o.rr || 1), n = 12;
      const c = cloth.v(cp, chh, q - 0.95, cp, chh, white, [wOf(chh), phs, 0, 0], [-0.02, 0, 0, 0]); let first = -1, last = -1;
      for (let i = 0; i < n; i++) { const an = i / n * 6.2832, rj = rr * rng.range(0.92, 1.06), hh = chh + Math.sin(an) * rj;
        const v = cloth.v(cp + Math.cos(an) * rj, hh, q - 0.95, cp + Math.cos(an) * rj, hh, white, [wOf(hh), phs, 0, 0], [-0.02, 0, 0, 0]);
        if (first < 0) first = v; else cloth.tri(c, last, v); last = v; }
      cloth.tri(c, last, first); }
    // the ribbon down the middle of the panel: loose, streaming in the gust
    const rw = 0.75, cp = a + pw * 0.5, rl = rng.range(20, 25) * (o.ribLen || 1), NR = 14; let pr = null;
    for (let j = 0; j <= NR; j++) { const f = j / NR, h = H - 0.2 - rl * f, tw = rw * (1 - 0.3 * f);
      const aa = [0.25 * wOf(h) + f * f * 0.9, phs + 1.3, f * f, 0];
      const row = [cloth.v(cp - tw, h, q - 1.2, cp - tw, h, purple, aa, [-0.3, 0, 0, 0]), cloth.v(cp + tw, h, q - 1.2, cp + tw, h, purple, aa, [-0.3, 0, 0, 0])];
      if (pr) cloth.quad(pr[0], pr[1], row[1], row[0]); pr = row; }
  }
}

export function bandsFor(S, season, rng) {
  const { green, red, purple, white, ochre } = S.pal, t = S.tint;
  let top = purple, b;
  if (season === 'winter') { top = white; b = [t(red), white, red, white, t(purple), white, t(red), red, white, t(green), red]; }
  else if (season === 'spring') { top = t(red); b = [white, t(green), green, white, t(red), red, white, t(green), green, t(purple), white]; }
  else b = [t(purple), white, t(green), green, white, ochre, t(red), red, white, t(purple), green];   // plum outer robe, then to red lead
  if (rng.chance(0.5)) { const i = 8 + rng.int(0, 1); const x = b[i]; b[i] = b[i + 1]; b[i + 1] = x; }
  return { top, bands: b };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  const S = opts.style || createStyle(opts);
  const U = S.uniforms, root = new THREE.Group();
  const bayP0 = -12;                       // port post of the hero bay; the path crosses the threshold at p = 0
  const statics = makeAcc(), blinds = makeAcc(), cloth = makeAcc(), robes = makeAcc(), lines = makeLines(rng);
  const add = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; root.add(m); return m; };

  // floors: tier one's mats end at the wall line (q = 0), where the next tier falls away under the path; behind the
  // wall two matted platforms carry the lady (starboard) and the curtain (port), leaving the slot we fly through.
  // Their inner edges are stepped so no receding line runs longer than a mat end.
  {
    const f = makeAcc(), c = S.pal.green, e = opts.floorExtent || [-178, 152, -70];
    const rect = (p0, p1, q0, q1) => f.quad(f.v(p0, 0, q0, p0, q0, c), f.v(p1, 0, q0, p1, q0, c), f.v(p1, 0, q1, p1, q1, c), f.v(p0, 0, q1, p0, q1, c));
    if (opts.floor !== false) rect(e[0], e[1], e[2], 1.2);
    const stS = [7.6, 10.4 + rng.range(-0.6, 0.6), 8.8 + rng.range(-0.6, 0.6)], stP = [-8.2, -11 + rng.range(-0.6, 0.6), -9.2 + rng.range(-0.6, 0.6)];
    const enS = [63, 70, 66], enP = [-72, -78, -75];           // the far ends, stepped too: beyond them the wall stands over the drop
    for (let k = 0; k < 3; k++) { const q0 = k === 0 ? 1.2 : 12 * k, q1 = 12 * (k + 1); rect(stS[k], Math.min(e[1], enS[k]), q0, q1); if (k < 2) rect(Math.max(e[0], enP[k]), stP[k], q0, Math.min(q1, 16.5));   // the port one ends just behind the curtain: nothing floats over the drop
      for (const pe of [stS[k], stP[k]]) { const pts = [], qe = pe < 0 ? Math.min(q1, 16.5) : q1; for (let m = 0; m <= 6; m++) pts.push([pe + rng.range(-0.08, 0.08), 0.15, q0 + (qe - q0) * m / 6]); if (qe > q0 + 1) lines.add(pts, 0.09, 0.4); }
      if (k < 2) for (const [a, b] of (k === 0 ? [[stS[k], stS[k + 1]], [stP[k], stP[k + 1]]] : [[stS[k], stS[k + 1]]])) lines.add([[a, 0.15, q1], [(a + b) / 2, 0.15, q1 + 0.1], [b, 0.15, q1]], 0.09, 0.3); }
    add(f.build(), S.coatMaterial({ floor: true, under: [0, 13.5, 0, 0.7], chip: 3.2 }));
  }
  await ctx.yield();
  let wall; { const g = buildWall(S, rng, statics, blinds, { bayP0, tearStarboard: false }); let r = g.next(); while (!r.done) { await ctx.yield(); r = g.next(); } wall = r.value; }
  await ctx.yield();

  // the lady, behind the hero blind, her back to us; sleeves and train spilling under the hem toward -q
  const season = opts.season || 'autumn', LS = 0.8, lady = { p: 17.5 + rng.range(-0.5, 0.5), q: 7.5 + rng.range(-0.8, 0.8) };   // nearer the wall line and the blind, so heap and hair stand whole below the blind's hem
  const col = bandsFor(S, season, rng);
  const heap = await addRobeHeapAsync(robes, lines, S, rng, { p: lady.p, q: lady.q, scale: LS, rot: -0.3 + rng.range(-0.05, 0.05), bands: col.bands, top: col.top, drapeQ: 0, loss: 0.03, nearSide: -1,
    lobes: [[rng.range(-0.06, 0.06), rng.range(17.5, 20), rng.range(0.3, 0.36)], [rng.range(0.7, 0.86), rng.range(14, 18), rng.range(0.2, 0.25)], [-rng.range(0.52, 0.58), rng.range(9.5, 11.5), rng.range(0.19, 0.23)]] }, ctx.yield);
  await ctx.yield();
  addHairAndFolds(robes, lines, S, rng, heap, { lean: rng.range(-0.2, 0.2), hairLen: 24.5 * LS, hairW: 1.3 });
  await ctx.yield();
  // an attendant at half size tucked in at the lady's far side, also turned away
  const c2 = bandsFor(S, season, rng);
  const page = addRobeHeap(robes, lines, S, rng, { p: 49 + rng.range(-2, 2), q: 27 + rng.range(-1.5, 1.5), scale: 0.5, rot: rng.range(-0.5, 0.5), segs: 80, lift: 0.5,
    nearSide: 0, bands: c2.bands.slice(4), top: rng.chance(0.5) ? S.pal.white : S.pal.green, loss: 0.03 });
  await ctx.yield();
  addHairAndFolds(robes, lines, S, rng, page, { folds: 9, hairLen: 17 });
  await ctx.yield();
  addCurtain(cloth, statics, S, rng, -64, -9, 10 + rng.range(-1, 1), 30);
  await ctx.yield();

  add(await statics.buildAsync(ctx.yield), S.coatMaterial({ under: [0, 0, 0, 0] }));
  await ctx.yield();
  add(await blinds.buildAsync(ctx.yield), S.coatMaterial({ anim: 1, blind: true, under: [0, 4.5, 0, 0.7], chip: 2.8 }));
  await ctx.yield();
  add(await cloth.buildAsync(ctx.yield), S.coatMaterial({ anim: 2, under: [5.2, 0, 0.8, 0], chip: 2.2 }));
  await ctx.yield();
  add(await robes.buildAsync(ctx.yield), S.coatMaterial({ anim: 3, under: [0, 1.1, 0, 0.55], chip: 1.9, crackle: 0.42 }));
  await ctx.yield();
  add(await lines.buildAsync(ctx.yield), contourMaterial(S), 2);
  await ctx.yield();

  // flakes that lift off robes, blind, curtain and mats as the first gust front crosses the wall
  const NF = Math.round(1500 * detail), aO = new Float32Array(NF * 3), aF = new Float32Array(NF * 4), aC = new Float32Array(NF * 3);
  const P = S.pal, robeCols = [col.top, col.top, ...col.bands];
  for (let i = 0; i < NF; i++) {
    const k = rng(); let p, h, q, c;
    if (k < 0.2) { let tries = 0; do { p = lady.p + LS * rng.range(-30, 30); q = lady.q + LS * rng.range(-32, 16); h = heap.heightAt(p, q); } while (h < 0 && ++tries < 8);
      if (h < 0) { h = 0.3; c = P.green; } else c = rng.pick(robeCols); h += 0.4; }
    else if (k < 0.55) { p = bayP0 + 1 + rng.range(0, 43) + (rng.chance(0.3) ? 45 : 0); h = rng.range(6, 44); q = -1.8; c = rng.chance(0.8) ? P.ochre : P.green; }
    else if (k < 0.66) { p = rng.range(-64, -9); h = rng.range(3, 29); q = 9; c = rng.chance(0.75) ? P.red : P.white; }
    else { p = rng.range(-90, 80); q = rng.range(-45, 40); h = 0.3; c = rng.chance(0.85) ? P.green : P.white; }
    aO.set([p, h, q], i * 3); aC.set([c.r, c.g, c.b], i * 3);
    aF.set([rng() * 10, rng.range(0.7, 2.4) * (rng.chance(0.12) ? 1.6 : 1), rng.range(-8, 95) * rng(), rng.chance(0.22) ? 3 : 0], i * 4);
    if ((i & 255) === 255) await ctx.yield();
  }
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  fg.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); fg.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4));
  fg.setAttribute('aCol', new THREE.InstancedBufferAttribute(aC, 3));
  for (let i = 0; i < NF; i++) aF[i * 4 + 1] *= 0.72;          // the hero's own flakes are small and few: chips of paint in the air, never a scatter of shards over her robes
  fg.instanceCount = Math.max(1, Math.round(NF * 0.5));
  fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  add(fg, flakeMaterial(S), 3);

  // ---- progress: everything is keyed to the world's u through the gust fronts ----
  let uSet = -1; const wp = new THREE.Vector3(), size = new THREE.Vector2();
  const C = [0.08, 0.40, 0.70], ss = ctx.core ? ctx.core.smoothstep : (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function apply(u) {
    root.getWorldPosition(wp);
    U.uFronts.value.set(wp.z - 250 + 810 * (2 * u - C[0]), wp.z - 250 + 810 * (2 * u - C[1]), wp.z - 250 + 810 * (2 * u - C[2]));
    U.uDraw.value = ss(0.2, 0.3, u);
  }
  const hand = U.uHand.value, sp = (p, q, h) => shearPoint(p, q, h, hand);
  return {
    object: root, style: S, radius: 62, height: 62, center: sp(10, 6, 20), ground: false, groundY: 0,
    anchors: {
      place: new THREE.Vector3(0, -10, 250),
      flyThrough: [new THREE.Vector3(0, 10, -250), new THREE.Vector3(0, 10, -60), new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 10, 70)],
      threshold: new THREE.Vector3(0, 10, 0),
      lady: sp(lady.p, lady.q, heap.top * 0.5), ladyTop: sp(lady.p, lady.q, heap.top),
      curtainEnd: sp(-9, 9, 15), blindHem: sp(10.5, -1.5, 25), bayPosts: [sp(bayP0, 0, 0), sp(bayP0 + 45, 0, 0)],
      wallPosts: wall.posts.map((p) => sp(p, 0, 0)), wallEnds: [sp(wall.posts[0] - 16, 0, 0), sp(wall.posts[6] + 16, 0, 0)],
      viewpoints: [new THREE.Vector3(0, 10, -250), new THREE.Vector3(0, 10, -75), new THREE.Vector3(0, 10, -12)],
    },
    heightAt: heap.heightAt,
    setProgress(u) { uSet = u; apply(u); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.x > 0) U.uPx.value.copy(size); }
      if (uSet < 0) apply(0.12 + 0.22 * ((time / 16) % 1));      // alone in the viewer: loop the first gust
    },
    dispose() {},
  };
}
