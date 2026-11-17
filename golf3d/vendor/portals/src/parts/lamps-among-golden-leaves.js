// THE GREAT TREE OF THE CITY - hero set piece for the world "lamps-among-golden-leaves".
//
// A silver-barked giant some 12 m through and 132 m tall. Its gold crown stands in tiers of boughs, layer over
// layer, each bough's leaves a mass with depth (cards turned every way about the bough and its sprays, shade
// inside), with open air between the tiers, so that from outside you look in between them and see the bole, the
// broad white ladder that stands against one face of it and goes straight up through an opening in each platform
// set about the trunk, and lamps of three colours (leaf green, warm gold, moon silver) hung down the ladder's line,
// from every platform's rim and from the boughs. No platform has a rail: one plaited screen on one side of some.
// The great platform lies at 97 m, wide as a ship's deck, the trunk rising through it, open at its edge all round
// (the ladder's head comes up through it), its rim an edging of silver-grey boards. On it stands the hall, A HOUSE:
// an oval chamber with walls of green woven work on silver staves, a band of silver in them, lit by the lamps under
// the eave; unequal forked posts of living silver bough inside the walls, their arms carrying the wall's head; a
// roof of living gold leaf on the tree's own boughs; the bole its middle pillar, two empty chairs at the bole's
// foot. The walls stand open where the flight comes in and where the portal's ring stands, at the platform's far
// end between two lamp-hung boughs, against the open sky: no leaf, bough, post, wall or lamp stands between any
// eye on the last straight (opts.ringEyes) and any part of the ring, nor behind it within its view.
// Its back is closed by one round plaited screen a little wider than itself, gold leaf on its back. Below the great platform one limb
// carries an outer landing (its bearing, distance and height by the tree's own plan: see buildHero).
//
// LOCAL SPACE  origin = foot of the trunk, +Y up. The flight comes in from +Z along the line x = 9, 8 m over the
//   great platform, through the hall to (9, 105, -20) (the portal's seat), so "front" is +Z. The world turns the
//   whole piece as it likes.
// SIZE   every leaf within HERO.crownR (34 m) of the trunk's axis, height 132 m.
// LIGHT  All materials are custom shaders (linear HDR, own fog) lit by uniforms. The world sets them ONCE at build
//   (kit.setLight(place, { sunDir, sunCol, skyCol, gndCol, fogCol, fogDen, ... }) for each of the three places,
//   colours already divided by pi): nothing calls setLight after that. Alone in the part viewer the piece adopts
//   the scene's first DirectionalLight, HemisphereLight and fog by itself (kit.adopt, in the hero's update).
// LAMPS  every lamp burns for the whole visit. Each has its own strength, drawn with it, and each house may have its
//   own (opts.glow, a number; 1 where none is given), which its lamps and the light they throw on it share.
// LIGHT OF A PLACE  the hour stands still; the light differs by place (open sky, the wood's roof, the city's roof):
//   see GL_PLACE and GL_LIGHT. setLight(place, {...}) gives a place its light; setRoof(texture, st, top) the map.
//
// EXPORTS makeGoldwood(ctx, opts) -> the kit the world builds its ordinary giants with: shared uniforms and
//   materials, mesh builders (solid, leaves, lamps) and growTree / flet / ladder.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';

const TAU = Math.PI * 2;
const C3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// (no root comes nearer the route's line than its own thickness and this, in metres)
const ROOT_ROOM = 3;
export const trunkRadius = (R, H, tc, h) => { const t = clamp(h / H, 0, 1); return R * (t < tc ? 1 - 0.28 * t / tc : 0.72 * (1 - 0.88 * Math.pow((t - tc) / (1 - tc), 1.25))); };
// the reach of one lamp's pool of light (m): what a lamp lights lies within this of it
export const LAMP_REACH = 8;
// the largest leaf card that may lie near the route as one card (m across): see fineAt in growSteps
export const FINE_CARD = 6;
// the great tree's measures the world lays its route by (m, local): no leaf further from the axis than crownR; the
// great platform's floor; the line of the last flight (x), its height over the floor, and the portal's seat (z);
// the radius of the portal's ring; the platform's two ends (z); the hall on it: an oval about (cx, cz) with half
// axes a and b, its eave `eave` over the floor, no leaf under `roof` over the floor; no post and no wall stands
// within `door` radians of +Z (the way in: the hall's near end is open as wide as the hall), and it is open for
// `far` radians either side of -Z (the bay the ring stands in: as wide as the ring and the room kept round the line).
// The seat lies 2 m inside the platform's far end: the ring stands on the platform's edge, in the hall's far bay.
// back: the round screen that closes the ring's back stands `back` metres behind the seat.
// floors: the three platforms about the bole, over the tree's foot (the city's great houses build level with the first).
export const HERO = { crownR: 34, deck: 97, lineX: 9, over: 8, seatZ: -20, deckZ: [-22, 42], height: 132, portalR: 7, back: 5.5,
  hall: { cx: 5, cz: 6, a: 16, b: 26, eave: 9, roof: 18.5, door: 0.75, far: 0.6 }, floors: [50, 63, 76] };
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Hand-backs paid by work done. The engine gives a whole frame away each time it is asked later than a few
// milliseconds after the last hand-back, so a build of many small steps that asks after each one waits longer than
// it works. Here the work is counted instead (a vertex one, a leaf card two, either two more where the lamps' light
// is summed into it, a lamp eight, plus what a loop reports itself) and the engine is asked only when a step's worth
// has been done since the last time. The engine runs code it has not met before many times slower, so the first
// steps are a third as long. A loop that reports 1500 or more at once has done work that is not counted (a sweep, a
// large array made): the engine is asked there and then.
export function makePacer(ctx, quota = 3000, warm = 40000) {
  const sets = [], lamps = []; let extra = 0, paid = 0;
  const made = () => { let n = extra; for (let i = 0; i < sets.length; i++) n += sets[i].cost; for (let i = 0; i < lamps.length; i++) n += lamps[i].count * 8; return n; };
  const pacer = {
    watch(...bs) { for (const b of bs) { if (!b) continue; if (b.solid) sets.push(b.solid); if (b.leaves) sets.push(b.leaves); if (b.lamps) lamps.push(b.lamps); } return pacer; },
    rest(n = 0) { extra += n; const m = made(); if (n < 1500 && m - paid < (m < warm ? Math.min(quota, 3000) / 3 : quota)) return null; paid = m; return ctx.yield(); },
  };
  return pacer;
}

export const GOLD_PALETTE = {
  leaf: C3('#e9b949'), leafLit: C3('#f6dd8a'), leafDeep: C3('#c98a2a'), leafGreen: C3('#9bbf4e'), blossom: C3('#fff0a0'),
  bark: C3('#c9c7d6'), barkShade: C3('#6e6a8c'), wood: C3('#cdbb98'), woodDark: C3('#8f7c60'), white: C3('#eeeae0'), rope: C3('#f2efe6'),
  screen: C3('#d8c890'), lampGreen: C3('#7fe0a0'), lampGold: C3('#ffd27a'), lampSilver: C3('#dfe8ff'),
};

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the wood
// ---------------------------------------------------------------------------------------------------------
// THE LIGHT OF A PLACE. The hour stands for the whole visit; what differs is the place. There are three kinds of
// place, each with its own light, haze and lamp strength (uP...[0], [1], [2]): under the open sky, under the wood's
// high gold roof, and under the city's roof of leaves. Which a point is in is read from the roof map (uRoof: one
// picture of the country from above, made by the world from the crowns that stand: red = how much of the wood's
// roof stands over the point, green = how much of the city's, blue = how high that roof's top is, alpha = how much of
// the wood's haze stands there; a point above the roof's top is under the open sky). vPl is the point's own share
// of each kind (its light); vFg is the point's own share of each kind's HAZE (the wood's haze reaches HAZE_M
// further than its roof: the map's alpha). BOTH ARE READ AT THE POINT'S OWN PLACE AND NOWHERE ELSE: the eye's
// place plays no part in either, so nothing drawn changes its light or its haze because the eye has moved (only
// the true distance to it does, in the fog's own law). Nothing here reads how far the flight has come. GL_PLACE is the vertex shaders' part
// (gwPlaces(world position) fills the two varyings), GL_LIGHT the fragment shaders' (gwLight() makes the point's
// light from them, under the names every shader of the wood already uses).
export const GL_PLACE = /* glsl */`
uniform sampler2D uRoof; uniform vec4 uRoofST; uniform vec2 uRoofTop;
varying vec3 vPl, vFg;
vec3 gwRoof(vec3 p){
  vec4 r = texture2D(uRoof, p.xz * uRoofST.xy + uRoofST.zw);
  float top = r.b * uRoofTop.x, under = 1. - smoothstep(top - uRoofTop.y, top - 2., p.y);
  return vec3(r.r, r.g, r.a) * under;
}
void gwPlaces(vec3 wp){
  vec3 a = gwRoof(wp);
  vPl = vec3(1. - a.x - a.y, a.x, a.y);
  float fw = min(a.z, 1. - a.y);
  vFg = vec3(1. - fw - a.y, fw, a.y);
}
`;
export const GL_LIGHT = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uPSun[3]; uniform vec3 uPSky[3]; uniform vec3 uPGnd[3]; uniform vec3 uPAmb[3]; uniform vec3 uPSilver[3];
uniform vec3 uPFog[3]; uniform vec3 uPFogCool[3]; uniform vec3 uPFogSun[3];
uniform vec3 uPDen, uPGain;
varying vec3 vPl, vFg;
vec3 gSun, gSky, gGnd, gAmb, gFog, gFogCool, gFogSun; float gFogDen, gGain;
void gwLight(){
  gSun = uPSun[0] * vPl.x + uPSun[1] * vPl.y + uPSun[2] * vPl.z; gSky = uPSky[0] * vPl.x + uPSky[1] * vPl.y + uPSky[2] * vPl.z;
  gGnd = uPGnd[0] * vPl.x + uPGnd[1] * vPl.y + uPGnd[2] * vPl.z; gAmb = uPAmb[0] * vPl.x + uPAmb[1] * vPl.y + uPAmb[2] * vPl.z;
  gFog = uPFog[0] * vFg.x + uPFog[1] * vFg.y + uPFog[2] * vFg.z; gFogCool = uPFogCool[0] * vFg.x + uPFogCool[1] * vFg.y + uPFogCool[2] * vFg.z;
  gFogSun = uPFogSun[0] * vFg.x + uPFogSun[1] * vFg.y + uPFogSun[2] * vFg.z;
  gFogDen = dot(uPDen, vFg); gGain = dot(uPGain, vPl);
}
#define uSunCol gSun
#define uSkyCol gSky
#define uGndCol gGnd
#define uLeafAmb gAmb
#define uFogCol gFog
#define uFogCool gFogCool
#define uFogSun gFogSun
#define uFogDen gFogDen
#define uLampGain gGain
`;
const GL_COMMON = /* glsl */`
uniform float uTime, uShadeK;
${GL_LIGHT}
uniform vec4 uWind, uShadeST, uFade;
uniform sampler2D uShade;
float gwHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gwNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(gwHash(i), gwHash(i+vec2(1.,0.)), f.x), mix(gwHash(i+vec2(0.,1.)), gwHash(i+vec2(1.,1.)), f.x), f.y); }
vec3 gwFog(vec3 c, vec3 wp){
  vec3 d = wp - cameraPosition; float l = length(d); float f = clamp(1. - exp(-uFogDen*uFogDen*l*l), 0., 1.);
  float sd = dot(d / max(l, 1e-3), uSunDir), s = clamp(sd, 0., 1.); s = s*s; s = s*s;
  // the haze is gold toward the sun and blue away from it
  return mix(c, mix(uFogCool, uFogCol, smoothstep(-0.55, 0.75, sd)) + uFogSun * s * s, f); }
float gwShade(vec3 wp){ vec2 uv = wp.xz * uShadeST.xy + uShadeST.zw; return mix(1., texture2D(uShade, uv).r, uShadeK); }
// HOW A TREE AND ITS PLAIN COPY ARE DRAWN THROUGH EACH OTHER. A set of trees is made twice (whole, and the same
// trees plainly: see growSteps), and each copy stands at the distances that are its own: the whole one near, the
// plain one far. Across the stretch of metres between (uFade.x to uFade.y from the eye, measured to each point of
// the tree) each is drawn as an open weave, the whole copy's thinning with the distance as the plain one's thickens,
// and the two weaves are one cloth cut in two: where the one has a thread the other has a gap (one fine even
// lattice of thresholds serves both). So a tree in the stretch is never there twice and never missing, and no tree
// changes all at once. Beyond the stretch the plain copy stands at every distance: no set thins away to nothing.
// uFade = (where the stretch begins, where it ends, +1 for the whole copy or -1 for the plain one, 1 if the set
// changes at all).
void gwFade(vec3 wp){
  if (uFade.w < 0.5) return;
  float s = smoothstep(uFade.x, uFade.y, length(wp - cameraPosition));
  float h = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (uFade.z > 0. ? h < s : h >= s) discard;
}
`;

const SOLID_VERT = /* glsl */`
${GL_PLACE}
attribute vec3 aC; attribute vec4 aLamp; attribute vec3 aK;
varying vec3 vW, vN, vC, vK; varying vec4 vLamp;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; gwPlaces(vW); vN = normalize(mat3(modelMatrix) * normal); vC = aC; vK = aK; vLamp = aLamp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// kinds (aK.x): 0 bark, 1 planks (aK.yz metres), 2 plain painted wood, 3 snow-white bark, 4 + width / 10: a rope ladder's strip (aK.y metres
// across, aK.z metres along; only in the thin material), 5 plaited screen (aK.yz metres), 6 stone, 7 silver,
// 8 + reach / 100: the underside of a floor (aK.yz metres from the floor's middle as it was laid out round, before
// its outline was drawn in; reach: how far it goes from that middle, in the same measure)
const SOLID_FRAG = /* glsl */`
${GL_COMMON}
varying vec3 vW, vN, vC, vK; varying vec4 vLamp;
void main(){
  gwFade(vW); gwLight();
  float k = vK.x; vec3 alb = vC; vec2 q = vK.yz;
  float alpha = 1.;
#ifdef THIN
  {
    // a rope ladder: two ropes 6 cm thick and a rung of 4 cm every 40 cm, their own thickness at every distance. Where
    // a rope is thinner than a pixel it is drawn one pixel wide and as much fainter; the whole fades out between
    // 120 m and 220 m.
    float W = (k - 4.) * 10., fx = max(fwidth(q.x), 1e-4), fy = max(fwidth(q.y), 1e-4);
    float wr = max(0.06, fx), rail = step(min(q.x, W - q.x), wr) * 0.06 / wr;
    float wg = clamp(max(0.02, 0.5 * fy), 0.02, 0.2), rung = step(abs(fract(q.y / 0.4) - .5) * 0.4, wg) * 0.02 / wg;
    alpha = max(rail, rung) * (1. - smoothstep(120., 220., length(cameraPosition - vW)));
    if (alpha < 0.004) discard;
  }
#endif
  if (k > 4.5 && k < 5.5) {
    float a = fract((q.x + q.y) / 0.16), b = fract((q.x - q.y) / 0.16);
    float w = step(.5, a) * step(.5, b) + (1. - step(.5, a)) * (1. - step(.5, b));
    alb *= 0.78 + 0.22 * w; alb *= 0.9 + 0.2 * gwNoise(q * 9.);
  } else if (k > 0.5 && k < 1.5) {
    float pl = fract(q.x / 0.24), id = floor(q.x / 0.24);
    alb *= 0.86 + 0.2 * gwHash(vec2(id, floor(q.y / 2.6 + gwHash(vec2(id, 3.)))));
    alb *= 1. - 0.3 * smoothstep(0.42, 0.5, abs(pl - .5));
    alb *= 0.92 + 0.16 * gwNoise(vec2(q.x * 40., q.y * 3.));
  } else if (k < 0.5) {
    float n1 = gwNoise(vec2(vW.x * 1.3 + vW.z * 0.9, vW.y * 0.14)), n2 = gwNoise(vec2(vW.x * 5.1 - vW.z * 4.3, vW.y * 0.9));
    float band = gwNoise(vec2(vW.y * 1.7, vW.x * 0.3 + vW.z * 0.3));
    alb *= 0.8 + 0.22 * n1 + 0.12 * n2; alb *= 1. - 0.12 * smoothstep(0.62, 0.8, band);
    alb = mix(alb, alb * vec3(1.03, 1.0, 0.95), n2 * 0.5);
  } else if (k > 5.5 && k < 6.5) {
    alb *= 0.84 + 0.3 * gwNoise(vW.xz * 2.3 + vW.y * 1.7);
  } else if (k > 2.5 && k < 3.5) {
    // snow-white bark: the bark's own relief as the silver trees have it (long furrows, a finer grain), paler, and
    // thin dark marks lying across the stem, a hand long and a finger high.
    float n1 = gwNoise(vec2(vW.x * 1.3 + vW.z * 0.9, vW.y * 0.14)), n2 = gwNoise(vec2(vW.x * 5.1 - vW.z * 4.3, vW.y * 0.9));
    alb *= 0.76 + 0.2 * n1 + 0.14 * n2;
    alb *= 1. - 0.42 * smoothstep(0.62, 0.8, gwNoise(vec2((vW.x - vW.z) * 2.2, vW.y * 9.)));
  } else if (k > 7.5) {
    // THE UNDERSIDE OF A FLOOR IS CARPENTRY, drawn on it. Joists run out from the floor's middle like spokes,
    // 1.8 m apart at its edge (half as many within half its reach, where a ring beam takes their ends); a rim
    // beam goes round the edge; between them the floor's boards are seen from below, a seam every 0.28 m, each
    // board of its own tone and darker beside a joist. The beams are the boards' colour darker and cooler.
    // THE PATTERN'S MEAN IS THE SAME AT EVERY GRAIN, so that an underside neither brightens nor darkens as it goes
    // away. Every line is drawn by its TRUE SHARE of the pixel (how much of the pixel it covers, and never more
    // than its own breadth over the pixel's; the nearest line's share and its neighbour's are added). Where the
    // joists stand closer than some two pixels they go over to their share of the floor at that reach (cj), and
    // the shade beside a joist to its mean over the bay between two joists (shadeMean); the seams go over to
    // their share of the boards (0.024 in 0.28) likewise; a board's own tone goes to its mean, which is 1. The rim
    // beam and the ring beam at half the reach keep their true share at every distance (the rim's as if the floor
    // went on beyond its edge as in a mirror, so that none of its share is lost off the edge, and with a pixel
    // no broader than a quarter of the floor's reach, so that on a narrow floor none is lost into its hole), and
    // where a joist crosses them it is not counted twice. So far off an underside is one even tone and nothing
    // in it crawls, and that tone is the carpentry's own mean (by the builder's sum over the floors that stand
    // here, at grains from 0.01 m to 4 m a pixel: within 1.2 in 100 of the near mean on every one).
    float R = (k - 8.) * 100., rho = length(q), px = max(length(fwidth(q)), 1e-4), turn = atan(q.x, q.y) / 6.2832;
    float nj = max(6., floor(6.2832 * R / 1.8 + .5)); if (rho < 0.5 * R) nj = max(6., floor(nj * .5 + .5));
    float gap = 6.2832 * max(rho, 0.05) / nj, jd = abs(fract(turn * nj) - .5) * gap, far = smoothstep(0.3, 0.7, px / gap);
    float jt = min(1., 0.3 / px), joist = min(1., clamp((0.15 + .5 * px - jd) / px, 0., jt) + clamp((0.15 + .5 * px - (gap - jd)) / px, 0., jt)), cj = min(1., 0.3 / gap);
    float shade = 1. - 0.25 * (1. - smoothstep(0.15, 0.6, jd)), bay = max(.5 * gap - 0.15, 1e-3), bt = clamp(bay / 0.45, 0., 1.);
    float shadeMean = 1. - 0.25 * 0.45 * (bt - bt * bt * bt + .5 * bt * bt * bt * bt) / bay;
    float sd = abs(fract(rho / 0.28) - .5) * 0.28, st = min(1., 0.024 / px);
    float seam = mix(min(1., clamp((0.012 + .5 * px - sd) / px, 0., st) + clamp((0.012 + .5 * px - (0.28 - sd)) / px, 0., st)), 0.024 / 0.28, smoothstep(0.3, 0.7, px / 0.28));
    float fine = 1. - smoothstep(0.04, 0.12, px);
    vec3 beamC = vC * vec3(0.46, 0.47, 0.53);
    vec3 board = alb * mix(1., 0.88 + 0.24 * gwHash(vec2(floor(rho / 0.28), floor(turn * nj + .5))), fine) * (1. - 0.35 * seam);
    float pr = min(px, 0.25 * R);
    float ring = min(1., clamp((0.68 + .5 * pr - (R - rho)) / pr, 0., min(1., 1.36 / pr)) + clamp((0.15 + .5 * px - abs(rho - 0.5 * R)) / px, 0., min(1., 0.3 / px)));
    alb = mix(mix(mix(board * shade, beamC, joist), mix(board * shadeMean, beamC, cj), far), beamC, ring);
  }
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, uSunDir), sh = gwShade(vW + uSunDir * 5.);
  float dif = clamp(ndl * 0.8 + 0.2, 0., 1.);
  vec3 hemi = mix(uGndCol, uSkyCol, N.y * 0.5 + 0.5);
  float fres = 1. - clamp(dot(N, V), 0., 1.); fres = fres * fres * fres;
  float rim = fres * clamp(dot(-V, uSunDir) * 0.6 + 0.5, 0., 1.);
  // silver things (bark, the basin) take the sun's light half way to white and stand in cool violet shade
  // (snow-white bark gives back the sky's and the ground's light together, nearly without their colours: its shade
  //  is a pale cool grey, lighter than anything round it, and its sunlit side is warm white)
  float silver = step(k, 0.5) + step(6.5, k) * step(k, 7.5), white = step(2.5, k) * step(k, 3.5);
  vec3 sun = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3333))) * vec3(1.0, 0.97, 0.96), 0.5 * silver + 0.6 * white);
  // (white bark stands in the same cool shade as silver, half way to a pale grey that is the sky's and the
  //  ground's light together: it has a lit side and a shaded one as every trunk has)
  // (what a silver thing's shade is of that light is the place's own, uPSilver: a cool violet where the world gives
  //  none; the world sets it once with the place's other values. White bark keeps the cool violet everywhere.)
  hemi *= mix(vec3(1.), mix(uPSilver[0] * vPl.x + uPSilver[1] * vPl.y + uPSilver[2] * vPl.z, vec3(0.86, 0.9, 1.3), white), max(silver, white));
  hemi = mix(hemi, vec3(dot(mix(uGndCol, uSkyCol, 0.75), vec3(0.3333))) * vec3(0.96, 1.0, 1.08) * (1.0 + 0.3 * N.y), 0.5 * white);
  vec3 col = alb * (sun * dif * sh + hemi) + sun * rim * sh * 0.5 * (0.3 + alb);
  if (k > 6.5 && k < 7.5) col += mix(uGndCol, uSkyCol, clamp(reflect(-V, N).y * 0.5 + 0.5, 0., 1.)) * (0.5 + 1.5 * fres) + sun * sh * pow(clamp(dot(reflect(-V, N), uSunDir), 0., 1.), 24.) * 1.5;
  vec3 lampL = vLamp.rgb * vLamp.a * uLampGain;
  // (many lamps of three colours together make a paler light than any one of them)
  lampL = mix(lampL, vec3(dot(lampL, vec3(0.3333))) * vec3(1.06, 1.0, 0.9), 0.45);
  col += alb * lampL / (1. + 0.45 * clamp(max(lampL.r, max(lampL.g, lampL.b)), 0., 16.));
  gl_FragColor = vec4(gwFog(col, vW), alpha);
}`;

