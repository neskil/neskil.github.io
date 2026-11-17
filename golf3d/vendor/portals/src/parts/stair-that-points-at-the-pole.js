// HERO SET PIECE for "stair-that-points-at-the-pole" (after Jai Singh II): the great gnomon working.
// WHAT IT IS  A set-square wall 28 m thick lying in the meridian, toe at the origin, its marble-capped parapet edge
//   rising at 27 degrees to the north (+Z) with a stair of 165 steps (1.5 m risers) between the parapets, a pointed arch through it
//   at z 392, a platform and a four-pillar domed kiosk at the top holding the hour-ruled dial ring (the portal seat),
//   and two marble quadrants of 150 m radius springing from its flanks on leaning fin walls pierced by three arches.
//   It is NOT centred on its base: it is built in the brief's own yard coordinates (+Z north, +X east, floor y = 0)
//   and must be added at the origin, unrotated and unscaled, because every shadow is worked out analytically in
//   world space by the one masonry shader.
//
// EXPORTS (the style: shade the whole world with these)
//   G                   the yard's measurements (latitude, wall, stair, quadrant, kiosk numbers) used by the shader.
//   sunTimeAt(u)        hours of the day for path progress u (8:30, 9:20, 11:28, 12:00, 13:30; monotone).
//   sunDirAt(hours)     unit vector to the sun (winter solstice, latitude 27) as THREE.Vector3.
//   makeStyle(opts)     -> { uniforms, setProgress(u), setSun(hours), setTime(t) } one shared uniform block.
//   STYLE_GLSL          fragment chunk: hashes, sunVis() (the analytic shadows), yardLight() (sun term + shade term +
//                       low haze), tick() and scale() (the lead-filled ruled scale), and the albedo of each material.
//                       Round "true 1": miniVis() lets the sun through the true arch of each small gnomon (G.miniArch is the one
//                       measure of that opening for geometry and shadow), and copingSlab() gives the parapet coping its own shadow
//                       edge coming down the flank near noon. Nothing is painted dark: MAT.DARK is no longer used by the world.
//   masonryMaterial(style)   the ONE ShaderMaterial for everything built (needs attributes aInfo, uv2; see Builder).
//   creatureMaterial(style, opts)  same light for instanced creatures and leaves (flat pigment, takes the shadows).
//   Builder             small mesh builder that writes position/normal/uv2/aInfo the way the material wants them.
//   MAT, SELF           material ids and shadow-caster ids for aInfo.
//   archH(t)            the pointed-arch profile shared by geometry and shadow.
//   toScene(colour)     exact colour under the tone map: the scene value that is SHOWN as that colour (pigments only).
//   shadowArc(u), scalePoint(sd, s, ax, lift), quadPoint(sd, a, bb, ax)   where the shadow edge and the scale are.
//   buildHero(ctx, opts) -> { object, radius 300, height 290, center, anchors, style, setProgress(u), update, ... }
//
// HOW THE STYLE IS MADE  Tone map ON (post: exposure 1, bloom <= 0.1, saturation 1, contrast 1). Every fragment gets a
//   pigment (MAT id, per vertex), then yardLight(): ONE sun term and ONE shade term chosen by sunVis(), which casts a
//   ray to the sun and tests it exactly against the gnomon (three convex prisms, with the tunnel let through), both
//   quadrant bands (ray/cylinder) and fin walls (four slices of a 2D shape with its arches), the kiosk, the bowl rim and
//   crosswire, and eight creature shadows (uBirds: a round blob for a perched bird, body and spread wings for a flying one, birdVis). The penumbra is uSoft (0.003) times the caster's distance. Shade is
//   the surface mixed toward the named blue, bluer on what faces the sky. The MARK is the tick: scaleLead() rules a
//   strip from aArc = (s metres along, w metres from the root line) in four fwidth-filtered levels (hour 39.27 m, five
//   minutes, minute 0.6545 m, two seconds 2.2 cm), each replaced by its flat average tint under 6 px a pitch; the
//   finest also fades when uTickRate passes 20 a second. The quadrant bands have their own bolder ruling (MAT.BAND,
//   bandLead(): hour lines right across the band, a 1 m red sandstone margin outside the root line at ax -10 / +10, a
//   grey ribbon from across the yard); the dial ring is ruled in 24 bold hour bars (MAT.SCALE with drip -2); the dome is
//   MAT.DOME (painted grooves between its ribs); lead keeps its dark in shade (gLead). Plaster patches, trowel waves, rain streaks (aInfo.w), putlog
//   holes, slab and block joints are two hashes of world position. No textures, no lights, no shadow map, no fog (a low
//   dust haze by distance and height only, uHaze). THE MEDIUM MOVES: the sun is a function of u (setProgress), so every
//   shadow edge creeps; night or eclipse = uSunI and uSunCol on the same shader.
//
//   THE HAND (fix 1): every albedo function also leaves gTone, the factor by which the mason made this fragment lighter or
//   darker than its plain pigment (the float's blotches and lifts, two generations of squarish patches with wandering
//   edges, rain streaks under ledges and under each putlog hole, slab-to-slab whites, per-step washes); yardLight applies
//   it again to the shade term, so plaster and marble show their making inside the lilac shade as well as in sun. A jamb
//   quad may carry aArc = (100 + half width, metres from its middle): its two arrises are then rubbed pale and soft.
//   The foot of a shaded wall takes an ochre glow where the floor before it is sunlit (gBounce); soffits take the ochre
//   thrown up from below. Stair: treads are limewashed masonry (treadAlb: patches, blots, a worn pale path; nothing runs
//   lengthwise), and the red nosing melts by its size on screen (uPxK = metres per pixel per metre of distance, set by
//   the world from the lens and buffer), the same on tread, riser and nosing, so the far stair is one even tint.
//   uEcl (0..1) is the eclipse: lit pigment sinks to the slate of the shade instead of to brown.
// OPTS  palette (7 hex, brief order), detail 0.6..1 (band segments, leaves), colourway 'jaipur' | 'delhi' (else seeded,
//   25% delhi), haze 0..1 (else seeded), floor (default true: a 1100 m yard disc; pass false and lay your own MAT.FLOOR
//   ground with the bowl in it), style (share a makeStyle() block). Viewer-only debug query: stairU, stairR, stairC, stairCW.
// ANCHORS (yard coordinates = local)  portalSeat { position (0, 259.4, 515), facing = -pole, axis, radius 7, tilt 27 deg }:
//   the 14 m portal disc inside the dial ring (inner radius 7.7), square to the stair; flyThrough: the climb, 5 m above
//   the treads, 9 m clear each side, ending in the dial; dive: 3.5 m off the west band along ax -5.6 (plumb over the
//   middle of its south ruled strip) from 8 o'clock to 11:45; squirrel { position, normal, downScale } on the eleven
//   o'clock mark at ax -6.3; greatArch (18 x 22 m) and finArchEast (22 x 37 m,
//   leaning) centre lines; quadrantEndWest/East (the free ends in mid air); entry; reveal; pole; bowl; seedlings.
// PROGRESS  hero.setProgress(u) every frame (sun time from u; never clock time). Left alone (the viewer) the morning loops.
// COST  about 23k triangles, 3 draw calls (masonry, floor, leaves), 2 programs, build under 100 ms in steps under 30 ms.
// THE FAMILY (polish round)  G.MINI (small gnomons), G.RAM (the paired slotted cylinders) and G.BOWL2 (the second bowl) are
//   measurements only: the world builds them into its yard mesh, and sunVis() casts their shadows (familyVis, ramVis) and
//   lights the second bowl (bowlAt). Sun or shade with a narrow terminator; soffits and wall feet glow in the shade's own colour.
// EXPECTS  a blue winter sky, the yard floor at y = 0 shaded with MAT.FLOOR, nothing within the camera lines above.
import * as THREE from 'three';

const RAD = Math.PI / 180;
const PHI = 27 * RAD, SP = Math.sin(PHI), CP = Math.cos(PHI), TP = Math.tan(PHI);
export const G = {
  PHI, SP, CP, TP,
  HW: 14,            // half thickness of the wall (x)
  SW: 9,             // half width of the stair (x)
  PH: 8,             // parapet height above the stair (vertical)
  ZTOP: 500,         // z where stair and parapets end at the platform
  ZEND: 530,         // north cliff
  ARCH: { z: 392, w: 9, s: 6.4, h: 22 },                 // great arch through the wall (tunnel along x)
  QC: { y: 287 * TP, z: 287 }, QR: 150, QW: 11,          // quadrant centre (x = +-HW), radius, half width
  FINT: 4,           // fin wall half thickness (along the pole)
  FINA: 159,         // fin wall outer end (in-plane distance from the flank)
  FARCH: [[66, 9, 5, 15], [101, 11, 12, 37], [134, 11, 24, 72]], // fin arches: centre a, half width, spring, apex (in-plane heights above the floor line)
  KZ: 515,           // kiosk centre z
  KPX: 11, KPZ: 12, KPR: 1.25,  // pillar offsets and radius
  SLABH: 13.5, DRUM: 4.2, DOMEK: 1.22,   // half width of the kiosk's roof slab, height of the drum, how stilted the dome is
  DOMER: 15,
  BOWL: { x: 110, z: 60, r: 40 },
};
G.PLAT = G.ZTOP * TP - G.PH;           // platform level
G.FING = G.QC.y / CP;                  // in-plane distance from quadrant centre down to the floor line
G.SLABY = G.PLAT + 31;                 // underside of the kiosk slab (the four pillars stand 31 m: the brief fixes only the dome, 30 m across)
G.DOMEY = G.SLABY + 1.4 + G.DRUM;     // where the dome springs
G.DOMETOP = G.DOMEY + G.DOMER * G.DOMEK * Math.sin(1.5) + 4.2;   // tip of the finial
G.DIAL = new THREE.Vector3(0, G.KZ * TP - 3, G.KZ);  // dial centre: on the camera's line 5 m above the treads
// THE FAMILY (polish round): the further instruments of the yard, in the forenoon yard's coordinates. The world builds
// them; sunVis() casts their shadows. MINI: small set-square gnomons [centre x, toe z, length, half thickness], every
// one aimed at the pole like the great one. RAM: the paired cylinders of slotted wall [centre x, centre z, radius,
// height], twelve piers and twelve gaps each. BOWL2: the second sunk bowl of the pair (no slot).
G.MINI = [[-300, 330, 170, 6.5], [-70, 30, 92, 4.2], [330, 130, 118, 5], [-380, 262, 84, 4], [-110, -205, 84, 4], [-10, -222, 110, 4.8], [118, -200, 92, 4.2], [182, -190, 100, 4.5], [318, -84, 132, 5.5], [236, 560, 170, 6.5]];
// the outer ring (outside round): great instruments out toward the yard wall, a horizon of set squares and white arcs
G.FAR = [[-560, 560, 300, 10], [-250, 820, 240, 8], [470, 620, 340, 11], [160, 900, 250, 9], [-690, 40, 320, 10.5], [-520, -340, 240, 8],
  [-250, -650, 260, 9], [130, -720, 300, 10], [470, -540, 280, 9.5], [650, 140, 320, 10.5], [610, -210, 220, 8]];
G.NEAR = [[182, 262, 46, 2.4], [128, 222, 34, 2], [205, 196, 40, 2.2]];   // three small ones beside the leg along the sunlit wall
G.MINI = G.MINI.concat(G.NEAR, G.FAR);
G.miniArch = (z0, len) => [z0 + 0.72 * len, 0.045 * len, 0.05 * len, 0.15 * len];   // the plain pointed arch that truly pierces each small gnomon: [centre z, half width, spring, apex]
G.RAM = [[120, 440, 46, 32], [238, 470, 46, 32]];
G.COMPASS = [[155, 60, 104, 6, 236], [-150, 610, 76, 5, 150], [96, 624, 58, 5, 118]];   // [centre x, centre z, inner radius, band width, reach of the rays]   // the azimuth circle let into the floor round the paired bowls: a ruled marble ring and eight marble rays
G.RAMP = 0.3;      // a pier takes this much of its pitch either side of its middle (the rest is the gap)
G.BOWL2 = { x: 200, z: 60, r: 40 };
// (round "adds 1") THE FLANK QUADRANTS as casters: [centre z, centre y, radius, dir] of the four ruled arcs each flank of the great wall carries.
// A COPY of the text of the world's own row (its buildFamily: `[[92, 40, 33, 1], [156, 40, 33, -1], [196, 72, 52, 1], [288, 72, 52, -1]]`), which builds them
// and cannot be changed to read this one. The world's other numbers for them are written where flankVis uses them: a plate is 6 m wide (R - 3 to R + 3)
// and stands 0.3 m off the plaster; a peg is 1 m square (0.5 either way) and 3.2 m long.
G.FLANKQ = [[92, 40, 33, 1], [156, 40, 33, -1], [196, 72, 52, 1], [288, 72, 52, -1]];

// pointed (ogival) arch: height fraction above the springing at t = |x|/w, 1 at the crown, 0 at the jamb
export const archH = (t) => Math.sqrt(Math.max(0, 4 - (1 + Math.min(1, Math.abs(t))) ** 2)) / Math.sqrt(3);

