// THE DAWN TRACKS (dawn-tracks-contrail): eleven kilometres up, twenty minutes before sunrise, one airliner's contrail flown
// backwards from its frayed old end (seen from below as a vault), through three turning rings, up through loop 7 and over the twin
// ropes of cloud, under a second airliner, down between the ropes to the aircraft, and on through an arch, a gate and a wreath of
// old cloud into the portal. Below lies a lit deck of cumulus tops; the light warms through the flight until the sun's limb breaks the horizon.
//
// MAP OF THIS FILE (in order)
//   1. constants         PATH_PTS (the camera line as x, y, s; z = -s), SPEEDS (m/s by s, feeds pace), HOURS (palette per hour:
//                        sky, twilight arch, deck, haze, fog), AIRS (the three seeded dawn moods), DECK_LIGHT (per hour: the
//                        deck's light and what the colours warm toward late in the flight), DECK_KINDS (three decks: gap level,
//                        cross-roll stretch, tower, relief), DECK_G / DECK_S (the dome texture's cells and texels)
//   2. GLSL              FAR_VERT (far-plane domes), SKYX_FRAG (twilight arch, Belt of Venus, the sun's limb, Venus),
//                        DECK_FRAG (the cloud deck 3 km below: a height field of round cumulus heads and rolls on a curved Earth, read
//                        from a baked texture of domes, marched by clearance so no head is stepped through, silhouettes feathered,
//                        lit from the glow with long shadows, sea in the gaps, towers at the horizon; no geometry),
//                        VEIL_* (cirrus veil with the trail's shadow), TRACK_* (21 other contrails as camera-facing ribbons),
//                        PLANE_* (20 far airliners, instanced), SPRITE_* (their coral glints and blinking red beacons),
//                        FRESH_* (the early heavy's fresh line: four jets winding into two ropes, in that aircraft's frame)
//   3. helpers           piecewise() (keys by station), bakeDeck() with stampBulges / stampHeads / deckBytes (the deck's dome
//                        texture, seeded from the deck's offsets), lowPolyAirliner()
//   4. build(ctx)        a. seeded moods: hour (ctx.vary.hour), air (ctx.rng), deck kind (ctx.rng), cast   [search "MOODS"]
//                        b. path, s/u/time tables, pace                                                   [search "PATH"]
//                        c. sky (kit), fog, light rig                                                     [search "FOG"]
//                        d. hero placement: the part is built in the brief's own frame, at the origin     [search "HERO"]
//                        e. far-plane layers: twilight overlay and deck
//                        f. veil, other tracks, far aircraft, the staged westbound heavy, the crossing heavy       [search "crossing heavy"],
//                           the early heavy through loop 7                                                 [search "EARLY"]
//                        g. glitter, speed streaks, portal star and its ring of glitter, meteors
//                        h. pois, post (exposure, bloom, grade)                                           [search "POST"]
//                        i. update(): scripted moments keyed to u, ambient loops to time
// SCRIPTED MOMENTS AND THE UNIFORMS THAT DRIVE THEM (all from u in update())
//   light through flight  skyx.uGlow 0.84 -> 1.12, hero.setProgress(u) (trail uGain); from u 0.3 (kw, full by 0.88) the arch widens (uArch),
//                         ember and gold warm, the hulls' sun colour and the haze lean toward DECK_LIGHT's gold; the trail's body and rim
//                         turn half way to gold by u 0.62 (kb) and the turquoise hair over the band widens with it (skyx.uTopW); the
//                         deck's own light rises (uLitK). The early flight is ember and indigo, the middle of it gold ropes under a wide
//                         turquoise band, the end gold and rose. Night keeps its colours.
//   sun's limb            at dawn (and in the rare event at any dusk hour) skyx.uLimb rises over u 0.54-0.64 and deck.uTerm brings the
//                         terminator in, so the far crests take direct gold
//   staged aircraft       all three fly at one constant speed each, placed from a meeting in the world and the flight's seconds (tOfU):
//   early heavy           early.position from earlyAt(u): 56 m/s across the track, over the middle of loop 7 when the lens is at the floor
//                         of the dip under it (s 1003), about 100 m from the lens (lit cabin row, strobes); freshU.uHead lays its line
//   westbound heavy       heavy.position.z and tracks uHeavyZ from heavyAhead(u): 100 m/s, abeam of our aircraft's nose at 55 s
//   crossing heavy        crosser.position.z and tracks uHeavyZ2 from crossAhead(u): 100 m/s, overhead (52 m up) where the camera line
//                         leans toward its lane at s 1440; a poi (crossAt) stays on the ropes until the aircraft is within 620 m,
//                         slides up to it by 200 m and follows it, eased in and out over six seconds
//   gaze                  pois: the vault (u 0.04-0.125), loop 7 from below (s 845-1062), down on the ropes (s 1105-1400), the crossing
//                         heavy (on the ropes too until it is within 620 m), a point sliding forward along the fuselage ahead of the lens (s 1955-2062)
//   exit rings            built by the part round the last leg (arch at s 2230, a whole ring; gate at s 2350, a whole ring; wreath at the portal); a poi lifts the gaze to them
//   speed streaks         streaks.setOpacity from the camera speed at s (the canyon)
//   portal star           star.uniforms.uIntensity by distance to the portal (shows from s 1500, dims on the approach)
//   rare event            the limb climbs higher with a green rim (skyx.uGreen, from 58 s) and the terminator runs in 15 km further
// The seeded cast is unchanged by the pieces added later: they take no draw from the world's random streams.
// Everything else (trail roll, rings rocking, deck billow, veil drift, creeping tracks, beacons, glitter, stars) runs on time.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/dawn-tracks-contrail.js';

const PAL = ['#0B1522', '#2C3E5E', '#131A3F', '#C9809A', '#FF7F57', '#FFC98A', '#6FE3C8'];
const DEG = Math.PI / 180, TAU = Math.PI * 2;
// the camera line as (x right, y up, s along the trail); the last 160 m are one straight climb into the portal.
// FOUR HORIZONS. Entry level under the ribbon; a 41 m dive (s 98-236) from whose floor the gaze lifts 22 degrees into the ribbon's
// vault (horizon in the bottom fifth); the rise out of it toward the trail's axis; the brief's stitch through loops 4-6; a second
// dip to y -147 under loop 7 (seen whole from below, 30 degrees up) and a steep climb through its middle; level at y -45 over
// loops 8 and 9 looking down on them (horizon in the top third), the crossing heavy passing overhead at s 1440; then down INTO the
// canyon (s 1630-1720, 3 m over the tubes' axis, a rope of cloud 22 m to either side), over the four jets and along the wing as the brief has it.
const PATH_PTS = [[-150, -128, 0], [-150, -128, 98], [-148, -167, 186], [-141, -169, 236], [-128, -146, 330], [-118, -126, 420], [-60, -78, 630], [-20, -112, 690], [0, -135, 750],
  [18, -108, 810], [0, -85, 870], [-20, -112, 930], [-5, -140, 975], [0, -147, 1003], [0, -92, 1068], [0, -58, 1150], [0, -46, 1230], [0, -44, 1330], [-4, -42, 1440],
  [0, -40, 1560], [2, -35.5, 1660], [0, -14, 1750], [14, 12, 1975], [12, 8, 2020],
  [8, 12, 2090], [0, 8, 2240], [0, 30.2, 2293], [0, 52.4, 2346], [0, 75, 2400]];
// flight speed (m/s) by station: ribbon 40, the rings 18, over the waves 34-44, the canyon 50 (the crossing heavy is given time), 44 by s 1800, 28 at the wing, 35 out
const SPEEDS = [[0, 40], [90, 38], [250, 34], [430, 40], [640, 18], [985, 18], [1010, 20], [1120, 34], [1300, 44], [1450, 50], [1700, 52], [1800, 44], [1960, 28], [2085, 28], [2170, 35], [2400, 35]];
const DURATION = 68, DECK_Y = -3000;

const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
// palette per hour. arch: ember, gold, top (turquoise hair / purple light), slate (Earth's shadow), rose (Belt of Venus)
const HOURS = {
  dawn: {
    sky: { zenith: '#0e1436', mid: '#1b2a63', horizon: '#33507f', ground: '#1a2740', horizonPow: 3.2, scatterColor: '#ff7a48', scatter: 0.3, scatterPow: 4.5, scatterHigh: 0.03, scatterFall: 7, stars: 0.4, starDensity: 0.5 },
    ember: C('#FF5A30', 1.0), gold: C('#FFC98A', 0.78), top: C('#6FE3C8', 0.6), slate: C('#2C3E5E', 0.5), rose: C('#C9809A', 0.62), glow: 1, belt: 1,
    sea: C('#22315a', 1), wall: C('#3c4c70', 0.62), wallHi: C('#7888ae', 0.62), wallRose: C('#C9809A', 0.55), haze: C('#2C3E5E', 0.7), hazeSun: C('#6e3f50', 0.62),
    term: C('#FF9A84', 0.62), fog: C('#26305c', 0.8), fogDensity: 0.00021, trackAway: C('#27356a', 0.75), trackSun: C('#a8584e', 0.75), veil: 1,
  },
  golden: {
    sky: { zenith: '#150f3a', mid: '#2c1f66', horizon: '#4a3272', ground: '#1c1836', horizonPow: 3.2, scatterColor: '#ff5a48', scatter: 0.4, scatterPow: 4.5, scatterHigh: 0.03, scatterFall: 7, stars: 0.3, starDensity: 0.45 },
    ember: C('#E2452C', 0.95), gold: C('#FF9C70', 0.72), top: C('#9A5AD8', 0.75), slate: C('#2a2850', 0.5), rose: C('#B86AA8', 0.6), glow: 1, belt: 0.9,
    sea: C('#2a2452', 1), wall: C('#463e6c', 0.78), wallHi: C('#8676aa', 0.78), wallRose: C('#c070a8', 0.55), haze: C('#3A3358', 0.7), hazeSun: C('#70345a', 0.62),
    term: C('#FF7A9A', 0.62), fog: C('#2a2058', 0.8), fogDensity: 0.00021, trackAway: C('#2c2466', 0.75), trackSun: C('#8a3a5a', 0.75), veil: 1,
  },
  night: {
    sky: { zenith: '#040818', mid: '#0a1438', horizon: '#18274f', ground: '#0a1022', horizonPow: 3, scatterColor: '#3a5a9a', scatter: 0.2, scatterPow: 3, scatterHigh: 0.02, scatterFall: 6, stars: 1, starDensity: 0.9, milkyWay: 0.3 },
    ember: C('#24407a', 0.5), gold: C('#3a5a9a', 0.4), top: C('#3fae9a', 0.18), slate: C('#0c1428', 0.5), rose: C('#2a3a6a', 0.3), glow: 0.7, belt: 0.35,
    sea: C('#16223e', 1), wall: C('#4e5e86', 0.7), wallHi: C('#b4c0de', 0.66), wallRose: C('#aab8e0', 0.6), haze: C('#131d3a', 0.8), hazeSun: C('#1a2a52', 0.8),
    term: C('#000000', 0), fog: C('#0d1736', 0.9), fogDensity: 0.00019, trackAway: C('#16224a', 0.8), trackSun: C('#22346a', 0.8), veil: 0.6,
  },
};
// three seeded dawn airs: how wide and how red the glow is, how strong the Belt of Venus, how pink the trail
const AIRS = [
  { name: 'ember', arch: 0.72, glow: 1.08, belt: 0.8, emberMix: ['#FF4422', 0.5], trail: null, stars: 1.25 },
  { name: 'gold', arch: 1.28, glow: 1.0, belt: 1.0, emberMix: ['#FF8A3A', 0.45], trail: ['#FF9A52', 0.25], stars: 0.85 },
  { name: 'rose', arch: 1.0, glow: 0.92, belt: 1.55, emberMix: ['#FF4A6E', 0.55], trail: ['#FF6A86', 0.2], stars: 1.0 },
];
// THE LIGHT MOVES THROUGH THE FLIGHT (per hour). lit: the glow on the deck's sunward flanks before sunrise (moonlight at night);
// sun: the real sun on the crests once the terminator has run in; el: the angle that flank light comes in at (degrees: low gives
// long shadows); warm: how far the band, the trail and the hulls turn from ember to gold between u 0.45 and the portal, and
// what they turn to (bodyTo, rimTo, emberTo, sunTo). Night does not change.
const DECK_LIGHT = {
  dawn: { lit: C('#FF6248', 0.35), sun: C('#FFA468', 0.5), amb: 1, el: 6.5, warm: 1, bodyTo: C('#FF9A60', 0.9), rimTo: C('#FFE2A4', 1.65), emberTo: C('#FF9438', 1.05), sunTo: C('#FFBC7C', 1.6) },
  golden: { lit: C('#E84A7A', 0.32), sun: C('#FF7A9A', 0.5), amb: 1, el: 6.5, warm: 0.4, bodyTo: C('#F0706A', 0.85), rimTo: C('#FFA0C0', 1.6), emberTo: C('#F2603A', 1.0), sunTo: C('#FF7A5A', 1.4) },
  night: { lit: C('#AEBCE0', 0.26), sun: C('#000000', 0), amb: 0.6, el: 42, warm: 0, bodyTo: C('#C9D4EE', 0.8), rimTo: C('#EAF0FF', 1.45), emberTo: C('#24407a', 0.5), sunTo: C('#9FB4E8', 0.75) },
};
// the three seeded decks as [gap level, cross-roll stretch, tower amount, relief in metres]: a broken field of cumulus heads with
// wide gaps of sea, long rolls (cloud streets) with dark lanes between them, a closed lumpy deck with turrets
const DECK_KINDS = [[0.27, 0.8, 0.6, 900], [0.24, 0.42, 0.4, 850], [0.05, 0.62, 1.0, 900]];
const DECK_G = 10, DECK_S = 256;            // the dome texture: cells per tile, texels per tile

