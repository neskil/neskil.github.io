// boathouse-full-of-morning, the part file: THE BLUE POLICE BOX (the hero since round four:
// where the boat hut stood there stands the same great blue police box, square on its plinth, its two
// doors open inward; one builder function, called FOUR times by the world: on the lake, in the garden's long basin, at
// the islet's water's edge on the sea, and frozen into the ring's ice with the way out in its doorway; the names in
// the code still say hut and each means the box), and with it everything
// the whole world is drawn by: the crossing's law as one GLSL function, the one material helper that every mesh and the
// sky go through, each place's own sun, sky and air, and the small geometry builder.
//
// BROUGHT IN (section 181): the filmic tone fit of tShow (the curve tFit and its two 3 by 3 matrices, and the 0.6 of
// exposure) follows three.js's own ACES filmic tone mapping, from three.js r170 (the three.js authors, MIT licence;
// three.js credits Stephen Hill's fit), mirrored in JavaScript so that feed() finds the colour the engine's last pass
// will show. Everything else is written anew for this world: the lattice hash h21 is a sine hash with constants of this
// world's own choosing; the fixed streams of numbers come from the kit's makeRng with hashSeed; the value noise, the
// smooth steps, the rotations and the sRGB transfer are common forms.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------------------
// THE PLANES AND THEIR OUTLINES. The same on every seed. c: the point where the line passes; n: the plane's OUTWARD
// normal (toward the outer place); r: the level axis in the plane; foot: metres from the line down to the outline's
// foot; top: metres from the line up to the outline's head. ALL THREE OUTLINES ARE THE BOX'S DOORWAY (round four: the
// same box stands at every crossing): a rectangle 6.4 m wide, its foot 0.5 m under the box's water line, straight
// jambs to a level head 12.8 m over it; the line passes 2.2 m over the water line.
// ---------------------------------------------------------------------------------------------------------------------
export const HW = 3.2;
const S2 = Math.SQRT1_2;
export const PLANES = [
  null,
  { c: [0, 2.2, 0], n: [0, 0, 1], r: [1, 0, 0], foot: 2.7, top: 10.6 },
  { c: [-22, 3.2, -205], n: [0, 0, 1], r: [1, 0, 0], foot: 2.7, top: 10.6 },
  { c: [98, 1.2, -304.7], n: [-S2, 0, -S2], r: [S2, 0, -S2], foot: 2.7, top: 10.6 },
];
// THE FOUR HUTS' FRAMES (o: where the hut's own origin stands: the middle of its door's foot line at its water line;
// ry: its turn about the vertical, degrees): on the lake, in the garden's basin, on the sea, in the ring. LAMP: where
// the lantern on the jetty's end post hangs, in the hut's own frame; lampAt(i): the same point in the world.
// (the last hut's water line is the top of the floe that bears it: the ring's plain, y -16.05, and that floe's freeboard,
// 0.35 m: see THE LAST FLOE in the world file, whose build checks the sum)
export const HUTS = [{ o: [0, 0, 0], ry: 0 }, { o: [-22, 1.0, -205], ry: 0 }, { o: [98, -1.0, -304.7], ry: 225 }, { o: [158.7, -15.70, -174.6], ry: 185 }];
export const LAMP = [6.73, 1.14, 12.2];
export const hutPoint = (i, p) => { const H = HUTS[i], a = H.ry * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [H.o[0] + p[0] * c + p[2] * s, H.o[1] + p[1], H.o[2] - p[0] * s + p[2] * c]; };
export const lampAt = (i) => hutPoint(i, LAMP);
// THE FLOOR PLANE: level, y = -5. Between planes one and two an eye over it stands in the garden, an eye under it in
// the stars (the stars' place runs on under the garden's ground: see the world file's head).
export const FLOOR_Y = -5;

// the outline, in the plane's own two axes (a: level, from the middle; b: up, from the line): exact, no softness
export function inOutline(i, a, b) {
  const P = PLANES[i];
  return !(Math.abs(a) > HW || b < -P.foot || b > P.top);
}
const side = (i, x, y, z) => { const P = PLANES[i]; return (x - P.c[0]) * P.n[0] + (y - P.c[1]) * P.n[1] + (z - P.c[2]) * P.n[2]; };
// the eye's place, by the sides of the fixed planes alone
export function eyePlace(x, y, z) {
  if (side(1, x, y, z) > 0) return 0;
  if (side(2, x, y, z) > 0) return y < FLOOR_Y ? 3 : 1;
  if (side(3, x, y, z) > 0) return 2;
  return 3;
}
// where the sight line e + d * t (0 < t <= tmax) meets plane i: t when the meeting point lies inside the outline, else -1
export function crossIn(i, e, d, tmax) {
  const P = PLANES[i];
  const se = (e[0] - P.c[0]) * P.n[0] + (e[1] - P.c[1]) * P.n[1] + (e[2] - P.c[2]) * P.n[2];
  const sd = d[0] * P.n[0] + d[1] * P.n[1] + d[2] * P.n[2];
  if (se * sd >= 0) return -1;
  const t = -se / sd;
  if (t > tmax) return -1;
  const qx = e[0] + d[0] * t - P.c[0], qy = e[1] + d[1] * t - P.c[1], qz = e[2] + d[2] * t - P.c[2];
  return inOutline(i, qx * P.r[0] + qz * P.r[2], qy) ? t : -1;
}
// the place in which the far end of the sight line lies (the processor's mirror of the GLSL below, for the counts)
export function seenPlace(e, d, tmax = 1) {
  const k = eyePlace(e[0], e[1], e[2]);
  if (k < 3 && crossIn(k + 1, e, d, tmax) >= 0) return k + 1;
  if (k > 0 && crossIn(k, e, d, tmax) >= 0) return k - 1;
  return k;
}

const f = (x) => { const s = Number(x).toFixed(8); return s.indexOf('.') < 0 ? s + '.0' : s; };
const v3 = (a) => 'vec3(' + a.map(f).join(', ') + ')';
const planeConsts = [1, 2, 3].map((i) => {
  const P = PLANES[i];
  return 'const vec3 PC' + i + ' = ' + v3(P.c) + ', PN' + i + ' = ' + v3(P.n) + ', PR' + i + ' = ' + v3(P.r) + ';\n' +
    'const vec4 PO' + i + ' = vec4(' + [P.foot, P.top, 0, 0].map(f).join(', ') + ');';
}).join('\n');

// ---------------------------------------------------------------------------------------------------------------------
// THE CROSSING'S LAW, the one function. seenPlace(eye, d, tmax, tq) says in which place the far end of the sight line
// eye + d * (0..tmax) lies: the eye's own place, or the next one (the line goes in through the opening ahead), or the
// one before (it goes out through the opening behind). A material of place m keeps its fragment only when that answer
// is m; the sky draws the sky of that answer. Nothing else decides, anywhere.
// ---------------------------------------------------------------------------------------------------------------------
export const LAW_GLSL = /* glsl */`
${planeConsts}
const float OUT_HW = ${f(HW)}, FLOOR_Y = ${f(FLOOR_Y)};
bool inOutline(float a, float b, vec4 o){
  return !(abs(a) > OUT_HW || b < -o.x || b > o.y);
}
bool crossIn(vec3 e, vec3 d, float tmax, vec3 pc, vec3 pn, vec3 pr, vec4 po, out float t){
  float se = dot(e - pc, pn), sd = dot(d, pn);
  t = 0.0;
  if (se * sd >= 0.0) return false;
  t = -se / sd;
  if (t > tmax) return false;
  vec3 q = e + d * t - pc;
  return inOutline(dot(q, pr), q.y, po);
}
// THE PIXEL'S OWN SIGHT LINE (round three, the lead's D1). The law is asked along the line through the middle of the
// pixel, made from the pixel's own place in the buffer (uVP: the viewport, set before every drawing of the scene), the
// projection and the view. (The interpolated vW will not do near an outline: far triangles drawn in single precision
// stray up to a sixtieth of a pixel from the pixel's middle, enough to put a pixel whose middle lies just outside an
// outline on the far side of it.) Before the first viewport is known the interpolated line stands in.
uniform vec4 uVP;
uniform mat4 projectionMatrix;
vec3 lawRay(vec3 fallback){
  if (uVP.z < 0.5) return normalize(fallback);
  vec2 n = (gl_FragCoord.xy - uVP.xy) / uVP.zw * 2.0 - 1.0;
  vec3 c = vec3((n.x + projectionMatrix[2][0]) / projectionMatrix[0][0], (n.y + projectionMatrix[2][1]) / projectionMatrix[1][1], -1.0);
  return normalize((vec4(c, 0.0) * viewMatrix).xyz);
}
float eyePlace(vec3 e){
  if (dot(e - PC1, PN1) > 0.0) return 0.0;
  if (dot(e - PC2, PN2) > 0.0) return e.y < FLOOR_Y ? 3.0 : 1.0;
  if (dot(e - PC3, PN3) > 0.0) return 2.0;
  return 3.0;
}
// THE LAW'S OWN COLOURS (uShow 1, set only by the measuring scripts; 0 on every visit): each pixel shows the PLACE the
// law gave it as a flat colour (lake red, garden green, sea blue, stars yellow; a sky at 0.45 of it), so that the law's
// seam can be compared pixel by pixel with the same test worked on the processor.
vec3 lawShow(float pl){ return pl < 0.5 ? vec3(1.0, 0.0, 0.0) : (pl < 1.5 ? vec3(0.0, 1.0, 0.0) : (pl < 2.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 1.0, 0.0))); }
float seenPlace(vec3 e, vec3 d, float tmax, out float tq){
  float k = eyePlace(e), t = 0.0;
  tq = 0.0;
  if (k < 0.5) {
    if (crossIn(e, d, tmax, PC1, PN1, PR1, PO1, t)) { tq = t; return 1.0; }
    return 0.0;
  }
  if (k < 1.5) {
    if (crossIn(e, d, tmax, PC2, PN2, PR2, PO2, t)) { tq = t; return 2.0; }
    if (crossIn(e, d, tmax, PC1, PN1, PR1, PO1, t)) { tq = t; return 0.0; }
    return 1.0;
  }
  if (k < 2.5) {
    if (crossIn(e, d, tmax, PC3, PN3, PR3, PO3, t)) { tq = t; return 3.0; }
    if (crossIn(e, d, tmax, PC2, PN2, PR2, PO2, t)) { tq = t; return 1.0; }
    return 2.0;
  }
  if (crossIn(e, d, tmax, PC3, PN3, PR3, PO3, t)) { tq = t; return 2.0; }
  return 3.0;
}
`;

export const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ return fract(sin(dot(p, vec2(61.83, 157.29))) * 27183.461); }
float vn(vec2 p){
  vec2 i = floor(p), q = fract(p);
  q = q * q * (3.0 - 2.0 * q);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), q.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), q.x), q.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
