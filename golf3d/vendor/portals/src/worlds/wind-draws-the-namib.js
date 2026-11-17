// THE DESERT THE WIND DRAWS - the Namib as sand animation on a sheet of lit glass.
// Light comes from below, so tone is thickness: bare glass blazes, sand runs gold to umber-black. We ride the
// head of one wind stroke down a blazing furrow toward the Great Dune, a gust wipes a whole dune away on our
// right, gemsbok are sifted out of its settling sand at the gallop, and we run with them across the bare glass
// of Deadvlei, through dead trees drizzled in single lines, and up a fresh furrow to a ring in a notch.
// Everything is this world's own ShaderMaterials (style: none); there are no lights and no cast shadows.
//
// Beats (keyed to u): 0-0.13 the furrow (cream road, slumping ridges, bow wave, welwitschia, sandgrouse overhead), a troop of ostriches
// sprinting down the road just ahead of our stroke, two gemsbok on a heap of the right-hand ridge at 0.08; 0.13-0.20 we rise out of the
// furrow as the troop bolts out to the left over the ridge's end; 0.20-0.30 it races us along the finger lanes and we pass it;
// 0.295-0.42 the palm wipes the dune (front in view 0.34-0.40, gold-out 0.40-0.44); 0.37-0.42 the herd is sifted in;
// 0.42-0.66 the gallop over the pan, the bull at 8 m at 0.61, one old tree at 12 m right at 0.65; 0.655 the stroke head
// shoots ahead and scratches a glowing line up the arm, the herd runs up it beneath us (0.68-0.80) and peels off left;
// 0.80-1 the trench (ploughed in the vertex shader as the head passes), the plume at 0.86, sentinels, the ring.
// Rare visit: at u 0.585 a second palm blows every tree off the glass into streamers; over 0.62-0.685 each is drizzled again from the root.
// Added to those beats, by where things are and never by a share of the flight: behind the palm's front the fingers' combed strokes
// lie on the bared glass; behind every runner its smear and its row of prints stay on the glass for as far back as it has run;
// and where the herd's line leaves our furrow, fourteen of its animals run straight on up the arm in two files, one along the
// outer shoulder of each wall of the furrow, over the crest beside the ring.
//
// World space == the hero's local space. The camera flies toward -X along z = 210 (leg 1), bends 22 degrees
// right at x = -240 and runs straight (leg 2, coordinates a along / b to the left) up the Great Dune's arm.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, SAND_GLSL, GLASS_GLSL, COMB_GLSL, addGlassMarks, addFiles } from '../parts/wind-draws-the-namib.js';

const PALETTE = ['#FFF1CF', '#F6B85A', '#D9772B', '#9E4420', '#4A2212', '#150A07', '#A9C3CC'];
const Z0 = 210, X_IN = 300, X_BEND = -240, DUR = 50;
const TURN = 22 * Math.PI / 180, DX = -Math.cos(TURN), DZ = -Math.sin(TURN), LX = DZ, LZ = -DX;   // leg-2 heading and its left
const A_FOOT = 131, A_END = 366;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = (v) => v.toFixed(3);

// the ripple fields' film of sand: shared by the floor and by the skirts of the furrow's ridges, so they meet without an edge
const FIELD_GLSL = /* glsl */`
// four finger lanes run on from where our furrow ends: bare glass, a lip of displaced sand heaped along each edge
float fingerLanes(vec2 xz, float fw, out float lip, out float grp){
  float x = xz.x, lz = xz.y - ${f1(Z0)} - (3.4 + 1.6 * sin(x * 0.023 + 0.7) + 0.4 * sin(x * 0.09 + 2.));
  float fz = lz / 2.4 - 0.5, fk = floor(fz + 0.5);
  float fing = abs((fz - fk) * 2.4 - 0.34 * sin(x * 0.05 + fk * 1.9) - 0.2 * sin(x * 0.13 + fk * 4.1));      // each finger wanders by itself
  float w = 0.22 + 0.2 * h11(fk + 2.) + 0.1 * sin(x * 0.07 + fk * 2.3);
  float on = step(abs(lz), 4.8) * smoothstep(-95., -45., x) * (1. - smoothstep(62., 90., x));
  grp = (1. - smoothstep(4.7, 5.9, abs(lz))) * smoothstep(-95., -45., x) * (1. - smoothstep(62., 90., x));      // the whole hand's width
  on *= smoothstep(0.16, 0.36, vn2(vec2(x * 0.045 + fk * 9.1, 4.)));              // a finger lifts here and there
  lip = smoothstep(w - 0.05, w + 0.07, fing) * (1. - smoothstep(w + 0.1, w + 0.42 + fw, fing)) * on;
  return (1. - smoothstep(w, w + 0.09 + fw * 0.6, fing)) * on;
}
// glass a palm has wiped: a breath of dust, the long streaks its fingers left, and here and there the ghost of the old ripples
float wipedFilm(vec2 xz, float fw, float n1, float n2, float crest, float rpF){
  float wz = xz.y + 0.16 * xz.x + 9. * vn2(vec2(xz.x * 0.015, 3.)) + 2.4 * vn2(vec2(xz.x * 0.055, 11.));      // the strokes swing and wander together
  float s1 = smoothstep(0.6, 0.82, vn2(vec2(xz.x * 0.013 + 3., wz * 0.42))) * (1. - clamp(fw * 0.3, 0., 1.));
  float s2 = smoothstep(0.62, 0.86, vn2(vec2(xz.x * 0.027, wz * 1.7 + 9.))) * (1. - clamp(fw * 1.0, 0., 1.));
  float s3 = smoothstep(0.68, 0.86, vn2(vec2(xz.x * 0.05 + 5., wz * 4.3))) * (1. - clamp(fw * 2.6, 0., 1.));
  float nL = vn2(vec2(xz.x * 0.085 + 2., wz * 0.7 + 4.));      // (a streak thickens and thins along its own length, never on a lattice)
  float gp = smoothstep(0.5, 0.7, vn2(vec2(xz.x * 0.05 + 3., wz * 0.09) + 1.2 * n1));      // a ghost survives as a patch of whole arcs
  float ghost = crest * rpF * smoothstep(0.55, 0.8, vn2(xz * 0.06 + 7.)) * gp;
  return 0.0035 + 0.007 * n1 + 0.06 * s1 * (0.3 + 0.7 * nL) + 0.03 * s2 + 0.026 * s3 * nL + 0.014 * ghost * (1. - s2) * (1. - s3);
}
// the ripple fields: sand combed on the lit glass. Broad patches a palm has wiped almost bare, films of sand between them,
// and wind ripples whose crests stand as dark lines near the eye and thin to a wash with distance
float fieldFilm(vec2 xz, float fw, float farK, float n1, float n2, float n3, out float rp, out float rpF){
  float big = fbm2(xz * 0.006 + uSeed * 1.7);
  float bare = 1. - smoothstep(0.3, 0.4, big + 0.14 * (n1 - 0.5));
  vec2 pa = (xz - vec2(42., ${f1(Z0 + 19)})) / vec2(74., 12.5);                  // the smear the ostriches run along
  bare = max(bare, 1. - smoothstep(0.78, 1.04, length(pa) + 0.4 * (n1 - 0.5) + 0.12 * (n3 - 0.5)));
  float film = mix(0.04 + 0.3 * n1 * n1, 0.015 + 0.2 * smoothstep(0.42, 0.72, fbm2(xz * 0.0035 + uSeed)), farK);
  film *= 0.55 + 1.3 * smoothstep(0.4, 0.8, big);
  rpF = (1. - clamp(fw * 0.9, 0., 1.)) * (1. - farK);
  // wind ripples: two sets of crests, one twice as far apart as the other and lying at another angle, each ruling its own patches;
  // where the patches meet the crests fork and die out, and a slow warp makes every crest wander
  float wm = vn2(xz * 0.31 + 5.);
  float ph1 = dot(xz, vec2(4.9, 1.2)) + 9. * n1 + 3. * n3 + 1.5 * n2 + 3.6 * wm;
  float ph2 = dot(xz, vec2(2.7, -1.25)) + 6. * n1 + 4. * n3 + 2.2 * wm;
  float pb = smoothstep(0.38, 0.62, vn2(xz * 0.055 + 21.));
  rp = mix(sin(ph1), sin(ph2), pb);
  float c = 0.5 + 0.5 * rp, crest = c * c; crest *= crest;                        // narrow crests, broad troughs
  float lip, grp, ln = fingerLanes(xz, fw, lip, grp);
  // (here and there the ripples sink back into the film; and the hand that drew the four lanes smoothed them away between its fingers)
  crest *= (0.25 + 0.75 * smoothstep(0.22, 0.6, vn2(xz * 0.21 + 31.))) * (1. - grp);
  film *= 0.45 + (1.5 + 0.8 * uStill) * mix(0.375, crest, rpF);                   // (a windless day keeps its ripples crisp)
  float lineF = (1. - clamp(fw * 2.4, 0., 1.)) * (1. - farK);
  // one crest in three or four is heaped into a strong umber line, and that line breaks along its length; the rest stay sienna
  float cid = floor(mix(ph1, ph2, step(0.5, pb)) / 6.2832 + 0.25);
  float strong = step(0.68, h11(cid * 1.31 + 3.)) * smoothstep(0.3, 0.6, vn2(vec2(dot(xz, vec2(-0.24, 0.97)) * 0.25 + cid * 3.7, cid)));
  film += (0.22 + (1.0 + 2.2 * n1) * strong) * crest * crest * lineF * smoothstep(0.03, 0.2, film);
  film += 0.05 * smoothstep(0.6, 0.95, rp) * rpF * (0.3 + n1);
  film = mix(film, wipedFilm(xz, fw, n1, n2, crest, rpF), bare * (1. - farK));
  film += lip * (0.45 + 0.9 * n2) * (1. - clamp(fw * 0.5, 0., 1.)) * (1. - 0.7 * bare);
  return mix(film, 0.002 + 0.004 * n2, ln);
}
// what a fingertip dragged over glass leaves across its own track: hairline chatter marks of dust, unevenly spaced, short and broken
float chatter(float lat, float s, float fq){
  float sb = s + 0.012 * lat * lat;
  float q = sb / 2.6 + 0.6 * vn2(vec2(sb * 0.09, 4.)), k = floor(q), f = fract(q) - 0.5;
  float on = step(0.4, h11(k + 5.)) * smoothstep(0.38, 0.6, vn2(vec2(lat * 1.5 + k * 7.3, k)));
  float w = 0.005 + 0.014 * h11(k + 9.);
  return (1. - smoothstep(w, w + 0.012 + fq, abs(f + 0.25 * (h11(k) - 0.5)))) * on * (1. - smoothstep(0.1, 0.35, fq));
}
// what a fingertip leaves on wiped glass: a few streaks of unequal width that wander, taper, break and smudge
float roadStreaks(float lat, float sx, float nA, float nB, float fw){
  float strk = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float c = (fi - 2.) * 1.5 + 1.1 * (h11(fi + 3.) - 0.5) + 1.2 * sin(sx * (0.085 + 0.021 * fi) + fi * 2.4) + 0.55 * sin(sx * 0.27 + fi * 5.1) + 3.4 * (vn2(vec2(sx * 0.031 + fi * 7.7, 2.)) - 0.5);
    float wd = (0.06 + 0.3 * h11(fi + 9.) * h11(fi + 9.)) * (0.2 + 1.6 * vn2(vec2(sx * 0.047 + fi * 3.1, 5.)));
    float on = smoothstep(0.34, 0.52, vn2(vec2(sx * 0.06 + fi * 11.3, 8.)));
    float e = abs(lat - c) + (0.5 * (nA - 0.5) + 0.25 * (nB - 0.5)) * (0.3 + wd);
    strk = max(strk, (1. - smoothstep(wd * 0.3, wd + 0.5 * fw, e)) * on * (0.4 + 0.6 * h11(fi + 1.)));
  }
  return strk * (1. - clamp(fw * 0.9, 0., 1.));
}
`;

// ---------- the floor: one pane of lit glass, every film of sand on it drawn in the fragment shader ----------
const FLOOR_VERT = /* glsl */`
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLOOR_FRAG = /* glsl */`
uniform vec4 uRect; uniform vec4 uPan; uniform vec3 uHead; uniform vec4 uAdder; uniform float uStill; uniform vec2 uShDir;
varying vec3 vW;
${SAND_GLSL}
${GLASS_GLSL}
${FIELD_GLSL}
${COMB_GLSL}
#include <fog_pars_fragment>
float sdRect(vec2 p){ vec2 c = 0.5 * (uRect.xy + uRect.zw), h = 0.5 * (uRect.zw - uRect.xy); vec2 q = abs(p - c) - h; return length(max(q, 0.)) + min(max(q.x, q.y), 0.); }
void main(){
  vec2 xz = vW.xz;
  if (xz.x > uRect.x && xz.x < uRect.z && xz.y > uRect.y && xz.y < uRect.w) discard;
  vec3 V = normalize(cameraPosition - vW);
  float fw = fwidth(xz.x) + fwidth(xz.y);
  vec3 glass = glassLook(xz, V, fw);
  float lat = xz.y - ${f1(Z0)}, dA = ${f1(X_IN)} - xz.x;
  float n1 = fbm2(xz * 0.021 + uSeed), n2 = vn2(xz * 0.9), n3 = vn2(xz * 0.17 + 3.);
  // Deadvlei: an oval of bare glass; its edge is one line
  vec2 pq = (xz - uPan.xy) / uPan.zw;
  float pe = length(pq) - 1. + 0.1 * (fbm2(xz * 0.012 + uSeed) - 0.5);
  float pan = 1. - smoothstep(-0.012, 0.012, pe);
  float mR = smoothstep(1., 18., sdRect(xz));                  // the dune stands on bare glass
  float farK = smoothstep(230., 700., abs(lat - 40.));
  // the ripple fields: combed films, gold in the troughs, sienna on the crests
  float rp, rpF;
  float film = fieldFilm(xz, fw, farK, n1, n2, n3, rp, rpF);
  // comb strokes: four fingers at a time cross the fields and leave clean lines that refill behind them
  float comb = 0., combLip = 0., fwz = fw * 0.6;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float zr = h11(fi * 3.1 + uSeed) - 0.5; float zc = ${f1(Z0)} + sign(zr) * (11. + abs(zr) * 160.);
    float hx = 340. - mod(uTime * (24. + 14. * h11(fi + 7.)) * (1. - 0.6 * uStill) + fi * 97., 560.);
    float back = xz.x - hx;
    float lz = xz.y - zc - 3. * sin(xz.x * 0.02 + fi) - 0.5 * sin(xz.x * 0.13 + fi * 2.);
    float fing = abs(fract(lz / 2.4) - 0.5) * 2.4, wd = 0.3 + 0.13 * h11(fi * 5.3 + floor(lz / 2.4));
    float cut = smoothstep(0., 2.5, back) * (1. - smoothstep(40., 300., back)) * step(abs(lz), 4.8);      // bare behind the head, refilling far behind
    comb = max(comb, (1. - smoothstep(wd, wd + 0.1 + fwz, fing)) * cut);
    combLip = max(combLip, smoothstep(wd - 0.05, wd + 0.07, fing) * (1. - smoothstep(wd + 0.1, wd + 0.42 + fwz, fing)) * cut * (1. - smoothstep(90., 260., back)));
  }
  film += combLip * (0.4 + 0.9 * n2) * (1. - clamp(fw * 0.5, 0., 1.)) * smoothstep(0.01, 0.06, film);     // displaced sand heaped along each finger
  film = mix(film, 0.002 + 0.005 * n2, comb * (1. - clamp(fw * 0.12, 0., 1.)));
  float cr0 = 0.5 + 0.5 * rp; cr0 *= cr0; cr0 *= cr0;
  film = mix(wipedFilm(xz, fw, n1, n2, cr0, rpF), film, smoothstep(26., 80., sdRect(xz))) * (1. - pan);      // the dune stands in a wiped margin
  // (added) behind the palm's front the fingers' combed strokes run on out of the dune's footprint over the glass beside it
  film += 0.05 * combStreaks(xz, fwidth(xz.y)) * wipeGone(xz) * (1. - smoothstep(45., 70., sdRect(xz)));
  // Deadvlei's floor is never bare white: clay plates under a breath of sand. The dunes' long shadows lie across it, drawn in
  // sand as bands of deeper film running away from the sun-print; wind ripples stand in that film; every plate has a tone of
  // its own, and a drift of darker sand is heaped against the lee of its cracks
  float sAl = dot(xz, uShDir), sAc = dot(xz, vec2(-uShDir.y, uShDir.x));
  float sbN = fbm2(vec2(sAc * 0.021, sAl * 0.0031) + uSeed * 2.) + 0.06 * (n3 - 0.5);
  float shade = smoothstep(0.53, 0.63, sbN), shadeC = smoothstep(0.68, 0.8, sbN);
  float pF = 1. - clamp(fw * 0.8, 0., 1.);
  float pc = 0.5 + 0.5 * sin(dot(xz, vec2(5.7, 2.2)) + 5. * n3 + 2.5 * n1 + 3. * vn2(xz * 0.31 + 5.)); pc *= pc;
  float pRip = (pc - 0.375) * pF * smoothstep(0.3, 0.62, vn2(xz * 0.11 + 17.));
  vec2 cg = xz / 1.35 + 0.3 * vec2(n3, n2), ci = floor(cg), cf = fract(cg); float d1 = 8., d2 = 8., pid = 0.5; vec2 q1 = vec2(0.), q2 = vec2(1., 0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(h21(ci + o), h21(ci + o + 17.3)) - cf; float dd = dot(r, r);
    if (dd < d1) { d2 = d1; q2 = q1; d1 = dd; q1 = r; pid = h21(ci + o + 41.7); } else if (dd < d2) { d2 = dd; q2 = r; }
  }
  float edge = sqrt(d2) - sqrt(d1);
  float crack = (1. - smoothstep(0.012, 0.04 + fw * 0.7, edge)) * (1. - clamp(fw * 0.55, 0., 1.));
  vec2 en = q2 - q1; en /= max(length(en), 1e-4);                  // across the nearest crack, out of this plate
  float leeD = smoothstep(0.05, 0.85, dot(en, vec2(-0.93, -0.37))) * (1. - smoothstep(0.03, 0.4 + 0.3 * n2, edge * 0.7)) * pF;
  float pfilm = 0.006 + 0.007 * (pid - 0.5) * pF + 0.003 * (n1 - 0.5) + 0.011 * pRip * (0.5 + shade);
  pfilm += shade * (0.006 + 0.006 * n2) + shadeC * (0.018 + 0.022 * n1) + leeD * (0.022 + 0.04 * n2) * (1. + 0.6 * shade);
  pfilm += crack * (0.05 + 0.06 * n3);
  film += pan * mR * max(pfilm, 0.003);
  // our furrow: a road of bare glass; ahead of the stroke head a film of dust still lies on it
  float fur = (1. - smoothstep(4.2, 6.0, abs(lat) + 0.5 * (n3 - 0.5) + 0.9 * (vn2(vec2(xz.x * 0.4, 3.)) - 0.5))) * (1. - smoothstep(165., 265., dA)) * (1. - pan);
  float ahead = smoothstep(-3., 5., uHead.x - xz.x) * uHead.z;      // 0 behind the head (clean), 1 in front of it
  float fing = roadStreaks(lat, xz.x, n2, vn2(xz * 3.3), fw);      // streaks left by the fingertip
  float smudge = smoothstep(0.62, 0.9, vn2(vec2(lat * 0.45 + 7., xz.x * 0.045))) * (1. - clamp(fw * 0.5, 0., 1.));
  float dust = (0.003 + 0.006 * n1) * mix(0.6, 1.4, ahead) + 0.07 * fing * (0.35 + 0.65 * n3) + 0.014 * smudge * n2;
  dust += 0.015 * chatter(lat, xz.x, fw / 2.6) * (0.4 + 0.6 * n3);
  // (ahead of the stroke head the road has not been swept yet: a breath of dust lies on it in faint ripples)
  float dr = 0.5 + 0.5 * sin(xz.x * 6.4 + 2.5 * n3 + 3. * vn2(xz * 0.4)); dr *= dr;
  dust += ahead * (0.004 + 0.012 * n1 + 0.016 * dr * (1. - clamp(fw * 1.6, 0., 1.)) * smoothstep(0.3, 0.6, vn2(xz * 0.12 + 9.)));
  // beetle stitches: a faint wandering line of paired dots here and there across the furrow floor
  float sc = dA / 19. + 0.5 * n1, sk = floor(sc);
  float sd = (fract(sc) - 0.5) * 19. - lat * (h11(sk) - 0.5) * 2.6 - 1.4 * sin(lat * 0.8 + sk * 2.1) - 0.5 * sin(lat * 2.3 + sk);
  float dots = 1. - smoothstep(0.1, 0.25, abs(fract(lat / 0.17 + 0.4 * sin(lat * 3.7 + sk) + 0.5 * step(0., sd)) - 0.5));
  float stitch = (1. - smoothstep(0.015, 0.04 + fw, abs(abs(sd) - 0.06))) * dots * step(0.5, h11(sk + 4.)) * (1. - clamp(fw * 7., 0., 1.));
  dust += 0.06 * stitch;
  film = mix(film, dust, fur);
  // the adder's ladder: parallel J marks written one after another across a ripple slope
  vec2 ar = xz - uAdder.xy; vec2 ad = vec2(cos(uAdder.z), sin(uAdder.z));
  float aq = dot(ar, ad), ap = dot(ar, vec2(-ad.y, ad.x));
  float qh = mod(uTime * 0.9, 31.);
  float inL = step(0., aq) * step(aq, min(qh, 25.)) * (1. - smoothstep(0.75, 0.85, abs(ap)));
  float am = abs(fract((aq - 0.4 * ap + 0.25 * ap * ap) / 1.05) - 0.5) * 1.05;
  float mark = (1. - smoothstep(0.03, 0.07 + fw * 0.6, am)) * inL * (1. - clamp(fw * 1.2, 0., 1.));
  float lipA = (1. - smoothstep(0.08, 0.2 + fw * 0.6, am)) * inL * (1. - clamp(fw * 1.2, 0., 1.));
  float snake = (1. - smoothstep(0.035, 0.07, abs(ap - 0.3 * sin((aq - qh) * 14. + uTime * 6.)))) * step(qh, aq) * step(aq, qh + 0.5) * step(qh, 25.);
  film = mix(film * (1. + 0.9 * lipA), 0.01, mark) + snake * 1.5 * (1. - pan);
  // sand snakes: wisps of loose grains skimming the surface on the wind
  vec2 wq = vec2(dot(xz, vec2(0.93, 0.37)) + uTime * 9., dot(xz, vec2(-0.37, 0.93)));
  float wisp = smoothstep(0.58, 0.78, vn2(vec2(wq.x * 0.03, wq.y * 0.85) + 2. * n1)) * smoothstep(0.3, 0.7, vn2(vec2(wq.x * 0.012 + 5., wq.y * 0.05)));
  wisp *= (1. - clamp(fw * 0.12, 0., 1.)) * (1. - 0.6 * uStill) * mR * (1. - 0.85 * fur);      // (our furrow is swept clean: bare cream)
  film = film * (1. - 0.4 * wisp) + 0.035 * wisp;
  // grain: still, world-anchored, faded to its mean before it can crawl
  float n4 = vn2(xz * 7.3), n5 = vn2(xz * 23.);
  film *= 1. + 0.5 * (n2 - 0.5) * (1. - clamp(fw * 0.9, 0., 1.)) + 0.55 * (n4 - 0.5) * (1. - clamp(fw * 6., 0., 1.)) + 0.5 * (n5 - 0.5) * (1. - clamp(fw * 18., 0., 1.));
  film += 0.012 * smoothstep(0.78, 0.95, n4) * n5 * (1. - clamp(fw * 8., 0., 1.));
  vec3 col = sandRamp(max(film, 0.), glass);
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- dunes, ridges, hummocks, thorn and ribbons: sand standing on the glass ----------
const DUNE_VERT = /* glsl */`
attribute vec2 aD; attribute float aG; attribute vec2 aC; attribute vec3 aN2; attribute vec4 aW;
uniform vec4 uLeg; uniform vec3 uFur;
varying vec3 vW; varying vec3 vN; varying vec2 vD; varying float vG; varying vec2 vC; varying vec4 vWl;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  vec3 n = normal;
#ifdef USE_INSTANCING
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); n = mat3(instanceMatrix) * n;
#else
  vec4 wp = modelMatrix * vec4(position, 1.);
#endif
  if (aG > 1.5) wp.y += aD.y * 0.08 * sin(uTime * 3.1 + wp.x * 1.7 + wp.z * 2.3);   // frayed ribbons and thorn tremble
  if (aG > 0.5 && aG < 1.5) {      // the trench up the Great Dune is ploughed by the stroke head: ahead of it the arm is still whole
    float la = dot(wp.xz - uLeg.xy, uLeg.zw);
    float ah = smoothstep(uFur.x - 5., uFur.x + 3., la);
    wp.y += aC.x * ah; n = mix(n, aN2, ah);
  }
  vW = wp.xyz; vN = n + vec3(0., 1e-5, 0.); vD = aD; vG = aG; vC = aC; vWl = aW;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DUNE_FRAG = /* glsl */`
