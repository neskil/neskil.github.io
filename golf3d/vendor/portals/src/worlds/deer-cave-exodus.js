// Three Million Wings (deer-cave-exodus): a full-moon night in Deer Cave, Mulu. The camera is one bat leaving its
// roost: it starts low on the cave floor among giant stalagmites, where a shaft of moonlight falls through a
// window in the roof; a string of swiftlets comes home across the keyhole of the mouth; it climbs into the rope
// (src/parts/deer-cave-exodus.js), the river of bats under the ceiling, and rides it out through the mouth. Outside
// the rope swings wide to the right and comes back across the sky as a river, a corkscrew 44 m across that turns
// once in 170 m; the camera turns left and flies straight at the moon, so the river coils across the moon's face
// and grows from a band to a third of the frame, thousands of separate bats; it ducks under the river where the
// coil arches highest, with its gaze held on the moon, turns between two karst
// towers standing in mist and climbs to a ring in a notch between two limestone blades, while the river, which has
// turned far out to the left, comes back out of the moon and crosses the sky over the ridge and the ring.
// World space = the hero's local space: origin on the cave floor in the mouth plane, the mouth faces +Z, left is
// +X. The moon stands low on the left (34 to 40 degrees left of +Z): the flight outside is laid out on its bearing.
// One hour only (night: the dusk flock belongs to another world). Variations, picked by seed: weather clear
// (silver moon, mist pooled in the dolines, steam plumes, many fireflies) | deep mist (a low amber moonrise over
// a cloud sea that drowns the canopy, towers and emergents as islands; the path flies higher) | a thunderhead far
// to the right with eased sheet lightning under a high white moon and a teal sky; swiftlet numbers, firefly
// numbers, the layout of towers and emergents.
// Scripted, all keyed to u: the swiftlet string streams in through the keyhole, across its face and over the left
// shoulder through the first three tenths of the flight, thickest across the keyhole early on; roost strings peel
// off the ceiling while the lens is under them; on the climb the rope is a river of bats just overhead, the lens
// rises into it and crosses the threshold three tenths of the way along. Outside, on the run at the moon, the river
// lies across the moon's face and grows until it passes over the top of the frame at the duck (the gaze is held on
// the moon through it), giant umbrella crowns passing under and beside the lens the whole way; then the pass
// between the two towers, where the bats move to the river's return leg; and through the last third the river
// comes back out of the moon over the ridge, nearer and larger all the way to the ring.
// Rare (ctx.vary.rare): the fireflies of the whole forest fall into step: thousands of them in the crowns and on
// the towers pulse together, and each beat runs through the forest as a wave (eased, half a beat a second).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, BAT_STROKE_GLSL } from '../parts/deer-cave-exodus.js';

const PAL = ['#06090A', '#17424E', '#62B9A1', '#F3A869', '#BCD6CC', '#143322', '#2B1D17'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h) => new THREE.Color(h);
const DEG = Math.PI / 180;

// The night, and what each weather changes in it. lamp = the sky seen through the mouth (it lights the cave air and
// the walls that face it); glow = the moon on things outside (uGlowCol = glow x glowK) and on the bats (x glowI);
// moon = its strength on the cave's walls where it shines in through the keyhole; mistShade = the tint of the cloud
// sea's hollows (times the mist colour); skyK, rockK scale the sky light and the limestone.
const NIGHT = {
  hero: 'night', zenith: '#040a1c', mid: '#11244e', horizon: '#3b5e94', wash: '#7e9cd2', washK: 0.6, cirrusLit: '#9fb2dc', cirrusShade: '#1c2a4c',
  moonAz: 37, moonEl: 12, moonSize: 4.6, moonCol: '#f1f0ea', moonGlow: '#a9c2ff', moonI: 1.5, moon: '#dfe8ff', moonK: 1.15,
  lamp: '#93a8d0', lampI: 1.5, haze: '#3c4f78', fog: '#22304c', fogK: 0.00085, mist: '#b9c6e2', mistI: 0.45, mistShade: [0.3, 0.38, 0.56],
  glow: '#cfdcf8', glowI: 3.2, glowK: 1.9, skyCol: '#4a66a0', skyK: 1.9, skyGrey: 0.45, rockK: 0.95, canopyA: '#27584a', canopyB: '#173a34', canopyC: '#356a58',
  portal: '#ffc98a', exposure: 1.15, shadowTint: '#050814', fireflies: 2.2,
};
const WEATHER = {
  clear: {},
  // moonrise over a cloud sea: the moon low and amber, the mist warm silver
  mist: { zenith: '#070b1a', mid: '#1a2444', horizon: '#56567a', wash: '#c9a98a', washK: 0.7, cirrusLit: '#c9b6a6', moonAz: 40, moonEl: 8.5, moonSize: 5.2, moonCol: '#ffd9a0', moonGlow: '#ffbf8a', moon: '#ffe4c0',
    lamp: '#c6b6b4', lampI: 1.75, haze: '#5a5068', fog: '#2c2f48', mist: '#d9cfc6', mistI: 0.5, mistShade: [0.34, 0.36, 0.5], glow: '#f6dfc4', skyCol: '#5a6490', portal: '#9fe0ff', fireflies: 1 },
  // a storm cell far to the right: a higher, whiter moon, a teal sky, sheet lightning
  thunder: { zenith: '#03101a', mid: '#0d2c40', horizon: '#2f6a80', wash: '#86c2c8', cirrusLit: '#8fc0c4', cirrusShade: '#14303a', moonAz: 34, moonEl: 15, moonSize: 4.2, moonCol: '#f4f8f6', moonGlow: '#9fe0e0', moon: '#d8f4f0',
    lamp: '#9cc8d2', lampI: 1.3, haze: '#3d6c7a', fog: '#1c3440', mist: '#b4d4d2', mistShade: [0.26, 0.42, 0.48], glow: '#c6eeea', skyCol: '#3f7888', canopyA: '#235a50', canopyC: '#32705e', fireflies: 1.4 },
};

const NOISE_GLSL = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
// Cave air: humid haze lit by the mouth, shared by everything inside. Three parts: a thin even haze, a forward
// lobe that makes the soft cone down the passage, and the airlight of the lamp itself (the closed-form integral
// of 1/r^2 along the view ray, softened to the size of the mouth), fanned by slow rays. Rock in the throat itself
// (the last 90 m before the mouth plane) is spared the forward lobe, so the rim of the keyhole keeps its darks.
const CAVE_GLSL = /* glsl */`
uniform vec3 uCam, uLampPos, uLampCol, uHaze; uniform float uHazeK, uTime;
float hC(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float nC(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hC(i), hC(i + vec2(1., 0.)), f.x), mix(hC(i + vec2(0., 1.)), hC(i + vec2(1., 1.)), f.x), f.y); }
vec3 caveFog(vec3 col, vec3 P){
  vec3 d = P - uCam; float dist = length(d); vec3 v = d / max(dist, 1e-3);
  float f = 1. - exp(-dist * uHazeK);
  vec3 oL = uCam - uLampPos; float dl = length(oL); vec3 toM = -oL / max(dl, 1e-3);
  float c = max(dot(v, toM), 0.), c2 = c * c, c8 = c2 * c2; c8 *= c8;
  float b = dot(oL, v), H = sqrt(max(dot(oL, oL) - b * b, 0.) + 900.);
  float air = (atan((dist + b) / H) - atan(b / H)) / H;
  vec3 e1 = normalize(cross(toM, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), e2 = cross(e1, toM);
  vec2 sp = vec2(dot(v, e1), dot(v, e2)); sp /= max(length(sp), 1e-3);
  float rays = nC(sp * 3.5 + uTime * .05) * .6 + nC(sp * 8. - uTime * .07 + 5.) * .4;
  float mk = 1. - smoothstep(-95., -6., P.z);
  vec3 hz = uHaze * (f * (.11 + .2 * c2 * (.3 + .7 * mk) + .4 * c8 * (.85 + .3 * rays) * mk) + air * .36 * (.88 + .24 * rays) * (.3 + .7 * mk));
  return col * (1. - f) + hz;
}
float lampAtt(vec3 P){ return 95. / (length(uLampPos - P) + 60.); }
uniform vec3 uMoonDir, uMoonCol, uHole, uFoot, uBeamDir, uBeamCol, uBounce; uniform float uBeamR;
// moonlight through the keyhole: 1 where the ray from P to the moon leaves by the mouth (the plane z = 0) inside its
// outline, under the comb of stalactites on its rim and over the tops of the forest that stands outside
float moonIn(vec3 P){
  float t = max(-P.z, 0.) / max(uMoonDir.z, .05);
  vec2 q = P.xy + uMoonDir.xy * t;
  float hw = 47.5 * (.6 + .4 * smoothstep(-5., 62., q.y));
  float e = q.y < 72. ? hw - abs(q.x) : 47.5 * (1. - length(vec2(q.x / 47.5, (q.y - 72.) / 48.)));
  e -= nC(vec2(q.x * .3, 7.)) * 9. * smoothstep(64., 100., q.y);
  float trees = q.y - (36. + 10. * nC(vec2(q.x * .09, 2.)));
  return smoothstep(0., 4. + t * .012, min(e, trees)) * (1. - step(0., P.z));
}
// the shaft from the window in the roof: 1 inside it (ragged), 0 outside
float beamIn(vec3 P){
  vec3 d = P - uHole; float al = dot(d, uBeamDir), r = length(d - uBeamDir * al);
  float rag = .8 + .45 * nC(P.xz * .19 + 3.);
  return (1. - smoothstep(uBeamR * .55 * rag, uBeamR * 1.12 * rag, r)) * step(0., al);
}
`;

const CAVE_VERT = /* glsl */`
attribute vec3 aCol; varying vec3 vC, vN, vP;
#ifdef STAL
attribute vec2 aSt; varying vec2 vSt;
#endif
void main(){
#ifdef STAL
  vSt = aSt;
#endif
  vC = aCol; vN = normal; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// Wet limestone. The walls carry flowstone: rounded columns 8 m across that run straight down, with dark grooves
// between them and small flutes on each, so the level light from the mouth rakes them into a lit flank and a dark
// one (the relief is in the albedo and in one broad normal, never in a mirror highlight, so it reads as matte wet
// rock, not as liquid). Where the wall is massive it is bedded instead: ledges with a dark undercut and a pale
// lip. The throat (the last 60 m) is all columns, with thin glints on their shoulders and a thin jade rim.
// Close to (inside 60 m) the rock is limestone, not wax: rills that wander down the face and die out, pits, thin
// bedding joints, drip stains under every ledge, mottling, a dark damp foot; all of it in the albedo and in one
// bump of true depth, and the broad shading there follows the passage's own round and not the mesh's cells, so no
// facet shows. STAL: the stalagmites (aSt = metres above the foot, tier + place in the tier): growth rims, dark
// feet, a wet highlight on the side turned to the roof window.
const CAVE_FRAG = /* glsl */`
varying vec3 vC, vN, vP; uniform vec3 uAmbCol; uniform float uFloorK;
#ifdef STAL
varying vec2 vSt;
#endif
${NOISE_GLSL}${CAVE_GLSL}
// Solution pockets: round-edged hollows on a jittered grid, each of its own size and a little wider than tall, a
// cell left empty wherever the cluster mask (keep, 0..1) says so. p: metres along the wall and up it, sc: cells to
// the metre. Returns x = 1 at the pocket's floor, 0 on its edge, below 0 outside; y = +1 at its upper edge, -1 at
// its lower one.
vec2 pockets(vec2 p, float sc, float keep, float big){
  vec2 q = p * sc, i = floor(q), f = fract(q), best = vec2(-9., 0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), id = i + g; float h = h21(id + 3.7), h2 = h21(id + 9.1);
    vec2 c = f - (g + .22 + .56 * vec2(h21(id), h21(id + 17.3)));
    float R = mix(mix(.1, .47, h * h), mix(.22, .47, h), big) * step(h2, keep);
    vec2 e = c / vec2(max(R * (1.15 + .5 * h2), 1e-3), max(R, 1e-3));
    float d = (1. - dot(e, e)) * step(1e-3, R) - 9. * (1. - step(1e-3, R));
    if (d > best.x) best = vec2(d, e.y);
  }
  return best;
}
void main(){
  vec3 V = normalize(uCam - vP + vec3(1e-4, 0., 0.));
  vec3 N0 = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N0, V) < 0.) N0 = -N0;
  float dist = length(uCam - vP), nearK = 1. - smoothstep(30., 130., dist), midK = 1. - smoothstep(110., 300., dist);
  float thr = smoothstep(-74., -14., vP.z);
  float nr = (1. - smoothstep(70., 160., dist)) * (1. - uFloorK), nr2 = (1. - smoothstep(14., 40., dist)) * (1. - uFloorK);      // the passage is 170 m wide: its walls are seen from 40 to 100 m
#ifndef STAL
  // the wall's broad shading follows the round of the passage where the two agree, so the mesh's cells never show as facets
  vec3 Ns = normalize(vec3(-vP.x, (52. - vP.y) * .55, 0.) + vec3(1e-4, 0., 0.));
  N0 = normalize(mix(N0, Ns, .75 * smoothstep(.72, .93, dot(N0, Ns)) * (1. - smoothstep(60., 160., dist))) + vec3(0., 1e-4, 0.));
#endif
  float warp = vn3(vP * .035);
  float curtain = vn3(vec3(vP.x * .10, vP.y * .026, vP.z * .10) + warp * 2.);     // broad runs, stretched down the wall
  float rib = vn3(vec3(vP.x * .8, vP.y * .05, vP.z * .8) + 9.);
  float bed = vn3(vec3(vP.x * .03, vP.y * .13 + warp * 1.2, vP.z * .03) + 4.) * .6 + vn3(vec3(vP.x * .07, vP.y * .3, vP.z * .07) + 9.) * .4;      // lenses of massive rock four times as long as they are deep, each dying out sideways: bedding without a level line
  float hq = vP.z + vP.x * .38, fl3 = 1. - smoothstep(18., 60., dist);             // metres along the wall; what is finer than a metre shows only this close
  float fine = vn3(vP * 1.7 + 3.);
  float wall = 1. - smoothstep(.5, .85, abs(N0.y));
  float run = smoothstep(.3, .62, vn3(vP * .013 + 7.));                           // flowstone here, massive bedded rock there
  float stepK = smoothstep(-115., -45., vP.z) * (1. - smoothstep(-30., -8., vP.x));        // the stepped right-hand side of the mouth: ledges, which upright columns would cut into a sawtooth
  float colK = wall * mix(.3 + .7 * run, 1., thr) * (.72 + .28 * max(thr, midK)) * (1. - uFloorK) * (1. - stepK);      // the floor, its banks and boulders carry no flowstone columns
#ifdef STAL
  colK = 0.;
#endif
  // the flowstone hangs in tiers 45 m tall, each with its own columns: bold ones and flat ones, of unequal width
  float c0 = vP.z * .13 + vP.x * .05;
  float tr = vP.y * .023 + vn2(vec2(vP.z * .012, vP.x * .012 + 3.)) * .8 + vP.z * .0035 + .1 * sin(c0 * 3.1416) + .24 * vn2(vec2(c0 * .9, 5.)), tier = floor(tr), tf = fract(tr);      // each hem dips along the cave and hangs in scallops from column to column
  float cu = hq * .07 + (vn2(vec2(vP.z * .017, vP.y * .013 + tier * 3.7)) - .5) * 1.3 + h21(vec2(tier, 2.1)) * 9.;
  float hemK = smoothstep(0., .1, tf) * (1. - smoothstep(.84, 1., tf));          // the columns die away into each hem, so no groove jumps sideways across one
  float colA = colK * hemK;
  // the columns are the swells of one smooth profile along the wall, no two alike, 10 to 30 m across: each has a
  // lit flank and a dark one, the hollow between two is a broad shade, and nothing in it repeats or draws a line
  float ch0 = vn2(vec2(cu, tier * 7.3 + 1.)) * .65 + vn2(vec2(cu * .43 + 3., tier * 5.1)) * .35, ch1 = vn2(vec2(cu + .3, tier * 7.3 + 1.)) * .65 + vn2(vec2(cu * .43 + 3.129, tier * 5.1)) * .35;
  float nb = clamp((ch0 - ch1) * 3.4, -1., 1.), cid = ch0, amp = (.4 + .6 * smoothstep(.3, .75, ch0)) * colA;
  float bulge = smoothstep(.22, .78, ch0), groove = 1. - smoothstep(.1, .45, ch0);
  float nf = fract(cu * 5. + cid * 2.) * 2. - 1.;                                 // flutes on each column, close to
  float streak = vn2(vec2(cu * 9., vP.y * .05)) * (1. - smoothstep(25., 80., dist));
  // each hem shows only in lengths, and beyond 50 m at a third of its strength
  float hemSeg = smoothstep(.4, .62, vn2(vec2(hq * .033 + tier * 5.1, tier * 3.1 + 2.))) * mix(1., .33, smoothstep(50., 110., dist));
  float hemS = smoothstep(.88, .98, tf) * (1. - smoothstep(.98, 1., tf)) * colK * .5 * hemSeg, hemL = smoothstep(0., .012, tf) * (1. - smoothstep(.012, .05, tf)) * colK * .45 * hemSeg;    // the shadow under each tier's hem, and the hem's pale edge
  // a few bedding ledges: two levels in five carry one, each in broken lengths, fainter far off
  float by = vP.y * .1 + warp * .8 + vn2(vec2(vP.z * .02, vP.x * .02)) * .8, bf = fract(by), bi = floor(by);
  float ledSeg = smoothstep(.42, .6, vn2(vec2(hq * .028 + bi * 3.3, bi * 2.7))) * mix(1., .35, smoothstep(50., 120., dist));
  float ledK = max(wall * (1. - run) * (1. - thr) * midK * step(.6, h21(vec2(bi, 1.7))), wall * stepK * .7) * (1. - uFloorK) * ledSeg;
  float under = max(smoothstep(.78, 1., bf) * ledK, hemS), lipT = max((1. - smoothstep(0., .16, bf)) * ledK, hemL);
  vec3 tz = vec3(0., 0., 1.) - N0 * N0.z; tz /= max(length(tz), .25);             // along the passage, in the surface
  float cuK = mix(1., .4, smoothstep(35., 110., dist));                              // far off the damp runs are a faint mottle: the rock's form carries, not a cloud pattern
  vec3 N = normalize(N0 + tz * (nb * (.45 + .55 * abs(nb)) * 1.75 * amp + (nf * (1. - nf * nf) * .5 * colA + (rib - .5) * .3) * fl3 + (curtain - .5) * .45 * cuK * (1. - .6 * thr))
    + vec3(0., (bed - .5) * .4 + lipT * .3 - under * .3, 0.) + vec3(0., 1e-4, 0.));
  vec3 alb = vC * (.9 - .28 * cuK + .56 * cuK * curtain) * (.98 - .14 * cuK + .28 * cuK * bed) * (.9 + .2 * fine * nearK) * (1. + (streak - .5) * .25 * colK);
  // guano banks and rubble: soft mounds and a pebbled grain, pale drift lines, none of the wall's vertical runs
  float mound = vn2(vP.xz * .16 + 4.), peb = vn2(vP.xz * 1.4) * .6 + vn2(vP.xz * 3.7 + 9.) * .4;
  alb = mix(alb, vC * (.6 + .7 * mound) * (.78 + .44 * peb * nearK), uFloorK);
  N = normalize(N + vec3(vn2(vP.xz * .16 + vec2(1.3, 4.)) - mound, 0., vn2(vP.xz * .16 + vec2(0., 5.3)) - mound) * (1.6 * uFloorK) + vec3(0., 1e-4, 0.));
  // the underside of the brow: flowstone ribs that run out toward the light, lumpy, darker toward the lip so it frames the sky
  float ceilK = (1. - wall) * thr;
  float ribC = abs(fract(vP.x * .17 + vn2(vec2(vP.x * .4, vP.z * .05)) * .9) * 2. - 1.), lumpC = vn2(vP.xz * .8 + 11.);
  alb *= mix(1., (.4 + .85 * ribC) * (.65 + .6 * lumpC) * mix(1., .5, smoothstep(-22., -1., vP.z)), ceilK);
  N = normalize(N + vec3((ribC - .5) * 1.1 * ceilK, 0., (lumpC - .5) * .7 * ceilK) + vec3(0., 1e-4, 0.));
  alb *= mix(1., (.7 + .46 * bulge) * (1. - .42 * groove) * (1. - .1 * fl3 * smoothstep(.7, 1., abs(nf))), colA) * (1. - .6 * under) * (1. + .18 * lipT);
  // ---- limestone at close range ----
  float bare = wall * (1. - .7 * colA * smoothstep(45., 110., dist)), nrR = (1. - smoothstep(30., 85., dist)) * (1. - uFloorK);       // close to, the flowstone's columns are limestone too: rills, pockets and stains on both walls
  float rwn = vn2(vec2(hq * .27 + 2., vP.y * .028 + warp * 2.)), r1 = abs(rwn * 2. - 1.);                  // rills 2 to 5 m apart: they wander as they fall
  float r2 = abs(vn2(vec2(hq * 1.9 + 11., vP.y * .16)) * 2. - 1.);                                         // and small ones between them, close to
  float life = smoothstep(.28, .6, vn2(vec2(hq * .06 + 5., vP.y * .09)));                                 // each one runs a bed or two and dies out
  float gw = .09 + dist * .0019;
  float g1 = (1. - smoothstep(gw * .25, gw * 1.5, r1)) * life * bare * nrR, g2 = (1. - smoothstep(.04, .2, r2)) * (1. - life * .5) * bare * nr2;
  // solution pockets from a hand to a couple of metres across, in clusters with bare rock between: a dark upper
  // lip (the overhang's shade), a floor in half shade, a pale rim along the lower edge where the light catches it
  vec2 pw = vec2(hq, vP.y) + (vec2(vn2(vec2(hq, vP.y) * .55 + 3.), vn2(vec2(hq, vP.y) * .55 + 23.)) - .5) * 1.1;
  float clu = smoothstep(.47, .66, vn2(pw * .043 + 5.) * .62 + vn2(pw * .12 + 2.) * .38);
  vec2 pA = pockets(pw, .27, clu * .8, 0.), pB = pockets(pw + 31.7, .86, clu * .62, 0.);
  float gA = bare * (1. - smoothstep(110., 250., dist)) * (1. - uFloorK), gB = bare * (1. - smoothstep(26., 85., dist)) * (1. - uFloorK);      // the larger pockets carry as far as they are two pixels wide
  // and alcoves, 6 to 16 m across, in loose groups 90 m apart: scoops the old stream cut, each with its roof in
  // shade and its sill catching the light. They carry down the whole passage, where the small pockets are too fine.
  vec2 pwC = vec2(hq, vP.y * 1.25) + (vec2(vn2(vec2(hq, vP.y) * .09 + 13.), vn2(vec2(hq, vP.y) * .09 + 41.)) - .5) * 7.;
  vec2 pC = pockets(pwC + 77.3, .058, smoothstep(.24, .46, vn2(pwC * .012 + 9.)), 1.);
  float gC = wall * (1. - uFloorK) * (1. - .6 * thr * (1. - stepK)) * (.55 + .45 * smoothstep(30., 90., dist));
#ifdef STAL
  gA = 0.; gB *= .5; gC = 0.;
#endif
  float inC = smoothstep(-.05, .45, pC.x) * gC, lipC = inC * smoothstep(-.6, .7, pC.y);
  float rimC = (1. - smoothstep(0., .4, abs(pC.x - .04))) * smoothstep(0., .8, -pC.y) * gC * step(-1., pC.x);
  float inA = smoothstep(-.06, .5, pA.x) * gA, inB = smoothstep(-.06, .5, pB.x) * gB;
  float pock = max(inA, inB * .8);
  float pockH = max(smoothstep(-.1, 1., pA.x) * gA, smoothstep(-.1, 1., pB.x) * gB * .5) * (1. - smoothstep(22., 75., dist));          // the hollow's depth is a soft bowl, and only close to: far off the shade alone carries it
  float lipD = max(inA * smoothstep(-.5, .8, pA.y), inB * .8 * smoothstep(-.5, .8, pB.y));
  float rimP = max((1. - smoothstep(.0, .55, abs(pA.x - .05))) * smoothstep(0., .8, -pA.y) * gA * step(-1., pA.x), (1. - smoothstep(.0, .55, abs(pB.x - .05))) * smoothstep(0., .8, -pB.y) * gB * .7 * step(-1., pB.x));
  float pit = smoothstep(.64, .8, vn3(vP * 2.3 + 11.)) * nr2;
  float mott = vn3(vP * .21 + 2.) * .6 + vn3(vP * .67 + 9.) * .4;
  float sb = vP.y * .2 + warp * 2.4 + vn2(vec2(hq * .022, vP.y * .03)) * 1.8, sf = abs(fract(sb) - .5);
  float sj = (1. - smoothstep(.006, .03 + dist * .0012, sf)) * smoothstep(.36, .6, vn2(vec2(hq * .04, floor(sb) * 3.3))) * step(.6, h21(vec2(floor(sb), 4.4))) * bare * nrR;                  // bedding joints 5 m apart, in lengths that fade in and out
  float drip = smoothstep(.45, .75, vn2(vec2(hq * .36, floor(by) * 5.3 + 1.))) * smoothstep(.05, .95, bf) * ledK;                        // stains that run down from under each ledge
  float seep = smoothstep(.54, .8, vn2(vec2(hq * .11 + 9., vP.y * .03 + warp))) * bare * (1. - uFloorK) * (1. - .7 * smoothstep(40., 120., dist));                              // long dark seeps
  alb *= mix(1., (.62 + .78 * mott) * .9, bare * nr) * (1. - .6 * g1) * (1. - .4 * g2) * (1. - .3 * pock - .42 * lipD) * (1. + .3 * rimP) * (1. - .24 * inC - .56 * lipC) * (1. + .4 * rimC) * (1. - .45 * pit) * (1. - .38 * sj) * (1. - .5 * drip) * mix(vec3(1.), vec3(.5, .56, .6), seep * .75);
  alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(1.1, 1., .86), .5 * bare * nr);                                                    // grey-buff, not jade ice
#ifdef STAL
  // growth rims: thin terraces a hand high stacked up each tier, pale lips over dark undersides; dark feet
  float rm = fract(vSt.x * 1.9 + vSt.y * 3. + .4 * vn2(vP.xz * .6 + vSt.y)), tfS = fract(vSt.y);
  float rimH = rm * rm * (1. - smoothstep(.86, 1., rm));
  alb *= (.9 + .18 * rm) * (1. - .22 * (1. - smoothstep(.0, .12, rm)) * nearK) * mix(.3, 1., smoothstep(.2, 5., vSt.x)) * (.92 + .2 * smoothstep(.7, .95, tfS));
  float hgt = (-g1 * .22 - g2 * .035 - pockH * .12 - pit * .06 + (fine - .5) * .04 * nr2 + rimH * .07 * nearK);
#else
  alb *= mix(vec3(1.), mix(vec3(.5, .45, .4), vec3(1.), smoothstep(8., 44., vP.y)), wall * (1. - uFloorK) * (1. - thr));                    // the foot of every wall is damp and dark
  float hgt = (-g1 * .28 - g2 * .035 - pockH * .16 - pit * .06 + (fine - .5) * .04 * nr2 - sj * .1 + (mott - .5) * .25 * bare * nr - smoothstep(-.1, 1., pC.x) * gC * .9 * (1. - smoothstep(50., 170., dist)));
#endif
  {                                                                                  // one bump of true depth (metres) from all of it
    vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(hgt), hy = dFdy(hgt);
    vec3 R1 = cross(dpy, N0), R2 = cross(N0, dpx); float det = dot(dpx, R1);
    vec3 gr = (hx * R1 + hy * R2) * (sign(det) / max(abs(det), 1e-7));
    N = normalize(N - clamp(gr, -3., 3.) * 1.2 + vec3(0., 1e-4, 0.));
  }
  alb += vec3(.021, .024, .03) * (.6 + .4 * curtain);                              // the darkest jade rock still gives back a little of the night: dim form, not black
  vec3 L = uLampPos - vP; float dl = length(L); L /= max(dl, 1e-3);
  float att = min(95. / (dl + 60.), .95) + .12;
  float hl = .5 + .5 * dot(N, L);
  vec3 H = normalize(L + V + vec3(0., 1e-4, 0.));
  float ndh = max(dot(N, H), 0.), s8 = ndh * ndh; s8 *= s8; s8 *= s8; float s32 = s8 * s8; s32 *= s32;
  float wet = smoothstep(.5, .8, curtain) * (.35 + .65 * rib);                   // wet runs follow the curtains
  vec3 sc = vP * 3.1; float sh = h31(floor(sc));
  float spark = step(.9, sh) * (.55 + .45 * sin(uTime * 2.6 + sh * 400.)) * (1. - smoothstep(.05, .2, length(fract(sc) - .5))) * (1. - smoothstep(45., 150., dist));   // drops that catch the keyhole
  float lip = mix(1. - .6 * thr, 1. + .2 * thr, nearK);                                                    // from deep inside the throat stays darker than the sky it frames; close to, it is the best-lit rock
  float hlq = mix(hl * hl, .3 + .25 * hl, .7 * thr * (1. - .65 * nr));                       // the throat is lit from all of the sky: soft, no facet shows; close to, its relief takes the light
  vec3 col = alb * uLampCol * att * lip * (hlq * 1.3 + .05) + alb * uAmbCol * (.55 + .45 * abs(N.y)) * (.55 + .45 * hl) * (1. - .45 * thr * (1. - nearK));
  col += alb * uBounce * ((.74 - .26 * N.y) * (.7 + .3 * hl) * (1. - .5 * thr * (1. - nearK)));          // the cave's own bounce, warm grey: form shows in every shadow
  // the moon, where it shines in through the keyhole; the shaft from the roof window and the glow of its pool
  float mIn = moonIn(vP), bIn = beamIn(vP), ml = max(dot(N, uMoonDir), 0.);
  vec3 Hm = normalize(uMoonDir + V + vec3(0., 1e-4, 0.)); float nhm = max(dot(N, Hm), 0.), sm = nhm * nhm; sm *= sm; sm *= sm; sm *= sm;
  col += alb * uMoonCol * (mIn * (ml * 1.3 + .05)) + uMoonCol * (mIn * sm * (.03 + .16 * wet * rib));
  vec3 toF = uFoot + vec3(0., 7., 0.) - vP; float dF = length(toF);
  col += alb * uBeamCol * (bIn * (max(dot(N, -uBeamDir), 0.) * 1.5 + .22 + .5 * max(N.y, 0.)) + (.7 * max(dot(N, toF / max(dF, 1e-3)), 0.) + .1) / (1. + dF * dF / 1300.));
  col += uLampCol * att * lip * (s32 * (.03 + .4 * wet * rib * (1. - .8 * thr) + .09 * thr * bulge) + s8 * spark * (.4 + wet) * 5.);
  float fr = 1. - abs(dot(N, V)); fr *= fr;
  col += uLampCol * (fr * fr * thr * thr * (.03 + .15 * bulge));                 // a thin rim where the rock turns out to the sky
  // the window in the roof: a ragged hole of moonlit sky with a lit throat round it
  float hd = length(vP.xz - uHole.xz) + (vn2(vP.xz * .23) - .5) * 5., hy = smoothstep(uHole.y - 20., uHole.y - 9., vP.y);
  col = mix(col, uBeamCol * (.55 + .35 * vn2(vP.xz * .7)), (1. - smoothstep(uBeamR * .8, uBeamR * 1.05, hd)) * hy);
  col += alb * uBeamCol * (.8 * hy * smoothstep(uBeamR * 2.4, uBeamR, hd) * smoothstep(uBeamR * .8, uBeamR * 1.05, hd));
#ifdef STAL
  {                                                                                  // wet: a highlight on the side turned to the roof window, brightest in the shaft and near its pool
    vec3 Lw = normalize(uHole - vP), Hw = normalize(Lw + V + vec3(0., 1e-4, 0.)); float nw = max(dot(N, Hw), 0.), w8 = nw * nw; w8 *= w8; w8 *= w8; float w32 = w8 * w8; w32 *= w32;
    col += uBeamCol * ((w32 * .5 + w8 * .05) * (.22 + .9 * bIn + .5 / (1. + dF * dF / 900.)) * (.5 + .5 * smoothstep(.7, .95, fract(vSt.y))) * max(dot(N, Lw), 0.));
  }
