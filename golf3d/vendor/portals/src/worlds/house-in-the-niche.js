// The House in the Niche.
//
// One upper room of a coral-stone merchant's house in Lamu, built five times life size, five times over,
// end to end down -z. In the central niche of its niche wall stands a model of the house; we fly in at
// the model's door and come out at the stairhead of the same room an hour later: white morning, noon
// lace, a green squall, a rose sunset, a night with stars and one flame, and the portal in the last door.
//
// HOW IT IS MADE
//   The room is ONE geometry (shell, niche wall, china, bed, chest, mats, poles, shutters, curtains) and
//   one ShaderMaterial family, cloned per level so every level has its own light uniforms and all of them
//   share one compiled program. Light is analytic in room-local space: the sun is traced from each point
//   to the room's box and passes only where the box has an opening (sea door, shutters, roof grille, west
//   windows); lace is a lattice function at the opening. So a level lights itself the same at any scale.
//   Levels are nested groups: level n+1 is a child of level n with pose P(q) = uniform scale 16^(q-1)
//   about its house-door centre, the centre moving from its seat on the sill to its station 20 m behind
//   the arch. q is a smoothstep of the camera's place in room n (a pure function of u). The room the
//   camera is in is therefore always still and full size. At most three levels are drawn.
//   Outside every opening one panel shader paints that hour's sea and sky by view ray (horizon, glitter,
//   dhow, stars, bats, and on a rare visit the parrot's eye). Shafts are additive sheets extruded along
//   the light in the vertex shader. Dust is one kit particle field.
//
// SECTIONS: looks (the five hours x three seasons) | room shader | sea and shaft shaders | geometry:
//   shell, niche wall and china, furniture, perch and parrot, panels and shafts | build(): levels, path,
//   update.
//
// SCRIPT (u): room 1 0-0.17 (the first view: one white band of sun from the sea door across the mat, the walls in blue shade;
//   bed and chest in the band 0.05-0.08, parrot asleep beside the arch 0.11-0.13, dive 0.09-0.168), room 2 0.21-0.376,
//   room 3 0.396-0.540 (the squall: curtains streaming flat, jasmine streaking left, a gleam crossing the niche wall, the
//   parrot riding its ring with wings out), room 4 0.550-0.792 (a rose sail and bats in the sea door; rare: the eye at the
//   sea door 0.638-0.725, blinking at 0.678 and 0.697), room 5 0.831-1 (the model's door closes round the portal 0.90-0.966).
//   THE FLIGHT (see makeFlight): the old straight route down the axis is kept everywhere except u 0.385-0.66, where two
//   loops are flown instead. Room 3: off the stairhead (0.396) down to the west half of the niche wall, a slow pass along
//   the shelves 6 m out at bottle height (0.422-0.45, the still at 0.43), up past the parrot on its ring against the sea
//   door (0.475), a U-turn at the south end (0.49-0.517) and back onto the old line by 0.52, so the dive is the old dive.
//   Room 4: off the stairhead (0.550) down to the model's own door, 4 m from it at 0.61 with the night room in the doorway,
//   away past the bed and round by the south wall (0.64-0.655), on the old line again from 0.66. The engine still sees a
//   path 769 m long: its distance d maps to the real metres S(u) that the planner lays down against the engine's own pace
//   table and speed lag, so the real speed follows SPEED and the fixed places fall on their u. On top of that plan the
//   pace is made brisker everywhere but at the two close views (brisk() in makeFlight: pace only, no place moves), and the
//   flight takes about 67 s. At u 0.16 and 0.79 the camera stands 8 m and 3.8 m further on than the old route (lead()), clear of the
//   door leaves; that offset is zero by 0.12/0.205 and 0.745/0.83. On the loops the gaze is the world's (gaze(): the
//   shelves, the ring at rest so that the parrot swings across a still room, the sea door, the model, the niche wall) and
//   the bank is held near level. The path knows the engine's request for the camera's place by the camera's own vector and
//   gives the world's aim only to the look-ahead request that follows it; anything else that asks (a companion) gets the
//   real route, so many real metres ahead.
//   GLASS: bottles are lathes cut fine where the camera passes; the room shader gives them a dark outline, a lighter
//   saturated core, the sea door as one narrow streak and its echo through the glass; each throws an additive pool of its
//   colour on the niche floor, the shelf and the plaster behind (buildPools). Niche mouldings carry a chain that follows
//   the arch. Dust stands low over the floor (kit) and as motes inside the beams only (buildMotes).
//   The path starts on the stairhead, inside the room, so the first view is the room with its niche wall a third of the frame wide.
//   The sail is placed by where it should stand in the sea door as seen from the camera (uDhow), a little further
//   along each hour. Each level's material clone has its own joint vectors (a clone shares array uniforms).
//   A wedding week stains some of the sun near the niche wall and throws a streak across the floor from each bottle of the
//   lowest tier. Shafts stop at the walls. The veil that hides the portal is drawn first of the transparent things.
//   Sunset (room 4): the walls stand in violet shade and the low sun through the two west windows lies across the floor,
//   the bed and the chest as two rose-gold bars (uBarDir, uBarCol; the west shafts follow the same direction and are not
//   drawn over the dark of the arch); bats cross the sea door and the west windows. Night: the moon's pool on the mat is
//   thrown back up the lower walls (uLowFill). The reveal of the great arch carries two chain mouldings and cut flowers and
//   falls from the room's light at its mouth into shade. A lantern of brass and coloured glass hangs on a chain of links at
//   (-17, 23..30, -36). The rare visitor slides across the sea door while it looks (in from the far jamb, out by the near).
//   THE DARK BEHIND AN ARCH is the design's indigo (INDIGO, the scene's background and the veil's colour), never lighter
//   than 0.8 of the darkest shaded plaster of the room the camera is in (the back of a niche: L.dark per level, blended
//   between rooms by the camera's metres down the house, which is where it stands and no clock). The model's front goes
//   into that colour by its metres behind the arch's opening (20..65 m, in the part's shader; the near parts are untouched).
//   In the 20 m gap dust stands (buildGapDust, its own stream 'gap-dust:'), lit by the room's light through the arch and
//   by the model's door within a door and a half, drifting toward the room on the clock, each drawn as long as it drifts
//   in half a second. THE STAIR DOORWAY's reveal (the frame's inner faces, 1 m deep, and its sill) is the shell's stone
//   with the arch's chain at the frame's scale, lit by half the room's sky and bounce and a little of its sea door, full
//   at the room's edge and 0.45 at the passage's; at night it takes the moon's blue on its room edge. NIGHT BY MOONLIGHT:
//   the night look only (uRim, uBody, uNicheAmb, uLowFloor; the day rooms keep 0, 1, 0.8, 0.8 and are drawn as before):
//   blue-white moon, indigo plaster, deeper niches, a blue-white rim on the moon's side of every piece of china and a
//   dark body, a little of the same moon on the niche mouldings. No warm light is added.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, Acc, M, ni, niSmooth, bevelBox, archPath, lathe, rosetteGeo, quadGeo } from '../parts/house-in-the-niche.js';

const PAL = ['#F4F1E6', '#2A4FA8', '#B9B24A', '#E58A7A', '#1B2450', '#3B2A20', '#F2A33A'];
const ROOM_L = 110, HALF_W = 35, ROOM_H = 44, PITCH = 160, GAP = 20, PASS = 30;
const SEAT = new THREE.Vector3(0, 8.03 + 18 / 16, -113.2), STATION = new THREE.Vector3(0, 18, -(ROOM_L + GAP));
// The dark behind every arch: the design's indigo, taken as a linear colour (see darkOf in build: deeper where the room is dark).
// (It was '#080b22', a tenth of this: under the tone curve's foot, so it reached the screen as plain black.)
const INDIGO = '#1B2450';
// material ids of the room shader (aMH.x); aMH.y is a per-material parameter
const R_PLASTER = 0, R_WOOD = 1, R_CARVED = 2, R_BRASS = 3, R_FLOOR = 4, R_CLOTH = 5, R_CHINA = 6, R_GLASS = 7, R_SHUTTER = 8,
  R_COVER = 9, R_LEAF = 10, R_FEATHER = 11, R_EMIS = 12, R_GRILLE = 13, R_CHAIN = 14;
// mover kinds (aPiv.w)
const K_CHINA = 1, K_PEND = 2, K_LID = 3, K_SPILL = 4, K_BODY = 5, K_HEAD = 6, K_WINGL = 7, K_WINGR = 8, K_TAIL = 9, K_GECKO = 10, K_FLAME = 12;

const C3 = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// ---------------------------------------------------------------- the five hours
// Directions are TO the light, room-local (x right, y up, -z toward the niche wall). Colours are [hex, strength].
// shaft: strength of the beams from [sea door, roof grille, west windows, shutters].
function makeLooks(season) {
  const L = [
    { name: 'morning', caust: 0.5, sun: [0.63, 0.27, -0.73], sunC: ['#fff1d6', 10.0], sky: ['#5682f0', 0.36], bounce: ['#a4b4e8', 0.07], glow: ['#c0d6ff', 0.7],
      haze: ['#a8c0f0', 0.0003], top: '#5f9ee6', hor: '#c4e2ee', water: '#7fd0b8', deep: '#3f9f96', wind: 0.14, dhow: -3.4, lace: 1, slits: 0, spill: 0,
      gleam: 0, areaK: 280, wallFill: 0.15, lamp: 0, stars: 0, shaft: [2.4, 0.1, 0, 0.6], cover: 0.12, lid: 0, pose: 0, door: ['#fff6e2', 2.0], hero: 'morning', stain: ['#ffd27a', '#ff7a8a'], ceil: ['#aab4e0', 0.12], pool: 0.7 },
    { name: 'noon', caust: 0.75, sun: [-0.25, 0.94, -0.22], sunC: ['#ffeec4', 4.6], sky: ['#5e5058', 0.46], bounce: ['#b8854e', 0.58], glow: ['#fff1d4', 0.8],
      haze: ['#5a4030', 0.0012], top: '#cfdcea', hor: '#f6f2e2', water: '#19b8b2', deep: '#0c8f9c', wind: 0.22, dhow: -1.6, lace: 1, slits: 0, spill: 0,
      gleam: 0, lamp: 0, stars: 0, shaft: [0.1, 0.5, 0, 0.12], cover: 0.3, lid: 1.25, pose: 1, door: ['#ffe9b4', 2.2], hero: 'noon', stain: ['#e0243a', '#2fae4e'], ceil: ['#b8854e', 0.17], pool: 1.0 },
    { name: 'storm', caust: 0.55, sun: [0.9, 0.3, -0.3], sunC: ['#ddd24a', 2.5], sky: ['#7266b6', 0.72], bounce: ['#50407c', 0.4], glow: ['#cfc840', 2.7],
      haze: ['#55508a', 0.0022], top: '#6c6a9e', hor: '#e6de6c', water: '#b6ba3c', deep: '#5e6e2a', wind: 1.0, dhow: 0.5, lace: 1, slits: 0, spill: 0,
      gleam: 1.0, areaK: 260, lamp: 0, stars: 0, shaft: [0.7, 0.05, 0, 0.2], cover: 0.5, lid: 0, pose: 2, door: ['#bcbc74', 1.7], hero: 'storm', stain: ['#d6c84a', '#58b08a'], ceil: ['#8676b4', 0.22], pool: 1.25 },
    { name: 'sunset', caust: 0.5, sun: [-0.88, 0.22, 0.42], sunC: ['#ff8466', 3.6], sky: ['#4a3cc4', 0.64], bounce: ['#7648b6', 0.44], glow: ['#dc9cc4', 0.95],
      haze: ['#3a2c78', 0.0018], top: '#5a4aa8', hor: '#f0a0a0', water: '#a86a9e', deep: '#5c4290', wind: 0.28, dhow: 2.6, lace: 1, slits: 0, spill: 0.6,
      gleam: 0, lamp: 0, stars: 0.15, shaft: [0, 0, 1.1, 0], bar: ['#ffa462', 4.0], barDir: [-1, 0.6, -0.42], cover: 0.68, lid: 0, pose: 3, door: ['#ff9a80', 2.0], hero: 'sunset', stain: ['#a05cff', '#ff5a9a'], ceil: ['#b070a8', 0.2], pool: 1.1 },
    // night, by the moon: a blue-white moon through the grille (the lace), and for the rest a low moon-grey blue, not one
    // saturated blue, so that the plaster is the design's indigo, each niche is deeper, and every piece of china in the wall has
    // a dark body (body) and a moonlit rim (rim). nicheAmb: how much of the room's ambient reaches into a niche (0.8 by day).
    { name: 'night', caust: 0.5, sun: [0.3, 0.85, 0.42], sunC: ['#d6e2ff', 5.2], low: 0.3, lowFloor: 0.5, sky: ['#8c9cf0', 0.15], bounce: ['#8c9cf0', 0.08], glow: ['#8c9cf0', 1.0],
      haze: ['#10173c', 0.002], top: '#080c2a', hor: '#2c4296', water: '#0c1638', deep: '#040714', wind: 0.12, laceDrift: 0.6, dhow: 3.0, lace: 1, slits: 0, spill: 0,
      gleam: 0, lamp: 1, stars: 1, shaft: [0.05, 0.4, 0, 0.1], cover: 0.86, lid: 0, pose: 4, door: ['#6f8cff', 1.6], hero: 'night', stain: ['#4f7cff', '#7fd0ff'], ceil: ['#8c9cf0', 0.12], pool: 1.3,
      nicheAmb: 0.8, rim: ['#d6e2ff', 0.5], body: 0.5 },
  ];
  if (season === 'kaskazi') {
    // the dry north-east season: hard gold light, no squall; room 3 is a white-hot afternoon behind slitted shutters
    L[0].sunC = ['#ffe2a0', 10.0]; L[0].sky = ['#5a7ce6', 0.36]; L[0].bounce = ['#c8bcc0', 0.07]; L[0].glow = ['#e6e0f4', 0.62]; L[0].haze = ['#c0bcd4', 0.0004];
    L[0].top = '#7fa8d8'; L[0].hor = '#eedcaa'; L[0].water = '#5fb8a8'; L[0].door = ['#ffe4a8', 2.0];
    L[1].sunC = ['#ffdc90', 5.0]; L[1].bounce = ['#c4904e', 0.62]; L[1].top = '#e8dcb8'; L[1].hor = '#fbf0cc';
    Object.assign(L[2], { name: 'afternoon', sun: [0.8, 0.5, -0.2], sunC: ['#fff0c0', 4.4], sky: ['#5b5570', 0.5], bounce: ['#c79a62', 0.55], glow: ['#ffe2a8', 0.75],
      haze: ['#6a4a2a', 0.0015], top: '#e6dcc0', hor: '#fff4d0', water: '#2fb0a4', deep: '#148a90', wind: 0.3, slits: 1, gleam: 0, areaK: 800, shaft: [0.1, 0.1, 0, 0.5],
      door: ['#ffdf98', 2.2], hero: 'noon', pose: 1, stain: ['#ffb040', '#ff6a3a'], ceil: ['#c79a62', 0.17], reveal: 2.6 });
    L[3].sunC = ['#ff9a50', 3.8]; L[3].hor = '#ffb070'; L[3].water = '#b8706a'; L[3].deep = '#6a4078';
    L[4].sunC = ['#e4e0fa', 5.4]; L[4].low = 0.36; L[4].rim = ['#e4e0fa', 0.5];
  } else if (season === 'wedding') {
    L[0].bounce = ['#d8c0d8', 0.09]; L[0].hor = '#d4e0f0'; L[3].sunC = ['#ff9262', 3.7];
  }
  return L;
}

// ---------------------------------------------------------------- room shader (one program for every level)
const ROOM_VERT = /* glsl */`
attribute vec3 color;
attribute vec2 aMH;
attribute vec4 aPiv;
uniform mat4 uToLocal;
uniform float uTime, uWind, uLevel, uLid, uCover, uParrot, uLampOn, uFrond;
uniform vec4 uJ[4];
uniform vec3 uGeck[2];
varying vec3 vCol, vN, vL, vV, vP0, vN0;
varying vec2 vMH;
varying vec4 vPv;
varying float vWD;
vec3 rotv(vec3 v, vec3 ax, float a) { float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1. - c); }
void main() {
  vec3 p = position, n = normal, pv = aPiv.xyz;
  float mat = aMH.x, k = aPiv.w;
  float id = fract(sin(dot(pv, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  vP0 = position; vN0 = normal; vMH = aMH; vCol = color; vPv = vec4(pv, id);
  if (k > 0.5 && k < 1.5) {            // china: rocks in the wind; some pieces are missing or turned, differently in each room
    float gone = step(fract(id * 7.31 + uLevel * 0.37), 0.13);
    float turned = step(fract(id * 3.71 + uLevel * 0.61), 0.1) * 3.14159;
    float a = uWind * uWind * 0.2 * sin(uTime * (5. + 3. * id) + id * 40.);
    vec3 d = rotv(rotv(p - pv, vec3(0., 1., 0.), turned), vec3(0., 0., 1.), a);
    p = pv + d * (1. - gone); n = rotv(rotv(n, vec3(0., 1., 0.), turned), vec3(0., 0., 1.), a);
  } else if (k < 2.5 && k > 1.5) {     // pendulum
    float a = 0.32 * sin(uTime * 2.4 + id * 6.);
    p = pv + rotv(p - pv, vec3(0., 0., 1.), a); n = rotv(n, vec3(0., 0., 1.), a);
  } else if (k < 3.5 && k > 2.5) {     // chest lid, hinged along z
    p = pv + rotv(p - pv, vec3(0., 0., 1.), -uLid); n = rotv(n, vec3(0., 0., 1.), -uLid);
  } else if (k < 4.5 && k > 3.5) {     // cloth spilling from the open chest
    p = pv + (p - pv) * smoothstep(0.1, 1., uLid);
  } else if (k > 4.5 && k < 9.5) {     // the parrot: body, head, wings, tail
    if (k > 5.5) { vec4 j = uJ[int(k - 5.5)]; vec3 ax = normalize(j.xyz + vec3(1e-5, 0., 0.)); p = pv + rotv(p - pv, ax, j.w); n = rotv(n, ax, j.w); }
    vec3 feet = vec3(0., -26.8, 0.);
    p.y += (p.y - feet.y) * 0.02 * sin(uTime * 1.6);
    p = feet + (p - feet) * uParrot;
  } else if (k > 9.5 && k < 11.5) {    // geckos
    p += uGeck[int(k - 9.5)];
  } else if (k > 11.5) {               // the lamp flame: leans, and is not there by day
    float h = clamp((p.y - pv.y) / 1.4, 0., 1.);
    p.x += h * h * (0.28 * sin(uTime * 3.1) + 0.16 * sin(uTime * 7.3));
    p.z += h * h * 0.2 * sin(uTime * 4.7 + 1.);
    p = pv + (p - pv) * uLampOn * (0.92 + 0.08 * sin(uTime * 11.));
  }
  if (abs(mat - 5.) < 0.5) {           // cotton curtains: breathe, and stream into the room in the squall
    float w = aMH.y, ph = position.z * 0.33 + position.y * 0.2, dirx = -sign(position.x);
    float g = sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.9 + ph * 2.3) * 0.25;
    float wl = min(uWind, 0.4);
    p.x += dirx * w * (1.0 + 1.1 * g + wl * (9. + 3.5 * g));
    p.z += w * 0.4 * sin(uTime * 0.9 + position.y * 0.5) * (1. + 2. * wl);
    p.y += w * w * wl * 5.;
    n = normalize(n + vec3(0., 0., 0.4 * cos(uTime * 1.3 + ph) * w));
    // the squall: the two sea-door curtains stream flat, a third of the way across the room, as flags do
    float sw = smoothstep(0.5, 0.95, uWind) * step(32., position.x) * step(0.0005, w);
    if (sw > 0.001) {
      float s = pow(max(w, 0.), 0.6667), Lc = 22.9;
      float th0 = 0.78 + 0.1 * sin(uTime * 1.7 + position.z * 0.21), kk = 0.74 + 0.08 * sin(uTime * 2.3 + position.z * 0.13 + 1.);
      float a = th0 + kk * s;
      float rip = (0.2 + s) * s * (0.8 * sin(s * 9.5 - uTime * 7.3 + position.z * 0.7) + 0.4 * sin(position.z * 4.1 + s * 5. - uTime * 5.1));
      vec3 ps = vec3(position.x - Lc * (cos(th0) - cos(a)) / kk - cos(a) * rip, 23.4 - Lc * (sin(a) - sin(th0)) / kk + sin(a) * rip,
        position.z + s * 1.3 * sin(uTime * 2.1 + position.z * 1.3 + s * 5.) + (position.z < -80. ? 1. : -1.) * s * 1.6);
      float dr = (0.2 + s) * 0.9 * cos(s * 9.5 - uTime * 7.3 + position.z * 0.7);
      vec3 ns = vec3(cos(a) * normal.x - dr * sin(a) * normal.x, -sin(a) * normal.x - dr * cos(a) * normal.x, 0.);
      p = mix(p, ps, sw); n = normalize(mix(n, ns, sw) + vec3(0., 1e-4, 0.));
    }
  } else if (abs(mat - 9.) < 0.5) {    // the bed cover: thrown back further each hour, lifting in the wind
    float t = aMH.y, f = 1. - uCover * 0.82;
    if (t > f) { p.z = -72. + 12. * (2. * f - t); p.y = 5.75 + 0.5 * smoothstep(0., 0.2, t - f) + 0.2 * sin(position.x * 2.1); p.x = clamp(p.x, 11.9, 22.1); n = vec3(0., 1., 0.); }
    p.y += uWind * 0.7 * max(sin(uTime * 3.3 + position.x * 0.8), 0.) * smoothstep(0.2, 0.9, t);
  } else if (abs(mat - 10.) < 0.5) {   // leaves and fronds
    float w = aMH.y;
    p += vec3(sin(uTime * 1.7 + position.y * 0.8), 0.35 * sin(uTime * 2.3 + position.z), cos(uTime * 1.3 + position.x * 0.6)) * w * (0.22 + 1.5 * uWind);
    p.y -= uFrond * step(38., position.x) * 15. * smoothstep(-4., 14., position.y);      // the fronds outside the sea door, pressed down by the rare visitor
  }
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec4 lp = uToLocal * wp;
  vL = lp.xyz;
  vN = mat3(uToLocal) * (mat3(modelMatrix) * n);
  vV = (uToLocal * vec4(cameraPosition, 1.)).xyz - vL;
  vWD = distance(cameraPosition, wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const GLSL_COMMON = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p) { return vn(p) * 0.58 + vn(p * 2.3 + 7.1) * 0.29 + vn(p * 5.1 + 3.7) * 0.13; }
float rect(vec2 p, vec2 lo, vec2 hi, float s) { vec2 a = smoothstep(lo - s, lo + s, p) * (1. - smoothstep(hi - s, hi + s, p)); return a.x * a.y; }
// pierced stars of the shutters and lozenges of the roof grille: 1 = open; w widens the edge with distance
float starHole(vec2 p, float w) {
  vec2 f = abs(fract(p / 1.15 + vec2(0., 0.5 * floor(p.x / 1.15))) - 0.5);
  float d = sqrt(f.x) + sqrt(f.y);
  return 1. - smoothstep(0.56 - w, 0.6 + w, d);
}
float lozenge(vec2 p, float w) {
  vec2 f = abs(fract(p / 0.8) - 0.5);
  return 1. - smoothstep(0.3 - w, 0.34 + w, f.x + f.y);
}
`;

