// THE DROWNED DOMES. Hard blue noon on a frozen reservoir: from the windward seat of an ice yacht, 2 m above the ice, we leave a
// fisher's tent and run up a channel of onion domes that stand through black mirror ice like buoys, each lying whole in the ice
// beside us, with the streets of a drowned town streaming underneath (we look down into its main street a quarter of the way up). The whole
// 74 m bell tower stands ahead on its mirror; then we drop to 1.3 m and fly the 17 m lane between the five-domed cathedral and the tower: the
// cathedral's domes loom to port, the tower goes up out of the frame to starboard with the cathedral's shadow thrown on it. Out of the lane we swing
// left toward the low sun and its road of glints, and run down between more domes onto a sunken lime avenue and into a half-buried monastery gate.
// THE LIGHT CHANGES ALONG THE RUN (day and golden hour): the sun sinks and warms from cream to gold, the haze and the horizon warm with it,
// shadows lengthen (to 7 times their height at most): a cobalt first half, a gold-and-blue lane, a warm last third.
// THE CITY: beyond the lone domes stands one massed cathedral-city (the part's buildCity): tiered churches, tent roofs, belfries and a kremlin
// wall with round towers climbing to the bell tower, a walled monastery to starboard of the channel and a convent to port, far spires on the
// horizon; a low ground mist (mistAt in the shared GLSL, uMistK) lies over the far ice so the middle distance is never empty water.
// The ice: a mirror (the sky's pale band far off, mid blue in the middle distance, cobalt under the eye, where the town shows through),
// with fine short branching cracks that fade with distance, bubble columns, frost and snow tongues away from our wind-swept track.
// Every dome, the tower and the gate lie whole and crisp in that mirror. Frosted bands of rime lie across it down the wind, off our own track and
// only near by (far off the ice is a calm mirror); the portal lies in the ice before the gate as a streak of its own light.
// WHAT SAYS "ICE" (all of it lies ON the surface, across the mirror images, and none of it softens them): a faint sheen and a slight cool haze
// at grazing angles, a snow bank and a short lee drift at the foot of every wall and drum near our track (banks in the town mesh, their skirts
// and frost from uFootA/uFootB), a few thin drifts of blown snow, fine runner scratches along our own track. The drowned town lies bluer and
// dimmer with depth along the main street (a rule in world space: the lime avenue of the last run keeps its paler bed). The one racing crack is
// bright for its whole run to the tower's foot and the mirror gives way to it (raceD, raceK in the shared GLSL). Looking into the low sun, a few
// snow snakes are lit from behind. On and under the ice by the track: six fishing holes in slush rings with spruce twigs, the sledge with its
// auger and two pike, wells with sweeps, leaning telegraph poles, the stump of the fire-watch tower, reed stubble along the monastery wall.
// A second fishers' pitch lies on the ice over the market square; a flock lifts off the monastery wall on the first reach.
// Our yacht shows as two small parts low in the bottom corners, each in the frame for a short stretch (never in the lane or by the tower).
// Coordinates: X east, Z south, Y up, ice at y 0. Looks: the hour (day, golden, dawn or night from ctx.vary.hour, else by mood),
// the weather by seed (still and clear | ground blizzard: a white horizon, streamers of spindrift across the track, drifts away from it |
// hoar morning: a lower, warmer sun over a cream horizon, frost flowers, rime on everything), which domes are gilt or starred and the rivals'
// sail colours by seed (tanbark red, cream or ochre). Rare: blue dusk, and the windows of the drowned town come on amber in a ring spreading from the
// tower (u 0.25-0.6), the avenue lit to the gate; the bell swings wide and the crows double.
// The town's lesser churches (the part's EXTRA, CHURCHES and TOWER2) stand either side of the whole run and out to the horizon, with a
// monastery behind the gate; the nearer ones throw analytic shadows on the ice (uDome), and no house or apple tree stands under one.
// THE KIT'S FLOCKS, the cure of a fault in live (the owner's rule texts R, T and U): six of the nine calls (all crows, all loose flocks) could touch our line: the three bursts across it and the wheels over the tent, the gate and the lane. Each is handed its wander written out, maxSigma 3 and a course laid over our line by its own numbers, so that the box of three scatters with the wander and the body stays 2.0 m and more clear of it on every deal; keepClear is not called (the per-bird clearing was tried on the two low wheels and would move over a third of their members), nothing is added at the build.
// The numbers: the first and the second burst cross at height 12 (were 8 and 7) and the two low wheels have their centres 16 m up (the tent's, was 7) and 17.5 (the lane's, was 9), each of the four with a flatter spread of its own (the bursts 30, 5, 30, the wheels 30, 4, 30; live: the crows' own 30, 10, 30) and wander 2, 1.2, 2, so they stay near; the third burst crosses at height 19 (was 11) with wander 2, 1.2, 2 and the jackdaws' centre is 31 m up (was 24), both with the crows' own spread. The three calls that passed (the crows round the bell tower, the flock off the monastery wall, the cathedral's) only have the species' own wander written out, as the kit took it.
// Least from the flown line on forty seeds, in the order of the calls: 34.76 (as live), 2.95, 5.14, 2.66 (as live), 3.20, 5.46, 3.31, 4.29 and 6.55 (as live) m; in live the six were under 2.0 m, all touching. The count rests on maxSigma in live's kit.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, DOMES, GATE, BED_Y, COL, MAT, Acc, M, UNIT, GLSL_COMMON, makeUniforms, makeSurfaceMaterial, SHADOWS, KEEPOUT, CITY_KEEP, FEET, TIPS, NFOOT, driftTail, perch, setLane } from '../parts/drowned-domes.js';

const D2R = Math.PI / 180;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
// The track: low over the ice (eye 2 m) up the channel of domes with the whole tower ahead; then down to 1.3 m and, in a long left-hand curve,
// straight for the lane between the cathedral and the bell tower (17 m wall to wall): the cathedral's domes loom to port, the tower goes up out of
// the frame to starboard, a gilt dome stands framed at the lane's far end. Out of the lane we swing left round the cathedral's corner
// (radius 55 m), the low sun and its road of glints come in from the left; we lift to 6 m over the head of the lime avenue (the limes, the long shadows
// and the sun's road laid out below us to the gate) and come down again between the last domes into the gate.
const PATH = [[-226.6, 2.2, 556.3], [-205.5, 2.1, 511], [-182.8, 2.0, 471.9], [-154.1, 2.0, 391.5], [-110.9, 2.0, 317.9], [-82.2, 2.0, 237.5],
  [-41, 1.8, 165], [-15, 1.6, 118], [-2, 1.4, 90], [2, 1.3, 60], [-7.9, 1.3, 29.9], [-17, 1.3, 6.6], [-28.25, 1.3, -22.3],
  [-40.1, 1.4, -40.7], [-58.5, 1.5, -52.8], [-80.9, 3.0, -56.8], [-120, 6.4, -52], [-155, 6.0, -46], [-200, 4.2, -44], [-245, 3.0, -44], [-300, 2.6, -44]];
const LANE = 2.4 + 5.6 / 2;           // the yachts' lane, metres either side of our flown line: the leading rival's offset to starboard and half its runner plank (both at its own lines below)
const O = [-205, 510], DA = [0.42, -0.908], DB = [0.908, 0.42];           // street grid: a along the main street, b to its right
const gx = (a, b) => O[0] + DA[0] * a + DB[0] * b, gz = (a, b) => O[1] + DA[1] * a + DB[1] * b;
const TH = Math.atan2(DA[0], DA[1]);                                       // yaw that turns local +z along the main street
const ROAD_B = -80;                                                        // the ice road, 80 m left of the main street line

