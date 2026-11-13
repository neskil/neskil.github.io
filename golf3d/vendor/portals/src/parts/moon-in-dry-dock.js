// THE MOON IN DRY DOCK hero: the Moon out of the sky and under repair.
// A 240 m chalk sphere (displaced craters with rims, terraces and central peaks, rays, pits, cracks,
// embedded stones, ring-bolts, a red-chalk survey line, maria of tarnished silver) resting on oak keel
// blocks inside a cradle of larch scaffolding: standards, plank decks with guard rails, patched
// tarpaulins, pennants, ladders, bucket hoists lifting zinc buckets of pale light, mooring ropes down to
// the dock sides. One lune of it (the dock-head side, -Z) is re-silvered to a mirror that bends the sky,
// the sun, the dock, the town and the scaffold across itself; the working edge is a wet seam of silver
// leaf laid square by square, creeping forward. On progress the ropes are slipped one by one (taut, then
// whipping free in a slow S), the cradle's sixteen petals lean outward about their feet, loose planks and
// bilge shores fall, and the Moon lifts 20 m off its blocks, turning and bobbing.
//
// LOCAL SPACE  origin on the dock floor under the Moon's centre, +Y up, +Z = exit course (the gates),
// +X = town side (sun side). Local = brief coordinates + (0, 30, 0): put hero.object at (0, -30, 0).
//   Moon centre (0,128,0), radius 120, lowest point y 8 (on the keel blocks), top y 248.
//   Scaffold: rings of standards at radius 131, 125, 119 ... from the floor up to the equator (y 128);
//   no scaffold in the struck sector at the dock head (anchors.struckSector) nor in the launching gap
//   toward the gates (anchors.gateGap). The silver covers a lune from the north pole down to latitude
//   -54 degrees: the belly is chalk.
//   The dock the world builds must leave the floor clear to radius 134 (walls at |x| >= 136; the opened
//   cradle leans out up to 0.21 rad, about 6 m at quay height, so keep the altar treads shallow).
//
// OPTS
//   palette   7 hex strings (brief order): ochre, terracotta, chalk, silver white, cobalt, slate, bucket light
//   detail    0.6-1 (default ctx.quality.detail): thins stones, far rails, inner standards, tarps, pennants,
//             ladders and dust; never the Moon, the mirror, the gallery, the ropes or the hoists
//   sunDir    [x,y,z] local direction TO the sun (default: the brief's, 27 deg up, bearing 105 deg right of +Z)
//   job       'third' | 'half' (seeded if absent): how much is already silvered
//   journeySeconds  43: seconds that setProgress(1) stands for (fall and whip timing)
//
// HOOKS
//   hero.setProgress(u)   u = 0..1 along the world's path. The forty equator moorings are slipped at the Moon
//                         u 0.62-0.74 and fall away to hang from their bollards; eight short belly ropes beside the
//                         path are slipped at the floor u 0.705-0.79 and hang whipping from the rising belly; the
//                         cradle opens and planks fall u 0.62-0.78, shores clear of the path fall as the camera comes
//                         up to them; the Moon rises 20 m u 0.66-0.76, then turns 2 deg/s, bobs 0.5 m and drifts
//                         down the dock and out over the gates (from u 0.74, about 210 m by u 1, rising another 10 m; hero.drift). Until first called a 40 s demo loops.
//   THE MIRROR            is not a true reflection (that would be the ochre dock under the overhang): the lune shows
//                         one authored panorama by bearing and elevation (sky, cloud, a sun star at uMirSun, the
//                         town on its hill with the bell tower, sea, pale quay), its normal tipped up, plus a sparse
//                         image of the gallery. The seam on the camera's side leans: at gallery height it stands
//                         SEAM_LEAN rad beyond azimuth 139.5 degrees (about 13 m ahead of the lens at u 0.52), on the
//                         dome SEAM_DOME rad short of it, so from the street the dome's right flank is a blade of
//                         mirror with an authored far view (sky gradient, limb clouds, one star); setLight({ mirrorSun })
//                         moves the near star.
//   hero.setLight({ sunDir, sunColor, skyColor, groundColor, zenith, horizon })  THREE.Color / Vector3 /
//                         arrays, linear. All shading is analytic in the hero's own shaders (no scene
//                         lights are read), so match these to the world's key, fill, bounce and sky dome.
//   hero.lift             current rise in metres (0..20.5);  hero.moon  the rising/turning group.
//   hero.uniforms         the shared light uniforms (uSunDir, uSunCol, uSkyCol, uGndCol, uMoonC ...) and
//   hero.glsl             { noise, light, crater } shader chunks, so the world's spare crescents, dock and
//                         quay can be shaded the same way (lightIt() also casts the Moon's shadow).
//
// ANCHORS (local space; add worldOffset [0,-30,0] to get brief coordinates)
//   flyThrough   the brief's 11 waypoints (and one more at z 112, which keeps the run-in to the ring straight) in local space. The scaffold is built with a gallery cut 6.3 m
//                around the centripetal Catmull-Rom through exactly these points (core.makePath), so fly
//                that curve. The last four points pass UNDER the Moon: clear only after the lift (u > 0.78).
//   portalSeat   { position (0,18,165), normal (0,0,-1) } the 14 m ring between the gates
//   moonCenter, keel (lowest point), seamPoint (where the path crosses chalk -> mirror), reveal
//   bollards     [{ position }] the 40 rope feet on the dock sides (seat bollards there)
//   topRail      [{ position }] points on the scaffold's top rail (stand gulls there)
//   hoists       [{ position, top }] bucket hoist feet and sheave heights
//   viewpoints   reveal (300 m off, whole sphere), gallery (6 m off the seam), belly (under the lift)
//
// SIZE radius 150 (viewing radius), height 248.  COST about 146k triangles, 14 draw calls, build about
// 200 ms, no lights, one 64 x 16 byte texture.  LIGHTING: bright morning; warm key from +X, strong blue fill, ochre bounce from below.
// Chalk albedo is capped at 0.70; only the mirror's sun glint and the bucket light exceed 1.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#E9C98A', '#C8643C', '#EEF1F4', '#F8FBFF', '#3E6FA8', '#2B3A4A', '#8FD3E8'];
const R = 120, CY = 128, FLOOR_R = 134;
const NAZ = 96, DAZ = TAU / NAZ;            // scaffold azimuth bays
const RING0 = 131, RING_STEP = 6, LEVEL = 6, NLEV = 21;
const STRUCK = [-2.25, 0.62];               // azimuth centre, half-width of the sector already struck (dock head toward -X)
const GAP = [-0.2, 0.82];                      // toward the gates (+Z) the cradle has been struck too: the launching way, and the camera's view of the gate from under the belly
const SEAM_DOME = 0.6;                      // and this much less far round on the dome above the rail: from the quay, 300 m off, the limb is only 67 degrees
                                            // round from the lens, so the blade of mirror on the dome has to begin about 25 degrees round to be a tenth of the frame
const SEAM_LEAN = 0.16;                     // the seam stands this much further round (rad) at gallery height than on the dome
const LUNE_LAT = -0.64;                     // the silver stops here: under the overhang and on the belly it is still chalk
const CELL1 = 110, CELL2 = 40;              // displaced crater scales (metres per cell)
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const wrapPi = (a) => a - TAU * Math.round(a / TAU);

// ---------------------------------------------------------------- shared GLSL
const GL_NOISE = /* glsl */`
vec3 hash33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float hash13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
float fbm3(vec3 p){ return vnoise(p) * .55 + vnoise(p * 2.07 + 7.1) * .29 + vnoise(p * 4.3 + 3.7) * .16; }
`;

