// Ten Times Faster Every Two Seconds: the central device.
// One beach, one law: with t = 45u seconds the world's clock runs at 10^(t/2 - 3) times real speed. Every layer of the
// world has one true period P and is drawn by its screen frequency f = rate / P: crisp and still below ~0.05 Hz, the one
// thing travelling across the frame from 0.1 to 1 Hz, and replaced by its own time average between 1 and 2 Hz.
// Nothing here reads `time` until the law is switched off at u = 0.9082; then the rate is exactly 1.
//
// Axes: x along the heading (azimuth 315), z to the right (inland), y up. Sea on the left (z < 25 m at mean tide).
import * as THREE from 'three';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const fract = (x) => x - Math.floor(x);
const YEAR = 3.15576e7;

// ---- the ladder: every rung's one true period, in seconds ----
export const PERIOD = {
  surf: 8, cloud: 1800, tide: 44712, day: 86400, moon: 27.3 * 86400, year: YEAR, dune: 30 * YEAR, river: 1000 * YEAR,
  ice: 1e5 * YEAR, shore: 2e6 * YEAR, range: 6e7 * YEAR,
};
export const U_STOP = 0.9082;
const T_WET0 = 0.87e9 * YEAR, T_WET1 = 1.7e9 * YEAR;

// slow advance, fast retreat (0..1)
const glacial = (p) => (p < 0.7 ? sstep(0, 0.7, p) : 1 - sstep(0.7, 1, p));

// THE CLOCK. Pure function of the journey's second t (= 45u, plus any seconds the camera has been held still, during
// which the world simply goes on at the rate the law gives). Double precision on the CPU; shaders get phases only.
export function clockAt(tIn, real = 0, c = { ph: {}, sw: {}, f: {} }) {
  const tStop = 45 * U_STOP, stopped = tIn >= tStop;
  const t = Math.min(tIn, tStop);
  const k = t / 2 - 3;
  const rate = stopped ? 1 : Math.pow(10, k);
  const T = 0.8686 * (Math.pow(10, k) - 0.001) + (stopped ? real : 0);
  c.t = tIn; c.k = k; c.rate = rate; c.T = T; c.stopped = stopped; c.real = stopped ? real : 0; c.Tb = Math.min(T, 2);
  for (const key in PERIOD) {
    const P = PERIOD[key];
    c.ph[key] = fract(T / P); c.f[key] = rate / P; c.sw[key] = 1 - sstep(1, 2, c.f[key]);
  }
  c.wet = 1 - sstep(T_WET0, T_WET1, T);
  c.gyr = T / (1e9 * YEAR);
  c.glacial = glacial(c.ph.ice);
  return c;
}

// ---- sky frame: latitude 45 N unless the variation says otherwise ----
// pole P (azimuth 0), meridian point M (azimuth 180 on the celestial equator), east E. Azimuth a is (a - 315) from +x toward +z.
export function skyFrame(latDeg) {
  const az = (a, alt) => new THREE.Vector3(Math.cos(alt * DEG) * Math.cos((a - 315) * DEG), Math.sin(alt * DEG), Math.cos(alt * DEG) * Math.sin((a - 315) * DEG));
  return { P: az(0, latDeg), M: az(180, 90 - latDeg), E: az(90, 0), az };
}
export function sunFrom(frame, decl, hourAngle, out = new THREE.Vector3()) {
  const sd = Math.sin(decl), cd = Math.cos(decl);
  return out.copy(frame.P).multiplyScalar(sd).addScaledVector(frame.M, cd * Math.cos(hourAngle)).addScaledVector(frame.E, -cd * Math.sin(hourAngle));
}

// ---- GLSL shared by land, sea and sky ----
const GLSL_UNI = /* glsl */`
uniform sampler2D uHt, uCl, uNz;
uniform vec3 uCam, uKeyDir, uKeyCol, uAmbSky, uAmbGnd, uFogCol, uSunDir, uPole, uMer, uEast, uBandCol, uSkyZen, uSkyHor, uGlowCol, uDiscCol;
uniform float uTb, uPhSurf, uSwSurf, uPhCloud, uSwCloud, uPhDune, uSwDune, uRiverA, uRiverSpit, uSwRiver, uShore, uIceG, uIceR, uIceMean,
  uPhRange, uSwRange, uSnowLine, uSwYear, uWet, uSea, uSalt, uHardKey, uSwDay, uSinDs, uBandHalf, uDiscR, uDiscI, uMoonD, uSwMoon,
  uMoonI, uNight, uStarRot, uReal, uIsland, uIsleHot, uMirror, uForest, uKeyOn, uRangeMean, uTwi, uLook, uMoonLit;
uniform vec3 uGal;
uniform vec4 uLogs[7];
uniform vec3 uLogTip[7];
`;

// the land's height: one function, used by the grid's vertex shader, by the fragment normals and shadow tap, and by the sea
const GLSL_LAND = /* glsl */`
// The coast runs straight beside the path and then bends away to the sea side in a long bay, so that from the beach the
// land lies AHEAD as well as beside us. inl() is the distance inland from that shore line (at mean tide, before any shift).
float bend(float x) { return 1250. * smoothstep(700., 3000., x); }
float inl(vec2 p) { return p.y + bend(p.x); }
// The range. Its crests are long lines lying ACROSS the view (their axis 60 degrees off the heading), rank behind rank,
// each further rank standing higher, so that from the beach five skylines are seen one above another: swell seen from a
// beach. They roll toward the eye and the beach (toward -RNX). RORG is where the eye is when the range has its turn.
const vec2 RNX = vec2(0.866, 0.5);              // across the crests, pointing away from the eye and inland
const vec2 RAX = vec2(0.5, -0.866);
const vec2 RORG = vec2(365., 0.);
const float RLAM = 640.;                        // one crest every 640 m, one crest per period
float rangeW(vec2 p) { return inl(p) - 70.; }
const vec2 APEX = vec2(480., 200.);
float rangeEnv(vec2 p) {
  float a = dot(p - RORG, RNX), b = dot(p - RORG, RAX);
  float aa = max(a - 60., 0.);
  // each rank is born behind the highest one, climbs as it comes, and sinks into the plain behind the beach. The
  // envelope grows by the square of the distance, so seen from the beach every rank's brow stands a clear step above
  // the brow in front (about four degrees each): five skylines, and a brow that comes nearer is seen to come DOWN.
  float e = (1.26e-4 * aa * aa + 0.09 * aa) * (1. - smoothstep(3900., 6200., a));
  e *= 0.78 + 0.5 * textureLod(uNz, vec2(b / 7000., 0.21), 0.).r;          // spurs and saddles that stay put: the whaleback keeps them
  e *= mix(0.4, 1., smoothstep(250., 520., length((p - vec2(480., 90.)) * vec2(1., 1.6))));         // across the delta the rollers are only low swells in the sand
  return e * smoothstep(-20., 170., rangeW(p)) * smoothstep(-700., 200., p.y);   // its time average is this: one long whaleback
}
// peaks and cols along each crest, riding with it
float rangePk(float a, float b) { return 0.42 + 0.72 * textureLod(uNz, vec2(b / 8000., a / 10000.) + 0.23, 0.).r + 0.5 * textureLod(uNz, vec2(b / 3600., a / 7000.) + 0.71, 0.).r; }
// every crest line wanders as it runs (no rank is a ruled band), and the wander rides with it
float rangeA(float a, float b) { return a + 420. * (textureLod(uNz, vec2(b / 22000., a / 30000.) + 0.47, 0.).r - 0.5); }   // (long bends only: nothing finer than 340 m, so no chevrons)   // (no feature finer than four grid cells: a summit crossing the grid never boils)
float rangeTex(vec2 p, float scroll, float det) {
  float b = dot(p - RORG, RAX), a = rangeA(dot(p - RORG, RNX) + scroll, b);
  vec2 q = vec2(a / RLAM, b / 9000.);
  float h1 = textureLod(uHt, q, 0.).r;
  float h2 = textureLod(uHt, q * vec2(2., 1.7) + vec2(0.31, 0.17), 0.).r;
  float h = (0.88 * h1 * (0.5 + 0.5 * h1) + 0.12 * h2 * (0.3 + 0.7 * h1)) * rangePk(a, b);
#ifdef DETAIL
  // shading only (the grid cannot hold these, so they are in the fragment's normals and never in the silhouette):
  // buttresses and gullies running down the faces and a fine ridged grain, all riding with the crest they belong to
  if (det > 0.) {
  float fd = 1. - smoothstep(3000., 7000., distance(p, uCam.xz));
  float g1 = textureLod(uHt, vec2(b / 1500. + 0.25 * h1, a / 5200.) + 0.11, 0.).r;
  float g2 = textureLod(uHt, vec2(b / 520. + 0.4 * h1, a / 3100.) + 0.47, 0.).r;
  float h3 = textureLod(uNz, vec2(a, b) / 260., 0.).r;
  float mid = 0.3 + 2.8 * h1 * (1. - h1);                          // the faces are fluted; brow and trough are smooth
  h += det * fd * mid * (0.16 * (g1 - 0.4) + 0.05 * (g2 - 0.4) + 0.035 * (h3 - 0.5));
  }
#endif
  return h;
}
// where a point stands on its own swell: x = 0 in the trough, 1 on the brow; y = which side of its buttress it is on
// (1 = the side turned to the key, 0 = the side turned away); z = the swell's raw height, 0..0.9
vec3 rangeRel(vec2 p, float scroll) {
  float b = dot(p - RORG, RAX), a = rangeA(dot(p - RORG, RNX) + scroll, b);
  float h1 = textureLod(uHt, vec2(a / RLAM, b / 9000.), 0.).r;
  float wv = 0.2 * h1 + 0.5 * textureLod(uNz, vec2(b / 2100., a / 1300.) + 0.61, 0.).r;      // the buttresses lean and wander: no two alike
  float gA = textureLod(uHt, vec2((b + 55.) / 1500. + wv, a / 5200.) + 0.11, 0.).r + 0.3 * textureLod(uHt, vec2((b + 55.) / 520. + 1.3 * wv, a / 3100.) + 0.47, 0.).r;
  float gB = textureLod(uHt, vec2((b - 55.) / 1500. + wv, a / 5200.) + 0.11, 0.).r + 0.3 * textureLod(uHt, vec2((b - 55.) / 520. + 1.3 * wv, a / 3100.) + 0.47, 0.).r;
  return vec3(clamp(h1 * (0.5 + 0.5 * h1) / 0.8, 0., 1.), 1. - smoothstep(0.02, 0.11, gA - gB), h1);
}
float rangeOnly(vec2 q) { return rangeEnv(q) * rangeTex(q, uPhRange * RLAM, 0.); }
// coast profile against zc = z - shoreline shift: sea bed, beach 1 in 20, a dune ridge, the plain
float coast(float zc) {
  float bed = -120. * (1. - exp(min(zc - 25., 0.) / 1300.));
  float beach = (zc - 25.) / 20.;
  float up = 3.2 + 14. * smoothstep(120., 1500., zc) + 1.6 * smoothstep(60., 110., zc);
  float land = min(beach, up);
  return zc < 25. ? max(bed, beach) : land;
}
// Crescent dunes in four rows behind the beach, marching down the coast (-x, toward the eye), each row half a step out
// with its neighbours: long windward backs, short slip faces, horns ahead. Their time average is four low even ridges.
const float DLAM = 72., DROW = 62.;
float gChanW = 0., gChanM = 0.;                  // set by fanH: how near the river's bed is (the dunes stand back from it; its banks are long slopes)
float duneBand(float zc) { return smoothstep(36., 50., zc) * (1. - smoothstep(270., 292., zc)); }
vec3 duneQ(vec2 p, float zc) {                   // x: phase along the march (crest at 0.78); y: the row's lump, 0 at its edges, 1 on its axis; z: row
  float row = (zc + 7. * sin(p.x * 0.011) - 40.) / DROW, ri = floor(row), zl = fract(row) * 2. - 1.;
  float lump = 1. - zl * zl;
  float s = fract(-p.x / DLAM - uPhDune + 0.5 * ri + 0.37 * fract(ri * 0.618 + 0.2) + 0.3 * lump + 0.05 * sin(p.x * 0.013 + ri));
  return vec3(s, lump * lump, ri);
}
float duneH(vec2 p, float zc) {
  vec3 q = duneQ(p, zc);
  float crest = q.x < 0.78 ? q.x / 0.78 : (1. - q.x) / 0.22;
  crest = crest * crest * (3. - 2. * crest);
  return duneBand(zc) * q.y * 7.5 * (uSwDune * crest + (1. - uSwDune) * 0.5);
}
// the delta: a low cone about the river's apex; the live channel points along uRiverA and a spit stands where it just was
const vec2 ISLE = vec2(1000., -390.);
float fanH(vec2 p, out float chan) {
  vec2 d = p - APEX; float r = length(d);
  float ang = atan(d.x, -d.y + 1e-4);                           // 0 = straight to sea, + toward +x
  float fan = 8. * (1. - smoothstep(40., 430., r)) * smoothstep(-0.25, 0.35, -d.y / max(r, 70.));
  // the live channel: a ribbon from the apex along uRiverA, in two threads that part and rejoin; measured in metres from
  // its own centre line, so its banks are smooth slopes several cells wide everywhere, the apex included
  vec2 ca = vec2(sin(uRiverA), -cos(uRiverA));
  float al = dot(d, ca), pe = dot(d, vec2(-ca.y, ca.x));
  float m1 = 15. * sin(al * 0.021 + uRiverA * 3.) * smoothstep(40., 160., al);
  float m2 = 34. * sin(al * 0.0125 + 1.2 - uRiverA * 2.) * smoothstep(60., 200., al);
  float w1 = 12. + 0.03 * max(al, 0.), w2 = 7. + 0.016 * max(al, 0.);
  float e1 = (pe - m1) / w1, e2 = (pe - m2) / w2;
  float along = smoothstep(-45., 30., al) * (1. - smoothstep(380., 560., al));
  float t2 = smoothstep(40., 240., al);
  float c1 = exp(-e1 * e1), c2 = 0.85 * exp(-e2 * e2) * t2;
  chan = uSwRiver * along * (c1 + c2 - c1 * c2);
  c1 = exp(-e1 * e1 / 7.); c2 = exp(-e2 * e2 / 9.) * t2;
  gChanW = uSwRiver * along * (c1 + c2 - c1 * c2);
  c1 = exp(-e1 * e1 / 2.6); c2 = exp(-e2 * e2 / 2.6) * t2;
  gChanM = uSwRiver * along * (c1 + c2 - c1 * c2);
  // the feeder: one fixed reach from the hills down to the apex
  float fd = (d.x - 30. * sin(d.y * 0.012)) / 26.;
  chan = max(chan, uWet * exp(-fd * fd) * smoothstep(-30., 25., d.y) * (1. - smoothstep(250., 420., d.y)));
  gChanW = max(gChanW, uWet * exp(-fd * fd / 6.) * smoothstep(-60., 25., d.y) * (1. - smoothstep(250., 420., d.y)));
  gChanM = max(gChanM, uWet * exp(-fd * fd / 2.6) * smoothstep(-40., 25., d.y) * (1. - smoothstep(250., 420., d.y)));
  float ds = ang - (uRiverA - uRiverSpit * 0.16);
  float spit = uSwRiver * abs(uRiverSpit) * 2.4 * exp(-ds * ds / 0.012) * smoothstep(200., 300., r) * (1. - smoothstep(330., 430., r));
  return fan + spit;
}
// the ice sheet: a lobed front, a 100 m cliff, and behind it a dome climbing by the square root of the distance
float iceFront(vec2 p) {
  return mix(2700., 150., uIceR) + 150. * (textureLod(uHt, vec2(p.x / 1700. + 0.2, 0.37), 0.).r - 0.45)
    + 60. * (textureLod(uNz, vec2(p.x / 1100., 0.63), 0.).r - 0.5);
}
float iceSurf(vec2 p) {
  float d = inl(p) - iceFront(p);
  float s = 104. * smoothstep(0., 42., d) + 15. * sqrt(max(d, 0.)) + 10. * textureLod(uNz, p / 900., 0.).r * smoothstep(40., 240., d) - 6.;
  s = d > 0. ? s : max(-6. + 1.5 * d, -400.);
  return mix(-400., s, smoothstep(0., 0.07, uIceG));
}
// rock and sand only (no ice)
float groundH(vec2 p) {
  float zc = inl(p) - uShore;
  float h = coast(zc);
  float chan; float fan = fanH(p, chan);
  h += duneH(p, zc) * (1. - smoothstep(0.04, 0.7, gChanW));
  h += fan;
  float env = rangeEnv(p);
  h += env * (uSwRange * rangeTex(p, uPhRange * RLAM, 1.) + (1. - uSwRange) * uRangeMean);
  h = mix(h, min(h, -0.7), smoothstep(0.1, 0.95, gChanM));            // long gentle banks, many cells wide: the water's edge is never a wall (the river cuts through whatever rolls past)
  vec2 dk = p - vec2(450., 0.); h -= 9. * exp(-dot(dk, dk) / 900.);     // the scour hollow the stack stands in: a pool at its foot
  // the rare island: built out of the sea on the left and worn back to a shoal
  vec2 di = p - ISLE; float ri = length(di);
  h += uIsland * (330. * exp(-ri / 150.) * (0.8 + 0.2 * textureLod(uNz, di / 700. + 0.5, 0.).r) - 70. * exp(-ri * ri / 1800.));   // a cone with concave flanks and a crater
  float near = (1. - smoothstep(26., 60., abs(p.y))) * (1. - smoothstep(470., 560., p.x));   // the path's corridor, and no further than the ring
  h = mix(h, min(h, 27.), near);
  return h;
}
float landH(vec2 p) { return max(groundH(p), iceSurf(p)); }
// the stack (exempt from the law) as the sea, the wet sand and the ground see it: does a ray from o along d meet a column
// 9 m in radius whose top is at 31 m?
const vec2 STK = vec2(450., 0.);
float stackHit(vec3 o, vec3 d) {
  vec2 oc = o.xz - STK; float dl = max(length(d.xz), 1e-4); vec2 dn = d.xz / dl;
  float tb = -dot(oc, dn);
  float d2 = dot(oc, oc) - tb * tb;
  float y = o.y + d.y / dl * max(tb, 0.);
  return step(0., tb) * (1. - smoothstep(55., 100., d2)) * (1. - smoothstep(24., 33., y));
}
vec3 stackTone() { return vec3(0.2, 0.22, 0.26) * (uAmbSky * 1.9 + vec3(0.14, 0.2, 0.42) * clamp(dot(uAmbSky, vec3(0.9)) + 0.05, 0.06, 1.) + uKeyCol * uKeyOn * 0.3) * 0.3183; }
// cloud shadows: nine blobs to a tile, carried one tile per cloud period in off the sea; their average is a thin even veil
float cloudCover(vec2 p) {
  float cl = textureLod(uCl, vec2(p.x / 350. + uPhCloud, p.y / 250. - uPhCloud), 0.).r;
  // far off, only the big clouds' shadows are seen: broad shapes draped over dune and ridge, never a rash of spots
  float cb = textureLod(uCl, vec2(p.x / 2900. + uPhCloud + 0.37, p.y / 2100. - uPhCloud + 0.11), 0.).r;
  return mix(smoothstep(0.45, 0.62, cl), smoothstep(0.45, 0.62, cb), smoothstep(300., 1300., distance(p, uCam.xz)));
}
float cloudShade(vec2 p) { return 1. - uWet * (uSwCloud * 0.86 * cloudCover(p) + (1. - uSwCloud) * 0.12); }
float cloudShadeH(vec2 p, float h) { return cloudShade(p); }
float fogAmt(vec3 wp) {
  float d = distance(wp, uCam);
  return 1. - exp(-d * 3.1e-4 * (0.26 + 1.34 * exp(-max(wp.y, 0.) / 190.)));
}
`;