// ---------- GLSL ----------
// far-plane dome centred on whichever camera draws it (so it is right through a portal, with nothing to follow in update)
const FAR_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;

// twilight arch on the sun side (ember, gold, a hair of turquoise), Earth's shadow and the Belt of Venus opposite,
// the rare sun limb with its green rim, and Venus for the dusk version. Premultiplied: adds light and covers a little.
const SKYX_FRAG = /* glsl */`
uniform vec3 uSunAz, uEmber, uGold, uTop, uSlate, uRose, uLimbDir, uVenusDir;
uniform float uGlow, uArch, uBelt, uLimb, uVenus, uTime, uGreen, uTopW;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float e = asin(clamp(d.y, -1.0, 1.0)) * 57.29578;
  vec2 h = d.xz / max(length(d.xz), 1e-4);
  float ca = dot(h, uSunAz.xz);
  float ws = smoothstep(-0.5, 1.0, ca); ws *= ws;
  float H = mix(4.0, 15.0, ws) * uArch;
  float x = (e + 3.7) / H;
  float xe = (x - 0.07) / 0.17, xg = (x - 0.36) / 0.2, xt = (x - 0.66 - 0.06 * uTopW) / (0.17 * uTopW);
  float ember = exp(-xe * xe), gold = exp(-xg * xg), top = exp(-xt * xt);
  float wa = smoothstep(-0.75, 0.85, ca);
  vec3 col = (uEmber * ember + uGold * gold * (0.35 + 0.65 * ws) + uTop * top * 0.5 * ws) * wa * uGlow;
  float a = clamp(ember * 0.9 + gold * 0.7 + top * 0.25, 0.0, 1.0) * wa * 0.85;
  // opposite the sun: the Earth's shadow, a slate band 6 degrees deep, and the rose belt above it to 15 degrees
  float anti = smoothstep(0.05, 0.9, -ca) * uBelt;
  float shadow = (1.0 - smoothstep(0.5, 4.5, e)) * anti;
  float belt = smoothstep(0.5, 5.0, e) * (1.0 - smoothstep(6.5, 16.0, e)) * anti;
  float a2 = clamp(shadow * 0.85 + belt * 0.62, 0.0, 1.0);
  col = col * (1.0 - a2) + uSlate * shadow * 0.85 + uRose * belt * 0.62;
  a = a + a2 * (1.0 - a);
  // the sun's upper limb (rare): a disc cut by the cloud horizon, green on its upper rim
  float sd = acos(clamp(dot(d, uLimbDir), -1.0, 1.0)) * 57.29578;
  float disc = 1.0 - smoothstep(0.42, 0.56, sd);
  float above = smoothstep(-3.62, -3.48, e);
  float le = asin(clamp(uLimbDir.y, -1.0, 1.0)) * 57.29578;
  float rim = smoothstep(0.22, 0.46, e - le) * disc;
  vec3 sun = mix(vec3(7.0, 3.0, 1.1), vec3(1.2, 6.0, 2.2), rim * uGreen) * disc + vec3(1.0, 0.4, 0.17) * exp(-sd * 0.5) + vec3(0.26, 0.09, 0.035) * exp(-sd * 0.1);
  col += sun * above * uLimb;
  // Venus
  float vd = acos(clamp(dot(d, uVenusDir), -1.0, 1.0)) * 57.29578;
  col += vec3(1.0, 0.95, 0.85) * uVenus * (3.0 * (1.0 - smoothstep(0.1, 0.22, vd)) + 0.5 * exp(-vd * 1.6)) * (0.92 + 0.08 * sin(uTime * 3.1));
  gl_FragColor = vec4(col, a);
}`;

// THE UNDERCAST: a lit cloud deck with real relief, 3 km under the trail. Every pixel below the cloud horizon is a ray cast
// against a height field of cloud tops laid on a curved Earth (so the horizon dips 3.5 degrees as it does from this height).
// The field is a baked texture of DOMES (uDeck, see bakeDeck: round cumulus heads on a jittered grid, each carrying smaller round
// bulges, so every head is a cauliflower and nothing in it is a ridge or a spike), read with a smoothed texel fraction so that
// magnified it has no creases; a slow cover field (cov) raises and drowns the heads, the gap level (uShape.x) decides how much
// sea shows, and the cross-roll stretch (uShape.y) draws the heads out into long rolls. THE MARCH steps by clearance (how far
// the ray is above the cloud, over a slope bound), so it slows down over a head and cannot step through one, then five halvings
// find the surface. A ray that passes within a pixel and a half of a head without touching it takes that head's colour in
// proportion (gBest), so every silhouette is a soft edge about a pixel wide and never a row of teeth. The hit point is lit
// from the glow's azimuth at a low angle with a wrap (sunward flanks ember and rose, lee sides indigo), five more look-ups
// toward the light give the long shadows, and a smooth field of smaller lumps tilts the light a little on each head.
// uTerm is the terminator: beyond it the real sun is on the crests (gold). Beyond the horizon line a few cumulus TOWERS stand
// as soft silhouettes (an analytic profile by azimuth). Every look-up is textureLod with a level worked out from distance
// before the loops (Direct3D), no derivatives anywhere.
const DECK_FRAG = /* glsl */`
uniform sampler2D uNoise, uDeck;
uniform float uTime, uTerm, uCell, uPix, uLitK;
uniform vec2 uOff, uRollDir;
uniform vec4 uShape;                       // gap level, cross-roll stretch (1 round heads, 0.4 long rolls), tower amount, relief (m)
uniform vec3 uSunAz, uKey, uSea, uWall, uWallHi, uWallRose, uHaze, uHazeSun, uTermCol, uGlowCol;
varying vec3 vDir;
const float DG = ${DECK_G}.0, DS = ${DECK_S}.0, TWK = 0.22;
// the dome texture at p (cell units): r heads, g turrets, b the heads blurred. The texel fraction is eased, so the field is smooth
vec4 deckT(vec2 p, float lod) {
  vec2 q = vec2(p.x * uRollDir.x + p.y * uRollDir.y, (p.y * uRollDir.x - p.x * uRollDir.y) * uShape.y) * (DS / DG) + 0.5;
  vec2 i = floor(q), f = q - i;
  f = f * f * (3.0 - 2.0 * f);
  return textureLod(uDeck, (i + f - 0.5) / DS, lod);
}
// height of the cloud tops, 0..1 of the relief (turrets stand up to TWK above that). cov: the slow cover field
float deckH(vec4 k, float cov) {
  float s = k.r + cov - uShape.x;
  return min(max(s, 0.0) / (1.3 - uShape.x), 1.0) + k.g * TWK * uShape.z * smoothstep(0.0, 0.25, s);
}
// the colour of the deck where the ray is at distance t
vec4 deckShade(float t, vec3 d, float cov, float lod, float fp, float Ht, vec3 hazeC) {
  vec2 P = cameraPosition.xz + d.xz * t;
  vec2 p = P / uCell + uOff + uTime * vec2(0.006, 0.0022);
  vec4 k0 = deckT(p, lod);
  float h0 = deckH(k0, cov);
  float crease = clamp((k0.r - k0.b) * 6.0 + 0.5, 0.0, 1.0);          // 0 in the folds between bulges, 1 on their tops
  // light: the slope toward the light and five look-ups along it (long soft shadows)
  float cosE = max(length(uKey.xz), 0.05);
  vec2 l = uKey.xz / cosE;
  float tanE = uKey.y / cosE, sl = 0.0, occ = 0.0, s = 110.0;
  for (int k = 0; k < 5; k++) {
    float hk = deckH(deckT(p + l * (s / uCell), lod + 0.4 * float(k)), cov);
    float rise = (hk - h0) * Ht;
    if (k == 0) sl = rise / s;
    occ = max(occ, (rise - s * tanE) / (30.0 + 0.22 * s));
    s *= 2.05;
  }
  float shadow = 1.0 - clamp(occ, 0.0, 1.0);
  float lodN = log2(max(fp * 256.0, 1e-3));
  float n3 = textureLod(uNoise, p * 1.7 + uTime * vec2(-0.004, 0.003), lodN + 1.6).g;
  float low = textureLod(uNoise, p * 0.57 + 0.37, max(lodN - 0.8, 0.0)).g;
  // smaller bulges in the light: a smooth field (lumps 100-250 m across) whose slope toward the light tilts it a little. (Folded
  // into billows with creases, or any stronger, it drew dark veins and blotches over every head: brain, not cloud.)
  float bl = max(lodN + 1.8, 2.5), be = 60.0 / uCell;
  float b0 = textureLod(uNoise, p * 1.7 + vec2(0.5, 0.2), bl).r;
  float b1 = textureLod(uNoise, (p + l * be) * 1.7 + vec2(0.5, 0.2), bl).r;
  float slb = sl + (b1 - b0) * 0.67 * smoothstep(0.02, 0.2, h0);
  float lam = clamp(((uKey.y - slb * cosE) * inversesqrt(1.0 + slb * slb) + 0.25) / 1.25, 0.0, 1.0);
  float cl = smoothstep(0.0, 0.06, h0);
  vec3 amb = mix(uWall, uWallHi, smoothstep(0.05, 0.6, h0)) * (0.8 + 0.4 * n3) * (0.72 + 0.56 * crease) * (0.86 + 0.28 * b0);
  amb = mix(amb, uWallRose * 0.7, clamp(sl * 0.6, 0.0, 0.22));    // flanks turned from the glow face the Belt of Venus
  amb *= 0.4 + 0.6 * shadow;
  float along = dot(P - cameraPosition.xz, uSunAz.xz);
  float direct = smoothstep(0.0, 1.0, (along - uTerm) / 9000.0 + h0 * 1.1 - 0.75);
  vec3 lightC = uGlowCol * uLitK + uTermCol * direct;
  vec3 cloudC = amb + lightC * lam * shadow * (0.78 + 0.44 * n3) * (0.8 + 0.4 * crease);
  // the gaps: sea far below, a thin lower layer drifting over it, darker under the clouds' own shadow
  vec3 seaC = uSea * (0.5 + 0.55 * low) * (0.7 + 0.3 * shadow);
  vec3 col = mix(seaC, cloudC, cl);
  // far off the gaps close up behind the heads in front of them: one pale layer, lighter toward the glow
  float farK = smoothstep(-0.3, 2.7, lod);
  col = mix(col, mix(uWall, uWallHi, 0.42) * (0.8 + 0.2 * shadow) + lightC * 0.17, farK * 0.85);
  col = mix(col, hazeC, 1.0 - exp(-t / 13500.0));
  return vec4(col, 1.0 - smoothstep(46000.0, 94000.0, t));
}
void main() {
  vec3 d = normalize(vDir);
  const float R = 1.6e6;
  float hgt = max(cameraPosition.y - (${DECK_Y}.0), 1600.0);
  float c = (1.0 - d.y * d.y) / (2.0 * R);
  float discB = d.y * d.y - 4.0 * c * hgt;
  vec2 hd = d.xz / max(length(d.xz), 1e-4);
  float ca = dot(hd, uSunAz.xz);
  float ws = smoothstep(-0.2, 1.0, ca); ws *= ws;
  vec3 hazeC = mix(uHaze, uHazeSun, ws);
  if (d.y >= 0.0 || discB <= 0.0) {
    // above the cloud horizon: cumulus towers 60-90 km off, standing through the deck. Soft silhouettes, bases lost in the haze;
    // the ones toward the glow are dark against it with lit rims, the ones opposite take the rose light on their faces
    float eh = asin(clamp(d.y, -1.0, 1.0)) + sqrt(2.0 * hgt / R);
    float az = atan(d.x, -d.z + 1e-5);
    float grp = textureLod(uNoise, vec2(az * 0.52 + uOff.x * 0.13, 0.21), 0.0).r;
    float tur = textureLod(uNoise, vec2(az * 1.5 + uOff.y * 0.11, 0.63), 1.0).g;
    float edge = textureLod(uNoise, vec2(az * 4.0, eh * 30.0 + uTime * 0.0006), 0.5).b;
    float m = smoothstep(0.5, 0.8, grp);
    // (broad rounded heads, wider than tall, soft: as thin dark spikes they read as trees standing on the horizon)
    float top = uShape.z * 0.06 * sqrt(m) * (0.4 + 0.6 * smoothstep(0.25, 0.8, tur)) + (edge - 0.5) * 0.009 * m;
    float a = (1.0 - smoothstep(-2.5 * uPix, 2.5 * uPix, eh - top)) * smoothstep(-0.001, 0.008, eh) * step(0.001, m);
    if (a <= 0.003) discard;
    float rimK = smoothstep(top - 0.016, top, eh);
    float direct = smoothstep(0.0, 1.0, (70000.0 * ca - uTerm) / 20000.0);
    vec3 lightC = uGlowCol * uLitK + uTermCol * direct;
    vec3 col = mix(hazeC, uWall, 0.4) * (0.75 + 0.25 * edge) + lightC * (rimK * (0.5 + 0.9 * ws) + (0.5 - 0.5 * ca) * 0.4 * edge);
    gl_FragColor = vec4(col, a * 0.7);
    return;
  }
  float sq = sqrt(discB);
  float tB = 2.0 * hgt / (-d.y + sq);
  // relief settles toward the horizon (a march cannot carry it there, and the towers stand for it)
  float Ht = uShape.w * mix(1.0, 0.22, smoothstep(9000.0, 42000.0, tB)), top = Ht * (1.0 + TWK * uShape.z);
  float tT = 2.0 * (hgt - top) / (-d.y + sqrt(max(d.y * d.y - 4.0 * c * (hgt - top), 0.0)));
  vec2 drift = uOff + uTime * vec2(0.006, 0.0022);
  vec2 pB = (cameraPosition.xz + d.xz * tB) / uCell + drift;
  // the width of a pixel on the deck, in cells, and the mip level that goes with it
  float fp = tB * uPix / uCell * sqrt(0.5 / max(-d.y, 0.05));
  float lod = max(0.0, log2(max(fp * DS / DG, 1e-3)));
  // (the cover field drifts a little faster than the heads, so they swell and sink slowly)
  float cov = (textureLod(uNoise, pB * 0.037 + vec2(0.23 + uTime * 0.0004, 0.23), 0.0).g - 0.5) * 0.46 + (textureLod(uNoise, pB * 0.011 + 0.61, 0.0).r - 0.5) * 0.3;
  // THE MARCH. Each step is the ray's clearance over the cloud divided by the steepest the cloud can rise toward it (never
  // less than a pixel and a half of ground), so it creeps over a head and strides over a gap; the last steps are stretched
  // to reach the foot of the slab. gBest: the nearest the ray came to a head it then cleared, in pixels; tg: where.
  float K = 1.4 * Ht / uCell, t = tT, tp = tT, lo = tB, hi = tB, gPrev = 1e9, tPrev = tT, gBest = 1e9, tg = tT;
  bool found = false;
  for (int i = 0; i < STEPS; i++) {
    float hr = hgt + d.y * t + c * t * t;
    float f = hr - deckH(deckT((cameraPosition.xz + d.xz * t) / uCell + drift, lod), cov) * Ht;
    if (!found) {
      if (f < 0.0) { found = true; lo = tp; hi = t; }
      else {
        float gi = f / (t * uPix);
        if (gi > gPrev && gPrev < gBest) { gBest = gPrev; tg = tPrev; }
        gPrev = gi; tPrev = t; tp = t;
        float st = max(f / (-d.y + K), t * uPix * 1.5);
        st = max(st, (tB - t) / float(STEPS - i) * smoothstep(0.5, 0.9, float(i) / float(STEPS)));
        t = min(t + st, tB);
      }
    }
  }
  for (int i = 0; i < 5; i++) {
    float tm = 0.5 * (lo + hi);
    float hr = hgt + d.y * tm + c * tm * tm;
    if (hr < deckH(deckT((cameraPosition.xz + d.xz * tm) / uCell + drift, lod), cov) * Ht) hi = tm; else lo = tm;
  }
  float th = found ? hi : tB;
  vec4 col = deckShade(th, d, cov, lod, fp, Ht, hazeC);
  // the feather: a head the ray only just cleared, well in front of what it hit
  float w = (1.0 - smoothstep(0.0, 1.6, gBest)) * smoothstep(0.0, 3.0, (th - tg) / (tg * uPix));
  if (w > 0.004) col = mix(col, deckShade(tg, d, cov, lod, fp, Ht, hazeC), w);
  gl_FragColor = col;
}`;

