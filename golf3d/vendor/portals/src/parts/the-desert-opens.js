// KOKERBOOM KOPPIE AND THE TIDE OF FLOWERS: hero set piece for "The Desert Opens".
//
// What it is (hero-local space, origin at the foot-level centre of the koppie, +Y up, front toward +Z:
// the camera arrives from +Z flying toward -Z, so "right" is +X):
//   - Kokerboom Koppie: a granite koppie about 75 m in radius. Two summit tors of rounded, exfoliated
//     granite domes and stacked boulders (the taller tops out at 46 m) stand either side of a saddle
//     whose bare rock floor is at y = 24.4. All rock is dark varnished rust-brown so it reads as a
//     graphic shape against the bloom.
//   - Two 9 m quiver trees leaning 12 degrees toward each other at x = -11.5 / +11.5 on the saddle (the
//     portal gate; one carries a sociable-weaver haystack nest) and about 28 smaller quiver trees
//     (5 to 8 m) on the skirt and tor shoulders: forked gold trunks, powdery branches forking in twos,
//     domes of dark blue-green rosettes that tremble in the wind.
//   - The tide: the koppie skirt and an apron of plain 280 m in radius carry the flower field in three
//     tiers that share ONE species function and ONE opening function (GLSL below, exported as
//     hero.glsl so the world's own ground / treadmill tiers can agree with it):
//       far  - a ground-shader layer of hashed flower discs (orange daisy flats, white rain daisies
//              along a wash, magenta vygie cushions on the skirt and on heuweltjie discs, 15 percent
//              bare red gravel, quartz patches, granite slabs);
//       mid  - about 15,000 instanced heads (one quad each, thirteen petals and the dark eye drawn in
//              the fragment shader) along the approach and climb, leaning toward the sun;
//       near - about 520 real daisies, twice life size so each reads from a lens 2 m up (78 triangles: thirteen hinged
//              two-segment petals, eye cone, stem, four basal leaves and the head's own shadow on the ground) beside the fly
//              line from 80 to 179 m out; petals rotate from an 85 degree furled cone to flat, heads lean 60 percent toward
//              the sun and nod when shut.
//     Vygies are mats, not a wash and not a grid: two jittered layers on turned grids (lobed mats 2.4 to 3.4 m across in 4.8 m
//     cells, small cushions 0.4 to 1.1 m in 1.5 m cells) thinned by one low-frequency drift, so they crowd in patches with bare
//     slab and grit several metres wide between, wherever speciesAt().z says vygie ground (the koppie skirt, three mounds beside
//     it, heuweltjie discs on the plain). The ground shader paints each mat (lobed outline, bulged normal, dark contact rim, short
//     shadow, star heads with pale throats over grey-green leaf) and, beside the climb, an instanced mound per cell stands exactly
//     on its painted mat (same GLSL cell functions in its vertex shader).
//     The valley floor in front of the koppie (within about 100 m of z 138) is in full bloom in every season: orange, with one
//     band of rain daisies along the wash, an S-curve that crosses the fly line about 138 m out: ragged banks, a bed of red sand
//     in two braids, leaf drifts; uTongue lays one tongue of orange into it. daisyMix() gives the daisies' share of a point.
//     A ragged line of sunlight (the fog edge) travels along anchors.tideDir. Ahead of it everything is
//     in fog shade, shut and grey-green (buds keep a rose, mauve or dull-orange back so they still read); uTune.x metres
//     behind it every head opens, with a per-head hash.
//     The same line gates the sun on rock and trees, so the koppie lights up as the line climbs it.
//
// Progress hook (never wall-clock in the world):
//   hero.setProgress(p)  p 0..1 moves the light line from 330 m in front of the koppie centre (p = 0)
//                        to 90 m behind it (p = 1); it reaches the foot at p ~ 0.62, the saddle at 0.79.
//   hero.setFront(q)     the same in metres along tideDir from the origin (negative = not there yet).
//   Until one of them is called the piece runs a 16 s demo loop on `time` (for the part viewer only).
//   hero.setOpen(o)      0..1 global multiplier on opening (the sun-height rule of earlier days).
//   hero.setGrowth(g)    0..1 seedling -> bud -> full flower (default 1).
//   hero.setLight({ sunDir, sunColor, skyColor, groundColor })  explicit light, world space; any subset.
//                        Without it the piece follows the scene's first DirectionalLight and first
//                        HemisphereLight every frame (direction, colour x intensity), so a time-lapse
//                        sun just works. Tor shadows are analytic (sphere casters) and swing with it.
//   hero.heightAt(x, z)  ground height of koppie + apron in local space (smooth-max your terrain to it).
//   hero.glsl, hero.uniforms  the shared GLSL chunk (speciesAt, openAt, sunLine) and its uniforms. The world may also drive:
//     uTune (lag of the opening behind the line in m, depth of the blue shade beyond the line 0..1, gain of the sunlit strip),
//     uIsle + uIsleAx (a cloud-shadow island: centre xz, half-length, amount; travel axis, cross squeeze, lag of the shut zone),
//     uHol + uHolK (a long shallow hollow beside the plan line, white with rain daisies), uTongue, uTrack (a sandy game path),
//     uRefl + uBull (what is mirrored in the rain pan at dawn and in the puddles), uVeilM + uVeilC (the rain veils they mirror), uOrange (a second tongue of the orange flats),
//     uNite (night: the land pale and blue), uPlan + uRise + uW2 + uPan + uMound (the world's plan line and what lies along it: a
//     ridge, a second wash with pools, a rain pan that dries to cracked clay, a heuweltjie; featH(p) is their height),
//     uCloud (racing cloud shadows, which thin around the lens), uCb + uCbAx (one staged cloud shadow: centre xz, half-length,
//     amount; long axis, squeeze of the short axis), uCast (ten sphere casters), uFrac, uWet, uRain, uSkyRef.
//
// opts: palette [gravel red, daisy orange, cream white, vygie magenta, trunk gold, granite, grey-green]
//       season  'orange' (default) | 'white' | 'thin' | 'flax'      density 0.5..1.5 (flower cover)
//       tideDir [x, z] travel direction of the light line (default ahead and to the right)
//       apron   radius of the flowered plain around the koppie in metres (default 280, min 100)
//       progress initial setProgress value (switches the demo loop off)
//       fill    multiplier on the hemisphere fill inside the piece (default 1.5; shadows stay blue, not black)
//
// anchors (hero-local):
//   portalSeat  { position (0, 31, 0), facing, tilt 20 deg, radius 7 }: centre of the 14 m portal, its
//               lowest edge resting on the saddle rock, normal tilted 20 degrees up, facing +Z.
//   flyThrough  ordered points: level at 1.8 m over the near daisies, then the 20 degree climb, dead
//               straight for the last 80 m, ending at the portal centre. 4 to 8 m above the skirt,
//               at least 6 m from every rock and tree.
//   gateTrees   [left, right] base points of the two leaning trees;  nestTree: the nest position
//   torTops     [left, right] summit points (eagles circle these);   saddle: the saddle rock point
//   foot        where the skirt meets the plain on the approach;     nearField: centre of the 3D daisies
//   tideDir     Vector3, unit travel direction of the light line;    sunDir: the sun it was composed for
//   viewpoints  { reveal, foot, climb } camera points looking at `center`
//
// Size: radius 62 for framing (rock mass; the skirt reaches 88 m in x, 70 m in z, the apron opts.apron),
// height 56. Cost: about 146k triangles, 5 draw calls (ground, rock, trees, mid heads, near daisies),
// no lights, no textures, build about 300 ms. ctx.quality.detail thins the mid and near heads only. Lighting expected: a hard winter morning, key cream-white from over the left
// shoulder (-X, +Z) 30 to 38 degrees up at intensity ~3, cool blue hemisphere fill ~1; linear HDR,
// bloom threshold ~0.9 (only vygie glitter exceeds 1). All materials are custom ShaderMaterials that
// write linear colour and take scene fog.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#9C4A2E', '#F28A1C', '#F4EFE2', '#C2247E', '#D9A441', '#4A3328', '#7E9463'];
const NDOME = 12, NCAST = 10;
const SADDLE_Y = 24.4, PORTAL_Y = 31, SKIRT_R = 70, PITCH = 20 * Math.PI / 180;