const LEAF_VERT = /* glsl */`
${GL_PLACE}
uniform float uTime; uniform vec4 uWind;
attribute vec3 iPos, iCol; attribute vec4 iAx, iSz, iLamp, iMass;
varying vec2 vUv; varying vec3 vW, vNc, vNm, vCol, vMisc; varying vec4 vLamp; varying float vTiles;
void main(){
  vec3 n = iAx.xyz; float ph = iSz.w, t = uTime * uWind.w;
  vec4 c0 = modelMatrix * vec4(iPos, 1.);
  float gust = 0.5 + 0.5 * sin(dot(c0.xz, uWind.xy) * 0.03 - t * 0.9 + sin(c0.x * 0.011 + c0.z * 0.007) * 2.);
  float fl = sin(t * 2.3 + ph * 6.283) * 0.6 + sin(t * 3.9 + ph * 17.) * 0.4;
  vec3 ref = abs(n.y) < 0.95 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
  vec3 tx = normalize(cross(ref, n)), bx = cross(n, tx);
  float ca = cos(iAx.w), sa = sin(iAx.w);
  vec3 t2 = tx * ca + bx * sa, b2 = bx * ca - tx * sa;
  float tilt = fl * 0.2 * uWind.z * (0.35 + gust);
  vec3 n2 = normalize(n + t2 * tilt);
  vec3 p = iPos + (t2 * position.x + b2 * position.y) * iSz.x - n * (tilt * position.x * iSz.x);
  float sw = iSz.z * uWind.z;
  p.xz += uWind.xy * sw * (0.6 * sin(t * 0.8 + ph * 6.283 + iPos.y * 0.05) + 0.9 * (gust - 0.5));
  p.y += sw * 0.3 * sin(t * 1.1 + ph * 9.);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; gwPlaces(vW); vNc = normalize(mat3(modelMatrix) * n2); vNm = normalize(mat3(modelMatrix) * iMass.xyz);
  vUv = (position.xy + 0.5) * iSz.y; vCol = iCol; vLamp = iLamp; vTiles = iSz.y;
  vMisc = vec3(ph * 91.7, iMass.w, 0.8 + 0.2 * fl * (0.5 + gust));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LEAF_FRAG = /* glsl */`
${GL_COMMON}
uniform sampler2D uMap; uniform vec4 uCell, uGreen; uniform vec3 uLeafLit;
varying vec2 vUv; varying vec3 vW, vNc, vNm, vCol, vMisc; varying vec4 vLamp; varying float vTiles;
// one lattice of leaf sprays: each tile turned, scaled and shifted by its own hash, some left out, and none
// kept whose centre lies outside the card's ragged round outline. Returns the texel (alpha 0 = nothing); id = tile hash
vec4 gwSpray(vec2 uvt, float seed, vec2 dx, vec2 dy, float cut, float tiles, float far, out float id){
  vec2 cell = floor(uvt), f = fract(uvt);
  float h = gwHash(cell + seed), h2 = fract(h * 7.3), h3 = fract(h * 31.7); id = h;
  vec2 cp = (cell + 0.5) / max(tiles, 1.) - 0.5;
  float many = smoothstep(3.5, 7., tiles);
  float rim = mix(0.8, 0.5 - 0.4 / max(tiles, 1.) - 0.11 * gwNoise(cp * 5. + seed), many);
  if (dot(cp, cp) > rim * rim || fract(h * 57.9) < 0.1 * many) return vec4(0.);
  float ang = h * 6.2832, sc = 0.8 + 0.3 * h2; vec2 g = f - 0.5 - (vec2(h3, fract(h * 113.1)) - 0.5) * (1.1 - sc);
  float ca = cos(ang), sa = sin(ang);
  g = vec2(g.x * ca - g.y * sa, g.x * sa + g.y * ca) / sc;
  // (a round tile: far off, where the leaves of a spray are finer than a pixel, the mass keeps a scalloped edge, not a stepped one)
  if (dot(g, g) > (0.62 + 0.3 * far) * (0.62 + 0.3 * far)) return vec4(0.);
  vec2 cs = uCell.zw - uCell.xy, uv = uCell.xy + clamp(g + 0.5, 0.02, 0.98) * cs;
  vec4 tx = textureGrad(uMap, uv, dx * cs, dy * cs);
  tx.a = max(step(cut, tx.a), smoothstep(0.72, 0.92, far));
  return tx;
}
void main(){
  vec2 cq = vUv / max(vTiles, 1.) - 0.5;
  float er = 0.5 - 0.1 * gwNoise(cq * 7. + vMisc.x);
  if (dot(cq, cq) > er * er) discard;
  gwFade(vW); gwLight();
  vec2 dx = dFdx(vUv), dy = dFdy(vUv);
  float foot = clamp(min(dot(dx, dx), dot(dy, dy)), 1e-8, 1.);
  float far = clamp(0.5 * log2(foot * 65536.) / 6., 0., 1.);
  float cut = mix(0.4, 0.16, far), id;
  vec2 warp = (vec2(gwNoise(vUv * 0.9 + vMisc.x), gwNoise(vUv * 0.9 + vMisc.x + 41.)) - 0.5) * 0.7;
  vec4 tx = gwSpray(vUv + warp, vMisc.x, dx, dy, cut, vTiles, far, id);
  if (tx.a < 0.01) tx = gwSpray(vUv * 0.87 + 0.37 - warp, vMisc.x + 17.3, dx * 0.87, dy * 0.87, cut, vTiles * 0.87, far, id);
  if (tx.a < 0.01) discard;
  float j1 = fract(id * 91.3), j2 = fract(id * 23.7);
  vec3 tone = vCol * (0.8 + 0.4 * j1) * mix(vec3(1.04, 0.9, 0.74), vec3(0.98, 1.06, 1.16), j2);
  if (j2 < uGreen.a) tone = mix(tone, uGreen.rgb * (0.75 + 0.5 * j1), 0.85);
  vec3 V = normalize(cameraPosition - vW), Nm = normalize(vNm), Nc = normalize(vNc);
  float ndl = dot(Nm, uSunDir), lit = smoothstep(-0.5, 0.65, ndl);
  vec3 Nu = Nc * (Nc.y < 0. ? -1. : 1.);
  float sunSide = clamp(dot(Nu, uSunDir) * 1.4 + 0.35, 0., 1.), seeTop = smoothstep(-0.12, 0.12, dot(Nu, V));
  float through = clamp(dot(-V, uSunDir), 0., 1.); through *= through;
  vec3 alb = tone * (0.5 + 0.65 * tx.r);
  vec3 topC = alb * uSunCol * lit * (0.3 + 0.9 * sunSide);
  vec3 underC = alb * mix(alb, vec3(1.), 0.45) * uLeafLit * uSunCol * lit * (0.55 + 0.75 * sunSide) * 1.25;
  vec3 hemi = mix(uGndCol * 1.15, uSkyCol, mix(0.2, Nm.y * 0.5 + 0.5, seeTop)) * (0.5 + 0.5 * vMisc.y);
  vec3 col = mix(underC, topC, seeTop) * vMisc.z + alb * (hemi + uLeafAmb * (0.6 + 0.4 * vMisc.y));
  col += uLeafLit * alb * uSunCol * through * (0.4 + 0.6 * lit) * 1.2 * tx.r;
  // the sky's light on the edge of a mass, and the shade inside it
  float edge = 1. - abs(dot(Nm, V)); col += alb * uSkyCol * edge * edge * (0.25 + 0.75 * vMisc.y) * 0.9;
  vec3 lampL = vLamp.rgb * vLamp.a * uLampGain * 1.5;
  col += alb * lampL / (1. + 0.3 * clamp(max(lampL.r, max(lampL.g, lampL.b)), 0., 16.));
  gl_FragColor = vec4(gwFog(col, vW), 1.);
}`;

// lamps: one instance = one hanging lamp. iHang = hang point, iL = (cord length, body size, phase, the lamp's own
// strength), iCol = colour. Every lamp burns for the whole visit.
// (A lamp swings about its hang point by SWING_A + SWING_B radians at most, and by no more than SWING_M metres to
//  the side, its own breadth: a long cord swings through a smaller angle. swingReach(cord) is how far to the side
//  the lamp goes at its swing's end, the lesser of the two; a lamp's room is asked with it: see swingRoom and sweep.)
const SWING_A = 0.11, SWING_B = 0.045, SWING_M = 0.4, SWING = Math.sin(SWING_A + SWING_B);
export const swingReach = (cord) => Math.min(cord * SWING, SWING_M);
const LAMP_SWING = /* glsl */`
vec3 lampAt(vec3 hang, vec4 L, float time){
  float a = (${SWING_A} * sin(time * 1.25 + L.z * 6.283) + ${SWING_B} * sin(time * 2.9 + L.z * 23.)) * min(1., ${SWING_M} / max(L.x * ${SWING.toFixed(5)}, 1e-3));
  float d = L.z * 40.; vec2 dir = vec2(cos(d), sin(d));
  return hang + vec3(dir.x * sin(a), -cos(a), dir.y * sin(a)) * L.x;
}`;
const LAMPBODY_VERT = /* glsl */`
${GL_PLACE}
uniform float uTime;
attribute vec3 iHang, iCol; attribute vec4 iL;
varying vec3 vW, vN, vCol; varying float vOwn, vY;
${LAMP_SWING}
void main(){
  vec4 h4 = modelMatrix * vec4(iHang, 1.);
  vec3 hang = h4.xyz, c = lampAt(hang, iL, uTime), up = normalize(hang - c);
  vec3 ax = normalize(cross(up, vec3(0.3, 0., 0.95))), az = cross(ax, up);
  vec3 p = c + (ax * position.x + up * position.y + az * position.z) * iL.y; vN = normalize(ax * normal.x + up * normal.y + az * normal.z);
  vW = p; gwPlaces(p); vCol = iCol; vOwn = iL.w; vY = position.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
// the cord a lamp hangs by: a rope 3 cm thick from the lamp's cap to its hang point, its own thickness at every
// distance. From further off than a rope so thin can be seen, it is drawn at the least width that shows and as much
// fainter: a cord is a hair of light against the leaves, never a row of dots. For that the strip it is drawn on is
// wider than the rope by 2 cm for each metre of distance. It is gone between 70 m and 140 m.
const CORD_VERT = /* glsl */`
${GL_PLACE}
uniform float uTime;
attribute vec3 iHang; attribute vec4 iL;
varying vec3 vW; varying float vX;
${LAMP_SWING}
void main(){
  vec4 h4 = modelMatrix * vec4(iHang, 1.);
  vec3 hang = h4.xyz, c = lampAt(hang, iL, uTime), up = normalize(hang - c), toC = cameraPosition - c;
  vec3 side = normalize(cross(up, toC)); float w = 0.03 + length(toC) * 0.02;
  vec3 p = mix(c + up * iL.y * 0.45, hang, position.y) + side * position.x * w;
  vW = p; gwPlaces(p); vX = position.x * w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const CORD_FRAG = /* glsl */`
${GL_COMMON}
varying vec3 vW; varying float vX;
void main(){
  float hw = max(0.015, 0.5 * fwidth(vX)), a = step(abs(vX), hw) * 0.015 / hw * (1. - smoothstep(70., 140., length(cameraPosition - vW)));
  if (a < 0.004) discard;
  gwLight();
  vec3 col = vec3(0.5, 0.48, 0.42) * (mix(uGndCol, uSkyCol, 0.6) + uSunCol * 0.5);
  gl_FragColor = vec4(gwFog(col, vW), a);
}`;
const LAMPBODY_FRAG = /* glsl */`
${GL_COMMON}
varying vec3 vW, vN, vCol; varying float vOwn, vY;
void main(){
  gwFade(vW); gwLight();
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 hemi = mix(uGndCol, uSkyCol, N.y * 0.5 + 0.5) + uSunCol * clamp(dot(N, uSunDir) * 0.7 + 0.3, 0., 1.);
  float on = vOwn, core = clamp(dot(N, V), 0., 1.);
  vec3 paper = mix(vec3(0.8), vCol, 0.45) * hemi * 0.8;
  float cap = step(0.36, abs(vY));
  vec3 col = mix(paper, vec3(0.3, 0.27, 0.22) * hemi, cap) + vCol * on * (1. - cap * 0.85) * (0.7 + 1.0 * core * core);
  gl_FragColor = vec4(gwFog(col, vW), 1.);
}`;
const LAMPGLOW_VERT = /* glsl */`
${GL_PLACE}
uniform float uTime; uniform vec3 uPDen, uPGain;
attribute vec3 iHang, iCol; attribute vec4 iL;
varying vec2 vQ; varying vec3 vCol; varying float vI;
${LAMP_SWING}
void main(){
  vec4 h4 = modelMatrix * vec4(iHang, 1.);
  vec3 c = lampAt(h4.xyz, iL, uTime);
  vec4 mv = viewMatrix * vec4(c, 1.); float dist = max(length(mv.xyz), 0.1);
  // the glow is its own size in metres at every distance (4.4 times the lamp's body)
  float size = iL.y * 4.4;
  float flick = 0.9 + 0.1 * sin(uTime * (2. + fract(iL.z * 13.) * 3.) + iL.z * 80.);
  mv.xyz += normalize(-mv.xyz) * min(iL.y * 1.2, dist * 0.5);
  mv.xy += position.xy * size;
  // (a lamp's light is dimmed by the haze it is seen through, as everything else is, and is as strong as lamps are
  //  in the place where it hangs)
  gwPlaces(c); float den = dot(uPDen, vFg);
  vQ = position.xy * 2.; vCol = iCol; vI = iL.w * flick * dot(uPGain, vPl) * exp(-clamp(den * den * dist * dist, 0., 40.));
  gl_Position = projectionMatrix * mv;
}`;
const LAMPGLOW_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vCol; varying float vI;
void main(){
  float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
  float halo = (1. - r2); halo = halo * halo * 0.11;
  // the bright heart, never drawn thinner than a pixel: where it is, it is spread over the pixel and as much fainter
  // (its true area over the drawn one), so a far lamp thins to a point; but a lamp is a light, and the eye sees a
  // light as a point long after it could see the thing: it never falls under a third (the haze dims it beyond that)
  float w = max(fwidth(vQ.x), fwidth(vQ.y)), s0 = 1. / 60., s1 = s0 + 0.25 * w * w;
  float core = exp(-clamp(r2 / (2. * s1), 0., 40.)) * max(s0 / s1, 0.33) * 1.3;
  gl_FragColor = vec4(vCol * (halo + core) * vI, 1.);
}`;

// ---------------------------------------------------------------------------------------------------------
// Mesh builders. Solid: position, normal, aC (linear albedo), aK (kind, pattern u, pattern v), aLamp (baked lamp
// light rgb, the strength of its house's lamps). Leaves and lamps are instanced.
// ---------------------------------------------------------------------------------------------------------
// the cosine and sine of every corner of a ring of so many sides: [cos 0, sin 0, cos 1, sin 1, ...]
const RING_TRIG = new Map(), ringTrig = (sides) => {
  let a = RING_TRIG.get(sides);
  if (!a) { a = new Float64Array(sides * 2); for (let j = 0; j < sides; j++) { const th = j / sides * TAU; a[2 * j] = Math.cos(th); a[2 * j + 1] = Math.sin(th); } RING_TRIG.set(sides, a); }
  return a;
};
const NO_UV = [0, 0, 0, 0, 0, 0, 0, 0];
class Solid {
  // cap: how many vertices to make room for at the start (the arrays double when they fill)
  constructor(cap = 2048) {
    this.cap = cap; this.p = new Float32Array(this.cap * 3); this.n = new Float32Array(this.cap * 3); this.c = new Float32Array(this.cap * 3); this.k = new Float32Array(this.cap * 3); this.l = new Float32Array(this.cap * 4);
    this.icap = this.cap * 5; this.idx = new Uint32Array(this.icap); this.ni = 0; this.count = 0; this.cost = 0; this.field = null; this.glow = 1; this.kind = 0; this._l = [0, 0, 0];
  }
  _grow() { this.cap *= 2; for (const [key, n] of [['p', 3], ['n', 3], ['c', 3], ['k', 3], ['l', 4]]) { const a = new Float32Array(this.cap * n); a.set(this[key]); this[key] = a; } }
  _growI() { this.icap *= 2; const a = new Uint32Array(this.icap); a.set(this.idx); this.idx = a; }
  v(x, y, z, nx, ny, nz, col, pu = 0, pv = 0) {
    const i = this.count; if (i >= this.cap) this._grow();
    const a = i * 3, b = i * 4, P = this.p, N = this.n, C = this.c, Kk = this.k, L = this.l;
    P[a] = x; P[a + 1] = y; P[a + 2] = z; N[a] = nx; N[a + 1] = ny; N[a + 2] = nz; C[a] = col[0]; C[a + 1] = col[1]; C[a + 2] = col[2]; Kk[a] = this.kind; Kk[a + 1] = pu; Kk[a + 2] = pv;
    if (this.field) { const q = this.field.sample(x, y, z, nx, ny, nz, this._l); L[b] = q[0]; L[b + 1] = q[1]; L[b + 2] = q[2]; this.cost += 2; }
    L[b + 3] = this.glow; this.cost++;
    return this.count++;
  }
  quad(a, b, c, d) { if (this.ni + 6 > this.icap) this._growI(); const I = this.idx, n = this.ni; I[n] = a; I[n + 1] = b; I[n + 2] = c; I[n + 3] = a; I[n + 4] = c; I[n + 5] = d; this.ni = n + 6; }
  tri(a, b, c) { if (this.ni + 3 > this.icap) this._growI(); const I = this.idx, n = this.ni; I[n] = a; I[n + 1] = b; I[n + 2] = c; this.ni = n + 3; }
  get triangles() { return this.ni / 3; }
  // flat quad from four points (counter-clockwise seen from the normal side); pattern coords per corner optional
  face(A, B, C, D, col, uv) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const u = uv || NO_UV;
    const a = this.v(A[0], A[1], A[2], nx, ny, nz, col, u[0], u[1]), b = this.v(B[0], B[1], B[2], nx, ny, nz, col, u[2], u[3]);
    const c = this.v(C[0], C[1], C[2], nx, ny, nz, col, u[4], u[5]), d = this.v(D[0], D[1], D[2], nx, ny, nz, col, u[6], u[7]);
    this.quad(a, b, c, d);
  }
  // round tube through pts with radii rad; col(i, j) -> [r,g,b] or a constant colour
  // (a ring's sines and cosines are worked once for each count of sides (ringTrig), and a ring's corners are numbered
  //  in the order they are made, base + ring * sides + corner: no list of them is kept)
  tube(pts, rad, sides, col, capEnd = true) {
    const N = pts.length, cf = typeof col === 'function' ? col : () => col, perSide = typeof col === 'function' && col.length > 1;
    const cs = ringTrig(sides), base = this.count;
    let ax0 = 1, ax1 = 0, ax2 = 0;
    for (let i = 0; i < N; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (i === 0) { if (Math.abs(ty) > 0.9) { ax0 = 1; ax1 = 0; } else { ax0 = 0; ax1 = 1; } ax2 = 0; }
      const d = ax0 * tx + ax1 * ty + ax2 * tz; let ux = ax0 - tx * d, uy = ax1 - ty * d, uz = ax2 - tz * d; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
      ax0 = ux; ax1 = uy; ax2 = uz;
      const wx = ty * uz - tz * uy, wy = tz * ux - tx * uz, wz = tx * uy - ty * ux, ring = perSide ? null : cf(i, 0), r = rad[i], px = p[0], py = p[1], pz = p[2];
      for (let j = 0; j < sides; j++) {
        const c = cs[2 * j], s = cs[2 * j + 1], nx = ux * c + wx * s, ny = uy * c + wy * s, nz = uz * c + wz * s;
        this.v(px + nx * r, py + ny * r, pz + nz * r, nx, ny, nz, ring || cf(i, j), j / sides, i);
      }
    }
    for (let i = 0; i < N - 1; i++) { const r0 = base + i * sides, r1 = r0 + sides; for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; this.quad(r0 + j, r0 + j1, r1 + j1, r1 + j); } }
    if (capEnd && N > 1) {
      const p = pts[N - 1], a = pts[N - 2]; let tx = p[0] - a[0], ty = p[1] - a[1], tz = p[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1;
      const k = this.v(p[0], p[1], p[2], tx / tl, ty / tl, tz / tl, cf(N - 1, 0), 0, N), r0 = base + (N - 1) * sides;
      for (let j = 0; j < sides; j++) this.tri(k, r0 + j, r0 + (j + 1) % sides);
    }
  }
  // square beam between two points (a strut, a post)
  beam(A, B, w, col) { this.tube([A, B], [w * 0.7, w * 0.7], 4, col, false); }
  geometry() {
    const g = new THREE.BufferGeometry();
    // (views of the builder's own arrays: nothing is copied)
    const n = this.count, at = (a, k) => new THREE.BufferAttribute(a.subarray(0, n * k), k);
    g.setAttribute('position', at(this.p, 3)); g.setAttribute('normal', at(this.n, 3)); g.setAttribute('aC', at(this.c, 3)); g.setAttribute('aK', at(this.k, 3)); g.setAttribute('aLamp', at(this.l, 4));
    g.setIndex(n > 65535 ? new THREE.BufferAttribute(this.idx.subarray(0, this.ni), 1) : new THREE.BufferAttribute(new Uint16Array(this.idx.subarray(0, this.ni)), 1));
    g.boundingSphere = sphereOf(this.p.subarray(0, n * 3), 3, 0);
    return g;
  }
}

const QUAD_POS = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], QUAD_IDX = [0, 1, 2, 0, 2, 3];
function sphereOf(arr, stride, pad) {
  const n = arr.length / stride; if (!n) return new THREE.Sphere(new THREE.Vector3(), 1);
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < n; i++) { const x = arr[i * stride], y = arr[i * stride + 1], z = arr[i * stride + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  return new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + pad);
}
const inst = (arr, n) => new THREE.InstancedBufferAttribute(new Float32Array(arr), n);

