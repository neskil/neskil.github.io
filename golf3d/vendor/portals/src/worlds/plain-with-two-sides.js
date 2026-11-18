// The Plain With Two Sides (from Don Quixote): a white road runs straight across the plain of La Mancha toward a low
// sun, and its two sides do not agree. LEFT of the road is what is there: windmills, an inn, flocks of sheep in their
// dust. RIGHT of the road, in the same places, the same poses and the same motion, is what the knight sees: many-armed
// giants, a castle with silver pinnacles, two armies under banners. The two riders are not shown.
//
// Everything is laid out in road coordinates: s = metres along the road from the entry (world z = -s), x = metres to
// the right of the road's centre line (world x). Every standing thing is placed once and stood on both sides at +x and
// -x, built by the same builder in two manners (src/parts/plain-with-two-sides.js), so a pair cannot drift apart.
// One rotation turns every sail and every arm; one wind moves all cloth, grass, dust and smoke; one sun casts every shadow.
//
// The flight (every place a number of a thing's own measures on from the one before, drawn for the visit) begins at a
// rider's eye on the left verge, five of the first pair's heights before it: mill and giant stand whole either side of
// the way ahead, the giant across the road against the sun. It passes between them along the verge, each its own height
// and reach off; crosses the road to round the next pair's giant at two of his heights; leans back across the road
// through the gap of a third pair (the gate pair), over worked land on both hands (fields of standing crops, reaped and
// ploughed ones, walls and hedges, rows of trees by the road, a flock and a company of foot in the fields); then low
// through the country, at a hay cart's height: up a
// lane on the left through stooks, a threshing floor where the mule goes round, a dry stone wall, a shepherd's hut and
// a well; over the road and the stream's bridge; up a lane on the right through the same things as he sees them
// (pavilions, a hedge of roses, a fountain, a chapel with a gilt bell, an orchard in blossom); between the inn and the
// castle; up the road between the flock that grazes and the host that stands across from it, headed for the village;
// up the village's one street to the gateway at the road's end (half plain stone, half golden, the tallest thing of
// the country) with the ring filling its arch.
// WHAT IS DRIVEN BY WHAT: THE PLACE STANDS. Nothing goes by the metres flown, by the film's clock
// or by a place of the route reached: the hour of the visit stands from the first frame to the last (sun or moon,
// sky, light, air, the lamps and the windows lit or unlit by the hour); the two droves by the village and the two in
// the fields stand where they stand. Everything that moves goes by the WORLD CLOCK on a round of its own: the wind's
// gusts and the sails, the crows' crossings, the grazing beasts, the dogs, and
// the rest (the list stands at update()). By the eye's nearness, only so that nothing lies in the line: the motes'
// and the dust's near fade, the kit's grass. The film's pace and the one pull of the gaze are the flight's own.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as T from '../kit/terrain.js';
import * as fx from '../kit/fx.js';
import * as PW from '../parts/plain-with-two-sides.js';

const { SK, YARD, PAL, MAT, lin, mixc, mulc } = PW;

// ---------------------------------------------------------------- the ground: one country in two manners that meet at the road
const G_FRAG_PARS = /* glsl */`
uniform float uTime, uSeason, uNight; uniform vec2 uSunXZ; uniform vec3 uRoadCol, uDust, uStubble, uGreenA, uGreenB, uWet, uSkyCol, uHorCol; uniform vec4 uMoat, uBed, uPlace, uVil; uniform sampler2D uPud;
varying vec3 vGPos;
// a drift of one kind of flower (broom, poppies, flax): smooth fields that the world's own code reads too, to stand real flowers in the same drifts
float gDrift(vec2 p, float k){ return sin(p.x * (0.019 - 0.004 * k) + p.y * (0.008 + 0.005 * k) + 1.3 + 2.1 * k) * sin(p.x * (0.006 + 0.003 * k) - p.y * (0.021 - 0.004 * k) + 0.4 + 1.7 * k); }
float gH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gH(i), gH(i + vec2(1., 0.)), f.x), mix(gH(i + vec2(0., 1.)), gH(i + vec2(1., 1.)), f.x), f.y); }
float gF(vec2 p){ return 0.5 * gN(p) + 0.25 * gN(p * 2.03 + 7.1) + 0.125 * gN(p * 4.1 + 13.7) + 0.0625 * gN(p * 8.3 + 3.3); }
// stones lying on the ground: one to a cell (of the given size, in metres) where the cell's own hash says so, each of its own size (a twentieth to
// a seventh of the cell) and shape; x = the stone, y = its shade on the ground on the side away from the light (uSunXZ, the light's bearing on the
// ground), z = how its top takes the light (lit toward the light, dull away from it). All go where a stone is smaller than what the eye resolves
// there (px = a pixel's footprint in metres).
vec3 gStones(vec2 p, float cell, float dens, float px){
  vec2 c = p / cell, ci = floor(c), cf = fract(c) - 0.5;
  if (gH(ci + 17.3) > dens) return vec3(0., 0., 1.);
  float r = 0.05 + 0.1 * gH(ci + 4.1); vec2 d = cf - (vec2(gH(ci + 2.9), gH(ci + 8.3)) - 0.5) * 0.6; d.x *= 1. + 0.6 * gH(ci + 6.6);
  float m = 1. - smoothstep(r * 0.7, r, length(d)), sh = (1. - smoothstep(r * 0.5, r * 1.7, length(d + uSunXZ * r * 1.1))) * (1. - m);
  float k = clamp(1.3 - px / (cell * r) * 1.1, 0., 1.);
  return vec3(m * k, sh * k, 0.78 + 0.5 * clamp(0.5 - dot(d, uSunXZ) / r * 0.5, 0., 1.));
}
`;
const G_FRAG = /* glsl */`
{
  vec2 p = vGPos.xz;
  vec2 fw = fwidth(p); float px = max(fw.x, fw.y);
  float f1 = gF(p * 0.011 + 3.), f2 = gF(p * 0.06 + 20.), f3 = gN(p * 0.9), f4 = gN(p * 4.7);
  float seam = smoothstep(-6.5, 6.5, p.x + 3.0 * sin(p.y * 0.021) + 2.0 * sin(p.y * 0.0507 + 1.3) + 4.0 * sin(p.y * 0.0093 + 0.7) * sin(p.y * 0.031) + (gN(p * 0.16) - 0.5) * 5.);
  // LEFT: dust, stubble in rows, fallow patches; by season green wheat or poppies
  float field = floor(p.y / 150. + f1 * 1.6) + floor(p.x / 210. + f2 * 0.4) * 7.;
  // (a field is ploughed along the road or across it, by the field: so the furrows of one field run away from us and those of the next lie across)
  float fh = gH(vec2(field, 5.)), ang = (fh - 0.5) * 1.2 + step(0.45, gH(vec2(field, 8.))) * 1.5708;
  // furrows a pace apart that bend round the rises (they are ploughed along the slope's foot), each broken along its length into clods and tufts of
  // straw: fine enough to hold when we are low over them, and gone to one calm tone where a furrow is smaller than what the eye resolves there
  float rowa = (p.x * cos(ang) + p.y * sin(ang)), rowb = (p.y * cos(ang) - p.x * sin(ang));
  float rowc = (rowa + vGPos.y * 1.6) * 5.6 + f2 * 5.;
  float rowK = clamp(1.25 - px * 4.5, 0., 1.), brk = 0.45 + 1.1 * gN(vec2(rowc * 0.16, rowb * 1.3)), rows = smoothstep(-0.3, 0.7, sin(rowc)) * rowK;
  float nearK = clamp(1. - px * 9., 0., 1.);
  // (a painted flower head, some two hands across, is for where a standing flower would be a speck: it is whole where a head is three pixels
  // across or less, a pixel's footprint of six centimetres, and gives way wholly to the plants that stand there where a head would be seven
  // pixels and more, 2.5 cm)
  float headK = smoothstep(0.025, 0.06, px);
  float grit = (gN(p * 23.) - 0.5) * 0.22 * nearK + (gN(p * 61.) - 0.5) * 0.16 * clamp(1. - px * 28., 0., 1.);
  vec3 L = mix(uStubble, uDust, smoothstep(0.3, 0.75, f1 * 0.7 + f2 * 0.5 + (fh - 0.5) * 0.5));
  // furrows: the crest toward the low sun is lit, the trough behind it lies in shade; clods and cut straw between
  float furrow = sin(rowc), lit = smoothstep(0.2, 0.9, sin(rowc + 0.9)), shade = smoothstep(0.3, 0.95, sin(rowc - 1.1));
  L *= 0.8 + 0.18 * rows + 0.12 * (f3 - 0.5) + 0.1 * (f4 - 0.5);
  L *= 1. + rowK * brk * (0.3 * lit - 0.34 * shade) + grit;
  L = mix(L, uStubble * 1.25, rowK * nearK * 0.5 * smoothstep(0.55, 0.8, gN(vec2(rowc * 0.5, p.y * 3.1 + p.x * 2.3))) * smoothstep(0.3, 0.9, furrow));
  L = mix(L, uDust * 1.06, smoothstep(0.62, 0.8, f2) * 0.6);
  // out on the plain the fields differ: pale stubble, ploughed umber, fallow, grey-olive; pale lanes run between them
  float fh2 = gH(vec2(field, 11.)), farK = smoothstep(16., 55., abs(p.x));
  vec3 Lf = fh2 < 0.34 ? uStubble * 1.15 : fh2 < 0.58 ? mix(uStubble, vec3(0.2, 0.105, 0.06), 0.6) : fh2 < 0.8 ? uDust * 1.04 : mix(uDust, vec3(0.27, 0.31, 0.18), 0.55);
  L = mix(L, Lf * (0.82 + 0.2 * rows + 0.1 * (f3 - 0.5)), farK * 0.8);
  float fa = fract(p.y / 150. + f1 * 1.6), fb = fract(p.x / 210. + f2 * 0.4);
  float lane = min(min(fa, 1. - fa) * 150., min(fb, 1. - fb) * 210.);
  float laneK = (1. - smoothstep(1.2, 2.6 + px * 2., lane)) * farK;
  L = mix(L, uDust * 1.18, laneK * 0.7);
  if (uSeason > 0.5 && uSeason < 1.5) { vec3 wheat = mix(vec3(0.46, 0.33, 0.1), vec3(0.6, 0.47, 0.17), f2); L = mix(L, wheat * (0.82 + 0.25 * rows), step(0.42, fh) * 0.85); }
  if (uSeason > 1.5) {
    vec2 c = p / 0.95, ci = floor(c), cf = fract(c) - 0.5; float hh = gH(ci + 1.3);
    float dd = length(cf - (vec2(gH(ci + 3.7), gH(ci + 9.1)) - 0.5) * 0.6), dot1 = smoothstep(0.14, 0.08, dd) * step(0.55, hh) * smoothstep(0.35, 0.6, f2 + f1 * 0.4);
    float fade = clamp(1.4 - px * 3., 0., 1.);
    L = mix(L, vec3(0.62, 0.06, 0.03), dot1 * fade * headK + (1. - fade) * (0.06 + 0.2 * gN(p * 0.31 + 2.)) * smoothstep(0.35, 0.6, f2 + f1 * 0.4));   // (far off: the heads' mean, thick and thin as they stand)
  }
  // RIGHT: enamel green, darker and lighter in soft bands, full of small flowers (a painted meadow)
  vec3 R = mix(uGreenA, uGreenB, smoothstep(0.25, 0.75, f1 * 0.6 + f2 * 0.55));
  R *= 0.82 + 0.2 * f3 + 0.14 * (f4 - 0.5) + grit * 1.3;
  {                                                                // out on the plain: drifts of flowers, broom gold, poppy red, flax blue. A drift is its
    // flowers: a head in each cell of the drift, fewer toward its edge; where a head is smaller than what the eye resolves there the drift goes to the
    // mean colour of its heads, by the pixel's footprint and so alike everywhere. Mown paths between the holdings.
    float d0 = gDrift(p, 0.), d1 = gDrift(p, 1.), d2 = gDrift(p, 2.), dmx = max(d0, max(d1, d2));
    vec3 drift = d0 >= dmx ? vec3(0.78, 0.52, 0.04) : d1 >= dmx ? vec3(0.66, 0.05, 0.03) : vec3(0.16, 0.26, 0.74);
    float dm = smoothstep(0.42, 0.9, dmx + (f3 - 0.5) * 0.2 + (gN(p * 0.19) - 0.5) * 0.25) * farK;
    vec2 dc = p / 0.8, di = floor(dc), df = fract(dc) - 0.5;
    float dd = length(df - (vec2(gH(di + 3.1), gH(di + 5.9)) - 0.5) * 0.6), dotK = smoothstep(0.18, 0.1, dd) * step(gH(di + 7.7), dm * 0.9);
    float dfade = clamp(1.4 - px * 3., 0., 1.);
    // (far off: the heads' mean colour and no more of it than the heads themselves cover, a tenth to a fifth of the ground, thick and thin
    // as they stand thick and thin: a drift far off is a breath of its colour in the meadow, never a patch of one tone)
    R = mix(R, drift * (0.85 + 0.3 * f3), dotK * dfade * headK + (1. - dfade) * dm * (0.1 + 0.12 * gN(p * 0.31 + 5.)) * (0.5 + gN(p * 1.3 + 8.)));
    R = mix(R, mix(uGreenB * 1.35, uDust, 0.3) * (0.9 + 0.2 * f4), laneK * 0.6);                      // (the ways between the holdings: mown paths, paler than the meadow, as his are pale dust)
  }
  {
    vec2 c = p / 1.05, ci = floor(c), cf = fract(c) - 0.5; float hh = gH(ci);
    float dd = length(cf - (vec2(gH(ci + 3.7), gH(ci + 9.1)) - 0.5) * 0.6), dot1 = smoothstep(0.13, 0.08, dd) * step(0.38, hh);
    vec3 fc = hh < 0.58 ? vec3(0.92, 0.88, 0.76) : hh < 0.74 ? vec3(0.9, 0.56, 0.03) : hh < 0.88 ? vec3(0.72, 0.02, 0.03) : vec3(0.2, 0.3, 0.95);
    float fade = clamp(1.4 - px * 3., 0., 1.);
    R = mix(R, fc, dot1 * fade * headK); R = mix(R, vec3(0.5, 0.52, 0.3), (1. - fade) * 0.12);
  }
  vec3 a = mix(L, R, seam);
  // the stream: banks of bare earth (left) or dark turf (right) that fall to a flat floor; on the left the floor is dry cracked mud with stones, on the
  // right bright water runs in it
  float bd = abs(p.y - (-uBed.x + 9. * sin(p.x * 0.017 + uBed.y) * smoothstep(30., 120., abs(p.x)))) + (f3 - 0.5) * 1.2;
  float bfar = 1. - smoothstep(700., 1100., abs(p.x)), bedK = (1. - smoothstep(4.8, 7.4, bd)) * bfar, floorK = (1. - smoothstep(2.3, 3.4, bd)) * bfar;
  vec3 bank = mix(mix(uDust * 0.8, vec3(0.3, 0.24, 0.16), 0.5), mix(uGreenA * 1.5, vec3(0.16, 0.22, 0.08), 0.5), seam) * (0.8 + 0.4 * f4);
  float stone = smoothstep(0.62, 0.72, gN(p * 1.7 + 5.));
  vec3 mud = vec3(0.5, 0.43, 0.3) * (0.82 + 0.3 * f4) * (1. - 0.5 * nearK * (1. - smoothstep(0., 0.04, abs(gN(p * 1.3 + 9.) - 0.5))));
  mud = mix(mud, vec3(0.6, 0.58, 0.54) * (0.8 + 0.4 * f4), stone * 0.85);
  // (the stream's water is a sheet of its own that lies over this floor from the road to 170 m out; under it the floor is dark wet gravel. Beyond,
  // where the land's rows are too far apart to hold a sheet, the floor itself is painted as water seen from afar: by the place, 150 to 170 m out)
  // (water seen from afar holds the sky that is over it now, broken by its ripples and darker along its banks: never one painted blue)
  vec3 wat = mix(vec3(0.1, 0.12, 0.1) * (0.7 + 0.6 * f4) + vec3(0.2, 0.2, 0.18) * stone * 0.6, mix(uHorCol, uSkyCol, 0.4) * (0.5 + 0.3 * f3 + 0.2 * f4) * (0.6 + 0.4 * (1. - smoothstep(1.2, 3.2, bd))), smoothstep(150., 170., p.x));
  a = mix(a, mix(bank, vec3(0.6, 0.58, 0.54), stone * 0.5 * (1. - seam * 0.5)), bedK);
  a = mix(a, mix(mud, wat, seam), floorK);
  // the village's ground: trodden pale earth on the left; in the same place on the right a pavement of pale squares (2.2 m), their joints seen near
  float sR = -p.y, vilK = smoothstep(uVil.x - 6., uVil.x + 6., sR) * (1. - smoothstep(uVil.y - 4., uVil.y + 8., sR)) * (1. - smoothstep(uVil.z - 10., uVil.z + 8., abs(p.x)));
  // RIGHT: dressed flags 1.5 m by 0.75 laid in bond across the street, each of its own tone, dark joints, a band of darker stone every sixth course.
  // LEFT: cobbles a hand and a half across laid in bond, each a rounded stone lit on its crown, earth in the joints, patches where the cobbles are
  // gone to trodden earth. On both the lane's middle is worn smooth and pale by wheels and feet (the road's width), and two wheel tracks are worn
  // into the stones. Joints and single cobbles go to their mean tone where they are finer than what the eye resolves there (the pixel's footprint).
  // (the worn middle is worn in patches, and each wheel track shows in lengths of two or three metres with whole stones between: nothing on
  // the street's floor runs its whole length)
  float wearK = (1. - smoothstep(2.4, 4.4, abs(p.x) + (f3 - 0.5) * 1.6)) * (0.45 + 0.75 * gN(p * 0.23 + 3.));
  float trackK = (1. - smoothstep(0.1, 0.3, abs(abs(p.x) - 0.78 + (gN(vec2(p.y * 0.3, 2.)) - 0.5) * 0.2))) * smoothstep(0.42, 0.62, gN(vec2(p.y * 0.42, 31. + step(0., p.x) * 4.)));
  vec2 tc = vec2(p.y / 0.75, p.x / 1.5); tc.y += 0.5 * mod(floor(tc.x), 2.); vec2 ti = floor(tc), tf = fract(tc);
  float jd = min(min(tf.x, 1. - tf.x) * 0.75, min(tf.y, 1. - tf.y) * 1.5), joint = (1. - smoothstep(0.012, 0.03 + px, jd)) * clamp(1.3 - px * 5., 0., 1.);
  float band = step(5., mod(ti.x, 6.));
  vec3 pave = mix(vec3(0.58, 0.54, 0.47), vec3(0.4, 0.34, 0.33), band * 0.7) * (0.8 + 0.24 * gH(ti + 2.3) * clamp(1.5 - px * 2., 0., 1.) + 0.14 * (f3 - 0.5) + 0.1 * (f4 - 0.5) + grit);
  pave *= (1. - 0.45 * joint) * (1. + 0.1 * wearK - 0.1 * trackK);
  vec2 cc = vec2(p.x / 0.34, p.y / 0.3); cc.x += 0.5 * mod(floor(cc.y), 2.); vec2 ci2 = floor(cc), cf2 = fract(cc) - 0.5;
  float cK = clamp(1.3 - px * 9., 0., 1.), cr = length(cf2 * vec2(1., 0.9)), ch = gH(ci2 + 4.1);
  float gone = smoothstep(0.56, 0.7, gN(p * 0.33 + 17.) + 0.25 * (1. - wearK) - 0.12);
  vec3 cob = mix(vec3(0.44, 0.4, 0.34), vec3(0.3, 0.27, 0.25), ch * 0.8) * (1. + cK * (0.26 * (1. - smoothstep(0.1, 0.4, length(cf2 - vec2(-0.12, 0.1)))) - 0.5 * smoothstep(0.36, 0.5, cr)));
  cob *= (0.92 + 0.14 * (f3 - 0.5) + grit) * (1. + 0.16 * wearK - 0.14 * trackK);
  vec3 trod = uDust * (0.98 + 0.2 * (f3 - 0.5) + 0.12 * (f4 - 0.5) + grit);
  a = mix(a, mix(mix(cob, trod, gone), pave, seam), vilK * 0.94);
  // THE SEAM'S VERGES AND DITCH. From the road's edge to the ditch's near lip (6 m): rough grass, dry straw-olive on the left and thick green on
  // the right, in tufts, with stones lying in it. The ditch (6 to 9 m; the land's own code sinks it by the same places, uPlace): bare shaded earth
  // with stones on the left; dark turf with a thread of bright water on the right. Not before the two houses, nor in the street.
  float axs = abs(p.x), ditchOn = (1. - step(uPlace.x, sR) * step(sR, uPlace.y)) * step(sR, uPlace.z) * (1. - bedK);
  vec3 vgr = mix(mix(uStubble, vec3(0.2, 0.21, 0.09), 0.55), uGreenB * 1.15, seam) * (0.72 + 0.4 * gN(p * 3.1) + 0.25 * (f4 - 0.5) + grit * 1.5);
  float vergeK = smoothstep(3.2, 4.4, axs) * (1. - smoothstep(9.5, 12.5, axs)) * (1. - bedK);
  a = mix(a, vgr, vergeK * 0.75 * (1. - vilK));
  float dq = abs(axs - 7.5), ditchK = (1. - smoothstep(0.5, 1.5, dq)) * ditchOn, dFloor = (1. - smoothstep(0.2, 0.6, dq + (f3 - 0.5) * 0.3)) * ditchOn;
  vec3 dEarth = mix(mix(uDust * 0.62, vec3(0.2, 0.16, 0.1), 0.5), uGreenA * 0.9, seam) * (0.8 + 0.4 * f4);
  a = mix(a, dEarth, ditchK * 0.7);
  // (the brook's water is a sheet of its own over the ditch's floor on the right; under it the floor is dark wet earth with stones)
  a = mix(a, mix(vec3(0.3, 0.26, 0.19) * (0.8 + 0.4 * f4), vec3(0.07, 0.1, 0.07) * (0.7 + 0.6 * f4) + vec3(0.16, 0.16, 0.14) * stone * 0.7, seam), dFloor * 0.85);
  vec3 vst = gStones(p + 31.7, 1.25, 0.3, px);
  a = mix(a, mix(a, vec3(0.42, 0.4, 0.36), 0.75) * vst.z * (0.8 + 0.4 * gH(floor((p + 31.7) / 1.25) + 1.1)), vst.x * vergeK); a *= 1. - 0.4 * vst.y * vergeK;
  // THE ROAD: pale dust in patches a pace or two across, crowned (lighter along its middle, where thin grass grows in tufts between the wheels), two
  // cart ruts a wheel gauge apart (1.56 m), a hand and a half wide and dark, with a lighter lip, each rut cut in lengths of some ten to twenty metres with firm ground between (a rut
  // forms where the ground is soft), an older pair wandering beside them the same way, hoof prints between and beside the ruts, stones lying on it,
  // puddles in the ruts' soft lengths that hold the sky (about one in thirty metres, a pace long), hollows trodden across it, and its edges broken
  // by the verge's grass. Every pattern on it has its size in metres both along and across. It is the seam. In the village it gives way to the paving.
  float ax = abs(p.x + (gN(vec2(p.y * 0.021, 9.)) - 0.5) * 1.3);
  float rw = 3.6 + (gN(vec2(p.y * 0.05, 3.)) - 0.5) * 1.3;
  float road = smoothstep(rw + 1.0, rw - 0.5, ax + (f3 - 0.5) * 1.3 + (gN(p * 2.7) - 0.5) * 0.9 * nearK);
  float hol = gN(p * 0.42 + 40.);
  vec3 rc = uRoadCol * (0.84 + 0.13 * gN(p * 0.62 + 11.) + 0.09 * (gN(p * 1.9 + 3.) - 0.5) + 0.08 * (f4 - 0.5) + grit * 0.7 - 0.1 * nearK * smoothstep(0.62, 0.8, gN(p * 9.)));
  rc *= 0.93 + 0.11 * (1. - smoothstep(0.2, 3.0, ax));
  rc *= 1. - 0.24 * smoothstep(0.6, 0.78, hol);
  // (THE WAY IN, from the two houses' last wall to the mouth, is the hard road of a town: its ruts are short, two to four metres where
  // a wheel broke through, and shallow, with no lighter lip; the older pair beside them is all but trodden out; so is the grass along its middle)
  float inK = smoothstep(uPlace.y, uPlace.y + 20., sR);
  float sgn = step(0., p.x), soft = mix(gN(vec2(p.y * 0.065, 4. + sgn * 3.)), gN(vec2(p.y * 0.3, 54. + sgn * 3.)), inK), rutOn = smoothstep(0.42, 0.58, soft) * (1. - 0.45 * inK);
  float rutX = ax - 0.78 + (gN(vec2(p.y * 0.3, 2.)) - 0.5) * 0.16, rut = (1. - smoothstep(0.07, 0.21, abs(rutX))) * rutOn;
  rc *= 1. - 0.5 * rut * (0.6 + 0.4 * f3) + 0.14 * (1. - inK) * (1. - smoothstep(0.21, 0.36, abs(rutX))) * (1. - rut) * rutOn;
  rc *= 1. - 0.24 * (1. - 0.8 * inK) * (1. - smoothstep(0.08, 0.26, abs(ax - 1.9 + (gN(vec2(p.y * 0.05, 7.)) - 0.5) * 1.2))) * (0.4 + 0.6 * f3) * smoothstep(0.4, 0.6, gN(vec2(p.y * 0.05, 12. + sgn * 5.)));
  // (WHERE A PUDDLE LIES: the road is told off in lengths of 7.5 m on either hand; one length in four holds a puddle, which of them by
  // the visit's own number (uBed.z) and the length's; and only a length over which the road AS DRAWN falls less than two degrees holds
  // water at all: uPud, one texel a length and hand, laid at build off the ground's own triangles)
  { float pcell = floor(p.y / 7.5), pid = pcell + uBed.z, ph = gH(vec2(pid, 6. + sgn)), py = (pcell + 0.3 + 0.4 * gH(vec2(pid, 9. + sgn))) * 7.5;
    float lev = texture2D(uPud, vec2((36.5 - pcell) / 256., 0.25 + 0.5 * sgn)).r;
    vec2 pd = vec2(rutX / (0.34 + 0.22 * ph), (p.y - py) / (0.7 + 0.9 * gH(vec2(pid, 2. + sgn))));
    float pr = length(pd) + (gN(p * 3.3) - 0.5) * 0.5, pud = (1. - smoothstep(0.82, 0.95, pr)) * step(ph, 0.25) * rutOn * (1. - vilK) * lev;
    // (ONE FLOOR, stated once: a puddle is a film of water on the dust. It shows, half and half, the wet road under it (0.7 of the road
    // as it is there before the wet margin darkens it) and the sky it holds (the sky's light moving between 0.8 and 1.0 of it on the
    // clock), and is never darker than 0.6 of that road: a wet patch with the sky's sheen, not a patch of the sky's own colour)
    vec3 dry = rc;
    rc = mix(rc, rc * 0.8, (1. - smoothstep(0.95, 1.5, pr)) * step(ph, 0.25) * rutOn * (1. - vilK) * lev);
    rc = mix(rc, max(mix(dry * 0.7, mix(uSkyCol, uHorCol, 0.65) * (0.8 + 0.2 * gN(p * 2.1 + uTime * 0.2)), 0.5), dry * 0.6), pud); }
  { vec2 hc = vec2(p.x / 0.42, p.y / 0.7), hi = floor(hc); hc.y += gH(vec2(hi.x, 3.)) * 0.5; hi = floor(hc); vec2 hf = (fract(hc) - 0.5) * vec2(1., 1.6);
    float shoe = (1. - smoothstep(0.15, 0.2, length(hf))) * smoothstep(0.07, 0.12, length(hf - vec2(0., 0.07)));
    rc *= 1. - 0.22 * shoe * step(gH(hi + 5.5), 0.3) * clamp(1.2 - px * 14., 0., 1.) * (1. - rut); }
  rc = mix(rc, vgr * 0.9, (1. - smoothstep(0.1, 0.55, ax + (f3 - 0.5) * 0.3)) * smoothstep(0.45, 0.7, gN(p * 1.15 + 23.)) * 0.6 * (1. - vilK) * (1. - 0.75 * inK));
  vec3 rst = gStones(p, 0.7, 0.22, px);
  rc = mix(rc, mix(rc, vec3(0.42, 0.4, 0.37), 0.7) * rst.z * (0.8 + 0.4 * gH(floor(p / 0.7) + 1.1)), rst.x); rc *= 1. - 0.4 * rst.y;
  // (and larger stones, a hand to two hands across, one to some eleven square metres of road: seen from the saddle a long way up it)
  vec3 rs2 = gStones(p + 53.9, 1.5, 0.2, px);
  rc = mix(rc, mix(rc, vec3(0.4, 0.38, 0.35), 0.8) * rs2.z * (0.75 + 0.4 * gH(floor((p + 53.9) / 1.5) + 1.1)), rs2.x * (1. - vilK)); rc *= 1. - 0.5 * rs2.y * (1. - vilK);
  rc = mix(rc, mix(uDust, uGreenB, seam) * 0.9, smoothstep(0.55, 0.9, f2) * 0.35 * smoothstep(1.4, 2.8, ax));
  a = mix(a, rc, road * (1. - bedK) * (1. - vilK));
  // the moat's bed and banks
  // (the moat lies about the castle, on the right of the road)
  vec2 mq = abs(vec2(abs(p.x), p.y) - uMoat.xy) - uMoat.zw; float md = length(max(mq, 0.)) + min(max(mq.x, mq.y), 0.);
  a = mix(a, uWet, smoothstep(6.6, 5.2, md) * step(0., p.x));
  a = mix(a, vec3(dot(a, vec3(0.3, 0.5, 0.2))) * vec3(0.72, 0.8, 1.05), uNight * (1. - seam) * 0.8);
  diffuseColor.rgb = a;
}
`;

function makeGroundMaterial(GU) {
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, GU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGPos; attribute vec3 aDig;')
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float gAct = step(0., position.x);
        objectNormal = normalize(objectNormal + vec3(aDig.y, 0., aDig.z) * gAct * 2.2);`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y -= aDig.x * gAct;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\n' + G_FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + G_FRAG)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uNight * 0.3 * smoothstep(-6.5, 6.5, vGPos.x);');
  };
  mat.customProgramCacheKey = () => 'pw2s-ground';
  return mat;
}

// the moat's water: the sky lying in it, ripples, the low sun's glitter, and the castle's wall standing in it: where the mirrored ray meets the
// curtain (box = the wall's middle and half sizes in the world; 9.6 m to its merlons, its corner towers 19 m) the wall's pale courses are seen
// in place of the sky
function makeWaterMaterial(U, box) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsLib.fog, uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uHorCol: U.uHorCol, uDeep: { value: new THREE.Color(0.02, 0.07, 0.12) }, uCastle: { value: new THREE.Vector4(...box) }, uWallCol: { value: new THREE.Color(0.5, 0.48, 0.44) } },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.);
        vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform float uTime; uniform vec3 uSunDir, uSunCol, uSkyCol, uHorCol, uDeep, uWallCol; uniform vec4 uCastle; varying vec3 vW;
      float wH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float wN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wH(i), wH(i + vec2(1., 0.)), f.x), mix(wH(i + vec2(0., 1.)), wH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz; float t = uTime * 0.5;
        float h1 = wN(p * 1.3 + vec2(t, t * 0.6)), h2 = wN(p * 2.9 - vec2(t * 0.8, t * 1.1));
        vec3 n = normalize(vec3((h1 - 0.5) * 0.22 + (h2 - 0.5) * 0.12, 1., (h2 - 0.5) * 0.22 - (h1 - 0.5) * 0.1));
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, n);
        float fr = 0.06 + 0.94 * pow(clamp(1. - dot(n, V), 0., 1.), 4.);
        vec3 sky = mix(uHorCol, uSkyCol, smoothstep(0.02, 0.6, R.y));
        float sd = clamp(dot(R, uSunDir), 0., 1.);
        sky += uSunCol * (pow(clamp(sd, 0., 1.), 90.) * 6. + pow(clamp(sd, 0., 1.), 8.) * 0.5);
        {
          float sx = vW.x < 0. ? -1. : 1.; vec2 o2 = vec2(abs(vW.x), vW.z) - uCastle.xy, d2 = vec2(R.x * sx, R.z), sg = vec2(d2.x < 0. ? -1. : 1., d2.y < 0. ? -1. : 1.), dd = sg * max(abs(d2), 1e-4);
          vec2 tn = (-sg * uCastle.zw - o2) / dd, tf = (sg * uCastle.zw - o2) / dd; float tN = max(tn.x, tn.y), tF = min(tf.x, tf.y);
          if (tN > 0. && tN < tF) {
            vec2 q = abs(o2 + d2 * tN); float yH = vW.y + R.y * tN, top = length(q - uCastle.zw) < 4.6 ? 19. : 9.6;
            float course = 1. - 0.3 * smoothstep(0.42, 0.48, abs(fract(yH / 0.62) - 0.5)), band = 1. + 0.25 * step(7.7, yH) * step(yH, 8.05);
            vec3 wall = uWallCol * (0.3 + 0.7 * uHorCol) * course * band * (0.75 + 0.25 * smoothstep(0., 3., yH));
            sky = mix(sky, wall, (1. - smoothstep(top - 0.3, top, yH)) * 0.92);
          }
        }
        vec3 col = mix(uDeep, sky, max(fr, 0.42));
        gl_FragColor = vec4(col, 0.93);
        #include <fog_fragment>
      }`,
  });
}