uniform vec4 uLeg; uniform vec3 uFur; uniform float uStill, uHerdS; uniform vec3 uHT[17];
varying vec3 vW; varying vec3 vN; varying vec2 vD; varying float vG; varying vec2 vC; varying vec4 vWl;
${SAND_GLSL}
${GLASS_GLSL}
${FIELD_GLSL}
#include <fog_pars_fragment>
void main(){
  vec2 xz = vW.xz;
  vec3 V = normalize(cameraPosition - vW);
  float fw = fwidth(xz.x) + fwidth(xz.y);
  vec3 glass = glassLook(xz, V, fw);
  float n1 = fbm2(xz * 0.08), n2 = vn2(xz * 0.9);
  vec3 N = normalize(vN);
  vec3 col;
  if (vG > 1.5) {
    float rim = 1. - abs(dot(N, V));
    float eg = abs(vD.x);      // (a welwitschia ribbon thins to a film at both edges, and frays there)
    float dRib = 7. * max(exp(-5.5 * rim * rim), 0.3) * (0.5 + n2) * (1. - 0.985 * smoothstep(0.35, 0.95, eg + 0.5 * (vn2(xz * 9.) - 0.5) * step(0.05, eg)));
    if (eg > 0.05 && eg + 0.45 * (vn2(xz * 13. + 3.) - 0.5) > 0.97) discard;
    col = sandRamp(dRib, glass * 0.9);
  } else if (vG < -0.5) {
    // the ridges our stroke heaps up beside the furrow: loose sand, a burning ragged crest, slumping on the
    // furrow side into fans that feather out onto the glass, melting on the far side into the ripple field
    float y = max(vW.y, 0.);
    float inner = 1. - smoothstep(-0.5, 0.5, vD.x);
    float f1n = fbm2(xz * 0.021 + uSeed), f3n = vn2(xz * 0.17 + 3.), rp, rpF;
    float ff = fieldFilm(xz, fw, 0., f1n, n2, f3n, rp, rpF);
    float hgtK = smoothstep(0.15, 1.2, vD.y);
    float furK = 1. - smoothstep(165., 265., ${f1(X_IN)} - xz.x);       // where the furrow ends, its swept glass ends with it
    float base = mix(ff * mix(1., 0.55, hgtK), 0.004 + 0.008 * f1n, inner * furK);
    float g4 = (vn2(xz * 7.3) - 0.5) * (1. - clamp(fw * 6., 0., 1.)), g5 = (vn2(xz * 23.) - 0.5) * (1. - clamp(fw * 18., 0., 1.));
    float nb = fbm2(xz * 0.37 + 5.);
    float d = y * (0.9 + 1.5 * nb);
    float wr = sin(dot(xz, vec2(7.5, 2.1)) + 5. * n2 + 2. * nb) * (1. - clamp(fw * 2.2, 0., 1.));      // wind ripples on the outer slope
    d *= 1. + 0.8 * g4 + 0.7 * g5 + 0.3 * wr * (1. - inner);
    float w = clamp(y / max(vD.y * 0.385, 0.2), 0., 1.);
    float cs = xz.x / 0.85 + 2.2 * n2; float ck = floor(cs); float cf = abs(fract(cs) - 0.5);
    float fanW = 0.08 + 0.34 * (1. - w);
    float fan = (1. - smoothstep(fanW * 0.6, fanW, cf)) * step(0.35, h11(ck + 9.)) * inner * (1. - clamp(fw * 2., 0., 1.));
    float flow = vn2(vec2(xz.x * 7., y * 9. + uTime * (1.2 + 1.6 * h11(ck))));
    d = mix(d, d * (0.18 + 0.5 * flow), fan * (0.6 + 0.4 * sin(uTime * (0.6 + h11(ck + 3.)) + 30. * h11(ck))));
    float dEff = base + d;
    float below = max(abs(vD.x) - fw * 1.3, 0.);
    float blade = 0.02 + 0.04 * n2 + below * (0.35 + 0.5 * nb) + below * below * 0.3;
    dEff = mix(dEff, min(dEff, blade), smoothstep(0.4, 2.2, vD.y));
    col = sandRamp(max(dEff, 0.), glass);
  } else {
    float y = max(vW.y, 0.);
    float d = y * (0.5 + n1);
    d *= 1. + 0.5 * (n2 - 0.5) * (1. - clamp(fw * 0.9, 0., 1.));
    // every crest is a thin blade: it burns along its rim
    float standing = smoothstep(1.0, 6., vD.y);
    float below = max(abs(vD.x) - fw * 1.3, 0.) * mix(1., 0.8, step(0., vD.x));
    float blade = 0.025 + 0.04 * n2 + below * (0.15 + 0.16 * n1) + below * below * 0.02;      // (thin for a couple of metres under the crest: gold, then orange)
    float dEff = mix(d, min(d, blade), standing);
    // the stroke's furrow up the Great Dune (the trench strip carries its own wall coordinates: metres past the toe,
    // sand standing above the trench floor, metres past the rim crest, and how much of a pouring chute this is)
    vec2 r = xz - uLeg.xy; float a = dot(r, uLeg.zw), bs = dot(r, vec2(uLeg.w, -uLeg.z));
    float isG = step(0.5, vG);
    float tipK = sqrt(clamp((uFur.x - a) / 9., 0., 1.));              // the head is a rounded fingertip
    float drawn = step(a, uFur.x) * smoothstep(uFur.y, uFur.y + 9., a) * isG;
    float deep = smoothstep(0.3, 1.6, vC.y);
    float sgn = bs < 0. ? 7. : 0.;
    // how far one pixel reaches over the ground and over the wall: grain fades on the mean of the two axes, so a wall
    // seen at a grazing angle keeps its grain; lines fade on the footprint of their own phase
    float gm = sqrt(abs(dFdx(xz.x) * dFdy(xz.y) - dFdx(xz.y) * dFdy(xz.x)) + 1e-9);
    float fa = fwidth(a), gmW = sqrt(fa * (fwidth(vWl.x) + fwidth(vWl.y)) + 1e-9);
    vec2 wq2 = vec2(a + sgn, vWl.x * 0.8 + vWl.y * 1.1);
    float gA = (vn2(wq2 * 9.) - 0.5) * (1. - clamp(gmW * 11. - 0.3, 0., 1.));
    float gB = (vn2(wq2 * 26. + 5.) - 0.5) * (1. - clamp(gmW * 31. - 0.3, 0., 1.));
    float gC = (vn2(wq2 * 61. + 3.) - 0.5) * (1. - clamp(gmW * 73. - 0.3, 0., 1.));
    float grainW = 0.55 * gA + 0.8 * gB + 0.9 * gC;
    float spk = h21(floor(wq2 * 30.)), spk2 = h21(floor(wq2 * 11.) + 31.);
    float speck = (step(0.84, spk) - step(spk, 0.16)) * (1. - clamp(gmW * 34. - 0.25, 0., 1.)) + 0.7 * (step(0.88, spk2) - step(spk2, 0.12)) * (1. - clamp(gmW * 12. - 0.25, 0., 1.));
    float sd = vWl.x + (1. - tipK) * 9.;
    float tw = clamp(vWl.x / max(vWl.x - vWl.z, 0.4), 0., 1.);        // 0 at the toe of the wall .. 1 at the crest of its rim
    // (the glass floor is the lamp: a wall glows orange at its foot and darkens through sienna to umber under its rim)
    float th = mix(2.5, min(max(vWl.y, 0.), 0.05 + 3.3 * tw * tw), tipK);
    // chutes: one every 5.6 m or so down each wall (the layout the mesh was scalloped with). A channel of thinner sand
    // sliding in tongues, and at its heart one thin thread of falling grains from rim to toe
    float cq = a / 5.6 + sgn * 0.37, ck = floor(cq);
    float da = a - (ck + 0.5 + 0.28 * sin(ck * 12.9898 + sgn) - sgn * 0.37) * 5.6;
    float wch = 0.8 + 0.3 * sin(ck * 78.233 + sgn), hk = h11(ck + sgn + 1.);
    float chan = (1. - smoothstep(0.3, 0.85, abs(da) / wch)) * deep;
    float slide = vn2(vec2(ck * 3.7 + sgn + da * 2.2, tw * 3.5 + uTime * (0.8 + 0.7 * hk)));
    float thN = th * (0.75 + 0.5 * vn2(vec2(a * 0.45 + sgn, 2.))) * exp2(2.0 * grainW + 0.9 * speck);
    thN *= mix(1., 0.22 + 0.6 * slide, chan * (0.75 + 0.25 * sin(uTime * (0.5 + hk) + 30. * hk)));
    float dash = smoothstep(0.3, 0.6, vn2(vec2(ck * 9.1 + sgn, tw * 12. + uTime * (3. + 2. * hk))));
    float thrW = 0.045 + 0.9 * fa, ends = smoothstep(0.0, 0.1, tw) * (1. - smoothstep(0.93, 1., tw)) * deep;
    float thread = (1. - smoothstep(thrW * 0.45, thrW, abs(da + 0.1 * sin(tw * 8. + ck * 3.)))) * (0.5 + 0.5 * dash) * ends;
    // lesser rills between the chutes, each with a fainter thread of its own
    float rq = a / 1.87 + sgn * 0.61, rk = floor(rq), rda = (fract(rq) - 0.5 - 0.25 * sin(rk * 7.1 + sgn)) * 1.87, rOn = step(0.3, h11(rk + sgn + 4.));
    float rdash = smoothstep(0.32, 0.62, vn2(vec2(rk * 5.3 + sgn, tw * 11. + uTime * (2.2 + 1.8 * h11(rk + 2.)))));
    thN *= mix(1., 0.6, (1. - smoothstep(0.08, 0.4, abs(rda))) * rOn * deep);
    thread = max(thread, (1. - smoothstep(thrW * 0.4, thrW * 0.85, abs(rda + 0.07 * sin(tw * 9. + rk)))) * (0.15 + 0.6 * rdash) * rOn * ends);
    thN *= mix(1., smoothstep(0.3, 0.62, 0.55 * vn2(xz * 17.) + 0.45 * vn2(xz * 41. + 5.) + 2.4 * thN), (1. - clamp(gm * 26. - 0.3, 0., 1.)) * deep);      // a fan's thin edge is single grains on the glass
    thN = mix(thN, 0.012 + 0.03 * dash, thread * 0.95);
    // the floor: fingertip streaks, dust, and where a chute comes down a spray of single grains thrown out over the glass
    float fst = roadStreaks(bs, a * 1.3 + 400., n2, vn2(xz * 3.3), fw);
    float floorFilm = 0.005 + 0.016 * n2 * n1 + 0.075 * fst * (0.35 + 0.65 * n2) + 0.02 * smoothstep(0.75, 0.95, vn2(xz * 7.3)) * (1. - clamp(gm * 9., 0., 1.));
    floorFilm += 0.02 * chatter(bs, a + 77., fw / 2.6) * (0.4 + 0.6 * n1) + 0.02 * smoothstep(0.55, 0.85, vn2(vec2(a * 0.11 + 3., bs * 0.5)));
    float spray = vWl.w * smoothstep(-1.5, 0.15, vWl.x) * (1. - clamp(gm * 40., 0., 1.));
    floorFilm += spray * (0.3 * smoothstep(0.62, 0.8, vn2(xz * 31.)) + 0.12 * smoothstep(0.7, 0.85, vn2(xz * 67. + 9.)));
    float wS = clamp(sd / 1.3, 0., 1.);
    float feather = 1. + (1.8 * gC + 1.2 * gB) * (1. - smoothstep(0.15, 0.9, thN));      // a fan's thin edge is grains, not a wash
    float dTr = floorFilm * (1. - wS) + mix(0.03 * wS + 0.45 * wS * wS, max(thN * feather, 0.), deep);
    // the rim is one thin ragged blade of heaped sand: it burns
    float rd = max(abs(vWl.z + 0.09 * vn2(vec2(a * 2.9 + sgn, 7.)) - 0.045) - fwidth(vWl.z) * 0.6, 0.);
    dTr = mix(dTr, min(dTr, 0.018 + 0.03 * n2 + rd * (1.1 + 1.0 * n2) + rd * rd * 2.5), deep);
    float trM = drawn * (1. - mix(smoothstep(0.8, 2.2, sd), smoothstep(0.4, 2.6, vWl.z), deep));
    col = sandRamp(dEff, glass);
    // form inside the darks: windward sienna, slip umber, heart umber-black, a 12 % rake from the sun-print
    float facing = smoothstep(-0.2, 0.6, dot(N, vec3(0.62, 0.2, 0.5)));
    float hgt = smoothstep(3., 85., y);
    float big = fbm2(xz * 0.012 + 3.);
    float camD = length(cameraPosition - vW);
    float farD = smoothstep(200., 1000., camD) * hgt;
    // wind ripples: sienna crests over orange troughs. They lie oblique to our line up the arm, so they still read at a
    // grazing angle, and each set fades on the footprint of its own phase
    float ph1 = (0.9 * a + 0.44 * abs(bs) + 0.2 * vW.y) * 3.93 + 5. * n1 + 2. * vn2(xz * 0.21);
    float ph2 = (0.5 * a - 0.87 * abs(bs) + 0.1 * vW.y) * 9. + 6. * n2 + 3. * n1;
    float r1F = 1. - smoothstep(0.7, 2.4, fwidth(ph1)), r2F = 1. - smoothstep(0.7, 2.4, fwidth(ph2));
    float c1 = 0.5 + 0.5 * sin(ph1), crest = c1 * c1; crest *= crest;
    float rip = (0.375 - crest) * r1F + 0.35 * sin(ph2) * r2F * (1. - crest);
    float g4 = (vn2(xz * 7.3) - 0.5) * (1. - clamp(gm * 9. - 0.3, 0., 1.)), g5 = (vn2(xz * 23.) - 0.5) * (1. - clamp(gm * 28. - 0.3, 0., 1.));
    vec3 form = mix(uUmber * 0.85, mix(uSienna, uOrange, 0.1 + 0.22 * big), facing) * mix(1.15, 0.7, sqrt(hgt)) * (0.75 + 0.5 * big) * mix(1., 0.55, farD);
    form *= 1. + (1.0 * rip + 0.4 * g4 + 0.45 * g5) * (0.45 + 0.55 * facing);
    form += (uOrange * 0.9 - form) * 0.75 * (0.375 - crest) * r1F * facing * (1. - 0.7 * hgt);
    form = mix(form, uBlack * 1.5 + uUmber * 0.3, smoothstep(0.3, 1., hgt) * mix(0.8, 0.12, facing));
    form += uOrange * 0.12 * max(dot(normalize(N + vec3(0.3 * (crest - 0.375) * r1F, 0., 0.)), uSun), 0.) * mix(1., 0.5, hgt);
    // loose sand streaming over the faces on the wind: thin amber skeins, never still
    vec2 wq = vec2(dot(xz, vec2(0.93, 0.37)) + uTime * 9., dot(xz, vec2(-0.37, 0.93)));
    float skF = 1. - clamp(fwidth(wq.y) * 3.5, 0., 1.);
    float st1 = smoothstep(0.66, 0.82, vn2(vec2(wq.x * 0.16, wq.y * 0.9) + 2. * n1));
    float st2 = smoothstep(0.68, 0.84, vn2(vec2(wq.x * 0.3 + 11., wq.y * 1.7 + 3.)));
    float skG = mix(smoothstep(0.35, 0.65, vn2(wq * vec2(5., 9.))) * (0.6 + 0.8 * vn2(wq * vec2(13., 21.) + 4.)), 0.5, clamp(gm * 9. - 0.3, 0., 1.));
    float strm = max(st1, 0.8 * st2) * skG * 1.5 * skF * (1. - smoothstep(260., 700., camD)) * (1. - 0.7 * uStill);
    form = mix(form, mix(uOrange, uGold, 0.45) * 0.95, strm * 0.5 * (0.35 + 0.65 * facing));
    // avalanche tongues slide down the slip faces
    float rpF = 1. - clamp(fw * 0.35, 0., 1.);
    float lee = step(vD.x, 0.);
    float cx = (xz.x * 0.45 - xz.y * 0.9) / 11. + 0.6 * vn2(vec2(xz.x * 0.03, 2.)); float ci = floor(cx);
    float hd = fract(uTime * (0.035 + 0.03 * h11(ci)) + h11(ci + 9.)) * 110.;
    float tongue = (1. - smoothstep(hd - 3., hd, -vD.x)) * smoothstep(hd - 46., hd - 6., -vD.x) * (1. - smoothstep(0.1, 0.45, abs(fract(cx) - 0.5))) * step(0.45, h11(ci + 3.));
    form = mix(form, mix(uSienna, uOrange, 0.5), lee * tongue * 0.7 * rpF);
    col = mix(col, form, smoothstep(1.6, 5., dEff));
    // the herd's scratched tracks where it left our furrow and went out over the arm: one clean line per animal, cut to the glass
    float best = 1e9, trS = 0., trL = 0., trWt = 0.;
    for (int i = 0; i < 16; i++) {      // (distances to neighbouring spans are blended, so the lines bend without a kink)
      vec2 p0 = uHT[i].xy, e = uHT[i + 1].xy - p0, q = vec2(a, bs) - p0;
      float el = max(length(e), 1e-3), pr = dot(q, e) / el, t = clamp(pr / el, 0., 1.); vec2 dv = q - e * t; float dd = dot(dv, dv);
      float wt = exp(-min(dd, 300.) / 22.);
      best = min(best, dd); trWt += wt; trS += wt * (uHT[i].z + pr); trL += wt * (e.x * q.y - e.y * q.x) / el;
    }
    trS /= max(trWt, 1e-12); trL /= max(trWt, 1e-12);
    float tl = trL + 0.45 * sin(trS * 0.07) + 0.3 * (n1 - 0.5), tcell = floor(tl / 1.45), tf = (fract(tl / 1.45) - 0.5) * 1.45;
    float tfw = fwidth(tl), tw2 = 0.03 + 0.03 * h11(tcell + 2.) + min(0.7 * tfw, 0.06);
    float tline = (1. - smoothstep(tw2 * 0.55, tw2, abs(tf - 0.6 * (h11(tcell) - 0.5) - 0.08 * sin(trS * 0.9 + tcell * 3.)))) * step(abs(tl), 6.6) * step(best, 60.);
    tline *= smoothstep(0., 4., uHerdS - trS - 26. * h11(tcell + 5.)) * step(uHT[0].z + 0.5, trS) * (1. - smoothstep(uHT[16].z - 12., uHT[16].z - 1., trS)) * (0.6 + 0.4 * n2);
    col = mix(col, glass * 0.96, tline * 0.92 * (1. - smoothstep(0.12, 0.45, tfw)));
    vec3 trC = sandRamp(max(dTr, 0.), glass);
    trC = mix(trC, trC * (0.8 + 0.5 * n2) + uOrange * 0.1 * max(dot(N, uSun), 0.), smoothstep(0.8, 2.4, dTr));
    trC *= 1. + (0.9 * grainW + 0.4 * speck) * smoothstep(0.03, 0.3, dTr) * deep;      // still grain, also where the ramp has gone dark
    col = mix(col, trC, trM);
  }
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- the sky: a second pane of lit glass, sand sifted over it thicker and thicker upward ----------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uSkyH, uSkyA, uSkyM, uSkyZ, uLip, uWipe, uSunC, uSunDir, uVeilCol, uHaze, uBand;
uniform vec4 uStops;
uniform float uTime, uVeil, uNight, uSeed, uHazeK, uStill;
varying vec3 vDir;
float hs(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hs2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float sn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hs2(i), hs2(i + vec2(1., 0.)), f.x), mix(hs2(i + vec2(0., 1.)), hs2(i + vec2(1., 1.)), f.x), f.y); }
// value noise that closes on itself round the horizon (P cells to the full turn)
float snw(vec2 p, float P){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float x0 = mod(i.x, P), x1 = mod(i.x + 1., P);
  return mix(mix(hs2(vec2(x0, i.y)), hs2(vec2(x1, i.y)), f.x), mix(hs2(vec2(x0, i.y + 1.)), hs2(vec2(x1, i.y + 1.)), f.x), f.y); }