// ---------- the ice: one transparent, depth-writing sheet drawn after the town ----------
function makeIceMaterial(U) {
  const ND = U.uDome.value.length;                                         // the nine domes and the lesser churches near enough to throw a shadow we see
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: true, premultipliedAlpha: true,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uSky, uGnd, uZen, uHor, uMid, uFogCol, uShadeCol, uScat;
      uniform float uSunK, uHemiK, uTime, uFogDen, uCover, uShLen, uShK, uWind, uFrostK, uStarK, uFineK;
      uniform vec3 uDome[${ND}]; uniform vec4 uSail;
      varying vec3 vW;
      ${GLSL_COMMON}
      vec3 skyCol(vec3 d){ float y = clamp(d.y, 0., 1.); vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.22, y)); return mix(c, uZen, smoothstep(0.15, 0.85, y)); }
      // the cracks: fine white trees, one to a cell and half the cells bare. A bent stem of four short runs with two side branches, a few metres across:
      // nothing long, nothing straight, no net. q in cells; x = distance to the nearest crack (cells), y = its weight
      vec2 crk(vec2 q, float sd){
        vec2 ci = floor(q); float d = 9., wt = 0.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 c = ci + vec2(float(i), float(j)); vec2 h = h22(c + sd); vec2 g = h22(c + sd + 31.7);
          float a = g.x * 6.2832; float len = 0.22 + 0.2 * h.y; float sg = h.x > 0.5 ? 1. : -1.;
          float a1 = a + (h.x - 0.5) * 1.1, a2 = a1 + (g.x - 0.5) * 1.1;
          vec2 d0 = vec2(cos(a), sin(a)), d1 = vec2(cos(a1), sin(a1));
          vec2 p0 = c + 0.3 + 0.4 * h, p1 = p0 + d0 * len, p2 = p1 + d1 * len, p3 = p2 + vec2(cos(a2), sin(a2)) * len * 0.8, pm = p0 - d1 * len * 0.8;
          vec2 b1 = p1 + vec2(cos(a + sg), sin(a + sg)) * len * 0.75, b2 = p2 + vec2(cos(a1 - sg * 0.9), sin(a1 - sg * 0.9)) * len * 0.6;
          float dd = min(min(segD(q, p0, p1), segD(q, p1, p2)), min(segD(q, p2, p3), segD(q, pm, p0)));
          dd = min(dd, min(segD(q, p1, b1), segD(q, p2, b2)));
          dd = mix(9., dd, step(g.y, 0.42));
          if (dd < d) { d = dd; wt = 0.45 + 0.55 * g.x; }
        }
        return vec2(d, wt);
      }
      // the sky as the ice mirrors it: the pale horizon band lies only in the far ice, the middle distance is the mid blue, cobalt under the eye
      vec3 reflSky(vec3 d){ float y = clamp(d.y, 0., 1.); vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.06, y)); return mix(c, uZen, smoothstep(0.04, 0.45, y)); }
      // a tuft of hoar: a ragged clump of feathers a hand or two across, each its own size, a third of the cells bare
      // (its outline is feathered: seven and thirteen lobes, each tuft turned its own way, small ones far commoner than large)
      float tuft(vec2 q, float sd){ vec2 i = floor(q); vec2 o = h22(i + sd); vec2 d = fract(q) - 0.25 - 0.5 * o; float ang = atan(d.y + 1e-6, d.x + 1e-5);
        float r = length(d) * (1. + 0.42 * sin(ang * 7. + o.x * 6.28) + 0.22 * sin(ang * 13. + o.y * 6.28));
        return smoothstep(0.42, 0.68, vn(q * 3.3 + o * 9.)) * (1. - smoothstep(0.1 + 0.14 * o.x * o.x, 0.28 + 0.14 * o.y * o.y, r)) * step(0.3, h21(i + sd + 2.9)); }
      float capsule(vec2 p, vec2 a, vec2 b, float r0, float r1){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
        float d = length(pa - ba * h); float r = mix(r0, r1, h); float e = 0.5 + h * 3.; return 1. - smoothstep(r - e, r + e, d); }
      vec2 shadowAt(vec2 p){                 // x: tower, domes and gate; y: those and our own sail
        vec2 d = -uSun.xz / max(length(uSun.xz), 1e-3); float L = uShLen;
        float s = max(capsule(p, vec2(0.), d * 31. * L, 10., 8.), capsule(p, d * 31. * L, d * 60. * L, 6.5, 4.5));
        s = max(s, capsule(p, d * 60. * L, d * 74. * L, 3., 0.4));
        for (int i = 0; i < ${ND}; i++) { vec3 dm = uDome[i]; s = max(s, capsule(p, dm.xy, dm.xy + d * dm.z * 1.5 * L, dm.z * 0.5, dm.z * 0.12)); }
        vec2 g = p - vec2(-300., -44.); float sg = g.x / max(d.x, 0.2); float gzz = g.y - d.y * sg;
        s = max(s, step(0., sg) * (1. - smoothstep(18. * L - 8., 18. * L, sg)) * (1. - smoothstep(12., 13.5, abs(gzz))));
        float sa = max(s, 0.8 * capsule(p, uSail.xy + d * 5., uSail.xy + d * 9. * L, 1.6, 0.4) * uSail.z);
        return clamp(vec2(s, sa), 0., 1.);
      }
      void main(){
        vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
        float ndv = max(V.y, 0.); vec2 p = vW.xz;
        float px = fwidth(p.x) + fwidth(p.y);
        float fa = fwidth(dot(p, vec2(0.616, 0.788)));                                  // a pixel's footprint across the wind (for the snow snakes)
        vec2 par = -V.xz / max(V.y * 1.31 + 0.4, 0.4);
        // what lies on the ice (the fields and their screen footprints are taken here, outside every branch): the snow collar and lee drift at every
        // foot that pierces the ice, the runner scratches along our own track
        float ldP = laneD(p);
        float fdF = footD(p); float fwF = clamp(fwidth(fdF), 0.01, 3.);
        float slS = ldP + scratchW(p); float fwS = clamp(fwidth(slS), 0.003, 0.7);
        // a black mirror: the sky lies in it from 25 m outward and as a cobalt sheen right under the eye, where the town shows through
        // (over our own track, which the wind keeps polished, the glass stays clear a little further ahead: the main street reads under the runner)
        float refl = 0.24 + 0.72 * smoothstep(0., 1., 1. - clamp(ndv * mix(9., 6.5, smoothstep(8., 34., ldP)), 0., 1.));
        vec3 R = vec3(-V.x, max(V.y, 0.), -V.z);
        vec3 sky = reflSky(R);
        vec2 sxz = uSun.xz / max(length(uSun.xz), 1e-3); float saz = max(dot(R.xz / max(length(R.xz), 1e-3), sxz), 0.);
        float saz2 = saz * saz; sky += uScat * saz2 * saz2 * saz * exp(-R.y * 7.);                     // the low sun's wash, mirrored
        float sd = max(dot(normalize(R + vec3(0., 0.02, 0.)), uSun), 0.);
        float sp = h21(floor(p * 11.) + floor(uTime * 6.) * 0.37);
        float sd2 = sd * sd; sd2 *= sd2; sd2 *= sd2; sd2 *= sd2; sd2 *= sd2;           // sd^32
        // the glitter road: sparse hard glints on ice that stays dark between them (no haze)
        float road = sd2 * sd2 * sd2 * (0.04 + 6. * step(0.982, sp) * (1. - smoothstep(0.15, 0.4, length(fract(p * 11.) - 0.25 - 0.5 * h22(floor(p * 11.) + 3.7))))) + sd2 * 0.012;
        // the sun's road: when we look toward the low sun, a narrow path of glints runs from under it down the ice to our runner
        float sunRd = exp(-(1. - saz) * 700.) * exp(-max(R.y - uSun.y, 0.) * 2.2) * smoothstep(0.0, 0.02, R.y + 0.004);
        vec2 gq = p * 5.; float gh = h21(floor(gq) + floor(uTime * 7.) * 0.31);
        float glint = step(0.86, gh) * (1. - smoothstep(0.1, 0.42, length(fract(gq) - 0.25 - 0.5 * h22(floor(gq) + 5.1))));
        road += sunRd * (0.1 + 5. * mix(glint, 0.08, smoothstep(0.06, 0.4, px)));
        road = min(road, 2.5);
        // frost sparkle travelling with the eye: sparse glints that come and go on the clear ice within 15 m
        vec2 kq = p * 4.; float kh = h21(floor(kq) + floor(uTime * 5.) * 0.17);
        float twk = step(0.986, kh) * (1. - smoothstep(0.03, 0.13, length(fract(kq) - 0.25 - 0.5 * h22(floor(kq) + 7.7)))) * (1. - smoothstep(0.05, 0.3, px));
        // the ice itself: a metre of clear blue glass lit by the day, which lifts the black depths to cobalt (the roofs read through it)
        float bodyA = (1. - refl) * 0.34;
        vec3 pre = sky * refl + uSunCol * (road * 1.6 + twk * 1.3) * min(uSunK * 0.3, 1.) + vec3(0.035, 0.15, 0.3) * (uSunK * 0.1 + uHemiK * 0.22) * bodyA; float A = refl + bodyA;
        // a faint sheen and, at grazing angles, a slight cool haze: the surface of the ice itself, lying over the sky it mirrors (and, in the mirror
        // shader, over every mirror image), in broad soft lanes down the wind. No line, no edge: a sheet
        float hz = hazeAt(p, ndv); pre = mix(pre, mix(uMid, uHor, 0.55), hz); A = mix(A, 1., hz);
        // the portal lies in the mirror like every dome: a streak of its light on the ice from the gate toward us
        vec2 pg = p - vec2(-300., -44.); float pgl = step(0., pg.x) * exp(-pg.x * 0.03) * exp(-pg.y * pg.y / (16. + pg.x * pg.x * 0.02));
        pre += vec3(0.72, 0.86, 1.0) * pgl * 0.45 * refl;
        vec2 sq = R.xz / (R.y + 0.2) * 17.; float stv = h21(floor(sq) + 0.5); float sr = 0.05 + 0.1 * fract(stv * 37.);                          // stars lying in the black ice (night)
        pre += vec3(0.75, 0.86, 1.0) * uStarK * step(0.93, stv) * (1. - smoothstep(sr * 0.4, sr + px * 0.5, length(fract(sq) - 0.5)))
          * (0.5 + 0.5 * sin(uTime * 2.3 + stv * 90.)) * (1. - smoothstep(0.3, 2.5, px));
        vec2 sh2 = shadowAt(p) * uShK; float sh = sh2.y;
        float laneOut = smoothstep(26. * uLaneK, 90. * uLaneK, laneD(p));
        float sn = snowLod(p, uCover, px);
        // the white collar and short lee drift at each foot (they tell the eye where the surface is), and a few thin drifts of blown snow lying
        // across the polished ice near by; like every drift they hide the mirror under them (the mirror shader gives way to the same fields)
        vec3 fc = footCue(p, fdF, fwF, dist);
        float wsp = wispAt(p) * (1. - smoothstep(0.6, 2.4, fa)) * (1. - smoothstep(50., 110., dist));
        sn = max(sn, max(fc.x, 0.92 * wsp));
        vec3 lit = uSunCol * uSunK * 0.5 * (1. - sh * 0.82);
        vec3 snowCol = 0.77 * (lit + mix(uGnd, uSky, 0.8) * uHemiK) * 0.3183;
        snowCol = mix(snowCol, uShadeCol, sh * 0.35);
        // wind-carved ridges on the drifts (sastrugi), combed along the wind: a drift is a surface, not a white patch
        vec2 ws = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
        float rip = vn(vec2(ws.x * 0.22, ws.y * 1.5)) * 0.6 + vn(vec2(ws.x * 0.8 + 3., ws.y * 5.)) * 0.4;
        snowCol *= mix(1., 0.6 + 0.8 * rip, (1. - smoothstep(0.25, 2.2, px)) * (1. - 0.5 * sh));
        // a drift near the eye is a surface with an edge: the rim that faces the sun catches the light, the lee edge throws a crisp blue shadow on the ice
        float snS = sn; if (px < 0.9) snS = snowAt(p + sxz * 0.5, uCover);
        float leeSh = clamp(snS - sn, 0., 1.) * (1. - smoothstep(0.4, 0.9, px)), sunRim = clamp(sn - snS, 0., 1.) * (1. - smoothstep(0.4, 0.9, px));
        snowCol *= 1. + 0.22 * sunRim;
        // fine branching cracks with a faint glow of scattered light beside each, hairlines under the eye, bubble columns, frost.
        // The distance fields and their screen footprints are taken here, outside every branch
        vec2 cA = crk(p / 5.5, 1.3), cB = vec2(9., 0.);
        if (uFineK > 0.5) cB = crk(p / 1.5 + 7.7, 5.1);                                   // (the fine field and the bubbles are left out on phones: a uniform, never a define)
        float dA = cA.x * 5.5, dB = cB.x * 1.5;
        float wA = clamp(fwidth(dA), 0.003, 0.7), wB = clamp(fwidth(dB), 0.003, 0.7);
        float avn = mix(0.5, 1., max(smoothstep(8., 24., abs(p.y + 44.)), smoothstep(-60., -40., p.x)));     // fewer strokes over the lime avenue
        float lodA = 1. - smoothstep(22., 65., dist), lodB = 1. - smoothstep(7., 22., dist);
        // (the larger cracks are held back within 16 m of the eye, where a two-metre run would cross a third of the frame as a drawn line)
        float strokes = hair(dA, wA, 0.02) * cA.y * lodA * 0.7 * mix(0.1, 1., smoothstep(5., 16., dist)) + hair(dB, wB, 0.009) * (0.3 + 0.25 * cB.y) * lodB;
        strokes += exp(-dA * 7.) * 0.1 * cA.y * (1. - smoothstep(8., 30., dist));
        strokes *= avn * mix(0.45, 1., smoothstep(2.5, 9., dist));                           // never a hard stroke under the eye (it would strobe)
        strokes += 0.17 * scratchAt(p, slS, fwS) * (1. - smoothstep(6., 16., dist)) * mix(0.6, 1., smoothstep(2.5, 7., dist));      // fine runner scratches along our own track only (they run with us: no strobe)
        float near = mix(0.4, 1., smoothstep(3., 10., dist));
        float bub = 0.; float bubK = 1. - smoothstep(0.05, 0.22, px);
        if (bubK > 0.01 && uFineK > 0.5) {
          for (int k = 0; k < 5; k++) { float fk = float(k); vec2 q = (p + par * (0.1 + 0.19 * fk)) * 2.3; vec2 ci = floor(q);
            vec2 o = h22(ci) * 0.45 + h22(ci + fk * 5.3 + 1.7) * 0.55;                       // each layer of a stack sits a little aside: clouds, not ranks
            float rr = h21(ci + 7.3 + fk); float cl = vn(ci * 0.11); float rad = (0.018 + 0.025 * rr * rr) * 2.3;
            bub += (1. - smoothstep(rad * 0.5, rad, length(fract(q) - 0.1 - 0.8 * o))) * smoothstep(0.6, 0.75, cl) * step(0.72, h21(ci + 3.1 + fk * 5.)) * (0.62 - 0.09 * fk); }
          bub *= bubK;
        }
        float frost = (smoothstep(0.56, 0.84, fb(p * 0.19 + 11.)) * 0.26 * laneOut + smoothstep(0.62, 0.9, fb(p * 1.3)) * 0.1) * min(uFrostK, 1.5);
        float hoar = max(uFrostK - 1., 0.) * 0.667;
        // frost flowers (hoar morning): ragged tufts of two sizes gathered in fields with clear black lanes between; a veil where they are smaller than a pixel
        float lodF = 1. - smoothstep(0.08, 0.4, px);
        // (they grow in CLUSTERS, from a thumb to two hands across, with bare black ice between the clusters and between the flowers)
        float clus = smoothstep(0.5, 0.7, fb(p * 0.6 + 2.)) * smoothstep(0.4, 0.62, vn(p * 0.21 + 6.3));
        float flw = max(max(frostFl(p * 1.15, 11.3), 0.85 * frostFl(p * 2.6 + 5., 4.7)), 0.7 * tuft(p * 1.6, 11.3)) * clus;
        frost += (flw * 0.7 * lodF + mix(0.24, 0.52, laneOut) * (1. - lodF) * (0.35 + 0.65 * clus) + 0.04 * fb(p * 0.45 + 8.))
          * smoothstep(mix(0.52, 0.36, laneOut), mix(0.66, 0.52, laneOut), fb(p * 0.05 + 5.)) * hoar * mix(0.55, 1., laneOut);
        // frosted bands lying across the mirror down the wind (thickest round the cathedral and the tower): matt rime combed into threads
        frost += satinAt(p) * (1. - 0.8 * smoothstep(0.5, 2.2, fa)) * (1. - 0.85 * smoothstep(35., 100., dist)) * (0.36 + 0.18 * vn(vec2(ws.x * 0.4, ws.y * 7.))) * mix(0.5, 1., smoothstep(4., 14., dist));   // (gone where a band is finer than a pixel: the far ice is a calm mirror)
        frost += fc.y;                                                                       // frost feathering out round every foot
        float k = clamp(strokes + bub * 0.3 * near + frost, 0., 1.);
        vec3 white = (uSunCol * uSunK * 0.35 * (1. - sh * 0.7) + mix(uGnd, uSky, 0.6) * uHemiK) * 0.3183 * vec3(0.76, 0.84, 0.9);
        pre = mix(pre, white, k); A = mix(A, 1., k);
        // the racing crack: a hairline of short straight runs and kinks from under our runner to the tower's foot, forking twice with short forks;
        // drawn like the other cracks (true width a hand, fading where it is finer than a pixel and with distance), never a drawn band
        vec4 rcD = raceD(p); float wC = clamp(fwidth(rcD.x), 0.003, 0.7);
        float rfD = raceFd(rcD); float wRf = clamp(fwidth(rfD), 0.003, 0.7);                 // (its side cracks: the field and its width taken outside the branch)
        pre *= 1. - 0.42 * fc.z; A = mix(A, 1., 0.3 * fc.z);                                 // the dark tide ring of scoured ice round every foot
        if (uCrack > 0.001) {
          vec3 rk = raceP(rcD, wC, dist, p, rfD, wRf); float ck = clamp(rk.y + rk.z, 0., 1.);
          vec3 crackCol = vec3(0.9, 0.97, 1.0) * 0.9 * (uSunCol * uSunK * 0.35 + mix(uGnd, uSky, 0.6) * uHemiK) * (0.3183 * mix(1.4, 2.0, clamp((uCrackF - 0.35) / 0.65, 0., 1.)));   // lit like the lattice: no blaze at dusk (fresh, a bright hairline; at 2.6 strangers read it as a drawn white stripe)
          pre = mix(pre, crackCol, ck); A = mix(A, 1., ck);
          pre = mix(pre, vec3(0.003, 0.009, 0.022), rk.x); A = mix(A, 1., rk.x);              // its core: black water a finger wide between the white lips
        }
        // shadows: indigo on the clear ice with diamond dust flaring along their edges, cobalt on the snow
        float clr = 1. - sn;
        pre = mix(pre, pre * vec3(0.3, 0.38, 0.7) + vec3(0.004, 0.008, 0.03), 0.7 * leeSh * clr); A = mix(A, 1., 0.5 * leeSh * clr);
        float shc = mix(sh2.x, sh, 0.3);                                                // (our own sail's shadow shows mainly on the snow)
        pre = mix(pre, pre * vec3(0.25, 0.3, 0.6) + vec3(0.003, 0.006, 0.026), shc * 0.75 * clr); A = mix(A, 1., shc * 0.55 * clr);
        float edge = smoothstep(0.06, 0.4, sh2.x) * (1. - smoothstep(0.6, 0.94, sh2.x));
        vec2 eq = p * 13.; float eh = h21(floor(eq) + floor(uTime * 9.) * 0.23);
        float esp = step(0.985, eh) * (1. - smoothstep(0.12, 0.35, length(fract(eq) - 0.25 - 0.5 * h22(floor(eq) + 1.9)))) * edge * (1. - smoothstep(10., 90., dist));
        pre += uSunCol * esp * 1.7 * min(uSunK * 0.3, 1.); A = max(A, esp);
        // wind-packed snow tongues with sparkle
        float spk = step(0.992, h21(floor(p * 9.) + floor(V.xz * 40.))) * (1. - smoothstep(0.2, 0.48, length(fract(p * 9.) - 0.5))) * (1. - sh) * (1. - smoothstep(8., 60., dist)) * min(uSunK * 0.3, 1.);
        pre = mix(pre, snowCol + uSunCol * spk * 3.5 + vec3(0.72, 0.86, 1.0) * pgl * 0.25, sn); A = mix(A, 1., sn);
        // snow snakes writhing north-east: thin white filaments lit like the snow, brightest when they pour out of the sun;
        // a second sheet a foot above the ice slides over the first as we move (the blizzard is knee-deep); our own track stays wind-swept
        float tw = uTime * uWind; float sk1 = clamp(uSnakeK - 1., 0., 1.2);
        float back = max(dot(-V, uSun), 0.); back *= back;
        float lane = smoothstep(8. * uLaneK, 45. * uLaneK, laneD(p));
        float thinK = (1. - lane) * mix(1., 0.12, clamp(uSnakeK - 1., 0., 1.));                 // (in a ground blizzard the streamers cross our own track)
        thinK *= 0.74 * mix(1., 0.5, 1. - smoothstep(50., 70., length(p)));                              // (and a few run down the lane between the cathedral and the tower in every weather)
        float snk = snakeAt(p, tw, sk1, fa, thinK);
        snk = max(snk, (0.2 + 0.3 * sk1) * snakeAt(p + V.xz / max(V.y, 0.06) * 0.35, tw + 7.3, sk1, fa, thinK));
        float snake = snk * mix(mix(0.4, 0.75, clamp(uSnakeK - 1., 0., 1.)), 1., lane) * (1. - sh * 0.8) * (1. - smoothstep(250., 900., dist))
          * mix(0.4, 1., max(smoothstep(8., 26., abs(p.y + 44.)), smoothstep(-60., -40., p.x)));          // (thin over the lime avenue: it must read to the gate)
        // (snow in the air is lit from every side, not like a flat floor: whiter than the drifts under it)
        // (seen against the low sun they are lit from behind and glow: on the last run a few pour toward us out of the sun)
        float bk = back * back; bk *= bk;
        vec3 snakeCol = 0.77 * (uSunCol * uSunK * (0.75 + 0.35 * back + 0.9 * bk) * (1. - sh * 0.9) + mix(uGnd, uSky, 0.8) * uHemiK) * 0.3183;
        float ska = clamp(snake * (0.5 + 0.15 * back + 0.9 * bk) * min(uSnakeK, 1.6) * (1. + 0.7 * clamp(uSnakeK - 1., 0., 1.) * (1. - lane)), 0., 0.8) * mix(mix(0.4, 0.7, clamp(uSnakeK - 1., 0., 1.)), 1., smoothstep(8., 30., dist));   // (thin under the eye: the town shows through)
        ska = clamp(ska + 0.8 * gauzeAt(p, tw) * smoothstep(10., 40., dist) * (1. - sh * 0.5), 0., mix(0.5, 0.85, smoothstep(25., 90., dist)));     // (the ground blizzard's veil, off our track, thin near the eye)
        pre = mix(pre, snakeCol, ska); A = mix(A, 1., ska);
        // and wherever we look into the low sun a few more pour toward us out of it over the open ice, lit from behind: thin and few, burning white
        if (bk > 0.03) { float sunSn = snakeAt(p + 37., tw * 1.2 + 3.1, 0.5, fa, 0.) * bk * (1. - sh * 0.8) * smoothstep(8., 30., dist) * (1. - smoothstep(250., 700., dist));
          float sska = clamp(sunSn * 1.5, 0., 0.7);
          pre = mix(pre, 0.77 * (uSunCol * uSunK * 1.9 + mix(uGnd, uSky, 0.8) * uHemiK) * 0.3183, sska); A = mix(A, 1., sska); }
        float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
        pre = mix(pre, uFogCol, f); A = mix(A, 1., f);
        float mh = mistAt(p, 0., dist, uTime) * (1. - 0.75 * saz2 * saz2);                  // low mist on the far ice (thin toward the low sun: its road of glints stays)
        pre = mix(pre, uMistCol, mh); A = mix(A, 1., mh);
        gl_FragColor = vec4(pre, A);
      }`,
  });
}

// ---------- halo, sundogs and pillar: one additive quad out along the sun ----------
function makeHalo(U) {
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol; uniform float uTime, uHaloK; varying vec3 vW;
      float sq(float x){ return x * x; }
      ${GLSL_COMMON}
      void main(){
        vec3 d = normalize(vW - cameraPosition + vec3(0., 1e-4, 0.));
        float c = clamp(dot(d, uSun), -1., 1.); float ang = acos(c) * 57.2958;
        vec3 sr = normalize(vec3(-uSun.z, 0., uSun.x) + vec3(1e-5, 0., 0.));
        float az = dot(d, sr) * 57.2958 / max(length(d.xz), 0.05); float el = (d.y - uSun.y) * 57.2958;
        float br = 0.85 + 0.15 * sin(uTime * 0.7) + 0.2 * (vn(vec2(az * 0.35 + uTime * 0.25, el * 0.35)) - 0.5);
        float ring = exp(-sq((ang - 22.3) / 1.3)) * 0.085;
        vec3 col = mix(vec3(1.0, 0.55, 0.35), vec3(0.8, 0.9, 1.0), smoothstep(21.2, 23.2, ang)) * ring;
        float dog = exp(-sq((abs(az) - 23.) / 1.6)) * exp(-sq(el / 2.2));
        col += mix(vec3(1.0, 0.6, 0.3), vec3(0.9, 0.95, 1.0), smoothstep(22., 25.5, abs(az))) * dog * 0.6;
        col += vec3(1.0, 0.95, 0.85) * exp(-sq((abs(az) - 26.5) / 4.)) * exp(-sq(el / 1.2)) * 0.08 * step(23., abs(az));
        float pil = exp(-sq(az / 0.8)) * exp(-max(el, 0.) / 4.5) * exp(-sq(min(el, 0.) / 2.5));
        col += uSunCol * pil * 0.5;
        col *= br * uHaloK * smoothstep(-0.005, 0.03, d.y);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}

// a bare winter tree, silted pale: a trunk, limbs tilted 30 to 60 degrees from vertical, each with a fork (and a twig)
function bareTree(acc, r, x, y, z, trunkH, trunkW, nLimb, lenA, lenB, col, twig) {
  const fine = twig, tw0 = fine ? trunkW * 0.72 : trunkW;                                    // (the limes are a grey tracery: tapered boles and limbs, never square bars)
  if (fine) { acc.add(UNIT.cone8, M(x, y, z, tw0 * 0.62, trunkH * 2.4, tw0 * 0.62, r() * 3), col, MAT.PLAIN); } else acc.add(UNIT.box, M(x, y, z, trunkW, trunkH, trunkW, r() * 3), col, MAT.PLAIN);
  for (let k = 0; k < nLimb; k++) {
    const yaw = (k + r() * 0.8) / nLimb * 6.283, tilt = (30 + r() * 30) * D2R, len = lenA + r() * (lenB - lenA), y0 = y + trunkH * (0.6 + 0.4 * r());
    const dx = Math.sin(tilt) * Math.sin(yaw), dy = Math.cos(tilt), dz = Math.sin(tilt) * Math.cos(yaw), th = tw0 * 0.4, G = fine ? UNIT.cone8 : UNIT.box, gk = fine ? 0.6 : 1;
    acc.add(G, M(x, y0, z, th * gk, len * (fine ? 1.15 : 1), th * gk, yaw, tilt), col, MAT.PLAIN);
    const f1 = 0.45 + r() * 0.2;
    const y1 = yaw + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6), t1 = 0.65 + r() * 0.45;
    acc.add(G, M(x + dx * len * f1, y0 + dy * len * f1, z + dz * len * f1, th * 0.62 * gk, len * 0.5, th * 0.62 * gk, y1, t1), col, MAT.PLAIN);
    if (twig) { const y2 = yaw + (r() - 0.5) * 2.4, t2 = 0.9 + r() * 0.5;
      acc.add(G, M(x + dx * len * 0.8, y0 + dy * len * 0.8, z + dz * len * 0.8, th * 0.5 * gk, len * 0.36, th * 0.5 * gk, y2, t2), col, MAT.PLAIN);
      acc.add(G, M(x + dx * len * 0.55, y0 + dy * len * 0.55, z + dz * len * 0.55, th * 0.35 * gk, len * 0.3, th * 0.35 * gk, y1 + 2.3, t2 * 0.8), col, MAT.PLAIN); }   // (a second twig; no new draw)
  }
}
// one slope of the ridge tent, subdivided so the canvas can belly in the vertex shader: uv = (along the ridge, up the slope), pinned where either is 0 or 1
function tentSheet(sgn) {
  const NU = 8, NV = 5, pos = [], nor = [], uv = [], idx = [], nx = sgn * 0.827, ny = 0.562;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, v = j / NV;
    pos.push(sgn * 1.7 * (1 - v) + nx * 0.02, 2.5 * v + ny * 0.02, (u - 0.5) * 4.6); nor.push(nx, ny, 0); uv.push(u, v); }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
    if (sgn > 0) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
const AV_Y = -7.5;                                                       // the lime avenue lies on a rise of ground (true depth)
// ---------- the town under the ice and the things standing on it: one merged mesh ----------
async function buildTown(ctx, rng, acc, path, density, weed) {
  const tr = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:trees:' + ctx.seed));     // the orchard, the limes, the bridge weed and the boughs draw from this generator (the houses' weed has left it for streams of its own, so these are dealt anew once)
  const C = COL, TREE = [C.tree[0] * 0.85, C.tree[1] * 0.85, C.tree[2] * 0.85], LIME = [C.tree[0] * 1.05, C.tree[1] * 1.05, C.tree[2] * 1.0], tw = (a, b, y, sx, sy, sz, ry = 0) => M(gx(a, b), y, gz(a, b), sx, sy, sz, TH + ry);
  const lampS = ctx.vary && ctx.vary.rare ? 1 : 0.55, litPane = [0.9, 0.6, 0.3], darkPane = [0.02, 0.03, 0.04];
  const pale = [0.6, 0.62, 0.58], fence = [C.roof[0] * 0.75, C.roof[1] * 0.75, C.roof[2] * 0.75], lampC = [0.3, 0.22, 0.1], post = [0.03, 0.03, 0.035];
  acc.add(new THREE.CircleGeometry(600, 40).rotateX(-Math.PI / 2), M(-110, BED_Y, 250), C.bed, MAT.BED);
  let n = 0;
  for (let k = -8; k <= 8; k++) {
    for (const sgn of [-1, 1]) {
      const b = k * 50 + sgn * 14;
      for (let a = -140; a < 760; a += 16) {
        const r1 = rng(), r2 = rng(), r3 = rng();
        if (Math.abs(((a + 48) % 96 + 96) % 96 - 48) < 12) continue;
        const x = gx(a, b), z = gz(a, b);
        if (Math.hypot(x + 110, z - 250) > 440 || Math.hypot(x, z) < 36 || Math.abs(a - 423) < 24) continue;
        if (Math.hypot(x + 60, z - 200) < 44 || (x < -272 && Math.abs(z + 44) < 150) || (Math.abs(z + 44) < 22 && x < -40)) continue;
        let skip = r3 > 0.9 + 0.08 * density;
        for (const d of DOMES) if (Math.hypot(x - d[0], z - d[1]) < d[2] * 2 + 9) skip = true;
        for (const d of KEEPOUT) if (Math.hypot(x - d[0], z - d[1]) < d[2]) skip = true;
        for (const d of CITY_KEEP) if (Math.hypot(x - d[0], z - d[1]) < d[2]) skip = true;      // (nor under the massed city's nearer walls and churches)
        if (skip) continue;
        const turn = r1 < 0.3, w = 9.5, l = 12.5, hw = 4.2 + r2 * 1.2, tint = 0.75 + r2 * 0.5;
        const rc = [C.roof[0] * tint, C.roof[1] * tint, C.roof[2] * tint * 0.97];
        acc.add(UNIT.box, tw(a, b, BED_Y, w, hw, l), C.log, MAT.LOG);
        acc.add(UNIT.prism, tw(a, b, BED_Y + hw, turn ? l + 1 : w + 1.2, 3.2 + r1 * 1.2, turn ? w + 1 : l + 1, turn ? Math.PI / 2 : 0), rc, MAT.ROOF);
        if (r3 < 0.35) acc.add(UNIT.box, tw(a + 3, b + sgn * 8.5, BED_Y, 4, 2.6, 5), [C.roof[0] * 0.6, C.roof[1] * 0.6, C.roof[2] * 0.6], MAT.ROOF);
        if (path.nearestXZ(x, z).dist < 80) {      // near the path: a limewashed chimney, a porch on the street side, a plank fence to the next house
          acc.add(UNIT.box, tw(a + (r2 - 0.5) * 5, b, BED_Y + hw + 1.4, 1.0, 2.6 + r1, 1.0), pale, MAT.PLAIN);
          const pa = a - 2.5 + r2 * 5, pb = b - sgn * (w / 2 + 1.1);
          acc.add(UNIT.box, tw(pa, pb, BED_Y, 2.2, 2.9, 3.0), C.log, MAT.LOG);
          acc.add(UNIT.prism, tw(pa, pb, BED_Y + 2.9, 3.6, 1.3, 2.8, Math.PI / 2), rc, MAT.ROOF);
          acc.add(UNIT.box, tw(a + 8, b - sgn * (w / 2 - 0.3), BED_Y, 0.2, 2.0, 3.7), fence, MAT.ROOF);
          { // a dormer on the slope that faces the street (the end slope of a turned roof), its pane lit in one house of four; a second chimney on the big roofs
            const da = turn ? a - 3.2 : a + (r1 - 0.5) * 5, db = turn ? b : b - sgn * 2.6, dry = turn ? 0 : Math.PI / 2, lit = (r2 * 13.7) % 1 < 0.26;
            const fa = turn ? da - 1.56 : da, fb2 = turn ? db : db - sgn * 1.56;
            acc.add(UNIT.prism, tw(da, db, BED_Y + hw + 1.15, 2.3, 1.5, 3.1, dry), rc, MAT.ROOF);
            acc.add(UNIT.box, tw(fa, fb2, BED_Y + hw + 1.25, turn ? 1.25 : 0.1, 0.95, turn ? 0.1 : 1.25), pale, MAT.PLAIN);
            acc.add(UNIT.box, tw(turn ? fa - 0.04 : fa, turn ? fb2 : fb2 - sgn * 0.04, BED_Y + hw + 1.4, turn ? 0.8 : 0.1, 0.62, turn ? 0.1 : 0.8), lit ? litPane : darkPane, lit ? MAT.LAMP : MAT.PLAIN);
            if (r3 > 0.45) acc.add(UNIT.box, tw(a - (r2 - 0.5) * 5 + 1.5, b + sgn * 1.4, BED_Y + hw + 1.2, 0.8, 2.3 + r2, 0.8), pale, MAT.PLAIN);
          }
          if (path.nearestXZ(x, z).dist < 34) {    // beside the track: shutters on the end windows of the street wall and a yard gate, swinging slowly in the current
            const bw = b - sgn * (w / 2);
            for (const wa of [-4.17, 4.17]) for (const sd of [-1, 1]) { const ha = a + wa + sd * 0.85;
              if (Math.abs(ha - pa) > 1.75) acc.add(UNIT.box, tw(ha, bw - sgn * 0.5, BED_Y + hw * 0.375, 1.0, hw * 0.31, 0.1), pale, MAT.SWING, [gx(ha, bw), gz(ha, bw)]); }
            if (r3 < 0.5) acc.add(UNIT.box, tw(a + 6.45, bw - sgn * 1.1, BED_Y, 2.2, 1.7, 0.12), fence, MAT.SWING, [gx(a + 6.45, bw), gz(a + 6.45, bw)]);
          }
        }
        if (path.nearestXZ(x, z).dist < 64) {      // ribbon weed rooted a little down the slope that faces our track, so it streams across its own pale roof (each house's weed from a stream of its own, named by its plot)
          const wr = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:weed:' + a + ':' + b + ':' + ctx.seed)), ry = BED_Y + hw + 3.2 + r1 * 1.2 - 0.15, nw = 2 + Math.floor(wr() * 2);
          for (let q = 0; q < nw; q++) { const o = (wr() - 0.5) * 11;          // (two or three ribbons to a root)
            for (let c = 0; c < 2 + (wr() < 0.5 ? 1 : 0); c++) { const oc = o + (wr() - 0.5) * 0.9, wa = turn ? a - 2 : a + oc, wb = turn ? b + oc * 0.75 : b + (b > 0 ? -2 : 2);
              weed.push(gx(wa, wb), ry - (turn ? 1.2 : 1.4), gz(wa, wb), 1.3 + wr() * 1.3); } }
        }
        n++; await ctx.yield();
      }
    }
  }
  await ctx.yield();
  // market arcade: a U of white arches (cut in the shader) under one long hip roof, round a square of pale drowned grass
  for (const [a, b, len, ry] of [[341, -17.4, 62, 0], [341, 17.4, 62, 0], [374, 0, 41.8, Math.PI / 2]]) {      // (the wings stop short of the two gate churches)
    acc.add(UNIT.box, tw(a, b, BED_Y, 7, 5, len, ry), C.lime, MAT.ARC);
    acc.add(UNIT.prism, tw(a, b, BED_Y + 5, 9, 3, len + 1.5, ry), C.roof, MAT.ROOF);
  }
  // the three-arch bridge over the old channel, its crown 1.5 m down: deck, piers with cutwaters, parapets, spandrel walls (arches cut in the shader)
  acc.add(UNIT.box, tw(423, 0, -3.4, 8, 1.2, 50), C.stone, MAT.BRIDGE);
  for (const da of [-21, -7, 7, 21]) {
    acc.add(UNIT.box, tw(423 + da, 0, BED_Y - 4, 8, BED_Y * -1 - 3.4 + 4, 3.2), C.stone, MAT.BRIDGE);
    for (const sb of [-4.4, 4.4]) acc.add(UNIT.box, tw(423 + da, sb, BED_Y - 4, 3.3, 11.2, 3.3, Math.PI / 4), C.stone, MAT.BRIDGE);
  }
  for (const sb of [-4, 4]) { acc.add(UNIT.box, tw(423, sb, -2.3, 0.6, 1.0, 50), [C.stone[0] * 1.3, C.stone[1] * 1.3, C.stone[2] * 1.3], MAT.BRIDGE); acc.add(UNIT.box, tw(423, sb * 0.95, -10, 0.4, 6.6, 42), C.stone, MAT.BRIDGE); }
  await ctx.yield();
  // orchard beside the first street, limes down the avenue to the gate
  for (let i = 0; i < Math.round(80 * density); i++) {
    const a = 20 + (i % 20) * 11 + rng() * 2, b = (i < 40 ? 1 : -1) * (24 + Math.floor((i % 40) / 20) * 5) + rng();
    const h = 3 + rng() * 1.2;
    rng();                                                                                            // (the old crown's yaw: the draw is kept)
    if (KEEPOUT.some((d) => Math.hypot(gx(a, b) - d[0], gz(a, b) - d[1]) < d[2] * 0.55)) continue;      // (no apple tree inside a drowned church)
    bareTree(acc, tr, gx(a, b), BED_Y, gz(a, b), h, 0.5, 4, 2.0, 2.9, TREE, false);
    await ctx.yield();
  }
  await ctx.yield();
  acc.add(UNIT.box, M(-177, BED_Y, -44, 254, AV_Y - BED_Y, 40), C.bed, MAT.BED);                       // the rise of ground the avenue runs on
  // (the rise does not end in a ruled bank: all along its foot it slumps into the streets beside it in fans of silt, some heaped a little over
  // its edge, with lumps of rubble and fallen kerb stones lying out from them; drawn from a generator of their own)
  { const tal = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:talus:' + ctx.seed)), RH = AV_Y - BED_Y, siltC = [C.bed[0] * 1.3, C.bed[1] * 1.3, C.bed[2] * 1.22], rub = [0.3, 0.31, 0.28];
    const fan = (x, z, nx, nz) => { const along = 2.6 + tal() * 3.6, out = 2.2 + tal() * 3.4, hk = 0.6 + tal() * 0.55, o = 0.3 + tal() * 1.2;
      acc.add(UNIT.ball6, M(x + nx * o, BED_Y - 0.2, z + nz * o, nx ? out : along, RH * hk, nx ? along : out, (tal() - 0.5) * 0.5), tal() < 0.5 ? C.bed : siltC, MAT.BED);
      if (tal() < 0.7) { const q = out + o + tal() * 2.5, j = (tal() - 0.5) * 3;
        acc.add(UNIT.box, M(x + nx * q + j * Math.abs(nz), BED_Y - 0.1, z + nz * q + j * Math.abs(nx), 0.5 + tal() * 0.9, 0.3 + tal() * 0.5, 0.4 + tal() * 0.7, tal() * 3, (tal() - 0.5) * 0.6, (tal() - 0.5) * 0.6), rub, MAT.PLAIN); } };
    let n = 0; for (let x = -52; x > -304; x -= 3.2 + tal() * 2.4) { fan(x, -24, 0, 1); fan(x - 1.5, -64, 0, -1); if (++n % 16 === 0) await ctx.yield(); }
    for (let z = -63; z < -24; z += 3 + tal() * 2) fan(-50, z, 1, 0);
  }
  await ctx.yield();
  for (let i = 0; i < 40; i++) {
    const x = -62 - Math.floor(i / 2) * 11.6, z = -44 + (i % 2 ? 9.5 : -9.5);
    rng();
    bareTree(acc, tr, x, AV_Y, z, 3.1, 0.56, 9, 2.6, 3.5, LIME, true);
    acc.add(UNIT.box, M(x, AV_Y, -44 + (i % 2 ? 6 : -6), 0.2 * lampS, 4.4, 0.2 * lampS), post, MAT.PLAIN);            // an avenue lamp inside each lime (slight by day, a lit globe on the rare visit)
    acc.add(UNIT.ball6, M(x, AV_Y + 4.5, -44 + (i % 2 ? 6 : -6), 0.3 * lampS, 0.42 * lampS, 0.3 * lampS), lampC, MAT.LAMP);
    await ctx.yield();
  }
  for (let i = 0; i < 44; i++) weed.push(gx(400 + i * 1.05 + tr() * 0.5, i % 2 ? 4 : -4), -1.35, gz(400 + i * 1.05, i % 2 ? 4 : -4), 1.1 + tr() * 1.2);   // weed along the bridge parapets
  for (let a = -44; a < 300; a += 32) for (const sb of [-7.6, 7.6]) {                                       // and lamps down the main street
    acc.add(UNIT.box, tw(a, sb, BED_Y, 0.2, 4.4, 0.2), post, MAT.PLAIN); acc.add(UNIT.ball6, tw(a, sb, BED_Y + 4.5, 0.3, 0.42, 0.3), lampC, MAT.LAMP);
  }
  // lamps on the cathedral square round the tower, one to each pool of light the bed's shader lays there (an 18 m grid)
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const x = i * 18, z = j * 18, r = Math.hypot(x, z);
    if (r < 14 || r > 37 || Math.hypot(x + 35.2, z - 13.9) < 18) continue;
    acc.add(UNIT.box, M(x, BED_Y, z, 0.2 * lampS, 4.4, 0.2 * lampS), post, MAT.PLAIN); acc.add(UNIT.ball6, M(x, BED_Y + 4.5, z, 0.3 * lampS, 0.42 * lampS, 0.3 * lampS), lampC, MAT.LAMP); }
  await ctx.yield();
  // pressure ridge of turquoise slabs 180 m east of the approach
  for (let i = 0; i < 130; i++) {
    const a = -60 + i * 5.2, b = 178 + Math.sin(i * 0.31) * 9 + rng() * 5;
    acc.add(UNIT.box, tw(a, b, -0.3, 2 + rng() * 4.5, 0.6 + rng() * rng() * 3.4, 0.3 + rng() * 0.5, rng() * 3, (rng() - 0.5) * 1.5, (rng() - 0.5)), C.slab, MAT.SLAB);
    if (i % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  // ice road 80 m west, marked with spruce boughs
  for (let i = 0; i < 34; i++) { const ba = -100 + i * 25, bb = ROAD_B + (i % 2 ? 4.5 : -4.5);          // (ONE RULE: no bough beside our track, wherever the road comes near it: the same 34 m inside which the houses carry their shutters)
    if (path.nearestXZ(gx(ba, bb), gz(ba, bb)).dist > 34) {                                            // a cut spruce top: three ragged tiers, leaning its own way, snow on the windward flank
      const yaw = tr() * 6.283, lean = (10 + tr() * 15) * D2R, k = 0.85 + tr() * 0.4, sl = Math.sin(lean), cl = Math.cos(lean), bx = gx(ba, bb), bz = gz(ba, bb);
      for (let t = 0; t < 3; t++) { const h = t * 0.7 * k, o = t === 1 ? 0.25 : 0;                       // (the middle tier sits a hand aside: a broken bough, not a cone)
        acc.add(UNIT.cone8, M(bx + Math.sin(yaw) * sl * h + Math.cos(yaw) * o, cl * h - 0.05, bz + Math.cos(yaw) * sl * h - Math.sin(yaw) * o, [0.9, 0.65, 0.4][t] * k, (t === 2 ? 1.5 : 1.1) * k, [0.9, 0.65, 0.4][t] * k, yaw, lean), [0.05, 0.12, 0.08], MAT.SPRUCE); }
      for (const sg of [-1, 1]) acc.add(UNIT.box, M(bx + Math.sin(yaw) * sl * 0.6, 0.5 * k, bz + Math.cos(yaw) * sl * 0.6, 0.06, 0.9 * k, 0.06, yaw + sg * 1.35, 50 * D2R), [0.035, 0.08, 0.055], MAT.PLAIN);   // two thin side twigs
    } }
  await ctx.yield();
  // fisher's tent (its canvas glows from inside at dawn, dusk and night), stove pipe, sledge, fisher on his box, holes
  const canvas = [0.42, 0.38, 0.29];
  acc.add(UNIT.prism, M(-198, 0, 526, 3.4, 2.5, 4.6, TH + 0.3), canvas, MAT.GLOW);
  for (const sg of [-1, 1]) acc.add(tentSheet(sg), M(-198, 0, 526, 1, 1, 1, TH + 0.3), canvas, MAT.GLOW);     // the two slopes again as loose canvas that bellies and drums
  acc.add(UNIT.cyl, M(-198.6, 1.2, 527, 0.09, 1.9, 0.09), [0.04, 0.04, 0.04], MAT.PLAIN);
  acc.add(UNIT.box, M(-202.5, 0.15, 528.5, 0.7, 0.25, 2.1, 0.8), C.log, MAT.PLAIN);
  acc.add(UNIT.box, M(-201.2, 0, 522.6, 0.5, 0.45, 0.5, 0.4), C.log, MAT.PLAIN);
  acc.add(UNIT.box, M(-201.2, 0.45, 522.6, 0.62, 0.8, 0.5, 0.4, 0.15), [0.45, 0.36, 0.24], MAT.PLAIN);
  acc.add(UNIT.ball, M(-201.25, 1.42, 522.5, 0.17, 0.19, 0.17), [0.1, 0.07, 0.05], MAT.PLAIN);
  // six fishing holes, each in a ring of frozen slush with lumps of chopped ice round it and a spruce twig stuck in beside it to mark it
  const holes = [], slush = [0.5, 0.56, 0.62], twigC = [0.05, 0.12, 0.08];
  for (let i = 0; i < 6; i++) { const hx = -203 + (i % 3) * 2.2 + rng(), hz = 519 + Math.floor(i / 3) * 2.6 + rng(); holes.push([hx, hz]);
    acc.add(UNIT.cyl16, M(hx, 0.0, hz, 0.42, 0.03, 0.42), [0.005, 0.012, 0.02], MAT.PLAIN); }
  // (everything from here on draws from a generator of its own, so every draw above keeps its place)
  const sm = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:small:' + ctx.seed));
  for (const [hx, hz] of holes) {
    acc.add(UNIT.cyl16, M(hx, 0.0, hz, 0.8 + sm() * 0.12, 0.02, 0.74 + sm() * 0.12, sm() * 3), slush, MAT.SNOW);
    for (let q = 0; q < 6; q++) { const a = (q + sm()) / 6 * 6.283, rr = 0.56 + sm() * 0.2; acc.add(UNIT.ball6, M(hx + Math.cos(a) * rr, 0.02, hz + Math.sin(a) * rr, 0.1 + sm() * 0.09, 0.06 + sm() * 0.06, 0.09 + sm() * 0.08, sm() * 3), C.snow, MAT.SNOW); }
    const ta = sm() * 6.283; acc.add(UNIT.cone8, M(hx + Math.cos(ta) * 0.95, -0.05, hz + Math.sin(ta) * 0.95, 0.17, 0.75 + sm() * 0.3, 0.17, sm() * 6, (8 + sm() * 14) * D2R), twigC, MAT.SPRUCE);
  }
  await ctx.yield();
  // the sledge: two iron-shod runners under it, the ice auger laid across it (shaft, three turns of blade, a red crank), two pike laid out on the ice
  { const S = (px, py, pz, sx, sy, sz, ry = 0, rx = 0, rz = 0) => M(-202.5, 0, 528.5, 1, 1, 1, 0.8).multiply(M(px, py, pz, sx, sy, sz, ry, rx, rz));
    const steel = [0.2, 0.22, 0.25], red = [0.38, 0.07, 0.04];
    for (const sx of [-0.3, 0.3]) { acc.add(UNIT.box, S(sx, 0, 0, 0.05, 0.16, 2.5), [0.07, 0.07, 0.08], MAT.PLAIN); acc.add(UNIT.box, S(sx, 0.1, 1.2, 0.05, 0.3, 0.05, 0, 0.6), [0.07, 0.07, 0.08], MAT.PLAIN); }
    acc.add(UNIT.cyl, S(-0.5, 0.45, -0.5, 0.025, 1.5, 0.025, 0.5, Math.PI / 2), steel, MAT.PLAIN);
    for (let q = 0; q < 3; q++) acc.add(UNIT.cyl16, S(-0.5 + Math.sin(0.5) * (0.95 + q * 0.2), 0.45, -0.5 + Math.cos(0.5) * (0.95 + q * 0.2), 0.11, 0.012, 0.11, 0.5, Math.PI / 2 - 0.45), steel, MAT.PLAIN);
    acc.add(UNIT.cyl, S(-0.5 + Math.sin(0.5) * 0.12, 0.45, -0.5 + Math.cos(0.5) * 0.12, 0.03, 0.26, 0.03, 0.5, 0, 0.2), red, MAT.PLAIN);
    acc.add(UNIT.cyl, S(-0.5 + Math.sin(0.5) * 0.12, 0.7, -0.5 + Math.cos(0.5) * 0.12, 0.03, 0.2, 0.03, 0.5, Math.PI / 2), red, MAT.PLAIN);
    const pkc = [0.2, 0.26, 0.11], pkb = [0.6, 0.6, 0.44];
    for (const [px, pz, yw] of [[1.0, 0.3, 0.3], [1.35, -0.25, 0.75]]) { const P = (qx, qy, qz, sx, sy, sz) => S(px, 0.075, pz, 0.36, 0.36, 0.36, yw, 0, 1.25).multiply(M(qx, qy, qz, sx, sy, sz));
      acc.add(UNIT.ball6, P(0, 0, 0, 0.21, 0.25, 1.65), pkc, MAT.PLAIN); acc.add(UNIT.ball6, P(0, -0.09, 0.05, 0.18, 0.2, 1.5), pkb, MAT.PLAIN);
      acc.add(UNIT.ball6, P(0, -0.02, -1.45, 0.14, 0.13, 0.55), pkc, MAT.PLAIN); acc.add(UNIT.oct, P(0, 0, 1.75, 0.03, 0.4, 0.4), pkc, MAT.PLAIN); } }
  await ctx.yield();
  // UNDER THE ICE, beside the main street we run over: wells with sweeps at the street corners and on the squares, leaning telegraph poles,
  // the stump of the fire-watch tower on the market square (all silted pale, enlarged like the houses, their tops well under the ice)
  const timber = [0.3, 0.3, 0.26], silted = [0.46, 0.48, 0.43], dark = [0.1, 0.095, 0.08], oldw = [0.19, 0.18, 0.15];
  // (the wells and poles are of dark waterlogged timber with real thickness; each leans and hangs its own way, drawn from a generator of their own)
  const wr = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:wells:' + ctx.seed));
  const well = (x, z, tx, tz) => { const yaw = Math.atan2(x - tx, z - tz), sy = Math.sin(yaw), cy = Math.cos(yaw), dip = 0.3 + wr() * 0.24, reach = 5.9 * Math.cos(dip), hx = x - sy * reach, hz = z - cy * reach;      // (the post; the head lies under the sweep's tip, toward tx, tz)
    const lx = (wr() - 0.5) * 0.2, lz = (wr() - 0.5) * 0.2, tipY = BED_Y + 5.4 + 5.9 * Math.sin(dip);
    acc.add(UNIT.box, M(hx, BED_Y, hz, 2.1, 1.3, 2.1, yaw + 0.3), oldw, MAT.PLAIN); acc.add(UNIT.box, M(hx, BED_Y + 1.3, hz, 1.5, 0.1, 1.5, yaw + 0.3), [0.02, 0.025, 0.03], MAT.PLAIN);      // the log head and its dark mouth
    for (const q of [0.45, 0.9]) acc.add(UNIT.box, M(hx, BED_Y + q, hz, 2.3, 0.1, 2.3, yaw + 0.3), dark, MAT.PLAIN);                                                                         // (the gaps between its logs)
    acc.add(UNIT.box, M(x, BED_Y, z, 0.55, 5.7, 0.55, yaw, lx, lz), dark, MAT.PLAIN);                                                  // the post, forked at the top
    for (const sg of [-1, 1]) acc.add(UNIT.box, M(x + cy * sg * 0.3, BED_Y + 5.3, z - sy * sg * 0.3, 0.22, 1.0, 0.36, yaw, lx, lz + sg * 0.12), dark, MAT.PLAIN);
    acc.add(UNIT.box, M(x, BED_Y + 5.4, z, 1, 1, 1, yaw, dip).multiply(M(0, -0.2, 1.05, 0.44, 0.44, 4.2)), dark, MAT.PLAIN);          // the sweep: a thick butt
    acc.add(UNIT.box, M(x, BED_Y + 5.4, z, 1, 1, 1, yaw, dip).multiply(M(0, -0.13, -3.45, 0.3, 0.3, 4.9)), oldw, MAT.PLAIN);          // and a lighter top
    acc.add(UNIT.box, M(x + sy * 2.9 * Math.cos(dip), BED_Y + 5.4 - 2.9 * Math.sin(dip) - 0.85, z + cy * 2.9 * Math.cos(dip), 0.85, 0.8, 0.95, yaw, dip), dark, MAT.PLAIN);   // its counterweight: a log lashed under the butt
    acc.add(UNIT.ball6, M(x + sy * 3.0 * Math.cos(dip), BED_Y + 5.4 - 3.0 * Math.sin(dip) - 1.2, z + cy * 3.0 * Math.cos(dip), 0.42, 0.34, 0.42), silted, MAT.PLAIN);        // and a stone
    acc.add(UNIT.box, M(hx, BED_Y + 2.4, hz, 0.14, tipY - BED_Y - 2.4, 0.14), oldw, MAT.PLAIN);                                       // the pole down to the bucket
    acc.add(UNIT.cyl16, M(hx, BED_Y + 1.75, hz, 0.36, 0.62, 0.36), dark, MAT.PLAIN);                                                  // the bucket hanging over the mouth: staves, two pale hoops
    for (const q of [0.12, 0.45]) acc.add(UNIT.cyl16, M(hx, BED_Y + 1.75 + q, hz, 0.385, 0.06, 0.385), silted, MAT.PLAIN); };
  for (const [a, b, a2, b2] of [[103, -11, 97, -11], [185, 11, 191, 11], [7, 11, 1, 11], [333, 8, 327, 10]]) well(gx(a, b), gz(a, b), gx(a2, b2), gz(a2, b2));
  well(16, 24, 12, 28);
  await ctx.yield();
  for (let a = -36, k = 0; a < 300; a += 48, k++) { const b = (k % 2 ? -1 : 1) * 7.1, x = gx(a, b), z = gz(a, b);
    if (KEEPOUT.some((d) => Math.hypot(x - d[0], z - d[1]) < d[2] * 0.55)) continue;
    const yaw = TH + (sm() - 0.5) * 0.5, lean = (5 + sm() * 7) * D2R * (sm() < 0.5 ? -1 : 1), lean2 = (wr() - 0.5) * 0.3 + lean * (wr() < 0.3 ? 1.3 : 0), fwd = (wr() - 0.5) * 0.36;
    const P = (px, py, pz, sx, sy, sz, rz = 0) => M(x, BED_Y, z, 1, 1, 1, yaw, fwd, lean + lean2).multiply(M(px, py, pz, sx, sy, sz, 0, 0, rz));
    acc.add(UNIT.box, P(0, 0, 0, 0.44, 8.5, 0.44), dark, MAT.PLAIN); acc.add(UNIT.box, P(0, 8.5, 0, 0.5, 0.12, 0.5), oldw, MAT.PLAIN);          // the pole and its weathered cap
    acc.add(UNIT.box, P(0, 7.3, 0.3, 2.7, 0.26, 0.24, (wr() - 0.5) * 0.14), oldw, MAT.PLAIN); acc.add(UNIT.box, P(0, 6.5, 0.3, 2.0, 0.26, 0.24, (wr() - 0.5) * 0.22), oldw, MAT.PLAIN);   // two crossarms, sagging
    for (const sg of [-1, 1]) acc.add(UNIT.box, P(sg * 0.15, 6.15, 0.3, 0.1, 1.5, 0.1, -sg * 0.75), dark, MAT.PLAIN);                              // their braces
    for (const [ix, iy] of [[-1.2, 7.56], [-0.5, 7.56], [0.5, 7.56], [1.2, 7.56], [-0.85, 6.76], [0.85, 6.76]]) acc.add(UNIT.ball6, P(ix, iy, 0.3, 0.1, 0.15, 0.1), [0.5, 0.62, 0.58], MAT.PLAIN);   // glass insulators
    if (wr() < 0.6) { const sg = wr() < 0.5 ? -1 : 1; acc.add(UNIT.box, P(sg * 1.25, 3.2, 0.3, 0.035, 4.4, 0.035, sg * 0.1), dark, MAT.PLAIN); }      // a snapped wire hanging from an arm's end
    acc.add(UNIT.box, P(1.9, 0, 0, 0.2, 5.6, 0.2, 0.33), dark, MAT.PLAIN); }                                                                  // a strut
  { const fx0 = gx(318, -6), fz0 = gz(318, -6);                                            // the fire-watch tower's stump: four posts leaning in, rails, braces, a floor, a fallen beam
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) acc.add(UNIT.box, M(fx0 + sx * 2.5, BED_Y, fz0 + sz * 2.5, 0.5, sx * sz > 0 ? 7.4 : 5.9, 0.5, 0, -0.12 * sz, 0.12 * sx), timber, MAT.PLAIN);
    for (const y of [2.4, 4.9]) { const h = 2.5 - 0.12 * y; for (const sg of [-1, 1]) { acc.add(UNIT.box, M(fx0 + sg * h, BED_Y + y, fz0, 0.22, 0.3, h * 2), timber, MAT.PLAIN); acc.add(UNIT.box, M(fx0, BED_Y + y, fz0 + sg * h, h * 2, 0.3, 0.22), timber, MAT.PLAIN); } }
    acc.add(UNIT.box, M(fx0, BED_Y + 5.2, fz0, 3.9, 0.22, 3.9), silted, MAT.PLAIN);
    for (const sg of [-1, 1]) { acc.add(UNIT.box, M(fx0 + sg * 2.35, BED_Y, fz0 - 2.3, 0.18, 6.4, 0.18, 0, 0.72), silted, MAT.PLAIN); acc.add(UNIT.box, M(fx0 - 2.3, BED_Y, fz0 + sg * 2.35, 0.18, 6.4, 0.18, 0, 0, -0.72), silted, MAT.PLAIN); }
    acc.add(UNIT.box, M(fx0 + 3.5, BED_Y + 0.1, fz0 + 1, 0.4, 0.4, 6.5, 0.9, 0.05), timber, MAT.PLAIN); }
  await ctx.yield();
  // ON THE ICE: dead reed stubble frozen in along the monastery wall, in ragged sheaves (their broken tops cut in the shader), rime on the windward side
  { const sheaf = UNIT.cone8.toNonIndexed().rotateX(Math.PI).translate(0, 1, 0), reed = [0.5, 0.39, 0.2];
    for (let zz = -160; zz < 74; zz += 2.6 + sm() * 3.2) {
      const gap = sm() < 0.22; if (gap || Math.abs(zz + 44) < 34) continue;
      const n = 2 + Math.floor(sm() * 3);
      for (let q = 0; q < n; q++) { const hgt = 0.7 + sm() * 0.8; acc.add(sheaf, M(-298.25 + sm() * 2.3, -0.1, zz + (sm() - 0.5) * 1.6, 0.22 + sm() * 0.2, hgt, 0.22 + sm() * 0.2, sm() * 6, (sm() - 0.5) * 0.3, (sm() - 0.5) * 0.3), [reed[0] * (0.8 + sm() * 0.4), reed[1] * (0.8 + sm() * 0.4), reed[2]], MAT.SPRUCE); }
    } }
  await ctx.yield();
  // THE SNOW COLLARS: a low bank of blown snow against the foot of every wall and drum that stands in the ice: lumpy, never a smooth saucer
  // (the ice shader lays the thin skirt round each and the part lays the wind-sculpted drift in each foot's lee; these are the banks themselves)
  // (the feet the town always had, and the tent, take their banks from the small stream as ever; the feet and the mounds added since take
  // theirs from a stream of their own)
  { const clear = (x, z) => path.nearestXZ(x, z).dist > 6, off = (x, z, r) => path.nearestXZ(x, z).dist - r > LANE, none = new Acc(64), nOld = FEET.length - 2 - TIPS.length, nm = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:foot-mounds:' + ctx.seed));
    for (const [fi, f] of [...FEET.slice(0, nOld), [-198, 526, 1.9, 0.3, TH + 0.3], ...FEET.slice(nOld)].entries()) { const [x, z, half, rad, yaw] = f, sz = half + rad, hgt = Math.min(0.95, 0.4 + 0.07 * sz), fr = fi <= nOld ? sm : nm;
      if (half < 0.01) { if (clear(x, z)) { (fi <= nOld || off(x + 0.28, z - 0.22, rad + 1.05) ? acc : none).add(UNIT.mound, M(x + 0.28, -0.02, z - 0.22, rad + 1.05, hgt * 1.3, rad + 1.05, fr() * 6), C.snow, MAT.SNOW);      // (a foot added since lays no piece of its bank on the yachts' lane; the draws are kept)
        for (let q = 0; q < 3; q++) { const a = nm() * 6.283, rr = rad + 0.45 + nm() * 0.6, lx = x + Math.cos(a) * rr, lz = z + Math.sin(a) * rr, ls = 0.7 + nm() * 0.9; (fi <= nOld || off(lx, lz, ls) ? acc : none).add(UNIT.mound, M(lx, -0.02, lz, ls, hgt * (0.45 + nm() * 0.5), 0.6 + nm() * 0.8, nm() * 6), C.snow, MAT.SNOW); } } }
      else for (let q = 0; q < 4; q++) { const T = M(x, 0, z, 1, 1, 1, yaw + q * Math.PI / 2).multiply(M(half + 0.25, -0.03, (fr() - 0.5) * half * 0.3, 1.1 + fr() * 0.5, hgt * (0.8 + fr() * 0.4), half + 0.7));
        acc.add(UNIT.ball6, T, C.snow, MAT.SNOW); }
    }
    driftTail(acc, -198, 526, 2.3, 1); }                                                    // (the tent's own drift, down the wind)
  await ctx.yield();
  // A SECOND FISHERS' PITCH ON THE ICE OVER THE MARKET SQUARE, a dozen metres to starboard of our track: a hand sledge with the catch box, a canvas
  // windbreak on two poles, an ice auger standing in its last hole, four holes in slush rings (they steam like the others), a fisher on his box
  // with a short rod, two pike laid out and hooded crows come for the offal. Its place is the square's own (street line a 338, b 11).
  { const cr = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:pitch:' + ctx.seed)), cx = gx(338, 11), cz = gz(338, 11), cyaw = TH + 0.6;
    const S = (px, py, pz, sx, sy, sz, ry = 0, rx = 0, rz = 0) => M(cx, 0, cz, 1, 1, 1, cyaw).multiply(M(px, py, pz, sx, sy, sz, ry, rx, rz));
    const at = (px, pz) => { const c = Math.cos(cyaw), sn = Math.sin(cyaw); return [cx + px * c + pz * sn, cz - px * sn + pz * c]; };
    const iron = [0.07, 0.07, 0.08], steel = [0.2, 0.22, 0.25], red = [0.38, 0.07, 0.04], canvas2 = [0.4, 0.36, 0.27], coat = [0.16, 0.13, 0.1], fur = [0.1, 0.07, 0.05];
    // the sledge: two runners, a slatted bed, the catch box with its lid off and silver fish in it, a coil of line
    for (const sx of [-0.32, 0.32]) { acc.add(UNIT.box, S(sx, 0, 0, 0.05, 0.16, 2.3), iron, MAT.PLAIN); acc.add(UNIT.box, S(sx, 0.1, -1.1, 0.05, 0.3, 0.05, 0, -0.6), iron, MAT.PLAIN); }
    for (let q = 0; q < 5; q++) acc.add(UNIT.box, S(0, 0.16, -0.9 + q * 0.45, 0.8, 0.04, 0.3), C.log, MAT.PLAIN);
    acc.add(UNIT.box, S(0, 0.2, 0.35, 0.66, 0.36, 0.9), [0.33, 0.25, 0.15], MAT.PLAIN); acc.add(UNIT.box, S(0, 0.5, 0.35, 0.56, 0.05, 0.8), [0.36, 0.42, 0.46], MAT.PLAIN);
    for (let q = 0; q < 4; q++) acc.add(UNIT.ball6, S((cr() - 0.5) * 0.3, 0.55, 0.1 + q * 0.17, 0.07, 0.05, 0.2, cr() * 3), [0.55, 0.6, 0.62], MAT.PLAIN);
    acc.add(UNIT.cyl16, S(0, 0.2, -0.55, 0.2, 0.09, 0.2), [0.5, 0.45, 0.33], MAT.PLAIN);
    // the windbreak: two poles, a sheet of canvas between them leaning from the wind, a snow bank at its foot
    for (const sx of [-1.3, 1.3]) acc.add(UNIT.cyl, S(2.6 + sx * 0.0, 0, -1.0 + sx, 0.04, 1.75, 0.04, 0, 0, 0.12), C.log, MAT.PLAIN);
    acc.add(UNIT.box, S(2.52, 0.2, -1.0, 0.03, 1.4, 2.6, 0, 0, 0.12), canvas2, MAT.PLAIN);
    acc.add(UNIT.mound, S(2.9, -0.02, -1.0, 0.7, 0.3, 1.9), C.snow, MAT.SNOW);
    // the fisher on his box, back to the wind, a short rod over the hole in front of him
    acc.add(UNIT.box, S(1.3, 0, -0.9, 0.5, 0.42, 0.42), C.log, MAT.PLAIN);
    acc.add(UNIT.box, S(1.3, 0.42, -0.9, 0.58, 0.78, 0.46, 0, 0, 0.14), coat, MAT.PLAIN);
    acc.add(UNIT.ball, S(1.2, 1.36, -0.9, 0.17, 0.19, 0.17), fur, MAT.PLAIN);
    acc.add(UNIT.box, S(1.0, 0.1, -0.78, 0.5, 0.2, 0.16), coat, MAT.PLAIN); acc.add(UNIT.box, S(1.0, 0.1, -1.02, 0.5, 0.2, 0.16), coat, MAT.PLAIN);        // his felt boots
    acc.add(UNIT.box, S(1.05, 0.95, -0.72, 0.5, 0.12, 0.12, 0, 0, -0.5), coat, MAT.PLAIN);                                                               // an arm
    acc.add(UNIT.cyl, S(0.78, 0.82, -0.72, 0.012, 0.75, 0.012, 0, 0, 1.25), fur, MAT.PLAIN);                                                             // the rod
    // four holes: dark water, frozen slush, chopped ice, a twig marker each; the auger standing in the last
    const hs = [[0.15, -0.75], [-0.2, -2.2], [1.6, -2.6], [3.2, -2.9]];
    for (const [px, pz] of hs) { const [hx, hz] = at(px, pz); holes.push([hx, hz]);
      acc.add(UNIT.cyl16, M(hx, 0.0, hz, 0.42, 0.03, 0.42), [0.005, 0.012, 0.02], MAT.PLAIN);
      acc.add(UNIT.cyl16, M(hx, 0.0, hz, 0.8 + cr() * 0.12, 0.02, 0.74 + cr() * 0.12, cr() * 3), [0.5, 0.56, 0.62], MAT.SNOW);
      for (let q = 0; q < 6; q++) { const a = (q + cr()) / 6 * 6.283, rr = 0.56 + cr() * 0.2; acc.add(UNIT.ball6, M(hx + Math.cos(a) * rr, 0.02, hz + Math.sin(a) * rr, 0.1 + cr() * 0.09, 0.06 + cr() * 0.06, 0.09 + cr() * 0.08, cr() * 3), C.snow, MAT.SNOW); }
      const ta = cr() * 6.283; acc.add(UNIT.cone8, M(hx + Math.cos(ta) * 0.95, -0.05, hz + Math.sin(ta) * 0.95, 0.17, 0.75 + cr() * 0.3, 0.17, cr() * 6, (8 + cr() * 14) * D2R), [0.05, 0.12, 0.08], MAT.SPRUCE); }
    acc.add(UNIT.cyl, S(3.2, 0, -2.9, 0.025, 1.45, 0.025, 0, 0.1, 0.06), steel, MAT.PLAIN);
    for (let q = 0; q < 3; q++) acc.add(UNIT.cyl16, S(3.2, 0.12 + q * 0.2, -2.9, 0.11, 0.012, 0.11, 0, 0.45), steel, MAT.PLAIN);
    acc.add(UNIT.cyl, S(3.2, 1.45, -2.9, 0.03, 0.2, 0.03, 0, 0, Math.PI / 2), red, MAT.PLAIN); acc.add(UNIT.cyl, S(3.0, 1.45, -2.9, 0.03, 0.24, 0.03), red, MAT.PLAIN);
    // two pike laid out on the ice, and the crows
    const pkc = [0.2, 0.26, 0.11], pkb = [0.6, 0.6, 0.44];
    for (const [px, pz, yw] of [[-1.3, -1.0, 0.3], [-1.55, -1.5, 0.9]]) { const P = (qx, qy, qz, sx, sy, sz) => S(px, 0.075, pz, 0.36, 0.36, 0.36, yw, 0, 1.25).multiply(M(qx, qy, qz, sx, sy, sz));
      acc.add(UNIT.ball6, P(0, 0, 0, 0.21, 0.25, 1.65), pkc, MAT.PLAIN); acc.add(UNIT.ball6, P(0, -0.09, 0.05, 0.18, 0.2, 1.5), pkb, MAT.PLAIN);
      acc.add(UNIT.ball6, P(0, -0.02, -1.45, 0.14, 0.13, 0.55), pkc, MAT.PLAIN); acc.add(UNIT.oct, P(0, 0, 1.75, 0.03, 0.4, 0.4), pkc, MAT.PLAIN); }
    for (const [px, pz] of [[-2.3, -0.6], [-2.0, -2.2], [-0.9, -2.6], [-3.1, -1.6], [0.4, 0.9]]) perch(acc, S(px + cr() * 0.4, 0, pz + cr() * 0.4, 1.2, 1.2, 1.2, cr() * 6.283), cr());
    acc.add(UNIT.mound, S(-0.2, -0.02, 1.4, 1.3, 0.22, 0.6, 0.4), C.snow, MAT.SNOW); }                                             // snow drifted against the sledge
  await ctx.yield();
  return { holes };
}
// a rival yacht: stern-steerer, bow toward -z; a bellied gaff sail, boom and gaff, hunched helmsman, three runners, a lantern on the mast
function yachtGeometry(sail) {
  const a = new Acc(), wood = [0.2, 0.14, 0.08], iron = [0.05, 0.05, 0.06], coat = [0.26, 0.21, 0.14];
  a.add(UNIT.box, M(0, 0.45, 0, 0.7, 0.3, 7.5), wood, MAT.PLAIN);
  a.add(UNIT.box, M(0, 0.4, -1.2, 5.6, 0.14, 0.45), wood, MAT.PLAIN);
  for (const sx of [-2.8, 2.8]) a.add(UNIT.box, M(sx, 0, -1.2, 0.07, 0.42, 1.6), iron, MAT.PLAIN);
  a.add(UNIT.box, M(0, 0, 3.4, 0.07, 0.46, 1.1), iron, MAT.PLAIN);
  a.add(UNIT.cyl, M(0, 0.6, -1.4, 0.08, 9.4, 0.08, 0, 0.075), wood, MAT.PLAIN);
  const EASE = 28 * D2R, se = Math.sin(EASE), ce = Math.cos(EASE);                             // on a reach: the sheet eased to leeward
  a.add(UNIT.cyl, M(0, 1.3, -1.3, 0.06, 5.3, 0.06, EASE, Math.PI / 2), wood, MAT.PLAIN);       // boom
  a.add(UNIT.cyl, M(0.5 * se, 8.4, -1.3 + 0.5 * ce, 0.05, 1.5, 0.05, EASE, 1.08), wood, MAT.PLAIN);   // gaff
  // the sail: five cloths seamed up and down, bellied, tapering to a short gaff: a sail by its outline even end-on and far off
  for (let k = 0; k < 5; k++) {
    const g = new THREE.PlaneGeometry(1, 1, 2, 5), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const u = (k + P.getX(i) + 0.5) / 5, v = P.getY(i) + 0.5, len = 5.1 * (1 - 0.8 * v) + 0.25;
      const sx = Math.sin(u * Math.PI) * 0.9 * (0.45 + 0.55 * Math.sin(v * Math.PI)) * (1 - 0.55 * v) + u * 0.25, sd = v * 0.55 + u * len;
      P.setXYZ(i, sx * ce + sd * se, 1.35 + v * 7.0 + u * v * 0.9, -1.3 + sd * ce - sx * se);
    }
    g.computeVertexNormals();
    const t = k % 2 ? 0.8 : 1; a.add(g, new THREE.Matrix4(), [sail[0] * t, sail[1] * t, sail[2] * t], MAT.PLAIN);
  }
  a.add(UNIT.box, M(0.25, 0.6, 2.2, 0.42, 0.26, 1.0), [0.07, 0.07, 0.09], MAT.PLAIN);          // helmsman: legs, hunched back, head
  a.add(UNIT.box, M(0.25, 0.62, 3.05, 0.52, 0.78, 0.5, 0, -0.45), coat, MAT.PLAIN);
  a.add(UNIT.ball6, M(0.25, 1.42, 2.72, 0.17, 0.18, 0.17), [0.1, 0.07, 0.05], MAT.PLAIN);
  a.add(UNIT.ball6, M(0.1, 2.0, -1.55, 0.13, 0.17, 0.13), [0.3, 0.22, 0.1], MAT.GLOW);
  return a.build();
}
// chips flying off a rival's runners: two sheets across the wake and one along it per runner, scrolling noise
function sprayGeometry() {
  const parts = [];
  for (const sx of [-2.8, 2.8]) {
    parts.push(new THREE.PlaneGeometry(1.7, 1.3).translate(sx, 0.62, 0.3), new THREE.PlaneGeometry(2.6, 1.9).translate(sx, 0.9, 2.4),
      new THREE.PlaneGeometry(8, 1.6).rotateY(Math.PI / 2).translate(sx, 0.76, 3.9));
  }
  const p = [], uv = [];
  for (const g of parts) { const ni = g.toNonIndexed(); p.push(...ni.attributes.position.array); uv.push(...ni.attributes.uv.array); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}

// ---------- ribbon weed streaming north-east in the slow current from roof ridges and the bridge parapet: one instanced mesh ----------
function makeWeed(U, list) {
  const n = Math.max(1, Math.floor(list.length / 4));
  const geo = new THREE.PlaneGeometry(0.32, 2.2, 1, 6).translate(0, 1.1, 0);
  const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform float uTime; varying vec3 vW; varying float vH; varying float vS;
      void main(){
        float h = position.y / 2.2;
        vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.); float sc = length(instanceMatrix[1].xyz);
        float ph = ip.x * 0.37 + ip.z * 0.23; float L = 2.2 * sc * h;
        float sway = sin(uTime * 1.3 - h * 3.4 + ph) * 0.34 * h + sin(uTime * 0.55 + ph * 1.7) * 0.3 * h;
        vec3 p = ip.xyz + vec3(0.788, 0., -0.616) * (L * (0.5 + 0.3 * h)) + vec3(0., L * (0.8 - 0.42 * h) + sin(uTime * 0.9 + ph - h * 2.6) * 0.14 * h, 0.)
          + vec3(0.616, 0., 0.788) * (sway * sc + position.x * (1. - 0.92 * h));
        p.y = min(p.y, -0.5) * 0.76;                      // (the same squash as everything else under the ice)
        vW = p; vH = h; vS = sway;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`uniform vec3 uSunCol, uDeep, uFogCol; uniform float uSunK, uHemiK, uFogDen; varying vec3 vW; varying float vH; varying float vS;
      void main(){
        vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
        vec3 alb = mix(vec3(0.03, 0.07, 0.03), vec3(0.34, 0.5, 0.2), vH) * (0.8 + 0.5 * vS);
        vec3 col = alb * (uSunCol * (uSunK * 0.3) + vec3(0.085, 0.13, 0.17) * (uHemiK * 0.5556)) * vec3(0.6, 0.82, 0.95);
        float pathLen = -vW.y * (1. + 0.15 / max(V.y, 0.2)) + dist * 0.004;
        col = mix(uDeep * 0.9, col, exp(-pathLen * 0.05));
        float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
        gl_FragColor = vec4(mix(col, uFogCol, f), 1.0);
      }` });
  const mesh = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const k = list[i * 4 + 3] || 1; m4.makeScale(1, k, 1).setPosition(list[i * 4] || 0, list[i * 4 + 1] || -3, list[i * 4 + 2] || 0); mesh.setMatrixAt(i, m4); }
  mesh.frustumCulled = false;
  return mesh;
}

// ---------- our yacht: two small parts low in the bottom corners, placed in camera space every frame ----------
// The windward end of the runner plank with its iron-shod runner and chip tail (bottom left) and the ash tiller with its lashing and a storm
// lantern (bottom right). Each stays under a tenth of the frame's height and shows only as we get under way (u 0.012-0.07);
// after that the frame is the town's.
function makeVehicle(U, rime) {
  const root = new THREE.Group();
  const wood = new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: /* glsl */`varying vec3 vP; varying vec3 vN; varying vec2 vUv; void main(){ vP = position; vUv = uv; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uSky, uGnd; uniform float uSunK, uHemiK, uRime; varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      ${GLSL_COMMON}
      void main(){ vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        float g = vn(vec2(vP.x * 3.5, vP.z * 55. + vP.y * 70.)), g2 = vn(vec2(vP.x * 9., vP.z * 150. + vP.y * 170.));
        vec3 alb = mix(vec3(0.3, 0.17, 0.08), vec3(0.66, 0.45, 0.24), g * 0.65 + g2 * 0.35);
        alb *= 0.55 + 0.45 * smoothstep(0.0, 0.04, abs(fract(vP.z * 6.6 + 0.5) - 0.5));      // plank seams
        float e = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.; float edge = smoothstep(0.88, 1.0, e);
        float l = max(dot(N, uSun), 0.);
        vec3 col = alb * (uSunCol * uSunK * (l + 0.14) + mix(uGnd, uSky, 0.5 + 0.5 * N.y) * uHemiK * 1.2) * 0.3183;
        col += vec3(0.95, 0.85, 0.66) * edge * (0.08 + 0.3 * max(N.y, 0.));
        float fe = smoothstep(0.62, 0.98, e + (vn(vec2(vP.x * 37. + vP.y * 53., vP.z * 41.)) - 0.5) * 0.7) * uRime;      // hoar feathers along every edge
        col = mix(col, vec3(0.77) * (uSunCol * uSunK * (l + 0.14) + mix(uGnd, uSky, 0.5 + 0.5 * N.y) * uHemiK * 1.2) * 0.3183, fe * 0.85);
        gl_FragColor = vec4(col, 1.0); }` });
  const iron = new THREE.MeshStandardMaterial({ color: '#9aa3ab', roughness: 0.5, metalness: 0.25 });
  const rope = new THREE.MeshStandardMaterial({ color: rime > 0.5 ? '#dcd9d0' : '#b7ab8e', roughness: 1 }), ash = new THREE.MeshStandardMaterial({ color: '#b89a6a', roughness: 0.7 });
  const BL = new THREE.Group(), BR = new THREE.Group(); root.add(BL, BR);
  // bottom-left: windward end of the runner plank with its iron-shod runner
  const plank = new THREE.Group(); BL.add(plank);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.055, 0.36), wood); pl.position.set(-0.25, 0.0, 0); pl.rotation.set(0.0, 0.55, -0.07); plank.add(pl); plank.position.y = 0.04;
  const chock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.32), wood); chock.position.set(0.0, -0.06, -0.16); plank.add(chock);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.6), iron); blade.position.set(0.0, -0.15, -0.3); plank.add(blade);
  // bottom-right: the ash tiller, a lashing whipping from it
  const tiller = new THREE.Group(); tiller.position.set(0.02, 0.03, 0); BR.add(tiller);
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.036, 0.8, 7).rotateZ(Math.PI / 2).translate(0.1, 0, 0), ash); tiller.add(tl);
  const lash = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.4, 4).translate(0, -0.2, 0), rope); lash.position.set(-0.26, 0, 0); tiller.add(lash);
  // a rooster-tail of ice chips off the runner's heel: streaks thrown up, out and back, in the plank's own space
  const NC = 150, cp = new Float32Array(NC * 18), cs = new Float32Array(NC * 18), cc = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
  for (let i = 0; i < NC; i++) { const r0 = (i * 0.6180339) % 1, r1 = (i * 0.7548777 + 0.31) % 1, r2 = (i * 0.5698403 + 0.67) % 1;
    for (let k = 0; k < 6; k++) { const o = i * 18 + k * 3; cp[o] = cc[k][0]; cp[o + 1] = cc[k][1]; cp[o + 2] = 0; cs[o] = r0; cs[o + 1] = r1; cs[o + 2] = r2; } }
  const chipGeo = new THREE.BufferGeometry(); chipGeo.setAttribute('position', new THREE.BufferAttribute(cp, 3)); chipGeo.setAttribute('aSeed', new THREE.BufferAttribute(cs, 3));
  const chips = new THREE.Mesh(chipGeo, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aSeed; uniform float uTime, uChip; varying float vA; varying vec2 vQ;
      void main(){ float life = 0.3 + 0.25 * aSeed.y; float t = fract(uTime / life + aSeed.x * 7.31 + aSeed.z); float tt = t * life;
        vec3 v = vec3(-0.3 + 0.8 * aSeed.x, 0.9 + 1.2 * aSeed.z, 0.8 + 2.4 * aSeed.y) * (0.6 + 0.4 * uChip);
        vec3 p0 = vec3((aSeed.z - 0.5) * 0.1, 0., (aSeed.y - 0.5) * 0.25) + v * tt + vec3(0., -4.9 * tt * tt, 0.);
        vec3 dv = v + vec3(0., -9.8 * tt, 0.); vec3 dir = dv / max(length(dv), 1e-3);
        vec3 perp = vec3(-dir.y, dir.x, 0.); perp /= max(length(perp), 1e-3);
        vec3 p = p0 + dir * position.x * (0.007 + 0.014 * aSeed.x) + perp * position.y * (0.003 + 0.003 * aSeed.z);
        vA = (1. - t) * smoothstep(0., 0.08, t) * uChip * step(0.25, aSeed.y + uChip); vQ = position.xy;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uSunCol, uSky; uniform float uSunK, uHemiK; varying float vA; varying vec2 vQ;
      void main(){ float a = vA * (1. - smoothstep(0.3, 1., abs(vQ.y))) * (1. - smoothstep(0.5, 1., abs(vQ.x)));
        gl_FragColor = vec4((uSunCol * min(uSunK, 3.) * 0.45 + uSky * uHemiK * 0.4) * a, 1.0); }` }));
  chips.position.set(-0.05, -0.08, -0.26); chips.renderOrder = 7; BL.add(chips);
  // a storm lantern slung by the tiller head (lit at dawn, dusk and night)
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 8), new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: /* glsl */`varying vec3 vN; varying float vY; void main(){ vN = mat3(modelMatrix) * normal; vY = position.y; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uSky; uniform float uSunK, uHemiK, uGlowK; varying vec3 vN; varying float vY;
      void main(){ vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); float glass = step(abs(vY), 0.032);
        vec3 alb = mix(vec3(0.25, 0.17, 0.07), vec3(0.5, 0.52, 0.5), glass);
        vec3 col = alb * (uSunCol * uSunK * max(dot(N, uSun), 0.) + uSky * uHemiK) * 0.3183 + vec3(1.0, 0.56, 0.2) * glass * uGlowK * 3.5;
        gl_FragColor = vec4(col, 1.0); }` }));
  lantern.position.set(-0.05, 0.0, 0.12); BR.add(lantern);
  root.traverse((o) => { o.frustumCulled = false; });
  return { root, BL, BR, plank, tiller, lash, chips };
}