#endif
  vec3 fogged = caveFog(col, vP);
  gl_FragColor = vec4(mix(col, fogged, .5 + .5 * smoothstep(10., 48., dist)), 1.);      // the haze thins on rock a few metres off
}`;

// Roost carpets: hanging cards that shiver; strings of them unfurl, drop and fly off to join the rope. aSeed.z:
// 0 = stays, 1 = peels on a slow time loop, 2 = peels when the camera reaches path progress aSeed.y.
const ROOST_VERT = /* glsl */`
attribute vec3 aRoot, aTarget; attribute vec4 aSeed;
uniform float uTime, uPx, uU; uniform vec3 uCam;
varying vec2 vQ; varying float vFly, vRnd; varying vec3 vP; varying vec4 vW;
void main(){
  float peel = min(aSeed.z, 1.), keyed = step(1.5, aSeed.z);
  float ph = mix(fract(uTime * .07 + aSeed.y), .36 + .64 * clamp((uU - aSeed.y) / .085, 0., 1.), keyed);
  float fly = peel * smoothstep(.5, .57, ph), k = peel * smoothstep(.5, .96, ph);
  float fade = 1. - peel * (smoothstep(.9, .97, ph) + (1. - keyed) * (1. - smoothstep(0., .06, ph)));
  vec3 mid = mix(aRoot + vec3(0., -7., 6.), mix(aRoot, aTarget, .4) + vec3(0., -11., 0.), keyed);
  vec3 p = mix(mix(aRoot, mid, k), mix(mid, aTarget, k), k);
  p += fly * vec3(sin(uTime * 2.3 + aSeed.x * 40.), cos(uTime * 1.9 + aSeed.x * 60.), 0.) * .5;
  float shiver = sin(uTime * 21. + aSeed.x * 60.) * (.02 + .09 * peel * smoothstep(.3, .5, ph)) * (1. - fly);
  vec3 toC = uCam - p; float dist = length(toC);
  vec3 R = normalize(cross(vec3(0., 1., 0.), toC) + vec3(1e-4, 0., 0.));
  vec3 Uf = normalize(cross(toC, R) + vec3(0., 1e-4, 0.));
  vec3 U = normalize(mix(vec3(0., 1., 0.), Uf, fly * .6));
  float sz = max(aSeed.w, dist * uPx * 1.3) * fade;
  vec2 q = position.xy;
  vec3 lp = p + R * (q.x * sz * mix(.5, 1.25, fly) + shiver) + U * ((q.y - 1. + fly) * sz * mix(1., .8, fly));
  float fp = uTime * 55. * (.9 + .2 * aSeed.x) + aSeed.x * 62.8, a1 = .12 + .78 * sin(fp), a2 = a1 - .25 + .65 * sin(fp - 1.1);
  vQ = q; vFly = fly; vRnd = aSeed.x; vP = lp; vW = vec4(sin(a1), sin(a2), cos(a1), cos(a2));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.);
}`;
const ROOST_FRAG = /* glsl */`
varying vec2 vQ; varying float vFly, vRnd; varying vec3 vP; varying vec4 vW; uniform vec3 uBat, uAmbCol;
${CAVE_GLSL}${BAT_STROKE_GLSL}
void main(){
  // hanging: a folded teardrop, feet up; flying: the beating wing line seen from behind
  float w = .26 + .6 * (1. - smoothstep(-.6, .9, vQ.y));
  float hang = 1. - smoothstep(.75, 1., length(vec2(vQ.x / max(w, .05), vQ.y * .98)));
  vec2 wb = batStroke(vQ, vW, vec3(1., .3, .07));
  float a = mix(hang, max(wb.x, wb.y), step(.5, vFly));
  if (a < .5) discard;
  float edge = smoothstep(.25, 1., abs(vQ.x) / max(w, .05)) * (1. - vFly);
  float att = lampAtt(vP);
  vec3 col = uBat * (.75 + .5 * vRnd) * (uBounce * 1.9 + uAmbCol * 1.2 + uLampCol * att * (.12 + .38 * edge));
  gl_FragColor = vec4(caveFog(col, vP) * mix(1., .8, vFly), 1.);
}`;

// Falling water: drips from the stalactites and the ceiling waterfall, which fans, sways and breaks into spray.
const DRIP_VERT = /* glsl */`
attribute vec3 aTop; attribute vec4 aD; attribute vec2 aS;
uniform float uTime, uPx; uniform vec3 uCam;
varying float vA, vX; varying vec3 vP;
void main(){
  float cyc = fract(uTime * aD.y / aD.x + aD.z), t = position.y;
  float fall = max(cyc * aD.x - t * aD.w * (.35 + cyc), 0.);
  vec3 p = aTop - vec3(0., fall, 0.);
  float fr = fall / aD.x, fan = aD.z * 6.2832 * 7.;
  p.xz += aS.y * (fr * sqrt(fr) * 9. * (.3 + .7 * fract(aD.z * 13.7))) * vec2(cos(fan), sin(fan));          // each thread leaves on its own line
  p.xz += aS.y * fr * vec2(sin(uTime * 1.1 - fall * .09 + aD.z * 3.), cos(uTime * .8 - fall * .07 + aD.z * 5.)) * 5.5;   // and the whole fall sways
  vec3 toC = uCam - p; float dist = length(toC);
  vec3 R = normalize(cross(vec3(0., 1., 0.), toC) + vec3(1e-4, 0., 0.));
  float wMin = dist * uPx * .85, w = max(aS.x * (1. + 7. * fr * aS.y), wMin);
  p += R * position.x * w;
  vA = mix(1. - t * .8, 4. * t * (1. - t), aS.y) * smoothstep(0., .04, cyc) * (1. - smoothstep(.93, 1., cyc)) * min(1., aS.x / max(wMin, 1e-4)) * smoothstep(1.2, 4., dist);
  vA *= .35 + .65 * fract(aD.z * 7.31);
  vA *= mix(1., (.3 + .7 * (.5 + .5 * sin(fall * .4 - uTime * 5. + aD.z * 40.))) * (1. - .55 * fr) * .5, aS.y);        // beads and thinning spray
  vX = position.x; vP = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const DRIP_FRAG = /* glsl */`
varying float vA, vX; varying vec3 vP; uniform float uGain;
${CAVE_GLSL}
void main(){
  float a = vA * (1. - vX * vX);
  vec3 col = uLampCol * (lampAtt(vP) * .9 + .12) * uGain;
  float dist = length(vP - uCam);
  gl_FragColor = vec4(col * a * exp(-dist * uHazeK * .6), 1.);
}`;

// The stream on the cave floor: it mirrors the mouth, so from the roof it is a wire of sky colour with sliding glints.
const STREAM_VERT = /* glsl */`
attribute vec2 aUv; varying vec2 vUv; varying vec3 vP;
void main(){ vUv = aUv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const STREAM_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vP;
${NOISE_GLSL}${CAVE_GLSL}
void main(){
  float e = 1. - abs(vUv.x); e = smoothstep(0., .45, e);
  float rip = vn2(vec2(vUv.x * 3., vUv.y * .35 - uTime * .55)) * .6 + vn2(vec2(vUv.x * 7., vUv.y * 1.3 - uTime * 1.1)) * .4;
  float glint = smoothstep(.62, .9, rip);
  vec3 col = uLampCol * (.16 + .34 * rip + 1.5 * glint) * (.35 + .65 * lampAtt(vP));
  gl_FragColor = vec4(caveFog(col * e, vP), 1.);
}`;

// Canopy: one shader for the heightfield of crowns, the instanced leaf clumps (TUFT) and limbs, scrub stems and
// screw-pine leaves (TUFT + PLAIN). Leaves are drawn as cells of small domes with dark gaps (cauliflower), the rim
// of every clump is eaten by leaf-scale noise so no polygon edge shows, gust bands cross it, steam pools in it.
const CANOPY_VERT = /* glsl */`
attribute vec3 aCol;
#ifdef TUFT
attribute vec3 iCol;
#endif
uniform float uTime;
varying vec3 vC, vN, vP;
void main(){
  vec3 p = position, n = normal, c = aCol;
#ifdef TUFT
  vec4 wp = instanceMatrix * vec4(position, 1.);
  mat3 im = mat3(instanceMatrix);
  n = normalize(im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]))) + vec3(0., 1e-4, 0.));
  vec3 org = instanceMatrix[3].xyz; float hgt = max(wp.y - org.y, 0.);
  float g = .5 + .5 * sin(dot(org.xz, vec2(.021, .013)) - uTime * .55);
  float sway = hgt * .045 * (.3 + g * g);
  wp.x += sin(uTime * 1.1 + org.z * .15 + hgt * .2) * sway; wp.z += cos(uTime * .9 + org.x * .13 + hgt * .17) * sway * .8;
  p = wp.xyz; c *= iCol;
#endif
  vC = c; vN = n; vP = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
// Mist: a cloud sea, not a surface. One function of world position (mistLook) gives its colour, its cover and
// its top everywhere: round heads 35 m across carrying 13 m and 5 m heads (lit flanks toward the glow, jade-grey
// hollows), torn into holes whose edges are scalloped by the heads. Two things read it: the sheet (deep mist
// only), a smooth swell that rides clear above the canopy floor and is shaded and holed per pixel; and the
// canopy shader, which tints what lies under it and fades every crown and trunk into the same colour over a
// soft band above its top, so nothing cuts the mist with a hard line and no triangle edge ever shows in it.
const MIST_GLSL = /* glsl */`
uniform float uCovA, uCovB, uAmp, uSheetY, uLayD, uMistGl; uniform vec2 uOffM; uniform vec3 uMistShade;
vec2 h22m(vec2 p){ vec3 q = fract(p.xyx * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
// cauliflower heads: round domes of unequal size on a jittered grid, 1 on a crown, 0 in the gaps between heads
float domeM(vec2 p){
  vec2 i = floor(p), f = fract(p); float h = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = h22m(i + g), r = g + .14 + .72 * o - f;
    float rad = .5 + .38 * fract(o.x * 7.13 + o.y * 3.71);
    h = max(h, 1. - dot(r, r) / (rad * rad));
  }
  return sqrt(max(h, 0.));
}
vec2 warpM(vec2 xz){ return xz + (vec2(vn2(xz * .011 + 3.), vn2(xz * .011 + 17.)) - .5) * 30.; }
float coverM(vec2 xz){
  vec2 q = xz * .013 + vec2(uTime * .006, uTime * .004) + uOffM;
  return smoothstep(uCovA, uCovB, vn2(q) * .55 + vn2(q * 2.3 + 7.) * .3 + vn2(q * 5.7 - uTime * .015) * .15);
}
// height of the cloud top above the sheet level in units of uAmp: slow swells only, which the mesh carries exactly
// and which keep the sheet clear above the canopy floor (k fades the smaller one with distance). The holes and
// the heads are drawn by the shading alone, so no edge of the sheet's or the canopy's triangles ever shows.
float mistH(vec2 xz, float k){
  return (vn2(xz * .0085 + uTime * .005 + 5.) - .5) * 1.7 + (vn2(xz * .023 - uTime * .007 + 11.) - .5) * 1.1 * k;
}
float mistK(float d){ return 1. - smoothstep(170., 520., d); }
`;
const MIST_LOOK_GLSL = /* glsl */`
// 35 m heads carrying 13 m heads
float headsM(vec2 pa, vec2 pb, float kf){ float a = domeM(pa), b = domeM(pb); return a * (1. - .38 * kf) + b * .38 * kf * (.3 + .7 * a); }
// the cloud sea at xz, seen from d metres away: rgb = its colour, a = ragged cover, top = world height of its surface
vec4 mistLook(vec2 xz, float d, out float top){
  float cover = coverM(xz), h0 = mistH(xz, mistK(d));
  vec2 gd = normalize(uGlowDir.xz + vec2(1e-4, 0.)), w = warpM(xz);
  float kf = 1. - smoothstep(130., 480., d), kf2 = 1. - smoothstep(30., 140., d), kA = 1. - smoothstep(500., 1500., d);
  vec2 pa = w * .027 + uTime * vec2(.004, .003), pb = w * .074 - uTime * vec2(.006, .002) + 3., pc = w * .21 + uTime * vec2(.011, -.007);
  float hh = headsM(pa, pb, kf), h1 = headsM(pa + gd * .0675, pb + gd * .185, kf);
  float c = mix(.6, clamp(hh * (.8 + .2 * mix(1., domeM(pc), kf2)), 0., 1.), kA);   // 5 m florets on them, near only
  float lit = clamp(.5 - (h1 - hh) * 2.4 * kA, 0., 1.);                              // flanks turned to the glow
  float sw = vn2(xz * .0085 + uTime * .005 + 5.), k = smoothstep(.12, .85, c);
  vec3 col = mix(uMistCol * mix(uMistShade, vec3(1.), .35), uMistCol * (.5 + .14 * c), k) * (mix(.7, 1.1, smoothstep(.2, .8, lit)) * (.86 + .28 * sw));
  col += uGlowCol * (.15 * uMistGl * lit * lit * k);
  top = uSheetY + uAmp * h0 + (c - .5) * 5. * kA;                                   // what stands in it is cut off along the heads
  return vec4(col, smoothstep(.1, .42, cover * (.08 + 1.7 * c)));                   // edges scalloped by the heads
}`;
// Deep mist: vapour, not a surface. The cloud sea is four translucent layers 5 m apart, cut from one field of
// round heads (a sum of soft bumps, so two heads meet in a smooth hollow, never in a crease): the lowest layer is
// nearly whole and thin in the hollows, each one above keeps only the higher part of every head, so a head is a
// soft stack that hides the hollow behind it, and where the cover tears the eye looks down onto the canopy.
// The layers are real geometry, so a trunk or crown standing in the sea is veiled layer by layer and the heads
// drift in front of it; the canopy shader adds the vapour between a point and the layer next above it (the same
// function), so no layer cuts anything with a line. xz: world, lay: 0..3, d: horizontal distance from the lens.
const MIST_DEEP_GLSL = /* glsl */`
// x = height 0..1 of the heads at p, yz = its slope
vec3 blobM(vec2 p){
  vec2 i = floor(p), f = fract(p), gr = vec2(0.); float s = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = h22m(i + g), r = g + .14 + .72 * o - f;
    float rad = .55 + .4 * fract(o.x * 7.13 + o.y * 3.71), v = max(1. - dot(r, r) / (rad * rad), 0.);
    s += v * v; gr += r * (4. * v / (rad * rad));
  }
  float e = exp(-1.6 * s);
  return vec3(1. - e, gr * (1.6 * e));
}
vec4 mistLayer(vec2 xz, float lay, float d){
  float kA = 1. - smoothstep(110., 340., d), kf = 1. - smoothstep(40., 170., d);       // far off the heads melt into one level sea
  vec2 w = warpM(xz), q = xz * .013 + vec2(uTime * .006, uTime * .004) + uOffM;
  float cn = vn2(q) * .62 + vn2(q * 2.3 + 7.) * .38;
  vec2 gd = normalize(uGlowDir.xz + vec2(1e-4, 0.));
  vec3 A = blobM(w * .027 + uTime * vec2(.004, .003)), B = blobM(w * .074 - uTime * vec2(.006, .002) + 3.);      // 37 m heads carrying 13 m heads
  float fl = vn2(w * .19 + uTime * vec2(.011, -.007)) * .6 + vn2(w * .43 - uTime * vec2(.013, .009) + 5.) * .4;   // soft curls, near only
  float kb = .34 * (.3 + .7 * A.x), h0 = A.x * (1. - .34) + B.x * kb + (fl - .5) * .2 * kf;
  vec2 gh = A.yz * (.027 * (1. - .34 + .24 * B.x)) + B.yz * (.074 * kb);                                         // slope of the heads, per metre
  float h = mix(.6, clamp(h0, 0., 1.), kA);
  float cov = smoothstep(uCovA, uCovB, cn + (h - .5) * .16 - lay * .02);          // torn holes, wider higher up, scalloped by the heads
  float t = .1 + .17 * lay;                                                       // the heads reach 0.75: a quarter of the sea carries the top layer
  float a = cov * (lay < .5 ? .46 + .44 * smoothstep(.05, .4, h) : .88 * smoothstep(t, t + .17, h));
  float lit = clamp(.5 - dot(gh, gd) * 9. * kA, 0., 1.);                          // flanks turned to the glow
  float up = smoothstep(.0, .6, h);
  vec3 col = mix(uMistCol * uMistShade * 1.05, uMistCol * (.5 + .17 * h), up) * mix(.46, 1.16, smoothstep(.2, .8, lit)) * (.94 + .06 * lay);
  col += uGlowCol * (.22 * uMistGl * lit * lit * up);
  return vec4(col, a);
}`;
const MIST_VERT = /* glsl */`
attribute float aLay; varying vec3 vW; varying float vLay; uniform vec3 uCam; uniform float uTime;
${NOISE_GLSL}${MIST_GLSL}
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  w.y += uAmp * mistH(w.xz, mistK(length(w.xz - uCam.xz)));
  vW = w.xyz; vLay = aLay; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const MIST_FRAG = /* glsl */`
varying vec3 vW; varying float vLay; uniform float uOp, uFogK, uTime; uniform vec3 uCam, uMistCol, uGlowCol, uFogCol, uGlowDir;
${NOISE_GLSL}${MIST_GLSL}${MIST_DEEP_GLSL}
void main(){
  vec3 d = vW - uCam; float dist = length(d);
  vec4 L = mistLayer(vW.xz, floor(vLay + .5), length(d.xz));
  float a = uOp * L.a * smoothstep(30., 90., vW.z) * (1. - smoothstep(1500., 2800., dist)) * smoothstep(3., 14., abs(d.y));
  if (a < .004) discard;
  float f = 1. - exp(-uFogK * uFogK * dist * dist);
  gl_FragColor = vec4(mix(L.rgb, uFogCol, f), a);
}`;
// Wisps: a thin torn layer drifting above the crowns (and above the cloud sea), drawn out along the wind.
const WISP_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WISP_FRAG = /* glsl */`
varying vec3 vW; uniform float uOp, uFogK, uTime; uniform vec3 uCam, uMistCol, uGlowCol, uFogCol;
${NOISE_GLSL}
void main(){
  vec3 d = vW - uCam; float dist = length(d);
  vec2 q = vW.xz * vec2(.009, .03) + vec2(uTime * .012, uTime * .003);
  float n = vn2(q) * .5 + vn2(q * 2.7 + 3.) * .3 + vn2(q * 6.3 - uTime * .02) * .2;
  float a = uOp * smoothstep(.56, .82, n) * smoothstep(40., 110., vW.z) * (1. - smoothstep(500., 1300., dist)) * smoothstep(6., 22., abs(d.y));
  if (a < .004) discard;
  float f = 1. - exp(-uFogK * uFogK * dist * dist);
  gl_FragColor = vec4(mix(uMistCol * .56 + uGlowCol * .025, uFogCol, f), a);
}`;

// Canopy: one shader for the heightfield of crowns, the instanced leaf clumps (TUFT), limbs, trunks, twigs and
// screw-pine leaves (TUFT + PLAIN) and the limestone scrub (TUFT + SCRUB: the same leaves seven times smaller).
// Leaves are drawn as cells of small domes with dark gaps (cauliflower), the rim of every clump is eaten by
// leaf-scale noise so no polygon edge shows, gust bands cross it, and everything sinks softly into the mist.
const CANOPY_FRAG = /* glsl */`
varying vec3 vC, vN, vP;
uniform float uTime, uMistOp, uFogK, uSoft; uniform vec3 uCam, uSkyCol, uGlowCol, uGlowDir, uMistCol, uFogCol, uVeil, uHazeFar;
#ifdef TUFT
#define TUFTK 1.7
#else
#define TUFTK 1.
#endif
#ifdef SCRUB
#define LS 7.
#else
#define LS 1.
#endif
${NOISE_GLSL}${MIST_GLSL}
#ifdef DEEP
${MIST_DEEP_GLSL}
#else
${MIST_LOOK_GLSL}
#endif
// leaf clumps as cells: x = dome height (1 at a cell's centre, 0 in the gaps), yz = vector to that centre
vec3 clumps(vec2 p){
  vec2 i = floor(p), f = fract(p); float best = 9.; vec2 bd = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = vec2(h21(i + g), h21(i + g + 17.3));
    vec2 d = g + .15 + .7 * o - f; float l = dot(d, d);
    if (l < best) { best = l; bd = d; }
  }
  return vec3(1. - min(best * 1.6, 1.), bd);
}
void main(){
  vec3 Vv = uCam - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
#ifdef SCRUB
  float lf = 1. - smoothstep(20., 130., dist), lf2 = 1. - smoothstep(5., 45., dist);
#else
  float lf = 1. - smoothstep(60., 400., dist), lf2 = 1. - smoothstep(16., 110., dist);
#endif
  vec3 N0 = normalize(vN + vec3(0., 1e-4, 0.)), q = vP * LS; float lift = 0.;
#ifndef TUFT
  N0 = normalize(mix(N0, vec3(0., 1., 0.), .8 * (1. - smoothstep(60., 230., dist))) + vec3(0., 1e-3, 0.));
#endif
#ifdef PLAIN
  vec3 N = N0; if (dot(N, V) < 0.) N = -N;
  vec3 alb = vC * (.8 + .4 * vn3(vP * 2.3));
#else
  // The cells are looked up through a warp, so no boundary between two leaf masses runs straight; within 45 m a
  // third octave draws the leaves themselves (sprays 0.4 m across: lit tops, dark gaps), which also frays the rim.
#ifdef SCRUB
  float lf3 = 0.;
#else
  float lf3 = 1. - smoothstep(9., 48., dist);
#endif
  vec2 wq = vec2(vn3(q * .42 + 3.), vn3(q * .42 + 23.)) - .5;
  vec2 wq2 = vec2(vn3(q * 1.37 + 11.), vn3(q * 1.37 + 41.)) - .5;                // and a finer one: the edge between two masses is a ragged line of leaves, never a straight crease
  vec2 cp = q.xz * .30 + vec2(q.y * .21, -q.y * .17) + wq * .6 + wq2 * .34;
  vec3 c1 = clumps(cp), c2 = clumps(cp * 2.9 + 3.1 + wq * .9), c3 = vec3(.6, 0., 0.);
  if (lf3 > 0.) c3 = clumps(cp * 8.7 + 7.7 + (vec2(vn3(q * 1.9 + 5.), vn3(q * 1.9 + 31.)) - .5) * .8);
  float ndv0 = abs(dot(N0, V));
#ifdef TUFT
  float rag = vn3(q * 1.1 + 7.) * .6 + vn3(q * 2.9) * .4;
  rag = mix(rag, rag * .6 + .55 * (1. - c3.x) + .25 * (1. - c2.x), .7 * lf3);
  if (ndv0 < rag * .66 * (.3 + .7 * lf)) discard;                            // ragged leafy silhouette
  if ((c2.x * .7 + c3.x * .5) * (.25 + ndv0) < .15 * lf3) discard;           // and close to, small holes between the sprays toward the rim
#endif
  float dome = mix(.6, c1.x, lf) * mix(1., .55 + .45 * c2.x, lf2) * mix(1., .5 + .62 * c3.x, lf3);
  vec3 N = normalize(N0 + vec3(-c1.y, 0., -c1.z) * (1.05 * lf) + vec3(-c2.y, 0., -c2.z) * (.7 * lf2) + vec3(-c3.y, 0., -c3.z) * (.75 * lf3)
    + (vec3(vn3(q * .33), vn3(q * .33 + 17.), vn3(q * .33 + 31.)) - .5) * .5
    + (vec3(vn3(q * 2.7 + 5.), vn3(q * 2.7 + 19.), vn3(q * 2.7 + 37.)) - .5) * (.9 * lf2) + vec3(0., 1e-4, 0.));
  float n = vn3(q * .2) * .5 + vn3(q * vec3(.55, .8, .55) + 5.) * .5;
  vec3 alb = vC * (.6 + .6 * n) * (.14 + .95 * dome) * (.88 + .3 * vn2(vP.xz * .03)) * TUFTK;
#ifndef TUFT
  {                                                                            // far off the forest floor is drawn as whole crowns 19 m across: moonlit tops, dark gaps
    float kc = smoothstep(120., 400., dist) * (1. - smoothstep(1100., 2200., dist));
    vec3 c0 = clumps(vP.xz * .052 + 3.3 + (vec2(vn2(vP.xz * .019), vn2(vP.xz * .019 + 9.)) - .5) * .9);
    alb *= mix(1., .42 + .95 * c0.x, kc);
    lift = (c0.x * 12. - 3.) * smoothstep(90., 260., dist);                    // and each of them stands that much out of the mist: pools between the crowns
    N = normalize(N + vec3(-c0.y, 0., -c0.z) * (1.5 * kc) + vec3(0., 1e-4, 0.));
  }
#endif
#endif
  float gust = .5 + .5 * sin(dot(vP.xz, vec2(.021, .013)) - uTime * .55); gust *= gust;
  alb *= 1. + .4 * gust * vn2(vP.xz * .06 + uTime * .12);                       // pale leaf backs as a gust band crosses
  float up = .5 + .5 * N.y, rim = .5 + .5 * dot(N, uGlowDir); rim *= rim;
  vec3 sky = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .35);
  float kd = max(dot(N, uGlowDir), 0.), lit = 1.;
  vec3 col = alb * (sky * (.2 + .8 * up * up) + uGlowCol * ((rim * rim * .9 + kd * sqrt(kd) * 1.3) * lit));
  float fr = 1. - abs(dot(N0, V)); fr *= fr;
  col += (alb * 1.4 + vC * .25) * uGlowCol * (fr * max(dot(N0, uGlowDir) + .2, 0.) * lit);    // warm edge on the glow side of each crown
  col = mix(vec3(dot(col, vec3(.3, .59, .11))), col, .74) * .86;
  float mz = smoothstep(30., 90., vP.z);                                        // the cave breathes the mist away from its mouth
#ifdef DEEP
  if (mz > 0.) {                                                                // the vapour between this point and the layer next above it
    float dH = length(vP.xz - uCam.xz), base = uSheetY + uAmp * mistH(vP.xz, mistK(dH)), lj = floor((vP.y - base) / uLayD);
    if (lj >= 0. && lj < 4.) {
      vec4 L = mistLayer(vP.xz, lj, dH);
      col = mix(col, L.rgb, L.a * mz * clamp((base + (lj + 1.) * uLayD - vP.y) / uLayD, 0., 1.));
    }
  }
#else
  if (mz > 0. && vP.y < uSheetY + uAmp * 2.3 + uSoft + 7.5) {
    float dM = length(vP.xz - uCam.xz), nb = 1. - smoothstep(25., 170., dM);
    float top; vec4 L = mistLook(vP.xz, dM, top);
    // near the lens a pool's edge is vapour: its level wanders by the metre, so it never follows a triangle of the floor
    top += ((vn2(vP.xz * .2 + uTime * .02) - .5) * 4. + (vn2(vP.xz * .63 - uTime * .03) - .5) * 1.8) * nb + (vn2(vP.xz * .07 + 9.) - .5) * 3.6 * (1. - nb);
#ifdef TUFT
    float sb = uSoft, op = uMistOp;                                             // crowns and trunks dissolve over a soft band
#else
    float sb = 2.5 + 3.2 * nb;                                                  // the canopy floor meets it along the heads, not along its own triangles
    // near the lens what lies well under the mist's top is one even shade under whole vapour: no cell of the floor shows through it
    float dk = smoothstep(.5, 6., top - vP.y - lift) * nb, op = mix(uMistOp, 1., dk);
    col = mix(col, uFogCol * 1.5, .85 * dk);
#endif
    float m = (1. - smoothstep(top - sb * .35, top + sb, vP.y + lift)) * op * mz * (.05 + .95 * L.a);
    col = mix(col, L.rgb * (.55 + .45 * lit), m);                                                   // sinking into the cloud sea over a soft band
  }
#endif
  float f = 1. - exp(-uFogK * uFogK * dist * dist);
  col = mix(mix(col, uFogCol, f), uHazeFar, .9 * (1. - exp(-max(dist - 250., 0.) * .0021)));      // far off the forest goes into pale haze before the hills
  gl_FragColor = vec4(col + uVeil * (1. - exp(-max(vP.z, 0.) * .014)), 1.);
}`;
// The haze that lies along the horizon in front of the far hills: a band round the lens, thickest at the level of
// the forest, nothing by 2 degrees up; it has no edge of its own.
const HAZE_VERT = /* glsl */`
varying float vT;
void main(){ vT = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const HAZE_FRAG = /* glsl */`
varying float vT; uniform vec3 uHazeFar; uniform float uOp;
void main(){ float a = 1. - smoothstep(0., 1., vT); gl_FragColor = vec4(uHazeFar, a * sqrt(max(a, 0.)) * uOp * smoothstep(0., .08, vT)); }`;

// Rare event: the fireflies of the whole forest in step. Each is a soft point that never shows an edge; the beat is
// one eased pulse every 1.9 s whose phase runs through the forest as a wave, so no two frames are a flash apart.
const FLY_VERT = /* glsl */`
attribute vec3 aP; attribute vec2 aR;
uniform float uTime, uPx, uFogK; uniform vec3 uCam;
varying vec2 vQ; varying float vB;
void main(){
  vec3 p = aP + vec3(sin(uTime * .7 + aR.x * 40.), sin(uTime * .9 + aR.x * 70.), cos(uTime * .6 + aR.x * 50.)) * .45;
  float dist = length(uCam - p);
  float ph = uTime * 3.3 - dot(aP.xz, vec2(.013, .021)) + (aR.y - .5) * .9;
  float b = max(sin(ph), 0.); b *= b; b *= b;
  float px = dist * uPx, sz = clamp(max(.5, px * 3.), .5, 3.4);                 // never under two pixels, never a big disc
  vec4 mv = viewMatrix * vec4(p, 1.); mv.xy += position.xy * sz;
  vQ = position.xy;
  vB = (.06 + .94 * b) * (.4 + .6 * aR.y) * smoothstep(4., 12., dist) * min(1., (.5 / sz) * (.5 / sz) * 4.) * exp(-uFogK * uFogK * dist * dist);
  gl_Position = projectionMatrix * mv;
}`;
const FLY_FRAG = /* glsl */`
varying vec2 vQ; varying float vB; uniform vec3 uFlyCol;
void main(){
  float d = dot(vQ, vQ), a = exp(-d * 6.) * (1. - smoothstep(.55, 1., d));
  gl_FragColor = vec4(uFlyCol * (vB * a), 1.);
}`;

// Limestone: grey karst with sharp vertical runnels (flutes) and dark cracks on steep faces, bedding lines,
// moss on ledges, cool sky light from above and an explicit warm key and rim from the glow side. Used for the
// ridge (flute coordinates from world x and z, blended by the face direction) and the blades (their own length).
const ROCK_VERT = /* glsl */`
attribute vec3 aCol;
#ifdef FIN
attribute vec2 aLH;
#endif
varying vec3 vC, vN, vP; varying vec4 vF;
void main(){
  vec3 p = position, n = normal;
#ifdef FIN
  vec4 wp = instanceMatrix * vec4(position, 1.); mat3 im = mat3(instanceMatrix);
  n = normalize(im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]))) + vec3(0., 1e-4, 0.));
  p = wp.xyz; vF = vec4(aLH.x + instanceMatrix[3].x * .37, 0., 1., 0.);
#else
  vF = vec4(p.x, p.z, abs(n.z) + .02, abs(n.x) + .02);
