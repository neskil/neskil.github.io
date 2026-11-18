// The One Standing Place (after Emmanuel Maignan): an empty Minim convent wing, four times life size, whose
// plaster carries anamorphic grisaille pictures: three that lock only at three points of the flight, an astrolabe
// that stands whole down the cellar's lane from the entry point, ringing the bright court at its end, and loosens ring by
// ring down the cellar and up stair A, a painted doorcase, a glory of rays and its overspill, a fan of rays down the court's walls.
//
// OUTLINE
//   hero        src/parts/one-standing-place.js at the origin: the whole wing, the pictures, both leaves, cistern,
//               and the sun's depth map (one low sun from the south-west; the hero bakes it, this file reads it too).
//   look        by seed and hour: umber (afternoon), verdaccio (after rain), sanguine (last even light).
//   sky         own dome, opaque: warm low down and toward the sun, cool overhead, a few long level cloud bars of
//               uneven length lit from the sun's side, a pale disc, two ridges of hills in haze.
//   garden      a parterre ground sheet with distance haze, clipped bay, cypresses, umbrella pines, the old fig,
//               two bell towers and far roofs: one merged mesh that nods in the vertex shader.
//   gear        what the painter left: trestles, glazed pots with trembling skins, shells, hog brushes on canes,
//               linen sheets (billowing ribbons; those that hang before an opening, in the cellar's arches and the gallery's two
//               window embrasures, fill and are sucked back; the largest one in the west bay turns slowly on its pole, a mesh
//               of its own), a plumb bob, iron rings with thread ends; contact blobs under them;
//               in the cellar all of it stands or hangs beside the lane of piers, never within 7 m of its axis (A.lane);
//               a scaffold of three stages before the gallery's south wall, standing out from it clear of the linen hung there;
//               the sphere's red-chalk underdrawing, squared
//               up on a patch of fresh plaster in the west bay with its colours half blocked in; an umber dado on
//               the landing's face. On the roofs: linen on drying lines, bay in pots, a second scaffold by the
//               cistern, a trestle, pots and canes. The gear casts into the sun's map (hero.bakeSun([gear, turning])).
//               Clipped bay in pots inside the house too (COURT_BAY, thirteen: a double row on the sunk court's floor between the stairs, a pair
//               at each of the gallery's two doors, one by the west bay's west wall). The design keeps plants outside the house: said as a departure.
//   life        swifts (kit flocks, eleven: a racetrack beside the path in the cellar lane's north half and a second party over the court's south end between the stairs; in the court a level ring over
//               the south half and a small flock along the north side; in the gallery a small loop in the north west corner, west of the flown passage, and a second party east of the passage
//               by the east wall, between z -92 and -76 (the north door stands at z -121.3); a loop high over the court's west half; a loop high over the terrace's south end and the court's north end; three parties keyed to the flight, each on a course of its own laid off the flown line: a pair across the court's north part at V1's lock, a pair across the gallery's far end at V2's lock, six north over the roofs while the eye climbs the roof stair and crosses the roofs.
//               ALL ELEVEN are at the new size: the court's two (7 and 5), the cellar's two (4.5 each), the four of the gallery and the roofs and the three keyed parties (5 each)),
//               doves walking the court parapet and the fountain wall, a fig leaf skating in the cellar and fig leaves
//               turning on the cistern (eight adrift, four more where the water's rings start between the pergola's posts),
//               fine dust motes carried with the eye (indoors and in the courts only), larger motes standing in the west bay
//               and in the gallery, cloud bands sliding over everything.
//   streams     nothing added later draws from a stream that was there before it: the turning sheet's phases, the four
//               cistern leaves, the two rooms' motes and the house's bay trees each take a stream of their own (own(name) in build).
//   flight      the hero's fly-through line; pace dips at the three vantage points; pois on the picture centres (one pull each).
// BEATS (u)  0 the astrolabe whole in the cellar's mouth (it is cast from the entry point), bold in red, chalk and blue on the plaster vaults and the tiled floor, the unpainted stone arches crossing it, sun
//   in bars across the lane, the painter's sheets and pots beside it, the bright court at its end; by 0.05 the astrolabe is broad fans and bands down the pavement and on the vault webs, a stone arcade standing clear between them;
//   0.10..0.18 its inner plate lies in broad fields over the last bays' floor and vault (never on piers, arch rings or soffits), its boss and pin
//   on stair A and the court's west wall, the rule as two long bars; ahead, over a dark dado, the sphere's smears on the
//   pylons and a fan of rays falling down the court's north wall;
//   0.16 up stair A, the sphere's smears on pylons, fountain wall and east wall; 0.24 V1 on the stair: the sphere and its
//   wide horizon band; 0.25..0.30 the close pass between the painted fountain wall and the pylons; 0.31..0.37 up stair B;
//   0.379 in through the north door, which swings shut behind; 0.39..0.47 down the gallery over the loggia's pavement
//   and under its sky, all smears; 0.47..0.53 out through the west arcade, round the bay past the red-chalk
//   underdrawing, back in through the south arch; 0.575 V2: the loggia north through the cross arch (from here until the flight
//   goes out under the west arcade the eye goes down to the wind rose of its pavement as it shears), two swifts
//   through it (rare: the door has been left standing wider still, its dark back broad to the eye, the court showing
//   where the fourth arch should be and daylight lying in a bar on the floor before it; it swings home over 0.545..0.571); 0.33 from the foot of stair B a painted doorcase stands round the gallery door;
//   0.60..0.72 the roof stair, its treads and the bay wall carrying the loggia's overspill, the north front rising
//   over the stair head (window wall, porch, five-arch screen, glory smears on all of them); 0.72..0.87 over the
//   roofs between linen and scaffold, the court below with the fan of rays whole at 0.77 on its north and west walls;
//   the wreath's leaves gather as the porch nears (a third of them from far off, all by 0.9);
//   0.86..0.925 the porch leaf shuts; 0.933 V3: the wreath round the portal with
//   its glory of rays, doubled in the cistern.
// No three.js lights and no fog: the sun and its shadows come from the hero's baked depth map (uDS), shade from
// baked vertex light; flat post, the colours written are the colours shown.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, lightAt } from '../parts/one-standing-place.js';

const PALETTE = ['#EDE6D6', '#CFC3A8', '#5A3A22', '#B0703A', '#F8F4EA', '#6F8296', '#B4664A'];
// per look: sky tone, foliage (light, dark), linen, gravel, the three pot paints, overall light, haze
const LOOKS = {
  umber: { title: 'The One Standing Place', sky: '#DDD6C4', warm: '#EFE2C6', cool: '#B4BFC8', sunSide: '#F8E8C2', cloudLit: '#F7F0DE', cloudDark: '#BDB6AC', disc: '#FFF8DE', hill: '#6E7A72', cover: 0.4,
    leafA: '#8C9363', leafB: '#4B5538', linen: '#E9E2CF', gravel: '#CBC2AC', paints: ['#5A3A22', '#B0703A', '#F8F4EA'], bright: 1, haze: 0.001, bird: '#2E2620', portal: '#C9CED2', cloud: 0.22 },
  verdaccio: { title: 'The One Standing Place, After Rain', sky: '#CBD3CC', warm: '#DDE2CC', cool: '#8497A1', sunSide: '#EEF0D2', cloudLit: '#EEF1E6', cloudDark: '#8D979B', disc: '#FBFBE6', hill: '#56696A', cover: 0.85,
    leafA: '#7F9972', leafB: '#42584A', linen: '#DDE2DA', gravel: '#9FA59B', paints: ['#474B3A', '#8A8E6E', '#F8F4EA'], bright: 0.96, haze: 0.0021, bird: '#1F2527', portal: '#C4CDD0', cloud: 0.42 },
  sanguine: { title: 'The One Standing Place, Last Light', sky: '#E9CDB0', warm: '#F3C795', cool: '#8D98BA', sunSide: '#FBD08E', cloudLit: '#F9D0AC', cloudDark: '#A08A9E', disc: '#FFEBC0', hill: '#6B5A6E', cover: 0.6,
    leafA: '#7A7446', leafB: '#3A3A28', linen: '#EAD6BE', gravel: '#B39C86', paints: ['#7C2F23', '#BC5C44', '#F7EFE2'], bright: 0.95, haze: 0.0009, bird: '#22140F', portal: '#D2C6BA', cloud: 0.26 },
};

// ---------------------------------------------------------------- shaders
const NOISE = /* glsl */`
float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm2(vec2 p) { return 0.5 * vn2(p) + 0.3 * vn2(p * 2.13 + 7.1) + 0.2 * vn2(p * 4.37 + 3.7); }
`;

// the hero's sun for the world's own materials: its direction and colours, and the map of what its rays reach
const SUN = /* glsl */`
uniform sampler2D uDS; uniform mat4 uSunM; uniform vec3 uSunPos, uSunDir, uSunCol, uAmb; uniform float uSunFar, uSunRes;
float unpackS(vec4 e) { return dot(e, vec4(1., 1. / 255., 1. / 65025., 1. / 16581375.)); }
float sunVis(vec3 p) {
  vec4 c = uSunM * vec4(p, 1.);
  if (c.x < 0.002 || c.x > 0.998 || c.y < 0.002 || c.y > 0.998) return 1.;
  float t = dot(p - uSunPos, -uSunDir) / uSunFar - 0.9 / uSunFar, tx = 1.5 / uSunRes;
  return (step(t, unpackS(textureLod(uDS, c.xy + vec2(tx, 0.), 0.))) + step(t, unpackS(textureLod(uDS, c.xy + vec2(-tx * 0.5, tx * 0.87), 0.))) + step(t, unpackS(textureLod(uDS, c.xy + vec2(-tx * 0.5, -tx * 0.87), 0.)))) / 3.;
}
// for cloth: thirteen taps over about two metres and a bias deeper than the billow, so a sheet takes soft shadows from the
// building and none from itself (the map holds the cloth at rest; the cloth on screen is blown about)
float sunTap(vec2 uv, float t) { return step(t, unpackS(textureLod(uDS, uv, 0.))); }
float sunVisSoft(vec3 p) {
  vec4 c = uSunM * vec4(p, 1.);
  if (c.x < 0.006 || c.x > 0.994 || c.y < 0.006 || c.y > 0.994) return 1.;
  float t = dot(p - uSunPos, -uSunDir) / uSunFar - 3.4 / uSunFar, a = 3.2 / uSunRes, b = 6.5 / uSunRes;
  c.xy += (vec2(vn3(p * 2.3), vn3(p * 2.3 + 17.)) - 0.5) * a * 2.2;   // the taps wander a little from place to place, so the edge has no terraces
  float s = sunTap(c.xy, t);
  s += sunTap(c.xy + vec2(a, 0.), t) + sunTap(c.xy + vec2(-a, 0.), t) + sunTap(c.xy + vec2(a * 0.5, a * 0.866), t) + sunTap(c.xy + vec2(-a * 0.5, a * 0.866), t) + sunTap(c.xy + vec2(a * 0.5, -a * 0.866), t) + sunTap(c.xy + vec2(-a * 0.5, -a * 0.866), t);
  s += sunTap(c.xy + vec2(0., b), t) + sunTap(c.xy + vec2(0., -b), t) + sunTap(c.xy + vec2(b * 0.866, b * 0.5), t) + sunTap(c.xy + vec2(-b * 0.866, b * 0.5), t) + sunTap(c.xy + vec2(b * 0.866, -b * 0.5), t) + sunTap(c.xy + vec2(-b * 0.866, -b * 0.5), t);
  return s / 13.;
}`;

// One flat material for gear, garden masses, doves and leaves. aSw = (kind, phase, amplitude, rate):
//   0 still; 1 / 2 pendulum about aPiv round the z / x axis; 3 cloth (aPiv.x = weight) pushed along its normal
//   (3.3: cloth that hangs before an opening, which the draught fills slowly and sucks back through it; for both, aPiv.y and
//   aPiv.z = the room the cloth has behind it and before it along that normal before it meets the building, 0 = free air:
//   pushed that way it presses softly against the face and does not pass it; clothRoom() below measures the room); 4 foliage nod
//   (aPiv.x = weight); 5 skin tremble.
// With TURN defined (the one sheet that turns on its pole, a mesh of its own): the cloth also turns about the upright through
// the middle of its pole, uTurn = (pole x, pole z, the wall's outward normal x, z), uTurnA = (widest turn in radians, rate,
// two seeded phases), uTurnH = half the cloth's width; it stands off as it turns, so the end nearer the wall never passes its rest plane.
const FLAT_VERT = /* glsl */`
attribute vec3 aCol, aPiv; attribute vec4 aSw; attribute float aE;
uniform float uTime;
#ifdef TURN
uniform vec4 uTurn, uTurnA; uniform float uTurnH;
#endif
varying vec3 vCol, vN, vW; varying float vFold, vK, vE;
void main() {
  vec3 p = position, n = normal; float k = aSw.x, ph = aSw.y, amp = aSw.z, fr = aSw.w;
  vFold = 0.; vK = k; vE = aE;
  if (k > 0.5 && k < 2.5) {
    float a = amp * (sin(uTime * fr + ph) + 0.3 * sin(uTime * fr * 2.3 + ph * 1.7));
    float c = cos(a), s = sin(a); vec3 r = p - aPiv;
    if (k < 1.5) { r.xy = vec2(c * r.x - s * r.y, s * r.x + c * r.y); n.xy = vec2(c * n.x - s * n.y, s * n.x + c * n.y); }
    else { r.zy = vec2(c * r.z - s * r.y, s * r.z + c * r.y); n.zy = vec2(c * n.z - s * n.y, s * n.z + c * n.y); }
    p = aPiv + r;
  } else if (k > 2.5 && k < 3.5) {
    float b = 0.7 * sin(uTime * fr + ph + p.y * 0.6 + (p.x + p.z) * 0.45) + 0.8 * sin(uTime * fr * 0.43 + ph * 2. + p.y * 0.21 - (p.x + p.z) * 0.3);
    float lit = 1.;
    if (k > 3.15) {   // billowing and sucking back: the quick ripple as it is; the slow swell under it becomes one draw of the draught (a skewed wave: it fills slowly and is pulled back fast), a third larger and at 0.8 of the ripple's rate, a draw every four to five seconds
      float th = uTime * fr * 0.8 + ph * 2. + p.y * 0.21 - (p.x + p.z) * 0.3;
      b = 0.7 * sin(uTime * fr + ph + p.y * 0.6 + (p.x + p.z) * 0.45) + 1.1 * sin(th + 0.5 * sin(th));
    }
    float d = amp * aPiv.x * b;
    if (d < 0. && aPiv.y > 0.) d = -aPiv.y * (1. - exp(d / aPiv.y)); else if (d > 0. && aPiv.z > 0.) d = aPiv.z * (1. - exp(-d / aPiv.z));
    p += n * d; vFold = aPiv.x * b * lit;
    #ifdef TURN
    {
      float th = uTurnA.x * aPiv.x * (sin(uTime * uTurnA.y + uTurnA.z) + 0.35 * sin(uTime * uTurnA.y * 2.3 + uTurnA.w)), ct = cos(th), st = sin(th);
      vec2 nr = uTurn.zw, tg = vec2(-nr.y, nr.x), r = p.xz - uTurn.xy; float ra = dot(r, tg), rd = dot(r, nr), na = dot(n.xz, tg), nd = dot(n.xz, nr);
      p.xz = uTurn.xy + tg * (ct * ra - st * rd) + nr * (st * ra + ct * rd + abs(st) * uTurnH);
      n.xz = tg * (ct * na - st * nd) + nr * (st * na + ct * nd);
    }
    #endif
  } else if (k > 3.5 && k < 4.5) {
    p.xz += amp * aPiv.x * vec2(sin(uTime * fr + ph) + 0.4 * sin(uTime * fr * 2.7 + ph * 3.), cos(uTime * fr * 0.8 + ph * 1.3));
  } else if (k > 4.5) {
    float sk = sin(uTime * fr + ph + p.x * 5. + p.z * 4.);
    p.y += amp * sk; vFold = 0.5 * sk;   // the skin trembles and the light runs over it
  }
  vec4 wp = vec4(p, 1.); vec3 wn = n;
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
  #endif
  wp = modelMatrix * wp; vW = wp.xyz; vN = mat3(modelMatrix) * wn; vCol = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FLAT_FRAG = /* glsl */`