// ---- the sun: a function of u only -------------------------------------------------------------------------
const SUN_U = [0, 0.185, 0.27, 0.54, 1], SUN_H = [8.5, 9 + 20 / 60, 11 + 28 / 60, 12, 13.5];
const SUN_M = (() => { // Fritsch-Carlson monotone tangents
  const n = SUN_U.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((SUN_H[i + 1] - SUN_H[i]) / (SUN_U[i + 1] - SUN_U[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  return m;
})();
export function sunTimeAt(u) {
  u = Math.min(1, Math.max(0, u));
  let i = 0; while (i < SUN_U.length - 2 && u > SUN_U[i + 1]) i++;
  const h = SUN_U[i + 1] - SUN_U[i], t = (u - SUN_U[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * SUN_H[i] + (t3 - 2 * t2 + t) * h * SUN_M[i] + (-2 * t3 + 3 * t2) * SUN_H[i + 1] + (t3 - t2) * h * SUN_M[i + 1];
}
const DECL = -23.44 * RAD;
export function sunDirAt(hours, out = new THREE.Vector3()) {
  const H = (hours - 12) * 15 * RAD, cd = Math.cos(DECL), sd = Math.sin(DECL);
  return out.set(-cd * Math.sin(H), sd * SP + cd * Math.cos(H) * CP, sd * CP - cd * Math.cos(H) * SP).normalize();
}

export const MAT = { PLASTER: 0, STONE: 1, SCALE: 2, FLOOR: 3, MARBLE: 4, LEAD: 5, DARK: 6, NOSING: 7, BOWL: 8, TREAD: 9, BAND: 10, DOME: 11 };
export const SELF = { NONE: 0, BODY: 1, PARW: 2, PARE: 3, PLAT: 4, TUNNEL: 5, FINW: 6, FINE: 7 };

const DEFAULT_PALETTE = ['#E0B45A', '#9E4A32', '#F5F2EA', '#5B5F8C', '#5E9BD1', '#6B6E73', '#7DAA3C'];

// EXACT COLOUR under the engine's tone map (scene * exposure / 0.6 -> ACES -> sRGB): toScene(colour) returns the
// scene-linear value that is SHOWN as that colour at exposure 1. Pigments are passed through it once, at build, so a
// wall square-ish to the sun shows the ochre hex and shade keeps its named blue. (Our own copy; nothing imported.)
const acesFit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
function shown(c) {
  const r = c[0] / 0.6, g = c[1] / 0.6, b = c[2] / 0.6;
  const x = acesFit(0.59719 * r + 0.35458 * g + 0.04823 * b), y = acesFit(0.07600 * r + 0.90834 * g + 0.01566 * b), z = acesFit(0.02840 * r + 0.13383 * g + 0.83777 * b);
  return [1.60475 * x - 0.53108 * y - 0.07367 * z, -0.10208 * x + 1.10813 * y - 0.00605 * z, -0.00327 * x - 0.07276 * y + 1.07602 * z].map((v) => Math.min(1, Math.max(0, v)));
}
export function toScene(col) {
  const t = [col.r, col.g, col.b]; let c = t.slice();
  for (let i = 0; i < 40; i++) { const s = shown(c); c = c.map((v, j) => Math.max(1e-4, v * (0.5 + 0.5 * (t[j] + 0.002) / (s[j] + 0.002)))); }
  return new THREE.Color(c[0], c[1], c[2]);
}

// One shared uniform block. opts: palette, colourway 'jaipur'|'delhi', haze 0..1, seed (number).
export function makeStyle(opts = {}) {
  const pal = (opts.palette || DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const delhi = opts.colourway === 'delhi';
  const uniforms = {
    uSun: { value: sunDirAt(8.5) },
    uSunCol: { value: new THREE.Color(1, 1, 1) },
    uSunI: { value: 1 },                                  // 1 day; lower for eclipse or moon
    uWash: { value: toScene(delhi ? pal[1].clone().lerp(pal[0], 0.14) : pal[0]) },
    uFloorCol: { value: toScene(pal[0].clone().lerp(pal[2], 1 / 3)) },
    uStone: { value: toScene(pal[1]) }, uMarble: { value: pal[2].clone() }, uShade: { value: toScene(pal[3]) },
    uSky: { value: toScene(pal[4]) }, uLead: { value: toScene(pal[5]) }, uGreen: { value: toScene(pal[6]) },
    uWhiteBoost: { value: toScene(pal[2]).clone().multiply(new THREE.Color(1 / pal[2].r, 1 / pal[2].g, 1 / pal[2].b)) }, // marble in sun: just under clipping
    uHazeCol: { value: toScene(pal[2].clone().lerp(pal[0], 0.3)) },
    uHaze: { value: 0.00017 * (1 + 1.6 * (opts.haze || 0)) }, // low dust haze density
    uSoft: { value: 0.003 * (1 + 2 * (opts.haze || 0)) },      // penumbra width per metre of caster distance
    uGain: { value: 1.0 }, uShadeK: { value: 1.0 },
    uTime: { value: 0 }, uU: { value: 0 }, uSeed: { value: (opts.seed ?? 0) % 97 },
    uMx: { value: opts.mirror ? -1 : 1 },
    uTickRate: { value: 0 },                              // ticks of the finest level crossing per second (world sets on the dive)
    uNosing: { value: 1 },
    uEcl: { value: 0 },                                   // the eclipse (0..1): what the thin sun still lights sinks toward the slate of the shade
    uPxK: { value: 0.00278 },                             // metres one pixel covers per metre of distance (the world sets it from the lens and the buffer)                                // contrast of the red step nosings (lower it on the climb if it strobes)
    uBirds: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, -1e4, 0, 0.5)) }, // creature shadows: xyz centre, w = k + radius (k 0 a round blob, 1..16 a flying bird and its heading; see birdVis)
    uFlank: { value: 0 },                                 // (round "adds 1") 1 where the flank quadrants (G.FLANKQ) are built: the world sets it once at build; 0 for the hero alone, which has none
  };
  const style = {
    uniforms, palette: pal, hours: 8.5,
    setSun(hours) {
      style.hours = hours; sunDirAt(hours, uniforms.uSun.value);
      const low = 1 - Math.min(1, Math.max(0, uniforms.uSun.value.y / 0.5)); // warmer when low
      uniforms.uSunCol.value.setRGB(1.0, 0.995 - 0.04 * low, 0.98 - 0.11 * low);
    },
    setProgress(u) { uniforms.uU.value = u; style.setSun(sunTimeAt(u)); },
    setTime(t) { uniforms.uTime.value = t; },
  };
  style.setProgress(0);
  return style;
}

// ---- THE STYLE, part 1: analytic sun shadows (no shadow map) -------------------------------------------------
const f = (x) => Number(x).toFixed(4);
const FA = G.FARCH;
export const STYLE_GLSL = /* glsl */`
uniform vec3 uSun, uSunCol, uWash, uFloorCol, uStone, uMarble, uShade, uSky, uLead, uGreen, uHazeCol;
uniform float uSunI, uHaze, uSoft, uTime, uU, uSeed, uTickRate, uNosing, uPxK, uEcl;
uniform vec4 uBirds[8];
uniform float uFlank;
const float SPc = ${f(SP)}, CPc = ${f(CP)}, TPc = ${f(TP)};
const float HW = ${f(G.HW)}, SW = ${f(G.SW)}, PH = ${f(G.PH)}, ZTOP = ${f(G.ZTOP)}, ZEND = ${f(G.ZEND)}, PLAT = ${f(G.PLAT)};
const float AZ = ${f(G.ARCH.z)}, AW = ${f(G.ARCH.w)}, AS = ${f(G.ARCH.s)}, AH = ${f(G.ARCH.h)};
const float QCY = ${f(G.QC.y)}, QCZ = ${f(G.QC.z)}, QR = ${f(G.QR)}, QW = ${f(G.QW)}, FINT = ${f(G.FINT)}, FINA = ${f(G.FINA)}, FING = ${f(G.FING)};
const float KZ = ${f(G.KZ)}, KPX = ${f(G.KPX)}, KPZ = ${f(G.KPZ)}, KPR = ${f(G.KPR)}, DOMER = ${f(G.DOMER)}, SLABY = ${f(G.SLABY)};
uniform float uMx;   // +1 forenoon yard, -1 the yard mirrored east for west (afternoon)
#define BOWL vec3(uMx * ${f(G.BOWL.x)}, ${f(G.BOWL.z)}, ${f(G.BOWL.r)})
// the bowl a point belongs to: the first (with the slot) or its pair to the east
vec3 bowlAt(float x){ return vec3(uMx * (uMx * x > ${f((G.BOWL.x + G.BOWL2.x) / 2)} ? ${f(G.BOWL2.x)} : ${f(G.BOWL.x)}), ${f(G.BOWL.z)}, ${f(G.BOWL.r)}); }
const vec3 POLE = vec3(0., SPc, CPc);     // the one axis
const vec3 DOWNQ = vec3(0., -CPc, SPc);   // down the quadrant's plane (square to the pole)

float h11(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vnoise(vec2 p){ vec2 i = floor(p), q = fract(p); q = q*q*(3. - 2.*q);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), q.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), q.x), q.y); }

float archH(float t){ t = clamp(abs(t), 0., 1.); return sqrt(max(4. - (1. + t)*(1. + t), 0.)) / 1.7320508; }
// pointed opening standing on the floor: < 0 inside the opening
float sdArch(float x, float h, float w, float s, float H){ return max(abs(x) - w, h - (s + (H - s) * archH(x / w))); }

void cutP(float dist, float dn, inout float tE, inout float tX){
  float sdn = abs(dn) < 1e-6 ? 1e-6 : dn;
  float t = -dist / sdn;
  if (sdn < 0.) tE = max(tE, t); else tX = min(tX, t);
}
// convex prism x0..x1, z0..z1, y >= y0, under the plane dot(nT, p) <= dT. Returns (chord length, distance to entry).
vec2 prism(vec3 o, vec3 s, float x0, float x1, float z0, float z1, float y0, vec3 nT, float dT){
  float tE = 0., tX = 1e5;
  cutP(o.x - x1, s.x, tE, tX); cutP(x0 - o.x, -s.x, tE, tX);
  cutP(o.z - z1, s.z, tE, tX); cutP(z0 - o.z, -s.z, tE, tX);
  cutP(y0 - o.y, -s.y, tE, tX);
  cutP(dot(nT, o) - dT, dot(nT, s), tE, tX);
  return vec2(tX - tE, tE);
}
float pen(vec2 gt, float px){ return 1. - smoothstep(0., max(gt.y * uSoft * 2., px), gt.x); }
// the sandstone coping that oversails a flank of the great wall by 0.35 m, as a caster: a slab between two planes parallel to
// the pole. Near noon, when the sun rakes the flank, its shadow comes down the plaster as one straight edge parallel to the stair.
vec2 copingSlab(vec3 o, vec3 s, float x0, float x1){
  vec3 nT = vec3(0., CPc, -SPc); float tE = 0., tX = 1e5, dn = dot(nT, s), d0 = dot(nT, o);
  cutP(o.x - x1, s.x, tE, tX); cutP(x0 - o.x, -s.x, tE, tX);
  cutP(o.z - ZTOP, s.z, tE, tX); cutP(2.4 - o.z, -s.z, tE, tX);
  cutP(d0, dn, tE, tX); cutP(-1.2 * CPc - d0, -dn, tE, tX);
  return vec2(tX - tE, tE);
}

float tunnelSd(vec3 o, vec3 s, float xf){
  float sx = abs(s.x) < 1e-4 ? 1e-4 : s.x;
  float t = (xf - o.x) / sx; vec3 q = o + s * t;
  return t < 0. ? -1. : sdArch(q.z - AZ, q.y, AW, AS, AH);
}
float finSd(vec2 ab){
  float sd = max(max(QR + 0.6 - length(ab), -ab.x), max(ab.x - FINA, max(-ab.y, ab.y - FING)));
  float h = FING - ab.y;
  sd = max(sd, -sdArch(ab.x - ${f(FA[0][0])}, h, ${f(FA[0][1])}, ${f(FA[0][2])}, ${f(FA[0][3])}));
  sd = max(sd, -sdArch(ab.x - ${f(FA[1][0])}, h, ${f(FA[1][1])}, ${f(FA[1][2])}, ${f(FA[1][3])}));
  sd = max(sd, -sdArch(ab.x - ${f(FA[2][0])}, h, ${f(FA[2][1])}, ${f(FA[2][2])}, ${f(FA[2][3])}));
  return sd;
}
float finVis(vec3 o, vec3 s, float side, float px){
  vec3 q = o - vec3(side * HW, QCY, QCZ);
  float sp = dot(s, POLE); sp = abs(sp) < 1e-4 ? 1e-4 : sp;
  float ax = dot(q, POLE), vis = 1.;
  for (int i = 0; i < 4; i++){
    float t = (FINT * (float(i) / 1.5 - 1.) - ax) / sp;
    vec3 h = q + s * t;
    float w = max(t * uSoft, px);
    float v = smoothstep(-w, w, finSd(vec2(side * h.x, dot(h, DOWNQ))));
    vis = min(vis, t > 0.05 ? v : 1.);
  }
  return vis;
}
float bandHit(float t, vec2 p2, vec2 d2, float ax, float sa, float px){
  vec2 h = p2 + d2 * t; float w = max(t * uSoft, px);
  float sd = max(abs(ax + sa * t) - QW, max(-h.x, -h.y));
  return t < 0.6 ? 1. : smoothstep(-w, w, sd);
}
float bandVis(vec3 o, vec3 s, float side, float px){
  vec3 q = o - vec3(side * HW, QCY, QCZ);
  float ax = dot(q, POLE), sa = dot(s, POLE);
  vec2 p2 = vec2(side * q.x, dot(q, DOWNQ)), d2 = vec2(side * s.x, dot(s, DOWNQ));
  float A = max(dot(d2, d2), 1e-5), B = dot(p2, d2), disc = B * B - A * (dot(p2, p2) - QR * QR);
  float sq = sqrt(max(disc, 0.));
  float v = min(bandHit((-B - sq) / A, p2, d2, ax, sa, px), bandHit((-B + sq) / A, p2, d2, ax, sa, px));
  return disc <= 0. ? 1. : v;
}
float pillarVis(vec3 o, vec3 s, vec2 c, float r, float y0, float y1, float px){
  float t = max(dot(c - o.xz, s.xz) / max(dot(s.xz, s.xz), 1e-5), 0.);
  vec3 h = o + s * t; float w = max(t * uSoft, min(px, t * 0.2)) + 1e-4;
  return smoothstep(-w, w, max(length(h.xz - c) - r, max(y0 - h.y, h.y - y1)));
}
float sphereVis(vec3 o, vec3 s, vec3 c, float r, float px){
  float t = max(dot(c - o, s), 0.); float w = max(t * uSoft, min(px, t * 0.2)) + 1e-4;
  return smoothstep(-w, w, length(o + s * t - c) - r);
}
// a creature's shadow (uBirds: xyz centre, w = k + r). k 0: a round blob of radius r (a perched bird). k 1..16: a flying bird heading
// (k - 1) sixteenths of a turn from north, r its size (0.36 = life): two ellipses, body with tail and spread wings, so that on a tread
// or a slab it reads as a bird's shadow and not as a speck. The creature shader sets gBirdShape 0 and keeps the round blob (a wing
// must not shade itself).
float gBirdShape = 1.;
float birdVis(vec3 o, vec3 s, vec4 b, float px){
  float k = floor(b.w), r = b.w - k;
  if (k < 0.5 || gBirdShape < 0.5) return sphereVis(o, s, b.xyz, r, px);
  float a = (k - 1.) * 0.3926991, sc = r / 0.36; vec2 f = vec2(sin(a), cos(a));
  vec3 d = o - b.xyz;
  vec3 q = vec3(dot(d.xz, f), d.y, d.x * f.y - d.z * f.x), e = vec3(dot(s.xz, f), s.y, s.x * f.y - s.z * f.x);   // into the bird's own frame: along its heading, up, along its wings
  float t0 = max(-dot(d, s), 0.), w = max(t0 * uSoft, min(px, t0 * 0.2)) + 1e-4;
  vec3 R1 = vec3(2.5, 0.42, 0.42) * sc, q1 = (q + vec3(0.8 * sc, 0., 0.)) / R1, e1 = e / R1;
  float d1 = (length(q1 + e1 * max(-dot(q1, e1) / dot(e1, e1), 0.)) - 1.) * 0.42 * sc;
  vec3 R2 = vec3(0.7, 0.3, 2.7) * sc, q2 = q / R2, e2 = e / R2;
  float d2 = (length(q2 + e2 * max(-dot(q2, e2) / dot(e2, e2), 0.)) - 1.) * 0.3 * sc;
  return smoothstep(-w, w, min(d1, d2));
}
// a cylinder of slotted wall (twelve piers): the ray is stopped where it crosses the wall below its top and on a pier
float ramHit(float t, vec3 o, vec3 s, vec2 c, float R, float H, float px){
  vec3 h = o + s * t; float w = max(t * uSoft, px);
  vec2 e = h.xz - c; float a = atan(e.y, abs(e.x) + abs(e.y) < 1e-4 ? 1e-4 : e.x);
  float m = abs(fract(a * 1.9098593 + .5) - .5) * R * 0.5235988;          // metres along the wall from the middle of the nearest pier
  float sd = max(m - ${f(G.RAMP)} * R * 0.5235988, h.y - H);
  return t < 0.6 ? 1. : smoothstep(-w, w, sd);
}
float ramVis(vec3 o, vec3 s, vec2 c, float R, float H, float px){
  vec2 q = o.xz - c; float A = max(dot(s.xz, s.xz), 1e-5), B = dot(q, s.xz), disc = B * B - A * (dot(q, q) - R * R);
  float sq = sqrt(max(disc, 0.));
  float v = min(ramHit((-B - sq) / A, o, s, c, R, H, px), ramHit((-B + sq) / A, o, s, c, R, H, px));
  return disc <= 0. ? 1. : v;
}
// a small gnomon's shadow, with the light that comes through its pierced arch (taken where the ray crosses the wall's middle)
float miniVis(vec3 o, vec3 s, float cx, float hw, float z0, float len, vec4 ar, float px){
  float b = pen(prism(o, s, cx - hw, cx + hw, z0, z0 + len, -1e4, vec3(0., CPc, -SPc), -SPc * z0), px);
  if (b < 1.) { float sx = abs(s.x) < 1e-4 ? 1e-4 : s.x; float t = (cx - o.x) / sx; vec3 q = o + s * t; float w = max(px, max(t, 0.) * uSoft * 2.);
    b = max(b, t < 0. ? 0. : 1. - smoothstep(-w, w, sdArch(q.z - ar.x, q.y, ar.y, ar.z, ar.w) + hw * 0.35)); }
  return b;
}
// the further instruments of the yard: small gnomons (wedges under the same pole plane) and the paired cylinders
float familyVis(vec3 o, vec3 s, float px){
  vec3 nT = vec3(0., CPc, -SPc); float v = 1.;
${G.MINI.map(([cx, z0, len, hw]) => `  v = min(v, miniVis(o, s, uMx * ${f(cx)}, ${f(hw)}, ${f(z0)}, ${f(len)}, vec4(${G.miniArch(z0, len).map(f).join(', ')}), px));`).join('\n')}
${G.RAM.map(([cx, cz, R, H]) => `  v = min(v, ramVis(o, s, vec2(uMx * ${f(cx)}, ${f(cz)}), ${f(R)}, ${f(H)}, px));`).join('\n')}
  return v;
}
// (round "adds 1") THE FLANK QUADRANTS THROW THEIR SHADOWS: the four ruled marble arcs each flank of the great wall carries (G.FLANKQ) and the
// sandstone peg at each arc's centre, as casters. A plate casts as a slab 0.3 m thick lying on the plaster (so its shade starts at the plate's own
// edge), a peg as the box it is. Nothing is sampled: the ray's whole track through the slab is tested at once, so a raking sun leaves no stripes.
// flankPlate: e0, ed = the ray's track in the arc's plane, e = ((z - zc) * dir, yc - y); t1 = the ray's length inside the slab; lt = the track's
// length for one unit of t. The plate is the quarter (e.x and e.y not negative) of the ring R - 3 .. R + 3. Returns 1 lit, 0 shade.
float flankPlate(vec2 e0, vec2 ed, float t1, float lt, float R, float px){
  float ta = 0., tb = t1;
  cutP(-e0.x, -ed.x, ta, tb); cutP(-e0.y, -ed.y, ta, tb);          // the track clipped to the quarter the plate fills
  float sd = (ta - tb) * lt;                                      // above nought: the track misses the quarter by that many metres
  if (ta <= tb) {
    float tp = clamp(-dot(e0, ed) / max(dot(ed, ed), 1e-8), ta, tb);   // the foot of the perpendicular from the arc's centre, kept on the track
    float least = length(e0 + ed * tp), most = max(length(e0 + ed * ta), length(e0 + ed * tb));
    sd = max(sd, max(least - (R + 3.), (R - 3.) - most));
  } else {   // a near miss of the quarter is a near miss of the plate only where the ring is: the ring's own measure at the place of the miss
    float rr = length(e0 + ed * clamp(0.5 * (ta + tb), 0., t1));
    sd = max(sd, max(rr - (R + 3.), (R - 3.) - rr));
  }
  float w = max(t1 * uSoft, px);
  return smoothstep(-w, w, sd);
}
// one arc of a flank: its plate, then its peg (the box ox 0 .. 3.2, y within 0.5 of yc, z within 0.5 of zc; six cuts, as copingSlab)
float flankRow(vec3 o, vec3 s, float ox, float sx, float zc, float yc, float R, float dir, float px){
  float v = 1., t1 = (0.3 - ox) / sx;
  if (t1 > 0.) v = flankPlate(vec2((o.z - zc) * dir, yc - o.y), vec2(s.z * dir, -s.y), t1, length(s.yz), R, px);
  float tE = 0., tX = 1e5;
  cutP(ox - 3.2, sx, tE, tX); cutP(-ox, -sx, tE, tX);
  cutP(o.y - yc - 0.5, s.y, tE, tX); cutP(yc - 0.5 - o.y, -s.y, tE, tX);
  cutP(o.z - zc - 0.5, s.z, tE, tX); cutP(zc - 0.5 - o.z, -s.z, tE, tX);
  return min(v, pen(vec2(tX - tE, tE), px));
}
// side: which flank (both carry the same four, so no uMx); ox: metres out from the plaster; sx: how fast the ray to the sun leaves the flank.
// From inside the wall, from beyond the pegs' reach (3.2 m: with sx above nought the ray only goes further out) or with the sun not on this
// flank's side there is nothing to meet.
float flankVis(vec3 o, vec3 s, float px){
  float side = o.x < 0. ? -1. : 1., ox = side * o.x - HW, sx = side * s.x;
  if (ox < 0. || ox > 3.2 || sx <= 1e-4) return 1.;
  float v = 1.;
${G.FLANKQ.map(([zc, yc, R, dir]) => `  v = min(v, flankRow(o, s, ox, sx, ${f(zc)}, ${f(yc)}, ${f(R)}, ${f(dir)}, px));`).join('\n')}
  return v;
}
// fraction of the sun's disc seen from P (1 lit, 0 shade). self = SELF id of the convex piece the fragment is on.
float sunVis(vec3 P, vec3 N, float self, float px){
  vec3 s = uSun; vec3 o = P + N * 0.04;
  vec3 nT = vec3(0., CPc, -SPc);
  float v = smoothstep(0., 0.02, s.y);
  if (abs(self - 5.) < .5) {
    v = min(v, 1. - smoothstep(-px, px, tunnelSd(o, s, s.x > 0. ? HW : -HW)));
  } else if (abs(self - 1.) > .5) {
    float b = pen(prism(o, s, -HW, HW, 0., ZTOP, -1e4, nT, -PH * CPc), px);
    if (b < 1.) { float w = max(px, 0.3); b = max(b, 1. - smoothstep(-w, w, max(tunnelSd(o, s, -HW), tunnelSd(o, s, HW)))); }
    v = min(v, b);
  }
  if (abs(self - 2.) > .5) v = min(v, pen(prism(o, s, -HW, -SW, 0., ZTOP, -1e4, nT, 0.), px));
  if (abs(self - 3.) > .5) v = min(v, pen(prism(o, s, SW, HW, 0., ZTOP, -1e4, nT, 0.), px));
  if (abs(self - 2.) > .5 && abs(self - 3.) > .5) v = min(v, min(pen(copingSlab(o, s, -HW - 0.35, -HW), px), pen(copingSlab(o, s, HW, HW + 0.35), px)));
  if (abs(self - 4.) > .5) v = min(v, pen(prism(o, s, -HW, HW, ZTOP, ZEND, -1e4, vec3(0., 1., 0.), PLAT), px));
  if (abs(self - 6.) > .5) v = min(v, finVis(o, s, -1., px));
  if (abs(self - 7.) > .5) v = min(v, finVis(o, s, 1., px));
  v = min(v, min(bandVis(o, s, -1., px), bandVis(o, s, 1., px)));
  // kiosk: four pillars, slab, dome
  v = min(v, min(min(pillarVis(o, s, vec2(-KPX, KZ - KPZ), KPR * 0.85, PLAT, SLABY, px), pillarVis(o, s, vec2(KPX, KZ - KPZ), KPR * 0.85, PLAT, SLABY, px)),
                 min(pillarVis(o, s, vec2(-KPX, KZ + KPZ), KPR * 0.85, PLAT, SLABY, px), pillarVis(o, s, vec2(KPX, KZ + KPZ), KPR * 0.85, PLAT, SLABY, px))));
  v = min(v, pen(prism(o, s, -${f(G.SLABH)}, ${f(G.SLABH)}, KZ - ${f(G.SLABH)}, KZ + ${f(G.SLABH)}, SLABY, vec3(0., 1., 0.), SLABY + 1.4), px));
  v = min(v, sphereVis(o, s, vec3(0., ${f(G.DOMEY + 1)}, KZ), DOMER - 0.15, px));
  for (int i = 0; i < 8; i++) v = min(v, birdVis(o, s, uBirds[i], px));
  if (P.y < 170.) v = min(v, familyVis(o, s, px));
  if (uFlank > 0.5) v = min(v, flankVis(o, s, px));
  // the bowl: inside it the sun must come in through the rim, past the crosswire and its ring
  if (P.y < -0.02 && s.y > 1e-3) {
    float t = -o.y / s.y; vec3 h = o + s * t; float w = max(t * uSoft, px);
    vec3 BW = bowlAt(P.x); float first = step(abs(BW.x - BOWL.x), 1.);
    vec2 d = h.xz - BW.xy; float r = length(d);
    float open = min(r - BW.z, mix(1e3, max(abs(d.x) - 7., max(-d.y, d.y - 70.)), first));   // the bowl's mouth and the slot in the first one's north rim
    v = min(v, 1. - smoothstep(-w, w, open));
    float wire = min(min(abs(d.x), abs(d.y)) - 0.22, abs(r - 4.) - 0.7);   // two wires and the ring plate where they cross
    v = min(v, max(smoothstep(-w, w, wire), step(BW.z, r)));
    if (abs(d.x) < 7. && d.y > 0.) v = max(v, 0.);
  }
  return v;
}
`;

// ---- THE STYLE, part 2: the pigments, the tick, the plaster, the one light ------------------------------------
export const SURFACE_GLSL = /* glsl */`
uniform float uGain, uShadeK; uniform vec3 uWhiteBoost;
float gShadeKeep = 0.;
float gTone = 1.;        // THE HAND: how much lighter or darker than its plain pigment the mason left this fragment; yardLight keeps it in shade
float gBounce = 0.;      // warm light thrown up from sunlit ochre (set by the plaster)
float lum3(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
float gLead = 0.;        // lead coverage of the fragment: lead stays dark in shade, so a tick still reads on shaded marble   // creatures set this: how much of their own pigment survives in shade
// one level of the ruled scale. s arc coordinate, k metres per unit of s, fs = fwidth(s). Returns lead coverage 0..1.
float tick(float s, float pitch, float hwm, float len, float w, float fw, float k, float fs, float boost){
  float x = s / pitch, idx = floor(x + .5);
  float d = abs(x - idx) * pitch * k, pxm = max(fs * k, 1e-5);
  float hw = max(hwm, 0.75 * pxm);
  float a = (1. - smoothstep(hw - pxm * .5, hw + pxm * .5, d)) * sqrt(hwm / hw);
  float hsh = h11(idx * 0.731 + pitch + uSeed);
  a *= hsh < 0.045 ? 0.22 : 1.;                                   // a few ticks have lost their lead
  float avg = min(1., boost * 2. * hwm / (pitch * k));            // below 6 px a pitch: the flat average tint
  a = mix(avg, a, smoothstep(3., 6., pitch * k / pxm));
  float L = len * (0.94 + 0.12 * hsh);                           // the hand: lengths vary 6 percent
  return a * (1. - smoothstep(L - fw, L + fw, w)) * step(0., w);
}
float lineAA(float d, float hwm, float pxm){ pxm = max(pxm, 1e-5); float hw = max(hwm, 0.75 * pxm);
  return (1. - smoothstep(hw - pxm * .5, hw + pxm * .5, abs(d))) * sqrt(hwm / hw); }
vec2 faceUV(vec3 P, vec3 N){ return abs(N.x) > 0.7 ? P.zy : (abs(N.y) > 0.75 ? P.xz : P.xy); }

vec2 gArc = vec2(0., -9.);   // the mesh's arc attribute: on a jamb x > 50 marks an arris strip (x - 100 = half width, y = metres from the middle)
float patchBox(vec2 q, vec2 lo, vec2 hi, vec2 e){
  return smoothstep(lo.x - e.x, lo.x + e.x, q.x) * (1. - smoothstep(hi.x - e.x, hi.x + e.x, q.x)) * smoothstep(lo.y - e.y, lo.y + e.y, q.y) * (1. - smoothstep(hi.y - e.y, hi.y + e.y, q.y));
}
// lime plaster as the mason left it: the float's blotches, a trowel wave every metre or so, two generations of squarish
// patches of newer wash, rain streaks under ledges and under every putlog hole, a rubbed pale arris. All of it is one
// factor (gTone) on the pigment, so it survives in shade as well as in sun.
vec3 plasterAlb(vec3 base, vec3 P, vec3 N, float drip, float px){
  float holes = step(-0.5, drip); drip = clamp(drip, 0., 1.);   // drip -1: a shell with no putlog holes (the dome)
  vec2 fc = faceUV(P, N) + uSeed * 7.3;
  float det = 1. - smoothstep(2.5, 11., px), close = 1. - smoothstep(0.15, 0.7, px);
  float vert = 1. - smoothstep(0.3, 0.6, abs(N.y));
  float wave = (vnoise(fc * vec2(0.085, 1.05) + 3.) - .5) * 2.2 * (0.35 + 0.65 * vnoise(fc * 0.09 + 21.));   // the trowel's lifts: long soft bands a metre or so apart, never regular
  float tone = 1. + (vnoise(fc * 0.33) - .5) * 0.16 * det + wave * 0.04 * (0.3 + 0.7 * close) * det + (vnoise(fc * vec2(0.05, 0.6)) - .5) * 0.12 * (0.4 + 0.6 * det)
    + (vnoise(fc * 0.021) - .5) * 0.18 + (vnoise(fc * 0.006 + 9.) - .5) * 0.12;
  { float ly = (fc.y + 1.6 * vnoise(vec2(fc.x * 0.045, 4.4)) + 0.25 * vnoise(vec2(fc.x * 0.6, 8.8))) / 8.4, li = floor(ly), lf = (fract(ly) - .5) * 8.4;
    tone *= 1. + vert * ((h11(li * 3.17 + 0.71) - .5) * 0.11 * (1. - smoothstep(4., 14., px)) - 0.2 * (1. - smoothstep(0.1, 0.1 + px, 4.2 - abs(lf))) * (1. - smoothstep(0.25, 1.4, px))); }
  // squarer patches of newer, brighter wash
  vec2 wob = (vec2(vnoise(fc * 0.55 + 31.), vnoise(fc * 0.55 + 77.)) - .5) * (1. - smoothstep(1., 4., px));
  vec2 g = fc / vec2(29., 17.); g.x += 0.37 * floor(g.y); vec2 id = floor(g), q = fract(g) + wob * 0.03;
  vec2 lo = vec2(0.08 + 0.45 * h21(id + 9.1), 0.1 + 0.4 * h21(id + 5.3)), hi = lo + vec2(0.12 + 0.3 * h21(id + 6.2), 0.16 + 0.3 * h21(id + 1.9));
  float pm = patchBox(q, lo, hi, (0.18 + px * 1.2) / vec2(29., 17.)) * step(0.5, h21(id + 3.7));
  tone = mix(tone, 1.19 + 0.08 * h21(id + 7.7) + 0.4 * (tone - 1.), pm * 0.9);
  // a second, smaller generation: repairs a hand's breadth lighter or darker
  vec2 g2 = fc / vec2(8.5, 6.5) + 5.5; g2.y += 0.43 * floor(g2.x); vec2 id2 = floor(g2), q2 = fract(g2) + wob * 0.1;
  vec2 lo2 = vec2(0.06 + 0.3 * h21(id2 + 2.1), 0.08 + 0.3 * h21(id2 + 8.3)), hi2 = lo2 + vec2(0.3 + 0.3 * h21(id2 + 4.2), 0.3 + 0.3 * h21(id2 + 6.9));
  float h2 = h21(id2 + 13.7);
  float pm2 = patchBox(q2, lo2, hi2, (0.16 + px * 1.2) / vec2(8.5, 6.5)) * step(0.58, h2) * (1. - smoothstep(2., 6., px));
  tone = mix(tone, (h2 > 0.8 ? 0.89 : 1.11) + 0.4 * (tone - 1.), pm2 * 0.85);
  // dark rain streaks under every ledge
  float sx = fc.x * 0.9; float st = smoothstep(0.42, 0.8, vnoise(vec2(sx, 3.3))) * (0.45 + 0.55 * vnoise(vec2(sx * 4.1, fc.y * 0.12)));
  tone *= 1. - 0.6 * st * drip * vert * (0.45 + 0.55 * det);
  tone *= 1. - 0.12 * drip * drip * vert;
  // putlog holes in rows, and the streak that runs down from each
  vec2 ph = fc / vec2(6.4, 10.5); float row = floor(ph.y); ph.x += h11(row + 0.37); vec2 pq = (fract(ph) - .5) * vec2(6.4, 10.5);
  float keep = step(0.3, h11(row * 1.7 + 4.1)) * step(0.22, h21(floor(ph) + 31.)) * vert * step(5., P.y) * holes;
  float hole = (1. - smoothstep(0.27 - px, 0.27 + px, max(abs(pq.x), abs(pq.y)))) * (1. - smoothstep(0.2, 0.6, px)) * keep;
  float run = (1. - smoothstep(0.16, 0.4 + px, abs(pq.x + 0.12 * sin(pq.y * 1.9)))) * step(pq.y, 0.) * (1. - smoothstep(0.3, 4.8, -pq.y));
  tone *= 1. - 0.26 * run * keep * (1. - smoothstep(1.2, 4., px));
  // the arris of a jamb: rubbed pale and rounded, never a crease
  if (gArc.x > 50.) { float d = (gArc.x - 100.) - abs(gArc.y); tone *= 1. + 0.17 * (1. - smoothstep(0.0, 0.38 + 0.2 * vnoise(fc * 0.7) + px, d)); }
  tone *= 0.9 + 0.1 * smoothstep(0., 5., P.y + vnoise(fc * 0.2) * 3.);   // grime at the foot
  tone *= 1. - 0.72 * hole;
  gTone = tone; gBounce = vert * exp(-max(P.y, 0.) / 8.);
  return mix(base * tone, uShade * 0.28, hole * 0.9);
}
vec3 stoneAlb(vec3 P, vec3 N, float px){
  vec2 fc = faceUV(P, N); vec2 g = fc / vec2(2.6, 1.3); g.x += 0.5 * floor(g.y);
  float hb = h21(floor(g) + 11.);
  vec2 q = (fract(g) - .5) * vec2(2.6, 1.3);
  float j = max(lineAA(abs(q.x) - 1.3, 0.02, px), lineAA(abs(q.y) - 0.65, 0.02, px)) * (1. - smoothstep(0.15, 0.5, px));
  return uStone * (0.9 + 0.2 * hb + (vnoise(fc * 3.) - .5) * 0.08 * (1. - smoothstep(0.2, 1., px))) * (1. - 0.3 * j);
}
vec3 marbleAlb(vec2 sc, float px){   // sc in metres: along, across
  vec2 g = sc / vec2(3., 2.5); float hs = h21(floor(g) + 23.);
  vec2 q = (fract(g) - .5) * vec2(3., 2.5);
  float j = max(lineAA(abs(q.x) - 1.5, 0.02, px), lineAA(abs(q.y) - 1.25, 0.02, px)) * (1. - smoothstep(0.15, 0.6, px));
  vec3 c = uMarble * (0.865 + 0.14 * hs) * vec3(1., 1. - 0.018 * h21(floor(g) + 5.), 1. - 0.045 * h21(floor(g) + 8.));   // slabs 3 m long, each a slightly different white (told apart in full sun too: the band is a pavement, not a blank)
  c *= 1. + (vnoise(sc * 1.7) - .5) * 0.03 * (1. - smoothstep(0.3, 1.5, px));
  gTone = 1. + 1.9 * (hs - .5) * 0.105 + (vnoise(sc * 0.23) - .5) * 0.05;       // each slab its own white, and the stone's own cloud, kept in shade
  return mix(c, uLead * 1.25, j * 0.75);
}
float gBold = 1.;
float scaleLead(vec2 uv2, float k, float fs, float fw){
  float s = uv2.x, w = uv2.y, pxm = fs * k;
  float jd = abs(fract(s * k / 3.) - .5) * 3.;                                     // slab joints interrupt the ticks
  float cut = smoothstep(1.5 - 0.05 - pxm, 1.5 - 0.03, jd);
  float L = tick(s, 39.2699, 0.13 * gBold, 6.0, w, fw, k, fs, 1.);                           // hour: right across the strip
  L = max(L, tick(s, 3.27249, 0.045 * gBold, 3.3, w, fw, k, fs, 2.2));                       // every fifth minute, half as long again
  L = max(L, tick(s, 0.654498, 0.02 * gBold, 2.2, w, fw, k, fs, 2.2) * (1. - cut));          // minute
  L = max(L, tick(s, 0.0218166, 0.0035, 0.7, w, fw, k, fs, 1.) * (1. - cut) * (1. - smoothstep(14., 20., uTickRate))); // two seconds
  L = max(L, max(lineAA(w, 0.03, fw), lineAA(w - 5., 0.03, fw)) * step(-0.2, w));     // the two ruled borders of the strip
  return L;
}
// the quadrant band: the scale we dive. Hour lines right across the band, five-minute and minute ticks bold enough to
// read from a hand's height, the finest divisions only close; far off each level melts to its grey ribbon.
float bandLead(vec2 uv2, float k, float fs, float fw){
  float s = uv2.x, w = uv2.y, pxm = fs * k;
  float jd = abs(fract(s * k / 3.) - .5) * 3.;
  float cut = smoothstep(1.5 - 0.05 - pxm, 1.5 - 0.03, jd);
  float L = tick(s, 39.2699, 0.26, 10.4, w, fw, k, fs, 1.);
  L = max(L, 0.8 * tick(s, 9.81748, 0.06, 10.4, w, fw, k, fs, 1.));
  L = max(L, 0.5 * tick(s, 3.27249, 0.045, 10.4, w, fw, k, fs, 1.));
  L = max(L, tick(s, 3.27249, 0.085, 3.4, w, fw, k, fs, 2.3));
  L = max(L, tick(s, 0.654498, 0.042, 2.2, w, fw, k, fs, 2.3) * (1. - cut));
  L = max(L, tick(s, 0.0218166, 0.0045, 0.7, w, fw, k, fs, 1.) * (1. - cut) * (1. - smoothstep(14., 20., uTickRate)));
  L = max(L, max(lineAA(w, 0.05, fw), lineAA(w - 5., 0.04, fw)) * step(-0.2, w));
  // from across the yard the ticks are one soft grey ribbon along each margin
  L = max(L, 0.5 * smoothstep(0.25, 0.9, pxm) * (1. - smoothstep(3.4 - fw - 1e-4, 3.4 + fw + 1e-4, w)) * step(0., w));
  return L;
}
// stair treads and risers: plaster worn pale up the middle, trowel streaks along the climb, damp blots, dark by the
// parapets (nothing across the climb, so nothing strobes)
vec3 treadAlb(vec3 P, vec3 N, float px){
  // limewashed masonry steps: matte ochre, a paler worn path up the middle, squarish patches of brighter wash and damp
  // blots that each span a few steps. Nothing runs lengthwise for more than two steps (that would be wood grain).
  float sl = P.z / CPc;                                              // metres up the slope
  vec2 fc = vec2(P.x, sl) + uSeed * 3.1;
  float nearK = 1. - smoothstep(0.5, 2.5, px), close = 1. - smoothstep(0.06, 0.35, px);
  float wob = (vnoise(vec2(sl * 0.045, 3.)) - .5) * 3.;
  float wear = (1. - smoothstep(1.2, 5.4, abs(P.x + wob))) * (0.75 + 0.5 * vnoise(fc * vec2(0.2, 0.12)));
  float tone = 1. + (vnoise(fc * 0.12) - .5) * 0.15 + (vnoise(fc * 0.5) - .5) * 0.08 * nearK + (vnoise(fc * vec2(2.6, 3.4)) - .5) * 0.06 * close;
  vec2 g = fc / vec2(7.5, 9.9); g.x += 0.41 * floor(g.y); vec2 id = floor(g), q = fract(g);
  vec2 lo = vec2(0.08 + 0.3 * h21(id + 9.1), 0.08 + 0.3 * h21(id + 5.3)), hi = lo + vec2(0.3 + 0.28 * h21(id + 6.2), 0.3 + 0.3 * h21(id + 1.9));
  float pm = patchBox(q, lo, hi, (0.08 + px * 1.2) / vec2(7.5, 9.9)) * step(0.52, h21(id + 3.7));
  tone = mix(tone, 1.13 + 0.05 * h21(id + 7.7), pm * 0.9);
  float blot = smoothstep(0.55, 0.7, vnoise(fc * vec2(0.17, 0.11) + 17.));
  tone *= 1. - 0.19 * blot;
  tone *= 1. + (h11(floor(sl / 3.3041) * 1.37 + uSeed) - .5) * 0.10 * nearK;   // each step was washed on its own day
  gTone = tone;
  return mix(uWash * tone, uFloorCol * (1.02 * tone), 0.3 * wear);
}
// an azimuth circle let into the floor: a marble ring ruled on its inner margin between two sandstone kerbs, and eight marble rays to the cardinal points
vec3 floorCompass(vec3 c, vec3 P, vec2 ctr, float R0, float W, float far, float px){
  vec2 cc = P.xz - ctr; float cr = length(cc);
  if (cr < R0 - 3. || cr > far + 3.) return c;
  float ca = atan(cc.y, cc.x), w = cr - R0;
  float ring = smoothstep(-px * .5, px * .5, w) * (1. - smoothstep(W - px * .5, W + px * .5, w));
  float seg = abs(fract(ca * 1.2732395 + .5) - .5) * 0.7853982 * cr;                      // metres from the nearest of eight rays
  float ray = (1. - smoothstep(1.1 - px * .5, 1.1 + px * .5, seg)) * step(R0 + W, cr) * (1. - smoothstep(far - px, far + px, cr));
  float kerbR = (1. - smoothstep(0.5 - px * .5, 0.5 + px * .5, abs(w + 0.6))) + (1. - smoothstep(0.5 - px * .5, 0.5 + px * .5, abs(w - W - 0.6)));
  c = mix(c, uStone * (0.92 + 0.16 * h21(floor(P.xz / 2.4))), clamp(kerbR, 0., 1.) * (1. - smoothstep(2., 6., px)));
  float m = max(ring, ray);
  if (m > 0.001) {
    vec3 mb = marbleAlb(vec2(ca * R0, cr), px);
    float L = ring * scaleLead(vec2(ca * R0, w), 1., px, px) * (1. - smoothstep(0.5, 2.5, px));
    L = max(L, ray * lineAA(seg, 0.05, px));
    mb = mix(mb, uLead, clamp(L, 0., 1.) * 0.9);
    c = mix(c, mb, m);
  }
  return c;
}
vec3 floorAlb(vec3 P, float px){
  vec2 g = P.xz / vec2(56., 42.) + .5; vec2 q = (fract(g) - .5) * vec2(56., 42.);
  vec3 c = plasterAlb(uFloorCol * (0.87 + 0.26 * h21(floor(g) + 2.)), P, vec3(0., 1., 0.), 0., px);
  { vec2 tg = P.xz / 13. + uSeed; vec2 ti = floor(tg + (vnoise(P.xz * 0.09) - .5) * 0.5);
    float ang = h21(ti + 1.3) * 3.1416; vec2 dir = vec2(cos(ang), sin(ang));
    float along = dot(P.xz, dir), across = dot(P.xz, vec2(-dir.y, dir.x));
    float det2 = 1. - smoothstep(0.2, 1.3, px);
    float pass = vnoise(vec2(across * 1.3, along * 0.09 + h21(ti) * 9.)) - .5;          // one pass of the float: long, soft, half a metre wide
    float lap = smoothstep(0.82, 1., fract(across / 3.1 + h21(ti + 6.))) ;               // the lap where two passes meet
    c *= 1. + (0.11 * pass - 0.05 * lap) * det2 + 0.035 * (h21(ti + 4.4) - .5) * (1. - smoothstep(1., 4., px)); }
  { vec2 bg = P.xz / vec2(14., 10.5) + .5; vec2 bq = (fract(bg) - .5) * vec2(14., 10.5);
    c *= 0.955 + 0.09 * h21(floor(bg) + 41.);
    float bj = min(7. - abs(bq.x), 5.25 - abs(bq.y));
    c *= 1. - 0.3 * (1. - smoothstep(0.035, 0.035 + px, bj)) * (1. - smoothstep(0.25, 1.1, px)); }
  gTone = clamp(lum3(c) / max(lum3(uFloorCol), 1e-3), 0.6, 1.4); gBounce = 0.;
  float kd = min(28. - abs(q.x), 21. - abs(q.y));
  float kerb = 1. - smoothstep(0.7 - px * .5, 0.7 + px * .5, kd);
  kerb = mix(0.03, kerb, 1. - smoothstep(2.5, 8., px));        // far off: its flat average
  c = mix(c, uStone * (0.92 + 0.16 * h21(floor(P.xz / 2.4))), kerb);
  float md = abs(P.x);                                           // the one marble meridian line
  float mer = 1. - smoothstep(1.6 - px * .5, 1.6 + px * .5, md);
  c = mix(c, marbleAlb(P.zx, px), mer);
  c = mix(c, uLead, lineAA(md, 0.06, px) * mer);
${G.COMPASS.map(([x, z, r, w, far]) => `  c = floorCompass(c, P, vec2(uMx * ${f(x)}, ${f(z)}), ${f(r)}, ${f(w)}, ${f(far)}, px);`).join('\n')}
  return c;
}
// the bowl engraved with the sky: altitude circles every ten degrees, hour lines every fifteen, a ruled meridian
vec3 bowlAlb(vec3 P, float px){
  vec3 BW = bowlAt(P.x); vec3 d = P - vec3(BW.x, 0., BW.y); float r = max(length(d), 1e-3);
  float zen = acos(clamp(-d.y / r, -1., 1.)), sz = max(sin(zen), 1e-3);
  float az = atan(d.x, abs(d.z) + abs(d.x) < 1e-4 ? 1e-4 : d.z);
  vec3 c = marbleAlb(vec2(az * BW.z * max(sz, 0.3), zen * BW.z), px);
  float cm = zen * BW.z, pitch = BW.z * 0.1745329;
  float L = lineAA((fract(cm / pitch + .5) - .5) * pitch, 0.07, px);                       // altitude circles
  L = max(L, 0.8 * lineAA((fract(cm / pitch) - .5) * pitch, 0.04, px));                       // and the five-degree circles between them
  float pm = pitch / 10.; float fine = mix(0.06, lineAA((fract(cm / pm + .5) - .5) * pm, 0.022, px), 1. - smoothstep(0.1, 0.3, px));
  float hs2 = h21(floor(vec2(az * 9.5493, cm / (pitch * 0.5))) + 61.);                           // the bowl's own slabs: one per half band and hour sixth
  c *= 0.965 + 0.07 * hs2; gTone += 2.6 * (hs2 - .5) * 0.07;
  float am = BW.z * sz, hp = 0.2617994;
  float hl = lineAA((fract(az / hp + .5) - .5) * hp * am, 0.07, px) * step(4., cm);        // hour lines
  hl = max(hl, 0.7 * lineAA((fract(az / hp) - .5) * hp * am, 0.035, px) * step(14., cm));     // and the half hours
  float mer = abs(d.x);
  float md = max(lineAA(mer - 0.9, 0.05, px), lineAA(mer, 0.03, px));                      // the meridian, ruled double
  float tk = max(fine * (1. - smoothstep(0.9, 0.9 + px, mer)), 0.55 * fine);               // degree circles: bold as ticks along the meridian, fine everywhere else
  float hsh = h21(floor(vec2(cm / pitch, az / hp)) + 3.);
  L = max(max(L, hl) * (hsh < 0.06 ? 0.3 : 1.), max(md, tk));
  return mix(c, uLead, clamp(L, 0., 1.));
}
vec3 surfaceAlb(float mat, vec3 P, vec3 N, vec2 uv2, vec4 info, float px, float fs, float fw){
  // the nosing's height on screen in pixels, from the distance alone (the same on tread, riser and nosing, so it melts evenly):
  // one whole red line while it is over about three pixels, then thinner, then one even tint of tread and nosing
  float nosK = smoothstep(1.2, 3.2, 0.62 / max(length(P - cameraPosition) * uPxK, 1e-5));
  gArc = uv2;
  if (mat > 10.5) {   // the ribbed dome: plaster, a soft dark groove between each pair of ribs
    vec3 c = plasterAlb(uWash, P, N, -1., px);
    float g = 1. - smoothstep(0.02, 0.36, abs(fract(uv2.x) - .5));
    g = mix(g, 0.36, smoothstep(0.12, 0.4, fs));
    return c * mix(1.08, 0.6, g);
  }
  if (mat > 9.5) {    // the quadrant band: ruled marble between two red sandstone margins
    vec3 m = marbleAlb(vec2(uv2.x * info.z, uv2.y + 40.), px);
    float L = bandLead(uv2, info.z, fs, fw); gLead = L;
    vec3 c = mix(m, uLead, L);
    return mix(c, stoneAlb(P, N, px), 1. - smoothstep(-0.32 - fw - 1e-4, -0.32 + fw + 1e-4, uv2.y));
  }
  if (mat > 8.5) return mix(treadAlb(P, N, px), uStone, uNosing * 0.17 * (1. - nosK));
  if (mat > 7.5) return bowlAlb(P, px);
  if (mat < 0.5) return plasterAlb(uWash, P, N, info.w, px);
  if (mat < 1.5) return stoneAlb(P, N, px);
  if (mat < 2.5) {
    vec3 m = marbleAlb(vec2(uv2.x * info.z, uv2.y + 40.), px); float L;
    if (info.w < -1.5) {   // the dial ring: 24 bold hour bars, a short bar at each half hour, two ruled borders
      L = tick(uv2.x, 39.2699, 0.30, 4.2, uv2.y - 0.7, fw, info.z, fs, 1.);
      L = max(L, tick(uv2.x + 19.63495, 39.2699, 0.13, 2.3, uv2.y - 0.7, fw, info.z, fs, 1.));
      L = max(L, max(lineAA(uv2.y - 0.45, 0.2, fw), lineAA(uv2.y - 4.8, 0.2, fw)));
    } else { gBold = 1. + info.w; L = scaleLead(uv2, info.z, fs, fw); }
    gLead = L; return mix(m, uLead, L);
  }
  if (mat < 3.5) return floorAlb(P, px);
  if (mat < 4.5) return marbleAlb(faceUV(P, N), px);
  if (mat < 5.5) return uLead;
  if (mat < 6.5) return uShade * 0.25;
  vec3 tr = treadAlb(P, N, px); float nk = uNosing * mix(0.17, 1., nosK);
  gTone = mix(gTone, 1., nk);
  return mix(tr, uStone * (0.95 + 0.1 * h21(floor(vec2(P.x / 3.1 + 0.5 * floor(P.z / 2.944), P.z / 2.944)) + 11.)), nk);   // step nosing: dressed sandstone in three-metre lengths
}
// the one light: a sun term, a shade term that is a colour, and the low dust haze. Returns scene-linear colour.
vec3 yardLight(vec3 alb, vec3 P, vec3 N, float self, float px){
  float ndl = dot(N, uSun);
  float vis = ndl > 0. ? sunVis(P, N, self, px) * smoothstep(0., 0.018, ndl) : 0.;
  float white = smoothstep(0.45, 0.8, min(alb.r, min(alb.g, alb.b)));
  vec3 sunC = alb * mix(vec3(1.), uWhiteBoost, white) * uSunCol * (0.85 + 0.21 * ndl) * uSunI;
  float lum = dot(alb, vec3(0.3, 0.55, 0.15));
  float L = clamp(lum / 0.42, 0., 1.);
  vec3 shC = mix(alb * mix(1., 0.5, L), uShade * 1.5, mix(0.62, 0.79, L) * (1. - gShadeKeep)) * (0.55 + 0.45 * clamp(lum / 0.42, 0.25, 1.45));   // shade is a colour, and the surface still shows in it
  shC *= uShadeK * (0.92 + 0.12 * N.y) * (0.3 + 0.7 * uSunI) * mix(vec3(1.), vec3(0.88, 0.97, 1.14), max(N.y, 0.));   // what faces the sky is bluer
  shC *= clamp(1. + 1.15 * (gTone - 1.), 0.4, 1.6);                // the mason's hand shows in the shade as it does in the sun
  shC *= 1. + 0.3 * max(-N.y, 0.) * uSunI;                          // under a soffit: light thrown up from the sunlit floor, in the shade's own blue-violet (never pink)
  if (gBounce > 0.02) {                                             // the foot of a shaded wall glows where the floor before it lies in the sun
    vec3 fp = vec3(P.x + N.x * 7., 0.3, P.z + N.z * 7.);
    float lit = pen(prism(fp, uSun, -HW, HW, 0., ZTOP, -1e4, vec3(0., CPc, -SPc), -PH * CPc), 1.) * smoothstep(0., 0.08, uSun.y);
    shC *= 1. + 0.3 * gBounce * lit * uSunI;
  }
  shC *= 1. - 0.5 * gLead;                                         // lead keeps its dark in shade
  sunC = mix(sunC, shC * 1.5 + sunC * 0.15, 0.7 * uEcl);          // in the eclipse the lit ochre goes to slate, not to brown
  vec3 c = mix(shC, sunC, vis);
  float dist = length(P - cameraPosition);
  float hz = (1. - exp(-dist * uHaze)) * exp(-max(P.y, 0.) / 90.);
  return mix(c, uHazeCol * (0.3 + 0.7 * uSunI), hz) * uGain;
}
`;

// ---- materials ----------------------------------------------------------------------------------------------
const MASON_VERT = /* glsl */`
attribute vec4 aInfo; attribute vec2 aArc;
varying vec3 vW, vN; varying vec2 vArc; varying vec4 vInfo;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; vArc = aArc; vInfo = aInfo;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
// The one material for everything built. Geometry needs: position, normal, aArc (vec2: arc coordinate s, and w =
// metres from the root line of the tick strip, negative where there is no scale), aInfo (vec4: MAT id, SELF id,
// metres per unit of s, drip 0..1 = how close under a ledge, for the rain streaks).
export function masonryMaterial(style, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, side: opts.side ?? THREE.FrontSide, vertexShader: MASON_VERT,
    fragmentShader: STYLE_GLSL + SURFACE_GLSL + /* glsl */`
varying vec3 vW, vN; varying vec2 vArc; varying vec4 vInfo;
void main(){
  vec3 N = vN / max(length(vN), 1e-5); if (!gl_FrontFacing) N = -N;
  float px = clamp(length(fwidth(vW)) * 0.7, 0.002, 60.);
  float fs = fwidth(vArc.x), fw = fwidth(vArc.y);
  vec3 alb = surfaceAlb(vInfo.x, vW, N, vArc, vInfo, px, fs, fw);
  gl_FragColor = vec4(yardLight(alb, vW, N, vInfo.y, px), 1.);
}` });
}
// Same light for creatures and leaves: flat pigment in sun and shade, shadowed by the yard. Works on Mesh and
// InstancedMesh. Attributes: color (vec3 pigment, linear) and optional aPhase (float per instance). opts.vertex is a
// GLSL snippet "vec3 animate(vec3 p, float phase)" for wing beats or trembling (default: leaf tremble by position.y).
export function creatureMaterial(style, opts = {}) {
  const anim = opts.vertex || 'vec3 animate(vec3 p, float ph){ float a = (sin(uTime * (5. + 3. * fract(ph * 7.1)) + ph * 40.) * 0.2 + sin(uTime * 1.3 + ph * 13.) * 0.14) * p.y; return p + vec3(a, 0., a * 0.6 * cos(ph * 9.)); }';
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, side: opts.side ?? THREE.DoubleSide,
    vertexShader: /* glsl */`
uniform float uTime; attribute vec3 color; attribute float aPhase; varying vec3 vW, vN, vCol;
${anim}
void main(){ vec3 p = animate(position, aPhase);
#ifdef USE_INSTANCING
  mat4 m = modelMatrix * instanceMatrix;
#else
  mat4 m = modelMatrix;
#endif
  vec4 w = m * vec4(p, 1.); vW = w.xyz; vN = mat3(m) * normal; vCol = color; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: STYLE_GLSL + SURFACE_GLSL + /* glsl */`
varying vec3 vW, vN, vCol;
void main(){
  vec3 N = vN / max(length(vN), 1e-5); if (!gl_FrontFacing) N = -N;
  float px = clamp(length(fwidth(vW)) * 0.7, 0.002, 60.);
  if (dot(N, uSun) < 0.) N = normalize(mix(N, uSun, 0.35));       // thin leaves and feathers let some sun through
  gShadeKeep = 0.72; gBirdShape = 0.;
  gl_FragColor = vec4(yardLight(vCol, vW, N, 0., px), 1.);
}` });
}

// ---- mesh builder ---------------------------------------------------------------------------------------------
// q(a, b, c, d, o): one quad, corners counter-clockwise seen from outside. o: { m: MAT, s: SELF, k: metres per unit
// of arc, d: [drip x4] or number, arc: [[s, w] x4], n: [normal x4] or one normal }. Unset fields keep b.m, b.s, b.k.
export class Builder {
  constructor() { this.pos = []; this.nor = []; this.arc = []; this.info = []; this.m = 0; this.s = 0; this.k = 1; }
  v(p, n, arc, m, s, k, d) { this.pos.push(p[0], p[1], p[2]); this.nor.push(n[0], n[1], n[2]); this.arc.push(arc[0], arc[1]); this.info.push(m, s, k, d); }
  q(a, b, c, d, o = {}) {
    const m = o.m ?? this.m, s = o.s ?? this.s, k = o.k ?? this.k;
    const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    let gn = [nx / l, ny / l, nz / l];
    let A = o.arc || NOARC, D = Array.isArray(o.d) ? o.d : [o.d || 0, o.d || 0, o.d || 0, o.d || 0];
    let P = [a, b, c, d], N = o.n ? (Array.isArray(o.n[0]) ? o.n : [o.n, o.n, o.n, o.n]) : null;
    if (o.out && gn[0] * o.out[0] + gn[1] * o.out[1] + gn[2] * o.out[2] < 0) {   // o.out: any vector on the outside; fixes winding
      gn = [-gn[0], -gn[1], -gn[2]]; P = [a, d, c, b]; A = [A[0], A[3], A[2], A[1]]; D = [D[0], D[3], D[2], D[1]];
      if (N) N = [N[0], N[3], N[2], N[1]];
    }
    if (!N) N = [gn, gn, gn, gn];
    for (const i of QI) this.v(P[i], N[i], A[i], m, s, k, D[i]);
  }
  get triangles() { return this.pos.length / 9; }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aArc', new THREE.Float32BufferAttribute(this.arc, 2));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.info, 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}
const QI = [0, 1, 2, 0, 2, 3], NOARC = [[0, -9], [0, -9], [0, -9], [0, -9]];
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// ---- the gnomon: set-square wall, parapets with ruled marble caps, stair, great arch, platform ---------------
async function buildGnomon(b, pause) {
  const { HW, SW, PH, ZTOP, ZEND, PLAT, ARCH } = G;
  const E = (z) => z * TP;                                   // the edge that points at the pole
  const zs = [];
  for (let z = 2.4; z < ZEND - 0.6; z += 9.8) { if (Math.abs(z - ARCH.z) > ARCH.w + 0.1) zs.push(z); }
  for (let i = 0; i <= 18; i++) zs.push(ARCH.z - ARCH.w + i * (2 * ARCH.w / 18));
  zs.push(ZTOP, ZEND - 0.6); zs.sort((p, q) => p - q);
  const top = (z) => (z <= ZTOP + 1e-6 ? E(z) - 1.2 : PLAT);
  const archY = (z) => (Math.abs(z - ARCH.z) < ARCH.w - 1e-6 ? ARCH.s + (ARCH.h - ARCH.s) * archH((z - ARCH.z) / ARCH.w) : 0);
  const SS = (z) => z / CP;                                  // arc coordinate up the stair
  for (const sd of [-1, 1]) {
    const X = sd * HW, out = [sd, 0, 0], par = sd < 0 ? SELF.PARW : SELF.PARE;
    // flanks, in columns; the arch opens from the floor
    for (let i = 0; i < zs.length - 1; i++) {
      const z0 = zs[i], z1 = zs[i + 1], zm = (z0 + z1) / 2, inA = Math.abs(zm - ARCH.z) < ARCH.w;
      const t0 = z0 > ZTOP - 1e-6 ? PLAT : top(z0), t1 = z1 > ZTOP + 1e-6 ? PLAT : top(z1);
      const b0 = inA ? archY(z0) || ARCH.s : 0, b1 = inA ? archY(z1) || ARCH.s : 0;
      const m0 = Math.max(b0, t0 - 16), m1 = Math.max(b1, t1 - 16);
      const d0 = 1 - (t0 - m0) / 16, d1 = 1 - (t1 - m1) / 16;
      b.q([X, b0, z0], [X, b1, z1], [X, m1, z1], [X, m0, z0], { out, m: MAT.PLASTER, s: SELF.BODY, d: [0, 0, d1 * 0.0, d0 * 0.0] });
      b.q([X, m0, z0], [X, m1, z1], [X, t1, z1], [X, t0, z0], { out, m: MAT.PLASTER, s: SELF.BODY, d: [0, 0, 1, 1] });
      if (!inA && t0 > 7 && t1 > 7) {   // a plain plinth course with a weathered top
        const xp = sd * (HW + 0.55), nw = norm3([sd * 0.8, 0.6, 0]);
        b.q([xp, 0, z0], [xp, 0, z1], [xp, 2.6, z1], [xp, 2.6, z0], { out, m: MAT.PLASTER, s: SELF.BODY, d: -1 });
        b.q([xp, 2.6, z0], [xp, 2.6, z1], [X, 3.5, z1], [X, 3.5, z0], { out: nw, n: [[sd, 0, 0], [sd, 0, 0], nw, nw], m: MAT.PLASTER, s: SELF.BODY, d: -1 });
      }
    }
    await pause();
    // parapet: coping, marble cap with its own scale, inner face (swept in 9.8 m lengths)
    const O = 0.35, xo = sd * (HW + O), xi = sd * (SW - O), xin = sd * SW;
    for (let z0 = 2.4; z0 < ZTOP - 1e-6; z0 += 9.952) {
      const z1 = Math.min(ZTOP, z0 + 9.952), e0 = E(z0), e1 = E(z1), s0 = SS(z0), s1 = SS(z1);
      const o2 = { s: par };
      b.q([X, e0 - 1.2, z0], [X, e1 - 1.2, z1], [xo, e1 - 1.2, z1], [xo, e0 - 1.2, z0], { ...o2, m: MAT.STONE, out: [0, -1, 0] });     // coping soffit, outer
      b.q([xo, e0 - 1.2, z0], [xo, e1 - 1.2, z1], [xo, e1 - 0.45, z1], [xo, e0 - 0.45, z0], { ...o2, m: MAT.STONE, out });              // coping face
      b.q([xo, e0 - 0.45, z0], [xo, e1 - 0.45, z1], [xo, e1, z1], [xo, e0, z0], { ...o2, m: MAT.MARBLE, out });                        // cap edge
      b.q([xo, e0, z0], [xo, e1, z1], [xi, e1, z1], [xi, e0, z0], { ...o2, m: MAT.SCALE, out: [0, 1, 0],
        arc: [[s0, 5.2], [s1, 5.2], [s1, -0.5], [s0, -0.5]], d: 2.6 });                                                                        // the ruled cap
      b.q([xi, e0 - 0.45, z0], [xi, e1 - 0.45, z1], [xi, e1, z1], [xi, e0, z0], { ...o2, m: MAT.MARBLE, out: [-sd, 0, 0] });
      b.q([xi, e0 - 1.2, z0], [xi, e1 - 1.2, z1], [xi, e1 - 0.45, z1], [xi, e0 - 0.45, z0], { ...o2, m: MAT.STONE, out: [-sd, 0, 0] });
      b.q([xin, e0 - 1.2, z0], [xin, e1 - 1.2, z1], [xi, e1 - 1.2, z1], [xi, e0 - 1.2, z0], { ...o2, m: MAT.STONE, out: [0, -1, 0] });
      const f0 = Math.max(0, e0 - PH), f1 = Math.max(0, e1 - PH);
      b.q([xin, f0, z0], [xin, f1, z1], [xin, e1 - 1.2, z1], [xin, e0 - 1.2, z0], { ...o2, m: MAT.PLASTER, out: [-sd, 0, 0], d: [0, 0, 0.8, 0.8] });
    }
    await pause();
    // toe block and the pier where the parapet meets the platform
    const zt = 2.4, et = E(zt);
    b.q([xo, 0, zt], [xi, 0, zt], [xi, et, zt], [xo, et, zt], { m: MAT.STONE, s: par, out: [0, 0, -1] });
    const eT = E(ZTOP);
    b.q([xo, PLAT, ZTOP], [xi, PLAT, ZTOP], [xi, eT - 1.2, ZTOP], [xo, eT - 1.2, ZTOP], { m: MAT.PLASTER, s: par, out: [0, 0, 1], d: [0, 0, 1, 1] });
    b.q([xo, eT - 1.2, ZTOP], [xi, eT - 1.2, ZTOP], [xi, eT - 0.45, ZTOP], [xo, eT - 0.45, ZTOP], { m: MAT.STONE, s: par, out: [0, 0, 1] });
    b.q([xo, eT - 0.45, ZTOP], [xi, eT - 0.45, ZTOP], [xi, eT, ZTOP], [xo, eT, ZTOP], { m: MAT.MARBLE, s: par, out: [0, 0, 1] });
    // soft arris at the north corners, then a low stone kerb round the platform
    const nc = norm3([sd, 0, 1]);
    b.q([X, 0, ZEND - 0.6], [sd * (HW - 0.6), 0, ZEND], [sd * (HW - 0.6), PLAT, ZEND], [X, PLAT, ZEND - 0.6],
      { m: MAT.PLASTER, s: SELF.BODY, out: nc, n: [[sd, 0, 0], [0, 0, 1], [0, 0, 1], [sd, 0, 0]], d: [0, 0, 1, 1] });
    box(b, [sd * (HW - 0.5), PLAT + 0.6, (ZTOP + ZEND) / 2], [0.9, 1.2, ZEND - ZTOP], MAT.STONE, SELF.PLAT);
  }
  box(b, [0, PLAT + 0.6, ZEND - 0.45], [2 * HW - 1.8, 1.2, 0.9], MAT.STONE, SELF.PLAT);
  // north cliff and platform floor
  for (let j = 0; j < 2; j++) {
    const y0 = j ? PLAT - 20 : 0, y1 = j ? PLAT : PLAT - 20, x = HW - 0.6;
    b.q([x, y0, ZEND], [-x, y0, ZEND], [-x, y1, ZEND], [x, y1, ZEND], { m: MAT.PLASTER, s: SELF.BODY, out: [0, 0, 1], d: [0, 0, j, j] });
  }
  b.q([-HW, PLAT, ZTOP], [HW, PLAT, ZTOP], [HW, PLAT, ZEND], [-HW, PLAT, ZEND], { m: MAT.FLOOR, s: SELF.PLAT, out: [0, 1, 0] });
  // the stair: treads and risers lit almost alike, red sandstone nosings
  const rise = 1.5, run = rise / TP, zA = PH / TP, nStep = Math.ceil(PLAT / rise);
  const nS = [0, CP, -SP], nTr = norm3([0, CP + 0.14, -SP]), nRi = norm3([0, CP, -SP - 0.14]);
  for (let i = 0; i < nStep; i++) {
    if (i % 30 === 29) await pause();
    const z0 = zA + i * run, z1 = Math.min(ZTOP, z0 + run), y0 = i * rise, y1 = Math.min(PLAT, y0 + rise), o = { s: SELF.BODY };
    b.q([-SW, y0, z0], [SW, y0, z0], [SW, y1 - 0.3, z0], [-SW, y1 - 0.3, z0], { ...o, m: MAT.TREAD, n: nRi, out: [0, 0, -1] });
    b.q([-SW, y1 - 0.3, z0], [SW, y1 - 0.3, z0], [SW, y1, z0], [-SW, y1, z0], { ...o, m: 7, n: nS, out: [0, 0, -1] });
    b.q([-SW, y1, z0], [SW, y1, z0], [SW, y1, z0 + 0.5], [-SW, y1, z0 + 0.5], { ...o, m: 7, n: nS, out: [0, 1, 0] });
    b.q([-SW, y1, z0 + 0.5], [SW, y1, z0 + 0.5], [SW, y1, z1], [-SW, y1, z1], { ...o, m: MAT.TREAD, n: nTr, out: [0, 1, 0] });
  }
  await pause();
  // the great arch: tunnel lining and a dressed sandstone ring on each flank
  const prof = (w, s, h) => { const p = [[-w, 0], [-w, s]]; for (let i = 1; i < 16; i++) { const t = -1 + i / 8; p.push([t * w, s + (h - s) * archH(t)]); } p.push([w, s], [w, 0]); return p; };
  const pin = prof(ARCH.w, ARCH.s, ARCH.h), pout = prof(ARCH.w + 2.4, ARCH.s + 0.6, ARCH.h + 3.4), XR = HW + 0.35;
  for (let i = 0; i < pin.length - 1; i++) {
    const a = pin[i], c = pin[i + 1], a2 = pout[i], c2 = pout[i + 1], mid = [0, 7, ARCH.z];
    const inward = [0, mid[1] - (a[1] + c[1]) / 2, -(a[0] + c[0]) / 2];
    b.q([-XR, a[1], ARCH.z + a[0]], [XR, a[1], ARCH.z + a[0]], [XR, c[1], ARCH.z + c[0]], [-XR, c[1], ARCH.z + c[0]], { m: MAT.PLASTER, s: SELF.TUNNEL, out: inward, d: 0.35,
      arc: [[100 + XR, -XR], [100 + XR, XR], [100 + XR, XR], [100 + XR, -XR]] });   // arris strips: the jamb's edges are rubbed pale and soft
    for (const sd of [-1, 1]) {
      const x = sd * XR, o = { m: MAT.STONE, s: SELF.BODY };
      b.q([x, a[1], ARCH.z + a[0]], [x, c[1], ARCH.z + c[0]], [x, c2[1], ARCH.z + c2[0]], [x, a2[1], ARCH.z + a2[0]], { ...o, out: [sd, 0, 0] });
      b.q([x, a2[1], ARCH.z + a2[0]], [x, c2[1], ARCH.z + c2[0]], [sd * HW, c2[1], ARCH.z + c2[0]], [sd * HW, a2[1], ARCH.z + a2[0]], { ...o, out: [0, -inward[1], -inward[2]] });
    }
  }
}
// an axis-aligned block (centre, size) with an optional top material
function box(b, c, sz, m, s, mTop = m) {
  const [x, y, z] = c, hx = sz[0] / 2, hy = sz[1] / 2, hz = sz[2] / 2, o = { m, s };
  const P = (i, j, k) => [x + i * hx, y + j * hy, z + k * hz];
  b.q(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), { ...o, out: [0, 0, 1] });
  b.q(P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), { ...o, out: [0, 0, -1] });
  b.q(P(1, -1, -1), P(1, -1, 1), P(1, 1, 1), P(1, 1, -1), { ...o, out: [1, 0, 0] });
  b.q(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), { ...o, out: [-1, 0, 0] });
  b.q(P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1), { ...o, m: mTop, out: [0, 1, 0] });
  b.q(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), { ...o, out: [0, -1, 0] });
}