// ---------- looks: the hour (ctx.vary.hour, else by mood; the rare visit is blue dusk) and the weather (by seed) ----------
const HOURS = {
  day: { el: 12, sun: '#FFF1D6', sunK: 3.4, zen: '#1D4E9E', mid: '#4E86C8', hor: '#C6DBEE', gnd: '#9FB6CC', amb: '#5E8FD8', gl: '#BFD3E8', hemiK: 1.8, shade: '#3E5FA8',
    scat: 0.18, scatCol: '#fff1d6', iceScat: 0.1, expo: 0.95, halo: 1, shK: 1, glow: 0, stars: 0, starIce: 0, deep: 1, whiteK: 1, title: '' },
  golden: { el: 4, sun: '#FFB27A', sunK: 2.9, zen: '#2a488c', mid: '#7388b6', hor: '#E6CDBD', gnd: '#b9aeb4', amb: '#7f8fd0', gl: '#d9c6c6', hemiK: 1.8, shade: '#6a5fa8',
    scat: 0.7, scatCol: '#ffb27a', iceScat: 0.55, expo: 0.95, halo: 1.5, shK: 1, glow: 0, stars: 0, starIce: 0, deep: 0.9, whiteK: 0.6, title: 'Last Light' },
  dawn: { el: -3, lel: 3, sun: '#ffb9a6', sunK: 0.8, zen: '#27386f', mid: '#7474ab', hor: '#efb3a4', gnd: '#8f86a8', amb: '#8a86c6', gl: '#b9a2bb', hemiK: 1.5, shade: '#5a4f98',
    scat: 0.95, scatCol: '#ff9470', iceScat: 0.9, expo: 1.1, halo: 0.55, shK: 0.3, glow: 1, stars: 0.12, starIce: 0.08, deep: 0.7, whiteK: 0.4, title: 'Before Sunrise' },
  dusk: { el: -2, lel: 3, sun: '#aab8ee', sunK: 0.6, zen: '#16264f', mid: '#3a4f8e', hor: '#6f7fb0', gnd: '#46558a', amb: '#4d66b4', gl: '#6a7db4', hemiK: 1.35, shade: '#2c3a80',
    scat: 0.6, scatCol: '#ff8a5c', iceScat: 0.5, expo: 1.15, halo: 0.4, shK: 0.25, glow: 1, stars: 0.22, starIce: 0.14, deep: 0.45, whiteK: 0.15, title: 'The Lights' },
  night: { el: 30, sun: '#cfe0ff', sunK: 1.2, zen: '#050b1e', mid: '#0c1a3c', hor: '#1d2e58', gnd: '#101b36', amb: '#2f4585', gl: '#2c3c66', hemiK: 1.1, shade: '#101a44',
    scat: 0, scatCol: '#cfe0ff', iceScat: 0.05, expo: 1.3, halo: 0.75, shK: 0.8, glow: 1, stars: 1, starIce: 1, deep: 0.4, whiteK: 0.12, title: 'Full Moon' },
};
const WEATHER = {
  clear: { cover: 0.6, snake: 0.55, wind: 1, frost: 0.8, mir: 1, cirrus: 0.13, fog: 0.00055, white: 0, halo: 1, drift: 1, dust: 1, dustI: 1, rime: 0, rimeW: 0.3, mist: 0, mistK: 0.42, lane: 1, title: '' },
  blizzard: { cover: 1.9, snake: 2.2, wind: 2, frost: 1, mir: 0.9, cirrus: 0.2, fog: 0.0014, white: 0.9, halo: 1.45, drift: 2.4, dust: 1.3, dustI: 1.2, rime: 0.3, rimeW: 0.3, mist: 0.26, mistK: 0.32, lane: 0.5, title: 'Ground Blizzard' },
  // (the hoar morning by day is a morning: the sun a little lower and warmer, a rose-cream horizon, so the furred white takes gold light and blue shade)
  hoar: { cover: 0.8, snake: 0.55, wind: 1, frost: 2.5, mir: 0.95, cirrus: 0.2, fog: 0.001, white: 0.15, halo: 1.3, drift: 0.8, dust: 2, dustI: 2, rime: 1, rimeW: 0.45, mist: 0.035, mistK: 0.42, lane: 0.6, title: 'Hoar Morning',
    day: { el: 10, sun: '#FFD6A2', hor: '#F4DEC6', mid: '#5C8CC8', zen: '#2051A0', scat: 0.26, scatCol: '#ffc890', iceScat: 0.22, shade: '#4a5aa6', horPow: 7 } },
};
const GILT = [[1, 0, 0, 1, 1, 1, 0, 0, 1], [0, 1, 0, 1, 0, 1, 0, 1, 0], [1, 1, 0, 1, 1, 0, 1, 1, 0]];