// running water (the stream, the meadow's brook): a sheet that lies in its bed. aRib = metres along it, metres across from its middle, its half
// width, how much of it is there (it thins out to nothing at its ends). Ripples a pace and a hand long that run down it, the sky lying in it, a
// glitter toward the sun, dark in the middle where it is deep, clear over the bed's stones toward the banks, and gone softly at its edge.
function makeStreamMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsLib.fog, uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uHorCol: U.uHorCol, uDeep: { value: new THREE.Color(0.015, 0.06, 0.1) }, uShoal: { value: new THREE.Color(0.1, 0.16, 0.1) } },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      attribute vec4 aRib; varying vec3 vW; varying vec4 vRib;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vRib = aRib; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform float uTime; uniform vec3 uSunDir, uSunCol, uSkyCol, uHorCol, uDeep, uShoal; varying vec3 vW; varying vec4 vRib;
      float wH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float wN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wH(i), wH(i + vec2(1., 0.)), f.x), mix(wH(i + vec2(0., 1.)), wH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float e = abs(vRib.y) / max(vRib.z, 1e-3), deep = 1. - smoothstep(0.2, 0.85, e), t = uTime;
        vec2 q = vec2(vRib.y, vRib.x);
        float h1 = wN(vec2(q.x * 1.5, q.y * 0.7 - t * 0.45)), h2 = wN(vec2(q.x * 3.4 + 7., q.y * 1.9 - t * 0.8)), h3 = wN(vec2(q.x * 7. + 3., q.y * 5. - t * 1.5));
        vec3 n = normalize(vec3((h1 - 0.5) * 0.26 + (h2 - 0.5) * 0.14, 1., (h2 - 0.5) * 0.24 - (h1 - 0.5) * 0.12 + (h3 - 0.5) * 0.1));
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, n);
        float fr = 0.08 + 0.92 * pow(clamp(1. - dot(n, V), 0., 1.), 4.);
        vec3 sky = mix(uHorCol, uSkyCol, smoothstep(0.02, 0.6, R.y));
        float sd = clamp(dot(R, uSunDir), 0., 1.);
        sky += uSunCol * (pow(sd, 70.) * 5. + pow(sd, 7.) * 0.45 + step(0.8, h3) * pow(sd, 3.) * 1.6);
        vec3 body = mix(uShoal * (0.8 + 0.5 * h2), uDeep, deep);
        vec3 col = mix(body, sky, fr * (0.5 + 0.5 * deep));
        gl_FragColor = vec4(col, (1. - smoothstep(0.62, 1., e)) * vRib.w * (0.6 + 0.34 * deep));
        #include <fog_fragment>
      }`,
  });
}

export default {
  id: 'plain-with-two-sides',
  name: 'The Plain With Two Sides',
  category: 'books',
  placeKind: 'bizarre',
  book: 'Don Quixote',
  author: 'Miguel de Cervantes, 1547 to 1616',
  media: ['air', 'open'],
  weirdness: 0.7,
  async build(ctx) {
    const { noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    const scene = new THREE.Scene(), pools = [];
    // every seeded stream of the world, taken here once in one fixed list: each is made from the world's seed and the name of its own thing, so no stream
    // draws from another and a loop that takes more or fewer draws moves nothing else
    const RN = {};
    for (const name of ['visit', 'layout', 'close', 'country', 'lane', 'laneTrees', 'lanePairs', 'flock0', 'flock1', 'sky', 'ridges', 'hills', 'land', 'grassL', 'grassR', 'treesL', 'treesR',
      'oakA', 'oakB', 'oakA0', 'oakB0', 'oakC', 'cherry', 'oakC0', 'cherry0', 'poplar', 'willow', 'poplar0', 'willow0', 'ridgeOaks', 'lone', 'clouds', 'cloudsL', 'cloudsR', 'smoke', 'smokeV',
      'animals', 'wheels', 'dust', 'motes', 'glints', 'verge', 'drifts', 'holdings', 'walls2', 'hedges2', 'farPairs', 'farTowns', 'townPlan', 'village', 'stars', 'wheel', 'flutter', 'crows', 'grove', 'bank', 'mules', 'square', 'banks', 'works', 'poppies', 'houses', 'air', 'farTree',
      'torches', 'footBeasts', 'crowWings', 'relief', 'rows', 'strips', 'fieldFlock', 'gatePair', 'stalls', 'crowd', 'ranks',
      'cropTufts', 'stooks', 'fieldWallsL', 'fieldWallsR', 'fieldDust', 'grazing', 'fieldGrazing', 'crowRounds', 'wind', 'church', 'puddles', 'entryStrips']) RN[name] = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

    // ------------------------------------------------------------ what this visit is like
    const rv = RN.visit;
    const hourPick = rv.pick(['golden', 'golden', 'golden', 'golden', 'dawn', 'day', 'night']);
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : hourPick, night = hour === 'night';
    const season = rv.pick(['stubble', 'stubble', 'wheat', 'poppies']), seasonId = { stubble: 0, wheat: 1, poppies: 2 }[season];
    // the sun (the moon at night) stands over HIS side of the road for the whole visit: twelve to twenty-four degrees right of the road ahead
    // (the bearings at which the close pairs' giants stand from the road before them), so that the giants are seen against it and the
    // mills in its light
    const sunAz = rv.range(12, 24), haze = rv.range(0.8, 1.25), cloudK = rv.range(0.5, 1);
    // (the sun's height at the visit's hour: it stands for the whole visit, see THE HOUR STANDS below)
    const sunEl = { golden: rv.range(8.5, 11), dawn: rv.range(8.5, 11), day: rv.range(20, 26), night: 12 }[hour] ?? 9.5;
    // ------------------------------------------------------------ the measures every rule below is stated in (a pair's shared skeleton, times its scale)
    const MH = SK.H + SK.capH, TOP = SK.hubY + SK.sailR;                // a mill's height (tower and cap, 20.8 m); a thing's own height (hub and sail, 28.6 m)
    const RIDER = 2.5;                                                   // a mounted man's eye
    const CART = 3.2;                                                    // the top of a loaded hay cart: over a stook's head and a plot wall, under the pavilions' peaks and the trees' crowns
    const YARD_H = 2 * 2.7;                                              // twice the inn's yard wall: over its wall and gate roof, under the castle's parapet
    const PORTAL_Y = PW.GATE.Y0, RING = PW.GATE.R;                       // the ring fills the gateway's arch: its centre at the arch's springing, its radius the arch's own half width
    const ROAD_HALF = 3.6, MARGIN = 10;                                  // half the road's width; no part of a great thing nearer the route's line than this, in space
    const VERGE = 4.8, DITCH = 7.5;                                      // the verge's middle (between the road's edge at 3.6 m and the ditch's lip at 6) and the ditch's bed, from the road's middle
    const LANE = 18;                                                     // our line through the holdings: the ditch's far lip is at 9 m; a row of pavilions two and a half of their widths (8.5 m) inside our line stands clear of it
    const WALLS = YARD.moat + ROAD_HALF + 0.9;                           // the two houses' fronts stand 12 m from the road's middle: the drawbridge's foot is on the road's edge (kept)
    const FRONT = 16.9, STREET = 0.95 * FRONT;                           // the tallest front of the street (the gabled hall on the right, measured from its geometry); the street's fronts stand 0.95 of it from its middle
    // the two things of every pair, built once here: their own farthest reach is what every margin about them is reckoned from
    await ctx.yield();
    let millHi, millLo;
    { const it = PW.millSteps({ detail: 1 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } millHi = r.value; }
    await ctx.yield();
    { const it = PW.millSteps({ detail: 0 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } millLo = r.value; }
    await ctx.yield();
    let giantHi, giantLo;
    { const it = PW.giantSteps({ detail: 1 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } giantHi = r.value; }
    await ctx.yield();
    { const it = PW.giantSteps({ detail: 0 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } giantLo = r.value; }
    await ctx.yield();
    // (the striding make of the giant, for the lanes' pairs: the same giant in mid-stride)
    let strideHi, strideLo;
    { const it = PW.giantSteps({ detail: 1, stride: 1 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } strideHi = r.value; }
    await ctx.yield();
    { const it = PW.giantSteps({ detail: 0, stride: 1 }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } strideLo = r.value; }
    await ctx.yield();
    const REACH = Math.max(PW.reachOf(millHi), PW.reachOf(giantHi));
    await ctx.yield();
    const height = (q) => TOP * q.scale, third = (q) => height(q) / 3;
    // ------------------------------------------------------------ what the country holds on this visit, and where its places stand along the road: each a
    // stated number of the things' own measures on from the one before; the road is as long as they make it
    const lay = RN.layout, cl = RN.close, co = RN.country, ln = RN.lane;
    // a close pair stands off the road's middle by the verge, its own farthest reach, the margin and a little (a metre and a half to three and a half: the
    // route's curve where it leaves the verge takes up to a metre of it): a line on either verge keeps the margin
    const mkPair = () => { const scale = cl.range(0.96, 1.04); return { s: 0, lat: VERGE + REACH * scale + MARGIN + cl.range(1.5, 3.5), yaw: cl.range(0.22, 0.42), scale, phase: cl.range(0, 6.28), hi: true }; };
    // THE FIRST PAIR STANDS NEAR, BESIDE THE ROAD, and we fly between its two: the mill on the verge's own hand, the giant across the road.
    // Each stands off the verge's line by its own farthest reach (the sails' whole sweep and what the wind carries of its cloth, at every
    // clock), by the lane's clearance (NEAR, 2.5 m) and by that same little more (a metre and a half to three and a half): the mill's
    // axis some 22 m from our line, its sails' sweep four to six metres off our line in plan (at the hub's height, far over the eye: in space no sail comes within ten metres of us), its cap 21 m over the eye; the giant's axis some
    // 31 m off across the road. It stands FIVE of its heights up the road from the entry, at the end of the opening's fields.
    const NEAR = 2.5;
    const p0 = mkPair(); p0.lat += NEAR - MARGIN; p0.s = 5 * height(p0);
    // (Two close pairs on every visit: this one, flown between, and the second, whose giant is rounded.)
    const closeP = [p0];
    // THE SECOND PAIR stands 4.35 to 4.9 heights on. Its giant is rounded; the leg from the verge's corner to his circle then leans 41 degrees
    // or more from the road and passes the first giant's axis by his height and his reach (46 m) or more, as every thing passed is passed.
    { const q = mkPair(); q.s = p0.s + height(q) * lay.range(4.35, 4.9); closeP.push(q); }
    const qLast = closeP[1];
    // THE LEFT LANE BEGINS where the corner off the leg ends. That corner is an arc that touches the lane's line at the lane's start. The leg
    // off the giant's circle to that arc LEANS thirty-five degrees from the road (LEAN): the arc's middle stands (the circle's radius and the
    // arc's, LANE_R) over the sine of LEAN from the giant's axis. The leg is then some 175 m long and crosses the road's middle at that
    // lean, eleven metres before the arc; THE GATE PAIR stands astride that crossing (below).
    const CORNER_MOST = 100, LANE_R = 65, LEAN = 35 * Math.PI / 180;
    const sL0 = qLast.s + Math.sqrt(((2 * height(qLast) + LANE_R) / Math.sin(LEAN)) ** 2 - (qLast.lat + LANE - LANE_R) ** 2);
    // THE GATE PAIR (stream 'gatePair'): a pair of the close pairs' make that we fly between, mill on the left hand and giant on the right,
    // astride the place where that leg crosses the road's middle. Each of its two stands off the leg by its own height and its farthest reach
    // (and half a metre to two more), as every thing passed does: so far from the road's middle as the leg's lean makes of that. The leg runs
    // straight at the gap between them for some 160 m (they leave a picture of sixteen to nine 60 m short of the crossing: a hundred metres
    // whole before us). ITS FACING IS THE PAIR'S AND THE ROAD'S ALONE: each of the two looks down the road, toward whoever comes up it, and is
    // turned in toward the road's middle by seventeen to twenty-nine degrees (drawn for the pair: the first pair's turn and a little more, as
    // these stand further from the road).
    const gp = RN.gatePair;
    const pG = (() => {
      // (the leg: the inner tangent of the giant's circle and the lane's arc, as the line lays it below)
      const scale = gp.range(0.96, 1.04), D1 = 2 * height(qLast), dx = -LANE + LANE_R - qLast.lat, ds = sL0 - qLast.s, a = Math.atan2(ds, dx) + Math.asin((D1 + LANE_R) / Math.hypot(dx, ds));
      const ux = Math.cos(a), us = Math.sin(a), ax = qLast.lat + D1 * us, as = qLast.s - D1 * ux, s = as - ax / ux * us, lat = (TOP + REACH) * scale / us + gp.range(0.5, 2);
      return { s, lat, scale, phase: gp.range(0, 6.28), yaw: gp.range(0.3, 0.5), hi: true, gate: true, legA: [ax, as], legU: [ux, us] };
    })();
    // the lanes' stations: five on each lane, one of each kind the lane holds, in an order drawn for the visit; 0.85 to 0.95 of a mill's height
    // apart (a station is a plot some eighteen metres long: a threshing floor's round and its kerb are nineteen across); the lane begins and ends
    // half a gap from its first and last station
    const stations = (s0, kinds) => { const order = ln.shuffle(kinds), gaps = order.map(() => MH * ln.range(0.85, 0.95)), out = []; let s = s0 + gaps[0] / 2;
      order.forEach((kind, i) => { if (i) s += gaps[i]; out.push({ kind, s, len: Math.min(gaps[i], gaps[i + 1] ?? gaps[0]) }); }); out.end = s + gaps[0] / 2; return out; };
    const statL = stations(sL0, ['stooks', 'floor', 'wall', 'hut', 'well']), sL1 = statL.end;
    const sBed = sL1 + 1.25 * MH, sR0 = sL1 + 2.5 * MH;                  // the crossing: two and a half mills of road from lane to lane (thirty-five degrees across the road, its two corners' arcs within it), the stream and its bridge under its middle
    const statR = stations(sR0, ['stooks', 'wall', 'well', 'hut', 'orchard']), sR1 = statR.end;
    const OUT = 4 * YARD.gate, HL = YARD.W + 2 * (YARD.moat + OUT);      // each house has an outer yard before it and one after it, four gates long, beyond the moat's arm: the pass between first and last wall (92.6 m; kept)
    const sNear = sR1 + 2 * MH, sInn = sNear + HL / 2, sFar = sNear + HL;   // from the right lane's end two mills of road to the houses' first wall
    const latInn = WALLS + YARD.D / 2;
    // THE STAND-OFF OF A TALLER THING BY THE LANES: its nearest reach is one and a half of its height from our line on the lane, the taller of the
    // mirrored two deciding for both. Height and nearest reach are read here off the things' own geometry as built (its top, and how far its
    // front stands before its middle on the side toward the road), so that a thing rebuilt taller or deeper stands further off by itself.
    const holdGeo = {}, boxOf = (g) => { if (!g.boundingBox) g.computeBoundingBox(); return g.boundingBox; };
    // (a thing's farthest reach in plan about its own middle, off its corners as built)
    const planR = (g) => { const p = g.attributes.position; let r = 0; for (let i = 0; i < p.count; i++) r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i))); return r; };
    for (const kind of ['stook', 'floor', 'hut', 'well']) { holdGeo[kind] = [PW.holdingGeometry(kind, false), PW.holdingGeometry(kind, true)]; await ctx.yield(); }
    const fullGeo = [PW.fullingGeometry({ mir: 1 }), PW.ogresGeometry({ mir: -1 })];
    await ctx.yield();
    const standOff = (geos) => Math.max(...geos.map((g) => 1.5 * boxOf(g).max.y + boxOf(g).max.z));
    const OFF_HUT = standOff(holdGeo.hut), OFF_WELL = standOff(holdGeo.well), OFF_FULL = standOff(fullGeo);
    const FLOOR_R = Math.max(boxOf(holdGeo.floor[0]).max.x, boxOf(holdGeo.floor[1]).max.x), HUT_MID = (boxOf(holdGeo.hut[0]).min.x + boxOf(holdGeo.hut[0]).max.x) / 2;
    // the further pair (fulling mill, hammering ogres) stands by that rule at its own scale
    const FS = co.range(1.15, 1.45), latFull = LANE + OFF_FULL * FS;
    const sFull = sBed - PW.FULL.wheelX * FS - 3;                        // it stands on the stream's near bank, its wheel over the water
    // the village's mouth 3.8 to 4.6 mills past the last wall (the two droves, up to forty-two metres long each, lie between them at the entry with
    // room to spare); its street 3.4 to 4.2 mills deep (the church stands two to 2.8 mills up it, and the gateway's square beyond)
    const sMouth = sFar + MH * co.range(3.8, 4.6), DV = MH * co.range(3.4, 4.2);
    const ROAD = sMouth + DV;                                            // the road ends at the gateway
    // one visit in two a late pair stands before the village as its outpost, one thing on each hand, 1.6 to two of its heights from the road's middle
    // (and no nearer than its height and its reach: a thing passed)
    const pL = mkPair(); pL.s = sMouth - MH * co.range(2.5, 4); pL.lat = Math.max(height(pL) * co.range(1.6, 2), (TOP + REACH) * pL.scale + 0.5); const hasLate = co.chance(0.5);
    // THE LANES' PAIRS (stream 'lanePairs'): two more pairs of the close pairs' make, each by a lane, at a road metre drawn in its lane's middle
    // third. Each stands off the road's middle by the lane's line, one and a half of its own heights and its own farthest reach: the nearest reach
    // of the thing on the lane's outer hand (the mill by the left lane, the giant by the right) is then 1.5 of its height from our line on the
    // lane. ITS FACING IS THE THING'S AND THE LANE'S ALONE: it stands square to its lane, turned back toward the lane's start by fifteen to
    // thirty degrees (drawn for each pair): so the giant strides toward the lane and a little down it, and the mill's door looks the same way.
    // The thing on the lane's outer hand is the full make; its twin across the road, some ninety-six metres from our line, the simple one.
    // The lanes' giants are the striding make.
    const lp = RN.lanePairs;
    const mkLanePair = (s0, s1, full) => { const scale = lp.range(0.96, 1.04), s = lerp(s0, s1, lp.range(1 / 3, 2 / 3)), lat = LANE + (1.5 * TOP + REACH) * scale;
      return { s, lat, scale, phase: lp.range(0, 6.28), yaw: Math.PI / 2 - lp.range(0.26, 0.52), full, lane: true }; };
    const pLL = mkLanePair(sL0, sL1, -1), pLR = mkLanePair(sR0, sR1, 1);
    // what the lanes' stations hold, each thing at its own offset from the lane's line (outward from the road, or inward where it says so) and mirrored
    // across the road as he sees it. A thing built to be passed close stands with its middle two of its own widths or more from our line where we pass
    // among them, AND A TENT NO NEARER OUR LINE THAN ITS OWN HEIGHT (a stook is 2 m wide and as high: the rows of the plot we fly stand
    // 5 m either side on the left lane; a pavilion is 3.4 m wide and 4.5 m to its pennon's staff: on the right lane the rows stand off by
    // its height and its reach as built, at the largest size a row's pavilion is dealt, and the 0.4 m a row wanders: PAV_ROW, some 7.5 m).
    // A taller thing stands so that its own nearest reach is one and a half of its height from our line, the taller of the mirrored two deciding
    // for both (THE STAND-OFF, above): the chapel and the hut (the chapel decides: 9.6 m high, its front 0.4 m before its middle: 14.8 m outward
    // of the lane's line as built), the fountain and the well (the fountain decides: 5 m high, its rim 2.4 m out: 9.9 m). The floor's kerb is
    // a low thing: its rim three and a half metres off, as the wall is.
    const laneHold = { stook: [], floor: [], hut: [], well: [] }, laneWalls = [], laneTreePts = [], lt = RN.laneTrees, CROWN = 4.35;
    const PAV_ROW = (boxOf(holdGeo.stook[1]).max.y + planR(holdGeo.stook[1])) * 1.15 + 0.4;
    for (const [stats, left] of [[statL, true], [statR, false]]) for (const q of stats) {
      const row = left ? 5 : PAV_ROW, step = left ? 6 : 7;
      if (q.kind === 'stooks') { for (const off of [-row, row, 2 * row + 1]) for (let v = -q.len / 2 + step / 2; v < q.len / 2; v += step) laneHold.stook.push({ lat: LANE + off + ln.range(-0.4, 0.4), s: q.s + v + ln.range(-0.5, 0.5), yaw: ln.range(0, 6.28), sc: ln.range(0.9, 1.15) }); }
      else if (q.kind === 'floor') laneHold.floor.push({ lat: LANE + 3.5 + FLOOR_R, s: q.s, yaw: 0, sc: 1 });
      else if (q.kind === 'wall') laneWalls.push({ lat: LANE + 3.5, s: q.s - q.len / 2, len: q.len });             // (a wall half a metre thick, along our line)
      else if (q.kind === 'hut') laneHold.hut.push({ lat: LANE + OFF_HUT, s: q.s - HUT_MID, yaw: 0, sc: 1 });   // (the hut and its fold lie along the road: their middle at the station's)
      else if (q.kind === 'well') laneHold.well.push({ lat: LANE + OFF_WELL, s: q.s, yaw: 0, sc: 1 });
      // (the orchard: three rows of three trees, the rows seven metres either side of our line and one more beyond; we pass between the two nearest)
      // A CROWN'S RIM STANDS ITS OWN CROWN'S WIDTH OR MORE FROM OUR LINE (the blossoming tree's crown is 4.35 m in radius at scale one, measured
      // off the tree as built: so a tree's middle stands three such radii from the lane's line). The two outer rows are grown trees (scale 0.8
      // to 1.0), 13.7 m and 25.5 m outward; the row between the lane and the road is of young trees (scale 0.44 to 0.5), 7 m inward.
      else for (const off of [-7, 13.7, 25.5]) for (const v of [-7, 0, 7]) { const ds = lt.range(-0.8, 0.8), dl = lt.range(-0.6, 0.6), sc = lt.range(0.8, 1.0);
        laneTreePts.push({ s: q.s + v + ds, lat: LANE + off + (off < 0 ? 0.5 * dl : dl), sc: off < 0 ? lerp(0.44, 0.5, (sc - 0.8) / 0.2) : sc, v: 1, rot: lt.range(0, 6.28) }); }
    }
    const inLane = (s, lat, pad) => lat < LANE + 2 * MH + pad && s > sL0 - pad && s < sR1 + pad;   // the lanes' strip: the stations and two mills out

    // ------------------------------------------------------------ sky, light, air
    // THE SUN: a small warm disc in a wide warm bloom, by the sky kit's own means: a disc under a degree in radius takes the kit's
    // skirt of light about it and is not burnt white; the glow about it is the kit's whole strength (its tight lobe a little wider).
    const skyOpts = {
      golden: { preset: 'goldenHour', sunSize: 0.85, sunColor: '#ffb866', sunGlow: 1.0, sunGlowTight: 0.35, scatter: 0.8, lightColor: '#ffd7a6', ambientColor: '#aebde6' },
      dawn: { preset: 'dawn', sunSize: 0.85, sunGlow: 1.0, sunGlowTight: 0.35 },
      day: { preset: 'day', sunSize: 0.9, horizon: '#b9d2ea' },
      night: { preset: 'night', bake: true, renderer: ctx.renderer, bodies: [{ elevation: 12, azimuth: sunAz, size: 5.2, phase: 1, color: '#fff3d6', texture: 0.45, intensity: 1.2, glow: 0.35, glowColor: '#b8c8ff', glowSize: 3.5 }], key: 0, milkyWay: 0.5, lightIntensity: 1.5, ambientIntensity: 2.4 },
    }[hour] || { preset: 'goldenHour' };
    const sky = makeSky({ rng: RN.sky, ...skyOpts, sunElevation: night ? -30 : sunEl, sunAzimuth: sunAz, lightElevationMin: 15,
      clouds: false, clouds2: { coverage: 0.3 + 0.25 * cloudK, opacity: 0.4, stretch: 0 } });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { shadow: true, shadowSize: 2048, shadowRange: 125, distance: 260, ambient: night ? 1.25 : hour === 'day' ? 1.25 : 1.9, bounce: 0.55, intensity: night ? 1.2 : hour === 'day' ? 0.7 : 1.05 });
    scene.add(rig.object);
    const fogCol = sky.fogColor.clone().lerp(sky.horizonColor, 0.4);
    scene.fog = new THREE.FogExp2(fogCol, 0.00072 * haze);
    const sunDir = sky.lightDirection.clone().normalize();

    const kit = PW.makeKit(ctx, { windRng: RN.wind }), U = kit.U;   // (the wind's two swells begin where stream 'wind' draws them)
    U.uSunDir.value.copy(sunDir); U.uSunCol.value.copy(sky.lightColor).multiplyScalar(night ? 0.8 : 1.5);
    U.uSkyCol.value.copy(sky.zenithColor).lerp(sky.horizonColor, 0.25); U.uHorCol.value.copy(sky.horizonColor); U.uNight.value = night ? 1 : 0;
    U.uGndCol.value.setRGB(PAL.dust[0] * 0.4, PAL.dust[1] * 0.4, PAL.dust[2] * 0.4);
    if (night) U.uShade.value.setRGB(0.02, 0.03, 0.12);
    await ctx.yield();


    // ------------------------------------------------------------ the land: one country under both sides. Long low swells that the road dips and rises over; a low
    // ridge across the plain two heights past the last close pair (the country's holdings lie beyond it); a stream that the road bridges between the two
    // lanes (dry on the left, bright water on the right); level ground where the two houses, the further pair and the village stand; a ditch either
    // side of the road beyond its verge
    const ld = RN.land, swPh = [ld.range(0, 6.28), ld.range(0, 6.28), ld.range(0, 6.28)], bedPh = ld.range(0, 6.28);
    const sRidge = sL0 - height(qLast);
    const bedZ = (x) => -sBed + 9 * Math.sin(x * 0.017 + bedPh) * smoothstep(30, 120, Math.abs(x));   // (straight where it passes the road and the further pair's wheel)
    const inBed = (x, z, w) => Math.abs(z - bedZ(x)) < w;
    const rawLand = (x, z) => {
      const d = z + sRidge + 40 * (1 - Math.cos(Math.min(Math.abs(x), 520) * 0.006));
      return 4.0 * Math.sin(z * 0.0165 + x * 0.004 + swPh[0]) + 2.0 * Math.sin(z * 0.037 - x * 0.011 + swPh[1]) + 1.5 * Math.sin(x * 0.019 + z * 0.008 + swPh[2])
        + (3 + 15 * smoothstep(30, 220, Math.abs(x))) * Math.exp(-d * d / 4900);
    };
    const sVil = sMouth + DV / 2, land0 = rawLand(0, -sInn), levelF = rawLand(0, -sFull) - land0, levelV = rawLand(0, -sVil) - land0, levelE = rawLand(-VERGE, 0) - land0;
    const shelf = (x, z, cz, hx, hz, fall) => { const qx = Math.abs(x) - hx, qz = Math.abs(z - cz) - hz; return 1 - smoothstep(0, fall, Math.hypot(Math.max(qx, 0), Math.max(qz, 0))); };
    // THE RELIEF (stream 'relief'): the plain rolls. On the long swells above stand RISES, each a smooth mound with a long axis turned as it is
    // drawn: one begun to every 45 to 75 m of road on each hand, its middle 30 to 220 m from the road's middle, 80 to 200 m long and 0.65 of
    // that wide, three metres high (the shortest) to eight (the longest); its sides slope some twelve degrees at most. One in three lies ACROSS THE
    // ROAD instead (its middle within twenty metres of the road's): the low kind, three to four metres high, 160 to 200 m along the road and
    // 130 to 200 across, so that the road climbs it and dips again at four and a half degrees or less. THE GROUND WE FLY OFF THE ROAD (the opening, to
    // the left lane's start: 70 m to the left of the road and to the far side of the giant's circle on the right) takes only the low kind:
    // our line follows the land's height. No rise reaches the level ground of the entry, the two houses, the further pair or the village,
    // the stream's banks, or the lanes' strip.
    const rl = RN.relief, mounds = [];
    { const D1 = 2 * height(qLast), shut = (x, s, r) => (s < 70 + 50 + r && Math.abs(x) < 12 + 50 + r) || (Math.abs(s - sInn) < HL / 2 + 56 + r && Math.abs(x) < latInn + YARD.D / 2 + YARD.moat + 56 + r)
        || (Math.abs(s - sFull) < 60 + r && Math.abs(x) < latFull + 52 + r) || (s > sVil - DV / 2 - 80 - r && Math.abs(x) < 170 + r) || Math.abs(s - sBed) < 26 + r || inLane(s, Math.abs(x), r);
      for (const side of [-1, 1]) for (let s = -40 + rl.range(0, 45); s < sMouth; s += rl.range(45, 75)) {
        const len = rl.range(80, 200), across = rl.chance(1 / 3), x = across ? rl.range(-20, 20) : side * rl.range(30, 220), turn = rl.range(0, Math.PI), k = rl.range(0.9, 1.1), w = rl.range(0, 1);
        const low = across || (s > 70 - len / 2 && s < sL0 + len / 2 && x > -70 - len / 2 && x < qLast.lat + D1 + 30 + len / 2);
        // (the low kind lies with its axes along and across the road: a, across it; b, along it)
        const m = low ? { x, z: -s, c: 1, s: 0, a: lerp(65, 100, w), b: lerp(80, 100, (len - 80) / 120), h: lerp(3, 4, k * 5 - 4.5) } : { x, z: -s, c: Math.cos(turn), s: Math.sin(turn), a: len / 2, b: 0.65 * len / 2, h: lerp(3, 8, (len - 80) / 120) * k };
        m.r = Math.max(m.a, m.b);
        if (!shut(x, s, m.r)) mounds.push(m);
      } }
    const relief = (x, z) => { let y = 0; for (const m of mounds) { const dx = x - m.x, dz = z - m.z; if (Math.abs(dx) > m.r || Math.abs(dz) > m.r) continue; const u = (dx * m.c + dz * m.s) / m.a, v = (dz * m.c - dx * m.s) / m.b, q = 1 - u * u - v * v; if (q > 0) y += m.h * q * q; } return y; };
    // the land with its level places: the two houses', the further pair's, the village's; and THE ENTRY'S: the first seventy metres of the road
    // and its verges lie level, AND ALL THE WAY BACK BEHIND THE ENTRY TO THE SHEET'S END (the eye that comes to this world through a ring
    // flies the entry's straight continued back, level, at the entry's height, and looks through the ring from far behind the entry: the
    // ground under that straight is the entry's own level as far back as there is ground, so the lens is a rider's eye over it all the way
    // and never under the land), easing into the land over fifty. (The level place is one box from seventy metres up the road to 280 m
    // behind the entry: forward of seventy metres behind the entry it is the same ground as a box of seventy either way.)
    const land1 = (x, z) => {
      let y = lerp(rawLand(x, z) + relief(x, z) - land0, 0, shelf(x, z, -sInn, latInn + YARD.D / 2 + YARD.moat + 6, HL / 2 + 6, 50));
      y = lerp(y, levelE, shelf(x, z, 105, 12, 175, 50));
      y = lerp(y, levelF, shelf(x, z, -sFull, latFull + 12, 20, 40));
      return lerp(y, levelV, shelf(x, z, -sVil, 120, DV / 2 + 30, 50));
    };
    // EVERY CLOSE THING STANDS ON LEVEL GROUND OF ITS OWN: within nine metres of its axis (times its scale: wider than a giant's stride) the
    // ground is level at the height under its axis, easing into the land over sixteen metres more
    const pads = [...closeP, pG, pLL, pLR, ...(hasLate ? [pL] : [])].flatMap((q) => [-1, 1].map((side) => ({ x: side * q.lat, z: -q.s, r: 9 * q.scale, y: land1(side * q.lat, -q.s) })));
    // the ground without the stream bed: what the road's bridge and the flight go by
    const landAt = (x, z) => {
      let y = land1(x, z);
      for (const p of pads) { const dx = x - p.x, dz = z - p.z, R = p.r + 16; if (Math.abs(dx) < R && Math.abs(dz) < R) y = lerp(p.y, y, smoothstep(p.r, R, Math.hypot(dx, dz))); }
      return y;
    };
    const moatC = { x: latInn, z: -sInn, a: YARD.D / 2, b: YARD.W / 2 };   // half sizes: a across the road's direction (x), b along it (z)
    // how deep the moat is dug at a place (it lies about the castle, wherever the castle stands: the ground's shader digs it on the castle's side)
    const moatDig = (x, z) => {
      const qx = Math.abs(Math.abs(x) - moatC.x) - moatC.a, qz = Math.abs(z - moatC.z) - moatC.b, sd = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
      return sd < YARD.moat + 0.5 ? 1.9 * smoothstep(-3.5, -1.5, sd) * (1 - smoothstep(YARD.moat - 2.0, YARD.moat, sd)) : 0;
    };
    // (the land's own height at a place: what the ground sheet's corners are set at; nothing stands by it but the sheet)
    const landH = (x, z) => {
      const ax = Math.abs(x);
      let y = landAt(x, z);
      // the stream's bed: banks that fall a pace and a half to a flat floor five metres wide, the whole way across the plain
      const bd = Math.abs(z - bedZ(x)); if (bd < 8) y -= 2.4 * (1 - smoothstep(2.5, 6.5, bd)) * (1 - smoothstep(700, 1100, ax));
      // the ditch: half a metre deep, a metre and a half either way, along the verge's far edge; not before the two houses (the moat and the inn's lane lie there) nor in the street
      const dd = Math.abs(ax - DITCH); if (dd < 1.5 && !(-z > sNear - 6 && -z < sFar + 6) && -z < sMouth - 6) y -= 0.5 * (1 - dd / 1.5);
      const far = smoothstep(120, 560, ax);
      if (far > 0) y += far * (4 + 13 * (0.5 + 0.5 * noise.fbm2(x * 0.0023 + 7.1, z * 0.0023 - 3.3, 3))) + smoothstep(700, 1700, ax) * 26 * (0.5 + 0.5 * noise.n2(x * 0.0008 + 2, z * 0.0008));
      y += smoothstep(ROAD + 300, ROAD + 1700, -z) * 10;
      return y;
    };
    // THE DRAWN GROUND IS THE GROUND. The ground is one wide sheet of triangles whose corners stand on the land at the lines below (and
    // a finer level piece about the two houses). Between its lines the sheet is flat, and the land is not: so NOTHING STANDS BY THE LAND'S
    // OWN HEIGHT. hAt(x, z) is the height of the sheet itself at a place, on the very triangle that is drawn there, and every thing,
    // flower, beast, pool of light and tuft stands by it; our line is laid over lineAt, the higher of it and the land without the
    // stream's bed and the ditch (the bridge's road), so the line is as high over the ground we see as its rule says.
    const xs = [0], zs = [];
    const patch = [moatC.x - moatC.a - YARD.moat - 2.5, moatC.z - moatC.b - YARD.moat - 2.5, moatC.x + moatC.a + YARD.moat + 2.5, moatC.z + moatC.b + YARD.moat + 2.5];
    xs.push(2.5, 4.4, 6, DITCH, 9, 11.5);                         // (the road, its edge, the ditch's near lip, its bed, its far lip)
    for (let x = 14, st = 6; x < 2400; x += st, st *= x < 90 ? 1.0 : 1.3) xs.push(x);
    // (THE GROUND HAS NO HOLE AT THE TWO HOUSES. The wide sheet is sunk under the finer piece laid where the moat is dug, and only
    // there: it has a row and a column on each edge of that piece, at the land's own height, so that outside the piece's edges it
    // stands on the land and no trench shows across the verges past the houses.)
    if (!xs.some((x) => Math.abs(x - patch[2]) < 0.05)) { xs.push(patch[2]); xs.sort((a, b) => a - b); }
    const xall = xs.slice(1).reverse().map((v) => -v).concat(xs);
    // rows every 15 m to well past the portal, every 2.4 m where the stream bed crosses the road, then widening to the horizon
    const zEnd = -(ROAD + 380), zb0 = -sBed + 22, zb1 = -sBed - 22;
    for (let z = 270; z > zEnd; z -= 15) if (z > zb0 || z < zb1) zs.push(z);
    for (let z = zb0; z >= zb1; z -= 2.4) zs.push(z);
    for (const z of [patch[1], patch[3]]) if (!zs.some((v) => Math.abs(v - z) < 0.05)) zs.push(z);
    zs.sort((a, b) => b - a);
    for (let z = zEnd - 15, st = 20; z > -3300; z -= st, st *= 1.25) zs.push(z);
    const gNX = xall.length, gNZ = zs.length, gH = new Float32Array(gNX * gNZ);
    for (let j = 0; j < gNZ; j++) { for (let i = 0; i < gNX; i++) gH[j * gNX + i] = landH(xall[i], zs[j]); if (j % 12 === 11) await ctx.yield(); }
    const hAt = (x, z) => {
      const ax = Math.abs(x);
      if (ax >= patch[0] && ax <= patch[2] && z >= patch[1] && z <= patch[3]) return landH(x, z);   // (the finer piece about the two houses: level ground)
      const xc = clamp(x, xall[0], xall[gNX - 1]), zc = clamp(z, zs[gNZ - 1], zs[0]);
      let i = 0, i1 = gNX - 1; while (i1 - i > 1) { const m = (i + i1) >> 1; if (xall[m] <= xc) i = m; else i1 = m; }
      let j = 0, j1 = gNZ - 1; while (j1 - j > 1) { const m = (j + j1) >> 1; if (zs[m] >= zc) j = m; else j1 = m; }
      // (the cell's two triangles as the sheet lays them: its diagonal runs from the corner at the lower x and higher z to the opposite one)
      const u = (xc - xall[i]) / (xall[i + 1] - xall[i]), v = (zs[j] - zc) / (zs[j] - zs[j + 1]), a = gH[j * gNX + i], b = gH[j * gNX + i + 1], c = gH[(j + 1) * gNX + i + 1], d = gH[(j + 1) * gNX + i];
      return u >= v ? a + u * (b - a) + v * (c - b) : a + u * (c - d) + v * (d - a);
    };
    const lineAt = (x, z) => Math.max(landAt(x, z), hAt(x, z));
    await ctx.yield();
    // PUDDLES LIE ONLY WHERE THE ROAD AS DRAWN IS ALL BUT LEVEL. The ground's shader tells the road off in lengths of 7.5 m (PUD_LEN) on
    // either hand of its middle; a length may hold a puddle only if, over the whole of it, the drawn ground under the ruts (walked every
    // half metre at three places across the rut's wander) falls or rises less than two degrees (PUD_FALL, its tangent). The table has one
    // texel a length and hand, from PUD_K0 lengths behind the entry (the ground's near end) on up the road; beyond it no puddle lies.
    // Which of the level lengths hold one goes by a number drawn for the visit (stream 'puddles', handed to the shader in uBed.z).
    // (The shader's own lines carry the same three numbers: the length, the lengths behind the entry and the table's width.)
    const PUD_LEN = 7.5, PUD_FALL = Math.tan(2 * Math.PI / 180), PUD_N = 256, PUD_K0 = 36, pudPx = new Uint8Array(PUD_N * 2 * 4);
    for (let side = 0; side < 2; side++) for (let k = 0; k < PUD_N; k++) { const z0 = (PUD_K0 - k) * PUD_LEN, sx = side ? 1 : -1; let level = true;
      for (let z = z0; level && z < z0 + PUD_LEN - 0.01; z += 0.5) for (const x of [0.2, 0.78, 1.4]) if (Math.abs(hAt(sx * x, z + 0.5) - hAt(sx * x, z)) >= 0.5 * PUD_FALL) { level = false; break; }
      pudPx[(side * PUD_N + k) * 4] = level ? 255 : 0; }
    const pudTex = new THREE.DataTexture(pudPx, PUD_N, 2, THREE.RGBAFormat); pudTex.magFilter = pudTex.minFilter = THREE.NearestFilter; pudTex.needsUpdate = true;
    await ctx.yield();
    const GU = {
      uTime: U.uTime, uNight: U.uNight, uSkyCol: U.uSkyCol, uHorCol: U.uHorCol, uSeason: { value: seasonId }, uSunXZ: { value: new THREE.Vector2(0, -1) },
      uPlace: { value: new THREE.Vector4(sNear - 6, sFar + 6, sMouth - 6, 0) }, uVil: { value: new THREE.Vector4(sMouth, ROAD + 12, 104, 0) },   // (where the ditch is not; the village's ground)
      uRoadCol: { value: new THREE.Color(...mulc(PAL.road, hour === 'day' ? 0.7 : 0.78)) }, uDust: { value: new THREE.Color(...mulc(mixc(PAL.dust, [0.5, 0.56, 0.46], 0.38), 0.72)) },
      uStubble: { value: new THREE.Color(...mulc(mixc(PAL.stubble, [0.36, 0.4, 0.3], 0.38), 0.8)) }, uGreenA: { value: new THREE.Color(0.025, 0.13, 0.065) }, uGreenB: { value: new THREE.Color(0.1, 0.29, 0.07) },
      uWet: { value: new THREE.Color(0.05, 0.1, 0.06) }, uMoat: { value: new THREE.Vector4(moatC.x, moatC.z, moatC.a, moatC.b) }, uBed: { value: new THREE.Vector4(sBed, bedPh, Math.floor(RN.puddles() * 4096), 0) }, uPud: { value: pudTex },
    };
    let groundCells = null;
    {
      // (the ground's own triangles that reach into a square of the plan, as the wide sheet lays them: what a pool of light lies on)
      groundCells = (x0, x1, z0, z1) => {
        const out = [];
        for (let j = 0; j < zs.length - 1; j++) {
          if (zs[j + 1] >= z1 || zs[j] <= z0) continue;
          for (let i = 0; i < xall.length - 1; i++) {
            if (xall[i + 1] <= x0 || xall[i] >= x1) continue;
            const xa = xall[i], xb = xall[i + 1], za = zs[j], zb = zs[j + 1], ya = landH(xa, za), yc = landH(xb, zb);
            out.push(xa, ya, za, xb, landH(xb, za), za, xb, yc, zb, xa, ya, za, xb, yc, zb, xa, landH(xa, zb), zb);
          }
        }
        return out;
      };
      const ln = new THREE.Vector3(sunDir.x * 0.9, 0.5, sunDir.z * 0.9).normalize();   // the low sun rakes stalks and clods: light the ground as if it leaned toward it
      const sheet = async (xa, za, sink, dig, pre) => {
        const nx = xa.length, nz = za.length, pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), hh = new Float32Array(nx * nz), idx = [];
        for (let j = 0; j < nz; j++) {
          for (let i = 0; i < nx; i++) {
            const k = (j * nx + i) * 3, x = xa[i], z = za[j], h = pre ? pre[j * nx + i] : landH(x, z);
            hh[j * nx + i] = h; pos[k] = x; pos[k + 1] = sink && Math.abs(x) > patch[0] + 0.5 && Math.abs(x) < patch[2] - 0.5 && z > patch[1] + 0.5 && z < patch[3] - 0.5 ? -3.2 : h; pos[k + 2] = z;
          }
          if (j % 12 === 11) await ctx.yield();
        }
        // the swells take the light: each place leans as its own slope does, a little more than true so that a low rise reads under a low sun
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
          const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nx - 1), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nz - 1), k = (j * nx + i) * 3;
          const dx = (hh[j * nx + i1] - hh[j * nx + i0]) / (xa[i1] - xa[i0]), dz = (hh[j1 * nx + i] - hh[j0 * nx + i]) / (za[j1] - za[j0]);
          const ax = ln.x - 2.2 * clamp(dx, -0.5, 0.5), az = ln.z - 2.2 * clamp(dz, -0.5, 0.5), il = 1 / Math.hypot(ax, ln.y, az);
          nor[k] = ax * il; nor[k + 1] = ln.y * il; nor[k + 2] = az * il;
        }
        await ctx.yield();
        for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx; idx.push(a, b, c, a, c, d); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
        if (dig) {                                                     // how deep the moat is dug here and how its bank slopes: the shader digs it where the castle stands
          const dg = new Float32Array(nx * nz * 3);
          for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3, x = xa[i], z = za[j]; dg[k] = moatDig(x, z); dg[k + 1] = clamp((moatDig(x + 0.4, z) - moatDig(x - 0.4, z)) / 0.8, -0.5, 0.5); dg[k + 2] = clamp((moatDig(x, z + 0.4) - moatDig(x, z - 0.4)) / 0.8, -0.5, 0.5); }
          g.setAttribute('aDig', new THREE.BufferAttribute(dg, 3));
        }
        return g;
      };
      const gmat = makeGroundMaterial(GU);
      const gmain = await sheet(xall, zs, true, false, gH); gmain.setAttribute('aDig', new THREE.BufferAttribute(new Float32Array(gmain.attributes.position.count * 3), 3));
      const ground = new THREE.Mesh(gmain, gmat); ground.receiveShadow = true; ground.frustumCulled = false; scene.add(ground);
      // a finer piece of the same ground where the moat is dug about the castle, and its twin across the road under the inn (level ground, nothing dug)
      const px = [], pz = []; for (let x = patch[0]; x < patch[2] + 0.01; x += (patch[2] - patch[0]) / 26) px.push(x); for (let z = patch[3]; z > patch[1] - 0.01; z -= (patch[3] - patch[1]) / 28) pz.push(z);
      // (the two pieces are one mesh, with the sphere of the two houses' ground)
      { const a = await sheet(px, pz, false, true), b = await sheet(px.map((x) => -x).reverse(), pz, false, true), g = new THREE.BufferGeometry(), na = a.attributes.position.count;
        for (const k of Object.keys(a.attributes)) { const A = a.attributes[k].array, B = b.attributes[k].array, arr = new Float32Array(A.length + B.length); arr.set(A); arr.set(B, A.length); g.setAttribute(k, new THREE.BufferAttribute(arr, a.attributes[k].itemSize)); }
        const ia = a.index.array, ib = b.index.array, idx = new Uint32Array(ia.length + ib.length); idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + na;
        g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); g.boundingSphere.radius += 3;
        const dug = new THREE.Mesh(g, gmat); dug.receiveShadow = true; scene.add(dug); }
    }
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: RN.ridges, layers: 3, radius: [1900, 3300], height: [40, 150], base: -10, jagged: 0.35, coverage: 0.7, fog: scene.fog, sunDir, sunColor: sky.lightColor, sunIntensity: 0.8, rim: 0.45,
      colorNear: night ? '#1a2440' : '#7d7390' });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ the two flocks / the two hosts: droves along the roadside, ten metres wide, as long as
    // their count needs at two and a half sheep lengths (2.8 m) a head. Their nearest edge is nine metres from the road's middle: a banner streams
    // 3.8 m toward us and keeps two and a half soldier widths more. THEY STAND WHERE THE LENGTHS PUT THEM FOR THE WHOLE VISIT:
    // a flock halted and grazing on the verge, a host drawn up across the road from it; the rear drove's tail a rank's depth beyond the
    // houses' last wall, the front drove's head at the street's mouth. What moves in them goes on the world clock, each on a round of its
    // own (see moveCrowds). PASTURE: the ground two and a half mills (52 m) up the road from a drove is its pasture, grazed bare: no field
    // is tilled on it and nothing of the street stands on it.
    // Forty head to a drove at the visit's mean density, thirty to forty-eight (two droves of that length fit between the last wall and the mouth).
    const nHead = clamp(40 * dens, 30, 48), CELL = 2.8, PASTURE = 2.5 * MH, DROVE = 5, CROWD_IN = 9;
    const TAIL = 0.6 + CELL;                                             // (the last wall's piers stand 0.6 m proud of its middle line; a rank's depth beyond that the rear drove's tail begins: its dog's round, two metres wider, clears the piers)
    const groups = [0, 1].map(() => ({ a: DROVE, b: nHead * CELL * CELL / (3.6 * DROVE), lat: CROWD_IN + DROVE, s: 0, s0: 0 }));
    groups[0].s0 = sFar + TAIL + groups[0].b; groups[1].s0 = sMouth - groups[1].b; for (const G of groups) G.s = G.s0;
    const inCrowd = (s, lat) => s > sFar - 6 && s < ROAD + 20 && lat < CROWD_IN + 2 * DROVE + 6;   // their ground: the roadside from the last wall to the gateway
    const closeAll = [...closeP, pG, pLL, pLR, ...(hasLate ? [pL] : [])];
    // THE OPENING'S TWO SMALL DROVES (stream 'fieldFlock'): a flock of twenty-four on the plain hand with its shepherd and its dog, and in the
    // same place across the road a company of foot with its banner and its hound, in the droves' make. THEY STAND WHERE THEY STAND for the
    // whole visit, as the droves by the village do (the flock grazing, each beast on its own round on the world clock; the company drawn
    // up). One stands in the near stubble before the first pair, its middle 19 m from the road's middle and forty metres short of the
    // pair (its last beast is twenty-nine metres short of the mill's axis: fourteen clear of the sails' sweep): nine to nineteen metres
    // from the verge's line on the flock's hand, nineteen to twenty-nine on the company's; the mill and the giant stand in its pasture.
    // The other stands by the road two of his heights past the rounded giant (its middle 19 m from the road's middle). Each is
    // ten metres wide and twenty-one long. No field is laid on its ground nor on its pasture (PASTURE, up the road from it).
    const FD_A = 5, FD_B = 10.5, fdroves = [{ lat: 19, s0: p0.s - 40 }, { lat: 19, s0: qLast.s + 2 * height(qLast) }];
    const onDroveWay = (s, lat0, lat1, pad) => fdroves.some((G) => lat1 > G.lat - FD_A - pad && lat0 < G.lat + FD_A + pad && s > G.s0 - FD_B - pad && s < G.s0 + FD_B + PASTURE + pad);
    // ------------------------------------------------------------ THE FLIGHT. The road is the seam and runs straight; the flight is never on its middle
    // before the two houses: it crosses it. Its rules, each alike for every thing of a kind (heights are above the ground under the route, at every
    // knot; knots a mill's height apart on straights):
    //   ENTRY     on the mill's verge (4.8 m left of the road's middle) at a rider's eye; the first pair five of its heights up the road.
    //   VERGE     straight up that verge, between the first pair's two, to a sail's length past them.
    //   ROUNDING  the second pair's giant is rounded on his far side, on a circle about his axis of twice his own height, at a third of
    //             his height; the route comes to the circle and leaves it along tangents that cross the road (from the verge's end by a
    //             corner's arc).
    //   LANES     off the circle along a tangent that leans back across the road through the gate pair's gap, down to a hay cart's height, onto an arc that ends on the left lane's line where the lane
    //             begins (see THE LEFT LANE BEGINS, above); the left lane (18 m left of the road's middle) past its five stations; across the road
    //             and the stream's bridge to the right lane, two and a half mills of road on; the right lane past its five; then to the road's
    //             middle at the houses' first wall, two mills on, rising to twice the inn's yard wall. Every corner of these is an arc.
    //   HOUSES    the road's middle between the fronts (WALLS, 12 m, from each), at twice the inn's yard wall, from the first wall to the last (kept).
    //   WAY IN    up the road's middle from the houses' last wall, rising evenly from twice the inn's yard wall to the height of the ring's
    //             centre, which it has reached LEVEL_END (84 m) before the ring.
    //   STREET    up the street's middle, level at the height of the ring's centre: the last sixty metres to the ring are straight and level.
    //   HEIGHT    the line's height is not bent at a knot: see THE LINE'S HEIGHT, below.
    // The road's middle is our line only from the houses' first wall on (the pass between the two houses, the way in and the street).
    const rounds = closeP.slice(1).map((q, i) => { const side = i % 2 ? -1 : 1; return { q, side, D: 2 * height(q), cx: side * q.lat, cs: q.s, ccw: side > 0, h: third(q) }; });
    const wv = [], marks = {}, TAU = Math.PI * 2;
    const K = (x, h, sAt) => { wv.push([x, lineAt(x, -sAt) + h, -sAt, h]); return wv[wv.length - 1]; };   // (a knot: its place, and h, the height over the ground its rule gives it)
    // THE LINE is made of three things only: straights (knots a mill's height apart, the height above the ground going evenly), the circles about
    // the things we round, and at every corner between two straights an ARC that touches both. Its knots lie on that arc; the line itself is the
    // engine's curve through the knots, which near an arc's two ends bends a little more sharply than the arc (so the turn there is somewhat
    // more than our speed over the arc's radius: the turn as flown is the true figure). Every corner's radius is worked from the pace
    // there: the larger of our fastest speed on the arc over TURN_RATE (0.42 radians, twenty-four degrees, a second) and of what makes the
    // corner last TURN_MIN (1.6 s by the pacing's own speeds: that speed times 1.6 s over the angle it turns; by the engine's table of the
    // pacing, which is a little quicker, the shorter corners last a second and a quarter to a second and a half by the line's own heading in plan, and the look, which the engine eases, takes two seconds and more over each); never under LEAST_R (40 m) nor over
    // CORNER_MOST (100 m), nor more than its two straights have room for. The corner onto the left lane alone is not worked so: its arc
    // is LANE_R (65 m), which the lane's start and the gate pair's place are laid by; at the pace there it turns some twenty-one degrees a
    // second for a second and a half or more. The line is laid twice: once with the least radius, to learn the speeds from the pacing; then with each
    // corner's own.
    const LEAST_R = 40, TURN_RATE = 0.42, TURN_MIN = 1.6;
    // (the last sixty metres to the ring are level; before them the half length of a bend in height at the way in's pace, some eighteen
    // metres, and six more)
    const LEVEL_END = 60 + 24;
    // THE LINE'S HEIGHT OVER THE BRIDGE is read off the bridge as built: the top of its box above the road and two and a half metres, on the
    // whole straight of the crossing (the two corners' arcs carry the rise and the fall from and to the cart's height, some 34 m each).
    const BRIDGE = boxOf(PW.propsGeometry([{ kind: 'bridge', x: 0, y: 0, z: 0 }])), OVER = Math.max(CART, BRIDGE.max.y + 2.5);
    let at = [-VERGE, 0, RIDER];                                         // where the line stands: x, road metre, height above the ground
    const to = (x, s, h) => { const n = Math.max(1, Math.round(Math.hypot(x - at[0], s - at[1]) / MH)); for (let i = 1; i <= n; i++) K(lerp(at[0], x, i / n), lerp(at[2], h, i / n), lerp(at[1], s, i / n)); at = [x, s, h]; return wv[wv.length - 1]; };
    // (an arc about a centre from where the line stands, through da radians, counter-clockwise positive in the plane x, s; a knot every fifteen degrees or less)
    const arc = (cx, cs, R, da, h) => { const a0 = Math.atan2(at[1] - cs, at[0] - cx), n = Math.max(1, Math.ceil(Math.abs(da) / (Math.PI / 12)));
      for (let j = 1; j <= n; j++) { const a = a0 + da * j / n; K(cx + R * Math.cos(a), lerp(at[2], h, j / n), cs + R * Math.sin(a)); }
      at = [cx + R * Math.cos(a0 + da), cs + R * Math.sin(a0 + da), h]; return wv[wv.length - 1]; };
    // (the corner at P, between the straight the line is on and the straight from P toward B: how far it turns, and the arc's tangent length for a radius)
    const bend = (ax, as, px, ps, bx, bs) => { const ux = px - ax, us = ps - as, vx = bx - px, vs = bs - ps; return Math.atan2(ux * vs - us * vx, ux * vx + us * vs); };
    // (v: our fastest speed on it, when the pacing has been learnt; h0: the height at the arc's start, where it is not on the way from the last knot's to hp)
    const corner = (px, ps, hp, bx, bs, v, h0) => {
      const ux = px - at[0], us = ps - at[1], ul = Math.hypot(ux, us), dth = bend(at[0], at[1], px, ps, bx, bs), half = Math.tan(Math.abs(dth) / 2);
      if (half < 0.01) { const k = to(px, ps, hp); return [k, k]; }
      const R = v == null ? LEAST_R : clamp(Math.max(v / TURN_RATE, TURN_MIN * v / Math.abs(dth)), LEAST_R, CORNER_MOST);
      const t = Math.min(R * half, ul - 1, Math.hypot(bx - px, bs - ps) / 2), r = t / half, sg = Math.sign(dth);
      const k1 = to(px - ux / ul * t, ps - us / ul * t, h0 ?? lerp(at[2], hp, 1 - t / ul));
      return [k1, arc(at[0] - us / ul * r * sg, at[1] + ux / ul * r * sg, r, dth, hp)];
    };
    // (in the plane x, s) the point where the tangent from a place meets a thing's circle, flown round it in the sense given; and the inner common
    // tangent of two circles flown in opposite senses
    const tanFrom = (px, ps, r, ccw) => { const dx = r.cx - px, ds = r.cs - ps, d = Math.hypot(dx, ds), a = Math.atan2(ds, dx) + (ccw ? -1 : 1) * Math.asin(r.D / d), L = Math.sqrt(d * d - r.D * r.D); return [px + L * Math.cos(a), ps + L * Math.sin(a)]; };
    const inner = (r1, r2) => { const dx = r2.cx - r1.cx, ds = r2.cs - r1.cs, d = Math.hypot(dx, ds), k = r1.ccw ? 1 : -1, a = Math.atan2(ds, dx) + k * Math.asin((r1.D + r2.D) / d), ux = Math.cos(a), us = Math.sin(a);
      return [[r1.cx + k * r1.D * us, r1.cs - k * r1.D * ux], [r2.cx - k * r2.D * us, r2.cs + k * r2.D * ux]]; };
    const sOpen = p0.s + SK.sailR * p0.scale;
    await ctx.yield();
    const rLast = rounds[rounds.length - 1];
    const layLine = (RR) => {
    wv.length = 0; at = [-VERGE, 0, RIDER];
    // the corner onto the left lane is an arc that touches the lane's line at the lane's start, flown in the sense opposite to the last circle's;
    // the leg between them is the two circles' inner tangent
    const rc = { cx: -LANE + LANE_R, cs: sL0, D: LANE_R, ccw: false }, [legA, legB] = inner(rLast, rc);
    rounds.forEach((r, i) => {
      if (i === 0) r.tin = tanFrom(-VERGE, sOpen, r, r.ccw);
      if (i < rounds.length - 1) { const [a, b] = inner(r, rounds[i + 1]); r.tout = a; rounds[i + 1].tin = b; } else r.tout = legA;
    });
    K(-VERGE, RIDER, 0);
    const cOpen = corner(-VERGE, sOpen, RIDER, rounds[0].tin[0], rounds[0].tin[1], RR.open); marks.openIn = cOpen[0]; marks.open = cOpen[1];
    for (const r of rounds) {
      r.kIn = wv[wv.length - 1];
      r.kT = to(r.tin[0], r.tin[1], r.h);
      const a0 = Math.atan2(r.tin[1] - r.cs, r.tin[0] - r.cx), a1 = Math.atan2(r.tout[1] - r.cs, r.tout[0] - r.cx);
      const da = r.ccw ? ((a1 - a0) % TAU + TAU) % TAU : -(((a0 - a1) % TAU + TAU) % TAU);
      r.kOut = arc(r.cx, r.cs, r.D, da, r.h); r.arc = Math.abs(da) * r.D;
    }
    marks.turn = to(legB[0], legB[1], lerp(rLast.h, CART, 0.5));
    { const a0 = Math.atan2(legB[1] - rc.cs, legB[0] - rc.cx), a1 = rc.ccw ? 0 : Math.PI;
      marks.turnOut = marks.lane = arc(rc.cx, rc.cs, rc.D, rc.ccw ? ((a1 - a0) % TAU + TAU) % TAU : -(((a0 - a1) % TAU + TAU) % TAU), CART); }
    const cEnd = corner(-LANE, sL1, OVER, LANE, sR0, RR.end, CART); marks.laneEnd = cEnd[0]; marks.endOut = cEnd[1];
    const cRight = corner(LANE, sR0, CART, LANE, sR1, RR.right, OVER); marks.rightIn = cRight[0]; marks.cross = cRight[1];
    const cOff = corner(LANE, sR1, CART, 0, sNear, RR.off); marks.rlaneEnd = cOff[0]; marks.offOut = cOff[1];
    const cWall = corner(0, sNear, YARD_H, 0, sFar, RR.wall); marks.wallIn = cWall[0]; marks.near = cWall[1];
    marks.far = to(0, sFar, YARD_H);
    // (the climb to the ring's height ends LEVEL_END before the ring, which is some metres before or past the village's mouth as the street is long)
    { const sTop = ROAD - LEVEL_END, hMouth = lerp(YARD_H, PORTAL_Y, clamp((sMouth - sFar) / (sTop - sFar), 0, 1));
      if (sTop < sMouth - 1) to(0, sTop, PORTAL_Y);
      marks.mouth = to(0, sMouth, hMouth);
      if (sTop > sMouth + 1) to(0, sTop, PORTAL_Y); }
    to(0, ROAD, PORTAL_Y);
    };
    let path, M = {}, paceSum = 1;
    const routeGap = (x, z) => path.nearestXZ(x, z).dist;
    // the route's places in metres flown: every knot named above
    const mOf = (k) => path.nearestXZ(k[0], k[2]).u * path.length;
    // THE ONE PACING of the flight, by metres flown between the route's own places (each change eased over forty metres): up the verge and round
    // its corner 0.8, to the corner's end; every rounding, from one height before its circle to the circle's end, 0.65: the slowest of the
    // opening, for the giant we came to see; the legs between 1.1; the corner onto the left lane 0.75, reached by its start (the sharpest turn
    // of the line: slower, so that its arc can be tighter and the lane begin sooner); the lanes 0.9 and the crossing between them 1.0; slowest of
    // all (0.5) between the two houses' first and last wall; the way in 0.9; the street 0.6.
    const PACE = { verge: 0.8, round: 0.65, leg: 1.1, turn: 0.75, lane: 0.9, cross: 1.0, walls: 0.5, wayIn: 0.9, street: 0.6 };
    const ease = (m, a, b) => smoothstep(a - 20, a + 20, m) * (1 - smoothstep(b - 20, b + 20, m));
    const paceAt = (m) => {
      let v = PACE.leg + (PACE.verge - PACE.leg) * (1 - smoothstep(M.open, M.open + 40, m))
        + (PACE.turn - PACE.leg) * smoothstep(M.turn - 40, M.turn, m) * (1 - smoothstep(M.turnOut - 20, M.turnOut + 20, m))
        + (PACE.lane - PACE.leg) * (ease(m, M.turnOut, M.laneEnd) + ease(m, M.cross, M.near))
        + (PACE.cross - PACE.leg) * ease(m, M.laneEnd, M.cross) + (PACE.walls - PACE.leg) * ease(m, M.near, M.far) + (PACE.wayIn - PACE.leg) * ease(m, M.far, M.mouth) + (PACE.street - PACE.leg) * smoothstep(M.mouth - 20, M.mouth + 20, m);
      for (const r of rounds) v += (PACE.round - PACE.leg) * ease(m, r.mT - height(r.q), r.mOut);
      return v;
    };
    const pace = (u) => paceAt(u * path.length);
    // how fast we fly at a place, in metres a second: the pace there against the whole flight's fifty seconds (the route walked at every two metres)
    const DURATION = 50, speedAt = (m) => paceAt(m) * paceSum / DURATION;
    // (the path through the line's knots, its places in metres flown, and the pacing's sum over it)
    const measure = async () => {
      path = makePath(wv, { samples: 1000 });
      await ctx.yield();
      for (const r of rounds) { r.mIn = mOf(r.kIn); r.mT = mOf(r.kT); r.mOut = mOf(r.kOut); }
      await ctx.yield();
      M = {}; for (const k in marks) M[k] = mOf(marks[k]);
      await ctx.yield();
      paceSum = 0; for (let m = 1; m < path.length; m += 2) paceSum += 2 / paceAt(m);
    };
    const vOn = (a, b) => { let v = 0; for (let m = M[a]; m <= M[b]; m += 4) v = Math.max(v, speedAt(m)); return v; };
    layLine({}); await ctx.yield(); await measure();
    await ctx.yield();
    layLine({ open: vOn('openIn', 'open'), end: vOn('laneEnd', 'endOut'), right: vOn('rightIn', 'cross'), off: vOn('rlaneEnd', 'offOut'), wall: vOn('wallIn', 'near') }); await ctx.yield(); await measure();
    await ctx.yield();
    // THE LINE'S HEIGHT. The knots above give the line's plan and, at each, the height over the ground that its rule asks (h). The height
    // as flown is laid here over the whole line at once, so that it is never bent at a knot nor by a fold of the ground:
    //   the height asked, at every two metres of the line: the ground under it (lineAt) and h, going evenly between two knots (on the
    //   way in, from the last wall to the level end: the height itself going evenly, see below);
    //   that, MEANED over the metres we fly in BEND_T seconds (1.65 s, at the speed flown there): so a change of slope, the ground's or
    //   the rule's, is flown as one even bend that long, as a corner of the plan is one even arc;
    //   and RAISED, by as smooth a swell, wherever the mean would pass under THE LINE'S FLOOR: a rider's eye (2.5 m) over the ground as
    //   drawn, everywhere; and over the bridge and two and a half metres about it, the top of its walls and 2.5 m. (The floor is laid
    //   three centimetres higher than that: the curve between two knots sags some millimetres under the heights walked.)
    // The line is then the curve through knots a quarter of a mill apart taken along the plan above at those heights. Behind the entry the
    // ground is level and the height is the entry's; the last LEVEL_END metres are level at the ring's centre.
    const BEND_T = 1.65, KNOT = MH / 4;
    {
      const ST = 2, L0 = path.length, n = Math.floor(L0 / ST) + 2, p = new THREE.Vector3(), km = wv.map((k) => mOf(k));
      km[0] = 0; km[km.length - 1] = L0; for (let i = 1; i < km.length; i++) km[i] = Math.max(km[i], km[i - 1]);
      await ctx.yield();
      const asked = new Float64Array(n), floor = new Float64Array(n), half = new Float64Array(n), mAt = (i) => Math.min(i * ST, L0), zB = bedZ(0);
      for (let i = 0, k = 0; i < n; i++) { const m = mAt(i); path.posAtDist(m, p); while (k < km.length - 2 && km[k + 1] <= m) k++;
        const g = lineAt(p.x, p.z), onBridge = p.x > BRIDGE.min.x - 2.5 && p.x < BRIDGE.max.x + 2.5 && p.z - zB > BRIDGE.min.z - 2.5 && p.z - zB < BRIDGE.max.z + 2.5;
        asked[i] = g + lerp(wv[k][3], wv[k + 1][3], clamp((m - km[k]) / Math.max(km[k + 1] - km[k], 1e-6), 0, 1)); floor[i] = g + RIDER + 0.03 + (onBridge ? BRIDGE.max.y : 0);
        half[i] = Math.max(6, 0.5 * BEND_T * speedAt(m)) / ST; }   // (half the window, in steps of the walk: not a whole number)
      // THE WAY IN: from the two houses' last wall to the place where the level end begins, the height itself goes evenly from the one to
      // the other (not the height over the ground: the ground falls or rises to the village in folds of its own, and a line that kept
      // its rule's height over each of them would dip and climb with them); the floor below holds there as everywhere. THE LEVEL END:
      // from that place to the ring the height asked is the ring's centre's, the same number at every step
      { const iF = Math.ceil(M.far / ST), iT = Math.floor((L0 - LEVEL_END) / ST); for (let i = iT; i < n; i++) asked[i] = asked[n - 1];
        for (let i = iF + 1; i < iT; i++) asked[i] = lerp(asked[iF], asked[iT], (i - iF) / (iT - iF)); }
      await ctx.yield();
      // (the mean of a over each place's own window, k times its half width, by the integral of a taken as straight between its steps;
      // beyond the line's two ends a holds its end values)
      const PAD = 64, mean = (a, k) => { const N = n + 2 * PAD, S = new Float64Array(N), v = (i) => a[clamp(i - PAD, 0, n - 1)];
        for (let i = 1; i < N; i++) S[i] = S[i - 1] + 0.5 * (v(i - 1) + v(i));
        const I = (f) => { const i = Math.floor(f), t = f - i, a0 = v(i), a1 = v(i + 1); return S[i] + t * a0 + 0.5 * t * t * (a1 - a0); };
        const out = new Float64Array(n); for (let i = 0; i < n; i++) { const h = Math.min(half[i] * k, PAD - 2); out[i] = (I(i + PAD + h) - I(i + PAD - h)) / (2 * h); } return out; };
      const sm = mean(asked, 1), lack = new Float64Array(n), most = new Float64Array(n);
      for (let i = 0; i < n; i++) lack[i] = Math.max(0, floor[i] - sm[i]);
      // (the swell that makes good what the mean lacks: the most that is lacking anywhere within a window and a half, meaned twice)
      for (let i = 0; i < n; i++) { const h = Math.ceil(half[i] * 1.5) + 1; let v = 0; for (let j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) v = Math.max(v, lack[j]); most[i] = v; }
      const swell = mean(mean(most, 1), 0.5), yAt = (m) => { const f = clamp(m / ST, 0, n - 1.001), i = Math.floor(f); return lerp(sm[i] + swell[i], sm[i + 1] + swell[i + 1], f - i); };
      await ctx.yield();
      const fine = []; for (let m = 0; m < L0 - KNOT / 2; m += KNOT) { path.posAtDist(m, p); fine.push([p.x, yAt(m), p.z]); }
      path.posAtDist(L0, p); fine.push([p.x, yAt(L0), p.z]);
      wv.length = 0; for (const k of fine) wv.push(k);
    }
    await ctx.yield();
    await measure();
    await ctx.yield();
    // A lane's corners are arcs that begin and end a little way inside the lane: there the line runs up to two and a half metres inside the lane's
    // own. A stook or a pavilion stands only where its middle keeps its row's stand-off from the line as flown (5 m on the left lane, 7 m on the
    // right, less the half metre of its scatter), and an orchard's tree only where its trunk is six metres or more from it: where a corner cuts
    // toward a row, the row gives way (as it stands, and as it stands mirrored across the road).
    const lineGap = (q) => Math.min(routeGap(-q.lat, -q.s), routeGap(q.lat, -q.s));
    laneHold.stook = laneHold.stook.filter((q) => lineGap(q) >= (q.s < sBed ? 4.5 : 6.5));
    await ctx.yield();
    // the route walked at every two metres: its table of places, from which each wheeling bird takes the highest the route goes within
    // its own figure's reach
    const walk = [];
    { const p = new THREE.Vector3(); for (let m = 0; m <= path.length; m += 2) { path.posAtDist(m, p); walk.push(p.x, p.y, p.z); } }
    const routeTop = (x, z, r) => { let top = -1e9; for (let i = 0; i < walk.length; i += 3) if (Math.hypot(walk[i] - x, walk[i + 2] - z) < r) top = Math.max(top, walk[i + 1]); return top; };
    await ctx.yield();
    // THE GAZE: one rule for every great thing near our line, by what our line does at it.
    //   A thing we ROUND draws the gaze to its hub with the weight 0.7 (on its circle the hub is then some seventy degrees off our heading,
    //   under the seventy-five the eye bears): from the start of the corner that turns our line onto the leg to its circle (there the thing
    //   is before us, and the pull comes as the corner turns: by the leg's end, where the line bends onto the circle, it is whole), to the
    //   end of the circle, where the pull is gone. It comes and goes over the metres flown in three seconds (by the world's own speeds,
    //   the longer of its two ends).
    //   A thing we PASS draws none: a pair whose gap we fly through (the first pair, the gate pair, the outpost) stands whole before us on
    //   the straight that runs at its gap, and a lane's pair stands before us from the corner onto its lane; each leaves the picture by
    //   our own motion, behind us. (Between a corner and the place abeam a lane's pair there is less room than a pull's
    //   coming and going, and a pull there would fight the corner: so no passed thing draws the gaze.)
    // So only the second pair's giant draws the gaze. The plain's pairs stand beyond a passed thing's reach of our line; the houses, the
    // way in and the street draw none: there we look along our own line.
    // (the metres flown in t seconds after a place, and before it, by the pacing itself, a metre at a time)
    const flownIn = (m, t, dir = 1) => { let d = 0, T = 0; while (T < t && d < 400) { T += 1 / speedAt(Math.max(m + dir * (d + 0.5), 0)); d++; } return d; };
    const pois = [], TURN = 3, GAZE_W = 0.7;
    // (the reach within which a great thing is one we look at, not one of the plain's: its axis one and a half heights and its reach off)
    const passReach = (q) => 1.5 * height(q) + REACH * q.scale;
    for (const r of rounds) {
      const q = r.q, m0 = Math.min(M.openIn, r.mIn), len = Math.max(flownIn(m0, TURN), flownIn(r.mOut, TURN, -1));
      pois.push({ at: [r.side * q.lat, hAt(r.side * q.lat, -q.s) + SK.hubY * q.scale, -q.s], from: m0 / path.length, to: r.mOut / path.length, weight: GAZE_W, fade: len / (r.mOut - m0) });
    }
    await ctx.yield();
    // THE RING IS WHOLE IN SIGHT from a place on the way in: the first place past the two houses' last wall, walking our line two metres at a
    // time, from which the straight sight to the ring's foot clears the ground (the road rises to the village on some visits and hides the
    // ring's lower part from the wall itself). The ring begins to show the next world there.
    let mWhole = M.far;
    { const e = new THREE.Vector3(), foot = hAt(0, -ROAD) + PORTAL_Y - RING;
      const clear = () => { for (let k = 1; k < 40; k++) { const w = k / 40, x = lerp(e.x, 0, w), z = lerp(e.z, -ROAD, w); if (hAt(x, z) > lerp(e.y, foot, w) - 0.05) return false; } return true; };
      for (; mWhole < path.length - 20; mWhole += 2) { path.posAtDist(mWhole, e); if (clear()) break; } }
    await ctx.yield();
    // the pairs out on the plain (stream 'farPairs'), in three bands by their distance from the road in mills, the country's measure: the nearest stand
    // just beyond the lanes' holdings (three and a half to five and a half mills off, one to every seven to ten mills of road), like pieces on a
    // board; a middle band (seven to thirteen mills off, every five to eight); the furthest are the line of thirty or forty going away (sixteen to
    // thirty-four mills off, every four to seven). None stands within the gaze's reach of the route's line (its axis one and a half of its heights
    // and its own reach off, or more: a great thing nearer than that is one we look at), nor nearer the two houses or the village than its own
    // height, nor in the droves' ground or the stream. One that the route
    // passes within two and a half of its heights, in space, is built in full and throws its shadow; the rest are the simple ones.
    // WHY THESE BANDS. The country is measured in mills (a mill's height, 20.8 m). The nearest band begins half a mill beyond the lanes' strip
    // (which reaches three mills from the road) and ends where a mill stands ten degrees high from the road (five and a half of its heights
    // off); the middle band takes them from there down to four degrees (thirteen heights); the furthest from sixteen heights, a gap that
    // sets the far line apart from the middle ones, to thirty-four, where a mill is a degree and a half and the haze takes it. The spacings
    // are such that the three bands together stand thirty to forty mills on his side over the road and thirty mills beyond it (the book's
    // count: "thirty or forty windmills"): one to 8.5 mills of road, one to 6.5 and one to 5.5 over some eighty-five mills of length.
    const pr = RN.farPairs, pairs = [...closeAll]; let nDealt = 0;
    const solidAt = (q) => REACH * q.scale + MARGIN;
    for (const [n0, n1, a, b] of [[3.5, 5.5, 7, 10], [7, 13, 5, 8], [16, 34, 4, 7]]) for (let s = -MH * pr.range(0, a); s < ROAD + 30 * MH; s += MH * pr.range(a, b)) {
      const q = { s, scale: pr.range(0.9, 1.2), yaw: pr.range(0.1, 0.7), phase: pr.range(0, 6.28), lat: MH * pr.range(n0, n1), hi: false };
      if (++nDealt % 6 === 0) await ctx.yield();
      const gap = Math.min(routeGap(-q.lat, -q.s), routeGap(q.lat, -q.s)), own = height(q) + solidAt(q);
      if (gap < passReach(q) + 0.5 || inCrowd(q.s, q.lat) || inBed(q.lat, -q.s, 16) || inBed(-q.lat, -q.s, 16)) continue;
      if (Math.abs(q.s - sInn) < HL / 2 + own && q.lat < latInn + YARD.D / 2 + YARD.moat + own) continue;
      if (q.s > sMouth - own && q.s < ROAD + own && q.lat < 120 + own) continue;
      if (rounds.some((r) => Math.hypot(q.lat - r.q.lat, q.s - r.cs) < r.D + solidAt(q))) continue;
      if (pairs.some((o) => Math.abs(o.s - q.s) < 2 * solidAt(q) && Math.abs(o.lat - q.lat) < 2 * solidAt(q))) continue;
      q.hi = Math.min(path.distanceTo(-q.lat, SK.hubY * q.scale, -q.s), path.distanceTo(q.lat, SK.hubY * q.scale, -q.s)) < 2.5 * height(q);
      q.gap = gap;
      pairs.push(q);
    }
    await ctx.yield();

    const item = (q, side) => ({ x: side * q.lat, y: hAt(side * q.lat, -q.s), z: -q.s, yaw: side < 0 ? q.yaw : -q.yaw, scale: q.scale, phase: q.phase, sign: -side, lock: q.lock || 0 });
    // every thing of every pair, and which make it is: FULL where the pair is near (both things), or for a lane's pair the one on the lane's outer
    // hand; the lanes' giants the striding make; the PLAINEST where the pair stands further than six mills (125 m) in plan from every place of
    // our line (a thing of twenty-nine metres is then under thirteen degrees high: its outline and its turning are what is seen); the SIMPLE
    // make between.
    const FAR_MAKE = 6 * MH;
    const things = pairs.flatMap((q) => [-1, 1].map((side) => ({ q, side, make: (q.lane ? q.full === side : q.hi) ? 'full' : (q.gap ?? 0) > FAR_MAKE ? 'far' : 'lo', stride: !!q.lane && side > 0, near: q.s < sInn })));
    for (const t of things) t.full = t.make === 'full';
    await ctx.yield();
    const pick = (side, make, stride, near) => things.filter((t) => t.side === side && t.make === make && t.stride === stride && (near == null || t.near === near)).map((t) => item(t.q, t.side));
    const standing = [PW.makePairMesh(millLo, kit.mats.spin, null, pick(-1, 'lo', false)), PW.makePairMesh(giantLo, kit.mats.spin, null, pick(1, 'lo', false)),
      PW.makePairMesh(strideLo, kit.mats.spin, null, pick(1, 'lo', true)), PW.makePairMesh(strideHi, kit.mats.spin, kit.mats.depthSpin, pick(1, 'full', true))];
    await ctx.yield();
    { const mf = pick(-1, 'far', false), gfar = pick(1, 'far', false);
      if (mf.length) standing.push(PW.makePairMesh(PW.farMillGeometry(), kit.mats.spin, null, mf));
      if (gfar.length) standing.push(PW.makePairMesh(PW.farGiantGeometry(), kit.mats.spin, null, gfar)); }
    // the near ones each a mesh of its own, so that only the one near enough to throw a shadow here is drawn into the shadow map, and none
    // that is behind us is drawn at all
    await ctx.yield();
    for (const it of pick(-1, 'full', false)) standing.push(PW.makePairMesh(millHi, kit.mats.spin, kit.mats.depthSpin, [it]));
    for (const it of pick(1, 'full', false)) standing.push(PW.makePairMesh(giantHi, kit.mats.spin, kit.mats.depthSpin, [it]));
    for (const m of standing) scene.add(m);
    // the simple ones stand too far from the flight for the shadow map: their long shadows are laid on the ground, toward us, away from the low sun
    await ctx.yield();
    for (const near of [true, false]) {   // (in two stretches of the road, as the near ones are)
      const farShade = flora.makeGroundShadows({ points: things.filter((t) => !t.full && t.near === near).map((t) => ({ x: t.side * t.q.lat, z: -t.q.s, r: SK.rBase * t.q.scale })), heightAt: hAt, sunDir, strength: 0.45, color: '#3c4064', stretch: 3, cell: 9 });   // (a disc of the tower's own foot, dragged long by the low sun)
      scene.add(farShade.object);
      await ctx.yield();
    }
    // under each foot of every giant built in full, and under the foot of every mill built in full, a dark disc on the ground, of that foot's
    // own plan (read off the make's lowest half metre) and not dragged by the sun: what stands on the ground darkens it where it stands
    { const feet = (geo) => { const p = geo.attributes.position, out = [];
        for (const sx of [-1, 1]) { let n = 0, cx = 0, cz = 0, r = 0;
          for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.5 && p.getX(i) * sx > 0) { n++; cx += p.getX(i); cz += p.getZ(i); }
          if (!n) continue;
          cx /= n; cz /= n;
          for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.5 && p.getX(i) * sx > 0) r = Math.max(r, Math.hypot(p.getX(i) - cx, p.getZ(i) - cz));
          out.push([cx, cz, r]); }
        return out; };
      const FEET = { stand: feet(giantHi), stride: feet(strideHi) }, pts = [];
      for (const t of things) if (t.full) { const it = item(t.q, t.side), c = Math.cos(it.yaw), s = Math.sin(it.yaw);
        for (const [fx, fz, r] of t.side < 0 ? [[0, 0, SK.rBase]] : t.stride ? FEET.stride : FEET.stand) pts.push({ x: it.x + (fx * c + fz * s) * it.scale, z: it.z + (fz * c - fx * s) * it.scale, r: r * it.scale }); }
      const contact = flora.makeGroundShadows({ points: pts, heightAt: hAt, sunDir, strength: 0.6, color: '#2a2c44', stretch: 0, size: 1.15, cell: 3 });
      scene.add(contact.object); }
    await ctx.yield();

    // ------------------------------------------------------------ the inn and the castle: one footprint, two manners, gates facing across the road
    // each house and its outer yards (one before it, one after it, four gates long each) are one mesh about the house's own origin
    let innGeo, castleGeo;
    { const it = PW.houseSteps({ mir: 1, rich: false, out: OUT }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } innGeo = r.value; }
    const inn = new THREE.Mesh(innGeo, kit.mats.solid); inn.position.set(-latInn, 0, -sInn); inn.rotation.y = Math.PI / 2;
    await ctx.yield();
    { const it = PW.houseSteps({ mir: -1, rich: true, out: OUT }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } castleGeo = r.value; }
    const castle = new THREE.Mesh(castleGeo, kit.mats.solid); castle.position.set(latInn, 0, -sInn); castle.rotation.y = -Math.PI / 2;
    await ctx.yield();
    for (const m of [inn, castle]) { m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = kit.mats.depth; scene.add(m); }
    const wheel = new THREE.Mesh(PW.wellWheelGeometry(), kit.mats.solid); wheel.rotation.order = 'YXZ'; wheel.rotation.y = Math.PI / 2; { const a = PW.innAnchors(1).well; wheel.position.set(-latInn + a[2], a[1], -sInn - a[0]); } scene.add(wheel);
    // the further pair: six mallets under a lean-to and its water wheel; six ogres under a canopy and their gilded wheel
    const fullWheels = [], wheelPh = RN.wheels.range(0, 6.28), fullPh = RN.wheels.range(0, 6.28);
    for (const side of [-1, 1]) {
      const geo = fullGeo[side < 0 ? 0 : 1];
      scene.add(PW.makeCreatures(geo, kit.mats.limb, [{ x: side * latFull, y: levelF, z: -sFull, yaw: -side * Math.PI / 2, scale: FS, phase: fullPh, rate: 2.3, gait: 1, nod: 1 }], { depth: kit.mats.depth }));
      const w = new THREE.Mesh(PW.fullWheelGeometry(side > 0), kit.mats.solid); w.rotation.order = 'YXZ'; w.rotation.y = -side * Math.PI / 2;
      w.position.set(side * (latFull - PW.FULL.wheelZ * FS), levelF + PW.FULL.wheelY * FS, -sFull - PW.FULL.wheelX * FS); w.scale.setScalar(FS); w.castShadow = true; scene.add(w); fullWheels.push(w);
      await ctx.yield();
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2 * (moatC.a + YARD.moat), 2 * (moatC.b + YARD.moat)).rotateX(-Math.PI / 2), makeWaterMaterial(U, [moatC.x, moatC.z, moatC.a + 0.9, moatC.b + 0.9]));
    water.position.set(moatC.x, -0.55, moatC.z); water.frustumCulled = false; water.renderOrder = 1; scene.add(water);
    await ctx.yield();

    // ------------------------------------------------------------ grass, flowers, trees: the same plants in the same places, dry on the left, enamelled on the right
    const seamAt = (x, z) => smoothstep(-6.5, 6.5, x + 3.0 * Math.sin(z * 0.021) + 2.0 * Math.sin(z * 0.0507 + 1.3) + 4.0 * Math.sin(z * 0.0093 + 0.7) * Math.sin(z * 0.031));
    const cDust = [GU.uDust.value.r, GU.uDust.value.g, GU.uDust.value.b], cStub = [GU.uStubble.value.r, GU.uStubble.value.g, GU.uStubble.value.b];
    const cGA = [GU.uGreenA.value.r, GU.uGreenA.value.g, GU.uGreenA.value.b], cGB = [GU.uGreenB.value.r, GU.uGreenB.value.g, GU.uGreenB.value.b];
    const groundCol = (x, z) => {
      const n = 0.5 + 0.5 * noise.n2(x * 0.017 + 4, z * 0.017), n2 = 0.5 + 0.5 * noise.n2(x * 0.09, z * 0.09 + 9);
      let L = mixc(cStub, cDust, smoothstep(0.3, 0.75, n * 0.7 + n2 * 0.4)); if (seasonId === 1) L = mixc(L, [0.5, 0.39, 0.13], 0.6);
      const c = mixc(mulc(L, 0.95), mulc(mixc(cGA, cGB, n), 1.25), seamAt(x, z));
      return new THREE.Color(c[0], c[1], c[2]);
    };
    // where no plant grows: the two houses with their outer yards and the moat's ground (on either side: the moat crosses with the castle), the further
    // pair's floor, the village's street and plots, the lanes' threshing floors
    const inYards = (x, z) => (Math.abs(z + sInn) < HL / 2 + 1.5 && Math.abs(Math.abs(x) - latInn) < YARD.D / 2 + YARD.moat + 1)
      || (Math.abs(z + sFull) < 10.4 * FS && Math.abs(Math.abs(x) - latFull) < 5.3 * FS) || (-z > sMouth - 2 && -z < ROAD + 12 && Math.abs(x) < 110)
      || laneHold.floor.some((q) => Math.hypot(Math.abs(x) - q.lat, z + q.s) < 10.2);
    const wind = flora.makeWind({ direction: [0.94, -0.34], strength: 1.1, speed: 1.1 });
    const matOptions = { wind, backlight: 1.0, backlightTint: '#ffe9a0', ambient: 1.5, leafAmbient: 1.5 };
    await flora.prepareLeafTexture(matOptions, ctx.yield);
    const fmat = flora.windMaterial(matOptions);
    const grassOpts = { wrap: 0.9, backlight: 1.1, ambient: 1.3, leafAmbient: 1.3, sheen: 0.5 };
    // (the grass is dealt by the kit along the route's line, out to thirty-six metres from it: eight and a half tufts to a metre of the route on either
    // side of the road, in stretches of sixty metres; the kit draws a stretch only near the eye. It grows from the road's broken edge outward (3.3 m
    // from the road's middle: the road's dust is 3.6 m wide, ragged by two thirds of a metre) and not in the yards or the stream's bed. The kit's
    // own flowering tufts are left out: the flowers of this country are the meadow's, each in its place; a stretch of grass is then one call.)
    const nGrass = Math.round(8.5 * path.length * detail * clamp(dens, 0.8, 1.15)), gChunks = Math.max(6, Math.round(path.length / 60));
    // (the kit's grass reads the ground off a lattice of its own and goes between its points: the finest it takes for a road this
    // long is some 1.2 m, so that a tuft at the ditch's lip stands within a hand or so of the sheet)
    const GRASS_STEP = 1.2;
    const grassL = await flora.makeGrassAsync({ rng: RN.grassL, path, heightAt: hAt, heightStep: GRASS_STEP, wind, map: fmat.map, count: nGrass, radius: 36, bias: 2.0, chunks: gChunks, fade: [66, 96], groundColor: groundCol, width: [0.55, 0.95], height: season === 'wheat' ? [0.7, 1.1] : [0.45, 0.85],
      flowers: 0, materialOptions: { ...grassOpts, backlight: 0.6, wrap: 0.6, ambient: 1.05, leafAmbient: 1.05 },
      density: (x, z) => (x < -(ROAD_HALF - 0.3) && !inYards(x, z) && !inBed(x, z, 4.5) ? 1 : 0) }, ctx.yield);
    await ctx.yield();
    const grassR = await flora.makeGrassAsync({ rng: RN.grassR, path, heightAt: hAt, heightStep: GRASS_STEP, wind, map: fmat.map, count: nGrass, radius: 36, bias: 2.0, chunks: gChunks, fade: [66, 96], groundColor: groundCol, width: [0.6, 1.05], height: [0.5, 0.95],
      flowers: 0, materialOptions: grassOpts, density: (x, z) => (x > ROAD_HALF - 0.3 && !inYards(x, z) && !inBed(x, z, 4.5) ? 1 : 0) }, ctx.yield);
    scene.add(grassL.object, grassR.object);
    await ctx.yield();
    // ------------------------------------------------------------ the country's holdings: what the plain holds on the left and, straight across the road at
    // the same metre, the same thing as he sees it. Beyond the lanes' own stations, one holding every two to four mills of road in each of two bands (three to six
    // mills off, and six to thirteen), a plot forty to sixty metres each way, its kind by turns of an order drawn for the visit:
    //   stooks standing in rows / pavilions in rows;  olives in rows / an orchard in blossom;  a threshing floor / a tiled round with its fountain;
    //   a shepherd's hut / a hermit's chapel with a gilt bell;  a well with its wheel / a gilded fountain.
    // Two sides of every plot are walled (dry stone / a hedge of roses). A plot keeps the margin from the route, and clear of the pairs, the houses,
    // the stream, the flocks' ground and the village; a plot of tall things (trees, a hut) also keeps out of the open ground a thing is rounded over.
    // (The order is of seven: stooks and huts twice, the others once: the plain is mostly harvest and shepherds; so an orchard is one plot in seven.)
    // WHY THESE RANGES. A plot is forty to sixty metres each way: two to three mills' heights, a field a man reaps in a day, and large enough
    // that its rows of stooks or trees read as rows from the road. The nearer band lies from the lanes' strip (three mills) to six mills,
    // where a stook is still a countable thing from the road; the further from there to thirteen, the middle pairs' ground, so that the
    // far mills stand among fields and not on bare land. One to every two to four mills of road in each band: with plots of two to three
    // mills that leaves as much open ground between holdings as they cover, which is how the country reads from the road.
    const hr = RN.holdings, holdKinds = hr.shuffle(['stooks', 'orchard', 'floor', 'hut', 'well', 'stooks', 'hut']), holdings = [];
    for (const [l0, l1] of [[3, 6], [6, 13]]) for (let s = MH * hr.range(0, 3), k = 0; s < ROAD + 12 * MH; s += MH * hr.range(2, 4), k++) {
      const q = { s, lat: MH * hr.range(l0, l1), w: hr.range(40, 60), d: hr.range(40, 60), kind: holdKinds[(k + (l0 > 3 ? 3 : 0)) % holdKinds.length], rot: hr.range(-0.25, 0.25), seed: hr() };
      const half = Math.hypot(q.w, q.d) / 2, tall = q.kind === 'orchard' || q.kind === 'hut';
      if (Math.min(routeGap(-q.lat, -q.s), routeGap(q.lat, -q.s)) < half + MARGIN) continue;
      if (pairs.some((p) => Math.hypot(p.lat - q.lat, p.s - q.s) < half + solidAt(p))) continue;
      if (tall && rounds.some((r) => Math.hypot(q.lat - r.q.lat, q.s - r.cs) < r.D + half)) continue;
      if (Math.abs(q.s - sInn) < HL / 2 + half + 10 && q.lat < latInn + YARD.D / 2 + YARD.moat + half + 10) continue;
      if (Math.abs(q.s - sFull) < 10.4 * FS + half + 6 && q.lat < latFull + 5.3 * FS + half + 6) continue;
      if (inCrowd(q.s, q.lat - half) || inLane(q.s, q.lat - half, 6) || (q.s > sMouth - half - 20 && q.s < ROAD + half + 30 && q.lat < 120 + half)) continue;
      if (Math.abs(q.s - sBed) < 9 + 8 + half) continue;
      if (holdings.some((o) => Math.hypot(o.lat - q.lat, o.s - q.s) < half + Math.hypot(o.w, o.d) / 2)) continue;
      holdings.push(q);
    }
    // a place in a plot: across (toward the plain) and along the road from its middle, turned by the plot's own small angle
    const plotAt = (q, u, v) => { const c = Math.cos(q.rot), sn = Math.sin(q.rot); return { lat: q.lat + u * c - v * sn, s: q.s + u * sn + v * c }; };
    const inHolding = (s, lat, pad) => holdings.some((q) => Math.abs(lat - q.lat) < q.w / 2 + pad && Math.abs(s - q.s) < q.d / 2 + pad);
    await ctx.yield();
    // THE OPENING'S FIELDS (stream 'strips'): from the first pair's road metre to the left lane's start the ground on both hands of the road
    // is laid out in fields, as the plain's holdings are further out. Seven bands along the road, each twenty metres wide, the first from the
    // ditch's far side (12 m from the road's middle); a band is cut into fields 40 to 70 m long with a headland of four to eight metres
    // between two; a field is seventeen metres wide, and three metres of path lie between two bands. Each field's kind is drawn: three in
    // six a STANDING CROP in rows along the road (wheat a man's chest high, rows 1.6 m apart; across the road roses on stakes, rows 2.4 m
    // apart), two in six REAPED (two rows of stooks, seven metres apart along each; across the road pavilions), one in six PLOUGHED with a
    // haystack or a well with its sweep at its middle (across the road a tall tent, a fountain). Along every field's outer long side runs a
    // wall of field stone (across the road a hedge of roses). A field is BUILT where it or its twin across the road comes within forty-five
    // metres of our line in plan (a field is a thing built to be passed close); not where a holding lies, nor within a close thing's reach.
    // Nothing of a field stands nearer our line than its own stand-off: a crop's rows give way six metres either side of the line (a mown
    // swathe); a stook keeps five metres (as the lanes' do); a wall is broken five metres either side of where the line crosses it (a
    // field's gateway); a haystack, a tent, a well or a fountain stands only where its middle is its own height and a half from the line.
    const fld = RN.strips, fields = [], F0 = 12, FW = 20, FIELD_NEAR = 45;
    // (our line from the entry to thirty metres up the left lane, walked at every two metres)
    const openXZ = []; for (let i = 0; i < walk.length && i / 3 * 2 <= M.lane + 30; i += 3) openXZ.push(walk[i], walk[i + 2]);
    const openGap = (x, z) => { let d = 1e9; for (let i = 0; i < openXZ.length; i += 2) { const q = Math.hypot(openXZ[i] - x, openXZ[i + 1] - z); if (q < d) d = q; } return d; };
    // (how near our line comes to a rectangle of ground, in plan: the least over its outline walked at every four metres, and its middle)
    const rectGap = (x0, x1, s0, s1) => { let d = openGap((x0 + x1) / 2, -(s0 + s1) / 2); for (let s = s0; s <= s1 + 0.1; s += Math.min(4, s1 - s0)) d = Math.min(d, openGap(x0, -s), openGap(x1, -s)); for (let x = x0; x <= x1 + 0.1; x += 4) d = Math.min(d, openGap(x, -s0), openGap(x, -s1)); return d; };
    // (a field is laid where it is twenty metres long or more, near enough, on no holding, on no drove's ground or pasture, and clear of
    // every close thing's reach; every number of it is drawn before it is tried)
    const fieldOK = (f) => {
      if (f.s1 - f.s0 < 20) return false;
      f.gap = [-1, 1].map((side) => rectGap(Math.min(side * f.lat0, side * f.lat1), Math.max(side * f.lat0, side * f.lat1), f.s0, f.s1));
      if (Math.min(f.gap[0], f.gap[1]) > FIELD_NEAR) return false;
      if (inHolding((f.s0 + f.s1) / 2, (f.lat0 + f.lat1) / 2, Math.max(f.s1 - f.s0, 17) / 2)) return false;
      if (onDroveWay(f.s0, f.lat0, f.lat1, 2) || onDroveWay(f.s1, f.lat0, f.lat1, 2) || onDroveWay((f.s0 + f.s1) / 2, f.lat0, f.lat1, 2)) return false;
      return !closeAll.some((q) => q.lat > f.lat0 - REACH * q.scale - 3 && q.lat < f.lat1 + REACH * q.scale + 3 && q.s > f.s0 - REACH * q.scale - 3 && q.s < f.s1 + REACH * q.scale + 3);
    };
    const stripFrom = [];
    for (let k = 0; k < 7; k++) {
      stripFrom.push(p0.s - fld.range(0, 40));
      for (let s = stripFrom[k]; s < sL0 - 46;) {
        const len = fld.range(40, 70), kind = fld.pick(['crop', 'crop', 'crop', 'reaped', 'reaped', 'plough']), draw = fld(), f = { k, lat0: F0 + FW * k, lat1: F0 + FW * (k + 1) - 3, s0: s, s1: Math.min(s + len, sL0 - 6), kind, draw };
        s += len + fld.range(4, 8);
        if (fieldOK(f)) fields.push(f);
      }
      await ctx.yield();
    }
    // THE ENTRY'S FIELDS (stream 'entryStrips'): the same strips carried back from each strip's first field to the entry, so that the
    // verge we come in on runs between worked land from its first metres: fields thirty to fifty metres long, one in two of them reaped
    // (its stooks stand in the near stubble; pavilions across the road), the others a crop or ploughed, four to eight metres between
    // two; the first begins six to sixteen metres up the road. Laid by the same rule as every field (after them, so that no field of
    // the strips above takes another number). THE FIRST FIELD OF THE STRIP BY THE ROAD IS A REAPED ONE (whatever is drawn for it): its
    // stooks stand in three rows, the nearest a metre inside the field's road side (eight metres from our verge's line), and a loaded
    // wain with its two oxen stands between its rows (below, with the worked land).
    { const fe = RN.entryStrips;
      for (let k = 0; k < 7; k++) {
        for (let s = 6 + fe.range(0, 10); s < stripFrom[k] - 24;) {
          const first = k === 0 && s < 17, len = fe.range(30, 50), kind = fe.pick(['reaped', 'reaped', 'reaped', 'crop', 'crop', 'plough']), draw = fe();
          const f = { k, lat0: F0 + FW * k, lat1: F0 + FW * (k + 1) - 3, s0: s, s1: Math.min(s + len, stripFrom[k] - 5), kind: first ? 'reaped' : kind, draw, entry: true, first };
          s += len + fe.range(4, 8);
          if (fieldOK(f)) fields.push(f);
        }
        await ctx.yield();
      } }
    // THE STANDING CROPS: tufts of the grass's own make and material, set in their rows, one to every 0.8 m of a row (a little out of line,
    // each of its own size and turn, on the stream 'cropTufts'). On the plain hand wheat, 1.35 m high and the colour of ripe straw; in
    // the stubble season, when the wheat is in, vines: green, 1.2 m, rows 2.4 m apart. Across the road roses on their stakes, in bloom, red
    // and white by turns of the row. A tuft stands where it is six metres or more from our line in plan (the mown swathe), and only where
    // the line comes within 85 m (beyond that the grass's own fading has it gone). Each field's tufts are one mesh of each make, drawn near the eye (the kit's grass rule).
    const VINES = season === 'stubble', ROWS = [VINES ? 2.4 : 1.6, 2.4], cropFields = fields.filter((f) => f.kind === 'crop'), cropSets = [];
    { const ct = RN.cropTufts;
      const geos = [[flora.grassTuftGeometry({ rng: ct, width: VINES ? 1.3 : 1.0, height: VINES ? 1.2 : 1.35, root: VINES ? '#2e4a1c' : '#8f7430', tip: VINES ? '#86a23c' : '#ecd484' })],
        [flora.grassTuftGeometry({ rng: ct, width: 1.2, height: 1.3, root: '#1c4a26', tip: '#58a048', flower: '#e23a50' }), flora.grassTuftGeometry({ rng: ct, width: 1.2, height: 1.3, root: '#1c4a26', tip: '#58a048', flower: '#fff0e4' }),
          // (a rose bush further than twenty-four metres from our line: the bush without its separate heads, its tips of the roses' colour)
          flora.grassTuftGeometry({ rng: ct, width: 1.2, height: 1.3, root: '#1c4a26', tip: '#c2485a' }), flora.grassTuftGeometry({ rng: ct, width: 1.2, height: 1.3, root: '#1c4a26', tip: '#e6dccc' })]];
      for (const side of [-1, 1]) {
        const pts = [], gapR = ROWS[side < 0 ? 0 : 1];
        for (let fi = 0; fi < cropFields.length; fi++) { const f = cropFields[fi]; if (f.gap[side < 0 ? 0 : 1] > 85) continue;
          for (let r = 0, lat = f.lat0 + gapR / 2; lat < f.lat1 - 0.4; lat += gapR, r++) for (let s = f.s0 + 0.6; s < f.s1 - 0.4; s += 0.8) {
            const x = side * (lat + ct.range(-0.12, 0.12)), z = -(s + ct.range(-0.15, 0.15)), sc = ct.range(0.85, 1.15), rot = ct.range(0, 6.28), g = openGap(x, z);
            if (g >= 6 && g < 85) pts.push({ x, y: hAt(x, z), z, s: sc, rot, u: (fi + 0.5) / cropFields.length, v: r % 2 + (side > 0 && g >= 24 ? 2 : 0), d: 0 });
          }
          await ctx.yield(); }
        if (pts.length) { const set = flora.makeScatter({ rng: ct, points: pts, variants: geos[side < 0 ? 0 : 1], material: grassL.material, chunks: cropFields.length, tint: 0.14, hue: 0.03, sink: 0.08, tilt: 0.06 }); cropSets.push(set); scene.add(set.object); }
        await ctx.yield();
      } }
    const fieldAt = (lat, s) => { for (const f of fields) if (lat > f.lat0 + 0.8 && lat < f.lat1 - 0.8 && s > f.s0 + 0.8 && s < f.s1 - 0.8) return f; return null; };
    const treePts = [];
    // THE ROAD'S ROWS (stream 'rows'): a row of poplars along the ditch's far side on the plain hand (10.5 m from the road's middle), one to
    // every nine to twelve metres, and of willows across the road, from the first pair to the left lane's start; a tree of a row stands
    // where every tree may (below): so the rows are broken where our line runs up the verge or crosses the road, and on the open ground the
    // giant is rounded over.
    const rowPts = []; { const rw = RN.rows; for (let s = p0.s + rw.range(0, 10); s < sL0 - 10; s += rw.range(9, 12)) rowPts.push({ s, lat: 10.5 + rw.range(-0.4, 0.4), sc: rw.range(0.8, 1.0), v: 2, rot: rw.range(0, 6.28) }); }
    // a tree stands where nothing else does: not at a pair, a house, a holding, the flocks' ground, the village or the stream; its crown (five metres)
    // keeps the margin from the flight in plan; and the ground a thing is rounded over (its circle and six metres more) is open, so that the thing
    // stands clear before us all the way round
    const treeOk = (s, lat, own) => {
      if (pairs.some((q) => Math.abs(q.s - s) < 15 && Math.abs(q.lat - lat) < 15)) return false;
      if (rounds.some((r) => Math.hypot(lat - r.q.lat, s - r.cs) < r.D + 6)) return false;
      if (Math.abs(s - sInn) < HL / 2 + 12 && lat < latInn + YARD.D / 2 + YARD.moat + 12) return false;
      if (inCrowd(s, lat) || (s > sMouth - 15 && s < ROAD + 25 && lat < 120)) return false;
      if (Math.abs(s - sFull) < 10.4 * FS + 8 && lat < latFull + 5.3 * FS + 8) return false;
      if (!own && (inHolding(s, lat, 6) || inLane(s, lat, 6) || inBed(lat, -s, 9) || inBed(-lat, -s, 9))) return false;
      return routeGap(-lat, -s) >= MARGIN + 5 && routeGap(lat, -s) >= MARGIN + 5;
    };
    // lone trees of the open plain (stream 'lone'): beyond the lanes' stations and the droves' ground, out to the middle band of the pairs: one to every
    // two to three mills of road, two and a half to nine mills off, as likely near as far; each where nothing else stands
    { const lo = RN.lone;
      for (let s = -2 * MH * lo(); s < ROAD + 12 * MH; s += MH * lo.range(2, 3)) {
        const lat = MH * lo.range(2.5, 9), v = lo.int(0, 1), sc = lo.range(0.8, 1.3), rot = lo.range(0, 6.28);
        if (treeOk(s, lat)) treePts.push({ s, lat, sc, v, rot });
      } }
    for (const q of rowPts) if (treeOk(q.s, q.lat)) treePts.push(q);
    // the lanes' orchard: its trees stand where the station put them (the one place where crowns come over our shoulders)
    for (const q of laneTreePts) if (lineGap(q) >= 3 * CROWN * q.sc) treePts.push(q);
    // the holdings' own trees: olives in rows (in blossom across the road), twelve metres apart (an old grove's spacing: each crown stands clear);
    // each tree's size and turn drawn (stream 'grove')
    const gv = RN.grove, bk = RN.bank;
    for (const q of holdings) if (q.kind === 'orchard') for (let u = -q.w / 2 + 5; u < q.w / 2 - 2; u += 12) for (let v = -q.d / 2 + 5; v < q.d / 2 - 2; v += 12) {
      const p = plotAt(q, u, v); if (treeOk(p.s, p.lat, true)) treePts.push({ s: p.s, lat: p.lat, sc: gv.range(0.72, 0.92), v: 1, rot: gv.range(0, 6.28) });
    }
    // the stream's trees (stream 'bank'): poplars along the dry bed (willows across the road), from beyond the lanes' wells out to three hundred
    // metres: one every seven tenths of a mill to a mill and three tenths of the bed's length (a poplar is about a mill high: they stand a tree's
    // height apart, more or less), each on the bank drawn for it, nine and a half metres from the bed's middle (two metres back from the bank's lip)
    for (let lat = LANE + bk.range(8, 16); lat < 300; lat += MH * bk.range(0.7, 1.3)) {
      const off = bk.sign() * 9.5, s = -bedZ(lat) + off, sc = bk.range(0.9, 1.2), rot = bk.range(0, 6.28); if (treeOk(s, lat, true) && !inBed(lat, -s, 7) && !inBed(-lat, -s, 7)) treePts.push({ s, lat, sc, v: 2, rot });
    }
    // the ridge's holm oaks: a line of them along its crest, to either side of the saddle where the road goes over
    { const ro = RN.ridgeOaks;
      for (let lat = 40 + ro.range(0, 12); lat < 520; lat += ro.range(12, 26)) {
        const s = sRidge + 40 * (1 - Math.cos(lat * 0.006)) + ro.range(-20, 20), sc = ro.range(0.9, 1.35), rot = ro.range(0, 6.28);
        if (treeOk(s, lat)) treePts.push({ s, lat, sc, v: 0, rot });
      } }
    // (a tree is built in full where the flight passes within thirty metres of it or of its twin across the road, in space, and simply elsewhere)
    const tp = (q, side) => ({ x: side * q.lat, y: hAt(side * q.lat, -q.s) - 0.15, z: -q.s, s: q.sc, rot: side * q.rot, d: Math.min(path.distanceTo(-q.lat, hAt(-q.lat, -q.s) + 5, -q.s), path.distanceTo(q.lat, hAt(q.lat, -q.s) + 5, -q.s)), u: clamp((q.s + 3 * MH) / (ROAD + 17 * MH), 0, 0.999), v: q.v });
    // the same draws in the same order as one nested call would make them; only the page is handed back between the trees
    await ctx.yield();
    const treeSets = [], farGeos = [], crownR = [[], []], scatterOpts = { material: fmat, castShadow: true, tint: 0.1, hue: 0.02, farDistance: 30, chunks: 4 };
    // A TREE'S MAKE BY WHERE IT STANDS: within thirty metres of our line the tree in full; to sixty the simple one; beyond that
    // an oak, an olive or a blossoming tree is the plainest make: a rounded crown on a trunk, as high and as wide as the tree it stands for and
    // tinted as its kind (122 triangles for the simple one's 380 to 550: this pays for the lanes' pairs and the worked land). Poplars and
    // willows keep the simple make. By the place, for the whole visit. (The plainest make is the kit's bush lifted onto a trunk; the
    // bush's own three stems, a hand thick and inside the crown, are left out, and the trunk runs up into the crown's middle.)
    const PLAIN_D = 60, plainPts = [], isPlain = (p) => p.d > PLAIN_D && p.v < 2;
    const plainGeo = (() => {
      const LIFT = 3.0, b0 = flora.bushGeometry({ rng: RN.farTree, detail: 0, size: 4.2, leaf: '#ffffff', leafLight: '#ffffff', leafDark: '#b4b4b4', bark: '#8a7a6a' }), b = b0.index ? b0.toNonIndexed() : b0;
      const n0 = b.attributes.position.count, trunk = [], r = 0.4, y0 = -0.4, y1 = 4.6, out = new THREE.BufferGeometry(), col = b.attributes.color.array, keep = [];
      // (a triangle of the bush's stems is of the bark's colour: not a grey. The leaves and the crown's cores are greys, tinted by the tree.)
      for (let t = 0; t < n0; t += 3) if (Math.abs(col[t * 3] - col[t * 3 + 2]) < 1e-4) keep.push(t, t + 1, t + 2);
      const n = keep.length;
      for (let i = 0; i < 4; i++) { const a0 = i * Math.PI / 2, a1 = a0 + Math.PI / 2, A = [r * Math.cos(a0), r * Math.sin(a0)], B = [r * Math.cos(a1), r * Math.sin(a1)], nx = Math.cos(a0 + Math.PI / 4), nz = Math.sin(a0 + Math.PI / 4);
        for (const [p, y] of [[B, y0], [A, y0], [B, y1], [B, y1], [A, y0], [A, y1]]) trunk.push([p[0], y, p[1], nx, 0, nz]); }
      for (const [name, at] of Object.entries(b.attributes)) {
        const k = at.itemSize, arr = new Float32Array((n + trunk.length) * k); keep.forEach((v, i) => { for (let j = 0; j < k; j++) arr[i * k + j] = at.array[v * k + j]; });
        if (name === 'position') for (let i = 0; i < n; i++) arr[i * 3 + 1] += LIFT;
        trunk.forEach((t, i) => { const o = (n + i) * k; if (name === 'position') arr.set(t.slice(0, 3), o); else if (name === 'normal') arr.set(t.slice(3), o); else if (name === 'color') arr.set([0.4, 0.35, 0.32], o); });
        out.setAttribute(name, new THREE.BufferAttribute(arr, k));
      }
      return out;
    })();
    // (a kind's crown reaches as far as the widest of its makes as built: the full tree, the simple one, and for an oak, an olive or a
    // blossoming tree the plainest make at the size it is drawn; crownOf: a tree's round, the wider of the two hands', at its own size)
    const PLAIN_R = planR(plainGeo), crownMakes = ([near, far], v) => Math.max(planR(near), planR(far), v < 2 ? PLAIN_R * (v ? 6.5 / 8.5 : 1) : 0);
    const crownOf = (q) => Math.max(crownR[0][q.v], crownR[1][q.v]) * q.sc;
    {
      const r0 = RN.treesL, all = treePts.map((q) => tp(q, -1)), pts = all.filter((p) => !isPlain(p));
      for (const p of all) if (isPlain(p)) plainPts.push({ ...p, col: p.v ? '#78846a' : '#5b6944', hk: p.v ? 6.5 / 8.5 : 1 });
      await ctx.yield();
      const a = flora.oakGeometry({ rng: RN.oakA, detail: 1, height: 8.5, leaf: '#5b6944', leafLight: '#8c9a66', leafDark: '#39442c', bark: '#5c4c3c', fullness: 1.15 });
      await ctx.yield();
      const b = flora.oakGeometry({ rng: RN.oakB, detail: 1, height: 6.5, leaf: '#78846a', leafLight: '#a4ad8c', leafDark: '#4a5440', bark: '#6a5a48' });
      await ctx.yield();
      const a0 = flora.oakGeometry({ rng: RN.oakA0, detail: 0, height: 8.5, leaf: '#5b6944', leafLight: '#8c9a66', leafDark: '#39442c', bark: '#5c4c3c', fullness: 1.15 });
      const b0 = flora.oakGeometry({ rng: RN.oakB0, detail: 0, height: 6.5, leaf: '#78846a', leafLight: '#a4ad8c', leafDark: '#4a5440', bark: '#6a5a48' });
      await ctx.yield();
      const pop = { height: 15, girth: 0.11, leaf: '#7a8a4a', leafLight: '#b4b870', leafDark: '#4a5630', bark: '#8a8070' };   // the stream's poplars
      const c = flora.cypressGeometry({ rng: RN.poplar, detail: 1, ...pop }), c0 = flora.cypressGeometry({ rng: RN.poplar0, detail: 0, ...pop });
      await ctx.yield();
      treeSets.push(flora.makeScatter({ rng: r0, points: pts, ...scatterOpts, variants: [a, b, c], farVariants: [a0, b0, c0] })); farGeos.push(a0, b0, c0);
      crownR[0] = [[a, a0], [b, b0], [c, c0]].map(crownMakes);
      await ctx.yield();
    }
    {
      const r0 = RN.treesR, all = treePts.map((q) => tp(q, 1)), pts = all.filter((p) => !isPlain(p));
      for (const p of all) if (isPlain(p)) plainPts.push({ ...p, col: p.v ? '#f6e4da' : '#2a9450', hk: p.v ? 6.5 / 8.5 : 1 });
      await ctx.yield();
      const a = flora.oakGeometry({ rng: RN.oakC, detail: 1, height: 8.5, leaf: '#1f8a48', leafLight: '#86d05e', leafDark: '#0e4a36', bark: '#4a3a52', fullness: 1.15 });
      await ctx.yield();
      const b = flora.cherryGeometry({ rng: RN.cherry, detail: 1, height: 6.5, leaf: '#f6e9dc', leafLight: '#fff6ea', bark: '#4a3a52' });
      await ctx.yield();
      const a0 = flora.oakGeometry({ rng: RN.oakC0, detail: 0, height: 8.5, leaf: '#1f8a48', leafLight: '#86d05e', leafDark: '#0e4a36', bark: '#4a3a52', fullness: 1.15 });
      const b0 = flora.cherryGeometry({ rng: RN.cherry0, detail: 0, height: 6.5, leaf: '#f6e9dc', leafLight: '#fff6ea', bark: '#4a3a52' });
      await ctx.yield();
      const wil = { height: 10, leaf: '#58b04a', leafLight: '#c8ec78', leafDark: '#1f6a34', bark: '#4a3a52' };                 // and, across the road, willows
      const c = flora.willowGeometry({ rng: RN.willow, detail: 1, ...wil });
      await ctx.yield();
      const c0 = flora.willowGeometry({ rng: RN.willow0, detail: 0, ...wil });
      await ctx.yield();
      treeSets.push(flora.makeScatter({ rng: r0, points: pts, ...scatterOpts, variants: [a, b, c], farVariants: [a0, b0, c0] })); farGeos.push(a0, b0, c0);
      crownR[1] = [[a, a0], [b, b0], [c, c0]].map(crownMakes);
    }
    // (a tree's long shadow is laid on the ground, away from the low sun, for every tree alike, near or far: none is drawn a second time into
    // the shadow map: an orchard and its twin drawn a second time would be some forty thousand triangles.)
    for (const t of treeSets) for (const m of t.meshes) m.castShadow = false;
    await ctx.yield();
    { const pm = new THREE.InstancedMesh(plainGeo, fmat, plainPts.length), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), c3 = new THREE.Color();
      plainPts.forEach((p, i) => { const k = p.s * p.hk; pm.setMatrixAt(i, m4.compose(v3.set(p.x, p.y - 0.2 * k, p.z), q4.setFromEuler(e3.set(0, p.rot, 0)), s3.set(k, k, k))); pm.setColorAt(i, c3.set(p.col)); });
      pm.instanceMatrix.needsUpdate = true; if (pm.instanceColor) pm.instanceColor.needsUpdate = true; pm.castShadow = false; pm.receiveShadow = false; pm.frustumCulled = false; scene.add(pm); }
    await ctx.yield();
    const treeShade = flora.makeGroundShadows({ points: [...treeSets.flatMap((t) => t.points), ...plainPts].map((q) => ({ x: q.x, z: q.z, r: 3.2 * q.s })), heightAt: hAt, sunDir, strength: 0.5, color: '#3c4064', stretch: 3, cell: 9 });
    await ctx.yield();
    scene.add(treeShade.object);
    for (const t of treeSets) scene.add(t.object);
    await ctx.yield();

    // ------------------------------------------------------------ one sky, two kinds of cloud: plain cumulus to the left, towering rose-and-gold to the right
    // (EACH FIELD KEEPS ITS OWN HAND FOR THE WHOLE VISIT: the heaps stand where they are dealt, 300 m and more from the seam, and billow
    // in place on the clock; neither field drifts, so no plain heap comes over his side nor a towering one over the plain at any second.
    // A heap's farthest puff reaches 1.18 of the heap's width from its middle (the kit's layout: its side towers and a puff's half size):
    // a heap dealt nearer the seam than 1.2 of its width is set out to that, after its draws.)
    const cr = RN.clouds, cloudAt = (side, tall) => { const a = []; for (let i = 0, n = Math.round(5 + 3 * cloudK); i < n; i++) a.push([side * cr.range(300, 2100), cr.range(tall ? 250 : 300, tall ? 340 : 460), -cr.range(200, 2900), cr.range(tall ? 460 : 440, tall ? 760 : 800)]); for (const h of a) h[0] = side * Math.max(Math.abs(h[0]), 1.2 * h[3]); return a; };
    const sunC = sky.lightColor.clone();
    const cloudRngL = RN.cloudsL, cloudAtL = cloudAt(-1, false);
    await ctx.yield();
    const cloudsL = makeCloudField({ rng: cloudRngL, at: cloudAtL, height: 0.85, puffs: 40, sunDirection: sky.sunDirection, sunColor: sunC, litColor: night ? '#8a9ac8' : '#f7f1e6', shadeColor: night ? '#1c2748' : '#8793b2', hazeColor: fogCol, wind: [0, 0, 0], silver: 1.1 });
    await ctx.yield();
    const cloudsR = makeCloudField({ rng: RN.cloudsR, at: cloudAt(1, true), height: 2.1, puffs: 52, sunDirection: sky.sunDirection, sunColor: sunC, litColor: night ? '#b8a0e0' : '#ffd9bd', shadeColor: night ? '#2a2060' : '#8a62b4', bottomColor: night ? '#241a50' : '#6c4a9a', hazeColor: fogCol, wind: [0, 0, 0], silver: 1.5, noiseTexture: cloudsL.noiseTexture });
    scene.add(cloudsL.object, cloudsR.object);
    await ctx.yield();
    const tU = U.uTime;
    const ia = PW.innAnchors(1).chimney;
    const smoke = fx.makeSmokeColumn({ rng: RN.smoke, time: tU, position: [-latInn + ia[2], ia[1], -sInn - ia[0]], height: 17, radius: [0.35, 3.2], size: [1.2, 6.5], count: 34, color: '#b9b2ac', colorTop: '#d8d2ca', shadowColor: '#6a6672', ambient: '#3a3640', opacity: 0.5, wind: [2.6, 0, -0.9], bend: 0.9, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: '#ffd9a8', rim: 0.5, scatter: 0.5 });
    scene.add(smoke.object);
    await ctx.yield();

    // ------------------------------------------------------------ small things at the roadside: a wall, a lance, the basin and the helmet; the two mounts
    // the wall with its lance stands two of its own lengths (5.4 m) before the houses' first wall and the margin behind the line of their fronts: the
    // route comes in to the road's middle there from the right lane, and the lance's point keeps the margin from it with its own reach (2.7 m)
    const sA = sNear - 2 * 5.4, latA = WALLS + MARGIN, rDoor = lerp(SK.rBase, SK.rTop, 2.3 / SK.H) * p0.scale, cy0 = Math.cos(p0.yaw), sy0 = Math.sin(p0.yaw);
    for (const side of [-1, 1]) {                                      // (each its own mesh, standing at its own place)
      const m = new THREE.Mesh(PW.propsGeometry([{ kind: 'wall', rich: side > 0, x: 0, z: 0, mir: side > 0 }]), kit.mats.solid);
      m.position.set(side * latA, hAt(side * latA, -sA), -sA); m.rotation.y = -side * Math.PI / 2; m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = kit.mats.depth; scene.add(m);
    }
    // the barber's basin hangs by the first mill's door; in the same place across the road the gold helmet stands on its stand at the giant's foot
    const basinAt = [-p0.lat + (rDoor + 0.1) * cy0, hAt(-p0.lat, -p0.s) + 2.5 * p0.scale, -p0.s - (rDoor + 0.1) * sy0], helmAt = [p0.lat - (rDoor + 1.1) * cy0, hAt(p0.lat, -p0.s), -p0.s - (rDoor + 1.1) * sy0];
    const zBridge = bedZ(0);
    // THE WATER. The stream on the other side: a sheet half a metre over the bed's floor, as wide as the floor and the foot of its banks, out to
    // 170 m (where the land's rows grow too far apart to hold it, and the ground is painted as water seen from afar). On his side the same stream
    // in a dry country: a shallow run a pace or two wide down the middle of the cracked bed, a hand deep, to the same distance. The change is
    // under the bridge. The meadow's brook: a sheet a hand over the ditch's floor wherever the ditch runs on the other side, falling into the
    // stream at its banks (his ditch lies dry). All follow their beds; they are there for the whole visit.
    {
      const pos = [], rib = [], idx = [];
      const strip = (pts, level) => {
        const b = pos.length / 3; let along = 0;
        for (let i = 0; i < pts.length; i++) {
          const [x, z, f, half, lift] = pts[i], a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, pts.length - 1)];
          const tx = c[0] - a[0], tz = c[1] - a[1], tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl;
          if (i) along += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
          const y = (level ? Math.max(hAt(a[0], a[1]), hAt(x, z), hAt(c[0], c[1])) : hAt(x, z)) + lift;
          for (const e of [-1, 1]) { pos.push(x + nx * half * e, y, z + nz * half * e); rib.push(along, e * half, half, f); }
          if (i) { const k = b + 2 * i; idx.push(k - 2, k - 1, k, k, k - 1, k + 1); }
        }
      };
      const run0 = []; for (let x = -172; x <= 172; x += 4) { const k = smoothstep(-4, 4, x); run0.push([x, bedZ(x), 1 - smoothstep(150, 170, Math.abs(x)), lerp(1.2 + 0.45 * Math.sin(x * 0.21 + bedPh), 3.9, k), lerp(0.1, 0.5, k)]); }
      strip(run0, true);
      // (the brook runs to the two houses' first wall; on the way in the ditch has no water: dark turf, no bright thread beside the road)
      const runs = [[2, sNear - 6]].flatMap(([a, b]) => (a < sBed - 5 && b > sBed + 5 ? [[a, sBed - 5], [sBed + 5, b]] : [[a, b]]));
      for (const [a, b] of runs) { const n = Math.max(2, Math.ceil((b - a) / 5)), run = []; for (let i = 0; i <= n; i++) { const s = lerp(a, b, i / n); run.push([DITCH, -s, Math.min(smoothstep(a, a + 4, s), 1 - smoothstep(b - 4, b, s)), 0.85, 0.2]); } strip(run, false); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 4)); wg.setIndex(idx);
      const wm = new THREE.Mesh(wg, makeStreamMaterial(U)); wm.frustumCulled = false; wm.renderOrder = 1; scene.add(wm);
    }
    await ctx.yield();
    // at the foot of each lane's mill, before its door on the side it faces, the miller's sacks in a heap and his two mules, loaded; in the same
    // places at the giant's feet across the road a heap of gilded coffers and two chargers (a place in the thing's own frame: metres to its right
    // and before it, turned with it; each beast stands as it was left, its facing and its phase drawn on a stream of their own, 'footBeasts')
    const footProps = [], footBeasts = [];
    for (const q of [pLL, pLR]) {
      const rD = lerp(SK.rBase, SK.rTop, 2.3 / SK.H) * q.scale, cy = Math.cos(q.yaw), sy = Math.sin(q.yaw);
      const place = (lx, lz) => [-q.lat + lx * cy + lz * sy, -q.s - lx * sy + lz * cy];
      const [hx, hz] = place(rD + 1.8, 2.5);
      for (const side of [-1, 1]) footProps.push({ kind: 'sacks', rich: side > 0, x: -side * hx, y: hAt(-side * hx, hz), z: hz, ry: -side * (Math.PI / 2 + q.yaw), s: 1.3 });
      for (const [lx, lz] of [[rD + 3.6, 5.2], [rD + 1.4, 6.8]]) { const [x, z] = place(lx, lz); footBeasts.push({ x, z, yaw: RN.footBeasts.range(-Math.PI, Math.PI), phase: RN.footBeasts.range(0, 6.28) }); }
    }
    const props = new THREE.Mesh(PW.propsGeometry([{ kind: 'basin', x: basinAt[0], y: basinAt[1], z: basinAt[2], ry: Math.PI / 2 + p0.yaw, s: p0.scale }, { kind: 'helm', x: helmAt[0], y: helmAt[1], z: helmAt[2], ry: -Math.PI / 2 - p0.yaw, s: p0.scale },
      { kind: 'bridge', x: 0, y: landAt(0, zBridge), z: zBridge }, ...footProps]), kit.mats.solid);
    props.castShadow = true; props.receiveShadow = true; scene.add(props);
    await ctx.yield();
    const ar = RN.animals;
    // (the mounts stand in the outer yards before the houses, by the road-side wall: a length and two lengths in from the first wall, a length and a
    // length and a half behind the wall; the pages' horses in the castle's ward after it, the inn's mule in its garden, in the same places)
    // (a mount stands as it was left: its facing is drawn, anywhere round; a mount's length is 2.4 m)
    const mounts = [['horse', 'charger', WALLS + 2.4, sNear + 2.4, 1.0], ['donkey', 'palfrey', WALLS + 1.5 * 2.4, sNear + 2.5 * 2.4, 1.0],
      ['donkey', 'palfrey', WALLS + 3 * 2.4, sFar - 2 * 2.4, 0.95], ['donkey', 'charger', WALLS + 5 * 2.4, sFar - 3.5 * 2.4, 1.0]].map((q) => [...q.slice(0, 4), ar.range(-Math.PI, Math.PI), q[4], ar.range(0, 6.28)]);
    for (const side of [-1, 1]) scene.add(PW.makeCreatures(PW.creatureGeometry(side < 0 ? 'donkey' : 'charger'), kit.mats.limb, footBeasts.map((b) => ({ x: -side * b.x, y: hAt(-side * b.x, b.z), z: b.z, yaw: -side * b.yaw, scale: 1, phase: b.phase, rate: 0.8, gait: 1, nod: 1 })), { depth: kit.mats.depth }));
    // (the mounts of one make on one hand are one mesh: they stand within the two houses' yards, a hundred metres end to end)
    for (const side of [-1, 1]) for (const kind of new Set(mounts.map((q) => q[side < 0 ? 0 : 1]))) {
      scene.add(PW.makeCreatures(PW.creatureGeometry(kind), kit.mats.limb, mounts.filter((q) => q[side < 0 ? 0 : 1] === kind).map(([, , lat, s, yaw, sc, ph]) => ({ x: side * lat, y: hAt(side * lat, -s), z: -s, yaw: -side * yaw, scale: sc, phase: ph, rate: 0.8, gait: 1, nod: 1 })), { depth: kit.mats.depth }));
    }
    await ctx.yield();

    // pigs rooting before the inn's gate; in the same places on the other side, swans on the moat's front arm: between the road's edge and the front
    // wall, a good metre from either, on either side of the drawbridge out to four fifths of the house's half length
    const nPig = 6, pigHome = [];
    for (let i = 0; i < nPig; i++) pigHome.push({ lat: ar.range(WALLS - YARD.moat + 1.1, WALLS - 1.4), s: sInn + (i % 2 ? 1 : -1) * ar.range(YARD.gate, 0.4 * YARD.W), w: ar.range(0.2, 0.32), ph: ar.range(0, 6.28), a: ar.range(1.6, 2.6), sc: ar.range(0.85, 1.15), gp: ar.range(0, 6.28) });
    // THE SWANS' GROUND IS THE MOAT'S FRONT ARM LESS WHAT OF THE CASTLE STANDS IN IT, BY A SWAN'S LENGTH (the swan as built, at its own
    // size): the gatehouse and its drawbridge, the gate's two turrets, the two corner towers (PW.CASTLE_FRONT, the castle's own numbers).
    // Each round's WHOLE COURSE is walked here against them. A round that would pass nearer keeps every number drawn for it and takes
    // the nearest home (by quarter metres, along the moat and toward the road, within the ground dealt above) from which its whole course
    // is clear; the pig across the road, its twin, takes the same home. (If none were clear the pair would be left out: `out`.)
    // (From the front wall itself a swan keeps its own reach before its middle and 0.8 m: at the ends of its round it faces the wall.)
    const swanGeo = PW.creatureGeometry('swan'), SWAN_L = boxOf(swanGeo).max.z - boxOf(swanGeo).min.z, SWAN_FORE = boxOf(swanGeo).max.z / SWAN_L, CF = PW.CASTLE_FRONT;
    const swanClear = (lat, s, a, len) => { for (let i = 0; i < 48; i++) { const th = i / 48 * TAU, ds = Math.abs(s + a * Math.sin(th) - sInn), dl = WALLS - lat - 0.55 * Math.sin(2 * th);
      if (dl < SWAN_FORE * len + 0.8 || ds < CF.bridge + len || Math.hypot(ds - CF.turret[0], dl - CF.turret[1]) < CF.turret[2] + len || Math.hypot(ds - CF.corner[0], dl - CF.corner[1]) < CF.corner[2] + len) return false; } return true; };
    for (const q of pigHome) { const len = SWAN_L * 1.5 * q.sc, sg = q.s < sInn ? -1 : 1, d0 = Math.abs(q.s - sInn); let best = null;
      if (swanClear(q.lat, q.s, q.a, len)) continue;
      for (let d = YARD.gate; d <= 0.4 * YARD.W + 1e-6; d += 0.25) for (let lat = WALLS - YARD.moat + 1.1; lat <= WALLS - 1.4 + 1e-6; lat += 0.25) {
        const far = Math.hypot(d - d0, lat - q.lat); if ((!best || far < best[0]) && swanClear(lat, sInn + sg * d, q.a, len)) best = [far, lat, sInn + sg * d]; }
      if (best) { q.lat = best[1]; q.s = best[2]; q.moved = best[0]; } else q.out = true; }
    { const kept = pigHome.filter((q) => !q.out); pigHome.length = 0; pigHome.push(...kept); }
    const pigs = PW.makeMover(PW.makeCreatures(PW.creatureGeometry('pig'), kit.mats.limb, pigHome.map((q) => ({ x: -q.lat, z: -q.s, phase: q.gp, rate: 5, gait: 7, nod: 0.6 })), { moving: true }));
    const swans = PW.makeMover(PW.makeCreatures(swanGeo, kit.mats.limb, pigHome.map((q) => ({ x: q.lat, z: -q.s, phase: q.gp, rate: 0, gait: 0, nod: 1 })), { moving: true, shadow: false }));
    scene.add(pigs.mesh, swans.mesh);
    // (the pigs and the swans keep to the ground before the gates: each mesh is given the sphere of that ground, so that it is drawn, and
    // drawn into the shadow map, only when that ground is in the picture or in the light's box)
    { const r = Math.max(...pigHome.map((q) => Math.hypot(q.lat - WALLS, q.s - sInn) + q.a)) + 3;
      for (const [m, side] of [[pigs.mesh, -1], [swans.mesh, 1]]) { m.boundingSphere = new THREE.Sphere(new THREE.Vector3(side * WALLS, hAt(side * WALLS, -sInn) + 1, -sInn), r); m.frustumCulled = true; } }
    await ctx.yield();
    const moveYard = (time) => {
      for (let i = 0; i < pigHome.length; i++) {
        const q = pigHome[i], th = time * q.w + q.ph, lat = q.lat + 0.55 * Math.sin(2 * th), s = q.s + q.a * Math.sin(th);
        const yaw = Math.atan2(-1.1 * Math.cos(2 * th), -q.a * Math.cos(th));       // heading of the left one; the right one is its mirror
        pigs.set(i, -lat, 0, -s, yaw, q.sc); swans.set(i, lat, -0.56, -s, -yaw, q.sc * 1.5);
      }
      pigs.commit(); swans.commit();
    };

    // ------------------------------------------------------------ two flocks in their dust; opposite them, in the same places, two hosts (each stands at its own place for the whole visit)
    // (their layout stands above, with the route's). Each drove: ewes with dark faces, one in eleven black, one in five a lamb, one in
    // nine a ram; in the same places across the road foot soldiers in two liveries, pages, mounted men-at-arms. Two herdsmen stand with each drove at
    // places drawn for them along its outer edge (bearers of the great banners across the road); a dog runs round it.
    const nMem = Math.round(nHead * (0.6 + 0.4 * detail)), members = [], herders = [], runners = [];
    for (const [k, G] of groups.entries()) {
      const fk = RN['flock' + k], cell = Math.sqrt(3.6 * G.a * G.b / nMem);
      for (let ix = -G.a; ix <= G.a; ix += cell) for (let iz = -G.b; iz <= G.b; iz += cell) {
        const ox = ix + fk.range(-0.3, 0.3) * cell, oz = iz + fk.range(-0.3, 0.3) * cell, sc = fk.range(0.88, 1.16), ph = fk.range(0, 6.28);
        if ((ox / G.a) ** 4 + (oz / G.b) ** 4 < 1) members.push({ k, ox, oz, sc, ph });
      }
      for (let i = 0; i < 2; i++) herders.push({ k, ox: G.a - fk.range(0.4, 1.2), oz: fk.range(-0.8, 0.8) * G.b, sc: fk.range(0.95, 1.1), ph: fk.range(0, 6.28) });
      runners.push({ k, ph: fk.range(0, 6.28), w: fk.range(0.45, 0.6) * fk.sign(), sc: fk.range(0.95, 1.15) });
    }
    // EVERY BEAST OF A FLOCK GRAZES ON A ROUND OF ITS OWN ON THE WORLD CLOCK (streams 'grazing' and 'fieldGrazing'): a ring of 0.45 to 1 m
    // about its own place in the drove, at an ambling 0.22 to 0.4 m/s one way or the other, so a round in seven to twenty-eight seconds;
    // its legs step by the metres of that round (its stride, two steps, at its own size) on the same clock. The men across the road stand
    // in their ranks and shift their weight (legs at a sixth of a stride's swing, slowly); herdsmen and bearers stand.
    const graze = (list, rng) => { for (const q of list) { q.r = rng.range(0.45, 1.0); q.w = rng.range(0.22, 0.4) / q.r * rng.sign(); } };
    const crowd = (kind, list, o) => { const m = PW.makeMover(PW.makeCreatures(PW.creatureGeometry(kind), kit.mats.limb, list.map((q) => ({ x: 0, z: 0, phase: q.ph, rate: o.stride ? Math.abs(q.w) * q.r * TAU / (o.stride * q.sc * (o.size ?? 1)) : o.rate, gait: o.gait ?? 1, nod: 1 })), { moving: true, shadow: o.shadow, depth: kit.mats.depth })); scene.add(m.mesh); return m; };
    graze(members, RN.grazing);
    members.forEach((q, i) => { q.big = i % 9 === 4; q.small = !q.big && i % 5 === 2; q.black = !q.big && !q.small && i % 11 === 7; });
    const foot = members.filter((q) => !q.big), bigs = members.filter((q) => q.big), white = foot.filter((q) => !q.black), black = foot.filter((q) => q.black);
    const sheep = crowd('sheep', white, { stride: 0.75, size: 1.4, shadow: true }), sheepB = crowd('sheepB', black, { stride: 0.75, size: 1.4, shadow: true });
    await ctx.yield();
    const memA = foot.filter((q, i) => i % 2 === 0), memB = foot.filter((q, i) => i % 2 === 1);
    const soldA = crowd('soldierA', memA, { rate: 0.7, gait: 0.16, shadow: true }), soldB = crowd('soldierB', memB, { rate: 0.7, gait: 0.16, shadow: true });
    await ctx.yield();
    const rams = crowd('ram', bigs, { stride: 0.9, size: 1.45, shadow: true }), knights = crowd('knight', bigs, { rate: 0.5, gait: 0.12, shadow: true });
    await ctx.yield();
    const shepherds = crowd('shepherd', herders, { rate: 0, shadow: true }), bearers = crowd('bearer', herders, { rate: 0, shadow: true });
    // (a dog runs on the clock round its drove, some eight metres a second: its legs go at a run's rate on the same clock)
    const dogs = crowd('dog', runners, { rate: 13, shadow: false }), hounds = crowd('hound', runners, { rate: 13, shadow: false });
    // THE DROVES' DUST: the grazing beasts' feet and the wind over the grazed ground raise it; it lies down the wind and rises to about
    // a ewe's back, a third of a metre over it at the most (BACK: the top of the ewe as built, at the least size a drove's ewe has), each puff on the ground of its own place
    const BACK = boxOf(PW.creatureGeometry('sheep')).max.y * 1.4 * 0.88;
    const dust = PW.makeDust(U, { rng: RN.dust, count: 2 * Math.round(48 * (0.6 + 0.4 * detail)), halfW: Math.max(groups[0].b, groups[1].b), mouth: sMouth, fogColor: fogCol, fogDensity: scene.fog.density,
      ochre: mulc(PAL.dust, 0.62), gold: [0.95, 0.6, 0.15], back: BACK });
    scene.add(dust.mesh);
    await ctx.yield();
    // (toward the street's mouth a drove draws in to half its width, over a drove's half length before the mouth)
    const narrow = (s) => lerp(1, 0.5, smoothstep(sMouth - groups[1].b, sMouth, s));
    // (the droves stand for the whole visit: their dust is laid once)
    for (let k = 0; k < 2; k++) { const G = groups[k]; dust.groups[k].set(CROWD_IN + G.a * narrow(G.s), G.s, G.a * narrow(G.s), 1); }
    dust.lay(hAt);
    const allCrowd = [sheep, sheepB, soldA, soldB, rams, knights, shepherds, bearers, dogs, hounds];
    const crowdsL = [sheep, sheepB, rams, shepherds, dogs], crowdsR = [soldA, soldB, knights, bearers, hounds];
    for (const m of allCrowd) { m.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80); m.mesh.frustumCulled = true; }
    const moveCrowds = (time) => {
      let ia = 0, ib = 0, iw = 0, ik = 0, ig = 0, n = 0;
      for (let i = 0; i < members.length; i++) {
        const q = members[i], G = groups[q.k], s = G.s + q.oz, lat = CROWD_IN + (G.a + q.ox) * narrow(s), yaw = Math.PI + 0.12 * Math.sin(time * 0.4 + q.ph * 3.3);
        // (the beast on its round: th by the clock; it faces the way it goes. The man in its place across the road stands and turns his head.)
        const th = time * q.w + q.ph, sb = s + q.r * Math.sin(th), lb = lat + q.r * Math.cos(th), yb = Math.atan2(q.r * q.w * Math.sin(th), -q.r * q.w * Math.cos(th));
        const yl = hAt(-lb, -sb), yr = hAt(lat, -s);
        if (q.big) { rams.set(ig, -lb, yl, -sb, yb, q.sc * 1.45); knights.set(ig, lat, yr, -s, -yaw, q.sc * 1.12); ig++; continue; }
        if (q.black) sheepB.set(ik++, -lb, yl, -sb, yb, q.sc * 1.4); else sheep.set(iw++, -lb, yl, -sb, yb, q.sc * (q.small ? 0.78 : 1.4));
        if (n++ % 2 === 0) soldA.set(ia++, lat, yr, -s, -yaw, q.sc * (q.small ? 0.9 : 1.16)); else soldB.set(ib++, lat, yr, -s, -yaw, q.sc * (q.small ? 0.9 : 1.16));
      }
      for (let i = 0; i < herders.length; i++) { const q = herders[i], G = groups[q.k], s = G.s + q.oz, lat = CROWD_IN + (G.a + q.ox) * narrow(s); shepherds.set(i, -lat, hAt(-lat, -s), -s, Math.PI, q.sc * 1.15); bearers.set(i, lat, hAt(lat, -s), -s, -Math.PI, q.sc * 1.15); }
      for (let i = 0; i < runners.length; i++) {
        const q = runners[i], G = groups[q.k], th = time * q.w + q.ph, s = G.s + (G.b + 2) * Math.sin(th), nk = narrow(s), lat = CROWD_IN + (G.a + (G.a + 1.2) * Math.cos(th)) * nk + 1.2;
        const yaw = Math.atan2((G.a + 1.2) * nk * Math.sin(th) * q.w, -(G.b + 2) * Math.cos(th) * q.w);
        dogs.set(i, -lat, hAt(-lat, -s), -s, yaw, q.sc * 1.2); hounds.set(i, lat, hAt(lat, -s), -s, -yaw, q.sc * 1.2);
      }
      // (each crowd mesh holds both droves of its kind on one side of the road: its bounds are the ball about both; the droves and their dust stand
      // in the scene for the whole visit)
      const lat = CROWD_IN + DROVE, zc = -(groups[0].s + groups[1].s) / 2, r = Math.hypot(DROVE + 8, Math.abs(groups[0].s - groups[1].s) / 2 + groups[0].b + 8);
      for (const m of crowdsL) m.mesh.boundingSphere.center.set(-lat, 2, zc); for (const m of crowdsR) m.mesh.boundingSphere.center.set(lat, 2, zc);
      for (const m of allCrowd) { m.mesh.boundingSphere.radius = r; m.commit(); }
    };

    // the opening's two small droves (their places stand above, with the route's): ewes, a shepherd at the outer edge, a dog that runs round;
    // foot soldiers, a banner's bearer, a hound. Their meshes are their own (the ewes and the soldiers a mesh to each drove, the rest one
    // of each kind a hand), so that they are not drawn once behind us, nor into the shadow map from far off; their dust is the droves' dust
    // in its own sheet.
    const ff = RN.fieldFlock, fMembers = [], fHerders = [], fRunners = [];
    for (const [k, G] of fdroves.entries()) {
      const cell = Math.sqrt(3.6 * FD_A * FD_B / 24);
      for (let ix = -FD_A; ix <= FD_A; ix += cell) for (let iz = -FD_B; iz <= FD_B; iz += cell) {
        const ox = ix + ff.range(-0.3, 0.3) * cell, oz = iz + ff.range(-0.3, 0.3) * cell, sc = ff.range(0.88, 1.16), ph = ff.range(0, 6.28), small = ff.chance(0.2);
        if ((ox / FD_A) ** 4 + (oz / FD_B) ** 4 < 1) fMembers.push({ k, ox, oz, sc, ph, small });
      }
      fHerders.push({ k, ox: FD_A - ff.range(0.4, 1.2), oz: ff.range(-0.8, 0.8) * FD_B, sc: ff.range(0.95, 1.1), ph: ff.range(0, 6.28) });
      fRunners.push({ k, ph: ff.range(0, 6.28), w: ff.range(0.45, 0.6) * ff.sign(), sc: ff.range(0.95, 1.15) });
    }
    graze(fMembers, RN.fieldGrazing);
    const fOf = [0, 1].map((k) => fMembers.filter((q) => q.k === k));
    // (the drove at the first pair's feet throws its shadows; the one by the road past the giant, further from our line, does not)
    const fSheep = fOf.map((l, k) => crowd('sheep', l, { stride: 0.75, size: 1.4, shadow: k === 0 })), fSold = fOf.map((l, k) => crowd('soldierA', l, { rate: 0.7, gait: 0.16, shadow: k === 0 }));
    await ctx.yield();
    const fShep = crowd('shepherd', fHerders, { rate: 0, shadow: true }), fBear = crowd('bearer', fHerders, { rate: 0, shadow: true }), fDogs = crowd('dog', fRunners, { rate: 13, shadow: false }), fHounds = crowd('hound', fRunners, { rate: 13, shadow: false });
    const fDust = PW.makeDust(U, { rng: RN.fieldDust, count: 2 * Math.round(24 * (0.6 + 0.4 * detail)), halfW: FD_B, fogColor: fogCol, fogDensity: scene.fog.density, ochre: mulc(PAL.dust, 0.62), gold: [0.95, 0.6, 0.15], back: BACK });
    scene.add(fDust.mesh);
    const fCrowd = [fShep, fBear, fDogs, fHounds, ...fSheep, ...fSold];
    { const zc = -(fdroves[0].s0 + fdroves[1].s0) / 2, r = (fdroves[1].s0 - fdroves[0].s0) / 2 + FD_B + 12;
      for (const [i, m] of [fShep, fBear, fDogs, fHounds].entries()) { m.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3((i % 2 ? 1 : -1) * 22, 2, zc), r); m.mesh.frustumCulled = true; }
      for (const [k, G] of fdroves.entries()) for (const [m, sgn] of [[fSheep[k], -1], [fSold[k], 1]]) {
        m.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(sgn * G.lat, 2, -G.s0), FD_B + 6); m.mesh.frustumCulled = true; }
      fDust.mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, zc), r + 30); fDust.mesh.frustumCulled = true; }
    for (const G of fdroves) G.s = G.s0;                                // (they stand where they stand, as the two droves by the village do)
    for (let k = 0; k < 2; k++) { const G = fdroves[k]; fDust.groups[k].set(G.lat, G.s, FD_A, 1); }
    fDust.lay(hAt);
    const moveFieldDroves = (time) => {
      for (let k = 0; k < 2; k++) fOf[k].forEach((q, i) => { const G = fdroves[k], s = G.s + q.oz, lat = G.lat + q.ox, yaw = Math.PI + 0.12 * Math.sin(time * 0.4 + q.ph * 3.3);
        const th = time * q.w + q.ph, sb = s + q.r * Math.sin(th), lb = lat + q.r * Math.cos(th), yb = Math.atan2(q.r * q.w * Math.sin(th), -q.r * q.w * Math.cos(th));
        fSheep[k].set(i, -lb, hAt(-lb, -sb), -sb, yb, q.sc * (q.small ? 0.78 : 1.4)); fSold[k].set(i, lat, hAt(lat, -s), -s, -yaw, q.sc * (q.small ? 0.9 : 1.16)); });
      fHerders.forEach((q, i) => { const G = fdroves[q.k], s = G.s + q.oz, lat = G.lat + q.ox; fShep.set(i, -lat, hAt(-lat, -s), -s, Math.PI, q.sc * 1.15); fBear.set(i, lat, hAt(lat, -s), -s, -Math.PI, q.sc * 1.15); });
      fRunners.forEach((q, i) => { const G = fdroves[q.k], th = time * q.w + q.ph, s = G.s + (FD_B + 2) * Math.sin(th), lat = G.lat + (FD_A + 1.2) * Math.cos(th);
        const yaw = Math.atan2((FD_A + 1.2) * Math.sin(th) * q.w, -(FD_B + 2) * Math.cos(th) * q.w);
        fDogs.set(i, -lat, hAt(-lat, -s), -s, yaw, q.sc * 1.2); fHounds.set(i, lat, hAt(lat, -s), -s, -yaw, q.sc * 1.2); });
      for (const m of fCrowd) m.commit();
    };

    // ------------------------------------------------------------ birds: a crow that crosses the road is a falcon from the seam on; butterflies become small bright birds
    // the crossings (stream 'crows') have their places in the world. A crow's perch is the point of a mill's cap. ITS CROSSINGS ARE A HABIT ON THE
    // WORLD CLOCK (it does not wait for us; stream 'crowRounds'): it sits there, wings folded, for 9 to 18 s, dips across the
    // road behind the sails at CROW_V metres a second, is a falcon when it folds its wings on the crest of the giant's helm opposite, sits as
    // long there and flies back the same way, a crow again from the seam on; where on that round it is at the clock's nought is drawn for it.
    // The close pairs, the lanes' pairs and the outpost have each a crow, then the nearest of the plain's pairs within five and a half mills
    // of the road, seven crows at the most. NO CROSSING COMES NEAR OUR LINE AT ANY SECOND OF THE CLOCK: a crossing's whole way stays above
    // the highest our line goes anywhere within its own length of the road (read off the route's table), by two and a half metres, the
    // bird's own reach at its largest (CROW_REACH) and a hand more; its dip is made that much shallower where it must be.
    // OUR LINE is the route and its first straight continued sixty metres back behind the entry, level, at the entry's height (the eye that
    // comes to this world through a ring comes up that straight; backGap is the distance to it in plan): a pair behind the entry has its
    // crow too, and that crossing keeps as far above that straight.
    const e0 = path.pointAt(0, new THREE.Vector3()), e1 = path.pointAt(0.002, new THREE.Vector3()), eL = Math.hypot(e1.x - e0.x, e1.z - e0.z), ehx = (e1.x - e0.x) / eL, ehz = (e1.z - e0.z) / eL;
    const backGap = (x, z) => { const t = clamp(-((x - e0.x) * ehx + (z - e0.z) * ehz), 0, 60); return Math.hypot(x - (e0.x - ehx * t), z - (e0.z - ehz * t)); };
    const cw = RN.crows, crr = RN.crowRounds, perches = [...closeAll].sort((a, b) => a.s - b.s), CROW_V = 14, CROW_REACH = 2.3;
    for (const q of pairs.filter((q) => !closeAll.includes(q) && q.lat < 5.5 * MH).sort((a, b) => a.s - b.s)) if (perches.length < 7) perches.push(q);
    const flights = perches.slice(0, 7).map((q) => { const F = { q, dip: cw.range(5, 8.5) * Math.min(1.7, q.lat / 18), sc: cw.range(1.7, 2.1), sit: crr.range(9, 18), ph: crr(), dur: 2 * q.lat / CROW_V, yl: hAt(-q.lat, -q.s), yr: hAt(q.lat, -q.s) };
      F.y0 = F.yl + (SK.H + SK.capH) * q.scale + 0.35; F.y1 = F.yr + 20.25 * q.scale + 0.35; F.T = 2 * (F.sit + F.dur);
      F.floor = Math.max(routeTop(0, -q.s - 2, q.lat + 6), backGap(0, -q.s - 2) < q.lat + 6 ? e0.y : -1e9) + 2.5 + CROW_REACH + 0.3; F.dip = Math.max(0, Math.min(F.dip, (F.y0 + F.y1) / 2 - F.floor)); return F; });
    const wb = RN.wheel, flyMat = PW.makeFlyerMaterial(U), nCross = flights.length, nRoam = Math.round(clamp(10 * dens, 5, 15)), nBig = nCross + nRoam;
    const roamers = [];
    // the wheeling birds (stream 'wheel') turn on the clock over the country that has something under them: the lanes and the way in, from the left
    // lane's start to the village's mouth; each a wide eight across the road, two to four mills to either hand and one to two along it. Each keeps
    // its whole figure, a bob of a metre and a half and six metres more, above the highest the route goes (in absolute height) anywhere within its
    // own figure's reach, read from the route's table here, and never under a mill's height above the ground.
    for (let i = 0; i < nRoam; i++) {
      const q = { X: MH * wb.range(2, 4), L: MH * wb.range(1, 2), s: wb.range(sL0, sMouth), y: 0, ph: wb.range(0, 6.28), dir: wb.sign(), sc: wb.range(1.0, 1.35) }, up = wb.range(0, 10);
      q.y = Math.max(routeTop(0, -q.s, Math.hypot(q.X, q.L) + 4) + 6, hAt(0, -q.s) + MH) + 1.5 + up; roamers.push(q);
    }
    // (every great bird's wings, the crossing crows' and the wheeling ones': their phase and beat on a stream of their own, 'crowWings')
    const big = PW.makeFlyers(flyMat, 0, nBig, (i) => [RN.crowWings(), RN.crowWings.range(7.5, 10.5), 1, i < nCross ? 0.5 : 1]);
    // the butterflies (small bright birds right of the seam; stream 'flutter') keep to the flowers, where the country's own lines make them
    // thickest: over the two verges and the ditch's banks (3.9 to 10 m from the road's middle, from behind the entry to the village's mouth), one
    // to every four metres of road; and over the two lanes' ground (within eight metres of a lane's line, the lanes' length), one to every two
    // metres. Each is under a rider's eye above the ground and flutters on the clock about its own place: a wander of FLUT_X and FLUT_Z
    // metres either way as coded below (three and a half metres at most in plan) and a bob of FLUT_Y up and down. None has its place nearer
    // the route's line in space than FLUT_OFF: that wander, the bob, its own widest span (0.4 m) and two and a half metres. THE LINE, for
    // this rule as for the flowers', is the route and its first straight continued sixty metres back behind the entry, level, at the
    // entry's height (e0, backGap: above, at the crows).
    const FLUT_X = [1.7, 0.78], FLUT_Z = [1.7, 0.71], FLUT_Y = 0.45, FLUT_OFF = Math.hypot(FLUT_X[0] + FLUT_X[1], FLUT_Z[0] + FLUT_Z[1], FLUT_Y) + 0.4 + 2.5;
    const bf = RN.flutter, kFlut = clamp(dens, 0.8, 1.2) * (0.5 + 0.5 * detail), nVerge = Math.round((sMouth + 20) / 4 * kFlut), nSmall = nVerge + Math.round((sR1 - sL0) / 2 * kFlut), smalls = [];
    for (let i = 0; i < nSmall; i++) {
      const onVerge = i < nVerge, x = bf.sign() * (onVerge ? bf.range(ROAD_HALF + 0.3, 10) : LANE + bf.range(-8, 8)), z = -(onVerge ? bf.range(-20, sMouth) : bf.range(sL0, sR1));
      const q = { x, z, y: hAt(x, z) + lerp(0.4, RIDER - 0.7, bf()), a: bf.range(0, 6.28), b: bf.range(0, 6.28), w: bf.range(0.5, 1.1), sc: bf.range(0.26, 0.4) };
      if (!inYards(x, z) && !inBed(x, z, 5.5) && path.distanceTo(x, q.y, z) >= FLUT_OFF && Math.hypot(backGap(x, z), q.y - e0.y) >= FLUT_OFF) smalls.push(q);
      if (i % 200 === 199) await ctx.yield();
    }
    const nFlut = smalls.length, small = PW.makeFlyers(flyMat, 1, nFlut, () => [bf(), bf.range(16, 26), 1, 0]);
    scene.add(big.mesh, small.mesh);
    await ctx.yield();
    const moveFlyers = (time) => {
      for (let k = 0; k < nCross; k++) {
        // (its round by the clock, in four parts: on the cap, across, on the helm, back. f is how far across it is. While it sits it turns
        // about on its perch, evenly, to face the way it will go next, so its heading has no jump anywhere on the round.)
        const F = flights[k], q = F.q, t = (Math.max(time, 0) + F.ph * F.T) % F.T, part = t < F.sit ? 0 : t < F.sit + F.dur ? 1 : t < 2 * F.sit + F.dur ? 2 : 3, HALF = Math.PI / 2;
        const f = part === 0 ? 0 : part === 1 ? (t - F.sit) / F.dur : part === 2 ? 1 : 1 - (t - 2 * F.sit - F.dur) / F.dur, e = f * f * (3 - 2 * f), air = 4 * e * (1 - e), dir = part === 3 ? -1 : 1;
        const yaw = part === 0 ? -HALF + Math.PI * smoothstep(0, 1, t / F.sit) : part === 1 ? HALF - 0.2 * air : part === 2 ? HALF - Math.PI * smoothstep(0, 1, (t - F.sit - F.dur) / F.sit) : -HALF + 0.2 * air;
        big.set(k, lerp(-q.lat, q.lat, e), Math.max(lerp(F.y0, F.y1, e) - F.dip * air, Math.min(F.floor, F.y0, F.y1)), -q.s - 4 * air, yaw, -0.5 * (1 - 2 * e) * air * dir, 0, F.sc * (0.7 + 0.3 * Math.min(1, air * 6)));
        big.air(k, Math.min(1, air * 8));                              // a crow that sits, sits: wings folded at either end of its crossing
      }
      for (let i = 0; i < nRoam; i++) {                                // the others wheel over the plain in wide eights that cross the road
        const q = roamers[i], w = 8.5 / q.X * q.dir, th = time * w + q.ph, x = q.X * Math.sin(th), z = -q.s + q.L * Math.sin(2 * th), vx = q.X * Math.cos(th) * w, vz = 2 * q.L * Math.cos(2 * th) * w;
        big.set(nCross + i, x, q.y + 1.5 * Math.sin(th * 1.7), z, Math.atan2(vx, vz), 0, -0.5 * Math.sin(2 * th) * q.dir, q.sc);
      }
      big.commit();
      for (let i = 0; i < nFlut; i++) {
        const q = smalls[i], t = time * q.w;
        const x = q.x + FLUT_X[0] * Math.sin(t * 0.6 + q.a) + FLUT_X[1] * Math.sin(t * 1.7 + q.b), z = q.z + FLUT_Z[0] * Math.cos(t * 0.5 + q.b) + FLUT_Z[1] * Math.sin(t * 1.3 + q.a);
        const vx = 0.6 * FLUT_X[0] * Math.cos(t * 0.6 + q.a) + 1.7 * FLUT_X[1] * Math.cos(t * 1.7 + q.b), vz = -0.5 * FLUT_Z[0] * Math.sin(t * 0.5 + q.b) + 1.3 * FLUT_Z[1] * Math.cos(t * 1.3 + q.a);
        small.set(i, x, q.y + FLUT_Y * Math.sin(t * 2.3 + q.a), z, Math.atan2(vx, vz), 0.2 * Math.sin(t * 3.1 + q.b), 0, q.sc);
      }
      small.commit();
    };

    // ------------------------------------------------------------ the air: dust drifting across the road from the left is gold motes on the right; brass and gold glint
    // the motes have their places in the world: dealt once along the seam from behind the entry to the village's mouth (none in the street: the air
    // between the mouth and the ring is clear), thick over the road and its verges and thinning to twenty-four metres either side, from the ground to
    // a hub's height; each wanders on the clock about its own place, and is dust left of the seam and gold right of it
    const mr = RN.motes, nMote = Math.round(20 * sMouth * (0.5 + 0.5 * detail)), motePts = [];
    for (let i = 0; i < nMote; i++) {
      const x = mr.sign() * 24 * Math.pow(mr(), 1.6), z = -mr.range(-40, sMouth);
      motePts.push([x, hAt(x, z) + 0.3 + SK.hubY * Math.pow(mr(), 1.7), z, mr(), mr.range(0.035, 0.085), mr.range(2, 7), mr.range(0.5, 1)]);
      if (i % 4000 === 3999) await ctx.yield();
    }
    await ctx.yield();
    const moteMat = PW.makeSparkMaterial(U, { wrap: true, fogDensity: scene.fog.density, dust: mulc(PAL.dust, 0.9) });
    await ctx.yield();
    const motes = PW.makeSparks(moteMat, motePts);
    await ctx.yield();
    // glints sit on the brass and the gold themselves: the basin by the first mill's door and the helmet across the road from it, the basin and the
    // helmet at the wall before the two houses, the castle's pinnacles
    const glintPts = [[basinAt[0], basinAt[1], basinAt[2] + 0.2, 0.1, 1.5, 2.3, 1], [helmAt[0], helmAt[1] + 2.35 * p0.scale, helmAt[2] + 0.2, 0.1, 1.5, 2.3, 1],
      [-(latA - 0.5), hAt(-latA, -sA) + 0.7, -sA + 1.2, 0.6, 1.0, 2.9, 0.9], [latA - 1.0, hAt(latA, -sA) + 1.9, -sA + 1.2, 0.6, 1.0, 2.9, 0.9]];
    // (the point of every roof of the castle, read off the castle's own numbers: PW.castleTips, in the castle's frame)
    for (const [lx, y, lz] of PW.castleTips()) glintPts.push([latInn - lz, y + 0.1, -sInn + lx, 0, 2.2, 2, 0.8]);
    { const gf = RN.glints; for (const q of glintPts) { q[3] = gf(); q[5] = gf.range(1.5, 3); } }   // every glint's twinkle (phase, rate) on the stream 'glints'
    const glintMat = PW.makeSparkMaterial(U, { wrap: false, fogDensity: scene.fog.density }), glints = PW.makeSparks(glintMat, glintPts);
    scene.add(motes, glints);
    const dbs = new THREE.Vector2(), flown = new THREE.Vector3();
    // THE WIND GOES BY THE WORLD CLOCK (it neither waits for us nor follows us). It blows in gusts of its own for the whole visit, from
    // the first frame, for a visitor who stands still too: its strength is kit.wind.at(time) (1 in a lull to 1.9 in a gust; cloth, crops
    // and flowers lean by it), and the sails and the arms turn by it all the while (wind.spin in the kit's update: a third faster in a
    // gust, a third slower between). Where its two swells are at the clock's nought is drawn for the visit (stream 'wind').
    // NOTHING CHANGES SIDES: what stands left of the road stands there for the whole visit, and what stands right of it likewise.
    const blow = (time) => { U.uWind.value.z = kit.wind.at(time); };
    await ctx.yield();

    // ------------------------------------------------------------ what stands up near, and the far layer
    // flowers that stand on their stems, each in its own place in the world and of its own size wherever we are. They are dealt in clumps (stream
    // 'verge') by this country's own lines: the SEAM's two verges, between the road's broken edge (3.9 m) and the ditch's near lip (6 m), hold three
    // clumps in ten; the rest stand from the ditch's far lip (9 m) outward, through the lanes we fly, thinning to nothing some thirty metres out: so
    // the verges and the lanes' ground are the thickest. None in the ditch's bottom, on the road, in the yards, the moat, the
    // stream's bed, on a threshing floor or under a thing. A ring of them stands round the foot of every right-hand thing (each giant, the castle's
    // moat, the ogres); on the left three in four are thistles and dry heads (fewer, as on the right there are fewer bare stems), poppies in their
    // season. Out on the right-hand plain the drifts the ground paints (broom, poppy, flax) are flowers too, standing where the ground's own drift
    // function says. EVERY FLOWER STANDS FOR THE WHOLE VISIT, in its place and at its true size: none sinks, none is left undrawn, nothing of them
    // reads the eye. So that they are not too many they are dealt by the place:
    //   from behind the entry to the gateway and no further (the road ends there);
    //   the clumps where the country's lines hold them (the verges, the ditch's far bank, the lanes' ground, the rings at the right-hand things' feet);
    //   a drift's flowers by how far the place lies from our line in plan: all of them within thirty metres of it, evenly fewer beyond, none
    //   further than sixty (a head of a hand's width is some three pixels there): beyond, the drift the ground paints carries the colour;
    //   and a flower further than thirty metres from our line is its head alone (its stem, three centimetres wide, could not be seen from the line).
    const STEM_D = 30, FL = 40, fl = RN.verge, flowers = [], nChunk = Math.ceil((ROAD + 400) / FL), fk = clamp(dens, 0.8, 1.15) * (0.55 + 0.45 * detail);
    const inDitch = (ax, s) => Math.abs(ax - DITCH) < 1.1 && !(s > sNear - 6 && s < sFar + 6) && s < sMouth - 6;
    const underLane = (ax, s) => laneHold.hut.some((q) => Math.abs(ax - q.lat) < 4.5 && Math.abs(s - q.s) < 4.5) || laneHold.well.some((q) => Math.hypot(ax - q.lat, s - q.s) < 3) || laneHold.stook.some((q) => Math.hypot(ax - q.lat, s - q.s) < 1.9);
    const rings = [...pairs.map((q) => ({ x: q.lat, s: q.s, r0: SK.rBase * q.scale + 0.8, r1: SK.rBase * q.scale + 10 })), { x: latInn, s: sInn, r0: 0, r1: 0, box: [YARD.D / 2 + YARD.moat + 0.5, YARD.W / 2 + YARD.moat + 0.5, 9] }, { x: latFull, s: sFull, r0: 0, r1: 0, box: [7, 13.5, 8] }];
    //   OUR LINE, for these rules, is the line and its own straight continued sixty metres back behind the entry (an eye that comes to this
    //   world through a ring comes up that straight): a flower's distance is the lesser of the two;
    //   and NO FLOWER'S TOP stands within 2.5 m of that line in space: its top as the tallest of its kind stands (1.44 of its drawn height),
    //   with the wind's lean (0.35 of that) and its head's half width (0.3 m) taken off the distance. Where the line is at a rider's eye
    //   that is a swathe two and a half to three metres wide either side of it with no flower in it.
    const footP = pairs.filter((q) => q.lat < 160);
    const flGap = (x, z) => Math.min(routeGap(x, z), backGap(x, z));
    const flOK = (x, y, z, h, gap) => { if (gap > 4.5) return true; const H = 1.44 * h, need = 2.5 + 0.35 * H + 0.3; return path.distanceTo(x, y + H, z) >= need && Math.hypot(backGap(x, z), y + H - e0.y) >= need; };
    const clump = (x, s) => {
      const k = 3 + Math.floor(fl() * 6), spread = 0.35 + fl() * 0.9, kind = fl();
      for (let j = 0; j < k; j++) {
        const a = fl() * 6.2832, r = spread * Math.sqrt(fl()), h = 0.42 + 0.5 * fl(), size = 0.125 + 0.09 * fl(), ph = fl(), tn = clamp(kind + (fl() - 0.5) * 0.3, 0, 0.999), lean = (fl() - 0.5) * 0.3;
        const qx = x + Math.cos(a) * r, qz = -s + Math.sin(a) * r;
        if (Math.abs(qx) < ROAD_HALF + 0.3 || inDitch(Math.abs(qx), -qz) || inYards(qx, qz) || inBed(qx, qz, 5.5) || underLane(Math.abs(qx), -qz)) continue;
        if (qx < 0 && season !== 'poppies' && (tn * 7.3) % 1 < 0.35) continue;
        if (-qz > ROAD || footP.some((q) => Math.hypot(Math.abs(qx) - q.lat, qz + q.s) < SK.rBase * q.scale + 0.5)) continue;
        // (a clump's flowers by the place: all of them within thirty metres of our line; evenly fewer beyond, a third of them from sixty on)
        const gap = flGap(qx, qz), qy = hAt(qx, qz);
        if (ph > 1 - 0.65 * smoothstep(30, 60, gap) || !flOK(qx, qy, qz, h, gap)) continue;
        flowers.push([qx, qy, qz, h, tn, ph, size, lean, gap < STEM_D ? 1 : 0]);
      }
    };
    for (let c = 0; c < nChunk; c++) {
      const s0 = -60 + c * FL;
      for (let i = 0, n = Math.round(46 * fk); i < n; i++) { const side = fl() < 0.75 ? 1 : -1, lat = fl() < 0.3 ? fl.range(ROAD_HALF + 0.3, DITCH - 1.3) : DITCH + 1.5 - 7 * Math.log(1 - fl() * 0.95); clump(side * lat, s0 + fl() * FL); }
      if (c % 2 === 1) await ctx.yield();
    }
    for (const [gi, g] of rings.entries()) {
      if (gi % 3 === 2) await ctx.yield();
      for (let i = 0, n = Math.round((g.box ? 60 : 26) * fk); i < n; i++) {
      if (g.box) { const t = fl() * 4, e = Math.floor(t), f = (t - e) * 2 - 1, o = fl() * g.box[2], hx = g.box[0] + o, hz = g.box[1] + o; clump(g.x + (e === 0 ? -hx : e === 1 ? hx : f * hx), g.s + (e === 2 ? -hz : e === 3 ? hz : f * hz)); }
      else { const a = fl() * 6.2832, r = Math.sqrt(lerp(g.r0 * g.r0, g.r1 * g.r1, fl())); clump(g.x + Math.cos(a) * r, g.s + Math.sin(a) * r); }
      }
    }
    {                                                                // the drifts: the same function the ground's shader paints them by
      const dr = RN.drifts, gD = (x, z, k) => Math.sin(x * (0.019 - 0.004 * k) + z * (0.008 + 0.005 * k) + 1.3 + 2.1 * k) * Math.sin(x * (0.006 + 0.003 * k) - z * (0.021 - 0.004 * k) + 0.4 + 1.7 * k);
      for (let c = 0; c < nChunk; c++) {
        const s0 = -60 + c * FL;
        for (let i = 0, n = Math.round(FL * 134 / 2 * fk); i < n; i++) {   // one place tried to every two square metres; a head stands where the drift is, fewer toward its edge
          const x = dr.range(16, 150), z = -(s0 + dr() * FL), pk = dr(), a = dr(), b = dr();
          const d0 = gD(x, z, 0), d1 = gD(x, z, 1), d2 = gD(x, z, 2), dm = Math.max(d0, d1, d2), kind = d0 >= dm ? 0 : d1 >= dm ? 1 : 2;
          const thick = 0.75 * smoothstep(0.42, 0.9, dm) * smoothstep(16, 55, x);
          if (pk > thick || -z > ROAD) continue;
          const off = flGap(x, z), y = hAt(x, z), h = [0.95, 0.5, 0.62][kind] + 0.35 * a;
          if (pk > thick * (1 - smoothstep(30, 60, off)) || !flOK(x, y, z, h, off)) continue;
          if (inYards(x, z) || inBed(x, z, 5.5) || inHolding(-z, x, 0) || underLane(x, -z) || footP.some((q) => Math.hypot(x - q.lat, z + q.s) < SK.rBase * q.scale + 0.5)) continue;
          flowers.push([x, y, z, h, [0.48, 0.7, 0.9][kind] + (b - 0.5) * 0.16, a, 0.15 + 0.09 * b, (a - 0.5) * 0.3, off < STEM_D ? 1 : 0]);
          if (i % 1200 === 1199) await ctx.yield();
        }
        await ctx.yield();
      }
    }
    // POPPIES ALONG THE LANES' EDGES (stream 'poppies'): on both hands, the whole length of both lanes, a clump of two to four to every two
    // metres of each edge, 1.8 to 3.3 m from the lane's line (our line is the lane's, at a hay cart's height: the flowers' own rule above
    // keeps every head 2.5 m from it in space, so the taller poppies stand from some two and a half metres out and the short ones nearer);
    // not where a station's thing, the stream or the ditch is. They stand for the whole visit.
    { const pp = RN.poppies;
      for (const [a, b] of [[sL0, sL1], [sR0, sR1]]) for (const e of [-1, 1]) for (let s = a + pp.range(0, 2); s < b; s += pp.range(1.5, 2.5)) {
        const lat0 = LANE + e * pp.range(1.8, 3.3), n = 2 + Math.floor(pp() * 3);
        for (let j = 0; j < n; j++) {
          const lat = lat0 + pp.range(-0.35, 0.35), z = -(s + pp.range(-0.5, 0.5)), h = pp.range(0.45, 0.8), ph = pp(), size = pp.range(0.13, 0.2), lean = pp.range(-0.15, 0.15);
          if (Math.abs(lat - LANE) < 1.2 || underLane(lat, -z) || inBed(lat, z, 5.5) || inDitch(lat, -z)) continue;
          for (const side of [-1, 1]) { const x = side * lat, y = hAt(x, z), gap = flGap(x, z); if (flOK(x, y, z, h, gap)) flowers.push([x, y, z, h, 1.5, ph, size, lean, gap < STEM_D ? 1 : 0]); }
        } } }
    await ctx.yield();
    const meadow = PW.makeMeadow(U, { flowers, season: seasonId, fogColor: fogCol, fogDensity: scene.fog.density, defer: true });
    await ctx.yield();
    for (let f = 0; f < flowers.length; f += 4000) { meadow.fill(f, Math.min(flowers.length, f + 4000)); await ctx.yield(); }   // (filled four thousand flowers at a step)
    scene.add(meadow.mesh);
    await ctx.yield();
    // a nearer line of low hills behind the mills and the giants
    const hills = T.makeHorizonRidges({ rng: RN.hills, layers: 2, radius: [1050, 1500], height: [45, 120], base: -8, segments: 150, jagged: 0.22, coverage: 0.85, fog: scene.fog, sunDir, sunColor: sky.lightColor, sunIntensity: 0.9, rim: 0.4,
      colorNear: night ? '#232c48' : '#8f7a78' });
    scene.add(hills.object);
    await ctx.yield();
    // far off on the left a white village about its church tower; in the same places on the right, a walled city of spires (stream 'farTowns'). They
    // are the country beyond the plain's pairs: sixteen to twenty-five mills from the road (the middle band of pairs ends at thirteen), one to every
    // thirty to forty-five mills of road (a town is a day's stage from the next: far fewer than the mills), the first within the first such stage
    // from the entry, the last beyond the gateway; each turned up to half a radian from the road.
    const tw = RN.farTowns, plan = PW.farTownPlan(RN.townPlan, 18), townAt = [];   // (eighteen blocks about the tall one: they are seen from a third of a kilometre and more)
    for (let s = MH * tw.range(0, 30); s < ROAD + 60 * MH; s += MH * tw.range(30, 45)) townAt.push({ s, lat: MH * tw.range(16, 25), ry: tw.range(-0.5, 0.5), sc: tw.range(1.0, 1.35) });
    const townL = PW.farTownGeometry(plan, false);
    await ctx.yield();
    const townR = PW.farTownGeometry(plan, true);
    await ctx.yield();
    for (const side of [-1, 1]) {
      const m = new THREE.InstancedMesh(side < 0 ? townL : townR, kit.mats.solid, townAt.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
      townAt.forEach((q, i) => m.setMatrixAt(i, M.compose(new THREE.Vector3(side * q.lat, hAt(side * q.lat, -q.s) + 1, -q.s), Q.setFromEuler(E.set(0, -side * q.ry, 0)), new THREE.Vector3(q.sc, q.sc, q.sc))));
      m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; scene.add(m);
    }
    // ------------------------------------------------------------ the village at the road's end (the book's road always ends at an inn or a village; his ends
    // at a city). One street, the road itself, from the mouth to the gateway. Nothing in it stands at arm's length: its fronts stand STREET from its
    // middle (0.95 of the tallest front, the hall's 16.9 m: the street is thirty-two metres wide, the droves go up its two sides); the church stands
    // back by one and a half of the minster's height (CHURCH), across a square, the one opening in the fronts (twenty-eight metres), and the
    // threshing floor's round (the tiled round with its fountain) lies in that square; a tower or dovecote by one and a half of its own height or more.
    // On the left low whitewashed houses and barns, a church with a stork's nest on its tower, a threshing floor, dovecotes, washing on lines; in
    // the same places on the right the halls of a shining city, its minster, a tiled round with a fountain, towers, high bridges. Behind the
    // fronts more of the same to eighty-six metres further out. Everything is an instance of the country's solid material at its own place.
    // THE CHURCH AND ITS SQUARE STAND AT THE VILLAGE'S MOUTH END: 0.9 to 1.3 mills up the street from the mouth (drawn for the church,
    // stream 'church'), so that the one opening in the fronts is passed first and from it to the gateway the fronts run unbroken, closing
    // in and rising (below). THE PAVED SQUARE BEFORE THE GATEWAY begins two to two and four fifths mills up the street (sSquare, drawn on
    // the village's stream).
    const vg = RN.village, HW = [9, 7.6, 11], CHURCH = 1.5 * 42.3, TOWER = 36.6, vil = { v: [[], [], []], tower: [], bridge: [], church: [], floor: [], well: [] };
    const sSquare = sMouth + MH * vg.range(2, 2.8), sChurch = sMouth + MH * RN.church.range(0.9, 1.3), sFloor = sChurch, latFloor = STREET + 13, sGate = ROAD - PW.GATE.D / 2 + 1;   // (the ring hangs a metre inside the gateway's far face)
    // (the face of the gate's porch, which is where the street ends; its flanking towers stand a metre before it)
    const zGate = sGate - PW.GATE.D / 2 - PW.GATE.F;
    // THE FRONTS, house after house, one to four metres between; a square before the church. TOWARD THE GATE THEY CLOSE IN AND RISE: from
    // where the droves never come (two metres past droveReach) each stands nearer the street's middle than the last, down to a metre
    // outside the porch's own width six metres before it; and each is larger than the last, from its own size three mills before the
    // porch to half as large again half a mill before it. The last ends three metres before the porch (the flanking towers stand there).
    const droveReach = groups[1].s0 + groups[1].b + PASTURE + 3.2, STREET_IN = PW.GATE.W + 1;
    const frontAt = (s) => lerp(STREET, STREET_IN, smoothstep(droveReach + 2, zGate - 6, s)), frontSize = (s) => 1 + 0.5 * smoothstep(zGate - 3 * MH, zGate - 0.5 * MH, s);
    for (let s = sMouth + vg.range(0, 3); ;) {
      const v = vg.int(0, 2), gap = vg.range(1, 4), sc = frontSize(s + HW[v] / 2), w = HW[v] * sc;
      if (s + w > zGate - 3) break;
      if (Math.abs(s + w / 2 - sChurch) < 14 + w / 2) { s = sChurch + 14 + gap; continue; }
      vil.v[v].push({ lat: frontAt(s + w / 2), s: s + w / 2, yaw: 0, sc, front: true, v }); s += w + gap;
    }
    vil.church.push({ lat: CHURCH, s: sChurch, yaw: 0, sc: 1 }); vil.floor.push({ lat: latFloor, s: sFloor, yaw: 0, sc: 1 });
    // (free ground: not on another, not in the church's square or on the church, not on the floor's round, not on the gateway's wings)
    const vBack = [], vFree = (lat, s, r) => !vBack.some((o) => Math.hypot(o.lat - lat, o.s - s) < r + o.r) && !(Math.abs(s - sChurch) < r + 14 && lat < CHURCH + 16 + r) && Math.hypot(lat - latFloor, s - sFloor) > r + 11
      && !(Math.abs(s - sGate) < r + 3 && lat < PW.GATE.W + PW.GATE.wing + r) && !(s > zGate - 2 - r && s < sGate + 4 + r && lat < PW.GATE.W + PW.GATE.flank + r);
    // TOWERS IN RANKS (stream 'ranks'): behind the fronts three ranks of towers (dovecotes and granaries on the left), each rank further out
    // and taller than the one before it, and every tower taller the nearer the gate. Rank k stands 24 + 28 k metres behind the fronts' line,
    // five metres either way; one tower is tried to every 16 to 24 m of it, from ten metres before the mouth to thirty past the gateway; its
    // size is 0.55 + 0.33 k of the tower's own (36.6 m) within a twelfth, and a fifth more at the gate than at the mouth. (None stands nearer
    // the street's middle than one and a half of its own height; the tallest is under the gatehouse's eaves.)
    { const rk = RN.ranks;
      for (let k = 0; k < 3; k++) for (let s = sMouth - 10 + rk.range(0, 12); s < ROAD + 30; s += rk.range(16, 24)) {
        const lat = STREET + 24 + 28 * k + rk.range(-5, 5), sc = (0.55 + 0.33 * k) * rk.range(0.92, 1.08) * (1 + 0.2 * smoothstep(sMouth, ROAD, s)), yaw = rk.range(0, 6.28);
        if (vFree(lat, s, 4 * sc)) { vBack.push({ lat, s, r: 4 * sc }); vil.tower.push({ lat, s, yaw, sc }); }
      } }
    // behind the fronts: a house tried to every 2.2 m of street, each turned its own way, larger the further back. ROOFS STEPPING UP: across
    // the road a hall is larger still the further back it stands (by three quarters at the back) and the nearer the gate (by a seventh).
    for (let i = 0, n = Math.round(DV / 2.2); i < n; i++) {
      const lat = STREET + vg.range(15, 86), s = vg.range(sMouth - 8, ROAD + 26), v = vg.int(0, 2), yaw = vg.pick([0, 0, Math.PI / 2, -Math.PI / 2]) + vg.range(-0.2, 0.2), sc0 = vg.range(0.9, 1.1), sc = sc0 * (1 + lat / 250);
      const scR = sc0 * (1 + 0.75 * smoothstep(STREET + 10, STREET + 86, lat)) * (1 + 0.15 * smoothstep(sMouth, ROAD, s)), r = 5 * Math.max(sc, scR);
      if (vFree(lat, s, r)) { vBack.push({ lat, s, r }); vil.v[v].push({ lat, s, yaw, sc, scR }); }
    }
    for (let i = 0, n = Math.round(DV / 22); i < n; i++) {               // towers (dovecotes on the left): one to every twenty-two metres of street
      const sc = vg.range(0.8, 1.25), lat = 1.5 * TOWER * sc + vg.range(0, 40), s = vg.range(sMouth, ROAD + 24);
      if (vFree(lat, s, 4)) { vBack.push({ lat, s, r: 4 }); vil.tower.push({ lat, s, yaw: vg.range(0, 6.28), sc }); }
    }
    // (the high bridges, washing lines on the left: one to every fifty metres of street, behind the fronts' houses)
    for (let i = 0, n = Math.round(DV / 50); i < n; i++) vil.bridge.push({ lat: STREET + vg.range(22, 70), s: sMouth + DV * (i + vg.range(0.2, 0.8)) / n, yaw: vg.range(-0.15, 0.15), sc: 1 });
    // THE VILLAGE'S TOWERS KEEP THE HOUSES': a tower or dovecote stands only where its own round (its farthest reach as built, at its
    // size on that hand, and 0.3 m) keeps clear of every house, front or back, and of every high bridge and washing line: each the
    // box of its own make as built (the halls' side wings with it), at its own size on its own hand; and of every tree's crown (the
    // trees stand outside the village: one may hang over its edge). One that does not is left out on both hands, after every number
    // drawn for it and for the bridges.
    const houseGeo = [[], [], []], towerGeo = [PW.streetTowerGeometry(0, false), PW.streetTowerGeometry(0, true)], bridgeGeo = [PW.streetBridgeGeometry(false), PW.streetBridgeGeometry(true)];
    for (let v = 0; v < 3; v++) for (const rich of [false, true]) { houseGeo[v].push(PW.streetHouseGeometry(v, rich)); await ctx.yield(); }
    { const blocks = [...vil.v.flatMap((l, v) => l.map((q) => ({ q, box: houseGeo[v].map(boxOf) }))), ...vil.bridge.map((q) => ({ q, box: bridgeGeo.map(boxOf) }))], TR = towerGeo.map(planR);
      const inHouse = (t) => blocks.some(({ q, box }) => [-1, 1].some((side) => { const si = side < 0 ? 0 : 1, sc = side > 0 ? q.scR ?? q.sc : q.sc, th = side < 0 ? Math.PI / 2 + q.yaw : -Math.PI / 2 - q.yaw, c = Math.cos(th), n = Math.sin(th), b = box[si];
        const dx = side * (t.lat - q.lat), dz = q.s - t.s, lx = dx * c - dz * n, lz = dx * n + dz * c;
        return Math.hypot(Math.max(b.min.x * sc - lx, 0, lx - b.max.x * sc), Math.max(b.min.z * sc - lz, 0, lz - b.max.z * sc)) < TR[si] * t.sc + 0.3; }));
      const inCrown = (t) => treePts.some((q) => Math.hypot(t.lat - q.lat, t.s - q.s) < crownOf(q) + Math.max(TR[0], TR[1]) * t.sc + 0.3);
      const kept = vil.tower.filter((t) => !inHouse(t) && !inCrown(t)); vil.tower.length = 0; vil.tower.push(...kept); }
    await ctx.yield();
    const instM = new THREE.Matrix4(), instQ = new THREE.Quaternion(), instE = new THREE.Euler(), instP = new THREE.Vector3(), instS = new THREE.Vector3();
    // (an instance stands at the same place on its own side, its front turned to the road as its twin's is)
    const instances = (geo, side, items, shadow) => {
      if (!items.length) return null;
      const m = new THREE.InstancedMesh(geo, kit.mats.solid, items.length);
      // (q.scR: its size across the road, where that is not its own)
      items.forEach((q, i) => { const sc = side > 0 ? q.scR ?? q.sc : q.sc; m.setMatrixAt(i, instM.compose(instP.set(side * q.lat, q.y ?? hAt(side * q.lat, -q.s), -q.s), instQ.setFromEuler(instE.set(0, side < 0 ? Math.PI / 2 + q.yaw : -Math.PI / 2 - q.yaw, 0)), instS.set(sc, sc, sc))); });
      m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.receiveShadow = true; if (shadow) { m.castShadow = true; m.customDepthMaterial = kit.mats.depth; }
      scene.add(m); return m;
    };
    const churchGeo = [PW.churchGeometry(false), PW.churchGeometry(true)];
    for (const side of [-1, 1]) {
      for (let v = 0; v < 3; v++) { instances(houseGeo[v][side > 0 ? 1 : 0], side, vil.v[v], true); await ctx.yield(); }
      instances(towerGeo[side > 0 ? 1 : 0], side, vil.tower, false); instances(bridgeGeo[side > 0 ? 1 : 0], side, vil.bridge, false);
      await ctx.yield();
      instances(churchGeo[side > 0 ? 1 : 0], side, vil.church, true);
      await ctx.yield();
    }
    // smoke stands over the village from the chimney of the second house of its left-hand front
    const vh = [...vil.v[0], ...vil.v[1]].filter((q) => q.front).sort((a, b) => a.s - b.s)[1] || { s: sMouth + 12 };
    const smokeV = fx.makeSmokeColumn({ rng: RN.smokeV, time: tU, position: [-(STREET + 4.7), hAt(-STREET, -vh.s) + 7.5, -(vh.s + 2.6)], height: 15, radius: [0.3, 2.8], size: [1.0, 5.5], count: 26, color: '#b9b2ac', colorTop: '#d8d2ca', shadowColor: '#6a6672', ambient: '#3a3640', opacity: 0.45, wind: [2.6, 0, -0.9], bend: 0.9, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: '#ffd9a8', rim: 0.5, scatter: 0.5 });
    scene.add(smokeV.object);
    // THE GATEWAY: a gatehouse over one arch across the street's end, its left half plain stone and its right half the golden gate, the ring in
    // the arch at the back of a porch. Its eaves stand half as high again as the church's tower, the taller of the two across the road (the
    // minster's), read off the churches' geometry as built; belfry, crown and flanking towers stand above that: it is the tallest thing here.
    const GATE_TOP = 1.5 * Math.max(boxOf(churchGeo[0]).max.y, boxOf(churchGeo[1]).max.y);
    let gateGeo; { const it = PW.gatewaySteps({ top: GATE_TOP }); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } gateGeo = r.value; }
    await ctx.yield();
    const gateway = new THREE.Mesh(gateGeo, kit.mats.solid); gateway.position.set(0, hAt(0, -sGate), -sGate); gateway.castShadow = true; gateway.receiveShadow = true; gateway.customDepthMaterial = kit.mats.depth; scene.add(gateway);
    await ctx.yield();
    // THE RING'S LIGHT: the ring is a light in the arch. It lies on the road before the gateway (a pool laid on the street's floor), and one
    // lamp of the ring's colour at the ring's middle lights the jambs, the arch, the leaves and whoever stands near: strongest at the gateway and
    // gone at six of the arch's radii from it (GATE.lit: 45.6 m), on the ground and in the air alike. It burns the whole visit and never changes.
    const RING_COL = '#ffc880', ringReach = PW.GATE.lit * RING;
    { const c = new THREE.Color(RING_COL), yg = hAt(0, -sGate);
      pools.push({ x: 0, cells: groundCells, z: -(sGate - PW.GATE.D / 2), r: ringReach, col: [c.r, c.g, c.b], k: 0.9, t: -1 });
      const lamp = new THREE.PointLight(RING_COL, 260, ringReach, 2); lamp.position.set(0, yg + PORTAL_Y, -(ROAD - 1.2)); scene.add(lamp); }
    await ctx.yield();
    // THE LAMPS OF THE PLACE. A lamp, a torch and its pools burn by the HOUR, which stands for the whole visit, as the windows do: one
    // lamp hour for all of them (LAMP_T), and they burn when the hour's standing value (0 by day, 1 at every other hour) is over it: all
    // of them or none, for the whole visit. Each throws a pool on the road and one on its wall. A POOL ON THE
    // GROUND LIES ON THE GROUND AS IT IS DRAWN: it is the ground sheet's own triangles under it, a hand's breadth higher (groundCells), on the
    // way in's slope and over the ditch's banks as on the level street.
    const LAMP_T = 0.5, WARM = [1.0, 0.56, 0.2];
    // THE STREET'S LAMP: one warm light seven metres over the square's middle, sixteen metres before the porch, for all the lanterns hung
    // there: it lights the paving, the stalls, the folk and the fronts by their distance from it (gone at forty-eight metres), and burns
    // when the lamps burn (the one lamp hour against the hour's standing value), at the hour's strength: a standing state.
    const STREET_LAMP = 160, streetLampAt = LAMP_T, streetLamp = new THREE.PointLight('#ffb468', 0, 48, 2);
    streetLamp.position.set(0, hAt(0, -(zGate - 16)) + 7, -(zGate - 16)); scene.add(streetLamp);
    const life = [], air = [], reapers = [];
    // (a thing and its twin: the same place on either hand, turned to the road as its twin is)
    const put = (kindL, kindR, lat, s, yaw, o = {}) => { for (const side of [-1, 1]) life.push({ kind: side < 0 ? kindL : kindR, rich: side > 0, x: side * lat, y: hAt(side * lat, -s) + (o.y ?? 0), z: -s, ry: side < 0 ? yaw : -yaw, s: o.s ?? 1, v: o.v ?? 0, t: o.t }); };
    const toRoad = Math.PI / 2;
    // the way in: a lantern on a post on either verge to every mill of road, from the last wall to the mouth (5.2 m from the road's middle: a
    // post's width and the road's edge between it and our line), its pool on the road beside it
    for (let s = sFar + MH / 2; s < sMouth - 4; s += MH) { put('lantern', 'lantern', ROAD_HALF + 1.6, s, toRoad, { t: LAMP_T });
      for (const side of [-1, 1]) pools.push({ x: side * (ROAD_HALF + 0.4), cells: groundCells, z: -s, r: 6.5, col: WARM, k: 0.55, t: LAMP_T }); }
    // the street: a lamp on an arm on every second front, a rider's height and a half up the wall, its pool on the wall and one on the street
    // (A POOL ON A WALL IS CUT TO THE FACE BEHIND IT: here the front itself, to its eaves at its own size; at the gateway the porch's jamb;
    // at the inn's gate the pier)
    vil.v.flat().filter((q) => q.front).sort((a, b) => a.s - b.s).forEach((q, i) => { if (i % 2) return; const t = LAMP_T;
      put('bracket', 'bracket', q.lat, q.s, toRoad, { y: 1.5 * RIDER, t });
      for (const side of [-1, 1]) { const y = hAt(side * q.lat, -q.s);
        const up = 1.5 * RIDER - 0.6, hw = HW[q.v] * q.sc / 2;
        pools.push({ x: side * (q.lat - 0.06), y: y + up, z: -q.s, r: 2.8, n: [-side, 0, 0], clip: [-hw, hw, -up, PW.STREET_H(q.v, side > 0) * q.sc - up], col: WARM, k: 0.6, t }, { x: side * (q.lat - 3), cells: groundCells, z: -q.s, r: 6, col: WARM, k: 0.5, t }); } });
    // the gateway: two torches on the face of the porch's either jamb, their pools on the stone and on the square (each torch's flicker
    // begins where stream 'torches' draws it)
    { const zf = zGate, yg = hAt(0, -sGate);
      for (const side of [-1, 1]) for (const [k, off] of [[0, 2.5], [1, 3.9]]) { const x = side * (RING + off), ph = RN.torches.range(0, 1);
        life.push({ kind: 'torch', x, y: yg + 5.2, z: -(zf - 0.02), ry: 0 });
        pools.push({ x, y: yg + 5.6, z: -(zf - 0.08), r: 3.4, n: [0, 0, 1], clip: [side * PW.PORCH_JAMB[side > 0 ? 0 : 1] - x, side * PW.PORCH_JAMB[side > 0 ? 1 : 0] - x, -5.6, 3.4], col: WARM, k: 0.8, t: LAMP_T, flick: 0.3, ph }, { x, cells: groundCells, z: -(zf - 3.5), r: 7, col: WARM, k: 0.5, t: LAMP_T, flick: 0.25, ph }); } }
    // THE STREET AND THE SQUARE BEFORE THE GATE. A lane as wide as the road and two metres more is kept up the street's middle. Along its two
    // edges (5.6 m) a row of folk from the mouth to the porch, one to every 6 to 9 m and, in the square (a mill and a half before the porch,
    // or to the church's middle where that is nearer), one to every 3.6 to 4.4 m: villagers; across the road heralds with their trumpets
    // raised near the gate, pages further back (stream 'square').
    // THE DROVES' GROUND IS KEPT FREE. The flock and the host have the roadside between nine and fifteen metres from its middle (their dogs to
    // 15.8) and STAND there for the whole visit, each at its own place; droveReach (the second drove's place, its length, its pasture,
    // its dog's round) is the last metre of their ground. Up to that metre nothing stands further out than 8.4 m.
    // STALLS (stream 'stalls'): between the lane's rows and the droves' ground, their backs to the droves, their awnings' edges 5.1 m from
    // the street's middle: one tried every 9 to 14 m of street on either hand, from twelve metres inside the mouth to the porch (a market
    // stall under its striped awning and its keeper; across the road a dais under a canopy and its ladies, three of them near the gate).
    // THE WELL (the fountain) stands in the square 8.6 m from the middle, before the porch by half the depth the droves leave free
    // (never under 4 m, never over 9).
    // GROUPS (stream 'crowd'): knots of three to five folk between the lane's edge and the droves' ground, their middles 6.2 to 7.3 m out,
    // one tried every 8 to 12 m of street and every 5 to 7 m in the square: each knot turned to its own middle, or all of it to the road.
    // More folk stand about the square where the droves never come, out to a pace and a half before the fronts; hens (doves), two dogs (hounds).
    // LINES OVERHEAD: every twelve metres from six metres before the porch back to ten metres inside the mouth, a line between two masts
    // at the fronts' feet: pennants, a lantern at each quarter (its pool on the street under it, lit by the hour as every lamp is), a
    // banner down each mast. Its lowest pennant hangs three metres over our line where we pass under it (our line's height there is read
    // off the path).
    await ctx.yield();
    { const sq = RN.square, st = RN.stalls, cr = RN.crowd, zf = zGate, SQ = Math.min(1.5 * MH, zf - sSquare), taken = [], LANE_ROW = ROAD_HALF + 2, INNER = 8.4;
      const clear = (lat, d, r) => !taken.some((o) => Math.hypot(o[0] - lat, o[1] - d) < o[2] + r), free = (lat, d, r) => clear(lat, d, r) && !(zf - d - r < droveReach && lat + r > INNER);
      // THE WELL FIRST (the fountain across the road): its round is the wider of its two makes about its middle (the plain well's trough
      // reaches five metres up the street from it; the fountain's basin is 2.4 m), read off them as built. Then the stalls: a stall
      // that would stand on it is left out, after its draws; the rows and the knots keep clear of both.
      { const d = clamp((zf - droveReach) / 2, 4, 9), b0 = boxOf(holdGeo.well[0]), b1 = boxOf(holdGeo.well[1]);
        vil.well.push({ lat: 8.6, s: zf - d, yaw: 0, sc: 1 });
        // (the trough lies up the street from the well's middle, toward the gate: so the round stands that half way up)
        taken.push([8.6, d - (b0.max.x + b0.min.x) / 2, Math.max((b0.max.x - b0.min.x) / 2, b1.max.x, b1.max.z) + 0.6]); }
      for (let d = 5 + st.range(0, 3); zf - d > sMouth + 12; d += st.range(9, 14)) { const s = zf - d, lat = 6.7, v = st(), man = st.chance(0.5), near = d < SQ;
        if (!clear(lat, d, 2.9)) continue;
        put('stall', 'stall', lat, s, toRoad); taken.push([lat, d, 2.9]);
        for (const side of [-1, 1]) for (const o of side > 0 && near ? [-1.3, 0, 1.3] : [0]) life.push({ kind: side < 0 ? (man ? 'man' : 'woman') : 'lady', x: side * (side < 0 ? lat + 0.5 : lat + 0.4), y: hAt(side * lat, -s) + (side > 0 ? 0.56 : 0), z: -(s + o), ry: -side * toRoad, v: (v + 0.3 * o + 1) % 1 }); }
      for (let d = 3; zf - d > sMouth + 4; d += d < SQ ? sq.range(3.6, 4.4) : sq.range(6, 9)) { const man = sq.chance(0.5), v = sq(), turn = sq.range(-0.5, 0.2);
        if (!clear(LANE_ROW, d, 0.5)) continue;
        for (const side of [-1, 1]) life.push({ kind: side < 0 ? (man ? 'man' : 'woman') : d < 12 ? 'herald' : 'page', x: side * LANE_ROW, y: hAt(side * LANE_ROW, -(zf - d)), z: -(zf - d), ry: side * (-toRoad + turn), v }); }
      // the knots
      for (let d = 4 + cr.range(0, 3); zf - d > sMouth + 6; d += d < SQ ? cr.range(5, 7) : cr.range(8, 12)) {
        const lat = cr.range(6.2, 7.3), n = cr.int(3, 5), inward = cr.chance(0.5), a0 = cr.range(0, 6.28), R = 0.55 + 0.14 * n;
        const who = Array.from({ length: n }, (_, i) => ({ a: a0 + i / n * 6.283 + cr.range(-0.25, 0.25), r: R * cr.range(0.85, 1.1), man: cr.chance(0.5), v: cr(), turn: cr.range(-0.3, 0.3) }));
        if (!clear(lat, d, R + 0.5)) continue;
        taken.push([lat, d, R + 0.5]);
        for (const q of who) { const la = lat + q.r * Math.cos(q.a), dd = d + q.r * Math.sin(q.a);
          if (la < LANE_ROW - 0.5 || la > INNER) continue;
          // (turned to the knot's middle, or to the road)
          const yawL = inward ? Math.atan2(Math.cos(q.a), -Math.sin(q.a)) + q.turn : toRoad + q.turn;
          for (const side of [-1, 1]) life.push({ kind: side < 0 ? (q.man ? 'man' : 'woman') : (q.man ? 'page' : 'lady'), x: side * la, y: hAt(side * la, -(zf - dd)), z: -(zf - dd), ry: side < 0 ? yawL : -yawL, v: q.v }); } }
      // folk about the square, out to the fronts
      for (let i = 0, n = Math.round(SQ / 1.3); i < n; i++) { const d = sq.range(2, SQ), lat = sq.range(6.4, 14.6), man = sq.chance(0.5), v = sq(), yaw = sq.range(-1.2, 1.2);
        if (lat > frontAt(zf - d) - 1.5 || !free(lat, d, 0.9)) continue; taken.push([lat, d, 0.5]);
        for (const side of [-1, 1]) life.push({ kind: side < 0 ? (man ? 'man' : 'woman') : (man ? 'page' : 'lady'), x: side * lat, y: hAt(side * lat, -(zf - d)), z: -(zf - d), ry: side * (Math.PI - yaw), v }); }
      for (let i = 0, n = Math.round(SQ / 2.5); i < n; i++) { const lat = sq.range(5.2, 13), d = sq.range(2, SQ), v = sq(), yaw = sq.range(0, 6.28); if (free(lat, d, 0.4)) put('hen', 'dove', lat, zf - d, yaw, { v }); }
      for (let i = 0; i < 2; i++) { const lat = sq.range(6, 9.5), d = sq.range(4, SQ), yaw = sq.range(0, 6.28); if (free(lat, d, 0.8)) put('dog', 'hound', lat, zf - d, yaw); }
      // the lines overhead
      for (let s = zf - 6; s > sMouth + 10; s -= 12) { const u = path.nearestXZ(0, -s).u, yg = hAt(0, -s), w = frontAt(s) - 0.3, sag = 1.4, t = LAMP_T;
        path.pointAt(u, flown);
        life.push({ kind: 'festoon', x: 0, y: yg, z: -s, ry: 0, w, h: flown.y - yg + 3 + 1.25 + sag, sag, n: 7, t });
        for (const side of [-1, 1]) pools.push({ x: side * w / 2, cells: groundCells, z: -s, r: 5, col: WARM, k: 0.45, t }); }
      // petals fall over the other side's half of the square (ten to every metre of its depth, from two to nine metres up, rose, pearl and
      // gold); over his half straws and chaff drift a hand to a metre and a half up (a third as many)
      for (let i = 0, n = Math.round(SQ * 10); i < n; i++) { const lat = sq.range(4.2, 15), z = -(zf - sq.range(0, SQ)), up = sq.range(2, 9), vy = sq.range(0.4, 0.65), c = [[0.95, 0.5, 0.55], [0.98, 0.92, 0.86], [0.95, 0.75, 0.2]][Math.floor(sq() * 3)];
        air.push([lat, hAt(lat, z) + up, z, sq.range(-0.2, 0.2), -vy, sq.range(-0.15, 0.15), sq(), sq.range(0.045, 0.075), up / vy, 0, ...c]);
        if (i % 3 === 0) air.push([-lat, hAt(-lat, z) + sq.range(0.15, 1.5), z, sq.range(0.3, 0.9), sq.range(0, 0.2), sq.range(-0.3, 0.3), sq(), sq.range(0.03, 0.055), sq.range(3, 5), 0, 0.8, 0.68, 0.4]); }
    }
    // LIFE AT THE STREAM (stream 'banks'), from the bridge's end out to sixty metres on either hand, the same thing at the same place across the
    // road. Along each edge of the water a clump of reeds or a stone to every 2 to 4.5 m (his water is the narrow run down the bed's middle, the
    // other the full stream: each thing stands at its own water's edge). Five ducks on his run within sixteen metres of the bridge; in the same
    // places swans on the stream. Linen laid out to dry on his bank's grass and a woman bent to the water below it; across the road bright
    // cloths laid out and a lady at the water's edge. (The stranded hull and the gilded skiff lie thirty to seventy metres out, as they did.)
    await ctx.yield();
    { const bn = RN.banks, edge = (side) => (side < 0 ? 1.5 : 3.5);
      const at = (kind, side, lat, off, o = {}) => { const x = side * lat, z = bedZ(x) + off; life.push({ kind, rich: side > 0, x, y: (o.wet ? hAt(x, bedZ(x)) + (side < 0 ? 0.1 : 0.5) - 0.06 : hAt(x, z)) + (o.y ?? 0), z, ry: o.ry ?? 0, s: o.s ?? 1, v: o.v ?? 0 }); };
      // (a clump of reeds stands only where its tallest tip, on either hand, keeps 2.5 m from our line in space with the wind's carry and its
      // own reach added, all read off the reeds as built: nearer than that the place holds a stone)
      const reedOK = (side, lat, off, s) => { const x = side * lat, z = bedZ(x) + off; return path.distanceTo(x, hAt(x, z) + PW.REED.top * s, z) >= 2.5 + PW.REED.carry * PW.REED.weight + PW.REED.out * s; };
      for (const e of [-1, 1]) for (let lat = 6 + bn.range(0, 2); lat < 60; lat += bn.range(2, 4.5)) { const k0 = bn.chance(0.62) ? 'reeds' : 'stone', d = bn.range(0, 0.6), v = bn(), ry = bn.range(0, 6.28), s = bn.range(0.8, 1.3);
        const kind = k0 === 'reeds' && !(reedOK(-1, lat, e * (edge(-1) + d), s) && reedOK(1, lat, e * (edge(1) + d), s)) ? 'stone' : k0;
        for (const side of [-1, 1]) at(kind, side, lat, e * (edge(side) + d), { v, ry, s }); }
      for (let i = 0; i < 5; i++) { const lat = bn.range(6.5, 16), d = bn.range(-0.6, 0.6), v = bn(), ry = bn.range(0, 6.28); for (const side of [-1, 1]) at('duck', side, lat, d * (side < 0 ? 1 : 3), { v, ry, wet: true }); }
      const wl = bn.range(8, 12), wry = bn.range(-0.4, 0.4); for (const side of [-1, 1]) { at('washing', side, wl, 9.5, { ry: wry }); at(side < 0 ? 'gleaner' : 'lady', side, wl + 1.5, edge(side) + 0.7, { ry: Math.PI, v: 0.3 }); }
    }
    // THE WORKED LAND (stream 'works'), at each lane's station of stooks, on either hand. Three reapers mowing in echelon between the two outer
    // rows of stooks, three metres apart, each a step further out than the one behind, facing up the road within a quarter radian; each his own
    // stroke (a stroke there and back in 2.1 to 2.6 s, begun where drawn). A gleaner bent behind them. Beyond the outer row a wain loaded with
    // sheaves, its pole up the road and two oxen at it. Across the road in the same places: three pages with their pennons between the
    // pavilions' rows, a lady behind them, a gilded litter and its two bearers.
    await ctx.yield();
    { const wk = RN.works;
      for (const [stats, left] of [[statL, true], [statR, false]]) for (const q of stats) if (q.kind === 'stooks') {
        const row = left ? 5 : PAV_ROW, lat0 = LANE + row + 3;
        for (let i = 0; i < 3; i++) { const s = q.s - 4 + 3.2 * i + wk.range(-0.4, 0.4), lat = lat0 - 1 + i + wk.range(-0.2, 0.2), yaw = Math.PI + wk.range(-0.25, 0.25), v = wk();
          reapers.push({ x: -lat, y: hAt(-lat, -s), z: -s, yaw, roll: Math.PI / 2, phase: wk.range(0, TAU), rate: TAU / wk.range(2.1, 2.6), gait: 1, nod: 1 });
          life.push({ kind: 'page', rich: true, x: lat, y: hAt(lat, -s), z: -s, ry: -yaw, v }); }
        put('gleaner', 'lady', lat0 + 0.6, q.s - 7.5, Math.PI + wk.range(-0.4, 0.4), { v: wk() });
        const wl = LANE + 2 * row + 5.5, ws = q.s + wk.range(0, 3);
        put('wain', 'wain', wl, ws, Math.PI); for (const o of [-0.62, 0.62]) put('ox', 'page', wl + o, ws + 3.5, Math.PI, { v: wk() });
      }
    }
    // (and in the entry's first field by the road, where it is laid: a loaded wain between the second and third rows of its stooks,
    // ten to sixteen metres up the field, its pole up the road and two oxen at it; across the road the litter and its bearers. Its
    // numbers on the entry fields' own stream.)
    { const f = fields.find((q) => q.first), fe = RN.entryStrips;
      if (f) { const wl = f.lat0 + 9.75, ws = f.s0 + fe.range(10, 16); put('wain', 'wain', wl, ws, Math.PI); for (const o of [-0.62, 0.62]) put('ox', 'page', wl + o, ws + 3.5, Math.PI, { v: fe() }); } }
    // THE HOUSES (stream 'houses'). Two men of the house stand at its gate, 1.7 m either side of the gate's middle and 2.5 m before the wall:
    // the castle's guards with their halberds on the drawbridge's head (on its deck), the inn's ostlers with their forks in the same places.
    // A lamp on an arm on each of the inn's two gate piers, with its light on the pier and on the lane before the gate (lit by the same rule
    // of the road as every lamp; across the road the gatehouse's window is the light). On the inn's lane, which is where the moat lies across
    // the road and so has no twin but the moat's swans: a wain of sheaves drawn up beyond the pigs' ground (21.5 to 23 m before the gate's
    // middle, its pole toward the gate), a carter with a sack on his shoulder at its tail, and six hens about it. (The inn's washing hangs
    // in its outer yard, as it did.)
    { const hs = RN.houses, gp = YARD.gate / 2 + 0.45;
      for (const o of [-1.7, 1.7]) { const v = hs(); life.push({ kind: 'ostler', x: -(WALLS - 2.5), y: hAt(-(WALLS - 2.5), -(sInn + o)), z: -(sInn + o), ry: toRoad, v }, { kind: 'halberd', rich: true, x: WALLS - 2.5, y: 0.3, z: -(sInn + o), ry: -toRoad, v }); }
      for (const o of [-gp, gp]) { const t = LAMP_T, x = -(WALLS - 0.5), z = -(sInn + o);
        life.push({ kind: 'bracket', x, y: 2.9, z, ry: toRoad, t });
        pools.push({ x: x + 0.06, y: 2.4, z, r: 2.4, n: [1, 0, 0], clip: [-PW.INN_PIER.w / 2, PW.INN_PIER.w / 2, -2.4, PW.INN_PIER.h - 2.4], col: WARM, k: 0.6, t }, { x: x + 2.6, cells: groundCells, z, r: 5, col: WARM, k: 0.5, t }); }
      const ws = sInn - hs.range(21.5, 23), wl = WALLS - 3.4;
      life.push({ kind: 'wain', x: -wl, y: hAt(-wl, -ws), z: -ws, ry: Math.PI }, { kind: 'carter', x: -(wl + 0.5), y: hAt(-(wl + 0.5), -(ws - 3.2)), z: -(ws - 3.2), ry: Math.PI, v: hs() });
      for (let i = 0; i < 6; i++) { const lat = hs.chance(0.5) ? hs.range(5.6, 7.1) : hs.range(10.2, 11.2), s = ws + hs.range(-4, 3); life.push({ kind: 'hen', x: -lat, y: hAt(-lat, -s), z: -s, ry: hs.range(0, 6.28), v: hs() }); }
    }
    // THE AIR OF THE PLACES (stream 'air'): chaff off each lane's threshing floor where the mule treads (150 flecks born 4 to 8.5 m from the
    // floor's middle, a hand to a metre up, blown across the road's direction at 0.8 to 1.6 m/s and a little up, each for 3 to 5 s); on the
    // tiled round across the road the fountain plays (110 drops thrown from its head, falling into its basin). Under every tree of the lanes'
    // orchard blossom falls (40 petals a tree, from within its crown to the ground at 0.35 to 0.55 m/s); under its twin a dozen dry leaves.
    { const ar2 = RN.air;
      for (const q of laneHold.floor) {
        for (let i = 0; i < 150; i++) { const a = ar2.range(0, TAU), r = ar2.range(4, 8.5), x = -q.lat + r * Math.cos(a), z = -q.s + r * Math.sin(a), k = ar2.range(0.85, 1.1);
          air.push([x, hAt(x, z) + ar2.range(0.15, 1.0), z, ar2.range(0.8, 1.6), ar2.range(0.1, 0.45), ar2.range(-0.3, 0.3), ar2(), ar2.range(0.03, 0.06), ar2.range(3, 5), 0, 0.85 * k, 0.72 * k, 0.42 * k]); }
        const yf = hAt(q.lat, -q.s) + 3.55;
        for (let i = 0; i < 110; i++) { const a = ar2.range(0, TAU), v = ar2.range(0.45, 1.0); air.push([q.lat, yf, -q.s, v * Math.cos(a), ar2.range(1.4, 2.2), v * Math.sin(a), ar2(), ar2.range(0.04, 0.07), 1.25, 6, 0.8, 0.9, 1.0]); }
      }
      for (const q of laneTreePts) if (lineGap(q) >= 3 * CROWN * q.sc) for (const side of [-1, 1]) for (let i = 0, n = side > 0 ? 40 : 12; i < n; i++) {
        const a = ar2.range(0, TAU), r = CROWN * q.sc * Math.sqrt(ar2()), x = side * q.lat + r * Math.cos(a), z = -q.s + r * Math.sin(a), y0 = hAt(x, z), up = ar2.range(2.2, 5.6) * q.sc, vy = ar2.range(0.35, 0.55), k = ar2.range(0.9, 1.05);
        air.push([x, y0 + up, z, ar2.range(0.1, 0.35), -vy, ar2.range(-0.12, 0.12), ar2(), ar2.range(0.04, 0.065), up / vy, 0, ...(side > 0 ? [0.98 * k, 0.88 * k, 0.86 * k] : [0.5 * k, 0.44 * k, 0.24 * k])]); }
    }
    // NO SMALL THING OF THE AIR COMES WITHIN 2.5 m OF OUR LINE (the route, and its first straight continued sixty metres back behind the
    // entry). Each one's way is walked here by its own numbers (its place, its velocity, its fall, its seconds): where the way would come
    // within two and a half metres of the line, with the thing's own waver (0.31 m) and a hand's breadth more, the thing ends there and is
    // born again at its place; one with under a second of clear way is not kept. The clock only says where on its way each one is, so
    // the rule holds at every second of the clock. No draw is made here.
    await ctx.yield();
    { const AIR_OFF = 2.5 + 0.22 * Math.SQRT2 + 0.2, nW = walk.length / 3, kept = [];
      const gapAt = (x, y, z, i0, i1) => { let best = Math.hypot(backGap(x, z), y - e0.y);
        for (let i = i0; i < i1; i++) { const ax = walk[3 * i], ay = walk[3 * i + 1], az = walk[3 * i + 2], dx = walk[3 * i + 3] - ax, dy = walk[3 * i + 4] - ay, dz = walk[3 * i + 5] - az;
          const t = clamp(((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1); best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy, z - az - t * dz)); }
        return best; };
      let walked = 0;
      for (const q of air) {
        if (++walked % 60 === 0) await ctx.yield();      // (a step of this rule is sixty things, so that the rule is not one long step of the build)
        // (the route's point nearest its birthplace in plan; the stretch of twenty-four metres either way of it is the line for this thing,
        // whose whole way is under ten metres long; a thing born farther off than its way can carry it is kept as it is)
        let near = 1e9, at = 0; for (let i = 0; i < nW; i++) { const d = Math.hypot(walk[3 * i] - q[0], walk[3 * i + 2] - q[2]); if (d < near) { near = d; at = i; } }
        if (Math.min(near, backGap(q[0], q[2])) > Math.hypot(q[3], q[5]) * q[8] + AIR_OFF + 2.5) { kept.push(q); continue; }
        const i0 = Math.max(0, at - 12), i1 = Math.min(nW - 1, at + 12), st = Math.min(0.25, 0.3 / (Math.hypot(q[3], Math.abs(q[4]) + q[9] * q[8], q[5]) + 0.01)); let clear = q[8];
        // (walked to its very end: the last step is as short as it must be; the name last holds the last second found clear)
        for (let t = 0, last = -1; ; t = Math.min(t + st, q[8])) { if (gapAt(q[0] + q[3] * t, q[1] + q[4] * t - 0.5 * q[9] * t * t, q[2] + q[5] * t, i0, i1) < AIR_OFF) { clear = last; break; } last = t; if (t >= q[8]) break; }
        if (clear >= 1) { q[8] = clear; kept.push(q); }
      }
      air.length = 0; for (const q of kept) air.push(q); }
    const fallers = PW.makeFallers(U, air, { fogDensity: scene.fog.density }); scene.add(fallers);
    const reaperMesh = PW.makeCreatures(PW.creatureGeometry('reaper'), kit.mats.limb, reapers, { depth: kit.mats.depth }); scene.add(reaperMesh);
    await ctx.yield();
    // (two meshes by the place and the thing: what stands before the houses' last wall and is a man's size or more throws its shadow; the
    // small things there (reeds, stones, fowl, linen, lamps) and whatever stands from that wall on, the way in's lamps and the street's and
    // the square's folk, take the shadows of the houses and the gatehouse and throw none of their own)
    const SMALL_LIFE = new Set(['reeds', 'stone', 'duck', 'washing', 'hen', 'dove', 'lantern', 'bracket', 'torch']);
    // (a third mesh for what stands in the street, past the mouth, so that the stream's and the way in's small things are not drawn with it)
    const lifeCast = (q) => -q.z <= sFar && !SMALL_LIFE.has(q.kind), inStreet = (q) => -q.z > sMouth;
    for (const [list, cast] of [[life.filter(lifeCast), true], [life.filter((q) => !lifeCast(q) && !inStreet(q)), false], [life.filter((q) => !lifeCast(q) && inStreet(q)), false]]) {
      let lg; { const it = PW.lifeSteps(list, 10); let r = it.next(); while (!r.done) { await ctx.yield(); r = it.next(); } lg = r.value; }
      const m = new THREE.Mesh(lg, kit.mats.solid); m.castShadow = cast; m.receiveShadow = true; m.customDepthMaterial = kit.mats.depth; scene.add(m);
      await ctx.yield(); }
    await ctx.yield();
    // ------------------------------------------------------------ what the holdings hold (their places were dealt above): the same thing at the same metre on
    // either side, each an instance at its own place: the lanes' stations first (laid above with the lanes), then the plain's plots. In a plot stooks
    // stand in rows nine metres apart, a row's stooks nine apart (room for a wain to pass and turn between them; pavilions on the right). Four stooks wait at the far edge of every threshing
    // floor, two and a half metres outside its kerb (12 m from its middle), one in each quarter of its far half at a drawn angle and turned as
    // drawn (the lanes' on the stream 'lane', the plots' on the stream 'holdings'). A boat lies in the stream thirty to seventy metres either side of the
    // bridge, along the water, turned a quarter radian or less as drawn.
    const hold = { stook: [...laneHold.stook], floor: [...vil.floor, ...laneHold.floor], hut: [...laneHold.hut], well: [...laneHold.well, ...vil.well] }, plotWalls = [];
    const floorStooks = (rng, lat, s) => { for (let i = 0; i < 4; i++) { const a = (i + rng.range(0.15, 0.85)) * Math.PI / 4; hold.stook.push({ lat: lat + 12 * Math.sin(a), s: s + 12 * Math.cos(a), yaw: rng.range(0, 6.28), sc: rng.range(0.9, 1.1) }); } };
    for (const q of laneHold.floor) floorStooks(ln, q.lat, q.s);
    for (const q of holdings) {
      const P0 = plotAt(q, 0, 0);
      if (q.kind === 'stooks') for (let u = -q.w / 2 + 4; u < q.w / 2 - 3; u += 9) for (let v = -q.d / 2 + 4; v < q.d / 2 - 3; v += 9) { const p = plotAt(q, u + hr.range(-0.8, 0.8), v + hr.range(-0.8, 0.8)); hold.stook.push({ lat: p.lat, s: p.s, yaw: hr.range(0, 6.28), sc: hr.range(0.85, 1.2) }); }
      else if (q.kind === 'floor') { hold.floor.push({ lat: P0.lat, s: P0.s, yaw: q.rot, sc: 1 }); floorStooks(hr, P0.lat, P0.s); }
      else if (q.kind === 'hut') hold.hut.push({ lat: P0.lat, s: P0.s, yaw: q.rot + (q.seed - 0.5), sc: 1 + 0.3 * q.seed });
      else if (q.kind === 'well') hold.well.push({ lat: P0.lat, s: P0.s, yaw: q.rot, sc: 1.1 + 0.4 * q.seed });
      const c0 = plotAt(q, -q.w / 2, -q.d / 2); plotWalls.push({ lat: c0.lat, s: c0.s, rot: q.rot, len: q.w, across: true }, { lat: c0.lat, s: c0.s, rot: q.rot, len: q.d, across: false });
    }
    // ONE LIST OF WHAT IS TAKEN, along the lanes and on the plots (as the square has its own). What stands first: every hut with its fold
    // and every chapel, every well with its trough and every fountain (each the box of its own make as built, where it stands on its
    // own hand), the fulling mill and the canopy across from it (their boxes, and their wheels' rounds), every threshing floor to its
    // kerb (its round), the lanes' walls and hedges (their lines), every tree's crown, every pair (its farthest reach about its axis). A STOOK OR A PAVILION STANDS ONLY WHERE ITS ROUND (the wider of its two makes on that
    // hand, at its own size, and a quarter metre) KEEPS CLEAR OF ALL OF THEM, ON BOTH HANDS: one that does not is left out on both
    // hands, after every number drawn for it, so that nothing else moves. A LANE'S WALL OR HEDGE GIVES WAY, a length at a time and on
    // both hands, where it would pass within 0.3 m of a hut and fold, a chapel, a well, a fountain, the fulling mill or a floor's kerb (its stones and
    // roses are drawn all the same: `gone` in the part). WALL_T is what a wall takes to either side of its line (the dry wall with its
    // fallen stones, which lie to a metre and a half beside it; the hedge's parapet and cope), WALL_HALF half the longest length it is
    // built in (the place tried is a length's middle).
    const farStookGeo = [PW.holdingGeometry('farStook', false), PW.holdingGeometry('farStook', true)], sheavesGeo = PW.holdingGeometry('sheaves', false);
    const STOOK_R = [Math.max(planR(sheavesGeo), planR(farStookGeo[0])), Math.max(planR(holdGeo.stook[1]), planR(farStookGeo[1]))], WALL_T = [1.55, 0.75], WALL_HALF = 0.65;
    const taken = { box: [], round: [], thing: [], line: [] };
    for (const [kind, list] of [['hut', hold.hut], ['well', hold.well]]) for (const q of list) for (const side of [-1, 1]) {
      const b = boxOf(holdGeo[kind][side > 0 ? 1 : 0]), sc = side > 0 ? q.scR ?? q.sc : q.sc, th = side < 0 ? Math.PI / 2 + q.yaw : -Math.PI / 2 - q.yaw;
      taken.box.push({ side, lat: q.lat, s: q.s, c: Math.cos(th), n: Math.sin(th), x0: b.min.x * sc, x1: b.max.x * sc, z0: b.min.z * sc, z1: b.max.z * sc }); }
    for (const q of hold.floor) taken.round.push([q.lat, q.s, FLOOR_R * q.sc]);
    // (the fulling mill under its lean-to and, across the road, the canopy over its six: each the box of its own make as built, at
    // the pair's size; and the wheel that turns beside each, its round)
    for (const side of [-1, 1]) { const b = boxOf(fullGeo[side > 0 ? 1 : 0]), th = -side * Math.PI / 2;
      taken.box.push({ side, lat: latFull, s: sFull, c: Math.cos(th), n: Math.sin(th), x0: b.min.x * FS, x1: b.max.x * FS, z0: b.min.z * FS, z1: b.max.z * FS }); }
    taken.round.push([latFull - PW.FULL.wheelZ * FS, sFull + PW.FULL.wheelX * FS, PW.FULL.wheelR * FS]);
    // (a tree's round is its crown's reach, the wider of its kind's two makes as built, at the tree's own size: a pavilion stands as
    // high as a crown hangs; a pair's reach is its sails' or arms')
    for (const q of treePts) taken.thing.push([q.lat, q.s, crownOf(q)]);
    for (const q of pairs) taken.thing.push([q.lat, q.s, REACH * q.scale]);
    for (const q of laneWalls) taken.line.push([q.lat, q.s, q.lat, q.s + q.len], [q.lat, q.s + q.len, q.lat + 14, q.s + q.len]);
    await ctx.yield();
    // (how near a place on a hand comes to a house, well or floor that stands on that hand: a box is measured in its own frame)
    const builtGap = (lat, s, side) => { let g = 1e9;
      for (const o of taken.box) if (o.side === side) { const dx = side * (lat - o.lat), dz = o.s - s, lx = dx * o.c - dz * o.n, lz = dx * o.n + dz * o.c; g = Math.min(g, Math.hypot(Math.max(o.x0 - lx, 0, lx - o.x1), Math.max(o.z0 - lz, 0, lz - o.z1))); }
      for (const o of taken.round) g = Math.min(g, Math.hypot(lat - o[0], s - o[1]) - o[2]);
      return g; };
    // (and to a trunk, a pair's reach or a lane's wall there)
    const thingGap = (lat, s, side) => { let g = 1e9;
      for (const o of taken.thing) g = Math.min(g, Math.hypot(lat - o[0], s - o[1]) - o[2]);
      for (const o of taken.line) { const ux = o[2] - o[0], us = o[3] - o[1], t = clamp(((lat - o[0]) * ux + (s - o[1]) * us) / (ux * ux + us * us), 0, 1); g = Math.min(g, Math.hypot(lat - o[0] - ux * t, s - o[1] - us * t) - WALL_T[side < 0 ? 0 : 1]); }
      return g; };
    const stookFree = (q) => [-1, 1].every((side) => Math.min(builtGap(q.lat, q.s, side), thingGap(q.lat, q.s, side)) >= STOOK_R[side < 0 ? 0 : 1] * q.sc + 0.25);
    { const kept = []; let i = 0; for (const q of hold.stook) { if (stookFree(q)) kept.push(q); if (++i % 40 === 0) await ctx.yield(); } hold.stook = kept; }
    const wallGone = (lat, s) => Math.min(builtGap(lat, s, -1) - WALL_T[0], builtGap(lat, s, 1) - WALL_T[1]) < 0.3 + WALL_HALF;
    const boatLat = hr.range(30, 70), boatYaw = hr.range(-0.25, 0.25), boats = [-1, 1].map((side) => [{ lat: boatLat, s: -bedZ(side * boatLat), y: hAt(side * boatLat, bedZ(side * boatLat)) + 0.2, yaw: Math.PI / 2 + boatYaw, sc: 1 }]);
    for (const side of [-1, 1]) {
      // (a stook within forty metres of our line, on either hand, is the stook seen near: six bound sheaves that can be counted, and across the
      // road the pavilion with its ball and pennon; further off each is its one plain shape. By where it stands, for the whole visit.)
      const nearS = hold.stook.filter((q) => lineGap(q) < 40), farS = hold.stook.filter((q) => lineGap(q) >= 40);
      instances(side < 0 ? sheavesGeo : holdGeo.stook[1], side, nearS, false); instances(farStookGeo[side < 0 ? 0 : 1], side, farS, false);
      await ctx.yield();
      for (const kind of ['floor', 'hut', 'well']) { instances(holdGeo[kind][side > 0 ? 1 : 0], side, hold[kind], false); await ctx.yield(); }
      instances(PW.holdingGeometry('boat', side > 0), side, boats[side < 0 ? 0 : 1], false);
      // two sides of every plot are walled: dry stone on the left, a hedge of roses on the right. After them, in the same
      // mesh and on the same hand's stream, the lanes' walls, built stone by stone to be passed close: one along our line for the station's length, and from its far end a return
      // fourteen metres outward: a field's corner
      const edges = plotWalls.map((q) => {
        const ry = q.across ? (side < 0 ? Math.PI - q.rot : q.rot) : Math.PI / 2 + side * q.rot, x = side * q.lat, z = -q.s, cs = Math.cos(ry), sn = Math.sin(ry);
        // (a plot's wall is never nearer the route than the margin and mostly sixty metres off and more: it is built in eight-metre lengths, with fewer roses)
        return { x, y: 0, z, ry, len: q.len, seg: 8, far: true, h: (t) => hAt(x + cs * t, z - sn * t) };
      });
      for (const q of laneWalls) { const x = side * q.lat, z = -q.s;
        edges.push({ x, y: 0, z, ry: Math.PI / 2, len: q.len, seg: 1.3, h: (t) => hAt(x, z - t), gone: (t) => wallGone(q.lat, q.s + t) },
          { x, y: 0, z: z - q.len, ry: side < 0 ? Math.PI : 0, len: 14, seg: 1.3, h: (t) => hAt(x + side * t, z - q.len), gone: (t) => wallGone(q.lat + t, q.s + q.len) }); }
      await ctx.yield();
      const fe = PW.fieldEdgeBuilder(side > 0, RN[side < 0 ? 'walls2' : 'hedges2']);
      for (const [i, e] of edges.entries()) { fe.add(e); if (!e.far || i % 10 === 9) await ctx.yield(); }
      const geo = fe.geometry();
      await ctx.yield();
      const m = new THREE.Mesh(geo, kit.mats.solid); m.receiveShadow = true; scene.add(m);
      await ctx.yield();
    }
    // THE OPENING'S FIELDS, BUILT: on each hand one mesh of what stands in them (walls, ricks and wells, stakes, a ploughed field's ridges) and
    // the reaped fields' stooks (the stook seen near within forty metres of our line, its plain shape beyond). A thing's height and reach
    // are read off its geometry as built, the taller and wider of its two makes deciding for both hands.
    {
      const meas = (kind) => { let h = 0, r = 0; for (const rich of [false, true]) { const b = PW.fieldThingsBuilder(rich, null); b[kind](0, 0, 0, 0, 1); const bx = boxOf(b.geometry()); h = Math.max(h, bx.max.y); r = Math.max(r, Math.hypot(Math.max(-bx.min.x, bx.max.x), Math.max(-bx.min.z, bx.max.z))); } return { h, r }; };
      const SIZE = { rick: meas('rick'), sweep: meas('sweep') }, fs = RN.stooks, stooks = [[[], []], [[], []]];
      const stookGeo = [[sheavesGeo, farStookGeo[0]], [holdGeo.stook[1], farStookGeo[1]]];
      // (a stook stands only where its middle is five metres or more from our line, and no nearer on its own hand than its own height
      // and reach as built at its size (STOOK_OFF: the pavilion's 6.2 m at scale one); and, on both hands alike, where its round keeps clear
      // of every tree's crown, every pair's reach and whatever else is taken: stookFree; the lanes' rows keep their own stand-off: see lineGap)
      const STOOK_OFF = [boxOf(sheavesGeo).max.y + planR(sheavesGeo), boxOf(holdGeo.stook[1]).max.y + planR(holdGeo.stook[1])];
      const stookOK = (q, side) => openGap(side * q.lat, -q.s) >= Math.max(5, STOOK_OFF[side < 0 ? 0 : 1] * q.sc) && stookFree(q);
      // (a reaped field's stooks: drawn once for the field, the same on both hands)
      for (const f of fields) { f.stooks = []; if (f.kind === 'reaped') for (const lat of f.first ? [f.lat0 + 1, f.lat0 + 6, f.lat0 + 13.5] : [f.lat0 + 4.5, f.lat0 + 12.5]) for (let s = f.s0 + 5; s < f.s1 - 3; s += 7) f.stooks.push({ lat: lat + fs.range(-0.5, 0.5), s: s + fs.range(-0.6, 0.6), yaw: fs.range(0, 6.28), sc: fs.range(0.9, 1.15) }); }
      await ctx.yield();
      for (const side of [-1, 1]) {
        const si = side < 0 ? 0 : 1, b = PW.fieldThingsBuilder(side > 0, si ? RN.fieldWallsR : RN.fieldWallsL), gapR = ROWS[si];
        for (const f of fields) {
          // the wall along the field's outer long side, broken where our line crosses it
          // (on a hand where the field is within sixty metres of our line; in lengths of 2.2 m within twenty-eight, of 4.4 m beyond)
          const xw = side * (f.lat1 + 0.9); let run = null;
          if (f.gap[si] < 60) for (let s = f.s0; s <= f.s1 + 1; s += 1) {
            const ok = s <= f.s1 && openGap(xw, -s) >= 5;
            if (ok && run == null) run = s;
            if (!ok && run != null) { const r0 = run; if (s - r0 >= 4) b.wall({ x: xw, y: 0, z: -r0, ry: Math.PI / 2, len: s - r0, seg: f.gap[si] < 28 ? 2.2 : 4.4, far: true, bare: f.gap[si] >= 28, h: (t) => hAt(xw, -r0 - t) }); run = null; }
          }
          for (const q of f.stooks) if (stookOK(q, side)) stooks[si][f.gap[si] < 40 ? 0 : 1].push(q);
          if (f.kind === 'plough') {
            const kind = f.draw < 0.5 ? 'rick' : 'sweep', x = side * (f.lat0 + f.lat1) / 2, z = -(f.s0 + f.s1) / 2, g = openGap(x, z), near = f.gap[si] < 70;
            if (g >= 1.5 * SIZE[kind].h + SIZE[kind].r) b[kind](x, hAt(x, z), z, side * f.draw * 12.57, 1);
            // (the ridges of the ploughed field: 0.9 m apart, along the road; none within six metres of our line, nor under the rick or the well)
            if (near) for (let lat = f.lat0 + 0.6; lat < f.lat1 - 0.3; lat += 0.9) { const xr = side * lat; let run = null;
              for (let s = f.s0 + 1; s <= f.s1; s += 3) {
                const ok = s <= f.s1 - 1 && openGap(xr, -s) >= 6 && Math.hypot(xr - x, -s - z) > SIZE[kind].r + 1;
                if (ok && run == null) run = s;
                if (!ok && run != null) { const r0 = run; if (s - r0 >= 6) b.furrow(xr, -r0, s - r0, (t) => hAt(xr, -r0 - t)); run = null; }
              } }
          }
          // (a stake to every 4.8 m of a row of vines or roses, in a field within forty metres of our line)
          if (f.kind === 'crop' && (side > 0 || VINES) && f.gap[si] < 40) for (let lat = f.lat0 + gapR / 2; lat < f.lat1 - 0.4; lat += gapR) for (let s = f.s0 + 1.8; s < f.s1 - 0.6; s += 4.8) {
            const x = side * lat, z = -s; if (openGap(x, z) >= 6) b.stake(x, hAt(x, z), z, 1.55); }
          await ctx.yield();
        }
        await ctx.yield();
        const m = new THREE.Mesh(b.geometry(), kit.mats.solid); m.receiveShadow = true; scene.add(m);
        await ctx.yield();
        instances(stookGeo[si][0], side, stooks[si][0], false); instances(stookGeo[si][1], side, stooks[si][1], false);
        await ctx.yield();
      }
    }
    // the mule goes round the lane's threshing floor on the clock, treading the spread straw: on the round the floor itself gives (PW.FLOOR.walk:
    // outside the heap, inside the kerb), a round in 34 s (1.4 m/s, a mule's walk; its legs step by the metres of that round: a stride of 1.5 m). On the tiled round across
    // the road a palfrey is walked the same round at the same pace. Where on its round each floor's beast is at the clock's nought, and which foot it is
    // on, are drawn for the floor (stream 'mules').
    for (const q of laneHold.floor) { q.round = RN.mules.range(0, TAU); q.foot = RN.mules.range(0, TAU); }
    const MULE_R = PW.FLOOR.walk, MULE_W = TAU / 34, muleItems = laneHold.floor.map((q) => ({ x: 0, z: 0, phase: q.foot, rate: TAU * MULE_R * MULE_W / 1.5, gait: 1, nod: 1 }));
    const mules = laneHold.floor.length ? ['donkey', 'palfrey'].map((kind) => { const m = PW.makeMover(PW.makeCreatures(PW.creatureGeometry(kind), kit.mats.limb, muleItems, { moving: true, depth: kit.mats.depth })); scene.add(m.mesh); return m; }) : [];
    // (each beast's mesh is given the sphere of its round)
    if (mules.length) { const F = laneHold.floor, cl = F.reduce((a, q) => a + q.lat, 0) / F.length, cs = F.reduce((a, q) => a + q.s, 0) / F.length, r = Math.max(...F.map((q) => Math.hypot(q.lat - cl, q.s - cs))) + MULE_R + 3;
      mules.forEach((m, k) => { const x = (k ? 1 : -1) * cl; m.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(x, hAt(x, -cs) + 1.5, -cs), r); m.mesh.frustumCulled = true; }); }
    const moveMules = (time) => {
      laneHold.floor.forEach((q, i) => { const th = time * MULE_W + q.round, ds = MULE_R * Math.cos(th), dl = MULE_R * Math.sin(th);
        for (const [k, side] of [[0, -1], [1, 1]]) { const x = side * (q.lat + dl), z = -(q.s + ds); mules[k].set(i, x, hAt(x, z) + 0.13, z, Math.atan2(side * Math.cos(th), Math.sin(th)), 1); } });
      for (const m of mules) m.commit();
    };
    await ctx.yield();
    // the first stars: on the right-hand side of the sky only (he rides into an evening of romance; the left keeps its plain dusk), from thirty degrees
    // up to the zenith, the brightest first, anywhere round the right-hand half of the sky from eleven degrees off the road ahead to eleven degrees
    // off the road behind (none over the seam itself). They hang in the sky kit's dome.
    const st = RN.stars, starDirs = [];
    for (let i = 0; i < 260; i++) { const el = Math.asin(st.range(0.5, 0.99)), az = st.range(0.12, 1.88) * Math.PI / 2, c = Math.cos(el); starDirs.push([Math.sin(az) * c, Math.sin(el), -Math.cos(az) * c, st.range(1.6, 3.4) * (st.chance(0.1) ? 1.6 : 1), st()]); }
    const stars = PW.makeStars(U, starDirs, 3000); sky.object.add(stars.points);

    await sky.prewarm(ctx.renderer, null, scene);
    // THE HOUR STANDS (nothing of the day wears by the metres flown; no dusk falls and no lamp wakes as we pass). The sky, the
    // sun or the moon, the light, the air and the clouds are the visit's hour from the first frame to the last, the same for a visitor who
    // stands still: the sun at the hour's own height on its own bearing (over his side of the road), the shadows' light from fifteen degrees
    // or from the hour's own height if that is more; at night the moon twelve degrees up on that bearing (the sky kit's own body) and its
    // light from fifteen. THE LAMPS AND THE WINDOWS are a standing state of the hour too: HOUR.dusk stands against the lamps' one hour and each window's own
    // (all are lit at night, at the golden hour and at dawn; none by day); what a lamp throws on the ground, and the street's own lamp,
    // tell by HOUR.lamp of their night's strength against the hour's own light (1 at night, 0.6 at dawn, 0.5 at the golden hour). The
    // right-hand stars are out at night and faint at dawn (HOUR.stars), not by day nor at the golden hour. The air's colour is held in the
    // scene's fog and in every copy of it (the two ranges of hills, the two cloud fields' haze); the dust and the flowers hold the one
    // colour object itself. The function below sets the same values every frame (the kit's parts are updated after it): it reads no place.
    const su = sky.uniforms, HOUR = { dusk: hour === 'day' ? 0 : 1, lamp: night ? 1 : hour === 'dawn' ? 0.6 : hour === 'golden' ? 0.5 : 0, stars: night ? 1 : hour === 'dawn' ? 0.35 : 0 };
    const fogCopies = [scene.fog.color, ridges.uniforms.uHaze.value, hills.uniforms.uHaze.value];
    for (const c of [cloudsL, cloudsR]) for (const k of ['uHazeSun', 'uHazeAway']) if (c.uniforms[k]) fogCopies.push(c.uniforms[k].value);
    const hourStands = () => {
      U.uDusk.value = HOUR.dusk; U.uLamp.value = HOUR.lamp; stars.material.uniforms.uK.value = HOUR.stars;
      if (!night) {
        skyDirection(sunEl, sunAz, su.uSunDir.value); skyDirection(Math.max(sunEl, 15), sunAz, rig.direction);
        U.uSunCol.value.copy(rig.sun.color).multiplyScalar(1.5);
        U.uSkyCol.value.copy(su.uZenith.value).lerp(su.uHorizon.value, 0.25); U.uHorCol.value.copy(su.uHorizon.value);
        for (const c of [cloudsL, cloudsR]) c.uniforms.uSunDir.value.copy(su.uSunDir.value);
      } else skyDirection(15, sunAz, rig.direction);
      U.uSunDir.value.copy(rig.direction); GU.uSunXZ.value.set(rig.direction.x, rig.direction.z).normalize();
      for (const c of fogCopies) c.copy(fogCol);
    };
    // (every pool of light of the visit, in one mesh)
    scene.add(PW.makePools(U, pools, { fogDensity: scene.fog.density }));
    // (the street's own lamp burns with the lamps of its place, at the hour's standing strength: what lights the square is warm)
    const streetLight = () => { streetLamp.intensity = STREET_LAMP * HOUR.lamp * smoothstep(streetLampAt - 0.08, streetLampAt + 0.08, HOUR.dusk); };
    return {
      scene, path, duration: DURATION, pace, pois,
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 30, sway: 0.7, bank: 0.25 },
      // THE RING fills the gateway's arch (its radius is the arch's). It begins to show the next world at a PLACE: the first place past the
      // two houses' last wall from which the whole ring is in sight over the road's rise (THE RING IS WHOLE IN SIGHT, above); the number given
      // is the metres of our line from that place to the ring, and the engine has the opening whole at six tenths of it. Its rim's
      // glow, 1.6 of the engine's own, is a number by eye and not a measure: chosen against the sky that stands behind the
      // gateway.
      portal: { shape: 'circle', radius: RING, color: RING_COL, glow: 1.6, revealDistance: path.length - mWhole },
      post: { exposure: night ? 1.15 : 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#fffaf2', shadowTint: '#0a0c22', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        kit.update(time); wheel.rotation.x = wheelPh + time * 0.9; for (const w of fullWheels) w.rotation.x = fullPh + time * 0.8;
        // NOTHING IN THIS WORLD GOES BY THE METRES WE FLY OR BY WHERE WE ARE: this function does not read u. THE HOUR STANDS
        // (sun or moon, sky, light, air, the windows and the lamps and their pools of light, the stars: hourStands sets the same values every
        // frame). BY THE WORLD CLOCK, each on a round of its own and right at any second: the wind's gusts and the sails' and arms' turning,
        // the crows' crossings, the grazing beasts' rounds, the dogs' rounds, the pigs, the
        // swans, the mule and the palfrey, the wheeling birds, butterflies, the limbs of what stands (mounts, men, the reapers' stroke),
        // mallets, wheels, banners and cloth, dust, smoke, grass, water's ripples, the torches' waver, chaff, petals and the fountain's
        // drops, motes, glints, the stars' twinkle.
        // NOTHING STANDING IS SHOWN OR HIDDEN BY WHERE WE ARE: every flower, tree, figure and thing is in the scene for the whole visit
        // (but the opening's standing crops, which are tufts of the kit's grass and keep the grass's own range: named below).
        // WHAT READS THE EYE OR THE LENS, exactly. This function reads neither the camera's place nor its matrices; it hands the camera to the
        // kit's own parts (sky, light rig, ranges of hills, grass, trees, clouds, smoke), which follow the eye as the kit does everywhere. In
        // this world's own shaders:
        //   the motes, the glints and the small things in the air (chaff, petals, drops) read the PROJECTION matrix and the drawing buffer's
        //     height (set here) to give a point its true size in pixels, and the stars the buffer's height alone; the small things also
        //     read the VIEW DEPTH for a soft clip between 1 and 2.5 m before the eye and for their own fog; the motes and the glints fade
        //     by their TRUE DISTANCE from the lens, from nothing at 2.5 m to whole at 5 m, and are held under twenty pixels;
        //   the birds and butterflies take each face's slope off screen derivatives for their shading (a flat-shaded wing);
        //   the opening's standing crops are tufts of the kit's grass in the kit's own sets: they fade, and a field's set is left undrawn,
        //     beyond the grass's own range from the eye, exactly as the grass is;
        //   the dust the droves raise: its quads face the eye by the view matrix, and it thins by VIEW DEPTH between 2.5 and 9 m before the
        //     eye (so that we do not fly through a wall of it) and takes its fog by view depth;
        //   the standing flowers and the pools of light take their fog by VIEW DEPTH (the flowers read nothing else of the eye: none sinks);
        //   the moat's, the stream's and the brook's water read the eye's PLACE (cameraPosition) for what they mirror: the sky, the sun's
        //     glitter, and in the moat the castle's wall;
        //   the country's lit materials read the eye's place for the sheen of steel and gold and the rim of wool, as any lit surface does,
        //     and a pixel's footprint (screen derivatives) for the fineness of brocade, courses and planks;
        //   the ground reads only a pixel's footprint (screen derivatives): furrows, joints, cobbles, painted flower heads go to their mean
        //     tone where they are finer than a pixel.
        // Nothing is placed or timed by where the eye is, nothing but the three near fades (the small things, the motes and glints, the dust) and the kit's grass rule named above is hidden by
        // it, and nothing tests against the view's edges.
        hourStands(); blow(time); moveYard(time); moveCrowds(time); moveFieldDroves(time); moveMules(time); moveFlyers(time);
        hills.update(dt, time, camera);
        ctx.renderer.getDrawingBufferSize(dbs); moteMat.uniforms.uH.value = dbs.y; fallers.material.uniforms.uH.value = dbs.y; glintMat.uniforms.uH.value = dbs.y; stars.material.uniforms.uH.value = dbs.y;
        sky.update(dt, time, camera); rig.update(dt, time, camera); streetLight(); ridges.update(dt, time, camera);
        grassL.update(dt, time, camera); grassR.update(dt, time, camera); for (const t of treeSets) t.update(dt, time, camera); for (const t of cropSets) t.update(dt, time, camera);
        cloudsL.update(dt, time, camera); cloudsR.update(dt, time, camera); smoke.update(dt, time, camera); smokeV.update(dt, time, camera);
      },
      dispose() { sky.dispose?.(); pudTex.dispose(); },
    };
  },
};