// ---- a quadrant: the ruled marble band (square to the pole) on its leaning fin wall ----------------------------
// in-plane coordinates: a outward from the flank, bb down the plane from the quadrant centre, ax along the pole
export const quadPoint = (sd, a, bb, ax = 0) => [sd * (G.HW + a), G.QC.y - bb * CP + ax * SP, G.QC.z + bb * SP + ax * CP];
async function buildQuadrant(b, sd, nSeg, pause) {
  const { QR, QW, FINT, FINA, FING, FARCH } = G, T = 1.5, fin = sd < 0 ? SELF.FINW : SELF.FINE;
  const P = (a, bb, ax) => quadPoint(sd, a, bb, ax);
  const pole = [0, SP, CP], npole = [0, -SP, -CP];
  // the band
  for (let i = 0; i < nSeg; i++) {
    if (i % 20 === 19) await pause();
    const t0 = (i / nSeg) * Math.PI / 2, t1 = ((i + 1) / nSeg) * Math.PI / 2, s0 = QR * t0, s1 = QR * t1;
    const c0 = Math.cos(t0), n0 = Math.sin(t0), c1 = Math.cos(t1), n1 = Math.sin(t1);
    const nin = (c, n) => norm3([-sd * n, c * CP, -c * SP]);            // toward the centre (the edge that casts)
    const N0 = nin(c0, n0), N1 = nin(c1, n1), M0 = N0.map((v) => -v), M1 = N1.map((v) => -v);
    const pt = (r, c, n, ax) => P(r * n, r * c, ax);
    const strips = [[-QW, 0, -1, QW - 1], [0, QW, QW - 1, -1]];
    for (const [x0, x1, w0, w1] of strips) {
      b.q(pt(QR, c0, n0, x0), pt(QR, c0, n0, x1), pt(QR, c1, n1, x1), pt(QR, c1, n1, x0),
        { m: MAT.BAND, s: 0, out: N0, n: [N0, N0, N1, N1], arc: [[s0, w0], [s0, w1], [s1, w1], [s1, w0]] });
    }
    b.q(pt(QR + T, c0, n0, -QW), pt(QR + T, c0, n0, QW), pt(QR + T, c1, n1, QW), pt(QR + T, c1, n1, -QW),
      { m: MAT.PLASTER, s: 0, out: M0, n: [M0, M0, M1, M1], d: 0.5 });
    for (const e of [-1, 1]) {
      b.q(pt(QR, c0, n0, e * QW), pt(QR + T, c0, n0, e * QW), pt(QR + T, c1, n1, e * QW), pt(QR, c1, n1, e * QW),
        { m: MAT.STONE, s: 0, out: e > 0 ? pole : npole });
    }
  }
  b.q(P(QR, 0, -QW), P(QR, 0, QW), P(QR + T, 0, QW), P(QR + T, 0, -QW), { m: MAT.STONE, s: 0, out: [0, CP, -SP] }); // the free end
  // a dressed sandstone sill where the band meets the flank
  b.q(P(0.6, QR, -QW - 0.8), P(0.6, QR, QW + 0.8), P(0.6, QR - 1.7, QW + 0.8), P(0.6, QR - 1.7, -QW - 0.8), { m: MAT.STONE, s: 0, out: [sd, 0, 0] });
  b.q(P(0, QR - 1.7, -QW - 0.8), P(0, QR - 1.7, QW + 0.8), P(0.6, QR - 1.7, QW + 0.8), P(0.6, QR - 1.7, -QW - 0.8), { m: MAT.STONE, s: 0, out: [0, CP, -SP] });
  await pause();
  // the fin wall, in columns of a; arches open from the floor line
  const as = [];
  for (let a = 0; a < FINA; a += 3.9) as.push(a);
  for (const [ca, w] of FARCH) for (let i = 0; i <= 14; i++) as.push(ca - w + (i / 14) * 2 * w);
  as.push(QR + 0.6, FINA); as.sort((p, q) => p - q);
  const RT = QR + 0.6;
  const bTop = (a) => (a < RT ? Math.sqrt(RT * RT - a * a) : 0);
  const archAt = (a) => { for (const [ca, w, s, h] of FARCH) { if (Math.abs(a - ca) < w + 1e-6) return s + (h - s) * archH((a - ca) / w); } return 0; };
  for (let i = 0; i < as.length - 1; i++) {
    if (i % 30 === 29) await pause();
    const a0 = as[i], a1 = as[i + 1]; if (a1 - a0 < 1e-4) continue;
    const am = (a0 + a1) / 2, inA = archAt(am) > 0;
    const lo0 = FING - (inA ? archAt(a0) : 0), lo1 = FING - (inA ? archAt(a1) : 0), u0 = bTop(a0), u1 = bTop(a1);
    const m0 = Math.min(lo0, u0 + 18), m1 = Math.min(lo1, u1 + 18);
    for (const e of [-1, 1]) {
      const o = { m: MAT.PLASTER, s: fin, out: e > 0 ? pole : npole }, ax = e * FINT;
      b.q(P(a0, u0, ax), P(a1, u1, ax), P(a1, m1, ax), P(a0, m0, ax), { ...o, d: [1, 1, 0, 0] });
      if (lo0 - m0 > 0.01 || lo1 - m1 > 0.01) b.q(P(a0, m0, ax), P(a1, m1, ax), P(a1, lo1, ax), P(a0, lo0, ax), o);
    }
    if (a0 >= RT - 1e-6) {  // top of the pier: a sandstone coping
      b.q(P(a0, 0, -FINT), P(a1, 0, -FINT), P(a1, 0, FINT), P(a0, 0, FINT), { m: MAT.STONE, s: fin, out: [0, CP, -SP] });
    }
  }
  b.q(P(FINA, 0, -FINT), P(FINA, 0, FINT), P(FINA, FING, FINT), P(FINA, FING, -FINT), { m: MAT.PLASTER, s: fin, out: [sd, 0, 0], d: [1, 1, 0.9, 0.9] });
  // arch linings and sandstone rings
  for (const [ca, w, s, h] of FARCH) {
    await pause();
    const prof = (w2, s2, h2) => { const p = [[-w2, 0], [-w2, s2]]; for (let i = 1; i < 14; i++) { const t = -1 + i / 7; p.push([t * w2, s2 + (h2 - s2) * archH(t)]); } p.push([w2, s2], [w2, 0]); return p; };
    const pin = prof(w, s, h), pout = prof(w + 2, s + 0.5, h + 3), XR = FINT + 0.3;
    for (let i = 0; i < pin.length - 1; i++) {
      const p0 = pin[i], p1 = pin[i + 1], q0 = pout[i], q1 = pout[i + 1];
      const A0 = P(ca + p0[0], FING - p0[1], -XR), A1 = P(ca + p0[0], FING - p0[1], XR), B1 = P(ca + p1[0], FING - p1[1], XR), B0 = P(ca + p1[0], FING - p1[1], -XR);
      const ctr = P(ca, FING - s * 0.8, 0), mid = [(A0[0] + B1[0]) / 2, (A0[1] + B1[1]) / 2, (A0[2] + B1[2]) / 2];
      b.q(A0, A1, B1, B0, { m: MAT.PLASTER, s: fin, out: [ctr[0] - mid[0], ctr[1] - mid[1], ctr[2] - mid[2]], d: 0.3,
        arc: [[100 + XR, -XR], [100 + XR, XR], [100 + XR, XR], [100 + XR, -XR]] });
      for (const e of [-1, 1]) {
        b.q(P(ca + p0[0], FING - p0[1], e * XR), P(ca + p1[0], FING - p1[1], e * XR), P(ca + q1[0], FING - q1[1], e * XR), P(ca + q0[0], FING - q0[1], e * XR),
          { m: MAT.STONE, s: fin, out: e > 0 ? pole : npole });
        b.q(P(ca + q0[0], FING - q0[1], e * XR), P(ca + q1[0], FING - q1[1], e * XR), P(ca + q1[0], FING - q1[1], e * FINT), P(ca + q0[0], FING - q0[1], e * FINT),
          { m: MAT.STONE, s: fin, out: [mid[0] - ctr[0], mid[1] - ctr[1], mid[2] - ctr[2]] });
      }
    }
  }
}