// analytic light shared by every material: key + sky fill + ground bounce + the Moon's own shadow
const GL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uMoonC;
float moonShadow(vec3 p){
  vec3 oc = p - uMoonC; float b = dot(oc, uSunDir); float c = dot(oc, oc) - ${(R * R).toFixed(1)};
  float disc = b * b - c;
  return 1. - smoothstep(0., 900., disc) * step(b, 0.) * step(0., c);
}
vec3 lightIt(vec3 alb, vec3 n, vec3 p, float ao){
  float nl = max(dot(n, uSunDir), 0.);
  float sh = moonShadow(p);
  float up = n.y * .5 + .5;
  return alb * (uSunCol * nl * sh + uSkyCol * (.35 + .65 * up) * ao + uGndCol * (1. - up) * ao);
}
`;

// the cradle opening: each petal's poles lean outward about their own feet (decks stay level and
// ride out with them); loose pieces also fall and tumble
const GL_LEAN = /* glsl */`
uniform float uProg, uSecs;
vec3 rotAx(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
vec3 leanSector(vec3 p, inout vec3 n, float az, float rel){
  float t = max(uProg - rel, 0.) * uSecs;
  if (t <= 0.) return p;
  vec3 o = vec3(sin(az), 0., cos(az));
  vec3 tang = vec3(o.z, 0., -o.x);
  float e = 1. - exp(-t * .55);
  float ang = (.13 + .08 * fract(az * 3.7 + .3)) * e * e + .01 * sin(t * 1.3 + az * 5.) * e;
  n = rotAx(n, tang, ang * step(abs(n.y), .5));
  return vec3(p.x, p.y * cos(ang), p.z) + o * (p.y * sin(ang));
}
`;
const GL_CRADLE = /* glsl */`
attribute vec4 aFx;   // sector azimuth, release u, random, kind (0 pole, 1 deck, 2 loose, 3 plain)
vec3 cradle(vec3 p, inout vec3 n, vec3 ctr){
  if (aFx.w > 1.5 && aFx.w < 2.5) {
    // loose: ballistic fall with tumble, coming to rest on the floor
    float t = max(uProg - aFx.y, 0.) * uSecs;
    if (t <= 0.) return p;
    vec3 o = vec3(sin(aFx.x), 0., cos(aFx.x));
    vec3 tang = vec3(o.z, 0., -o.x);
    float tt = min(t, sqrt(max(ctr.y - .25, 0.) / 2.75));
    vec3 axis = normalize(vec3(aFx.z - .5, .35, fract(aFx.z * 7.3) - .5));
    float ang = tt * (1.5 + aFx.z * 2.5);
    vec3 q = ctr + rotAx(p - ctr, axis, ang);
    n = rotAx(n, axis, ang);
    q += o * (2. + 5. * aFx.z) * tt + tang * (fract(aFx.z * 13.7) - .5) * 3. * tt;
    q.y -= 2.75 * tt * tt;
    return q;
  }
  return leanSector(p, n, aFx.x, aFx.y);
}
`;

// crater field: two table-driven scales (shared with JS so stones and bolts sit on the displaced surface)
// and three hashed fine scales (fragment only). xyz = slope vector, w = height in metres.
const GL_CRATER = /* glsl */`
uniform sampler2D uCrTab;
float prof(float t, float pk){
  float w = smoothstep(.5, 1., t);
  float wt = w + .1 * sin(w * 18.85) * (1. - w) * w;
  float h = t < 1. ? mix(-.17, .05, wt) : .05 * exp(-(t - 1.) * 5.) * (1. - smoothstep(1.2, 1.5, t));
  return h + pk * .07 * exp(-t * t * 28.);
}
vec4 crTab(vec3 p, float row, float cellM, out float ray){
  vec3 b = floor(p - .5); vec4 acc = vec4(0.); ray = 0.;
  for (int i = 0; i < 8; i++) {
    vec3 c = b + vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));
    vec3 m = mod(c, 8.);
    vec4 tx = textureLod(uCrTab, (vec2(m.x + 8. * m.y, m.z + row) + .5) / vec2(64., 16.), 0.);
    float rad = .16 + .17 * tx.a;
    vec3 dv = p - (c + tx.rgb); float r = length(dv); float t = r / rad;
    if (t < 1.5) {
      float pk = step(.5, tx.a);
      acc.w += prof(t, pk) * rad * cellM;
      acc.xyz += (prof(t + .02, pk) - prof(t - .02, pk)) * 25. * dv / max(r, 1e-4);
    }
    // rays of thrown dust round the younger craters
    if (t > .75 && r < .5 && fract(tx.r * 7.31 + tx.g * 3.17) > .62) {
      vec3 dn = dv / max(r, 1e-4);
      float streak = vnoise(dn * 9. + tx.rgb * 40.) * vnoise(dn * 23. + 5.);
      ray += smoothstep(.16, .5, streak) * smoothstep(.75, 1.05, t) * (1. - smoothstep(.2, .5, r)) * 2.2;
    }
  }
  return acc;
}
vec4 crHash(vec3 p, float seed){
  vec3 b = floor(p - .5); vec4 acc = vec4(0.);
  for (int i = 0; i < 8; i++) {
    vec3 c = b + vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));
    vec3 h = hash33(c + seed);
    float rad = .14 + .19 * h.x * h.y * 2.;
    rad = min(rad, .33);
    vec3 dv = p - (c + h.yzx); float r = length(dv); float t = r / rad;
    if (t < 1.5) {
      acc.w += prof(t, 0.) * rad;
      acc.xyz += (prof(t + .03, 0.) - prof(t - .03, 0.)) * 16.67 * dv / max(r, 1e-4);
    }
  }
  return acc;
}
`;

// ---------------------------------------------------------------- the Moon's shader
const MOON_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform mat4 uMoonMat;
uniform float uRad, uMode, uLuneLat;
uniform vec3 uLune;   // centre azimuth, half-width (rad), extra creep in metres
varying vec3 vDir, vHp, vLoc; varying vec2 vEdge;
${GL_NOISE}
${GL_CRATER}
void main(){
  vEdge = uMode > .5 ? uv : vec2(0.);
  vec3 d = normalize(position);
  vec3 P = d * uRad;
  float ray;
  vec4 c1 = crTab(P / ${CELL1.toFixed(1)}, 0., ${CELL1.toFixed(1)}, ray);
  vec4 c2 = crTab(P / ${CELL2.toFixed(1)}, 8., ${CELL2.toFixed(1)}, ray);
  float h = c1.w + c2.w;
  float rho = uRad * sqrt(max(1. - d.y * d.y, 0.));
  float phi = (abs(d.x) + abs(d.z) < 1e-5) ? 0. : atan(d.x, d.z);
  float a = phi - uLune.x; a -= 6.2831853 * floor(a / 6.2831853 + .5);
  float s = max((abs(a) - uLune.y + ${SEAM_LEAN.toFixed(3)} - ${(SEAM_LEAN + SEAM_DOME).toFixed(3)} * smoothstep(-.42, .02, d.y)) * rho, (uLuneLat - asin(clamp(d.y, -1., 1.))) * uRad) - uLune.z;
  if (uMode < .5) h *= smoothstep(-7., 1.5, s);     // the silvered lune is a true sphere
  else h *= .35;
  vec3 p = position + d * h;
  vDir = d; vLoc = position;
  vHp = (uMoonMat * vec4(p, 1.)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const MOON_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform mat4 uMoonMat, uRootInv;
uniform float uRad, uMode, uTime, uOpen, uSurveyY, uLuneLat;
uniform vec3 uLune, uSeedV, uChalk, uSilver, uOchre, uTerra, uSea, uZen, uHor;
uniform vec2 uStruck, uGap;
uniform vec3 uSelf, uGlow;
uniform sampler2D uPits;     // p1: the pit sheet (one channel, tileable, mip-mapped; 128 is its mean)
varying vec3 vDir, vHp, vLoc; varying vec2 vEdge;
${GL_NOISE}
${GL_LIGHT}
${GL_CRATER}
float angDiff(float a, float b){ float x = a - b; return x - 6.2831853 * floor(x / 6.2831853 + .5); }
float sectorOn(float az){
  float m = step(uStruck.y, abs(angDiff(az, uStruck.x)));
  return m * step(uGap.y, abs(angDiff(az, uGap.x)));
}
// where a ray from P along dir meets the scaffold shell (a cylinder of radius rc):
// x = pole and deck lines, y = tarpaulin, z = that bay's hash
vec3 scaf(vec3 P, vec3 dir, float rc, float wPole, float wDeck, float aa){
  float a = dot(dir.xz, dir.xz);
  if (a < 1e-5) return vec3(0.);
  float b = dot(P.xz, dir.xz), c = dot(P.xz, P.xz) - rc * rc;
  if (c > 0.) return vec3(0.);
  float t = (-b + sqrt(max(b * b - a * c, 0.))) / a;
  vec3 Q = P + dir * t;
  float az = atan(Q.x, Q.z);
  float ca = az / ${DAZ.toFixed(6)};
  float fa = abs(fract(ca) - .5) * ${(DAZ * 128).toFixed(3)};
  float fy = abs(fract(Q.y / 6. + .5) - .5) * 6.;
  float ln = max(1. - smoothstep(wPole, wPole + aa, fa), 1. - smoothstep(wDeck, wDeck + aa, fy));
  float m = step(0., Q.y) * (1. - smoothstep(${(CY - 1).toFixed(1)}, ${(CY + 1).toFixed(1)}, Q.y)) * sectorOn(az);
  float th = hash13(vec3(floor(ca + .5), floor(Q.y / 6.), rc));
  float u = fract(ca + .5), v = fract(Q.y / 6.);
  float tp = step(.84, th) * step(20., Q.y) * smoothstep(.03, .08, u) * smoothstep(.97, .92, u) * smoothstep(.04, .09, v) * smoothstep(.95, .9, v);
  return vec3(ln * m, tp * m, th);
}
// the gallery as the mirror shows it: one standard in three, one deck in two, the odd tarpaulin (x lines, y tarp, z hash)
vec4 scafM(vec3 P, vec3 dir, float aa){
  float a = dot(dir.xz, dir.xz);
  if (a < 1e-5) return vec4(0.);
  float b = dot(P.xz, dir.xz), c = dot(P.xz, P.xz) - 17161.;
  if (c > 0.) return vec4(0.);
  float t = (-b + sqrt(max(b * b - a * c, 0.))) / a;
  vec3 Q = P + dir * t;
  float az = (abs(Q.x) + abs(Q.z) < 1e-4) ? 0. : atan(Q.x, Q.z);
  float ca = az / ${(DAZ * 3).toFixed(6)};
  float fa = abs(fract(ca) - .5) * ${(DAZ * 3 * 131).toFixed(3)};
  float ln = 1. - smoothstep(.2, .2 + aa, fa);
  float m = step(0., Q.y) * (1. - smoothstep(${(CY - 1).toFixed(1)}, ${(CY + 1).toFixed(1)}, Q.y)) * sectorOn(az);
  float c1 = az / ${DAZ.toFixed(6)};
  float th = hash13(vec3(floor(c1 + .5), floor(Q.y / 6.), 131.));
  float u = fract(c1 + .5), v = fract(Q.y / 6.);
  float tu = (u - .22) / .56, tv = (v - .14) / .72;
  float tin = step(20., Q.y) * step(0., tu) * step(tu, 1.) * step(0., tv) * step(tv, 1.);
  float sx = abs(fract(tu * 3. + .5) - .5), sy = abs(fract(tv * 2. + .5) - .5);
  float seam = 1. - smoothstep(.02, .06, min(sx, sy * 1.4));
  float tp = tin * max((.74 + .26 * sin(tu * 8. + th * 40. + uTime * 2.2)) * (1. - .5 * seam) * (.7 + .3 * tv), .25);   // seamed, bellying, darker at the foot
  float cb = az / ${(DAZ * 6).toFixed(6)}, bid = floor(cb), bx = (fract(cb) - .5) * ${(DAZ * 6 * 131).toFixed(3)};
  float by = Q.y - (18. + mod(uTime * 3. + hash13(vec3(bid, 1., 2.)) * 80., 80.));
  float bk = exp(-(bx * bx + by * by) * .22) * m;
  return vec4(ln * m, tp * m, th, bk);
}
// The mirror's picture of the harbour. A true reflection from under the overhang is the ochre dock below us,
// which reads as a tan wall, so the lune carries one continuous authored panorama by bearing and elevation:
// sky, drifting cloud and one sun star over a clean horizon; under it the town climbing its hill (seaward:
// the sea, glittering), then the pale quay, the ground squeezed up toward the horizon as a ball squeezes it.
uniform vec3 uMirSun; uniform float uMirTip;
vec3 envSky(vec3 r){
  float y = max(r.y, 0.);
  vec3 c = mix(uHor, uZen, min(sqrt(y) * 1.08, 1.));
  vec2 q = r.xz / (y + .16) * 1.3 + vec2(uTime * .012, 0.);
  float cl = fbm3(vec3(q, 2.5)) * smoothstep(.02, .2, y);
  c = mix(c, vec3(1.08, 1.05, 1.02), smoothstep(.47, .7, cl) * .9);
  float sd = max(dot(r, uMirSun), 0.);
  float s2 = sd * sd; float s8 = s2 * s2 * s2 * s2; float s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
  c += uSunCol * (smoothstep(.9992, .9998, sd) * 16. + s64 * s64 * s64 * s64 * s64 * s64 * 1.1 + s64 * .05);
  return c;
}
// gulls crossing the panorama: x = mask, y = 1 toward the wing tips
vec2 gullM(float phi, float el, float k){
  float pb = -2.6 - .55 * k + .4 * sin(uTime * .23 + k * 1.7);
  float eb = .13 + .09 * k + .05 * sin(uTime * .37 + k * 4.);
  float x = angDiff(phi, pb) / .1;
  float ax = min(abs(x), 1.);
  float flap = sin(uTime * 5.5 + k * 2.);
  float y = (el - eb - ax * (.03 * flap + .034) + ax * ax * .046) / (.017 * (1.4 - ax) * (2.2 - 1.2 * smoothstep(0., .3, ax)));
  return vec2((1. - smoothstep(.8, 1., ax)) * (1. - smoothstep(.55, 1., abs(y))), smoothstep(.12, .3, ax) * .45 + smoothstep(.6, .9, ax) * .55);
}
vec3 env(vec3 P, vec3 r){
  float hl = max(length(r.xz), 1e-3);
  float el = r.y / hl;
  vec2 b = r.xz / hl;
  float phi = (abs(b.x) + abs(b.y) < 1e-4) ? 0. : atan(b.x, b.y);
  vec3 lightG = uSunCol * .72 + uSkyCol * .75;
  float townW = smoothstep(-.34, -.06, dot(b, vec2(.707, -.707)) + .1 * (vnoise(vec3(b * 2.5, 4.)) - .5));
  vec3 roofC = (uTerra * .72 + uOchre * .06) * lightG, wallC = (uOchre * .66 + vec3(.1, .095, .085)) * lightG;
  // above the horizon: sky; the town's upper rows on their hill (roofs over pale walls); the bell tower as one spike
  float hc = phi / .02 + .4 * sin(phi * 53.) + .25 * sin(phi * 131.), hf = fract(hc), hh = hash13(vec3(floor(hc), 3., 1.));
  float sk = (.008 + .026 * vnoise(vec3(b * 5., 1.)) + .03 * hh * hh) * townW * step(.1 + .3 * step(.8, hh), hf);      // a ragged roofline: houses of unequal height and width, a few taller, gaps between
  vec3 col = envSky(normalize(vec3(r.x, max(r.y, 0.), r.z) + vec3(0., 1e-4, 0.)));
  vec3 upTown = mix(wallC * (.8 + .3 * hh), roofC * (.8 + .35 * hh) * (hf < .55 ? 1.05 : .78), smoothstep(.26, .32, el / max(sk, 1e-3)));
  col = mix(col, mix(upTown, uHor, .1), smoothstep(sk + .003, sk - .003, el));
  float tw = dot(b, vec2(.866, -.5)), twOn = step(0., dot(b, vec2(-.5, -.866)));
  float tWid = .0085 * (1. - smoothstep(.085, .12, el));                                  // the shaft, then the pyramid roof tapering to a point
  float tMask = (1. - smoothstep(tWid - .002, tWid, abs(tw))) * twOn * step(el, .12);
  vec3 tCol = el > .085 ? roofC : wallC * (tw > 0. ? 1.08 : .72) * (1. - .55 * step(abs(el - .07), .007) * step(abs(tw), .004));
  col = mix(col, tCol, tMask);
  if (el < 0.) {
    float e = -el;
    // town side: three stepped rows of small houses close under the horizon, each a terracotta roof over a pale wall
    float rowA = e / .078 * 3.;
    float hcA = phi / .017, hA = hash13(vec3(floor(hcA), 2., 7.));
    float rowf = rowA + (hA - .5) * .34;                                                   // every house steps up or down from its neighbour
    float row = clamp(floor(rowf), 0., 3.);
    float hc2 = (phi + row * .041) / (.0125 + .005 * row) + .34 * sin(phi * 61. + row * 2.1) + .22 * sin(phi * 173. + row);   // party walls unevenly spaced
    float i2 = floor(hc2), f2 = fract(hc2);
    float h2 = hash13(vec3(i2, row, 7.)), h3 = hash13(vec3(i2, row, 11.)), h4 = hash13(vec3(i2, row, 19.));
    float v = fract(rowf) + (h3 - .5) * .3;                                                // some stand taller than their neighbours
    float roofF = .3 + .16 * h2;
    vec3 wallT = h4 < .42 ? uOchre * .74 + vec3(.06, .05, .03) : (h4 < .72 ? vec3(.74, .68, .55) : vec3(.72, .47, .4));   // ochre, cream, rose
    vec3 wall = wallT * lightG * (f2 < .62 ? 1.04 : .6) * (.92 + .16 * fract(h2 * 7.3));
    float wv = (v - roofF) / max(1. - roofF, .1);
    float win = step(.3, fract(wv * 2.2)) * step(fract(wv * 2.2), .68) * step(.32, fract(f2 * 3.)) * step(fract(f2 * 3.), .68) * step(roofF + .04, v);
    wall *= 1. - .58 * win;                                                                // dark window dots, two storeys
    vec3 roof = roofC * (.82 + .4 * h2) * (f2 < .5 ? 1.1 : .78);
    roof *= 1. - .3 * smoothstep(roofF - .07, roofF, v);                                   // the eaves' shade
    vec3 house = v < roofF ? roof : wall;
    house = v < 0. ? wallC * vec3(.5, .54, .66) : house;                                   // the shaded wall of the row above shows over a low roof
    house *= mix(.36, 1., smoothstep(0., .1, f2));                                         // slots of shadow between them
    house = mix(house, uHor * .8, .07);                                                    // set back a little in the morning haze
    // seaward: smooth blue, the glitter gathered into one lane under the sun star
    float sunPhi = (abs(uMirSun.x) + abs(uMirSun.z) < 1e-4) ? 0. : atan(uMirSun.x, uMirSun.z);
    float dph = angDiff(phi, sunPhi);
    float lane = exp(-dph * dph * 420.) * smoothstep(0., .02, e);
    float gl = vnoise(vec3(phi * 330., e * 240. - uTime * 1.1, uTime * .9)); gl *= gl;
    vec3 sea = uSea * (.62 + .16 * vnoise(vec3(b * 5., e * 14. + uTime * .05))) * (uSkyCol * 1.5 + uSunCol * .25) + uSunCol * lane * (.3 + 2.4 * gl * gl);
    sea = mix(sea, uHor * .92, smoothstep(.05, 0., e) * .7);
    vec3 farC = mix(sea, house, townW);
    float eQ = mix(.16, .08, townW);                                                       // where the pale quay begins
    vec3 quay = (uOchre * .24 + vec3(.2, .225, .26)) * (.92 + .14 * vnoise(vec3(b * 24., 1.))) * lightG;
    quay *= 1. - .16 * max(step(fract(e * 55.), .1), step(fract(phi * 30. + .5 * floor(e * 55.)), .1));   // slab joints: lines a tenth of a slab wide, the slabs breaking joint row by row
    quay = mix(quay, quay * vec3(.5, .58, .78), smoothstep(.7, .9, vnoise(vec3(phi * 26., e * 5., 2.))) * .85);          // long shadows of the cradle's poles across it
    quay = mix(quay, uChalk * .66 * lightG, smoothstep(.62, .7, vnoise(vec3(phi * 9. + 4., e * 30., 7.))));             // chalk spilt and swept
    float eR = .18 + .01 * (vnoise(vec3(b * 9., 6.)) - .5);                        // the lip of the dock
    vec3 dockC = (uOchre * .2 + vec3(.1, .115, .15)) * (uSkyCol * 2.3 + uGndCol * .9) * (.95 + .05 * step(.5, fract(e * 7.))) * (.9 + .2 * vnoise(vec3(b * 3., e * 2.)));
    vec3 g = mix(farC, quay, smoothstep(eQ - .004, eQ + .004, e));
    g *= 1. - .5 * smoothstep(.016, 0., abs(e - eQ + .009)) * townW;                      // the arcades' shade at the foot of the town
    g = mix(g, vec3(.06, .075, .105), smoothstep(eR - .005, eR, e));                      // the dark rim
    float bd = max(e - eR - .014, 0.) / .022;                                               // five altars as stepped bands, then the floor
    float sf = fract(bd);
    vec3 alt = dockC * mix(vec3(.62, .7, .86) * (.75 + .5 * sf), vec3(2.3, 2.1, 1.75), step(.78, sf));
    vec3 flr = dockC * 1.25 * (.85 + .3 * step(.5, fract(bd * 2.3)));
    flr = mix(flr, uChalk * .62 * (uSkyCol * 1.3 + uSunCol * .3), smoothstep(.5, .66, fbm3(vec3(b * 7., bd * .8))));
    flr = mix(flr, mix(uHor, uZen, .6) * 1.05, smoothstep(.6, .66, vnoise(vec3(b * 5. + 3., bd * .55))));
    g = mix(g, bd < 5. ? alt : flr, smoothstep(eR + .008, eR + .014, e));               // the basin below it, in the Moon's shade
    g = mix(g, uSilver * (uSkyCol * 1.45 + uSunCol * .22), .2);                           // silver, not stone
    col = mix(col, g, smoothstep(0., .006, e));
  }
  vec2 g0 = gullM(phi, el, 0.), g1 = gullM(phi, el, 1.), g2 = gullM(phi, el, 2.);
  vec2 gm = g0.x > g1.x ? g0 : g1; gm = gm.x > g2.x ? gm : g2;
  col = mix(col, mix(vec3(.92, .92, .9), vec3(.3, .32, .36), gm.y) * (uSunCol * .5 + uSkyCol * .95), gm.x);
  return col;
}
// metres outside the silver at azimuth ph and height yy (object space); latK = 1 where the lower (latitude) edge is the nearer one.
// The seam leans: at gallery height it stands SEAM_LEAN rad further round than on the dome, so the dome shows a broad blade of
// mirror from the quay and the gallery still crosses from chalk into silver in front of the lens
float luneS(float ph, float yy, out float latK){
  float yc = clamp(yy / uRad, -1., 1.); float clc = sqrt(max(1. - yc * yc, 0.));
  vec3 dc = vec3(sin(ph) * clc, yc, cos(ph) * clc);
  float hw = uLune.y - ${SEAM_LEAN.toFixed(3)} + ${(SEAM_LEAN + SEAM_DOME).toFixed(3)} * smoothstep(-.42, .02, yc);
  float sa = (abs(angDiff(ph, uLune.x)) - hw) * uRad * clc, sb = (uLuneLat - asin(yc)) * uRad;
  latK = step(sa, sb);
  return max(sa, sb) - uLune.z + (fbm3(dc * uRad * .11 + 3.) - .5) * 9.;
}
void main(){
  vec3 d = normalize(vDir);
  vec3 camL = (uRootInv * vec4(cameraPosition, 1.)).xyz;
  vec3 toCam = camL - vHp; float dist = length(toCam);
  vec3 V = toCam / max(dist, 1e-3);
  vec3 P = d * uRad;
  float ray1, ray2;
  vec4 c1 = crTab(P / ${CELL1.toFixed(1)}, 0., ${CELL1.toFixed(1)}, ray1);
  vec4 c2 = crTab(P / ${CELL2.toFixed(1)}, 8., ${CELL2.toFixed(1)}, ray2);
  vec4 c3 = crHash(P / 13., 1.7);
  float f4 = 1. - smoothstep(160., 420., dist), f5 = 1. - smoothstep(35., 100., dist);
  vec4 c4 = vec4(0.), c5 = vec4(0.), c6 = vec4(0.);
  if (f4 > 0.) { c4 = crHash(P / 3.6, 5.3); c6 = crHash(P / 6.7, 3.1); if (dist < 140.) c6 += crHash(P / 5.1 + 17., 8.9) * (1. - smoothstep(70., 140., dist)); }
  if (f5 > 0.) { c5 = crHash(P / .95, 9.1); if (dist < 24.) c5 += crHash(P / .34 + 9., 4.4) * (1. - smoothstep(11., 24., dist)) * .85; }
  vec3 g = c1.xyz + c2.xyz + c3.xyz + (c4.xyz * 1.15 + c6.xyz * 1.25) * f4 + c5.xyz * 1.1 * f5;
  // chalk tooth: a little fine relief from noise
  if (dist < 260.) {
    float e1 = fbm3(P * .9), e2 = fbm3(P * .9 + vec3(.25, 0., 0.)), e3 = fbm3(P * .9 + vec3(0., .25, 0.)), e4 = fbm3(P * .9 + vec3(0., 0., .25));
    g += vec3(e2 - e1, e3 - e1, e4 - e1) * 1.9 * (1. - smoothstep(60., 260., dist));
  }
  float hsum = c1.w * .04 + c2.w * .09 + c3.w * 1.6 + (c4.w * 1.3 + c6.w * 1.5) * f4 + c5.w * 1.5 * f5;
  // ---- silvered lune
  float rho = uRad * sqrt(max(1. - d.y * d.y, 0.));
  float phi = (abs(d.x) + abs(d.z) < 1e-5) ? 0. : atan(d.x, d.z);
  float rq = max(floor(rho / 9. + .5) * 9., 9.);
  vec2 lid = floor(vec2(phi * rq, P.y) / .6);
  vec2 lc = (lid + .5) * .6;
  float latK = 0.;
  float sc = luneS(lc.x / rq, lc.y, latK);
  float lh = hash13(vec3(lid, 2.));
  float lhFar = .5, looseFar = 0.;
  float arcW = phi * rho;
  float silver, fresh, wet;
  vec2 lidU = lid;
  if (uMode < .5) {
    float latX = 0.; float scX = luneS(phi, P.y, latX);                // the same distance at this very point (not per square)
    float loose = step(.9, hash13(vec3(lid, 7.))) * step(.35, fract(lh * 9.3)) * 3.6 * (1. - latK);
    silver = step(sc + (lh - .5) * 3.2 - loose, 0.);
    // the lower edge, under the overhang, is trimmed to a clean line: no squares there
    silver = mix(silver, step(scX, 0.), latX);
    latK = max(latK, latX);
    // close to, the leaf is laid in hand-sized squares: the same edge worked out per 0.2 m square, cross-faded in by distance
    float nearW = 1. - smoothstep(30., 55., dist);
    if (nearW > 0.) {
      vec2 lidF = floor(vec2(phi * rq, P.y) / .2);
      float lhF = hash13(vec3(lidF, 2.));
      float scN = scX;
      float looseF = step(.93, hash13(vec3(lidF, 7.))) * step(.3, fract(lhF * 9.3)) * 2.8;
      silver = mix(silver, mix(step(scN + (lhF - .5) * 1.5 - looseF, 0.), step(scX, 0.), latX), nearW);
      sc = mix(sc, scN, nearW); lh = mix(lh, lhF, nearW);
      if (nearW > .5) lidU = lidF;
    }
    // from the quay and the street the leaf is too fine to see: there the same edge is drawn in 5 m squares, a few of them
    // loose in the chalk ahead of the seam, so the dome's silver blade has a ragged, glittering edge at 300 m
    float farW = smoothstep(90., 170., dist);
    if (farW > 0.) {
      vec2 lidB = floor(vec2(phi * rq, P.y) / 5.); vec2 lcB = (lidB + .5) * 5.;
      float lkB = 0.; float scB = luneS(lcB.x / rq, lcB.y, lkB);
      float lhB = hash13(vec3(lidB, 2.));
      float looseB = step(.84, hash13(vec3(lidB, 7.))) * (7. + 11. * fract(lhB * 9.3)) * (1. - lkB);
      float silB = step(scB + (lhB - .5) * 7. * (1. - .7 * lkB) - looseB, 0.);
      silver = mix(silver, mix(silB, step(scX, 0.), latX), farW); lhFar = lhB; looseFar = step(.5, looseB) * step(2., scB);
    }
    fresh = smoothstep(-4., 0., sc) * (1. - latK);              // p2: only the working seam is fresh; above the trimmed lower edge the leaf is one smooth face
    wet = smoothstep(3.8, 2., sc + (vnoise(vec3(arcW * .35, P.y * .3, 5.)) - .5) * 1.6) * (1. - silver);
  } else {
    // spare crescent: the inner (concave-side) edge is still silvered
    float edge = smoothstep(.911, .919, vEdge.x + (fbm3(P * .15) - .5) * .06);      // p2: a crisp, narrower band along the inner edge (the shell's own uv)
    silver = uMode > 1.5 ? 1. : max(edge, step(.5, vEdge.y)); fresh = 0.; wet = 0.;
  }
  g *= 1. - silver;
  g -= dot(g, d) * d;
  vec3 nObj = normalize(d - g);
  if (uMode > .5 && vEdge.y > .5) nObj = -d;
  mat3 m3 = mat3(uMoonMat);
  vec3 n = normalize(m3 * nObj);
  vec3 dW = normalize(m3 * d);
  if (uMode > .5 && vEdge.y > .5) dW = -dW;
  // ---- chalk
  float mfield = fbm3(d * 1.6 + uSeedV) - c1.w * .014;
  float maria = smoothstep(.565, .61, mfield);
  // one broad mare high on the town side, so the disc reads as the Moon from the far end of the street
  if (uMode < .5) maria = max(maria, smoothstep(.9, .93, dot(d, vec3(.741, .561, .37)) + (fbm3(d * 5. + uSeedV) - .5) * .13));
  float wear = smoothstep(.3, .46, fbm3(P * .16 + 11.) + .07 * (vnoise(P * 1.7) - .5) + .5 * smoothstep(.6, .68, mfield));
  if (uMode < .5) maria = max(maria, smoothstep(.972, .982, dot(d, vec3(.9, -.39, .19)) + (fbm3(d * 9. + uSeedV) - .5) * .05));
  maria *= wear;
  if (uMode < .5) maria *= smoothstep(8., 42., sc);          // the chalk is cleaned back to white before the leaf goes on
  float a = .615 + .11 * (fbm3(P * .45) - .5) + (ray1 * .09 + ray2 * .07) + c3.w * .25;
  a *= .93 + .12 * vnoise(vec3(P.y * 1.3 + fbm3(P * .07) * 7., 1., 2.));     // the beds of the chalk
  a *= 1. + clamp(c1.w * .034, -.17, .07) + clamp(c2.w * .034, -.1, .05);     // big crater floors a little darker, rims lighter: rings that read from afar
  a *= 1. + clamp((c3.w * 1.6 + (c4.w * 1.3 + c6.w * 1.6) * f4 + c5.w * 1.5 * f5) * 2.6, -.24, .1);       // dust lies darker in every pit, the rims are scuffed pale: the wall reads even with the sun full on it
  // p1 THE PIT SHEET: small crisp pits (a dark wall under the upper rim, a pale lip over it) from one tileable picture, laid on by the surface's
  // own place alone: round the flanks by azimuth and height (78 and 328 tiles to the round, 9.67 m and 2.30 m each; the picture's up is the Moon's
  // up), on the belly and the crown by P.zx. There is no lens term and no fade of its own: where a pit is smaller than a pixel the sampler's
  // mip-maps hand back the sheet's mean, which is nought here, so from afar the chalk is as it was. The spare crescents (uMode 1, 2) do not take it.
  float pit = 0.;
  if (uMode < .5) {
    vec3 dPx = dFdx(P), dPy = dFdy(P); float rr2 = max(P.x * P.x + P.z * P.z, 1.);
    vec2 gx = vec2((P.z * dPx.x - P.x * dPx.z) / rr2, dPx.y), gy = vec2((P.z * dPy.x - P.x * dPy.z) / rr2, dPy.y);      // what one pixel spans in azimuth and height (for the sampler; whole across the +-180 degree line)
    vec2 wv = (vec2(vnoise(P * .07 + 31.), vnoise(P * .07 + 47.)) - .5) * 1.2;                                        // the rows of tiles bent a little (metres), so they do not stand in ranks
    vec2 k1 = vec2(12.41409, .103451), k2 = vec2(52.20282, .435023), qf = vec2(phi, P.y);
    float wb = smoothstep(.62, .82, abs(d.y));
    float s1 = mix(textureGrad(uPits, qf * k1 + wv * k1.y, gx * k1, gy * k1).r, texture2D(uPits, (P.zx + wv) * k1.y).r, wb);
    float s2 = mix(textureGrad(uPits, qf * k2 + wv * k2.y + vec2(.37, .61), gx * k2, gy * k2).r, texture2D(uPits, (P.zx + wv) * k2.y + vec2(.53, .19)).r, wb);
    pit = ((s1 + s2) * 2.55 - 2.56) * (.6 + .8 * smoothstep(.3, .7, vnoise(P * .06 + 71.)));                    // the pits gather in fields
  }
  float thin = 1. - smoothstep(50., 170., dist);
  vec3 Pk = P * .21 + 3. + (vec3(vnoise(P * 1.9), vnoise(P * 1.9 + 7.), vnoise(P * 1.9 + 13.)) - .5) * .5 + (vec3(vnoise(P * 7.), vnoise(P * 7. + 5.), vnoise(P * 7. + 11.)) - .5) * .12;
  float ck = abs(vnoise(Pk) - .5);
  a *= 1. - .3 * (1. - smoothstep(.0, .006, ck)) * smoothstep(.52, .66, vnoise(P * .045 + 20.)) * thin * (1. - smoothstep(25., 70., dist));
  // two big old craters low on the town-facing side, drawn broad so they can be counted from the far end of the street
  if (uMode < .5) {
    float farK = smoothstep(110., 250., dist) * (1. - silver);
    float tA = sqrt(max(1. - dot(d, vec3(.941, -.242, .235)), 0.) / .00745), tB = sqrt(max(1. - dot(d, vec3(.997, -.07, -.035)), 0.) / .0038);
    float rimA = exp(-(tA - 1.) * (tA - 1.) * 40.), rimB = exp(-(tB - 1.) * (tB - 1.) * 40.);
    a *= 1. + farK * (.1 * (rimA + rimB) - .15 * (1. - smoothstep(.5, .95, tA)) - .15 * (1. - smoothstep(.5, .95, tB)));
  }
  a = clamp(a, .3, .70);
  a = clamp(a * (1. + .42 * pit), .3, .70);                                    // p1: the pits, laid on under the same cap (a lip is never paler than the chalk may be)
  vec3 alb = uChalk * a;
  // drips of size running down from the wet band; red-chalk survey line with ticks
  float wline = max(.05, dist * .0012);
  float sv = P.y - uSurveyY; float arc = phi * rho;
  float tick = step(abs(fract(arc) - .5), .46) < .5 ? 1. : 0.;
  float tick5 = step(abs(fract(arc / 5.) - .5), .492) < .5 ? 1. : 0.;
  float mark = 1. - smoothstep(wline, wline * 1.6, abs(sv));
  mark = max(mark, tick * step(-.4 - .7 * tick5, sv) * step(sv, 0.) * thin);
  alb = mix(alb, uTerra * .75, mark * .75 * (1. - silver) * step(uMode, .5) * (.6 + .4 * vnoise(P * 6.)));
  float macro = smoothstep(-.16, .34, dot(dW, uSunDir));
  float micro = clamp(dot(n, uSunDir) * .95 + .1, 0., 1.);
  float ao = clamp(1. + hsum, .5, 1.12);
  // plank and pole shadows from the scaffold on the sunward flank
  float aaS = .25 + dist * .004;
  vec3 shv = scaf(vHp, uSunDir, 128., .5, .9, aaS);
  float dkf = fract(vHp.y / 6. + .02 * sin(vHp.x * .21 + vHp.z * .17));
  float dband = smoothstep(.5, .56, dkf) * (1. - smoothstep(.97, 1., dkf));                  // the deck above shades the upper part of each lift
  float sq = dkf * 4.3 + .35 * vnoise(vec3(vHp.x * .05, vHp.z * .05, floor(vHp.y / 6.)));
  float slit = (1. - smoothstep(.015, .05, abs(fract(sq) - .5))) * (1. - smoothstep(18., 70., dist)) * step(.4, vnoise(vec3(vHp.x * .16, floor(sq) * 3.1, vHp.z * .16)));
  dband *= 1. - .7 * slit;                                                                   // slits of sun between the planks, here and there
  float dOn = step(6., vHp.y) * (1. - smoothstep(${(CY - 8).toFixed(1)}, ${(CY - 2).toFixed(1)}, vHp.y)) * sectorOn((abs(vHp.x) + abs(vHp.z) < 1e-4) ? 0. : atan(vHp.x, vHp.z));
  float stripe = max(max(shv.x, shv.y * .85) * .5, dband * dOn * .9) * (1. - uOpen) * (1. - smoothstep(190., 285., dist));
  float up = n.y * .5 + .5;
  float low = smoothstep(-.8, -.985, dW.y);
  vec3 sideL = normalize(vec3(uSunDir.x, -.3, uSunDir.z) + vec3(1e-4, 0., 0.));
  float rake = clamp(dot(n, sideL) * 2.2 - .35, 0., 1.4) * smoothstep(-.3, -.75, dW.y) * mix(.4, 1., smoothstep(12., 55., dist));
  float belly = smoothstep(-.34, -.74, dW.y);                // 0 on the flanks, 1 under the overhang
  float keelG = smoothstep(-.992, -.9998, dW.y);                                // the bounce off the dock floor gathers on the lowest part: one pool under the keel, the rest of the belly stays chalk in shade
  vec3 skyF = uSkyCol * (.3 + .7 * up) * mix(vec3(1.), vec3(.9, .97, 1.1), belly) * mix(1., 1.8, belly) * (1. - .85 * keelG);
  vec3 bounce = uGndCol * mix(vec3(1.), vec3(1.1, .96, .7), belly);
  // under a frontal sun craters show only by tone, as at full Moon: give every pit one lit lip and one shaded
  vec3 sunO = uSunDir * m3;
  vec3 tO = sunO - d * dot(sunO, d) + (vec3(0., 1., 0.) - d * d.y) * .3;
  tO /= max(length(tO), .25);
  float relief = clamp(-dot(g, tO) * 1.9, -.62, .55);
  vec3 tU = vec3(0., 1., 0.) - d * d.y; tU /= max(length(tU), .3);
  float reliefU = clamp(-dot(g, tU) * 2.3, -.55, .55) * (1. - belly);
  vec3 lit = uSunCol * micro * macro * (1. + relief) * (1. - stripe) * mix(.75, 1., ao) + skyF * ao * (1. + reliefU)
    + bounce * (1. - up) * (1. - up) * mix(1.6, .2 + 1.6 * keelG, belly) * ao + (uGndCol * 1.5 + uSkyCol * .25) * rake * mix(1., .5, belly) * ao;
  // the sunlit half of the dock floor throws warm light back up onto the sunward side of the belly
  vec2 sx = sunO.xz / max(length(sunO.xz), .2), dx2 = d.xz / max(length(d.xz), .2);
  lit += uSunCol * vec3(.46, .36, .22) * belly * (1. - keelG) * smoothstep(-.35, .85, dot(sx, dx2)) * (1. + relief * .9) * ao;
  vec3 col = alb * (lit + uSelf * (.75 + .25 * ao));
  // ---- old tarnished silver of the maria: satin, grey-gold, worn through
  vec3 rr = reflect(-V, n);
  vec3 blur = mix(uOchre * .14 + vec3(.1, .105, .115), mix(uHor, uZen, .45), smoothstep(-.35, .45, rr.y));
  float tn = fbm3(P * .06 + 5.);
  vec3 tarn = mix(vec3(.42, .44, .46), vec3(.56, .5, .36), smoothstep(.35, .7, tn));
  tarn = mix(tarn, vec3(.24, .26, .31), smoothstep(.5, .72, fbm3(P * .2 + 9.)) * .45);
  tarn *= max(1. + .4 * pit, .3);                                                                                        // p1: the same pits in the worn silver
  float sheen = max(dot(rr, uSunDir), 0.); sheen *= sheen; sheen *= sheen; sheen *= sheen;
  vec3 mcol = tarn * (blur * .72 + lit * .3 + uSunCol * sheen * sheen * .5 * macro);
  col = mix(col, mcol, maria * (1. - silver) * .92);
  // ---- wet seam: size brushed on ahead of the leaf, glossy and dark, with drips
  float drip = smoothstep(.72, .9, vnoise(vec3(arc * 2.2, P.y * .22 + uTime * .05, 1.))) * smoothstep(7., 1., sc) * (1. - silver) * step(uMode, .5);
  float wetAmt = max(wet, drip * .8);
  float fres0 = 1. - max(dot(n, V), 0.); float fres = fres0 * fres0; fres *= fres * fres0;
  vec3 rw = reflect(-V, normalize(mix(dW, n, .1)));        // the size lies smooth over the chalk's tooth: one calm reflection, no sparkle
  col = mix(col, col * vec3(.42, .48, .58) + min(env(vHp, rw), vec3(1.1)) * (.05 + .4 * fres), wetAmt);
  // ---- mirror
  if (silver > .001) {
    float nearK = 1. - smoothstep(25., 110., dist);
    vec3 tint = mix(uSilver, vec3(1.), fres0 * fres0);
    vec3 mir;
    if (uMode > .5) {
      // a spare crescent: one smooth blade. The view ray is bounced off the shell itself (an analytic sphere normal), so the
      // sky's gradient, its clouds, the town and the quay lie along it unbroken, and the sun star rides along the edge as we pass
      vec3 rc = normalize(reflect(-V, dW) + vec3(1e-5, 0., 0.));
      vec3 e = env(vHp, rc);
      float sdc = max(dot(rc, uMirSun), 0.); float c2 = sdc * sdc, c4 = c2 * c2, c8 = c4 * c4, c16 = c8 * c8;
      e += uSunCol * (c16 * c16 * c16 * .55 + c8 * .06);
      mir = e * tint * 1.06 + uSilver * uSkyCol * .1;
    } else {
    vec3 jit = (hash33(vec3(lidU, 5.)) - .5) * .07 * smoothstep(-1.3, 0., sc) * nearK * (1. - latK);      // faceted leaf in the last metres before the seam; 
    // the picture is the harbour, not the dock under us: below the equator the glass is taken as a wall leaning back by a
    // constant amount, so the bent horizon runs through the middle of the silver wherever we stand beside it
    // The bearing is the true one (the view ray bounced off the ball, so the harbour is squeezed sideways and slides as we
    // move); the elevation is the view ray's own, as in a wall of glass leaning back a little, so the horizon stands
    // uMirTip below the real one all along the silver, and a ball's squeeze is put back as a scale.
    float hlW = max(length(dW.xz), 1e-3);
    vec3 nH = normalize(vec3(dW.x, 0., dW.z) / hlW + m3 * jit);
    vec3 rH = reflect(-V, nH);
    float rl = max(length(rH.xz), 1e-3);
    float hV = clamp(-V.y / max(length(V.xz), .05), -3., 3.);
    float elM = 1.6 * (hV + uMirTip) + .15 * (.4 - max(dot(dW, V), 0.)) + jit.y * .8;
    elM *= elM < 0. ? .75 : 1.;                                          // the ground squeezed up toward the horizon
    vec3 rB = vec3(rH.x / rl, elM, rH.z / rl);
    vec3 rA = reflect(-V, normalize(dW + vec3(0., .5, 0.) + m3 * jit));
    vec3 r = normalize(mix(rB, rA, smoothstep(-.2, .35, dW.y)) + vec3(1e-5, 0., 0.));
    vec3 e = env(vHp, r);
    // our own gallery in the glass: a few standards, a tarpaulin here and there (no deck lines: with them it read as a glazed dome)
    float aaM = .12 + dist * .012;
    vec4 s1 = scafM(vHp, r, aaM);
    float tk = fract(s1.z * 37.);
    vec3 tc = tk < .4 ? uTerra * .5 + vec3(.16, .13, .1) : (tk < .7 ? vec3(.5, .47, .4) : mix(uSea, vec3(.7), .3));
    e = mix(e, tc * s1.y * (uSunCol * .6 + uSkyCol * 1.1), step(.001, s1.y) * step(.972, s1.z) * (1. - uOpen) * .8);
    vec3 wood = vec3(.2, .14, .09) * (uSunCol * .45 + uSkyCol * .8);
    e = mix(e, wood, s1.x * (1. - uOpen) * .8);
    e += uGlow * 2.6 * s1.w * (1. - uOpen);
    float nv = max(dot(normalize(dW), V), 0.);
    float mote = exp(-(1. - nv) / .0035);
    e += vec3(1.3, 1.2, 1.0) * mote * 1.6;
    // ---- the dome seen from the quay and the street. A true reflection at the limb is the pale horizon behind the Moon, the
    // colour of sunlit chalk, so from afar nothing said mirror. Here the blade above the top rail carries its own bent sky:
    // zenith blue at the crown paling to the rail, cloud squeezed thin along the limb, one sun star; all of it slides as we come on
    float farM = smoothstep(60., 150., dist) * smoothstep(-.04, .1, dW.y);
    if (farM > 0.) {
      float hgt = clamp(dW.y, 0., 1.);
      float nvF = max(dot(dW, V), 0.);
      vec3 fm = mix(mix(uHor, uZen, .7) * .66, uZen * vec3(.2, .22, .27), smoothstep(.04, .62, hgt));       // a deep sky, darker than the one behind the Moon       // darker and bluer than the sky behind it
      // three long clouds, one above another, drawn thin along the limb; they climb down the blade as we come on
      float slide = (305. - camL.x) * .0026 + uTime * .004;
      float ph = (hgt + slide) / .46, cf = fract(ph) - .5, cid = floor(ph);
      float nearK = smoothstep(170., 300., dist); float across = clamp(nvF / mix(.2, .45, nearK), 0., 1.);
      float ca = .3 + .36 * hash13(vec3(cid, 3., 8.));
      float cm = exp(-(across - ca) * (across - ca) * 70.) * exp(-cf * cf * 7.);
      cm = smoothstep(.26, .5, cm * (.62 + .76 * fbm3(vec3(nvF * 14., hgt * 5. + slide * 5., 3.7))));
      fm = mix(fm, vec3(1.02, 1., .97) * (uSkyCol * .95 + uSunCol * .56), cm * .95);
      fm *= .92 + .16 * lhFar;                                           // each square of leaf holds a slightly different piece of sky
      fm = mix(fm, uHor * 1.1 + uSunCol * .3, looseFar * .75);           // the loose squares out in the chalk catch the light
      float azS = uLune.x - uLune.y - .36 + (camL.x - 290.) * .0012, laS = clamp(.5 + (camL.x - 290.) * .0022, .14, .95);
      vec3 nS = vec3(sin(azS) * cos(laS), sin(laS), cos(azS) * cos(laS));
      float qS = 1. - max(dot(d, nS), 0.);
      fm += uSunCol * (exp(-qS * 9000.) * 14. + exp(-qS * 1100.) * 1.3 + exp(-qS * 150.) * .1);
      fm += (uHor * .55 + uSunCol * .22) * (1. - smoothstep(0., .02 + .07 * nearK, nvF));          // the limb itself, a bright edge against the sky
      e = mix(e, fm, farM);
    }
    mir = e * tint * 1.12 * mix(1., .86 + .28 * lh, fresh * nearK) * (1. + (lh - .5) * .07 * nearK);
    mir += uSilver * uSkyCol * .1 + uSunCol * fres0 * fres0 * fres0 * .42 * (1. - nearK) * (1. - farM);       // seen from afar the limb flashes
    }
    col = mix(col, mir, silver);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- timber, canvas, rope, bucket, glow, dust shaders
const WOOD_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCol;
uniform mat4 uMoonMat, uRootInv;
varying vec3 vCol, vN, vP, vL; varying vec2 vK;
${GL_LEAN}
${GL_CRADLE}
void main(){
  vec3 c0 = instanceMatrix[0].xyz, c1 = instanceMatrix[1].xyz, c2 = instanceMatrix[2].xyz;
  vec3 s2 = max(vec3(dot(c0, c0), dot(c1, c1), dot(c2, c2)), vec3(1e-6));
  vec3 n = normalize(mat3(instanceMatrix) * (normal / s2));
  vec3 p = (instanceMatrix * vec4(position, 1.)).xyz;
  vec3 camL = (uRootInv * vec4(cameraPosition, 1.)).xyz;
  float fl = fract(aFx.w);
  // the bays that face the street are dressed only as we come near: from the far end of the street (and through the portal before it) the Moon's face stands bare over the roofs
  if (aFx.w < .1) {   // poles never go thinner than about a pixel and a half
    float k = max(1., length(camL - p) * .0098);
    p += (c0 * position.x + c2 * position.z) * (k - 1.);
  }
  if (fl > .02 && fl < .06) p = mix(instanceMatrix[3].xyz, p, (1. - smoothstep(228., 300., length(camL - instanceMatrix[3].xyz))));
  #ifdef MOONSPACE
    vec3 pr = (uMoonMat * vec4(p, 1.)).xyz; n = normalize(mat3(uMoonMat) * n);
  #else
    p = cradle(p, n, instanceMatrix[3].xyz); vec3 pr = p;
  #endif
  vL = position * sqrt(s2); vCol = aCol; vN = n; vP = pr; vK = vec2(aFx.w, aFx.z);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WOOD_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uRope, uChalk;
varying vec3 vCol, vN, vP, vL; varying vec2 vK;
${GL_NOISE}
${GL_LIGHT}
void main(){
  vec3 n = normalize(vN);
  vec3 alb = vCol; float kind = vK.x; float ao = 1.;
  if (kind < .5) {
    alb *= .74 + .5 * vnoise(vL * vec3(26., 1.4, 26.) + vK.y * 40.);
    float nd = abs(fract(vL.y / 6. + .5) - .5) * 6.;
    float lash = 1. - smoothstep(.2, .26, nd);
    alb = mix(alb, uRope * (.7 + .3 * step(.5, fract(vL.y * 14. + vL.x * 9.))), lash);
  } else if (kind < 2.5) {
    float px = vL.x / .3; float gx = abs(fract(px) - .5);
    alb *= .7 + .55 * hash13(vec3(floor(px), vK.y * 91., 3.));
    alb *= .78 + .4 * vnoise(vL * vec3(24., 24., 1.3) + vK.y * 40.);
    alb *= 1. - .7 * smoothstep(.43, .5, gx);
    float dustK = smoothstep(.5, .8, vnoise(vec3(vL.x * 1.1, vK.y * 17., vL.z * 1.1))) * step(.5, n.y);
    alb = mix(alb, uChalk * .52, dustK * .5);
  } else if (kind > 3.5) {
    // old oak baulks (the keel cribs): grain along the length, rings and drying checks on the ends, arrises worn pale, chalk dust on top
    vec3 nL = normalize(cross(dFdx(vL), dFdy(vL)) + vec3(1e-6, 2e-6, 3e-6));
    vec3 an = abs(nL);
    float endF = step(.6, an.z), topF = step(.6, an.y), seedK = vK.y * 37.;
    float grain = vnoise(vec3(vL.x * 30. + seedK, vL.y * 30., vL.z * 1.2));
    float fig = .7 + .55 * grain * (.6 + .4 * vnoise(vec3(vL.x * 7., vL.y * 7., vL.z * .35 + seedK)));
    vec2 rc = vec2(vL.x - .4 - .14 * (fract(seedK * .37) - .5), vL.y - .12 * (fract(seedK * .73) - .5));
    float rr = length(rc);
    float rings = .58 + .42 * smoothstep(-.3, .3, sin(rr * 80. + 3. * vnoise(vec3(rc * 6., seedK))));
    float ang = (abs(rc.x) + abs(rc.y) < 1e-4) ? 0. : atan(rc.y, rc.x);
    float chk = smoothstep(.9, .97, vnoise(vec3(ang * 2.4 + seedK, rr * 1.5, 2.))) * smoothstep(.03, .16, rr);
    alb *= mix(fig, rings * (1. - .65 * chk) * .9, endF);
    alb *= 1. - .5 * smoothstep(.78, .9, vnoise(vec3(vL.x * 9. + seedK, vL.y * 9., vL.z * .45))) * (1. - endF);
    float ex = min(vL.x, .8 - vL.x), ey = .455 - abs(vL.y);
    float eg = topF > .5 ? ex : (endF > .5 ? min(ex, ey) : ey);
    if (kind < 4.5) alb = mix(alb, alb * 1.8 + .035, (1. - smoothstep(0., .07, eg)) * .55);
    float dust = topF * step(0., n.y) * smoothstep(.3, .6, vnoise(vec3(vL.x * 3. + seedK, 1., vL.z * 1.3)) + (kind > 4.5 ? .4 : 0.));
    alb = mix(alb, uChalk * .62, dust * .85);
    alb *= mix(1., .6 + .4 * smoothstep(-.45, .15, vL.y), (1. - topF) * step(kind, 4.5));
  } else {
    alb *= .8 + .4 * vnoise(vL * 2.5 + vK.y * 30.);
  }
  #ifndef MOONSPACE
    float dM = length(vP - uMoonC) - ${R.toFixed(1)};
    ao = mix(.5, 1., smoothstep(0., 12., dM));
  #endif
  gl_FragColor = vec4(lightIt(alb, n, vP, ao), 1.);
  #include <fog_fragment>
}`;

