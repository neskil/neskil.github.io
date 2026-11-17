// THE GLASS BIRCHES (ice-arcade): the first sunrise after an ice storm, from the runners of a dog sled.
//
// Six huskies pull the camera through sunlit open wood, under a first arch of bowed birches with a red-beaded
// mountain-ash at its foot, across the black ice of a beaver pond (lodge steaming on the shaded side, dam and
// drowned snags on the other) and into a 305 m arcade of birches bowed into a vault of glass: the hero set piece
// (src/parts/ice-arcade.js). The sunlight edge slides up the trail from behind; where it arrives the ice lets go.
//
// Everything is laid out in TRACK SPACE (d = metres along the trail from the entry, q = metres toward the sun side),
// so a mirrored visit is a true mirror image. World space is the hero's local space (travel toward -Z at first).
//
// THE FLIGHT is no longer tied to the sled: the camera path (table CAM) is flown in track space, the team keeps to
//   the trail and is placed against the camera by table AHEAD_U, so it runs ahead, swings wide, drops out of sight
//   while the flight is off the trail and comes back as a close-up of the lead dogs.
// BEATS (u)  0-0.1 open wood close behind the team, first arch, mountain-ash | 0.1-0.27 out along the sun shore of
//   the pond: dark ice with the ash and the white stems standing in it, lodge steaming, team crossing beside the eye |
//   0.27-0.53 the nave, 6 to 7 m behind the musher, weaving from one side of the trail to the other, the gaze lifted
//   into the vault (golden: the low sun dead ahead through the ribs, shafts across the lane, the team's powder and
//   breath back-lit); herald one bursts at 0.33, herald two at 0.37, the owl leaves its crown at 0.40 and crosses 5 m
//   ahead at 0.467; the light comes up from behind and passes the team at 0.52 | 0.54-0.57 out through a gap in the
//   ribs | 0.57-0.63 the clearing: mountain-ash at arm's length, under a fallen birch as its ice comes down in
//   separate falls, the old trail and the long shadows | 0.63-0.76 the close pass: ten metres outside the ribs,
//   looking along the row, the light front 39 m ahead, so the ice is coming down in plates 8 to 24 m ahead, over and
//   just beyond the team, the stems behind it standing up, the blue bowed vault beyond | 0.74-0.82 back in over the
//   team as the wave runs on to the portal | 0.8-0.94 beside the lead dogs; the hare breaks at 0.8 (rare: the lynx
//   breaks cover at 0.83 and is in mid-bound over the track at 0.84) | 0.94-1 gate.
// TIMELINE  Everything scripted is a pure function of u: T(u) (seconds, from the pace), the light front's arc (the
//   eye's place plus table FRONT_AHEAD) and the team's place (sledAt(u)) give every tree its release time; the hero
//   is driven with setTime(T(u)).
// PACE  1.14x along the pond shore, 0.84x in the nave (u 0.3-0.55: the team close ahead under the vault is the
//   picture, it is held), 1.05x through the turn out, 0.84x along the close pass (u 0.64-0.77: the release is the
//   picture), 0.94x beside the dogs, 1 elsewhere.
// LOOKS (seed / ctx.vary.hour): rose first sun, abeam | golden (track mirrored; a copper sun low and AHEAD down the
//   trail: rim-lit twigs, shadows reaching toward the eye, shafts in the air) | night (full moon, cold fire).
//   Weather: clear | diamond dust | a passing snow shower. Storm load: normal | heavy | light.
//   Cast: team coats, chickadees / waxwings / grosbeaks, hare or fox. Rare: a Canada lynx crosses ahead of the leaders.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, HERO_GLSL } from '../parts/ice-arcade.js';

const PALETTE = ['#FBF6F1', '#F6C3CC', '#FFD79A', '#5E86C4', '#243F7A', '#BCE3F4', '#C8202A'];
const LEAD = 125, LEN = 440, PRE = 80;                       // arcade mouth, trail length, metres of track kept before the entry
// THE FLIGHT, in track space: metres along the trail, metres toward the sun's side of it, metres over the ground.
// Behind the team through the first arch | out over the pond's black ice along its sun shore and back to the arcade's
// mouth | the blue nave, weaving | out through a gap in the ribs into a clearing, under a fallen birch, past
// mountain-ash | back to the row and along it, a dozen metres outside the ribs and four up, as the wave runs through
// them | in between the freed trees to run beside the lead dogs | the gate and the portal.
const CAM = [[0, 2.2, 2.7], [20, 2.2, 2.6], [40, 2.1, 2.7], [56, 4.2, 3.1], [70, 7.2, 3.1], [84, 9.4, 2.8], [97, 9.8, 2.6], [109, 7.6, 2.5], [120, 3.6, 2.5], [132, -0.8, 2.4],
  [146, -2.6, 2.3], [160, -2.9, 2.3], [173, -1.0, 2.8], [185, 2.0, 3.5], [198, 2.9, 3.5], [211, 2.9, 2.8], [224, 2.7, 2.0], [237, 2.6, 1.8], [247, 4.4, 2.1], [255, 8.6, 2.8], [262, 13.8, 3.3], [268, 17.8, 3.6], [275, 19.6, 3.8], [282, 18.2, 3.9],
  [289, 15.0, 3.9], [297, 11.6, 3.7], [306, 9.9, 3.5], [316, 9.4, 3.4], [327, 9.5, 3.7], [337, 9.2, 4.5], [354, 4.6, 3.3], [369, 3.9, 2.2], [385, 3.6, 1.9], [401, 2.9, 1.9], [416, 1.8, 1.9], [428, 0.8, 1.9], [440, 0, 1.9]];