export default {
  id: 'drowned-domes',
  name: 'The Drowned Domes',
  category: 'city',
  weirdness: 0.15,
  media: ['snow', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, density = vary.density || 1, rare = !!vary.rare;
    const detail = (ctx.quality && ctx.quality.detail) || 1;
    const cover = 0.85 + rng() * 0.5, sailPick = rng(), sailPick2 = rng();
    // the looks come from their own generator, so the world's other draws keep their order
    const lk = ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:looks:' + ctx.seed)), wPick = lk(), gPick = lk();
    const mood = vary.mood === undefined ? 0.5 : vary.mood;
    const hourId = rare ? 'dusk' : (vary.hour === 'day' || vary.hour === 'golden' || vary.hour === 'dawn' || vary.hour === 'night') ? vary.hour : mood > 0.72 ? 'golden' : mood < 0.08 ? 'dawn' : 'day';
    const weatherId = rare ? 'clear' : wPick < 0.4 ? 'clear' : wPick < 0.7 ? 'blizzard' : 'hoar';
    const W = WEATHER[weatherId], H = Object.assign({}, HOURS[hourId], hourId === 'day' && W.day ? W.day : {}), night = hourId === 'night';
    const scene = new THREE.Scene();
    await ctx.yield();
    const path = makePath(PATH); setLane((x, z) => path.nearestXZ(x, z).dist - LANE);      // (the part keeps its ice slabs and dunelets off the yachts' lane by this measure)
    await ctx.yield();
    const lel = H.lel || H.el, az = 232 * D2R;
    const SUN = new THREE.Vector3(Math.sin(az) * Math.cos(lel * D2R), Math.sin(lel * D2R), -Math.cos(az) * Math.cos(lel * D2R));
    const fogC = new THREE.Color(H.hor).lerp(new THREE.Color('#f4f7fb'), W.white * H.whiteK), fogHex = '#' + fogC.getHexString();
    const cirrus = weatherId === 'clear' && H.glow ? 0 : W.cirrus;         // (a few cirrus hairs on a clear day; none at dawn, dusk or by night, when the sky is the stars')
    const skyOpts = { rng, preset: night ? 'night' : 'day', zenith: H.zen, mid: H.mid, horizon: fogHex, ground: H.gnd,
      horizonPow: H.horPow || (W.white > 0.5 ? 6 : 9), midPow: 1.4, sunElevation: night ? -40 : H.el, sunAzimuth: 232, sunColor: H.sun, sunSize: 0.7, sunIntensity: 13, sunGlow: 0.17, sunGlowTight: 0.9,
      scatter: H.scat * 0.6, scatterColor: H.scatCol, clouds: false, clouds2: cirrus ? Object.assign({ opacity: cirrus, coverage: 0.38 }, hourId === 'golden' ? { lit: '#ffd9b4', shade: '#9a8cb0' } : {}) : false, stars: H.stars,
      lightColor: H.sun, lightIntensity: H.sunK, ambientColor: H.amb, groundLight: H.gl, ambientIntensity: H.hemiK, lightElevationMin: 3 };
    if (night) Object.assign(skyOpts, { key: 0, milkyWay: 0, starDensity: 0.55,
      bodies: [{ elevation: 30, azimuth: 232, size: 1.5, color: '#f1f4ff', color2: '#aab4cf', texture: 0.5, phase: 1, intensity: 2.4, glow: 0.7, glowColor: '#9fb8ff', glowSize: 6 }] });
    await ctx.yield();
    const sky = makeSky(skyOpts);
    await ctx.yield();
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(fogHex, W.fog);
    await ctx.yield();
    const rig = makeLightRig(sky, { shadow: false, bounce: 0.5 }); scene.add(rig.object);
    await ctx.yield();

    const U = makeUniforms();
    U.uSun.value.copy(SUN); U.uSunCol.value.set(H.sun); U.uSunK.value = H.sunK; U.uFogCol.value.copy(fogC); U.uFogDen.value = W.fog;
    U.uCover.value = W.cover * (0.92 + 0.16 * (cover - 0.85) / 0.5) * (0.8 + 0.2 * density);
    U.uSky.value.set(H.amb); U.uGnd.value.set(H.gl); U.uHemiK.value = H.hemiK; U.uHor.value.copy(fogC); U.uZen.value.set(H.zen);
    U.uDeep.value.multiplyScalar(H.deep); U.uGlowK.value = H.glow; U.uRime.value = W.rime; U.uLaneK.value = W.lane; U.uRimeW.value = W.rimeW; U.uMirK.value = W.mir; U.uUnderK.value = hourId === 'golden' ? 1.6 : 1; U.uWinK.value = rare ? 0.15 : H.glow ? 0.7 : hourId === 'golden' ? 0.55 : 0.4;
    // only the shadows that fall where the ice resolves: the 18 whose streak (foot, middle or tip) comes nearest our track
    const shLen = Math.min(1 / Math.tan(lel * D2R), 9), shl = Math.hypot(SUN.x, SUN.z) || 1, shx = -SUN.x / shl, shz = -SUN.z / shl;
    const shNear = [...DOMES, ...SHADOWS].map((d) => { const Ls = d[2] * 1.5 * shLen; let best = 1e9;
      for (const k of [0, 0.5, 1]) best = Math.min(best, path.nearestXZ(d[0] + shx * Ls * k, d[1] + shz * Ls * k).dist); return [d[0], d[1], d[2], best]; }).sort((a, b) => a[3] - b[3]).slice(0, 18);
    await ctx.yield();
    Object.assign(U, {
      uMid: { value: new THREE.Color(H.mid) }, uShadeCol: { value: new THREE.Color(H.shade).multiplyScalar(0.8) },
      uCrack: { value: 0 }, uCrackF: { value: 1 }, uShLen: { value: shLen }, uDome: { value: shNear.map((d) => new THREE.Vector3(d[0], d[1], d[2])) },
      uSail: { value: new THREE.Vector4(0, 0, 0, 0) }, uCrackA: { value: new THREE.Vector2(-76, 224) }, uHaloK: { value: H.halo * W.halo },
      uShK: { value: H.shK }, uSnakeK: { value: W.snake }, uWind: { value: W.wind }, uFrostK: { value: W.frost }, uStarK: { value: H.starIce },
      uScat: { value: new THREE.Color(H.scatCol).multiplyScalar(H.iceScat) }, uChip: { value: 0 }, uFineK: { value: detail >= 1 ? 1 : 0 },
    });

    // the snow collars: the feet nearest our track (the part's list and the fisher's tent)
    { const feet = [...FEET, [-198, 526, 1.9, 0.3, TH + 0.3]].map((f) => [...f, path.nearestXZ(f[0], f[1]).dist]).sort((a, b) => a[5] - b[5]).slice(0, NFOOT);
      feet.forEach((f, i) => { const sz = f[2] + f[3]; U.uFootA.value[i].set(f[0], f[1], f[2], f[3]); U.uFootB.value[i].set(Math.cos(f[4]), Math.sin(f[4]), 1.9 * sz + 2, 0.8 * sz); }); }
    await ctx.yield();
    const hero = await buildHero(ctx, { uniforms: U, swing: rare ? 0.75 : 0.32, gilt: GILT[gPick < 0.5 ? 0 : gPick < 0.8 ? 1 : 2], flip: gPick >= 0.5 && gPick < 0.8 });
    scene.add(hero.object);
    await ctx.yield();

    // the town, the bed and everything standing on the ice
    const acc = new Acc(Math.round(212000 + 30000 * density));
    const weedAt = [];
    const townBits = await buildTown(ctx, rng.fork('town'), acc, path, density, weedAt);
    await ctx.yield();
    const town = new THREE.Mesh(await acc.buildAsync(ctx), hero.surfaceMaterial); town.frustumCulled = false; scene.add(town);
    await ctx.yield();

    const ice = new THREE.Mesh(new THREE.CircleGeometry(3300, 72).rotateX(-Math.PI / 2), makeIceMaterial(U)); ice.renderOrder = 2; ice.frustumCulled = false; scene.add(ice);
    const halo = makeHalo(U); scene.add(halo);
    await ctx.yield();
    const ridges = makeHorizonRidges({ rng: rng.fork('shore'), layers: 3, radius: [1650, 2400], height: [55, 130], base: -6, segments: 220, jagged: 0.3, coverage: 0.95,
      colorNear: '#1f302b', fog: scene.fog, snow: true, snowLine: 0.42, sunDir: SUN, sunColor: H.sun, rim: 0.15 });
    scene.add(ridges.object);
    await ctx.yield();

    // creatures
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('crows'), species: 'crows', count: Math.round((rare ? 48 : 28) * density), center: [0, 64, 0], radius: 17, height: 9, size: 1.4, speed: 7, wander: [4, 2, 4, 0.4] }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('burst'), species: 'crows', count: 12, size: 1.3, wander: [2, 1.2, 2, 0.4], maxSigma: 3, spread: [30, 5, 30], cross: { path, u: path.nearestXZ(DOMES[3][0], DOMES[3][1]).u - 0.02, lead: 46, height: 12, span: 230, side: -1, angle: 50, duration: 40 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('tent'), species: 'crows', count: 8, size: 1.2, center: [-190, 16, 510], radius: 12, height: 3, wander: [2, 1.2, 2, 0.4], maxSigma: 3, spread: [30, 4, 30] }));
    await ctx.yield();
    fauna.add(F.makeFishSchool({ rng: rng.fork('bream'), species: 'mackerel', count: Math.round(220 * density * detail), size: 2.1, top: '#4d7189', belly: '#8fb6cc',
      spread: [10, 1.2, 26],                                                                          // (a flat shoal: every fish stays well under the ice)
      cross: { path, u: path.nearestXZ(gx(160, 0), gz(160, 0)).u - 24 / path.length, lead: 24, height: -4.6, span: 150, side: 1, duration: 40 } }));      // (A RULE OF PLACE: they cross the main street by the orchard, 160 m down it, as the eye comes within 24 m of that place)
    await ctx.yield();
    const ring = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ring.push([-25 + Math.cos(a) * 15, -2.3 + Math.sin(a * 2) * 0.6, 125 + Math.sin(a) * 11]); }
    fauna.add(F.makeFishSchool({ rng: rng.fork('roach'), species: 'mackerel', count: Math.round(320 * density * detail), size: 1.1, top: '#3d5f78', belly: '#6f97b0', spread: [8, 1.0, 22], route: ring, closed: true, speed: 4 }));
    await ctx.yield();

    // air: diamond dust everywhere, drift smoking along the ice, tent smoke leaning and shredding
    const time = U.uTime, lightK = Math.max(0.4, Math.min(1, H.sunK / 3));
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(4600 * detail * W.dust), box: [64, 16, 64], size: [0.02, 0.05], colors: ['#ffffff', '#dcecff', H.sun],
      intensity: 1.5 * W.dustI * lightK, twinkle: 1, velocity: [4.5 * W.wind, -0.15, -3.5 * W.wind], time });
    scene.add(dust.object); await ctx.yield();
    const drift = fx.makeParticles({ rng: rng.fork('drift'), preset: 'snow', count: Math.round(3200 * detail * W.drift), box: [70, 2.2, 70], follow: 'xz', center: [0, 1.0, 0], size: [0.035, 0.08],
      velocity: [7.1 * W.wind, 0, -5.5 * W.wind], turbulence: [0.6, 0.25, 0.8], intensity: lightK, time });
    scene.add(drift.object); await ctx.yield();
    // (lit by the hour: at dusk and by night it is a dim plume, not a white cloud; it leans north-east with the wind and shreds)
    const smk = (hex) => new THREE.Color(hex).lerp(new THREE.Color(H.mid), H.glow * 0.5).multiplyScalar(H.glow ? lightK * 0.8 : 1);
    const smoke = fx.makeSmokeColumn({ rng: rng.fork('smoke'), time, position: [-198.6, 3.1, 527], height: 16, radius: [0.12, 1.4], size: [0.5, 2.6], count: 90,
      color: smk('#8b929c'), colorTop: smk('#cdd8e4'), shadowColor: smk('#55607a'), ambient: smk('#3a4660'), opacity: 0.35, wind: [0.788, 0, -0.616], bend: 6 * W.wind, sunDir: SUN,
      sunColor: new THREE.Color(H.sun).multiplyScalar(lightK) });
    scene.add(smoke.object); await ctx.yield();
    // (everything below draws from one late fork, so the draws above keep their order)
    const lk2 = rng.fork('looks2');
    // (and these from generators of their own) a flock lifting off the monastery wall east of the channel and climbing across toward our track as
    // we run down the first reach: its place is the wall by the monastery's church, the time the eye's coming abreast of it
    { const own = (tag) => ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:' + tag + ':' + ctx.seed));
      fauna.add(F.makeFlock({ rng: own('wallflock'), species: 'crows', count: Math.round(18 * density), size: 1.3, wander: [4, 2, 4, 0.4],
        cross: { path, u: path.nearestXZ(-6, 388).u - 50 / path.length, lead: 50, offset: 62, height: 13, rise: 20, span: 124, side: -1, angle: 90, duration: 40 } })); await ctx.yield();
      // a second, smaller shoal of bream crossing the market square under the eye
      fauna.add(F.makeFishSchool({ rng: own('bream2'), species: 'mackerel', count: Math.round(130 * density * detail), size: 2.0, top: '#3c5b72', belly: '#7499ae', spread: [8, 1.1, 20],
        cross: { path, u: path.nearestXZ(gx(318, -6), gz(318, -6)).u - 20 / path.length, lead: 20, height: -4.6, span: 130, side: -1, duration: 40 } })); await ctx.yield(); }
    const burst2 = fauna.add(F.makeFlock({ rng: lk2.fork('burst2'), species: 'crows', count: 7, size: 1.3, wander: [2, 1.2, 2, 0.4], maxSigma: 3, spread: [30, 5, 30], cross: { path, u: path.nearestXZ(DOMES[1][0], DOMES[1][1]).u - 0.02, lead: 40, height: 12, span: 190, side: 1, angle: 55, duration: 40 } }));
    await ctx.yield();
    // the ground blizzard and the hoar morning: loose snow smoking low over the ice
    // (many small low puffs, knee to waist deep, lit like the snakes; none within 15 m of the eye, so the town under the runner stays clear)
    const mistC = new THREE.Color(H.sun).multiplyScalar(H.sunK * 0.75).add(new THREE.Color(H.gl).lerp(new THREE.Color(H.amb), 0.8).multiplyScalar(H.hemiK)).multiplyScalar(0.77 * 0.3183);
    mistC.setRGB(Math.min(mistC.r, 1), Math.min(mistC.g, 1), Math.min(mistC.b, 1));
    const mist = W.mist > 0 ? fx.makeMist({ rng: lk2.fork('mist'), time, count: W.white > 0.5 ? 120 : 110, area: [300, 2, 300], center: [0, 0.8, 0], size: [8, 22], color: '#' + mistC.getHexString(),
      opacity: W.mist, drift: [6.3 * W.wind, 0, -4.9 * W.wind], flatten: W.white > 0.5 ? 0.24 : 0.13, near: [2.5, 5], follow: true }) : null;
    if (mist) { scene.add(mist.object); await ctx.yield(); }
    // cast by seed: jackdaws (smaller, grey-naped) wheeling over the gate's tent roof
    lk2();                                                                                             // (once a cast by seed: the draw is kept, the jackdaws are always there)
    fauna.add(F.makeFlock({ rng: lk2.fork('jackdaws'), species: 'crows', count: Math.round(10 * density), size: 0.9, center: [GATE[0] + 8, 31, GATE[1]], radius: 20, height: 7, speed: 8, wander: [4, 2, 4, 0.4], maxSigma: 3,
      body: '#17181c', neckC: '#7c8088', head: '#121317' })); await ctx.yield();
    // crows wheeling round the gilt dome on the sweep and over the cathedral's domes, so the stillest stretch has wings in it
    fauna.add(F.makeFlock({ rng: lk2.fork('sweep'), species: 'crows', count: 26, size: 1.3, center: [-20, 17.5, 8], radius: 7, height: 5, speed: 7, wander: [2, 1.2, 2, 0.4], maxSigma: 3, spread: [30, 4, 30] })); await ctx.yield();      // (in the lane between the cathedral and the tower, a little over our heads) (the cure: a flatter flock of its own, wheeling 12 to 23 m up, over the lane)
    // and a dozen burst off the cathedral's crosses as we come abreast of it
    fauna.add(F.makeFlock({ rng: lk2.fork('burst3'), species: 'crows', count: 12, size: 1.4, wander: [2, 1.2, 2, 0.4], maxSigma: 3, cross: { path, u: path.nearestXZ(-6, 80).u - 0.02, lead: 44, height: 19, span: 210, side: -1, angle: 50, duration: 40 } })); await ctx.yield();
    fauna.add(F.makeFlock({ rng: lk2.fork('cathedral'), species: 'crows', count: Math.round(26 * density), size: 1.4, center: [-35, 32, 14], radius: 20, height: 9, speed: 8, wander: [4, 2, 4, 0.4] })); await ctx.yield();

    // rivals and the sleigh
    const sails = [[0.42, 0.115, 0.05], [0.62, 0.56, 0.42], [0.5, 0.33, 0.1]];      // tanbark red (a tarred black sail read as a hole in the picture), cream, ochre
    const rival1 = new THREE.Mesh(yachtGeometry(sails[sailPick < 0.6 ? 0 : 2]), hero.surfaceMaterial); await ctx.yield();
    const rival2 = new THREE.Mesh(yachtGeometry(sails[1]), hero.surfaceMaterial);      // (the rival that crosses before the wall is cream-sailed on every visit; the draw above is kept)
    rival1.frustumCulled = false; rival2.frustumCulled = false; scene.add(rival1, rival2);
    const sprayMat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`uniform vec3 uSunCol, uSky, uFogCol; uniform float uSunK, uHemiK, uTime, uFogDen; varying vec2 vUv; varying vec3 vW;
        ${GLSL_COMMON}
        void main(){
          float n = vn(vec2(vUv.x * 5. + vW.x * 0.3, vUv.y * 3.5 - uTime * 7.)) * vn(vec2(vUv.x * 11. + 3., vUv.y * 8. - uTime * 12.));
          float a = smoothstep(0.05, 0.35, n) * (1. - vUv.y) * (1. - vUv.y) * smoothstep(0., 0.2, vUv.x) * smoothstep(0., 0.2, 1. - vUv.x) * smoothstep(0., 0.06, vUv.y);
          float dist = length(cameraPosition - vW); float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
          gl_FragColor = vec4(mix((uSunCol * uSunK * 0.75 + uSky * uHemiK) * 0.3183 * 0.85, uFogCol, f), a * 0.8);
        }` });
    const sprayGeo = sprayGeometry();
    for (const r of [rival1, rival2]) { const sp = new THREE.Mesh(sprayGeo, sprayMat); sp.frustumCulled = false; sp.renderOrder = 5; r.add(sp); }
    // WHAT MOVES LIES IN THE ICE TOO: a twin of the same geometry with the part's mirror material, a child of the moving mesh with no transform of
    // its own (the mirror's vertex program works from the model matrix, so the image follows its parent's place, yaw, heel and scale)
    const iceImage = (m) => { const t = new THREE.Mesh(m.geometry, hero.mirrorMaterial); t.frustumCulled = false; t.renderOrder = 3; m.add(t); return t; };
    iceImage(rival1); iceImage(rival2);
    // the sleigh on the ice road: one horse, or a troika by seed (three abreast under the shaft bow), a driver, a lantern, snow flying from hooves and runners
    const sa = new Acc(), troika = sailPick2 > 0.5;
    for (const hx of (troika ? [-0.8, 0, 0.8] : [0])) {
      const hc = hx === 0 ? [0.07, 0.05, 0.04] : [0.16, 0.11, 0.07], zo = hx === 0 ? 0 : 0.5;
      sa.add(UNIT.box, M(hx, 0.9, -2.2 + zo, 0.55, 0.75, 1.9), hc, MAT.PLAIN); sa.add(UNIT.box, M(hx, 1.4, -3.3 + zo, 0.3, 0.8, 0.5, 0, -0.5), hc, MAT.PLAIN);
      sa.add(UNIT.box, M(hx + (hx > 0 ? 0.12 : hx < 0 ? -0.12 : 0), 1.95, -3.95 + zo, 0.22, 0.28, 0.62, hx * -0.5, 0.45), hc, MAT.PLAIN);          // head (the outer horses look outward)
      sa.add(UNIT.box, M(hx, 1.0, -1.2 + zo, 0.1, 0.75, 0.1, 0, 0.6), [0.02, 0.02, 0.02], MAT.PLAIN);                                              // tail
      for (const lx of [-0.2, 0.2]) for (const lz of [-1.5, -2.9]) sa.add(UNIT.box, M(hx + lx, 0, lz + zo, 0.12, 0.95, 0.12, 0, lz < -2 ? -0.2 : 0.2), hc, MAT.PLAIN);
    }
    for (const sx of [-0.42, 0.42]) { sa.add(UNIT.box, M(sx, 0.75, -1.0, 0.06, 0.06, 3.4, 0, -0.08), [0.2, 0.14, 0.08], MAT.PLAIN); sa.add(UNIT.box, M(sx, 1.2, -3.0, 0.07, 1.0, 0.07, 0, 0, sx > 0 ? 0.4 : -0.4), [0.5, 0.1, 0.06], MAT.PLAIN); }   // shafts, the bow
    sa.add(UNIT.box, M(0, 2.08, -3.0, 0.5, 0.08, 0.08), [0.5, 0.1, 0.06], MAT.PLAIN);
    sa.add(UNIT.box, M(0, 0.2, 1.1, 1.2, 0.55, 2.6), [0.25, 0.08, 0.05], MAT.PLAIN); sa.add(UNIT.box, M(0, 0.7, 2.2, 1.2, 0.7, 0.2, 0, 0.2), [0.25, 0.08, 0.05], MAT.PLAIN);
    for (const sx of [-0.6, 0.6]) sa.add(UNIT.box, M(sx, 0, 1.0, 0.07, 0.2, 3.6), [0.05, 0.05, 0.06], MAT.PLAIN);
    sa.add(UNIT.box, M(0, 0.7, 0.5, 0.6, 0.85, 0.5), [0.3, 0.25, 0.17], MAT.PLAIN); sa.add(UNIT.ball6, M(0, 1.72, 0.5, 0.17, 0.19, 0.17), [0.1, 0.07, 0.05], MAT.PLAIN);
    sa.add(UNIT.ball6, M(0.62, 1.0, 0, 0.12, 0.15, 0.12), [0.3, 0.22, 0.1], MAT.GLOW);
    const sleigh = new THREE.Mesh(sa.build(), hero.surfaceMaterial); sleigh.frustumCulled = false; sleigh.rotation.y = TH + Math.PI; sleigh.scale.setScalar(1.6); scene.add(sleigh);
    { const pg = [new THREE.PlaneGeometry(5, 1.3).rotateY(Math.PI / 2).translate(0.5, 0.65, -1.4), new THREE.PlaneGeometry(5, 1.3).rotateY(Math.PI / 2).translate(-0.5, 0.65, -1.2),
        new THREE.PlaneGeometry(1.5, 0.9).rotateY(Math.PI / 2).translate(0, 2.3, -4.5), new THREE.PlaneGeometry(6, 1.1).rotateY(Math.PI / 2).translate(0, 0.55, 4.6)], pp = [], pu = [];
      for (const g of pg) { const ni = g.toNonIndexed(); pp.push(...ni.attributes.position.array); pu.push(...ni.attributes.uv.array); }
      const puff = new THREE.BufferGeometry(); puff.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); puff.setAttribute('uv', new THREE.Float32BufferAttribute(pu, 2));
      const pm = new THREE.Mesh(puff, sprayMat); pm.frustumCulled = false; pm.renderOrder = 5; sleigh.add(pm); }
    iceImage(sleigh);
    await ctx.yield();
    // the fisher's short rod, jigging; the pike hanging over the cathedral square (gone with a flick as we come up); the weed
    const ra = new Acc(); ra.add(UNIT.box, M(0, 0, 0, 0.045, 1.25, 0.045), [0.05, 0.04, 0.03], MAT.PLAIN);
    await ctx.yield();
    const rod = new THREE.Mesh(ra.build(), hero.surfaceMaterial); rod.frustumCulled = false; rod.position.set(-201.35, 1.05, 522.25); rod.rotation.set(-1.15, 0.5, 0, 'YXZ'); scene.add(rod);
    // slush steaming in the fishing holes: a small wisp over each, in one mesh
    { const sp = [], su = [];
      for (const [hx, hz] of townBits.holes) { const ni = new THREE.PlaneGeometry(0.75, 0.95).rotateY(-0.4).translate(hx + 0.2, 0.5, hz - 0.15).toNonIndexed(); sp.push(...ni.attributes.position.array); su.push(...ni.attributes.uv.array); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
      const steam = new THREE.Mesh(sg, sprayMat); steam.frustumCulled = false; steam.renderOrder = 5; scene.add(steam); }
    // the fisher's breath: one small puff by his head, swelling with each breath and torn off down the wind
    const breath = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), sprayMat); breath.frustumCulled = false; breath.renderOrder = 5; breath.position.set(-200.85, 1.6, 522.2); breath.rotation.y = -0.4; scene.add(breath);
    const pa = new Acc(), pkc = [0.3, 0.36, 0.16], pkb = [0.7, 0.7, 0.5];
    pa.add(UNIT.ball6, M(0, 0, 0, 0.21, 0.25, 1.65), pkc, MAT.PLAIN); pa.add(UNIT.ball6, M(0, -0.09, 0.05, 0.18, 0.2, 1.5), pkb, MAT.PLAIN);
    pa.add(UNIT.ball6, M(0, -0.02, -1.45, 0.14, 0.13, 0.55), pkc, MAT.PLAIN);                                       // the long flat snout
    pa.add(UNIT.oct, M(0, 0.26, 1.0, 0.03, 0.22, 0.34), pkc, MAT.PLAIN); pa.add(UNIT.oct, M(0, -0.26, 1.05, 0.03, 0.2, 0.3), pkc, MAT.PLAIN);   // dorsal and anal fins, far back
    for (const sx of [-1, 1]) pa.add(UNIT.oct, M(sx * 0.2, -0.16, -0.75, 0.2, 0.025, 0.14, sx * 0.5), pkb, MAT.PLAIN);
    const pike = new THREE.Mesh(pa.build(), hero.surfaceMaterial); pike.frustumCulled = false; pike.scale.setScalar(1.5); scene.add(pike);
    const ta = new Acc(); ta.add(UNIT.oct, M(0, 0, 0.42, 0.035, 0.46, 0.44), pkc, MAT.PLAIN);
    await ctx.yield();
    const pikeTail = new THREE.Mesh(ta.build(), hero.surfaceMaterial); pikeTail.frustumCulled = false; pikeTail.position.set(0, 0, 1.45); pike.add(pikeTail);
    const weedN = Math.round(weedAt.length / 4 * Math.min(1, 0.6 + 0.4 * density) * detail) * 4;
    const weed = makeWeed(U, weedAt.slice(0, weedN)); scene.add(weed);
    await ctx.yield();

    const veh = makeVehicle(U, W.rime); scene.add(veh.root); veh.root.scale.setScalar(0);
    await ctx.yield();

    // THE LIGHT CHANGES ALONG THE RUN (day and golden hour): the sun sinks by 45 percent of its height and warms from cream to gold between the
    // market square and the gate, so the cathedral and the tower take raking gold light and the last third is warmer than the first; shadows
    // lengthen, the horizon band and the haze warm with it. Only uniform values, colours and the key light's direction change.
    const sunMove = !H.glow && !night ? 1 : 0, sun0 = new THREE.Color(H.sun), sun1 = new THREE.Color(H.sun).lerp(new THREE.Color('#FFA040'), hourId === 'golden' ? 0.4 : 0.78);
    const hor0 = fogC.clone(), hor1 = fogC.clone().lerp(new THREE.Color('#FBD0A0'), 0.62), gnd0 = U.uGnd.value.clone(), gnd1 = U.uGnd.value.clone().lerp(new THREE.Color('#F4D0AA'), 0.7), scat0 = U.uScat.value.clone(), scat1 = new THREE.Color('#ffb070').multiplyScalar(Math.max(H.iceScat, 0.34));
    const skySun0 = sky.uniforms.uSunColor.value.clone(), skyScat0 = sky.uniforms.uScatterColor.value.clone(), skyScat1 = new THREE.Color('#ffb070'), skyGrad0 = sky.uniforms.uGrad.value.y;
    const rigSun0 = rig.sun.color.clone(), sunK0 = H.sunK, hemiK0 = H.hemiK, tmpC = new THREE.Color(), SHCAP = 7, mistK0 = W.mistK * (night ? 0.6 : 1), mistW = 0.18 * lightK * lightK;
    const WHITE = new THREE.Color(1, 1, 1);
    // (the sky deepens as the sun goes down: the zenith toward ultramarine, the middle sky toward lilac, so gold walls stand against a darker blue)
    const zen0 = U.uZen.value.clone(), zen1 = zen0.clone().lerp(new THREE.Color('#1f2f86'), 0.55), mid0 = U.uMid.value.clone(), mid1 = mid0.clone().lerp(new THREE.Color('#8f86c6'), 0.5);
    await ctx.yield();
    const cam = new THREE.Vector3(), cq = new THREE.Quaternion(), cs = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
    const L = path.length;
    // scripted moments are keyed to where things stand along the track, not to fixed numbers
    const uTurn = path.nearestXZ(-41, 165).u, uPike = path.nearestXZ(-5, 72).u, uCr0 = path.nearestXZ(-76, 224).u;
    let steer = 0, sleighOff = 0;
    const win = (a, b, c, d, u) => sstep(a, b, u) * (1 - sstep(c, d, u));
    const update = (dt, time, camera, u) => {
      u = u || 0;
      camera.matrixWorld.decompose(cam, cq, cs);
      hero.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera); ridges.update(dt, time, camera);
      fauna.update(dt, time, camera, u);
      dust.update(dt, time, camera); drift.update(dt, time, camera); smoke.update(dt, time, camera); if (mist) mist.update(dt, time, camera);
      if (sunMove) {
        const sk = sstep(0.08, 0.6, u), el = lel * (1 - 0.5 * sk) * D2R, sv = U.uSun.value;
        sv.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
        sky.uniforms.uSunDir.value.copy(sv); rig.direction.copy(sv);
        // (less of the blue sky's fill: gold light, cobalt shade; deepest in the lane between the cathedral and the tower, then as it was to the gate)
        const lnk = win(0.5, 0.56, 0.66, 0.72, u);
        U.uSunCol.value.copy(sun0).lerp(sun1, sk); U.uSunK.value = sunK0 * (1 - 0.1 * sk * (1 - lnk)); U.uHemiK.value = hemiK0 * (1 - 0.18 * sk - 0.14 * sk * lnk);
        U.uShLen.value = Math.min(1 / Math.tan(el), SHCAP);                                 // shadows lengthen with the sinking sun
        tmpC.copy(sun1).multiplyScalar(1 / Math.max(sun0.r, 0.01)); const gk = sun1.g / Math.max(sun0.g, 0.01), bk = sun1.b / Math.max(sun0.b, 0.01);
        sky.uniforms.uSunColor.value.setRGB(skySun0.r * mix(1, 1, sk), skySun0.g * mix(1, gk, sk), skySun0.b * mix(1, bk, sk));
        rig.sun.color.setRGB(rigSun0.r, rigSun0.g * mix(1, gk, sk), rigSun0.b * mix(1, bk, sk));
        U.uHor.value.copy(hor0).lerp(hor1, sk); U.uFogCol.value.copy(U.uHor.value); scene.fog.color.copy(U.uHor.value); sky.uniforms.uHorizon.value.copy(U.uHor.value);
        U.uScat.value.copy(scat0).lerp(scat1, sk); U.uGnd.value.copy(gnd0).lerp(gnd1, sk); sky.uniforms.uScatterColor.value.copy(skyScat0).lerp(skyScat1, sk * 0.7);
        sky.uniforms.uGrad.value.y = mix(skyGrad0, Math.max(skyGrad0, 0.3), sk);
        U.uZen.value.copy(zen0).lerp(zen1, sk); U.uMid.value.copy(mid0).lerp(mid1, sk); sky.uniforms.uZenith.value.copy(U.uZen.value); sky.uniforms.uMid.value.copy(U.uMid.value);
      }
      U.uMistCol.value.copy(U.uFogCol.value).lerp(WHITE, mistW); U.uMistK.value = mistK0 * mix(1, 0.5, sstep(0.62, 0.72, u));      // (the last third keeps its clear low sun)
      halo.position.copy(cam).addScaledVector(U.uSun.value, 900); halo.scale.setScalar(640); halo.lookAt(cam);
      // the racing crack: it fires from under our runner by the market square, reaches the tower's foot in a tenth of the run, then heals to a seam
      U.uCrack.value = sat((u - uCr0) / 0.1); U.uCrackF.value = mix(1, 0.35, sstep(uCr0 + 0.1, uCr0 + 0.16, u));
      U.uSail.value.set(cam.x, cam.z, u > 0 ? 1 : 0, 0);
      // the rare visit: windows come on house by house in a ring spreading from the tower, then the avenue to the gate
      U.uLampR.value = rare ? mix(0, 520, sstep(0.25, 0.6, u)) : 0;
      U.uChip.value = u > 0 ? mix(0.3, 1, sat((pace(u) - 0.36) / 0.7)) : 0;                    // (the chips thicken with our speed)
      // the red-sailed rival ahead of us down the channel, a few metres to starboard of our own line; where we bear away west of the tower
      // it holds its course and rounds the tower on the far side
      const lead = mix(84, 58, sstep(0.25, 0.5, u)) / L, ur = Math.min(u + lead, uTurn), over = Math.max(u + lead - uTurn, 0) * L;
      path.pointAt(ur, v1); path.tangentAt(ur, v2);
      const hl = Math.hypot(v2.x, v2.z) || 1, tx0 = v2.x / hl, tz0 = v2.z / hl, pk = sstep(0, 60, over);
      let dxo = mix(tx0, 0.407, pk), dzo = mix(tz0, -0.914, pk); const dl = Math.hypot(dxo, dzo) || 1; dxo /= dl; dzo /= dl;
      rival1.position.set(v1.x - tz0 * 2.4 + dxo * over, Math.sin(time * 7.3) * 0.02, v1.z + tx0 * 2.4 + dzo * over);
      rival1.rotation.set(0, Math.atan2(-dxo, -dzo) + 0.2 * (1 - pk), -0.16 + Math.sin(time * 1.3) * 0.03);      // (yawed a little off our heading: sail, hull and helmsman show)
      // the second rival crossing right to left in front of the wall
      const cr = sat((u - 0.56) / 0.34);
      rival2.position.set(-250 + Math.sin(time * 0.3) * 1.5, Math.sin(time * 6.1) * 0.02, mix(-170, 75, cr));
      rival2.rotation.set(0, Math.PI, 0.15 + Math.sin(time * 1.1) * 0.03);
      // the sleigh trotting north along the ice road (while we are still behind the portal it trots on the spot it will be found at;
      // what it had gained by the crossing is eased away, so it never jumps)
      if (u <= 0) sleighOff = (time * 4) % 60;
      const sa2 = 200 + Math.min(u, 0.5) * 440 + Math.max(u - 0.5, 0) * 60 + sleighOff * (1 - sstep(0, 0.07, u));      // (it slows to a walk well short of our track)
      sleigh.position.set(gx(sa2, ROAD_B), Math.abs(Math.sin(time * 9)) * 0.06, gz(sa2, ROAD_B));
      rod.rotation.x = -1.15 + Math.sin(time * 5.2) * 0.14 * Math.max(0, Math.sin(time * 0.9));
      { const br = Math.max(0, Math.sin(time * 1.9)); breath.scale.set(0.35 + 0.9 * br, 0.5 + 0.6 * br, 1); breath.position.x = -200.85 + 0.25 * br; }
      // the pike: hanging head to the current with a slow tail under our track by the cathedral, then a flick and gone ahead of us
      const pf = sat((u - (uPike - 0.06)) / 0.045), pd = pf * pf * 90, flick = Math.sin(Math.min(pf * 5, 1) * Math.PI), pt = sstep(0, 0.25, pf);
      pike.position.set(-5 - 0.25 * pd + Math.sin(time * 0.4) * 0.3, -2.3 - 5 * pf + Math.sin(time * 0.6) * 0.08, 72 - 0.97 * pd);
      pike.rotation.y = mix(-1.9, Math.atan2(0.25, 0.97), pt) + Math.sin(time * 0.5) * 0.06 + flick * Math.sin(time * 16) * 0.3;      // broadside to us until it goes
      pikeTail.rotation.y = Math.sin(time * 1.7) * 0.22 + (pf > 0 ? Math.sin(time * 21) * 0.6 : 0);
      // our yacht: two small corner parts from the camera's own matrix and projection. Each is in the frame for a stretch and below it for the rest
      const pe = camera.projectionMatrix.elements, tx = 1 / pe[0], ty = 1 / pe[5], d = 1.3, s = Math.min(tx / 1.068, 1.1);
      veh.root.position.copy(cam); veh.root.quaternion.copy(cq); veh.root.scale.setScalar(u > 0 ? 1 : 0);
      path.tangentAt(u, v1); path.tangentAt(Math.min(u + 0.012, 1), v2);
      const turn = v1.x * v2.z - v1.z * v2.x;
      steer += (Math.max(-0.32, Math.min(0.32, turn * 9)) - steer) * Math.min(1, dt * 4);
      const heel = win(0.66, 0.7, 0.76, 0.8, u);
      const visL = win(0.012, 0.035, 0.045, 0.07, u);      // (the plank and its chip tail as we get under way; after that the frame is the town's)
      const visR = win(0.012, 0.035, 0.05, 0.075, u);
      const chat = Math.sin(time * 88) * 0.004 + Math.sin(time * 31) * 0.003 + Math.sin(time * 3.1) * 0.006;
      veh.BL.position.set(-tx * d, -ty * d + chat + heel * 0.03 - (1 - visL) * 0.5, -d); veh.BL.scale.setScalar(s);
      veh.plank.rotation.z = heel * 0.12 + Math.sin(time * 2.3) * 0.01;
      veh.BR.position.set(tx * d, -ty * d + chat * 0.5 - (1 - visR) * 0.5, -d); veh.BR.scale.setScalar(s);
      veh.tiller.rotation.set(0, -0.75 + steer + Math.sin(time * 5) * 0.03, 0.07);
      veh.lash.rotation.set(Math.sin(time * 9) * 0.5, 0, 0.4 + Math.sin(time * 6.1) * 0.4);
    };

    const pace = (u) => {
      let p = mix(0.36, 1.14, sstep(0, 0.08, u));
      p = mix(p, 0.78, sstep(0.42, 0.51, u)); p = mix(p, 1.06, sstep(0.72, 0.8, u)); p = mix(p, 0.95, sstep(0.9, 1, u));      // (we linger from the whole-tower view through the lane to the sun)
      return p;
    };
    const poiV = new THREE.Vector3(), poiL = new THREE.Vector3(), poiG = new THREE.Vector3(), c612 = path.pointAt(0.612, new THREE.Vector3()), twrAim = (u) => 33.5 + 15625 * (Math.min(u, 0.612) - 0.58) * (Math.min(u, 0.612) - 0.58), e612 = Math.atan2(twrAim(0.612), Math.hypot(-9 - c612.x, 4 - c612.z));
    const tt = [H.title, W.title].filter(Boolean).join(', ');
    return {
      scene, path, duration: 40, pace,
      title: tt ? 'The Drowned Domes, ' + tt : 'The Drowned Domes',
      camera: { fov: 62, near: 0.15, far: 5000, lookAhead: 26, sway: 0.5, bank: 0.12, nearThrough: 0.3 },
      pois: [
        { at: [0, 32, 0], from: 0.03, to: 0.46, weight: 0.3 },
        { at: [-84, 12, 242], from: 0.27, to: 0.38, weight: 0.14, fade: 0.35 },   // (up a little at the gate of churches as we run in between them)
        { at: (t, u) => { path.pointAt(Math.min((u || 0) + 30 / path.length, 1), poiV); poiV.y = -10; return poiV; }, from: 0.19, to: 0.3, weight: 0.27, fade: 0.3 },   // (down into the town's main street as it streams under us)
        { at: [-23, 26, 5], from: 0.42, to: 0.66, weight: 0.5, fade: 0.25 },       // (up at the lane between the cathedral's domes and the tower: both masses in the frame as we run in)
        // (and, from 70 m short of it, up the bell tower: the gaze rises only as fast as it must to keep the gilt cross just inside the top of the
        // frame (twrAim), so the ice with the mirrored tower and cathedral stays in the foot of the picture as long as the lens allows, to about
        // 50 m off; then the gaze comes down evenly through the lane, walls and domes overhead on both sides, to the gilt dome at its far end)
        { at: (t, u) => { u = u || 0; path.pointAt(u, poiL); const k = sstep(0.61, 0.65, u), hx = mix(-9, -34, k) - poiL.x, hz = mix(4, -34, k) - poiL.z, hl = Math.hypot(hx, hz) || 1;
            const e = u < 0.612 ? Math.atan2(twrAim(u), Math.hypot(-9 - poiL.x, 4 - poiL.z)) : mix(e612, 6 * D2R, sstep(0.612, 0.672, u));
            return poiL.set(poiL.x + hx / hl * Math.cos(e) * 100, poiL.y + Math.sin(e) * 100, poiL.z + hz / hl * Math.cos(e) * 100); }, from: 0.55, to: 0.69, weight: 0.47, fade: 0.3 },
        { at: [-269, 4, 59], from: 0.655, to: 0.78, weight: 0.7, fade: 0.3 },      // (out of the lane: round toward the low sun and its road on the ice)
        { at: (t, u) => poiG.set(GATE[0], mix(5, 12, sstep(0.86, 0.94, u || 0)) - 40 * sstep(0.74, 0.8, u || 0) * (1 - sstep(0.82, 0.9, u || 0)), GATE[1]), from: 0.74, to: 1, weight: 0.7, fade: 0.2 },      // (down along the sunken avenue from the lift, then level at the gate)
      ],
      portal: { shape: 'circle', radius: 7, color: '#cfe4ff', glow: 1, revealDistance: 300 },
      post: { exposure: H.expo, bloom: { strength: 0.38, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.06, tint: '#ffffff', shadowTint: '#000000', vignette: 0.28, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { if (sky.dispose) sky.dispose(); },
    };
  },
};