class Leaves {
  constructor(cap = 1024) {
    this.cap = cap; this.pos = new Float32Array(this.cap * 3); this.ax = new Float32Array(this.cap * 4); this.sz = new Float32Array(this.cap * 4); this.col = new Float32Array(this.cap * 3);
    this.lamp = new Float32Array(this.cap * 4); this.mass = new Float32Array(this.cap * 4); this.count = 0; this.cost = 0; this.field = null; this.glow = 1; this._l = [0, 0, 0];
  }
  _grow() { this.cap *= 2; for (const [key, n] of [['pos', 3], ['ax', 4], ['sz', 4], ['col', 3], ['lamp', 4], ['mass', 4]]) { const a = new Float32Array(this.cap * n); a.set(this[key]); this[key] = a; } }
  // centre, card normal, spin, size (m), tiles, sway (m), phase 0..1, colour, mass normal, ao 0..1
  add(x, y, z, nx, ny, nz, spin, size, tiles, sway, phase, col, mx, my, mz, ao) {
    const i = this.count; if (i >= this.cap) this._grow();
    const a = i * 3, b = i * 4, P = this.pos, A = this.ax, S = this.sz, C = this.col, L = this.lamp, M = this.mass;
    P[a] = x; P[a + 1] = y; P[a + 2] = z; A[b] = nx; A[b + 1] = ny; A[b + 2] = nz; A[b + 3] = spin; S[b] = size; S[b + 1] = tiles; S[b + 2] = sway; S[b + 3] = phase;
    C[a] = col[0]; C[a + 1] = col[1]; C[a + 2] = col[2]; M[b] = mx; M[b + 1] = my; M[b + 2] = mz; M[b + 3] = ao;
    if (this.field) { const q = this.field.sample(x, y, z, 0, 0, 0, this._l); L[b] = q[0]; L[b + 1] = q[1]; L[b + 2] = q[2]; this.cost += 2; }
    L[b + 3] = this.glow; this.cost += 2;
    this.count++;
  }
  get triangles() { return this.count * 2; }
  geometry() {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(QUAD_POS, 3)); g.setIndex(QUAD_IDX);
    const n = this.count, at = (a, k) => new THREE.InstancedBufferAttribute(a.subarray(0, n * k), k);
    g.setAttribute('iPos', at(this.pos, 3)); g.setAttribute('iAx', at(this.ax, 4)); g.setAttribute('iSz', at(this.sz, 4));
    g.setAttribute('iCol', at(this.col, 3)); g.setAttribute('iLamp', at(this.lamp, 4)); g.setAttribute('iMass', at(this.mass, 4));
    g.instanceCount = n; g.boundingSphere = sphereOf(this.pos.subarray(0, n * 3), 3, 14);
    return g;
  }
}

function lampBodyGeometry() {
  // a five-sided teardrop lantern, height 1
  const p = [], n = [], idx = [], S = 5, rings = [[0.5, 0.05], [0.36, 0.21], [0.06, 0.34], [-0.5, 0.04]];
  for (let i = 0; i < rings.length; i++) for (let j = 0; j < S; j++) {
    const a = j / S * TAU, r = rings[i][1], y = rings[i][0];
    p.push(Math.cos(a) * r, y, Math.sin(a) * r); const ny = i < 2 ? 0.55 : i > 2 ? -0.6 : -0.1, l = Math.hypot(1, ny); n.push(Math.cos(a) / l, ny / l, Math.sin(a) / l);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + (j + 1) % S, c = a + S, d = b + S; idx.push(a, c, b, b, c, d); }
  return { p, n, idx };
}
class Lamps {
  constructor() { this.hang = []; this.L = []; this.col = []; this.count = 0; }
  add(x, y, z, cord, size, phase, own, col) { this.hang.push(x, y, z); this.L.push(cord, size, phase, own); this.col.push(col[0], col[1], col[2]); this.count++; }
  get triangles() { return this.count * 34; }
  geometries() {
    const hang = inst(this.hang, 3), L = inst(this.L, 4), col = inst(this.col, 3), sph = sphereOf(this.hang, 3, 12), B = lampBodyGeometry();
    const body = new THREE.InstancedBufferGeometry();
    body.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); body.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3)); body.setIndex(B.idx);
    const glow = new THREE.InstancedBufferGeometry(), cord = new THREE.InstancedBufferGeometry();
    glow.setAttribute('position', new THREE.Float32BufferAttribute(QUAD_POS, 3)); glow.setIndex(QUAD_IDX);
    // (the cord's quad: x = side -0.5..0.5, y = 0 at the lamp .. 1 at the hang point)
    cord.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); cord.setIndex(QUAD_IDX);
    for (const g of [body, glow, cord]) { g.setAttribute('iHang', hang); g.setAttribute('iL', L); g.setAttribute('iCol', col); g.instanceCount = this.count; g.boundingSphere = sph; }
    return { body, glow, cord };
  }
}

// lamp light field: lamps hashed into cells; sample() sums the light of the lamps near a point (reach 2 x radius)
function makeLampField(cell = LAMP_REACH * 2) {
  const map = new Map(), key = (i, j, k) => ((i + 2048) * 4096 + (j + 2048)) * 4096 + (k + 2048), near = [];
  let ci = NaN, cj = NaN, ck = NaN, cn = -1;
  const field = {
    count: 0,
    add(x, y, z, col, power = 1) {
      const k = key(Math.floor(x / cell), Math.floor(y / cell), Math.floor(z / cell)); let a = map.get(k); if (!a) { a = []; map.set(k, a); }
      a.push(x, y, z, col[0] * power, col[1] * power, col[2] * power); field.count++;
    },
    sample(x, y, z, nx, ny, nz, out) {
      out[0] = 0; out[1] = 0; out[2] = 0; if (!field.count) return out;
      const i0 = Math.floor(x / cell - 0.5), j0 = Math.floor(y / cell - 0.5), k0 = Math.floor(z / cell - 0.5), hasN = nx !== 0 || ny !== 0 || nz !== 0, R = cell * 0.5;
      // the eight cells round a point are looked up once for a run of points that share them (a ring of a bough, a spray)
      if (i0 !== ci || j0 !== cj || k0 !== ck || field.count !== cn) {
        ci = i0; cj = j0; ck = k0; cn = field.count; near.length = 0;
        for (let i = i0; i <= i0 + 1; i++) for (let j = j0; j <= j0 + 1; j++) for (let k = k0; k <= k0 + 1; k++) { const a = map.get(key(i, j, k)); if (a) near.push(a); }
      }
      for (let c = 0; c < near.length; c++) {
        const a = near[c];
        for (let q = 0; q < a.length; q += 6) {
          const dx = a[q] - x, dy = a[q + 1] - y, dz = a[q + 2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > R * R) continue;
          const d = Math.sqrt(d2), fade = 1 - d / R; let w = fade * fade / (1 + d2 * 0.05);
          if (hasN) w *= clamp(0.55 + 0.45 * (dx * nx + dy * ny + dz * nz) / (d + 1e-3), 0.15, 1);
          out[0] += a[q + 3] * w; out[1] += a[q + 4] * w; out[2] += a[q + 5] * w;
        }
      }
      return out;
    },
  };
  return field;
}