// pinholes pricked through the sand: at most one to a cell, most cells empty, no two the same size
float pinhole(vec2 zp, float N, float dens, float r0, float r1, out float halo, out float id){
  vec2 g = zp * N, i = floor(g); id = hs2(i + 7.3);
  vec2 c = 0.5 + 0.5 * (vec2(hs2(i + 1.7), hs2(i + 3.1)) - 0.5);
  float q = hs2(i + 5.9), r = mix(r0, r1, q * q), dd = length(fract(g) - c), on = step(1. - dens, id);
  halo = on * exp(-dd * dd / (r * r * 3.));
  return on * (1. - smoothstep(r * 0.5, r, dd));
}
void main(){
  vec3 d = normalize(vDir); float e = d.y, eh = max(e, 0.);
  float az = atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x), azn = az / 6.2832 + 0.5;
  vec2 zp = d.xz / (1. + eh);                               // continuous all round the horizon
  float grain = sn2(zp * 260.) * 0.6 + sn2(zp * 70. + 9.) * 0.4;
  // the sand is sifted over the pane in long level passes: it lies in soft drifts many times longer than they are deep,
  // thicker and thicker upward, and only a breath of single grains shows
  float drift = 0.6 * snw(vec2(azn * 9., eh * 7. + uSeed), 9.) + 0.4 * snw(vec2(azn * 22. + 3., eh * 17. + uSeed * 1.7), 22.);
  float k = pow(clamp(e, 0., 1.), 0.8);
  k = clamp(k + (drift - 0.5) * 0.24 * smoothstep(0.0, 0.16, e) * (1. - 0.6 * smoothstep(0.5, 0.9, e)) + (grain - 0.5) * 0.03 * smoothstep(0., 0.1, e), 0., 1.);
  vec3 col = mix(uSkyH, uSkyM, smoothstep(uStops.x, uStops.y, k)); col = mix(col, uSkyZ, smoothstep(uStops.z, uStops.w, k));
  col = mix(col, uSkyA, uBand.z * smoothstep(uBand.x * 0.3, uBand.x, k) * (1. - smoothstep(uBand.x, uBand.y, k)));      // (by night: the amber where the sand begins)
  // six cirrus streaks wiped clean by fingertips: pointed at both ends, the lines of the fingers in them, a heaped lip on their lee side
  float wipe = 0., lip = 0., fringe = 0.;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float a0 = fi * 1.047 + 0.7 * hs(fi + uSeed) + uTime * 0.006 * (0.5 + hs(fi + 3.)) * (1. - 0.7 * uStill);
    float e0 = mix(0.16, 0.1, uNight) + mix(0.34, 0.2, uNight) * hs(fi * 1.7 + 2. + uSeed);
    float da = az - a0; da -= 6.2832 * floor(da / 6.2832 + 0.5);
    float x = da / (0.22 + 0.2 * hs(fi + 9.));
    float tp = max(1. - x * x, 0.), taper = tp * sqrt(tp);
    float th = (mix(0.046, 0.02, uNight) + 0.02 * hs(fi + 11.)) * (0.2 + 0.8 * taper);
    float yy = (e - e0 - (hs(fi + 5.) - 0.5) * 0.12 * da - 0.014 * sin(da * 6. + fi) - 0.03 * (drift - 0.5)) / th;
    float life = 0.6 + 0.4 * sin(uTime * 0.06 + fi * 2.1), inx = step(abs(x), 1.) * life;
    float fing = 0.55 + 0.45 * smoothstep(-0.25, 0.25, sin(yy * 4.4 + fi * 1.7 + 3. * x));
    float lift = 0.5 + 0.5 * smoothstep(0.28, 0.5, snw(vec2(azn * 46. + fi * 5., fi * 3.3), 46.));
    wipe = max(wipe, (1. - smoothstep(0.6, 1., abs(yy))) * inx * fing * lift);
    fringe = max(fringe, smoothstep(0.5, 0.9, abs(yy)) * (1. - smoothstep(0.9, 1.35, abs(yy))) * inx * tp);
    float ly = (yy + 1.35) / 0.5;
    lip = max(lip, exp(-ly * ly) * tp * inx);
  }
  col = mix(col, uLip, lip * 0.6 * (1. - wipe));
  col = mix(col, uSkyA, fringe * uBand.z * 0.55 * (1. - wipe));
  col = mix(col, uWipe, wipe * 0.75);
  // pinhole stars, each with a breath of gold round it, and the print wiped clean: a thumbprint sun, or a crescent moon at night
  float h1, i1, h2, i2, deep = smoothstep(0.3, 0.62, k) * (1. - wipe) * uNight;
  float s1 = pinhole(zp, 21., 0.12, 0.05, 0.13, h1, i1), s2 = pinhole(zp + 0.37, 47., 0.07, 0.09, 0.17, h2, i2);
  col += deep * (s1 * vec3(1.5, 1.42, 1.25) * (0.7 + 0.3 * sin(uTime * 2. + i1 * 50.)) + h1 * 0.09 * vec3(1., 0.7, 0.4)
    + s2 * 0.55 * vec3(1.3, 1.25, 1.15) * (0.7 + 0.3 * sin(uTime * 2.6 + i2 * 50.)));
  float ang = acos(clamp(dot(d, uSunDir), -1., 1.)); float R = 0.052;
  float trem = sn2(zp * 420. + floor(uTime * 3.) * 0.37);
  float rim = (ang - R * 1.14) / (R * 0.17); rim = exp(-rim * rim);
  float disc = 1. - smoothstep(R * 0.9, R, ang + R * 0.05 * (grain - 0.5));
  vec3 off = normalize(uSunDir + vec3(0.03, 0.012, -0.02)); float ang2 = acos(clamp(dot(d, off), -1., 1.));
  disc *= mix(1., smoothstep(R * 0.85, R * 1.0, ang2), uNight);
  float whorl = 0.5 + 0.5 * sin(ang / R * 21. + 5. * sn2(d.xz * 30. + d.y * 17.));
  col += uSunC * 0.1 * exp(-ang * 7.) * (1. - uNight) + uSkyA * 0.16 * exp(-ang * 9.) * uNight;
  col = mix(col, mix(uLip, uSkyA * 0.8, uNight), rim * (0.45 + 0.3 * trem) * (1. - disc));
  col = mix(col, uSunC * (0.9 + 0.1 * whorl), disc);
  col = mix(col, uHaze, uHazeK * (1. - smoothstep(0.0, 0.3, e)));
  col = mix(col, uVeilCol, uVeil);
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