float fbm2(vec2 p){ return 0.6667 * vn(p) + 0.3333 * vn(p * 2.07 + 5.3); }
`;

// ---------------------------------------------------------------------------------------------------------------------
// EACH PLACE'S OWN SUN, SKY AND AIR. Bearings are compass bearings; dirOf gives the unit vector toward bearing b at
// elevation e (degrees) in the world's axes (+x east, +y up, +z south).
// ---------------------------------------------------------------------------------------------------------------------
export const dirOf = (b, e) => { const br = b * Math.PI / 180, er = e * Math.PI / 180; return [Math.sin(br) * Math.cos(er), Math.sin(er), -Math.cos(br) * Math.cos(er)]; };
export const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const G = (hex, k = 1) => v3(lin(hex, k));
// THE PALETTE AS IT SHOWS. The engine's last pass bends every colour (a filmic curve, then the screen's own): feed(hex)
// is the linear colour that comes out of that pass as the given colour, found by stepping toward it. Skies, airs and
// lights that are seen directly are written with it, so that the brief's palette is what stands on screen.
// (the fit and the two matrices below follow three.js r170's ACES filmic tone mapping, MIT: see BROUGHT IN at the head)
const tFit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
const tShow = (x) => {
  const a = [0.59719 * x[0] + 0.35458 * x[1] + 0.04823 * x[2], 0.07600 * x[0] + 0.90834 * x[1] + 0.01566 * x[2], 0.02840 * x[0] + 0.13383 * x[1] + 0.83777 * x[2]].map((v) => tFit(v / 0.6));
  const c = [1.60475 * a[0] - 0.53108 * a[1] - 0.07367 * a[2], -0.10208 * a[0] + 1.10813 * a[1] - 0.00605 * a[2], -0.00327 * a[0] - 0.07276 * a[1] + 1.07602 * a[2]].map((v) => Math.min(1, Math.max(0, v)));
  const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return c.map((v) => { const q = Math.min(1, Math.max(0, l + (v - l) * 1.04)); return 255 * (q < 0.0031308 ? q * 12.92 : 1.055 * Math.pow(q, 1 / 2.4) - 0.055); });
};
const feedMemo = new Map();
export const feed = (hex, k = 1) => {
  let x = feedMemo.get(hex);
  if (!x) {
    const t = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    x = t.map((v) => Math.pow(v / 255, 2.2) * 0.8 + 0.002);
    // (it stops as soon as all three channels stand within a two-hundredth of a level: the module then loads in a few
    // milliseconds instead of holding the page)
    for (let it = 0; it < 1500; it++) {
      const sh = tShow(x);
      if (Math.max(Math.abs(t[0] - sh[0]), Math.abs(t[1] - sh[1]), Math.abs(t[2] - sh[2])) < 0.005) break;
      for (let c = 0; c < 3; c++) x[c] = Math.max(1e-5, x[c] * (1 + 0.03 * Math.sign(t[c] - sh[c]) * Math.min(1, Math.abs(t[c] - sh[c]) / 6)));
    }
    feedMemo.set(hex, x);
  }
  return [x[0] * k, x[1] * k, x[2] * k];
};
const F = (hex, k = 1) => v3(feed(hex, k));
// (round two: the stars' small sun stands low on bearing 255, 80 degrees right of the last straight's bearing (175);
// the planet's middle on bearing 178, seven degrees under the plain's horizon, so that it stands behind the last hut
// as a dome 70 degrees wide)
// THE RING OF ICE of the stars' place: a banded annulus about a far centre RING_C, which lies RING_D metres from the
// stars' leg (its middle, RING_V) on the planet's bearing (178)
export const RING_V = [140, -240], RING_D = 1400, RING_DIR = [Math.sin(178 * Math.PI / 180), -Math.cos(178 * Math.PI / 180)];
export const RING_C = [RING_V[0] + RING_D * RING_DIR[0], RING_V[1] + RING_D * RING_DIR[1]];
export const SUN = { lake: dirOf(0, 11), moon: dirOf(338, 17), garden: dirOf(67, 24), sea: dirOf(57, 5), stars: dirOf(255, 9), planet: dirOf(178, -7), seamoon: dirOf(148, 14) };

// THE GARDEN'S CLOUDS: each its place along the wind (evenly round its 480 m), its half-length along and its half-width
// across (so 44 to 60 m across, 52 to 76 m along); the wind's speed (m/s); the wobble of their edges (wob = CLOUD_WOB x
// (fbm - 0.5), fbm from 0 to 0.94, so an edge reaches at most 1 + CLOUD_WOB / 2 of a half-width out). Their lanes across
// the wind are the world's (cloudLanes).
export const CLOUDS = [{ along: 0, halfAlong: 26, halfAcross: 30 }, { along: 120, halfAlong: 30, halfAcross: 24 }, { along: 240, halfAlong: 28, halfAcross: 22 }, { along: 360, halfAlong: 38, halfAcross: 22 }];
export const CLOUD_WIND = 4, CLOUD_WOB = 0.22;

export const LIGHT_GLSL = /* glsl */`
uniform float uTime, uRare;
uniform vec4 uDeal;
const vec3 SUN_LAKE = ${v3(SUN.lake)}, MOON_LAKE = ${v3(SUN.moon)}, SUN_GARDEN = ${v3(SUN.garden)}, SUN_SEA = ${v3(SUN.sea)}, SUN_STARS = ${v3(SUN.stars)};
const vec3 PLANET_DIR = ${v3(SUN.planet)}, MOON_SEA = ${v3(SUN.seamoon)}, RARE_DIR = ${v3(dirOf(128, 23))};
const float PLANET_ANG = 0.61087, PLANET_COS = 0.81915, PLANET_DIST = 1.74345;
const vec2 RING_C = vec2(${RING_C[0].toFixed(2)}, ${RING_C[1].toFixed(2)});
${[1, 2, 3].map((i) => 'const vec3 LAMP' + i + ' = ' + v3(lampAt(i)) + ';').join('\n')}
struct PL { vec3 sd; vec3 sc; vec3 sky; vec3 gnd; };
PL placeLight(float pl){
  if (pl < 0.5) return PL(SUN_LAKE, vec3(0.30, 0.10, 0.04), vec3(0.060, 0.080, 0.160), vec3(0.045, 0.045, 0.060));
  if (pl < 1.5) return PL(SUN_GARDEN, vec3(1.00, 0.90, 0.70) * 2.6, vec3(0.26, 0.34, 0.52), vec3(0.22, 0.24, 0.16));
  if (pl < 2.5) return PL(SUN_SEA, vec3(1.00, 0.60, 0.28) * 1.9, vec3(0.27, 0.24, 0.37), vec3(0.08, 0.075, 0.11));
  return PL(SUN_STARS, vec3(1.00, 0.95, 0.82) * 2.1, vec3(0.012, 0.016, 0.030), vec3(0.15, 0.28, 0.62));
}
// stars as points of a fixed angular size, never thinner than a pixel and then no brighter (px: the angle of one pixel)
float starField(vec3 d, float cells, float keep, float px){
  vec2 g = vec2(atan(d.x, d.z + 1e-6), asin(clamp(d.y, -1.0, 1.0)) * 1.9) * cells;
  vec2 ci = floor(g), cf = fract(g);
  float h = h21(ci);
  if (h < keep) return 0.0;
  vec2 sp = 0.2 + 0.6 * vec2(h21(ci + 7.3), h21(ci + 19.1));
  float rad = 0.0010 * cells * (0.6 + 0.8 * h21(ci + 3.7)), rp = max(rad, 1.2 * px * cells);
  float dd = length((cf - sp) * vec2(max(cos(g.y / (1.9 * cells)), 0.2), 1.0 / 1.9));
  float tw = 0.78 + 0.22 * sin(uTime * (1.3 + 2.0 * h21(ci + 1.1)) + h * 60.0);
  return smoothstep(rp, rp * 0.35, dd) * (rad * rad) / (rp * rp) * tw * (0.5 + 1.5 * (h - keep) / max(1.0 - keep, 1e-3));
}
// LAKE: the blue hour of a summer evening: deep blue overhead, first stars, a thin moon, orange and rose low in the north
vec3 skyLake(vec3 d, float px){
  float el = max(d.y, 0.0), az = clamp(-d.z / max(length(d.xz), 1e-4), -1.0, 1.0);
  float t = clamp(1.0 - el, 0.0, 1.0); t = t * t * t; t = t * t;
  vec3 col = mix(${F('#0c1638')}, ${F('#24386c')}, t);
  // (round two: the afterglow stronger and broader, orange at the hills rising into rose)
  float north = smoothstep(-0.40, 0.95, az); north = north * sqrt(north);
  vec3 glow = mix(${F('#f49040', 1.15)}, ${F('#d05880', 0.9)}, smoothstep(0.03, 0.26, el));
  col = mix(col, glow, north * exp(-el / 0.155));
  float st = starField(d, 46.0, 0.955, px) * smoothstep(0.12, 0.5, d.y - 0.2 * north);
  col += vec3(0.9, 0.95, 1.0) * st * 1.6;
  float md = acos(clamp(dot(d, MOON_LAKE), -1.0, 1.0)), mr = 0.0125;
  vec3 mo = normalize(MOON_LAKE + vec3(0.0105, 0.0035, 0.0));
  float cres = smoothstep(mr, mr - 1.5 * px - 0.0006, md) * smoothstep(mr * 0.97 - 1.5 * px, mr * 0.97 + 0.0006, acos(clamp(dot(d, mo), -1.0, 1.0)));
  col += vec3(1.0, 0.96, 0.84) * cres * 2.2 + vec3(0.5, 0.6, 0.9) * 0.05 * exp(-md * md / 0.004);
  // the rare visit: northern lights low over the hills
  if (uRare > 0.5) {
    float cur = fbm2(vec2(atan(d.x, -d.z + 1e-6) * 5.0 + uTime * 0.03, 1.7)), ray = vn(vec2(atan(d.x, -d.z + 1e-6) * 60.0, uTime * 0.2));
    float h0 = 0.12 + 0.10 * cur, a = smoothstep(h0, h0 + 0.03, d.y) * exp(-max(d.y - h0, 0.0) / 0.16) * north;
    col += (${F('#40f0a0', 0.5)} + ${F('#9060e0', 0.5)} * smoothstep(0.0, 0.3, d.y - h0)) * a * (0.45 + 0.55 * ray);
  }
  return col;
}
// GARDEN: a June morning about seven: clear pale blue, small white clouds, the sun in the east-north-east 22 degrees up
vec3 skyGarden(vec3 d, float px){
  float el = max(d.y, 0.0);
  // (round two: a deeper blue overhead, paling to a warm white at the horizon)
  float t = clamp(1.0 - el, 0.0, 1.0), t3 = t * t * t;
  vec3 col = mix(${F('#3f7fd6')}, ${F('#8fb8ea')}, t * t);
  col = mix(col, ${F('#f6f0e0')}, t3 * t3 * t);
  float sd = max(dot(d, SUN_GARDEN), 0.0), s2 = sd * sd, s8 = s2 * s2 * s2 * s2;
  col += vec3(1.0, 0.92, 0.72) * (0.35 * s8 + 1.6 * s8 * s8 * s8 * s8);
  col += vec3(1.0, 0.96, 0.86) * 30.0 * smoothstep(0.99955, 0.99985, sd);
  // small clouds, each with a side lit by the sun and a side in its own shade
  vec2 cp = d.xz / max(d.y + 0.12, 0.05) * 0.9 + vec2(uTime * 0.004, uTime * 0.0015);
  float cl = fbm(cp * 1.3 + 3.0), cover = smoothstep(0.55, 0.66, cl) * smoothstep(0.03, 0.16, d.y);
  float toSun = fbm(cp * 1.3 + 3.0 + 0.22 * normalize(SUN_GARDEN.xz)), lit = smoothstep(-0.02, 0.07, cl - toSun);
  float body = smoothstep(0.55, 0.80, cl);
  vec3 cc = mix(${F('#fff7e6', 1.05)}, ${F('#8c9cbc')}, clamp(0.25 + 0.75 * (1.0 - lit) * (0.45 + 0.55 * body), 0.0, 1.0));
  col = mix(col, cc, cover * 0.95);
  return col;
}
// SEA: sunset after showers: the sun 5 degrees up on bearing 57 (round two: ahead and to the right out of the
// harbour's mouth, behind the islet's hut), towers of cloud rose and gold, the far side deep blue, a pale moon
vec3 skySea(vec3 d, float px){
  float el = max(d.y, 0.0), sd = max(dot(d, SUN_SEA), 0.0);
  float t = clamp(1.0 - el, 0.0, 1.0); t = t * t * t;
  float w = 0.5 + 0.5 * dot(normalize(d.xz + 1e-5), normalize(SUN_SEA.xz));
  vec3 col = mix(mix(${F('#2c4078', 0.9)}, ${F('#5868a0', 0.9)}, w), mix(${F('#4a5a90', 0.9)}, ${F('#f08060', 1.1)}, w * w), t);
  float s2 = sd * sd, s8 = s2 * s2 * s2 * s2;
  col += ${F('#ffc878', 1.2)} * (0.5 * s8 + 0.9 * s8 * s8 * s8);
  col += ${F('#fff0c0', 7.0)} * smoothstep(0.9990, 0.9996, sd);
  vec2 cp = vec2(atan(d.x, -d.z + 1e-6) * 2.2, d.y * 7.0);
  float tow = fbm(cp + vec2(uTime * 0.002, 0.0)) * 0.7 + 0.3 * fbm(cp * 3.1 + 9.0);
  float top = 0.05 + 0.34 * smoothstep(0.30, 0.75, fbm2(vec2(cp.x * 0.7 + 4.0, 2.0)));
  float cover = smoothstep(top, top - 0.10, d.y - 0.10 * (tow - 0.5)) * smoothstep(0.42, 0.62, tow + 0.25 * (1.0 - d.y / max(top, 0.05)));
  vec3 cc = mix(${F('#6c5c88', 0.8)}, mix(${F('#ffd0b0', 1.05)}, ${F('#ffc878', 1.25)}, w), smoothstep(0.45, 0.8, tow) * (0.35 + 0.65 * w));
  col = mix(col, cc, cover * smoothstep(0.0, 0.03, d.y));
  col = mix(col, ${F('#5a3a70', 0.7)}, 0.55 * w * smoothstep(0.035, 0.012, abs(d.y - 0.045 - 0.02 * vn(vec2(cp.x * 1.3, 1.0)))));
  float md = acos(clamp(dot(d, MOON_SEA), -1.0, 1.0));
  col += vec3(0.95, 0.93, 0.85) * 0.9 * smoothstep(0.014, 0.014 - 1.5 * px - 0.0006, md) * (1.0 - cover);
  return col;
}
// STARS: a very dense sky, the pale band of the galaxy, one soft far cloud; THE PLANET behind the last hut (round two):
// a lit globe 70 degrees wide whose middle stands on bearing 178, seven degrees under the plain's horizon: worked as a
// true ball seen from 1.74 of its radii (each sight line meets it, and the place met is lit by the small sun on bearing
// 255): soft bands that curl, slow storms, the ring's shadow in fine dark lines, a dim blue night side with lightning;
// the small sun; two moons as crescents, left of the globe and clear of it
vec3 skyStars(vec3 d, float px){
  vec3 col = ${F('#02030a', 1.0)};
  vec3 gn = normalize(vec3(0.35, 0.62, 0.70));
  float gq = dot(d, gn) / 0.22, gb = exp(-gq * gq), gf = fbm(vec2(atan(d.x, d.z + 1e-6) * 3.0, d.y * 4.0) + 2.0);
  col += vec3(0.50, 0.55, 0.72) * 0.045 * gb * (0.5 + gf);
  float cd = max(dot(d, normalize(vec3(-0.5, 0.45, 0.72))), 0.0), cl = cd * cd; cl = cl * cl * cl * cl;
  col += mix(${F('#2c8c94', 0.5)}, ${F('#6c4cb0', 0.5)}, vn(d.xy * 6.0 + 1.0)) * cl * cl * (0.25 + 0.75 * fbm(d.xz * 9.0 + 4.0)) * 0.5;
  float st = starField(d, 90.0, 0.80, px) + starField(d.zxy, 37.0, 0.80, px) * 1.6 + 0.45 * starField(d.yzx, 160.0, 0.86 - 0.5 * gb, px);
  vec3 tint = mix(vec3(1.0, 0.91, 0.78), vec3(0.78, 0.85, 1.0), h21(floor(d.xy * 400.0)));
  col += tint * st * 1.5;
  // a low thin haze of ice dust where the far ice meets the sky, a little warmer toward the sun
  float hz = exp(-abs(d.y - 0.05) / 0.045), sunSide = 0.5 + 0.5 * dot(normalize(d.xz + 1e-5), normalize(SUN_STARS.xz));
  col += mix(vec3(0.10, 0.14, 0.24), vec3(0.30, 0.27, 0.22), sunSide * sunSide) * 0.16 * hz;
  // THE PLANET
  float pc0 = dot(d, PLANET_DIR);
  if (pc0 > PLANET_COS - 0.03) {
    float bq = PLANET_DIST * pc0, disc = bq * bq - (PLANET_DIST * PLANET_DIST - 1.0);
    float pa = acos(clamp(pc0, -1.0, 1.0)), edge = smoothstep(PLANET_ANG, PLANET_ANG - 1.5 * px - 0.0012, pa);
    if (disc > 0.0) {
      vec3 n = normalize(d * (bq - sqrt(disc)) - PLANET_DIR * PLANET_DIST);
      float lt = asin(clamp(n.y, -1.0, 1.0)), lon = atan(n.x, -n.z) - uTime * 0.0035;
      float warp = fbm(vec2(lon * 2.4, lt * 6.5)) - 0.5, curl = vn(vec2(lon * 10.0 + 4.0 * warp, lt * 30.0)) - 0.5;
      float y = lt + 0.075 * warp + 0.011 * curl;
      float b1 = 0.5 + 0.5 * sin(y * 17.0 + 1.6 * vn(vec2(y * 6.0, 1.0))), b2 = vn(vec2(y * 33.0, 4.0 + 0.6 * warp));
      vec3 pc = mix(${F('#ecdcae', 0.95)}, ${F('#d6a868', 0.95)}, smoothstep(0.18, 0.82, b1));
      pc = mix(pc, ${F('#a8c0d8', 0.9)}, smoothstep(0.50, 0.92, vn(vec2(y * 4.3, 3.0))) * 0.62);
      pc *= 0.84 + 0.32 * b2;
      // two slow storms: an oval with a pale collar, drifting with the bands
      vec2 s1 = vec2((lon + 0.55 + 0.03 * sin(uTime * 0.01)) * cos(lt), lt - 0.44) / vec2(0.15, 0.058);
      vec2 s2 = vec2((lon - 0.42) * cos(lt), lt - 0.70) / vec2(0.075, 0.034);
      float d1 = length(s1 + 0.25 * warp), d2 = length(s2 + 0.2 * warp);
      pc = mix(pc, ${F('#c8744c', 0.9)}, 0.78 * smoothstep(1.0, 0.45, d1));
      pc = mix(pc, ${F('#f4ecd8', 0.9)}, 0.35 * smoothstep(0.30, 0.0, abs(d1 - 1.05)) + 0.6 * smoothstep(1.0, 0.4, d2));
      float mu = clamp(dot(n, -d), 0.0, 1.0), sun = dot(n, SUN_STARS), day = smoothstep(-0.45, 0.30, sun);
      // the ring's shadow: fine dark lines along the low latitudes of the day side
      float rs = smoothstep(0.46, 0.60, vn(vec2(lt * 230.0, 2.0))) * smoothstep(0.215, 0.235, lt) * smoothstep(0.37, 0.34, lt);
      vec3 lit = pc * (1.35 * day * (0.30 + 0.70 * pow(mu, 0.55)) * (0.72 + 0.28 * clamp(sun, 0.0, 1.0))) * (1.0 - 0.62 * rs);
      lit += vec3(0.55, 0.72, 1.0) * 0.38 * pow(1.0 - mu, 3.0) * day;
      // the night side: dim blue by the ring's own light, with small flickers of lightning
      vec3 night = pc * vec3(0.060, 0.100, 0.190) * (0.45 + 0.55 * mu) + vec3(0.012, 0.022, 0.050) * pow(1.0 - mu, 2.0);
      vec2 lq = vec2(lon * 13.0, lt * 19.0), lc = floor(lq);
      float tk = floor(uTime * 2.6), fl = step(0.955, h21(lc + tk * 0.371)) * step(0.5, h21(lc + 3.1)) * smoothstep(0.13, 0.02, length(fract(lq) - 0.5 - 0.5 * (vec2(h21(lc + tk), h21(lc - tk)) - 0.5)));
      night += vec3(0.60, 0.74, 1.0) * 0.9 * fl;
      col = mix(col, lit + night * (1.0 - day), edge);
    }
    // a thin air glow just outside the sunward limb
    col += vec3(0.45, 0.60, 1.0) * 0.10 * smoothstep(PLANET_ANG + 0.018, PLANET_ANG, pa) * smoothstep(PLANET_ANG - 0.004, PLANET_ANG, pa) * smoothstep(-0.2, 0.5, dot(normalize(d - PLANET_DIR * pc0), normalize(SUN_STARS - PLANET_DIR * dot(SUN_STARS, PLANET_DIR))));
  }
  float sa = acos(clamp(dot(d, SUN_STARS), -1.0, 1.0));
  col += vec3(15.0, 14.2, 12.6) * smoothstep(0.0075, 0.0075 - 1.5 * px - 0.0004, sa) + vec3(1.0, 0.93, 0.8) * 0.06 * exp(-sa / 0.05);
  for (int i = 0; i < 2; i++) {
    // (their places are dealt by the seed: the larger about bearing 120, 13 degrees up; the smaller about bearing 139, 20 up)
    float maz = i == 0 ? 2.094 + 0.07 * uDeal.z : 2.426 + 0.03 * uDeal.w, mel = i == 0 ? 0.227 + 0.03 * uDeal.w : 0.349 + 0.025 * uDeal.z;
    vec3 mdir = vec3(sin(maz) * cos(mel), sin(mel), -cos(maz) * cos(mel)) + 0.0 * d;
    vec3 rel = d - mdir, sdir = normalize(SUN_STARS - mdir * dot(SUN_STARS, mdir)), tdir = cross(mdir, sdir);
    float mr = i == 0 ? 0.020 : 0.012, ma = length(rel), uu = dot(rel, sdir), vv = dot(rel, tdir);
    // a crescent: the lit limb toward the sun, its inner edge the half of an oval
    float cres = smoothstep(-0.8 * px - 0.0003, 0.8 * px + 0.0003, uu - 0.42 * sqrt(max(mr * mr - vv * vv, 0.0)));
    col = mix(col, vec3(0.86, 0.87, 0.90) * (0.035 + 1.15 * cres * (0.55 + 0.45 * clamp(uu / mr, 0.0, 1.0))), smoothstep(mr, mr - 1.5 * px - 0.0004, ma));
  }
  // the comet (its place dealt by the seed): a small head and a long thin tail that points away from the sun
  vec3 cdir = vec3(sin(uDeal.x) * cos(uDeal.y), sin(uDeal.y), -cos(uDeal.x) * cos(uDeal.y));
  vec3 tdir = normalize(cdir - SUN_STARS * dot(cdir, SUN_STARS) + vec3(0.0, 0.35, 0.0));
  vec3 crel = d - cdir;
  float calong = dot(crel, tdir), cacross = length(crel - tdir * calong), cw = 0.0012 + 0.010 * max(calong, 0.0) + px;
  col += vec3(0.80, 0.90, 1.0) * (1.8 * smoothstep(0.0035, 0.0035 - 1.5 * px - 0.0004, length(crel)) + 0.45 * smoothstep(-0.002, 0.012, calong) * exp(-calong / 0.085) * exp(-cacross * cacross / (cw * cw)) * 0.0022 / cw);
  if (uRare > 0.5) {
    // the rare visit: a second ringed planet, small and far (bearing 128, 23 degrees up, between the moons): a cream disc lit from the
    // sun's side, its ring a flat ellipse across it, the ring's far half hidden behind the disc
    float c2 = dot(d, RARE_DIR);
    if (c2 > 0.995) {
      vec3 e1 = normalize(cross(vec3(0.0, 1.0, 0.0), RARE_DIR)), e2 = cross(RARE_DIR, e1);
      vec2 q = vec2(dot(d, e1), dot(d, e2));
      q = vec2(q.x * 0.94 + q.y * 0.342, q.y * 0.94 - q.x * 0.342);
      float disc = smoothstep(0.011, 0.011 - 1.5 * px - 0.0004, length(q));
      vec2 sq = normalize(vec2(dot(SUN_STARS, e1), dot(SUN_STARS, e2)) + 1e-5);
      col = mix(col, ${F('#e8d0a0', 1.3)} * (0.22 + 0.78 * smoothstep(-0.009, 0.006, dot(q, sq))) * (0.85 + 0.15 * sin(q.y * 1500.0)), disc);
      float rl = length(q * vec2(1.0, 3.4));
      float ring = smoothstep(0.0032 + px, 0.0, abs(rl - 0.0205)) + 0.6 * smoothstep(0.0022 + px, 0.0, abs(rl - 0.0158));
      col += ${F('#f0e0c0', 0.9)} * min(ring, 1.0) * (q.y < 0.0 ? 1.0 : 1.0 - disc);
    }
  }
  return col;
}
vec3 skyOf(float pl, vec3 d, float px){
  if (pl < 0.5) return skyLake(d, px);
  if (pl < 1.5) return skyGarden(d, px);
  if (pl < 2.5) return skySea(d, px);
  return skyStars(d, px);
}
// EACH PLACE'S AIR, laid only over the part of a sight line that lies in that place: len metres of it, its middle at pm
vec3 placeAir(float pl, vec3 col, vec3 dir, float len, vec3 pm){
  float ym = max(pm.y, 0.0);
  if (pl < 0.5) {
    float sheet = 0.45 + 1.1 * fbm2(pm.xz * 0.013 + vec2(uTime * 0.006, uTime * 0.003));
    float od = len * (0.00085 * exp(-ym / 90.0) + 0.0011 * sheet * exp(-ym / 2.6));
    float north = smoothstep(-0.35, 1.0, clamp(-dir.z / max(length(dir.xz), 1e-4), -1.0, 1.0));
    vec3 fc = mix(${F('#5a6c98', 0.62)}, ${F('#b87c78', 0.62)}, north * north * 0.45 * exp(-max(dir.y, 0.0) / 0.12));
    return mix(fc, col, exp(-od));
  }
  if (pl < 1.5) {
    // clear to about 120 m, then the morning's haze gathers low over the far end, the belt and the hills
    float od = len * 0.00016 * exp(-ym / 160.0) + (len * 0.00030 + 0.85 * smoothstep(120.0, 380.0, len)) * exp(-ym / 14.0);
    float sd = max(dot(dir, SUN_GARDEN), 0.0);
    return mix(mix(${F('#d4e2ee', 0.8)}, ${F('#f8f1dc', 0.92)}, 0.10 + 0.90 * sd * sd) + vec3(0.20, 0.15, 0.06) * sd * sd, col, exp(-od));
  }
  if (pl < 2.5) {
    float od = len * 0.00075 * exp(-ym / 90.0);
    float w = 0.5 + 0.5 * dot(normalize(dir.xz + 1e-5), normalize(SUN_SEA.xz));
    return mix(mix(${F('#4a5a90', 0.85)}, ${F('#f0a070', 1.0)}, w * w), col, exp(-od));
  }
  // the ring: no air, only a thin haze of ice dust over the far sheet (nothing within 300 m is touched)
  return mix(vec3(0.030, 0.042, 0.075), col, exp(-max(len - 300.0, 0.0) * 0.00022));
}
// THE LIGHT OF THE NEXT PLACE AT THIS PLACE'S OPENING: a fixed light at a fixed place (the opening's own middle), read
// from the lit surface's place and facing alone. It does not know the eye.
vec3 doorGlow(float pl, vec3 w, vec3 N){
  // (round four: the opening is the box's doorway, 6.4 m by 13.3 m: c is its middle, 3.95 m over the line; hgt is half
  // its height; dep is the depth of the doorway before the plane, where the open doors and the head's soffit stand)
  vec3 c, n, lc; float area, hgt = 6.65, dep = 3.4;
  if (pl < 0.5) { c = vec3(PC1.x, PC1.y + 3.95, PC1.z); n = PN1; lc = vec3(1.9, 1.25, 0.55); area = 60.0; }
  else if (pl < 1.5) { c = vec3(PC2.x, PC2.y + 3.95, PC2.z); n = PN2; lc = vec3(1.7, 0.95, 0.42); area = 60.0; }
  else if (pl < 2.5) { c = vec3(PC3.x, PC3.y + 3.95, PC3.z); n = PN3; lc = vec3(0.26, 0.33, 0.50); area = 60.0; }
  else return vec3(0.0);
  vec3 v = w - c;
  float r = length(v), dn = dot(v, n);
  if (dn < -0.02 || r > 60.0) return vec3(0.0);
  // the opening as a lit area seen from the surface: its own cosine, the surface's cosine, its size over the distance
  vec3 vd = v / max(r, 1e-3);
  float cosE = clamp(dn / max(r, 1e-3), 0.0, 1.0), cosS = clamp(dot(N, -vd), 0.0, 1.0);
  float far = cosE * cosS * area / (r * r + 0.6 * area) * smoothstep(30.0, 10.0, r);
  // the frame's own reveals (within its depth, facing the opening's axis) see the inner place's whole brightness
  // (a jamb faces the doorway's upright middle band, the head's soffit its level middle band)
  vec3 ax = v - n * dn;
  float hl = length(ax.xz);
  ax.xz *= max(hl - 2.2, 0.0) / max(hl, 1e-3);
  ax.y = sign(ax.y) * max(abs(ax.y) - (hgt - 1.0), 0.0);
  float inward = clamp(dot(N, -ax / max(length(ax), 1e-3)), 0.0, 1.0);
  float rev = inward * smoothstep(dep + 0.35, dep + 0.05, dn) * smoothstep(4.2, 3.4, hl) * step(abs(v.y), hgt + 0.2);
  return lc * (1.5 * far + 1.5 * rev);
}
// THE LANTERN on the jetties of the garden's, the sea's and the last hut: a small warm light at a fixed place, with a
// small steady flicker on the clock; its light lies on planks, water, ice and the hut's flank by where they stand and
// how they face (pale by the garden's day). The lake's hut has none, and no light stands beside it (the brief's never
// list, item 5).
vec3 lampGlow(float pl, vec3 w, vec3 N){
  if (pl < 0.5) return vec3(0.0);
  vec3 lp = pl < 1.5 ? LAMP1 : (pl < 2.5 ? LAMP2 : LAMP3);
  vec3 v = lp - w;
  float r2 = dot(v, v);
  if (r2 > 400.0) return vec3(0.0);
  float fl = 0.86 + 0.09 * sin(uTime * 5.3 + lp.x) + 0.05 * sin(uTime * 12.7 + lp.z);
  float k = pl < 1.5 ? 0.10 : (pl < 2.5 ? 0.55 : 1.5);
  return vec3(1.0, 0.60, 0.24) * k * fl * (0.25 + 0.75 * clamp(dot(N, v) / sqrt(r2 + 1e-4), 0.0, 1.0)) * 1.9 / (1.0 + r2 * 0.55) * smoothstep(400.0, 120.0, r2);
}
uniform sampler2D tShade;
uniform vec4 uShadeBox;
// whether the place's sun reaches a point: the place's shadow-height map (the height up to which each spot of the
// plan lies in shadow, made at the build from where things stand), and in the garden the slow shadows of the clouds
// THE GARDEN'S FAIR-WEATHER CLOUDS (CLOUDS): the shadows of four clouds crossing the ground toward the west-north-west
// at 4 m a second on the clock; along the wind they stand evenly round the 480 m after which each comes round again, a
// quarter of it (120 m) apart. Across the wind their lanes (uCloudAc) are laid by the world at the build, clear of the
// canal and of the garden hut (the world's cloudLanes, which the build tests).
uniform vec4 uCloudAc;
float cloudOne(float al, float ac, float wob, vec4 k){
  return smoothstep(1.0, 0.5, length(vec2((mod(al - k.x + 240.0, 480.0) - 240.0) / k.z, (ac - k.y) / k.w)) + wob);
}
float cloudShade(vec2 p){
  float al = -0.941 * p.x - 0.339 * p.y - ${CLOUD_WIND.toFixed(1)} * uTime, ac = 0.339 * p.x - 0.941 * p.y;
  float wob = ${CLOUD_WOB.toFixed(2)} * (fbm(vec2(al, ac) * 0.03) - 0.5);
  return max(max(cloudOne(al, ac, wob, vec4(${CLOUDS[0].along.toFixed(1)}, uCloudAc.x, ${CLOUDS[0].halfAlong.toFixed(1)}, ${CLOUDS[0].halfAcross.toFixed(1)})), cloudOne(al, ac, wob, vec4(${CLOUDS[1].along.toFixed(1)}, uCloudAc.y, ${CLOUDS[1].halfAlong.toFixed(1)}, ${CLOUDS[1].halfAcross.toFixed(1)}))),
             max(cloudOne(al, ac, wob, vec4(${CLOUDS[2].along.toFixed(1)}, uCloudAc.z, ${CLOUDS[2].halfAlong.toFixed(1)}, ${CLOUDS[2].halfAcross.toFixed(1)})), cloudOne(al, ac, wob, vec4(${CLOUDS[3].along.toFixed(1)}, uCloudAc.w, ${CLOUDS[3].halfAlong.toFixed(1)}, ${CLOUDS[3].halfAcross.toFixed(1)}))));
}
float sunSeen(float pl, vec3 w){
  vec2 sq = (w.xz - uShadeBox.xy) * uShadeBox.zw;
  // (beyond the map's own box nothing is shadowed)
  float h = (sq.x < 0.0 || sq.x > 1.0 || sq.y < 0.0 || sq.y > 1.0) ? -100.0 : texture2D(tShade, sq).r;
  float s = smoothstep(-0.10, 0.32, w.y - h + 0.05);
  if (pl > 0.5 && pl < 1.5) s *= 1.0 - 0.45 * cloudShade(w.xz);
  return s;
}
vec3 shadeIt(float pl, vec3 alb, vec3 N, vec3 w, vec3 dir, float sv, float gloss, float trans){
  PL L = placeLight(pl);
  float ndl = max(dot(N, L.sd), 0.0);
  vec3 col = alb * (L.sc * ndl * sv + mix(L.gnd, L.sky, N.y * 0.5 + 0.5));
  float thr = max(dot(dir, L.sd), 0.0);
  col += alb * L.sc * sv * trans * (0.25 + 0.75 * thr * thr) * (1.0 - ndl);
  float sp = max(dot(N, normalize(L.sd - dir)), 0.0), sp2 = sp * sp, sp8 = sp2 * sp2 * sp2 * sp2;
  col += L.sc * sv * gloss * sp8 * sp8 * sp8 * sp8;
  col += alb * (doorGlow(pl, w, N) + lampGlow(pl, w, N));
  return col;
}
// THE LOOK OF THE RING'S SHEET: fine lanes that run with the ring's own circles, a grain of packed ice, small glints
// (more of them toward the low sun), and the pale light of its countless faces
void ringLook(vec3 w, float sv, inout vec3 alb, inout vec3 emi){
  float fw3 = fwidth(w.x) + fwidth(w.z), rho = length(w.xz - RING_C);
  float k1 = smoothstep(26.0, 7.0, fw3), k2 = smoothstep(7.0, 1.6, fw3), k3 = smoothstep(1.6, 0.3, fw3);
  float lane = 1.0 + k1 * 0.50 * (vn(vec2(rho * 0.085, 3.0)) - 0.5) + k2 * 0.44 * (vn(vec2(rho * 0.43, 7.0)) - 0.5) + k3 * 0.36 * (vn(vec2(rho * 2.1, 11.0)) - 0.5);
  alb *= lane;
  alb *= mix(1.0, 0.74 + 0.52 * vn(w.xz * 2.7), smoothstep(0.50, 0.08, fw3)) * mix(1.0, 0.86 + 0.28 * vn(w.xz * 0.31 + 5.0), smoothstep(5.0, 1.0, fw3));
  vec3 vd = normalize(w - cameraPosition);
  float toSun = max(dot(normalize(vd.xz), normalize(SUN_STARS.xz)), 0.0), swath = 0.35 + 0.65 * toSun * toSun;
  vec2 g1 = w.xz * 6.0, i1 = floor(g1), g2 = w.xz * 1.3, i2 = floor(g2);
  float tw1 = 0.5 + 0.5 * sin(uTime * (0.7 + 1.6 * h21(i1 + 3.0)) + 40.0 * h21(i1 + 9.0)), tw2 = 0.5 + 0.5 * sin(uTime * (0.6 + 1.2 * h21(i2 + 3.0)) + 40.0 * h21(i2 + 9.0));
  float gl = step(0.975, h21(i1)) * smoothstep(0.34, 0.08, length(fract(g1) - 0.5)) * tw1 * smoothstep(0.16, 0.03, fw3)
           + step(0.955, h21(i2)) * smoothstep(0.30, 0.06, length(fract(g2) - 0.5)) * tw2 * smoothstep(1.3, 0.35, fw3) * smoothstep(0.05, 0.2, fw3);
  emi += vec3(1.0, 0.97, 0.90) * gl * sv * swath * 1.5;
  emi += alb * vec3(0.50, 0.55, 0.64) * (0.20 + 0.24 * sv);
}
// WHAT A SURFACE IS MADE OF, by the kind its vertices carry (uv in metres on the face)
void surface(float kind, float ex, vec2 uv, vec3 w, float sv, inout vec3 alb, inout float gloss, inout vec3 emi, inout float trans){
  vec2 fw2 = fwidth(uv);
  float fw = max(fw2.x, fw2.y);
  if (kind < 0.5) return;
  if (kind < 1.5) {                                   // tarred boards, 0.19 m wide along uv.x
    float pk = uv.x / 0.19, id = floor(pk), e = abs(fract(pk) - 0.5), keep = smoothstep(0.55, 0.12, fw / 0.19);
    alb *= mix(1.0, (0.78 + 0.40 * h21(vec2(id, 3.0))) * (1.0 - 0.6 * smoothstep(0.43, 0.5, e)) * (0.86 + 0.28 * vn(vec2(pk * 7.0, uv.y * 1.1 + id * 5.3))), keep);
    return;
  }
  if (kind < 2.5) {                                   // turf and long grass, with small flowers
    alb *= 0.62 + 0.76 * fbm(uv * 1.9);
    float sp = step(0.988, h21(floor(uv * 11.0))) * smoothstep(0.10, 0.03, fw);
    alb = mix(alb, mix(vec3(0.85, 0.80, 0.45), vec3(0.80, 0.78, 0.86), h21(floor(uv * 11.0) + 2.0)), sp * ex);
    trans = 0.25;
    return;
  }
  if (kind < 3.5) {                                   // rough stone in courses
    float row = floor(uv.y / 0.34);
    vec2 q = vec2(uv.x / 0.62 + 0.5 * mod(row, 2.0) + 0.3 * h21(vec2(row, 1.0)), uv.y / 0.34);
    vec2 e = abs(fract(q) - 0.5);
    float keep = smoothstep(0.30, 0.08, fw);
    alb *= mix(1.0, (0.72 + 0.5 * h21(floor(q))) * (1.0 - 0.5 * smoothstep(0.44, 0.5, max(e.x, e.y))), keep) * (0.85 + 0.3 * vn(uv * 6.0));
    return;
  }
  if (kind < 4.5) {                                   // brick in running bond, 0.225 by 0.075
    float row = floor(uv.y / 0.075);
    vec2 q = vec2(uv.x / 0.225 + 0.5 * mod(row, 2.0), uv.y / 0.075);
    vec2 e = abs(fract(q) - 0.5);
    float keep = smoothstep(0.075, 0.02, fw);
    float mort = smoothstep(0.455, 0.5, e.x) + smoothstep(0.40, 0.5, e.y);
    alb = mix(alb * (0.90 + 0.2 * vn(uv * 1.3)), mix(alb * (0.74 + 0.5 * h21(floor(q))), vec3(0.62, 0.58, 0.52), clamp(mort, 0.0, 1.0) * 0.8), keep);
    return;
  }
  if (kind < 5.5) {                                   // clipped yew and box: a close dark fleece
    alb *= 0.50 + 0.95 * fbm(uv * 4.5) * (0.7 + 0.6 * vn(uv * 19.0));
    trans = 0.12;
    return;
  }
  if (kind < 6.5) {                                   // gravel
    alb *= mix(1.0, 0.78 + 0.44 * vn(uv * 26.0), smoothstep(0.08, 0.02, fw)) * (0.92 + 0.16 * fbm(uv * 0.7));
    return;
  }
  if (kind < 7.5) {                                   // lawn: mown stripes, dew that glints
    float stripe = smoothstep(-0.2, 0.2, sin(uv.x * 2.85)) * smoothstep(0.9, 0.3, fw);
    alb *= (0.84 + 0.30 * fbm(uv * 0.8)) * (0.95 + 0.10 * stripe) * (0.80 + 0.40 * fbm2(uv * 0.045 + 7.0)) * mix(1.0, 0.86 + 0.28 * vn(uv * 30.0), smoothstep(0.07, 0.02, fw));
    float dew = step(0.9965, h21(floor(uv * 34.0))) * smoothstep(0.05, 0.015, fw);
    emi += vec3(1.0, 0.97, 0.85) * dew * sv * 1.6 * (0.5 + 0.5 * sin(uTime * 2.0 + 40.0 * h21(floor(uv * 34.0) + 1.0)));
    trans = 0.2;
    return;
  }
  if (kind < 8.5) {                                   // tilled soil in rows
    alb *= (0.74 + 0.5 * vn(uv * 9.0)) * (0.88 + 0.2 * sin(uv.x * 10.5) * smoothstep(0.3, 0.1, fw));
    return;
  }
  if (kind < 9.5) {                                   // lime-washed panes: milky, white bars, plants pressing from inside
    vec2 q = vec2(uv.x / 0.62, uv.y / 1.45);
    vec2 e = abs(fract(q) - 0.5);
    float bar = max(smoothstep(0.455, 0.475, e.x), smoothstep(0.482, 0.492, e.y)) * smoothstep(0.30, 0.08, fw);
    float plant = smoothstep(0.42, 0.62, fbm(uv * vec2(0.55, 0.42) + 3.0) + 0.30 - 0.11 * uv.y) * (0.75 + 0.25 * vn(uv * 5.0));
    vec3 glass = mix(alb * (0.90 + 0.12 * vn(uv * 1.7)), mix(vec3(0.07, 0.17, 0.08), vec3(0.20, 0.36, 0.14), vn(uv * 2.6)), plant * 0.70);
    alb = mix(glass, vec3(0.90, 0.90, 0.86), bar);
    gloss = 0.55 * (1.0 - bar);
    return;
  }
  // a lit window
  if (kind < 10.5) { emi += alb * ex * (0.85 + 0.15 * sin(uTime * 1.7 + w.x * 0.37)); alb *= 0.2; return; }
  if (kind < 11.5) {                                  // leaves in a crown
    alb *= 0.55 + 0.9 * fbm(uv * 2.6) * (0.75 + 0.5 * vn(uv * 11.0));
    trans = 0.45;
    return;
  }
  if (kind < 12.5) {                                  // paving flags and copings, 0.9 m slabs
    vec2 q = uv / 0.9; q.x += 0.5 * mod(floor(q.y), 2.0);
    vec2 e = abs(fract(q) - 0.5);
    alb *= mix(1.0, (0.86 + 0.26 * h21(floor(q))) * (1.0 - 0.4 * smoothstep(0.465, 0.5, max(e.x, e.y))), smoothstep(0.5, 0.12, fw)) * (0.9 + 0.2 * vn(uv * 3.0));
    return;
  }
  // far wooded hills
  if (kind < 13.5) { alb *= 0.72 + 0.56 * fbm(uv * 0.035); return; }
  // bark
  if (kind < 14.5) { alb *= 0.70 + 0.6 * vn(vec2(uv.x * 14.0, uv.y * 1.3)); trans = 0.3; return; }
  // petals
  if (kind < 15.5) { trans = 0.7; return; }
  // a thing that glows
  if (kind < 16.5) { emi += alb * ex; alb *= 0.0; return; }
  if (kind < 17.5) {                                  // ice, rock of the ring: facets that glint
    alb *= 0.8 + 0.4 * vn(uv * 0.9);
    // (great ice, ex 1: old layers and cracks across its faces, by height)
    if (ex > 0.5) alb *= (0.80 + 0.14 * vn(vec2(w.y * 0.55 + 0.12 * (w.x + w.z), 3.0)) + 0.06 * vn(vec2(w.y * 2.3, w.x * 0.2 + w.z * 0.2))) * mix(1.0, 0.86 + 0.28 * vn(w.xz * 1.7 + w.y * 1.3), smoothstep(0.5, 0.1, fw));
    vec2 gq = uv * 2.2 + w.xz * 0.37, gi = floor(gq);
    float gl = step(0.985, h21(gi)) * smoothstep(0.30, 0.05, length(fract(gq) - 0.5)) * (0.5 + 0.5 * sin(uTime * (0.8 + 1.5 * h21(gi + 3.0)) + 40.0 * h21(gi + 9.0)));
    emi += vec3(1.0, 0.97, 0.90) * gl * gl * sv * 1.4 * smoothstep(0.5, 0.1, fw);
    // (light that has gone into the block comes out of every face of it: its shaded faces are a deep blue, never grey)
    emi += alb * vec3(0.05, 0.10, 0.21) * (0.7 + 0.6 * vn(uv * 0.9 + 3.0));
    gloss = 0.6;
    trans = 0.24;
    return;
  }
  // rough rock and cliff: beds that dip a little, paler and darker by turns, dark seams between them; with ex (a rock
  // that stands in the sea) a dark wet foot, a pale line of barnacles at the tide's height
  if (kind < 18.5) {
    float by = w.y + 0.07 * w.x - 0.04 * w.z + 1.3 * vn(w.xz * 0.06) + 0.35 * vn(w.xz * 0.5);
    float bed = 0.6 * vn(vec2(by * 0.75, 3.0)) + 0.4 * vn(vec2(by * 2.9, 9.0));
    float seam = smoothstep(0.40, 0.5, abs(fract(by * 0.62 + 0.3 * vn(vec2(by * 0.2, 5.0))) - 0.5)) * smoothstep(1.0, 0.25, fwidth(by) * 0.62);
    alb *= (0.62 + 0.72 * bed) * (1.0 - 0.38 * seam) * (0.85 + 0.3 * fbm(uv * 0.5));
    if (ex > 0.5) {
      // (the sea stands at y -1: wet and dark to 1.5 m over it, a pale line of barnacles 0.9 m over it)
      float tide = w.y + 1.0 - 0.25 * vn(w.xz * 0.9);
      alb *= mix(0.42, 1.0, smoothstep(0.3, 1.5, tide));
      alb = mix(alb, vec3(0.42, 0.40, 0.33), 0.38 * smoothstep(0.28, 0.0, abs(tide - 0.9)));
      gloss = 0.35 * smoothstep(1.2, 0.2, tide);
    }
    return;
  }
  if (kind < 19.5) {                                  // a jet of water: white, beads running along it with the clock (ex: their speed, metres a second along uv.y)
    float bead = 0.5 + 0.5 * sin((uv.y - uTime * ex) * 9.0 + 3.0 * sin(uv.x * 40.0));
    alb *= 0.72 + 0.28 * bead;
    emi += alb * 0.25 * bead;
    gloss = 0.9;
    trans = 0.6;
    return;
  }
  if (kind < 20.5) {                                  // a cut bed of flowers: heads of the bed's colour set close among dark leaves, by the ground's own place
    float c = 0.6 * vn(w.xz * 2.6) + 0.4 * vn(w.xz * 6.5 + 7.0);
    float keep = smoothstep(1.1, 0.3, (fwidth(w.x) + fwidth(w.z)) * 2.6);
    alb = mix(alb * 0.74, mix(vec3(0.035, 0.11, 0.03), alb, smoothstep(0.36, 0.52, c)), keep) * (0.8 + 0.4 * vn(w.xz * 1.7));
    trans = 0.5;
    return;
  }
  if (kind < 21.5) {                                  // a lamp that flashes on its own slow rhythm of the world's clock (by where it stands)
    float cell = h21(floor(w.xz / 6.0) + 0.5), per = 2.6 + 3.2 * cell, ph = fract(uTime / per + cell * 7.0);
    emi += alb * ex * (0.05 + smoothstep(0.0, 0.03, ph) * smoothstep(0.34, 0.26, ph));
    alb *= 0.08;
    return;
  }
  if (kind < 22.5) {                                  // a net hung to dry: a dark mesh of diamonds
    vec2 q = vec2(uv.x + uv.y, uv.x - uv.y) / 0.14, e = abs(fract(q) - 0.5);
    alb *= mix(0.62, 0.30 + 0.75 * smoothstep(0.30, 0.46, max(e.x, e.y)), smoothstep(0.12, 0.03, fw)) * (0.8 + 0.4 * vn(uv * 2.0));
    trans = 0.35;
    return;
  }
  if (kind < 23.5) {                                  // the ring's sheet of ice: its bands are the geometry's own colours; here the lanes, the grain, the glints
    // (ex 1: the far side of the ring, beyond the planet: it is hidden where the globe stands before it)
    if (ex > 0.5 && dot(normalize(w - cameraPosition), PLANET_DIR) > PLANET_COS) discard;
    ringLook(w, sv, alb, emi);
    return;
  }
  if (kind < 24.5) {                                  // a sail: canvas in cloths 0.6 m wide, the low sun coming through it
    float e = abs(fract(uv.x / 0.6) - 0.5);
    alb *= (0.90 + 0.16 * vn(uv * 0.9)) * (1.0 - 0.22 * smoothstep(0.44, 0.5, e) * smoothstep(0.4, 0.1, fw));
    trans = 0.75;
    return;
  }
  if (kind > 27.5) {                                  // (28) THE BOX'S LAMP: a slow pulse on the world's clock (ex: the box's dealt phase, in turns); it never reads the eye
    emi += alb * (0.72 + 0.28 * sin(uTime * 0.9 + ex * 6.2832));
    alb *= 0.0;
    return;
  }
  if (kind > 26.5) {                                  // (27) THE BOX'S BLUE: paint on wood, a little grain, pale wear in patches
    float keep = smoothstep(0.30, 0.06, fw);
    alb *= mix(1.0, 0.90 + 0.20 * vn(vec2(uv.x * 11.0, uv.y * 0.8)), keep);
    float worn = smoothstep(0.56, 0.86, vn(uv * 0.9 + 3.7)) * (0.5 + 0.5 * vn(uv * 5.0));
    alb = mix(alb, alb * 1.3 + vec3(0.03, 0.05, 0.07), 0.45 * worn * keep);
    // ITS OWN LIGHT ANSWER (round four): the paint gives back a deep royal blue of its own in every place, the same
    // in all four, so that the box reads blue at the blue hour and under the stars too, where the place's own light
    // would leave it black; the place's light is added to it where it strikes. By the paint alone: never the eye.
    emi += vec3(0.0018, 0.0530, 0.1290) * (alb.b / 0.30);
    gloss = 0.10;
    return;
  }
  if (kind > 25.5) {                                  // (26) THE LEADS of the pack ice: dark clear new ice, with white cracks and bubbles
    // (its colour is the sheet's own band there; ex: 0 within the pack, 1 toward the field's far rim, where it is the
    // sheet again by an uneven edge; uv.x: a contact shade. Round three b: only the leads are drawn so; the last hut's
    // floe is a plate of the pack's own ice, KIND.ICE, like the others)
    float fw4 = fwidth(w.x) + fwidth(w.z);
    float rim = smoothstep(0.30, 0.70, ex + 0.40 * (vn(w.xz * 0.7 + 2.0) - 0.5) + 0.22 * (vn(w.xz * 2.6) - 0.5));
    vec3 sheet = alb, sheetE = vec3(0.0);
    ringLook(w, sv, sheet, sheetE);
    vec3 deep = vec3(0.040, 0.105, 0.140) * uv.x * (0.70 + 0.60 * vn(w.xz * 0.35));
    float cr = min(abs(vn(w.xz * 0.42 + 3.0) - 0.5), 0.6 * abs(vn(w.xz * 1.3 + 9.0) - 0.5) + 0.012);
    float crack = smoothstep(0.022, 0.004, cr) * smoothstep(0.9, 0.2, fw4);
    vec2 bc = w.xz * 4.3, bi = floor(bc);
    float bub = step(0.90, h21(bi)) * smoothstep(0.26, 0.10, length(fract(bc) - 0.5 - 0.3 * (vec2(h21(bi + 5.0), h21(bi + 11.0)) - 0.5))) * smoothstep(0.35, 0.10, fw4);
    deep = mix(deep, vec3(0.50, 0.60, 0.68) * (0.4 + 0.6 * uv.x), max(0.60 * crack, 0.30 * bub));
    // (frost blown over it in thin drifts)
    deep = mix(deep, sheet * 0.8, 0.30 * smoothstep(0.55, 0.80, vn(w.xz * 0.23 + 17.0)) * smoothstep(0.3, 0.6, vn(w.xz * 1.1)));
    alb = mix(deep, sheet, rim);
    emi += sheetE * rim;
    gloss = 0.5 * (1.0 - rim);
    return;
  }
  // (25) a wall with small windows, some of them lit (ex: the lit share)
  vec2 q = vec2(uv.x / 2.3, uv.y / 2.7), cf = fract(q);
  float win = step(abs(cf.x - 0.5), 0.17) * step(abs(cf.y - 0.52), 0.19) * smoothstep(1.2, 0.5, fw);
  float lit = step(1.0 - ex, h21(floor(q) + floor(w.xz / 7.0)));
  alb = mix(alb * (0.88 + 0.24 * vn(uv * 1.4)), vec3(0.03, 0.035, 0.05), win);
  emi += vec3(1.0, 0.70, 0.32) * win * lit * 1.9 * (0.9 + 0.1 * sin(uTime * 1.3 + 9.0 * h21(floor(q))));
}
`;

// ---------------------------------------------------------------------------------------------------------------------
// THE ONE MATERIAL HELPER. Every mesh of the world and the sky take their material from kit.mat(place, ...): the
// helper writes the law's test as the LAST lines of every fragment shader (TAIL), so no material can be without it.
// kit.check(scene) is called at the end of the build and throws when it finds a mesh whose material the helper did
// not make.
// ---------------------------------------------------------------------------------------------------------------------
const BODY_VS = /* glsl */`
attribute vec3 aC;
attribute vec2 aUV;
attribute vec3 aK;
uniform float uTime;
varying vec3 vW, vN, vC, vK;
varying vec2 vUV;
void main(){
  vec3 p = position, n = normal, c = aC;
#ifdef USE_INSTANCING
  p = (instanceMatrix * vec4(p, 1.0)).xyz;
  n = mat3(instanceMatrix) * n;
  #ifdef USE_INSTANCING_COLOR
  c *= instanceColor;
  #endif
#endif
  vec4 w = modelMatrix * vec4(p, 1.0);
  n = normalize(mat3(modelMatrix) * n);
  // the breeze: a thing that sways carries its reach in metres in aK.y
  float sw = aK.y;
  if (sw > 0.0) {
    float ph = w.x * 0.21 + w.z * 0.17;
    w.x += sw * (0.6 * sin(uTime * 1.3 + ph) + 0.4 * sin(uTime * 2.9 + ph * 2.3));
    w.z += sw * 0.5 * sin(uTime * 1.7 + ph * 1.4 + 1.0);
  }
  vW = w.xyz; vN = n; vC = c; vUV = aUV; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SKY_VS = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const FS_HEAD = /* glsl */`
uniform float uPlace, uBare, uShow;
varying vec3 vW, vN, vC, vK;
varying vec2 vUV;
` + NOISE_GLSL + LAW_GLSL + LIGHT_GLSL;
const SOLID_BODY = /* glsl */`
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  // (rock is lit face by face, each face flat, so that a crag reads as rock and not as a soft mound)
  if (vK.x > 17.5 && vK.x < 18.5) { vec3 fn = normalize(cross(dFdx(vW), dFdy(vW))); N = normalize(mix(N, dot(fn, N) < 0.0 ? -fn : fn, 0.85)); }
  vec3 dir = normalize(vW - cameraPosition);
  vec3 alb = vC, emi = vec3(0.0);
  float gloss = 0.0, trans = 0.0, alpha = 1.0, airK = 1.0;
  float sv = sunSeen(uPlace, vW);
  surface(vK.x, vK.z, vUV, vW, sv, alb, gloss, emi, trans);
  vec3 col = shadeIt(uPlace, alb, N, vW, dir, sv, gloss, trans) + emi;
  // (great ice: where the low sun stands behind a thin edge, its light comes through clear green-blue)
  if (vK.x > 16.5 && vK.x < 17.5 && vK.z > 0.5) {
    vec3 sdI = placeLight(uPlace).sd;
    float thru = max(dot(dir, sdI), 0.0), thin = 1.0 - abs(dot(N, dir));
    col += vec3(0.10, 0.62, 0.56) * 1.5 * thru * thru * thru * thin * thin * (1.0 - max(dot(N, sdI), 0.0)) * sv;
  }
`;
// THE LAW, LAST IN EVERY SHADER: the fragment stands only where the far end of its sight line lies in the material's
// own place; its air is its own place's, over the part of the line that lies in that place.
const TAIL = /* glsl */`
  vec3 lawD = lawRay(vW - cameraPosition) * length(vW - cameraPosition);
  float lawT;
  float lawP = seenPlace(cameraPosition, lawD, 1.0, lawT);
  col = placeAir(uPlace, col, normalize(lawD), (1.0 - lawT) * length(lawD) * airK, cameraPosition + lawD * (0.5 + 0.5 * lawT));
  gl_FragColor = vec4(col, alpha);
  if (uBare < 0.5 && abs(lawP - uPlace) > 0.5) discard;
`;
const SKY_FS = /* glsl */`
varying vec3 vDir;
uniform float uShow;
` + NOISE_GLSL + LAW_GLSL + LIGHT_GLSL + /* glsl */`
void main(){
  vec3 d = lawRay(vDir);
  float px = length(fwidth(d)) * 0.7071;
  float tq;
  float pl = seenPlace(cameraPosition, d, 1.0e9, tq);
  gl_FragColor = vec4(skyOf(pl, d, px), 1.0);
  if (uShow > 0.5) gl_FragColor = vec4(lawShow(pl) * 0.45, 1.0);
}`;

// small lights and motes (fireflies, bees, dust): each a little disc that faces the eye, wandering about its own spot on
// the clock; never thinner than about a pixel and a half, and then no brighter
const SPARK_VS = /* glsl */`
attribute vec3 iPos;
attribute vec4 iSeed;
uniform float uTime, uSize, uWander, uBlink;
varying vec3 vW, vN, vC, vK;
varying vec2 vUV;
void main(){
  float t = uTime;
  vec3 c = iPos + uWander * vec3(sin(t * (0.31 + 0.4 * iSeed.x) + iSeed.y * 6.28), 0.45 * sin(t * (0.53 + 0.3 * iSeed.z) + iSeed.x * 6.28), cos(t * (0.27 + 0.4 * iSeed.y) + iSeed.z * 6.28));
  c += 0.22 * uWander * vec3(sin(t * 1.7 + iSeed.w * 9.0), sin(t * 2.3 + iSeed.x * 9.0), cos(t * 1.9 + iSeed.y * 9.0));
  float bl = mix(1.0, smoothstep(0.25, 0.8, sin(t * (0.9 + 1.2 * iSeed.w) + iSeed.z * 6.28)), uBlink);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float sz = uSize * (0.7 + 0.6 * iSeed.w), k = max(sz, length(c - cameraPosition) * 0.0016);
  vec3 w = c + (right * position.x + up * position.y) * k;
  vW = w; vN = vec3(0.0, 1.0, 0.0); vC = vec3(bl * sz * sz / (k * k)); vK = vec3(0.0); vUV = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const SPARK_BODY = /* glsl */`
  float r2 = dot(vUV, vUV), alpha = 1.0, airK = 0.0;
  vec3 col = uColor * exp(-r2 * 4.5) * step(r2, 1.0) * vC.x;
`;
const DOT_BODY = /* glsl */`
  float r2 = dot(vUV, vUV), airK = 1.0, alpha = smoothstep(1.0, 0.55, r2) * min(vC.x, 1.0);
  PL L = placeLight(uPlace);
  vec3 col = uColor * (L.sc * 0.5 * sunSeen(uPlace, vW) + L.sky);
`;
// small birds and winged things: one flat body with two wings that beat (aK.z: 0 at the shoulder, 1 at the wing's tip);
// the instance's colour carries its tint (r), its beat's phase (g, turns) and its beat's rate (b, beats in 20 s)
const BIRD_VS = /* glsl */`
attribute vec3 aC;
attribute vec2 aUV;
attribute vec3 aK;
uniform float uTime;
varying vec3 vW, vN, vC, vK;
varying vec2 vUV;
void main(){
  vec3 p = position, c = aC;
  float beat = 0.0;
#ifdef USE_INSTANCING_COLOR
  beat = sin(uTime * instanceColor.b * 20.0 + instanceColor.g * 6.2832);
  c *= instanceColor.r;
#endif
  p.y += aK.z * (0.42 * beat - 0.10 * aK.z);
  p.x *= 1.0 - 0.22 * aK.z * abs(beat);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 1.0, 0.0)); vC = c; vUV = aUV; vK = vec3(0.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// the ring's ice blocks: each turns slowly where it stands, about an axis of its own (the instance's colour carries its
// tint in r, its turning in g: rate and axis, and in b how far it drifts to and fro along the ring's arcs)
const ICE_VS = /* glsl */`
attribute vec3 aC;
attribute vec2 aUV;
attribute vec3 aK;
uniform float uTime;
varying vec3 vW, vN, vC, vK;
varying vec2 vUV;
void main(){
  vec3 p = position, n = normal, c = aC;
  float g = 0.5, dr = 0.0;
#ifdef USE_INSTANCING_COLOR
  c *= instanceColor.r; g = instanceColor.g; dr = instanceColor.b;
#endif
  // (a block frozen into the pack ice carries -1 in blue: it neither turns nor drifts)
  float run = step(-0.5, dr);
  dr = max(dr, 0.0);
  float sg = fract(g * 7.0), an = run * uTime * (0.05 + 0.22 * fract(g * 13.0)) * (sg < 0.5 ? 1.0 : -1.0) + g * 40.0;
  vec3 ax = normalize(vec3(cos(g * 19.0), 0.35 + sin(g * 31.0), sin(g * 19.0)));
  float ca = cos(an), sa = sin(an);
  p = p * ca + cross(ax, p) * sa + ax * dot(ax, p) * (1.0 - ca);
  n = n * ca + cross(ax, n) * sa + ax * dot(ax, n) * (1.0 - ca);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  n = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  float ph = uTime * (0.07 + 0.08 * fract(g * 5.0)) + g * 90.0;
  w.xz += vec2(-0.087, 0.996) * dr * sin(ph);
  w.y += 0.12 * dr * sin(ph * 1.3 + 1.0);
  vW = w.xyz; vN = n; vC = c; vUV = aUV; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export function makeKit(ctx) {
  const rare = !!(ctx.vary && ctx.vary.rare);
  const U = { uTime: { value: 0 }, uRare: { value: rare ? 1 : 0 }, uBare: { value: 0 }, uShow: { value: 0 }, uDeal: { value: new THREE.Vector4(2.5, 0.31, 0, 0) }, uCloudAc: { value: new THREE.Vector4(-1e4, -1e4, -1e4, -1e4) }, uVP: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const blank = new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(-100)]), 1, 1, THREE.RedFormat, THREE.HalfFloatType);
  blank.needsUpdate = true;
  const shade = [0, 1, 2, 3].map(() => ({ tShade: { value: blank }, uShadeBox: { value: new THREE.Vector4(0, 0, 1, 1) } }));
  const mats = [];
  // o.body: GLSL that declares col (vec3), alpha and airK (floats); o.defs: functions it needs; o.vertex: its own vertex
  // shader (it must write vW); o.uniforms: more uniforms
  function mat(place, o = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uPlace: { value: place }, tShade: shade[place].tShade, uShadeBox: shade[place].uShadeBox, ...(o.uniforms || {}) },
      vertexShader: o.vertex || BODY_VS,
      fragmentShader: FS_HEAD + (o.defs || '') + '\nvoid main(){\n' + (o.body || SOLID_BODY) + TAIL + (o.transparent ? '  if (uShow > 0.5) discard;\n' : '  if (uShow > 0.5) gl_FragColor = vec4(lawShow(uPlace), 1.0);\n') + '}',
      side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? !o.transparent,
      blending: o.blending ?? THREE.NormalBlending,
    });
    m.userData.law = true; m.userData.place = place; m.name = o.tag || o.name || 'place' + place;
    mats.push(m);
    return m;
  }
  // the four skies are one dome: each of its pixels asks the law in which place its view ray ends and draws that sky
  function sky() {
    const m = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthTest: false, depthWrite: false });
    m.userData.law = true; m.userData.place = -1; m.name = 'skies';
    mats.push(m);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), m);
    mesh.frustumCulled = false; mesh.renderOrder = -10; mesh.name = 'skies';
    return mesh;
  }
  function check(scene) {
    const bad = [];
    scene.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!m || !m.userData || !m.userData.law) bad.push(o.name || o.type);
    });
    if (bad.length) throw new Error('boathouse: a mesh without the law: ' + bad.slice(0, 5).join(', '));
  }
  // sparks(place, spots, o): spots [[x, y, z], ...]; o.color (linear, three numbers), o.size (m), o.wander (m), o.blink (0..1)
  const quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  function sparks(place, spots, o, rnd) {
    const g = new THREE.InstancedBufferGeometry(), n = spots.length, ip = new Float32Array(n * 3), is = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { ip.set(spots[i], i * 3); for (let k = 0; k < 4; k++) is[i * 4 + k] = rnd(); }
    g.setAttribute('position', new THREE.BufferAttribute(quad, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 3));
    g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(is, 4));
    g.instanceCount = n;
    const m = mat(place, { vertex: SPARK_VS, body: o.dot ? DOT_BODY : SPARK_BODY, defs: 'uniform vec3 uColor;\n', transparent: true, depthWrite: false, blending: o.dot ? THREE.NormalBlending : THREE.AdditiveBlending, side: THREE.DoubleSide, tag: o.tag || 'sparks',
      uniforms: { uColor: { value: new THREE.Vector3(...o.color) }, uSize: { value: o.size }, uWander: { value: o.wander ?? 0.6 }, uBlink: { value: o.blink ?? 0 } } });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.name = o.tag || 'sparks'; mesh.userData.kind = 'medium';
    return mesh;
  }
  const bird = [0, 1, 2, 3].map((p) => mat(p, { vertex: BIRD_VS, side: THREE.DoubleSide, name: 'winged' + p }));
  const solid = [0, 1, 2, 3].map((p) => mat(p, { name: 'solid' + p }));
  const solid2 = [0, 1, 2, 3].map((p) => mat(p, { name: 'solid2s' + p, side: THREE.DoubleSide }));
  const ice = mat(3, { vertex: ICE_VS, tag: 'ice blocks' });
  return { U, shade, mat, sky, check, sparks, bird, solid, solid2, ice, mats, rare };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE GEOMETRY BUILDER: merged, indexed geometry with the attributes the solid shader reads (aC colour, aUV metres on
// the face, aK = kind, sway reach in metres, an extra figure of the kind).
// ---------------------------------------------------------------------------------------------------------------------
export const KIND = { PLAIN: 0, BOARDS: 1, TURF: 2, STONE: 3, BRICK: 4, YEW: 5, GRAVEL: 6, LAWN: 7, SOIL: 8, PANE: 9, LIT: 10, LEAVES: 11, FLAGS: 12, HILL: 13, BARK: 14, PETAL: 15, GLOW: 16, ICE: 17, ROCK: 18, JET: 19, BED: 20, FLASH: 21, NET: 22, RING: 23, SAIL: 24, WINDOWS: 25, FLOE: 26, BOX: 27, BOXLAMP: 28 };
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _m3 = new THREE.Matrix3();
export class Bld {
  constructor() {
    this.P = []; this.N = []; this.C = []; this.UV = []; this.K = []; this.I = [];
    this.col = [1, 1, 1]; this.kind = 0; this.sway = 0; this.ex = 0; this.m = null; this.stack = [];
  }
  get tris() { return this.I.length / 3; }
  // paint for what follows: colour (three numbers, linear), kind, the kind's extra figure, sway reach
  c(col, kind = 0, ex = 0, sway = 0) { this.col = col; this.kind = kind; this.ex = ex; this.sway = sway; return this; }
  push(m) { this.stack.push(this.m); this.m = this.m ? this.m.clone().multiply(m) : m.clone(); _m3.setFromMatrix4(this.m); this.nm = _m3.clone(); return this; }
  pop() { this.m = this.stack.pop() || null; if (this.m) { _m3.setFromMatrix4(this.m); this.nm = _m3.clone(); } return this; }
  v(x, y, z, nx, ny, nz, u, w, sway = this.sway, col = this.col) {
    if (this.m) { _p.set(x, y, z).applyMatrix4(this.m); _n.set(nx, ny, nz).applyMatrix3(this.nm).normalize(); x = _p.x; y = _p.y; z = _p.z; nx = _n.x; ny = _n.y; nz = _n.z; }
    this.P.push(x, y, z); this.N.push(nx, ny, nz); this.C.push(col[0], col[1], col[2]); this.UV.push(u, w); this.K.push(this.kind, sway, this.ex);
    return this.P.length / 3 - 1;
  }
  // a, b, c, d counter-clockwise seen from the front; uv runs in metres from a along ab (u) and ad (v), from (u0, v0)
  quad(a, b, c, d, u0 = 0, v0 = 0, sw = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
    const s = sw || [this.sway, this.sway, this.sway, this.sway];
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, u0, v0, s[0]), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, u0 + lu, v0, s[1]);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, u0 + lu, v0 + lv, s[2]), i3 = this.v(d[0], d[1], d[2], nx, ny, nz, u0, v0 + lv, s[3]);
    this.I.push(i0, i1, i2, i0, i2, i3);
    return this;
  }
  tri(a, b, c, sw = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lu = Math.hypot(ux, uy, uz) || 1, s = sw || [this.sway, this.sway, this.sway];
    const du = (vx * ux + vy * uy + vz * uz) / lu, dv = Math.sqrt(Math.max(0, vx * vx + vy * vy + vz * vz - du * du));
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, 0, 0, s[0]), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, lu, 0, s[1]), i2 = this.v(c[0], c[1], c[2], nx, ny, nz, du, dv, s[2]);
    this.I.push(i0, i1, i2);
    return this;
  }
  // an upright box; skip: letters of faces to leave out (x X y Y z Z: the low and the high face on each axis)
  box(x0, y0, z0, x1, y1, z1, skip = '') {
    if (!skip.includes('Z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], x0, y0);
    if (!skip.includes('z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], -x1, y0);
    if (!skip.includes('X')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], -z1, y0);
    if (!skip.includes('x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], z0, y0);
    if (!skip.includes('Y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], x0, -z1);
    if (!skip.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], x0, z0);
    return this;
  }
  // an upright frustum about (cx, cz) from y0 to y1; caps: 'Y' top, 'y' bottom; swTop: sway reach at the top
  cyl(cx, cz, r0, r1, y0, y1, seg = 10, caps = 'Y', swTop = this.sway, a0 = 0, a1 = Math.PI * 2) {
    const base = this.P.length / 3, sl = (r0 - r1) / Math.max(1e-6, y1 - y0);
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (a1 - a0) * i / seg, cs = Math.cos(a), sn = Math.sin(a), nl = Math.hypot(1, sl);
      this.v(cx + cs * r0, y0, cz + sn * r0, cs / nl, sl / nl, sn / nl, a * (r0 + r1) * 0.5, y0, this.sway);
      this.v(cx + cs * r1, y1, cz + sn * r1, cs / nl, sl / nl, sn / nl, a * (r0 + r1) * 0.5, y1, swTop);
    }
    for (let i = 0; i < seg; i++) { const k = base + i * 2; this.I.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    for (const cap of caps) {
      const top = cap === 'Y', y = top ? y1 : y0, r = top ? r1 : r0, c0 = this.v(cx, y, cz, 0, top ? 1 : -1, 0, 0, 0, top ? swTop : this.sway), b2 = this.P.length / 3;
      for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; this.v(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 0, top ? 1 : -1, 0, Math.cos(a) * r, Math.sin(a) * r, top ? swTop : this.sway); }
      for (let i = 0; i < seg; i++) { if (top) this.I.push(c0, b2 + i + 1, b2 + i); else this.I.push(c0, b2 + i, b2 + i + 1); }
    }
    return this;
  }
  // a round tube along points (a rope, a bough, a rail); r: radius or a function of the share along it
  tube(pts, r, seg = 6, swFn = null) {
    const base = this.P.length / 3, n = pts.length, rf = typeof r === 'function' ? r : () => r;
    let len = 0;
    const t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n - 1, i + 1)];
      t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(t.y) > 0.92) up.set(1, 0, 0);
      a.crossVectors(t, up).normalize(); b.crossVectors(a, t).normalize();
      if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      const rr = rf(i / (n - 1)), sw = swFn ? swFn(i / (n - 1)) : this.sway;
      for (let j = 0; j <= seg; j++) {
        const an = j / seg * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), nx = a.x * cs + b.x * sn, ny = a.y * cs + b.y * sn, nz = a.z * cs + b.z * sn;
        this.v(p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr, nx, ny, nz, an * rr, len, sw);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const k = base + i * (seg + 1) + j; this.I.push(k, k + seg + 1, k + seg + 2, k, k + seg + 2, k + 1); }
    return this;
  }
  // a rounded mass (a crown, a clipped ball, a stone): an ellipsoid whose skin is pushed in and out by bump(x, y, z) -> -1..1
  blob(cx, cy, cz, rx, ry, rz, seg = 10, rings = 7, bump = null, amp = 0, swTop = this.sway) {
    const base = this.P.length / 3;
    for (let j = 0; j <= rings; j++) {
      const ph = -Math.PI / 2 + Math.PI * j / rings, cp = Math.cos(ph), sp = Math.sin(ph);
      for (let i = 0; i <= seg; i++) {
        const th = i / seg * Math.PI * 2, x = cp * Math.cos(th), z = cp * Math.sin(th), y = sp;
        const k = 1 + (bump ? amp * bump(cx + x * rx, cy + y * ry, cz + z * rz) : 0);
        const nl = Math.hypot(x / rx, y / ry, z / rz) || 1;
        this.v(cx + x * rx * k, cy + y * ry * k, cz + z * rz * k, x / rx / nl, y / ry / nl, z / rz / nl, th * (rx + rz) * 0.5, (y + 1) * ry, this.sway + (swTop - this.sway) * (y * 0.5 + 0.5));
      }
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const k = base + j * (seg + 1) + i; this.I.push(k, k + seg + 1, k + seg + 2, k, k + seg + 2, k + 1); }
    return this;
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.P), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.N), 3));
    g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(this.C), 3));
    g.setAttribute('aUV', new THREE.BufferAttribute(new Float32Array(this.UV), 2));
    g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(this.K), 3));
    const n = this.P.length / 3;
    g.setIndex(new THREE.BufferAttribute(n > 65535 ? new Uint32Array(this.I) : new Uint16Array(this.I), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  mesh(material, name) { const m = new THREE.Mesh(this.geo(), material); m.name = name || ''; return m; }
}
// a flat convex face through points (counter-clockwise seen from the front), its normal given, uv by a function of the point
Bld.prototype.face = function (pts, n, uvOf) {
  const ix = pts.map((p) => { const uv = uvOf(p); return this.v(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1]); });
  for (let i = 1; i < pts.length - 1; i++) this.I.push(ix[0], ix[i], ix[i + 1]);
  return this;
};

// a small winged thing (a swift, a swallow, a dove, a butterfly): span 1, nose toward +z; fork: a forked tail; wide: broad wings
export function wingedGeo(col, o = {}) {
  const b = new Bld(), wz = o.wide ? 0.30 : 0.16, tipz = o.wide ? -0.05 : -0.20;
  b.c(col, 0);
  const put = (x, y, z, k) => { b.ex = k; return b.v(x, y, z, 0, 1, 0, x, z); };
  const n = put(0, 0, 0.26, 0), l = put(-0.05, 0, 0.02, 0), r = put(0.05, 0, 0.02, 0), t = put(0, 0, -0.26, 0);
  b.I.push(n, r, l, l, r, t);
  if (o.fork) { const a = put(-0.09, 0, -0.42, 0), c = put(0.09, 0, -0.42, 0), q = put(0, 0, -0.2, 0); b.I.push(q, a, t, q, t, c); }
  for (const s of [-1, 1]) { const a = put(s * 0.04, 0, wz * 0.5, 0), c = put(s * 0.04, 0, -wz * 0.5, 0), e = put(s * 0.5, 0, tipz, 1), m = put(s * 0.26, 0, wz * 0.45 + tipz * 0.3, 0.5); b.I.push(a, m, c, m, e, c); }
  return b.geo();
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BLUE POLICE BOX (round four; the names in the code still say hut, and each means the box). One builder function
// for all four (lake, garden, sea, ring): the same body at the same size by construction. Its own frame: the door's
// plane (the crossing's plane; in the last box the way out's) is z = 0, the doorway looks along +z, y = 0 is its
// water line, x = 0 the doorway's middle.
// THE BODY is square, 8.5 m wide (x -4.25 to 4.25), from its front face at z 3.4 back to z -5.1, on a low plinth
// 0.45 m wider all round (HUT.hw, 4.7: the breadth the box's ground takes). Four corner posts 0.8 m square stand
// 0.12 m proud of the walls. Each face holds two tall leaves side by side, each with four panels one over another:
// the top one a window of six small panes (two rows of three) that glow pale, the three under it sunk solid panels.
// Over the leaves on every face a sign band: a black box with a clean pale strip that glows (no letter, no mark).
// The roof: a cornice, two shallow square tiers stepping in, a low pyramid, and on it a small round lamp, 17.45 m
// over the water line (2.05 times the body's width), which pulses slowly on the world's clock on a dealt phase.
// THE DOORWAY is a rectangle 6.4 m wide (0.75 of the body's width), its foot 0.5 m under the water line (the
// water or the ice runs in at the doorstep: the plinth is open across it), its head 12.8 m over it (12.3 m over
// the plinth: 1.45 times the body's width). BOTH DOORS STAND OPEN INWARD, flat against the two sides of the
// doorway's depth: the 3.4 m from the box's front face in to the door's plane. So they stand BEFORE the plane and
// are drawn, their panelled outer faces toward the doorway's middle (the left door bears a small pale plaque,
// blank, on its second panel from the top; the right door a small dark handle). Their faces and the head's soffit
// stand a millimetre inside the outline, so the edge one sees is the doors' own. Behind the plane NOTHING of the
// box is built (no room): at a crossing the next place stands there by the law; in the last box (o.inside) a plain
// dark recess, HUT.inside deep (2.7 m: the line's end keeps its clear air of it), stands behind the engine's way out.
// HUT: hw, the plinth's half breadth; w, the body's; front and back, the body's front and back face (z); plinth,
// the plinth's top; post and proud, the corner posts; head, the doorway's head; top, the body's top under the
// cornice; peak, the lamp's top; r, half the doorway; foot, the outline's foot; mid, the height of the line's end
// in the last box's doorway (as it was: the line is unchanged).
// ---------------------------------------------------------------------------------------------------------------------
export const HUT = { hw: 4.7, w: 4.25, front: 3.4, back: -5.1, plinth: 0.5, post: 0.8, proud: 0.12, head: 12.8, top: 14.3, peak: 17.45, r: 3.2, foot: -0.5, mid: 3.15, inside: 2.7 };
// the roof's steps (cz: the middle of the body's depth): the cornice, the two tiers and the pyramid, each by its half
// breadth and the height of its top; the lamp's radius and the height of its glass
const BOX_ROOF = { cz: (HUT.front + HUT.back) / 2, cornice: [HUT.w + 0.07, HUT.top + 0.2], tier1: [4.0, HUT.top + 0.65], tier2: [3.6, HUT.top + 1.05], pyr: [3.45, 0.5, HUT.top + 1.85], lamp: [0.45, HUT.top + 2.1, HUT.top + 2.75] };
// the box's plan in its own frame, plinth and all (the name is the hut's: the world's clouds keep off it, cloudLanes,
// and the last floe bears it)
export function hutRoofPlan() {
  const e = HUT.hw - HUT.w;
  return { x0: -HUT.hw, x1: HUT.hw, z0: HUT.back - e, z1: HUT.front + e };
}
// the height of the box's top over a point of its plan, in its own frame (for the places' shadow maps): -100 off it
export function hutTopAt(x, z) {
  const R = BOX_ROOF, P = hutRoofPlan(), m = Math.max(Math.abs(x), Math.abs(z - R.cz));
  if (x < P.x0 || x > P.x1 || z < P.z0 || z > P.z1) return -100;
  if (m > HUT.w + 0.3) return HUT.plinth;
  if (m > R.tier1[0]) return R.cornice[1];
  if (m > R.tier2[0]) return R.tier1[1];
  if (m > R.pyr[0]) return R.tier2[1];
  if (m > R.pyr[1]) return R.tier2[1] + (R.pyr[2] - R.tier2[1]) * (R.pyr[0] - m) / (R.pyr[0] - R.pyr[1]);
  return m > R.lamp[0] ? R.pyr[2] : HUT.peak - 0.15;
}
// the box's blue as its paint's own colour (the shader, KIND.BOX, adds grain, wear and the paint's own light), the
// black of the sign band, and the pale glows: the windows' frosted panes, the sign's strip, the plaque, the lamp
const BLUE = [0.004, 0.085, 0.300], SIGN_BLACK = [0.010, 0.010, 0.013], PANE_GLOW = [0.49, 0.68, 1.14], STRIP_GLOW = [1.16, 1.44, 2.32], PLAQUE = [0.40, 0.43, 0.46], LAMP_GLOW = [0.62, 0.93, 1.80];
const k3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// ONE LEAF, in its own frame (x across it from 0 to lw, y up from 0 to lh, z out of its face): stiles and rails in the
// face's plane, four panels sunk into it, the top one the window. hinge: 'l' or 'r', the side of its hinge (the
// meeting stile is the other, a little narrower); o.plaque, o.handle: the left door's plaque, the right door's handle
function boxLeaf(b, M, lw, lh, hinge, o = {}) {
  const sH = 0.30, sM = 0.25, sl = hinge === 'l' ? sH : sM, sr = hinge === 'l' ? sM : sH, rb = 0.45, rm = 0.32, rt = 0.35, hp = (lh - rb - rt - 3 * rm) / 4, dp = 0.10;
  const x0 = sl, x1 = lw - sr, uv = (p) => [p[0], p[1]];
  b.push(M);
  b.c(BLUE, KIND.BOX);
  b.face([[0, 0, 0], [lw, 0, 0], [lw, rb, 0], [0, rb, 0]], [0, 0, 1], uv);
  for (let i = 0; i < 4; i++) {
    const ya = rb + i * (hp + rm), yb = ya + hp, yc = i < 3 ? yb + rm : lh;
    b.c(BLUE, KIND.BOX);
    b.face([[0, ya, 0], [x0, ya, 0], [x0, yb, 0], [0, yb, 0]], [0, 0, 1], uv);
    b.face([[x1, ya, 0], [lw, ya, 0], [lw, yb, 0], [x1, yb, 0]], [0, 0, 1], uv);
    b.face([[0, yb, 0], [lw, yb, 0], [lw, yc, 0], [0, yc, 0]], [0, 0, 1], uv);
    // the sink: four sloped sides (darker), then its floor: a solid panel, or the window's panes with their bars
    const xa = x0 + dp, xb = x1 - dp, yd = ya + dp, ye = yb - dp;
    b.c(k3(BLUE, 0.55), KIND.BOX);
    b.quad([x0, ya, 0], [x1, ya, 0], [xb, yd, -dp], [xa, yd, -dp]);
    b.quad([x1, ya, 0], [x1, yb, 0], [xb, ye, -dp], [xb, yd, -dp]);
    b.quad([x1, yb, 0], [x0, yb, 0], [xa, ye, -dp], [xb, ye, -dp]);
    b.quad([x0, yb, 0], [x0, ya, 0], [xa, yd, -dp], [xa, ye, -dp]);
    if (i < 3) {
      b.c(k3(BLUE, 0.78), KIND.BOX);
      b.face([[xa, yd, -dp], [xb, yd, -dp], [xb, ye, -dp], [xa, ye, -dp]], [0, 0, 1], uv);
      if (i === 2 && o.plaque) {
        const cx = (xa + xb) / 2, cy = (yd + ye) / 2;
        b.c(PLAQUE, KIND.GLOW, 1.0);
        b.face([[cx - 0.75, cy - 0.5, -dp + 0.012], [cx + 0.75, cy - 0.5, -dp + 0.012], [cx + 0.75, cy + 0.5, -dp + 0.012], [cx - 0.75, cy + 0.5, -dp + 0.012]], [0, 0, 1], uv);
      }
    } else {
      b.c(PANE_GLOW, KIND.GLOW, 1.0);
      b.face([[xa, yd, -dp], [xb, yd, -dp], [xb, ye, -dp], [xa, ye, -dp]], [0, 0, 1], uv);
      const bw = 0.05, zb = -dp + 0.02;
      b.c(k3(BLUE, 1.15), KIND.BOX);
      for (const q of [1 / 3, 2 / 3]) { const x = xa + (xb - xa) * q; b.face([[x - bw, yd, zb], [x + bw, yd, zb], [x + bw, ye, zb], [x - bw, ye, zb]], [0, 0, 1], uv); }
      const ym = (yd + ye) / 2;
      b.face([[xa, ym - bw, zb], [xb, ym - bw, zb], [xb, ym + bw, zb], [xa, ym + bw, zb]], [0, 0, 1], uv);
    }
  }
  if (o.handle) {
    // (on the meeting stile, a little under the leaf's middle)
    const hx = hinge === 'l' ? lw - sM / 2 : sM / 2, hy = lh * 0.44;
    b.c([0.02, 0.02, 0.024], KIND.PLAIN);
    b.box(hx - 0.045, hy - 0.22, 0, hx + 0.045, hy + 0.22, 0.08, 'z');
  }
  b.pop();
}
export function buildHut(b, o = {}) {
  const H = HUT, w = H.w, hw = H.hw, zF = H.front, zB = H.back, pw = H.post, pr = H.proud, y0 = H.plinth, yh = H.head, yt = H.top, rIn = H.r - 0.001, yb = -0.75;
  const R = BOX_ROOF, cz = R.cz, e = hw - w, wi = w - pw, zw = o.inside ? -H.inside : 0, uvF = (p) => [p[0], p[1]];
  const X = (x, y, z) => new THREE.Vector3(x, y, z), frame = (ax, az, ox, oy, oz) => new THREE.Matrix4().makeBasis(ax, X(0, 1, 0), az).setPosition(ox, oy, oz);
  // THE PLINTH, open across the doorway: a block either side of it (their faces toward the doorway are the jambs'
  // feet, a millimetre inside the outline) and one along the back
  b.c(k3(BLUE, 0.6), KIND.BOX);
  b.box(-hw, yb, zB - e, -rIn, y0, zF + e, 'y');
  b.box(rIn, yb, zB - e, hw, y0, zF + e, 'y');
  b.box(-rIn, yb, zB - e, rIn, y0, zB + pw, 'yxX');
  // THE FOUR CORNER POSTS, proud of the walls
  b.c(k3(BLUE, 1.08), KIND.BOX);
  for (const sx of [-1, 1]) for (const z of [zF - pw, zB]) b.box(sx > 0 ? wi : -w, y0, z, sx > 0 ? w : -wi, yt, z + pw, 'yY');
  // THE THREE CLOSED FACES (the right flank, the back, the left flank): two leaves each between the posts, the wall
  // over them, the sign band on it. (ax: the face's own level axis; az: its outward normal; o: its middle at the plinth)
  const lh = yh - y0;
  const faces = [[X(0, 0, -1), X(1, 0, 0), [w - pr, y0, cz]], [X(-1, 0, 0), X(0, 0, -1), [0, y0, zB + pr]], [X(0, 0, 1), X(-1, 0, 0), [-(w - pr), y0, cz]], [X(1, 0, 0), X(0, 0, 1), [0, y0, zF - pr]]];
  faces.forEach(([ax, az, c], fi) => {
    const M = frame(ax, az, c[0], c[1], c[2]), front = fi === 3;
    if (!front) {
      boxLeaf(b, frame(ax, az, c[0] - ax.x * wi, c[1], c[2] - ax.z * wi), wi, lh, 'l');
      boxLeaf(b, M, wi, lh, 'r');
    }
    b.push(M);
    // (the front: the wall's two strips beside the doorway, and the wall over its head, from a millimetre under it)
    b.c(BLUE, KIND.BOX);
    if (front) for (const s of [-1, 1]) b.face(s > 0 ? [[rIn, 0, 0], [wi, 0, 0], [wi, lh, 0], [rIn, lh, 0]] : [[-wi, 0, 0], [-rIn, 0, 0], [-rIn, lh, 0], [-wi, lh, 0]], [0, 0, 1], uvF);
    const ya = front ? lh - 0.001 : lh, yc = yt - y0;
    b.face([[-wi, ya, 0], [wi, ya, 0], [wi, yc, 0], [-wi, yc, 0]], [0, 0, 1], uvF);
    // THE SIGN BAND: a black box 0.3 m proud, a clean pale strip that glows along its face (no letter, no mark)
    const sa = lh + 0.2, sb = yc - 0.2, sx = wi - 0.15, sd = 0.3;
    b.c(SIGN_BLACK, KIND.PLAIN);
    b.box(-sx, sa, 0, sx, sb, sd, 'z');
    b.c(STRIP_GLOW, KIND.GLOW, 1.0);
    b.face([[-sx + 0.3, sa + 0.27, sd + 0.006], [sx - 0.3, sa + 0.27, sd + 0.006], [sx - 0.3, sb - 0.27, sd + 0.006], [-sx + 0.3, sb - 0.27, sd + 0.006]], [0, 0, 1], uvF);
    b.pop();
  });
  // THE DOORWAY'S DEPTH: the two doors folded in against its sides (the left one hinged at the front, its face
  // toward +x; the right one's toward -x), a strip at each hinge, the head's soffit; all a millimetre inside the outline
  const dl = H.r, zh = zF - pr;
  boxLeaf(b, frame(X(0, 0, -1), X(1, 0, 0), -rIn, y0, dl), dl, lh - 0.001, 'l', { plaque: true });
  boxLeaf(b, frame(X(0, 0, 1), X(-1, 0, 0), rIn, y0, 0), dl, lh - 0.001, 'r', { handle: true });
  b.c(BLUE, KIND.BOX);
  for (const s of [-1, 1]) { const x = s * rIn; b.quad(s > 0 ? [x, y0, dl] : [x, y0, zh], s > 0 ? [x, y0, zh] : [x, y0, dl], s > 0 ? [x, yh - 0.001, zh] : [x, yh - 0.001, dl], s > 0 ? [x, yh - 0.001, dl] : [x, yh - 0.001, zh], 0, y0); }
  b.c(k3(BLUE, 0.8), KIND.BOX);
  b.quad([-rIn, yh - 0.001, 0], [rIn, yh - 0.001, 0], [rIn, yh - 0.001, zh], [-rIn, yh - 0.001, zh]);
  // (the last box: the dark inside behind the way out, where the engine's shape does not fill the doorway: a plain
  // dark recess from the doorway's plane back H.inside, its floor, sides, head and back; no room, nothing in it)
  if (o.inside) {
    const yf = 0.02, yc = yh - 0.001;
    b.c([0.0035, 0.0045, 0.008], KIND.PLAIN);
    b.quad([-rIn, yb, zw], [rIn, yb, zw], [rIn, yc, zw], [-rIn, yc, zw]);
    b.quad([-rIn, yf, 0], [rIn, yf, 0], [rIn, yf, zw], [-rIn, yf, zw]);
    b.quad([-rIn, yc, zw], [rIn, yc, zw], [rIn, yc, 0], [-rIn, yc, 0]);
    b.quad([-rIn, yb, 0], [-rIn, yb, zw], [-rIn, yc, zw], [-rIn, yc, 0]);
    b.quad([rIn, yb, zw], [rIn, yb, 0], [rIn, yc, 0], [rIn, yc, zw]);
  }
  // THE ROOF: the cornice, two shallow tiers stepping in, the low pyramid, the lamp
  b.c(k3(BLUE, 0.95), KIND.BOX);
  b.box(-R.cornice[0], yt, zB - 0.07, R.cornice[0], R.cornice[1], zF + 0.07);
  b.box(-R.tier1[0], R.cornice[1], cz - R.tier1[0], R.tier1[0], R.tier1[1], cz + R.tier1[0], 'y');
  b.box(-R.tier2[0], R.tier1[1], cz - R.tier2[0], R.tier2[0], R.tier2[1], cz + R.tier2[0], 'y');
  const pa = R.pyr[0], pb = R.pyr[1], py0 = R.tier2[1], py1 = R.pyr[2];
  b.c(k3(BLUE, 0.9), KIND.BOX);
  b.quad([-pa, py0, cz + pa], [pa, py0, cz + pa], [pb, py1, cz + pb], [-pb, py1, cz + pb]);
  b.quad([pa, py0, cz - pa], [-pa, py0, cz - pa], [-pb, py1, cz - pb], [pb, py1, cz - pb]);
  b.quad([pa, py0, cz + pa], [pa, py0, cz - pa], [pb, py1, cz - pb], [pb, py1, cz + pb]);
  b.quad([-pa, py0, cz - pa], [-pa, py0, cz + pa], [-pb, py1, cz + pb], [-pb, py1, cz - pb]);
  b.quad([-pb, py1, cz + pb], [pb, py1, cz + pb], [pb, py1, cz - pb], [-pb, py1, cz - pb]);
  b.cyl(0, cz, R.lamp[0], 0.42, py1, R.lamp[1], 12, 'Y');
  b.c(LAMP_GLOW, KIND.BOXLAMP, o.phase || 0);
  b.cyl(0, cz, 0.33, 0.33, R.lamp[1], R.lamp[2], 12, '');
  b.c(k3(BLUE, 0.95), KIND.BOX);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785; b.tube([[0.365 * Math.cos(a), R.lamp[1], cz + 0.365 * Math.sin(a)], [0.365 * Math.cos(a), R.lamp[2], cz + 0.365 * Math.sin(a)]], 0.028, 4); }
  b.cyl(0, cz, 0.43, 0.27, R.lamp[2], R.lamp[2] + 0.22, 12, 'Yy');
  b.cyl(0, cz, 0.10, 0.06, R.lamp[2] + 0.22, H.peak, 6, 'Y');
  return b;
}

// THE JETTY along the box's east side (a plank landing: it stood by the boat hut and stays), reaching 12 m out before
// the door's plane, with its small things: rope fenders, a coiled rope, a bucket (round four: the oar that leaned on
// the hut's wall is gone with the hut). In the box's own frame.
const TAR2 = [0.34, 0.22, 0.13];
// THE JETTY'S PLAN in the hut's own frame, and the rope fenders' blobs over its outer side (how far out from its edge,
// their radius): buildJetty lays every jetty by these figures, and the world reads them by name (cloudLanes, and
// what the last floe bears, LAST_BEARS)
export const JETTY_PLAN = (() => { const x0 = HUT.hw + 0.25; return { x0, x1: x0 + 1.8, z0: -9, z1: 12 }; })();
export const FENDER = { out: 0.15, r: 0.12 };
export function buildJetty(b, rng, lantern = true) {
  const { x0, x1, z0, z1 } = JETTY_PLAN, y = 0.55;
  b.c([0.110, 0.085, 0.066], KIND.BOARDS);
  b.face([[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, 1, 0], (p) => [p[2], p[0]]);
  b.c(TAR2, KIND.BOARDS);
  b.box(x0, y - 0.22, z0, x0 + 0.12, y - 0.001, z1, 'Y');
  b.box(x1 - 0.12, y - 0.22, z0, x1, y - 0.001, z1, 'Y');
  b.quad([x0, y - 0.07, z1], [x1, y - 0.07, z1], [x1, y, z1], [x0, y, z1]);
  b.c([0.075, 0.058, 0.046], KIND.BARK);
  for (let z = z1 - 0.3, i = 0; z > z0; z -= 3.05, i++) {
    for (const x of [x0 + 0.02, x1 - 0.02]) b.cyl(x, z, 0.12, 0.105, -1.9, x > x0 + 1 && i % 2 === 0 ? 1.45 : 0.62, 7, 'Y');
  }
  // three rope fenders hung over the jetty's outer side on their lanyards (round three, the lead's C4), the rope's
  // coil, the bucket. rng is the fenders' own stream (the world names one for each hut's jetty):
  // a place and a drop for each fender, and nothing else of the jetty draws.
  for (let i = 0; i < 3; i++) {
    const z = 1.6 + 3.4 * i + 0.5 * rng(), top = y - 0.06 - 0.08 * rng(), len = 0.42;
    b.c([0.30, 0.23, 0.15], KIND.BARK);
    b.tube([[x1 - 0.25, y + 0.02, z], [x1 + 0.02, y + 0.05, z], [x1 + 0.13, top + 0.05, z]], 0.018, 4);
    b.c([0.40, 0.31, 0.20], KIND.NET);
    b.blob(x1 + FENDER.out, top - len / 2, z, FENDER.r, len / 2, FENDER.r, 7, 5);
  }
  b.c([0.42, 0.36, 0.25], KIND.PLAIN);
  const coil = [];
  for (let i = 0; i <= 44; i++) { const a = i * 0.62, r = 0.34 - 0.0035 * i; coil.push([x1 - 0.55 + Math.cos(a) * r, y + 0.04 + i * 0.0042, 6.3 + Math.sin(a) * r]); }
  b.tube(coil, 0.035, 5);
  b.c([0.20, 0.22, 0.24], KIND.PLAIN);
  b.cyl(x0 + 0.5, -1.2, 0.13, 0.17, y, y + 0.32, 9, 'y');
  // THE LANTERN, hung low on the end post's arm (the same on the three huts that have one; never on the lake's): an
  // iron arm, a small cage of four bars with a cap and a foot, the flame within (its light on what stands round it is
  // lampGlow's, by place)
  if (!lantern) return { x0, x1, z0, z1, y };
  const [lx, ly, lz] = LAMP;
  b.c([0.035, 0.035, 0.04], KIND.PLAIN);
  b.tube([[x1 - 0.02, 1.42, z1 - 0.3], [lx, 1.50, lz - 0.2], [lx, 1.48, lz]], 0.022, 4);
  b.tube([[lx, 1.48, lz], [lx, ly + 0.2, lz]], 0.012, 3);
  b.cyl(lx, lz, 0.11, 0.035, ly + 0.14, ly + 0.21, 6, 'Y');
  b.cyl(lx, lz, 0.10, 0.10, ly - 0.17, ly - 0.14, 6, 'Yy');
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785; b.tube([[lx + 0.095 * Math.cos(a), ly - 0.14, lz + 0.095 * Math.sin(a)], [lx + 0.095 * Math.cos(a), ly + 0.14, lz + 0.095 * Math.sin(a)]], 0.009, 3); }
  b.c([1.0, 0.62, 0.26], KIND.LIT, 7.0);
  b.blob(lx, ly, lz, 0.062, 0.105, 0.062, 6, 4);
  return { x0, x1, z0, z1, y };
}

// A ROWING BOAT of the lake, 4.3 m long, clinker built, in its own frame (bow toward +z, the keel on y = 0)
export function buildBoat(b, tint = [0.10, 0.09, 0.08]) {
  const L = 4.3, NS = 12, sec = (t) => {
    const w = 0.68 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + 0.94 * Math.pow(t, 0.85))), 0.62), sheer = 0.46 + 0.16 * Math.pow(Math.abs(t - 0.45) / 0.55, 2.2);
    const z = (t - 0.5) * L;
    return [[0, 0.02, z], [w * 0.55, 0.06, z], [w * 0.9, 0.24, z], [w, sheer, z]];
  };
  for (const s of [-1, 1]) for (let i = 0; i < NS; i++) {
    const A = sec(i / NS), B = sec((i + 1) / NS);
    for (let j = 0; j < 3; j++) {
      const a = [s * A[j][0], A[j][1], A[j][2]], a2 = [s * A[j + 1][0], A[j + 1][1], A[j + 1][2]], c = [s * B[j][0], B[j][1], B[j][2]], c2 = [s * B[j + 1][0], B[j + 1][1], B[j + 1][2]];
      b.c(tint, KIND.BOARDS);
      if (s > 0) b.quad(a, a2, c2, c); else b.quad(a, c, c2, a2);
      b.c([0.30, 0.31, 0.27], KIND.BOARDS);
      const k = 0.03, up = (p) => [p[0] * 0.94, p[1] + k, p[2]];
      if (s > 0) b.quad(up(a), up(c), up(c2), up(a2)); else b.quad(up(a), up(a2), up(c2), up(c));
    }
  }
  b.c([0.34, 0.27, 0.19], KIND.BOARDS);
  for (const t of [0.3, 0.56, 0.9]) { const S = sec(t), w = S[3][0] * 0.93, z = S[0][2]; b.box(-w, 0.30, z - 0.12, w, 0.335, z + 0.12); }
  b.c([0.36, 0.27, 0.17], KIND.BARK);
  b.tube([[0.25, 0.37, -1.5], [0.32, 0.40, 1.3]], 0.03, 5);
  b.tube([[-0.25, 0.37, -1.5], [-0.32, 0.40, 1.3]], 0.03, 5);
  return b;
}

// The box alone, for the set-piece viewer: the same builder, shown in the garden's morning light with the law set
// aside (uBare; in the world uBare is 0 on every visit and the law decides everything).
export async function buildHero(ctx, opts = {}) {
  const kit = opts.kit || makeKit(ctx);
  if (!opts.kit) kit.U.uBare.value = 1;
  const rng = ctx.rng ? ctx.rng.fork('hut') : (() => 0.5);
  const b = new Bld();
  const mz = -(HUT.front + HUT.back) / 2;
  b.push(new THREE.Matrix4().makeTranslation(0, 0.75, mz));
  buildHut(b, { inside: true }); buildJetty(b, rng);
  b.pop();
  const object = new THREE.Group();
  object.add(b.mesh(kit.solid2[1], 'hut'));
  return {
    object, radius: 9, height: 18.6, center: new THREE.Vector3(0, 9.0, 0),
    anchors: { door: new THREE.Vector3(0, 0.75 + HUT.mid, mz) },
    update(dt, time) { kit.U.uTime.value = time; },
    ground: true, groundY: 0,
  };
}
