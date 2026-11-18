// THE CHAMAK ROAD: a moonless night after rain on a mountain highway above the Indus, built entirely in Pakistani
// truck art and seen from a jingle truck's cab. There is not one lamp in the world: gorge, bazaar and a bridge full of
// oncoming trucks ignite into jewel colour only where our own two headlights reach.
// The flight (825 m): the gorge shelf, eye 3 m above the road, with painted eyes on the boulders, flag strings at the
// cliff foot and a rockfall shelter overhead; the bazaar, shutter after shutter at arm's length under poplars and
// bunting; then at the bend the cab leaves the road and climbs, round the near tower and along the span 36 m out and
// 30 m up, so the River of Jewels (src/parts/chamak-road.js) is seen whole: forty trucks answering our two beams
// over the braided Indus, with villages and a lorry road alight on the far bank's terraces and snow on the peaks;
// it swoops in over the left main cable a quarter of the way along (an owl lifts off the cable and crosses in front of
// it), comes down between the hanger planes to crown height beside the convoy, then onto the free lane for the last
// trucks, the empty deck and the portal in the far tower's horseshoe arch. The river below carries the convoy's colours
// as a broken streak, with a lamp-lit village on its gravel bar and lantern rafts drifting down. On the road the cab
// frames the picture whole with its crown, bells and bonnet; in the air it slides out of the frame.
// World space == hero space: the bridge runs along Z with midspan at the origin, the camera drives +Z -> -Z.
// Road space (s, L): s = metres along the road (bend 310..389.4, near tower 389.4, far tower 799.4), L = metres to the right.
// No three.js lights: every surface answers the shared headlight uniforms (uEye, uBeamPos[2], uBeamDir, uBeamGain).
// The only lamps are sprites far across the valley (village windows, lorries), beyond the beams' reach.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sm } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, TILES as TL, GLSL_BEAM } from '../parts/chamak-road.js';

const PALETTE = ['#0A0E26', '#3A2C5C', '#E3122B', '#0FAE4B', '#FFC21A', '#1560F0', '#F4F8FF'];
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const BEND = 35 * DEG, RB = 130, HALF = 205;
const LANE = 3.6;
const TX = -Math.sin(BEND), TZ = -Math.cos(BEND);                      // direction of travel on the gorge road
const RX = -TZ, RZ = TX;                                               // its right-hand side
const BX = RB - RB * Math.cos(BEND), BZ = HALF + RB * Math.sin(BEND);  // where the bend begins
const S_BEND = 310, S_TOWER = S_BEND + RB * BEND, S_END = S_TOWER + 2 * HALF;
const C3 = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const V3 = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };

// road space -> world: writes [x, z, yaw]; yaw turns local -Z onto the direction of travel and local +X onto the right
function roadAt(s, L, out) {
  if (s <= S_BEND) { const a = s - S_BEND; out[0] = BX + TX * a + RX * L; out[1] = BZ + TZ * a + RZ * L; out[2] = BEND; }
  else if (s < S_TOWER) { const phi = (S_TOWER - s) / RB, r = RB - L; out[0] = RB - r * Math.cos(phi); out[1] = HALF + r * Math.sin(phi); out[2] = phi; }
  else { out[0] = L; out[1] = HALF - (s - S_TOWER); out[2] = 0; }
  return out;
}

// The gorge: a road shelf under a cliff on the left wall, a terrace for the bazaar, a 90 m drop to the river, a
// plateau on the far bank, and embankments that carry the bend and both towers. Never above y = -0.35 on the road.
function makeHeight(noise) {
  // noise is only paid for where it shows (the flat shelf and the foot of the drop need none); the three are made once,
  // not for every call: the mesher asks for a height a few hundred thousand times
  const N1 = (x, z) => noise.fbm2(x * 0.0035, z * 0.0035, 3), N2 = (x, z) => noise.n2(x * 0.03, z * 0.03), N3 = (x, z) => noise.n2(x * 0.011 + 7, z * 0.011);
  return (x, z) => {
    const dx = x - BX, dz = z - BZ, a = dx * TX + dz * TZ, L = dx * RX + dz * RZ;
    const wT = sm(-190, -165, a) * (1 - sm(25, 70, a));
    const Lc = -7.6 - 20 * wT, Le = 4.9 + 9.6 * wT;
    let y;
    if (L < Lc) {
      // the wall is cut into prows and alcoves along the road, with a bench a few metres up in places, so that the beam
      // rakes across large forms; its upper slope steps back in shelves. The wall only ever recedes from the road.
      const rec = 4.4 * Math.pow(Math.abs(noise.n2(a * 0.034 + 3.1, 5.3)), 0.75) * (1 - 0.8 * wT);
      const t0 = Math.max(0, Lc - L - rec), wb = 4.6 * sm(-0.15, 0.4, noise.n2(a * 0.021 + 11.7, 2.9));
      const t = t0 < 3.4 ? t0 : Math.max(3.4, t0 - wb);
      y = -0.35 + (56 + 14 * N3(x, z)) * sm(0, 17, t) + (t > 12 ? Math.pow(t - 12, 0.95) * (1.0 + 0.45 * N1(x, z)) : 0) + N2(x, z) * Math.min(t * 0.22, 6);
      if (y > 62) y += (Math.floor(y / 9 + N2(x, z) * 0.5) * 9 + 4.5 - y) * 0.6 * sm(62, 80, y);
    } else if (L <= Le) y = -0.35;
    else if (L < 228) {
      const t = L - Le;
      y = -0.35 - 92.4 * sm(0, 50, t) + (t > 3 && t < 54 ? (N2(x, z) * 2.4 + N3(x, z) * 3) * sm(3, 16, t) * (1 - sm(42, 54, t)) : 0);
    } else {
      const t = L - 228;
      y = -92.75 + 92.4 * sm(0, 58, t) + (t > 20 ? (N2(x, z) * 2 + N3(x, z) * 5) * sm(20, 70, t) : 0) + (t > 170 ? Math.pow(t - 170, 0.96) * (0.95 + 0.5 * N1(x, z)) : 0);
    }
    // causeway round the bend and the two tower abutments
    let pd = 1e9;
    if (a > -6) { const cx = RB - x, cz = z - HALF, phi = Math.atan2(cz, cx); if (phi >= 0 && phi <= BEND + 0.06) pd = Math.abs(Math.hypot(cx, cz) - RB) - 8.5; }
    if (pd < 60) y = Math.max(y, -0.35 - 96 * sm(0, 58, Math.max(pd, 0)));
    // the two tower abutments are rock spurs, not cones: the foot runs out further in places and the flanks carry ribs
    const pt = Math.min(Math.max(Math.abs(x) - 15, Math.abs(z - 211.5) - 13.5), Math.max(Math.abs(x) - 15, Math.abs(z + 216) - 18));
    if (pt < 80) {
      const pp = Math.max(pt, 0); let ya = -0.35 - 96 * sm(0, 58 * clamp(0.8 + 0.5 * N1(x, z), 0.6, 1.3), pp);
      if (pp > 4) ya += N2(x, z) * 6 * sm(4, 30, pp) + N3(x, z) * 9 * sm(10, 50, pp);
      y = Math.max(y, ya);
    }
    return y;
  };
}

// ------------------------------------------------------------------------------------------------ shaders
// Rock (terrain and boulders): beam lambert on striated stone, indigo sky fill, mauve rim toward the afterglow.
const ROCK_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
#include <fog_pars_vertex>
void main() {
#ifdef USE_INSTANCING
  vec4 lp = instanceMatrix * vec4(position, 1.); vec3 ln = mat3(instanceMatrix) * normal;
#else
  vec4 lp = vec4(position, 1.); vec3 ln = normal;
#endif
  vec4 wp = modelMatrix * lp; vW = wp.xyz; vN = normalize(mat3(modelMatrix) * ln + vec3(0., 1e-6, 0.)); vC = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
uniform float uSnowK; uniform float uWetK; uniform vec3 uFlashDir; uniform float uFlash; uniform vec3 uRockA; uniform vec3 uRockB; uniform vec3 uBank; uniform float uTime; uniform float uHi;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
${GLSL_BEAM}
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 V = normalize(uEye - vW + vec3(0., 1e-5, 0.));
  float n1 = vnoise(vW.xz * .07 + vW.y * .05), n2 = vnoise(vec2(vW.x + vW.z, vW.y * 3.) * .33 + n1 * 2.), n3 = vnoise(vW.xz * 1.9 + vW.y * 1.3);
  // two sharper octaves and two families of cracks, faded out where they would fall below a pixel; they carve the normal too
  float dist = distance(uEye, vW); float f4 = 1. - smoothstep(14., 45., dist), f5 = 1. - smoothstep(4., 14., dist);
  vec2 pf = vec2(vW.x + vW.z * .8, vW.y * 1.3 - vW.z * .25);
  // band limit: whatever is finer than the pixel's footprint on the rock fades out (a face raked at a grazing angle has a
  // long footprint; distance alone left a pixel-scale hatch there). fp = metres of rock under one pixel; an octave is
  // gone by the time a pixel covers a third of its period (the relief is taken from screen-space differences of the
  // height, which turn anything finer into a checker of lit and unlit pixels).
  float fp = max(length(dFdx(pf)), length(dFdy(pf))); float fby = fwidth(vW.y * .6);
  f5 *= 1. - smoothstep(.006, .02, fp); f4 *= 1. - smoothstep(.02, .06, fp);
  float n4 = vnoise(pf * 6. + n3 * 1.7), n5 = vnoise(pf * 17. + 5.);
  float c1 = (1. - smoothstep(0., .12, abs(2. * vnoise(vec2(vW.x + vW.z, vW.y * 2.) * 1.3 + n1 * 3.) - 1.))) * (1. - smoothstep(.03, .1, fp));
  float c2 = (1. - smoothstep(0., .1, abs(2. * vnoise(vec2(vW.x - vW.z * .6, vW.y * 1.2) * .45 + 9.) - 1.))) * (1. - smoothstep(.08, .25, fp));
  float crack = max(c1 * (1. - smoothstep(40., 150., dist)), c2 * (1. - smoothstep(200., 500., dist)));
  // hard beds standing proud of the face, each undercut by a dark line (steep rock only, faded out with distance)
  float fb = (1. - smoothstep(35., 110., dist)) * (1. - smoothstep(.45, .8, N.y)) * (1. - smoothstep(.12, .5, fby));
  float bfr = fract(vW.y * .6 + n1 * 2.2 + n2 * .35);
  float bed = smoothstep(0., .2, bfr) * (1. - smoothstep(.55, 1., bfr));
  float under = (1. - smoothstep(0., .16, bfr)) + smoothstep(.94, 1., bfr);
  float ngy = N.y;
  float Hh = (n4 - .5) * .16 * f4 + (n5 - .5) * .028 * f5 - crack * .07 * (1. - smoothstep(.012, .04, fp)) + bed * .2 * fb
    + (vnoise(pf * .85 + n1 * 3.) - .5) * .5 * (1. - smoothstep(50., 140., dist));      // lumps a metre across: form the beam can model
  vec3 dpx = dFdx(vW), dpy = dFdy(vW);
  float fpw = max(length(dpx), length(dpy));      // metres of ground under one pixel: far slopes carry no noise finer than that
  // THE LAND'S OWN RELIEF. Nothing from here to the carved normal reads the eye: each form is laid in the rock's own
  // coordinates (height, metres along the gorge) and is gone once a pixel's footprint covers a third of it (fby, fpw),
  // the fade multiplying the slope after the difference is taken, so a fade can never draw a line of its own.
  float alB = dot(vW.xz, vec2(-uBank.y, uBank.x));      // metres along the gorge: both banks run this way
  float nA = vnoise(vW.xz * .03), nB = vnoise(vW.xz * .011 + 5.);      // the land's two widest noises (the gravel bars read them too)
  // ledges: one bed in 7.7 m stands proud or back, folded exactly as the fine beds are; sharp underside, a shelf sloping back on top
  float sM = (vW.y + n1 * 3.67) * .13; float mi = floor(sM), mf = sM - mi; float fwm = fwidth(sM);      // ledges under one pixel
  float hA = hash21(vec2(mi, 3.)), hB = hash21(vec2(mi, 11.));
  float fM = (1. - smoothstep(.08, .3, fwm)) * (1. - smoothstep(.75, .92, ngy));
  float Hm = smoothstep(0., .1 + fwm, mf) * (1. - smoothstep(.72, 1., mf)) * (hA - .25) * .8;
  // gullies and spurs: 9 m deep, about 70 m apart, running down the bank; rills between them, 1.6 m deep and 13 m apart
  float slopeK = (1. - smoothstep(.8, .95, ngy)) * smoothstep(20., 120., vW.y);
  float gv = abs(2. * vnoise(vec2(alB * .0145 + nA * .7, vW.y * .006 + nB * 2. + 3.)) - 1.);      // 0 along a gully, 1 on a spur
  float rv = abs(2. * vnoise(vec2(alB * .075 + nA * 1.5, vW.y * .02 + 7.)) - 1.);
  float fG = 1. - smoothstep(6., 18., fpw), fR = 1. - smoothstep(1.2, 4., fpw);
  float gul = smoothstep(0., .55, gv), ril = smoothstep(0., .5, rv);
  float Hg = gul * 9. * slopeK, Hr = ril * 1.6 * slopeK;
  float dex = dFdx(Hm) * fM + dFdx(Hg) * fG + dFdx(Hr) * fR, dey = dFdy(Hm) * fM + dFdy(Hg) * fG + dFdy(Hr) * fR;      // the land's own relief alone
  float dhx = dFdx(Hh) + dex, dhy = dFdy(Hh) + dey;
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 Ne = normalize(abs(det) * N - sign(det) * (dex * r1 + dey * r2) + N * 1e-7);      // the slope with its gullies, rills and ledges and nothing of the eye: where snow lies
  N = normalize(abs(det) * N - sign(det) * (dhx * r1 + dhy * r2) + N * 1e-7);
  n3 = mix(.5, n3, 1. - smoothstep(.12, .45, fpw)); n2 = mix(.5, n2, 1. - smoothstep(.3, 1., fpw));
  float band = mix(.5, .5 + .5 * sin(vW.y * 1.3 + n1 * 9.), 1. - smoothstep(.5, 1.6, fpw));
  // each ledge is of the lighter or the darker rock, and one in five is a pale shelf
  float pale = step(.8, hB) * fM;
  vec3 alb = mix(uRockA, uRockB, clamp(band * .6 + n2 * .4 + (hB - .5) * .5 * fM, 0., 1.)) * (.55 + .6 * n3) * (.5 + 1.5 * dot(vC, vec3(.3333)));
  alb *= (.82 + .36 * mix(.5, n4, f4)) * (.88 + .24 * mix(.5, n5, f5)) * (1. - .6 * crack) * (1. - .42 * under * fb);
  alb = mix(alb, alb * 1.9 + .01, pale * .6);
  // scree lies in the gully floors of the lower slopes and widens downhill into fans, paler than the rock
  float sw = mix(.34, .1, smoothstep(40., 260., vW.y));
  float scree = (1. - smoothstep(sw * .4, sw, gv)) * slopeK * fG * smoothstep(.5, .72, ngy) * (1. - smoothstep(150., 300., vW.y));
  alb = mix(alb, vec3(.19, .185, .24) * (.8 + .4 * n3), scree * .8);
  float up = smoothstep(.55, .9, N.y);
  alb = mix(alb, alb * vec3(.78, .72, .64) + .015, up);
  alb = mix(alb, vec3(.6, .64, .74), uSnowK * smoothstep(.4, .8, ngy * .75 + N.y * .25 + (n2 - .5) * .3));      // snow lies by the slope of the land, not of every pebble
  vec3 L0, L1; float b0 = beamAt(vW, uBeamPos[0], L0) * uBeamGain, b1 = beamAt(vW, uBeamPos[1], L1) * uBeamGain;
  float lam = .5 * (b0 * max(dot(N, L0), 0.) + b1 * max(dot(N, L1), 0.));
  float spec = .5 * (b0 + b1) * pow(max(dot(N, normalize(L0 + V)), 0.), 24.) * uWetK;
  float reach = mix(1., .04, smoothstep(40., 170., dist) * uHi);      // from the air the long beam is for the tape: bare rock returns almost none of it
  vec3 col = (alb * (1.3 * lam + .03 * (b0 + b1)) + vec3(.6, .7, .9) * spec * .1 * (.4 + n3)) * reach;
  // THE SKY ON THE LAND. The rock holds the sky's fill times its own albedo on the carved normal, so the beds, cracks and
  // bands the beam shows are there outside it, dimmer and bluer: tops catch the sky, undersides are dark lines, a gully
  // sees under half the sky its spur sees. A vertical face of mean rock holds about one fill colour.
  float hs = .5 + .5 * N.y; hs = hs * hs * (3. - 2. * hs);
  float gs = smoothstep(0., .5, gv), gk = slopeK * fG;      // 0 in a gully floor, 1 on a spur; where the land has gullies
  float occ = mix(1., mix(.42, 1., gs), gk * (1. - .7 * scree));
  // old snow: above 255 m by the slope of the land; below, it lingers where the afterglow's side never warms it, in gully
  // floors and on faces turned from the afterglow, as streaks down the rills that thin out by about 120 m. The terraces'
  // fields are cleared (their own place, no distance in it). In the snow look fresh snow lies down the whole bank by live's rule.
  float gd = dot(N, uGlowDir);
  float pmL = dot(vW.xz, uBank.xy) + uBank.z;
  float pm = smoothstep(292., 330., pmL) * (1. - smoothstep(500., 640., pmL)) * smoothstep(-6., 4., vW.y) * (1. - smoothstep(210., 300., vW.y));
  float gdE = dot(Ne, uGlowDir);
  float snLow = (50. * (1. - gul) * gk + 70. * smoothstep(.05, .5, -gdE)) * mix(.7, .45 + .55 * (1. - ril), fR);
  float snO = smoothstep(225., 285., vW.y + (n1 - .5) * 60. * fR + (nA - .5) * 80. * fG + snLow) * smoothstep(.3, .62, ngy * .6 + Ne.y * .4) * (1. - pm);
  float snL = uSnowK * smoothstep(.4, .8, ngy * .75 + N.y * .25 + (n2 - .5) * .3);
  float sn = max(snO, snL);
  // ledge tops take half as much sky again; undersides stay the dark lines they are
  vec3 fill = mix(alb * 12. * occ * (1. + .5 * smoothstep(-.2, .5, N.y)), vec3(3.3), snL) * uSkyFill * hs;
  float rim = 1. - abs(dot(N, V));
  fill += uGlowCol * (.55 * pow(max(dot(N, uGlowDir), 0.), 1.5) + .1 * rim * rim * rim);
  // NEVER DARKER THAN LIVE: live's high ground as it stands (the upper shelves and ridge lines catch the sky and the
  // afterglow, the tops carry old snow), on the land's own slope; the rock's bands, the gullies and the ledges model it
  // around that level (rel: mean not under 1)
  float hi = smoothstep(120., 300., vW.y); float cap = smoothstep(300., 400., vW.y + (n1 - .5) * 90.) * smoothstep(.35, .7, ngy);
  float hs0 = .5 + .5 * ngy; hs0 = hs0 * hs0 * (3. - 2. * hs0); float hsE = .5 + .5 * Ne.y; hsE = hsE * hsE * (3. - 2. * hsE);
  float albRel = clamp(dot(alb, vec3(3.3)), .6, 1.8);
  float rel = albRel * mix(1., mix(.85, 1.15, gs), gk) * clamp(1. + 1.5 * (hsE - hs0), .6, 1.5);
  fill += (vec3(.10, .12, .22) * smoothstep(.35, .8, ngy) * (1. + 2.2 * cap) * rel + uGlowCol * (.5 + cap) * max(gd, 0.)) * hi;
  // THE AFTERGLOW MODELS THE BANKS: a face turned to it takes a wash of its hue at the strength of the look's own sky
  // fill; a face turned away takes none, and a gully floor none
  const vec3 LUM = vec3(.2126, .7152, .0722);
  fill += uGlowCol * (dot(uSkyFill, LUM) / max(dot(uGlowCol, LUM), 1e-4) * 5.5 * smoothstep(0., .35, gdE) * albRel * mix(1., gs, gk));
  fill += uGlowCol * .06 * smoothstep(-.3, .7, gd) * sn;      // the snow's side toward the afterglow, a little warmer
  fill = mix(fill, max(fill, vec3(.18, .216, .396) * hs), snO);      // lingering snow lies in shade: a little over half of the open shelves' cap
  // the middle slopes take some sky too, far off and from the air, so the banks are land and not a black field
  fill += vec3(.05, .06, .12) * smoothstep(.3, .8, ngy) * smoothstep(-60., 120., vW.y) * (.5 * smoothstep(150., 420., dist) + .5 * uHi);
  // the gorge floor: pale gravel bars under the braid
  float bedK = (1. - smoothstep(-89., -84., vW.y)) * smoothstep(.5, .85, ngy);
  float bars = smoothstep(.3, .62, nA * .65 + nB * .35);
  fill = mix(fill, (uSkyFill * 2.2 + uGlowCol * .3) * (.75 + .5 * n3), bedK * (.3 + .7 * bars) * .85);
  // the far bank: terraced fields. A dark riser every six metres of height, and between the risers paddies that hold the
  // sky (some flooded and pale, some planted and dark), cut into fields along the slope. They stand by their place alone
  // (the band along the bank and the band of height; no distance of the eye) and fade only where a terrace would fall
  // below two pixels.
  float Lb = dot(vW.xz, uBank.xy) + uBank.z;
  float tm = smoothstep(292., 330., Lb) * (1. - smoothstep(500., 640., Lb)) * smoothstep(-6., 4., vW.y) * (1. - smoothstep(210., 300., vW.y));
  float ty = vW.y / 6. + (n1 - .5) * .8 + .12 * sin(dot(vW.xz, vec2(-uBank.y, uBank.x)) * .07 + n1 * 5.); float fwy = fwidth(ty); float tf = fract(ty);
  // every terrace has its own field length and its own offset, so the bunds never line up into brickwork
  float tyc = floor(ty); float fl = mix(55., 150., hash21(vec2(tyc, 3.)));
  float along = dot(vW.xz, vec2(-uBank.y, uBank.x)) / fl + hash21(vec2(tyc, 7.)); float fa = fract(along);
  float fh = hash21(vec2(tyc, floor(along)));
  float riser = 1. - smoothstep(.06, .12 + fwy, tf);
  float bund = 1. - smoothstep(1., 2.6, min(fa, 1. - fa) * fl);
  float wetf = step(.75, fh) * (.8 + .2 * sin(uTime * .7 + fh * 40.));
  float aaT = 1. - smoothstep(.35, .7, fwy);
  float gl8 = max(dot(vec3(0., 1., 0.), normalize(uGlowDir + V + vec3(0., 1e-4, 0.))), 0.); gl8 *= gl8; gl8 *= gl8;
  vec3 paddy = (uSkyFill * 2.6 + uGlowCol * (.4 + 1.6 * gl8)) * mix(.3, 1., wetf);
  // plainly stepped where a terrace is resolved: the flooded fields pale with the sky, the planted ones a little under the
  // land's level, risers and bunds dark lines; a riser thinner than a pixel takes no more light away than a resolved one
  float rk = .0765 / (.09 + .5 * fwy);
  fill = mix(fill, (fill * mix(.9, 1.1, step(.75, fh)) + paddy * 1.2) * (1. - rk * riser) * (1. - .6 * bund), tm * mix(.25, .9, aaT));
  // heat lightning: the flash lights the sky and the sky lights the land, so whatever looks up or toward it answers, the snow most
  float fN = dot(N, uFlashDir);
  fill += vec3(.3, .32, .6) * uFlash * max(max(fN, 0.) * .05, clamp(.6 * hs + .5 * max(fN, 0.), 0., 1.) * mix(.12 * albRel, mix(.2, .45, snO), sn));
  gl_FragColor = vec4(max(col + fill, 0.), 1.);
  #include <fog_fragment>
}`;

// Poplar and apricot crowns: instanced leaf cards round a dark core; leaves shiver and show pale undersides in the beam.
const TREE_VERT = /* glsl */`
attribute vec4 aLeaf; attribute vec2 aTree;
uniform float uTime; uniform vec3 uWind;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vLeaf; varying float vTree;
#include <fog_pars_vertex>
void main() {
  vec3 p = position; float ph = aLeaf.x + aTree.x;
  float fl = sin(uTime * 8.3 + ph * 37.) * .6 + sin(uTime * 13.1 + ph * 61.) * .4;
  p += normal * fl * .08 * aLeaf.z;
  vec4 lp = instanceMatrix * vec4(p, 1.);
  float h = max(position.y, 0.);
  float sway = sin(uTime * .9 + aTree.x * 6.283 + h * .12) * .6 + sin(uTime * 2.3 + aTree.x * 11.) * .25;
  lp.xz += uWind.xy * sway * h * h * .0022 * uWind.z;
  vec4 wp = modelMatrix * lp; vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * normal) + vec3(0., 1e-6, 0.));
  vUv = uv; vLeaf = vec4(ph, aLeaf.y, aLeaf.z, fl); vTree = aTree.y;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
