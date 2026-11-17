// HERO SET PIECE for "million-mirrors": THE MIRROR NAVE AND THE GLOBE.
//
// What it is
//   The whole mirror-work hall as one self-lit piece: five muqarnas honeycomb domes in a row on pendentives and
//   four-centred arches, the bay walls with their ten window openings, both end walls (door opening, apse arch), the
//   mirrored apse niche with its own half-dome, the inlaid marble floor, the long dark pool with its eight-sided
//   basin, and at the heart of it the great chandelier: a silver bell of three rings of candles and cut crystal hung
//   so low that its built reflection completes a globe of light on the water. Two lesser chandeliers hang high under
//   the first and last dome. The great chandelier is built at GREAT = 1.3 times the brief's size, so bell and
//   reflection together are a ball 26.6 m across.
//   Local space: origin on the floor under the middle dome, +Y up, the nave runs along Z. The DOORS are at z = -150 and
//   the APSE at z = +150 (niche to z = 184), so  local z = the brief's z - 150 : put the object at (0, 0, 150) in a
//   world laid out like the brief and fly towards +Z. The hall is symmetric, so "front" is either end.
//   Sizes: nave 70 m wide (walls x = +-35, piers to x = +-29), domes 54 m across springing at 31 m, crowns at 62 m,
//   centres z = -120, -60, 0, 60, 120. Windows: openings 12 m wide, sill 9 m, pointed head 27.5 m (lower than the
//   brief's 35 m so they fit under the bay arches). Pool: water at y = -0.4, 22 m wide, z -126..126, basin apothem 25.
//
// The art style and how it is done, so the world can match it
//   Every surface of the piece uses ONE ShaderMaterial family (hero.materials.hall) that lights itself; no scene
//   lights are read. Mirror: the fragment shader lays a triangle-and-rhombus mosaic over each cell (attribute aUv in
//   metres, aMat.y = facet size), gives each facet a hashed tilt (half lie nearly true, half well out of true),
//   reflects the eye ray and looks it up in an ANALYTIC room (envMirror): a warm floor and a dark vault, the three
//   chandeliers (ray against the bell's axis, rows of dots, so near plates hold a tiny chandelier) and a wide gold
//   halo round each, the ten STAINED windows (MM_GLASS: a girih of stars, octagons and diamonds in ruby, sapphire,
//   emerald and amber, the same pattern the world's panes draw), the sun's coloured quarries on the floor, the portal,
//   two firework bursts. Facets double in size until they cover about 1.35 % of the frame height (uFacetPx), so they
//   read as tiles of flat colour, not specks. On top of that every facet carries a phase that drifts with the
//   reflected ray and with time: a small share is "hot" (a soft point of light) and a larger share "warm": a clear
//   jewel colour chosen by a slow field in the smooth vault's reflected direction, so patches of ruby, sapphire,
//   emerald and amber slide over walls and vaults as the eye moves (uGlit = hot share, warm share, gain, pool gain;
//   uJewel = window glow, candle gold, second reflections). Plates wider than ~20 px also show, about half of them,
//   a small ring-of-dots chandelier that slides as the eye moves (chIcon). In the apse niche (z > 150) the facets are
//   a dark shell that repeats the portal as hard emerald discs, crowded in a halo round its rim, and the portal
//   lights dado, floor and ribs there. Ribs are gilt stucco and fade with distance instead of thickening into a cage.
//   One caustic function (two animated cell layers projected up from the pool, soft and fine) is added to every matt
//   surface and drives a slow band in the mirrors. Everything that is not mirror (gilt stucco, cream marble inlaid
//   with jewel-coloured stars, silver, wax) is matt: ambient + candle falloff + window fill + analytic window pools
//   + caustics + the alcove lanterns (uLamp, one either flank of every pier at y 10.4). Candles burn gold in every
//   look but moonlight. Match it with matt props in ruby, sapphire, emerald, gold and cream, bloom about 0.3 at
//   threshold 1.1.
//
// opts
//   palette   [blue-black, dusk blue, deep emerald, pale emerald (the accent), silver, flame white, grey] hex strings
//   look      'dusk' (default) | 'noon' | 'moon' | 'snow'   (also hero.setLook(name) later)
//   floor     true   build the nave floor (set false if the world lays its own; the pool rim stays)
//   lesser    true   build the two lesser chandeliers
//
// anchors (hero-local space)
//   offset        (0,0,150): where to put the object in a world laid out like the brief (brief z = local z + 150)
//   portalSeat    { position (0,12,180), normal (0,0,-1), radius 7 }  the exit portal inside the niche, facing the nave
//   doors         { hingeL, hingeR, width 9, height 26, z -150 }      two leaves hinged at x = -+9, opening into the hall
//   entry         (0,9,-150) the threshold on the axis
//   flyThrough    the journey as an ordered list of points, checked >= 5 m clear of the vaults (it dips under the
//                 arch between domes 2 and 3; the brief's 40 m crossing and 38 m orbit top would pass through them)
//   orbit         { center, radius 25, yTop 25.5, yLow 3.6 }          the orbit round the great chandelier
//   globe         { center (0,-0.4,0), radius 13.3 }  bell and reflection together;  chandelier { center, top, collar }
//   collar        (0,18.5,0) radius 1.5: the chain collar where doves settle (perchY);  cornice: perches on the pier capitals (y 16.6)
//   lesser        [ (0,31,-120), (0,31,120) ] lowest drops of the two lesser chandeliers (bells 16 m across)
//   domes         [ { center (springing), rim 26.9, crownY } x5 ];  closePass (16,44,-55): 8 m from dome 2's east side
//   windows       [ { position (sill centre), normal, width 12, sill 9, spring 22, apex 27.5 } x10 ]  put panes here
//   pool          { waterY, floorY, halfWidth 11, zMin, zMax, basin 25, outline [[x,z]..], koiY -1.1, koiRadius [8,19] }
//   viewpoints    named camera positions with look targets
//   extent        the true bounding box (radius/height below are the GLOBE's, so the test viewer orbits inside the hall)
//
// Extra API
//   setProgress(u)   the journey's u: the hall's glints swell from 55% to full, dome after dome, as the doors open
//                    (u 0.03 .. 0.12). Never called = fully lit.
//   setLook(name | { ...uniform values })   the brief's variations (see LOOKS below)
//   setBurst(i, position, colour, strength) i = 0|1: a firework outside the windows; every mirror takes it up
//   setPortalColor(hex, strength)           the niche repeats the portal in its facets
//   uniforms, materials { hall, frame, water, drops, flames }, waterMesh
//   makeMaterial(defines, extra)            the hall shader for the world's own props. With { MM_PROP: 1 } aEdge is
//                                           (sway m, phase, bob m); kind 8 (aMat.x) is a kilim runner, aMat.y its half
//                                           width; kind 9 is lit lantern glass (uLamp colour)
//   MM_GLASS (named export)                 the GLSL of the stained glass (mmJewel, mmGlass) for the world's panes
//
// Size and cost: radius 9 / height 20 describe the globe; the hall itself is 73 x 63 x 334 m. About 115k triangles,
// 7 draw calls (hall, pool floor, water, frame, frame reflection, crystal, flames), no lights, no textures, build ~170 ms.
// On the 'low' graphics level the mosaic skips its cross-fade between facet sizes; crystal is thinned by quality.detail.
// Lighting it expects: none. It is self-lit and wants a near black blue fog (#070D14, thin) and a dark background;
// honours scene.fog. What is seen through the ten window openings and the door is the world's to supply.
// Draw order: pool floor -0.5 (writes no depth), water 1, reflected frame 2, crystal 3, flames 4. Things lying ON the
// water (petals, y >= -0.38) just work; things IN it (koi, y about -1.1) show through the water from above only, so
// keep them opaque, pale and at renderOrder 0. A floor of your own (opts.floor false) must leave the pool outline open.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#070D14', '#1C3556', '#0E3B33', '#8FE3C0', '#C9D6E2', '#F2F8FF', '#4A4640'];
const WATER_Y = -0.4, POOL_FLOOR_Y = -1.9;
const DOME_Z = [-120, -60, 0, 60, 120];
const WALL_X = 35, PIER_X = 29, SPRING_Y = 16, RING_Y = 30, RING_R = 27, DOME_R = 26.9, DOME_Y = 31, DOME_H = 31;
const DADO_Y = 8, WIN_SILL = 9, WIN_HALF = 6, WIN_SPRING = 22, WIN_APEX = 27.5;
const NICHE_Z0 = 150, NICHE_ZC = 171, NICHE_R = 13;
const GREAT = 1.3;          // scale of the great chandelier: bell 26.6 m across, the globe 29.4 m tall
const LESSER = 0.8, LESSER_Y = 31;   // the two lesser chandeliers: bells 16 m across, lowest drops 31 m up

// four-centred (Persian) arch: height above the floor at lateral distance d from the crown
const archY = (d, a, ys, yc) => { const u = Math.min(Math.abs(d) / a, 1); return ys + (yc - ys) * (0.55 * Math.sqrt(1 - u * u) + 0.45 * (1 - u)); };
const winHead = (d) => archY(d, WIN_HALF, WIN_SPRING, WIN_APEX);

// ------------------------------------------------------------------------------------------------ GLSL
// The stained sash of the windows: a star-and-cross lattice on a 2.4 m repeat. q = (along the wall / 2.4 + .5, (height - sill) / 2.4),
// s = which wall, aa = blur in cells. rgb = the tint of the piece of glass, a = 0 on the leads between pieces. The same
// function draws the panes (the world's shader), the window's image in near mirrors, marble and silver, the quarries the
// sun lays on floor and water, and the columns of colour in the pool.
export const MM_GLASS = /* glsl */`
vec3 mmJewel(float h){ return h < .28 ? vec3(1.5, .09, .15) : (h < .56 ? vec3(.1, .28, 1.6) : (h < .78 ? vec3(.12, 1.15, .4) : vec3(1.6, .86, .14))); }
vec4 mmGlass(vec2 q, float s, float aa, float stain){
  vec2 c = floor(q), p = fract(q) - .5, a = abs(p);
  float sq = max(a.x, a.y), di = (a.x + a.y) * .7071;
  float star = min(sq, di) - .27, oct = max(sq, di) - .19, cor = (1. - a.x - a.y) * .7071 - .16;
  vec3 hs = fract(sin(vec3(dot(c + s * 7., vec2(127.1, 311.7)), dot(c + s * 7., vec2(269.5, 183.3)), dot(c + s * 7., vec2(419.2, 371.9)))) * 43758.5453);
  vec3 col; float d;
  if (oct < 0.) { col = mix(vec3(1., .98, .9), hs.z < .6 ? vec3(1.6, .86, .14) : vec3(1.), stain); d = -oct; }
  else if (star < 0.) { col = mix(mix(vec3(1.), vec3(.62, 1., .82), step(.5, hs.x)), mmJewel(hs.x), stain); d = min(-star, oct); }
  else if (cor < 0.) { vec2 k = floor(q + .5) + s * 3.1; float hk = fract(sin(dot(k, vec2(127.1, 311.7))) * 43758.5453);
    col = mix(vec3(.62, 1., .82), mmJewel(fract(hk * 1.7 + .1)), stain); d = -cor; }
  else { float side = step(a.y, a.x);
    vec2 k = c + .5 * (side > .5 ? vec2(p.x > 0. ? 1. : -1., 0.) : vec2(0., p.y > 0. ? 1. : -1.));
    float hk = fract(sin(dot(k * 2. + s * 5.3, vec2(269.5, 183.3))) * 43758.5453);
    col = hk < .3 ? vec3(.7, 1., .84) : (hk < .55 ? mix(vec3(1.), vec3(1.15, .95, .62), stain) : vec3(1.));
    d = min(min(star, cor), abs(a.x - a.y) * .7071); }
  return vec4(col, smoothstep(.03 - aa, .03 + aa, d)); }
`;
const MM_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uCamL;
uniform vec4 uFlame;        // rgb flame colour, a = HDR gain
uniform vec4 uLit;          // great chandelier rings low, mid, top; lesser chandeliers
uniform vec3 uWinTop, uWinBot;
uniform vec2 uWinGain;      // west (-x) and east (+x) windows
uniform float uStain;
uniform vec3 uCausCol;
uniform vec3 uPortalCol;
uniform vec3 uBurstPos[2];
uniform vec3 uBurstCol[2];
uniform vec3 uBody;
uniform vec4 uCh[3];        // chandelier base centres, w = scale
uniform vec3 uSpark;
uniform vec4 uVar;          // seed, caustic scale, facet tilt, rhombus share
uniform float uIgnite;      // z of the front of the opening swell
uniform vec4 uGlit;         // share of facets that blaze, share that hold a colour, glitter gain, pool band gain
uniform vec3 uGhost;        // what an unlit chandelier still gives back to a mirror (moonlight)
uniform vec3 uBeamDir[2]; uniform vec3 uBeamCol[2];
uniform float uDropSide;    // candles out: how far the bell is lit from the window side only (0 dusk .. 1 moonlight)
uniform vec3 uRoomLo, uRoomHi;   // what a mirror turned to the floor, and to the vault, gives back
uniform vec3 uJewel;        // gains: the windows' colours in the mirrors, the candles' gold round the bell's image, the second reflections
uniform vec4 uLamp;         // rgb of the lanterns in the pier alcoves, a = their reach (m, squared)
const vec3 PORTAL_C = vec3(0., 12., 180.);
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
vec3 h23(vec2 p){ return fract(sin(vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)))) * 43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
${MM_GLASS}
float mmCell(vec2 p){ vec2 n = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = .5 + .4 * sin(uTime * .35 + 6.2831 * h22(n + g)); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; } }
  return sqrt(d2) - sqrt(d1); }
// the net of light thrown up from the pool, in hero-local space: soft threads, never hard veins
float caustic(vec3 P, vec3 N){
  vec2 p = (P.xz + N.xz * P.y) * uVar.y;
  p += .6 * vec2(sin(p.y * .9 + uTime * .21), cos(p.x * .8 - uTime * .17));
  float a = mmCell(p + uTime * vec2(.03, .05)), b = mmCell(p * 1.63 + vec2(7.1, 3.3) - uTime * vec2(.05, .02));
  float c = (1. - smoothstep(0., .3, a)) + .8 * (1. - smoothstep(0., .34, b));
  return c * c * .3; }
float chRow(float d, float h, float R, float H, float sg, float dots){
  float e = (h - H) / sg; float c = .5 + .5 * cos(d * 4.4 + H * 2. + uTime * .3); c *= c; c *= c;
  float Rw = R + 3. * (1. - dots);
  return exp(-e * e) * (1. - smoothstep(Rw - .5, Rw, abs(d))) * mix(.5, c * c * 3.4, dots); }
// what a ray from P along r sees of one chandelier: rows of flames (dots = 1) or a soft bell (dots = 0)
float chImage(vec3 P, vec3 r, vec4 c, vec3 lit, float dots){
  vec2 rx = r.xz; float l2 = max(dot(rx, rx), 1e-4); vec2 d0 = P.xz - c.xz;
  float t = -dot(d0, rx) / l2;
  float d = (d0.x * rx.y - d0.y * rx.x) * inversesqrt(l2) / c.w;
  float h = (P.y + t * r.y - c.y) / c.w; float refl = 1.;
  if (h < 0. && c.w > .9) { h = -h; refl = .6; }
  float sg = mix(2.2, .65, dots);
  float I = lit.x * chRow(d, h, 9., 2.9, sg, dots) + lit.y * chRow(d, h, 7., 7.4, sg, dots) + lit.z * chRow(d, h, 4., 10.9, sg, dots);
  float env = sqrt(max(100. - h * h, 0.));
  float lg = max(lit.x, max(lit.y, lit.z));
  I += mix(.1, .025, dots) * lg * (1. - smoothstep(env - 2., env, abs(d))) * step(h, 10.);
  I += .3 * lg * dots * (1. - smoothstep(.12, .4, abs(d))) * step(12.5, h) * step(h, 61.);
  return I * refl * step(0., t) * mix(.55, 1., dots); }