uniform vec3 uSky; uniform float uHaze, uBright;
varying vec3 vCol, vN, vW; varying float vFold, vK, vE;
${NOISE}
${SUN}
void main() {
  vec3 n = vN / max(length(vN), 1e-4); if (dot(n, vW - cameraPosition) > 0.) n = -n;
  float hemi = 0.8 + 0.2 * n.y;
  float m = 0.6 * vn3(vW * 1.3) + 0.4 * vn3(vW * 5.1);
  vec3 col = vCol * (0.9 + 0.2 * m) * (1. + 0.3 * vFold);
  float ndl = dot(n, uSunDir), soft = step(2.5, vK) * step(vK, 4.5);   // cloth and leaves let some light through
  float cloth = step(2.5, vK) * step(vK, 3.5), vis = 1.;
  if (cloth > 0.5) vis = sunVisSoft(vW); else vis = sunVis(vW + n * 0.3);
  float sun = vis * mix(smoothstep(0.02, 0.3, ndl) * (0.62 + 0.38 * ndl), 0.3 + 0.7 * smoothstep(-0.35, 0.55, ndl), soft);
  if (vK > 3.5 && vK < 4.5) {   // foliage: clumps of leaf mass in three sizes, darker in the hollows and underneath
    float f = 0.4 * vn3(vW * 0.42) + 0.35 * vn3(vW * 1.3 + 5.) + 0.25 * vn3(vW * 3.7), g = vn3(vW * 9.);
    col = vCol * mix(0.5, 1.25, smoothstep(0.3, 0.7, f)) * (0.86 + 0.28 * g);
    sun *= smoothstep(0.22, 0.6, f + 0.25 * (g - 0.5));
  }
  col = min(col * (vE * hemi * uAmb + sun * uSunCol) * uBright, vec3(0.97));
  float d = length(vW - cameraPosition);
  col = mix(col, uSky, 1. - exp(-d * uHaze));
  gl_FragColor = vec4(max(col, 0.), 1.);   // never below zero
}`;

// soft contact blobs under the gear: quads with a radial falloff in umber
// The painters' red-chalk underdrawing of the sphere on a plast of fresh plaster: squaring grid, plumb line, the rings.
const SINO_VERT = /* glsl */`varying vec2 vS; void main() { vS = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SINO_FRAG = /* glsl */`uniform vec3 uRed, uGround, uBlue, uSien, uChalk; uniform float uK; varying vec2 vS;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float ln(float d, float w, float fw) { return 1. - smoothstep(w - fw * 0.5, w + fw * 0.5, abs(d)); }
float el(vec2 p, float r, float s) { vec2 e = vec2(p.x, p.y / s); float l = max(length(e), 1e-4); return (l - r) / max(length(vec2(p.x, p.y / (s * s))) / l, 1e-3); }
void main() {
  vec2 p = vS; float fw = clamp(max(fwidth(p).x, fwidth(p).y), 1e-3, 1.);
  float n = vn(p * 0.9) * 0.6 + vn(p * 3.1 + 4.) * 0.4;
  float plast = 1. - smoothstep(9.9, 10.5, max(abs(p.x), abs(p.y)) + (n - 0.5) * 1.5);
  vec2 gq = (fract(p / 2.2 + 0.5) - 0.5) * 2.2;
  float grid = max(ln(gq.x, 0.03, fw), ln(gq.y, 0.03, fw)) * 0.45;
  float R = 5.6; vec2 ax = vec2(0.3907, 0.9205), q = vec2(dot(p, vec2(ax.y, -ax.x)), dot(p, ax));
  float a = ln(length(p) - R, 0.075, fw);
  a = max(a, ln(el(q, R * 0.985, 0.3), 0.06, fw));
  a = max(a, ln(el(q - vec2(0., 0.43 * R), R * 0.9, 0.3), 0.05, fw));
  a = max(a, ln(el(q + vec2(0., 0.43 * R), R * 0.9, 0.3), 0.05, fw));
  a = max(a, ln(el(q.yx, R * 0.985, 0.42), 0.05, fw));
  a = max(a, ln(q.x, 0.05, fw) * step(abs(q.y), R * 1.14));
  a = max(a, ln(length(p) - R * 0.2, 0.065, fw));
  vec2 hp = p + vec2(0., 0.05 * R);
  a = max(a, max(ln(el(hp, R * 1.66, 0.21), 0.07, fw), ln(el(hp, R * 1.43, 0.21), 0.05, fw)));
  a = max(a, ln(p.x, 0.028, fw) * 0.7);
  a = max(a, ln(p.y + R * 1.16, 0.06, fw) * step(abs(p.x), R * 0.3));
  a = max(a, ln(p.x, 0.07, fw) * step(abs(p.y + R * 1.08), R * 0.08));
  float skip = 0.5 + 0.5 * vn(p * 7.);
  float ink = max(a * (0.5 + 0.5 * skip), grid * skip) * plast;
  // the colours blocked in from the left, as far as the painter got: a slate ground, the band in chalk, the globe in sienna
  float blk = (1. - smoothstep(7.9, 8.5, max(abs(p.x), abs(p.y)) + (vn(p * 0.9 + 9.) - 0.5) * 1.1)) * (1. - smoothstep(2.6, 3.6, p.x + (vn(vec2(p.y * 0.5, 2.)) - 0.5) * 3.2 + (vn(p * 2.3) - 0.5) * 0.8));
  float band = step(el(hp, R * 1.66, 0.21), 0.) * step(0., el(hp, R * 1.43, 0.21)), disc = step(length(p), R);
  vec3 base = mix(uGround, uBlue, blk * 0.9);
  base = mix(base, uChalk, blk * band * (1. - disc)); base = mix(base, uSien, blk * disc * 0.85); base = mix(base, uRed, blk * step(length(p), R * 0.2));
  gl_FragColor = vec4(mix(base, uRed, ink * (1. - 0.5 * blk * disc)) * uK, plast * mix(0.5 + 0.46 * blk, 0.96, ink));
}`;
const BLOB_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const BLOB_FRAG = /* glsl */`uniform vec3 uCol; varying vec2 vUv;
void main() { float r = length(vUv); float a = (1. - smoothstep(0.25, 1., r)) * 0.42; gl_FragColor = vec4(uCol, a); }`;

// the garden sheet: gravel walks and clipped beds near the wing, mottled fields beyond, all sinking into the sky tone
const GROUND_VERT = /* glsl */`varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uSky, uGravel, uLeafA, uLeafB, uStone; uniform float uHaze, uBright, uWet;
varying vec3 vW;
${NOISE}
${SUN}
void main() {
  vec2 p = vW.xz; float fw = clamp(max(fwidth(p).x, fwidth(p).y), 1e-4, 50.);
  float d = length(vW - cameraPosition);
  // parterre: 30 m squares, walks 6 m wide, a round bed in every square
  vec2 g = (p + vec2(9., 5.)) / 30.; vec2 f = fract(g) - 0.5; vec2 id = floor(g);
  float edge = max(abs(f.x), abs(f.y)) * 30.;
  float bed = 1. - smoothstep(12. - fw, 12. + fw, edge);
  float ring = smoothstep(5. - fw, 5. + fw, length(f) * 30.) ;
  float box = bed * (1. - smoothstep(0.9 - fw, 0.9 + fw, abs(edge - 11.2)));
  float grain = vn2(p * 2.3) * 0.5 + vn2(p * 9.) * 0.5;
  vec3 walk = uGravel * (0.9 + 0.16 * grain * (1. - smoothstep(0.1, 0.8, fw)) + 0.08 * fbm2(p * 0.07));
  vec3 turf = mix(uLeafA, uLeafB, 0.35 + 0.3 * fbm2(p * 0.31 + id * 3.7) + 0.2 * h21(id)) * (0.95 + 0.1 * grain);
  vec3 near = mix(walk, turf, bed * ring);
  near = mix(near, uLeafB * 0.92, box);
  near = mix(near, near * 0.74 + uSky * 0.1, uWet * smoothstep(0.45, 0.7, fbm2(p * 0.045 + 3.)) * (1. - bed * ring));
  // beyond the garden wall: fields, orchards and pale roofs as a soft mottle
  float fa = fbm2(p * 0.006 + 11.), fb = fbm2(p * 0.021 - 5.);
  vec3 far = mix(mix(uLeafA, uLeafB, fa), uStone * 0.9, smoothstep(0.55, 0.75, fb) * 0.6);
  float span = max(abs(p.x), abs(p.y + 150.) * 0.62);
  vec3 col = mix(near, far, smoothstep(150., 190., span)) * uBright * (uAmb * 1.05 + sunVis(vW + vec3(0., 0.4, 0.)) * 0.86 * uSunCol);
  col = mix(col, uSky, 1. - exp(-d * uHaze));
  gl_FragColor = vec4(col, 1.);
}`;

const SKY_VERT = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// the sky: a wash graded from a warm horizon (warmest under the sun) to a cool zenith, long clouds lit from the sun's
// side, a pale sun disc, and two ridges of far hills sunk in the haze
const SKY_FRAG = /* glsl */`
uniform vec3 uWarm, uCool, uSunSide, uCloudLit, uCloudDark, uDisc, uHill, uSunDir; uniform float uTime, uCover;
varying vec3 vD;
${NOISE}
void main() {
  vec3 d = vD / max(length(vD), 1e-4);
  float h = clamp(d.y, 0., 1.), sd = dot(d, uSunDir), sp = max(sd, 0.);
  vec2 hz = d.xz / max(length(d.xz), 1e-4), sz = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float toward = 0.5 + 0.5 * dot(hz, sz);
  vec3 col = mix(uWarm, uCool, smoothstep(0.0, 0.62, h + 0.12 * (1. - toward)));
  col = mix(col, uSunSide, sp * sp * sp * 0.55 + toward * toward * 0.3 * (1. - smoothstep(0., 0.4, h)));
  // long clouds: a few uneven bars lying level at different heights (noise over the bearing and the height, so there is
  // no vanishing point), a thinner set across them that slopes with the bearing, and a soft dapple overhead
  float ca = uTime * 0.0035, cr = cos(ca), sr = sin(ca); vec2 hr = vec2(cr * hz.x - sr * hz.y, sr * hz.x + cr * hz.y);
  float lo = 0.62 - uCover * 0.3;
  float n1 = 0.62 * vn3(vec3(hr * 1.9, h * 13.)) + 0.38 * vn3(vec3(hr * 4.7 + 3.1, h * 31. + 1.7));
  float gap = vn3(vec3(hr * 0.9 + 7.3, h * 3.1));                                  // where bars are plentiful and where the sky is clear
  float h2 = h + 0.09 * dot(hr, vec2(0.74, -0.67)) + 0.03 * sin(dot(hr, vec2(0.3, 0.95)) * 5.);
  float n2 = 0.6 * vn3(vec3(hr * 1.3 - 5.2, h2 * 22. + 4.)) + 0.4 * vn3(vec3(hr * 3.9, h2 * 47.));
  float low = (1. - smoothstep(0.42, 0.78, h)) * smoothstep(0.012, 0.07, d.y);
  float c1 = smoothstep(lo, lo + 0.17, n1 + 0.2 * (gap - 0.5)) * low, c2 = smoothstep(lo + 0.13, lo + 0.27, n2 - 0.22 * (gap - 0.5)) * low * 0.7;
  vec2 qz = d.xz / (abs(d.y) + 0.45); float n3 = fbm2(qz * 2.1 + vec2(uTime * 0.006, uTime * 0.002));
  float c3 = smoothstep(lo + 0.06, lo + 0.3, n3) * smoothstep(0.4, 0.8, h) * 0.75;
  float cl = clamp(max(max(c1, c2), c3), 0., 1.);
  // lit from the sun's side, a little darker along the underside (denser above = looking at a bar from below its middle)
  float up1 = 0.62 * vn3(vec3(hr * 1.9, (h + 0.018) * 13.)) + 0.38 * vn3(vec3(hr * 4.7 + 3.1, (h + 0.018) * 31. + 1.7));
  float under = smoothstep(0., 0.09, up1 - n1) * c1, thick = 0.28 * cl + 0.5 * under;
  vec3 cc = mix(mix(uCloudLit, uSunSide, 0.45 * toward * toward), uCloudDark, thick * (0.95 - 0.5 * toward));
  cc = mix(cc, uDisc, sp * sp * sp * sp * 0.5 * (1. - thick));
  col = mix(col, cc, cl * 0.88);
  // the sun: a pale disc with a soft glow, dimmed behind cloud
  float disc = smoothstep(0.99925, 0.99962, sd), glow = sp * sp; glow *= glow; glow *= glow; glow *= glow;
  col = mix(col, uDisc, clamp(disc * (1. - 0.75 * cl) + glow * glow * 0.5 + glow * 0.16, 0., 1.));
  // far hills
  float r1 = 0.016 + 0.05 * vn2(hz * 2.3 + 3.) + 0.014 * vn2(hz * 9. + 7.), r2 = 0.008 + 0.03 * vn2(hz * 3.7 - 5.) + 0.008 * vn2(hz * 14.);
  vec3 haze = mix(uWarm, uSunSide, toward * toward * 0.5);
  col = mix(col, mix(haze, uHill, 0.3), 1. - smoothstep(r1 - 0.003, r1 + 0.003, d.y));
  col = mix(col, mix(haze, uHill, 0.52), 1. - smoothstep(r2 - 0.003, r2 + 0.003, d.y));
  col = mix(col, haze, 1. - smoothstep(-0.012, 0.004, d.y));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- geometry accumulator for the flat material
// brightness by place comes from the hero (light), so the gear sits in the same dim cellar and bright court as the walls
function makeG(light = null) {
  const G = { pos: [], nor: [], col: [], piv: [], sw: [], e: [], idx: [], n: 0, M: new THREE.Matrix4(), sway: [0, 0, 0, 0], pivot: [0, 0, 0], lit: true, cloths: [] };   // cloths: each hung sheet's run of vertices (sheet() notes it, clothRoom() reads it)
  const P = new THREE.Vector3(), N = new THREE.Vector3(), N3 = new THREE.Matrix3();
  G.at = (x, y, z, ry = 0, s = 1) => { G.M.makeRotationY(ry); G.M.scale(P.set(s, s, s)); G.M.setPosition(x, y, z); N3.getNormalMatrix(G.M); };
  G.at(0, 0, 0);
  // one vertex: local position and normal, colour c (THREE.Color) times k, w = sway weight (kinds 3 and 4)
  G.v = (x, y, z, nx, ny, nz, c, k = 1, w = 0) => {
    P.set(x, y, z).applyMatrix4(G.M); N.set(nx, ny, nz).applyMatrix3(N3); const l = N.length() || 1;
    G.e.push(G.lit && light ? light(P.x, P.y, P.z) : 1);
    G.pos.push(P.x, P.y, P.z); G.nor.push(N.x / l, N.y / l, N.z / l); G.col.push(c.r * k, c.g * k, c.b * k);
    const kind = G.sway[0];
    if (kind > 2.5) G.piv.push(w, 0, 0); else G.piv.push(G.pivot[0], G.pivot[1], G.pivot[2]);
    G.sw.push(G.sway[0], G.sway[1], G.sway[2], G.sway[3]);
    return G.n++;
  };
  G.quad = (a, b, c, d, col, k = 1, ks = null) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = G.v(a[0], a[1], a[2], nx, ny, nz, col, ks ? ks[0] : k), i1 = G.v(b[0], b[1], b[2], nx, ny, nz, col, ks ? ks[1] : k);
    const i2 = G.v(c[0], c[1], c[2], nx, ny, nz, col, ks ? ks[2] : k), i3 = G.v(d[0], d[1], d[2], nx, ny, nz, col, ks ? ks[3] : k);
    G.idx.push(i0, i1, i2, i0, i2, i3);
  };
  // chamfered box centred (cx, cy, cz), size (sx, sy, sz), chamfer b; kt / kb brighten the top and darken the foot
  G.box = (cx, cy, cz, sx, sy, sz, col, o = {}) => {
    const b = Math.min(o.b ?? 0.06, sx / 3, sy / 3, sz / 3), hx = sx / 2, hy = sy / 2, hz = sz / 2, kt = o.kt ?? 1.06, kb = o.kb ?? 0.8, k = o.k ?? 1;
    const c = (x, y, z) => [cx + x, cy + y, cz + z];
    for (const s of [-1, 1]) {
      // faces (inset by the chamfer), then the chamfer strips that touch them
      G.quad(c(s * hx, -hy + b, s * (hz - b)), c(s * hx, -hy + b, -s * (hz - b)), c(s * hx, hy - b, -s * (hz - b)), c(s * hx, hy - b, s * (hz - b)), col, k, [k * kb, k * kb, k, k]);
      G.quad(c(-s * (hx - b), -hy + b, s * hz), c(s * (hx - b), -hy + b, s * hz), c(s * (hx - b), hy - b, s * hz), c(-s * (hx - b), hy - b, s * hz), col, k, [k * kb, k * kb, k, k]);
      G.quad(c(-hx + b, s * hy, s * (hz - b)), c(hx - b, s * hy, s * (hz - b)), c(hx - b, s * hy, -s * (hz - b)), c(-hx + b, s * hy, -s * (hz - b)), col, s > 0 ? k * kt : k * kb * 0.9);
      for (const t of [-1, 1]) {
        // vertical edges
        G.quad(c(s * hx, -hy + b, t * s * (hz - b)), c(s * hx, hy - b, t * s * (hz - b)), c(s * (hx - b), hy - b, t * s * hz), c(s * (hx - b), -hy + b, t * s * hz), col, k * (t > 0 ? 1.1 : 1.1), t > 0 ? null : null);
        // horizontal edges along z and along x
        G.quad(c(s * hx, t * (hy - b), -hz + b), c(s * hx, t * (hy - b), hz - b), c(s * (hx - b), t * hy, hz - b), c(s * (hx - b), t * hy, -hz + b), col, k * (t > 0 ? 1.12 : kb));
        G.quad(c(-hx + b, t * (hy - b), s * hz), c(hx - b, t * (hy - b), s * hz), c(hx - b, t * hy, s * (hz - b)), c(-hx + b, t * hy, s * (hz - b)), col, k * (t > 0 ? 1.12 : kb));
      }
    }
  };
  // lathe about the y axis at (cx, cz): prof = [[radius, y, brightness, colour?], ...] bottom to top; lump(i, j) scales the radius
  G.lathe = (cx, cz, prof, seg, col, o = {}) => {
    const base = G.n, m = prof.length, lump = o.lump, wf = o.weight;
    for (let j = 0; j < m; j++) {
      const a = prof[Math.max(j - 1, 0)], b = prof[Math.min(j + 1, m - 1)]; let nr = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nr, ny) || 1; nr /= l; ny /= l;
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), r = prof[j][0] * (lump ? lump(i % seg, j) : 1);
        G.v(cx + r * cs, prof[j][1], cz + r * sn, nr * cs, ny, nr * sn, prof[j][3] || col, (prof[j][2] ?? 1) * (o.kf ? o.kf(i % seg, j) : 1), wf ? wf(j) : 0);
      }
    }
    for (let j = 0; j < m - 1; j++) for (let i = 0; i < seg; i++) {
      const p = base + j * (seg + 1) + i, q = p + 1, r = p + seg + 2, s = p + seg + 1; G.idx.push(p, r, q, p, s, r);
    }
  };
  // tube along points [[x,y,z],...]; rad(t) radius at t in 0..1; kf(t) brightness
  G.tube = (pts, rad, seg, col, kf = null) => {
    const base = G.n, m = pts.length, T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
    for (let j = 0; j < m; j++) {
      const p = pts[j], a = pts[Math.max(j - 1, 0)], b = pts[Math.min(j + 1, m - 1)], t = j / (m - 1);
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      A.set(Math.abs(T.y) > 0.9 ? 1 : 0, Math.abs(T.y) > 0.9 ? 0 : 1, 0).cross(T).normalize(); B.crossVectors(T, A);
      const r = typeof rad === 'function' ? rad(t) : rad;
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), nx = A.x * cs + B.x * sn, ny = A.y * cs + B.y * sn, nz = A.z * cs + B.z * sn;
        G.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, col, kf ? kf(t, i) : 1, t);
      }
    }
    for (let j = 0; j < m - 1; j++) for (let i = 0; i < seg; i++) {
      const p = base + j * (seg + 1) + i, q = p + 1, r = p + seg + 2, s = p + seg + 1; G.idx.push(p, q, r, p, r, s);
    }
  };
  G.geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(G.col, 3)); g.setAttribute('aPiv', new THREE.Float32BufferAttribute(G.piv, 3));
    g.setAttribute('aSw', new THREE.Float32BufferAttribute(G.sw, 4)); g.setAttribute('aE', new THREE.Float32BufferAttribute(G.e, 1));
    g.setIndex(G.n > 65535 ? new THREE.Uint32BufferAttribute(G.idx, 1) : new THREE.Uint16BufferAttribute(G.idx, 1));
    g.computeBoundingSphere();
    return g;
  };
  // the same, a build step per attribute (the arrays of a big accumulator take a while to pack)
  G.geometryIn = async (ctx) => {
    const g = new THREE.BufferGeometry(), put = async (name, arr, n) => { g.setAttribute(name, new THREE.Float32BufferAttribute(arr, n)); await ctx.yield(); };
    await put('position', G.pos, 3); await put('normal', G.nor, 3); await put('aCol', G.col, 3); await put('aPiv', G.piv, 3); await put('aSw', G.sw, 4); await put('aE', G.e, 1);
    g.setIndex(G.n > 65535 ? new THREE.Uint32BufferAttribute(G.idx, 1) : new THREE.Uint16BufferAttribute(G.idx, 1));
    await ctx.yield();
    g.computeBoundingSphere();
    return g;
  };
  return G;
}

// ---------------------------------------------------------------- what the painter left
// glazed pot 1.2 m tall with a trembling skin of paint; C = colour set, paint = the colour inside
function pot(G, x, y, z, paint, C, rng, blobs) {
  const s = rng.range(0.92, 1.12), sq = rng.range(0.94, 1.08), dr = [], gl = rng.pick([C.glazeA, C.glazeB, C.terra]);
  for (let i = 0; i < 12; i++) dr.push(rng() < 0.3 ? rng.range(0.55, 0.8) : rng.range(0.92, 1.06));
  const prof = [[0.3, 0, 0.6, C.terra], [0.35, 0.05, 0.8, C.terra], [0.31, 0.11, 0.72, C.terra], [0.44 * sq, 0.3, 0.9, C.terra], [0.52 * sq, 0.55, 1, gl], [0.5 * sq, 0.78, 1.04, gl], [0.4, 0.98, 1, gl],
    [0.3, 1.07, 0.86, gl], [0.33, 1.13, 1.05, gl], [0.38, 1.18, 1.1, paint], [0.37, 1.21, 1.1, paint], [0.32, 1.2, 0.9, paint], [0.31, 1.13, 0.6, paint]].map((p) => [p[0] * s, y + p[1] * s, p[2], p[3]]);
  G.sway = [0, 0, 0, 0];
  G.lathe(x, z, prof, 12, C.terra, { kf: (i, j) => (j > 3 && j < 9 ? dr[i] : 1) });
  G.sway = [5, rng() * 6.28, 0.04, rng.range(2.2, 3.4)];   // the skin trembles by 4 cm (a centimetre at life size)
  G.lathe(x, z, [[0.31 * s, y + 1.13 * s, 0.8], [0.2 * s, y + 1.135 * s, 1.02], [0.09 * s, y + 1.14 * s, 0.9], [0.0001, y + 1.14 * s, 1.05]], 12, paint, { kf: (i) => 0.93 + 0.14 * ((i * 7) % 3) / 2 });
  G.sway = [0, 0, 0, 0];
  if (blobs) blobs.push([x, y + 0.03, z, 0.95 * s, 0.95 * s]);
}
// mixing shell: a shallow dish with a pool of paint
function shell(G, x, y, z, paint, C, rng) {
  const s = rng.range(0.8, 1.25);
  G.lathe(x, z, [[0.06, 0, 0.7], [0.22, 0.03, 0.9], [0.31, 0.1, 1.05], [0.28, 0.105, 1.1], [0.2, 0.06, 1, paint], [0.0001, 0.05, 0.92, paint]].map((p) => [p[0] * s, y + p[1] * s, p[2], p[3]]), 9, C.chalk, { lump: (i) => 1 + 0.07 * (i % 2) });
}
// a hog brush lashed to a cane, from foot a to tip b; rock > 0 makes it rock on its foot: sideways, along what it leans on
// (about the level axis it leans along), three times the angle written, so that the brush at its tip travels about half a metre
function cane(G, a, b, C, rng, rock = 0) {
  const pts = [], n = 9, d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  for (let i = 0; i <= n; i++) pts.push([a[0] + d[0] * i / n, a[1] + d[1] * i / n + Math.sin(i / n * Math.PI) * -0.12, a[2] + d[2] * i / n]);
  // the foot and the lean in the world, as G.at has turned and placed them (a trestle lays its cane in the trestle's own frame): the vertex writer
  // stores a pivot as given and the shader rocks world positions about it
  const aw = new THREE.Vector3(a[0], a[1], a[2]).applyMatrix4(G.M), dw = new THREE.Vector3(d[0], d[1], d[2]).transformDirection(G.M);
  G.pivot = [aw.x, aw.y, aw.z]; G.sway = rock > 0 ? [Math.abs(dw.x) >= Math.abs(dw.z) ? 2 : 1, rng() * 6.28, rock * 3, 0.9] : [0, 0, 0, 0];
  G.tube(pts, (t) => 0.1 - 0.025 * t, 6, C.cane, (t) => (Math.abs(((t * 8) % 1) - 0.5) > 0.44 ? 0.62 : 0.94 + 0.1 * Math.sin(t * 40)));
  const u = [d[0] / L, d[1] / L, d[2] / L], h = (k) => [b[0] + u[0] * k, b[1] + u[1] * k, b[2] + u[2] * k];
  G.tube([h(-0.9), h(-0.25), h(0)], 0.15, 6, C.cord, (t, i) => 0.85 + 0.15 * (i % 2));                       // the lashing
  const tip = rng.pick(C.paints);
  G.tube([h(-0.1), h(0.25), h(0.8), h(1.2), h(1.45)], (t) => 0.13 + 0.2 * Math.sin(Math.min(t * 1.5, 1) * 1.6) - 0.1 * t * t, 8, C.bristle, (t, i) => (t > 0.55 ? 0.8 : 1) * (0.9 + 0.1 * (i % 2)));
  G.tube([h(1.3), h(1.5)], (t) => 0.2 - 0.1 * t, 8, tip);
  G.sway = [0, 0, 0, 0];
}
// trestle table 8 m long, 3 m high, with pots, shells, folded linen and a brush lying on it
function trestle(G, x, y, z, ry, C, rng, blobs) {
  G.at(x, y, z, ry);
  for (let i = 0; i < 3; i++) G.box(0, 2.92, (i - 1) * 0.92, 8.2 + rng.range(-0.3, 0.3), 0.16, 0.88, C.wood, { b: 0.04, k: rng.range(0.88, 1.08) });
  for (let i = 0; i < 7; i++) { const c = rng.pick(C.paints), sx = rng.range(-3.8, 3.8), sz = rng.range(-1.1, 1.1), r = rng.range(0.15, 0.5);   // spilt paint
    G.quad([sx - r, 3.006, sz - r * 0.7], [sx + r, 3.006, sz - r * 0.6], [sx + r * 0.8, 3.006, sz + r * 0.7], [sx - r * 0.9, 3.006, sz + r * 0.5], c, 0.95); }
  for (const tx of [-2.9, 2.9]) {
    G.box(tx, 2.7, 0, 0.3, 0.28, 2.9, C.wood, { b: 0.05, k: 0.9 });
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) G.tube([[tx + sx * 0.75, 0, sz * 1.5], [tx + sx * 0.12, 2.6, sz * 1.15]], 0.12, 4, C.wood, (t) => 0.7 + 0.3 * t);
    for (const sz of [-1, 1]) G.box(tx, 0.9, sz * 1.38, 1.1, 0.12, 0.1, C.wood, { b: 0.03, k: 0.8 });
    G.box(tx, 0.9, 0, 0.1, 0.12, 2.8, C.wood, { b: 0.03, k: 0.8 });
  }
  G.box(0, 1.6, 0, 5.8, 0.14, 0.16, C.wood, { b: 0.04, k: 0.78 });
  const used = [];
  const spot = () => { for (let k = 0; k < 20; k++) { const sx = rng.range(-3.6, 3.6), sz = rng.range(-0.9, 0.9); if (used.every((q) => Math.hypot(q[0] - sx, q[1] - sz) > 0.95)) { used.push([sx, sz]); return [sx, sz]; } } return [0, 0]; };
  for (let i = 0; i < 3; i++) { const q = spot(); pot(G, q[0], 3.0, q[1], C.paints[i % 3], C, rng, null); }
  for (let i = 0; i < 5; i++) { const q = spot(); shell(G, q[0], 3.0, q[1], rng.pick(C.paints), C, rng); }
  const q = spot();   // folded linen
  for (let i = 0; i < 4; i++) G.box(q[0] + rng.range(-0.05, 0.05), 3.08 + i * 0.15, q[1] + rng.range(-0.05, 0.05), 1.3, 0.15, 0.9, C.linen, { b: 0.06, k: 0.93 + 0.07 * (i % 2), kb: 0.86 });
  const bz = rng.range(-0.8, 0.8); cane(G, [-3.2, 3.1, bz], [2.6, 3.12, bz + rng.range(-0.5, 0.5)], C, rng);
  if (blobs) { const c = Math.cos(ry), s = Math.sin(ry); for (const tx of [-2.9, 0, 2.9]) blobs.push([x + tx * c, y + 0.04, z - tx * s, 2.6, 2.6]); }
  G.at(0, 0, 0);
}
// the painter's scaffold against a wall: poles, ledgers, braces, three plank stages, a ladder, pots and a bucket on a rope.
// (x, y, z) = foot of its middle on the wall line; ry turns local +z (out from the wall) into the room; w wide, three stages of 6 m
function scaffold(G, x, y, z, ry, w, C, rng, blobs) {
  G.at(x, y, z, ry); G.sway = [0, 0, 0, 0];
  const d0 = 0.7, d1 = 3.7, H = 20.5, nb = Math.round(w / 4), xs = []; for (let i = 0; i <= nb; i++) xs.push(-w / 2 + i * w / nb);
  for (const px of xs) for (const pz of [d0, d1]) {
    const lean = rng.range(-0.12, 0.12);
    G.tube([[px, 0, pz], [px + lean * 0.5, H * 0.5, pz], [px + lean, H + rng.range(0, 1.6), pz]], (t) => 0.17 - 0.04 * t, 6, C.cane, (t, i) => (Math.abs(((t * 9) % 1) - 0.5) > 0.45 ? 0.6 : 0.86 + 0.14 * (i % 2)));
    G.box(px, 0.12, pz, 0.7, 0.24, 0.7, C.wood, { b: 0.05, k: 0.8 });
  }
  for (let s = 1; s <= 3; s++) {
    const yy = s * 6;
    for (const pz of [d0, d1]) G.tube([[-w / 2 - 0.7, yy - 0.25, pz], [w / 2 + 0.7, yy - 0.25, pz]], 0.13, 6, C.cane, (t, i) => 0.8 + 0.16 * (i % 2));
    for (const px of xs) { G.tube([[px, yy - 0.08, d0 - 0.5], [px, yy - 0.08, d1 + 0.5]], 0.11, 5, C.cane); G.tube([[px - 0.2, yy - 0.5, d0], [px + 0.2, yy + 0.1, d0]], 0.2, 5, C.cord, (t, i) => 0.8 + 0.2 * (i % 2)); }
    for (let b = 0; b < 4; b++) G.box(rng.range(-0.3, 0.3), yy + 0.1, d0 + 0.42 + b * 0.75, w + rng.range(0.2, 1.4), 0.13, 0.7, C.wood, { b: 0.03, k: rng.range(0.82, 1.08) });
    G.tube([[-w / 2, yy + 1.5, d1], [w / 2, yy + 1.5, d1]], 0.09, 5, C.cane);                                   // guard rail
    const n = 2 + (s % 2);
    for (let i = 0; i < n; i++) pot(G, rng.range(-w / 2 + 1, w / 2 - 1), yy + 0.17, rng.range(d0 + 0.7, d1 - 0.9), C.paints[(i + s) % 3], C, rng, null);
    shell(G, rng.range(-w / 2 + 1, w / 2 - 1), yy + 0.17, d1 - 0.5, rng.pick(C.paints), C, rng);
    const lx = rng.range(-w / 2 + 2, w / 2 - 2);
    for (let i = 0; i < 3; i++) G.box(lx, yy + 0.25 + i * 0.15, d0 + 0.9, 1.3, 0.15, 0.9, C.linen, { b: 0.06, k: 0.93 + 0.07 * (i % 2), kb: 0.86 });
  }
  for (let i = 0; i < nb; i++) { const a = xs[i], b = xs[i + 1], up = i % 2; G.tube([[a, up ? 12 : 0.4, d1 + 0.12], [b, up ? 0.4 : 12, d1 + 0.12]], 0.09, 5, C.cane, (t, k) => 0.75 + 0.15 * (k % 2)); }   // braces
  const lx = w / 2 - 1.6;                                                                                     // the ladder
  for (const sx of [-0.55, 0.55]) G.tube([[lx + sx, 0, d1 + 2.6], [lx + sx, 19.5, d1 + 0.25]], 0.1, 5, C.wood);
  for (let r = 0; r < 24; r++) { const t = (r + 1) / 25; G.tube([[lx - 0.55, 19.5 * t, d1 + 2.6 - 2.35 * t], [lx + 0.55, 19.5 * t, d1 + 2.6 - 2.35 * t]], 0.06, 4, C.wood, () => 0.85); }
  const bx = -w / 2 + 1.2;                                                                                     // a bucket on a rope from the top ledger
  // the pivot is the rope's top in the world, turned and placed as G.at turns and places the scaffold: the vertex writer stores a pivot as given and the
  // shader turns world positions about it (given in the scaffold's own frame, as it was, rope and bucket turned stiffly about a point far off)
  { const c = Math.cos(ry), sn = Math.sin(ry); G.pivot = [x + bx * c + (d1 + 0.9) * sn, y + 17.75, z - bx * sn + (d1 + 0.9) * c]; }
  G.sway = [1, rng() * 6.28, 0.05, 1.1];
  G.tube([[bx, 17.75, d1 + 0.9], [bx, 12, d1 + 0.9], [bx, 6.9, d1 + 0.9]], 0.05, 5, C.cord);
  G.lathe(bx, d1 + 0.9, [[0.34, 5.9, 0.7], [0.46, 6.9, 1], [0.42, 6.92, 0.6], [0.3, 6.1, 0.5]], 9, C.wood, { kf: (i) => 0.85 + 0.2 * (i % 2) });
  G.sway = [0, 0, 0, 0];
  if (blobs) { const c = Math.cos(ry), sn = Math.sin(ry); for (const px of xs) blobs.push([x + px * c + 2.2 * sn, y + 0.04, z - px * sn + 2.2 * c, 2.6, 2.6]); }
  G.at(0, 0, 0);
}
// linen sheet hanging from a pole: top centre (x, y, z), facing angle ry, width w, drop len; kind 3 billows, 3.3 billows and is sucked back;
// rise: the metres the pole climbs per level metre toward its local +x (0, a level pole): the pole and its two brackets follow it,
// and each point of the cloth is lifted by the rise times its own place along the pole, measured level from the pole's middle, so the cloth hangs plumb and its hem runs parallel to the pole
function sheet(G, x, y, z, ry, w, len, C, rng, amp = 0.45, kind = 3, rise = 0) {
  G.at(x, y, z, ry);
  G.sway = [0, 0, 0, 0];
  G.tube([[-w / 2 - 0.6, 0.1 - rise * (w / 2 + 0.6), 0], [w / 2 + 0.6, 0.1 + rise * (w / 2 + 0.6), 0]], 0.13, 6, C.wood);
  for (const sx of [-1, 1]) { const bx = sx * (w / 2 + 0.3); G.tube([[bx, 0.1 + rise * bx, 0], [bx, 0.3 + rise * bx, -0.45]], 0.07, 5, C.iron); }
  const nu = 10, nv = 14, base = G.n, ph = rng() * 6.28, folds = rng.range(2.2, 3.4), tone = rng.range(0.94, 1.03);
  G.sway = [kind, ph, amp, rng.range(1.5, 2.1)];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu - 0.5, v = j / nv, pinch = 1 - 0.1 * Math.sin(v * Math.PI) - 0.06 * v;
    const fz = (0.1 + 0.3 * v) * Math.sin(u * folds * 6.283 + ph), dz = (0.1 + 0.3 * v) * Math.cos(u * folds * 6.283 + ph) * folds * 6.283 / (w * pinch);
    const hem = j === nv ? 0.3 * Math.sin(u * 9 + ph) : 0, l = Math.hypot(dz, 1);
    G.v(u * w * pinch, -v * len + hem * 0.3 + rise * u * w * pinch, 0.12 + fz, -dz / l, 0.05, 1 / l, C.linen, tone * (0.9 + 0.1 * Math.cos(u * folds * 6.283 + ph)) * (j === 0 ? 0.86 : 1) * (1 - 0.05 * v), Math.pow(v, 1.3));
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const p = base + j * (nu + 1) + i, q = p + 1, r = p + nu + 2, s = p + nu + 1; G.idx.push(p, r, q, p, s, r); }
  G.cloths.push([base, G.n - 1]);
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
}
// plumb bob on a cord from (x, y, z), cord length len
function plumb(G, x, y, z, len, C, rng, amp = 0.035) {
  G.pivot = [x, y, z]; G.sway = [1, rng() * 6.28, amp, Math.sqrt(9.8 / len) * 1.0];
  G.tube([[x, y, z], [x, y - len * 0.5, z], [x, y - len, z]], 0.045, 5, C.cord);
  G.lathe(x, z, [[0.0001, -0.95, 0.7], [0.15, -0.55, 0.9], [0.24, -0.25, 1.1], [0.22, -0.02, 1], [0.1, 0.08, 0.8], [0.06, 0.22, 0.8]].map((p) => [p[0], y - len + p[1], p[2]]), 10, C.iron);
  G.sway = [0, 0, 0, 0];
}
// iron ring on a staple at (x, y, z) with a frayed thread end of length len
function ring(G, x, y, z, len, C, rng) {
  G.sway = [0, 0, 0, 0];
  G.tube([[x, y, z], [x, y - 0.5, z]], 0.09, 5, C.iron);
  const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; pts.push([x + 0.5 * Math.cos(a), y - 1 + 0.5 * Math.sin(a), z]); }
  G.pivot = [x, y - 0.5, z]; G.sway = [2, rng() * 6.28, 0.14, 0.8];   // the ring swings on its staple, the thread end under it in the draught (8 and 13 degrees)
  G.tube(pts, 0.08, 6, C.iron, (t, i) => 0.8 + 0.3 * (i % 2));
  G.pivot = [x, y - 1.5, z]; G.sway = [1, rng() * 6.28, 0.22, Math.sqrt(9.8 / Math.max(len, 1))];
  G.tube([[x, y - 1.5, z], [x, y - 1.5 - len * 0.5, z], [x, y - 1.5 - len, z]], (t) => 0.05 - 0.015 * t, 5, C.thread);
  G.sway = [0, 0, 0, 0];
}

// ---------------------------------------------------------------- garden masses (all nod in the vertex shader)
// a cypress as a soft dark flame: a core spindle and many small rounded plumes of leaf mass standing off it, each on its
// own beat; every plume is smooth (round in section, lumps as slow waves, no points), so the outline is feathered, not faceted
function cypress(G, x, z, h, w, C, rng, fine = 1) {
  const ph = rng() * 6.28, lean = rng.range(-0.02, 0.02), amp = 0.6 + h * 0.014, fr = rng.range(0.45, 0.7);
  const core = (t) => w * (t < 0.3 ? 0.55 + 0.45 * Math.sin(Math.PI / 2 * t / 0.3) : Math.pow(Math.cos(Math.PI / 2 * (t - 0.3) / 0.7), 0.9));
  const flame = (cx, cz, y0, hh, r, rows, seg, wf, tip = 0.75) => {
    const prof = [], p1 = rng() * 6.28, p2 = rng() * 6.28, n1 = rng.int(2, 3), n2 = rng.int(4, 6);
    for (let j = 0; j <= rows; j++) { const t = j / rows, rr = t < 0.3 ? Math.pow(Math.sin(Math.PI / 2 * t / 0.3), 0.7) : Math.pow(Math.cos(Math.PI / 2 * (t - 0.3) / 0.7), tip); prof.push([r * rr + 0.04, y0 + hh * t, 0.62 + 0.46 * t, t > 0.5 ? C.leafA : C.leafB]); }
    const lump = (i, j) => 1 + 0.13 * Math.sin(i / seg * 6.283 * n1 + j * 0.9 + p1) + 0.08 * Math.sin(i / seg * 6.283 * n2 - j * 1.7 + p2);
    G.lathe(cx, cz, prof, seg, C.leafB, { lump, kf: (i, j) => 0.5 + 0.5 * lump(i, j), weight: wf });
  };
  G.at(x, 0, z, rng() * 6.28);
  G.sway = [0, 0, 0, 0]; G.tube([[0, 0, 0], [0, 3, 0]], 0.9, 6, C.bark, (t) => 0.7 + 0.2 * t);
  G.sway = [4, ph, amp, fr];
  flame(lean * h, 0, 2, h * 0.88, w * 0.78, fine ? 18 : 12, fine ? 16 : 10, (j) => Math.pow(j / (fine ? 18 : 12) * 0.88, 2));
  const n = fine ? 30 : 14, rows = fine ? 6 : 4, seg = fine ? 9 : 7;
  for (let i = 0; i < n; i++) {
    const t0 = 0.05 + 0.78 * (i + rng.range(-0.3, 0.3)) / n, a = i * 2.4 + rng.range(-0.4, 0.4), off = core(t0) * rng.range(0.6, 0.86), hh = h * rng.range(0.1, 0.19);
    G.sway = [4, ph + 0.5 + i * 0.9, amp * rng.range(1, 1.35), fr * rng.range(1.15, 1.6)];
    flame(lean * h + Math.cos(a) * off, Math.sin(a) * off, 2 + h * t0 - hh * 0.2, hh, w * rng.range(0.2, 0.32), rows, seg, (j) => Math.pow(t0 + (j / rows) * hh / h, 2) + 0.3 * Math.pow(j / rows, 1.5));
  }
  for (let i = 0; i < 3; i++) {       // the feathered tip
    const a = rng() * 6.28, hh = h * rng.range(0.12, 0.18);
    G.sway = [4, ph + 2 + i * 1.7, amp * 1.5, fr * rng.range(1.5, 2)];
    flame(lean * h + Math.cos(a) * w * 0.12, Math.sin(a) * w * 0.12, h * (1.0 - i * 0.05) - hh, hh, w * 0.15, rows, seg, (j) => 0.5 + 0.5 * Math.pow(j / rows, 1.5), 0.6);
  }
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
}
// an umbrella pine: a leaning trunk, bare boughs and flat scalloped pads of needles in three tiers, dark underneath
function pine(G, x, z, h, C, rng) {
  const bx = rng.range(-5, 5), bz = rng.range(-5, 5), ph = rng() * 6.28, top = h * 0.7, n = rng.int(10, 13);
  G.at(x, 0, z, 0);
  G.sway = [4, ph, 0.3, 0.5];
  G.tube([[0, 0, 0], [bx * 0.15, top * 0.35, bz * 0.15], [bx * 0.6, top * 0.75, bz * 0.6], [bx, top, bz]], (t) => 1.7 - 0.7 * t, 7, C.bark, (t, i) => 0.75 + 0.2 * (i % 2) + 0.1 * t);
  for (let k = 0; k < n; k++) {
    const tier = k % 3, a = k / n * 6.283 + rng() * 0.7, d = k === 0 ? 0 : rng.range(0.16, 0.4) * h, R = rng.range(0.13, 0.2) * h * (k === 0 ? 1.25 : 1), cx = bx + Math.cos(a) * d, cz = bz + Math.sin(a) * d;
    const cy = top + h * (0.06 + 0.085 * tier - 0.07 * (d / (0.4 * h)) ** 2) + rng.range(-0.012, 0.012) * h, ry = R * rng.range(0.2, 0.3);
    G.sway = [4, ph, 0.3, 0.5];
    G.tube([[bx, top - 2 - tier * 2, bz], [bx + (cx - bx) * 0.6, top + (cy - top) * 0.45, bz + (cz - bz) * 0.6], [cx, cy - ry * 0.3, cz]], (t) => 0.8 - 0.45 * t, 5, C.bark, (t, i) => 0.7 + 0.2 * (i % 2));
    const prof = [], lum = [], sc = rng.int(3, 5), sp = rng() * 6.28;
    for (let j = 0; j <= 6; j++) { const t = j / 6; prof.push([R * (j === 0 ? 0.03 : j === 1 ? 0.7 : j === 2 ? 1 : Math.pow(Math.cos(Math.PI / 2 * (t - 0.33) / 0.67), 0.6) + 0.01), cy + ry * (j === 0 ? -0.5 : j === 1 ? -0.42 : j === 2 ? 0 : (t - 0.33) / 0.67), j < 2 ? 0.5 : 0.74 + 0.4 * t, j > 2 ? C.leafA : C.leafB]); }
    for (let i = 0; i < 70; i++) lum.push(rng.range(0.8, 1.16));
    G.sway = [4, ph + k, 0.55, rng.range(0.4, 0.6)];
    G.lathe(cx, cz, prof, 10, C.leafA, { lump: (i, j) => (j === 1 || j === 2 ? 1 + 0.13 * Math.sin(i / 10 * 6.283 * sc + sp) : 1) * (0.92 + 0.1 * lum[j * 10 + i]), kf: (i, j) => 0.7 + 0.32 * lum[j * 10 + i], weight: () => 1 });
  }
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
}
// The clipped bay that stands inside the house: [x, the floor's y, z, scale] (see build, after the roofs are furnished).
// THEIR CLEAR AIR, counted once on the flown line at 40,001 points (each tree as a ball about its crown's middle, of the widest lump's radius plus the
// lathe's off-centre plus the furthest nod, and its pot as an upright drum): the least to a ball is 3.75 m (the east tree of the pair at the north
// door, which the line passes at u 0.375; its west tree 5.00 m), then 4.10 m (the tree west of the gallery's south door, u 0.568; the east one
// 12.55 m), 6.10 m or more for the court's eight and 11.26 m for the bay's one; the least to a pot's drum is 7.62 m (the stem between drum and ball
// is in neither shape: a separate reader's count on the built trees of 200 seeds gives 6.86 m at the least for pot and stem, and no crown nearer than its ball).
// WHAT THEY STAND CLEAR OF (that reader's scripts on the built masonry, the crown with its furthest nod; 400 seeds for the plinths, 60 for
// the rest): the two pylons' plinths, which hang out over the sunk court's north end to z -182.9 (2.1 m or more); the copings of the threshold's side
// blocks at the north door (0.62 m or more); the gallery's south wall (0.73 m); the bay's west wall (0.99 m); the scaffold by the south door (1.6 m).
// WHAT THEY STAND BEFORE, from the pictures' points (the same scripts, rays against the masonry on seed 7, and stills): none of them is in the frame at V2,
// at the point of the fan of rays (u 0.77) or at V3, nor in any still of seed 7 at a hundredth of the flight from 0.54 on (from the fan's point the
// court's trees lie below the frame, on the sunk court's floor, and no face of the fan is behind them). From the sphere's point (V1) the last tree of the court's east row stands low in the frame
// to the right and the top of the west row's last shows as a strip at the frame's lower edge, over stair A's parapet; no painted face lies behind
// either, and both are clear of the sphere, its stand and its band. From the entry point the four trees of the court's west row show as one small
// clump (about 15 by 22 pixels of a still of 640 by 360) through the cellar's far arch, right of the astrolabe's hub, before the bright court and
// about half of what shows there of the landing's umber dado; no painted face lies behind them (the astrolabe is laid beyond the cellar only west of
// x -13.9). From the doorcase's point at the foot of stair B the pair at the north door stands in the door's opening, between the painted columns and
// above the painted podium band, on none of them (where that band falls on the threshold's floor it ends at z -128.69; the pots end at z -127.89);
// through the open door the south door's pair shows small beside it, far down the gallery, with no paint behind.
const COURT_BAY = [[-8, 0, -138.5, 1.1], [8, 0, -138.5, 1.1], [-8, 0, -151.5, 1], [8, 0, -151.5, 1], [-8, 0, -164.5, 1.1], [8, 0, -164.5, 1.1], [-8, 0, -177.5, 1], [8, 0, -177.5, 1],
  [19, 18, -126.6, 0.6], [29, 18, -126.6, 0.6], [-4.6, 18, -3.4, 0.8], [12.6, 18, -3.4, 0.8], [-46.3, 18, -13.5, 0.8]];
// clipped bay ball in a big terracotta pot
function bay(G, x, z, C, rng, blobs, y = 0, nod = 0.12, size = 0) {   // size: the tree's scale, typed; where none is handed it is dealt as before, from the same draw
  const s = size || rng.range(0.9, 1.15), ph = rng() * 6.28;
  G.at(x, y, z, rng() * 6.28, s);
  G.sway = [0, 0, 0, 0];
  G.lathe(0, 0, [[1.3, 0, 0.6], [1.45, 0.3, 0.85], [1.25, 0.5, 0.75], [1.7, 1.8, 0.95], [2.0, 2.7, 1.05], [2.15, 2.9, 1.1], [2.1, 3.1, 1.1], [1.8, 3.05, 0.7], [0.0001, 2.9, 0.45]], 12, C.terra, { kf: (i) => 0.9 + 0.12 * ((i * 5) % 4) / 3 });
  G.tube([[0, 2.9, 0], [0.1, 5.5, 0.05]], 0.28, 5, C.bark);
  const lum = []; for (let i = 0; i < 80; i++) lum.push(rng.range(0.9, 1.1));
  const prof = []; for (let j = 0; j <= 7; j++) { const t = j / 7; prof.push([2.9 * Math.sin(Math.PI * Math.min(Math.max(t, 0.002), 0.998)) + 0.01, 7.8 - 2.9 * Math.cos(Math.PI * t), 0.66 + 0.4 * t, t > 0.45 ? C.leafA : C.leafB]); }
  G.sway = [4, ph, nod, 0.8];
  G.lathe(0.1, 0.05, prof, 10, C.leafA, { lump: (i, j) => lum[j * 10 + i], kf: (i, j) => 0.6 + 0.42 * lum[j * 10 + i], weight: () => 1 });
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
  if (blobs) blobs.push([x, y + 0.05, z, 3.4 * s, 3.4 * s]);
}
// the room a hung cloth has. Every cloth vertex (kinds 3 and 3.3) of the sheets in the accumulators Gs looks along its own normal, behind it and before it,
// as far as its billow can carry it (its amplitude times its weight times the two waves' 1.5, or 1.8 for the draught kind) and a margin of 0.15 m further,
// for a face of the building's masonry (the hero's meshes of the wing material; the door leaf, which swings, is not asked). Where it finds one, the distance
// less the margin is written beside its weight (aPiv.y behind, aPiv.z before; never less than a millimetre, so that 0 keeps meaning free air), and the
// shader presses the cloth softly against that face instead of passing it. The work: each sheet (sheet() has noted its run of vertices) takes its box, grown
// by its furthest reach and the margin, and is entered in the 8 m cells that box covers; the masonry's triangles are gone through once, and each is handed
// to the sheets of the cells its own box covers whose boxes it meets; then each vertex of a sheet asks only those of its sheet's triangles whose box its own
// line meets. The builder is asked to pause every 2048 triangles and after every sheet (the engine hands the page back only when a few milliseconds have
// gone by), so that no piece of this work holds the picture.
async function clothRoom(ctx, Gs, hero) {
  const MARGIN = 0.15, CELL = 8, sheets = [];
  let gx0 = Infinity, gz0 = Infinity, gx1 = -Infinity, gz1 = -Infinity;
  for (const G of Gs) for (const [v0, v1] of G.cloths) {
    const mx = G.sw[v0 * 4] > 3.15 ? 1.8 : 1.5, far = G.sw[v0 * 4 + 2] * mx + MARGIN;   // the sheet's furthest reach (weight 1) and the margin
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let v = v0; v <= v1; v++) { const x = G.pos[v * 3], y = G.pos[v * 3 + 1], z = G.pos[v * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    const S = { G, v0, v1, mx, x0: x0 - far, y0: y0 - far, z0: z0 - far, x1: x1 + far, y1: y1 + far, z1: z1 + far, tri: [], last: -1 };
    S.cx0 = Math.floor(S.x0 / CELL); S.cx1 = Math.floor(S.x1 / CELL); S.cz0 = Math.floor(S.z0 / CELL); S.cz1 = Math.floor(S.z1 / CELL);
    if (S.cx0 < gx0) gx0 = S.cx0; if (S.cx1 > gx1) gx1 = S.cx1; if (S.cz0 < gz0) gz0 = S.cz0; if (S.cz1 > gz1) gz1 = S.cz1;
    sheets.push(S);
  }
  if (!sheets.length) return;
  const nz = gz1 - gz0 + 1, cells = new Array((gx1 - gx0 + 1) * nz).fill(null);   // the cells the sheets' boxes span, each with the sheets entered in it
  for (const S of sheets) for (let cx = S.cx0; cx <= S.cx1; cx++) for (let cz = S.cz0; cz <= S.cz1; cz++) { const k = (cx - gx0) * nz + cz - gz0; (cells[k] || (cells[k] = [])).push(S); }
  await ctx.yield();
  const meshes = []; hero.object.traverse((o) => { if (o.isMesh && o.material === hero.materials.wing) meshes.push(o); });
  let t = 0;
  for (const o of meshes) {
    const P = o.geometry.attributes.position.array, I = o.geometry.index ? o.geometry.index.array : null, n = I ? I.length : P.length / 3;
    for (let i = 0; i < n; i += 3) {
      const a = (I ? I[i] : i) * 3, b = (I ? I[i + 1] : i + 1) * 3, c = (I ? I[i + 2] : i + 2) * 3;
      const ax = P[a], az = P[a + 2], bx = P[b], bz = P[b + 2], cx = P[c], cz = P[c + 2];
      const x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx), x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx), z0 = az < bz ? (az < cz ? az : cz) : (bz < cz ? bz : cz), z1 = az > bz ? (az > cz ? az : cz) : (bz > cz ? bz : cz);
      const hx0 = Math.max(Math.floor(x0 / CELL), gx0), hx1 = Math.min(Math.floor(x1 / CELL), gx1), hz0 = Math.max(Math.floor(z0 / CELL), gz0), hz1 = Math.min(Math.floor(z1 / CELL), gz1);
      for (let gx = hx0; gx <= hx1; gx++) for (let gz = hz0; gz <= hz1; gz++) {
        const l = cells[(gx - gx0) * nz + gz - gz0]; if (!l) continue;
        for (let k = 0; k < l.length; k++) {
          const S = l[k]; if (S.last === t) continue; S.last = t;
          const ay = P[a + 1], by = P[b + 1], cy = P[c + 1], y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy), y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);
          if (x0 > S.x1 || x1 < S.x0 || z0 > S.z1 || z1 < S.z0 || y0 > S.y1 || y1 < S.y0) continue;
          S.tri.push(ax, ay, az, bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az, x0, y0, z0, x1, y1, z1);   // a corner, two edges, the box
        }
      }
      if ((++t & 2047) === 0) await ctx.yield();
    }
  }
  await ctx.yield();
  for (const S of sheets) {
    if (!S.tri.length) continue;
    const G = S.G, N = Float32Array.from(S.tri), nN = N.length;
    for (let v = S.v0; v <= S.v1; v++) {
      const reach = G.sw[v * 4 + 2] * G.piv[v * 3] * S.mx; if (reach < 0.02) continue;
      const ox = G.pos[v * 3], oy = G.pos[v * 3 + 1], oz = G.pos[v * 3 + 2], dx = G.nor[v * 3], dy = G.nor[v * 3 + 1], dz = G.nor[v * 3 + 2], lim = reach + MARGIN;
      const rx = Math.abs(dx) * lim, ry = Math.abs(dy) * lim, rz = Math.abs(dz) * lim;
      let back = lim, front = lim;
      for (let q = 0; q < nN; q += 15) {   // the line through the vertex along its normal against one triangle: s is the signed distance along it
        if (N[q + 9] > ox + rx || N[q + 12] < ox - rx || N[q + 11] > oz + rz || N[q + 14] < oz - rz || N[q + 10] > oy + ry || N[q + 13] < oy - ry) continue;
        const e1x = N[q + 3], e1y = N[q + 4], e1z = N[q + 5], e2x = N[q + 6], e2y = N[q + 7], e2z = N[q + 8];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (det > -1e-9 && det < 1e-9) continue;
        const inv = 1 / det, tx = ox - N[q], ty = oy - N[q + 1], tz = oz - N[q + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, w = (dx * qx + dy * qy + dz * qz) * inv; if (w < 0 || u + w > 1) continue;
        const s = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (s >= 0) { if (s < front) front = s; } else if (-s < back) back = -s;
      }
      if (back < lim) G.piv[v * 3 + 1] = Math.max(back - MARGIN, 0.001);
      if (front < lim) G.piv[v * 3 + 2] = Math.max(front - MARGIN, 0.001);
    }
    await ctx.yield();
  }
}

// a drying line between two posts from (x0, z0) to (x1, z1), top at y + h, with n sheets on it
function dryLine(G, x0, z0, x1, z1, y, h, n, C, rng, blobs) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
  G.at(0, 0, 0); G.sway = [0, 0, 0, 0];
  for (const [px, pz] of [[x0, z0], [x1, z1]]) {
    G.tube([[px, y, pz], [px, y + h + 0.6, pz]], (t) => 0.2 - 0.06 * t, 6, C.cane, (t, i) => (Math.abs(((t * 6) % 1) - 0.5) > 0.44 ? 0.6 : 0.86 + 0.14 * (i % 2)));
    G.box(px, y + 0.2, pz, 1.1, 0.4, 1.1, C.stone, { b: 0.08, k: 0.92 });
    if (blobs) blobs.push([px, y + 0.04, pz, 1.5, 1.5]);
  }
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([x0 + dx * t, y + h - 0.5 * Math.sin(t * Math.PI), z0 + dz * t]); }
  G.tube(pts, 0.05, 5, C.cord);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5 + rng.range(-0.18, 0.18)) / n, w = Math.min(L / n * rng.range(0.6, 0.86), 9), len = (h - 1.2) * rng.range(0.72, 0.97);
    sheet(G, x0 + dx * t, y + h - 0.55 * Math.sin(t * Math.PI) - 0.1, z0 + dz * t, ry, w, len, C, rng, rng.range(0.9, 1.5));
    if (blobs) blobs.push([x0 + dx * t, y + 0.04, z0 + dz * t, w * 0.5, 1.6]);
  }
}
// the roofs: linen drying on lines, bay in pots, the painter's scaffold and a trestle, all south of V3 so none of it takes paint
function* furnishTerrace(G, C, rng, blobs) {
  dryLine(G, -13, -237.2, 13, -237.2, 52, 6.6, 3, C, rng, blobs);        // along the court's north parapet, under the last turn
  dryLine(G, -47.5, -168, -47.5, -216, 52, 7, 5, C, rng, blobs);         // on the west walk
  yield 0;
  dryLine(G, 40, -18, 40, -70, 52, 7, 5, C, rng, blobs);                 // on the gallery roof
  dryLine(G, -8, -108, 26, -118, 52, 7, 4, C, rng, blobs);
  yield 0;
  scaffold(G, 23, 52, -239, 0, 16, C, rng.fork('scaffold'), blobs);      // free-standing by the cistern's south-east corner
  yield 0;
  trestle(G, -22, 52, -235.2, rng.range(-0.06, 0.06), C, rng, blobs);
  for (const [x, z] of [[-46.5, -236.5], [38, -236], [47.5, -256], [47.5, -280], [47.5, -303], [-48, -144], [-48, -226], [44, -122], [2, -120.5], [46, -4], [-16, -6], [10, -64]]) bay(G, x, z, C, rng, blobs, 52);
  yield 0;
  for (const sp of [[-30, 52, -233.4], [-36, 52, -231.8], [14, 52, -121]]) {
    const a0 = rng() * 6.28;
    for (let i = 0; i < 4; i++) { const a = a0 + i * 1.57 + rng.range(-0.3, 0.3), r = i === 0 ? 0 : rng.range(1.3, 2.4); pot(G, sp[0] + Math.cos(a) * r, sp[1], sp[2] + Math.sin(a) * r * 0.5, C.paints[i % 3], C, rng, blobs); }
  }
  cane(G, [-9.5, 52, -232.2], [-12, 61.5, -230.9], C, rng, 0.008); cane(G, [-25, 52, -232.4], [-23, 61.2, -230.9], C, rng, 0);
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
}
// one fig leaf, 5 lobes, about 2 r across, lying in the local xz plane with its stalk at the origin
function figLeaf(G, r, col, k = 1, w = 1) {
  const base = G.n, n = 20; G.v(0, 0, 0, 0, 1, 0, col, k * 0.8, w * 0.3);
  for (let i = 0; i <= n; i++) {
    const a = (i / n - 0.5) * 4.6, lob = 0.5 + 0.5 * Math.pow(Math.abs(Math.cos(a * 1.25)), 0.55), rr = r * (0.9 + 0.9 * lob) * (1 - 0.18 * Math.abs(a) / 2.3);
    G.v(Math.sin(a) * rr, 0.07 * rr * Math.cos(a * 2.5) - 0.04 * rr, r * 0.35 + Math.cos(a) * rr, 0, 1, 0.1, col, k * (0.86 + 0.2 * lob), w);
  }
  for (let i = 0; i < n; i++) G.idx.push(base, base + 1 + i, base + 2 + i);
}
function fig(G, x, z, C, rng) {
  const ph = rng() * 6.28, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), T = new THREE.Vector3();
  G.at(x, 0, z, 0); G.sway = [0, 0, 0, 0];
  const ends = [];
  G.tube([[0, 0, 0], [0.6, 4, 0.3], [0.2, 8, -0.4]], (t) => 1.5 - 0.5 * t, 8, C.barkPale, (t, i) => 0.8 + 0.15 * (i % 2));
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * 6.283 + rng() * 0.6, L = rng.range(8, 13), e = [Math.cos(a) * L, 8 + rng.range(6, 13), Math.sin(a) * L];
    G.tube([[0.2, 7, -0.4], [e[0] * 0.4, 8 + (e[1] - 8) * 0.65, e[2] * 0.4], e], (t) => 0.8 - 0.55 * t, 6, C.barkPale, (t, i) => 0.78 + 0.15 * (i % 2));
    ends.push(e, [e[0] * 0.55, 8 + (e[1] - 8) * 0.8, e[2] * 0.55]);
  }
  for (let i = 0; i < 64; i++) {
    const e = ends[i % ends.length];
    T.set(x + e[0] + rng.range(-3, 3), e[1] + rng.range(-2.5, 2), z + e[2] + rng.range(-3, 3));
    E.set(rng.range(-0.9, 0.5), rng() * 6.28, rng.range(-0.6, 0.6)); Q.setFromEuler(E); M.compose(T, Q, S); G.M.copy(M);
    G.sway = [4, ph + i * 0.7, 0.45, rng.range(0.7, 1.2)];   // the fig's leaves nod by two thirds of a metre: it stands in the bright band the cellar looks out on
    figLeaf(G, rng.range(1.1, 1.6), rng() < 0.5 ? C.leafA : C.leafB, rng.range(0.85, 1.15), 1);
  }
  G.sway = [0, 0, 0, 0]; G.at(0, 0, 0);
}
// far things in paler grey (the haze in the shader does the paling): a bell tower and a block of roofs
function tower(G, x, z, h, C, ry) {
  G.at(x, 0, z, ry); const w = 15;
  G.box(0, h * 0.4, 0, w, h * 0.8, w, C.plaster, { b: 0.3, k: 0.9, kb: 0.85 });
  for (const yy of [0.3, 0.55, 0.8]) G.box(0, h * yy, 0, w + 1.4, 1.6, w + 1.4, C.stone, { b: 0.3, k: 0.86 });
  G.box(0, h * 0.9, 0, w - 1.5, h * 0.2, w - 1.5, C.plaster, { b: 0.3, k: 0.92 });
  for (let f = 0; f < 4; f++) { const a = f * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), d = (w - 1.5) / 2 + 0.05;
    for (const o of [-2.8, 2.8]) { const px = c * d - s * o, pz = s * d + c * o, qx = c * d - s * (o + (o < 0 ? 3.6 : -3.6) * 0 ) , e = 1.6;
      G.quad([px + s * e, h * 0.83, pz - c * e], [px - s * e, h * 0.83, pz + c * e], [px - s * e, h * 0.96, pz + c * e], [px + s * e, h * 0.96, pz - c * e], C.umber, 0.75); } }
  G.box(0, h + 0.8, 0, w + 0.6, 1.6, w + 0.6, C.stone, { b: 0.3, k: 0.88 });
  G.lathe(0, 0, [[w * 0.62, h + 1.6, 0.9], [0.0001, h + 1.6 + w * 0.7, 1.05]], 4, C.terra, { kf: (i) => 0.85 + 0.1 * (i % 2) });
  G.at(0, 0, 0);
}
function roofs(G, x, z, C, rng) {
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const L = rng.range(40, 90), W = rng.range(22, 34), H = rng.range(22, 44), ox = rng.range(-70, 70), oz = rng.range(-70, 70), rh = W * 0.22;
    G.at(x + ox, 0, z + oz, rng.pick([0, Math.PI / 2]) + rng.range(-0.1, 0.1));
    G.box(0, H / 2, 0, L, H, W, C.plaster, { b: 0.2, k: rng.range(0.8, 0.95), kb: 0.8 });
    G.quad([-L / 2 - 1, H, W / 2 + 1], [L / 2 + 1, H, W / 2 + 1], [L / 2 + 1, H + rh, 0], [-L / 2 - 1, H + rh, 0], C.terra, 0.9);
    G.quad([L / 2 + 1, H, -W / 2 - 1], [-L / 2 - 1, H, -W / 2 - 1], [-L / 2 - 1, H + rh, 0], [L / 2 + 1, H + rh, 0], C.terra, 0.8);
    for (const s of [-1, 1]) G.quad([s * L / 2, H, -W / 2], [s * L / 2, H, W / 2], [s * L / 2, H + rh, 0], [s * L / 2, H + rh, 0], C.plaster, 0.85);
  }
  G.at(0, 0, 0);
}
// a dove about 1.4 m long (four times life), beak toward +z, feet at y 0; the head nods about the neck
function dove(G, C) {
  G.lit = false; G.sway = [0, 0, 0, 0];
  const body = [[0, 0.62, -0.62], [0, 0.6, -0.4], [0, 0.6, -0.1], [0, 0.66, 0.2], [0, 0.76, 0.42], [0, 0.86, 0.52]];
  G.tube(body, (t) => 0.05 + 0.27 * Math.pow(Math.sin(Math.PI * Math.min(t * 0.92 + 0.06, 1)), 0.8), 9, C.dove, (t, i) => (i > 0 && i < 4 ? 1.08 : 0.9) * (t < 0.2 ? 0.8 : 1));
  for (const s of [-1, 1]) {   // folded wings: a darker shield with two bars, and the legs
    G.quad([s * 0.27, 0.74, 0.28], [s * 0.29, 0.52, 0.12], [s * 0.2, 0.5, -0.7], [s * 0.22, 0.72, -0.3], C.doveWing, 1);
    G.quad([s * 0.3, 0.62, -0.2], [s * 0.3, 0.52, -0.22], [s * 0.26, 0.5, -0.5], [s * 0.26, 0.6, -0.48], C.umber, 0.8);
    G.tube([[s * 0.1, 0.4, 0.0], [s * 0.11, 0.05, 0.03]], 0.035, 4, C.terra);
    G.quad([s * 0.11 - 0.09, 0.02, 0.2], [s * 0.11 + 0.09, 0.02, 0.2], [s * 0.11 + 0.04, 0.02, -0.08], [s * 0.11 - 0.04, 0.02, -0.08], C.terra, 0.9);
  }
  G.quad([-0.16, 0.62, -0.55], [0.16, 0.62, -0.55], [0.22, 0.52, -1.05], [-0.22, 0.52, -1.05], C.doveWing, 0.92);   // tail
  G.pivot = [0, 0.8, 0.45]; G.sway = [2, 0, 0.16, 9];
  G.tube([[0, 0.8, 0.45], [0, 0.98, 0.56], [0, 1.1, 0.62], [0, 1.16, 0.7]], (t) => 0.13 + 0.05 * Math.sin(t * 3.1) - 0.07 * t * t, 8, C.dove, (t) => 0.95 + 0.1 * t);
  G.tube([[0, 1.1, 0.72], [0, 1.07, 0.9]], (t) => 0.045 - 0.03 * t, 5, C.umber);
  for (const s of [-1, 1]) G.quad([s * 0.125, 1.15, 0.66], [s * 0.125, 1.15, 0.72], [s * 0.125, 1.09, 0.72], [s * 0.125, 1.09, 0.66], C.iron, 1);
  G.sway = [0, 0, 0, 0]; G.lit = true;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'one-standing-place', name: 'The One Standing Place', category: 'interior', after: 'Emmanuel Maignan, 1601 to 1676', weirdness: 0.4,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- which visit: the look by hour, else by seed (three clearly different grisailles)
    let hh = Math.imul((ctx.seed | 0) + 1040, 0x9E3779B1); hh ^= hh >>> 15; hh = Math.imul(hh, 0x2C1B3C6D); hh ^= hh >>> 12;
    const hour = vary.hour || 'any', hs = (hh >>> 8) % 20;
    const lookName = hour === 'dawn' || hour === 'golden' || hour === 'night' ? 'sanguine' : hour === 'day' ? (hs < 12 ? 'umber' : 'verdaccio') : (hs < 9 ? 'umber' : hs < 15 ? 'verdaccio' : 'sanguine');
    const look = LOOKS[lookName];
    const gr = rng.fork('gear'), ga = rng.fork('garden'), lf = rng.fork('life');
    const hero = await buildHero(ctx, { palette: PALETTE, look: lookName, rare: !!vary.rare, cloud: look.cloud, bright: 1.05, deferSun: true });
    scene.add(hero.object);
    await ctx.yield();
    const HU = hero.uniforms, A = hero.anchors, col = (h) => new THREE.Color(h), mix = (a, b, t, k = 1) => a.clone().lerp(b, t).multiplyScalar(k);
    const cSky = col(look.sky); HU.uSky.value.copy(cSky);
    // the cistern holds this sky: its tone low down and overhead, its cloud bars and how much of it they cover
    HU.uSkyLo.value.copy(col(look.warm)); HU.uSkyHi.value.copy(col(look.cool)); HU.uSkyCl.value.copy(col(look.cloudLit)); HU.uSkyCv.value = look.cover;
    // streams of their own for what this file adds beside the gear, the garden and the life (nothing is drawn from those for them)
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed('one-standing-place:' + name + ':' + ctx.seed));
    const plaster = HU.uPlaster.value.clone(), stone = HU.uStone.value.clone(), umber = HU.uUmber.value.clone(), sienna = HU.uSienna.value.clone(), chalk = HU.uChalk.value.clone(), terra = HU.uTile.value.clone();
    const C = {
      plaster, stone, umber, sienna, chalk, terra: mix(terra, stone, 0.32), paints: look.paints.map(col), linen: col(look.linen), leafA: col(look.leafA), leafB: col(look.leafB),
      wood: mix(umber, stone, 0.42), cane: mix(sienna, stone, 0.6), cord: mix(umber, stone, 0.3), bristle: mix(stone, chalk, 0.4), iron: mix(umber, col('#1c1c1e'), 0.6), thread: mix(chalk, stone, 0.3),
      glazeA: mix(stone, chalk, 0.5), glazeB: mix(umber, sienna, 0.45, 0.9), bark: mix(umber, stone, 0.45, 0.8), barkPale: mix(stone, umber, 0.22),
      dove: mix(chalk, stone, 0.35), doveWing: mix(stone, umber, 0.28),
    };
    const time = { value: 0 };
    const sunU = { uDS: HU.uDS, uSunM: HU.uSunM, uSunPos: HU.uSunPos, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uAmb: HU.uAmb, uSunFar: HU.uSunFar, uSunRes: HU.uSunRes };
    const flatU = { uTime: time, uSky: { value: cSky }, uHaze: { value: look.haze }, uBright: { value: look.bright }, ...sunU };
    const flatMat = new THREE.ShaderMaterial({ uniforms: flatU, vertexShader: FLAT_VERT, fragmentShader: FLAT_FRAG, side: THREE.DoubleSide });

    // ---- sky and the garden sheet
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 24, 12), new THREE.ShaderMaterial({ uniforms: { uWarm: { value: col(look.warm) }, uCool: { value: col(look.cool) }, uSunSide: { value: col(look.sunSide) }, uCloudLit: { value: col(look.cloudLit) }, uCloudDark: { value: col(look.cloudDark) },
      uDisc: { value: col(look.disc) }, uHill: { value: col(look.hill) }, uSunDir: HU.uSunDir, uCover: { value: look.cover }, uTime: time }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    const gxs = [-4500, -1500, -600, -250, -120, -47, 47, 120, 250, 600, 1500, 4500], gzs = [-4650, -1650, -800, -450, -310, 4.5, 140, 300, 650, 1500, 4350], gp = [], gi = [];
    for (let j = 0; j < gzs.length; j++) for (let i = 0; i < gxs.length; i++) gp.push(gxs[i], -0.15, gzs[j]);
    for (let j = 0; j < gzs.length - 1; j++) for (let i = 0; i < gxs.length - 1; i++) {
      if (gxs[i] === -47 && gzs[j] === -310) continue;   // nothing under the wing itself
      const a = j * gxs.length + i, b = a + 1, c = a + gxs.length + 1, d = a + gxs.length; gi.push(a, c, b, a, d, c);
    }
    const groundGeo = new THREE.BufferGeometry(); groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); groundGeo.setIndex(gi); groundGeo.computeBoundingSphere();
    const ground = new THREE.Mesh(groundGeo, new THREE.ShaderMaterial({
      uniforms: { uSky: { value: cSky }, uGravel: { value: col(look.gravel) }, uLeafA: { value: C.leafA }, uLeafB: { value: C.leafB }, uStone: { value: stone }, uHaze: { value: look.haze }, uBright: { value: look.bright }, uWet: { value: lookName === 'verdaccio' ? 1 : 0 }, ...sunU },
      vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, side: THREE.DoubleSide }));
    ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- the painter's gear
    // A rule of the cellar (A.lane): from one end of the cellar to the other nothing of the painter's stands or hangs within
    // lane.clear (7 m) of the lane's axis. What would is moved to the nearest free place beside the lane in its own bay:
    //   a thing on the floor (footprint radius r) goes straight out on its own side to clear + r from the axis, and from there
    //   along the lane, half a metre at a time, until it is r clear of every pier and trestle and of the things moved before it;
    //   a sheet across the lane is hung flat, parallel to the lane, 0.8 m proud of an arcade's wall face, inside its own bay's
    //   arch, as near to where it hung as the sheets already on that face allow: on its own side's face, else on the face
    //   across the lane, else on the near face of the side aisle.
    // Nothing is drawn from the stream for this, so everything else is dealt exactly as before.
    const G = makeG(lightAt), blobs = [], lane = A.lane;
    const inLane = (x, y, z, r) => y < 17 && z < lane.z0 && z > lane.z1 && Math.abs(x - lane.x) < lane.clear + r;
    const bayOf = (z) => { const pz = lane.piers; let j = 0; while (j < pz.length - 2 && z <= pz[j + 1]) j++; return [pz[j + 1] + lane.pier / 2, pz[j] - lane.pier / 2]; };   // pier face to pier face
    const solid = [];   // rectangles [x0, x1, z0, z1] of what stands on the cellar floor: the lane's piers, the trestles, the things moved
    for (const pz of lane.piers) for (const px of [lane.rows[0], lane.rows[1]]) solid.push([px - lane.pier / 2, px + lane.pier / 2, pz - lane.pier / 2, pz + lane.pier / 2]);
    const gapTo = (b, x, z) => Math.hypot(Math.max(b[0] - x, 0, x - b[1]), Math.max(b[2] - z, 0, z - b[3]));
    const beside = (x, y, z, r) => {
      if (!inLane(x, y, z, r)) return [x, z];
      const nx = lane.x + (x < lane.x ? -1 : 1) * (lane.clear + r), bay = bayOf(z);
      for (let k = 0; k < 60; k++) for (const zz of [z + k * 0.5, z - k * 0.5]) if (zz >= bay[0] && zz <= bay[1] && solid.every((b) => gapTo(b, nx, zz) >= r)) { solid.push([nx - r, nx + r, zz - r, zz + r]); return [nx, zz]; }
      return [nx, z];
    };
    const ts = A.trestleSpots, tr0 = Math.PI / 2 + gr.range(-0.06, 0.06);
    trestle(G, ts[0][0], ts[0][1], ts[0][2], tr0, C, gr, blobs); await ctx.yield();
    const tr1 = Math.PI / 2 + gr.range(-0.1, 0.1);
    trestle(G, ts[1][0] + 2.4, ts[1][1], ts[1][2], tr1, C, gr, blobs); await ctx.yield();
    for (const [tx, tz] of [[ts[0][0], ts[0][2]], [ts[1][0] + 2.4, ts[1][2]]]) solid.push([tx - 2, tx + 2, tz - 4.4, tz + 4.4]);   // the two cellar trestles stand along the lane: 8.2 m tops, legs and all
    trestle(G, ts[2][0], ts[2][1], ts[2][2], gr.range(0.1, 0.35), C, gr, blobs); await ctx.yield();
    trestle(G, ts[3][0], ts[3][1], ts[3][2] - 0.6, gr.range(-0.05, 0.05), C, gr, blobs); await ctx.yield();
    trestle(G, 33, 18, -58, Math.PI / 2 + gr.range(-0.08, 0.08), C, gr, blobs); await ctx.yield();
    trestle(G, -37.5, 18, -6.5, gr.range(-0.06, 0.06), C, gr, blobs); await ctx.yield();
    trestle(G, 27, 18, -11.5, gr.range(-0.05, 0.05), C, gr, blobs); await ctx.yield();   // before the gallery's scaffold, as far from its front poles as it stood
    trestle(G, -47, 52, -152, Math.PI / 2 + gr.range(-0.05, 0.05), C, gr, blobs); await ctx.yield();
    const gs = gr.fork('scaffold');
    // before the gallery's south wall, standing 4 m out from it, so that the linen hung on that wall at x 19..29 (sheets below: 24, 44, -0.7, billow 1.2)
    // hangs and billows between scaffold and wall and never through the scaffold: the cloth at rest lies within 1.22 m of the wall, its shader moves no point
    // of it further than 1.8 m (the billow, 1.2, times the two waves' 1.5), and the scaffold's part nearest the wall (the ends of its cross tubes, 0.09 m
    // in its own frame) keeps 1.0 m beyond that: 1.22 + 1.8 + 1.0 - 0.09, rounded up to 4
    scaffold(G, 25.5, 18, -4, Math.PI, 16, C, gs, blobs); await ctx.yield();
    const canes = [[[-38.4, 0, -30], [-41.2, 11.6, -30.6], 0.012], [[-9.6, 0, -32.2], [-6.8, 11.6, -31.4], 0], [[-38.7, 0, -64], [-41.2, 11.6, -63.2], 0], [[-10, 0, -60], [-6.8, 11.5, -61], 0.01],
      [[30, 9, -226.3], [30.6, 20.6, -229.4], 0], [[34.5, 9, -226.6], [33.2, 20.6, -229.4], 0.008], [[43.4, 18, -31.4], [46.6, 29.6, -32], 0], [[43.6, 18, -93], [46.6, 29.6, -92.2], 0.01], [[42.8, 18, -90], [46.6, 29, -90.6], 0], [[-46.5, 18, -5], [-49.6, 29.6, -4.4], 0.01], [[-28, 18, -3.4], [-27, 29.6, -0.5], 0], [[-31.5, 18, -3.6], [-32.4, 29.6, -0.5], 0]];
    // The canes that stand on the cellar floor are things in the way like the trestles (the lane rule above): what is moved out
    // beside the lane keeps clear of each cane's foot. Its rectangle is the cane's own line from the floor up to the top of a pot
    // (pot(): profile 1.21 high, at most 1.12 times as large), grown by the cane's thickness at its foot (cane(): 0.1 m).
    // Only the list is written here, ahead of the pots; the canes are still built, and take their draws, where they always did.
    { const POT_TOP = 1.21 * 1.12, CANE_R = 0.1;
      for (const c of canes) if (c[0][1] < 17 && c[0][2] < lane.z0 && c[0][2] > lane.z1) {
        const f = POT_TOP / (c[1][1] - c[0][1]), qx = c[0][0] + (c[1][0] - c[0][0]) * f, qz = c[0][2] + (c[1][2] - c[0][2]) * f;
        solid.push([Math.min(c[0][0], qx) - CANE_R, Math.max(c[0][0], qx) + CANE_R, Math.min(c[0][2], qz) - CANE_R, Math.max(c[0][2], qz) + CANE_R]);
      } }
    const potSpots = A.potSpots.concat([[-30, 18, -16], [41, 18, -94], [19, 18, -24.5], [-46, 52, -139], [38, 9, -196]]);
    for (let k = 0; k < potSpots.length; k++) {
      const s0 = potSpots[k], sp = beside(s0[0], s0[1], s0[2], 4), s = [sp[0], s0[1], sp[1]], a0 = gr() * 6.28;   // (4 m: as far as a shell's rim lies from the middle of its group)
      for (let i = 0; i < 5; i++) { const a = a0 + i * 1.257 + gr.range(-0.3, 0.3), r = i === 0 ? 0 : gr.range(1.3, 2.7); pot(G, s[0] + Math.cos(a) * r, s[1], s[2] + Math.sin(a) * r, C.paints[(i + k) % 3], C, gr, blobs); }
      for (let i = 0; i < 2; i++) { const a = gr() * 6.28, r = gr.range(2.6, 3.6); shell(G, s[0] + Math.cos(a) * r, s[1], s[2] + Math.sin(a) * r, gr.pick(C.paints), C, gr); }
      await ctx.yield();
    }
    for (const c of canes) cane(G, c[0], c[1], C, gr, c[2]);
    await ctx.yield();
    // linen: [x, y, z, facing, width, drop, billow, and for a sloping pole its rise]; the nearest ones hang beside the lane and move the most
    // (the five written across the cellar lane are hung beside it by the rule above: rehang() below)
    // Eight hang by what the masonry leaves them (the hero part's own figures), so that their cloth and their
    // poles stand clear of the stone. ON A STAIR'S PARAPET (the landing's on stair B, which climbs 9 in 56; the three on the roof stair, 0.34 per m)
    // a sheet has 3.5 m of room, from the line through the tread noses up to the coping's underside: its pole runs parallel to the coping
    // (the rise), 0.45 m off the coping's edge (the reach of its own brackets), the cloth's top at the height of the coping's underside at
    // the sheet's middle, so that each bracket ends at mid-height of the coping's edge face; its drop is that room less the hem's own wave (0.09) and
    // 0.15 of air: 3.26. THE COURT'S EAST WALL SHEET hangs 0.45 m off the foremost cornice of its wall (x 48.60) with its brackets ending
    // at mid-height of that cornice's front (y 31.54 to 32.20), midway along the bare wall between the end of the blind window's sill (z -167.7; the
    // sill lies below the hem, and at the cloth's heights the surround's head ends at z -167.8) and the wall's pilaster (which begins at z -156.6):
    // z -162.15. THE TWO HIGH ON THE GALLERY'S CROSS WALL end 0.24 m (wave and air again)
    // above the top of the cornice below them (y 40.80). THE GALLERY'S SOUTH WALL SHEET hangs east of the vault's haunch: x -11.3 is the
    // least whole half metre east of x -14.3, where it was first written, at which its cloth and its pole stand at least 0.15 m clear of the haunch (at half a metre less the pole's end stands in it).
    // TWO OF THE STAIR SHEETS ALSO STAND OUTSIDE A PICTURE: each hangs down its parapet from where it was first written (z -152 and z -60)
    // by the least whole half metre at which its cloth at its furthest reach, its pole and its brackets lie outside the picture as seen from the picture's
    // own point: the one on stair B 4 m, to z -156, west of the doorcase's west column seen from the foot of stair B; the one on the roof stair's west
    // parapet 5 m, to z -55, west of the loggia's rectangle seen from V2.
    const H = Math.PI / 2, sheets = [
      [-34.5, 12.2, -29.1, 0, 9, 8.5, 1.3], [-12.5, 12.4, -60.1, 0, 9, 9, 1.3], [-35, 12.2, -91.1, 0, 9, 8.5, 1.7],          // across the haunches of the cellar's cross arches
      [-7.3, 12.1, -46.5, -H, 11, 9.5, 0.9], [-40.7, 12.1, -77.5, H, 11, 9.5, 1.5], [-7.3, 12.1, -108.5, -H, 11, 9.5, 1.6], [-40.7, 12.1, -14.5, H, 10, 9, 1.3], [-12.5, 12.3, -1.7, 0, 9, 9, 1.4], [-34.5, 12.2, -121.1, 0, 8, 7, 1.6], [-7.3, 12.1, -77.5, -H, 11, 9.5, 1.5],
      [16.75, 17.82, -156, H, 9, 3.26, 0.6, -9 / 56], [-39.2, 29.6, -203, H, 11, 13, 1.1], [32, 29.6, -228.9, 0, 11, 12, 1.3], [8, 22.6, -203.8, Math.PI, 9, 9, 1.1], [3, 45, -126.35, Math.PI, 9, 13, 1.2], [43, 41, -126.35, Math.PI, 7, 12, 1.1], [48.15, 31.57, -162.15, -H, 10, 13, 1.5], [4.3, 24.2, -186.75, Math.PI, 2.4, 9, 1.3],   // the court (the last on the back of the east pylon, out of V1's sight)
      [30, 47, -33.6, Math.PI, 9, 5.96, 1.3], [-6, 46.5, -33.6, Math.PI, 8, 5.46, 1.2], [46.3, 34.5, -46.5, -H, 7, 11, 0.9], [46.3, 34.5, -77.5, -H, 7, 11, 0.9], [-11.3, 44, -0.7, Math.PI, 8, 14, 1.1], [24, 44, -0.7, Math.PI, 10, 15, 1.2],   // the gallery, outside the loggia's reach
      [-46.2, 47.5, -0.7, Math.PI, 6, 13, 1.2], [-49.3, 44, -13, H, 10, 14, 1.1], [-49.3, 48, -38, H, 10, 12, 1.2], [-49.3, 47, -62, H, 9, 9, 1.1],             // the west bay
      [-28.75, 51.92, -112, -H, 8, 3.26, 0.5, -0.34], [-28.75, 43.76, -88, -H, 8, 3.26, 0.5, -0.34], [-43.25, 32.54, -55, H, 7, 3.26, 0.5, 0.34],                                           // drying on the roof stair's parapets
      [-6, 62.5, -282.7, 0, 12, 7, 1.2],                                                                                                                        // on the screen wall beside the water porch
    ];
    {
      // the planes linen hangs flat on, 0.8 m proud of an arcade's wall face: the lane's west and east faces, then the side aisle's near face
      const faces = [[lane.rows[0] + lane.pier / 2 + 0.8, H], [lane.rows[1] - lane.pier / 2 - 0.8, -H], [lane.rows[2] + lane.pier / 2 + 0.8, H]], hung = [];
      const flat = (q) => Math.abs(Math.cos(q[3])) < 0.5, half = (q) => q[4] / 2 + 0.6;   // parallel to the lane; half the length of its pole
      for (const q of sheets) if (q[1] < 17 && flat(q) && !inLane(q[0], q[1], q[2], 1)) hung.push([q[0], q[2] - half(q), q[2] + half(q)]);
      const rehang = (q) => {
        if (!inLane(q[0], q[1], q[2], flat(q) ? 1 : half(q))) return;
        const hp = half(q), bay = bayOf(q[2]), own = q[0] < lane.x ? 0 : 1;
        for (const f of [faces[own], faces[1 - own], faces[2]]) {
          const z0 = clamp(q[2], bay[0] + hp, bay[1] - hp);
          for (let k = 0; k < 60; k++) for (const zz of [z0 + k * 0.5, z0 - k * 0.5]) {
            if (zz - hp < bay[0] || zz + hp > bay[1] || hung.some((h) => Math.abs(h[0] - f[0]) < 0.1 && zz - hp < h[2] && zz + hp > h[1])) continue;
            hung.push([f[0], zz - hp, zz + hp]); q[0] = f[0]; q[2] = zz; q[3] = f[1]; return;
          }
        }
      };
      for (const q of sheets) rehang(q);
    }
    // Linen that hangs before an opening billows and is sucked back through it (cloth kind 3.3): every sheet in the cellar
    // (each hangs in an arch of the arcades) and the two in the gallery's window embrasures (the sheets written on the east
    // wall's inner face, x 46.3). And one sheet turns slowly on its pole: the largest one in the west bay, which is open to
    // the sky and takes the wind; it is built into a mesh of its own (GT) with the same draws from the same stream.
    const inBay = (q) => q[0] > A.bay.x0 && q[0] < A.bay.x1 && q[2] > A.bay.z0 && q[2] < A.bay.z1 && q[1] > A.bay.y0;
    let turnK = -1; for (let k = 0; k < sheets.length; k++) if (inBay(sheets[k]) && (turnK < 0 || sheets[k][4] * sheets[k][5] > sheets[turnK][4] * sheets[turnK][5])) turnK = k;
    const GT = makeG(lightAt);
    for (let k = 0; k < sheets.length; k++) {
      const q = sheets[k], draught = q[1] < 17 || (Math.abs(q[0] - 46.3) < 0.01 && q[1] < A.gallery.y1 && q[2] < A.gallery.z1 && q[2] > A.gallery.z0);
      sheet(k === turnK ? GT : G, q[0], q[1], q[2], q[3], q[4], q[5], C, gr, q[6], draught ? 3.3 : 3, q[7] || 0); if (k % 6 === 5) await ctx.yield();
    }
    plumb(G, 40, 37.6, -62, 9.6, C, gr, 0.08);   // the bob swings three quarters of a metre each way on its 9.6 m cord
    ring(G, -15, 13.3, -124, 0.8, C, gr); ring(G, 38, 46.4, -62, 6, C, gr); ring(G, -41.5, 71, -258.5, 0.6, C, gr);
    await ctx.yield();
    // a dark dado on the landing's face between the two stairs: the band the cellar's far opening shows under the pylons
    G.at(0, 0, 0);
    for (const [xa, xb] of [[-14.45, 14.45], [-39.95, -33.55]]) {
      G.quad([xa, 0.05, -185.93], [xb, 0.05, -185.93], [xb, 6.3, -185.93], [xa, 6.3, -185.93], mix(umber, col('#191512'), 0.35), 0.5, [0.4, 0.4, 0.56, 0.56]);
      G.quad([xa, 6.3, -185.92], [xb, 6.3, -185.92], [xb, 6.85, -185.92], [xa, 6.85, -185.92], chalk, 0.9);
      G.quad([xa, 7.3, -185.92], [xb, 7.3, -185.92], [xb, 7.7, -185.92], [xa, 7.7, -185.92], sienna, 0.85);
    }
    await ctx.yield();
    for (const step of furnishTerrace(G, C, gr.fork('terrace'), blobs)) await ctx.yield();   // (step is unused: the builder pauses part way)
    // CLIPPED BAY IN POTS INSIDE THE HOUSE, thirteen (the roofs' kind: the same pot, stem and ball, nodding by the world clock; they are in the gear's
    // mesh, so they cast into the sun's map and stand in its shade like the rest): a double row of eight on the sunk court's floor between the two stairs,
    // a small pair in the mouth of the gallery's north doorway, on the level threshold at the head of stair B, a pair against the gallery's south wall either side of
    // the walnut door that never opens, and one by the west bay's west wall, north of the corner where a cane leans. LAID BY PLACE: [x, floor y, z, scale],
    // typed once; the scales are typed too and nothing is dealt for a tree but its turn, the phase of its nod and the lumps of its crown, from a stream
    // of its own (court-bay, dealt from the world's seed like every stream here), so no older draw moves. No place and no scale comes from a seed; no
    // still's position and no lens is read for them. Their clear air from the flown line is counted at COURT_BAY above.
    {
      const rb = own('court-bay');
      for (const [x, y, z, s] of COURT_BAY) bay(G, x, z, C, rb, blobs, y, 0.12, s);
    }
    await ctx.yield();
    await clothRoom(ctx, [G, GT], hero);   // every hung cloth learns how much room it has before it meets the building (all sheets are written by now)
    const gear = new THREE.Mesh(await G.geometryIn(ctx), flatMat); gear.frustumCulled = false; scene.add(gear);
    await ctx.yield();
    // the sheet that turns: half a radian each way at its hem, a turn and back in about twenty seconds, its two phases seeded
    const tq = sheets[turnK], trn = own('turning-sheet');
    const turnMat = new THREE.ShaderMaterial({ uniforms: { ...flatU, uTurn: { value: new THREE.Vector4(tq[0], tq[2], Math.sin(tq[3]), Math.cos(tq[3])) }, uTurnA: { value: new THREE.Vector4(0.5, 0.3, trn() * 6.283, trn() * 6.283) }, uTurnH: { value: tq[4] / 2 } },
      vertexShader: FLAT_VERT, fragmentShader: FLAT_FRAG, side: THREE.DoubleSide, defines: { TURN: 1 } });
    const turning = new THREE.Mesh(GT.geometry(), turnMat); turning.frustumCulled = false; scene.add(turning);
    await ctx.yield();
    await hero.bakeSun([gear, turning]);          // the sun's map, with the painter's gear casting its own shadows
    {
      const sg = new THREE.BufferGeometry(), cx = -37, cy = 33.5, h = 11, z = -0.06;
      sg.setAttribute('position', new THREE.Float32BufferAttribute([cx + h, cy - h, z, cx - h, cy - h, z, cx - h, cy + h, z, cx + h, cy + h, z], 3));
      sg.setAttribute('uv', new THREE.Float32BufferAttribute([-h, -h, h, -h, h, h, -h, h], 2)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      const sino = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { uRed: { value: mix(col(look.paints[1]), col(look.paints[0]), 0.35) }, uGround: { value: mix(plaster, chalk, 0.4) }, uBlue: { value: HU.uBlue.value }, uSien: { value: sienna }, uChalk: { value: chalk }, uK: { value: 0.9 * look.bright * Math.min(lightAt(cx, cy, -0.6) + 0.12, 1) } },
        vertexShader: SINO_VERT, fragmentShader: SINO_FRAG, transparent: true, depthWrite: false }));
      sino.renderOrder = 1; sino.frustumCulled = false; scene.add(sino);
    }
    const bpos = [], buv = [], bidx = [];
    blobs.forEach((b, i) => { const [x, y, z, rx, rz] = b, o = i * 4; bpos.push(x - rx, y, z - rz, x + rx, y, z - rz, x + rx, y, z + rz, x - rx, y, z + rz); buv.push(-1, -1, 1, -1, 1, 1, -1, 1); bidx.push(o, o + 2, o + 1, o, o + 3, o + 2); });
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(buv, 2)); bg.setIndex(bidx);
    const blobMesh = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: { uCol: { value: mix(umber, col('#1a1612'), 0.5) } }, vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG, transparent: true, depthWrite: false }));
    blobMesh.renderOrder = 1; blobMesh.frustumCulled = false; scene.add(blobMesh);
    await ctx.yield();

    // ---- the garden and what stands beyond it
    // (three meshes and a pause every few trees: one merged mesh took too long to hand over in one step)
    const GG = makeG(), GH = makeG(), GI = makeG(); GG.lit = false; GH.lit = false; GI.lit = false;
    for (const sx of [-1, 1]) for (let z = 44, k = 0; z > -335; z -= 24, k++) { cypress(GG, sx * 70 + ga.range(-4, 4), z + ga.range(-5, 5), ga.range(62, 90), ga.range(6.5, 8.5), C, ga, sx < 0 ? 1 : 0); if (sx < 0 || k % 2 === 1) await ctx.yield(); }
    for (const [x, z] of [[-42, 36], [-6, 36], [-42, 62], [-6, 62]]) { cypress(GG, x, z, ga.range(66, 78), 7, C, ga); await ctx.yield(); }
    await ctx.yield();
    const gardenA = new THREE.Mesh(await GG.geometryIn(ctx), flatMat); gardenA.frustumCulled = false; scene.add(gardenA);
    await ctx.yield();
    const northCone = (x, z) => z < -300 && Math.abs(x + 36) < 70 + (-300 - z) * 0.3;
    for (let i = 0, n = 0; i < 80 && n < 16; i++) { const a = ga() * 6.283, r = ga.range(125, 300), x = Math.cos(a) * r * 0.8, z = -150 + Math.sin(a) * r * 1.25; if (northCone(x, z) || (Math.abs(x) < 84 && z < 70 && z > -330)) continue; cypress(GH, x, z, ga.range(55, 85), ga.range(6, 9), C, ga, 0); n++; if (n % 4 === 0) await ctx.yield(); }
    await ctx.yield();
    for (let i = 0, n = 0; i < 80 && n < 10; i++) { const a = ga() * 6.283, r = ga.range(120, 260), x = Math.cos(a) * r * 0.85, z = -150 + Math.sin(a) * r * 1.2; if (northCone(x, z) || (Math.abs(x) < 95 && z < 75 && z > -335)) continue; pine(GH, x, z, ga.range(72, 98), C, ga); n++; if (n % 4 === 0) await ctx.yield(); }
    await ctx.yield();
    const gardenB = new THREE.Mesh(await GH.geometryIn(ctx), flatMat); gardenB.frustumCulled = false; scene.add(gardenB);
    await ctx.yield();
    // the clipped bays along the wing stand in the bright band the cellar looks out on: they nod by 0.3 m, a tenth of the ball's width
    for (const x of [-46, 0, 46]) bay(GI, x, 12.5, C, ga, null, 0, 0.3);
    await ctx.yield();
    for (const sx of [-1, 1]) { for (let z = -8; z > -125; z -= 23) bay(GI, sx * 61, z, C, ga, null, 0, 0.3); await ctx.yield(); }
    fig(GI, -53, 14, C, ga);
    await ctx.yield();
    tower(GI, -150, -520, 150, C, 0.3); tower(GI, 150, -600, 172, C, -0.2);
    for (let i = 0; i < 10; i++) { const a = (i + ga.range(-0.3, 0.3)) / 10 * 6.283, r = ga.range(330, 620), x = Math.cos(a) * r, z = -150 + Math.sin(a) * r; if (Math.abs(x + 36) < 50 && z < -300) continue; roofs(GI, x, z, C, ga); }
    await ctx.yield();
    const gardenC = new THREE.Mesh(await GI.geometryIn(ctx), flatMat); gardenC.frustumCulled = false; scene.add(gardenC);
    await ctx.yield();

    // ---- doves on the parapet over the court, fig leaves on the cistern and one skating in the cellar
    const GD = makeG(); dove(GD, C);
    const doves = new THREE.InstancedMesh(GD.geometry(), flatMat, 4); doves.frustumCulled = false; scene.add(doves);
    const GL = makeG(); GL.lit = false; figLeaf(GL, 0.95, C.leafA, 0.84, 0);
    const NLEAF = 9, leaves = new THREE.InstancedMesh(GL.geometry(), flatMat, NLEAF); leaves.frustumCulled = false; scene.add(leaves);
    const GS = makeG(); GS.lit = false; figLeaf(GS, 0.95, mix(C.leafA, sienna, 0.3, 1.5), 1, 0);
    { const rib = mix(chalk, C.leafA, 0.35); for (const a of [-1.5, -0.75, 0, 0.75, 1.5]) { const ex = Math.sin(a) * 1.35, ez = 0.33 + Math.cos(a) * 1.35, nx = Math.cos(a) * 0.045, nz = -Math.sin(a) * 0.045;
      GS.quad([-nx, 0.03, 0.2 - nz], [nx, 0.03, 0.2 + nz], [ex + nx * 0.4, 0.05, ez + nz * 0.4], [ex - nx * 0.4, 0.05, ez - nz * 0.4], rib, 1.1); } }
    const skate = new THREE.Mesh(GS.geometry(), flatMat); skate.frustumCulled = false; scene.add(skate);
    const skP = skate.geometry.attributes.position.array;   // the leaf's own points, read each frame to rest its lowest one on the floor
    const skateBlob = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), blobMesh.material); skateBlob.geometry.attributes.uv.array.set([-1, 1, 1, 1, -1, -1, 1, -1]); skateBlob.renderOrder = 1; skateBlob.frustumCulled = false; scene.add(skateBlob);
    const leafAt = []; const B = A.basin;
    for (let i = 0; i < NLEAF - 1; i++) leafAt.push(i < 2 ? [lf.range(-31, -24), lf.range(-252, -245)] : [lf.range(-16, B.x1 - 5), lf.range(B.z0 + 6, B.z1 - 5)]);
    const leafPh = leafAt.map(() => lf() * 6.28), leafRate = leafAt.map(() => lf.range(0.12, 0.3) * lf.sign()), dovePh = [lf() * 6.28, lf() * 6.28, lf() * 6.28, lf() * 6.28];
    // four more fig leaves turn on the cistern, one in each bay of water between the pergola's posts, where the water's rings
    // start (A.basin.rings); their phase, their rate of turning and their side come from a stream of their own
    const lf2 = own('cistern-leaves'), RG = A.basin.rings, leaves2 = new THREE.InstancedMesh(leaves.geometry, flatMat, RG.length); leaves2.frustumCulled = false; scene.add(leaves2);
    const leaf2Ph = RG.map(() => lf2() * 6.28), leaf2Rate = RG.map(() => lf2.range(0.12, 0.3) * lf2.sign());
    const dummy = new THREE.Object3D();
    const placeLife = (t) => {
      // each pair's two walks share no stretch: the terrace's two walk x -27.5..-18.1 and -14.9..-5.5, the fountain wall's two x 0.25..6.25 and
      // 9.45..15.45; 3.2 m lie between a pair's walks and a bird reaches 1.3 m past its walk's end as it turns, so 0.6 m of air stays between the two
      for (let i = 0; i < 4; i++) {
        const ph = t * 0.2 + dovePh[i], s = ph + 0.4 * Math.sin(2 * ph), c = Math.cos(s), step = Math.abs(Math.sin(t * 4.5 + i));
        if (i < 2) dummy.position.set(-22.8 + i * 12.6 + 4.7 * Math.sin(s), 54.1 + 0.03 * step, -230.7 + 0.15 * Math.sin(s * 3 + i));
        else dummy.position.set(-15.15 + i * 9.2 + 3 * Math.sin(s), 24.2 + 0.03 * step, -201.1 + 0.2 * Math.sin(s * 3 + i));   // on the fountain wall's coping (its top is y 24.2)
        dummy.rotation.set(0.04 * step, (Math.PI / 2) * clamp(c / 0.2, -1, 1), 0); dummy.scale.setScalar(1.25); dummy.updateMatrix(); doves.setMatrixAt(i, dummy.matrix);
      }
      doves.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NLEAF - 1; i++) {
        const a = t * 0.05 + leafPh[i];
        dummy.position.set(leafAt[i][0] + 1.6 * Math.sin(a), B.y + 0.06, leafAt[i][1] + 1.6 * Math.cos(a * 0.8));
        dummy.rotation.set(0, leafPh[i] + t * leafRate[i], 0); dummy.scale.setScalar(1.5); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
      }
      for (let i = 0; i < RG.length; i++) {
        const a = t * 0.05 + leaf2Ph[i];
        dummy.position.set(RG[i][0] + 1.6 * Math.sin(a), B.y + 0.06, RG[i][1] + 1.6 * Math.cos(a * 0.8));
        dummy.rotation.set(0, leaf2Ph[i] + t * leaf2Rate[i], 0); dummy.scale.setScalar(1.5); dummy.updateMatrix(); leaves2.setMatrixAt(i, dummy.matrix);
      }
      leaves2.instanceMatrix.needsUpdate = true;
      const pp = t * 0.09 + 1.3, gust = 0.5 + 0.5 * Math.sin(t * 0.6);
      const lx = -24 + 2.2 * Math.sin(pp * 2.1 + 1) + 1.3 * Math.sin(pp * 7.3 + 2), lz = -60 + 40 * Math.sin(pp * 1.3);
      // THE SKATING LEAF KEEPS TO THE CLEAR LANE AND RESTS ON THE FLOOR. Its place wanders up to 3.5 m either side of the lane's axis (x -24: a slow swing
      // of 2.2 m and a quicker one of 1.3 m) and 40 m either way along it about z -60; its furthest point lies 3.27 m from its place, so the whole leaf
      // stays within 6.77 m of the axis, inside the strip that the lane's rule keeps free of the painter's gear (by that rule's own ranges nothing of the
      // gear stands nearer the axis than 6.98 m): over the law's whole period it reaches from x -30.77 to -17.24 and from z -103.23 to -16.75.
      // Its tilt, turn and roll are a closed law of the clock; its height is worked each frame from its own points so that the lowest of them stands
      // 0.06 m over the tiles (0.06 to 0.21 m in a hop), never under them. With every phase free its highest point is y 2.836: under the lowest that a
      // wing of the lane's swifts can come (the reach's lowest, y 3.105) and 5.0 m and more under the flown line.
      const rx = 0.28 + 0.16 * gust * Math.sin(t * 3.1), ry = t * 1.4 + 3 * Math.sin(pp * 5), rz = 0.15 * Math.sin(t * 2.2);
      const ca = Math.cos(rx), sa = Math.sin(rx), sb = Math.sin(ry), cc = Math.cos(rz), sc = Math.sin(rz), m1 = ca * sc + sa * sb * cc, m5 = ca * cc - sa * sb * sc, m9 = -sa * Math.cos(ry);
      let low = 0; for (let i = 0; i < skP.length; i += 3) low = Math.min(low, m1 * skP[i] + m5 * skP[i + 1] + m9 * skP[i + 2]);   // the lowest point's height about the leaf's place, before the scale (three's Euler order XYZ)
      const ly = 0.06 - 1.6 * low + 0.15 * gust * Math.abs(Math.sin(t * 2.3));
      skate.position.set(lx, ly, lz); skate.rotation.set(rx, ry, rz); skate.scale.setScalar(1.6);   // about 4.3 m across: 1.52 by the leaf's own measure, within the 1.1 to 1.6 the garden's fig bears its leaves at
      skateBlob.position.set(lx + 1.16 * sb, 0.05, lz + 1.16 * ca * Math.cos(ry)); skateBlob.scale.setScalar(2.6);   // under the blade's middle (the point 0.725 out from the stalk in the leaf's own unscaled units, times the scale 1.6), not under the stalk
      dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.001); dummy.updateMatrix(); leaves.setMatrixAt(NLEAF - 1, dummy.matrix);
      leaves.instanceMatrix.needsUpdate = true;
    };
    placeLife(0);
    await ctx.yield();

    // ---- the flight: the hero's line, through the three vantage points exactly
    const path = makePath(A.flyThrough.map((p) => p.slice()));
    const uOf = (p) => { let best = 1e9, bu = 0; const q = new THREE.Vector3(); for (let i = 0; i <= 1600; i++) { path.pointAt(i / 1600, q); const d = (q.x - p[0]) ** 2 + (q.y - p[1]) ** 2 + (q.z - p[2]) ** 2; if (d < best) { best = d; bu = i / 1600; } } return bu; };
    const uV = A.vantage.map(uOf);   // about 0.240, 0.575, 0.933
    await ctx.yield();
    const duration = 50, PC = A.pictureCenters, PC0 = PC[0];
    const pace = (u) => {
      let p = lerp(1, 1.3, smoothstep(0.08, 0.14, u));
      const dip = (c, w, to) => 1 - (1 - to / 1.3) * Math.exp(-(((u - c) / w) ** 2));
      p *= dip(uV[0] - 0.004, 0.028, 0.55) * dip(uV[1] - 0.004, 0.03, 0.5) * dip(uV[2] - 0.012, 0.03, 0.7);
      return lerp(p, 1, smoothstep(0.945, 0.975, u));
    };

    // ---- swifts: dark scythes against the sky and the plaster (kit flocks; the pair at V2 is keyed to u)
    const birdLight = { sunDir: hero.sunDir.toArray(), sunColor: look.disc, sunIntensity: 0.5, sky: look.sky, skyIntensity: 0.75, ground: look.gravel, groundIntensity: 0.45 };
    const fauna = F.makeFauna(scene, { light: birdLight });
    const bc = col(look.bird), swiftCol = { body: look.bird, belly: '#' + mix(bc, stone, 0.25).getHexString(), wingC: look.bird, trail: '#' + mix(bc, stone, 0.12).getHexString(), tip: look.bird, head: look.bird, beak: '#141210' };
    const swift = (o) => fauna.add(F.makeFlock({ rng: lf.fork('s' + fauna.items.length), species: 'swifts', size: 9, speed: 24, light: birdLight, rim: 0.1, translucency: 0.2, ...swiftCol, palette: { fork: 0, chord: 0.1, tailW: 0.09 }, ...o }), { always: true });
    const nA = Math.max(4, Math.round(6 * density)), nB = Math.max(3, Math.round(5 * density));
    // a stand-in path whose point at a distance s lies s metres from the vantage along the gaze there, and whose heading is that gaze (kit cross routes are laid from a
    // path: the kit asks for the point at u times this length plus the lead, so with the length 1 a party keyed at u 0.244 or 0.58 lies that much of a metre beyond its lead)
    const gazePath = (v, to) => { const o = new THREE.Vector3(...v), d = new THREE.Vector3(to[0] - v[0], to[1] - v[1], to[2] - v[2]).normalize(); return { length: 1, posAtDist: (s, out) => out.copy(o).addScaledVector(d, s), tangentAtDist: (s, out) => out.copy(d) }; };
    // a stand-in path for a level course typed by its two ends: at any distance its point is the middle of the two and its heading runs from the first to the second
    const coursePath = (a, b) => { const m = new THREE.Vector3((a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2), d = new THREE.Vector3(b[0] - a[0], 0, b[2] - a[2]).normalize(); return { length: 1, posAtDist: (s, out) => out.copy(m), tangentAtDist: (s, out) => out.copy(d) }; };
    // the cellar lane's swifts: a level racetrack at y 6.8 beside the flown path in the lane's north half, between the path and the west arcade, its
    // north end wider than its south. LAID BY THE RULE OF PLACE that is said at the court's ring below, with this flock's own figures in the reach, AND
    // HELD ABOVE THE SKATING FIG LEAF as well: the reach's lowest is y 3.105, and no point of that leaf can stand higher than y 2.836 at any clock.
    // The size, 4.5, here and in the next flock, brings the cellar's swifts nearer the 3 m across that the design gives a swift.
    // EVERY FLOCK OF THIS WORLD HANDS THE KIT maxSigma 3. Live's kit then holds each bell-curve draw of a swift's own place within three scatters, each
    // axis by itself, so the three scatters are counted as A BOX in the reach (said at the court's ring) and no deal passes beyond it. A kit that does
    // not know the name deals as before.
    swift({ count: nA + 2, size: 4.5, speed: 20, spread: [0.8, 0.8, 70], wander: [0.6, 0.5, 0.8, 0.8], maxSigma: 3, route: [[-26.21, 6.8, -83.72], [-23.42, 6.8, -114.59], [-23.84, 6.8, -116.95], [-25.42, 6.8, -118.75], [-27.7, 6.8, -119.5], [-30.03, 6.8, -118.96], [-31.76, 6.8, -117.31], [-32.4, 6.8, -115], [-32.4, 6.8, -84], [-32.01, 6.8, -82.49], [-30.93, 6.8, -81.36], [-29.44, 6.8, -80.9], [-27.91, 6.8, -81.23], [-26.74, 6.8, -82.25]] });
    await ctx.yield();
    // a second small party, which has left the lane (the lane holds one loop clear of the flown path): a level loop with rounded ends at y 26 over the
    // court's south end, between the two stairs and under the ring; laid by the same rule. ITS HEIGHT AND ITS NORTH END ARE TYPED FIGURES CHOSEN BY A
    // MEASURE THROUGH THE LENS: whole flights were counted on 200 seeds at heights from 12 to 26 and at several north ends, and this loop was taken
    // because in that count none of its swifts stood a tenth of the frame wide at the sphere's lock. Nothing here reads the lens when the world runs.
    swift({ count: Math.max(4, Math.round(6 * density)), size: 4.5, speed: 20, spread: [1.2, 1, 64], wander: [0.8, 0.6, 0.8, 0.9], maxSigma: 3, route: [[5.5, 26, -143], [5.5, 26, -157], [4.56, 26, -160.5], [2, 26, -163.06], [-1.5, 26, -164], [-5, 26, -163.06], [-7.56, 26, -160.5], [-8.5, 26, -157], [-8.5, 26, -143], [-7.56, 26, -139.5], [-5, 26, -136.94], [-1.5, 26, -136], [2, 26, -136.94], [4.56, 26, -139.5]] });
    await ctx.yield();
    // the court's swifts: a level ring over the court's south half, its ends rounded. THIS LOOP AND THE NEXT ARE LAID BY ONE RULE OF PLACE. No stone and
    // no hung gear (each cloth at its furthest reach) lies within the reach of any point of the loop's line, and nothing of the garden on any seed
    // counted; and no point of the flown route lies within that reach with two metres more on its ball. THE REACH is a sum of three parts, each laid about
    // every point of the one before. A box: the wander at its greatest on each axis (1.5 times the wander's first figure on x, its second figure on y, its
    // third on z). A second box: three scatters of a swift's own place in the flock on each axis (a scatter is 0.45 of the spread's first figure on x and on z,
    // 0.45 of its second on y). A ball: the wing of the flock's largest swift (0.37 of its size times 1.12) and a quarter metre. The two loops' reaches stand
    // apart, this one south and the next north. A swift's own place is a chance draw; with maxSigma 3 handed, live's kit holds every such draw inside the
    // three scatters, so none stands beyond the reach. The sizes, 7 here and 5 in the next loop, bring the court's swifts nearer
    // the 3 m across that the design gives a swift (a span is about 0.70 of the size). The spread's third figure, the lag range, is a typed 135, under the loop's
    // lap of 139.61 m (the next loop's is a typed 120 under a lap of 127.97 m); no code keeps either there. THE CENTRES: the ring is centred between
    // the court's east and west walls, its reach 4.45 m from each; for the next loop's ends no reason is on record beyond its margins as counted.
    swift({ count: nA, size: 7, spread: [4, 3, 135], wander: [3, 2, 3, 0.7], maxSigma: 3, route: [[19.5, 40, -144], [-9.5, 40, -144], [-16, 40, -145.74], [-20.76, 40, -150.5], [-22.5, 40, -157], [-20.76, 40, -163.5], [-16, 40, -168.26], [-9.5, 40, -170], [19.5, 40, -170], [26, 40, -168.26], [30.76, 40, -163.5], [32.5, 40, -157], [30.76, 40, -150.5], [26, 40, -145.74]] });
    await ctx.yield();
    // the swifts along the court's north side, lower than the ring and north of it: a level loop with rounded ends, laid by the same rule
    swift({ count: 5, size: 5, speed: 22, spread: [3, 2, 120], wander: [2, 1.4, 2, 0.8], maxSigma: 3, route: [[27, 35, -200], [-15, 35, -200], [-18.5, 35, -200.94], [-21.06, 35, -203.5], [-22, 35, -207], [-21.06, 35, -210.5], [-18.5, 35, -213.06], [-15, 35, -214], [27, 35, -214], [30.5, 35, -213.06], [33.06, 35, -210.5], [34, 35, -207], [33.06, 35, -203.5], [30.5, 35, -200.94]] });
    await ctx.yield();
    // the gallery's swifts: a small level loop at y 29 in the room's north west corner, west of the flown passage and not over it; slow (speed 10)
    // because its lap is short; laid by the same rule
    swift({ count: nB + 3, size: 5, speed: 10, spread: [1.6, 1.2, 30], wander: [1.2, 0.8, 1.2, 0.8], maxSigma: 3, route: [[-9, 29, -104], [-11, 29, -104], [-13.5, 29, -104.67], [-15.33, 29, -106.5], [-16, 29, -109], [-15.33, 29, -111.5], [-13.5, 29, -113.33], [-11, 29, -114], [-9, 29, -114], [-6.5, 29, -113.33], [-4.67, 29, -111.5], [-4, 29, -109], [-4.67, 29, -106.5], [-6.5, 29, -104.67]] });
    await ctx.yield();
    // a second party in the gallery by the east wall, east of the flown passage, between z -92 and -76 (the north door stands at z -121.3): a level loop at y 30, as slow; laid by the same rule, AND
    // CLEAR OF THE NORTH DOOR'S LEAF: the leaf (20 m wide, hinged at x 34, z -121.3) swings inside an upright cylinder of radius 20.01 m about its hinge
    // on every visit and at every clock, and this loop's reach stands outside that cylinder. ITS PLACE, 8 m south of where it flew before, WAS TAKEN AMONG NINE
    // PLACES BY A MEASURE THROUGH THE LENS (whole flights on 200 seeds: how often one of its swifts stood a tenth of the frame wide); a place 4 m south already
    // clears the leaf's cylinder. Nothing here reads the lens when the world runs.
    swift({ count: nB + 1, size: 5, speed: 10, spread: [1.2, 1, 36], wander: [1, 0.8, 1, 0.8], maxSigma: 3, route: [[38, 30, -80], [38, 30, -88], [37.46, 30, -90], [36, 30, -91.46], [34, 30, -92], [32, 30, -91.46], [30.54, 30, -90], [30, 30, -88], [30, 30, -80], [30.54, 30, -78], [32, 30, -76.54], [34, 30, -76], [36, 30, -76.54], [37.46, 30, -78]] });
    await ctx.yield();
    // the roofs' swifts: a long level loop at y 76, 24 m above the roofs, over the court's west half; the flight crosses under it, 15 to 16 m below. Laid by the
    // same rule. AN UMBRELLA PINE'S CROWN CAN OVERHANG THE WING: by the garden code's own ranges (beside the wing a foot no nearer than x 95 either side, a
    // lean of 5 m, a pad 0.4 of the height out and 0.2 of it in radius with its rim's lump, a height of 98 m, the nod) a crown can come as far east as
    // x -27.08 on the wing's west side at this height, on any seed, and no further. This loop's reach and the next one's keep east of that
    swift({ count: nB, size: 5, spread: [1.6, 1.2, 135], wander: [1.2, 0.8, 1.2, 0.7], maxSigma: 3, route: [[0, 76, -122], [0, 76, -166], [-1.34, 76, -171], [-5, 76, -174.66], [-10, 76, -176], [-15, 76, -174.66], [-18.66, 76, -171], [-20, 76, -166], [-20, 76, -122], [-18.66, 76, -117], [-15, 76, -113.34], [-10, 76, -112], [-5, 76, -113.34], [-1.34, 76, -117]] });
    await ctx.yield();
    // the terrace's swifts: a level loop at y 76 over the terrace's south end and the court's north end, east of the last straight; the flight crosses
    // under it, 13 to 15 m below; laid as the loop before
    swift({ count: nB, size: 5, spread: [1.6, 1.2, 84], wander: [1.2, 0.8, 1.2, 0.7], maxSigma: 3, route: [[3, 76, -226.5], [3, 76, -237.5], [1.46, 76, -243.25], [-2.75, 76, -247.46], [-8.5, 76, -249], [-14.25, 76, -247.46], [-18.46, 76, -243.25], [-20, 76, -237.5], [-20, 76, -226.5], [-18.46, 76, -220.75], [-14.25, 76, -216.54], [-8.5, 76, -215], [-2.75, 76, -216.54], [1.46, 76, -220.75]] });
    await ctx.yield();
    // KEYED TO THE FLIGHT, three parties. Each flies its course once while the eye goes through the party's window of the path (the kit's cross law: a swift's
    // place along its course is set by u alone). EACH COURSE IS LAID OFF THE FLOWN LINE BY ITS OWN NUMBERS, by the rule of place said at the court's ring: no
    // stone, gear or garden within the reach of any point of the course, no point of the flown route within that reach with two metres more on its ball, and
    // the reach clear of the doves' walks as well. Size 5 as the other small flocks, and a small scatter and wander of their own, so that a party off the
    // line still flies near enough to read as birds. Until this round the pairs' stand-in path took only the fraction of the lead, so each pair flew over
    // the vantage itself and out of the picture, and the six flew a course whose reach the flown route ran through. THE THREE COURSES WERE CHOSEN BY PLACE WITH A
    // MEASURE THROUGH THE LENS (each window counted on 200 seeds: is a swift in the frame, how wide, is a wide one cut by the frame); the keys and the
    // windows are the old ones. Nothing here reads the lens when the world runs.
    // A pair across the court's north part at the sphere's lock: 36.2 m from (-5.8, 31.5, -214.3) east to (29.4, 31.5, -206.8), 1.5 m lower in the middle, north
    // of the fountain wall and its two doves and above them; its middle 48.2 m ahead of V1 along the gaze, 10 m to the gaze's left and 8 m above it. It flies
    // in the air of the north side loop (the two reaches overlap) and shows in the picture's upper left, above the painted sphere.
    swift({ count: 2, size: 5, speed: 22, spread: [1, 0.6, 5], wander: [0.5, 0.4, 0.5, 0.9], maxSigma: 3, cross: { path: gazePath(A.vantage[0], PC0), u: uV[0] + 0.004, lead: 48, angle: 45, side: 1, height: 8, offset: -10, span: 36, bow: 0, sag: 1.5, window: 0.03 } });
    await ctx.yield();
    // A pair across the gallery's far end at the loggia's lock: 24.2 m from (9.6, 36.5, -78.7) west to (-13.6, 36.5, -72.5), 1.5 m lower in the middle; its
    // middle 64.6 m north of V2, 2 m west of the gaze and 6 m above it. From V2 it is seen under the cross arch, small, flying toward the loggia's side.
    swift({ count: 2, size: 5, speed: 22, spread: [1, 0.6, 5], wander: [0.5, 0.4, 0.5, 0.9], maxSigma: 3, cross: { path: gazePath(A.vantage[1], [A.vantage[1][0], A.vantage[1][1], -122]), u: uV[1] + 0.004, lead: 64, angle: 105, side: -1, height: 6, offset: -2, span: 24, bow: 0, sag: 1.5, window: 0.032 } });
    await ctx.yield();
    // Six north over the roofs while the eye climbs the roof stair and crosses the roofs: a straight level course of 105.0 m at y 70.6 from (-16, -110) to
    // (-15, -215), over the hall roof and the court's west side; 10.35 m above the flown line where that line passes under it. Its scatter across the
    // course is half of the old one (4.5 and 2.5 for 9 and 5), its trail along the course 38 m for 44 (by the same measure through the lens: with 44
    // the last swift of a rare deal passed a tenth of the frame wide at the frame's corner). Its reach runs through the lower part of the two high
    // loops' reaches, east of x -27.08 (the pines, said at the roofs' loop) and west of the bay in its pot on the hall roof at (2, -120.5).
    swift({ count: 6, size: 5, spread: [4.5, 2.5, 38], wander: [1, 0.5, 1, 0.7], maxSigma: 3, cross: { path: coursePath([-16, 70.6, -110], [-15, 70.6, -215]), u: 0.7, lead: 0, angle: 0, height: 0, span: Math.hypot(1, 105), bow: 0, sag: 0, window: 0.08 } });
    await ctx.yield();

    // ---- dust motes: fine warm specks, a few pixels at most, that show against shade and vanish against the sky
    const dust = fx.makeParticles({ rng: lf.fork('dust'), preset: 'dust', count: Math.round(7000 * detail * density), box: [56, 26, 56], size: [0.035, 0.075], near: [6, 14], minAngle: 0.0016,
      colors: ['#' + mix(chalk, col(look.sunSide), 0.5).getHexString(), '#' + chalk.getHexString(), look.sunSide], intensity: 1, opacity: 0.6, additive: 0.25, twinkle: 0.55, time });
    scene.add(dust.object);
    await ctx.yield();
    // motes of their own in the open bay and in the gallery, standing in the room (not carried with the eye): larger than the
    // fine dust, one to about every thirty cubic metres of the room's box
    const motesIn = (box, name) => fx.makeParticles({ rng: own(name), preset: 'dust', follow: false, center: [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, (box.z0 + box.z1) / 2], box: [box.x1 - box.x0, box.y1 - box.y0, box.z1 - box.z0],
      count: Math.round((box.x1 - box.x0) * (box.y1 - box.y0) * (box.z1 - box.z0) / 30 * detail * density), size: [0.05, 0.11], near: [6, 14], minAngle: 0.002,
      colors: ['#' + mix(chalk, col(look.sunSide), 0.5).getHexString(), '#' + chalk.getHexString(), look.sunSide], intensity: 1, opacity: 0.7, additive: 0.25, twinkle: 0.55, time });
    const motesBay = motesIn(A.bay, 'bay-motes'); scene.add(motesBay.object);
    await ctx.yield();
    const motesGal = motesIn(A.gallery, 'gallery-motes'); scene.add(motesGal.object);
    await ctx.yield();

    const seat = A.portalSeat.position, camPos = new THREE.Vector3(), stairAim = new THREE.Vector3();
    // the wind rose's centre on the gallery floor, where the hero's shader draws it: uRose is (east, north) in metres from the foot of V2
    const rose = [A.vantage[1][0] + HU.uRose.value.x, 18, A.vantage[1][2] - HU.uRose.value.y];
    // where the flight, after the loggia's lock, goes out under the gallery's west arcade (the first point of the path past V2 on the arcade's plane)
    let uArc = uV[1]; { const q = new THREE.Vector3(); for (let i = Math.ceil(uV[1] * 1600); i <= 1600; i++) { path.pointAt(i / 1600, q); if (q.x <= A.westArcadeX) { uArc = i / 1600; break; } } }
    return {
      scene, path, duration, pace, title: look.title,
      camera: { fov: 62, near: 0.3, far: 4600, lookAhead: 22, sway: 0, bank: 0.3 },
      pois: [
        { at: PC[0], from: uV[0] - 0.06, to: uV[0] + 0.03, weight: 0.92 },                         // up the stair: the sphere, on the pylons, the fountain wall and the east wall
        { at: PC[1], from: uV[1] - 0.05, to: uV[1] + 0.036, weight: 0.92 },                        // out of the turn at the south end: the loggia, north through the cross arch
        { at: rose, from: uV[1], to: uArc, weight: 0.9 },                                          // from the loggia's lock until the flight goes out under the west arcade: the wind rose of its pavement, as it shears
        // the last stretch, one pull that carries both of its aims: on the roof stair the aim rises from the stair's line to the portal seat
        // in the window wall and rests there; the pull runs to the end of the path, where the engine lets every pull go (gone at 0.985); its ramps are the engine's own
        { at: (t, u) => { const k = smoothstep(0.685, 0.755, u); return stairAim.set(seat[0], lerp(44, seat[1], k), lerp(-150, seat[2], k)); }, from: 0.6, to: 1, weight: 0.9 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.35, revealDistance: 330 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, t, camera, u = 0) {
        time.value = t;
        camera.getWorldPosition(camPos); sky.position.copy(camPos);
        hero.setProgress(u); hero.update(dt, t, camera);
        placeLife(t);
        fauna.update(dt, t, camera, u);
        dust.setOpacity(0.6 * (1 - smoothstep(36, 50, camPos.y)));       // motes indoors and in the courts, none over the roofs
        dust.update(dt, t, camera); motesBay.update(dt, t, camera); motesGal.update(dt, t, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
