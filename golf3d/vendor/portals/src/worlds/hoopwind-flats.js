// HOOPWIND: a salt pan crossed by a herd of living hoops (sea-glass membranes in horn rims) that bowl
// downwind on edge and lay tinted shadows that mix where they cross. The camera runs with the herd, climbs
// over the river of discs, drops through the three-coloured shadow of the Grand Wheel toward its backlit
// face, rides along its rim, climbs away from the face while the Wheel rolls on ahead, swings round and
// comes down at its eye (a round window with the standing ring in it), goes through, and descends past
// elders ringing down like dropped coins to the standing ring.
//
// The Wheel never brakes: it rolls at one ground speed (about 21 m/s, between 20 and 23) for the whole 50 s flight, its
// roll matched to it; every closing or parting is the camera's own path and pace (pace = the inverse of the Wheel's
// travel per metre of route).
//
// The journey. The entry: inside the herd, a 9 m rose hoop to port, three juveniles overtaking to starboard, the Wheel
// pale on the plum band. The gust: a front of salt smoke, a line in the world square to the wind, fixed by one place
// (117 m behind the entry portal along the wind) and running 60 m per second of flight; it overtakes us at about 7 s,
// passes over and round us and runs on ahead toward the Wheel as one soft bank (upright sheets seen from the pan, a
// billowed crown seen from the air); the wave of lean runs up the herd at its foot and no hoop leans before the foot
// reaches it. Its strength belongs to its own run: it gathers over its first 300 m and is spent 80 to 380 m beyond
// the Wheel. The entry's cast rolls at one ground speed each; once the front has passed a hoop of it, it carves into
// the nearest line between two files and keeps that lane. The river: we climb,
// and at the top of the climb the gaze drops to the files on the sun's side (it is tied to our height), where the elders
// of the river roll beneath and beside us in lanes of their own. The approach: from aft, far out to port, the gaze on
// one point of the Wheel, which stands whole with sky over its crown until we come down into its three-coloured
// shadow. The contact: along the lower rim at 8 m, 13 to 16 m off it, the salt fan blowing back past us, the bead in
// its window ahead. The face: we climb away from it while the Wheel rolls on. The eye: we swing right at the top
// (130 m) and come down at it on a straight run, the standing ring's light inside it, and go through.
//
// The descent and the ring: out of the eye the route dives at no more than 26 degrees, easing left, then runs 190 m
// dead straight and level to the standing ring (on a rare visit it holds its height for 76 m first, through the twin's
// eye). Below lies the resting ground as a rosette: nine spiral roads closing on the ring (ground shader), the fallen
// gathered in the lanes between them (rose panes lying flat, sleepers propped on their rims and rocking, hoops still
// ringing down). Along the lanes either side of the way in stand the elders, laid from the seed at even steps, each
// ringing down and wobbling back up on its own seeded clock, with panes of rose glass between them. The standing ring
// is a 46 m terraced rim round a 14.3 m portal, centre 12.5 m up, its foot sunk in a drift, with a mint halo sprite set
// just behind it and two half-buried rims as fallen arches. Every other lane between the nine roads holds rose brine
// in whole cells of the pan, a crust line round each sheet.
//
// Shadows are the idea of the world, so each is drawn as the window it was thrown by: the pane's tint, its veins as
// dark leading (wider toward the soft far end), a dark line for the rim and the hem, the eye a hole of sunlit salt.
// Seen at a grazing angle, where a shadow thins to a stripe, they fade toward a wash of tinted light.
//
// The herd runs in files (one lane every 9 m, one speed to a lane); a third of the adults are elders of 14 to 40 m.
// No hoop is moved by where the camera is or looks. The frame is kept clear by authoring in world space: each lane has
// a size cap (the lanes our low route runs beside carry only lesser hoops); a static corridor round the low parts
// of the route (grids of the nearest route sample, built once: one in the world's frame, one in the Wheel's frame for
// the legs authored beside the Wheel) parts the files: a hoop whose place falls inside it stands at the tube's wall on
// the side of its own offset from the axis (exactly on the axis: by its own seed), at full distance, never inside and
// never faded; and the elders of the river
// and the Wheel's escorts hold seeded lanes of their own.
//
// Shadows: every shadow quad (herd, ring, Wheel) is drawn on layer 1 into a half-resolution target T (cleared white,
// multiplied), by the ground's onBeforeRender; the ground lights itself once, alb * (sun * T + sky), so where windows
// cross the tints multiply and nothing is ever darker than the sky-lit salt. Rims, hems, keel and bead cast plain
// lilac (no tint of the glass).
//
// World frame: the herd's final heading is -X, port is +Z, the sun stands to starboard (-Z). The Wheel
// (src/parts/hoopwind-flats.js) is unrotated: it rolls toward -X at wheelX(u), authored with the path.
// Every hoop (near, mid and far) is one instance whose position / heading / lean / roll is written on the
// CPU each frame from a flow field shared by the whole herd; shadows are quads slid down the sun ray.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/hoopwind-flats.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- shared GLSL
const G_COMMON = /* glsl */`
const float PI = 3.14159265;
uniform vec3 uSunDir, uSunCol, uSkyCol;
uniform vec3 uFogA, uFogB;          // haze colour downwind (lilac) and sunward (peach)
uniform float uFogK, uTime;
vec3 nrm(vec3 v){ return v / max(length(v), 1e-5); }
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p + n + 19.19)); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){ return vnoise(p) * .5 + vnoise(p * 2.03 + 7.1) * .3 + vnoise(p * 4.1 + 3.7) * .2; }
// haze: colour depends on whether we look sunward; amount is exp2 in distance
vec3 hazeCol(vec3 viewDir){
  vec2 s = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  vec2 v = viewDir.xz / max(length(viewDir.xz), 1e-4);
  float k = max(dot(v, s), 0.);
  return mix(uFogA, uFogB, k * k);
}
float hazeAmt(float d){ float x = d * uFogK; return 1. - exp(-x * x); }
// the sun as salt in the air takes it: by its height, as the pan does (equal to uSunCol at the default hour's 16 degrees)
vec3 sunLow(){ return uSunCol * (uSunDir.y * .95 + .03) / .292; }
`;

// The bank of salt smoke that stands on the gust front (shared by the bank's own slices and by the pan, which takes
// its shadow). q = (metres along the front line, metres BEHIND the line, height). One soft body: a column height that
// swells and sinks along the line (with gaps down to the salt), a rounded section that leans downwind with height,
// broad billows, and a few wisps torn off the crest and blown ahead. No thresholds narrower than the body itself.
const BANK_GLSL = /* glsl */`
const float BANK_H = 10.;
float bankLine(float s, float t){ return 18. * (vnoise(vec2(s * .011, t * .1)) - .5) + 7. * (vnoise(vec2(s * .043 + 5., t * .22)) - .5); }
float bankCol(float s, float t){
  float g = smoothstep(.08, .3, vnoise(vec2(s * .016 + 3., t * .07)));
  return g * (.6 + .62 * vnoise(vec2(s * .037 + 9., t * .18)));
}
float bankF(vec3 q, float t){
  float c = bankCol(q.x, t), H = BANK_H * c + .01;
  float hy = q.y / H;
  float a0 = 5. - .6 * q.y, w = 3.5 + 6. * c;
  float da = (q.z - a0) / w;
  float n = .55 * vnoise(vec2(q.x * .085 - t * .3 + q.z * .06, q.y * .17 - t * .22)) + .45 * vnoise(vec2(q.x * .19 + q.y * .05, q.z * .14 + q.y * .1 + t * .35));
  float lump = vnoise(vec2(q.x * .17 + q.z * .12, q.y * .3 - q.z * .1 + t * .3));      // rounded billows six or eight metres across
  float body = 1.05 - da * da - hy * hy + .7 * (n - .5) + .5 * (lump - .5);
  // wisps ahead of the crest
  float ah = -(q.z - a0) - w;
  float wisp = smoothstep(0., 6., ah) * (1. - smoothstep(10., 30., ah)) * (1. - abs(hy - .82) * 2.6) * smoothstep(.5, .85, vnoise(vec2(q.x * .05 - t * .25, q.z * .07 + t * .5 + q.y * .1))) * .9 * smoothstep(.02, .2, c);
  return max(body, wisp);
}
float bankRho(vec3 q, float t){ return smoothstep(0., .4, bankF(q, t)); }
// the top of the same body as a height over the pan (s along the line, zb behind it, in the body's own scale): a rounded
// crown with a finite slope at its foot, the billows of the body in it
float bankTop(float s, float zb, float t){
  float c = bankCol(s, t), H = BANK_H * c, y = .6 * H;
  float a0 = 5. - .6 * y, w = 3.5 + 6. * c;
  float da = (zb - a0) / w;
  float n = .55 * vnoise(vec2(s * .085 - t * .3 + zb * .06, y * .17 - t * .22)) + .45 * vnoise(vec2(s * .19 + y * .05, zb * .14 + y * .1 + t * .35));
  float lump = vnoise(vec2(s * .17 + zb * .12, y * .3 - zb * .1 + t * .3));
  float f = clamp(1.05 - da * da + .7 * (n - .5) + .5 * (lump - .5), 0., 1.), g = 1. - f;
  // a broad crown (the flanks are short), heaped with rounded billows that crease where they meet
  float b1 = 2. * vnoise(vec2(s * .11 + zb * .04 - t * .16, zb * .13 + t * .12)) - 1., b2 = 2. * vnoise(vec2(s * .27 - t * .24, zb * .29 + t * .27 + 4.)) - 1.;
  return H * (1. - g * g * g) * (.75 + .2 * (1. - b1 * b1) + .06 * (1. - b2 * b2));
}
`;