// the sky as a function of direction: the sea mirrors exactly this
const GLSL_SKY = /* glsl */`
float gRefl = 0.;          // 1 while a mirror (the sea, wet sand) is asking: the band's streak is then one gold, not a spectrum
vec3 sunTerm(vec3 d, float w, out float cover) {
  float D = asin(clamp(dot(d, uPole), -1., 1.));
  float Ds = asin(clamp(uSinDs, -1., 1.));
  float a = (D - Ds) / w; float arc = exp(-a * a);
  // the year's true average: brightness goes as 1 / sqrt(1 - x^2), so the band is dim in the middle and bright at both
  // edges, where the sun lingers at the solstices
  float x = D / uBandHalf;
  float inb = 1. - smoothstep(mix(0.965, 0.94, gRefl), mix(1.06, 1.14, gRefl), abs(x));   // a soft limb (a breath softer in a mirror): never a ruled edge
  float band = inb * min(inversesqrt(max(1. - x * x, 0.03)), 5.5);    // the mirror asks this same function: the streak on the sea is the band itself
  float md = 1. - uSwDay, my = 1. - uSwYear;
  float hor = smoothstep(-0.004, 0.02, d.y);
  cover = md * my * inb * 0.92 * hor;                                // a body of light: solid gold, the sky does not show through it
  float qd = acos(clamp(dot(d, uSunDir), -1., 1.)) / uDiscR;
  cover = max(cover, smoothstep(0.05, 0.2, uDiscR) * (1. - smoothstep(0.985, 1., qd)) * 0.85 * hor);
  float ox = max(abs(x) - 1., 0.) * uBandHalf;                       // radians outside the nearer edge
  // The year's sun: a solid gold body whose light climbs by the true 1 / sqrt law from its dim heart to each solstice
  // rail (gold all the way: the rails are only a breath paler, so the highlight keeps its hue). Outside each rail the
  // air itself is lit (a wide aureole), and where the band stands on the horizon it sets the haze glowing the way a low
  // sun does. Lower down it is seen through more air: warmer and a little dimmer.
  vec3 hi = vec3(max(uBandCol.r, max(uBandCol.g, uBandCol.b))) * vec3(1., 0.93, 0.78);
  float Lb = clamp(0.64 * band, 0.64, 2.4);                          // (the body stays under the bloom's threshold: only the rails glow, and no veil is thrown over the land)
  float edgeK = (Lb - 0.64) / 1.76;
  vec3 bcol = mix(uBandCol, hi, 0.1 + 0.15 * edgeK) * Lb;
  float up = max(d.y, 0.);
  float lift = 0.74 + 0.26 * smoothstep(0., 0.3, up);
  vec3 airT = mix(vec3(1., 0.7, 0.46), vec3(1.), smoothstep(0., 0.4, up));
  vec3 halo = uBandCol * (0.6 * exp(-ox * 16.) + 0.14 * exp(-ox * 4.5)) * (1. - inb) * (1. - 0.7 * gRefl);   // (a mirror keeps the band and lets most of its aureole go: one gold streak on a dark sea)
  vec3 glowH = mix(vec3(1., 0.46, 0.2), uBandCol, 0.45) * 0.55 * exp(-up * 13.) * exp(-ox * 3.2) * (1. - 0.6 * inb) * (1. - 0.6 * gRefl);
  vec3 c = md * (uBandCol * uSwYear * arc * 2.4 + my * (lift * airT * (bcol * inb + halo) + glowH));
  float am = (D - uMoonD) / (w * 0.8); float xm = D / 0.489;
  float mband = (1. - smoothstep(0.97, 1.08, abs(xm))) * min(inversesqrt(max(1. - xm * xm, 0.05)), 2.2);
  c += vec3(0.81, 0.85, 0.9) * md * uMoonI * (uSwMoon * exp(-am * am) * 0.3 + (1. - uSwMoon) * mband * 0.08 * (1. - 0.85 * inb * my) * (1. - 0.6 * gRefl));   // its own average: a faint silver margin just outside each gold edge
  // the disc: a hard small sun, or at the end a giant: bright at the heart, deep red at the limb, slow cells crawling on it
  float q = acos(clamp(dot(d, uSunDir), -1., 1.)) / uDiscR;
  float mu = sqrt(max(1. - q * q, 0.));
  float big = smoothstep(0.05, 0.2, uDiscR);
  vec2 sp = vec2(dot(d, uEast), dot(d, uPole)) * 1.3;
  float cell = textureLod(uNz, sp + vec2(uReal * 0.0035, 0.), 0.).r * 0.6 + textureLod(uNz, sp * 2.3 - vec2(0., uReal * 0.005), 0.).r * 0.4;
  vec3 dcol = mix(uDiscCol * (0.45 + 0.55 * mu), mix(vec3(0.30, 0.03, 0.018), vec3(0.80, 0.17, 0.045), mu * mu * (3. - 2. * mu)) * (0.9 + 0.2 * cell), big);
  float disc = 1. - smoothstep(mix(0.93, 0.985, big), 1., q);
  c += dcol * uDiscI * uSwDay * disc;
  // the air near the horizon reddens and dims whatever shines through it
  float ex = smoothstep(0., 0.11, d.y) * (0.8 + 0.2 * smoothstep(0.1, 0.5, d.y));     // amber only at its very foot, gold above, pale overhead
  return c * mix(vec3(0.95, 0.56, 0.3), vec3(1.), max(ex, 0.8 * gRefl * (1. - uSwDay))) * hor;
}
vec3 skyColor(vec3 d, float w);
// the river's water, silty and still: mostly a mirror of the sky. The sea plane and the land under the water both draw
// exactly this, so the water's edge in the channel is the height function's own line and never the grid's.
vec3 riverCol(vec3 V, vec3 amb, float cshade, float depth) {
  vec3 R = vec3(V.x, abs(V.y) + 0.002, V.z); R = normalize(R);
  gRefl = 1.;
  vec3 sk = min(skyColor(R, 0.016), vec3(1.25, 1.0, 0.8)) * 0.85 * (0.42 + 0.58 * cshade);
  float fr = 0.4 + 0.6 * pow(1. - clamp(-V.y, 0., 1.), 4.);
  vec3 w = mix(vec3(0.34, 0.43, 0.42) * amb * 0.5, sk, fr);
  return mix(mix(vec3(0.5, 0.47, 0.36) * amb * 0.6, sk, 0.45), w, smoothstep(0., 0.45, depth));      // silt shows through the shallows
}
vec3 skyColor(vec3 d, float w) {
  float h = max(d.y, 0.);
  vec3 c = mix(uSkyHor, uSkyZen, 1. - exp(-h * 3.4));
  c = mix(c, uSkyHor * 1.12, 0.5 * exp(-h * 26.));                    // a pale seam of haze lying on the horizon
  float g = max(dot(d, uSunDir), 0.); float g2 = g * g, g4 = g2 * g2, g16 = g4 * g4 * g4 * g4, g64 = g16 * g16 * g16 * g16;
  c += uGlowCol * uSwDay * (0.22 * g4 + 0.5 * g64 * g64);
  // the sun under the horizon still lights the air above where it is: the true twilight arch of the one night
  vec2 sa = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float taz = dot(d.xz / max(length(d.xz), 1e-3), sa);
  // (a midsummer night at this latitude is never quite dark: the sun slides along under the northern horizon and its
  // glow goes with it, amber on the sea's edge under a wide teal arch, from the dusk's place round to the dawn's)
  float tw = uTwi * smoothstep(-0.95, 0.85, taz);
  c += tw * (vec3(1.15, 0.47, 0.15) * exp(-h * 11.) + vec3(0.10, 0.30, 0.46) * exp(-h * 3.6));
  float cover; vec3 st = sunTerm(d, w, cover);
  return c * (1. - cover) + st;
}
`;

const VERT_WORLD = /* glsl */`
varying vec3 vW;
uniform float uMirror, uSea;
void main() { vec3 q = vec3(position.x, uSea, position.z); vW = q; gl_Position = projectionMatrix * viewMatrix * vec4(q.x, q.y, q.z * uMirror, 1.); }
`;

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main() {
  vD = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position * 100. + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}