const CLOTH_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCol, aPh;   // aPh: phase, amplitude (m), type (0 tarpaulin pinned top and bottom, 1 pennant)
uniform float uTime;
uniform mat4 uRootInv;
varying vec3 vCol, vN, vP; varying vec3 vUv;
${GL_LEAN}
${GL_CRADLE}
vec3 flap(vec2 q){
  if (aPh.z < .5) {
    float pin = sin(3.14159 * q.y);
    float w = sin(q.y * 5. + q.x * 2.5 - uTime * (2.4 + aPh.x * .15) + aPh.x) * .5 + sin(q.x * 8. + q.y * 3. - uTime * 3.7 + aPh.x * 2.) * .22 + .45;
    return vec3(q.x, q.y, pin * aPh.y * w * (.55 + .45 * q.x));
  }
  float w = sin(q.x * 8. - uTime * 7.5 + aPh.x) + .4 * sin(q.x * 15. - uTime * 11. + aPh.x * 3.);
  return vec3(q.x, q.y + w * .1 * q.x - q.x * q.x * .18, w * aPh.y * q.x);
}
void main(){
  vec2 q = position.xy;
  vec3 a = (instanceMatrix * vec4(flap(q), 1.)).xyz;
  vec3 b = (instanceMatrix * vec4(flap(q + vec2(.04, 0.)), 1.)).xyz;
  vec3 c = (instanceMatrix * vec4(flap(q + vec2(0., .04)), 1.)).xyz;
  vec3 n = normalize(cross(b - a, c - a) + vec3(0., 1e-6, 0.));
  float fl = fract(aFx.w);
  if (fl > .02 && fl < .06) a = mix(instanceMatrix[3].xyz, a, (1. - smoothstep(228., 300., length((uRootInv * vec4(cameraPosition, 1.)).xyz - instanceMatrix[3].xyz))));
  vec3 p = cradle(a, n, instanceMatrix[3].xyz);
  vCol = aCol; vN = n; vP = p; vUv = vec3(uv, aFx.z + aPh.z * 2.);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CLOTH_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vCol, vN, vP; varying vec3 vUv;
${GL_NOISE}
${GL_LIGHT}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float rnd = fract(vUv.z); vec2 uv = vUv.xy;
  vec3 alb = vCol * (.88 + .16 * vnoise(vec3(uv * 46., rnd * 9.)));
  if (vUv.z < 1.5) {
    vec2 pu = uv * vec2(3., 2.4) + rnd * 7.; vec2 pc = floor(pu), pf = fract(pu);
    float ph = hash13(vec3(pc, rnd * 31.));
    float edge = min(min(pf.x, 1. - pf.x), min(pf.y, 1. - pf.y));
    if (ph > .7) { alb = alb * vec3(.74, .72, .7) + vec3(.06, .05, .03) * ph; alb *= .72 + .28 * smoothstep(.02, .06, edge) + .2 * step(edge, .09) * step(.5, fract((pf.x + pf.y) * 24.)); }
    alb *= mix(.68, 1., smoothstep(0., .4, uv.y)) * (.85 + .15 * smoothstep(.5, .46, abs(uv.x - .5)));
    alb *= .9 + .1 * step(.03, abs(fract(uv.x * 3.) - .5));
  }
  float ao = mix(.6, 1., smoothstep(0., 12., length(vP - uMoonC) - ${R.toFixed(1)}));
  vec3 col = lightIt(alb, n, vP, ao) + alb * uSunCol * max(dot(-n, uSunDir), 0.) * .42 * moonShadow(vP);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const ROPE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aA, aB;
attribute vec4 aR;    // mooring: release u, sag (m), width (m), 0     hoist: sector azimuth, release u, width, 1 or -1 (run direction)
attribute vec2 aK;    // cure c1, a mooring's whip: its size as a share of the first version's (1), and how far to one side its swing is centred, in whole reaches (0); set by the law at the end of buildHero. m4: a size below 0 is the law's last resort, the rope is not drawn at all, at any frame
uniform mat4 uMoonMat, uRootInv;
uniform float uTime;
varying vec3 vP; varying vec3 vUv;
${GL_LEAN}
vec3 ropeAt(float s, vec3 A, vec3 B){
  vec3 ab = B - A; float L = max(length(ab), 1e-3);
  if (abs(aR.w) > .5) return A + ab * s;
  float taut = smoothstep(aR.x - .03, aR.x, uProg);
  vec3 p = A + ab * s; p.y -= aR.y * 4. * s * (1. - s) * (1. - taut * .92);
  float t = max(uProg - aR.x, 0.) * uSecs;
  if (aK.x < 0.) return aR.z < .32 ? B : A;      // m4, the law's last resort, taken at every frame of the flight, before the rope's moment and after: every station at the end the rope would keep, so its ribbon has no area; no other rope takes this line
  if (t > 0.) {
    vec3 d0 = ab / L;
    float e = 1. - exp(-t * .7) * cos(t * 1.4);
    bool fromB = aR.z < .32;
    float q = fromB ? 1. - s : s;
    vec3 d1 = fromB ? -d0 : d0;
    vec3 dir = normalize(mix(d1, vec3(0., -1., 0.), clamp(e * (.55 + .4 * q), 0., 1.12)) + vec3(1e-4, 0., 0.));
    vec3 side = normalize(cross(d0, vec3(0., 1., 0.)) + vec3(1e-4));
    float amp = 4.5 * exp(-t * .28) * q;
    if (!fromB) { float haul = 1. - smoothstep(.795, .85, uProg); L *= haul; amp *= haul; }      // the belly ropes are hauled up as the Moon gathers way
    p = (fromB ? B : A) + dir * L * q + side * sin(q * 7. - t * 1.4 - uTime * 1.6) * amp + d1 * sin(q * 5. - t * 1.1 - uTime * 1.1) * amp * .4;
    p += (side * (aK.y + (aK.x - 1.) * sin(q * 7. - t * 1.4 - uTime * 1.6)) + d1 * ((aK.x - 1.) * sin(q * 5. - t * 1.1 - uTime * 1.1) * .4)) * amp;      // cure c1: with aK = (1, 0) this adds nothing; else the two sines above are sized by aK.x and the swing is centred aK.y reaches to the side
    p.y = max(p.y, .25);
  }
  return p;
}
void main(){
  float s = position.x;
  vec3 A = aA, B = aB;
  if (abs(aR.w) < .5) A = (uMoonMat * vec4(aA, 1.)).xyz;
  vec3 p = ropeAt(s, A, B);
  vec3 tg = ropeAt(s + .012, A, B) - ropeAt(s - .012, A, B);
  vec3 nn = vec3(0., 1., 0.);
  if (abs(aR.w) > .5) { vec3 p1 = leanSector(p + tg, nn, aR.x, aR.y); p = leanSector(p, nn, aR.x, aR.y); tg = p1 - p; }
  vec3 camL = (uRootInv * vec4(cameraPosition, 1.)).xyz;
  vec3 tc = camL - p; float dist = length(tc);
  vec3 sd = normalize(cross(tg, tc) + vec3(1e-5, 2e-5, 0.));
  p += sd * position.y * max(aR.z, dist * .0017) * .5;
  vP = p; vUv = vec3(s * length(B - A), position.y, aR.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROPE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uRope; uniform float uTime;
varying vec3 vP; varying vec3 vUv;
${GL_LIGHT}
void main(){
  float c = sqrt(max(1. - vUv.y * vUv.y, 0.));
  float run = vUv.z * uTime * 1.1;
  float tw = step(.5, fract(vUv.x * 2.2 + vUv.y * .4 - run));
  vec3 alb = uRope * (.62 + .38 * tw);
  vec3 col = alb * (uSunCol * .6 * moonShadow(vP) + uSkyCol * .85 + uGndCol * .4) * (.45 + .55 * c);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// bucket hoists: the same motion function drives the buckets and their glow cards
const GL_HOIST = /* glsl */`
attribute vec4 aH;    // foot x, foot z, hoist height, phase
attribute vec4 aH2;   // sector azimuth, release u, rope speed m/s, random
uniform float uTime;
vec4 hoistAt(out float fade){
  float cyc = fract(uTime * aH2.z / (2. * aH.z) + aH.w) * 2.;
  float up = step(cyc, 1.);
  float f = fract(cyc);
  fade = smoothstep(0., .02, f) * smoothstep(1., .98, f);
  float y = (up > .5 ? cyc : 2. - cyc) * aH.z;
  vec2 o = aH.xy / max(length(aH.xy), 1e-3);
  vec2 tg = vec2(o.y, -o.x);
  vec2 xz = aH.xy + tg * (up > .5 ? -.8 : .8) + tg * sin(uTime * 1.7 + aH.w * 40.) * .1 + o * sin(uTime * 1.3 + aH.w * 23.) * .07;
  return vec4(xz.x, y, xz.y, up);
}
`;
const BUCKET_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vN, vP, vUv;
${GL_LEAN}
${GL_HOIST}
void main(){
  float fade; vec4 h = hoistAt(fade);
  float a = aH2.w * 6.283 + sin(uTime * .9 + aH.w * 17.) * .5; float c = cos(a), s = sin(a);
  vec3 lp = position * fade; lp = vec3(c * lp.x + s * lp.z, lp.y, -s * lp.x + c * lp.z);
  vec3 n = vec3(c * normal.x + s * normal.z, normal.y, -s * normal.x + c * normal.z);
  vec3 p = leanSector(h.xyz + lp, n, aH2.x, aH2.y);
  vN = n; vP = p; vUv = vec3(uv, h.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BUCKET_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uGlow; uniform float uTime;
varying vec3 vN, vP, vUv;
${GL_NOISE}
${GL_LIGHT}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 col;
  if (vUv.x < .5) {
    float band = step(.86, vUv.y) + step(abs(vUv.y - .12), .04) + step(abs(vUv.y - .5), .025);
    vec3 alb = vec3(.47, .52, .57) * (.82 + .3 * vnoise(vP * 9.)) * (1. - .28 * min(band, 1.));
    col = lightIt(alb, n, vP, 1.);
    col += uGlow * .9 * vUv.z * smoothstep(.72, 1., vUv.y);      // the light spills over the brim
  } else if (vUv.x < 1.5) {
    float sl = .8 + .35 * vnoise(vec3(vP.xz * 5., uTime * 1.6));
    col = mix(vec3(.03, .04, .05), uGlow * 3.4 * sl, vUv.z);
  } else col = lightIt(vec3(.12, .11, .1), n, vP, 1.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const GLOW_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vUv;
${GL_LEAN}
${GL_HOIST}
void main(){
  float fade; vec4 h = hoistAt(fade);
  vec3 n = vec3(0., 1., 0.);
  vec3 p = leanSector(h.xyz + vec3(0., -.8, 0.), n, aH2.x, aH2.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  mvPosition.xy += position.xy * 5.2 * fade;
  vUv = vec3(position.xy * 2., h.w * fade);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLOW_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uGlow;
varying vec3 vUv;
void main(){
  float r2 = dot(vUv.xy, vUv.xy);
  float a = exp(-r2 * 7.) * .5 + exp(-r2 * 40.) * .5;
  a *= 1. - smoothstep(.7, 1., r2);
  vec3 col = uGlow * a * .62 * vUv.z;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;
const DUST_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aD;    // x, top y, z, phase
attribute vec3 aD2;   // fall range, speed, size
uniform float uTime;
varying vec3 vP, vUv;
void main(){
  float f = fract(uTime * aD2.y / max(aD2.x, .1) + aD.w);
  vec3 p = aD.xyz; p.y -= f * aD2.x;
  p.xz += vec2(sin(uTime * .7 + aD.w * 30.), cos(uTime * .5 + aD.w * 50.)) * .4;
  p.z += f * 2.2;
  p.y = max(p.y, .1);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  float dz = max(-mvPosition.z, .1);
  mvPosition.xy += position.xy * vec2(1., 3.2) * min(aD2.z, dz * .0085);
  vP = p; vUv = vec3(position.xy * 2., smoothstep(0., .12, f) * smoothstep(1., .7, f) * smoothstep(2.5, 8., dz));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DUST_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uChalk;
varying vec3 vP, vUv;
${GL_LIGHT}
void main(){
  float r2 = dot(vUv.xy, vUv.xy);
  float a = (1. - smoothstep(.1, 1., r2)) * vUv.z * .5;
  vec3 col = uChalk * (uSunCol * 1.1 * moonShadow(vP) + uSkyCol * .7);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- JS helpers
function profJS(t, pk) {
  const w = sstep(0.5, 1, t);
  const wt = w + 0.1 * Math.sin(w * 18.85) * (1 - w) * w;
  const h = t < 1 ? -0.17 + (0.05 + 0.17) * wt : 0.05 * Math.exp(-(t - 1) * 5) * (1 - sstep(1.2, 1.5, t));
  return h + pk * 0.07 * Math.exp(-t * t * 28);
}
// the same table lookup the shader does (two displaced crater scales), so things can sit on the surface
function craterHeight(tab, x, y, z, row, cellM) {
  const px = x / cellM, py = y / cellM, pz = z / cellM;
  const bx = Math.floor(px - 0.5), by = Math.floor(py - 0.5), bz = Math.floor(pz - 0.5);
  let h = 0;
  for (let i = 0; i < 8; i++) {
    const cx = bx + (i & 1), cy = by + ((i >> 1) & 1), cz = bz + ((i >> 2) & 1);
    const mx = ((cx % 8) + 8) % 8, my = ((cy % 8) + 8) % 8, mz = ((cz % 8) + 8) % 8;
    const k = ((mz + row) * 64 + mx + 8 * my) * 4;
    const rad = 0.16 + 0.17 * tab[k + 3] / 255;
    const dx = px - (cx + tab[k] / 255), dy = py - (cy + tab[k + 1] / 255), dz = pz - (cz + tab[k + 2] / 255);
    const t = Math.sqrt(dx * dx + dy * dy + dz * dz) / rad;
    if (t < 1.5) h += profJS(t, tab[k + 3] >= 128 ? 1 : 0) * rad * cellM;
  }
  return h;
}
function toV3(v, out) { if (!v) return out; if (v.isVector3 || v.isColor) return out.copy(v); return out.set(v[0], v[1], v[2]); }
function setInst(geo, name, arr, size) { geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size)); }
// p1: one pit of the pit sheet (see buildHero), painted into a tileable square of n by n floats: centre (cx, cy) and radius r in pixels, its
// depth, the turn and the squeeze of its oval. Lit as from above: the wall under the upper rim dark, the wall over the lower rim paler, dust
// dark on the floor, a pale lip all round (palest above). A younger pit lies over an older one.
function paintPit(F, n, cx, cy, r, depth, turn, qx) {
  const e = Math.max(0.9 / r, 0.02), ct = Math.cos(turn), st = Math.sin(turn), qy = 1 / qx, Rb = Math.ceil(r * 1.3 * qx) + 1, x0 = Math.floor(cx), y0 = Math.floor(cy);
  for (let y = y0 - Rb; y <= y0 + Rb; y++) {
    const dy = y + 0.5 - cy, row = (y & (n - 1)) * n;
    for (let x = x0 - Rb; x <= x0 + Rb; x++) {
      const dx = x + 0.5 - cx, ex = (ct * dx + st * dy) * qy, ey = (ct * dy - st * dx) * qx, t = Math.sqrt(ex * ex + ey * ey) / r;
      if (t >= 1.3) continue;
      const up = dy / (Math.sqrt(dx * dx + dy * dy) || 1), wl = Math.min(1, Math.max(0, (t - 0.45) / 0.45)), wall = wl * wl, k1 = Math.min(1, Math.max(0, (t - 1 + e) / (2 * e)));
      const inside = -(0.3 + 0.25 * wall) - 0.45 * wall * up, lip = (1.3 - t) / 0.3 * (0.55 + 0.4 * up), i = row + (x & (n - 1));
      F[i] += ((inside + (lip - inside) * k1) * depth - F[i]) * Math.min(1, (1.3 - t) / 0.18);
    }
  }
}
// p1: the pit sheet as bytes with its mean taken out: 128 is nothing, 100 steps to one unit of depth
function pitBytes(F) {
  let mean = 0; for (let i = 0; i < F.length; i++) mean += F[i];
  mean /= F.length;
  const B = new Uint8Array(F.length);
  for (let i = 0; i < F.length; i++) B[i] = Math.max(0, Math.min(255, Math.round(128 + (F[i] - mean) * 100)));
  return B;
}

// a sphere whose latitude rings crowd into the band the camera flies along (and the belly)
function moonGeometry(nLon, nLat, lat0 = -Math.PI / 2, lat1 = Math.PI / 2, lon0 = 0, lon1 = TAU, dense = true, rad = R) {
  const dens = (th) => 1 + (dense ? 1.5 * sstep(-1.25, -0.9, th) * (1 - sstep(-0.2, 0.1, th)) : 0);
  const cdf = [0]; const M = 400;
  for (let i = 1; i <= M; i++) cdf.push(cdf[i - 1] + dens(lat0 + (lat1 - lat0) * (i - 0.5) / M));
  const lats = [];
  for (let j = 0, k = 0; j <= nLat; j++) {
    const target = cdf[M] * j / nLat;
    while (k < M - 1 && cdf[k + 1] < target) k++;
    lats.push(lat0 + (lat1 - lat0) * (k + (target - cdf[k]) / Math.max(cdf[k + 1] - cdf[k], 1e-6)) / M);
  }
  const closed = Math.abs(lon1 - lon0 - TAU) < 1e-6, cols = closed ? nLon : nLon + 1;
  const pos = new Float32Array((nLat + 1) * cols * 3);
  for (let j = 0, o = 0; j <= nLat; j++) {
    const cl = Math.cos(lats[j]), sl = Math.sin(lats[j]);
    for (let i = 0; i < cols; i++) {
      const ph = lon0 + (lon1 - lon0) * i / nLon;
      pos[o++] = Math.sin(ph) * cl * rad; pos[o++] = sl * rad; pos[o++] = Math.cos(ph) * cl * rad;
    }
  }
  const idx = new Uint32Array(nLat * nLon * 6);
  for (let j = 0, o = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
    const a = j * cols + i, b = j * cols + (i + 1) % cols, c = a + cols, d = b + cols;
    idx[o++] = a; idx[o++] = b; idx[o++] = c; idx[o++] = b; idx[o++] = d; idx[o++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---------------------------------------------------------------- small geometries
function poleGeometry() {           // unit-length larch pole along +Y, 5-sided, slight taper, open ends
  const g = new THREE.CylinderGeometry(0.078, 0.095, 1, 5, 1, true);
  g.translate(0, 0.5, 0);
  return g;
}
function boxGeometry(x0, x1, y0, y1, z0, z1) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}
function stoneGeometry(rng) {       // an irregular 20-faced lump of chalk, flat shaded, squashed onto the surface
  const g = new THREE.IcosahedronGeometry(1, 0);
  const p = g.attributes.position, jit = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = Math.round(p.getX(i) * 10) + ':' + Math.round(p.getY(i) * 10) + ':' + Math.round(p.getZ(i) * 10);
    if (!jit.has(key)) jit.set(key, [0.62 + rng() * 0.7, (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3]);
    const j = jit.get(key);
    p.setXYZ(i, p.getX(i) * j[0] + j[1], p.getY(i) * j[0] * 0.62, p.getZ(i) * j[0] + j[2]);
  }
  g.computeVertexNormals();
  return g;
}
function ringBoltGeometry() {       // plate on the chalk (local +Z = out of the surface), eye, and a ring hanging down
  const plate = boxGeometry(-0.32, 0.32, -0.32, 0.32, -0.05, 0.07);
  const eye = new THREE.TorusGeometry(0.16, 0.05, 3, 3, Math.PI); eye.rotateY(Math.PI / 2); eye.rotateX(-Math.PI / 2); eye.translate(0, 0, 0.07);
  const ring = new THREE.TorusGeometry(0.36, 0.06, 3, 7); ring.rotateY(0.5); ring.translate(0, -0.34, 0.2);
  const parts = [plate, eye, ring].map((q) => q.toNonIndexed());
  const g = mergeGeometries(parts);
  parts.forEach((q) => q.dispose()); plate.dispose(); eye.dispose(); ring.dispose();
  return g;
}
function ladderGeometry() {         // 6.6 m ladder along +Y: two stiles and seven rungs
  const parts = [boxGeometry(-0.3, -0.22, 0, 6.6, -0.04, 0.04), boxGeometry(0.22, 0.3, 0, 6.6, -0.04, 0.04)];
  for (let i = 0; i < 6; i++) parts.push(boxGeometry(-0.24, 0.24, 0.7 + i * 1.0, 0.76 + i * 1.0, -0.03, 0.03));
  const g = mergeGeometries(parts); parts.forEach((q) => q.dispose());
  return g;
}
function bucketGeometry() {         // zinc bucket 1.2 m tall hanging from a bail; origin at the bail top. uv.x = part (0 zinc, 1 light, 2 iron)
  const N = 8, pos = [], nor = [], uv = [], idx = [];
  const prof = [[0.34, -2.0, 0], [0.47, -0.86, 0.9], [0.52, -0.8, 1]];   // radius, y, v
  for (let j = 0; j < prof.length; j++) for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU; pos.push(Math.sin(a) * prof[j][0], prof[j][1], Math.cos(a) * prof[j][0]);
    nor.push(Math.sin(a) * 0.98, 0.12, Math.cos(a) * 0.98); uv.push(0, prof[j][2]);
  }
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  let base = pos.length / 3;                                   // bottom disc and the surface of the light
  for (const [r, y, part, ny] of [[0.34, -2.0, 0, -1], [0.45, -0.92, 1, 1]]) {
    pos.push(0, y, 0); nor.push(0, ny, 0); uv.push(part, 0.5);
    for (let i = 0; i <= N; i++) { const a = (i / N) * TAU; pos.push(Math.sin(a) * r, y, Math.cos(a) * r); nor.push(0, ny, 0); uv.push(part, 0.5); }
    for (let i = 0; i < N; i++) { if (ny > 0) idx.push(base, base + 1 + i, base + 2 + i); else idx.push(base, base + 2 + i, base + 1 + i); }
    base = pos.length / 3;
  }
  const M = 6;                                                 // the bail: a flat arc from rim to rim over the top
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * Math.PI, x = Math.cos(a) * 0.5, y = -0.82 + Math.sin(a) * 0.82;
    pos.push(x, y, -0.035, x, y, 0.035); nor.push(Math.cos(a), Math.sin(a), 0, Math.cos(a), Math.sin(a), 0); uv.push(2, 0, 2, 1);
    if (i < M) { const a0 = base + i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function gridGeometry(nx, ny, taper) {   // unit sheet x 0..1, y 0..1 (pennant: y centred, tapering to a point)
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny;
    pos.push(u, taper ? (v - 0.5) * (1 - u * 0.9) : v, 0); uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// collects instances (matrix, colour, fx) and turns them into one InstancedMesh
function makeBatch() {
  const m = [], c = [], f = [];
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4();
  return {
    count: () => f.length / 4,
    // origin o, axes ax/ay/az (not necessarily unit: they carry the scale), colour, fx [sector azimuth, release, random, kind]
    add(o, ax, ay, az, col, fx) {
      M.makeBasis(X.copy(ax), Y.copy(ay), Z.copy(az)).setPosition(o);
      for (let i = 0; i < 16; i++) m.push(M.elements[i]);
      c.push(col[0], col[1], col[2]); f.push(fx[0], fx[1], fx[2], fx[3]);
    },
    build(geo, mat) {
      const n = f.length / 4;
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(n, 1));
      mesh.count = n;
      mesh.instanceMatrix.array.set(m); mesh.instanceMatrix.needsUpdate = true;
      setInst(geo, 'aCol', new Float32Array(n ? c : [0, 0, 0]), 3);
      setInst(geo, 'aFx', new Float32Array(n ? f : [0, 9, 0, 3]), 4);
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- the hero
// the launch, as functions of progress: rise, slow turn, and a 24 m drift toward the gates so the belly stays over us
const sm5f = (x) => { const t = sat(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const turnAt = (prog, secs) => (2 * Math.PI / 180) * secs * Math.max(prog - 0.7, 0) * sm5f((prog - 0.68) / 0.08);
// the launch run: from u 0.74 the Moon gathers way down the dock (4.6 m/s2 up to 25 m/s), a little faster than we fly, so that it
// goes out over the gates above and ahead of us and is still in the picture at the ring
const driftAt = (prog, secs = 43) => { const t = Math.max(prog - 0.74, 0) * secs, a = 4.6, v = 25, t1 = v / a; return t < t1 ? 0.5 * a * t * t : 0.5 * a * t1 * t1 + v * (t - t1); };
const LIFT2 = 10;                              // it goes on rising as it runs (u 0.80-0.92), to clear the gate piers
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('moon-in-dry-dock') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cOchre, cTerra, cChalk, cSilver, cCobalt, cSlate, cGlow] = pal;
  const lin = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
  const job = opts.job || (rng.chance(0.72) ? 'third' : 'half');
  const secs = opts.journeySeconds || 43;

  const root = new THREE.Group(); root.name = 'moon-in-dry-dock';
  const moon = new THREE.Group(); moon.position.set(0, CY, 0); root.add(moon);

  // ---- the camera line the cradle is cut around (brief waypoints, local space)
  const WP = [[450, 37, 20], [350, 37, 20], [200, 64, 26], [140, 86, 12], [120, 90, -10], [81, 75, -81], [0, 60, -107], [-60, 32, -80], [-25, 18, 0], [0, 18, 62], [0, 18, 112], [0, 18, 165]];      // the extra point at z 112 keeps the last 53 m dead straight
  const path = makePath(WP, { samples: 600 });
  const ps = [];
  { const v = new THREE.Vector3(); const n = Math.ceil(path.length / 1.5);
    for (let i = 0; i <= n; i++) { path.pointAt(i / n, v); if (v.x * v.x + v.z * v.z < 175 * 175) ps.push(v.x, v.y, v.z); } }
  const pathDist = (x, y, z) => {
    let best = 1e12;
    for (let i = 0; i < ps.length; i += 3) { const dx = ps[i] - x, dy = ps[i + 1] - y, dz = ps[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  };
  await ctx.yield?.();
  const CLEAR = 6.3;

  // ---- light and shared uniforms (everything is lit analytically in the hero's local space)
  const sunDir = toV3(opts.sunDir, new THREE.Vector3(0.861, 0.454, -0.231)).normalize();
  const chalkN = cChalk.clone(); { const m = Math.max(chalkN.r, chalkN.g, chalkN.b); chalkN.multiplyScalar(1 / m); }
  const U = {
    uSunDir: { value: sunDir }, uMirTip: { value: 0.26 }, uMirSun: { value: new THREE.Vector3(-0.78, 0.31, -0.545).normalize() },
    uSunCol: { value: new THREE.Color('#FFE9C4').multiplyScalar(1.22) },
    uSkyCol: { value: new THREE.Color('#7F9CC4').multiplyScalar(0.62) },
    uGndCol: { value: cOchre.clone().multiplyScalar(0.2) },
    uZen: { value: cCobalt.clone().multiplyScalar(0.9) },
    uHor: { value: cCobalt.clone().lerp(new THREE.Color('#EAF2F8'), 0.72) },
    uMoonC: { value: new THREE.Vector3(0, CY, 0) },
    uMoonMat: { value: new THREE.Matrix4() },
    uRootInv: { value: new THREE.Matrix4() },
    uTime: { value: 0 }, uProg: { value: 0 }, uSecs: { value: secs }, uOpen: { value: 0 },
    uChalk: { value: chalkN }, uSilver: { value: cSilver.clone().lerp(new THREE.Color('#dfe8f2'), 0.4) },
    uOchre: { value: cOchre }, uTerra: { value: cTerra }, uSea: { value: cCobalt.clone().multiplyScalar(0.8) },
    uGlow: { value: cGlow }, uRope: { value: new THREE.Color(0.4, 0.31, 0.19) },
    uSelf: { value: new THREE.Color(0, 0, 0) },
    uStruck: { value: new THREE.Vector2(STRUCK[0], STRUCK[1]) }, uGap: { value: new THREE.Vector2(GAP[0], GAP[1]) },
  };
  const fogU = THREE.UniformsLib.fog;
  const mats = [];
  const shader = (vs, fs, extra = {}, o = {}) => {
    const m = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true, uniforms: { ...THREE.UniformsUtils.clone(fogU), ...U, ...extra }, ...o });
    mats.push(m); return m;
  };

  // ---- crater table: two scales of explicit craters, 8 x 8 x 8 cells each
  const tab = new Uint8Array(64 * 16 * 4);
  for (let i = 0; i < tab.length; i += 4) {
    tab[i] = rng.int(0, 255); tab[i + 1] = rng.int(0, 255); tab[i + 2] = rng.int(0, 255);
    const a = rng(); tab[i + 3] = Math.floor(255 * a * a * (i < 64 * 8 * 4 ? 1 : 0.95) + 12);
  }
  const tabTex = new THREE.DataTexture(tab, 64, 16, THREE.RGBAFormat, THREE.UnsignedByteType);
  tabTex.minFilter = tabTex.magFilter = THREE.NearestFilter; tabTex.generateMipmaps = false; tabTex.colorSpace = THREE.NoColorSpace; tabTex.needsUpdate = true;
  U.uCrTab = { value: tabTex };
  await ctx.yield?.();
  // ---- p1: the pit sheet. One tileable one-channel picture of small pits painted once from dice of its own (a stream made from the seed alone:
  // nothing the hero or the world deals is dealt anew). Every pit takes six dice (place x and y, size, depth, the turn and the squeeze of its
  // oval); all are drawn before the pit is painted and none is tested or thrown away. The sheet's mean is taken out, so a mip level too
  // coarse to hold a pit holds 128 (nothing), and the Moon's shader needs no distance to fade it by.
  const PIT_N = 1024, pitF = new Float32Array(PIT_N * PIT_N);
  {
    const prng = makeRng('moon-pits:' + ctx.seed);
    for (let k = 0; k < 500; k++) {
      const cx = prng() * PIT_N, cy = prng() * PIT_N, sz = prng(), dep = prng(), turn = prng() * Math.PI, sq = prng();
      paintPit(pitF, PIT_N, cx, cy, PIT_N * 0.005 * Math.pow(12, sz * sz * sz * sz), 0.55 + 0.45 * dep, turn, 1 + 0.11 * sq);      // radius 0.5 to 6 % of the tile, most of them small
      if (k % 32 === 31) await ctx.yield?.();
    }
  }
  await ctx.yield?.();
  const pitTex = new THREE.DataTexture(pitBytes(pitF), PIT_N, PIT_N, THREE.RedFormat, THREE.UnsignedByteType);
  pitTex.wrapS = pitTex.wrapT = THREE.RepeatWrapping; pitTex.minFilter = THREE.LinearMipmapLinearFilter; pitTex.magFilter = THREE.LinearFilter;
  pitTex.generateMipmaps = true; pitTex.anisotropy = 8; pitTex.colorSpace = THREE.NoColorSpace; pitTex.needsUpdate = true;
  U.uPits = { value: pitTex };
  await ctx.yield?.();

  // ---- the silvered lune
  // the seam on the camera's side stands at azimuth 139.5 (+-0.75) degrees plus SEAM_LEAN: about 13 m ahead of the lens at u 0.52 on
  // either job, so chalk, wet seam and mirror share that frame; 'half' carries the silver further round the far side
  const SEAM_AZ = 139.5 + rng.range(-3, 3) / 4;
  const luneHalf = (job === 'half' ? 90 : 60) * Math.PI / 180;
  const luneC = wrapPi(SEAM_AZ * Math.PI / 180 + luneHalf);
  const uLune = { value: new THREE.Vector3(luneC, luneHalf, 0) };
  const seamS = (dx, dy, dz) => {            // metres outside the silver (object space unit direction)
    const rho = R * Math.sqrt(Math.max(1 - dy * dy, 0));
    return Math.max((Math.abs(wrapPi(Math.atan2(dx, dz) - luneC)) - luneHalf + SEAM_LEAN - (SEAM_LEAN + SEAM_DOME) * sstep(-0.42, 0.02, dy)) * rho, (LUNE_LAT - Math.asin(Math.max(-1, Math.min(1, dy)))) * R);
  };
  const surfaceR = (dx, dy, dz) => {         // displaced radius along a unit direction
    const h = craterHeight(tab, dx * R, dy * R, dz * R, 0, CELL1) + craterHeight(tab, dx * R, dy * R, dz * R, 8, CELL2);
    return R + h * sstep(-7, 1.5, seamS(dx, dy, dz));
  };

  const moonU = { uLuneLat: { value: LUNE_LAT }, uRad: { value: R }, uMode: { value: 0 }, uLune, uSurveyY: { value: -44 + rng.range(-3, 3) },
    uSeedV: { value: new THREE.Vector3(rng.range(0, 40), rng.range(0, 40), rng.range(0, 40)) } };
  await ctx.yield?.();
  const moonMat = shader(MOON_VERT, MOON_FRAG, moonU);
  const moonMesh = new THREE.Mesh(moonGeometry(220, 98), moonMat);
  moonMesh.frustumCulled = false; moon.add(moonMesh);
  await ctx.yield?.();

  // ---- stones and flints in the chalk, ring-bolts (they ride with the Moon)
  const rockMat = shader(WOOD_VERT, WOOD_FRAG, {}, { defines: { MOONSPACE: 1 } });
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const dirFrom = (az, lat, out) => out.set(Math.sin(az) * Math.cos(lat), Math.sin(lat), Math.cos(az) * Math.cos(lat));
  {
    const srng = rng.fork ? rng.fork('stones') : rng;
    const stones = makeBatch();
    const nStones = Math.round(540 * detail);
    const seamAz = luneC - luneHalf + SEAM_LEAN;       // the seam on the camera's side, at gallery height
    for (let i = 0, guard = 0; i < nStones && guard < nStones * 6; guard++) {
      const pick = srng();
      let az, lat;
      if (pick < 0.62) { az = seamAz - srng.range(0.03, 1.1); lat = Math.asin((srng.range(50, 100) - CY) / R); }
      else if (pick < 0.8) { az = srng.range(0, TAU); lat = -Math.PI / 2 + Math.sqrt(srng()) * 0.62; }
      else { az = srng.range(0, TAU); lat = Math.asin(srng.range(-1, 1)); }
      dirFrom(az, lat, v0);
      if (seamS(v0.x, v0.y, v0.z) < 11) continue;
      const rr = surfaceR(v0.x, v0.y, v0.z);
      const s = 0.09 + Math.pow(srng(), 3) * 0.42;
      v1.copy(v0).multiplyScalar(rr + s * srng.range(-0.15, 0.2));
      // random frame with local Y along the surface normal
      v2.set(srng() - 0.5, srng() - 0.5, srng() - 0.5).cross(v0).normalize();
      v3.crossVectors(v2, v0);
      const flint = srng.chance(0.13), k = flint ? srng.range(0.1, 0.16) : srng.range(0.42, 0.58);
      const col = flint ? [k, k, k * 1.12] : [chalkN.r * k, chalkN.g * k, chalkN.b * k];
      stones.add(v1, v2.multiplyScalar(s * srng.range(0.8, 1.5)), v0.clone().multiplyScalar(s * srng.range(0.6, 1)), v3.multiplyScalar(s), col, [0, 9, srng(), 3]);
      i++;
    }
    await ctx.yield?.();
    moon.add(stones.build(stoneGeometry(srng), rockMat));
  }
  await ctx.yield?.();

  // ---- ring-bolts and the forty mooring ropes (bolt in the chalk -> bollard on the dock side)
  const ropeA = [], ropeB = [], ropeR = [], bollards = [];
  {
    const brng = rng.fork ? rng.fork('bolts') : rng;
    const bolts = makeBatch();
    const addBolt = (d, rr) => {
      v1.copy(d).multiplyScalar(rr + 0.02);
      v2.copy(UP).addScaledVector(d, -d.y).normalize();          // up along the surface
      v3.crossVectors(v2, d);
      const k = brng.range(0.1, 0.17);
      bolts.add(v1, v3.clone(), v2.clone(), d.clone(), [k * 1.1, k, k * 0.9], [0, 9, brng(), 3]);
    };
    const ropes = [];
    for (let i = 0; i < 40; i++) {
      for (let tries = 0; tries < 10; tries++) {
        const az = ((i + brng.range(-0.3, 0.3) + tries * 0.37) / 40) * TAU, lat = brng.range(-0.2, 0.13);
        dirFrom(az, lat, v0);
        const rr = surfaceR(v0.x, v0.y, v0.z);
        const ox = Math.sin(az), oz = Math.cos(az);
        const by = brng.pick([12, 18, 24, 30, 30]), off = 1.2 * (by / 6 - 1) + 0.6;   // altar k rises 6 m and steps back 1.2 m
        const t = Math.min((136 + off) / Math.max(Math.abs(ox), 1e-3), ((oz > 0 ? 154 : 140) + off) / Math.max(Math.abs(oz), 1e-3));
        let bx = ox * t, bz = oz * t;
        if (bz > 150 && Math.abs(bx) < 22) bx = bx < 0 ? -22 : 22;
        const ax = v0.x * (rr + 0.3), ay = v0.y * (rr + 0.3) + CY, az2 = v0.z * (rr + 0.3);
        let ok = true; const sag = brng.range(2, 5);
        for (let q = 0; q <= 20 && ok; q++) { const f = q / 20; if (pathDist(ax + (bx - ax) * f, ay + (by - ay) * f - sag * 4 * f * (1 - f), az2 + (bz - az2) * f) < 9) ok = false; }
        if (!ok) continue;
        ropes.push({ az, a: [v0.x * (rr + 0.3), v0.y * (rr + 0.3), v0.z * (rr + 0.3)], b: [bx, by, bz], sag });
        addBolt(v0, rr);
        break;
      }
    }
    ropes.sort((p, q) => Math.abs(wrapPi(p.az - STRUCK[0])) - Math.abs(wrapPi(q.az - STRUCK[0])));
    ropes.forEach((r, i) => {
      ropeA.push(...r.a); ropeB.push(...r.b); ropeR.push(0.62 + 0.12 * i / Math.max(ropes.length - 1, 1), r.sag, 0.3, 0);
      bollards.push({ position: new THREE.Vector3(...r.b) });
    });
    // eight short belly ropes down to ring-bolts in the dock floor, 9-15 m either side of where the camera passes
    // under the overhang: each is slipped as we come up to it, so it is caught mid-whip, hanging from the rising belly
    {
      const cp = new THREE.Vector3(), cq = new THREE.Vector3();
      for (let k = 0; k < 9; k++) {
        const uv = 0.748 + k * 0.0125, rel = uv - 0.088 + 0.006 * (k % 3);
        // alternately far out on the -X side (clear of the sight line to the ring) and close in on the +X side
        const cands = k % 2 === 0 ? [-27, -31, -35, -23, -39, 11, 13.5, 16] : [10.5, 13, 16, 19, -27, -33];
        path.pointAt(uv, cp); path.pointAt(uv + 0.004, cq); cq.sub(cp); cq.y = 0; cq.normalize();
        for (let tries = 0; tries < cands.length; tries++) {
          const side = cands[tries];
          const wx = cp.x + cq.z * side + cq.x * 4, wz = cp.z - cq.x * side + cq.z * 4 - driftAt(uv);
          const th = -turnAt(uv, secs), hx = wx * Math.cos(th) + wz * Math.sin(th), hz = -wx * Math.sin(th) + wz * Math.cos(th);
          const h2 = hx * hx + hz * hz;
          if (h2 > 84 * 84 || h2 < 9 * 9) continue;
          { let hid = false;                                       // would it stand in front of the ring from the approach?
            for (let cu = 0.72; cu < uv - 0.012 && !hid; cu += 0.01) {
              path.pointAt(cu, v2); const wzz = wz + driftAt(cu);
              const a1 = Math.atan2(wx - v2.x, wzz - v2.z), a2 = Math.atan2(0 - v2.x, 165 - v2.z);
              if (Math.abs(wrapPi(a1 - a2)) < 0.06) hid = true;
            }
            if (hid) continue; }
          v0.set(hx, -Math.sqrt(R * R - h2), hz).normalize();
          const rr = surfaceR(v0.x, v0.y, v0.z), hl = Math.sqrt(h2);
          const ax = v0.x * (rr + 0.3), ay = v0.y * (rr + 0.3), az2 = v0.z * (rr + 0.3);
          const out = 7 + 2 * (k % 3), bx = hx + hx / hl * out, bz = hz + hz / hl * out;
          let ok = true;
          for (let q = 0; q <= 12 && ok; q++) { const f = q / 12; if (pathDist(ax + (bx - ax) * f, ay + CY + (0.4 - ay - CY) * f, az2 + (bz - az2) * f) < 8.5) ok = false; }
          if (!ok) continue;
          ropeA.push(ax, ay, az2); ropeB.push(bx, 0.4, bz); ropeR.push(rel, 1.2, 0.46, 0);
          bollards.push({ position: new THREE.Vector3(bx, 0, bz) });
          addBolt(v0, rr);
          break;
        }
      }
    }
    for (const [hx, hz, rel] of [[-28.5, 11, 0.728], [-37, -8, 0.716]]) {
      const h2 = hx * hx + hz * hz, hl = Math.sqrt(h2);
      v0.set(hx, -Math.sqrt(R * R - h2), hz).normalize();
      const rr = surfaceR(v0.x, v0.y, v0.z);
      ropeA.push(v0.x * (rr + 0.3), v0.y * (rr + 0.3), v0.z * (rr + 0.3)); ropeB.push(hx + hx / hl * 6, 0.4, hz + hz / hl * 6); ropeR.push(rel, 1.0, 0.31, 0);
      bollards.push({ position: new THREE.Vector3(hx + hx / hl * 6, 0, hz + hz / hl * 6) });
      addBolt(v0, rr);
    }
    for (let i = 0, guard = 0; i < 70 && guard < 600; guard++) {
      dirFrom(brng.range(0, TAU), Math.asin(brng.range(-0.95, 0.5)), v0);
      if (seamS(v0.x, v0.y, v0.z) < 3) continue;
      addBolt(v0, surfaceR(v0.x, v0.y, v0.z)); i++;
    }
    moon.add(bolts.build(ringBoltGeometry(), rockMat));
  }
  await ctx.yield?.();

  // ---- the cradle: standards on rings, plank decks stepping in under the overhang, rails, ledgers, braces
  const woodMat = shader(WOOD_VERT, WOOD_FRAG);
  const poles = makeBatch(), spars = makeBatch(), boxes = makeBatch();
  const srng = rng.fork ? rng.fork('scaffold') : rng;
  const inSector = (az, sec) => Math.abs(wrapPi(az - sec[0])) < sec[1];
  const active = (az) => !inSector(az, STRUCK) && !inSector(az, GAP);
  const PET = TAU / 16;
  const petalOf = (az) => Math.round(az / PET) * PET;
  const relOf = (az) => 0.62 + 0.13 * Math.pow(Math.abs(wrapPi(petalOf(az) - STRUCK[0])) / Math.PI, 0.8);
  const fxOf = (az, kind) => [petalOf(az), relOf(az), srng(), kind];
  const street = (az, y) => (Math.abs(wrapPi(az - Math.PI / 2)) < 0.46 && y >= 46 ? 0.04 : 0);     // see WOOD_VERT: dressed only from near
  const rs = (y) => Math.sqrt(Math.max(R * R - (y - CY) * (y - CY), 0));
  const larch = () => { const k = srng.range(0.8, 1.2), g = srng.range(0, 0.25); return [(0.4 - 0.1 * g) * k, (0.28 - 0.02 * g) * k, (0.16 + 0.06 * g) * k]; };
  const plankCol = () => { const k = srng.range(0.82, 1.18); return [0.47 * k, 0.385 * k, 0.26 * k]; };
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), dX = new THREE.Vector3(), dY = new THREE.Vector3(), dZ = new THREE.Vector3();
  const addPole = (x0, y0, z0, x1, y1, z1, thick, col, fx, batch = poles) => {
    pA.set(x0, y0, z0); dY.set(x1 - x0, y1 - y0, z1 - z0);
    const len = dY.length(); if (len < 0.3) return;
    dX.set(dY.z, 0, -dY.x); if (dX.lengthSq() < 1e-6) dX.set(1, 0, 0); dX.normalize();
    dZ.crossVectors(dX, dY).normalize();
    batch.add(pA, dX.multiplyScalar(thick), dY, dZ.multiplyScalar(thick), col, fx);
  };
  const clearSeg = (x0, y0, z0, x1, y1, z1, n = 3, margin = CLEAR) => {
    for (let q = 0; q <= n; q++) { const f = q / n; if (pathDist(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, z0 + (z1 - z0) * f) < margin) return false; }
    return true;
  };
  // per level: inner deck edge and the ring its outer edge lands on
  const levels = [];
  for (let k = 1; k <= NLEV; k++) {
    const y = k * LEVEL, e = Math.max(rs(y), rs(y + 2.4)) + 1.0;
    if (e < 36) continue;
    const j = Math.floor((RING0 - (e + 2.6)) / RING_STEP);
    levels.push({ k, y, e, j, out: RING0 - RING_STEP * j });
  }
  const NRING = 16, ringTop = new Float32Array(NRING);
  ringTop[0] = CY + 1.4;
  for (const L of levels) {
    ringTop[L.j] = Math.max(ringTop[L.j], L.y + 1.2);
    if (L.j + 1 < 6 && RING0 - RING_STEP * (L.j + 1) >= L.e + 0.2) ringTop[L.j + 1] = Math.max(ringTop[L.j + 1], L.y);
  }
  const deckList = [];
  for (let a = 0; a < NAZ; a++) {
    if (a % 4 === 0) await ctx.yield?.();
    const az = a * DAZ; if (!active(az)) continue;
    const ox = Math.sin(az), oz = Math.cos(az), tx = -oz, tz = ox;      // tangent used as the deck's local Z
    for (const L of levels) {
      const wid = L.out - L.e, mid = (L.out + L.e) / 2, len = DAZ * mid * 1.015;
      for (const [f0, f1] of [[-0.5, 0.5]]) {
        const tryPart = (g0, g1) => {
          let ok = true;
          for (let qi = 0; qi < 3 && ok; qi++) for (let qj = 0; qj < 3 && ok; qj++) {
            const rr = L.e + wid * qi / 2, tt = (g0 + (g1 - g0) * qj / 2) * len;
            if (pathDist(ox * rr + tx * tt, L.y, oz * rr + tz * tt) < CLEAR) ok = false;
          }
          if (!ok) return false;
          const c = (g0 + g1) / 2 * len;
          pA.set(ox * L.e + tx * c, L.y, oz * L.e + tz * c);
          boxes.add(pA, dX.set(ox * wid, 0, oz * wid), dY.set(0, 1, 0), dZ.set(tx * len * (g1 - g0), 0, tz * len * (g1 - g0)), plankCol(), fxOf(az, 1 + street(az, L.y)));
          deckList.push({ az, y: L.y, e: L.e, out: L.out, k: L.k, x: ox * mid + tx * c, z: oz * mid + tz * c });
          return true;
        };
        if (!tryPart(f0, f1)) { tryPart(-0.5, 0); tryPart(0, 0.5); }
      }
      // guard rail along the outer edge
      const h0 = az - DAZ / 2, h1 = az + DAZ / 2, ro = L.out;
      const x0 = Math.sin(h0) * ro, z0 = Math.cos(h0) * ro, x1 = Math.sin(h1) * ro, z1 = Math.cos(h1) * ro;
      const nearPath = pathDist(ox * ro, L.y, oz * ro) < 45;
      if ((L.k >= 9 || nearPath) && (nearPath || srng() < 0.4 + 0.6 * detail) && clearSeg(x0, L.y + 1.05, z0, x1, L.y + 1.05, z1)) {
        addPole(x0, L.y + 1.05 + srng.range(-0.06, 0.06), z0, x1, L.y + 1.05 + srng.range(-0.06, 0.06), z1, 0.8, larch(), fxOf(az, street(az, L.y)), nearPath ? poles : spars);
      }
    }
    // outer face: ledgers every 12 m, the top rails, a diagonal brace every third bay
    const h0 = az - DAZ / 2, h1 = az + DAZ / 2;
    for (let ring = 0; ring < 2; ring++) {
      const ro = RING0 - ring * RING_STEP;
      const x0 = Math.sin(h0) * ro, z0 = Math.cos(h0) * ro, x1 = Math.sin(h1) * ro, z1 = Math.cos(h1) * ro;
      for (let k = ring === 0 ? 1 : 22; k <= 22; k++) {
        const y = k === 22 ? CY + 1.1 : k * LEVEL + 0.1;
        if (clearSeg(x0, y, z0, x1, y, z1)) addPole(x0, y, z0, x1, y, z1, 0.85, larch(), fxOf(az, street(az, y)), pathDist((x0 + x1) / 2, y, (z0 + z1) / 2) < 40 ? poles : spars);
      }
      if (ring === 0 && a % 3 === 0) for (let k = 1; k < 20; k += 3) {
        const y0 = k * LEVEL, y1 = y0 + 18;
        if (clearSeg(x0, y0, z0, x1, y1, z1, 6)) addPole(x0, y0, z0, x1, y1, z1, 0.8, larch(), fxOf(az, street(az, y1)), spars);
      }
    }
  }
  // standards on the bay boundaries, cut where the camera's gallery passes
  const topRail = [];
  for (let b = 0; b < NAZ; b++) {
    if (b % 4 === 0) await ctx.yield?.();
    const az = (b + 0.5) * DAZ;
    if (!active(az - DAZ / 2) && !active(az + DAZ / 2)) continue;
    const fxAz = active(az - DAZ / 2) ? az - DAZ / 2 : az + DAZ / 2;
    for (let j = 0; j < NRING; j++) {
      if (ringTop[j] <= 0) continue;
      const ro = RING0 - RING_STEP * j;
      if (ro < 96 && (b & 1)) continue;
      if (ro < 96 && srng() > 0.55 + 0.45 * detail) continue;
      const x = Math.sin(az) * ro + srng.range(-0.12, 0.12), z = Math.cos(az) * ro + srng.range(-0.12, 0.12);
      const staff = j === 0 && srng() < 0.85 ? srng.range(2.2, 4.2) : 0;
      const top = ringTop[j] + staff;
      const lx = srng.range(-0.004, 0.004), lz = srng.range(-0.004, 0.004);   // nothing hand-built is plumb
      let start = -1;
      for (let y = 0; y <= top + 0.001; y += 1) {
        const free = pathDist(x, y, z) > CLEAR;
        if (free && start < 0) start = y;
        const last = y + 1 > top + 0.001;
        if ((!free || last) && start >= 0) {
          const y1 = free ? top : y - 1;
          if (y1 - start > 0.8) addPole(x + lx * start, start, z + lz * start, x + lx * y1, y1, z + lz * y1, 1, larch(), fxOf(fxAz, street(az, 99)));
          start = -1;
        }
      }
      if (j === 0) topRail.push({ position: new THREE.Vector3(x, CY + 1.2, z), staff: staff ? top : 0, az });
    }
  }
  await ctx.yield?.();

  // ---- keel blocks, bilge shores, loose planks, things put down on the decks (all one box batch)
  const oak = () => { const k = srng.range(0.8, 1.15); return [0.3 * k, 0.215 * k, 0.135 * k]; };
  const addBox = (cx, cy, cz, xd, w, h, zd, len, col, fx) => {      // centre, unit X dir, width, height, unit Z dir, length
    dZ.copy(zd).multiplyScalar(len); dX.copy(xd).multiplyScalar(w);
    dY.crossVectors(zd, xd).normalize().multiplyScalar(h / 0.08);
    pA.set(cx, cy, cz).addScaledVector(xd, -w / 2);
    boxes.add(pA, dX, dY, dZ, col, fx);
  };
  const XA = new THREE.Vector3(1, 0, 0), ZA = new THREE.Vector3(0, 0, 1), tA = new THREE.Vector3(), tB = new THREE.Vector3();
  // keel blocks: cribs of cross-laid oak baulks, each course shorter than the one below, on two long sole timbers,
  // capped with a block and folding wedges, chalk rubble at the foot
  const keelOak = () => { const k = srng.range(0.8, 1.2); return [0.215 * k, 0.15 * k, 0.092 * k]; };      // old oak, darker than the stone it stands on
  const UPV = new THREE.Vector3(0, 1, 0), IRONK = [0.06, 0.06, 0.07];
  for (const sx of [-1, 1]) addBox(sx * 2.9, 0.3, 0, XA, 0.7, 0.6, ZA, 66, keelOak(), [0, 9, srng(), 5]);
  const dogs = [];
  for (let z = -28; z <= 28.01; z += 7) {
    const yb = CY - Math.sqrt(R * R - z * z) - 0.45;
    if (pathDist(0, yb, z) < 7.5) continue;
    const y0 = 0.6, lh = 0.95, nl = Math.max(2, Math.floor((yb - y0 - 0.5) / lh));
    for (let l = 0; l < nl; l++) {
      const y = y0 + (l + 0.5) * lh, f = l / nl;
      if (l % 2 === 0) for (const dz of [-1, 0, 1]) addBox(srng.range(-0.12, 0.12), y, z + dz * (2.05 - 0.75 * f), ZA, 0.8, lh - 0.04, XA, 8.2 - 3.6 * f + srng.range(-0.25, 0.25), keelOak(), [0, 9, srng(), 4]);
      else for (const dx of [-1, 0, 1]) addBox(dx * (2.9 - 1.5 * f), y, z + srng.range(-0.1, 0.1), XA, 0.8, lh - 0.04, ZA, 5.6 - 1.9 * f + srng.range(-0.2, 0.2), keelOak(), [0, 9, srng(), 4]);
      dogs.push([l, y, f, z]);
    }
    const capY = y0 + nl * lh, capH = Math.max(yb - capY, 0.3);              // the capping block and its wedges
    addBox(0, capY + capH / 2, z, ZA, 1.5, capH, XA, 3.0, keelOak(), [0, 9, srng(), 5]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(sx * 1.85, capY + 0.22, z + sz * 0.5, ZA, 0.42, 0.44, XA, 1.3, [0.4, 0.31, 0.19], [0, 9, srng(), 3]);
    for (let q = 0; q < 4; q++) {                                               // chalk rubble fallen round the foot
      const yaw = srng.range(0, TAU), sz = srng.range(0.35, 0.9), rx = srng.range(-1, 1) * 5.5, rz = z + srng.range(-3.2, 3.2);
      tA.set(Math.sin(yaw), 0, Math.cos(yaw)); tB.set(tA.z, 0, -tA.x);
      if (Math.abs(rx) < 2.2 || pathDist(rx, sz, rz) < 7.5) continue;
      const kc = srng.range(0.5, 0.62);
      addBox(rx, sz * 0.35, rz, tB, sz, sz * 0.7, tA, sz * srng.range(0.8, 1.5), [chalkN.r * kc, chalkN.g * kc, chalkN.b * kc], [0, 9, srng(), 3]);
    }
  }
  {   // iron dogs across the joints of each crib, and round the cribs nearest our way under the belly: fallen shores, a litter of wedges
    const krng = makeRng(1 + tab[0] + tab[1] * 256 + tab[2] * 65536);      // its own stream, so nothing built after it changes
    for (const [l, y, f, z] of dogs) {
      if (l === 0) continue;
      const along = l % 2 === 0;                                     // this course's baulks run along X (their ends face +-X)
      for (const e of [-1, 1]) for (const q of [-1, 1]) {
        const half = along ? (8.2 - 3.6 * f) / 2 - 0.55 : (5.6 - 1.9 * f) / 2 - 0.5, off = along ? (2.05 - 0.75 * f) + 0.42 : (2.9 - 1.5 * f) + 0.42;
        if (along) addBox(e * half, y - 0.47, z + q * off, XA, 0.1, 0.05, UPV, 0.6, IRONK, [0, 9, krng(), 3]);
        else addBox(q * off, y - 0.47, z + e * half, ZA, 0.1, 0.05, UPV, 0.6, IRONK, [0, 9, krng(), 3]);
      }
    }
    for (let i = 0; i < 7; i++) {                                    // shores knocked out and left lying
      const zc = krng.range(6, 33), xc = -krng.range(5.5, 12) * (i % 3 === 2 ? -1 : 1), yaw = krng.range(-0.5, 0.5) + (i % 2 ? 0.9 : 0), len = krng.range(6.5, 9.5);
      if (pathDist(xc, 0.3, zc) < 7.5) continue;
      tA.set(Math.sin(yaw), 0, Math.cos(yaw)); tB.set(tA.z, 0, -tA.x);
      addBox(xc, 0.23 + (i === 3 ? 0.42 : 0), zc, tB, 0.42, 0.42, tA, len, keelOak().map((v) => v * 1.25), [0, 9, krng(), 4]);
    }
    for (let i = 0; i < 26; i++) {                                   // folding wedges, driven out and scattered
      const zc = krng.range(2, 34), xc = krng.range(4.2, 10.5) * (krng() < 0.7 ? -1 : 1), yaw = krng.range(0, TAU);
      tA.set(Math.sin(yaw), 0, Math.cos(yaw)); tB.set(tA.z, 0, -tA.x);
      const k = krng.range(0.8, 1.2);
      addBox(xc, 0.12, zc, tB, 0.38, 0.22, tA, krng.range(0.8, 1.3), [0.4 * k, 0.31 * k, 0.19 * k], [0, 9, krng(), 3]);
    }
  }
  await ctx.yield?.();
  for (let i = 0; i < 22; i++) {                                     // shores propping the bilge; they fall when it lifts
    const az = (i + 0.5) / 22 * TAU + srng.range(-0.05, 0.05), rH = srng.range(40, 50), rF = rH + srng.range(14, 20);
    const yH = CY - Math.sqrt(R * R - rH * rH) - 0.25, ox = Math.sin(az), oz = Math.cos(az);
    tA.set(ox * (rF - rH), -yH, oz * (rF - rH)); const len = tA.length(); tA.normalize();
    tB.set(oz, 0, -ox);
    let relS = 0.655 + 0.05 * srng();
    {
      const mx = ox * (rH + rF) / 2, mz = oz * (rH + rF) / 2; let bd = 1e9, bu = 0;
      for (let q = 0; q <= 36; q++) { const uu = 0.68 + q * 0.005; path.pointAt(uu, pA); const dd = Math.hypot(pA.x - mx, pA.z - mz); if (dd < bd) { bd = dd; bu = uu; } }
      if (bd > 15 && bd < 75) relS = Math.min(0.8, Math.max(0.67, bu - 0.05 + 0.012 * (i % 3)));
    }
    addBox(ox * (rH + rF) / 2, yH / 2, oz * (rH + rF) / 2, tB, 0.5, 0.5, tA, len, oak().map((v) => v * 1.55), [az, relS, srng(), 2]);
  }
  for (const D of deckList) {
    await ctx.yield?.();
    const nearStruck = Math.abs(wrapPi(D.az - STRUCK[0])) < STRUCK[1] + 0.75, nearGap = Math.abs(wrapPi(D.az - GAP[0])) < GAP[1] + 0.45;
    if ((nearStruck || nearGap) && D.y <= 66 && srng() < 0.6) {
      const n = srng.int(1, 3);
      for (let q = 0; q < n; q++) {
        const yaw = D.az + Math.PI / 2 + srng.range(-0.5, 0.5); tA.set(Math.sin(yaw), 0, Math.cos(yaw)); tB.set(tA.z, 0, -tA.x);
        const rr = srng.range(D.e + 0.6, D.out - 0.3), ox = Math.sin(D.az), oz = Math.cos(D.az);
        addBox(ox * rr + tA.x * srng.range(-1.5, 1.5), D.y + 0.085 + q * 0.07, oz * rr + tA.z * srng.range(-1.5, 1.5), tB, 0.3, 0.06, tA, srng.range(3.2, 4.4), plankCol(), [D.az, 0.63 + 0.14 * srng(), srng(), 2]);
      }
    }
    const pd = pathDist(D.x, D.y, D.z);
    if (pd < 12.5 && pd > CLEAR) {                                   // work left lying on the decks by the gallery
      const ox = Math.sin(D.az), oz = Math.cos(D.az), n = srng.int(2, 4);
      for (let q = 0; q < n; q++) {
        const yaw = srng.range(0, TAU); tA.set(Math.sin(yaw), 0, Math.cos(yaw)); tB.set(tA.z, 0, -tA.x);
        const rr = srng.range(D.e + 0.4, D.out - 0.4), tt = srng.range(-3, 3);
        const x = ox * rr - oz * tt, z = oz * rr + ox * tt, kind = srng();
        const fx = [petalOf(D.az), relOf(D.az), srng(), 3];
        if (kind < 0.3) addBox(x, D.y + 0.075, z, tB, 0.36, 0.07, tA, 0.46, [0.74, 0.77, 0.82], fx);            // a book of silver leaf
        else if (kind < 0.55) addBox(x, D.y + 0.21, z, tB, 0.3, 0.34, tA, 0.3, [0.4, 0.44, 0.48], fx);      // pail
        else if (kind < 0.8) addBox(x, D.y + 0.08, z, tB, 0.14, 0.07, tA, 1.4, [0.2, 0.15, 0.1], fx);        // long brush
        else addBox(x, D.y + 0.1, z, tB, 0.7, 0.12, tA, 0.7, [0.3, 0.24, 0.15], fx);                     // coil of rope
      }
    }
  }
  // ladders between decks
  const ladders = makeBatch();
  for (let i = 0, guard = 0; i < Math.round(36 * detail) && guard < 900; guard++) {
    const D = deckList[srng.int(0, deckList.length - 1)];
    if (D.k < 3 || D.k > 20 || D.out - D.e < 2.2) continue;
    const ox = Math.sin(D.az), oz = Math.cos(D.az), rr = D.out - 0.45, tt = srng.range(-2.5, 2.5);
    const x = ox * rr - oz * tt, z = oz * rr + ox * tt;
    if (pathDist(x - ox * 0.6, D.y + 3, z - oz * 0.6) < 7.5) continue;
    dY.set(-ox * 1.3, 6.2, -oz * 1.3).normalize(); dX.set(-oz, 0, ox); dZ.crossVectors(dX, dY).normalize();
    ladders.add(pA.set(x, D.y, z), dX, dY, dZ, larch(), fxOf(D.az, 0.25));
    i++;
  }
  await ctx.yield?.();
  root.add(poles.build(poleGeometry(), woodMat));
  await ctx.yield?.();
  { const g3 = new THREE.CylinderGeometry(0.09, 0.1, 1, 3, 1, true); g3.translate(0, 0.5, 0); root.add(spars.build(g3, woodMat)); }
  await ctx.yield?.();
  root.add(boxes.build(boxGeometry(0, 1, -0.04, 0.04, -0.5, 0.5), woodMat));
  await ctx.yield?.();
  root.add(ladders.build(ladderGeometry(), woodMat));
  await ctx.yield?.();

  // ---- canvas: tarpaulins on the outer face and along the gallery, pennants on the staffs
  const clothMat = shader(CLOTH_VERT, CLOTH_FRAG, {}, { side: THREE.DoubleSide });
  const tarps = makeBatch(), tarpPh = [], flags = makeBatch(), flagPh = [];
  const cream = [0.74, 0.68, 0.54], rust = lin(cTerra.clone().lerp(new THREE.Color('#7a5238'), 0.5), 0.78), blue = lin(cCobalt.clone().lerp(new THREE.Color('#b9c4cf'), 0.5), 0.95);
  const tarpCol = () => { const c = srng.pick([cream, cream, cream, rust, rust, blue, blue]), k = srng.range(0.82, 1.1); return [c[0] * k, c[1] * k, c[2] * k]; };
  const addTarp = (b, ro, y, h) => {
    const h0 = (b - 0.5) * DAZ + 0.008, h1 = (b + 0.5) * DAZ - 0.008;
    const x0 = Math.sin(h0) * ro, z0 = Math.cos(h0) * ro, x1 = Math.sin(h1) * ro, z1 = Math.cos(h1) * ro;
    if (!clearSeg(x0, y + h / 2, z0, x1, y + h / 2, z1, 4, CLEAR + 0.9)) return false;
    dX.set(x1 - x0, 0, z1 - z0); dY.set(0, h, 0); dZ.set(Math.sin(b * DAZ), 0, Math.cos(b * DAZ));
    tarps.add(pA.set(x0, y, z0), dX, dY, dZ, tarpCol(), fxOf(b * DAZ, 3 + street(b * DAZ, 99)));
    tarpPh.push(srng.range(0, 30), srng.range(0.5, 1.1), 0);
    return true;
  };
  const used = new Set();
  for (let a = 0; a < NAZ; a++) {                                    // along the gallery: on the poles outboard of the camera
    if (a % 8 === 0) await ctx.yield?.();
    const az = a * DAZ; if (!active(az)) continue;
    let best = 1e9, pr = 0, py = 0;
    for (let i = 0; i < ps.length; i += 3) {
      const d = Math.abs(wrapPi(Math.atan2(ps[i], ps[i + 2]) - az)), rr = Math.hypot(ps[i], ps[i + 2]);
      if (rr < 128 && rr > 95 && d < best) { best = d; pr = rr; py = ps[i + 1]; }
    }
    if (best > DAZ) continue;
    const ring = RING0 - RING_STEP * Math.floor((RING0 - (pr + CLEAR + 0.4)) / RING_STEP);
    if (ring > RING0) continue;
    for (const dy of [-8.6, -2.8, 3.0]) if (srng() < 0.8 && addTarp(a, ring + 0.14, py + dy, 5.4)) used.add(a + ':' + Math.round((py + dy) / 6));
  }
  for (let i = 0, guard = 0; i < Math.round(105 * detail) && guard < 2000; guard++) {
    if (guard % 40 === 0) await ctx.yield?.();
    const a = srng.int(0, NAZ - 1), k = srng.int(4, 20);
    if (!active(a * DAZ) || used.has(a + ':' + k)) continue;
    const outer = srng() < 0.72;
    const tall = k < 20 && srng() < 0.3 && !used.has(a + ':' + (k + 1));
    if (addTarp(a, outer ? RING0 + 0.14 : RING0 - RING_STEP + 0.14, k * LEVEL + 0.35, tall ? 11.3 : 5.3)) { used.add(a + ':' + k); if (tall) used.add(a + ':' + (k + 1)); i++; }
  }
  const penCols = [lin(cTerra), lin(cCobalt), lin(cOchre), [0.8, 0.8, 0.78], lin(cTerra, 0.8)];
  for (const T of topRail) {
    if (!T.staff || flagPh.length / 3 >= Math.round(80 * detail)) continue;
    const L = srng.range(2.8, 4.4);
    dX.set(srng.range(-0.25, 0.25), 0, 1).normalize(); dZ.set(-dX.z, 0, dX.x); dY.set(0, srng.range(0.9, 1.3), 0);
    flags.add(pA.set(T.position.x, T.staff - 0.7, T.position.z), dX.multiplyScalar(L), dY, dZ, srng.pick(penCols), fxOf(T.az, 3 + street(T.az, 99)));
    flagPh.push(srng.range(0, 30), srng.range(0.3, 0.5), 1);
  }
  {
    const tg = gridGeometry(6, 5, false), fg = gridGeometry(8, 1, true);
    const tm = tarps.build(tg, clothMat), fm = flags.build(fg, clothMat);
    setInst(tg, 'aPh', new Float32Array(tarpPh.length ? tarpPh : [0, 0, 0]), 3);
    setInst(fg, 'aPh', new Float32Array(flagPh.length ? flagPh : [0, 0, 1]), 3);
    root.add(tm, fm);
  }
  await ctx.yield?.();

  // ---- bucket hoists: endless ropes, zinc buckets brim-full of pale light going up, empties coming down
  await ctx.yield?.();
  const hoists = [], hA = [], hB = [];
  {
    const hrng = rng.fork ? rng.fork('hoists') : rng;
    const addHoist = (az, ro, H, n) => {
      const x = Math.sin(az) * ro, z = Math.cos(az) * ro, tx = Math.cos(az), tz = -Math.sin(az);
      const pet = petalOf(az), rel = relOf(az), speed = hrng.range(2.6, 3.6);
      const ph0 = hrng();
      for (let i = 0; i < n; i++) { hA.push(x, z, H, (ph0 + i / n) % 1); hB.push(pet, rel, speed, hrng()); }
      for (const sg of [-1, 1]) {
        ropeA.push(x + tx * 0.8 * sg, 0.2, z + tz * 0.8 * sg); ropeB.push(x + tx * 0.8 * sg, H + 1.3, z + tz * 0.8 * sg);
        ropeR.push(pet, rel, 0.085, -sg);
      }
      // the sheave beam and its two cheeks
      addPoleLate(Math.sin(az) * (ro - 3.2), H + 1.5, Math.cos(az) * (ro - 3.2), Math.sin(az) * (ro + 0.7), H + 1.5, Math.cos(az) * (ro + 0.7), 1.3, [pet, rel, hrng(), 0]);
      addPoleLate(x - tx * 1.1, H + 1.3, z - tz * 1.1, x + tx * 1.1, H + 1.3, z + tz * 1.1, 2.4, [pet, rel, hrng(), 0]);
      hoists.push({ position: new THREE.Vector3(x, 0, z), top: H + 1.3 });
    };
    const late = makeBatch();
    var addPoleLate = (x0, y0, z0, x1, y1, z1, thick, fx) => {
      pA.set(x0, y0, z0); dY.set(x1 - x0, y1 - y0, z1 - z0);
      dX.set(dY.z, 0, -dY.x).normalize(); dZ.crossVectors(dX, dY).normalize();
      late.add(pA, dX.multiplyScalar(thick), dY, dZ.multiplyScalar(thick), larch(), fx);
    };
    const nOuter = 16 + hrng.int(0, 3);
    for (let i = 0; i < nOuter; i++) {
      const az = (Math.round(((i + 0.5) / nOuter) * NAZ) + 0.5) * DAZ;
      if (!active(az - DAZ) || !active(az + DAZ)) continue;
      if (!clearSeg(Math.sin(az) * 133.7, 0, Math.cos(az) * 133.7, Math.sin(az) * 133.7, 126, Math.cos(az) * 133.7, 40, 7.5)) continue;
      addHoist(az, 133.7, 122 + hrng.range(0, 4), 4);
    }
    for (let a = 0; a < NAZ; a += 2) {                               // hoists in shafts just outboard of the gallery
      const az = (a + 0.5) * DAZ; if (!active(az)) continue;
      let best = 1e9, pr = 0, py = 0;
      for (let i = 0; i < ps.length; i += 3) {
        const d = Math.abs(wrapPi(Math.atan2(ps[i], ps[i + 2]) - az)), rr = Math.hypot(ps[i], ps[i + 2]);
        if (rr < 126 && rr > 95 && d < best) { best = d; pr = rr; py = ps[i + 1]; }
      }
      if (best > DAZ) continue;
      let ro = pr + 6.7;
      const nearRing = Math.round((RING0 - ro) / RING_STEP) * -RING_STEP + RING0;
      if (Math.abs(nearRing - ro) < 0.9) ro = nearRing + 0.9;
      let H = Math.min(py + 22, 120);
      for (const L of levels) if (L.y < H && L.e - 0.9 < ro && L.out + 0.9 > ro) { H = Math.min(H, L.y - 2.2); }
      if (H < py + 6) continue;
      addHoist(az, ro, H, Math.max(4, Math.round(H / 11)));
    }
    const bg = bucketGeometry(), n = hA.length / 4;
    const mk = (geo, mat) => {
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(n, 1)); mesh.count = n;
      setInst(geo, 'aH', new Float32Array(n ? hA : [0, 1, 1, 0]), 4); setInst(geo, 'aH2', new Float32Array(n ? hB : [0, 9, 1, 0]), 4);
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; return mesh;
    };
    root.add(mk(bg, shader(BUCKET_VERT, BUCKET_FRAG, {}, { side: THREE.DoubleSide })));
    const glow = mk(new THREE.PlaneGeometry(1, 1), shader(GLOW_VERT, GLOW_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.renderOrder = 3; root.add(glow);
    root.add(late.build(poleGeometry(), woodMat));
  }

  // ---- ropes: one instanced ribbon for the forty moorings and the hoist strands
  await ctx.yield?.();
  {
    const NS = 24, pos = [], idx = [];
    for (let i = 0; i <= NS; i++) pos.push(i / NS, -1, 0, i / NS, 1, 0);
    for (let i = 0; i < NS; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    setInst(g, 'aA', new Float32Array(ropeA), 3); setInst(g, 'aB', new Float32Array(ropeB), 3); setInst(g, 'aR', new Float32Array(ropeR), 4);
    setInst(g, 'aK', Float32Array.from({ length: ropeR.length / 2 }, (_, i) => 1 - (i & 1)), 2);      // cure c1: every rope's whip as the first version's (1, 0) until the law at the end of buildHero has spoken
    g.instanceCount = ropeR.length / 4;
    const m = new THREE.Mesh(g, shader(ROPE_VERT, ROPE_FRAG, {}, { side: THREE.DoubleSide }));
    m.frustumCulled = false; root.add(m);
  }

  // ---- chalk dust sifting through the decks along the gallery and off the belly
  await ctx.yield?.();
  {
    const drng = rng.fork ? rng.fork('dust') : rng;
    const n = Math.round(640 * detail), aD = new Float32Array(n * 4), aD2 = new Float32Array(n * 3);
    const gal = [];
    for (let i = 0; i < ps.length; i += 3) { const rr = Math.hypot(ps[i], ps[i + 2]); if (rr < 126 && ps[i + 1] > 40) gal.push(i); }
    for (let i = 0; i < n; i++) {
      if (i < n * 0.6 && gal.length) {
        const k = gal[drng.int(0, gal.length - 1)], rr = Math.hypot(ps[k], ps[k + 2]), ro = rr + drng.range(-5.2, 6);
        const az = Math.atan2(ps[k], ps[k + 2]) + drng.range(-0.02, 0.02);
        aD.set([Math.sin(az) * ro, ps[k + 1] + drng.range(4, 6.2), Math.cos(az) * ro, drng()], i * 4);
        aD2.set([drng.range(9, 13), drng.range(0.8, 1.7), drng.range(0.06, 0.2)], i * 3);
      } else {
        const az = drng.range(0, TAU), ro = drng.range(30, 112), top = CY - Math.sqrt(R * R - ro * ro) + drng.range(0, 14);
        aD.set([Math.sin(az) * ro, top, Math.cos(az) * ro, drng()], i * 4);
        aD2.set([top, drng.range(1.2, 2.4), drng.range(0.1, 0.32)], i * 3);
      }
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    setInst(g, 'aD', aD, 4); setInst(g, 'aD2', aD2, 3); g.instanceCount = n;
    const m = new THREE.Mesh(g, shader(DUST_VERT, DUST_FRAG, {}, { transparent: true, depthWrite: false }));
    m.frustumCulled = false; m.renderOrder = 2; root.add(m);
  }
  await ctx.yield?.();

  // ---- anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const seamAzCam = luneC - luneHalf + SEAM_LEAN;
  const anchors = {
    worldOffset: [0, -30, 0],
    flyThrough: WP.map((p) => V(p[0], p[1], p[2])),
    portalSeat: { position: V(0, 18, 165), normal: V(0, 0, -1) },
    moonCenter: V(0, CY, 0), keel: V(0, CY - R, 0),
    seamPoint: V(Math.sin(seamAzCam) * 108, 75, Math.cos(seamAzCam) * 108),
    reveal: V(290, 64, 24),
    bollards, hoists,
    topRail: topRail.map((t) => ({ position: t.position })),
    struckSector: { azimuth: STRUCK[0], halfWidth: STRUCK[1] }, gateGap: { azimuth: GAP[0], halfWidth: GAP[1] },
    viewpoints: {
      reveal: { position: V(290, 64, 24), target: V(0, CY + 10, 0) },
      gallery: { position: V(81, 75, -81), target: V(40, 70, -75) },
      belly: { position: V(-25, 18, 0), target: V(0, 20, 60) },
    },
  };

  // ---- animation
  let progSet = false, prog = 0;
  const sm5 = (t) => { t = sat(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  const hero = {
    object: root, radius: 150, height: 248, center: V(0, CY - 8, 0), anchors, moon, lift: 0, job,
    ground: true, groundY: 0, uniforms: U, glsl: { noise: GL_NOISE, light: GL_LIGHT, crater: GL_CRATER },
    setProgress(u) { progSet = true; prog = sat(u); },
    // a spare crescent's material: the Moon's two shaders in mode 1. Geometry: positions relative to the centre of a
    // sphere of radius rad, uv.x = 0..1 across the width (silver above about 0.56), uv.y = 1 on the mirrored underside.
    // matrix (Matrix4, kept by reference) maps the crescent's space to the hero's local space.
    crescentMaterial(rad, matrix, mode = 1) {       // mode 2: silvered all over
      return shader(MOON_VERT, MOON_FRAG, { ...moonU, uRad: { value: rad }, uMode: { value: mode }, uMoonMat: { value: matrix } });
    },
    setLight(o = {}) {
      if (o.sunDir) toV3(o.sunDir, U.uSunDir.value).normalize();
      if (o.sunColor) toV3(o.sunColor, U.uSunCol.value);
      if (o.skyColor) toV3(o.skyColor, U.uSkyCol.value);
      if (o.groundColor) toV3(o.groundColor, U.uGndCol.value);
      if (o.zenith) toV3(o.zenith, U.uZen.value);
      if (o.horizon) toV3(o.horizon, U.uHor.value);
      if (o.self) toV3(o.self, U.uSelf.value);
      if (o.mirrorSun) toV3(o.mirrorSun, U.uMirSun.value).normalize();   // where the mirror's sun star stands (default: low on the dock-head side, in view from the gallery)
    },
    update(dt, time) {
      if (!progSet) prog = (time % 40) / 40;
      U.uTime.value = time; U.uProg.value = prog;
      U.uOpen.value = sstep(0.62, 0.76, prog);
      const up = sm5((prog - 0.66) / 0.1), drift = driftAt(prog);
      const lift = 20 * up + LIFT2 * sm5((prog - 0.8) / 0.12) + 0.5 * Math.sin(time * 0.9) * up;
      hero.lift = lift;
      moon.position.y = CY + lift; moon.position.z = drift; hero.drift = drift;
      moon.rotation.y = turnAt(prog, secs);
      moon.updateMatrix();
      U.uMoonMat.value.copy(moon.matrix);
      U.uMoonC.value.set(0, CY + lift, drift);
      uLune.value.z = Math.min(time * 0.09, 5.5);
      root.updateWorldMatrix(true, false);
      U.uRootInv.value.copy(root.matrixWorld).invert();
    },
    dispose() { tabTex.dispose(); },
  };
  // ---- cure c1, A FAULT IN LIVE: A SLIPPED MOORING KEEPS 2.0 M OF CLEAR AIR FROM THE LENS. A slipped rope topples inward from its bollard through
  // the gallery we fly along, and its whip (the two sines of ropeAt, whose phase is the clock's) swings it up to 4.5 m either side of the plane
  // it falls in. Whether the lens is in the way is settled here, once, by place: for every mooring and every share u of the flight after its
  // slip, the route's own point at u (path.pointAt) against the rope's own line at u (ropeAt's arithmetic without its two sines, mirrored in
  // head() and line() below: P818, P822, P825 to P834, P836, P843; the Moon's place at u asked of update() itself, at the top and the bottom of its bob).
  // Where that line comes nearer the lens than CLR within its own plane, the stretch of the swing (in reaches: -1 to 1 is the whole swing of
  // the first version) that would stand within CLR of the lens is forbidden. The rope then swings in the widest stretch of -1..1 left free:
  // aK = (half its width, its middle). A rope with nothing forbidden in -1..1 keeps (1, 0) and is drawn as before. If nothing of -1..1 is
  // free (the lens passes through the rope's plane while the rope passes the lens), the rope leans just past the forbidden stretch, without
  // its ripple: (0, the nearest free edge); that alone reaches further than the first version's whip did. The check is made on stretches of
  // the flight that are halved until the lens moves LEAF in one; in each, what the lens, the rope's line and (m1) the rope's plane travel
  // between the stretch's two ends is taken off the distance. That is taken off: the lens's straight step; each piece's ends, as 1.571 times
  // their straight step (an arc of up to half a turn); the kept end's and the side vector's steps the same way. NOT taken off, and what PAD
  // (m2: 0.2 m of the clearance, 0.1 before) is kept for: the bob's heights between its top and its bottom, the whip's fading and the haul within
  // one leaf stretch, a fall that turns back within one stretch, the route's bend within one, the 1e-4 terms of P830 and P831. Those are NOT
  // PROVED here: a reader's estimate of them all at once is 0.16 m (report2.txt, item E). A stretch passed as clear is clear only so far as PAD covers them.
  // The first test of a stretch (the lens beyond the rope's whole length) allows 3 m for what the kept end and the length change in one stretch:
  // the most in this world's 43 s journey is 2.1 m; a slower journey of the part alone would need more.
  // WHAT THE LEAN PROVES, AND THE LAST RESORT (m1, m4): the second scan holds for any swing that stays within three reaches, so a lean is taken
  // only if the nearest free edge is within three reaches. If there is none (the lens passes within the clearance of the rope near the end
  // it keeps, where it does not swing: no leaning frees it), the rope gets aK.x = -1 and P823 folds it to one point at every frame of the
  // flight, from the first: it is not drawn at all, and nothing about it changes in one frame (m4; in m1 it was drawn until its slip and gone
  // in the next frame). Keeping its mooring instead was tried in m3 and dropped: a kept rope was tested against the lens alone, and can stand
  // taut through the Moon. No dice; the lens, the clock and the seed are not read; a rope's bolt, bollard and moment of slip are as they were.
  await ctx.yield?.();
  {
    let rg = null; root.traverse((o) => { if (o.geometry && o.geometry.attributes.aK) rg = o.geometry; });
    const K = rg.attributes.aK.array, sp = rg.attributes.position, ss = [], PAD = 0.2, LEAF = 0.05, n = Math.ceil(path.length / 1.5), cv = new THREE.Vector3(), grid = [];
    for (let i = 0; i < sp.count; i++) if (!ss.includes(sp.getX(i))) ss.push(sp.getX(i));
    ss.sort((a, b) => a - b);
    const NS = ss.length, P0 = new Float64Array(NS * 3), P1 = new Float64Array(NS * 3), A0 = new Float64Array(NS), A1 = new Float64Array(NS);
    // the lens's place and the Moon's matrix (highest and lowest of its bob: the clocks at which update()'s sin(time * 0.9) is 1 and -1) at the share u
    const at = (u) => { hero.setProgress(u); hero.update(0, Math.PI / 1.8); const hi = moon.matrix.elements.slice(); hero.update(0, Math.PI / 0.6); const lo = moon.matrix.elements.slice(); path.pointAt(u, cv); return { u, c: [cv.x, cv.y, cv.z], mm: hi[13] - lo[13] > 1e-9 ? [hi, lo] : [hi] }; };
    const gat = (i) => grid[i] || (grid[i] = at(i / n));
    // rope r at the share u under the Moon mm: [the side its whip swings to (3), the end it keeps (3), its length, the free end's reach, d0 (3), how far the fall has gone, does it keep the bollard's end];
    // nothing, if the lens c is further from the kept end than the rope's length and `far`
    const head = (r, u, mm, c, far) => {
      const x = ropeA[r * 3], y = ropeA[r * 3 + 1], z = ropeA[r * 3 + 2], ax = mm[0] * x + mm[4] * y + mm[8] * z + mm[12], ay = mm[1] * x + mm[5] * y + mm[9] * z + mm[13], az = mm[2] * x + mm[6] * y + mm[10] * z + mm[14];      // P843
      const bx = ropeB[r * 3], by = ropeB[r * 3 + 1], bz = ropeB[r * 3 + 2], fromB = ropeR[r * 4 + 2] < 0.32, ox = fromB ? bx : ax, oy = fromB ? by : ay, oz = fromB ? bz : az;                                               // P827, P834
      let L = Math.max(Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az)), 1e-3);                                                                                                               // P818
      if (c && (c[0] - ox) * (c[0] - ox) + (c[1] - oy) * (c[1] - oy) + (c[2] - oz) * (c[2] - oz) > (L + far) * (L + far)) return null;
      const d0x = (bx - ax) / L, d0y = (by - ay) / L, d0z = (bz - az) / L, t = (u - ropeR[r * 4]) * secs, e = 1 - Math.exp(-t * 0.7) * Math.cos(t * 1.4);                                                                     // P822, P825, P826
      let a0 = 4.5 * Math.exp(-t * 0.28); if (!fromB) { const haul = 1 - sstep(0.795, 0.85, u); L *= haul; a0 *= haul; }                                                                                                      // P832, P833
      const sn = Math.hypot(-d0z + 1e-4, 1e-4, d0x + 1e-4);                                                                                                                                                                  // P831
      return [(-d0z + 1e-4) / sn, 1e-4 / sn, (d0x + 1e-4) / sn, ox, oy, oz, L, a0, d0x, d0y, d0z, e, fromB];
    };
    const line = (H, P, Am) => {                                           // the stations of the ribbon along that rope, and each one's reach
      const sg = H[12] ? -1 : 1;
      for (let i = 0; i < NS; i++) {
        const q = H[12] ? 1 - ss[i] : ss[i], m = Math.min(Math.max(H[11] * (0.55 + 0.4 * q), 0), 1.12), vx = sg * H[8] * (1 - m) + 1e-4, vy = sg * H[9] * (1 - m) - m, vz = sg * H[10] * (1 - m), k = H[6] * q / Math.hypot(vx, vy, vz);      // P828 to P830, P834
        P[i * 3] = H[3] + k * vx; P[i * 3 + 1] = Math.max(H[4] + k * vy, 0.25); P[i * 3 + 2] = H[5] + k * vz; Am[i] = H[7] * q;                                                                                               // P832, P834, P836
      }
    };
    for (let r = 0; r * 4 < ropeR.length; r++) {
      if (Math.abs(ropeR[r * 4 + 3]) > 0.5) continue;                      // a hoist's strand
      const rel = ropeR[r * 4], CLR = 2 + ropeR[r * 4 + 2] / 2 + PAD, forb = [];
      // one stretch of the flight, s0 to s1, for a swing that stays within REACH reaches: clear throughout, or halved, or (short enough) what it forbids is written down
      const check = (s0, s1, REACH) => {
        const cx = s0.c[0], cy = s0.c[1], cz = s0.c[2], dc = Math.hypot(s1.c[0] - cx, s1.c[1] - cy, s1.c[2] - cz), cons = [];
        for (let v = 0; v < s0.mm.length; v++) {
          const H = head(r, s0.u, s0.mm[v], s0.c, 4.85 * REACH + CLR + dc + 3);
          if (!H) continue;                                                                                                                    // the lens is beyond the rope's whole length
          // m1: the rope's plane (through the end it keeps, square to its side vector) is carried and turned by the Moon's bolt: the kept end's and the side vector's travel in the stretch,
          // and the most they can change how far to the side of that plane the lens stands. All three are 0 until the Moon begins to move.
          const H1 = head(r, s1.u, s1.mm[Math.min(v, s1.mm.length - 1)]), ov = 1.571 * Math.hypot(H1[3] - H[3], H1[4] - H[4], H1[5] - H[5]), sv = 1.571 * Math.hypot(H1[0] - H[0], H1[1] - H[1], H1[2] - H[2]);
          const pt = ov + sv * (Math.hypot(cx - H[3], cy - H[4], cz - H[5]) + dc + ov);
          const lam0 = (cx - H[3]) * H[0] + (cy - H[4]) * H[1] + (cz - H[5]) * H[2], lam1 = lam0 + (s1.c[0] - cx) * H[0] + (s1.c[1] - cy) * H[1] + (s1.c[2] - cz) * H[2];
          if (lam0 * lam1 > 0 && Math.min(Math.abs(lam0), Math.abs(lam1)) - pt - H[7] * REACH >= CLR) continue;                               // the lens keeps to one side of the rope's plane, beyond the free end's reach
          line(H, P0, A0); line(H1, P1, A1);
          for (let j = 0; j + 1 < NS; j++) {
            const o = j * 3, a = Math.max(A0[j], A0[j + 1]);
            if (lam0 * lam1 > 0 && Math.min(Math.abs(lam0), Math.abs(lam1)) - pt - a * REACH >= CLR) continue;
            const ex = P0[o + 3] - P0[o], ey = P0[o + 4] - P0[o + 1], ez = P0[o + 5] - P0[o + 2], l2 = ex * ex + ey * ey + ez * ez, h = l2 > 0 ? Math.min(1, Math.max(0, ((cx - P0[o]) * ex + (cy - P0[o + 1]) * ey + (cz - P0[o + 2]) * ez) / l2)) : 0;
            const d3 = Math.hypot(cx - P0[o] - ex * h, cy - P0[o + 1] - ey * h, cz - P0[o + 2] - ez * h);                                    // lens to this piece of the line, at s0
            const tr = dc + 1.571 * Math.max(Math.hypot(P1[o] - P0[o], P1[o + 1] - P0[o + 1], P1[o + 2] - P0[o + 2]), Math.hypot(P1[o + 3] - P0[o + 3], P1[o + 4] - P0[o + 4], P1[o + 5] - P0[o + 5]));      // what the lens and the piece's ends (on their arcs) can travel in the stretch
            if (d3 - tr - 1.077 * a * REACH >= CLR) continue;
            const rho = Math.max(0, Math.sqrt(Math.max(d3 * d3 - lam0 * lam0, 0)) - tr - 0.4 * a - 2 * sv * (d3 + 2 * tr));                  // the least the lens can be from the line within the rope's plane (m1: less what the plane's turning can take from it)
            if (rho >= CLR) continue;
            const g = Math.sqrt(CLR * CLR - rho * rho), lo = Math.min(lam0, lam1) - pt - g, hi = Math.max(lam0, lam1) + pt + g;
            // m1: ONE forbidden stretch a piece, the hull over the reaches of its two stations (the reach runs evenly from one to the other, so nothing between the two is left free)
            cons.push(Math.min(A0[j] > 1e-6 ? lo / A0[j] : -1e9, A0[j + 1] > 1e-6 ? lo / A0[j + 1] : -1e9), Math.max(A0[j] > 1e-6 ? hi / A0[j] : 1e9, A0[j + 1] > 1e-6 ? hi / A0[j + 1] : 1e9));
          }
        }
        if (!cons.length) return;
        if (dc <= LEAF) { for (let i = 0; i < cons.length; i += 2) forb.push([cons[i], cons[i + 1]]); return; }
        const sm = at((s0.u + s1.u) / 2); check(s0, sm, REACH); check(sm, s1, REACH);
      };
      const scan = (REACH) => { forb.length = 0; for (let i = Math.floor(rel * n); i < n; i++) check(i / n > rel ? gat(i) : at(rel + 1e-9), gat(i + 1), REACH); forb.sort((p, q) => p[0] - q[0]); };
      scan(1);
      let f0 = -1, f1 = -1, x = -1;                                        // the widest free stretch of -1..1
      for (const f of forb) { if (Math.min(f[0], 1) - x > f1 - f0) { f0 = x; f1 = Math.min(f[0], 1); } x = Math.max(x, f[1]); }
      if (1 - x > f1 - f0) { f0 = x; f1 = 1; }
      if (f1 > f0) { if (f0 > -1 || f1 < 1) { K[r * 2] = (f1 - f0) / 2; K[r * 2 + 1] = (f0 + f1) / 2; } }
      else {                                                               // nothing of -1..1 is free: the scan again, now holding for any swing within three reaches, and its free edge nearest to no lean at all
        scan(3); let c = 1e9; x = -1e9;
        for (const f of forb) { if (f[0] > x) { if (Math.abs(x) < Math.abs(c)) c = x; if (Math.abs(f[0]) < Math.abs(c)) c = f[0]; } x = Math.max(x, f[1]); }
        if (Math.abs(x) < Math.abs(c)) c = x;
        if (Math.abs(c) <= 3) { K[r * 2] = 0; K[r * 2 + 1] = c; }           // m1: the lean, only where that scan proves it
        else K[r * 2] = -1;                                                 // m4, the last resort: no free place within three reaches, so the rope is not drawn at all, from the build on (P823)
      }
      await ctx.yield?.();
    }
    progSet = false; prog = 0;                                             // the part as it was: no share set, and the update below puts every uniform back
  }
  hero.update(0, 0);
  { const dispose0 = hero.dispose; hero.dispose = () => { dispose0(); pitTex.dispose(); }; }      // p1: the pit sheet goes with the crater table
  return hero;
}