// the windows as seen along a ray: the true image, lattice and all (near plates, marble, silver)
vec3 winEnv(vec3 P, vec3 r){
  float s = r.x >= 0. ? 1. : -1.; float ax = max(abs(r.x), 1e-3);
  float t = max(35. - s * P.x, 0.) / ax; vec3 H = P + r * t;
  float zb = mod(H.z + 30., 60.) - 30.; float hd = 27.5 - 5.5 * (zb * zb / 36.);
  float m = (1. - smoothstep(5.5, 6., abs(zb))) * smoothstep(9., 9.5, H.y) * (1. - smoothstep(hd - .5, hd, H.y)) * step(abs(H.z), 149.) * smoothstep(.02, .08, abs(r.x));
  vec4 g = mmGlass(vec2(zb / 2.4 + .5, (H.y - 9.) / 2.4), s, .02 + t * .0015, uStain);
  vec3 col = mix(uWinBot, uWinTop, clamp((H.y - 9.) / 18., 0., 1.)) * g.rgb * mix(.3, 1., g.a);
  return col * (m * (s > 0. ? uWinGain.y : uWinGain.x)); }
// the windows as a field of small mirrors takes them up: a glow far wider than the opening, in big quarries of the
// glass's own colours, so whole patches of facets turn ruby, sapphire, emerald and amber and slide as the eye moves
vec3 winGlow(vec3 P, vec3 r){
  float s = r.x >= 0. ? 1. : -1.; float ax = max(abs(r.x), 1e-3);
  float t = max(35. - s * P.x, 0.) / ax; vec3 H = P + r * t;
  float zb = mod(H.z + 30., 60.) - 30.; float hd = 27.5 - 5.5 * (zb * zb / 36.);
  float dz = max(abs(zb) - 6., 0.), dy = max(max(9. - H.y, H.y - hd), 0.);
  float m = exp(-(dz * dz + dy * dy) / 38.) * step(abs(H.z), 153.) * smoothstep(.02, .1, abs(r.x));
  vec2 c = floor(vec2(zb / 2.4 + .5, (H.y - 9.) / 2.4) * .72);
  vec3 col = mix(uWinBot, uWinTop, clamp((H.y - 9.) / 18., 0., 1.));
  float lum = dot(col, vec3(.3, .5, .2));
  col = mix(col, mmJewel(h21(c + s * 7.)) * (lum * 1.25), uStain);
  return col * (m * (s > 0. ? uWinGain.y : uWinGain.x)); }
// light falling through the window of side s towards P (D points at the light): the glass's pattern laid on what it strikes
vec3 winPool(vec3 P, vec3 D, float s){
  float ax = s * D.x; if (ax < .05) return vec3(0.);
  float t = max(35. - s * P.x, 0.) / ax; vec3 H = P + D * t;
  float zb = mod(H.z + 30., 60.) - 30.; float hd = 27.5 - 5.5 * (zb * zb / 36.); float sf = .3 + t * .035;
  float m = (1. - smoothstep(6. - sf, 6., abs(zb))) * smoothstep(9., 9. + sf, H.y) * (1. - smoothstep(hd - sf, hd, H.y)) * step(abs(H.z), 149.);
  if (m < .001) return vec3(0.);
  vec4 g = mmGlass(vec2(zb / 2.4 + .5, (H.y - 9.) / 2.4), s, .03 + t * .003, uStain);
  return g.rgb * (m * mix(1., g.a, clamp(1.4 - t * .02, .25, 1.))); }
float missGlow(vec3 P, vec3 r, vec3 C, float rad){ vec3 L = C - P; float t = max(dot(L, r), 0.); vec3 m = L - r * t; return exp(-dot(m, m) / (rad * rad)) * step(.001, t); }
// everything a mirror can see
vec3 envMirror(vec3 P, vec3 r, float dots, float h){
  vec3 c = mix(uRoomLo, uRoomHi, smoothstep(-.35, .45, r.y)) * (.5 + h);
  float I = chImage(P, r, uCh[0], uLit.xyz, dots) + uLit.w * (chImage(P, r, uCh[1], vec3(1.), dots) + chImage(P, r, uCh[2], vec3(1.), dots));
  c += uFlame.rgb * (uFlame.a * I * (.86 + .14 * sin(uTime * (4. + 7. * h) + h * 40.)));
  // the candles' gold: a wide field of facets round each bell's image takes it up
  float lg = max(uLit.x, max(uLit.y, uLit.z));
  float gold = lg * missGlow(P, r, uCh[0].xyz + vec3(0., 7., 0.), 17.) + .6 * uLit.w * (missGlow(P, r, uCh[1].xyz + vec3(0., 5., 0.), 11.) + missGlow(P, r, uCh[2].xyz + vec3(0., 5., 0.), 11.));
  c += uFlame.rgb * (uJewel.y * gold * (.35 + 1.3 * h));
  if (dots < .98) c += winGlow(P, r) * (uJewel.x * (1. - dots) * (.45 + 1.1 * h));
  if (dots > .02) c += winEnv(P, r) * (dots * 1.2);
  // the sun's quarries on the floor, seen from above
  if (r.y < -.08) { float tf = P.y / -r.y; vec3 Fp = vec3(P.x + r.x * tf, 0., P.z + r.z * tf);
    c += uBeamCol[0] * winPool(Fp, uBeamDir[0], -1.) * (.07 * uJewel.x * step(abs(Fp.x), 35.)); }
  c += uPortalCol * (missGlow(P, r, PORTAL_C, 6.5) * (.1 + 1.8 * h * h) * (1. - smoothstep(148.5, 150.5, P.z)));
  for (int i = 0; i < 2; i++) { vec3 L = uBurstPos[i] - P; float l = max(length(L), 1e-3); float lb = max(dot(r, L) / l, 0.);
    lb *= lb; c += uBurstCol[i] * (missGlow(P, r, uBurstPos[i], 20.) * .9 + lb * lb * (.02 + .75 * h * h * h)); }
  return c; }