// the cirrus veil: combed fibres in patches, lit from below, with the trail's shadow as a soft dark strip that slides
const VEIL_VERT = /* glsl */`
varying vec3 vWp;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const VEIL_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform float uTime, uCover;
uniform vec3 uSunDir, uBody, uRim, uShade, uHazeC;
varying vec3 vWp;
void main() {
  vec3 V = vWp - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  vec2 p = vWp.xz;
  vec2 q = vec2(p.x * 0.34 + p.y * 0.94, p.x * 0.94 - p.y * 0.34);
  float ptc = texture2D(uNoise, p * 0.00043 + vec2(uTime * 0.001, 0.0)).g;
  // CIRRUS, NOT SPEED LINES: the fibres are bent (hooked mares' tails: each strand swings 30 m aside every 500-900 m, by a
  // different amount from tuft to tuft), they are 6 and 8 times as long as wide (at 12 and 14 they were ruled straight lines,
  // and from under the veil every one of them ran to the same vanishing point), and they come in tufts 150-300 m across with
  // clear sky between. All of it is laid in the air's own coordinates and drifts slowly.
  // (the bend is 31 m, half what it was, and where the view only grazes the veil (gz) the fibres give way to the soft tufts:
  // hooked 62 m and seen along the sheet, the strands were foreshortened into a marbled swirl, oil on water)
  q.x += 31.0 * sin(q.y * 0.0088 + ptc * 9.0) + 12.0 * sin(q.y * 0.023 - q.x * 0.004 + 1.7);
  float gz = smoothstep(0.07, 0.32, abs(V.y));
  float f1 = texture2D(uNoise, vec2(q.x * 0.0041, q.y * 0.00068 + uTime * 0.0017)).b;
  float f2 = texture2D(uNoise, vec2(q.x * 0.0127 + uTime * 0.0008, q.y * 0.0016 + 0.3 + uTime * 0.0034)).r;
  float tuft = texture2D(uNoise, vec2(q.x * 0.0031 + 0.17, q.y * 0.0019 - uTime * 0.0006)).r;
  float fib = mix(0.56, f1 * 0.6 + f2 * 0.4, gz);
  float a = smoothstep(0.66 - uCover * 0.22, 0.98 - uCover * 0.2, ptc * 0.72 + fib * 0.5) * (0.3 + 0.7 * smoothstep(0.3, 0.72, fib)) * (0.25 + 0.75 * smoothstep(0.34, 0.62, tuft));
  a *= (1.0 - smoothstep(-340.0, -90.0, p.x)) * smoothstep(-2700.0, -1900.0, p.x) * (1.0 - smoothstep(250.0, 800.0, p.y)) * smoothstep(-1750.0, -1150.0, p.y);
  // the shadow of the trail, thrown upward by a sun that is still below the horizon
  float sx = -400.0 + 34.0 * sin(p.y * 0.0031 + uTime * 0.06) + 15.0 * sin(p.y * 0.011 - uTime * 0.09);
  float sq = (p.x - sx) / 46.0;
  float sh = 1.0 - 0.8 * exp(-sq * sq);
  float fwd = max(dot(V, uSunDir), 0.0);
  float lit = clamp((0.4 + 0.45 * fib + 0.7 * fwd * fwd) * sh, 0.0, 1.0);
  vec3 col = mix(uShade * 0.5, uBody * 0.8, lit) + uRim * fwd * fwd * fwd * fwd * 0.3 * sh;
  float hz = 1.0 - exp(-dist / 5200.0);
  col = mix(col, uHazeC, hz * 0.75);
  a *= 0.42 * (1.0 - 0.75 * smoothstep(2200.0, 5200.0, dist)) * smoothstep(40.0, 120.0, dist);
  gl_FragColor = vec4(col * a, a);
}`;