// the team against the eye: metres the sled runs ahead of it (u, metres). Close all the way: ten metres ahead through the
// wood, eight across the pond (the flight keeps to the ice beside it), six to nine in the nave, where the eye rides just
// behind the musher, to one side and then the other; it runs on while the flight swings out through the clearing, and is
// there below, among the row at the edge of the light, when the flight comes back alongside the ribs; the eye overtakes
// it on the way back in (u 0.74-0.82), and from u 0.83 runs beside the swing dogs, the two leaders whole in the frame
const AHEAD_U = [[0, 10], [0.08, 12], [0.13, 10.5], [0.17, 9.5], [0.22, 8.5], [0.26, 8], [0.3, 7.2], [0.34, 6.6], [0.38, 7.2], [0.43, 7.0], [0.47, 6.2], [0.52, 4.6], [0.55, 6.5], [0.63, 13], [0.66, 9], [0.7, 6.6], [0.74, 5.6], [0.78, 2.2], [0.8, -0.8], [0.83, -3.7], [0.9, -3.7], [0.94, -2.2], [1, -1.7]];
const HIDDEN = [0.55, 0.63];                                 // between these the team is out of sight and simply runs on at an even pace
// the light front against the eye: how many metres of trail it stands ahead of the eye at each u. Behind all through
// the nave; it comes up from behind while the eye rides close behind the team (level with the eye at u 0.51, over the
// dogs' backs at 0.53, as the flight turns out through the gap) and runs on ahead while the flight is out in the
// clearing; all along the close pass it stands 39 m ahead (the wave runs at the eye's speed there). A tree's ice is in
// the air from 1.5 to 4.5 s after the light touches it, so the falls stand 8 to 24 m ahead of the eye, in the middle of
// the frame, the stems behind them standing up, the bowed vault still blue beyond; then the front runs out down the
// avenue and to the end keeps some fifty metres ahead of the leaders
const FRONT_AHEAD = [[0, -25], [0.22, -63], [0.3, -56], [0.36, -47], [0.4, -38], [0.44, -27], [0.47, -16], [0.5, -4], [0.53, 6.5], [0.56, 22], [0.6, 36], [0.64, 39], [0.68, 39], [0.72, 39], [0.75, 42], [0.78, 47], [0.8, 52], [0.84, 54], [0.88, 50], [0.92, 46], [1, 115]];
const GAPS = [[112, 142], [209, 233]];                         // ribs left out on the sun side (arcade distance): the way out and the way back in
const pwl = (tab, u) => { let j = 0; while (j < tab.length - 2 && u > tab[j + 1][0]) j++; const a = tab[j], b = tab[j + 1]; return a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, (u - a[0]) / (b[0] - a[0]))); };
// the stem of a bowed birch (the hero's own integral): x along the lean, y up, for a stem of length len
const stemXY = (t, theta, len) => { let x = 0, y = 0; const dt = t / 6; for (let i = 0; i < 6; i++) { const q = (i + 0.5) * dt, ph = theta * q * (0.45 + 0.55 * q); x += Math.sin(ph); y += Math.cos(ph); } return [x * dt * len, y * dt * len]; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const VNOISE = /* glsl */`
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;
const FOG_VS = /* glsl */`
    #ifdef USE_FOG
      vFogDepth = -mv.z;
    #endif
`;

// ---------------------------------------------------------------------------------------------------------------
// the ground: snow with the packed track, runner grooves, paw prints, sastrugi and sparkle; baked trunk shadows near
// the trail and long procedural ones in the wood; the sliding light front; the pond's black ice with cracks, blown
// snow, snow snakes and the mirrored sky
// ---------------------------------------------------------------------------------------------------------------
const GROUND_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec2 aUV;                         // arcade distance, lateral offset (right of travel positive)
  attribute vec2 aM;                          // pond metric (< 1 inside), wood shadow amount
  attribute vec2 aT;                          // the trail's direction (xz) beside this point
  attribute vec3 aOff;                        // zero on the ground; on the apron, the way to the ground point it stands for
  attribute vec2 aF;                          // the old trail the flight follows where it leaves the team: metres to its right, how much of it there is (0..1)
  varying vec2 vUV; varying vec2 vM; varying vec3 vW; varying vec3 vN; varying vec2 vT; varying vec2 vF;
  void main() {
    vUV = aUV; vM = aM; vN = normal; vT = aT; vF = aF;
    vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz + aOff;
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const GROUND_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform sampler2D uShadow;
  uniform vec3 uSnow, uHorizon, uZenith, uIceCol, uSnowSun;
  uniform vec4 uTrunk[8];                     // birch feet by the pond: x, z, height, radius (their white stems stand in the ice)
  uniform vec4 uFloor;                        // shadow span, -, shadow lateral span, bar contrast
  uniform vec4 uGnd;                          // arcade length, snow-snake strength, sparkle, far-shadow strength
  uniform vec4 uDir;                          // sun xz (unit), wind xz (unit)
  uniform vec4 uLook;                         // wood shadow strength, shafts of light on the lane, hoar glints, the sun's path on the ice
  varying vec2 vUV; varying vec2 vM; varying vec3 vW; varying vec3 vN; varying vec2 vT; varying vec2 vF;
  // wind-carved snow in wind space (x downwind, metres): long sastrugi, and between them ripples that climb slowly
  // and drop sharply on the lee side, so a low sun rakes them into rose crests and blue troughs
  float relief(vec2 p) {
    float w = vnoise(p * vec2(0.09, 0.4) + 3.7);                            // where the wind has worked the snow
    float drift = vnoise(p * vec2(0.11, 0.42));                             // long soft drifts lying down the wind
    float tongue = vnoise(p * vec2(0.3, 0.95) + 7.0);                        // shorter tongues on them
    // ripples across the wind: the phase rises steadily downwind and only wanders, so the crests are lines that never close into loops
    float saw = fract(p.x * 0.55 + 0.45 * vnoise(p * vec2(0.07, 0.42) + 11.0));
    float rip = saw * saw * (1.0 - smoothstep(0.74, 1.0, saw));
    return 1.05 * drift + 0.5 * tongue + 0.42 * rip * (0.25 + 0.75 * w * w) + 0.17 * vnoise(p * vec2(1.3, 3.6) + 9.0);
  }
  // the packed track: a shallow trench between two soft berms
  float trk(float l) { float al = abs(l); return -0.07 * (1.0 - smoothstep(1.1, 1.55, al)) + 0.1 * smoothstep(1.3, 1.75, al) * (1.0 - smoothstep(1.75, 2.7, al)); }
  float cellEdge(vec2 x) {
    vec2 n = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash2(n + g), hash2(n + g + 17.3));
      vec2 r = g + o - f; float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
    return sqrt(d2) - sqrt(d1);
  }
  // storm litter: one fallen twig with a side shoot in each cell. Returns (distance to it in metres, its hash, place along it)
  vec3 twig(vec2 p, float sc, float seed) {
    vec2 g = p / sc, id = floor(g), f = fract(g);
    float h = hash2(id + seed), ang = hash2(id + seed + 1.7) * 6.283;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 q = f - 0.5 - (vec2(hash2(id + seed + 2.9), hash2(id + seed + 4.1)) - 0.5) * 0.26;
    float hl = 0.17 + 0.16 * hash2(id + seed + 5.3);
    float t = clamp(dot(q, dir), -hl, hl);
    q -= vec2(-dir.y, dir.x) * ((hash2(id + seed + 7.7) - 0.5) * 0.5 * hl * (t * t / (hl * hl) - 0.4));      // no fallen twig is straight
    float d = length(q - dir * t);
    float a2 = ang + (h > 0.5 ? 0.7 : -0.7); vec2 d2 = vec2(cos(a2), sin(a2));
    vec2 q2 = q - dir * (hl * (0.6 * hash2(id + seed + 6.1) - 0.2));
    float t2 = clamp(dot(q2, d2), 0.0, hl * 0.8);
    d = min(d, length(q2 - d2 * t2));
    return vec3(d * sc, h, (t + t2) * sc);
  }
  void main() {
    float a = vUV.x, l = vUV.y;
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    vec2 p = vW.xz;
    vec2 pw = fwidth(p); float fwp = max(pw.x, pw.y) + 1e-5;
    float sgn = uSkew > 0.0 ? 1.0 : -1.0, ls = l * sgn;                    // ls > 0: the sun's side of the trail
    float al = abs(l);
    float track = 1.0 - smoothstep(1.2, 1.7, al);
    float nearK = 1.0 - smoothstep(30.0, 95.0, dist);
    float em = vM.x + 0.07 * (vnoise(p * 0.35) - 0.5);
    float ice = 1.0 - smoothstep(0.86, 0.93, em);
    // relief and its slope, in wind space
    vec2 wq = vec2(dot(p, uDir.zw), dot(p, vec2(-uDir.w, uDir.z)));
    float e = 0.07;
    float h0 = relief(wq), hx = relief(wq + vec2(e, 0.0)), hz = relief(wq + vec2(0.0, e));
    float amp = 0.25 * (1.0 - 0.8 * track) * nearK * (1.0 - 0.45 * smoothstep(0.22, 0.6, V.y));      // seen from above the relief is a quiet grain, not a pattern
    vec2 gw = vec2(hx - h0, hz - h0) / e * amp;
    vec2 grad = gw.x * uDir.zw + gw.y * vec2(-uDir.w, uDir.z);
    // the track: trench walls, lumpy berms, two runner grooves
    vec2 Lw = vec2(-vT.y, vT.x);
    float lump = 0.55 + 0.9 * vnoise(vec2(a * 0.8, l * 0.5 + 7.0));
    float trkK = (1.0 - smoothstep(60.0, 140.0, dist)) * (1.0 - ice);
    float gd = abs(al - 0.26);
    float gw0 = 0.045 + 0.35 * fwp;                                          // the grooves never get thinner than a pixel or two
    float grooveM = (1.0 - smoothstep(gw0, gw0 + 0.035, gd)) * track * min(1.0, 0.045 / gw0) * (1.0 - smoothstep(0.04, 0.09, fwp));   // a groove counts for its share of the pixel, and is gone when far finer than one
    float dGr = -1.1 * smoothstep(gw0 - 0.01, gw0 + 0.01, gd) * (1.0 - smoothstep(gw0 + 0.01, gw0 + 0.045, gd)) * sign(al - 0.26) * sign(l) * (1.0 - smoothstep(12.0, 30.0, dist));
    grad += Lw * ((trk(l + 0.03) - trk(l - 0.03)) / 0.06 * lump * 1.6 - dGr) * trkK;
    // the old trail under the flight where it leaves the team: yesterday's run, half drifted in: a soft trench between low
    // berms and two runner lines, leading on into the wood (its direction is taken from the field itself)
    float oK = vF.y * (1.0 - ice) * (1.0 - smoothstep(50.0, 110.0, dist));
    float oGroove = 0.0, oTrack = 0.0;
    if (oK > 0.01) {
      float ol = vF.x, oal = abs(ol);
      vec2 px = dFdx(p), py = dFdy(p); float ox = dFdx(ol), oy = dFdy(ol), det = px.x * py.y - px.y * py.x;
      vec2 oDir = vec2(ox * py.y - oy * px.y, oy * px.x - ox * py.x) * (det < 0.0 ? -1.0 : 1.0);      // the way "ol" grows over the ground
      float odl = length(oDir); oDir = odl > 1e-9 ? oDir / odl : vec2(1.0, 0.0);
      float olump = 0.6 + 0.8 * vnoise(p * 0.7 + 3.0);
      grad += oDir * ((trk(ol * 1.15 + 0.03) - trk(ol * 1.15 - 0.03)) / 0.06 * olump * 1.5) * oK;
      float ogd = abs(oal - 0.26), ogw = 0.05 + 0.35 * fwp;
      oGroove = (1.0 - smoothstep(ogw, ogw + 0.04, ogd)) * (1.0 - smoothstep(1.0, 1.3, oal)) * min(1.0, 0.05 / ogw) * (1.0 - smoothstep(0.05, 0.11, fwp)) * oK * (0.45 + 0.55 * vnoise(p * 1.3));
      oTrack = (1.0 - smoothstep(1.0, 1.5, oal)) * oK;
    }
    vec3 Ng = normalize(vN + vec3(0.0, 1e-4, 0.0));
    vec3 N = normalize(Ng + vec3(-grad.x, 0.0, -grad.y));
    // paw prints in the dogs' lanes: shaded dimples near, a darker lane further off
    vec2 pc = vec2(a / 0.43 + floor(l / 0.19) * 0.37, l / 0.19); vec2 pi = floor(pc), pf = fract(pc) - 0.5;
    vec2 po = (vec2(hash2(pi + 3.3), hash2(pi + 8.1)) - 0.5) * 0.4;
    float lane = step(abs(pi.y + 0.5), 3.1) * step(0.42, hash2(pi));
    float pawFar = smoothstep(0.2, 0.6, fwidth(a) / 0.43);
    vec2 pm = (pf - po) * vec2(0.43, 0.19);
    float paw = (1.0 - smoothstep(0.035, 0.06, length(pm))) * lane;
    float pawRim = (1.0 - smoothstep(0.035, 0.06, length(pm + vec2(0.0, 0.03 * sgn)))) * lane;
    paw = mix(paw, 0.16 * (1.0 - smoothstep(0.45, 0.7, al)), pawFar) * track * (1.0 - ice);
    float pawLit = clamp(pawRim - paw, 0.0, 1.0) * (1.0 - pawFar) * track * (1.0 - ice);
    // shadows: baked trunk bars inside the band beside the trail, long streaks of the wood's shadow beyond it
    float inBand = 1.0 - smoothstep(uFloor.z * 0.5 - 8.0, uFloor.z * 0.5 - 1.5, al);
    float bars = texture2D(uShadow, vec2((a + uA0) / uFloor.x, clamp(l / uFloor.z + 0.5, 0.02, 0.98))).r * inBand;
    // the wood's shadow, in the sun's own frame (sq.x across the light, sq.y toward it, metres). A low sun throws every
    // crown as a soft lobe five metres wide and forty long, and every stem as a thin line that runs from its foot to
    // its lobe: long blue bars raking the snow, with the sun between them
    vec2 sq = vec2(dot(p, vec2(-uDir.y, uDir.x)), dot(p, uDir.xy));
    float lobe = smoothstep(0.47, 0.64, vnoise(vec2(sq.x * 0.2, sq.y * 0.026)) * 0.62 + vnoise(vec2(sq.x * 0.47 + 7.0, sq.y * 0.05 + 3.0)) * 0.38);
    float lnx = sq.x / 2.7, li = floor(lnx);
    float sph = -sq.y / 66.0 + hash1(li * 7.3), seg = floor(sph), sy = fract(sph);       // sy: 0 at the foot, growing down the light
    float lh = hash2(vec2(li, seg)), lw = 0.11 + 0.1 * hash1(li + seg * 3.1);
    float lx = (fract(lnx) - 0.2 - 0.6 * lh) * 2.7 + 0.5 * (vnoise(vec2(li * 5.0, sq.y * 0.06)) - 0.5);
    float soft = 0.04 + 0.55 * sy + 1.2 * fwp;
    float line = (1.0 - smoothstep(lw, lw + soft, abs(lx))) * step(0.3, lh) * step(sy, 0.55 + 0.4 * lh) * smoothstep(0.0, 0.02, sy) * (1.0 - 0.45 * sy) * min(1.0, (2.0 * lw + soft) / (2.0 * lw + soft + 2.0 * fwp));
    float streak = max(lobe * 0.9, line);
    float wood = smoothstep(0.0, 0.5, vM.y) * (0.82 + 0.18 * vM.y) * (1.0 - 0.35 * inBand * smoothstep(-78.0, -48.0, a) * (1.0 - smoothstep(4.0, 9.0, al))) * uGnd.w;      // in the open wood the long blue shadows bar the trail itself
    float age = (uFront - a) / 12.0 - 1.2;
    float inArc = smoothstep(-6.0, 8.0, a) * (1.0 - smoothstep(uGnd.x - 4.0, uGnd.x + 10.0, a));
    float canopy = mix(0.56, 0.16, smoothstep(0.0, 1.5, age)) * (0.55 + 0.45 * vnoise(p * 0.23 + 3.0)) * (1.0 - smoothstep(5.0, 13.0, al)) * inArc;
    // between the ribs the sun comes through in shafts: bands of light that lie down the light across the lane
    float shaft = smoothstep(0.5, 0.68, vnoise(vec2(sq.x * 0.4 + 31.0, sq.y * 0.014))) * (0.6 + 0.4 * vnoise(vec2(sq.x * 1.7, sq.y * 0.09 + 5.0)));
    canopy *= 1.0 - uLook.y * shaft;
    float face = smoothstep(-0.06, 0.1, dot(Ng, uSun));
    float bermSh = smoothstep(0.3, 0.6, ls) * (1.0 - smoothstep(1.35, 1.7, ls)) * (0.55 + 0.45 * lump) * trkK;   // the sun-side berm's shadow lies in the trench
    float lit = litAt(a - l * uSkew, 0.0) * (1.0 - min(0.86, uFloor.w * 1.4 * bars)) * (1.0 - canopy) * (1.0 - uLook.x * wood * streak) * face;
    lit *= (1.0 - 0.6 * bermSh) * (1.0 - 0.9 * grooveM * trkK) * (1.0 - 0.7 * paw) * (1.0 - 0.8 * oGroove);
    float grain = vnoise(p * 9.0) - 0.5;
    vec3 alb = uSnow * (1.0 - 0.07 * track - 0.05 * oTrack - 0.3 * grooveM - 0.25 * oGroove - 0.14 * paw + 0.06 * grain * nearK);
    float ndl = dot(N, uSun);
    // crests and drift lips that face the low sun take it full; their lee sides fall into the sky's blue
    float sunT = 0.1 + 0.58 * smoothstep(-0.12, 0.4, ndl) + 0.34 * smoothstep(0.3, 0.7, ndl) + 0.3 * pawLit;
    float rl = clamp(0.5 + (N.x + N.z) * 1.6, 0.0, 1.0);
    vec3 fill = mix(uDeep * 1.6, uSkyCol, 0.25 + 0.3 * h0 + 0.45 * rl) * (1.0 - 0.3 * grooveM - 0.25 * paw);
    // snow is white: the sun on it is the sun with most of its colour taken out, the shade is the sky's blue
    fill = mix(fill, dot(fill, vec3(0.3, 0.5, 0.2)) * vec3(0.84, 0.95, 1.22), 0.3) * 1.07;      // snow shade is a soft blue, never ink
    vec3 col = alb * (uSnowSun * lit * sunT + fill * (0.8 - 0.42 * lit));
    // sparkle: facets that flash as the eye moves; only near, so it never shimmers far off
    vec2 sc = floor(p * 26.0);
    float fl = hash2(sc + floor(dot(V, vec3(31.0, 17.0, 23.0)) + hash2(sc) * 6.0));
    float backS = max(dot(-V, uSun), 0.0); backS *= backS;
    col += (uSnowSun * lit * (2.2 + 3.0 * backS) + uSkyCol * 0.5) * step(0.992 - 0.004 * backS, fl) * (1.0 - smoothstep(6.0, 26.0, dist)) * (0.4 + 0.6 * hash2(sc + 3.0)) * uGnd.z;
    // hoar: single big crystals close to the lens, each a point of fire that turns on and off as the eye passes
    vec2 hc = p * 7.0, hi = floor(hc), hf = fract(hc) - 0.5;
    float hh = hash2(hi + 41.0);
    float hOn = step(0.93, hh) * step(0.45, hash2(hi + floor(dot(V, vec3(13.0, 7.0, 11.0)) * 0.8 + hh * 9.0)));
    vec2 ho = (vec2(hash2(hi + 5.0), hash2(hi + 9.0)) - 0.5) * 0.5;
    float hr = length(hf - ho);
    float star = (1.0 - smoothstep(0.03, 0.09 + 0.6 * fwp, hr)) + 0.5 * (1.0 - smoothstep(0.0, 0.02 + 0.3 * fwp, min(abs(hf.x - ho.x), abs(hf.y - ho.y)))) * (1.0 - smoothstep(0.1, 0.28, hr));
    col += (uSnowSun * lit * (3.0 + 5.0 * backS) + uSkyCol * 0.7) * hOn * star * (1.0 - smoothstep(4.0, 15.0, dist)) * (1.0 - ice) * (1.0 - 0.7 * track) * uLook.z;
    // storm litter: glazed twigs and branch ends brought down by the ice, thick under the birches, thin on the packed track
    float litK = (0.3 + 0.7 * smoothstep(-20.0, 10.0, a) * (1.0 - smoothstep(3.0, 26.0, al))) * (1.0 - 0.75 * track) * (1.0 - smoothstep(16.0, 34.0, dist));
    if (litK > 0.01 && ice < 0.5) {
      vec3 t1 = twig(p, 1.25, 0.0), t2 = twig(p + 3.3, 0.5, 9.0);
      float w1 = 0.01, w2 = 0.006, aa = fwp * 0.7;
      float c1 = (1.0 - smoothstep(max(w1, aa) - aa * 0.5, max(w1, aa) + aa * 0.5, t1.x)) * min(1.0, w1 / aa + 0.25) * step(t1.y, 0.55 * litK);
      float c2 = (1.0 - smoothstep(max(w2, aa) - aa * 0.5, max(w2, aa) + aa * 0.5, t2.x)) * min(1.0, w2 / aa + 0.2) * step(t2.y, 0.7 * litK);
      float g1 = (1.0 - smoothstep(w1, w1 + 0.03, t1.x)) * step(t1.y, 0.55 * litK), g2 = (1.0 - smoothstep(w2, w2 + 0.018, t2.x)) * step(t2.y, 0.7 * litK);
      float bead = 0.5 + 0.5 * sin((t1.z + t2.z) * 47.0 + dot(V, vec3(37.0, 11.0, 29.0)) + t1.y * 30.0); bead *= bead; bead *= bead; bead *= bead; bead *= bead;
      float cT = max(c1, c2), gT = max(g1, g2 * 0.7);
      col *= 1.0 - 0.22 * gT;                                                   // the hollow each one melted and its shadow
      col = mix(col, vec3(0.085, 0.04, 0.036) * (uSkyCol * 1.2 + uSunCol * lit * 0.6), cT * 0.9);
      col += (uSunCol * lit * 2.6 + uSkyCol * 0.5) * bead * cT * (1.0 - smoothstep(0.02, 0.06, fwp));
    }
    // the pond
    if (ice > 0.002) {
      float drift = vnoise(wq * vec2(0.08, 0.3)) * 0.6 + vnoise(wq * vec2(0.27, 1.0) + 4.0) * 0.4;
      float snowPatch = smoothstep(0.5, 0.66, drift);
      vec2 pk = p + 5.0 * vec2(vnoise(p * 0.11), vnoise(p * 0.11 + 31.7)) + 0.6 * vec2(vnoise(p * 0.9 + 5.0), vnoise(p * 0.9 + 11.0));
      float c1 = cellEdge(pk * 0.16), c2 = cellEdge(pk * 0.61 + 3.1), c3 = cellEdge((pk + V.xz / max(V.y, 0.15) * 0.1) * 0.16 + 0.011);
      float w1 = 0.006, f1 = fwp * 0.16, w2 = 0.008, f2 = fwp * 0.61;
      float crack = (1.0 - smoothstep(w1, w1 + 1.5 * f1, c1)) * min(1.0, w1 / f1 + 0.06) * (0.5 + 0.5 * vnoise(p * 0.7))
                  + 0.5 * (1.0 - smoothstep(w2, w2 + 1.5 * f2, c2)) * min(1.0, w2 / f2) * (1.0 - smoothstep(8.0, 26.0, dist)) * step(0.45, vnoise(p * 0.23 + 9.0))
                  + 0.25 * (1.0 - smoothstep(0.02, 0.02 + 1.5 * f1, c3)) * min(1.0, 0.02 / f1);
      vec2 bq = fract(p * 7.0) - 0.5;
      float bub = step(0.97, hash2(floor(p * 7.0))) * (1.0 - smoothstep(0.08, 0.2, length(bq))) * (1.0 - smoothstep(3.0, 11.0, dist)) * 0.5;
      vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
      float fres = 0.06 + 0.56 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
      vec3 skyR = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.45));
      float az = atan(R.z, R.x + 1e-5);
      float trees = 1.0 - smoothstep(0.03, 0.1, R.y - 0.035 * vnoise(vec2(az * 26.0, 1.0)));
      skyR = mix(skyR, uDeep * 0.8 + uSkyCol * 0.12, trees * 0.6);
      // the birches on the shore stand in the ice as pale wavering stems
      float rl = length(R.xz), stemR = 0.0;
      if (rl > 1e-3) {
        vec2 rn = R.xz / rl; float tanE = R.y / rl;
        vec2 pr = p + 0.25 * vec2(vnoise(p * 1.7 + 3.0), vnoise(p * 1.7 + 19.0)) - 0.125;
        for (int i = 0; i < 8; i++) {
          vec4 tk = uTrunk[i]; vec2 tv = tk.xy - pr; float along = dot(tv, rn), off = abs(tv.x * rn.y - tv.y * rn.x);
          float wd = tk.w + 0.012 * along + 1.2 * fwp;
          stemR = max(stemR, step(0.0, along) * (1.0 - smoothstep(wd * 0.5, wd, off)) * (1.0 - smoothstep(tk.z * 0.6, tk.z, along * tanE)) * min(1.0, tk.w / (0.6 * fwp + 1e-4)));
        }
      }
      skyR = mix(skyR, uSnow * (uSnowSun * 0.55 + uSkyCol * 0.6), stemR * 0.85);
      // a low sun ahead lays its path down the ice: a column of glare toward it, broken by frost and blown snow
      float sAz = rl > 1e-3 ? max(dot(R.xz / rl, uDir.xy), 0.0) : 0.0;
      float sPath = pow(sAz, 260.0) * exp(-abs(R.y - uSun.y) * 5.0) + 0.35 * pow(sAz, 40.0) * exp(-abs(R.y - uSun.y) * 9.0);
      skyR += uSunCol * sPath * uLook.w * 2.0 * (0.45 + 0.55 * vnoise(p * vec2(2.3, 2.3) + 1.0)) * (1.0 - 0.6 * trees);
      float frost = smoothstep(0.3, 0.8, vnoise(wq * vec2(0.05, 0.21) + 7.0) * 0.6 + vnoise(p * 0.8 + 2.0) * 0.4);
      vec3 body = uIceCol * (0.55 + 0.6 * h0) + uSkyCol * 0.085 * frost;
      vec3 iceCol = mix(body, skyR, fres);
      iceCol += (uSkyCol * 0.9 + uSunCol * 0.3) * vec3(0.8, 0.9, 1.0) * (min(crack, 1.0) * 0.55 + bub) * (1.0 - 0.6 * fres);
      iceCol += uSkyCol * (1.0 - smoothstep(0.02, 0.06, gd)) * track * 0.6 * nearK;               // the runners' scratches on the ice
      float snake = smoothstep(0.6, 0.92, vnoise(vec2(wq.x * 0.07 - uTime * 0.9, wq.y * 0.5 + 1.3 * sin(wq.x * 0.11 + uTime * 0.3)))) * (0.4 + 0.6 * vnoise(wq * 0.5 - vec2(uTime * 2.0, 0.0)));
      vec3 snowLit = uSnow * (uSnowSun * sunT * face + uSkyCol * 0.35);
      iceCol = mix(iceCol, snowLit, clamp(snake * uGnd.y, 0.0, 0.7));
      col = mix(col, mix(iceCol, col, snowPatch), ice);
    }
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), 1.0);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// glass rods: sedge tussocks, alder thickets and birch whips, every stem sheathed in ice. Three crossed cards per
// tuft; the fragment shader draws the stems (fwidth antialiased, widened to a pixel and dimmed when smaller)
// ---------------------------------------------------------------------------------------------------------------
const ROD_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec4 aI0;                         // x, y, z, yaw
  attribute vec4 aI1;                         // width, height, kind + seed, arcade distance
  attribute float aCard;
  varying vec2 vUv; varying vec4 vS; varying vec3 vW; varying vec2 vDim;
  void main() {
    vec3 P = position; float y = P.y;
    P.x *= aI1.x; P.y *= aI1.y; P.z *= aI1.x;
    float seed = fract(aI1.z);
    float sway = uWind * 0.05 * aI1.y * y * y;
    P.x += sin(uTime * 1.6 + seed * 40.0 + aI0.x * 0.3) * sway; P.z += cos(uTime * 1.27 + seed * 23.0 + aI0.z * 0.3) * sway;
    float c = cos(aI0.w), s = sin(aI0.w);
    vec3 Q = vec3(P.x * c + P.z * s, P.y, -P.x * s + P.z * c) + aI0.xyz;
    vec4 wp = modelMatrix * vec4(Q, 1.0); vW = wp.xyz;
    vUv = uv; vS = vec4(floor(aI1.z), fract(seed + aCard * 0.137), aI1.w, y * aI1.y); vDim = aI1.xy;
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
// kind 0 sedge and kind 1 alder: stems fanning from the root. kind 2 birch whips and saplings: one leader with side
// twigs that rise from it. Every stem carries its own beads of glaze (spaced in metres, phased per stem, so no two
// line up); where the beads are too fine to draw they become their mean and a few single glints, never a row.
const ROD_F = HERO_GLSL.common + HERO_GLSL.fogF + /* glsl */`
  uniform vec3 uIceTint;
  uniform float uGlint;
  varying vec2 vUv; varying vec4 vS; varying vec3 vW; varying vec2 vDim;
  void main() {
    float x = vUv.x * 2.0 - 1.0, y = vUv.y, kind = vS.x, seed = vS.y;
    float fw = fwidth(x) + 1e-4;
    float yM = y * vDim.y, fwy = fwidth(yM) + 1e-5;                    // metres up the stem, metres a pixel
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    float spread = kind < 0.5 ? 1.1 : 0.9, wid = kind < 0.5 ? 0.02 : (kind < 1.5 ? 0.014 : 0.012);
    float mB = 1.25 * vDim.y / max(vDim.x, 0.1);                       // a twig 32 degrees off the leader, in card units
    float cov = 0.0, sa = 0.0, tip = 0.0, ph = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float h1 = hash1(seed * 31.0 + fi * 7.1), h2 = hash1(seed * 17.0 + fi * 3.3), h3 = hash1(seed * 5.0 + fi * 1.7);
      float cx, w, on, cs = 1.0;
      if (kind > 1.5) {
        if (i == 0) {
          cx = 0.045 * sin(y * 5.0 + seed * 40.0) * y; w = wid * (1.4 - 1.1 * y); on = 1.0;
        } else {
          float y0 = 0.1 + 0.115 * fi + 0.07 * h1, yy = y - y0;
          float m = mB * (0.65 + 0.7 * h2), sg = h3 > 0.5 ? 1.0 : -1.0;
          float lk = min((0.2 + 0.34 * h2) * (1.0 - 0.45 * y0), 0.9 / m);
          cx = 0.045 * sin(y0 * 5.0 + seed * 40.0) * y0 + sg * m * yy * (1.0 - 0.3 * yy / lk);
          w = wid * 0.62 * (1.0 - 0.6 * yy / lk); on = step(0.0, yy) * step(yy, lk);
          float tn = m * vDim.x * 0.5 / max(vDim.y, 0.1); cs = inversesqrt(1.0 + tn * tn);
        }
      } else {
        float len = 0.4 + 0.6 * h3;
        cx = (h1 - 0.5) * 0.2 + (h2 - 0.5) * spread * y + (h1 - 0.5) * 0.9 * y * y;
        w = wid * (1.15 - 0.75 * y / len); on = step(y, len);
      }
      float hw = max(w, 0.7 * fw);
      float c = clamp((hw - abs(x - cx) * cs) / fw + 0.5, 0.0, 1.0) * on * (w / hw);
      if (c > cov) { cov = c; sa = (x - cx) * cs / hw; tip = w / hw; ph = h1 * 41.0 + fi * 2.39; }
    }
    if (kind > 1.5) cov *= 1.0 - 0.6 * smoothstep(25.0, 70.0, dist);       // far saplings thin to a haze the wood shows through
    if (cov < 0.02) discard;
    float lit = litAt(vS.z, vS.w);
    float back = max(dot(-V, uSun), 0.0);
    vec3 core = kind < 0.5 ? vec3(0.46, 0.33, 0.17) : (kind < 1.5 ? vec3(0.13, 0.055, 0.05) : vec3(0.15, 0.058, 0.042));
    vec3 amb = mix(uDeep * 1.4, uSkyCol, 0.75);
    float vw = dot(V, vec3(23.0, 9.0, 17.0));
    float bead = 0.5 + 0.5 * sin(yM * 105.0 + ph + vw + uTime * 0.6); bead *= bead; bead *= bead;
    float unres = smoothstep(0.5, 1.5, fwy * 105.0);
    float cell = exp2(ceil(log2(max(fwy * 2.0, 0.04))));                   // single glints: one cell of stem in a dozen, no two stems alike
    float gl = step(0.92, hash2(vec2(floor(yM / cell) + ph * 3.7, floor(vw * 0.35 + ph))));
    bead = mix(bead, (kind > 1.5 ? 0.03 : 0.12) + 2.4 * gl, unres);
    float edge = smoothstep(0.2, 0.9, abs(sa)) * tip;
    vec3 col = core * (amb + uSunCol * lit * 0.75) * (1.0 - 0.4 * edge) + uIceTint * uSkyCol * 0.6 * edge;
    col *= 0.45 + 0.55 * smoothstep(0.0, 0.25, vS.w);                                            // dark where it stands in the snow
    col += uSunCol * lit * uGlint * (0.16 * edge + bead * (0.55 + 2.0 * back * back) * (0.35 + 0.65 * edge)) * (1.0 - smoothstep(20.0, 60.0, dist) * 0.8);
    float fa = fogAmt();
    gl_FragColor = vec4(mix(col * cov, fogCol() * cov, fa), cov);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// mountain-ash: dark glazed stems and clusters of red berries (camera-facing cards; the berries are drawn in the
// fragment shader as glazed beads, and far away a cluster closes into one red bead so the accent never aliases)
// ---------------------------------------------------------------------------------------------------------------
const ASH_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute float aK;                         // 0 bark, 1 berry card
  attribute vec4 aI0;                         // x, y, z, yaw
  attribute vec4 aI1;                         // scale, seed, arcade distance, -
  uniform vec4 uMir;                          // 1 = this is the tree's image in the pond ice, the ice's height, -, -
  varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec4 vS; varying vec3 vSunV;
  void main() {
    vec3 P = position * aI1.x;
    float sw = uWind * 0.012 * position.y;
    P.x += sin(uTime * 1.1 + aI1.y * 30.0 + position.y * 0.7) * sw; P.z += cos(uTime * 0.93 + aI1.y * 17.0 + position.y * 0.5) * sw;
    float c = cos(aI0.w), s = sin(aI0.w);
    vec3 Q = vec3(P.x * c + P.z * s, P.y, -P.x * s + P.z * c) + aI0.xyz;
    if (uMir.x > 0.5) Q.y = 2.0 * uMir.y - Q.y;
    vN = vec3(normal.x * c + normal.z * s, normal.y, -normal.x * s + normal.z * c);
    vec4 wp = modelMatrix * vec4(Q, 1.0); vW = wp.xyz;
    vec4 mv = viewMatrix * wp;
    if (aK > 0.5) mv.xy += (uv * 2.0 - 1.0) * 0.14 * aI1.x;
    vUv = uv; vS = vec4(aK, fract(dot(position, vec3(12.9898, 78.233, 37.719)) * 43.7 + aI1.y), aI1.z, P.y);
    vSunV = (viewMatrix * vec4(uSun, 0.0)).xyz;
    gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const ASH_F = HERO_GLSL.common + HERO_GLSL.fogF + /* glsl */`
  uniform vec3 uRed;
  uniform vec4 uMir, uPondC;                  // uPondC: the pond's centre (x, z) and the trail's direction there
  varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec4 vS; varying vec3 vSunV;
  void main() {
    float lit = litAt(vS.z, vS.w);
    float mirA = 1.0;
    if (uMir.x > 0.5) {                       // the image lies under the ice: shown only where the ray to it crosses the pond, by the ice's own mirror strength
      float tI = (cameraPosition.y - uMir.y) / max(cameraPosition.y - vW.y, 1e-3);
      vec2 ip = cameraPosition.xz + (vW.xz - cameraPosition.xz) * tI + 0.07 * sin(vW.y * 9.0 + vW.x * 3.0 + uTime * 0.7);
      vec2 rel = ip - uPondC.xy;
      float e = length(vec2(dot(rel, uPondC.zw) / 31.0, (rel.x * uPondC.w - rel.y * uPondC.z) / 46.0));
      float vy = (cameraPosition.y - uMir.y) / max(length(cameraPosition - vec3(ip.x, uMir.y, ip.y)), 1e-3);
      mirA = (1.0 - smoothstep(0.7, 0.84, e)) * clamp(0.14 + 1.15 * pow(1.0 - clamp(vy, 0.0, 1.0), 4.5), 0.0, 0.82) * step(vW.y, uMir.y) * step(uMir.y, cameraPosition.y);
      if (mirA < 0.01) discard;
    }
    vec3 col;
    if (vS.x > 0.5) {
      vec2 q = vUv * 2.0 - 1.0; float cid = vS.y * 91.0;
      float fw = fwidth(q.x) + 1e-4;
      float far = smoothstep(0.1, 0.3, fw);
      float inside = 0.0; vec2 nn = vec2(0.0);
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 c = (vec2(hash1(cid + fi * 1.3), hash1(cid * 1.7 + fi * 2.9)) - 0.5) * 1.35;
        vec2 d = (q - c) / 0.27;
        if (dot(d, d) < 1.0) { inside = 1.0; nn = d; }
      }
      float r = length(q);
      if (inside < 0.5 && (far < 0.5 || r > 0.45)) discard;
      if (inside < 0.5) nn = q / 0.45;
      vec3 n = vec3(nn, sqrt(max(1.0 - dot(nn, nn), 0.0)));
      float ndl = dot(n, vSunV);
      vec3 hh = normalize(vSunV + vec3(0.0, 0.0, 1.0001));
      float sp = pow(max(dot(n, hh), 0.0), 50.0);
      col = uRed * (uSunCol * lit * clamp(ndl * 0.6 + 0.45, 0.0, 1.0) * 0.55 + uSkyCol * 0.5 + 0.12);
      col += uSunCol * lit * sp * 1.6 + uSkyCol * 0.35 * pow(1.0 - n.z, 3.0);
      float thru = max(-vSunV.z, 0.0);                                         // against the light every bead is a small red lamp with a bright edge
      col += uRed * uSunCol * lit * thru * thru * (0.3 + 0.9 * pow(1.0 - n.z, 2.0));
    } else {
      vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
      vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
      float ndl = dot(N, uSun), wrap = clamp(ndl * 0.8 + 0.2, 0.0, 1.0);
      vec3 alb = vec3(0.11, 0.085, 0.08) * (0.8 + 0.4 * hash2(floor(vec2(vW.y * 9.0, vW.x * 5.0 + vW.z * 5.0))));
      vec3 fill = mix(uDeep * 1.5, uSkyCol, 0.35 + 0.65 * (N.y * 0.5 + 0.5));
      col = alb * (uSunCol * lit * wrap * 0.6 + fill);
      vec3 Hh = normalize(uSun + V + vec3(0.0, 1e-4, 0.0));
      float fres = 1.0 - max(dot(N, V), 0.0); fres = fres * fres * fres;
      float ndh = max(dot(N, Hh), 0.0);
      col += uSunCol * lit * (pow(ndh, 160.0) * 5.0 + fres * 1.6 * max(dot(-V, uSun), 0.0)) + uSkyCol * fres * 1.1;
    }
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()) * mirA, mirA);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// creatures and props under the hero's light: dogs, hare, fox, lynx, owl, sled, lodge and sticks share one rig.
//   aRig = part, w, pivot y, pivot z.  part 0 torso (w -1 rump .. +1 chest) | 1-4 legs HL HR FL FR (w > 0.5 below the
//   knee) | 5 tail (w 0..1) | 6 head and neck | 7, 8 wings (w 0..1 along the span, pivot y = shoulder x)
//   aKnee = knee y, knee z, coat (0 base colour .. 1 instance tint .. 2 dark points)
// ---------------------------------------------------------------------------------------------------------------
const CRIT_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec4 aRig; attribute vec3 aKnee; attribute vec3 color;
  attribute vec4 aI0;                         // x, y, z, yaw
  attribute vec4 aI1;                         // gait phase, pitch, run (0 standing .. 1), arcade distance
  attribute vec3 aTint;
  uniform vec4 uGait, uAmp, uBob;             // leg phases | hind swing, fore swing, knee fold, body rock | bob, spine flex, tail sway, hip height
  uniform float uScale;
  varying vec3 vN, vW, vObj, vCol, vTint, vL;
  vec2 rotYZ(vec2 q, float t) { float c = cos(t), s = sin(t); return vec2(q.x * c + q.y * s, -q.x * s + q.y * c); }
  void main() {
    float ph = aI1.x, run = aI1.z, part = aRig.x, w = aRig.y;
    vec3 P = position, Nn = normal;
    if (part > 0.5 && part < 4.5) {
      float lp = part < 1.5 ? uGait.x : (part < 2.5 ? uGait.y : (part < 3.5 ? uGait.z : uGait.w));
      float a = ph + lp;
      float sw = mix(uAmp.y, uAmp.x, step(part, 2.5)) * sin(a) * run;
      float fold = uAmp.z * max(0.0, sin(a + 1.9)) * run;
      vec2 hip = aRig.zw;
      vec2 k2 = hip + rotYZ(aKnee.xy - hip, sw);
      vec2 q = hip + rotYZ(P.yz - hip, sw);
      if (w > 0.5) q = k2 + rotYZ(q - k2, -fold);
      Nn.yz = rotYZ(Nn.yz, sw - step(0.5, w) * fold);
      P.yz = q;
    } else if (part < 0.5) {
      P.y += uBob.y * sin(ph + 0.6) * (w * w - 0.35) * run;
    } else if (part < 5.5) {
      P.x += w * w * uBob.z * (sin(ph + w * 2.5 + aTint.r * 40.0) * run + 0.7 * sin(uTime * 4.0 + aTint.g * 30.0) * (1.0 - run));
      P.y += w * w * uBob.z * 0.6 * sin(ph * 2.0 + w * 3.0) * run;
    } else if (part < 6.5) {
      float nod = -uAmp.w * 0.9 * sin(ph + 0.3) * run + 0.04 * sin(uTime * 1.3 + aTint.b * 20.0);
      P.yz = aRig.zw + rotYZ(P.yz - aRig.zw, nod); Nn.yz = rotYZ(Nn.yz, nod);
    } else {
      float sgn = part < 7.5 ? -1.0 : 1.0, xs = aRig.z;
      float span = abs(P.x) - xs, fold = 1.0 - run;
      float th = (uAmp.x * sin(ph - w * 0.9) + uAmp.y) * (0.35 + 0.65 * w) * run;
      float sp = span * mix(1.0, 0.16, fold);
      P.x = sgn * (xs + sp * cos(th));
      P.y += sp * sin(th) - fold * w * 0.2;
      P.z -= fold * w * 0.3;
    }
    float pitch = uAmp.w * sin(ph + 0.3) * run * step(part, 6.5) + aI1.y;
    P.yz = vec2(uBob.w, 0.0) + rotYZ(vec2(P.y - uBob.w, P.z), pitch); Nn.yz = rotYZ(Nn.yz, pitch);
    P.y += uBob.x * (0.5 - 0.5 * cos(ph + 0.9)) * run;
    float c = cos(aI0.w), s = sin(aI0.w);
    vec3 Q = vec3(P.x * c + P.z * s, P.y, -P.x * s + P.z * c) * uScale + aI0.xyz;
    vN = vec3(Nn.x * c + Nn.z * s, Nn.y, -Nn.x * s + Nn.z * c);
    vec4 wp = modelMatrix * vec4(Q, 1.0); vW = wp.xyz; vObj = position; vCol = color; vTint = aTint;
    vL = vec3(aKnee.z, aI1.w, P.y * uScale);
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const CRIT_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec3 uDark;
  uniform vec4 uFur;                          // fur noise, rim, contact shade height, self light
  uniform float uWeave;                       // canvas folds and weave on parts whose coat is 0.4 (the sled's load)
  uniform vec4 uCoat;                         // fur relief on the normal, shade pulled toward slate, sun rim, bars across the flight feathers (per metre; the owl)
  uniform vec3 uBounce;                       // light thrown up by sunlit snow (the look with the sun ahead: backs in shade keep their colour)
  varying vec3 vN, vW, vObj, vCol, vTint, vL;
  void main() {
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
    vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
    if (uCoat.x > 0.0) {                      // guard hairs: the light breaks up across the coat instead of sliding over a smooth tube
      vec3 fq = vObj * vec3(46.0, 30.0, 17.0);
      N = normalize(N + uCoat.x * 0.6 * (vec3(vnoise(fq.xy + fq.z), vnoise(fq.yz + 7.0 + fq.x), vnoise(fq.zx + 3.0 + fq.y)) - 0.5));
    }
    float coat = vL.x;
    vec3 alb = coat <= 1.0 ? mix(vCol, vTint, clamp(coat, 0.0, 1.0)) : mix(vTint, uDark, clamp(coat - 1.0, 0.0, 1.0));
    alb *= 1.0 + uFur.x * (vnoise(vObj.xz * vec2(70.0, 11.0) + vObj.y * 45.0) - 0.5);
    float cloth = uWeave * (1.0 - smoothstep(0.03, 0.12, abs(coat - 0.4)));
    alb *= 1.0 + cloth * (0.5 * (vnoise(vec2(vObj.z * 13.0 + vObj.x * 5.0, vObj.y * 16.0 - vObj.x * 9.0)) - 0.5) + 0.07 * sin(vObj.x * 430.0) * sin(vObj.z * 430.0) * (1.0 - smoothstep(1.2, 3.2, length(cameraPosition - vW))));
    if (uCoat.w > 0.0) {                      // the owl: dark bars across the flight feathers and the tail, rings round each eye
      float wing = smoothstep(0.1, 0.17, abs(vObj.x)), tailK = 1.0 - smoothstep(-0.26, -0.18, vObj.z);
      float bz = vObj.z * uCoat.w + abs(vObj.x) * 3.0;
      float bar = 1.0 - smoothstep(0.2, 0.34, abs(fract(bz) - 0.5));
      alb *= 1.0 - 0.6 * bar * max(wing, tailK);
      alb *= 1.0 + 0.35 * wing * (1.0 - bar) * smoothstep(0.5, 0.75, abs(vObj.x));              // pale between the bars toward the tips
      float faceK = step(0.3, vObj.z) * (1.0 - wing);
      float ring = 0.5 + 0.5 * sin(length(vec2(abs(vObj.x) - 0.048, vObj.y - 0.022)) * 330.0);
      alb *= 1.0 - 0.45 * faceK * ring * smoothstep(0.036, 0.05, length(vec2(abs(vObj.x) - 0.048, vObj.y - 0.022)));
    }
    float lit = litAt(vL.y, vL.z);
    float ndl = dot(N, uSun), wrap = clamp(ndl * 0.75 + 0.25, 0.0, 1.0);
    vec3 fill = mix(uDeep * 1.5, uSkyCol, 0.35 + 0.65 * (N.y * 0.5 + 0.5));
    fill = mix(fill, vec3(0.94, 1.0, 1.1) * dot(fill, vec3(0.3, 0.5, 0.2)), uCoat.y);                 // pale fur in shade is slate, not cobalt
    vec3 col = alb * (uSunCol * lit * wrap * 0.5 + fill + uFur.w + uBounce * (0.75 - 0.25 * N.y));
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    col += (uSunCol * lit * max(ndl + 0.5, 0.0) * (0.3 + 0.55 * uCoat.z) + uSkyCol * 0.22 * (1.0 - 0.65 * uCoat.y)) * fres * uFur.y * (0.35 + 0.65 * alb);
    col *= 0.55 + 0.45 * smoothstep(0.0, uFur.z, vL.z);
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), 1.0);
  }
`;

// soft powder / breath / steam sprites, fed from the CPU every frame (a hundred or so)
const PUFF_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec4 aP;                          // centre, size
  attribute vec4 aC;                          // alpha, lit, seed, -
  varying vec2 vUv; varying vec3 vC; varying vec2 vSun; varying float vBack;
  void main() {
    vSun = (viewMatrix * vec4(uSun, 0.0)).xy;
    vec4 wp0 = modelMatrix * vec4(aP.xyz, 1.0);
    vBack = max(dot(normalize(wp0.xyz - cameraPosition + vec3(0.0, 1e-4, 0.0)), uSun), 0.0);
    vec4 mv = viewMatrix * wp0;
    float d = max(-mv.z, 0.05);
    float size = min(aP.w, d * 0.9);
    mv.xy += position.xy * size;
    vUv = position.xy * 2.0; vC = vec3(aC.x * smoothstep(0.7, 2.4, d), aC.y, aC.z);
    gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const PUFF_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec3 uSnow;
  varying vec2 vUv; varying vec3 vC; varying vec2 vSun; varying float vBack;
  void main() {
    float r = length(vUv);
    float soft = exp(-r * r * 3.0) * (1.0 - smoothstep(0.75, 1.0, r));
    float n = vnoise(vUv * 2.6 + vC.z * 17.0 + uTime * 0.35);
    float a = soft * (0.5 + 0.7 * n) * vC.x;
    if (a < 0.004) discard;
    // lit from the side like everything else: a rose-gold sun flank, a blue shaded flank, so powder shows against snow
    float sl = length(vSun);
    float sideK = clamp(dot(vUv, vSun / max(sl, 1e-3)) * 1.3 + 0.2 * vUv.y, -1.0, 1.0) * smoothstep(0.05, 0.3, sl);
    vec3 col = uSnow * (uSunCol * vC.y * (0.12 + 0.9 * smoothstep(-0.5, 0.8, sideK) + 0.25 * n) + mix(uDeep * 1.7, uSkyCol, 0.62) * (1.15 - 0.4 * sideK));
    // against the light a plume is lit through: its thin rim burns, its thick middle stays blue
    float bk = vBack * vBack; bk *= bk;
    col += uSnow * uSunCol * vC.y * bk * (0.25 + 1.3 * smoothstep(0.25, 0.95, r) + 0.5 * n);
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()) * a, a);
  }
`;

// the team's wake: one low layer of blown powder from the leaders' feet back past the runners. Three thin sheets a hand
// apart follow the track under the dogs; the smoke in them is fixed to the snow it was kicked from, so it hangs and
// thins while the team runs on, and it is lit from the side like everything else. No sprite, so no countable disc.
const WAKE_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec3 aA;                          // metres ahead of the eye, lateral, layer (0 low .. 1 top)
  uniform vec4 uWake;                         // the sled's track distance, powder amount, light, -
  varying vec3 vA; varying float vD; varying vec3 vW;
  void main() {
    vA = aA; vD = uWake.x + aA.x;
    vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const WAKE_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec3 uSnow;
  uniform vec4 uWake;
  varying vec3 vA; varying float vD; varying vec3 vW;
  float kick(float b) { return smoothstep(-0.5, 0.2, b) * exp(-max(b, 0.0) / 2.6); }
  void main() {
    float a = vA.x, l = vA.y, ly = vA.z;
    // thrown at each pair of dogs and by the runners, spreading as it hangs
    float src = 0.62 * (kick(3.5 - a) + kick(5.8 - a) + kick(8.1 - a)) + 0.5 * kick(2.4 - a);
    float wd = 0.42 + 0.075 * (8.6 - a) + 0.1 * ly;
    float dens = min(src, 1.25) * exp(-l * l / (wd * wd));
    vec2 q = vec2(vD * 0.95 + ly * 2.3, l * 1.5 + uTime * 0.12 + ly * 1.9);
    float n = vnoise(q) * 0.58 + vnoise(q * 2.4 + vec2(uTime * 0.5, 5.0)) * 0.42;
    float sgn = uSkew > 0.0 ? 1.0 : -1.0;
    float n2 = vnoise(q + vec2(-0.12, 0.4 * sgn)) * 0.58 + vnoise((q + vec2(-0.12, 0.4 * sgn)) * 2.4 + vec2(uTime * 0.5, 5.0)) * 0.42;
    float body = smoothstep(0.32 + 0.22 * ly, 0.8 + 0.1 * ly, n + 0.4 * dens);
    float dist = length(cameraPosition - vW);
    float al = dens * body * (0.62 - 0.26 * ly) * uWake.y * smoothstep(1.0, 3.0, dist);
    if (al < 0.004) discard;
    float side = clamp(0.5 + (n - n2) * 2.6, 0.0, 1.0);                       // thinner toward the sun: that flank takes the light
    vec3 col = uSnow * (uSunCol * uWake.z * (0.16 + 0.8 * side) + mix(uDeep * 1.7, uSkyCol, 0.6) * (1.15 - 0.45 * side));
    float bk = max(dot(normalize(vW - cameraPosition + vec3(0.0, 1e-4, 0.0)), uSun), 0.0); bk *= bk; bk *= bk;
    col += uSnow * uSunCol * uWake.z * bk * (0.2 + 0.8 * (1.0 - body) + 0.45 * ly);       // blown powder against the light: the thin top of it burns
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()) * al, al);
  }
`;

// black spruce for the close pass (the three at the portal and the near clumps): a dark core spire closes the tree,
// and drooping boughs stand off it as crossed cards whose ragged needle outline, glaze sheen and tip glints are drawn here
const SPR_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec2 aK;                          // 0 core / 1 bough, seed
  attribute vec4 aI0;                         // x, y, z, yaw
  attribute vec4 aI1;                         // scale, seed, arcade distance, -
  varying vec2 vUv; varying vec3 vN, vW; varying vec4 vS;
  void main() {
    vec3 P = position * aI1.x;
    float tipw = uv.y * uv.y * step(0.5, aK.x);
    P.y += sin(uTime * 1.5 + aK.y * 40.0 + aI1.y * 9.0) * 0.045 * tipw * uWind * aI1.x;
    float sw = uWind * 0.0016 * P.y * P.y;
    P.x += sin(uTime * 0.8 + aI1.y * 30.0) * sw; P.z += cos(uTime * 0.67 + aI1.y * 17.0) * sw;
    float c = cos(aI0.w), s = sin(aI0.w);
    vec3 Q = vec3(P.x * c + P.z * s, P.y, -P.x * s + P.z * c) + aI0.xyz;
    vN = vec3(normal.x * c + normal.z * s, normal.y, -normal.x * s + normal.z * c);
    vec4 wp = modelMatrix * vec4(Q, 1.0); vW = wp.xyz;
    vUv = uv; vS = vec4(aK.x, aK.y + aI1.y, aI1.z, P.y);
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const SPR_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec3 uIceTint;
  uniform float uGlint;
  varying vec2 vUv; varying vec3 vN, vW; varying vec4 vS;
  void main() {
    float u = vUv.x, v = vUv.y, au = abs(u), seed = vS.y;
    float shade = 0.5, tipK = 0.0, lock = 0.5;
    if (vS.x > 0.5) {
      // branchlets leave the rib and sweep toward the tip, each ending in its own point: a ragged, shaggy outline
      float k1 = v * 6.5 - au * 1.7 + seed * 9.0, k2 = v * 23.0 - au * 5.5 + seed * 31.0;
      float t1 = abs(fract(k1) * 2.0 - 1.0), t2 = abs(fract(k2) * 2.0 - 1.0);
      float envl = (1.0 - 0.72 * v * v) * smoothstep(-0.02, 0.1, v);
      float w = envl * (0.4 + 0.4 * t1 + 0.2 * t2);
      if (au > w) discard;
      float e = au / max(w, 0.02);
      shade = (0.42 + 0.58 * smoothstep(0.0, 0.85, e)) * (0.5 + 0.5 * smoothstep(0.0, 0.5, v));
      tipK = smoothstep(0.5, 1.0, e) * (0.4 + 0.6 * v);
      lock = hash1(floor(k1) * 3.1 + seed * 7.0);
    }
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
    float lit = litAt(vS.z, vS.w);
    float ndl = dot(N, uSun), wrap = clamp(ndl * 0.7 + 0.3, 0.0, 1.0);
    vec3 alb = vec3(0.036, 0.074, 0.062) * (0.7 + 0.6 * lock) * shade;
    vec3 fill = mix(uDeep * 1.5, uSkyCol, 0.4 + 0.6 * (N.y * 0.5 + 0.5));
    vec3 col = alb * (uSunCol * lit * wrap * (vS.x > 0.5 ? 1.1 : 0.25) + fill * 1.25);
    // the glaze: a cold sheen on every bough end, beads of fire along the tips on the sun side
    float sunSide = smoothstep(-0.15, 0.45, ndl);
    vec2 gc = floor(vec2(u * 8.0, v * 26.0));
    float sp = step(0.9, hash2(gc + seed * 17.0 + floor(dot(V, vec3(19.0, 7.0, 13.0)) * 4.0 + hash2(gc) * 6.0))) * step(0.5, vS.x);     // boughs only: the core has no beads
    float back = max(dot(-V, uSun), 0.0);
    col += uIceTint * uSkyCol * 0.2 * tipK;
    col += uSunCol * lit * uGlint * sunSide * (0.2 * tipK + sp * (0.5 + 1.6 * tipK) * (0.6 + 1.4 * back * back)) * (1.0 - 0.75 * smoothstep(25.0, 80.0, dist));
    col *= 0.6 + 0.4 * smoothstep(0.0, 1.6, vS.w);
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), 1.0);
  }