// ---------------------------------------------------------------- sky dome
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position * 100. + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;       // a vertex exactly beside a level camera (the pole) has w = 0
  gl_Position = p.xyww;
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uZenith, uHorizon, uPlum, uGroundHaze, uCirrus, uDiscCol;
uniform vec2 uPlumDir, uWind;
uniform vec4 uDisc;       // disc cos radius, disc radiance, glow, stars
${G_COMMON}
void main(){
  vec3 d = nrm(vDir);
  float h = d.y;
  vec2 az = d.xz / max(length(d.xz), 1e-4);
  float up = clamp(h, 0., 1.);
  vec3 col = mix(uHorizon, uZenith, 1. - exp(-up * 4.2));
  // sunward peach wash low down
  vec2 s2 = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float sunAz = max(dot(az, s2), 0.);
  col = mix(col, uFogB * 1.08, .75 * sunAz * sunAz * exp(-up * 7.));
  // the plum dust band downwind: the dark quarter everything pale is read against
  float pa = .5 + .5 * dot(az, uPlumDir);
  float band = exp(-up * 6.5) * smoothstep(.1, .75, pa);
  float streak = fbm(vec2(atan(az.y, az.x + step(abs(az.x) + abs(az.y), 1e-5)) * 5. + uTime * .004, up * 40.));
  col = mix(col, uPlum * (.84 + .3 * streak), min(band * 1.1, .9));
  col = mix(col, uZenith * .82, .35 * smoothstep(.2, .9, pa) * exp(-up * 3.) * (1. - band));
  // mares' tails combed downwind
  if (h > .015) {
    vec2 q = d.xz / (h + .11);
    vec2 w = vec2(dot(q, uWind), dot(q, vec2(-uWind.y, uWind.x)));
    w.x -= uTime * .012;
    float warp = vnoise(w * vec2(.35, .9) + 3.) + .5 * vnoise(w * vec2(.9, 2.1) + 13.);
    float a = fbm(vec2(w.x * .55 + warp * 1.6, w.y * 4.6 + warp * 1.2));
    float b = vnoise(vec2(w.x * 1.4, w.y * 26. + warp * 9.));
    float tails = smoothstep(.5, .82, a) * (.3 + .7 * b) * smoothstep(.03, .3, h) * smoothstep(.42, .8, vnoise(w * vec2(.13, .34) + 9.));
    float toSun = max(dot(d, uSunDir), 0.);
    col = mix(col, uCirrus * (1. + .5 * toSun * toSun), tails * .3);
  }
  // sun or moon: a small disc with an analytic glow
  float c = dot(d, uSunDir);
  float disc = smoothstep(uDisc.x - .00006, uDisc.x + .00006, c);
  float g = max(c, 0.); float g2 = g * g; float g8 = g2 * g2 * g2 * g2; float g64 = g8 * g8 * g8 * g8 * g8 * g8 * g8 * g8;
  col += uDiscCol * (disc * uDisc.y + uDisc.z * (.9 * g64 * g64 * g64 + .16 * g8 * g8));
  // stars (night)
  if (uDisc.w > 0. && h > 0.) {
    vec2 sp = d.xz / (h + .35) * 60.; vec2 si = floor(sp);
    float sh = hash21(si);
    float tw = .7 + .3 * sin(uTime * (1. + sh * 3.) + sh * 40.);
    float st = smoothstep(.28, .0, length(fract(sp) - .5 - (hash22(si + 3.) - .5) * .6)) * step(.93, sh);
    col += vec3(.8, .85, 1.) * st * tw * uDisc.w * smoothstep(0., .2, h);
  }
  // below the horizon: the haze the ground fades into
  vec3 gh = hazeCol(d);
  col = mix(col, gh, smoothstep(.012, -.03, h));
  col = mix(col, gh, .5 * exp(-up * 34.) * (1. - min(band, 1.) * .45));      // the plum band sinks into the pan's own haze at its foot: no hard stripe on the horizon
  col += (hash21(gl_FragCoord.xy) - .5) * .006;
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

// ---------------------------------------------------------------- the pan: one plane, everything in the shader
const GROUND_VERT = /* glsl */`
varying vec3 vW; varying vec4 vClip;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  vClip = gl_Position;
}`;
const GROUND_FRAG = /* glsl */`
varying vec3 vW; varying vec4 vClip;
uniform sampler2D tShadow; uniform vec3 uFloor;
uniform vec3 uSalt, uZenith, uHorizon, uBrine, uPlumCol;
uniform vec4 uGale;       // smoke strength, wet 0..1, gust front position (along wind), gust strength
uniform float uBankK;     // the bank's size (it gathers salt as it runs: 1 where it catches us, 2 up by the Wheel)
uniform vec4 uRest;       // the resting ground: centre xz, radius, strength of its rose brine pans
uniform vec2 uWindDir;
uniform vec4 uRing;       // the standing ring: xz, and the heading we arrive on
uniform vec3 uPortalCol;
${G_COMMON}
${BANK_GLSL}
// the herd's old ways into the resting ground: spiral roads closing on the standing ring, kept wide enough
// (in pixels) to be read from the air. Returns (groove, lip).
vec2 roadSet(vec2 rq, float rr, float arms, float twist, float seed, float fw){
  float ang = atan(rq.y, rq.x + step(abs(rq.x) + abs(rq.y), 1e-4));
  float t = ang / 6.2832 * arms + twist * log(max(rr, 1.)) + .9 * vnoise(rq * .005 + seed);
  float id = floor(t), f = abs(fract(t) - .5);
  float h = hash21(vec2(id, seed));
  float dM = f * rr * 6.2832 / arms * .9;                   // metres from the middle of this road
  float hw = max(.5 + 1.6 * h, fw * 1.15), aa = max(fw, .25);
  float groove = 1. - smoothstep(hw, hw + aa, dM);
  float lip = (1. - smoothstep(hw * 1.7 + .5, hw * 1.7 + .5 + aa, dM)) - groove;
  return vec2(groove, max(lip, 0.) * clamp(1.2 - fw * 2.2, 0., 1.)) * (.5 + .5 * h) * step(.2, h);
}
// the nine great roads: log spirals closing on the ring (the same numbers lay the fallen in the lanes between them).
// Never under two pixels wide. Returns (rutted bed, pale lip).
uniform float uRoadPh;
vec2 greatRoads(vec2 rq, float rr, float fmin, float fmax, out float wetLane){
  float ang = atan(rq.y, rq.x + step(abs(rq.x) + abs(rq.y), 1e-4));
  float t = (ang - uRoadPh - .5 * log(max(rr, 1.))) / 6.2832 * 9. + .25 * (vnoise(rq * .006 + 2.7) - .5);
  float id = mod(floor(t), 9.), f = abs(fract(t) - .5);
  // every other lane between the roads holds the rose brine: from the air the resting ground is a pinwheel of rose and ivory
  wetLane = step(.5, fract(mod(floor(t + .5), 9.) * .5 + .25)) * smoothstep(.05, .17, f);
  float h = hash21(vec2(id, 4.4));
  float dM = f * rr * 6.2832 / 9. * .894;                    // metres from the middle of this road
  float hw = max(3.8 + 2.4 * h, fmin * 2.4), aa = max(fmin, .3);
  float bed = 1. - smoothstep(hw, hw + aa, dM);
  float lip = (1. - smoothstep(hw * 1.18 + .45, hw * 1.18 + .45 + aa, dM)) - bed;
  float ruts = .8 + .2 * sin(dM * 4.2 + 2. * vnoise(rq * .05)) * clamp(1. - fmax * .5, 0., 1.);
  return vec2(bed * ruts, max(lip, 0.) * clamp(1.25 - fmax * 1.6, 0., 1.));
}
// one family of track lines: isolines of a stream function, random width and age per line
vec2 trackSet(vec2 p, float bend, float rot, float spacing, float seed, float fw){
  float c = cos(rot), s = sin(rot);
  vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  float psi = q.y + bend * q.x * q.x + 9. * sin(q.x * .011 + seed) + 22. * vnoise(q * .004 + seed);
  float t = psi / spacing;
  float id = floor(t), f = fract(t);
  float h = hash21(vec2(id, seed));
  float h2 = hash21(vec2(id, seed + 7.7));
  float wdt = mix(.05, 1.5, h * h * h) + .03;                    // half width in metres (5 cm .. 3 m)
  float dist = abs(f - .5 - (h2 - .5) * .7) * spacing;
  float aa = fw * 1.2 + .02;
  float groove = 1. - smoothstep(wdt - aa, wdt + aa, dist);
  float lip = (1. - smoothstep(wdt * 1.25 + .06 - aa, wdt * 1.25 + .06 + aa, dist)) - groove;
  float keep = step(.18, h2) * clamp(1.5 - fw * .7 / max(wdt, .2), 0., 1.);
  return vec2(groove, max(lip, 0.)) * keep * (.45 + .55 * h);
}
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  vec2 p = vW.xz;
  float fwx = length(dFdx(p)), fwy = length(dFdy(p));
  float fw = max(fwx, fwy);
  // polygon cells with raised ridges (F2 - F1 of a jittered grid) and their analytic normal
  vec2 pc = p / 2.0 + 2.5 * vec2(vnoise(p * .013), vnoise(p * .013 + 31.));
  vec2 ci = floor(pc), cf = fract(pc);
  float d1 = 8., d2 = 8.; vec2 r1 = vec2(0.), r2 = vec2(0.), id1 = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 r = g + .15 + .7 * hash22(ci + g) - cf; float d = dot(r, r);
    if (d < d1) { d2 = d1; r2 = r1; d1 = d; r1 = r; id1 = ci + g; } else if (d < d2) { d2 = d; r2 = r; }
  }
  float f1 = sqrt(d1), f2 = sqrt(d2);
  float e = f2 - f1;
  vec2 ge = r1 / max(f1, 1e-3) - r2 / max(f2, 1e-3);
  float cfw = fw / 2.0;
  float rw = .065 + cfw * 1.5;
  float ridge = 1. - smoothstep(0., rw, e);
  float detail = (1. - smoothstep(.06, .4, cfw)) * mix(1., .5, smoothstep(45., 120., dist));      // with distance the cells are drawn fine and faint (the air between): the windows of light are the pattern there
  float cellH = hash21(id1);
  float flank = ridge * (1. - ridge) * 4.;
  float grain = vnoise(p * 9.) * .5 + vnoise(p * 31.) * .5;
  vec3 N = nrm(vec3(ge.x * flank * 1.25 * detail + (grain - .5) * .1 * detail, 1., ge.y * flank * 1.25 * detail));
  // albedo: warm salt, cells of slightly different age, chalk ridges, grey-lilac pan staining at large scale
  float stain = fbm(p * .0031 + 4.);
  float crust = vnoise(p * 1.3) * .6 + vnoise(p * 3.7) * .4;
  vec3 alb = uSalt * (.82 + .17 * cellH * detail + .22 * (stain - .5) + .1 * (crust - .5) * detail);
  alb = mix(alb, alb * vec3(.86, .84, .92), detail * step(.8, cellH) * smoothstep(.1, .35, e));
  alb = mix(alb, uSalt * vec3(.93, .9, .98), .35 * smoothstep(.45, .75, fbm(p * .0009 + 11.)));
  alb *= 1. + .15 * ridge * ridge * detail - .12 * smoothstep(.0, .5, e) * (1. - smoothstep(.5, .9, e)) * detail * .5;
  float nod = smoothstep(.62, .8, vnoise(p * 5.3 + cellH * 9.)) * clamp(1. - fw * 14., 0., 1.);
  alb *= .94 + .12 * grain * detail + .14 * nod;
  N = nrm(N + vec3(vnoise(p * 5.3 + 2.) - .5, 0., vnoise(p * 5.3 + 5.) - .5) * .35 * nod);
  // tracks: new set along the flow, two older sets crossing it
  vec2 tr = trackSet(p, .00042, 0., 7.5, 1.3, fw) + .7 * trackSet(p, .0006, .21, 13., 5.1, fw) + .5 * trackSet(p, .0003, -.33, 21., 8.7, fw)
          + .55 * trackSet(p / 7., .003, .08, 9., 3.3, fw / 7.) * vec2(1., .12);        // the broad old roads of the herd, read from the air: a dark groove, its lip a hairline (never a pale bar)
  float wet = uGale.y;
  // from the air the fine cells filter away: broad old plates (17 m) take over, pale-ridged, so the pan stays drawn
  float big = 1. - detail;
  vec2 qc = p / 8. + 1.3 * vec2(vnoise(p * .008 + 3.), vnoise(p * .008 + 17.));
  vec2 qi = floor(qc), qf = fract(qc); float b1 = 8., b2 = 8.; vec2 bid = vec2(0.), rb1 = vec2(0.), rb2 = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 r = g + .15 + .7 * hash22(qi + g + 41.) - qf; float d = dot(r, r);
    if (d < b1) { b2 = b1; rb2 = rb1; b1 = d; rb1 = r; bid = qi + g; } else if (d < b2) { b2 = d; rb2 = r; }
  }
  float eB = sqrt(b2) - sqrt(b1), wB = .04 + fw / 8. * 1.4;
  float ridgeB = (1. - smoothstep(0., wB, eB)) * clamp(1.6 - fw * .25, 0., 1.);
  alb *= 1. + big * (-.3 * ridgeB + .12 * smoothstep(wB, wB * 2.5, eB) * (1. - smoothstep(wB * 2.5, wB * 5., eB)) * clamp(1.6 - fw * .25, 0., 1.) + .12 * (hash21(bid) - .5)) + .05 * ridgeB * detail;
  // roads into the resting ground
  vec2 rq = p - uRing.xy; float rr = length(rq);
  float rk = uRest.w * smoothstep(1000., 600., rr) * smoothstep(14., 40., rr);
  vec2 road = (.5 * roadSet(rq, rr, 13., 2.1, 2.7, fw) + .6 * roadSet(rq, rr, 8., -3.4, 9.1, fw)) * rk * vec2(1., .12);      // dark curved grooves, the lip a hairline (never a pale bar)
  tr = min(tr + road * 1.3, vec2(1.));                    // piled grooves never go darker than one groove
  tr *= 1. - .55 * wet;
  float wetLane;
  vec2 great = greatRoads(rq, rr, min(fwx, fwy), fw, wetLane) * uRest.w * smoothstep(900., 640., rr) * smoothstep(16., 46., rr);
  alb *= 1. - .26 * tr.x;
  alb = mix(alb, vec3(.8, .78, .74), .13 * tr.y * clamp(1.3 - fw * 1.6, 0., 1.));      // lips are fine things: from the air only the grooves are left
  alb = mix(alb, alb * vec3(.32, .29, .44), great.x);       // worn to the dark bed under the crust
  alb = mix(alb, vec3(.84, .82, .78), .45 * great.y);
  tr = max(tr, vec2(great.x * .5, great.y * .5));
  N = nrm(N + vec3(uSunDir.x, 0., uSunDir.z) * (.16 * tr.y - .16 * tr.x) * max(detail, .35));
  float nl = max(dot(N, uSunDir), uSunDir.y * mix(.78, .3, smoothstep(.12, .3, uSunDir.y)));
  alb = mix(alb, uSalt * 1.04, .45 * exp(-rr * rr / 2600.) * uRest.w);          // a pale apron of drifted salt round the ring
  // what the sun has passed through on its way here: the product of every pane above this point (the shadow target)
  vec3 Tsun = texture2D(tShadow, clamp(vClip.xy / max(vClip.w, 1e-4) * .5 + .5, 0., 1.)).rgb;
  vec3 shadeK = uFloor + (1. - uFloor) * Tsun;      // the same, floored by the sky fill: for what is not lit by this shader's own sun term
  // where windows cross and the product of their tints goes dark, the sky's lilac fills in: the darkest ground is plum, never brown or black
  float tMax = max(Tsun.r, max(Tsun.g, Tsun.b));
  vec3 plumFill = vec3(.4, .27, .58) * dot(uSunCol, vec3(.3, .5, .2)) * .24 * max(.4 * smoothstep(.5, .12, tMax) * smoothstep(.3, .1, uSunDir.y), .6 * smoothstep(.2, .03, tMax));      // (all of it at dawn, when every shadow is eight times its hoop; by day only the blackest crossings, so an elder's deep window keeps its colour)
  vec3 col = alb * (uSunCol * nl * Tsun + uSkyCol * (.72 + .28 * N.y) + plumFill);
  col += alb * uPortalCol * (.34 * exp(-rr * rr / 900.) + .1 * exp(-rr * rr / 9000.)) * uRest.w;     // and its light on the salt
  // sparkle of crystal faces near the camera
  float sp = step(.985, hash21(floor(p * 14.) + floor(V.xz * 6.))) * clamp(1. - fw * 9., 0., 1.);
  col += uSunCol * sp * .22 * Tsun;
  // brine: one cell in forty holds shallow water (everywhere after rain); it mirrors the analytic sky
  float pool = max(step(.975, cellH) * smoothstep(.02, .14, e) * detail, wet * (.75 + .25 * smoothstep(.0, .2, e)));
  // the rose brine of the resting ground lies in whole cells: its shore follows the cell edges, with a pale crust line
  float panK = uRest.w * smoothstep(uRest.z, uRest.z * .3, length(p - uRest.xy)) * smoothstep(-16., -80., p.y);
  float laneK = (wetLane - .45) * .34 * smoothstep(40., 90., rr) * smoothstep(840., 620., rr);
  float pf0 = fbm(p * .012 + 20.) + laneK;
  float pf1 = fbm((p + r1 * 2.) * .012 + 20.) + .05 * (cellH - .5) + laneK, pf2 = fbm((p + r2 * 2.) * .012 + 20.) + .05 * (hash21(id1 + 17.) - .5) + laneK;
  float in1 = smoothstep(.525, .535, pf1), in2 = smoothstep(.525, .535, pf2);
  float pb1 = fbm((p + rb1 * 8.) * .012 + 20.) + laneK, pb2 = fbm((p + rb2 * 8.) * .012 + 20.) + laneK;
  float inB1 = smoothstep(.525, .535, pb1), inB2 = smoothstep(.525, .535, pb2);
  float plateK = clamp(1.6 - fw * .25, 0., 1.);                    // (the plates filter away in their turn, far off)
  float pan = panK * mix(mix(smoothstep(.5, .56, pf0), inB1, plateK), in1, detail);
  float crustLine = panK * max(detail * abs(in1 - in2) * (1. - smoothstep(rw * .45, rw * 1.2, e)), (1. - detail) * plateK * abs(inB1 - inB2) * (1. - smoothstep(wB * .55, wB * 1.5, eB)));
  float shoreApron = panK * smoothstep(.455, .525, pf0) * (1. - pan);      // drifted salt just outside the shore
  pool = max(pool, pan * (.82 + .18 * smoothstep(0., .15, e) * detail));
  pool *= 1. - .92 * min(great.x * 1.4 + great.y, 1.);        // the great roads stand dry, even after rain
  // but a film of brine lies before the standing ring, over the road too: the ring and its light stand in it as in glass
  vec2 ra = vec2(dot(rq, uRing.zw), dot(rq, vec2(-uRing.w, uRing.z)));
  float apron = uRest.w * smoothstep(-175., -120., ra.x) * smoothstep(-15., -32., ra.x) * (1. - smoothstep(11., 21., abs(ra.y) * (1. + .4 * smoothstep(-60., -160., ra.x)) + 9. * (vnoise(p * .07 + 3.) - .5)));
  pool = max(pool, apron * (.78 + .2 * smoothstep(0., .15, e) * detail)); pan = max(pan, apron * .4);
  // the ring's light glancing off crystal faces: a broken streak of mint along the salt toward us (dry pan)
  {
    vec2 toR2 = uRing.xy - p; float dR2 = length(toR2);
    vec2 a3 = toR2 / max(dR2, 1e-3), v3 = -V.xz / max(length(V.xz), 1e-3);
    float az3 = a3.x * v3.y - a3.y * v3.x, w3 = 11. / max(dR2, 11.);
    float glit = exp(-az3 * az3 / (w3 * w3 * .5 + 4e-5)) * step(0., dot(a3, v3)) * smoothstep(12., 40., dR2) * exp(-dR2 / 380.);
    col += alb * uPortalCol * glit * (.3 + .7 * vnoise(p * .45 + vec2(uTime * .3, 0.))) * uRest.w * (1. - wet) * .75 * smoothstep(.42, .16, V.y);      // (a glancing light off crystal faces: it is there only at a grazing angle of view, never as a pale beam seen from steeply above)
  }
  if (pool > 0.) {
    vec2 rp = vec2(vnoise(p * 1.7 + uTime * vec2(.5, .3)), vnoise(p * 1.7 + 9. - uTime * vec2(.4, .2))) - .5;
    rp += (vec2(vnoise(p * .37 + uTime * vec2(.22, .1)), vnoise(p * .37 + 5. - uTime * vec2(.15, .2))) - .5) * 1.6 * wet;
    vec3 Nw = nrm(vec3(rp.x * .05, 1., rp.y * .05));
    vec3 R = reflect(-V, Nw); R.y = abs(R.y);
    float cosv = max(dot(V, Nw), 0.);
    float fr = mix(.06, .05, wet) + mix(.94, .95, wet) * pow(max(1. - cosv, 0.), mix(4., 3.4, wet));      // (after rain the film is thin: looked down on it shows its bed, and mirrors the sky only toward the horizon)
    float deep = max(wet, pan);                       // the rose pans hold the deep of the sky too, not the pale horizon
    fr = mix(fr, .16 + .84 * pow(max(1. - cosv, 0.), 1.6), pan * (1. - wet));      // the pans are water: the sky in their far half, the rose bed through the film in the near half
    // after rain the film mirrors the deep of the sky, periwinkle, not the pale haze at the horizon
    vec3 sky = mix(uHorizon, uZenith, 1. - exp(-R.y * mix(3.2, 9., deep)));
    sky = mix(sky, hazeCol(R), exp(-R.y * mix(18., 46., deep)) * (1. - .45 * deep));
    float sg = max(dot(R, uSunDir), 0.); float sg4 = sg * sg * sg * sg; float sg32 = sg4 * sg4 * sg4 * sg4 * sg4 * sg4 * sg4 * sg4;
    sky += uSunCol * sg32 * sg32 * mix(.8, .16, wet) * Tsun;
    sky *= mix(vec3(1.), shadeK, .75);                // a shadow still tints the film: it darkens the bed that shows through the reflection
    // the standing ring, its light and the two tipped rims, drawn out by the ripples into long streaks toward us
    vec3 toR = vec3(uRing.x, 13., uRing.y) - vW; float dR = length(toR.xz);
    vec2 a2 = toR.xz / max(dR, 1e-3), r2d = R.xz / max(length(R.xz), 1e-3);
    float azd = a2.x * r2d.y - a2.y * r2d.x, facing = step(0., dot(a2, r2d));
    float el = 13. / max(dR, 1.) - R.y / max(length(R.xz), 1e-3);
    float wAz = 9.5 / max(dR, 10.);                           // the ring's half width as an angle from here
    float glint = exp(-azd * azd / (wAz * wAz * .5 + 4e-5)) * exp(-el * el * 2.2) * facing * smoothstep(8., 30., dR) * smoothstep(950., 300., dR);
    sky += uPortalCol * glint * (1.1 + .5 * vnoise(vec2(p.x * .9 + uTime, p.y * .9)));
    vec2 side = vec2(-uRing.w, uRing.z);
    for (int k = 0; k < 2; k++) {
      vec2 c2 = uRing.xy + side * (k == 0 ? 36. : -36.) + uRing.zw * 8. - vW.xz; float dk = length(c2);
      vec2 ak = c2 / max(dk, 1e-3); float azk = ak.x * r2d.y - ak.y * r2d.x, wk = 9. / max(dk, 9.);
      float elk = 9. / max(dk, 1.) - R.y / max(length(R.xz), 1e-3);
      sky += (uSunCol * .12 + uSkyCol * .5) * exp(-azk * azk / (wk * wk * .5 + 4e-5)) * exp(-elk * elk * 3.) * step(0., dot(ak, r2d)) * smoothstep(8., 30., dk) * smoothstep(600., 200., dk);
    }
    // the reflected sky holds the plum band downwind
    { vec2 rz = R.xz / max(length(R.xz), 1e-3); sky = mix(sky, uPlumCol * .92, .85 * exp(-R.y * 6.5) * smoothstep(.1, .75, .5 + .5 * dot(rz, uWindDir)) * pan); }
    // the bed under the film: damp salt, paler and more neutral than the dry crust is dark, so coloured light stays coloured
    // on it; under the rose brine the cells are drowned (flat and faint, a little darker along their ridges)
    vec3 drowned = uSalt * (.8 + .22 * (stain - .5)) * (uSunCol * max(uSunDir.y, .1) * Tsun + uSkyCol + plumFill) * (1. - .16 * ridge * detail - .1 * ridgeB * big);
    vec3 bed = mix(col, drowned, .8 * pan * (1. - wet)) * mix(mix(uBrine, vec3(.82, .78, .84), wet), vec3(.76, .24, .38), pan * (1. - wet * .5));
    sky += uSunCol * Tsun * .8 * pan * smoothstep(.76, .88, vnoise(p * 2.1 + uTime * vec2(.55, .2))) * smoothstep(.7, .84, vnoise(p * .9 - uTime * vec2(.2, .35) + 4.));      // glints wandering on the film
    col = mix(col, mix(bed, sky, fr), pool);
  }
  col = mix(col, vec3(.84, .81, .76) * (uSunCol * nl * Tsun + uSkyCol), .3 * shoreApron * (1. - pool));
  col = mix(col, vec3(.9, .87, .82) * (uSunCol * max(nl, uSunDir.y * 1.6) * Tsun + uSkyCol), crustLine * .9);      // the crust round each pan: a thin bright line
  // salt smoke streaming along the ground, and the gust front
  vec2 wq = vec2(dot(p, uWindDir), dot(p, vec2(-uWindDir.y, uWindDir.x)));
  float sm = fbm(vec2(wq.x * .035 - uTime * 1.5, wq.y * .16)) * vnoise(vec2(wq.x * .008 - uTime * .25, wq.y * .02 + 3.));
  float fd = wq.x - uGale.z - bankLine(wq.y, uTime);      // metres ahead of the gust's ragged front line (negative: behind it)
  float tongue = fbm(vec2(wq.x * .045 - uTime * 2.4, wq.y * .3)) * vnoise(vec2(wq.x * .012 - uTime * .5, wq.y * .06 + 7.));
  // behind the front, long soft tongues of salt still stream along the ground
  float front = uGale.w * exp(-max(-fd, 0.) * .03) * smoothstep(4., -10., fd) * smoothstep(.24, .7, tongue) * .6;
  float low = 1. - exp(-.09 / max(V.y, .03));        // a thin sheet hugging the pan: thick along a grazing line of sight, next to nothing looked down through
  // the bank's own shadow: its body, slid down the sun's ray onto the salt (lilac, so the bank stands when seen from the air)
  if (uGale.w > .002 && abs(fd) < 200.) {
    vec2 pr2 = vec2(-uWindDir.y, uWindDir.x); vec2 sr = uSunDir.xz / max(uSunDir.y, .1);
    float bk = max(uBankK, .5);
    vec2 pa = p + sr * 3.5 * bk, pb = p + sr * 8.5 * bk, pd = p + sr * 13.5 * bk;
    float sa = dot(pa, pr2), sb = dot(pb, pr2), sd2 = dot(pd, pr2);
    float od = bankRho(vec3(sa, 3.5, (uGale.z - dot(pa, uWindDir) + bankLine(sa, uTime)) / bk), uTime)
             + bankRho(vec3(sb, 8.5, (uGale.z - dot(pb, uWindDir) + bankLine(sb, uTime)) / bk), uTime)
             + bankRho(vec3(sd2, 13.5, (uGale.z - dot(pd, uWindDir) + bankLine(sd2, uTime)) / bk), uTime);
    col *= mix(vec3(1.), vec3(.5, .47, .76), (1. - exp(-od * 1.2)) * uGale.w * .88);
  }
  float smoke = clamp(smoothstep(.26, .62, sm) * uGale.x * (.08 + .92 * low) + front * .4 * low, 0., .7);
  vec3 smokeCol = (sunLow() * .3 + uSkyCol * .95) * vec3(.82, .8, .78);
  col = mix(col, smokeCol, smoke);
  float f = hazeAmt(dist);
  col = mix(col, hazeCol(-V), f);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- hoops: instanced, every transform in the vertex shader
// iA = x, z, heading, radius    iB = roll, lean (+ = left), hop height, seed    iC = membrane tint rgb, fade 0..1
const HOOP_PARS = /* glsl */`
attribute vec4 iA, iB, iC;
uniform float uPix;
uniform vec4 uWheelA, uWheelB;       // hub xyz, radius scale (0 = absent)
uniform vec3 uWheelNA, uWheelNB;
uniform mat3 uWTintA, uWTintB;       // columns: transmittance of green, amber, rose
uniform vec2 uWBand;                 // band radii at scale 1
vec3 hoopRot(vec3 q){
  float cl = cos(iB.y), sl = sin(iB.y);
  q = vec3(q.x, cl * q.y - sl * q.z, sl * q.y + cl * q.z);
  float ch = cos(iA.z), sh = sin(iA.z);
  return vec3(ch * q.x + sh * q.z, q.y, sh * q.x - ch * q.z);
}
vec2 hoopSpin(vec2 p){ float c = cos(iB.x), s = sin(iB.x); return vec2(c * p.x + s * p.y, -s * p.x + c * p.y); }
// pl: metres in the hoop's own disc frame (centre at origin, before the spin)
vec3 hoopXf(vec3 pl){
  vec2 xy = hoopSpin(pl.xy);
  return vec3(iA.x, iB.z, iA.y) + hoopRot(vec3(xy.x, xy.y + iA.w, pl.z));
}
// what the sun has passed through on its way to c: the Wheel's bands (1 = clear air)
vec3 wheelT(vec3 c, vec4 wh, vec3 n, mat3 tint){
  float dn = dot(uSunDir, n);
  float t = dot(wh.xyz - c, n) / (abs(dn) > 1e-3 ? dn : 1e-3);
  vec3 q = c + uSunDir * t - wh.xyz;
  float r = length(q) / max(wh.w, 1e-3);
  vec3 T = vec3(1.);
  T = mix(T, tint[0], smoothstep(27., 33., r));
  T = mix(T, tint[1], smoothstep(uWBand.x - 5., uWBand.x + 5., r));
  T = mix(T, tint[2], smoothstep(uWBand.y - 5., uWBand.y + 5., r));
  T = mix(T, vec3(.3), smoothstep(103., 106., r));
  T = mix(T, vec3(1.), smoothstep(108., 112., r));
  return mix(vec3(1.), T, step(0., t) * step(.5, wh.w));
}
vec3 sunThrough(vec3 c){ return wheelT(c, uWheelA, uWheelNA, uWTintA) * wheelT(c, uWheelB, uWheelNB, uWTintB); }
`;

const WHEEL_GLSL = `
uniform vec4 uWheelA, uWheelB; uniform vec3 uWheelNA, uWheelNB; uniform mat3 uWTintA, uWTintB; uniform vec2 uWBand;
` + HOOP_PARS.slice(HOOP_PARS.indexOf('// what the sun has passed'));
const HORN_VERT = /* glsl */`
attribute vec4 aOff;      // radial offset, axial offset (tube radii), kind (0 rim, 1 hub ring), profile coordinate
attribute vec3 aNrm;      // profile normal (radial, axial), angle round the hoop
varying vec3 vW, vN, vSunT; varying vec4 vK;   // vK: angle (spinning frame), profile coord, kind, radius
varying vec3 vS;          // seed, fade, roll
varying vec4 vT;          // the way round the rim (world); w: how far this part of the rim stands toward the sun
uniform vec2 uThick;      // rim thickness multiplier, terraces per radian (the standing ring)
${G_COMMON}
${HOOP_PARS}
void main(){
  float R = iA.w;
  vec2 rad = position.xy / max(length(position.xy), 1e-4);
  vec3 c = vec3(iA.x, iB.z + R, iA.y);
  float dist = length(cameraPosition - c);
  float tr = max(R * .02 * mix(1., .62, aOff.z) * uThick.x * mix(1., iC.x, step(.5, uThick.y)), uPix * dist);
  float tph = aNrm.z * uThick.y + iB.w * 7.;       // the ancient ring: a few deep annuli, each swelling and then stepping back
  tr *= 1. + step(.5, uThick.y) * ((hash21(vec2(floor(tph), 3.)) - .5) * .18 + (smoothstep(0., .18, fract(tph)) * (1. - .6 * fract(tph)) - .5) * .46);
  vec3 pl = vec3(position.xy * R + rad * aOff.x * tr, aOff.y * tr * (1. + 1.3 * smoothstep(7., 18., R) * (1. - step(.5, uThick.y))));      // (an elder's rim is deep across: seen edge-on it is a band of stepped horn, never a line)
  vec3 w = hoopXf(pl);
  vec2 n2 = hoopSpin(rad * aNrm.x);
  vN = hoopRot(vec3(n2, aNrm.y));
  vT = vec4(hoopRot(vec3(hoopSpin(vec2(-rad.y, rad.x)), 0.)), dot(hoopRot(vec3(hoopSpin(rad), 0.)), uSunDir));
  vW = w;
  vK = vec4(aNrm.z, aOff.w, aOff.z, R);
  vS = vec3(iB.w, iC.w, iB.x);
  vSunT = sunThrough(c);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  if (iC.w <= 0.) gl_Position = vec4(2., 2., 2., 1.);
}`;
const BEHIND_GLSL = /* glsl */`
// a pane seen THROUGH the Wheel's glass: rgb = the tint of the band the line of sight crosses, a = 1 when it does.
// (the Wheel's membrane is drawn before the herd's, so without this the hoops beyond it stand on it as pale cut-outs)
vec4 behindWheel(vec3 w){
  vec3 d = w - cameraPosition; float dn = dot(d, uWheelNA);
  float t = dot(uWheelA.xyz - cameraPosition, uWheelNA) / (abs(dn) > 1e-3 ? dn : 1e-3);
  vec3 q = cameraPosition + d * t - uWheelA.xyz; float rq = length(q) / max(uWheelA.w, 1e-3);
  float k = step(0., t) * step(t, 1.) * smoothstep(28., 32., rq) * (1. - smoothstep(104., 108., rq)) * step(.5, uWheelA.w);
  vec3 T = mix(mix(uWTintA[0], uWTintA[1], smoothstep(uWBand.x - 5., uWBand.x + 5., rq)), uWTintA[2], smoothstep(uWBand.y - 5., uWBand.y + 5., rq));
  return vec4(T, k);
}
`;
const HORN_FRAG = /* glsl */`
varying vec3 vW, vN, vSunT; varying vec4 vK; varying vec3 vS; varying vec4 vT;
uniform vec3 uHorn, uAmber, uPlum, uRose, uSalt;
uniform vec2 uThick;
uniform vec4 uWheelA; uniform vec3 uWheelNA; uniform mat3 uWTintA; uniform vec2 uWBand;
${G_COMMON}
${BEHIND_GLSL}
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  vec3 N = nrm(vN);
  float R = vK.w, ang = vK.x, pc = vK.y, seed = vS.x;
  float arc = ang * R;                                  // metres round the rim, turning with it
  float px = dist * .0016;                              // rough pixel footprint in metres
  // growth rings: stepped terraces, amber banded, like a ram's horn
  float ringLen = mix(.22, .5, fract(seed * 7.13)) * (1. + .12 * R);
  float gt = arc / ringLen + 1.5 * vnoise(vec2(arc * .6, seed * 9.));
  float gf = fract(gt), gi = floor(gt);
  float ringFade = clamp(1.2 - px / ringLen * 2.2, 0., 1.);
  float step_ = smoothstep(0., .14, gf) * (1. - .55 * gf);
  float gh = hash21(vec2(gi, seed * 31.));
  vec3 horn = uHorn * (.6 + .16 * vnoise(vec2(arc * 1.7, pc * 6. + seed)));
  horn = mix(horn, horn * (.62 + .5 * step_), ringFade);
  horn = mix(horn, uAmber * .5, ringFade * step(.62, gh) * .55 * (1. - smoothstep(.55, .9, abs(pc))) + (1. - ringFade) * .2);
  // lichen in the growth rings of the old
  float old = step(.5, uThick.y);
  float lich = smoothstep(.55, .75, vnoise(vec2(arc * .35 + seed * 20., pc * 2.))) * smoothstep(5., 12., R) * (1. - .75 * old);
  horn = mix(horn, mix(uRose * .55, uAmber * .45, step(.5, fract(seed * 3.7))), lich * .5 * (1. - step_ * .6));
  // the ancient ring: furred rose with lichen away from the sun, ochre toward it
  // (bare pale horn where the sun reaches, deep creases between its annuli; lichen only in the lee and underneath)
  float tf = fract(ang * uThick.y + seed * 7.);
  float crease = old * (1. - smoothstep(0., .09, tf) * (1. - smoothstep(.94, 1., tf)));
  float lee = smoothstep(.3, -.2, vT.w * .8 + dot(nrm(vN), uSunDir) * .5);      // the half of the ring that stands away from the sun, and every underside
  float fur = old * lee * (.6 + .4 * smoothstep(.3, .6, fbm(vec2(arc * .8 + 3., pc * 3. + vW.y * .3))));
  horn = mix(horn, horn * 1.22, old * (1. - fur));
  horn = mix(horn, mix(uRose * .95, uAmber * .6, .3 * vnoise(vec2(arc * 2., pc * 5.))), fur * .9);
  horn *= (1. - .25 * old * (1. - step_)) * (1. - .55 * crease);
  // keel worn chalk white where it runs
  float keel = smoothstep(mix(.72, .86, smoothstep(7., 18., R)), .96, pc) * (1. - vK.z) * (1. - .7 * old);
  horn = mix(horn, vec3(.84, .83, .8), keel * .9);
  // the ballast window on the inner flank: amber glass, with the plum bead riding ahead of the contact
  float inner = smoothstep(-.62, -.86, pc) * (1. - vK.z) * (1. - old);
  float da = mod(ang - vS.z + PI * .5 - .35 + PI, 2. * PI) - PI;
  float bead = 1. - smoothstep(.2, .27, abs(da));
  vec3 glass = mix(uAmber * .75, uPlum * .45, bead);
  horn = mix(horn, glass, inner * .85);
  N = nrm(N + vT.xyz * old * (.22 - 1.3 * (1. - smoothstep(0., .18, tf))) + vec3(0., 1e-4, 0.));       // the step faces of the annuli
  float nl = dot(N, uSunDir);
  // (old horn passes a little light: the sun wraps further round the ancient ring, and the pan lights its lee from below)
  float wrap = max(nl * mix(.85, .55, old) + mix(.15, .45, old), 0.) * mix(1., smoothstep(-.5, .35, vT.w), old);
  vec3 lit = uSunCol * vSunT * wrap + uSkyCol * (.6 + .4 * N.y + .5 * old) + uSalt * uSunCol * (.1 * max(-N.y, 0.) + old * .2 * (.6 - .4 * N.y));
  vec3 col = horn * lit;
  vec3 H = nrm(uSunDir + V);
  float nh = max(dot(N, H), 0.); float s2 = nh * nh; float s8 = s2 * s2 * s2 * s2; float s32 = s8 * s8 * s8 * s8;
  col += uSunCol * vSunT * step(0., nl) * (s32 * s32 * (.5 * keel + 1.2 * inner) + s8 * .05);
  // rim light against the sky so edge-on hoops never vanish
  float fr = 1. - max(dot(N, V), 0.);
  col += uSkyCol * .35 * fr * fr * fr;
  // horn seen THROUGH the Wheel's glass takes the tint of the band it is seen through and sinks into it: a soft ring in the
  // glass's own colour, never a pale cut-out standing on the membrane
  vec4 bw = behindWheel(vW);
  col = mix(col, bw.rgb * bw.rgb * dot(col, vec3(.3, .5, .2)) * .7, bw.a * .88);
  float f = hazeAmt(dist);
  col = mix(col, hazeCol(-V), f);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- membranes (drawn twice: multiply, then add) and shadows
const MEM_GLSL = /* glsl */`
uniform vec4 uMem;        // pane density, glow, moth holes 0..1, drum amplitude
uniform float uBody;      // how much of the view behind a pane its own colour hides
const float E0 = .285, E1 = .972;
// trunk veins rooted in the rim that fork twice on the way to the eye. p: unit disc, turning with the hoop
float veinMaskW(vec2 p, float r, float seed, float aa, float wk){
  float nV = 9. + floor(fract(seed * 5.31) * 5.);
  float e = clamp((r - E0) / (E1 - E0), 0., 1.);
  float a = atan(p.y, p.x + step(r, 1e-4));
  float t = a / (2. * PI) * nV + seed;
  float id = floor(t);
  float al = fract(t) - .5 + .035 * sin(e * 9. + id * 2.4) * (1. - e);
  float x = abs(al) - .25 * smoothstep(.74, .44, e);
  x = abs(x) - .125 * smoothstep(.42, .14, e);
  float d = abs(x) * (2. * PI / nV) * r;
  float w = mix(.006, .016, e) * wk;
  return 1. - smoothstep(w - aa, w + aa, d);
}
// wk: vein width (1 on the pane itself; its shadow draws them wider, as leading), vk: how dark a vein is
vec3 paneT2(vec2 p, float r, vec3 tint, float seed, float aa, float wk, float vk, out float vein){
  float e = clamp((r - E0) / (E1 - E0), 0., 1.);
  vein = veinMaskW(p, r, seed, aa, wk);
  float calm = clamp(1. - aa * 40., 0., 1.);
  float rip = .5 + .5 * sin(r * 70. + 4. * vnoise(p * 3. + seed));
  float blot = vnoise(p * 2.3 + seed * 13.);
  vec3 tn = mix(tint, vec3(1.), .3 * smoothstep(.55, 0., e));
  float thick = uMem.x * (.72 + .12 * rip * calm + .3 * blot) + .9 * smoothstep(.03, 0., e) + .9 * smoothstep(.97, 1., e);
  vec3 T = pow(max(tn, vec3(.02)), vec3(thick)) * (1. - vk * vein);
  float hole = uMem.z * smoothstep(.69, .73, vnoise(p * 6.5 + seed * 40.)) * (1. - vein);
  return mix(T, vec3(1.), hole);
}
vec3 paneT(vec2 p, float r, vec3 tint, float seed, float aa, out float vein){ return paneT2(p, r, tint, seed, aa, 1., .78, vein); }
`;
const MEM_VERT = /* glsl */`
varying vec3 vW, vN, vSunT; varying vec2 vP; varying vec4 vI; varying vec2 vS; varying vec3 vCtr;
${G_COMMON}
${HOOP_PARS}
${MEM_GLSL}
void main(){
  float R = iA.w;
  vec2 p = position.xy;
  float r = length(p);
  float e = clamp((r - E0) / (E1 - E0), 0., 1.);
  float a = atan(p.y, p.x + step(r, 1e-4));
  // drum mode: the membrane booms in gusts (2 % of the radius)
  float ph = uTime * (5.5 - R * .08) + iB.w * 40.;
  float h = uMem.w * .02 * sin(PI * e) * (sin(ph) * .7 + .5 * sin(ph * 1.63 + a * 2.));
  float hr = uMem.w * .02 * PI * cos(PI * e) / (E1 - E0) * (sin(ph) * .7 + .5 * sin(ph * 1.63 + a * 2.));
  vec3 w = hoopXf(vec3(p * R, h * R));
  vec2 rd = p / max(r, 1e-4);
  vec3 nl = vec3(hoopSpin(-rd * hr * 2.5), 1.);
  vN = hoopRot(nl);
  vP = p; vW = w;
  vI = iC; vS = vec2(iB.w, R);
  vSunT = sunThrough(vec3(iA.x, iB.z + R, iA.y));
  vCtr = hoopXf(vec3(0.));
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  if (iC.w <= 0.) gl_Position = vec4(2., 2., 2., 1.);
}`;
const DEPTH_VERT = /* glsl */`
varying vec2 vP;
${G_COMMON}
${HOOP_PARS}
uniform vec4 uWall;
void main(){
  vP = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(hoopXf(vec3(position.xy * iA.w, 0.)), 1.);
  if (iC.w < .5 || uWall.w <= 0.) gl_Position = vec4(2., 2., 2., 1.);
}`;
const DEPTH_FRAG = /* glsl */`
varying vec2 vP;
void main(){
  float r = length(vP);
  if (r < .285 || r > .985) discard;
  gl_FragColor = vec4(0.);
}`;
const MEM_FRAG = /* glsl */`
varying vec3 vW, vN, vSunT; varying vec2 vP; varying vec4 vI; varying vec2 vS; varying vec3 vCtr;
uniform vec3 uHorn;
uniform vec4 uWheelA; uniform vec3 uWheelNA; uniform mat3 uWTintA; uniform vec2 uWBand;
${G_COMMON}
${MEM_GLSL}
${BEHIND_GLSL}
void main(){
  float r = length(vP);
  float aa = max(fwidth(r), 1e-4);
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  float f = hazeAmt(dist);
  float opq = 0.;                       // horn drawn analytically: hub ring (mid, far) and rim (far)
#ifdef FLAT
  if (r < .262 - aa || r > 1.) discard;
  opq = smoothstep(.262 - aa, .262 + aa, r) * (1. - smoothstep(.292 - aa, .292 + aa, r));
#ifdef FARRIM
  float rw = mix(max(.035, aa * 2.2), min(max(.05, aa * 1.7), .13), step(vS.x, 0.));      // the fallen (seed < 0): a broad pale rim
  opq = max(opq, smoothstep(1. - rw - aa, 1. - rw + aa, r) * mix(1., mix(1., .35, smoothstep(.07, .28, aa)), step(vS.x, 0.)));      // (far off a fallen pane is a rose lozenge with a thin pale edge, never a bare outline)
#else
  if (r > .975) discard;
#endif
#endif
  float vein;
  vec3 T = paneT(vP, r, vI.rgb, vS.x, aa, vein);
  T *= mix(mix(vec3(1.), vI.rgb, .4), vec3(1.), step(.995, min(T.r, min(T.g, T.b))));      // pale toward the eye, never white: only a moth hole is clear
  T = mix(T, vec3(0.), opq);
  float fade = clamp(vI.w, 0., 1.);
  // the pane has body: a third of what lies behind it is hidden by its own milky colour, so a herd seen through
  // itself reads as panes of glass one before another, not as a tangle of outlines
  vec3 N = nrm(vN + vec3(0., 0., 1e-4));
  float nv = dot(N, V);
  if (nv < 0.) { N = -N; nv = -nv; }
  float nl = dot(N, uSunDir);
  // (seen from its sunlit side a pane hides more of what is behind it: rose glass in the sun, not a ghost of the horizon)
  // (and it is deeper in its own colour there, to its centre: stained glass seen from the lit side, never a bleached disc)
  T = mix(T, T * mix(vec3(1.), vI.rgb * vI.rgb, .8), smoothstep(-.05, .25, nl) * step(0., vS.x) * (1. - opq));
  float bodyK = uBody * (1. + .4 * smoothstep(0., .3, nl)) * (1. - opq) * step(0., vS.x) * (1. - smoothstep(.86, .99, min(T.r, min(T.g, T.b))));
  vec3 Tb = T * (1. - bodyK);
#ifdef PASS_MULTIPLY
  T = mix(Tb, vec3(1.), f);       // far off a pane sinks into the haze: it never stands as a pale disc of haze before the plum band
  T = mix(T, vec3(1.), behindWheel(vW).a * .6);      // beyond the Wheel's glass it is a soft stain in the Wheel's own colour
  gl_FragColor = vec4(mix(vec3(1.), T, fade), 1.);
#else
  vec3 sun = uSunCol * vSunT;
  float tm = max(T.r, max(T.g, T.b));
  vec3 Tn = T * T / max(tm, .05);
  float milk = 1. - .6 * tm;
  // with the sun: milky sheen; against it: held-up sea glass
  vec3 lit = mix(vec3(.8), vI.rgb, .6) * milk * (sun * max(nl, 0.) * .06 + uSkyCol * .14);
  vec3 H = nrm(uSunDir + V);
  float nh = max(dot(N, H), 0.); float s4 = nh * nh; s4 *= s4; float s16 = s4 * s4; s16 *= s16;
  lit += sun * mix(vec3(1.), vI.rgb, .8) * step(0., nl) * s16 * s16 * s16 * s16 * .13 * (1. - vein);
  float eB = clamp((r - E0) / (E1 - E0), 0., 1.); float fr0 = (1. - nv) * (1. - nv) * (1. - nv);        // (paler toward the eye, deeper at the rim, the veins dark in it: glass, not card)
  // (the passes are order-independent, so the body light of every pane along a ray adds up: it is kept deep in the pane's own
  // colour and modest in the sun, so a file of sunlit panes seen end on stays rose, amber or green and never bleaches to white)
  lit += bodyK * mix(vI.rgb * vI.rgb, Tn, .5) * (sun * (max(nl, 0.) * .13 + .03) + uSkyCol * .66) * (1.16 - .4 * eB) * (1. - .6 * vein);
  // the fallen: wet glass that holds the sky, deep at the rim and pale toward the eye, with stretch ripples; the rim
  // stands proud of it, so its sunward side lays a crescent of shade on the glass and its far side catches the sun
  vec2 rdw = vW.xz - vCtr.xz; rdw /= max(length(rdw), 1e-3);
  vec2 sxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float sunSide = dot(rdw, sxz), fallen = step(vS.x, 0.);
  float rwF = max(.05, aa * 1.7);
  float cres = fallen * smoothstep(1. - rwF - .15, 1. - rwF - .01, r) * smoothstep(-.1, .7, sunSide);
  float hemSh = fallen * (1. - smoothstep(.3, .4, r)) * smoothstep(-.1, .7, -sunSide);      // and the hub ring's shade, on the far side of the eye
  lit += fallen * vI.rgb * vI.rgb * (uSkyCol * .5 + sun * .04) * (1. - .6 * vein) * (1.45 - .75 * sqrt(eB)) * (.93 + .07 * sin(r * 70.)) * (1. - .55 * cres) * (1. - .4 * hemSh);
  lit += fallen * uSkyCol * .5 * fr0 * (1. - cres);      // the sky's sheen at a glancing angle
  float back = max(-nl, 0.);
  float fwd = max(dot(-V, uSunDir), 0.); float f2 = fwd * fwd; float f8 = f2 * f2 * f2 * f2;
  lit += Tn * sun * uMem.y * (sqrt(back) * .42 * step(nl, 0.) + f8 * .3) * (1. - .7 * f);
  float fr = 1. - nv; fr *= fr;
#ifdef FARRIM
  lit *= mix(vec3(1.), vI.rgb * 1.25, .7) * mix(mix(.16, .8, step(vS.x, 0.)), 1., smoothstep(.04, .4, nv));   // far slivers keep the hoop's own tint, and a hundred of them in line do not add up to white
  lit += uSkyCol * vI.rgb * .12 * fr * milk;
#else
  lit += uSkyCol * .25 * fr * milk;
#endif
#ifdef FLAT
  lit *= mix(1., mix(.5, .85, step(vS.x, 0.)), smoothstep(110., 480., dist));      // far panes are lanterns in their own tint, never froth: their light thins with distance
#endif
  vec3 horn = uHorn * .5 * (sun * (abs(nl) * .12 + .03) + uSkyCol * .75);
#ifdef FARRIM
  horn = mix(horn, vI.rgb * vI.rgb * (uSkyCol * .8 + sun * .09), .88);      // edge-on in the distance a hoop reads as its own colour
#endif
  horn = mix(horn, uHorn * .6 * (sun * (.22 + .4 * abs(nl)) * (1. - .7 * sunSide) + uSkyCol * (.9 - .25 * sunSide)), step(vS.x, 0.));     // the fallen lie in the sun: ivory rings, lit on the flank that faces it
  lit = mix(lit, horn, opq);
  vec3 o = lit * (1. - f);
  vec4 bw = behindWheel(vW);
  o *= 1.12 * mix(vec3(1.), bw.rgb * bw.rgb * .3, bw.a);
  gl_FragColor = vec4(o * fade, 1.);
#endif
}`;
// shadow: the same disc, each corner slid down the sun ray onto the salt; T multiplies the frame
const SHADOW_VERT = /* glsl */`
varying vec2 vP; varying vec4 vI; varying vec3 vS; varying vec3 vW; varying vec2 vQ;
${G_COMMON}
${HOOP_PARS}
void main(){
  vQ = hoopSpin(position.xy);      // the disc as it stands: (0, -1) is its foot on the salt
  vec3 w = hoopXf(vec3(position.xy * iA.w, 0.));
  float hgt = max(w.y, 0.);
  w -= uSunDir * ((w.y - .06) / max(uSunDir.y, .03));
  vP = position.xy; vI = iC; vS = vec3(iB.w, hgt / max(iA.w, .1), iA.w); vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  if (iC.w <= 0.) gl_Position = vec4(2., 2., 2., 1.);
}`;
const SHADOW_FRAG = /* glsl */`
varying vec2 vP; varying vec4 vI; varying vec3 vS; varying vec3 vW; varying vec2 vQ;
uniform vec3 uFloor;
uniform float uShadowK;
${G_COMMON}
${MEM_GLSL}
void main(){
  float r = length(vP);
  float bare = step(1.5, vI.w);               // the standing ring and the tipped rims: no membrane left
  float fwr = max(fwidth(r), 1e-4);
  float soft = min(.012 * vS.y + .008, .034);     // the penumbra: crisp at the foot, soft at the far end
  float aa = min(fwr + soft, mix(10., .1, bare));      // (the bare ring's shadow keeps its edges at a grazing angle)
  if (r > 1.24 + aa) discard;
  // The shadow is the window it was thrown by. Its veins are drawn as leading: wide enough to outlast the penumbra
  // (wider toward the far end), blurred no further than they are wide, and let go only where the whole shadow has
  // thinned to a few pixels; the rim and the hem of the eye are dark lines round it, the eye a hole of bare sunlit salt.
  float aaV = min(fwr * .8 + soft * .35, .02);
  float vein;
  vec3 T = paneT2(vP, r, vI.rgb, vS.x, aaV, 1.5 + 40. * soft, .86 * (1. - smoothstep(.06, .22, fwr)), vein);
  vec3 Tt = vec3(1.);
  float keep = max(bare, step(vS.x, 0.) * .8);       // the shadows of the resting ground stay drawn from the air
  float aaR = min(aa, .016 + fwr);
  vec3 lead = vec3(0.);                         // the rim and the hem are horn: they pass nothing, and cast plain lilac
  Tt = mix(Tt, lead, smoothstep(.25 - aaR, .25 + aaR, r) * (1. - bare));
  Tt = mix(Tt, mix(T, vec3(1.), bare), smoothstep(.3 - aaR, .3 + aaR, r));
  float ri = mix(.94, .76, bare), ro = mix(1., 1.2, bare);
  Tt = mix(Tt, lead, smoothstep(ri - aaR, ri + aaR, r));
  Tt = mix(Tt, vec3(1.), smoothstep(ro - aa, ro + aa, r));
  // where the hoop stands on the salt its shadow begins: a small dark foot under the contact (plain lilac, the rim's own)
  float foot = exp(-(vQ.x * vQ.x * 60. + (vQ.y + 1.) * (vQ.y + 1.) * 9.)) * (1. - bare) * step(0., vS.x) * step(vS.y, .6);
  Tt = mix(Tt, vec3(0.), .85 * foot);
  // at a very low sun the light has come a long way through the salt in the air: a shadow keeps its depth for its first
  // two hoop widths and then fills, so the pan between the files stays light and the braid is of tints, not of darks
  float slide = vS.y * sqrt(max(1. - uSunDir.y * uSunDir.y, 0.)) / max(uSunDir.y, .03);      // radii from the source point to here
  Tt = mix(Tt, vec3(1.), .7 * (1. - exp(-slide / 6.)) * smoothstep(.3, .1, uSunDir.y) * (1. - bare));
  float dist = length(cameraPosition - vW);
  // a shadow whose footprint has thinned to a stripe on screen (seen at a grazing angle, or far off) loses contrast:
  // there they lie as a wash of tinted light, not as hard streaks
  float k = (1. - hazeAmt(dist)) * uShadowK * clamp(vI.w, 0., 1.) * (1. - .6 * smoothstep(.06, .32, fwr) * (1. - keep));
  // T goes into the shadow target (cleared to white, multiplied): the pan is then lit ONCE with sun * T + sky fill, so
  // piles of any depth floor at lilac-plum and two windows that cross mix to a third colour
  gl_FragColor = vec4(mix(vec3(1.), Tt, k), 1.);
}`;

// ---------------------------------------------------------------- geometry helpers
const RIM_PROFILE = [[1.4, 0], [0.75, 0.42], [0, 0.62], [-0.7, 0.5], [-1, 0.18], [-1, -0.18], [-0.7, -0.5], [0, -0.62], [0.75, -0.42]];
const RIM_LOW = [[1.4, 0], [-1, 0.62], [-1, -0.62]];
const HUB_PROFILE = [[-1.3, 0], [0, 0.6], [1, 0], [0, -0.6]];
// rings of horn: position = centre line (unit radius), aOff = profile offset in tube radii, kind, profile coord
function hornGeometry(parts) {
  const pos = [], off = [], nrm = [], idx = []; let n = 0;
  for (const { segs, prof, rad, kind } of parts) {
    const P = prof.length, base = n;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      for (let j = 0; j <= P; j++) {
        const p = prof[j % P], pa = prof[(j + P - 1) % P], pb = prof[(j + 1) % P];
        let nx = pb[1] - pa[1], nz = -(pb[0] - pa[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        pos.push(ca * rad, sa * rad, 0);
        off.push(p[0], p[1], kind, kind ? 0 : p[0] / 1.4);
        nrm.push(nx, nz, a);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < P; j++) {
      const a = base + i * (P + 1) + j, b = a + P + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    n += (segs + 1) * (P + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 4));
  g.setAttribute('aNrm', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}
function annulusGeometry(segs, rings, r0, r1) {
  const pos = [], idx = [];
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU, r = mix(r0, r1, j / rings);
    pos.push(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
    const a = j * (segs + 1) + i, b = a + segs + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function quadGeometry(h) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-h, -h, 0, h, -h, 0, h, h, 0, -h, h, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
// a pool of hoop instances: three shared attributes written on the CPU every frame
function makePool(cap) {
  const a = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
  const b = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
  const c = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
  for (const x of [a, b, c]) x.setUsage(THREE.DynamicDrawUsage);
  const pool = {
    cap, n: 0, a, b, c, geos: [],
    attach(g) { g.setAttribute('iA', a); g.setAttribute('iB', b); g.setAttribute('iC', c); g.instanceCount = 0; pool.geos.push(g); return g; },
    push(x, z, heading, R, roll, lean, hop, seed, tr, tg, tb, fade) {
      if (pool.n >= cap) return false;
      const i = pool.n++ * 4, A = a.array, B = b.array, C = c.array;
      A[i] = x; A[i + 1] = z; A[i + 2] = heading; A[i + 3] = R;
      B[i] = roll; B[i + 1] = lean; B[i + 2] = hop; B[i + 3] = seed;
      C[i] = tr; C[i + 1] = tg; C[i + 2] = tb; C[i + 3] = fade;
      return true;
    },
    flush() {
      for (const x of [a, b, c]) { x.clearUpdateRanges(); x.addUpdateRange(0, Math.max(pool.n, 1) * 4); x.needsUpdate = true; }
      for (const g of pool.geos) g.instanceCount = pool.n;
    },
  };
  return pool;
}
// monotone cubic through (xs, ys): the Wheel's travel as a function of path distance
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(xs[i + 1] - xs[i], 1e-6));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------------------------------------------------------------- looks
const LIN = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const HOURS = {
  golden: { el: 16, sun: LIN('#FFEFD8', 3.0), sky: LIN('#B9B3E6', 0.36), zenith: '#7C78D2', horizon: '#D6BFD0', plum: '#54458A', fogA: '#8478B8', fogB: '#DDA98E', cirrus: '#F6E4DC', disc: 9, glow: 0.5, stars: 0, exposure: 1.0, fogK: 0.00088 },
  dawn: { el: 7, sun: LIN('#FFCBA2', 6.4), sky: LIN('#B7A9DE', 0.34), zenith: '#8E8FD0', horizon: '#F0C3B0', plum: '#62508E', fogA: '#B8A6CE', fogB: '#FFC49A', cirrus: '#FFCDB4', disc: 9, glow: 0.65, stars: 0, exposure: 1.0, fogK: 0.00105 },
  high: { el: 48, sun: LIN('#FFF6E6', 1.3), sky: LIN('#AEB4EE', 0.36), zenith: '#7C84DA', horizon: '#CFCBE6', plum: '#6657A0', fogA: '#B3B1DE', fogB: '#D8C4B4', cirrus: '#FFFFFF', disc: 10, glow: 0.4, stars: 0, exposure: 0.96, fogK: 0.00075 },
  night: { el: 31, sun: LIN('#D6DEFF', 0.95), sky: LIN('#6670C0', 0.26), zenith: '#10143A', horizon: '#39407C', plum: '#171338', fogA: '#2A2E62', fogB: '#4A548E', cirrus: '#7F8AC8', disc: 5, glow: 0.3, stars: 1, exposure: 1.25, fogK: 0.0008 },
};
// membrane tints as transmittance (the swatch read as plain numbers), rim horn colour, extra
const HERDS = {
  glass: { name: 'Hoopwind', tints: [[0.96, 0.58, 0.67], [0.97, 0.74, 0.36], [0.40, 0.82, 0.74]], horn: '#E8DCC0', amber: '#F5B24A', holes: 0, wheel: ['#C9C0AE', '#B9B3E6', '#F28FA6', '#F5B24A', '#58C7B0', '#E8DCC0', '#5B4C8C'] },
  cobalt: { name: 'Hoopwind, Blue Herd', tints: [[0.36, 0.52, 0.97], [0.70, 0.50, 0.95], [0.84, 0.95, 0.62]], horn: '#E2C47A', amber: '#F0B63C', holes: 0, wheel: ['#C9C0AE', '#B9B3E6', '#B78CF2', '#D9EE9A', '#5C86F5', '#E2C47A', '#3B2F7C'] },
  autumn: { name: 'Hoopwind in Autumn', tints: [[0.96, 0.78, 0.38], [0.86, 0.46, 0.30], [0.66, 0.64, 0.70]], horn: '#D9C9A8', amber: '#E09A3A', holes: 1, wheel: ['#C9C0AE', '#B9B3E6', '#D9744C', '#F2C45A', '#A9A3B4', '#D9C9A8', '#5B3F4C'] },
};

export default {
  id: 'hoopwind-flats',
  name: 'Hoopwind',
  category: 'alien',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, Q = ctx.quality || { detail: 1 };
    const DUR = 50;      // seconds of flight
    const detail = Math.min(1, Math.max(0.5, Q.detail ?? 1));
    const scene = new THREE.Scene();

    // ---- which visit is this
    const vr = rng.fork ? rng.fork('look') : rng;
    let hourKey = { dawn: 'dawn', day: 'high', golden: 'golden', night: 'night' }[vary.hour];
    if (!hourKey) { const r = vr(); hourKey = r < 0.46 ? 'golden' : r < 0.66 ? 'dawn' : r < 0.86 ? 'high' : 'night'; } else vr();
    const rare = !!vary.rare;
    const wr = vr(), weather = rare || wr < 0.5 ? 'clear' : wr < 0.76 ? 'gale' : 'rain';   // the rare visit keeps clean light
    const hr = vr(), herdKey = hr < 0.5 ? 'glass' : hr < 0.76 ? 'cobalt' : 'autumn';
    const spring = vr() < 0.3;
    const HOUR = HOURS[hourKey], HERD = HERDS[herdKey];
    const gale = weather === 'gale' ? 1 : 0, wet = weather === 'rain' ? 1 : 0;

    // ---- light: the sun stands to starboard (-Z), a little ahead of abeam after the carve
    const el = HOUR.el * DEG;
    const sunDir = new THREE.Vector3(0.182 * Math.cos(el), Math.sin(el), -0.983 * Math.cos(el)).normalize();
    const sunCol = HOUR.sun.clone(), skyCol = HOUR.sky.clone();
    const floorCol = new THREE.Vector3(
      skyCol.r / (sunCol.r * sunDir.y + skyCol.r), skyCol.g / (sunCol.g * sunDir.y + skyCol.g), skyCol.b / (sunCol.b * sunDir.y + skyCol.b));
    const fogA = LIN(HOUR.fogA), fogB = LIN(HOUR.fogB);
    const U = {      // uniforms shared by every material of this world
      uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol },
      uFogA: { value: fogA }, uFogB: { value: fogB }, uFogK: { value: HOUR.fogK * (1 + 0.35 * gale) }, uTime: { value: 0 },
      uPix: { value: 0.002 },
      uWheelA: { value: new THREE.Vector4(0, 110, 0, 1) }, uWheelB: { value: new THREE.Vector4(0, 110, 0, 0) },
      uWheelNA: { value: new THREE.Vector3(0, 0, 1) }, uWheelNB: { value: new THREE.Vector3(0, 0, 1) },
      uWTintA: { value: new THREE.Matrix3() }, uWTintB: { value: new THREE.Matrix3() }, uWBand: { value: new THREE.Vector2(52, 76) },
      uMem: { value: new THREE.Vector4(1.9, 0.36, HERD.holes, 1 + gale) },
      uHorn: { value: LIN(HERD.horn) }, uAmber: { value: LIN(HERD.amber) }, uPlum: { value: LIN('#5B4C8C') }, uRose: { value: LIN('#F28FA6') },
      uSalt: { value: LIN('#C6B596') }, uThick: { value: new THREE.Vector2(1, 0) }, uFloor: { value: floorCol }, uShadowK: { value: 1 }, uBody: { value: 0.52 }, uGust: { value: 0 }, uFrontA: { value: new THREE.Vector4(-1, 0, -1e5, 0) },
    };
    const fogK0 = U.uFogK.value;
    scene.fog = new THREE.FogExp2(fogA.clone().lerp(fogB, 0.3), U.uFogK.value);   // for the Wheel's own materials

    // ---- sky
    const skyU = {
      ...U, uZenith: { value: LIN(HOUR.zenith) }, uHorizon: { value: LIN(HOUR.horizon) }, uPlum: { value: LIN(HOUR.plum) },
      uCirrus: { value: LIN(HOUR.cirrus) }, uDiscCol: { value: sunCol.clone().multiplyScalar(1 / Math.max(sunCol.r, sunCol.g, sunCol.b)) },
      uPlumDir: { value: new THREE.Vector2(-0.94, -0.34) }, uWind: { value: new THREE.Vector2(-0.94, -0.34) },
      uDisc: { value: new THREE.Vector4(Math.cos((hourKey === 'night' ? 1.5 : 0.75) * DEG), HOUR.disc, HOUR.glow, HOUR.stars) },
    };
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: true }));
    sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
    await ctx.yield();

    // ---- the pan
    const groundU = {
      ...U, uZenith: skyU.uZenith, uHorizon: skyU.uHorizon, uPlumCol: skyU.uPlum, uBrine: { value: new THREE.Vector3(0.62, 0.5, 0.52) },
      uGale: { value: new THREE.Vector4(0.5 + 0.5 * gale, wet, -1e5, 0) }, uBankK: { value: 1 }, uRest: { value: new THREE.Vector4(0, 0, 1, 0) }, uWindDir: { value: new THREE.Vector2(-1, 0) },
      uRing: { value: new THREE.Vector4(0, 0, -1, 0) }, uRoadPh: { value: 0 }, uPortalCol: { value: new THREE.Color(hourKey === 'night' ? '#bfe6ff' : '#a8f5dc').multiplyScalar(hourKey === 'night' ? 0.5 : 1) },      // by moonlight nothing glows: the ring's light is kept low
    };
    // The shadow target (the design's): every shadow quad (the herd's, the ring's, the Wheel's) is multiplied into it
    // from the main camera, and the pan reads it by screen position. The quads live on layer 1, which the journey's
    // camera does not draw; the pan draws them into the target itself just before it is drawn (as a mirror would).
    const shadowRT = new THREE.WebGLRenderTarget(960, 540, { depthBuffer: false, stencilBuffer: false, type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    groundU.tShadow = { value: shadowRT.texture };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: groundU, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG }));
    ground.frustumCulled = false; scene.add(ground);
    const clearKeep = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1);
    let inShadowPass = false;
    ground.onBeforeRender = (renderer, scn, camera) => {
      if (inShadowPass) return;
      inShadowPass = true;
      const rt = renderer.getRenderTarget(), mask = camera.layers.mask, auto = renderer.autoClear, a0 = renderer.getClearAlpha();
      renderer.getClearColor(clearKeep);
      camera.layers.mask = 2;                               // layer 1: the shadow quads and nothing else
      renderer.setRenderTarget(shadowRT); renderer.setClearColor(WHITE, 1); renderer.autoClear = false; renderer.clear(true, false, false);
      try { renderer.render(scn, camera); } finally {
        camera.layers.mask = mask; renderer.autoClear = auto; renderer.setClearColor(clearKeep, a0); renderer.setRenderTarget(rt);
        if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
        inShadowPass = false;
      }
    };
    await ctx.yield();

    // ---- the Grand Wheel (and, on a rare visit, its violet twin on the sun side)
    // the Wheel takes the sun a little under the pan's, so its chalk keel and hub ring keep their colour at 14 m
    const lightForHero = { sunDir, sunColor: sunCol.clone().multiplyScalar(0.6), skyColor: skyCol, groundColor: LIN('#C9C0AE', 0.3).multiply(sunCol).multiplyScalar(0.5) };
    const hero = await buildHero(ctx, { palette: HERD.wheel, detail, density: 2.3, glow: 0.58, drum: 1 + 0.6 * gale, shadowTarget: true });
    if (hero.shadowMesh) hero.shadowMesh.layers.set(1);
    hero.setLight(lightForHero);
    scene.add(hero.object);
    await ctx.yield();
    let twin = null;
    const TWIN_S = 190 / 220, TWIN_Z = -80;      // near enough that our line out of the first eye is still high when it meets the second
    if (rare) {
      twin = await buildHero(ctx, { palette: ['#C9C0AE', '#B9B3E6', '#B58CF0', '#8F7BE8', '#F2A8D8', '#E8DCC0', '#4B3C8C'], detail: Math.min(detail, 0.8), density: 2.0, glow: 0.3, pickers: 120, terrace: 2.8, shadowTarget: true });
      if (twin.shadowMesh) twin.shadowMesh.layers.set(1);
      twin.setLight(lightForHero);
      twin.object.scale.setScalar(TWIN_S);
      scene.add(twin.object);
      await ctx.yield();
    }
    const setTint = (m3, bands) => { const t = bands.tints; m3.set(t.green.x, t.amber.x, t.rose.x, t.green.y, t.amber.y, t.rose.y, t.green.z, t.amber.z, t.rose.z); };
    setTint(U.uWTintA.value, hero.anchors.bands);
    U.uWBand.value.set(hero.anchors.bands.greenToAmber, hero.anchors.bands.amberToRose);
    if (twin) setTint(U.uWTintB.value, twin.anchors.bands);

    // ---- the path. D to G are authored in the Wheel's own frame (x = metres behind its contact) and laid into
    // the world while the Wheel rolls on by rho metres per metre of flight, so the meeting is exact at any speed.
    const LEAN = 7 * DEG, tl = Math.tan(LEAN), cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    const P = (x, y, off) => [x, y - off * sl, y * tl + off * cl];       // off metres to port of the leaning disc
    // The Wheel never brakes: it rolls at ONE ground speed for the whole flight (about 20 m/s, a turn in 35 s). rho is
    // the Wheel's travel per metre of our flight on the leg that arrives at a point, so it also sets OUR speed there
    // (v = vWheel / rho: see pace below); all the closing is done by the camera's path and pace.
    const REL = [   // [rel point (x behind the contact, y, z to port), rho of the leg that arrives here]
      [[230, 54, 330], 0.43],                    // D: far out and behind, the whole backlit face ahead
      [[160, 47, 262], 0.43],                    //    the approach from aft: the whole Wheel with sky round it
      [[98, 41, 244], 0.43],                     //    backlit, at the edge of its shadow
      [[100, 27, 150], 0.45],                     //    down across the bands of its shadow: green, amber, rose
      [[78, 11.5, 52], 0.47],
      [[62, 8.5, 22], 0.5],                      // E: the turn at the foot
      [[34, 8.4, 14.6], 0.55],                     //    along the lower rim, 13 m off it: the contact ahead, its salt fan blowing back past us
      [[19, 8.6, 13.8], 0.55],                   //    (held at 8 m: no dip before the climb)
      [[6, 9.4, 13.6], 0.55],                      //    level with the contact, the bead in its window ahead to starboard
      // F: we climb out wide to port while the Wheel rolls on (the whole eye comes into view from 100 m)
      [[12, 25, 25], 0.58], [[28, 59, 50], 0.58], [[43, 92, 78], 0.58], [[54, 107, 96], 0.58], [[62, 120, 124], 0.56], [[66, 130, 136.4], 0.5],
      // G: swing right at the top and come down at the eye on a straight run (the window, the standing ring's light in it)
      [[51, 123, 105.4], 0.44], [[36, 116, 74.4], 0.42], [[21, 109, 43.4], 0.42], [[6, 102, 12.4], 0.42], [[-6, 96, -12], 0.42],
    ];
    const N_BEAD = 8, N_EYE = REL.length - 1, N_TURN = 14;
    const STRAIGHT = 190;                        // the design's last straight to the ring, dead level
    const FOOT = 6;                              // world origin = the Wheel's contact when the camera is at REL[FOOT]
    const relW = []; let xw = 0;
    for (let i = 0; i < REL.length; i++) {
      if (i > 0) {
        const a = REL[i - 1][0], b = REL[i][0], rho = REL[i][1];
        const fa = a[0] - b[0], lat2 = (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2;
        // D^2 = (rho D + fa)^2 + lat2
        const A = 1 - rho * rho, B = -2 * rho * fa, C = -(fa * fa + lat2);
        const D = (-B + Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A);
        xw -= rho * D;
      }
      relW.push(xw);
    }
    const xw0 = relW[FOOT], RHO_A = 0.45;
    const pts = [], wheelAt = [];                // wheelAt[i] = Wheel x when the camera is at pts[i]
    const E0 = new THREE.Vector3(-Math.cos(30 * DEG), 0, -Math.sin(30 * DEG));    // upstream heading: 30 deg right of -X
    const d0 = new THREE.Vector3(REL[0][0][0] + relW[0] - xw0, REL[0][0][1], REL[0][0][2]);
    // A to C: [metres before D, height, shift to port]. The Wheel is rolling from the first frame, and the
    // entry is aimed a few degrees to starboard, so the Wheel stands right of the bow as we come in (the design: 12 degrees).
    for (const [back, y, port] of [[637.5, 6, -16], [572.5, 6, -43], [487.5, 6, -69], [397.5, 7, -82], [327.5, 7.5, -78], [247.5, 11, -68], [168, 43, -52], [92, 62, -30], [36, 60, -10]]) {
      pts.push(new THREE.Vector3(d0.x - E0.x * back - 0.5 * port, y, d0.z - E0.z * back + 0.866 * port)); wheelAt.push(relW[0] - xw0 + RHO_A * back * 1.035);
    }
    for (let i = 0; i < REL.length; i++) { const r = REL[i][0]; pts.push(new THREE.Vector3(r[0] + relW[i] - xw0, r[1], r[2])); wheelAt.push(relW[i] - xw0); }
    // H, I: out of the eye into the sun, a long descent easing left, then dead straight to the standing ring
    {
      const p = pts[pts.length - 1].clone(); let wx = wheelAt[wheelAt.length - 1];
      // (steeper at first, so that we are soon low among the elders ringing down and they stand as tall as we fly;
      // the last straight is level at 12.5 m, the centre of the standing ring)
      // The heading eases by no more than 3 degrees a leg (the old S-bend banked the horizon 8 degrees over an empty pan),
      // and we hold our height for the first 78 m so that on a rare visit we leave through the twin's eye as well.
      // (the dive begins at the eye: 190 m on we are at 30 m, looking down a road at the ring's light past an elder
      // that stands as tall as we fly; on a rare visit we hold our height for 76 m first, to leave through the twin's eye too)
      // (never steeper than 26 degrees: the design's long descent, easing left, over hoops ringing down; then 190 m dead straight)
      const dys = rare ? [-4, -7, -27, -26, -13, -5, -1.5, 0] : [-9, -20, -27, -18, -6, -2.5, -1, 0];
      const legs = [[40, 48], [50, 51], [60, 54], [60, 55.5], [60, 55], [50, 52], [40, 49], [36, 47.5]].map((l, i) => [l[0], l[1], dys[i]]);
      for (let i = 0; i < 3; i++) legs.push([STRAIGHT / 3, 46, 0]);
      for (const [len, yawDeg, dy] of legs) {
        const a = yawDeg * DEG;
        p.x -= Math.cos(a) * len; p.z -= Math.sin(a) * len; p.y += dy;
        wx -= 0.44 * Math.hypot(len, dy);
        pts.push(p.clone()); wheelAt.push(wx);
      }
    }
    await ctx.yield();
    const path = makePath(pts, { samples: 480 });
    await ctx.yield();
    // distance along the finished path of every control point -> the Wheel's travel as a function of distance
    const ctrlD = pts.map((_, i) => { const L = path.curve.getLengths(), n = L.length - 1; const t = i / (pts.length - 1); const k = Math.min(n, Math.round(t * n)); return L[k]; });
    const wheelXofD = monotone(ctrlD, wheelAt);
    const wheelX = (u) => wheelXofD(sat(u) * path.length);
    // our pace is the inverse of the Wheel's travel per metre of flight, so its ground speed is the same at every moment
    const RHO_MEAN = (wheelAt[0] - wheelAt[wheelAt.length - 1]) / path.length;
    const paceOf = (u) => { const D = sat(u) * path.length, h = 6; return Math.min(1.6, Math.max(0.6, RHO_MEAN * 2 * h / Math.max(wheelXofD(D - h) - wheelXofD(D + h), 1e-3))); };
    const uOfCtrl = (i) => ctrlD[i] / path.length;
    const U_FOOT = uOfCtrl(9 + FOOT), U_EYE = uOfCtrl(9 + N_EYE), U_TURN = uOfCtrl(9 + N_TURN), U_BEAD = uOfCtrl(9 + N_BEAD), U_D0 = uOfCtrl(9);
    const ringPos = path.end.clone(), ringDir = path.endTangent.clone().setY(0).normalize();
    await ctx.yield();
    // The corridor (the design's: hoops are pushed sideways out of it) is a fixed tube in the WORLD, laid along the
    // route where it runs low: a grid that knows, for any point of the pan, the nearest low sample of the route. No
    // hoop is ever placed from where the camera is or looks.
    // The legs D to G are authored in the Wheel's own frame, so their corridor is laid in that frame too: a berth beside
    // the Wheel that travels with it (the herd rolls only a few m/s faster than the Wheel, so its files barely move
    // across it). The rest of the route (the entry to the top of the climb, and the way in) has its corridor in the world.
    const NS = 700, psx = new Float32Array(NS + 1), psy = new Float32Array(NS + 1), psz = new Float32Array(NS + 1), psw = new Float32Array(NS + 1);
    { const v = new THREE.Vector3(); for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, v); psx[i] = v.x; psy[i] = v.y; psz[i] = v.z; psw[i] = v.x - wheelX(i / NS); } }
    const I_D0 = Math.ceil(U_D0 * NS), I_EYE = Math.floor(U_EYE * NS);
    const CG = 5, CR = 100;
    const makeCorridor = async (xs, inFrame, byWheel) => {
      let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
      for (let i = 0; i <= NS; i++) if (inFrame(i)) { bx0 = Math.min(bx0, xs[i]); bx1 = Math.max(bx1, xs[i]); bz0 = Math.min(bz0, psz[i]); bz1 = Math.max(bz1, psz[i]); }
      const gx0 = bx0 - CR - CG, gz0 = bz0 - CR - CG, gW = Math.ceil((bx1 - bx0 + 2 * CR) / CG) + 3, gH = Math.ceil((bz1 - bz0 + 2 * CR) / CG) + 3;
      const cgI = new Int16Array(gW * gH).fill(-1), cgD = new Float32Array(gW * gH).fill(1e9);
      for (let i = 0; i <= NS; i++) {
        if ((i & 7) === 0) await ctx.yield();
        if (!inFrame(i) || psy[i] > 62) continue;                    // up there the corridor is over every hoop's head
        const cx = Math.round((xs[i] - gx0) / CG), cz = Math.round((psz[i] - gz0) / CG), n = Math.ceil(CR / CG);
        for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) {
          const X = cx + dx, Z = cz + dz; if (X < 0 || Z < 0 || X >= gW || Z >= gH) continue;
          const ex = gx0 + X * CG - xs[i], ez = gz0 + Z * CG - psz[i], d = ex * ex + ez * ez, k = Z * gW + X;
          if (d < cgD[k]) { cgD[k] = d; cgI[k] = i; }
        }
      }
      const at = (x, z) => { const X = Math.round((x - gx0) / CG), Z = Math.round((z - gz0) / CG); return X < 0 || Z < 0 || X >= gW || Z >= gH ? -1 : cgI[Z * gW + X]; };
      // Slide a hoop (R, juvenile or not, its seed) sideways out of the tube, in this corridor's frame. The push has no
      // hole: a hoop is always at the full distance, on one side or the other; its own offset decides the side, and
      // within 0.3 m of the axis its own seed. Returns true and leaves the place in pushed.
      const push = (x0, z0, R, juv, seed) => {
        let x = x0, z = z0, any = false, last = -100;
        // (up to three passes: inside a bend tighter than the tube is wide, the place a hoop is slid to from one leg may
        // lie within reach of the other; it is then slid on, out of that one too)
        for (let pass = 0; pass < 3; pass++) {
          const ci = at(x, z); if (ci < 0 || Math.abs(ci - last) <= 8) break;      // (a second pass only for another leg of the route)
          last = ci;
          const ky = sstep(R * 2 + 40, R * 2 + 9, psy[ci]); if (ky <= 0) break;      // full while the route is within 9 m of the hoop's crown; it eases as the route rises over its head
          // the foot of this hoop on the route's own line (the segments either side of the nearest sample)
          let fx = xs[ci], fz = psz[ci], tx = 1, tz = 0, best = 1e18;
          for (let j = Math.max(ci - 2, 0); j < Math.min(ci + 2, NS); j++) {
            if (!inFrame(j) || !inFrame(j + 1)) continue;
            const sx = xs[j + 1] - xs[j], sz = psz[j + 1] - psz[j], q = sat(((x - xs[j]) * sx + (z - psz[j]) * sz) / Math.max(sx * sx + sz * sz, 1e-6));
            const gx = xs[j] + sx * q, gz = psz[j] + sz * q, dd = (x - gx) * (x - gx) + (z - gz) * (z - gz);
            if (dd < best) { best = dd; fx = gx; fz = gz; tx = sx; tz = sz; }
          }
          if (best > 1e17) best = (x - fx) * (x - fx) + (z - fz) * (z - fz);
          // wide enough that a hoop which the edge of the view cuts as we pass it is a small thing in the frame; those that
          // would roll nearer run in the band beyond (squeezed outward, never laid on one line), and the near field is the cast's
          const a = Math.sqrt(best), need = Math.min(60, (juv ? 27 : 40) + R * 1.6);
          if (a >= (pass ? need - 0.01 : need * 1.6)) break;
          let nx = x - fx, nz = z - fz;
          if (a > 0.3) { nx /= a; nz /= a; } else { const tl2 = Math.hypot(tx, tz) || 1, sg = seed > 0.5 ? 1 : -1; nx = -tz / tl2 * sg; nz = tx / tl2 * sg; }
          // (where the route runs along the Wheel's foot there is no room between it and the rim: a hoop that stands to
          // port of the Wheel's track is slid to port of the route, whatever its offset from the axis)
          if (byWheel && nz < 0 && z0 > 1.5 && fz < 40 && Math.abs(tx) > Math.abs(tz)) { const tl2 = Math.hypot(tx, tz) || 1, sg = tx < 0 ? -1 : 1; nx = -tz / tl2 * sg; nz = tx / tl2 * sg; }
          const out = pass ? need : need + a * 0.375;
          x = mix(x, fx + nx * out, ky); z = mix(z, fz + nz * out, ky); any = true;
        }
        pushed.x = x; pushed.z = z;
        return any;
      };
      return { push, at };
    };
    const pushed = { x: 0, z: 0 };
    const corridorW = await makeCorridor(psx, (i) => i < I_D0 || i > I_EYE);       // in the world
    const corridorWheel = await makeCorridor(psw, (i) => i >= I_D0 && i <= I_EYE, true);   // in the Wheel's frame
    await ctx.yield();

    // ---- the herd's flow: straight along E0, a 30 degree left arc of radius RC, then straight down -X
    const RC = 700, LA = RC * 30 * DEG, ZC = 190, XQ = d0.x - 110;
    const S0x = XQ + RC * Math.sin(30 * DEG), S0z = ZC + RC * (1 - Math.cos(30 * DEG));
    const flow = { x: 0, z: 0, h: Math.PI, k: 0 };        // out: position, heading, curvature
    const flowAt = (s, l) => {
      if (s >= 0) { flow.x = XQ - s; flow.z = ZC + l; flow.h = Math.PI; flow.k = 0; } else if (s > -LA) {
        const th = -s / RC, r = RC - l;
        flow.x = XQ + r * Math.sin(th); flow.z = ZC + RC - r * Math.cos(th); flow.h = Math.PI + th; flow.k = 1 / RC;
      } else {
        const b = -LA - s;
        flow.x = S0x - E0.x * b - 0.5 * l; flow.z = S0z - E0.z * b + 0.866 * l; flow.h = Math.PI + 30 * DEG; flow.k = 0;
      }
      return flow;
    };
    const flowS = (x, z) => {                            // along-flow coordinate of a world point
      const vx = x - XQ, vz = z - (ZC + RC), th = Math.atan2(vx, -vz);
      if (th <= 0 || vz > 0) return XQ - x;
      if (th < 30 * DEG) return -RC * th;
      return -LA + (x - S0x) * E0.x + (z - S0z) * E0.z;
    };

    const flowL = (x, z) => {                            // lane (metres to port of the flow's axis) of a world point
      const vx = x - XQ, vz = z - (ZC + RC), th = Math.atan2(vx, -vz);
      if (th <= 0 || vz > 0) return z - ZC;
      if (th < 30 * DEG) return RC - Math.hypot(vx, vz);
      return (x - S0x) * -0.5 + (z - S0z) * 0.866;
    };

    // ---- hoop meshes: near (real rim, hub ring, drumming membrane), mid (light rim, flat pane), far (one quad)
    const blendMul = { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
    // (the light of a pane is laid with MAX, not added: a hundred panes in line are then as bright as the brightest one of
    // them, in its own colour, and never pile up into pale froth; one pane alone looks as it did, a little lifted)
    const blendAdd = { ...blendMul, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
    const hornMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: HORN_VERT, fragmentShader: HORN_FRAG, side: THREE.DoubleSide });
    const memMat = (defs, blend) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: MEM_VERT, fragmentShader: MEM_FRAG, defines: defs, ...blend });
    const shadowMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, ...blendMul, depthTest: false });
    const herdCount = Math.round(2900 * detail * mix(0.82, 1.12, sat(((vary.density ?? 1) - 0.7) / 0.6)) * (rare ? 0.85 : 1));
    const NEAR_CAP = 96, MID_CAP = Math.round((rare ? 300 : 460) * detail);
    const nearPool = makePool(NEAR_CAP), midPool = makePool(MID_CAP), farPool = makePool(herdCount + 620);
    const herd = new THREE.Group(); scene.add(herd);
    const addMesh = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; herd.add(m); return m; };
    const nearHorn = nearPool.attach(hornGeometry([{ segs: 56, prof: RIM_PROFILE, rad: 0.972, kind: 0 }, { segs: 28, prof: HUB_PROFILE, rad: 0.277, kind: 1 }]));
    const midHorn = midPool.attach(hornGeometry([{ segs: 22, prof: RIM_LOW, rad: 0.972, kind: 0 }]));
    addMesh(nearHorn, hornMat, 0); addMesh(midHorn, hornMat, 0);
    await ctx.yield();
    const nearMem = nearPool.attach(annulusGeometry(40, 3, 0.285, 0.972));
    const midMem = midPool.attach(quadGeometry(1.0)), farMem = farPool.attach(quadGeometry(1.0));
    // (the near panes are laid after the mid and far ones: what stands behind an elder's glass, pale rims too, is seen
    // through it darker and in its colour, never as ivory rings on top of it)
    addMesh(nearMem, memMat({ PASS_MULTIPLY: 1 }, blendMul), 3.2); addMesh(nearMem, memMat({}, blendAdd), 3.4);
    addMesh(midMem, memMat({ PASS_MULTIPLY: 1, FLAT: 1 }, blendMul), 2); addMesh(midMem, memMat({ FLAT: 1 }, blendAdd), 3);
    addMesh(farMem, memMat({ PASS_MULTIPLY: 1, FLAT: 1, FARRIM: 1 }, blendMul), 2); addMesh(farMem, memMat({ FLAT: 1, FARRIM: 1 }, blendAdd), 3);
    for (const pool of [nearPool, midPool, farPool]) addMesh(pool.attach(quadGeometry(1.06)), shadowMat, 1).layers.set(1);
    await ctx.yield();

    // ---- the herd: lanes that never cross, one speed field, sizes on a steep power law
    const hr2 = rng.fork ? rng.fork('herd') : rng;
    const WIN = 1700, L_MIN = -250, L_MAX = 285;
    const paleK = hourKey === 'night' ? 0.4 : 0;       // by moonlight the tints go pale and silver
    const tintOf = (k, j) => { const t = HERD.tints[k]; return [mix(sat(t[0] + j * 0.05), 1, paleK), mix(sat(t[1] - j * 0.04), 1, paleK), mix(sat(t[2] + j * 0.03), 1, paleK)]; };
    const hoops = [], laneLs = [];
    const laneCap = monotone([-250, -215, -192, -150, -112, -60, 0, 40, 215, 250, 285], [40, 40, 13, 13, 30, 20, 12, 9.5, 9.5, 30, 40]);
    // The herd runs in files: one lane every 9 m, every hoop of a lane at the lane's own speed, so none overtakes
    // or rolls through another and from the air the lanes read as lines to the horizon. Juveniles run between
    // the files, faster. A third of the adults are elders of 14 to 40 m: their shadows are the carpet.
    const N_LANE = Math.round((L_MAX - L_MIN) / 9) + 1, spacing = WIN * N_LANE / herdCount;
    for (let li = 0, i = 0; li < N_LANE && i < herdCount + 200; li++) {
      await ctx.yield();
      const laneL = L_MIN + 9 * li + hr2.range(-1.6, 1.6), laneV = hr2.range(24, 27.5);
      laneLs.push(laneL);
      let sPos = hr2() * 30, prevR = 0, firstR = 0;
      for (let n = 0; n < 400; n++, i++) {
        const juv = hr2() < (spring ? 0.62 : 0.12);
        const x = hr2(), big = hr2() < 0.45;
        const dia0 = juv ? hr2.range(3, 4.2) : big ? 4.5 + 35.5 * x * x * x : 4.5 + 9 * x;
        const R0 = dia0 / 2, gap = Math.max(4, spacing - 13) * (0.25 + 1.5 * hr2() * hr2() * 2);
        sPos += juv ? gap * 0.5 : prevR + R0 + gap;
        if (sPos > WIN - firstR - R0 - 6) break;
        if (!juv) { prevR = R0; if (!firstR) firstR = R0; }
        // every lane has its own largest hoop (a property of the lane, the whole length of the river): the lanes our
        // route runs in while it is low carry only the lesser hoops, the elders roll in the lanes to either side
        const cap = laneCap(laneL), R = (juv ? dia0 : big ? 4.5 + (dia0 - 4.5) * (cap - 4.5) / 35.5 : 4.5 + (dia0 - 4.5) * Math.min(1, (cap - 4.5) / 9)) / 2;
        const lk = li + n;
        const t = tintOf(n % 5 === 4 ? hr2.int(0, 2) : lk % 3, hr2.range(-1, 1));
        const pale = juv ? 0.35 : 0;
        hoops.push({
          R, l: laneL + (juv ? 4.5 : hr2.range(-0.7, 0.7)), s0: sPos, v: juv ? hr2.range(32, 35) : laneV, juv,
          seed: hr2(), ph: hr2() * TAU, lean0: hr2.range(8, 14) * DEG,
          tr: mix(t[0], 1, pale), tg: mix(t[1], 1, pale), tb: mix(t[2], 1, pale),
        });
      }
    }
    await ctx.yield();

    // ---- the resting ground: fallen panes over rose brine, hoops ringing down like dropped coins
    const rr = rng.fork ? rng.fork('rest') : rng;
    const tmpE = new THREE.Vector3(), tmpF = new THREE.Vector3();
    const ringLeft = new THREE.Vector3(ringDir.z, 0, -ringDir.x);       // left of the final heading
    groundU.uRest.value.set(ringPos.x - ringDir.x * 240, ringPos.z - ringDir.z * 240, 820, 1);
    groundU.uRing.value.set(ringPos.x, ringPos.z, ringDir.x, ringDir.z);
    const restCount = Math.round(300 * detail);
    // The resting ground is a rosette. The herd's old roads are nine spirals closing on the standing ring (drawn in
    // the ground shader from the same numbers); the fallen gather in the lanes between them, densest toward the ring
    // and mostly on the side we arrive from. Three kinds: panes that lie flat, dried rose over their brine pools;
    // sleepers propped on their rims, broadside to the wind and tipped downwind, rocking, each laying a long tinted
    // shadow the same way; and hoops still ringing down.
    const ARMS = 9, TWIST = 0.5, apA = Math.atan2(-ringDir.z, -ringDir.x), placed = [];
    const roadPh = apA - TWIST * Math.log(150);      // a lane lies on our line 150 m out: two roads flank the last approach
    groundU.uRoadPh.value = roadPh;
    // The way in. Along the lanes between the roads, on both sides of the descent and the last straight, the old ones
    // come to rest: at even steps down every lane (a seeded start, alternately left and right of the lane's middle)
    // stands an elder ringing down like a dropped coin, each on its own seeded clock (so on any visit some are tall and
    // spinning, some are clapping flat, some wobbling back up, wherever we are), and between the elders lie panes of
    // rose glass. Laid in the world from the seed; none is placed, sized or timed for a place on the route.
    const elders = [], sites = [];
    const RING_R = 19, TIP_R = 24, TIP_LEAN = 60 * DEG, alongH = Math.atan2(ringDir.z, ringDir.x);
    // the standing ring (a circle round its rim) and the two tipped rims (each a circle round the middle of its leaning disc)
    const monuments = [{ x: ringPos.x, z: ringPos.z, r: RING_R * 1.16 }];
    for (const sd of [1, -1]) {
      const h = alongH + 35 * DEG * sd, sl = Math.sin(TIP_LEAN * sd), cx = ringPos.x + ringLeft.x * 38 * sd - ringDir.x * 4, cz = ringPos.z + ringLeft.z * 38 * sd - ringDir.z * 4;
      monuments.push({ x: cx + TIP_R * sl * Math.sin(h), z: cz - TIP_R * sl * Math.cos(h), r: TIP_R * 1.1 });
    }
    const wy = rng.fork ? rng.fork('way') : rng;
    // (the forks of the river's elders and of the escorts are taken here, in their old order, so that the fork of the
    // fallen below is taken after every older one; each fork is a stream of its own, so nothing they deal has changed)
    const rv = rng.fork ? rng.fork('river') : rng;
    const er = rng.fork ? rng.fork('escort') : rng;
    // The fallen of the rosette have a stream of their own: the tries of their loop depend on which elders stand, and
    // nothing dealt after them (salt, smoke, the cast) should follow from that.
    const fl = rng.fork ? rng.fork('fallen') : rng;
    for (let lane = -3; lane <= 2; lane++) for (let row = 0; row < 2; row++) {
      const start = wy.range(0, 1), first = wy.int(0, 1);
      for (let k = 0; k < 16; k++) {
        const r = 62 * Math.pow(1.15, k + start + 0.5 * row), laneW = r * TAU / ARMS * 0.894;
        const across = (row ? 1 : -1) * wy.range(0.17, 0.3), big = (k + first) % 2 === 0;
        const tk = wy.int(0, 2), ph = wy(), per = wy.range(12, 18), sz = wy(), h0 = wy.range(-Math.PI, Math.PI), sd = wy();
        sites.push({ r, laneW, ang: (lane + across) * TAU / ARMS + TWIST * Math.log(r) + roadPh, big, tk, ph, per, sz, h0, sd });
      }
    }
    await ctx.yield();
    for (let pass = 0; pass < 2; pass++) for (const c of sites) {      // the elders choose their ground first, the panes lie between them
      const { r, laneW, big, tk, ph, per, sz, h0, sd } = c;
      if (big !== (pass === 0)) continue;
      const x = ringPos.x + Math.cos(c.ang) * r, z = ringPos.z + Math.sin(c.ang) * r;
      const along = (x - ringPos.x) * ringDir.x + (z - ringPos.z) * ringDir.z, lat = (x - ringPos.x) * ringLeft.x + (z - ringPos.z) * ringLeft.z;
      const dia = big ? Math.min(24 + 20 * sz, Math.max(16, laneW * 0.62)) : Math.min(14 + 9 * sz, Math.max(9, laneW * 0.42));
      const near = path.nearestXZ(x, z);
      if (near.dist > 150 || r > 760) continue;                                       // the lanes either side of the way in; the rest of the rosette is laid below
      if (Math.abs(lat) < 82 && along > -44 && along < 56) continue;                 // the ring and its two fallen arches stand clear
      if (z > -42 || (rare && Math.abs(z - TWIN_Z) < dia / 2 + 12)) continue;        // the Wheel's own track (and its twin's)
      // an elder ringing down sweeps a disc of its own diameter round its foot (flat, its far edge lies 2R out): that disc
      // never comes within 6 m of the standing ring or of either tipped rim (each taken as the circle round its footprint)
      if (big && monuments.some((m) => Math.hypot(x - m.x, z - m.z) < m.r + dia + 6)) continue;
      if (big ? (near.dist < dia * 0.5 + 15 && near.y < dia + 16) || (Math.abs(lat) < dia * 0.5 + 22 && along > -430 && along < 0) : near.dist < dia * 0.5 + 5) continue;      // clear of our line, and never between us and the ring
      if (placed.some((o) => Math.hypot(x - o.x, z - o.z) < (o.R + dia * 0.5) * (o.elder && big ? 1.7 : o.elder || big ? 1.25 : 1.15) + 3)) continue;
      const t = tintOf(herdKey === 'autumn' ? tk % 2 : tk, 0);
      const o = big
        ? { rest: true, spin: true, elder: true, R: dia / 2, x, z, h0, seed: sd, ph, period: per, prec: 13, tr: t[0], tg: t[1], tb: t[2] }
        : { rest: true, spin: false, R: dia / 2, x, z, h0: -1.18 + 0.4 * h0, seed: sd, ph: ph * 40, period: per, tr: mix(t[0], 0.96, 0.8), tg: mix(t[1], 0.5, 0.8), tb: mix(t[2], 0.6, 0.8) };
      if (big) elders.push(o);
      hoops.push(o); placed.push(o);
    }
    await ctx.yield();
    for (let i = 0, tries = 0; i < restCount && tries < 80000; tries++) {
      if ((tries & 7) === 0) await ctx.yield();
      const front = i % 10 < 7;
      const r = front ? 58 + 560 * Math.pow(fl(), 0.85) : 60 + 430 * fl() * fl();
      const phi = front ? fl.range(-0.95, 0.95) : fl.range(0.95, TAU - 0.95);
      const lnr = TWIST * Math.log(r) + roadPh, laneW = r * TAU / ARMS * 0.894;
      const lane = Math.round((apA + phi - lnr) / TAU * ARMS) + fl.range(-0.2, 0.2);
      const ang = lane * TAU / ARMS + lnr;
      const x = ringPos.x + Math.cos(ang) * r, z = ringPos.z + Math.sin(ang) * r;
      const along = (x - ringPos.x) * ringDir.x + (z - ringPos.z) * ringDir.z, lat = (x - ringPos.x) * ringLeft.x + (z - ringPos.z) * ringLeft.z;
      const dia = Math.min(11 + 25 * Math.pow(fl(), 1.3), Math.max(9, laneW * 0.5)), kind = fl(), tk = fl.int(0, 4), tj = fl.range(-1, 1), ph = fl() * 40, sd = fl(), per = fl.range(8, 13), hj = fl.range(-1, 1);
      const near = path.nearestXZ(x, z);
      if (near.dist < dia * 0.5 + 11 && near.y < dia + 14) continue;
      if (Math.abs(lat) < 82 && along > -44 && along < 56) continue;                 // keep the ring and its two fallen arches clear
      if (z > -42) continue;                                           // the Wheel's own track and the river
      if (rare && Math.abs(z - TWIN_Z) < dia * 0.5 + 9) continue;      // and the twin's
      if (elders.some((o) => Math.hypot(x - o.x, z - o.z) < o.R * 2.1 + dia * 0.5 + 6)) continue;      // room for the elders to ring down
      if (placed.some((o) => Math.hypot(x - o.x, z - o.z) < (o.R + dia * 0.5) * 1.15)) continue;
      // nothing stands up near the line of sight to the ring: there the fallen only lie
      const sight = Math.abs(lat) < 46 && along > -430;
      const spin = i % 8 === 0 && !(Math.abs(lat) < 85 && along > -380);
      const prop = !spin && !sight && kind < 0.62;
      const t = tintOf(herdKey === 'autumn' ? [0, 1, 2, 0, 1][tk] : tk % 3, tj);
      const o = { rest: true, spin, R: dia / 2, x, z, h0: spin ? hj * Math.PI : -1.18 + 0.25 * hj, seed: sd, ph, period: per, tr: t[0], tg: t[1], tb: t[2] };
      if (prop) o.prop = (48 + 18 * kind / 0.62) * DEG;
      else if (!spin) { o.tr = mix(t[0], 0.96, 0.8); o.tg = mix(t[1], 0.5, 0.8); o.tb = mix(t[2], 0.6, 0.8); }      // rose glass
      hoops.push(o); placed.push(o);
      i++;
    }
    await ctx.yield();
    // ---- the standing ring and the two tipped rims: the same horn, thick and terraced
    const ringPool = makePool(3);
    const RING_PROFILE = [[1.3, 0], [1.0, 0.5], [0.35, 0.82], [-0.4, 0.8], [-0.95, 0.4], [-0.95, -0.4], [-0.4, -0.8], [0.35, -0.82], [1.0, -0.5]];
    const ringGeo = ringPool.attach(hornGeometry([{ segs: 220, prof: RING_PROFILE, rad: 0.972, kind: 0 }]));
    const ringMat = new THREE.ShaderMaterial({ uniforms: { ...U, uThick: { value: new THREE.Vector2(8.17, 3.4) } }, vertexShader: HORN_VERT, fragmentShader: HORN_FRAG, side: THREE.DoubleSide });
    addMesh(ringGeo, ringMat, 0);
    // the ring: a 24 m opening in a rim 6 m deep (outer silhouette 38 m), its foot sunk 3 m in the salt
    const ringH = Math.atan2(ringDir.x, -ringDir.z);
    ringPool.push(ringPos.x, ringPos.z, ringH, RING_R, 0.4, 0, ringPos.y - RING_R, 0.37, 1, 1, 1, 2);
    for (const sd of [1, -1]) {
      // the two fallen arches: 34 m rims as thick as the ring's own, tipped outward and back, a third of each buried
      const cx = ringPos.x + ringLeft.x * 38 * sd - ringDir.x * 4, cz = ringPos.z + ringLeft.z * 38 * sd - ringDir.z * 4;
      ringPool.push(cx, cz, alongH + 35 * DEG * sd, TIP_R, 1.3 * sd, TIP_LEAN * sd, -8.5, 0.61 + 0.2 * sd, 0.75, 1, 1, 2);
    }
    addMesh(ringPool.attach(quadGeometry(1.3)), shadowMat, 1).layers.set(1);
    ringPool.flush();
    await ctx.yield();
    // the ring's light, carried across the pan: a soft mint halo that keeps its size in the frame as we come down
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { ...U, uPortalCol: groundU.uPortalCol, uC: { value: new THREE.Vector3(ringPos.x + ringDir.x * 5, ringPos.y + 1, ringPos.z + ringDir.z * 5) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform vec3 uC; varying vec2 vC; varying float vK;
        void main(){
          float d = length(cameraPosition - uC);
          vec4 mv = viewMatrix * vec4(uC, 1.);
          mv.xy += position.xy * (mix(31., 74., smoothstep(30., 110., d)) + d * .13);
          vC = position.xy; vK = (.35 + .65 * smoothstep(40., 190., d)) * (1. - smoothstep(850., 1250., d));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uPortalCol; uniform float uTime; varying vec2 vC; varying float vK;
        void main(){
          float r2 = dot(vC, vC); if (r2 > 1.) discard;
          float fall = (1. - r2) * (1. - r2);
          float a = (exp(-r2 * 32.) * 1.25 + exp(-r2 * 7.) * .5 + .14 * fall) * fall * vK * (.93 + .07 * sin(uTime * 1.3));
          a += exp(-vC.y * vC.y * 300.) * exp(-vC.x * vC.x * 3.5) * .2 * fall * vK;      // a faint level streak, like light on haze
          gl_FragColor = vec4(uPortalCol * a, 1.);
        }` }));
    halo.frustumCulled = false; halo.renderOrder = 6; scene.add(halo);
    // salt drifted against their feet
    const driftMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: /* glsl */`
      varying vec3 vW, vN;
      void main(){
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
        m = modelMatrix * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.); vW = w.xyz;
        vec3 sc = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));      // (the mounds are flattened domes: normals take the inverse scale)
        vN = normalize(mat3(m) * (normal / max(sc * sc, vec3(1e-4))) + vec3(0., 1e-4, 0.)); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; uniform vec3 uSalt;
      ${G_COMMON}
      void main(){
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        vec3 N = nrm(vN + vec3(vnoise(vW.xz * 3.) - .5, 0., vnoise(vW.zx * 3. + 7.) - .5) * .3);
        vec3 col = uSalt * (.9 + .12 * vnoise(vW.xz * 11.)) * (uSunCol * max(dot(N, uSunDir) * .55 + .45, 0.) + uSkyCol * (.9 + .3 * N.y));      // drifted salt: the low sun wraps round it, lilac in its own shade
        gl_FragColor = vec4(mix(col, hazeCol(-V), hazeAmt(dist)), 1.);
      }` });
    const driftGeo = new THREE.SphereGeometry(1, 20, 8, 0, TAU, 0, Math.PI / 2);
    const drifts = new THREE.InstancedMesh(driftGeo, driftMat, 3); drifts.frustumCulled = false;
    {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -alongH), sc = new THREE.Vector3();
      const put = (i, lat, along, sx, sy, sz) => m.compose(new THREE.Vector3(ringPos.x + ringLeft.x * lat + ringDir.x * along, -0.05, ringPos.z + ringLeft.z * lat + ringDir.z * along), q, sc.set(sx, sy, sz)) && drifts.setMatrixAt(i, m);
      put(0, 0, 0.6, 9, 3.4, 29); put(1, 44, -1, 18, 4.6, 18); put(2, -44, -1, 18, 4.6, 18);
    }
    scene.add(drifts);
    await ctx.yield();

    // ---- salt: a fan at every near contact, and streaks of salt smoke that overtake us along the ground
    const SPRITE_FRAG = /* glsl */`
      varying vec2 vC; varying vec4 vCol; varying float vDist; varying vec3 vDir;
      ${G_COMMON}
      void main(){
        float r2 = dot(vC, vC); if (r2 > 1.) discard;
        float a = vCol.a * (1. - r2) * (1. - r2);
        vec3 col = mix(vCol.rgb, hazeCol(vDir), hazeAmt(vDist));
        gl_FragColor = vec4(col * a, a);
      }`;
    const premult = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    const fanMat = new THREE.ShaderMaterial({ uniforms: U, ...premult, fragmentShader: SPRITE_FRAG, vertexShader: /* glsl */`
      attribute vec3 aSeed;
      varying vec2 vC; varying vec4 vCol; varying float vDist; varying vec3 vDir;
      uniform vec3 uSalt; uniform vec4 uFrontA;
      ${G_COMMON}
      ${HOOP_PARS}
      void main(){
        // the gust is where the front is: a plume stands at the foot of each hoop as the front passes it, and dies away behind
        float fd = dot(iA.xy, uFrontA.xy) - uFrontA.z;
        float uGust = uFrontA.w * (fd > 0. ? exp(-fd * fd / 150.) : exp(-fd * fd / 9000.));
        float R = iA.w, sc = sqrt(R) * (1. + .7 * uGust);        // in the gust every contact throws a standing plume
        float t = fract(uTime * (1.5 - .12 * sc) + aSeed.x * 7.);
        float life = .45 * sc;
        float tt = t * life;
        vec3 v = vec3(mix(-(3.2 + 7.5 * aSeed.y), 5. + 9. * aSeed.y, uGust), (.9 + 1.7 * aSeed.z) * (1. - .25 * uGust), (fract(aSeed.x * 13.) - .5) * 5.) * sc * .8;      // (in the gust the salt is carried on DOWNWIND, ahead of the hoop, and stays up: a streaming plume)      // (low: a tail at the foot, never a veil over the hoop)
        vec3 q = v * tt + vec3(-.2 * R * aSeed.y * (1. - uGust), .1 - 4.9 * (1. - .86 * uGust) * tt * tt, 0.);
        q.y = max(q.y, .05);
        float ch = cos(iA.z), sh = sin(iA.z);
        vec3 w = vec3(iA.x, 0., iA.y) + vec3(ch * q.x + sh * q.z, q.y, sh * q.x - ch * q.z);
        vec4 mv = viewMatrix * vec4(w, 1.);
        float size = (.25 + 1.3 * t) * sc * .5 * (1. + (.5 + 2.1 * smoothstep(4., 7., R)) * uGust);      // (the standing plumes are the elders': the lesser hoops only kick up a little more)
        // each puff is drawn out along its own flight (more in the gust): a plume streams back from the contact as a tail
        vec3 vw = vec3(ch * v.x + sh * v.z, v.y - 9.8 * tt, sh * v.x - ch * v.z);
        vec2 dv = (viewMatrix * vec4(vw, 0.)).xy; float dl = length(dv);
        dv = dl > 1e-3 ? dv / dl : vec2(1., 0.);
        float along = 1. + (1.1 + 1.5 * uGust) * clamp(dl / max(6. * sc, 1e-3), 0., 1.);
        mv.xy += (dv * position.x * along + vec2(-dv.y, dv.x) * position.y * (1. - .25 * uGust)) * size;
        vC = position.xy; vDist = -mv.z; vDir = nrm(w - cameraPosition);
        float a = (1. - t) * (1. - t) * smoothstep(0., .08, t) * (.72 - .1 * uGust) * clamp(iC.w, 0., 1.) * step(0., iB.w) * step(iB.z, .3) * smoothstep(1.5, 4., vDist) * (1. - .9 * smoothstep(70., 230., vDist));
        vCol = vec4(uSalt * (sunLow() * sunThrough(w) * .5 + uSkyCol * 1.15), a);
        gl_Position = projectionMatrix * mv;
        if (a <= .002) gl_Position = vec4(2., 2., 2., 1.);
      }` });
    const fanGeo = (k) => {
      const g = new THREE.InstancedBufferGeometry(), pos = [], seed = [], idx = [];
      for (let i = 0; i < k; i++) {
        const a = rr(), b = rr(), c = rr();
        pos.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); for (let j = 0; j < 4; j++) seed.push(a, b, c);
        idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 3)); g.setIndex(idx);
      return g;
    };
    addMesh(nearPool.attach(fanGeo(34)), fanMat, 4); addMesh(midPool.attach(fanGeo(Math.round(9 * detail))), fanMat, 4);
    await ctx.yield();

    const smokeU = { ...U, uSalt: U.uSalt, uSmoke: { value: new THREE.Vector4(-1, 0, 0.5, 0) }, uFront: { value: new THREE.Vector2(-1e5, 0) } };   // wind xz, strength, gust
    const nStreak = Math.round(520 * detail);
    const streakGeo = new THREE.BufferGeometry();
    {
      const pos = [], seed = [], idx = [];
      for (let i = 0; i < nStreak; i++) {
        const s = [rr(), rr(), rr(), rr()];
        pos.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); for (let j = 0; j < 4; j++) seed.push(...s);
        idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      }
      streakGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); streakGeo.setAttribute('aS', new THREE.Float32BufferAttribute(seed, 4)); streakGeo.setIndex(idx);
    }
    const WISP_FRAG = /* glsl */`
      varying vec2 vC; varying vec4 vCol; varying float vDist; varying vec3 vDir;
      ${G_COMMON}
      void main(){
        float r2 = dot(vC, vC); if (r2 > 1.) discard;
        float sd = vCol.a * 37.;                                  // (a seed per wisp, good enough)
        float brk = smoothstep(.3, .62, vnoise(vec2(vC.x * 2.6 + sd, sd * 3.1)) * .65 + vnoise(vec2(vC.x * 7. - sd, vC.y * 2. + sd)) * .35);
        float taper = (1. - vC.x * vC.x) * (1. - vC.x * vC.x) * (1. - vC.y * vC.y / max(1. - .7 * abs(vC.x), .05));
        float a = vCol.a * max(taper, 0.) * brk;
        vec3 col = mix(vCol.rgb, hazeCol(vDir), hazeAmt(vDist));
        gl_FragColor = vec4(col * a, a);
      }`;
    const streakMat = new THREE.ShaderMaterial({ uniforms: smokeU, ...premult, fragmentShader: WISP_FRAG, vertexShader: /* glsl */`
      attribute vec4 aS;
      varying vec2 vC; varying vec4 vCol; varying float vDist; varying vec3 vDir;
      uniform vec3 uSalt; uniform vec4 uSmoke; uniform vec2 uFront;
      ${G_COMMON}
      void main(){
        const float W = 300.;
        vec2 wind = uSmoke.xy;
        vec2 base = aS.xy * W + wind * uTime * (40. + 22. * aS.z);
        vec2 p = cameraPosition.xz + mod(base - cameraPosition.xz, W) - W * .5;
        // in the gust front the smoke stands up as a low wall: taller, wider, thicker streaks
        float fb = uFront.y * exp(-abs(dot(p, wind) - uFront.x) * .035);
        float y = (.25 + 3.2 * aS.z * aS.z) * (1. + .5 * fb) + .3 * sin(uTime * 2. + aS.w * 30.);      // (the front stands half as high as the near hoops: it never veils them)
        vec3 c = vec3(p.x, y, p.y);
        vec3 along = vec3(wind.x, 0., wind.y);
        vec3 toCam = cameraPosition - c; float d = length(toCam);
        vec3 side = nrm(cross(along, toCam / max(d, 1e-3)) + vec3(0., 1e-3, 0.));
        float len = 7. + 12. * aS.w, wid = (.35 + .6 * aS.z) * (1. + 1.6 * fb);
        vec3 w = c + along * position.x * len + side * position.y * wid;
        vC = position.xy; vDist = d; vDir = nrm(w - cameraPosition);
        float edge = smoothstep(W * .5, W * .36, d) * smoothstep(5., 22., d);
        float a = min(edge * (.1 + .2 * aS.w) * (uSmoke.z + uSmoke.w * exp(-abs(dot(p, wind) - uFront.x) * .009)) * (1. + 1.2 * fb), .42) * smoothstep(.42, .16, (cameraPosition.y - y) / max(d, 1.));      // (a thin thread: lost when looked down on steeply)
        vCol = vec4(uSalt * (sunLow() * .38 + uSkyCol * 1.2), a);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        if (a <= .002) gl_Position = vec4(2., 2., 2., 1.);
      }` });
    const streaks = new THREE.Mesh(streakGeo, streakMat); streaks.frustumCulled = false; streaks.renderOrder = 5; scene.add(streaks);
    // The gust front itself: one soft-bodied bank of salt smoke standing on the front line. Its body is a density field
    // (BANK_GLSL) cut by crossed slices: twelve upright sheets across the wind and six level ones, each weighted by how
    // squarely it is seen, so the bank has a body from the pan and from the air alike. It is lit by its own shape: lilac
    // on its shaded faces, warm cream along the crest and on the flanks of the billows that face the sun. Always drawn
    // (its strength is a uniform), so nothing is made or switched when the gust comes.
    smokeU.uWall = { value: new THREE.Vector4(-1e5, 0, 17, 0) };      // front (metres along the wind), lateral centre, height, strength
    const wallGeo = new THREE.BufferGeometry();
    {
      const pos = [], idx = [], NV = 12, NH = 0;      // position = (lateral -1..1, v 0..1, slice); slice < 100: upright at that many metres behind the line; else level at (slice - 100) of the height
      const quad = (sl) => { const b = pos.length / 3; pos.push(-1, 0, sl, 1, 0, sl, 1, 1, sl, -1, 1, sl); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
      for (let k = 0; k < NV; k++) quad(-24 + 4.2 * k);
      for (let k = 0; k < NH; k++) quad(100 + 0.1 + 0.15 * k);
      wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wallGeo.setIndex(idx);
    }
    const wallMat = new THREE.ShaderMaterial({ uniforms: smokeU, ...premult, side: THREE.DoubleSide, vertexShader: /* glsl */`
      varying vec3 vW; varying float vUp;
      uniform vec4 uSmoke, uWall;
      void main(){
        vec2 wind = uSmoke.xy, perp = vec2(-wind.y, wind.x);
        float s = uWall.y + position.x * 800., sl = position.z, up = step(99., sl);
        // an upright sheet stands sl metres behind the line and rises 1.5 heights; a level one lies from 30 m ahead of the line to 30 m behind it
        float bk = uWall.z / 10.;
        float al = uWall.x - mix(sl, -30. + 60. * position.y, up) * bk;
        float y = mix(position.y * uWall.z * 1.6, (sl - 100.) * uWall.z * 1.3, up);
        vec3 w = vec3(wind.x * al + perp.x * s, y + .06, wind.y * al + perp.y * s);
        vW = w; vUp = up;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        if (uWall.w <= .002) gl_Position = vec4(2., 2., 2., 1.);
      }`, fragmentShader: /* glsl */`
      varying vec3 vW; varying float vUp;
      uniform vec3 uSalt; uniform vec4 uSmoke, uWall;
      ${G_COMMON}
      ${WHEEL_GLSL}
      ${BANK_GLSL}
      void main(){
        vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-4);
        vec2 wind = uSmoke.xy, perp = vec2(-wind.y, wind.x);
        float t = uTime, s = dot(vW.xz, perp);
        float bk = max(uWall.z / 10., .5);      // the bank's size: its height and depth grow together, its billows with them
        vec3 q = vec3(s, vW.y / bk, (uWall.x - dot(vW.xz, wind) + bankLine(s, t)) / bk);
        float f0 = bankF(q, t);
        float rho = smoothstep(0., .4, f0);
        if (rho <= .003) discard;
        // its shape lights it: the gradient of the body is its surface
        float fs = bankF(q + vec3(2.5, 0., 0.), t) - f0, fy = bankF(q + vec3(0., 1.6, 0.), t) - f0, fa = bankF(q + vec3(0., 0., 2.5), t) - f0;
        vec3 N = nrm(-(vec3(perp.x, 0., perp.y) * fs / 2.5 - vec3(wind.x, 0., wind.y) * fa / 2.5 + vec3(0., 1., 0.) * fy / 1.6) + vec3(0., .02, 0.));
        float hy = q.y / (BANK_H * bankCol(s, t) + .01);
        float nl = clamp(dot(N, uSunDir) * .6 + .4, 0., 1.);
        // lilac in its own shade; warm where the sun comes over the crest and on the flanks of the billows that face it
        // the top of the body and the crowns of its billows take the low sun as the salt does (warm cream); what has smoke
        // above it, and every face turned from the sun, is in the bank's own lilac shade
        float expo = 1. - smoothstep(0., .45, f0 + fy * 1.6);      // how open to the sky this point of the body is (little smoke above it)
        float lit = clamp(max(expo * (.22 + 2.8 * max(dot(N, uSunDir), 0.)), smoothstep(.52, .92, hy) * (.55 + .45 * expo)), 0., 1.);      // (and by its height in the body: the crest is one warm line, the body under it lilac)
        vec3 sun = sunLow() * sunThrough(vW) * .27;
        vec3 shade = vec3(.6, .54, .8) * (uSkyCol * 1.7 + sun * .06), warm = vec3(.95, .82, .62) * (sun * 1.1 + uSkyCol * .8);
        vec3 col = mix(shade, warm, lit);
        col *= .8 + .2 * smoothstep(0., .6, hy);                       // deeper at the foot
        // how squarely this slice is seen: an upright sheet from along the wind, a level one from above
        float sq = mix(abs(dot(V.xz, wind)), abs(V.y), vUp);
        float a = rho * mix(.6, .7, vUp) * smoothstep(.05, .45, sq) * uWall.w * smoothstep(.36, .16, abs(V.y));      // (looked down on, the sheets give way to the body's own crown, below)
        a *= smoothstep(800., 560., abs(s - uWall.y)) * smoothstep(2., 26., dist) * smoothstep(1100., 520., dist);
        col = mix(col, hazeCol(V), hazeAmt(dist));
        gl_FragColor = vec4(col * a, a);
      }` });
    // Seen from the air the bank is its crown: one displaced surface over the same body (bankTop), lit by its own shape,
    // warm cream where it faces the sky and the sun, lilac on the flanks turned from the sun, thinning to nothing at its
    // foot and along its silhouette (a soft edge, no sheet). It comes in as the view tips down and the sheets go out.
    const crownGeo = new THREE.BufferGeometry();
    {
      const NSX = 500, NA = 16, pos = [], idx = [];
      for (let j = 0; j <= NA; j++) for (let i = 0; i <= NSX; i++) pos.push(i / NSX * 2 - 1, j / NA, 0);
      for (let j = 0; j < NA; j++) for (let i = 0; i < NSX; i++) { const a = j * (NSX + 1) + i, b = a + NSX + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      crownGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); crownGeo.setIndex(idx);
    }
    const crownMat = new THREE.ShaderMaterial({ uniforms: smokeU, ...premult, side: THREE.DoubleSide, vertexShader: /* glsl */`
      varying vec3 vW;
      uniform vec4 uSmoke, uWall;
      ${G_COMMON}
      ${BANK_GLSL}
      void main(){
        vec2 wind = uSmoke.xy, perp = vec2(-wind.y, wind.x);
        float bk = max(uWall.z / 10., .5), s = uWall.y + position.x * 800., zb = mix(-15., 27., position.y);
        float al = uWall.x + bankLine(s, uTime) - zb * bk;
        vec3 w = vec3(wind.x * al + perp.x * s, bankTop(s, zb, uTime) * bk + .08, wind.y * al + perp.y * s);
        vW = w;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        if (uWall.w <= .002) gl_Position = vec4(2., 2., 2., 1.);
      }`, fragmentShader: /* glsl */`
      varying vec3 vW;
      uniform vec3 uSalt; uniform vec4 uSmoke, uWall;
      ${G_COMMON}
      ${WHEEL_GLSL}
      ${BANK_GLSL}
      float topAt(vec2 xz, float bk){
        vec2 wind = uSmoke.xy; float s = dot(xz, vec2(-wind.y, wind.x));
        return bankTop(s, (uWall.x - dot(xz, wind) + bankLine(s, uTime)) / bk, uTime) * bk;
      }
      void main(){
        vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-4);
        vec2 wind = uSmoke.xy, perp = vec2(-wind.y, wind.x);
        float bk = max(uWall.z / 10., .5), e = 2.2 * bk;
        float h0 = topAt(vW.xz, bk), hp = topAt(vW.xz + perp * e, bk), hw = topAt(vW.xz + wind * e, bk);
        vec3 N = nrm(vec3(0., 1., 0.) - vec3(perp.x, 0., perp.y) * (hp - h0) / e - vec3(wind.x, 0., wind.y) * (hw - h0) / e);
        float lit = clamp(.12 + .7 * dot(N, uSunDir) + .8 * N.y, 0., 1.);      // cream where it faces the sky and the sun, lilac where it is turned from the sun
        lit *= .5 + .5 * smoothstep(.2, .75, h0 / max(BANK_H * bk, 1.));      // the hollows between the billows and the foot sit in the body's shade
        vec3 sun = sunLow() * sunThrough(vW) * .27;
        vec3 shade = vec3(.6, .54, .8) * (uSkyCol * 1.7 + sun * .06), warm = vec3(.95, .82, .62) * (sun * 1.1 + uSkyCol * .8);
        vec3 col = mix(shade, warm, lit);
        float a = smoothstep(.2, 4., h0 / bk) * smoothstep(.02, .4, abs(dot(N, V))) * .95 * uWall.w;
        a *= smoothstep(.1, .3, -V.y);      // the crown is what is seen from above
        float s = dot(vW.xz, perp);
        a *= smoothstep(800., 560., abs(s - uWall.y)) * smoothstep(2., 26., dist) * smoothstep(1100., 520., dist);
        if (a <= .003) discard;
        col = mix(col, hazeCol(V), hazeAmt(dist));
        gl_FragColor = vec4(col * a, a);
      }` });
    const crown = new THREE.Mesh(crownGeo, crownMat); crown.frustumCulled = false; crown.renderOrder = 5.2; scene.add(crown);
    const wall = new THREE.Mesh(wallGeo, wallMat); wall.frustumCulled = false; wall.renderOrder = 5.2; scene.add(wall);
    // the smoke and the glass: panes are drawn without depth, so the bank (drawn after them) would paint over every pane
    // that stands before it and leave bare rims. While the gust lives the panes lay their depth down once, after
    // all glass and before the bank: smoke before a pane covers it, smoke behind it does not.
    const paneDepth = new THREE.ShaderMaterial({ uniforms: { ...U, uWall: smokeU.uWall }, vertexShader: DEPTH_VERT, fragmentShader: DEPTH_FRAG,
      transparent: true, blending: THREE.NoBlending, colorWrite: false, depthWrite: true, side: THREE.DoubleSide });
    for (const g of [nearPool.attach(quadGeometry(1.0)), midMem, farMem]) addMesh(g, paneDepth, 5.1);
    await ctx.yield();

    // ---- the company we keep. The camera flies faster than the herd rolls, so (the design's device) the hoops we enter
    // beside are carried at the camera's own pace less a steady drift: each has ONE constant speed over the ground for
    // its whole life (5 to 8 m/s slower than we fly; the juveniles 6 m/s faster). Until the gust's front reaches it a
    // cast hoop rolls beside our way in; when the front has passed it, it carves left with the herd, as every hoop
    // does, and from there keeps the lane it is in for good (see castAt). None holds a station on our track, none is
    // re-timed, none is faded at a place.
    const cast = [];
    const addCast = (side, ahead0, rate, dia, tint, opt = {}) => cast.push({ u0: 0, side, ahead0, rate, R: dia / 2, t: tintOf(tint, 0), seed: rr(), ph: rr() * TAU, ...opt });
    // the entry: a 9 m rose hoop 10 m to port (the design's size), a 5 m green one 9 m to starboard, and a dozen more ahead whose
    // windows of light cross on the salt before us (those to starboard throw theirs over our line)
    addCast(10.5, 30, -300, 9, 0); addCast(-9, 30, -260, 5, 2);
    addCast(30, 92, -400, 14, 1); addCast(-26, 20, -250, 13, 0); addCast(-25, 44, -280, 8, 2);
    addCast(-62, 104, -400, 22, 1); addCast(-38, 66, -330, 13, 0);
    addCast(20, 120, -400, 6.5, 0); addCast(-17.5, 122, -380, 7, 1); addCast(14, 138, -400, 20, 0);
    // the company of the gust: eight that roll ahead of us, most of them to port, so that when the front comes
    // through from behind and the wave of lean runs up the herd it is read on large hoops close before us
    [[13, 104, 12, 0], [-19, 98, 9, 2], [25, 128, 16, 1], [74, 140, 20, 0], [17, 162, 14, 2], [90, 164, 17, 1], [40, 148, 18, 2], [57, 118, 15, 0]]
      .forEach(([sd, ah, dia, tint]) => addCast(sd, ah, -400, dia, tint));
    // three juveniles overtake to starboard (the design's beat: the nearest 8.5 m off) in an even stagger, at one speed
    // (6 m/s faster than we fly): they start astern, 3, 9 and 15 m behind the entry, and run on ahead until they are
    // lost in the herd
    for (let k = 0; k < 3; k++) addCast(-8.5 - k, -3 - 6 * k, 300, 3.6 + 0.3 * k, k, { juv: true });
    // twelve more race in from behind on the last straight, 9 m and more to either side, and peel away before the ring
    for (let k = 0; k < 12; k++) {
      const sd = k % 2 ? 1 : -1, row = Math.floor(k / 2);
      cast.push({ u0: 0.8, side: sd * (10.5 + 3 * (row % 3)), ahead0: -6 - 6 * row - 3 * (k % 2), rate: 0, R: (3.9 + 0.28 * (k % 4)) / 2, t: tintOf(k % 3, 0), seed: rr(), ph: rr() * TAU, juv: true, peel: sd, hold: 24 + 8 * row + 3 * (k % 2) });
    }
    await ctx.yield();

    // ---- the elders of the river. Between the files, in lanes of their own, roll the old ones (26 to 40 m): each holds a
    // seeded place in its lane and rolls at its lane's speed for the whole flight, as every hoop of the herd does. The
    // lanes under the high part of our route carry the lesser of them (they pass beneath us), the lanes toward the sun
    // and the Wheel the greatest (they roll beside us).
    for (const [li, dMin, dMax] of [[23, 30, 40], [26, 28, 38], [28, 26, 36], [31, 26, 32], [33, 24, 30], [36, 24, 30], [38, 24, 29], [41, 24, 30], [43, 26, 32]]) {
      const laneL = L_MIN + 9 * li - 2.6, laneV = rv.range(24, 27.5), step = WIN / 5;
      let s0 = rv() * step;
      for (let n = 0; n < 5; n++) {
        const dia = rv.range(dMin, dMax), t = tintOf((n + Math.round(li * 2)) % 3, rv.range(-1, 1));
        hoops.push({ R: dia / 2, l: laneL, s0: s0 + rv.range(-0.22, 0.22) * step, v: laneV, juv: false, elder: true, seed: rv(), ph: rv() * TAU, lean0: rv.range(8, 14) * DEG, tr: t[0], tg: t[1], tb: t[2] });
        s0 += step;
      }
    }
    // ---- the Wheel's escorts: five that roll at its own speed in lanes beside its track, at even spacing fore and aft
    // of its contact, alternately to port and to starboard; lanes, sizes and tints from the seed, the same all flight
    const escorts = [];
    for (let k = 0; k < 5; k++) {
      const port = k % 2 === 0, li = port ? er.int(11, 13) : er.int(1, 3);
      escorts.push({ dx: -190 + 95 * k + er.range(-14, 14), z: -60 + 9 * li - 2.6, R: port ? er.range(7, 15) : er.range(9, 16), t: tintOf(herdKey === 'autumn' ? k % 2 : (k + er.int(0, 2)) % 3, 0), seed: er(), ph: er() * TAU });
    }
    const windDir = new THREE.Vector2(-0.94, -0.34);
    const tmpT = new THREE.Vector3(), tmpP = new THREE.Vector3(), size = new THREE.Vector2();
    const L = path.length, G = 9.8;
    let twinOff = 0;
    if (twin) {       // the twin's eye must stand on our line as we cross its plane
      let uc = U_EYE; const zc = TWIN_Z + 101 * tl * TWIN_S + 1;
      for (let i = 0; i < 400 && path.pointAt(uc, tmpP).z > zc; i++) uc += 0.0005;
      twinOff = tmpP.x - wheelX(uc) + 3;
    }
    // every hoop near enough goes to the near pool, the middle distance to the mid pool, the rest are quads
    const place = (x, z, h, R, roll, lean, hop, seed, tr, tg, tb, fade, cam) => {
      const dx = x - cam.x, dy = R - cam.y, dz = z - cam.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < (R > 11.5 ? R * 9.5 : 44 + R * 4) && nearPool.push(x, z, h, R, roll, lean, hop, seed, tr, tg, tb, fade)) return;
      if (d < 330 && midPool.push(x, z, h, R, roll, lean, hop, seed, tr, tg, tb, fade)) return;
      farPool.push(x, z, h, R, roll, lean, hop, seed, tr, tg, tb, fade);
    };
    const bigX = new Float32Array(24), bigZ = new Float32Array(24), bigH = new Float32Array(24), bigR = new Float32Array(24); let nBig = 0;
    // The gust (B): its front is a LINE IN THE WORLD, square to the wind. It is fixed by ONE place: where it stands as the
    // flight begins, FRONT_BEHIND metres upwind of the entry portal; from there it runs downwind 60 m for every second
    // of the flight (a second of flight is u times the duration, so the beat holds at any flight speed, as the Wheel's
    // meeting does). The arithmetic: 7 s into the flight (u 0.14) we are 303 m downwind of the portal and the front has
    // run 420 m, so it starts 420 - 303 = 117 m behind the portal; it comes up on us at 60 - 47 = 13 m/s, passes over
    // and round us as the design's B begins, and runs on ahead toward the Wheel. The wave of lean is at its foot and
    // the bank of salt smoke stands on it.
    const FRONT_V = 60, FRONT_BEHIND = 117;
    const FRONT_W0 = path.start.x * windDir.x + path.start.z * windDir.y - FRONT_BEHIND, FRONT_LAT = path.start.x * -windDir.y + path.start.z * windDir.x;
    const frontAt = (u) => FRONT_W0 + FRONT_V * DUR * u;
    // its strength belongs to its own run: it gathers over its first 300 m and is spent between 80 and 380 m beyond the Wheel's foot
    const gustAt = (u) => sstep(0, 300, FRONT_V * DUR * u) * (1 - sstep(80, 380, frontAt(u) - wheelX(u) * windDir.x));
    // the lean wave: nil 25 m ahead of the line (no hoop leans before the front's foot has reached it), a long tail behind
    const waveE = (d) => d > 0 ? d / 12 : d / 560;
    let frontW = FRONT_W0, gust = 0;
    // The entry's cast. Each hoop's place beside our way in, at its own constant ground speed:
    const castQ = { x: 0, z: 0 }, castQ2 = { x: 0, z: 0 };
    const castTrack = (c, u, out) => {
      const d = L * u + c.ahead0 + c.rate * u;
      path.posAtDist(d, tmpP); path.tangentAtDist(d, tmpT);
      const n = Math.hypot(tmpT.x, tmpT.z) || 1;
      out.x = tmpP.x + tmpT.z / n * c.side; out.z = tmpP.z - tmpT.x / n * c.side; return out;
    };
    // ... and the moment the front's foot reaches it (uc), where it then stands in the herd's flow (sc), the nearest line
    // between two files there (lc: the cast rolls between the files, as the herd's juveniles do, so it runs through no
    // one), its ground speed (vg) and the stretch over which it eases onto that line (du: a turn and a half of its rim)
    for (const c of cast) {
      if (c.hold !== undefined) continue;
      const ahead = (u) => { castTrack(c, u, castQ); return castQ.x * windDir.x + castQ.z * windDir.y - frontAt(u); };
      let a = 0, b = 1;
      if (ahead(0) <= 0) b = 0; else for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ahead(m) > 0) a = m; else b = m; }
      c.uc = b; castTrack(c, b, castQ);
      c.sc = flowS(castQ.x, castQ.z);
      const lc = flowL(castQ.x, castQ.z); let best = 1e9; c.lc = lc;
      for (const ll of laneLs) if (Math.abs(ll + 4.5 - lc) < best) { best = Math.abs(ll + 4.5 - lc); c.lc = ll + 4.5; }
      c.vg = (L + c.rate) / DUR; c.du = 1.5 * TAU * c.R / (c.vg * DUR);
    }
    // its place at u: beside our way until the front has passed it, then eased onto its lane, rolling on at the same speed
    const castAt = (c, u, out) => {
      if (u <= c.uc) return castTrack(c, u, out);
      const k = sstep(0, c.du, u - c.uc), f = flowAt(c.sc + c.vg * DUR * (u - c.uc), c.lc), fx = f.x, fz = f.z;
      if (k >= 1) { out.x = fx; out.z = fz; return out; }
      castTrack(c, u, out); out.x = mix(out.x, fx, k); out.z = mix(out.z, fz, k); return out;
    };
    const updateHerd = (time, u, cam) => {
      nearPool.n = midPool.n = farPool.n = 0;
      const wx = wheelX(u), dCam = u * L;
      gust = gustAt(u); frontW = frontAt(u);
      smokeU.uFront.value.set(frontW, gust);
      const bankK = 1 + sstep(540, 960, FRONT_V * DUR * u);      // the bank gathers salt as it runs: 10 m tall where it catches us, 20 m from half a kilometre on
      smokeU.uWall.value.set(frontW, FRONT_LAT, 10 * bankK, gust); groundU.uBankK.value = bankK;
      U.uFrontA.value.set(windDir.x, windDir.y, frontW, gust);
      groundU.uGale.value.z = frontW; groundU.uGale.value.w = gust;
      smokeU.uSmoke.value.set(windDir.x, windDir.y, 0.26 + 0.9 * gale, gust * 0.4);      // thin threads everywhere, thick by the front
      nBig = 0;
      const sCam = flowS(cam.x, cam.z);
      for (const c of cast) {
        if (u < c.u0) continue;
        if (c.hold === undefined) {      // the entry's cast
          castAt(c, u, castQ); castAt(c, u + 2e-4, castQ2);
          const x = castQ.x, z = castQ.z, h = Math.atan2(castQ2.z - z, castQ2.x - x), joined = sat((u - c.uc) / c.du);
          const sRel = flowS(x, z) - sCam, fade = Math.min(sstep(-650, -540, sRel), sstep(1050, 900, sRel));      // the herd's own window
          if (fade <= 0) continue;
          const pw = x * windDir.x + z * windDir.y, e = waveE(pw - frontW), wave = gust * Math.exp(-e * e);
          const lean = 0.03 * Math.sin(time * 1.7 + c.ph) + 0.26 * gale + wave * 0.23 + joined * Math.min(0.2, Math.atan(c.vg * c.vg * flow.k / G));
          const hop = c.juv ? 0.55 * Math.abs(Math.sin(time * 4.3 + c.ph)) : 0;
          if (c.R >= 6 && nBig < 24) { bigX[nBig] = x; bigZ[nBig] = z; bigH[nBig] = h; bigR[nBig++] = c.R; }
          const roll = ((L * u + c.ahead0 + c.rate * u) / c.R) % TAU;      // its roll is its own travel over the ground
          const tr = c.juv ? mix(c.t[0], 1, 0.3) : c.t[0], tg = c.juv ? mix(c.t[1], 1, 0.3) : c.t[1], tb = c.juv ? mix(c.t[2], 1, 0.3) : c.t[2];
          if (Math.hypot(x - cam.x, z - cam.z) < 250 && nearPool.push(x, z, h, c.R, roll, lean, hop, c.seed, tr, tg, tb, fade)) continue;
          place(x, z, h, c.R, roll, lean, hop, c.seed, tr, tg, tb, fade, cam);
          continue;
        }
        // the twelve juveniles of the last straight
        const ahead = mix(c.ahead0, c.hold, sstep(c.u0, c.u0 + 0.055, u)) + 3 * Math.sin(time * 0.6 + c.ph) + 90 * Math.max(0, u - 0.93);
        const d = dCam + ahead;
        path.posAtDist(d, tmpP); path.tangentAtDist(d, tmpT);
        const h = Math.atan2(tmpT.z, tmpT.x), sh = Math.sin(h), ch = Math.cos(h);
        let side = c.side, lean = 0.03 * Math.sin(time * 1.7 + c.ph) + 0.26 * gale;
        if (c.peel) { const k = sat((u - 0.955) / 0.045); side += c.peel * k * k * 46; lean += -c.peel * 0.3 * Math.sin(Math.PI * Math.min(1, k * 1.6)); }
        const x = tmpP.x + sh * side, z = tmpP.z - ch * side;
        const hop = 0.55 * Math.abs(Math.sin(time * 4.3 + c.ph));
        nearPool.push(x, z, h, c.R, ((time * 27 + d) / c.R) % TAU, lean, hop, c.seed, mix(c.t[0], 1, 0.3), mix(c.t[1], 1, 0.3), mix(c.t[2], 1, 0.3), 1);
      }
      // the Wheel's escorts roll at its speed beside its track
      for (const e of escorts) {
        const x = wx + e.dx, ew = waveE(x * windDir.x + e.z * windDir.y - frontW);
        const lean = 0.03 * Math.sin(time * 1.1 + e.ph) + 0.26 * gale + gust * 0.2 * Math.exp(-ew * ew);
        nearPool.push(x, e.z, Math.PI, e.R, ((XQ - x) / e.R) % TAU, lean, 0, e.seed, e.t[0], e.t[1], e.t[2], 1);
      }
      for (let i = 0; i < hoops.length; i++) {
        const o = hoops[i];
        if (o.rest) {
          const q0 = o;      // (the same hoop under a second name, for the resting branch alone: with one name for both branches the script engine made a heap number of every number read from a hoop, about a megabyte of garbage a frame; do not fold it back into o)
          let lean, h = q0.h0, hop = 0.12, roll = q0.ph;
          if (q0.spin) {      // coin-settle, closed form: tilt = tilt0 * (1 - s)^0.33, precession capped
            const s = (time / q0.period + q0.ph) % 1;
            const pr = q0.prec || 40;
            if (s < 0.72) { const q = s / 0.72; lean = (90 - 60 * Math.cbrt(1 - q)) * DEG; h += pr * (1 - Math.sqrt(1 - Math.min(q, 0.965))); } else if (s < 0.84) { lean = 90 * DEG; h += pr * 0.813; } else { const q = sstep(0.84, 1, s); lean = (90 - 60 * q) * DEG; h = q0.h0 + pr * 0.813 * (1 - q); }
            if (q0.elder) roll = q0.ph * 9 + h * 0.8;
            hop = 0.12 * sstep(40 * DEG, 88 * DEG, lean);
          } else if (q0.prop) {      // a sleeper propped on its rim, rocking in the wind
            lean = q0.prop + 0.075 * Math.sin(time * 0.8 + q0.ph) + 0.03 * Math.sin(time * 2.1 + q0.ph * 1.7);
            h += 0.06 * Math.sin(time * 0.55 + q0.ph * 0.6); hop = 0;
          } else lean = (88.5 + 1.2 * Math.sin(time * 0.9 + q0.ph)) * DEG;
          if (q0.elder && Math.hypot(q0.x - cam.x, q0.z - cam.z) < 520 && nearPool.push(q0.x, q0.z, h, q0.R, roll, lean, hop, -q0.seed - 0.01, q0.tr, q0.tg, q0.tb, 1)) continue;      // the elders of the way in are always whole glass (a property of the animal, not of where we are)
          // (place and the pool's push written out here, the same tests in the same order: no number is boxed for a call)
          const R = q0.R, dx = q0.x - cam.x, dy = R - cam.y, dz = q0.z - cam.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          let pl = nearPool;
          if (!(d < (R > 11.5 ? R * 9.5 : 44 + R * 4)) || pl.n >= pl.cap) { pl = midPool; if (!(d < 330) || pl.n >= pl.cap) { pl = farPool; if (pl.n >= pl.cap) continue; } }
          const j = pl.n++ * 4, A = pl.a.array, B = pl.b.array, C = pl.c.array;
          A[j] = q0.x; A[j + 1] = q0.z; A[j + 2] = h; A[j + 3] = R;
          B[j] = roll; B[j + 1] = lean; B[j + 2] = hop; B[j + 3] = -q0.seed - 0.01;
          C[j] = q0.tr; C[j + 1] = q0.tg; C[j + 2] = q0.tb; C[j + 3] = 1;
          continue;
        }
        const sAbs = o.s0 + o.v * time;
        const sRel = (((sAbs - sCam + 650) % WIN) + WIN) % WIN - 650;
        const f = flow, s = sCam + sRel, l = o.l;       // every hoop keeps its lane (flowAt written out, with its own stores)
        if (s >= 0) { flow.x = XQ - s; flow.z = ZC + l; flow.h = Math.PI; flow.k = 0; } else if (s > -LA) {
          const th = -s / RC, r = RC - l;
          flow.x = XQ + r * Math.sin(th); flow.z = ZC + RC - r * Math.cos(th); flow.h = Math.PI + th; flow.k = 1 / RC;
        } else {
          const b = -LA - s;
          flow.x = S0x - E0.x * b - 0.5 * l; flow.z = S0z - E0.z * b + 0.866 * l; flow.h = Math.PI + 30 * DEG; flow.k = 0;
        }
        let x = f.x, z = f.z, fade = Math.min(sstep(-650, -540, sRel), sstep(1050, 900, sRel));
        // keep out of the Wheel's track (and its twin's)
        const wk = sstep(300, 170, Math.abs(x - wx));
        if (wk > 0) {
          if (z > -14 && z < 17) z = mix(z, z > 1.5 ? 17 : -14, wk);
          if (twin && z > TWIN_Z - 14 && z < TWIN_Z + 17) z = mix(z, z > TWIN_Z + 1.5 ? TWIN_Z + 17 : TWIN_Z - 14, wk);
          for (const e of escorts) { const ek = sstep(e.R * 2 + 70, e.R * 2 + 20, Math.abs(x - wx - e.dx)), h = e.R + o.R + 3; if (ek > 0 && z > e.z - h && z < e.z + h) z = mix(z, z > e.z ? e.z + h : e.z - h, ek); }      // and the lanes of its escorts
        }
        // the herd gives way to the scripted elders: no hoop rolls through one of them
        for (let b = 0; b < nBig; b++) {
          const ex = x - bigX[b], ez = z - bigZ[b], reach = bigR[b] + o.R + 3;
          if (ex > reach || ex < -reach || ez > reach || ez < -reach) continue;
          const ch = Math.cos(bigH[b]), sh = Math.sin(bigH[b]), al = ex * ch + ez * sh, lt = -ex * sh + ez * ch, k = sstep(reach, reach - 5, Math.abs(al));
          if (Math.abs(lt) < 5) { const d = ((lt < 0 ? -5 : 5) - lt) * k; x += -sh * d; z += ch * d; }
        }
        // and out of the route's corridor where it runs low (a fixed tube in the world): slide sideways, never across it
        // (push is called only where its own first test, at(x, z) < 0, would not send it straight back with nothing done)
        if (!(corridorW.at(x, z) < 0) && corridorW.push(x, z, o.R, o.juv, o.seed)) { x = pushed.x; z = pushed.z; }
        if (!(corridorWheel.at(x - wx, z) < 0) && corridorWheel.push(x - wx, z, o.R, o.juv, o.seed)) { x = pushed.x + wx; z = pushed.z; }
        const pw = x * windDir.x + z * windDir.y, e = waveE(pw - frontW);
        const lean = Math.atan(o.v * o.v * f.k / G) * 1.6 + 0.26 * gale + gust * o.lean0 * 1.25 * Math.exp(-e * e) + 0.035 * Math.sin(time * 1.3 + o.ph);
        const hop = o.juv ? 0.5 * Math.abs(Math.sin(time * 4.1 + o.ph)) : 0;
        const R = o.R, dx = x - cam.x, dy = R - cam.y, dz = z - cam.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);      // (place and the pool's push, as above)
        let pl = nearPool;
        if (!(d < (R > 11.5 ? R * 9.5 : 44 + R * 4)) || pl.n >= pl.cap) { pl = midPool; if (!(d < 330) || pl.n >= pl.cap) { pl = farPool; if (pl.n >= pl.cap) continue; } }
        const j = pl.n++ * 4, A = pl.a.array, B = pl.b.array, C = pl.c.array;
        A[j] = x; A[j + 1] = z; A[j + 2] = f.h + 0.02 * Math.sin(time * 0.6 + o.ph); A[j + 3] = R;
        B[j] = (sAbs / o.R) % TAU; B[j + 1] = lean; B[j + 2] = hop; B[j + 3] = o.seed;
        C[j] = o.tr; C[j + 1] = o.tg; C[j + 2] = o.tb; C[j + 3] = fade;
      }
      nearPool.flush(); midPool.flush(); farPool.flush();
    };

    const WHEEL_Y = 96;
    const hubAt = new THREE.Vector3(), bowlAt = new THREE.Vector3(), camW = new THREE.Vector3(), eyeAt = new THREE.Vector3(), eyeAt2 = new THREE.Vector3();
    const carpetP = new THREE.Vector3(), carpetQ = new THREE.Vector3(), carpetT = new THREE.Vector3();
    // The gaze over the river (C) is tied to our height alone: as we top the climb it drops from the Wheel to the pan on
    // the sun's side, where every hoop of the files is seen face on and backlit with its window of light lying toward
    // us; as we come down again it rises back to the Wheel.
    const riverK = (u) => sstep(47, 59, path.pointAt(u, carpetP).y);
    const carpetDir = new THREE.Vector2(sunDir.x + 0.37, sunDir.z).normalize();
    const carpetAt = (u, out) => { path.pointAt(u, out); out.x += carpetDir.x * 112; out.z += carpetDir.y * 112; out.y = 0; return out; };
    const eyeFwd = path.tangentAt(U_EYE, new THREE.Vector3()).normalize();      // our heading through the eye
    const EYE_FADE = 0.09, W_EYE = EYE_FADE * (U_EYE - 0.002 - (U_BEAD - 0.03));      // the eye pull's rise and fall, in u
    // The two moments the first two looks turn on: events of the world, each worked out once from places and speeds.
    // U_GUST, the gust front's line passes the lens. The front runs FRONT_V * DUR metres along the wind per unit of u, more
    // than the whole route is long: it stands behind us at the entry, ahead of us at the ring, and passes us once. The root,
    // by bisection over the whole flight, of the front's place less our own place along the wind (formed as FRONT_W0 is).
    const frontPast = (u) => { path.pointAt(u, tmpP); return frontAt(u) - (tmpP.x * windDir.x + tmpP.z * windDir.y); };
    let U_GUST = 1;
    for (let a = 0, i = 0; i < 30; i++) { const m = (a + U_GUST) / 2; if (frontPast(m) < 0) a = m; else U_GUST = m; }
    // U_SHADE, the lens enters the Wheel's shadow: the straight line from the lens toward the sun passes through the Wheel's
    // disc where the Wheel stands at that u (the hub anchor carried to wheelX(u), the disc's own normal, the hero's own radius).
    const inShade = (u) => {
      const hub = hero.anchors.hub, n = hero.anchors.discNormal; path.pointAt(u, tmpP);
      const hx = wheelX(u) + hub.x - tmpP.x, hy = hub.y - tmpP.y, hz = hub.z - tmpP.z, t = (hx * n.x + hy * n.y + hz * n.z) / sunDir.dot(n);
      return t > 0 && Math.hypot(sunDir.x * t - hx, sunDir.y * t - hy, sunDir.z * t - hz) < hero.height / 2;
    };
    // (the route is walked from the entry at even steps of 2 m; each step that goes from sun into shadow is bisected, and the
    // first such moment after the gust is the one; the walk's own end stands for never)
    let U_SHADE = 1;
    for (let d = 2, was = inShade(0); d <= L && U_SHADE === 1; d += 2) {
      const now = inShade(d / L);
      if (now && !was) { let a = (d - 2) / L, b = d / L; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (inShade(m)) b = m; else a = m; } if (b > U_GUST) U_SHADE = b; }
      was = now;
    }
    const title = rare ? 'Hoopwind, Two Wheels' : hourKey === 'night' ? 'Hoopwind by Moonlight' : weather === 'gale' ? 'Hoopwind in a Salt Gale' : weather === 'rain' ? 'Hoopwind after Rain' : spring ? 'Hoopwind in Spring' : HERD.name;
    await ctx.yield();
    updateHerd(0, 0, path.start);
    await ctx.yield();

    return {
      scene, path, duration: DUR, title,
      pace: paceOf,
      camera: { fov: 62, near: 0.4, far: 6000, lookAhead: 24, sway: 0.5, bank: 0.45 },
      pois: [
        // From the gust until we enter its shadow (B to D) the gaze holds ONE point of the Wheel: the middle of its face,
        // under the eye. Only our own height turns it away, down to the river, at the top of the climb (see riverK).
        // (Far off, the point is the Wheel's foot, where the gust front is running to: the herd leaning before the bank fills
        // the lower frame and the Wheel stands over it. As the Wheel grows the gaze climbs its face, by our distance from it.)
        { at: (time, u) => { const hub = hero.anchors.hub; path.pointAt(u, carpetP); const wy = mix(WHEEL_Y, 6, sstep(400, 520, Math.hypot(carpetP.x - wheelX(u), carpetP.z))); hubAt.set(wheelX(u) + hub.x, wy, hub.z * wy / hub.y); const k = riverK(u); if (k > 0) { hubAt.lerp(carpetAt(u, carpetQ), k); hubAt.y -= 240 * k * (1 - k); } return hubAt; }, from: U_GUST, to: U_SHADE, weight: 0.9, fade: 0.2 },
        // E (the contact, the design's fourth frame): we look ALONG the rim, a little to port of it, so the terraced rim comes in
        // over our right shoulder, sweeps down to the contact and away up its fore arc, the bead in its window just beyond
        // the contact, the membrane a wedge of backlit glass on the right and the pan open on the left
        { at: (time, u) => bowlAt.set(wheelX(u) - 60, 11, 23), from: U_SHADE, to: U_BEAD + 0.004, weight: 0.9, fade: 0.25 },
        // ONE pull on the eye, from the foot of the climb until we are in the window. Its target moves; no second pull is
        // laid over it. Early in the climb the point runs along the face ahead (veins streaming, the horizon in frame) and
        // swings to the eye as we rise; round the turn at the top it passes (a cross-fade of the POINT, not of two pulls) to
        // the middle of the eye seen a little way through it along our own heading, so the whole window stays in the frame
        // until it is wider than the frame; within 60 m the point passes on through it at our own height: level as we cross.
        { at: (time, u) => {
          const hub = hero.anchors.hub, wxu = wheelX(u);
          const k = sstep(U_BEAD + 0.008, U_TURN - 0.05, u), y = mix(path.pointAt(u, eyeAt2).y + 10, hub.y + 3, k);
          eyeAt.set(wxu + mix(-48, hub.x - 20, k) + 26 * k * (1 - k) * 4 * 0.5, y, hub.z * y / hub.y);
          const h = sstep(U_TURN - 0.02, U_TURN + 0.012, u);
          if (h <= 0) return eyeAt;
          const kn = sstep(62, 30, Math.hypot(eyeAt2.x - wxu - hub.x, eyeAt2.y - hub.y, eyeAt2.z - hub.z));
          eyeAt2.set(wxu + hub.x, hub.y + mix(8, -9, kn), hub.z).addScaledVector(eyeFwd, mix(26, 70, kn));
          return eyeAt.lerp(eyeAt2, h);
        }, from: U_BEAD - 0.03, to: U_EYE - 0.002, weight: 0.9, fade: EYE_FADE },
        // out of the eye the gaze rests on the standing ring while we come down, so the resting ground lies open below it
        // (the ring is seen through the eye, within a few degrees of the eye's own point: the two pulls hand over by a
        // cross-fade, this one rising exactly over the span in which the eye's falls, so their sum is never over 0.9)
        { at: ringPos.clone(), from: U_EYE - 0.002 - W_EYE, to: 0.9, weight: 0.62, fade: W_EYE / (0.9 - (U_EYE - 0.002 - W_EYE)) },
      ],
      portal: { shape: 'circle', radius: 14.3, color: hourKey === 'night' ? '#bfe6ff' : '#a8f5dc', glow: 0.9, revealDistance: 700 },
      post: {
        exposure: HOUR.exposure,
        bloom: { strength: 0.28, radius: 0.6, threshold: 1.1 },
        grade: { saturation: 1.1, contrast: 1.09, tint: '#ffffff', shadowTint: hourKey === 'night' ? '#0a0c22' : '#1a1430', vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      style: 'none',
      update(dt, time, camera, u) {
        U.uTime.value = time;
        ctx.renderer.getDrawingBufferSize(size);
        U.uPix.value = (2 / Math.max(camera.projectionMatrix.elements[5], 0.1) / Math.max(size.y, 1)) * 1.25;
        camW.setFromMatrixPosition(camera.matrixWorld);       // the camera behind a portal has only its world matrix set
        ground.position.set(camW.x, 0, camW.z);
        const wx = wheelX(u);
        hero.object.position.set(wx, 0, 0);
        hero.setRoll((wheelAt[0] - wx) / 110 + 1.1);
        // the pickers scatter as we climb the face, then draw back in and wheel across the eye as we come at it
        const gather = sstep(U_TURN - 0.05, U_TURN + 0.005, u);
        hero.setProgress(sstep(U_FOOT + 0.02, U_TURN - 0.03, u) * (1 - 0.8 * gather)); hero.setGather(gather);
        hero.setFan(1);      // it never stands: the fan is the design's 14 m at every moment
        hero.update(dt, time, camera);
        const hub = hero.anchors.hub;
        U.uWheelA.value.set(wx + hub.x, hub.y, hub.z, 1);
        U.uWheelNA.value.copy(hero.anchors.discNormal);
        if (twin) {
          const tx = wx + twinOff;
          twin.object.position.set(tx, 0, TWIN_Z);
          twin.setRoll((wheelAt[0] - wx) / (110 * TWIN_S) + 2.9);
          twin.setProgress(0.5 * sstep(U_EYE - 0.02, U_EYE + 0.08, u)); twin.setGather(1);
          twin.update(dt, time, camera);
          U.uWheelB.value.set(tx + hub.x * TWIN_S, hub.y * TWIN_S, TWIN_Z + hub.z * TWIN_S, TWIN_S);
          U.uWheelNB.value.copy(hero.anchors.discNormal);
        }
        updateHerd(time, u, camW);
      },
      dispose() { hero.dispose(); if (twin) twin.dispose(); shadowRT.dispose(); },
    };
  },
};