// ------------------------------------------------------------------------------------------------
// Shared GLSL: hashes, value noise, the species map, the opening rule and the lighting model.
// All positions are HERO-LOCAL. Direct3D-safe: no textures, no pow of negatives, guarded divides.
const GLSL = /* glsl */`
#define NDOME ${NDOME}
#define NCAST ${NCAST}
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uCam;
uniform float uTime, uFront, uOpen, uGrowth, uApron, uFill;
uniform vec2 uTideDir;
uniform vec4 uSeed, uWash, uSeason;
uniform vec4 uDomes[NDOME];
uniform vec4 uCast[NCAST];
uniform vec4 uCloud, uIsle, uIsleAx, uCb, uCbAx;
uniform vec3 uTune;      // x: opening lag behind the light line (m), y: how deep and blue the shade beyond the line is, z: gain of the sunlit strip on the line
// a long shallow hollow of the flats beside the plan line: x..y = where it begins and ends along the plan (m), z = the lateral of its middle line, w = half its width to the rim
uniform vec4 uHol;
// x = its depth at the middle (m), y = how much of it the rain daisies fill
uniform vec2 uHolK;
// the sky as the world's dome draws it at this moment (standing water mirrors it; see skyMir): zenith, horizon, the true sun
// (under the horizon too), its glow, the rose arch, the cloud field (offset xy, threshold, amount), the cloud's lit and shaded colours,
// the wind the streets lie along, the night
uniform vec3 uZen, uHor, uSunD, uGlow, uCloudCol, uCloudSh;
uniform vec4 uBelt, uCloudP, uWind;
uniform float uNight;
// the bright band of open sky along the horizon under the fog lid: rgb = its colour, a = how much of the sky the lid holds
uniform vec4 uBand;
uniform vec4 uTongue;
uniform vec4 uArc;       // the world's fly line on the plain: an arc (centre xz, radius), w = 1 when set: vygie mats on the plain keep 9 m off it
uniform vec4 uTrack;     // a faint two-track beside the fly line: x = offset to the right (m), y..z = where it runs (local z), w = amount
uniform float uFrac, uWet, uRain;
uniform vec3 uSkyRef, uGlowRef;
uniform float uNite;     // 0..1 night: a long exposure under stars shows the land pale and blue, never black
uniform vec4 uPlan;      // the plan line of the world: x = angle of the arc's start, y = metres flown before the arc
uniform vec4 uRise;      // a low ridge the fly line climbs: x = where along the plan (m), y = half-length, z = height
uniform vec4 uW2;        // a second dry wash that the fly line follows for a while: it lies under the line from x to y (plan metres), swinging in from the left (z) and away to the right (w)
uniform vec4 uPan;       // a rain pan beside the line: x = along the plan, y = lateral, z = water left 0..1, w = amount
uniform vec4 uRefl[8];   // what standing water mirrors: spheres (centre, radius; radius 0 = none): 0 to 3 beside the rain pan, 4 to 7 beside the puddles of the arrival
uniform vec4 uVeilM;     // the rain veils as standing water mirrors them: xy = the bearing they hang on (unit, local xz), z = how much of them there is
uniform vec3 uVeilC;     // their lit colour
uniform vec4 uBull;      // the gemsbok that stands in the pan: xyz = where, w = heading (x 9000 = none)
uniform vec4 uOrange;    // a tongue of the orange flats laid over whatever else would grow there: centre xz, radius, amount
uniform vec4 uMound;     // a heuweltjie: centre xz, radius, height
uniform vec4 uSw[3];     // low swells across the plan line: x = where along the plan (m), y = half-length, z = height, w = 0 a roller across the line, 1 two knolls beside it
uniform float uBias;     // how far the open heads of the instanced tiers turn their faces to the lens (0 = not at all)
uniform vec4 uReal;      // the world's tier of real plants round the lens: x = amount, y = its reach (m): the painted heads thin under it
uniform vec3 uHeu[3];
uniform vec3 cGravel, cOrange, cWhite, cMagenta, cGold, cRock, cGreen;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .25 + vn(p * 4.11 + 3.3) * .125 + vn(p * 8.27 + 1.7) * .0625; }
// the sky along a ray d (unit, d.y >= 0), as the world's dome draws it at this moment: its gradient from horizon to zenith, the sun's
// glow, the rose arch opposite a sun on the horizon, the cloud streets with their lit and shaded sides, and by night a few stars.
// Standing water mirrors this.
vec3 skyMir(vec3 d){
  float elc = max(d.y, 0.);
  vec3 col = mix(uHor, uZen, pow(elc + 1e-4, .42));
  float sd = max(dot(d, uSunD), 0.), s2 = sd * sd, s8 = s2 * s2; s8 *= s8;
  vec2 dxz = d.xz / max(length(d.xz), 1e-4), sxz = uSunD.xz / max(length(uSunD.xz), 1e-4);
  float azf = .5 + .5 * dot(dxz, sxz);
  col += uGlow * (s2 * .1 + s8 * .22) + uGlow * exp(-elc * 8.) * azf * azf * .62;
  float anti = .5 - .5 * dot(dxz, sxz); anti *= anti;
  float bb = (elc - .11) / .08; col += uBelt.rgb * uBelt.a * anti * exp(-bb * bb);
  vec2 cp = d.xz / (elc + .06);
  vec2 cc = vec2(dot(cp, uWind.xy) * .42, dot(cp, vec2(-uWind.y, uWind.x)) * 1.7) + uCloudP.xy;
  float n = fbm(cc);
  float cov = smoothstep(uCloudP.z, uCloudP.z + .16, n) * (1. - smoothstep(7., 14., length(cp))) * uCloudP.w * (1. - .9 * uNight);
  vec3 ccol = mix(uCloudSh, uCloudCol, .55 * (1. - smoothstep(uCloudP.z + .1, uCloudP.z + .42, n) * .6)) + uGlow * (s8 * .35 + azf * azf * exp(-elc * 5.) * .3);
  col = mix(col, ccol, cov);
  vec2 sq = vec2(atan(d.z, d.x + 1e-6) * 23., elc * 30.); vec2 sh = h22(floor(sq) + 13.);
  col += (vec3(.75, .85, 1.) * step(.8, sh.x) * (1. - smoothstep(.05, .22, length(fract(sq) - .25 - .5 * sh))) * 1.2 + vec3(.045, .06, .12) * (.4 + elc)) * uNight;
  return col;
}
// a game path: one sandy trail trodden by the gemsbok, wandering either side of the fly line (the world's path is the line x = 0
// for z < 180 and a 760 m arc beyond); trackC = where its middle runs at local z
float trackC(float z){ float a = max(z - 180., 0.); return uTrack.x - a * a / 1520. + (vn(vec2(z * .021, 7.3)) - .5) * 9. + (vn(vec2(z * .083, 2.1)) - .5) * 2.2; }
float trackAt(vec2 p){
  float d = abs(p.x - trackC(p.y)) + (vn(p * 1.9 + 4.) - .5) * .24;
  return uTrack.w * (1. - smoothstep(.2, .52, d)) * smoothstep(uTrack.y, uTrack.y + 16., p.y) * (1. - smoothstep(uTrack.z - 50., uTrack.z, p.y));
}
// plan coordinates of a ground point: x = metres along the world's plan line, y = metres to the right of it
vec2 planAL(vec2 p){ vec2 q = p - uArc.xy; return vec2(uPlan.y + uArc.z * (uPlan.x - atan(q.y, q.x + 1e-4)), length(q) - uArc.z); }
// the second wash: signed distance from its centre line, and where it exists (0..1)
float wash2D(vec2 al){ float b = max(uW2.x - al.x, 0.), c = max(al.x - uW2.y, 0.); return al.y - (c * c / uW2.w - b * b / uW2.z); }
float wash2Gate(vec2 p, vec2 al){ return uArc.w * smoothstep(566., 600., al.x) * (1. - smoothstep(752., 790., al.x)) * smoothstep(310., 345., length(p)); }
// pools left in its bed: long shallow ones every 46 m (1 inside)
float wash2Pool(vec2 p, vec2 al, float d){
  float q = (fract((al.x - 663.) / 46.) - .5) * 46.;
  return 1. - smoothstep(.72, 1., length(vec2(q / 15., d / 3.1)) + (vn(p * .45 + 3.) - .5) * .5);
}
// the rain pan: x = 1 inside its rim, y = distance from its middle in rim radii
vec2 panAt(vec2 p, vec2 al){
  float dn = length((al - uPan.xy) / vec2(11.5, 6.6)) + (vn(p * .21 + 6.) - .5) * .3 + (vn(p * .9 + 2.) - .5) * .08;
  return vec2((1. - smoothstep(.94, 1., dn)) * uPan.w, dn);
}
// low swells: rollers lying across the plan line (their crests bend a little), or a pair of knolls either side of it
float swellH(vec2 al){
  float h = 0., ly = abs(al.y);
  for (int i = 0; i < 3; i++) {
    float a = al.x + .28 * al.y + 5. * sin(al.y * .055 + float(i) * 2.1);
    float t = clamp(abs(a - uSw[i].x) / max(uSw[i].y, 1.), 0., 1.);
    float lat = mix(1. - .4 * smoothstep(50., 130., ly), .22 + .78 * smoothstep(3., 11., ly) * (1. - smoothstep(20., 38., ly)), uSw[i].w);
    h += uSw[i].z * (.5 + .5 * cos(3.14159265 * t)) * lat;
  }
  return h * (1. - smoothstep(120., 260., ly));
}
// the damp hollow: distance (m) of a plan point from its middle line
float holD(vec2 al){ return length(vec2(max(max(uHol.x - al.x, al.x - uHol.y), 0.), al.y - uHol.z)); }
// the ridge, the damp hollow, the heuweltjie and the swale of the second wash: what they add to the height of the plain
float featH(vec2 p){
  vec2 al = planAL(p);
  float lf = (1. - smoothstep(10., 48., -al.y)) * (1. - smoothstep(70., 150., al.y));
  float h = uRise.z * (1. - smoothstep(0., 1., abs(al.x - uRise.x) / uRise.y)) * lf * uArc.w;
  h -= uHolK.x * (1. - smoothstep(uHol.w * .3, uHol.w, holD(al))) * smoothstep(310., 345., length(p)) * uArc.w;
  h -= 1.05 * (1. - smoothstep(3.2, 8.5, abs(wash2D(al)))) * wash2Gate(p, al);
  h += uMound.w * (1. - smoothstep(0., 1., length(p - uMound.xy) / uMound.z));
  return h + swellH(al) * uArc.w;
}
// the dry wash: signed distance (m, perpendicular) from the centre line of its S-curve
float washD(vec2 p){
  float a = p.x * uWash.z + uWash.w, sl = uWash.y * uWash.z * cos(a);
  return (p.y - (uWash.x + uWash.y * sin(a))) * inversesqrt(1. + sl * sl);
}
// species weights at a ground point: x orange daisy, y white rain daisy (or blue flax), z magenta vygie, w cover 0..1;
// sand: 1 on the bare sandy bed of the wash
vec4 speciesAtW(vec2 p, out float sand){
  float n1 = vn(p * .013 + uSeed.xy), n2 = vn(p * .037 + uSeed.yx * 1.7), n3 = vn(p * .12 + 3.1), n4 = vn(p * .31 + 8.7);
  float e0 = length(p * vec2(.8, 1.)), e = e0 + (n2 - .5) * 26.;
  // bands follow the lie of the land: warped contour stripes round the koppie
  float st = sin((e0 * .05 + (n1 - .5) * 5.5 + (n2 - .5) * 1.5) * 6.2832);
  // the valley floor in front of the koppie holds the last water: every year it is in full bloom, orange, with one band of
  // rain daisies along the wash
  float pk = 1. - smoothstep(70., 104., length((p - vec2(0., 138.)) * vec2(.72, 1.)));
  // the band of rain daisies follows the wash. On the valley floor it swells and pinches along its length and its banks are ragged
  // at three scales, so tongues of the orange flats run into it; down its middle the bed itself is bare red sand, in two braids
  float wS = washD(p);
  float wd = abs(wS + (n2 - .5) * mix(16., 10., pk) + (n3 - .5) * 8. * pk) + (n4 - .5) * 4. * pk;
  float wHalf = mix(8. + uSeason.x, 6. + 7.5 * vn(p * .023 + uSeed.yx), pk);
  float white = 1. - smoothstep(wHalf, wHalf + mix(11. + uSeason.x, 2.4, pk), wd);
  // one tongue of the orange flats can be laid into the band (uTongue: centre xz, radius)
  white *= smoothstep(uTongue.z * .62, uTongue.z * 1.12, length(p - uTongue.xy) + (n3 - .5) * 5. + (n4 - .5) * 2.5);
  float bedw = mix(1.9, 2.2, pk);
  sand = 1. - smoothstep(bedw, bedw + 1.3, abs(wS + (n3 - .5) * 9. + (n4 - .5) * 3.));
  sand = max(sand, (1. - smoothstep(.8, 1.9, abs(wS - 4.5 + (vn(p * .061 + 12.) - .5) * 12. + (n4 - .5) * 2.))) * smoothstep(.35, .6, vn(p * .033 + 5.)));
  sand *= smoothstep(84., 100., e0);
  white = max(white, smoothstep(.63 - uSeason.x * .014, .73, n1 + (n4 - .5) * .14 + st * .03) * (1. - pk));
  // and they stand in drifts in the shallow hollows of the flats, where the rain lay longest (the slow part of the noise the
  // puddles gather in), 15 to 30 m across with ragged edges
  white = max(white, smoothstep(.63, .73, vn(p * .11 + uSeed.zw) * .36 + vn(p * .031 + uSeed.zw + 23.) * .64 + (n4 - .5) * .12) * .92 * (1. - pk));
  // the second wash, out on the plain: a bare sandy bed 7 m wide with rain daisies crowding both its banks
  vec2 al = planAL(p); float w2g = wash2Gate(p, al), w2 = wash2D(al);
  float w2w = (1. - smoothstep(8., 15., abs(w2) + (n2 - .5) * 9. + (n4 - .5) * 3.)) * w2g;
  float sand2 = (1. - smoothstep(3.1, 4.4, abs(w2 + (n3 - .5) * 3. + (n4 - .5) * 1.4))) * w2g;
  sand = max(sand, sand2); white = max(white, w2w);
  // vygies: the koppie skirt, the three old termite mounds beside it, and heuweltjies dotted over the plain (low discs 20 to 32 m across)
  float mag = (1. - smoothstep(60., 86., e)) * .86;
  for (int i = 0; i < 3; i++) { float d = length(p - uHeu[i].xy); mag = max(mag, (1. - smoothstep(uHeu[i].z * .75, uHeu[i].z * 1.1, d + (n3 - .5) * 5.)) * (1. - pk)); }
  vec2 hc = p / 85.; vec2 hi = floor(hc); vec2 hj = h22(hi + 61.7);
  float hr = (10. + 6. * hj.x) * step(h21(hi + 7.7), .5 + uSeason.z * .7);
  float hd = length(fract(hc) - .5 - (hj - .5) * .55) * 85. + (n3 - .5) * 5.;
  mag = max(mag, (1. - smoothstep(hr * .75, hr * 1.1 + 1e-3, hd)) * (1. - pk) * smoothstep(120., 150., e0)
    * mix(1., smoothstep(8., 18., abs(length(p - uArc.xy) - uArc.z) + (n3 - .5) * 6.), uArc.w));
  mag = clamp(mag, 0., 1.);
  // the damp hollow of the flats is white with them from rim to rim (a ragged rim)
  float drf = uHolK.y * (1. - pk) * (1. - smoothstep(uHol.w * .55, uHol.w, holD(al) + (n3 - .5) * 10. + (n4 - .5) * 5.));
  mag *= 1. - drf; white = max(white, drf);
  // a second tongue of the orange flats (uOrange: centre xz, radius, amount): neither rain daisies nor vygies grow in it
  float ton = uOrange.w * (1. - smoothstep(uOrange.z * .62, uOrange.z * 1.12, length(p - uOrange.xy) + (n3 - .5) * 5. + (n4 - .5) * 2.5));
  white *= 1. - ton; mag *= 1. - ton;
  white *= 1. - mag;
  // a white field is never a sheet: bare gravel gaps a few metres wide open in it (about a sixth of it)
  float gap = 1. - .94 * white * (1. - pk) * (1. - smoothstep(.31, .42, vn(p * .17 + 31.) * .62 + n4 * .38));
  float cover = max(smoothstep(.27, .41, n3 * .4 + n4 * .24 + n1 * .3 + st * .075 + .03 + pk * .09) * gap, drf * smoothstep(.2, .34, n4)) * mix(uSeason.y, max(uSeason.y, 1.08), pk);
  cover = max(cover, w2w * .92 * smoothstep(.2, .42, n4 * .6 + n3 * .4 + .12) * uSeason.y);
  // along the stretch the light line crosses (790 to 900 m along the plan) the flats beside the line are in flower, without bare gaps
  cover = max(cover, .86 * uSeason.y * uArc.w * (1. - smoothstep(16., 34., abs(al.y) + (n3 - .5) * 12.)) * smoothstep(735., 760., al.x) * (1. - smoothstep(896., 930., al.x)) * (.8 + .2 * n4));
  // and over the ridge (its crest and the slope beyond, down to the banks of the second wash) the bloom is unbroken beside the line
  cover = max(cover, .86 * uSeason.y * uArc.w * (1. - smoothstep(15., 32., abs(al.y) + (n3 - .5) * 12.)) * smoothstep(505., 532., al.x) * (1. - smoothstep(640., 668., al.x)) * (.8 + .2 * n4));
  cover *= 1. - .97 * sand;
  cover *= 1. - panAt(p, al).x;
  cover *= 1. - smoothstep(uApron * .82, uApron * .98, length(p));
  cover *= 1. - .92 * trackAt(p);
  return vec4((1. - white) * (1. - mag), white, mag, clamp(cover, 0., 1.));
}
vec4 speciesAt(vec2 p){ float sand; return speciesAtW(p, sand); }
// the daisies' share of a ground point: x orange, y white (they sum to 1), z 0, w their cover (vygie ground carries few)
vec4 daisyMix(vec4 sp){ float s = max(sp.x + sp.y, 1e-3); return vec4(sp.x / s, sp.y / s, 0., sp.w * (1. - sp.z)); }
// vygie mats. Two jittered layers on turned grids: big lobed mats (4.8 m cells, 1.2 to 1.7 m in radius) and small cushions
// (1.5 m cells, 0.2 to 0.56 m). Both thin out with one low-frequency drift, so they crowd together in patches, small ones round
// the big, with bare slab and grit several metres wide between the patches. xy = centre (local xz), z = radius (m), w = hash
vec2 cushGrid(vec2 p, float s){ return vec2(.8 * p.x + .6 * p.y, -.6 * p.x + .8 * p.y) / s; }
vec4 cushCell(vec2 ci, float s){
  float big = step(3., s);
  vec2 hh = h22(ci + 21.3 + big * 40.), h2 = h22(ci + 57.9 + big * 17.);
  float r = mix(.2 + .36 * hh.x * hh.x, 1.2 + .52 * hh.x, big);
  vec2 q = (ci + .5) * s + (h2 - .5) * 2. * max(s * .5 - r * mix(1.28, 1.42, big), 0.);
  return vec4(.8 * q.x - .6 * q.y, .6 * q.x + .8 * q.y, r, hh.y);
}
// the outline of a mat: its radius in the direction of v as a multiple of its nominal radius (lobed; big mats more so)
float cushLobe(vec4 cc, vec2 v){
  float a = atan(v.y, v.x + 1e-5), k = cc.w * 43., big = step(.8, cc.z);
  return 1. + (.17 * cos(2. * a + k) + .12 * cos(3. * a + k * 1.7) + .07 * cos(5. * a + k * 2.9)) * mix(.45, 1., big);
}
float cushDrift(vec2 p){ return vn(p * .075 + uSeed.zw * 1.3) * .6 + vn(p * .19 + 4.7) * .28 + vn(p * .47 + 9.) * .12; }
// x: share of the ground under small cushions, y: under big mats, for vygie strength k (0..1) and drift dr
// (along the climb to the portal they stand a little thicker, so the lens passes over whole mats)
float cushLane(vec2 p){ return (1. - smoothstep(4., 13., abs(p.x))) * smoothstep(4., 14., p.y) * (1. - smoothstep(92., 112., p.y)); }
vec2 cushShare(float k, float dr, float lane){ float o = .1 * lane; return min(k * (1. + .16 * lane), 1.) * vec2(smoothstep(.32 - o, .45 - o, dr), smoothstep(.38 - o, .48 - o, dr)); }
// bare granite at a mat's centre (the slab mask of the ground without its slope term): most mats keep off it, a few spill over
float slabC(vec2 p){
  float e = length(p * vec2(.8, 1.));
  float sl = smoothstep(.62, .67, vn(p * .07 + uSeed.xy * 3.) * .75 + vn(p * .31 + 9.) * .25 + .05) * (1. - smoothstep(55., 92., e));
  return max(sl, 1. - smoothstep(8., 10., length(p)));
}
// 1 where the cell holds a mat: vygie ground and cover at its centre, thinned by the drift
float cushHere(vec4 cc){
  vec4 s = speciesAt(cc.xy); float big = step(.8, cc.z), lane = cushLane(cc.xy); vec2 sh = cushShare(s.z * min(s.w * 1.6, 1.), cushDrift(cc.xy), lane);
  float rock = step(.5, slabC(cc.xy)) * step(mix(.14, .36, big) + .4 * lane, fract(cc.w * 5.31));
  return step(mix(fract(cc.w * 7.13), fract(cc.w * 3.37), big), mix(sh.x, sh.y, big)) * (1. - rock);
}
// one jittered layer of star heads: x = mask, y = pale throat
vec2 cushStars(vec2 hg, float fw, float o, float dens){
  vec2 hid = floor(hg); vec2 hh = h22(hid + 3.1); vec2 hf = fract(hg) - .5 - (hh - .5) * .2;
  float rr = length(hf), a = atan(hf.y, hf.x + 1e-5);
  float R = (.4 + .09 * hh.y) * mix(.45, 1., o);
  float star = R * (.74 + .26 * cos(a * 8. + hh.x * 6.));
  float m = (1. - smoothstep(star - fw * .7, star + fw * .7, rr)) * step(hh.x, dens);
  return vec2(m, m * (1. - smoothstep(R * .2, R * .4, rr)) * o);
}
// albedo of a mat at p (cd = distance from its centre in radii, o = opening): grey-green succulent leaf under star-shaped heads
// with a pale throat, thinning toward the rim where the leaf shows; fwp = pixel footprint in metres
vec3 cushAlb(vec2 p, vec4 cc, float cd, float o, float fwp){
  float big = step(.8, cc.z), hd = mix(5., 3.5, big), fw = fwp * hd;
  float dens = mix(.72, .97, fract(cc.w * 3.71)) * (1. - .45 * smoothstep(.55, 1., cd));
  vec2 s1 = cushStars(vec2(.6 * p.x - .8 * p.y, .8 * p.x + .6 * p.y) * hd, fw, o, dens);
  vec2 s2 = cushStars(vec2(.96 * p.x + .28 * p.y, -.28 * p.x + .96 * p.y) * hd * 1.13 + 4.7, fw * 1.13, o, dens * .92);
  float hm = max(s1.x, s2.x), th = max(s1.y, s2.y * (1. - s1.x));
  float tint = fract(cc.w * 7.31), hv = h21(floor(p * hd) + 1.7);
  vec3 face = mix(cMagenta, cMagenta * vec3(1.2, .6, 1.3) + vec3(.02, 0., .04), step(.7, tint) * .7);
  face = mix(face, cMagenta * vec3(1.2, 1.7, 1.25) + vec3(.1, .03, .08), step(tint, .17) * .6) * (.74 + .34 * hv);
  vec3 backc = mix(cMagenta * vec3(.5, .55, .62), vec3(.3, .3, .32), .4);
  vec3 hcol = mix(mix(backc, face, o), vec3(1., .86, .5), th);
  float lf = vn(p * 11.) * .6 + vn(p * 29. + 3.) * .4;
  vec3 leaf = mix(cGreen * vec3(.5, .6, .55), vec3(.19, .25, .2), .6) * (.55 + .6 * lf);
  vec3 nearC = mix(leaf, hcol, hm);
  vec3 farC = mix(mix(leaf, backc, .3 * dens), mix(leaf, face * .96, dens * .62), o);
  return mix(farC, nearC, 1. - smoothstep(.3, .95, fw)) * (1. - .3 * smoothstep(.66, 1., cd));
}
// polygonal jointing: distance to the nearest cell wall of a jittered grid
float joints(vec2 p){
  vec2 g = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 r = o + h22(g + o) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
vec3 graniteCol(float n){ return mix(cRock, cGravel, .1) * 2.2 * (.45 + .8 * n); }
float tideRag(vec2 p){ return (vn(p * .021 + uSeed.zw) - .5) * 26. + (vn(p * .13 + 5.) - .5) * 5.; }
// racing cloud shadow (0..1 shade) and the rare lone cloud island that shuts the flowers under it
// one staged cloud shadow: a long soft ellipse (uCb: centre, half-length, amount; uCbAx: long axis, squeeze of the short axis)
float cloudBand(vec2 p){ vec2 b = p - uCb.xy; float bd = length(vec2(dot(b, uCbAx.xy), dot(b, vec2(-uCbAx.y, uCbAx.x)) * uCbAx.z)) + (vn(p * .011 + 3.) - .5) * uCb.z * .3;
  return uCb.w * (1. - smoothstep(uCb.z * .5, uCb.z * 1.1 + 1e-3, bd)); }
// the racing shadows part around the lens (they thin to a quarter within 40 m of it), so the bloom under us is always in sun
float cloudCov(vec2 p){ vec2 q = p + uCloud.xy; float c = smoothstep(.47, .62, vn(q * .0038) * .68 + vn(q * .0105 + 4.) * .32) * uCloud.z;
  return max(c * mix(.25, 1., smoothstep(40., 140., length(p - uCam.xz))), cloudBand(p)); }
// the island is an ellipse: uIsle.z is its half-length along uIsleAx.xy (its direction of travel), uIsleAx.z squeezes the cross axis
float isleD(vec2 p, float shift){ vec2 q = p - uIsle.xy - uIsleAx.xy * shift;
  return length(vec2(dot(q, uIsleAx.xy), dot(q, vec2(-uIsleAx.y, uIsleAx.x)) * uIsleAx.z)) + (vn(p * .045 + 3.) - .5) * 9. + (vn(p * .19 + 9.) - .5) * 3.; }
float isleAt(vec2 p){ return uIsle.w * (1. - smoothstep(uIsle.z * .8, uIsle.z * 1.1, isleD(p, 0.))); }
// 1 where the light line has passed (sunlit), 0 still under the fog lid
float sunLine(vec2 p){ return smoothstep(-3.5, 3.5, uFront - dot(p, uTideDir) + tideRag(p)); }
// extra brightness in the 8 m just behind the line: the "line of sunlight"
float sunEdge(vec2 p){ float d = uFront - dot(p, uTideDir) + tideRag(p); return smoothstep(-3.5, 1.5, d) * (1. - smoothstep(2., 8.5, d)); }
// opening 0..1 of a head with hash h: 20 m behind the line, spread by the hash
float openAt(vec2 p, float h){ float d = uFront - dot(p, uTideDir) + tideRag(p) - uTune.x * (1. + .5 * h);
  // under the island heads shut a little way in from its leading edge and are still half open behind its trailing edge
  float isl = isleD(p, uIsleAx.w);
  return uOpen * smoothstep(0., 2.9 + uTune.x * .405, d) * (1. - uIsle.w * (1. - smoothstep(uIsle.z * .86 + h * 5., uIsle.z * 1.12 + 6. + h * 9., isl))); }
float domeShadow(vec3 p){
  float s = 1.;
  for (int i = 0; i < NDOME; i++) {
    vec3 c = uDomes[i].xyz - p; float r = uDomes[i].w; float t = dot(c, uSunDir);
    if (t > r * .55) { float d = length(c - uSunDir * t); s = min(s, smoothstep(r * .74, r * 1.05 + t * .035, d)); }
  }
  for (int i = 0; i < NCAST; i++) {
    vec3 c = uCast[i].xyz - p; float r = uCast[i].w; float t = dot(c, uSunDir);
    if (t > r * .55) { float d = length(c - uSunDir * t); s = min(s, mix(1., smoothstep(r * .7, r * 1.05 + t * .05, d), 1. - smoothstep(r * 9., r * 16., t))); }
  }
  s *= (1. - .82 * cloudCov(p.xz)) * (1. - .8 * isleAt(p.xz));
  return s;
}
// sh: extra shadow on the direct light (0 = fully shadowed); dmin: a floor on the diffuse term for rough ground,
// whose pebbles and seedlings stand up into a raking sun
vec3 shadeS(vec3 alb, vec3 N, vec3 P, float wrap, float sh, float dmin){
  // by starlight the eye (and a long exposure) loses the reds: everything turns pale and blue-grey, so red gravel never goes black
  alb = mix(alb, vec3(dot(alb, vec3(.42, .45, .13))) * vec3(.84, .96, 1.2) + .012, uNite * .62);
  float sl = sunLine(P.xz);
  float lit = sl * domeShadow(P) * sh * (1. + uTune.z * sunEdge(P.xz));
  float d = clamp((dot(N, uSunDir) + wrap) / (1. + wrap), 0., 1.);
  d = max(d, dmin * smoothstep(-.03, .12, uSunDir.y));
  vec3 hemi = mix(uGndCol, uSkyCol, N.y * .5 + .5) * uFill;
  // beyond the line the fog lid itself is the light: soft, dim and cool (a pearl light: colours keep their hue under it), and the
  // band of open sky along the horizon under the lid's far edge lays a pale warmth on whatever faces that band (it stands on the
  // sun's side: what is turned from it stays a dark shape)
  vec2 bxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  vec3 lid = hemi * mix(vec3(1.), vec3(.72, .76, .9), uTune.y) + vec3(.7, .76, .95) * dot(uSunCol, vec3(.3333)) * mix(.2, .19, uTune.y) * (.7 + .3 * N.y)
    + uBand.rgb * uBand.a * (.05 + .5 * (1. - abs(N.y)) * max(dot(N.xz, bxz), 0.));
  hemi = mix(lid, hemi, sl);
  // a cloud's shadow is blue-violet, never olive
  float cb = cloudBand(P.xz); float cs = max(isleAt(P.xz), max(.5 * cloudCov(P.xz), .9 * cb)) * sl;
  hemi *= mix(vec3(1.), vec3(.7, .82, 1.22), cs);
  vec3 c = alb * (uSunCol * d * lit + hemi) * .3183;
  // starlight: the whole sky is a lamp, so by night the land is pale and readable, never a dark mass under the stars
  c += alb * (vec3(.2, .27, .42) * (.5 + .5 * N.y) + vec3(.1, .13, .2)) * uNite;
  float lum = dot(c, vec3(.3, .5, .2));
  c = mix(c, lum * vec3(.78, .98, 1.75), .36 * cs);
  return mix(c, lum * vec3(.6, .95, 2.3) * 1.5, .5 * cb * sl);
}
vec3 shade(vec3 alb, vec3 N, vec3 P, float wrap){ return shadeS(alb, N, P, wrap, 1., 0.); }
// face and back colours of a head of species pick k (0..1) under weights sp
// sheets of yellow daisies (gousblom) lie across the orange flats, tens of metres wide; the valley floor at the koppie stays orange
float yellowAt(vec2 p){
  float pk = 1. - smoothstep(70., 104., length((p - vec2(0., 138.)) * vec2(.72, 1.)));
  return smoothstep(.54, .63, vn(p * .0125 + uSeed.wz * 1.9) * .6 + vn(p * .047 + 6.3) * .3 + vn(p * .19 + 1.1) * .1) * (1. - pk);
}
void headColours(vec4 sp, float k, float h, float yl, out vec3 face, out vec3 back){
  // (rain daisies are the palette's cream held well under white, each head its own tone, so a drift of them is single blossoms)
  vec3 wcol = mix(cWhite * vec3(.74, .725, .7) * (.84 + .24 * h), vec3(.16, .26, .78), uSeason.w);
  // shut heads keep a colour of their own (rose, pale mauve, dull orange) so a furled field never melts into the leaves
  if (k < sp.z) { face = cMagenta * (.74 + .4 * h); back = mix(cMagenta * vec3(.5, .55, .62), vec3(.38, .34, .42), .45) * (1.1 + .5 * h); }
  else if (k < sp.z + sp.y) { face = wcol; back = mix(vec3(.5, .36, .7), wcol * .5, .2) * (1.05 + .35 * h); }
  else { vec3 oc = mix(cOrange * vec3(1., .8, .7), vec3(.93, .62, .04), yl);
    face = mix(oc, oc * vec3(1.05, .62, .5), step(.86, h) * (1. - yl)) * (.9 + .25 * h); back = mix(oc * vec3(.66, .5, .4), vec3(.46, .33, .17), .3) * (1.1 + .5 * h); }
}
`;

const VERT_FOG = /* glsl */`
#include <common>
#include <fog_pars_vertex>
`;

function makeMat(U, vertexShader, fragmentShader, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: VERT_FOG + GLSL + vertexShader,
    fragmentShader: '#include <common>\n#include <fog_pars_fragment>\n' + GLSL + fragmentShader,
    fog: true, ...extra,
  });
}

// ------------------------------------------------------------------------------------------------
// Ground: gravel, quartz, slabs and the far tier of the flower field.
const GROUND_VERT = /* glsl */`
attribute float aOcc;
varying vec3 vP, vN; varying float vOcc;
void main(){
  vP = position; vN = normal; vOcc = aOcc;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const GROUND_FRAG = /* glsl */`