`;

// shafts of low sun in the air: long thin beams that lie down the light, each a ribbon turned to the eye about its
// own axis. They show against the light (the dust in them scatters forward), fade when seen end-on or from within, are
// cut off by trunks, and carry drifting glints: the ice dust that sifts through them. Lit by the same sliding front.
const BEAM_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec4 aB0;                         // the sun end of the beam (x, y, z), length
  attribute vec4 aB1;                         // width, seed, arcade distance, height above the snow at its middle
  varying vec2 vUv; varying vec4 vB; varying vec3 vW;
  void main() {
    vec3 C = aB0.xyz - uSun * (aB0.w * position.y);
    vec3 toEye = cameraPosition - C;
    vec3 sideV = cross(uSun, toEye); float sl = length(sideV); sideV = sl > 1e-4 ? sideV / sl : vec3(1.0, 0.0, 0.0);
    float d = length(toEye);
    float w = max(aB1.x, 0.004 * d);
    vec4 wp = modelMatrix * vec4(C + sideV * (position.x * w), 1.0); vW = wp.xyz;
    vUv = vec2(position.x * 2.0, position.y); vB = vec4(aB1.y, aB1.z, aB1.w, aB0.w);
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const BEAM_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec4 uBeam;                         // strength, glints, -, -
  varying vec2 vUv; varying vec4 vB; varying vec3 vW;
  void main() {
    float x = vUv.x, y = vUv.y, seed = vB.x, len = vB.w;
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    float back = max(dot(-V, uSun), 0.0);
    float sinA = sqrt(max(1.0 - back * back, 0.0));
    float ends = sin(3.14159 * y); ends *= ends;
    float m = y * len;
    float body = exp(-x * x * 3.0) * (1.0 - smoothstep(0.6, 1.0, abs(x))) * (0.5 + 0.5 * vnoise(vec2(m * 0.22 + seed * 31.0 - uTime * 0.06, seed * 9.0 + x * 0.7)));
    float lit = litAt(vB.y, vB.z);
    float b2 = back * back, phase = 0.07 + 0.93 * b2 * b2 * b2;
    float k = ends * lit * smoothstep(0.05, 0.22, sinA) * smoothstep(2.0, 7.0, dist) * (1.0 - fogAmt()) * uBeam.x;
    // glints: single crystals turning in the beam, drifting down it
    vec2 gc = vec2(x * 3.0, m * 5.0 + uTime * 0.35 + seed * 50.0), gi = floor(gc), gf = fract(gc) - 0.5;
    float gh = hash2(gi + seed * 17.0);
    float tw = hash2(gi * 1.3 + floor(uTime * 3.0 + gh * 9.0)); tw *= tw; tw *= tw;
    float px = fwidth(m) * 5.0;
    float glint = step(0.9, gh) * tw * (1.0 - smoothstep(0.06, 0.16 + px, length(gf))) * min(1.0, 0.4 / (px + 0.1)) * (1.0 - smoothstep(0.75, 1.0, abs(x)));
    vec3 col = uSunCol * (body * phase * 0.17 + glint * (0.5 + 2.5 * b2) * uBeam.y) * k;
    gl_FragColor = vec4(col, 0.0);
  }
`;

// ganglines: camera-facing ribbons that never get thinner than a pixel and a half
const LINE_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec3 aTan; attribute float aSide;
  uniform float uPx, uW;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec2 t = (modelViewMatrix * vec4(aTan, 0.0)).xy; float tl = length(t);
    t = tl > 1e-5 ? t / tl : vec2(1.0, 0.0);
    float d = max(-mv.z, 0.3);
    mv.xy += vec2(-t.y, t.x) * aSide * max(uW, 1.7 * uPx * d) * 0.5;
    gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const LINE_F = HERO_GLSL.common + HERO_GLSL.fogF + /* glsl */`
  uniform vec3 uLineCol; uniform float uLit;
  void main() {
    vec3 col = uLineCol * (uSkyCol * 0.9 + uSunCol * uLit * 0.5);
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), 1.0);
  }
`;

// the far wood: one ring of bare-crown silhouette in the haze, its top lit
const RING_V = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const RING_F = /* glsl */`
  uniform vec3 uLow, uTop, uHaze;
  varying vec2 vUv;
  float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vn(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h2(vec2(i, 3.0)), h2(vec2(i + 1.0, 3.0)), f); }
  void main() {
    float x = vUv.x * 520.0;
    float top = 0.42 + 0.22 * vn(x * 0.11) + 0.2 * vn(x * 0.6) + 0.12 * vn(x * 2.3);
    float y = vUv.y;
    if (y > top) discard;
    float k = smoothstep(top - 0.3, top, y);
    vec3 col = mix(uLow, uTop, k * k);
    gl_FragColor = vec4(mix(col, uHaze, 0.5 + 0.35 * (1.0 - y)), 1.0);
  }
`;

// the ranges on the horizon: three ridges, each hazier than the one before it, snow lit rose on the faces that look at
// the sun and blue on the others, gullies running down from the crests, dark timber on the foothills. Highest ahead and
// to the shade side of the trail, low behind. Drawn on a far cylinder that follows the eye; its own haze, no fog.
const MTN_V = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const MTN_F = /* glsl */`
  uniform vec3 uLitC, uShadeC, uHazeC, uTimber;
  uniform vec4 uMt;                           // bearing of the high range (0..1 round the cylinder), bearing of the sun, peak height, horizon line
  varying vec2 vUv;
  float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  float vn(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
  float ridge(float x, float seed) {
    float a = 0.0, w = 0.52, f = 1.0;
    for (int i = 0; i < 5; i++) { float n = vn(x * f + seed + float(i) * 17.3); a += w * (1.0 - abs(2.0 * n - 1.0)); w *= 0.5; f *= 2.13; }
    return a;
  }
  void main() {
    float az = vUv.x, y = (vUv.y - uMt.w) / (1.0 - uMt.w);
    float fw = fwidth(vUv.y) / (1.0 - uMt.w) + 1e-4;
    float dAz = abs(fract(az - uMt.x + 0.5) - 0.5) * 2.0;
    float env = 0.36 + 0.64 * pow(1.0 - smoothstep(0.0, 0.8, dAz), 1.4);
    float sunS = sin((az - uMt.y) * 6.2832);
    vec3 col = vec3(0.0); float alpha = 0.0;
    for (int L = 0; L < 3; L++) {
      float fl = float(L) * 0.5;
      float x = az * mix(38.0, 74.0, fl), seed = 11.0 + float(L) * 53.0, e = 0.012;
      float rr = ridge(x, seed), dr = (ridge(x + e, seed) - ridge(x - e, seed)) / (2.0 * e);
      float r = uMt.z * mix(1.0, 0.36, fl) * (mix(env, 0.8, fl) * (0.16 + 0.84 * rr) + 0.05);
      float cover = 1.0 - smoothstep(r - fw, r + fw, y);
      if (cover < 0.004) continue;
      float below = (r - y) / max(r, 1e-3);                                     // 0 on the crest .. 1 at the foot
      float gul = vn(x * 6.0 + below * 9.0 * (dr > 0.0 ? 1.0 : -1.0) + seed);
      float face = clamp(0.5 + sunS * (dr * 0.55 + (gul - 0.5) * 1.5), 0.0, 1.0);
      face = smoothstep(0.25, 0.75, face);
      vec3 c = mix(uShadeC, uLitC, face * (0.55 + 0.45 * (1.0 - below)));
      float rock = smoothstep(0.55, 0.8, vn(x * 17.0 + below * 23.0)) * smoothstep(0.03, 0.2, below) * (1.0 - fl);
      c = mix(c, uTimber * 1.6 + uShadeC * 0.25, rock * 0.45);
      float timber = smoothstep(mix(0.72, 0.3, fl), mix(0.95, 0.75, fl), below + 0.12 * vn(x * 31.0)) * mix(0.4, 0.9, fl);
      c = mix(c, uTimber, timber);
      float hz = clamp(mix(0.66, 0.34, fl) + 0.3 * below * below, 0.0, 0.96);
      c = mix(c, uHazeC, hz);
      col = col * (1.0 - cover) + c * cover; alpha = alpha * (1.0 - cover) + cover;
    }
    gl_FragColor = vec4(col, alpha) * smoothstep(-0.02, 0.03, y);
  }
`;