// ---------------------------------------------------------------------------------------------------------
// The kit: uniforms, materials and the makers the hero and the world share
// ---------------------------------------------------------------------------------------------------------
export function makeGoldwood(ctx, opts = {}) {
  const P = { ...GOLD_PALETTE, ...(opts.palette || {}) };
  const season = opts.season || 'gold';
  const map = opts.leafMap || flora.makeLeafTexture({});
  const cellUV = flora.LEAF_CELLS.cluster;
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); white.needsUpdate = true;
  // (alone in the viewer there is no roof map: every point is under the open sky and takes the first place's light)
  const noRoof = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat); noRoof.needsUpdate = true;
  const three = (x, y, z) => [0, 1, 2].map(() => new THREE.Vector3(x, y, z));
  const U = {
    uTime: { value: 0 }, uShadeK: { value: 0 }, uSunDir: { value: new THREE.Vector3(-0.6, 0.5, 0.45).normalize() },
    uRoof: { value: noRoof }, uRoofST: { value: new THREE.Vector4(0, 0, 0.5, 0.5) }, uRoofTop: { value: new THREE.Vector2(200, 14) },
    uPSun: { value: three(0.95, 0.72, 0.42) }, uPSky: { value: three(0.2, 0.2, 0.3) }, uPGnd: { value: three(0.2, 0.15, 0.08) }, uPAmb: { value: three(0, 0, 0) }, uPSilver: { value: three(0.86, 0.9, 1.3) },
    uPFog: { value: three(0.6, 0.45, 0.35) }, uPFogCool: { value: three(0.6, 0.45, 0.35) }, uPFogSun: { value: three(0, 0, 0) },
    uPDen: { value: new THREE.Vector3(0.0006, 0.0006, 0.0006) }, uPGain: { value: new THREE.Vector3(1, 1, 1) },
    uFade: { value: new THREE.Vector4(0, 0, 0, 0) }, uWind: { value: new THREE.Vector4(0.8, 0.6, 1, 1) }, uShadeST: { value: new THREE.Vector4(0, 0, 0.5, 0.5) }, uShade: { value: white },
    uMap: { value: map }, uCell: { value: new THREE.Vector4(cellUV[0], cellUV[1], cellUV[2], cellUV[3]) }, uLeafLit: { value: new THREE.Vector3(1.0, 0.86, 0.5) }, uGreen: { value: new THREE.Vector4(P.leafGreen[0], P.leafGreen[1], P.leafGreen[2], season === 'spring' ? 0.42 : 0) },
  };
  const mats = {
    solid: new THREE.ShaderMaterial({ uniforms: U, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, side: THREE.DoubleSide }),
    leaf: new THREE.ShaderMaterial({ uniforms: U, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide }),
    lampBody: new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAMPBODY_VERT, fragmentShader: LAMPBODY_FRAG, side: THREE.DoubleSide }),
    lampGlow: new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAMPGLOW_VERT, fragmentShader: LAMPGLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    // thin white things drawn by coverage: the rope ladders, the lamps' cords
    thin: new THREE.ShaderMaterial({ uniforms: U, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, defines: { THIN: 1 }, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
    cord: new THREE.ShaderMaterial({ uniforms: U, vertexShader: CORD_VERT, fragmentShader: CORD_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
  };
  const sat = (c, k) => { const m = (c[0] + c[1] + c[2]) / 3; return [Math.max(0, m + (c[0] - m) * k), Math.max(0, m + (c[1] - m) * k), Math.max(0, m + (c[2] - m) * k)]; };
  const LAMPC = [mul3(sat(P.lampGreen, 1.5), 1.45), mul3(sat(P.lampGold, 1.35), 1.5), mul3(sat(P.lampSilver, 1.6), 1.2)];
  const pickLamp = (rng, mix) => { const r = rng() * (mix[0] + mix[1] + mix[2]); return r < mix[0] ? 0 : r < mix[0] + mix[1] ? 1 : 2; };
  // (how strongly a thing's lamps burn and light it: a number of its own, 1 where none is given)
  const glowOf = (g) => g ?? 1;
  const LAMP_OWN = [0.8, 0.4];
  const leafCol = (rng, bright = 1) => {
    const r = rng(); let c;
    // early spring: yellow blossom on a fifth of the sprays and the gold paler; deep gold: more of the deep tone
    if (season === 'spring' && r < 0.2) c = mul3(P.blossom, 1.05);
    else if (season === 'spring') c = mix3(mix3(P.leaf, P.leafLit, rng()), P.leafLit, rng() * 0.5);
    else c = mix3(mix3(P.leafDeep, P.leaf, rng() * rng()), P.leafLit, rng() * rng() * 0.45);
    const k = bright * (0.82 + 0.3 * rng()); return [c[0] * k, c[1] * k, c[2] * k];
  };
  // one lamp: instance + light in the field. No two lamps burn alike: each has its own strength, LAMP_OWN[0] to
  // LAMP_OWN[0] + LAMP_OWN[1] of its house's (glow), and its own phase of swing and breath.
  // (room: false where the lamp has no room to hang; its numbers are drawn all the same, and then it is not hung)
  const hangLamp = (L, field, rng, x, y, z, cord, size, mix, glow, room = true) => {
    const ci = pickLamp(rng, mix), w = glowOf(glow) * (LAMP_OWN[0] + LAMP_OWN[1] * rng()), ph = rng();
    if (!room) return;
    L.add(x, y, z, cord, size, ph, w, LAMPC[ci]);
    if (field) field.add(x, y - cord, z, LAMPC[ci], 0.75);
  };
  // THE ROOM OF A LAMP, for its whole swing: the lamp's body (a ball of r) wherever its swing takes it, and its
  // cord, which goes less far the nearer its hang point: asked at the lamp and at every CORD_STEP of the cord above
  // it, each place with the reach of the swing there. clear(x, y, z, r) is the tree's or the hall's test.
  const CORD_STEP = 1.5;
  const swingRoom = (clear, x, y, z, cord, r) => {
    const reach = swingReach(cord);
    if (!clear(x, y - cord, z, r + reach)) return false;
    for (let c = cord - CORD_STEP; c > 0; c -= CORD_STEP) if (!clear(x, y - c, z, 0.05 + reach * c / cord)) return false;
    return true;
  };

  // ------------------------------------------------------------------------------------------- flet: an open platform
  // No platform has a wall or a rail; some carry one plaited screen on one side.
  // o: cx, cy (deck top), cz, rOut, rIn, sx, sz (oval scale), pw (superellipse power), rng, glow, mix, lampEvery (m, 0 = none),
  //    cord [min,max], struts { r, drop, n, skip [[a0,a1],...] } | null, screen [a0,a1] | null, lampSkip [[a0,a1],...],
  //    hatch { a, half, r }: an opening for a ladder, from the inner edge out to r, between the bearings a - half and a + half
  //    underK: how dark a white platform's boards are from below (of UNDER_WHITE; UNDER_K where none is given)
  // FROM BELOW A FLOOR IS CARPENTRY: its underside is drawn as joists, a rim beam and the boards between (the solid
  // shader's kind 8: the pattern's place is the corner's own bearing and reach, as the floor was laid out round);
  // its edge is the rim beam's face, two boards high, on a white floor of silver-grey wood (RIM_K of the bark's
  // colour, as the great platform's edging) and never a white band; a white floor's struts are of that wood too.
  const UNDER_WHITE = mix3(P.white, P.bark, 0.5), UNDER_K = 0.42, RIM_K = 0.72, STRUT_K = 0.6;
  const floorCols = (o) => ({ top: o.white ? P.white : P.wood, under: o.white ? mul3(UNDER_WHITE, o.underK ?? UNDER_K) : mul3(P.woodDark, 0.8), edge: o.white ? mul3(P.bark, RIM_K) : mul3(P.wood, 0.85), strut: o.white ? mul3(P.bark, STRUT_K) : mul3(P.woodDark, 0.9) });
  function flet(o) {
    const { cx, cy, cz, rOut, rIn = 0, rng } = o, sx = o.sx ?? 1, sz = o.sz ?? 1, pw = o.pw ?? 2, n = o.n || Math.max(14, Math.round(rOut * Math.max(sx, sz) * 2.1));
    const hatch = o.hatch ? [[o.hatch.a - o.hatch.half, o.hatch.a + o.hatch.half]] : null;
    const inArc = (a, arcs) => { if (!arcs) return false; for (const [a0, a1] of arcs) { const d = ((a - a0) % TAU + TAU) % TAU; if (d < ((a1 - a0) % TAU + TAU) % TAU) return true; } return false; };
    const rim = (a, r) => { const c = Math.cos(a), s = Math.sin(a), e = 2 / pw; return [cx + Math.sign(s) * Math.pow(Math.abs(s), e) * r * sx, cz + Math.sign(c) * Math.pow(Math.abs(c), e) * r * sz]; };
    const per = TAU * rOut * (sx + sz) / 2;
    let strutPh = 0;
    return {
      // (the floor's place and reach, for what hangs in the tree's own boughs)
      floor: { cx, cy, cz, r: rOut * Math.max(sx, sz), rIn: rIn * Math.min(sx, sz) },
      // the same platform in its plain form, for the tree's far copy: the same outline at a third of its corners, the
      // same screen, the same struts at the same bearings
      plain(fb) {
        fb.glow = glowOf(o.glow);
        const m = Math.max(8, Math.round(n / 3)), { top, under, edge } = floorCols(o), under8 = 8 + rOut / 100;
        for (let i = 0; i < m; i++) {
          const a = i / m * TAU, b = (i + 1) / m * TAU, A = rim(a, rOut), B = rim(b, rOut), Ai = rim(a, rIn), Bi = rim(b, rIn);
          fb.kind = 1; fb.face([A[0], cy, A[1]], [B[0], cy, B[1]], [Bi[0], cy, Bi[1]], [Ai[0], cy, Ai[1]], top, [A[0] - cx, A[1] - cz, B[0] - cx, B[1] - cz, Bi[0] - cx, Bi[1] - cz, Ai[0] - cx, Ai[1] - cz]);
          const sa = Math.sin(a), ca = Math.cos(a), sb2 = Math.sin(b), cb = Math.cos(b), u0 = a / TAU * per, u1 = b / TAU * per;
          fb.kind = under8; fb.face([B[0], cy - 0.4, B[1]], [A[0], cy - 0.4, A[1]], [Ai[0], cy - 0.4, Ai[1]], [Bi[0], cy - 0.4, Bi[1]], under, [sb2 * rOut, cb * rOut, sa * rOut, ca * rOut, sa * rIn, ca * rIn, sb2 * rIn, cb * rIn]);
          fb.kind = 1; fb.face([A[0], cy - 0.4, A[1]], [B[0], cy - 0.4, B[1]], [B[0], cy, B[1]], [A[0], cy, A[1]], edge, [0, u0, 0, u1, 0.4, u1, 0.4, u0]);
          if (o.screen && inArc((a + b) / 2, [o.screen])) { fb.kind = 5; fb.face([A[0], cy, A[1]], [B[0], cy, B[1]], [B[0], cy + 1.8, B[1]], [A[0], cy + 1.8, A[1]], P.screen, [u0, 0, u1, 0, u1, 1.8, u0, 1.8]); }
        }
        if (o.struts) {
          fb.kind = 2; const k = o.struts.n || 6, col = floorCols(o).strut;
          for (let i = 0; i < k; i++) { const a = strutPh + i / k * TAU, q = rim(a, rOut * 0.84); if (inArc(a, o.struts.skip)) continue; fb.tube([[cx + Math.sin(a) * o.struts.r + (o.struts.ox || 0), cy - o.struts.drop, cz + Math.cos(a) * o.struts.r + (o.struts.oz || 0)], [q[0], cy - 0.3, q[1]]], [0.21, 0.21], 3, col, false); }
        }
      },
      lamps(L, field) {
        if (!o.lampEvery) return;
        const m = Math.max(3, Math.round(per / o.lampEvery)), a0 = rng() * TAU, cord = o.cord || [0.7, 1.5];
        for (let i = 0; i < m; i++) { const a = a0 + i / m * TAU, q = rim(a, rOut + 0.25); if (o.lampSkip && inArc(a, o.lampSkip)) continue; hangLamp(L, field, rng, q[0], cy - 0.3, q[1], rng.range(cord[0], cord[1]), o.lampSize || rng.range(0.55, 0.8), o.mix, o.glow); }
      },
      *geometry(sb) {
        sb.glow = glowOf(o.glow);
        const { top, under, edge, strut } = floorCols(o), under8 = 8 + rOut / 100;
        for (let i = 0; i < n; i++) {
          if (i % 8 === 7) yield;
          const a = i / n * TAU, b = (i + 1) / n * TAU, am = (a + b) / 2, ri = hatch && inArc(am, hatch) ? o.hatch.r : rIn, A = rim(a, rOut), B = rim(b, rOut), Ai = rim(a, ri), Bi = rim(b, ri);
          sb.kind = 1; sb.face([A[0], cy, A[1]], [B[0], cy, B[1]], [Bi[0], cy, Bi[1]], [Ai[0], cy, Ai[1]], top, [A[0] - cx, A[1] - cz, B[0] - cx, B[1] - cz, Bi[0] - cx, Bi[1] - cz, Ai[0] - cx, Ai[1] - cz]);
          const sa = Math.sin(a), ca = Math.cos(a), sb2 = Math.sin(b), cb = Math.cos(b), u0 = a / TAU * per, u1 = b / TAU * per, R = rim(a, rOut - 0.14), S = rim(b, rOut - 0.14);
          sb.kind = under8; sb.face([B[0], cy - 0.4, B[1]], [A[0], cy - 0.4, A[1]], [Ai[0], cy - 0.4, Ai[1]], [Bi[0], cy - 0.4, Bi[1]], under, [sb2 * rOut, cb * rOut, sa * rOut, ca * rOut, sa * ri, ca * ri, sb2 * ri, cb * ri]);
          sb.kind = 1; sb.face([A[0], cy - 0.4, A[1]], [B[0], cy - 0.4, B[1]], [B[0], cy, B[1]], [A[0], cy, A[1]], edge, [0, u0, 0, u1, 0.4, u1, 0.4, u0]);
          if (ri > 0) sb.face([Bi[0], cy - 0.4, Bi[1]], [Ai[0], cy - 0.4, Ai[1]], [Ai[0], cy, Ai[1]], [Bi[0], cy, Bi[1]], edge, [0, u1, 0, u0, 0.4, u0, 0.4, u1]);
          if (o.screen && inArc(am, [o.screen])) { sb.kind = 5; sb.face([R[0], cy, R[1]], [S[0], cy, S[1]], [S[0], cy + 1.8, S[1]], [R[0], cy + 1.8, R[1]], P.screen, [u0, 0, u1, 0, u1, 1.8, u0, 1.8]); }
        }
        if (o.struts) {
          sb.kind = 2; const m = o.struts.n || 6, ph = rng() * TAU; strutPh = ph;
          for (let i = 0; i < m; i++) { const a = ph + i / m * TAU, q = rim(a, rOut * 0.84); if (inArc(a, o.struts.skip)) continue; sb.beam([cx + Math.sin(a) * o.struts.r + (o.struts.ox || 0), cy - o.struts.drop, cz + Math.cos(a) * o.struts.r + (o.struts.oz || 0)], [q[0], cy - 0.3, q[1]], 0.3, strut); }
        }
      },
    };
  }

  // a white rope ladder: a strip facing `out` ([x, z] unit) from top to bottom, into a builder that becomes a mesh of
  // the thin material (the ropes and rungs are drawn on the strip, see the solid shader)
  function ladder(sb, x, yTop, yBot, z, out, width = 0.9, glow = 1) {
    sb.kind = 4 + width * 0.1; sb.glow = glow; const px = out[1], pz = -out[0], h = width / 2, len = yTop - yBot;
    sb.face([x - px * h, yBot, z - pz * h], [x + px * h, yBot, z + pz * h], [x + px * h, yTop, z + pz * h], [x - px * h, yTop, z - pz * h], P.white, [0, 0, width, 0, width, len, 0, len]);
  }

  // ------------------------------------------------------------------------------------------- a silver giant
  // o: x, y, z (foot), H, R (trunk radius at breast height), lod 0 far | 1 near | 2 close | 3 hero, rng,
  //    solid, leaves, lamps (builders), field (lamp field or null), glow (the strength of its lamps: a number), mix (lamp colour weights),
  //    tiers [{ h, n, L, rise, curl, cards, size, tiles }] (default: by lod), crownBase 0..1, clear(x,y,z,r) -> bool,
  //    leafClear(x,y,z,r) -> bool (asked of leaf cards only, after clear: the wider room a place keeps free of leaf masses),
  //    boughLamps (count), flets [flet options without cx/cz], tint, sway, top (false = no top tuft),
  //    roots (false = none, true = also on a plainer tree), body (true = a second card across each spray; default: a full tree),
  //    twigUp [min, max] (how steeply the twigs sweep up, as a share of their length),
  //    twigPlain (true = each twig one straight three-sided length, for a tree of many fine twigs),
//    bare (the share of each bough's length, from the bole, that carries no spray: 0.24),
//    fineAt(x, y, z) -> bool (where a spray over FINE_CARD across is laid as several small ones: near the route),
//    trunkR(h) (the trunk's own radius at a height, where it is not the common profile),
//    spread, sprayK (a crown broader or narrower than its tree would grow it: its boughs' reach times spread, its
//      sprays' size times sprayK; neither takes a number from the tree's stream),
//    ground(x, z) -> y (the world's ground at a place: where it is given, the foot's bottom ring is sunk under the
//      ground at each of its own corners and every root's tip goes into the ground at its own place; where it is
//      not, both are laid from the tree's own foot, o.y, as on level ground),
//    far { solid, leaves, sides, every, bSeg } (also make the plain copy for far away: see the end of growSteps)
  function* growSteps(o) {
    const rng = o.rng, H = o.H, R = o.R, lod = o.lod ?? 1, sb = o.solid, lb = o.leaves, clear = o.clear || null, leafOK = o.leafClear || null;
    const tc = o.crownBase ?? rng.range(0.44, 0.56), tint = o.tint ?? rng.range(0.9, 1.06), bendA = rng() * TAU, bendK = (o.bend ?? 0.012) * H, ph0 = rng() * TAU;
    const centre = (h) => { const t = h / H, s = Math.sin(t * 2.4 + ph0) * t; return [o.x + Math.cos(bendA) * bendK * s, o.y + h, o.z + Math.sin(bendA) * bendK * s]; };
    const trunkR = o.trunkR || ((h) => trunkRadius(R, H, tc, h));
    const sway = o.sway ?? 1;
    // (THE FOOT ON A SLOPE. gAt: how far the ground at a place lies over or under the tree's own foot; footY: the
    //  height of a corner of the trunk's bottom ring, as far under the ground at that corner as under the foot,
    //  whichever is lower: on the low side of a slope the ring is sunk with the ground and never shows)
    const gnd = o.ground || null, gAt = (x, z) => (gnd ? gnd(x, z) - o.y : 0), footY = (x, z, h) => o.y + Math.min(0, gAt(x, z)) + h;
    // ---- skeleton: tiers of boughs
    const nT = lod === 0 ? 3 : lod === 1 ? 4 : 5, Lmax = (o.Lmax ?? H * rng.range(0.3, 0.36)) * (o.spread ?? 1), sprayK = o.sprayK ?? 1;
    const tiers = o.tiers || Array.from({ length: nT }, (_, i) => { const f = i / (nT - 1); return { h: H * (tc + (0.95 - tc) * Math.pow(f, 0.9)), n: lod === 0 ? 4 : lod === 1 ? 4 : 6, L: Lmax * (1 - 0.7 * Math.pow(f, 1.4)), rise: lerp(0.16, 0.42, f), curl: 0.1 }; });
    const boughs = [], nSeg = lod === 0 ? 2 : lod === 1 ? 4 : lod === 2 ? 5 : 7;
    // (the loops below call small functions: the engine speeds up a small function long before a long generator)
    const addBough = (T, ti, a0, b) => {
        const az = T.az ? T.az[b] : a0 + (b + rng.range(-0.28, 0.28)) / T.n * TAU, L = T.L * rng.range(0.82, 1.12), rb = Math.max(0.16, trunkR(T.h) * (T.thick ?? 0.36) * rng.range(0.85, 1.1));
        const wig = rng.range(-1, 1), ph = rng() * 6, rise = (T.rise ?? 0.25) * rng.range(0.8, 1.2), curl = T.curl ?? 0.1, c0 = centre(T.h), r0 = trunkR(T.h) * 0.5;
        const pts = [], rad = [];
        for (let i = 0; i <= nSeg; i++) {
          const s = i / nSeg, a = az + wig * 0.2 * Math.sin(s * 2.6 + ph), rr = r0 + L * s;
          const x = c0[0] + Math.sin(a) * rr, z = c0[2] + Math.cos(a) * rr, y = c0[1] + L * (rise * s + curl * s * s) - (T.sag ?? 0) * Math.sin(s * Math.PI), r = rb * (1 - 0.82 * s);
          if (clear && i > 0 && !clear(x, y, z, r + 0.6)) break;
          pts.push([x, y, z]); rad.push(r);
        }
        // (a bough ends where the place's clearance, clear, ends it and nowhere else. One that stops short of its
        //  length so narrows to a tip; one that stops within the share of its length that carries no leaf (bare)
        //  would be a stump: it is not grown)
        if (T.cards !== 0 && pts.length <= nSeg && (pts.length - 1) / nSeg <= (o.bare ?? 0.24)) return;
        if (pts.length >= 2 && pts.length <= nSeg) rad[rad.length - 1] = Math.min(rad[rad.length - 1], 0.1);
        if (pts.length >= 2) boughs.push({ pts, rad, az, L, T, ti, frac: (pts.length - 1) / nSeg, rise, curl, wig, ph, c0, r0 });
    };
    for (let ti = 0; ti < tiers.length; ti++) { const T = tiers[ti], a0 = rng() * TAU; for (let b = 0; b < T.n; b++) addBough(T, ti, a0, b); if (lod >= 3) yield 'now'; }
    // (point on a bough at s (may exceed its truncated end; callers test clear))
    const boughAt = (B, s) => {
      const a = B.az + B.wig * 0.2 * Math.sin(s * 2.6 + B.ph), rr = B.r0 + B.L * s;
      return [B.c0[0] + Math.sin(a) * rr, B.c0[1] + B.L * (B.rise * s + B.curl * s * s) - (B.T.sag ?? 0) * Math.sin(Math.min(s, 1) * Math.PI), B.c0[2] + Math.cos(a) * rr, a];
    };
    // (a hand-back when the skeleton is grown; and wherever a tree's own parts ask for one as they are planned:
    //  o.parts may hand its parts back one by one, with a null between them where it has worked long. These are
    //  hand-backs of PLANNING, in which nothing is made that the pacer could count: 'now' asks for one outright,
    //  through o.handBack where the tree has it: see growTreeAsync)
    yield 'now';
    // ---- lamps first (so that everything built after them is lit by them)
    const field = o.field || null, flets = (o.flets || []).map((f) => { const c = centre(f.h); return flet({ rng, glow: o.glow, mix: o.mix, ...f, cx: c[0] + (f.ox || 0), cy: c[1], cz: c[2] + (f.oz || 0) }); });
    if (o.parts) for (const q of o.parts({ boughs, boughAt, centre, trunkR })) { if (q) flets.push(q); else yield 'now'; }
    yield;
    const hung = [];
    if (o.lamps) {
      for (const f of flets) if (f.lamps) { f.lamps(o.lamps, field); yield; }
      // A BOUGH'S LAMP HANGS CLEAR OF ITS OWN TREE (ownRoom): its body and whole swing (LAMP_ROOM: 0.6 and SWING_M) off
      // the trunk as the trunk is at the lamp's height, on the trunk's own line; and neither its cord nor its body
      // through a platform's floor of its tree or within the body's room over one (a lamp does not lie on a floor).
      const LAMP_ROOM = 0.6 + SWING_M, footK = (o.flare ?? 1.2) * (lod === 0 ? 0.7 : 1);
      const ownRoom = (x, y, z, cord) => {
        const hl = clamp(y - cord - o.y, 0, H), c = centre(hl);
        if (Math.hypot(x - c[0], z - c[2]) < trunkR(hl) * (1 + footK * Math.exp(-hl / (R * 1.15))) * 1.035 + LAMP_ROOM) return false;
        for (const f of flets) { const F = f.floor; if (!F) continue; const d = Math.hypot(x - F.cx, z - F.cz); if (d < F.r + LAMP_ROOM && d > F.rIn - LAMP_ROOM && y > F.cy - 0.4 && y - cord - 0.6 < F.cy + 0.6) return false; }
        return true;
      };
      const hangOne = () => {
        const B = boughs[rng.int(0, boughs.length - 1)], s = rng.range(0.12, 0.95) * B.frac, q = boughAt(B, s), cord = rng.range(1.2, o.cordMax ?? 4.5), side = rng.range(-1, 1) * (1 + B.L * 0.1 * s);
        const x = q[0] + Math.cos(q[3]) * side, z = q[2] - Math.sin(q[3]) * side, y = q[1] - 0.3;
        // (its 1.6 m holds the lamp's body and its whole swing: 0.6 and SWING_M)
        const ok = (!clear || clear(x, y - cord, z, 1.6)) && ownRoom(x, y, z, cord);
        hangLamp(o.lamps, field, rng, x, y, z, cord, rng.range(0.6, 0.95) * (o.lampScale ?? 1), o.mix, o.glow, ok);
        if (ok) hung.push(x, y, z, cord);
      };
      for (let i = 0, n = o.boughLamps || 0; i < n && boughs.length; i++) { if (i % 8 === 7) yield; hangOne(); }
    }
    if (o.extraLamps) o.extraLamps(field);
    sb.field = field; lb.field = field; sb.glow = lb.glow = glowOf(o.glow);
    yield;
    // (a part's making may be a generator of its own: it hands back inside itself)
    for (const f of flets) if (f.geometry) { const g = f.geometry(sb, lb); if (g && typeof g.next === 'function') yield* g; yield; }
    sb.glow = lb.glow = glowOf(o.glow);
    // ---- trunk (o.barkKind: the kind of its bark, 0 silver by default, 3 snow-white)
    sb.kind = o.barkKind ?? 0;
    const bark = mul3(o.bark || P.bark, tint), sides = [7, 10, 14, 28][lod];
    const ts = lod === 0 ? [-0.02, 0.03, 0.1, 0.32, 0.62, 1] : lod === 1 ? [-0.02, 0.015, 0.05, 0.12, 0.3, 0.55, 0.8, 1] : lod === 2 ? [-0.015, 0.008, 0.02, 0.04, 0.07, 0.12, 0.2, 0.32, 0.46, 0.6, 0.74, 0.88, 1]
      : [-0.015, 0.006, 0.016, 0.03, 0.05, 0.08, 0.13, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.96, 1];
    const nL = rng.int(5, 8), lph = rng() * TAU, lph2 = rng() * TAU, fl0 = (o.flare ?? 1.2) * (lod === 0 ? 0.7 : 1);
    const grid = [];
    const trunkRing = (i) => {
      const h = ts[i] * H, c = centre(Math.max(h, 0)), r = trunkR(Math.max(h, 0)), f = fl0 * Math.exp(-Math.max(h, 0) / (R * 1.15)), row = [];
      for (let j = 0; j < sides; j++) {
        const th = j / sides * TAU, lobe = lod === 0 ? 0.5 : Math.pow(0.5 + 0.5 * Math.cos(nL * th + lph + 1.3 * Math.sin(th * 2 + lph2)), 1.6);
        const rr = r * (1 + f * (0.3 + 0.7 * lobe)) * (1 + 0.035 * Math.sin(th * 3 + h * 0.07 + lph));
        const vx = c[0] + Math.sin(th) * rr, vz = c[2] + Math.cos(th) * rr;
        row.push([vx, h < 0 ? footY(vx, vz, h) : c[1], vz]);
      }
      grid.push(row);
    };
    for (let i = 0; i < ts.length; i++) trunkRing(i);
    const vi = [];
    const trunkRow = (i) => {
      const row = [], h = ts[i] * H, t = ts[i];
      const shade = (0.62 + 0.38 * smoothstep(0, R * 2.2, h)) * (1 - 0.3 * smoothstep(tc - 0.12, tc + 0.2, t));
      for (let j = 0; j < sides; j++) {
        const p = grid[i][j], pa = grid[i][(j + 1) % sides], pb = grid[i][(j + sides - 1) % sides], pu = grid[Math.min(i + 1, ts.length - 1)][j], pd = grid[Math.max(i - 1, 0)][j];
        const ax = pa[0] - pb[0], ay = pa[1] - pb[1], az = pa[2] - pb[2], bx = pu[0] - pd[0], by = pu[1] - pd[1], bz = pu[2] - pd[2];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= -l; ny /= -l; nz /= -l;
        const th = j / sides * TAU; if (nx * Math.sin(th) + nz * Math.cos(th) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const moss = smoothstep(R * 1.6, 0, h) * 0.5, c = mix3(mul3(bark, shade * (0.93 + 0.14 * hash1(i * 31.7 + j * 7.3 + lph))), [0.13, 0.17, 0.08], moss);
        row.push(sb.v(p[0], p[1], p[2], nx, ny, nz, c, j / sides, h));
      }
      vi.push(row);
    };
    for (let i = 0; i < ts.length; i++) { if (lod >= 2 && i % 2 === 1) yield; trunkRow(i); }
    const trunkQuads = () => { for (let i = 0; i < ts.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; sb.quad(vi[i][j], vi[i][j1], vi[i + 1][j1], vi[i + 1][j]); } };
    trunkQuads();
    yield;
    // roots running out from the foot
    // (farRoots, farCards: what the plain copy takes of this tree, kept as it is made: see the plain copy below)
    const farRoots = o.far ? [] : null, farCards = o.far ? [] : null, farShare = (o.far && o.far.share) || 2, rootCol = (k) => mix3(mul3(bark, 0.7), [0.15, 0.16, 0.09], k * 0.2);
    const root = (i, n) => {
      const a = lph + (i + rng.range(-0.3, 0.3)) / n * TAU, len = R * rng.range(2.6, 4.2), dx = Math.sin(a), dz = Math.cos(a), c = centre(0);
      // (A ROOT LIES ON THE GROUND IT RUNS OVER: off the flare it follows the ground at its own places, and its tip
      //  goes into the ground where the tip is)
      const at = (d) => [c[0] + dx * d, c[2] + dz * d], q1 = at(R * 1.7), q2 = at(len * 0.75), q3 = at(len);
      const pts = [[c[0] + dx * R * 0.7, o.y + R * 1.5, c[2] + dz * R * 0.7], [q1[0], o.y + R * 0.45 + 0.6 * gAt(q1[0], q1[1]), q1[1]], [q2[0], o.y + gAt(q2[0], q2[1]) + R * 0.02, q2[1]], [q3[0], o.y + gAt(q3[0], q3[1]) - R * 0.5, q3[1]]];
      // (A root keeps its own thickness and ROOT_ROOM from the route's line. It is laid out whole, then asked along
      // its length, three places to each stretch between its points: it is cut back to the last point before the
      // first place that is too near, and narrows to its tip there; cut back to its first point it is not grown.
      // o.clear answers false within its radius and 6 m of the line.)
      const rad = [R * 0.5, R * 0.36, R * 0.22, R * 0.08]; let keep = pts.length;
      if (clear) {
        for (let k = 0; k < pts.length - 1 && keep === pts.length; k++) for (let j = 0; j <= 3; j++) {
          const t = j / 3, a0 = pts[k], b0 = pts[k + 1];
          if (!clear(lerp(a0[0], b0[0], t), lerp(a0[1], b0[1], t), lerp(a0[2], b0[2], t), lerp(rad[k], rad[k + 1], t) + ROOT_ROOM - 6)) { keep = j === 0 ? k : k + 1; break; }
        }
      }
      if (keep < 2) return;
      // (a root cut back ends in the ground too: its last point goes down into the ground at its own place)
      if (keep < pts.length) { pts.length = keep; rad.length = keep; rad[keep - 1] = R * 0.08; const e = pts[keep - 1]; e[1] = Math.min(e[1], o.y + gAt(e[0], e[2]) - R * 0.3); }
      sb.tube(pts, rad, lod === 3 ? 8 : lod === 2 ? 6 : 5, rootCol, false);
      if (farRoots) farRoots.push([pts, rad]);
    };
    if ((lod >= 2 && o.roots !== false) || o.roots === true) for (let i = 0, n = lod === 3 ? 9 : lod === 2 ? 6 : 5; i < n; i++) { root(i, n); if (lod >= 2 && i % 3 === 2) yield; }
    // ---- boughs and their twigs
    const bSides = o.bSides ?? [3, 3, 5, 8][lod], nTwig = o.twigs ?? [0, 1, 2, 5][lod];
    yield;
    const boughMesh = (B) => {
      const bc = mul3(bark, 0.74 + 0.1 * rng()); B.twigs = [];
      sb.tube(B.pts, B.rad, bSides, (i) => mul3(bc, 1 - 0.12 * i / nSeg));
      for (let k = 0, m = nTwig; k < m; k++) {
        const s = (0.34 + 0.56 * (k + rng()) / m) * B.frac, q = boughAt(B, s), sd = k % 2 ? 1 : -1, a = q[3] + sd * rng.range(0.6, 1.1), len = B.L * rng.range(0.22, 0.36) * (1.15 - s), r = Math.max(0.07, B.rad[0] * (1 - 0.8 * s) * 0.55);
        const e = [q[0] + Math.sin(a) * len, q[1] + len * (o.twigUp ? rng.range(o.twigUp[0], o.twigUp[1]) : rng.range(0.1, 0.34)), q[2] + Math.cos(a) * len], m1 = [(q[0] + e[0]) / 2, (q[1] + e[1]) / 2 + len * 0.06, (q[2] + e[2]) / 2];
        if (clear && !clear(e[0], e[1], e[2], 1)) continue;
        B.twigs.push([q[0], q[1], q[2], e[0], e[1], e[2]]);
        // (a tree of many fine twigs, o.twigPlain, has each as one straight three-sided length, open at its tip: a twig's tip is 2 to 6 cm across)
        if (o.twigPlain) sb.tube([[q[0], q[1], q[2]], e], [r, r * 0.2], 3, bc, false);
        else sb.tube(lod >= 2 ? [[q[0], q[1], q[2]], m1, e] : [[q[0], q[1], q[2]], e], lod >= 2 ? [r, r * 0.6, r * 0.2] : [r, r * 0.25], lod >= 3 ? 4 : 3, bc);
      }
    };
    for (const B of boughs) { yield; boughMesh(B); }
    // ---- leaves: flat sprays lying along each bough, tier over tier
    const perB = [6, 17, 26, 96][lod], defSize = [[12, 17], [8.5, 12.5], [5, 7.5], [3.4, 5.2]][lod], defTiles = [10, 7, 4, 3][lod];
    const body = o.body ?? lod >= 2, bare = o.bare ?? 0.24;
    // Near the route (o.fineAt(x, y, z), the world's rule in space) no spray is one great card: a card over FINE_CARD
    // across is laid there as several smaller ones about its place in its own plane, each 0.36 to 0.5 of it with as
    // many fewer tiles (its leaves stay their size), each tilted a little its own way.
    // (The small cards take no number from the tree's stream: they are dealt from the great card's own two numbers,
    // its turn and its phase, so that a tree's later sprays do not depend on where the route passes.)
    const fineAt = o.fineAt || null;
    // EVERY CLUMP OF LEAVES HANGS ON ITS OWN BOUGH AS DRAWN: one rule for every tree, wherever it stands. A spray
    // (a mass: all its cards together) touches the wood that carries it: its middle lies within half its breadth
    // and HANG_PLAY of its bough's own line as drawn (through the bough's drawn points, from the bole to where the
    // bough stops: a bough cut short carries nothing past its end) or of one of that bough's drawn twigs; the
    // top's tuft, of the bole's last tenth. A clump dealt further off than that, which would hang in the air
    // metres from any drawn wood, IS BROUGHT IN TO ITS BOUGH, after every one of its draws: straight toward the
    // nearest place on that wood until its edge is on it (half its breadth off). So no leaf of any tree hangs
    // free of its tree (rehung counts the clumps brought in). Its room is asked where it then hangs.
    const HANG_PLAY = 0.3, _hb = { d: 0, x: 0, y: 0, z: 0 }; let rehung = 0;
    const segNear = (x, y, z, ax, ay, az, bx, by, bz, b) => { const dx = bx - ax, dy = by - ay, dz = bz - az, f = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / Math.max(dx * dx + dy * dy + dz * dz, 1e-9))), px = ax + dx * f, py = ay + dy * f, pz = az + dz * f, d = Math.hypot(x - px, y - py, z - pz); if (d < b.d) { b.d = d; b.x = px; b.y = py; b.z = pz; } };
    const nearBough = (B, x, y, z, b) => { b.d = Infinity; const p = B.pts; for (let i = 1; i < p.length; i++) segNear(x, y, z, p[i - 1][0], p[i - 1][1], p[i - 1][2], p[i][0], p[i][1], p[i][2], b); for (const t of B.twigs || []) segNear(x, y, z, t[0], t[1], t[2], t[3], t[4], t[5], b); return b; };
    // (the way a clump is brought in, or null where it hangs as dealt)
    const hangOn = (B, x, y, z, sz) => {
      // (the search along the bough's drawn wood is work the pacer is told of, as a card's own making is)
      lb.cost += 1 + ((B.pts.length + (B.twigs ? B.twigs.length : 0)) >> 1);
      if (nearBough(B, x, y, z, _hb).d <= sz * 0.5 + HANG_PLAY) return null;
      rehung++; const k = 1 - sz * 0.5 / _hb.d; return [(_hb.x - x) * k, (_hb.y - y) * k, (_hb.z - z) * k];
    };
    const addSpray = (x, y, z, nx, ny, nz, spin, sz, tl, sw, ph, col, mx, my, mz, ao) => {
      if (!fineAt || sz <= FINE_CARD || !fineAt(x, y, z)) { lb.add(x, y, z, nx, ny, nz, spin, sz, tl, sw, ph, col, mx, my, mz, ao); return; }
      const m = Math.round(sz * sz / 12), rx = Math.abs(ny) < 0.95 ? 0 : 1, ry = 1 - rx;
      let tx = ry * nz, ty = -rx * nz, tz = rx * ny - ry * nx; const tl2 = Math.hypot(tx, ty, tz) || 1; tx /= tl2; ty /= tl2; tz /= tl2;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      let hs = (spin * 0.1591549 + ph * 7.31) % 1;
      const u = () => { hs = (hs * 9301.37 + 0.2113) % 1; return hs; }, g = () => (u() + u() + u() - 1.5) * 2;
      for (let j = 0; j < m; j++) {
        const a = u() * TAU, r = sz * 0.42 * Math.sqrt(u()), k = 0.36 + 0.14 * u(), ou = Math.cos(a) * r, ov = Math.sin(a) * r, lift = u() * 1.2 - 0.6;
        let qx = nx + g() * 0.25, qy = ny + g() * 0.12, qz = nz + g() * 0.25; const ql = Math.hypot(qx, qy, qz) || 1;
        lb.add(x + tx * ou + bx * ov + nx * lift, y + ty * ou + by * ov + ny * lift, z + tz * ou + bz * ov + nz * lift, qx / ql, qy / ql, qz / ql, u() * TAU, sz * k, Math.max(2, tl * k), sw, u(), mul3(col, 0.88 + 0.24 * u()), mx, my, mz, ao);
      }
    };
    const spray = function* (B) {
      const T = B.T, n = Math.round((T.cards ?? perB) * (o.leafK ?? 1) * (0.6 + 0.4 * B.L / (tiers[0].L || B.L))), size = T.size || defSize, tiles = T.tiles || defTiles;
      for (let k = 0; k < n; k++) {
        if (k % 8 === 7) yield;
        const s = bare + (1.1 - bare) * Math.sqrt(rng()), q = boughAt(B, s), lat = rng.gauss() * (0.9 + B.L * (T.spread ?? 0.2) * Math.min(s, 1)), sz = rng.range(size[0], size[1]) * sprayK;
        let x = q[0] + Math.cos(q[3]) * lat, z = q[2] - Math.sin(q[3]) * lat, y = q[1] + rng.range(-0.9, 1.7) + (T.dome ?? 0.06) * B.L * (1 - Math.abs(lat) / (B.L * 0.3 + 1));
        const ox = Math.sin(q[3]), oz = Math.cos(q[3]);
        let nx = rng.gauss() * 0.3 + ox * 0.32 * s, ny = 1, nz = rng.gauss() * 0.3 + oz * 0.32 * s; const nl = Math.hypot(nx, ny, nz);
        let mx = ox * 0.5 * s + rng.gauss() * 0.12, my = 0.8, mz = oz * 0.5 * s + rng.gauss() * 0.12; const ml = Math.hypot(mx, my, mz);
        const sw = (0.25 + 0.5 * s) * sway * Math.min(1.5, B.L / 20), ao = 0.45 + 0.55 * Math.min(s, 1);
        const spin = rng() * TAU, ph = rng(), col = (o.leafCol || leafCol)(rng, 0.8 + 0.25 * Math.min(s, 1));
        // a full tree's spray has body: a second, smaller card stands across the first on a bearing of its own, a little
        // below it and darker (the shade inside the mass), so that no spray is one flat sheet from any side
        const b2 = body ? [rng() * TAU, rng.range(0.15, 0.5), sz * rng.range(0.62, 0.82), rng.range(-0.6, 0.6), rng.range(-0.6, 0.6), rng() * TAU, rng(), (o.leafCol || leafCol)(rng, 0.62 + 0.2 * Math.min(s, 1))] : null;
        // (every number of the spray is drawn by now: where it hangs on its bough, and whether it has room there, are asked last)
        const hg = hangOn(B, x, y, z, sz); if (hg) { x += hg[0]; y += hg[1]; z += hg[2]; }
        if ((clear && !clear(x, y, z, sz * 0.55)) || (leafOK && !leafOK(x, y, z, sz * 0.55))) continue;
        addSpray(x, y, z, nx / nl, ny / nl, nz / nl, spin, sz, tiles, sw, ph, col, mx / ml, my / ml, mz / ml, ao);
        if (farCards && k % farShare === 0) farCards.push([x, y, z, nx / nl, ny / nl, nz / nl, spin, sz, tiles, sw, ph, col, mx / ml, my / ml, mz / ml, ao]);
        if (b2) { const ul = Math.hypot(1, b2[1]); addSpray(x + b2[3], y - b2[2] * 0.22, z + b2[4], Math.sin(b2[0]) / ul, b2[1] / ul, Math.cos(b2[0]) / ul, b2[5], b2[2], tiles, sw, b2[6], b2[7], mx / ml, my / ml, mz / ml, ao * 0.6); }
      }
    };
    // LEAF MASSES (o.masses: the great tree and the city's trees, which the flight passes level with their boughs).
    // A bough's leaves stand in rounded masses along it, each on its own twig's lift: a mass is MASS cards about one
    // middle: a cap over it leaning out along the bough, three skirts about it, each leaning outward on its own
    // bearing (40 to 65 degrees from upright) a little lower, and one flat under them, darker: the shade inside.
    // Each card is lit as a face of its MASS (the way from the mass's middle to the card), so a mass has a lit side
    // and a shaded one from wherever it is seen, and no bough is a stack of level sheets. The masses lie thicker
    // toward the bough's end, as the sprays do; the plain copy keeps the cap of every `share`-th mass, a third larger.
    const MASS = 5;
    const sprayMass = function* (B) {
      const T = B.T, n = Math.round((T.cards ?? perB) * (o.leafK ?? 1) * (0.6 + 0.4 * B.L / (tiers[0].L || B.L))), size = T.size || defSize, tiles = T.tiles || defTiles, M = Math.max(1, Math.round(n / MASS));
      for (let j = 0; j < M; j++) {
        if (j % 3 === 2) yield;
        const s = bare + (1.1 - bare) * Math.sqrt((j + rng()) / M), q = boughAt(B, s), lat = rng.gauss() * (0.9 + B.L * (T.spread ?? 0.2) * Math.min(s, 1)), sz = rng.range(size[0], size[1]) * sprayK;
        let cx = q[0] + Math.cos(q[3]) * lat, cz = q[2] - Math.sin(q[3]) * lat, cy = q[1] + rng.range(0.3, 1.9) + (T.dome ?? 0.06) * B.L * (1 - Math.abs(lat) / (B.L * 0.3 + 1));
        const ox = Math.sin(q[3]), oz = Math.cos(q[3]), a0 = rng() * TAU, sw = (0.25 + 0.5 * s) * sway * Math.min(1.5, B.L / 20), ao = 0.45 + 0.55 * Math.min(s, 1), bright = 0.8 + 0.25 * Math.min(s, 1);
        // (a mass hangs on its bough as a whole: asked of its middle, once, and all its cards come with it)
        const hg = hangOn(B, cx, cy, cz, sz); if (hg) { cx += hg[0]; cy += hg[1]; cz += hg[2]; }
        for (let k = 0; k < MASS; k++) {
          // (k 0: the cap; 1 to 3: the skirts; 4: the under side. Every number of a card is drawn before its room is asked.)
          const a = a0 + k * TAU / 3 + rng.range(-0.35, 0.35), lean = k === 0 ? rng.range(0.1, 0.35) : k === 4 ? rng.range(0, 0.2) : rng.range(0.7, 1.13), out = k === 0 || k === 4 ? 0 : sz * rng.range(0.3, 0.46);
          const ax = k === 0 ? ox : Math.sin(a), az = k === 0 ? oz : Math.cos(a), sl = Math.sin(lean), cl = Math.cos(lean);
          const x = cx + ax * out + rng.range(-0.3, 0.3), y = cy + (k === 0 ? sz * 0.16 : k === 4 ? -sz * 0.3 : -sz * rng.range(0.05, 0.2)), z = cz + az * out + rng.range(-0.3, 0.3);
          const csz = sz * (k === 0 ? 1 : k === 4 ? 0.9 : rng.range(0.7, 0.86)), spin = rng() * TAU, ph = rng(), col = (o.leafCol || leafCol)(rng, k === 4 ? bright * 0.72 : bright * (k === 0 ? 1.04 : 0.96));
          // (the mass's own face there: outward from its middle and up; the under side looks down and out)
          let mx = ax * (k === 0 ? 0.3 : 0.8), my = k === 4 ? -0.3 : k === 0 ? 0.95 : 0.6, mz = az * (k === 0 ? 0.3 : 0.8); const ml = Math.hypot(mx, my, mz) || 1; mx /= ml; my /= ml; mz /= ml;
          if ((clear && !clear(x, y, z, csz * 0.55)) || (leafOK && !leafOK(x, y, z, csz * 0.55))) continue;
          addSpray(x, y, z, ax * sl, cl, az * sl, spin, csz, tiles, sw, ph, col, mx, my, mz, k === 4 ? ao * 0.55 : ao);
          if (farCards && k === 0 && j % farShare === 0) farCards.push([x, y, z, ax * sl, cl, az * sl, spin, csz * 1.33, tiles, sw, ph, col, mx, my, mz, ao]);
        }
      }
    };
    for (const B of boughs) { yield; if (o.masses) yield* sprayMass(B); else yield* spray(B); }
    // (a tuft closing the top)
    const tuft = () => {
      const c = centre(H * 0.985), n = [4, 7, 14, 30][lod], rr = Lmax * 0.3 + 2, size = defSize, top = { pts: [centre(H * 0.9), centre(H)] };
      for (let k = 0; k < n; k++) {
        const a = rng() * TAU, e = rng.range(0.1, 1), r = rr * Math.sqrt(1 - e * e * 0.8) * Math.sqrt(rng()); let x = c[0] + Math.sin(a) * r, z = c[2] + Math.cos(a) * r, y = c[1] - rr * 0.5 + e * rr * 0.75;
        const nx = Math.sin(a) * 0.6, nz = Math.cos(a) * 0.6, nl = Math.hypot(nx, 0.8, nz);
        const card = [x, y, z, nx / nl, 0.8 / nl, nz / nl, rng() * TAU, rng.range(size[0], size[1]) * sprayK, defTiles, 0.6 * sway, rng(), (o.leafCol || leafCol)(rng, 1.02), nx / nl, 0.8 / nl, nz / nl, 0.9];
        const hg = hangOn(top, x, y, z, card[7]); if (hg) { x += hg[0]; y += hg[1]; z += hg[2]; card[0] = x; card[1] = y; card[2] = z; }
        if ((clear && !clear(x, y, z, size[0] * 0.5)) || (leafOK && !leafOK(x, y, z, size[0] * 0.5))) continue;
        lb.add(...card);
        if (farCards && k % farShare === 0) farCards.push(card);
      }
    };
    yield;
    if (o.top !== false) tuft();
    yield;
    // ---- THE PLAIN COPY for far away is THE SAME TREE, made here from what was made above. Asked for with
    //      o.far = { solid, leaves, sides, every, bSeg }: the same trunk (its lobes and flare) through every `every`-th
    //      of its rings at `sides` sides; the same roots where it has them and the same boughs, through their own
    //      points as three-sided tubes; every platform and part in its plain form; and of its leaves EVERY SECOND
    //      SPRAY OF EACH BOUGH, the very card: its place, its size, its turn and its colour (not the second card that
    //      stands across a full tree's spray, and where a spray near the route was laid as several small cards, the
    //      one card they were laid about); the same lamp light on all of it. No chance is taken for it.
    //      (F.tiers: only the boughs of that many of its lowest tiers: a small tree of the wood, whose upper boughs
    //      stand inside its crown's leaves, shows only its lowest ones from far off. F.share: every F.share-th spray
    //      in place of every second: a tree of the wood, which stands under the wood's canopy cards.)
    if (o.far) {
      const F = o.far, fb = F.solid, fl = F.leaves, fs = F.sides ?? 6;
      fb.field = field; fl.field = field; fb.glow = fl.glow = sb.glow; fb.kind = o.barkKind ?? 0;
      const rows = [], every = F.every ?? 3;
      for (let i = 0; i < ts.length; i++) {
        if (i > 0 && i < ts.length - 1 && i % every !== every - 1) continue;
        const h = ts[i] * H, hh = Math.max(h, 0), c = centre(hh), r = trunkR(hh), f = fl0 * Math.exp(-hh / (R * 1.15)), row = [];
        const col = mix3(mul3(bark, (0.62 + 0.38 * smoothstep(0, R * 2.2, h)) * (1 - 0.3 * smoothstep(tc - 0.12, tc + 0.2, ts[i]))), [0.13, 0.17, 0.08], smoothstep(R * 1.6, 0, h) * 0.5);
        for (let j = 0; j < fs; j++) {
          const th = j / fs * TAU, lobe = lod === 0 ? 0.5 : Math.pow(0.5 + 0.5 * Math.cos(nL * th + lph + 1.3 * Math.sin(th * 2 + lph2)), 1.6), rr = r * (1 + f * (0.3 + 0.7 * lobe));
          const vx = c[0] + Math.sin(th) * rr, vz = c[2] + Math.cos(th) * rr;
          row.push(fb.v(vx, h < 0 ? footY(vx, vz, h) : c[1], vz, Math.sin(th), 0, Math.cos(th), col, j / fs, h));
        }
        rows.push(row);
        if (lod >= 2 && rows.length % 3 === 0) yield;
      }
      for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < fs; j++) { const j1 = (j + 1) % fs; fb.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
      yield;
      const fbc = mul3(bark, 0.79), bSeg = F.bSeg ?? 2;
      for (const B of boughs) { if (B.ti >= (F.tiers ?? 99)) continue; const n = B.pts.length - 1, ix = []; for (let k = 0; k <= bSeg; k++) { const i = Math.round(n * k / bSeg); if (ix[ix.length - 1] !== i) ix.push(i); } fb.tube(ix.map((i) => B.pts[i]), ix.map((i) => B.rad[i]), 3, fbc); }
      yield;
      for (const [pts, rad] of farRoots) fb.tube(pts, rad, 3, rootCol, false);
      for (const f of flets) if (f.plain) { f.plain(fb, fl); yield; }
      fb.glow = fl.glow = sb.glow;
      yield;
      for (let k = 0; k < farCards.length; k++) { if (k % 60 === 59) yield; fl.add(...farCards[k]); }
      fb.field = null; fl.field = null;
    }
    sb.field = null; lb.field = null;
    // (hung: the bough lamps that were set, four numbers each: x, y of the bough, z, the cord's length; foot: how
    //  far the bark stands from the trunk's own line at a height, the foot's flare and lobes at their widest)
    return { x: o.x, y: o.y, z: o.z, H, R, boughs, boughAt, centre, trunkR, flets, hung, rehung, foot: (h) => trunkR(Math.max(h, 0)) * (1 + (o.flare ?? 1.2) * (lod === 0 ? 0.7 : 1) * Math.exp(-Math.max(h, 0) / (R * 1.15))) * 1.035, crownR: Lmax * 1.1, crownBase: o.y + tc * H };
  }

  const growTree = (o) => { const it = growSteps(o); let r; while (!(r = it.next()).done); return r.value; };
  // the steps of a small tree are a few hundredths of a millisecond each: ask after every few, not after each
  const growTreeAsync = async (o, yieldFn) => { const it = growSteps(o), every = [16, 4, 1, 1][o.lod ?? 2]; let r, n = 0; while (!(r = it.next()).done) { if (r.value === 'now') await (o.handBack ? o.handBack() : ctx.yield()); else if (++n % every === 0) await yieldFn(); } return r.value; };

  // Clearance, asked of what was actually made. hit(x, y, z, r) says whether a ball of radius r there stands in the
  // way (in the flight's lane, in the portal's ring); hitLeaf, where given, is asked of leaf cards instead (the
  // wider room kept free of leaf masses). A leaf card or a lamp that does is left out; a triangle of a
  // solid with a corner there is dropped. Returns how many of each went.
  // (from, to: a solid's corners may be asked a part at a time, so that a great set is no long step; its triangles
  //  are dropped when the last part has been asked)
  function sweep(b, hit, hitLeaf, from = 0, to = Infinity) {
    const out = { cards: 0, lamps: 0, triangles: 0 }, lb = b.leaves, sb = b.solid, lm = b.lamps;
    if (lb) for (let i = lb.count - 1; i >= 0; i--) {
      if (!(hitLeaf ? hitLeaf(lb.pos[i * 3], lb.pos[i * 3 + 1], lb.pos[i * 3 + 2], lb.sz[i * 4] * 0.5) : hit(lb.pos[i * 3], lb.pos[i * 3 + 1], lb.pos[i * 3 + 2], lb.sz[i * 4] * 0.35))) continue;
      const j = --lb.count;
      for (const [key, n] of [['pos', 3], ['ax', 4], ['sz', 4], ['col', 3], ['lamp', 4], ['mass', 4]]) { const a = lb[key]; for (let k = 0; k < n; k++) a[i * n + k] = a[j * n + k]; }
      out.cards++;
    }
    if (lm) for (let i = lm.count - 1; i >= 0; i--) {
      // (the lamp's body through its whole swing, and its cord at every CORD_STEP above it: see swingRoom)
      const hx = lm.hang[i * 3], hy = lm.hang[i * 3 + 1], hz = lm.hang[i * 3 + 2], cord = lm.L[i * 4], reach = swingReach(cord);
      let inWay = hit(hx, hy - cord, hz, 0.5 + reach);
      for (let c = cord - CORD_STEP; c > 0 && !inWay; c -= CORD_STEP) inWay = hit(hx, hy - c, hz, 0.05 + reach * c / cord);
      if (!inWay) continue;
      lm.hang.splice(i * 3, 3); lm.L.splice(i * 4, 4); lm.col.splice(i * 3, 3); lm.count--; out.lamps++;
    }
    if (sb) {
      const i1 = Math.min(sb.count, to);
      for (let i = from; i < i1; i++) if (hit(sb.p[i * 3], sb.p[i * 3 + 1], sb.p[i * 3 + 2], 0)) { if (!sb.hitAt) sb.hitAt = new Uint8Array(sb.count); sb.hitAt[i] = 1; }
      const flags = i1 >= sb.count ? sb.hitAt : null; if (flags) sb.hitAt = null;
      if (flags) for (let t = 0; t < sb.ni; t += 3) if (flags[sb.idx[t]] | flags[sb.idx[t + 1]] | flags[sb.idx[t + 2]]) { if (sb.idx[t + 1] !== sb.idx[t]) out.triangles++; sb.idx[t + 1] = sb.idx[t + 2] = sb.idx[t]; }
    }
    return out;
  }

  // The materials of a set that fades (see gwFade): the same shaders with the same shared values and a fade of their
  // own, so no new program is made. from, to: the stretch in metres from the eye; whole: the whole copy (or the plain one).
  const fadeMats = (from, to, whole) => {
    const u = { ...U, uFade: { value: new THREE.Vector4(from, to, whole ? 1 : -1, 1) } };
    return { solid: new THREE.ShaderMaterial({ uniforms: u, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, side: THREE.DoubleSide }),
      leaf: new THREE.ShaderMaterial({ uniforms: u, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide }),
      lampBody: new THREE.ShaderMaterial({ uniforms: u, vertexShader: LAMPBODY_VERT, fragmentShader: LAMPBODY_FRAG, side: THREE.DoubleSide }),
      thin: new THREE.ShaderMaterial({ uniforms: u, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, defines: { THIN: 1 }, side: THREE.DoubleSide, transparent: true, depthWrite: false }) };
  };
  // meshes from a set of builders (fm: the materials of a set that fades, or none)
  function meshes(group, b, fm) {
    const out = {}, M = fm || mats;
    if (b.solid && b.solid.count) { out.solid = new THREE.Mesh(b.solid.geometry(), M.solid); group.add(out.solid); }
    if (b.thin && b.thin.count) { out.thin = new THREE.Mesh(b.thin.geometry(), M.thin || mats.thin); out.thin.renderOrder = 2; group.add(out.thin); }
    if (b.leaves && b.leaves.count) { out.leaves = new THREE.Mesh(b.leaves.geometry(), M.leaf); group.add(out.leaves); }
    if (b.lamps && b.lamps.count) {
      const g = b.lamps.geometries();
      out.lampBody = new THREE.Mesh(g.body, M.lampBody); out.lampGlow = new THREE.Mesh(g.glow, mats.lampGlow); out.lampGlow.renderOrder = 4;
      out.lampCord = new THREE.Mesh(g.cord, mats.cord); out.lampCord.renderOrder = 2;
      group.add(out.lampBody, out.lampCord, out.lampGlow);
    }
    return out;
  }
  // THE LIGHT OF A PLACE: setLight(place, o) with place 0 (under the open sky), 1 (under the wood's roof) or 2 (under
  // the city's roof); o.sunDir is the one sun's and is the same for all. setRoof gives the map that says which place
  // a point is in: st = (1 / breadth, 1 / depth, -x0 / breadth, -z0 / depth) of the box it covers, top = the height
  // its blue channel counts to, band = the metres under a roof's top through which the open sky's light gives way.
  let lightSet = false;
  const setLight = (place, o) => {
    lightSet = true; const put = (u, v) => { if (v) u.value[place].copy(v); };
    if (o.sunDir) U.uSunDir.value.copy(o.sunDir).normalize();
    put(U.uPSun, o.sunCol); put(U.uPSky, o.skyCol); put(U.uPGnd, o.gndCol); put(U.uPAmb, o.leafAmb); put(U.uPSilver, o.silverShade);
    put(U.uPFog, o.fogCol); put(U.uPFogSun, o.fogSun); put(U.uPFogCool, o.fogCool || o.fogCol);
    if (o.fogDen !== undefined) U.uPDen.value.setComponent(place, o.fogDen);
    if (o.lampGain !== undefined) U.uPGain.value.setComponent(place, o.lampGain);
  };
  const setRoof = (texture, st, top, band) => { U.uRoof.value = texture; U.uRoofST.value.set(st[0], st[1], st[2], st[3]); U.uRoofTop.value.set(top, band); };
  // alone in the viewer: take the light of the scene the piece stands in (no roof map: all is the first place)
  const _c = new THREE.Color();
  const adopt = (object) => {
    if (lightSet) return;
    let root = object; while (root.parent) root = root.parent;
    for (const ch of root.children) {
      if (ch.isDirectionalLight) { U.uSunDir.value.copy(ch.position).normalize(); _c.copy(ch.color).multiplyScalar(ch.intensity / Math.PI); U.uPSun.value[0].set(_c.r, _c.g, _c.b); }
      else if (ch.isHemisphereLight) {
        _c.copy(ch.color).multiplyScalar(ch.intensity / Math.PI * 1.6); U.uPSky.value[0].set(_c.r, _c.g, _c.b);
        _c.copy(ch.groundColor).multiplyScalar(ch.intensity / Math.PI * 1.6); U.uPGnd.value[0].set(_c.r + 0.05, _c.g + 0.04, _c.b + 0.02);
      }
    }
    if (root.fog) { U.uPFog.value[0].set(root.fog.color.r, root.fog.color.g, root.fog.color.b); U.uPFogCool.value[0].copy(U.uPFog.value[0]); if (root.fog.density !== undefined) U.uPDen.value.x = root.fog.density; }
  };
  return { U, mats, P, season, LAMPC, Solid, Leaves, Lamps, makeLampField, growTree, growTreeAsync, flet, ladder, hangLamp, swingRoom, leafCol, meshes, fadeMats, sweep, setLight, setRoof, adopt };
}

// ---------------------------------------------------------------------------------------------------------
// The hero
// opts: kit (a makeGoldwood result shared with the world), glow (the strength of its lamps), clear(x, y, z, r) local -> bool,
//       leafClear(x, y, z, r) local -> bool (the world's wider room for leaf masses along its climb),
//       mix [green, gold, silver] lamp weights, season, leafK, portalR (the radius of the portal's ring, 5),
//       rng (the world's own stream for the great tree, taken with its other streams at the head of its build),
//       underRng (a stream for the lamps beneath the great platform; none are hung where it is not given),
//       pacer (a makePacer result shared with the world, so that its hand-backs and ours are counted together),
//       blocked(x, y, z, r) / blockedLeaf(x, y, z, r) local -> bool: the world's tests of its lane, its portal's ring
//       and its room for leaf masses, asked of everything made,
//       far { band [from, to] }: also make the tree's plain copy for far away (the same tree: see growSteps); the
//       whole tree thins away and the plain one thickens between those two distances from the eye
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || (ctx.rng.fork ? ctx.rng.fork('great-tree') : ctx.rng);
  await ctx.yield();
  let K = opts.kit;
  if (!K) { await flora.prepareLeafTexture({}, ctx.yield); K = makeGoldwood(ctx, opts); }
  // THE BOLE. Its girth is an eighth of its height: 16.5 m through at breast height (R), spreading at its foot into
  // root-buttresses. It keeps that breadth (1.375 of the common profile of a 12 m bole) up to 0.45 of its height and
  // narrows from there to 7 m through (DECK_R) where it carries the great platform; inside the hall it narrows on to
  // the common profile at the hall's roof (it passes 9 m from the line of the last flight, whose lane is 4 m).
  const DECK_R = 3.5;
  const P = K.P, H = HERO.height, R = H / 16, TC = 44 / H, DECK = HERO.deck, LX = HERO.lineX, FLY = DECK + HERO.over, PR = opts.portalR ?? HERO.portalR, SEAT = [LX, FLY, HERO.seatZ];
  const object = new THREE.Group(), glow = opts.glow ?? 1, mix = opts.mix || [1, 1.25, 1];
  // the great platform: an oval 38 m by 64 m, the trunk rising through it; the hall stands on it (see HERO.hall)
  const HALL = HERO.hall, OC = [HALL.cx, (HERO.deckZ[0] + HERO.deckZ[1]) / 2], OA = HALL.a + 3, OB = (HERO.deckZ[1] - HERO.deckZ[0]) / 2, OP = 2.8;
  const inOval = (x, z) => Math.pow(Math.abs((x - OC[0]) / OA), OP) + Math.pow(Math.abs((z - OC[1]) / OB), OP) < 1;
  // inside the hall's plan, widened by m metres
  const inHall = (x, z, m = 0) => Math.pow(Math.abs((x - HALL.cx) / (HALL.a + m)), 3) + Math.pow(Math.abs((z - HALL.cz) / (HALL.b + m)), 3) < 1;
  // the broad ladder: 2.8 m wide, standing on the ground 12.5 m from the axis on the bole's face toward the portal's
  // seat (so it comes up through the great platform between the trunk and the portal) and leaning against the bole
  // where the great platform is; rl(h) = how far from the axis it is at a height
  const aL = Math.atan2(SEAT[0], SEAT[2]), LW = 2.8, LTOP = DECK + 1.2, lsx = Math.sin(aL), lsz = Math.cos(aL), rl = (h) => lerp(12.5, DECK_R + 0.6, clamp(h / LTOP, 0, 1));
  const offLadder = (a) => Math.abs(((a - aL + Math.PI * 3) % TAU) - Math.PI);
  // distance from the line of the last flight (from 80 m before the seat to 2 m past it)
  const lineD = (x, y, z) => { const zz = clamp(z, SEAT[2] - 2, SEAT[2] + 80); return Math.hypot(x - LX, y - FLY, z - zz); };
  // THE RING'S VIEW. opts.ringEyes: the places of the eye over the last stretch of the world's flight (three numbers
  // each, in the tree's own frame), from the place where the ring is to stand clear to the ring. inView: does a ball
  // stand between any of those eyes and any part of the ring's disc (the ring's radius and VIEW_PAD)? Nothing of the
  // tree's making stands there: no bough, rib or post of the hall, no leaf of its roof or of the crown, no lamp
  // (clear and leafHall below ask it). What stands beside the cone frames the ring; the bole itself, which no
  // rule can move, stands outside it (the world counts the lines of sight).
  // A LEAF is asked more: it keeps SKY_PAD of the ring's radius clear round the ring's rim as each of those eyes
  // sees it, behind the ring's plane as well as before it, so that the ring stands against the sky and not in a
  // hedge (leafHall).
  const eyes = opts.ringEyes || [], VIEW_PAD = 0.5, SKY_PAD = 0.45 * PR;
  const inView = (x, y, z, r, pad = VIEW_PAD, behind = false) => {
    if (!behind && z <= SEAT[2] + 0.2) return false;
    for (let i = 0; i < eyes.length; i += 3) {
      const ez = eyes[i + 2]; if (ez <= z + 0.5) continue;
      const f = (ez - SEAT[2]) / (ez - z), px = eyes[i] + (x - eyes[i]) * f, py = eyes[i + 1] + (y - eyes[i + 1]) * f;
      if (Math.hypot(px - SEAT[0], py - SEAT[1]) < PR + pad + r * f) return true;
    }
    return false;
  };
  // THE THREE PLATFORMS ABOUT THE BOLE stand at FLET_H over the tree's foot (a storey of this bole is 13 m).
  const FLET_H = HERO.floors;
  // THE OUTER LANDING: a floor of LAND_RO out among the crown's outer leaves, a thing of the tree's own plan.
  //  HOW FAR OUT: two thirds of the crown's radius from the bole's axis, where the crown's leaves begin to stand thick.
  //  HOW HIGH: half way between the first and the second platform, the half-way rest of that climb; the limb that
  //   carries it leaves the bole a storey lower.
  //  ON WHICH SIDE: under the open crown and not under the great platform's floor: the first bearing, going round
  //   from the hall's open end on the side away from the broad ladder (by half degrees), at which its whole floor
  //   lies out from under the great platform's edge.
  // Its room: no bough thicker than a twig crosses its floor's round from half a metre under the floor to a tall
  // man's height over it, and no leaf mass stands in it
  const LAND_RO = 5, Ld = (() => {
    const r = HERO.crownR * 2 / 3, h = (FLET_H[0] + FLET_H[1]) / 2, side = Math.sin(aL) > 0 ? -1 : 1, STEP = Math.PI / 360;
    const under = (a) => { const cx = Math.sin(a) * r, cz = Math.cos(a) * r; if (inOval(cx, cz)) return true; for (let k = 0; k < 72; k++) { const b = k / 72 * TAU; if (inOval(cx + Math.sin(b) * LAND_RO, cz + Math.cos(b) * LAND_RO)) return true; } return false; };
    let n = 0; while (n < 360 && under(side * n * STEP)) n++;
    return { a: side * n * STEP, r, h, ro: LAND_RO };
  })(), onLanding = (x, y, z, r) => Ld && y + r > Ld.h - 0.5 && y - r < Ld.h + 3.5 && Math.hypot(x - Math.sin(Ld.a) * Ld.r, z - Math.cos(Ld.a) * Ld.r) < Ld.ro + 0.5 + r;
  // (wallBy: is a ball in the hall's walls? Set when the walls are laid, which is after the tree's boughs are grown:
  //  a wall stands open where a bough passes, and every lamp hung after that keeps its whole room off the walls)
  let wallBy = null;
  const clear = (x, y, z, r, own = false) => {
    // (nothing stands or hangs within the ring's radius and a metre of the line of the last flight, or anywhere
    //  between the eye and the ring from the place where the ring stands clear: the ring is seen whole. A lamp is
    //  asked for its whole swing and its cord with it: K.swingRoom.)
    if (lineD(x, y, z) < PR + 1 + r || inView(x, y, z, r)) return false;
    // no bough or twig of the tree's own growth crosses the hall under its roof line (own: a thing of the hall's
    // own making, a lamp under its eave, is not asked this)
    if (!own && r > 0.55 && inHall(x, z, r) && y - r < DECK + HALL.roof - 3 && y + r > DECK && Math.hypot(x, z) > 4 + r) return false;
    if (wallBy && wallBy(x, y, z, r)) return false;
    if (r > 0.3 && onLanding(x, y, z, r)) return false;
    // nothing grows or hangs in the ladder's way
    if (y < LTOP + 1) { const rad = x * lsx + z * lsz, lat = x * lsz - z * lsx; if (rad > 0 && rad < rl(y) + 1.5 + r && Math.abs(lat) < LW / 2 + 1 + r) return false; }
    return !opts.clear || opts.clear(x, y, z, r);
  };
  // leaf masses: inside the hall's plan they stand only over its roof line (or under its floor); before the hall's
  // door they keep 10 m from the line of the flight; and the tree's own sprays keep within the crown's radius (the
  // hall's roof goes as far as its walls do)
  // (the hall's roof is a vault on its arched boughs: 0.3 m over the wall's top at the wall, HALL.roof + 2 at the
  // middle; hallE is a place's share of the way from the hall's middle to its wall, vault the roof's height there)
  const hallE = (x, z) => Math.cbrt(Math.pow(Math.abs((x - HALL.cx) / HALL.a), 3) + Math.pow(Math.abs((z - HALL.cz) / HALL.b), 3));
  const VAULT = [[0, HALL.eave + 0.3], [0.05, 13], [0.17, 16.6], [0.42, 19.2], [0.78, 20.3], [1, HALL.roof + 2]];
  const vault = (e) => { const f = clamp(1 - e, 0, 1); let k = 1; while (k < VAULT.length - 1 && VAULT[k][0] < f) k++; const a = VAULT[k - 1], b = VAULT[k]; return a[1] + (b[1] - a[1]) * (f - a[0]) / (b[0] - a[0]); };
  const leafHall = (x, y, z, r) => !inView(x, y, z, r, SKY_PAD, true) && !onLanding(x, y, z, r) && !(inHall(x, z, 1 + r) && y - r < DECK + vault(hallE(x, z)) - 0.5 && y + r > DECK - 1.5)
    && Math.hypot(x - LX, y - FLY, z - clamp(z, HALL.cz + HALL.b, SEAT[2] + 80)) > 10 + r
    && (!opts.leafClear || opts.leafClear(x, y, z, r));
  const leafClear = (x, y, z, r) => Math.hypot(x, z) + r <= HERO.crownR && leafHall(x, y, z, r);
  const sb = new K.Solid(65536), lb = new K.Leaves(16384), lm = new K.Lamps(), tb = new K.Solid(256), field = K.makeLampField();
  const pacer = (opts.pacer || makePacer(ctx)).watch({ solid: sb, leaves: lb, lamps: lm }), rest = (n) => pacer.rest(n);
  // tiers of boughs: three under the platforms about the bole, one under the great platform, and the roof of the hall
  // 20 m over its floor with two more above it
  // THE LIMBS. Every tier is a whorl of great limbs, a third of the bole's own thickness where they leave it, bare and
  // silver for the first two fifths of their length (BARE) and carrying their leaves beyond, close about each limb
  // (spread), so that a limb is seen from the bole to its own leaf mass and no mass hangs without one. The three
  // lower whorls spring 5 m under the three platforms and sweep up (rise 0.3), passing close under each platform's
  // rim: the platform sits in the fork. The whorl under the great platform is the stoutest for its bole (0.45) and
  // arches up under the floor (sag -5), a post from each limb to the floor.
  const FLET_R = [10.5, 9.5, 8.5], FORK = 5, BARE = 0.4;
  const WIDE = R / 6, WIDE_DECK = DECK_R / trunkRadius(6, H, TC, DECK);
  const trunkR = (h) => trunkRadius(6, H, TC, h) * (h < DECK ? lerp(WIDE, WIDE_DECK, smoothstep(0.45 * H, DECK, h)) : lerp(WIDE_DECK, 1, smoothstep(DECK, DECK + HERO.hall.roof, h)));
  const tiers = [
    { h: FLET_H[0] - FORK, n: 7, L: 28, rise: 0.3, curl: 0.1, thick: 0.34, spread: 0.14 }, { h: FLET_H[1] - FORK, n: 7, L: 29, rise: 0.3, curl: 0.1, thick: 0.34, spread: 0.14 }, { h: FLET_H[2] - FORK, n: 7, L: 28, rise: 0.3, curl: 0.1, thick: 0.34, spread: 0.14 },
    { h: 84, n: 6, L: 26, rise: 0.06, curl: 0.1, thick: 0.45, sag: -5, spread: 0.14 },
    { h: 117, n: 6, L: 24, rise: 0.14, curl: 0.1, spread: 0.16 }, { h: 124, n: 5, L: 17, rise: 0.22, curl: 0.12 }, { h: 129, n: 5, L: 10, rise: 0.3, curl: 0.15 },
  ];

  // (the great tree's own parts, planned in one pass and handed back at its end; a null is a hand-back asked of the
  //  build on the way: before the hall, when its posts stand, when its walls are laid)
  const parts = function* (sk) {
    const list = [], tR = sk.trunkR, white = P.white;
    const hatchAt = (h) => ({ a: aL, half: Math.atan2(LW / 2 + 0.6, rl(h)), r: rl(h) + 1.3 });
    yield null;
    // --- three platforms set about the bole, the ladder passing through an opening in each; on the boughs over the
    //     lower two a small platform to one side or the other, reached by a rope ladder from the platform below
    for (let fi = 0; fi < FLET_H.length; fi++) {
      const h = FLET_H[fi], rO = FLET_R[fi], c = sk.centre(h), scr = aL + Math.PI + rng.range(-0.6, 0.6);
      list.push(K.flet({ rng, glow, mix, cx: c[0], cy: h, cz: c[2], rOut: rO, rIn: tR(h) + 0.25, n: 40, white: true, hatch: hatchAt(h), lampEvery: 2.3, cord: [0.8, 1.9], screen: fi === 1 ? [scr, scr + 1.3] : null,
        struts: { r: tR(h - 4.2) + 0.1, drop: 4.2, n: 8, skip: [[aL - 0.55, aL + 0.55]] } }));
      if (fi > 1) continue;
      const cand = sk.boughs.filter((B) => B.ti === fi + 1 && B.frac > 0.95 && offLadder(B.az) > 0.7);
      for (let k = 0, m = Math.min(cand.length, 2 - fi); k < m; k++) {
        const B = cand.splice(rng.int(0, cand.length - 1), 1)[0], rf = rng.range(3.3, 4), s = clamp((rO - 0.9 + rf - B.r0) / B.L, 0.25, 0.7), q = sk.boughAt(B, s), az = q[3];
        if (!clear(q[0], q[1] + 2, q[2], rf + 1)) continue;
        list.push(K.flet({ rng, glow, mix, cx: q[0], cy: q[1] + 0.9, cz: q[2], rOut: rf, lampEvery: 2.2, cord: [0.6, 1.4], screen: k === 0 ? [az - 0.6, az + 0.6] : null }));
        const lx = q[0] - Math.sin(az) * (rf + 0.1), lz = q[2] - Math.cos(az) * (rf + 0.1);
        list.push({ geometry() { K.ladder(tb, lx, q[1] + 0.9, h, lz, [-Math.sin(az), -Math.cos(az)], 0.8, glow); } });
      }
    }
    yield null;
    // --- THE OUTER LANDING (Ld { a, r, h, ro }: its bearing, its distance from the bole's axis, its floor's height
    //     and radius, by the tree's own plan: see LAND_RO above): a white platform out among the crown's outer
    //     leaves on a limb of its own, which leaves the bole 13 m lower and sweeps out and up under it, four braces
    //     from the limb to the floor's rim; lamps round its rim, a plaited screen on its side toward the bole.
    if (Ld) {
      const sx = Math.sin(Ld.a), sz = Math.cos(Ld.a), h0 = Ld.h - 13, r0 = tR(h0) * 0.5, c = [sx * Ld.r, Ld.h, sz * Ld.r];
      const limb = [[sx * r0, h0, sz * r0], [sx * Ld.r * 0.42, h0 + 3.6, sz * Ld.r * 0.42], [sx * Ld.r * 0.78, Ld.h - 4.2, sz * Ld.r * 0.78], [c[0], Ld.h - 1.0, c[2]]], lr = [tR(h0) * 0.3, 1.5, 0.95, 0.6];
      list.push(K.flet({ rng, glow, mix, cx: c[0], cy: Ld.h, cz: c[2], rOut: Ld.ro, n: 28, white: true, lampEvery: 2.0, cord: [0.7, 1.7], screen: [Ld.a + Math.PI - 0.7, Ld.a + Math.PI + 0.7] }));
      list.push({
        geometry(s) { s.kind = 0; s.glow = glow; s.tube(limb, lr, 8, mul3(P.bark, 0.8)); s.kind = 2; for (let k = 0; k < 4; k++) { const b = Ld.a + (k + 0.5) / 4 * TAU; s.beam([limb[2][0], limb[2][1] + 0.4, limb[2][2]], [c[0] + Math.sin(b) * Ld.ro * 0.8, Ld.h - 0.3, c[2] + Math.cos(b) * Ld.ro * 0.8], 0.3, mul3(P.bark, 0.6)); } },
        plain(fb) { fb.kind = 0; fb.glow = glow; fb.tube(limb, lr, 3, mul3(P.bark, 0.8), false); },
      });
    }
    // --- the great platform: pale planks laid along its length, lamps round its edge. ITS RIM IS AN EDGING OF SILVER-
    //     GREY BOARDS laid along the edge, RIM_W wide, flat in the floor (no rail, no kerb): the floor's edge
    //     is a rim with its lamps under it, and not a pale band.
    const tRd = tR(DECK), dh = hatchAt(DECK);
    const deckR = (a) => { const dx = Math.sin(a), dz = Math.cos(a); let lo = 0, hi = 64; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (inOval(dx * m, dz * m)) lo = m; else hi = m; } return lo; };
    list.push({
      lamps(L, f) {
        let acc = 0, px = 0, pz = 0;
        for (let i = 0; i <= 360; i++) {
          const a = i / 360 * TAU, r = deckR(a) + 0.25, x = Math.sin(a) * r, z = Math.cos(a) * r;
          if (i > 0) { acc += Math.hypot(x - px, z - pz); if (acc >= 2.4) { acc -= 2.4; K.hangLamp(L, f, rng, x, DECK - 0.3, z, rng.range(0.8, 2.1), rng.range(0.55, 0.8), mix, glow); } }
          px = x; pz = z;
        }
      },
    });
    const silverPost = mul3(P.bark, 0.9);
    // (FROM BELOW THE GREAT PLATFORM IS CARPENTRY, as every floor: its boards from below a silver-grey, drawn with
    //  joists and a rim beam (the solid shader's kind 8; UNDER_R: the reach the pattern is laid out to, every
    //  corner at its own share of the floor's reach on its bearing), and the joists and braces that carry it are
    //  of the bark's silver, darker than the boards)
    const ND = 96, top = mul3(P.white, 0.97), under = mul3(mix3(P.white, P.bark, 0.5), 0.42), joist = mul3(P.bark, 0.5), RIM_W = 0.9, rimCol = mul3(P.bark, 0.72), UNDER_R = 30;
    // (N corners round, the pieces i0 to i1 of them, `rings` rings of planking from the bole to the edge: eight near
    // to, so that the lamps' light and the ring's falls where they are; the plain form has a quarter of the corners
    // and two rings)
    const deckPiece = (s, N, i0, i1, rings) => {
      for (let i = i0; i < i1; i++) {
        const a = i / N * TAU, b = (i + 1) / N * TAU, am = (a + b) / 2, ri = offLadder(am) < dh.half ? dh.r : tRd + 0.25, ra = deckR(a), rb = deckR(b);
        const sa = Math.sin(a), ca = Math.cos(a), sb2 = Math.sin(b), cb = Math.cos(b), y = DECK;
        for (let k = 0; k < rings; k++) {
          const f0 = k / rings, f1 = (k + 1) / rings, a0 = lerp(ri, ra, f0), a1 = lerp(ri, ra, f1), b0 = lerp(ri, rb, f0), b1 = lerp(ri, rb, f1);
          s.kind = 1; s.face([sa * a1, y, ca * a1], [sb2 * b1, y, cb * b1], [sb2 * b0, y, cb * b0], [sa * a0, y, ca * a0], top, [sa * a1, ca * a1, sb2 * b1, cb * b1, sb2 * b0, cb * b0, sa * a0, ca * a0]);
        }
        s.kind = 8 + UNDER_R / 100; s.face([sb2 * rb, y - 0.5, cb * rb], [sa * ra, y - 0.5, ca * ra], [sa * ri, y - 0.5, ca * ri], [sb2 * ri, y - 0.5, cb * ri], under, [sb2 * UNDER_R, cb * UNDER_R, sa * UNDER_R, ca * UNDER_R, sa * UNDER_R * ri / ra, ca * UNDER_R * ri / ra, sb2 * UNDER_R * ri / rb, cb * UNDER_R * ri / rb]);
        s.kind = 2;
        s.face([sa * ra, y - 0.5, ca * ra], [sb2 * rb, y - 0.5, cb * rb], [sb2 * rb, y, cb * rb], [sa * ra, y, ca * ra], rimCol);
        // (the edging: a finger over the planks' ends)
        s.face([sa * ra, y + 0.03, ca * ra], [sb2 * rb, y + 0.03, cb * rb], [sb2 * (rb - RIM_W), y + 0.03, cb * (rb - RIM_W)], [sa * (ra - RIM_W), y + 0.03, ca * (ra - RIM_W)], rimCol);
      }
    };
    // a joist under every sixth corner of the 96, braced from the bole 10 m below (the plain form: the braces alone, three-sided)
    const deckBraces = (s, i0, i1, plain) => {
      for (let i = i0; i < i1; i += 6) {
        const a = i / ND * TAU, sa = Math.sin(a), ca = Math.cos(a), ra = deckR(a), ri = offLadder(a + TAU / ND / 2) < dh.half ? dh.r : tRd + 0.25, y = DECK; if (offLadder(a) <= 0.6) continue;
        const A = [sa * (tR(DECK - 10) + 0.1), y - 10, ca * (tR(DECK - 10) + 0.1)], B = [sa * ra * 0.55, y - 0.5, ca * ra * 0.55]; s.kind = 2;
        if (plain) s.tube([A, B], [0.5, 0.5], 3, joist, false);
        else { s.beam(A, B, 0.72, joist); s.beam([sa * ri, y - 0.7, ca * ri], [sa * (ra - 0.3), y - 0.7, ca * (ra - 0.3)], 0.3, joist); }
      }
    };
    // (a post from each limb of the whorl under the great platform to its floor, at 0.45 of the limb's length where the floor is over it)
    const deckPosts = (s, plain) => {
      s.kind = 0;
      for (const B of sk.boughs) { if (B.ti !== 3 || B.frac < 0.5) continue; const q = sk.boughAt(B, 0.45); if (!inOval(q[0], q[2]) || q[1] > DECK - 1.5) continue; s.tube([[q[0], q[1], q[2]], [q[0], DECK - 0.5, q[2]]], [0.5, 0.36], plain ? 3 : 6, silverPost, false); }
    };
    // (A FEW LAMPS HANG BENEATH THE GREAT PLATFORM, one from the head of every other brace, on long cords, and its
    //  carpentry is seen by them. Their numbers come from a stream of their own, opts.underRng; each takes its
    //  numbers whether it has room to hang or not.)
    if (opts.underRng) list.push({
      lamps(L, f) {
        const ur = opts.underRng;
        for (let i = 0; i < ND; i += 12) {
          const a = i / ND * TAU, r = deckR(a) * 0.55, x = Math.sin(a) * r, z = Math.cos(a) * r, cord = ur.range(1.4, 2.8), size = ur.range(0.6, 0.8);
          K.hangLamp(L, f, ur, x, DECK - 0.9, z, cord, size, mix, glow, offLadder(a) > 0.6 && K.swingRoom(clear, x, DECK - 0.9, z, cord, 0.4));
        }
      },
    });
    for (let i0 = 0; i0 < ND; i0 += 16) list.push({ geometry(s) { s.glow = glow; deckPiece(s, ND, i0, i0 + 16, 8); deckBraces(s, Math.ceil(i0 / 6) * 6, i0 + 16, false); if (i0 === 0) deckPosts(s, false); } });
    list.push({ plain(fb) { fb.glow = glow; deckPiece(fb, ND / 4, 0, ND / 4, 2); deckBraces(fb, 0, ND, true); deckPosts(fb, true); } });
    yield null;
    // --- the broad white ladder: two stout rails and a rung every half metre, straight from the roots to the great
    //     platform; a lamp every 6 m of its height, on alternate sides, on a short arm from the rail
    const lp = (h, lat) => { const r = rl(h); return [lsx * r + lsz * lat, h, lsz * r - lsx * lat]; };
    const LAMP_STEP = 6, lampH = []; for (let h = LAMP_STEP; h < DECK - 3; h += LAMP_STEP) lampH.push(h);
    list.push({
      lamps(L, f) { lampH.forEach((h, i) => { const q = lp(h, (i % 2 ? 1 : -1) * (LW / 2 + 1.1)); K.hangLamp(L, f, rng, q[0], h + 0.25, q[2], rng.range(0.5, 0.8), rng.range(0.6, 0.75), mix, glow); }); },
      geometry(s) {
        s.kind = 2; s.glow = glow;
        for (const sd of [-1, 1]) for (let h = -0.4; h < LTOP; h += 12.2) s.beam(lp(h, sd * LW / 2), lp(Math.min(LTOP, h + 12.2), sd * LW / 2), 0.3, white);
        lampH.forEach((h, i) => { const sd = i % 2 ? 1 : -1; s.beam(lp(h + 0.3, sd * LW / 2), lp(h + 0.3, sd * (LW / 2 + 1.1)), 0.1, white); });
      },
      // (the plain form: the same two rails, and for every four rungs one of four times the depth: the same white in all)
      plain(fb) {
        fb.kind = 2; fb.glow = glow;
        for (const sd of [-1, 1]) for (let h = -0.4; h < LTOP; h += 12.2) fb.tube([lp(h, sd * LW / 2), lp(Math.min(LTOP, h + 12.2), sd * LW / 2)], [0.21, 0.21], 3, white, false);
        for (let i = 2; i <= nRung; i += 4) { const A = lp(i * RUNG, -LW / 2), B = lp(i * RUNG, LW / 2); fb.face([A[0], A[1] - 0.25, A[2]], [B[0], B[1] - 0.25, B[2]], [B[0], B[1] + 0.25, B[2]], [A[0], A[1] + 0.25, A[2]], white); }
      },
    });
    const RUNG = 0.5, nRung = Math.floor(LTOP / RUNG);
    for (let i0 = 1; i0 <= nRung; i0 += 40) list.push({
      geometry(s) { s.kind = 2; s.glow = glow; for (let i = i0; i < Math.min(nRung + 1, i0 + 40); i++) s.beam(lp(i * RUNG, -LW / 2), lp(i * RUNG, LW / 2), 0.12, white); },
    });
    // (the hall's own stream of chance: its boughs, its lamps' cords, its roof's sprays)
    const hr = opts.hallRng || rng;
    yield null;
    // --- THE HALL on the great platform: A HOUSE WITH WALLS OF GREEN AND SILVER AND A ROOF OF GOLD, an oval chamber
    //     with the trunk for its middle pillar.
    //     THE WALLS stand WALL.out outside the posts' line (the oval HALL.a by HALL.b) from the floor to the eave:
    //     staves of silver wood every WALL.stave metres and, woven through them, broad strips of green plaited work,
    //     WALL.rows of them one over another, each passing before one stave and behind the next (WALL.weave either
    //     way: the wall has relief; where a strip turns out it is lighter, where it turns in darker, and its foot
    //     lies in its own shade); the rows WALL.band are silver; a head bough lies along the wall's top. A wall
    //     takes the lamps' light on both its faces alike (bothFaces: woven work lets light through), WARMER than the
    //     lamps give it and NEVER MORE THAN WALL.most of it however many lamps hang by it (soft: it nears that most
    //     smoothly): the lamps are the bright things, the wall under them is green plait and silver wood at a
    //     middling brightness at every distance (a wall that took the lamps' whole light would stand near white
    //     under the eave, where thirty lamps hang within a few metres of it).
    //     THE WALLS STAND OPEN at the hall's whole near end, the gable that opens on the platform's broad open
    //     floor (HALL.door either side of +Z from the hall's middle, as the posts do: the hall is a house open
    //     at its gable, as a hall of meeting is, and its walls are its two long sides), at the bay where the ring stands
    //     (HALL.far either side of -Z: the ring stands against the sky), wherever the ring's view or the flight's
    //     lane asks for clear air (every column is asked through clear, which wins), where a bough of the tree
    //     passes, and nowhere else.
    //     THE POSTS are forked posts of living silver bough, no two alike (each has its own place along the oval,
    //     thickness, lean and height of fork, and the two arms of its fork are unequal): they stand inside the wall
    //     and their arms carry the wall's head. A wall's end with no post by it has one of its own (laid by the
    //     place, not drawn). No post stands in a bay or in the ring's view (a post's foot, fork and arms and a
    //     roof bough's whole way are asked through clear).
    //     THE ROOF is the tree's own living gold leaf over the wall's head. A FEW stout boughs come down on the
    //     wall's head from the bole (two in five of the standing posts' by the post's own numbers, each its own
    //     stoutness, and the two that carry lamps either side of the ring): not one to a post, and no fan of ribs.
    //     LAMPS hang under the eave, one to every EAVE_LAMP metres of
    //     it, every second one on a long cord (the wall is lit from its head to its foot), each clear of every post,
    //     and more on the two roof boughs that stand either side of the ring. (A lamp of the hall is asked the lane
    //     and the ring's view as every thing is, but not the rule that keeps the tree's own boughs out of the hall:
    //     a lamp under the eave is the hall's own thing, hung clear of its posts.)
    //     Nothing of the hall comes within the ring's radius and a metre of the line of the last flight (clear): the
    //     ring is seen whole from the turn to the end.
    const RING_GLOW = [1.0, 0.82, 0.58];
    const EAVE = HALL.eave, EAVE_LAMP = 1.6, NW = 26, ovalAt = (t, m) => { const c = Math.cos(t), s = Math.sin(t), e = 2 / 3; return [HALL.cx + Math.sign(s) * Math.pow(Math.abs(s), e) * (HALL.a + m), HALL.cz + Math.sign(c) * Math.pow(Math.abs(c), e) * (HALL.b + m)]; }, hallAt = (t) => ovalAt(t, 0);
    const inBay = (q) => { const b = Math.abs(Math.atan2(q[0] - HALL.cx, q[1] - HALL.cz)); return b < HALL.door || Math.PI - b < HALL.far; };
    const silverStem = mul3(P.bark, 1.12), silverWork = [0.74, 0.78, 0.82], RIB = [[0, EAVE + 0.3], [0.05, 13], [0.17, 16.6], [0.42, 19.2], [0.78, 20.3], [1, 20.5]];
    const WALL = { out: 1.1, stave: 0.62, rows: 15, top: EAVE - 0.5, weave: 0.09, head: 0.2, most: 0.5, warm: 0.6, band: [6, 7], low: 3.0 };
    const segD = (x, y, z, a, b) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], l2 = ux * ux + uy * uy + uz * uz, f = l2 > 0 ? clamp(((x - a[0]) * ux + (y - a[1]) * uy + (z - a[2]) * uz) / l2, 0, 1) : 0; return Math.hypot(x - a[0] - ux * f, y - a[1] - uy * f, z - a[2] - uz * f); };
    // (the wall's staves: a place every WALL.stave metres of the wall's line all round, each with the way out of the hall there)
    const staves = [];
    { const M = 2880; let acc = WALL.stave, pv = ovalAt(0, WALL.out); for (let i = 1; i <= M; i++) { const t = i / M * TAU, q = ovalAt(t, WALL.out); acc += Math.hypot(q[0] - pv[0], q[1] - pv[1]); pv = q; if (acc >= WALL.stave) { acc -= WALL.stave; staves.push({ t, x: q[0], z: q[1], nx: 0, nz: 0 }); } } }
    const NSV = staves.length, stv = (j) => staves[((j % NSV) + NSV) % NSV];
    staves.forEach((s, j) => { const a = stv(j - 1), b = stv(j + 1); let nx = b.z - a.z, nz = a.x - b.x; const l = Math.hypot(nx, nz) || 1; if (nx * (s.x - HALL.cx) + nz * (s.z - HALL.cz) < 0) { nx = -nx; nz = -nz; } s.nx = nx / l; s.nz = nz / l; });
    const staveAt = (t) => { let b = 0, bd = 9; for (let j = 0; j < NSV; j++) { const d = Math.abs(((staves[j].t - t + Math.PI * 5) % TAU) - Math.PI); if (d < bd) { bd = d; b = j; } } return b; };
    // (the wall's head: its height, and the place on it over a stave, `inset` metres inside the wall's line)
    const headY = DECK + WALL.top + WALL.head, headAt = (j, inset = 0) => { const s = stv(j); return [s.x - s.nx * inset, headY, s.z - s.nz * inset]; };
    const armTo = (fork, j) => { const tip = headAt(j, 0.25); return [[lerp(fork[0], tip[0], 0.45), (fork[1] + tip[1]) / 2 + 0.4, lerp(fork[2], tip[2], 0.45)], tip]; };
    const posts = [], c20 = sk.centre(DECK + 20.5), tr20 = tR(DECK + 20.5), gapFrom = hr.int(0, 3);
    for (let i = 0; i < NW; i++) {
      const t = (i + hr.range(-0.22, 0.22)) / NW * TAU, q = hallAt(t), r0 = hr.range(0.14, 0.24), hf = hr.range(4.4, 7.0), lx = hr.range(-0.6, 0.6), lz = hr.range(-0.6, 0.6), arm = hr.range(1.2, 2.4) * (hr.chance(0.5) ? 1 : -1);
      const dx = c20[0] - q[0], dz = c20[2] - q[1], dl = Math.hypot(dx, dz) || 1, run = dl - tr20 * 0.7, ux = dx / dl, uz = dz / dl, js = staveAt(t), S = staves[js];
      // (the roof's bough from the bole out along the roof and down on the wall's head over the post, as far as it
      //  is clear of the flight's lane: one that stops short is a roof bough only and narrows to a tip)
      const way = RIB.map(([f, h]) => (f === 0 ? [S.x, headY + 0.2, S.z] : [q[0] + ux * run * f + lx * (1 - f), DECK + h, q[1] + uz * run * f + lz * (1 - f)])).reverse(), rib = [];
      for (const v of way) { if (!clear(v[0], v[1], v[2], 0.4)) break; rib.push(v); }
      // (the post: as thick as it is drawn and as its place makes it; it leans its own way, but never more than a
      //  hand out toward the wall; its fork's two arms go up to the wall's head either side of it, one further than the other)
      const rp = r0 * (1.2 + 1.4 * hash1(i * 7.7 + r0 * 91));
      let fx = lx * 0.6, fz = lz * 0.6; const on = fx * S.nx + fz * S.nz; if (on > 0.15) { fx -= S.nx * (on - 0.15); fz -= S.nz * (on - 0.15); }
      const fork = [q[0] + fx, DECK + hf, q[1] + fz], foot = [q[0], DECK - 0.2, q[1]];
      const na = Math.round(Math.abs(arm) / WALL.stave) * Math.sign(arm), nb = -Math.sign(arm) * (1 + Math.floor(hash1(i * 3.3 + hf * 17) * 3));
      const tips = [na, nb].map((n) => armTo(fork, js + n)).filter(([m, tp]) => clear(tp[0], tp[1], tp[2], 0.3) && clear(m[0], m[1], m[2], 0.3));
      const stands = rib.length === way.length && !inBay(q) && clear(fork[0], fork[1], fork[2], 0.4) && clear(foot[0], foot[1] + 1, foot[2], 0.4);
      // (roof: whether this post's roof bough is drawn, by the post's own place and height of fork: two in five; rg: how stout)
      posts.push({ i, t, js, q, r0, rp, rib, whole: rib.length === way.length, fork, foot, stands, tips, roof: hash1(i * 5.9 + hf * 3.1) < 0.4, rg: 1 + 0.5 * hash1(i * 2.3 + hf) });
    }
    // WHICH COLUMNS OF THE WALL STAND (a column: the wall between two staves, floor to head): not in the ring's bay
    // and not in the near end (inBay: HALL.far either side of -Z, HALL.door either side of +Z, where no post
    // stands either: THE HALL'S NEAR END IS OPEN AS WIDE AS THE HALL, some 31 m, and its walls are its two long
    // sides; no corner of the wall lies nearer the line of the last flight than 10.2 m, and no post or post's arm
    // nearer than 9.4 m), on the platform's floor, clear of
    // the lane and the ring's view at every height, and no bough of the tree in it
    yield null;
    const byWall = []; for (const B of sk.boughs) for (let k = 1; k < B.pts.length; k++) { const a = B.pts[k - 1], b = B.pts[k]; if (Math.max(a[1], b[1]) > DECK - 1 && Math.min(a[1], b[1]) < headY + 1) byWall.push([a, b, Math.max(B.rad[k - 1], B.rad[k])]); }
    const colFree = (j) => {
      const a = stv(j), b = stv(j + 1);
      for (let f = 0; f <= 1; f += 0.5) {
        const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f); if (inBay([x, z]) || !inOval(x, z)) return false;
        for (let y = DECK + 0.45; y < headY + 0.3; y += 0.9) { if (!clear(x, y, z, 0.45)) return false; for (const s of byWall) if (segD(x, y, z, s[0], s[1]) < s[2] + 0.4) return false; }
      }
      return true;
    };
    // (a run: columns standing side by side; one of fewer than four, a sliver, does not stand)
    // (asked column by column, with a hand-back every forty: each asks the lane, the ring's view and the tree's boughs up its whole height)
    const stand = [], runs = [], wallCols = []; for (let j = 0; j < NSV; j++) { if (j && j % 40 === 0) yield null; stand.push(colFree(j)); }
    for (let j = 0; j < NSV; j++) if (stand[j] && !stand[(j + NSV - 1) % NSV]) { let n = 0; while (n < NSV && stand[(j + n) % NSV]) n++; if (n >= 4) runs.push([j, n]); }
    for (const [j0, n] of runs) for (let k = 0; k < n; k++) { const a = stv(j0 + k), b = stv(j0 + k + 1); wallCols.push({ a: [a.x, a.z], b: [b.x, b.z], A: [a.x, 0, a.z], B: [b.x, 0, b.z] }); }
    wallBy = (x, y, z, r) => {
      if (y - r > headY + 0.3 || y + r < DECK || !inHall(x, z, WALL.out + r + 0.4) || inHall(x, z, WALL.out - r - 0.4)) return false;
      // (a lamp, which is asked with more than half a metre, keeps a lamp's whole room off the wall: its body and the most any swing reaches)
      const rr = r > 0.55 ? Math.max(r, 1.0) : r;
      for (const c of wallCols) if (segD(x, 0, z, c.A, c.B) < rr + WALL.weave + 0.03) return true;
      return false;
    };
    // (a wall's end with no standing post within JAMB staves of it has a post of its own, one stave in from the end;
    //  and a span of wall longer than SPAN staves between two posts has one near its middle: these are laid by the
    //  place, not drawn, each as unlike the next as the drawn ones are)
    const JAMB = 4, SPAN = 14, laid = (e, arms) => {
      const S = stv(e), q = hallAt(S.t), h = (k) => hash1(e * 1.37 + k * 5.1), r0 = 0.15 + 0.08 * h(1), rp = r0 * (1.3 + 1.2 * h(2)), hf = 4.6 + 2.2 * h(3);
      const fork = [q[0] - S.nx * 0.15 * h(4), DECK + hf, q[1] - S.nz * 0.15 * h(4)], foot = [q[0], DECK - 0.2, q[1]];
      const tips = arms(h).map((j) => armTo(fork, j)).filter(([m, tp]) => clear(tp[0], tp[1], tp[2], 0.1) && clear(m[0], m[1], m[2], 0.3));
      posts.push({ i: posts.length, t: S.t, js: e, q, r0, rp, rib: [], whole: false, jamb: true, fork, foot, stands: clear(fork[0], fork[1], fork[2], 0.4) && clear(foot[0], foot[1] + 1, foot[2], 0.4), tips });
    };
    for (const [j0, n] of runs) {
      const at = posts.filter((p) => p.stands).map((p) => (((p.js - j0) % NSV) + NSV) % NSV).filter((c) => c <= n).sort((a, b) => a - b);
      if (!at.length || at[0] > JAMB) { laid(j0 + 1, (h) => [j0, j0 + 4 + Math.floor(h(5) * 2)]); at.unshift(1); }
      if (at[at.length - 1] < n - JAMB) { laid(j0 + n - 1, (h) => [j0 + n, j0 + n - 4 - Math.floor(h(5) * 2)]); at.push(n - 1); }
      for (let k = 1; k < at.length; k++) {
        const gap = at[k] - at[k - 1], m = Math.ceil(gap / SPAN);
        for (let u = 1; u < m; u++) { const e = j0 + at[k - 1] + Math.round(gap * u / m + (hash1(j0 + at[k] * 3.7 + u) - 0.5) * 2); laid(e, (h) => [e + 2 + Math.floor(h(5) * 2), e - 1 - Math.floor(h(6) * 2)]); }
      }
    }
    // (the two roof boughs that stand either side of the ring: those of the standing posts nearest the far bay on either hand)
    const byRing = [-1, 1].map((sd) => posts.filter((p) => p.stands && p.whole && Math.sign(p.q[0] - LX) === sd).sort((a, b) => a.q[1] - b.q[1])[0]).filter(Boolean);
    for (const p of byRing) p.roof = true;
    // (a lamp of the hall: asked the lane and the ring's view, not the boughs' rule; and it hangs clear of every
    //  post, its body with its whole swing and its cord)
    const hung = (x, y, z, r) => clear(x, y, z, r, true);
    const stems = () => { const o = []; for (const p of posts) if (p.stands) { o.push([p.foot, p.fork, p.rp * 1.2]); for (const [m, tp] of p.tips) o.push([p.fork, m, p.rp * 0.62], [m, tp, p.rp * 0.42]); } return o; };
    const offPosts = (st, x, y, z, cord) => { for (const s of st) { if (segD(x, y - cord, z, s[0], s[1]) < 1.0 + s[2]) return false; for (let c = cord - 1; c > 0; c -= 1) if (segD(x, y - c, z, s[0], s[1]) < 0.25 + s[2]) return false; } return true; };
    list.push({
      lamps(L, f) {
        // THE RING'S LIGHT (it lights what is built after it: floor, walls, roof; no light of the scene is made for
        // it): a warm glow low before the ring, three rows of it up the floor, each row fainter (the floor is lit
        // for some 18 m before the ring), and one over the ring and one at either side of it, on the nearest leaves
        for (const [d, k] of [[1.5, 1], [6.5, 0.6], [11.5, 0.3]]) for (const dx of [-4, 0, 4]) f.add(SEAT[0] + dx, DECK + 3, SEAT[2] + d, RING_GLOW, 2.2 * k);
        for (const [ox, oy] of [[0, PR + 2], [-PR - 2, 3], [PR + 2, 3]]) f.add(SEAT[0] + ox, SEAT[1] + oy, SEAT[2] + 1, RING_GLOW, 2);
        // (no eave across the open near end: a lamp's place there takes its numbers as every place does and no lamp hangs)
        let acc = 0, px = 0, pz = 0, nl = 0; const st = stems(), ey = DECK + EAVE - 0.2, atDoor = (x, z) => Math.abs(Math.atan2(x - HALL.cx, z - HALL.cz)) < HALL.door;
        for (let i = 0; i <= 360; i++) {
          const q = hallAt(i / 360 * TAU), inx = HALL.cx - q[0], inz = HALL.cz - q[1], il = Math.hypot(inx, inz) || 1, x = q[0] + inx / il * 0.5, z = q[1] + inz / il * 0.5;
          // (every second lamp's cord is WALL.low longer: two rows of lamps, one under the eave and one at a tall man's reach twice over)
          if (i > 0) { acc += Math.hypot(x - px, z - pz); if (acc >= EAVE_LAMP) { acc -= EAVE_LAMP; const c0 = hr.range(0.8, 2.6), size = hr.range(0.6, 0.85), cord = nl++ % 2 ? c0 + WALL.low : c0; K.hangLamp(L, f, hr, x, ey, z, cord, size, mix, glow, !atDoor(x, z) && offPosts(st, x, ey, z, cord) && K.swingRoom(hung, x, ey, z, cord, 0.6)); } }
          px = x; pz = z;
        }
        for (const p of byRing) for (let k = 1; k <= 5; k++) { const a = p.rib[p.rib.length - 1], b = p.rib[p.rib.length - 3], g = k / 5, x = lerp(a[0], b[0], g), y = lerp(a[1], b[1], g), z = lerp(a[2], b[2], g), cord = hr.range(1, 3); K.hangLamp(L, f, hr, x, y - 0.2, z, cord, hr.range(0.7, 0.95), mix, glow, offPosts(st, x, y - 0.2, z, cord) && K.swingRoom(hung, x, y - 0.2, z, cord, 0.6)); }
      },
    });
    // (the plain form: every bough three-sided through fewer points)
    yield null;
    const hallPiece = (s, c0, c1, plain) => {
      for (let c = c0; c < Math.min(posts.length, c1); c++) {
        const p = posts[c], n = p.rib.length, sides = plain ? 3 : 6;
        s.kind = 0;
        if (p.stands) {
          // (the post: stout at its foot, a little bowed, up to its fork; the fork's two arms up to the wall's head)
          const k = [(p.foot[0] + p.fork[0]) / 2 + (p.fork[2] - p.foot[2]) * 0.3, (p.foot[1] + p.fork[1]) / 2, (p.foot[2] + p.fork[2]) / 2 - (p.fork[0] - p.foot[0]) * 0.3];
          s.tube([p.foot, k, p.fork], [p.rp * 1.2, p.rp, p.rp * 0.9], sides, silverStem, false);
          for (const [m, tp] of p.tips) s.tube([p.fork, m, tp], [p.rp * 0.62, p.rp * 0.42, 0.07], plain ? 3 : 5, silverStem, false);
        }
        // (a roof bough: stout where it leaves the bole, slender where it comes down on the wall's head. FEW ARE
        //  DRAWN: the two that carry the lamps either side of the ring and, of the other standing posts', two in
        //  five by the post's own numbers (p.roof), each its own stoutness (p.rg). Everywhere else the roof is the
        //  tree's own gold leaf over the wall's head and no bough bows down to the eave: the hall is a walled
        //  house under the crown, not a fan of ribs.)
        if (n >= 2 && p.stands && p.roof) { const g = p.rg; if (plain && n >= 5) s.tube([p.rib[0], p.rib[2], p.rib[4], p.rib[n - 1]], [0.42 * g, 0.3 * g, 0.18 * g, 0.09 * g], 3, silverStem, false); else s.tube(p.rib, p.rib.map((_, k) => lerp(0.42, 0.09, k / (n - 1)) * g), sides, silverStem, false); }
      }
    };
    for (let c0 = 0; c0 < posts.length; c0 += 7) list.push({ geometry(s) { s.glow = glow; hallPiece(s, c0, c0 + 7, false); } });
    list.push({ plain(fb) { fb.glow = glow; hallPiece(fb, 0, posts.length, true); } });
    // THE WALLS' MAKING: A BASKET'S WEAVE. In a row every second stave has the strip before it and the next has it
    // behind: at a stave the strip is a flat face FLAT of the staves' step either way, WALL.weave out from the
    // wall's line or in from it, and between two staves a short face goes from the one to the other. A face that
    // stands out is lighter, one that stands in is darker (and the silver stave is seen before it); each has its
    // foot in its own shade; the next row is laid the other way. Colour: its row's (green, or silver in the band).
    // (wallLight: the lamps' light is asked once for a stave at a row's edge and shared by the corners there.)
    const greenA = [0.21, 0.43, 0.19], greenB = [0.29, 0.52, 0.24], ROW = (WALL.top - 0.05) / WALL.rows, FLAT = 0.36;
    const rowCol = (k) => (k >= WALL.band[0] && k <= WALL.band[1] ? silverWork : k % 2 ? greenB : greenA);
    const bothFaces = (f) => { const t = [0, 0, 0]; return { sample(x, y, z, nx, ny, nz, out) { f.sample(x, y, z, -nx, -ny, -nz, t); const a = t[0], b = t[1], c = t[2]; f.sample(x, y, z, nx, ny, nz, out); out[0] = Math.max(out[0], a); out[1] = Math.max(out[1], b); out[2] = Math.max(out[2], c); return out; } }; };
    // (soft: the lamps' light as the wall takes it. Its colour goes WALL.warm of the way to a lamp-gold of the same
    //  strength; its strength m becomes cap (1 - exp(-m / cap)), which is m where the light is faint and never over
    //  cap, where cap is WALL.most over the tree's own glow: so the baked light times the glow is at most WALL.most)
    const WALL_GOLD = [1.3, 1.0, 0.7], soft = (f) => ({ sample(x, y, z, nx, ny, nz, out) {
      f.sample(x, y, z, nx, ny, nz, out); const lum = (out[0] + out[1] + out[2]) / 3; if (lum <= 0) return out;
      for (let i = 0; i < 3; i++) out[i] = lerp(out[i], lum * WALL_GOLD[i], WALL.warm);
      const m = Math.max(out[0], out[1], out[2]), cap = WALL.most / glow, k = cap * (1 - Math.exp(-m / cap)) / m; out[0] *= k; out[1] *= k; out[2] *= k; return out;
    } });
    const wallLight = (f) => { const two = soft(bothFaces(f)), memo = new Map(); let key = -1; return { at(k) { key = k; }, sample(x, y, z, nx, ny, nz, out) { let m = memo.get(key); if (!m) { two.sample(x, y, z, nx, ny, nz, out); m = [out[0], out[1], out[2]]; memo.set(key, m); } out[0] = m[0]; out[1] = m[1]; out[2] = m[2]; return out; } }; };
    const wallPiece = function* (s, j0, n, k0, k1) {
      const f0 = s.field, wl = f0 ? wallLight(f0) : null; if (wl) s.field = wl; s.glow = glow; s.kind = 2;
      // (a corner of the weave: at stave c of the run, f of the step toward the next stave (or back), o out from the line)
      const pt = (c, f, o) => { const a = stv(j0 + c), b = stv(j0 + c + Math.sign(f)), g = Math.abs(f); return [a.x + (b.x - a.x) * g + a.nx * o, a.z + (b.z - a.z) * g + a.nz * o]; };
      const face = (c0, P, Q, y0, y1, k, ca, cb, col) => {
        let nx = Q[1] - P[1], nz = P[0] - Q[0]; const l = Math.hypot(nx, nz) || 1, a = stv(j0 + c0); if (nx * a.nx + nz * a.nz < 0) { nx = -nx; nz = -nz; } nx /= l; nz /= l;
        if (wl) wl.at(c0 * 64 + k); const A = s.v(P[0], y0, P[1], nx, 0, nz, mul3(col, ca * 0.86)); if (wl) wl.at(c0 * 64 + k + 1); const D = s.v(P[0], y1, P[1], nx, 0, nz, mul3(col, ca));
        return [A, D];
      };
      for (let k = k0; k < Math.min(k1, WALL.rows); k++) {
        const y0 = DECK + 0.05 + k * ROW, y1 = y0 + ROW - 0.04, col = rowCol(k);
        for (let c = 0; c <= n; c++) {
          const out = (c + k) % 2 === 0, o = out ? WALL.weave : -WALL.weave, sh = out ? 1.08 : 0.6, P = pt(c, c > 0 ? -FLAT : 0, o), Q = pt(c, c < n ? FLAT : 0, o);
          const [A, D] = face(c, P, Q, y0, y1, k, sh, sh, col), [B, C] = face(c, Q, P, y0, y1, k, sh, sh, col); s.quad(A, B, C, D);
          if (c < n) { const R = pt(c + 1, -FLAT, -o), [E, H] = face(c, Q, R, y0, y1, k, sh, 0, col), [F, G] = face(c + 1, R, Q, y0, y1, k, out ? 0.6 : 1.08, 0, col); s.quad(E, F, G, H); }
        }
        // (a hand-back after every row; the wall's own light and kind are set again, as nothing else is made meanwhile)
        yield;
      }
      s.field = f0; s.glow = glow;
    };
    // (the staves and the head bough of a run; the plain form: the head bough alone, three-sided through every fourth stave)
    const wallFrame = (s, j0, n, plain) => {
      if (!plain) {
        const f0 = s.field; if (f0) s.field = soft(bothFaces(f0)); s.glow = glow; s.kind = 2;
        for (let c = 0; c <= n; c++) { const a = stv(j0 + c); s.tube([[a.x, DECK - 0.1, a.z], [a.x, headY, a.z]], [0.08, 0.08], 4, silverWork, false); }
        s.field = f0;
      }
      s.glow = glow; s.kind = 0;
      const pts = [], step = plain ? 4 : 1; for (let c = 0; c < n; c += step) { const a = stv(j0 + c); pts.push([a.x, headY + 0.05 * Math.sin((j0 + c) * 1.7), a.z]); }
      { const a = stv(j0 + n); pts.push([a.x, headY, a.z]); }
      s.tube(pts, pts.map(() => 0.14), plain ? 3 : 5, silverStem, false);
    };
    for (const [j0, n] of runs) {
      for (let k0 = 0; k0 < WALL.rows; k0 += 5) list.push({ *geometry(s) { yield* wallPiece(s, j0, n, k0, k0 + 5); } });
      list.push({
        geometry(s) { wallFrame(s, j0, n, false); },
        // (the plain form: one face to every four columns in each of the wall's three bands, and the head bough)
        plain(fb) {
          const f0 = fb.field; if (f0) fb.field = soft(bothFaces(f0)); fb.glow = glow; fb.kind = 5;
          const gm = mix3(greenA, greenB, 0.5), bands = [[0, WALL.band[0], gm], [WALL.band[0], WALL.band[1] + 1, silverWork], [WALL.band[1] + 1, WALL.rows, gm]];
          for (let c = 0; c < n; c += 4) { const a = stv(j0 + c), b = stv(j0 + Math.min(n, c + 4)); for (const [k0, k1, col] of bands) { const y0 = DECK + 0.05 + k0 * ROW, y1 = DECK + 0.05 + k1 * ROW; fb.face([a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z], mul3(col, 0.9)); } }
          fb.field = f0; fb.glow = glow; wallFrame(fb, j0, n, true);
        },
      });
    }
    // BEHIND THE RING THE SKY STANDS OPEN. The ring stands at the platform's far end against the sky, the hall's lamps
    // and the two lamp-hung boughs either side of it for its frame. Its BACK is closed by one made thing: a round
    // screen of pale plaited work, BACK_PAD wider than the ring and BACK_D behind its plane (beyond the lane's half
    // depth), a silver hoop round it, hung on two arms that the boughs either side of the ring send round behind
    // it. From before the ring it is hidden behind the ring's own disc; from the road, the gate and the ladder's
    // side, which lie behind it, it is what is seen, lit from within by the ring (RING_GLOW), and neither the
    // ring's back nor its glow.
    const BACK_D = HERO.back, BACK_PAD = 0.5, backR = PR + BACK_PAD, backZ = SEAT[2] - BACK_D;
    const backArm = (p) => { const e = p.rib[p.rib.length - 1], sd = Math.sign(p.q[0] - LX); return [e, [LX + sd * (backR + 1.2), SEAT[1] + 3, SEAT[2] - BACK_D * 0.4], [LX + sd * backR, SEAT[1] + 1, backZ - 0.2]]; };
    const backScreen = (s, ns) => {
      s.kind = 5;
      for (let i = 0; i < ns; i++) {
        const a = i / ns * TAU, b = (i + 1) / ns * TAU, A = [SEAT[0] + Math.cos(a) * backR, SEAT[1] + Math.sin(a) * backR, backZ], B = [SEAT[0] + Math.cos(b) * backR, SEAT[1] + Math.sin(b) * backR, backZ], C = [SEAT[0], SEAT[1], backZ];
        // (two faces to a slice: one looks to the ring and takes its light, one looks out behind)
        s.face(A, B, C, C, P.screen, [Math.cos(a) * backR, Math.sin(a) * backR, Math.cos(b) * backR, Math.sin(b) * backR, 0, 0, 0, 0]);
        s.face(B, A, C, C, mul3(P.screen, 0.85), [Math.cos(b) * backR, Math.sin(b) * backR, Math.cos(a) * backR, Math.sin(a) * backR, 0, 0, 0, 0]);
      }
      s.kind = 0; const hoop = []; for (let i = 0; i <= ns; i++) { const a = i / ns * TAU; hoop.push([SEAT[0] + Math.cos(a) * (backR + 0.1), SEAT[1] + Math.sin(a) * (backR + 0.1), backZ]); }
      s.tube(hoop, hoop.map(() => 0.26), 4, silverStem, false);
    };
    // THE SCREEN'S BACK IS LEAF. (Seen from the lawn, the gate and the road, which lie behind and below it, the bare
    // round screen read as a flat dark thing by the last platform.) Gold leaf lies on its back as it lies on a wall:
    // BACK_N sprays laid on a sunflower's plan (a made thing, the same on every visit, like the chairs), each
    // looking out behind and a little outward, none reaching past the screen's own rim: from before the ring the
    // ring's disc and the screen hide every one of them, so the ring still stands against the sky. They lie on a
    // dome, BACK_BULGE deep at the screen's middle and nothing at its rim: from below and behind it is a rounded
    // mass of leaf and not a flat disc.
    const BACK_N = 96, BACK_BULGE = 3.2, backLeaf = (l, every) => {
      for (let k = 0; k < BACK_N; k += every) {
        let j = 0; const h = () => hash1(k * 17.3 + (j++) * 3.1);
        const e = Math.sqrt((k + 0.5) / BACK_N), a = k * 2.39996, sz = 3.2 + 1.4 * h(), r = (backR - sz * 0.6) * e;
        const x = SEAT[0] + Math.cos(a) * r, y = SEAT[1] + Math.sin(a) * r, z = backZ - 0.4 - BACK_BULGE * (1 - e * e) - 0.5 * h();
        const nx = Math.cos(a) * 0.9 * e + (h() - 0.5) * 0.3, ny = Math.sin(a) * 0.9 * e + (h() - 0.5) * 0.3 + 0.1, nz = -(1 - 0.6 * e), nl = Math.hypot(nx, ny, nz);
        l.add(x, y, z, nx / nl, ny / nl, nz / nl, h() * TAU, sz, 3, 0.3, h(), K.leafCol(h, 1.0), nx / nl, ny / nl, nz / nl, 0.8);
      }
    };
    list.push({
      lamps(L, f) { for (const dx of [-5, 5]) f.add(SEAT[0] + dx, SEAT[1], backZ + 1.5, RING_GLOW, 2.2); f.add(SEAT[0], SEAT[1], backZ - BACK_BULGE - 3, RING_GLOW, 1.2); },
      plain(fb, fl) { fb.glow = glow; fb.kind = 0; for (const p of byRing) fb.tube(backArm(p), [p.r0, 0.2, 0.12], 3, silverStem, false); backScreen(fb, 12); if (fl) { fl.glow = glow; backLeaf(fl, 2); } },
      geometry(s, l) { s.glow = glow; s.kind = 0; for (const p of byRing) s.tube(backArm(p), [p.r0, 0.2, 0.12], 6, silverStem, false); backScreen(s, 24); if (l) { l.glow = glow; backLeaf(l, 1); } },
    });
    // two empty chairs side by side at the bole's foot, under the trunk, facing the bay the flight comes in by
    list.push({
      geometry(s) {
        s.glow = glow;
        const c = sk.centre(DECK), zc = c[2] + tR(DECK) + 1.6, wht = mul3(P.white, 0.97);
        for (const cx of [c[0] - 1.25, c[0] + 1.25]) {
          s.kind = 2;
          for (const sx of [-0.62, 0.62]) {
            for (const sz of [-0.5, 0.5]) s.beam([cx + sx, DECK, zc + sz], [cx + sx, DECK + (sz < 0 ? 2.7 : 1.15), zc + sz], 0.13, wht);
            s.beam([cx + sx, DECK + 1.15, zc - 0.5], [cx + sx, DECK + 1.15, zc + 0.5], 0.12, wht);
          }
          for (const dz of [-0.36, -0.12, 0.12, 0.36]) s.beam([cx - 0.62, DECK + 0.62, zc + dz], [cx + 0.62, DECK + 0.62, zc + dz], 0.22, wht);
          for (const h of [1.25, 1.9, 2.6]) s.beam([cx - 0.62, DECK + h, zc - 0.5], [cx + 0.62, DECK + h, zc - 0.5], 0.14, wht);
        }
      },
    });
    yield null;
    // --- the hall's roof of gold leaves on its ribs: 480 sprays over the vault (the plain form: every second of them)
    const roofKept = [], roofSprays = (l, hr, n) => {
        for (let k = 0; k < n; k++) {
          const a = hr.range(0, TAU), e = Math.pow(hr(), 0.4), sa = Math.sin(a), ca = Math.cos(a), q = 2 / 3, sz = hr.range(3.6, 5.2);
          const x = HALL.cx + Math.sign(sa) * Math.pow(Math.abs(sa), q) * HALL.a * e, z = HALL.cz + Math.sign(ca) * Math.pow(Math.abs(ca), q) * HALL.b * e;
          const ox = x - HALL.cx, oz = z - HALL.cz, ol = Math.hypot(ox, oz) || 1, slope = clamp((vault(e - 0.04) - vault(e + 0.04)) / Math.max(0.08 * ol / Math.max(e, 0.05), 0.1), 0, 4);
          let nx = ox / ol * slope + hr.gauss() * 0.15, nz = oz / ol * slope + hr.gauss() * 0.15; const nl = Math.hypot(nx, 1, nz); nx /= nl; nz /= nl;
          // (a spray's middle stands half its own size out along the vault's normal)
          const lift = sz * 0.5 + 0.3 + hr.range(0, 0.8), px = x + nx * lift, py = DECK + vault(e) + lift / nl, pz = z + nz * lift;
          const card = [px, py, pz, nx, 1 / nl, nz, hr() * TAU, sz, 3, 0.3, hr(), K.leafCol(hr, 1.05), nx, 1 / nl, nz, 0.8];
          if (Math.hypot(px, pz) < 3.5 || (opts.clear && !opts.clear(px, py, pz, 0.5)) || !leafHall(px, py, pz, sz * 0.5)) continue;
          l.add(...card); if (k % 2 === 0) roofKept.push(card);
        }
    };
    for (let k0 = 0; k0 < 480; k0 += 120) list.push({ geometry(s, l) { l.glow = glow; roofSprays(l, hr, 120); } });
    list.push({ plain(fb, fl) { fl.glow = glow; for (const c of roofKept) fl.add(...c); } });
    yield null;
    // --- lamps on long cords from the hall's roof: NONE OF THEM HANGS. Each is asked through clear, whose rule for the
    //     tree's own boughs keeps the hall's room under its roof free of a thing as thick as a lamp with its swing;
    //     their numbers are drawn, so that the hall's stream deals as it always has, and no lamp is made. (The
    //     hall's lamps are those under its eave and on the two roof boughs by the ring, which are asked through hung.)
    list.push({
      lamps(L, f) {
        const up = sk.boughs.filter((B) => B.ti === 4);
        for (let k = 0; k < 150 && up.length; k++) {
          const B = up[hr.int(0, up.length - 1)], q = sk.boughAt(B, hr.range(0.1, 0.9) * B.frac), x = q[0] + hr.range(-3, 3), z = q[2] + hr.range(-3, 3), cord = hr.range(5, 11);
          K.hangLamp(L, f, hr, x, q[1] - 0.3, z, cord, hr.range(0.7, 1.0), mix, glow, inHall(x, z, -1.5) && q[1] - cord >= DECK + 4.5 && Math.hypot(x, z) >= 3.4 && K.swingRoom(clear, x, q[1] - 0.3, z, cord, 0.6));
        }
      },
    });
    yield null;
    // --- lamps over the great platform's edge: the platform has no rail; where the boughs of the whorl over the hall
    //     reach out over its edge (within EDGE of it, outside the hall's eave), lamps hang from them on long cords
    //     down to one or two men's height over the floor (never in the flight's lane or before the ring: each is
    //     asked the room of its whole swing, lamp and cord)
    list.push({
      lamps(L, f) {
        const up = sk.boughs.filter((B) => B.ti === 4), EDGE = 2.5;
        for (let k = 0; k < 90 && up.length; k++) {
          const B = up[hr.int(0, up.length - 1)], q = sk.boughAt(B, hr.range(0.45, 1) * B.frac), x = q[0] + hr.range(-2, 2), z = q[2] + hr.range(-2, 2), low = DECK + hr.range(2.5, 5.5), size = hr.range(0.7, 1.0);
          K.hangLamp(L, f, hr, x, q[1] - 0.3, z, q[1] - 0.3 - low, size, mix, glow, !inHall(x, z, 1) && Math.abs(deckR(Math.atan2(x, z)) - Math.hypot(x, z)) <= EDGE && K.swingRoom(clear, x, q[1] - 0.3, z, q[1] - 0.3 - low, 0.6));
        }
      },
    });
    yield* list;
  };
  await ctx.yield();
  const far = opts.far ? { solid: new K.Solid(8192), leaves: new K.Leaves(8192), sides: 12, every: 2, bSeg: 3 } : null;
  if (far) pacer.watch(far);
  const info = await K.growTreeAsync({
    rng, x: 0, y: 0, z: 0, H, R, trunkR, bare: BARE, masses: true, lod: 3, solid: sb, leaves: lb, lamps: lm, field, glow, mix, tiers, crownBase: TC, Lmax: 28, clear, leafClear, parts, far,
    boughLamps: 170, cordMax: 5, bend: 0.004, flare: 0.6, leafK: opts.leafK ?? 1, tint: 1,
    // (the great tree plans long before it makes anything: its planning hands back outright, see growSteps; and
    //  its parts are made into builders of their own, which the pacer does not count: every step of its growth
    //  asks the engine itself)
    handBack: () => ctx.yield(),
  }, () => ctx.yield());
  // (the test of what was made, in two parts with a hand-back before each: it asks a question of every card and corner)
  await rest(3000);
  let swept = null;
  if (opts.blocked) {
    swept = K.sweep({ leaves: lb }, opts.blocked, opts.blockedLeaf);
    await rest(3000);
    { const q = K.sweep({ lamps: lm }, opts.blocked, opts.blockedLeaf); for (const k in q) if (typeof q[k] === 'number') swept[k] = (swept[k] || 0) + q[k]; }
    await rest(3000);
    // (the solid's corners are asked a part at a time; its triangles go when the last part has been asked: see sweep)
    for (let i = 0; i === 0 || i < sb.count; i += 6000) { const q = K.sweep({ solid: sb }, opts.blocked, null, i, i + 6000); swept.triangles += q.triangles; await ctx.yield(); }
    if (far) { await rest(1500); const f = K.sweep({ solid: far.solid, leaves: far.leaves }, opts.blocked, opts.blockedLeaf); swept.cards += f.cards; swept.triangles += f.triangles; }
  }
  await rest(3000);
  // (the whole tree and its plain copy stand in two groups of their own; the lamps' glow belongs to neither: a lamp's
  // light is seen at every distance)
  const whole = new THREE.Group(), plain = new THREE.Group(), band = far ? opts.far.band : null; object.add(whole, plain);
  const fmW = band ? K.fadeMats(band[0], band[1], true) : null, fmP = band ? K.fadeMats(band[0], band[1], false) : null;
  const made = K.meshes(whole, { solid: sb, thin: tb }, fmW);
  await rest(2500);
  Object.assign(made, K.meshes(whole, { leaves: lb }, fmW));
  await rest(2500);
  Object.assign(made, K.meshes(whole, { lamps: lm }, fmW));
  if (made.lampGlow) object.add(made.lampGlow);
  await rest(1500);
  if (far) { K.meshes(plain, { solid: far.solid, leaves: far.leaves }, fmP); await rest(1500); }
  const stats = { triangles: sb.triangles + tb.triangles + lb.triangles + lm.triangles, lamps: lm.count, cards: lb.count, swept, far: far ? far.solid.triangles + far.leaves.triangles : 0 };

  return {
    object, whole, plain, radius: HERO.crownR + 2, height: H, center: new THREE.Vector3(0, 74, 0), kit: K, info, made, stats,
    anchors: {
      portalSeat: new THREE.Vector3(SEAT[0], SEAT[1], SEAT[2]), approach: new THREE.Vector3(LX, FLY, SEAT[2] + 60), deck: new THREE.Vector3(OC[0], DECK, OC[1]),
      lowest: new THREE.Vector3(0, FLET_H[0], 0), gaze: new THREE.Vector3(0, 80, 0), crown: new THREE.Vector3(0, 110, 0),
    },
    update(dt, time) { K.U.uTime.value = time; K.adopt(object); },
    dispose() {},
    ground: true, groundY: 0,
  };
}