// ---------- dead trees: one drizzled line each, and its shadow drawn in sand (the same mesh laid on the glass) ----------
const TREE_VERT = /* glsl */`
attribute vec3 aRad; attribute vec3 aT; attribute vec2 aS;
uniform float uPx, uCur, uCurK, uRare; uniform vec3 uShadow;
varying vec3 vW; varying vec3 vN; varying vec3 vT; varying float vProg; varying float vE;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  vec3 p = position, rad = aRad, n = normal;
  float prog = 2.;
  if (abs(aT.z - uCur) < 0.5) prog = uCurK;
  if (uRare > -0.5) prog = min(prog, uRare - aT.y * 0.14);
  vE = 0.;
#ifdef SHADOW
  // the shadow is drawn in sand: the same line laid on the glass as a stroke at least half a metre wide
  vec3 cl = p - rad; float hwS = max(2.2 * length(rad), 0.27);
  vE = length(aS);
  p = vec3(cl.x + uShadow.x * cl.y + aS.x * hwS, 0.05, cl.z + uShadow.y * cl.y + aS.y * hwS);
  rad = vec3(0.); n = vec3(0., 1., 0.);
#endif
#ifndef SHADOW
  if (max(aT.x, 0.) > prog) { p += rad * 0.9; rad *= 1.9; }      // a ghost is a wider, fainter scratch
#endif
  vec4 wp = modelMatrix * vec4(p, 1.);
  float rMin = 0.85 * length(cameraPosition - wp.xyz) / max(uPx, 1.), rl = length(rad);
  if (rl > 1e-5) wp.xyz += rad * (clamp(rMin / rl, 1., 8.) - 1.);
  vW = wp.xyz; vN = n + vec3(0., 1e-5, 0.); vT = aT; vProg = prog;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vT; varying float vProg; varying float vE;
${SAND_GLSL}
#include <fog_pars_fragment>
void main(){
  float order = max(vT.x, 0.);
#ifdef SHADOW
  if (order > vProg || vT.x < -0.5) discard;
  float n = vn2(vW.xz * 3.1), thin = 0.5 + 0.5 * sin(uTime * 0.35 + vT.y * 40.);
  float e = vE + 0.35 * (n - 0.5) + 0.2 * (vn2(vW.xz * 11.) - 0.5);
  if (e > 0.98 - 0.25 * thin * vn2(vW.xz * 0.7 + vT.y * 9.)) discard;              // a ragged edge that slowly thins and is redrawn
  vec3 col = sandRamp(mix(0.34, 0.012, smoothstep(0.25, 0.95, e)) * (0.7 + 0.6 * n), uGlass);
#else
  float fw = fwidth(vW.x) + fwidth(vW.y) + fwidth(vW.z);
  float gA = mix(vn3(vW * 30. + vT.y * 17.), 0.5, clamp(fw * 20. - 0.3, 0., 1.));
  if (order > vProg && h31(floor(vW * 9.) + 0.5) > 0.4) discard;      // a faint scratched ghost until it is drizzled again
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1. : -1.), V = normalize(cameraPosition - vW);
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * (0.35 + 0.65 * rim);
  float fringe = (1. - smoothstep(0., 0.06, vProg - order)) * step(order, vProg);      // the drawing point burns
  float k = clamp(rim * 1.05 + fringe * 1.0, 0., 1.);
  float dEq = 10. * exp(-7. * k) * (0.65 + 0.7 * gA);
  if (vT.x < -0.5) dEq = max(vW.y, 0.) * 5. * (0.6 + 0.8 * gA);            // the heap at the foot: feathered gold edge
  vec3 col = sandRamp(dEq, uGlass * 0.9);
  col += uSienna * 0.1 * max(dot(N, uSun), 0.);
#endif
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- dune grass: fans of scratched hairlines whipping in the wind, and the arcs they scribe ----------
const GRASS_VERT = /* glsl */`
attribute vec4 aB; attribute vec4 iG;
uniform float uPx, uWindK;
varying float vT; varying float vS;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  float t = aB.z, s = iG.z, seed = iG.w;
  float ca = cos(seed * 6.283), sa = sin(seed * 6.283);
  vec2 dir = vec2(aB.x * ca - aB.y * sa, aB.x * sa + aB.y * ca);
  float ph = seed * 6.283 + dot(iG.xy, vec2(0.07, 0.05));
  float gust = 0.5 + 0.5 * sin(uTime * 2.3 + ph) + 0.3 * sin(uTime * 5.3 + ph * 1.7 + t * 2.);
  vec2 wd = vec2(-0.93, -0.37);
  vec3 p = vec3(iG.x, 0., iG.y);
  p.xz += dir * (0.3 + 0.25 * fract(seed * 13.7 + aB.x)) * t * s + wd * uWindK * (0.22 + 0.3 * gust) * t * t * s;
  p.y = t * s * (1. - 0.3 * t * uWindK * gust) * (0.75 + 0.5 * fract(seed * 7.3 + aB.y));
  vec4 wp = modelMatrix * vec4(p, 1.);
  float w = max(0.014 * s * (1. - 0.8 * t), 0.8 * length(cameraPosition - wp.xyz) / max(uPx, 1.));
  wp.xz += vec2(-dir.y, dir.x) * aB.w * w;
  vT = t; vS = seed;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GRASS_FRAG = /* glsl */`
varying float vT; varying float vS;
${SAND_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 col = sandRamp(mix(3.2, 0.1, vT * vT) * (0.7 + 0.6 * fract(vS * 31.)), uGlass * 0.9);
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;
const ARC_VERT = /* glsl */`
attribute vec4 iG;
varying vec2 vUv; varying float vS; varying float vA;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  vec3 p = vec3(iG.x + position.x * 1.25 * iG.z, 0.03, iG.y + position.y * 1.25 * iG.z);
  vUv = position.xy; vS = iG.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  vA = 1. - smoothstep(60., 110., -mvPosition.z);
  #include <fog_vertex>
}`;
const ARC_FRAG = /* glsl */`
varying vec2 vUv; varying float vS; varying float vA;
${SAND_GLSL}
#include <fog_pars_fragment>
void main(){
  float r = length(vUv), fw = fwidth(r);
  float an = atan(vUv.y, abs(vUv.x) < 1e-4 ? 1e-4 : vUv.x);
  float sweep = smoothstep(-0.5, 0.3, cos(an - vS * 6.283 - 0.5 * sin(uTime * 2.3 + vS * 40.)));
  float r1 = 0.72 + 0.06 * sin(an * 3. + vS * 20.), r2 = 0.44 + 0.05 * sin(an * 2. + vS * 9.);
  float a = max((1. - smoothstep(0.012, 0.035 + fw, abs(r - r1))), 0.6 * (1. - smoothstep(0.01, 0.03 + fw, abs(r - r2)))) * sweep;
  a *= vA * (1. - clamp(fw * 4., 0., 1.));
  if (a < 0.02) discard;
  gl_FragColor = vec4(uSienna * 0.55, a * 0.85);
  #include <fog_fragment>
}`;

// ---------- ostriches: two-bone legs pinned to their footfalls, pumping necks, wiped cream plumes ----------
const OST_VERT = /* glsl */`
attribute vec4 aPart; attribute vec3 aPaint; attribute vec4 iA;
uniform float uOstS, uPx; uniform vec3 uOstO, uOstL, uShadow;
varying vec3 vRest; varying vec3 vN; varying vec3 vW; varying vec3 vPaint; varying float vSeed;
${SAND_GLSL}
#include <fog_pars_vertex>
#define OSTR 3.3
#define ODUTY 0.3
#define OHIP 1.12
#define OL1 0.52
#define OL2 0.66
void main(){
  float sz = iA.z, seed = iA.w, stride = OSTR * sz;
  float s = uOstS + iA.x + 1.5 * sin(uOstS * 0.03 + seed * 6.283);
  float q = s / stride + seed * 3.;
  // the troop's line: down our road at first, then out to the left across the ridge's end to a lane of its own
  float lt = clamp((s - uOstL.x) / (uOstL.y - uOstL.x), 0., 1.), dl = uOstL.z * 6. * lt * (1. - lt) / (uOstL.y - uOstL.x);
  vec3 T = normalize(vec3(-1., 0., dl)), Nn = vec3(T.z, 0., -T.x), U = vec3(0., 1., 0.);
  vec3 O = uOstO + vec3(-s, 0., uOstL.z * lt * lt * (3. - 2. * lt)) + Nn * iA.y;
  float bob = 0.06 * sz * sin(12.566 * q + 1.), pitch = 0.035 * sin(12.566 * q + 0.4);
  float rMin = 0.8 * length(cameraPosition - (modelMatrix * vec4(O, 1.)).xyz) / max(uPx, 1.);
  float kind = aPart.x; vec3 lp = position * sz, ln = normal;
  if (kind > 0.5 && kind < 2.5) {
    float left = step(kind, 1.5), lx = mix(-0.14, 0.14, left), off = mix(0.5, 0., left);
    float ql = q - off, ph = fract(ql), n = floor(ql);
    float x = clamp((ph - ODUTY) / (1. - ODUTY), 0., 1.);
    float e = 0.5 * (x + x * x * (3. - 2. * x));
    float sF = (n + off - seed * 3.) * stride + 0.5 * ODUTY * stride + stride * e;   // the footfall: fixed for the whole stance
    float sx = sin(3.14159 * x);
    vec2 Ff = vec2(sF - s - 0.05 * sz, sz * 0.5 * sx * (0.55 + 0.45 * sx));
    vec2 Hh = vec2(-0.05 * sz, OHIP * sz + bob);
    vec2 dv = Ff - Hh; float dl0 = max(length(dv), 1e-3); vec2 dir = dv / dl0;
    float Lt = (OL1 + OL2) * sz, dl = min(dl0, Lt * 0.995);
    float l1 = Lt * OL1 / (OL1 + OL2), l2 = Lt - l1;
    float a1 = (l1 * l1 - l2 * l2 + dl * dl) / (2. * dl);
    float hk = sqrt(max(l1 * l1 - a1 * a1, 0.));
    vec2 K = Hh + dir * a1 - vec2(-dir.y, dir.x) * hk;
    vec2 Fe = Hh + dir * dl;
    float t = aPart.y;
    vec2 d1 = K - Hh; d1 /= max(length(d1), 1e-4); vec2 d2 = Fe - K; d2 /= max(length(d2), 1e-4);
    vec2 c = t < 0.5 ? mix(Hh, K, t * 2.) : mix(K, Fe, (t - 0.5) * 2.);
    vec2 bd = mix(d1, d2, smoothstep(0.4, 0.6, t)); bd /= max(length(bd), 1e-4);
    vec2 bp = vec2(-bd.y, bd.x);
    vec2 o = aPart.zw * sz; o *= clamp(rMin / max(length(o), 1e-4), 1., 3.);
    lp = vec3(lx * sz + o.x, c.y + bp.y * o.y, c.x + bp.x * o.y);
    ln = vec3(aPart.z, bp.y * aPart.w, bp.x * aPart.w) + vec3(1e-5, 0., 0.);
  } else {
    float w = aPart.y;
    if (kind > 5.5) {          // plumes shake
      lp.y += w * 0.07 * sz * sin(uTime * 17. + seed * 40. + lp.z * 9.);
      lp.x += w * 0.05 * sz * sin(uTime * 13. + seed * 20. + lp.y * 7.);
    } else if (kind > 4.5) {   // the neck pumps with every stride
      lp.z += w * 0.13 * sz * sin(12.566 * q + 0.6);
      lp.y -= w * 0.035 * sz * cos(12.566 * q + 0.6);
    }
    float y0 = lp.y - OHIP * sz, cp = cos(pitch), sp = sin(pitch);
    lp = vec3(lp.x, y0 * cp + lp.z * sp + OHIP * sz + bob, lp.z * cp - y0 * sp);
  }
  vec3 P = O + Nn * lp.x + U * lp.y + T * lp.z;
#ifdef SHADOW
  P = vec3(P.x + uShadow.x * max(P.y, 0.), 0.045, P.z + uShadow.y * max(P.y, 0.));      // its shadow, drawn in sand: the bird laid flat away from the sun-print
#endif
  vec4 wp = modelMatrix * vec4(P, 1.); vW = wp.xyz; vN = Nn * ln.x + U * ln.y + T * ln.z;
  vRest = position; vPaint = aPaint; vSeed = seed;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const OST_FRAG = /* glsl */`
varying vec3 vRest; varying vec3 vN; varying vec3 vW; varying vec3 vPaint; varying float vSeed;
${SAND_GLSL}
#include <fog_pars_fragment>
void main(){
  float fw = fwidth(vRest.x) + fwidth(vRest.y) + fwidth(vRest.z);
#ifdef SHADOW
  {
    float fs = fwidth(vW.x) + fwidth(vW.z), sn = vn2(vW.xz * 2.3), sg = vn2(vW.xz * 19.);
    if (sg < 0.22 * (1. - clamp(fs * 12., 0., 1.))) discard;
    gl_FragColor = vec4(max(sandRamp((0.19 + 0.24 * sn) * (0.8 + 0.4 * sg) + 0.02, uGlass), 0.), 1.);
    #include <fog_fragment>
    return;
  }
#endif
  float gA = mix(vn3(vRest * 46. + vSeed * 17.), 0.5, clamp(fw * 30. - 0.3, 0., 1.));
  float gB = vn3(vRest * 8. + vSeed * 5.);
  vec3 N = normalize(vN + vec3(1e-5)) * (gl_FrontFacing ? 1. : -1.), V = normalize(cameraPosition - vW);
  float rim = 1. - abs(dot(N, V)); rim = rim * rim * (0.35 + 0.65 * rim);
  float k = clamp(rim * 1.05 + vPaint.y * 0.2 * (0.4 + rim), 0., 1.);
  vec3 col = sandRamp(10. * exp(-7. * k) * (0.65 + 0.7 * gA), uGlass * 0.9);
  float wiped = smoothstep(0.4, 0.62, vPaint.x + (gB - 0.5) * 0.4 + (gA - 0.5) * 0.2);
  col = mix(col, mix(uGlass * (0.72 + 0.14 * gA), mix(uGold, uOrange, 0.25 + 0.5 * rim) * (0.6 + 0.3 * gA), vPaint.z), wiped);
  col += uSienna * 0.12 * max(dot(N, uSun), 0.) * (1. - wiped);
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- sandgrouse: a tight fast flock of dark flecks ----------
const BIRD_VERT = /* glsl */`
attribute float aWg; attribute vec4 iA;
uniform vec3 uFlock, uFlockDir; uniform float uPx;
varying float vE;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  float seed = iA.w;
  vec3 F = normalize(uFlockDir + vec3(1e-5, 0., 0.)), R = normalize(vec3(F.z, 0., -F.x) + vec3(0., 0., 1e-5));
  vec3 off = iA.xyz + vec3(sin(uTime * 1.3 + seed * 40.), 0.6 * sin(uTime * 1.7 + seed * 23.), sin(uTime * 1.1 + seed * 31.)) * 0.9;
  vec3 C = uFlock + R * off.x + vec3(0., off.y, 0.) + F * off.z;
  float sc = max(1.45, 2.4 * length(cameraPosition - C) / max(uPx, 1.) / 0.3);
  float flap = sin(uTime * (17. + 6. * seed) + seed * 60.);
  vec3 p = position; p.y += aWg * abs(p.x) * 0.9 * flap; p.x *= 1. - 0.3 * aWg * flap * flap;
  vec3 P = C + (R * p.x + vec3(0., p.y, 0.) + F * p.z) * sc;
  vE = aWg;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uTip;
varying float vE;
${SAND_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 col = sandRamp(mix(uTip.x, uTip.y, mix(vE * vE, sqrt(max(vE, 0.)), uTip.z)), uGlass * 0.9);      // (by night the wingtips thin to a burning film, so the flock reads on the deep sky)
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// ---------- grains in the air: bow wave, crest smoke, the notch plume, pouring walls, drifting grains, sifting curtains ----------
const GRAIN_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ;
uniform vec3 uHeadP, uHeadT, uCamP, uWind; uniform vec4 uLeg, uThread; uniform vec3 uFur;
uniform float uHeadV, uBow, uBowS, uPlume, uSmoke, uRareT, uRareK, uCap, uCurt;
varying vec2 vUv; varying vec4 vK; varying float vS;
${SAND_GLSL}
#include <fog_pars_vertex>
void main(){
  float kind = iQ.x, seed = iP.w; vec3 C = vec3(0.); float S = 1., A = 0., stretch = 1., nearA = 3., nearB = 18.; vec3 vel = vec3(0.);
  float r1 = h11(seed * 7.13 + 1.), r2 = h11(seed * 3.71 + 2.), r3 = h11(seed * 11.3 + 3.);
  if (kind < 0.5) {            // the bow wave: two curls of grains peeling off the stroke head, streaking back past us into the ridges
    float arm = step(1.5, uBowS);
    float life = mix(1.0 + 0.45 * r1, 0.9 + 0.6 * r1, arm), age = fract(uTime / life + seed) * life, f = age / life;
    vec3 perp = vec3(uHeadT.z, 0., -uHeadT.x) * iP.x;
    float lat0 = mix(1.1 + 0.9 * r2, 2.2 + 1.2 * r2, arm), lat1 = mix(2.5 + 1.7 * r3, 3.2 + 2. * r3, arm), kx = mix(2.6, 2.2, arm);
    float vy = mix(3.2 + 2.8 * r1, 5.5 + 3. * r1, arm), gy = mix(4.4, 5.2, arm), back = mix(0.5, 0.55, arm), sc = mix(1., 0.6 * uBowS, arm);
    C = uHeadP - uHeadT * (uHeadV * age * back) + perp * (lat0 + lat1 * (1. - exp(-kx * age))) * sc;
    C.y += (max(vy * age - gy * age * age, 0.) + 0.15) * sc;
    vel = -uHeadT * (uHeadV * back) + perp * (lat1 * kx * exp(-kx * age)) + vec3(0., vy - 2. * gy * age, 0.);
    A = smoothstep(0., 0.08, f) * (1. - f * f) * mix(0.62, 0.8, arm) * uBow;
    S = iQ.w * mix(0.065 + 0.1 * f, (0.07 + 0.11 * f) * sc, arm); stretch = mix(4., 4.5, arm); nearA = 0.6; nearB = mix(2.0, 4.5, arm);
  } else if (kind < 1.5) {     // crest smoke: every ridge streams grains to leeward
    float life = iQ.z, age = fract(uTime * iQ.y + seed) * life, f = age / life;
    C = iP.xyz + uWind * age * (9. + 8. * r1) + vec3(0., (6. + 4. * r2) * age - 0.5 * age * age + 0.8 * sin(age * 1.7 + seed * 6.), 0.);
    A = smoothstep(0., 0.1, f) * (1. - f) * 0.95 * uSmoke;
    S = iQ.w * (0.5 + 2.2 * f); stretch = 0.5; nearB = 40.;
  } else if (kind < 2.5) {     // the plume thrown off the lee side of the notch: up, to leeward and away to the left of the ring
    float life = 2.4 + 1.6 * r1, age = fract(uTime / life + seed) * life, f = age / life;
    vec3 lft = vec3(uLeg.w, 0., -uLeg.z), fwd = vec3(uLeg.z, 0., uLeg.w), hv = fwd * (5. + 6. * r2) + lft * (4. + 6. * r3);
    C = iP.xyz + hv * age + vec3(0., (9. + 9. * r1) * age - 1.6 * age * age, 0.);
    vel = hv + vec3(0., (9. + 9. * r1) - 3.2 * age, 0.);
    A = smoothstep(0., 0.08, f) * (1. - f * f) * 0.95 * uPlume;
    S = iQ.w * (0.5 + 1.3 * f); stretch = 1.3; nearB = 30.;
  } else if (kind < 3.5) {     // sand pouring down the furrow walls behind the head
    float life = 1.1 + 0.9 * r1, age = fract(uTime / life + seed) * life, f = age / life;
    float a = dot(iP.xz - uLeg.xy, uLeg.zw);
    C = iP.xyz - vec3(uLeg.w, 0., -uLeg.z) * iQ.y * f; C.y -= iQ.z * pow(f, 1.35) - 0.18;
    vel = -vec3(uLeg.w, 0., -uLeg.z) * iQ.y + vec3(0., -1.35 * iQ.z * pow(f, 0.35), 0.);
    A = smoothstep(0., 0.15, f) * (1. - f * f) * 0.9 * (1. - smoothstep(uFur.x - 9., uFur.x - 2., a));
    S = iQ.w * (0.07 + 0.08 * f); stretch = 4.5; nearA = 0.5; nearB = 1.6;
  } else if (kind < 4.5) {     // loose grains on the wind, wrapped round the camera
    vec3 B = vec3(64., 13., 64.);
    vec3 p = iP.xyz * B + uWind * uTime * (5. + 6. * r1);
    C = uCamP + mod(p - uCamP + 0.5 * B, B) - 0.5 * B;
    vel = uWind * (5. + 6. * r1) - uHeadT * uHeadV;
    A = 0.5; S = iQ.w; stretch = 2.4; nearA = 0.8; nearB = 3.;
  } else if (kind < 5.5) {     // sifting curtains: thin veils of falling grains that add sand back
    float fall = fract(uTime * (0.22 + 0.2 * r1) + seed);
    C = iP.xyz + vec3(0.7 * sin(uTime * 0.6 + seed * 9.), (1. - fall) * iQ.y, 0.5 * sin(uTime * 0.5 + seed * 5.));
    A = smoothstep(0., 0.15, fall) * (1. - smoothstep(0.8, 1., fall)) * 0.3 * uCurt * (0.5 + 0.5 * sin(uTime * 0.13 + iQ.z));
    S = iQ.w; stretch = 2.6; nearB = 30.;
  } else if (kind < 6.5) {     // rare: every tree blown off the glass into one long streamer downwind (the top goes first)
    float age = max(uRareT - 0.5 * iQ.y, 0.), sp = iQ.z;                // sp: 0 at the tree .. 1 at the streamer's far end
    float run = (2. + 17. * sp) * (1. - exp(-1.1 * age)) * 1.6;
    vec3 sway = vec3(uWind.z, 0., -uWind.x);
    C = iP.xyz + uWind * run + sway * (0.5 * sin(run * 0.33 + seed * 9.) + (r3 - 0.5) * 0.9 * sp);
    float top6 = iP.y / max(1. - iQ.y, 0.15);                         // (the streamer gathers toward one line as it trails)
    C.y = max(mix(C.y, 0.62 * top6, 0.55 * sp * (1. - exp(-1.5 * age))) + (0.9 * sp - 0.6 * sp * sp) * min(age, 2.) + 0.3 * sin(run * 0.5 + seed * 6.) - 0.25 * max(age - 1.5, 0.) * sp, 0.25);
    vel = uWind;
    A = step(0.001, uRareT - 0.5 * iQ.y) * smoothstep(0., 0.25, age) * (1. - smoothstep(1.9, 3.3, age + 0.6 * sp)) * 0.92;
    S = iQ.w * (0.42 + 0.4 * sp); stretch = 4.5; nearB = 6.;
  } else if (kind < 7.5) {     // the falling thread that drizzles a tree again
    float fall = fract(uTime * 1.5 + seed);
    C = uThread.xyz + vec3((r1 - 0.5) * 0.4, (1. - fall) * 7.5, (r2 - 0.5) * 0.4);
    A = uThread.w * 0.8; S = 0.14 + 0.1 * r3; stretch = 3.; nearB = 6.;
  } else if (kind < 8.5) {     // skeins of loose sand streaming up the Great Dune's arm beside our furrow
    float life = iQ.z, age = fract(uTime / life + seed) * life, f = age / life, v = 9. + 7. * r1;
    C = iP.xyz + uWind * (age * v) + vec3(0., iQ.y * v * age + 0.25 + 0.6 * age * f, 0.);
    vel = uWind * v + vec3(0., iQ.y * v, 0.);
    A = smoothstep(0., 0.15, f) * (1. - f) * 0.7 * uSmoke * (1. - 0.65 * smoothstep(60., 190., length(C - uCamP)));
    S = iQ.w * (0.3 + 0.4 * f); stretch = 3.2; nearB = 10.;
  } else if (kind > 9.5) {     // sand streaming off the Great Dune's knife crest: long bright skeins torn off to leeward, rising, then sinking behind it
    float life = iQ.z, age = fract(uTime / life + seed) * life, f = age / life, v = 8. + 6. * r1, vy = 8. + 7. * r3;
    vec3 lee = normalize(uWind + vec3(0., 0., 0.5 * (r2 - 0.4)));
    C = iP.xyz + lee * (age * v + 0.8 * age * age) + vec3(0., vy * age - 1.1 * age * age, 0.);
    vel = lee * (v + 1.6 * age) + vec3(0., vy - 2.2 * age, 0.);
    A = smoothstep(0., 0.1, f) * (1. - f) * (1. - f) * 1.8 * uSmoke;
    S = iQ.w * (0.3 + 0.8 * f); stretch = 6.; nearB = 60.;
  } else {                     // rare: the falling thread that drizzles each tree again (iP: the tree's foot and its height)
    float pr = uRareK - iQ.y, fall = fract(uTime * (1.1 + 0.5 * r1) + seed);
    float fray = iQ.z * clamp(pr * 1.7 - 0.6, 0., 1.);                  // the thread spreads as the limbs do
    C = vec3(iP.x + (r1 - 0.5) * (0.3 + 2. * fray), iP.y * clamp(pr, 0.03, 1.) + (1. - fall) * 15., iP.z + (r2 - 0.5) * (0.3 + 2. * fray));
    vel = vec3(0., -1., 0.);
    A = step(0.001, pr) * (1. - smoothstep(1.02, 1.2, pr)) * step(0., uRareK) * (0.45 + 0.55 * fall) * 0.95;
    S = iQ.w; stretch = 3.4; nearB = 6.;
  }
  vec4 mvPosition = modelViewMatrix * vec4(C, 1.);
  float dz = max(-mvPosition.z, 0.01);
  A *= smoothstep(nearA, nearB, dz);
  S = min(S, uCap * dz);
  // sprites that fly fast are drawn out along their motion past the camera
  vec2 sd = vec2(0., 1.);
  vec3 vv = mat3(viewMatrix) * vel; float vl = length(vv.xy);
  if (vl > 0.05) sd = vv.xy / vl;
  mvPosition.xy += (sd * (position.y * stretch) + vec2(sd.y, -sd.x) * position.x) * S;
  vUv = position.xy; vK = vec4(A, kind, seed, r3); vS = S;
  gl_Position = projectionMatrix * mvPosition;
  if (A <= 0.004) gl_Position = vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const GRAIN_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vK; varying float vS;
${SAND_GLSL}
#include <fog_pars_fragment>
// thrown sand is grains: clumps a hand across, the same size in metres whatever the sprite's size, single grains at their
// edges; where a pixel covers many of them they go over to their mean
float thrown(vec2 uv, float size, float seed){
  vec2 g = uv * max(size, 0.02) * vec2(5.5, 4.5) + seed * vec2(7.3, 3.1);
  float fg = fwidth(g.x) + fwidth(g.y);
  float clump = smoothstep(0.42, 0.7, vn2(g) * 0.65 + vn2(g * 2.7 + 5.) * 0.35);
  float grit = step(0.55, h21(floor(g * 5.))) * (1. - clamp(fg * 5. - 0.3, 0., 1.));
  return mix(clump * (0.55 + 0.45 * grit), 0.3, clamp(fg * 0.9 - 0.25, 0., 1.));
}
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
  float soft = (1. - r2); soft *= soft;
  float n = fbm2(vUv * 1.6 + vK.z * 37.), n2 = vn2(vUv * vec2(15., 9.) + vK.z * 11.);
  float a = soft * (0.35 + 0.65 * n) * (0.55 + 0.6 * n2) * vK.x;
  if (vK.y > 3.5 && vK.y < 4.5) a = soft * vK.x;
  if (vK.y < 0.5 || (vK.y > 2.5 && vK.y < 3.5)) a = soft * smoothstep(0.3, 0.7, vn2(vUv * vec2(7., 2.2) + vK.z * 11.)) * (0.6 + 0.6 * n) * 1.3 * vK.x;
  vec3 col = mix(uGold * 0.85, uOrange * 0.8, clamp(smoothstep(0.02, 0.22, a) * 0.7 + vK.w * 0.45, 0., 1.));
  col = mix(col, uSienna * 0.9, smoothstep(0.18, 0.55, a) * (0.4 + 0.5 * vK.w));
  float thr = thrown(vUv, vS, vK.z);
  if (vK.y > 7.5 && vK.y < 8.5) { a = soft * smoothstep(0.3, 0.7, n) * thr * 2.2 * vK.x; col = mix(uGold * 0.95, uOrange * 0.9, 0.2 + 0.4 * vK.w); }      // skeins: wisps of amber grains
  if (vK.y > 0.5 && vK.y < 1.5) { col = mix(col, uSienna * 0.9, 0.4); a *= 1.3; }
  if (vK.y > 1.5 && vK.y < 2.5) { a = soft * smoothstep(0.2, 0.75, n) * thr * 2.4 * vK.x; col = mix(uGold, uOrange * 0.92, clamp(0.1 + 0.9 * a + 0.3 * vK.w, 0., 1.)); }      // the plume: thrown grains, gold where it thins
  if (vK.y > 5.5 && vK.y < 6.5) { a = soft * smoothstep(0.2, 0.65, n) * (0.6 + 0.6 * n2) * 1.6 * vK.x; col = mix(uSienna * 0.9, uUmber, 0.15 + 0.6 * vK.w); }
  if (vK.y > 8.5 && vK.y < 9.5) { a = soft * (0.6 + 0.6 * n2) * vK.x; col = mix(uSienna * 0.9, uUmber, 0.5); }
  if (vK.y > 9.5) { a = soft * smoothstep(0.3, 0.7, vn2(vec2(vUv.x * 3. + vK.z * 11., vUv.y * 0.7 + vK.z * 3.))) * (0.5 + 0.6 * n) * 1.3 * vK.x; col = mix(uGold * 1.05, uOrange * 0.95, clamp(0.15 + 0.5 * vK.w + 0.5 * (1. - a), 0., 1.)); }      // crest streamers: gold at the heart
  gl_FragColor = vec4(max(col, 0.), clamp(a, 0., 0.92));
  #include <fog_fragment>
}`;

// ---------- geometry helpers ----------
const quadGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
function instancedGeo(base, attrs, count, size = 4) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], size));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// a growing list of sand surfaces (world-space grids) that end up in one merged geometry
function makeSandMesh() {
  const P = [], N = [], D = [], G = [], I = [], CU = [], N2 = [], WL = [];
  return {
    // grid(nu, nv, fn): fn(i, j) -> [x, y, z, nx, ny, nz, crestDist, crestH, (lift, cutDepth, n2x, n2y, n2z)]; kind -> aG
    async grid(nu, nv, kind, fn, flip = false, pause = null) {      // (runs straight through unless it is given a pause)
      const base = P.length / 3;
      for (let j = 0; j <= nv; j++) { if (pause && j > 0 && (j * (nu + 1)) % 1200 < nu + 1) await pause(); for (let i = 0; i <= nu; i++) {
        const v = fn(i, j); P.push(v[0], v[1], v[2]); N.push(v[3], v[4], v[5]); D.push(v[6], v[7]); G.push(kind);
        CU.push(v[8] || 0, v[9] || 0); N2.push(v[10] || 0, v[11] ?? 1, v[12] || 0); WL.push(v[13] || 0, v[14] || 0, v[15] || 0, v[16] || 0);
      } }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
        if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setAttribute('aG', new THREE.Float32BufferAttribute(G, 1));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(CU, 2)); g.setAttribute('aN2', new THREE.Float32BufferAttribute(N2, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(WL, 4));
      g.setIndex(I); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
    get triangles() { return I.length / 3; },
  };
}
// normal of a height function h(x, z) by central differences
const normalOf = (h, x, z, e = 0.6) => { const dx = (h(x + e, z) - h(x - e, z)) / (2 * e), dz = (h(x, z + e) - h(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };

// a tube along a crooked polyline, as rings; returns nothing, pushes into the tree buffers
function tubeInto(buf, pts, radii, sides, tOrder, treeSeed, treeIdx) {
  const { P, N, R, T, I, S, sh } = buf; let prev = -1; const up = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  for (let k = 0; k < pts.length; k++) {
    d.subVectors(pts[Math.min(k + 1, pts.length - 1)], pts[Math.max(k - 1, 0)]).normalize();
    up.set(0.31, 0.2, 0.93); a.crossVectors(up, d); if (a.lengthSq() < 1e-4) a.set(1, 0, 0); a.normalize(); b.crossVectors(d, a);
    const start = P.length / 3, r = radii[k];
    let ax = d.x + sh[0] * d.y, az = d.z + sh[1] * d.y; const al = Math.hypot(ax, az); if (al < 1e-3) { ax = 1; az = 0; } else { ax /= al; az /= al; }
    const px = -az, pz = ax;      // across the limb's shadow on the glass
    for (let s = 0; s < sides; s++) {
      const th = (s / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const ox = a.x * cs + b.x * sn, oy = a.y * cs + b.y * sn, oz = a.z * cs + b.z * sn;
      P.push(pts[k].x + ox * r, pts[k].y + oy * r, pts[k].z + oz * r); N.push(ox, oy, oz); R.push(ox * r, oy * r, oz * r); T.push(tOrder[k], treeSeed, treeIdx);
      const ac = Math.max(-1, Math.min(1, (ox + sh[0] * oy) * px + (oz + sh[1] * oy) * pz)); S.push(px * ac, pz * ac);
    }
    if (prev >= 0) for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; I.push(prev + s, prev + s1, start + s, prev + s1, start + s1, start + s); }
    prev = start;
  }
}
// one dead camel-thorn: a short heavy trunk, crooked limbs, a heap at the foot. Returns twig tips for the streamers.
function growTree(buf, rng, x, z, hgt, near, idx) {
  const sides = near ? 6 : 4, seed = rng(), tips = [], total = { n: 0 };
  const chains = [];
  const crook = (p0, dir, len, n, r0, r1, depth, t0) => {
    const pts = [p0.clone()], radii = [r0], d = dir.clone().normalize(), p = p0.clone(), step = len / n;
    for (let k = 1; k <= n; k++) {
      d.x += rng.range(-0.38, 0.38); d.z += rng.range(-0.38, 0.38); d.y += rng.range(-0.22, 0.3) + (depth ? 0.02 : 0.12); d.normalize();
      p.addScaledVector(d, step); pts.push(p.clone()); radii.push(lerp(r0, r1, Math.pow(k / n, 0.8)));
    }
    chains.push({ pts, radii, t0, len });
    if (depth < 2) {
      const kids = depth === 0 ? rng.int(3, 4) + (near ? 1 : 0) : rng.int(1, 2);
      for (let c = 0; c < kids; c++) {
        const at = depth === 0 ? rng.int(Math.max(1, n - 2), n) : rng.int(1, n - 1), ang = rng.range(0, Math.PI * 2);
        const cd = new THREE.Vector3(Math.cos(ang), rng.range(0.25, 0.9), Math.sin(ang)).lerp(d, 0.25);
        const cl = len * (depth === 0 ? rng.range(0.75, 1.25) : rng.range(0.4, 0.7));
        crook(pts[at], cd, cl, near ? (depth === 0 ? 5 : 3) : (depth === 0 ? 3 : 2), radii[at] * 0.72, depth === 0 ? 0.045 : 0.022, depth + 1, t0 + (at / n) * len);
      }
    } else tips.push(p.clone());
  };
  const base = new THREE.Vector3(x, 0, z);
  crook(base, new THREE.Vector3(rng.range(-0.25, 0.25), 1, rng.range(-0.25, 0.25)), hgt * 0.42, near ? 4 : 3, hgt * 0.062 + 0.05, hgt * 0.04 + 0.03, 0, 0);
  let tMax = 1e-3; for (const c of chains) tMax = Math.max(tMax, c.t0 + c.len);
  let top = 0;
  for (const c of chains) {
    const order = c.pts.map((_, k) => (c.t0 + (k / (c.pts.length - 1)) * c.len) / tMax);
    tubeInto(buf, c.pts, c.radii, sides, order, seed, idx); for (const p of c.pts) top = Math.max(top, p.y);
  }
  // the heap of the pinch it was drizzled from
  const { P, N, R, T, I, S } = buf, c0 = P.length / 3, hr = hgt * 0.16 + 0.35, hn = near ? 10 : 6;
  P.push(x, hgt * 0.035 + 0.12, z); N.push(0, 1, 0); R.push(0, 0, 0); T.push(-1, seed, idx); S.push(0, 0);
  for (let k = 0; k < hn; k++) { const th = (k / hn) * Math.PI * 2, rr = hr * rng.range(0.75, 1.2); P.push(x + Math.cos(th) * rr, 0.012, z + Math.sin(th) * rr); N.push(Math.cos(th) * 0.5, 0.85, Math.sin(th) * 0.5); R.push(0, 0, 0); T.push(-1, seed, idx); S.push(0, 0); }
  for (let k = 0; k < hn; k++) I.push(c0, c0 + 1 + ((k + 1) % hn), c0 + 1 + k);
  const skel = []; for (const c of chains) for (const q of c.pts) if (q.y > 0.25 * hgt) skel.push(q);
  return { tips, top, skel, seed };
}

// ostrich, body-local: x across, y up, z forward; 1.3 m at the back, 2.25 m to the crown
function buildOstrichGeometry() {
  const P = [], PART = [], PAINT = [], I = [];
  const add = (p, part, paint) => { P.push(p[0], p[1], p[2]); PART.push(part[0], part[1], part[2], part[3]); PAINT.push(paint[0], paint[1], paint[2]); return P.length / 3 - 1; };
  const join = (r0, r1, n) => { for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; I.push(r0 + k, r0 + k1, r1 + k, r0 + k1, r1 + k1, r1 + k); } };
  const ringZ = (z, y, rx, ry, n, part, paint, tilt = 0) => { const s = P.length / 3; for (let k = 0; k < n; k++) { const th = (k / n) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th); add([rx * cs, y + ry * sn * Math.cos(tilt), z - ry * sn * Math.sin(tilt)], part, paint(cs, sn)); } return s; };
  // body: a deep egg, darker along the back
  let prev = -1;
  [[-0.62, 1.30, 0.04, 0.05], [-0.5, 1.3, 0.2, 0.24], [-0.25, 1.28, 0.3, 0.36], [0.05, 1.25, 0.32, 0.4], [0.3, 1.27, 0.26, 0.33], [0.47, 1.33, 0.15, 0.2], [0.56, 1.38, 0.08, 0.1]].forEach((r) => {
    const cur = ringZ(r[0], r[1], r[2], r[3], 10, [0, 0, 0, 0], () => [0, 0.03, 0]); if (prev >= 0) join(prev, cur, 10); prev = cur;
  });
  // neck (weight rises along it) and the small flat head with its beak
  prev = -1;
  [[0.5, 1.4, 0.1, 0.05], [0.6, 1.6, 0.068, 0.3], [0.645, 1.85, 0.052, 0.6], [0.68, 2.05, 0.047, 0.85], [0.71, 2.17, 0.05, 1]].forEach((r) => {
    const cur = ringZ(r[0], r[1], r[2], r[2], 6, [5, r[3], 0, 0], () => [0.25, 0.5, 1], 1.25); if (prev >= 0) join(prev, cur, 6); prev = cur;
  });
  [[0.7, 2.2, 0.03], [0.76, 2.21, 0.062], [0.85, 2.2, 0.058], [0.93, 2.18, 0.034], [1.03, 2.16, 0.01]].forEach((r) => {
    const cur = ringZ(r[0], r[1], r[2], r[2] * 0.8, 6, [5, 1, 0, 0], () => [0, 0.25, 0]); join(prev, cur, 6); prev = cur;
  });
  // wing plumes and tail plume: shaggy fans wiped back to cream
  const fan = (root, tip, spread, n) => {
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1) - 0.5, e = [tip[0] + spread[0] * f, tip[1] + spread[1] * f, tip[2] + spread[2] * f];
      const a = add(root, [6, 0, 0, 0], [0.3, 0.2, 0]), b = add([e[0] - spread[0] * 0.3 / n, e[1] + 0.05, e[2] - spread[2] * 0.3 / n], [6, 1, 0, 0], [1, 0.4, 0]);
      const c = add([e[0] + spread[0] * 0.3 / n, e[1] - 0.05, e[2] + spread[2] * 0.3 / n], [6, 1, 0, 0], [1, 0.4, 0]);
      I.push(a, b, c);
    }
  };
  for (const sg of [-1, 1]) fan([0.27 * sg, 1.45, 0.12], [0.4 * sg, 1.05, -0.38], [0.1 * sg, 0.1, 0.55], 6);
  fan([0, 1.36, -0.5], [0, 1.18, -0.98], [0.5, 0.0, 0.05], 5); fan([0, 1.36, -0.5], [0, 1.3, -0.95], [0.0, 0.42, 0.1], 4);
  // legs: straight in the rest pose; the shader solves hip -> ankle -> foot
  for (let li = 0; li < 2; li++) {
    const hx = li === 0 ? 0.14 : -0.14; prev = -1;
    [[0, 0.11, 0.16, 0], [0.25, 0.09, 0.12, 0], [0.47, 0.05, 0.06, 0], [0.55, 0.034, 0.04, 0], [0.9, 0.03, 0.034, 0], [0.95, 0.04, 0.07, 0.04], [1, 0.045, 0.12, 0.09]].forEach((r) => {
      const s = P.length / 3;
      for (let k = 0; k < 6; k++) { const th = (k / 6) * Math.PI * 2, ox = r[1] * Math.cos(th), of = r[2] * Math.sin(th) + r[3]; add([hx + ox, 1.12 * (1 - r[0]), -0.05 + of], [li + 1, r[0], ox, of], [r[0] > 0.5 ? 0.7 : 0, 0.3, 1]); }
      if (prev >= 0) join(prev, s, 6); prev = s;
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(PART, 4));
  g.setAttribute('aPaint', new THREE.Float32BufferAttribute(PAINT, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
function buildGrassGeometry(n) {
  const B = [], I = [];
  for (let k = 0; k < n; k++) {
    const an = k * (6.2832 / n) + 0.4 + 0.5 * Math.sin(k * 2.3), dx = Math.cos(an), dz = Math.sin(an), o = B.length / 4;
    B.push(dx, dz, 0, -1, dx, dz, 0, 1, dx, dz, 0.55, -1, dx, dz, 0.55, 1, dx, dz, 1, 0);
    I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((B.length / 4) * 3), 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4)); g.setIndex(I);
  return g;
}
function buildBirdGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.17, -0.05, 0, 0, 0.05, 0, 0, 0, 0.02, -0.19,
    -0.04, 0, 0.07, -0.04, 0, -0.05, -0.36, 0, -0.03, 0.04, 0, 0.07, 0.04, 0, -0.05, 0.36, 0, -0.03], 3));
  g.setAttribute('aWg', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 1, 0, 0, 1], 1));
  g.setIndex([0, 1, 2, 1, 3, 2, 4, 6, 5, 7, 8, 9]);
  return g;
}

// the looks a visit can have: hour and weather, with sky, light, fog and grade to match
const LOOKS = {
  wind: { hour: 'morning', weather: 'wind', skyH: '#FFE7B8', skyA: '#F6B85A', skyM: '#E8933C', skyZ: '#9E4420', stops: [0.03, 0.42, 0.36, 0.95], band: [0.1, 0.3, 0], lip: '#4A2212', wipe: '#FFF1CF', sunC: [1.7, 1.5, 1.1], sunEl: 19,
    fog: '#F2C582', fogNear: 420, fogFar: 8200, veil: '#F1AE4E', exposure: 1.0, night: 0, portal: '#ffe2a8', tint: '#fff6ea', shadow: '#0c0502' },
  golden: { hour: 'golden', weather: 'wind', skyH: '#F7B24E', skyA: '#F6B85A', skyM: '#A64C1B', skyZ: '#3a1a0e', stops: [0.03, 0.42, 0.36, 0.95], band: [0.1, 0.3, 0], lip: '#1c0c06', wipe: '#FFCF7A', sunC: [1.8, 1.2, 0.5], sunEl: 9,
    fog: '#D98A34', fogNear: 300, fogFar: 5200, veil: '#E9983A', exposure: 1.0, night: 0, portal: '#ffd27a', tint: '#fff0dc', shadow: '#0e0502' },
  // night: the table stays lit but cools to bone white; the sky's sand lies deep (bone at the rim of the pane, a breath of amber
  // where the sand begins, then aubergine to blue-black) and the films of sand on the glass still burn gold
  night: { hour: 'night', weather: 'wind', skyH: '#CDBE9C', skyA: '#D98B36', skyM: '#3A1A2A', skyZ: '#0D0A16', stops: [0.05, 0.27, 0.2, 0.62], band: [0.11, 0.3, 0.85], lip: '#06040A', wipe: '#C98A3E', sunC: [1.45, 1.4, 1.25], sunEl: 17,
    fog: '#A8845A', fogNear: 300, fogFar: 5200, veil: '#B58A4E', exposure: 1.0, night: 1, portal: '#cfe0ea', tint: '#faf6f0', shadow: '#0a0612' },
  fog: { hour: 'morning', weather: 'fog', skyH: '#F3E6CC', skyA: '#F6B85A', skyM: '#DFA05C', skyZ: '#93502c', stops: [0.03, 0.42, 0.36, 0.95], band: [0.1, 0.3, 0], lip: '#4A2212', wipe: '#FFF1CF', sunC: [1.5, 1.4, 1.15], sunEl: 19,
    fog: '#EFCB92', fogNear: 380, fogFar: 6200, veil: '#F1AE4E', exposure: 1.0, night: 0, portal: '#ffe2a8', tint: '#f8f6f0', shadow: '#0a0808' },
};

export default {
  id: 'wind-draws-the-namib',
  name: 'The Desert the Wind Draws',
  category: 'wilderness',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    // ----- which visit is this: hour and weather, cast, season -----
    const r0 = rng(), r1 = rng(), r2 = rng(), r3 = rng();
    let lookId = r0 < 0.22 ? 'night' : r0 < 0.55 ? 'golden' : r0 < 0.82 ? 'wind' : 'fog';
    if (vary.hour === 'golden') lookId = 'golden'; else if (vary.hour === 'night') lookId = 'night';
    else if ((vary.hour === 'day' || vary.hour === 'dawn') && (lookId === 'night' || lookId === 'golden')) lookId = r1 < 0.6 ? 'wind' : 'fog';
    const look = LOOKS[lookId];
    const still = lookId !== 'fog' && r1 > 0.8;            // a windless day: few strokes, crisp ripples, little smoke
    const rain = r2 > 0.78;                                // after rare rain: the flat combed with new grass
    const cast = r3 > 0.62 ? 'calves' : 'gemsbok';
    const rare = !!vary.rare;
    const C = (h) => new THREE.Color(h);

    // ----- the Great Dune (leg-2 coordinates: a along the last leg from the bend, b to its left) -----
    const HS = 64, bS = rng.range(300, 365), hS = rng.range(282, 318), shH = rng.range(12, 22), wobA = rng.range(22, 40), scPh = rng.range(0, 6.28);
    const hcB = (b) => {
      if (b >= 0) { if (b <= bS) { const s = Math.sin(0.5 * Math.PI * b / bS); return HS + (hS - HS) * s * s; } return hS * Math.pow(1 - sstep(bS, bS + 720, b), 1.15); }
      if (b > -75) { const s = Math.sin(0.5 * Math.PI * -b / 75); return HS + shH * s * s; }
      return (HS + shH) * Math.pow(1 - sstep(75, 340, -b), 1.2);
    };
    const wOf = (h) => 231 * Math.pow(Math.max(h, 0.01) / HS, 0.75);
    const wWind = (b) => wOf(hcB(b)) * (1 + 0.06 * Math.sin(b * 0.05 + scPh) * sstep(30, 100, Math.abs(b)));
    const acB = (b) => A_FOOT + wOf(hcB(b)) + wobA * Math.sin(b / 150) * sstep(0, 80, Math.abs(b));
    const wLee = (b) => 25 + 1.45 * hcB(b);
    const A_S = acB(0);
    // a spur running from the summit down toward the pan: the third arm of the star
    const spA = acB(bS), spL = 0.82 * wOf(hS), spD = [-0.95, 0.31], spH = hS * 0.14;
    const spur = (a, b) => {
      const ra = a - spA, rb = b - bS, s = (ra * spD[0] + rb * spD[1]) / spL, dist = ra * spD[1] - rb * spD[0];
      if (s <= 0 || s >= 1) return [0, dist, 0];
      const hh = spH * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.8), k = Math.max(0, 1 - Math.abs(dist) / (55 + 20 * s));
      return [hh * Math.pow(k, 1.25), dist, hh];
    };
    const H0 = (a, b) => {
      const h = hcB(b); if (h < 0.05) return 0;
      const A = acB(b);
      if (a <= A) { const t = (A - a) / wWind(b); return t >= 1 ? 0 : h * Math.pow(1 - t, 1.3) + spur(a, b)[0]; }
      const t = (a - A) / wLee(b); return t >= 1 ? 0 : h * Math.pow(1 - t, 1.25);
    };
    const toW = (a, b) => [X_BEND + a * DX + b * LX, Z0 + a * DZ + b * LZ];
    const toAB = (x, z) => [(x - X_BEND) * DX + (z - Z0) * DZ, (x - X_BEND) * LX + (z - Z0) * LZ];

    // ----- the path: the furrow, the ripple fields, the pan, and the climb to the notch -----
    const smax = (x, y, k) => 0.5 * (x + y + Math.sqrt((x - y) * (x - y) + k * k));
    const y1 = (d) => 2.4 + 2.2 * sstep(105, 160, d) - 0.9 * sstep(175, 230, d) + 1.3 * sstep(235, 275, d) - 1.0 * sstep(400, 480, d) + 2.0 * sstep(250, 310, d) * (1 - sstep(335, 400, d)) - 0.75 * sstep(452, 492, d) + 0.3 * sstep(566, 600, d);      // (lower over the pan, beside the herd and the bull)
    const yRamp = (a) => 3.2 + 6.4 * sstep(28, 110, a) + 0.125 * Math.max(a - 110, 0);      // (level and low until the bull has run beside us)
    const A_L = A_END - 62, yPortal = H0(A_S, 0) - 0.7;
    const yFree = (a) => smax(yRamp(a), H0(a, 0) + 0.8, 2.5);
    const yPath = (a) => a < A_L ? yFree(a) : lerp(yFree(A_L), yPortal, (a - A_L) / (A_END - A_L));
    // On the arm the road leaves the stroke's scratch: it swings out 20 m to the right, high over the ripples, and comes back heading
    // 20 degrees left, so that for a while we look across the scratch and the herd on it, up the Great Dune's long knife crest
    // to the sun-print; it is back over the scratch where the trench begins.
    const SWING = [[112, -1.5], [137, -10], [162, -19.5], [187, -20], [210, -12.5], [230, -4.2], [249, -0.6]];
    const yOff = (a, b) => Math.max(yPath(a), smax(yRamp(a), H0(a, b) + 0.8, 2.5));
    const pts = [];
    for (const x of [X_IN, 240, 180, 150, 120, 90, 50, 10]) pts.push([x, y1(X_IN - x), Z0]);
    // While the palm's front passes, the road itself swings 24 degrees right, down onto the freshly bared glass at the dune's
    // foot, so that the standing dune and the front lie ahead of us (a steady camera looks down the road, not at a poi);
    // then it runs on almost straight to meet the last leg 85 m past where the two lines would cross.
    const A_JOIN = 85, wJ = toW(A_JOIN, 0);
    for (const q of [[-25, Z0], [-50, 207], [-75, 196.5], [-100, 185], [-124, 174.5], [-150, 169.3]]) pts.push([q[0], y1(X_IN - q[0]), q[1]]);
    for (const x of [-190, -235, -280]) { const z = lerp(169.3, wJ[1], (-150 - x) / (-150 - wJ[0])), a = toAB(x, z)[0]; pts.push([x, Math.max(y1(X_IN - x), a > 10 ? yPath(a) : 0), z]); }
    { const w = toW(A_JOIN, 0); pts.push([w[0], yPath(A_JOIN), w[1]]); }
    for (const q of SWING) { const w = toW(q[0], q[1]); pts.push([w[0], yOff(q[0], q[1]), w[1]]); }
    for (const a of [268, 286, A_L, A_L + 31, A_END]) { const w = toW(a, 0); pts.push([w[0], yPath(a), w[1]]); }
    const path = makePath(pts);
    const L = path.length, VC = L / DUR;
    // the real height of the path over leg 2, metre by metre (the furrow is carved 3.2 m under it)
    await ctx.yield();
    const yTab = new Float32Array(420).fill(-1);
    { const p = new THREE.Vector3(); for (let i = 0; i <= 3000; i++) { path.pointAt(i / 3000, p); const ab = toAB(p.x, p.z), k = Math.round(ab[0]); if (k >= 0 && k < 420 && Math.abs(ab[1]) < 3) yTab[k] = p.y; } }
    { let last = 4; for (let k = 0; k < 420; k++) { if (yTab[k] < 0) yTab[k] = k > A_END ? yTab[k - 1] + (yTab[A_END - 2] - yTab[A_END - 12]) / 10 : k >= 100 ? yPath(k) : last; last = yTab[k]; } }
    for (let k = 100; k <= A_END; k++) yTab[k] = lerp(yPath(k), yTab[k], sstep(252, 270, k));      // (where the road has swung off the scratch: the height it would have had)
    const yPathA = (a) => { const k = Math.min(418, Math.max(0, a)), i = Math.floor(k); return lerp(yTab[i], yTab[i + 1], k - i); };
    // The trench our stroke ploughs up the arm, in cross-section: a floor of bare glass, walls of loose sand at the angle of
    // repose, scalloped into chutes whose fans run out onto the floor, and a ragged berm of displaced sand along each rim.
    const nz = ctx.noise, hwAt = (a) => 3.4 + 5 * sstep(A_S - 32, A_S - 6, a);
    const TR = { sd: 99, th: 0, rim: 99, bump: 0 };       // metres past the toe, sand above the floor, metres past the rim crest, fan
    const inTrench = (a) => a >= A_FOOT - 4 && a <= A_S + 14;
    const cutAt = (a) => (inTrench(a) ? Math.max(0, H0(a, 0) - (yPathA(a) - 3.2)) * (1 - sstep(A_S + 8, A_S + 14, a)) : 0);
    const HG = (a, b, out) => {
      const h = H0(a, b), ab = Math.abs(b), sg = b < 0 ? -1 : 1;
      if (!inTrench(a) || ab > 22) { if (out) { out.sd = 99; out.th = 0; out.rim = 99; out.bump = 0; } return h; }
      const fy = yPathA(a) - 3.2, fade = 1 - sstep(A_S + 8, A_S + 14, a);
      const cutC = Math.max(0, H0(a, 0) - fy) * fade, deep = sstep(0, 1.2, cutC), hw = hwAt(a);
      // where a chute pours and fans out: one every 5.6 m or so, on the layout the wall shader draws its threads on
      const sgn = sg < 0 ? 7 : 0, ck = Math.floor(a / 5.6 + sgn * 0.37), da = a - (ck + 0.5 + 0.28 * Math.sin(ck * 12.9898 + sgn) - sgn * 0.37) * 5.6, wch = 0.8 + 0.3 * Math.sin(ck * 78.233 + sgn);
      const bump = Math.exp(-(da * da) / (wch * wch)) * deep;
      const wn = 0.35 * nz.n2(a * 0.21, sg * 9.1);
      const toe = hw + wn - 1.25 * bump + 0.2 * nz.n2(a * 0.7, sg * 8.8) * deep, bc = hw + wn + lerp(1.6, Math.max(3.6, 1.4 * cutC), deep) + 0.45 * nz.n2(a * 0.11, sg * 3.3) + 0.2 * bump;
      const berm = lerp(0.3 * sstep(0.4, 2.5, h), (0.66 + 0.16 * nz.n2(a * 0.23, sg * 1.7) + 0.09 * nz.n2(a * 0.9, sg * 4.4)) * (1 - 0.14 * bump), deep) * fade;
      const cutL = Math.max(0, h - fy) * fade;
      let y, th;
      if (ab < bc) {
        const t = Math.min(1, Math.max(0, (ab - toe) / (bc - toe))), pr = t <= 0 ? 0 : Math.pow(t, 1.15 + 0.8 * bump);
        th = (cutL + berm) * pr + (t > 0 ? deep * (0.2 * nz.n2(a * 0.45, b * 0.5) + 0.08 * nz.n2(a * 1.1, b * 1.2)) * Math.sin(Math.PI * t) : 0); if (th < 0) th = 0;
        y = h - cutL + th;
      } else { th = cutL + berm * Math.exp(-Math.pow((ab - bc) / (1.5 + 0.9 * deep), 1.6)); y = h - cutL + th; }
      if (out) { out.sd = ab - toe; out.th = th; out.rim = ab - bc; out.bump = bump; }
      return y;
    };
    const rimB = (a, sg) => { HG(a, sg, TR); return sg * (1 - TR.rim); };       // where the rim's crest runs
    // the arm before our stroke cuts it (the notch itself is a shallow saddle from the start)
    const HU = (a, b) => lerp(H0(a, b), HG(a, b), sstep(A_S - 75, A_S - 45, a));
    await ctx.yield();

    // ----- the herd: its line (20 m to our right, then hooking left across our bow at the dune's foot) and its pace -----
    const D_BIRTH = 406, trackRaw = [], _p = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
    // (distances along the path are counted as if the first leg still ran straight to the bend: dTurn is where the last leg's a = 0 would be)
    let dJoin = 500; for (; dJoin < L; dJoin += 0.5) { path.posAtDist(dJoin, _p); if (toAB(_p.x, _p.z)[0] >= A_JOIN) break; }
    const dTurn = dJoin - A_JOIN, DS = dTurn - 540;
    // (over the pan it closes in on us: the near flank runs five metres off our side; then it swings wide round the old tree)
    const LANE_IN = 6.5;
    const laneOff = (d) => 17 - LANE_IN * sstep(428 + DS, 476 + DS, d) * (1 - sstep(570 + DS, 598 + DS, d)) - 1.2 * sstep(500 + DS, 540 + DS, d) * (1 - sstep(572 + DS, 596 + DS, d)) + 8.5 * sstep(572 + DS, 597 + DS, d) * (1 - sstep(612 + DS, 640 + DS, d));
    // (it is born on the swing, so its line runs back straight along the diagonal, 17 m to our right, and curves with the path after)
    for (let d = D_BIRTH; d < dTurn + 60; d += 20) { path.posAtDist(d, _p); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1, o = laneOff(d); trackRaw.push([_p.x - o * _t.z / l, 0, _p.z + o * _t.x / l]); }
    for (const ab of [[86, -15], [106, -8.5], [127, -2.5], [149, 0], [175, 0.8], [200, 1.6], [222, 3], [237, 10], [250, 24], [262, 45], [272, 75], [282, 115], [292, 165], [302, 230], [312, 300]]) {
      const w = toW(ab[0], ab[1]); trackRaw.push([w[0], Math.max(0, H0(ab[0], ab[1]) - 0.05), w[1]]);
    }
    const rawS = [0]; for (let i = 1; i < trackRaw.length; i++) rawS.push(rawS[i - 1] + Math.hypot(trackRaw[i][0] - trackRaw[i - 1][0], trackRaw[i][2] - trackRaw[i - 1][2]));
    // arc length along the herd's line of the point nearest (x, z), and the distance to the line
    const _tn = { s: 0, dist: 0, lat: 0 };
    const trackNear = (x, z) => {
      let best = 1e18, bs = 0, sgn = 1;
      for (let i = 0; i < trackRaw.length - 1; i++) {
        const ax = trackRaw[i][0], az = trackRaw[i][2], bx = trackRaw[i + 1][0] - ax, bz = trackRaw[i + 1][2] - az, ll = bx * bx + bz * bz;
        let t = ((x - ax) * bx + (z - az) * bz) / ll; if (i > 0) t = Math.max(0, t); if (i < trackRaw.length - 2) t = Math.min(1, t);
        const dx = x - ax - bx * t, dz = z - az - bz * t, dd = dx * dx + dz * dz;
        if (dd < best) { best = dd; bs = rawS[i] + t * Math.sqrt(ll); sgn = (dx * bz - dz * bx) >= 0 ? 1 : -1; }
      }
      _tn.s = bs; _tn.dist = Math.sqrt(best); _tn.lat = sgn * _tn.dist; return _tn;   // lat > 0 on the camera's side of the line (one shared result: read it before the next call)
    };
    const sCam = (u) => { path.pointAt(u, _q); return trackNear(_q.x, _q.z).s; };
    const D0U = 0.37, T0 = D0U * DUR, V0 = 15.2, V1 = VC * 0.99, UA = 0.57, UB = 0.64;
    const lead = (u) => { const t = (u - UA) / (UB - UA), I = t <= 0 ? 0 : t < 1 ? t * t * t - 0.5 * t * t * t * t : 0.5 + (t - 1); return V0 * (u * DUR - T0) + (V1 - V0) * DUR * (UB - UA) * I + 24 * sstep(0.62, 0.76, u); };
    const BULL_LAT = 4.2;
    const bullA = Math.min(3, Math.max(-60, sCam(0.61) + 4.5 - lead(0.61)));
    // a cow with her calf at heel and one more beyond them run where we draw level at u 0.52: the near flank of the gallop, five to eight metres off
    const flA = Math.min(bullA - 9, Math.max(-64, sCam(0.52) + 4.5 - lead(0.52)));
    const flank = [{ a: flA, lat: 4.4, sz: 1.06, seed: 0.31, gait: 0.15, birth: 0.55 }, { a: flA - 2.7, lat: 3.1, sz: 0.66, seed: 0.33, gait: 0.6, birth: 0.6 }, { a: flA + 3.6, lat: 1.6, sz: 1.0, seed: 0.42, gait: 0.8, birth: 0.5 }];

    // sentinels on the furrow's right rim below the notch, as gemsbok stand on crests to catch the breeze
    const sentinels = [[A_S - 40, 2.5], [A_S - 27, 2.0], [A_S - 14, 2.9]].map((s) => { const b = rimB(s[0], -1) - 0.3, w = toW(s[0], b); return { pos: [w[0], HG(s[0], b) - 0.05, w[1]], yaw: s[1] + rng.range(-0.3, 0.3), size: 1.18 }; });
    // and two more on a tall heap of the right-hand ridge near the start, watching us come down the road
    const HEAP_X = 216, HEAP_H = 2.7, HEAP_LAT = 6.7, ridgeBull = new THREE.Vector3(HEAP_X - 1, HEAP_H + 1.5, Z0 - HEAP_LAT);
    sentinels.push({ pos: [HEAP_X + 1, HEAP_H - 0.08, Z0 - HEAP_LAT], yaw: -Math.PI / 2 + 0.12, size: 1.18 }, { pos: [HEAP_X - 5.5, HEAP_H - 0.08, Z0 - HEAP_LAT], yaw: Math.PI / 2 - 0.2, size: 1.0 });
    // and two lower down the same rim, where the trench begins: the first we meet (placed by hand, so the world's random draws stay as they were)
    for (const s of [[A_S - 84, 2.75, 1.24, 0.21], [A_S - 68, 2.2, 1.08, 0.63]]) { const b = rimB(s[0], -1) - 0.3, w = toW(s[0], b); sentinels.push({ pos: [w[0], HG(s[0], b) - 0.05, w[1]], yaw: s[1], size: s[2], seed: s[3] }); }
    const sunAz = 40 * Math.PI / 180, sunEl = look.sunEl * Math.PI / 180;
    const sunDir = new THREE.Vector3(-Math.cos(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.sin(sunAz) * Math.cos(sunEl));
    // shadows are drawn in sand, away from the sun-print: this many metres along (x, z) for every metre of height
    const shLen = Math.min(1 / Math.tan(sunEl), 3.2), shN = Math.hypot(sunDir.x, sunDir.z), shV = [-sunDir.x / shN * shLen, -sunDir.z / shN * shLen];
    const hero = await buildHero(ctx, {
      palette: PALETTE, hour: look.hour, weather: still ? 'still' : look.weather, cast, count: Math.round(lerp(45, 70, (dens - 0.7) / 0.6)),
      track: trackRaw, sentinels, duration: DUR, speed: V0, lead, bullA, bullLat: BULL_LAT, flank, shadow: [shV[0], shV[1], 1], wipeU: [0.295, 0.42], glass: false,
      wipeKeys: [[0.295, 255], [0.33, 60], [0.345, 0], [0.36, -55], [0.37, -86], [0.38, -118], [0.39, -150], [0.405, -215], [0.42, -305]], sunDir: [sunDir.x, sunDir.y, sunDir.z],
    });
    const U = hero.uniforms;
    U.uSheen.value *= 1.7;                                  // the one cool note: the sky pane mirrored on bare glass
    if (lookId === 'night') {                               // night: bone-white glass, the films on it still gold and orange, the deep sand gone to aubergine
      U.uGlass.value.set('#EBD8AE').multiplyScalar(0.71);
      U.uGold.value.set(PALETTE[1]).multiplyScalar(0.96); U.uOrange.value.set(PALETTE[2]).multiplyScalar(0.86);
      U.uSienna.value.set(PALETTE[3]).lerp(new THREE.Color('#5A2238'), 0.4).multiplyScalar(0.6);
      U.uUmber.value.set('#34172A').multiplyScalar(0.85); U.uBlack.value.set('#0C0812');
      U.uSheen.value *= 0.3;                                // (the cool sheen stays an accent on so pale a glass)
    } else if (lookId !== 'golden') { U.uGlass.value.multiplyScalar(0.93); U.uGlass.value.b *= 1.2; }      // bare glass is cream: not yellow, not white
    else {                                                  // the golden hour: the glass deepens to gold, the sand to umber
      U.uGlass.value.copy(new THREE.Color('#F6B85A')).lerp(new THREE.Color('#EE9A32'), 0.35).multiplyScalar(0.98);
      U.uGold.value.lerp(U.uOrange.value, 0.55); U.uOrange.value.lerp(U.uSienna.value, 0.45); U.uSienna.value.lerp(U.uUmber.value, 0.25); U.uUmber.value.multiplyScalar(0.8);
    }
    await ctx.yield();

    // ----- ADDED: what stays written on the glass behind the herd, and the herd's files that run on up the arm with us -----
    await addGlassMarks(ctx, hero);
    // The herd's line leaves our furrow to the left 220 m up the leg. Fourteen more of its animals run straight on, seven to a side:
    // each file takes the outer shoulder of one wall of the furrow, 1.6 m beyond the crest of its rim (8.5 to 9 m from the route's
    // line on the arm, 12 to 17 m where the furrow widens into the notch: clear of the 6 m a creature must leave us, and as near
    // as the wall lets them stand), every second animal 1.5 to 2.3 m further out on the fresh sand. Each line is laid in metres
    // along the arm, on the sand as the stroke leaves it, over the crest beside the ring and down the lee side out of sight. An
    // animal comes out of the herd's stream: it is sifted in where its line begins, on the scratch, at the moment the herd's
    // column brings its seat there. That moment and that place are all it takes from the herd. From then on it runs on its
    // own: its metres along its line are the design's pace of the herd (written once, in the part: FILE_PACE) times the seconds
    // of the flight's clock since its moment. Nothing else moves it, and it does not tire. An animal that would come within the
    // guide's clear corridor of the eye at any moment of the flight is left out whole (the part tests each over the whole flight,
    // against the route's own point): its seat's draws are still taken, so the others stand where they stand.
    const fileSet = await (async () => {
      const fr = ctx.core.makeRng(ctx.core.hashSeed('namib-files:' + ctx.seed)), OUT = 1.6, FILE_A0 = 204, FILE_A1 = 220;
      let sA = 250; for (; sA < 600; sA += 0.5) { hero.trackAt(sA, _p); if (toAB(_p.x, _p.z)[0] >= FILE_A0) break; }
      const rimS = (a, sg) => { let m = 0; for (const d of [-6, -3, 0, 3, 6]) m += Math.abs(rimB(Math.min(a + d, A_S + 8), sg)); return m / 5; };
      const ground = (a, b) => Math.max(HG(a, b), 0);
      const lines = [];
      for (const sg of [1, -1]) {
        const ab = [];
        for (let s = sA; s < sA + 60; s += 1.5) { hero.trackAt(s, _p); const q = toAB(_p.x, _p.z); if (q[0] > FILE_A1) break; ab.push(q); }
        const a0 = ab[ab.length - 1][0], b0 = ab[ab.length - 1][1];
        for (let a = a0 + 1.5; a <= A_S + 30; a += 1.5) ab.push([a, lerp(b0, sg * (rimS(a, sg) + OUT), sstep(a0, a0 + 26, a))]);
        const pts = ab.map((q) => { const w = toW(q[0], q[1]), y = ground(q[0], q[1]); return [w[0], y, w[1], (ground(q[0], q[1] + sg * 2.3) - y) / (sg * 2.3)]; });
        const rows = [];
        for (let i = 0; i < 7; i++) rows.push({ a: 6 - i * 6.8 + fr.range(-1.2, 1.2) - (sg < 0 ? 3.4 : 0), lat: sg * (i % 2 ? fr.range(1.5, 2.3) : fr.range(0, 0.4)), sz: fr.range(0.94, 1.08), seed: fr(), gait: fr() });
        lines.push({ pts, sAt: sA, rows });
        await ctx.yield();
      }
      return addFiles(ctx, hero, { lines, siftLen: 12, lift: 0.05, duration: DUR, eye: (u, out) => path.pointAt(u, out) });
    })();
    await ctx.yield();

    const scene = new THREE.Scene();
    const fogCol = C(look.fog), veilCol = C(look.veil), coolCol = C(PALETTE[6]).multiplyScalar(0.85);
    scene.fog = new THREE.Fog(fogCol.clone(), look.fogNear, look.fogFar);
    scene.background = fogCol.clone();
    scene.add(hero.object);
    const mat = (vs, fs, uni = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...uni }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
    const uPx = { value: 500 }, uLeg = { value: new THREE.Vector4(X_BEND, Z0, DX, DZ) }, uFur = { value: new THREE.Vector3(-1e4, A_FOOT - 7, A_S) };

    // ----- sky -----
    const skyU = {
      uSkyH: { value: C(look.skyH) }, uSkyA: { value: C(look.skyA) }, uStops: { value: new THREE.Vector4(...look.stops) }, uBand: { value: new THREE.Vector3(...look.band) }, uSkyM: { value: C(look.skyM) }, uSkyZ: { value: C(look.skyZ) }, uLip: { value: C(look.lip) }, uWipe: { value: C(look.wipe) },
      uSunC: { value: new THREE.Vector3(...look.sunC) }, uSunDir: { value: sunDir }, uVeilCol: { value: veilCol }, uHaze: { value: coolCol }, uHazeK: { value: 0 },
      uTime: U.uTime, uVeil: { value: 0 }, uNight: { value: look.night }, uSeed: { value: rng.range(0, 20) }, uStill: { value: still ? 1 : 0 },
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

    // ----- the floor -----
    const PAN = [-340, 240, 200, 265];
    const inPan = (x, z, k = 1) => ((x - PAN[0]) / PAN[2]) ** 2 + ((z - PAN[1]) / PAN[3]) ** 2 < k;
    const fp = hero.anchors.footprint, adder = [rng.range(52, 66) - 26, Z0 - rng.range(13, 16) + 6.5, Math.PI + rng.range(0.5, 0.75)];
    const floorU = { uRect: { value: new THREE.Vector4(fp.min[0] + 0.2, fp.min[1] + 0.2, fp.max[0] - 0.2, fp.max[1] - 0.2) }, uPan: { value: new THREE.Vector4(...PAN) },
      uHead: { value: new THREE.Vector3(X_IN, 0, 1) }, uShDir: { value: new THREE.Vector2(shV[0] / shLen, shV[1] / shLen) }, uAdder: { value: new THREE.Vector4(adder[0], adder[1], adder[2], 0) }, uStill: skyU.uStill };
    // (cut into 250 m squares: as two triangles 20 km across, the software renderer's depth for the floor was wrong at some camera
    // positions, and the floor then hid the grass, the tracks and the shadows lying on it)
    const floorGeo = new THREE.PlaneGeometry(20000, 20000, 80, 80); floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, mat(FLOOR_VERT, FLOOR_FRAG, floorU)); floor.frustumCulled = false; scene.add(floor);

    // ----- standing sand: the Great Dune, the furrow's ridges, the far linear dunes, welwitschia -----
    const sand = makeSandMesh(), smokeAt = [];
    const gridN = async (nu, nv, kind, fn) => {      // positions first, then normals from the grid itself
      const V = []; for (let j = 0; j <= nv; j++) { for (let i = 0; i <= nu; i++) V.push(fn(i, j)); if ((j & 3) === 3 || nu > 200) await ctx.yield(); }
      const at = (i, j) => V[Math.min(nv, Math.max(0, j)) * (nu + 1) + Math.min(nu, Math.max(0, i))];
      const nrm = (i, j, k) => {          // k: which entry holds the height (1, or 5 for the surface before the stroke cut it)
        const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1);
        const ux = b[0] - a[0], uy = b[k] - a[k], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[k] - c[k], vz = d[2] - c[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, sg = ny < 0 ? -1 : 1;
        return [sg * nx / l, sg * ny / l, sg * nz / l];
      };
      await sand.grid(nu, nv, kind, (i, j) => {
        const v = at(i, j), n = nrm(i, j, 1);
        if (v.length > 5) { const m = nrm(i, j, 5); return [v[0], v[1], v[2], n[0], n[1], n[2], v[3], v[4], v[5] - v[1], v[6], m[0], m[1], m[2], v[7], v[8], v[9], v[10]]; }
        return [v[0], v[1], v[2], n[0], n[1], n[2], v[3], v[4]];
      }, false, () => ctx.yield());
    };
    {   // the Great Dune: rows follow the crest and the foot. The strip our trench runs in (|b| < 22) is a mesh of its own,
        // so here those columns are sunk out of sight beneath it.
      const cols = [0, 21.5, 22]; let b = 22, step = 2.43;
      while (b < bS + 760) { step = Math.min(step * 1.22, b < bS + 150 ? 12 : 34); b += step; cols.push(b); }
      const neg = [-21.5, -22]; b = 22; step = 2.43; while (b < 350) { step = Math.min(step * 1.22, 22); b += step; neg.push(-b); }
      const bs = neg.reverse().concat(cols), JW = 60, JL = 22;
      const rowAt = (bb, j, out) => {          // where row j of the dune's grid crosses the line b = bb, and its height there
        const A = acB(bb); let a, y;
        if (j <= JW) { const tau = 1.06 * Math.pow(1 - j / JW, 1.2); a = A - wWind(bb) * tau; y = tau > 1 ? -0.5 * (tau - 1) / 0.06 : H0(a, bb); }
        else { const sg = 1.06 * (j - JW) / JL; a = A + wLee(bb) * sg; y = sg > 1 ? -0.5 : H0(a, bb); }
        if (hcB(bb) < 0.3) y = Math.min(y, -0.3);
        out[0] = a; out[1] = y; return out;
      };
      const _ro = [0, 0];
      await gridN(bs.length - 1, JW + JL, 0, (i, j) => {
        const bb = bs[i], A = acB(bb), hc = hcB(bb); rowAt(bb, j, _ro); const a = _ro[0]; let y = _ro[1];
        if (Math.abs(bb) < 21.9 && a > A_FOOT - 2 && a < A_S + 13) y -= 9;
        const w = toW(a, bb), sp = spur(a, bb);
        const onSpur = a < A && sp[2] > 2 && Math.abs(sp[1]) < 40;
        return [w[0], y, w[1], onSpur ? Math.abs(sp[1]) : A - a, onSpur ? 20 : hc];
      });
      await ctx.yield();
      // the trench strip: 0.75 m rows, half-metre columns across the walls
      const rows = []; for (let a = A_FOOT - 3; a < 200; a += 1.5) rows.push(a); for (let a = 200; a <= A_S + 14.01; a += 0.75) rows.push(a);
      const half = [0, 0.8]; for (let q = 1.5; q <= 12.01; q += 0.5) half.push(q); for (let q = 12.75; q <= 18.01; q += 0.75) half.push(q); half.push(19.2, 20.5, 22, 22.6);
      const sb = half.slice(1).reverse().map((q) => -q).concat(half);
      // (its outer edges follow the dune grid's own edge along b = +-22 exactly, so no seam shows on the arm)
      const seam = [-22, 22].map((bb) => { const A = [], Y = []; for (let j = 0; j <= JW + JL; j++) { rowAt(bb, j, _ro); A.push(_ro[0]); Y.push(_ro[1]); } return { A, Y }; });
      const seamY = (sm, a) => { const A = sm.A; let k = 0; while (k < A.length - 2 && A[k + 1] < a) k++; return lerp(sm.Y[k], sm.Y[k + 1], Math.min(1, Math.max(0, (a - A[k]) / (A[k + 1] - A[k])))); };
      await gridN(sb.length - 1, rows.length - 1, 1, (i, j) => {
        const a = rows[j], edge = Math.abs(sb[i]) > 21.9, skirt = Math.abs(sb[i]) > 22.3, bb = skirt ? Math.sign(sb[i]) * 22 : sb[i];
        let y = HG(a, bb, TR), yu = HU(a, bb);
        if (edge) { y = yu = seamY(seam[bb < 0 ? 0 : 1], a) - (skirt ? 0.4 : 0); } else if (H0(a, bb) <= 0.002) { y = -0.4; yu = -0.4; }
        const w = toW(a, sb[i]);
        return [w[0], y, w[1], acB(bb) - a, hcB(bb), yu, cutAt(a), TR.sd, TR.th, TR.rim, TR.bump];
      });
      for (let k = 0; k < 520; k++) { const bb = rng.range(-240, bS + 520), w = toW(acB(bb), bb), h = hcB(bb); if (h > 10 && Math.abs(bb) > 14) smokeAt.push([w[0], h - 0.2, w[1], Math.min(1, 0.45 + h / 200)]); }
    }
    await ctx.yield();
    const WEL_X = 177.5;
    {   // the ridges our stroke heaps up either side of the furrow: a steep slumping face toward us, a ragged crest, a long skirt
      const lat = [3.7, 4.05, 4.4, 4.8, 5.2, 5.55, 5.8, 6.0, 6.4, 7.0, 7.9, 9.0, 10.4, 12.4];
      const prof = [-0.15, 0.1, 0.34, 0.6, 0.82, 0.95, 1.0, 0.92, 0.77, 0.6, 0.4, 0.22, 0.08, -0.25];
      const KC = 6, nz = ctx.noise;
      for (const side of [-1, 1]) {
        const ph = rng.range(0, 50);
        await gridN(464, 13, -1, (i, k) => {
          const x = 352 - i * 0.75, d = X_IN - x;
          let env = 1.6 * (side > 0 ? 1 - sstep(122, 148, d) : 1 - sstep(150, 240, d))      /* the left ridge ends where the ostriches break out */
             * (0.72 + 0.5 * (0.5 + 0.5 * Math.sin(x * 0.11 + ph) * Math.sin(x * 0.037 + ph * 1.7)));
          const hb = side < 0 ? sstep(HEAP_X - 14, HEAP_X - 8, x) * (1 - sstep(HEAP_X + 7, HEAP_X + 13, x)) : 0;      // the heap the gemsbok stand on
          env = lerp(env, HEAP_H, hb);
          if (side < 0) env *= (1 - 0.75 * sstep(220, 232, x) * (1 - sstep(268, 280, x))) * (1 - 0.8 * sstep(WEL_X - 13, WEL_X - 6, x) * (1 - sstep(WEL_X + 6, WEL_X + 13, x)));
          const wob = lerp(0.45 * Math.sin(x * 0.09 + ph * 0.6) + 0.25 * Math.sin(x * 0.31 + ph), HEAP_LAT - 5.8, hb);
          const n1 = nz.n2(x * 0.9 + ph, side * 3.1), n2 = nz.n2(x * 2.7 + ph, side * 7.7), n3 = nz.n2(x * 0.33 + ph, side * 11.3);
          const near = Math.exp(-((k - KC) * (k - KC)) / 6), inner = k < KC ? 1 : 0;
          const scal = Math.pow(Math.max(0, Math.sin(x * 1.35 + ph + 1.5 * n3)), 2);          // slump alcoves on the furrow side
          let h = prof[k] < 0 ? prof[k] : prof[k] * env * (1 + (0.22 * n1 + 0.12 * n2) * near * (1 - hb)) * (1 - 0.32 * scal * inner * (1 - Math.abs(k - 3) / 4)) + 0.02;
          h -= 0.4 * (1 - sstep(0.02, 0.3, env));
          const l = lat[k] + wob + 0.22 * n2 * near * (1 - hb) - (inner ? 0.3 * scal * (1 - k / KC) : 0) + (k === 13 ? 1.2 * n1 : k >= 11 ? 0.6 * n1 : 0);
          return [x, h, Z0 + side * l, lat[k] - lat[KC], env * 2.6];
        });
      }
    }
    await ctx.yield();
    const farDunes = [];
    {   // linear dunes walling the interdune flat, and more behind the Great Dune
      const defs = [[330, 640, 0.05, 1000, 95], [-560, 720, -0.08, 1100, 120], [-1500, 650, 0.1, 1000, 100], [380, -560, -0.04, 900, 85], [-520, -640, 0.07, 1100, 110], [-1450, -560, -0.1, 1000, 95],
        [-2300, 380, 1.35, 1400, 150], [-2900, -500, 1.2, 1500, 170], [1300, 60, 1.5, 1200, 110]];
      for (const df of defs) {
        const cx = df[0] + rng.range(-70, 70), cz = df[1] + rng.range(-50, 50), ang = df[2] + rng.range(-0.06, 0.06), len = df[3] * rng.range(0.9, 1.1), hm = df[4] * rng.range(0.85, 1.15);
        const ph = rng.range(0, 6.28), wob = rng.range(30, 70), ca = Math.cos(ang), sa = Math.sin(ang), wind = cz > 0 || Math.abs(ang) > 0.8 ? -1 : 1;
        const taus = [1.06, 1, 0.78, 0.56, 0.36, 0.19, 0.07, 0, -0.25, -0.5, -0.75, -1, -1.06];
        farDunes.push({ cx, cz });
        await gridN(44, 12, 0, (i, j) => {
          const l = (i / 44 - 0.5) * len, e = Math.max(0, 1 - Math.pow(Math.abs(2 * l / len), 2.4));
          const hc = hm * Math.pow(e, 0.8) * (0.78 + 0.22 * Math.sin(l * 0.011 + ph * 2)), cr = wob * Math.sin((l / len) * 6.283 + ph), t = taus[j];
          const c = cr + wind * (t >= 0 ? t * (50 + 1.9 * hc) : t * (20 + 1.5 * hc));
          const y = Math.abs(t) > 1 || hc < 0.5 ? -1.5 : hc * (t >= 0 ? Math.pow(1 - t, 1.3) : Math.pow(1 + t, 1.25));
          if (j === 7 && i % 2 === 0 && hc > 25 && !still) smokeAt.push([cx + l * ca - cr * sa, hc, cz + l * sa + cr * ca, 1.6]);
          return [cx + l * ca - c * sa, y, cz + l * sa + c * ca, t * (50 + 1.9 * hc), hc];
        });
      }
    }
    {   // welwitschia: three at the furrow's start, and one old giant in a gap of the right-hand ridge
      // (each of the two leaves is frayed into narrow ribbons; the extra ribbons draw from a generator of their own, so the
      // world's own sequence of random draws stays as it was)
      const wrng = ctx.core.makeRng(ctx.core.hashSeed('namib-welwitschia:' + ctx.seed));
      const welw = async (wx, wz, sc, nRib0, an = rng.range(0, Math.PI)) => {
        const nRib = nRib0 * 2 - 1, big = sc > 1;
        // The old giant is a low sprawl: each of its two leaves is split into five separate ribbons that fan out with glass between
        // them, arch a hand's breadth off the sand, narrow toward the tip, and are torn at the end into tails that lie on the sand.
        // (three vertices across, so the shader can thin each ribbon to a film at its edges)
        const bigRib = (dirS, fr, ln, kink, curl, t0, t1, w0, w1, dv, drop) => gridN(12, 2, 2, (i, j) => {
          const tt = i / 12, t = lerp(t0, t1, tt), a2 = an + fr * (0.4 + 0.6 * t) + kink * t * t + dv * (t - t0), r = 0.25 * sc + ln * t;
          const wd = lerp(w0, w1, Math.pow(tt, 0.8)) * (1 + 0.25 * Math.sin(t * 17 + fr * 9)) * (j - 1);
          const arch = 0.1 + 0.55 * sc * Math.sin(Math.min(t * 3.2, Math.PI * 0.5)) * (1 - 0.86 * sstep(0.25, 0.95, t)) + 0.35 * curl * t * t * t;
          const y = lerp(arch, 0.07, drop * sstep(0, 0.6, tt)) + (j === 1 ? 0.05 : 0);
          return [wx + dirS * (Math.cos(a2) * r - Math.sin(a2) * wd), y, wz + dirS * (Math.sin(a2) * r + Math.cos(a2) * wd), j - 1, 0.5 * t * t];
        });
        for (const dirS of [-1, 1]) {
          const mains = [];
          for (let s = 0; s < nRib; s++) {
            const rg = s < nRib0 ? rng : wrng;
            const fr = (s - (nRib - 1) / 2) * (0.9 / (nRib - 1)) + rg.range(-0.1, 0.1), ln = rg.range(2.2, 2.8) * sc * (s < nRib0 ? 1 : 0.8), kink = rg.range(-0.5, 0.5), curl = rg.range(0, 0.5) * (sc - 1) + (s < nRib0 ? 0 : wrng.range(0, 0.5));
            if (!big) {
              await gridN(8, 1, 2, (i, j) => {
                const t = i / 8, a2 = an + fr * t * 0.8 + kink * t * t, r = 0.15 * sc + ln * t, wdt = (0.105 - 0.07 * t) * sc * (j ? 1 : -1);
                const y = 0.28 * sc + 0.75 * sc * Math.sin(Math.min(t * 3.2, Math.PI * 0.5)) * (1 - 0.82 * sstep(0.25, 1, t)) + curl * t * t * t;
                return [wx + dirS * (Math.cos(a2) * r - Math.sin(a2) * (wdt + fr * 0.3 * sc)), y + (j ? 0.04 : 0), wz + dirS * (Math.sin(a2) * r + Math.cos(a2) * (wdt + fr * 0.3 * sc)), 0, 1.4 * t * t];
              });
            } else if (s < nRib0) {
              const m = { fr: (s - (nRib0 - 1) / 2) * 0.34 + 2 * (fr - (s - (nRib - 1) / 2) * (0.9 / (nRib - 1))), ln, kink: kink * 0.7, curl };
              mains.push(m); await bigRib(dirS, m.fr, m.ln, m.kink, m.curl, 0, 1, 0.19 * sc, 0.075, 0, 0);
            }
          }
          if (big) for (const m of mains) for (let q = 0; q < 3; q++) {      // the torn tails: two or three to a ribbon
            if (q === 2 && wrng() < 0.5) continue;
            await bigRib(dirS, m.fr, m.ln, m.kink, m.curl, wrng.range(0.55, 0.78), wrng.range(1.05, 1.3), 0.06, 0.02, (q - 1) * wrng.range(0.35, 0.8) + wrng.range(-0.15, 0.15), 1);
          }
        }
      };
      for (let k = 0; k < 3; k++) await welw(268 - k * 15 + rng.range(-3, 3), Z0 - rng.range(10.5, 13.5), 1, 3);
      await welw(WEL_X, Z0 - 8.8, 1.7, 5, rng.range(-0.3, 0.3));
    }
    await ctx.yield();
    // the herd's line where it leaves our furrow and goes out over the arm, for the tracks it scratches there: (a, b, metres along its line)
    const herdHT = [];
    { let s0 = 0; for (; s0 < 900; s0 += 3) { hero.herdPoint(0, _p, s0 - lead(0)); if (toAB(_p.x, _p.z)[0] > 224) break; }
      for (let k = 0; k < 17; k++) { const sk = s0 + k * 9.5; hero.herdPoint(0, _p, sk - lead(0)); const ab = toAB(_p.x, _p.z); herdHT.push(new THREE.Vector3(ab[0], ab[1], sk)); } }
    const uHerdS = { value: 0 };
    const sandMat = mat(DUNE_VERT, DUNE_FRAG, { uLeg, uFur, uStill: skyU.uStill, uHerdS, uHT: { value: herdHT } }, { side: THREE.DoubleSide });
    const sandGeo = sand.build(); await ctx.yield();
    const sandMesh = new THREE.Mesh(sandGeo, sandMat); sandMesh.frustumCulled = false; scene.add(sandMesh);
    await ctx.yield();

    // ----- ninety dead camel-thorns on the pan, each one drizzled line, each with its shadow drawn in sand -----
    const tr = rng.fork('trees'), treeBuf = { P: [], N: [], R: [], T: [], I: [], S: [], sh: shV }, trees = [];
    const okTree = (x, z, minPath) => {
      if (!inPan(x, z, 0.86)) return false;
      const ab = toAB(x, z); if (H0(ab[0], ab[1]) > 0 || H0(ab[0] + 3, ab[1]) > 0 || ab[0] > 200) return false;
      if (x > fp.min[0] - 14 && x < fp.max[0] + 14 && z > fp.min[1] - 14 && z < fp.max[1] + 14) return false;
      const tn = trackNear(x, z); if ((tn.lat > -8.5 && tn.lat < 13.5) || path.nearestXZ(x, z).dist < minPath) return false;
      for (const t of trees) if ((t.x - x) ** 2 + (t.z - z) ** 2 < 64) return false;
      return true;
    };
    const offPath = (d, right) => { path.posAtDist(d, _p); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1; return [_p.x - right * _t.z / l, _p.z + right * _t.x / l]; };
    {   // one old tree the herd swings round, 10.6 m to our right, and a row along the far edge of the herd's lane
      const w = offPath(604 + DS, 12.3); trees.push({ x: w[0], z: w[1], h: 9.6, near: true, big: true });
      for (let i = 0; i < 11; i++) for (let tries = 0; tries < 60; tries++) {
        const c = offPath(468 + DS + i * 18.5 + tr.range(-5, 5), tr.range(19, 36)), tn = trackNear(c[0], c[1]);
        if (tn.lat < -8.8 && tn.lat > -17 && okTree(c[0], c[1], 14)) { trees.push({ x: c[0], z: c[1], h: tr.range(5.6, 7.2), near: true, row: true }); break; }
      }
    }
    await ctx.yield();
    for (let tries = 0; trees.length < 34 && tries < 4000; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const d = tr.range(452 + DS, 672 + DS), h = tr.range(3.6, 7), left = tr.chance(0.75) ? 1 : -1, lt = left > 0 ? tr.range(8.5, 34) + 0.45 * h : tr.range(31, 60);
      path.posAtDist(d, _p); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1, x = _p.x + left * lt * _t.z / l, z = _p.z - left * lt * _t.x / l;
      if (okTree(x, z, 8 + 0.45 * h)) trees.push({ x, z, h, near: true });
    }
    for (let tries = 0; trees.length < 64 && tries < 9000; tries++) {      // both edges of the herd's own lane: it threads these
      if ((tries & 63) === 63) await ctx.yield();
      const x = tr.range(-520, -150), z = tr.range(40, 330), tn = trackNear(x, z);
      if (((tn.lat < -8.5 && tn.lat > -30) || (tn.lat > 13.5 && tn.lat < 30)) && tn.s > 50 && okTree(x, z, 9)) trees.push({ x, z, h: tr.range(3.4, 6.2), near: trees.length < 50 });
    }
    for (let tries = 0; trees.length < 78 && tries < 9000; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const x = tr.range(-545, -140), z = tr.range(60, 380), h = tr.range(3, 7);
      if (path.nearestXZ(x, z).dist < 115 && okTree(x, z, 28)) trees.push({ x, z, h, near: false });
    }
    for (let tries = 0; trees.length < 90 && tries < 9000; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const x = tr.range(-545, -140), z = tr.range(-20, 500), h = tr.range(3, 7);
      if (okTree(x, z, 30)) trees.push({ x, z, h, near: false });
    }
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i], g = growTree(treeBuf, tr, t.x, t.z, t.h, t.near, i); t.top = g.top; t.skel = g.skel; t.seed = g.seed;
      if ((i & 7) === 7) await ctx.yield();
    }
    await ctx.yield();
    await ctx.yield();
    const treeGeo = new THREE.BufferGeometry();
    treeGeo.setAttribute('position', new THREE.Float32BufferAttribute(treeBuf.P, 3)); treeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(treeBuf.N, 3));
    treeGeo.setAttribute('aRad', new THREE.Float32BufferAttribute(treeBuf.R, 3)); treeGeo.setAttribute('aT', new THREE.Float32BufferAttribute(treeBuf.T, 3)); treeGeo.setAttribute('aS', new THREE.Float32BufferAttribute(treeBuf.S, 2));
    treeGeo.setIndex(treeBuf.I); treeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(PAN[0], 0, PAN[1]), 500);
    const treeU = { uPx, uCur: { value: -1 }, uCurK: { value: 2 }, uRare: { value: -1 }, uShadow: { value: new THREE.Vector3(shV[0], shV[1], 0) } };
    const treeMesh = new THREE.Mesh(treeGeo, mat(TREE_VERT, TREE_FRAG, treeU, { side: THREE.DoubleSide }));
    const shadowMesh = new THREE.Mesh(treeGeo, mat(TREE_VERT, TREE_FRAG, treeU, { side: THREE.DoubleSide, defines: { SHADOW: 1 }, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 }));
    scene.add(treeMesh, shadowMesh);
    await ctx.yield();

    // ----- dune grass on the flat, the arcs it scribes, and the !nara hummocks -----
    const OST_LAT = 7, OST_A = 142, OST_B = 170;      // the ostriches' lane, and where along the road they swing out to it
    // (mirrors of the floor shader: the four finger lanes, the smear the ostriches run along, the adder's ladder)
    const onLanes = (x, lat) => x > -95 && x < 90 && Math.abs(lat - (3.4 + 1.6 * Math.sin(x * 0.023 + 0.7) + 0.4 * Math.sin(x * 0.09 + 2))) < 5.5;
    const inSmear = (x, lat) => ((x - 42) / 74) ** 2 + ((lat - 19) / 12.5) ** 2 < 1;
    const onLadder = (x, z) => { const rx = x - adder[0], rz = z - adder[1], ca = Math.cos(adder[2]), sa = Math.sin(adder[2]), aq = rx * ca + rz * sa; return aq > -1.5 && aq < 26.5 && Math.abs(rz * ca - rx * sa) < 1.7; };
    const zPathAt = (x) => { if (x > -25) return Z0; const n = path.nearestXZ(x, 190); path.pointAt(n.u, _q); return _q.z; };      // where the road runs on the first leg
    const freeGround = (x, z, grass) => {
      const lat = z - Z0;
      if (x > fp.min[0] - 8 && x < fp.max[0] + 8 && z > fp.min[1] - 8 && z < fp.max[1] + 8) return false;
      if (x > 76 && Math.abs(lat) < 13) return false;
      if (x <= 76 && path.nearestXZ(x, z).dist < (grass ? 3.6 : 14)) return false;
      if (x > -60 && x < X_IN - OST_B + 15 && lat > OST_LAT - 3 && lat < OST_LAT + 3) return false;
      if (grass && (onLanes(x, lat) || onLadder(x, z))) return false;
      if (x < -40 && trackNear(x, z).dist < (grass ? 12 : 18)) return false;
      const ab = toAB(x, z); return H0(ab[0], ab[1]) <= 0;
    };
    const gr = rng.fork('grass'), nTuft = Math.round(2600 * dens * detail * (rain ? 2.6 : 1)), iG = new Float32Array(nTuft * 4), arcs = [];
    const nNear = Math.round(520 * Math.max(detail, 0.8)), iGn = new Float32Array(nNear * 4);
    let nG = 0, nGn = 0;
    for (let tries = 0; nGn < nNear && tries < nNear * 10; tries++) {      // beside the road over the ripple fields: fuller tufts, each with its arcs
      if ((tries & 127) === 127) await ctx.yield();
      const x = gr.range(-78, 104), lat = (gr() < 0.5 ? -1 : 1) * (3.8 + Math.pow(gr(), 1.3) * 12), z = zPathAt(x) + lat;
      if (!freeGround(x, z, true) || (inSmear(x, z - Z0) && gr() < 0.7)) continue;
      const sc = gr.range(0.6, 1.25) * (rain ? 0.9 : 1), sd = gr();
      iGn.set([x, z, sc, sd], nGn * 4); nGn++; arcs.push(x, z, sc, sd);
    }
    await ctx.yield();
    for (let tries = 0; nG < nTuft && tries < nTuft * 8; tries++) {
      if ((tries & 255) === 255) await ctx.yield();
      const x = gr.range(-150, 335), lat = (gr() < 0.5 ? -1 : 1) * (3 + Math.pow(gr(), 1.7) * 100), z = (x < 60 ? zPathAt(x) : Z0) + lat;
      if (!freeGround(x, z, true) || (inPan(x, z, 1.02) && gr() < 0.93) || (inSmear(x, z - Z0) && gr() < 0.75)) continue;
      const sc = gr.range(0.45, 1.1) * (rain ? 0.85 : 1), sd = gr();
      iG.set([x, z, sc, sd], nG * 4); nG++;
      if (Math.abs(lat) < 50 && arcs.length < 5600 && gr() < 0.6) arcs.push(x, z, sc, sd);
    }
    const grassMat = mat(GRASS_VERT, GRASS_FRAG, { uPx, uWindK: { value: still ? 0.35 : 1 } }, { side: THREE.DoubleSide });
    const grassMesh = new THREE.Mesh(instancedGeo(buildGrassGeometry(4), { iG: iG.subarray(0, nG * 4) }, nG), grassMat);
    grassMesh.frustumCulled = false; scene.add(grassMesh);
    const nearGrass = new THREE.Mesh(instancedGeo(buildGrassGeometry(11), { iG: iGn.subarray(0, nGn * 4) }, nGn), grassMat);
    nearGrass.frustumCulled = false; scene.add(nearGrass);
    const arcMesh = new THREE.Mesh(instancedGeo(quadGeo(), { iG: new Float32Array(arcs) }, arcs.length / 4), mat(ARC_VERT, ARC_FRAG, {}, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 }));
    arcMesh.frustumCulled = false; arcMesh.renderOrder = 1; scene.add(arcMesh);
    {
      const nm = makeSandMesh(), nr = rng.fork('nara'), NS = 12, NR = 6;
      nm.grid(NS, NR, 0, (i, j) => {
        const th = (i / NS) * Math.PI * 2, rr = j / NR, R = 2.3 * (1 + 0.9 * Math.max(0, -Math.cos(th))) * (1 + 0.12 * Math.sin(3 * th + 1)), r = R * rr;
        const k = rr * 1.3, l = Math.hypot(k, 1);
        return [Math.cos(th) * r, rr >= 1 ? -0.15 : 1.9 * Math.pow(1 - rr * rr, 1.1), Math.sin(th) * r * 0.8, Math.cos(th) * k / l, 1 / l, Math.sin(th) * k / l, (1 - rr) * R, 0.5];
      });
      for (let k = 0; k < 13; k++) {     // the thorny tangle: crooked arcs of drizzled line over the mound
        const t0 = nr.range(0, 6.28), t1 = t0 + nr.range(1.2, 3.4), q0 = nr.range(0.25, 1.0), q1 = nr.range(0.25, 1.0), lift = nr.range(0.5, 1.1), kx = nr.range(-0.4, 0.4);
        nm.grid(6, 1, 2, (i, j) => {
          const t = i / 6, th = lerp(t0, t1, t), q = lerp(q0, q1, t), x = Math.cos(th) * 1.7 * q + kx * Math.sin(t * 9), z = Math.sin(th) * 1.4 * q;
          const y = 1.9 * Math.pow(Math.max(0, 1 - 0.3 * q * q), 1.1) * (1 - 0.5 * q) + lift * Math.sin(Math.PI * t) + (j ? 0.13 : 0) - 0.1;
          return [x, y, z, Math.sin(th), 0.2, -Math.cos(th), 0, 0.5];
        });
      }
      const nN = 40, nara = new THREE.InstancedMesh(nm.build(), sandMat, nN), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
      let placed = 0;
      for (const q of [[45, -10.8, 1.0, 0.25], [14, 22, 1.15, -0.3]]) {      // one beside the road past the furrow's end, one out on the smear behind the ostriches
        m4.compose(ps.set(q[0], 0, Z0 + q[1]), qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), q[3]), sc.set(q[2], q[2], q[2])); nara.setMatrixAt(placed++, m4);
      }
      for (let tries = 0; placed < nN && tries < 4000; tries++) {
        if ((tries & 63) === 63) await ctx.yield();
        const x = nr.range(-135, 330), lat = (nr() < 0.5 ? -1 : 1) * nr.range(22, 120), z = Z0 + lat;
        if (!freeGround(x, z, false) || inPan(x, z, 1.06) || ((x - 45) ** 2 + (lat + 10.8) ** 2 < 150) || ((x - 14) ** 2 + (lat - 22) ** 2 < 150)) continue;
        const s = nr.range(0.7, 1.25);
        m4.compose(ps.set(x, 0, z), qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), nr.range(-0.45, 0.45)), sc.set(s, s * nr.range(0.85, 1.15), s)); nara.setMatrixAt(placed++, m4);
      }
      nara.count = placed; nara.instanceMatrix.needsUpdate = true; nara.frustumCulled = false; scene.add(nara);
    }
    await ctx.yield();

    // ----- ostriches sprinting on our left, and the sandgrouse on their morning flight -----
    await ctx.yield();
    const or = rng.fork('ostrich'), nO = or.int(6, 9), oA = new Float32Array(nO * 4);
    for (let i = 0; i < nO; i++) oA.set([lerp(-7.5, 7.5, (i + or.range(0.15, 0.85)) / nO), or.range(-1.5, 1.5) + (i % 2 ? 0.5 : -0.5), or.range(0.98, 1.2), or()], i * 4);      // (a tight troop; the cocks stand 2.7 m)
    const ostU = { uOstS: { value: 0 }, uPx, uOstO: { value: new THREE.Vector3(X_IN, 0, Z0) }, uOstL: { value: new THREE.Vector3(OST_A, OST_B, OST_LAT) }, uShadow: { value: new THREE.Vector3(shV[0], shV[1], 1) } };
    const ostMesh = new THREE.Mesh(instancedGeo(buildOstrichGeometry(), { iA: oA }, nO), mat(OST_VERT, OST_FRAG, ostU, { side: THREE.DoubleSide }));
    ostMesh.frustumCulled = false; scene.add(ostMesh);
    const ostShadow = new THREE.Mesh(ostMesh.geometry, mat(OST_VERT, OST_FRAG, ostU, { side: THREE.DoubleSide, defines: { SHADOW: 1 }, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 }));
    ostShadow.frustumCulled = false; scene.add(ostShadow);
    await ctx.yield();
    // The troop is flushed by our stroke: it sprints down the road just ahead of our stroke (18 m off at the start), it bolts out
    // to the left across the ridge's end 17 m off our bow (u 0.16), races us along its lane (12 m ahead at u 0.25), tires, and
    // we pass it at u 0.29. Metres down the road at each u, as a monotone curve through these knots.
    const pchip = (xs, ys) => {
      const n = xs.length, dd = [], m = new Array(n); for (let i = 0; i < n - 1; i++) dd.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      m[0] = dd[0]; m[n - 1] = dd[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = dd[i - 1] * dd[i] <= 0 ? 0 : 2 * dd[i - 1] * dd[i] / (dd[i - 1] + dd[i]);
      return (x) => {
        if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]); if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
        let i = 0; while (x > xs[i + 1]) i++;
        const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
      };
    };
    const ostD = pchip([0, 0.02, 0.08, 0.16, 0.25, 0.285, 0.34], [18, 0.02 * L + 17, 0.08 * L + 20, 0.16 * L + 17, 0.25 * L + 12, 0.285 * L + 2, 0.285 * L + 2 + 550 * 0.055]);
    const ostAt = (u, out, back = 0) => { const sO = ostD(u) - back; return out.set(X_IN - sO, 1.4, Z0 + OST_LAT * sstep(OST_A, OST_B, sO)); };
    const br = rng.fork('grouse'), nB = Math.max(40, Math.round(80 * detail)), bA = new Float32Array(nB * 4);
    for (let i = 0; i < nB; i++) { const g1 = br.gauss(), g2 = br.gauss(), g3 = br.gauss(); bA.set([g1 * 4.5, Math.max(-2.2, g2) * 0.6, g3 * 5.5, br()], i * 4); }
    const birdU = { uFlock: { value: new THREE.Vector3() }, uFlockDir: { value: new THREE.Vector3(0, 0, 1) }, uPx, uTip: { value: new THREE.Vector3(look.night ? 1.4 : 9, look.night ? 0.03 : 0.5, look.night) } };
    const birdMesh = new THREE.Mesh(instancedGeo(buildBirdGeometry(), { iA: bA }, nB), mat(BIRD_VERT, BIRD_FRAG, birdU, { side: THREE.DoubleSide }));
    birdMesh.frustumCulled = false; scene.add(birdMesh);
    await ctx.yield();

    // ----- grains in the air -----
    const sr = rng.fork('grains'), GP = [], GQ = [];
    const emit = (x, y, z, kind, q1, q2, size) => { GP.push(x, y, z, sr() * 100); GQ.push(kind, q1, q2, size); };
    const nBow = Math.round(1500 * detail); for (let i = 0; i < nBow; i++) emit(i % 2 ? 1 : -1, 0, 0, 0, 0, 0, sr.range(0.5, 1.3));
    const smokeK = (still ? 0.3 : 1) * detail;
    for (const s of smokeAt) { const n = sr() < smokeK ? 1 : 0; for (let k = 0; k < n; k++) { const life = sr.range(3, 6.5); emit(s[0], s[1], s[2], 1, 1 / life, life, sr.range(5, 12) * s[3]); } }
    for (let i = 0; i < 950; i++) { const a = A_S + sr.range(-2, 8), b = sr.range(13, 33), w = toW(a, b); emit(w[0], H0(a, b) + sr.range(0, 2), w[1], 2, 0, 0, sr.range(1.1, 2.6)); }
    const nPour = Math.round(2800 * detail);
    for (let i = 0; i < nPour; i++) {          // grains running down the trench walls, from anywhere on the upper wall to the toe
      // (each falls down the heart of a chute: the same layout the trench was scalloped with)
      const side = sr() < 0.5 ? -1 : 1, sgn = side < 0 ? 7 : 0, ck = Math.floor(sr.range(206, A_S + 3) / 5.6 + sgn * 0.37), q = sr.range(0.35, 1), sz = sr.range(0.8, 1.6);
      const a = (ck + 0.5 + 0.28 * Math.sin(ck * 12.9898 + sgn) - sgn * 0.37) * 5.6 + 0.11 * sr.gauss();
      if ((i & 255) === 255) await ctx.yield();
      if (side < 0 && a > A_S - 92 && a < A_S - 6 && q > 0.6) continue;                 // (never between us and the sentinels on the right rim)
      HG(a, side, TR); const toeB = 1 - TR.sd, b = side * lerp(toeB, 1 - TR.rim, q), y = HG(a, b, TR), w = toW(a, b);
      if (TR.th < 0.5 || a < 204 || a > A_S + 4) continue;
      emit(w[0], y, w[1], 3, side * (Math.abs(b) - toeB) * 0.95, TR.th * 0.95, sz);
    }
    await ctx.yield();
    const WIND = new THREE.Vector3(DX, 0, DZ).lerp(new THREE.Vector3(-1, 0, 0), 0.5).normalize();
    {   // skeins streaming up the arm either side of the furrow, and more smoke on the crest round the notch
      const wa = WIND.x * DX + WIND.z * DZ, wb = WIND.x * LX + WIND.z * LZ, nSk = Math.round((still ? 600 : 2000) * detail);
      for (let i = 0; i < nSk; i++) {
        const a = sr.range(134, 252), b = (sr() < 0.5 ? -1 : 1) * (9 + 75 * Math.pow(sr(), 1.6)), w = toW(a, b), y = HU(a, b);
        if ((i & 255) === 255) await ctx.yield();
        if (y < 0.3) continue;
        emit(w[0], y + 0.3, w[1], 8, (H0(a + 14 * wa, b + 14 * wb) - H0(a, b)) / 14, sr.range(2, 3.6), sr.range(0.4, 0.95));
      }
      // streamers off the knife crest, from the notch round past the summit: what we turn to look at from the arm
      const nSt = Math.round((still ? 200 : 700) * detail);
      for (let i = 0; i < nSt; i++) {
        if ((i & 255) === 255) await ctx.yield();
        const bb = 70 + 650 * Math.pow(sr(), 1.15), w = toW(acB(bb), bb), h = hcB(bb);
        emit(w[0], h - 0.3, w[1], 10, 0, sr.range(2.6, 4.6), (1.4 + 0.011 * Math.hypot(acB(bb) - 180, bb + 20)) * sr.range(0.7, 1.4));
      }
      const nCs = Math.round((still ? 60 : 280) * detail);
      for (let i = 0; i < nCs; i++) { const bb = (sr() < 0.5 ? -1 : 1) * sr.range(15, 150), w = toW(acB(bb), bb), life = sr.range(3, 6.5); emit(w[0], hcB(bb) - 0.2, w[1], 1, 1 / life, life, sr.range(7, 15)); }
    }
    const nLoose = Math.round(900 * detail); for (let i = 0; i < nLoose; i++) emit(sr(), sr(), sr(), 4, 0, 0, sr.range(0.035, 0.075));
    for (let i = 0; i < 240; i++) {
      const d = sr.range(120, 700), lt = (sr() < 0.5 ? -1 : 1) * sr.range(16, 95); path.posAtDist(d, _p); path.tangentAtDist(d, _t);
      const l = Math.hypot(_t.x, _t.z) || 1; emit(_p.x + lt * _t.z / l, 0.3, _p.z - lt * _t.x / l, 5, sr.range(7, 15), sr.range(0, 6.28), sr.range(1.2, 2.6));
    }
    if (rare) for (let i = 0; i < trees.length; i++) {      // every tree's streamer and its falling thread; the old tree and the row beyond the herd get the most
      const t = trees[i], n = Math.round((t.big ? 240 : t.row ? 120 : t.near ? 18 : 7) * detail), nT = Math.round((t.big ? 64 : t.row ? 28 : t.near ? 6 : 3) * Math.max(detail, 0.7));
      for (let k = 0; k < n && t.skel.length; k++) { const q = t.skel[Math.floor(sr() * t.skel.length)]; emit(q.x, q.y, q.z, 6, 1 - q.y / Math.max(t.top, 0.5), sr(), (t.big ? 0.55 : t.row ? 0.45 : 0.4) * sr.range(0.7, 1.3)); }
      for (let k = 0; k < nT; k++) emit(t.x, t.top, t.z, 9, t.seed * 0.14, t.h * 0.22, t.near ? sr.range(0.11, 0.2) : sr.range(0.2, 0.3));
      if ((i & 15) === 15) await ctx.yield();
    }
    for (let i = 0; i < 26; i++) emit(0, 0, 0, 7, 0, 0, 0.2);
    const grainU = {
      uHeadP: { value: new THREE.Vector3() }, uHeadT: { value: new THREE.Vector3(-1, 0, 0) }, uCamP: { value: new THREE.Vector3() }, uWind: { value: WIND },
      uLeg, uFur, uThread: { value: new THREE.Vector4() }, uHeadV: { value: VC }, uBow: { value: 1 }, uBowS: { value: 1 }, uPlume: { value: 0 }, uSmoke: { value: 1 }, uRareT: { value: -10 }, uRareK: { value: -1 }, uCap: { value: 0.3 }, uCurt: { value: look.night ? 0.35 : 1 },
    };
    await ctx.yield();
    const grains = new THREE.Mesh(instancedGeo(quadGeo(), { iP: new Float32Array(GP), iQ: new Float32Array(GQ) }, GP.length / 4), mat(GRAIN_VERT, GRAIN_FRAG, grainU, { transparent: true, depthWrite: false }));
    grains.frustumCulled = false; grains.renderOrder = 6; scene.add(grains);
    await ctx.yield();

    // ----- the flight's clockwork: everything scripted reads u, everything ambient reads time -----
    const nearTrees = trees.map((t, i) => (t.near ? i : -1)).filter((i) => i >= 0);
    const notch = toW(A_S, 0), sentMid = new THREE.Vector3(sentinels[1].pos[0], sentinels[1].pos[1] + 1.4, sentinels[1].pos[2]);
    const headDist = (u) => u * L + 9 + (L - 19 - 0.86 * L) * (0.6 * sstep(0.655, 0.725, u) + 0.4 * sstep(0.76, 0.86, u));     // the stroke head shoots ahead up the arm
    const flockAt = (u, time, out, dir) => {
      if (u < 0.5) {            // crossing the furrow ahead of us, right to left
        const k = u / 0.26; path.posAtDist(u * L + 40 - 8 * Math.min(k, 1.6) - 10 * (1 - sstep(0.02, 0.1, u)), out); path.tangentAtDist(u * L + 40, _t);
        const lt = -16 + 133 * u; out.x += lt * _t.z; out.z -= lt * _t.x; out.y = 11.5 + 0.5 * Math.sin(time * 0.7);      // against the cream sky above the Great Dune's crest
        dir.set(_t.z * 0.9 + _t.x * 0.45, 0, -_t.x * 0.9 + _t.z * 0.45);
      } else {                  // and again through the gap above the ring
        const k = (u - 0.8) / 0.2, lt = 70 - 105 * k; out.set(notch[0] + LX * lt - DX * 6, yPathA(A_S) + 10 + 5 * (1 - k) + Math.sin(time * 0.7), notch[1] + LZ * lt - DZ * 6);
        dir.set(-LX * 0.9 + DX * 0.4, 0, -LZ * 0.9 + DZ * 0.4);
      }
    };
    const ostCentre = new THREE.Vector3(), herdTgt = new THREE.Vector3(), bullTgt = new THREE.Vector3(), wipeTgt = new THREE.Vector3(), _size = new THREE.Vector2();
    const camP = new THREE.Vector3(), headP = new THREE.Vector3(), headT = new THREE.Vector3();
    const goldOut = (u) => 0.6 * sstep(0.398, 0.416, u) * (1 - sstep(0.42, 0.445, u));      // after the palm's front has left the dune
    const fogDay = (u) => lookId === 'fog' ? 1 - sstep(0.3, 0.5, u) : 0;       // Atlantic fog in the corridor, burning off by the pan
    const baseFog = fogCol.clone(), fogNow = scene.fog;

    await ctx.yield();
    const floorTab = new Float32Array(421); for (let k = 0; k <= 420; k++) floorTab[k] = Math.max(HG(k, 0), 0);
    // (slowest while the palm wipes the dune and the herd is sifted out of the settling sand; the gallop beside the herd is kept short)
    const pace = (u) => 1 + 0.08 * (1 - sstep(0.14, 0.26, u)) - 0.3 * sstep(0.285, 0.335, u) * (1 - sstep(0.425, 0.475, u)) - 0.04 * sstep(0.44, 0.48, u) * (1 - sstep(0.66, 0.74, u));
    const update = (dt, time, camera, u) => {
      u = u || 0;
      hero.setProgress(u); hero.update(dt, time, camera); uHerdS.value = lead(u);
      camera.getWorldPosition(camP); sky.position.copy(camP); grainU.uCamP.value.copy(camP);
      const hgt = ctx.renderer.getDrawingBufferSize(_size).y;
      uPx.value = 0.5 * hgt * camera.projectionMatrix.elements[5];
      // our stroke: its head, its bow wave, the furrow it cuts up the Great Dune and the plume at the notch
      const hd = headDist(u); path.posAtDist(Math.min(hd, L + 30), headP); path.tangentAtDist(Math.min(hd, L), headT);
      const habA = (headP.x - X_BEND) * DX + (headP.z - Z0) * DZ, onDune = hd > dTurn + 20, hk = Math.min(419, Math.max(0, habA)), hi = Math.floor(hk);
      if (onDune) {      // (the road swings out over the arm; the stroke runs straight on up its own scratch)
        const kOn = sstep(95, 115, habA), hb = ((headP.x - X_BEND) * LX + (headP.z - Z0) * LZ) * kOn;
        headP.x -= LX * hb; headP.z -= LZ * hb; headT.set(lerp(headT.x, DX, kOn), headT.y, lerp(headT.z, DZ, kOn)).normalize();
      }
      headP.y = onDune ? lerp(floorTab[hi], floorTab[hi + 1], hk - hi) + 0.2 : 0.1;
      grainU.uHeadP.value.copy(headP); grainU.uHeadT.value.copy(headT);
      const dCam = u * L;
      // (no bow wave on the fields or the pan: its spray would hang between us and the herd)
      const onArm = sstep(dTurn + A_FOOT - 10, dTurn + A_FOOT + 30, hd);
      grainU.uBow.value = ((1 - 0.7 * sstep(170, 230, dCam)) * (1 - sstep(230, 300, dCam)) + onArm) * (1 - sstep(L - 14, L - 4, hd));
      grainU.uBowS.value = 1 + 1.8 * onArm;
      floorU.uHead.value.set(headP.x, 0, onDune ? 0 : 1);
      uFur.value.x = onDune ? (hd >= L - 10.5 ? 1e4 : habA) : -1e4;
      grainU.uPlume.value = sstep(0.852, 0.874, u);
      // gold-out as the veil crosses us (one eased event), fog mornings, and the look's own haze
      const g = goldOut(u), fd = fogDay(u);
      fogNow.color.copy(baseFog).lerp(coolCol, 0.75 * fd).lerp(veilCol, g);
      fogNow.near = lerp(lerp(look.fogNear, 30, fd), 4, Math.min(1, g * 1.4)); fogNow.far = lerp(lerp(look.fogFar, 520, fd), 190, Math.min(1, g * 1.4));
      skyU.uVeil.value = g * 0.93; skyU.uHazeK.value = 0.85 * fd;
      // ostriches and sandgrouse
      ostU.uOstS.value = ostD(u);
      flockAt(u, time, birdU.uFlock.value, birdU.uFlockDir.value);
      // trees: one at a time thins and is drizzled again by a falling thread; on the rare visit a second palm blows all of them off
      const cyc = time / 7, ph = cyc - Math.floor(cyc), ti = nearTrees.length ? nearTrees[(Math.floor(cyc) * 7 + 3) % nearTrees.length] : -1;
      treeU.uCur.value = ti; treeU.uCurK.value = ph < 0.2 ? 1.25 * (1 - ph / 0.2) : 1.3 * (ph - 0.2) / 0.62;
      const tt = ti >= 0 ? trees[ti] : null;
      if (tt) grainU.uThread.value.set(tt.x, tt.top * Math.min(1, treeU.uCurK.value), tt.z, ph > 0.2 && ph < 0.84 ? 1 : 0);
      if (rare) {
        // blown off over u 0.585-0.60, ghosts and streamers to 0.62, then every tree drizzled again from the root, done by 0.685
        const t = (u - 0.585) * DUR, rk = t < 0 ? -1 : t < 0.7 ? 1.4 * (1 - t / 0.7) : Math.max(0, (t - 1.6) * 0.45);
        treeU.uRare.value = rk; grainU.uRareT.value = t < 0 ? -10 : t; grainU.uRareK.value = t < 1.6 ? -1 : rk;
      }
    };

    // ----- where the eye goes -----
    const aheadTgt = new THREE.Vector3(), lookA = new THREE.Vector3(), lookB = new THREE.Vector3(), lookC = new THREE.Vector3(), ridgeTgt = new THREE.Vector3(), bullLook = new THREE.Vector3(), crestW = toW(532, 327), crestTgt = new THREE.Vector3(crestW[0], 100, crestW[1]);
    // one long look to the right: first the palm's front on the dune, then the herd, then the herd on our scratch up the arm
    const GAZE_IN = 8;
    const lookRight = { from: 0.285, to: 0.86, weight: 0.68, fade: 0.13, at: (time, u) => {
        const ld = lead(u), s = Math.min(ld + 2, Math.max(ld - 64, sCam(u) + lerp(40, 15, sstep(0.36, 0.41, u)) - GAZE_IN * sstep(0.455, 0.505, u) * (1 - sstep(0.55, 0.59, u)) + 32 * sstep(0.64, 0.72, u)));
        hero.herdPoint(u, herdTgt, s - ld); hero.herdPoint(u, bullTgt, 'bull');
        herdTgt.lerp(bullTgt, 0.75 * sstep(0.55, 0.6, u) * (1 - sstep(0.66, 0.71, u)));
        path.pointAt(u, _q);
        wipeTgt.set(Math.max(-215, Math.min(U.uXf.value - 20 + 28 * sstep(0.37, 0.39, u), _q.x - 50)), 30, 30);
        herdTgt.lerp(wipeTgt, 1 - sstep(0.385, 0.412, u));
        path.posAtDist(Math.min(L, u * L + 45), aheadTgt);
        // (on the arm the look leaves the herd for the Great Dune's knife crest and the sun-print above it, then comes back to the notch)
        return herdTgt.lerp(aheadTgt, sstep(0.745, 0.80, u)).lerp(crestTgt, sstep(0.72, 0.77, u) * (1 - sstep(0.80, 0.85, u)));
      } };
    const pois = [
      // the two gemsbok on the right-hand ridge (the look goes back to the road before we draw level with them)
      { from: 0.022, to: 0.125, weight: 0.55, fade: 0.3, at: (time, u) => { path.posAtDist(u * L + 40, lookC); return ridgeTgt.copy(ridgeBull).lerp(lookC, sstep(0.078, 0.097, u)); } },
      { from: 0.105, to: 0.30, weight: 0.6, at: (time, u) => ostAt(u, ostCentre, -3) },
      lookRight,
      // (the same look once more while the palm passes: a steady camera takes a third of each, so the two together turn it far
      // enough; it eases in from straight down the road so the swing from the ostriches is no faster than it was)
      { from: 0.288, to: 0.44, weight: 0.9, fade: 0.25, at: (time, u) => {
        lookRight.at(time, u); path.pointAt(u, _q); lookA.copy(herdTgt).sub(_q).normalize();
        path.posAtDist(u * L + 24, lookB).sub(_q).normalize();
        return lookB.lerp(lookA, sstep(0.30, 0.352, u)).normalize().multiplyScalar(120).add(_q);
      } },
      // (and once more at the bull while he runs level with us, so a steady camera holds him whole inside the frame; it has let go
      // before the old tree at 0.65)
      { from: 0.54, to: 0.64, weight: 0.45, fade: 0.3, at: (time, u) => hero.herdPoint(u, bullLook, 'bull') },
      { from: 0.86, to: 0.99, weight: 0.3, at: sentMid },
    ];

    update(0, 0, { getWorldPosition: (v) => v.copy(path.start), projectionMatrix: { elements: [0, 0, 0, 0, 0, 1.66] } }, 0);
    return {
      scene, path, duration: DUR, pace, pois, update,
      title: lookId === 'night' ? 'The Desert the Wind Draws, by Night' : 'The Desert the Wind Draws',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 24, sway: 0.8, bank: 0.8 },
      portal: { shape: 'circle', radius: 8.6, color: look.portal, glow: 0.9, tilt: true, revealDistance: 300 },
      post: {
        exposure: look.exposure, bloom: { strength: 0.16, radius: 0.55, threshold: 1.3 },
        grade: { saturation: 1.06, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.03, aberration: 0 },
      },
      ride: 'none', style: 'none',
      dispose() {},
    };
  },
};