// ---- the kiosk (four sandstone pillars, slab, eave, ribbed plaster dome) and the equatorial dial ring ----------
async function buildKiosk(b, pause) {
  const { KZ, KPX, KPZ, KPR, PLAT, SLABY, DOMER } = G;
  const ring = (cx, cz, y0, r0, y1, r1, n, m) => {           // a round or faceted drum with smooth normals
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, sl = (r0 - r1) / Math.max(1e-3, y1 - y0);
      const n0 = norm3([Math.cos(a0), sl, Math.sin(a0)]), n1 = norm3([Math.cos(a1), sl, Math.sin(a1)]);
      b.q([cx + r0 * Math.cos(a0), y0, cz + r0 * Math.sin(a0)], [cx + r0 * Math.cos(a1), y0, cz + r0 * Math.sin(a1)],
        [cx + r1 * Math.cos(a1), y1, cz + r1 * Math.sin(a1)], [cx + r1 * Math.cos(a0), y1, cz + r1 * Math.sin(a0)],
        { m, s: 0, out: n0, n: [n0, n1, n1, n0] });
    }
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * KPX, z = KZ + sz * KPZ, H = SLABY - PLAT;
    box(b, [x, PLAT + 1.1, z], [3.6, 2.2, 3.6], MAT.STONE, 0);
    ring(x, z, PLAT + 2.2, KPR * 1.25, PLAT + 3.2, KPR, 12, MAT.STONE);
    ring(x, z, PLAT + 3.2, KPR, PLAT + H - 3.6, KPR * 0.88, 12, MAT.STONE);
    ring(x, z, PLAT + H - 3.6, KPR * 0.88, PLAT + H - 2.4, KPR * 1.35, 12, MAT.STONE);
    box(b, [x, PLAT + H - 1.2, z], [4.4, 2.4, 4.4], MAT.STONE, 0);
  }
  await pause();
  const SH = G.SLABH;
  box(b, [0, SLABY + 0.7, KZ], [2 * SH, 1.4, 2 * SH], MAT.STONE, 0, MAT.PLASTER);
  b.q([-SH, SLABY - 0.02, KZ - SH], [SH, SLABY - 0.02, KZ - SH], [SH, SLABY - 0.02, KZ + SH], [-SH, SLABY - 0.02, KZ + SH], { m: MAT.PLASTER, s: 0, out: [0, -1, 0], d: -1 });   // the soffit: ochre in shade, not stone
  // the sloping eave
  const e0 = SH, e1 = SH + 3.2, y0 = SLABY + 1.35, y1 = SLABY + 0.25;
  for (let i = 0; i < 4; i++) {
    const c = Math.cos(i * Math.PI / 2), s = Math.sin(i * Math.PI / 2);
    const R = (u, v, y) => [u * c - v * s, y, KZ + u * s + v * c];
    b.q(R(e0, -e0, y0), R(e0, e0, y0), R(e1, e1, y1), R(e1, -e1, y1), { m: MAT.STONE, s: 0, out: [c, 2, s] });
    b.q(R(e0, -e0, y0 - 0.5), R(e0, e0, y0 - 0.5), R(e1, e1, y1 - 0.35), R(e1, -e1, y1 - 0.35), { m: MAT.PLASTER, s: 0, out: [-c, -2, -s], d: -1 });
    b.q(R(e1, -e1, y1 - 0.35), R(e1, e1, y1 - 0.35), R(e1, e1, y1), R(e1, -e1, y1), { m: MAT.STONE, s: 0, out: [c, 0, s] });
  }
  // drum and ribbed dome (a slightly pointed plaster shell with 16 soft ribs)
  const cy = SLABY + 1.4, dy = G.DOMEY, DK = G.DOMEK;
  ring(0, KZ, cy, DOMER + 0.7, cy + 0.9, DOMER + 0.5, 48, MAT.STONE);
  ring(0, KZ, cy + 0.9, DOMER + 0.25, dy - 0.8, DOMER + 0.2, 48, MAT.PLASTER);
  ring(0, KZ, dy - 0.8, DOMER + 0.6, dy, DOMER + 0.45, 48, MAT.STONE);
  const ribs = 16, NA = 64, NP = 12;
  const S = (lam, ph) => { const r = DOMER * Math.cos(ph) ** 0.9 * (1 + 0.075 * Math.abs(Math.cos(lam * ribs / 2)) ** 2.2 * Math.cos(ph) ** 0.5); return [r * Math.cos(lam), dy + DOMER * DK * Math.sin(ph), KZ + r * Math.sin(lam)]; };
  const SN = (lam, ph) => { const e = 1e-3, p = S(lam, ph), a = S(lam + e, ph), c = S(lam, Math.min(ph + e, 1.5699));
    const u = [a[0] - p[0], a[1] - p[1], a[2] - p[2]], v = [c[0] - p[0], c[1] - p[1], c[2] - p[2]];
    const n = norm3([v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]]); return n[1] < -0.2 ? [0, 1, 0] : n; };
  for (let j = 0; j < NP; j++) { if (j % 4 === 0) await pause(); for (let i = 0; i < NA; i++) {
    const l0 = (i / NA) * Math.PI * 2, l1 = ((i + 1) / NA) * Math.PI * 2, p0 = (j / NP) * 1.5, p1 = ((j + 1) / NP) * 1.5;
    const r0 = l0 * 8 / Math.PI, r1 = l1 * 8 / Math.PI;
    b.q(S(l0, p0), S(l1, p0), S(l1, p1), S(l0, p1), { m: MAT.DOME, s: 0, out: [Math.cos(l0), 0.5, Math.sin(l0)],
      n: [SN(l0, p0), SN(l1, p0), SN(l1, p1), SN(l0, p1)], d: -1, arc: [[r0, p0], [r1, p0], [r1, p1], [r0, p1]] });
  } }
  await pause();
  const topY = dy + DOMER * DK * Math.sin(1.5);
  ring(0, KZ, topY - 0.3, 1.5, topY + 1.2, 0.9, 10, MAT.STONE); ring(0, KZ, topY + 1.2, 0.9, topY + 4.2, 0.02, 10, MAT.STONE);
  // the dial: a marble ring square to the pole, ruled in 24 hours on the face we arrive at
  const D = G.DIAL, ri = 7.7, ro = 9.9, th = 0.7, NR = 72, hourS = 39.2699, k = (2 * Math.PI * (ri + ro) / 2 / 24) / hourS;
  const U = [1, 0, 0], V = [0, CP, -SP], Pn = [0, SP, CP], Ps = [0, -SP, -CP];
  const rp = (r, a, ax) => [D.x + r * (Math.cos(a) * U[0] + Math.sin(a) * V[0]) + ax * Pn[0], D.y + r * Math.sin(a) * V[1] + ax * Pn[1], D.z + r * Math.sin(a) * V[2] + ax * Pn[2]];
  for (let i = 0; i < NR; i++) {
    const a0 = (i / NR) * Math.PI * 2, a1 = ((i + 1) / NR) * Math.PI * 2, s0 = (i / NR) * 24 * hourS, s1 = ((i + 1) / NR) * 24 * hourS;
    const r0 = [Math.cos(a0), Math.sin(a0) * V[1], Math.sin(a0) * V[2]], r1 = [Math.cos(a1), Math.sin(a1) * V[1], Math.sin(a1) * V[2]];
    b.q(rp(ri, a0, -th), rp(ro, a0, -th), rp(ro, a1, -th), rp(ri, a1, -th), { m: MAT.SCALE, s: 0, k, d: -2, out: Ps, arc: [[s0, -0.3], [s0, 5.3], [s1, 5.3], [s1, -0.3]] });
    b.q(rp(ri, a0, th), rp(ro, a0, th), rp(ro, a1, th), rp(ri, a1, th), { m: MAT.SCALE, s: 0, k, d: -2, out: Pn, arc: [[s0, -0.3], [s0, 5.3], [s1, 5.3], [s1, -0.3]] });
    b.q(rp(ro, a0, -th), rp(ro, a0, th), rp(ro, a1, th), rp(ro, a1, -th), { m: MAT.MARBLE, s: 0, out: r0, n: [r0, r0, r1, r1] });
    const q0 = r0.map((v) => -v), q1 = r1.map((v) => -v);
    b.q(rp(ri, a0, -th), rp(ri, a0, th), rp(ri, a1, th), rp(ri, a1, -th), { m: MAT.STONE, s: 0, out: q0, n: [q0, q0, q1, q1] });
  }
  for (const sg of [-1, 1]) {   // two lead-grey hangers from the slab
    const a = Math.PI / 2 + sg * 0.55, p = rp(ro - 0.3, a, 0), h = SLABY - p[1];
    box(b, [p[0], p[1] + h / 2, p[2]], [0.5, h, 0.5], MAT.LEAD, 0);
  }
}