#endif
  vC = aCol; vN = n; vP = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const ROCK_FRAG = /* glsl */`
varying vec3 vC, vN, vP; varying vec4 vF;
uniform float uTime, uMistYR, uMistOpR, uFogK, uRimN; uniform vec3 uCam, uSkyCol, uGlowCol, uGlowDir, uMistCol, uFogCol, uMoss, uVeil;
${NOISE_GLSL}
float flute(vec2 p){ return abs(vn2(p) * 2. - 1.); }
// distance to the nearest cell wall: the cracks of a limestone pavement
float cellEdge(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = vec2(h21(i + g), h21(i + g + 17.3));
    vec2 d = g + .1 + .8 * o - f; float l = dot(d, d);
    if (l < d1) { d2 = d1; d1 = l; } else if (l < d2) d2 = l;
  }
  return sqrt(d2) - sqrt(d1);
}
void main(){
  vec3 Vv = uCam - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 Ng = N;
  float steep = 1. - smoothstep(.45, .82, N.y), nk = 1. - smoothstep(70., 380., dist), nk2 = 1. - smoothstep(12., 80., dist);
  // every pattern is dropped before it gets thinner than about 3 px: 2 m runnels by 400 m, 1 m flutes by 80 m
  float nkB = 1. - smoothstep(110., 400., dist), nkC = 1. - smoothstep(22., 80., dist);
  float y = vP.y, ws = vF.z + vF.w, flat1 = 1. - steep, fw = 0.;
#ifndef FIN
  fw = 1.7 * vn2(vec2((vF.x * vF.z + vF.y * vF.w) / ws * .045, y * .06));                                // on the bedded face the runnels wander and lean: none stands plumb
#endif
  float flx = flute(vec2(vF.x * .5 + fw, y * .03)), flz = flute(vec2(vF.y * .5 + 7. + fw, y * .03));               // 2 m runnels
  float fbx = flute(vec2(vF.x * 1.1 + 3. + fw * 2., y * .07)), fbz = flute(vec2(vF.y * 1.1 + 11. + fw * 2., y * .07));       // 1 m flutes, close up only
  float fl = mix(.5, (flx * vF.z + flz * vF.w) / ws, nkB), fb = mix(.5, (fbx * vF.z + fbz * vF.w) / ws, nkC);
  float bed = 0., ledge = 0., fa = .57, joint = 0., crackM = 0., pit = 0., course = 1.;
#ifdef FIN
  float crack = (1. - smoothstep(0., .3, fl)) * steep, crackB = (1. - smoothstep(0., .3, fb)) * steep * nk;
#ifdef BLOCK
  crack *= .2; crackB *= .5;
#endif
#else
  // bedded face: the ledges are in the mesh (beds 7 to 24 m thick that dip, roll and wander with the same three
  // sines, each ledge dying out into plain face for stretches); here each gets a dark undercut below its lip, broken
  // along its length, and a mossy top. Down the face run broad flutes 9 m across, which carry at any distance, with
  // runnels and small flutes inside them close up, in broken stretches; their flanks turn to and from the glow.
  float nk3 = 1. - smoothstep(250., 800., dist);
  float hc = (vF.x * vF.z + vF.y * vF.w) / ws;
  float dip = 2.2 * sin(vP.x * .013 + vP.z * .007) + 1.2 * sin(vP.x * .041 - vP.z * .02 + 1.7) + .9 * sin(vP.x * .097 + vP.z * .043 + .4);
  float wv = y + dip + 2.6 * sin((y + dip) * .21 + .7), bq = wv / 11., bf = fract(bq), bi = floor(bq);
  bed = smoothstep(.77 + .08 * vn2(vec2(hc * .06, bi * 1.9)), .87, bf) * steep * nk3 * smoothstep(.38, .6, vn2(vec2(hc * .03 + bi * 7.3, bi * 3.1))) * (.4 + .6 * smoothstep(.3, .6, vn2(vec2(hc * .11 + bi * 3.7, bi * 5.3))));   // deep here, gone there
  ledge = (1. - smoothstep(.1, .3, bf)) * smoothstep(40., 52., y);
  // the middle range, 40 to 300 m: every bed is four courses parted by thin dark joints, the courses cut into blocks
  // by upright cracks that are staggered from course to course, the blocks pitted. Joints and cracks keep a width
  // of about 3 px, so they neither vanish nor shimmer; all of it is gone by 420 m.
  float nkM = (1. - smoothstep(240., 420., dist)) * steep, hw = max(.07, dist * .0022), farM = 1. - .5 * smoothstep(110., 300., dist);
  float cy = wv / 3.1 + 1.3 * vn2(vec2(hc * .028, y * .05)), cf = fract(cy), crs = floor(cy), cj = min(cf, 1. - cf) * 3.1, crs2 = floor(cy * .5 + .25);
  float jr = crs + step(.5, cf);
  joint = (1. - smoothstep(hw * .6, hw * 1.4, cj)) * nkM * farM * smoothstep(.5, .62, vn2(vec2(hc * .05 + jr * 5.1, jr * 1.3)));      // short lengths of joint, most of each course without one
  float ce = cellEdge(vec2(hc * .075 + h21(vec2(crs2, 9.1)) * 7., crs2 * 1.7)) / .15;       // a crack every 13 m or so, as wide as 3 px
  crackM = (1. - smoothstep(hw * 1.3, hw * 2.6, ce)) * nkM * (1. - .5 * bed) * smoothstep(.35, .6, vn2(vec2(hc * .04 + 7., wv * .05)));
  float seg = smoothstep(.44, .62, vn2(vec2(hc * .07 + 3., wv * .09)));                                     // runnels come in patches a bed or two tall, the face between them massive
  float stainV = smoothstep(.5, .8, vn2(vec2(hc * .06 + 2., wv * .008)));                                  // long seeps
  pit = smoothstep(.5, .78, vn3(vP * vec3(.6, .9, .6) + 3.)) * nkM * (1. - smoothstep(90., 260., dist) * .6);
  course = mix(1., .84 + .3 * h21(vec2(crs, 5.3)) * (.5 + .5 * vn2(vec2(hc * .12, crs))), nkM);
  float run = smoothstep(.34, .6, vn2(vec2(hc * .028 + 9., y * .035)));                                    // fluted stretches and massive ones
  float crack = (1. - smoothstep(0., .16 + dist * .004, fl)) * steep * (.25 + .75 * run) * mix(1., .45, smoothstep(30., 160., dist)) * seg;
  float crackB = (1. - smoothstep(0., .2, fb)) * steep * (.4 + .6 * run) * .7 * (.3 + .7 * seg);
  float fax = flute(vec2(vF.x * .11 + 1., y * .01)), faz = flute(vec2(vF.y * .11 + 5., y * .01));
  fa = (fax * vF.z + faz * vF.w) / ws;
  float dx0 = flute(vec2((vF.x + 1.5) * .11 + 1., y * .01)) - fax, dz0 = flute(vec2((vF.y + 1.5) * .11 + 5., y * .01)) - faz;
  float dx1 = (flute(vec2((vF.x + .5) * .5 + fw, y * .03)) - flx) * nkB * (.3 + .7 * seg), dz1 = (flute(vec2((vF.y + .5) * .5 + 7. + fw, y * .03)) - flz) * nkB * (.3 + .7 * seg);
  float dx2 = (flute(vec2((vF.x + .25) * 1.1 + 3. + fw * 2., y * .07)) - fbx) * nkC, dz2 = (flute(vec2((vF.y + .25) * 1.1 + 11. + fw * 2., y * .07)) - fbz) * nkC;
  vec3 G = vec3((dx0 * 3. + dx1 * 2. + dx2 * 2.) * vF.z, 0., (dz0 * 3. + dz1 * 2. + dz2 * 2.) * vF.w) / ws;   // slope of the flutes along the face
  N = normalize(N - (G - N * dot(G, N)) * (1.5 * steep) + vec3(0., -bed * .7 - joint * .45, 0.) + vec3(0., 1e-4, 0.));
#endif
  float grike = max(1. - smoothstep(0., .07, cellEdge(vP.xz * .16)), (1. - smoothstep(0., .09, cellEdge(vP.xz * .47 + 5.))) * nk2 * .8) * flat1 * nk;   // cracks of the pavement on top
  float grain = vn3(vP * 1.3) * .5 + vn3(vP * 4.7) * .5, blotch = vn3(vP * .12);
  vec3 alb = vC * (.62 + .5 * fl * steep + .3 * flat1) * (.8 + .35 * fa * steep + .2 * flat1) * (.8 + .4 * blotch) * (1. + .4 * (grain - .5) * nk2);
#ifdef FIN
  alb *= (1. - .6 * crack) * (1. - .45 * crackB) * (1. - .7 * grike);
#else
  alb *= (1. - .85 * crack) * (1. - .5 * crackB) * (1. - .66 * bed) * (1. + .2 * ledge) * (1. - .7 * grike) * (1. - .36 * joint) * (1. - .16 * crackM) * (1. - .3 * pit) * course * (1. - .28 * stainV * steep);
#endif
  float moss = flat1 * smoothstep(.52, .72, vn2(vP.xz * .06 + 3.) * .7 + vn2(vP.xz * .31) * .3) * .9 + ledge * flat1 * .55 * smoothstep(.3, .6, vn2(vP.xz * .11 + y * .05));
  alb = mix(alb, uMoss * (.5 + .9 * vn2(vP.xz * .7) * (.6 + .8 * grain)), clamp(moss, 0., .9));
  float up = .5 + .5 * N.y, key = max(dot(N, uGlowDir), 0.), wr = .5 + .5 * dot(N, uGlowDir);
  float rib = mix(1., .35 + 1.5 * fb * (.4 + .6 * fl), steep);
  vec3 sky = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .4);
  vec3 col = alb * (sky * (.3 + .7 * up) * mix(.8, 1.15, steep) * mix(1., .6 + .6 * fb, steep) + mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3333))), .3) * (key * sqrt(key) * .8 + wr * wr * .1) * rib);
  float fr = 1. - max(dot(mix(Ng, N, .4), V), 0.); fr *= fr * fr;
  col += alb * uGlowCol * (fr * wr * wr * uRimN);                               // the moon's silver on every edge turned toward it
  float mn = vn2(vP.xz * .011 + vec2(uTime * .012, uTime * .008));
  float m = 1. - smoothstep(uMistYR - 4. + 8. * mn, uMistYR + 12. + 8. * mn, vP.y);
  col = mix(col, uMistCol * (.5 + .16 * mn), m * uMistOpR);                      // the foot of the ridge stands in mist
  float f = 1. - exp(-uFogK * uFogK * dist * dist);
  float mcap = dot(uMistCol, vec3(.3, .59, .11)) * .92, mkn = .55 * mcap, mlum = max(dot(col, vec3(.3, .59, .11)), mkn);
  col *= clamp((mkn + (mcap - mkn) * (1. - exp(-(mlum - mkn) / max(mcap - mkn, 1e-4)))) / max(mlum, 1e-4), 0., 1.);
  gl_FragColor = vec4(mix(col, uFogCol, f) + uVeil * (1. - exp(-max(vP.z, 0.) * .014)), 1.);
}`;