`;
const MM_RIPPLE = /* glsl */`
const float WATER_Y = -0.4;
vec2 mmRipple(vec3 p, float t){ return vec2(sin(p.z * .55 + p.y * .9 + t * 1.3) + .6 * sin(p.x * .83 - t * 1.7 + p.y * 1.7), sin(p.x * .47 - p.y * 1.1 + t * 1.1) + .6 * sin(p.z * .91 + t * 1.9)); }
`;
const MM_FOGF = /* glsl */`
float mmFogF(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
`;

const HALL_VERT = /* glsl */`
attribute vec2 aUv; attribute vec3 aEdge; attribute vec4 aMat; attribute vec3 aCol;
uniform float uTime, uMirror; uniform vec3 uSpin; uniform vec4 uCh[3];
varying vec3 vP, vN, vCol, vEdge; varying vec2 vUv; varying vec4 vMat;
#include <fog_pars_vertex>
${MM_RIPPLE}
void main(){
  vec3 p = position, n = normal, e = aEdge;
  #ifdef MM_FRAME
    float ci = aEdge.y; float a = ci < .5 ? uSpin.x : (ci < 1.5 ? uSpin.y : uSpin.z);
    vec4 ch = ci < .5 ? uCh[0] : (ci < 1.5 ? uCh[1] : uCh[2]);
    float cs = cos(a), sn = sin(a); vec2 q = p.xz - ch.xz;
    p.xz = ch.xz + vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
    n.xz = vec2(n.x * cs - n.z * sn, n.x * sn + n.z * cs);
    e = vec3(99.);
  #endif
  #ifdef MM_PROP
    // the world's props: aEdge = (sway weight in metres, phase, bob weight)
    p.xz += aEdge.x * vec2(sin(uTime * 1.3 + aEdge.y) + .4 * sin(uTime * 2.9 + aEdge.y * 1.7), cos(uTime * 1.1 + aEdge.y * 1.3));
    p.y += aEdge.z * (.5 + .5 * sin(uTime * 2.3 + aEdge.y * 3.1)) * step(aEdge.z, 50.);
    e = vec3(99.);
  #endif
  vP = p; vN = n; vCol = aCol; vEdge = e; vUv = aUv; vMat = aMat;
  #ifdef MM_PROP
    // a prop that the world moves (a walking bird, a drifting tray) is lit where it stands: world space == hero space
    vP = (modelMatrix * vec4(p, 1.)).xyz; vN = mat3(modelMatrix) * n;
  #endif
  vec3 pw = p;
  if (uMirror > .5) { float dep = max(p.y - WATER_Y, 0.); pw.y = 2. * WATER_Y - p.y; pw.xz += mmRipple(p, uTime) * (.08 + .22 * min(dep, 10.) / 10.); }
  vec4 mvPosition = modelViewMatrix * vec4(pw, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// kinds (aMat.x): 0 stucco, 1 mirror, 2 floor marble, 3 dado marble, 4 silver, 5 pool floor, 6 wax, 7 dark backing, 8 kilim, 9 lantern glass
const HALL_FRAG = /* glsl */`
uniform vec3 uAmb, uWinFill, uStucco, uInlay;
uniform float uMirror, uFacetPx;
uniform vec3 uGain;         // candle light on matt surfaces, caustics on matt surfaces, plate curvature
varying vec3 vP, vN, vCol, vEdge; varying vec2 vUv; varying vec4 vMat;
#include <fog_pars_fragment>
${MM_RIPPLE}
${MM_COMMON}
vec3 lightMatt(vec3 P, vec3 N, float ao, float caus){
  vec3 L = uAmb * (.4 + .6 * ao) * (.8 + .2 * N.y) * (1. - .3 * smoothstep(147., 153., P.z));
  vec3 d = uCh[0].xyz + vec3(0., 5.5 * uCh[0].w, 0.) - P; float d2 = dot(d, d);
  float lg = max(uLit.x, max(uLit.y, uLit.z));
  L += uFlame.rgb * (uGain.x * lg * (max(dot(N, d) * inversesqrt(d2 + 1e-3), 0.) * .75 + .25) / (1. + d2 / 900.));
  for (int i = 1; i < 3; i++) { d = uCh[i].xyz + vec3(0., 4., 0.) - P; d2 = dot(d, d);
    L += uFlame.rgb * (uGain.x * .5 * uLit.w * (max(dot(N, d) * inversesqrt(d2 + 1e-3), 0.) * .75 + .25) / (1. + d2 / 420.)); }
  float bay = .6 + .4 * cos(P.z * .10472);
  L += uWinFill * (bay * (uWinGain.y * max((N.x + .3 * N.y) * .958, 0.) / (1. + (35. - P.x) * .03) + uWinGain.x * max((-N.x + .3 * N.y) * .958, 0.) / (1. + (35. + P.x) * .03)));
  L += uBeamCol[0] * max(dot(N, uBeamDir[0]), 0.) * winPool(P, uBeamDir[0], -1.);
  L += uBeamCol[1] * max(dot(N, uBeamDir[1]), 0.) * winPool(P, uBeamDir[1], 1.);
  vec3 dq = vec3(clamp(P.x, -11., 11.), WATER_Y, clamp(P.z, -126., 126.)) - P; float q2 = dot(dq, dq);
  float nq = max(dot(N, dq) * inversesqrt(q2 + 1e-3), 0.);
  L += uCausCol * (uGain.y * caus * sqrt(nq) / (1. + q2 / 2500.));
  // a lantern hangs in the alcove on either flank of every pier (x = +-32, 0.85 m proud of the flank): a pool of warm
  // light on the alcove, its roses and the floor before it
  { float zl = clamp(floor((P.z + 120.) / 60.), 0., 3.) * 60. - 90.;
    vec3 ld = vec3(P.x >= 0. ? 32. : -32., 10.4, zl + (P.z >= zl ? 3.85 : -3.85)) - P; float l2 = dot(ld, ld);
    float fk = .9 + .1 * sin(uTime * 9.3 + zl) * sin(uTime * 5.1 + zl * .7);
    L += uLamp.rgb * (fk * (max(dot(N, ld) * inversesqrt(l2 + 1e-3), 0.) * .8 + .2) / (1. + l2 / max(uLamp.a, 1.))); }
  // a firework outside the windows washes every matt surface that faces it
  for (int i = 0; i < 2; i++) { vec3 bd = uBurstPos[i] - P; L += uBurstCol[i] * (.022 * (max(dot(N, bd) * inversesqrt(dot(bd, bd) + 1e-3), 0.) * .8 + .2)); }
  // the portal lights its niche: an emerald pool on dado, floor and ribs that dies away towards the arch
  vec3 pd = vec3(0., 12., 179.) - P; float p2 = dot(pd, pd);
  L += uPortalCol * (.26 * smoothstep(138., 151., P.z) * (max(dot(N, pd) * inversesqrt(p2 + 1e-3), 0.) * .8 + .2) / (1. + p2 / 75.));
  #ifdef MM_FRAME
  // candles out: the bell takes the day or the moon from the window side, so one half reads and the other falls away
  vec3 Dh = uBeamDir[0] * vec3(1., 0., 1.) + vec3(0., .45, 0.); Dh /= max(length(Dh), 1e-3);
  L += min(uBeamCol[0], vec3(1.4)) * ((1. - lg) * uDropSide * (.05 + .7 * max(dot(N, Dh), 0.)));
  #endif
  return L * (.55 + .45 * ao); }
// the tiny chandelier a near plate holds: three rows of flames, their reflection, the globe's glow (q: bell units, y up from the waterline)
float icRow(vec2 q, float y, float hw, float n){
  float sp = 2. * hw / (n - 1.); float xi = floor((clamp(q.x, -hw, hw) + hw) / sp + .5) * sp - hw;
  vec2 d = q - vec2(xi, y); return exp(-dot(d, d) * 70.); }
float chIcon(vec2 q){
  vec2 a = vec2(q.x, abs(q.y));
  float I = icRow(a, .12, .86, 6.) + icRow(a, .47, .66, 5.) + icRow(a, .78, .36, 3.);
  I *= q.y < 0. ? .55 : 1.;
  vec2 t = q - vec2(0., 1.03); I += .6 * exp(-dot(t, t) * 60.);
  I += .1 * exp(-dot(q, q) * 1.4);
  return I; }
// one level of the mirror mosaic. Half the facets lie nearly true and hold a piece of the room's image (envMirror: the
// windows' stained colours, the candles' gold, the sun's quarries on the floor), the rest are well out of true and
// scatter it. Besides that every facet carries the hall's second and third reflections: a share of them (uGlit.y, more
// where the smooth vault would mirror a light: sheet) holds one clear colour of the glass, chosen by a slow field (jt)
// so that whole patches of ruby, sapphire, emerald and amber slide over the vaults with the eye; a few (uGlit.x) hold
// a soft point of the light itself; band (the net and the slow rings thrown up from the pool) lights more in its colour.
vec3 facet(vec2 uv, float s, vec3 P, vec3 V, vec3 N, vec3 T, vec3 B, float px, float band, float sheet, float jt, vec3 grout){
  vec2 p = uv / s + uVar.x;
  vec2 q = vec2(p.x - p.y * .57735, p.y * 1.1547);
  vec2 ic = floor(q), f = fract(q);
  float up = step(1., f.x + f.y);
  float mg = step(h21(ic * 1.37 + 5.), uVar.w);
  vec2 id = ic + (1. - mg) * up * vec2(.37, .61);
  vec3 hs = h23(id + 11.1);
  float eT = mix(min(min(f.x, f.y), 1. - f.x - f.y), min(min(1. - f.x, 1. - f.y), f.x + f.y - 1.), up);
  float eR = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y));
  float e = mix(eT, eR, mg) * s * .866;
  vec2 cc = mix(mix(vec2(1. / 3.), vec2(2. / 3.), up), vec2(.5), mg);
  vec2 lq = f - cc; vec2 l = vec2(lq.x + lq.y * .5, lq.y * .866);
  float near = smoothstep(10., 34., s / px);
  float big = smoothstep(5., 13., s / px);                         // from here up a plate holds its glint as a soft point
  vec3 hv = hs * 2. - 1.;
  float tl = uVar.z * (hs.z < .5 ? .1 + .5 * hs.z : .25 + 1.6 * hs.z * hs.z);
  vec3 nc = N + tl * (hv - N * dot(hv, N));
  vec3 n = nc + (uGain.z * near * 2.) * (T * l.x + B * l.y);
  n /= max(length(n), 1e-3);
  vec3 r = reflect(V, n);
  vec3 c = envMirror(P, r, near, hs.y);
  float nk = smoothstep(148.5, 150.5, P.z);                        // 1 inside the apse niche
  c *= mix(1., .4, nk);
  float lg = max(uLit.x, max(uLit.y, uLit.z));
  // what decides whether a facet is lit is taken at the middle of a large plate, so the whole plate lights or stays
  // dark and no streak crosses it
  vec3 rp = r;
  if (near > .02) { vec3 Vc = P - (T * l.x + B * l.y) * s - uCamL; Vc /= max(length(Vc), 1e-3);
    rp = mix(r, reflect(Vc, nc / max(length(nc), 1e-3)), smoothstep(.02, .4, near)); }
  float ph = fract(hs.x * 9.73 + dot(rp, vec3(1.31, .87, 1.13)) * 1.15 + uTime * (.01 + .025 * hs.z));
  float dph = abs(ph - .5) * 2.;
  float wH = uGlit.x * (.45 + 1.7 * sheet) * (1. + 1.5 * near), wW = uGlit.y * (.55 + 1.1 * sheet);
  float hot = 1. - smoothstep(wH * .5, wH, dph), warm = 1. - smoothstep(wW * .6, wW, dph);
  float pw = fract(hs.y * 31.7 + hs.x * 3.1);
  vec2 sq = l - (hs.xy - .5) * .2;
  float spot = mix(1., 2.2 * exp(-dot(sq, sq) * 20.), big);
  vec3 jw = mmJewel(fract(jt + (hs.x - .5) * .22));
  c += mix(uSpark, uPortalCol * vec3(.5, 1., .8), nk) * (hot * (.4 + 2.4 * pw * pw * pw) * spot * (1. - nk) * uGlit.z);
  c += jw * (warm * (.1 + .3 * hs.z) * (.7 + .5 * min(sheet, 1.6)) * (1. - nk) * uJewel.z);
  c += uCausCol * (uGlit.w * band * (.2 + 2.2 * hs.y * hs.y) * step(fract(hs.x * 5.3 + hs.z * 2.7), .45) * mix(1., .45, big) * (1. - .95 * nk));
  if (nk > .001) {
    // the niche: the portal repeated as hard emerald points, one small disc to a facet. They crowd in a halo round the
    // portal's rim and thin to nothing towards the arch; which facets hold one slides with the reflected ray, and slow
    // rings of brightness run outward from the rim.
    vec3 dp = P - PORTAL_C; float rho = length(dp) / 7.;
    float hx = max(rho - 1.25, 0.) / 1.5; float halo = exp(-hx * hx);
    float pp = fract(hs.z * 13.7 + hs.x * 5.1 + dot(rp, vec3(.9, 1.3, .7)) * 1.3 + uTime * .013);
    float share = .06 + .6 * halo;
    float on = 1. - smoothstep(share * .75, share, abs(pp - .5) * 2.);
    float pu = px / s; float rad = max(.105 + .1 * hs.x, 1.1 * pu);
    vec2 sq2 = l - (hs.yz - .5) * .14; float rr = length(sq2);
    float disc = 1. - smoothstep(rad - pu, rad + pu, rr);
    float rim = mix(1., .4 + 1.1 * smoothstep(rad * .45, rad * .95, rr), smoothstep(2.5, 6., rad / max(pu, 1e-4)));
    float wave = .72 + .28 * sin(rho * 5. - uTime * 1.7 + hs.x * 2.);
    float fl = .85 + .15 * sin(uTime * (2.5 + 5. * hs.y) + hs.x * 40.);
    vec3 pc = uPortalCol * vec3(.45, 1., .76);
    c += pc * (nk * (on * disc * rim * (.3 + 1.8 * halo) * (.45 + 1.3 * hs.y * hs.y) * wave * fl + (.012 + .05 * halo) * (.2 + 1.3 * hs.z * hs.z)));
  }
  if (near > .02 && nk < .999) {
    // its own tiny chandelier, slipping across the plate as the eye moves
    vec3 ncn = nc / max(length(nc), 1e-3); vec3 rc = reflect(V, ncn);
    vec3 D = uCh[0].xyz - P; D /= max(length(D), 1e-3);
    vec3 dd = D - rc; vec2 o = vec2(dot(dd, T), dot(dd, B)) * .15; o /= 1. + 3. * length(o);
    vec2 up2 = vec2(T.y, B.y); float ul = length(up2); up2 = ul > .15 ? up2 / ul : vec2(0., 1.);
    vec2 d2 = l - o; vec2 qi = vec2(d2.x * up2.y - d2.y * up2.x, dot(d2, up2)) / .19;
    c += (uFlame.rgb * (uFlame.a * lg) + uGhost) * (chIcon(qi) * near * (1. - nk) * step(.5, fract(hs.y * 7.7)));
  }
  float gw = max(.022 * sqrt(s), px * .6);
  return mix(grout, c, smoothstep(gw * .5, gw * 1.5, e)); }
float dadoH(vec2 c, float odd){
  float yy = (c.y + .2) / 2.4; float cyp = abs(c.x) - .8 * max(1. - yy * yy, 0.);
  float vase = min(length(c - vec2(0., -.9)) - 1., max(abs(c.x) - .3, abs(c.y - .5) - .9));
  vase = min(vase, max(abs(c.x) - .62, abs(c.y - 1.5) - .14)); vase = min(vase, max(abs(c.x) - .7, abs(c.y + 2.15) - .2));
  float d = mix(cyp, vase, odd);
  return 1. - smoothstep(-.3, .3, d); }
void main(){
  vec3 cam = uCamL; if (uMirror > .5) cam.y = 2. * WATER_Y - cam.y;
  vec3 P = vP; vec3 Vd = P - cam; float dist = max(length(Vd), 1e-3); vec3 V = Vd / dist;
  vec3 N = vN / max(length(vN), 1e-4);
  if (dot(N, V) > 0.) N = -N;
  float kind = vMat.x, ao = vMat.z;
  vec2 fw = fwidth(vUv); float px = max(max(fw.x, fw.y), 1e-4);
  vec3 dpx = dFdx(vP), dpy = dFdy(vP); vec2 dux = dFdx(vUv), duy = dFdy(vUv);
  float det = dux.x * duy.y - dux.y * duy.x; float sd = abs(det) > 1e-10 ? 1. / det : 0.;
  vec3 T = (dpx * duy.y - dpy * dux.y) * sd, B = (dpy * dux.x - dpx * duy.x) * sd;
  T /= max(length(T), 1e-3); B /= max(length(B), 1e-3);
  float caus = caustic(P, N);
  vec3 L = lightMatt(P, N, ao, caus);
  vec3 alb = vCol, extra = vec3(0.);
  vec2 u = vUv; float aa = px * 1.2 + .02;
  if (kind < .5) {
    alb *= .9 + .1 * vnoise(u * .9);
  } else if (kind > 1.5 && kind < 2.5) {
    float v1 = vnoise(u * .35 + 3. * vnoise(u * .09)); float vein = smoothstep(.46, .5, v1) * (1. - smoothstep(.5, .54, v1));
    alb *= .9 + .1 * vnoise(u * 1.7); alb = mix(alb, alb * vec3(.8, .76, .7), vein * .6);
    vec2 c = (fract(u / 7. + .5) - .5) * 7.; vec2 a2 = abs(c);
    float st = min(max(a2.x, a2.y) - 1.5, (a2.x + a2.y) * .7071 - 1.5);
    float line = 1. - smoothstep(.08, .08 + aa, abs(st)); float core = 1. - smoothstep(-.9, -.9 + aa, st);
    float hc = h21(floor(u / 7. + .5) + 3.7);
    vec3 inl = hc < .45 ? uInlay : (hc < .8 ? vec3(.05, .1, .38) : vec3(.4, .04, .07));
    alb = mix(alb, mix(vec3(.5, .36, .12), inl, core), clamp(line + core * .85, 0., 1.));
    vec2 j = (.5 - abs(fract(u / 3.5) - .5)) * 3.5;
    alb *= 1. - .35 * (1. - smoothstep(.02, .02 + aa, min(j.x, j.y)));
    vec3 r = reflect(V, N); float fr = 1. - max(dot(-V, N), 0.);
    extra = (uFlame.rgb * (uFlame.a * .05 * chImage(P, r, uCh[0], uLit.xyz, 0.)) + winEnv(P, r) * .22
      + uPortalCol * (missGlow(P, r, PORTAL_C, 6.) * .55 * smoothstep(120., 150., P.z))) * (.3 + .7 * fr * fr * fr);
  } else if (kind > 2.5 && kind < 3.5) {
    float v1 = vnoise(u * vec2(.3, .5) + 3. * vnoise(u * .11)); float vein = smoothstep(.46, .5, v1) * (1. - smoothstep(.5, .54, v1));
    alb *= .88 + .12 * vnoise(u * vec2(.8, 1.6)); alb = mix(alb, alb * vec3(.8, .74, .66), vein * .6);
    float pid = floor(u.x / 6.); float odd = mod(pid, 2.);
    vec2 c = vec2((fract(u.x / 6.) - .5) * 6., u.y - 4.2);
    vec2 dq = abs(c) - vec2(2.4, 3.); float frm = max(dq.x, dq.y);
    alb *= 1. - .3 * (1. - smoothstep(.03, .03 + aa * 2., abs(frm)));
    float dh0 = dadoH(c, odd);
    alb *= 1. + .55 * (dadoH(c - vec2(-.14, .14), odd) - dadoH(c + vec2(-.14, .14), odd)) + .1 * dh0;
    alb *= .8 + .2 * smoothstep(0., .6, u.y);
    if (P.z > 146.) {
      vec3 pd = PORTAL_C - P; float p2 = dot(pd, pd); vec2 o = vec2(dot(pd, T), dot(pd, B)); o *= .14 / max(length(o), 1e-3);
      float rimL = max(dadoH(c - o, odd) - dadoH(c + o, odd), 0.) + .1 * (1. - smoothstep(.0, .09 + aa * 2., abs(frm + .06)));
      extra = uPortalCol * (rimL * .8 / (1. + p2 / 200.));
    }
  } else if (kind > 3.5 && kind < 4.5) {
    vec3 r = reflect(V, N); float sk = vnoise(vec2(r.x * 4. + r.z * 3., r.y * 5.));
    extra = vCol * lightMatt(P, r, 1., caus) * (.5 + 1.8 * sk * sk) + winEnv(P, r) * .3;
    alb *= .4;
  } else if (kind > 4.5 && kind < 5.5) {
    vec2 j = (.5 - abs(fract(u / 1.6) - .5)) * 1.6;
    alb *= (.7 + .3 * h21(floor(u / 1.6))) * (1. + .5 * (1. - smoothstep(.03, .03 + aa, min(j.x, j.y))));
    extra = uCausCol * (caus * .12 * uGain.y);
    float bas = exp(-dot(P.xz, P.xz) / 380.);
    alb = mix(alb, alb * 3.4 + vec3(.035, .08, .07), bas);
  } else if (kind > 5.5 && kind < 6.5) {
    float id = vMat.w; float lit = id < .5 ? uLit.x : (id < 1.5 ? uLit.y : (id < 2.5 ? uLit.z : uLit.w));
    extra = uFlame.rgb * (lit * (.06 + .55 * u.y * u.y * u.y));
    L += (uWinFill * .6 + uAmb) * ((1. - lit) * .5);
  } else if (kind > 6.5 && kind < 7.5) {
    L = uAmb * .3;
  } else if (kind > 8.5) {
    // the glass of an alcove lantern: lit from within
    float fk = .9 + .1 * sin(uTime * 9.3 + P.z) * sin(uTime * 5.1 + P.z * .7);
    extra = uLamp.rgb * (fk * (.5 + .7 * u.y)); alb *= .15;
  } else if (kind > 7.5) {
    // kilim: bands of stepped diamonds in ruby, gold, cream and sapphire (vMat.y = half width of the runner)
    float hw = max(vMat.y, 1.); float st = .45;
    vec2 c = vec2(u.x, mod(u.y, 7.2) - 3.6); vec2 cs = (floor(c / st) + .5) * st;
    float d = abs(cs.x) * .8 + abs(cs.y); float ring = fract(d / 2.7);
    vec3 cream = vec3(.6, .55, .42), silver = vec3(.55, .36, .1), green = vec3(.4, .03, .05), deep = vec3(.035, .06, .26);
    vec3 kc = ring < .2 ? cream : (ring < .56 ? green : (ring < .74 ? silver : deep));
    float crs = step(abs(cs.x), st * .6) * step(abs(cs.y), st * 1.6) + step(abs(cs.y), st * .6) * step(abs(cs.x), st * 1.6);
    kc = mix(kc, cream, clamp(crs, 0., 1.));
    float bd = hw - abs(u.x);
    float zig = step(.5, fract((u.y + abs(fract(bd / .9) - .5) * 1.8) / 1.8));
    kc = bd < 1.35 ? (bd < .28 ? cream : (bd < .6 ? deep : mix(green, silver, zig))) : kc;
    float weave = .82 + .18 * mix(.5, vnoise(u * vec2(9., 26.)), clamp(.06 / px, 0., 1.));
    alb = kc * vCol * weave;
  }
  vec3 col = alb * L + extra;
  if (kind > .5 && kind < 1.5) {
    float size = max(vMat.y, .05);
    float lodf = log2(max(uFacetPx * px / size, 1.)); float l0 = floor(lodf); float lf = smoothstep(.5, 1., lodf - l0);
    float s0 = size * exp2(l0);
    vec3 grout = uStucco * L * .3;
    // where the smooth vault would mirror the globe or a window wall, more facets catch it; a slow field slides the rest
    vec3 rs = reflect(V, N);
    vec3 Lc = uCh[0].xyz + vec3(0., 6., 0.) - P; Lc /= max(length(Lc), 1e-3);
    float lgm = max(uLit.x, max(uLit.y, uLit.z));
    float lobe = max(dot(rs, Lc), 0.); lobe *= lobe; lobe *= lobe;
    float lw0 = max(dot(rs, uBeamDir[0]), 0.), lw1 = max(dot(rs, uBeamDir[1]), 0.); lw0 *= lw0; lw1 *= lw1;
    float sn = vnoise(rs.xz * 2.1 + rs.y * 1.6 + P.xz * .025 + uVar.x);
    float sheet = lgm * lobe + .3 * (uWinGain.x * lw0 * lw0 + uWinGain.y * lw1 * lw1) + 1.2 * smoothstep(.3, .8, sn);
    // the pool's light: the fine net, and slow rings that climb the walls and cross the domes
    vec3 dqm = vec3(clamp(P.x, -11., 11.), WATER_Y, clamp(P.z, -126., 126.)) - P;
    float wv = length(dqm) * .15 - uTime * .32 + 2.4 * vnoise(P.xz * .045 + P.y * .03 + 3.);
    float bw = .5 + .5 * sin(wv); bw *= bw; bw *= bw; bw *= bw;
    float band = bw * (.35 + .65 * min(caus * 1.3, 1.)) + .22 * min(caus, 1.);
    // far domes: every facet covers many plates, so more of them flash and the bands read as sheets, not specks
    float farK = smoothstep(30., 115., dist);
    sheet += .35 * farK; band *= 1. + .5 * farK;
    // which colour the second reflections hold: a slow field in the smooth vault's reflected direction, so patches of one colour slide
    float jt = vnoise(rs.xz * 2.3 + rs.y * 1.9 + P.xz * .045 + uVar.x) * 2.3 + vnoise(P.xz * .11 + P.y * .13 + 5.) * .8;
    vec3 m = facet(u, s0, P, V, N, T, B, px, band, sheet, jt, grout);
    #ifndef MM_LITE
    if (lf > .001) m = mix(m, facet(u, s0 * 2., P, V, N, T, B, px, band, sheet, jt, grout), lf);
    #endif
    m *= vCol * (mix(.5, 1., 1. - smoothstep(uIgnite - 40., uIgnite, P.z)) * (1. - .2 * smoothstep(120., 320., dist)));
    float rw = vMat.w; float ed = min(vEdge.x, min(vEdge.y, vEdge.z)); float ra = max(px * .8, .01);
    float rib = rw > .001 ? 1. - smoothstep(rw - ra, rw + ra, ed) : 0.;
    rib *= clamp(rw / ra, .22, 1.);          // a rib thinner than its pixel fades; it does not thicken into a cage
    float rp = clamp(ed / max(rw, 1e-3), 0., 1.);
    m *= mix(.45 + .55 * smoothstep(rw, rw + .3, ed), 1., farK);
    col = mix(m, uStucco * L * ((.62 + .2 * sin(rp * 3.1416)) * (1. - .45 * farK)), rib);
  }
  #ifdef MM_FRAME
  { // candles out: the half of the great bell turned away from the lit windows falls into shadow
    float lgf = max(uLit.x, max(uLit.y, uLit.z));
    float bsf = dot(P.xz - uCh[0].xz, uBeamDir[0].xz) / (max(length(uBeamDir[0].xz), 1e-3) * 9.5 * uCh[0].w);
    col *= mix(1., .1 + 1.9 * smoothstep(-.35, .8, bsf), uDropSide * (1. - lgf) * step(abs(P.z), 40.)); }
  #endif
  float alpha = 1.;
  if (uMirror > .5) { col *= .8; alpha = .35 + .55 * smoothstep(0., .8, 1. - abs(V.y)); }
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

const WATER_VERT = /* glsl */`
varying vec3 vP;
#include <fog_pars_vertex>
void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform vec3 uDeep;
varying vec3 vP;
#include <fog_pars_fragment>
${MM_FOGF}
${MM_RIPPLE}
${MM_COMMON}
// a window in rippled water: a broken column of the glass's own colours, well under the window's brightness
vec3 winWater(vec3 P, vec3 r, vec2 rip){
  float s = r.x >= 0. ? 1. : -1.; float ax = max(abs(r.x), 1e-3);
  float t = max(35. - s * P.x, 0.) / ax; vec3 H = P + r * t;
  H.y += rip.y * t * .1; H.z += rip.x * t * .05;
  float zb = mod(H.z + 30., 60.) - 30.; float hd = 27.5 - 5.5 * (zb * zb / 36.);
  float m = (1. - smoothstep(4.8, 6.4, abs(zb))) * smoothstep(8.4, 10.4, H.y) * (1. - smoothstep(hd - 2., hd + .5, H.y)) * step(abs(H.z), 149.) * smoothstep(.02, .08, abs(r.x));
  if (m < .001) return vec3(0.);
  vec4 g = mmGlass(vec2(zb / 2.4 + .5, (H.y - 9.) / 2.4), s, .05 + t * .003, uStain);
  vec3 col = mix(uWinBot, uWinTop, clamp((H.y - 9.) / 18., 0., 1.)) * g.rgb * mix(.35, 1., g.a);
  return col * (m * (s > 0. ? uWinGain.y : uWinGain.x)); }
// the vaults in the water: a slow, soft mottle of the mirrors' colours
vec3 vaultMottle(vec3 r, vec3 P){
  vec2 g = r.xz / max(r.y, .08) * 1.4 + P.xz * .03;
  float a = vnoise(g * 1.3 + uVar.x), b = vnoise(g * 3.1 + 7.);
  return mmJewel(fract(a * 2.3 + uVar.x * .1)) * (smoothstep(.45, .8, b) * .6 + .1); }
void main(){
  vec3 P = vP; vec3 Vd = P - uCamL; float dist = max(length(Vd), 1e-3); vec3 V = Vd / dist;
  float calm = mix(.3, 1., smoothstep(18., 30., length(P.xz)));
  vec2 g = vec2(.9, .4) * cos(dot(P.xz, vec2(.9, .4)) * 1.1 + uTime * 1.2);
  g += vec2(-.5, .8) * (cos(dot(P.xz, vec2(-.5, .8)) * 1.7 - uTime * 1.5) * .7);
  g += vec2(.3, -.95) * (cos(dot(P.xz, vec2(.3, -.95)) * 2.9 + uTime * 2.1) * .45);
  g += (vec2(vnoise(P.xz * 1.3 + uTime * .3), vnoise(P.xz * 1.3 + 17. - uTime * .25)) - .5) * 1.2;
  g *= .035 * calm * (.35 + .65 / (1. + dist * .02));
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  vec3 r = reflect(V, n); r.y = abs(r.y) + .02; r = normalize(r);
  float cosv = clamp(dot(-V, n), 0., 1.); float f1 = 1. - cosv; float F = .03 + .97 * f1 * f1 * f1 * f1 * f1;
  vec3 refl = uBody * vec3(.3, .5, .6);
  vec2 rip = (vec2(vnoise(P.xz * vec2(1.7, 2.9) + uTime * vec2(.5, .3)), vnoise(P.xz * vec2(2.3, 1.1) - uTime * vec2(.3, .45) + 9.)) - .5) * (2. * calm);
  refl += winWater(P, r, rip) * .24;
  refl += uPortalCol * (missGlow(P, r, vec3(0., 12., 180.), 8.) * 1.2);
  for (int i = 0; i < 2; i++) refl += uBurstCol[i] * (missGlow(P, r, uBurstPos[i], 9.) * .22);
  float lg = max(max(uLit.x, uLit.y), max(uLit.z, uLit.w));
  refl += vaultMottle(r, P) * (uJewel.z * .06 * smoothstep(.04, .2, r.y)) + uSpark * .003;
  refl += uFlame.rgb * (uJewel.y * .07 * max(uLit.x, max(uLit.y, uLit.z)) * missGlow(P, r, uCh[0].xyz + vec3(0., 7., 0.), 17.));
  vec3 col = refl * mix(.4, 1., F) + uDeep * (1. - F);
  // sun or moon through the windows lies on the water as it does on the marble
  col += (uBeamCol[0] * winPool(P, uBeamDir[0], -1.) * max(uBeamDir[0].y, 0.) + uBeamCol[1] * winPool(P, uBeamDir[1], 1.) * max(uBeamDir[1].y, 0.)) * (.07 * (1. - F));
  float a = mix(.7, .97, F);
  float ff = mmFogF();
  #ifdef USE_FOG
    col = mix(col, fogColor * a, ff);
  #endif
  gl_FragColor = vec4(col, a);
}`;

// crystal drops: instanced blades turned to the eye, hung from iA.xyz. iA.w = chandelier; iB = length (negative: the
// copy under the water), width, phase, swing
const SPRITE_PARS = /* glsl */`
attribute vec4 iA, iB;
uniform float uTime, uPix; uniform vec3 uCamL, uSpin; uniform vec4 uCh[3], uLit;
#include <fog_pars_vertex>
${MM_RIPPLE}
vec3 mmSpin(vec3 p, float ci, out vec4 ch){
  float a = ci < .5 ? uSpin.x : (ci < 1.5 ? uSpin.y : uSpin.z);
  ch = ci < .5 ? uCh[0] : (ci < 1.5 ? uCh[1] : uCh[2]);
  float cs = cos(a), sn = sin(a); vec2 q = p.xz - ch.xz;
  return vec3(ch.x + q.x * cs - q.y * sn, p.y, ch.z + q.x * sn + q.y * cs); }
vec3 mmSink(vec3 wp, float mir){
  if (mir < .5) return wp;
  float dep = max(wp.y - WATER_Y, 0.);
  return vec3(wp.x, 2. * WATER_Y - wp.y, wp.z) + vec3(1., 0., 0.) * mmRipple(wp, uTime).x * (.08 + .22 * min(dep, 10.) / 10.) + vec3(0., 0., 1.) * mmRipple(wp, uTime).y * (.08 + .22 * min(dep, 10.) / 10.); }
float mmReflGain(float mir, float ty){ float f = 1. - abs(ty); return mir > .5 ? .4 + .55 * smoothstep(0., .7, f) : 1.; }
`;
const DROP_VERT = /* glsl */`
${SPRITE_PARS}
uniform float uDropLit, uDropSide; uniform vec3 uBeamDir[2];
varying vec2 vQ; varying vec3 vH, vV, vS; varying float vG;
void main(){
  vec4 ch; vec3 p = mmSpin(iA.xyz, iA.w, ch);
  float len = abs(iB.x), mir = step(iB.x, 0.), ph = iB.z;
  vec2 sw = vec2(sin(uTime * (1.1 + .5 * fract(ph * 7.13)) + ph * 6.283), cos(uTime * (.9 + .5 * fract(ph * 3.71)) + ph * 11.7)) * (.05 * iB.w + .012);
  vec3 top = p + vec3(sw.x, 0., sw.y);
  vec3 dn = normalize(vec3(sw.x * .8, -1., sw.y * .8));
  vec3 cam = uCamL; if (mir > .5) cam.y = 2. * WATER_Y - cam.y;
  vec3 tc = cam - (top + dn * (len * .5)); float dist = max(length(tc), 1e-3); tc /= dist;
  vec3 sd = cross(dn, tc); sd /= max(length(sd), 1e-3);
  float w = iB.y; float k = clamp(1.6 * dist * uPix / max(w, 1e-3), 1., 6.);
  vec3 wp = top + sd * (position.x * w * k) + dn * (-position.y * len * (1. + (k - 1.) * .3));
  float h = (p.y - ch.y) / ch.w; float w0 = 1. - smoothstep(2., 5., h), w2 = smoothstep(6., 9., h);
  float lit = iA.w < .5 ? dot(uLit.xyz, vec3(w0, 1. - w0 - w2, w2)) : uLit.w;
  // candles out: only the side turned to the lit windows glints, the other falls into shadow
  float bs = dot(p.xz - ch.xz, uBeamDir[0].xz) / (max(length(uBeamDir[0].xz), 1e-3) * 9.5 * ch.w);
  float sideK = mix(1., .03 + 2.6 * smoothstep(-.15, .75, bs), uDropSide * (1. - lit));
  vG = (uDropLit + (1. - uDropLit) * lit) * sideK / k * mmReflGain(mir, tc.y);
  vQ = vec2(position.x * 2., -position.y); vH = vec3(fract(ph * 1.37), fract(ph * 13.7), fract(ph * 29.3)); vV = -tc; vS = sd;
  vec4 mvPosition = modelViewMatrix * vec4(mmSink(wp, mir), 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DROP_FRAG = /* glsl */`
uniform float uTime, uDropGain, uStain; uniform vec4 uFlame; uniform vec3 uCausCol;
varying vec2 vQ; varying vec3 vH, vV, vS; varying float vG;
#include <fog_pars_fragment>
${MM_FOGF}
void main(){
  float y = vQ.y, ax = abs(vQ.x);
  float prof = y < .3 ? y / .3 : (1. - y) / .7;
  float inside = 1. - smoothstep(prof - .16, prof, ax);
  if (inside < .01) discard;
  float fx = vQ.x > 0. ? 1. : -1., fy = y < .3 ? 1. : -1.;
  vec3 nf = normalize(vS * (fx * .75) + vec3(0., fy * .45, 0.) - vV * .55 + (vH - .5) * .5);
  vec3 r = reflect(normalize(vV), nf);
  vec3 l1 = normalize(vH * 2. - 1. + vec3(.01, .42, .03));
  float g1 = max(dot(r, l1), 0.), g2 = max(dot(r, vec3(l1.z, -l1.y, l1.x)), 0.);
  g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2;
  float tw = .65 + .35 * sin(uTime * (2. + 3. * vH.y) + vH.x * 40.);
  float edge = smoothstep(prof - .4, prof, ax) * .6 + (1. - smoothstep(0., .1, abs(y - .3))) * .3 + (1. - smoothstep(0., .12, ax)) * .25;
  vec3 tint = mix(uFlame.rgb, uCausCol * 1.6, step(.8, vH.z));
  float hj = fract(vH.x * 17.3 + vH.y * 5.1);
  vec3 jw = hj < .28 ? vec3(1.5, .09, .15) : (hj < .56 ? vec3(.1, .28, 1.6) : (hj < .78 ? vec3(.12, 1.15, .4) : vec3(1.6, .86, .14)));
  tint = mix(tint, jw, uStain * step(.62, fract(vH.z * 7.7)));
  vec3 col = uFlame.rgb * (.03 + .17 * edge) + tint * ((g1 + g2) * tw * uDropGain);
  gl_FragColor = vec4(col * (inside * vG * (1. - mmFogF())), 1.);
}`;
// flames and halos: iA = position, chandelier; iB = size (negative: the copy under the water), phase, ring, kind
const FLAME_VERT = /* glsl */`
${SPRITE_PARS}
varying vec2 vQ; varying float vG, vK;
void main(){
  vec4 ch; vec3 p = mmSpin(iA.xyz, iA.w, ch);
  float size = abs(iB.x), mir = step(iB.x, 0.), ph = iB.y, ring = iB.z; vK = iB.w;
  float lit = ring < .5 ? uLit.x : (ring < 1.5 ? uLit.y : (ring < 2.5 ? uLit.z : uLit.w));
  vec3 cam = uCamL; if (mir > .5) cam.y = 2. * WATER_Y - cam.y;
  vec3 tc = cam - p; float dist = max(length(tc), 1e-3); tc /= dist;
  vec3 rt = cross(vec3(0., 1., 0.), tc); rt /= max(length(rt), 1e-3);
  vec3 upv = vK > .5 ? cross(tc, rt) : vec3(0., 1., 0.);
  float fl = .86 + .14 * sin(uTime * 11. * (.7 + .6 * fract(ph * 5.3)) + ph * 50.) * sin(uTime * 3.1 + ph * 17.);
  float w = vK > .5 ? size : size * .6, hg = vK > .5 ? size : size * fl;
  float k = vK > .5 ? 1. : clamp(1.8 * dist * uPix / max(w, 1e-3), 1., 8.);
  float sway = vK > .5 ? 0. : sin(uTime * 7.3 + ph * 31.) * .09 * position.y * position.y * size;
  vec3 wp = p + rt * (position.x * w * k + sway) + upv * ((vK > .5 ? position.y - .5 : position.y) * hg * k);
  vG = lit * (.8 + .2 * fl) / (k * k) * mmReflGain(mir, tc.y);
  if (vK > 1.5) vG = lit * smoothstep(40., 110., dist);      // the globe's far glow: gone by the time the camera is near
  vQ = vec2(position.x, position.y);
  vec4 mvPosition = modelViewMatrix * vec4(mmSink(wp, mir), 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLAME_FRAG = /* glsl */`
uniform vec4 uFlame; uniform float uHalo;
varying vec2 vQ; varying float vG, vK;
#include <fog_pars_fragment>
${MM_FOGF}
void main(){
  vec3 col;
  if (vK > 1.5) { float d = length(vQ - vec2(0., .5)) * 2.; col = uFlame.rgb * (max(exp(-d * d * 4.2) - .016, 0.) * .3); }
  else if (vK > .5) { float d = length(vQ - vec2(0., .5)) * 2.; col = uFlame.rgb * (max(exp(-d * d * 4.) - .018, 0.) * uHalo); }
  else {
    float y = vQ.y; float wd = 1.1 * sqrt(max(y, 0.)) * pow(max(1. - y, 0.), .8) + .02;
    float d = abs(vQ.x) / wd; float a = 1. - smoothstep(.55, 1., d); float core = exp(-d * d * 2.4);
    col = mix(uFlame.rgb, vec3(1.25, 1.05, .78), core) * (uFlame.a * a * (.15 + .85 * core));
    col *= mix(vec3(.5, .6, 1.2), vec3(1.), smoothstep(0., .22, y));
  }
  gl_FragColor = vec4(col * (vG * (1. - mmFogF())), 1.);
}`;

// ------------------------------------------------------------------------------------------------ geometry buffer
const lerp = (a, b, t) => a + (b - a) * t;
function makeBuf(vcap, icap) {
  return { n: 0, ni: 0, vcap, icap, P: new Float32Array(vcap * 3), N: new Float32Array(vcap * 3), U: new Float32Array(vcap * 2),
    E: new Float32Array(vcap * 3), M: new Float32Array(vcap * 4), C: new Float32Array(vcap * 3), I: new Uint32Array(icap) };
}
const BUF_KEYS = [['P', 3], ['N', 3], ['U', 2], ['E', 3], ['M', 4], ['C', 3]];
function growBuf(b, needV, needI) {
  if (b.n + needV > b.vcap) { const nc = Math.max(b.vcap * 2, b.n + needV); for (const [k, s] of BUF_KEYS) { const a = new Float32Array(nc * s); a.set(b[k]); b[k] = a; } b.vcap = nc; }
  if (b.ni + needI > b.icap) { const nc = Math.max(b.icap * 2, b.ni + needI); const a = new Uint32Array(nc); a.set(b.I); b.I = a; b.icap = nc; }
}
function bufGeometry(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.P.slice(0, b.n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(b.N.slice(0, b.n * 3), 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(b.U.slice(0, b.n * 2), 2));
  g.setAttribute('aEdge', new THREE.BufferAttribute(b.E.slice(0, b.n * 3), 3));
  g.setAttribute('aMat', new THREE.BufferAttribute(b.M.slice(0, b.n * 4), 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(b.C.slice(0, b.n * 3), 3));
  g.setIndex(new THREE.BufferAttribute(b.I.slice(0, b.ni), 1));
  return g;
}
// the same geometry for a big buffer, handing the page back between attributes
async function bufGeometryInSteps(b, tick) {
  const g = new THREE.BufferGeometry(), names = ['position', 'normal', 'aUv', 'aEdge', 'aMat', 'aCol'];
  for (let i = 0; i < BUF_KEYS.length; i++) { const [k, s] = BUF_KEYS[i]; g.setAttribute(names[i], new THREE.BufferAttribute(b[k].slice(0, b.n * s), s)); await tick(); }
  g.setIndex(new THREE.BufferAttribute(b.I.slice(0, b.ni), 1));
  return g;
}
let SX = new Float32Array(3 * 2048), SN = new Float32Array(3 * 2048), SU = new Float32Array(2048), SV = new Float32Array(256), SR = new Float32Array(256);
const _o = [0, 0, 0], _uv = [0, 0], _c3 = [1, 1, 1], WHITE = [1, 1, 1], RIB_ALL = [1, 1, 1, 1], RIB_NONE = [0, 0, 0, 0];
// A grid patch of the surface f(s, t, out). o: kind, size (facet, m), rib (half width, m), ribs [s0, s1, t0, t1], ao | aoFn(s,t),
// col | colFn(s,t,out), uvFn(x,y,z,out) (else metric uv centred on the patch + uo, vo), ec (frame: chandelier index), w (aMat.w)
function patch(b, nu, nv, f, o) {
  const W = nu + 1, H = nv + 1, cnt = W * H;
  if (cnt * 3 > SX.length) { SX = new Float32Array(cnt * 3); SN = new Float32Array(cnt * 3); SU = new Float32Array(cnt); }
  if (H > SR.length) { SR = new Float32Array(H); SV = new Float32Array(H); }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { f(i / nu, j / nv, _o); const k = (j * W + i) * 3; SX[k] = _o[0]; SX[k + 1] = _o[1]; SX[k + 2] = _o[2]; }
  for (let j = 0; j < H; j++) { let acc = 0; SU[j * W] = 0;
    for (let i = 1; i < W; i++) { const k = (j * W + i) * 3; acc += Math.hypot(SX[k] - SX[k - 3], SX[k + 1] - SX[k - 2], SX[k + 2] - SX[k - 1]); SU[j * W + i] = acc; }
    SR[j] = acc; }
  const im = nu >> 1; let colLen = 0; SV[0] = 0;
  for (let j = 1; j < H; j++) { const k = (j * W + im) * 3, k0 = k - W * 3; colLen += Math.hypot(SX[k] - SX[k0], SX[k + 1] - SX[k0 + 1], SX[k + 2] - SX[k0 + 2]); SV[j] = colLen; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 3, a = (j * W + Math.max(i - 1, 0)) * 3, c = (j * W + Math.min(i + 1, nu)) * 3, d = (Math.max(j - 1, 0) * W + i) * 3, e = (Math.min(j + 1, nv) * W + i) * 3;
    const ux = SX[c] - SX[a], uy = SX[c + 1] - SX[a + 1], uz = SX[c + 2] - SX[a + 2], vx = SX[e] - SX[d], vy = SX[e + 1] - SX[d + 1], vz = SX[e + 2] - SX[d + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) SN[k] = NaN; else { SN[k] = nx / l; SN[k + 1] = ny / l; SN[k + 2] = nz / l; }
  }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 3; if (SN[k] === SN[k]) continue;
    let src = -1;
    for (let dj = 1; dj < H && src < 0; dj++) { for (const jj of [j - dj, j + dj]) { if (jj < 0 || jj >= H) continue; const kk = (jj * W + i) * 3; if (SN[kk] === SN[kk]) { src = kk; break; } } }
    if (src < 0) { SN[k] = 0; SN[k + 1] = 1; SN[k + 2] = 0; } else { SN[k] = SN[src]; SN[k + 1] = SN[src + 1]; SN[k + 2] = SN[src + 2]; }
  }
  growBuf(b, cnt, nu * nv * 6);
  const base = b.n, kind = o.kind || 0, size = o.size || 0.6, rw = o.w !== undefined ? o.w : (o.rib || 0), ribs = o.ribs || RIB_NONE, col = o.col || WHITE;
  const uo = o.uo || 0, vo = o.vo || 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const q = j * W + i, k = q * 3, n = b.n++;
    b.P[n * 3] = SX[k]; b.P[n * 3 + 1] = SX[k + 1]; b.P[n * 3 + 2] = SX[k + 2];
    b.N[n * 3] = SN[k]; b.N[n * 3 + 1] = SN[k + 1]; b.N[n * 3 + 2] = SN[k + 2];
    if (o.uvFn) { o.uvFn(SX[k], SX[k + 1], SX[k + 2], _uv, i / nu, j / nv); b.U[n * 2] = _uv[0]; b.U[n * 2 + 1] = _uv[1]; }
    else { b.U[n * 2] = SU[q] - SR[j] * 0.5 + uo; b.U[n * 2 + 1] = SV[j] + vo; }
    if (o.ec !== undefined) { b.E[n * 3] = 99; b.E[n * 3 + 1] = o.ec; b.E[n * 3 + 2] = 99; }
    else { b.E[n * 3] = ribs[0] ? SU[q] : 99; b.E[n * 3 + 1] = ribs[1] ? SR[j] - SU[q] : 99; b.E[n * 3 + 2] = Math.min(ribs[2] ? SV[j] : 99, ribs[3] ? colLen - SV[j] : 99); }
    b.M[n * 4] = kind; b.M[n * 4 + 1] = size; b.M[n * 4 + 2] = o.aoFn ? o.aoFn(i / nu, j / nv) : (o.ao !== undefined ? o.ao : 1); b.M[n * 4 + 3] = rw;
    let cc = col; if (o.colFn) { o.colFn(i / nu, j / nv, _c3); cc = _c3; }
    b.C[n * 3] = cc[0]; b.C[n * 3 + 1] = cc[1]; b.C[n * 3 + 2] = cc[2];
  }
  const same = (p, q) => Math.abs(SX[p * 3] - SX[q * 3]) + Math.abs(SX[p * 3 + 1] - SX[q * 3 + 1]) + Math.abs(SX[p * 3 + 2] - SX[q * 3 + 2]) < 1e-6;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * W + i, c = a + 1, d = a + W, e = d + 1;
    if (!same(a, c) && !same(c, e) && !same(a, e)) { b.I[b.ni++] = base + a; b.I[b.ni++] = base + c; b.I[b.ni++] = base + e; }
    if (!same(a, e) && !same(e, d) && !same(a, d)) { b.I[b.ni++] = base + a; b.I[b.ni++] = base + e; b.I[b.ni++] = base + d; }
  }
}
// cu x cv ribbed cells over f, each its own patch (su x sv quads) with its own mosaic
function cells(b, rng, cu, cv, su, sv, f, o) {
  o.ribs = RIB_ALL;
  for (let j = 0; j < cv; j++) for (let i = 0; i < cu; i++) {
    o.uo = rng() * 40; o.vo = rng() * 40;
    if (o.sizes) o.size = o.sizes[(rng() * o.sizes.length) | 0];
    if (o.kind === 1) o.col = [0.88 + 0.22 * rng(), 0.94 + 0.14 * rng(), 0.9 + 0.2 * rng()];
    patch(b, su, sv, (s, t, out) => f((i + s) / cu, (j + t) / cv, out), o);
  }
}
// a moulding: the profile prof [[out, y], ...] swept along the plan polyline pts [[x, z], ...]; side = +-1 picks the offset side
function strip(b, pts, closed, side, prof, o) {
  const n = pts.length;
  const segN = (i) => { const a = pts[i], c = pts[(i + 1) % n]; const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dz / l * side, -dx / l * side]; };
  const mit = [];
  for (let i = 0; i < n; i++) {
    const n1 = (closed || i > 0) ? segN((i - 1 + n) % n) : null, n2 = (closed || i < n - 1) ? segN(i) : null;
    const a = n1 || n2, c = n2 || n1, d = 1 + a[0] * c[0] + a[1] * c[1];
    mit.push(d < 0.05 ? [a[0], a[1]] : [(a[0] + c[0]) / d, (a[1] + c[1]) / d]);
  }
  const np = prof.length - 1, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const A = pts[i], B = pts[(i + 1) % n], mA = mit[i], mB = mit[(i + 1) % n];
    patch(b, 1, np, (s, t, out) => {
      const ft = t * np, k = Math.min(np - 1, Math.floor(ft + 1e-6)), fr = ft - k;
      const po = lerp(prof[k][0], prof[k + 1][0], fr);
      out[0] = lerp(A[0] + mA[0] * po, B[0] + mB[0] * po, s); out[1] = lerp(prof[k][1], prof[k + 1][1], fr); out[2] = lerp(A[1] + mA[1] * po, B[1] + mB[1] * po, s);
    }, o);
  }
}
// a flat polygon (with optional hole) at height y; uv = (x, z)
function poly(b, contour, hole, y, o) {
  const pts = hole ? contour.concat(hole) : contour;
  const v2 = (a) => a.map((p) => new THREE.Vector2(p[0], p[1]));
  const faces = THREE.ShapeUtils.triangulateShape(v2(contour), hole ? [v2(hole)] : []);
  growBuf(b, pts.length, faces.length * 3);
  const base = b.n, col = o.col || WHITE;
  for (const p of pts) { const n = b.n++;
    b.P[n * 3] = p[0]; b.P[n * 3 + 1] = y; b.P[n * 3 + 2] = p[1]; b.N[n * 3] = 0; b.N[n * 3 + 1] = 1; b.N[n * 3 + 2] = 0;
    b.U[n * 2] = p[0]; b.U[n * 2 + 1] = p[1]; b.E[n * 3] = 99; b.E[n * 3 + 1] = 99; b.E[n * 3 + 2] = 99;
    b.M[n * 4] = o.kind || 0; b.M[n * 4 + 1] = 0.6; b.M[n * 4 + 2] = o.ao !== undefined ? o.ao : 1; b.M[n * 4 + 3] = 0;
    b.C[n * 3] = col[0]; b.C[n * 3 + 1] = col[1]; b.C[n * 3 + 2] = col[2]; }
  for (const f of faces) { b.I[b.ni++] = base + f[0]; b.I[b.ni++] = base + f[1]; b.I[b.ni++] = base + f[2]; }
}

// ------------------------------------------------------------------------------------------------ the muqarnas dome
const PHI_MAX = 84 * Math.PI / 180;
// Tiers of pointed niches (two concave wings each) standing on the spandrels of the tier below, in cylindrical coordinates
// round (cx, cz). o: R, Y, H, K tiers, N cells, halveAt tier, a0, span, clamp (half domes), sizes (facets), boss, back
async function buildDome(b, rng, cx, cz, o) {
  const K = o.K, a0 = o.a0 || 0, span = o.span || Math.PI * 2, a1 = a0 + span;
  const ring = (k) => { const phi = PHI_MAX * (1 - Math.pow(1 - k / K, 1.35)); return [o.R * Math.pow(Math.cos(phi), 0.85), o.Y + o.H * Math.sin(phi)]; };
  const g = (t) => (1 - Math.sqrt(1 - 0.7569 * t * t)) * 2;
  const tm = (t) => 1 - Math.pow(1 - t, 1.5);
  const put = (ang, r, y, out) => { if (o.clamp) ang = Math.min(a1, Math.max(a0, ang)); out[0] = cx + r * Math.cos(ang); out[1] = y; out[2] = cz + r * Math.sin(ang); };
  const mo = { kind: 1 };
  let N = o.N, c0 = a0;
  for (let k = 0; k < K; k++) {
    await o.tick();                                             // a tier of niches at a time
    if (k === o.halveAt) N = N / 2;
    const [r0, y0] = ring(k), [r1, y1] = ring(k + 1), D = span / N, wdt = D * r0, hgt = Math.hypot(r1 - r0, y1 - y0);
    const depth = 0.24 * Math.min(wdt, hgt * 1.2), bulge = 0.05 * wdt;
    mo.rib = Math.min(0.25, Math.max(0.07, 0.055 * wdt));
    for (let j = o.clamp ? -1 : 0; j < (o.clamp ? N + 1 : N); j++) {
      const aC = c0 + j * D, am = aC + D * 0.5;
      mo.size = Math.min(o.sizes[(rng() * o.sizes.length) | 0], wdt / 3.2);
      mo.col = [0.88 + 0.22 * rng(), 0.94 + 0.14 * rng(), 0.9 + 0.2 * rng()];
      mo.ribs = [1, 1, 0, 1]; mo.aoFn = null; mo.ao = 0.95; mo.uo = rng() * 40; mo.vo = rng() * 40;
      patch(b, 2, 3, (s, t, out) => { const tt = tm(t), q = s * 2 - 1;
        put(aC + 0.5 * D * q * g(tt), lerp(r0, r1, tt) - bulge * (1 - q * q) * Math.sin(Math.PI * tt), lerp(y0, y1, tt), out); }, mo);
      mo.ribs = [1, 0, 1, 0]; mo.aoFn = (s, t) => 1 - 0.6 * Math.sin(s * Math.PI * 0.5) * Math.sin(Math.PI * tm(t));
      for (let side = 1; side >= -1; side -= 2) {
        const corner = side > 0 ? aC : aC + D; mo.uo = rng() * 40; mo.vo = rng() * 40;
        patch(b, 2, 3, (s, t, out) => { const tt = tm(t), aE = corner + side * 0.5 * D * g(tt), ss = Math.sin(s * Math.PI * 0.5);
          put(lerp(aE, am, s), lerp(r0, r1, tt) + depth * ss * Math.pow(Math.sin(Math.PI * tt), 0.8), lerp(y0, y1, tt), out); }, mo);
      }
    }
    c0 += D * 0.5;
  }
  await o.tick();
  const [rK, yK] = ring(K), sc = o.R / 27;
  mo.ribs = [0, 0, 1, 0]; mo.aoFn = null; mo.ao = 0.8; mo.size = 0.32; mo.rib = 0.1;
  patch(b, Math.max(6, Math.round(N * (o.clamp ? 1 : 1))), 2, (s, t, out) => put(a0 + s * span, lerp(rK, 0.9 * sc, t), yK + 0.6 * sc * Math.sin(t * Math.PI * 0.5), out), mo);
  if (o.boss) {
    const pr = [[0.9, 0.6], [1.15, 0.2], [0.7, -0.3], [0.95, -0.8], [0.4, -1.5], [0.0, -2.3]];
    patch(b, 10, 5, (s, t, out) => { const ft = t * 5, i = Math.min(4, Math.floor(ft + 1e-6)), fr = ft - i;
      put(s * Math.PI * 2, lerp(pr[i][0], pr[i + 1][0], fr) * sc, yK + lerp(pr[i][1], pr[i + 1][1], fr) * sc, out); }, { kind: 0, col: [0.8, 0.66, 0.42], ao: 0.8 });
  }
  if (o.back !== false) patch(b, o.clamp ? 10 : 20, 5, (s, t, out) => { const phi = t * Math.PI * 0.49;
    put(a0 + s * span, (o.R + 2.5) * Math.cos(phi), o.Y - 1 + (o.H + 3) * Math.sin(phi), out); }, { kind: 7, col: [0.04, 0.05, 0.06] });
}

// ------------------------------------------------------------------------------------------------ the hall
const POOL_OUTLINE = [[11, 126], [11, 24.355], [25, 10.355], [25, -10.355], [11, -24.355], [11, -126], [-11, -126], [-11, -24.355], [-25, -10.355], [-25, 10.355], [-11, 24.355], [-11, 126]];
async function buildShell(b, rng, o) {
  const STUCCO = [0.8, 0.66, 0.42], MARBLE = [0.7, 0.67, 0.6];
  const mir = (rib) => ({ kind: 1, rib: rib || 0.25, sizes: o.sizes, ao: 0.95 });
  const stu = (ao) => ({ kind: 0, col: STUCCO, ao: ao === undefined ? 1 : ao });
  const topT = (x) => archY(x, PIER_X, SPRING_Y, RING_Y), topS = (zl) => archY(zl, 27, SPRING_Y, RING_Y);
  // dado: marble face 0..7.6 with a cap moulding, along a plan polyline
  const dadoRun = (pts, side) => {
    let run = rng() * 60;
    for (let i = 0; i < pts.length - 1; i++) {
      const A = pts[i], B = pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), r0 = run;
      patch(b, 1, 1, (s, t, out) => { out[0] = lerp(A[0], B[0], s); out[1] = t * 7.6; out[2] = lerp(A[1], B[1], s); },
        { kind: 3, col: MARBLE, uvFn: (x, y, z, uv, s) => { uv[0] = r0 + s * len; uv[1] = y; } });
      run += len;
    }
    strip(b, pts, false, side, [[0, 7.6], [0.3, 7.75], [0.3, 8.25], [0, 8.6]], stu(0.95));
  };
  // 1. domes, cornice rings, pendentives
  const phiC = Math.atan2(27, PIER_X);
  for (const zc of DOME_Z) {
    await buildDome(b, rng, 0, zc, { R: DOME_R, Y: DOME_Y, H: DOME_H, K: 9, N: o.N, halveAt: o.halveAt, sizes: o.sizes, boss: true, tick: o.tick });
    await o.tick();
    const circ = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; circ.push([RING_R * Math.cos(a), zc + RING_R * Math.sin(a)]); }
    strip(b, circ, true, -1, [[0, RING_Y], [0.5, RING_Y + 0.2], [0.5, RING_Y + 0.55], [0.1, RING_Y + 0.75], [0.1, DOME_Y]], stu(0.9));
    for (let sx = -1; sx <= 1; sx += 2) for (let sz = -1; sz <= 1; sz += 2) {
      await o.tick();
      cells(b, rng, 6, 3, 2, 2, (s, t, out) => {
        const phi = s < 0.5 ? s * 2 * phiC : phiC + (s - 0.5) * 2 * (Math.PI / 2 - phiC), c = Math.cos(phi), sn = Math.sin(phi);
        let bx, bz, by;
        if (s <= 0.5) { bx = PIER_X; bz = Math.min(27, PIER_X * sn / Math.max(c, 1e-6)); by = topS(bz); }
        else { bz = 27; bx = Math.min(PIER_X, 27 * c / Math.max(sn, 1e-6)); by = topT(bx); }
        const h = Math.sin(t * Math.PI / 2), w = 1 - Math.cos(t * Math.PI / 2);
        out[0] = sx * lerp(bx, RING_R * c, w); out[1] = lerp(by, RING_Y, h); out[2] = zc + sz * lerp(bz, RING_R * sn, w);
      }, mir(0.22));
    }
    await o.tick();
  }
  // 2. transverse arches and the window-bay vaults
  for (const zb of [-90, -30, 30, 90]) { await o.tick(); cells(b, rng, 12, 1, 2, 2, (s, t, out) => { const x = PIER_X * Math.sin((s - 0.5) * Math.PI); out[0] = x; out[1] = topT(x); out[2] = zb - 3 + 6 * t; }, mir(0.22)); }
  for (const zc of DOME_Z) for (let sx = -1; sx <= 1; sx += 2) {
    await o.tick();
    cells(b, rng, 10, 2, 2, 2, (s, t, out) => { const zl = 27 * Math.sin((s - 0.5) * Math.PI); out[0] = sx * (PIER_X + 6 * t); out[1] = topS(zl); out[2] = zc + zl; }, mir(0.2));
    await o.tick();
    // 3. the bay wall with its window opening
    const X = sx * WALL_X, XO = sx * (WALL_X + 1.6);
    for (const [za, zb] of [[-27, -20], [-20, -13], [-13, -6], [6, 13], [13, 20], [20, 27]]) {
      const rows = Math.max(1, Math.round((topS((za + zb) / 2) - 8.6) / 7));
      cells(b, rng, 1, rows, 2, 2, (s, t, out) => { const zl = lerp(za, zb, s); out[0] = X; out[1] = lerp(8.6, topS(zl), t); out[2] = zc + zl; }, mir());
    }
    cells(b, rng, 2, 1, 3, 2, (s, t, out) => { const zl = lerp(-WIN_HALF, WIN_HALF, s); out[0] = X; out[1] = lerp(winHead(zl), topS(zl), t); out[2] = zc + zl; }, mir());
    patch(b, 1, 1, (s, t, out) => { out[0] = X; out[1] = lerp(8.6, WIN_SILL, t); out[2] = zc + lerp(-WIN_HALF, WIN_HALF, s); }, stu());
    patch(b, 1, 1, (s, t, out) => { out[0] = lerp(X, XO, t); out[1] = WIN_SILL; out[2] = zc + lerp(-WIN_HALF, WIN_HALF, s); }, stu(0.75));
    for (let e = -1; e <= 1; e += 2) patch(b, 1, 1, (s, t, out) => { out[0] = lerp(X, XO, t); out[1] = lerp(WIN_SILL, WIN_SPRING, s); out[2] = zc + e * WIN_HALF; }, stu(0.6));
    patch(b, 8, 1, (s, t, out) => { const zl = lerp(-WIN_HALF, WIN_HALF, s); out[0] = lerp(X, XO, t); out[1] = winHead(zl); out[2] = zc + zl; }, stu(0.55));
  }
  // 4. piers (mirror panels and capitals) and the long side walls' dado
  for (let sx = -1; sx <= 1; sx += 2) {
    const run = [[sx * WALL_X, -147]];
    for (const zb of [-90, -30, 30, 90]) {
      await o.tick();
      const pp = [[sx * WALL_X, zb - 3], [sx * PIER_X, zb - 3], [sx * PIER_X, zb + 3], [sx * WALL_X, zb + 3]];
      run.push(...pp);
      for (let i = 0; i < 3; i++) { const A = pp[i], B = pp[i + 1];
        cells(b, rng, 1, 1, 1, 2, (s, t, out) => { out[0] = lerp(A[0], B[0], s); out[1] = lerp(8.6, 14.9, t); out[2] = lerp(A[1], B[1], s); }, mir(0.22)); }
      strip(b, pp, false, -sx, [[0, 14.9], [0.45, 15.2], [0.45, 16.2], [0.15, 16.4], [0, 16.6]], stu(0.9));
    }
    run.push([sx * WALL_X, 147]);
    await o.tick();
    dadoRun(run, -sx);
  }
  // 5. end walls: the door end (z = -147) and the apse end (z = +147)
  for (let end = -1; end <= 1; end += 2) {
    await o.tick();
    const zw = end * 147, half = end < 0 ? 9 : 10, zo = end * 150;
    const head = end < 0 ? () => 26 : (x) => archY(x, 10, SPRING_Y, 29);
    const xm = (PIER_X + half) / 2;
    for (const [xa, xb] of [[-PIER_X, -xm], [-xm, -half], [half, xm], [xm, PIER_X]]) {
      const rows = Math.max(1, Math.round((topT((xa + xb) / 2) - 8.6) / 7));
      cells(b, rng, 1, rows, 2, 2, (s, t, out) => { const x = lerp(xa, xb, s); out[0] = x; out[1] = lerp(8.6, topT(x), t); out[2] = zw; }, mir());
    }
    for (let sx = -1; sx <= 1; sx += 2) {
      cells(b, rng, 1, 1, 1, 2, (s, t, out) => { out[0] = sx * lerp(PIER_X, WALL_X, s); out[1] = lerp(8.6, 14.9, t); out[2] = zw; }, mir(0.22));
      strip(b, [[sx * WALL_X, zw], [sx * PIER_X, zw]], false, -end * sx, [[0, 14.9], [0.45, 15.2], [0.45, 16.2], [0.15, 16.4], [0, 16.6]], stu(0.9));
      // jamb above the dado
      cells(b, rng, 1, 2, 1, 2, (s, t, out) => { out[0] = sx * half; out[1] = lerp(8.6, head(half), t); out[2] = lerp(zw, zo, s); }, mir(0.2));
    }
    cells(b, rng, end < 0 ? 2 : 4, 1, 2, 2, (s, t, out) => { const x = lerp(-half, half, s); out[0] = x; out[1] = lerp(head(x), topT(x), t); out[2] = zw; }, mir());
    patch(b, 10, 1, (s, t, out) => { const x = lerp(-half, half, s); out[0] = x; out[1] = head(x); out[2] = lerp(zw, zo, t); }, stu(0.6));
  }
  await o.tick();
  dadoRun([[-WALL_X, -147], [-9, -147], [-9, -150]], -1);
  dadoRun([[9, -150], [9, -147], [WALL_X, -147]], -1);
  await o.tick();
  // 6. the apse niche: chamber, pointed barrel, half-dome of muqarnas
  const apse = [[WALL_X, 147], [10, 147], [10, 150], [NICHE_R, 150], [NICHE_R, NICHE_ZC]];
  for (let i = 1; i < 12; i++) { const a = i / 12 * Math.PI; apse.push([NICHE_R * Math.cos(a), NICHE_ZC + NICHE_R * Math.sin(a)]); }
  apse.push([-NICHE_R, NICHE_ZC], [-NICHE_R, 150], [-10, 150], [-10, 147], [-WALL_X, 147]);
  dadoRun(apse, -1);
  await o.tick();
  const nm = { kind: 1, rib: 0.18, sizes: [0.35, 0.5, 0.7, 0.9], ao: 0.9 };
  for (let sx = -1; sx <= 1; sx += 2) cells(b, rng, 3, 1, 1, 2, (s, t, out) => { out[0] = sx * NICHE_R; out[1] = lerp(8.6, SPRING_Y, t); out[2] = lerp(150, NICHE_ZC, s); }, nm);
  cells(b, rng, 8, 1, 2, 2, (s, t, out) => { const a = s * Math.PI; out[0] = NICHE_R * Math.cos(a); out[1] = lerp(8.6, SPRING_Y, t); out[2] = NICHE_ZC + NICHE_R * Math.sin(a); }, nm);
  cells(b, rng, 8, 2, 2, 2, (s, t, out) => { const x = NICHE_R * Math.sin((s - 0.5) * Math.PI); out[0] = x; out[1] = archY(x, NICHE_R, SPRING_Y, 30); out[2] = lerp(150, NICHE_ZC, t); }, nm);
  await o.tick();
  await buildDome(b, rng, 0, NICHE_ZC, { R: NICHE_R, Y: SPRING_Y, H: 14, K: 6, N: 12, halveAt: -1, a0: 0, span: Math.PI, clamp: true, sizes: [0.3, 0.42, 0.6], boss: false, tick: o.tick });
  await o.tick();
  const band = [[-0.7, 0], [-0.5, 0.5], [0.5, 0.5], [0.7, 0]];
  patch(b, 16, 3, (s, t, out) => { const x = NICHE_R * Math.sin((s - 0.5) * Math.PI), y = archY(x, NICHE_R, SPRING_Y, 30), q = band[Math.round(t * 3)];
    const dx = -x, dy = 14 - y, l = Math.hypot(dx, dy) || 1; out[0] = x + dx / l * q[1]; out[1] = y + dy / l * q[1]; out[2] = NICHE_ZC + q[0]; }, stu(0.85));
  await o.tick();
  // 7. floor, pool rim
  if (o.floor) {
    const fo = { kind: 2, col: MARBLE };
    poly(b, [[-WALL_X, -147], [WALL_X, -147], [WALL_X, 147], [-WALL_X, 147]], POOL_OUTLINE, 0, fo);
    poly(b, [[-9, -150], [9, -150], [9, -147], [-9, -147]], null, 0, fo);
    poly(b, [[-10, 147], [10, 147], [10, 150], [-10, 150]], null, 0, fo);
    const nf = [[-NICHE_R, 150], [NICHE_R, 150]];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; nf.push([NICHE_R * Math.cos(a), NICHE_ZC + NICHE_R * Math.sin(a)]); }
    poly(b, nf, null, 0, fo);
  }
  await o.tick();
  strip(b, POOL_OUTLINE, true, -1, [[0, POOL_FLOOR_Y], [0, 0.26], [0.1, 0.38], [1.1, 0.38], [1.25, 0.26], [1.25, 0]], { kind: 0, col: MARBLE, ao: 0.9 });
}

// ------------------------------------------------------------------------------------------------ chandeliers
const TAU = Math.PI * 2;
const _t0 = [0, 0, 0], _t1 = [0, 0, 0], _t2 = [0, 0, 0];
// a tube of `sides` round path(t, out), n segments long
function tube(b, path, n, rad, sides, o) {
  let lastT = -1, ux = 0, uy = 0, uz = 0, vx = 0, vy = 0, vz = 0;
  patch(b, sides, n, (s, t, out) => {
    if (t !== lastT) { lastT = t;
      path(Math.max(0, t - 0.01), _t0); path(Math.min(1, t + 0.01), _t1); path(t, _t2);
      let tx = _t1[0] - _t0[0], ty = _t1[1] - _t0[1], tz = _t1[2] - _t0[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      const rx = Math.abs(ty) > 0.9 ? 1 : 0, ry = Math.abs(ty) > 0.9 ? 0 : 1;
      ux = ty * 0 - tz * ry; uy = tz * rx - tx * 0; uz = tx * ry - ty * rx; const lu = Math.hypot(ux, uy, uz) || 1; ux /= lu; uy /= lu; uz /= lu;
      vx = ty * uz - tz * uy; vy = tz * ux - tx * uz; vz = tx * uy - ty * ux; }
    const a = s * TAU, c = Math.cos(a) * rad, d = Math.sin(a) * rad;
    out[0] = _t2[0] + ux * c + vx * d; out[1] = _t2[1] + uy * c + vy * d; out[2] = _t2[2] + uz * c + vz * d;
  }, o);
}
function lathe(b, cx, cy, cz, prof, sc, nu, o) {
  const np = prof.length - 1;
  patch(b, nu, np, (s, t, out) => { const p = prof[Math.round(t * np)], a = s * TAU; out[0] = cx + p[0] * sc * Math.cos(a); out[1] = cy + p[1] * sc; out[2] = cz + p[0] * sc * Math.sin(a); }, o);
}
// uniform Catmull-Rom through 2D points
function spline2(P, t, out) {
  const n = P.length - 1, ft = Math.min(Math.max(t, 0), 0.99999) * n, i = Math.floor(ft), f = ft - i;
  const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n)];
  for (let k = 0; k < 2; k++) out[k] = 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * f * f * f);
}
const BELL = [[1.2, 11.3], [2.6, 10.6], [4, 9.5], [5.6, 8.0], [7, 6], [8.3, 3.8], [9, 1.5], [9.75, 0.95], [10.25, 1.55]];
const STEM = [[0, 0.75], [0.35, 1.0], [0.62, 1.5], [0.3, 2.0], [0.22, 2.6], [0.5, 3.2], [0.22, 3.9], [0.18, 5.5], [0.48, 6.0], [0.2, 6.6], [0.18, 9.0],
  [0.5, 9.5], [0.25, 10.2], [0.9, 11.0], [1.35, 11.4], [0.9, 11.9], [0.35, 12.6], [0.52, 13.2], [0.2, 13.8]];
const RING_RAD = [9, 7, 4], RING_H = [1.5, 6, 9.5];
// One bell-shaped chandelier hanging from topY: frame into fb (chandelier index ci for the spin), flames and drops into out.
async function buildChandelier(fb, rng, ci, base, sc, topY, o, out) {
  const bx = base[0], by = base[1], bz = base[2], cs = sc < 0.9 ? 0.72 : 1, lesser = ci > 0;
  const so = { kind: 4, col: [0.62, 0.66, 0.7], ec: ci };
  const wo = { kind: 6, col: [0.8, 0.82, 0.8], ec: ci, w: 0, uvFn: (x, y, z, uv, s, t) => { uv[0] = s; uv[1] = t; } };
  const P = (r, h, a, p) => { p[0] = bx + r * sc * Math.cos(a); p[1] = by + h * sc; p[2] = bz + r * sc * Math.sin(a); };
  const p2 = [0, 0], p3 = [0, 0, 0];
  const keep = () => o.thin() ;
  // rings: flat silver hoops that carry the candles
  for (let k = 0; k < 3; k++) patch(fb, lesser ? 32 : 48, 6, (s, t, p) => { const e = t * TAU; P(RING_RAD[k] + 0.62 * Math.cos(e), RING_H[k] + 0.15 * Math.sin(e), s * TAU, p); }, so);
  // candles in two staggered rows on every ring
  for (let k = 0; k < 3; k++) {
    const n = o.candles[k], ringId = lesser ? 3 : k; wo.w = ringId;
    for (let i = 0; i < n; i++) {
      if ((i & 15) === 0) await o.tick();                        // sixteen candles at a time
      const a = (i + 0.5 * (k & 1)) / n * TAU; P(RING_RAD[k] + ((i & 1) ? 0.38 : -0.38), RING_H[k] + 0.15, a, p3);
      const x = p3[0], y = p3[1], z = p3[2], h = (0.8 + 0.45 * rng()) * cs;
      lathe(fb, x, y, z, [[0.1, 0], [0.38, 0.12], [0.44, 0.3]], cs, 6, so);
      patch(fb, 5, 1, (s, t, p) => { const r = (0.135 - 0.02 * t) * cs, e = s * TAU; p[0] = x + r * Math.cos(e); p[1] = y + 0.1 * cs + t * h; p[2] = z + r * Math.sin(e); }, wo);
      out.flames.push(x, y + 0.1 * cs + h - 0.02, z, ci, 0.62 * cs, rng(), ringId, 0);
      if (i % 5 === 0) out.flames.push(x, y + 0.1 * cs + h + 0.3, z, ci, 3.4 * cs, rng(), ringId, 1);
    }
  }
  // meridian ribs from the crown down over the rings, ending in a small upturned scroll
  for (let j = 0; j < o.ribs; j++) { const a = j / o.ribs * TAU;
    if ((j & 3) === 0) await o.tick();
    tube(fb, (t, p) => { spline2(BELL, t, p2); P(p2[0], p2[1], a, p); }, 16, 0.11 * cs, 4, so); }
  await o.tick();
  // stem, spokes, canopy
  lathe(fb, bx, by, bz, STEM, sc, 10, so);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) { const a = (j + 0.5 * k) / 6 * TAU;
    tube(fb, (t, p) => P(lerp(0.2, RING_RAD[k] - 0.6, t), RING_H[k], a, p), 1, 0.07 * cs, 4, so); }
  out.lowerEnd = fb.ni;
  if (!lesser) out.flames.push(bx, by, bz, ci, 44 * sc, 0.5, 0, 2);       // one soft glow round bell and reflection, seen from far off
  await o.tick();
  // chain of alternating links up to the dome's boss, and the collar the doves sit on
  const y0 = by + 13.8 * sc, L = 1.3 * cs, nl = Math.max(2, Math.floor((topY - y0) / L));
  for (let i = 0; i < nl; i++) { const yc = y0 + (i + 0.5) * (topY - y0) / nl, c = i & 1 ? 0 : 1, d = i & 1 ? 1 : 0, hh = (topY - y0) / nl * 0.64;
    tube(fb, (t, p) => { const e = t * TAU; p[0] = bx + c * 0.34 * cs * Math.cos(e); p[1] = yc + hh * Math.sin(e); p[2] = bz + d * 0.34 * cs * Math.cos(e); }, 8, 0.085 * cs, 4, so); }
  lathe(fb, bx, by + 14.2 * sc, bz, [[0.2, -0.3], [1.5, -0.12], [1.6, 0.1], [0.3, 0.42]], cs, 12, so);
  await o.tick();
  // ---- crystal: len, width, phase, swing
  const drop = (x, y, z, len, w, hang) => { if (keep()) out.drops.push(x, y, z, ci, len * cs, w * cs, rng(), hang); else rng(); };
  const dl = 0.5;
  // strings laid over the bell between the ribs
  const ns = lesser ? Math.round(o.strings * 0.45) : o.strings;
  for (let j = 0; j < ns; j++) { const a = (j + 0.5) / ns * TAU, m = lesser ? 13 : 24;
    for (let i = 0; i < m; i++) { spline2(BELL, 0.04 + 0.71 * (i + 0.5 * (j & 1)) / m, p2); P(p2[0] * 0.985, p2[1] + 0.1, a, p3); drop(p3[0], p3[1], p3[2], dl, 0.24, 0.25); } }
  await o.tick();
  // pendants under each ring, long and short in turn; the lowest stop 0.4 m off the water
  const pend = lesser ? [40, 30, 18] : [120, 90, 56];
  for (let k = 0; k < 3; k++) for (let i = 0; i < pend[k]; i++) {
    const a = (i + 0.25) / pend[k] * TAU, m = k === 0 ? (lesser ? 2 : 3 - (i & 1)) : 3 + (i % 4 === 0 ? 3 : (i & 1));
    P(RING_RAD[k] + ((i & 1) ? 0.62 : -0.62), RING_H[k] - 0.14, a, p3);
    for (let q = 0; q < m; q++) { const big = q === m - 1 && i % 4 === 0; drop(p3[0], p3[1] - q * dl * cs * 1.03, p3[2], dl * (k === 0 ? 0.94 : 1), big ? 0.36 : 0.24, 0.4 + q * 0.5); }
  }
  await o.tick();
  // festoons between the ribs, two sags on each ring
  for (let k = 0; k < 3; k++) for (let j = 0; j < o.ribs; j++) for (let row = 0; row < 2; row++) {
    const m = k === 2 ? 6 : 9, sag = (row ? 1.5 : 0.8) * (k === 2 ? 0.7 : 1);
    for (let i = 0; i < m; i++) { const u = (i + 0.5) / m; P(RING_RAD[k] + 0.66 + row * 0.1, RING_H[k] - 0.1 - sag * 4 * u * (1 - u), (j + u) / o.ribs * TAU, p3); drop(p3[0], p3[1], p3[2], dl * 0.9, 0.22, 0.5 + row * 0.3); }
  }
  await o.tick();
  // the inner basket and the cluster at the foot
  const nb = lesser ? 8 : 20;
  for (let j = 0; j < nb; j++) for (let i = 0; i < (lesser ? 9 : 20); i++) { const u = (i + 0.5) / (lesser ? 9 : 20);
    P(lerp(1.3, 0.62, u) + 4.6 * Math.pow(Math.sin(Math.PI * u), 0.9), lerp(11.1, 1.7, u), (j + 0.5 * (i & 1)) / nb * TAU, p3); drop(p3[0], p3[1], p3[2], dl, 0.22, 0.35); }
  for (let j = 0; j < 8; j++) { P(0.5, 1.0, j / 8 * TAU, p3); drop(p3[0], p3[1], p3[2], 0.45, 0.24, 0.6); }
  out.drops.push(bx, by + 1.0 * sc, bz, ci, 0.6 * cs, 0.5 * cs, rng(), 0.6);
  for (let j = 0; j < 24; j++) { P(1.36, 11.35, j / 24 * TAU, p3); drop(p3[0], p3[1], p3[2], dl, 0.24, 0.5); }
}
// instanced sprites from flat records of 8 numbers; records passing mirror(i) get a second, negated copy (the reflection)
function spriteGeometry(data, y0, mirror) {
  const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0, y0, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  const n = data.length / 8; let extra = 0;
  for (let i = 0; i < n; i++) if (mirror(i)) extra++;
  const A = new Float32Array((n + extra) * 4), B = new Float32Array((n + extra) * 4);
  let m = 0;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    if (pass && !mirror(i)) continue;
    for (let k = 0; k < 4; k++) { A[m * 4 + k] = data[i * 8 + k]; B[m * 4 + k] = data[i * 8 + 4 + k]; }
    if (pass) B[m * 4] = -B[m * 4];
    m++;
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = m;
  return g;
}

// ------------------------------------------------------------------------------------------------ looks (the brief's variations)
function makeLooks(pal) {
  const c = (i, k = 1) => { const q = new THREE.Color(pal[i]); return [q.r * k, q.g * k, q.b * k]; };
  const mix = (a, b, t, k = 1) => [lerp(a[0], b[0], t) * k, lerp(a[1], b[1], t) * k, lerp(a[2], b[2], t) * k];
  const dusk = c(1), em = c(3), silver = c(4);
  const GOLD = [1.0, 0.64, 0.28];          // candle flame: gold, never white
  const base = {
    flame: [GOLD[0], GOLD[1], GOLD[2], 3.1], lit: [1, 1, 1, 1], winTop: c(1, 3), winBot: mix(em, silver, 0.5, 0.45), winGain: [1, 1], stain: 0.85,
    winFill: mix(dusk, silver, 0.03, 0.9), amb: mix(dusk, silver, 0.07, 0.62), beamDir: [[-1, 0.5, 0.15], [1, 0.5, -0.15]], beamCol: [c(1, 1.7), c(1, 1.7)],
    caus: c(3, 0.5), gain: [0.5, 0.18, 0.45], body: mix(c(2), silver, 0.05, 0.55), spark: [3.0, 2.5, 1.7], deep: c(2, 0.12), dropGain: 4.5, halo: 0.04, portal: c(3, 2.5),
    glit: [0.022, 0.26, 1, 1.3], ghost: [0, 0, 0], dropLit: 0.12, dropSide: 0,
    roomLo: [0.1, 0.066, 0.038], roomHi: [0.012, 0.022, 0.06], jewel: [1.6, 0.6, 1.0], lamp: [2.1, 1.2, 0.42, 34],
  };
  return {
    dusk: base,
    // hard sun through the right-hand (west, -x) windows, laying the glass's colours on marble and water; the candles burn on
    noon: { ...base, lit: [0.85, 0.85, 0.85, 0.85], winTop: [0.25, 0.45, 0.9], winBot: [0.7, 0.8, 0.85], winGain: [2.4, 0.9], stain: 1, winFill: [0.22, 0.24, 0.26],
      amb: [0.088, 0.084, 0.078], beamDir: [[-1, 0.62, 0.2], [1, 0.5, -0.15]], beamCol: [[4.6, 4.3, 3.6], [0.1, 0.14, 0.2]], caus: [0.85, 0.8, 0.6], gain: [0.5, 0.13, 0.45],
      body: [0.03, 0.045, 0.045], spark: [2.7, 2.4, 1.8], dropGain: 7, halo: 0.03, glit: [0.022, 0.27, 1, 0.9], dropLit: 0.5, dropSide: 0.4,
      roomLo: [0.2, 0.145, 0.08], roomHi: [0.02, 0.03, 0.07], jewel: [0.55, 0.55, 1.0] },
    // no flames: mercury blue, fewer and finer glints, the chandelier a ghost; only the alcove lanterns are warm
    moon: { ...base, lit: [0, 0, 0, 0], winTop: [0.14, 0.22, 0.4], winBot: [0.26, 0.36, 0.5], winGain: [1.8, 0.6], stain: 0.6, winFill: [0.08, 0.12, 0.2],
      amb: [0.034, 0.048, 0.075], beamDir: [[-1, 0.9, 0.3], [1, 0.5, -0.15]], beamCol: [[0.3, 0.4, 0.6], [0, 0, 0]], caus: [0.12, 0.2, 0.3], spark: [1.0, 1.3, 1.9], dropGain: 14, halo: 0,
      glit: [0.02, 0.26, 1, 2.0], ghost: [0.34, 0.46, 0.72], dropLit: 0.5, dropSide: 1,
      roomLo: [0.04, 0.056, 0.1], roomHi: [0.014, 0.028, 0.075], jewel: [1.3, 0, 1.0] },
    // dusk with snow at the windows; only the lowest ring burns, so the globe is a thin bright equator
    snow: { ...base, lit: [1, 0, 0, 0.3], winTop: [0.16, 0.2, 0.28], winBot: [0.42, 0.46, 0.5], winFill: [0.05, 0.065, 0.09], amb: [0.028, 0.036, 0.048],
      beamCol: [[0.09, 0.11, 0.15], [0.09, 0.11, 0.15]], spark: [2.3, 2.0, 1.5], glit: [0.02, 0.24, 1, 1.6], jewel: [1.5, 0.7, 0.9] },
  };
}
// ------------------------------------------------------------------------------------------------ the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('million-mirrors-hero') : ctx.rng;
  const thinRng = ctx.rng.fork ? ctx.rng.fork('million-mirrors-thin') : ctx.rng;
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const tick = () => (ctx.yield ? ctx.yield() : Promise.resolve());
  const pal = (opts.palette && opts.palette.length >= 6) ? opts.palette : DEFAULT_PALETTE;
  const looks = makeLooks(pal);
  // what the seed decides: the cut of the honeycomb, the mosaic, the chandelier's make
  const variant = {
    N: rng.pick([28, 32, 32, 36]), halveAt: rng.pick([-1, 7, 8]),
    sizes: rng.pick([[0.5, 0.7, 0.95, 1.3], [0.6, 0.85, 1.2, 1.4], [0.45, 0.6, 0.8, 1.1, 1.4]]),
    ribs: rng.pick([10, 12, 16]), strings: rng.int(36, 44), spin: rng.sign(),
    causScale: rng.range(0.19, 0.24), tilt: rng.range(0.26, 0.34), rhombus: rng.range(0.25, 0.6), seed: rng.range(1, 50),
  };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const lesserOn = opts.lesser !== false;
  const U = {
    uTime: { value: 0 }, uCamL: { value: new THREE.Vector3(0, 9, -200) }, uPix: { value: 0.0026 },
    uFlame: { value: new THREE.Vector4() }, uLit: { value: new THREE.Vector4(1, 1, 1, 1) },
    uWinTop: { value: new THREE.Vector3() }, uWinBot: { value: new THREE.Vector3() }, uWinGain: { value: new THREE.Vector2(1, 1) }, uStain: { value: 0 },
    uCausCol: { value: new THREE.Vector3() }, uPortalCol: { value: new THREE.Vector3() },
    uBurstPos: { value: [new THREE.Vector3(80, 30, 0), new THREE.Vector3(-80, 30, 0)] }, uBurstCol: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uBody: { value: new THREE.Vector3() }, uSpark: { value: new THREE.Vector3() },
    uCh: { value: [new THREE.Vector4(0, WATER_Y, 0, GREAT), new THREE.Vector4(0, LESSER_Y, DOME_Z[0], LESSER), new THREE.Vector4(0, LESSER_Y, DOME_Z[4], LESSER)] },
    uVar: { value: new THREE.Vector4(variant.seed, variant.causScale, variant.tilt, variant.rhombus) }, uIgnite: { value: 1e4 },
    uAmb: { value: new THREE.Vector3() }, uWinFill: { value: new THREE.Vector3() }, uStucco: { value: new THREE.Vector3(0.8, 0.63, 0.36) },
    uInlay: { value: V3(new THREE.Color(pal[3]).multiplyScalar(0.55).toArray()) },
    uBeamDir: { value: [new THREE.Vector3(-1, 0.5, 0), new THREE.Vector3(1, 0.5, 0)] }, uBeamCol: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uGain: { value: new THREE.Vector3(0.42, 0.5, 0.3) }, uSpin: { value: new THREE.Vector3() },
    uDeep: { value: new THREE.Vector3() }, uDropGain: { value: 4 }, uHalo: { value: 0.16 },
    uGlit: { value: new THREE.Vector4(0.022, 0.26, 1, 1.3) }, uGhost: { value: new THREE.Vector3() }, uDropLit: { value: 0.12 }, uDropSide: { value: 0 },
    uRoomLo: { value: new THREE.Vector3() }, uRoomHi: { value: new THREE.Vector3() }, uJewel: { value: new THREE.Vector3(1, 1, 1) },
    uLamp: { value: new THREE.Vector4(0, 0, 0, 34) }, uFacetPx: { value: 6 },
  };
  let lookName = 'dusk';
  const setLook = (look) => {
    const L = typeof look === 'string' ? (looks[look] || looks.dusk) : { ...looks[lookName], ...look };
    if (typeof look === 'string' && looks[look]) lookName = look;
    U.uFlame.value.fromArray(L.flame); U.uLit.value.fromArray(L.lit); if (!lesserOn) U.uLit.value.w = 0;
    U.uWinTop.value.fromArray(L.winTop); U.uWinBot.value.fromArray(L.winBot); U.uWinGain.value.fromArray(L.winGain); U.uStain.value = L.stain;
    U.uWinFill.value.fromArray(L.winFill); U.uAmb.value.fromArray(L.amb);
    for (let i = 0; i < 2; i++) { U.uBeamDir.value[i].fromArray(L.beamDir[i]).normalize(); U.uBeamCol.value[i].fromArray(L.beamCol[i]); }
    U.uCausCol.value.fromArray(L.caus); U.uGain.value.fromArray(L.gain); U.uBody.value.fromArray(L.body); U.uSpark.value.fromArray(L.spark);
    U.uDeep.value.fromArray(L.deep); U.uDropGain.value = L.dropGain; U.uHalo.value = L.halo; U.uPortalCol.value.fromArray(L.portal);
    U.uGlit.value.fromArray(L.glit); U.uGhost.value.fromArray(L.ghost); U.uDropLit.value = L.dropLit; U.uDropSide.value = L.dropSide || 0;
    U.uRoomLo.value.fromArray(L.roomLo); U.uRoomHi.value.fromArray(L.roomHi); U.uJewel.value.fromArray(L.jewel); U.uLamp.value.fromArray(L.lamp);
  };
  setLook(opts.look || 'dusk');

  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const hallMat = (defines, mirror, extra) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uMirror: { value: mirror } }, defines,
    vertexShader: HALL_VERT, fragmentShader: HALL_FRAG, fog: true, side: THREE.DoubleSide, ...extra });
  const object = new THREE.Group(); object.name = 'million-mirrors-hero';
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order || 0; object.add(m); return m; };

  // the hall
  const sb = makeBuf(72000, 260000);
  await buildShell(sb, rng, { N: variant.N, halveAt: variant.halveAt, sizes: variant.sizes, floor: opts.floor !== false, tick });
  await tick();
  const lite = ctx.quality && ctx.quality.level === 'low' ? { MM_LITE: 1 } : {};
  const hall = hallMat({ ...lite }, 0);
  add(await bufGeometryInSteps(sb, tick), hall, 0);
  await tick();
  // the pool: a dark tiled floor that never hides what is drawn beneath it (the built reflections), then the water over both
  const pf = makeBuf(64, 128); poly(pf, POOL_OUTLINE, null, POOL_FLOOR_Y, { kind: 5, col: [0.03, 0.09, 0.085] });
  add(bufGeometry(pf), hallMat({}, 0, { depthWrite: false }), -0.5);
  const wb = makeBuf(64, 128); poly(wb, POOL_OUTLINE, null, WATER_Y, { kind: 0 });
  const water = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide });
  const waterMesh = add(bufGeometry(wb), water, 1);
  await tick();

  // chandeliers: frame (one mesh), its reflection (the great one's bell only), crystal, flames
  const fb = makeBuf(30000, 110000), inst = { flames: [], drops: [], lowerEnd: 0 };
  const thin = () => thinRng() < 0.5 + 0.5 * detail;
  const crownY = DOME_Y + DOME_H * Math.sin(PHI_MAX) - 2.2;
  await buildChandelier(fb, rng, 0, [0, WATER_Y, 0], GREAT, crownY, { candles: [120, 80, 40], ribs: variant.ribs, strings: variant.strings, thin, tick }, inst);
  const greatEnd = inst.lowerEnd;
  await tick();
  if (lesserOn) for (let i = 1; i <= 2; i++) {
    await buildChandelier(fb, rng, i, [0, LESSER_Y, i === 1 ? DOME_Z[0] : DOME_Z[4]], LESSER, crownY, { candles: [44, 30, 16], ribs: 10, strings: variant.strings, thin, tick }, inst);
    await tick();
  }
  await tick();
  const frameGeo = bufGeometry(fb), frame = hallMat({ MM_FRAME: 1 }, 0);
  add(frameGeo, frame, 0);
  await tick();
  const reflGeo = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'aUv', 'aEdge', 'aMat', 'aCol']) reflGeo.setAttribute(k, frameGeo.getAttribute(k));
  reflGeo.setIndex(frameGeo.getIndex()); reflGeo.setDrawRange(0, greatEnd);
  add(reflGeo, hallMat({ MM_FRAME: 1 }, 1, { transparent: true }), 2);
  const sprite = (vs, fs) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: vs, fragmentShader: fs, fog: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const drops = sprite(DROP_VERT, DROP_FRAG), flames = sprite(FLAME_VERT, FLAME_FRAG);
  await tick();
  add(spriteGeometry(inst.drops, -0.5, (i) => inst.drops[i * 8 + 3] < 0.5), drops, 3);
  await tick();
  add(spriteGeometry(inst.flames, 0.5, (i) => inst.flames[i * 8 + 7] < 1.5), flames, 4);

  // ---- anchors
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    offset: v(0, 0, 150),
    portalSeat: { position: v(0, 12, 180), normal: v(0, 0, -1), radius: 7 },
    doors: { hingeL: v(-9, 0, -150), hingeR: v(9, 0, -150), width: 9, height: 26, z: -150 },
    entry: v(0, 9, -150),
    flyThrough: [[0, 9, -212], [0, 9, -190], [0, 9, -168], [0, 8.6, -150], [-0.3, 6.6, -136], [-1.8, 5.6, -124], [-3.8, 5.3, -113],
      [-5.3, 7.2, -102], [-8.2, 10.6, -92.5], [-11, 14.5, -84], [-13, 19, -76.5], [-14.6, 22.8, -69], [-15.4, 24.6, -61], [-14.6, 24.8, -52], [-11.5, 23.6, -42.5],
      [-7.5, 21.4, -33.5], [-6, 20.5, -25], [-12, 23, -17], [-19, 27, -8], [-20.6, 30, 3], [-15.6, 32, 14.6], [0, 33, 20.2], [14, 30.5, 15.6], [21, 25.5, 8], [25, 19.5, 0.5], [27, 13.6, -7],
      [26, 10.2, -13.5], [20.5, 8.2, -24], [11, 6, -38.5], [0, 3.6, -45], [-13.5, 3.7, -39.5], [-22.5, 5, -24], [-25.5, 6.5, -4], [-22, 5.6, 16], [-14, 5, 36], [-5, 4.6, 54],
      [0, 4.8, 72], [0, 7.5, 94], [0, 10.6, 112], [0, 12, 130], [0, 12, 180]].map((q) => v(q[0], q[1], q[2])),
    orbit: { center: v(0, 5, 0), radius: 25, yTop: 25.5, yLow: 3.6 },
    globe: { center: v(0, WATER_Y, 0), radius: 10.25 * GREAT, height: 11.3 * GREAT, scale: GREAT },
    chandelier: { center: v(0, 5 * GREAT, 0), top: v(0, WATER_Y + 13.8 * GREAT, 0), collar: v(0, WATER_Y + 14.2 * GREAT, 0), collarRadius: 1.5, chainTop: v(0, crownY, 0) },
    collar: v(0, WATER_Y + 14.2 * GREAT + 0.4, 0), perchY: WATER_Y + 14.2 * GREAT + 0.52,
    cornice: [-90, -30, 30, 90].flatMap((z) => [v(-28.6, 16.6, z), v(28.6, 16.6, z)]),
    lesser: lesserOn ? [v(0, LESSER_Y, DOME_Z[0]), v(0, LESSER_Y, DOME_Z[4])] : [],
    domes: DOME_Z.map((z) => ({ center: v(0, DOME_Y, z), rim: DOME_R, crownY: DOME_Y + DOME_H })),
    closePass: v(16, 44, -55),
    windows: DOME_Z.flatMap((z) => [-1, 1].map((sx) => ({ position: v(sx * WALL_X, WIN_SILL, z), normal: v(-sx, 0, 0), width: WIN_HALF * 2, sill: WIN_SILL, spring: WIN_SPRING, apex: WIN_APEX, depth: 1.6 }))),
    pool: { waterY: WATER_Y, floorY: POOL_FLOOR_Y, halfWidth: 11, zMin: -126, zMax: 126, basin: 25, outline: POOL_OUTLINE.map((p) => [p[0], p[1]]), rimHeight: 0.38, rimWidth: 1.25, koiY: -1.1, koiRadius: [8, 19] },
    niche: { z0: NICHE_Z0, zCenter: NICHE_ZC, radius: NICHE_R, archHalfWidth: 10, archApex: 29 },
    viewpoints: {
      doors: { position: v(0, 9, -142), target: v(0, 8, 0) }, closePass: { position: v(16, 44, -55), target: v(0, 5, 0) },
      above: { position: v(0, 38, 22), target: v(0, 6, 0) }, waterline: { position: v(0, 3.6, -45), target: v(0, WATER_Y, 0) }, apse: { position: v(0, 12, 110), target: v(0, 12, 180) },
    },
    extent: { min: v(-36.6, POOL_FLOOR_Y, -150), max: v(36.6, 63, 184) },
  };

  const inv = new THREE.Matrix4(), buf2 = new THREE.Vector2();
  const hero = {
    object, radius: 13, height: 24, center: v(0, 8, 0), anchors, ground: false, groundY: 0,
    uniforms: U, materials: { hall, frame, water, drops, flames }, waterMesh, variant, looks,
    // the hall's own shader for the world's props: geometry needs position, normal, aUv (m), aEdge, aMat (kind, size, ao, w), aCol
    makeMaterial(defines = {}, extra = {}) { return hallMat({ ...lite, ...defines }, 0, extra); },
    setLook,
    setProgress(u) { const f = Math.min(1, Math.max(0, (u - 0.03) / 0.09)); U.uIgnite.value = u >= 0.12 ? 1e4 : lerp(-170, 260, f * f * (3 - 2 * f)); },
    setBurst(i, position, colour, strength = 1) { const k = i ? 1 : 0; if (position) U.uBurstPos.value[k].copy(position);
      const c = new THREE.Color(colour || '#ffffff'); U.uBurstCol.value[k].set(c.r * strength, c.g * strength, c.b * strength); },
    setPortalColor(hex, strength = 2.5) { const c = new THREE.Color(hex); U.uPortalCol.value.set(c.r * strength, c.g * strength, c.b * strength); },
    update(dt, time, camera) {
      U.uTime.value = time;
      object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
      U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(buf2); U.uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * Math.max(buf2.y, 1));
        U.uFacetPx.value = Math.max(2.3, 0.0135 * buf2.y); }
      U.uSpin.value.set(variant.spin * time * TAU / 90, -variant.spin * time * TAU / 140 + 1, variant.spin * time * TAU / 120 + 2);
    },
    dispose() {},
  };
  return hero;
}