// ---- peepal seedlings: sprays of heart-shaped leaves rooted in cracks, trembling ------------------------------
function leafGeometry(green) {
  const out = [[0, 0], [0.2, -0.06], [0.42, 0.1], [0.5, 0.36], [0.38, 0.66], [0.16, 0.95], [0.03, 1.32], [-0.03, 1.32], [-0.16, 0.95], [-0.38, 0.66], [-0.5, 0.36], [-0.42, 0.1], [-0.2, -0.06]];
  const pos = [], col = [], nor = [], c = [0, 0.42, 0.0];
  const put = (p, s) => { pos.push(p[0], p[1], Math.abs(p[0]) * 0.28); nor.push(-Math.sign(p[0]) * 0.27, 0, 0.96); col.push(green.r * s, green.g * s, green.b * s); };
  for (let i = 0; i < out.length; i++) { const a = out[i], d = out[(i + 1) % out.length]; put(c, 0.8); put(a, 1.06); put(d, 1.06); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
function seedlingSites(rng) {
  const { HW, ZTOP, FINT, FING, FARCH, QR, ARCH } = G, sites = [];
  for (let i = 0; i < 16; i++) { const sd = rng.chance(0.5) ? 1 : -1, z = rng.range(50, ZTOP - 15); sites.push({ p: [sd * (HW + 0.1), z * TP - 1.5 - rng.range(0, 2.5), z], n: [sd, 0, 0] }); }
  for (let i = 0; i < 9; i++) { const sd = rng.chance(0.5) ? 1 : -1, e = rng.chance(0.5) ? 1 : -1, a = rng.range(15, 140), bb = Math.sqrt((QR + 0.6) ** 2 - a * a) + rng.range(1.2, 4);
    sites.push({ p: quadPoint(sd, a, bb, e * (FINT + 0.1)), n: [0, e * SP, e * CP] }); }
  for (let i = 0; i < 10; i++) { const sd = rng.chance(0.5) ? 1 : -1, A = rng.pick(FARCH), e = rng.chance(0.5) ? 1 : -1;
    sites.push({ p: quadPoint(sd, A[0] + e * (A[1] - 0.1), FING - A[2] - rng.range(-2, 3), rng.range(-FINT, FINT)), n: [-sd * e, 0.2, 0] }); }
  for (let i = 0; i < 5; i++) { const sd = rng.chance(0.5) ? 1 : -1, e = rng.chance(0.5) ? 1 : -1;
    sites.push({ p: [sd * rng.range(HW - 3, HW + 0.3), ARCH.s + rng.range(-1.5, 3), ARCH.z + e * (ARCH.w - 0.1)], n: [0, 0.2, -e] }); }
  const A1 = FARCH[1];
  for (const [sd, e, up, axx, big] of [[1, -1, 3, -3.2, 2.3], [1, 1, 7, -2.6, 2.0], [1, 1, -4, 2.8, 1.7], [-1, 1, 4, -3, 1.9]])
    sites.push({ p: quadPoint(sd, A1[0] + e * (A1[1] - 0.1), FING - A1[2] - up, axx), n: [-sd * e, 0.2, 0], size: big });
  return sites;
}
function buildSeedlings(rng, style, detail) {
  const sites = seedlingSites(rng), per = Math.max(8, Math.round(20 * detail)), n = sites.length * per;
  const mesh = new THREE.InstancedMesh(leafGeometry(style.uniforms.uGreen.value), creatureMaterial(style), n);
  const phase = new Float32Array(n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), roll = new THREE.Quaternion();
  let k = 0;
  for (const s of sites) {
    const size = s.size ?? rng.range(0.7, 1.5);
    for (let i = 0; i < per; i++, k++) {
      const t = i / per;
      dir.set(s.n[0] * rng.range(0.3, 1.3) + rng.range(-0.8, 0.8), s.n[1] + rng.range(-0.5, 1.2), s.n[2] * rng.range(0.3, 1.3) + rng.range(-0.8, 0.8)).normalize();
      const reach = size * (0.25 + 1.1 * t) * rng.range(0.7, 1.1);
      const droop = new THREE.Vector3(dir.x, dir.y - 0.9 - rng.range(0, 0.8), dir.z).normalize();
      q.setFromUnitVectors(up, droop); roll.setFromAxisAngle(droop, rng.range(0, 6.283)); q.premultiply(roll);
      const sc = rng.range(0.55, 0.95) * (0.7 + 0.3 * size);
      m.compose(new THREE.Vector3(s.p[0] + dir.x * reach, s.p[1] + dir.y * reach, s.p[2] + dir.z * reach), q, new THREE.Vector3(sc, sc, sc));
      mesh.setMatrixAt(k, m); phase[k] = rng();
    }
  }
  mesh.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return { mesh, sites };
}
function buildFloor(b, R) {
  const N = 48, rings = [0, 60, 220, 520, R];
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, r0 = rings[j], r1 = rings[j + 1];
    b.q([r0 * Math.sin(a0), 0, 265 + r0 * Math.cos(a0)], [r0 * Math.sin(a1), 0, 265 + r0 * Math.cos(a1)], [r1 * Math.sin(a1), 0, 265 + r1 * Math.cos(a1)], [r1 * Math.sin(a0), 0, 265 + r1 * Math.cos(a0)],
      { m: MAT.FLOOR, s: 0, n: [0, 1, 0], out: [0, 1, 0] });
  }
}

// where the gnomon's shadow edge lies on the morning (west) quadrant: metres up the scale from the noon mark
export const shadowArc = (u) => G.QR * Math.max(0, 12 - sunTimeAt(u)) * 15 * RAD;
// a point on a quadrant's scale: sd -1 west / +1 east, s metres up the scale from noon, ax across the band (-11..11),
// lift metres off the marble toward the centre
export const scalePoint = (sd, s, ax = 0, lift = 0) => { const th = s / G.QR, r = G.QR - lift; return quadPoint(sd, r * Math.sin(th), r * Math.cos(th), ax); };

// opts: palette (7 hex strings), detail 0.6..1, colourway 'jaipur'|'delhi', haze 0..1, floor (default true: a plain
// yard disc of 1100 m; pass false and lay your own MAT.FLOOR ground), style (a makeStyle() block to share).
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const dbg = new URLSearchParams('');
  const detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const rCW = rng.chance(0.25) ? 'delhi' : 'jaipur', rHaze = rng.chance(0.3) ? rng.range(0.35, 1) : 0, rSeed = Math.floor(rng() * 1000);
  const style = opts.style || makeStyle({ palette: opts.palette, colourway: opts.colourway ?? dbg.get('stairCW') ?? rCW, haze: opts.haze ?? rHaze, seed: rSeed });
  const object = new THREE.Group(); object.name = 'stair-that-points-at-the-pole';
  const mat = masonryMaterial(style);

  const b = new Builder();
  const pause = () => ctx.yield();
  await buildGnomon(b, pause); await ctx.yield();
  const nSeg = Math.round(96 * (0.5 + 0.5 * detail));
  await buildQuadrant(b, -1, nSeg, pause); await ctx.yield();
  await buildQuadrant(b, 1, nSeg, pause); await ctx.yield();
  await buildKiosk(b, pause); await ctx.yield();
  const mesh = new THREE.Mesh(b.geometry(), mat); mesh.frustumCulled = false; object.add(mesh);
  await ctx.yield();
  let floor = null;
  if (opts.floor !== false) { const fb = new Builder(); buildFloor(fb, 1100); floor = new THREE.Mesh(fb.geometry(), mat); floor.frustumCulled = false; object.add(floor); }
  await ctx.yield();
  const seed = buildSeedlings(rng, style, detail); object.add(seed.mesh);
  await ctx.yield();

  // ---- anchors (all in the yard's own coordinates = local space) ----
  const pole = new THREE.Vector3(0, SP, CP);
  const climb = []; for (let z = 40; z <= G.KZ + 1e-6; z += 47.5) climb.push(new THREE.Vector3(0, z * TP - 3, z));
  const dive = []; for (let h = 8; h <= 11.75; h += 0.75) dive.push(V3(scalePoint(-1, G.QR * (12 - h) * 15 * RAD, -5.6, 3.5)));
  const A1 = G.FARCH[1];
  const anchors = {
    portalSeat: { position: G.DIAL.clone(), facing: pole.clone().negate(), axis: pole.clone(), radius: 7, tilt: PHI },
    pole,                                                        // the one axis: 27 degrees up to the north
    entry: { position: new THREE.Vector3(-170, 150, -110), heading: new THREE.Vector3(0.105, 0, 0.994) },   // six degrees east of north: the free end, the upper stair and the kiosk all sit within about 15 degrees of this axis
    flyThrough: climb,                                           // the climb, 5 m above the treads, 9 m clear each side, ends in the dial
    dive,                                                        // 3.5 m above the west scale from the 8 o'clock mark to 11:45
    squirrel: { position: V3(scalePoint(-1, G.QR * 15 * RAD, -6.3, 0)), normal: V3(scalePoint(-1, G.QR * 15 * RAD, -6.3, 1)).sub(V3(scalePoint(-1, G.QR * 15 * RAD, -6.3, 0))),
      downScale: V3(scalePoint(-1, G.QR * 14 * RAD, -6.3, 0)).sub(V3(scalePoint(-1, G.QR * 15 * RAD, -6.3, 0))).normalize() },   // on the eleven o'clock mark
    greatArch: [new THREE.Vector3(-45, 10, G.ARCH.z), new THREE.Vector3(0, 10, G.ARCH.z), new THREE.Vector3(45, 10, G.ARCH.z)],       // 18 m wide, 22 m high
    finArchEast: [V3(quadPoint(1, A1[0], G.FING - 16, 30)), V3(quadPoint(1, A1[0], G.FING - 16, 0)), V3(quadPoint(1, A1[0], G.FING - 16, -30))], // leaning arch, 22 m wide, 37 m high
    quadrantEndWest: V3(quadPoint(-1, G.QR, 0, 0)), quadrantEndEast: V3(quadPoint(1, G.QR, 0, 0)),
    reveal: { position: new THREE.Vector3(0, 14, -90), lookAt: G.DIAL.clone() },
    toe: new THREE.Vector3(0, 0, 0), kioskTop: new THREE.Vector3(0, G.SLABY + 22, G.KZ),
    bowl: new THREE.Vector3(G.BOWL.x, 0, G.BOWL.z),
    seedlings: seed.sites.map((s) => V3(s.p)),
  };
  let driven = false; const fixedU = dbg.get('stairU');
  const R = Number(dbg.get('stairR')) || 300, cdb = dbg.get('stairC');
  const center = cdb ? V3(cdb.split(',').map(Number)) : new THREE.Vector3(0, 125, 285);
  return {
    object, radius: R, height: cdb ? R : 300, center, anchors, style,
    stats: { triangles: b.triangles + (floor ? 384 : 0) + seed.mesh.count * 13 },
    shadowArc, scalePoint,
    setProgress(u) { driven = true; style.setProgress(u); },   // the world calls this every frame with its u
    update(dt, time, camera) {
      style.setTime(time);
      if (!driven) style.setProgress(fixedU != null ? Number(fixedU) : 0.02 + 0.25 * (0.5 - 0.5 * Math.cos(time * 0.1)));   // alone in the viewer: the morning loops
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