varying vec3 vP, vN; varying float vOcc;
// one jittered layer of flat heads: colour in rgb, coverage in a (no loops, no derivatives inside)
vec4 headLayer(vec2 p, vec2 g, float fw, vec4 sp, float cover, float facing, float grow, float near, float yl){
  vec2 id = floor(g), f = fract(g) - .5; vec2 hh = h22(id); float k = h21(id + 17.3);
  float pres = step(h21(id + 5.1), cover * .8 * uFrac);
  float o = openAt(p, hh.x);
  vec3 face, back; headColours(sp, k, hh.y, yl, face, back);
  // heads of several sizes (a few large, many small); each keeps inside its own cell, jittered as far as its size leaves room, so
  // no disc is ever cut by a cell wall and no lattice shows
  float R = min(mix(.17, .27, o) * (.5 + 1.15 * hh.y * hh.y) * grow * (1. + .16 * step(k, sp.y)), .44);
  vec2 c = f - (h22(id + 31.7) - .5) * 2. * max(.47 - R, 0.); float r = length(c);
  float m = (1. - smoothstep(R - fw * .7, R + fw * .7, r)) * pres;
  vec3 col = mix(back, face, o * facing) * (.82 + .36 * h21(id + 23.9));
  col *= mix(1., .8 + .2 * cos(atan(c.y, c.x + 1e-4) * 13. + hh.x * 6.), near * o);
  col = mix(col, vec3(.05, .025, .012), (1. - smoothstep(R * .22, R * .34, r)) * o * step(sp.z, k) * near * near * step(.3, hh.y));
  return vec4(col, m);
}
// a low shrub mat in one grid cell: x = its body, y = the shadow it throws along sd (unit, away from the sun), Ls radii long
vec2 bossie(vec2 bg, vec2 cell, vec2 sd, float Ls, float keep){
  vec2 bh = h22(cell + 3.7); vec2 v = bg - (cell + .5 + (bh - .5) * .6);
  float br = (.07 + .1 * bh.x) * step(.6, h21(cell + 9.1) + keep);
  float t = dot(v, sd), w = dot(v, vec2(-sd.y, sd.x)), L = br * Ls;
  float sh = (1. - smoothstep(br * .5, br * 1.05 + 1e-3, abs(w) + br * .4 * t / max(L, 1e-3))) * smoothstep(-br, 0., t) * (1. - smoothstep(L * .6, L + 1e-3, t)) * step(1e-4, br);
  return vec2(1. - smoothstep(br * .55, br + 1e-3, length(v) + (vn(bg * 13.) - .5) * .05), sh);
}
// paints one vygie mat (cc, presence cp) at p onto alb and N: lobed body, dark contact rim, a short shadow away from the sun.
// cres: how well the mat resolves at this distance (far away it melts into meanC by its share meanAmt)
void cushPaint(vec2 p, vec4 cc, float cp, float cres, float fwp, vec2 sdn, float Ls, vec3 meanC, float meanAmt, inout vec3 alb, inout vec3 N, inout float cshd, inout float glit){
  vec2 v = p - cc.xy; float big = step(.8, cc.z), R = cc.z * cushLobe(cc, v);
  float cd = length(v) / R + (vn(p * 5.3 + cc.w * 40.) - .5) * mix(.14, .07, big) + (vn(p * 1.7 + cc.w * 17.) - .5) * .1 * big;
  float co = openAt(cc.xy, cc.w);
  float body = (1. - smoothstep(.86, 1., cd)) * cp;
  float ring = smoothstep(.78, .98, cd) * (1. - smoothstep(1., mix(1.22, 1.09, big), cd)) * cp;
  vec2 sv = v - sdn * min(cc.z, .62) * min(.22 * Ls, .75);
  float sh = (1. - smoothstep(.8, 1.12, length(sv) / (cc.z * cushLobe(cc, sv)))) * cp * (1. - body);
  // away from the climb no mound stands on the mat: there it is a low flat thing with a faint rim, never a dark-edged pit
  float low = max(smoothstep(mix(10., 20., big), mix(12., 23., big), abs(cc.x)), max(1. - smoothstep(-3., 0., cc.y), smoothstep(94., 98., cc.y)));
  ring *= 1. - .75 * low; sh *= 1. - .7 * low;
  vec3 cAlb = cushAlb(p, cc, cd, co, fwp);
  vec3 albN = mix(alb * (1. - .55 * ring), cAlb, body);
  alb = mix(mix(alb, meanC, meanAmt), albN, cres);
  // a dome; a big mat is flat-topped with a rolled edge and a lumpy top
  float hz = sqrt(max(1. - cd * cd, 0.));
  vec3 Nd = normalize(vec3(v.x / R, hz * mix(1., 2.4, big) + .32, v.y / R) + vec3(vn(p * 2.3 + 5.) - .5, 0., vn(p * 2.3 + 9.) - .5) * .55 * big);
  N = normalize(mix(N, Nd, body * cres * .92));
  cshd = max(cshd * (1. - body * cres), sh * cres); glit = max(glit * (1. - body * cres), max(body * cres, meanAmt * (1. - cres)) * co);
}
// one layer of drop rings on standing water: cells of 1 / sc metres, each with one ring that widens and fades (fwp: metres of ground to a pixel)
float dropRing(vec2 p, float sc, float fwp, float t){
  vec2 rg = p * sc; vec2 rid = floor(rg); vec2 rh = h22(rid + 7.7); float rt = fract(t * (.7 + .5 * rh.x) + rh.y * 9.);
  float rr = length(fract(rg) - .5 - (rh - .5) * .5), w = max(.05, fwp * sc * 1.25);
  return (1. - smoothstep(0., w, abs(rr - rt * .42))) * (1. - rt) * (1. - smoothstep(.09, .26, fwp * sc));
}
void main(){
  vec3 N = normalize(vN); vec2 p = vP.xz;
  vec3 toCam = uCam - vP; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  vec2 g = mat2(.88, .48, -.48, .88) * p * 7.3; float fw = length(fwidth(g)); float near = 1. - smoothstep(.3, 1.0, fw);
  float fwp = length(fwidth(p)), cres = 1. - smoothstep(.22, .75, fwp / 1.5), cresB = 1. - smoothstep(.3, 1., fwp / 2.8);
  // red granite gravel, darker fines, quartz pebble patches
  float g1 = fbm(p * .55), g2 = fbm(p * .06 + 11.);
  vec3 alb = mix(cGravel, vec3(.4, .26, .17), .3 + .35 * g2) * mix(.5, .92, g1);
  alb = mix(alb, cGravel * vec3(.6, .56, .6), smoothstep(.45, .7, vn(p * .05 + 17.)) * .5);
  alb = mix(alb, vec3(dot(alb, vec3(.33))) * vec3(1.12, .96, .86), .24);
  alb *= mix(1., (.62 + .5 * vn(p * 23.)) * (.72 + .56 * vn(p * 67. + 3.)), near);
  float qz = smoothstep(.6, .72, vn(p * .085 + 40.));
  alb = mix(alb, cWhite * .56, qz * mix(.26, smoothstep(.55, .8, vn(p * 27.) * .6 + vn(p * 9.) * .4) * .8, near) * .7);
  // granite slabs on the skirt and the bare saddle rock
  float e = length(p * vec2(.8, 1.)); float slope = 1. - N.y;
  float sj = (vn(p * 2.3 + 4.) - .5) * .05;
  float slab = smoothstep(.62, .67, vn(p * .07 + uSeed.xy * 3.) * .75 + vn(p * .31 + 9.) * .25 + slope * .35 + sj) * (1. - smoothstep(55., 92., e));
  slab = max(slab, 1. - smoothstep(8., 10., length(p) + (vn(p * .4) - .5) * 4. + sj * 20.));
  float jd = joints(p * .21 + vec2(vn(p * .3), vn(p * .3 + 7.)) * .5);
  float crack = (1. - smoothstep(.0, .035, jd)) * .65;
  vec3 rockc = graniteCol(fbm(p * .5 + 3.) * .7 + vn(p * 6.) * .3) * (1. - crack) * (.85 + .3 * smoothstep(.0, .5, jd));
  rockc = mix(rockc, vec3(.5, .52, .36), smoothstep(.7, .78, vn(p * .9 + 30.)) * smoothstep(.5, .7, vn(p * 7.)) * .2);
  // the flower field
  float sand; vec4 sp = speciesAtW(p, sand); vec4 spd = daisyMix(sp); float cover = spd.w * (1. - slab);
  sand *= 1. - slab;
  float grow = smoothstep(.45, 1., uGrowth);
  alb = mix(alb, rockc, slab);
  // the game path: pale trodden sand, printed with cloven hooves
  float tk = trackAt(p) * (1. - slab);
  alb = mix(alb, mix(cGravel * 1.1, vec3(.74, .5, .33), .62) * (.72 + .3 * vn(p * 3.1) + .12 * vn(p * 17.)), tk * .9);
  vec2 hq = vec2((p.x - trackC(p.y)) * 3.4 + .5, p.y * 2.3); vec2 hid = floor(hq); vec2 hh2 = h22(hid + 4.2); vec2 hf = fract(hq) - .5 - (hh2 - .5) * .45;
  float hoof = (1. - smoothstep(.11, .2, length(hf * vec2(1.3, .8)))) * smoothstep(.015, .05, abs(hf.x)) * step(.3, hh2.x) * (1. - smoothstep(.2, .7, length(fwidth(hq))));
  alb *= 1. - .55 * hoof * tk;
  // the rain pan: where its water has gone, pale clay curling into polygons (dark and damp beside the water that is left)
  vec2 al = planAL(p); vec2 pan = panAt(p, al);
  float panW = pan.x * (1. - smoothstep(uPan.z - .07, uPan.z, pan.y));
  if (pan.x > .002) {
    float cj = joints(p * 1.7 + vec2(vn(p * .9), vn(p * .9 + 4.)) * .4);
    vec3 clay = vec3(.56, .4, .3) * (.72 + .3 * vn(p * 1.3 + 8.) + .1 * vn(p * 9.)) * (1. - .62 * (1. - smoothstep(.02, .09, cj))) * (.9 + .16 * smoothstep(.05, .4, cj));
    clay *= mix(.5, 1., smoothstep(uPan.z, uPan.z + .22, pan.y));
    alb = mix(alb, clay, pan.x * (1. - smoothstep(.1, .5, uWet) * .5));
  }
  // the bed of the wash: pale red river sand, combed into faint ripples by the last flood
  float wsd = washD(p);
  alb = mix(alb, mix(cGravel * 1.15, vec3(.7, .35, .19), .62) * (.74 + .2 * vn(p * 2.3 + 1.) + .1 * sin(wsd * 9. + vn(p * .8) * 9.) * near), sand * .9);
  // loose stones
  vec2 sg = p * 1.3; vec2 sid = floor(sg); vec2 sh = h22(sid + 1.9); vec2 sf = fract(sg) - .5 - (sh - .5) * .7;
  float sr = (.05 + .17 * sh.y * sh.y) * step(.35, h21(sid + 4.4));
  float stn = (1. - smoothstep(sr * .7, sr + 1e-3, length(sf * vec2(1., 1.3)))) * (1. - smoothstep(.3, 1., length(fwidth(sg))));
  alb = mix(alb, graniteCol(sh.x) * (.6 + .9 * smoothstep(-sr, sr, dot(sf, uSunDir.xz))), stn);
  // gravel: a dense layer of small pebbles (dark varnish, rust, quartz) so bare ground is never smooth up close
  vec2 pg = mat2(.8, .6, -.6, .8) * p * 5.3 + vec2(vn(p * 1.7), vn(p * 1.7 + 5.)) * .8; vec2 pid = floor(pg); vec2 ph = h22(pid + 2.3); vec2 pf = fract(pg) - .5 - (ph - .5) * .7;
  // (quartz patches: drifts a few metres across where the pebbles lie thicker and most of them are white)
  float qp = smoothstep(.58, .72, vn(p * .085 + 17.) * .68 + vn(p * .33 + 4.) * .32);
  float prr = (.06 + .17 * ph.x * ph.x) * step(.4 - .28 * qp, h21(pid + 8.8)); float pfw = length(fwidth(pg));
  float pm = (1. - smoothstep(prr * .7, prr + pfw, length(pf * vec2(1., 1.25)))) * (1. - smoothstep(.25, .8, pfw));
  vec3 pc = mix(mix(cRock * 1.3, cGravel * 1.25, step(.45, ph.y)), cWhite * .5, step(.93 - .5 * qp, ph.y));
  alb = mix(alb, pc * (.55 + .8 * smoothstep(-prr - 1e-3, prr + 1e-3, dot(pf, uSunDir.xz))), pm * .85 * (1. - slab) * (1. - .7 * sand));
  // micro relief so the light is never flat
  N = normalize(N + vec3(vn(p * 1.1 + 3.) - .5, 0., vn(p * 1.1 + 9.) - .5) * .32 + vec3(vn(p * 5.) - .5, 0., vn(p * 5. + 4.) - .5) * .18 * near);
  // the green haze: seedlings are a fresh spring green and come up in drifts, so red gravel and quartz still show between them;
  // near the lens the haze resolves into single seedlings and rosettes
  float young = 1. - smoothstep(.4, .85, uGrowth), sprout = smoothstep(.05, .4, uGrowth);
  vec3 gcol = mix(mix(cGreen, vec3(.14, .38, .06), .42), vec3(.15, .47, .06), .66 * young);
  float drift = smoothstep(.36, .6, vn(p * .23 + 2.) * .46 + vn(p * .061 + 9.) * .3 + vn(p * .95) * .24);
  float gAmt = cover * sprout * mix(1., drift, .8 * young) * (.68 + .3 * fbm(p * 1.7));
  vec2 sdg = mat2(.74, .67, -.67, .74) * p * 6.1; vec2 sdi = floor(sdg); vec2 sdh = h22(sdi + 6.6); float sfw = length(fwidth(sdg));
  float srr = (.12 + .22 * sdh.x) * mix(.7, 1.25, uGrowth), sdl = length(fract(sdg) - .5 - (sdh - .5) * .5);
  float tuft = (1. - smoothstep(srr - sfw * .7, srr + sfw * .7, sdl)) * step(h21(sdi + 3.3), gAmt * 1.25);
  float gA = mix(gAmt, mix(gAmt * .78, tuft, 1. - smoothstep(.3, 1., sfw)), young);
  // and, a pace apart, the rosettes that have got away: six blunt leaves round a darker heart
  vec2 rq = mat2(.6, .8, -.8, .6) * p * 2.6; vec2 rqi = floor(rq); vec2 rqh = h22(rqi + 9.4); float rfw = length(fwidth(rq));
  vec2 rqv = fract(rq) - .5 - (rqh - .5) * .5; float rql = length(rqv), rqr = (.2 + .18 * rqh.x) * mix(.55, 1.1, sprout);
  float rqs = rqr * (.72 + .28 * cos(atan(rqv.y, rqv.x + 1e-5) * 6. + rqh.y * 6.));
  float ros = (1. - smoothstep(rqs - rfw * .7, rqs + rfw * .7, rql)) * step(h21(rqi + 1.7), gAmt * 1.7) * young * (1. - smoothstep(.3, 1., rfw));
  gA = max(gA, ros);
  alb = mix(alb, gcol * mix(.5, .9, vn(p * 1.3 + 2.)) * (1. - .45 * young * smoothstep(srr * .1, srr * .9, sdl) * (1. - smoothstep(.3, 1., sfw))) * (1. - .4 * ros * (1. - smoothstep(0., rqr * .5, rql))), gA);
  // bossies: low grey-green shrub mats, each throwing a shadow that lengthens as the sun sinks (a clock hand)
  vec2 bgq = p / 2.6; float sxl = max(length(uSunDir.xz), 1e-3); vec2 sdn = -uSunDir.xz / sxl;
  float Ls = clamp(1.6 * sxl / max(uSunDir.y, .05), 1.2, 7.), keepB = .1 + (vn(p * .05 + 2.) - .5) * .5 - .3 * (1. - smoothstep(70., 104., length((p - vec2(0., 138.)) * vec2(.72, 1.))));
  vec2 b0 = bossie(bgq, floor(bgq), sdn, Ls, keepB), b1 = bossie(bgq, floor(bgq - sdn * .62), sdn, Ls, keepB);
  // (painted mats only beyond 16 to 30 m, where they melt into the haze: near the lens every bossie is a standing shrub)
  float bfar = smoothstep(16., 30., dist) * (1. - pan.x);
  float bos = b0.x * (1. - slab) * (1. - sand) * bfar, bsh = max(b0.y, b1.y) * (1. - slab) * (1. - sand) * (1. - bos) * bfar;
  vec2 bv = fract(bgq) - .5;
  alb = mix(alb, cGreen * vec3(.5, .6, .56) * (.45 + .6 * vn(p * 7.)) * (.55 + .8 * smoothstep(-.2, .2, dot(bv, -sdn) + (vn(p * 4.) - .5) * .2)), bos * .9);
  vec3 Hn = normalize(mix(vec3(0., 1., 0.), uSunDir, .6));
  float facing = mix(.5, 1., smoothstep(-.2, .6, dot(Hn, V)));
  // near: two rotated, jittered layers of individual heads (no visible lattice)
  vec2 gB = mat2(.62, -.78, .78, .62) * p * 8.9 + 3.7;
  // rain daisies stand in drifts: denser and thinner patches a few metres across, with leaf mats and bare grit between
  float wpat = smoothstep(.4, .6, vn(p * .83 + 4.) * .45 + vn(p * .29 + 7.) * .55);
  float lpat = smoothstep(.3, .58, vn(p * 1.9 + 3.) * .45 + vn(p * .61 + 8.) * .55);
  // near the lens the heads stand in clumps a pace or two across, with grit and leaf between them
  float clump = smoothstep(.3, .62, vn(p * 1.37 + 12.3) * .5 + vn(p * .47 + 5.9) * .5) * 1.25;
  float coverH = cover * mix(1., mix(.36, 1., wpat), spd.y) * mix(1., clump, .85 * near);
  float yl = yellowAt(p);
  vec4 L1 = headLayer(p, g, fw, spd, coverH, facing, grow, near, yl);
  vec4 L2 = headLayer(p, gB, fw * 1.37, spd, coverH, facing, grow, near, yl);
  // a third, coarser layer of bigger heads, so the nearest flowers are whole daisies with eyes and not dots
  vec2 gC = mat2(.34, .94, -.94, .34) * p * 4.3 + 9.1;
  vec4 L3 = headLayer(p, gC, fw * .59, spd, coverH * .6, facing, grow, near, yl);
  // under the world's real plants the painted heads thin out: there the flowers are the plants themselves
  float realK = uReal.x * (1. - smoothstep(uReal.y * .5, uReal.y, dist));
  L1.a *= 1. - .5 * realK; L2.a *= 1. - .5 * realK; L3.a *= 1. - .85 * realK;
  // far: the mean of the same heads. Orange daisies carpet the ground; rain daisies are cream heads over fresh green leaf
  float oA = openAt(p, .5);
  vec3 fo, bo, fw2, bw;
  headColours(vec4(1., 0., 0., 1.), .5, .4, yl, fo, bo); headColours(vec4(0., 1., 0., 1.), .5, .4, 0., fw2, bw);
  fo = mix(fo, cGold * 1.15, vn(p * .023 + 2.) * .4) * (.72 + .5 * vn(p * vec2(.05, .11) + 6.));
  vec3 leafC = mix(cGreen, vec3(.12, .36, .05), .6) * (.5 + .6 * vn(p * 1.3 + 2.));
  // under the rain daisies the leaf comes in fresh green mats and darker blue-green drifts
  vec3 leafD = mix(leafC, cGreen * vec3(.3, .48, .4), smoothstep(.42, .68, vn(p * .21 + 15.) * .6 + vn(p * .74 + 2.) * .4));
  float fvar = .8 + .4 * vn(p * 3.1 + 1.);
  vec3 oFar = mix(bo, fo, oA * facing) * fvar * mix(.8, 1.1, smoothstep(.3, .7, vn(p * .29 + 21.)));
  vec3 wFar = mix(mix(leafD, bw, mix(.3, .62, wpat)), mix(leafD * 1.15, fw2, mix(.05, .88, wpat)), oA * facing) * mix(1., fvar, .5);
  vec3 farCol = oFar * spd.x + wFar * spd.y;
  // (a shut field is still a field of heads: copper, mauve and rose backs over the leaf, three quarters of the cover of the open one)
  float farAmt = clamp(cover * mix(.68, .86, oA) * grow * uFrac * (.7 + .5 * vn(p * .9 + 4.)) * (.82 + .3 * vn(p * 4.3)), 0., 1.);
  // near the lens the single heads stand over their own leaves: an orange-green wash under the daisies, plain leaf under the rain daisies
  vec3 washC = mix(oFar, leafC, .3) * spd.x + leafD * (.8 + .4 * vn(p * 9. + 5.)) * spd.y;
  vec3 nearAlb = mix(alb, washC, farAmt * mix(.5, mix(.12, .92, lpat), spd.y) * (1. - bos));
  nearAlb = mix(nearAlb, L1.rgb, L1.a * (1. - bos)); nearAlb = mix(nearAlb, L2.rgb, L2.a * (1. - bos)); nearAlb = mix(nearAlb, L3.rgb, L3.a * (1. - bos));
  float hShare = mix(farAmt * mix(.8, mix(.4, 1., wpat), spd.y), max(max(L1.a, L2.a), L3.a), near) * (1. - bos) * oA * facing;
  alb = mix(mix(alb, farCol, farAmt * (1. - bos)), nearAlb, near);
  // vygie mats: lobed mats and small cushions, each with a dark contact rim, its own lit and shaded sides and a short shadow
  float cshd = 0., glit = 0.;
  if (sp.z > .004) {
    vec2 shr = cushShare(sp.z * min(sp.w * 1.6, 1.), cushDrift(p), cushLane(p)) * (1. - .7 * slab) * grow;
    // far away the mats melt into a mottled, patchy wash that still leaves grit showing
    vec3 meanC = mix(mix(cGreen * .5, cMagenta * vec3(.5, .55, .62), .35), cMagenta * .9, .62 * oA) * (.75 + .5 * vn(p * .43 + 1.3));
    vec4 cs = cushCell(floor(cushGrid(p, 1.5)), 1.5), cb = cushCell(floor(cushGrid(p, 4.8)), 4.8);
    cushPaint(p, cs, cushHere(cs) * grow, cres, fwp, sdn, Ls, meanC, shr.x * .137, alb, N, cshd, glit);
    cushPaint(p, cb, cushHere(cb) * grow, cresB, fwp, sdn, Ls, meanC, shr.y * .24, alb, N, cshd, glit);
  }
  alb *= mix(.38, 1., vOcc);
  // rain: wet gravel goes dark and saturated, drying in patches
  // (the quartz patches and the white pebbles stay pale in it)
  float wetk = uWet * smoothstep(.15, .75, uWet + vn(p * .16 + 9.) * .5 - .1);
  alb *= mix(vec3(1.), vec3(.46, .27, .225), wetk * (1. - .78 * max(qz, qp)));
  vec3 col = shadeS(alb, N, vP, .12, (1. - .82 * bsh) * (1. - .8 * cshd), .45 * (1. - glit));
  float lit = sunLine(p) * domeShadow(vP);
  // open heads lean to the sun, so a field in bloom is brighter than the ground it stands on
  vec3 HnO = normalize(mix(vec3(0., 1., 0.), uSunDir, .6 * oA));
  col += (fo * spd.x + fw2 * spd.y) * uSunCol * lit * max(dot(HnO, uSunDir) - max(dot(N, uSunDir), .45), 0.) * hShare * .3183 * (1. - .8 * bsh);
  // vygie heads glitter in the sun
  float tw = h21(floor(p * 34.) + floor(uTime * 5. + dot(V, vec3(31., 17., 23.))) * 7.3);
  col += mix(uSunCol, uSunCol * cMagenta * 2.5, .5) * lit * step(.9965, tw) * glit * mix(.25, 1., near) * .42;
  // puddles left by the rain: sky mirror with drop rings and a sun glint; they shrink as uWet falls
  // (and standing water that outlasts the rain: the pan, and the pools in the bed of the second wash)
  float w2 = wash2D(al); float poolRaw = wash2Pool(p, al, w2) * wash2Gate(p, al);
  float still = max(panW, smoothstep(.42, .6, poolRaw));
  col *= 1. - .42 * smoothstep(0., .42, poolRaw) * (1. - still);                      // damp sand round a pool
  if (uWet > .003 || still > .003) {
    float wk = smoothstep(.003, .03, uWet);
    float pn = vn(p * .11 + uSeed.zw) * .55 + vn(p * .34 + 2.) * .33 + vn(p * 1.3) * .12 - slope * 2.;
    // pe: how far a point lies inside a puddle's shore (0 at the water's edge, growing toward its middle); the shore itself
    // wanders a little with the grit
    float pe = pn - mix(.8, .575, uWet) + (vn(p * 2.9 + 6.) - .5) * .012;
    float pud = smoothstep(0., .045, pe) * (1. - slab) * wk;
    // the wet margin: for a pace round the water the gravel is soaked, darker than wet gravel and far darker than dry
    float marg = smoothstep(-.11, .0, pe + (vn(p * 1.3 + 4.) - .5) * .03) * (1. - slab) * wk;
    col *= 1. - .46 * marg;
    pud = max(pud, still);
    // how deep the water stands: a film at the shore, a hand deep in the middle
    float deep = max(smoothstep(0., .13, pe) * wk, still);
    // the rings of the last drops, while the rain falls, at two sizes (small quick ones and wide slow ones up to a metre across);
    // each is drawn no thinner than the ground it covers can show, and goes where it would be finer than that
    float ring = max(dropRing(p, 1.1, fwp, uTime), dropRing(p + 3.7, .45, fwp, uTime * .8)) * uRain;
    // the water's face: the wind's small ripples, and the slope of each ring
    vec3 Nw = normalize(vec3((vn(p * 3. + uTime * .6) - .5) * .05 + ring * .22, 1., (vn(p * 3. + 5. - uTime * .5) - .5) * .05 - ring * .16));
    float cv = clamp(dot(Nw, V), 0., 1.); float fr = 1. - cv; fr = .16 + .84 * fr * fr * sqrt(fr);
    vec3 R = reflect(-V, Nw); float sg = clamp(dot(R, uSunDir), 0., 1.); float g2 = sg * sg; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2;
    // A puddle is water: it mirrors the sky that stands over it at this moment, by the ray the eye's line is thrown along (skyMir:
    // the dome's own gradient, glow, arch, cloud and stars). So the far puddles, seen low, hold the bright horizon (the lit rain
    // and the afterglow where they look toward them, the rose arch away from them) and the ones under the lens hold the deep of
    // the sky and show their bed; by night they are dark with a few stars in them.
    R.y = abs(R.y);
    vec3 skyR = skyMir(R);
    // the lit rain: the veils hang in the water as they hang in the sky (the same curtains, by the bearing and height of the mirrored ray)
    float azR = atan(R.z, R.x + 1e-6), cR = vn(vec2(azR * 6.5 + 2., 1.7 + uTime * .02));
    float veilR = smoothstep(.36, .66, cR) * smoothstep(.1, .7, dot(R.xz, uVeilM.xy) / max(length(R.xz), 1e-4)) * (1. - smoothstep(.03, .26 + .14 * cR, R.y)) * uVeilM.z;
    skyR = mix(skyR, uVeilC * (.7 + .5 * vn(vec2(azR * 95., uTime * 1.3 + cR * 3.))), veilR);
    // and the boulders that stand beside the water lie in it upside down, dark (uRefl)
    float dkR = 0.;
    for (int i = 0; i < 8; i++) {
      vec3 oc = vP - uRefl[i].xyz; float b = dot(oc, R), r2 = uRefl[i].w * uRefl[i].w;
      dkR = max(dkR, (1. - smoothstep(r2 * .78, r2 * 1.08 + 1e-3, dot(oc, oc) - b * b)) * step(b, 0.) * step(.01, uRefl[i].w));
    }
    vec3 rockM = cRock * (uSunCol * .2 + uSkyRef * .5) * (.8 + .4 * vn(p * .7 + R.xz * 9.));
    skyR = mix(skyR, rockM, dkR * .86);
    float frG = fr;
    // the rain pan: still, wide water, a full mirror at any hour: of the dawn sky at the first sun of day 2 (rose where it looks
    // out low under the arch and blue where it looks up), with the dark shapes of what stands beyond it (uRefl) and of the gemsbok
    // that stands in it (uBull) lying upside down in the water, and a bright rim along the shore that faces a low sun
    float pm = panW, rimK = 0.;
    if (pm > .002) {
      // (the pan's water is wide and shallow over silt, so it gives back less than a clear pool would: the sky of this moment by
      // the mirrored ray, a little dimmer than the sky itself)
      vec3 mir = skyR * .72;
      // the gemsbok: body, neck, head and four legs, in the animal's own frame
      float cb = cos(uBull.w), sb = sin(uBull.w);
      vec3 bo = vP - uBull.xyz; bo = vec3(bo.x * cb - bo.z * sb, bo.y, bo.x * sb + bo.z * cb) / 1.18;
      vec3 bd = vec3(R.x * cb - R.z * sb, R.y, R.x * sb + R.z * cb);
      float dkB = 0.;
      { vec3 oo = (bo - vec3(0., .98, -.08)) / vec3(.25, .3, .78), dd = bd / vec3(.25, .3, .78); vec3 q = oo + dd * max(-dot(oo, dd) / max(dot(dd, dd), 1e-5), 0.); dkB = max(dkB, 1. - smoothstep(.7, 1.15, dot(q, q))); }
      { vec3 oo = (bo - vec3(0., 1.27, .6)) / vec3(.13, .3, .2), dd = bd / vec3(.13, .3, .2); vec3 q = oo + dd * max(-dot(oo, dd) / max(dot(dd, dd), 1e-5), 0.); dkB = max(dkB, 1. - smoothstep(.7, 1.15, dot(q, q))); }
      { vec3 oo = (bo - vec3(0., 1.5, .93)) / vec3(.09, .1, .21), dd = bd / vec3(.09, .1, .21); vec3 q = oo + dd * max(-dot(oo, dd) / max(dot(dd, dd), 1e-5), 0.); dkB = max(dkB, 1. - smoothstep(.7, 1.15, dot(q, q))); }
      float dh2 = max(dot(bd.xz, bd.xz), 1e-5);
      for (int i = 0; i < 4; i++) {
        vec2 lo = bo.xz - vec2(i < 2 ? -.127 : .127, (i == 0 || i == 2) ? .41 : -.55); float tl = -dot(lo, bd.xz) / dh2;
        dkB = max(dkB, (1. - smoothstep(.045, .1, length(lo + bd.xz * tl))) * step(0., tl) * step(bo.y + bd.y * tl, .9));
      }
      mir = mix(mir, vec3(.05, .045, .05) + mir * .1, dkB * .9);
      skyR = mix(skyR, mir, pm); fr = mix(fr, max(fr, .9), pm);
      vec2 sdz = uSunDir.xz / max(length(uSunDir.xz), 1e-3); vec2 pal = (al - uPan.xy) / vec2(11.5, 6.6);
      // (the shore that faces the sun: the outward normal of the pan's rim, taken in the plan's own frame and turned to the world's)
      vec2 qa = p - uArc.xy; qa /= max(length(qa), 1e-3); vec2 outw = normalize(vec2(-qa.y, qa.x) * -pal.x * 6.6 + qa * pal.y * 11.5 + vec2(1e-4, 0.));
      rimK = pm * smoothstep(uPan.z - .3, uPan.z - .05, pan.y) * smoothstep(-.1, .7, dot(outw, sdz)) * (1. - smoothstep(.02, .3, uSunDir.y)) * (1. - uNite);
    }
    // through the water its bed shows: the soaked gravel, darker the deeper the water stands over it, so a puddle seen from above
    // darkens toward its middle; over that lies the mirror, by the angle the eye's line meets the water at
    vec3 bed = col * mix(1., .34, deep) * mix(vec3(1.), vec3(.86, .9, 1.), deep);
    float mirK = mix(.68, .6, still) + .16 * vn(p * .21 + 5.) + .1 * vn(p * 1.9 + uTime * .3) + ring * .6;
    vec3 pcol = mix(bed, skyR * mirK, fr * mix(.6, .96, max(deep, pm))) + uSunCol * g2 * g2 * lit * (.12 + 1.3 * smoothstep(.55, .9, vn(p * 6. + vec2(uTime * 1.4, -uTime))));
    pcol += uSunCol * vec3(1., .8, .6) * rimK * (.16 + .7 * smoothstep(.45, .8, vn(p * 5. + vec2(uTime * 1.1, -uTime * .8)))) * lit;
    col = mix(col, pcol, pud);
    // (wet gravel between the pools: a broken sheen of the same sky, strongest where the eye's line is low: the gravel itself
    // stays dark red)
    float gl = vn(p * 1.7 + 3.) * .6 + vn(p * 5.1 + 8.) * .4;
    col += skyR * wetk * (1. - pud) * frG * (.05 + .2 * smoothstep(.5, .78, gl)) * (1. - dkR);
  }
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------
// Granite: displaced, faceted, exfoliated icospheres merged into one mesh.
const ROCK_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vP, vN, vC;
void main(){
  vP = position; vN = normal; vC = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
varying vec3 vP, vN, vC;
void main(){
  vec3 N = normalize(vN);
  vec3 an = abs(N); an = an * an; an /= max(an.x + an.y + an.z, 1e-4);
  // triplanar value noise: varnish mottling, crystals, hairline joints
  float nA = fbm(vP.zy * .8) * an.x + fbm(vP.xz * .8 + 5.) * an.y + fbm(vP.xy * .8 + 9.) * an.z;
  float nB = vn(vP.zy * 4.5) * an.x + vn(vP.xz * 4.5) * an.y + vn(vP.xy * 4.5) * an.z;
  float jt = vn(vec2(vP.y * .9 + vn(vP.xz * .15) * 3., 3.7)) ;
  float joint = (1. - smoothstep(.0, .04, abs(jt - .5))) * (1. - an.y);
  // within 30 m of the lens: crystal grain at two scales and thin flaking edges (the stacks the lens passes at 8 to 15 m)
  float nearK = 1. - smoothstep(9., 32., length(uCam - vP));
  float nC = vn(vP.zy * 15.) * an.x + vn(vP.xz * 15. + 3.) * an.y + vn(vP.xy * 15. + 7.) * an.z;
  float nD = vn(vP.zy * 47. + 1.) * an.x + vn(vP.xz * 47.) * an.y + vn(vP.xy * 47. + 2.) * an.z;
  // bump: tilt the normal by the screen-space gradient of the mottling (derivatives taken here, outside any loop)
  float hgt = nA * .5 + nB * .12 + nC * .035 * nearK;
  vec3 dp1 = dFdx(vP), dp2 = dFdy(vP); float dh1 = dFdx(hgt), dh2 = dFdy(hgt);
  vec3 r1 = cross(dp2, N), r2 = cross(N, dp1); float det = dot(dp1, r1);
  vec3 Nb = abs(det) * N - sign(det) * (dh1 * r1 + dh2 * r2) * .8 + N * 1e-6;
  N = normalize(mix(N, Nb / max(length(Nb), 1e-6), .8));
  vec3 alb = mix(vC, cRock * 1.6, .3) * (.4 + .66 * nA) * (.8 + .3 * nB) * .9;
  alb = mix(alb, vC * .2, joint * .6);
  alb *= mix(1., (.74 + .5 * nC) * (.8 + .4 * nD), nearK);
  alb *= 1. - .3 * nearK * (1. - smoothstep(.0, .05, abs(fract(nA * 4.3 + nB * .7) - .5)));
  // pale lichen and wind-blown grit on ledges
  float lich = smoothstep(.56, .88, vn(vP.xz * .7 + vP.y * .53 + 30.) + (nB - .5) * .3) * smoothstep(.35, .8, nA);
  alb = mix(alb, vec3(.27, .27, .2), lich * .2 * (1. - .85 * uWet));
  alb = mix(alb, cGravel * .8, smoothstep(.86, .97, N.y) * smoothstep(.45, .7, nA) * .55);
  // a low sun wraps round the boulders, so the terminator is soft and the sunward flanks glow
  float low = 1. - smoothstep(.08, .42, uSunDir.y);
  vec3 col = shade(alb, N, vP, .16 * low);
  // a little sky sheen on the varnish; much more while the rock is still wet from the rain (it mirrors the lit sky)
  vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  float f1 = 1. - clamp(dot(N, V), 0., 1.), fr = f1 * f1 * f1;
  col += uSkyCol * fr * .05;
  col += (uSkyRef + uGlowRef * .35) * (.012 + .15 * f1 * f1 * f1) * uWet * (.55 + .6 * nB) * (.5 + .5 * N.y + .25);
  // still wet after the rain: the sun glints off the varnish in streaks where the water runs
  float wk = sqrt(max(uWet, 0.)); vec3 Rw = reflect(-V, N); float sg = max(dot(Rw, uSunDir), 0.); sg *= sg; sg *= sg; sg *= sg;
  col += uSunCol * (sg * sg * .5 + sg * .06) * wk * smoothstep(.35, .7, nA + (nB - .5) * .4) * sunLine(vP.xz) * domeShadow(vP);
  col += alb * uSunCol * f1 * f1 * smoothstep(-.2, .5, dot(N, uSunDir)) * uNite * 1.6;
  // the faces turned from a low sun are filled by the bright sky behind the lens, never a black cut-out
  col += alb * uSkyCol * (.5 + .5 * N.y) * low * .07;
  // out of the sun (dusk shadow, the fog lid, a tor's shade) granite keeps its colour: more of the sky's fill than the sums give
  col += alb * mix(uGndCol, uSkyCol, N.y * .5 + .5) * uFill * (1. - sunLine(vP.xz) * domeShadow(vP)) * .15;
  // light thrown up by the sunlit ground: the faces turned from the sun are warm brown, never a black cut-out
  col += alb * uSunCol * vec3(.36, .22, .1) * max(uSunDir.y, 0.) * (.62 - .38 * N.y) * .36 * sunLine(vP.xz) * (1. - .6 * uWet);
  // seen against the sun, the edges that face it catch a warm rim
  col += alb * uSunCol * (fr + .35 * f1 * f1 * low) * smoothstep(.1, .8, dot(-V, uSunDir)) * smoothstep(-.4, .3, dot(N, uSunDir)) * sunLine(vP.xz) * domeShadow(vP) * 3.4;
  // under the fog lid a rock is a dark shape, and the band of open sky along the horizon (on the sun's side) lays a pale rim on the
  // edges and shoulders turned to it
  vec2 bxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  col += (alb * 1.6 + .02) * uBand.rgb * uBand.a * (1. - sunLine(vP.xz)) * (fr * 1.6 + f1 * f1 * .2) * smoothstep(-.3, .5, dot(N, normalize(vec3(bxz.x, .4, bxz.y))));
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

// unit icosphere templates with shared vertices, by detail level
const _tpl = new Map();
function rockTemplate(detail) {
  if (_tpl.has(detail)) return _tpl.get(detail);
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const t = { pos: g.attributes.position.array.slice(), idx: Array.from(g.index.array) };
  g.dispose(); _tpl.set(detail, t); return t;
}

// the same template, made a step at a time: the sphere, then its welded copy
async function rockTemplateSteps(detail, ctx) {
  if (_tpl.has(detail)) return;
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  await ctx.yield();
  g = mergeVertices(g, 1e-4);
  await ctx.yield();
  _tpl.set(detail, { pos: g.attributes.position.array.slice(), idx: Array.from(g.index.array) });
  g.dispose();
  await ctx.yield();
}
// the same normals as computeVertexNormals (the face normals, weighted by area, summed at each corner), a slice of the faces at
// a time
async function normalsInSteps(g, ctx) {
  const P = g.attributes.position.array, I = g.index.array, N = new Float32Array(P.length);
  for (let f0 = 0; f0 < I.length; f0 += 60000) {
    const f1 = Math.min(I.length, f0 + 60000);
    for (let i = f0; i < f1; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2], vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      N[a] += nx; N[a + 1] += ny; N[a + 2] += nz; N[b] += nx; N[b + 1] += ny; N[b + 2] += nz; N[c] += nx; N[c + 1] += ny; N[c + 2] += nz;
    }
    await ctx.yield();
  }
  for (let v0 = 0; v0 < N.length; v0 += 120000) {
    const v1 = Math.min(N.length, v0 + 120000);
    for (let i = v0; i < v1; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
    await ctx.yield();
  }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
}
// The faces of a rock mesh that are never drawn, taken out of its index, a slice of the faces at a time. The rock's material
// draws the front of a face only. So a face is left out when its front is turned from every place the rock is ever looked at
// from (eyes: x, y, z, one after another): each of those places lies UNSEEN_BACK m or more behind the plane of the face.
// The faces that are left keep their order, and the points of the mesh, their colours and their normals (made from all the
// faces) stay as they are, so every face that is left is drawn exactly as it was. Returns the number of faces left out.
const UNSEEN_BACK = 0.25;
// (SEAT_SECTORS: into how many sectors of bearing, for each step of a rock's fineness (its detail and one more), makeProps cuts
// the rock to find its lowest ring; see A ROCK SET DOWN BY ITS OWN SHAPE)
const SEAT_SECTORS = 4;
async function dropUnseen(g, eyes, ctx) {
  const P = g.attributes.position.array, I = g.index.array, keep = [], nE = eyes.length;
  // (the eyes in runs of 32, each run with a ball that holds all its eyes: where the ball lies wholly behind the plane of a
  // face, none of its eyes is asked)
  const runs = [];
  for (let k0 = 0; k0 < nE; k0 += 96) {
    const k1 = Math.min(nE, k0 + 96), n = (k1 - k0) / 3; let cx = 0, cy = 0, cz = 0, r = 0;
    for (let k = k0; k < k1; k += 3) { cx += eyes[k] / n; cy += eyes[k + 1] / n; cz += eyes[k + 2] / n; }
    for (let k = k0; k < k1; k += 3) r = Math.max(r, Math.hypot(eyes[k] - cx, eyes[k + 1] - cy, eyes[k + 2] - cz));
    runs.push(k0, k1, cx, cy, cz, r);
  }
  await ctx.yield();
  let hint = 0;
  for (let f0 = 0; f0 < I.length; f0 += 4500) {
    const f1 = Math.min(I.length, f0 + 4500);
    for (let i = f0; i < f1; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz);
      let seen = !(nl > 0);
      if (!seen) {
        nx /= nl; ny /= nl; nz /= nl;
        // (the eye that saw the face before this one is asked first: neighbours mostly share it)
        const lim = nx * P[a] + ny * P[a + 1] + nz * P[a + 2] - UNSEEN_BACK;
        if (nx * eyes[hint] + ny * eyes[hint + 1] + nz * eyes[hint + 2] > lim) seen = true;
        else for (let q = 0; q < runs.length && !seen; q += 6) {
          if (nx * runs[q + 2] + ny * runs[q + 3] + nz * runs[q + 4] + runs[q + 5] <= lim) continue;
          for (let k = runs[q], k1 = runs[q + 1]; k < k1; k += 3) if (nx * eyes[k] + ny * eyes[k + 1] + nz * eyes[k + 2] > lim) { seen = true; hint = k; break; }
        }
      }
      if (seen) keep.push(I[i], I[i + 1], I[i + 2]);
    }
    await ctx.yield();
  }
  const left = (I.length - keep.length) / 3;
  g.setIndex(keep);
  return left;
}

// One rock: spec { x, y, z, r, sy (vertical stretch), detail, facets, tone }. Appends to the builder B.
function addRock(B, s, noise, rng, pal) {
  const t = rockTemplate(s.detail), n = t.pos.length / 3, base = B.pos.length / 3;
  const ox = rng.range(-50, 50), oy = rng.range(-50, 50), oz = rng.range(-50, 50);
  const planes = [];
  for (let i = 0; i < s.facets; i++) {
    const a = rng.range(0, Math.PI * 2), el = rng.range(-0.5, 0.9);
    planes.push([Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el), rng.range(0.72, 0.92)]);
  }
  // joints: clefts that split a dome into great blocks (vertical) and one sheeting joint (near level)
  const clefts = [];
  if (s.r > 6) {
    const nc = rng.int(2, 3);
    for (let i = 0; i < nc; i++) { const a = rng.range(0, Math.PI); clefts.push([Math.cos(a), rng.range(-0.15, 0.15), Math.sin(a), rng.range(-0.45, 0.45), 0.075, rng.range(0.07, 0.12)]); }
    clefts.push([rng.range(-0.15, 0.15), 1, rng.range(-0.15, 0.15), rng.range(-0.05, 0.4), 0.07, 0.08]);
  }
  const rot = rng.range(0, Math.PI * 2), cr = Math.cos(rot), sr = Math.sin(rot);
  const sx = s.sx ?? rng.range(0.85, 1.2), sz = s.sz ?? rng.range(0.85, 1.2), sheets = s.r > 6 ? rng.range(2.2, 3.4) : 0;
  const tone = s.tone ?? 1, c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const dx = t.pos[i * 3], dy = t.pos[i * 3 + 1], dz = t.pos[i * 3 + 2];
    const f1 = noise.fbm3(dx * 1.15 + ox, dy * 1.15 + oy, dz * 1.15 + oz, 3);
    const f2 = noise.n3(dx * 3.7 + oz, dy * 3.7 + ox, dz * 3.7 + oy);
    let rad = 1 + 0.15 * f1 + 0.04 * f2 + 0.05 * Math.abs(noise.n3(dx * 2.3 + oy, dy * 2.3 + oz, dz * 2.3 + ox));
    for (const q of clefts) { const d = (dx * q[0] + dy * q[1] + dz * q[2] - q[3]) / q[4]; rad *= 1 - q[5] * Math.exp(-d * d); }
    for (const p of planes) { const d = dx * p[0] + dy * p[1] + dz * p[2]; if (d > 0.001 && rad * d > p[3]) rad = p[3] / d; }
    // exfoliation sheets on the big domes: stepped onion-skin ledges
    if (sheets) { const q = (dy * 0.5 + 0.5) * sheets + f1 * 0.6; const st = q - Math.floor(q); rad *= 1 - 0.035 * Math.min(1, st * 6) * (1 - st); }
    const flat = dy < -0.35 ? 0.35 + 0.65 * Math.max(0, (dy + 1) / 0.65) : 1;      // squat base
    const lx = dx * rad * sx, lz = dz * rad * sz, ly = dy * rad * s.sy * (dy < 0 ? flat : 1);
    B.pos.push(s.x + (lx * cr - lz * sr) * s.r, s.y + ly * s.r, s.z + (lx * sr + lz * cr) * s.r);
    // colour: dark desert varnish, rustier on top, near-black water streaks, paler at the foot
    const streak = Math.max(0, noise.n2((Math.atan2(dz, dx) + rot) * 2.6 + ox, dy * 0.35 + oy)) * (1 - Math.abs(dy));
    const top = Math.max(0, dy);
    let v = (0.78 + 0.3 * f1 + 0.22 * top) * tone * (1 - 0.65 * streak);
    v *= 0.55 + 0.45 * Math.min(1, (dy + 1.05) * 1.4);                               // contact shade
    c.copy(pal.rock).lerp(pal.gravel, 0.07 + 0.1 * top + 0.05 * f2).multiplyScalar(v * 2.3);
    B.col.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < t.idx.length; i++) B.idx.push(base + t.idx[i]);
}