`;
const SKY_FRAG = /* glsl */`
varying vec3 vD;
uniform sampler2D uStars;
${GLSL_UNI}
${GLSL_SKY}
void main() {
  vec3 d = normalize(vD);
  d.z *= uMirror;
  // heat shimmer, after the law is off: the lowest sky (and the giant's foot) wavers, on real time
  float shim = step(0.0005, uReal) * exp(-max(d.y, 0.) * 16.);
  d.y += shim * 0.0016 * (sin(d.x * 140. + d.z * 90. + uReal * 5.3) + 0.7 * sin(d.z * 337. - d.x * 51. - uReal * 7.1) + 0.5 * sin(d.x * 613. + uReal * 3.7));
  d = normalize(d);
  float D = asin(clamp(dot(d, uPole), -1., 1.));
  float w = max(0.0052, 1.5 * fwidth(D));
  vec3 c = skyColor(d, w);
  // stars: a map in hour angle and declination, turned by the sidereal phase
  float hx = dot(d, uMer), hy = dot(d, uEast);
  float H = atan(hy, hx + (abs(hx) + abs(hy) < 1e-5 ? 1e-5 : 0.));
  vec2 suv = vec2(H / 6.2831853 + uStarRot, D / 3.14159265 + 0.5);
  float st = textureLod(uStars, suv, 0.).r; st = st * st * st * 2.2;
  c += vec3(0.8, 0.88, 1.) * st * 3.6 * uNight * smoothstep(0.02, 0.2, d.y);
  // the Milky Way: fixed among the stars, so it wheels with them
  float Hs = suv.x * 6.2831853, cD = cos(D);
  vec3 sv = vec3(cD * cos(Hs), cD * sin(Hs), sin(D));
  float gx = dot(sv, uGal);
  float mn = textureLod(uNz, sv.xy * 1.1 + sv.z * 0.63, 0.).r, mn2 = textureLod(uNz, sv.yz * 3.1 + sv.x * 1.7, 0.).r;
  float mw = exp(-gx * gx * 16.) * (0.45 + 1.1 * mn * mn) * (0.75 + 0.5 * mn2);
  mw *= 1. - 0.75 * exp(-(gx - 0.03) * (gx - 0.03) * 900.) * smoothstep(0.35, 0.6, mn2);      // a dark lane down its middle
  c += (vec3(0.42, 0.52, 0.95) + vec3(0.5, 0.3, 0.12) * mn) * mw * 0.2 * uNight * smoothstep(0.02, 0.25, d.y);
  // below the horizon: the haze colour, so the dome never shows a hole under the sea's edge
  c = mix(uFogCol, c, smoothstep(-0.03, 0.012, d.y));
  gl_FragColor = vec4(c, 1.);
}
`;

const SEA_FRAG = /* glsl */`
varying vec3 vW;
${GLSL_UNI}
${GLSL_LAND}
${GLSL_SKY}
void main() {
  vec2 p = vW.xz;
  float depth = uSea - groundH(p);
  if (depth < -0.02) discard;
  vec3 V = normalize(vW - uCam);
  float dist = distance(vW, uCam);
  // swell and chop, every wavelength an integer multiple of the surf's one phase; flattened to silk as the swing goes
  float att = uSwSurf / (1. + dist * 0.004);
  vec2 n = vec2(0.);
  n += vec2(0.25, 1.) * 0.055 * cos(6.2831853 * ((p.y + 0.25 * p.x) / 46. - uPhSurf));
  n += vec2(-0.4, 1.) * 0.05 * cos(6.2831853 * ((p.y - 0.4 * p.x) / 19. - 2. * uPhSurf));
  n += vec2(0.9, 0.6) * 0.04 * cos(6.2831853 * ((0.6 * p.y + 0.9 * p.x) / 7.3 - 3. * uPhSurf));
  n += vec2(-0.7, 0.8) * 0.03 * cos(6.2831853 * ((0.8 * p.y - 0.7 * p.x) / 3.1 - 5. * uPhSurf));
  // chop and cat's-paws close to the eye (integer multiples of the same phase), bent by a slow grain so no line is ruled
  float nearS = 1. / (1. + dist * 0.035);
  float w1 = textureLod(uNz, p / 31. + 0.2, 0.).r, w2 = textureLod(uNz, p.yx / 11. + 0.5, 0.).r;
  n += vec2(0.6, 0.8) * 0.06 * nearS * cos(6.2831853 * (dot(p, vec2(0.6, 0.8)) / 1.7 + 1.6 * w1 - 8. * uPhSurf));
  n += vec2(-0.8, 0.5) * 0.05 * nearS * cos(6.2831853 * (dot(p, vec2(-0.8, 0.5)) / 0.83 + 2.1 * w2 - 11. * uPhSurf));
  n += vec2(0.2, -1.) * 0.035 * nearS * cos(6.2831853 * (dot(p, vec2(0.2, -1.)) / 0.37 + 3. * w1 + 2. * w2 - 16. * uPhSurf));
  n += (vec2(w1, w2) - 0.4) * 0.07;
  vec3 N = normalize(vec3(-n.x * att, 1., -n.y * att));
  vec3 R = reflect(V, N); R.y = abs(R.y) + 0.002;
  gRefl = 1.;
  float fres = 0.04 + 0.96 * pow(1. - max(dot(-V, N), 0.), 5.);
  float cshade = cloudShade(p);
  vec3 lit = (uAmbSky * 1.6 * (0.5 + 0.5 * cshade) + uKeyCol * uKeyOn * 0.22 * cshade) * 0.3183;
  vec3 deep = mix(vec3(0.028, 0.15, 0.23), vec3(0.11, 0.25, 0.38), 1. - uSwSurf) * lit;
  vec3 shal = mix(vec3(0.13, 0.40, 0.37), vec3(0.30, 0.47, 0.47), 1. - uSwSurf) * lit * 1.15;
  vec3 body = mix(shal, deep, 1. - exp(-max(depth, 0.) / 2.6));
  // once the surf is silk the bed shows through it: a turquoise ribbon of shallows along the shore, sand under the last of it
  float silk = (1. - uSwSurf) * uWet;
  float shalK = silk * exp(-max(depth, 0.) / 1.7);
  body = mix(body, vec3(0.26, 0.86, 0.78) * lit * 1.25, 0.8 * shalK);
  body = mix(vec3(0.42, 0.40, 0.29) * lit * (1. + 1.2 * silk), body, 1. - exp(-max(depth, 0.) / mix(0.35, 0.8, silk)));      // the sand shows through the last hand's depth
  // light scattered up through the faces of the chop that lean toward the sun
  body += vec3(0.05, 0.22, 0.19) * lit * uSwSurf * clamp(dot(N.xz, uSunDir.xz) * 6., 0., 1.) * uSwDay;
  vec3 c = mix(body, min(skyColor(R, 0.016), vec3(2.3, 1.62, 0.8)) * 0.82 * (0.5 + 0.5 * cshade), fres * (1. - 0.6 * shalK));
  float chS; float fanS = fanH(p, chS);
  c = mix(c, riverCol(V, uAmbSky * 1.6, cshade, depth), smoothstep(0.12, 0.45, chS) * uWet);
  float sr = stackHit(vW, R);                                         // the stack stands in its own reflection
  c = mix(c, c * 0.5 + stackTone() * (0.25 + 0.75 * fres), sr * 0.9);
  // sun glitter while there are waves to scatter it
  float gl = max(dot(R, uSunDir), 0.); float gl8 = gl * gl; gl8 *= gl8; gl8 *= gl8; float gl64 = gl8 * gl8; gl64 *= gl64; gl64 *= gl64;
  c += uDiscCol * uSwDay * uSwSurf * (gl64 * gl64 * gl64 * 2.6 + gl8 * gl8 * 0.05) * (1. - sr);
  // surf: foam lines run up the beach at the speed of a wave; their average is one pale swash band
  float rag = textureLod(uNz, p / 90., 0.).r, rag2 = textureLod(uNz, p.yx / 23. + 0.4, 0.).r;
  float lace = textureLod(uNz, p / 4.1 + vec2(0.3 * rag, uPhSurf), 0.).r * 0.62 + textureLod(uNz, p.yx / 15. + 0.3, 0.).r * 0.5;
  float run = depth * 20. / 15. + 0.5 * rag + 0.12 * sin(p.x / 17.);
  float f = fract(run + uPhSurf);
  float foam = uSwSurf * (smoothstep(0.93, 0.99, f) * 0.7 + smoothstep(0.55, 0.97, f) * 0.6 * smoothstep(0.56, 0.64, lace)) * (0.15 + 0.85 * smoothstep(0.3, 0.6, rag2)) * (1. - smoothstep(1.2, 2.4, depth));
  foam += uSwSurf * (1. - smoothstep(0.0, 0.22, depth)) * (0.35 + 0.6 * smoothstep(0.5, 0.6, lace));
  foam += uSwSurf * 0.4 * smoothstep(0.6, 0.68, lace) * (1. - smoothstep(0.2, 0.8, depth));      // lace left on the shallows by the last wave
  foam += (1. - uSwSurf) * (0.5 * (1. - smoothstep(0., 0.45, depth)) + 0.16 * (1. - smoothstep(0., 1.6, depth))) * (0.6 + 0.8 * rag);
  c = mix(c, vec3(0.86, 0.9, 0.9) * lit * 3.14, clamp(foam, 0., 1.) * uWet * (1. - smoothstep(0.12, 0.45, chS)));
  c = mix(c, uFogCol, fogAmt(vW));
  gl_FragColor = vec4(c, 1.);
}
`;

// LAND: one grid; the vertex shader places every vertex by the one height function, the fragment shader reads the same
// function again for normals, a shadow tap toward the key, and what the ground is made of.
const LAND_VERT = /* glsl */`
varying vec3 vW;
varying float vIce;
${GLSL_UNI}
${GLSL_LAND}
void main() {
  vec2 p = position.xz;
  float gv = groundH(p), iv = iceSurf(p);
  vec3 q = vec3(p.x, max(gv, iv), p.y);
  vW = q; vIce = iv - gv;
  gl_Position = projectionMatrix * viewMatrix * vec4(q.x, q.y, q.z * uMirror, 1.);
}
`;
const LAND_FRAG = /* glsl */`
#define DETAIL
varying vec3 vW;
varying float vIce;
${GLSL_UNI}
${GLSL_LAND}
${GLSL_SKY}
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a, ap = p - a;
  float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
  return length(ap - ab * t);
}
void main() {
  vec2 p = vW.xz;
  float dist = distance(vW, uCam);
  float e = clamp(dist * 0.004, 0.6, 40.);
  float g0 = groundH(p), ic = iceSurf(p);
  float isIce = max(step(g0 + 0.02, ic), step(1.5, vW.y - g0) * step(-25., vIce));   // the wall's foot is ice wherever the grid has lifted it
  float hL = landH(p - vec2(e, 0.)), hR = landH(p + vec2(e, 0.)), hD = landH(p - vec2(0., e)), hU = landH(p + vec2(0., e));
  vec3 N = normalize(vec3(hL - hR, 2. * e, hD - hU));
  float h = max(g0, ic);
  float zc = inl(p) - uShore;
  float slope = 1. - N.y;
  float grain = textureLod(uNz, p / 37., 0.).r;
  float grain2 = textureLod(uNz, p / 410. + 0.37, 0.).r;

  // what it is made of
  float grain3 = textureLod(uNz, p / 7.3 + 0.61, 0.).r;
  float near = 1. - smoothstep(60., 420., dist);
  float grain4 = textureLod(uNz, p / 1.7 + 0.13, 0.).r;
  vec3 sand = vec3(0.66, 0.55, 0.37) * (0.78 + 0.2 * grain + 0.16 * grain2 + 0.16 * grain3 * near + 0.2 * (grain4 - 0.5) * (1. - smoothstep(20., 110., dist)));
  sand *= 0.85 + 0.33 * textureLod(uNz, vec2(p.x / 230. + 0.2 * grain2, p.y / 27.) + 0.77, 0.).r;      // wind-sorted streaks lying along the coast
  // lines of dark heavy sand sorted along the shore by the swash: they are what the swash leaves on average
  float lineS = textureLod(uNz, vec2(p.x / 260., (inl(p) - uShore + 9. * grain2 + 2.5 * sin(p.x / 23.)) / 11.), 0.).r;
  sand = mix(sand, vec3(0.42, 0.33, 0.24), 0.32 * smoothstep(0.56, 0.7, lineS) * (1. - smoothstep(3., 6.5, g0)) * smoothstep(1.2, 2.2, g0) * (1. - smoothstep(500., 1400., dist)));
  vec3 wetSand = vec3(0.43, 0.36, 0.235);
  // rock: bedded, the beds tilted a little along the range, ochre over umber
  float strata = textureLod(uHt, vec2(g0 / 240. + 0.3 * grain2 + p.x / 7000., 0.13 + p.y / 9000.), 0.).r;
  float bare = uSalt * uSwRange;                                       // 1 only after the law is off: the stop finds bare rock, crisp
  float strK = mix(mix(0.5, 0.16, smoothstep(500., 2600., dist)), 0.8, bare);          // bedding is a whisper, and fainter with distance: the ranks are told apart by light and haze, not stripes
  vec3 rock = mix(vec3(0.33, 0.225, 0.15), mix(mix(vec3(0.20, 0.135, 0.10), vec3(0.10, 0.06, 0.05), bare), vec3(0.44, 0.30, 0.185), smoothstep(0.15, 0.75, strata)), strK) * (0.85 + 0.3 * grain2);
  vec3 forest = mix(vec3(0.07, 0.15, 0.055), vec3(0.16, 0.25, 0.075), smoothstep(0.4, 0.62, grain)) * (0.8 + 0.4 * grain2);   // wood and meadow: a tone, no trees
  float wetAmt = (1. - smoothstep(1.1, 1.9, g0)) * uWet;
  vec3 alb = mix(sand, wetSand, wetAmt);
  float swashL = (1. - uSwSurf) * uWet * (1. - smoothstep(0.02, 0.5, abs(g0 - uSea))) * (0.6 + 0.6 * grain2);   // the surf's own average: one pale band of foam lying along the water's edge
  alb = mix(alb, vec3(0.80, 0.80, 0.76), 0.62 * swashL);   // the swash, averaged: a soft pale film either side of the water's edge
  // the sea bed, when the sea draws back: dark wet mud with pale standing pools, plainly not beach sand
  float cz = coast(zc);
  float pool = smoothstep(0.55, 0.61, textureLod(uNz, p / vec2(520., 150.) + 0.21, 0.).r);
  vec2 dI = p - ISLE; float rI = length(dI);
  float mudAmt = (1. - smoothstep(-2.8, -1.6, cz)) * uWet * (1. - uIsland * exp(-rI / 300.));
  float poolN = textureLod(uNz, p / vec2(520., 150.) + 0.21, 0.).r + (0.07 * (grain - 0.5) + 0.035 * (grain3 - 0.5)) * smoothstep(0., 0.07, uSalt);   // a brine pool's shore is lobed and crisp close to
  float brine = smoothstep(0., 0.07, uSalt);                           // the last drying: what is left standing is brine
  float hue = textureLod(uNz, p / vec2(900., 420.) + 0.63, 0.).r;
  vec3 brineCol = mix(vec3(0.40, 0.55, 0.53), vec3(0.64, 0.51, 0.45), smoothstep(0.46, 0.6, hue));   // two pale mineral tints (verdigris, rose): the first word is salt
  brineCol *= 0.7 + 0.6 * smoothstep(0.58, 0.7, poolN);                // deeper, darker toward each pool's middle
  vec3 mudCol = mix(vec3(0.06, 0.07, 0.075), vec3(0.27, 0.225, 0.18), brine) * (0.6 + 0.8 * grain) * (0.75 + 0.5 * lineS);
  float rim = smoothstep(0.49, 0.545, poolN) * (1. - pool) * brine;      // each pool lies in a rim of white salt it has left
  mudCol = mix(mudCol, vec3(0.86, 0.84, 0.78), 0.85 * rim);
  vec3 mud = mix(mudCol, mix(vec3(0.30, 0.42, 0.52), brineCol, brine), mix(0.75, 0.96, brine) * mix(pool, smoothstep(0.555, 0.59, poolN), brine));
  alb = mix(alb, mud, mudAmt);
  // dunes: pale crests, a crisp blue shadow on every slip face, coarse darker troughs: travelling whatever the light is doing
  float chF; float fanF = fanH(p, chF);
  vec3 dq = duneQ(p, zc);
  float dband = duneBand(zc) * dq.y * (1. - smoothstep(0.04, 0.7, gChanW));
  float ds = dq.x;
  float slip = smoothstep(0.775, 0.795, ds) * (1. - smoothstep(0.93, 0.985, ds)) * smoothstep(0.08, 0.3, dband) * uSwDune;
  float back = smoothstep(0.1, 0.78, ds) * (1. - smoothstep(0.775, 0.795, ds));
  alb *= 1. - 0.22 * dband * uSwDune * (1. - smoothstep(0., 0.4, ds)) * (1. - slip);
  alb = mix(alb, vec3(0.86, 0.78, 0.6), dband * uSwDune * back * back * 0.6);
  alb *= mix(1., 0.76 + 0.42 * dq.y, duneBand(zc) * (1. - uSwDune) * (1. - smoothstep(0.04, 0.7, gChanW)));
  float dOn = smoothstep(0.08, 0.3, dband) * uSwDune;
  float rip = sin(ds * 62. + 5. * grain + 9. * grain2);                // ripples lying along the contours of each back
  alb *= 1. + 0.2 * rip * dOn * back * (1. - smoothstep(450., 1000., dist));
  float knife = smoothstep(0.69, 0.776, ds) * (1. - smoothstep(0.778, 0.794, ds)) * dOn;
  alb = mix(alb, vec3(0.98, 0.91, 0.72), 0.75 * knife);               // the crest: a pale knife edge
  float slipG = smoothstep(0.79, 0.97, ds);
  alb = mix(alb, mix(vec3(0.50, 0.50, 0.52), vec3(0.64, 0.60, 0.58), slipG), 0.5 * slip);   // the slip face: fine pale sand in shade (its colour comes from the sky that fills it), paler toward its foot
  alb = mix(alb, vec3(0.72, 0.64, 0.47) * (0.92 + 0.14 * grain), clamp(fanF / 8., 0., 1.) * 0.65 * (1. - smoothstep(30., 60., g0)) * (1. - dband * uSwDune));      // the fan: pale silt
  float chAmt = smoothstep(0.04, 0.3, chF) * (1. - smoothstep(30., 60., g0));
  alb = mix(alb, vec3(0.50, 0.44, 0.33) * (0.9 + 0.2 * grain), chAmt * 0.7);
  float rk = max(smoothstep(0.10, 0.28, slope), smoothstep(20., 90., g0));
  alb = mix(alb, rock, rk);
  float renv = rangeEnv(p);
  vec3 rr = rangeRel(p, uPhRange * RLAM);
  // The forest: a tone, no trees. It clothes the plain behind the dunes and the lower slopes of every rank, thinning upward
  // to a ragged treeline well under the snowline, and leaves the steep faces and the brows to the rock. While the year is
  // the travelling rung it turns with the seasons (summer green, rust, bare under the low snowline); then it is its mean.
  float season = clamp((uSnowLine - 1500.) / 900., -1., 1.);
  vec3 fSummer = mix(vec3(0.055, 0.150, 0.045), vec3(0.185, 0.310, 0.070), smoothstep(0.38, 0.64, grain)) * (0.8 + 0.4 * grain2);
  vec3 fAutumn = mix(vec3(0.30, 0.115, 0.03), vec3(0.40, 0.25, 0.045), smoothstep(0.35, 0.65, grain));
  vec3 fBare = vec3(0.17, 0.14, 0.11) * (0.8 + 0.4 * grain);
  vec3 fNow = mix(mix(fBare, fAutumn, smoothstep(-0.75, -0.1, season)), fSummer, smoothstep(-0.05, 0.6, season));
  vec3 fMean = mix(fSummer, fAutumn, 0.22) * 1.05;
  forest = mix(fMean, fNow, uSwYear);
  float treeTop = 520. + 280. * grain2 - 260. * smoothstep(0.5, 0.85, rr.x) * uSwRange;       // lower under each brow: the brows stay rock and snow
  float inK = smoothstep(110., 240., zc);
  float fo = uForest * uWet * smoothstep(mix(2.5, 4.5, inK), mix(3.6, 9., inK), g0) * (1. - smoothstep(0.52, 0.82, slope + 0.2 * (grain - 0.5))) * (1. - smoothstep(treeTop - 90., treeTop + 60., g0))
    * (1. - duneBand(zc) * uSwDune) * (1. - isIce);
  // on the range it keeps to the troughs and the feet of the ranks (and to the foot of the whaleback): the faces are rock, for the key to split
  fo *= 1. - uSwRange * smoothstep(3., 40., renv) * smoothstep(0.27, 0.56, rr.x + 0.14 * (grain - 0.5));
  fo *= 1. - (1. - uSwRange) * smoothstep(20., 200., renv) * smoothstep(24., 70., g0 + 20. * (grain2 - 0.5));
  // toward the shore it thins to dune grass in tufts and patches: on the dunes only once they have stopped marching
  float tuft = smoothstep(0.45, 0.55, 0.3 * grain3 + 0.7 * grain + 0.3 * smoothstep(50., 200., zc) - 0.1);
  tuft *= mix(1., smoothstep(0.3, 0.52, 0.62 * grain3 + 0.5 * grain4), 1. - smoothstep(90., 380., dist));      // close to, a patch is clumps with sand between them, not a blot
  fo *= mix(tuft * smoothstep(40., 66., zc + 26. * grain2) * (1. - clamp(fanF / 2.5, 0., 1.) * uSwRiver) * (1. - chAmt), 1., inK);
  forest = mix(mix(vec3(0.14, 0.24, 0.06), vec3(0.30, 0.31, 0.09), grain4), forest, 0.25 + 0.75 * inK);
  // while the ice is abroad nothing green stands within its reach: bare ground at the foot of the wall, a grey-green
  // tundra tone out to some 800 m ahead of the front; the green follows the front back as it goes
  float zf = iceFront(p), dfr = inl(p) - zf;
  float cold = smoothstep(0.02, 0.12, uIceG) * (1. - smoothstep(180., 800., -dfr));
  forest = mix(forest, vec3(0.17, 0.20, 0.17) * (0.85 + 0.3 * grain2), cold);
  fo *= 1. - 0.75 * smoothstep(0.02, 0.12, uIceG) * (1. - smoothstep(50., 260., -dfr));
  float foK = fo * (0.74 + 0.22 * smoothstep(0.35, 0.65, grain2));
  alb = mix(alb, forest, foK);
  // snow: above the breathing snowline; once the year has blurred, its average whitens every crest like foam on a swell
  // (a white brow rides every high crest: it is what the eye follows as the rank comes on; the whaleback keeps a white top)
  float snowMean = mix(0.85 * smoothstep(760., 1000., g0 + 70. * grain2), smoothstep(0.8, 0.97, rr.x + 0.1 * grain2) * smoothstep(620., 1000., renv), uSwRange);
  // (and the year's true average on the heights: the snowline spends about a third of every year below the summits, so
  // the top of the range is dusted, more the higher, where the ground is not too steep to hold it)
  snowMean = max(snowMean, 0.8 * smoothstep(520., 960., g0 + 110. * (grain2 - 0.5)) * (1. - smoothstep(0.72, 0.98, slope + 0.2 * (grain - 0.5))) * uSwRange);
  float snow = uSwYear * smoothstep(uSnowLine - 50., uSnowLine + 50., g0 + 60. * grain2) + (1. - uSwYear) * snowMean;
  float snowAmt = snow * uWet * (1. - 0.6 * smoothstep(0.5, 0.8, slope) * (1. - smoothstep(1500., 3500., dist))) * (1. - 0.8 * (1. - uSwYear) * smoothstep(0.42, 0.72, slope));   // (the steep faces under a white brow are bare rock)
  alb = mix(alb, vec3(0.84, 0.87, 0.9), snowAmt);
  // on the steep faces the year's mean snow lies where a face can hold it: in the gullies, as white streaks running down
  // from the heights (so the grain of a cliff reads as couloirs, not as a smear)
  float gul = textureLod(uNz, vec2(dot(p - RORG, RAX) / 130. + 0.5 * grain2, g0 / 1500.) + 0.41, 0.).r;
  float dust = (1. - uSwYear) * uSwRange * uWet * smoothstep(430., 900., g0 + 160. * (grain2 - 0.5)) * smoothstep(0.42, 0.6, gul + 0.25 * smoothstep(700., 1100., g0)) * rk * (1. - isIce);
  alb = mix(alb, vec3(0.84, 0.87, 0.9), 0.85 * dust * (1. - snowAmt));
  alb = mix(alb, vec3(0.72, 0.8, 0.84), uIceMean * uWet * 0.6 * smoothstep(650., 900., g0));
  // the dry sea bed is salt: a pale crust broken into plates by darker seams
  float bed = 1. - smoothstep(-1.5, 1.5, cz);
  float cr1 = textureLod(uNz, p / 150. + 0.3, 0.).r, cr2 = textureLod(uNz, p.yx / 44. + 0.7, 0.).r;
  float crack = 0.6 * (1. - smoothstep(0., 0.05, abs(cr1 - 0.5))) * (1. - smoothstep(300., 900., dist)) + 0.45 * (1. - smoothstep(0., 0.05, abs(cr2 - 0.5))) * (1. - smoothstep(30., 140., dist));
  vec3 salt = mix(vec3(0.80, 0.73, 0.60) * (0.9 + 0.14 * grain), vec3(0.46, 0.38, 0.30), crack);
  // where the last brine stood the crust keeps its stain (rose, ochre, verdigris) inside a paler rim
  float stain = smoothstep(0.555, 0.59, poolN);
  salt = mix(salt, salt * mix(vec3(1.), brineCol * 1.7, 0.4), stain);
  salt = mix(salt, vec3(0.88, 0.85, 0.78), 0.5 * smoothstep(0.49, 0.545, poolN) * (1. - stain));
  float saltAmt = uSalt * bed * (1. - rk);
  alb = mix(alb, salt, saltAmt);
  // ice: a white sheet with faint moraine lines carried toward the front; its cliff is a blue wall split by vertical
  // clefts into seracs, bedded level; a dark line of moraine lies along its foot
  float sf = fract(dfr / 260. + 0.5 * grain2);
  float stripe = smoothstep(0.42, 0.5, sf) * (1. - smoothstep(0.5, 0.58, sf)) * smoothstep(60., 160., dfr);
  vec3 ice = mix(vec3(0.80, 0.88, 0.95), vec3(0.50, 0.57, 0.64), 0.22 * stripe) * (0.92 + 0.14 * grain2);
  float beds = textureLod(uHt, vec2(h / 23. + 0.5 * grain2, p.x / 1300.), 0.).r;
  float faceAmt = (1. - smoothstep(36., 58., dfr)) * smoothstep(0.1, 0.34, slope);
  float ser = textureLod(uNz, vec2((p.x + 0.6 * p.y) / 70. + 0.4 * grain2, h / 900.), 0.).r;
  float cleft = smoothstep(0.5, 0.58, ser);
  vec3 face = mix(vec3(0.36, 0.62, 0.86), vec3(0.07, 0.24, 0.50), cleft) * (0.8 + 0.4 * smoothstep(0.1, 0.75, beds));
  face = mix(face, vec3(0.74, 0.86, 0.95), smoothstep(74., 100., vW.y - g0) * 0.7);       // the lip, where the light comes through
  ice = mix(ice, face, faceAmt);
  alb = mix(alb, vec3(0.085, 0.078, 0.075) * (0.6 + 0.8 * grain), smoothstep(-42., -6., dfr) * (1. - isIce) * smoothstep(0.02, 0.12, uIceG) * (1. - smoothstep(60., 300., g0)));   // moraine
  alb = mix(alb, ice, isIce);
  // the rare island: black new rock, ash-grey lower down
  float isle = uIsland * (1. - smoothstep(380., 620., rI)) * smoothstep(-2., 6., g0);
  alb = mix(alb, mix(vec3(0.07, 0.062, 0.06), vec3(0.026, 0.024, 0.03), smoothstep(8., 90., g0)) * (0.8 + 0.4 * grain), isle * 0.97);

  // wind ripples on dry sand: they belong to the day, and go to smooth sand when the days blur (salt keeps its own grain)
  float sandAmt = (1. - rk) * (1. - isIce) * (1. - mudAmt) * (1. - fo) * (1. - saltAmt) * (1. - isle);
  float r1 = sin(p.x * 4.4 + 6. * grain + 1.3 * sin(p.y * 0.5)), r2 = sin(dot(p, vec2(0.9, 0.35)) + 5. * grain2);
  float r3 = sin(dot(p, vec2(0.66, 0.2)) + 4. * grain2 + 2.5 * grain);        // the long even ripple that is always there, whatever has blurred
  N = normalize(N + vec3(1., 0., 0.25) * ((0.15 * r1 * (1. - smoothstep(12., 70., dist)) + 0.06 * r2 * near) * (0.6 + 0.4 * uSwDay) + 0.07 * r3 * (1. - smoothstep(200., 700., dist))) * sandAmt * (1. - 0.9 * wetAmt));

  // light
  vec3 L = uKeyDir;
  float ndl = dot(N, L);
  float hk = max(max(uHardKey, 0.85 * (1. - uSwYear) * (1. - uSwDay) * rk), bare * rk);   // on rock the band's light is decided as soon as the band stands
  float key = mix(clamp(ndl, 0., 1.), smoothstep(0.4, 0.75, ndl), hk);
  // soft cast shadow: two taps of the height function along the ray toward the key
  vec2 lxz = L.xz; float ly = max(L.y, 0.06);
  float s1 = 90. + dist * 0.02, s2 = 420.;
  float o1 = landH(p + lxz * s1) - (h + ly * s1);
  float o2 = landH(p + lxz * s2) - (h + ly * s2);
  float o0 = landH(p + lxz * 16.) - (h + ly * 16.);
  float sh = (1. - smoothstep(-8., 30., o1)) * (1. - smoothstep(-20., 90., o2)) * (1. - 0.8 * smoothstep(-1., 3., o0));
  float cshd = cloudShadeH(p, h);
  sh *= cshd;
  // the logs' shadows: the hands of the day's clock
  float lg = 0.;
  for (int i = 0; i < 7; i++) {
    vec3 tip = uLogTip[i];
    vec2 st = tip.xz - lxz / ly * min(tip.y, 60. * ly);
    float dS = segDist(p, uLogs[i].xy, st);
    lg = max(lg, uLogs[i].w * (1. - smoothstep(0.3, 0.95, dS)));
  }
  sh *= 1. - 0.8 * lg * uSwDay * (1. - isIce);
  sh *= 1. - 0.8 * stackHit(vec3(p.x, h, p.y), L);                    // the stack's own shadow: the one that never blurs away
  // The range in ranks: where a point stands on its own swell decides how it is seen. The brow and the buttresses under
  // it take the key; the face below lies in the shadow of the rank in front; the foot stands in the haze of the trough.
  float rOn = uSwRange * smoothstep(0.5, 9., renv) * (1. - isIce);       // down to the low rollers that cross the plain and the sand
  float rOnM = uSwRange * smoothstep(40., 260., renv) * (1. - isIce);
  vec3 Lr = normalize(vec3(uKeyDir.x + 0.9 * RAX.x, uKeyDir.y, uKeyDir.z + 0.9 * RAX.y));
  float keyR = smoothstep(0.28, 0.62, dot(N, Lr));
  float away = max(0.68 * (1. - rr.y), 1. - keyR) * smoothstep(0.3, 0.55, rr.x);   // the sides of every summit and buttress turned from the key
  float foot = 1. - smoothstep(0.3, 0.55, rr.x);                        // and the foot of every face
  float shadeR = rOn * max(away, foot) * (0.45 + 0.55 * max(uLook, 0.8 * bare));
  // the whaleback, when the range is only its average, is still a lit thing: its spurs' far sides lie in violet shadow
  float mOn = (1. - uSwRange) * smoothstep(20., 200., renv) * (1. - isIce);
  vec3 Lm = normalize(vec3(uKeyDir.x + 1.7 * RAX.x, 0.8 * uKeyDir.y, uKeyDir.z + 1.7 * RAX.y));
  float spurM = smoothstep(0.47, 0.6, textureLod(uNz, vec2(dot(p - RORG, RAX) / 4200. + 0.00006 * g0, dot(p - RORG, RNX) / 11000.) + 0.19, 0.).r);
  float shadeM = mOn * max(1. - smoothstep(0.04, 0.26, dot(N, Lm) + 0.2 * (grain2 - 0.5)), 0.9 * spurM) * uHardKey;
  shadeR = max(shadeR, 0.85 * shadeM);
  shadeR *= 1. - 0.6 * foK * (1. - smoothstep(20., 120., renv));        // the wooded plain at the range's foot is in haze, not in night
  float ao = mix(1., 0.6 + 0.4 * smoothstep(0.1, 0.6, rr.x), rOn);
  alb *= mix(1., 0.8 + 0.45 * smoothstep(0.5, 0.95, rr.x), rOn * rk);   // richer toward each brow
  // under the true sun (before the band's decided key) every brow catches it: a warm line along the top of each blue rank
  float browSun = smoothstep(0.76, 0.95, rr.x) * rOn * (1. - uHardKey) * uLook * clamp(uKeyDir.y * 2., 0., 1.);
  shadeR *= 1. - 0.85 * browSun;
  alb = mix(alb, vec3(0.60, 0.44, 0.27) * (0.85 + 0.3 * grain2), 0.55 * browSun * rk * (1. - snowAmt));
  sh *= 1. - 0.8 * shadeR;
  sh *= 1. - 0.92 * slip;
  alb *= 1. - 0.2 * mOn * rk * smoothstep(0.55, 0.75, textureLod(uHt, vec2(g0 / 46. + 0.35 * grain2, p.x / 5200.), 0.).r);   // faint bedding lines following the whaleback's curve
  alb = mix(alb, alb * vec3(0.7, 0.74, 1.), 0.6 * shadeR * (1. - rk) * uLook);                    // a trough's shade on sand is cool
  alb = mix(alb, mix(vec3(0.13, 0.19, 0.42), vec3(0.17, 0.2, 0.36), uHardKey) * (0.7 + 0.6 * grain2), mix(mix(0.8, 0.56, uHardKey), 0.72, mOn) * shadeR * max(rk, 0.3 * foK) * uLook);      // what the violet sky makes of shadowed rock
  alb = mix(alb, alb * vec3(0.52, 0.62, 1.06), 0.9 * shadeR * max(snowAmt, 0.85 * dust) * uLook);       // snow turned from the key holds the sky's blue
  alb *= mix(vec3(1.), vec3(1.16, 0.98, 0.74), max(rOn, mOn) * rk * (1. - shadeR) * uLook * (1. - snowAmt) * (1. - 0.6 * foK) * (1. - 0.7 * dust));   // and the lit faces are gold
  vec3 amb = mix(uAmbGnd, uAmbSky * 1.7, N.y * 0.5 + 0.5) * (0.68 + 0.32 * cshd) * ao;
  amb *= 1. + mix(1.9, 0.8, mOn) * shadeR + (0.85 + 0.8 * slipG) * slip;
  vec3 skyT = uSkyZen * 1.2 + uSkyHor * 0.6; skyT /= max(max(skyT.r, max(skyT.g, skyT.b)), 1e-3);
  amb = mix(amb, max(amb.r, max(amb.g, amb.b)) * skyT, 0.75 * slip);  // a slip face is lit by the sky alone, whatever colour the sky is at that moment: blue by day, red under the giant                                          // the shadowed faces are filled by the violet sky: never black
  // ice is lit from inside as much as from outside: more of the sky's blue, less of the key's gold
  vec3 c = alb * (uKeyCol * uKeyOn * key * sh * (0.75 + 0.25 * ao) * (1. - 0.45 * isIce) * (1. - 0.8 * isIce * faceAmt) + amb * (1. + 1.6 * isIce + 1.2 * isIce * faceAmt)
    + uKeyCol * uKeyOn * vec3(0.10, 0.085, 0.06) * (1. - key * sh)) * 0.3183;      // lit sand throws a little warm light back into every shadow: none is black
  // wet sand, the river's bed and the pools hold the sky
  vec3 V = normalize(vW - uCam);
  float fres = 0.03 + 0.97 * pow(1. - clamp(dot(-V, N), 0., 1.), 4.);
  float gloss = max(max(wetAmt * (1. - rk) * (1. - mudAmt), chAmt), mudAmt * (0.1 + 0.9 * pool) * (1. - 0.5 * brine)) * (1. - isIce) * uWet;
  c *= 1. + (0.1 * r1 * (1. - smoothstep(12., 70., dist)) + 0.105 * r3 * (1. - smoothstep(200., 700., dist))) * sandAmt * (1. - wetAmt);   // every ripple has a lit side and a dull side
  // dry sand seen along its surface has a satin sheen, banded by the ripple
  c += sandAmt * (1. - wetAmt) * (uAmbSky * 0.5 + uKeyCol * uKeyOn * 0.07) * pow(1. - clamp(dot(-V, N), 0., 1.), 3.) * (0.35 + 0.65 * r3 * r3) * 0.3183;
  vec3 Rw = reflect(V, N); Rw.y = abs(Rw.y) + 0.002; gRefl = 1.;
  float mir = gloss * max(fres, mix(0.3, 0.7, 1. - uSwSurf) * wetAmt * (1. - mudAmt) * (1. - chAmt)) * 0.85;
  // runnels and tide pools the ebb leaves on the strand: long shallow mirrors lying along the shore
  float rz = zc + 7. * (grain2 - 0.5) + 2. * sin(p.x / 31.);
  float rn = textureLod(uNz, vec2(p.x / 310. + 0.12 * grain2, rz / 10.) + 0.57, 0.).r;
  float strand = smoothstep(uSea + 0.06, uSea + 0.3, g0) * (1. - smoothstep(uSea + 0.55, uSea + 1.05, g0)) * smoothstep(-2.4, -1.5, g0) * uWet * (1. - rk) * (1. - isIce) * (1. - chAmt);   // only the narrow wet strip at the water's edge
  float runl = smoothstep(0.53, 0.6, rn) * strand * smoothstep(0.22, 0.42, textureLod(uNz, p / vec2(170., 43.) + 0.31, 0.).r);    // broken into pools: none is a ruled line
  c *= 1. - 0.05 * smoothstep(0.49, 0.55, rn) * strand * (1. - runl);                       // each lies in a rim of darker wet sand
  // the river's own time average: water lay on every part of the fan for a fraction of the time, so the fan is glazed,
  // in the braids the channel ran in most often
  vec2 dA = p - APEX; float rA = length(dA);
  // (the channel swings as 55 degrees * sin, so it dwells longest at the two ends of its swing: the damp is smooth, a
  // little heavier toward the fan's two sides, with no shape of its own)
  float xa = atan(dA.x, -dA.y + (abs(dA.x) + abs(dA.y) < 1e-3 ? 1e-3 : 0.)) / 0.96;
  float dwell = (1. - smoothstep(0.92, 1.25, abs(xa))) * min(inversesqrt(max(1. - xa * xa, 0.12)), 2.4) / 2.4;
  float glz = (1. - uSwRiver) * uWet * clamp(fanF / 5., 0., 1.) * smoothstep(50., 150., rA) * (1. - smoothstep(330., 430., rA)) * (1. - isIce) * (1. - rk) * dwell;
  c *= 1. - 0.1 * glz;
  // wet sand is not glass: its sheen is a broad lobe that takes in the low bright sky, so the strand gleams instead of going dark under a steep eye
  vec3 Rwf = normalize(vec3(Rw.x, Rw.y * mix(0.5, 1., chAmt) + 0.02, Rw.z));
  c = mix(c, mix(min(skyColor(Rwf, 0.016), vec3(1.9, 1.5, 0.95)) * 0.75 * (0.55 + 0.45 * cshd), stackTone(), 0.85 * stackHit(vec3(p.x, h, p.y), Rw)), mir);
  c = mix(c, riverCol(V, uAmbSky * 1.6, cshd, uSea - g0), smoothstep(0.12, 0.45, chF) * smoothstep(0.02, 0.3, uSea - g0) * uWet * (1. - isIce));
  // the strand's pools: a film of water over pale silt. Seen steeply it is wet sand; seen along it, it holds the low bright sky
  vec3 Rg = normalize(vec3(Rw.x, Rw.y * 0.55 + 0.03, Rw.z));
  gRefl = 1.;
  vec3 sheen = min(skyColor(Rg, 0.016), vec3(1.6, 1.3, 0.95)) * (0.6 + 0.4 * cshd);
  c = mix(c, mix(c * 0.85, sheen * vec3(0.86, 0.95, 1.), 0.3 + 0.6 * fres), 0.5 * runl);
  // while it is being built its crater and three or four lava runs glow
  float aI = atan(dI.y, dI.x + (abs(dI.x) + abs(dI.y) < 1e-4 ? 1e-4 : 0.));
  float runs = smoothstep(0.62, 0.7, textureLod(uNz, vec2(aI * 0.55, 0.2 + rI / 2600.), 0.).r) * (1. - smoothstep(60., 330., rI));
  c += vec3(3.2, 0.85, 0.12) * uIsleHot * isle * max(exp(-rI * rI / 900.), 0.8 * runs);
  // Haze lies in the troughs. Seen from the beach, what shows of a rank is the top of its face above the brow of the rank
  // in front: the eye's ray is followed back to that brow (its place is known from the swell's own phase) and the nearer
  // the ray passes over it, the more trough haze it has come through. So every brow is cut out, sharp, against pale haze.
  float rph = acos(clamp(1. - 2. * pow(clamp(rr.z / 0.9, 1e-4, 1.), 0.833), -1., 1.)) / 3.14159265;
  vec2 toC = uCam.xz - p;
  float t0 = (0.4 * rph + 0.6) * RLAM / max(dot(-toC, RNX), 1.);
  float occ = 1e5;
  for (int i = 0; i < 3; i++) {
    float tt = min(t0 * (0.84 + 0.16 * float(i)), 0.95);
    occ = min(occ, h + (uCam.y - h) * tt - rangeOnly(p + toC * tt));
  }
  float mistO = (1. - smoothstep(0.004 * dist, 0.034 * dist, occ)) * step(t0, 0.9);
  float mistF = 1. - smoothstep(0.22, 0.6, rr.x);
  float mist = max(mistO, mistF) * rOnM * smoothstep(300., 1300., dist) * (1. - 0.7 * uSalt) * (0.6 + 0.4 * uLook);
  c = mix(c, uFogCol * 1.06, 0.9 * mist);
  // the whaleback: haze lying on it in three level layers stepping back, and a thin bright rim against the sky
  float hz = g0 + 55. * (textureLod(uNz, p / 2600. + 0.3, 0.).r - 0.5);
  float lay = max(max(exp(-(hz - 100.) * (hz - 100.) / 900.), exp(-(hz - 290.) * (hz - 290.) / 1500.)), exp(-(hz - 520.) * (hz - 520.) / 2200.));
  c = mix(c, uFogCol * 1.08, 0.42 * lay * mOn * smoothstep(400., 1500., dist));
  c += uKeyCol * uKeyOn * 0.05 * mOn * pow(1. - clamp(dot(-V, N), 0., 1.), 5.);
  // the far ranks stand in bluer air than the near ones
  c = mix(c, mix(uFogCol, uSkyHor * 0.92 + vec3(0., 0.01, 0.04), 0.55 * smoothstep(1400., 5200., dist)), fogAmt(vW) * (1. - 0.75 * isle) * (1. - 0.3 * bare));   // (new black rock is read through thinner air: it must be black)
  gl_FragColor = vec4(c, 1.);
}
`;

// ---- build ----
function periodicNoise(rng, n) {
  const g = new Float32Array(n * n);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  return (u, v) => {
    const x = u * n, y = v * n, x0 = Math.floor(x), y0 = Math.floor(y);
    let fx = x - x0, fy = y - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const i0 = ((x0 % n) + n) % n, i1 = (i0 + 1) % n, j0 = ((y0 % n) + n) % n, j1 = (j0 + 1) % n;
    return lerp(lerp(g[j0 * n + i0], g[j0 * n + i1], fx), lerp(g[j1 * n + i0], g[j1 * n + i1], fx), fy);
  };
}

export async function buildTenfold(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tenfold') : ctx.rng;
  const detail = opts.detail || (ctx.quality && ctx.quality.detail) || 1;
  const mirror = opts.mirror ? -1 : 1;
  const lat = opts.lat || 45;
  const frame = skyFrame(lat);
  const group = new THREE.Group();
  group.name = 'tenfold';

  // the height texture: one swell-shaped crest per tile across (steep seaward face, long inland back), wandering and
  // rising and falling along its length, with two finer ridged octaves. R8, tiling, read with textureLod everywhere.
  const HS = 512, hdata = new Uint8Array(HS * HS);
  const n4 = periodicNoise(rng, 4), n4b = periodicNoise(rng, 4), n8 = periodicNoise(rng, 8), n16 = periodicNoise(rng, 16), n32 = periodicNoise(rng, 32);
  await ctx.yield();
  let hsum = 0, hsum2 = 0;
  for (let j = 0; j < HS; j++) {
    const v = j / HS;
    for (let i = 0; i < HS; i++) {
      const u = i / HS;
      const s = fract(u + 0.13 * (n4(u, v) - 0.5) + 0.045 * (n8(u, v) - 0.5));
      let ridge = s < 0.4 ? s / 0.4 : (1 - s) / 0.6;
      ridge = 0.5 - 0.5 * Math.cos(Math.PI * ridge);                     // a swell's section: round brow, round trough, so a crest crossing the grid never saws
      ridge = Math.pow(ridge, 1.2);
      const hv = 0.9 + 0.1 * n4b(u, v);                                 // (peaks and cols along a crest are added by the shader: rangePk)
      const det = (1 - Math.abs(2 * n16(u, v) - 1)) * 0.62 + (1 - Math.abs(2 * n32(u, v) - 1)) * 0.38;
      hdata[j * HS + i] = Math.round(255 * clamp01(ridge * hv * 0.9 + det * 0.1 * (0.3 + 0.7 * ridge)));
      hsum += hdata[j * HS + i]; hsum2 += hdata[j * HS + i] * hdata[j * HS + i];
    }
    if (j % 12 === 11) await ctx.yield();
  }
  const htex = new THREE.DataTexture(hdata, HS, HS, THREE.RedFormat, THREE.UnsignedByteType);
  htex.wrapS = htex.wrapT = THREE.RepeatWrapping; htex.magFilter = THREE.LinearFilter; htex.minFilter = THREE.LinearFilter;
  htex.generateMipmaps = false; htex.needsUpdate = true;
  await ctx.yield();

  // the cloud map: nine soft blobs to a tile (their shadows are the cloud rung's travellers), ragged at the edge. R8, tiling.
  const CS = 256, cdata = new Uint8Array(CS * CS), blobs = [];
  for (let i = 0; i < 9; i++) blobs.push([(i % 3 + 0.2 + 0.6 * rng()) / 3, (Math.floor(i / 3) + 0.2 + 0.6 * rng()) / 3, 0.1 + 0.06 * rng(), 0.6 + 0.8 * rng()]);
  for (let j = 0; j < CS; j++) {
    const v = j / CS;
    for (let i = 0; i < CS; i++) {
      const u = i / CS; let m = 0;
      for (const b of blobs) {
        let dx = Math.abs(u - b[0]), dy = Math.abs(v - b[1]); dx = Math.min(dx, 1 - dx) * b[3]; dy = Math.min(dy, 1 - dy);
        m = Math.max(m, 1 - Math.sqrt(dx * dx + dy * dy) / b[2]);
      }
      cdata[j * CS + i] = Math.round(255 * clamp01(0.5 + 0.75 * m + 0.3 * (n8(u, v) - 0.5) + 0.2 * (n16(u, v) - 0.5) - 0.2));
    }
    if (j % 24 === 23) await ctx.yield();
  }
  const ctex = new THREE.DataTexture(cdata, CS, CS, THREE.RedFormat, THREE.UnsignedByteType);
  ctex.wrapS = ctex.wrapT = THREE.RepeatWrapping; ctex.magFilter = THREE.LinearFilter; ctex.minFilter = THREE.LinearFilter;
  ctex.generateMipmaps = false; ctex.needsUpdate = true;
  await ctx.yield();

  // grain: four octaves of tiling value noise, the same in every direction. R8.
  const NS2 = 256, ndata = new Uint8Array(NS2 * NS2), n64 = periodicNoise(rng, 64);
  for (let j = 0; j < NS2; j++) {
    const v = j / NS2;
    for (let i = 0; i < NS2; i++) { const u = i / NS2; ndata[j * NS2 + i] = Math.round(255 * clamp01(0.42 * n8(u, v) + 0.28 * n16(u, v) + 0.18 * n32(u, v) + 0.12 * n64(u, v))); }
    if (j % 32 === 31) await ctx.yield();
  }
  const ntex = new THREE.DataTexture(ndata, NS2, NS2, THREE.RedFormat, THREE.UnsignedByteType);
  ntex.wrapS = ntex.wrapT = THREE.RepeatWrapping; ntex.magFilter = THREE.LinearFilter; ntex.minFilter = THREE.LinearFilter;
  ntex.generateMipmaps = false; ntex.needsUpdate = true;
  await ctx.yield();

  // the star map in (hour angle, declination)
  const SW = 1024, SH = 512, sdata = new Uint8Array(SW * SH);
  for (let i = 0; i < 2600; i++) {
    const x = Math.floor(rng() * SW), y = Math.floor(Math.acos(1 - 2 * rng()) / Math.PI * SH) % SH;
    const b = Math.pow(rng(), 3.2), v = Math.round(255 * (0.25 + 0.75 * b));
    sdata[y * SW + x] = Math.max(sdata[y * SW + x], v);
    if (b > 0.45) { sdata[y * SW + (x + 1) % SW] = Math.max(sdata[y * SW + (x + 1) % SW], v >> 1); if (y + 1 < SH) sdata[(y + 1) * SW + x] = Math.max(sdata[(y + 1) * SW + x], v >> 1); }
  }
  const stex = new THREE.DataTexture(sdata, SW, SH, THREE.RedFormat, THREE.UnsignedByteType);
  stex.wrapS = THREE.RepeatWrapping; stex.wrapT = THREE.ClampToEdgeWrapping; stex.magFilter = THREE.LinearFilter; stex.minFilter = THREE.LinearFilter;
  stex.generateMipmaps = false; stex.needsUpdate = true;
  await ctx.yield();

  // one set of uniforms for every shader of the world
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const U = {
    uHt: { value: htex }, uCl: { value: ctex }, uNz: { value: ntex }, uStars: { value: stex }, uCam: { value: V3() }, uKeyDir: { value: V3(0, 1, 0) }, uKeyCol: { value: new THREE.Color() },
    uAmbSky: { value: new THREE.Color() }, uAmbGnd: { value: new THREE.Color() }, uFogCol: { value: new THREE.Color() },
    uSunDir: { value: V3(0, 1, 0) }, uPole: { value: frame.P.clone() }, uMer: { value: frame.M.clone() }, uEast: { value: frame.E.clone() },
    uBandCol: { value: new THREE.Color() }, uSkyZen: { value: new THREE.Color() }, uSkyHor: { value: new THREE.Color() },
    uGlowCol: { value: new THREE.Color() }, uDiscCol: { value: new THREE.Color() },
    uLogs: { value: [] }, uLogTip: { value: [] },
  };
  for (const n of ['uTb', 'uPhSurf', 'uSwSurf', 'uPhCloud', 'uSwCloud', 'uPhDune', 'uSwDune', 'uRiverA', 'uRiverSpit', 'uSwRiver', 'uShore', 'uIceG', 'uIceR',
    'uIceMean', 'uPhRange', 'uSwRange', 'uSnowLine', 'uSwYear', 'uWet', 'uSea', 'uSalt', 'uHardKey', 'uSwDay', 'uSinDs', 'uBandHalf', 'uDiscR', 'uDiscI',
    'uMoonD', 'uSwMoon', 'uMoonI', 'uNight', 'uStarRot', 'uReal', 'uIsland', 'uIsleHot', 'uMirror', 'uForest', 'uKeyOn', 'uRangeMean', 'uTwi', 'uLook', 'uMoonLit']) U[n] = { value: 0 };
  { const m = hsum / (HS * HS * 255), m2 = hsum2 / (HS * HS * 255 * 255); U.uRangeMean.value = (0.88 * 0.5 * (m + m2) + 0.12 * m * (0.3 + 0.7 * m)) * 1.02; }      // the range's own time average, from the texture's mean
  U.uMirror.value = mirror; U.uForest.value = opts.forest === false ? 0 : 1; U.uBandHalf.value = 23.44 * DEG; U.uDiscR.value = 0.6 * DEG;
  { const sv = (a, alt) => { const d = frame.az(a, alt), D = Math.asin(d.dot(frame.P)), H = Math.atan2(d.dot(frame.E), d.dot(frame.M)) + TAU * 0.449;
      return V3(Math.cos(D) * Math.cos(H), Math.cos(D) * Math.sin(H), Math.sin(D)); };
    U.uGal = { value: sv(283, 6).cross(sv(348, 58)).normalize() }; }
  for (let i = 0; i < 7; i++) { U.uLogs.value.push(new THREE.Vector4(0, 0, 0, 0)); U.uLogTip.value.push(V3()); }

  // land grid: cells about 4 m at the path growing to 60 m and more at the horizon
  const NX = detail < 0.8 ? 288 : 384, NZ = detail < 0.8 ? 192 : 256;
  const lpos = new Float32Array((NX + 1) * (NZ + 1) * 3);
  for (let j = 0; j <= NZ; j++) {
    const NS = Math.round(NZ * 0.31), sz = (j - NS) / (j < NS ? NS : NZ - NS);
    const z = sz < 0 ? -57 * Math.sinh(5.5 * -sz) : 347 * Math.sinh(3.4 * sz);
    for (let i = 0; i <= NX; i++) {
      const sx = -0.35 + 1.35 * i / NX, x = 100 + 237 * Math.sinh(4.2 * sx), o = (j * (NX + 1) + i) * 3;
      lpos[o] = x; lpos[o + 1] = 0; lpos[o + 2] = z;
    }
    if (j % 48 === 47) await ctx.yield();
  }
  const lidx = new Uint32Array(NX * NZ * 6);
  for (let j = 0, q = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      lidx[q++] = a; lidx[q++] = c; lidx[q++] = b; lidx[q++] = b; lidx[q++] = c; lidx[q++] = d;
    }
    if (j % 48 === 47) await ctx.yield();
  }
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lgeo.setIndex(new THREE.BufferAttribute(lidx, 1));
  const landMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, side: THREE.DoubleSide });
  const land = new THREE.Mesh(lgeo, landMat); land.frustumCulled = false; group.add(land);
  await ctx.yield();

  const sgeo = new THREE.PlaneGeometry(36000, 36000, 4, 4); sgeo.rotateX(-Math.PI / 2);
  sgeo.translate(-3700, 0, 2300);     // no vertex of these huge triangles may sit under the eye: at u = 0 one did, and a quarter of the sea went missing in the portal picture
  const seaMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_WORLD, fragmentShader: SEA_FRAG, side: THREE.DoubleSide });
  const sea = new THREE.Mesh(sgeo, seaMat); sea.frustumCulled = false; group.add(sea);

  const skyMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.DoubleSide, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; group.add(sky);
  await ctx.yield();

  // ---- the first six seconds: a kingfisher, its string of beads, a splash crown, one breaker and its spray ----
  // (the bird is built at twice life size so that it reads from seven metres; everything about it hangs on Tb = min(T, 2))
  const BIRD = V3(15.4, 3.15, 1.3), BS = 4.2;        // stood six metres ahead of u = 0.02, on the land side of centre; the breaker has the sea side
  const C = (h) => new THREE.Color(h);
  const blue = C('#1F8FD6'), teal = C('#3FD0E8'), orange = C('#E0762B'), white = C('#F4EFE4'), dark = C('#161A26'), navy = C('#12508F');
  const mixc = (a, b, t) => a.clone().lerp(b, clamp01(t));
  // smooth parts with true normals; colour is chosen per vertex from where it sits on the part (y up, z toward the beak)
  const mk = () => ({ p: [], n: [], c: [], i: [] });
  const ell = (g, cx, cy, cz, rx, ry, rz, colFn, nu = 18, nv = 12) => {
    const base = g.p.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const th = TAU * i / nu, ph = Math.PI * j / nv, x = Math.sin(ph) * Math.cos(th), y = Math.sin(ph) * Math.sin(th), z = Math.cos(ph);
      g.p.push(cx + rx * x, cy + ry * y, cz + rz * z);
      const nx = x / rx, ny = y / ry, nz = z / rz, nl = Math.hypot(nx, ny, nz) || 1; g.n.push(nx / nl, ny / nl, nz / nl);
      const col = colFn(x, y, z); g.c.push(col.r, col.g, col.b);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b2 = a + 1, c2 = a + nu + 1, d = c2 + 1; g.i.push(a, c2, b2, b2, c2, d); }
  };
  const flat = (g, pts, cols, ny = 1) => {            // a fan of points, one normal: feathers
    const base = g.p.length / 3;
    for (let k = 0; k < pts.length; k++) { g.p.push(...pts[k]); g.n.push(0, ny, 0); g.c.push(cols[k].r, cols[k].g, cols[k].b); }
    for (let k = 1; k + 1 < pts.length; k++) g.i.push(base, base + k, base + k + 1);
  };
  const toGeo = (g) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p.map((v) => v * BS), 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
    const cl = g.c.slice();
    for (let k = 0; k < cl.length; k += 3) { const nx = g.n[k], ny = g.n[k + 1], nz = g.n[k + 2], sh = 0.66 + 0.5 * Math.max(0, 0.35 * nx + 0.75 * ny + 0.56 * nz) + 0.14 * Math.max(0, -ny); for (let q = 0; q < 3; q++) cl[k + q] = Math.min(1, cl[k + q] * 1.25 * sh + 0.03); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); geo.setIndex(g.i);
    return geo;
  };
  const speck = (x, z) => 0.5 + 0.5 * Math.sin(x * 23 + 1) * Math.sin(z * 31 + 2);
  const gb = mk();
  ell(gb, 0, 0, 0, 0.034, 0.036, 0.075, (x, y, z) => (y > 0.12 ? mixc(blue, teal, (y - 0.3) * 0.9 * speck(x, z) + (Math.abs(x) < 0.25 ? 0.5 : 0)) : mixc(orange, white, (z - 0.55) * 3)));   // body: blue back with a pale streak, orange breast
  ell(gb, 0, 0.018, 0.085, 0.03, 0.03, 0.037, (x, y, z) => {                              // head: speckled crown, orange cheek, white throat and neck patch
    if (y > 0.18) return mixc(navy, teal, speck(x * 3, z * 3) * 0.9);
    if (y > -0.25 && z > -0.1) return orange;
    return y > -0.25 ? white : mixc(white, orange, -z * 1.5);
  }, 16, 10);
  for (const sx of [1, -1]) ell(gb, 0.024 * sx, 0.026, 0.101, 0.0055, 0.0055, 0.0055, () => dark, 8, 6);   // eyes
  { const base = gb.p.length / 3, nb = 8;                                                // the beak: a long dark cone, orange under at the root
    for (let i = 0; i <= nb; i++) { const a = TAU * i / nb, cx = Math.cos(a), sy = Math.sin(a); gb.p.push(0.0095 * cx, 0.017 + 0.008 * sy, 0.112, 0, 0.012, 0.212); gb.n.push(cx, sy, 0.1, cx, sy, 0.1); const cc = sy < -0.5 ? mixc(dark, orange, 0.6) : dark; gb.c.push(cc.r, cc.g, cc.b, dark.r, dark.g, dark.b); }
    for (let i = 0; i < nb; i++) { const a = base + i * 2; gb.i.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  for (let k = -2; k <= 2; k++) { const a = k * 0.2;                                     // the tail: five short feathers
    flat(gb, [[0.008 * k, 0.006, -0.062], [0.008 * k + 0.009, 0.006, -0.07], [Math.sin(a) * 0.062 + 0.006, 0.004 + 0.001 * Math.abs(k), -0.062 - Math.cos(a) * 0.058], [Math.sin(a) * 0.062 - 0.006, 0.004 + 0.001 * Math.abs(k), -0.062 - Math.cos(a) * 0.058], [0.008 * k - 0.009, 0.006, -0.07]], [blue, blue, navy, navy, blue]); }
  const bgeo = toGeo(gb);
  const birdMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0xe6e6e6 });
  const bird = new THREE.Group(); bird.position.copy(BIRD); bird.rotation.set(-0.85, Math.PI, 0, 'YXZ');
  bird.add(new THREE.Mesh(bgeo, birdMat));
  const wings = [];
  for (const sgn of [1, -1]) {
    const gw = mk(), X = (v) => v * sgn;
    // a wing lying along +x from the shoulder: teal coverts along the arm, five secondaries, seven primaries fanned from the wrist
    flat(gw, [[0, 0.002, 0.036], [X(0.072), 0.002, 0.034], [X(0.118), 0.002, 0.012], [X(0.078), 0.002, -0.012], [0, 0.002, -0.022]], [teal, teal, blue, blue, blue]);
    for (let k = 0; k < 5; k++) { const x0 = 0.004 + 0.0145 * k, tip = -0.058 - 0.004 * k;
      flat(gw, [[X(x0), 0.0005 * k, -0.01], [X(x0 + 0.016), 0.0005 * k, -0.01], [X(x0 + 0.017), 0.0005 * k, tip + 0.006], [X(x0 + 0.009), 0.0005 * k, tip], [X(x0 + 0.002), 0.0005 * k, tip + 0.008]], [blue, blue, navy, dark, navy]); }
    for (let k = 0; k < 7; k++) { const a = (-82 + 13.5 * k) * DEG, ca = Math.cos(a), sa = Math.sin(a), L = 0.062 + 0.003 * k, wx = 0.076, wz = 0.006, hw = 0.0075, y = 0.003 + 0.0006 * k;
      flat(gw, [[X(wx + sa * hw), y, wz - ca * hw], [X(wx - sa * hw), y, wz + ca * hw], [X(wx + ca * L * 0.86 - sa * hw * 0.8), y, wz + sa * L * 0.86 + ca * hw * 0.8], [X(wx + ca * L), y, wz + sa * L], [X(wx + ca * L * 0.9 + sa * hw * 0.8), y, wz + sa * L * 0.9 - ca * hw * 0.8]], [blue, blue, navy, dark, navy]); }
    const w = new THREE.Mesh(toGeo(gw), birdMat); w.position.set(0.028 * sgn * BS, 0.02 * BS, 0.01 * BS); w.userData.sgn = sgn; bird.add(w); wings.push(w);
  }
  group.add(bird);
  await ctx.yield();

  // the crown: a coronet of water (the milk-drop photograph): a thin wall rising from a ring, flaring outward, its rim
  // scalloped into fifteen short rounded fingers, a bead just leaving each tip; a dimple inside it, one ring ripple round it
  const cp = [], cdraw = []; for (let i = 0; i < 48; i++) cdraw.push(rng());
  const NF = 15, cphi = cdraw[0] * TAU;
  const fing = (th) => Math.pow(0.5 + 0.5 * Math.cos(NF * th + 0.5 * Math.sin(3 * th + cphi)), 0.38);
  const rimH = (th) => 0.6 * (0.78 + 0.22 * fing(th)) * (0.9 + 0.2 * cdraw[1 + (Math.floor(th / TAU * NF + 0.5) % NF + NF) % NF]);
  const wallAt = (th, v) => { const fg = fing(th), r = 0.25 + 0.1 * Math.pow(v, 1.6) + 0.035 * v * v * fg; return [r * Math.cos(th), rimH(th) * v + 0.012, r * Math.sin(th)]; };
  const flatAt = (th, k) => {                 // k 0..1 from the centre out: the dimple, then the raised ring ripple, then nothing
    const r = 0.9 * k, y = r < 0.25 ? -0.05 * (1 - (r / 0.25) * (r / 0.25)) : 0.035 * Math.exp(-((r - 0.52) / 0.1) * ((r - 0.52) / 0.1)) - 0.02 * Math.exp(-((r - 0.33) / 0.06) * ((r - 0.33) / 0.06));
    return [r * Math.cos(th), y + 0.012, r * Math.sin(th)];
  };
  const NUc = 150;
  const lathe = (fn, nv) => {
    for (let j = 0; j < nv; j++) for (let i = 0; i < NUc; i++) {
      const t0 = TAU * i / NUc, t1 = TAU * (i + 1) / NUc, v0c = j / nv, v1c = (j + 1) / nv;
      const A = fn(t0, v0c), B = fn(t1, v0c), Cq = fn(t0, v1c), D = fn(t1, v1c);
      cp.push(...A, ...B, ...Cq, ...B, ...D, ...Cq);
    }
  };
  lathe(wallAt, 9); lathe(flatAt, 14);
  await ctx.yield();
  const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cgeo.computeVertexNormals();
  const glassMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uMirror; varying vec3 vW; varying float vY, vR;
      void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vY = position.y; vR = length(position.xz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAmbSky, uKeyCol, uKeyDir, uSkyHor, uSkyZen; uniform vec2 uCrown; uniform float uKeyOn, uMirror; varying vec3 vW; varying float vY, vR;
      void main() {
        vec3 dx = dFdx(vW), dy = dFdy(vW); vec3 n = cross(dx, dy); float nl = length(n);
        vec3 N = nl > 1e-9 ? n / nl : vec3(0., 1., 0.);
        vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
        float fres = 0.06 + 0.94 * pow(1. - max(dot(N, V), 0.), 3.);
        vec3 L = vec3(uKeyDir.x, uKeyDir.y, uKeyDir.z * uMirror);
        float sp = pow(max(dot(reflect(-L, N), V), 0.), 40.);
        vec3 c = mix(vec3(0.05, 0.26, 0.27), vec3(0.30, 0.62, 0.58), smoothstep(0., 0.6, vY)) * (uAmbSky * 1.3 + uKeyCol * uKeyOn * 0.25);
        c = mix(c, mix(uSkyHor, uSkyZen, 0.35) * 1.15, fres) + uKeyCol * uKeyOn * sp * 0.9;
        vec2 od = vW.xz - uCrown;
        float rim = smoothstep(0.3, 0.62, vY) * (0.35 + 0.65 * clamp(dot(od / max(length(od), 1e-4), L.xz) + 0.4, 0., 1.));
        c += uKeyCol * uKeyOn * 0.16 * rim;                     // the thin rim and its fingers are bright on the sunward side
        gl_FragColor = vec4(c, (mix(0.26, 0.8, smoothstep(0.02, 0.14, vY)) + 0.2 * max(max(fres, sp), rim)) * (1. - smoothstep(0.6, 0.86, vR)));
      }`,
  });
  const crown = new THREE.Mesh(cgeo, glassMat); crown.position.set(BIRD.x, 0.0, BIRD.z); group.add(crown);
  U.uCrown = { value: new THREE.Vector2(BIRD.x, BIRD.z * mirror) };

  // beads: p = p0 + v0 Tb - 4.9 Tb^2, stopped at the water. 60 on the string, 30 off the crown, the rest are the breaker's spray.
  const nSpray = Math.round(lerp(1500, 2600, clamp01((detail - 0.6) / 0.4)));
  const NB = 60 + 30 + nSpray, p0 = new Float32Array(NB * 3), v0 = new Float32Array(NB * 3), bs = new Float32Array(NB);
  for (let i = 0; i < NB; i++) {
    let x, y, z, vx = 0, vy = 0, vz = 0, sz;
    if (i < 60) {                      // the string: shed as the bird rose, each already falling
      const f = (i + rng() * 0.6) / 60; y = lerp(0.1, BIRD.y - 0.2, f);
      x = BIRD.x + (rng() - 0.5) * 0.1 + 0.07 * Math.sin(f * 9); z = BIRD.z + (rng() - 0.5) * 0.1; vy = -Math.sqrt(19.6 * Math.max(BIRD.y - y, 0)) * 0.5; sz = 0.09 + 0.12 * rng();
    } else if (i < 90) {               // off the crown's tips
      let a = rng() * TAU, r = 0.7 + rng() * 0.3; y = 0.6 + rng() * 0.9; sz = 0.05 + 0.06 * rng();
      if (i < 60 + 2 * NF) {              // one bead just off each finger's tip, a smaller one above it
        const kf = (i - 60) % NF, hi = i >= 60 + NF ? 1 : 0;
        a = TAU * kf / NF; for (let q = 0; q < 3; q++) a = (TAU * kf - 0.5 * Math.sin(3 * a + cphi)) / NF;
        const tip = wallAt(a, 1); r = 2.2 * Math.hypot(tip[0], tip[2]) + 0.05 + 0.16 * hi; y = 2 * tip[1] + 0.07 + 0.2 * hi + 0.1 * hi * (r - 0.8); sz = hi ? 0.035 + 0.02 * (sz * 10) : 0.075;
      }
      x = BIRD.x + r * Math.cos(a); z = BIRD.z + r * Math.sin(a);
      vx = Math.cos(a) * 0.8; vz = Math.sin(a) * 0.8; vy = 1 + rng() * 1.5;
    } else {                           // the spray: a cloud standing off the breaker's lip, about to be thrown at the beach
      x = lerp(8, 112, rng()); const f = (x - 4) / 112;
      const H = 3.6 * sstep(0, 0.07, f) * (1 - sstep(0.9, 1, f)) * (0.86 + 0.14 * Math.sin(x * 0.23 + 0.6)), R = 0.4 * H;
      const c = clamp01(0.5 + 0.1 * Math.sin(x * 0.19 + 1)), an = (0.25 + 0.75 * rng()) * (0.7 + 2.4 * c), up = Math.pow(rng(), 1.7);
      y = H - R * (1 - Math.cos(an)) + 0.05 + up * 2.6;
      z = -7 + 2.6 * Math.cos(TAU * (x - 34) / 52) + 1.35 * R * Math.sin(an) + 0.35 * R * c * an + (rng() - 0.5) * 0.9 - up * 1.3;
      vx = (rng() - 0.5) * 1.5; vy = 1 + 4 * rng(); vz = 3 + 9 * rng(); sz = 0.045 + 0.13 * rng() * rng();
    }
    p0[i * 3] = x; p0[i * 3 + 1] = y; p0[i * 3 + 2] = z; v0[i * 3] = vx; v0[i * 3 + 1] = vy; v0[i * 3 + 2] = vz; bs[i] = sz;
  }
  const beadGeo = new THREE.BufferGeometry();
  beadGeo.setAttribute('position', new THREE.BufferAttribute(p0, 3)); beadGeo.setAttribute('aV', new THREE.BufferAttribute(v0, 3)); beadGeo.setAttribute('aS', new THREE.BufferAttribute(bs, 1));
  U.uPx = { value: 400 };
  const beadMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aV; attribute float aS; uniform float uTb, uSea, uMirror, uPx; varying float vA;
      void main() {
        vec3 p = position + aV * uTb; p.y -= 4.9 * uTb * uTb;
        vA = step(uSea + 0.02, p.y);
        vec4 mv = viewMatrix * vec4(p.x, p.y, p.z * uMirror, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(max(2.5, aS * uPx / max(-mv.z, 0.05)), 0.035 * uPx) * vA;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAmbSky, uKeyCol; uniform float uKeyOn; varying float vA;
      void main() {
        vec2 q = gl_PointCoord * 2. - 1.; float r2 = dot(q, q);
        if (r2 > 1. || vA < 0.5) discard;
        float rim = smoothstep(0.35, 1., r2);
        float spec = exp(-dot(q - vec2(-0.35, -0.38), q - vec2(-0.35, -0.38)) * 14.);
        vec3 c = uAmbSky * (0.7 + 1.3 * rim) * 0.6 + uKeyCol * uKeyOn * (0.1 + 0.12 * rim + 1.6 * spec);
        gl_FragColor = vec4(c, 0.45 + 0.5 * max(rim, spec));
      }`,
  });
  const beads = new THREE.Points(beadGeo, beadMat); beads.frustumCulled = false; group.add(beads);
  await ctx.yield();

  // THE BREAKER: a plunging wave 3 m high, stopped in the act. Its crest line is scalloped (two bows toward the path, at
  // x = 34 and 86), so wherever the eye stands part of it is seen in profile: a hollow green face, a lip thrown over it,
  // white along the lip. Everything about it reads Tb: the lip comes over, it advances 4 m/s, it falls into foam.
  const BX = 150, BSN = 40, brp = new Float32Array((BX + 1) * (BSN + 1) * 3), bri = [];
  for (let i = 0; i <= BX; i++) for (let j = 0; j <= BSN; j++) { const o = (i * (BSN + 1) + j) * 3; brp[o] = lerp(4, 116, i / BX); brp[o + 1] = j / BSN; brp[o + 2] = 0; }
  for (let i = 0; i < BX; i++) for (let j = 0; j < BSN; j++) { const a = i * (BSN + 1) + j, b = a + 1, c = a + BSN + 1, d = c + 1; bri.push(a, c, b, b, c, d); }
  const brGeo = new THREE.BufferGeometry(); brGeo.setAttribute('position', new THREE.BufferAttribute(brp, 3)); brGeo.setIndex(bri);
  const BR_VERT = /* glsl */`
    uniform sampler2D uNz; uniform float uTb, uSea, uMirror, uSwSurf; varying vec3 vW; varying float vS, vH, vC;
    void main() {
      float x = position.x, s = position.y, f = (x - 4.) / 112.;
      float fall = smoothstep(1.0, 1.9, uTb);
      float H = 3.6 * smoothstep(0., 0.07, f) * (1. - smoothstep(0.9, 1., f)) * (0.86 + 0.14 * sin(x * 0.23 + 0.6)) * (1. - 0.92 * fall);
      float c = clamp(0.5 + 0.95 * uTb + 0.1 * sin(x * 0.19 + 1.), 0., 1.);        // how far the lip has come over
      float la = (0.7 + 2.4 * c) * (0.84 + 0.36 * textureLod(uNz, vec2(x / 7., 0.37), 0.).r), R = 0.4 * H, th = 0.09 * H, Ri = R - th;
      float thr = 0.35 * R * c;
      float z, y;
      if (s < 0.3) { float a = s / 0.3; z = -9. * (1. - a); y = H * a * a * (3. - 2. * a) - 0.15 * (1. - a); }
      else if (s < 0.55) { float an = (s - 0.3) / 0.25 * la; z = 1.35 * R * sin(an) + thr * an; y = H - R * (1. - cos(an)); }
      else if (s < 0.75) { float an = (1. - (s - 0.55) / 0.2) * la; z = 1.35 * Ri * sin(an) + thr * an; y = H - th - Ri * (1. - cos(an)); }
      else { float q = (s - 0.75) / 0.25; z = -0.42 * H * sin(3.14159 * q) * (1. - q) + 1.7 * H * q * q; y = (H - th) * (1. - q) * (1. - q) * (1. + 0.5 * q) - 0.15 * q; }
      float zc = -7. + 2.6 * cos(6.2831853 * (x - 34.) / 52.);
      y += 0.3 * smoothstep(0.3, 0.9, uTb) * (1. - 0.6 * fall) * sin(x * 1.7 + s * 9.) * sin(x * 0.63 + 1.) * smoothstep(0., 0.07, f) * (1. - smoothstep(0.9, 1., f)) * step(0.02, s) * step(s, 0.98);
      vec3 q3 = vec3(x, uSea + y * uSwSurf - 2. * (1. - uSwSurf), zc + 5. * uTb + z);
      vW = q3; vS = s; vH = y / 3.6; vC = c;
      gl_Position = projectionMatrix * viewMatrix * vec4(q3.x, q3.y, q3.z * uMirror, 1.);
    }`;
  const BR_FRAG = /* glsl */`
    uniform sampler2D uHt, uCl, uNz; uniform vec3 uCam, uAmbSky, uKeyCol, uKeyDir, uSkyHor, uSkyZen; uniform float uKeyOn, uTb, uMirror;
    varying vec3 vW; varying float vS, vH, vC;
    void main() {
      vec3 dx = dFdx(vW), dy = dFdy(vW); vec3 n = cross(dx, dy); float nl = length(n);
      vec3 N = nl > 1e-9 ? n / nl : vec3(0., 1., 0.);
      vec3 V = normalize(uCam - vW); if (dot(N, V) < 0.) N = -N;
      float fres = 0.04 + 0.96 * pow(1. - max(dot(N, V), 0.), 4.);
      vec3 lit = (uAmbSky * 1.5 + uKeyCol * uKeyOn * 0.3) * 0.3183;
      float n1 = textureLod(uHt, vW.xz * vec2(0.11, 0.5), 0.).r, n2 = textureLod(uHt, vec2(vW.x * 0.9, vW.y * 0.35 + vW.z * 0.2) + 0.3, 0.).r;
      // thin water lets the low sun through: the lip and the top of the face glow green
      float thin = smoothstep(0.3, 1., vH) * step(0.3, vS);
      vec3 glass = mix(vec3(0.045, 0.21, 0.22), vec3(0.17, 0.52, 0.43), thin) * lit * 1.5 + uKeyCol * uKeyOn * vec3(0.07, 0.36, 0.25) * thin * thin * 0.2;
      glass *= 0.78 + 0.5 * n2;                                    // water drawn up the face in streaks
      glass *= vS > 0.75 ? mix(0.5, 1.12, smoothstep(0.03, 0.45, (vS - 0.75) * 4.)) : (vS > 0.55 ? 0.62 : 1.);   // dark under the lip, bright lower down the face
      vec3 back = mix(vec3(0.03, 0.14, 0.20), vec3(0.08, 0.30, 0.30), smoothstep(0.4, 1., vH)) * lit * 1.4;
      vec3 c = vS < 0.3 ? mix(back, mix(uSkyHor, uSkyZen, 0.6), fres * 0.45) : mix(glass, uSkyHor, fres * 0.3 * step(vS, 0.55));
      // the apron in front of the wave dies into the sea: it takes the sea's own colour, and its edge is foam lace, never a cut
      float qa = clamp((vS - 0.75) / 0.25, 0., 1.);
      vec3 seaC = mix(vec3(0.045, 0.19, 0.26) * lit * 1.15, mix(uSkyHor, uSkyZen, 0.45) * 0.8, fres);
      c = mix(c, seaC, step(0.75, vS) * smoothstep(0.2, 0.85, qa));
      float apn = (vS - 0.8) * 5. - 1.05 * textureLod(uNz, vW.xz / 6., 0.).r - 0.4 * textureLod(uNz, vW.xz / 1.4, 0.).r + 0.12;
      if (vS > 0.8 && apn > 0.) discard;
      float fringe = step(0.8, vS) * smoothstep(-0.34, -0.04, apn);
      float fallF = smoothstep(1.15, 2.0, uTb);
      if (textureLod(uNz, vW.xz / 3.3, 0.).r + 0.35 * textureLod(uNz, vW.xz / 0.9, 0.).r < fallF * 0.8) discard;
      float sp = pow(max(dot(reflect(-uKeyDir, N), V), 0.), 60.);
      c += uKeyCol * uKeyOn * sp * 0.4;
      // white: along the lip's edge, feathering off the crest, streaks drawn up the face; then all of it, as it falls
      float t = vS < 0.55 ? (vS - 0.3) / 0.25 : 1. - (vS - 0.55) / 0.2;
      float lipIn = step(0.3, vS) * step(vS, 0.75);
      // the lip's edge is a thinning sheet torn into fingers and holes: no straight line anywhere
      float fgr = textureLod(uNz, vec2(vW.x / 4.2, 0.37), 0.).r * 0.7 + textureLod(uNz, vec2(vW.x / 1.3, 0.81), 0.).r * 0.5;
      if (lipIn > 0.5 && t > 0.56 + 0.62 * smoothstep(0.38, 0.78, fgr)) discard;
      if (lipIn > 0.5 && t > 0.45 && textureLod(uNz, vec2(vW.x / 0.9, t * 1.7), 0.).r > 0.7 - 0.12 * t) discard;
      float foam = lipIn * smoothstep(0.45 - 0.4 * n1 - 0.6 * smoothstep(0.1, 0.8, uTb), 0.8, t);
      foam = max(foam, smoothstep(0.2, 0.3, vS) * step(vS, 0.34) * smoothstep(0.25, 0.6, n2) * 0.8);
      float q = clamp((vS - 0.75) / 0.25, 0., 1.);
      foam = max(foam, step(0.75, vS) * smoothstep(0.5, 1., q) * 0.12 * smoothstep(0.45, 0.6, textureLod(uNz, vW.xz / 4., 0.).r));
      foam = max(foam, fringe * 0.95 * smoothstep(0.3, 0.55, textureLod(uNz, vW.xz / 2.3 + 0.2, 0.).r));
      float ww = 0.88 * smoothstep(0.1, 0.8, uTb);
      foam = mix(foam, 1., ww * smoothstep(0.05, 0.5, vH * 3. + 0.5 * n1 - 0.2 + ww));
      float fz = textureLod(uNz, vW.xz / 1.9 + vW.y * 0.6, 0.).r * 0.6 + textureLod(uNz, vW.xz / 7. - vW.y * 0.2, 0.).r * 0.5;
      c = mix(c, mix(vec3(0.50, 0.66, 0.70), vec3(0.93, 0.95, 0.94), smoothstep(0.35, 0.75, fz)) * lit * 2.5 * (0.7 + 0.3 * N.y), clamp(foam, 0., 1.));
      gl_FragColor = vec4(c, 1.);
    }`;
  const brMat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, vertexShader: BR_VERT, fragmentShader: BR_FRAG });
  const breaker = new THREE.Mesh(brGeo, brMat); breaker.frustumCulled = false; group.add(breaker);
  await ctx.yield();

  // seven drift logs, snags leaning out of the sand: their shadows are the hands of the day's clock (drawn by the land)
  const logs = [];
  const logGeo = new THREE.CylinderGeometry(0.26, 0.46, 1, 7, 1); logGeo.translate(0, 0.5, 0);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x9a8c7a, roughness: 0.9, side: THREE.DoubleSide });
  const logMesh = new THREE.InstancedMesh(logGeo, logMat, 7); logMesh.frustumCulled = false; group.add(logMesh);
  for (let i = 0; i < 7; i++) {
    const x = 62 + i * 25 + rng.range(-6, 6), z = rng.range(36, 50), len = rng.range(5, 9), tilt = rng.range(0.55, 1.0), yaw = rng.range(0, TAU);
    const dir = V3(Math.cos(yaw) * Math.cos(tilt), Math.sin(tilt), Math.sin(yaw) * Math.cos(tilt));
    logs.push({ base: V3(x, (z - 25) / 20 - 0.15, z), dir, len, lift: PERIOD.tide * (0.25 + Math.floor(i * 0.6)), drift: rng.range(0.6, 1.4) });
  }

  // the stack and the ring: exempt from the law. Black basalt footed 120 m below datum, weed and a tide stain at datum.
  // (a sheaf of hexagonal columns, the middle ones carrying the ring, the outer ones stepping down and broken off)
  const stP = [], stC = [], stE = [];
  const cuts = [-122, -3, 4.5];
  for (let iz = -6; iz <= 6; iz++) for (let ix = -6; ix <= 6; ix++) {
    const cx = (ix + (iz & 1) * 0.5) * 2.0, cz = iz * 1.732, d = Math.hypot(cx, cz);
    if (d > 9.3) continue;
    const r1 = rng(), r2 = rng(), r3 = rng();
    let top = 32 - 0.42 * Math.pow(Math.max(0, d - 4.5), 1.7) + (d < 4.5 ? 0.5 * Math.floor(r1 * 2.99) - 0.9 : 1.6 * (r1 - 0.5));
    if (d > 7.2 && r2 < 0.4) top -= 5 + 16 * r3;
    const R = 1.175, v = 0.78 + 0.44 * r3, rot = 0.08 * (r2 - 0.5), ys = cuts.concat([top]);
    for (let k = 0; k < 6; k++) {
      const a0 = rot + TAU * k / 6, a1 = rot + TAU * (k + 1) / 6, x0 = cx + R * Math.cos(a0), z0 = cz + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), z1 = cz + R * Math.sin(a1);
      const vf = v * (0.92 + 0.16 * ((k * 7) % 3) / 2);
      for (let q = 0; q < 3; q++) {
        const ya = ys[q], yb = ys[q + 1];
        stP.push(x0, ya, z0, x0, yb, z0, x1, ya, z1, x1, ya, z1, x0, yb, z0, x1, yb, z1);
        stE.push(-1, 0, -1, 0, 1, 0, 1, 0, -1, 0, 1, 0);                 // aE.x: across the face, -1..1 (the column's edges are at +-1); aE.y: 1 on a top
        for (let t = 0; t < 6; t++) stC.push(vf, vf, vf);
      }
      // the tops: worn, a little paler, dished toward one side
      stP.push(cx, top + 0.12 * (r1 - 0.5), cz, x1, top + 0.1 * Math.sin(a1 + r2 * 6), z1, x0, top + 0.1 * Math.sin(a0 + r2 * 6), z0);
      stE.push(0, 1, 1, 1, 1, 1);
      for (let t = 0; t < 3; t++) stC.push(v * 1.25, v * 1.25, v * 1.25);
    }
  }
  const stGeo = new THREE.BufferGeometry();
  stGeo.setAttribute('position', new THREE.Float32BufferAttribute(stP, 3)); stGeo.setAttribute('aTone', new THREE.Float32BufferAttribute(stC, 3));
  stGeo.setAttribute('aE', new THREE.Float32BufferAttribute(stE, 2)); stGeo.computeVertexNormals();
  // its own small shader: basalt that takes the key and the sky as the land does, so that it is a lit object at every hour
  // and is the same object from second 0 to 45: weed belt and tide stain at datum, whatever the sea is doing
  const stackMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aTone; attribute vec2 aE; varying vec3 vW, vN, vL; varying vec2 vE; varying float vT;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vL = position; vE = aE; vT = aTone.r;
        vN = mat3(modelMatrix) * normal;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uNz; uniform vec3 uKeyDir, uKeyCol, uAmbSky, uAmbGnd, uSkyHor, uSkyZen, uFogCol, uBandCol; uniform float uKeyOn, uMirror, uSwDay;
      varying vec3 vW, vN, vL; varying vec2 vE; varying float vT;
      void main() {
        float nl = length(vN); vec3 N = nl > 1e-6 ? vN / nl : vec3(0., 1., 0.);
        vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
        vec3 L = vec3(uKeyDir.x, uKeyDir.y, uKeyDir.z * uMirror);
        float n1 = textureLod(uNz, vec2(atan(vL.z, vL.x + (abs(vL.x) + abs(vL.z) < 1e-4 ? 1e-4 : 0.)) * 0.8, vL.y * 0.02), 0.).r;
        float n2 = textureLod(uNz, vec2(vL.x + vL.z, vL.y * 0.35) * 0.11, 0.).r;
        float y = vL.y + 1.6 * (n1 - 0.5);
        // basalt: cool grey, cross-jointed; below it the pale tide stain, the green weed belt, the dark foot
        float joint = smoothstep(0.47, 0.5, abs(fract(vL.y * 0.31 + 3. * vT + 0.4 * n2) - 0.5)) * (1. - vE.y);
        vec3 alb = vec3(0.21, 0.225, 0.26) * vT * (0.82 + 0.4 * n2) * (1. - 0.3 * joint);
        alb = mix(alb, vec3(0.50, 0.46, 0.37) * (0.8 + 0.4 * n2), (1. - smoothstep(4.2, 7.5, y)) * 0.85);       // tide stain
        alb = mix(alb, vec3(0.045, 0.075, 0.03) * (0.7 + 0.9 * n2), 1. - smoothstep(0.6, 2.2, y));                // weed
        alb = mix(alb, vec3(0.06, 0.065, 0.08), 1. - smoothstep(-9., -3.5, y));                                 // never dried
        float ndl = dot(N, L);
        float key = smoothstep(-0.05, 0.6, ndl);
        float lum = clamp(dot(uAmbSky, vec3(0.9)) + 0.05, 0.06, 1.);
        float edge = smoothstep(0.8, 0.98, abs(vE.x));
        float crev = 1. - 0.45 * smoothstep(0.55, 0.8, abs(vE.x)) * (1. - edge) * (1. - vE.y);                   // the joints between columns are dark
        vec3 amb = mix(uAmbGnd * 0.8, uAmbSky * 2.2, N.y * 0.3 + 0.7) + vec3(0.14, 0.18, 0.3) * lum;             // the sky and the sea fill its shadows: deep blue, never black
        vec3 c = alb * (uKeyCol * uKeyOn * key * 0.95 + amb * crev) * 0.3183;
        c += alb * uKeyCol * uKeyOn * 0.55 * edge * smoothstep(-0.3, 0.5, ndl) * 0.3183;                         // column edges and the rims of the tops catch a thin light
        float fr = pow(1. - clamp(dot(N, V), 0., 1.), 3.);
        c = mix(c, mix(uSkyHor, uSkyZen, 0.3) * 0.55, 0.3 * fr);                                                // wet rock: a sheen of sky
        float dd = distance(vW, cameraPosition);
        c = mix(c, uFogCol, 1. - exp(-dd * dd * 3.6e-7));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const stack = new THREE.Mesh(stGeo, stackMat); stack.position.set(450, 0, 0); group.add(stack);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.5, metalness: 0.3, emissive: 0xffd9a0, emissiveIntensity: 0.22, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.7, 0.62, 12, 64), ringMat); ring.rotation.y = Math.PI / 2; ring.position.set(450, 40, 0); group.add(ring);
  await ctx.yield();

  // after the law: dust motes creeping at 0.3 m/s on real time
  const NM = Math.round(600 * Math.max(0.5, detail)), mp = new Float32Array(NM * 3), mv = new Float32Array(NM * 3);
  for (let i = 0; i < NM; i++) {
    mp[i * 3] = rng.range(395, 470); mp[i * 3 + 1] = 40 + rng.range(-9, 9); mp[i * 3 + 2] = rng.range(-16, 16);
    mv[i * 3] = rng.range(-0.3, 0.1); mv[i * 3 + 1] = rng.range(-0.08, 0.12); mv[i * 3 + 2] = rng.range(0.1, 0.3);
  }
  const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3)); moteGeo.setAttribute('aV', new THREE.BufferAttribute(mv, 3));
  const moteMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aV; uniform float uReal, uMirror, uPx; varying float vA;
      void main() {
        vec3 p = position + aV * uReal + 0.25 * sin(uReal * 0.9 + position.zxy * 1.7);
        vec4 mv = viewMatrix * vec4(p.x, p.y, p.z * uMirror, 1.);
        gl_Position = projectionMatrix * mv;
        vA = step(0.0005, uReal) * smoothstep(0.5, 3., -mv.z);
        gl_PointSize = max(2., 0.07 * uPx / max(-mv.z, 0.05)) * vA;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uKeyCol; varying float vA;
      void main() { vec2 q = gl_PointCoord * 2. - 1.; float a = 1. - dot(q, q); if (a < 0. || vA < 0.01) discard; gl_FragColor = vec4(uKeyCol * 0.5 * a * vA, 1.); }`,
  });
  const motes = new THREE.Points(moteGeo, moteMat); motes.frustumCulled = false; group.add(motes);
  await ctx.yield();

  // ---- per frame: the clock, then every uniform from it ----
  const K = (h) => new THREE.Color(h);
  const COL = {
    dayZen: K('#2F68B4'), dayHor: K('#A9BFD8'), nightZen: K('#0C1430'), nightHor: K('#22365E'), dusk: K('#F08A4B'), endZen: K('#3A1A1C'), endHor: K('#B8683C'),
    keyDay: K('#FFE2B0'), keyLow: K('#F08A4B'), keyNight: K('#8FA6D8'), keyMean: K('#FFE2A8'), keyWhite: K('#FFF4E0'), keyYel: K('#FFB05A'), keyRed: K('#D2452A'),
    hemiSky: K('#9DB6D6'), violet: K('#5A5FA8'), mauve: K('#7A5A78'), gndViolet: K('#4A4468'), hemiGnd: K('#6B5A45'), haze: K('#C9B89A'),
    bandGold: K('#F2C14E'), bandWhite: K('#FFF4E0'), bandOr: K('#E0762B'), bandRed: K('#B3261A'), discRed: K('#E2502C'),
  };
  const tmpA = new THREE.Color(), tmpB = new THREE.Color(), sun = V3(), meanDir = V3(), instDir = V3(), camPos = V3(), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), up = V3(0, 1, 0), dv = V3(), pv = V3(), sv = V3();
  const moonDir = V3(0.25, 0.85, -0.35).normalize();
  const buf = new THREE.Vector2();
  const state = { clock: null, keyDir: V3(0, 1, 0), keyColor: new THREE.Color(), keyIntensity: 1, hemiSky: new THREE.Color(), hemiGnd: new THREE.Color(), hemiIntensity: 0.55, fog: new THREE.Color(), sunDir: sun };
  const ramp = (out, stops, x) => {            // stops: [[x, Color], ...]
    if (x <= stops[0][0]) return out.copy(stops[0][1]);
    for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) return out.copy(stops[i - 1][1]).lerp(stops[i][1], (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
    return out.copy(stops[stops.length - 1][1]);
  };
  const latR = lat * DEG, endDecl = 11 * DEG;
  const endH = Math.acos(Math.max(-1, Math.min(1, (Math.sin(13 * DEG) - Math.sin(endDecl) * Math.sin(latR)) / (Math.cos(endDecl) * Math.cos(latR)))));
  const rare = !!opts.rare;
  const clk = { ph: {}, sw: {}, f: {} };            // the clock's record and the colour ramps are made once, never per frame
  const RAMP_BAND = [[0.1, COL.bandGold], [0.87, COL.bandWhite], [5, COL.bandGold], [6.4, COL.bandOr], [7.5, COL.bandRed]];
  const RAMP_KEY = [[0.1, COL.keyMean], [0.87, COL.keyWhite], [5, COL.keyYel], [7.5, COL.keyRed]];

  function update(tJourney, real, camera, renderer) {
    const c = clockAt(tJourney, real, clk); state.clock = c;
    const t = c.t, md = 1 - c.sw.day, my = 1 - c.sw.year, gyr = c.gyr;
    U.uTb.value = c.Tb;
    U.uPhSurf.value = c.ph.surf; U.uSwSurf.value = c.sw.surf * c.wet;
    U.uPhCloud.value = c.ph.cloud; U.uSwCloud.value = c.sw.cloud;
    U.uPhDune.value = c.ph.dune; U.uSwDune.value = c.sw.dune;
    U.uRiverA.value = 55 * DEG * Math.sin(TAU * c.ph.river); U.uRiverSpit.value = Math.cos(TAU * c.ph.river); U.uSwRiver.value = c.sw.river * c.wet;
    const isl = rare ? sstep(31.4, 32.7, t) * (1 - 0.94 * sstep(33.1, 34.3, t)) : 0;
    U.uIsland.value = isl; U.uIsleHot.value = rare ? sstep(31.4, 31.9, t) * (1 - sstep(32.5, 33.2, t)) : 0; U.uShore.value = rare ? 0 : 300 * Math.sin(TAU * c.ph.shore) * c.sw.shore;
    const g = c.glacial * c.sw.ice * c.wet;
    U.uIceG.value = opts.noIce ? 0 : g; U.uIceR.value = Math.pow(g, 0.35); U.uIceMean.value = opts.noIce ? 0 : 1 - c.sw.ice;   // the front's reach runs ahead of the sheet's volume
    U.uPhRange.value = c.ph.range; U.uSwRange.value = c.sw.range;
    const cy = Math.cos(TAU * c.ph.year), decl = 23.44 * DEG * cy;
    U.uSwYear.value = c.sw.year; U.uSinDs.value = Math.sin(decl); U.uSnowLine.value = (opts.snowBase || 1500) + 900 * cy;
    U.uWet.value = c.wet; U.uSalt.value = 1 - c.wet;
    const tide = 1.5 * Math.sin(TAU * c.ph.tide) * c.sw.tide * c.wet;
    U.uSea.value = tide - 120 * sstep(0.12, 0.9, g) - 200 * (1 - c.wet);     // the sea answers the ice's volume, not its reach: a small sheet barely lowers it
    U.uReal.value = c.real; U.uHardKey.value = c.stopped ? 0 : sstep(31, 32, t); U.uKeyOn.value = 1;

    // the sun: true position while a day lasts longer than a second; after the stop it stands where the journey puts it
    if (c.stopped) sunFrom(frame, endDecl, endH, sun); else sunFrom(frame, decl, 60 * DEG + TAU * c.ph.day, sun);
    U.uSunDir.value.copy(sun); U.uSwDay.value = c.sw.day;
    const alt = sun.y, dayI = sstep(-0.1, 0.16, alt), low = Math.exp(-(alt / 0.2) * (alt / 0.2));
    const red = sstep(5, 7.5, gyr);
    U.uBandHalf.value = lerp(23.44, 30, sstep(3, 7.5, gyr)) * DEG;
    ramp(U.uBandCol.value, RAMP_BAND, gyr);
    U.uDiscR.value = (c.stopped ? 30 : 0.75) * DEG; U.uDiscI.value = c.stopped ? 1.0 : 7;
    if (c.stopped) U.uDiscCol.value.copy(COL.discRed); else U.uDiscCol.value.copy(COL.keyLow).lerp(COL.keyDay, sstep(0.02, 0.3, alt));
    U.uMoonD.value = 28 * DEG * Math.sin(TAU * c.ph.moon); U.uSwMoon.value = c.sw.moon; U.uMoonI.value = c.stopped ? 0 : 1 - red;
    U.uStarRot.value = c.ph.day; U.uNight.value = (1 - sstep(-0.16, -0.02, alt)) * c.sw.day + (c.stopped ? 0 : 0);

    // sky colours: the instant's, blended to the day's own average as the day blurs; dust red at the very end
    const dl = lerp(dayI, 0.78, md);                                  // how much daylight is in the picture
    tmpA.copy(COL.nightZen).lerp(COL.dayZen, dl); tmpB.copy(COL.nightHor).lerp(COL.dayHor, dl);
    tmpB.lerp(COL.dusk, 0.55 * low * (1 - md) * sstep(-0.14, 0.0, alt));
    U.uSkyZen.value.copy(tmpA).lerp(COL.endZen, red * 0.9); U.uSkyHor.value.copy(tmpB).lerp(COL.endHor, red * 0.85);
    U.uGlowCol.value.copy(U.uDiscCol.value).multiplyScalar(c.stopped ? 0.1 : 0.9 * sstep(-0.12, 0.05, alt));

    // the key: the true sun, then the mean direction of the day arc, then the high point of the band; never softened
    instDir.copy(sun); if (alt < 0.06) instDir.lerp(moonDir, sstep(0.06, -0.06, alt)).normalize();
    sunFrom(frame, decl * (1 - my), 0, meanDir);
    state.keyDir.copy(instDir).lerp(meanDir, c.stopped ? 0 : md).normalize();
    if (state.keyDir.y < 0.1) { state.keyDir.y = 0.1; state.keyDir.normalize(); }
    const kc = state.keyColor;
    kc.copy(COL.keyLow).lerp(COL.keyDay, sstep(0.03, 0.4, alt)).multiplyScalar(2.4 * dayI);
    tmpA.copy(COL.keyNight).multiplyScalar(0.62 * 2.4 * (1 - dayI)); kc.add(tmpA);          // a full moon stands opposite the sun: the one night is moonlit
    ramp(tmpA, RAMP_KEY, gyr); tmpA.multiplyScalar(c.stopped ? 5 : 2.2);   // the low red sun rakes the salt: more of it, by the same soft law as the first day
    kc.lerp(tmpA, c.stopped ? 1 : md);
    state.keyIntensity = 1;
    state.hemiSky.copy(COL.hemiSky).lerp(COL.violet, 0.8 * U.uHardKey.value).lerp(COL.mauve, red * 0.8); state.hemiGnd.copy(COL.hemiGnd).lerp(COL.gndViolet, 0.6 * U.uHardKey.value);
    state.hemiIntensity = 0.55 * lerp(0.6, 1, dl) * (c.stopped ? 1.5 : 1);
    U.uTwi.value = c.stopped ? 0 : c.sw.day * (0.5 + 0.8 * sstep(-0.36, -0.08, alt)) * (1 - sstep(-0.1, -0.015, alt));   // only once the sun is down: the sunset itself is the dusk colour's
    U.uMoonLit.value = (1 - dl);
    U.uLook.value = Math.max(U.uHardKey.value, c.stopped ? 0 : 0.8 * sstep(0.15, 0.6, dl));
    U.uKeyDir.value.copy(state.keyDir); U.uKeyCol.value.copy(kc);
    U.uAmbSky.value.copy(state.hemiSky).multiplyScalar(state.hemiIntensity); U.uAmbGnd.value.copy(state.hemiGnd).multiplyScalar(state.hemiIntensity);
    state.fog.copy(COL.haze).multiplyScalar(0.2 + 0.66 * dl).lerp(U.uSkyHor.value, lerp(0.8, 0.3, sstep(0, 0.4, dl)));
    U.uFogCol.value.copy(state.fog);

    // camera and sprites
    camera.getWorldPosition(camPos); U.uCam.value.set(camPos.x, camPos.y, camPos.z * mirror);
    if (renderer) { renderer.getDrawingBufferSize(buf); U.uPx.value = 0.5 * buf.y * camera.projectionMatrix.elements[5]; }

    // the bird hangs; by the time a wingbeat is a wingbeat again it is behind us
    const Tb = c.Tb, away = Math.max(0, Tb - 0.25);
    bird.position.set(BIRD.x - 1.5 * away, BIRD.y + 2.2 * away + 0.03 * Math.sin(TAU * 1.5 * Tb), BIRD.z - 8 * away);
    for (const w of wings) w.rotation.z = w.userData.sgn * (0.95 + 0.75 * Math.sin(TAU * 10 * Tb + 0.4));
    const cs = 1 - sstep(0.03, 0.4, Tb);
    crown.scale.set(2.2 * (1 + 0.8 * Tb), Math.max(2 * cs, 0.001), 2.2 * (1 + 0.8 * Tb)); crown.position.y = U.uSea.value;

    // logs: each stands until its high tide lifts it off
    for (let i = 0; i < 7; i++) {
      const L = logs[i], a = sstep(L.lift - 0.05 * PERIOD.tide, L.lift + 0.12 * PERIOD.tide, c.T), fl = sstep(0, 0.3, a);
      dv.copy(L.dir); dv.y = lerp(dv.y, 0.04, fl); dv.normalize();
      pv.set(L.base.x - 14 * L.drift * a, lerp(L.base.y, U.uSea.value, fl), L.base.z - 75 * a);
      const len = L.len * (1 - sstep(0.55, 1, a));
      qt.setFromUnitVectors(up, dv); m4.compose(pv, qt, sv.set(1, Math.max(len, 0.001), 1)); logMesh.setMatrixAt(i, m4);
      U.uLogs.value[i].set(pv.x, pv.z, 0, 1 - sstep(0, 0.25, a));
      U.uLogTip.value[i].set(pv.x + dv.x * len, dv.y * len, pv.z + dv.z * len);
    }
    logMesh.instanceMatrix.needsUpdate = true;
    return state;
  }

  return { group, update, uniforms: U, frame, mirror, state, parts: { land, sea, sky, bird, crown, beads, breaker, logMesh, stack, ring, motes } };
}