// the other tracks: ribbons that always face the lens and never get thinner than a pixel. Their texture is anchored to
// the air (world z), so a line lengthens as its aircraft creeps on. aA: t along (0 head), side, seed, kind (1 = the heavy's line, 2 = the crossing heavy's)
// aB: lane x, lane y, head z, length toward +Z (kind 1: z of the far end). aC: creep m/s, young width, old width, age at the head
const TRACK_VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aB; attribute vec4 aC;
uniform float uTime, uHeavyZ, uHeavyZ2, uPix;
varying vec4 vT; varying vec3 vWp; varying vec3 vS; varying float vK;
void main() {
  float t = aA.x, tt = t * t;
  float head = aB.z - aC.x * uTime;
  float tail = head + aB.w;
  if (aA.w > 0.5) { head = aA.w > 1.5 ? uHeavyZ2 : uHeavyZ; tail = aB.z; }
  float z = mix(head, tail, tt);
  float age = clamp(aC.w + abs(z - head) / 26000.0, 0.0, 1.0);
  float x = aB.x + sin(z * 0.00037 + aA.z * 40.0) * 110.0 * age + sin(z * 0.0021 + aA.z * 17.0) * 14.0 * age;
  float y = aB.y - 70.0 * age * age;
  // a young staged line wanders slowly and irregularly, more with age (two wavelengths that never repeat together, the longer one
  // itself bent; as one sine of 600 m it was a regular ripple)
  if (aA.w > 0.5) x += (sin(z * 0.0043 + 1.9 * sin(z * 0.0011 + aA.w) + uTime * 0.07) * 3.2 + sin(z * 0.0117 + 2.9 - uTime * 0.11) * 1.3) * smoothstep(0.01, 0.08, age) * (1.0 - smoothstep(0.12, 0.3, age));   // (straight for its first 300 m, wandering by 2 km)
  vec3 c = vec3(x, y, z);
  vec3 toC = c - cameraPosition;
  float dist = length(toC);
  vec3 side = cross(vec3(0.0, 0.0, 1.0), toC);
  float sl = length(side);
  side = sl > 1e-3 ? side / sl : vec3(1.0, 0.0, 0.0);
  float w = mix(aC.y, aC.z, sqrt(age)) * (0.25 + 0.75 * smoothstep(0.0, 0.05, t));
  float wd = max(w, dist * uPix);
  vec3 wp = c + side * aA.y * wd;
  vT = vec4(aA.y, age, w / wd, z);
  vS = vec3(aA.z, t, -aA.y * side.y); vK = aA.w;
  vWp = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const TRACK_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform vec3 uBody, uRim, uShade, uHazeAway, uHazeSun, uHazeDeck, uSunAz;
uniform float uGain;
uniform float uTime;
varying vec4 vT; varying vec3 vWp; varying vec3 vS; varying float vK;
void main() {
  float v = vT.x, age = vT.y, seed = vS.x, t = vS.y, low = vS.z;
  float n = texture2D(uNoise, vec2(vT.w * 0.00023 + seed + uTime * 0.0006, v * 0.21 + seed * 7.0)).r;
  float n2 = texture2D(uNoise, vec2(vT.w * 0.0011 - uTime * 0.0021, v * 0.5 + seed * 3.0 + uTime * 0.0012)).g;
  float av = abs(v) - 0.5 - (vK > 0.5 ? 0.2 * (n2 - 0.5) * smoothstep(0.01, 0.08, age) * (1.0 - smoothstep(0.08, 0.2, age)) : 0.0);   // the heavy's twin tubes already swinging, irregularly (noise, not a sine)
  float two = exp(-av * av / (vK > 1.5 ? 0.003 : 0.035));   // the crossing heavy's line passes 100 m from the lens: two hard thin cores, 18 m apart
  float one = (1.0 - v * v) * exp(-2.4 * v * v);
  one *= smoothstep(0.28, 0.78, n * 0.75 + n2 * 0.5 + 0.22 * (1.0 - age));
  float prof = mix(two * (0.7 + 0.6 * n2), one, vK > 0.5 ? smoothstep(0.1, 0.3, age) : smoothstep(0.012, 0.07, age));
  float a = prof * (1.0 - smoothstep(0.72, 1.0, t)) * smoothstep(0.0, 0.012, t) * mix(0.85, 0.42, age) * vT.z;
  vec3 V = vWp - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  // seen from below a track shows its sunlit underside; from above only its shadowed top, coral on the low edge alone
  float up = smoothstep(-0.2, 0.2, V.y);
  vec3 col = mix(uShade, uBody, clamp(mix(0.12, 0.62, up) + 0.36 * low + 0.5 * (n - 0.5), 0.0, 1.0));
  float lw = max(low, 0.0);
  col = mix(col, uRim, lw * lw * lw * 0.35 * (0.4 + 0.6 * up));
  vec2 hd = V.xz / max(length(V.xz), 1e-4);
  float ws = smoothstep(-0.2, 1.0, dot(hd, uSunAz.xz)); ws *= ws;
  vec3 hazeC = mix(mix(uHazeAway, uHazeSun, ws), uHazeDeck, smoothstep(0.035, 0.11, -V.y));
  col = mix(col, hazeC, (1.0 - exp(-dist / 15000.0)) * 0.88);
  gl_FragColor = vec4(col * a * uGain, a);
}`;

// twenty far airliners (instanced): white paint under a red sun from below, sky fill, haze. iA: lane x, y, z, creep m/s
const PLANE_VERT = /* glsl */`
attribute vec4 iA;
uniform float uTime, uPix;
varying vec3 vN; varying vec3 vWp;
void main() {
  vec3 c = vec3(iA.x, iA.y, iA.z - iA.w * uTime);
  float dist = length(c - cameraPosition);
  float sc = max(1.0, dist * uPix * 7.0 / 65.0);
  vec3 wp = c + position * sc;
  vN = normal; vWp = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const PLANE_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmbUp, uAmbDn, uHazeAway, uHazeSun, uHazeDeck, uSunAz;
varying vec3 vN; varying vec3 vWp;
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = vWp - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  if (dot(N, V) > 0.0) N = -N;
  float k = smoothstep(-0.35, 0.85, dot(N, uSunDir));
  vec3 col = 0.72 * (uSunCol * k + mix(uAmbDn, uAmbUp, 0.5 + 0.5 * N.y));
  vec2 hd = V.xz / max(length(V.xz), 1e-4);
  float ws = smoothstep(-0.2, 1.0, dot(hd, uSunAz.xz)); ws *= ws;
  vec3 hazeC = mix(mix(uHazeAway, uHazeSun, ws), uHazeDeck, smoothstep(0.035, 0.11, -V.y));
  col = mix(col, hazeC, (1.0 - exp(-dist / 15000.0)) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}`;

// their lights: a steady glint where the sun catches the hull, and a red beacon that blinks once a second (eased)
// aA: lane x, y, z, creep.  aL: corner x, corner y, kind (0 glint, 1 beacon), phase
const SPRITE_VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aL;
uniform float uTime, uPix;
uniform vec3 uGlint, uBeacon;
varying vec2 vQ; varying vec3 vC;
float blink(float x) { return smoothstep(0.0, 0.1, x) * (1.0 - smoothstep(0.1, 0.42, x)); }
void main() {
  vec3 c = vec3(aA.x, aA.y + (aL.z > 0.5 ? 4.0 : -1.0), aA.z - aA.w * uTime);
  vec4 mv = viewMatrix * vec4(c, 1.0);
  float dist = length(mv.xyz);
  float I = aL.z > 0.5 ? blink(fract(uTime + aL.w)) : 0.75 + 0.25 * sin(uTime * 1.7 + aL.w * 40.0);
  float size = max(aL.z > 0.5 ? 2.5 : 5.0, dist * uPix * (aL.z > 0.5 ? 3.2 : 2.6)) * (0.6 + 0.4 * I);
  mv.xy += aL.xy * size;
  vQ = aL.xy;
  vC = (aL.z > 0.5 ? uBeacon : uGlint) * I * exp(-dist / 30000.0);
  gl_Position = projectionMatrix * mv;
}`;
const SPRITE_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vC;
void main() {
  float r2 = dot(vQ, vQ);
  float g = max(1.0 - r2, 0.0);
  gl_FragColor = vec4(vC * (g * g * g * 0.5 + exp(-r2 * 9.0)) * g, 1.0);
}`;

// THE EARLY HEAVY'S FRESH LINE: four jets drawn in that aircraft's own frame (a child of its group; local +Z runs behind it),
// winding pairwise into two ropes: ribbons that face the lens with a round profile, lit round (coral toward the sun, lilac
// away), crisp at the nozzles, widening and puffing with age. Texture and wander are anchored to the air (uHead less the metres
// behind), so the line stays where it was laid as the aircraft flies on. Stations are spaced by t squared: a metre apart at the
// nozzles, so the young line is a smooth curve at any range.
// aA: t along (0 at the birth point), side (-1, 1), wing (-1 port, 1 starboard), pair (0 inner engine, 1 outer)
const FRESH_VERT = /* glsl */`
attribute vec4 aA;
uniform float uTime, uHead, uPix, uLen;
varying vec4 vT; varying vec3 vWp; varying vec3 vSd;
void main() {
  float t = aA.x, d = uLen * t * t;
  float m = smoothstep(20.0, 340.0, d);
  float th = (aA.w < 0.5 ? 3.14159 : 0.0) + 6.6 * m;
  float rho = mix(4.75, 1.15, m);
  float air = uHead - d;
  float old = smoothstep(120.0, 1400.0, d);
  vec3 lp = vec3(aA.z * (16.25 + rho * cos(th)), -3.9 + rho * sin(th) * 0.5 - 0.0035 * d, 31.0 + d);
  lp.x += sin(air * 0.017 + aA.z * 1.3) * 5.0 * old;
  lp.y += sin(air * 0.023 + 2.0 + aA.z) * 3.0 * old;
  vec3 c = (modelMatrix * vec4(lp, 1.0)).xyz;
  vec3 ax = normalize((modelMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
  vec3 toC = c - cameraPosition; float dist = length(toC);
  vec3 side = cross(ax, toC); float sl = length(side);
  side = sl > 1e-3 ? side / sl : vec3(0.0, 1.0, 0.0);
  float bead = 1.0 + 0.3 * sin(air * 0.19 + aA.w * 2.0 + aA.z) * sin(air * 0.047 + 1.0);
  float w = mix(0.8, 3.3, smoothstep(0.0, 700.0, d)) * bead * (0.3 + 0.7 * smoothstep(0.0, 16.0, d));
  float wd = max(w, dist * uPix * 1.2);
  vec3 wp = c + side * aA.y * wd;
  vT = vec4(aA.y, d, w / wd, air);
  vSd = side; vWp = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FRESH_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform vec3 uBody, uRim, uShade, uSunDir;
uniform float uTime, uGain, uLen;
varying vec4 vT; varying vec3 vWp; varying vec3 vSd;
void main() {
  float v = vT.x, d = vT.y, air = vT.w;
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-3);
  float age = smoothstep(0.0, 900.0, d);
  float n = texture2D(uNoise, vec2(air * 0.011, v * 0.16 + 0.3)).r;
  float n2 = texture2D(uNoise, vec2(air * 0.045 - uTime * 0.004, v * 0.4 + 0.7)).g;
  float fl = texture2D(uNoise, vec2(air * 0.05 - uTime * 0.8, 0.4)).b;
  float core = pow(max(1.0 - v * v, 0.0), 1.3);
  // young: a crisp bright core; older: it widens and puffs (the noise eats its edge into heads)
  float a = core * smoothstep(mix(0.02, 0.3, age), mix(0.3, 0.75, age), core * (0.55 + 0.9 * (n * 0.55 + n2 * 0.45)));
  // frozen out of clear air in flickers, 30 m behind the nozzles
  a *= smoothstep(0.0, 9.0, d) * mix(smoothstep(0.3, 0.6, fl + smoothstep(0.0, 30.0, d) * 0.5), 1.0, smoothstep(10.0, 40.0, d));
  // (a lens-facing ribbon cannot be a rope of cloud at arm's length: within 60 m of the lens the line dissolves, all along it.
  // Kept to 15 m, the two ropes lay across the whole picture as glassy bands while the lens climbed through them)
  a *= (1.0 - smoothstep(0.6, 1.0, d / uLen)) * mix(0.95, 0.6, age) * vT.z * smoothstep(18.0, 60.0, dist);
  // lit round: the normal turns across the ribbon
  vec3 N = normalize(vSd * v + V * sqrt(max(1.0 - v * v, 0.0)) + vec3(0.0, 1e-5, 0.0));
  float wrap = smoothstep(-0.45, 0.85, dot(N, uSunDir));
  float vs = max(dot(-V, uSunDir), 0.0);
  float lit = clamp(0.2 + 0.62 * wrap + 0.3 * vs * vs + (n2 - 0.5) * 0.35 + 0.2 * core * (1.0 - age), 0.0, 1.0);
  vec3 col = mix(uShade, uBody, lit);
  col = mix(col, uRim, (1.0 - core) * (0.15 + 0.85 * vs * vs) * 0.5);
  gl_FragColor = vec4(col * a * uGain, a);
}`;

// ---------- helpers ----------
// smooth interpolation through (x, value) knots: flat at each knot, so speeds ease in and out
function piecewise(K, smooth = true) {
  return (x) => {
    if (x <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i++) if (x <= K[i + 1][0]) { const f = (x - K[i][0]) / (K[i + 1][0] - K[i][0]); return lerp(K[i][1], K[i + 1][1], smooth ? f * f * (3 - 2 * f) : f); }
    return K[K.length - 1][1];
  };
}

// THE DECK'S DOMES (a 256 x 256 tile of 10 x 10 cells, about 16 km): r = cumulus heads, g = turrets, b = the heads blurred.
// Every form is a round cap on a jittered grid: big heads (0.42-0.76 of a cell in radius, one in ten 1.7-2.1 times that, the wider the taller, steep at the foot
// and flat on top as a cloud is, not peaked as a hill is), and two sizes of bulge (a third and a sixth of a cell) that swell each
// head's top and scallop its outline, so a head is a cauliflower. Between heads lies a low lumpy layer that only a closed deck
// shows. Nothing here is fractal noise: summed octaves gave crags, knife ridges and spikes a march could step through.
// Each cap is stamped onto the texels it covers, keeping the tallest (the tile wraps). The stamping loops are plain functions and
// bakeDeck only strings them together with yields: a loop an async function comes back into after an await runs unoptimised.
// caps C from q0 to q1 (five numbers each: centre x, y and radius in texels, weight, radius in cells): out = k x the tallest bulge
function stampBulges(C, q0, q1, k, out) {
  const S = DECK_S, M = S - 1;
  for (let q = q0; q < q1; q += 5) {
    const cx = C[q], cy = C[q + 1], rp = C[q + 2], ir2 = 1 / (rp * rp), a = (0.55 + 0.45 * C[q + 3]) * k, x0 = Math.floor(cx - rp), x1 = Math.ceil(cx + rp), y1 = Math.ceil(cy + rp);
    for (let py = Math.floor(cy - rp); py <= y1; py++) {
      const dy = py + 0.5 - cy, row = (py & M) * S;
      for (let px = x0; px <= x1; px++) { const dx = px + 0.5 - cx, v = 1 - (dx * dx + dy * dy) * ir2; if (v > 0) { const h = v * (2 - v) * a, t = row + (px & M); if (h > out[t]) out[t] = h; } }
    }
  }
}
// the heads, their outlines scalloped by the bulges (so a head reaches up to 1.09 radii); one wide head in five carries a turret:
// a narrower, taller dome on its middle
function stampHeads(A, q0, q1, lump, dome, Tw) {
  const S = DECK_S, M = S - 1;
  for (let q = q0; q < q1; q += 5) {
    const cx = A[q], cy = A[q + 1], rp = A[q + 2], ir2 = 1 / (rp * rp), w = A[q + 3], r = A[q + 4], e = rp * 1.09, hk = 0.45 + 0.55 * (Math.min(r, 0.76) - 0.42) / 0.34 * (0.75 + 0.25 * w), tur = w > 0.78 && r > 0.56;
    const x0 = Math.floor(cx - e), x1 = Math.ceil(cx + e), y1 = Math.ceil(cy + e);
    for (let py = Math.floor(cy - e); py <= y1; py++) {
      const dy = py + 0.5 - cy, row = (py & M) * S;
      for (let px = x0; px <= x1; px++) {
        const dx = px + 0.5 - cx, rr = (dx * dx + dy * dy) * ir2, t = row + (px & M), l = lump[t], v = 1 - rr + 0.34 * (l - 0.5);
        if (v > 0) { const u = v < 1 ? v : 1, h = hk * u * (1.6 - 0.6 * u); if (h > dome[t]) dome[t] = h; }
        if (tur) { const vt = 1 - rr * 4.5 + 0.3 * (l - 0.5); if (vt > 0) { const u = vt < 1 ? vt : 1, h = u * (1.6 - 0.6 * u); if (h > Tw[t]) Tw[t] = h; } }
      }
    }
  }
}
// the heads blurred over five texels each way (a head less its blur is high on a bulge and low in a fold), and the texture's bytes
function deckBytes(lump, dome, Tw, tmp, data) {
  const S = DECK_S, M = S - 1;
  for (let q = 0; q < S * S; q++) { const l = lump[q]; dome[q] = Math.max(dome[q] * (0.6 + 0.4 * l), 0.2 * l); Tw[q] *= 0.7 + 0.3 * l; }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let a = 0; for (let k = -2; k <= 2; k++) a += dome[y * S + ((x + k) & M)]; tmp[y * S + x] = a / 5; }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let a = 0; for (let k = -2; k <= 2; k++) a += tmp[((y + k) & M) * S + x];
    const i = (y * S + x) * 4; data[i] = Math.round(255 * Math.min(1, dome[y * S + x])); data[i + 1] = Math.round(255 * Math.min(1, Tw[y * S + x])); data[i + 2] = Math.round(255 * Math.min(1, a / 5)); data[i + 3] = 255;
  }
}
async function bakeDeck(ctx, seed) {
  const S = DECK_S, G = DECK_G, hsh = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + seed) * 43758.5453; return v - Math.floor(v); };
  const lump = new Float32Array(S * S), dome = new Float32Array(S * S), Tw = new Float32Array(S * S), tmp = new Float32Array(S * S), data = new Uint8Array(S * S * 4);
  // the caps of an n x n jittered grid, in texels: centre x, y, radius, weight, radius in cells
  const caps = (n, k0, r0, r1, jit) => {
    const c = new Float32Array(n * n * 5), sc = S / n;
    for (let j = 0, q = 0; j < n; j++) for (let i = 0; i < n; i++, q += 5) {
      const r = r0 + (r1 - r0) * hsh(i, j, k0 + 2);
      c[q] = (i + 0.5 + (hsh(i, j, k0) - 0.5) * jit) * sc; c[q + 1] = (j + 0.5 + (hsh(i, j, k0 + 1) - 0.5) * jit) * sc; c[q + 2] = r * sc; c[q + 3] = hsh(i, j, k0 + 3); c[q + 4] = r;
    }
    return c;
  };
  // two sizes of bulge (a third and a sixth of a cell): lump = 0.62 x the taller coarse one + 0.38 x the taller fine one
  const B1 = caps(G * 3, 11, 0.6, 0.95, 0.8), B2 = caps(G * 6, 21, 0.6, 1.0, 0.8), A = caps(G, 1, 0.42, 0.76, 0.7);
  // NOT ALL ONE SIZE: one head in ten is a great mound 1.7 to 2.1 times as wide as its draw (no taller than the tallest of the
  // rest: stampHeads caps the height), swallowing its neighbours' flanks, so the field has big heads among the small ones
  for (let j = 0, q = 0; j < G; j++) for (let i = 0; i < G; i++, q += 5) if (hsh(i, j, 7) < 0.1) { const k = 1.7 + 0.4 * hsh(i, j, 8); A[q + 2] *= k; A[q + 4] *= k; }
  await ctx.yield();
  for (let q = 0; q < B1.length; q += 1500) { stampBulges(B1, q, Math.min(B1.length, q + 1500), 0.62, lump); await ctx.yield(); }
  for (let q = 0; q < B2.length; q += 3000) { stampBulges(B2, q, Math.min(B2.length, q + 3000), 0.38, tmp); await ctx.yield(); }
  for (let q = 0; q < S * S; q++) lump[q] += tmp[q];
  for (let q = 0; q < A.length; q += 100) { stampHeads(A, q, Math.min(A.length, q + 100), lump, dome, Tw); await ctx.yield(); }
  deckBytes(lump, dome, Tw, tmp, data);
  await ctx.yield();
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// a 150-triangle airliner for the far tracks: nose toward -Z, 70 m long, 65 m span, origin at its middle
function lowPolyAirliner() {
  const P = [], N = [];
  const quad = (a, b, c, d, n) => { for (const v of [a, b, c, a, c, d]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); } };
  const tube = (st, sides, x0, y0) => {
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < sides; j++) {
      const a0 = j / sides * TAU, a1 = (j + 1) / sides * TAU, am = (a0 + a1) / 2, A = st[i], B = st[i + 1];
      const pt = (S, a) => [x0 + Math.cos(a) * S[1], y0 + (S[2] || 0) + Math.sin(a) * S[1], S[0]];
      quad(pt(A, a0), pt(B, a0), pt(B, a1), pt(A, a1), [Math.cos(am), Math.sin(am), 0]);
    }
  };
  tube([[-35, 0.4, -0.6], [-31, 2.2, -0.2], [-24, 3.0, 0], [8, 3.0, 0], [26, 1.9, 0.9], [35, 0.5, 1.8]], 8, 0, 0);
  for (const sg of [-1, 1]) {
    quad([sg * 2.5, -1.2, -9], [sg * 32.5, 2.4, 11.5], [sg * 32.5, 2.4, 15], [sg * 2.5, -1.2, 4.5], [0, 1, 0]);
    quad([sg * 32.5, 2.4, 12], [sg * 33.2, 5.2, 14.5], [sg * 33.2, 5.2, 16], [sg * 32.5, 2.4, 15], [sg, 0.3, 0]);
    quad([sg * 1.2, 1.6, 26], [sg * 11, 2.4, 32.5], [sg * 11, 2.4, 35], [sg * 1.2, 1.6, 33], [0, 1, 0]);
    tube([[-9, 1.5], [-2.5, 1.3]], 6, sg * 11.5, -3.0);
    tube([[-1, 1.5], [5.5, 1.3]], 6, sg * 21, -1.6);
  }
  quad([0, 2.6, 23], [0, 13.5, 31.5], [0, 13.5, 35], [0, 2.6, 33.5], [1, 0, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  return g;
}

export default {
  id: 'dawn-tracks-contrail',
  name: 'The Dawn Tracks',
  category: 'sky',
  weirdness: 0.35,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const T = { value: 0 };

    // ---------- MOODS: hour from the viewer, air / deck / cast from the seed ----------
    const hourName = vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'night' : 'dawn';
    const H = HOURS[hourName];
    const air = AIRS[Math.min(2, Math.floor(rng() * 3))];
    const deckKind = Math.min(2, Math.floor(rng() * 3));            // 0 broken cumulus field, 1 long rolls, 2 closed lumpy deck with turrets
    const fatBands = 2 + Math.floor(rng() * 5);                     // how many of the twenty tracks are fat old bands
    const deckOff = [rng.range(0, 40), rng.range(0, 40)], cellSize = rng.range(1450, 1750);
    const veilCover = clamp(rng.range(0.35, 1) * density * H.veil, 0, 1.2);
    const rare = !!vary.rare && hourName !== 'night';
    const mood = vary.mood ?? 0.5;
    const trackRng = rng.fork('tracks'), fxRng = rng.fork('fx');
    const ember = hourName === 'dawn' ? H.ember.clone().lerp(C(air.emberMix[0], 1.05), air.emberMix[1]) : H.ember;   // local: HOURS is never written

    // ---------- PATH: the brief's line, and tables that turn u into metres along the trail and into seconds ----------
    const path = makePath(PATH_PTS.map((p) => [p[0], p[1], -p[2]]));
    await ctx.yield();                                       // (the kit's makePath is a step of its own, about 17 ms)
    const NT = 480, sTab = new Float32Array(NT + 1), tTab = new Float32Array(NT + 1), v3 = new THREE.Vector3();
    for (let i = 0; i <= NT; i++) { path.pointAt(i / NT, v3); sTab[i] = -v3.z; if (i % 60 === 59) await ctx.yield(); }   // (the kit's pointAt is 0.1 ms a call here)
    const tab = (A, u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return lerp(A[i], A[i + 1], f - i); };
    const inv = (A, x) => { let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m] <= x) lo = m; else hi = m; } return clamp((lo + (x - A[lo]) / Math.max(1e-6, A[hi] - A[lo])) / NT, 0, 1); };
    const sOfU = (u) => tab(sTab, u), uOfS = (s) => inv(sTab, s);
    const speedAt = piecewise(SPEEDS), AVG = path.length / DURATION;
    const pace = (u) => speedAt(sOfU(u)) / AVG;
    { let acc = 0; for (let i = 1; i <= NT; i++) { acc += 1 / clamp(pace((i - 0.5) / NT), 0.35, 2.5); tTab[i] = acc; } for (let i = 1; i <= NT; i++) tTab[i] *= DURATION / acc; }
    const tOfU = (u) => tab(tTab, u), uOfT = (t) => inv(tTab, t);
    await ctx.yield();

    // ---------- sky, FOG, light rig (the rig only fills rides and companions: the world's own shaders light themselves) ----------
    const night = hourName === 'night';
    const sunDir = skyDirection(-3, 40), keyDir = night ? skyDirection(50, 34) : sunDir;
    const sunAz = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    const bodies = night
      ? [{ elevation: 50, azimuth: 34, size: 1.5, phase: 0.8, phaseAngle: 200, glow: 0.5, glowSize: 5, color: '#eef2ff', texture: 0.5 }]
      : [{ elevation: 20, azimuth: 28, size: 1.7, phase: 0.17, phaseAngle: 222, intensity: 3, dark: 0.045, glow: 0.07, glowSize: 2.5, color: '#fff0de', texture: 0.4 }];
    const sky = makeSky({ rng, preset: 'dawn', ...H.sky, stars: H.sky.stars * air.stars, twinkle: 0.8, sunElevation: night ? -30 : -3, sunAzimuth: 40, sunIntensity: 0, sunGlow: night ? 0 : 0.1, clouds: false, clouds2: false,
      bodies, key: night ? 0 : 'sun', aurora: night ? 0.4 : 0, auroraAzimuth: -100, auroraSpread: 1, auroraColors: ['#3fe0a0', '#6a5ae0'],
      lightColor: night ? '#9fb4e8' : (hourName === 'golden' ? '#ff5a6a' : '#ff8a62'), lightIntensity: night ? 1.1 : 1.6, lightElevationMin: 6,
      ambientColor: night ? '#3a4f9a' : '#5a6599', groundLight: night ? '#3a4a6a' : '#6a4658', ambientIntensity: 1.3, bake: true, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();                                       // the kit's sky is a step of its own (about 45 ms)
    scene.fog = new THREE.FogExp2(H.fog.clone(), H.fogDensity);
    const rig = makeLightRig(sky, { intensity: 0.8, ambient: 1, bounce: 0.3 });
    scene.add(rig.object);
    await ctx.yield();

    // ---------- HERO: built in the brief's own frame (z = -s), so it sits at the origin unrotated ----------
    const night0 = hourName === 'night';
    const hero = await buildHero(ctx, { palette: PAL, hour: hourName, pathPoints: PATH_PTS, sunDir: keyDir });
    scene.add(hero.object);
    if (hourName === 'dawn' && air.trail) hero.uniforms.uBody.value.lerp(C(air.trail[0], 0.9), air.trail[1]);
    hero.uniforms.uStreak.value = night0 ? 1.1 : 1.7;
    if (!night && hero.hullUniforms) hero.hullUniforms.uAmbUp.value.lerp(C('#5A6599', 0.6), 0.6);
    if (!night && hero.hullUniforms) hero.hullUniforms.uEnvZen.value.lerp(C('#3a4a78', 0.7), 0.6);   // the wing's sky side: slate-lilac, not ink blue
    const noiseTex = hero.noiseTex, A = hero.anchors;
    await ctx.yield();

    // ---------- far-plane layers: the twilight overlay, then the deck (both after the kit dome, before everything else) ----------
    const glow0 = H.glow * air.glow * lerp(0.92, 1.08, mood);
    const DL = DECK_LIGHT[hourName], ember0 = ember.clone(), emberNow = ember.clone(), gold0 = H.gold.clone(), goldNow = H.gold.clone();
    const skyxU = {
      uSunAz: { value: sunAz }, uEmber: { value: emberNow }, uGold: { value: goldNow }, uGreen: { value: rare ? 1 : 0 }, uTop: { value: H.top }, uSlate: { value: H.slate }, uRose: { value: H.rose },
      uLimbDir: { value: skyDirection(-4.4, 40) }, uVenusDir: { value: skyDirection(25, 10) }, uGlow: { value: glow0 }, uArch: { value: air.arch }, uBelt: { value: H.belt * air.belt },
      uLimb: { value: 0 }, uTopW: { value: 1 }, uVenus: { value: hourName === 'golden' ? 1 : 0 }, uTime: T };
    const skyx = new THREE.Mesh(new THREE.SphereGeometry(100, 28, 14), new THREE.ShaderMaterial({ uniforms: skyxU, vertexShader: FAR_VERT, fragmentShader: SKYX_FRAG,
      transparent: true, depthWrite: false, depthTest: true, premultipliedAlpha: true, side: THREE.BackSide, fog: false }));
    skyx.frustumCulled = false; skyx.renderOrder = -0.9; skyx.name = 'twilight'; scene.add(skyx);
    const hazeSun0 = H.hazeSun.clone(), hazeSunNow = H.hazeSun.clone();
    const deckTex = await bakeDeck(ctx, deckOff[0] + 1.7 * deckOff[1]);   // (seeded from the deck's own offsets: no draw)
    const deckU = {
      uNoise: { value: noiseTex }, uDeck: { value: deckTex }, uTime: T, uTerm: { value: 1e9 }, uCell: { value: cellSize }, uOff: { value: new THREE.Vector2(deckOff[0], deckOff[1]) }, uSunAz: { value: sunAz },
      uSea: { value: H.sea }, uWall: { value: H.wall.clone().multiplyScalar(0.8 * DL.amb) }, uWallHi: { value: H.wallHi.clone().multiplyScalar(0.7 * DL.amb) }, uWallRose: { value: H.wallRose }, uHaze: { value: H.haze }, uHazeSun: { value: hazeSunNow }, uTermCol: { value: DL.sun },
      uPix: { value: 0.003 }, uLitK: { value: 1 }, uGlowCol: { value: DL.lit }, uShape: { value: new THREE.Vector4(...DECK_KINDS[deckKind]) },
      uRollDir: { value: new THREE.Vector2(Math.cos(deckOff[0] * 0.37), Math.sin(deckOff[0] * 0.37)) },
      // the flank light comes from the glow's azimuth, a few degrees up (the moon's own place at night)
      uKey: { value: night ? new THREE.Vector3(keyDir.x, 0, keyDir.z).normalize().multiplyScalar(Math.cos(DL.el * DEG)).setY(Math.sin(DL.el * DEG)) : sunAz.clone().multiplyScalar(Math.cos(DL.el * DEG)).setY(Math.sin(DL.el * DEG)) } };
    const deck = new THREE.Mesh(new THREE.SphereGeometry(100, 28, 9, 0, TAU, Math.PI / 2 - 0.03, Math.PI / 2 + 0.03), new THREE.ShaderMaterial({ uniforms: deckU, vertexShader: FAR_VERT,
      fragmentShader: DECK_FRAG, defines: { STEPS: Math.max(16, Math.round(28 * detail)) }, transparent: true, depthWrite: false, depthTest: true, side: THREE.BackSide, fog: false }));
    deck.frustumCulled = false; deck.renderOrder = -0.8; deck.name = 'deck'; scene.add(deck);
    await ctx.yield();

    // ---------- the cirrus veil, 120 m above the trail on the down-sun (left) side only ----------
    const hazeAway = H.trackAway, hazeSun = H.trackSun;
    const body = hero.uniforms.uBody.value, rim = hero.uniforms.uRim.value, shade = hero.uniforms.uShade.value;
    const vg = new THREE.PlaneGeometry(1, 1, 18, 22), vp = vg.attributes.position;
    for (let i = 0; i < vp.count; i++) { const x = lerp(-2700, -90, vp.getX(i) + 0.5), s = lerp(-800, 1750, vp.getY(i) + 0.5); vp.setXYZ(i, x, 12 + 0.055 * s, -s); }
    const veilU = { uNoise: { value: noiseTex }, uTime: T, uCover: { value: veilCover }, uSunDir: { value: keyDir }, uBody: { value: body }, uRim: { value: rim }, uShade: { value: shade }, uHazeC: { value: hazeAway } };
    const veil = new THREE.Mesh(vg, new THREE.ShaderMaterial({ uniforms: veilU, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false }));
    veil.frustumCulled = false; veil.renderOrder = 2; veil.name = 'cirrus-veil'; scene.add(veil);
    await ctx.yield();

    // ---------- the other tracks: 20 lines and the westbound heavy's fresh one (ribbon 20) ----------
    // (the two staged lines, ribbons 20 and 21, pass within 100 m of the lens: 220 stations each, a metre apart at the aircraft, so
    // the young line is a smooth curve. At 40 the sway was sampled every 30-300 m and the line read as a broken polyline.)
    const NTR = 22, segOf = (r) => (r < 20 ? 40 : 220), nv = 20 * 41 * 2 + 2 * 221 * 2;
    const tA = new Float32Array(nv * 4), tB = new Float32Array(nv * 4), tC = new Float32Array(nv * 4), tI = new Uint16Array((20 * 40 + 2 * 220) * 6), lanes = [];
    const HEAVY_X = -160, HEAVY_Y = 175, CROSS_X = -70, CROSS_Y = 10;
    for (let r = 0, q = 0, k = 0; r < NTR; r++) {
      const seed = r < 21 ? trackRng() : 0.37;      // (ribbon 21 was added later: it takes no draw, so the cast is as it was)
      let x = HEAVY_X, y = HEAVY_Y, z0 = -52000, len = 0, creep = 0, w0 = 9, w1 = 44, age0 = 0, kind = 1;
      if (r < 20) {
        kind = 0;
        const sg = r % 2 ? 1 : -1, lower = r % 5 < 3, fat = r >= 20 - fatBands, lat = r < 6 ? trackRng.range(850, 1900) : trackRng.range(1500, 6000);
        x = sg * lat; y = -55 + (lower ? -1 : 1) * trackRng.range(300, 900);
        z0 = r < 9 ? -trackRng.range(600, 5200) : -trackRng.range(7500, 19000);
        len = trackRng.range(30000, 60000); creep = trackRng.range(-14, 22); w0 = 10; w1 = trackRng.range(45, 105);
        if (fat) { z0 = -60000; len = 90000; creep = 0; w0 = 90; w1 = trackRng.range(150, 240); age0 = trackRng.range(0.5, 0.8); }
        else lanes.push([x, y, z0, creep]);
      } else if (r === 21) { kind = 2; x = CROSS_X; y = CROSS_Y - 2; w0 = 18; }
      const base = q, SEG = segOf(r);
      for (let i = 0; i <= SEG; i++) for (const sd of [-1, 1]) { tA.set([i / SEG, sd, seed, kind], q * 4); tB.set([x, y, z0, len], q * 4); tC.set([creep, w0, w1, age0], q * 4); q++; }
      for (let i = 0; i < SEG; i++) { const a = base + i * 2; tI.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k); k += 6; }
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    tg.setAttribute('aA', new THREE.BufferAttribute(tA, 4)); tg.setAttribute('aB', new THREE.BufferAttribute(tB, 4)); tg.setAttribute('aC', new THREE.BufferAttribute(tC, 4));
    tg.setIndex(new THREE.BufferAttribute(tI, 1));
    const trackU = { uNoise: { value: noiseTex }, uTime: T, uHeavyZ: { value: -14000 }, uHeavyZ2: { value: -9000 }, uPix: { value: 0.002 }, uBody: { value: body }, uRim: { value: rim }, uShade: { value: shade },
      uHazeAway: { value: hazeAway }, uHazeSun: { value: hazeSun }, uHazeDeck: { value: H.haze }, uSunAz: { value: sunAz }, uGain: { value: 0.85 } };
    const tracks = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: trackU, vertexShader: TRACK_VERT, fragmentShader: TRACK_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false }));
    tracks.frustumCulled = false; tracks.renderOrder = 1; tracks.name = 'other-tracks'; scene.add(tracks);
    await ctx.yield();

    // ---------- the aircraft at the heads of those lines, their glints and beacons ----------
    const HU = hero.hullUniforms, nP = lanes.length;
    const pg = new THREE.InstancedBufferGeometry(), lp = lowPolyAirliner(), iA = new Float32Array(nP * 4);
    for (let i = 0; i < nP; i++) iA.set(lanes[i], i * 4);
    pg.setAttribute('position', lp.attributes.position); pg.setAttribute('normal', lp.attributes.normal);
    pg.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); pg.instanceCount = nP;
    const planeU = { uTime: T, uPix: { value: 0.002 }, uSunDir: { value: keyDir }, uSunCol: { value: HU.uSunCol.value }, uAmbUp: { value: HU.uAmbUp.value }, uAmbDn: { value: HU.uAmbDn.value },
      uHazeAway: { value: hazeAway }, uHazeSun: { value: hazeSun }, uHazeDeck: { value: H.haze }, uSunAz: { value: sunAz } };
    const planes = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: planeU, vertexShader: PLANE_VERT, fragmentShader: PLANE_FRAG, side: THREE.DoubleSide, fog: false }));
    planes.frustumCulled = false; planes.name = 'far-airliners'; scene.add(planes);
    const sn = nP * 2, sA = new Float32Array(sn * 16), sL = new Float32Array(sn * 16), sI = new Uint16Array(sn * 6), cor = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < sn; i++) {
      const ln = lanes[i >> 1], ph = trackRng();
      for (let c = 0; c < 4; c++) { sA.set(ln, (i * 4 + c) * 4); sL.set([cor[c][0], cor[c][1], i & 1, ph], (i * 4 + c) * 4); }
      sI.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    }
    const sg2 = new THREE.BufferGeometry();
    sg2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sn * 12), 3));
    sg2.setAttribute('aA', new THREE.BufferAttribute(sA, 4)); sg2.setAttribute('aL', new THREE.BufferAttribute(sL, 4)); sg2.setIndex(new THREE.BufferAttribute(sI, 1));
    const spriteU = { uTime: T, uPix: { value: 0.002 }, uGlint: { value: night ? C('#dfe8ff', 1.6) : body.clone().multiplyScalar(2.4) }, uBeacon: { value: C('#ff2416', 3.6) } };
    const sprites = new THREE.Mesh(sg2, new THREE.ShaderMaterial({ uniforms: spriteU, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sprites.frustumCulled = false; sprites.renderOrder = 3; sprites.name = 'far-lights'; scene.add(sprites);
    await ctx.yield();

    // ---------- the staged westbound heavy: the hero's own airframe flown the other way, 175 m up and 160 m to the left ----------
    const heavy = new THREE.Group(); heavy.name = 'westbound-heavy'; heavy.rotation.y = Math.PI; heavy.position.set(HEAVY_X, HEAVY_Y, -14000);
    let heavyHullU = null, heavyLampU = null;
    if (hero.airliner) {
      const hm = hero.airliner.hull.material.clone(), lm = hero.airliner.lamps.material.clone();
      hm.uniforms.uNoise.value = noiseTex; hm.uniforms.uTail.value.set(trackRng.pick(['#0E6F7A', '#B01E3C', '#1D3FA6', '#D99A1B', '#5E2A6E'])).multiplyScalar(0.85);
      const hh = new THREE.Mesh(hero.airliner.hull.geometry, hm), hl = new THREE.Mesh(hero.airliner.lamps.geometry, lm);
      hh.position.set(0, -2.2, 2024); hl.position.copy(hh.position); hh.frustumCulled = false; hl.frustumCulled = false; hl.renderOrder = 9;
      heavy.add(hh, hl); heavyHullU = hm.uniforms; heavyLampU = lm.uniforms;
    }
    scene.add(heavy);
    // THE THREE STAGED AIRCRAFT FLY AT CONSTANT SPEEDS. Each is placed from one meeting set at a place in the world and the seconds
    // of the flight (tOfU: the flight's own clock at its set pace, so the aircraft follow u like every scripted moment):
    // where it is = the meeting place + its speed x (the seconds now - the seconds of the meeting), for the whole flight.
    // Both westbound heavies fly at 100 m/s, the early heavy across the track at 56 m/s (the world is 40 km of sky told in 2.4).
    // (At 141 m/s the crossing heavy closed at 190 m/s and was a readable aircraft for a second and a half; at 100 it is one for three.)
    const WEST_V = 100, EARLY_V = 56, NOSE_S = -A.airliner.nose.z;
    // the westbound heavy is abeam of our own aircraft's nose at 55 s (the brief: it passes at 54-55 s). heavyAhead: metres ahead of the lens
    const heavyAhead = (u) => NOSE_S + WEST_V * (55 - tOfU(u)) - sOfU(u);
    await ctx.yield();

    // ---------- the crossing heavy: a second westbound widebody, 70 m to the left of the trail and 10 m above the aircraft's level,
    // that meets us over the last of the waves, where the camera line runs level at y -42 above both ropes and nothing stands
    // overhead: a speck with strobes from loop 7 on, growing for seven seconds, then its belly (lit coral from below) passing 52 m
    // over the lens and 66 m to its left. It is overhead where the camera line leans furthest toward its lane (the knot at s 1440).
    // Its fresh line (track ribbon 21) then runs ahead to the vanishing point, left of the portal and clear of the aircraft's wingtip.
    const crosser = new THREE.Group(); crosser.name = 'crossing-heavy'; crosser.rotation.y = Math.PI; crosser.position.set(CROSS_X, CROSS_Y, -9000);
    let crossHullU = null, crossLampU = null;
    if (hero.airliner) {
      const hm = hero.airliner.hull.material.clone(), lm = hero.airliner.lamps.material.clone();
      hm.uniforms.uNoise.value = noiseTex; hm.uniforms.uTail.value.set(['#1E6B45', '#C8452A', '#1D3FA6', '#B01E3C', '#0E6F7A'][fatBands % 5]).multiplyScalar(0.85);
      const ch = new THREE.Mesh(hero.airliner.hull.geometry, hm), cl = new THREE.Mesh(hero.airliner.lamps.geometry, lm);
      ch.position.set(0, -2.2, 2024); cl.position.copy(ch.position); ch.frustumCulled = false; cl.frustumCulled = false; cl.renderOrder = 9;
      crosser.add(ch, cl); crossHullU = hm.uniforms; crossLampU = lm.uniforms;
      // at night it passes 50 m overhead belly-on: the moonlit deck's bounce is raised, or it is a black shape on a black sky
      if (night) { hm.uniforms.uAmbDn.value.multiplyScalar(4.5); hm.uniforms.uEnvDeck.value.multiplyScalar(2.2); }
    }
    scene.add(crosser);
    const CROSS_S = 1440, tCross = tOfU(uOfS(CROSS_S)), crossAhead = (u) => CROSS_S + WEST_V * (tCross - tOfU(u)) - sOfU(u);
    // WHERE THE GAZE GOES FOR IT (crossAt): while the aircraft is more than 620 m from the lens, to the ropes 90 m ahead (the same
    // point the look down on the waves is held on, so the horizon stays in the top third and the aircraft rides in the upper
    // part of the picture as a growing speck); between 620 m and 200 m the point slides up to the aircraft itself, so the gaze
    // rises with it as it becomes a clear cross, and follows it from there. A rule of the aircraft's own distance, the whole pass.
    const crossV = new THREE.Vector3(CROSS_X, CROSS_Y, -9000), crossP = new THREE.Vector3(), crossR = new THREE.Vector3();
    const ropeAxis = piecewise([[990, -110], [1110, -104], [1230, -94.5], [1350, -95], [1750, -22], [1990, -3]], false);
    const crossAt = (time, u) => {
      const sc = sOfU(u), sa = sc + 90;
      crossV.set(CROSS_X, CROSS_Y, -(sc + crossAhead(u)));                    // where the aircraft is
      path.pointAt(u, crossP);
      return crossR.set(0, ropeAxis(sa) + 4, -sa).lerp(crossV, 1 - smoothstep(200, 620, crossV.distanceTo(crossP)));
    };
    await ctx.yield();

    // ---------- the early heavy: a third widebody, crossing the track from right to left 25 m above loop 7 while the lens lies
    // under that loop looking up. It is banked 11 degrees toward us, so from below we see its belly, the engines and the lit cabin
    // row of its near flank. It is over the middle of the loop when the lens is at the floor of the dip beneath it (s 1003, the
    // lowest knot of the camera line): it comes in from the right about four seconds before that, crosses the loop's opening some
    // 100 m from the lens and leaves to the upper left. Its fresh line (four jets winding into two ropes, FRESH_*) is laid across
    // the old loop and stays there; the lens climbs through that line a few seconds later, and the line dissolves within
    // 60 m of the lens (FRESH_FRAG). One straight track, one speed.
    const EARLY = { x: 8, y: -90, z: -1066, hx: -0.989, hz: 0.148 };
    const early = new THREE.Group(); early.name = 'early-heavy'; early.rotation.order = 'YXZ'; early.rotation.set(0, Math.atan2(-EARLY.hx, -EARLY.hz), 0.2);
    early.position.set(EARLY.x, EARLY.y, EARLY.z);
    const earlyBody = new THREE.Group(); early.add(earlyBody);
    let earlyHullU = null, earlyLampU = null;
    if (hero.airliner) {
      const hm = hero.airliner.hull.material.clone(), lm = hero.airliner.lamps.material.clone();
      hm.uniforms.uNoise.value = noiseTex; hm.uniforms.uTail.value.set(['#D99A1B', '#0E6F7A', '#5E2A6E', '#C8452A', '#1D3FA6'][fatBands % 5]).multiplyScalar(0.85);
      const eh = new THREE.Mesh(hero.airliner.hull.geometry, hm), el = new THREE.Mesh(hero.airliner.lamps.geometry, lm);
      eh.position.set(0, -2.2, 2024); el.position.copy(eh.position); eh.frustumCulled = false; el.frustumCulled = false; el.renderOrder = 9;
      earlyBody.add(eh, el); earlyHullU = hm.uniforms; earlyLampU = lm.uniforms;
      // seen from its shadow side and from below: the glow under it and the sky fill are raised so the hull reads lilac and rose
      // against the indigo, not as a black shape (at night the moonlit deck's bounce)
      // (the fill from below is the glow of the band and the lit deck: rose; from above the sky: lilac)
      if (night) { hm.uniforms.uAmbDn.value.multiplyScalar(4.5); hm.uniforms.uAmbUp.value.multiplyScalar(1.6); hm.uniforms.uEnvDeck.value.multiplyScalar(2.2); }
      else { hm.uniforms.uAmbDn.value.copy(C(hourName === 'golden' ? '#B86AA8' : '#C9809A', 0.4)); hm.uniforms.uAmbUp.value.multiplyScalar(1.7); hm.uniforms.uEnvAnti.value.multiplyScalar(2); hm.uniforms.uEnvDeck.value.copy(C('#6a4658', 0.7)); }
    }
    scene.add(early);
    const FSEG = 110, FLEN = 2600, fA = new Float32Array(4 * (FSEG + 1) * 2 * 4), fI = new Uint16Array(4 * FSEG * 6);
    for (let j = 0, q = 0, k = 0; j < 4; j++) {
      const base = q;
      for (let i = 0; i <= FSEG; i++) for (const sd of [-1, 1]) { fA.set([i / FSEG, sd, j < 2 ? -1 : 1, j % 2], q * 4); q++; }
      for (let i = 0; i < FSEG; i++) { const a = base + i * 2; fI.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k); k += 6; }
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * (FSEG + 1) * 2 * 3), 3));
    fg.setAttribute('aA', new THREE.BufferAttribute(fA, 4)); fg.setIndex(new THREE.BufferAttribute(fI, 1));
    const freshU = { uNoise: { value: noiseTex }, uTime: T, uHead: { value: 0 }, uPix: { value: 0.002 }, uLen: { value: FLEN }, uGain: { value: 0.95 },
      uBody: { value: body }, uRim: { value: rim }, uShade: { value: shade }, uSunDir: { value: keyDir } };
    const fresh = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: freshU, vertexShader: FRESH_VERT, fragmentShader: FRESH_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false }));
    fresh.frustumCulled = false; fresh.renderOrder = 9.5; fresh.name = 'early-heavy-line'; early.add(fresh);   // always drawn (840 triangles): the line is in the sky before and after the aircraft
    // metres along its track (0 = over the loop's middle)
    const tEarly = tOfU(uOfS(1003)), earlyAt = (u) => EARLY_V * (tOfU(u) - tEarly);
    await ctx.yield();

    // ---------- ice glitter at flight level, speed streaks for the canyon, the portal's star and its ring of glitter ----------
    const cool = night ? '#dfe8ff' : '#cfe6ff', warm = night ? '#aebcf0' : (hourName === 'golden' ? '#ff7aa0' : '#ff9f7a');
    const glitter = fx.makeParticles({ rng: fxRng.fork('glitter'), preset: 'dust', shape: 'sparkle', count: Math.round(7000 * detail * Math.max(0.9, density)), box: [150, 90, 170], size: [0.08, 0.26],
      colors: [warm, cool, night ? '#ffffff' : '#ffd9a8'], intensity: 3.0, additive: 1, twinkle: 0.5, blink: 2.2, velocity: [3, -0.6, 1.8], velocityRandom: [1.5, 0.6, 1.5], turbulence: [1.6, 0.8, 0.05], minAngle: 0.0032, near: [6, 18], time: T });
    scene.add(glitter.object);
    const streaks = fx.makeParticles({ rng: fxRng.fork('streaks'), preset: 'dust', mode: 'streak', shape: 'streak', count: Math.round(300 * detail), box: [56, 40, 150], size: [0.04, 0.09],
      colors: [cool, warm, cool], intensity: 1.3, additive: 1, velocity: [0, 0, 64], velocityRandom: [1.5, 1.5, 10], stretch: 0.03, minAngle: 0.0016, near: [2.5, 7], time: T });
    scene.add(streaks.object); streaks.setOpacity(0);
    const seat = A.portalSeat.position, last = PATH_PTS[PATH_PTS.length - 1], prev = PATH_PTS[PATH_PTS.length - 2];
    const pitch = Math.atan2(last[1] - prev[1], last[2] - prev[2]), ringPos = [], ringN = Math.round(96 * Math.max(0.75, detail));
    for (let i = 0; i < ringN; i++) {
      const a = (i + fxRng() * 0.7) / ringN * TAU, r = 15 + fxRng.gauss() * 1.2, d = fxRng.range(-1.5, 1.5);
      ringPos.push([seat.x + Math.cos(a) * r, seat.y + Math.sin(a) * r * Math.cos(pitch) + d * Math.sin(pitch), seat.z + Math.sin(a) * r * Math.sin(pitch) - d * Math.cos(pitch)]);
    }
    const ring = fx.makeGlows({ rng: fxRng.fork('ring'), positions: ringPos, colors: ['#CFE4FF', night ? '#ffffff' : '#FFC98A', '#6FE3C8', '#CFE4FF'], size: 1.3, sizeJitter: 0.6, intensity: 2.3, flicker: 0.8,
      minAngle: 0.0032, fogAmount: 0.15, time: T });
    scene.add(ring.object);
    const star = fx.makeGlow({ rng: fxRng.fork('star'), position: [seat.x, seat.y, seat.z], color: '#CFE4FF', size: 34, intensity: 0, spikes: 0.5, minAngle: 0.011, fogAmount: 0.1, time: T });
    scene.add(star.object);
    // the last meteors of the night, high overhead (pre-dawn is when they are most frequent); kept well above the portal
    const meteors = fx.makeShootingStars({ rng: fxRng.fork('meteors'), count: Math.round(8 * density), period: [5, 13], duration: 0.9, minElevation: 0.62, radius: 1500, intensity: 4, color: '#fff4e4', tailColor: '#8fb8ff', time: T });
    scene.add(meteors.object);
    await ctx.yield();

    // ---------- pois: the gaze leans to loop 4 under the ribbon, to loop 5 during the reveal, to the fuselage at the wing ----------
    const L7 = A.loop7, l7V = new THREE.Vector3(), FUS = A.airliner.fuselage, fusV = new THREE.Vector3();
    const axisAt = piecewise([[990, -110], [1110, -104], [1230, -94.5], [1350, -95], [1750, -22], [1990, -3]], false), downV = new THREE.Vector3();
    const pois = [
      { at: A.rings[0].center.clone(), from: 0.0, to: uOfS(440), weight: 0.42 },
      // from the floor of the dive the gaze lifts 22 degrees and swings right, into the vault of the ribbon
      { at: new THREE.Vector3(-60, -40, -400), from: 0.04, to: 0.125, weight: 0.7 },
      { at: A.loop5.clone(), from: uOfS(450), to: uOfS(655), weight: 0.3 },
      // through the chain the gaze is held on the next ring nested inside this one, so the stitch never stares at the deck
      { at: A.rings[1].center.clone(), from: uOfS(650), to: uOfS(770), weight: 0.5 },
      { at: A.rings[2].center.clone(), from: uOfS(765), to: uOfS(885), weight: 0.5 },
      // loop 7: while loop 6 is threaded (a 30 degree dive) the gaze is already held up on it, high over the horizon; from the floor
      // of the second dip it is seen whole from below, 30 degrees up
      { at: (time, u) => l7V.set(0, lerp(L7.y + 32, L7.y + 12, smoothstep(940, 992, sOfU(u))), L7.z - 8), from: uOfS(845), to: uOfS(1062), weight: 0.75, fade: 0.25 },
      // over loops 8 and 9 the gaze goes down to the ropes 90 m ahead, so the horizon rides in the top third
      { at: (time, u) => { const sa = sOfU(u) + 90; return downV.set(0, axisAt(sa) + 4, -sa); }, from: uOfS(1105), to: uOfS(1400), weight: 0.6, fade: 0.2 },
      // over the last of the waves the gaze stays down on the ropes until the crossing heavy is within 620 m, then rises up and
      // left with it and follows the aircraft itself (crossAt): eased in over three seconds from 5.6 s before it is overhead, eased
      // out over the last three, so the pull is nearly gone by the time it sweeps over the top of the picture (held at full
      // weight to its tail, the gaze was whipped back at 58 degrees a second; the rise with it turns the camera at 12 or so)
      { at: crossAt, from: uOfT(tCross - 5.6), to: uOfT(tCross + 0.7), weight: 0.6, fade: 0.45 },
      // along the fuselage the gaze rests on a point that slides forward ahead of the lens (never beside or behind it: held on
      // one fixed point, the gaze was whipped round at 58 degrees a second as the lens passed that point) and hands over to the rings
      { at: (time, u) => { const sc = sOfU(u); return fusV.set(FUS.x, FUS.y, -Math.max(-FUS.z, sc + 23 + 0.8 * Math.max(0, sc - 2007))); }, from: uOfS(1955), to: uOfS(2062), weight: 0.5 },
      // past the nose the gaze lifts to the exit rings: the gate with the wreath and the portal nested inside it
      { at: A.wreath.center.clone(), from: 0.835, to: 0.95, weight: 0.45, fade: 0.4 },
    ];
    await sky.prewarm(ctx.renderer, null, scene);

    const size = new THREE.Vector2(), limbDir = skyxU.uLimbDir.value, uRare0 = uOfT(55.5), uRare1 = uOfT(64.5);
    const body0 = body.clone(), rim0 = rim.clone();
    const hulls = [HU, heavyHullU, crossHullU, earlyHullU].filter(Boolean).map((hu) => ({ u: hu, c: hu.uSunCol.value.clone() }));
    const LIMB_AZ = 40 * DEG;
    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 75, near: 0.5, far: 60000, lookAhead: 55, sway: 0.5, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#CFE4FF', glow: 1, tilt: true },
      // POST: a dark saturated sky; bloom only for rims, windows, beacons and the portal
      post: { exposure: 1.0, bloom: { strength: 0.4, radius: 0.6, threshold: 0.92 },
        grade: { saturation: hourName === 'golden' ? 0.92 : 1.12, contrast: 1.06, tint: '#ffffff', shadowTint: '#05071a', vignette: 0.34, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        T.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        hero.update(dt, time, camera); hero.setProgress(u);
        // metres across one pixel at one metre: keeps far lines, aircraft and lights from going thinner than the screen can draw
        ctx.renderer.getDrawingBufferSize(size);
        const pix = 2 / (Math.max(0.2, camera.projectionMatrix.elements[5]) * Math.max(64, size.y));
        trackU.uPix.value = pix * 0.85; planeU.uPix.value = pix; spriteU.uPix.value = pix;
        const s = sOfU(u);
        // the glow slowly brightening over the flight
        // THE LIGHT MOVES: ember and indigo till the middle of the flight, then the band widens and warms, the trail and the hulls
        // turn toward gold, the sun's limb breaks the cloud horizon (u 0.54-0.62) and the terminator runs in over the deck's crests
        const kw = smoothstep(0.3, 0.88, u) * DL.warm, kb = smoothstep(0.3, 0.62, u) * DL.warm, kl = night ? 0 : smoothstep(0.54, 0.64, u) * (hourName === 'dawn' || rare ? 1 : 0);
        let glow = glow0 * lerp(0.84, 1.12, u) * (1 + 0.16 * kw);
        emberNow.copy(ember0).lerp(DL.emberTo, 0.6 * kw); goldNow.copy(gold0).multiplyScalar(1 + 0.45 * kw);
        skyxU.uArch.value = air.arch * lerp(0.86, 1.0, smoothstep(0, 0.45, u)) * (1 + 0.42 * kw);
        body.copy(body0).lerp(DL.bodyTo, 0.5 * kb); rim.copy(rim0).lerp(DL.rimTo, 0.5 * kb);
        skyxU.uTopW.value = 1 + 0.7 * kb;                                  // the turquoise hair over the band, 1.7 times as wide by the middle of the flight
        for (const hu of hulls) { hu.u.uSunCol.value.copy(hu.c).lerp(DL.sunTo, 0.6 * kw); hu.u.uPix.value = pix; }   // (uPix: far off, wings and fins stay a pixel and a half thick)
        hazeSunNow.copy(hazeSun0).lerp(DL.emberTo, 0.3 * kw);
        deckU.uPix.value = pix; deckU.uLitK.value = night ? 1 : lerp(0.85, 1.12, smoothstep(0, 0.6, u));
        // the early heavy and the head of its line
        const ea = earlyAt(u);
        early.position.set(EARLY.x + EARLY.hx * ea, EARLY.y, EARLY.z + EARLY.hz * ea); earlyBody.visible = ea > -2600 && ea < 1500;
        freshU.uHead.value = ea; freshU.uPix.value = pix * 0.85; freshU.uGain.value = hero.uniforms.uGain.value;
        fresh.renderOrder = camera.matrixWorld.elements[13] < EARLY.y ? 10.5 : 9.5;   // the line passes level with loop 7's lobes: from below it is drawn after the trail head (order 10), so it shows across the loop's arm
        if (earlyHullU) { earlyHullU.uTime.value = time + 5.1; earlyLampU.uTime.value = time; }
        // the westbound heavy and the head of its line
        const ahead = heavyAhead(u), hz = -(s + ahead);
        heavy.position.z = hz; heavy.visible = ahead < 7500 && ahead > -1200;
        trackU.uHeavyZ.value = hz - 34;
        if (heavyHullU) { heavyHullU.uTime.value = time + 3.3; heavyLampU.uTime.value = time; }   // lamps on the hero's clock: two white blinks per 1.2 s in all
        const cAhead = crossAhead(u), cz = -(s + cAhead);
        crosser.position.z = cz; crosser.visible = cAhead < 7500 && cAhead > -1200;
        trackU.uHeavyZ2.value = cz - 34;
        if (crossHullU) { crossHullU.uTime.value = time + 1.7; crossLampU.uTime.value = time; }
        // streaks of ice only at speed (the waves and the canyon)
        streaks.setOpacity(smoothstep(44, 68, speedAt(s)) * 0.7);
        // the portal: a pale star from the canyon on, easing down as its own glow takes over
        star.uniforms.uIntensity.value = smoothstep(1250, 1600, s) * lerp(0.2, 1.25, smoothstep(90, 620, 2400 - s));
        // rare: the sun's upper limb breaks the cloud horizon and the terminator runs in across the deck
        // the sun's upper limb at the cloud horizon, 40 degrees to the right: a sliver by u 0.6, a third of the disc by the portal.
        // RARE: it comes up further and faster with a green rim (uGreen), and the terminator runs right past us
        {
          const k = rare ? smoothstep(uRare0, uRare1, u) : 0, el = (lerp(-4.3, -3.52, kl) + 0.2 * smoothstep(0.64, 1, u) * kl + 0.42 * k) * DEG;
          limbDir.set(Math.sin(LIMB_AZ) * Math.cos(el), Math.sin(el), -Math.cos(LIMB_AZ) * Math.cos(el));
          skyxU.uLimb.value = kl * (0.7 + 0.3 * k);
          deckU.uTerm.value = night ? 1e9 : lerp(60000, 6500, smoothstep(0.5, 0.98, u) * (hourName === 'dawn' || rare ? 1 : 0.45)) - 15000 * k;
          glow += 0.1 * k;
        }
        skyxU.uGlow.value = glow;
        glitter.update(dt, time, camera); streaks.update(dt, time, camera); ring.update(dt, time, camera); star.update(dt, time, camera); meteors.update(dt, time, camera);
      },
      dispose() { sky.dispose(); hero.dispose(); lp.dispose(); },
    };
  },
};