uniform vec3 uLeafA; uniform vec3 uLeafB; uniform vec3 uCut; uniform float uBack;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vLeaf; varying float vTree;
${GLSL_BEAM}
#include <fog_pars_fragment>
void main() {
  float card = vLeaf.z;
  if (card > .5) {
    vec2 g = vUv * uCut.xy; vec2 id = floor(g); vec2 f = fract(g) - .5;
    float h = hash21(id + floor(vLeaf.x * 91.));
    f += (vec2(h, fract(h * 7.3)) - .5) * .3;
    vec2 e = f * vec2(1.3, .85);
    // grass and thorn (one row of cells): each cell is a blade that leans its own way and tapers to a point, not a bar
    if (uCut.y < 1.5) e = vec2((f.x + (h - .5) * .7 * vUv.y * vUv.y) * (1.6 + 5. * vUv.y * vUv.y), 0.);
    float edge = max(abs(vUv.x - .5), abs(vUv.y - .5));
    if (dot(e, e) > .2 || h < uCut.z || edge > .485) discard;
  }
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 V = normalize(uEye - vW + vec3(0., 1e-5, 0.));
  if (dot(N, V) < 0.) N = -N;
  vec3 L0, L1; float b0 = beamAt(vW, uBeamPos[0], L0) * uBeamGain, b1 = beamAt(vW, uBeamPos[1], L1) * uBeamGain;
  float bs = .5 * (b0 + b1);
  float lam = .5 * (b0 * max(dot(N, L0), 0.) + b1 * max(dot(N, L1), 0.));
  float flick = smoothstep(.1, .7, vLeaf.w) * card;
  vec3 alb = mix(uLeafA, uLeafB, flick * .85) * (.65 + .6 * hash21(vec2(vLeaf.x * 13., 2.))) * mix(.2, 1., card);
  alb *= mix(vec3(1.), vec3(1.2, .95, .7), vTree);
  vec3 col = alb * (.85 * lam + uBack * bs);      // a small backscatter share: the crown stays a dark flame with sparkling undersides
  col += uSkyFill * .3 * (.4 + .6 * max(N.y, 0.)) + uGlowCol * .08 * pow(max(dot(N, uGlowDir), 0.), 2.);
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

// Sprites, all additive. Lit only by the beams: 0 moths, 1 kettle steam, 2 eyeshine, 3 snow, 4 road leaves, 5 tape offcuts.
// The only lamps in the world are far away across the valley, never within the beams' reach: 6 a village window, 7 a lorry on the far road.
const SPR_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aData; attribute vec3 aCol;
uniform float uTime; uniform vec3 uEye; uniform vec3 uCamR; uniform vec3 uCamU; uniform vec3 uAhead; uniform float uPix;
uniform float uSnowAmt; uniform float uStorm; uniform vec3 uWind;
varying vec2 vC; varying vec3 vCol; varying vec3 vW; varying vec4 vK;
vec3 wrapBox(vec3 q, vec3 c, vec3 box) { return c + mod(q - c + box * .5, box) - box * .5; }
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
void main() {
  float kind = aData.x, ph = aData.y, size = aData.z, sd = aData.w; vec3 P = position; float a = 1.; vec2 cr = aCorner; float tw = 0.;
  if (kind < .5) {
    vec3 box = vec3(26., 8., 44.); vec3 c = uEye + uAhead * 24. + vec3(0., -.6, 0.);
    vec3 q = position * box + vec3(sin(uTime * .31 + ph * 40.) * 2.2, sin(uTime * .43 + sd * 17.) * 1.1, cos(uTime * .27 + sd * 29.) * 2.2);
    P = wrapBox(q, c, box);
    float w = uTime * (4. + 3. * sd) + ph * 60.;
    P += vec3(cos(w), sin(w * 1.3) * .6, sin(w)) * (.25 + .3 * ph);
    cr.x *= .5 + .5 * abs(sin(uTime * 31. + ph * 90.));
  } else if (kind < 1.5) {
    float f = fract(uTime * (.22 + .1 * sd) + ph);
    P = position + vec3(sin(ph * 50. + f * 5.) * .3 * f, .15 + f * 2.6, cos(sd * 31. + f * 4.) * .3 * f) + vec3(uWind.x, 0., uWind.y) * f * f * .9;
    size *= .35 + 1.5 * f; a = sin(f * 3.1416) * .55;
  } else if (kind < 2.5) {
    float f = fract(uTime * (.13 + .1 * sd) + ph);
    a = 1. - smoothstep(.9, .92, f) * (1. - smoothstep(.97, .99, f));
    a *= smoothstep(6., 11., distance(P, uEye));
  } else if (kind < 3.5) {
    vec3 box = vec3(36., 22., 46.); vec3 c = uEye + uAhead * 18.;
    vec3 q = position * box + vec3(sin(uTime * .5 + ph * 30.) * .9 + uWind.x * uTime * 1.5, -uTime * (1.3 + sd), cos(uTime * .4 + sd * 20.) * .9 + uWind.y * uTime * 1.5);
    P = wrapBox(q, c, box); a = uSnowAmt;
  } else if (kind < 4.5) {
    float f = fract(uTime * .1 * (.5 + sd) + ph);
    P = position + vec3(uWind.x, 0., uWind.y) * (f * 14. - 7.) + vec3(0., .06 + abs(sin(f * 50. + ph * 9.)) * .2, 0.);
    a = sin(f * 3.1416);
    tw = uTime * 5. * (.5 + sd) + ph * 20.; cr = rot2(cr, tw); cr.y *= .25 + .75 * abs(sin(tw * .7));
  } else if (kind > 5.5) {
    a = kind < 6.5 ? .68 + .32 * sin(uTime * (.6 + 1.4 * sd) + ph * 40.) : 1.;
  } else {
    vec3 box = vec3(34., 13., 60.); vec3 c = uEye + uAhead * 24. + vec3(0., 1.5, 0.);
    vec3 q = position * box + vec3(-uTime * (6. + 5. * sd), sin(uTime * 1.3 + ph * 50.) * 1.4 - uTime * .7, uTime * 1.2 + cos(uTime * .9 + sd * 40.) * 1.5);
    P = wrapBox(q, c, box); a = uStorm;
    tw = uTime * (5. + 6. * sd) + ph * 70.; cr = rot2(cr, tw); cr.y *= .15 + .85 * abs(sin(tw * .83 + sd * 9.));
  }
  float dist = distance(P, uEye); size = max(size, dist * uPix * (kind > 5.5 ? 2.5 : kind > 1.5 && kind < 2.5 ? 2.6 : 1.6));
  a *= smoothstep(.6, 1.8, dist) * (kind > 4.5 ? smoothstep(1.5, 5., dist) : 1.);
  vec3 wp = P + (uCamR * cr.x + uCamU * cr.y) * size * step(.002, a);
  vW = P; vC = aCorner; vCol = aCol; vK = vec4(kind, a, tw, sd);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const SPR_FRAG = /* glsl */`
varying vec2 vC; varying vec3 vCol; varying vec3 vW; varying vec4 vK;
${GLSL_BEAM}
void main() {
  float kind = vK.x; float r2 = dot(vC, vC); float shape = 1.;
  if (kind < 3.5 || kind > 5.5) { if (r2 > 1.) discard; shape = exp(-r2 * 3.5) * (1. - r2); }
  else if (kind < 4.5) { vec2 e = vC * vec2(1., 1.7); if (dot(e, e) > 1.) discard; }      // a leaf or a petal
  else { if (max(abs(vC.x), abs(vC.y) * 1.6) > 1.) discard; }                              // a sliver of tape
  vec3 Ld; float bA = beamAt(vW, uBeamPos[0], Ld); float bB = beamAt(vW, uBeamPos[1], Ld); float b = max(bA, bB) * uBeamGain;
  if (kind > 1.5 && kind < 2.5) {
    vec3 d = vW - uEye; float r = max(length(d), 1e-3); float c = dot(d / r, uBeamDir);
    b = smoothstep(.1, .75, c) * (1. - smoothstep(70., 150., r)) * uBeamGain; shape = exp(-r2 * 5.) * .62 * (1. - r2) * (1. - r2);
  }
  if (kind > 5.5) b = 1.;
  vec3 col = vCol * b * shape * vK.y;
  if (kind > 4.5 && kind < 5.5) { float g = abs(sin(vK.z * .83 + vK.w * 9.)); g *= g; g *= g; col *= .3 + 1.7 * g * g; }
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

// The cab round the camera (crown, chain fringe, bonnet): camera-space geometry lit by a bounce term that follows how
// much the beams are returning, so it warms in the bazaar and falls to a silhouette in the gorge.
const CAB_VERT = /* glsl */`
attribute vec4 aFx; attribute vec4 aPiv; attribute vec3 aCol;
uniform float uTime; uniform float uSwing;
varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vFx;
void main() {
  vec3 p = position;
  if (aFx.z > 2.5 && aFx.z < 3.5) {
    float dy = aPiv.y - p.y; float ph = aPiv.w;
    p.x += (sin(uTime * 3.1 + ph * 6.283) * .6 + uSwing) * aFx.w * dy; p.z += cos(uTime * 2.3 + ph * 9.) * aFx.w * .5 * dy;
  }
  vN = normalize(normalMatrix * normal + vec3(0., 1e-6, 0.)); vCol = aCol; vUv = uv; vFx = aFx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const CAB_FRAG = /* glsl */`
uniform sampler2D tA; uniform sampler2D tB; uniform float uBounce; uniform vec3 uBounceCol; uniform vec3 uFillC; uniform vec3 uGlowC; uniform float uGlint;
varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vFx;
float cabHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec3 N = normalize(vN + vec3(0., 0., 1e-6)); if (N.z < 0.) N = -N;
  float tile = vFx.x; vec3 base = vCol; float tape = 0.; vec2 uv = vUv;
  if (tile > -.5) {
    float t = floor(tile + .5); vec2 cell = vec2(mod(t, 8.), floor(t / 8.));
    vec2 f = mix(fract(uv), uv, step(abs(uv - .5), vec2(.5))); f = clamp(f, .012, .988);
    vec2 auv = (cell + vec2(f.x, 1. - f.y)) / 8.;
    vec2 gx = dFdx(uv) * vec2(.125, -.125), gy = dFdy(uv) * vec2(.125, -.125);
    vec3 c = textureGrad(tA, auv, gx, gy).rgb; vec4 d = textureGrad(tB, auv, gx, gy);
    base = c * vCol; tape = smoothstep(.3, .7, d.r);
  } else if (tile > -1.5) { base = vCol; }
  else if (tile > -2.5) { base = vCol; tape = 1.; }
  else { base = vec3(.02, .02, .025) * vCol; }
  vec2 q = vec2(uv.x + uv.y, uv.x - uv.y) * 15.; vec2 id = floor(q);
  float h1 = cabHash(id), h2 = cabHash(id + 17.31);
  float glit = smoothstep(.72, 1., sin(h1 * 40. + uGlint * 3. + h2 * 6.283));
  vec3 col = (base + vec3(.01)) * uBounceCol * uBounce * (.5 + .5 * max(N.z, N.y)) * mix(1., 1.5 + 3. * glit, tape);
  float rim = 1. - abs(N.z);
  col += uFillC * (.55 + .45 * N.y) + uGlowC * rim * rim * .3;
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

// Beam cones in the damp air: two soft additive wedges that leave the lamps under the eye.
const CONE_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal + vec3(0., 1e-6, 0.)); vV = -mv.xyz; vUv = uv; gl_Position = projectionMatrix * mv; }`;
const CONE_FRAG = /* glsl */`
uniform float uCone; uniform float uTime; uniform vec3 uConeCol;
varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main() {
  float t = vUv.x; float f = abs(dot(normalize(vN), normalize(vV + vec3(0., 0., 1e-5)))); f *= f;
  float fall = (1. - t); fall *= fall;
  float damp = .75 + .25 * sin(t * 37. - uTime * 1.7 + vUv.y * 12.566) * sin(t * 11. + uTime * .6);
  gl_FragColor = vec4(max(uConeCol * uCone * f * fall * smoothstep(0., .04, t) * damp, 0.), 1.);
}`;

// Heat lightning: one additive card behind the snow peaks.
const FLASH_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const FLASH_FRAG = /* glsl */`
uniform float uFlash; uniform vec3 uFlashCol; varying vec2 vUv;
void main() { float x = (vUv.x - .5) * 2.; float g = exp(-x * x * 3.2) * exp(-vUv.y * 3.6) * smoothstep(0., .04, vUv.y) * (1. - x * x); gl_FragColor = vec4(uFlashCol * max(g, 0.) * uFlash, 1.); }`;

// The afterglow in the gorge V: one additive card far up the gorge, behind the towers and in front of the ridges, so
// that cliffs, poplars and both towers stand against it as silhouettes. Soft on every side.
const GLOW_FRAG = /* glsl */`
uniform vec3 uGlowC; varying vec2 vUv;
void main() { float x = (vUv.x - .5) * 2.; float y = vUv.y;
  float g = exp(-x * x * 4.) * (1. - x * x) * smoothstep(0., .22, y) * exp(-max(y - .22, 0.) * 3.4) * (1. - smoothstep(.7, 1., y));
  gl_FragColor = vec4(uGlowC * max(g, 0.), 1.); }`;

// The river carries the convoy: one additive sheet just over the water under the span. A true mirror image would lie
// far below the frame from the high line, so the sheet shows what the eye expects instead: each truck's colours lying
// on the water beneath it and to either side, drawn out across the stream in broken, shimmering streaks (brightest on
// the two channels, faint on the wet gravel between).
const WAKE_VERT = /* glsl */`varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WAKE_FRAG = /* glsl */`
uniform vec3 uEye; uniform float uTime; uniform float uAmt; uniform float uTravel; uniform float uFogD; uniform vec3 uBankT; uniform vec3 uBankR;
uniform vec3 uJ0; uniform vec3 uJ1; uniform vec3 uJ2; uniform vec3 uJ3; uniform vec3 uJ4;
varying vec3 vW;
float wHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float wNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wHash(i), wHash(i + vec2(1., 0.)), f.x), mix(wHash(i + vec2(0., 1.)), wHash(i + vec2(1., 1.)), f.x), f.y); }
vec3 jew(float i) { i = mod(i, 5.); return i < .5 ? uJ0 : i < 1.5 ? uJ1 : i < 2.5 ? uJ2 : i < 3.5 ? uJ3 : uJ4; }
void main() {
  float dl = distance(vW, uEye);
  float n1 = wNoise(vW.xz * .05 + vec2(uTime * .1, -uTime * .07));
  float dx = vW.x - 3.6; float w = exp(-dx * dx / 900.);
  float n0 = wNoise(vW.xz * .021 + 3.7);
  float zh = vW.z + (n1 - .5) * 22. + (n0 - .5) * 14.;
  float c = (195.8 + .2857 * uTravel - zh) / 13.; float k = floor(c), fc = fract(c);
  float span = 1. - smoothstep(196., 207., abs(zh));
  float on = step(0., c) * step(c, 40.) * span;
  vec3 col = mix(jew(k * 3. + 1.), jew(k * 3. + floor(fc * 2.)), .3) * (.55 + .45 * sin(fc * 6.283) * sin(fc * 6.283)) * on;
  col += vec3(.5, .46, .56) * .08 * span;      // the handrail's pale tape, the whole length of the span
  float st = wNoise(vec2(vW.x * .13 + uTime * .3, vW.z * .55 + n1 * 5.));      // glints drawn out across the stream, in patches
  float sp = wNoise(vW.xz * 1.9 + vec2(-uTime * .8, uTime * .5));
  float shimmer = (.05 + 3.4 * smoothstep(.45, .95, st) * (.15 + 1.6 * sp * sp * sp)) * (.25 + .75 * smoothstep(.25, .75, n0));
  // the water itself: the main channel and the side channel, as the terrain's bank coordinates give them
  float a = dot(vW.xz, uBankT.xy) + uBankT.z, L = dot(vW.xz, uBankR.xy) + uBankR.z, kk = (1500. - a) / 117.5;
  float m1 = 1. - smoothstep(22., 40., abs(L - (141.3 + 40. * sin(kk * .82 + .6))) - 11. * sin(kk * 1.2917 + 1.));
  float m2 = 1. - smoothstep(4., 13., abs(L - (79.3 - 20. * sin(kk * .82 + .9))) - 4.5 * sin(kk * .9583));
  float water = .2 + .8 * max(m1, m2);      // wet gravel glints too, more faintly
  float fog = exp(-uFogD * uFogD * dl * dl);
  gl_FragColor = vec4(max(col * w * shimmer * water * fog * uAmt, 0.), 1.);
}`;

// ------------------------------------------------------------------------------------------------ geometry helpers
// A tree crown: a dark core wrapped in leaf cards. flame = Lombardy poplar, otherwise a round apricot head.
function crownGeometry(rng, o) {
  const pos = [], nor = [], uv = [], leaf = [], idx = [];
  const prof = (t) => (o.flame ? Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.62))), 0.85) : Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1))));
  const segs = 7, rows = 7, H = o.height - o.base;
  if (o.core !== false) for (let r = 0; r <= rows; r++) for (let k = 0; k <= segs; k++) {
    const t = r / rows, a = (k / segs) * TAU, rad = o.radius * 0.6 * prof(t) + 0.02;
    pos.push(Math.cos(a) * rad, o.base + t * H, Math.sin(a) * rad); nor.push(Math.cos(a) * 0.96, 0.28, Math.sin(a) * 0.96); uv.push(k / segs, t); leaf.push(0.37, t, 0, 0);
  }
  if (o.core !== false) for (let r = 0; r < rows; r++) for (let k = 0; k < segs; k++) { const a = r * (segs + 1) + k, b = a + 1, c = a + segs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const blades = !!o.blades;      // blades: tall thin cards that all stand on the ground, with normals turned upward (grass and thorn sprays)
  for (let i = 0; i < o.cards; i++) {
    const t = 0.03 + 0.95 * Math.pow(rng(), 0.85), ang = rng() * TAU, rad = o.radius * prof(t) * (0.7 + 0.32 * rng()); let y = o.base + t * H;
    const cx = Math.cos(ang) * rad, cz = Math.sin(ang) * rad, an = ang + (rng() - 0.5) * 1.3;
    let nx = Math.cos(an), nz = Math.sin(an), ny = (rng() - 0.3) * 0.7; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const hl = Math.hypot(nx, nz) || 1, ux = -nz / hl, uz = nx / hl, vx = ny * uz, vy = nz * ux - nx * uz, vz = -ny * ux;
    const w = o.size * (0.7 + 0.6 * rng()) * 0.5, h = w * (o.aspect || (o.flame ? 1.5 : 1.05)), ph = rng(), base = pos.length / 3;
    y = blades ? o.base + h * Math.abs(vy) - 0.04 : Math.max(y, o.base + h * Math.abs(vy) + 0.05);
    const sx = blades ? nx * 0.45 : nx, sy = blades ? 0.86 : ny, sz = blades ? nz * 0.45 : nz;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      pos.push(cx + ux * a * w + vx * b * h, y + vy * b * h, cz + uz * a * w + vz * b * h); nor.push(sx, sy, sz); uv.push(a * 0.5 + 0.5, b * 0.5 + 0.5); leaf.push(ph, t, 1, 0);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aLeaf', new THREE.Float32BufferAttribute(leaf, 4)); g.setIndex(idx);
  return g;
}

// A boulder that carries a painted eye: a true sphere inside the eye's cap (round local +Z, where the eye and its ring
// of tape sit 7 percent proud), lumps and flat cuts everywhere else, faceted so that it reads as broken rock.
// A generator: each yield is a place the build may hand the page back; it returns the geometry.
function* eyeBoulderGeometry(noise, rng) {
  const g = new THREE.SphereGeometry(1, 22, 15).toNonIndexed(), p = g.attributes.position, col = new Float32Array(p.count * 3);
  const ox = rng.range(-40, 40), oy = rng.range(-40, 40), cuts = [];
  for (let i = 0; i < 7; i++) { const x = rng.gauss(), y = rng.gauss() * 0.7 + 0.2, z = -Math.abs(rng.gauss()) - 0.3, l = Math.hypot(x, y, z) || 1; cuts.push([x / l, y / l, z / l, rng.range(0.8, 0.94)]); }
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const l0 = Math.hypot(x, y, z) || 1; x /= l0; y /= l0; z /= l0;
    const m = sm(0.93, 1.3, Math.acos(clamp(z, -1, 1)));
    let l = 1 + m * (0.16 * noise.n3(x * 1.4 + ox, y * 1.4 + oy, z * 1.4) + 0.07 * noise.n3(x * 3.3 + oy, y * 3.3, z * 3.3 + ox));
    for (const c of cuts) { const d = x * c[0] + y * c[1] + z * c[2]; if (d * l > c[3]) l = lerp(l, c[3] / d, m); }
    p.setXYZ(i, x * l, y * l, z * l); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0.333;
    if (i % 400 === 399) yield;
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); yield;
  g.computeVertexNormals();
  return g;
}

// Sprite list -> one quad mesh geometry (see SPR_VERT for the kinds).
function makeSprites() {
  const pos = [], cor = [], dat = [], col = [], idx = [];
  return {
    add(kind, x, y, z, ph, size, sd, c) {
      const b = pos.length / 3;
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, z); cor.push(u, v); dat.push(kind, ph, size, sd); col.push(c[0], c[1], c[2]); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    },
    count() { return pos.length / 12; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(cor, 2));
      g.setAttribute('aData', new THREE.Float32BufferAttribute(dat, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
  };
}

// The cab, in camera space (eye at the origin, looking down -Z): a carved crown across the top 12 percent of the
// frame with a fringe of chains and bells just under it, carved cheeks in the top corners, and the nose of a painted
// bonnet in the bottom 10 percent. Nothing reaches the central 70 percent.
function buildCab(G, rng, J) {
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  const D = 1.6, y0 = 0.752, th = 0.212, n = 19, x0 = -n * th * 0.5, yb = y0 + 0.022;
  const fam = [TL.flower, TL.peacock, TL.sun, TL.flower, TL.heart, TL.bird, TL.fish, TL.flower, TL.cypress];
  for (let i = 0; i < n; i++) {
    const k = i === (n - 1) / 2 ? TL.peacock : fam[rng.int(0, fam.length - 1)];
    S({ tile: k[0] + rng.int(0, k[1] - 1) }); G.quad([x0 + i * th, yb, -D], [x0 + (i + 1) * th, yb, -D], [x0 + (i + 1) * th, yb + th, -D], [x0 + i * th, yb + th, -D]);
  }
  S({ tile: -2, tint: J.gold }); G.quad([-2.3, y0, -D + 0.003], [2.3, y0, -D + 0.003], [2.3, yb, -D + 0.003], [-2.3, yb, -D + 0.003], [0, 0, 24, 0.1]);
  S({ tile: TL.chevrons }); G.quad([-2.5, yb + th, -D], [2.5, yb + th, -D], [2.5, yb + th + 0.16, -D], [-2.5, yb + th + 0.16, -D], [0, 0.3, 15, 0.62]);
  for (const sx of [-1, 1]) {
    S({ tile: TL.scallops }); G.tri([sx * 1.3, y0, -D + 0.002], [sx * 2.3, y0, -D + 0.002], [sx * 2.3, 0.3, -D + 0.002], [0, 1], [4, 1], [4, -1]);
    S({ tile: -2, tint: J.red }); G.quad([sx * 1.3, y0, -D + 0.004], [sx * 1.33, y0 + 0.02, -D + 0.004], [sx * 2.3, 0.33, -D + 0.004], [sx * 2.3, 0.3, -D + 0.004], [0, 0, 6, 0.1]);
    S({ tile: -3 }); G.box(sx * 2.4, 0, -D, 0.2, 2.4, 0.1, 'Z');
  }
  for (let i = 0; i < 40; i++) {
    const x = -1.72 + (i / 39) * 3.44, len = 0.026 + (i % 2) * 0.016 + 0.006 * rng(), ph = rng(), w = 0.0035, c = J.jew[i % 4];
    S({ tile: -2, kind: 3, param: 0.6, pivot: [x, y0, -D, ph], tint: J.white });
    G.quad([x - w, y0 - len, -D], [x + w, y0 - len, -D], [x + w, y0, -D], [x - w, y0, -D], [0, 0, 0.02, 0.2]);
    S({ tile: -2, kind: 3, param: 0.6, pivot: [x, y0, -D, ph], tint: c });
    const by = y0 - len - 0.017; G.quad([x, by - 0.019, -D], [x + 0.013, by, -D], [x, by + 0.019, -D], [x - 0.013, by, -D], [0, 0, 0.1, 0.1]);
  }
  // bonnet: a domed top receding to the nose, a row of flowers along it, a tape spine, a finial and two reflector ears
  const z0 = -1.25, z1 = -2.7, nx = 6, nz = 4, hw = 1.25;
  const by = (x, z) => -1.32 - 0.04 * ((z - z0) / (z1 - z0)) - 0.3 * (x / hw) * (x / hw);
  const row = [TL.flower, TL.sun, TL.flower, TL.flower, TL.sun, TL.flower];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const xa = -hw + (i / nx) * 2 * hw, xb = -hw + ((i + 1) / nx) * 2 * hw, za = z0 + (j / nz) * (z1 - z0), zb = z0 + ((j + 1) / nz) * (z1 - z0);
    if (j === nz - 1) S({ tile: row[i][0] + rng.int(0, row[i][1] - 1) }); else S({ tile: j === nz - 2 ? TL.diamonds : j === 1 ? TL.scallops : TL.chevrons });      // mosaic to the last row: nothing blank on a tall screen
    G.quad([xa, by(xa, za), za], [xb, by(xb, za), za], [xb, by(xb, zb), zb], [xa, by(xa, zb), zb], j === nz - 2 ? [0, 0.3, 1, 0.7] : j === nz - 1 ? [0, 0, 1, 1] : [0, 0.25, 1, 0.75]);
  }
  S({ tile: -2, tint: J.gold }); G.quad([-0.02, by(0, z0) + 0.004, z0], [0.02, by(0, z0) + 0.004, z0], [0.02, by(0, z1) + 0.004, z1], [-0.02, by(0, z1) + 0.004, z1], [0, 0, 0.1, 4]);
  S({ tile: -2, tint: J.gold }); G.lathe(0, by(0, z1) - 0.02, z1 + 0.07, [[0.035, 0], [0.06, 0.05], [0.02, 0.12], [0, 0.19]], 6, 0.3);
  for (const sx of [-1, 1]) { const ex = sx * 0.9, ey = by(ex, z1) + 0.02; S({ tile: -2, tint: sx > 0 ? J.red : J.green }); G.quad([ex, ey, z1 + 0.05], [ex + 0.05, ey + 0.07, z1 + 0.05], [ex, ey + 0.14, z1 + 0.05], [ex - 0.05, ey + 0.07, z1 + 0.05], [0, 0, 0.2, 0.2]); }
  S({ tile: TL.diamonds }); G.quad([-hw, by(-hw, z1), z1], [hw, by(hw, z1), z1], [hw, -2.2, z1 - 0.1], [-hw, -2.2, z1 - 0.1], [0, 0, 6, 2]);
  for (const i of [-2, -1, n, n + 1]) {      // spare crown tiles beyond the corners, for very wide screens (no random draws)
    const k = fam[(i + 9) % fam.length]; S({ tile: k[0] }); G.quad([x0 + i * th, yb, -D], [x0 + (i + 1) * th, yb, -D], [x0 + (i + 1) * th, yb + th, -D], [x0 + i * th, yb + th, -D]);
  }
}

// ------------------------------------------------------------------------------------------------ bazaar pieces
// All built with the hero's mesh accumulator (tile >= 0 atlas motif, -1 enamel, -2 cut tape, -3 dull black; kind 4
// ribbon, kind 5 fluttering cloth), so they answer the headlights exactly as the trucks do.
const SET = (G) => (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
const pickTile = (rng, fam) => fam[0] + rng.int(0, fam[1] - 1);
const MOTIFS = [TL.flower, TL.peacock, TL.fish, TL.bird, TL.cypress, TL.sun, TL.eye, TL.heart, TL.flower, TL.fish];
const FIELDS = [TL.diamonds, TL.scallops, TL.chevrons, TL.checks, TL.stripes, TL.diamonds];
const X1 = [1, 0, 0], Y1 = [0, 1, 0], Z1 = [0, 0, 1];
const ROTX = new THREE.Matrix4().makeRotationX(Math.PI / 2);

function cloth(G, S, x0, x1, y0, y1, z, tile, tint, ph, pmax, r = [0, 0, 1, 1]) {
  S({ tile, kind: 5, pivot: [0, 0, 0, ph], tint }); const st = G.st;
  const put = (x, y, p, u, v) => { st.param = p; G.v([x, y, z], Z1, u, v); };
  put(x0, y0, pmax, r[0], r[1]); put(x1, y0, pmax, r[2], r[1]); put(x1, y1, 0, r[2], r[3]);
  put(x0, y0, pmax, r[0], r[1]); put(x1, y1, 0, r[2], r[3]); put(x0, y1, 0, r[0], r[3]);
}
function pennant(G, S, x, y, z, w, drop, tint, ph, ax = X1) {
  S({ tile: -2, kind: 5, pivot: [0, 0, 0, ph], tint }); const st = G.st, n = ax === X1 ? Z1 : X1;
  st.param = 0; G.v([x - ax[0] * w, y, z - ax[2] * w], n, 0, 0.2); G.v([x + ax[0] * w, y, z + ax[2] * w], n, 0.25, 0.2); st.param = 1; G.v([x, y - drop, z], n, 0.12, 0);
}
function ribbon(G, S, A, B, w, tile, tint, vrep = 1) {
  const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], l = Math.hypot(dx, dy, dz) || 1;
  S({ tile, kind: 4, pivot: [dx / l, dy / l, dz / l, 0], tint }); const st = G.st;
  st.param = -w; G.v(A, Z1, 0.2, 0); st.param = w; G.v(A, Z1, 0.8, 0); G.v(B, Z1, 0.8, vrep);
  st.param = -w; G.v(A, Z1, 0.2, 0); st.param = w; G.v(B, Z1, 0.8, vrep); st.param = -w; G.v(B, Z1, 0.2, vrep);
}
function crate(G, S, rng, x, y, z, s, ry) {
  G.at(x, y, z, ry, s); S({ tile: pickTile(rng, rng.pick([TL.fish, TL.flower, TL.fish, TL.sun, TL.bird])), tint: [0.92, 0.86, 0.76] }); G.box(0, 0.5, 0, 1, 1, 1, 'xXYzZ'); G.pop();
}
function cratePile(G, S, rng, x, z, s) {
  for (let i = 0; i < 3; i++) crate(G, S, rng, x + (i - 1) * s * 1.04, 0, z, s, (rng() - 0.5) * 0.2);
  for (let i = 0; i < 2; i++) crate(G, S, rng, x + (i - 0.5) * s * 1.04, s, z, s, (rng() - 0.5) * 0.3);
  if (rng.chance(0.6)) crate(G, S, rng, x, 2 * s, z, s, (rng() - 0.5) * 0.5);
}
function drum(G, S, rng, x, z, J) {
  S({ tile: rng.chance(0.5) ? TL.bands : TL.stripes, tint: [0.95, 0.95, 0.95] }); G.lathe(x, 0, z, [[0.33, 0], [0.35, 0.3], [0.33, 0.62], [0.35, 0.95]], 8, 2);
  S({ tile: -2, tint: J.jew[rng.int(0, 4)] }); G.lathe(x, 0.95, z, [[0.35, 0], [0, 0.02]], 8, 1);
}
function tyres(G, S, rng, x, z, J) {
  const n = rng.int(2, 4);
  for (let i = 0; i < n; i++) {
    S({ tile: -1, tint: [0.035, 0.035, 0.042] }); G.lathe(x, i * 0.28, z, [[0.3, 0], [0.5, 0.05], [0.5, 0.23], [0.3, 0.28]], 8, 1);
    S({ tile: -2, tint: i % 2 ? J.white : J.gold }); G.lathe(x, i * 0.28 + 0.1, z, [[0.505, 0], [0.505, 0.08]], 8, 4);
  }
}
function charpoy(G, S, rng, x, z, ry) {
  G.at(x, 0, z, ry);
  S({ tile: -1, tint: [0.09, 0.05, 0.03] }); for (const [a, b] of [[-0.9, -0.42], [0.9, -0.42], [0.9, 0.42], [-0.9, 0.42]]) G.box(a, 0.26, b, 0.09, 0.52, 0.09, 'xXzZ');
  G.box(0, 0.5, 0.42, 1.9, 0.08, 0.08, 'YZz'); G.box(0, 0.5, -0.42, 1.9, 0.08, 0.08, 'YZz');
  S({ tile: rng.chance(0.5) ? TL.diamonds : TL.chevrons, tint: [0.9, 0.85, 0.7] }); G.quad([-0.9, 0.52, 0.42], [0.9, 0.52, 0.42], [0.9, 0.52, -0.42], [-0.9, 0.52, -0.42], [0, 0, 3, 1.5]);
  G.pop();
}
function kettle(G, S, x, y, z, tint) {
  S({ tile: -2, tint }); G.lathe(x, y, z, [[0.16, 0], [0.25, 0.1], [0.26, 0.26], [0.15, 0.38], [0.06, 0.42], [0.07, 0.47], [0, 0.5]], 7, 0.5);
  G.tri([x + 0.2, y + 0.14, z], [x + 0.46, y + 0.38, z], [x + 0.22, y + 0.3, z], [0, 0], [0.2, 0], [0.1, 0.2]);
}
function pot(G, S, rng, x, y, z, J, s = 1) {
  S({ tile: rng.chance(0.4) ? TL.bands : -2, tint: J.jew[rng.int(0, 4)] }); G.lathe(x, y, z, [[0.08 * s, 0], [0.2 * s, 0.08 * s], [0.22 * s, 0.2 * s], [0.14 * s, 0.3 * s], [0.17 * s, 0.34 * s]], 6, 1);
}
// a parked motorbike with mosaic mudguards and tasselled bars; local +X is its nose
function bike(G, S, rng, J, x, z, ry) {
  G.at(x, 0, z, ry);
  const R = 0.42;
  for (const cx of [-0.68, 0.68]) {
    G.push(new THREE.Matrix4().makeTranslation(cx, R, 0).multiply(ROTX));
    S({ tile: -1, tint: [0.035, 0.035, 0.042] }); G.lathe(0, -0.07, 0, [[0.14, 0], [R, 0], [R, 0.14], [0.14, 0.14]], 8, 1);
    S({ tile: -2, tint: J.white }); G.lathe(0, 0.075, 0, [[0.2, 0], [0, 0.01]], 8, 1); G.lathe(0, -0.085, 0, [[0, 0], [0.2, 0.01]], 8, 1);
    G.pop();
    for (let i = 0; i < 3; i++) {
      const a0 = 0.5 + i * 0.72, a1 = a0 + 0.72, r = R + 0.07, P = (a, zz) => [cx + Math.cos(a) * r, R + Math.sin(a) * r, zz];
      S({ tile: TL.diamonds }); G.quad(P(a0, 0.1), P(a0, -0.1), P(a1, -0.1), P(a1, 0.1), [0, 0, 0.4, 0.4]);
    }
  }
  S({ tile: pickTile(rng, rng.pick([TL.flower, TL.heart, TL.sun])) }); G.box(0.14, 0.86, 0, 0.62, 0.3, 0.32, 'xXYzZ');
  S({ tile: -3 }); G.box(-0.4, 0.84, 0, 0.56, 0.12, 0.3, 'xXYzZ'); G.box(0, 0.56, 0, 1.2, 0.09, 0.09, 'YzZ'); G.box(0.66, 1.12, 0, 0.06, 0.06, 0.72, 'xXYzZ'); G.box(0.66, 0.78, 0, 0.07, 0.7, 0.07, 'xXzZ');
  S({ tile: -1, tint: [0.05, 0.05, 0.06] }); G.box(0.02, 0.48, 0, 0.42, 0.3, 0.26, 'xXzZ');
  S({ tile: -2, tint: J.white }); G.quad([0.74, 0.9, -0.1], [0.74, 0.9, 0.1], [0.74, 1.08, 0.1], [0.74, 1.08, -0.1], [0, 0, 0.2, 0.2]);
  S({ tile: -2, tint: J.red }); G.quad([-0.98, 0.8, 0.07], [-0.98, 0.8, -0.07], [-0.98, 0.9, -0.07], [-0.98, 0.9, 0.07], [0, 0, 0.1, 0.1]);
  for (const sz of [-1, 1]) for (let i = 0; i < 2; i++) pennant(G, S, 0.66, 1.1, sz * (0.3 + i * 0.07), 0.035, 0.26, J.jew[(i + (sz > 0 ? 0 : 2)) % 4], rng() * TAU, Z1);
  G.pop();
}

// One 7.5 m bay of the bazaar in its own frame: front faces +Z (toward the street), x runs along the street.
// o = { two, kind, awning, i, out }: out collects [what, x, y, z] in bay space (steam, eyes) for the sprites.
// A generator: each yield is a place the build may hand the page back (no random draw happens anywhere else meanwhile).
function* buildBay(G, rng, J, o) {
  const S = SET(G), H1 = 4.4, two = o.two, H = two ? 8.4 : H1, hw = 3.75, y0 = 0.3, y1 = 3.47;
  const fld = () => FIELDS[rng.int(0, FIELDS.length - 1)], mot = () => pickTile(rng, MOTIFS[rng.int(0, MOTIFS.length - 1)]);
  const wall = J.walls[rng.int(0, J.walls.length - 1)], paint = () => J.paints[rng.int(0, J.paints.length - 1)];
  S({ tile: -3 }); G.box(0, H / 2, -2.5, 7.44, H, 5, 'xXzY');
  if (o.end) for (const sx of [-1, 1]) {      // the gable of a row's end bay: a mosaic field, a dado, a great medallion and a tape line
    const x = sx * 3.74, za = sx > 0 ? 0 : -5, zb = sx > 0 ? -5 : 0, N = [sx, 0, 0], U1 = [0, 0, -sx];
    S({ tile: fld() }); G.quad([x, 0.9, za], [x, 0.9, zb], [x, H, zb], [x, H, za], [0, 0, 4, H * 0.55]);
    S({ tile: TL.checks }); G.quad([x, 0, za], [x, 0, zb], [x, 0.9, zb], [x, 0.9, za], [0, 0, 8, 1.5]);
    S({ tile: pickTile(rng, rng.pick([TL.eye, TL.sun, TL.peacock, TL.cypress])) });
    if (o.small) G.panel([x + sx * 0.02, 2.2, za + (zb - za) * 0.3], U1, Y1, N, 2.0, 2.0, 0.1, 0.08);      // a whole motif stays readable as this gable passes close
    else G.panel([x + sx * 0.02, 1.15, za + (zb - za) * 0.17], U1, Y1, N, 3.3, 3.3, 0.12, 0.09);
    S({ tile: -2, tint: J.gold }); G.quad([x + sx * 0.02, H1 - 0.05, za], [x + sx * 0.02, H1 - 0.05, zb], [x + sx * 0.02, H1 + 0.05, zb], [x + sx * 0.02, H1 + 0.05, za], [0, 0, 5, 0.1]);
    if (two) { S({ tile: mot() }); G.panel([x + sx * 0.02, 5.2, za + (zb - za) * 0.3], U1, Y1, N, 2.0, 2.0, 0.08, 0.06); }
  }
  for (const sx of [-1, 1]) { S({ tile: TL.bands, tint: [0.55, 0.55, 0.55] }); G.box(sx * 3.55, H1 / 2, 0.08, 0.4, H1, 0.3, 'xXZ', [0, 0, 1, 4]); }
  S({ tile: TL.checks }); G.box(0, 0.15, 0.14, 6.7, 0.3, 0.3, 'YZ', [0, 0, 12, 0.5]);
  S({ tile: fld() }); G.quad([-3.35, 3.55, 0.05], [3.35, 3.55, 0.05], [3.35, 4.4, 0.05], [-3.35, 4.4, 0.05], [0, 0.12, 7, 0.88]);
  S({ tile: -2, tint: J.jew[rng.int(0, 3)] }); G.quad([-3.35, y1, 0.07], [3.35, y1, 0.07], [3.35, 3.56, 0.07], [-3.35, 3.56, 0.07], [0, 0, 8, 0.1]);
  const k = o.kind;
  if (k === 0) {            // a triptych of square panels over a mosaic dado
    S({ tile: fld() }); G.quad([-3.35, y0, 0.03], [3.35, y0, 0.03], [3.35, 1.2, 0.03], [-3.35, 1.2, 0.03], [0, 0.2, 6, 0.8]);
    for (let i = 0; i < 3; i++) { S({ tile: mot() }); G.panel([-3.3 + i * 2.22, 1.27, 0.03], X1, Y1, Z1, 2.16, 2.16, 0.09, 0.07); }
  } else if (k === 1) {     // one mosaic field with a great medallion
    S({ tile: fld() }); G.quad([-3.35, y0, 0.03], [3.35, y0, 0.03], [3.35, y1, 0.03], [-3.35, y1, 0.03], [0, 0, 5, 2.4]);
    S({ tile: pickTile(rng, rng.pick([TL.sun, TL.peacock, TL.eye, TL.heart])) }); G.panel([-1.5, 0.42, 0.03], X1, Y1, Z1, 3.0, 3.0, 0.12, 0.09);
  } else if (k === 2) {     // a half-lowered shutter, a door curtain still swinging in the dark under it
    S({ tile: -3 }); G.quad([-3.35, y0, -0.9], [3.35, y0, -0.9], [3.35, 2.0, -0.9], [-3.35, 2.0, -0.9]);
    S({ tile: fld() }); G.quad([-3.35, 1.95, 0.03], [3.35, 1.95, 0.03], [3.35, y1, 0.03], [-3.35, y1, 0.03], [0, 0, 6, 1.4]);
    S({ tile: -2, tint: J.white }); G.quad([-3.35, 1.88, 0.05], [3.35, 1.88, 0.05], [3.35, 1.97, 0.05], [-3.35, 1.97, 0.05], [0, 0, 8, 0.1]);
    for (let i = 0; i < 5; i++) { const xa = -1.6 + i * 0.64; cloth(G, S, xa, xa + 0.6, 0.38, 1.9, -0.12, i % 2 ? TL.stripes : -1, i % 2 ? [1, 1, 1] : paint(), rng() * TAU, 0.55, [0, 0, 1, 2]); }
    crate(G, S, rng, -2.6, 0.3, -0.45, 0.7, 0.2); crate(G, S, rng, 2.5, 0.3, -0.4, 0.8, -0.3);
    o.out.push([2, rng.range(-2.4, 2.4), 0.5, -0.5]);
  } else if (k === 3) {     // the chai stall: a painted counter, a row of kettles steaming, pots on the shelves
    S({ tile: -3 }); G.quad([-3.35, y0, -1.4], [3.35, y0, -1.4], [3.35, y1, -1.4], [-3.35, y1, -1.4]);
    for (const sy of [1.9, 2.65]) { S({ tile: -1, tint: [0.08, 0.05, 0.03] }); G.box(0, sy, -1.2, 6.4, 0.07, 0.4, 'YZy'); for (let i = 0; i < 7; i++) pot(G, S, rng, -2.7 + i * 0.9 + (sy > 2 ? 0.4 : 0), sy + 0.04, -1.15, J, 1.2); }
    S({ tile: -3 }); G.box(0, 0.75, 0.5, 5.4, 0.9, 0.7, 'xXY');
    for (let i = 0; i < 5; i++) { S({ tile: mot() }); G.panel([-2.7 + i * 1.08, 0.32, 0.85], X1, Y1, Z1, 1.02, 0.86, 0.05, 0.05); }
    for (let i = 0; i < 5; i++) { const kx = -2.1 + i * 1.05; kettle(G, S, kx, 1.2, 0.5, i % 2 ? J.gold : J.white); o.out.push([1, kx, 1.72, 0.5]); }
    o.out.push([2, rng.range(-2, 2), 0.42, 0.1]);
  } else {                  // double doors: a pair of great eyes (or peacocks) facing the road
    const e = pickTile(rng, rng.pick([TL.eye, TL.eye, TL.peacock, TL.fish]));
    S({ tile: e }); G.panel([-3.3, 0.36, 0.03], X1, Y1, Z1, 3.08, 3.08, 0.1, 0.08);
    S({ tile: e }); G.panel([0.22, 0.36, 0.03], X1, Y1, Z1, 3.08, 3.08, 0.1, 0.08, [1, 0, 0, 1]);
    S({ tile: -2, tint: J.gold }); G.quad([-0.1, y0, 0.06], [0.1, y0, 0.06], [0.1, y1, 0.06], [-0.1, y1, 0.06], [0, 0, 0.2, 3]);
  }
  yield;
  if (o.awning) {           // scalloped awning with a tape fringe that drips and flutters
    const c1 = J.jew[rng.int(0, 3)], c2 = rng.chance(0.5) ? J.white : J.jew[rng.int(0, 3)], str = rng.chance(0.35);
    for (let i = 0; i < 6; i++) {
      const xa = -3.6 + i * 1.2; S(str ? { tile: TL.stripes } : { tile: -2, tint: i % 2 ? c1 : c2 });
      G.quad([xa, 3.72, 1.45], [xa + 1.2, 3.72, 1.45], [xa + 1.2, 4.32, 0.1], [xa, 4.32, 0.1], [0, 0, 1.2, 1.4]);
    }
    for (let i = 0; i < 14; i++) pennant(G, S, -3.34 + i * 0.514, 3.72, 1.45, 0.25, 0.4, J.jew[(i + o.i) % 4], rng() * TAU);
    if (rng.chance(0.6)) for (let i = 0; i < 4; i++) { const px = rng.range(-3, 3), py = rng.range(2.7, 3.2); ribbon(G, S, [px, py + 0.3, 1.1], [px, 3.9, 1.1], 0.012, -1, [0.3, 0.3, 0.3]); pot(G, S, rng, px, py, 1.1, J, 1.1); }
  }
  yield;
  if (two) {
    S({ tile: -1, tint: wall }); G.quad([-hw, H1, 0], [hw, H1, 0], [hw, H, 0], [-hw, H, 0]);
    for (let i = 0; i < 3; i++) { S({ tile: mot() }); G.panel([-3.25 + i * 2.4, 5.9, 0], X1, Y1, Z1, 1.7, 1.7, 0.08, 0.06); }
    for (const wx of [-1.2, 1.2]) {
      S({ tile: -3, tint: [0.7, 0.9, 1.6] }); G.quad([wx - 0.28, 5.95, 0.02], [wx + 0.28, 5.95, 0.02], [wx + 0.28, 7.55, 0.02], [wx - 0.28, 7.55, 0.02]);
      S({ tile: -2, tint: J.gold }); G.quad([wx - 0.34, 7.55, 0.03], [wx + 0.34, 7.55, 0.03], [wx + 0.34, 7.64, 0.03], [wx - 0.34, 7.64, 0.03], [0, 0, 0.6, 0.08]);
    }
    S({ tile: fld() }); G.quad([-hw, 7.85, 0.02], [hw, 7.85, 0.02], [hw, H, 0.02], [-hw, H, 0.02], [0, 0.2, 9, 0.8]);
    S({ tile: -3 }); G.box(0, 4.5, 0.55, 6.6, 0.14, 1.1, 'XxyZ');
    S({ tile: fld() }); G.quad([-3.3, 4.57, 1.1], [3.3, 4.57, 1.1], [3.3, 5.4, 1.1], [-3.3, 5.4, 1.1], [0, 0.1, 7, 0.9]);
    S({ tile: -2, tint: J.white }); G.quad([-3.3, 5.4, 1.1], [3.3, 5.4, 1.1], [3.3, 5.47, 1.1], [-3.3, 5.47, 1.1], [0, 0, 8, 0.1]);
    if (rng.chance(0.6)) {  // laundry on a line
      const ly = 7.1; ribbon(G, S, [-3.2, ly, 1.0], [3.2, ly, 1.0], 0.015, -1, [0.4, 0.4, 0.4]);
      let cx = -3.0; while (cx < 2.3) { const w = rng.range(0.55, 0.95), d = rng.range(0.8, 1.35); cloth(G, S, cx, cx + w, ly - d, ly, 1.0, rng.chance(0.25) ? TL.stripes : -1, paint(), rng() * TAU, 0.7); cx += w + rng.range(0.1, 0.5); }
    }
    for (let i = 0; i < 10; i++) { S({ tile: -2, tint: J.jew[(i + o.i) % 4] }); G.tri([-hw + i * 0.75, H, 0.02], [-hw + (i + 1) * 0.75, H, 0.02], [-hw + (i + 0.5) * 0.75, H + 0.62, 0.02], [0, 0], [0.3, 0], [0.15, 0.3]); }
  } else {
    S({ tile: fld() }); G.quad([-hw, H1, 0.02], [hw, H1, 0.02], [hw, 5.0, 0.02], [-hw, 5.0, 0.02], [0, 0.15, 8, 0.85]);
    S({ tile: -3 }); G.box(0, 6.15, -0.12, 2.8, 2.3, 0.3, 'xXzY');
    S({ tile: pickTile(rng, rng.pick([TL.peacock, TL.sun, TL.heart, TL.flower, TL.eye])) }); G.panel([-1.3, 5.0, 0.04], X1, Y1, Z1, 2.6, 2.3, 0.1, 0.08);
    S({ tile: -2, tint: J.jew[rng.int(0, 3)] }); G.tri([1.4, 5.0, 0.03], [3.0, 5.0, 0.03], [1.4, 6.6, 0.03], [0, 0], [0.5, 0], [0, 0.5]); G.tri([-3.0, 5.0, 0.03], [-1.4, 5.0, 0.03], [-1.4, 6.6, 0.03], [0, 0], [0.5, 0], [0.5, 0.5]);
    for (const sx of [-1, 1]) { S({ tile: -2, tint: J.gold }); G.lathe(sx * 3.45, 5.0, 0.1, [[0.16, 0], [0.3, 0.3], [0.14, 0.75], [0.05, 1.0], [0, 1.4]], 6, 0.5); }
    S({ tile: TL.bands }); G.lathe(rng.range(-2.5, 2.5), H1, -2.6, [[0.7, 0], [0.7, 1.3], [0.2, 1.5]], 8, 3);
  }
  yield;
  // the apron: crates, drums, tyres, charpoys, motorbikes
  const slots = rng.shuffle([-2.6, -0.9, 0.8, 2.5]), nProps = Math.min(4, Math.max(1, Math.round(o.props + rng() - 0.5)));
  for (let i = 0; i < nProps; i++) {
    const px = slots[i] + rng.range(-0.3, 0.3), what = rng.int(0, 5);
    if (k === 3 && Math.abs(px) < 2.9 && what !== 4) continue;
    if (what === 0) { cratePile(G, S, rng, px, 0.62, 0.56); if (rng.chance(0.3)) o.out.push([3, px, 1.9, 0.62]); }
    else if (what === 1) { drum(G, S, rng, px - 0.36, 0.6, J); drum(G, S, rng, px + 0.36, 0.72, J); if (rng.chance(0.5)) drum(G, S, rng, px, 1.25, J); }
    else if (what === 2) tyres(G, S, rng, px, 0.75, J);
    else if (what === 3) charpoy(G, S, rng, px, 0.85, (rng() - 0.5) * 0.25);
    else if (o.bikes.n > 0) { o.bikes.n--; bike(G, S, rng, J, px, 1.25, (rng.chance(0.5) ? 0 : Math.PI) + (rng() - 0.5) * 0.4); }
    else drum(G, S, rng, px, 0.7, J);
  }
}

export default {
  id: 'chamak-road',
  name: 'The Chamak Road',
  category: 'city',
  weirdness: 0.3,
  media: ['open'],
  async build(ctx) {
    const rng = ctx.rng, detail = (ctx.quality && ctx.quality.detail) || 1, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------------------------------------------------------------- the look of this visit
    const lr = rng.fork('look');
    const hourPick = lr.pick(['night', 'night', 'night', 'dusk', 'dusk', 'predawn']);
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'predawn' : (vary.hour === 'day' || vary.hour === 'golden') ? 'dusk' : hourPick;
    const weather = lr.pick(['rain', 'rain', 'rain', 'dry', 'snow', 'mist']);
    const season = lr.pick(['green', 'green', 'blossom', 'autumn']);
    const rare = !!vary.rare, autumn = season === 'autumn', blossom = season === 'blossom';
    const SK = {
      night: { zen: '#0b1030', mid: '#121a46', hor: '#1f2a62', glow: '#4c3874', scatter: 1.15, stars: 1.0, milky: 0.5, fill: 1.0, glowK: 0.9 },
      dusk: { zen: '#141a4c', mid: '#272b6c', hor: '#473d84', glow: '#8c5c9e', scatter: 1.3, stars: 0.4, milky: 0.12, fill: 1.9, glowK: 1.5 },
      predawn: { zen: '#0a1232', mid: '#142050', hor: '#25356a', glow: '#3e4c88', scatter: 0.6, stars: 0.8, milky: 0.35, fill: 1.25, glowK: 0.6 },
    }[hour];
    const wet = weather === 'dry' ? 0.06 : weather === 'snow' ? 0.3 : 1;

    // ---------------------------------------------------------------- path: gorge road, bend, bridge
    const ra = [0, 0, 0], pts = [];
    // through the last 60 m of the bazaar the cab keeps to the left of the street: a truck stands in the right-hand lane there
    for (const [s, L] of [[0, 0], [40, 0], [90, 0], [150, 0], [210, 0], [250, -1.4], [280, -2.2], [300, -2.2]]) { roadAt(s, L, ra); pts.push([ra[0], 3, ra[1]]); }
    roadAt(312, -1.4, ra); const liftX = ra[0], liftZ = ra[1];
    // at the bend the cab leaves the road on the up-gorge side and climbs: over the causeway and under both backstays, round
    // the near tower's left flank, along the first quarter of the span 30 m out and 30 m up (the whole river of jewels below
    // on the right), then in over the left main cable (9 m clear of it, at z = 106) and down between the hanger planes: at
    // crown height beside the convoy by z = 40, on the free lane for the last trucks, the empty deck and the arch
    for (const q of [[liftX, 3.2, liftZ], [-17.5, 14, 222], [-28, 23, 193], [-32, 28, 162], [-27, 30, 138], [-15, 28.5, 120], [-6, 25.5, 104], [-2.8, 17, 76], [-2.4, 10, 46],
      [-2.5, 6.5, 12], [-2.7, 4.6, -30], [-2.7, 3.5, -70], [-1.9, 3.1, -105], [0, 3, -140], [0, 3, -175], [0, 3, -HALF]]) pts.push(q);
    await ctx.yield();      // kit: makePath (one call, a yield before and after)
    const path = makePath(pts);
    await ctx.yield();

    // ---------------------------------------------------------------- the headlights (shared by every shader) and the hero
    const beam = {
      uEye: { value: new THREE.Vector3(pts[0][0], 3, pts[0][2]) },
      uBeamPos: { value: [new THREE.Vector3(pts[0][0] - 1, 1.6, pts[0][2]), new THREE.Vector3(pts[0][0] + 1, 1.6, pts[0][2])] },
      uBeamDir: { value: new THREE.Vector3(TX, 0, TZ) }, uBeamGain: { value: 1.15 },
      uBeamLong: { value: new THREE.Vector4(Math.cos(22 * DEG), Math.cos(7 * DEG), 115, 160) },
      uBeamFlood: { value: new THREE.Vector4(Math.cos(72 * DEG), Math.cos(46 * DEG), 42, 0.85) },
    };
    const glowDir = new THREE.Vector3(TX, 0.07, TZ).normalize();
    const parked = [];
    for (const s of [140.6, 146.0]) { roadAt(s, -10.6, ra); parked.push({ x: ra[0], y: 0, z: ra[1], heading: Math.atan2(RX, RZ) }); }
    for (const s of [313.2, 318.6]) { roadAt(s, -10.8, ra); const phi = ra[2]; parked.push({ x: ra[0], y: 0, z: ra[1], heading: Math.atan2(Math.cos(phi), -Math.sin(phi)) }); }
    // one more stands in the right-hand lane at the bazaar's far end, nose toward us, as if the convoy's head had stopped for tea
    roadAt(300, 1.6, ra); parked.push({ x: ra[0], y: 0, z: ra[1], heading: BEND });
    const bazaarTruck = new THREE.Vector3(); roadAt(296.4, 1.6, ra); bazaarTruck.set(ra[0], 5.4, ra[1]);
    const hero = await buildHero(ctx, { palette: PALETTE, beam, afterglowDir: glowDir, parked, world: true });
    scene.add(hero.object);
    const U = hero.uniforms, kit = hero.kit, mats = kit.mats;
    U.uTapeGain.value = 2.7;
    U.uSkyFill.value.multiplyScalar(SK.fill);
    U.uGlowCol.value.copy(V3(SK.glow, SK.glowK));
    U.uSkyTop.value.copy(V3(SK.zen)); U.uSkyLow.value.copy(V3(SK.hor));
    U.uWetK.value = wet; U.uMirrorK.value = weather === 'dry' ? 0 : weather === 'snow' ? 0.35 : 1; U.uSnowK.value = weather === 'snow' ? 1 : 0; U.uDryK.value = weather === 'dry' ? 1 : 0;
    // the exit portal for the wet deck's mirror: its seat is the path's last point, it faces back along the path's last leg, and its
    // radius and light are the portal's own (one source with the world's portal below: a moved exit takes its streak with it)
    const PORTAL = { radius: 7, color: '#ffdc9a', glow: 1 };
    { const pe = pts[pts.length - 1], pb = pts[pts.length - 2], lx = pb[0] - pe[0], lz = pb[2] - pe[2], ll = Math.hypot(lx, lz) || 1;
      U.uPortalPos.value.set(pe[0], pe[1], pe[2], PORTAL.radius); U.uPortalN.value.set(lx / ll, 0, lz / ll); U.uPortalCol.value.copy(V3(PORTAL.color, PORTAL.glow)); }
    const beamU = { uEye: U.uEye, uBeamPos: U.uBeamPos, uBeamDir: U.uBeamDir, uBeamGain: U.uBeamGain, uBeamLong: U.uBeamLong, uBeamFlood: U.uBeamFlood, uSkyFill: U.uSkyFill, uGlowCol: U.uGlowCol, uGlowDir: U.uGlowDir };
    const timeU = U.uTime, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const J = {
      red: C3(PALETTE[2]), green: C3(PALETTE[3]), gold: C3(PALETTE[4]), blue: C3(PALETTE[5]), white: C3(PALETTE[6], 0.9),
      jew: [C3(PALETTE[2]), C3(PALETTE[4]), C3(PALETTE[3]), C3(PALETTE[5]), C3(PALETTE[6], 0.9)],
      walls: [C3('#0d2a6e', 0.5), C3('#0a5a2a', 0.5), C3('#7a1020', 0.55), C3('#5a3a08', 0.6), C3('#1a1c3a', 0.8), C3('#4a0f4a', 0.5)],
      paints: [C3('#d8d2c0', 0.8), C3(PALETTE[2], 0.8), C3(PALETTE[4], 0.85), C3('#2a8ad8', 0.8), C3('#e86a9a', 0.8), C3(PALETTE[3], 0.8), C3('#f08a1a', 0.85)],
      body: C3(lr.pick(['#8a1020', '#0d2f7a', '#0a5a2a']), 0.6),
    };
    await ctx.yield();

    // ---------------------------------------------------------------- sky, fog, far ridges, heat lightning
    const moon = hour === 'predawn' ? [{ elevation: 11, azimuth: 31, size: 1.5, phase: 0.08, phaseAngle: 200, intensity: 1.2, dark: 0.02, glow: 0.22, glowColor: '#9db8ff' }] : [];
    const skyRng = rng.fork('sky');
    await ctx.yield();
    const sky = makeSky({       // kit: makeSky (one call). Not baked: a bake compiles and draws its own shader here, while the previous world is on screen
      rng: skyRng, preset: 'night', zenith: SK.zen, mid: SK.mid, horizon: SK.hor, ground: '#05060f', horizonPow: 3.2,
      scatterColor: SK.glow, scatter: SK.scatter, scatterPow: 7, scatterHigh: 0.03, scatterFall: 8,
      sunElevation: -5, sunAzimuth: -35, sunIntensity: 0, sunGlow: 0, key: 'sun', lightColor: SK.glow, lightIntensity: 0.5, lightElevationMin: 4,
      stars: SK.stars, twinkle: 0.55, starDensity: 0.85, milkyWay: weather === 'dry' ? 1 : SK.milky, bodies: moon,
      clouds: { coverage: 0.3 + 0.12 * lr(), softness: 0.42, lit: new THREE.Color(SK.hor).multiplyScalar(0.9), shade: '#03040b', opacity: 0.93, silver: 0.15, absorb: 2.2 },
      lightning: 0,
    });
    await ctx.yield();
    const valleySeed = Math.floor(lr() * 1e9);
    scene.add(sky.object);
    const fogCol = new THREE.Color(SK.hor).multiplyScalar(0.75);
    scene.fog = new THREE.FogExp2(fogCol, weather === 'mist' ? 0.0012 : weather === 'snow' ? 0.0009 : 0.0007);      // thin enough that both towers stand as silhouettes from the entry
    const moonDir = new THREE.Vector3(Math.sin(31 * DEG) * Math.cos(11 * DEG), Math.sin(11 * DEG), -Math.cos(31 * DEG) * Math.cos(11 * DEG));
    const ridgeRng = rng.fork('ridges');
    await ctx.yield();      // kit: makeHorizonRidges (one call, a yield before and after)
    const ridges = T.makeHorizonRidges({
      rng: ridgeRng, layers: 4, radius: [1700, 3400], height: [260, 1250], base: -140, jagged: 0.55, coverage: 0.7,
      colorNear: '#0a0d24', haze: fogCol, hazeNear: 0.06, hazeFar: 0.66, footHaze: 0.8,
      // snow that takes the last light square from the bridge's left, the afterglow's side of the span, 25 degrees up (the middle
      // of its wash), so every range the flight shows has a lit flank next to the afterglow and a shaded one (the old moon's before dawn)
      sunDir: hour === 'predawn' ? moonDir : new THREE.Vector3(-1, 0.466, 0).normalize(), sunColor: hour === 'predawn' ? '#c8d6ff' : hour === 'dusk' ? '#e0b4e8' : '#b9c2ff',
      // pale snow on every flank: the shaded side holds what live's mean facet held (the ambient carries 0.45 of the snow
      // light), the lit side about a half more; before dawn the old moon's own light as it was
      sunIntensity: hour === 'predawn' ? 0.9 : hour === 'dusk' ? 0.35 : 0.3,
      ambient: hour === 'dusk' ? '#ae94d7' : hour === 'predawn' ? '#434e8c' : '#858ed0', snow: '#dfe6ff', snowLine: 0.45, rim: 0.3,
    });
    await ctx.yield();
    scene.add(ridges.object);
    const flashDir = new THREE.Vector3(Math.sin(30 * DEG), 0, -Math.cos(30 * DEG));
    const flashU = { uFlash: { value: 0 }, uFlashCol: { value: new THREE.Vector3(0.42, 0.36, 0.8) } };
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(3400, 900), new THREE.ShaderMaterial({ uniforms: flashU, vertexShader: FLASH_VERT, fragmentShader: FLASH_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    flash.frustumCulled = false; flash.rotation.y = -30 * DEG; flash.renderOrder = 1; scene.add(flash);
    const afterglow = new THREE.Mesh(new THREE.PlaneGeometry(1500, 480), new THREE.ShaderMaterial({ uniforms: { uGlowC: { value: V3(SK.glow, hour === 'dusk' ? 1.1 : hour === 'predawn' ? 1.5 : 1.9) } },
      vertexShader: FLASH_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    afterglow.position.set(BX + TX * 950 + RX * 280, 150, BZ + TZ * 950 + RZ * 280); afterglow.rotation.y = Math.atan2(-TX, -TZ);
    afterglow.frustumCulled = false; afterglow.renderOrder = 1; afterglow.name = 'afterglow'; scene.add(afterglow);
    await ctx.yield();

    // ---------------------------------------------------------------- the gorge
    const height = makeHeight(ctx.noise);
    const rockU = { uSnowK: U.uSnowK, uWetK: U.uWetK, uTime: timeU, uHi: { value: 0 }, uBank: { value: new THREE.Vector3(RX, RZ, -(BX * RX + BZ * RZ)) }, uFlashDir: { value: flashDir.clone().setY(0.35).normalize() }, uFlash: flashU.uFlash, uRockA: { value: V3('#74708c') }, uRockB: { value: V3('#3b3a5c') } };      // slate with the night's violet in it: in the beam the cliff belongs to the palette
    const rockMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...beamU, ...rockU }, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true });
    const grey = new THREE.Color(0.333, 0.333, 0.333);
    // distance to the route, worked out from the road's own geometry (gorge straight, the bend's arc, the bridge): the
    // terrain's level of detail follows it without the kit sampling the path into a distance field first
    const routeDist = (x, z) => {
      const dx = x - BX, dz = z - BZ, a = dx * TX + dz * TZ, L = dx * RX + dz * RZ;
      let d = a < -S_BEND ? Math.hypot(a + S_BEND, L) : a <= 0 ? Math.abs(L) : 1e9;
      const cx = RB - x, cz = z - HALF, phi = Math.atan2(cz, cx);
      if (phi >= 0 && phi <= BEND) d = Math.min(d, Math.abs(Math.hypot(cx, cz) - RB));
      return Math.min(d, Math.hypot(x, z - HALF), Math.hypot(x, z + HALF));      // the bridge itself asks for no detail: 90 m under it is river bed
    };
    // The land is thirteen strips across the route that meet on the same 20 m grid (their coarsest cell), the small strips
    // behind the entry first: every step of the kit's mesher works on two to six thousand vertices, so none holds the
    // page for long. The seams lie behind the entry, in the bazaar's mouth, behind the stalls, on the bend and under the
    // bridge; the gorge wall that the beams rake (z 420 to 540) is one piece. The outer bounds are the ones the far
    // skyline was composed with; only the ground more than 150 m behind the entry, which no frame shows, is gone.
    // Each strip: [z0, z1, triangles]; near the route the land is as finely cut as it was in three pieces.
    const lands = [];
    const tr0 = rng.fork('terrain');
    const x0 = -560, x1 = 780, strips = [[600, 660, 2000], [540, 600, 4000], [420, 540, 11000], [380, 420, 4500], [340, 380, 4500], [300, 340, 4500], [240, 300, 5000],
      [120, 240, 7600], [0, 120, 4000], [-160, 0, 4000], [-300, -160, 9000], [-520, -300, 5000], [-760, -520, 2500]];
    for (const [z0, z1, tris] of strips) {
      const landRng = tr0.fork('z' + z0);
      await ctx.yield();      // kit: makeTerrainAsync (one call, a yield before and after)
      const land = await T.makeTerrainAsync({
        rng: landRng, noise: ctx.noise, focus: routeDist, corridor: false, height, bounds: [x0, z0, x1, z1], cell: 2.5, near: 26, levels: 3,
        maxTriangles: tris, materialInstance: rockMat, detailTexture: kit.tex.texB, color: () => grey, skirt: 30, ao: 0,
      }, ctx.yield, 2);
      await ctx.yield();
      scene.add(land.object); lands.push([z0, z1, land]);
    }
    const terrain = { surfaceAt: (x, z) => { for (const l of lands) if (z >= l[0] && z < l[1]) return l[2].surfaceAt(x, z); return height(x, z); } };
    const rpts = [], riverRng = rng.fork('river');
    // the Indus as a braid: the main channel swings from bank to bank across the 170 m gravel floor, a side channel swings against it
    const rpts2 = [];
    for (let k = 0; k <= 24; k++) {
      // the side channel keeps to the near bank's side: it leaves the main channel and joins it again, and never crosses it
      const a = 1500 - k * 117.5, w1 = 141.3 + 40 * Math.sin(k * 0.82 + 0.6), w2 = 141.3 - 62 - 20 * Math.sin(k * 0.82 + 0.9);
      rpts.push([BX + TX * a + RX * w1, -90, BZ + TZ * a + RZ * w1]); rpts2.push([BX + TX * a + RX * w2, -90.4, BZ + TZ * a + RZ * w2]);
    }
    await ctx.yield();      // kit: waterLight, makeRiver (a yield before and after each)
    // the river takes its sheen from the afterglow, so the braid is a pale ribbon from the air
    const wl = Water.waterLight(sky, { sunDir: new THREE.Vector3(TX, 0.3, TZ).normalize(), sunColor: SK.glow, sunIntensity: 1.1 * SK.glowK, glint: 0.7, ambient: hour === 'dusk' ? '#7c74a8' : '#6c76a4' });
    await ctx.yield();
    const river = Water.makeRiver({ rng: riverRng, light: wl, points: rpts, width: (t) => 78 + 22 * Math.sin(t * 31 + 1), speed: 3.6, foam: 0.6, bankFoam: 0.7, deep: '#3c4a8c', shallow: '#b8c4ec', opacity: 0.92, segments: 150, across: 8, bow: 0.01, bankFade: 12 });
    await ctx.yield();
    const river2 = Water.makeRiver({ rng: riverRng, light: wl, points: rpts2, width: (t) => 24 + 9 * Math.sin(t * 23), speed: 3.0, foam: 0.5, bankFoam: 0.6, deep: '#46549a', shallow: '#b8c4ec', opacity: 0.9, segments: 150, across: 4, bow: 0.01, bankFade: 6 });
    await ctx.yield();
    scene.add(river.object, river2.object);
    // the convoy's colours in the river (see WAKE_FRAG): one sheet 0.4 m over the water under the span
    const wakeU = { uEye: U.uEye, uTime: timeU, uAmt: { value: 0 }, uTravel: { value: 0 }, uFogD: { value: scene.fog.density },
      uBankT: { value: new THREE.Vector3(TX, TZ, -(BX * TX + BZ * TZ)) }, uBankR: { value: new THREE.Vector3(RX, RZ, -(BX * RX + BZ * RZ)) },
      uJ0: { value: V3(PALETTE[2]) }, uJ1: { value: V3(PALETTE[4]) }, uJ2: { value: V3(PALETTE[3]) }, uJ3: { value: V3(PALETTE[5], 1.3) }, uJ4: { value: V3(PALETTE[6], 0.7) } };
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(176, 440), new THREE.ShaderMaterial({ uniforms: wakeU, vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    wake.rotation.x = -Math.PI / 2; wake.position.set(0, -89.6, 0); wake.frustumCulled = false; wake.renderOrder = 2; wake.name = 'river-wake'; scene.add(wake);
    const wakeGain = weather === 'dry' ? 0.75 : weather === 'mist' ? 0.6 : 1;
    const mistR = rng.fork('mist'), mistPos = [], high = weather === 'mist';
    for (let i = 0; i < (high ? 70 : 44); i++) {
      const a = mistR.range(-260, 760), L = 141 + mistR.range(-95, 95);
      mistPos.push([BX + TX * a + RX * L, high ? mistR.range(-22, -7) : mistR.range(-84, -52), BZ + TZ * a + RZ * L]);
    }
    const mistCol = new THREE.Color(SK.hor).lerp(new THREE.Color('#8a94d0'), high ? 0.3 : 0.18);
    await ctx.yield();      // kit: makeMist (one call, a yield before and after)
    const mist = fx.makeMist({ rng: mistR, time: timeU, positions: mistPos, size: high ? [70, 150] : [50, 120], color: mistCol, opacity: high ? 0.42 : 0.26, flatten: 0.4 });
    await ctx.yield();
    scene.add(mist.object);

    // ---------------------------------------------------------------- the wet road from the entry to the bridge deck
    {
      const pos = [], uv = [], idx = []; let n = 0;
      for (let s = -84; s <= 378.01; s += 3) {
        const pinch = 0.6 * sm(312, 326, s), wlft = 7.2 - pinch, wr = lerp(4.55, 7.2, sm(138, 152, s)) - pinch;
        roadAt(s, -wlft, ra); pos.push(ra[0], -0.02, ra[1]); uv.push(-wlft, s);
        roadAt(s, wr, ra); pos.push(ra[0], -0.02, ra[1]); uv.push(wr, s);
        if (n > 0) { const a = (n - 1) * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
        n++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const road = new THREE.Mesh(g, mats.roadPath); road.frustumCulled = false; road.name = 'road'; scene.add(road);
    }
    const at = (G, s, L, y = 0, turn = 0) => { roadAt(s, L, ra); G.at(ra[0], y, ra[1], ra[2] + turn); };
    const trunk = (G, S, x, y, z, h) => {
      S({ tile: TL.bands, tint: [0.55, 0.55, 0.55] }); G.lathe(x, y, z, [[0.31, 0], [0.27, 2.2]], 7, 2);
      S({ tile: -1, tint: [0.035, 0.03, 0.028] }); G.lathe(x, y + 2.2, z, [[0.27, 0], [0.2, h - 2.2]], 7, 1);
    };
    const stud = (G, S, s, i) => { at(G, s, 1.8); S({ tile: -2, tint: i % 2 ? J.gold : J.white }); G.quad([-0.11, 0, 0], [0.11, 0, 0], [0.11, 0.1, -0.07], [-0.11, 0.1, -0.07], [0, 0, 0.2, 0.1]); G.pop(); };
    const poplars = [], apricots = [], mirrors = [], spots = [];    // spots: [what, x, y, z] for the sprites (1 steam, 2 dog, 3 cat, 4 ibex)
    // an accumulator's conversion to typed arrays, one attribute at a time with the page handed back in between
    const geoOf = async (G, el) => { const it = G.geometrySteps(el); let r; await ctx.yield(); while (!(r = it.next()).done) await ctx.yield(); return r.value; };      // el: a mirrored buffer carries its elements' runs
    const addMesh = async (G, mirror, cx, cz, mirrorMat = mats.mirrorOpen) => {
      const geo = await geoOf(G, mirror), mesh = new THREE.Mesh(geo, mats.jewel); scene.add(mesh);
      if (mirror) { const mm = new THREE.Mesh(geo, mirrorMat); mm.frustumCulled = false; mm.renderOrder = 3; scene.add(mm); mirrors.push({ mesh: mm, x: cx, z: cz }); }
      return mesh;
    };

    // ---------------------------------------------------------------- gorge road: kerb, marker posts, studs, the shelter, painted eyes
    const gr = rng.fork('gorge'), gr0 = gr;
    const GG = kit.makeAcc(), SG = SET(GG);
    // kerb, posts and studs begin 84 m behind the entry, where the road ribbon does: seen through the previous portal the
    // near ground is dressed to the foot of the opening (the first 15 steps are new; the block at s = -40 keeps its colour)
    for (let s = -83.5, i = 1; s < 147; s += 2.9, i++) {
      at(GG, s, 3.82); SG({ tile: -2, tint: i % 2 ? J.red : J.white }); GG.box(0, 0.25, 0, 0.62, 0.5, 2.4, 'xXzZ', [0, 0, 1.2, 0.25]);
      SG({ tile: TL.checks }); GG.quad([-0.31, 0.5, 1.2], [0.31, 0.5, 1.2], [0.31, 0.5, -1.2], [-0.31, 0.5, -1.2], [0, 0, 1, 4]); GG.pop();
      if (i % 12 === 0) await ctx.yield();
    }
    await ctx.yield();
    for (let s = -76, i = 0; s < 150; s += 10, i++) {
      at(GG, s, -6.8); SG({ tile: TL.bands }); GG.box(0, 0.55, 0, 0.18, 1.1, 0.18, 'xXzZ', [0, 0, 1, 1.5]);
      SG({ tile: -2, tint: i % 2 ? J.red : J.gold }); GG.quad([0, 1.1, 0.02], [0.17, 1.3, 0.02], [0, 1.5, 0.02], [-0.17, 1.3, 0.02], [0, 0, 0.2, 0.2]); GG.pop();
    }
    for (let s = -84, i = 0; s < 150; s += 6, i++) stud(GG, SG, s, i);
    for (const s of [22, 37, 55, 73, 134]) {      // flag poles at the cliff foot, each with a string of pennants running back down to a stake (no random draws)
      at(GG, s, 0);
      SG({ tile: TL.bands, tint: [0.7, 0.7, 0.7] }); GG.lathe(-6.45, 0, 0, [[0.09, 0], [0.06, 5.4]], 5, 2);
      SG({ tile: -2, tint: J.gold }); GG.lathe(-6.45, 5.4, 0, [[0.07, 0], [0.16, 0.14], [0.05, 0.3], [0, 0.55]], 5, 0.3);
      ribbon(GG, SG, [-6.45, 5.3, 0], [-6.45, 0.7, 7.6], 0.015, -1, [0.3, 0.3, 0.3]);
      for (let i = 0; i < 9; i++) { const t = (i + 0.7) / 9.6; pennant(GG, SG, -6.45, 5.3 - 4.6 * t - 0.02, 7.6 * t, 0.3, 0.72, J.jew[(i + Math.round(s)) % 5], (s * 0.37 + i * 1.3) % TAU, Z1); }
      GG.pop();
    }
    await ctx.yield();
    // a low mosaic wall along the cliff foot (it parts round the eye boulders), so the left of the road is a line of
    // jewels like the kerb on the right; and two strings of bunting across the road before the shelter (no random draws)
    for (let s = -82.6, i = 0; s < 121; s += 2.62, i++) {
      let gap = false; for (const e of [26, 45, 63, 82]) if (Math.abs(s - e) < 4.5) gap = true;
      if (gap) continue;
      at(GG, s, -7.32);
      SG({ tile: FIELDS[(i >> 2) % FIELDS.length], tint: [0.85, 0.85, 0.85] }); GG.box(0, 0.52, 0, 0.3, 0.9, 2.62, 'X', [0, 0.05, 2.4, 0.95]);
      SG({ tile: TL.checks }); GG.box(0, 0.035, 0, 0.44, 0.07, 2.62, 'X', [0, 0, 5, 0.2]);
      SG({ tile: -2, tint: i % 2 ? J.gold : J.white }); GG.quad([-0.17, 0.97, 1.31], [0.17, 0.97, 1.31], [0.17, 0.97, -1.31], [-0.17, 0.97, -1.31], [0, 0, 0.3, 2]);
      if (i % 4 === 0) { SG({ tile: -2, tint: J.jew[(i >> 2) % 4] }); GG.lathe(0, 0.97, 1.31, [[0.13, 0], [0.19, 0.16], [0.07, 0.34], [0, 0.58]], 5, 0.3); }
      GG.pop();
      if (i % 12 === 11) await ctx.yield();
    }
    await ctx.yield();
    for (const s of [58, 76]) {
      at(GG, s, 0);
      const xa = -6.95, xw = 11.45, Y = (t) => 7.55 - 0.8 * (1 - (2 * t - 1) * (2 * t - 1));
      for (const px of [xa, xa + xw]) {
        SG({ tile: TL.bands, tint: [0.7, 0.7, 0.7] }); GG.lathe(px, -0.3, 0, [[0.1, 0], [0.06, 7.9]], 5, 3);
        SG({ tile: -2, tint: J.gold }); GG.lathe(px, 7.6, 0, [[0.07, 0], [0.16, 0.14], [0.05, 0.3], [0, 0.55]], 5, 0.3);
      }
      for (let k = 0; k < 10; k++) { const t0 = k / 10, t1 = (k + 1) / 10; ribbon(GG, SG, [xa + xw * t0, Y(t0), 0], [xa + xw * t1, Y(t1), 0], 0.02, -1, [0.35, 0.35, 0.35]); }
      for (let k = 0; k < 15; k++) { const t = (k + 0.5) / 15; pennant(GG, SG, xa + xw * t, Y(t) - 0.02, 0, 0.32, 0.85, J.jew[(k + Math.round(s)) % 5], (s * 0.41 + k * 1.7) % TAU); }
      GG.pop();
    }
    await ctx.yield();
    for (let k = 0; k < 5; k++) {       // the rockfall shelter: five painted ribs under a dark roof
      at(GG, 94 + k * 6, 0);
      SG({ tile: TL.chevrons, tint: [0.6, 0.6, 0.6] }); GG.box(-6.05, 3.3, 0, 0.5, 6.6, 0.55, 'xXzZ', [0, 0, 1, 7]); GG.box(4.3, 3.3, 0, 0.5, 6.6, 0.55, 'xXzZ', [0, 0, 1, 7]);
      SG({ tile: FIELDS[k % FIELDS.length], tint: [0.6, 0.6, 0.6] }); GG.box(-0.87, 6.95, 0, 10.9, 0.7, 0.55, 'zZ', [0, 0.1, 11, 0.9]);
      SG({ tile: TL.checks, tint: [0.6, 0.6, 0.6] }); GG.quad([-6.3, 6.6, 0.28], [4.55, 6.6, 0.28], [4.55, 6.6, -0.28], [-6.3, 6.6, -0.28], [0, 0, 20, 0.5]);
      SG({ tile: pickTile(gr, k % 2 ? TL.sun : TL.eye) }); GG.panel([-0.7, 6.5, 0.28], X1, Y1, Z1, 1.4, 1.4, 0.07, 0.06);
      for (const hx of [-4.7, -3.4, 2.8]) pennant(GG, SG, hx, 6.6, 0.3, 0.22, 0.55, J.jew[(k + Math.round(hx)) & 3], gr() * TAU);
      GG.pop();
    }
    at(GG, 106, 0); SG({ tile: -3 }); GG.quad([-6.3, 7.3, 14.4], [4.55, 7.3, 14.4], [4.55, 7.3, -14.4], [-6.3, 7.3, -14.4]); GG.pop();
    for (const s of [0, 0, 42, 0, 0]) {      // none within 15 m of the entry, none in front of either tower as seen from it (0: the draws are kept, the tree is not)
      const jit = gr.range(-2, 2) * 0.5, sc = gr.range(0.9, 1.15); if (!s) continue;
      roadAt(s + jit, 6.6, ra); trunk(GG, SG, ra[0], -0.6, ra[1], 8.2); poplars.push([ra[0], -0.6, ra[1], sc]);
    }
    await ctx.yield();
    // great eyes on boulders (cut-out motifs that close as we pass), each seated on a round boulder
    const GE = kit.makeAcc(), SE = SET(GE), boulders = [];
    const eyeAt = (s, L, y, R, gr = gr0) => {
      roadAt(s, L, ra); const cx = ra[0], cz = ra[1], side = L > 0 ? 1 : -1, yaw = ra[2];
      const fwx = -Math.sin(yaw), fwz = -Math.cos(yaw), rtx = Math.cos(yaw), rtz = -Math.sin(yaw);
      let nx = -fwx * 0.82 - side * rtx * 0.5, ny = 0.25, nz = -fwz * 0.82 - side * rtz * 0.5; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let ux = nz, uz = -nx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const wx = ny * uz, wy = nz * ux - nx * uz, wz = -ny * ux, K = Math.tan(42 * DEG), N = 5;
      SE({ tile: pickTile(gr, TL.eye), kind: 7, param: gr() });
      const P = (i, j) => {
        const a = ((i / N) * 2 - 1) * K, b = ((j / N) * 2 - 1) * K; let dx = nx + ux * a + wx * b, dy = ny + wy * b, dz = nz + uz * a + wz * b; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
        return [[cx + dx * R * 1.07, y + dy * R * 1.07, cz + dz * R * 1.07], [dx, dy, dz]];
      };
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const A = P(i, j), B = P(i + 1, j), C = P(i + 1, j + 1), D = P(i, j + 1);
        GE.v(A[0], A[1], i / N, j / N); GE.v(B[0], B[1], (i + 1) / N, j / N); GE.v(C[0], C[1], (i + 1) / N, (j + 1) / N);
        GE.v(A[0], A[1], i / N, j / N); GE.v(C[0], C[1], (i + 1) / N, (j + 1) / N); GE.v(D[0], D[1], i / N, (j + 1) / N);
      }
      // a ring of scallop tape round the eye, so the boulder still carries jewel colour while the lid is shut
      SE({ tile: TL.scallops, kind: 0 });
      const NR = 24, ring = (k, a) => { const c = Math.cos(a), sn = Math.sin(a), t = (k / NR) * TAU, ca = Math.cos(t), sa = Math.sin(t); const d = [nx * c + (ux * ca + wx * sa) * sn, ny * c + wy * sa * sn, nz * c + (uz * ca + wz * sa) * sn]; return [[cx + d[0] * R * 1.07, y + d[1] * R * 1.07, cz + d[2] * R * 1.07], d]; };
      for (let k = 0; k < NR; k++) {
        const A = ring(k, 0.76), B = ring(k + 1, 0.76), C = ring(k + 1, 0.9), D = ring(k, 0.9), u0 = k * 0.4, u1 = (k + 1) * 0.4;
        GE.v(A[0], A[1], u0, 0.5); GE.v(B[0], B[1], u1, 0.5); GE.v(C[0], C[1], u1, 0.74);
        GE.v(A[0], A[1], u0, 0.5); GE.v(C[0], C[1], u1, 0.74); GE.v(D[0], D[1], u0, 0.74);
      }
      boulders.push([cx, y, cz, R, 0, nx, ny, nz]);
      return new THREE.Vector3(cx + nx * R, y + ny * R, cz + nz * R);
    };
    let firstEye = null;
    for (const s of [26, 45, 63, 82, 127]) { const R = gr.range(2.0, 2.6), e = eyeAt(s, -7.3 - 0.7 * R, 0.55 * R, R); if (s === 45) firstEye = e; await ctx.yield(); }
    for (const s of [22, 72, 122]) {      // high on the wall: seated where the cliff face reaches the height drawn for it
      const R = gr.range(2.1, 2.7), yE = gr.range(6.6, 8.2); let Lf = -9.5;
      for (; Lf > -22; Lf -= 0.5) { roadAt(s, Lf, ra); if (height(ra[0], ra[1]) >= yE - 0.2 * R) break; }
      eyeAt(s, Lf - 0.25 * R, yE, R);
      await ctx.yield();
    }
    for (const s of [30, 52, 88, 137]) { const R = gr.range(1.5, 1.9); eyeAt(s, 4.85 + 0.85 * R, 0.3 * R, R); await ctx.yield(); }
    {
      const ge = ctx.core.makeRng(valleySeed + 77);      // two great eyes higher on the wall: their own random stream, so nothing else moves
      for (const s of [50, 104]) {
        const R = ge.range(3.0, 3.5), yE = ge.range(11, 13.5); let Lf = -10;
        for (; Lf > -30; Lf -= 0.5) { roadAt(s, Lf, ra); if (height(ra[0], ra[1]) >= yE - 0.2 * R) break; }
        eyeAt(s, Lf - 0.25 * R, yE, R, ge);
        await ctx.yield();
      }
    }
    for (const s of [329, 357]) { const R = gr.range(1.6, 2.0); eyeAt(s, -8.4 - 0.4 * R, 0.4 * R, R); await ctx.yield(); }
    for (let i = 0; i < 22; i++) {      // loose rock along the cliff foot and the lip of the drop
      const left = gr.chance(0.6), R = gr.range(0.45, 1.25), s = gr.range(-30, 148);
      if ((s > 136 && left) || Math.abs(s) < 15) continue;      // nothing in the bazaar's mouth, nothing within 15 m of the entry
      roadAt(s, left ? -7.3 - R * gr.range(0.3, 1.2) : 5.0 + R * gr.range(0.6, 1.6), ra); boulders.push([ra[0], R * 0.3, ra[1], R, 1]);
    }
    await ctx.yield();
    const eyeMesh = new THREE.Mesh(await geoOf(GE), mats.cutout); eyeMesh.frustumCulled = false; scene.add(eyeMesh);
    await ctx.yield();
    {
      const dm = new THREE.Object3D(), zAxis = new THREE.Vector3(0, 0, 1), nv = new THREE.Vector3();
      for (let v = 0; v < 2; v++) {
        const list = boulders.filter((b) => b[4] === v), rk = gr.fork(v ? 'rk' : 're');
        let geo;
        await ctx.yield();      // kit: rockGeometry (one call, a yield before and after)
        if (v) geo = T.rockGeometry({ rng: rk, kind: 'boulder', radius: 1, detail: 2 });
        else { const it = eyeBoulderGeometry(ctx.noise, rk); let r; while (!(r = it.next()).done) await ctx.yield(); geo = r.value; }
        await ctx.yield();
        const im = new THREE.InstancedMesh(geo, rockMat, Math.max(1, list.length));
        list.forEach((b, i) => {
          dm.position.set(b[0], b[1], b[2]); dm.scale.setScalar(b[3]);
          if (v) dm.rotation.set(0, gr() * TAU, 0); else dm.quaternion.setFromUnitVectors(zAxis, nv.set(b[5], b[6], b[7]).normalize());      // the smooth cap turns to face where the eye looks
          dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
        });
        im.count = list.length; im.frustumCulled = false; scene.add(im);
      }
    }
    for (let i = 0; i < 8; i++) { roadAt(14 + i * 17 + gr.range(-5, 5), -(14 + gr.range(0, 9)), ra); spots.push([4, ra[0], height(ra[0], ra[1]) + 1.2, ra[1]]); }
    const tufts = [];
    for (let i = 0; i < 64; i++) {
      const left = gr.chance(0.72), sT = gr.range(16, 147), t = gr.range(0.3, 3.4), sc = Math.min(gr.range(0.55, 1.25), 0.9);
      if ((left && sT > 136) || (!left && sT < 40)) continue;
      roadAt(sT, left ? -7.6 - t : 5.15 + t * 0.5, ra); tufts.push([ra[0], terrain.surfaceAt(ra[0], ra[1]) - 0.12, ra[1], sc]);
    }
    await ctx.yield();
    await addMesh(GG, wet > 0.5, BX + TX * -240, BZ + TZ * -240, mats.mirrorGorge);      // the shelter's mirror: feet and lower ribs only, see JEWEL_FRAG
    await ctx.yield();

    // ---------------------------------------------------------------- the bazaar: two rows of 21 bays behind poplars, bunting overhead
    const br = rng.fork('bazaar'), bikes = { n: 30 }, m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
    for (const sd of [-1, 1]) {
      const kinds = br.shuffle([0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]), th = Math.atan2(-sd * RX, -sd * RZ);
      for (let c = 0; c < 3; c++) {
        const G = kit.makeAcc();
        for (let b = 0; b < 7; b++) {
          const i = c * 7 + b, s = 154.75 + 7.5 * i;
          roadAt(s, sd * 4.6, ra);
          const o = { two: br.chance(0.45), kind: kinds[i], awning: kinds[i] === 3 || br.chance(0.7), i, end: i === 0 || i === 20, small: sd > 0 && i === 20, out: [], bikes, props: 2.2 * dens };
          const bx = ra[0], bz = ra[1];
          G.at(bx, 0, bz, th);
          for (const _ of buildBay(G, br, J, o)) await ctx.yield();
          G.pop();
          m4.makeRotationY(th).setPosition(bx, 0, bz);
          for (const e of o.out) { v3.set(e[1], e[2], e[3]).applyMatrix4(m4); spots.push([e[0], v3.x, v3.y, v3.z]); }
          await ctx.yield();
        }
        roadAt(154.75 + 7.5 * (c * 7 + 3), sd * 7, ra);
        const cx = ra[0], cz = ra[1];
        await ctx.yield();
        await addMesh(G, wet > 0.5, cx, cz);
        await ctx.yield();
      }
    }
    const GS = kit.makeAcc(), SS = SET(GS);
    for (let j = 0; j <= 21; j++) {
      const s = 151 + 7.5 * j, Y = (t) => 6.9 - 0.8 * (1 - (2 * t - 1) * (2 * t - 1));
      for (const sd of [-1, 1]) {
        const sc = br.range(0.88, 1.14);
        if (sd > 0 && (j === 19 || j === 20)) poplars.push([0, 0, 0, 0]);      // where the truck stands: not planted (its draws are kept)
        else if (blossom && j % 4 === 2) { roadAt(s, sd * 4.5, ra); trunk(GS, SS, ra[0], 0, ra[1], 5.4); apricots.push([ra[0], 2.5, ra[1], 0.7 + 0.3 * (sc - 0.88)]); }      // pink crowns in the flood beam
        else { roadAt(s, sd * 3.85, ra); trunk(GS, SS, ra[0], 0, ra[1], 7.6); poplars.push([ra[0], 0, ra[1], sc]); }
      }
      at(GS, s, 0);
      const strung = j !== 19;      // no string in front of the standing truck's crown (its draws are kept)
      if (strung) for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8; ribbon(GS, SS, [-3.85 + 7.7 * t0, Y(t0), 0], [-3.85 + 7.7 * t1, Y(t1), 0], 0.02, -1, [0.35, 0.35, 0.35]); }
      for (let k = 0; k < 11; k++) { const t = (k + 0.5) / 11, ph = br() * TAU; if (strung) pennant(GS, SS, -3.85 + 7.7 * t, Y(t) - 0.02, 0, 0.3, 0.8, J.jew[(k + j) % 5], ph); }
      GS.pop();
      if (j % 3 === 0) await ctx.yield();
    }
    for (let s = 150, i = 0; s < 312; s += 6, i++) stud(GS, SS, s, i);
    for (let j = 0; j < 11; j++) { roadAt(158 + j * 14.6 + br.range(-2, 2), -19 - br.range(0, 4), ra); trunk(GS, SS, ra[0], -0.4, ra[1], 7.8); poplars.push([ra[0], -0.4, ra[1], br.range(0.95, 1.2)]); }
    for (const sd of [-1, 1]) for (let j = 0; j < 10; j++) {
      roadAt(160 + j * 15 + br.range(-3, 3), sd * (12.6 + br.range(0, 1.2)), ra);
      SS({ tile: -1, tint: [0.04, 0.032, 0.03] }); GS.lathe(ra[0], -0.4, ra[1], [[0.26, 0], [0.18, 3.2]], 6, 1); apricots.push([ra[0], -0.4, ra[1], br.range(0.85, 1.2)]);
    }
    (await addMesh(GS, false, 0, 0)).frustumCulled = false;
    await ctx.yield();

    // ---------------------------------------------------------------- the bend: mosaic parapets, studs, poplars, the tower forecourt
    const GB = kit.makeAcc(), SB = SET(GB), bd = rng.fork('bend');
    for (const sd of [-1, 1]) for (let s = sd < 0 ? 326 : 313, i = 0; s <= 373.5; s += 2.62, i++) {
      at(GB, s, sd * 6.25);
      SB({ tile: FIELDS[(i >> 2) % FIELDS.length] }); GB.box(0, 0.68, 0, 0.3, 0.96, 2.62, 'xX', [0, 0.05, 2.4, 0.95]);
      SB({ tile: TL.checks }); GB.box(0, 0.1, 0, 0.46, 0.2, 2.62, 'xXY', [0, 0, 5, 0.4]);
      SB({ tile: -2, tint: J.white }); GB.quad([-0.17, 1.16, 1.31], [0.17, 1.16, 1.31], [0.17, 1.16, -1.31], [-0.17, 1.16, -1.31], [0, 0, 0.3, 2]);
      if (i % 4 === 0) { SB({ tile: -2, tint: J.gold }); GB.lathe(0, 1.16, 1.31, [[0.14, 0], [0.2, 0.18], [0.08, 0.36], [0, 0.62]], 5, 0.3); }
      GB.pop();
    }
    for (let s = 312, i = 0; s < 373; s += 6, i++) stud(GB, SB, s, i);
    // the bend opens on the bridge end-on: the last two kerb poplars and the two on the left of the forecourt are not planted
    // (scale 0 in the list: no trunk, no crown, but every random draw they took is still taken, so the rest is as it was)
    for (const s of [331, 342, 353, 364]) { const sc = bd.range(0.9, 1.15); roadAt(s, -7.75, ra); if (s > 325) { poplars.push([ra[0], -0.4, ra[1], 0]); continue; } trunk(GB, SB, ra[0], -0.4, ra[1], 7.8); poplars.push([ra[0], -0.4, ra[1], sc]); }
    for (const [x, z] of [[-13.6, 222], [13.6, 222], [-13.4, 213.5], [13.4, 213.5]]) { const sc = bd.range(0.95, 1.2); if (x < 0) { poplars.push([x, -0.4, z, 0]); continue; } trunk(GB, SB, x, -0.4, z, 7.8); poplars.push([x, -0.4, z, sc]); }
    for (const [s2, L2] of [[46, 8.4], [112, 8.4], [337, -10.3], [348, -10.6], [359, -10.3]]) {      // apricots where the beams reach them
      roadAt(s2, L2, ra); const y2 = Math.max(height(ra[0], ra[1]) - 0.3, -2.2);
      if (s2 > 330) { apricots.push([ra[0], y2, ra[1], 0 * bd.range(0.9, 1.15)]); continue; }      // the three on the lift-off line are not planted (their draws are kept)
      SB({ tile: -1, tint: [0.04, 0.032, 0.03] }); GB.lathe(ra[0], y2, ra[1], [[0.26, 0], [0.18, 3.2]], 6, 1); apricots.push([ra[0], y2, ra[1], bd.range(0.9, 1.15)]);
    }
    if (blossom) for (const s2 of [50, 64, 142]) {      // three more at the gorge kerb when the apricots are in flower (clear of both towers as seen from the entry)
      roadAt(s2, 8.4, ra); const y2 = Math.max(height(ra[0], ra[1]) - 0.3, -2.2);
      SB({ tile: -1, tint: [0.04, 0.032, 0.03] }); GB.lathe(ra[0], y2, ra[1], [[0.26, 0], [0.18, 3.2]], 6, 1); apricots.push([ra[0], y2, ra[1], bd.range(0.9, 1.1)]);
    }
    roadAt(350, 0, ra); await addMesh(GB, wet > 0.5, ra[0], ra[1]);
    await ctx.yield();

    // ---------------------------------------------------------------- poplars (black flames on the sky) and apricots behind the stalls
    const tr = rng.fork('trees');
    const wind = new THREE.Vector3(-TX * 0.6 + RX * 0.8, -TZ * 0.6 + RZ * 0.8, 1); { const l = Math.hypot(wind.x, wind.y); wind.x /= l; wind.y /= l; }
    const treeMat = (a, b, cut, back) => new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...beamU, uTime: timeU, uWind: { value: wind }, uLeafA: { value: V3(a) }, uLeafB: { value: V3(b) }, uCut: { value: new THREE.Vector3(cut[0], cut[1], cut[2]) }, uBack: { value: back } },
      vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, fog: true, side: THREE.DoubleSide });
    const plant = (geo, mat, list) => {      // an entry of scale 0 is a tree that is not planted: it takes its random draws and no instance
      const n = list.filter((p) => p[3] > 0).length, im = new THREE.InstancedMesh(geo, mat, Math.max(1, n)), dm = new THREE.Object3D(), at2 = new Float32Array(Math.max(1, n) * 2);
      let i = 0;
      for (const p of list) {
        const rot = tr() * TAU, tall = tr.range(0.92, 1.1), a0 = tr(), a1 = tr() * tr();
        if (!(p[3] > 0)) continue;
        dm.position.set(p[0], p[1], p[2]); dm.rotation.set(0, rot, 0); dm.scale.set(p[3], p[3] * tall, p[3]); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); at2[i * 2] = a0; at2[i * 2 + 1] = a1; i++;
      }
      im.count = n;
      geo.setAttribute('aTree', new THREE.InstancedBufferAttribute(at2, 2));
      im.frustumCulled = false; scene.add(im); return im;
    };
    // small leaves in many cards, the crown held clear of the awnings and the eye: a dark flame whose undersides sparkle in the beam
    plant(crownGeometry(tr.fork('p'), { flame: true, height: 16, base: 5.6, radius: 1.95, cards: Math.round(320 * (0.6 + 0.4 * detail)), size: 1.1 }),
      treeMat(autumn ? '#b87a16' : '#143518', autumn ? '#ffd24a' : '#a9c98a', [7, 9, 0.38], autumn ? 0.3 : 0.12), poplars);
    await ctx.yield();
    plant(crownGeometry(tr.fork('a'), { flame: false, height: 8.2, base: 2.5, radius: 3.3, cards: Math.round(200 * (0.6 + 0.4 * detail)), size: 1.1 }),
      treeMat(blossom ? '#f3b4c8' : autumn ? '#a8621a' : '#1c4420', blossom ? '#fff0f4' : autumn ? '#e8a030' : '#86a868', blossom ? [6, 6, 0.25] : [6, 6, 0.35], blossom ? 0.4 : autumn ? 0.25 : 0.14), apricots);
    await ctx.yield();
    plant(crownGeometry(tr.fork('t'), { flame: false, core: false, blades: true, aspect: 4, height: 1.7, base: 0, radius: 0.8, cards: Math.round(80 * (0.6 + 0.4 * detail)), size: 0.28 }),      // sea-buckthorn and grass in the cliff cracks: sprays of blades, no core
      treeMat('#1e2a1a', '#c4ceb0', [4, 1, 0.2], 0.16), tufts);
    await ctx.yield();

    // ---------------------------------------------------------------- sprites: moths, steam, eyeshine, leaves, snow, the offcut storm
    const sr = rng.fork('sprites'), SPF = makeSprites(), SPW = makeSprites();
    const nMoth = Math.round(300 * detail * (weather === 'snow' ? 0.4 : 1));
    for (let i = 0; i < nMoth; i++) SPF.add(0, sr(), sr(), sr(), sr(), 0.045 + 0.05 * sr(), sr(), [0.95, 0.88, 0.7]);
    if (weather === 'dry') for (let i = 0, n = Math.round(650 * detail); i < n; i++) SPF.add(0, sr(), sr(), sr(), sr(), 0.02 + 0.03 * sr(), sr(), [0.85, 0.62, 0.36]);      // dust motes
    if (weather === 'snow') for (let i = 0, n = Math.round(1700 * detail); i < n; i++) SPF.add(3, sr(), sr(), sr(), sr(), 0.03 + 0.03 * sr(), sr(), [0.8, 0.86, 1.0]);
    if (rare) for (let i = 0, n = Math.round(2600 * detail); i < n; i++) { const c = J.jew[i % 5]; SPF.add(5, sr(), sr(), sr(), sr(), 0.06 + 0.07 * sr(), sr(), [c[0] * 2.4 + 0.05, c[1] * 2.4 + 0.05, c[2] * 2.4 + 0.05]); }
    await ctx.yield();
    for (const e of spots) {
      if (e[0] === 1) { for (let k = 0; k < 5; k++) SPW.add(1, e[1], e[2], e[3], sr(), 0.3 + 0.2 * sr(), sr(), [0.6, 0.64, 0.72]); continue; }
      const ph = sr(), sd = sr(), d = e[0] === 4 ? 0.09 : e[0] === 3 ? 0.045 : 0.065, c = e[0] === 4 ? [1.2, 1.7, 0.5] : e[0] === 3 ? [0.6, 1.6, 0.8] : [1.0, 1.5, 0.5], sz = e[0] === 4 ? 0.07 : 0.05;
      SPW.add(2, e[1] - TX * d, e[2], e[3] - TZ * d, ph, sz, sd, c); SPW.add(2, e[1] + TX * d, e[2], e[3] + TZ * d, ph, sz, sd, c);
    }
    for (let i = 0, n = Math.round((autumn ? 320 : blossom ? 300 : 130) * detail); i < n; i++) {      // leaves (or petals) tumbling across the road
      roadAt(sr.range(0, 372), sr.range(-4.2, 4.2), ra);
      SPW.add(4, ra[0], 0.02, ra[1], sr(), blossom ? 0.05 + 0.04 * sr() : 0.08 + 0.07 * sr(), sr(), autumn ? [0.9, 0.56, 0.08] : blossom ? [1.0, 0.62, 0.74] : [0.34, 0.36, 0.1]);
    }
    // The valley, alive in the far dark: three villages of window sparks on the far bank (one on the river plateau up the
    // gorge, a hill town on the terraces, a hamlet higher still) and a road with lorries on it that follows the river and
    // then climbs the terraces in a zigzag. All of it 400 m or more from the route, where our own beams return nothing.
    const vr = ctx.core.makeRng(valleySeed), SPV = makeSprites(), lorries = [];
    const bank = (a, L, out) => { out[0] = BX + TX * a + RX * L; out[1] = BZ + TZ * a + RZ * L; return out; };
    const warm = [[1.0, 0.6, 0.22], [1.0, 0.72, 0.32], [1.0, 0.5, 0.16], [0.75, 0.85, 1.0], [1.0, 0.82, 0.5]];
    const farK = weather === 'mist' ? 0.7 : 1;
    for (const [a0, L0, sa, sL, n0] of [[930, 345, 70, 30, 34], [490, 585, 62, 44, 40], [745, 655, 46, 32, 26]]) {
      for (let i = 0, n = Math.round(n0 * dens); i < n; i++) {
        const row = Math.round(vr.gauss() * 1.4), da = vr.gauss() * sa, c = warm[vr.int(0, warm.length - 1)], g = vr.range(2.2, 5.5) * farK, ph = vr(), sd = vr(), lift = vr.range(3, 8);
        bank(a0 + da, L0 + row * sL * 0.45 + vr.range(-3, 3), ra);
        if (ra[1] < -750 || ra[0] < -550 || ra[0] > 770) continue;
        SPW.add(6, ra[0], height(ra[0], ra[1]) + lift, ra[1], ph, 0.5, sd, [c[0] * g, c[1] * g, c[2] * g]);
      }
      await ctx.yield();
    }
    const farRoad = { x: [], y: [], z: [], d: [0], len: 0 };
    {
      const P = [[1020, 330], [900, 302], [780, 332], [660, 395], [770, 450], [630, 490], [785, 530], [650, 570], [790, 612], [700, 650]];
      for (let i = 0; i < P.length - 1; i++) for (let k = i ? 1 : 0; k <= 8; k++) {
        bank(lerp(P[i][0], P[i + 1][0], k / 8), lerp(P[i][1], P[i + 1][1], k / 8), ra);
        farRoad.x.push(ra[0]); farRoad.y.push(height(ra[0], ra[1]) + 5); farRoad.z.push(ra[1]);
      }
      for (let i = 1; i < farRoad.x.length; i++) { farRoad.len += Math.hypot(farRoad.x[i] - farRoad.x[i - 1], farRoad.y[i] - farRoad.y[i - 1], farRoad.z[i] - farRoad.z[i - 1]); farRoad.d.push(farRoad.len); }
      for (let i = 0, n = Math.round(13 * dens); i < n; i++) {
        const up = i % 3 !== 2, g = (up ? 5.5 : 3.2) * farK;      // two in three come down toward us (warm white); the third shows its tail lamps
        lorries.push({ p: (i + vr.range(0.1, 0.9)) / n, v: (up ? -1 : 1) * vr.range(8, 12) });
        SPV.add(7, farRoad.x[0], farRoad.y[0], farRoad.z[0], vr(), 0.9, vr(), up ? [1.0 * g, 0.86 * g, 0.6 * g] : [1.0 * g, 0.16 * g, 0.08 * g]);
      }
    }
    // The valley floor under the span is lived in too: a village on the gravel bar between the two channels, a hamlet at
    // the far bank's foot beside the far tower, and lantern rafts drifting down the main channel under the bridge.
    const hr = ctx.core.makeRng(valleySeed + 131), rafts = [], raftWay = { x: [], z: [], nx: [], nz: [], w: [], d: [0], len: 0 };
    for (const [a0, L0, sa, sL, n0] of [[430, 103, 46, 8, 46], [525, 247, 38, 9, 30]]) {
      for (let i = 0, n = Math.round(n0 * dens); i < n; i++) {
        const da = hr.gauss() * sa, dL = hr.gauss() * sL, c = warm[hr.int(0, warm.length - 1)], g = hr.range(2.4, 5.5) * farK, ph = hr(), sd = hr(), lift = hr.range(2, 6);
        bank(a0 + da, L0 + dL, ra);
        SPW.add(6, ra[0], Math.max(height(ra[0], ra[1]), -92) + lift, ra[1], ph, 0.45, sd, [c[0] * g, c[1] * g, c[2] * g]);
      }
      await ctx.yield();
    }
    {
      const smp = {};
      for (let i = 0; i <= 44; i++) {
        river.sampleAt(0.26 + 0.25 * (i / 44), smp);
        const tl = Math.hypot(smp.tangent.x, smp.tangent.z) || 1;
        raftWay.x.push(smp.position.x); raftWay.z.push(smp.position.z); raftWay.nx.push(-smp.tangent.z / tl); raftWay.nz.push(smp.tangent.x / tl); raftWay.w.push(smp.width);
        if (i % 15 === 14) await ctx.yield();
      }
      for (let i = 1; i < raftWay.x.length; i++) { raftWay.len += Math.hypot(raftWay.x[i] - raftWay.x[i - 1], raftWay.z[i] - raftWay.z[i - 1]); raftWay.d.push(raftWay.len); }
      for (let i = 0, n = Math.round(11 * dens); i < n; i++) {
        const g = hr.range(3.2, 5.2) * farK;
        rafts.push({ p: (i + hr.range(0.15, 0.85)) / n, v: hr.range(3.0, 4.2), o: hr.range(-0.3, 0.3) });
        SPV.add(7, raftWay.x[0], -89.2, raftWay.z[0], hr(), 0.6, hr(), [1.0 * g, 0.58 * g, 0.2 * g]);
      }
    }
    const sprU = { ...beamU, uTime: timeU, uCamR: { value: new THREE.Vector3(1, 0, 0) }, uCamU: { value: new THREE.Vector3(0, 1, 0) }, uAhead: { value: new THREE.Vector3(TX, 0, TZ) }, uPix: U.uPix,
      uSnowAmt: { value: 1 }, uStorm: { value: 0 }, uWind: { value: wind } };
    const sprMat = new THREE.ShaderMaterial({ uniforms: sprU, vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const sp of [SPF, SPW]) { const m = new THREE.Mesh(sp.geometry(), sprMat); m.frustumCulled = false; m.renderOrder = 4; scene.add(m); }
    const lorryGeo = SPV.geometry(), lorryPos = lorryGeo.attributes.position; lorryPos.setUsage(THREE.DynamicDrawUsage);
    { const m = new THREE.Mesh(lorryGeo, sprMat); m.frustumCulled = false; m.renderOrder = 4; m.name = 'far-road'; scene.add(m); }
    await ctx.yield();

    // ---------------------------------------------------------------- the cab round the camera, and the beam cones
    const GC = kit.makeAcc(); buildCab(GC, rng.fork('cab'), J);
    const cabU = { tA: { value: kit.tex.texA }, tB: { value: kit.tex.texB }, uTime: timeU, uSwing: { value: 0 }, uBounce: { value: 0.3 }, uBounceCol: { value: new THREE.Vector3(1, 0.93, 0.8) },
      uFillC: { value: V3(SK.zen, 1.3 * SK.fill) }, uGlowC: { value: V3(SK.glow, 0.25 * SK.glowK) }, uGlint: { value: 0 } };
    // everything carried with the camera hangs under one group: rig follows the camera (with the cab's shudder); the beam cones
    // are its children at true size, and the cab body is a child group that only carries the cab's scale
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false; rig.name = 'cab'; scene.add(rig);
    const cab = new THREE.Group(); cab.matrixAutoUpdate = false; cab.name = 'cab-body'; rig.add(cab);
    const cabMesh = new THREE.Mesh(GC.geometry(), new THREE.ShaderMaterial({ uniforms: cabU, vertexShader: CAB_VERT, fragmentShader: CAB_FRAG, side: THREE.DoubleSide }));
    cabMesh.frustumCulled = false; cabMesh.renderOrder = 6; cab.add(cabMesh);
    let cones = null, coneU = null;
    {
      const pos = [], nor = [], uv = [], idx = [], rings = 10, segs = 14, len = 60, ta = Math.tan(5.5 * DEG);
      for (const sx of [-1, 1]) {
        const base = pos.length / 3;
        for (let r = 0; r <= rings; r++) for (let k = 0; k <= segs; k++) {
          const t = r / rings, a = (k / segs) * TAU, rad = 0.1 + t * len * ta;
          pos.push(sx + Math.cos(a) * rad, -1.4 - t * len * 0.035 + Math.sin(a) * rad, -1.3 - t * len); nor.push(Math.cos(a), Math.sin(a), ta); uv.push(t, k / segs);
        }
        for (let r = 0; r < rings; r++) for (let k = 0; k < segs; k++) { const a = base + r * (segs + 1) + k, b = a + 1, c = a + segs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      coneU = { uCone: { value: weather === 'dry' ? 0.6 : weather === 'mist' ? 0.4 : weather === 'snow' ? 0.3 : 0.26 }, uTime: timeU,
        uConeCol: { value: weather === 'dry' ? new THREE.Vector3(1, 0.86, 0.66) : new THREE.Vector3(1, 0.93, 0.8) } };
      cones = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: coneU, vertexShader: CONE_VERT, fragmentShader: CONE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      cones.frustumCulled = false; cones.renderOrder = 5; rig.add(cones);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the owl on the cable, bats over the bazaar
    const owl = new THREE.Group(); owl.rotation.y = Math.PI; scene.add(owl);
    const pale = [0.84, 0.8, 0.7], paleTape = [0.62, 0.59, 0.5];
    const GO = kit.makeAcc(), SO = SET(GO);
    SO({ tile: -1, tint: pale }); GO.lathe(0, -0.44, 0, [[0, 0], [0.18, 0.1], [0.24, 0.34], [0.19, 0.54], [0.24, 0.68], [0.16, 0.84], [0, 0.9]], 7, 1);
    for (const sx of [-1, 1]) {      // the face: two pale discs of tape that return the beam, and gold eyes
      SO({ tile: -2, tint: paleTape });
      for (let k = 0; k < 7; k++) { const a0 = (k / 7) * TAU, a1 = ((k + 1) / 7) * TAU; GO.tri([sx * 0.085, 0.25, -0.262], [sx * 0.085 + Math.cos(a1) * 0.115, 0.25 + Math.sin(a1) * 0.13, -0.25], [sx * 0.085 + Math.cos(a0) * 0.115, 0.25 + Math.sin(a0) * 0.13, -0.25], [0, 0], [0.1, 0], [0.05, 0.1]); }
      SO({ tile: -2, tint: J.gold }); GO.quad([sx * 0.09, 0.2, -0.275], [sx * 0.09 + 0.045, 0.25, -0.275], [sx * 0.09, 0.3, -0.275], [sx * 0.09 - 0.045, 0.25, -0.275], [0, 0, 0.1, 0.1]);
    }
    SO({ tile: -2, tint: paleTape }); GO.quad([-0.17, -0.42, 0.1], [0.17, -0.42, 0.1], [0.3, -0.86, 0.2], [-0.3, -0.86, 0.2], [0, 0, 0.4, 0.4]);      // tail fan
    const owlBody = new THREE.Mesh(GO.geometry(), mats.jewel); owl.add(owlBody);
    const GW = kit.makeAcc(), SW = SET(GW);
    {      // a broad wing bent back at the wrist, barred, with three spread primaries at the tip
      const sweep = [0, -0.06, 0.03, 0.2, 0.42], chord = [0.44, 0.46, 0.42, 0.34, 0.2];
      for (let i = 0; i < 4; i++) {
        const xa = i * 0.34, xb = (i + 1) * 0.34;
        SW({ tile: -1, tint: i === 3 ? [0.42, 0.38, 0.28] : i % 2 ? [0.62, 0.58, 0.48] : [0.84, 0.8, 0.7] });
        GW.quad([xa, 0, sweep[i] + chord[i] * 0.62], [xb, 0, sweep[i + 1] + chord[i + 1] * 0.62], [xb, 0, sweep[i + 1] - chord[i + 1] * 0.38], [xa, 0, sweep[i] - chord[i] * 0.38], [0, 0, 0.5, 0.5]);
      }
      SW({ tile: -1, tint: [0.3, 0.27, 0.2] });
      for (let k = 0; k < 3; k++) { const z0 = 0.34 + k * 0.1; GW.tri([1.36, 0, z0], [1.36, 0, z0 + 0.09], [1.62 - k * 0.06, 0, z0 + 0.16 + k * 0.05], [0, 0], [0.2, 0], [0.1, 0.2]); }
    }
    const wingGeo = GW.geometry(), wingL = new THREE.Mesh(wingGeo, mats.jewel), wingR = new THREE.Mesh(wingGeo, mats.jewel);
    wingL.position.set(0.12, 0.22, 0); wingR.position.set(-0.12, 0.22, 0); wingL.scale.z = 1.5; wingR.scale.set(-1, 1, 1.5); owl.add(wingL, wingR);
    owl.scale.setScalar(2.3); owl.traverse((m) => { m.frustumCulled = false; });
    const perch = hero.anchors.owlPerch;
    roadAt(232, 0, ra);
    const batRng = rng.fork('bats');
    await ctx.yield();      // kit: makeFlock (one call, a yield before and after)
    // (flock cure 1) CLEAR AIR BY PLACE: the stream wheels over the road and crosses our line twice. The deal is bounded (maxSigma 3) and the bats' own wander is written out;
    // the kit then lifts each bat that would come within 2 m of the flown line by what it alone lacks (keepClear with each, never downward), in the kit's stepped form. Course, count and spread as they were.
    const bats = await F.makeFlockAsync({ rng: batRng, species: 'bats', count: Math.round(44 * detail), center: [ra[0], 21, ra[1]], radius: 62, height: 7, wander: [3.5, 2.5, 2.5, 1.6], maxSigma: 3, keepClear: { path, dist: 2, each: true, from: 0.1, to: 0.47, step: 2, up: true },
      light: { sunDir: [0.3, 0.8, 0.2], sunColor: SK.glow, sunIntensity: 0.25, sky: SK.hor, skyIntensity: 0.6, ground: '#05060f', groundIntensity: 0.2 } }, ctx.yield);
    await ctx.yield();
    scene.add(bats.object);
    await ctx.yield();      // kit: sky.prewarm
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ---------------------------------------------------------------- per-frame state (nothing below allocates)
    const eye = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), shake = new THREE.Matrix4();
    const lseed = rng.fork('lightning')() * 100;
    const frac = (x) => x - Math.floor(x);
    const duration = 42, len = path.length, poiV = new THREE.Vector3();
    const C22 = Math.cos(22 * DEG), C7 = Math.cos(7 * DEG), C40 = Math.cos(40 * DEG), C24 = Math.cos(24 * DEG), coneBase = coneU.uCone.value;

    return {
      scene, path, duration,
      // a touch slower through the bazaar, slower still along the high view of the whole span, unhurried into the arch
      pace: (u) => 1 - 0.1 * sm(0.16, 0.2, u) * (1 - sm(0.35, 0.39, u)) - 0.25 * sm(0.45, 0.5, u) * (1 - sm(0.58, 0.64, u)) - 0.08 * sm(0.64, 0.68, u) * (1 - sm(0.8, 0.88, u)),
      // nearThrough: seen through the previous portal the world is drawn from 0.3 m, so the road in front of the entry is in the picture
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 5200, lookAhead: 28, sway: 0.3, bank: 0.2 },
      pois: [
        { at: firstEye, from: 0.0, to: 0.05, weight: 0.22 },
        // from the lift-off to the swoop the gaze lies along the convoy, 110 m down the span from wherever the eye is
        // the truck that stands at the bazaar's far end: its crown and fanned peacock, as the cab passes to its left
        { at: bazaarTruck, from: 0.3, to: 0.37, fade: 0.3, weight: 0.4 },
        { at: (time, u) => { path.pointAt(u, poiV); return poiV.set(LANE, 5, Math.max(poiV.z - 110, -HALF)); }, from: 0.38, to: 0.72, fade: 0.2, weight: 0.7 },
        { at: new THREE.Vector3(1.2, 6, -HALF), from: 0.72, to: 0.9, weight: 0.25 },
      ],
      portal: { shape: 'circle', radius: PORTAL.radius, color: PORTAL.color, glow: PORTAL.glow, revealDistance: 420, blendDistance: 25 },
      post: { exposure: 1.25, bloom: { strength: 0.45, radius: 0.35, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#ffffff', shadowTint: hour === 'dusk' ? '#1c1d5c' : '#141b54', vignette: 0.4, grain: 0.03 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) {
        const d = clamp(u, 0, 1) * len;
        rig.visible = !ctx.through;      // the cab and the beam cones (meshes only): the portal's near plane would slice them
        eye.setFromMatrixPosition(camera.matrixWorld);
        right.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); up.setFromMatrixColumn(camera.matrixWorld, 1).normalize(); fwd.setFromMatrixColumn(camera.matrixWorld, 2).negate().normalize();
        // road-equivalent distance: the metres driven as far as the bend, then (once the cab has left the road) where the eye
        // stands along the bridge, so the convoy's head still meets us on the bend and its tail passes us on the deck
        const s = lerp(d, S_TOWER + (HALF - eye.z), sm(S_BEND, S_BEND + 20, d));
        hero.setTravel(s);
        // from the air the lamps are thrown wide and long: tape answers hardest at distance, so the whole line of trucks
        // returns our own two beams and every peacock along the span stands open
        const kHi = sm(7, 24, eye.y);
        beam.uBeamLong.value.set(lerp(C22, C40, kHi), lerp(C7, C24, kHi), lerp(115, 430, kHi), lerp(160, 620, kHi));
        beam.uBeamGain.value = lerp(1.15, 1.4, kHi); U.uTapeGain.value = lerp(2.7, 3.3, kHi); rockU.uHi.value = kHi;
        U.uFan.value.set(lerp(70, 300, kHi), lerp(14, 80, kHi));
        coneU.uCone.value = coneBase * (1 - kHi);
        // the headlights pitch and sway with the cab, so the edge of the lit world slides
        const pitch = -0.035 + 0.012 * Math.sin(time * 1.7) + 0.006 * Math.sin(time * 4.1), yaw = 0.012 * Math.sin(time * 1.1 + 1.3);
        beam.uEye.value.copy(eye);
        beam.uBeamDir.value.copy(fwd).addScaledVector(up, pitch).addScaledVector(right, yaw).normalize();
        beam.uBeamPos.value[0].copy(eye).addScaledVector(right, -1).addScaledVector(up, -1.4).addScaledVector(fwd, 0.8);
        beam.uBeamPos.value[1].copy(eye).addScaledVector(right, 1).addScaledVector(up, -1.4).addScaledVector(fwd, 0.8);
        hero.update(dt, time, camera);
        sky.update(dt, time, camera);
        ridges.object.position.x = eye.x; ridges.object.position.z = eye.z;
        river.update(dt, time, camera); river2.update(dt, time, camera); mist.update(dt, time, camera); bats.update(dt, time, camera, u);
        // heat lightning behind the peaks: 0.6 s rise, a slow decay, at most one every 6.5 s
        const k = Math.floor(time / 6.5), h = frac(Math.sin(k * 12.9898 + lseed) * 43758.5453), tl = time - (k * 6.5 + 0.3 + h * 2.2);
        const env = frac(h * 17.31) < 0.72 && tl > 0 ? (tl < 0.6 ? sm(0, 0.6, tl) : Math.exp(-(tl - 0.6) / 0.5)) : 0;
        flashU.uFlash.value = env * (0.5 + 0.5 * frac(h * 5.7));
        flash.position.set(eye.x + flashDir.x * 3800, 300, eye.z + flashDir.z * 3800);
        // the cab: shudder and sway, bounce light that follows what the beams are returning
        const roll = 0.004 * Math.sin(time * 2.1) + 0.0012 * Math.sin(time * 17.3), bob = 0.004 * Math.sin(time * 23.1) + 0.006 * Math.sin(time * 3.3);
        shake.makeRotationZ(roll); shake.elements[13] = bob;
        // the cab frames the picture whole while the eye is at road height, at the scale its geometry was built for: at a
        // 62 degree field of view the crown's lower band fills the top 11 percent with the bells hanging to about 15, and the
        // bonnet's nose the bottom 8 percent. It grows with a wider view (a tall screen), slides out of the
        // frame as the cab lifts off, and comes back by itself once the eye is down at 3.4 m for the drive into the arch.
        const kUp = sm(3.4, 6.5, eye.y);
        const cs = clamp(lerp(1.0, 1.9, kUp) / (Math.max(camera.projectionMatrix.elements[5], 0.2) * 0.6009), 0.8, 4.2);
        // on a tall screen the frame is drawn in a little (a tenth less tall at most), so less bare road lies below
        const el = camera.projectionMatrix.elements, tallK = sm(1.0, 1.7, el[0] / Math.max(el[5], 1e-3));
        cab.matrix.makeScale(cs, cs * (1 - 0.1 * tallK), 1);
        rig.matrix.multiplyMatrices(camera.matrixWorld, shake); rig.matrixWorldNeedsUpdate = true;
        const bz = 0.22 + 0.85 * sm(140, 165, s) * (1 - sm(300, 325, s)) + 0.45 * sm(300, 330, s) * (1 - sm(380, 400, s)) + 0.72 * sm(385, 420, s) * (1 - sm(700, 740, s)) + 0.5 * sm(730, 790, s);
        cabU.uBounce.value = bz * (0.92 + 0.08 * Math.sin(time * 5.3));
        cabU.uSwing.value = 0.5 * Math.sin(time * 1.3) + 0.25 * Math.sin(time * 2.9);
        cabU.uGlint.value = time * 0.7 + d * 0.12;
        sprU.uCamR.value.copy(right); sprU.uCamU.value.copy(up);
        sprU.uAhead.value.set(fwd.x, 0, fwd.z + 1e-6).normalize();
        sprU.uStorm.value = rare ? sm(0.7, 0.735, u) * (1 - sm(0.82, 0.86, u)) : 0;
        // the owl leaves its hanger as the beams find it and beats away to the left
        // it lifts off 45 m ahead, flies down the long beam 30-40 m in front of the cab for about three seconds, then beats away up and to the left
        // (staged on the high line: perched on the left main cable at z = 80, it lifts as the cab swings in over the cable,
        // climbs toward us across the upper left of the frame about 20 m off, then turns and beats away up the gorge)
        const ot = clamp((s - 455) / 62, 0, 1), fly = sm(0, 0.06, ot), oa = sm(0, 0.5, ot), ob = clamp((ot - 0.45) / 0.55, 0, 1), ob2 = ob * ob;
        owl.visible = s > 400 && s < 530;
        owl.position.set(perch.x - 13 * oa - 42 * ob2, 13.3 + 12.2 * oa + 15 * ob2, perch.z + 10 * oa - 22 * ob2);
        owl.rotation.set(0.3 * fly, lerp(Math.PI, 1.2, sm(0.4, 0.7, ot)), 0);
        const flap = fly * (0.18 + 0.62 * Math.sin(time * 10)) - (1 - fly) * 1.32;
        wingL.rotation.z = flap; wingR.rotation.z = -flap; owlBody.rotation.x = -1.1 * fly;
        // lorries on the far road: an ambient loop on time
        for (let i = 0; i < lorries.length; i++) {
          const lo = lorries[i]; let q = (lo.p + (lo.v * time) / farRoad.len) % 1; if (q < 0) q += 1;
          const dd = q * farRoad.len, D = farRoad.d; let j = 1; while (j < D.length - 1 && D[j] < dd) j++;
          const f = (dd - D[j - 1]) / Math.max(D[j] - D[j - 1], 1e-3), x = lerp(farRoad.x[j - 1], farRoad.x[j], f), y = lerp(farRoad.y[j - 1], farRoad.y[j], f), z = lerp(farRoad.z[j - 1], farRoad.z[j], f);
          for (let c = 0; c < 4; c++) lorryPos.setXYZ(i * 4 + c, x, y, z);
        }
        // lantern rafts on the main channel (the same loop on time); the convoy's colours in the river follow the beams
        for (let i = 0; i < rafts.length; i++) {
          const rf = rafts[i], dd = ((rf.p + (rf.v * time) / raftWay.len) % 1) * raftWay.len, D = raftWay.d; let j = 1; while (j < D.length - 1 && D[j] < dd) j++;
          const f = (dd - D[j - 1]) / Math.max(D[j] - D[j - 1], 1e-3), off = rf.o * lerp(raftWay.w[j - 1], raftWay.w[j], f);
          const x = lerp(raftWay.x[j - 1], raftWay.x[j], f) + lerp(raftWay.nx[j - 1], raftWay.nx[j], f) * off, z = lerp(raftWay.z[j - 1], raftWay.z[j], f) + lerp(raftWay.nz[j - 1], raftWay.nz[j], f) * off;
          for (let c = 0; c < 4; c++) lorryPos.setXYZ((lorries.length + i) * 4 + c, x, -89.2 + 0.12 * Math.sin(time * 1.3 + i), z);
        }
        wakeU.uAmt.value = wakeGain * (0.25 + 0.75 * kHi); wakeU.uTravel.value = s;
        lorryPos.needsUpdate = true;
        // a road mirror is drawn within 105 m of its centre and, ahead of the eye, within the long lobe's reach (160 m) plus half a mesh (27 m):
        // it is there before the beams light what it mirrors, so its streaks come up with the light and never at a switch
        for (let i = 0; i < mirrors.length; i++) { const m = mirrors[i], dx = eye.x - m.x, dz = eye.z - m.z, d2 = dx * dx + dz * dz; m.mesh.visible = d2 < 105 * 105 || (d2 < 187 * 187 && dx * fwd.x + dz * fwd.z < 0); }
      },
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