function finishGeo(B, extra = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  if (B.col) g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
  if (B.nor && B.nor.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  for (const k in extra) g.setAttribute(k, new THREE.Float32BufferAttribute(extra[k][0], extra[k][1]));
  if (B.idx) g.setIndex(B.idx);
  if (!B.nor || !B.nor.length) g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------
// Quiver trees (Aloidendron dichotomum): flared gold trunk, branches forking in twos, rosette dome.
const TREE_VERT = /* glsl */`
attribute vec3 color; attribute float aSway, aKind;
varying vec3 vP, vN, vC; varying float vKind;
void main(){
  vec3 P = position;
  // rosettes tremble (time-lapse wind), stiff wood barely moves
  float ph = dot(position.xz, vec2(1.7, 2.3));
  P += aSway * vec3(sin(uTime * 7.3 + ph), sin(uTime * 9.1 + ph * 1.3) * .5, cos(uTime * 6.1 + ph * .7)) * .05;
  vP = P; vN = normal; vC = color; vKind = aKind;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying float vKind;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  vec3 alb = vC; float wrap = .1; vec3 extra = vec3(0.);
  if (vKind < .5) {
    // bark: smooth gold skin splitting into razor-edged flakes with dark rims
    vec2 q = vec2(atan(N.z, N.x + 1e-4) * 2.2, vP.y * 1.6);
    float fl = vn(q * 2.1 + 3.), fl2 = vn(q * 6.3 + 11.);
    float rim = (1. - smoothstep(.0, .06, abs(fl - .5))) + (1. - smoothstep(.0, .05, abs(fl2 - .45))) * .5;
    alb *= .78 + .4 * fl2;
    alb = mix(alb, vC * vec3(.42, .34, .28), clamp(rim, 0., 1.) * .7);
    alb = mix(alb, vC * 1.25 + .06, smoothstep(.62, .7, fl) * .35);
  } else if (vKind < 1.5) {
    if (dot(N, V) < 0.) N = -N;
    wrap = .45;
    // sun through the fleshy blades
    extra = vC * uSunCol * sunLine(vP.xz) * domeShadow(vP) * clamp(-dot(N, uSunDir), 0., 1.) * .09;
  } else {
    // weaver haystack: straw streaks hanging down
    float st = vn(vec2(atan(N.z, N.x + 1e-4) * 9., vP.y * 1.2)) * .6 + vn(vP.xz * 7.) * .4;
    alb *= .55 + .8 * st; wrap = .35;
  }
  vec3 col = shade(alb, N, vP, wrap) + extra;
  // seen against the light (a low sun, or the glow of the night sky) trunk, branches and blades carry a rim
  float f1 = 1. - clamp(dot(N, V), 0., 1.);
  col += alb * uSunCol * f1 * f1 * smoothstep(.0, .7, dot(-V, uSunDir)) * smoothstep(-.4, .3, dot(N, uSunDir)) * sunLine(vP.xz) * domeShadow(vP) * mix(.9, 2.6, uNite);
  // (and under the fog lid, the pale rim of the band of open sky along the horizon)
  vec2 bxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  col += (alb + .015) * uBand.rgb * uBand.a * (1. - sunLine(vP.xz)) * f1 * f1 * .5 * smoothstep(-.3, .5, dot(N, normalize(vec3(bxz.x, .4, bxz.y))));
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// lofted tube through pts with radii; colours per ring; appends to tree builder T (tree-local)
function tube(T, pts, radii, sides, cols, kind = 0) {
  const base = T.pos.length / 3, n = pts.length;
  const u = new THREE.Vector3(), v = new THREE.Vector3(), tan = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    tan.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
    u.set(1, 0, 0); if (Math.abs(tan.x) > 0.9) u.set(0, 0, 1);
    u.addScaledVector(tan, -u.dot(tan)).normalize(); v.crossVectors(tan, u);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const nx = u.x * ca + v.x * sa, ny = u.y * ca + v.y * sa, nz = u.z * ca + v.z * sa;
      T.pos.push(pts[i].x + nx * radii[i], pts[i].y + ny * radii[i], pts[i].z + nz * radii[i]);
      T.nor.push(nx, ny, nz); T.col.push(cols[i].r, cols[i].g, cols[i].b); T.sway.push(0); T.kind.push(kind);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
    T.idx.push(a, c, b, b, c, d);
  }
}

// a rosette of sword leaves around axis dir at p, plus a dark core that gives the crown mass
function rosette(T, p, dir, size, nLeaves, hero, rng, leafCol, tipCol, wide) {
  const u = new THREE.Vector3(1, 0, 0); if (Math.abs(dir.x) > 0.9) u.set(0, 0, 1);
  u.addScaledVector(dir, -u.dot(dir)).normalize(); const v = new THREE.Vector3().crossVectors(dir, u);
  const push = (q, n, c, sw) => { T.pos.push(q.x, q.y, q.z); T.nor.push(n.x, n.y, n.z); T.col.push(c.r, c.g, c.b); T.sway.push(sw); T.kind.push(1); };
  // core: a squat octahedron
  let base = T.pos.length / 3; const cr = size * 0.5, cc = leafCol.clone().multiplyScalar(0.6);
  const cv = [[0, 1.3, 0], [1, 0.2, 0], [0, 0.2, 1], [-1, 0.2, 0], [0, 0.2, -1], [0, -0.7, 0]];
  for (const q of cv) { _a.copy(p).addScaledVector(u, q[0] * cr).addScaledVector(dir, q[1] * cr).addScaledVector(v, q[2] * cr); _b.copy(_a).sub(p).normalize(); push(_a, _b, cc, 0.2); }
  T.idx.push(base, base + 2, base + 1, base, base + 3, base + 2, base, base + 4, base + 3, base, base + 1, base + 4,
    base + 5, base + 1, base + 2, base + 5, base + 2, base + 3, base + 5, base + 3, base + 4, base + 5, base + 4, base + 1);
  const a0 = rng.range(0, 6.28), w = size * (hero ? 0.095 : wide ? 0.33 : 0.17);
  const L = new THREE.Vector3(), W = new THREE.Vector3(), Nn = new THREE.Vector3(), rad = new THREE.Vector3();
  for (let k = 0; k < nLeaves; k++) {
    const az = a0 + k * 2.39996, el = (0.22 + 1.45 * Math.pow((k + 0.5) / nLeaves, 0.8)) * rng.range(0.9, 1.1);
    rad.copy(u).multiplyScalar(Math.cos(az)).addScaledVector(v, Math.sin(az));
    L.copy(dir).multiplyScalar(Math.cos(el)).addScaledVector(rad, Math.sin(el));
    W.crossVectors(L, dir).normalize().multiplyScalar(w); Nn.crossVectors(W, L).normalize();
    const len = size * rng.range(0.8, 1.15), c0 = leafCol.clone().multiplyScalar(rng.range(0.75, 1.1));
    base = T.pos.length / 3;
    _a.copy(p).addScaledVector(L, len * 0.08);
    push(_b.copy(_a).add(W), Nn, c0, 0.1); push(_b.copy(_a).sub(W), Nn, c0, 0.1);
    if (hero) {
      // two segments: the blade arcs outward then lifts its tip
      _a.copy(p).addScaledVector(L, len * 0.55).addScaledVector(dir, -len * 0.05);
      push(_b.copy(_a).addScaledVector(W, 0.85), Nn, c0, 0.55); push(_b.copy(_a).addScaledVector(W, -0.85), Nn, c0, 0.55);
      _a.copy(p).addScaledVector(L, len).addScaledVector(dir, len * 0.06);
      push(_a, Nn, tipCol, 1);
      T.idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
    } else {
      _a.copy(p).addScaledVector(L, len);
      push(_a, Nn, tipCol, 1);
      T.idx.push(base, base + 1, base + 2);
    }
  }
}

// One tree, appended to builder B in hero-local space.
// o: { x, y, z, H, leanDir [x,z], lean (rad), levels, hero, nest, butter }
// butter: a butter tree (Tylecodon) instead: a fat yellow-green stem 1.5 m tall with a few stubby arms and tufts of bright winter leaf
function addQuiver(B, o, rng, pal, noise) {
  const T = { pos: [], nor: [], col: [], sway: [], kind: [], idx: [] };
  const H = o.H, hero = o.hero, butter = !!o.butter, sidesT = hero ? 10 : butter ? 7 : 6, sidesB = hero ? 6 : butter ? 5 : 4;
  const gold = (butter ? pal.gold.clone().lerp(pal.green, 0.38).multiplyScalar(1.1) : pal.gold.clone()).multiplyScalar(rng.range(0.82, 1.0));
  const powder = butter ? gold.clone().lerp(pal.white, 0.25) : pal.gold.clone().lerp(pal.white, 0.55).multiplyScalar(0.8);
  const leaf = (butter ? new THREE.Color('#4f8f2c') : pal.green.clone().lerp(new THREE.Color('#1d4a4c'), 0.62)).multiplyScalar(rng.range(0.85, 1.05));
  const tip = leaf.clone().lerp(pal.gold, 0.3).multiplyScalar(1.15);
  // trunk: flared foot, slight sinuous lean
  const rb = H * rng.range(0.066, 0.078) * (butter ? 2.5 : 1), hT = H * rng.range(0.38, 0.46) * (butter ? 1.15 : 1);
  const bx = rng.range(-0.04, 0.04) * H, bz = rng.range(-0.04, 0.04) * H;
  const tp = [0, 0.05, 0.28, 0.64, 1].map((t) => new THREE.Vector3(bx * t * t, hT * t, bz * t * t));
  tube(T, tp, [rb * 1.45, rb * 1.12, rb * 0.92, rb * 0.76, rb * 0.66], sidesT,
    [gold.clone().multiplyScalar(0.6), gold, gold, gold.clone().lerp(powder, 0.3), gold.clone().lerp(powder, 0.6)]);
  const tips = [];
  const grow = (p, dir, len, rad, level, axis) => {
    const end = p.clone().addScaledVector(dir, len), mid = p.clone().addScaledVector(dir, len * 0.5).addScaledVector(axis, len * rng.range(-0.05, 0.05));
    const c0 = gold.clone().lerp(powder, Math.min(1, 0.55 + level * 0.12));
    tube(T, [p, mid, end], [rad, rad * 0.86, rad * 0.74], sidesB, [c0, c0, c0.clone().multiplyScalar(0.92)]);
    if (level >= o.levels) { tips.push([end, dir.clone()]); return; }
    const ang = (0.64 - 0.04 * level) * rng.range(0.85, 1.15);
    // fork plane turns about a quarter turn each level
    const ax2 = axis.clone().applyAxisAngle(dir, Math.PI / 2 + rng.range(-0.5, 0.5)).normalize();
    for (const s of [-1, 1]) {
      const d2 = dir.clone().applyAxisAngle(ax2, s * ang * rng.range(0.85, 1.15)); d2.y += 0.14; d2.normalize();
      grow(end, d2, len * rng.range(0.7, 0.82), rad * 0.74, level + 1, ax2);
    }
  };
  const top = tp[tp.length - 1], ax0 = new THREE.Vector3(Math.cos(o.yaw ?? 0), 0, Math.sin(o.yaw ?? 0));
  for (const s of [-1, 1]) {
    const d0 = new THREE.Vector3(0, 1, 0).applyAxisAngle(ax0, s * rng.range(0.42, 0.56)).normalize();
    grow(top, d0, H * rng.range(0.15, 0.19), rb * 0.52, 1, ax0);
  }
  const rs = H * (hero ? 0.1 : butter ? 0.2 : 0.125);
  for (const [p, d] of tips) rosette(T, p, d, rs * rng.range(0.85, 1.15), hero ? 14 : butter ? 8 : 10, hero, rng, leaf, tip, butter);
  let nestPos = null;
  if (o.nest) {
    // sociable-weaver haystack wedged in the crown
    const t = rockTemplate(4), nb = T.pos.length / 3, R = H * 0.115, cy = hT + H * 0.2, straw = new THREE.Color('#c9ad72');
    for (let i = 0; i < t.pos.length / 3; i++) {
      const dx = t.pos[i * 3], dy = t.pos[i * 3 + 1], dz = t.pos[i * 3 + 2];
      const r = R * (1 + 0.22 * noise.n3(dx * 2 + 7, dy * 2, dz * 2 + 3) + 0.1 * noise.n3(dx * 7, dy * 3, dz * 7));
      T.pos.push(bx + dx * r * 1.3, cy + dy * r * (dy < 0 ? 1.0 + 0.25 * noise.n2(dx * 6, dz * 6) : 0.55), bz + dz * r * 1.15);
      T.nor.push(dx, dy, dz); const sh = 0.7 + 0.3 * dy;
      T.col.push(straw.r * sh, straw.g * sh, straw.b * sh); T.sway.push(0); T.kind.push(2);
    }
    for (const i of t.idx) T.idx.push(nb + i);
    nestPos = new THREE.Vector3(bx, cy - R * 0.6, bz);
  }
  // place: yaw is already in the fork axes; lean about the horizontal axis perpendicular to leanDir
  const m = new THREE.Matrix4();
  if (o.lean) { _a.set(o.leanDir[1], 0, -o.leanDir[0]).normalize(); m.makeRotationAxis(_a, o.lean); }
  m.setPosition(o.x, o.y, o.z);
  const nm = new THREE.Matrix3().setFromMatrix4(m), off = B.pos.length / 3;
  for (let i = 0; i < T.pos.length; i += 3) {
    _a.set(T.pos[i], T.pos[i + 1], T.pos[i + 2]).applyMatrix4(m); B.pos.push(_a.x, _a.y, _a.z);
    _a.set(T.nor[i], T.nor[i + 1], T.nor[i + 2]).applyMatrix3(nm); B.nor.push(_a.x, _a.y, _a.z);
  }
  for (let i = 0; i < T.col.length; i++) B.col.push(T.col[i]);
  for (let i = 0; i < T.sway.length; i++) { B.sway.push(T.sway[i] * H / 9); B.kind.push(T.kind[i]); }
  for (let i = 0; i < T.idx.length; i++) B.idx.push(off + T.idx[i]);
  return { nest: nestPos ? nestPos.applyMatrix4(m) : null, top: new THREE.Vector3(0, H, 0).applyMatrix4(m) };
}

// ------------------------------------------------------------------------------------------------
// Flower tiers. slabAt mirrors the bare-rock mask of the ground shader so heads never float on granite.
const SLAB_GLSL = /* glsl */`
float slabAt(vec2 p, float slope){
  float e = length(p * vec2(.8, 1.));
  float slab = smoothstep(.62, .67, vn(p * .07 + uSeed.xy * 3.) * .75 + vn(p * .31 + 9.) * .25 + slope * .35) * (1. - smoothstep(55., 92., e));
  return max(slab, 1. - smoothstep(8., 10., length(p) + (vn(p * .4) - .5) * 4.));
}
`;
// Mid tier: one quad per head, petals drawn in the fragment shader.
const MID_VERT = SLAB_GLSL + /* glsl */`
attribute vec3 iPos; attribute vec4 iRnd;
varying vec2 vUv; varying vec3 vP, vHn, vFace, vBack; varying float vOpen, vEye;
void main(){
  vec4 sp = daisyMix(speciesAt(iPos.xz));
  float pres = step(iRnd.x, sp.w * 1.05 * uFrac) * step(slabAt(iPos.xz, iRnd.w), .35);
  float o = openAt(iPos.xz, iRnd.y);
  float k = fract(iRnd.x * 7.31 + iRnd.y * 3.17);
  headColours(sp, k, iRnd.z, yellowAt(iPos.xz), vFace, vBack);
  vEye = step(sp.z, k); vOpen = o;
  float a0 = iRnd.z * 6.283;
  vec3 Hn = normalize(mix(vec3(0., 1., 0.), uSunDir, .6 * o) + vec3(cos(a0), 0., sin(a0)) * (1. - o) * .35
    + vec3(sin(uTime * 8. + a0 * 5.), 0., cos(uTime * 6.7 + a0 * 3.)) * .07);
  float dist = length(uCam - iPos);
  Hn = normalize(Hn + (uCam - iPos) / max(dist, 1e-3) * uBias * o);
  vec3 T = normalize(cross(vec3(.3, 0., 1.), Hn)); vec3 Bv = cross(Hn, T);
  float size = (.05 + .03 * iRnd.z) * pres * mix(.7, 1., o) * smoothstep(.45, 1., uGrowth);
  size *= (1. + dist * .02) * (1. - smoothstep(60., 90., dist));
  float hgt = (.15 + .17 * fract(iRnd.z * 5.3)) * uGrowth * mix(1., .5, 1. - vEye);
  vec3 P = iPos + vec3(0., hgt, 0.) + (Hn - vec3(0., 1., 0.)) * hgt * .4 + (T * position.x + Bv * position.y) * size;
  vUv = position.xy; vP = P; vHn = Hn;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const MID_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vP, vHn, vFace, vBack; varying float vOpen, vEye;
void main(){
  float r = length(vUv); float a = atan(vUv.y, vUv.x + 1e-5);
  float pm = abs(fract(a * 2.069) - .5) * 2.;                 // thirteen petals
  if (r > mix(1., .58, pm * pm * vOpen)) discard;
  vec3 N = normalize(vHn); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  float front = step(0., dot(N, V)); if (front < .5) N = -N;
  vec3 alb = mix(vBack, vFace, vOpen * mix(.55, 1., front)) * (.84 + .16 * cos(pm * 3.1416));
  alb = mix(alb, alb * 1.5 + .025, (1. - vOpen) * (1. - smoothstep(.15, .8, r)));          // a shut bud: a pale furled tip
  // dark ring and eye of the daisies, pale throat of the vygies
  // (the eyes fade with distance: far off a field of daisies is colour, not dots)
  float eye = (1. - smoothstep(.24, .31, r)) * vOpen * front * (1. - .85 * smoothstep(11., 30., length(uCam - vP)));
  alb = mix(alb, mix(vec3(1., .9, .55), vec3(.05, .024, .012), vEye), eye);
  alb = mix(alb, vFace * .45, (1. - smoothstep(.31, .42, r)) * (1. - eye) * vEye * vOpen * front * .7);
  float lit = sunLine(vP.xz) * domeShadow(vP);
  vec3 col = shade(alb, N, vP, .5) + alb * uSunCol * lit * .07
    + vFace * uSunCol * lit * (1. - front) * clamp(dot(normalize(vHn), uSunDir), 0., 1.) * .26 * vOpen;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

// Near tier: real daisies, drawn about twice life size so that each one reads from a lens 2 m up. Parts: 0 petals
// (position = petal angle, t along the petal, side), 1 eye, 2 stem (x, t, z), 3 its shadow on the ground, 4 basal leaves.
const NEAR_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iRnd; attribute float aPart;
varying vec3 vP, vN, vFace, vBack; varying float vPart, vOpen, vT; varying vec2 vQ;
void main(){
  vec4 sp = speciesAt(iPos.xz);
  float o = openAt(iPos.xz, iRnd.y);
  float k = fract(iRnd.x * 7.31 + iRnd.y * 3.17);
  // the near tier is daisies only: vygies stay in the cushions
  headColours(vec4(sp.x + sp.z, sp.y, 0., 1.), k * (sp.x + sp.y + sp.z), iRnd.z, yellowAt(iPos.xz), vFace, vBack);
  float grow = smoothstep(.45, 1., uGrowth);
  float sc = (.85 + .5 * iRnd.z) * 2.;
  float hgt = (.2 + .15 * iRnd.w) * uGrowth;
  float a0 = iRnd.x * 6.283;
  vec3 up = vec3(0., 1., 0.);
  vec3 wind = vec3(sin(uTime * 8. + a0 * 5.), 0., cos(uTime * 6.7 + a0 * 3.)) * .06;
  vec3 Hn = normalize(mix(up, uSunDir, .6 * o) + vec3(cos(a0), -.25, sin(a0)) * (1. - o) * .5 + wind);
  vec3 T = normalize(cross(vec3(.3, 0., 1.), Hn)); vec3 Bv = cross(Hn, T);
  vec3 head = iPos + up * hgt + (Hn - up) * hgt * .4;
  vec3 P; vec3 N; vQ = vec2(0.);
  if (aPart < .5) {
    float ang = position.x + a0, t = position.y, side = position.z;
    float jit = sin(position.x * 5. + a0 * 9.) * .08;
    float th1 = mix(1.47, -.08, o) + jit, th2 = th1 + mix(.1, -.32, o);
    float L = .036 * sc * mix(.75, 1., grow), r0 = .012 * sc;
    float s1 = min(t * 2., 1.), s2 = max(t * 2. - 1., 0.);
    float rad = r0 + (cos(th1) * s1 + cos(th2) * s2) * L * .5;
    float hh = (sin(th1) * s1 + sin(th2) * s2) * L * .5;
    float w = mix(.0052, .0086, s1) * (1. - s2 * .66) * sc * mix(.6, 1., o);
    vec2 d2 = vec2(cos(ang), sin(ang)); vec2 l2 = d2 * rad + vec2(-d2.y, d2.x) * side * w;
    P = head + T * l2.x + Bv * l2.y + Hn * (hh + .003 * sc);
    float th = mix(th1, th2, step(.5, t));
    N = (T * d2.x + Bv * d2.y) * (-sin(th)) + Hn * cos(th) + (T * -d2.y + Bv * d2.x) * side * .25;
    vQ = vec2(side, t);
  } else if (aPart < 1.5) {
    P = head + (T * position.x + Bv * position.z) * sc + Hn * position.y * sc;
    N = T * position.x + Bv * position.z + Hn * .012;
  } else if (aPart < 2.5) {
    float t = position.y;
    vec3 c = iPos + up * hgt * t + (Hn - up) * hgt * .4 * t * t;
    P = c + vec3(position.x, 0., position.z) * sc * .8;
    N = vec3(position.x, 0., position.z) * 200. + up * .1;
  } else if (aPart < 3.5) {
    // the head's own shadow: a soft disc on the ground, away from the sun, longer when the sun is low
    float hl = max(length(uSunDir.xz), 1e-3); vec2 sd = -uSunDir.xz / hl;
    float run = min(hgt * hl / max(uSunDir.y, .12), hgt * 4.);
    float rs = .05 * sc * mix(.5, 1., o) * smoothstep(.03, .14, uSunDir.y) * sunLine(iPos.xz);
    vec2 q = (head.xz + sd * run) + (sd * position.x * (1. + .25 * run / max(hgt, 1e-3)) + vec2(-sd.y, sd.x) * position.z) * rs;
    P = vec3(q.x, iPos.y + .025 + .04 * length(q - iPos.xz), q.y);
    N = up; vQ = position.xz;
  } else {
    // basal leaves: four grey-green straps arching out of the rosette
    float ang = position.x + a0 * 3., t = position.y, side = position.z;
    vec2 d2 = vec2(cos(ang), sin(ang));
    vec2 l2 = d2 * t * .075 * sc + vec2(-d2.y, d2.x) * side * .011 * sc;
    P = iPos + vec3(l2.x, (.012 + sin(t * 2.2) * .035 * sc) * uGrowth, l2.y);
    N = normalize(vec3(-d2.x * .5, 1., -d2.y * .5) + vec3(-d2.y, 0., d2.x) * side * .5);
  }
  vP = P; vN = N; vPart = aPart; vOpen = o; vT = position.y;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const NEAR_FRAG = /* glsl */`
varying vec3 vP, vN, vFace, vBack; varying float vPart, vOpen, vT; varying vec2 vQ;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)); vec3 N0 = N;
  float inner = step(0., dot(N, V)); if (inner < .5) N = -N;
  vec3 alb; float wrap = .5; float sunK = 1.;
  if (vPart < .5) {
    // upper face blazes, the underside is dull; a dark ring at the petal base and a faint crease down the middle
    // (seen from behind, an open head still shows its colour through the thin rays: paler and duller, never a dark sliver)
    alb = mix(vBack, vFace * 1.08 + .04, mix(.7 * vOpen, mix(.35, 1., vOpen), inner));
    alb = mix(alb, vFace * .3, (1. - smoothstep(.0, .3, vT)) * inner * .8);
    alb *= (.9 + .1 * vT) * (.86 + .14 * smoothstep(.0, .5, abs(vQ.x)));
  } else if (vPart < 1.5) { alb = vec3(.05, .024, .012); wrap = .2; }
  else if (vPart < 2.5) { alb = mix(cGreen, vec3(.16, .36, .08), .45) * mix(.35, .62, vT); }
  else if (vPart < 3.5) {
    if (dot(vQ, vQ) > 1.) discard;
    alb = mix(mix(vBack, vFace, .5), cGreen, .5) * (.5 + .3 * dot(vQ, vQ)); sunK = .16 + .3 * dot(vQ, vQ); N = vec3(0., 1., 0.); wrap = .12;
  } else { alb = mix(cGreen, vec3(.14, .34, .07), .5) * mix(.5, .85, vT); wrap = .3; }
  float lit = sunLine(vP.xz) * domeShadow(vP);
  vec3 col = shadeS(alb, N, vP, wrap, sunK, 0.) + alb * uSunCol * lit * .08 * step(vPart, .5)
    + vFace * uSunCol * lit * (1. - inner) * clamp(dot(N0, uSunDir), 0., 1.) * .42 * vOpen * step(vPart, .5)
    + vFace * uSunCol * lit * inner * clamp(-dot(N0, uSunDir), 0., 1.) * .3 * vOpen * step(vPart, .5);          // rays lit from behind glow
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

// Vygie cushions: a mound per mat cell (both layers) standing on its painted mat. iS = the pitch of its grid. A big mat is a
// cluster of humps half a metre high with a lobed, rolled edge; a small one a tight dome. The mound is painted all over with its
// heads: many-rayed stars with a pale throat over grey-green succulent leaf, drawn in two unstretched maps of its surface (the plan
// on top, round the flank where it is steep), so on the slope nothing is a stretched decal; a few flash back the sun. A few more
// heads stand up from it as single cards that turn part of the way to the lens. Far off the mound takes the mean colour of its heads.
const CUSH_AT = /* glsl */`
// the profile of a mound: height (in mound heights) at radius rad (0..1); the same broken line the mesh rings follow
float cushProf(float rad, float big){
  float ps = rad < .6 ? mix(1., .74, rad / .6) : mix(.74, -.12, (rad - .6) / .4);
  float pb = rad < .3 ? mix(1., .97, rad / .3) : rad < .58 ? mix(.97, .82, (rad - .3) / .28) : rad < .82 ? mix(.82, .5, (rad - .58) / .24) : mix(.5, -.3, (rad - .82) / .18);
  return mix(ps, pb, big);
}
float cushLump(vec2 off, vec4 cc, float big){ return mix(1. + (vn(off * 2.1 + cc.w * 50.) - .5) * .5, .5 + 1.05 * vn(off * 1.15 + cc.w * 50.), big); }
float cushPres(vec4 cc, float big){
  float pres = cushHere(cc) * smoothstep(.45, 1., uGrowth);
  // a small cushion swallowed by a big mat is not drawn (the mat is painted over it on the ground too)
  if (big < .5) { vec4 cb = cushCell(floor(cushGrid(cc.xy, 4.8)), 4.8); vec2 vb = cc.xy - cb.xy;
    pres *= 1. - cushHere(cb) * (1. - step(cb.z * cushLobe(cb, vb) + cc.z * .6, length(vb))); }
  return pres;
}
float cushHgt(vec4 cc, float big){ return mix(max(cc.z * .62, .17), .14 + cc.z * .33, big); }
vec3 cushFace(vec4 cc, float hv){
  float tint = fract(cc.w * 7.31);
  vec3 face = mix(cMagenta, cMagenta * vec3(1.2, .6, 1.3) + vec3(.02, 0., .04), step(.7, tint) * .7);
  return mix(face, cMagenta * vec3(1.2, 1.7, 1.25) + vec3(.1, .03, .08), step(tint, .17) * .6) * (.74 + .34 * hv);
}
`;
const CUSH_VERT = SLAB_GLSL + CUSH_AT + /* glsl */`
attribute vec2 iCell; attribute vec4 iH; attribute float iS;
varying vec3 vP; varying vec4 vCc; varying float vO, vUp; varying vec2 vOff;
void main(){
  vec4 cc = cushCell(iCell, iS); float big = step(3., iS);
  vec2 q0 = (iCell + .5) * iS; vec2 c0 = vec2(.8 * q0.x - .6 * q0.y, .6 * q0.x + .8 * q0.y);
  float pres = cushPres(cc, big);
  vec2 dir = position.xz;
  float r = cc.z * .95 * pres * cushLobe(cc, dir);
  vec2 off = cc.xy - c0 + dir * r;
  float hgt = cushHgt(cc, big) * pres;
  // (the skirt of the mound goes a hand's breadth into the ground, so no gap shows under it where the ground dips)
  vec3 P = vec3(c0.x + off.x, iH.x + dot(iH.yz, off) + position.y * hgt * mix(1., cushLump(off, cc, big), step(.1, position.y)) - .12 * step(position.y, 0.), c0.y + off.y);
  vP = P; vCc = cc; vO = openAt(cc.xy, cc.w); vUp = position.y; vOff = off;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const CUSH_FRAG = CUSH_AT + /* glsl */`
varying vec3 vP; varying vec4 vCc; varying float vO, vUp; varying vec2 vOff;
void main(){
  vec2 p = vP.xz; vec2 v = p - vCc.xy; float big = step(.8, vCc.z), R = max(vCc.z * cushLobe(vCc, v), 1e-3), cd = length(v) / R;
  float fwp = length(fwidth(vP));
  // the mound's own slope: the dome, and the humps of a big mat (from the lump function's gradient)
  float hz = sqrt(max(1. - cd * cd, 0.));
  float l0 = cushLump(vOff, vCc, big), lx = cushLump(vOff + vec2(.08, 0.), vCc, big), lz = cushLump(vOff + vec2(0., .08), vCc, big);
  vec3 N = normalize(vec3(v.x / R, hz * mix(1., 1.7, big) + .3, v.y / R) - vec3(lx - l0, 0., lz - l0) * 5. * big * smoothstep(.1, .5, vUp));
  // two maps of the surface, neither of them stretched: the plan on the top of the mound, and round its flank (the way round it,
  // the way up it) where it falls steeply. Every head is drawn in one of them, so it is a round star whichever way the surface faces
  float top = 1. - smoothstep(mix(.4, .6, big), mix(.66, .84, big), cd);
  vec2 uS = vec2(atan(v.y, v.x + 1e-5) * vCc.z * .9, vP.y * 1.15), uv = mix(uS, p, step(.5, top));
  float hd = mix(7.5, 6., big), fw = fwp * hd, dens = mix(.8, .98, fract(vCc.w * 3.71));
  vec2 t1 = cushStars(p * hd, fw, vO, dens), t2 = cushStars(vec2(.6 * p.x - .8 * p.y, .8 * p.x + .6 * p.y) * hd * 1.13 + 4.7, fw * 1.13, vO, dens * .94);
  vec2 f1 = cushStars(uS * hd, fw, vO, dens), f2 = cushStars(vec2(.6 * uS.x - .8 * uS.y, .8 * uS.x + .6 * uS.y) * hd * 1.13 + 4.7, fw * 1.13, vO, dens * .94);
  float hm = mix(max(f1.x, f2.x), max(t1.x, t2.x), top), th = mix(max(f1.y, f2.y * (1. - f1.x)), max(t1.y, t2.y * (1. - t1.x)), top);
  float hv = h21(floor(uv * hd) + 1.7);
  vec3 face = cushFace(vCc, hv), backc = mix(cMagenta * vec3(.5, .55, .62), vec3(.3, .3, .32), .4);
  // (each head: rays darker toward their tips and between them, a small pale throat)
  vec3 hcol = mix(mix(backc, face * (.8 + .3 * hm), vO), vec3(.95, .74, .42), th * .7);
  // succulent leaf between the heads: short grey-green fingers, dark between them
  float lf = vn(uv * 23.) * .55 + vn(uv * 57. + 3.) * .45;
  vec3 leaf = mix(cGreen * vec3(.52, .66, .58), vec3(.2, .3, .22), .5) * (.25 + 1.0 * smoothstep(.25, .8, lf));
  N = normalize(N + vec3(vn(uv * 41.) - .5, 0., vn(uv * 41. + 7.) - .5) * .5);
  vec3 nearC = mix(leaf, hcol, hm);
  vec3 farC = mix(mix(leaf, backc, .3 * dens), mix(leaf, face * .96, dens * .74), vO);
  vec3 alb = mix(nearC, farC, smoothstep(.3, .95, fw)) * mix(.5, 1., smoothstep(-.2, .3, vUp)) * (.78 + .22 * smoothstep(.2, .9, l0));
  vec3 col = shadeS(alb, N, vP, .25, 1., 0.);
  // the rays are satin: now one head, now another flashes back the sun
  float lit = sunLine(p) * domeShadow(vP); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  float tw = h21(floor(uv * hd) + floor(uTime * 5. + dot(V, vec3(31., 17., 23.))) * 7.3);
  col += mix(uSunCol, uSunCol * cMagenta * 2.5, .3) * lit * step(.965, tw) * hm * vO * (1. - smoothstep(.4, 1., fw)) * .4;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;
// the flowers of a cushion: one card each, placed by the same cell functions as its mound. iF = (where round the mound, how far out,
// size and tone)
const VYG_VERT = SLAB_GLSL + CUSH_AT + /* glsl */`
attribute vec2 iCell; attribute vec4 iH; attribute float iS; attribute vec3 iF;
varying vec3 vP, vN, vFace; varying vec2 vQ; varying float vO, vHs;
void main(){
  vec4 cc = cushCell(iCell, iS); float big = step(3., iS);
  vec2 q0 = (iCell + .5) * iS; vec2 c0 = vec2(.8 * q0.x - .6 * q0.y, .6 * q0.x + .8 * q0.y);
  float pres = cushPres(cc, big);
  float a = iF.x * 6.2832, rad = sqrt(iF.y) * .93; vec2 dir = vec2(cos(a), sin(a));
  float r = cc.z * .95 * pres * cushLobe(cc, dir) * rad;
  vec2 off = cc.xy - c0 + dir * r;
  float hgt = cushHgt(cc, big) * pres;
  float o = openAt(cc.xy, fract(cc.w + iF.z * .37));
  vec3 base = vec3(c0.x + off.x, iH.x + dot(iH.yz, off) + cushProf(rad, big) * hgt * cushLump(off, cc, big) + .015, c0.y + off.y);
  vec3 toC = uCam - base; float dc = length(toC);
  vec3 Nd = normalize(vec3(dir.x * rad * rad * 1.1, 1., dir.y * rad * rad * 1.1));
  vec3 Hn = normalize(Nd + vec3(0., .35, 0.) + toC / max(dc, 1e-3) * .7 * mix(.3, 1., o) + vec3(sin(uTime * 7. + iF.x * 40.), 0., cos(uTime * 6.1 + iF.z * 30.)) * .05);
  vec3 T = normalize(cross(vec3(.3, 0., 1.), Hn)); vec3 Bv = cross(Hn, T);
  // (thinned by the mat's own density, shut heads small; drawn a little larger with distance and gone by 45 m)
  float dens = mix(.72, .97, fract(cc.w * 3.71));
  float size = (.034 + .03 * iF.z) * mix(.45, 1., o) * step(fract(iF.z * 9.7 + iF.x * 3.1), dens) * step(1e-3, pres) * (1. + dc * .03) * (1. - smoothstep(30., 45., dc));
  vec3 P = base + Hn * .012 + (T * position.x + Bv * position.y) * size;
  vP = P; vN = Hn; vQ = position.xy; vO = o; vHs = iF.z; vFace = cushFace(cc, fract(iF.z * 5.3 + iF.y * 2.9));
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const VYG_FRAG = /* glsl */`
varying vec3 vP, vN, vFace; varying vec2 vQ; varying float vO, vHs;
void main(){
  float r = length(vQ), a = atan(vQ.y, vQ.x + 1e-5);
  // many narrow rays in two whorls; shut, a small pointed bud
  float pm = abs(fract(a * 3.5 + vHs * 7.) - .5) * 2.;
  if (r > mix(.55, mix(1., .7, pm * pm), vO)) discard;
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 backc = mix(cMagenta * vec3(.5, .55, .62), vec3(.3, .3, .32), .4);
  vec3 alb = mix(backc * (1.2 + .5 * (1. - r)), vFace * (.8 + .3 * cos(pm * 3.1416)) * (.72 + .4 * r), vO);
  // the pale throat and its ring of stamens
  alb = mix(alb, vec3(.95, .82, .5), (1. - smoothstep(.16, .3, r)) * vO);
  alb = mix(alb, vec3(.6, .4, .08), (1. - smoothstep(.05, .12, r)) * vO);
  float lit = sunLine(vP.xz) * domeShadow(vP);
  vec3 col = shade(alb, N, vP, .5) + alb * uSunCol * lit * .1;
  // the rays are satin: now one flower, now another flashes back the sun
  float tw = h21(floor(vP.xz * 9.) + floor(uTime * 5. + vHs * 13. + dot(V, vec3(31., 17., 23.))) * 7.3);
  col += mix(uSunCol, uSunCol * cMagenta * 2.5, .5) * lit * step(.93, tw) * vO * smoothstep(.2, .5, r) * (1. - smoothstep(.6, .95, r)) * .6;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}`;

function daisyGeometry() {
  const pos = [], part = [], idx = [];
  for (let p = 0; p < 13; p++) {
    const a = (p / 13) * Math.PI * 2, b = pos.length / 3;
    for (const t of [0, 0.5, 1]) for (const s of [-1, 1]) { pos.push(a, t, s); part.push(0); }
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4, b + 3, b + 5, b + 4);
  }
  let b = pos.length / 3; pos.push(0, 0.009, 0); part.push(1);
  for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; pos.push(Math.cos(a) * 0.0135, 0.003, Math.sin(a) * 0.0135); part.push(1); }
  for (let j = 0; j < 6; j++) idx.push(b, b + 1 + (j + 1) % 6, b + 1 + j);
  b = pos.length / 3;
  for (const t of [0, 1]) for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; pos.push(Math.cos(a) * 0.0045, t, Math.sin(a) * 0.0045); part.push(2); }
  for (let j = 0; j < 3; j++) { const j2 = (j + 1) % 3; idx.push(b + j, b + 3 + j, b + j2, b + j2, b + 3 + j, b + 3 + j2); }
  // shadow quad (drawn first would be nicer, but it lies on the ground under everything anyway)
  b = pos.length / 3;
  for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(q[0], 0, q[1]); part.push(3); }
  idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  // four basal leaves: base pair, mid pair, tip
  for (let l = 0; l < 4; l++) {
    const a = (l / 4) * Math.PI * 2 + 0.4; b = pos.length / 3;
    pos.push(a, 0.1, -0.6, a, 0.1, 0.6, a, 0.6, -1, a, 0.6, 1, a, 1, 0); for (let j = 0; j < 5; j++) part.push(4);
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4);
  }
  return { pos, part, idx };
}

// instanced flower mesh from base geometry arrays and per-instance arrays
function flowerMesh(base, iPos, iRnd, mat) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base.pos, 3));
  if (base.part) g.setAttribute('aPart', new THREE.Float32BufferAttribute(base.part, 1));
  g.setIndex(base.idx);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3));
  g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(new Float32Array(iRnd), 4));
  g.instanceCount = iPos.length / 3;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const pal = { gravel: P[0], orange: P[1], white: P[2], magenta: P[3], gold: P[4], rock: P[5], green: P[6] };
  const apron = Math.max(100, opts.apron ?? 280), density = clamp(opts.density ?? 1, 0.5, 1.5);
  const season = { orange: [0, 1, 0, 0], white: [9, 1, 0, 0], thin: [0, 0.74, 0.5, 0], flax: [3, 1, 0, 1] }[opts.season] || [0, 1, 0, 0];
  const group = new THREE.Group(); group.name = 'kokerboom-koppie';
  // opts.plain(x, z): the world's own plain height, added outside the skirt (the ground then no longer fades to 0 at the apron);
  // opts.field: radius of the flower cover (the world's plain carries the same ground shader beyond the apron)
  const plainFn = typeof opts.plain === 'function' ? opts.plain : null;

  // ---- per-seed layout
  const tallSide = rng.sign();                                  // which tor is the 46 m one
  const td = opts.tideDir ? new THREE.Vector2(opts.tideDir[0], opts.tideDir[1]) : new THREE.Vector2(rng.range(0.24, 0.42), -1);
  td.normalize();
  const wash = [rng.range(104, 128), rng.range(14, 26), rng.range(0.012, 0.02), rng.range(0, 6.28)];
  // the wash is an S-curve that crosses the fly line on a slant about 138 m out on every seed: it comes in from the near left, runs
  // away to the far right and swings back (the low pass then runs over orange toward one curving band of rain daisies)
  wash[1] = 24 + (wash[1] - 14) * 0.6; wash[2] = 0.026 + (wash[2] - 0.012) * 0.7; wash[3] = Math.PI + (wash[3] / 6.28 - 0.5) * 0.5; wash[0] = 138 - wash[1] * Math.sin(wash[3]);
  const heu = [];
  for (let i = 0; i < 3; i++) { const a = rng.range(0, Math.PI * 2), r = rng.range(112, Math.min(200, apron * 0.72)); heu.push(new THREE.Vector3(Math.sin(a) * r, Math.cos(a) * r, rng.range(11, 15))); }
  const tors = [-1, 1].map((s) => ({ s, x: s * rng.range(33, 35.5), z: rng.range(-3, 3), top: s === tallSide ? 39.5 : rng.range(33.5, 36.5), r: rng.range(13.2, 14.6), sy: rng.range(1.18, 1.34) }));
  const bumps = tors.map((t) => ({ x: t.x * 1.04, z: t.z, r: 21, h: rng.range(6, 8) }));
  const n1 = rng.range(0, 100), n2 = rng.range(0, 100);
  const sadBase = SADDLE_Y - bumps.reduce((a, b) => a + b.h * Math.exp(-(b.x * b.x + b.z * b.z) / (b.r * b.r)), 0);

  const SPUR = 4.4, flyY = (z) => PORTAL_Y - z * Math.tan(PITCH);
  const heightAt = (x, z) => {
    const e = Math.hypot(x * 0.8, z), t = clamp(e / SKIRT_R, 0, 1);
    let h = sadBase * (1 - t * t * (3 - 2 * t));
    for (const b of bumps) h += b.h * Math.exp(-((x - b.x) ** 2 + (z - b.z) ** 2) / (b.r * b.r));
    const cor = z > -25 ? sstep(7, 24, Math.abs(x)) : 1;
    // a low spur runs down from the saddle under the fly line: the ground is lifted to SPUR metres below the lens where the
    // skirt would fall further away (the vygie mats then pass close under the climb), easing out by 30 m to either side
    if (z > 8 && z < 84) { const lift = (flyY(z) - SPUR) * sstep(8, 22, z) * (1 - sstep(64, 84, z)) - h; if (lift > 0) h += lift * (1 - sstep(9, 30, Math.abs(x))) * sstep(8, 22, z) * (1 - sstep(64, 84, z)); }
    const sk = sstep(0.12, 0.4, t) * (1 - sstep(0.85, 1.25, e / SKIRT_R));
    h += noise.fbm2(x * 0.032 + n1, z * 0.032 + n2, 3) * 4.6 * sk * (0.1 + 0.9 * cor);
    const far = sstep(62, 140, e);
    if (plainFn) h += plainFn(x, z);
    else h += (noise.fbm2(x * 0.007 + n2, z * 0.007 + n1, 2) * 1.5 + 0.2) * far * (0.25 + 0.75 * cor);
    const wd = Math.abs(z - (wash[0] + wash[1] * Math.sin(x * wash[2] + wash[3])));
    h -= 0.8 * (1 - sstep(4, 12, wd)) * sstep(78, 100, e);
    return plainFn ? h : h * (1 - sstep(apron * 0.86, apron, Math.hypot(x, z)));
  };
  const slopeAt = (x, z) => { const hx = heightAt(x + 0.7, z) - heightAt(x - 0.7, z), hz = heightAt(x, z + 0.7) - heightAt(x, z - 0.7); return 1 - 1.4 / Math.hypot(hx, 1.4, hz); };
  // the fly line: level at 1.8 m, easing into a straight 20 degree climb to the portal centre
  const sC = Math.cos(PITCH), sS = Math.sin(PITCH);
  const fly = [[0, 0.8, 172], [0, 0.35, 150], [0, 0, 128], [0, 0.25, 110], [0, 0.8, 92]].map((p) => new THREE.Vector3(p[0], heightAt(0, p[2]) * 0.5 + 1.8 + p[1], p[2]));
  for (let s = 80; s >= 0; s -= 20) fly.push(new THREE.Vector3(0, PORTAL_Y - s * sS, s * sC));
  const inCorridor = (x, z, r) => z > -30 && Math.abs(x) < 7.2 + r * 1.25;

  // ---- rocks: specs first (the ground needs them for contact shade), geometry after
  const rocks = [], domes = [];
  const sit = (x, z, r, sy, sink) => heightAt(x, z) + r * sy * sink;
  for (const t of tors) {
    const main = { x: t.x, y: t.top - t.r * t.sy, z: t.z, r: t.r, sy: t.sy, sx: rng.range(0.95, 1.05), sz: rng.range(0.95, 1.08), detail: 9, facets: 5, tone: 1 };
    rocks.push(main); domes.push(main);
    const ns = rng.int(2, 3), a0 = rng.range(0, 6.28);
    for (let i = 0; i < ns; i++) {
      // supporting domes on the outer side, away from the saddle
      const a = a0 + (i / ns) * Math.PI * 1.3 - Math.PI * 0.65, d = t.r * rng.range(0.75, 1.0), r = rng.range(7.5, 10.5);
      const x = t.x + t.s * Math.abs(Math.cos(a)) * d + t.s * 2, z = t.z + Math.sin(a) * d * 1.25, sy = rng.range(0.85, 1.1);
      const sd = { x, y: sit(x, z, r, sy, 0.3), z, r, sy, sx: 1, sz: 1.05, detail: 9, facets: 4, tone: rng.range(0.9, 1.08) };
      rocks.push(sd); domes.push(sd);
    }
    // stacked boulders crowning and shouldering the tor
    const nb = rng.int(6, 8);
    for (let i = 0; i < nb; i++) {
      const az = rng.range(0, 6.28), el = i < 3 ? rng.range(1.0, 1.45) : rng.range(0.25, 1.0), r = i < 3 ? rng.range(3.2, 5) : rng.range(2.2, 4.2);
      const x = t.x + Math.cos(az) * Math.cos(el) * t.r * 0.97, z = t.z + Math.sin(az) * Math.cos(el) * t.r * 0.97;
      if (Math.abs(x) < 17) continue;
      const y = main.y + Math.sin(el) * t.r * t.sy * 0.95 + r * 0.22;
      rocks.push({ x, y, z, r, sy: rng.range(0.62, 0.9), detail: 3, facets: 4, tone: rng.range(0.85, 1.12) });
      if (i < 2 && rng.chance(0.7)) { const r2 = r * rng.range(0.5, 0.68); rocks.push({ x: x + rng.range(-0.8, 0.8), y: y + r * 0.75 + r2 * 0.45, z: z + rng.range(-0.8, 0.8), r: r2, sy: 0.85, detail: 3, facets: 3, tone: 1.05 }); }
    }
  }
  // low flank domes around the koppie
  for (let i = 0, tries = 0; domes.length < NDOME && i < 4 && tries < 60; tries++) {
    const a = rng.range(0, Math.PI * 2), e = rng.range(34, 56), r = rng.range(7, 10.5);
    const x = Math.sin(a) * e / 0.8, z = Math.cos(a) * e;
    if (inCorridor(x, z, r + 6) || domes.some((d) => Math.hypot(d.x - x, d.z - z) < d.r + r + 2)) continue;
    const sy = rng.range(0.6, 0.85), fd = { x, y: sit(x, z, r, sy, 0.12), z, r, sy, sx: rng.range(1, 1.25), sz: rng.range(1, 1.25), detail: 9, facets: 1, tone: rng.range(0.9, 1.1) };
    rocks.push(fd); domes.push(fd); i++;
  }
  // boulders and small rocks over the skirt, clustered; clear of the fly line
  const scatter = (count, eLo, eHi, rLo, rHi, detail, facets) => {
    for (let i = 0, tries = 0; i < count && tries < count * 8; tries++) {
      let x, z;
      if (rocks.length && rng.chance(0.55)) { const o = rng.pick(rocks), d = o.r * rng.range(0.9, 1.7) + 1, a = rng.range(0, 6.28); x = o.x + Math.cos(a) * d; z = o.z + Math.sin(a) * d; }
      else { const a = rng.range(0, Math.PI * 2), e = rng.range(eLo, eHi); x = Math.sin(a) * e / 0.8; z = Math.cos(a) * e; }
      const r = rng.range(rLo, rHi) * rng.range(0.8, 1.1), e = Math.hypot(x * 0.8, z);
      if (e < 13 || e > eHi + 12 || inCorridor(x, z, r)) continue;
      const sy = rng.range(0.6, 0.95);
      rocks.push({ x, y: sit(x, z, r, sy, rng.range(0.15, 0.45)), z, r, sy, detail, facets, tone: rng.range(0.82, 1.15) }); i++;
    }
  };
  scatter(40, 16, 66, 1.9, 4.4, 3, 4);
  scatter(80, 14, 84, 0.55, 1.6, 2, 3);
  await ctx.yield();

  // ---- shared uniforms
  const sun0 = new THREE.Vector3(-0.5, 0.62, 0.6).normalize();
  const domeU = [];
  for (let i = 0; i < NDOME; i++) { const d = domes[i]; domeU.push(d ? new THREE.Vector4(d.x, d.y + d.r * (d.sy - 1) * 0.3, d.z, d.r * 1.04) : new THREE.Vector4(0, -1000, 0, 0.001)); }
  const U = {
    uSunDir: { value: sun0.clone() }, uSunCol: { value: new THREE.Color(3, 2.84, 2.5) },
    uSkyCol: { value: new THREE.Color(0.62, 0.74, 0.9) }, uGndCol: { value: new THREE.Color(0.2, 0.17, 0.15) },
    uCam: { value: new THREE.Vector3(0, 30, 200) }, uTime: { value: 0 }, uFront: { value: -20 }, uOpen: { value: 1 },
    uGrowth: { value: 1 }, uApron: { value: opts.field ?? apron }, uFill: { value: opts.fill ?? 1.5 }, uTideDir: { value: td },
    uSeed: { value: new THREE.Vector4(rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90)) },
    uWash: { value: new THREE.Vector4(...wash) },
    uSeason: { value: new THREE.Vector4(season[0], season[1] * density, season[2], season[3]) },
    uDomes: { value: domeU }, uHeu: { value: heu },
    uCast: { value: Array.from({ length: NCAST }, () => new THREE.Vector4(0, -1000, 0, 0.001)) },
    uCloud: { value: new THREE.Vector4(0, 0, 0, 0) }, uCb: { value: new THREE.Vector4(0, 0, 100, 0) }, uCbAx: { value: new THREE.Vector4(1, 0, 1, 0) }, uIsle: { value: new THREE.Vector4(0, 0, 100, 0) }, uIsleAx: { value: new THREE.Vector4(0, 1, 1, 0) },
    uHol: { value: new THREE.Vector4(0, 0, 9000, 20) }, uHolK: { value: new THREE.Vector2(0, 0) }, uTongue: { value: new THREE.Vector4(0, 9000, 1, 0) }, uArc: { value: new THREE.Vector4(0, 0, 1, 0) }, uTrack: { value: new THREE.Vector4(2.2, 96, 330, 0) }, uTune: { value: new THREE.Vector3(8, 1, 1) },
    uNite: { value: 0 }, uPlan: { value: new THREE.Vector4(0, 0, 0, 0) }, uRise: { value: new THREE.Vector4(0, 1, 0, 0) }, uW2: { value: new THREE.Vector4(0, 0, 60, 60) },
    uPan: { value: new THREE.Vector4(0, 0, 0, 0) }, uRefl: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4()) }, uVeilM: { value: new THREE.Vector4(1, 0, 0, 0) }, uVeilC: { value: new THREE.Color(0, 0, 0) }, uBull: { value: new THREE.Vector4(9000, 0, 9000, 0) }, uOrange: { value: new THREE.Vector4(0, 9000, 1, 0) }, uMound: { value: new THREE.Vector4(0, 9000, 1, 0) },
    uSw: { value: [new THREE.Vector4(0, 1, 0, 0), new THREE.Vector4(0, 1, 0, 0), new THREE.Vector4(0, 1, 0, 0)] }, uBias: { value: 0 }, uReal: { value: new THREE.Vector4(0, 14, 0, 0) },
    uFrac: { value: 1 }, uWet: { value: 0 }, uRain: { value: 0 }, uSkyRef: { value: new THREE.Color(0.5, 0.62, 0.8) }, uGlowRef: { value: new THREE.Color(0, 0, 0) },
    uZen: { value: new THREE.Color(0.055, 0.19, 0.53) }, uHor: { value: new THREE.Color(0.56, 0.68, 0.78) }, uSunD: { value: sun0.clone() }, uGlow: { value: new THREE.Color(0, 0, 0) },
    uCloudCol: { value: new THREE.Color(1, 1, 1) }, uCloudSh: { value: new THREE.Color(0.42, 0.47, 0.6) }, uBelt: { value: new THREE.Vector4(0.42, 0.2, 0.25, 0) },
    uCloudP: { value: new THREE.Vector4(0, 0, 0.5, 0) }, uWind: { value: new THREE.Vector4(1, 0, 0, 0) }, uNight: { value: 0 }, uBand: { value: new THREE.Vector4(0, 0, 0, 0) },
    cGravel: { value: pal.gravel }, cOrange: { value: pal.orange }, cWhite: { value: pal.white }, cMagenta: { value: pal.magenta },
    cGold: { value: pal.gold }, cRock: { value: pal.rock }, cGreen: { value: pal.green },
  };

  let groundMat = null, rockMat = null, treeMat = null, gridPos = null;
  const GNR = 84, GNS = 132;
  // ---- ground: polar grid, dense under the koppie, with contact shade from the rocks
  {
    const NR = GNR, NS = GNS, pos = [], nor = [], occ = [], idx = [];
    for (let i = 0; i <= NR; i++) {
      const r = apron * Math.pow(i / NR, 1.45);
      for (let j = 0; j < NS; j++) {
        const a = ((j + (i % 2) * 0.5) / NS) * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r, y = heightAt(x, z);
        pos.push(x, y, z);
        const hx = heightAt(x + 0.8, z) - heightAt(x - 0.8, z), hz = heightAt(x, z + 0.8) - heightAt(x, z - 0.8), il = 1 / Math.hypot(hx, 1.6, hz);
        nor.push(-hx * il, 1.6 * il, -hz * il);
        let o = 1;
        if (r < 110) for (const k of rocks) { const d = Math.hypot(x - k.x, z - k.z); if (d < k.r * 1.6 && y > k.y - k.r * k.sy - 1) o *= 0.3 + 0.7 * sstep(k.r * 0.7, k.r * 1.6, d); }
        occ.push(o);
      }
      await ctx.yield();
    }
    await ctx.yield();
    for (let i = 0; i < NR; i++) {
      for (let j = 0; j < NS; j++) {
        const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS;
        if (i % 2) idx.push(a, d, c, a, b, d); else idx.push(a, b, c, b, d, c);
      }
      if (i % 16 === 15) await ctx.yield();
    }
    await ctx.yield();
    const g = finishGeo({ pos, nor, idx }, { aOcc: [occ, 1] });
    gridPos = pos;
    await ctx.yield();
    groundMat = makeMat(U, GROUND_VERT, GROUND_FRAG, { side: THREE.DoubleSide });
    group.add(new THREE.Mesh(g, groundMat));
  }
  await ctx.yield();

  // (the koppie's own rock, kept for seenFrom below)
  let koppieRock = null;
  // ---- rock mesh
  {
    const B = { pos: [], col: [], idx: [] };
    // (templates first, the coarsest first, each in its own steps)
    for (const d of [...new Set(rocks.map((k) => k.detail))].sort((a, b) => a - b)) await rockTemplateSteps(d, ctx);
    for (let i = 0; i < rocks.length; i++) { addRock(B, rocks[i], noise, rng, pal); await ctx.yield(); }
    await ctx.yield();
    // the same as finishGeo(B), a step at a time (the koppie's rock is the largest single mesh of the build)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    await ctx.yield();
    g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
    await ctx.yield();
    g.setIndex(B.idx);
    await ctx.yield();
    await normalsInSteps(g, ctx);
    await ctx.yield();
    rockMat = makeMat(U, ROCK_VERT, ROCK_FRAG);
    group.add(new THREE.Mesh(g, rockMat));
    koppieRock = g;
  }
  await ctx.yield();

  // ---- quiver trees: the leaning gate pair, then the scatter
  const gateTrees = [], treeTops = []; let nestPos = null;
  {
    const B = { pos: [], nor: [], col: [], sway: [], kind: [], idx: [] };
    const nestSide = rng.sign();
    for (const s of [-1, 1]) {
      const x = s * 12.3, z = 3 + rng.range(-0.8, 0.8), y = heightAt(x, z) - 0.25;
      const r = addQuiver(B, { x, y, z, H: 12.6 * rng.range(0.97, 1.03), leanDir: [-s, 0], lean: 13 * Math.PI / 180, levels: 5, hero: true, nest: s === nestSide, yaw: rng.range(-0.5, 0.5) }, rng, pal, noise);
      gateTrees.push(new THREE.Vector3(x, y, z)); treeTops.push(r.top); if (r.nest) nestPos = r.nest;
      await ctx.yield();
    }
    await ctx.yield();
    const placed = [];
    for (let i = 0, tries = 0; i < 28 && tries < 500; tries++) {
      let x, z;
      if (i < 8) { const t = tors[i % 2], a = rng.range(0, 6.28), d = t.r * rng.range(1.05, 1.7); x = t.x + Math.cos(a) * d; z = t.z + Math.sin(a) * d; }
      else if (i < 18) { x = rng.sign() * rng.range(15, 74); z = rng.range(-9, 7); }     // the skyline ridge
      else { const a = rng.range(0, Math.PI * 2), e = rng.range(20, 62); x = Math.sin(a) * e / 0.8; z = Math.cos(a) * e; }
      if ((z > -30 && Math.abs(x) < 15) || rocks.some((k) => Math.hypot(k.x - x, k.z - z) < k.r * 1.08 + 0.7) || placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 5)) continue;
      const H = rng.range(4.8, 8), la = rng.range(0, 6.28);
      addQuiver(B, { x, y: heightAt(x, z) - 0.2, z, H, leanDir: [Math.cos(la), Math.sin(la)], lean: rng.range(0, 0.1), levels: H > 6.6 ? 4 : 3, hero: false, yaw: rng.range(0, 3.14) }, rng, pal, noise);
      placed.push([x, z]); i++;
      if (i % 2 === 1) await ctx.yield();
    }
    await ctx.yield();
    const g = finishGeo(B, { aSway: [B.sway, 1], aKind: [B.kind, 1] });
    await ctx.yield();
    treeMat = makeMat(U, TREE_VERT, TREE_FRAG, { side: THREE.DoubleSide });
    group.add(new THREE.Mesh(g, treeMat));
  }
  await ctx.yield();

  // ---- mid tier heads along the approach and over the front skirt
  // (tiers: the three flower tiers that only matter near the koppie, by name; the world shows them as the lens comes within range)
  const tiers = { mid: null, near: null, cush: [] };
  const detail = ctx.quality?.detail ?? 1;
  const onRock = (x, z, pad) => rocks.some((k) => Math.hypot(k.x - x, k.z - z) < k.r * 0.95 + pad);
  {
    const N = Math.round(15000 * detail), iPos = [], iRnd = [];
    for (let i = 0, tries = 0; i < N && tries < N * 3; tries++) {
      let x, z;
      if (rng.chance(0.86)) { x = rng.gauss() * 5.5; z = 26 + 152 * Math.sqrt(rng()); }
      else { const a = rng.gauss() * 0.9, e = rng.range(26, 118); x = Math.sin(a) * e / 0.8; z = Math.cos(a) * e; }
      if (onRock(x, z, 0.1)) continue;
      const q1 = rng(), q2 = rng(), q3 = rng(); i++;
      if (i <= N * 0.8) { iPos.push(x, heightAt(x, z), z); iRnd.push(q1, q2, q3, Math.hypot(x * 0.8, z) > 84 ? 0 : slopeAt(x, z)); }
      if (i % 500 === 499) await ctx.yield();
    }
    await ctx.yield();
    const quad = { pos: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], idx: [0, 1, 2, 0, 2, 3] };
    tiers.mid = flowerMesh(quad, iPos, iRnd, makeMat(U, MID_VERT, MID_FRAG, { side: THREE.DoubleSide })); group.add(tiers.mid);
  }
  await ctx.yield();
  // ---- near tier: real daisies beside the fly line where it runs at 1.8 m and starts to climb
  const nearField = new THREE.Vector3(0, 0, 112);
  {
    // (the old tier's draws are kept so that everything seeded after the hero stays where it was)
    for (let i = 0, tries = 0, N0 = Math.round(250 * (0.5 + 0.5 * detail)); i < N0 && tries < N0 * 4; tries++) {
      const x = rng.gauss() * 3.6, z = rng.range(78, 150);
      if (Math.abs(x) < 0.4 || onRock(x, z, 0.2)) continue;
      rng(); rng(); rng(); rng(); i++;
    }
    const r2 = ctx.core.makeRng(((ctx.seed | 0) ^ 0x51ed27) >>> 0);
    const N = Math.round(520 * (0.5 + 0.5 * detail)), iPos = [], iRnd = [];
    for (let i = 0, tries = 0; i < N && tries < N * 4; tries++) {
      const x = r2.gauss() * 4.3, z = r2.range(80, 179);
      if (Math.abs(x) < 0.5 || Math.abs(x) > 13 || onRock(x, z, 0.3)) continue;
      iPos.push(x, heightAt(x, z), z); iRnd.push(r2(), r2(), r2(), r2()); i++;
    }
    nearField.y = heightAt(0, 112);
    tiers.near = flowerMesh(daisyGeometry(), iPos, iRnd, makeMat(U, NEAR_VERT, NEAR_FRAG, { side: THREE.DoubleSide })); group.add(tiers.near);
  }
  await ctx.yield();
  // ---- vygie cushions beside the climb: one mound per mat cell of the ground shader, placed by the same GLSL cell function so each
  // stands exactly on its painted mat (and on its contact rim and shadow), and the flowers of every mound within 13 m of the fly
  // line as single cards. Small cushions (8-sided) within 11 m of the line, big lobed mats (16-sided, humped) within 22 m. The
  // mound itself is painted all over with its heads (CUSH_FRAG); the cards are the few that stand up from it and turn to the lens
  {
    const cushMat = makeMat(U, CUSH_VERT, CUSH_FRAG), vygMat = makeMat(U, VYG_VERT, VYG_FRAG, { side: THREE.DoubleSide });
    const dome = (n, rings) => {
      const pos = [0.03, 1, -0.02], idx = [];
      rings.forEach(([r, y], k) => { for (let j = 0; j < n; j++) { const a = ((j + (k % 2) * 0.5) / n) * Math.PI * 2; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); } });
      for (let j = 0; j < n; j++) idx.push(0, 1 + (j + 1) % n, 1 + j);
      for (let k = 0; k < rings.length - 1; k++) { const a0 = 1 + k * n, b0 = a0 + n, sh = k % 2;      // odd rings are turned half a step
        for (let j = 0; j < n; j++) { const j2 = (j + 1) % n; if (sh) idx.push(a0 + j, a0 + j2, b0 + j2, a0 + j, b0 + j2, b0 + j); else idx.push(a0 + j, a0 + j2, b0 + j, a0 + j2, b0 + j2, b0 + j); } }
      return { pos, idx };
    };
    const fr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x3b61f7) >>> 0);
    // the height of the ground as it is drawn (the flat triangle of the polar grid under the point), so a mound stands on the
    // ground the eye sees and neither sinks into it nor floats over it
    const triH = (a, b, c, x, z) => {
      const ax = gridPos[a * 3], az = gridPos[a * 3 + 2], bx = gridPos[b * 3], bz = gridPos[b * 3 + 2], cx = gridPos[c * 3], cz = gridPos[c * 3 + 2];
      const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(den) < 1e-9) return null;
      const w0 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den, w1 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den, w2 = 1 - w0 - w1;
      return w0 < -1e-3 || w1 < -1e-3 || w2 < -1e-3 ? null : w0 * gridPos[a * 3 + 1] + w1 * gridPos[b * 3 + 1] + w2 * gridPos[c * 3 + 1];
    };
    const meshH = (x, z) => {
      const r = Math.hypot(x, z); if (!gridPos || r > apron * 0.98) return heightAt(x, z);
      const i0 = Math.floor(GNR * Math.pow(r / apron, 1 / 1.45)), af = (((Math.atan2(x, z) / (Math.PI * 2)) % 1) + 1) % 1 * GNS;
      for (let di = 0; di < 3; di++) {
        const i = i0 + (di === 1 ? -1 : di === 2 ? 1 : 0); if (i < 0 || i >= GNR) continue;
        const j0 = Math.floor(af - (i % 2) * 0.5);
        for (let dj = -1; dj <= 1; dj++) {
          const j = (((j0 + dj) % GNS) + GNS) % GNS, a = i * GNS + j, b = i * GNS + (j + 1) % GNS, c = a + GNS, dd = b + GNS;
          const h1 = i % 2 ? triH(a, dd, c, x, z) : triH(a, b, c, x, z); if (h1 !== null) return h1;
          const h2 = i % 2 ? triH(a, b, dd, x, z) : triH(b, dd, c, x, z); if (h2 !== null) return h2;
        }
      }
      return heightAt(x, z);
    };
    const layer = async (S, base, xMax, d, nFl, xFl) => {
      const iCell = [], iH = [], iS = [], fCell = [], fH = [], fS = [], fF = [], n = Math.ceil(110 / S);
      for (let cy = -n; cy <= n; cy++) {
        for (let cx = -n; cx <= n; cx++) {
          const qx = (cx + 0.5) * S, qy = (cy + 0.5) * S, x = 0.8 * qx - 0.6 * qy, z = 0.6 * qx + 0.8 * qy;
          if (Math.abs(x) > xMax || z < -1 || z > 96 || onRock(x, z, 0.4 + S * 0.2)) continue;
          const h0 = meshH(x, z), gx = (meshH(x + d, z) - meshH(x - d, z)) / (2 * d), gz = (meshH(x, z + d) - meshH(x, z - d)) / (2 * d), sl = Math.hypot(x * 0.8, z) > 84 ? 0 : slopeAt(x, z);
          iCell.push(cx, cy); iH.push(h0, gx, gz, sl); iS.push(S);
          if (Math.abs(x) < xFl) for (let k = 0; k < nFl; k++) { fCell.push(cx, cy); fH.push(h0, gx, gz, sl); fS.push(S); fF.push(fr(), fr(), fr()); }
        }
        if ((cy & 7) === 7) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(base.pos, 3)); g.setIndex(base.idx);
      g.setAttribute('iCell', new THREE.InstancedBufferAttribute(new Float32Array(iCell), 2)); g.setAttribute('iH', new THREE.InstancedBufferAttribute(new Float32Array(iH), 4));
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(iS), 1));
      g.instanceCount = iS.length;
      const m = new THREE.Mesh(g, cushMat); m.frustumCulled = false; group.add(m); tiers.cush.push(m);
      await ctx.yield();
      const gf = new THREE.InstancedBufferGeometry();
      gf.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gf.setIndex([0, 1, 2, 0, 2, 3]);
      gf.setAttribute('iCell', new THREE.InstancedBufferAttribute(new Float32Array(fCell), 2)); gf.setAttribute('iH', new THREE.InstancedBufferAttribute(new Float32Array(fH), 4));
      gf.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(fS), 1)); gf.setAttribute('iF', new THREE.InstancedBufferAttribute(new Float32Array(fF), 3));
      gf.instanceCount = fS.length;
      const mf = new THREE.Mesh(gf, vygMat); mf.frustumCulled = false; group.add(mf); tiers.cush.push(mf);
    };
    await layer(1.5, dome(8, [[0.6, 0.74], [1, -0.12]]), 11, 0.5, Math.round(5 * detail), 6);
    await ctx.yield();
    await layer(4.8, dome(16, [[0.3, 0.97], [0.58, 0.82], [0.82, 0.5], [1, -0.3]]), 22, 1.2, Math.round(36 * detail), 13);
  }
  await ctx.yield();

  // ---- anchors
  const torTops = tors.map((t) => {
    let y = 0; const top = new THREE.Vector3(t.x, t.top, t.z);
    for (const k of rocks) if (Math.hypot(k.x - t.x, k.z - t.z) < t.r && k.y + k.r * k.sy > y) { y = k.y + k.r * k.sy; top.set(k.x, y, k.z); }
    return top;
  });
  const center = new THREE.Vector3(0, 24, 0);
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, PORTAL_Y, 0), facing: new THREE.Vector3(0, -Math.sin(PITCH), Math.cos(PITCH)), tilt: PITCH, radius: 7 },
    flyThrough: fly,
    gateTrees, nestTree: nestPos, torTops, treeTops,
    saddle: new THREE.Vector3(0, heightAt(0, 0), 0),
    foot: new THREE.Vector3(0, heightAt(0, 72), 72),
    nearField,
    tideDir: new THREE.Vector3(td.x, 0, td.y),
    sunDir: sun0.clone(),
    viewpoints: { reveal: new THREE.Vector3(30, 14, 230), foot: new THREE.Vector3(-14, 4, 120), climb: new THREE.Vector3(0, 9.5, 58) },
  };

  // ---- runtime
  let driven = false, sunL = null, hemiL = null, tick = 0;
  const manual = {}, _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _w = new THREE.Vector3();
  const setFront = (q) => { driven = true; U.uFront.value = q; };
  const setProgress = (p) => setFront(-330 + 420 * clamp(p, 0, 1));
  if (opts.progress != null) setProgress(opts.progress);
  const findLights = () => {
    let root = group; while (root.parent) root = root.parent;
    sunL = hemiL = null;
    root.traverse((o) => { if (o.isDirectionalLight && !sunL) sunL = o; else if (o.isHemisphereLight && !hemiL) hemiL = o; });
  };

  return {
    object: group, radius: 62, height: 56, center, anchors, ground: true, groundY: -3,
    heightAt, glsl: GLSL + SLAB_GLSL, uniforms: U, apron, palette: pal, groundMaterial: groundMat, makeMat,
    midFrag: MID_FRAG, nearFrag: NEAR_FRAG, tiers,
    // the world's own granite and quiver trees in the same materials (hero-local coordinates):
    // rocks [{ x, y, z, r, sy, detail, facets, tone }], trees [{ x, y, z, H, levels, hero, nest, lean, leanDir, yaw }]
    // A spec may carry g (0, 1, 2, ...): each g becomes its own rock mesh and its own tree mesh (out.userData.groups[g] = [meshes]),
    // which the world shows or leaves out by where the lens is along its route. A spec may carry st, the name of the family it
    // belongs to (the scatter, the stacks, the massifs ...): every family shapes its rocks from a stream of its own and its trees
    // from another, each made from the world's seed and the family's name, so what one family holds changes nothing in another.
    async makeProps(rockSpecs = [], treeSpecs = []) {
      const out = new THREE.Group(), info = { nests: [], tops: [] }, groups = [], streams = new Map();
      const grp = (g) => { while (groups.length <= g) groups.push([]); return groups[g]; };
      const streamOf = (name) => { let r = streams.get(name); if (!r) { r = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)); streams.set(name, r); } return r; };
      if (rockSpecs.length) {
        const Bs = [];
        for (let i = 0; i < rockSpecs.length; i++) { const q = rockSpecs[i], g = q.g | 0; if (!Bs[g]) Bs[g] = { pos: [], col: [], idx: [] }; addRock(Bs[g], q, noise, streamOf('rock of ' + (q.st || 'plain')), pal); await ctx.yield(); }
        // A ROCK SET DOWN BY ITS OWN SHAPE. A spec may carry seat: the height of the lowest ground beneath the rock (the world
        // knows the ground). The rock as it was built is then moved straight up or down until its lowest ring lies no higher
        // than that ground: round its middle, in sectors of bearing (SEAT_SECTORS to each step of its fineness: a finer rock
        // has more points round its flank, and its ring is read as finely), the lowest point of the built shape is found,
        // and the highest of those is put at seat. So the rock meets the ground all the way round and nothing of its
        // underside stands in the air. A spec that names another (on) moves by as much as that one moved: what rides on a
        // rock goes with it (the trees below likewise). A spec without seat or on stays as it was built.
        { const first = [];
          for (const q of rockSpecs) {
            const g = q.g | 0, nv = rockTemplate(q.detail).pos.length / 3, i0 = first[g] | 0, P = Bs[g].pos; first[g] = i0 + nv;
            if (q.seat === undefined && !q.on) continue;
            let dy = q.on ? q.on.moved || 0 : 0;
            if (q.seat !== undefined) {
              const ns = SEAT_SECTORS * (q.detail + 1), low = new Array(ns).fill(Infinity);
              for (let i = i0; i < i0 + nv; i++) { const k = Math.min(ns - 1, Math.floor((Math.atan2(P[i * 3 + 2] - q.z, P[i * 3] - q.x) / (2 * Math.PI) + 0.5) * ns)); low[k] = Math.min(low[k], P[i * 3 + 1]); }
              dy = q.seat - Math.max(...low.filter((v) => v < Infinity));
            }
            for (let i = i0; i < i0 + nv; i++) P[i * 3 + 1] += dy;
            q.y += dy; q.moved = dy;
          }
          await ctx.yield(); }
        for (let g = 0; g < Bs.length; g++) if (Bs[g]) {
          await ctx.yield();
          const geo = finishGeo(Bs[g]);
          await ctx.yield();
          const m = new THREE.Mesh(geo, rockMat); out.add(m); grp(g).push(m);
        }
      }
      if (treeSpecs.length) {
        const Bs = [];
        // (a tree that names a rock it stands on goes with it: see A ROCK SET DOWN BY ITS OWN SHAPE; it is moved once)
        for (const o of treeSpecs) if (o.on) { o.y += o.on.moved || 0; o.on = null; }
        for (let i = 0; i < treeSpecs.length; i++) {
          const o = treeSpecs[i], prng = streamOf('tree of ' + (o.st || 'plain')), la = prng.range(0, 6.28), g = o.g | 0;
          if (!Bs[g]) Bs[g] = { pos: [], nor: [], col: [], sway: [], kind: [], idx: [] };
          const r = addQuiver(Bs[g], { leanDir: [Math.cos(la), Math.sin(la)], lean: prng.range(0, 0.1), levels: 3, hero: false, yaw: prng.range(0, 3.14), ...o }, prng, pal, noise);
          info.tops.push(r.top); if (r.nest) info.nests.push(r.nest);
          await ctx.yield();
        }
        for (let g = 0; g < Bs.length; g++) if (Bs[g]) {
          await ctx.yield();
          const geo = finishGeo(Bs[g], { aSway: [Bs[g].sway, 1], aKind: [Bs[g].kind, 1] });
          await ctx.yield();
          const m = new THREE.Mesh(geo, treeMat); out.add(m); grp(g).push(m);
        }
      }
      out.userData.info = info; out.userData.groups = groups;
      return out;
    },
    // A world that knows every place a rock mesh of the hero's material is ever looked at from (eyes: x, y, z, one after
    // another, in hero-local coordinates) says so here, once, in its build: the mesh then keeps only the faces that are ever
    // drawn (see dropUnseen). geo: the geometry of a rock mesh that makeProps made; without it, the koppie's own rock. Left
    // alone, a rock keeps every face. Returns the number of faces left out.
    async seenFrom(eyes, geo) { const g = geo || koppieRock; return g ? dropUnseen(g, eyes, ctx) : 0; },
    setProgress, setFront,
    setOpen(o) { U.uOpen.value = clamp(o, 0, 1); },
    setGrowth(g) { U.uGrowth.value = clamp(g, 0, 1); },
    setLight(o = {}) { Object.assign(manual, o); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) U.uFront.value = -270 + 420 * ((time / 16) % 1);
      group.updateWorldMatrix(true, false);
      if (camera) { _v.setFromMatrixPosition(camera.matrixWorld); U.uCam.value.copy(group.worldToLocal(_v)); }
      if ((tick++ % 90) === 0 && (!sunL || !sunL.parent || !hemiL)) findLights();
      group.getWorldQuaternion(_q).invert();
      // key light: explicit, else the scene's first DirectionalLight
      if (manual.sunDir) _v.copy(manual.sunDir);
      else if (sunL) { _v.setFromMatrixPosition(sunL.matrixWorld); _w.setFromMatrixPosition(sunL.target.matrixWorld); _v.sub(_w); }
      else _v.copy(sun0).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()));
      if (_v.lengthSq() > 1e-8) U.uSunDir.value.copy(_v.normalize().applyQuaternion(_q));
      if (manual.sunColor) U.uSunCol.value.copy(manual.sunColor);
      else if (sunL) U.uSunCol.value.copy(sunL.color).multiplyScalar(sunL.intensity);
      if (manual.skyColor) U.uSkyCol.value.copy(manual.skyColor);
      else if (hemiL) U.uSkyCol.value.copy(hemiL.color).multiplyScalar(hemiL.intensity);
      if (manual.groundColor) U.uGndCol.value.copy(manual.groundColor);
      else if (hemiL) U.uGndCol.value.copy(hemiL.groundColor).multiplyScalar(hemiL.intensity);
    },
    dispose() {},
  };
}