// the standing wood beyond 60 m: big cards, each a row of iced birches (white stems, a haze of glazed twigs that
// takes the light) with a dark spruce here and there; fwidth antialiased, fogged, lit by the same front
const WOOD_V = HERO_GLSL.common + HERO_GLSL.fogV + /* glsl */`
  attribute vec4 aI0;                         // x, y, z, yaw
  attribute vec4 aI1;                         // width, height, seed, arcade distance
  varying vec2 vUv; varying vec4 vS; varying vec3 vW;
  void main() {
    float c = cos(aI0.w), s = sin(aI0.w), x = position.x * aI1.x;
    vec3 Q = vec3(x * c, position.y * aI1.y, -x * s) + aI0.xyz;
    vec4 wp = modelMatrix * vec4(Q, 1.0); vW = wp.xyz;
    vUv = vec2((position.x + 0.5) * aI1.x / 3.4, position.y); vS = vec4(aI1.z, aI1.w, position.y * aI1.y, aI1.x / 3.4);
    vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
` + FOG_VS + `  }
`;
const WOOD_F = HERO_GLSL.common + HERO_GLSL.fogF + VNOISE + /* glsl */`
  uniform vec3 uBark, uTwigCol, uIceTint;
  uniform float uGlint;
  varying vec2 vUv; varying vec4 vS; varying vec3 vW;
  // one row of birches: x = overall cover, y = the stem's share of it, z = twig density
  vec3 birches(float x, float y, float seed, float fwx, float hK) {
    float cell = floor(x), fx = fract(x);
    float h1 = hash2(vec2(cell, seed * 91.0)), h2 = hash2(vec2(cell + 7.0, seed * 37.0));
    float hTop = (0.5 + 0.48 * h1) * hK, yy = y / hTop;
    float dx = fx - (0.3 + 0.4 * h2 + (h1 - 0.5) * 0.5 * y * y);
    float w = 0.024 * (1.0 - 0.8 * min(yy, 1.0)) + 0.004, hw = max(w, 0.6 * fwx);
    float trunk = clamp((hw - abs(dx)) / fwx + 0.5, 0.0, 1.0) * step(yy, 1.0) * min(1.0, w / hw + 0.3);
    float cr = exp(-dx * dx / 0.11) * smoothstep(0.22, 0.5, yy) * (1.0 - smoothstep(0.82, 1.1, yy));
    float tw = vnoise(vec2(x * 9.0, y * 46.0) + seed * 13.0) * 0.6 + vnoise(vec2(x * 31.0 + 3.0, y * 19.0)) * 0.4;
    float crown = cr * smoothstep(0.3, 0.62, tw) * 0.8;
    return vec3(max(trunk, crown), trunk, tw);
  }
  void main() {
    float x = vUv.x, y = vUv.y, seed = vS.x;
    float fwx = fwidth(x) + 1e-4;
    float edgeK = smoothstep(0.0, 0.5, x) * smoothstep(0.0, 0.5, vS.w - x);
    float lit = litAt(vS.y, vS.z);
    vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
    float back = max(dot(-V, uSun), 0.0);
    vec3 fill = mix(uDeep * 1.4, uSkyCol, 0.7);
    vec3 b1 = birches(x, y, seed, fwx, 1.0), b2 = birches(x * 1.7 + 0.37, y, seed + 0.31, fwx * 1.7, 0.74);
    float a = max(b1.x, b2.x), tr = max(b1.y, b2.y * 0.8), tw = max(b1.z, b2.z);
    float scar = step(0.72, hash2(vec2(floor(x * 1.7), floor(y * 26.0) + seed)));
    vec3 bark = uBark * 0.62 * (1.0 - 0.4 * scar) * (uSunCol * lit * 0.5 + fill);
    vec3 twig = mix(uTwigCol, uIceTint * 0.55, 0.5) * (fill + uSunCol * lit * 0.4) + uSunCol * lit * uGlint * (0.03 + 0.4 * back * back) * smoothstep(0.45, 0.7, tw);
    vec3 col = mix(twig, bark, tr / max(a, 1e-3));
    // a spruce here and there: a dark stepped spire with glazed bough tips
    float xs = x * 0.42 + seed * 7.0, cs = floor(xs), fs = fract(xs);
    float g1 = hash2(vec2(cs, seed * 53.0)), g2 = hash2(vec2(cs + 3.0, seed * 29.0));
    float hS = 0.45 + 0.4 * g2, ys = y / hS, sx = fs - (0.3 + 0.4 * g2);
    float sw = 0.13 * (1.0 - ys) * (0.72 + 0.28 * abs(fract(ys * 9.0) - 0.5) * 2.0) + 0.006;
    float aS = clamp((sw - abs(sx)) / (fwx * 0.42) + 0.5, 0.0, 1.0) * step(ys, 1.0) * step(0.62, g1);
    float tipK = smoothstep(0.5, 1.0, abs(sx) / max(sw, 0.01));
    vec3 spruce = vec3(0.03, 0.055, 0.05) * (fill + uSunCol * lit * 0.5) + (uSkyCol * 0.3 + uSunCol * lit * 0.2) * tipK;
    col = mix(col, spruce, aS); a = max(a, aS) * edgeK;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()) * a, a);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// geometry builders
// ---------------------------------------------------------------------------------------------------------------
function makeGeo() {
  const pos = [], nrm = [], col = [], rig = [], knee = [], idx = [];
  const g = {
    // a tube through rings whose axis lies in (or parallel to) the sagittal plane.
    // ring: { p:[x,y,z], r:[across, other], w, coat: number | (up, side) => number, c:[r,g,b] }
    tube(rings, sides, part, piv, kn, c0 = [1, 1, 1]) {
      const base = pos.length / 3, n = rings.length;
      for (let i = 0; i < n; i++) {
        const R = rings[i], a = rings[Math.max(0, i - 1)].p, b = rings[Math.min(n - 1, i + 1)].p;
        let dy = b[1] - a[1], dz = b[2] - a[2]; const dl = Math.hypot(dy, dz) || 1; dy /= dl; dz /= dl;
        const vy = dz, vz = -dy;
        for (let j = 0; j < sides; j++) {
          const an = (j / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
          pos.push(R.p[0] + cs * R.r[0], R.p[1] + sn * R.r[1] * vy, R.p[2] + sn * R.r[1] * vz);
          const nx = cs / Math.max(R.r[0], 1e-3), nv = sn / Math.max(R.r[1], 1e-3), nl = Math.hypot(nx, nv) || 1;
          nrm.push(nx / nl, nv * vy / nl, nv * vz / nl);
          const c = R.c || c0;
          col.push(c[0], c[1], c[2]); rig.push(part, R.w ?? 0, piv[0], piv[1]);
          knee.push(kn[0], kn[1], typeof R.coat === 'function' ? R.coat(sn * vy, cs, sn * vz) : (R.coat ?? 0));
        }
        if (i) for (let j = 0; j < sides; j++) {
          const p0 = base + (i - 1) * sides + j, p1 = base + (i - 1) * sides + (j + 1) % sides, q0 = p0 + sides, q1 = p1 + sides;
          idx.push(p0, p1, q0, p1, q1, q0);
        }
      }
    },
    // a straight rod between two points, any direction (rigid: part 0)
    rod(a, b, ra, rb, sides, c, coat = 0, part = 0, piv = [0, 0], w = 0) {
      const base = pos.length / 3;
      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      let ux = dz, uy = 0, uz = -dx; let ul = Math.hypot(ux, uz);
      if (ul < 1e-3) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
      const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
      for (let e = 0; e < 2; e++) {
        const P = e ? b : a, r = e ? rb : ra;
        for (let j = 0; j < sides; j++) {
          const an = (j / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
          const nx = ux * cs + vx * sn, ny = uy * cs + vy * sn, nz = uz * cs + vz * sn;
          pos.push(P[0] + nx * r, P[1] + ny * r, P[2] + nz * r); nrm.push(nx, ny, nz);
          col.push(c[0], c[1], c[2]); rig.push(part, w, piv[0], piv[1]); knee.push(0, 0, Array.isArray(coat) ? coat[e] : coat);
        }
      }
      for (let j = 0; j < sides; j++) { const p0 = base + j, p1 = base + (j + 1) % sides; idx.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides); }
    },
    // a smooth tube along any polyline (rigid: part 0). rad and coat may be numbers or functions of 0..1 along it
    pipe(pts, rad, sides, c, coat = 0) {
      const base = pos.length / 3, n = pts.length;
      let ux = 0, uy = 1, uz = 0;
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        let sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux, sl = Math.hypot(sx, sy, sz);
        if (sl < 0.05) { sx = 1; sy = 0; sz = 0; const dt = sx * tx; sx -= tx * dt; sy -= ty * dt; sz -= tz * dt; sl = Math.hypot(sx, sy, sz) || 1; }
        sx /= sl; sy /= sl; sz /= sl;
        const vx = sy * tz - sz * ty, vy = sz * tx - sx * tz, vz = sx * ty - sy * tx;
        ux = vx; uy = vy; uz = vz;
        const t = i / (n - 1), r = typeof rad === 'function' ? rad(t) : rad, ct = typeof coat === 'function' ? coat(t) : coat;
        for (let j = 0; j < sides; j++) {
          const an = (j / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
          const nx = sx * cs + vx * sn, ny = sy * cs + vy * sn, nz = sz * cs + vz * sn;
          pos.push(pts[i][0] + nx * r, pts[i][1] + ny * r, pts[i][2] + nz * r); nrm.push(nx, ny, nz);
          col.push(c[0], c[1], c[2]); rig.push(0, 0, 0, 0); knee.push(0, 0, ct);
        }
        if (i) for (let j = 0; j < sides; j++) { const p0 = base + (i - 1) * sides + j, p1 = base + (i - 1) * sides + (j + 1) % sides; idx.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides); }
      }
    },
    // a flat strip of stations [{ a:[x,y,z], b:[x,y,z], w, coat }] (wings, slats)
    strip(st, part, piv, c, ny = 1) {
      const base = pos.length / 3;
      st.forEach((s, i) => {
        for (const P of [s.a, s.b]) { pos.push(P[0], P[1], P[2]); nrm.push(0, ny, 0); col.push(c[0], c[1], c[2]); rig.push(part, s.w ?? 0, piv[0], piv[1]); knee.push(0, 0, s.coat ?? 0); }
        if (i) { const k = base + i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
      });
    },
    // one lock of fur: a flat triangle that rides with its part
    fin(a, b, tipP, n, part, w, piv, kn, c, coat = 0) {
      const base = pos.length / 3;
      for (const Pt of [a, b, tipP]) { pos.push(Pt[0], Pt[1], Pt[2]); nrm.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); rig.push(part, w, piv[0], piv[1]); knee.push(kn[0], kn[1], coat); }
      idx.push(base, base + 1, base + 2);
    },
    build() {
      const b = new THREE.BufferGeometry();
      b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      b.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); b.setAttribute('aRig', new THREE.Float32BufferAttribute(rig, 4));
      b.setAttribute('aKnee', new THREE.Float32BufferAttribute(knee, 3)); b.setIndex(idx);
      b.userData.triangles = idx.length / 3;
      return b;
    },
  };
  return g;
}

// one four-legged runner from a table of proportions (dog, hare, fox, lynx); nose +Z, feet on y = 0
function quadruped(S) {
  const g = makeGeo(), H = S.H, L = S.L, rx = S.rx, ry = S.ry, c = S.c, hs = S.hs;
  const T = [[-1.14, 0.22, 0.22, 0.04], [-1.0, 0.74, 0.72, 0.02], [-0.7, 1.0 * S.rump, 0.98 * S.rump, 0.0], [-0.22, 0.92, 0.94, -0.02], [0.28, 1.0, 1.1, -0.04], [0.72, 1.06, 1.18, -0.03], [1.02, 0.84, 1.0, 0.03]];
  g.tube(T.map(([t, kx, ky, dy]) => ({ p: [0, H + dy * ry * 4, t * L], r: [kx * rx, ky * ry], w: t, coat: (up, sd) => S.torso(up, t, sd) })), 12, 0, [0, 0], [0, 0], c);
  // neck and head
  const ny = H + 0.3 * ry, nz = L * 0.93, piv = [ny, nz];
  const HD = [[0, 0, 0.105, 0.125, 0], [0.08, 0.085, 0.09, 0.105, 0], [0.155, 0.165, 0.085, 0.095, 0], [0.18, 0.245, 0.09, 0.09, 0], [0.165, 0.315, 0.07, 0.068, 1], [0.14, 0.375, 0.046, 0.042, 2], [0.13, 0.44 + S.muzzle, 0.032, 0.03, 2], [0.125, 0.475 + S.muzzle, 0.012, 0.012, 3]];
  g.tube(HD.map(([y, z, a, b, k], i) => ({ p: [0, ny + y * hs * S.neck, nz + z * hs], r: [a * hs * (i < 2 ? S.neckR : 1), b * hs * (i < 2 ? S.neckR : 1)], w: i / 7, coat: (up) => (k === 3 ? 2 : S.head(up, k)) })), 10, 6, piv, [0, 0], c);
  for (const sx of [1, -1]) {
    const ex = sx * S.ear[2] * hs, ey = ny + (0.18 * S.neck + 0.075) * hs, ez = nz + 0.225 * hs, el = S.ear[0], tilt = S.ear[3];
    g.tube([{ p: [ex, ey - 0.02, ez], r: [S.ear[1], S.ear[1] * 0.55], coat: 1 }, { p: [ex, ey + el * 0.55, ez - el * 0.55 * tilt], r: [S.ear[1] * 0.8, S.ear[1] * 0.4], coat: 1 }, { p: [ex, ey + el, ez - el * tilt], r: [0.006, 0.005], coat: S.ear[4] }], 5, 6, piv, [0, 0], c);
    if (S.tuft) g.tube([{ p: [ex, ey + el * 0.9, ez - el * tilt * 0.9], r: [0.011, 0.009], coat: 2 }, { p: [ex * 1.08, ey + el + S.tuft * 0.6, ez - el * tilt - 0.01], r: [0.008, 0.007], coat: 2 }, { p: [ex * 1.15, ey + el + S.tuft, ez - el * tilt - 0.02], r: [0.003, 0.003], coat: 2 }], 4, 6, piv, [0, 0], c);
    if (S.ruff) g.tube([{ p: [sx * 0.07 * hs, ny + 0.1 * hs * S.neck, nz + 0.2 * hs], r: [0.05 * hs, 0.07 * hs], coat: 0.6 }, { p: [sx * 0.115 * hs, ny + 0.02 * hs, nz + 0.17 * hs], r: [0.04 * hs, 0.06 * hs], coat: 0.2 }, { p: [sx * 0.16 * hs, ny - S.ruff * hs, nz + 0.15 * hs], r: [0.008, 0.012], coat: 2 }], 6, 6, piv, [0, 0], c);
  }
  // tail
  const ty = H + ry * 0.45, tz = -L * 1.04, tl = S.tail[0], tr = S.tail[1], NT = 7;
  const curl = S.tail[4], tp = [[0, 0]];
  if (curl) for (let i = 1; i < NT; i++) { const th = lerp(curl[0], curl[1], (i - 0.5) / (NT - 1)), q = tp[i - 1]; tp.push([q[0] + Math.sin(th) * tl / (NT - 1), q[1] - Math.cos(th) * tl / (NT - 1)]); }
  g.tube(Array.from({ length: NT }, (_, i) => { const w = i / (NT - 1); return { p: curl ? [0, ty + tp[i][0], tz + tp[i][1]] : [0, ty + tl * (S.tail[2] * w - 0.3 * w * w), tz - tl * w * 0.94], r: [tr * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, w * 1.08 + 0.04))), tr * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, w * 1.08 + 0.04)))], w, coat: S.tail[3](w) }; }), 7, 5, [ty, tz], [0, 0], c);
  // legs: 1 HL, 2 HR, 3 FL, 4 FR
  for (let k = 1; k <= 4; k++) {
    const hind = k <= 2, sx = (k % 2 ? 1 : -1) * S.legX;
    const hip = hind ? [H - 0.1 * ry, -L * 0.76] : [H - 0.25 * ry, L * 0.72];
    const kn = hind ? [H * 0.46, -L * 0.76 - S.hock] : [H * 0.42, L * 0.74];
    const paw = hind ? [0.03, -L * 0.76 - S.hock * 0.45 + 0.02] : [0.03, L * 0.78];
    const lu = S.leg[0] * (hind ? (S.thigh ?? 1.25) : 1), ll = S.leg[1], lp = S.leg[2];
    const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const m1 = mid(hip, kn, 0.5), m2 = mid(kn, paw, 0.55);
    if (hind) m1[1] += S.stifle ?? 0;                                       // the stifle sits forward of the line from hip to hock
    g.tube([
      { p: [sx, hip[0], hip[1]], r: [lu, lu * 1.5], w: 0, coat: S.legCoat[0] }, { p: [sx, m1[0], m1[1]], r: [lu * 0.8, lu * 1.05], w: 0.25, coat: S.legCoat[1] },
      { p: [sx, kn[0], kn[1]], r: [ll * 1.1, ll * 1.25], w: 0.5, coat: S.legCoat[2] }, { p: [sx, m2[0], m2[1]], r: [ll, ll], w: 0.75, coat: S.legCoat[2] },
      { p: [sx, paw[0] + 0.035, paw[1]], r: [ll * 0.95, ll], w: 0.95, coat: S.legCoat[2] }, { p: [sx, paw[0], paw[1] + lp * 0.5], r: [lp, lp * 1.5], w: 1, coat: S.legCoat[2] },
    ], 6, k, hip, kn, c);
  }
  return g.build();
}

// a sled husky, built for the view from the runners: seen from behind and above at 3.5 to 8 m. Rounded haunches over
// a bent hock, pale breeches and tail underside, a dark saddle, pricked dark-backed ears, a bushy tail carried up and
// back, an X-back harness to the tugline. Nose +Z, feet on y = 0; the same rig as quadruped().
function huskyGeometry() {
  const g = makeGeo(), H = 0.47, L = 0.34, rx = 0.125, ry = 0.145, pale = [0.6, 0.575, 0.55];
  const torso = (up, t) => {
    if (t < -0.8) return sstep(0.15, 0.6, up) * (up > 0.93 ? 1.5 : 1);                       // breeches: pale below the tail
    if (up > 0.9 && t < 0.86) return 1.85;                                                   // the dark line down the spine
    return sstep(-0.62, -0.02, up);
  };
  const T = [[-1.17, 0.3, 0.3, 0.035], [-1.07, 0.72, 0.74, 0.022], [-0.88, 0.99, 0.99, 0.006], [-0.62, 1.07, 1.01, 0], [-0.3, 0.95, 0.94, -0.012], [0.0, 0.93, 0.99, -0.02],
    [0.3, 1.0, 1.1, -0.034], [0.6, 1.08, 1.2, -0.036], [0.84, 1.05, 1.15, -0.022], [1.03, 0.82, 0.98, 0.02]];
  g.tube(T.map(([t, kx, ky, dy]) => ({ p: [0, H + dy * ry * 4, t * L], r: [kx * rx, ky * ry], w: t, coat: (up) => torso(up, t) })), 14, 0, [0, 0], [0, 0], pale);
  // neck with its ruff, skull, muzzle
  const ny = H + 0.3 * ry, nz = L * 0.93, piv = [ny, nz];
  const HD = [[0, 0, 0.118, 0.138, 0], [0.085, 0.085, 0.104, 0.118, 0], [0.155, 0.165, 0.09, 0.098, 0], [0.182, 0.245, 0.093, 0.092, 0], [0.165, 0.315, 0.07, 0.068, 1], [0.14, 0.375, 0.046, 0.042, 2], [0.13, 0.44, 0.032, 0.03, 2], [0.125, 0.475, 0.012, 0.012, 3]];
  g.tube(HD.map(([y, z, a, b, k], i) => ({ p: [0, ny + y, nz + z], r: [a, b], w: i / 7, coat: (up) => (k === 3 ? 2 : k === 0 ? sstep(-0.25, 0.35, up) * (up > 0.8 ? 1.5 : 1) : k === 1 ? sstep(0.1, 0.7, up) * 0.8 : 0) })), 10, 6, piv, [0, 0], pale);
  for (const sx of [1, -1]) {                                                               // pricked ears, dark behind
    const ex = sx * 0.06, ey = ny + 0.25, ez = nz + 0.222, el = 0.128;
    g.tube([{ p: [ex, ey - 0.03, ez], r: [0.046, 0.026], coat: 1.5 }, { p: [ex * 1.12, ey + el * 0.5, ez - 0.008], r: [0.036, 0.017], coat: 1.7 }, { p: [ex * 1.25, ey + el, ez - 0.016], r: [0.007, 0.006], coat: 2 }], 6, 6, piv, [0, 0], pale);
    for (let j = 0; j < 4; j++) {                                                           // the ruff: locks standing off the neck
      const an = (0.25 + 0.42 * j) * sx, o = [Math.sin(an), Math.cos(an)], y0 = ny + 0.05 + 0.01 * j, z0 = nz + 0.03;
      g.fin([o[0] * 0.105, y0 + o[1] * 0.125, z0 + 0.022], [o[0] * 0.105, y0 + o[1] * 0.125, z0 - 0.022], [o[0] * 0.128, y0 + o[1] * 0.15, z0 - 0.055], [o[0], o[1], -0.2], 6, 0.05, piv, [0, 0], pale, j < 3 ? 1 : 0.3);
    }
  }
  // the tail: a full brush streaming back a little below the line of the back (so the saddle, the harness and the
  // ears show over it from the runners), coat-coloured above with a dark ridge, pale beneath and at the tip, ragged with locks
  const ty = H + 0.36 * ry, tz = -L * 1.03, TP = [[0, 0], [-0.004, -0.06], [-0.012, -0.125], [-0.026, -0.19], [-0.045, -0.25], [-0.068, -0.305], [-0.092, -0.352], [-0.112, -0.39], [-0.122, -0.418]];
  const NTL = TP.length, tr = (i) => { const w = i / (NTL - 1); return (0.026 + 0.043 * Math.pow(Math.sin(Math.PI * Math.min(1, w * 1.1 + 0.08)), 0.7)) * (i & 1 ? 1.13 : 0.92) * (i === NTL - 1 ? 0.4 : 1); };
  const tailCoat = (i, up) => (i >= NTL - 3 ? 0.1 : up > 0.8 ? 1.5 : up > 0.1 ? 1 : 0.15);
  g.tube(TP.map(([u, b], i) => ({ p: [0, ty + u, tz + b], r: [tr(i), tr(i) * 0.9], w: i / (NTL - 1), coat: (up) => tailCoat(i, up) })), 9, 5, [ty, tz], [0, 0], pale);
  for (let i = 1; i < NTL - 1; i++) {
    const a = TP[i - 1], b = TP[i + 1], q = TP[i]; let ay = b[0] - a[0], az = b[1] - a[1]; const al = Math.hypot(ay, az) || 1; ay /= al; az /= al;
    const r = tr(i), w = i / (NTL - 1), cy = ty + q[0], cz = tz + q[1];
    for (let j = 0; j < 5; j++) {
      const an = ((j + (i & 1) * 0.5) / 5) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), ox = cs, oy = sn * az, oz = -sn * ay, r1 = r * 0.86, r2 = r + 0.02;
      g.fin([ox * r1, cy + oy * r1 - ay * 0.02, cz + oz * r1 - az * 0.02], [ox * r1, cy + oy * r1 + ay * 0.02, cz + oz * r1 + az * 0.02], [ox * r2, cy + oy * r2 + ay * 0.05, cz + oz * r2 + az * 0.05], [ox, oy, oz], 5, w, [ty, tz], [0, 0], pale, tailCoat(i, oy));
    }
  }
  // legs: 1 HL, 2 HR, 3 FL, 4 FR. Hind: broad thigh, stifle forward, the hock's point back, a short straight metatarsus
  for (let k = 1; k <= 4; k++) {
    const hind = k <= 2, sx = (k % 2 ? 1 : -1) * (hind ? 0.088 : 0.08);
    if (hind) {
      const hz = -L * 0.74, hip = [H - 0.08 * ry, hz], kn = [0.205, hz - 0.135];
      const br = (up, sd, fb) => (fb < -0.1 ? 0.08 : 1);                                    // breeches behind, coat colour on the outside
      g.tube([
        { p: [sx * 0.9, hip[0] + 0.03, hz - 0.012], r: [0.07, 0.118], w: 0, coat: br }, { p: [sx, 0.405, hz + 0.012], r: [0.068, 0.108], w: 0.12, coat: br },
        { p: [sx, 0.33, hz + 0.028], r: [0.054, 0.082], w: 0.25, coat: br }, { p: [sx, 0.268, hz - 0.07], r: [0.037, 0.052], w: 0.38, coat: br },
        { p: [sx, kn[0] + 0.012, kn[1] + 0.006], r: [0.032, 0.042], w: 0.5, coat: 0.2 }, { p: [sx, kn[0] - 0.04, kn[1] + 0.016], r: [0.026, 0.031], w: 0.6, coat: 0.12 },
        { p: [sx, 0.092, kn[1] + 0.034], r: [0.025, 0.028], w: 0.8, coat: 0.1 }, { p: [sx, 0.052, kn[1] + 0.045], r: [0.03, 0.033], w: 0.92, coat: 0.08 },
        { p: [sx, 0.036, kn[1] + 0.078], r: [0.04, 0.034], w: 1, coat: 0.08 }, { p: [sx, 0.022, kn[1] + 0.124], r: [0.023, 0.016], w: 1, coat: 0.3 },
      ], 8, k, hip, kn, pale);
      for (let j = 0; j < 4; j++) {                                                         // feathering down the back of the thigh
        const y0 = 0.43 - 0.045 * j, z0 = hz - 0.095 - 0.004 * j + 0.03 * (j > 2 ? 1 : 0), xo = sx * (1 + 0.12 * (j & 1 ? 1 : -1));
        g.fin([xo - 0.022, y0, z0 + 0.02], [xo + 0.022, y0, z0 + 0.02], [xo, y0 - 0.042, z0 - 0.028], [0, 0.2, -1], k, 0.1, hip, kn, pale, 0.08);
      }
    } else {
      const fz = L * 0.7, hip = [H - 0.22 * ry, fz], kn = [0.2, fz + 0.006];
      g.tube([
        { p: [sx, hip[0], fz], r: [0.05, 0.088], w: 0, coat: 1 }, { p: [sx, 0.34, fz + 0.012], r: [0.04, 0.056], w: 0.25, coat: 0.6 },
        { p: [sx, kn[0], kn[1]], r: [0.03, 0.034], w: 0.5, coat: 0.15 }, { p: [sx, 0.1, fz + 0.004], r: [0.026, 0.028], w: 0.8, coat: 0.1 },
        { p: [sx, 0.052, fz + 0.012], r: [0.03, 0.033], w: 0.92, coat: 0.08 }, { p: [sx, 0.036, fz + 0.045], r: [0.039, 0.034], w: 1, coat: 0.08 }, { p: [sx, 0.022, fz + 0.09], r: [0.022, 0.016], w: 1, coat: 0.3 },
      ], 8, k, hip, kn, pale);
    }
  }
  // the harness: a collar and two straps over the back to the tugline at the root of the tail
  const top = (t) => { for (let i = 1; i < T.length; i++) if (t <= T[i][0]) { const a = T[i - 1], b = T[i], f = (t - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], f) * rx, H + lerp(a[3], b[3], f) * ry * 4, lerp(a[2], b[2], f) * ry]; } return [rx, H, ry]; };
  for (const sx of [1, -1]) {
    const st = [];
    for (let i = 0; i <= 6; i++) { const t = lerp(0.8, -1.02, i / 6), an = lerp(0.62, 0.0, Math.pow(i / 6, 0.8)) * sx, [wx, cy, wy] = top(t); st.push({ p: [Math.sin(an) * (wx + 0.004), cy + Math.cos(an) * (wy + 0.004), t * L], r: [0.014, 0.008], w: t, coat: 2 }); }
    g.tube(st, 5, 0, [0, 0], [0, 0], pale);
  }
  { const ring = [], [wx, cy, wy] = top(0.82); for (let j = 0; j <= 12; j++) { const an = (j / 12) * Math.PI * 2; ring.push([Math.sin(an) * (wx + 0.016), cy + 0.008 + Math.cos(an) * (wy + 0.016), 0.82 * L + 0.012 * Math.cos(an)]); } g.pipe(ring, 0.013, 5, pale, 2); }
  return g.build();
}

// a great grey owl: a big round head with a pale facial disc, a barrel body, broad round-tipped wings
function owlGeometry() {
  const g = makeGeo(), c = [0.3, 0.27, 0.25];
  const B = [[-0.4, 0.1, 0.012, 0.8], [-0.24, 0.1, 0.08, 0.6], [-0.04, 0.14, 0.13, 0.35], [0.1, 0.155, 0.15, 0.2], [0.2, 0.172, 0.172, 0.25], [0.28, 0.168, 0.17, 0.45], [0.318, 0.15, 0.152, 0.5], [0.33, 0.132, 0.136, 1.9], [0.345, 0.03, 0.03, 2.1]];
  g.tube(B.map(([z, a, b, k]) => ({ p: [0, 0, z], r: [a, b], w: 0, coat: (up) => k + (up < -0.2 && k < 1 ? -0.15 : 0) })), 10, 0, [0, 0], [0, 0], c);
  for (const sx of [-1, 1]) {
    const xs = 0.11, st = [], N = 8;
    for (let i = 0; i <= N; i++) {
      const w = i / N, x = sx * (xs + 0.64 * w), ch = 0.44 * (1 - 0.22 * w * w) * (i === N ? 0.55 : i === N - 1 ? 0.86 : 1), lead = 0.14 - 0.05 * w * w - (i === N ? 0.06 : 0);
      st.push({ a: [x, 0.02, lead], b: [x, 0.0, lead - ch], w, coat: 0.25 + 0.45 * (i % 2) + 0.35 * w });
    }
    g.strip(st, sx < 0 ? 7 : 8, [xs, 0], c);
    // the face: two yellow eyes, close set, each in its own pale ring; dark brows between them
    g.rod([sx * 0.048, 0.022, 0.332], [sx * 0.048, 0.022, 0.352], 0.031, 0.001, 7, [0.95, 0.7, 0.1]);        // cones, point forward: discs from the front
    g.rod([sx * 0.048, 0.022, 0.344], [sx * 0.048, 0.022, 0.357], 0.015, 0.001, 6, [0.01, 0.01, 0.012]);
    g.rod([sx * 0.012, 0.075, 0.338], [sx * 0.085, 0.052, 0.344], 0.012, 0.008, 4, [0.08, 0.07, 0.07]);
  }
  g.rod([0, -0.005, 0.342], [0, -0.05, 0.372], 0.02, 0.004, 5, [0.7, 0.55, 0.2]);                  // the bill
  return g.build();
}

// the sled and its musher, seen from outside: origin on the snow between the runner tails, +Z ahead. Bent ash
// throughout: the handlebar at the back of the basket and the brush bow at the nose are steamed curves, lashed at every
// joint, with a roped canvas load. The musher stands on the runners, knees bent, leaning into the bar: a hooded
// anorak in the one red of this world, a pale fur ruff, dark trousers, mukluks.
function sledGeometry() {
  const g = makeGeo(), ash = [0.4, 0.27, 0.14], dark = [0.06, 0.07, 0.11], canvas = [0.33, 0.3, 0.26], hide = [0.5, 0.42, 0.3];
  const curve = (pts, n) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal').getPoints(n).map((p) => [p.x, p.y, p.z]);
  const lash = (p, r) => g.pipe([[p[0], p[1] - 0.03, p[2]], [p[0], p[1], p[2]], [p[0], p[1] + 0.03, p[2]]], (t) => r * (0.75 + 0.25 * Math.sin(t * Math.PI)), 6, hide, 0);
  // the handlebar: one hoop from rail to rail, raked back, leather-wrapped where the hands go
  g.pipe(curve([[-0.26, 0.44, 0.34], [-0.262, 0.7, 0.23], [-0.24, 0.92, 0.14], [-0.14, 1.03, 0.095], [0, 1.055, 0.085], [0.14, 1.03, 0.095], [0.24, 0.92, 0.14], [0.262, 0.7, 0.23], [0.26, 0.44, 0.34]], 24), 0.021, 8, ash, 0);
  g.pipe(curve([[-0.1, 1.04, 0.09], [-0.05, 1.052, 0.086], [0, 1.055, 0.085], [0.05, 1.052, 0.086], [0.1, 1.04, 0.09]], 8), (t) => 0.026 + 0.0015 * Math.sin(t * 50), 8, [0.17, 0.095, 0.05], 0);
  // the brush bow, round the front
  g.pipe(curve([[-0.26, 0.2, 2.02], [-0.255, 0.225, 2.36], [-0.17, 0.25, 2.62], [0, 0.258, 2.71], [0.17, 0.25, 2.62], [0.255, 0.225, 2.36], [0.26, 0.2, 2.02]], 20), 0.024, 7, ash, 0);
  for (const sx of [1, -1]) {
    const x = sx * 0.26;
    g.pipe(curve([[x, 0.026, -0.85], [x, 0.026, 0.6], [x, 0.026, 1.9], [x, 0.07, 2.2], [x * 0.94, 0.17, 2.4], [x * 0.86, 0.25, 2.5]], 12), 0.022, 6, dark, 0);       // runner, turned up at the nose
    g.pipe(curve([[x, 0.44, 0.22], [x, 0.44, 1.1], [x, 0.43, 1.95], [x * 0.98, 0.32, 2.3], [x * 0.9, 0.25, 2.48]], 10), 0.017, 6, ash, 0);                        // top rail
    for (const z of [0.3, 1.0, 1.7]) { g.rod([x, 0.03, z], [x, 0.44, z + 0.04], 0.018, 0.016, 6, ash); lash([x, 0.43, z + 0.04], 0.028); lash([x, 0.06, z], 0.03); }
    g.rod([x, 0.44, 0.95], [sx * 0.258, 0.78, 0.2], 0.013, 0.013, 5, ash);                                                                                        // brace to the bar
    g.strip([{ a: [x - 0.05, 0.052, -0.62], b: [x + 0.05, 0.052, -0.62] }, { a: [x - 0.05, 0.052, -0.02], b: [x + 0.05, 0.052, -0.02] }], 0, [0, 0], dark);          // the foot boards
  }
  for (let k = 0; k < 5; k++) { const x = -0.2 + k * 0.1; g.strip([{ a: [x - 0.04, 0.2, 0.24], b: [x + 0.04, 0.2, 0.24] }, { a: [x - 0.04, 0.2, 2.0], b: [x + 0.04, 0.2, 2.0] }], 0, [0, 0], ash); }
  // the canvas-wrapped load, lumpy, cross-roped
  const N = 15, prof = (t) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t * 0.96 + 0.02))), 0.42);
  const ry = (t) => (0.2 + 0.03 * Math.sin(t * 9 + 1) + 0.02 * Math.sin(t * 23)) * prof(t) + 0.01, rx = (t) => (0.25 + 0.02 * Math.sin(t * 13 + 2)) * prof(t) + 0.01, cy = (t) => 0.41 + 0.035 * Math.sin(t * 5.3);
  g.tube(Array.from({ length: N }, (_, i) => { const t = i / (N - 1); return { p: [0, cy(t), 0.52 + 1.5 * t], r: [rx(t), ry(t)], coat: 0.4 }; }), 14, 0, [0, 0], [0, 0], canvas);
  for (const t of [0.2, 0.42, 0.63, 0.83]) {
    const ring = []; for (let j = 0; j <= 14; j++) { const an = (j / 14) * Math.PI * 2; ring.push([Math.cos(an) * (rx(t) + 0.008), cy(t) + Math.sin(an) * (ry(t) + 0.008), 0.52 + 1.5 * t + 0.03 * Math.sin(an * 2 + t * 9)]); }
    g.pipe(ring, 0.011, 5, dark, 2);
  }
  // ---- the musher
  const red = [0.5, 0.032, 0.036], redD = [0.3, 0.02, 0.026], navy = [0.045, 0.06, 0.12], tan = [0.42, 0.3, 0.17], fur = [0.66, 0.6, 0.52], mitt = [0.09, 0.065, 0.055];
  for (const sx of [1, -1]) {
    g.tube([
      { p: [sx * 0.26, 0.085, -0.25], r: [0.058, 0.135], c: tan }, { p: [sx * 0.26, 0.15, -0.27], r: [0.06, 0.1], c: tan }, { p: [sx * 0.256, 0.26, -0.3], r: [0.06, 0.07], c: tan },
      { p: [sx * 0.25, 0.44, -0.29], r: [0.078, 0.084], c: tan }, { p: [sx * 0.25, 0.475, -0.285], r: [0.086, 0.09], c: fur }, { p: [sx * 0.248, 0.5, -0.28], r: [0.07, 0.074], c: navy },
      { p: [sx * 0.235, 0.6, -0.235], r: [0.078, 0.084], c: navy }, { p: [sx * 0.2, 0.8, -0.31], r: [0.094, 0.102], c: navy }, { p: [sx * 0.15, 0.97, -0.38], r: [0.1, 0.11], c: navy },
    ], 8, 0, [0, 0], [0, 0], navy);
    // arm: shoulder, elbow out, wrist on the bar; a mitt over the bar
    g.pipe(curve([[sx * 0.24, 1.44, -0.2], [sx * 0.31, 1.3, -0.12], [sx * 0.325, 1.16, -0.02], [sx * 0.265, 1.05, 0.06]], 8), (t) => 0.07 - 0.016 * t, 7, red, 0);
    g.pipe([[sx * 0.265, 1.06, 0.045], [sx * 0.235, 1.02, 0.1], [sx * 0.205, 0.985, 0.135]], (t) => 0.05 + 0.02 * Math.sin(t * Math.PI), 6, mitt, 0);
    g.pipe([[sx * 0.27, 1.085, 0.02], [sx * 0.262, 1.06, 0.05]], 0.066, 6, fur, 0);                                                                              // cuff
  }
  const PK = [[0.79, -0.395, 0.262, 0.205, redD], [0.83, -0.39, 0.27, 0.21, red], [0.97, -0.37, 0.238, 0.178, red], [1.03, -0.355, 0.228, 0.168, redD], [1.06, -0.35, 0.23, 0.17, red],
    [1.22, -0.305, 0.236, 0.172, red], [1.37, -0.25, 0.25, 0.165, red], [1.47, -0.2, 0.242, 0.145, red], [1.53, -0.17, 0.15, 0.125, red],
    [1.59, -0.16, 0.128, 0.135, red], [1.69, -0.15, 0.138, 0.152, red], [1.78, -0.145, 0.12, 0.134, red], [1.85, -0.14, 0.066, 0.076, red], [1.875, -0.14, 0.006, 0.006, red]];
  g.tube(PK.map(([y, z, a, b, cc]) => ({ p: [0, y, z], r: [a, b], c: cc })), 12, 0, [0, 0], [0, 0], red);
  { const ring = []; for (let j = 0; j <= 12; j++) { const an = (j / 12) * Math.PI * 2; ring.push([Math.sin(an) * 0.125, 1.695 + Math.cos(an) * 0.145, -0.035 - 0.035 * Math.cos(an)]); } g.pipe(ring, 0.042, 6, fur, 0); }   // the ruff round the hood's opening
  g.tube([{ p: [0, 1.57, -0.03], r: [0.09, 0.02], c: dark }, { p: [0, 1.7, -0.02], r: [0.1, 0.02], c: dark }, { p: [0, 1.81, -0.03], r: [0.07, 0.02], c: dark }], 8, 0, [0, 0], [0, 0], dark);                   // the face in the hood's shadow
  return g.build();
}

function lodgeGeometry(rng) {
  const g = makeGeo(), snow = [0.78, 0.76, 0.75], stick = [0.13, 0.09, 0.07];
  const P = [[0, 3.6], [0.45, 3.2], [1.1, 2.5], [1.75, 1.7], [2.2, 0.95], [2.5, 0.25], [2.55, 0.02]];
  g.tube(P.map(([y, r], i) => { const k = rng.range(0.9, 1.1); return { p: [0, y, 0], r: [r * k, r * k], c: i < 2 ? snow : null, coat: (up, sd) => (i >= 4 ? 0 : (hash(i * 7.1 + Math.round(sd * 6)) > 0.45 ? 0.0 : 1.0)) }; }), 14, 0, [0, 0], [0, 0], snow);
  // the tint of the lodge instance is the dark stick colour; unit stick for the instanced set
  return g.build();
}
function stickGeometry() {
  const g = makeGeo(), pale = [0.62, 0.5, 0.33];
  g.rod([0, 0, -0.8], [0, 0, -0.55], 0.03, 0.04, 5, pale, 0); g.rod([0, 0, -0.55], [0, 0, 0.6], 0.04, 0.035, 5, pale, 1); g.rod([0, 0, 0.6], [0, 0, 0.85], 0.035, 0.012, 5, pale, 0);
  return g.build();
}

// a 6 m mountain-ash: several stems, branches, twigs and ~190 berry clusters (camera-facing cards)
function ashGeometry(rng) {
  const pos = [], nrm = [], uv = [], kk = [], idx = [];
  const rod = (a, b, ra, rb, sides) => {
    const base = pos.length / 3; const d = new THREE.Vector3().subVectors(b, a).normalize();
    const u = new THREE.Vector3(d.z, 0, -d.x); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize(); const v = new THREE.Vector3().crossVectors(d, u);
    for (let e = 0; e < 2; e++) for (let j = 0; j < sides; j++) {
      const an = (j / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), P = e ? b : a, r = e ? rb : ra;
      const nx = u.x * cs + v.x * sn, ny = u.y * cs + v.y * sn, nz = u.z * cs + v.z * sn;
      pos.push(P.x + nx * r, P.y + ny * r, P.z + nz * r); nrm.push(nx, ny, nz); uv.push(0, 0); kk.push(0);
    }
    for (let j = 0; j < sides; j++) { const p0 = base + j, p1 = base + (j + 1) % sides; idx.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides); }
  };
  const berry = (p) => {
    const base = pos.length / 3;
    for (const [x, y] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(p.x, p.y, p.z); nrm.push(0, 1, 0); uv.push(x, y); kk.push(1); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), nStem = rng.int(3, 4);
  for (let s = 0; s < nStem; s++) {
    const az = (s / nStem) * 6.283 + rng.range(-0.4, 0.4), lean = rng.range(0.12, 0.3);
    const dir = V(Math.cos(az) * Math.sin(lean), Math.cos(lean), Math.sin(az) * Math.sin(lean));
    const p0 = V(Math.cos(az) * 0.12, 0, Math.sin(az) * 0.12), p1 = p0.clone().addScaledVector(dir, 1.5), p2 = p1.clone().addScaledVector(dir, 1.3).add(V(0, 0.15, 0));
    rod(p0, p1, 0.075, 0.055, 5); rod(p1, p2, 0.055, 0.04, 5);
    for (let b = 0; b < 3; b++) {
      const a2 = az + (b - 1) * 1.3 + rng.range(-0.4, 0.4), el = rng.range(0.35, 0.95), bl = rng.range(1.8, 2.7);
      const bd = V(Math.cos(a2) * Math.sin(el), Math.cos(el), Math.sin(a2) * Math.sin(el));
      const q0 = b === 0 ? p2 : p1.clone().lerp(p2, rng.range(0.2, 0.9)), q1 = q0.clone().addScaledVector(bd, bl * 0.55), q2 = q1.clone().addScaledVector(bd, bl * 0.45).add(V(0, -0.12 * bl * el, 0));
      rod(q0, q1, 0.035, 0.024, 4); rod(q1, q2, 0.024, 0.012, 4);
      for (let t = 0; t < 6; t++) {
        const f = rng.range(0.25, 1), o = (f < 0.55 ? q0.clone().lerp(q1, f / 0.55) : q1.clone().lerp(q2, (f - 0.55) / 0.45));
        const td = V(rng.gauss(), rng.gauss() * 0.5 - 0.15, rng.gauss()).normalize().multiplyScalar(0.6).addScaledVector(bd, 0.5).normalize();
        const e = o.clone().addScaledVector(td, rng.range(0.45, 0.95)).add(V(0, -0.1, 0));
        rod(o, e, 0.011, 0.006, 3);
        berry(e); berry(o.clone().lerp(e, rng.range(0.45, 0.8)).add(V(0, -0.05, 0))); if (rng.chance(0.6)) berry(o.clone().lerp(e, rng.range(0.15, 0.4)).add(V(rng.range(-0.08, 0.08), -0.07, rng.range(-0.08, 0.08))));
      }
      berry(q2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 1)); g.setIndex(idx);
  g.userData.triangles = idx.length / 3;
  return g;
}

// one black spruce, 12 m: trunk foot, a ragged dark core spire, and boughs in a spiral, each two crossed cards that
// droop from the stem and turn up at the tip (longer and more drooping low down, a dense club at the top)
function spruceGeometry(rng, nB = 54) {
  const pos = [], nrm = [], uv = [], kd = [], idx = [], HT = 12;
  const R = (h) => 0.3 + 1.5 * Math.pow(Math.max(0, 1 - h / HT), 0.9);
  const vtx = (x, y, z, nx, ny, nz, u, v, k, sd) => { pos.push(x, y, z); nrm.push(nx, ny, nz); uv.push(u, v); kd.push(k, sd); return pos.length / 3 - 1; };
  // core: rings of 8, never round
  const rings = [[0, 0.17], [0.5, 0.14], [1.0, 0.3], [2.2, 0.44], [4, 0.44], [6, 0.37], [8, 0.27], [9.8, 0.2], [11.2, 0.12], [12.3, 0.01]];
  for (let i = 0; i < rings.length; i++) {
    const [h, kr] = rings[i], r = i < 2 ? kr : R(h) * kr;
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * 6.2832 + i * 0.4, rr = r * (i < 2 ? 1 : 0.8 + 0.4 * rng());
      vtx(Math.cos(a) * rr, h, Math.sin(a) * rr, Math.cos(a) * 0.85, 0.5, Math.sin(a) * 0.85, 0, 0, 0, 0);
    }
    if (i) for (let j = 0; j < 8; j++) { const p0 = (i - 1) * 8 + j, p1 = (i - 1) * 8 + (j + 1) % 8; idx.push(p0, p1, p0 + 8, p1, p1 + 8, p0 + 8); }
  }
  for (let b = 0; b < nB; b++) {
    const f = (b + rng()) / nB, h = 0.5 + (HT - 0.85) * Math.pow(f, 1.05), az = b * 2.39996 + rng.range(-0.3, 0.3);
    const top = h / HT, len = R(h) * rng.range(0.88, 1.2) + 0.25, droop = lerp(1.0, 0.25, Math.pow(top, 1.4)) * rng.range(0.8, 1.15);
    const ox = Math.cos(az), oz = Math.sin(az), sd = rng(), ww = 0.3 * len + 0.2;
    const pt = (sv) => [ox * (0.12 + len * sv), h + len * (0.2 * sv - 0.78 * sv * sv * droop + 0.3 * sv * sv * sv * droop), oz * (0.12 + len * sv)];
    for (let card = 0; card < 2; card++) {
      let prev = -1;
      for (let i = 0; i <= 3; i++) {
        const sv = i / 3, p = pt(sv), q = pt(Math.min(1, sv + 0.05)), q0 = pt(Math.max(0, sv - 0.05));
        let tx = q[0] - q0[0], ty = q[1] - q0[1], tz = q[2] - q0[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        // across: card 0 lies flat (tangential), card 1 hangs in the vertical plane of the bough
        let ax, ay, az2;
        if (card === 0) { ax = -oz; ay = 0; az2 = ox; } else { ax = -ty * ox; ay = Math.hypot(tx, tz); az2 = -ty * oz; }
        const w2 = ww * (card ? 0.8 : 1);
        const a = vtx(p[0] - ax * w2, p[1] - ay * w2, p[2] - az2 * w2, ox * 0.85, 0.5, oz * 0.85, -1, sv, 1, sd + card * 0.37);
        vtx(p[0] + ax * w2, p[1] + ay * w2, p[2] + az2 * w2, ox * 0.85, 0.5, oz * 0.85, 1, sv, 1, sd + card * 0.37);
        if (prev >= 0) idx.push(prev, prev + 1, a, prev + 1, a + 1, a);
        prev = a;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 2)); g.setIndex(idx);
  g.userData.triangles = idx.length / 3;
  return g;
}

function tuftGeometry() {
  const pos = [], uv = [], card = [], idx = [];
  for (let k = 0; k < 3; k++) {
    const a = k * Math.PI / 3 + 0.2, c = Math.cos(a), s = Math.sin(a), b = k * 4;
    for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) { pos.push(x * c, y, x * s); uv.push(x + 0.5, y); card.push(k); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 1)); g.setIndex(idx);
  return g;
}

const HARE = { H: 0.2, L: 0.19, rx: 0.07, ry: 0.082, rump: 1.25, hs: 0.6, neck: 0.75, neckR: 0.85, muzzle: -0.05, legX: 0.05, hock: 0.085, leg: [0.036, 0.016, 0.022], c: [0.82, 0.82, 0.83],
  torso: () => 0.5, head: () => 0.5, ear: [0.125, 0.02, 0.035, 0.55, 2], tail: [0.05, 0.035, 0.6, () => 0.3], legCoat: [0.5, 0.4, 0.3] };
const FOX = { H: 0.3, L: 0.28, rx: 0.075, ry: 0.088, rump: 1, hs: 0.72, neck: 0.9, neckR: 0.85, muzzle: 0.03, legX: 0.055, hock: 0.06, leg: [0.032, 0.016, 0.02], c: [0.8, 0.78, 0.76],
  torso: (up) => sstep(-0.55, -0.1, up), head: (up, k) => (k < 2 ? sstep(-0.3, 0.2, up) : 0), ear: [0.09, 0.03, 0.045, 0.1, 2], tail: [0.42, 0.07, 0.12, (w) => 1 - sstep(0.7, 0.95, w)], legCoat: [1, 1.6, 2] };
// a Canada lynx: short in the body, long in the leg and high behind, big round paws, a stub tail with a black tip, a ruffed
// face, short ears with small black tufts; grey-buff with a paler belly and faint dark flecks
const LYNX = { H: 0.57, L: 0.31, rx: 0.1, ry: 0.128, rump: 1.16, hs: 1.02, neck: 0.72, neckR: 1.15, muzzle: -0.09, legX: 0.08, hock: 0.14, leg: [0.058, 0.035, 0.066], thigh: 1.55, stifle: 0.05, c: [0.78, 0.74, 0.68],
  torso: (up, t, sd) => sstep(-0.6, -0.05, up) * (1 + 0.5 * (hash(Math.round(t * 9) * 3.1 + Math.round(sd * 2.5) * 1.7) > 0.7 ? 1 : 0)),
  head: (up, k) => (k < 2 ? sstep(-0.3, 0.3, up) : 0.35), ear: [0.07, 0.04, 0.066, 0.12, 1.6], tuft: 0.032, ruff: 0.11, tail: [0.1, 0.045, 0.1, (w) => 1 + sstep(0.45, 0.7, w)], legCoat: [1.0, 0.9, 0.75] };

// az is the sun's bearing in track terms (the trail sets out on bearing 20 and ends on about 46; the mirror of a look
// turns it over with the trail). rose: abeam on the right, a little behind. golden: LOW AND AHEAD, on the lodge side: the
// whole run is flown into the light, every trunk a blue stem with a burning edge, every crown a net of fire, long
// shadows reaching toward the eye, shafts across the lane; the sun stands over the pond, down the nave and beside the
// row, and is out of the frame at the gate. beam = shafts in the air, shaft = bands of light on the lane, bounce = light
// off sunlit snow on the backs of the team, mtAz = where the high range stands (never under the sun).
const LOOKS = {
  rose: { el: 7, az: 128, mtAz: 12, beam: 0.55, shaft: 0.6, bounce: 0, icePath: 0, fog: '#aab6e2', fogD: 0.0029, exposure: 0.8, horizon: '#f4c6c0', zenith: '#2f5fb4', portal: '#ffe9dc',
    sky: { preset: 'dawn', zenith: '#1f55b8', mid: '#a6d4f2', horizon: '#f8c4be', ground: '#a9b6dc', horizonPow: 8.0, midPow: 3.0, scatterColor: '#ffc49a', scatter: 0.5, scatterPow: 4,
      sunColor: '#ffe0c4', sunSize: 1.5, sunIntensity: 11, sunGlow: 0.7, stars: 0, clouds: false, clouds2: false,
      bodies: [{ elevation: 8, azimuth: -72, size: 1.5, phase: 0.96, intensity: 0.7, texture: 0.6, glow: 0.05 }] },
    cloudLit: '#f7b4b4', cloudShade: '#6258a0', grade: { saturation: 1.12, contrast: 1.06, tint: '#fff8f6', shadowTint: '#0d1838', vignette: 0.3, grain: 0.02 } },
  golden: { el: 8.5, az: -12, mtAz: 80, beam: 1, shaft: 0.85, bounce: 0.14, icePath: 0.8, glint: 0.62, fog: '#b4b0d2', fogD: 0.0027, exposure: 0.8, horizon: '#ffd2a6', zenith: '#2c55a6', portal: '#ffe2bc', sun: '#FFC892', sunI: 2.5, snowWhite: 0.66,
    sky: { preset: 'goldenHour', zenith: '#1d4fa8', mid: '#a2cbee', horizon: '#ffd0a2', ground: '#a9aac8', horizonPow: 7.0, midPow: 2.6, scatterColor: '#ffa860', scatter: 0.6, scatterPow: 4,
      sunColor: '#ffc88c', sunSize: 1.7, sunIntensity: 12, sunGlow: 0.75, clouds: false, clouds2: false },
    cloudLit: '#f3a878', cloudShade: '#5f5290', grade: { saturation: 1.1, contrast: 1.06, tint: '#fffaf2', shadowTint: '#101a3c', vignette: 0.3, grain: 0.02 } },
  night: { el: 31, az: 116, mtAz: 12, beam: 0, shaft: 0.4, bounce: 0, icePath: 0, fog: '#16234c', fogD: 0.0026, exposure: 1.6, horizon: '#2a4078', zenith: '#081230', portal: '#cfe0ff',
    sky: { preset: 'night', zenith: '#040a1e', mid: '#0c1c44', horizon: '#1c3468', ground: '#0a1430', clouds: false, clouds2: false, milkyWay: 0.8,
      bodies: [{ elevation: 31, azimuth: 116, size: 2.2, phase: 1, intensity: 1.1, dark: 0.03, glow: 0.22, glowColor: '#a8c0ff' }], key: 0 },
    cloudLit: '#8ea4dc', cloudShade: '#1a2850', grade: { saturation: 1.08, contrast: 1.05, tint: '#eef2ff', shadowTint: '#040a22', vignette: 0.34, grain: 0.025 } },
};
const COATS = [['#6d7078', '#3a3d46', '#8a8c90'], ['#17181d', '#2a2c33', '#101116'], ['#c9b89a', '#d8ccb4', '#bfa988']];
const BIRDS = [
  { body: '#8e8f96', belly: '#e9e2d2', wingC: '#5c5f69', trail: '#d5d6da', tip: '#2a2b31', head: '#15161a', beak: '#1a1a1c', tailC: '#55575f' },      // chickadee
  { body: '#a88a72', belly: '#b79a84', wingC: '#3a3c44', trail: '#f0e9d8', tip: '#e8c63a', head: '#b98f70', beak: '#1a1a1c', tailC: '#d8b830' },      // waxwing
  { body: '#b84a54', belly: '#c9666c', wingC: '#2e3038', trail: '#e8e6e2', tip: '#24252b', head: '#c2505a', beak: '#2a2a2c', tailC: '#2e3038' },      // pine grosbeak
];

export default {
  id: 'ice-arcade',
  name: 'The Glass Birches',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['snow'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ---- the look of this visit
    const pick = rng.fork('look'), hr = vary.hour || 'any';
    const hourPick = pick.pick(['rose', 'rose', 'rose', 'golden', 'rose', 'rose', 'golden', 'golden', 'rose', 'rose', 'night', 'night']);
    const hour = hr === 'golden' ? 'golden' : hr === 'night' ? 'night' : (hr === 'dawn' || hr === 'day') ? 'rose' : hourPick;
    const weather = pick.pick(['clear', 'clear', 'dust', 'shower']), load = pick.pick(['normal', 'normal', 'heavy', 'light']);
    const coats = pick.int(0, 2), birdKind = pick.int(0, 2), fox = pick.chance(0.3);
    const LK = LOOKS[hour], night = hour === 'night';
    const sd = hour === 'golden' ? -1 : 1;                    // the sun's side of the trail (+1 right of travel); golden mirrors the whole world
    const SUN = skyDirection(LK.el, LK.az * sd).clone().normalize();

    // ---- the trail in track space: one sample a metre from d = -PRE
    const NT = PRE + LEN + 121, tx = new Float32Array(NT), tz = new Float32Array(NT);
    const k1 = rng.range(0.8, 1.2), k2 = rng.range(0.85, 1.15), D2R = Math.PI / 180;
    const headAt = (d) => sd * D2R * (20 - 24 * k1 * sstep(133, 205, d) + (24 * k1 + 26 * k2) * sstep(205, 300, d));
    { let x = 0, z = 0;
      for (let i = PRE; i < NT; i++) { tx[i] = x; tz[i] = z; const h = headAt(i - PRE + 0.5); x += Math.sin(h); z -= Math.cos(h); }
      const h0 = headAt(0); for (let i = PRE - 1; i >= 0; i--) { tx[i] = tx[i + 1] - Math.sin(h0); tz[i] = tz[i + 1] + Math.cos(h0); } }
    // point of the trail at distance d, lat metres to the right of travel; also its direction
    const trackPos = (d, lat, out) => {
      const f = clamp(d + PRE, 0, NT - 1.001), i = Math.floor(f), k = f - i, dx = tx[i + 1] - tx[i], dz = tz[i + 1] - tz[i];
      out.x = tx[i] + dx * k - dz * lat; out.z = tz[i] + dz * k + dx * lat; out.dx = dx; out.dz = dz;
      return out;
    };
    const project = (x, z, out) => {
      let best = 1e18, bi = 0;
      for (let i = 0; i < NT - 1; i += 8) { const ax = tx[i] - x, az = tz[i] - z, dd = ax * ax + az * az; if (dd < best) { best = dd; bi = i; } }
      const i0 = Math.max(0, bi - 8), i1 = Math.min(NT - 2, bi + 8);
      for (let i = i0; i <= i1; i++) { const ax = tx[i] - x, az = tz[i] - z, dd = ax * ax + az * az; if (dd < best) { best = dd; bi = i; } }
      const dx = tx[bi + 1] - tx[bi], dz = tz[bi + 1] - tz[bi], ax = x - tx[bi], az = z - tz[bi];
      out.d = bi - PRE + ax * dx + az * dz; out.lat = -ax * dz + az * dx;
      return out;
    };

    // a straight frame for the far country (the trail's own frame folds on the inside of its bends): zs runs with the
    // heading at mid-arcade, xs toward the sun; xsT is the trail's own xs at each zs, so xs - xsT is "toward the sun" everywhere
    const mid = trackPos(220, 0, { x: 0, z: 0 }), hm = headAt(230), N0x = Math.cos(hm), N0z = Math.sin(hm);
    const XS0 = 220, XSN = XS0 + 780, xsT = new Float32Array(XSN).fill(NaN);
    for (let i = 0; i < NT; i++) { const rx = tx[i] - mid.x, rz = tz[i] - mid.z, k = Math.round(rx * N0z - rz * N0x + 220 + XS0); if (k >= 0 && k < XSN) xsT[k] = (rx * N0x + rz * N0z) * sd; }
    { let last = NaN; for (let k = 0; k < XSN; k++) { if (xsT[k] === xsT[k]) last = xsT[k]; else if (last === last) xsT[k] = last; }
      for (let k = XSN - 2; k >= 0; k--) if (!(xsT[k] === xsT[k])) xsT[k] = xsT[k + 1]; }

    // ---- the ground: rolling beaver meadow, the pond's basin and bank, the ridge on the sun side
    const PY = 0;
    const pondE = (d, q, x, z) => Math.hypot((d - 94) / 31, (q + 14) / 46) + 0.06 * noise.n2(x / 15, z / 15);
    const natural = (x, z, d, q) => {
      let h = PY + 2.1 + 1.25 * noise.fbm2(x / 90, z / 90, 3) + 0.3 * noise.n2(x / 21, z / 21);
      const rx = x - mid.x, rz = z - mid.z, zs = rx * N0z - rz * N0x + 220, fz = clamp(zs + XS0, 0, XSN - 1.001), iz = Math.floor(fz);
      const qf = (rx * N0x + rz * N0z) * sd - (xsT[iz] + (xsT[iz + 1] - xsT[iz]) * (fz - iz));
      const rk = sstep(55, 150, qf) * (0.3 + 0.7 * sstep(40, 150, zs) * (1 - 0.55 * sstep(330, 470, zs)));
      h += 22 * rk * (0.8 + 0.25 * noise.n2(x / 60, z / 60));
      h += 9 * sstep(170, 420, -qf) * (0.6 + 0.4 * noise.n2(x / 110, z / 110));
      return PY + (h - PY) * sstep(0.97, 1.32, pondE(d, q, x, z));
    };
    const P = { x: 0, z: 0, dx: 0, dz: 0 }, PR = { d: 0, lat: 0 };
    const prof = new Float32Array(NT);
    { const raw = new Float32Array(NT);
      for (let i = 0; i < NT; i++) raw[i] = natural(tx[i], tz[i], i - PRE, 0);
      for (let i = 0; i < NT; i++) { let sm = 0, n = 0; for (let j = Math.max(0, i - 5); j <= Math.min(NT - 1, i + 5); j++) { sm += raw[j]; n++; } prof[i] = sm / n; } }
    const profAt = (d) => { const f = clamp(d + PRE, 0, NT - 1.001), i = Math.floor(f); return prof[i] + (prof[i + 1] - prof[i]) * (f - i); };
    const groundDL = (x, z, d, lat) => lerp(profAt(d), natural(x, z, d, lat * sd), sstep(3, 22, Math.abs(lat)));
    const groundAt = (x, z) => { project(x, z, PR); return groundDL(x, z, PR.d, PR.lat); };
    await ctx.yield();

    // ---- the camera path: a free flight that keeps company with the team (CAM, in track space)
    const pts = [];
    for (const [d, q, h] of CAM) { trackPos(d, q * sd, P); pts.push([P.x, groundDL(P.x, P.z, d, q * sd) + h, P.z]); }
    const path = makePath(pts), L = path.length;

    // ---- tables over u. camD / camQ: where the eye is in track space. sledT: the sled's track distance (the team runs
    //      its own race: AHEAD_U). Tt: seconds of flight (from the pace). Ft: the light front's arcade distance (the eye's place + FRONT_AHEAD).
    //      Everything scripted reads these: pure functions of u.
    const DUR = 46;
    const bellS = (u, a, b) => sstep(a, a + 0.045, u) * (1 - sstep(b - 0.045, b, u));
    const paceF = (u) => 1 + 0.14 * bellS(u, 0.1, 0.28) - 0.16 * bellS(u, 0.3, 0.55) + 0.05 * bellS(u, 0.555, 0.635) - 0.16 * bellS(u, 0.64, 0.77) - 0.06 * bellS(u, 0.79, 0.9);
    const NTL = 512, Tt = new Float32Array(NTL + 1), Ft = new Float32Array(NTL + 1), camD = new Float32Array(NTL + 1), camQ = new Float32Array(NTL + 1), sledT = new Float32Array(NTL + 1);
    const smoothTab = (raw, out, w) => { for (let i = 0; i <= NTL; i++) { const ww = Math.min(w, i, NTL - i); let sm = 0; for (let k = i - ww; k <= i + ww; k++) sm += raw[k]; out[i] = sm / (2 * ww + 1); } };
    { let acc = 0; for (let i = 0; i < NTL; i++) { acc += 1 / paceF((i + 0.5) / NTL); Tt[i + 1] = acc; } for (let i = 0; i <= NTL; i++) Tt[i] *= DUR / acc;
      const raw = new Float32Array(NTL + 1), v = new THREE.Vector3();
      for (let i = 0; i <= NTL; i++) { path.pointAt(i / NTL, v); project(v.x, v.z, PR); camD[i] = i ? Math.max(camD[i - 1] + 1e-3, PR.d) : PR.d; camQ[i] = PR.lat * sd; }
      for (let i = 0; i <= NTL; i++) raw[i] = camD[i] + pwl(FRONT_AHEAD, i / NTL) - LEAD;
      smoothTab(raw, Ft, 7);
      for (let i = 1; i <= NTL; i++) Ft[i] = Math.max(Ft[i - 1] + 0.02, Ft[i]);
      for (let i = 0; i <= NTL; i++) raw[i] = pwl(AHEAD_U, i / NTL);
      smoothTab(raw, sledT, 6);
      for (let i = 0; i <= NTL; i++) raw[i] = camD[i] + sledT[i];
      { const i0 = Math.round(HIDDEN[0] * NTL), i1 = Math.round(HIDDEN[1] * NTL); for (let i = i0 + 1; i < i1; i++) raw[i] = lerp(raw[i0], raw[i1], (i - i0) / (i1 - i0)); }
      smoothTab(raw, sledT, 5);
      for (let i = 1; i <= NTL; i++) sledT[i] = Math.max(sledT[i - 1] + 0.02, sledT[i]); }
    const tabAt = (tab, u) => { const fq = clamp(u, 0, 1) * NTL, i = Math.min(NTL - 1, Math.floor(fq)); return tab[i] + (tab[i + 1] - tab[i]) * (fq - i); };
    const invTab = (tab, v) => {
      if (v <= tab[0]) return 0; if (v >= tab[NTL]) return 1;
      let lo = 0, hi = NTL; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] <= v) lo = m; else hi = m; }
      return (lo + (v - tab[lo]) / Math.max(1e-6, tab[lo + 1] - tab[lo])) / NTL;
    };
    const Tof = (u) => tabAt(Tt, u);
    const sledAt = (u) => tabAt(sledT, u);
    const releaseAt = (a) => (a <= Ft[0] ? (a - Ft[0]) / 16 : a >= Ft[NTL] ? DUR + (a - Ft[NTL]) / 16 : Tof(invTab(Ft, a)));
    const frontAt = (T) => (T <= 0 ? Ft[0] + 16 * T : T >= DUR ? Ft[NTL] + 16 * (T - DUR) : tabAt(Ft, invTab(Tt, T)));

    await ctx.yield();
    // ---- birches of the hero's own build outside the arcade: the first arch, the open wood, the pond shore, the flanks
    // Where the flight leaves the trail nothing may stand in its way: offP = the eye's places off the trail, and a tree
    // whose foot or bowed crown would come within reach of them is not planted (the arches it flies under are kept by name).
    const offP = [], vT = new THREE.Vector3(), vT2 = new THREE.Vector3();
    for (let i = 0; i <= 300; i++) { const u = i / 300; if (Math.abs(tabAt(camQ, u)) > 3.1) { path.pointAt(u, vT); offP.push(vT.x, vT.z); } }
    const nearCam = (x, z, r) => { for (let i = 0; i < offP.length; i += 2) { const dx = offP[i] - x, dz = offP[i + 1] - z; if (dx * dx + dz * dz < r * r) return true; } return false; };
    const extraTrees = [], treeFeet = [];
    const tr = rng.fork('trees');
    const plant = (x, z, dir, bow, scale, o) => { extraTrees.push({ x, z, dir, bow, scale, release: o.release, light: !!o.light, corr: o.corr, clear: o.clear, whip: o.whip, rag: o.rag }); treeFeet.push([x, z]); };
    const addTree = (d, q, bow, lean, o = {}) => {
      trackPos(d, q * sd, P); const sg = Math.sign(q * sd) || 1;
      const cx = sg * P.dz, cz = -sg * P.dx, c = Math.cos(lean), s = Math.sin(lean);     // toward the trail, turned by lean
      const dir = [cx * c - cz * s, cx * s + cz * c], scale = o.scale ?? tr.range(0.82, 1.08), reach = clamp(13 * bow, 3, 12) * scale;
      for (let k = 0; k < 4; k++) if (nearCam(P.x + dir[0] * reach * k / 3, P.z + dir[1] * reach * k / 3, k ? 5.5 : 6.5)) return;
      plant(P.x, P.z, dir, bow, scale, o);
    };
    addTree(38, 5.7, 1.0, 0.1, { scale: 1.04 }); addTree(38.6, -5.6, 0.98, -0.08, { scale: 1.02 });
    addTree(9, -11, 0.2, 2.6); addTree(19, 11.5, 0.3, 3.4); addTree(27, -14, 0.55, 2.2); addTree(14, 17.5, 0.12, 4.0);
    const nOpen = Math.round(30 * Math.min(1.1, density));
    for (let i = 0; i < nOpen; i++) {
      const d = tr.range(-34, 62), q = tr.sign() * (d < 16 ? tr.range(9.5, 44) : tr.range(8, 44));
      addTree(d, q, tr.chance(0.3) ? tr.range(0.5, 0.85) : tr.range(0.05, 0.4), tr.range(1.7, 4.6), { light: Math.abs(q) > 13 });
    }
    for (let i = 0; i < 14; i++) {
      const a = tr.range(0, 6.283), e = tr.range(1.18, 1.6), d = 94 + Math.cos(a) * 31 * e, q = -14 + Math.sin(a) * 46 * e;
      if (Math.abs(q) < 9 || d > 118 && Math.abs(q) < 14) continue;
      addTree(d, q, tr.range(0.1, 0.9), tr.range(1.7, 4.6), { light: true });
    }
    await ctx.yield();
    // the wood the arcade stands in. A second row leans in behind the ribs and doubles some of them; beyond it bowed,
    // half-bowed and upright birches of the same build fill 12 to 46 m on both sides, and all of them join the wave.
    const relFlank = (d, q) => releaseAt(d - LEAD) + 0.016 * Math.abs(q) + tr.range(-0.1, 0.7);
    const inGap = (d, q) => q > 0 && GAPS.some(([a, b]) => d - LEAD > a - 2 && d - LEAD < b + 2);
    const nRow2 = Math.round(18 * Math.min(1.15, density));
    for (let i = 0; i < nRow2; i++) {
      const d = 133 + (i + tr.range(0.1, 0.9)) * (292 / nRow2), q = (i & 1 ? 1 : -1) * tr.range(8.8, 11.4);
      const bw = tr.range(0.5, 0.95), ln = tr.range(-0.45, 0.45), sc = tr.range(0.8, 1.02), rl = relFlank(d, q);
      if (!inGap(d, q)) addTree(d, q, bw, ln, { scale: sc, release: rl });
    }
    const nFlank = Math.round(96 * Math.min(1.05, density));
    for (let i = 0; i < nFlank; i++) {
      const d = 126 + (i + tr.range(0, 1)) * (316 / nFlank), q = (i & 1 ? 1 : -1) * (12.5 + 33.5 * Math.pow(tr(), 1.25));
      if (d > 428 && Math.abs(q) < 20) { tr(); tr(); tr(); continue; }
      const bw = tr.chance(0.4) ? tr.range(0.7, 1.05) : tr.chance(0.5) ? tr.range(0.35, 0.7) : tr.range(0.05, 0.3);
      const ln = Math.abs(q) < 19 ? tr.range(1.9, 4.4) : tr.range(0, 6.283), sc = tr.range(0.78, 1.12), rl = relFlank(d, q), thin = tr();
      if (Math.hypot(d - 270, q - 19) < 13 || thin < -1) continue;                     // the clearing
      addTree(d, q, bw, ln, { light: true, scale: sc, release: rl });
    }
    // the fallen birch: bowed right over across the clearing, its crown on the snow; the flight turns under its stem.
    // It sheds slowly: the burst runs from its foot to its crown in three seconds as the flight comes up to it, so its ice
    // comes down in separate falls while the outer half still hangs with icicles; it springs up when the flight has passed
    let fallenAt = null;
    { const uA = 0.6; path.pointAt(uA, vT); path.tangentAt(uA, vT2);
      const tl = Math.hypot(vT2.x, vT2.z) || 1, rx = -vT2.z / tl * sd, rz = vT2.x / tl * sd;        // across the flight, away from the arcade
      plant(vT.x - rx * 6.8, vT.z - rz * 6.8, [rx, rz], 1.6, 1.25, { corr: 6.8, clear: 6.3, release: Tof(0.566) - 3.175, whip: Tof(0.632) - Tof(0.566) + 3.175 - 0.95, rag: 2.4 });
      fallenAt = new THREE.Vector3(vT.x + rx * 2, vT.y + 1.4, vT.z + rz * 2); }
    await ctx.yield();

    // ---- the hero: the arcade and its release, on this world's trail and ground
    const centerline = [];
    for (let d = 0; d <= LEN; d += 5) { trackPos(d, 0, P); centerline.push([P.x, 0, P.z]); }
    const uOfCamD = (d) => invTab(camD, d);
    const hero = await buildHero(ctx, { palette: PALETTE, centerline, lead: LEAD, groundAt, hour, load, weather, sunDir: SUN, sunSide: sd, floor: false, extraTrees,
      sunColor: LK.sun, sunIntensity: LK.sunI, glint: LK.glint ?? 1, curtain: 0.42, shadowLat: 96, heraldArc: [55.5, 81.5], heraldCam: [18.5, 35.3], owlArc: 106, skip: (a, s) => s > 0 && GAPS.some(([g0, g1]) => a > g0 && a < g1),
      releaseAt, frontAt, timeAtCamArc: (c) => Tof(uOfCamD(c + LEAD)), shardBoost: (a) => 0.8 + 0.5 * sstep(70, 100, a) * (1 - sstep(262, 292, a)) });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    if (night) HU.uTwigCol.value.lerp(new THREE.Color('#8f96b4'), 0.5).multiplyScalar(1.35);        // freed crowns are silvered by the moon, or they vanish into the sky
    for (const t of A.trees) treeFeet.push([t.x, t.z]);
    await ctx.yield();
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...HU, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });
    const PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    // the same light rule on the CPU, for sprites
    const litJS = (arc, h) => {
      const hs = Math.min((arc - HU.uFront.value) * 0.45, HU.uRidge.value);
      return Math.max(sstep(hs - 1.6, hs + 1.6, h), HU.uLitAll.value, 1 - sstep(HU.uPre.value - 22, HU.uPre.value, arc));
    };

    // ---- the old trail: yesterday's run, which the flight follows where it leaves the team (out through the gap, across
    //      the clearing, along the outside of the row and back in). FP = its line; oldTrail() = metres to its right and how
    //      much of it there is at a ground point (it fades in from the packed track at both ends)
    const FPx = [], FPz = [], FTx = [], FTz = [], OT = { lat: 40, k: 0 };
    { let u0 = 1, u1 = 0;
      for (let i = 0; i <= 400; i++) { const u = i / 400; if (u > 0.45 && u < 0.9 && Math.abs(tabAt(camQ, u)) > 2.6) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); } }
      for (let u = u0 - 0.012; u <= u1 + 0.012; u += 0.0025) { path.pointAt(u, vT); path.tangentAt(u, vT2); const tl = Math.hypot(vT2.x, vT2.z) || 1; FPx.push(vT.x); FPz.push(vT.z); FTx.push(vT2.x / tl); FTz.push(vT2.z / tl); } }
    const oldTrail = (x, z) => {
      let best = 1e18, bi = 0; const n = FPx.length;
      for (let i = 0; i < n; i++) { const dx = x - FPx[i], dz = z - FPz[i], q2 = dx * dx + dz * dz; if (q2 < best) { best = q2; bi = i; } }
      const dx = x - FPx[bi], dz = z - FPz[bi];
      OT.lat = -dx * FTz[bi] + dz * FTx[bi];
      if ((bi === 0 || bi === n - 1) && Math.abs(dx * FTx[bi] + dz * FTz[bi]) > 0.5) OT.lat = Math.sign(OT.lat || 1) * Math.sqrt(best);
      OT.k = sstep(0, 12, bi) * sstep(0, 12, n - 1 - bi) * (1 - sstep(7, 13, Math.abs(OT.lat)));
      return OT;
    };

    // ---- the ground mesh: a grid in track space (fine across the trail, coarse far out), heights from groundAt
    {
      const rowsD = [];
      for (let d = -PRE; d < -30; d += 6) rowsD.push(d);
      for (let d = -30; d <= LEN + 12; d += 2.5) rowsD.push(d);
      for (let d = LEN + 20; d <= LEN + 118; d += 7) rowsD.push(d);
      // (finer and further on the sun side, where the flight leaves the trail for the clearing and the close pass)
      const nearC = [0, 0.7, 1.4, 2.1, 3.2, 5, 8, 12, 17, 24, 32, 40], sunC = [5, 8, 11.5, 15, 19, 23.5, 28, 33, 38, 43, 48, 53, 58, 64, 71], farC = [14, 34, 66, 115, 190, 310, 500], qs = [], cols = [];
      for (let i = farC.length - 1; i >= 0; i--) qs.push([-40, -farC[i]]);
      for (let i = nearC.length - 1; i >= 1; i--) qs.push([-nearC[i], 0]);
      for (let i = 0; i < 5; i++) qs.push([nearC[i], 0]);
      for (const n of sunC) qs.push([n, 0]);
      for (const f of farC) qs.push([71, f]);
      for (const [q, e] of qs) cols.push([q * sd, e * sd]);
      if (sd < 0) cols.reverse();
      // the apron: a portal camera stands before the entry and its near plane cuts away the ground on its side of
      // the opening, which left the lower part of the opening empty. A sheet hangs under the trail just inside the
      // entry (below the ground, so the traveller never sees it) and is shaded as the ground the camera stands over:
      // each point carries the offset to the ground point that a camera 36 m out and 2 m up would see through it.
      const apY = [0, 0.15, 0.32, 0.52, 0.76, 1.05, 1.4, 1.85, 2.4, 3.1, 4, 5.2, 6.8, 9, 12], apC = 29, nAp = apY.length * apC;
      const nr = rowsD.length, nc = cols.length, nG = nr * nc, nV = nG + nAp;
      const pos = new Float32Array(nV * 3), auv = new Float32Array(nV * 2), am = new Float32Array(nV * 2), at = new Float32Array(nV * 2), aoff = new Float32Array(nV * 3), af = new Float32Array(nV * 2), idx = [];
      for (let k = 0; k < nV; k++) af[k * 2] = 40;
      for (let r = 0; r < nr; r++) {
        if ((r & 7) === 7) await ctx.yield();
        for (let c = 0; c < nc; c++) {
          const k = r * nc + c, [lat, ext] = cols[c];
          trackPos(rowsD[r], lat, P);
          const x = P.x + N0x * ext, z = P.z + N0z * ext;
          at[k * 2] = P.dx; at[k * 2 + 1] = P.dz;
          let dd = rowsD[r], ll = lat;
          if (ext !== 0) { project(x, z, PR); dd = PR.d; ll = PR.lat; }
          const e = pondE(dd, ll * sd, x, z);
          pos[k * 3] = x; pos[k * 3 + 1] = groundDL(x, z, dd, ll); pos[k * 3 + 2] = z;
          auv[k * 2] = dd - LEAD; auv[k * 2 + 1] = ll;
          am[k * 2] = e; am[k * 2 + 1] = sstep(1.0, 1.3, e) * (0.55 + 0.45 * noise.n2(x / 40, z / 40));
          if (dd > 200 && dd < 386 && Math.abs(ll) < 62) { oldTrail(x, z); af[k * 2] = OT.lat; af[k * 2 + 1] = OT.k; }
          if (r && c) idx.push(k - nc - 1, k - nc, k - 1, k - nc, k, k - 1);
        }
      }
      await ctx.yield();
      for (let r = 0; r < apY.length; r++) for (let c = 0; c < apC; c++) {
        const k = nG + r * apC + c, lw = (c - (apC - 1) / 2) * 1.0, y = apY[r], f = 2 / (2 + y), gd = -36 * (1 - f), gl = lw * f;
        trackPos(0.5, lw, P);
        const wx = P.x, wz = P.z, wy = groundDL(wx, wz, 0.5, lw) - 0.04 - y;
        trackPos(r ? gd : 0.5, r ? gl : lw, P);
        pos[k * 3] = wx; pos[k * 3 + 1] = wy; pos[k * 3 + 2] = wz;
        aoff[k * 3] = P.x - wx; aoff[k * 3 + 1] = groundDL(P.x, P.z, r ? gd : 0.5, r ? gl : lw) - wy - (r ? 0 : 0.04); aoff[k * 3 + 2] = P.z - wz;
        at[k * 2] = P.dx; at[k * 2 + 1] = P.dz;
        auv[k * 2] = (r ? gd : 0.5) - LEAD; auv[k * 2 + 1] = r ? gl : lw;
        am[k * 2] = pondE(gd, gl * sd, P.x, P.z); am[k * 2 + 1] = 0.55 + 0.45 * noise.n2(P.x / 40, P.z / 40);
        if (r && c) idx.push(k - apC - 1, k - apC, k - 1, k - apC, k, k - 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.BufferAttribute(auv, 2)); g.setAttribute('aM', new THREE.BufferAttribute(am, 2)); g.setAttribute('aT', new THREE.BufferAttribute(at, 2));
      g.setAttribute('aOff', new THREE.BufferAttribute(aoff, 3)); g.setAttribute('aF', new THREE.BufferAttribute(af, 2));
      g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals();
      { const nn = g.attributes.normal.array; for (let k = nG; k < nV; k++) { nn[k * 3] = 0; nn[k * 3 + 1] = 1; nn[k * 3 + 2] = 0; } }
      await ctx.yield();
      trackPos(95, 0, P);
      const sl = Math.hypot(SUN.x, SUN.z) || 1;
      // the white stems that stand in the pond ice: the eight birches nearest the far shore the flight looks at
      const trunkU = [];
      { const c = trackPos(119, 4 * sd, { x: 0, z: 0 }), list = [];
        for (const [x, z] of treeFeet) { project(x, z, PR); const e = pondE(PR.d, PR.lat * sd, x, z); if (e > 0.9 && e < 1.5) list.push([Math.hypot(x - c.x, z - c.z), x, z]); }
        list.sort((a, b) => a[0] - b[0]);
        for (let i = 0; i < 8; i++) { const t = list[i]; trunkU.push(t ? new THREE.Vector4(t[1], t[2], 7.5, 0.2) : new THREE.Vector4(0, 0, 0, 0.001)); } }
      const sc0 = HU.uSunCol.value, lum = 0.2126 * sc0.r + 0.7152 * sc0.g + 0.0722 * sc0.b;
      const ground = new THREE.Mesh(g, mat(GROUND_V, GROUND_F, {
        uSnowSun: { value: sc0.clone().lerp(new THREE.Color(lum, lum, lum), LK.snowWhite ?? 0.42) }, uTrunk: { value: trunkU },
        uHorizon: { value: new THREE.Color(LK.horizon) }, uZenith: { value: new THREE.Color(LK.zenith) }, uIceCol: { value: new THREE.Color(night ? '#0b1838' : '#0f2550') },
        uGnd: { value: new THREE.Vector4(A.arcLength, 0.6, night ? 0.5 : 1, night ? 0.75 : 1) },
        uLook: { value: new THREE.Vector4(night ? 0.7 : 0.86, LK.shaft, night ? 0.5 : 1, LK.icePath) },
        uDir: { value: new THREE.Vector4(SUN.x / sl, SUN.z / sl, P.dz * sd, -P.dx * sd) },
      }, { side: THREE.DoubleSide }));
      ground.frustumCulled = false; ground.renderOrder = -10; scene.add(ground);       // first of all, so the images in the pond ice can be laid on it
    }
    await ctx.yield();

    // ---- sky, haze, the far cloud bank, and a small rig for the kit's trees
    const skyOpts = { rng, ...LK.sky, bake: true, renderer: ctx.renderer };
    if (!night) { skyOpts.sunElevation = LK.el; skyOpts.sunAzimuth = LK.az * sd; }
    if (skyOpts.bodies) skyOpts.bodies = skyOpts.bodies.map((b) => ({ ...b, azimuth: b.azimuth * sd }));
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(LK.fog, LK.fogD);
    await ctx.yield();
    const sunC = HU.uSunCol.value, skyC = HU.uSkyCol.value, sunMax = Math.max(sunC.r, sunC.g, sunC.b, 1e-3), skyMax = Math.max(skyC.r, skyC.g, skyC.b, 1e-3);
    const SUN_I = sunMax * 1.2;
    const dirL = new THREE.DirectionalLight(sunC.clone().multiplyScalar(1 / sunMax), SUN_I);
    dirL.position.copy(SUN).multiplyScalar(200).add(new THREE.Vector3(mid.x, 0, mid.z)); dirL.target.position.set(mid.x, 0, mid.z);
    const hemi = new THREE.HemisphereLight(skyC.clone().multiplyScalar(1 / skyMax), skyC.clone().multiplyScalar(0.55 / skyMax).lerp(sunC.clone().multiplyScalar(0.25 / sunMax), 0.3), skyMax * 1.9);
    scene.add(dirL, dirL.target, hemi);
    await ctx.yield();
    const bank = [], cr = rng.fork('bank');
    for (let i = 0; i < 6; i++) bank.push([mid.x - sd * (500 + i * 260 + cr.range(0, 120)), cr.range(-10, 30) - 34, mid.z - cr.range(1500, 2100), cr.range(360, 620)]);
    // a low bank behind the ranges: drawn before them, so their crests stand in front of it and hide its base; only its lit top shows
    const clouds = makeCloudField({ rng, sky, at: bank, puffs: 30, height: 0.36, wind: [sd * 5, 0, -1.5], fogFade: 0.06, opacity: 0.9, litColor: LK.cloudLit, shadeColor: LK.cloudShade, renderOrder: -0.95 });
    scene.add(clouds.object);
    await ctx.yield();
    const fogC = new THREE.Color(LK.fog);
    {
      const g = new THREE.CylinderGeometry(600, 600, 46, 96, 1, true);
      const ring = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RING_V, fragmentShader: RING_F, side: THREE.BackSide, uniforms: {
        uLow: { value: fogC.clone().multiplyScalar(0.5).lerp(HU.uDeep.value, 0.35) }, uTop: { value: fogC.clone().multiplyScalar(0.6).add(sunC.clone().multiplyScalar(night ? 0.05 : 0.16)) }, uHaze: { value: fogC } } }));
      ring.position.set(mid.x, PY + 22, mid.z); ring.frustumCulled = false; scene.add(ring);
    }
    // the ranges on the horizon: highest ahead and to the shade side, so the opening, the wide view and the run home all have them
    const ranges = new THREE.Mesh(new THREE.CylinderGeometry(2600, 2600, 760, 96, 1, true), new THREE.ShaderMaterial({ vertexShader: MTN_V, fragmentShader: MTN_F, side: THREE.BackSide, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uLitC: { value: sunC.clone().multiplyScalar(night ? 0.5 : 0.3).add(skyC.clone().multiplyScalar(0.42)) }, uShadeC: { value: skyC.clone().multiplyScalar(0.62).add(HU.uDeep.value.clone().multiplyScalar(0.25)) },
        uHazeC: { value: fogC.clone().lerp(new THREE.Color(LK.horizon), night ? 0.3 : 0.45) }, uTimber: { value: HU.uDeep.value.clone().multiplyScalar(0.3) },
        uMt: { value: new THREE.Vector4((((Math.PI - sd * D2R * LK.mtAz) / (2 * Math.PI)) % 1 + 1) % 1, (((Math.PI - sd * D2R * LK.az) / (2 * Math.PI)) % 1 + 1) % 1, 0.66, 0.1) } } }));
    ranges.frustumCulled = false; ranges.renderOrder = -0.9; ranges.position.set(mid.x, PY + 300, mid.z); scene.add(ranges);
    await ctx.yield();

    // the standing wood: cards of iced birches from 55 m out, on both sides, over the ridge and beyond the portal
    {
      const wr = rng.fork('wood'), I0 = [], I1 = [], nW = Math.round(330 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nW; i++) {
        const cap = i % 9 === 0, d = cap ? wr.range(LEN + 45, LEN + 115) : wr.range(-70, LEN + 100), lat = cap ? wr.range(-70, 70) : wr.sign() * (56 + 250 * Math.pow(wr(), 1.7));
        const w = wr.range(26, 44), h = wr.range(14, 19.5), yaw0 = wr.range(-0.45, 0.45), sdv = wr();
        if (pondE(d, lat * sd, 0, 0) < 1.3) continue;
        trackPos(d, lat, P);
        const x = P.x, z = P.z, dirYaw = Math.atan2(-P.dz, P.dx) + (cap ? Math.PI / 2 : 0) + yaw0;
        I0.push(x, groundDL(x, z, d, lat) - 0.4, z, dirYaw); I1.push(w, h, sdv, d - LEAD - lat * 0.35 * sd);
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aI0', new THREE.InstancedBufferAttribute(new Float32Array(I0), 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(new Float32Array(I1), 4));
      g.instanceCount = I0.length / 4;
      const wood = new THREE.Mesh(g, mat(WOOD_V, WOOD_F, {}, { ...PREMULT, side: THREE.DoubleSide }));
      wood.frustumCulled = false; wood.renderOrder = 0.5; scene.add(wood);
    }
    await ctx.yield();

    // ---- kit trees, all well off the trail: dark conifer clumps, the bare far wood, drowned snags, the portal's three spruce
    const wind = flora.makeWind({ direction: [-N0x * sd, -N0z * sd], strength: 0.45 });
    await ctx.yield();
    const leafOpts = { size: 512 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);       // drawn in slices; makeLeafTexture below then only wraps the cached pixels
    const leafMap = flora.makeLeafTexture(leafOpts);      // the kit's full atlas is a 50 ms step; these trees stand 17 m off and further
    await ctx.yield();
    const fmat = flora.windMaterial({ wind, map: leafMap, backlight: 0.25, backlightTint: '#ffd9b8', ambient: 1.6, leafAmbient: 1.5, sheen: 0.15 });
    await ctx.yield();
    const cg = rng.fork('conifers'), conPal = { leaf: '#1c3a30', leafLight: '#2c5544', leafDark: '#0f211d', bark: '#3a2c26', snow: 0.35, snowColor: '#cfd6ea' };
    const conNear = [flora.coniferGeometry({ rng: cg, detail: 1, height: 13, ...conPal })];
    await ctx.yield();
    conNear.push(flora.coniferGeometry({ rng: cg, detail: 1, height: 10, slim: 1.3, ...conPal }));
    await ctx.yield();
    const conFar = [flora.coniferGeometry({ rng: cg, detail: 0, height: 13, ...conPal }), flora.coniferGeometry({ rng: cg, detail: 0, height: 10, slim: 1.3, ...conPal })];
    await ctx.yield();
    const offPond = (x, z) => { project(x, z, PR); return pondE(PR.d, PR.lat * sd, x, z); };
    // the densest birch woods carry the most triangles already: there the kit's conifers and snags thin out again
    const kitK = density <= 1.06 ? density : Math.max(0.75, 1.06 - 1.7 * (density - 1.06));
    const conifers = flora.makeScatter({ rng: cg, path, heightAt: groundAt, material: fmat, variants: conNear, farVariants: conFar, farDistance: 75,
      count: Math.round(88 * kitK * (0.6 + 0.4 * detail)), radius: 250, corridor: 42, spacing: 1.6, scale: [0.7, 1.3], falloff: 0.25, tint: 0.1,
      density: (x, z) => { if (offPond(x, z) < 1.12) return 0; const q = PR.lat * sd; return q > 55 ? 0.8 : (noise.n2(x / 34 + 7, z / 34) > 0.22 ? 1 : 0.05); } });
    scene.add(conifers.object);
    await ctx.yield();
    const bg = rng.fork('farbirch'), birchPal = { detail: 0, foliage: false, bark: '#ddd8d2', barkDark: '#3a3438' };
    const birches = flora.makeScatter({ rng: bg, path, heightAt: groundAt, material: fmat, variants: [flora.birchGeometry({ rng: bg, height: 15, ...birchPal }), flora.birchGeometry({ rng: bg, height: 12, ...birchPal }), flora.birchGeometry({ rng: bg, height: 13.5, ...birchPal })],
      count: Math.round(58 * kitK * detail), radius: 150, corridor: 48, spacing: 1.2, scale: [0.8, 1.25], falloff: 0.35, tint: 0.08,
      density: (x, z) => (offPond(x, z) < 1.15 ? 0 : 1) });
    scene.add(birches.object);
    await ctx.yield();
    const sg = rng.fork('snags'), solo = [];
    for (const [d, q] of [[68, 15.5], [83, -27], [104, 27], [108, -33], [119, 18.5], [88, 26]]) { trackPos(d, q * sd, P); solo.push({ x: P.x, y: PY - 0.2, z: P.z, s: sg.range(0.5, 0.85), rot: sg.range(0, 6.28), v: sg.int(0, 1) }); }
    const snags = flora.makeScatter({ rng: sg, points: solo, material: fmat, variants: [flora.deadTreeGeometry({ rng: sg, detail: 1, bark: '#6f6a70' }), flora.deadTreeGeometry({ rng: sg, detail: 1, bark: '#7a7478' })], tint: 0.05, sink: 0 });
    scene.add(snags.object);
    const sp3 = [];
    for (const [d, q, s] of [[436.5, 9.2, 1], [441, 11.6, 1.1], [445.5, 8.8, 0.92], [448, -13, 0.8],
      [301, 47, 1.05], [311, 44, 0.8], [291, 50, 0.9], [264, 38, 0.7], [243, 39, 0.75], [336, 31, 0.85], [150, -21, 0.9], [176, 25, 0.8], [200, -27, 1.0], [262, -23, 0.85], [308, -19, 0.95], [372, -17, 0.8], [394, 21, 0.9], [22, -24, 0.9], [52, 27, 0.8]]) {
      trackPos(d, q * sd, P); const rot = sg.range(0, 6.28);
      if (d < 430 && nearCam(P.x, P.z, 7.5)) continue;
      sp3.push({ x: P.x, y: groundAt(P.x, P.z) - 0.15, z: P.z, s, rot, v: 0 });
    }
    // young spruce beside the old trail: something dark and shaped in a lower corner of the frame, 8 to 14 m from the eye,
    // through the clearing and all along the close pass (placed against the flight itself: u, metres to its outer side)
    const beside = (u, off, out) => { path.pointAt(u, vT); path.tangentAt(u, vT2); const tl = Math.hypot(vT2.x, vT2.z) || 1; out.x = vT.x - vT2.z / tl * off * sd; out.z = vT.z + vT2.x / tl * off * sd; return out; };
    for (const [u, off, s] of [[0.585, 7.6, 0.34], [0.648, 8.0, 0.4], [0.69, 7.4, 0.3], [0.728, 6.9, 0.42], [0.752, 9.0, 0.34]]) { beside(u, off, P); sp3.push({ x: P.x, y: groundAt(P.x, P.z) - 0.1, z: P.z, s, rot: sg.range(0, 6.28), v: 0 }); }
    // the lynx's cover (rare visits): a young spruce beside the trail, where its crossing starts. The crossing is shifted
    // along the trail until no trunk stands within a metre of it
    let lynxShift = 0;
    { const s84 = sledAt(0.84), clearOf = (sh) => { let m = 1e9; for (let k = 0; k <= 24; k++) { const qq = 9.4 - 22.4 * k / 24, dd = s84 - (qq - 0.8) / 1.5 + 11.3 + sh; trackPos(dd, qq * sd, P); for (const [x, z] of treeFeet) m = Math.min(m, Math.hypot(x - P.x, z - P.z)); } return m; };
      let best = -1; for (const sh of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4]) { const c = clearOf(sh); if (c > best + 0.25) { best = c; lynxShift = sh; } if (c > 1.3) break; }
      if (rare) { trackPos(s84 - (10.0 - 0.8) / 1.5 + 11.3 + lynxShift, 10.0 * sd, P); sp3.push({ x: P.x, y: groundAt(P.x, P.z) - 0.1, z: P.z, s: 0.36, rot: sg.range(0, 6.28), v: 0 }); } }
    // the portal's three black spruce (and one across the trail) are this world's own build: they stand 10 to 20 m from the eye
    {
      const base = spruceGeometry(sg.fork('spruce')), g = new THREE.InstancedBufferGeometry(), I0 = [], I1 = [];
      g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      for (const q of sp3) { project(q.x, q.z, PR); I0.push(q.x, q.y - 0.1, q.z, q.rot); I1.push(q.s, hash(q.x * 0.37 + q.z), PR.d - LEAD - PR.lat * sd * 0.35, 0); treeFeet.push([q.x, q.z]); }
      g.setAttribute('aI0', new THREE.InstancedBufferAttribute(new Float32Array(I0), 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(new Float32Array(I1), 4));
      g.instanceCount = sp3.length;
      const spruce = new THREE.Mesh(g, mat(SPR_V, SPR_F, {}, { side: THREE.DoubleSide }));
      spruce.frustumCulled = false; scene.add(spruce);
    }
    await ctx.yield();

    // ---- glass rods: iced grass and whips along the whole trail, sedge and alder round the pond
    {
      const rr = rng.fork('rods'), I0 = [], I1 = [];
      const put = (d, q, kind, w, h) => {
        trackPos(d, q * sd, P);
        I0.push(P.x, groundDL(P.x, P.z, d, q * sd) - 0.03, P.z, rr.range(0, 6.28)); I1.push(w, h, kind + rr.range(0.02, 0.98), d - LEAD - q * 0.35);
      };
      // iced tufts stand every metre or two beside the berms, knee high on screen; whips and saplings behind them
      const nTrail = Math.round(5400 * detail * Math.min(1.05, density));
      for (let i = 0; i < nTrail; i++) {
        const d = rr.range(-32, LEN + 26), q = rr.sign() * (1.95 + 13 * Math.pow(rr(), 2.3)), whip = Math.abs(q) > 4.6 && rr.chance(0.22);
        if (pondE(d, q, 0, 0) < 0.93 || (d > LEN - 3 && Math.abs(q) < 4.6)) { rr(); rr(); continue; }
        trackPos(d, q * sd, P);
        if (whip && nearCam(P.x, P.z, 4.5)) { rr(); rr(); rr(); rr(); continue; }
        if (whip) put(d, q, 2, rr.range(0.8, 1.6), rr.range(1.2, 2.6)); else put(d, q, 0, rr.range(0.45, 0.95), rr.range(0.3, 0.85));
        if ((i & 127) === 127) await ctx.yield();
      }
      const nSap = Math.round(600 * detail * Math.min(1.05, density));
      for (let i = 0; i < nSap; i++) {
        const d = rr.range(-36, LEN + 40), q = rr.sign() * rr.range(8, 48);
        trackPos(d, q * sd, P);
        if (pondE(d, q, 0, 0) < 1.0 || (d > LEN - 6 && Math.abs(q) < 12) || nearCam(P.x, P.z, 6.5)) { rr(); rr(); continue; }
        put(d, q, 2, rr.range(1.7, 3.4), rr.range(2.6, 5.2));
        if ((i & 127) === 127) await ctx.yield();
      }
      // where the flight leaves the trail (the clearing, the close pass, the way back in) the same tufts and whips stand under it
      const nOff = Math.round(1100 * detail);
      for (let i = 0; i < nOff; i++) {
        const k = 2 * Math.floor(rr() * (offP.length / 2)), an = rr.range(0, 6.283), rad = 1.2 + 12 * Math.pow(rr(), 1.6), whip = rr.chance(0.2);
        const x = offP[k] + Math.cos(an) * rad, z = offP[k + 1] + Math.sin(an) * rad, w = whip ? rr.range(0.8, 1.6) : rr.range(0.45, 0.95), h = whip ? rr.range(1.2, 2.4) : rr.range(0.3, 0.85), yaw = rr.range(0, 6.28), sdv = rr.range(0.02, 0.98);
        project(x, z, PR);
        if (Math.abs(PR.lat) < 7.6 || pondE(PR.d, PR.lat * sd, x, z) < 1.0 || (whip && nearCam(x, z, 4.5))) continue;
        I0.push(x, groundDL(x, z, PR.d, PR.lat) - 0.03, z, yaw); I1.push(w, h, (whip ? 2 : 0) + sdv, PR.d - LEAD - PR.lat * sd * 0.35);
        if ((i & 127) === 127) await ctx.yield();
      }
      const nShore = Math.round(640 * detail);
      for (let i = 0; i < nShore; i++) {
        const a = rr.range(0, 6.283), alder = i % 3 === 0, e = alder ? rr.range(1.0, 1.22) : rr.range(0.9, 1.1), d = 94 + Math.cos(a) * 31 * e, q = -14 + Math.sin(a) * 46 * e;
        if (Math.abs(q) < (alder ? 5.2 : 2.2)) { rr(); rr(); continue; }
        if (alder) put(d, q, 1, rr.range(1.6, 2.8), rr.range(1.7, 2.9)); else put(d, q, 0, rr.range(0.6, 1.1), rr.range(0.45, 0.95));
      }
      const g = new THREE.InstancedBufferGeometry(), tg = tuftGeometry();
      g.index = tg.index; for (const k in tg.attributes) g.setAttribute(k, tg.attributes[k]);
      g.setAttribute('aI0', new THREE.InstancedBufferAttribute(new Float32Array(I0), 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(new Float32Array(I1), 4));
      g.instanceCount = I0.length / 4;
      const rods = new THREE.Mesh(g, mat(ROD_V, ROD_F, {}, { ...PREMULT, side: THREE.DoubleSide }));
      rods.frustumCulled = false; rods.renderOrder = 1; scene.add(rods);
    }
    await ctx.yield();

    // ---- mountain-ash, the one red in the world: at the first arch, on the bank, round the pond (where they stand
    //      mirrored in the black ice), at the arcade's mouth, and in the clearing where the flight passes close
    {
      const ar = rng.fork('ash'), base = ashGeometry(ar);
      const spots = [[41, -7.2], [33, 8.8], [47, 10.6], [61, -9], [65, 12], [57, 17], [92, 31.5], [106, 27.5], [121.5, -9.5], [126, 11.8], [117.5, -17], [232, 19], [250, 30], [297, 26], [323, 23]];
      // and against the flight where it leaves the team: at the gap, close beside the eye after the fallen birch (the red fills a side of the frame), along the row
      for (const [u, off] of [[0.572, 6.4], [0.642, -5.4], [0.668, 11.5], [0.712, 12.5]]) { beside(u, off, P); project(P.x, P.z, PR); spots.push([PR.d, PR.lat * sd]); }
      const I0 = [], I1 = [], M0 = [], M1 = [];
      for (const [d, q] of spots) {
        trackPos(d, q * sd, P); const y = groundAt(P.x, P.z) - 0.05, yaw = ar.range(0, 6.28), sc = ar.range(0.85, 1.15), sdv = ar();
        I0.push(P.x, y, P.z, yaw); I1.push(sc, sdv, d - LEAD - q * 0.35, 0); treeFeet.push([P.x, P.z]);
        if (d > 55 && d < 130) { M0.push(P.x, y, P.z, yaw); M1.push(sc, sdv, d - LEAD - q * 0.35, 0); }
      }
      const inst = (a0, a1) => {
        const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
        g.setAttribute('aI0', new THREE.InstancedBufferAttribute(new Float32Array(a0), 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(new Float32Array(a1), 4));
        g.instanceCount = a0.length / 4; return g;
      };
      const pc = trackPos(94, -14 * sd, { x: 0, z: 0, dx: 0, dz: 0 }), red = { value: new THREE.Color(PALETTE[6]) }, pondC = { value: new THREE.Vector4(pc.x, pc.z, pc.dx, pc.dz) };
      const ash = new THREE.Mesh(inst(I0, I1), mat(ASH_V, ASH_F, { uRed: red, uMir: { value: new THREE.Vector4(0, PY, 0, 0) }, uPondC: pondC }, { side: THREE.DoubleSide }));
      ash.frustumCulled = false; scene.add(ash);
      // the images: the same trees turned over under the ice, laid on the ground before anything else is drawn
      const img = new THREE.Mesh(inst(M0, M1), mat(ASH_V, ASH_F, { uRed: red, uMir: { value: new THREE.Vector4(1, PY, 0, 0) }, uPondC: pondC },
        { side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
      img.frustumCulled = false; img.renderOrder = -9; scene.add(img);
    }
    await ctx.yield();

    // ---- creatures and props on the shared rig
    const bounceC = HU.uSunCol.value.clone().multiplyScalar(LK.bounce);
    const critter = (geo, n, o) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
      const i0 = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), i1 = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), ti = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      if (o.dynamic !== false) { i0.setUsage(THREE.DynamicDrawUsage); i1.setUsage(THREE.DynamicDrawUsage); }
      g.setAttribute('aI0', i0); g.setAttribute('aI1', i1); g.setAttribute('aTint', ti); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat(CRIT_V, CRIT_F, {
        uGait: { value: new THREE.Vector4(...(o.gait || [0, 0, 0, 0])) }, uAmp: { value: new THREE.Vector4(...(o.amp || [0, 0, 0, 0])) }, uBob: { value: new THREE.Vector4(...(o.bob || [0, 0, 0, 0])) },
        uScale: { value: o.scale ?? 1 }, uWeave: { value: o.weave ?? 0 }, uCoat: { value: new THREE.Vector4(...(o.coat || [0, 0, 0, 0])) }, uDark: { value: new THREE.Color(o.dark || '#10131f') }, uFur: { value: new THREE.Vector4(...(o.fur || [0.3, 0.6, 0.3, 0.02])) }, uBounce: { value: bounceC },
      }, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
      const c = new THREE.Color();
      return {
        mesh: m,
        set(i, x, y, z, yaw, phase, pitch, run, arc) { const a = i0.array, b = i1.array, k = i * 4; a[k] = x; a[k + 1] = y; a[k + 2] = z; a[k + 3] = yaw; b[k] = phase; b[k + 1] = pitch; b[k + 2] = run; b[k + 3] = arc; i0.needsUpdate = true; i1.needsUpdate = true; },
        tint(i, hex, k = 1) { c.set(hex).multiplyScalar(k); ti.array[i * 3] = c.r; ti.array[i * 3 + 1] = c.g; ti.array[i * 3 + 2] = c.b; ti.needsUpdate = true; },
      };
    };
    const TAU = Math.PI * 2, cr2 = rng.fork('cast');
    const huskyGeo = huskyGeometry();
    await ctx.yield();
    const dogs = critter(huskyGeo, 6, { gait: [0, 0.7, Math.PI + 0.35, Math.PI + 1.05], amp: [0.6, 0.66, 0.9, 0.055], bob: [0.045, 0.02, 0.085, 0.47], scale: 1.16, dark: '#14151c', fur: [0.34, 1.0, 0.3, 0.03], coat: [1, 0.45, 1, 0] });
    const dogPh = [], dogJit = [];
    for (let k = 0; k < 6; k++) { dogs.tint(k, COATS[coats][cr2.int(0, 2)], cr2.range(0.85, 1.1)); dogPh.push(cr2.range(0, TAU)); dogJit.push(cr2.range(-0.12, 0.12)); }
    const AHEAD = [3.5, 5.8, 8.1], STRIDE = 3.3;
    await ctx.yield();
    const sled = critter(sledGeometry(), 1, { dark: '#15171f', fur: [0.22, 0.5, 0.3, 0.09], weave: 1 });
    sled.tint(0, '#8a7f6a');
    await ctx.yield();
    const runner = critter(quadruped(fox ? FOX : HARE), 1, { gait: [0, 0.15, Math.PI - 0.3, Math.PI - 0.1], amp: [1.0, 0.75, 1.1, 0.16], bob: [fox ? 0.1 : 0.17, 0.03, 0.03, fox ? 0.3 : 0.2], scale: fox ? 1.45 : 1.65, dark: '#14100f', fur: [0.3, 1.2, 0.2, 0.05] });
    runner.tint(0, fox ? '#b4521c' : '#dfe6f2');
    await ctx.yield();
    const lynx = critter(quadruped(LYNX), 1, { gait: [0, 0.2, Math.PI - 0.35, Math.PI - 0.1], amp: [0.95, 0.85, 1.0, 0.15], bob: [0.3, 0.05, 0.02, 0.57], scale: 1.55, dark: '#1c1613', fur: [0.55, 1.3, 0.3, 0.03], coat: [1, 0.7, 1, 0] });
    lynx.tint(0, '#94846f'); lynx.mesh.visible = rare;
    await ctx.yield();
    // a great grey owl: slate grey-brown, the flight feathers and tail barred, each yellow eye in its rings (CRIT_F draws them)
    const owl = critter(owlGeometry(), 1, { amp: [0.78, 0.12, 0, 0], scale: 1.95, dark: '#d9d2c4', fur: [0.55, 1.1, 0.01, 0.05], coat: [0.8, 0.6, 1, 12] });
    owl.tint(0, '#5c544c');
    await ctx.yield();
    // the lodge 14 m off on the shaded side, its sticks, the dam on the sun side, peeled sticks on the ice
    const lodgeAt = trackPos(92, -14 * sd, { x: 0, z: 0 }), ventTop = new THREE.Vector3(lodgeAt.x, PY + 2.6, lodgeAt.z);
    {
      const lr = rng.fork('lodge'), lodge = critter(lodgeGeometry(lr), 1, { dynamic: false, fur: [0.7, 0.3, 0.5, 0.0] });
      lodge.set(0, lodgeAt.x, PY - 0.05, lodgeAt.z, lr.range(0, 6.28), 0, 0, 0, 92 - LEAD); lodge.tint(0, '#2a1d17');
      const NS = 86 + 70 + 14, sticks = critter(stickGeometry(), NS, { dynamic: false, fur: [0.6, 0.5, 0.2, 0.0] });
      const prof2 = [[0, 3.6], [0.45, 3.2], [1.1, 2.5], [1.75, 1.7], [2.2, 0.95], [2.5, 0.25]];
      for (let i = 0; i < NS; i++) {
        if (i < 86) {
          const y = lr.range(0.05, 2.45), a = lr.range(0, 6.28); let r = 0.3;
          for (let j = 0; j < 5; j++) if (y >= prof2[j][0] && y <= prof2[j + 1][0]) r = lerp(prof2[j][1], prof2[j + 1][1], (y - prof2[j][0]) / (prof2[j + 1][0] - prof2[j][0]));
          sticks.set(i, lodgeAt.x + Math.cos(a) * (r + 0.05), PY + y + 0.05, lodgeAt.z + Math.sin(a) * (r + 0.05), Math.atan2(Math.cos(a), Math.sin(a)) + lr.range(-0.9, 0.9), 0, lr.range(0.15, 0.8), 0, 92 - LEAD);
          sticks.tint(i, lr.chance(0.25) ? '#8f7a5c' : '#3a2a20', lr.range(0.6, 1.2));
        } else if (i < 156) {
          const th = lerp(0.95, 2.2, (i - 86) / 70) + lr.range(-0.03, 0.03), e = 1.0 + lr.range(-0.02, 0.03), d = 94 + Math.cos(th) * 31 * e, q = -14 + Math.sin(th) * 46 * e;
          trackPos(d, q * sd, P);
          sticks.set(i, P.x, PY + lr.range(0.05, 0.9), P.z, lr.range(0, 6.28), 0, lr.range(-0.5, 0.5), 0, d - LEAD); sticks.tint(i, lr.chance(0.2) ? '#8f7a5c' : '#33261e', lr.range(0.6, 1.2));
        } else {
          const near = i < 163, a = lr.range(0, 6.28), rad = lr.range(4.2, 8);
          if (near) trackPos(lr.range(72, 116), lr.sign() * lr.range(2.6, 5.5), P); else { P.x = lodgeAt.x + Math.cos(a) * rad; P.z = lodgeAt.z + Math.sin(a) * rad; }
          sticks.set(i, P.x, PY + 0.035, P.z, lr.range(0, 6.28), 0, 0, 0, 92 - LEAD); sticks.tint(i, '#c9b48a', lr.range(0.8, 1.1));
        }
      }
    }
    await ctx.yield();

    // ---- ganglines: one main line from the brush bow to the leaders, a tugline and a neckline for every dog
    const NODES = 9 + 12 + 12, lpos = new Float32Array(NODES * 2 * 3), ltan = new Float32Array(NODES * 2 * 3);
    const lineGeo = new THREE.BufferGeometry(), lineLit = { value: 1 };
    {
      const side = new Float32Array(NODES * 2), idx = [];
      for (let i = 0; i < NODES; i++) { side[i * 2] = -1; side[i * 2 + 1] = 1; }
      const seg = (a) => idx.push(a * 2, a * 2 + 1, a * 2 + 2, a * 2 + 1, a * 2 + 3, a * 2 + 2);
      for (let i = 0; i < 8; i++) seg(i);
      for (let k = 0; k < 12; k++) seg(9 + k * 2);
      const pa = new THREE.BufferAttribute(lpos, 3), ta = new THREE.BufferAttribute(ltan, 3); pa.setUsage(THREE.DynamicDrawUsage); ta.setUsage(THREE.DynamicDrawUsage);
      lineGeo.setAttribute('position', pa); lineGeo.setAttribute('aTan', ta); lineGeo.setAttribute('aSide', new THREE.BufferAttribute(side, 1)); lineGeo.setIndex(idx);
      const lines = new THREE.Mesh(lineGeo, mat(LINE_V, LINE_F, { uW: { value: 0.024 }, uLineCol: { value: new THREE.Color('#1d2238') }, uLit: lineLit }, { side: THREE.DoubleSide }));
      lines.frustumCulled = false; scene.add(lines);
    }
    const node = (i, x, y, z) => { const k = i * 6; lpos[k] = lpos[k + 3] = x; lpos[k + 1] = lpos[k + 4] = y; lpos[k + 2] = lpos[k + 5] = z; };
    const tang = (a, b) => { for (let i = a; i <= b; i++) { const p = Math.max(a, i - 1) * 6, n = Math.min(b, i + 1) * 6, k = i * 6; for (let c = 0; c < 3; c++) ltan[k + c] = ltan[k + 3 + c] = lpos[n + c] - lpos[p + c]; } };

    // ---- soft sprites: powder from 24 feet, breath, the runner's landings, lodge steam
    const NPUFF = 48 + 12 + 8 + 8 + 14 + 8, pP = new Float32Array(NPUFF * 4), pC = new Float32Array(NPUFF * 4);
    const puffGeo = new THREE.InstancedBufferGeometry();
    puffGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); puffGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const pPa = new THREE.InstancedBufferAttribute(pP, 4), pCa = new THREE.InstancedBufferAttribute(pC, 4); pPa.setUsage(THREE.DynamicDrawUsage); pCa.setUsage(THREE.DynamicDrawUsage);
    puffGeo.setAttribute('aP', pPa); puffGeo.setAttribute('aC', pCa); puffGeo.instanceCount = NPUFF;
    const puffs = new THREE.Mesh(puffGeo, mat(PUFF_V, PUFF_F, {}, PREMULT));
    puffs.frustumCulled = false; puffs.renderOrder = 4; scene.add(puffs);
    const WK_A = [], WK_ROWS = 25, WK_L = [-1.7, -1.05, -0.55, 0, 0.55, 1.05, 1.7], WK_H = [0.07, 0.19, 0.33];
    const wakeGeo = new THREE.BufferGeometry(), wakeU = { value: new THREE.Vector4(0, 0, 1, 0) };
    {
      const idx = [], nc = WK_L.length;
      for (let ly = 0; ly < 3; ly++) for (let r = 0; r < WK_ROWS; r++) for (let c = 0; c < nc; c++) {
        WK_A.push(-2 + r * 0.5, WK_L[c], ly / 2);
        if (r && c) { const k = (ly * WK_ROWS + r) * nc + c; idx.push(k - nc - 1, k - nc, k - 1, k - nc, k, k - 1); }
      }
      const pa = new THREE.BufferAttribute(new Float32Array(WK_A.length), 3); pa.setUsage(THREE.DynamicDrawUsage);
      wakeGeo.setAttribute('position', pa); wakeGeo.setAttribute('aA', new THREE.Float32BufferAttribute(WK_A, 3)); wakeGeo.setIndex(idx);
      const wake = new THREE.Mesh(wakeGeo, mat(WAKE_V, WAKE_F, { uWake: wakeU }, { ...PREMULT, side: THREE.DoubleSide }));
      wake.frustumCulled = false; wake.renderOrder = 3.5; scene.add(wake);
    }
    const puff = (i, x, y, z, size, alpha, lit) => { const k = i * 4; pP[k] = x; pP[k + 1] = y; pP[k + 2] = z; pP[k + 3] = size; pC[k] = alpha; pC[k + 1] = lit; pC[k + 2] = hash(i * 3.7); };
    await ctx.yield();

    // ---- air: diamond dust everywhere (thicker in that weather), or a shower falling through the light
    const time = { value: 0 };
    const dustCols = night ? ['#cfdcff', '#ffffff', '#9fb6ff'] : ['#ffe2d6', '#fff4e2', '#ffd9a8'];
    const air = weather === 'shower'
      ? fx.makeParticles({ rng: rng.fork('air'), preset: 'snow', time, count: Math.round(2600 * detail), box: [38, 18, 38], velocity: [-sd * 1.4, -1.5, 0.3], colors: dustCols, intensity: night ? 0.8 : 1.25, size: [0.045, 0.11] })   // near, soft and plentiful: flakes, not stars
      : fx.makeParticles({ rng: rng.fork('air'), preset: 'dust', time, count: Math.round((weather === 'dust' ? 2600 : 500) * detail), box: [38, night ? 16 : weather === 'dust' ? 7.5 : 5.5, 38], velocity: [-sd * 0.25, -0.22, 0.05], colors: dustCols, intensity: night ? 1.2 : weather === 'dust' ? 1.7 : 1.3, size: [0.016, 0.045], twinkle: 0.9 });
    scene.add(air.object);
    const showerAir = weather === 'shower';
    await ctx.yield();

    // ---- shafts of low sun in the air: down the whole trail, thickest in the arcade (BEAM_V / BEAM_F)
    {
      const bm = rng.fork('beams'), nB = Math.round(280 * detail), B0 = new Float32Array(nB * 4), B1 = new Float32Array(nB * 4);
      for (let i = 0; i < nB; i++) {
        // among the trees only, and below their crowns: against open sky a shaft is a smear
        const d = bm.chance(0.82) ? bm.range(128, 430) : bm.range(-30, 58), lat = bm.range(-12, 12), hm = bm.range(1.1, 4.6);
        const len = Math.min(bm.range(13, 28), (hm - 0.4) * 2 / Math.max(0.05, SUN.y)), wdt = bm.range(0.5, 1.5);
        trackPos(d, lat, P); const y = groundDL(P.x, P.z, d, lat) + hm;
        B0.set([P.x + SUN.x * len * 0.5, y + SUN.y * len * 0.5, P.z + SUN.z * len * 0.5, len], i * 4);
        B1.set([wdt, bm(), d - LEAD - lat * sd * 0.35, hm], i * 4);
      }
      const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [], SEG = 8;
      for (let j = 0; j <= SEG; j++) { pos.push(-0.5, j / SEG, 0, 0.5, j / SEG, 0); if (j) { const k = j * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('aB0', new THREE.InstancedBufferAttribute(B0, 4)); g.setAttribute('aB1', new THREE.InstancedBufferAttribute(B1, 4)); g.instanceCount = nB;
      const beams = new THREE.Mesh(g, mat(BEAM_V, BEAM_F, { uBeam: { value: new THREE.Vector4(LK.beam, 1, 0, 0) } }, { ...PREMULT, side: THREE.DoubleSide }));
      beams.frustumCulled = false; beams.renderOrder = 2.6; beams.visible = LK.beam > 0; scene.add(beams);
    }
    await ctx.yield();

    // ---- small birds in loose parties, bouncing across the trail all the way along
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const br = rng.fork('birds'), partyU = [0.03, 0.13, 0.26, 0.36, 0.53, 0.62, 0.71, 0.86, 0.94];
    for (let i = 0; i < partyU.length; i++) {
      const n = Math.max(3, Math.round(br.range(5, 8) * density));
      fauna.add(F.makeFlock({ rng: br, species: 'crows', count: n, size: 0.46, speed: br.range(6, 8), flap: 9, amp: 0.8, glide: 0.5, spread: [3.2, 1.3, 5], wander: [1.3, 1.0, 1.1, 1.3], palette: BIRDS[birdKind], rim: 0.6,
        cross: { path, u: partyU[i], lead: i === 0 ? 17 : br.range(12, 17), span: 54, angle: br.range(55, 100), side: br.sign(), height: i === 0 ? 2.0 : br.range(0.8, 2.6), duration: DUR, sag: 1.2 } }));
      await ctx.yield();
    }
    await ctx.yield();

    // ---- scripted casts: pure functions of u
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), camW = new THREE.Vector3(), owlP = new THREE.Vector3(), waveP = new THREE.Vector3(), teamP = new THREE.Vector3(), vaultP = new THREE.Vector3(), herald1 = A.heralds[0].curtain.clone(), herald2 = A.heralds[1].curtain.clone();
    // the owl: perched in a bowed crown 25 m beyond the far herald; as that herald's ice comes down it lifts, comes down
    // the nave toward the eye and crosses under 5 m ahead of it at u 0.467, a wing's length above, then away over the
    // shoulder on the shade side
    const uCross = 0.467, uLift = Math.max(uCross - 0.068, Math.min(uCross - 0.05, invTab(Tt, A.owlLiftTime)));
    const oA = A.owlPerch.clone(), oB = new THREE.Vector3(), oC = new THREE.Vector3();
    { path.pointAt(uCross, vT); path.tangentAt(uCross, vT2); const tl = Math.hypot(vT2.x, vT2.z) || 1, fx0 = vT2.x / tl, fz0 = vT2.z / tl, lx = fz0 * sd, lz = -fx0 * sd;      // toward the shade side
      oB.set(vT.x + fx0 * 4.6 + lx * 0.4, vT.y + 0.6, vT.z + fz0 * 4.6 + lz * 0.4); oC.set(vT.x - fx0 * 5 + lx * 7.5, vT.y + 3.6, vT.z - fz0 * 5 + lz * 7.5); }
    const owlAt = (u, out) => {
      const w0 = clamp((u - uLift) / ((uCross - uLift) / 0.671), 0, 1.35), w = Math.pow(w0, 1.2);      // w = 0.62 (the crossing) exactly at uCross
      const l0 = (w - 0.62) * (w - 1) / 0.62, l1 = w * (w - 1) / (0.62 * -0.38), l2 = w * (w - 0.62) / 0.38;
      out.set(oA.x * l0 + oB.x * l1 + oC.x * l2, oA.y * l0 + oB.y * l1 + oC.y * l2, oA.z * l0 + oB.z * l1 + oC.z * l2);
      return w0;
    };
    // the hare (or fox): breaks from a birch foot on the sun side and runs beside the leaders, a little ahead of the eye,
    // then cuts across in front of them and away. All of it in metres the SLED has run since the break.
    const uBreak = 0.8, sBreak0 = sledAt(uBreak), sBreak = sBreak0 + 11.5;
    const runAt = (u, out) => {                               // out.x = track distance, out.y = metres toward the sun side
      const sS = sledAt(u), t = sS - sBreak0;
      if (t <= 0) { out.x = sBreak; out.y = 6.3; return 0; }
      out.x = sS + 11.5 - 2.4 * sstep(0, 8, t) + 8 * sstep(15, 31, t);
      out.y = 6.3 - 1.3 * sstep(0, 7, t) - 23 * sstep(27, 47, t);
      return sstep(0, 1.2, t);
    };
    // the lynx, on a rare visit: nothing is seen of it until it bursts from under a young spruce on the sun side, a second
    // and a half behind the hare, and crosses the trail in three long bounds just ahead of the leaders. At u 0.84 it is
    // in mid-bound over the packed track, 7 m from the eye. sS = the sled's track distance; all of it in the sled's metres.
    const sStar = sledAt(0.84), L_AHEAD = 10.7 + lynxShift, L_Q0 = 9.4;
    const lynxQ = (sS) => 0.8 - 1.5 * (sS - sStar);
    const lynxAt = (u, out) => { const sS = sledAt(u); out.x = sS + L_AHEAD; out.y = lynxQ(sS); return out.y; };
    trackPos(95, 0, P); const WX = P.dz * sd, WZ = -P.dx * sd;
    const Q = { x: 0, z: 0, dx: 0, dz: 0 };
    const mouthP = trackPos(127, 1.5 * sd, { x: 0, z: 0 }), mouthAt = new THREE.Vector3(mouthP.x, profAt(127) + 4.5, mouthP.z);

    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      // brisk over the pond, lingering in the nave and all along the close pass beside the wave, a little beside the leaders
      pace: paceF,
      title: 'The Glass Birches',
      ride: 'none', style: 'none',
      camera: { fov: 64, near: 0.3, far: 4000, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois: [
        // the team crossing the ice, the lodge steaming beyond it
        { at: (t, u) => { const a = sledAt(u) + 3; trackPos(a, 0, Q); return teamP.set(Q.x, profAt(a) + 1.3, Q.z); }, from: 0.1, to: 0.27, weight: 0.5 },
        { at: ventTop, from: 0.09, to: 0.24, weight: 0.2 },
        { at: mouthAt, from: 0.21, to: 0.31, weight: 0.3 },
        // in the nave the gaze is lifted into the vault, so the arches close over the team
        { at: (t, u) => { const a = tabAt(camD, u) + 30; trackPos(a, 0, Q); return vaultP.set(Q.x, profAt(a) + 8.5, Q.z); }, from: 0.27, to: 0.56, weight: 0.3 },
        { at: herald1, from: 0.29, to: 0.4, weight: 0.35 },
        { at: herald2, from: 0.365, to: 0.455, weight: 0.3 },
        { at: (t, u) => { owlAt(u, owlP); return owlP; }, from: uLift - 0.01, to: uCross + 0.012, weight: 0.4 },
        // the team again, as the light comes up from behind and the ice begins to fall round it
        { at: (t, u) => { const a = sledAt(u) + 4; trackPos(a, 0, Q); return teamP.set(Q.x, profAt(a) + 2.0, Q.z); }, from: 0.44, to: 0.575, weight: 0.4 },
        { at: fallenAt, from: 0.53, to: 0.61, weight: 0.3 },
        // the release, seen from outside the ribs: the gaze rests where the curtains are falling, just behind the light front
        { at: (t, u) => { const a = tabAt(Ft, u) + LEAD - 27; trackPos(a, 0, Q); return waveP.set(Q.x, profAt(a) + 4.2, Q.z); }, from: 0.6, to: 0.8, weight: 0.7 },
        // coming back in over the team: the gaze drops to the dogs, so the whole team is in the frame as the eye overtakes it
        { at: (t, u) => { const a = sledAt(u) + 5.5; trackPos(a, 0, Q); return teamP.set(Q.x, profAt(a) + 0.8, Q.z); }, from: 0.74, to: 0.83, weight: 0.5 },
      ],
      portal: { shape: 'arch', width: 9, height: 14, color: LK.portal, glow: 1, revealDistance: 260 },
      post: { exposure: LK.exposure, bloom: { strength: 0.42, radius: 0.35, threshold: 0.95 }, grade: LK.grade },
      // the tables, for checking the flight without a renderer
      info: { camD, camQ, sledT, Ft, Tt, sledAt, trackPos, profAt, groundAt, treeFeet, extraTrees, heroTrees: A.trees, uLift, uCross, owlAt, runAt, lynxAt, lynxShift, sd, LEAD },
      update(dt, t, camera, u) {
        time.value = t;
        // the sled runs its own race along the trail: s = its track distance at this u (never the camera's place, so that
        // seen through the previous portal, at u 0, the team stands where the flight will find it)
        const s = sledAt(u), sArc = s - LEAD, run = sstep(0, 0.004, u);
        if (showerAir) air.setOpacity(1 - 0.75 * sstep(0.42, 0.5, u) * (1 - sstep(0.88, 0.96, u)));        // the shower thins while the ice falls, so nothing is mistaken for it
        HU.uFull.value = sstep(5.5, 9, Math.abs(tabAt(camQ, u)));       // outside the ribs the falling curtains are seen whole; inside the vault they stay thin
        hero.setTime(Tof(u)); hero.update(dt, t, camera);
        dirL.intensity = SUN_I * (HU.uLitAll.value > 0.5 ? 1 : 1 - 0.78 * sstep(0.27, 0.32, u) * (1 - sstep(0.44, 0.5, u)));
        sky.update(dt, t, camera); clouds.update(dt, t, camera); air.update(dt, t, camera);
        conifers.update(dt, t, camera); birches.update(dt, t, camera); snags.update(dt, t, camera);
        fauna.update(dt, t, camera, u);
        camera.getWorldPosition(camW); ranges.position.set(camW.x, PY + 300, camW.z);
        // the sled and its musher
        trackPos(s, 0, P);
        sled.set(0, P.x, profAt(s) + 0.006 * Math.sin(t * 13) * run, P.z, Math.atan2(P.dx, P.dz), 0, Math.atan((profAt(s + 1.5) - profAt(s - 1)) / 2.5), 0, sArc);
        // the gangline from the brush bow to the leaders
        const gh = (a) => profAt(s + a) + lerp(0.27, 0.47, (a - 2.67) / 5.6) + 0.015 * Math.sin(t * 11 + a * 2) * run;
        for (let i = 0; i < 9; i++) { const a = 2.67 + 5.6 * i / 8; trackPos(s + a, 0, P); node(i, P.x, gh(a), P.z); }
        tang(0, 8);
        // the team, its lines, powder and breath
        let pi = 0;
        for (let k = 0; k < 6; k++) {
          const side = k & 1 ? 1 : -1, ahead = AHEAD[k >> 1] + dogJit[k], sk = s + ahead, lat = side * 0.33 + 0.03 * Math.sin(t * 0.8 + k * 2.1);
          trackPos(sk, lat, P);
          dogs.set(k, P.x, profAt(sk) - 0.025, P.z, Math.atan2(P.dx, P.dz), (sk / STRIDE) * TAU + dogPh[k], Math.atan(profAt(sk + 0.5) - profAt(sk - 0.5)), run, sk - LEAD);
          const n0 = 9 + k * 2, n1 = 21 + k * 2;
          trackPos(sk - 0.46, lat * 0.85, P); node(n0, P.x, profAt(sk) + 0.66, P.z);
          trackPos(sk - 1.3, 0, P); node(n0 + 1, P.x, gh(ahead - 1.3), P.z); tang(n0, n0 + 1);
          trackPos(sk + 0.4, lat * 0.8, P); node(n1, P.x, profAt(sk) + 0.7, P.z);
          trackPos(sk + 0.3, 0, P); node(n1 + 1, P.x, gh(Math.min(ahead + 0.3, 8.27)), P.z); tang(n1, n1 + 1);
          // the kicks at each dog's feet: small soft bursts that dissolve into the wake (the wake sheets carry the body of the powder)
          const powder = (pondE(sk, 0, 0, 0) < 0.93 ? 0.35 : 1) * run, base = Math.floor(sk / 0.2);
          for (let j = 0; j < 8; j++) {
            const sj = (base - j) * 0.2 - 0.15, tt = clamp((sk - 0.15 - sj) / 1.6, 0, 1), h = hash(base - j + k * 17.3);
            trackPos(sj, lat + side * (0.08 + 0.3 * tt) + (h - 0.5) * 0.22, P);
            puff(pi++, P.x, profAt(sj) + 0.06 + 0.2 * tt + 0.05 * h, P.z, 0.17 + 0.3 * tt, 0.5 * Math.pow(Math.max(0, 1 - tt), 1.2) * sstep(0, 0.12, tt) * powder, litJS(sj - LEAD, 0.4));
          }
          for (let j = 0; j < 2; j++) {
            const bp = (t / 0.95 + k * 0.37 + j * 0.5) % 1;
            trackPos(sk + 0.55 - 9 * bp * run, lat + 0.25 * bp * side, P);
            puff(48 + k * 2 + j, P.x, profAt(sk) + 0.72 + 0.55 * bp, P.z, 0.16 + 0.65 * bp, 0.6 * (1 - bp) * sstep(0, 0.12, bp), litJS(sk - LEAD, 0.9));
          }
        }
        // the runners throw their own low plumes beside the basket
        for (let j = 0; j < 8; j++) {
          const sdR = j & 1 ? 1 : -1, ph = ((s / 2.6 + j * 0.29) % 1 + 1) % 1, za = 2.5 - 2.3 * ph;
          trackPos(s + za, sdR * (0.4 + 0.5 * ph), P);
          puff(90 + j, P.x, profAt(s + za) + 0.08 + 0.3 * ph, P.z, 0.2 + 0.45 * ph, 0.45 * (1 - ph) * sstep(0, 0.1, ph) * run * (pondE(s, 0, 0, 0) < 0.93 ? 0.3 : 1), litJS(sArc + za, 0.3));
        }
        // the wake sheets ride the track under the team
        { const wp = wakeGeo.attributes.position.array;
          for (let i = 0, n = WK_A.length / 3; i < n; i++) {
            const a = WK_A[i * 3]; trackPos(s + a, WK_A[i * 3 + 1], P);
            wp[i * 3] = P.x; wp[i * 3 + 1] = profAt(s + a) + WK_H[Math.round(WK_A[i * 3 + 2] * 2)]; wp[i * 3 + 2] = P.z;
          }
          wakeGeo.attributes.position.needsUpdate = true;
          wakeU.value.set(s, run * (pondE(s + 5, 0, 0, 0) < 0.93 ? 0.4 : 1), litJS(sArc + 5, 0.3), 0); }
        lineLit.value = litJS(sArc + 5, 0.4);
        lineGeo.attributes.position.needsUpdate = true; lineGeo.attributes.aTan.needsUpdate = true;
        // the hare (or fox) beside the leaders, and on a rare visit the lynx behind it
        const rRun = runAt(u, v2), hs = v2.x, hq = v2.y, showR = u > uBreak - 0.1 && u < uBreak + 0.14 && hq > -16;
        if (showR) {
          trackPos(hs, hq * sd, P); const hx = P.x, hz = P.z; let fx2 = P.dx, fz2 = P.dz;
          if (rRun > 0) { runAt(u + 0.0015, v1); trackPos(v1.x, v1.y * sd, P); fx2 = P.x - hx; fz2 = P.z - hz; }
          runner.set(0, hx, groundDL(hx, hz, hs, hq * sd) - 0.02, hz, Math.atan2(fx2, fz2), (hs / 1.5) * TAU, 0, rRun, hs - LEAD - hq * 0.35);
        } else runner.set(0, 0, -300, 0, 0, 0, 0, 0, 0);
        const rb = Math.floor(hs / 1.5);
        for (let j = 0; j < 8; j++) {
          const sj = (rb - j) * 1.5, tt = (hs - sj) / 12;
          trackPos(sj, hq * sd, P);
          puff(60 + j, P.x, profAt(sj) + 0.1 + 0.4 * tt, P.z, 0.2 + 0.7 * tt, showR && sj > sBreak ? 0.85 * (1 - tt) * sstep(0, 0.05, tt) * rRun : 0, litJS(sj - LEAD, 0.3));
        }
        if (rare) {
          const lq = lynxAt(u, v2), ls = v2.x, showL = lq < L_Q0 && lq > -13;
          if (showL) {
            trackPos(ls, lq * sd, P); const lx = P.x, lz = P.z;
            lynxAt(u + 0.0015, v1); trackPos(v1.x, v1.y * sd, P);
            // the bound is timed so that at u 0.84 it is at the top of its leap, forelegs reaching
            lynx.set(0, lx, groundDL(lx, lz, ls, lq * sd) - 0.02, lz, Math.atan2(P.x - lx, P.z - lz), ((ls - sStar - L_AHEAD) / 2.4) * TAU + 2.24, 0, 1, ls - LEAD - lq * 0.35);
          } else lynx.set(0, 0, -300, 0, 0, 0, 0, 0, 0);
          // the powder of its landings: each puff stays where that bound came down
          const lb = Math.floor(ls / 2.4);
          for (let j = 0; j < 8; j++) {
            const sj = (lb - j) * 2.4, tt = (ls - sj) / 19, qj = lynxQ(sj - L_AHEAD);
            trackPos(sj, qj * sd, P);
            puff(68 + j, P.x, groundDL(P.x, P.z, sj, qj * sd) + 0.14 + 0.5 * tt, P.z, 0.34 + 0.9 * tt, showL && qj < L_Q0 - 0.6 ? 0.9 * (1 - tt) * sstep(0, 0.05, tt) : 0, litJS(sj - LEAD, 0.3));
          }
        }
        // lodge steam
        for (let j = 0; j < 14; j++) {
          const ph = (t * 0.14 + j / 14) % 1, wob = Math.sin(j * 2.4 + t * 0.6) * 0.3 * ph;
          puff(76 + j, ventTop.x + WX * ph * ph * 5 + wob, ventTop.y - 0.2 + 5.5 * ph, ventTop.z + WZ * ph * ph * 5 + wob, 0.6 + 2.6 * ph, 0.5 * (1 - ph) * sstep(0, 0.12, ph), 1);
        }
        pPa.needsUpdate = true; pCa.needsUpdate = true;
        // the owl: perched in the far herald's crown, lifting as its tree lets go, crossing just ahead of the eye
        const w0 = owlAt(u, owlP);
        if (w0 < 1.34) {
          let ox = oB.x - oA.x, oy = 0, oz = oB.z - oA.z;
          if (w0 > 0) { owlAt(u + 0.002, v1); ox = v1.x - owlP.x; oy = v1.y - owlP.y; oz = v1.z - owlP.z; }
          const fly = sstep(0, 0.08, w0);
          // in flight it climbs into the edge of the light: the upper wing takes the sun (its light is read half-way up the shadow line)
          owl.set(0, owlP.x, owlP.y + 0.12, owlP.z, Math.atan2(ox, oz), t * TAU * 1.9, lerp(1.2, clamp(Math.atan2(oy, Math.hypot(ox, oz) + 1e-4), -0.5, 0.5), fly), fly, lerp(sArc, HU.uFront.value + 1.4, sstep(0.25, 0.52, w0)));
        } else owl.set(0, 0, -300, 0, 0, 0, 0, 0, 0);
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