// Tower karst: one shader for the towers that stand in the forest. Nothing on them is drawn as a line. The face
// carries relief (runnels that fall down it; where it is massive, courses of blocks of unequal height, some
// standing proud, some fallen out, with pits), and only the slope of that relief, which bends the normal, and its
// hollows, which are shaded, show it: so close to it is broken rock in raking light and far off it is a plain dark
// mass. A face turned from the moon gets little sky: it stands dark against the mist with a silver rim on the
// moon's side; the mist below gives its underfaces a little light back. aTw = (metres round the tower, the
// tower's own phase, how deep in a cleft or under an overhang).
const TOWER_VERT = /* glsl */`
attribute vec3 aCol, aTw; attribute vec2 aRd; varying vec3 vC, vN, vP, vT; varying vec2 vR;
void main(){ vC = aCol; vN = normal; vP = position; vT = aTw; vR = aRd; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const TOWER_FRAG = /* glsl */`
varying vec3 vC, vN, vP, vT; varying vec2 vR;
uniform float uTime, uMistYR, uMistOpR, uFogK, uRimN; uniform vec3 uCam, uSkyCol, uGlowCol, uGlowDir, uMistCol, uFogCol, uMoss, uVeil;
${NOISE_GLSL}
float tri(float x){ return abs(fract(x) * 2. - 1.); }
// the face at q (metres along it, metres up it): x = how far it stands out, in metres; y = how open it is to the sky
// (1 on a rib or a proud block, less in a runnel, a joint, a pit or a hole where a block fell out)
vec2 relief(vec2 q, float ph, float k1, float k2){
  float run = smoothstep(.3, .62, vn2(vec2(q.x * .021 + ph, q.y * .016)));                 // fluted stretches and massive ones
  float f1 = tri(q.x * .29 + ph * 3. + (vn2(vec2(q.x * .06, q.y * .022 + ph)) - .5) * 1.5); f1 = f1 * f1 * (3. - 2. * f1);      // runnels 3.4 m apart
  float f2 = tri(q.x * .83 + ph * 5. + (vn2(vec2(q.x * .15, q.y * .05 + ph)) - .5) * 1.2);                                        // and 1.2 m apart, close to
  float cy = q.y * .16 + ph + (vn2(vec2(q.x * .03, q.y * .05)) - .5) * .9, row = floor(cy);
  float cx = q.x * .2 + h21(vec2(row, ph)) * 7., col = floor(cx);
  vec2 f = vec2(fract(cx), fract(cy));
  float hb = h21(vec2(col, row) + ph), proud = (hb - .45) * 1.5;                          // -0.7 (fallen out) .. 0.8 (standing proud)
  float e = min(min(f.x, 1. - f.x) * 5., min(f.y, 1. - f.y) * 6.2), bev = smoothstep(0., .9, e);
  float mass = 1. - .75 * run;
  float pit = smoothstep(.62, .82, vn2(q * vec2(.21, .15) + ph * 9.));
  float h = (f1 * .9 * run + proud * bev * mass - pit * .7) * k1 + (f2 * .28 * (.4 + .6 * run) + (vn2(q * .9 + ph) - .5) * .5) * k2;
  float opn = mix(1., (.55 + .45 * f1), run * k1) * mix(1., (.62 + .38 * bev) * (1. + .3 * proud), mass * k1) * (1. - .5 * pit * k1) * mix(1., .75 + .25 * f2, k2);
  return vec2(h, opn);
}
void main(){
  vec3 Vv = uCam - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  vec3 Ng = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(Ng, V) < 0.) Ng = -Ng;
  float steep = 1. - smoothstep(.5, .86, Ng.y), flat1 = 1. - steep;
  float k1 = (1. - smoothstep(170., 520., dist)) * steep, k2 = (1. - smoothstep(30., 110., dist)) * steep;
  vec2 q = vec2(vT.x, vP.y); float ph = vT.y, ao = vT.z;
  float e1 = max(.4, dist * .0045);                                                          // never finer than about two pixels
  vec2 r0 = relief(q, ph, k1, k2), rs = relief(q + vec2(e1, 0.), ph, k1, k2), ry = relief(q + vec2(0., e1), ph, k1, k2);
  vec3 Th = normalize(cross(vec3(0., 1., 0.), Ng) + vec3(1e-4, 0., 0.)), Tv = cross(Ng, Th);    // Th runs against the metres round the tower
  vec3 N = normalize(Ng + (Th * (rs.x - r0.x) - Tv * (ry.x - r0.x)) * (1.15 / e1) + vec3(0., 1e-4, 0.));
  float stain = vn2(vec2(q.x * .13 + ph * 2., q.y * .012)), stain2 = vn2(vec2(q.x * .45, q.y * .03 + ph));
  float grain = vn3(vP * 1.3) * .5 + vn3(vP * 4.7) * .5;
  vec3 alb = vC * (.6 + .6 * stain) * (.84 + .3 * stain2 * k1) * (1. + .35 * (grain - .5) * k2);
  alb = mix(alb, alb * vec3(.48, .55, .55), smoothstep(.55, .8, vn2(vec2(q.x * .05 + 9., q.y * .009 + ph))) * .7 * steep);      // long dark stains where water runs down
  float moss = flat1 * smoothstep(.3, .6, vn2(vP.xz * .09 + 3.) * .6 + vn2(vP.xz * .31) * .4 + .25) + steep * ao * .35 * smoothstep(.4, .7, vn2(vec2(q.x * .2, q.y * .1)));
  alb = mix(alb, uMoss * (.5 + .9 * vn2(vP.xz * .7) * (.6 + .8 * grain)), clamp(moss, 0., .9));
  float opn = r0.y * (1. - .55 * ao);
  // Night light on limestone: the sky's blue from above, brighter from the moon's half of it, so the ribs between
  // runnels and the faces of proud blocks stand out of their own shade; the pale mist's light from below under the
  // lips; the moon itself only on faces turned to it. The silver rim follows the tower's own round (vR), not the
  // relief, so it draws the edge of the mass and not every runnel.
  vec3 Lh = normalize(vec3(uGlowDir.x, 0., uGlowDir.z) + vec3(1e-4, 0., 0.));
  float up = .5 + .5 * N.y, side = .5 + .5 * dot(N, Lh), key = max(dot(normalize(mix(Ng, N, .45)), uGlowDir), 0.);
  vec3 sky = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .4);
  vec3 col = alb * (sky * ((.26 + .5 * up) * (.55 + .9 * side * side) * opn)
    + uMistCol * ((.2 + .5 * max(.3 - N.y, 0.)) * (1. - smoothstep(60., 150., vP.y)) * opn)
    + mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3333))), .3) * (key * .55 * (.45 + .55 * opn)));
  vec3 Nr = normalize(mix(Ng, vec3(vR.x, 0., vR.y), steep) + vec3(0., 1e-4, 0.));
  float fr = 1. - max(dot(Nr, V), 0.); fr *= fr; fr *= fr;
  col += alb * uGlowCol * (fr * smoothstep(-.25, .55, dot(Nr, Lh)) * (.5 + .5 * opn) * uRimN * .5);
  float mn = vn2(vP.xz * .011 + vec2(uTime * .012, uTime * .008));
  float m = 1. - smoothstep(uMistYR - 4. + 8. * mn, uMistYR + 12. + 8. * mn, vP.y);
  col = mix(col, uMistCol * (.5 + .16 * mn), m * uMistOpR);                      // the foot stands in mist
  float f = 1. - exp(-uFogK * uFogK * dist * dist);
  float mcap = dot(uMistCol, vec3(.3, .59, .11)) * .92, mkn = .55 * mcap, mlum = max(dot(col, vec3(.3, .59, .11)), mkn);
  col *= clamp((mkn + (mcap - mkn) * (1. - exp(-(mlum - mkn) / max(mcap - mkn, 1e-4)))) / max(mlum, 1e-4), 0., 1.);
  gl_FragColor = vec4(mix(col, uFogCol, f) + uVeil * (1. - exp(-max(vP.z, 0.) * .014)), 1.);
}`;

// The swiftlet string: each bird a quad carrying a projected planform, as the far bats do, but a swift's: two
// tapered crescent wings swept back to points, a cigar of a body and a short forked tail, dark, with a pale rim of
// moonlight along its upper edge. Wings stiff: bursts of shallow flicker, then a glide on bowed wings; each bird
// banks from side to side. Positions come from the world each frame.
const SWIFT_VERT = /* glsl */`
attribute vec3 aP, aF; attribute vec4 aSeed;
uniform float uPx;
varying vec2 vQ, vWs; varying vec3 vS, vPw; varying float vA;
${CAVE_GLSL}
void main(){
  vec3 F = normalize(aF + vec3(0., 0., 1e-4));
  vec3 toC = uCam - aP; float dist = length(toC); vec3 Vd = toC / max(dist, 1e-3);
  vec3 R0 = normalize(cross(vec3(0., 1., 0.), F) + vec3(1e-4, 0., 0.)), U0 = cross(F, R0);
  float roll = .9 * sin(uTime * 1.6 + aSeed.x * 40.) + .45 * sin(uTime * 3.7 + aSeed.w * 90.);
  vec3 Rb = R0 * cos(roll) + U0 * sin(roll), Ub = cross(F, Rb);
  vec3 A2 = normalize(cross(Vd, Rb) + vec3(0., 1e-3, 0.)); if (dot(A2, Ub) < 0.) A2 = -A2;
  float k = clamp(dist * uPx * 4.2, 1., 3.8), hs = .62 * abs(aSeed.y) * k;
  vec3 lp = aP + (Rb * position.x + A2 * position.y) * hs;
  float gl = smoothstep(.1, .6, sin(uTime * 2.3 + aSeed.z * 30.));
  float fl = sin(uTime * 75. * (.9 + .2 * aSeed.w) + aSeed.w * 62.8) * (1. - gl);
  vWs = vec2(.12 + .42 * fl, -.3 + .22 * fl);                                    // slope of the arm, slope of the hand: tips bowed down
  vQ = position.xy; vPw = lp;
  vS = vec3(dot(Ub, A2), dot(F, A2), clamp(1.5 * dist * uPx / hs, .03, .3));
  vA = smoothstep(1.2, 2.6, dist) * step(.5, aSeed.y) / pow(k, .4);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.);
}`;
const SWIFT_FRAG = /* glsl */`
varying vec2 vQ, vWs; varying vec3 vS, vPw; varying float vA; uniform vec3 uSwRim, uAmbCol;
${CAVE_GLSL}
// q: x along the span (-1..1), y across it; W: slopes of arm and hand; S: (bird up . quad up, heading . quad up,
// least half thickness). Returns (cover, rim along the upper edge).
vec2 swift(vec2 q, vec2 W, vec3 S){
  float ax = abs(q.x), x1 = min(ax, .28), x2 = max(ax - .28, 0.);
  float fh = W.x * x1 + W.y * x2 * (1. + .7 * x2);                               // the wing line seen from behind: a scythe
  float sweep = .1 - .62 * ax * ax;                                              // and from above: tips swept back
  float hc = .17 * pow(max(1. - ax, 0.), .75) * (1. + .5 * exp(-ax * 9.));       // half chord, down to a point at the tip
  float sy = abs(S.y), yc = S.x * fh + S.y * sweep;
  float th = max(sy * hc, S.z * (.3 + .7 * (1. - ax))) * (1. - smoothstep(.86, 1., ax)), e = S.z * .7 + .012;
  float d = abs(q.y - yc);
  float wing = 1. - smoothstep(th - e, th + e, d);
  vec2 bq = vec2(q.x, q.y - S.y * .03) / vec2(.06 + S.z * .5, max(.3 * sy, .07) + S.z * .5);
  float body = 1. - smoothstep(.6, 1., dot(bq, bq));
  float yh = q.y * sign(S.y + 1e-4), tq = (-yh - .2 * sy) / max(.26 * sy, 1e-3);    // 0 at the rump, 1 at the tail's tips
  float tw = .022 + .05 * clamp(tq, 0., 1.);
  float tail = step(0., tq) * step(tq, 1.) * (1. - smoothstep(tw - e * .6, tw + e * .6, ax)) * smoothstep(-.2, .5, ax / tw - (tq - .45)) * step(.25, sy);
  float rim = wing * smoothstep(-.2, .9, (q.y - yc) / max(th, 1e-3)) * (1. - body);
  return vec2(max(max(wing, body), tail), rim);
}
void main(){
  vec2 sw = swift(vQ, vWs, vS);
  float a = sw.x * vA;
  if (a < .02) discard;
  float dS = length(vPw - uCam), nearS = 1. - smoothstep(12., 55., dS);                 // far off a bird is a dark scythe on the keyhole; close to, it is a grey-brown bird in the cave's light
  vec3 col = vec3(.006, .006, .01) + vec3(.05, .047, .047) * (uBounce * 1.5 + uAmbCol) * nearS + uSwRim * (sw.y * (.3 - .08 * nearS));
  col += uBeamCol * (beamIn(vPw) * (.05 + .5 * sw.y));                           // and they flash as they cross the shaft
  gl_FragColor = vec4(caveFog(col, mix(uCam, vPw, .45)), a);            // less of the cave's haze than their distance asks, so the string holds its dark on the keyhole
}`;

// The humid air in the mouth, seen from down the passage: moonlit vapour standing in the opening. One upright
// sheet 10 m outside the mouth plane and far wider than the mouth, so its only outline is the rock's own; what it
// adds is the airlight of the whole view ray past the lamp (the same closed form as caveFog, the ray taken to its
// end), fanned by slow rays, nothing at the level of the sill. It adds light and writes no depth.
const AIR_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const AIR_FRAG = /* glsl */`
varying vec3 vP; uniform vec3 uAirCol; uniform float uAirK;
${CAVE_GLSL}
void main(){
  vec3 d = vP - uCam; float dist = length(d); vec3 v = d / max(dist, 1e-3);
  vec3 oL = uCam - uLampPos; float dl = length(oL); vec3 toM = -oL / max(dl, 1e-3);
  float b = dot(oL, v), H = sqrt(max(dot(oL, oL) - b * b, 0.) + 4900.);
  float air = (1.5708 - atan(b / H)) * 70. / (3.1416 * H);
  vec3 e1 = normalize(cross(toM, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), e2 = cross(e1, toM);
  vec2 sp = vec2(dot(v, e1), dot(v, e2)); sp /= max(length(sp), 1e-3);
  float rays = nC(sp * 3.5 + uTime * .05) * .6 + nC(sp * 8. - uTime * .07 + 5.) * .4;
  float g = uAirK * (.16 + .84 * air * air * (.7 + .6 * rays)) * smoothstep(8., 46., vP.y);
  gl_FragColor = vec4(uAirCol * g, 1.);
}`;

// Thunderhead weather: a rain curtain under the far cloud and a soft sheet flash inside it.
const STORM_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const STORM_FRAG = /* glsl */`
varying vec2 vUv; uniform float uTime, uFlash, uMode; uniform vec3 uCol;
${NOISE_GLSL}
void main(){
  vec2 c = vUv * 2. - 1.;
  if (uMode < .5) {                                  // rain curtain: slanted streaks, dense at the top
    float s = vn2(vec2(vUv.x * 46. + vUv.y * 5., vUv.y * 2.5 + uTime * .35)) * .6 + vn2(vec2(vUv.x * 9., vUv.y + uTime * .1)) * .4;
    float a = smoothstep(.25, .8, s) * (1. - c.x * c.x) * smoothstep(0., .25, vUv.y) * (.35 + .65 * vUv.y);
    gl_FragColor = vec4(uCol, a * .55);
  } else {                                           // sheet lightning: a glow inside the cloud
    float r = dot(c, c), g = max(1. - r, 0.); g *= g;
    float n = .6 + .4 * vn2(vUv * 5. + 3.);
    gl_FragColor = vec4(uCol * (uFlash * g * n), 1.);
  }
}`;

// eased sheet lightning: at most one flash every ~2.6 s, 0.12 s rise, slow decay
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function flashAt(t) {
  const P = 3.4, n = Math.floor(t / P), x = t - (n * P + hash1(n) * 0.8);
  if (x < 0 || hash1(n + 77.7) < 0.25) return 0;
  return x < 0.12 ? x / 0.12 : Math.exp(-(x - 0.12) / 0.4);
}

// small indexed-geometry accumulator (position + aCol)
function acc() {
  const pos = [], col = [], idx = [];
  return {
    pos, col, idx,
    v(x, y, z, c, k = 1) { pos.push(x, y, z); col.push(c.r * k, c.g * k, c.b * k); return pos.length / 3 - 1; },
    quad(a, b, c, d) { idx.push(a, b, c, b, d, c); },
    grid(i0, nu, nv) { for (let u = 0; u < nu - 1; u++) for (let v = 0; v < nv - 1; v++) { const a = i0 + u * nv + v; idx.push(a, a + nv, a + 1, a + 1, a + nv, a + nv + 1); } },
    gridUp(i0, nu, nv) { for (let u = 0; u < nu - 1; u++) for (let v = 0; v < nv - 1; v++) { const a = i0 + u * nv + v; idx.push(a, a + 1, a + nv, a + 1, a + nv + 1, a + nv); } },
    // typed arrays and area-weighted normals summed in place: several times faster than computeVertexNormals,
    // which walks the attributes through accessors, so a big mesh is one short build step
    build() {
      const g = new THREE.BufferGeometry(), Pa = new Float32Array(pos), n = Pa.length, Na = new Float32Array(n), Ia = n / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
      for (let i = 0; i < Ia.length; i += 3) {
        const a = Ia[i] * 3, b = Ia[i + 1] * 3, c = Ia[i + 2] * 3;
        const ux = Pa[c] - Pa[b], uy = Pa[c + 1] - Pa[b + 1], uz = Pa[c + 2] - Pa[b + 2], vx = Pa[a] - Pa[b], vy = Pa[a + 1] - Pa[b + 1], vz = Pa[a + 2] - Pa[b + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        Na[a] += nx; Na[a + 1] += ny; Na[a + 2] += nz; Na[b] += nx; Na[b + 1] += ny; Na[b + 2] += nz; Na[c] += nx; Na[c + 1] += ny; Na[c + 2] += nz;
      }
      for (let i = 0; i < n; i += 3) { const l = Math.hypot(Na[i], Na[i + 1], Na[i + 2]) || 1; Na[i] /= l; Na[i + 1] /= l; Na[i + 2] /= l; }
      g.setAttribute('position', new THREE.BufferAttribute(Pa, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(Na, 3)); g.setIndex(new THREE.BufferAttribute(Ia, 1)); return g;
    },
  };
}

export default {
  id: 'deer-cave-exodus',
  name: 'Three Million Wings',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const xr = makeRng(hashSeed('deer-cave-extra:' + ctx.seed));          // a second stream for later additions, so the first keeps its layout
    const xr8 = makeRng(hashSeed('deer-cave-r8:' + ctx.seed));            // and a third (a fork draws from its parent, so new forks of xr would move the towers)
    const xr9 = makeRng(hashSeed('deer-cave-r9:' + ctx.seed));            // and a fourth, for what round nine adds
    const xr10 = makeRng(hashSeed('deer-cave-r10:' + ctx.seed));          // and a fifth: where the sill's mounds, the giants of the run and the steam plumes stand
    // ---- the look of this visit (drawn first, from its own stream) ----
    const lk = rng.fork('look'), hourPick = lk(), weatherPick = lk(), formPick = lk(), castPick = lk();
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    void hourPick; void formPick;                                         // one hour (the moonlit night) and one form (the rope): the draws stay, so the layout keeps its seeds
    const weather = weatherPick < 0.5 ? 'clear' : weatherPick < 0.78 ? 'mist' : 'thunder', deep = weather === 'mist';
    const H = { ...NIGHT, ...WEATHER[weather] };

    const scene = new THREE.Scene();
    const fogCol = C(H.fog), mistCol = C(H.mist).multiplyScalar(H.mistI);
    if (deep) fogCol.lerp(mistCol, 0.35);
    scene.fog = new THREE.FogExp2(fogCol, H.fogK * (deep ? 1.25 : 1));
    scene.background = fogCol.clone().multiplyScalar(0.5);

    // ---- sky and light: a big low moon on the left, its wash along the horizon under it, thin cirrus, stars ----
    const mAz = H.moonAz + lk.range(-2, 2) * 0.5, mEl = H.moonEl + lk.range(-1, 1) * 0.6;
    await ctx.yield();
    const sky = makeSky({ rng, renderer: ctx.renderer, preset: 'night', bake: true, clouds: false, stars: 0.8, starDensity: 0.5, twinkle: 0.6, zenith: H.zenith, mid: H.mid, horizon: H.horizon, horizonPow: 3,
      sunElevation: -2, sunAzimuth: 180 - mAz, sunIntensity: 0, sunGlow: 0, scatterColor: H.wash, scatter: H.washK, scatterPow: 7, scatterHigh: 0.05, scatterFall: 2.6,
      bodyOverrides: { 0: { elevation: mEl, azimuth: 180 - mAz, size: H.moonSize, color: H.moonCol, phase: 0.97, intensity: H.moonI, glow: 0.5, glowSize: 4.5, glowColor: H.moonGlow } },
      clouds2: { coverage: 0.3, stretch: 1, opacity: 0.42, scale: 0.8, lit: H.cirrusLit, shade: H.cirrusShade, wind: [0.006, 0.002] },
      lightIntensity: 1.6, ambientIntensity: 2.2, lightElevationMin: 12 });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.3 }); scene.add(rig.object);
    await ctx.yield();

    // ---- the flight outside is laid out on the moon's bearing. The camera leaves the mouth, turns left and flies
    // straight at the moon for 165 m (the run), so whatever lies across that line stays on the moon's face and grows.
    // The rope leaves the mouth to the right, swings back and crosses the run 235 m along it as a river flowing to
    // the left, 20 to 30 m above the lens's line, then climbs away to the left; far off it turns and comes back
    // across the moon as a thin band, which is how the flight's last third sees it. The camera ducks under the
    // river where it crosses, turns right between two towers and climbs to the ring. ----
    const keyDir = sky.bodyDirections[0].clone().normalize();              // toward the moon: the key light outside, and on the cave wall it reaches
    const azR = Math.atan2(keyDir.x, keyDir.z), elD = Math.asin(clamp(keyDir.y, -1, 1)) / DEG, tnD = (d) => Math.tan(d * DEG), TR = 110, tC = 235;
    const mhx = Math.sin(azR), mhz = Math.cos(azR);                       // toward the moon, in plan
    const P1 = [TR * (1 - mhz), TR * mhx], onRun = (t, sd = 0) => [P1[0] + mhx * t - mhz * sd, P1[1] + mhz * t + mhx * sd];      // the run: t metres along it, sd metres to its right
    const yr = 120 + (elD - 12) * 1.6, C0 = onRun(tC);                    // the river's height where it crosses, and where
    const hx0 = mhz + 0.75 * mhx, hz0 = -mhx + 0.75 * mhz, hl0 = Math.hypot(hx0, hz0), hx = hx0 / hl0, hz = hz0 / hl0;                 // the river's heading there: across the run, to the left
    const rp = (a, b, y) => [C0[0] + hx * a + mhx * b, y, C0[1] + hz * a + mhz * b];
    // The return leg: far out to the left the rope turns and comes back over the ridge. Seen from the last third of
    // the flight (from Cq, where the climb to the notch begins) it comes out of the moon, 450 m off, crosses the
    // final heading 40 m beyond the ring and 62 m above it, flowing to the right, and leaves over the right shoulder.
    // The far side of the loop between the two is never drawn (hero.setLeg).
    const seatV = [181, 92, 632], sYaw = 5 * DEG, Cq = [170, 70, 470];
    const bq = (off, d, elv) => [Cq[0] + d * Math.sin(azR + off * DEG), Cq[1] + d * tnD(elv), Cq[2] + d * Math.cos(azR + off * DEG)];
    const legX = [seatV[0] + Math.sin(sYaw) * 40, seatV[1] + 62, seatV[2] + Math.cos(sYaw) * 40];
    const ropeLine = [[2, 74, -330], [2, 79, -270], [1, 89, -130], [0, 100, 0], [-6, 106, 60], [0, 113, 130], [24, yr - 3, 190],
      rp(-78, -8, yr - 1.5), rp(0, 0, yr), rp(62, 6, yr + 7), rp(125, 12, yr + 20), rp(190, 20, yr + 38),
      [560, 180, 290], [780, 200, 262], [1000, 222, 340], [1120, 236, 540], [1080, 236, 760], [900, 215, 880], bq(15, 620, elD - 2), bq(0, 450, elD),
      legX, [60, 160, 600], [-70, 162, 520], [-220, 172, 470], [-380, 190, 520], [-520, 215, 660]];
    // The rope at full thickness, 28 m. Its far bats are kept in 800 m of rope round the lens (beyond that it is the
    // smoke body), so the river is 40 bats to the metre where it passes close; outside, the smoke body only comes in
    // past 110 m, so the river on the moon is separate bats with the moon between them.
    // It is a corkscrew, 44 m across with a turn every 170 m: on the first pass from 100 m beyond the mouth on (33 m
    // tall there; 26 m downstream of where the river crosses the run it passes level with its own axis on the far
    // side, so over the run's line it stands as high as the plain line did and on the moon's bearing; upstream it
    // arches up, highest over the place where the lens ducks under, and downstream it dips); on the leg that comes
    // back, from the moon to the notch (24 m tall). The rope's own thickness stays under the coil's width all the
    // way (flare 0.35: 36 m at its widest, far out on the leg), so the coil reads as a rope that turns, not as a
    // thick body with lumps.
    const hero = await buildHero(ctx, { palette: PAL, hour: H.hero, density, form: 'rope', hawks: 0, mistFloor: false, lipDark: 0.85, coil: 22, coilV: 0.55, pitch: 170, thickness: 28,
      coilNear: { r: 22, v: 0.75, z: [100, 200], node: rp(26, 0, yr + 3), end: [1000, 222, 340] },
      lensClear: 3, line: ropeLine, seat: seatV, seatYaw: 5, coilStart: [430, 720], coilEnd: [1300, 1470], flare: 0.35, ramp: 80, tail: 300, window: 150, mid: 3200, maxMid: 3400,
      far: 28500, maxFar: 30000, farWindow: 800, farLead: 260, farScale: [2.6, 4, 0.2], midScale: [1.7, 2.8], tubeNear: 1 });
    scene.add(hero.object);
    await ctx.yield();
    // the return leg: sX is the station over the notch, sA and sB the ends of the far side of the loop, which is never drawn
    const sX = hero.stationNear(V3(legX[0], legX[1], legX[2])) * hero.length, sA = hero.stationNear(V3(780, 200, 262)) * hero.length + 60, sB = hero.stationNear(V3(...bq(15, 620, elD - 2))) * hero.length + 40;
    // the rope's first pass, from its source in the cave to where the loop goes out of sight, as balls every 15 m
    // (x, y, z, radius: the rope's own plus the 9 m it sways): what the hand-over in update() tests against the frame,
    // and what a giant's crown must stand clear under
    const rivB = [];
    { const q = V3(); for (let s = 0; s <= sA; s += 15) { hero.centerAt(s / hero.length, q); rivB.push(q.x, q.y, q.z, hero.ropeRadiusAt(s / hero.length) + 9); } }
    const underRope = (x, z, R, top) => { for (let i = 0; i < rivB.length; i += 4) if (Math.hypot(rivB[i] - x, rivB[i + 2] - z) < R + rivB[i + 3] - 9 && top > rivB[i + 1] - rivB[i + 3] - 3) return true; return false; };
    await ctx.yield();
    const A = hero.anchors, seat = A.portalSeat, OUT = A.mouthOutline, NO = OUT.length - 1;
    // The path, 977 m. It enters low and level among the stalagmites (60 m), climbs until the rope is a river of bats
    // just overhead (its lowest bats 3 m above the lens, its core 17 m), flies under it for 90 m and rises into it at
    // the mouth, which it leaves 8 m under the lip; turns left onto the run and flies at the moon,
    // rising a little so that the river stays on the moon's face; ducks under the river, turns right and sinks
    // between the two towers to 25 m over the crowns, and climbs to the notch: the last 96 m straight, rising 3 degrees.
    const lift = deep ? 12 : 0;                                            // over the cloud sea it keeps above the heads
    const pre = seat.position.clone().addScaledVector(seat.direction, -96), half = seat.position.clone().addScaledVector(seat.direction, -48);
    const W1 = [TR * (1 - Math.cos(azR / 2)), TR * Math.sin(azR / 2)], W3 = onRun(62), W4 = onRun(tC - 80), W5 = onRun(tC - 46), W6 = onRun(tC - 6, 11);
    const path = makePath([[0, 30, -276], [0, 30, -246], [0, 30.5, -216], [-1, 44, -196], [-2, 60, -175], [-1, 69, -153], [1, 72, -128], [3, 75.5, -100], [2, 84, -64], [0, 94, -30], [0, 100, 0],
      [W1[0], 98, W1[1]], [P1[0], 94.5, P1[1]], [W3[0], 95, W3[1]], [W4[0], yr - 80 * tnD(elD + 1.5), W4[1]], [W5[0], yr - 20, W5[1]],
      [W6[0], Math.max(yr - 29, 80 + lift * 0.75), W6[1]], [(W6[0] + 152) / 2 + 5, 84 + lift * 0.5, 304], [162, 74 + lift, 356], [166, 67 + lift, 406], [169, 68 + lift, 452], [171.5, 76 + lift * 0.6, 494], pre, half, seat.position.clone()]);
    // two places on the route, in metres from its start: where it crosses the mouth plane, and where it passes under
    // the point at which the river crosses the run (C0)
    let dMouth = 0; { const q = V3(); for (let d = 0; d < path.length; d += 2) { path.posAtDist(d, q); if (q.z >= 0) { dMouth = d; break; } } }
    const dDuck = path.nearestXZ(C0[0], C0[1]).u * path.length;
    const sideL = V3().crossVectors(V3(0, 1, 0), seat.direction).normalize();          // ridge axis: left of the final heading
    const fwd = V3(seat.direction.x, 0, seat.direction.z).normalize(), UPV = V3(0, 1, 0);
    await ctx.yield();

    // ---- shared uniforms ----
    const lampPos = V3(0, 74, 26), mOff = xr.fork('mistoff');
    // the window in the roof and its shaft of moonlight, which falls on the stalagmite field left of the path's first stretch
    const beamDir = V3(-0.24, -1, -0.12).normalize(), beamFoot = V3(20, 4, -200), beamR = 9.5, holeP = V3(46, 112, -187);
    const U = {
      uTime: { value: 0 }, uCam: { value: V3(0, 30, -276) }, uPx: { value: 0.003 },
      uLampPos: { value: lampPos }, uLampCol: { value: C(H.lamp).lerp(C('#c8c8c8'), 0.22).multiplyScalar(H.lampI) }, uHaze: { value: C(H.haze).multiplyScalar(1.6) }, uHazeK: { value: 0.0037 }, uU: { value: 0 },
      uAmbCol: { value: C(H.lamp).multiplyScalar(0.47 * H.lampI / 1.3).add(C('#3a2c22').multiplyScalar(0.08)) }, uMoss: { value: C(H.canopyA).lerp(C(H.canopyC), 0.4).multiplyScalar(1.15) }, uBat: { value: new THREE.Color().setRGB(0.051, 0.0465, 0.043) },
      uMoonDir: { value: keyDir }, uMoonCol: { value: C(H.moon).multiplyScalar(H.moonK) }, uHole: { value: holeP }, uFoot: { value: beamFoot }, uBeamDir: { value: beamDir }, uBeamCol: { value: C(H.moon).multiplyScalar(1.5) }, uBeamR: { value: beamR },
      uSwRim: { value: C(H.moon).multiplyScalar(0.2) }, uRimN: { value: 3 }, uBounce: { value: C('#91877c').multiplyScalar(0.8) },
      uSkyCol: { value: C(H.skyCol).lerp(C('#9a9a9a'), H.skyGrey).multiplyScalar(H.skyK) }, uGlowCol: { value: C(H.glow).multiplyScalar(H.glowK) }, uGlowDir: { value: keyDir },
      uMistCol: { value: mistCol }, uMistShade: { value: V3(H.mistShade[0], H.mistShade[1], H.mistShade[2]) }, uMistOp: { value: deep ? 0.94 : 0.8 }, uSoft: { value: deep ? 6.5 : 4.5 },
      uSheetY: { value: deep ? 48 : 34.5 }, uAmp: { value: deep ? 3 : 2.6 }, uLayD: { value: 5.2 }, uMistGl: { value: 1 }, uCovA: { value: deep ? 0.38 : 0.4 }, uCovB: { value: deep ? 0.52 : 0.64 }, uOffM: { value: new THREE.Vector2(mOff.range(0, 40), mOff.range(0, 40)) },
      uMistYR: { value: deep ? 58 : 35 }, uMistOpR: { value: deep ? 0.9 : 0.7 }, uFogCol: { value: fogCol }, uFogK: { value: scene.fog.density },
      // uVeil: the night air outside as the cave sees it (set each frame, nothing once the lens is near the mouth): it
      // thickens with distance beyond the mouth and has no outline but the rock's. uHazeFar: the pale haze the far forest fades into.
      uVeil: { value: new THREE.Color(0, 0, 0) }, uHazeFar: { value: mistCol.clone().multiplyScalar(0.75).lerp(C(H.horizon), 0.3) },
    };
    const veilCol = C(H.lamp).multiplyScalar(0.36);
    const CDEF = deep ? { DEEP: 1 } : {};                                  // fixed for the visit: the deep cloud sea
    const smat = (vertexShader, fragmentShader, extra = {}, uni = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...uni }, vertexShader, fragmentShader, ...extra });

    // ---- the cave: one displaced tube matched to the authored mouth outline, a guano floor, formations ----
    const cRock = C(PAL[4]).multiplyScalar(0.36), cDeep = C(PAL[1]).multiplyScalar(1.1).lerp(C(PAL[4]).multiplyScalar(0.36), 0.22), cUmber = C(PAL[6]).multiplyScalar(1.5), cWarm = C('#6a5646'), cPale = C('#cfd8c8').multiplyScalar(0.5), tc = new THREE.Color();
    const nearPath = (x, y, z) => path.distanceTo(x, y, z);
    const outN = [];
    for (let a = 0; a <= NO; a++) { const p = OUT[Math.max(0, a - 2)], q = OUT[Math.min(NO, a + 2)], tx = q.x - p.x, ty = q.y - p.y, l = Math.hypot(tx, ty) || 1; outN.push([-ty / l, tx / l]); }
    if (outN[0][0] * OUT[0].x < 0) outN.forEach((n) => { n[0] = -n[0]; n[1] = -n[1]; });
    // the outline's apex (where it crosses x = 0): the stepped right side is longer than the left, so the two sides are
    // matched by their share of the way down from the apex, not by index
    let aTop = NO / 2;
    for (let a = 1; a <= NO; a++) if (OUT[a - 1].x >= 0 && OUT[a].x < 0) { aTop = a - 1 + OUT[a - 1].x / Math.max(1e-6, OUT[a - 1].x - OUT[a].x); break; }
    const oq = [0, 0], om = [0, 0];
    const outAt = (a, o) => { const i = Math.min(NO - 1, Math.max(0, Math.floor(a))), f = a - i; o[0] = lerp(OUT[i].x, OUT[i + 1].x, f); o[1] = lerp(OUT[i].y, OUT[i + 1].y, f); return i; };
    function caveP(a, z, out) {                       // a: 0..NO along the outline (+X foot, over the top, -X foot)
      a = clamp(a, 0, NO);
      const i = outAt(a, oq), f = a - i; let x0 = oq[0], y0 = oq[1];
      const s = smoothstep(-36, -270, z), sn = smoothstep(-40, -95, z);
      // The stepped overhangs belong to the mouth. Going in, each shelf dies away into a plain wall (the left side's
      // line, mirrored), at a depth that differs from height to height, so no ledge runs ruler-level down the cave.
      // One smooth blend of two smooth outlines: the wall never folds and the keyhole's own line is untouched.
      if (a > aTop && z < -18) {
        outAt(aTop * (1 - (a - aTop) / (NO - aTop)), om);
        const g = smoothstep(-18, -74 - 26 * noise.n2(y0 * 0.04, 6.3), z);
        x0 = lerp(x0, -om[0], g); y0 = lerp(y0, om[1], g);
      }
      const wide = lerp(1, 1.72 + 0.14 * noise.n2(z * 0.006, 3.1), s), tall = lerp(1, 0.925 + 0.035 * noise.n2(z * 0.008, 9.7), s);
      const x = x0 * wide, y = -14 + (y0 + 14) * tall, dx = x0, dy = y0 - 50, dl = Math.hypot(dx, dy) || 1;
      const big = noise.fbm3(x * 0.016, y * 0.016, z * 0.016, 3), fine = noise.n3(x * 0.042 + 5, y * 0.042, z * 0.042) * 1.25;      // nothing finer than the rings (3.8 m apart) can carry, or the wall quilts
      const thr = z < -36 ? 4 : z < -22 ? lerp(4, 2.2, (z + 36) / 14) : z < -8 ? lerp(2.2, 0.6, (z + 22) / 14) : lerp(0.6, 0, clamp((z + 8) / 8, 0, 1));
      const off = lerp(lerp(2.5, thr - 2.3, smoothstep(-44, -30, z)), 5 + 2 * s + big * lerp(4.5, 7, s) + fine * 1.7, sn);   // inside the hero mouth's throat rings, so they never show
      const kn = smoothstep(-70, -40, z), rx = dx / dl, ry = dy / dl, nx = lerp(rx, lerp(outN[i][0], outN[i + 1][0], f), kn), ny = lerp(ry, lerp(outN[i][1], outN[i + 1][1], f), kn), nl = Math.hypot(nx, ny) || 1;
      caveP.ao = clamp(0.92 - big * 0.55 * sn - fine * 0.3 * sn, 0.4, 1.3);
      out.x = x + (nx / nl) * off; out.y = y + (ny / nl) * off; out.z = z + 5 * smoothstep(78, 112, y0) * smoothstep(-12, 1, z);     // the brow overhangs
      if (Math.abs(out.x) < 34 && out.y > 100) { const d = nearPath(out.x, out.y, z); if (d < 13) out.y += 13 - d; }     // keep the ceiling off the corkscrew
      return out;
    }
    const sPh = rng.range(0, 6.28);
    const streamX = (z) => 24 * Math.sin(z * 0.011 + sPh) + 8 * Math.sin(z * 0.031 + 1.3);
    function floorY0(x, z) {
      const m = noise.fbm2(x * 0.012 + 3, z * 0.012, 3), b = Math.max(0, noise.n2(x * 0.06, z * 0.06 + 20) - 0.3) * 11;
      const sx = x - streamX(z), ch = Math.exp(-(sx * sx) / 130);
      return -4 + 9 * m + b * (1 - ch) + Math.pow(Math.abs(x) / 80, 2.2) * 15 - 4.5 * ch;
    }
    const P = V3();
    // where each wall comes down to the floor (|x|, every 10 m of the cave), found by walking up the outline from
    // its foot. Against it the floor heaps into a bank of fallen blocks and guano of uneven height, so the two never
    // meet along a straight line.
    const JN = 50, junc = [new Float32Array(JN), new Float32Array(JN)];
    for (let i = 0; i < JN; i++) {
      const z = lerp(-474, 16, i / (JN - 1));
      for (let sd = 0; sd < 2; sd++) {
        let x = 0;
        for (let a = 0; a < NO * 0.3; a += 0.5) { caveP(sd ? NO - a : a, z, P); x = Math.abs(P.x); if (P.y > floorY0(P.x, z) + 1) break; }
        junc[sd][i] = x;
      }
      if ((i & 7) === 7) await ctx.yield();
    }
    const wallX = (z, sd) => { const f = clamp((z + 474) / 490, 0, 1) * (JN - 1), i = Math.min(JN - 2, Math.floor(f)); return lerp(junc[sd][i], junc[sd][i + 1], f - i); };
    function floorY(x, z) {
      const y0 = floorY0(x, z), sd = x >= 0 ? 0 : 1, d = wallX(z, sd) - Math.abs(x);
      if (d > 34 || z > -6) return y0;
      const B = Math.max(3, 12 + 9 * noise.n2(z * 0.035, 1.7 + sd * 5) + 5 * noise.n2(z * 0.11, 8.3 + sd * 3)), k = smoothstep(34, 2, d);
      return y0 + (B * k * k + 2.6 * noise.n2(x * 0.19, z * 0.19 + 40) * smoothstep(34, 8, d) + 0.9 * Math.max(0, -d)) * smoothstep(-6, -30, z);
    }
    const G = acc(), GFl = acc(), GS = acc(), GMd = acc();          // the tube with its near formations, the floor, the sill's boulders and ferns, the sill's guano mounds
    {
      const NZ = 110, NR = Math.floor(NO / 2) + 1, i0 = G.pos.length / 3;
      for (let k = 0; k < NZ; k++) {
        const z = lerp(-474, 1, Math.pow(k / (NZ - 1), 0.92));
        for (let r = 0; r < NR; r++) {
          caveP(r * (NO / (NR - 1)), z, P);
          const band = noise.fbm2(P.x * 0.03 + z * 0.01, P.y * 0.04 + 11, 2) * 0.5 + 0.5, warm = smoothstep(0.55, 0.85, noise.n3(P.x * 0.025, P.y * 0.025, z * 0.025) * 0.5 + 0.5);
          const band2 = noise.n3(P.x * 0.019 + 40, P.y * 0.021 + 7, z * 0.017 + 23) * 0.5 + 0.5;      // a second, unrelated field: the two colours never follow one contour
          tc.copy(cRock).lerp(cDeep, smoothstep(0.25, 0.8, band2) * 0.6).lerp(cPale, smoothstep(0.5, 1, band) * 0.42 * (1 - 0.6 * smoothstep(0.25, 0.8, band2))).lerp(cWarm, warm * 0.45);
          G.v(P.x, P.y, P.z, tc, caveP.ao * (0.92 + 0.14 * noise.n2(P.x * 0.05, z * 0.05 + P.y * 0.05)));
        }
        if (k & 1) await ctx.yield();
      }
      G.grid(i0, NZ, NR);
      await ctx.yield();
      const FX = 35, FZ = 118, f0 = GFl.pos.length / 3;
      for (let k = 0; k < FZ; k++) {
        const z = lerp(-474, 16, k / (FZ - 1)), wp = Math.max(100, wallX(z, 0) + 10), wn = Math.max(100, wallX(z, 1) + 10);
        for (let r = 0; r < FX; r++) {
          const s = (r / (FX - 1)) * 2 - 1, x = Math.sign(s) * Math.pow(Math.abs(s), 0.72) * (s > 0 ? wp : wn), y = floorY(x, z), rocky = smoothstep(2, 7, Math.max(0, noise.n2(x * 0.06, z * 0.06 + 20) - 0.3) * 11);
          tc.copy(cUmber).lerp(cRock, rocky * 0.8 + smoothstep(8, 22, y) * 0.5);
          GFl.v(x, y, z, tc, 0.75 + 0.35 * noise.n2(x * 0.15 + 9, z * 0.15));
        }
        if ((k & 7) === 7) await ctx.yield();
      }
      GFl.grid(f0, FZ, FX);
    }
    await ctx.yield();

    // stalactites (ribbed carrots leaning to the light) and draperies, merged into the cave mesh
    const tips = [], rf = rng.fork('formations'), GF = acc();     // GF: the deep formations, a mesh of their own (hidden once the lens is well outside)
    for (let n = 0; n < 380; n++) {
      if ((n & 15) === 15) await ctx.yield();
      const a = NO * (rf() < 0.6 ? rf.range(0.38, 0.62) : rf.range(0.24, 0.76)), z = rf.range(-458, -34);
      const Gt = z < -110 ? GF : G;
      caveP(a, z, P); const rx = P.x, ry = P.y + 0.8;
      let len = lerp(2.5, 14, Math.pow(rf(), 1.8)); const lean = rf.range(0.08, 0.22), sa = rf.range(0, 6.28), wetK = rf.range(0.7, 1.2);
      const d = nearPath(rx, ry - len, z + lean * len); if (d < 8.5) len -= 9 - d;
      if (len < 2) continue;
      const rad = 0.3 + len * rf.range(0.06, 0.1), sides = len > 6.5 ? 9 : 6, ts = len > 6.5 ? [0, 0.1, 0.28, 0.52, 0.78, 1] : [0, 0.14, 0.42, 0.74, 1], i0 = Gt.pos.length / 3;      // the big ones are round, not six flat faces
      for (const t of ts) {
        const r = rad * (Math.pow(1 - t, 1.45) * 0.86 + 0.14 * (1 - t)) * (1 + 0.22 * Math.sin(t * 13 + sa));
        tc.copy(cRock).lerp(cDeep, 0.25 + 0.6 * t).lerp(cPale, 0.3 * Math.max(0, Math.sin(t * 9 + sa)));
        for (let k = 0; k < sides; k++) {
          const ang = (k / sides) * 6.2832 + t * 0.6, rr = r * (1 + 0.24 * Math.sin(ang * 3 + sa));
          Gt.v(rx + Math.cos(ang) * rr, ry - t * len, z + Math.sin(ang) * rr + lean * len * t * t, tc, wetK * (0.95 + 0.14 * Math.sin(ang * 2 + sa)));
        }
      }
      for (let i = 0; i < ts.length - 1; i++) for (let k = 0; k < sides; k++) { const a0 = i0 + i * sides + k, a1 = i0 + i * sides + (k + 1) % sides; Gt.quad(a0, a1, a0 + sides, a1 + sides); }
      tips.push([rx, ry - len, z + lean * len]);
    }
    // draperies: curtains of flowstone hanging from the roof in folds 5 m apart that deepen downward, with a
    // scalloped hem, so the light from the mouth picks out every fold
    for (let n = 0; n < 70; n++) {
      if ((n & 7) === 7) await ctx.yield();
      const a = NO * rf.range(0.36, 0.64), z0 = rf.range(-450, -60), W = rf.range(8, 19), ph = rf.range(0, 6.28), SEG = Math.round(W * 1.3), RW = 4, Gt = z0 < -110 ? GF : G, i0 = Gt.pos.length / 3;
      let D = rf.range(3, 8.5);
      caveP(a, z0 + W / 2, P); const dm = nearPath(P.x, P.y - D, z0 + W / 2); if (dm < 9.5) D -= 10 - dm;
      if (D < 1.5) continue;
      for (let s = 0; s <= SEG; s++) {
        const f = s / SEG, z = z0 + f * W; caveP(a, z, P);
        const fold = Math.sin(f * W * 1.25 + ph), dep = D * (0.35 + 0.65 * Math.sin(Math.PI * f)) * (0.8 + 0.2 * Math.sin(f * W * 2.5 + ph));
        for (let r = 0; r < RW; r++) {
          const t = r / (RW - 1); tc.copy(cPale).lerp(cDeep, 0.3 + 0.5 * Math.abs(fold));
          Gt.v(P.x + (0.25 + 0.9 * t) * fold + 0.3 * t * Math.sin(f * W * 3.1 + ph * 2), P.y + 0.8 - dep * Math.pow(t, 0.9), z, tc, 0.7 + 0.5 * t * (0.75 + 0.25 * fold));
        }
      }
      Gt.grid(i0, SEG + 1, RW);
    }
    await ctx.yield();
    // ---- the keyhole itself: a fringe of long stalactites on its rim (dark teeth across the bright sky), and on
    // the sill boulders with bird's-nest ferns, so the opening is framed by shaped things, not by a bare edge ----
    {
      const rq = xr.fork('fringe'), rb0 = xr.fork('sill'), cB = C('#3c423a'), cBm = C(PAL[5]).multiplyScalar(1.5), cFern = C('#2c6a40');
      for (let n = 0; n < 84; n++) {
        const sd = n % 3, a = NO * (sd === 0 ? rq.range(0.285, 0.42) : sd === 1 ? rq.range(0.58, 0.715) : rq.range(0.4, 0.6)), z = n < 54 ? rq.range(-27, -4) : rq.range(-11, 0.5);     // the last thirty stand right on the lip: teeth across the sky
        caveP(a, z, P); const rx = P.x, ry = P.y + 0.8, lean = rq.range(0.06, 0.18), sa = rq.range(0, 6.28), wetK = rq.range(0.7, 1.1);
        let len = lerp(4, 13, Math.pow(rq(), 1.3)); const d = nearPath(rx, ry - len, z + lean * len); if (d < 9.5) len -= 10 - d;
        if (len < 2.5) continue;
        const rad = 0.3 + len * rq.range(0.06, 0.09), sides = len > 6.5 ? 9 : 6, ts = [0, 0.1, 0.28, 0.52, 0.78, 1], i0 = G.pos.length / 3;
        for (const t of ts) {
          const r = rad * (Math.pow(1 - t, 1.45) * 0.86 + 0.14 * (1 - t)) * (1 + 0.22 * Math.sin(t * 13 + sa));
          tc.copy(cRock).lerp(cDeep, 0.25 + 0.6 * t).lerp(cPale, 0.3 * Math.max(0, Math.sin(t * 9 + sa)));
          for (let k = 0; k < sides; k++) {
            const ang = (k / sides) * 6.2832 + t * 0.6, rr = r * (1 + 0.24 * Math.sin(ang * 3 + sa));
            G.v(rx + Math.cos(ang) * rr, ry - t * len, z + Math.sin(ang) * rr + lean * len * t * t, tc, wetK * (0.95 + 0.14 * Math.sin(ang * 2 + sa)));
          }
        }
        for (let i = 0; i < ts.length - 1; i++) for (let k = 0; k < sides; k++) { const a0 = i0 + i * sides + k, a1 = i0 + i * sides + (k + 1) % sides; G.quad(a0, a1, a0 + sides, a1 + sides); }
        tips.push([rx, ry - len, z + lean * len]);
      }
      await ctx.yield();
      // ---- the rim is broken, not a clean curve, but the opening stays wide: the left side is the plain leaning
      // wall; the rock noses stand on the stepped right-hand side (Lincoln's profile), three small ones on its lower
      // steps and the nose itself, 14 m long, a little under the height at which the path leaves, each hung with a
      // comb of stalactites and planted on top; more combs under that side's shelves; and on the sill, either side
      // of the stream, low guano mounds and boulders. All well clear of the path (25 m and more). ----
      const rr0 = xr8.fork('rim');
      const carrot = (Gt, rx, ry, z, len, lean, sides) => {            // a stalactite hung at (rx, ry, z)
        const rad = 0.3 + len * rr0.range(0.06, 0.09), ts = [0, 0.1, 0.28, 0.52, 0.78, 1], i0 = Gt.pos.length / 3, sa = rr0.range(0, 6.28), wetK = rr0.range(0.7, 1.1);
        for (const t of ts) {
          const r = rad * (Math.pow(1 - t, 1.45) * 0.86 + 0.14 * (1 - t)) * (1 + 0.22 * Math.sin(t * 13 + sa));
          tc.copy(cRock).lerp(cDeep, 0.25 + 0.6 * t).lerp(cPale, 0.3 * Math.max(0, Math.sin(t * 9 + sa)));
          for (let k = 0; k < sides; k++) {
            const ang = (k / sides) * 6.2832 + t * 0.6, rr = r * (1 + 0.24 * Math.sin(ang * 3 + sa));
            Gt.v(rx + Math.cos(ang) * rr, ry - t * len, z + Math.sin(ang) * rr + lean * len * t * t, tc, wetK * (0.95 + 0.14 * Math.sin(ang * 2 + sa)));
          }
        }
        for (let i = 0; i < ts.length - 1; i++) for (let k = 0; k < sides; k++) { const a0 = i0 + i * sides + k, a1 = i0 + i * sides + (k + 1) % sides; Gt.quad(a0, a1, a0 + sides, a1 + sides); }
        tips.push([rx, ry - len, z + lean * len]);
      };
      let aNose = NO - 1; { let bd = 1e9; for (let a = Math.ceil(aTop) + 1; a < NO; a++) if (OUT[a].x < -20) { const d = Math.abs(OUT[a].y - 87); if (d < bd) { bd = d; aNose = a; } } }
      const noseTops = [];
      for (const [af, zc, A, B, Cz] of [[0.93, -24, 3.6, 4.2, 6], [0.865, -15, 3.2, 3.8, 5], [0.965, -11, 2.8, 3.2, 4.4], [aNose / NO, -15, 10, 5.2, 9]]) {
        caveP(NO * af, zc, P); const sx = -Math.sign(P.x) || -1, cx = P.x - sx * A * 0.1, cy = P.y, seg = 10, rings = 6, i0 = G.pos.length / 3, ph = rr0() * 6.28;
        if (nearPath(cx + sx * A, cy, zc) < 16) continue;
        noseTops.push({ cx, cy, zc, sx, A, B, Cz });
        for (let e = 0; e <= rings; e++) {
          const el = -1.25 + (e / rings) * (Math.PI / 2 + 1.25), sy = Math.sin(el), cr2 = Math.cos(el);
          for (let k = 0; k < seg; k++) {
            const an = (k / seg) * 6.2832 + e * 0.35, l = 1 + 0.2 * Math.sin(k * 2.3 + e * 1.9 + ph) + 0.1 * Math.sin(k * 4.1 + e * 3.1 + ph * 2);
            const ox = Math.cos(an) * cr2 * l, oz = Math.sin(an) * cr2 * l, nose = 1 + 0.45 * Math.max(0, ox);                 // drawn out toward the axis
            tc.copy(cRock).lerp(cDeep, 0.3 + 0.4 * (1 - e / rings)).lerp(cPale, 0.25 * smoothstep(0.3, 0.9, sy));
            G.v(cx + sx * ox * A * nose, cy + (sy > 0 ? sy * B * 0.85 : sy * B * (1 - 0.3 * Math.max(0, ox))), zc + oz * Cz, tc, 0.72 + 0.34 * (e / rings));
          }
        }
        for (let e = 0; e < rings; e++) for (let k = 0; k < seg; k++) { const a0 = i0 + e * seg + k, a1 = i0 + e * seg + (k + 1) % seg; G.quad(a1, a0, a1 + seg, a0 + seg); }
        const top = G.v(cx + sx * A * 0.2, cy + B * 0.9, zc, cPale, 1); for (let k = 0; k < seg; k++) G.idx.push(i0 + rings * seg + (k + 1) % seg, i0 + rings * seg + k, top);
        for (let n = 0; n < 5; n++) {                  // the comb under its tip
          const o = rr0.range(0.55, 1.3), zz = zc + rr0.range(-0.7, 0.7) * Cz * (1.2 - 0.5 * o), len = rr0.range(3, 9) * (0.6 + 0.4 * o);
          if (nearPath(cx + sx * A * o, cy - B * 0.5 - len, zz) > 14) carrot(G, cx + sx * A * o, cy - B * (0.75 - 0.3 * o), zz, len, rr0.range(0.04, 0.14), 6);
        }
      }
      // combs under the right side's shelves: wherever the outline's rock hangs over the opening
      for (let n = 0, got = 0; n < 200 && got < 16; n++) {
        const a = NO * rr0.range(0.6, 0.97), ai = Math.round(a), z = rr0.range(-30, -3), len = rr0.range(2.5, 7.5);
        if (outN[ai][1] < 0.7 || OUT[ai].y < 14) continue;
        caveP(a, z, P); if (nearPath(P.x, P.y - len, z) < 14) continue;
        carrot(G, P.x + rr0.range(0.6, 1.6), P.y + 0.6, z, len, rr0.range(0.04, 0.14), 6); got++;
      }
      await ctx.yield();
      const boulder = (bx, bz, r, rq = rb0) => {       // a lumpy block half sunk in the guano; returns the height of its top
        const by = floorY(bx, bz) + r * 0.2, seg = 7, rings = 4, i0 = GS.pos.length / 3, ph = rq() * 6.28, sq = rq.range(0.55, 0.85);
        for (let e = 0; e <= rings; e++) {
          const el = -0.9 + (e / rings) * (Math.PI / 2 + 0.9), cy = Math.sin(el), cr = Math.cos(el);
          for (let k = 0; k < seg; k++) {
            const an = (k / seg) * 6.2832 + e * 0.4, l = 1 + 0.22 * Math.sin(k * 2.3 + e * 1.9 + ph) + 0.12 * Math.sin(k * 4.1 + e * 3.1 + ph * 2);
            tc.copy(cB).lerp(cBm, smoothstep(0.3, 0.9, cy) * 0.6);
            GS.v(bx + Math.cos(an) * cr * l * r, by + cy * r * sq, bz + Math.sin(an) * cr * l * r * 0.85, tc, 0.5 + 0.5 * (e / rings));
          }
        }
        for (let e = 0; e < rings; e++) for (let k = 0; k < seg; k++) { const a0 = i0 + e * seg + k, a1 = i0 + e * seg + (k + 1) % seg; GS.quad(a1, a0, a1 + seg, a0 + seg); }
        return by + r * sq;
      };
      const fern = (fx0, fy, fz, r, rq = rb0) => {     // bird's-nest fern: a rosette of broad arching fronds
        const nF = 8, ph = rq() * 6.28;
        for (let k = 0; k < nF; k++) {
          const an = ph + (k / nF) * 6.2832 + rq.range(-0.2, 0.2), ca = Math.cos(an), sa = Math.sin(an), len = r * rq.range(0.8, 1.15), i0 = GS.pos.length / 3;
          for (let s2 = 0; s2 <= 3; s2++) {
            const t = s2 / 3, o = len * (0.12 + 0.8 * t), yy = fy + len * (0.8 * t - 0.5 * t * t), w = len * 0.2 * Math.sin(Math.PI * (0.12 + 0.88 * t)) + 0.03;
            GS.v(fx0 + ca * o - sa * w, yy, fz + sa * o + ca * w, cFern, 0.55 + 0.6 * t); GS.v(fx0 + ca * o + sa * w, yy, fz + sa * o - ca * w, cFern, 0.7 + 0.6 * t);
          }
          for (let s2 = 0; s2 < 3; s2++) { const b = i0 + s2 * 2; GS.quad(b, b + 1, b + 2, b + 3); }
        }
      };
      for (let n = 0; n < 30; n++) {
        const bx = rb0.range(-46, 46), bz = rb0.range(-18, 7), r = lerp(1.5, 4.8, Math.pow(rb0(), 1.6));
        if (Math.abs(bx - streamX(bz)) < r + 4) continue;
        const top = boulder(bx, bz, r);
        if (rb0() < 0.65) fern(bx + rb0.range(-0.3, 0.3) * r, top - 0.2, bz + rb0.range(-0.3, 0.3) * r, rb0.range(1.6, 2.7));
      }
      for (let n = 0; n < 34; n++) { const bx = rb0.range(-45, 45), bz = rb0.range(-14, 9); if (Math.abs(bx - streamX(bz)) < 4) continue; fern(bx, floorY(bx, bz) - 0.1, bz, rb0.range(1.7, 3.1)); }
      // The sill: low heaps of guano and boulders, none over 5 m, each with a bird's-nest fern 1.5 m across on its top
      // and smaller blocks round its foot. Eight of them, scattered by seeded draw over the band of floor behind the
      // mouth plane (3 to 23 m in, from wall foot to wall foot): each stands 8 m or more from the stream, 8 m from
      // the next, inside the walls' feet, and nowhere near the route (which passes 85 m overhead).
      const rmd = xr9.fork('mounds'), moundTops = [], rsl = xr10.fork('sill'), spots = [];
      for (let n = 0; n < 600 && spots.length < 8; n++) {
        const bz = rsl.range(-23, -3), sd = rsl() < 0.5 ? 0 : 1, wx = Math.min(44, wallX(bz, sd) - 3), bx = (sd ? -1 : 1) * rsl.range(0, Math.max(wx, 1)), Hh = rsl.range(7.5, 17);
        if (Math.abs(bx - streamX(bz)) < 8 || spots.some((s) => Math.hypot(s[0] - bx, s[1] - bz) < 8)) continue;
        if (nearPath(bx, floorY(bx, bz) + 5, bz) < 16) continue;
        spots.push([bx, bz, Hh]);
      }
      spots.forEach(([bx, bz, Hh], n) => {
        let top;
        if (n % 2 === 0) {
          const R = 3.2 + Hh * 0.2, Hm = Math.min(4.4, 2 + Hh * 0.15), by = floorY(bx, bz) - 0.7, seg = 10, rings = 4, i0 = GMd.pos.length / 3, ph = rmd() * 6.28;
          for (let e = 0; e <= rings; e++) {
            const v = (e / (rings + 0.8)) * 1.5708, cr2 = Math.cos(v), sy = Math.sin(v);
            for (let k = 0; k < seg; k++) {
              const an = (k / seg) * 6.2832 + e * 0.3, l = 1 + 0.18 * Math.sin(k * 2.3 + e * 1.3 + ph) + 0.09 * Math.sin(k * 4.1 + e * 2.9 + ph * 2);
              tc.copy(cUmber).lerp(cRock, 0.2 + 0.3 * sy);
              GMd.v(bx + Math.cos(an) * cr2 * l * R, by + Hm * sy, bz + Math.sin(an) * cr2 * l * R * 0.86, tc, 0.7 + 0.4 * sy);
            }
          }
          for (let e = 0; e < rings; e++) for (let k = 0; k < seg; k++) { const a0 = i0 + e * seg + k, a1 = i0 + e * seg + (k + 1) % seg; GMd.quad(a1, a0, a1 + seg, a0 + seg); }
          const tv = GMd.v(bx, by + Hm, bz, cUmber, 1.1); for (let k = 0; k < seg; k++) GMd.idx.push(i0 + rings * seg + (k + 1) % seg, i0 + rings * seg + k, tv);
          top = by + Hm; moundTops.push([bx, by, bz, R, Hm]);
        } else top = boulder(bx, bz, 2.3 + Hh * 0.07, rmd);
        fern(bx, top - 0.15, bz, 0.75, rmd);
        for (let k = 0; k < 2; k++) { const an = rmd() * 6.2832, o = rmd.range(4, 7), r = rmd.range(0.8, 1.7); if (Math.abs(bx + Math.cos(an) * o - streamX(bz + Math.sin(an) * o)) > r + 4) boulder(bx + Math.cos(an) * o, bz + Math.sin(an) * o, r, rmd); }
      });
      // ---- on every ledge of the mouth: the one-leaf plant (Monophyllaea: a single leaf 0.6 m long to each plant),
      // begonia clumps and small bird's-nest ferns: on the tops of the noses, on the shelves of the stepped side and
      // on the sill's mounds ----
      {
        const rpl = xr9.fork('ledge-plants'), cMo = C('#4c8a55'), cBe = C('#2f6a4c');
        const leafAt = (x, y, z, an, len, wid, rise, droop, col, k, NS = 3) => {      // one keeled leaf from (x, y, z), pointing along an
          const ca = Math.sin(an), sa = Math.cos(an), i0 = GS.pos.length / 3;
          for (let s2 = 0; s2 <= NS; s2++) {
            const t = s2 / NS, o = len * t, yy = y + len * (rise * t - droop * t * t), w = wid * Math.pow(Math.sin(Math.PI * (0.1 + 0.86 * t)), 0.7) + 0.01;
            GS.v(x + ca * o - sa * w, yy + w * 0.3, z + sa * o + ca * w, col, k * (0.6 + 0.5 * t)); GS.v(x + ca * o, yy, z + sa * o, col, k * (0.45 + 0.4 * t)); GS.v(x + ca * o + sa * w, yy + w * 0.3, z + sa * o - ca * w, col, k * (0.75 + 0.5 * t));
          }
          for (let s2 = 0; s2 < NS; s2++) { const b = i0 + s2 * 3; GS.quad(b, b + 1, b + 3, b + 4); GS.quad(b + 1, b + 2, b + 4, b + 5); }
        };
        const plantAt = (x, y, z) => {
          const k = rpl.range(0.8, 1.3);
          if (rpl() < 0.78) leafAt(x, y - 0.06, z, rpl.range(-0.9, 0.9), 0.6 * rpl.range(0.9, 1.15), 0.2, 0.62, 0.7, cMo, k);      // Monophyllaea: its one leaf leans out toward the light
          else { const nb = 6 + Math.floor(rpl() * 3), a0 = rpl() * 6.28; for (let b = 0; b < nb; b++) { const an = a0 + (b / nb) * 6.2832 + rpl.range(-0.3, 0.3), o = rpl.range(0.04, 0.2); leafAt(x + Math.sin(an) * o, y - 0.04 + rpl.range(0, 0.14), z + Math.cos(an) * o, an, rpl.range(0.2, 0.3), 0.09, 0.5, 0.75, cBe, k * rpl.range(0.8, 1.15), 1); } }      // a begonia clump: small lopsided leaves, no flowers
        };
        for (const t of noseTops) {
          const n = Math.round(6 + t.A * 4.5);
          for (let i = 0; i < n; i++) {
            const an = rpl() * 6.2832, rr = Math.sqrt(rpl()) * 0.76, ou = Math.cos(an) * rr, ov = Math.sin(an) * rr;
            const x = t.cx + t.sx * ou * t.A * (1 + 0.45 * Math.max(0, ou)), z = t.zc + ov * t.Cz, y = t.cy + Math.sqrt(Math.max(0, 1 - (rr / 0.86) * (rr / 0.86))) * t.B * 0.85 - 0.05;
            if (i % 7 === 3) fern(x, y + 0.05, z, 0.75, rpl); else plantAt(x, y, z);
          }
        }
        for (let n = 0, got = 0; n < 1200 && got < 120; n++) {
          const a = rpl.range(aTop + 4, NO - 2), ai = Math.round(a), z = rpl.range(-22, -1.5);
          if (outN[ai][1] > -0.45 || OUT[ai].y < 18) continue;               // the top of a shelf: the rock is below it
          caveP(a, z, P); if (nearPath(P.x, P.y, P.z) < 12) continue;
          got++; if (got % 9 === 4) fern(P.x, P.y + 0.1, P.z, 0.75, rpl); else plantAt(P.x, P.y + 0.02, P.z);
        }
        for (const [mx, my, mz, mr, mh] of moundTops) for (let i = 0; i < 5; i++) { const an = rpl() * 6.2832, q = rpl.range(0.25, 0.7); plantAt(mx + Math.cos(an) * q * mr, my + mh * Math.sqrt(1 - q * q) - 0.05, mz + Math.sin(an) * q * mr * 0.86); }
      }
      // fallen blocks heaped along the foot of both walls, half buried in the bank
      const rbj = rng.fork('junction');
      for (let n = 0; n < 56; n++) {
        const sd = n & 1, bz = lerp(-255, -16, (n + rbj()) / 56), r = lerp(1.6, 5.2, Math.pow(rbj(), 1.5)), bx = (sd ? -1 : 1) * (wallX(bz, sd) - rbj.range(1, 10) - r * 0.5);
        boulder(bx, bz, r);
        if ((n & 15) === 15) await ctx.yield();
      }
      // and more of them where the climb looks down the right-hand wall to its foot
      for (let n = 0; n < 20; n++) {
        const sd = n % 3 ? 1 : 0, bz = lerp(-136, -44, (n + rbj()) / 20), r = lerp(2.2, 6, Math.pow(rbj(), 1.4)), bx = (sd ? -1 : 1) * (wallX(bz, sd) - rbj.range(0, 8) - r * 0.4);
        boulder(bx, bz, r);
      }
      await ctx.yield();
    }
    // ---- the floor of the first stretch: a field of giant stalagmites, stacks of dribbled tiers 10 to 31 m tall,
    // with small ones round their feet. The shaft from the roof window falls among those on the left; the others
    // stand dark against the keyhole. Nothing within 9 m of the path, nothing near the entry point. ----
    const GM = acc(), stA = [];
    {
      const rs = xr.fork('stalagmites'), cPl = C('#cfd8c8').multiplyScalar(0.62);
      // A stalagmite is a stack of dribbled tiers: each swells from a narrow, shaded foot to a rim that overhangs it
      // and turns in to a terrace, on which the next stands a little off centre; tiers shorten upward and the whole
      // tapers to a blunt top and flares into the floor. aSt = (metres above the foot, tier + place in the tier).
      const rtr = xr.fork('stal-tiers'), TF = [[0, 0, 0.55], [0.55, 0.97, 0.86], [0.88, 1, 1.12], [1, 0.95, 1.02]], TS = [[0, 0, 0.6], [0.7, 1, 1.08], [1, 0.94, 1]];
      const stalag = (bx, bz, Hh, R, sides, rings) => {
        const by = floorY(bx, bz) - 1.5, HT = Hh + 1.5, i0 = GM.pos.length / 3, ph = rs() * 6.28, lean = rs.range(-0.05, 0.05), wetK = rs.range(0.85, 1.2);
        const prof = sides > 6 ? TF : TS, th = Math.max(0.9, Hh / (2.2 + Hh / 7)), hs = []; let sum = 0;
        while (sum < HT) { const h = th * rtr.range(0.5, 1.6) * (1 - 0.4 * sum / HT); hs.push(h); sum += h; }
        let y0 = 0, nR = 0, ox = 0, oz = 0;
        for (let k = 0; k < hs.length; k++) {
          const hk = hs[k] * HT / sum, last = k === hs.length - 1, tph = rtr() * 6.28, foot = rtr.range(0.74, 0.92), rim = rtr.range(1.01, 1.13);      // some tiers barely step in, some rims barely overhang
          if (k) { ox += rtr.range(-0.07, 0.07) * R; oz += rtr.range(-0.07, 0.07) * R; }
          for (const [f, rk0, ak] of prof) {
            const rk = rk0 === 0 ? foot : rk0 === 1 ? rim : rk0;
            const yy = y0 + hk * (k ? 0.03 + 0.97 * f : f), t = Math.min(1, yy / HT);
            const body = (0.46 + 0.54 * Math.pow(1 - t, 0.8)) * Math.sqrt(Math.max(0.03, 1 - Math.pow(t, 5))), flare = 1 + 0.9 * Math.pow(1 - t, 7);
            const r = R * body * flare * rk * (last && f === 1 ? 0.4 : 1), y = by + yy;
            tc.copy(cRock).lerp(cPl, 0.08 + 0.3 * smoothstep(0.6, 1, f)).lerp(cDeep, 0.5 * (1 - smoothstep(0, 0.5, f)));
            for (let q = 0; q < sides; q++) {
              const a = (q / sides) * 6.2832 + t * 0.9 + ph, rr = r * (1 + 0.14 * Math.sin(a * 3 + ph + t * 4) + 0.07 * Math.sin(a * 7 - t * 9 + ph * 2) + 0.07 * Math.sin(a * 2 + tph));
              GM.v(bx + ox + Math.cos(a) * rr + lean * HT * t, y, bz + oz + Math.sin(a) * rr, tc, wetK * (0.7 + 0.36 * t) * ak * (0.92 + 0.16 * Math.sin(a * 2 + ph)));
              stA.push(yy - 1.5, k + f * 0.999);
            }
            nR++;
          }
          y0 += hk;
        }
        const top = GM.v(bx + ox + lean * HT, by + HT + R * 0.1, bz + oz, cRock, wetK); stA.push(HT - 1.5, hs.length - 0.001);
        for (let j = 0; j < nR - 1; j++) for (let q = 0; q < sides; q++) { const a0 = i0 + j * sides + q, a1 = i0 + j * sides + (q + 1) % sides; GM.quad(a1, a0, a1 + sides, a0 + sides); }
        for (let q = 0; q < sides; q++) GM.idx.push(i0 + (nR - 1) * sides + q, i0 + (nR - 1) * sides + (q + 1) % sides, top);
        void rings;
      };
      const clear = (bx, bz, Hh, R) => {
        const by = floorY(bx, bz);
        for (const h of [0.15, 0.5, 0.8, 1]) if (nearPath(bx, by + Hh * h, bz) < R * (1.15 - 0.8 * h) + 9) return false;
        return Math.hypot(bx, bz + 276) > 17 + R && Math.abs(bx - streamX(bz)) > R + 3;
      };
      const big = [];
      const tryBig = (bx, bz, Hh) => {
        const R = 1.5 + Hh * 0.115;
        if (!clear(bx, bz, Hh, R) || big.some((b) => Math.hypot(b[0] - bx, b[1] - bz) < (b[2] + R) * 0.9)) return;
        big.push([bx, bz, R]); stalag(bx, bz, Hh, R, 12, Hh > 18 ? 14 : 10);
      };
      for (const [dx, dz, Hh] of [[-3, 5, 31], [7, -6, 22], [10, 8, 16], [-8, -10, 25], [15, 0, 13], [3, 15, 14], [0, -17, 19], [-12, 14, 11]]) tryBig(beamFoot.x + dx, beamFoot.z + dz, Hh);   // the lit group
      for (const [bx, bz, Hh] of [[-13, -236, 21], [-19, -205, 27], [14, -150, 24], [-12, -128, 17], [-24, -262, 15], [13, -252, 12]]) tryBig(bx, bz, Hh);                              // sentinels near the axis
      await ctx.yield();
      for (let n = 0; n < 70 && big.length < 30; n++) { tryBig(rs.range(-62, 64), rs.range(-268, -120), lerp(9, 26, Math.pow(rs(), 1.6))); if ((n & 7) === 7) await ctx.yield(); }
      for (let n = 0; n < 88; n++) {
        const b = big[Math.floor(rs() * big.length)], a = rs() * 6.2832, o = b[2] + rs.range(0.5, 9), near = rs() < 0.7, fx0 = rs.range(-60, 60), fz0 = rs.range(-270, -120);
        const bx = near ? b[0] + Math.cos(a) * o : fx0, bz = near ? b[1] + Math.sin(a) * o : fz0, Hh = lerp(1.2, 6.5, Math.pow(rs(), 1.8));
        if (clear(bx, bz, Hh, 1)) stalag(bx, bz, Hh, 0.4 + Hh * 0.17, 6, 6);
        if ((n & 15) === 15) await ctx.yield();
      }
    }
    await ctx.yield();
    const caveMat = smat(CAVE_VERT, CAVE_FRAG, { side: THREE.DoubleSide }, { uFloorK: { value: 0 } }), floorMat = smat(CAVE_VERT, CAVE_FRAG, { side: THREE.DoubleSide }, { uFloorK: { value: 1 } });
    // Each cave mesh is drawn as slabs of z (the attributes are shared, only the index differs), so the slabs that
    // lie behind the lens are left out each frame: the lens always looks down the passage toward the mouth.
    const slabs = (geo, mat, name, cuts) => {
      const ia = geo.index.array, pa = geo.attributes.position.array, n = cuts.length + 1, cnt = new Int32Array(n), which = new Uint8Array(ia.length / 3), zMax = new Float32Array(n).fill(-1e9), out = [];
      for (let i = 0, t = 0; i < ia.length; i += 3, t++) {
        const z0 = pa[ia[i] * 3 + 2], z1 = pa[ia[i + 1] * 3 + 2], z2 = pa[ia[i + 2] * 3 + 2], zc = (z0 + z1 + z2) / 3; let c = 0; while (c < cuts.length && zc > cuts[c]) c++;
        which[t] = c; cnt[c]++; zMax[c] = Math.max(zMax[c], z0, z1, z2);
      }
      for (let c = 0; c < n; c++) {
        if (!cnt[c]) continue;
        const ix = new ia.constructor(cnt[c] * 3); let o = 0;
        for (let t = 0; t < which.length; t++) if (which[t] === c) { ix[o++] = ia[t * 3]; ix[o++] = ia[t * 3 + 1]; ix[o++] = ia[t * 3 + 2]; }
        const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
        g.setIndex(new THREE.BufferAttribute(ix, 1));
        const m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; m.userData.zMax = zMax[c]; scene.add(m); out.push(m);
      }
      return out;
    };
    const caveGeo = G.build();
    await ctx.yield();
    const cave = slabs(caveGeo, caveMat, 'cave', [-400, -340, -280, -220, -160, -100, -40]);
    await ctx.yield();
    const caveFloor = slabs(GFl.build(), floorMat, 'cave-floor', [-330, -190, -60]);
    await ctx.yield();
    const caveSill = slabs(GS.build(), caveMat, 'cave-sill', [-140, -60]);
    await ctx.yield();
    if (GMd.pos.length) caveSill.push(...slabs(GMd.build(), floorMat, 'cave-sill-mounds', []));
    await ctx.yield();
    const caveDeep = slabs(GF.build(), caveMat, 'cave-formations', [-380, -300, -220, -150]);
    await ctx.yield();
    const stalGeo = GM.build(); stalGeo.setAttribute('aSt', new THREE.BufferAttribute(new Float32Array(stA), 2));
    const caveStal = slabs(stalGeo, smat(CAVE_VERT, CAVE_FRAG, { side: THREE.DoubleSide, defines: { STAL: 1 } }, { uFloorK: { value: 0 } }), 'cave-stalagmites', [-240, -205, -170]);
    await ctx.yield();
    // the shaft itself: slow rays of moonlight in the humid air, from the window down to the field
    const rays = fx.makeGodRays({ rng: xr.fork('rays'), time: U.uTime, position: [holeP.x, holeP.y, holeP.z], direction: [beamDir.x, beamDir.y, beamDir.z], radius: beamR * 0.8, count: 16, length: 114, width: [2, 4.6],
      color: C(H.moon), intensity: 0.22, falloff: 0.9, speed: 0.6, fogAmount: 0.3 });
    scene.add(rays.object);
    await ctx.yield();

    // the air standing in the mouth (AIR_FRAG): from down the passage a soft glow in the opening, bounded by the rock
    const airU = { uAirCol: { value: C(H.lamp).lerp(C(H.haze), 0.3).multiplyScalar(0.18) }, uAirK: { value: 0 } };
    const airMesh = new THREE.Mesh(new THREE.PlaneGeometry(900, 520), smat(AIR_VERT, AIR_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }, airU));
    airMesh.position.set(0, 150, 10); airMesh.updateMatrix(); airMesh.geometry.applyMatrix4(airMesh.matrix); airMesh.position.set(0, 0, 0); airMesh.updateMatrix();
    airMesh.renderOrder = 3.5; airMesh.frustumCulled = false; airMesh.name = 'mouth-air'; scene.add(airMesh);
    await ctx.yield();

    // roost carpets on the ceiling: shivering cards, strings of which peel off to join the rope
    let roost;
    {
      const NP = 38, per = 112, KEYS = [-0.035, 0.012, 0.05, 0.09, 0.135, 0.18, 0.225], perS = 48, n = NP * per + KEYS.length * perS, root = new Float32Array(n * 3), tgt = new Float32Array(n * 3), seed = new Float32Array(n * 4), rr = rng.fork('roost'), Q = V3();
      for (let p = 0; p < NP; p++) {
        const a0 = NO * rr.range(0.34, 0.66), z0 = rr.range(-440, -55), rad = rr.range(4, 8), ph0 = rr();
        hero.centerAt(hero.stationNear(Q.set(0, 98, Math.min(-10, z0 + 70))), Q);
        for (let i = 0; i < per; i++) {
          const j = p * per + i, rd = Math.sqrt(rr()) * rad, an = rr() * 6.2832;
          caveP(a0 + Math.cos(an) * rd / 1.4, z0 + Math.sin(an) * rd, P);
          root[j * 3] = P.x; root[j * 3 + 1] = P.y - 0.15; root[j * 3 + 2] = P.z;
          tgt[j * 3] = Q.x + rr.range(-3, 3); tgt[j * 3 + 1] = Q.y + rr.range(-3, 3); tgt[j * 3 + 2] = Q.z + rr.range(-8, 8);
          const peel = i < per * 0.16 ? 1 : 0;
          seed[j * 4] = rr(); seed[j * 4 + 1] = peel ? ph0 + i * 0.011 : rr(); seed[j * 4 + 2] = peel; seed[j * 4 + 3] = rr.range(0.36, 0.5);
        }
        if (p & 1) await ctx.yield();
      }
      // strings keyed to the path: each lets go of the ceiling just ahead of the lens and streams down across the
      // light to join the rope further on
      KEYS.forEach((uk, sIdx) => {
        const pa = path.pointAt(Math.max(0, uk) + 0.045, V3()), pb = path.pointAt(Math.max(0, uk) + 0.12, V3()), sd = sIdx % 2 ? 1 : -1;
        const rx = pa.x + sd * rr.range(4, 9); caveP(NO * 0.5 - rx / 1.9, pa.z, P); const a0 = NO * 0.5 - rx / 1.9;
        hero.centerAt(hero.stationNear(pb), Q);
        for (let i = 0; i < perS; i++) {
          const j = NP * per + sIdx * perS + i, rd = Math.sqrt(rr()) * 3.2, an = rr() * 6.2832;
          caveP(a0 + Math.cos(an) * rd / 1.4, pa.z + Math.sin(an) * rd, P);
          root[j * 3] = P.x; root[j * 3 + 1] = P.y - 0.15; root[j * 3 + 2] = P.z;
          tgt[j * 3] = Q.x + rr.range(-2, 2); tgt[j * 3 + 1] = Q.y + rr.range(-2, 2); tgt[j * 3 + 2] = Q.z + rr.range(-6, 6);
          seed[j * 4] = rr(); seed[j * 4 + 1] = uk + i * 0.0011; seed[j * 4 + 2] = 2; seed[j * 4 + 3] = rr.range(0.4, 0.52);
        }
      });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aRoot', new THREE.InstancedBufferAttribute(root, 3)); g.setAttribute('aTarget', new THREE.InstancedBufferAttribute(tgt, 3)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
      g.instanceCount = n;
      roost = new THREE.Mesh(g, smat(ROOST_VERT, ROOST_FRAG, { side: THREE.DoubleSide })); roost.frustumCulled = false; roost.name = 'roost'; scene.add(roost);
    }
    await ctx.yield();

    // drips from the tips, drips off the lip, and the ceiling waterfall 18 m to the left of the corkscrew
    let drips;
    {
      const top = [], dd = [], ss = [], rd = rng.fork('drips'), wf = path.pointAt(0.2, V3());
      const nTip = Math.min(tips.length, Math.round(240 * detail));
      for (let i = 0; i < nTip; i++) { const t = tips[i]; top.push(t[0], t[1], t[2]); dd.push(Math.max(20, t[1] - floorY(t[0], t[2])), rd.range(26, 40), rd(), rd.range(1.2, 2.6)); ss.push(0.035, 0); }
      for (let i = 0; i < 70; i++) { const x = rd.range(-42, 42); top.push(x, 119 - Math.abs(x) * 0.28 - rd.range(0, 9), rd.range(1, 9)); dd.push(100, rd.range(26, 40), rd(), rd.range(1.2, 2.6)); ss.push(0.035, 0); }
      caveP(NO * 0.5 - (wf.x + 19) / 1.9, wf.z, P); const wy = P.y, wx = wf.x + 19, wz = wf.z + 6;
      for (let i = 0; i < 170; i++) { top.push(wx + rd.range(-2.4, 2.4), wy + 3, wz + rd.range(-2.4, 2.4)); dd.push(wy - floorY(wx, wz), rd.range(26, 48), rd(), rd.range(5, 16)); ss.push(rd.range(0.05, 0.16), 1); }
      const n = top.length / 3, g = new THREE.InstancedBufferGeometry(), SEG = 4, pp = [], ix = [];
      for (let s = 0; s <= SEG; s++) pp.push(-1, s / SEG, 0, 1, s / SEG, 0);
      for (let s = 0; s < SEG; s++) { const b = s * 2; ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setIndex(ix);
      g.setAttribute('aTop', new THREE.InstancedBufferAttribute(new Float32Array(top), 3)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(dd), 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(ss), 2));
      g.instanceCount = n;
      drips = new THREE.Mesh(g, smat(DRIP_VERT, DRIP_FRAG, { side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, { uGain: { value: 0.55 } }));
      drips.frustumCulled = false; drips.renderOrder = 4; scene.add(drips);
    }
    await ctx.yield();
    // the stream: a jade wire on the floor running to the mouth
    {
      const pos = [], uv = [], ix = [], NS = 100;
      for (let i = 0; i <= NS; i++) {
        const z = lerp(-472, 14, i / NS), x = streamX(z), y = floorY(x, z) + 1.3, w = 3.4 + 1.6 * noise.n2(z * 0.03, 5);
        pos.push(x - w, y, z, x + w, y, z); uv.push(-1, z, 1, z);
        if (i < NS) { const b = i * 2; ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      scene.add(new THREE.Mesh(g, smat(STREAM_VERT, STREAM_FRAG, { side: THREE.DoubleSide })));
    }
    // dust in the humid air of the passage (the glow of the air itself is in the shaders: caveFog inside, uVeil on
    // what stands outside; no sheet hangs in the throat, where the rock would cut it into a pane)
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: U.uTime, count: Math.round(1100 * detail), box: [44, 28, 44], colors: [C(H.lamp), C(H.lamp).lerp(C('#ffffff'), 0.3), C(H.haze)], intensity: 0.45, size: [0.025, 0.06] });
    scene.add(dust.object);
    await ctx.yield();

    // ---- outside: the canopy, a closed sea of crowns rising from the cave floor in front of the mouth ----
    const hs = rng.range(0, 1000), CELL = 17, cr = { x: 0, z: 0, r: 0, h: 0, t: 0 };
    const hsh = (i, j, k) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + hs) * 43758.5453; return s - Math.floor(s); };
    const crownAt = (gx, gz) => { cr.x = (gx + 0.15 + 0.7 * hsh(gx, gz, 1)) * CELL; cr.z = (gz + 0.15 + 0.7 * hsh(gx, gz, 2)) * CELL; cr.r = 7.5 + 5.5 * hsh(gx, gz, 3); cr.h = 36 + 8 * hsh(gx, gz, 4); cr.t = hsh(gx, gz, 5); return cr; };
    const swell = (x, z) => noise.fbm2(x * 0.0035, z * 0.0035, 2) * 3;
    const rampZ = (z) => smoothstep(2, 30, z);                   // the forest stands right up to the sill
    // Left of the run the forest runs on (the left field, to x 780): there its floor rolls in hummocks 90 m across.
    // Beyond every field lies the plain: low ground, most of it under the mist's level, so far off the forest
    // stands in pools of mist and goes into haze.
    const LX1 = 780, LZ1 = 1040;
    const BX0 = -420, BX1 = 800, BZ0 = 748, BZ1 = 1320;          // and beyond the ridge the forest goes on: the back field
    const hummock = (x, z) => (x > 330 ? 4.5 * noise.fbm2(x * 0.011 + 3, z * 0.011 + 7, 2) * smoothstep(330, 520, x) : 0);
    const plainH = (x, z) => (35 + 1.6 * swell(x, z) + 7 * noise.fbm2(x * 0.0026 + 5, z * 0.0026 + 1, 2)) * rampZ(z);
    // ---- tower karst: fenglin stacks 85 to 125 m high standing out of the forest: [x, z, radius, top, phase, fine,
    // form]. Each is one irregular mass, taller than wide: sheer walls cut by vertical flutes, two or three clefts
    // running its full height, overhangs at different heights on different sides, one shoulder set back, a ragged
    // head under trees and hanging creepers. The path flies at the moon with A standing under it, then ducks
    // between A (right) and B (left), about 25 m from each; the others stand off for depth. And dolines: hollows
    // in the forest between them where the mist pools. ----
    const rtw = xr.fork('towers'), rtf = xr.fork('tower-form'), TB = 20;
    const towers = [[225, 309, 21, 112, 0, 1], [98, 348, 26, 120, 0, 1], [-28, 195, 24, 97, 0, 0], [-95, 120, 26, 100, 0, 0], [310, 450, 34, 126, 0, 0], [405, 200, 38, 124, 0, 0], [-45, 340, 30, 110, 0, 0], [40, 485, 32, 120, 0, 0], [275, 232, 22, 84, 0, 0]];
    for (const T of towers) {
      const j = T[5] ? 2 : 5, r = rtf; T[0] += rtw.range(-j, j); T[1] += rtw.range(-j, j); T[3] *= rtw.range(0.96, 1.05); T[4] = rtw() * 6.28;
      const F = { e: r.range(0.7, 0.9), ea: r() * 3.14, l3: r.range(0.06, 0.14), nf: 5 + Math.floor(r() * 4), lx: r.range(-0.07, 0.07), lz: r.range(-0.07, 0.07), cl: [], ov: [],
        sa: r() * 6.28, sh: r.range(0.48, 0.72), sw: r.range(0.7, 1.2), sd: r.range(0.18, 0.34) };
      const nc = 2 + (r() < 0.5 ? 1 : 0), a0 = r() * 6.28, wk = T[5] ? 1 : 1.5;
      for (let i = 0; i < nc; i++) F.cl.push({ a: a0 + (i + r.range(-0.22, 0.22)) * 6.2832 / nc, w: r.range(0.13, 0.2) * wk, d: r.range(0.36, 0.56), p: r() * 6.28 });
      const no = 4 + Math.floor(r() * 3);
      for (let i = 0; i < no; i++) F.ov.push({ a: r() * 6.28, w: r.range(0.5, 0.95), t: r.range(0.22, 0.86), A: r.range(0.14, 0.26), h: r.range(0.1, 0.22) });
      T[6] = F;
    }
    const dAng = (a, b) => { let d = (a - b) % 6.2832; if (d > 3.1416) d -= 6.2832; else if (d < -3.1416) d += 6.2832; return d; };
    const twO = { ao: 0 };
    // the head's height round the rim: ragged, and lower over the shoulder
    const towerTop = (T, a) => { const F = T[6], sd = dAng(a, F.sa); return T[3] + 7 * noise.n2(Math.cos(a) * 2.2 + T[4], Math.sin(a) * 2.2) + 2.5 * Math.sin(a * 3 + T[4]) - 9 * smoothstep(0.1, 0.5, noise.n2(Math.cos(a) * 4.1, Math.sin(a) * 4.1 + T[4])) - 10 * Math.exp(-(sd * sd) / (F.sw * F.sw)); };
    // radius at angle a, at t = 0 (foot, y = TB) .. 1 (rim); leaves how deep in a cleft or under a lip it is in twO.ao
    const towerRad = (T, a, t) => {
      const F = T[6], ph = T[4], R = T[2], ce = Math.cos(a - F.ea), se = Math.sin(a - F.ea);
      let r = R * F.e / Math.sqrt(F.e * F.e * ce * ce + se * se), ao = 0;
      r *= 1 + F.l3 * Math.sin(a * 3 + ph + t * 1.2) + 0.05 * Math.sin(a * 5 - ph * 2 + t * 2.5);
      r *= (1 - 0.04 * t) * (1 + 0.22 * Math.pow(1 - t, 5));
      const sd = dAng(a, F.sa); r *= 1 - F.sd * smoothstep(F.sh - 0.03, F.sh + 0.03, t + 0.05 * noise.n2(a * 2 + ph, 3.3)) * Math.exp(-(sd * sd) / (F.sw * F.sw));
      for (const o of F.ov) {                          // under each lip the wall steps in at once and heals downward; above it the rock stands out
        const d = dAng(a, o.a), wg = Math.exp(-(d * d) / (o.w * o.w)), below = o.t + 0.03 * Math.sin(a * 4 + o.a * 7) - t;
        if (below > 0) { const k = wg * Math.exp(-below / o.h); r -= R * o.A * k * smoothstep(0, 0.014, below); ao = Math.max(ao, k * 0.8); } else r += R * o.A * 0.35 * wg * Math.exp(below / (o.h * 0.6));
      }
      for (const c of F.cl) {                          // clefts: slots the full height, wandering a little, deepest half way in
        const d = dAng(a, c.a + 0.12 * Math.sin(t * 5 + c.p) + 0.05 * Math.sin(t * 13 + c.p * 2)), k = Math.exp(-Math.pow(Math.abs(d) / c.w, 2.6)) * (0.78 + 0.22 * Math.sin(t * 3.1 + c.p));
        r -= R * c.d * k * smoothstep(-0.02, 0.1, t); ao = Math.max(ao, k);
      }
      r += R * 0.04 * Math.sin(a * F.nf * 2 + ph * 3 + 0.7 * Math.sin(t * 4 + a * 3)) * (0.4 + 0.6 * smoothstep(0.1, 0.5, t));     // flutes
      r += 1.7 * noise.fbm2(Math.cos(a) * 3 + ph, t * 5 + Math.sin(a) * 3, 2);
      if (T[5]) { const by = Math.floor(t * 11 + ph), bx = Math.floor(a * 6 + by * 1.7); r += 1.5 * (hsh(bx, by, 7) - 0.45) * (hsh(bx, by, 11) < 0.55 ? 1 : 0.2); }     // blocks standing proud, blocks fallen out
      if (t > 0.92) { const q = (t - 0.92) / 0.08; r *= 1 - 0.2 * q * q; }
      twO.ao = clamp(ao, 0, 1); return Math.max(r, R * 0.22);
    };
    // a point on the head: k = 1 at the rim, 0 at the middle
    const towerCap = (T, a, k, out) => {
      const top = towerTop(T, a), r = towerRad(T, a, 1) * k, F = T[6], y = top + (1 - k * k) * 1.5 + 2.6 * noise.n2(a * 3 + T[4], k * 4);
      return out.set(T[0] + Math.cos(a) * r + F.lx * (y - TB), y, T[1] + Math.sin(a) * r + F.lz * (y - TB));
    };
    const inTower = (x, z, m) => towers.some((T) => Math.hypot(x - T[0], z - T[1]) < T[2] * 1.22 + m);
    const dolines = [[130, 150, 80, 16], [160, 430, 85, 17], [40, 262, 70, 14], [280, 330, 70, 14], [-70, 205, 65, 13]];
    const doline = (x, z) => {
      let d = 8 * smoothstep(0.08, 0.5, noise.fbm2(x * 0.0045 + 9, z * 0.0045 + 2, 2));
      for (const [cx, cz, r, k] of dolines) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1) d = Math.max(d, k * (1 - q * q) * (1 - q * q)); }
      return d * smoothstep(40, 110, z);
    };
    const ci = { t: -1 };
    function canopyH(x, z) {
      const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL); let best = 33 + 1.5 * noise.n2(x * 0.05, z * 0.05); ci.t = -1;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        crownAt(gx + i, gz + j); const d2 = (x - cr.x) * (x - cr.x) + (z - cr.z) * (z - cr.z), r2 = cr.r * cr.r;
        if (d2 < r2) { const q = 1 - d2 / r2, h = cr.h - cr.r * 0.3 + cr.r * 0.55 * q - Math.max(0, cr.h - cr.r * 0.3 - 34.5) * (1 - q) * (1 - q) * (1 - q); if (h > best) { best = h; ci.t = cr.t; } }
      }
      return (best + swell(x, z) - doline(x, z) + hummock(x, z)) * rampZ(z);
    }
    const cA = C(H.canopyA), cB = C(H.canopyB), cC = C(H.canopyC);
    const crownCol = (t, out) => (t < 0 ? out.copy(cB).multiplyScalar(0.5) : t < 0.45 ? out.copy(cA) : t < 0.8 ? out.copy(cB).lerp(cA, 0.35) : out.copy(cC));
    const NX0 = -170, NX1 = 330, NZ1 = 800;
    // The hollows between the crowns and the dolines are levelled at the mist's base: what lies under the vapour is
    // one even pool, not the floor's own slopes showing through it as flat planes.
    const FLOORY = 35.5;
    let leftField = null;
    const canopyMat = smat(CANOPY_VERT, CANOPY_FRAG, { defines: { ...CDEF } });
    {
      const g = acc(), nx = deep ? 72 : 92, nz = deep ? 110 : 142;                    // under the cloud sea the floor is all but drowned
      for (let i = 0; i < nx; i++) {
        const x = lerp(NX0, NX1, i / (nx - 1));
        for (let j = 0; j < nz; j++) {
          const z = lerp(0, NZ1, j / (nz - 1)), edge = smoothstep(0, 45, Math.min(x - NX0, NZ1 - z));
          const h = Math.max(lerp(plainH(x, z), canopyH(x, z), edge), FLOORY * rampZ(z));
          crownCol(ci.t, tc); g.v(x, h, z, tc, (0.3 + 0.8 * smoothstep(34, 44, h)) * (0.92 + 0.16 * noise.n2(x * 0.06, z * 0.06)));      // no value of its own at each vertex: that draws the mesh's triangles
        }
        if (i & 1) await ctx.yield();
      }
      g.gridUp(0, nx, nz); scene.add(new THREE.Mesh(g.build(), canopyMat));
      await ctx.yield();
      // the left field: the same forest on a coarser mesh (9.8 m), rows from far to near so that from inside the
      // cave only the far rows the keyhole can show are drawn (leftField.rows, see update)
      {
        const gl2 = acc(), x0 = NX1 - 12, nxl = deep ? 24 : 48, nzl = deep ? 54 : 107;      // under the cloud sea it is drowned: a coarse floor is enough
        for (let j = 0; j < nzl; j++) {
          const z = lerp(LZ1, 0, j / (nzl - 1));
          for (let i = 0; i < nxl; i++) {
            const x = lerp(x0, LX1, i / (nxl - 1)), edge = smoothstep(0, 60, Math.min(LX1 - x, LZ1 - z));
            const h = Math.max(lerp(plainH(x, z), canopyH(x, z), edge), FLOORY * rampZ(z)) - (i === 0 ? 1.5 : 0);
            crownCol(ci.t, tc); gl2.v(x, h, z, tc, (0.3 + 0.8 * smoothstep(34, 44, h)) * (0.92 + 0.16 * noise.n2(x * 0.06, z * 0.06)));
          }
          if ((j & 3) === 3) await ctx.yield();
        }
        gl2.gridUp(0, nzl, nxl);
        leftField = new THREE.Mesh(gl2.build(), canopyMat); leftField.frustumCulled = false; leftField.name = 'left-field'; scene.add(leftField);
        leftField.userData.rowTris = (nxl - 1) * 6; leftField.userData.dz = LZ1 / (nzl - 1); leftField.userData.rows = nzl - 1;
      }
      await ctx.yield();
      const gf = acc(), fx0 = -2600, fx1 = 2800, fz1 = 3800, mx = 73, mz = 52;
      for (let i = 0; i < mx; i++) for (let j = 0; j < mz; j++) {
        const x = lerp(fx0, fx1, i / (mx - 1)), z = lerp(0, fz1, Math.pow(j / (mz - 1), 1.6));
        const inside = (x > NX0 + 50 && x < NX1 - 50 && z < NZ1 - 50) || (x >= NX1 - 50 && x < LX1 - 80 && z < LZ1 - 80) || (x > BX0 + 80 && x < BX1 - 80 && z < BZ1 - 80 && z > (x > NX0 + 50 ? NZ1 - 51 : BZ0 + 80));
        tc.copy(cA).lerp(cB, hsh(i, j, 3)); gf.v(x, plainH(x, z) - (inside ? 14 * rampZ(z) : 0), z, tc, 0.95);
      }
      gf.gridUp(0, mx, mz); scene.add(new THREE.Mesh(gf.build(), canopyMat));
    }
    await ctx.yield();
    // ---- the back field: beyond the ridge the same forest goes on for 570 m more (crowns 11 m apart on the mesh,
    // rows widening with distance), its hollows wider and deeper so mist lies in pools between the moonlit crowns,
    // and behind them the ground climbs 45 m; seen through the notch behind the ring and over the ridge's saddles. It joins the near field and the left
    // field along their far edges and leaves out what the left field already covers. ----
    let backField = null;
    {
      const gb = acc(), nxb = 112, nzb = 38, zs = [];
      for (let j = 0; j < nzb; j++) { const t = j / (nzb - 1); zs.push(BZ0 + (BZ1 - BZ0) * (0.55 * t + 0.45 * t * t)); }
      for (let j = 0; j < nzb; j++) {
        const z = zs[j];
        for (let i = 0; i < nxb; i++) {
          const x = lerp(BX0, BX1, i / (nxb - 1)), joined = x > NX0 + 45 && x < LX1 - 60;
          const edge = smoothstep(0, 60, Math.min(x - BX0, BX1 - x, BZ1 - z, joined ? 1e9 : z - BZ0));
          const pool = 9 * smoothstep(0.1, 0.55, noise.fbm2(x * 0.004 + 70, z * 0.004 + 13, 2)) * smoothstep(BZ0 + 30, BZ0 + 130, z) * (1 - smoothstep(880, 1000, z));
          const rise = 46 * smoothstep(900, 1190, z) * (0.8 + 0.2 * noise.fbm2(x * 0.0031 + 11, z * 0.0031 + 5, 2));      // and the ground climbs away behind the hollows, so the forest stands up into view through the notch
          const h0 = canopyH(x, z) - pool, h = Math.max(lerp(plainH(x, z), h0 + rise, edge), FLOORY);
          crownCol(ci.t, tc); gb.v(x, h, z, tc, (0.3 + 0.8 * smoothstep(34, 44, h0)) * (0.92 + 0.16 * noise.n2(x * 0.06, z * 0.06)));
        }
        if (j & 1) await ctx.yield();
      }
      const hole = (i, j) => lerp(BX0, BX1, i / (nxb - 1)) > NX1 + 15 && zs[j] < LZ1 - 80;
      for (let j = 0; j < nzb - 1; j++) for (let i = 0; i < nxb - 1; i++) {
        if (hole(i, j) && hole(i + 1, j) && hole(i, j + 1) && hole(i + 1, j + 1)) continue;
        const a = j * nxb + i; gb.idx.push(a, a + nxb, a + 1, a + 1, a + nxb, a + nxb + 1);
      }
      backField = new THREE.Mesh(gb.build(), canopyMat); backField.frustumCulled = false; backField.name = 'back-field'; scene.add(backField);
    }
    await ctx.yield();
    // emergents (tualang, Shorea): where they stand; their umbrella crowns are built from the same lumpy domes as the tufts
    const emerg = [];
    {
      const re = rng.fork('emergents'), tp = V3(), tt = V3(), nE = Math.round(lerp(26, 34, (density - 0.7) / 0.6));
      for (let i = 0; i < nE; i++) {
        const near = i < 12, u = near ? lerp(0.42, 0.8, (i + re()) / 12) : re.range(0.5, 0.8);
        path.pointAt(u, tp); path.tangentAt(u, tt); tt.y = 0; tt.normalize();
        const lat = near ? re.range(-15, 15) : (re() < 0.5 ? -1 : 1) * re.range(28, 150), x = tp.x - tt.z * lat, z = tp.z + tt.x * lat;
        const top = near ? Math.min(73, tp.y - 8.5 - re.range(0, 2.5)) : re.range(58, 71), rot = re() * 6.28, R = re.range(10.5, 13.5);
        if (emerg.some((e) => Math.hypot(e.x - x, e.z - z) < 24) || inTower(x, z, 16)) continue;
        emerg.push({ x, z, top, rot, R });
      }
    }
    // ---- leaf clumps: one lumpy dome, instanced for the canopy's cauliflower and the ridge scrub; its rim is eaten
    // by leaf-scale noise in the shader, so it never shows as a polygon ----
    const WHITE = new THREE.Color(1, 1, 1);
    const clump = (g, cx, cy, cz, r, ry, seg, rings, tint, ph) => {
      const i0 = g.pos.length / 3;
      for (let e = 0; e <= rings; e++) {
        const v = e / rings, el = -0.85 + v * (Math.PI / 2 + 0.85 - 0.22), y = Math.sin(el), c = Math.cos(el);
        for (let k = 0; k < seg; k++) {
          const a = (k / seg) * 6.2832 + e * 0.5, l = 1 + 0.17 * Math.sin(k * 2.4 + e * 1.7 + ph) + 0.10 * Math.sin(k * 5.1 + e * 3.3 + ph * 2.3);
          g.v(cx + Math.cos(a) * c * l * r, cy + (y > 0 ? y * ry : y * ry * 0.55) * (0.92 + 0.14 * Math.sin(k * 1.3 + e + ph)), cz + Math.sin(a) * c * l * r, WHITE, tint * (0.34 + 0.86 * v));
        }
      }
      const top = g.v(cx, cy + ry * 1.0, cz, WHITE, tint * 1.25), bot = g.v(cx, cy - ry * 0.42, cz, WHITE, tint * 0.25);
      for (let e = 0; e < rings; e++) for (let k = 0; k < seg; k++) { const a = i0 + e * seg + k, b = i0 + e * seg + (k + 1) % seg; g.quad(b, a, b + seg, a + seg); }
      for (let k = 0; k < seg; k++) { g.idx.push(i0 + rings * seg + (k + 1) % seg, i0 + rings * seg + k, top); g.idx.push(i0 + k, i0 + (k + 1) % seg, bot); }
    };
    const tuftMat = smat(CANOPY_VERT, CANOPY_FRAG, { defines: { TUFT: 1, ...CDEF }, side: THREE.DoubleSide });
    const plainMat = smat(CANOPY_VERT, CANOPY_FRAG, { defines: { TUFT: 1, PLAIN: 1, ...CDEF }, side: THREE.DoubleSide });
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), UPY = V3(0, 1, 0);
    // items: [x, y, z, sx, sy, sz, yaw, r, g, b]
    const instanced = (geo, mat, items) => {
      const n = items.length, im = new THREE.InstancedMesh(geo, mat, Math.max(1, n)), ic = new Float32Array(Math.max(1, n) * 3);
      items.forEach((t, i) => { q4.setFromAxisAngle(UPY, t[6]); m4.compose(V3(t[0], t[1], t[2]), q4, V3(t[3], t[4], t[5])); im.setMatrixAt(i, m4); ic[i * 3] = t[7]; ic[i * 3 + 1] = t[8]; ic[i * 3 + 2] = t[9]; });
      geo.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 3)); im.count = n; im.frustumCulled = false; scene.add(im); return im;
    };
    // From inside the cave only what stands in the cone through the mouth can be seen. gateOf(x, z) is how deep in
    // the cave (metres behind the mouth plane) the lens can be and still see a thing standing at (x, z) outside,
    // with 30 m to spare; instanced things are ordered by it, deepest first, and each frame only those are drawn.
    const gateOf = (x, z) => { const ax = Math.abs(x) - 64; return ax <= 0 ? 1e6 : Math.min(1e6, 64 * Math.max(z, 1) / ax); };
    const byGate = (p, q) => gateOf(q[0], q[2]) - gateOf(p[0], p[2]), gated = [];
    const gate = (im, items) => { gated.push([im, items.map((t) => gateOf(t[0], t[2]))]); return im; };
    // Outside, the crowns are instanced in buckets along the flight (by the u of the path's nearest point), each
    // ordered by its gate; a bucket every one of whose crowns lies behind the lens's plane is not drawn (culls: the
    // instanced mesh, and x, y, z, radius of each of its crowns; see update).
    const culls = [];
    const bucketed = (geo, mat, items, rad, main = 0) => {
      const B = new Map(); let first = true;
      for (const it of items) { const k = Math.min(8, Math.max(0, Math.floor((path.nearestXZ(it[0], it[2]).u - 0.28) / 0.07))); if (!B.has(k)) B.set(k, []); B.get(k).push(it); }
      for (const [, its] of B) {
        its.sort(byGate);
        const im = gate(instanced(first ? geo : geo.clone(), mat, its), its), a = new Float32Array(its.length * 4); first = false;
        its.forEach((t, i) => { a[i * 4] = t[0]; a[i * 4 + 1] = t[1]; a[i * 4 + 2] = t[2]; a[i * 4 + 3] = rad * Math.max(t[3], t[4], t[5]); });
        culls.push({ im, a, main });
      }
    };
    const tuftGeo = (ry = 0.62) => { const g = acc(); clump(g, 0, 0, 0, 1, ry, 8, 3, 1, 0.7); return g.build(); };
    {
      const list = [], rt = rng.fork('tufts'), lobes = [], rlb = xr8.fork('lobes'), rlb2 = xr9.fork('lobes');
      let nq = 0;
      for (let gx = Math.floor(NX0 / CELL); gx < NX1 / CELL; gx++) for (let gz = 1; gz < NZ1 / CELL; gz++) {
        if ((++nq & 255) === 0) await ctx.yield();
        crownAt(gx, gz); const d = path.nearestXZ(cr.x, cr.z).dist; if (d > 160 || cr.z < 14 || inTower(cr.x, cr.z, cr.r * 0.4)) continue;
        const base = (cr.h + cr.r * 0.25 + swell(cr.x, cr.z) - doline(cr.x, cr.z)) * rampZ(cr.z), R = cr.r * 0.8;
        if (d < 23) {                                  // the crowns the lens passes over: three lobes round each, so its outline is a cauliflower's, not one dome's
          const a0 = rlb() * 6.2832;
          for (let k = 0; k < 3; k++) { const a = a0 + k * 2.094 + rlb.range(-0.4, 0.4), o = cr.r * rlb.range(0.6, 0.82), r2 = cr.r * rlb.range(0.34, 0.47); lobes.push([cr.x + Math.cos(a) * o, base - cr.r * rlb.range(0.34, 0.5), cr.z + Math.sin(a) * o, r2, r2 * rlb.range(0.95, 1.25), r2, cr.t]); }
        }
        else if (d < 36) {                             // and two on each crown of the next rank out
          const a0 = rlb2() * 6.2832;
          for (let k = 0; k < 2; k++) { const a = a0 + k * 3.1416 + rlb2.range(-0.6, 0.6), o = cr.r * rlb2.range(0.6, 0.82), r2 = cr.r * rlb2.range(0.34, 0.47); lobes.push([cr.x + Math.cos(a) * o, base - cr.r * rlb2.range(0.34, 0.5), cr.z + Math.sin(a) * o, r2, r2 * rlb2.range(0.95, 1.25), r2, cr.t]); }
        }
        list.push([d, cr.x, base - R * 0.2, cr.z, R, R * 0.85, cr.t]);
        if (d < 95) { const a = rt() * 6.2832, o = cr.r * rt.range(0.45, 0.75), r2 = cr.r * rt.range(0.4, 0.55); list.push([d + 30, cr.x + Math.cos(a) * o, base - cr.r * 0.3, cr.z + Math.sin(a) * o, r2, r2 * 0.95, cr.t]); }
      }
      list.sort((a, b) => a[0] - b[0]); list.length = Math.min(list.length, Math.round((deep ? 400 : 480) * detail));      // under the cloud sea the far crowns are drowned
      const items = list.map((t) => { crownCol(t[6], tc); const k = 0.85 + 0.4 * rt(); return [t[1], t[2], t[3], t[4], t[5], t[4], rt() * 6.2832, tc.r * k, tc.g * k, tc.b * k]; });
      const rk = xr.fork('bank');
      for (let n = 0; n < 46; n++) {                   // young crowns on the bank below the mouth, stepping up to the canopy
        const x = rk.range(-66, 66), z = rk.range(5, 31), R = rk.range(4, 7.5), h = canopyH(x, z);
        crownCol(rk(), tc); const k = 0.8 + 0.45 * rk();
        items.push([x, h + R * 0.12, z, R, R * 0.8, R, rk() * 6.2832, tc.r * k, tc.g * k, tc.b * k]);
      }
      for (const T of towers) for (let n = 0, nn = T[5] ? 14 : 9; n < nn; n++) {        // trees on the towers' heads, some leaning out over the rim
        const a = rk() * 6.2832, R = n === 0 ? rk.range(6, 8) : rk.range(3, 5.6);
        towerCap(T, a, n === 0 ? 0 : rk.range(0.25, 0.92), P);
        crownCol(rk(), tc); const k = 0.9 + 0.4 * rk();
        items.push([P.x, P.y + R * 0.35, P.z, R, R * 0.8, R, rk() * 6.2832, tc.r * k, tc.g * k, tc.b * k]);
      }
      await ctx.yield();
      bucketed(tuftGeo(), tuftMat, items, 1.35);
      await ctx.yield();
      // ---- the forest beyond the near tufts: a lower dome on every crown further out, first of all on those left of
      // the run (where the flight looks across the forest at the moon), out to 280 m from the path there (beyond, the floor's own shading draws the crowns); and the
      // lobes of the near crowns. One mesh of low domes. ----
      const dCut = list.length ? list[list.length - 1][0] : 60, cand = [], tq = V3(), rfa = xr8.fork('far-tufts');
      let nc = 0;
      for (let gx = Math.floor(NX0 / CELL); gx < (LX1 - 70) / CELL; gx++) for (let gz = 1; gz < (LZ1 - 80) / CELL; gz++) {
        if ((++nc & 255) === 0) await ctx.yield();
        crownAt(gx, gz); if (cr.z < 40 || inTower(cr.x, cr.z, cr.r * 0.4)) continue;
        const np = path.nearestXZ(cr.x, cr.z), d = np.dist; if (d <= dCut || d > 280) continue;
        const dx = cr.x - seat.position.x, dz = cr.z - seat.position.z, sR = dx * sideL.x + dz * sideL.z, tR = dx * fwd.x + dz * fwd.z - 0.00035 * sR * sR;
        if (Math.abs(tR) < 72) continue;                                 // under the ridge
        path.pointAt(np.u, P); path.tangentAt(np.u, tq);
        const left = (cr.x - P.x) * tq.z - (cr.z - P.z) * tq.x > 0 && np.u > 0.3 && np.u < 0.68;
        if (!left && d > 150) continue;
        cand.push([d / (left ? 2.6 : 1), cr.x, cr.z, cr.r, cr.h, cr.t]);
      }
      cand.sort((a, b) => a[0] - b[0]); cand.length = Math.min(cand.length, Math.round((deep ? 60 : 460) * detail));
      const lows = [];
      for (const [, x, z, r, h, t] of cand) {
        const base = (h + r * 0.25 + swell(x, z) - doline(x, z) + hummock(x, z)) * rampZ(z), R = r * rfa.range(0.88, 1.02);
        crownCol(t, tc); const k = 0.85 + 0.4 * rfa(); lows.push([x, base - R * 0.24, z, R, R * rfa.range(0.95, 1.2), R, rfa() * 6.2832, tc.r * k, tc.g * k, tc.b * k]);
      }
      for (const [x, y, z, r, ry, r3, t] of lobes) { crownCol(t, tc); const k = 0.8 + 0.4 * rfa(); lows.push([x, y, z, r, ry, r3, rfa() * 6.2832, tc.r * k, tc.g * k, tc.b * k]); }
      const lg = acc(); clump(lg, 0, 0, 0, 1, 0.62, 6, 2, 1, 2.3);
      bucketed(lg.build(), tuftMat, lows, 1.35);
    }
    await ctx.yield();
    let trunkGeo = null;
    // ---- emergents (tualang, Shorea): a pale buttressed trunk forking into limbs that carry an umbrella of leaf
    // clumps in tiers, with dark gaps between them. Built in metres for a 12 m crown radius; origin at the fork. ----
    // Each geometry holds its main parts first (the limbs and the clump at the end of each, the top of the umbrella)
    // and its detail after them (the satellite clumps, the under-tier); leafMain and woodMain are the index counts of
    // the main parts, which is all that is drawn of a crown more than 220 m from the lens.
    const crownGeo = (rs, hi, nSat = hi ? 3 : 1) => {
      const leafA = acc(), woodA = acc(), leafB = acc(), woodB = acc(), cW = C('#b9b29c'), nL = hi ? 7 : 5, seg = hi ? 8 : 6, rings = 3, a0 = rs() * 6.28;
      let leaf = leafA, wood = woodA;
      const limb = (p0, p1, p2, r0, r1) => {
        const SEG = hi ? 5 : 3, SD = hi ? 5 : 4, i0 = wood.pos.length / 3, t3 = V3(), nn = V3(), bb = V3(), pp = V3();
        for (let s = 0; s <= SEG; s++) {
          const t = s / SEG, w0 = (1 - t) * (1 - t), w1 = 2 * t * (1 - t), w2 = t * t;
          pp.set(p0.x * w0 + p1.x * w1 + p2.x * w2, p0.y * w0 + p1.y * w1 + p2.y * w2, p0.z * w0 + p1.z * w1 + p2.z * w2);
          t3.set((p1.x - p0.x) * (1 - t) + (p2.x - p1.x) * t, (p1.y - p0.y) * (1 - t) + (p2.y - p1.y) * t, (p1.z - p0.z) * (1 - t) + (p2.z - p1.z) * t).normalize();
          nn.set(t3.z, 0, -t3.x); if (nn.lengthSq() < 1e-4) nn.set(1, 0, 0); nn.normalize(); bb.crossVectors(t3, nn);
          const r = lerp(r0, r1, t);
          for (let k = 0; k < SD; k++) { const a = (k / SD) * 6.2832; wood.v(pp.x + (nn.x * Math.cos(a) + bb.x * Math.sin(a)) * r, pp.y + (nn.y * Math.cos(a) + bb.y * Math.sin(a)) * r, pp.z + (nn.z * Math.cos(a) + bb.z * Math.sin(a)) * r, cW, 0.42 + 0.3 * t + 0.12 * (k % 2)); }
        }
        for (let s = 0; s < SEG; s++) for (let k = 0; k < SD; k++) { const a = i0 + s * SD + k, b = i0 + s * SD + (k + 1) % SD; wood.quad(a, b, a + SD, b + SD); }
      };
      for (let i = 0; i < nL; i++) {
        const a = a0 + (i / nL) * 6.2832 + rs.range(-0.25, 0.25), ca = Math.cos(a), sa = Math.sin(a), out = rs.range(7.2, 9.6), h = rs.range(5.4, 7.6), tint = rs.range(0.82, 1.15);
        const end = V3(ca * out, h, sa * out), mid = V3(ca * out * 0.5, h * 0.62, sa * out * 0.5);
        limb(V3(0, -2.5, 0), V3(ca * out * 0.22, h * 0.75, sa * out * 0.22), end, 0.5, 0.14);
        clump(leaf, end.x, end.y + 0.6, end.z, rs.range(3.4, 4.5), rs.range(1.5, 2.1), seg, rings, tint, rs() * 6.28);                    // the limb's crown
        const nS = nSat;
        leaf = leafB; wood = woodB;
        for (let k = 0; k < nS; k++) {                                                                                                 // satellites round it, lower
          const b = a + (k - 1) * 1.15 + rs.range(-0.3, 0.3), o = rs.range(2.6, 4.2), r2 = rs.range(1.9, 2.8);
          clump(leaf, end.x + Math.cos(b) * o, end.y - rs.range(0.6, 2.1), end.z + Math.sin(b) * o, r2, r2 * 0.55, seg, rings, tint * rs.range(0.8, 1.05), rs() * 6.28);
        }
        if (hi || i % 2 === 0) {                                                                                                       // an under-tier on a side branch
          const b = a + rs.range(0.35, 0.6) * (i % 2 ? 1 : -1), o2 = out * rs.range(0.55, 0.75), e2 = V3(Math.cos(b) * o2, h * rs.range(0.25, 0.42), Math.sin(b) * o2);
          limb(mid, V3((mid.x + e2.x) * 0.5, mid.y, (mid.z + e2.z) * 0.5), e2, 0.24, 0.1);
          clump(leaf, e2.x, e2.y + 0.4, e2.z, rs.range(2.4, 3.3), rs.range(1.0, 1.4), seg, rings, tint * 0.78, rs() * 6.28);
        }
        leaf = leafA; wood = woodA;
      }
      for (let k = 0; k < (hi ? 4 : 2); k++) {                                                                                         // the top of the umbrella
        const a = a0 + k * 1.7 + 0.4, o = k === 0 ? 0 : rs.range(2.5, 4.5), r2 = rs.range(3.2, 4.3);
        if (k === 0) limb(V3(0, -2.5, 0), V3(0.3, 3, -0.2), V3(0, 8.2, 0), 0.5, 0.14);
        clump(leaf, Math.cos(a) * o, rs.range(8.2, 9.4), Math.sin(a) * o, r2, r2 * 0.5, seg, rings, rs.range(0.95, 1.2), rs() * 6.28);
      }
      const join = (A, B) => { const o = A.pos.length / 3, n = A.idx.length; for (const v of B.pos) A.pos.push(v); for (const v of B.col) A.col.push(v); for (const i of B.idx) A.idx.push(i + o); return n; };
      const leafMain = join(leafA, leafB), woodMain = join(woodA, woodB);
      return { leaf: leafA.build(), wood: woodA.build(), leafMain, woodMain };
    };
    {
      const re2 = rng.fork('crowns'), cT = C('#b9b29c'), hiE = emerg.slice().sort((a, b) => path.nearestXZ(a.x, a.z).dist - path.nearestXZ(b.x, b.z).dist).slice(0, 10), loE = emerg.filter((e) => !hiE.includes(e));
      const item = (e, k) => { crownCol(e.sh, tc); const s = e.R / 12; return [e.x, e.top - 11 * s, e.z, s, s, s, e.rot, tc.r * k, tc.g * k, tc.b * k]; };
      for (const e of emerg) e.sh = 0.5 + 0.5 * re2();
      for (const [set, hi] of [[hiE, true], [loE, false]]) {
        if (!set.length) continue;
        const cg = crownGeo(re2, hi);
        const li = set.map((e) => item(e, 1.05 + 0.3 * re2())).sort(byGate), wi = set.map((e) => { const it = item(e, 1); it[7] = it[8] = it[9] = 1; return it; }).sort(byGate);
        bucketed(cg.leaf, tuftMat, li, 15.5, cg.leafMain); bucketed(cg.wood, plainMat, wi, 15.5, cg.woodMain);
        await ctx.yield();
      }
      // trunks: pale, bare, buttressed at the foot
      const tg = new THREE.CylinderGeometry(0.55, 1.15, 1, 8, 5, true), tpn = tg.attributes.position, tcol = new Float32Array(tpn.count * 3);
      for (let v = 0; v < tpn.count; v++) {
        const y = tpn.getY(v) + 0.5, a = Math.atan2(tpn.getZ(v), tpn.getX(v)), fl = 1 + 0.5 * Math.pow(1 - y, 6) * (1 + 0.6 * Math.sin(a * 4));
        tpn.setXYZ(v, tpn.getX(v) * fl, y, tpn.getZ(v) * fl); const k = 0.34 + 0.3 * y + 0.1 * Math.sin(y * 31 + a * 2);
        tcol[v * 3] = cT.r * k; tcol[v * 3 + 1] = cT.g * k; tcol[v * 3 + 2] = cT.b * k * 0.95;
      }
      tg.setAttribute('aCol', new THREE.BufferAttribute(tcol, 3)); tg.deleteAttribute('uv'); tg.computeVertexNormals();
      const ti = emerg.map((e) => { const s = e.R / 12, y0 = 16, y1 = e.top - 13 * s, r = 0.085 * e.R; return [e.x, y0, e.z, r, y1 - y0, r, e.rot, 1, 1, 1]; }).sort(byGate);
      bucketed(tg, plainMat, ti, 1.15);
      trunkGeo = tg;
    }
    await ctx.yield();

    // ---- the giants of the run. From the mouth to the duck under the rope the lens flies among the tallest trees
    // of the forest: tualang and Shorea whose flat umbrella crowns, 26 m across on bare pale trunks 60 m and more
    // high, pass under and beside it, now left, now right, one almost underneath; one of them is laced from its
    // foot to its fork by a strangler fig. In the gaps between the crowns stand fan palms, and rattans lift their
    // rosettes of feather fronds out of the crowns they climb. ----
    const giants = [];
    {
      const rg = xr9.fork('giants'), rz = xr10.fork('giants'), tp = V3(), tt = V3();
      for (let i = 0; i < 36; i++) rg();               // (the draws this fork gave to an earlier layout are still taken, so the crowns' own shapes stay as they were)
      // One rule for the whole outdoor run, from the foot of the bank under the mouth (58 m out from the cliff: the
      // bank itself is talus and young trees) to the point under the river's crossing: a giant is sown every 20 to
      // 30 m of route (drawn), on alternate sides, 4 to 26 m off the line (drawn), its crown radius drawn, its top
      // 4 to 13 m under the route's height at the nearest point of the route (drawn; a crown that reaches under the
      // line itself passes 8.5 m or more under the lens). It stands where it is sown if the ground there is free:
      // not on a tower or its apron, 19 m from every other emergent and 25 m from the next giant, and its crown 3 m
      // or more under the rope's lowest sway wherever the rope passes over it (there it may stand lower, to the 13 m
      // of the rule). If the ground is taken it stands a little further along or back, then nearer to or further
      // from the line on its own side, then on the other side; and if no such place is free, not at all.
      // (The brief has emergents to 72 m under a route at 80 m; this route runs at 94 to 101 m, so with the brief's
      // own clearance under the lens these tops stand at 81 to 97 m.)
      let dBank = dMouth; for (; dBank < dDuck; dBank += 2) { path.posAtDist(dBank, tp); if (tp.z >= 58) break; }
      let side = rz() < 0.5 ? -1 : 1;
      for (let d = dBank + rz.range(0, 10); d < dDuck; d += rz.range(20, 30)) {
        const m0 = rz.range(4, 26), R = rz.range(12, 13.5), rot = rz() * 6.28, sh = 0.5 + 0.5 * rz(), und = rz.range(4, 13), jd = rz.range(-3, 3);
        const mags = [m0, m0 + 6, m0 - 6, m0 + 12, m0 - 12, m0 + 18, m0 - 18].filter((m) => m >= 4 && m <= 26);
        let done = false;
        for (let tr = 0; tr < mags.length * 10 && !done; tr++) {
          const sd = tr < mags.length * 5 ? side : -side, lat = sd * mags[Math.floor(tr / 5) % mags.length], dd = d + jd + [0, 5, -5, 9, -9][tr % 5];
          path.posAtDist(dd, tp); path.tangentAtDist(dd, tt); tt.y = 0; tt.normalize();
          const x = tp.x - tt.z * lat, z = tp.z + tt.x * lat;
          if (z < 58 || emerg.some((e) => Math.hypot(e.x - x, e.z - z) < 19) || giants.some((e) => Math.hypot(e.x - x, e.z - z) < 25) || inTower(x, z, 15)) continue;
          const np = path.nearestXZ(x, z); if (np.dist < Math.abs(lat) - 3) continue;
          let top = np.y - Math.max(und, lerp(8.5, 4, clamp((np.dist - R) / 8, 0, 1)));
          if (underRope(x, z, R, top)) { top = np.y - 13; if (underRope(x, z, R, top)) continue; }
          giants.push({ x, z, top, rot, R, sh, lat }); done = true;
        }
        side = -side;
      }
      const SY = 0.82;                                 // the umbrella is flat
      const gi = (e, k, wood) => { crownCol(e.sh, tc); const s = e.R / 13.5; return [e.x, e.top - 11.5 * s * SY, e.z, s, s * SY, s, e.rot, wood ? 1 : tc.r * k, wood ? 1 : tc.g * k, wood ? 1 : tc.b * k]; };
      for (let v = 0; v < 2; v++) {
        const set = giants.filter((e, i) => i % 2 === v); if (!set.length) continue;
        const cg = crownGeo(rg, true, 2);
        bucketed(cg.leaf, tuftMat, set.map((e) => gi(e, 1.1 + 0.25 * rg(), false)), 15.5, cg.leafMain); bucketed(cg.wood, plainMat, set.map((e) => gi(e, 1, true)), 15.5, cg.woodMain);
        await ctx.yield();
      }
      const yFork = (e) => e.top - 13.5 * (e.R / 13.5) * SY;
      bucketed(trunkGeo.clone(), plainMat, giants.map((e) => { const r = 0.11 * e.R; return [e.x, 16, e.z, r, yFork(e) - 16, r, e.rot, 1.12, 1.1, 1.02]; }), 1.15);
      await ctx.yield();
      // a tube along a run of points, into an accumulator
      const tubeAlong = (g, pts, r0, r1, sides, col, k0, k1) => {
        const i0 = g.pos.length / 3, n = pts.length, t3 = V3(), nn = V3(), bb = V3();
        for (let s = 0; s < n; s++) {
          const p = pts[s], t = s / (n - 1), r = lerp(r0, r1, t);
          t3.copy(pts[Math.min(n - 1, s + 1)]).sub(pts[Math.max(0, s - 1)]).normalize();
          nn.set(t3.y, -t3.x, 0); if (nn.lengthSq() < 1e-4) nn.set(1, 0, 0); nn.normalize(); bb.crossVectors(t3, nn);
          for (let q = 0; q < sides; q++) { const a = (q / sides) * 6.2832; g.v(p.x + (nn.x * Math.cos(a) + bb.x * Math.sin(a)) * r, p.y + (nn.y * Math.cos(a) + bb.y * Math.sin(a)) * r, p.z + (nn.z * Math.cos(a) + bb.z * Math.sin(a)) * r, col, lerp(k0, k1, t) * (0.85 + 0.3 * (q % 2))); }
        }
        for (let s = 0; s < n - 1; s++) for (let q = 0; q < sides; q++) { const a = i0 + s * sides + q, b = i0 + s * sides + (q + 1) % sides; g.quad(a, b, a + sides, b + sides); }
      };
      // the strangler fig: a lattice of roots wound round the trunk, three strands each way, joined where they cross;
      // roots let down from the limbs to the canopy; and its own dark leaf masses in the fork
      // (it takes, by draw, one of the giants whose trunk stands 9 m or more from the route, so the lattice is passed beside, not underneath)
      const figHosts = giants.filter((e) => Math.abs(e.lat) >= 9), fe = figHosts.length ? figHosts[Math.floor(rz() * figHosts.length)] : giants[0];
      if (fe) {
        const fg = acc(), cRoot = C('#a59f8c'), y0 = 17, y1 = yFork(fe) + 1.5, tr = 0.11 * fe.R, figLeaf = [];
        const trunkR = (y) => { const t = clamp((y - 16) / Math.max(1, y1 - 16), 0, 1); return tr * lerp(1.15, 0.55, t) * (1 + 0.5 * Math.pow(1 - t, 6)) + 0.14; };
        for (let sN = 0; sN < 6; sN++) {
          const dir = sN % 2 ? 1 : -1, ph = (sN / 6) * 6.2832 + rg.range(-0.3, 0.3), pitch = rg.range(11, 17), pts = [], NSEG = 30;
          for (let s = 0; s <= NSEG; s++) { const y = lerp(y0, y1, s / NSEG), a = ph + dir * (y - y0) * 6.2832 / pitch + 0.35 * Math.sin(y * 0.31 + sN), r = trunkR(y); pts.push(V3(Math.cos(a) * r, y, Math.sin(a) * r)); }
          tubeAlong(fg, pts, rg.range(0.2, 0.28), rg.range(0.1, 0.15), 4, cRoot, 0.5, 0.85);
        }
        for (let k = 0; k < 6; k++) {
          const a = rg() * 6.2832, o = rg.range(3.5, 9) * (fe.R / 13.5), yt = y1 + rg.range(1.5, 4), yb = rg.range(36, 44), pts = [], sw = rg.range(-0.6, 0.6);
          for (let s = 0; s <= 5; s++) { const t = s / 5; pts.push(V3(Math.cos(a) * o + sw * Math.sin(t * 3.1416), lerp(yt, yb, t), Math.sin(a) * o + sw * 0.6 * Math.sin(t * 3.1416 + 1))); }
          tubeAlong(fg, pts, 0.09, 0.05, 3, cRoot, 0.8, 0.5);
        }
        bucketed(fg.build(), plainMat, [[fe.x, 0, fe.z, 1, 1, 1, 0, 1, 1, 1]], 95);
        for (let k = 0; k < 6; k++) { const a = rg() * 6.2832, o = rg.range(1.5, 4.5), r = rg.range(2.2, 3.4), kk = rg.range(0.55, 0.8); figLeaf.push([fe.x + Math.cos(a) * o, y1 - rg.range(1, 7), fe.z + Math.sin(a) * o, r, r * 0.75, r, rg() * 6.28, cA.r * kk, cA.g * kk, cA.b * kk]); }
        bucketed(tuftGeo(), tuftMat, figLeaf, 1.35);
      }
      await ctx.yield();
      // fan palms: a rosette of pleated fans on long stalks, on a thin stem that stands in a gap of the canopy
      const rp9 = xr9.fork('palms'), cPalm = C('#4f8a50'), cStem = C('#8d8672');
      const palmGeo = () => {
        const g = acc(), nLf = 13, a0 = rp9() * 6.28, c0 = V3(), ax = V3(), sd = V3(), nr = V3(), p = V3();
        const i0 = g.pos.length / 3;
        for (let s = 0; s <= 1; s++) for (let q = 0; q < 5; q++) { const a = (q / 5) * 6.2832; g.v(Math.cos(a) * (s ? 0.13 : 0.2), s ? 0 : -11, Math.sin(a) * (s ? 0.13 : 0.2), cStem, 0.5 + 0.3 * s); }
        for (let q = 0; q < 5; q++) g.quad(i0 + q, i0 + (q + 1) % 5, i0 + 5 + q, i0 + 5 + (q + 1) % 5);
        for (let l = 0; l < nLf; l++) {
          const a = a0 + l * 2.39996 + rp9.range(-0.15, 0.15), el = lerp(1.15, -0.45, Math.pow(l / (nLf - 1), 0.8)) + rp9.range(-0.1, 0.1), st = rp9.range(1.2, 1.7), fr = rp9.range(1.0, 1.25), tint = rp9.range(0.8, 1.15);
          ax.set(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)); sd.set(-Math.sin(a), 0, Math.cos(a)); nr.crossVectors(sd, ax);
          c0.copy(ax).multiplyScalar(st);
          const b0 = g.v(0, 0.1, 0, cStem, 0.6), b1 = g.v(c0.x + sd.x * 0.05, c0.y, c0.z + sd.z * 0.05, cPalm, 0.6 * tint), b2 = g.v(c0.x - sd.x * 0.05, c0.y, c0.z - sd.z * 0.05, cPalm, 0.6 * tint);
          g.idx.push(b0, b1, b2);
          const hub = g.v(c0.x, c0.y, c0.z, cPalm, 0.55 * tint), NR = 9, r0 = g.pos.length / 3;
          for (let k = 0; k <= NR; k++) {
            const th = lerp(-2.5, 2.5, k / NR), rr = fr * (0.82 + 0.18 * Math.cos(th * 0.5)) * (k % 2 ? 1 : 0.9), pl = (k % 2 ? 0.12 : -0.1) * fr - 0.25 * fr * (1 - Math.cos(th * 0.5));
            p.copy(c0).addScaledVector(ax, Math.cos(th) * rr).addScaledVector(sd, Math.sin(th) * rr).addScaledVector(nr, pl);
            g.v(p.x, p.y, p.z, cPalm, tint * (k % 2 ? 1.15 : 0.7));
          }
          for (let k = 0; k < NR; k++) g.idx.push(hub, r0 + k, r0 + k + 1);
        }
        return g.build();
      };
      // rattan: feather fronds 5 m long arching out of the top of the cane, leaflets in pairs along each
      const rattanGeo = () => {
        const g = acc(), nF = 8, a0 = rp9() * 6.28, cRat = C('#5c9456'), p = V3(), q = V3(), sd = V3();
        for (let f = 0; f < nF; f++) {
          const a = a0 + (f / nF) * 6.2832 + rp9.range(-0.3, 0.3), ca = Math.cos(a), sa = Math.sin(a), L = rp9.range(4.2, 5.6), up = rp9.range(0.75, 1.25), tint = rp9.range(0.8, 1.15), NSG = 6;
          sd.set(-sa, 0, ca);
          const at = (t, out) => out.set(ca * L * (0.1 + 0.8 * t), L * (up * t - 0.95 * t * t), sa * L * (0.1 + 0.8 * t));
          const i0 = g.pos.length / 3;
          for (let s = 0; s <= NSG; s++) { const t = s / NSG; at(t, p); const w = 0.07 * (1 - 0.7 * t); g.v(p.x - sd.x * w, p.y, p.z - sd.z * w, cRat, 0.5 * tint); g.v(p.x + sd.x * w, p.y, p.z + sd.z * w, cRat, 0.5 * tint); }
          for (let s = 0; s < NSG; s++) { const b = i0 + s * 2; g.quad(b, b + 1, b + 2, b + 3); }
          for (let s = 1; s <= 9; s++) {
            const t = 0.12 + 0.86 * (s / 9), ll = 0.95 * Math.sin(3.1416 * (0.15 + 0.8 * t)) + 0.2; at(t, p); at(Math.min(1, t + 0.07), q);
            for (const sg of [-1, 1]) {
              const b = g.v(p.x, p.y, p.z, cRat, 0.6 * tint), c = g.v(q.x, q.y, q.z, cRat, 0.7 * tint);
              const e = g.v((p.x + q.x) * 0.5 + sd.x * sg * ll, (p.y + q.y) * 0.5 - 0.3 * ll, (p.z + q.z) * 0.5 + sd.z * sg * ll, cRat, (sg > 0 ? 1.2 : 0.95) * tint);
              g.idx.push(b, c, e);
            }
          }
        }
        return g.build();
      };
      const palms = [], rats = [], tq2 = V3(), tt2 = V3(), farFrom = (list, x, z, d) => !list.some((t) => Math.hypot(t[0] - x, t[2] - z) < d);
      for (let n = 0; n < 900 && (palms.length < 26 || rats.length < 12); n++) {
        const u = rp9.range(0.325, 0.65), lat = (rp9() < 0.5 ? -1 : 1) * (5 + 70 * Math.pow(rp9(), 1.5)), yaw = rp9() * 6.28, sc = rp9(), kk = rp9.range(0.8, 1.2);
        path.pointAt(u, tq2); path.tangentAt(u, tt2); tt2.y = 0; tt2.normalize();
        const x = tq2.x - tt2.z * lat, z = tq2.z + tt2.x * lat;
        if (z < 46 || inTower(x, z, 6)) continue;
        const h = canopyH(x, z), gap = ci.t < 0;
        if (gap && palms.length < 26 && farFrom(palms, x, z, 7) && !giants.some((e) => Math.hypot(e.x - x, e.z - z) < 4) && !emerg.some((e) => Math.hypot(e.x - x, e.z - z) < 4)) { const s = lerp(1.35, 2.1, sc); palms.push([x, lerp(42, 48, sc) + 2 * kk, z, s, s, s, yaw, kk, kk, kk]); }
        else if (!gap && h > 39 && rats.length < 12 && farFrom(rats, x, z, 12)) { const s = lerp(0.9, 1.35, sc); rats.push([x, h + 0.6, z, s, s, s, yaw, kk, kk, kk]); }
        if ((n & 63) === 63) await ctx.yield();
      }
      for (let v = 0; v < 2; v++) { const set = palms.filter((t, i) => i % 2 === v); if (set.length) bucketed(palmGeo(), plainMat, set, 4.2); }
      await ctx.yield();
      for (let v = 0; v < 2; v++) { const set = rats.filter((t, i) => i % 2 === v); if (set.length) bucketed(rattanGeo(), plainMat, set, 6); }
      await ctx.yield();
    }

    // ---- the limestone ridge 520 m out, crowned with knife blades; the ring stands in a notch between two ----
    const rockMat = smat(ROCK_VERT, ROCK_FRAG, { side: THREE.DoubleSide }), finMat = smat(ROCK_VERT, ROCK_FRAG, { defines: { FIN: 1 }, side: THREE.DoubleSide });
    // the beds dip, roll and wander: the same three sines are in ROCK_FRAG, which shades each ledge where the mesh has it
    const dipAt = (x, z) => 2.2 * Math.sin(x * 0.013 + z * 0.007) + 1.2 * Math.sin(x * 0.041 - z * 0.02 + 1.7) + 0.9 * Math.sin(x * 0.097 + z * 0.043 + 0.4);
    // beds of unequal thickness (7 to 24 m): the bed coordinate is a warped height, the same in ROCK_FRAG
    const bedW = (v) => v + 2.6 * Math.sin(v * 0.21 + 0.7);
    const bedInv = (w) => { let v = w; for (let i = 0; i < 4; i++) v -= (bedW(v) - w) / (1 + 0.546 * Math.cos(v * 0.21 + 0.7)); return v; };
    const ridgeH = (s, t, d) => {                    // steep bedded limestone faces, a broken crest, a saddle under the ring
      const n1 = noise.fbm2(s * 0.006 + 31, t * 0.01, 3), n2 = noise.fbm2(s * 0.03 + 7, t * 0.03, 2), w = 50 + 12 * noise.n2(s * 0.004, 2.2);
      const tt = t + 7 * noise.fbm2(s * 0.035, 4.4, 2) + 3 * noise.n2(s * 0.12, t * 0.05);          // buttresses and flutes along the face
      const p = smoothstep(1, 0.52, Math.abs(tt) / w);
      let h = 36 + (83 + 17 * n1 - 36) * p + n2 * 5 * p;
      const v = h + d, q = bedW(v) / 11, fq = Math.floor(q), led = smoothstep(0.3, 0.55, 0.5 + 0.5 * noise.n2(s * 0.019 + fq * 7.3, fq * 3.1));     // a ledge, then a riser; each ledge dies out into plain face for stretches
      h = lerp(v, bedInv((fq + smoothstep(0.7, 0.96, q - fq)) * 11) * 0.8 + v * 0.2, 0.2 + 0.8 * led) - d;
      return h - 6 * Math.exp(-(s * s) / 260) * p + 1.3 * noise.fbm2(s * 0.21, t * 0.21, 2) * p;                // broken ground on top
    };
    const ridgeW = (s, t, out) => { out.copy(seat.position).addScaledVector(sideL, s).addScaledVector(fwd, t + 0.00035 * s * s); out.y = ridgeH(s, t, dipAt(out.x, out.z)); return out; };
    const ridgeY = (s, t) => { ridgeW(s, t, P); const np = path.nearestXZ(P.x, P.z); return np.dist < 26 ? Math.min(P.y, np.y - 8.5 - 3 * smoothstep(8, 26, np.dist) + 12 * smoothstep(14, 26, np.dist)) : P.y; };
    const cL = C('#a4aaa6').multiplyScalar(H.rockK), cLd = C('#59625f').multiplyScalar(H.rockK), cLp = C('#c3c6bd').multiplyScalar(H.rockK), cG = C(H.canopyA).multiplyScalar(1.2);
    const notch = [], bushLod = [];                    // things on the ridge and the towers, hidden while the lens is still in the cave; bushLod: [full leaves, twigs, plain leaves, x, z]
    // the towers' mesh: a wall of rows from the foot to the ragged rim (clefts, overhangs, the shoulder and the
    // flutes are all in it), then the head. Columns start on the side turned from the path, where the seam in the
    // metres-round coordinate (that TOWER_FRAG lays its runnels and blocks out with) cannot be seen.
    const towerBush = [];                              // scrub in their clefts and creepers hanging from their lips: [item, near]
    let towersOuter = null, outerGate = 0;
    {
      const gA = acc(), gB = acc(), twA = [], twB = [], rdA = [], rdB = [], rt2 = xr.fork('tower-scrub'), cS = C(H.canopyC).lerp(C(H.canopyA), 0.3), Q = V3();
      for (const T of towers) {
        const F = T[6], fine = T[5], seg = fine ? 96 : 44, inner = gateOf(T[0] - Math.sign(T[0]) * T[2], T[1]) > 330, g = inner ? gA : gB, tw = inner ? twA : twB, rd = inner ? rdA : rdB;      // gA: those the keyhole shows from deep inside
        if (!inner) outerGate = Math.max(outerGate, gateOf(T[0] - Math.sign(T[0]) * T[2] * 1.3, T[1]));
        const np = path.nearestXZ(T[0], T[1]); path.pointAt(np.u, Q); const aS = Math.atan2(T[1] - Q.z, T[0] - Q.x);
        const nr = Math.ceil((T[3] - TB) / (fine ? 2.3 : 4.6)), caps = [0.74, 0.46, 0.2], rows = nr + caps.length, i0 = g.pos.length / 3, W = seg + 1;
        for (let j = 0; j < rows; j++) {
          const t = j < nr ? j / (nr - 1) : 1, kc = j < nr ? 1 : caps[j - nr];
          for (let k = 0; k < W; k++) {
            const a = aS + (k / seg) * 6.2832; let x, y, z, ao = 0;
            if (j < nr) { const r = towerRad(T, a, t); ao = twO.ao; y = TB + t * (towerTop(T, a) - TB); x = T[0] + Math.cos(a) * r + F.lx * (y - TB); z = T[1] + Math.sin(a) * r + F.lz * (y - TB); }
            else { towerCap(T, a, kc, Q); x = Q.x; y = Q.y; z = Q.z; }
            const band = noise.fbm2(a * 3 + T[4], y * 0.035, 2) * 0.5 + 0.5;
            tc.copy(cL).lerp(cLd, smoothstep(0.4, 0.75, band) * 0.6).lerp(cLp, smoothstep(0.6, 0.9, noise.n2(a * 2 + 5, y * 0.05) * 0.5 + 0.5) * 0.5).lerp(cG, (1 - smoothstep(38, 52, y)) * 0.9);
            g.v(x, y, z, tc, 0.85 + 0.25 * noise.n2(a * 7 + T[4], y * 0.11)); tw.push((k / seg) * 6.2832 * T[2], T[4], ao); rd.push(Math.cos(a), Math.sin(a));
          }
          if ((j & 3) === 3) await ctx.yield();
        }
        towerCap(T, 0, 0, Q); const top = g.v(Q.x, Q.y + 0.5, Q.z, cLp, 1); tw.push(0, T[4], 0); rd.push(0, 0);
        for (let j = 0; j < rows - 1; j++) for (let k = 0; k < seg; k++) { const a0 = i0 + j * W + k, a1 = a0 + 1; g.quad(a1, a0, a1 + W, a0 + W); }
        for (let k = 0; k < seg; k++) g.idx.push(i0 + (rows - 1) * W + k, i0 + (rows - 1) * W + k + 1, top);
        await ctx.yield();
        // scrub rooted in the clefts and under the lips, wherever the wall is cut back
        const near = np.dist < 80;
        for (let n = 0, got = 0; n < 160 && got < (fine ? 34 : 9); n++) {
          const a = rt2() * 6.2832, t = rt2.range(0.16, 0.95), r = towerRad(T, a, t); if (twO.ao < 0.3 && rt2() > 0.3) continue;
          const y = TB + t * (towerTop(T, a) - TB), x = T[0] + Math.cos(a) * (r - 0.4) + F.lx * (y - TB), z = T[1] + Math.sin(a) * (r - 0.4) + F.lz * (y - TB);
          const sz = rt2.range(1.2, 2.4) * (fine ? 1 : 1.5), kk = rt2.range(0.8, 1.3) * 1.2; got++;
          towerBush.push([[x, y - sz * 0.1, z, sz * 0.9, sz * 0.72 * rt2.range(0.95, 1.4), sz * 0.9, rt2() * 6.28, cS.r * kk, cS.g * kk, cS.b * kk], near]);
        }
        // creepers: curtains hanging from the rim and from the lip of each overhang (a bush turned upside down and drawn long)
        for (let n = 0, nn = fine ? 18 : 7; n < nn; n++) {
          const o = F.ov[n % F.ov.length], lip = n % 3 !== 0, a = lip ? o.a + rt2.range(-0.7, 0.7) * o.w : rt2() * 6.2832, t = lip ? o.t + 0.03 * Math.sin(a * 4 + o.a * 7) + 0.012 : rt2.range(0.9, 0.97);
          const r = towerRad(T, a, t) + 0.5, y = TB + t * (towerTop(T, a) - TB), x = T[0] + Math.cos(a) * r + F.lx * (y - TB), z = T[1] + Math.sin(a) * r + F.lz * (y - TB);
          const sz = rt2.range(1.3, 2.3) * (fine ? 1 : 1.4), len = sz * rt2.range(2.6, 5.2), kk = rt2.range(0.75, 1.2) * 1.15;
          towerBush.push([[x, y + 0.6, z, sz * 0.8, -len, sz * 0.8, rt2() * 6.28, cS.r * kk, cS.g * kk, cS.b * kk], near]);
        }
        await ctx.yield();
      }
      const tMat = smat(TOWER_VERT, TOWER_FRAG, { side: THREE.DoubleSide });
      const mk = (g, tw, rd, name) => { const geo = g.build(); geo.setAttribute('aTw', new THREE.BufferAttribute(new Float32Array(tw), 3)); geo.setAttribute('aRd', new THREE.BufferAttribute(new Float32Array(rd), 2)); const m = new THREE.Mesh(geo, tMat); m.name = name; m.frustumCulled = false; scene.add(m); return m; };
      mk(gA, twA, rdA, 'towers'); await ctx.yield(); towersOuter = mk(gB, twB, rdB, 'towers-outer');
    }
    await ctx.yield();
    // A blade: a fin of limestone. x = its length, z = its thickness (tapering to a knife edge), y up. The crest is
    // a row of sharp broken teeth; the faces are cut by vertical flutes between ribs; the foot flares and sinks.
    // (lod: the same blade over again in a quarter of its triangles, every second column and row of the same vertices,
    // appended to the index; userData.lod = [full count, coarse start, coarse count]. The blades by the notch are drawn
    // coarse while the lens is more than 300 m from the ring, where each is a few degrees of dark rock in the night air.)
    const finLod = [];
    const finGeometry = (rs, L, W, Hh, np, nr, lod = false) => {
      const pos = [], col = [], lh = [], ix = [], teeth = [], nT = rs.int(4, 6), php = rs() * 6.28, lean = rs.range(-0.06, 0.06), tall = rs.int(0, nT - 1);
      for (let k = 0; k < nT; k++) teeth.push([lerp(-0.8, 0.8, (k + rs.range(0.25, 0.75)) / nT), k === tall ? 1 : rs.range(0.62, 0.95), rs.range(0.2, 0.36)]);
      const crest = (l) => {
        let r = 0; for (const [x, h, w] of teeth) r = Math.max(r, h * Math.pow(Math.max(0, 1 - Math.abs(l - x) / w), 0.8));
        return Hh * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(l), 3.2)), 0.55) * (0.4 + 0.6 * r) * (1 + 0.04 * Math.sin(l * 23 + php));
      };
      for (let j = 0; j <= nr; j++) {
        const t = j / nr, th = Math.pow(1 - t, 0.75) * (1 + 0.7 * Math.pow(1 - t, 4));
        for (let i = 0; i < np; i++) {
          const a = (i / np) * 6.2832, l = Math.cos(a), sd = Math.sin(a), hgt = crest(l), y = -6 + (hgt + 6) * Math.pow(t, 0.92);
          const x = l * (L / 2) * (1 - 0.18 * t) + 0.5 * Math.sin(y * 0.21 + php);
          const rib = Math.pow(Math.abs(Math.sin(x * 1.45 + php + 0.5 * Math.sin(y * 0.11))), 0.55), rib2 = Math.abs(Math.sin(x * 0.41 + php * 2 + y * 0.03));
          const groove = (1 - rib) * (0.5 + 0.5 * t) * 1.2 + (1 - rib2) * 1.0;
          const half = Math.max(0.04 * (1 - t), (W / 2) * Math.pow(Math.abs(sd), 0.8) * th - groove * Math.min(1, Math.abs(sd) * 2.5) * (1 - t * t * 0.6));
          pos.push(x, y, Math.sign(sd) * half + lean * y); lh.push(x, y);
          const band = 0.5 + 0.5 * Math.sin(y * 0.33 + x * 0.05 + php), k = (0.74 + 0.3 * rib) * (0.86 + 0.2 * band);
          tc.copy(cL).lerp(cLd, 0.55 * (1 - rib2)).lerp(cLp, 0.5 * smoothstep(0.6, 1, t)).lerp(cG, (1 - smoothstep(-2, 9, y)) * 0.8);
          col.push(tc.r * k, tc.g * k, tc.b * k);
        }
      }
      for (let j = 0; j < nr; j++) for (let i = 0; i < np; i++) { const a = j * np + i, b = j * np + (i + 1) % np; ix.push(a, a + np, b, b, a + np, b + np); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aLH', new THREE.Float32BufferAttribute(lh, 2));
      g.setIndex(ix); g.computeVertexNormals();
      if (lod) {
        const n0 = ix.length;
        for (let j = 0; j < nr; j += 2) for (let i = 0; i < np; i += 2) { const a = j * np + i, b = j * np + (i + 2) % np; ix.push(a, a + 2 * np, b, b, a + 2 * np, b + 2 * np); }
        g.setIndex(ix); g.userData.lod = [n0, n0, ix.length - n0];
      }
      return g;
    };
    const finMesh = (geo, items, L = 16, Hh = 38) => {           // items: [x, y, z, yaw, sx, sy, sz]
      const im = new THREE.InstancedMesh(geo, finMat, Math.max(1, items.length));
      items.forEach((b, i) => { q4.setFromAxisAngle(UPY, b[3]); m4.compose(V3(b[0], b[1], b[2]), q4, V3(b[4], b[5], b[6])); im.setMatrixAt(i, m4); });
      im.count = items.length; im.frustumCulled = false; scene.add(im); return im;
    };
    {
      const rb = rng.fork('blades'), yawF = Math.atan2(-fwd.z, fwd.x);          // local x (the blade's length) along the flight
      const spots = [];
      for (let k = 0; k < 62; k++) {
        const sgn = k % 2 ? 1 : -1, s = sgn * (30 + Math.pow((k >> 1) / 31, 1.5) * 760 + rb.range(-6, 6)), t = rb.range(-16, 16);
        ridgeW(s, t, P); const dp = path.nearestXZ(P.x, P.z).dist; if (dp < 19) continue;
        spots.push({ d: dp, it: [P.x, P.y - 1, P.z, yawF + rb.range(-1.2, 1.2), rb.range(0.75, 1.2), rb.range(0.72, 1.12) * (1 - 0.25 * smoothstep(300, 760, Math.abs(s))), rb.range(0.8, 1.25)] });
      }
      spots.sort((a, b) => a.d - b.d);
      const nearS = spots.slice(0, 6), farS = spots.slice(6);
      for (let v = 0; v < 2; v++) { const L = rb.range(15, 19), W = rb.range(4.4, 5.6), Hh = rb.range(36, 42); finLod.push(finMesh(finGeometry(rb, L, W, Hh, 76, 16, true), nearS.filter((b, i) => i % 2 === v).map((b) => b.it), L, Hh)); await ctx.yield(); }
      for (let v = 0; v < 3; v++) { const L = rb.range(13, 20), W = rb.range(4.2, 6), Hh = rb.range(34, 44); const fg = finGeometry(rb, L, W, Hh, 24, 7), its = farS.filter((b, i) => i % 3 === v).map((b) => b.it).sort(byGate); gate(finMesh(fg, its, L, Hh), its); await ctx.yield(); }
      // the two notch blades the camera passes between: toed out a little so their fluted faces show on the approach
      for (let i = 0; i < 2; i++) {
        const sg = i ? -1 : 1; P.copy(seat.position).addScaledVector(sideL, sg * (i ? 21.5 : 20.5)).addScaledVector(fwd, i ? -2 : -5);
        finLod.push(finMesh(finGeometry(rb, i ? 25 : 23, 6.4, i ? 56 : 50, 104, 22, true), [[P.x, 72, P.z, yawF - sg * (i ? 0.95 : 0.8), 1, 1, 1]], i ? 25 : 23, i ? 56 : 50));
        await ctx.yield();
      }
      await ctx.yield();
      // limestone scrub (leaf clumps) and screw pines rooted in the cracks, thickest round the notch
      const rs = rng.fork('scrub'), scrub = [], pines = [], cS = C(H.canopyC).lerp(C(H.canopyA), 0.3);
      for (let k = 0; k < 420 && (scrub.length < 110 || pines.length < 36); k++) {
        const nearSeat = k % 2 === 0, s = nearSeat ? rs.range(-1, 1) * rs.range(8, 70) : rs.range(-1, 1) * rs.range(40, 260), t = nearSeat ? rs.range(-95, 30) : rs.range(-55, 48), y = ridgeY(s, t);
        if (path.nearestXZ(P.x, P.z).dist < 5 || y < 50) continue;
        const kk = rs.range(0.8, 1.35);
        if ((k & 31) === 31) await ctx.yield();
        if (k % 3 === 0 && pines.length < 36) { const sc = rs.range(0.75, 1.3); pines.push([P.x, y - 0.3, P.z, sc, sc, sc, rs() * 6.28, kk, kk, kk]); }
        else if (scrub.length < 110) { const r = rs.range(0.9, 2.0); scrub.push([P.x, y + r * 0.2, P.z, r, r * rs.range(0.95, 1.4), r, rs() * 6.28, cS.r * kk * 1.25, cS.g * kk * 1.25, cS.b * kk * 1.25]); }
      }
      await ctx.yield();
      // ferns and scrub on the ledges of the face: wherever a bed's top is level enough to root in
      const rl = xr.fork('ledges');
      for (let n = 0, got = 0; n < 420 && got < 54; n++) {
        if ((n & 31) === 31) await ctx.yield();
        const s = rl.range(-150, 150), t = rl.range(-72, -16), r = rl.range(0.8, 1.7), kk = rl.range(0.85, 1.35), rot = rl() * 6.28;
        const rise = ridgeY(s, t + 1.2) - ridgeY(s, t - 1.2), above = ridgeY(s, t + 7), y = ridgeY(s, t);
        if (Math.abs(rise) > 1.5 || y < 43 || above < y + 4 || path.nearestXZ(P.x, P.z).dist < 9) continue;
        scrub.push([P.x, y + r * 0.2, P.z, r, r * rl.range(0.8, 1.2), r, rot, cS.r * kk * 1.25, cS.g * kk * 1.25, cS.b * kk * 1.25]); got++;
      }
      await ctx.yield();
      // each bush and pine roots in a dark patch: [x, z, radius squared, ground height, radius]
      const nearB = [], farB = [], rooted = [];
      for (const b of scrub) {
        const r = b[3], g0 = b[1] - r * 0.2, it = [b[0], g0 - r * 0.12, b[2], r * 0.9, r * 0.72 * (b[4] / r), r * 0.9, b[6], b[7], b[8], b[9]];
        (path.nearestXZ(b[0], b[2]).dist < 70 ? nearB : farB).push(it); rooted.push([b[0], b[2], r * r * 2.9, g0, r * 1.5]);
      }
      for (const q of pines) rooted.push([q[0], q[2], 6.5, q[1] + 0.3, 2.1]);
      const nearT = [];                                 // those on the two towers the path passes between
      for (const [it, nr] of towerBush) (nr ? nearT : farB).push(it);
      // the ridge mesh: fine where the lens comes close (the notch and the face below it), coarse far along; its
      // colour is darkened under every bush so each one stands in its own shadow
      {
        const sArr = [], tArr = [];
        for (let i = -58; i <= 58; i++) sArr.push(i * 2.4);
        for (let k = 1; k <= 32; k++) { const e = 139.2 + 810.8 * (Math.pow(1.09, k) - 1) / (Math.pow(1.09, 32) - 1); sArr.push(e); sArr.unshift(-e); }
        for (let j = 0; j < 7; j++) tArr.push(lerp(-125, -76, j / 7));
        for (let j = 0; j <= 50; j++) tArr.push(lerp(-76, -14, j / 50));          // the face: 1.25 m, so every ledge is three cells deep
        for (let j = 1; j <= 8; j++) tArr.push(lerp(-14, 16, j / 8));
        for (let j = 1; j <= 11; j++) tArr.push(lerp(16, 125, Math.pow(j / 11, 1.5)));
        const na = sArr.length, nb = tArr.length, g = acc();
        for (let i = 0; i < na; i++) {
          const s = sArr[i], close = Math.abs(s) < 270;
          for (let j = 0; j < nb; j++) {
            const t = tArr[j], y = ridgeY(s, t), band = noise.fbm2(s * 0.16, y * 0.035, 2) * 0.5 + 0.5;
            tc.copy(cL).lerp(cLd, smoothstep(0.4, 0.75, band) * 0.7).lerp(cLp, smoothstep(0.6, 0.9, noise.n2(s * 0.02, t * 0.05 + 9) * 0.5 + 0.5) * 0.5).lerp(cG, (1 - smoothstep(42, 54, y)) * 0.9);
            let k = 0.8 + 0.3 * noise.n2(s * 0.11, t * 0.11);
            if (close && y >= 49) for (const b of rooted) { const dx = P.x - b[0], dz = P.z - b[1], d2 = dx * dx + dz * dz; if (d2 < b[2]) k *= 0.4 + 0.6 * d2 / b[2]; }
            g.v(P.x, y, P.z, tc, k);
          }
          await ctx.yield();
        }
        for (let i = 0; i < na - 1; i++) for (let j = 0; j < nb - 1; j++) { const a = i * nb + j; g.idx.push(a, a + 1, a + nb, a + 1, a + nb + 1, a + nb); }
        await ctx.yield();
        scene.add(new THREE.Mesh(g.build(), rockMat));
      }
      await ctx.yield();
      // fallen blocks at the foot of the face: lumpy boulders half sunk in the mist and the scree
      {
        const rk = rl.fork('blocks'), bg = acc(), seg = 8, rings = 5, lh = [], items = [];
        for (let e = 0; e <= rings; e++) {
          const el = -1.1 + (e / rings) * (Math.PI / 2 + 1.1 - 0.3), cy = Math.sin(el), cr = Math.cos(el);
          for (let k = 0; k < seg; k++) {
            const an = (k / seg) * 6.2832 + e * 0.45, l = 1 + 0.26 * Math.sin(k * 2.3 + e * 1.9 + 0.7) + 0.14 * Math.sin(k * 4.1 + e * 3.1 + 2.1);
            const sq = Math.pow(Math.abs(cy), 0.7) * Math.sign(cy);                // squared shoulders: a block, not a ball
            tc.copy(cL).lerp(cLp, 0.25 + 0.4 * Math.max(0, cy)); bg.v(Math.cos(an) * cr * l, sq * (0.85 + 0.12 * Math.sin(k * 1.7 + e)), Math.sin(an) * cr * l * 0.85, tc, 0.42 + 0.5 * (e / rings));
            lh.push(Math.cos(an) * cr * l * 3, sq);
          }
        }
        const top = bg.v(0, 0.92, 0, cLp, 0.9); lh.push(0, 1);
        for (let e = 0; e < rings; e++) for (let k = 0; k < seg; k++) { const a0 = e * seg + k, a1 = e * seg + (k + 1) % seg; bg.quad(a1, a0, a1 + seg, a0 + seg); }
        for (let k = 0; k < seg; k++) bg.idx.push(rings * seg + (k + 1) % seg, rings * seg + k, top);
        const geo = bg.build(); geo.setAttribute('aLH', new THREE.Float32BufferAttribute(lh, 2));
        for (let n = 0; n < 30; n++) {
          const s = rk.range(-150, 150), t = rk.range(-76, -57), y = ridgeY(s, t), sy = rk.range(1.5, 3.6);
          if (path.nearestXZ(P.x, P.z).dist < 12) continue;
          items.push([P.x, y - sy * 0.15, P.z, rk() * 6.28, rk.range(2.4, 5.5), sy, rk.range(2.2, 4.6), rk.range(-0.25, 0.25)]);
        }
        const blockMat = smat(ROCK_VERT, ROCK_FRAG, { defines: { FIN: 1, BLOCK: 1 }, side: THREE.DoubleSide });
        const im = new THREE.InstancedMesh(geo, blockMat, Math.max(1, items.length)), eu = new THREE.Euler();
        items.forEach((b, i) => { q4.setFromEuler(eu.set(b[7], b[3], b[7] * 0.6, 'YXZ')); m4.compose(V3(b[0], b[1], b[2]), q4, V3(b[4], b[5], b[6])); im.setMatrixAt(i, m4); });
        im.count = items.length; im.frustumCulled = false; scene.add(im); notch.push(im);
      }
      await ctx.yield();
      // limestone scrub: each bush a knot of small leaf clumps on bare twigs (the canopy's leaves seven times smaller)
      const scrubMat = smat(CANOPY_VERT, CANOPY_FRAG, { defines: { TUFT: 1, SCRUB: 1, ...CDEF }, side: THREE.DoubleSide });
      const bushGeo = (rq, nC, seg, twigs) => {
        const leaf = acc(), wood = acc(), cTw = C('#77705f');
        for (let c = 0; c < nC; c++) {
          const a = (c / Math.max(1, nC - 1)) * 6.2832 + rq.range(-0.4, 0.4), o = c === 0 ? 0 : rq.range(0.4, 0.8), r = c === 0 ? rq.range(0.5, 0.62) : rq.range(0.32, 0.5), cy = c === 0 ? rq.range(0.8, 1.0) : rq.range(0.4, 0.8);
          const cx = Math.cos(a) * o, cz = Math.sin(a) * o;
          clump(leaf, cx, cy, cz, r, r * rq.range(0.7, 1.0), seg, 2, rq.range(0.75, 1.2), rq() * 6.28);
          if (!twigs) continue;
          const i0 = wood.pos.length / 3, mx = cx * 0.45 + rq.range(-0.1, 0.1), mz = cz * 0.45 + rq.range(-0.1, 0.1);
          for (const [px, py, pz, w] of [[0, -0.15, 0, 0.06], [mx, cy * 0.5, mz, 0.045], [cx, cy - r * 0.1, cz, 0.03]]) for (let k = 0; k < 3; k++) { const an = k * 2.094; wood.v(px + Math.cos(an) * w, py, pz + Math.sin(an) * w, cTw, 0.5 + 0.25 * k); }
          for (let s2 = 0; s2 < 2; s2++) for (let k = 0; k < 3; k++) { const a0 = i0 + s2 * 3 + k, a1 = i0 + s2 * 3 + (k + 1) % 3; wood.quad(a0, a1, a0 + 3, a1 + 3); }
        }
        return { leaf: leaf.build(), wood: twigs ? wood.build() : null };
      };
      const bq = xr.fork('bush'), bgN = bushGeo(bq, 5, 6, true), bgF = bushGeo(bq, 3, 5, false);
      // the bushes near the path are drawn in full (five clumps on twigs) only while the lens is within 300 m of them:
      // those round the notch from the climb on, those on the two towers during the run and the pass; otherwise as
      // the far ones are (three clumps), which at that distance is the same picture
      const white = (b) => [b[0], b[1], b[2], b[3], b[4], b[5], b[6], 1, 1, 1];
      bushLod.push([instanced(bgN.leaf, scrubMat, nearB), instanced(bgN.wood, plainMat, nearB.map(white)), instanced(bgF.leaf.clone(), scrubMat, nearB), seat.position.x, seat.position.z]);
      bushLod.push([instanced(bgN.leaf.clone(), scrubMat, nearT), instanced(bgN.wood.clone(), plainMat, nearT.map(white)), instanced(bgF.leaf.clone(), scrubMat, nearT), 161, 328]);
      for (const l of bushLod) { l[0].visible = l[1].visible = l[2].visible = false; }
      notch.push(instanced(bgF.leaf, scrubMat, farB));
      // the dark patch each one roots in: a soft disc laid on the rock
      {
        const dg = new THREE.CircleGeometry(1, 10); dg.rotateX(-Math.PI / 2);
        const dm = new THREE.InstancedMesh(dg, new THREE.ShaderMaterial({ uniforms: { uCam: U.uCam, uFogCol: U.uFogCol, uFogK: U.uFogK }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
          vertexShader: /* glsl */`varying vec2 vQ; varying vec3 vP; void main(){ vQ = position.xz; vec4 w = instanceMatrix * vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: /* glsl */`varying vec2 vQ; varying vec3 vP; uniform vec3 uCam, uFogCol; uniform float uFogK;
            void main(){ float a = (1. - smoothstep(.2, 1., length(vQ))) * .8, d = length(vP - uCam), f = 1. - exp(-uFogK * uFogK * d * d); gl_FragColor = vec4(mix(vec3(.004, .009, .007), uFogCol, f), a * (1. - f)); }` }), Math.max(1, rooted.length));
        const nr = V3();
        rooted.forEach((b, i) => {
          const dx = b[0] - seat.position.x, dz = b[1] - seat.position.z, s = dx * sideL.x + dz * sideL.z, t = dx * fwd.x + dz * fwd.z - 0.00035 * s * s;
          const gs = (ridgeY(s + 1, t) - ridgeY(s - 1, t)) / 2, gt = (ridgeY(s, t + 1) - ridgeY(s, t - 1)) / 2;
          nr.set(0, 1, 0).addScaledVector(sideL, -gs).addScaledVector(fwd, -gt).normalize();
          m4.compose(V3(b[0], b[3], b[1]).addScaledVector(nr, 0.2), q4.setFromUnitVectors(UPY, nr), V3(b[4], 1, b[4])); dm.setMatrixAt(i, m4);
        });
        dm.count = rooted.length; dm.frustumCulled = false; dm.renderOrder = 1; scene.add(dm); notch.push(dm);
      }
      await ctx.yield();
      // screw pine: a thin stem with two or three heads of long arching sword leaves
      const pg = acc(), cStem = C('#8a8372'), cLf = C(H.canopyC).lerp(C('#8fae6a'), 0.35);
      for (let h = 0; h < 3; h++) {
        const hx = [0, 0.9, -0.7][h], hz = [0, 0.4, 0.8][h], hy = [5.2, 3.9, 4.4][h], b0 = pg.pos.length / 3;
        for (let s = 0; s <= 3; s++) { const t = s / 3, w = 0.16 * (1 - 0.4 * t); pg.v(hx * t * t - w, hy * t, hz * t * t, cStem, 0.6); pg.v(hx * t * t + w, hy * t, hz * t * t, cStem, 0.85); pg.v(hx * t * t, hy * t, hz * t * t + w * 1.6, cStem, 0.7); }
        for (let s = 0; s < 3; s++) for (let k = 0; k < 3; k++) { const a = b0 + s * 3 + k, b = b0 + s * 3 + (k + 1) % 3; pg.quad(a, b, a + 3, b + 3); }
        for (let l = 0; l < 10; l++) {
          const a = l * 2.4 + h, el = 0.25 + 0.75 * rs(), len = rs.range(1.7, 2.6), ca = Math.cos(a), sa = Math.sin(a), l0 = pg.pos.length / 3;
          for (let s = 0; s <= 3; s++) {
            const t = s / 3, o = len * t * Math.cos(el * (1 - 0.5 * t)), yy = hy + len * (t * Math.sin(el) - 0.75 * t * t), w = 0.17 * (1 - t * t) + 0.015;
            pg.v(hx + ca * o - sa * w, yy, hz + sa * o + ca * w, cLf, 0.55 + 0.6 * t); pg.v(hx + ca * o + sa * w, yy, hz + sa * o - ca * w, cLf, 0.7 + 0.6 * t);
          }
          for (let s = 0; s < 3; s++) { const a2 = l0 + s * 2; pg.quad(a2, a2 + 1, a2 + 2, a2 + 3); }
        }
      }
      notch.push(instanced(pg.build(), plainMat, pines));
      for (const o of notch) o.visible = false;
    }
    await ctx.yield();
    const far = T.makeHorizonRidges({ rng: rng.fork('far'), layers: 3, radius: [1700, 3300], height: [130, 400], base: 0, fog: scene.fog, sunDir: keyDir, sunColor: H.glow, rim: 0.4, coverage: 0.7 });
    scene.add(far.object);
    await ctx.yield();

    // ---- mist: in deep mist a cloud sea (a polar sheet that follows the camera, displaced and shaded by the same
    // height function the canopy sinks into); in every weather a thin layer of wisps above the crowns, soft puffs
    // in the gaps and round the emergent trunks and through the notch, and (clear weather) plumes of steam rising ----
    const polar = (nr, na) => {
      const pos = [], ix = [];
      for (let j = 0; j <= nr; j++) { const r = 6 * Math.pow(3300 / 6, j / nr); for (let i = 0; i < na; i++) { const a = (i / na) * 6.2832 + (j % 2) * 3.1416 / na; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
      const c = pos.length / 3; pos.push(0, 0, 0);
      for (let i = 0; i < na; i++) ix.push(c, i, (i + 1) % na);
      for (let j = 0; j < nr; j++) for (let i = 0; i < na; i++) { const a = j * na + i, b = j * na + (i + 1) % na; ix.push(a, a + na, b, b, a + na, b + na); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(ix); return g;
    };
    const sheets = [];
    if (deep) {
      // the cloud sea: four polar sheets in one mesh, lowest first, so they blend in order from the lens above them
      const one = polar(56, 48), op = one.attributes.position, oi = one.index, nv = op.count, NL = 4, pos = new Float32Array(nv * 3 * NL), lay = new Float32Array(nv * NL), ix = new Uint32Array(oi.count * NL);
      for (let l = 0; l < NL; l++) {
        for (let v = 0; v < nv; v++) { const o = (l * nv + v) * 3; pos[o] = op.getX(v); pos[o + 1] = l * U.uLayD.value; pos[o + 2] = op.getZ(v); lay[l * nv + v] = l; }
        for (let i = 0; i < oi.count; i++) ix[l * oi.count + i] = oi.getX(i) + l * nv;
      }
      one.dispose();
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); lg.setAttribute('aLay', new THREE.BufferAttribute(lay, 1)); lg.setIndex(new THREE.BufferAttribute(ix, 1));
      await ctx.yield();
      const m = new THREE.Mesh(lg, smat(MIST_VERT, MIST_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }, { uOp: { value: 1 } }));
      m.position.set(0, U.uSheetY.value, 0); m.renderOrder = 2; m.frustumCulled = false; scene.add(m); sheets.push(m);
    }
    {
      const wg = new THREE.PlaneGeometry(3000, 3000); wg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(wg, smat(WISP_VERT, WISP_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }, { uOp: { value: 0.3 } }));
      m.position.set(0, deep ? 75 : 53.5, 0); m.renderOrder = 3; m.frustumCulled = false; scene.add(m); sheets.push(m);
    }
    {
      // the haze along the horizon: a band 1550 m from the lens, from the forest's level to 2.5 degrees above it
      const hm = new THREE.Mesh(new THREE.CylinderGeometry(1550, 1550, 150, 48, 1, true), new THREE.ShaderMaterial({ uniforms: { uHazeFar: U.uHazeFar, uOp: { value: deep ? 0.55 : 0.95 } }, vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide }));
      hm.position.set(0, 91, 0); hm.renderOrder = 1; hm.frustumCulled = false; hm.name = 'horizon-haze'; scene.add(hm); sheets.push(hm);
    }
    const puffs = [], rm = rng.fork('mist'), mp = V3(), mt = V3();
    for (let i = 0; i < Math.round(64 * detail); i++) {
      const u = rm.range(0.47, 0.84); path.pointAt(u, mp); path.tangentAt(u, mt); const lat = (rm() < 0.5 ? -1 : 1) * rm.range(22, 170);
      puffs.push([mp.x - mt.z * lat, (deep ? 60 : 36) + rm.range(0, 8), mp.z + mt.x * lat]);
    }
    for (const e of emerg) for (let k = 0; k < 2; k++) puffs.push([e.x + rm.range(-7, 7), (deep ? 61 : 38) + rm.range(0, 9), e.z + rm.range(-7, 7)]);       // climbing the trunks
    for (const T of towers) for (let k = 0; k < 2; k++) { const a = xr() * 6.2832, o = T[2] + xr.range(6, 16); puffs.push([T[0] + Math.cos(a) * o, (deep ? 60 : 37) + xr.range(0, 8), T[1] + Math.sin(a) * o]); }   // round the towers' feet
    for (let i = 0; i < 12; i++) { const sg = i % 2 ? 1 : -1; mp.copy(seat.position).addScaledVector(sideL, sg * rm.range(22, 70)).addScaledVector(fwd, rm.range(-30, 20)); puffs.push([mp.x, rm.range(74, 84), mp.z]); }
    for (let i = 0; i < 16; i++) { mp.copy(seat.position).addScaledVector(sideL, rm.range(-260, 260)).addScaledVector(fwd, rm.range(-75, -45)); puffs.push([mp.x, (deep ? 59 : 44) + rm.range(0, 12), mp.z]); }   // over the ridge foot
    { const rm9 = xr9.fork('mist'), rgm = xr10.fork('giant-mist');                    // and rising between the giants' crowns along the run, at every height from the canopy to their tops
      for (const e of giants) for (let k = 0; k < 3; k++) { const a = rgm() * 6.2832, o = e.R * rgm.range(1.1, 2.2); puffs.push([e.x + Math.cos(a) * o, lerp(deep ? 62 : 46, e.top - 6, k / 2) + rgm.range(-3, 3), e.z + Math.sin(a) * o]); }
      for (let i = 0; i < 81; i++) rm9();              // (the draws this fork gave to those puffs before are still taken, so the hollows' mist lies where it lay)
      for (let i = 0; i < 12; i++) { const t = rm9.range(150, 520); mp.copy(seat.position).addScaledVector(sideL, rm9.range(-240, 240)).addScaledVector(fwd, t); puffs.push([mp.x, lerp(56, 80, (t - 150) / 370) + rm9.range(-3, 6), mp.z]); }      // and lying in the hollows behind the ridge, against the forest that climbs beyond
    }
    const steam = mistCol.clone().multiplyScalar(0.72);
    const mist = fx.makeMist({ rng: rm, time: U.uTime, positions: puffs, size: [24, 58], color: steam, opacity: deep ? 0.13 : 0.24, drift: [0.5, 0.25, 0.3] });
    mist.object.renderOrder = 6; scene.add(mist.object);
    const plumes = [];
    if (!deep) {
      // Steam rises from the forest's hollows. Five columns, their places drawn over the whole outdoor forest, from
      // 40 m beyond the mouth to the foot of the ridge, in a band 35 to 70 m either side of the route: each takes
      // the lowest canopy of four drawn places (steam gathers where the forest dips), 60 m or more from the next
      // column and clear of the towers.
      const rp = xr.fork('plumes'), rpp = xr10.fork('plume-places'), places = [];
      let dRidge = path.length;
      for (let d = dMouth; d < path.length; d += 4) { path.posAtDist(d, mp); if ((mp.x - seat.position.x) * fwd.x + (mp.z - seat.position.z) * fwd.z > -130) { dRidge = d; break; } }
      for (let n = 0; n < 200 && places.length < 5; n++) {
        let best = null;
        for (let k = 0; k < 4; k++) {
          const d = rpp.range(dMouth + 40, dRidge), lat = (rpp() < 0.5 ? -1 : 1) * rpp.range(35, 70);
          path.posAtDist(d, mp); path.tangentAtDist(d, mt); mt.y = 0; mt.normalize();
          const x = mp.x - mt.z * lat, z = mp.z + mt.x * lat, nd = path.nearestXZ(x, z).dist;
          if (z < 60 || nd < 34.5 || nd > 70 || inTower(x, z, 14) || places.some((q) => Math.hypot(q[0] - x, q[1] - z) < 60)) continue;
          const h = canopyH(x, z); if (!best || h < best[2]) best = [x, z, h];
        }
        if (best) places.push(best);
      }
      for (const [px, pz] of places) {
        const pl = fx.makeSmokeColumn({ rng: rp, time: U.uTime, position: [px, 35, pz], height: 42, radius: [5, 16], size: [12, 32], count: 54,
          color: steam, colorTop: steam.clone().multiplyScalar(0.85), shadowColor: mistCol.clone().multiply(C('#5f8f95')), ambient: mistCol.clone().multiplyScalar(0.08), opacity: 0.4, rate: 0.03,
          wind: [0.35, 0, 0.5], bend: 0.35, rim: 0.15, scatter: 0.25, sunDir: keyDir, sunColor: C(H.glow).multiplyScalar(0.5) });
        pl.object.renderOrder = 6; scene.add(pl.object); plumes.push(pl);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- wildlife besides the rope: swiftlets streaming home, fireflies in the gaps ----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    // The swiftlet string: several hundred birds coming home against the flow. Their route enters through the right
    // of the keyhole and crosses the cave to its left side in the first 110 m (so from the stalagmite field the string
    // lies across the whole face of the keyhole, not end-on), comes down the left side and passes over the lens's left
    // shoulder, then goes on into the dark. Each bird's place on the route is a function of the lens's progress alone: the head of the
    // string is 70 m ahead of the lens when the world opens, and the string moves 1.28 m along its route for every metre
    // the lens flies (1250 m over the whole flight), so the thick of it crosses the keyhole while the lens is among the
    // stalagmites and on the first of the climb, and the last birds are in before the lens reaches the mouth.
    const NSW = Math.round(clamp(lerp(520, 640, castPick) * density, 460, 700)), swP = new Float32Array(NSW * 3), swF = new Float32Array(NSW * 3), swS = new Float32Array(NSW * 4), swD = new Float32Array(NSW * 3), rsw = rng.fork('string');
    const SW_LEN = 260, SW_N = 200, swR = new Float32Array((SW_N + 1) * 3);
    const swCurve = new THREE.CatmullRomCurve3([V3(-58, 66, 95), V3(-33, 55, 0), V3(-18, 54, -45), V3(6, 53, -82), V3(24, 52, -112), V3(24, 51, -145), V3(14, 49, -170), V3(7, 45.5, -190), V3(11, 43.5, -212), V3(19, 44, -240), V3(25, 47, -278), V3(16, 50, -330), V3(-5, 52, -420)], false, 'centripetal');
    const swTotal = swCurve.getLength();
    { const q = V3(); for (let i = 0; i <= SW_N; i++) { swCurve.getPointAt(i / SW_N, q); swR[i * 3] = q.x; swR[i * 3 + 1] = q.y; swR[i * 3 + 2] = q.z; } }
    for (let i = 0; i < NSW; i++) {
      swD[i * 3] = SW_LEN * Math.pow((i + rsw()) / NSW, 0.85); swD[i * 3 + 1] = rsw.range(-2, 2) * (0.5 + rsw()); swD[i * 3 + 2] = rsw.range(-1.3, 1.7) * (0.5 + rsw());       // how far behind the head, and off the line
      swS[i * 4] = rsw(); swS[i * 4 + 1] = rsw.range(0.85, 1.15); swS[i * 4 + 2] = rsw(); swS[i * 4 + 3] = rsw();
    }
    const swGeo = new THREE.InstancedBufferGeometry();
    swGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); swGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const swPA = new THREE.InstancedBufferAttribute(swP, 3), swFA = new THREE.InstancedBufferAttribute(swF, 3);
    swPA.setUsage(THREE.DynamicDrawUsage); swFA.setUsage(THREE.DynamicDrawUsage);
    swGeo.setAttribute('aP', swPA); swGeo.setAttribute('aF', swFA); swGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(swS, 4)); swGeo.instanceCount = NSW;
    const swMesh = new THREE.Mesh(swGeo, smat(SWIFT_VERT, SWIFT_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide })); swMesh.frustumCulled = false; swMesh.renderOrder = 7; scene.add(swMesh);
    const moveSwifts = (u, time) => {
      const head = 235 + 1250 * u, step = swTotal / SW_N;
      for (let i = 0; i < NSW; i++) {
        const r = swS[i * 4 + 3], d = head - swD[i * 3] + 3 * Math.sin(time * 0.9 + r * 30), f = clamp(d / step, 0, SW_N - 1.001), k = Math.floor(f), fr = f - k, a = k * 3;
        const tx = swR[a + 3] - swR[a], ty = swR[a + 4] - swR[a + 1], tz = swR[a + 5] - swR[a + 2], tl = Math.hypot(tx, tz) || 1;
        const ox = swD[i * 3 + 1] + 0.5 * Math.sin(time * 1.7 + r * 40), oy = swD[i * 3 + 2] + 0.4 * Math.sin(time * 2.3 + r * 70), wv = 0.25 * Math.cos(time * 1.7 + r * 40);
        swP[i * 3] = swR[a] + tx * fr + (tz / tl) * ox; swP[i * 3 + 1] = swR[a + 1] + ty * fr + oy; swP[i * 3 + 2] = swR[a + 2] + tz * fr - (tx / tl) * ox;
        swF[i * 3] = tx + (tz / tl) * wv * step; swF[i * 3 + 1] = ty; swF[i * 3 + 2] = tz - (tx / tl) * wv * step;
        swS[i * 4 + 1] = (d > 2 && d < swTotal - 4) ? Math.abs(swS[i * 4 + 1]) : -Math.abs(swS[i * 4 + 1]);      // not yet come, or gone into the dark
      }
      swPA.needsUpdate = true; swFA.needsUpdate = true; swSA.needsUpdate = true;
    };
    const swSA = swGeo.getAttribute('aSeed'); swSA.setUsage(THREE.DynamicDrawUsage);
    moveSwifts(0, 0);
    // and more of them outside, a looser flock coming over the ridge and down the forest to the mouth, low and to the left
    const swiftCol = { body: '#1d1a22', belly: '#3a3640', wingC: '#17151c', trail: '#221f28', tip: '#0e0d12', head: '#17151c' };
    const sRoute = [[seat.position.x + sideL.x * 60 - fwd.x * 10, 106, seat.position.z + sideL.z * 60 - fwd.z * 10]];
    for (const u of [0.88, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4]) { path.pointAt(u, mp); path.tangentAt(u, mt); mt.y = 0; mt.normalize(); sRoute.push([mp.x + mt.z * 16, mp.y - 6, mp.z - mt.x * 16]); }
    sRoute.push([-40, 76, 70], [-30, 72, 0], [-20, 62, -60]);
    const swFlock = F.makeFlock({ rng: rng.fork('swifts'), species: 'swifts', count: Math.round(50 * density), speed: 17, spread: [5, 3.5, 150], ...swiftCol, route: sRoute, closed: false });
    fauna.add(swFlock, { always: true });
    const flyPos = [], rfl = rng.fork('fireflies'), nFly = Math.round(170 * H.fireflies * density * detail);
    for (let i = 0; i < nFly; i++) {
      const u = rfl.range(0.45, 0.86); path.pointAt(u, mp); path.tangentAt(u, mt); const lat = (rfl() < 0.5 ? -1 : 1) * rfl.range(6, 110), x = mp.x - mt.z * lat, z = mp.z + mt.x * lat;
      flyPos.push([x, canopyH(x, z) + rfl.range(0.5, 5), z]);
    }
    if (nFly > 0 && !rare) fauna.add(F.makeFireflies({ rng: rfl, count: nFly, positions: flyPos, size: 0.42, color: '#d8ff7a', color2: '#ffd070', blink: 0.4, nearFade: [3, 9] }));
    await ctx.yield();

    // ---- weather: a thunderhead far off to the right with a rain curtain and eased sheet lightning ----
    let storm = null; const flashU = { uFlash: { value: 0 }, uMode: { value: 1 }, uCol: { value: C('#b9c8ff').multiplyScalar(1.5) } };
    if (weather === 'thunder') {
      storm = makeCloudField({ rng: rng.fork('storm'), sky, mode: 'cumulus', at: [[-760, 240, 1900, 950], [-300, 260, 2300, 520], [-1250, 230, 1600, 640]], puffs: 44, height: 0.95, wind: [0.5, 0, 0.15] });
      scene.add(storm.object);
      const add = (w, h, x, y, z, uni, blend) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), smat(STORM_VERT, STORM_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: blend }, uni));
        m.position.set(x, y, z); m.lookAt(40, y, 250); m.renderOrder = 3; scene.add(m);
      };
      add(620, 260, -800, 125, 1850, { uFlash: { value: 0 }, uMode: { value: 0 }, uCol: { value: fogCol.clone().multiplyScalar(0.55) } }, THREE.NormalBlending);
      add(1100, 620, -780, 470, 1820, flashU, THREE.AdditiveBlending);
    }

    // ---- rare: the fireflies of the whole forest fall into step: in the crowns along the flight, in the emergents'
    // umbrellas and on the towers' ledges, pulsing together, each beat running through the forest as a wave ----
    if (rare) {
      const rf2 = xr.fork('sync'), n = Math.round(3200 * detail), fp = new Float32Array(n * 3), fr = new Float32Array(n * 2), q = V3(), t = V3();
      for (let i = 0; i < n; i++) {
        const pick = rf2(); let x, y, z;
        if (pick < 0.2) {
          const T = towers[Math.floor(rf2() * towers.length)], a = rf2() * 6.2832, t = rf2.range(0.2, 1), r = towerRad(T, a, t) + 0.8;
          x = T[0] + Math.cos(a) * r; z = T[1] + Math.sin(a) * r; y = TB + t * (towerTop(T, a) - TB) + rf2.range(0.3, 2.5);
        } else if (pick < 0.45 && emerg.length) {
          const e = emerg[Math.floor(rf2() * emerg.length)], a = rf2() * 6.2832, o = Math.sqrt(rf2()) * e.R;
          x = e.x + Math.cos(a) * o; z = e.z + Math.sin(a) * o; y = e.top - rf2.range(0, 7) * (e.R / 12);
        } else {
          const u = rf2.range(0.33, 0.8); path.pointAt(u, q); path.tangentAt(u, t); const lat = (rf2() < 0.5 ? -1 : 1) * Math.pow(rf2(), 1.4) * 180;
          x = q.x - t.z * lat; z = q.z + t.x * lat; y = canopyH(x, z) + rf2.range(-0.5, 3.5);
          if ((x - seat.position.x) * fwd.x + (z - seat.position.z) * fwd.z > -80) y = -500;        // not inside the ridge
        }
        fp[i * 3] = x; fp[i * 3 + 1] = y; fp[i * 3 + 2] = z; fr[i * 2] = rf2(); fr[i * 2 + 1] = rf2();
        if ((i & 255) === 255) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(fp, 3)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(fr, 2)); g.instanceCount = n;
      const m = new THREE.Mesh(g, smat(FLY_VERT, FLY_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, { uFlyCol: { value: C('#d2ff76').multiplyScalar(3.6) } }));
      m.frustumCulled = false; m.renderOrder = 6; m.name = 'fireflies-in-step'; scene.add(m);
    }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ---- per frame ----
    const camP = V3(), res = new THREE.Vector2(), gl = V3(), gc = new THREE.Color();
    const heroGlow = C(H.glow).lerp(C('#c9d2e6'), deep ? 0.6 : 0.15).multiplyScalar(H.glowI * (deep ? 0.6 : 0.85)),      // under the amber moonrise the bats stay umber, not rust
      heroLamp = C(H.lamp).multiplyScalar(1.6), batIn = new THREE.Color(1.2, 1.18, 1.17), batOut = C(H.skyCol).lerp(C('#9a9a9a'), 0.5).multiplyScalar(1.5);
    const p0 = path.pointAt(0, V3()), t0 = path.tangentAt(0, V3()).normalize(), sqH = V3();
    hero.setLeg(sA, sB, 0);
    // Seen from down the passage the rope runs out of the mouth end-on: there the far bats are drawn as a share of
    // their number, each a little larger, thinning further with distance beyond the mouth, so they read as separate
    // animals with sky between them (those within 45 m of the lens are all there). And outside the rope sways:
    // two slow travelling waves, grown in over the first 220 m beyond the mouth.
    hero.setKeyThin(-140, -30, 0.055, 110);
    hero.setSway(9, 8, hero.stationNear(V3(0, 113, 130)) * hero.length, 220);
    const camF = V3();
    function update(dt, time, camera, u) {
      U.uTime.value = time; U.uU.value = u;
      camP.setFromMatrixPosition(camera.matrixWorld); U.uCam.value.copy(camP);
      ctx.renderer.getDrawingBufferSize(res);
      U.uPx.value = 2 / ((camera.projectionMatrix.elements[5] || 1.6) * Math.max(res.y, 8));
      const open = smoothstep(-50, 22, camP.z);                       // 0 in the cave, 1 outside
      // while the world is seen through the previous portal (u is 0 then, and the camera is that portal's) the squadron
      // waits round the path's first point and heading, where a camera starting the flight will find it
      if (u > 0) { hero.setPark(null); hero.setSquadHeading(path.tangentAt(u, sqH).normalize()); } else { hero.setPark(p0, t0); hero.setSquadHeading(null); }
      // The bats ride the stretch of rope round the lens until the river has gone over the top of the frame; then they
      // move to the return leg, the far ones centred 110 m upstream of the notch, so the river that comes back over
      // the ridge is bats from the moon to the right-hand edge of the frame. The hand-over is set by where the lens
      // is and how it looks, by nothing else: clearOf is the metres by which the whole first pass of the rope (its
      // balls, rivB) stands outside the lens's own frame, measured from the four planes that bound the picture; it
      // is below zero while any of the rope is in the picture (all through the cave and the run at the moon) and
      // passes zero where the river, overhead, has left by the top of the frame and by its sides: there the bats
      // begin to move, and they have moved when the rope stands 8 m clear, which by the route's own turn and dive
      // under the river is within the next 15 m of flight. The leg's smoke comes in ahead of them, while the last
      // of the river is leaving the picture (from 40 m to 8 m short of clear), so the sky is never without the
      // rope. From the cave and from the run the leg is not there.
      camera.getWorldDirection(camF);
      let clearOf = -1;
      if (u > 0) {
        const e = camera.matrixWorld.elements, pe = camera.projectionMatrix.elements, tH = 1 / (pe[0] || 0.9), tV = 1 / (pe[5] || 1.6), cH = 1 / Math.hypot(1, tH), cV = 1 / Math.hypot(1, tV);
        clearOf = 1e9;
        for (let i = 0; i < rivB.length && clearOf > -40; i += 4) {
          const vx = rivB[i] - camP.x, vy = rivB[i + 1] - camP.y, vz = rivB[i + 2] - camP.z;
          const xc = vx * e[0] + vy * e[1] + vz * e[2], yc = vx * e[4] + vy * e[5] + vz * e[6], zc = -(vx * e[8] + vy * e[9] + vz * e[10]);
          const o = Math.max((Math.abs(xc) - zc * tH) * cH, (Math.abs(yc) - zc * tV) * cV) - rivB[i + 3];
          if (o < clearOf) clearOf = o;
        }
      }
      const wk = smoothstep(0, 8, clearOf);
      if (wk > 0) { const sN = hero.stationNear(camP) * hero.length; hero.setWindow(lerp(sN, sX, wk), lerp(sN + 260, sX - 110, wk)); } else hero.setWindow(null);
      hero.setLeg(sA, sB, u > 0 ? smoothstep(-40, -8, clearOf) : 0);
      gl.copy(lampPos).sub(camP).normalize().lerp(keyDir, open).normalize(); gc.copy(heroLamp).lerp(heroGlow, open);
      // inside, the mouth is the lamp: a thin rim on the edge turned to it, and skin lit only where a wing crosses it;
      // outside a faint silver rim from the moon on sooty bats
      hero.setLight({ glowDir: gl, glowColor: gc, open: 0.1 + 0.9 * open, rim: lerp(0.15, 0.035, open), through: lerp(0.6, 0.2, open), dif: 0.5, spread: open, follow: lerp(0.75, 0.6, open), phase: Math.max(0, u) * 30, batAmb: batIn, batAmbOut: batOut, inside: 1 - open });
      hero.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera); far.update(dt, time, camera);
      for (const m of sheets) { m.position.x = camP.x; m.position.z = camP.z; }
      // what cannot be seen is not drawn: the ridge's and the towers' bushes, ledges and pines from inside the cave; the
      // roost, drips, dust, stalagmites, shaft and swiftlet string once the cave is behind
      const out = camP.z > 25, inCave = camP.z < 5, deepIn = camP.z < -30, mouthIn = camP.z < 22;
      for (const c of culls) {                         // a bucket of crowns every one of which is behind the lens's plane is not drawn
        const a = c.a; let vis = false, near = !c.main;
        for (let i = 0; i < a.length && !(vis && near); i += 4) {
          const dx = a[i] - camP.x, dy = a[i + 1] - camP.y, dz = a[i + 2] - camP.z;
          if (dx * camF.x + dy * camF.y + dz * camF.z > -a[i + 3]) vis = true;
          if (dx * dx + dz * dz < 48400) near = true;
        }
        c.im.visible = vis;
        if (c.main) c.im.geometry.setDrawRange(0, near ? Infinity : c.main);      // and of an emergent more than 220 m off only its main parts
      }
      airU.uAirK.value = 1 - smoothstep(-190, -45, camP.z); airMesh.visible = airU.uAirK.value > 0.001;
      backField.visible = camP.z > 330;
      { const farR = Math.hypot(camP.x - seat.position.x, camP.z - seat.position.z) > 300; for (const im of finLod) { const l = im.geometry.userData.lod; im.geometry.setDrawRange(farR ? l[1] : 0, farR ? l[2] : l[0]); } }
      for (const o of notch) o.visible = out;
      for (const l of bushLod) { const nearL = out && Math.hypot(camP.x - l[3], camP.z - l[4]) < 215 && (l[4] > 400 || camP.z < 430); l[0].visible = l[1].visible = nearL; l[2].visible = out && !nearL; }
      // the left field: from inside the cave only the rows the keyhole can show (those far enough out), all of it outside
      { const ud = leftField.userData, dzc = -camP.z, rows = dzc <= 5 ? ud.rows : clamp(Math.ceil((LZ1 - dzc * 3.9) / ud.dz), 0, ud.rows); leftField.geometry.setDrawRange(0, rows * ud.rowTris); }
      towersOuter.visible = camP.z > -outerGate - 12;
      { const dz = -camP.z; for (const [im, gs] of gated) { let c = gs.length; if (dz > 5) { c = 0; while (c < gs.length && gs[c] >= dz) c++; } im.count = c; } }
      roost.visible = inCave; drips.visible = inCave; dust.object.visible = inCave; rays.object.visible = deepIn;
      { const zb = camP.z - 25;                        // a slab wholly more than 25 m behind the lens cannot be in the picture
        for (const m of caveDeep) m.visible = deepIn && m.userData.zMax > zb; for (const m of caveStal) m.visible = deepIn && m.userData.zMax > zb;
        for (const m of cave) m.visible = mouthIn && m.userData.zMax > zb; for (const m of caveFloor) m.visible = mouthIn && m.userData.zMax > zb; for (const m of caveSill) m.visible = mouthIn && m.userData.zMax > zb; }
      hero.setMouthVisible(mouthIn);
      swMesh.visible = camP.z < 60;
      if (swMesh.visible) moveSwifts(u, time);
      fauna.update(dt, time, camera, u);
      swFlock.object.visible = camP.z > -60;
      mist.update(dt, time, camera); dust.update(dt, time, camera); dust.setOpacity(1 - open);
      for (const pl of plumes) pl.update(dt, time);
      U.uVeil.value.copy(veilCol).multiplyScalar(1 - smoothstep(-200, -60, camP.z));
      if (storm) { storm.update(dt, time, camera); flashU.uFlash.value = flashAt(time); }
    }

    return {
      scene, path, duration: 51,
      // unhurried among the stalagmites, quick up the climb and out over the forest, slowest (0.78) from u 0.52 to 0.56
      // where the rope crosses the moon at its closest, quick through the duck under it and the turn between the
      // towers, then even to the ring
      pace: (u) => 0.78 + 0.37 * smoothstep(0.05, 0.13, u) - 0.1 * smoothstep(0.2, 0.28, u) - 0.27 * smoothstep(0.47, 0.52, u) + 0.34 * smoothstep(0.555, 0.62, u) - 0.1 * smoothstep(0.7, 0.8, u),
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 26, sway: 0.5, bank: 1 },
      pois: [
        { at: V3(0, 50, 12), from: 0, to: 0.1, weight: 0.6 },                     // the keyhole over the stalagmite field
        { at: V3(0, 99, 12), from: 0.06, to: 0.3, weight: 0.7 },                  // the head of the keyhole, where the rope overhead runs out into the sky
        { at: keyDir.clone().multiplyScalar(4000).add(V3(80, 100, 170)), from: 0.33, to: 0.57, weight: 0.3 },      // the moon, with the rope crossing it
        { at: keyDir.clone().multiplyScalar(4000).add(V3(80, 100, 170)), from: 0.5, to: 0.64, weight: 0.75 },      // and held on the moon through the duck, so the river passes over the top of the frame
        { at: seat.position.clone(), from: 0.64, to: 1, weight: 0.5 },            // the ring between the blades
      ],
      portal: { shape: 'circle', radius: 7, color: H.portal, glow: 1, revealDistance: 420, tilt: true },
      post: { exposure: H.exposure, bloom: { strength: 0.34, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#ffffff', shadowTint: H.shadowTint, vignette: 0.3, grain: 0.03, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