const ROOM_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uBounce, uGlowCol, uHaze, uLampPos, uLampCol, uStainA, uStainB, uBarDir, uBarCol, uLowFill;
uniform float uTime, uLevel, uHazeK, uStain, uSlits, uSpill, uLace, uGleam, uEmis, uGold, uCaust, uAreaK, uWallFill, uLaceDrift, uNicheSun, uReveal;
uniform vec3 uCeil, uWallTint, uBarDir2, uRim, uStone;
uniform float uNicheAmb, uBody, uLowFloor;
varying vec3 vCol, vN, vL, vV, vP0, vN0;
varying vec2 vMH;
varying vec4 vPv;
varying float vWD;
${GLSL_COMMON}
float carve(vec2 p) {
  vec2 f = fract(p / 1.3) - 0.5;
  float r = length(f), a = atan(f.y, abs(f.x) + 1e-4);
  float pet = 0.5 + 0.5 * cos(a * 8.);
  float h = smoothstep(0.035, 0.1, r) * smoothstep(0.37, 0.3, r) * (0.35 + 0.65 * pet * pet);
  h += smoothstep(0.035, 0.0, abs(r - 0.415)) * 0.9;
  float d = abs(f.x) + abs(f.y);
  h += smoothstep(0.6, 0.68, d) * (0.55 + 0.45 * step(0.5, fract(d * 9.)));
  return clamp(h, 0., 1.);
}
// how much of the sun reaches p: trace to the room's box and ask whether the box is open there
float openMask(vec3 p, vec3 L) {
  p = clamp(p, vec3(-34.8, 0.02, -109.8), vec3(34.8, 43.9, -0.2));
  vec3 Ls = (step(0., L) * 2. - 1.) * max(abs(L), vec3(1e-3));
  vec3 tb = (mix(vec3(-35., 0., -110.), vec3(35., 44., 0.), step(0., L)) - p) / Ls;
  float t = min(tb.x, min(tb.y, tb.z));
  vec3 e = p + L * t;
  float soft = 0.2 + 0.012 * t, m = 0.;
  if (tb.x <= tb.y && tb.x <= tb.z) {
    if (L.x > 0.) {
      m = rect(e.zy, vec2(-90., 0.), vec2(-70., 24.), soft);
      float sh = rect(e.zy, vec2(-58., 9.), vec2(-46., 25.), soft) + rect(e.zy, vec2(-106., 9.), vec2(-96., 25.), soft);
      m += sh * starHole(e.zy, soft * 0.05) * (1. - uSlits);
      float sl = 1. - smoothstep(0.1, 0.16 + soft * 0.06, abs(fract(e.y / 1.5) - 0.5));
      m = max(m, uSlits * sl * rect(e.zy, vec2(-108., 2.), vec2(-36., 34.), soft) * (1. - 0.9 * rect(e.zy, vec2(-90., 0.), vec2(-70., 24.), soft)));
    } else {
      m = rect(e.zy, vec2(-100., 24.), vec2(-88., 40.), soft) + rect(e.zy, vec2(-82., 24.), vec2(-70., 40.), soft);
      m += uSpill * rect(e.zy, vec2(-108., 12.), vec2(-40., 42.), 5.);
    }
  } else if (tb.y <= tb.z) {
    m = rect(e.xz, vec2(-10., -70.), vec2(10., -40.), soft) * mix(1., lozenge(e.xz + uLaceDrift * uTime * vec2(1., 0.37), soft * 0.12), uLace);
  }
  return min(m, 1.);
}
// the low sun through the two high west windows as it falls across the room: two long bars, ruled by the window bars
float westBars(vec3 p, vec3 Lb) {
  float t = (p.x + 35.) / max(-Lb.x, 0.05);
  vec3 e = p + Lb * t;
  float soft = 0.22 + 0.012 * t;
  float m = rect(e.zy, vec2(-100., 24.), vec2(-88., 39.), soft) + rect(e.zy, vec2(-82., 24.), vec2(-70., 39.), soft);
  float bar = abs(fract(e.z * 0.5 + 0.5) - 0.5) * 2.;
  return m * (1. - 0.6 * smoothstep(0.5, 0.12, bar));
}
// a chain of oval links along x, each joined to the next by a link seen edge on, between two beads; 0 .. 1
float chainH(vec2 p) {
  float f = fract(p.x / 0.62) - 0.5, v = p.y / 0.26;
  float ring = smoothstep(0.2, 0.08, abs(length(vec2(f * 2.25, v)) - 0.72));
  float bar = smoothstep(0.34, 0.2, abs(v)) * smoothstep(0.26, 0.36, abs(f));
  return max(max(ring, bar) * smoothstep(1.3, 1.05, abs(v)), 0.75 * smoothstep(0.34, 0.12, abs(abs(v) - 2.05)));
}
// the reveal of the great arch through the 6 m wall: a chain moulding at its mouth, another at its back, cut flowers between
float revealH(vec2 q) {          // q = (metres into the wall, metres along the arch)
  float h = chainH(vec2(q.y, q.x - 0.9) / 1.5) + chainH(vec2(q.y, q.x - 5.1) / 1.5);
  return h + step(1.9, q.x) * step(q.x, 4.1) * carve(vec2(q.y, q.x - 1.7) * 1.18) * 0.9;
}
void main() {
  float mat = vMH.x;
  vec3 an = abs(vN0);
  vec2 pc = an.z > max(an.x, an.y) ? vP0.xy : (an.x > an.y ? vP0.zy : vP0.xz);
  vec3 T = an.z > max(an.x, an.y) ? vec3(1., 0., 0.) : (an.x > an.y ? vec3(0., 0., 1.) : vec3(1., 0., 0.));
  vec3 B = an.y > max(an.x, an.z) ? vec3(0., 0., 1.) : vec3(0., 1., 0.);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 L = normalize(uSunDir + vec3(0., 1e-5, 0.));
  vec3 V = normalize(vV + vec3(0., 1e-5, 0.));
  vec3 alb = vCol, ecol = vCol;
  float gloss = 0., emis = 0., thin = 0., occ = 1., rimP = 0.;
  vec2 bump = vec2(0.);
  if (mat < 0.5) {             // lime plaster: trowel marks, hairline cracks, damp near the floor, a worn dado
    float n1 = fbm(pc * 0.3), n2 = fbm(pc * 2.1 + 5.);
    alb *= 0.84 + 0.22 * n1;
    alb *= 1. - 0.1 * smoothstep(0.6, 0.95, vn(vec2(pc.x * 1.7, pc.y * 0.06 + 3.))) * (1. - an.y);
    float crack = smoothstep(0.012, 0.0, abs(fbm(pc * 0.16 + 9.) - 0.5)) * smoothstep(0.5, 0.65, vn(pc * 0.07 + 2.));
    alb *= 1. - 0.14 * crack;
    alb *= 1. - 0.2 * smoothstep(7., 0., vL.y) * (1. - an.y) * (0.4 + 0.6 * n2);
    bump = (vec2(fbm(pc * 2.1 + vec2(5.14, 5.)), fbm(pc * 2.1 + vec2(5., 5.14))) - n2) * 1.3;
    // the two long walls: a polished dado, a band of carved rosettes between chain borders at sill height, and the
    // same band again above the doors
    if ((an.x > 0.6 && abs(abs(vP0.x) - 35.) < 0.3) || (an.z > 0.6 && abs(vP0.z) < 0.3 && (abs(vP0.x) > 10.2 || vP0.y > 31.6))) {
      float y = vP0.y, yb = y < 18. ? 6.9 : 28.4, dy = abs(y - yb);
      if (dy < 1.3) {
        vec2 cq = vec2(pc.x, y - yb + 1.3);
        float h0 = carve(cq), hx = carve(cq + vec2(0.035, 0.)), hy = carve(cq + vec2(0., 0.035));
        bump += vec2(h0 - hx, h0 - hy) * 3.4;
        alb *= 0.56 + 0.62 * h0;
      } else if (dy < 1.9) {
        vec2 c = vec2(pc.x + pc.y, pc.x - pc.y) * 1.5;
        float lk = smoothstep(0.1, 0.2, abs(length(fract(c) - 0.5) - 0.3));
        bump += (fract(c) - 0.5) * (1. - lk) * 1.8;
        alb *= (0.7 + 0.34 * lk) * (1. - 0.3 * smoothstep(1.78, 1.9, dy) - 0.2 * smoothstep(1.42, 1.3, dy));
      } else if (y < 5.) {
        alb *= vec3(0.8, 0.71, 0.66) * (0.9 + 0.2 * n2);
      }
    }
    float hwA = vP0.y < 26. ? 10.4 : 10.6 * sqrt(max(1. - (vP0.y - 26.) * (vP0.y - 26.) / 108., 0.));
    if (vP0.z < -110.05 && an.z < 0.5 && abs(vP0.x) < hwA && vP0.y > 7.9) {
      bool jamb = an.x > an.y;
      vec2 q = vec2(-110. - vP0.z, jamb ? vP0.y : vP0.x);
      float h0 = revealH(q), hz = revealH(q + vec2(0.04, 0.)), hs = revealH(q + vec2(0., 0.04));
      // pc runs (z, y) on the jambs and (x, z) round the crown: turn the slope into that frame
      bump += (jamb ? vec2(hz - h0, h0 - hs) : vec2(h0 - hs, hz - h0)) * 3.2;
      alb *= 0.66 + 0.46 * min(h0, 1.);
    }
  } else if (mat < 1.5) {      // wood
    float g = vn(vec2(pc.x * 9., pc.y * 0.45)) * 0.6 + vn(vec2(pc.x * 23., pc.y * 1.1)) * 0.4;
    alb *= 0.68 + 0.6 * g;
    bump = vec2(g - vn(vec2(pc.x * 9. + 0.9, pc.y * 0.45)), 0.) * 0.5;
    gloss = 0.16;
  } else if (mat < 2.5) {      // chip-carved wood
    float h0 = carve(pc), hx = carve(pc + vec2(0.03, 0.)), hy = carve(pc + vec2(0., 0.03));
    bump = vec2(h0 - hx, h0 - hy) * 3.;
    alb *= (0.5 + 0.8 * h0) * (0.8 + 0.4 * vn(vec2(pc.x * 7., pc.y * 0.6)));
    gloss = 0.1 + 0.4 * h0;
  } else if (mat < 3.5) {      // brass
    gloss = 1.;
  } else if (mat < 4.5) {      // the floor: polished lime under woven palm mats
    vec2 q = vL.xz;
    float m1 = rect(q, vec2(-27., -99.), vec2(8.5, -20.), 0.05), m2 = rect(q, vec2(9.5, -58.), vec2(32., -40.), 0.05), m3 = rect(q, vec2(-30., -18.), vec2(30., -11.), 0.05);
    float onMat = max(m1, max(m2, m3));
    vec2 w = q / 0.55, wi = floor(w), wf = fract(w) - 0.5;
    float over = mod(wi.x + wi.y, 2.);
    float strand = over > 0.5 ? abs(wf.x) : abs(wf.y);
    vec3 palm = vec3(0.62, 0.52, 0.27) * (0.72 + 0.4 * h21(wi)) * (1. - 0.5 * smoothstep(0.3, 0.5, strand));
    float band = step(0.82, fract(q.y / 9.3)) + step(0.9, fract(q.x / 12.1 + 0.3));
    palm = mix(palm, mix(vec3(0.05, 0.08, 0.26), vec3(0.3, 0.08, 0.06), step(0.5, fract(q.y / 18.6))) * (0.8 + 0.4 * h21(wi + 3.)), clamp(band, 0., 1.) * 0.85);
    float edge = onMat * (1. - rect(q, vec2(-26., -98.), vec2(7.5, -21.), 0.05) - rect(q, vec2(10.5, -57.), vec2(31., -41.), 0.05) - rect(q, vec2(-29., -17.), vec2(29., -12.), 0.05));
    palm = mix(palm, vec3(0.07, 0.05, 0.035), clamp(edge, 0., 1.) * 0.8);
    float n1 = fbm(q * 0.22), n2 = fbm(q * 1.9 + 3.);
    vec3 lime = alb * (0.74 + 0.3 * n1) * (1. - 0.12 * smoothstep(0.05, 0.0, abs(fract(q.x / 7.) - 0.5) - 0.48));
    lime *= 1. - 0.25 * smoothstep(0.035, 0.0, abs(fbm(q * 0.13 + 4.) - 0.5));
    alb = mix(lime, palm, onMat);
    gloss = mix(0.55 + 0.25 * n2, 0.06, onMat);
    bump = mix((vec2(fbm(q * 1.9 + vec2(3.2, 3.)), fbm(q * 1.9 + vec2(3., 3.2))) - n2) * 0.25, vec2(wf.x, wf.y) * 0.5 * (over > 0.5 ? vec2(1., 0.) : vec2(0., 1.)), onMat);
    // contact shadow under the bed, the chest, the tray and the jasmine pot
    occ = 1. - 0.75 * rect(q, vec2(11.6, -72.4), vec2(22.4, -59.6), 1.6);
    occ *= 1. - 0.7 * rect(q, vec2(13.6, -52.4), vec2(20.4, -45.6), 1.4);
    occ *= 1. - 0.6 * smoothstep(5.5, 2.5, length(q - vec2(-6., -40.))) - 0.6 * smoothstep(5., 2., length(q - vec2(29., -64.)));
    occ = max(occ, 0.15);
  } else if (mat < 5.5) {      // cotton
    alb *= 0.88 + 0.12 * sin(pc.x * 7.) * sin(pc.y * 0.9); thin = 1.;
  } else if (mat < 6.5) {      // china: white glaze painted in the piece's colour
    vec3 d = vP0 - vPv.xyz; float R = max(vMH.y, 0.05), pat;
    if (vMH.y > 0.3) {
      vec2 c = (d.xy - vec2(0., R)) / R; float r = length(c), a = atan(c.y, c.x + 1e-4);
      pat = smoothstep(0.03, 0.0, abs(r - 0.9) - 0.05) + smoothstep(0.02, 0.0, abs(r - 0.56) - 0.012)
        + smoothstep(0.1, 0.0, abs(r - 0.72) - 0.02 - 0.09 * (0.5 + 0.5 * cos(a * (6. + floor(vPv.w * 5.) * 2.))))
        + smoothstep(0.34, 0.26, r) * (0.5 + 0.5 * cos(a * 5. + r * 20.)) * step(0.3, vPv.w);
      // the plate's turned lip (the outer 14 % of its radius) on the half toward the moon: see the rim at the end
      rimP = smoothstep(0.84, 0.9, r) * smoothstep(-0.3, 0.3, dot(c / max(r, 1e-3), normalize(L.xy + vec2(0., 1e-4))));
    } else {
      float a = atan(d.z, d.x + 1e-4);
      pat = step(0.82, fract(d.y * 1.6 + 0.1)) + step(0.55, fract(d.y * 0.8)) * smoothstep(0.2, 0.6, 0.5 + 0.5 * cos(a * 7.));
    }
    alb = mix(vec3(0.82, 0.84, 0.8), vCol, clamp(pat, 0., 1.) * 0.92);
    gloss = 0.6;
  } else if (mat < 7.5) {      // coloured glass: shaded below, once the light is known
    thin = 1.;
  } else if (mat < 8.5) {      // shutter pierced with stars
    if (starHole(pc, 0.0) > 0.5) discard;
    alb *= (0.75 + 0.35 * vn(vec2(pc.x * 6., pc.y * 0.5))) * (0.7 + 0.3 * smoothstep(0.0, 0.06, 0.5 - abs(fract(pc.x / 1.15) - 0.5)));
    alb = mix(alb, vec3(0.2, 0.13, 0.09), smoothstep(0.6, 0.72, fbm(pc * 1.1 + 2.)) * 0.6);
    gloss = 0.12;
  } else if (mat < 9.5) {      // the bed cover: red and indigo bands, or gold embroidery for a wedding
    vec2 q = vP0.xz;
    float st = fract(q.x / 2.5), w2 = sin(q.x * 40.) * sin(q.y * 40.);
    vec3 red = vec3(0.5, 0.045, 0.035), ind = vec3(0.04, 0.06, 0.22);
    alb = mix(red, ind, smoothstep(0.48, 0.52, st)) * (0.85 + 0.15 * w2);
    alb = mix(alb, vec3(0.75, 0.7, 0.55), smoothstep(0.03, 0.01, abs(st - 0.5)) + smoothstep(0.03, 0.01, min(st, 1. - st)));
    vec2 g = abs(fract(q / 1.25) - 0.5);
    float gd = smoothstep(0.05, 0.0, abs(g.x + g.y - 0.36)) + smoothstep(0.1, 0.05, length(g));
    alb = mix(alb, vec3(0.85, 0.55, 0.12), clamp(gd, 0., 1.) * uGold);
    gloss = 0.1 + 0.5 * uGold * clamp(gd, 0., 1.);
    bump = vec2(cos(q.x * 40.), cos(q.y * 40.)) * 0.08;
  } else if (mat < 10.5) {     // leaves
    alb *= 0.8 + 0.4 * vn(pc * 3.); thin = 0.6;
  } else if (mat < 11.5) {     // feathers: scalloped rows
    vec2 f = vec2(pc.x * 3.2 + 0.5 * floor(pc.y * 3.4), pc.y * 3.4);
    float sc = length(fract(f) - vec2(0.5, 0.9));
    alb *= 0.72 + 0.4 * smoothstep(0.3, 0.75, sc);
    bump = (fract(f) - 0.5) * 0.25;
  } else if (mat < 12.5) {     // things that shine by themselves
    emis = 1.;
    if (vMH.y > 1.5) {         // the lamp's flame: white-gold at the wick, amber at the tip, fading toward its outline
      float fh = clamp((vP0.y - vPv.y) / 1.4, 0., 1.), fe = max(dot(N, V), 0.);
      alb = vec3(0.);
      ecol = mix(vec3(1., 0.86, 0.56), vCol, smoothstep(0.05, 0.75, fh));
      emis = (0.2 + 0.8 * fe * fe) * mix(1.5, 0.6, fh);
    }
  } else if (mat < 13.5) {     // the roof grille: carved through in lozenges
    if (lozenge(vP0.xz, 0.0) > 0.5) discard;
    alb *= 0.7 + 0.4 * vn(pc * 2.);
  } else {                     // chain border in plaster
    float dm = vMH.y - 1.;
    if (dm > -0.5) {           // round a niche: a chain of links between two beads that follows the arch (see buildNicheWall)
      vec2 n2 = vPv.yz / max(length(vPv.yz), 1e-3), t2 = vec2(-n2.y, n2.x) * (n2.x < 0. ? -1. : 1.);
      vec2 q = vec2(vPv.x, dm - 0.27) / 0.44;
      float h0 = chainH(q), ha = chainH(q + vec2(0.07, 0.)), hb = chainH(q + vec2(0., 0.07));
      bump = ((h0 - ha) * t2 + (h0 - hb) * n2) * 2.4 * step(0.6, an.z);
      alb *= 0.72 + 0.38 * min(h0, 1.);
    } else {                   // round the great arch: a net of links
      vec2 c = vec2(pc.x + pc.y, pc.x - pc.y) * 1.3;
      float lk = smoothstep(0.12, 0.2, abs(length(fract(c) - 0.5) - 0.3));
      bump = (fract(c) - 0.5) * (1. - lk) * 1.6;
      alb *= 0.8 + 0.25 * lk;
    }
  }
  // The reveal of the stair doorway, where the passage meets the room: the inner faces of the room's own door frame (two jambs
  // at x = +-8, the lintel's soffit), one metre deep (z +0.05 .. -0.95). They are coral stone carrying one chain between two
  // beads on the flat of the face (0.56 m), as the great arch's reveal does at its own scale, and are lit by the room (below).
  float rvJ = step(abs(abs(vP0.x) - 8.11), 0.13) * step(an.z, an.x + 0.01) * step(6.9, vP0.y) * step(vP0.y, 29.9);
  float rvL = step(abs(vP0.y - 29.77), 0.14) * step(abs(vP0.x), 8.3) * step(an.z, an.y + 0.01) * step(vN0.y, 0.);
  float rv = step(1.5, mat) * step(mat, 2.5) * step(-1.05, vP0.z) * step(vP0.z, 0.1) * max(rvJ, rvL);
  if (rv > 0.5) {
    vec2 q = vec2(rvJ > 0.5 ? vP0.y : vP0.x, -vP0.z - 0.45) / 0.52;
    float h0 = chainH(q), ha = chainH(q + vec2(0.07, 0.)), hb = chainH(q + vec2(0., 0.07));
    // pc runs (z, y) on the jambs and (x, z) under the lintel: turn the slope into that frame
    bump = (rvJ > 0.5 ? vec2(h0 - hb, ha - h0) : vec2(ha - h0, h0 - hb)) * 2.6;
    alb = uStone * (0.7 + 0.42 * min(h0, 1.)) * (0.86 + 0.24 * fbm(pc * 0.9 + 3.));
    gloss = 0.;
  }
  N = normalize(N + T * bump.x + B * bump.y);
  float ndl = dot(N, L);
  float sun = openMask(vL + N * 0.25, L);
  float rec = smoothstep(0.05, 1.3, -110. - vL.z);
  sun *= mix(1., smoothstep(0.1, 0.5, L.z) * uNicheSun * smoothstep(-113.6, -111.6, vL.z), rec);
  sun *= 0.74 + 0.26 * smoothstep(0.3, 0.7, vn(vL.xz * 0.045 + vec2(uTime * 0.13, uTime * 0.05) * (1. + 6. * uLaceDrift)));   // cloud shade drifting over the pools
  // a wedding week: light that has passed the coloured bottles. Near the niche wall some of the sun arrives stained, in a
  // few sharp patches; and when the sun rakes the wall each bottle of the lowest tier throws a streak across the floor
  vec3 stainT = vec3(1.), thrown = vec3(0.);
  if (uStain > 0.001) {
    vec2 sc = (an.z > 0.5 ? vL.xy : vL.xz) / vec2(3.1, 3.7), ci = floor(sc), cf = fract(sc) - 0.5;
    float hh = h21(ci + 11.3), e = length((cf - (vec2(h21(ci + 3.1), h21(ci + 7.7)) - 0.5) * 0.4) * vec2(2.3, 1.));
    float nearK = an.z > 0.5 ? smoothstep(27., 15., vL.y) * step(vL.z, -100.) : smoothstep(-42., -64., vL.z) * step(0.5, an.y);
    float tw = 0.82 + 0.18 * sin(uTime * 0.9 + hh * 40.);
    float sunLum = dot(uSunCol, vec3(0.21, 0.72, 0.07));
    stainT = mix(vec3(1.), mix(uStainA, uStainB, step(0.5, h21(ci + 1.7))) * 1.5 * tw * sunLum / max(uSunCol, vec3(0.05)), smoothstep(0.36, 0.31, e) * step(0.66, hh) * nearK * uStain);
    float dz = vL.z + 109.4;
    if (an.y > 0.5 && dz < 14. && vL.y < 0.5) {
      float cx = (vL.x + 33.6) / 4.2, ix = floor(cx), h = h21(vec2(ix, 5.3)), len = 5. + 8. * h21(vec2(ix, 9.1));
      float fx = fract(cx) - 0.5 + dz * 0.03 * L.x, w = 0.17 * (1. - 0.7 * dz / len) + 0.02;
      float st = smoothstep(w, w - 0.03, abs(fx)) * smoothstep(0., 0.5, dz) * smoothstep(len, len - 1.2, dz) * step(0.34, h);
      st *= 0.6 + 0.9 * smoothstep(0.05, 0.0, abs(fx - 0.03 * sin(dz * 1.7 + h * 9.))) + 0.3 * sin(dz * 2.3 + uTime * 0.7 + h * 20.);
      thrown = mix(uStainA, uStainB, step(0.5, fract(h * 7.3))) * st * uStain * smoothstep(0.1, 0.4, L.z) * sunLum * 0.5 * tw;
    }
  }
  vec3 amb = mix(uBounce, uSky, 0.5 + 0.5 * N.y);
  amb *= (0.55 + 0.45 * smoothstep(-4., -60., vL.z)) * mix(1., 0.45, smoothstep(22., 44., vL.y)) * mix(1., uNicheAmb, rec) * (0.66 + 0.34 * smoothstep(35., 24., abs(vL.x)));
  vec3 toD = vec3(37., 12., -80.) - vL; float dd = dot(toD, toD);
  vec3 Ld = toD * inversesqrt(max(dd, 1.));
  float ndd = dot(N, Ld);
  // cloth takes the door's light from either side; the arch's two reveals take it alike
  float area = max(mix(mix(ndd, abs(ndd), thin), 0.35, rec) * 0.7 + 0.3, 0.) * uAreaK / (dd + uAreaK) * mix(1., 0.6, rec);
  // warm light thrown up from the sunlit floor
  float pool = openMask(vec3(vL.x, 0.1, vL.z), L) * max(L.y, 0.);
  // the niche wall takes the low sun warmer than the room does (sunset: rose-gold on every rim, violet in every niche)
  vec3 sunC = uSunCol * mix(vec3(1.), uWallTint, smoothstep(-104., -109.4, vL.z) * (1. - rec));
  vec3 lit = sunC * stainT * mix(max(ndl, 0.), abs(ndl) * 0.4 + 0.2, thin) * sun + (amb + uGlowCol * area) * occ + thrown;
  // the lit floor thrown up on the pole ceiling and the tops of the walls, so the grille is a hole in a ceiling and not in the night
  // (the poles and beams are dark wood: they are given more of it, or they would be a black lid in every dim hour)
  lit += uCeil * smoothstep(19., 40., vL.y) * (0.4 + 0.6 * max(-N.y, 0.)) * (0.7 + 0.3 * smoothstep(50., 12., length(vL.xz - vec2(0., -55.))))
    * mix(1., 4.5, step(0.5, mat) * step(mat, 2.5) * smoothstep(34., 40., vL.y));
  lit += uSunCol * uBounce * 0.9 * pool * max(-N.y * 0.6 + 0.4, 0.) * exp(-vL.y * 0.09);
  lit += uGlowCol * thin * 0.38 * smoothstep(28., 34., abs(vL.x));
  // the sea's light dancing on the ceiling and walls near the sea door
  float ca = vn(vL.xz * 0.3 + vec2(uTime * 0.45, uTime * 0.27)) * vn(vec2(vL.z * 0.27 - uTime * 0.38, vL.y * 0.3 + vL.x * 0.21 + uTime * 0.2));
  lit += uGlowCol * uCaust * smoothstep(0.18, 0.5, ca) * area * (0.3 + 0.7 * max(-N.y, 0.) + 0.3 * abs(N.x)) * 1.7;
  // one gleam crossing the niche wall under the squall
  float gx = (vL.x - 24. * sin(uTime * 0.41 - 1.07)) / 8.5;
  float glm = uGleam * exp(-gx * gx) * smoothstep(-96., -109., vL.z) * (0.75 + 0.25 * vn(vec2(vL.x * 0.35 - uTime * 0.9, vL.y * 0.22))) * mix(0.3, 1., smoothstep(8., 32., vWD));
  lit += uGlowCol * glm * max(N.z * 0.85 + 0.15, 0.) * (1. - 0.85 * rec);
  // the floor's sunlit pool thrown back on the niche wall
  lit += uSunCol * uWallFill * smoothstep(-90., -108., vL.z) * max(N.z, 0.) * (0.55 + 0.45 * smoothstep(34., 0., vL.y)) * (1. - rec);
  // sunset: two bars of the low sun from the west windows, across the floor, the bed and the chest
  vec3 Lb = normalize(uBarDir + vec3(0., 1e-5, 0.));
  float nb = dot(N, Lb);
  lit += uBarCol * mix(max(nb, 0.), abs(nb) * 0.5 + 0.2, thin) * westBars(vL + N * 0.25, Lb) * (0.3 + 0.7 * occ) * (1. - rec);
  // and two more that fall on the floor before the niche wall and climb its foot; its chain borders catch the same gold
  vec3 Lb2 = normalize(uBarDir2 + vec3(0., 1e-5, 0.));
  float nb2 = dot(N, Lb2);
  lit += uBarCol * 0.8 * mix(max(nb2, 0.), abs(nb2) * 0.5 + 0.2, thin) * westBars(vL + N * 0.25, Lb2) * (0.3 + 0.7 * occ) * (1. - rec) * step(1e-3, dot(uBarCol, vec3(1.)));
  lit += uBarCol * 0.13 * step(13.5, mat) * (1. - rec) * max(0.3 - N.x, 0.);
  // night: the chain round every niche takes a little of the moon, so each niche is outlined (uRim is nothing by day)
  lit += uRim * 0.35 * step(13.5, mat) * (1. - rec) * max(dot(N, L), 0.);
  // night: the moon's pool on the mat thrown back, faint and cool, up the lower walls
  vec2 pd = (vL.xz - vec2(0., -55.)) / vec2(46., 62.);
  lit += uLowFill * (1. - uLowFloor * abs(N.y)) * exp(-max(vL.y, 0.) * 0.085) / (1. + 2.2 * dot(pd, pd)) * (0.75 + 0.25 * occ) * (1. - rec);
  // the reveal of the arch takes the room's light at its mouth and falls into shade toward its back
  float mouth = smoothstep(-116.4, -110.2, vL.z);
  float hwL = vL.y < 26. ? 10.4 : 10.6 * sqrt(max(1. - (vL.y - 26.) * (vL.y - 26.) / 108., 0.));
  lit = mix(lit, lit * (0.42 + 0.58 * mouth * mouth) + (uGlowCol * 0.2 + uSky * 0.35 + uSunCol * 0.012) * uReveal * (0.24 + 0.76 * mouth) * (0.4 + 0.6 * max(abs(N.x), N.y)), rec * step(abs(vL.x), hwL) * step(7.9, vL.y));
  // the reveal of the stair doorway takes the room's light and nothing else: that level's ambient without the south wall's
  // corner falloff and a share of the sea door's glow, full at the room's edge and falling to 0.45 at the passage's edge a
  // metre back; it comes from the room, so the chain has a lit side. By night the moon's blue lies on its room edge.
  vec3 revE = 0.5 * (uSky + uBounce) + 0.22 * uGlowCol;
  float rvFall = 0.45 + 0.55 * smoothstep(0.05, -0.95, vP0.z);
  lit = mix(lit, revE * rvFall * (0.62 + 0.75 * max(dot(N, normalize(vec3(-sign(vL.x) * 0.3, 0.2, -1.))), 0.)) + uRim * 0.5 * smoothstep(-0.52, -0.73, vP0.z), rv);
  // its sill: the landing takes the same light inside the frame; beyond the frame it runs out to nothing at the landing's lip
  float sillK = step(mat, 0.5) * step(0.6, an.y) * step(abs(vP0.y - 7.), 0.03) * step(-3.5, vP0.z) * step(vP0.z, 0.1) * smoothstep(10.4, 8., abs(vP0.x));
  lit += revE * sillK * 0.62 * (vP0.z > -0.95 ? rvFall : smoothstep(-3.4, -0.95, vP0.z));
  // the lamp: 12 m and no more
  vec3 tl = uLampPos - vL; float dl = max(length(tl), 0.3), fl = max(1. - dl / 13., 0.);
  lit += uLampCol * (max(dot(N, tl / dl), 0.) * 0.8 + 0.2) * fl * fl * (0.86 + 0.1 * sin(uTime * 9.1) + 0.06 * sin(uTime * 15.7));
  vec3 col = alb * lit;
  vec3 R = reflect(-V, N), Hh = normalize(L + V + vec3(0., 1e-5, 0.));
  float brass = step(0.99, gloss);
  float sp = pow(max(dot(N, Hh), 0.), mix(14., 48., brass)) * sun * step(0., ndl);
  float dsp = pow(max(dot(R, Ld), 0.), mix(9., 30., brass)) * 1100. / (dd + 1100.);
  vec3 env = mix(uBounce, uSky, smoothstep(-0.4, 0.6, R.y)) * (0.45 + 1.1 * smoothstep(-0.3, 0.75, R.y) + 0.9 * smoothstep(0.25, 0., abs(R.y - 0.12))) + uGlowCol * (dsp * 2.5 + 0.25 * area) + uBarCol * 0.1 * smoothstep(0.2, 0.9, -R.x);
  // brass by lamplight mirrors the flame where it faces it and is dark where it does not: the lamp on the sill has a lit
  // shoulder and rim, one highlight and a side in shade
  float rl = max(dot(R, tl / dl), 0.), nlamp = dot(N, tl / dl), byLamp = smoothstep(0.7, 0.92, fl) * step(1e-3, uLampCol.r);
  env += uLampCol * fl * (0.04 + 0.5 * rl * rl * rl + 2.2 * pow(rl, 24.));
  col = mix(col, vCol * (env * 1.2 + lit * 0.35), brass * 0.85);
  col *= mix(1., 0.2 + 0.8 * smoothstep(-0.25, 0.7, nlamp), brass * byLamp);
  col += (uSunCol * sp * mix(vec3(0.3), vCol * 3., brass) + uGlowCol * dsp * mix(vec3(0.45), vCol * 2., brass)) * gloss * occ;
  col += uGlowCol * glm * gloss * (0.5 + 2.2 * pow(max(dot(R, vec3(0.42, 0.2, 0.88)), 0.), 6.));   // the china flashes as the gleam passes
  col += ecol * emis * (uEmis * step(11.5, mat) + (uSky + uGlowCol * area * 2.) * step(mat, 8.));
  if (mat > 6.5 && mat < 7.5) {
    // Blown glass, lit from behind and through. Where the eye looks along the wall of the bottle (its outline) the glass is
    // deep and dark; where it looks through, the colour is lighter and saturated and carries whatever light stands behind.
    // The tall sea door is mirrored as one narrow streak down shoulder and body; on the side away from the door runs the
    // thread of light a round bottle gathers. Some stand part full. aMH.y is the bottle's height (0: a flat pane).
    float nv = clamp(dot(N, V), 0., 1.), isB = step(0.05, vMH.y);
    vec3 sat = vCol / max(max(vCol.r, vCol.g), max(vCol.b, 0.02));
    vec3 dp = vP0 - vPv.xyz;
    vec2 dx = dp.xz / max(length(dp.xz), 1e-3);
    float hy = clamp(dp.y / max(vMH.y, 0.05), 0., 1.);
    float seedN = vn(vec2(dx.x * 1.7 + vPv.w * 31., dp.y * 1.3 + dx.y * 1.7));
    float core = smoothstep(0.05, 0.8, nv); core *= sqrt(core);
    float full = isB * step(0.5, fract(vPv.w * 9.7)), lvl = 0.22 + 0.45 * fract(vPv.w * 5.3);
    float wet = full * smoothstep(lvl + 0.01, lvl - 0.01, hy), men = full * smoothstep(0.014, 0.0, abs(hy - lvl));
    float tb = max(dot(-V, Ld), 0.);
    vec3 thru = lit * 1.15 + uSky * 0.3 + uGlowCol * (0.5 * area + 0.9 * tb * tb * tb * 900. / (dd + 900.));
    vec3 body = mix(vCol * 0.11, mix(vCol, sat, 0.55) * (0.56 + 0.3 * seedN + 0.42 * smoothstep(0.72, 1., nv) * isB), core);
    body *= (1. - 0.42 * wet) * (1. - 0.35 * isB * smoothstep(0.06, 0.0, hy));
    vec3 g = body * thru * (1. + 0.7 * men);
    vec2 Nh = N.xz / max(length(N.xz), 1e-3), Lh = Ld.xz / max(length(Ld.xz), 1e-3);
    float fo = max(-dot(Nh, Lh), 0.); fo *= fo; fo *= fo;
    g += sat * (uSky * 0.45 + uGlowCol * (0.2 + 2. * area)) * fo * core * isB * 0.5;
    vec3 Hd = normalize(Ld + V + vec3(0., 1e-5, 0.));
    vec2 Hx = Hd.xz / max(length(Hd.xz), 1e-3);
    float s1 = max(dot(Nh, Hx), 0.), s16 = s1 * s1; s16 *= s16; s16 *= s16; s16 *= s16;
    float farK = smoothstep(14., 70., vWD);                       // far off the streak is wider and fainter, so it does not sparkle
    float hl = pow(s16, mix(11., 2., farK)) * mix(1., 0.3, farK) * smoothstep(0.98, 0.55, abs(N.y)) * isB;
    float hp = (1. - isB) * pow(max(dot(N, Hd), 0.), 40.);
    g += (uGlowCol * 0.6 + uSky * 0.8 + 0.06) * (hl * 2.3 + hp * 0.8);
    // the same door seen again on the far wall of the bottle, through the glass: fainter, softer, in the bottle's colour
    vec2 Vh = V.xz / max(length(V.xz), 1e-3), Hm = 2. * dot(Hx, Vh) * Vh - Hx;
    float s2 = max(dot(Nh, Hm), 0.); s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
    g += mix(sat, vec3(1.), 0.25) * (uGlowCol * 0.5 + uSky * 0.6) * s2 * s2 * s2 * 0.55 * isB * core * (1. - 0.7 * farK);
    g += uSunCol * pow(max(dot(N, Hh), 0.), 80.) * sun * step(0., ndl) * 0.7 + uLampCol * fl * fl * pow(max(dot(R, tl / dl), 0.), 30.) * 0.5;
    g += uGlowCol * glm * (sat * 0.5 * core + 0.35 * pow(max(dot(R, vec3(0.42, 0.2, 0.88)), 0.), 6.));       // the squall's gleam, through it and on it
    col = g;
  }
  // night, by the moon: every plate, bowl, bottle and pot that stands in the wall has a dark body and a blue-white rim on the
  // moon's side: a plate's turned lip (rimP), a round piece where it turns more than 60 degrees from the eye, on the half that
  // faces the moon. (By day uBody is 1 and uRim nothing. The lamp on the arch's sill is by lamplight and is left out.)
  float piece = min(step(5.5, mat) * step(mat, 7.5) + brass, 1.) * step(vL.z, -109.6) * (1. - step(abs(vL.x), 10.4) * step(7.9, vL.y));
  float rimR = smoothstep(0.5, 0.2, clamp(dot(N, V), 0., 1.)) * smoothstep(-0.3, 0.3, dot(N, L));
  col = col * mix(1., uBody, piece) + uRim * max(rimP, rimR) * piece;
  col = mix(col, uHaze, 1. - exp(-vWD * uHazeK));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- the sea and sky outside every opening, painted by view ray
const SEA_VERT = /* glsl */`
uniform mat4 uToLocal;
varying vec3 vL, vC;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.);
  vL = (uToLocal * wp).xyz; vC = (uToLocal * vec4(cameraPosition, 1.)).xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SEA_FRAG = /* glsl */`
uniform vec3 uTop, uHor, uWater, uDeep, uSunDir, uSunCol, uSail, uGrey;
uniform vec4 uEye;       // z, y of the eye on the plane x = 62; presence; lid
uniform float uTime, uStars, uWind, uDhow, uFleet, uBats, uShimmer, uGain, uGlit, uSailK;
varying vec3 vL, vC;
${GLSL_COMMON}
void main() {
  vec3 d = normalize(vL - vC + vec3(1e-5, 0., 0.));
  d.y += uShimmer * 0.003 * sin(d.z * 140. + uTime * 6.) * smoothstep(0.12, 0.0, abs(d.y));
  float el = d.y / max(length(d.xz), 1e-3);
  float east = step(0., d.x);
  // sky: gradient, drifting cloud streaks, the sun's glow
  vec3 col = mix(uHor, uTop, smoothstep(0., 0.6, sqrt(max(el, 0.))));
  vec2 cp = vec2(d.z / max(abs(d.x) + abs(d.y), 0.2) * 2.4 + uTime * 0.012 * (1. + 4. * uWind), el * 7.);
  float cl = smoothstep(0.48, 0.8, fbm(cp)) * smoothstep(0.0, 0.12, el);
  col = mix(col, mix(uHor * 1.15, uTop * 0.5, uWind * uWind), cl * (0.45 + 0.4 * uWind));
  vec3 S = normalize(uSunDir + vec3(0., 1e-5, 0.));
  float sd = max(dot(d, S), 0.), sd4 = sd * sd * sd * sd, sd16 = sd4 * sd4 * sd4 * sd4;
  col += uSunCol * (0.04 * sd4 + 0.12 * sd16 * sd16 + 1.4 * smoothstep(0.9993, 0.9997, sd)) * (1. - uStars);
  // stars turning about the pole, and the Milky Way
  float ca = cos(uTime * 0.012), sa = sin(uTime * 0.012);
  vec3 sdir = vec3(d.x, d.y * ca - d.z * sa, d.y * sa + d.z * ca), q = sdir * 70., ci = floor(q);
  float hs = h21(ci.xy + ci.z * 17.3), star = step(0.975, hs) * smoothstep(0.45, 0.05, length(fract(q) - 0.5));
  float mw = dot(sdir, vec3(0.42, -0.35, 0.84)); mw = exp(-mw * mw * 14.) * (0.35 + 0.65 * fbm(sdir.zy * 6. + sdir.x * 3.));
  vec3 night = vec3(0.75, 0.82, 1.) * star * (0.5 + 3. * fract(hs * 77.)) * (0.55 + 0.45 * sin(uTime * (2. + 5. * fract(hs * 31.)) + hs * 90.))
    + vec3(0.2, 0.24, 0.42) * mw * (0.6 + 2.2 * step(0.93, h21(floor(q.xy * 2.3) + floor(q.z * 2.3) * 7.1)));
  col += night * uStars * smoothstep(-0.01, 0.08, el);
  if (el < 0.) {
    float t = (vC.y + 34.) / max(-d.y, 1e-3);
    vec2 sp = vC.xz + d.xz * t;
    vec3 sea = mix(uDeep, uWater, exp(el * 7.));
    float w1 = vn(sp * vec2(0.035, 0.11) + vec2(uTime * 0.25, uTime * 0.06)), w2 = vn(sp * vec2(0.3, 0.7) + vec2(-uTime * 0.6, uTime * 0.3));
    sea *= 0.82 + 0.3 * w1;
    float glit = w2 * vn(sp * vec2(0.9, 2.2) + vec2(uTime * 1.4, -uTime * 0.8));
    sea += (uSunCol * 0.5 + uHor * 0.5) * smoothstep(0.42, 0.75, glit) * uGlit * (0.3 + 1.4 * exp(el * 5.));
    float foam = smoothstep(0.8 - 0.3 * uWind, 0.95, vn(sp * vec2(0.05, 0.22) + vec2(uTime * 0.7, 0.)) + 0.15 * w2) * uWind;
    sea = mix(sea, uHor * 1.1 + 0.1, foam * 0.85);
    sea = mix(sea, uHor, exp(el * 70.) * 0.7);
    col = mix(uDeep * 0.22 + uTop * 0.05, sea, east);      // west of the house: roofs in shade
  }
  // dhows working along the horizon
  float kx = 1. / max(d.x, 1e-3);
  // uDhow is where the sail stands in the sea door (metres along the door from its middle) as seen from wherever we are
  float lead = (560. - vC.x) / max(35. - vC.x, 4.);
  float z0 = vC.z + (-80. + uDhow + 1.6 * sin(uTime * 0.06) - vC.z) * lead;
  for (int i = 0; i < 7; i++) {
    float fi = float(i), on = step(fi, 0.5 + 6. * uFleet);
    vec3 D = vec3(560. + 55. * fi, -34., z0 + fi * 83. - 250. * uFleet * step(0.5, fi));
    float k = (D.x - vC.x) * kx;
    vec2 s = vec2(vC.z + d.z * k - D.z, vC.y + d.y * k - D.y) / uSailK;
    s.y -= 1.2 * sin(uTime * 1.1 + fi * 2.) * (1. + 2. * uWind); s.x -= s.y * (0.05 + uWind * 0.32 + 0.03 * sin(uTime * 0.8 + fi));
    float hull = rect(s, vec2(-30., 0.), vec2(38., 6.), 0.5) * step(-s.y, (s.x + 30.) * 0.5);
    float sail = step(8., s.y) * step(s.y, 8. + (s.x + 32.) * 2.3) * step(s.y, 8. + (38. - s.x) * 1.25);
    float mast = rect(s, vec2(-9., 5.), vec2(-6.6, 70.), 0.4);
    float shade = 0.5 + 0.5 * smoothstep(-30., 24., s.x) + 0.07 * sin(s.x * 0.9) - 0.12 * smoothstep(30., 8., s.y);
    col = mix(col, uDeep * 0.1, mast * on * east);
    col = mix(col, uSail * shade, sail * on * east);
    col = mix(col, uDeep * 0.12, hull * on * east);
  }
  // bats: six crossing the sea door, three passing the west windows against the last of the light
  float kb = (44. - vC.x) * kx, kw = (-40.5 - vC.x) / min(d.x, -1e-3);
  vec2 hb = vec2(vC.z + d.z * kb, vC.y + d.y * kb), hw = vec2(vC.z + d.z * kw, vC.y + d.y * kw);
  for (int i = 0; i < 9; i++) {
    float fi = float(i), tt = uTime * (7. + fi * 1.3) + fi * 23., wst = step(5.5, fi);
    vec2 pe = vec2(-97. + mod(tt, 34.), 14.5 + fi * 1.8 + 2.4 * sin(tt * 0.31 + fi * 2.1));
    vec2 pw = vec2(-108. + mod(tt * 0.8, 46.), 28. + (fi - 6.) * 3.6 + 2.4 * sin(tt * 0.27 + fi * 2.1));
    vec2 b = mix((hb - pe) / 3.1, (hw - pw) / 1.9, wst);
    float ax = abs(b.x), flap = 0.75 * sin(uTime * (15. + fi) + fi * 1.7);
    float wing = step(ax, 1.7) * smoothstep(0.34, 0.22, abs(b.y - flap * ax + 0.25 * ax * ax) / max(1.05 - ax * 0.5, 0.1));
    float body = smoothstep(0.42, 0.3, length(b * vec2(1.6, 1.)));
    col = mix(col, vec3(0.012, 0.008, 0.02), max(wing, body) * uBats * mix(east * (1. - uEye.z), 1. - east, wst));   // none before the visitor's face
  }
  // the rare visitor: a grey feathered head as big as the house fills the sea door, and one pale eye looks in
  float ke = (62. - vC.x) * kx;
  vec2 he = vec2(vC.z + d.z * ke, vC.y + d.y * ke) - uEye.xy;
  float pres = uEye.z * east;
  if (pres > 0.001) {
    // the head is a ball 23 m in radius whose middle stands below and behind the eye, so its crown shows against the sky
    vec2 hc = he - vec2(6., -8.);
    float hr = length(hc) / 23., hr1 = min(hr, 0.999), dome = sqrt(1. - hr1 * hr1);
    float r = length(he), ang = atan(he.y, he.x + 1e-4);
    // lit from the upper left by the last of the sun; the far side and the rim fall to shadow
    float ball = clamp(0.08 + 0.95 * dot(vec3(hc / 23., dome), vec3(-0.5, 0.48, 0.72)), 0.035, 1.) * (0.3 + 0.7 * dome);
    // scalloped feathers in offset rows laid over the ball, so they crowd together and darken toward its edge
    vec2 sp = hc * (asin(hr1) / max(hr1, 1e-3));
    vec2 f = vec2(sp.x / 3.7 + 0.5 * floor(sp.y / 2.35), sp.y / 2.35), ff = fract(f) - vec2(0.5, 1.);
    float fd = length(ff * vec2(1., 0.62));
    float feather = 0.4 + 0.8 * smoothstep(0.12, 0.5, fd) - 0.55 * smoothstep(0.5, 0.6, fd) - 0.08 * smoothstep(0.05, 0.0, abs(ff.x)) * step(fd, 0.5);
    vec3 head = (uGrey + 0.03) * mix(0.75, feather, 0.35 + 0.65 * dome) * (0.9 + 0.25 * fbm(sp * 0.07));
    // the bare pale face round the eye: creased outward from it, wrinkled in rings, sinking into a socket
    vec2 hn = he / max(r, 0.01);
    float skin = smoothstep(9.5, 6.2, length(he * vec2(0.85, 1.)));
    // creases that run with the line the lids close on, not rings
    float wr = sin((he.y + 0.5 + 0.055 * he.x * he.x) * 2.3 + 1.7 * vn(he * 0.6 + 1.)) * smoothstep(4.6, 6.4, r) * (0.45 + 0.55 * smoothstep(9.5, 5.5, r));
    vec3 skinC = (uGrey * 1.45 + 0.06) * (0.82 + 0.2 * vn(hn * 4.5 + 3.) + 0.1 * vn(he * 1.6) + 0.13 * wr);
    head = mix(head, skinC * (0.58 + 0.42 * smoothstep(4.6, 7.6, r)), skin);
    // the dark hooked beak under the eye, where the gap between the curtains shows it: a horn crescent with a pale ridge,
    // curving over and down to its point
    vec2 bk = he - vec2(-4.5, -13.);
    float bl = length(bk), beak = smoothstep(7.9, 7.4, bl) * smoothstep(4.9, 5.5, length(bk - vec2(3.7, -5.6))) * smoothstep(5.6, 5.0, bk.y);
    vec3 horn = vec3(0.022, 0.022, 0.028) + (uGrey + 0.05) * (0.34 * smoothstep(6.3, 7.5, bl) * smoothstep(-6., 5., bk.y) + 0.2 * smoothstep(0.3, 0.0, abs(bl - 6.6)));
    head = mix(head, horn, beak);
    head *= 1. - 0.55 * smoothstep(1.5, 0., bl - 7.9) * (1. - beak) * smoothstep(5.6, 5.0, bk.y);                           // the beak's shadow on the feathers
    // the lids: grey skin over the ball of the eye, closing from above and below onto one curved crease
    float shp = sqrt(max(1. - he.x * he.x / 21.2, 0.)), yc = -0.5 - 0.055 * he.x * he.x;
    float yHi = mix(4.5 * shp, yc, uEye.w), yLo = mix(-4.5 * shp, yc, uEye.w);
    float eyeOpen = smoothstep(0., 0.3, he.y - yLo) * smoothstep(0., 0.3, yHi - he.y) * step(abs(he.x), 4.6);
    float lidZone = smoothstep(5.9, 5.2, r), dl = he.y > yc ? he.y - yHi : yLo - he.y;
    vec3 lidC = skinC * (0.72 + 0.3 * sqrt(max(1. - r * r / 36., 0.))) * (0.93 + 0.07 * sin(dl * 3.4 + 1.) + 0.08 * vn(he * 2.2)) * (0.82 + 0.3 * smoothstep(-3.5, 3.5, he.y));
    lidC *= 1. - 0.7 * smoothstep(mix(0.45, 1.0, uEye.w), 0.0, abs(dl)) * step(abs(he.x), 4.9);                           // the dark edges of the lids
    // the eye: a pale yellow iris with fine fibres and a dark rim, a small pupil that tightens, a wet glint
    float pin = 1.2 + 0.36 * sin(uTime * 2.1) * sin(uTime * 0.83 + 1.);
    vec3 iris = vec3(1.0, 0.84, 0.3) * (0.8 + 0.2 * sin(ang * 43. + 2.5 * vn(he * 1.3))) * mix(1.15, 0.22, smoothstep(2.6, 4.3, r));
    iris = mix(iris, vec3(1.0, 0.93, 0.6), smoothstep(pin + 1.1, pin + 0.1, r) * 0.6);
    iris *= 0.7 + 0.3 * sqrt(max(1. - r * r / 23., 0.));
    vec3 eye = mix(iris, vec3(0.006, 0.006, 0.01), smoothstep(pin + 0.14, pin - 0.14, r));
    eye *= 0.4 + 0.6 * smoothstep(0.0, 2.4, yHi - he.y);                                                                  // the upper lid's shadow
    eye += vec3(0.95, 0.97, 1.) * (1.6 * smoothstep(0.62, 0.3, length((he - vec2(-1.2, 1.7)) * vec2(1., 1.5))) + 0.25 * smoothstep(0.5, 0.2, length(he - vec2(1.3, -1.5))));
    head = mix(head, lidC, lidZone) * ball;
    head = mix(head, eye * (1.2 + 0.7 * ball), eyeOpen * smoothstep(4.6, 4.4, r));
    float edge = smoothstep(1.0, 0.94, hr + 0.035 * vn(he * 0.35));
    col = mix(col, head * (uHor * 0.6 + 0.42), pres * edge);
  }
  gl_FragColor = vec4(col * uGain, 1.);
}`;

// ---------------------------------------------------------------- shafts: sheets hung in every opening and drawn out along the light
const SHAFT_VERT = /* glsl */`
attribute vec3 aInfo;       // t along the beam, opening id (0 sea door, 1 roof grille, 2 west windows, 3 shutters), s across the sheet
uniform mat4 uToLocal;
uniform vec3 uSunDir;
uniform vec4 uShaft;
varying vec3 vInfo, vL, vC;
varying vec2 vO;
varying float vStr, vWD;
void main() {
  vec3 L = normalize(uSunDir + vec3(0., 1e-5, 0.));
  float id = aInfo.y;
  float facing = id < 0.5 || id > 2.5 ? step(0.05, L.x) : (id < 1.5 ? step(0.05, L.y) : step(0.05, -L.x));
  float len = min(position.y / max(L.y, 0.12), 96.);
  vec3 p = position - L * len * aInfo.x;
  vStr = uShaft[int(id + 0.5)] * facing;
  vInfo = aInfo; vO = id > 0.5 && id < 1.5 ? position.xz : position.zy;
  vec4 wp = modelMatrix * vec4(p * step(0.001, vStr), 1.);
  vL = (uToLocal * wp).xyz; vWD = distance(cameraPosition, wp.xyz); vC = (uToLocal * vec4(cameraPosition, 1.)).xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftCol;
uniform float uTime, uLace;
varying vec3 vInfo, vL, vC;
varying vec2 vO;
varying float vStr, vWD;
${GLSL_COMMON}
void main() {
  float t = vInfo.x, s = vInfo.z, id = vInfo.y;
  // where this line of sight meets the niche wall: inside the great arch there is only the dark, and the low sunset beams
  // from the west windows, which would lie across it as a haze with a hard edge, are not drawn over it
  vec3 dv = vL - vC;
  vec2 hit = vC.xy + dv.xy * ((-110. - vC.z) / min(dv.z, -1e-3));
  float hw = hit.y < 26. ? 10. : 10. * sqrt(max(1. - (hit.y - 26.) * (hit.y - 26.) / 100., 0.));
  float inArch = smoothstep(hw + 0.8, hw - 0.8, abs(hit.x)) * smoothstep(7.2, 8.8, hit.y) * step(dv.z, 0.) * step(-110., vC.z) * step(1.5, id) * step(id, 2.5);
  float a = vStr * (1. - t) * (0.35 + 0.65 * (1. - t)) * smoothstep(0., 0.1, s) * smoothstep(1., 0.9, s);
  float pencil = 0.5 + 0.5 * sin(vO.x * 2.9 + sin(vO.y * 1.7) * 0.8);
  a *= mix(1., 0.35 + 1.1 * pencil * pencil, (id > 0.5 && id < 1.5 ? uLace : max(step(2.5, id), 0.45)));
  a *= 0.6 + 0.55 * vn(vL.xy * 0.22 + vec2(uTime * 0.3, -uTime * 0.2)) * vn(vL.zy * 0.6 + uTime * 0.45);
  a *= smoothstep(1.5, 14., vWD) * smoothstep(-109.6, -107., vL.z) * smoothstep(35.4, 34., abs(vL.x)) * smoothstep(-0.3, 1.2, vL.y);
  gl_FragColor = vec4(uShaftCol * a * 0.085 * (1. - 0.94 * inArch), 1.);
}`;

// ---------------------------------------------------------------- dust in the beams: motes that stand only where a shaft of light is
const MOTE_VERT = /* glsl */`
attribute vec3 aInfo;       // t along the beam, opening id (as the shafts), a random number
attribute vec2 aCorner;
uniform mat4 uToLocal;
uniform vec3 uSunDir;
uniform vec4 uShaft;
uniform float uTime;
varying vec2 vC;
varying float vA;
void main() {
  vec3 L = normalize(uSunDir + vec3(0., 1e-5, 0.));
  float id = aInfo.y, sd = aInfo.z;
  float facing = id < 0.5 || id > 2.5 ? step(0.05, L.x) : (id < 1.5 ? step(0.05, L.y) : step(0.05, -L.x));
  float len = min(position.y / max(L.y, 0.12), 96.);
  float t = fract(aInfo.x + uTime * 0.003 * (0.4 + sd));
  vec3 p = position - L * len * t;
  p += vec3(sin(uTime * 0.31 + sd * 40.), 0.6 * cos(uTime * 0.23 + sd * 17.), sin(uTime * 0.27 + sd * 29.)) * 0.7;
  float inRoom = smoothstep(-109.6, -107., p.z) * smoothstep(35.2, 33.5, abs(p.x)) * smoothstep(0.1, 1.2, p.y) * smoothstep(0.5, -1.5, p.z);
  vec4 wp = modelMatrix * vec4(p, 1.);
  float dist = distance(cameraPosition, wp.xyz);
  // never smaller than a pixel or so: a far mote is drawn larger and fainter instead of flickering
  float base = (0.05 + 0.07 * fract(sd * 7.7)) * length(modelMatrix[0].xyz), size = max(base, dist * 0.0021);
  float tw = 0.55 + 0.45 * sin(uTime * (1.5 + 3. * fract(sd * 3.3)) + sd * 60.);
  vA = min(uShaft[int(id + 0.5)] * facing * 1.4, 1.3) * inRoom * (1. - 0.6 * t) * tw * (base * base) / (size * size) * smoothstep(1., 4., dist);
  vC = aCorner;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  wp.xyz += (right * aCorner.x + up * aCorner.y) * size * step(0.002, vA);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uShaftCol;
varying vec2 vC;
varying float vA;
void main() {
  gl_FragColor = vec4(uShaftCol * smoothstep(1., 0.15, dot(vC, vC)) * vA * 0.6, 1.);
}`;

// ---------------------------------------------------------------- dust in the gap behind the arch
// Motes that stand only in the dark between the back of the niche wall and the house door (6.5 .. 20 m behind the arch's
// face). Nothing lights them but the room's light that comes in through the arch (full at the back of the wall, 1/e every
// 9 m behind it and every 2 + 0.35 a metres outside the opening's outline) and the light of the model's door (to 1.5 door
// widths from it). They drift toward the room on the clock and are drawn as long as they drift in half a second, along the
// gap's axis: points from the room, streaks when the gap is flown through.
const GAP_VERT = /* glsl */`
attribute vec3 aSeed;       // speed, phase, size (three random numbers)
attribute vec2 aCorner;
uniform float uTime;
uniform vec3 uRoomCol, uDoorCol;
uniform vec4 uDoorAt;       // the model's door: its centre in this room's metres, its width
varying vec2 vC;
varying vec3 vCol;
void main() {
  float sp = 0.6 + 1.4 * aSeed.x;
  float a = 6.5 + mod(position.z - uTime * sp, 13.5);        // metres behind the arch's face
  vec3 p = vec3(position.x + 0.6 * sin(uTime * 0.31 + aSeed.y * 40.), position.y + 0.4 * cos(uTime * 0.23 + aSeed.y * 17.), -110. - a);
  float ends = smoothstep(6.5, 8., a) * smoothstep(20., 18., a);
  float r = length(vec2(max(abs(p.x) - 10., 0.), max(p.y - 36., 0.) + max(8. - p.y, 0.)));
  float room = exp(-(a - 6.) / 9.) * exp(-r / (2. + 0.35 * a));
  vec3 dv = p - uDoorAt.xyz;
  float door = max(1. - length(dv) / max(1.5 * uDoorAt.w, 1e-3), 0.); door *= door;
  vec4 wp = modelMatrix * vec4(p, 1.);
  float sc = length(modelMatrix[0].xyz);
  vec3 toC = wp.xyz - cameraPosition; float dist = length(toC);
  vec3 vd = toC / max(dist, 1e-4), ax = normalize(modelMatrix[2].xyz + vec3(0., 0., 1e-6));
  vec3 right = cross(ax, vd); float rl = length(right);
  right = rl > 0.02 ? right / rl : normalize(cross(vec3(0., 1., 0.), vd) + vec3(1e-5, 0., 0.));
  vec3 up = cross(vd, right); up *= dot(up, ax) < 0. ? -1. : 1.;
  // never smaller than a pixel or so: a far mote is drawn larger and fainter instead of flickering
  float base = (0.045 + 0.05 * aSeed.z) * sc, size = max(base, dist * 0.0026);
  float tw = 0.6 + 0.4 * sin(uTime * (1.2 + 2.6 * fract(aSeed.y * 7.7)) + aSeed.y * 60.);
  vCol = (uRoomCol * room + uDoorCol * door) * ends * tw * (base * base) / (size * size) * smoothstep(1., 4., dist);
  vC = aCorner;
  float on = step(0.002, dot(vCol, vec3(1.)));
  wp.xyz += (right * aCorner.x * size + (ax * (0.25 * sp * sc) + up * size) * aCorner.y) * on;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GAP_FRAG = /* glsl */`
varying vec2 vC;
varying vec3 vCol;
void main() {
  gl_FragColor = vec4(vCol * smoothstep(1., 0.15, dot(vC, vC)), 1.);
}`;

// ---------------------------------------------------------------- the pools of colour the glass bottles throw (additive)
const POOL_VERT = /* glsl */`
attribute vec3 color;
attribute vec4 aUV, aPiv;
uniform float uLevel;
varying vec3 vCol;
varying vec4 vUV;
varying float vK, vId, vWD;
void main() {
  // the same draw as the room shader makes for its china: the pool leaves with the bottle
  float id = fract(sin(dot(aPiv.xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  float gone = step(fract(id * 7.31 + uLevel * 0.37), 0.13);
  vec4 wp = modelMatrix * vec4(mix(position, aPiv.xyz, gone), 1.);
  vCol = color; vUV = aUV; vK = aPiv.w * (1. - gone); vId = id;
  vWD = distance(cameraPosition, wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const POOL_FRAG = /* glsl */`
uniform vec3 uPool;
uniform float uTime, uHazeK;
varying vec3 vCol;
varying vec4 vUV;
varying float vK, vId, vWD;
void main() {
  float r2 = dot(vUV.xy, vUV.xy);
  vec2 e = smoothstep(vec2(1.), vec2(0.6), abs(vUV.zw));
  float a = exp(-r2 * 2.7) * e.x * e.y;
  // the bright thread the round glass gathers, wavering a little
  float cx = vUV.x * 3.4 + 0.45 * sin(vUV.y * 3.1 + vId * 20. + 0.4 * sin(uTime * 0.7 + vId * 9.));
  float thread = exp(-cx * cx) * smoothstep(1.1, 0.1, abs(vUV.y));
  float tw = 0.86 + 0.14 * sin(uTime * 0.9 + vId * 40.);
  gl_FragColor = vec4(vCol * uPool * (a * (0.75 + 0.85 * thread)) * vK * tw * exp(-vWD * uHazeK), 1.);
}`;

// ---------------------------------------------------------------- geometry
// The hero's accumulator with one more attribute: aPiv = (pivot x, y, z, mover kind).
class RAcc extends Acc {
  constructor(maxTris) { super(maxTris); this.piv = new Float32Array(maxTris * 12); }
  put(geo, m, color, o = {}) {
    const a = this.n; this.add(geo, m, color, o);
    if (o.piv) for (let i = a; i < this.n; i++) this.piv.set(o.piv, i * 4);
    return this;
  }
  build() { const g = super.build(); g.setAttribute('aPiv', new THREE.BufferAttribute(this.piv.slice(0, this.n * 4), 4)); return g; }
}
const I4 = new THREE.Matrix4();
const tone = (c, rng, amt = 0.08) => c.clone().multiplyScalar(1 + (rng() - 0.5) * 2 * amt);
const poly = (pts) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; };
const holeAt = (w, hs, rise, x, y) => { const h = new THREE.Path(); archPath(h, w, hs, rise, y, 6, true); for (const c of h.curves) { c.v1.x += x; c.v2.x += x; } return h; };
const extr = (shape, depth) => ni(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 }));
// a door or window frame: two carved jambs and a lintel with rosettes, built in the plane x = const, opening z0..z1, y0..y1
function frameX(acc, C, rng, x, dir, z0, z1, y0, y1, ros) {
  const jamb = bevelBox(1.0, y1 - y0 + 1.4, 1.5, 0.22), lint = bevelBox(1.0, 1.7, z0 - z1 + 4.4, 0.25);
  for (const z of [z0 + 0.75, z1 - 0.75]) acc.put(jamb, M(x, (y0 + y1 + 1.4) / 2, z), tone(C.wood, rng), { mat: R_CARVED });
  acc.put(lint, M(x, y1 + 1.5, (z0 + z1) / 2), tone(C.wood, rng), { mat: R_CARVED });
  const n = Math.max(3, Math.round((z0 - z1) / 3.4));
  for (let i = 0; i < n; i++) acc.put(ros, M(x + dir * 0.5, y1 + 1.5, z1 + (i + 0.5) * (z0 - z1) / n, 0, dir * Math.PI / 2, 0, 0.72), tone(C.woodLight, rng), { mat: R_WOOD });
  jamb.dispose(); lint.dispose();
}

// The shell: floor, four walls with real reveals, the pole ceiling with its grille, the stairhead, frames and shutters.
async function buildShell(acc, C, rng, detail, Y) {
  acc.put(quadGeo([-HALF_W, 0, 2], [HALF_W + 3, 0, 2], [HALF_W + 3, 0, -ROOM_L - 0.5], [-HALF_W, 0, -ROOM_L - 0.5]), I4, C.floor, { mat: R_FLOOR });
  // south wall with the stair doorway (flat: the hero's passage supplies the reveals)
  const south = poly([[-HALF_W, 0], [HALF_W, 0], [HALF_W, ROOM_H], [-HALF_W, ROOM_H]]);
  south.holes.push(poly([[-8, 7], [-8, 29], [8, 29], [8, 7]]));
  // (a half turn about y, so that it faces into the room: a mirror in x would be turned back by the accumulator and face south)
  const sg = ni(new THREE.ShapeGeometry(south)); acc.put(sg, M(0, 0, 0, 0, Math.PI, 0), C.lime); sg.dispose();
  acc.put(quadGeo([8, 0, 0], [-8, 0, 0], [-8, 7, 0], [8, 7, 0]), I4, C.lime);
  await Y();
  // right wall: the sea door (a notch to the floor) and two arched shutter windows
  const right = poly([[0, 0], [70, 0], [70, 24], [90, 24], [90, 0], [ROOM_L, 0], [ROOM_L, ROOM_H], [0, ROOM_H]]);
  right.holes.push(holeAt(12, 12, 4, 52, 9), holeAt(10, 12, 4, 101, 9));
  const rg = extr(right, 2.4); acc.put(rg, M(HALF_W, 0, 0, 0, Math.PI / 2, 0), C.lime, { ao: (x) => (x > HALF_W + 0.2 ? 0.7 : 1) }); rg.dispose();
  await Y();
  // left wall: two high west windows and the curtained doorway
  const left = poly([[0, 0], [42, 0], [42, 18], [54, 18], [54, 0], [ROOM_L, 0], [ROOM_L, ROOM_H], [0, ROOM_H]]);
  left.holes.push(holeAt(12, 12, 4, 16, 24), holeAt(12, 12, 4, 34, 24));
  const lg = extr(left, 2.4); acc.put(lg, M(-HALF_W, 0, -ROOM_L, 0, -Math.PI / 2, 0), C.lime, { ao: (x) => (x < -HALF_W - 0.2 ? 0.7 : 1) }); lg.dispose();
  acc.put(quadGeo([-HALF_W - 2.3, 0, -56], [-HALF_W - 2.3, 0, -68], [-HALF_W - 2.3, 18, -68], [-HALF_W - 2.3, 18, -56]), I4, C.dark);
  await Y();
  // ceiling: plaster above, mangrove poles below, three beams, and the carved grille
  const ceil = poly([[-HALF_W, -ROOM_L], [HALF_W, -ROOM_L], [HALF_W, 0], [-HALF_W, 0]]);
  ceil.holes.push(poly([[-10, -70], [-10, -40], [10, -40], [10, -70]]));
  const cg = ni(new THREE.ShapeGeometry(ceil)); acc.put(cg, M(0, ROOM_H, 0, Math.PI / 2, 0, 0), C.lime.clone().multiplyScalar(0.55)); cg.dispose();
  acc.put(quadGeo([-10, ROOM_H + 0.5, -40], [10, ROOM_H + 0.5, -40], [10, ROOM_H + 0.5, -70], [-10, ROOM_H + 0.5, -70]), M(0, 2 * ROOM_H + 1, 0, 0, 0, 0, 1, -1, 1), C.wood, { mat: R_GRILLE });
  await Y();
  const pole = ni(new THREE.CylinderGeometry(0.42, 0.5, 2 * HALF_W, 6, 1, true)), nP = Math.round(46 * (0.6 + 0.4 * detail));
  for (let i = 0; i < nP; i++) {
    const z = -(i + 0.5) * (ROOM_L / nP);
    const inG = z < -39 && z > -71, c = tone(C.pole, rng, 0.22);
    if (!inG) acc.put(pole, M(0, ROOM_H - 0.55, z, 0, rng() * 0.02, Math.PI / 2 + (rng() - 0.5) * 0.02), c, { mat: R_WOOD });
    else for (const s of [-1, 1]) acc.put(pole, M(s * 22.6, ROOM_H - 0.55, z, 0, 0, Math.PI / 2, 1, 0.354, 1), c, { mat: R_WOOD });
  }
  pole.dispose();
  const beam = bevelBox(1.6, 2.0, ROOM_L, 0.3), gb = bevelBox(21.6, 1.3, 1.3, 0.25), gs = bevelBox(1.3, 1.3, 31.6, 0.25);
  for (const x of [-23, 23]) acc.put(beam, M(x, ROOM_H - 2.0, -ROOM_L / 2), tone(C.wood, rng, 0.1), { mat: R_CARVED });
  for (const z of [-39.8, -70.2]) acc.put(gb, M(0, ROOM_H - 0.7, z), C.wood, { mat: R_CARVED });
  for (const x of [-10.4, 10.4]) acc.put(gs, M(x, ROOM_H - 0.7, -55), C.wood, { mat: R_CARVED });
  beam.dispose(); gb.dispose(); gs.dispose();
  await Y();
  // the stairhead: a landing at the sill and seven worn steps down into the room, a pair of sandals left on it
  for (let i = 0; i < 7; i++) {
    const st = bevelBox(21 - i * 0.2, 1.0, i === 0 ? 3.4 : 1.5, 0.16);
    acc.put(st, M(0, 6.5 - i, i === 0 ? -1.7 : -3.4 - (i - 0.5) * 1.5), tone(i % 2 ? C.stone : C.lime, rng, 0.05)); st.dispose();
    if (i > 0) { const fill = bevelBox(20.6, 1.0, 3.4 + (i - 1) * 1.5, 0.1); acc.put(fill, M(0, 6.5 - i, -(3.4 + (i - 1) * 1.5) / 2), C.stone); fill.dispose(); }
  }
  const sole = bevelBox(0.9, 0.16, 2.3, 0.07), strap = bevelBox(0.9, 0.5, 0.2, 0.08);
  for (const [x, z, r] of [[5.2, -1.6, 0.3], [6.5, -1.2, -0.15]]) {
    acc.put(sole, M(x, 7.08, z, 0, r, 0), C.leather, { mat: R_WOOD }); acc.put(strap, M(x - Math.sin(r) * 0.4, 7.3, z - 0.45, 0.5, r, 0), C.rose, { mat: R_WOOD });
  }
  sole.dispose(); strap.dispose();
  await Y();
  // frames, sills and shutters
  const ros = rosetteGeo(8);
  frameX(acc, C, rng, HALF_W - 0.2, -1, -70, -90, 0, 24, ros);
  frameX(acc, C, rng, -HALF_W + 0.2, 1, -56, -68, 0, 18, ros);
  const sill = bevelBox(1.6, 0.8, 14, 0.2);
  for (const z of [-52, -101]) {
    acc.put(sill, M(HALF_W - 0.3, 8.7, z, 0, 0, 0, 1, 1, z < -80 ? 0.86 : 1), tone(C.stone, rng));
    acc.put(quadGeo([HALF_W + 1.2, 8, z - 7], [HALF_W + 1.2, 8, z + 7], [HALF_W + 1.2, 26, z + 7], [HALF_W + 1.2, 26, z - 7]), I4, C.blue, { mat: R_SHUTTER });
  }
  for (const z of [-94, -76]) acc.put(sill, M(-HALF_W + 0.3, 23.7, z), tone(C.stone, rng));
  // window bars in the west windows, turned
  const bar = lathe([[0.16, 0], [0.22, 0.1], [0.14, 0.2], [0.14, 0.45], [0.24, 0.5], [0.14, 0.55], [0.14, 0.9], [0.2, 1]], 5);
  for (const z of [-94, -76]) for (let i = -2; i <= 2; i++) acc.put(bar, M(-HALF_W - 1.2, 24, z + i * 2, 0, 0, 0, 1, 12 + 4 * (1 - Math.abs(i) / 2.6), 1), tone(C.wood, rng, 0.15), { mat: R_WOOD });
  // the stair doorway seen from inside the room: carved jambs and a lintel with rosettes
  const sj = bevelBox(1.5, 23.4, 1.0, 0.22), sl = bevelBox(20.4, 1.7, 1.0, 0.25);
  for (const x of [-8.75, 8.75]) acc.put(sj, M(x, 18.7, -0.45), tone(C.wood, rng), { mat: R_CARVED });
  acc.put(sl, M(0, 30.5, -0.45), tone(C.wood, rng), { mat: R_CARVED });
  for (let i = 0; i < 5; i++) acc.put(ros, M(-6.8 + i * 3.4, 30.5, -0.95, 0, Math.PI, 0, 0.72), tone(C.woodLight, rng), { mat: R_WOOD });
  sj.dispose(); sl.dispose();
  sill.dispose(); bar.dispose(); ros.dispose();
}

// Outline of a niche (counter-clockwise from the lower left): pointed, cusped or stepped head.
function nichePts(kind, w, hs, rise, x0 = 0, y0 = 0, n = 5) {
  const half = [[w / 2, 0], [w / 2, hs]];
  if (kind === 2) { half.push([w / 3, hs], [w / 3, hs + rise * 0.5], [w / 6, hs + rise * 0.5], [w / 6, hs + rise]); }
  else for (let i = 1; i < n; i++) {
    const t = i / n, k = kind === 1 ? 0.8 + 0.2 * Math.abs(Math.cos(t * Math.PI * 1.5)) : 1 - 0.18 * Math.sin(t * Math.PI);
    half.push([w / 2 * Math.cos(t * Math.PI / 2) * k, hs + rise * Math.pow(Math.sin(t * Math.PI / 2), 0.85)]);
  }
  const pts = [[-w / 2, 0], ...half];
  if (kind !== 2) pts.push([0, hs + rise]);
  for (let i = half.length - 1; i >= 1; i--) pts.push([-half[i][0], half[i][1]]);
  return pts.map((p) => [p[0] + x0, p[1] + y0]);
}

// The niche wall (zidaka): sixty niches in five tiers round the central arch, chain borders, shelves, and the china.
async function buildNicheWall(acc, C, rng, opts, Y) {
  const niches = [], ZW = -ROOM_L, DEPTH = 1.9;
  // the niches of the lower west tiers are flown past at six metres (the squall room's loop): their arches are cut finer
  const add = (x, y, w, tier) => niches.push({ x, y, w, hs: 3.0 + 0.5 * rng(), rise: 1.9 + 0.5 * rng(), kind: (tier + Math.round(Math.abs(x) / 4.3)) % 3, tier,
    near: x < -8 && tier <= 2, seg: x < -8 && tier <= 2 ? 14 : 7 });
  for (let i = 0; i < 16; i++) add(-31.5 + i * 4.2, 1.5, 3.1, 0);
  for (let t = 1; t <= 4; t++) for (let i = 0; i < 5; i++) for (const s of [-1, 1]) add(s * (13.6 + i * 4.3), 1.6 + t * 7.9, 3.2 + 0.5 * ((i + t) % 2), t);
  add(-9.2, 34.6, 2.4, 4); add(9.2, 34.6, 2.4, 4); add(-3.6, 37.6, 2.8, 5); add(3.6, 37.6, 2.8, 5);
  const archP = nichePts(0, 20, 18, 10, 0, 8, 12), apexI = archP.findIndex((p) => Math.abs(p[0]) < 1e-6);
  for (const n of niches) { if (n.tier === 5) { n.hs = 2.4; n.rise = 1.5; } if (n.tier === 0) { n.hs -= 0.5; n.rise -= 0.3; } }
  // the wall is cut in two halves that meet on the axis, above and below the arch (no niche crosses it): two short
  // steps of triangulation in place of one long one
  const halves = [[[0, 0], [HALF_W, 0], [HALF_W, ROOM_H], [0, ROOM_H], ...archP.slice(1, apexI + 1).reverse(), [0, 8]],
    [[0, 0], [0, 8], archP[0], ...archP.slice(apexI).reverse(), [0, ROOM_H], [-HALF_W, ROOM_H], [-HALF_W, 0]]];
  for (let h = 0; h < 2; h++) {
    const wall = poly(halves[h]);
    for (const n of niches) if ((n.x > 0) === (h === 0)) wall.holes.push(poly(nichePts(n.kind, n.w, n.hs, n.rise, n.x, n.y, n.seg)));
    await Y();
    const wg = extr(wall, DEPTH);
    await Y();
    acc.put(wg, M(0, 0, ZW - DEPTH), C.lime, { ao: (x, y, z) => (z < ZW - 0.2 ? 0.5 : 1) }); wg.dispose();
    await Y();
  }
  // the backs of the niches, in shade, and the reveal of the arch through the 6 m wall
  const back = poly([[-HALF_W, 0], [HALF_W, 0], [HALF_W, ROOM_H], [-HALF_W, ROOM_H]]); back.holes.push(poly(archP));
  const bg = ni(new THREE.ShapeGeometry(back)); acc.put(bg, M(0, 0, ZW - DEPTH + 0.02), C.lime.clone().lerp(C.violet, 0.25).multiplyScalar(0.62)); bg.dispose();
  const tun = poly([[-13, 5], [13, 5], [13, 39], [-13, 39]]); tun.holes.push(poly(archP));
  const tg = extr(tun, 6 - DEPTH); acc.put(tg, M(0, 0, ZW - 6), C.lime, { ao: (x, y, z) => 0.3 + 0.7 * smoothstep(ZW - 6, ZW - DEPTH, z) }); tg.dispose();
  await Y();
  // borders: a chain moulding round every niche, two stepped mouldings round the arch
  // Each vertex of a niche's moulding is told where it stands on it: how far out from the opening (aMH.y = 1 + metres), how
  // far round the opening from the middle of its foot, and which way is outward (aPiv.xyz; the mover kind stays 0). The
  // shader lays a chain of links between two beads along that, so the chain follows the arch.
  for (let i = 0; i < niches.length; i++) {
    const n = niches[i], inner = nichePts(n.kind, n.w, n.hs, n.rise, n.x, n.y, n.seg), ring = poly(nichePts(n.kind, n.w + 1.1, n.hs + 0.35, n.rise + 0.5, n.x, n.y - 0.3, n.seg));
    ring.holes.push(poly(inner));
    const g = n.near ? ni(new THREE.ExtrudeGeometry(ring, { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelOffset: -0.05, bevelSegments: 1, curveSegments: 1 })) : extr(ring, 0.22);
    const a = acc.n, K = inner.length, cum = [0];
    for (let k = 0; k < K; k++) { const p = inner[k], q = inner[(k + 1) % K]; cum.push(cum[k] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
    acc.put(g, M(0, 0, n.near ? ZW - 0.02 : ZW), tone(C.lime, rng, 0.04).multiplyScalar(1.05), { mat: R_CHAIN }); g.dispose();
    for (let v = a; v < acc.n; v++) {
      const x = acc.pos[v * 3], y = acc.pos[v * 3 + 1];
      let best = 1e9, bs = 0, bnx = 0, bny = 1;
      for (let k = 0; k < K; k++) {
        const p = inner[k], q = inner[(k + 1) % K], dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy || 1;
        const t = clamp(((x - p[0]) * dx + (y - p[1]) * dy) / l2, 0, 1), ex = x - p[0] - dx * t, ey = y - p[1] - dy * t, d = ex * ex + ey * ey;
        if (d < best) { best = d; bs = cum[k] + Math.sqrt(l2) * t; const l = Math.sqrt(d); if (l > 1e-3) { bnx = ex / l; bny = ey / l; } else { const il = 1 / Math.sqrt(l2); bnx = dy * il; bny = -dx * il; } }
      }
      let sc = bs - n.w / 2; if (sc > cum[K] / 2) sc -= cum[K];
      acc.mh[v * 2 + 1] = 1 + Math.sqrt(best); acc.piv[v * 4] = Math.abs(sc); acc.piv[v * 4 + 1] = bnx; acc.piv[v * 4 + 2] = bny; acc.piv[v * 4 + 3] = 0;
    }
    if ((i & 7) === 7) await Y();
  }
  for (const [grow, d, mat] of [[2.6, 0.5, R_CHAIN], [1.2, 0.85, R_PLASTER]]) {
    const ring = poly(nichePts(0, 20 + grow * 2, 18 + grow * 0.3, 10 + grow, 0, 8 - grow * 0.5, 12)); ring.holes.push(poly(archP));
    const g = ni(new THREE.ExtrudeGeometry(ring, { depth: d, bevelEnabled: true, bevelSize: 0.16, bevelThickness: 0.16, bevelSegments: 1, curveSegments: 1 }));
    acc.put(g, M(0, 0, ZW + 0.05), tone(C.lime, rng, 0.03).multiplyScalar(mat === R_CHAIN ? 1.04 : 1.08), { mat }); g.dispose();
  }
  // shelves under every tier and a sill under the arch
  const sh = bevelBox(22.8, 0.5, 0.8, 0.16), sh0 = bevelBox(68, 0.5, 0.8, 0.16), sl = bevelBox(24, 1.0, 1.6, 0.3);
  acc.put(sh0, M(0, 1.1, ZW + 0.3), tone(C.stone, rng, 0.04));
  for (let t = 1; t <= 4; t++) for (const s of [-1, 1]) acc.put(sh, M(s * 22.6, 1.2 + t * 7.9, ZW + 0.3), tone(C.stone, rng, 0.04));
  acc.put(sl, M(0, 7.5, ZW + 0.5), tone(C.stone, rng, 0.04));
  sh.dispose(); sh0.dispose(); sl.dispose();
  await Y();
  // china: plates on edge, lidded bowls, bottles; a brass coffee pot; two clocks
  const plate = lathe([[0.0, 0.07], [0.55, 0.05], [0.8, 0.12], [1.0, 0.22], [0.98, 0.14], [0.78, 0.02], [0.0, 0.0]], 12); plate.rotateX(Math.PI / 2); plate.translate(0, 1, 0);
  const bowl = lathe([[0.0, 0], [0.45, 0], [0.5, 0.08], [0.95, 0.5], [1.0, 0.8], [0.9, 0.86], [0.6, 1.1], [0.2, 1.2], [0.24, 1.36], [0.0, 1.42]], 8);
  // blown glass, two shapes (a straight-sided bottle with a rolled lip; a round-bellied flask with a stopper), each cut
  // fine for the niches the camera passes and coarse for the rest
  const PB = [[0.0, 0.07], [0.3, 0.0], [0.5, 0.0], [0.555, 0.06], [0.57, 0.4], [0.56, 0.9], [0.53, 1.1], [0.45, 1.28], [0.33, 1.43], [0.22, 1.55], [0.17, 1.68], [0.16, 2.02], [0.2, 2.06], [0.235, 2.12], [0.21, 2.2], [0.16, 2.24], [0.0, 2.24]];
  const PF = [[0.0, 0.06], [0.28, 0.0], [0.42, 0.02], [0.57, 0.16], [0.635, 0.4], [0.64, 0.6], [0.58, 0.84], [0.44, 1.04], [0.28, 1.2], [0.165, 1.36], [0.125, 1.6], [0.12, 1.96], [0.17, 2.02], [0.2, 2.08], [0.16, 2.15], [0.1, 2.18], [0.17, 2.3], [0.12, 2.42], [0.0, 2.45]];
  const thin = (P, keep) => P.filter((_, i) => keep.includes(i));
  const PBlo = thin(PB, [0, 2, 3, 5, 7, 9, 11, 13, 16]), PFlo = thin(PF, [0, 2, 4, 6, 8, 10, 11, 13, 16, 18]);
  const bottles = { big: [lathe(PB, 22), lathe(PF, 22)], small: [lathe(PB, 12), lathe(PF, 12)], far: [lathe(PBlo, 8), lathe(PFlo, 8)] }, BH = [2.24, 2.45];
  const pools = [];
  const pot = lathe([[0.0, 0], [0.6, 0], [0.7, 0.2], [0.42, 0.7], [0.36, 1.1], [0.62, 1.5], [0.66, 1.7], [0.3, 2.0], [0.1, 2.3], [0.14, 2.42], [0.0, 2.5]], 8);
  const spout = ni(new THREE.ConeGeometry(0.2, 1.3, 5)); spout.translate(0, 0.65, 0);
  const glassCols = ['#9c1024', '#1f7a3c', '#2A4FA8', '#c98a1e', '#9c1024', '#2A4FA8', '#6a2a62'].map((h) => C3(h, 0.8));
  let made = 0, nearNow = false;
  const piece = (kind, x, y, z, s, ry = 0) => {
    const piv = [x, y, z, K_CHINA]; made++;
    if (kind === 0) acc.put(plate, M(x, y, z, -0.12, ry, 0, s), rng() < 0.82 ? tone(C.blue, rng, 0.2) : rng.pick([C.green, C.rose]), { mat: R_CHINA, hinge: s, piv });
    else if (kind === 1) acc.put(bowl, M(x, y, z, 0, rng() * 6, 0, s), rng() < 0.85 ? tone(C.blue, rng, 0.2) : C.green, { mat: R_CHINA, hinge: 0.1, piv });
    else if (kind === 2) {
      const ry = rng() * 6, sy = s * (0.75 + 0.5 * rng()), gc = rng.pick(glassCols), sh = made % 3 === 1 ? 1 : 0, big = s > 1;
      // aMH.y is the bottle's height: the shader knows where on the glass it is (foot, liquid line, lip)
      acc.put(bottles[nearNow ? (big ? 'big' : 'small') : 'far'][sh], M(x, y, z, 0, ry, 0, s * 0.8, sy, s * 0.8), gc, { mat: R_GLASS, hinge: BH[sh] * sy, piv });
      // the light that has come through it: a pool of its colour on the floor of the niche before it and, if it stands deep
      // enough, on the plaster behind it (see buildPools)
      pools.push({ x, y, z, r: (sh ? 0.64 : 0.57) * 0.8 * s, h: BH[sh] * sy, c: gc, back: z < ZW - 0.4, big });
    }
    else { acc.put(pot, M(x, y, z, 0, 0, 0, s), C.brass, { mat: R_BRASS, piv }); acc.put(spout, M(x + 0.55 * s, y + 1.25 * s, z, 0, 0, -1.05, s), C.brass, { mat: R_BRASS, piv }); }
  };
  const clocks = [];
  for (let i = 0; i < niches.length; i++) {
    const n = niches[i], zb = ZW - 1.25, zf = ZW - 0.5, r = Math.min(n.w * 0.4, (n.hs + n.rise * 0.5) * 0.46);
    if (n.tier === 2 && Math.abs(Math.abs(n.x) - 17.9) < 0.1) { clocks.push(n); continue; }
    nearNow = n.near;
    const big = opts.wedding ? 2 : (rng() < 0.72 ? 0 : 1);
    if (big === 2) piece(2, n.x, n.y, zb, 1.5 + 0.5 * rng()); else if (big === 0) piece(0, n.x, n.y, zb, r * (0.82 + 0.18 * rng())); else piece(1, n.x, n.y, zb, 1.2 + 0.4 * rng());
    const k1 = opts.wedding ? 2 : rng.pick([0, 1, 1, 2]), k2 = i % 19 === 7 ? 3 : (opts.wedding ? rng.pick([2, 2, 1]) : rng.pick([0, 1, 2]));
    piece(k1, n.x - n.w * 0.27, n.y, zf, k1 === 0 ? 0.62 + 0.2 * rng() : 0.5 + 0.22 * rng(), 0.25);
    piece(k2, n.x + n.w * 0.27, n.y, zf - 0.1, k2 === 0 ? 0.6 + 0.2 * rng() : k2 === 3 ? 0.62 : 0.5 + 0.22 * rng(), -0.25);
    if (n.w > 3.3 || rng() < 0.5) piece(opts.wedding ? 2 : 1, n.x + (rng() - 0.5) * 0.5, n.y, ZW - 0.25, 0.34 + 0.12 * rng());
    if ((i & 7) === 7) await Y();
  }
  plate.dispose(); bowl.dispose(); pot.dispose(); spout.dispose();
  for (const k in bottles) bottles[k].forEach((g) => g.dispose());
  // two clocks whose pendulums swing
  const body = bevelBox(2.0, 4.2, 0.9, 0.2), face = lathe([[0.0, 0.08], [0.7, 0.06], [0.82, 0.0]], 12), rod = bevelBox(0.1, 1.7, 0.08, 0.03), bob = lathe([[0.0, 0.07], [0.3, 0.04], [0.34, 0.0]], 8);
  face.rotateX(Math.PI / 2); bob.rotateX(Math.PI / 2);
  for (const n of clocks) {
    const z = ZW - 0.9, piv = [n.x, n.y + 2.2, z + 0.52, K_PEND];
    acc.put(body, M(n.x, n.y + 2.1, z), tone(C.wood, rng, 0.1), { mat: R_CARVED });
    acc.put(face, M(n.x, n.y + 3.1, z + 0.46), C.lime.clone().multiplyScalar(1.1), { mat: R_CHINA, hinge: 0.82, piv: [n.x, n.y + 2.28, z, 0] });
    acc.put(rod, M(n.x, n.y + 1.35, z + 0.52), C.brass, { mat: R_BRASS, piv }); acc.put(bob, M(n.x, n.y + 0.55, z + 0.52), C.brass, { mat: R_BRASS, piv });
  }
  body.dispose(); face.dispose(); rod.dispose(); bob.dispose();
  return { niches, pieces: made, pools };
}

// The light the bottles throw: one soft quad on the niche floor before each and one on the plaster behind those that stand
// deep in their niche, drawn additively in the bottle's colour (POOL shaders). aPiv is the bottle's own pivot, so a pool
// goes with its bottle in the rooms where that bottle is missing; aPiv.w is its strength.
function buildPools(pools) {
  const pos = [], uv = [], col = [], piv = [], ZW = -ROOM_L, ZB = ZW - 1.9 + 0.07;
  // aUV: where the point is in the pool's own glow (xy; the glow is brightest at 0, 0) and in the quad (zw, -1 .. 1, for the soft edge)
  const quad = (P, c, pv, g0 = -1, g1 = 1, e0 = -1, e1 = 1) => {
    const U = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(...P[i]); uv.push(U[i][0], U[i][1] < 0 ? g0 : g1, U[i][0], U[i][1] < 0 ? e0 : e1); col.push(c.r, c.g, c.b); piv.push(...pv); }
  };
  for (const b of pools) {
    const mx = Math.max(b.c.r, b.c.g, b.c.b, 1e-3), c = { r: b.c.r / mx, g: b.c.g / mx, b: b.c.b / mx };
    // on the floor: brightest at the foot, from behind it out to the lip of the moulding, thrown a little away from the sea
    // door; and what is left of it on the shelf below the lip
    const hx = 1.5 * b.r + 0.22, z0 = Math.max(b.z - 0.9 * b.r, ZW - 1.8), z1 = ZW + 0.13, cx = b.x - 0.3 * b.r, y = b.y + 0.035, k = b.big ? 1.3 : 0.9, sk = 0.3 * b.r;
    quad([[cx - hx - sk, y, z1], [cx + hx - sk, y, z1], [cx + hx, y, z0], [cx - hx, y, z0]], c, [b.x, b.y, b.z, k], -0.75, 1.2, 0, 1);
    if (b.y < 33) quad([[cx - hx - 1.5 * sk, y - 0.15, ZW + 0.68], [cx + hx - 1.5 * sk, y - 0.15, ZW + 0.68], [cx + hx - sk, y - 0.15, ZW + 0.2], [cx - hx - sk, y - 0.15, ZW + 0.2]], c, [b.x, b.y, b.z, k], -1.25, -0.78, -1, 0);
    if (b.back) {
      const wx = (b.big ? 1.15 : 1.9) * b.r + 0.3, hy = 0.58 * b.h, bx = b.x - (b.big ? 0.35 : 0.8) * b.r, by = b.y + 0.5 * b.h;
      quad([[bx - wx, by - hy, ZB], [bx + wx, by - hy, ZB], [bx + wx, by + hy, ZB], [bx - wx, by + hy, ZB]], c, [b.x, b.y, b.z, b.big ? 0.75 : 0.4]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aPiv', new THREE.Float32BufferAttribute(piv, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 22, -ROOM_L), 50); return g;
}

// A grid surface as loose triangles: f(u, v) -> [x, y, z], u and v in 0..1.
function gridGeo(nu, nv, f) {
  const pos = [], P = (i, j) => f(i / nu, j / nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
// the same triangles facing the other way (the room is drawn single sided)
function flipGeo(g) {
  const p = g.attributes.position.array.slice(), n = g.attributes.normal.array.slice();
  for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) {
    let t = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = t;
    t = n[i + 3 + k]; n[i + 3 + k] = n[i + 6 + k]; n[i + 6 + k] = t;
  }
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  const f = new THREE.BufferGeometry(); f.setAttribute('position', new THREE.BufferAttribute(p, 3)); f.setAttribute('normal', new THREE.BufferAttribute(n, 3)); return f;
}
const two = (acc, g, m, c, o) => { acc.put(g, m, c, o); const f = flipGeo(g); acc.put(f, m, c, o); f.dispose(); };
const ball = (r, w = 7, h = 5) => niSmooth(new THREE.SphereGeometry(r, w, h));

// The bed: turned and painted posts 14 m tall, carved headboard with rosettes, mattress, pillows, the cover, a palm fan.
async function buildBed(acc, C, rng, opts, Y) {
  const X0 = 12, X1 = 22, ZH = -72, ZF = -60, post = [
    [lathe([[0.75, 0], [0.8, 0.3], [0.6, 0.5], [0.62, 3.2], [0.8, 3.5], [0.8, 4.6], [0.62, 4.9]], 8), 0, C.wood],
    [lathe([[0.62, 0], [0.4, 0.3], [0.56, 0.9], [0.66, 1.5], [0.42, 2.1], [0.36, 2.5], [0.6, 2.8]], 8), 4.9, C.red],
    [lathe([[0.6, 0], [0.62, 0.25], [0.4, 0.5], [0.34, 1.6], [0.5, 2.3], [0.56, 2.7], [0.36, 3.1]], 8), 7.7, C.indigo],
    [lathe([[0.36, 0], [0.5, 0.2], [0.3, 0.5], [0.26, 1.5], [0.44, 1.8], [0.3, 2.1], [0.5, 2.5], [0.34, 2.9], [0.14, 3.1], [0.0, 3.2]], 8), 10.8, C.green]];
  for (const [x, z] of [[X0 + 0.5, ZF - 0.5], [X1 - 0.5, ZF - 0.5], [X0 + 0.5, ZH + 0.5], [X1 - 0.5, ZH + 0.5]])
    for (const [g, y, c] of post) acc.put(g, M(x, y, z, 0, rng() * 6, 0), tone(c, rng, 0.08), { mat: R_WOOD });
  post.forEach((p) => p[0].dispose());
  await Y();
  const rail = bevelBox(0.6, 1.5, 11, 0.15), end = bevelBox(9, 1.5, 0.6, 0.15), ros = rosetteGeo(8);
  for (const x of [X0 + 0.5, X1 - 0.5]) acc.put(rail, M(x, 4.0, -66), tone(C.wood, rng), { mat: R_CARVED });
  for (const z of [ZF - 0.5, ZH + 0.5]) acc.put(end, M(17, 4.0, z), tone(C.wood, rng), { mat: R_CARVED });
  // headboard with a pointed cresting and a row of rosettes, footboard
  const head = poly([[-4.5, 0], [4.5, 0], [4.5, 4.6], [3.2, 4.6], [2.4, 5.6], [1.0, 5.9], [0, 7.2], [-1.0, 5.9], [-2.4, 5.6], [-3.2, 4.6], [-4.5, 4.6]]);
  const hg = ni(new THREE.ExtrudeGeometry(head, { depth: 0.45, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 1, curveSegments: 1 }));
  acc.put(hg, M(17, 4.7, ZH + 0.3), C.wood, { mat: R_CARVED }); hg.dispose();
  for (let i = -2; i <= 2; i++) acc.put(ros, M(17 + i * 1.7, 7.2 + (i === 0 ? 2.2 : 0), ZH + 0.92, 0, 0, 0, i === 0 ? 1.0 : 0.7), i % 2 ? C.red : C.brass, { mat: i % 2 ? R_WOOD : R_BRASS });
  const foot = bevelBox(9, 2.4, 0.45, 0.15); acc.put(foot, M(17, 5.6, ZF - 0.5), C.wood, { mat: R_CARVED }); foot.dispose();
  rail.dispose(); end.dispose(); ros.dispose();
  // mattress, pillows, fan
  const mat = bevelBox(9.4, 1.1, 11, 0.3); acc.put(mat, M(17, 5.0, -66), C.cotton, { mat: R_CLOTH }); mat.dispose();
  const pil = ball(1, 9, 6);
  acc.put(pil, M(14.8, 6.0, -70.2, 0, 0.1, 0, 2.0, 0.6, 1.2), C.cotton, { mat: R_CLOTH }); acc.put(pil, M(19.2, 6.0, -70.3, 0, -0.15, 0, 2.0, 0.65, 1.2), C.rose, { mat: R_CLOTH });
  pil.dispose();
  const fan = ni(new THREE.CircleGeometry(1.1, 9)), hd = bevelBox(0.14, 0.1, 1.5, 0.04);
  two(acc, fan, M(16.9, 6.42, -70.0, -Math.PI / 2 + 0.12, 0, 0.4), C.palm, { mat: R_LEAF }); acc.put(hd, M(17.5, 6.36, -68.8, 0, 0.45, 0), C.wood, { mat: R_WOOD });
  fan.dispose(); hd.dispose();
  await Y();
  // the cover: across the top and down both sides; aMH.y = t from head (0) to foot (1), folded back in the vertex shader
  const cov = gridGeo(12, 12, (u, v) => {
    const s = u * 15.2 - 2.5, t = 0.16 + 0.84 * v;
    const x = clamp(X0 - 0.1 + s, X0 - 0.1, X1 + 0.1), drop = Math.max(0, -s) + Math.max(0, s - 10.2);
    return [x + (drop > 0 ? (s < 0 ? -1 : 1) * 0.12 * Math.sin(v * 21) : 0), 5.62 - drop * 0.92 + 0.06 * Math.sin(u * 23 + v * 17), ZH + 12 * t];
  });
  two(acc, cov, I4, C.red, { mat: R_COVER, w: (x, y, z) => clamp((z - ZH) / 12, 0, 1) }); cov.dispose();
}

// The chest, the mango stool, the coffee tray, the jasmine, the lamps, curtains, the palm frond, geckos.
async function buildProps(acc, C, rng, opts, Y) {
  // chest: dark wood, brass studs in fans, straps and a lock plate; lid hinged along its far edge
  const lidPiv = [20, 4.1, -49, K_LID];
  const body = bevelBox(6, 3.6, 6, 0.2), lid = bevelBox(6.3, 0.9, 6.3, 0.25), footG = bevelBox(0.9, 0.6, 0.9, 0.15), strap = bevelBox(0.12, 3.7, 0.5, 0.05);
  acc.put(body, M(17, 2.3, -49), C.woodDark, { mat: R_CARVED }); acc.put(lid, M(17, 4.55, -49), tone(C.woodDark, rng), { mat: R_WOOD, piv: lidPiv });
  acc.put(quadGeo([14.3, 4.08, -46.3], [19.7, 4.08, -46.3], [19.7, 4.08, -51.7], [14.3, 4.08, -51.7]), I4, C.dark);
  for (const x of [14.5, 19.5]) for (const z of [-46.5, -51.5]) acc.put(footG, M(x, 0.3, z), C.woodDark, { mat: R_WOOD });
  for (const z of [-46.9, -51.1]) acc.put(strap, M(13.96, 2.3, z), C.brass, { mat: R_BRASS });
  const plateG = bevelBox(0.1, 1.2, 0.9, 0.04); acc.put(plateG, M(13.95, 3.4, -49), C.brass, { mat: R_BRASS });
  const stud = lathe([[0.16, 0], [0.13, 0.07], [0.07, 0.12], [0.0, 0.14]], 5); stud.rotateZ(Math.PI / 2);
  const putStud = (y, z, s = 1, piv) => acc.put(stud, M(13.98, y, z, 0, 0, 0, s), tone(C.brass, rng, 0.15), { mat: R_BRASS, piv });
  for (let f = -1; f <= 1; f++) for (let r = 0; r < 5; r++) for (let k = 1; k <= 4; k++) { const a = (r - 2) * 0.36; putStud(0.9 + Math.cos(a) * k * 0.52, -49 + f * 1.8 + Math.sin(a) * k * 0.52, 1.15 - k * 0.1); }
  for (let i = 0; i < 15; i++) { putStud(0.62, -46.3 - i * 0.386); putStud(4.55, -46.2 - i * 0.4, 0.9, lidPiv); }
  body.dispose(); lid.dispose(); footG.dispose(); strap.dispose(); plateG.dispose(); stud.dispose();
  // cloth spilling over the front when the lid is open
  const spill = gridGeo(5, 6, (u, v) => { const d = v * 5.4; return [d < 2.6 ? 16.6 - d : 13.9 - 0.25 * Math.sin(u * 9), d < 2.6 ? 4.3 + 0.15 * Math.sin(u * 7) : 4.2 - (d - 2.6) * 0.95, -47.3 - u * 3.2 + 0.2 * Math.sin(v * 8)]; });
  two(acc, spill, I4, C.rose, { mat: R_CLOTH, hinge: 0.04, piv: [17.5, 3.6, -49, K_SPILL] }); spill.dispose();
  await Y();
  // a stool with a bowl of mangoes (or limes)
  const drum = lathe([[0.0, 0], [1.3, 0], [1.4, 0.2], [1.0, 1.0], [1.4, 1.9], [1.5, 2.1], [0.0, 2.1]], 9), bowlG = lathe([[0.0, 0.1], [0.6, 0], [1.3, 0.45], [1.5, 0.9], [1.42, 0.92], [1.2, 0.5], [0.0, 0.3]], 10), fr = ball(0.5, 7, 5);
  acc.put(drum, M(15.5, 0, -41.5), C.wood, { mat: R_CARVED }); acc.put(bowlG, M(15.5, 2.1, -41.5), C.blue, { mat: R_CHINA, hinge: 0.1, piv: [15.5, 2.1, -41.5, 0] });
  for (let i = 0; i < 7; i++) { const a = i * 1.05, r = i < 5 ? 0.7 : 0.2; acc.put(fr, M(15.5 + Math.cos(a) * r, 2.75 + (i < 5 ? 0 : 0.6), -41.5 + Math.sin(a) * r, rng(), rng() * 6, 0, 1, 0.82, 0.8), tone(opts.limes ? C.lime2 : C.mango, rng, 0.18).lerp(C.rose, opts.limes ? 0 : rng() * 0.4), { mat: R_LEAF, hinge: 0 }); }
  drum.dispose(); bowlG.dispose(); fr.dispose();
  // the coffee tray on the mat: brass tray, pot, four cups
  const tray = lathe([[0.0, 0.05], [2.6, 0.05], [3.0, 0.3], [3.1, 0.32], [2.7, 0.0], [0.0, 0.0]], 14), cup = lathe([[0.0, 0], [0.2, 0], [0.34, 0.45], [0.36, 0.5], [0.3, 0.45], [0.0, 0.12]], 7);
  const dallah = lathe([[0.0, 0], [0.7, 0], [0.8, 0.25], [0.45, 0.9], [0.4, 1.4], [0.7, 1.9], [0.74, 2.1], [0.34, 2.5], [0.1, 2.9], [0.16, 3.05], [0.0, 3.15]], 9), beak = ni(new THREE.ConeGeometry(0.22, 1.5, 5));
  acc.put(tray, M(-6, 0.08, -40), C.brass, { mat: R_BRASS }); acc.put(dallah, M(-6.6, 0.15, -40.4), C.brass, { mat: R_BRASS });
  acc.put(beak, M(-5.85, 2.0, -40.4, 0, 0, -1.0), C.brass, { mat: R_BRASS });
  for (let i = 0; i < 4; i++) { const a = 0.4 + i * 0.85, x = -6 + Math.cos(a) * 1.7, z = -40 + Math.sin(a) * 1.7; acc.put(cup, M(x, 0.15, z, 0, 0, 0, 1.25), C.blue, { mat: R_CHINA, hinge: 0.1, piv: [x, 0.15, z, 0] }); }
  tray.dispose(); cup.dispose(); dallah.dispose(); beak.dispose();
  await Y();
  // jasmine in a clay pot by the sea door: leaves, and white stars that glow after dark
  const potG = lathe([[0.0, 0], [1.1, 0], [1.8, 1.0], [2.0, 2.0], [1.6, 3.0], [1.2, 3.3], [1.5, 3.6], [1.3, 3.7], [0.0, 3.5]], 10), leaf = ni(new THREE.OctahedronGeometry(1, 0));
  acc.put(potG, M(29, 0, -64), C.clay, { mat: R_PLASTER }); potG.dispose();
  for (let i = 0; i < 70; i++) {
    const a = rng() * 6.283, r = Math.sqrt(rng()) * 2.8, h = 3.8 + rng() * 5.2 * (1 - r / 4.5), k = 0.5 + rng() * 0.5, flower = i % 4 === 0;
    acc.put(leaf, M(29 + Math.cos(a) * r, h, -64 + Math.sin(a) * r, rng() * 1.2 - 0.6, a, rng() * 1.2 - 0.6, flower ? 0.3 : k * 1.3, flower ? 0.3 : k * 0.3, flower ? 0.3 : k * 0.7),
      flower ? C.white : tone(C.leaf, rng, 0.3), { mat: flower ? R_EMIS : R_LEAF, hinge: 0.12 + 0.05 * h });
  }
  // a coconut frond outside the sea door: a curved rib with leaflets either side
  const lf = gridGeo(1, 3, (u, v) => [0, (u - 0.5) * 0.7 * (1 - v * 0.8), v]);
  for (let f = 0; f < 3; f++) {
    const bz = -92 + f * 9, by = -4 + f * 2, lean = 0.5 + f * 0.25;
    for (let i = 0; i < 22; i++) {
      const t = i / 21, x = 40.5 - 1.2 * f, y = by + 30 * t - 13 * t * t, z = bz + lean * 22 * t;
      for (const s of [-1, 1]) two(acc, lf, M(x, y, z, s * (0.9 + 0.5 * t), 0.2 * s, 0, 1, 1, 5.5 * (1 - 0.6 * t)), tone(C.leaf, rng, 0.25), { mat: R_LEAF, hinge: 0.3 + 0.9 * t });
    }
  }
  leaf.dispose(); lf.dispose();
  await Y();
  // lamps: one hanging by a chain, unlit; one on the arch sill beside the model with the night's only flame
  // a footed lamp: foot, a stem with a knop, a wide bowl with a rolled rim, the oil within
  const lampG = lathe([[0.0, 0], [0.56, 0], [0.62, 0.07], [0.52, 0.18], [0.22, 0.32], [0.16, 0.66], [0.3, 0.8], [0.3, 0.9], [0.18, 1.02], [0.24, 1.14], [0.72, 1.4], [0.94, 1.76], [0.95, 1.96], [0.86, 2.06], [0.76, 2.0], [0.7, 1.9], [0.0, 1.9]], 14), chain = bevelBox(0.12, 1, 0.12, 0.04);
  const flame = lathe([[0.0, 0], [0.16, 0.08], [0.24, 0.26], [0.26, 0.45], [0.21, 0.72], [0.12, 1.05], [0.04, 1.3], [0.0, 1.4]], 10);
  // the hanging lamp, unlit until night and never lit in our day: a brass lantern with panes of coloured glass on a chain of
  // real links, each wide enough to read from the stairhead
  const LX = -17, LZ = -36, link = bevelBox(0.5, 1.05, 0.16, 0.06);
  for (let i = 0; i < 14; i++) acc.put(link, M(LX, 43.5 - i * 0.95, LZ, 0, (i % 2) * Math.PI / 2 + 0.3, 0), C.brass.clone().multiplyScalar(i % 2 ? 0.85 : 1.05), { mat: R_BRASS });
  const cap = lathe([[1.55, -0.08], [1.85, 0], [1.8, 0.22], [1.2, 0.5], [0.55, 0.95], [0.3, 1.35], [0.0, 1.5]], 10);
  const bowlL = lathe([[0.0, -2.0], [0.34, -1.72], [0.2, -1.5], [0.3, -1.15], [0.75, -0.95], [1.35, -0.6], [1.8, -0.2], [1.85, 0]], 10);
  const rib = bevelBox(0.22, 3.9, 0.22, 0.07), hoop = ni(new THREE.TorusGeometry(1.6, 0.09, 4, 12)); hoop.rotateX(Math.PI / 2);
  acc.put(cap, M(LX, 29.2, LZ), C.brass, { mat: R_BRASS }); acc.put(bowlL, M(LX, 25.3, LZ), C.brass, { mat: R_BRASS });
  for (const y of [25.4, 27.25, 29.1]) acc.put(hoop, M(LX, y, LZ), C.brass.clone().multiplyScalar(1.1), { mat: R_BRASS });
  const paneC = ['#b0182a', '#2A4FA8', '#2a8a46', '#d89a22', '#b0182a', '#2A4FA8'].map((h) => C3(h, 0.9));
  for (let i = 0; i < 6; i++) {
    const a0 = i * Math.PI / 3, a1 = a0 + Math.PI / 3, R = 1.56, x0 = LX + Math.cos(a0) * R, z0 = LZ + Math.sin(a0) * R, x1 = LX + Math.cos(a1) * R, z1 = LZ + Math.sin(a1) * R;
    acc.put(rib, M(x0, 27.25, z0, 0, -a0, 0), C.brass, { mat: R_BRASS });
    const pane = quadGeo([x1, 25.4, z1], [x0, 25.4, z0], [x0, 29.1, z0], [x1, 29.1, z1]); two(acc, pane, I4, paneC[i], { mat: R_GLASS }); pane.dispose();
  }
  link.dispose(); cap.dispose(); bowlL.dispose(); rib.dispose(); hoop.dispose();
  acc.put(lampG, M(LAMP[0], 8, LAMP[2], 0, 0, 0, 0.8, 1.08, 0.8), C.brass, { mat: R_BRASS });
  acc.put(flame, M(LAMP[0], 10.0, LAMP[2]), C.flame, { mat: R_EMIS, hinge: 2, piv: [LAMP[0], 10.0, LAMP[2], K_FLAME] });
  lampG.dispose(); chain.dispose(); flame.dispose();
  // curtains: two at the sea door drawn half aside, one across the west doorway; aMH.y = how free (0 rail .. 1 hem)
  const curtain = (x, z0, z1, top, dir) => {
    const g = gridGeo(7, 10, (u, v) => [x + dir * 0.3 * Math.sin(u * 19) * (0.4 + 0.6 * v), top - v * (top - 0.5), z0 + (z1 - z0) * u]);
    two(acc, g, I4, C.cotton, { mat: R_CLOTH, w: (px, py) => clamp((top - py) / (top - 0.5), 0, 1) ** 1.5 }); g.dispose();
    const rod = bevelBox(0.3, 0.3, Math.abs(z1 - z0) + 1.5, 0.08); acc.put(rod, M(x, top + 0.2, (z0 + z1) / 2), C.wood, { mat: R_WOOD }); rod.dispose();
  };
  curtain(HALF_W - 1.0, -70.4, -74.6, 23.4, -1); curtain(HALF_W - 1.0, -85.4, -89.6, 23.4, -1); curtain(-HALF_W + 1.0, -56.5, -67.5, 17.4, 1);
  // two geckos on the niche wall
  const gb = ball(1, 6, 4), gt = ni(new THREE.ConeGeometry(0.12, 0.9, 4)), gl = bevelBox(0.42, 0.07, 0.07, 0.02);
  GECKOS.forEach((g, i) => {
    const piv = [g[0], g[1], -109.8, K_GECKO + i], o = { mat: R_FEATHER, piv };
    acc.put(gb, M(g[0], g[1], -109.86, 0, 0, 0, 0.5, 0.17, 0.1), C.gecko, o); acc.put(gb, M(g[0] + 0.52, g[1] + 0.02, -109.86, 0, 0, 0, 0.2, 0.15, 0.09), C.gecko, o);
    acc.put(gt, M(g[0] - 0.85, g[1] - 0.05, -109.88, 0, 0, Math.PI / 2 + 0.12), C.gecko, o);
    for (const [dx, dy, r] of [[0.3, 0.22, 0.7], [0.3, -0.22, -0.7], [-0.3, 0.22, 2.3], [-0.3, -0.22, -2.3]]) acc.put(gl, M(g[0] + dx, g[1] + dy, -109.9, 0, 0, r), C.gecko, o);
  });
  gb.dispose(); gt.dispose(); gl.dispose();
}
const PERCH_Z = -95, LAMP = [5.6, 10.6, -112.4], GECKOS = [[-11.6, 15.6], [21.4, 31.6]];

// The ring perch and the parrot, in the perch's own space: origin at the ceiling hook, the ring 24 m below it.
// The parrot grips the bottom of the ring and faces +z (up the room, toward whoever comes in), so its wings open
// across the view. It is modelled facing +x and turned a quarter turn (BIRD); joints (head, wings, tail) are turned
// in the vertex shader about axes given in the same modelling frame (see birdAxis()).
function buildPerch(C, rng, opts) {
  const acc = new RAcc(7000), FY = -26.8, RY = new THREE.Matrix4().makeRotationY(-Math.PI / 2);
  const B = (x, y, z, ...r) => new THREE.Matrix4().multiplyMatrices(RY, M(x, FY + y, z, ...r)), pv = (x, y, z, k) => [-z, FY + y, x, k];
  const link = bevelBox(0.16, 1.0, 0.16, 0.05);
  for (let i = 0; i < 21; i++) acc.put(link, M(0, -0.5 - i, 0, 0, (i % 2) * Math.PI / 2, 0, i % 2 ? 1 : 1.6, 1.05, 1), tone(C.brass, rng, 0.15), { mat: R_BRASS });
  const ring = niSmooth(new THREE.TorusGeometry(3, 0.2, 6, 28)); acc.put(ring, M(0, -24, 0), C.brass, { mat: R_BRASS }); ring.dispose(); link.dispose();
  const knob = ball(0.34, 7, 5); acc.put(knob, M(0, -21, 0), C.brass, { mat: R_BRASS }); knob.dispose();
  // the bird
  const b = ball(1, 12, 9), F = { mat: R_FEATHER }, body = pv(0, 0, 0, K_BODY), my = opts.myna;
  const grey = C.feather, pale = C.feather.clone().lerp(C.white, my ? 0.1 : 0.5), face = my ? C.beak.clone().multiplyScalar(0.95) : C.white.clone().multiplyScalar(0.92);
  const wingC = C.feather.clone().multiplyScalar(my ? 0.8 : 0.78), quill = C.feather.clone().multiplyScalar(my ? 0.5 : 0.42), crown = my ? C3('#0c0b0e') : C.feather.clone().multiplyScalar(1.08);
  acc.put(b, B(-0.04, 1.25, 0, 0, 0, -0.24, 0.66, 1.05, 0.64), grey, { ...F, piv: body });
  acc.put(b, B(0.2, 1.05, 0, 0, 0, -0.1, 0.5, 0.78, 0.54), pale, { ...F, piv: body });                          // pale scalloped breast
  acc.put(b, B(0.02, 0.5, 0, 0, 0, 0, 0.42, 0.42, 0.46), grey.clone().multiplyScalar(0.92), { ...F, piv: body }); // thighs
  const hp = pv(0.08, 1.95, 0, K_HEAD);
  acc.put(b, B(0.22, 2.34, 0, 0, 0, 0, 0.58, 0.55, 0.52), crown, { ...F, piv: hp });
  acc.put(b, B(0.08, 1.95, 0, 0, 0, -0.2, 0.46, 0.4, 0.46), grey, { ...F, piv: hp });                           // neck
  const toe = bevelBox(0.5, 0.2, 0.16, 0.06), iris = ball(1, 8, 6);
  for (const s of [-1, 1]) {
    acc.put(b, B(0.44, 2.36, s * 0.36, 0, 0, 0, 0.36, 0.34, 0.2), face, { ...F, piv: hp });                     // the bare pale face
    acc.put(iris, B(0.56, 2.44, s * 0.5, 0, 0, 0, 0.13, 0.13, 0.07), C.eye, { mat: R_EMIS, piv: hp });
    acc.put(iris, B(0.585, 2.44, s * 0.545, 0, 0, 0, 0.06, 0.06, 0.035), C.dark, { mat: R_WOOD, piv: hp });
    acc.put(toe, B(0.1, 0.1, s * 0.24, 0, 0, -0.15), C.beak, { mat: R_WOOD, piv: body });
    acc.put(toe, B(-0.12, 0.02, s * 0.24, 0, 0, 0.6, 0.7, 1, 1), C.beak, { mat: R_WOOD, piv: body });
    // wings: coverts, then a hand of long flight feathers that fans out when the wing is raised
    const wp = pv(0.08, 1.92, s * 0.52, s > 0 ? K_WINGL : K_WINGR);
    acc.put(b, B(-0.12, 1.3, s * 0.62, 0, 0, -0.26, 0.5, 0.92, 0.15), wingC, { ...F, piv: wp });
    acc.put(b, B(-0.3, 0.95, s * 0.66, 0, 0, -0.42, 0.34, 0.8, 0.1), wingC.clone().multiplyScalar(0.9), { ...F, piv: wp });
    const fl = bevelBox(0.3, 1, 0.045, 0.02); fl.translate(0, -0.5, 0);
    for (let i = 0; i < 7; i++) {
      const t = i / 6, len = 1.25 + 0.55 * Math.sin(t * Math.PI * 0.8 + 0.4);
      acc.put(fl, B(-0.16 - 0.12 * t, 1.0 - 0.1 * t, s * (0.7 + 0.012 * i), s * 0.05, 0, 0.12 - 0.92 * t, 1 - 0.25 * t, len, 1), (my && i > 3 ? C.white : quill).clone().multiplyScalar(0.85 + 0.3 * (i % 2)), { ...F, piv: wp });
    }
    fl.dispose();
  }
  toe.dispose(); iris.dispose();
  // the hooked beak: an upper mandible curving down over a short lower one
  const hook = gridGeo(6, 5, (u, v) => {
    const be = v * 1.75, R = 0.4, r = 0.24 * Math.pow(1 - v, 0.7) + 0.004, ph = u * Math.PI * 2, cx = R * Math.sin(be), cy = -R * (1 - Math.cos(be));
    const k = r * Math.cos(ph);
    return [cx + Math.sin(be) * k, cy + Math.cos(be) * k, r * 0.8 * Math.sin(ph)];
  });
  acc.put(hook, B(0.66, 2.38, 0, 0, 0, 0.25, 1.15), C.beak, { mat: R_WOOD, piv: hp }); hook.dispose();
  const bk = ni(new THREE.ConeGeometry(0.17, 0.4, 6)); bk.translate(0, 0.2, 0);
  acc.put(bk, B(0.62, 2.14, 0, 0, 0, -2.25, 1, 1, 0.8), C.beak.clone().multiplyScalar(my ? 0.85 : 1.6), { mat: R_WOOD, piv: hp }); bk.dispose();
  // the tail: a fan of red feathers below the ring bar
  const tp = pv(-0.34, 0.62, 0, K_TAIL), tf = bevelBox(0.36, 1.75, 0.06, 0.03); tf.translate(0, -0.875, 0);
  for (let i = -3; i <= 3; i++) acc.put(tf, B(-0.34, 0.64, i * 0.06, i * 0.2, 0, -0.34, 1, 1 - Math.abs(i) * 0.07, 1), tone(my && Math.abs(i) > 1 ? C.white : C.tail, rng, 0.12), { ...F, piv: tp });
  tf.dispose(); b.dispose();
  const g = acc.build(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -14, 0), 16); return g;
}
// a joint axis given in the bird's modelling frame (facing +x), turned into the perch's frame (facing +z)
const birdAxis = (v, x, y, z, a) => v.set(-z, y, x, a);

// A single grey feather for the hour the parrot is gone.
function buildFeather(C) {
  const acc = new RAcc(200), g = gridGeo(2, 5, (u, v) => [(u - 0.5) * 0.5 * Math.sin(Math.PI * Math.min(1, 0.15 + v)), v * 1.9 - 0.95, 0.12 * Math.sin(v * 3)]);
  two(acc, g, I4, C.feather.clone().lerp(C.white, 0.35), { mat: R_FEATHER }); g.dispose();
  const out = acc.build(); out.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2); return out;
}

// Panels outside the openings (east: the sea; west and above: sky), and the shaft sheets.
function buildOutside() {
  const X = 43, pos = [], q = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  q([X, -8, 4], [X, -8, -118], [X, 52, -118], [X, 52, 4]);
  q([-X, -8, -118], [-X, -8, 4], [-X, 52, 4], [-X, 52, -118]);
  q([-X, 52, 4], [X, 52, 4], [X, 52, -118], [-X, 52, -118]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 22, -57), 90); return g;
}
function buildShafts() {
  const pos = [], info = [], idx = [], SEG = 4;
  const sheet = (a, b, id) => {
    const base = pos.length / 3;
    for (let i = 0; i <= SEG; i++) for (const [p, s] of [[a, 0], [b, 1]]) { pos.push(...p); info.push(i / SEG, id, s); }
    for (let i = 0; i < SEG; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
  };
  for (let i = 0; i < 7; i++) { const z = -71.5 - i * 2.83; sheet([HALF_W, 0.5, z], [HALF_W, 23.5, z], 0); }
  for (const z of [-48, -52, -56, -98, -101, -104]) sheet([HALF_W, 9.5, z], [HALF_W, 24.5, z], 3);
  for (const z of [-98, -94, -90, -80, -76, -72]) sheet([-HALF_W, 24.5, z], [-HALF_W, 39.5, z], 2);
  for (let i = 0; i < 9; i++) { const z = -42 - i * 3.25; sheet([-10, ROOM_H, z], [10, ROOM_H, z], 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 22, -57), 110); return g;
}

// Motes for the beams: each is born at a point of an opening and stands somewhere down the light from it (MOTE shaders).
function buildMotes(rng, k) {
  const pos = [], info = [], cor = [], C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const put = (n, id, f) => {
    for (let i = 0; i < Math.round(n * k); i++) {
      const p = f(), t = Math.pow(rng(), 0.8), sd = rng();
      for (const j of [0, 1, 2, 0, 2, 3]) { pos.push(p[0], p[1], p[2]); info.push(t, id, sd); cor.push(C[j][0], C[j][1]); }
    }
  };
  put(210, 0, () => [HALF_W, 0.8 + 22.4 * rng(), -70.5 - 19 * rng()]);
  put(90, 3, () => { const far = rng() < 0.45; return [HALF_W, 9.8 + 14.4 * rng(), far ? -96.5 - 9 * rng() : -46.5 - 11 * rng()]; });
  put(130, 2, () => [-HALF_W, 24.8 + 14.4 * rng(), rng() < 0.5 ? -88.5 - 11 * rng() : -70.5 - 11 * rng()]);
  put(170, 1, () => [-9.5 + 19 * rng(), ROOM_H, -40.5 - 29 * rng()]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(cor, 2));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 22, -57), 110); return g;
}

// Dust for the gap behind the arch (GAP shaders): x, y and where along the gap each mote starts. It has a stream of its own.
function buildGapDust(rng, n) {
  const pos = [], seed = [], cor = [], C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let i = 0; i < n; i++) {
    const x = -16 + 32 * rng(), y = 2 + 40 * rng(), a0 = 13.5 * rng(), s0 = rng(), s1 = rng(), s2 = rng();
    for (const j of [0, 1, 2, 0, 2, 3]) { pos.push(x, y, a0); seed.push(s0, s1, s2); cor.push(C[j][0], C[j][1]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(cor, 2));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 25, -ROOM_L - 13), 42); return g;
}

// ---------------------------------------------------------------- the flight
// The route by u is the old straight fall down the axis (base), kept exactly outside u 0.38 .. 0.66. Inside that window the
// camera really flies two loops: in the squall room down the left side, round along the niche shelves two metres from the
// plaster (u 0.43), up past the parrot on its ring (0.475) and back round to the axis for the dive (0.52, as before); in the
// sunset room down to the sill, across the model's open door at the height of its windows (0.61), back up the room over the
// bed and round to the axis (0.655). The engine knows the path by nominal distance d = u * base.length; S(u) is the real
// distance flown, so the loops cost no u, and vn(u), the nominal speed, is solved so that the real speed follows SPEED.
// Two small leads (8 m at u 0.16, 3.8 m at u 0.79) put the camera just inside each pair of open door leaves.
// a quarter or half turn to the right as seen from above: points on a circle from angle a0 to a1 (0 = west of the centre,
// 90 = at its far side, toward the niche wall), climbing from y0 to y1
const arc = (cx, cz, r, a0, a1, n, y0, y1) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (a0 + (a1 - a0) * t) * Math.PI / 180; return [cx - r * Math.cos(a), y0 + (y1 - y0) * t, cz - r * Math.sin(a)]; });
const AT = (cx, cz, r, deg, y) => [cx - r * Math.cos(deg * Math.PI / 180), y, cz - r * Math.sin(deg * Math.PI / 180)];
const P3 = [[0, 18, 6], [-3, 17.6, -12], [-11, 16.6, -34], [-20, 15.4, -58], [-27.5, 14.2, -80], [-30.6, 13.2, -91], ...arc(-26, -99.5, 5, 0, 180, 8, 12.6, 17.5),
  [-21, 19.6, -96], [-21, 20.5, -92.5], [-21, 20.2, -84], ...arc(-10.5, -76, 10.5, 360, 180, 8, 19.6, 18), [0, 18, -78], [0, 18, -80], [0, 18, -84], [0, 18, -96], [0, 18, -120], [0, 18, -140]];
const P4 = [[0, 18, 10], [0, 18, 0], [-1, 17.8, -12], [-3.5, 16.6, -40], [-6, 15, -70], [-7.6, 13.2, -88], [-6.6, 11.6, -98], [-4.6, 10.4, -104.5], [-2.6, 9.9, -107.9], [-0.8, 9.8, -109.3],
  [1, 9.9, -109.7], [2.8, 10.3, -108.9], [4.8, 11.2, -106.6], [7.4, 12.6, -103], [11, 14.4, -98], [15, 16, -93], [18.6, 17.4, -88], [19.6, 19.6, -76], [20, 20, -58], [20, 19.6, -42], [20, 19.2, -32],
  ...arc(10, -23, 10, 180, 360, 8, 19, 18), [0, 18, -25.5]];
const MARKS3 = { stair3: [0, 18, 0], turn3: AT(-26, -99.5, 5, 0, 12.6), wall: AT(-26, -99.5, 5, 60, 14.23), bird: AT(-26, -99.5, 5, 180, 17.5), view: [-21, 20.5, -92.5], leg: [-21, 20.2, -84], uturn3: [0, 18, -76] };
const MARKS4 = { stair4: [0, 18, 0], dn: [-6.6, 11.6, -98], peek: [-2.6, 9.9, -107.9], front: [-0.8, 9.8, -109.3], away: [11, 14.4, -98], bed: [19.6, 19.6, -76],
  back: AT(10, -23, 10, 180, 19), uturn4: AT(10, -23, 10, 360, 18) };
const SPEED = [['a0', 0, 0], ['stair3', 0, 22], ['stair3', 30, 36], ['turn3', -40, 36], ['turn3', -2, 7], ['wall', -2, 4.2], ['wall', 1, 3.4], ['wall', 9, 3.6], ['bird', 0, 5.5], ['view', -2, 6.5],
  ['view', 2, 7.5], ['leg', 0, 11], ['leg', 14, 11.5], ['uturn3', 0, 11.5], ['keep', 0, 13.5], ['arch', 0, 24], ['door', 0, 27], ['stair4', 0, 29], ['stair4', 30, 33], ['dn', -34, 32], ['dn', -2, 8.5],
  ['peek', -1, 4.2], ['front', 0, 3], ['front', 4, 4.6], ['away', -6, 11], ['away', 0, 15], ['bed', 0, 34], ['back', -26, 34], ['back', 0, 14], ['uturn4', -3, 14], ['a1', 0, 0]];
async function makeFlight(base, oldPace, oldDuration, Y) {
  const L = base.length, U0 = 0.38, UA = 0.385, U1 = 0.66, d0 = U0 * L, d1 = U1 * L, ss = smoothstep;
  const zA = base.pointAt(U0).z, zB = base.pointAt(U1).z, Z3 = -2 * PITCH, Z4 = -3 * PITCH, v = new THREE.Vector3(), v2 = new THREE.Vector3();
  const r3 = (p) => [p[0], p[1], Z3 + p[2]], r4 = (p) => [p[0], p[1], Z4 + p[2]];
  const B = makePath([[0, 18, zA + 20], [0, 18, zA + 10], [0, 18, zA], [0, 18, zA - 10], ...P3.map(r3), ...P4.map(r4), [0, 18, zB], [0, 18, zB - 10], [0, 18, zB - 20]], { samples: 64 });
  await Y();
  const LB = B.length - 40, S1 = d0 + LB, LR = L + LB - (d1 - d0);
  // the real route by metres flown
  const R = (S, out) => (S <= d0 ? base.posAtDist(S, out) : S < S1 ? B.posAtDist(20 + S - d0, out) : base.posAtDist(S - S1 + d1, out));
  const RT = (S, out) => (S <= d0 ? base.tangentAtDist(S, out) : S < S1 ? B.tangentAtDist(20 + S - d0, out) : base.tangentAtDist(S - S1 + d1, out));
  // marks: metres into the window at which the route passes the places the script is keyed to, found in order
  const NS = Math.ceil(LB * 3), bx = new Float32Array(NS + 1), by = new Float32Array(NS + 1), bz = new Float32Array(NS + 1);
  for (let i = 0; i <= NS; i++) { B.posAtDist(20 + (i / NS) * LB, v); bx[i] = v.x; by[i] = v.y; bz[i] = v.z; if ((i & 255) === 255) await Y(); }
  let cur = 0;
  const mark = (p) => {
    let best = 1e9, bi = cur;
    for (let i = cur; i <= NS; i++) { const d = (bx[i] - p[0]) ** 2 + (by[i] - p[1]) ** 2 + (bz[i] - p[2]) ** 2; if (d < best) { best = d; bi = i; } if (d > best + 900) break; }
    cur = bi; return (bi / NS) * LB;
  };
  // on the straight axis legs a place is found exactly, by its z
  const markZ = (z) => { let a = mark([0, 18, z]) - 1, b = a + 2; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (B.posAtDist(20 + m, v).z > z) a = m; else b = m; } return (a + b) / 2; };
  const m = { a0: 0, a1: LB };
  for (const k in MARKS3) m[k] = mark(r3(MARKS3[k]));
  m.keep = markZ(base.pointAt(0.52).z); m.arch = mark(r3([0, 18, -104])); m.door = mark(r3([0, 18, -130]));
  for (const k in MARKS4) m[k] = mark(r4(MARKS4[k]));
  await Y();
  // the old nominal speed, and the real speed wanted through the window
  const NP = 64, op = new Float32Array(NP + 1), tp = new Float32Array(NP + 1); let inv = 0;
  for (let i = 0; i <= NP; i++) op[i] = clamp(oldPace(i / NP), 0.35, 2.5);
  for (let i = 0; i < NP; i++) inv += 2 / (op[i] + op[i + 1]);
  const kOld = inv / NP, vOld = (u) => { const x = clamp(u, 0, 1) * NP, i = Math.min(NP - 1, Math.floor(x)); return Math.min((op[i] + (op[i + 1] - op[i]) * (x - i)) * kOld * L / oldDuration, 25); };
  const sk = SPEED.map((k) => [m[k[0]] + k[1], k[2]]); sk[0][1] = sk[sk.length - 1][1] = vOld(U1);
  const speed = (s) => { let i = 0; while (i < sk.length - 2 && sk[i + 1][0] < s) i++; return lerp(sk[i][1], sk[i + 1][1], ss(sk[i][0], sk[i + 1][0], s)); };
  // the nominal speed asked of the engine inside the window: five levels, one for each stretch between places fixed in u.
  // It starts down toward the first level a little before the window (in the gap before the door) and is back by u 0.664
  const fixU = [0.43, 0.475, 0.52, 0.61, U1], fixS = [m.wall, m.view, m.keep, m.front, LB], c = [3.8, 11, 7, 8.5, 4.2], NF = fixU.length, err = [0, 0, 0, 0, 0];
  const stepAt = [[0.423, 0.431], [0.46, 0.473], [0.504, 0.518], [0.594, 0.608]];
  const vnT = (u) => {
    if (u <= 0.35 || u >= 0.664) return vOld(u);
    if (u < UA) return lerp(vOld(u), c[0], ss(0.35, 0.38, u));
    let lev = c[0]; for (let j = 1; j < NF; j++) lev += (c[j] - c[j - 1]) * ss(stepAt[j - 1][0], stepAt[j - 1][1], u);
    return lerp(lev, vOld(u), ss(0.652, 0.664, u));
  };
  // The engine follows the pace it is given with a lag, so the real distance S(u) is laid down by flying the window the way
  // the engine will (its own pace table, its own easing): at each moment the real speed is SPEED and u moves at the engine's
  // nominal speed. Flown like that again, the camera has exactly SPEED; a viewer's speed setting scales it.
  const NT = 2200, du = (U1 - UA) / NT, tab = new Float32Array(NT + 1), sA = (UA - U0) * L, DT = 1 / 60, EASE = 1 - Math.exp(-DT * 1.4);
  let Tall = oldDuration, kNew = 1, spEnd = vOld(U1);
  const plan = () => {
    let T = 0; const NI = 640;
    for (let i = 0; i < NI; i++) T += L / NI / vnT((i + 0.5) / NI);
    Tall = T; inv = 0;
    for (let i = 0; i <= NP; i++) tp[i] = clamp(vnT(i / NP) * T / L, 0.35, 2.5);
    for (let i = 0; i < NP; i++) inv += 2 / (tp[i] + tp[i + 1]);
    kNew = inv / NP;
  };
  const target = (u) => { const x = clamp(u, 0, 1) * NP, i = Math.min(NP - 1, Math.floor(x)); return (tp[i] + (tp[i + 1] - tp[i]) * (x - i)) * kNew * L / Tall; };
  const fly = (upTo) => {
    plan();
    let u = 0.3, sp = target(u), s = -1, it = 0, uPrev = u, sPrev = 0;
    while (u < UA) { sp += (target(u) - sp) * EASE; u += sp * DT / L; }
    s = sA + (u - UA) * L; sk[0][1] = sp; sk[sk.length - 1][1] = spEnd; tab[0] = sA; uPrev = UA; sPrev = sA;
    while (uPrev < upTo && s < LB + 400) {
      // fill the table across this step
      while (it < NT && UA + (it + 1) * du <= u) { it++; tab[it] = sPrev + (s - sPrev) * ((UA + it * du - uPrev) / Math.max(u - uPrev, 1e-9)); }
      uPrev = u; sPrev = s;
      sp += (target(u) - sp) * EASE; u += sp * DT / L; s += speed(Math.min(s, LB)) * DT;
    }
    if (upTo >= U1) spEnd = sp;
    const x = (Math.min(upTo, U1) - UA) / du, i = Math.min(NT - 1, Math.floor(x));
    return tab[i] + (tab[Math.min(i + 1, it)] - tab[i]) * (x - i);
  };
  for (let sweep = 0; sweep < 4; sweep++) for (let j = 0; j < NF; j++) {
    let a = 2.5, b = 40;
    for (let k = 0; k < 18; k++) { c[j] = Math.sqrt(a * b); if (fly(fixU[j]) > fixS[j]) a = c[j]; else b = c[j]; }
    await Y();
  }
  fly(U1 + 0.001);
  // what is left of the error at the fixed places is taken out stretch by stretch
  { let i0 = 0, e0 = 0; for (let j = 0; j < NF; j++) { const i1 = Math.round((fixU[j] - UA) / du), e1 = err[j] = fixS[j] - tab[i1]; for (let i = i0 + 1; i <= i1; i++) tab[i] += lerp(e0, e1, (i - i0) / (i1 - i0)); i0 = i1; e0 = e1; } }
  const lead = (u) => 8 * ss(0.12, 0.16, u) * (1 - ss(0.16, 0.205, u)) + 3.8 * ss(0.745, 0.79, u) * (1 - ss(0.79, 0.83, u));
  const Sof = (u) => {
    if (u <= UA) return u * L + lead(u);
    if (u >= U1) return S1 + (u - U1) * L + lead(u);
    const x = (u - UA) / du, i = Math.min(NT - 1, Math.floor(x)); return d0 + tab[i] + (tab[i + 1] - tab[i]) * (x - i);
  };
  // the place in the day's story: the real z, except on the loops, where it runs on steadily from stairhead to axis
  const zProg = (u) => {
    const s = Sof(u) - d0;
    if (s > m.stair3 && s < m.uturn3) return Z3 + (s < m.leg ? lerp(0, -50, (s - m.stair3) / (m.leg - m.stair3)) : lerp(-50, -76, (s - m.leg) / (m.uturn3 - m.leg)));
    if (s > m.stair4 && s < m.uturn4) return Z4 + lerp(0, -23, (s - m.stair4) / (m.uturn4 - m.stair4));
    return R(Sof(u), v2).z;
  };
  const uOf = (s) => { let a = UA, b = U1; for (let k = 0; k < 30; k++) { const mid = (a + b) / 2; if (Sof(mid) - d0 < s) a = mid; else b = mid; } return (a + b) / 2; };
  const loopK = (u) => ss(0.396, 0.408, u) * (1 - ss(0.505, 0.518, u)) + ss(0.564, 0.575, u) * (1 - ss(0.644, 0.654, u));
  const ahead = (u, gap) => lerp(gap, Math.min(gap, 15), loopK(u));
  // the path the engine flies: the same length and the same places by u as the old one outside the window
  // Who is asking. The engine asks for the camera's place with the camera's own position vector as the output (the world
  // hands that vector over each frame, see setEye) and for its look-ahead point in the very next call: only that one call
  // is given the world's aim (gaze() in build), so the steady camera looks where the sweeping one does. Every other request
  // (a companion flying ahead, a ride) is answered from the real route: on the loops, so many real metres ahead of the
  // camera. Should the engine ever stop passing the camera's vector, nothing is recognised and every request is simply the
  // route at that distance: the camera's place is still exact, and the sweeping camera's gaze still comes from the poi.
  let eye = null, camD = -1, wantLook = false, aim = null;
  const path = {
    curve: base.curve, length: L, points: base.points, start: base.start, end: base.end, startTangent: base.startTangent, endTangent: base.endTangent, realLength: LR,
    posAtDist(d, out = new THREE.Vector3()) {
      if (d <= 0 || d >= L) { wantLook = false; return base.posAtDist(d, out); }
      if (eye !== null && out === eye) { camD = d; wantLook = true; return R(Sof(d / L), out); }
      const look = wantLook, ub = camD / L, gap = d - camD; wantLook = false;
      if (camD > 0 && ub > UA && ub < U1 && gap > 0 && gap < 130) {
        if (look && aim) return out.copy(aim(ub));
        return R(Sof(ub) + (look ? ahead(ub, gap) : gap), out);
      }
      return R(Sof(d / L), out);
    },
    tangentAtDist(d, out = new THREE.Vector3()) {
      if (d <= 0 || d >= L) return base.tangentAtDist(d, out);
      const ub = camD / L, gap = d - camD;
      // a direction asked for ahead of the camera on the loops (the engine banks by it, a ride would turn by it) is taken a
      // few real metres on and counts for little, so the close views stay level
      if (camD > 0 && ub > UA && ub < U1 && gap > 0.5 && gap < 130) { const S = Sof(ub); RT(S, out); return out.multiplyScalar(0.86).addScaledVector(RT(S + 5, v2), 0.14).normalize(); }
      return RT(Sof(d / L), out);
    },
    pointAt(u, out = new THREE.Vector3()) { return u <= 0 || u >= 1 ? base.pointAt(u, out) : R(Sof(u), out); },
    tangentAt(u, out = new THREE.Vector3()) { return path.tangentAtDist(u * L, out); },
    nearestXZ: (x, z) => base.nearestXZ(x, z), distanceTo: (x, y, z) => Math.min(base.distanceTo(x, y, z), B.distanceTo(x, y, z)),
    isClear: (x, y, z, radius = 0, margin = 4) => path.distanceTo(x, y, z) > radius + margin, frameAt: (end, out, tilt) => base.frameAt(end, out, tilt),
  };
  // the pace that asks for those nominal speeds, and how long the flight then lasts
  // Brisker everywhere but at the two close views (the shelves, the model's door). This is pace alone: S(u), and so the place
  // at every u, is exactly as planned above. The squall room's dive is eased a little and the sunset room's is the fastest
  // of the flight, so each crossing is quicker than the last.
  const bump = (u, a, b, cc, d) => ss(a, b, u) * (1 - ss(cc, d, u));
  const brisk = (u) => 1 + 0.15 * (1 - ss(0.33, 0.36, u)) + 0.6 * bump(u, 0.356, 0.372, 0.381, 0.389) + 0.35 * bump(u, 0.442, 0.456, 0.468, 0.477)
    + 0.25 * bump(u, 0.477, 0.487, 0.508, 0.519) - 0.1 * bump(u, 0.516, 0.526, 0.544, 0.552) + 0.25 * bump(u, 0.577, 0.585, 0.596, 0.604)
    + 0.3 * bump(u, 0.64, 0.646, 0.655, 0.663) + 0.5 * bump(u, 0.655, 0.663, 0.672, 0.7) + 0.2 * bump(u, 0.66, 0.69, 0.85, 0.9);
  let T2 = 0; { const NI = 640; for (let i = 0; i < NI; i++) { const u = (i + 0.5) / NI; T2 += L / NI / (vnT(u) * brisk(u)); } }
  const pace = (u) => { const x = clamp(u, 0, 1); return vnT(x) * brisk(x) * T2 / L; };
  return { path, R, RT, Sof, zProg, uOf, m, d0, pace, duration: T2, loopK, ahead, vnT, speed, c, err, setAim(f) { aim = f; }, setEye(v) { eye = v; } };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'house-in-the-niche',
  name: 'The House in the Niche',
  category: 'domestic',
  weirdness: 0.5,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const Y = () => ctx.yield();
    // season and swaps (seeded): the long rains, kaskazi, or a wedding week
    const sr = rng.fork('season-of-the-house');
    let season = sr.pick(['rains', 'kaskazi', 'wedding']);
    if (vary.hour === 'golden') season = 'kaskazi';
    const opts = { wedding: season === 'wedding', limes: sr.chance(0.5), rust: sr.chance(0.5), myna: sr.chance(0.3) };
    const looks = makeLooks(season), P = PAL.map((h) => new THREE.Color(h));
    // the dark behind the arches: one colour object, the scene's background; the fronts sink into the same object (uDark)
    const bg = new THREE.Color(INDIGO), scene = new THREE.Scene(); scene.background = bg;
    const lime = P[0].clone().multiplyScalar(0.8);
    const C = {
      lime, stone: lime.clone().lerp(P[3], 0.12).lerp(P[5], 0.14), floor: C3('#d6d4ca', 0.78), wood: P[5].clone().lerp(C3('#8a5636'), 0.5), woodLight: C3('#a8744a'),
      woodDark: P[5].clone().multiplyScalar(1.15), pole: P[5].clone().lerp(C3('#6a4a34'), 0.5), brass: P[6].clone().lerp(P[2], 0.18).multiplyScalar(0.85),
      blue: P[1].clone(), green: P[2].clone().multiplyScalar(0.8), rose: P[3].clone().multiplyScalar(0.85), indigo: P[4].clone().multiplyScalar(1.3), red: C3('#a8281f'),
      cotton: P[0].clone().multiplyScalar(0.86), palm: C3('#b9a45c'), leaf: P[2].clone().lerp(C3('#2f6a2a'), 0.62), clay: P[3].clone().lerp(P[5], 0.4),
      flame: P[6].clone(), white: C3('#f4f4ee'), dark: C3('#05060c'), violet: C3('#6a58b0'), leather: C3('#5a3a24'), mango: C3('#f0a030'), lime2: C3('#8fb53a'),
      feather: opts.myna ? C3('#3a2c24') : C3('#8a8f98'), tail: opts.myna ? C3('#e8e4d6') : C3('#c8281e'), beak: opts.myna ? C3('#f2b21a') : C3('#16161a'),
      eye: C3('#f8eaa0'), gecko: C3('#6e6236'),
    };
    await Y();
    // the hero: one front per level, sharing geometry and program
    const hero = await buildHero(ctx, { palette: PAL, look: 'morning', back: false, impostor: false, progress: 0, plinth: true });
    const fronts = [hero];
    for (let i = 1; i < 6; i++) { fronts.push(hero.makeLevel()); await Y(); }
    // the room, once
    const acc = new RAcc(130000);
    await buildShell(acc, C, rng.fork('shell'), detail, Y); await Y();
    const wallInfo = await buildNicheWall(acc, C, rng.fork('wall'), opts, Y); await Y();
    await buildBed(acc, C, rng.fork('bed'), opts, Y); await Y();
    await buildProps(acc, C, rng.fork('props'), opts, Y); await Y();
    const roomGeo = acc.build(); await Y();
    roomGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 22, -57), 92);
    const perchGeo = buildPerch(C, rng.fork('perch'), opts), featherGeo = buildFeather(C); await Y();
    const outsideGeo = buildOutside(); await Y();
    const poolGeo = wallInfo.pools.length ? buildPools(wallInfo.pools) : null; await Y();
    const moteGeo = buildMotes(rng.fork('motes'), detail * density); await Y();
    const shaftGeo = buildShafts();
    await Y();
    // (a new thing takes a stream of its own, so that nothing dealt before it moves)
    const gapGeo = buildGapDust(ctx.core.makeRng(ctx.core.hashSeed('gap-dust:' + ctx.seed)), Math.round(800 * detail * density));
    await Y();

    const roomBase = new THREE.ShaderMaterial({
      vertexShader: ROOM_VERT, fragmentShader: ROOM_FRAG,
      uniforms: {
        uToLocal: { value: new THREE.Matrix4() }, uTime: { value: 0 }, uWind: { value: 0.1 }, uLevel: { value: 0 }, uLid: { value: 0 }, uCover: { value: 0 },
        uParrot: { value: 1 }, uLampOn: { value: 0 }, uJ: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1, 0, 0)) }, uGeck: { value: [new THREE.Vector3(), new THREE.Vector3()] },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uBounce: { value: new THREE.Color() },
        uGlowCol: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uLampPos: { value: new THREE.Vector3(...LAMP) }, uLampCol: { value: new THREE.Color(0, 0, 0) },
        uStainA: { value: new THREE.Color() }, uStainB: { value: new THREE.Color() }, uHazeK: { value: 0.002 }, uStain: { value: 0 }, uSlits: { value: 0 }, uSpill: { value: 0 },
        uLace: { value: 1 }, uGleam: { value: 0 }, uEmis: { value: 0 }, uCaust: { value: 0 }, uGold: { value: opts.wedding ? 1 : 0 },
        uAreaK: { value: 800 }, uWallFill: { value: 0 }, uLaceDrift: { value: 0 }, uFrond: { value: 0 },
        uBarDir: { value: new THREE.Vector3(0, 1, 0) }, uBarCol: { value: new THREE.Color(0, 0, 0) }, uLowFill: { value: new THREE.Color(0, 0, 0) },
        uBarDir2: { value: new THREE.Vector3(0, 1, 0) }, uCeil: { value: new THREE.Color(0, 0, 0) }, uWallTint: { value: new THREE.Color(1, 1, 1) }, uNicheSun: { value: 0.65 }, uReveal: { value: 1 },
        uRim: { value: new THREE.Color(0, 0, 0) }, uStone: { value: C.stone.clone() }, uNicheAmb: { value: 0.8 }, uBody: { value: 1 }, uLowFloor: { value: 0.8 },
      },
    });
    const seaBase = new THREE.ShaderMaterial({
      vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide,
      uniforms: {
        uToLocal: { value: new THREE.Matrix4() }, uTime: { value: 0 }, uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uWater: { value: new THREE.Color() },
        uDeep: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uSail: { value: new THREE.Color() },
        uGrey: { value: C.feather.clone() }, uEye: { value: new THREE.Vector4(-80, 12, 0, 0) }, uStars: { value: 0 }, uWind: { value: 0 }, uDhow: { value: 0 },
        uFleet: { value: season === 'kaskazi' ? 1 : 0 }, uSailK: { value: 1 }, uBats: { value: 0 }, uShimmer: { value: 0 }, uGain: { value: 1 }, uGlit: { value: 1 },
      },
    });
    const shaftBase = new THREE.ShaderMaterial({
      vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uToLocal: { value: new THREE.Matrix4() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uShaft: { value: new THREE.Vector4() },
        uShaftCol: { value: new THREE.Color() }, uTime: { value: 0 }, uLace: { value: 1 } },
    });
    const moteBase = new THREE.ShaderMaterial({ vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {} });
    const gapBase = new THREE.ShaderMaterial({
      vertexShader: GAP_VERT, fragmentShader: GAP_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uRoomCol: { value: new THREE.Color() }, uDoorCol: { value: new THREE.Color() }, uDoorAt: { value: new THREE.Vector4(0, 0, 0, 1) } },
    });
    const poolBase = new THREE.ShaderMaterial({
      vertexShader: POOL_VERT, fragmentShader: POOL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPool: { value: new THREE.Color() }, uTime: { value: 0 }, uLevel: { value: 0 }, uHazeK: { value: 0.002 } },
    });
    await Y();

    // levels: nested groups; level i+1 lives in level i's space
    const PIVOT = new THREE.Vector3(0, 18, PASS), levels = [];
    const sailBy = [1, 1, 0.8, 1.5, 0.012], gainBy = [0.9, 1.2, 1.0, 1.0, 1.0], sailK = [1, 1, 1.15, 2.4, 1.5];
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group(), content = new THREE.Group(), front = fronts[i], look = looks[Math.min(i, 4)];
      group.add(content); if (i === 0) scene.add(group); else levels[i - 1].group.add(group);
      front.object.position.set(0, 0, PASS); content.add(front.object);
      front.setLook(looks[Math.max(i - 1, 0)].hero); front.setImpostor(0); front.setProgress(0);
      front.setLight({ door: i < 5 ? look.door : ['#9fd0ff', 3.2], wind: looks[Math.max(i - 1, 0)].wind });
      const fu = front.uniforms, L = { group, content, front, look, base: { sun: fu.uSunCol.value.clone(), sky: fu.uSky.value.clone(), bounce: fu.uBounce.value.clone() }, inv: new THREE.Matrix4() };
      if (i < 5) {
        const mat = i === 0 ? roomBase : roomBase.clone(), sea = i === 0 ? seaBase : seaBase.clone(), shaft = i === 0 ? shaftBase : shaftBase.clone();
        const u = mat.uniforms, su = sea.uniforms, hu = shaft.uniforms;
        u.uToLocal.value = su.uToLocal.value = hu.uToLocal.value = L.inv;
        // a cloned material shares the vectors inside its array uniforms: each level needs its own joints
        u.uJ.value = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1, 0, 0)); u.uGeck.value = [new THREE.Vector3(), new THREE.Vector3()];
        L.sun = new THREE.Vector3(...look.sun).normalize();
        u.uSunCol.value.set(look.sunC[0]).multiplyScalar(look.sunC[1]); u.uSky.value.set(look.sky[0]).multiplyScalar(look.sky[1]);
        u.uBounce.value.set(look.bounce[0]).multiplyScalar(look.bounce[1]); u.uGlowCol.value.set(look.glow[0]).multiplyScalar(look.glow[1]);
        u.uHaze.value.set(look.haze[0]); u.uHazeK.value = look.haze[1]; u.uWind.value = look.wind; u.uLevel.value = i + 1; u.uLid.value = look.lid; u.uCover.value = look.cover;
        u.uSlits.value = look.slits; u.uSpill.value = look.spill; u.uLace.value = look.lace; u.uGleam.value = look.gleam; u.uEmis.value = look.lamp ? 4.5 : 0;
        u.uLampOn.value = look.lamp; u.uCaust.value = look.caust; u.uLampCol.value.copy(C.flame).multiplyScalar(look.lamp * 5); u.uParrot.value = look.pose === 3 ? 0 : 1;
        u.uAreaK.value = look.areaK ?? 800; u.uWallFill.value = look.wallFill ?? 0; u.uLaceDrift.value = look.laceDrift ?? 0;
        u.uStainA.value.set(look.stain[0]); u.uStainB.value.set(look.stain[1]); u.uStain.value = opts.wedding ? 1 : 0;
        if (look.bar) { u.uBarCol.value.set(look.bar[0]).multiplyScalar(look.bar[1]); u.uBarDir.value.set(...look.barDir).normalize(); L.barDir = u.uBarDir.value; }
        if (look.low) u.uLowFill.value.set(look.sunC[0]).multiplyScalar(look.low);
        if (look.bar) { u.uBarDir2.value.set(-1, 0.62, 0.2).normalize(); u.uWallTint.value.setRGB(1.3, 0.92, 0.6); u.uNicheSun.value = 0.22; }
        if (look.ceil) u.uCeil.value.set(look.ceil[0]).multiplyScalar(look.ceil[1]);
        u.uReveal.value = look.reveal ?? 1;
        u.uNicheAmb.value = look.nicheAmb ?? 0.8; u.uBody.value = look.body ?? 1; u.uLowFloor.value = look.lowFloor ?? 0.8;
        if (look.rim) u.uRim.value.set(look.rim[0]).multiplyScalar(look.rim[1]);
        // The dark behind this room's arch: the design's indigo, and deeper where the room is dark, so that it is never lighter
        // than the room's darkest shaded plaster: the back of a niche beside the arch, as the room shader lights it (its
        // ambient in the niche and the sea door's glow on it), less a fifth.
        {
          const K = u.uAreaK.value, area = 0.545 * 0.6 * K / (1629 + K), nb = C.lime.clone().lerp(C.violet, 0.25).multiplyScalar(0.62 * 0.9);
          const lit = u.uSky.value.clone().add(u.uBounce.value).multiplyScalar(0.5 * u.uNicheAmb.value).add(u.uGlowCol.value.clone().multiplyScalar(area)).multiply(nb);
          const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
          L.dark = new THREE.Color(INDIGO).multiplyScalar(Math.min(1, 0.8 * lum(lit) / lum(bg)));
        }
        su.uTop.value.set(look.top); su.uHor.value.set(look.hor); su.uWater.value.set(look.water); su.uDeep.value.set(look.deep);
        su.uSunCol.value.set(look.sunC[0]).multiplyScalar(Math.min(look.sunC[1], 3) * (look.name === 'storm' ? 0.3 : 1)); su.uStars.value = look.stars; su.uWind.value = look.wind; su.uDhow.value = look.dhow;
        su.uSail.value.set(i === 3 ? (opts.rust ? '#ff7a4a' : '#ffb894') : opts.rust ? '#b4532a' : '#f1ecdc').multiplyScalar(sailBy[i]); su.uSailK.value = sailK[i]; su.uBats.value = i >= 3 ? 1 : 0; su.uShimmer.value = look.name === 'noon' || look.name === 'afternoon' ? 1 : 0;
        su.uGain.value = gainBy[i] * (look.name === 'storm' ? 1.7 : 1); su.uGlit.value = look.lamp ? 0.9 : look.wind > 0.8 ? 0.5 : i === 3 ? 0.6 : 1;
        hu.uShaft.value.set(...look.shaft); hu.uShaftCol.value.set(look.sunC[1] > 0.1 ? look.sunC[0] : look.glow[0]).multiplyScalar(look.lamp ? 0.8 : 1.4); hu.uLace.value = look.lace;
        const room = new THREE.Mesh(roomGeo, mat), seaMesh = new THREE.Mesh(outsideGeo, sea), shafts = new THREE.Mesh(shaftGeo, shaft);
        const perch = new THREE.Group(); perch.position.set(-10, ROOM_H, PERCH_Z);
        const perchMesh = new THREE.Mesh(perchGeo, mat); perch.add(perchMesh);
        content.add(room, seaMesh, shafts, perch);
        Object.assign(L, { mat, sea, shaft, room, perch, u, su, hu });
        // dust in the beams: it shares the beams' own uniforms, so it stands where they stand and is lit as they are
        const mm = i === 0 ? moteBase : moteBase.clone();
        mm.uniforms = { uToLocal: hu.uToLocal, uSunDir: hu.uSunDir, uShaft: hu.uShaft, uTime: hu.uTime, uShaftCol: hu.uShaftCol };
        const motes = new THREE.Mesh(moteGeo, mm); motes.renderOrder = 2; content.add(motes);
        if (poolGeo) {       // the light the bottles throw, in this hour's colour
          const pm = i === 0 ? poolBase : poolBase.clone(), pu = pm.uniforms;
          pu.uPool.value.copy(u.uGlowCol.value).multiplyScalar(0.4).add(u.uSky.value).multiplyScalar(look.pool ?? 1);
          pu.uLevel.value = i + 1; pu.uHazeK.value = look.haze[1];
          content.add(new THREE.Mesh(poolGeo, pm)); L.pu = pu;
        }
        if (i === 3) { L.feather = new THREE.Mesh(featherGeo, mat); content.add(L.feather); }
        // dust in the gap behind this room's arch, lit by this room through the arch and by the door of the model that stands there
        const gm = i === 0 ? gapBase : gapBase.clone(), gu = gm.uniforms, dl = i < 4 ? looks[i + 1].door : ['#9fd0ff', 3.2];
        gu.uRoomCol.value.copy(u.uSky.value).add(u.uGlowCol.value.clone().multiplyScalar(0.25)).add(u.uSunCol.value.clone().multiplyScalar(0.02)).multiplyScalar(2.4);
        gu.uDoorCol.value.set(dl[0]).multiplyScalar(dl[1] * 0.35);
        const gap = new THREE.Mesh(gapGeo, gm); gap.renderOrder = 2; content.add(gap); L.gu = gu;
      }
      // the house behind an arch stands in that arch's dark (level 0's house is the one we come out of: it has no arch before it)
      if (i > 0) { L.archInv = new THREE.Matrix4(); fu.uArchInv.value = L.archInv; fu.uDark.value = bg; fu.uDarkK.value = 1; }
      levels.push(L);
      await Y();
    }

    // the flight: down the axis after the first room
    const base = makePath([[0, 18, -2], [0, 17.4, -14], [3, 13, -48], [4, 12, -64], [0, 18, -100], [0, 18, -130], [0, 18, -160], [0, 18, -320], [0, 18, -480], [0, 18, -640], [0, 18, -770]]);
    const oldPace = (u) => 0.6 + 0.25 * smoothstep(0.14, 0.25, u) + 0.3 * smoothstep(0.25, 0.45, u) + 0.35 * smoothstep(0.45, 0.65, u) + 0.25 * smoothstep(0.65, 0.82, u) - 0.75 * smoothstep(0.82, 0.9, u);
    const flight = await makeFlight(base, oldPace, 46, Y), path = flight.path, FM = flight.m, uM = (k, off = 0) => flight.uOf(FM[k] + off);
    await Y();
    const _v = new THREE.Vector3(), _cp = new THREE.Vector3(), _pos = new THREE.Vector3();
    const NZ = 400, zTab = new Float32Array(NZ + 1);
    for (let i = 0; i <= NZ; i++) zTab[i] = base.pointAt(i / NZ, _v).z;
    const uAtZ = (z) => { let i = 0; while (i < NZ && zTab[i + 1] > z) i++; const a = zTab[i], b = zTab[Math.min(i + 1, NZ)]; return clamp((i + (a - b > 1e-6 ? (a - z) / (a - b) : 0)) / NZ, 0, 1); };
    const STATION6 = new THREE.Vector3(0, 18, STATION.z + 1.5);

    // air: dust everywhere, jasmine stars blowing across the squall room, a halo on the night's flame
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(1700 * detail * density), follow: 'xz', center: [0, 8.6, 0], box: [64, 15, 64], size: [0.06, 0.2], colors: ['#fff6e0', '#f2e2c0', '#dfe6ff'], intensity: 0.7 });
    await Y();
    const stars = fx.makeParticles({ rng: rng.fork('jasmine'), preset: 'petals', follow: false, center: [-2, 9, -2 * PITCH - 56], box: [66, 18, 104], count: Math.round(620 * detail * density),
      velocity: [-12, -0.2, 1.5], size: [0.4, 0.85], colors: ['#ffffff', '#f6f4ea', '#eef4dc'], intensity: 1.25, lightDir: [0.9, 0.3, -0.3] });
    await Y();
    // the same flowers caught by the eye as white streaks flying left across the room
    const streaks = fx.makeParticles({ rng: rng.fork('jasmine-streaks'), mode: 'streak', shape: 'streak', follow: false, center: [0, 13, -2 * PITCH - 52], box: [70, 26, 108],
      count: Math.round(360 * detail * density), velocity: [-21, -0.5, 2.2], velocityRandom: [9, 2.5, 5], turbulence: [1.3, 0.9, 0.8], size: [0.15, 0.36], stretch: 0.12,
      colors: ['#ffffff', '#fbfbf0', '#f2f6e2'], intensity: 1.35, opacity: 0.95, additive: 0.25, near: [2.5, 7] });
    streaks.setOpacity(0);
    stars.setOpacity(0);
    await Y();
    const halo = fx.makeGlow({ position: [LAMP[0], LAMP[1], LAMP[2] - 4 * PITCH + 0.6], color: PAL[6], size: 5.5, intensity: 1.5, flicker: 0.25 });
    halo.object.visible = false;
    const eyeGlow = fx.makeGlow({ position: [-9.5, 19.6, PERCH_Z - 4 * PITCH], color: '#ffe9a0', size: 1.5, intensity: 1.3 });
    eyeGlow.object.visible = false;
    // the light in each model's door, seen from across its room: a spark in the next hour's colour that gives way to the real
    // door as the model grows or the camera comes close
    const sparkAt = [0, 1, 2, 3].map((i) => new THREE.Vector3(0, SEAT.y - 0.05, SEAT.z + 0.5 - PITCH * i)), sparkNow = [1, 1, 1, 1];
    const sparks = fx.makeGlows({ positions: sparkAt, colors: [1, 2, 3, 4].map((i) => looks[i].door[0]), sizes: [1, 1, 1, 1], size: 2.7, intensity: 2.3, flicker: 0.3 });
    // the flames in the lamp niches of each passage bloom: one soft glow each, lit once its house front stands full size
    const flameAt = [];
    for (let j = 0; j < 5; j++) for (const z of [16.5, 4.5]) for (const x of [-8.47, 8.47]) flameAt.push([x, 16.85, z - PITCH * j]);
    const flameNow = [1, 1, 1, 1, 1];
    const blooms = fx.makeGlows({ positions: flameAt, color: '#ffb264', sizes: flameAt.map(() => 1), size: 2.6, intensity: 1.15, flicker: 0.3 });
    await Y();
    // the portal stands in the dark behind the last arch: a veil of that dark hides it until we are on the last stair
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: INDIGO, transparent: true, opacity: 1, fog: false }));
    veil.position.set(0, 18, -4 * PITCH - ROOM_L - 9); veil.renderOrder = -2;      // first of the transparent things, so shafts and dust in the rooms before it are drawn over it
    scene.add(dust.object, stars.object, streaks.object, halo.object, eyeGlow.object, sparks.object, blooms.object, veil);
    await Y();

    const q = [0, 0, 0, 0, 0], rare = !!vary.rare, squall = season !== 'kaskazi';
    const dustBy = [0.8, 0.7, 0.35, 0.4, 0.45];
    const perchW = (r) => [-10, 19, PERCH_Z - PITCH * r];
    const pois = [{ at: [17, 6, -62], from: uAtZ(-10), to: uAtZ(-60), weight: 0.6 }];
    for (let r = 0; r < 5; r++) pois.push({ at: perchW(r), from: uAtZ((r === 0 ? -58 : -40) - PITCH * r), to: uAtZ(PERCH_Z - 1 - PITCH * r), weight: r === 3 ? (rare ? 0 : 0.2) : r === 4 ? 0.2 : 0.3 });
    // the rare visit is keyed to places in room 4 (room-local z -12 .. -79), so it holds whatever the path's length
    const RZ = (z) => uAtZ(z - 3 * PITCH), EYE = { a: RZ(-12), b: RZ(-30), c: RZ(-64.5), d: RZ(-78.6), k1: RZ(-42.6), k2: RZ(-56.7) };
    if (rare) pois.push({ at: [34, 12, -80 - 3 * PITCH], from: RZ(-10), to: RZ(-77), weight: 0.6 });
    // the gaze on the two loops: it leads each turn by a few real metres, and is given in turn to the shelves as they recede
    // toward the arch, the parrot on its ring, the model's open door and the bed under the sunset bars. Listed first, so the
    // perch pois still lay their share over it exactly as they did.
    const AIMS = [
      { at: new THREE.Vector3(-21.5, 13.0, -111.5 - 2 * PITCH), u: [uM('turn3', -2), uM('turn3', 3), uM('wall', 4), uM('wall', 9)], w: 1 },            // the shelves
      { at: new THREE.Vector3(-10, 18.9, PERCH_Z - 2 * PITCH), u: [uM('wall', 4), uM('wall', 9), uM('view', 3), uM('view', 9)], w: 0.94 },            // the ring at rest: the parrot swings across a still room
      { at: new THREE.Vector3(33, 10, -80 - 2 * PITCH), u: [uM('view', 3), uM('view', 9), uM('uturn3', -17), uM('uturn3', -5)], w: 1 },              // the sea door in the squall
      { at: new THREE.Vector3(0, 10.5, -113.2 - 3 * PITCH), u: [uM('dn', -16), uM('dn', 1), uM('front', 9), uM('front', 20)], w: 1 },               // the model
      { at: new THREE.Vector3(-12, 19, -109 - 3 * PITCH), u: [uM('front', 9), uM('front', 20), uM('uturn4', -5), uM('uturn4', 3)], w: 1 }];         // the niche wall, pulling back from it
    const _g = new THREE.Vector3(), _gp = new THREE.Vector3(), _ga = new THREE.Vector3(), _gt = new THREE.Vector3();
    let tNow = 12;
    const gaze = (time, u) => {
      const S = flight.Sof(u); flight.R(S, _gp); flight.R(S + flight.ahead(u, 30), _ga); _ga.sub(_gp).normalize();
      for (const a of AIMS) {
        const w = smoothstep(a.u[0], a.u[1], u) * (1 - smoothstep(a.u[2], a.u[3], u)) * a.w;
        if (w <= 0.001) continue;
        _gt.copy(a.at).sub(_gp).normalize(); _ga.multiplyScalar(1 - w).addScaledVector(_gt, w).normalize();
      }
      return _g.copy(_gp).addScaledVector(_ga, 30);
    };
    flight.setAim((u) => gaze(tNow, u));
    pois.unshift({ at: gaze, from: 0.383, to: 0.662, weight: 1, fade: 0.012 });
    const DEEP = [uM('dn', -40), uM('away', 4)];
    // a wing opened like a door (about the bird's upright axis) and then lifted (about its forward axis), as one turn
    const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), X1 = new THREE.Vector3(1, 0, 0), Y1 = new THREE.Vector3(0, 1, 0);
    const wingJ = (v, side, open, lift) => {
      _qa.setFromAxisAngle(Y1, side * open); _qb.setFromAxisAngle(X1, -side * lift).multiply(_qa);
      const sn = Math.sqrt(Math.max(1 - _qb.w * _qb.w, 1e-8));
      birdAxis(v, _qb.x / sn, _qb.y / sn, _qb.z / sn, 2 * Math.acos(clamp(_qb.w, -1, 1)));
    };
    const pose = (L, i, time, cam) => {
      const J = L.u.uJ.value, p = L.look.pose;
      let swing = 0.008 * Math.sin(time * 0.9);
      J[0].set(0, 1, 0, 0); J[1].set(0, 0, 1, 0); J[2].set(0, 0, 1, 0); J[3].set(0, 0, 1, 0);
      if (p === 0) { birdAxis(J[0], 0.12, 1, 0.1, 2.5 + 0.04 * Math.sin(time * 1.6)); }          // asleep, head tucked back
      else if (p === 1) {                                                                         // preening a spread tail
        const nib = Math.max(0, Math.sin(time * 0.9)) * Math.sin(time * 9);
        birdAxis(J[0], 0.4, 1, 0.05, -2.0 + 0.16 * nib); wingJ(J[1], 1, 0.5, 0.3 + 0.12 * Math.sin(time * 0.9)); birdAxis(J[3], 1, 0.2, 0, -0.8 + 0.08 * Math.sin(time * 2.1));
        swing = 0.02 * Math.sin(time * 1.3);
      } else if (p === 2) {                                                                       // riding the ring in the squall, wings out and beating
        const beat = Math.sin(time * 7.5);
        birdAxis(J[0], 0, 0, 1, -0.3 + 0.12 * Math.sin(time * 2.3)); wingJ(J[1], 1, 1.35, 0.62 + 0.36 * beat); wingJ(J[2], -1, 1.35, 0.62 + 0.36 * Math.sin(time * 7.5 + 0.5));
        birdAxis(J[3], 0, 0, 1, 0.3 * Math.sin(time * 3.1));
        swing = 0.24 * Math.sin(time * 1.45) + 0.06 * Math.sin(time * 3.9);
      } else if (p === 3) {
        const k = clamp((10 - (zNow + PITCH * i)) / 110, 0, 1);
        swing = (0.02 + 0.17 * (1 - smoothstep(0, 0.9, k))) * Math.sin(time * 1.5);
        if (L.feather) { L.feather.position.set(-10 + 2.4 * Math.sin(k * 9) + 0.3 * Math.sin(time * 0.8), 19.5 - 15.5 * k, PERCH_Z + 1 + 3 * Math.sin(k * 5)); L.feather.rotation.set(k * 5 + 0.3 * Math.sin(time * 1.1), 0, k * 14 + 0.5 * Math.sin(time * 0.7)); }
      } else {                                                                                    // night: the head turns to keep one eye on us
        _pos.copy(cam).applyMatrix4(L.inv);
        let rel = Math.atan2(-(_pos.z - PERCH_Z), _pos.x + 10) + Math.PI / 2;
        if (rel > Math.PI) rel -= 2 * Math.PI;
        rel = clamp(rel, -2.4, 2.4);
        const th = rel - Math.PI / 2, c = Math.cos(th), s = Math.sin(th), side = Math.abs(rel) < 0.2 ? 1 : -Math.sign(rel);
        J[0].set(0, 1, 0, rel);
        // the lit eye, on the side of the head turned to us
        eyeGlow.object.position.set(-10 + 0.5 * c + side * 0.52 * s, ROOM_H - 26.8 + 2.44, PERCH_Z + 0.08 - 0.5 * s + side * 0.52 * c).applyMatrix4(L.content.matrixWorld);
      }
      L.perch.rotation.x = swing;
    };
    let zNow = -2;
    const gk = [0, 0];

    const portal = { shape: 'circle', radius: 7, color: '#9fd0ff', glow: 1, revealDistance: 1200, blendDistance: 60 };
    return {
      scene, path, duration: flight.duration, pace: flight.pace,
      camera: { fov: 62, near: 0.3, far: 1400, lookAhead: 30, sway: 0.45, bank: 0.3 },
      pois, portal, ride: 'none',
      post: { exposure: 1.0, bloom: { strength: 0.32, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.0, contrast: 1.05, tint: '#ffffff', shadowTint: '#06081c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u = 0) {
        zNow = flight.zProg(clamp(u, 0, 1)); tNow = time;
        if (!ctx.through) flight.setEye(camera.position);      // only so the path can tell the engine's own request for the camera's place (by this vector's identity; it is never read)
        const n = clamp(Math.floor((20 - zNow) / PITCH), 0, 4);
        _cp.setFromMatrixPosition(camera.matrixWorld);
        // the dive: level i+1 grows out of its seat on the sill of room i
        for (let i = 0; i < 5; i++) {
          const qi = q[i] = smoothstep(56, 104, -(zNow + PITCH * i)), e = smoothstep(0, 0.62, qi), s = Math.pow(16, qi - 1), g = levels[i + 1].group;
          g.position.copy(SEAT).lerp(i === 4 ? STATION6 : STATION, e).addScaledVector(PIVOT, -s); g.scale.setScalar(s);
        }
        const deep = u > DEEP[0] && u < DEEP[1];          // close to the model its own room shows its own model too
        for (let i = 0; i < 6; i++) levels[i].content.visible = i >= n && i <= n + 2 && (i < n + 2 || q[n] > 0.12 || deep);
        levels[0].group.updateMatrixWorld(true);
        // the dark behind the arches: the colour of the room we are in; in a passage (house door to stairhead, 30 m) it runs
        // from that room's to the next one's by metres. The veil before the portal is the same dark.
        {
          const pr = Math.max(-zNow, 0), r = Math.min(Math.floor(pr / PITCH), 4);
          bg.copy(levels[r].dark).lerp(levels[Math.min(r + 1, 4)].dark, smoothstep(ROOM_L + GAP, PITCH, pr - PITCH * r));
          veil.material.color.copy(bg);
        }
        for (let i = 1; i < 6; i++) levels[i].archInv.copy(levels[i - 1].content.matrixWorld).invert();
        for (let j = 0; j < 2; j++) { const tt = time * 0.3 + j * 0.5, A = Math.floor(tt) + smoothstep(0, 0.12, tt - Math.floor(tt)); gk[j] = (Math.abs(((A + j * 2) % 6) - 3) - 1.5) * 1.1; }
        for (let i = 0; i < 6; i++) {
          const L = levels[i], f = L.front, fu = f.uniforms;
          if (i > 0) f.setProgress(q[i - 1]);
          const k = i === n + 1 ? lerp(1, i === 5 ? 0.75 : 0.6, smoothstep(0.3, 0.85, q[n])) : i <= n ? 0.6 : 1;
          fu.uSunCol.value.copy(L.base.sun).multiplyScalar(k); fu.uSky.value.copy(L.base.sky).multiplyScalar(k); fu.uBounce.value.copy(L.base.bounce).multiplyScalar(k);
          f.update(dt, time, camera);
          if (!L.mat || !L.content.visible) continue;
          L.inv.copy(L.content.matrixWorld).invert();
          L.u.uTime.value = L.su.uTime.value = L.hu.uTime.value = time; if (L.pu) L.pu.uTime.value = time;
          // the gap's dust: the clock, and where the door of the model behind this arch stands and how wide it is
          { const g1 = levels[i + 1].group; L.gu.uTime.value = time; L.gu.uDoorAt.value.set(g1.position.x + g1.scale.x * PIVOT.x, g1.position.y + g1.scale.x * PIVOT.y, g1.position.z + g1.scale.x * PIVOT.z, 16 * g1.scale.x); }
          L.u.uSunDir.value.set(L.sun.x + 0.06 * Math.sin(time * 0.21 + i), L.sun.y, L.sun.z + 0.05 * Math.cos(time * 0.17 + i)).normalize();
          L.hu.uSunDir.value.copy(L.barDir || L.u.uSunDir.value); L.su.uSunDir.value.copy(L.sun);
          L.u.uGeck.value[0].set(gk[0], 0, 0); L.u.uGeck.value[1].set(-gk[1], 0, 0);
          pose(L, i, time, _cp);
        }
        // the rare visitor at the sea door of the sunset room
        const E = levels[3].su.uEye.value;
        if (rare) {
          const pres = smoothstep(EYE.a, EYE.b, u) * (1 - smoothstep(EYE.c, EYE.d, u));
          _pos.copy(_cp).applyMatrix4(levels[3].inv);
          const kx = 27 / Math.max(35 - _pos.x, 8);
          levels[3].u.uFrond.value = smoothstep(0.1, 0.6, pres);
          const zD = -80 + lerp(-3.2, 2.6, smoothstep(EYE.a, EYE.d, u)), off = 60 * (smoothstep(EYE.c, EYE.d, u) - (1 - smoothstep(EYE.a, EYE.b, u)));
          E.set(zD + (zD - _pos.z) * kx + off, 14.5 + (14.5 - _pos.y) * kx - (1 - pres) * 8, n === 3 ? smoothstep(0, 0.25, pres) : 0, Math.min(0.9, core_bell(u, EYE.k1, 0.0035) + core_bell(u, EYE.k2, 0.0035)));
        } else E.z = 0;
        // (in the dark of a passage there is no light for dust to stand in)
        dust.setOpacity(dustBy[n] * (0.25 + 0.75 * smoothstep(1, -8, zNow + PITCH * n))); dust.update(dt, time, camera);
        const sq = n === 2 && squall ? 1 : 0;
        stars.setOpacity(sq); stars.update(dt, time, camera); streaks.setOpacity(sq); streaks.update(dt, time, camera);
        halo.object.visible = eyeGlow.object.visible = n === 4; halo.update(dt, time, camera); eyeGlow.update(dt, time, camera);
        for (let i = 0; i < 4; i++) {
          const k = i === n ? (1 - smoothstep(0.03, 0.3, q[i])) * smoothstep(12, 34, _cp.distanceTo(sparkAt[i])) : 0;
          if (Math.abs(k - sparkNow[i]) > 0.01 || (k === 0 && sparkNow[i] !== 0)) { sparkNow[i] = k; sparks.setSize(i, k); }
        }
        sparks.update(dt, time, camera);
        for (let j = 0; j < 5; j++) {
          const k = j === 0 ? 1 : smoothstep(0.93, 1, q[j - 1]);
          if (k !== flameNow[j]) { flameNow[j] = k; for (let i = 0; i < 4; i++) blooms.setSize(j * 4 + i, k); }
        }
        blooms.update(dt, time, camera);
        const vk = 1 - smoothstep(-4 * PITCH + 34, -4 * PITCH + 6, zNow);
        veil.material.opacity = vk; veil.visible = vk > 0.004;
      },
      dispose() { hero.dispose(); },
    };
  },
};
const core_bell = (u, c, w) => Math.exp(-((u - c) * (u - c)) / (2 * w * w));
