// PAPER BOAT RAPIDS: at insect scale, riding behind a folded cream paper boat down a rain-swollen
// gutter (1 unit = 1 cm). The whole street is laid out in course coordinates: s = distance down the
// gutter (0..900, the storm-drain lip is s = 900 at world z = 0), d = lateral offset (+ = road side).
// Camera path, both boats, every floating prop and the water ribbon sample the same course spline
// and the same water-height function. The storm drain (hero) lives in ../parts/paper-boat-rapids.js.
//
// Variations by seed / ctx.vary: hour (rainy dusk, deep night, grey wet dawn), rain (downpour,
// drizzle, clearing shower), season (autumn leaves, spring petals, winter sleet + ice rims), the
// rival (red paper boat, newsprint boat, walnut shell, tin duck), the vehicle (tram or horse-cart
// wheels) and the rare event (a child's wellington stamps into the still pool and its wave bursts
// the leaf dam early).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, GLSL_COMMON, chamferBox, domeGeo, leafGeo, trs } from '../parts/paper-boat-rapids.js';

const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
const PALETTES = {
  dusk: ['#1A2130', '#2A3152', '#56607A', '#9AA6BC', '#F2A53A', '#F5F1E6', '#E5432F'],
  night: ['#0F1422', '#1B2140', '#3C4560', '#8490AA', '#F2A53A', '#F5F1E6', '#E5432F'],
  dawn: ['#252C3C', '#48536E', '#76829A', '#B4BECE', '#F4BC72', '#F5F1E6', '#E5432F'],
};

// ---------------------------------------------------------------- course ----
const TH = 25 * PI / 180, SA = 300, SB = 390, RARC = (SB - SA) / TH, CX = -RARC, CZ = 900 - SB;
const CT = Math.cos(TH), ST = Math.sin(TH), PAX = CX + RARC * CT, PAZ = CZ + RARC * ST;
const S_END = 754;            // where the hero's own street begins (its z = 146)
function course(s, o) {       // centre of the gutter and heading at distance s
  if (s >= SB) { o.x = 0; o.z = 900 - s; o.hx = 0; o.hz = -1; }
  else if (s >= SA) { const a = (SB - s) / RARC, c = Math.cos(a), n = Math.sin(a); o.x = CX + RARC * c; o.z = CZ + RARC * n; o.hx = n; o.hz = -c; }
  else { o.hx = ST; o.hz = -CT; o.x = PAX - (SA - s) * ST; o.z = PAZ + (SA - s) * CT; }
  return o;
}
const _c = { x: 0, z: 0, hx: 0, hz: -1 }, _sd = { s: 0, d: 0 };
function toWorld(s, d, y, out) { course(s, _c); return out.set(_c.x - _c.hz * d, y, _c.z + _c.hx * d); }
function toSD(x, z, o = _sd) {
  if (z <= CZ) { o.s = 900 - z; o.d = x; return o; }
  const vx = x - CX, vz = z - CZ, ang = Math.atan2(vz, vx);
  if (ang >= 0 && ang <= TH) { o.s = SB - ang * RARC; o.d = Math.hypot(vx, vz) - RARC; return o; }
  const rx = x - PAX, rz = z - PAZ; o.s = SA + rx * ST - rz * CT; o.d = rx * CT + rz * ST; return o;
}
const gBase = (s) => 20 * clamp(1 - s / 754, 0, 1.1);
const Gd = (s) => gBase(s) + 6 * (1 - smoothstep(588, 618, s));          // street datum
const LIP_S = 597, FOOT_S = 615;      // the tongue of the rapid: its curled lip and its foot
const Wd = (s) => gBase(s) + 6 * (1 - smoothstep(LIP_S, FOOT_S, s));          // water level: the 6 units of the rapid fall down one glassy tongue beside the tilted cobble (a curled lip at s 597, its foot at s 615)
const wl = (s) => 15 + 30 * smoothstep(415, 435, s) * (1 - smoothstep(555, 575, s));
const wr = (s) => 15 + 15 * (1 - smoothstep(45, 75, s)) + 50 * smoothstep(632, 652, s) * (1 - smoothstep(692, 710, s));
const kerbAt = (s) => s < 410 || s > 580;
const stand = (s) => { const f = Math.sin((s - 615.5) * 0.349); return (f > 0 ? 2.2 : 1.2) * f * smoothstep(608, 617, s) * (1 - smoothstep(634, 648, s)); };      // the hollow at the tongue's foot and two standing waves below it (crests at s 620 and 638)
function groundH(s, d) {
  const g = Gd(s);
  if (d >= 0) { const w = wr(s); return g - 3 + 5.4 * smoothstep(w - 3, w + 5, d); }
  if (kerbAt(s)) return d < -16.5 ? g + 11.6 : g - 3;
  const w = wl(s); return g - 3 + 5.4 * smoothstep(w - 3, w + 5, -d);
}
const pudF = (x, z) => Math.sin(x * 0.023 + 1.3) * Math.sin(z * 0.019 + 0.4) + 0.55 * Math.sin(x * 0.047 - z * 0.037 + 2.1) + 0.3 * Math.sin(x * 0.011 + z * 0.09);      // puddle hollows (same in GROUND_FRAG)
const F = (v) => Number(v).toFixed(4);
const GLSL_COURSE = /* glsl */`
vec4 crs(float s){
  if (s >= ${F(SB)}) return vec4(0.0, 900.0 - s, 0.0, -1.0);
  if (s >= ${F(SA)}) { float a = (${F(SB)} - s) / ${F(RARC)}; float c = cos(a), n = sin(a); return vec4(${F(CX)} + ${F(RARC)} * c, ${F(CZ)} + ${F(RARC)} * n, n, -c); }
  return vec4(${F(PAX)} - (${F(SA)} - s) * ${F(ST)}, ${F(PAZ)} + (${F(SA)} - s) * ${F(CT)}, ${F(ST)}, ${F(-CT)});
}
float gBase(float s){ return 20.0 * clamp(1.0 - s / 754.0, 0.0, 1.1); }
float gW(float s){ return gBase(s) + 6.0 * (1.0 - smoothstep(597.0, 615.0, s)); }
float gG(float s){ return gBase(s) + 6.0 * (1.0 - smoothstep(588.0, 618.0, s)); }
float gWr(float s){ return 15.0 + 15.0 * (1.0 - smoothstep(45.0, 75.0, s)) + 50.0 * smoothstep(632.0, 652.0, s) * (1.0 - smoothstep(692.0, 710.0, s)); }
float gStand(float s){ float f = sin((s - 615.5) * 0.349); return mix(1.2, 2.2, step(0.0, f)) * f * smoothstep(608.0, 617.0, s) * (1.0 - smoothstep(634.0, 648.0, s)); }
`;

// ---------------------------------------------------------------- shaders ----
// Light model shared by everything the world builds: cold sky fill, the hero's lamp (uLampPos /
// uLampCol, shared uniform objects), the bicycle lamp and the tram's window light, wet speculars.
const GLSL_LIGHT = GLSL_COMMON + /* glsl */`
uniform vec3 uLP[2]; uniform vec3 uLC[2]; uniform float uLR[2]; uniform vec3 uSkyC; uniform vec3 uGndC; uniform float uRib; uniform vec3 uWash;
float qAtt(float d, float r){ float k = d / r; return 1.0 / (1.0 + k * k * k * k); }
vec3 qLamp(vec3 alb, vec3 N, vec3 V, vec3 P, vec3 Lp, vec3 Lc, float range, float sp, float sk){
  vec3 L = Lp - P; float d = length(L); L /= d;
  float nl = max(dot(N, L), 0.0);
  return Lc * qAtt(d, range) * (alb * nl + pow(max(dot(N, normalize(L + V)), 0.0), sp) * sk * step(0.0, nl));
}
// the stretched reflection of a lamp on a wet, roughly level surface (same term as the hero's water)
float qRibbon(vec3 R, vec3 P, vec3 Lp, float tight){
  vec3 Lv = Lp - P; float ld = length(Lv); vec3 L = Lv / ld;
  vec3 az = normalize(vec3(L.x, 0.0, L.z)), lat = vec3(az.z, 0.0, -az.x);
  float dl = dot(R, lat) - dot(L, lat), dv = R.y - L.y;
  return (exp(-dl * dl * tight) * exp(-dv * dv * 1.3) * step(0.0, dot(R, az)) + 3.0 * pow(max(dot(R, L), 0.0), 220.0)) / (1.0 + ld * ld / 360000.0);
}
vec3 qShade(vec3 alb, vec3 N, vec3 P, float rough){
  vec3 V = normalize(cameraPosition - P);
  float sp = mix(260.0, 10.0, sqrt(rough)), sk = (1.0 - rough) * (1.0 - rough) * 3.2;
  vec3 c = alb * mix(uGndC, uSkyC, 0.5 + 0.5 * N.y);
  c += qLamp(alb, N, V, P, uLampPos, uLampCol, 430.0, sp, sk);
  c += qLamp(alb, N, V, P, uLP[0], uLC[0], uLR[0], sp, sk);
  c += qLamp(alb, N, V, P, uLP[1], uLC[1], uLR[1], sp, sk);
  c += qLamp(alb, N, V, P, uShopP, uShopC, 300.0, sp * 0.35, sk * 0.3) * pbSS(-233.0, -222.0, P.x);       // the corner shop's window
  vec3 R = reflect(-V, N);
  float fr = 1.0 - max(dot(N, V), 0.0);
  c += uSkyC * 1.6 * fr * fr * fr * fr * fr * (1.0 - rough) * smoothstep(-0.1, 0.5, R.y);
  // the street's windows: a low amber wash on upright faces and an amber rim on every wet edge
  c += uWash * (alb * (0.4 + 0.9 * (1.0 - abs(N.y))) + 1.5 * fr * fr * fr * (1.0 - 0.6 * rough));
  return c;
}`;
const FOGV = '#include <common>\n#include <fog_pars_vertex>\n', FOGF = '#include <common>\n#include <fog_pars_fragment>\n';

const LIT_VERT = FOGV + /* glsl */`
attribute float aRough; varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vR; varying vec3 vO; varying vec2 vLf;
void main(){
  vec3 p = position, n = normal; vO = position; vLf = position.xz;
  #ifdef USE_INSTANCING
    mat3 im = mat3(instanceMatrix);
    n = im * (n / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])));
    p = (instanceMatrix * vec4(p, 1.0)).xyz; vO = p;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vC = color; vR = aRough;
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LIT_FRAG = FOGF + GLSL_LIGHT + GLSL_COURSE + /* glsl */`
uniform float uThin; uniform float uFloor; uniform float uPrint; uniform float uPlain;
// the place along the course (s) of a point of the street (the inverse of crs)
float qS(vec2 p){
  if (p.y <= ${F(CZ)}) return 900.0 - p.y;
  vec2 q = p - vec2(${F(CX)}, ${F(CZ)}); float a = atan(q.y, q.x);
  if (a >= 0.0 && a <= ${F(TH)}) return ${F(SB)} - a * ${F(RARC)};
  return ${F(SA)} + (p.x - ${F(PAX)}) * ${F(ST)} - (p.y - ${F(PAZ)}) * ${F(CT)};
}
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vR; varying vec3 vO; varying vec2 vLf;
void main(){
  if (vR < 0.0) { gl_FragColor = vec4(vC * (-vR), 1.0); }
  else {
    vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
    float m = mix(pbFbm(vO.xz * 0.9 + vO.y * 0.7), 0.56, uPlain), g = mix(pbNoise(vO.xz * 6.0 + vO.yy * 5.0), 0.5, uPlain);
    vec3 alb = vC * (0.72 + 0.5 * m) * (0.9 + 0.2 * g);
    // (polish 3) kerb stones (aRough 2..3): wet speckled granite, dark mica and pale quartz flecks, drip
    // streaks down the face, a rain-glazed top
    float kind = floor(vR * 0.5 + 0.25), stone = step(0.5, kind) * step(kind, 1.5), rr = vR - 2.0 * kind;
    vec3 thrown = vec3(0.0);
    if (kind > 4.5) {
      // (repair 2) a plane leaf (aRough 10.x; 12.x the raft, twelve times the size): five pale midribs from the
      // stalk to the lobes' tips with fine side veins off them, the blade blotched and browner toward its
      // edge, and wet: glossy where the rain lies on it (its paler rim, where the water meets it, is in its
      // vertex colours)
      vec2 lf = vLf / mix(1.0, 12.0, step(5.5, kind));
      float lr = length(lf), la = atan(-lf.y, lf.x), da = abs(mod(la, 1.2566) - 0.6283);
      float across = lr * sin(da), along = lr * cos(da);
      float rib = smoothstep(0.016 * (1.0 - lr * 1.6) + 0.005, 0.002, across);
      float sv = smoothstep(0.012, 0.004, abs(fract(along * 10.0 - across * 7.0) - 0.5) * 0.082) * smoothstep(0.012, 0.04, across) * smoothstep(0.5, 0.2, lr);
      float blot = pbFbm(lf * 8.0 + vC.r * 30.0), speck = pbNoise(lf * 37.0 + 5.0);
      alb = vC * (0.66 + 0.62 * blot) * (1.0 - 0.28 * smoothstep(0.2, 0.5, lr)) * (1.0 - 0.3 * smoothstep(0.7, 0.86, speck));
      alb = mix(alb, alb * 1.55 + 0.03, max(rib, 0.55 * sv));
      rr = mix(0.36, 0.7, smoothstep(0.3, 0.7, blot));
      N = normalize(N + 0.3 * vec3(pbNoise(lf * 21.0) - 0.5, 0.0, pbNoise(lf * 21.0 + 9.0) - 0.5) + 0.25 * (rib - sv) * vec3(0.0, 1.0, 0.0));      // the wet blade is never one mirror: its gloss breaks into small glints
      kind = 0.0;
    }
    if (kind > 1.5 && kind < 3.5) {
      // (repair 2) folded paper (aRough 4.x the hull's sheets, 6.x sail and floor): no stone in it, only a soft
      // grain of fibres; the soaked band with its creeping, uneven edge and a tide line; and on the hull the
      // folds, each a fine shadow with a lit shoulder beside it that catches the lamps
      float fib = pbNoise(vO.xy * vec2(6.0, 23.0) + vO.z * 3.1) - 0.5, cl = pbNoise(vO.xy * 1.6 + vO.z * 1.2) - 0.5;
      alb = vC * (1.0 + 0.13 * fib + 0.12 * cl);
      float wick = 1.3 + 0.55 * (pbNoise(vec2(vO.x * 1.2 + vO.z * 0.8, 3.0)) - 0.5) + 0.2 * (pbNoise(vO.xz * 5.0) - 0.5);
      float soak = 1.0 - smoothstep(wick - 0.08, wick + 0.2, vO.y);
      alb *= mix(1.0, 0.55, soak) * (1.0 - 0.2 * exp(-pbSq((vO.y - wick - 0.16) / 0.08)));
      rr = mix(rr, 0.3, soak);
      if (kind < 2.5) {
        float ax = abs(vO.x), brim = 2.45 + 0.027 * vO.x * vO.x - vO.y, ends = smoothstep(4.6, 5.6, ax);
        float d0 = vO.x, d1 = ax - 3.5 + 0.1 * (vO.y + 0.6), d2 = brim - 0.62, d3 = vO.z;
        float fold = exp(-pbSq(d0 / 0.075)) + exp(-pbSq(d1 / 0.075)) + 0.8 * exp(-pbSq(d2 / 0.06)) * (1.0 - ends) + exp(-pbSq(d3 / 0.07)) * step(3.4, ax);
        float lit = exp(-pbSq((d0 - 0.17) / 0.1)) + exp(-pbSq((d1 - 0.17) / 0.1)) + 0.8 * exp(-pbSq((d2 + 0.14) / 0.08)) * (1.0 - ends);
        alb *= (1.0 - 0.42 * min(fold, 1.0)) * (1.0 + 0.3 * min(lit, 1.0) * (1.0 - soak));
        alb *= 1.0 + 0.1 * smoothstep(0.62, 0.5, brim) * (1.0 - ends) + 0.35 * smoothstep(0.09, 0.02, brim);      // the turned brim is double paper; its cut edge is pale
      }
    }
    if (stone > 0.5) {
      float f1 = pbNoise(vP.xz * 7.0 + vP.y * 5.3), f2 = pbNoise(vP.zx * 13.0 - vP.y * 9.1 + 31.0), mt = pbFbm(vP.xz * 0.22 + vP.y * 0.31);
      float face = 1.0 - smoothstep(0.3, 0.7, abs(N.y)), al = vP.z + vP.x * 0.35;
      float drip = pbSS(0.56, 0.8, pbNoise(vec2(al * 0.5, 2.7))) * pbSS(0.2, 0.6, pbNoise(vec2(al * 0.5 + 40.0, vP.y * 0.1))) * face;
      alb *= (0.7 + 0.62 * mt) * (1.0 - 0.55 * pbSS(0.64, 0.8, f1)) * (1.0 + 1.1 * pbSS(0.68, 0.86, f2));
      alb = mix(alb, alb * vec3(0.42, 0.45, 0.55), drip * 0.85);
      rr *= mix(1.0, mix(0.7, 0.25, step(2.38, vR)), max(drip, (1.0 - face) * (0.5 + 0.5 * mt)));      // (repair 2: the rapid's cobbles, 2.3, are wet but not glazed: no white glare beside the tongue)
      // (repair 2) a kerb face is never one dark tone: the lit water throws its light up the stone in a slow
      // rippling net (strongest at the waterline, gone by the arris), the tooled face shows its strokes and a
      // darker soaked foot, each drip has a wet glint down its middle, and the rounded arris along the top
      // edge carries a wet amber line (all of it the street's own amber: the lamps and the windows' wash)
      float sK = qS(vP.xz), hw = vP.y - gW(sK), tool = pbFbm(vec2(sK * 1.3, vP.y * 0.7 + 9.0));
      vec3 glow = uLampCol * qAtt(distance(uLampPos, vP), 300.0) * 0.8 + uLC[0] * qAtt(distance(uLP[0], vP), uLR[0] * 1.3) + uLC[1] * qAtt(distance(uLP[1], vP), uLR[1]) + uWash * 1.2;
      float n1 = pbNoise(vec2(sK * 0.42 + uTime * 0.45, vP.y * 0.5 - uTime * 0.3)), n2 = pbNoise(vec2(sK * 0.3 - uTime * 0.35 + 17.0, vP.y * 0.36 + uTime * 0.2));
      // (repair 3) the kerb along the run, varied as a street's kerb is: the water's net of light is soft and
      // stays by the water (it climbs a third of the face and fades; it was a hard scribble over the whole
      // wall); the soaked foot stands higher here and lower there; the top arris is chipped in places (a
      // shallow bite out of the edge and a little way down the face, dull and dry-looking) and the wet
      // shine of the lamps runs along it between the chips, brighter where the rain lies deeper on the top
      float net = (pbSS(0.17, 0.0, abs(n1 - n2)) + 0.4 * pbSS(0.12, 0.0, abs(n1 + n2 - 1.0))) * pbSS(5.5, 0.5, hw + 1.5 * (mt - 0.5));
      float reach = face * (0.3 + 0.7 * pbSS(10.0, 0.4, hw)) * pbSS(-0.6, 0.6, hw);
      float kst = step(2.38, vR), ht = gG(sK) + 12.0 - vP.y, arris = kst * pbSS(0.3, 0.55, N.y) * pbSS(0.97, 0.8, N.y);
      float chipN = pbSS(0.56, 0.7, pbNoise(vec2(sK * 0.8, 4.0))) * pbSS(0.42, 0.62, pbNoise(vec2(sK * 0.19 + 8.0, 1.0)));
      float chipD = 1.25 + 1.7 * chipN, chipK = kst * pbSS(0.0, 0.25, chipN) * step(-0.6, ht), bite = chipK * pbSS(chipD, chipD - 0.45, ht);
      float wetTop = 0.3 + 0.6 * pbSS(0.3, 0.75, pbNoise(vec2(sK * 0.13, 7.0)));
      alb *= (0.88 + 0.24 * tool) * mix(1.0, 0.62, face * pbSS(2.6, 0.2, hw - 2.6 * pbNoise(vec2(sK * 0.06, 12.0)) + 1.2 * (mt - 0.5))) * mix(1.0, 0.5 + 0.35 * f1, bite);
      rr = mix(rr, 0.85, bite);
      thrown = glow * (alb * reach * (0.26 + 0.55 * net * reach) + face * drip * 0.22 * pbSS(0.7, 0.86, pbNoise(vec2(al * 0.5, 2.7)))
        + wetTop * arris * (1.0 - bite) * (0.5 + 0.8 * f2));      // (the arris: kerb stones only, 2.4 and up; the cobbles of the rapid are 2.3)
      // (round 2) beside the rapid the white water lights the stone: the foam's pale light is thrown up the kerb's
      // face (and the tilted cobble's flank) from the lip to the end of the standing waves, so the wall behind the
      // boats there is wet lit granite with its joints and drips, not a dark block
      float fw = pbSS(578.0, 594.0, sK) * (1.0 - pbSS(644.0, 664.0, sK));      // (from the first stone of the resumed kerb, s 580: it stands beside the lip)
      // (repair 3) less of it, and laid on evenly: the wall beside the rapid stands back in tone, a quiet wet stone
      // behind the boats (it was as pale as the paper and scribbled with light, and the hulls were lost against it)
      thrown += alb * (uSkyC * 2.4 + glow) * fw * face * 0.36 * pbSS(24.0, 3.0, hw);
    }
    // newsprint: columns of grey type, a heavier headline band
    float ink = step(0.38, fract(vO.y * 2.6)) * step(0.14, fract(vO.x * 0.62 + 0.07)) * step(0.3, pbNoise(vec2(vO.x * 3.1, floor(vO.y * 2.6) * 7.3)));
    alb *= 1.0 - uPrint * (0.55 * ink + 0.3 * step(0.86, fract(vO.x * 0.31 + vO.y * 0.11)));
    // (repair 2) what looks down at the wet street is lit by it: the amber lying on the water and the wet stones
    // comes back up under the tram's frame, its wheels' rims, a hull's turn
    thrown += (alb + 0.04 * (1.0 - rr)) * max(-N.y, 0.0) * (uWash * 3.0 + uLC[1] * qAtt(distance(uLP[1], vP), uLR[1]) * 0.4
      + uLampCol * qAtt(distance(uLampPos, vP), 430.0) * 0.25 + uLC[0] * qAtt(distance(uLP[0], vP), uLR[0]) * 0.25);
    vec3 c = qShade(alb, N, vP, clamp(rr * (0.6 + 0.9 * m), 0.08, 1.0)) + alb * uFloor + thrown;
    if (kind > 3.5) {
      // (repair 2) a raindrop (aRough 8.x) is a lens of clear water, the styleNote's 'spheres big enough to see':
      // pale and bright, the light it gathers lying as a crescent in its lower half, a thin darker edge above
      // that keeps it round, the sky on its rim and the lamps' hot points on its skin (never a dark olive)
      vec3 Vd = normalize(cameraPosition - vP); float rim = 1.0 - max(dot(N, Vd), 0.0);
      vec3 lampAll = uLampCol * qAtt(distance(uLampPos, vP), 430.0) + uLC[0] * qAtt(distance(uLP[0], vP), uLR[0]) + uLC[1] * qAtt(distance(uLP[1], vP), uLR[1]) + uWash * 3.0;
      float cres = smoothstep(0.1, -0.85, N.y), cap = smoothstep(0.2, 0.9, N.y);
      c = vC * (0.8 + 1.5 * cres) + lampAll * (0.16 + 0.5 * cres + 0.12 * cap) + uSkyC * 2.2 * rim * rim * rim;
      c *= 1.0 - 0.4 * smoothstep(0.72, 0.9, rim) * (1.0 - cres);
      c += qShade(vec3(0.0), N, vP, 0.03);
    }
    // thin things (paper, leaves, petals) let the lamps glow through from behind
    c += uThin * alb * (uLampCol * qAtt(distance(uLampPos, vP), 430.0) * max(dot(-N, normalize(uLampPos - vP)), 0.0)
                      + uLC[0] * qAtt(distance(uLP[0], vP), uLR[0]) * max(dot(-N, normalize(uLP[0] - vP)), 0.0)
                      + uLC[1] * qAtt(distance(uLP[1], vP), uLR[1]) * max(dot(-N, normalize(uLP[1] - vP)), 0.0)
                      + uShopC * qAtt(distance(uShopP, vP), 300.0) * max(dot(-N, normalize(uShopP - vP)), 0.0));
    gl_FragColor = vec4(c, 1.0);
  }
  #include <fog_fragment>
}`;

// Street: procedural wet cobbles on the hero's own lattice (so real domes and painted ones agree),
// pavement, gutter bed, and the lamp ribbon running the whole street.
const GROUND_VERT = FOGV + /* glsl */`
attribute vec2 aK; varying vec3 vP; varying vec3 vNg; varying vec2 vK;
void main(){ vP = position; vNg = normal; vK = aK;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GROUND_FRAG = FOGF + GLSL_LIGHT + /* glsl */`
uniform vec3 uCob; uniform vec3 uViolet; uniform vec3 uPale; uniform vec3 uDirt; uniform vec3 uMoss; uniform vec3 uFlag;
varying vec3 vP; varying vec3 vNg; varying vec2 vK;
void main(){
  vec3 N = normalize(vNg), alb; float rough, pud = 0.0;
  float dist = distance(cameraPosition, vP);
  if (vK.x > 0.5) {                       // pavement: big wet flagstones, each with its own sheen, dark joints
    vec2 fq = vP.xz / vec2(66.0, 46.0); fq.x += 0.5 * floor(fq.y); vec2 fi = floor(fq), ff = abs(fract(fq) - 0.5);
    float fh = pbHash(fi * 1.31 + 4.7), joint = smoothstep(0.455, 0.49, max(ff.x, ff.y)) * (1.0 - smoothstep(300.0, 700.0, dist));
    alb = uFlag * (0.8 + 0.4 * pbFbm(vP.xz * 0.05)) * (0.78 + 0.5 * fh) * (1.0 - 0.5 * joint); rough = mix(0.2 + 0.4 * fract(fh * 7.7), 0.7, joint);
    N = normalize(N + vec3(0.05 * (fh - 0.5), 0.0, 0.05 * (fract(fh * 3.3) - 0.5)));
  }
  else {
    float P = 10.6, r = floor((vP.z + 122.0) / P + 0.5);
    vec2 c = vec2(12.0 + mod(r, 2.0) * P * 0.5, -122.0 + r * P); c.x += floor((vP.x - c.x) / P + 0.5) * P;
    vec2 q = (vP.xz - c) / 4.8; float h = pbHash(c * 0.37 + 1.7);
    float rho = pow(pow(abs(q.x), 4.0) + pow(abs(q.y), 4.0), 0.25) * (0.9 + 0.2 * fract(h * 3.9));
    float dome = 1.0 - smoothstep(0.82, 1.04, rho);
    vec3 cob = mix(uCob, mix(uViolet, uPale, step(0.5, h)), 0.34 * fract(h * 7.3)) * (0.62 + 0.7 * fract(h * 13.7)) * (0.78 + 0.5 * pbFbm(vP.xz * 0.012 + 11.0));
    float moss = smoothstep(0.35, 0.7, pbFbm(vP.xz * 0.035 + 3.0));
    alb = mix(mix(uDirt, uMoss, moss * 0.8), cob, dome); rough = mix(0.7, 0.26 + 0.22 * fract(h * 5.1), dome);
    float k = smoothstep(0.25, 1.0, rho) * 1.3 * dome * (1.0 - smoothstep(220.0, 620.0, dist));
    float bed = smoothstep(1.2, -0.8, vK.y);
    alb = mix(alb, uDirt * 0.8, bed); rough = mix(rough, 0.5, bed);
    // puddles (polish 2): hollows where the stones lie under a flat film that mirrors the sky and the lamps
    pud = sin(vP.x * 0.023 + 1.3) * sin(vP.z * 0.019 + 0.4) + 0.55 * sin(vP.x * 0.047 - vP.z * 0.037 + 2.1) + 0.3 * sin(vP.x * 0.011 + vP.z * 0.09);
    pud = pbSS(0.56, 0.72, pud + 0.3 * (pbFbm(vP.xz * 0.06) - 0.5)) * (1.0 - bed);
    alb = mix(alb, uDirt * 0.5 + cob * 0.3 * dome, pud * 0.85); rough = mix(rough, 0.04, pud);
    N = normalize(N + vec3(q.x, 0.0, q.y) * k * (1.0 - bed) * (1.0 - pud));
  }
  float m = pbFbm(vP.xz * 0.9);
  alb *= (0.72 + 0.5 * m);
  vec3 col = qShade(alb, N, vP, clamp(rough * (0.6 + 0.9 * m), 0.08, 1.0));
  // wet film: the lamps' long broken reflections
  vec3 V = normalize(cameraPosition - vP), R = reflect(-V, normalize(mix(vec3(0.0, 1.0, 0.0), N, 0.55)));
  float wet = (1.0 - rough) * (0.5 + 0.8 * m) * step(0.5, N.y);
  float frp = 1.0 - max(dot(N, V), 0.0); col += pud * (uSkyC * 0.55 + uWash * 1.6) * (0.1 + 0.9 * frp * frp);
  col += wet * uRib * (uLampCol * qRibbon(R, vP, uLampPos, 70.0) + uLC[0] * qRibbon(R, vP, uLP[0], 70.0) + uLC[1] * 0.6 * qRibbon(R, vP, uLP[1], 30.0)
                      + uShopC * 0.6 * qRibbon(R, vP, uShopP, 30.0) * qAtt(distance(uShopP, vP), 520.0));
  // (repair 3) the lamp's amber pooled on the wet road round its foot (the same pool as on the drain's own stones)
  col += uLampCol * exp(-(pbSq(vP.x - 10.0) + pbSq(vP.z + 70.0)) / 22500.0) * 0.05 * (1.0 - rough) * (0.5 + m) * step(0.5, N.y);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// Gutter water: the hero's basin shader carried up the whole course in (d, 900 - s) coordinates so
// the two join without a seam at s = 754, plus rapids, banks, boats, rails, coin, ice and splashes.
const WATER_VERT = FOGV + GLSL_COMMON + GLSL_COURSE + /* glsl */`
attribute vec2 aSD; attribute vec4 aA; attribute vec2 aHd;
uniform vec3 uSurge; uniform vec4 uSplash;
varying vec3 vP; varying vec2 vSD; varying vec4 vA; varying vec2 vHd; varying float vLift;
void main(){
  vec3 p = position; vec2 q = vec2(aSD.y, 900.0 - aSD.x);
  float sg = uSurge.y * exp(-pbSq((aSD.x - uSurge.x) / uSurge.z));
  float rr = distance(p.xz, uSplash.xy), R = uSplash.z * 70.0;
  float sw = uSplash.w * sin((rr - R) * 0.35) * exp(-pbSq((rr - R) / 12.0));
  vLift = sg * 0.2 + abs(sw) * 0.6 + abs(gStand(aSD.x)) * 0.55;
  p.y += (pbNoise(q * 0.11 + vec2(0.0, uTime * 0.9)) - 0.5) * 0.55 * min(aA.x * 0.2, 1.0) + gStand(aSD.x) + sg + sw
       + aA.y * 0.14 * sin(aSD.x * 0.9 + aSD.y * 0.5 - uTime * 7.0) * (1.0 - pbSS(593.0, 598.0, aSD.x) * (1.0 - pbSS(613.0, 618.0, aSD.x)));
  vP = p; vSD = aSD; vA = aA; vHd = aHd;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = FOGF + GLSL_LIGHT + GLSL_COURSE + /* glsl */`
uniform vec3 uSkyLo; uniform vec3 uSkyHi; uniform vec3 uDeep; uniform vec3 uCream;
uniform vec3 uSurge; uniform vec3 uBoat[3]; uniform vec3 uBoatD[3]; uniform vec4 uStrip; uniform vec3 uStripC; uniform vec3 uPipe; uniform vec4 uSplash; uniform vec3 uCoin; uniform float uIce; uniform float uRainK; uniform float uWin; uniform float uRush;
varying vec3 vP; varying vec2 vSD; varying vec4 vA; varying vec2 vHd; varying float vLift;
float wRings(vec2 p){
  vec2 c = floor(p / 15.0), f = p / 15.0 - c;
  float h = pbHash(c), t = fract(uTime * 0.6 + h);
  vec2 o = vec2(pbHash(c + 3.1), pbHash(c + 7.7)) * 0.5 + 0.25;
  float d = length(f - o) * 15.0, r = t * 6.5;
  return sin((d - r) * 2.4) * exp(-abs(d - r) * 0.9) * (1.0 - t) * (1.0 - t);
}
float wH(vec2 p, float spd){
  float t = uTime * 0.8, a = fract(t), b = fract(t + 0.5), w = abs(1.0 - 2.0 * a);
  vec2 f = vec2(0.0, -1.0);
  vec2 q1 = p - f * spd * (a - 0.5) * 1.25, q2 = p - f * spd * (b - 0.5) * 1.25 + 17.3;
  float h1 = pbFbm(q1 * 0.2) + 0.35 * pbNoise(q1 * 0.75);
  float h2 = pbFbm(q2 * 0.2) + 0.35 * pbNoise(q2 * 0.75);
  return mix(h1, h2, w) + 0.3 * uRainK * wRings(p);
}
void main(){
  vec2 p = vec2(vSD.y, 900.0 - vSD.x); float spd = vA.x * uRush, e = 0.35, h0 = wH(p, spd);
  float str = 0.75 + 0.9 * vA.y;
  vec3 Nl = vec3(-(wH(p + vec2(e, 0.0), spd) - h0) / e * str, 1.0, -(wH(p + vec2(0.0, e), spd) - h0) / e * str);
  // the rapid has a shape of its own: the tongue's fall and the standing waves tilt the surface (before, the
  // rapid was shaded as if it lay flat, which is why its foam read as a slab); the tongue itself runs glassy
  float sR = vSD.x, tongue = pbSS(595.0, 599.0, sR) * (1.0 - pbSS(612.0, 616.5, sR));
  Nl.xz *= mix(1.0, 0.4, tongue);
  Nl.z += (gW(sR + 0.4) + gStand(sR + 0.4) - gW(sR - 0.4) - gStand(sR - 0.4)) * 1.25;
  vec2 rt = vec2(-vHd.y, vHd.x);
  // surface tension: the water bulges against kerb, cobbles, paper and leaf
  float menL = pbSS(2.2, 0.2, vA.z), menR = pbSS(2.2, 0.2, vA.w), men = menL + menR;
  Nl.x += (menR - menL) * 0.9;
  vec3 N = vec3(Nl.x * rt.x - Nl.z * vHd.x, Nl.y, Nl.x * rt.y - Nl.z * vHd.y);
  float hull = 0.0, wake = 0.0, occ = 1.0;
  for (int i = 0; i < 3; i++) {
    vec2 v = vP.xz - uBoat[i].xy; float r0 = length(v) + 1e-3;
    float r = length(vec2(dot(v, uBoatD[i].xy) * uBoatD[i].z, dot(v, vec2(-uBoatD[i].y, uBoatD[i].x)))) + 1e-3;
    float ring = exp(-pbSq((r - uBoat[i].z) / 1.1)); hull += ring;
    float lx = dot(v, uBoatD[i].xy), ly = abs(dot(v, vec2(-uBoatD[i].y, uBoatD[i].x)));
    wake += step(lx, 0.0) * exp(-pbSq((ly - uBoat[i].z * 0.8 + lx * 0.28) / 0.9)) * exp(lx * 0.09) * pbSS(uBoat[i].z * 0.8, uBoat[i].z * 1.6, r0);
    N.xz += v / r0 * (ring * 1.3 + sin(r * 1.4 - uTime * 7.0) * exp(-r * 0.11) * 0.2 * step(uBoat[i].z, r));
    occ *= 1.0 - 0.78 * pbSS(uBoat[i].z * 3.4, uBoat[i].z * 1.3, r);      // (polish 3) a hull blocks the lamp's ribbon: dark water round it, the boat stays solid
  }
  float pr = distance(vP.xz, uPipe.xy);
  N.xz += (vP.xz - uPipe.xy) / (pr + 0.01) * sin(pr * 1.1 - uTime * 9.0) * exp(-pr * 0.07) * 0.5 * uPipe.z;
  float rr = distance(vP.xz, uSplash.xy), SR = uSplash.z * 70.0, sring = uSplash.w * exp(-pbSq((rr - SR) / 9.0));
  N.xz += (vP.xz - uSplash.xy) / (rr + 0.01) * sring * 0.6;
  N = normalize(N);
  vec3 V = normalize(cameraPosition - vP);
  float fr = 0.035 + 0.965 * pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 5.0);
  vec3 R = reflect(-V, N);
  // water that slopes away from the lens (the tongue's face, the back of a standing wave) mirrors the water
  // below it, not the sky: it stays dark glass, and only its highlights are bright
  float away = pbSS(-0.02, -0.3, R.y) * pbSS(594.0, 598.0, sR) * (1.0 - pbSS(646.0, 652.0, sR));
  R.y = abs(R.y);
  vec3 col = mix(uDeep * (0.55 + 0.5 * h0), mix(mix(uSkyLo, uSkyHi, clamp(R.y * 1.3, 0.0, 1.0)), uDeep * 1.5 + uSkyLo * 0.35, away * 0.85), fr);
  // lit windows mirrored as soft amber dabs at grazing angles
  col += uLampCol * uWin * fr * pbSS(0.62, 0.9, pbNoise(vec2(p.x * 0.05 + R.x * 4.0, p.y * 0.012))) * 0.16;
  // a dropped coin on the bed of the still pool
  vec2 cq = vSD - uCoin.xy + (N.xz) * 2.5; float coin = pbSS(3.3, 2.5, length(cq)) * uCoin.z;
  col += (uLampCol * 0.35 + uSkyHi) * coin * (1.0 - fr) * (0.6 + 0.4 * sin(cq.x * 3.0 + cq.y * 2.0));
  float nearK = mix(0.45, 1.0, pbSS(8.0, 45.0, distance(cameraPosition, vP)));      // (polish 2) no glare sheet right under the lens
  occ *= 1.0 - 0.6 * max(away, tongue * 0.7);
  col += uLampCol * (occ * qRibbon(R, vP, uLampPos, 190.0) * mix(0.75, 1.3, smoothstep(640.0, 754.0, vSD.x)) * mix(nearK, mix(0.6, 1.0, nearK), smoothstep(640.0, 754.0, vSD.x)) + 0.012 * pbLampAtt(distance(uLampPos, vP)));
  col += occ * (uLC[0] * qRibbon(R, vP, uLP[0], 190.0) * 0.8 * nearK + uLC[1] * qRibbon(R, vP, uLP[1], 60.0) * 0.3);
  col += uShopC * qRibbon(R, vP, uShopP, 200.0) * 0.35 * qAtt(distance(uShopP, vP), 520.0);
  // the tram's window strip: one bar of amber per window, lying on the water beside the cars and sweeping
  // across the sheet (and the boats) with them, the cars' own shadow between
  { vec2 sv = vP.xz - uStrip.xy, sh = vec2(cos(uStrip.z), -sin(uStrip.z)); float la = dot(sv, sh), lt = abs(dot(sv, vec2(-sh.y, sh.x)));
    float bar = 0.5 + 0.5 * sin(la * 0.1745 + 1.5708);
    col += uStripC * uStrip.w * occ * pbSS(360.0, 290.0, abs(la)) * pbSS(58.0, 80.0, lt) * exp(-max(lt - 75.0, 0.0) * 0.011) * (0.16 + 0.84 * bar * bar) * (0.45 + 0.55 * h0); }
  // foam: banks, rapids, rail grooves, the downpipe's boil, hull wakes, the splash ring
  float bank = men * pbSS(0.5, 0.8, pbNoise(p * 0.8 + vec2(0.0, uTime * 2.0)));
  float rapid = pbSS(595.0, 599.0, sR) * (1.0 - pbSS(647.0, 655.0, sR));
  float fast = pbSS(0.25, 1.0, vA.y + vLift * 0.5) * pbSS(0.5, 0.85, pbNoise(vec2(p.x * 0.7, p.y * 0.22 + uTime * (1.0 + spd * 0.12)))) * (1.0 - rapid);
  // white water drawn as white water (the design: 'a rapid over one broken, tilted cobble ... bow up and slapping
  // down through two standing waves'): a breaking roller at the tongue's foot, foam on the second crest, foam
  // carried down behind each, a collar round the cobble
  float wob = (pbNoise(vec2(p.x * 0.45, uTime * 0.9)) - 0.5) * 3.0 + (pbNoise(vec2(p.x * 1.7 + 5.0, uTime * 1.7)) - 0.5) * 1.6 + (pbNoise(vec2(p.x * 4.3 + 9.0, uTime * 2.3)) - 0.5) * 0.9;
  float rockR = mix(3.0, 7.2, pbSS(598.0, 611.0, sR)), rockD = length(vec2((sR - 606.0) * 0.92, vSD.y - 10.0));
  // (round 2) one cobble only; in the lee between the standing waves, against the kerb, an eddy: one foam line wound slowly round
  vec2 ev = vec2(sR - 629.0, vSD.y + 11.0); float ed = length(ev);
  float collar = exp(-pbSq((rockD - rockR - 0.5) / 1.1)) * pbSS(597.0, 600.0, sR) * (1.0 - pbSS(613.0, 617.0, sR)) * 0.8
               + pbSS(0.45, 0.95, 0.5 + 0.5 * sin(atan(ev.y, ev.x) + ed * 1.5 - uTime * 1.3)) * pbSS(4.6, 3.0, ed) * pbSS(0.3, 1.2, ed) * 0.62;
  // (repair 3) the foam is drawn, not sprinkled: it was one pale patch cut into hard white cells with dark specks.
  // Now each fall of white water has a front edge of soft lobes (the roller at the tongue's foot, the second
  // crest), and behind it the foam is combed out by the flow into long lines that slide downstream and thin as
  // they go; fine lines run down the tongue's own face; every edge is soft
  float lob = abs(sin(p.x * 0.62 + 2.4 * pbNoise(vec2(p.x * 0.21, uTime * 0.35)))), lob2 = abs(sin(p.x * 0.8 + 1.7 + 2.0 * pbNoise(vec2(p.x * 0.25 + 4.0, uTime * 0.3))));
  float jd = sR + 0.5 * wob - (612.6 + 3.4 * lob), cd2 = sR + 0.5 * wob - (634.4 + 2.6 * lob2);
  float ln1 = pbSS(0.32, 0.7, pbNoise(vec2(p.x * 1.5, sR * 0.11 - uTime * (0.9 + spd * 0.03)))), ln2 = pbSS(0.4, 0.75, pbNoise(vec2(p.x * 4.2 + 3.0, sR * 0.27 - uTime * (1.5 + spd * 0.05))));
  // (each line of foam behind a roller has its own length, 5 to 17 units for the first and 3 to 9 for the second,
  // so the foam ends downstream in fingers, and the froth itself is clotted, thick here and open there)
  float fl1 = mix(5.0, 17.0, pbNoise(vec2(p.x * 0.9, uTime * 0.2))), fl2 = mix(3.0, 9.0, pbNoise(vec2(p.x * 1.1 + 6.0, uTime * 0.25)));
  float froth = 0.5 + 0.5 * pbSS(0.3, 0.7, pbFbm(vec2(p.x * 0.8, sR * 0.45 - uTime * (1.4 + spd * 0.04))));
  float roller = pbSS(-0.4, 1.0, jd) * (1.0 - pbSS(1.6, 5.5, jd)), tail1 = pbSS(1.0, 4.0, jd) * (1.0 - pbSS(fl1 * 0.45, fl1, jd)) * (1.0 - pbSS(631.0, 636.0, sR));
  float roll2 = pbSS(-0.4, 0.9, cd2) * (1.0 - pbSS(1.2, 4.0, cd2)) * 0.8, tail2 = pbSS(0.8, 3.0, cd2) * (1.0 - pbSS(fl2 * 0.45, fl2, cd2));
  float tface = tongue * pbSS(0.6, 0.86, pbNoise(vec2(p.x * 2.3 + 11.0, sR * 0.07 - uTime * 1.9))) * 0.4;
  float wsoft = rapid * clamp(max(max(roller, roll2) * (0.55 + 0.25 * ln2 + 0.2 * froth), max((tail1 + tail2) * froth * (0.3 + 0.45 * ln1 + 0.25 * ln1 * ln2), max(collar * (0.45 + 0.55 * ln1), tface))), 0.0, 1.0);
  float white = wsoft, bubble = 0.62 + 0.14 * pbNoise(vec2(p.x * 0.9, sR * 0.5 - uTime * 2.0)) + 0.1 * ln2;      // (the foam's own soft shading: cream in the street's light, never a white sheet)
  float rail = (exp(-pbSq((vSD.x - 445.0) / 2.2)) + exp(-pbSq((vSD.x - 545.0) / 2.2))) * (0.4 + 0.6 * pbNoise(vec2(p.x * 0.5 - uTime * 3.0, p.y)));
  float boil = uPipe.z * pbSS(15.0, 2.0, pr) * (0.35 + 0.65 * pbNoise(vP.xz * 0.6 + uTime * 3.0));
  float foam = clamp(bank * 0.5 + fast * 0.7 + rail * 0.6 + boil + hull * 0.5 + wake * 0.5 * pbSS(0.3, 0.7, pbNoise(p * 0.9 + vec2(0.0, uTime * 1.5))) + sring * 0.6 * pbSS(0.35, 0.8, pbNoise(vP.xz * 0.4)), 0.0, 0.85);
  foam = max(foam, white * 0.96);
  // (repair 3) the wave that lifts us carries a foam line (the journey: 'its wake surge lifts us over the rail
  // grooves'): a ragged line of soft lobes along its crest, where the hull rides, wisps of it trailing down its back
  // (it is lit as the rapid's white water is: left in the plain foam's dim tone it lay on the amber sheet as a dull line)
  float sgk = clamp(uSurge.y / 1.3, 0.0, 1.0), sgd = sR - (uSurge.x - 0.2 * uSurge.z) - 2.0 * lob;
  // (a line, not a band: narrow, broken here and there along its length, an older, thinner line left a little behind it)
  float sgap = pbSS(0.22, 0.5, pbNoise(vec2(p.x * 0.45 + 2.0, uTime * 0.25))), sgap2 = pbSS(0.3, 0.6, pbNoise(vec2(p.x * 0.6 + 9.0, uTime * 0.2)));
  float sfoam = 0.95 * sgk * max(max(pbSS(0.9, 0.15, abs(sgd)) * sgap * (0.7 + 0.3 * ln2), 0.7 * pbSS(0.6, 0.1, abs(sgd + 3.0 - 1.5 * lob2)) * sgap2),
    0.4 * pbSS(-9.0, -1.0, sgd) * pbSS(0.4, -1.0, sgd) * ln1 * ln2);
  foam = max(foam, sfoam);
  // the tongue: a curled glassy lip, amber on its face, combed by the flow
  { float la = pbLampAtt(distance(uLampPos, vP)), curl = exp(-pbSq((sR - 598.4) / 1.0));
    float comb = pbSS(0.58, 0.9, pbNoise(vec2(p.x * 3.4, p.y * 0.1 + uTime * 2.5))) + 0.6 * pbSS(0.66, 0.92, pbNoise(vec2(p.x * 8.0 + 3.0, p.y * 0.16 + uTime * 3.4)));
    col += (uSkyHi * 0.3 + uLampCol * (0.02 + 0.12 * la)) * curl * (0.4 + 0.6 * pbNoise(vec2(p.x * 1.3, uTime * 0.8)));
    col += tongue * ((uLampCol * (0.012 + 0.07 * la)) * (0.4 + 0.8 * h0) + (uSkyHi * 0.12 + uLampCol * (0.01 + 0.09 * la)) * comb); }
  col = mix(col, uCream * (uSkyC * 1.15 + uLampCol * (0.02 + 0.3 * pbLampAtt(distance(uLampPos, vP))) + uLC[0] * 0.26 * qAtt(distance(uLP[0], vP), uLR[0]) + uLC[1] * 0.2 * qAtt(distance(uLP[1], vP), uLR[1])) * mix(1.0, 2.1 * bubble, max(white, sfoam)), foam);
  col += (uSkyHi * 0.5 + uLampCol * 0.1 * pbLampAtt(distance(uLampPos, vP))) * hull;    // the meniscus round each hull catches the light
  col += uSkyHi * men * 0.2;
  // winter: a thin rim of ice along the kerb
  float ice = uIce * pbSS(5.5 + 2.0 * pbNoise(p * 0.3), 3.5, vA.z);
  col = mix(col, uSkyHi * (1.3 + 0.8 * pbNoise(p * 2.0)) + uLampCol * 0.03, ice * 0.8);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// Rain: streak quads in a box that wraps round the camera, dark against the dark and amber wherever
// they cross a lamp cone or the tram's window light.
const RAIN_VERT = FOGV + GLSL_LIGHT + /* glsl */`
attribute vec4 aS; uniform vec3 uBox; uniform vec3 uVel; uniform vec3 uLen; varying vec3 vC; varying vec2 vUv;
vec3 cone(vec3 c, vec3 Lp, vec3 Lc, vec3 view){
  vec3 v = Lp - c; float d = length(v); v /= d;
  float fs = pbSq(max(dot(view, v), 0.0));
  return Lc * pbSS(0.5, 0.92, v.y) * (0.25 + 1.5 * fs) / (1.0 + d * d / 70000.0);
}
void main(){
  float sp = 0.75 + 0.5 * aS.w;
  vec3 vel = uVel * sp, c = aS.xyz * uBox + vel * uTime;
  c = mod(c - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5 + cameraPosition;
  vec3 ax = normalize(vel), toC = cameraPosition - c; float dist = length(toC); toC /= dist;
  vec3 side = normalize(cross(ax, toC));
  vec3 p = c + ax * position.y * uLen.x * (0.6 + 0.8 * aS.w) + side * position.x * max(uLen.y, dist * 0.0028);
  vUv = position.xy * 2.0;
  vec3 view = -toC;
  vC = uSkyC * uLen.z * 0.5 + cone(c, uLampPos, uLampCol, view) + cone(c, uLP[0], uLC[0], view)
     + uLC[1] * qAtt(distance(c, uLP[1]), uLR[1]) * 0.4 + uShopC * qAtt(distance(c, uShopP), 150.0) * 0.3;      // the sky: 'bright amber needles wherever they cross a lamp cone or a lit window'
  vC *= pbSS(5.0, 26.0, dist) * 0.6;
  vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RAIN_FRAG = FOGF + /* glsl */`
varying vec3 vC; varying vec2 vUv;
void main(){
  float a = (1.0 - min(vUv.x * vUv.x, 1.0)) * (1.0 - pow(min(abs(vUv.y), 1.0), 3.0));
  gl_FragColor = vec4(vC * a, 1.0);
  #ifdef USE_FOG
    gl_FragColor.rgb *= 1.0 - (1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * 0.7;
  #endif
}`;

// Raindrop crowns and their expanding rings: a recycled pool placed in course coordinates.
const CROWN_VERT = FOGV + GLSL_LIGHT + GLSL_COURSE + /* glsl */`
attribute vec4 aS; attribute float aT; uniform float uCamS; varying vec3 vC; varying vec3 vUv;
void main(){
  float T = 1.1 + aS.z, cyc = uTime / T + aS.w, id = floor(cyc), ph = fract(cyc);
  float h1 = pbHash(vec2(id * 0.137, aS.x * 91.7)), h2 = pbHash(vec2(id * 0.211 + 3.3, aS.y * 57.3));
  float s = uCamS - 60.0 + mod(h1 * 300.0 - (uCamS - 60.0), 300.0);
  float d = aS.x < 0.62 ? (h2 * 2.0 - 1.0) * 13.5 : 19.0 + h2 * h2 * 150.0;
  float onW = step(d, gWr(s) - 0.5);
  float y = mix(gG(s) + 4.2, gW(s) + gStand(s), onW);
  vec4 c4 = crs(s); vec3 c = vec3(c4.x - c4.w * d, y, c4.y + c4.z * d);
  float alive = step(-45.0, s) * step(s, 893.0);
  vec3 p; float a;
  if (aT < 0.5) {                                  // ring lying on the surface
    float rad = (0.5 + ph * (2.0 + 2.6 * aS.z)) * mix(0.55, 1.0, onW);
    p = c + vec3(position.x, 0.0, position.y) * rad * 2.0; p.y += 0.2; a = (1.0 - ph) * (1.0 - ph) * 0.4;
  } else {                                         // the crown itself, alive for the first fifth of the cycle
    float k = clamp(ph * 5.0, 0.0, 1.0);
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), cameraPosition - c));
    p = c + rt * position.x * (1.3 + 1.7 * k) + vec3(0.0, 1.0, 0.0) * (position.y + 0.5) * (0.3 + 1.9 * sin(3.1416 * sqrt(k)));
    a = (1.0 - k) * 0.5;
  }
  vUv = vec3(position.xy * 2.0, aT);
  float dist = distance(cameraPosition, c);
  vC = (uSkyC * 0.8 + uLampCol * 0.5 * pbLampAtt(distance(c, uLampPos)) + uLC[0] * 0.5 * qAtt(distance(c, uLP[0]), uLR[0]) + uLC[1] * 0.4 * qAtt(distance(c, uLP[1]), uLR[1]))
     * a * alive * pbSS(3.0, 12.0, dist);
  vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CROWN_FRAG = FOGF + /* glsl */`
float pbSq(float x){ return x * x; }
varying vec3 vC; varying vec3 vUv;
void main(){
  float a;
  if (vUv.z < 0.5) { float r = length(vUv.xy); a = exp(-pbSq((r - 0.84) / 0.09)) + 0.35 * exp(-pbSq((r - 0.5) / 0.07)); }
  else {
    float x = clamp(vUv.x, -1.0, 1.0), y = clamp(vUv.y, -1.0, 1.0) * 0.5 + 0.5;
    a = exp(-x * x * 34.0) * (1.0 - y) * 1.3                                    // the rebound jet
      + (1.0 - smoothstep(0.1, 0.32, y)) * (1.0 - pow(abs(x), 4.0)) * 0.55;       // the low rim of the crater
    a += exp(-(x * x * 30.0 + (y - 0.95) * (y - 0.95) * 180.0)) * 1.5;      // the bead thrown off the top
  }
  gl_FragColor = vec4(vC * a, 1.0);
  #ifdef USE_FOG
    gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
}`;

const SKY_VERT = /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = GLSL_COMMON + /* glsl */`
uniform vec3 uSkyA; uniform vec3 uSkyB; uniform vec3 uFogC; uniform float uBreak; varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); float up = max(d.y, 0.0);
  vec2 q = d.xz / (up + 0.3);
  float n = pbFbm(q * 1.3 + vec2(uTime * 0.012, uTime * 0.02)), n2 = pbFbm(q * 3.1 - uTime * 0.025);
  vec3 c = mix(uSkyA, uSkyB, pbSS(0.3, 0.75, n * 0.7 + n2 * 0.3));
  c += uSkyB * uBreak * pbSS(0.5, 0.8, n) * 1.6;
  gl_FragColor = vec4(mix(uFogC, c, pbSS(0.02, 0.5, d.y)), 1.0);
}`;

// Housefronts: dark flat cards with soft, already-blurred amber windows.
const FACADE_VERT = FOGV + /* glsl */`
attribute float aSeed; varying vec2 vUv; varying float vSeed; varying vec3 vP; varying vec3 vN;
void main(){ vUv = uv; vSeed = aSeed; vP = position; vN = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FACADE_FRAG = FOGF + GLSL_LIGHT + /* glsl */`
uniform float uLit; uniform vec3 uWall; uniform vec3 uWinC; uniform vec3 uOne;
varying vec2 vUv; varying float vSeed; varying vec3 vP; varying vec3 vN;
void main(){
  vec2 cell = vec2(190.0, 290.0), g = vUv / cell, idc = floor(g), id = idc + floor(vSeed * 64.0 + 0.5) * 3.0, f = fract(g) - 0.5;
  float h = pbHash(id), h2 = pbHash(id + 9.1), ground = step(vUv.y, 290.0);
  vec2 half2 = mix(vec2(0.22, 0.30), vec2(0.36, 0.27), ground);
  vec2 a = abs(f - vec2(0.0, -0.04 * ground)) - half2; float sd = max(a.x * 190.0, a.y * 290.0);
  float nearK = pbSS(900.0, 180.0, distance(cameraPosition, vP));
  float win = 1.0 - pbSS(mix(-5.0, -20.0, nearK), mix(12.0, 34.0, nearK), sd);
  float lit = max(step(h, uLit), step(abs(idc.x - uOne.x) + abs(idc.y - uOne.y) + abs(vSeed - uOne.z) * 50.0, 0.5));
  vec3 glass = uWinC * (0.35 + 0.95 * h2) * (1.0 + 0.04 * sin(uTime * 3.0 + h * 40.0)) * (0.7 + 0.3 * cos(f.y * 5.0));
  float fy = (f.y + 0.04 * ground) / half2.y;                           // -1 sill .. 1 lintel
  glass *= (0.62 + 0.38 * pbSS(-1.0, 0.7, fy)) * (1.0 - 0.25 * nearK);  // brighter toward the lamp inside, dimmer close to
  glass *= 1.0 - 0.5 * step(0.45, h2) * pbSS(0.25 + 0.5 * fract(h * 9.7), 0.45 + 0.5 * fract(h * 9.7), fy);     // a blind drawn part-way
  glass *= 1.0 - 0.35 * step(h2, 0.45) * pbSS(0.55, 0.95, abs(f.x) / half2.x);                                   // or curtains at the sides
  glass *= 1.0 - mix(1.0, 0.45, nearK) * (0.45 * pbSS(4.0 + 6.0 * nearK, 1.0, abs(f.x) * 190.0) + 0.3 * pbSS(4.0 + 6.0 * nearK, 1.0, abs(f.y - 0.06) * 290.0));
  // now and then somebody crosses behind a blind
  float sh = step(0.55, h2) * pbSS(0.17, 0.03, abs(f.x - 0.34 * sin(uTime * 0.33 + h * 30.0))) * pbSS(0.28, -0.12, f.y);
  glass *= 1.0 - 0.75 * sh;
  vec3 wall = uWall * (0.7 + 0.5 * pbFbm(vUv * 0.02 + vSeed * 9.0)) * (0.9 + 0.1 * step(0.5, fract(vUv.y / 14.0)));
  wall *= 1.0 - 0.35 * pbSS(940.0, 1000.0, vUv.y);
  vec3 col = qShade(wall, normalize(vN), vP, 0.85) + wall * 0.05 + uWinC * 0.06 * lit * exp(-max(sd, 0.0) / 34.0);
  col = mix(col, mix(uSkyC * 0.7, glass, lit), win);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
  gl_FragColor.rgb += glass * win * lit * 0.3;       // lit windows carry through the mist as soft panels
}`;

// Out-of-focus lights: discs that grow with distance, the lens telling you how small you are.
const BOKEH_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aCol; varying vec2 vUv; varying vec3 vC;
void main(){
  vec4 mv = viewMatrix * vec4(aPos, 1.0); float dist = max(-mv.z, 1.0);
  mv.xy += position.xy * aCol.w * (0.35 + dist / 450.0);
  vUv = position.xy * 2.0; vC = aCol.rgb * exp(-dist * 0.0006) / (0.7 + dist / 600.0);
  gl_Position = projectionMatrix * mv;
}`;
const BOKEH_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vC;
void main(){ float d = length(vUv);
  float a = smoothstep(1.0, 0.84, d) * (0.5 + 0.5 * smoothstep(0.55, 0.95, d)) + 0.7 * exp(-d * d * 5.0);
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// Thrown water: wheel fans, the boot's splash crown.
const FAN_VERT = FOGV + /* glsl */`
attribute vec2 aF; varying vec2 vUv; varying vec2 vF; varying vec3 vP;
void main(){ vUv = vec2(position.x * 2.0, position.y); vF = aF;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vP = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FAN_FRAG = FOGF + GLSL_LIGHT + /* glsl */`
uniform vec3 uCream; varying vec2 vUv; varying vec2 vF; varying vec3 vP;
void main(){
  float r = length(vUv), ang = atan(vUv.x, vUv.y), crown = step(1.5, vF.x), a, lit = 1.0;
  if (crown > 0.5) {      // the boot's soft splash crown, as it was
    float mask = pbSS(1.0, 0.4, r) * pbSS(1.3, 0.2, abs(ang)) * pbSS(0.0, 0.16, r);
    a = mask * pbSS(0.2, 0.85, pbFbm(vec2(ang * 2.6 + vF.x * 13.0, r * 2.4 - uTime * 2.2)) * 1.25) * vF.y * 0.7;
  } else {
    // (repair 3) thrown water with a drawn shape (it was a burst of straight spikes): a thin sheet flung up from
    // the wheel's foot, thick at its root and streaked the way it was thrown; its upper edge cut into teeth with
    // a thickened bright rim, as the edge of a splash crown is; and beyond the edge the teeth break into separate
    // round drops that fly on outward, each with its own highlight. Still the design's 'fan-shaped quads with a
    // scrolling noise mask': the streaks, the edge and the drops all scroll outward from the foot
    float ph = vF.x * 40.0, side = pbSS(1.25, 0.75, abs(ang));
    float edge = 0.55 + 0.1 * sin(ang * 6.5 + ph) + 0.06 * sin(ang * 15.0 - ph * 1.7 + uTime * 1.3) + 0.1 * (pbNoise(vec2(ang * 2.5 + ph, uTime * 0.9)) - 0.5);
    float sheet = pbSS(edge, edge - 0.05, r) * pbSS(0.0, 0.1, r) * side, streak = pbNoise(vec2(ang * 13.0 + ph, r * 3.2 - uTime * 3.6));
    float rim = exp(-pbSq((r - edge) / 0.03)) * side;
    vec2 g = vec2(ang * 8.0 + ph, (r - uTime * 0.55) * 8.5), gi = floor(g), gf = fract(g) - 0.5;
    float h = pbHash(gi + 3.7), h2 = pbHash(gi * 1.7 + 9.1), rad = mix(0.5, 1.25, h2 * h2);
    vec2 dv = vec2((gf.x - (h - 0.5) * 0.5) * r * 5.6, (gf.y - (h2 - 0.5) * 0.5) * 4.7);      // from the drop's middle, in world units near enough
    float drop = pbSS(rad, rad * 0.55, length(dv)) * step(0.4, h) * pbSS(edge - 0.05, edge + 0.05, r) * pbSS(1.0, 0.8, r) * side;
    float glint = pbSS(rad * 0.5, 0.0, length(dv - vec2(-0.3, 0.35) * rad));
    a = (sheet * (0.28 + 0.35 * streak * streak + 0.3 * pbSS(0.35, 0.0, r)) + rim * 0.85 + drop * 0.95) * vF.y;
    lit = 0.7 + 0.5 * streak * sheet + 0.8 * rim + drop * (0.2 + 1.5 * glint);
  }
  if (a < 0.004) discard;
  // (repair 2) a wheel's fan stands in the tram's own window light and the street's: lit amber spray, bright at its thick root
  vec3 col = uCream * (uSkyC * 1.6 + uLampCol * pbLampAtt(distance(vP, uLampPos)) * mix(0.45, 0.25, crown) + uLC[0] * qAtt(distance(vP, uLP[0]), uLR[0]) * mix(0.45, 0.25, crown)
    + uLC[1] * qAtt(distance(vP, uLP[1]), uLR[1]) * mix(1.0, 0.5, crown) + uWash * 2.5 * (1.0 - crown));
  col *= mix(lit, 1.0, crown);
  gl_FragColor = vec4(col, min(a, 1.0) * mix(0.86, 0.42, crown));
  #include <fog_fragment>
}`;
// The downpipe's falling column.
const COL_VERT = FOGV + /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec2 vUv;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const COL_FRAG = FOGF + GLSL_LIGHT + /* glsl */`
uniform vec3 uCream; uniform vec3 uDeep; varying vec3 vP; varying vec3 vN; varying vec2 vUv;
void main(){
  // (repair 3) the strands run down the fall (they used to run round it), and the foot of the column frays into drops
  float st = pbNoise(vec2(vUv.y * 13.0, vUv.x * 5.0 - uTime * 3.6)) * 0.6 + 0.4 * pbNoise(vec2(vUv.y * 5.0 + 3.0, vUv.x * 2.4 - uTime * 2.5));
  float fray = mix(1.0, pbSS(0.3, 0.62, pbNoise(vec2(vUv.y * 9.0, vUv.x * 34.0 - uTime * 10.0))), pbSS(0.74, 1.0, vUv.x));
  vec3 V = normalize(cameraPosition - vP); float rim = 1.0 - abs(dot(normalize(vN), V));
  vec3 lam = uLampCol * pbLampAtt(distance(vP, uLampPos)) + uLC[0] * qAtt(distance(vP, uLP[0]), uLR[0]) + uLC[1] * qAtt(distance(vP, uLP[1]), uLR[1]);
  float r2 = rim * rim;
  vec3 col = uDeep * 0.25 + uSkyC * (0.2 + 3.0 * r2) + lam * (0.08 + 0.7 * st * st + 0.9 * r2) + uCream * uSkyC * 2.0 * pbSS(0.6, 0.95, st);
  gl_FragColor = vec4(col, clamp(0.16 + 0.55 * st * st + 0.75 * r2, 0.0, 1.0) * fray);
  #include <fog_fragment>
}`;
// Leaves, petals and conkers carried by the current (instanced; position from the course in GLSL).
const FLOAT_VERT = FOGV + GLSL_COMMON + GLSL_COURSE + /* glsl */`
attribute float aRough; attribute vec4 aS; uniform float uFlow;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vR; varying vec3 vO; varying vec2 vLf;
void main(){
  vLf = position.xz;
  float L = 735.0, s = -30.0 + mod(aS.x * L + uTime * uFlow * (0.75 + 0.5 * aS.w), L);
  float sc = aS.z * smoothstep(-30.0, -18.0, s) * (1.0 - smoothstep(684.0, 694.0, s));
  float d = aS.y > 0.0 ? mix(8.0, gWr(s) - 2.5, aS.y) : -mix(8.0, 12.5, -aS.y);
  float rot = aS.w * 6.283 + uTime * 0.5 * (aS.w - 0.5) + s * 0.015, cr = cos(rot), sr = sin(rot);
  vec3 p = vec3(position.x * cr - position.z * sr, position.y, position.x * sr + position.z * cr) * sc;
  vec3 n = vec3(normal.x * cr - normal.z * sr, normal.y, normal.x * sr + normal.z * cr);
  vec4 c4 = crs(s);
  p += vec3(c4.x - c4.w * d, gW(s) + gStand(s) + 0.25 + 0.2 * sin(uTime * 2.3 + aS.w * 40.0), c4.y + c4.z * d);
  vO = position * aS.z + aS.w * 50.0; vP = p; vN = n; vC = color * (0.7 + 0.6 * fract(aS.w * 7.7)); vR = aRough;
  vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------- geometry helpers ----
// Small accumulator: many pieces into one vertex-coloured geometry (position, normal, color, aRough).
// rough < 0 marks an unlit emissive piece of strength -rough.
function makeAcc() {
  const P = [], N = [], C = [], R = [];
  const v = new V3(), n = new V3(), nm = new THREE.Matrix3(), I = new THREE.Matrix4();
  const acc = {
    add(geo, m, col, rough = 0.5, o = {}) {
      m = m || I;
      const pa = geo.attributes.position, na = geo.attributes.normal, idx = geo.index, cnt = idx ? idx.count : pa.count;
      nm.getNormalMatrix(m);
      const rev = m.determinant() < 0, fn = typeof col === 'function';
      const one = (i) => {
        const k = idx ? idx.getX(i) : i;
        v.fromBufferAttribute(pa, k); const cc = fn ? col(v) : col; v.applyMatrix4(m);
        n.fromBufferAttribute(na, k).applyMatrix3(nm).normalize();
        const sh = o.shade ? o.shade(v.x, v.y, v.z) : 1;
        P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(cc.r * sh, cc.g * sh, cc.b * sh); R.push(rough);
      };
      for (let t = 0; t < cnt; t += 3) { one(t); if (rev) { one(t + 2); one(t + 1); } else { one(t + 1); one(t + 2); } }
      geo.dispose();
      return acc;
    },
    tri(a, b, c, col, rough = 0.5) {           // flat triangle
      n.subVectors(b, a).cross(v.subVectors(c, a)); if (n.lengthSq() < 1e-10) return acc; n.normalize();
      for (const q of [a, b, c]) { P.push(q.x, q.y, q.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); R.push(rough); }
      return acc;
    },
    get count() { return R.length; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aRough', new THREE.Float32BufferAttribute(R, 1));
      return g;
    },
  };
  return acc;
}
const colr = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const desat = (c, t) => { const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; return c.lerp(new THREE.Color(l, l, l), t); };
const mixc = (a, b, t, k = 1) => a.clone().lerp(b, t).multiplyScalar(k);
// a tube between two points (for bicycle frames, pipes, legs, wires)
function rod(acc, a, b, r, col, rough = 0.35, seg = 6, r2 = r) {
  const d = new V3().subVectors(b, a), len = d.length();
  const m = new THREE.Matrix4().compose(new V3().addVectors(a, b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()), new V3(1, 1, 1));
  acc.add(new THREE.CylinderGeometry(r2, r, len, seg, 1), m, col, rough);
}
// instanced quad geometry with per-instance attributes
function instQuad(count, attrs) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].array, attrs[k].size));
  g.instanceCount = count; return g;
}

// ---------------------------------------------------------------- the look of this visit ----
function pickLook(ctx) {
  const rng = ctx.rng.fork('look'), vary = ctx.vary || {}, h = vary.hour;
  const hour = h === 'night' ? 'night' : (h === 'dawn' || h === 'day') ? 'dawn' : h === 'golden' ? 'dusk' : rng.pick(['dusk', 'night', 'dawn']);
  // rain and season lean with the hour so the looks separate: night pours, dawn is clearing
  const rain = rng.pick({ dusk: ['downpour', 'downpour', 'drizzle', 'clearing'], night: ['downpour', 'downpour', 'downpour', 'drizzle'], dawn: ['clearing', 'clearing', 'drizzle', 'downpour'] }[hour]);
  const season = rng.pick({ dusk: ['autumn', 'autumn', 'spring', 'winter'], night: ['autumn', 'winter', 'winter', 'spring'], dawn: ['spring', 'spring', 'autumn', 'winter'] }[hour]);
  const rival = rng.pick(['red', 'red', 'newsprint', 'walnut', 'duck']);
  const vehicle = rng.chance(0.72) ? 'tram' : 'cart';
  const density = clamp(vary.density ?? 1, 0.6, 1.4), detail = clamp(ctx.quality?.detail ?? 1, 0.4, 1);
  const H = {
    dusk: { fog: '#2A3152', fogK: 0.8, skyA: '#2A3152', skyB: '#56607A', skyK: 1.0, hemi: 1.25, lit: 0.5, lampGain: 1, exposure: 1.12, win: 1 },
    night: { fog: '#141A30', fogK: 0.7, skyA: '#141A30', skyB: '#2C3452', skyK: 0.8, hemi: 0.6, lit: 0.0, lampGain: 1.12, exposure: 1.25, win: 0.15 },
    dawn: { fog: '#66728A', fogK: 0.8, skyA: '#6B7790', skyB: '#AEB8C8', skyK: 1.0, hemi: 2.7, lit: 0.1, lampGain: 0.5, exposure: 0.98, win: 0.35 },
  }[hour];
  const R = {
    downpour: { rain: 1, crowns: 1, fogD: 0.0020, brk: 0, len: 20 },
    drizzle: { rain: 0.5, crowns: 0.45, fogD: 0.0026, brk: 0, len: 11 },
    clearing: { rain: 0.16, crowns: 0.22, fogD: 0.0015, brk: 0.6, len: 16 },
  }[rain];
  // the rain's AMOUNT (R.rain, a number) takes the name 'rain' below; the rain's WORD is kept beside it as rainWord, so that the
  // drizzle's own branches (a little more mist, a slower fall, thinner streaks) can ask for it
  return { hour, rain, season, rival, vehicle, density, detail, rare: !!vary.rare, ...H, ...R, rainWord: rain };
}

export default {
  id: 'paper-boat-rapids',
  name: 'Paper Boat Rapids',
  category: 'domestic',
  weirdness: 0.1,
  media: ['water', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, L = pickLook(ctx);
    // a thing that is new, or whose count of draws is its own affair, takes a stream made from the world's seed and its name
    const ownRng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const PAL = PALETTES[L.hour], [cNight, cViolet, cSlate, cPale, cAmber, cCream, cRed] = PAL.map((h) => new THREE.Color(h));
    const scene = new THREE.Scene();
    const fogC = colr(L.fog, L.fogK);
    scene.background = fogC.clone(); scene.fog = new THREE.FogExp2(fogC.clone(), L.fogD);
    scene.add(new THREE.HemisphereLight(cSlate, cNight, L.hemi));      // for the hero's standard solids and any ride

    // ---- the storm drain ----
    const hero = await buildHero(ctx, { palette: PAL, portalGlow: false, apron: false, lampGain: L.lampGain, mist: Math.round(60 * (L.rainWord === 'drizzle' ? 1.2 : 1)) });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    await ctx.yield();

    // ---- shared uniforms and materials ----
    const tmpV = new V3(), tmpV2 = new V3(), tmpV3 = new V3(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), ONE = new V3(1, 1, 1);
    const LAMP1_S = 262, LAMP1_D = -50;
    const lamp1Base = toWorld(LAMP1_S, LAMP1_D, Gd(LAMP1_S) + 12, new V3()), lamp1Pos = lamp1Base.clone().setY(lamp1Base.y + 376);
    const lamp1Col0 = cAmber.clone().lerp(cCream, rng.range(0, 0.18)).multiplyScalar(2.1 * L.lampGain), lamp1Col = lamp1Col0.clone();
    const tramLight = new V3(-2000, 240, 405), tramCol0 = cAmber.clone().multiplyScalar(L.vehicle === 'tram' ? 1.9 : 1.0), tramCol = tramCol0.clone();
    const LU = {
      uLP: { value: [lamp1Pos, tramLight] }, uLC: { value: [lamp1Col, tramCol] }, uLR: { value: [340, 320] },
      uSkyC: { value: desat(cSlate.clone(), 0.3).multiplyScalar(L.hemi / PI) }, uGndC: { value: desat(cNight.clone(), 0.3).multiplyScalar(L.hemi / PI * 0.6) }, uRib: { value: 1 },
      uWash: { value: cAmber.clone().multiplyScalar(0.085 * (0.45 + 0.55 * L.win) * (L.hour === 'dawn' ? 1.6 : 1)) },
    };
    const mkMat = (vs, fs, extra = {}, uni = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...LU, ...uni }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra,
    });
    const litU = (thin, floor = 0, print = 0, plain = 0) => ({ uThin: { value: thin }, uFloor: { value: floor }, uPrint: { value: print }, uPlain: { value: plain } });
    const litMat = mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true }, litU(0));
    const thinMat = mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true, side: THREE.DoubleSide }, litU(0.55));
    const boatMat = mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true, side: THREE.DoubleSide }, litU(0.4, 0.14));
    const newsMat = mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true, side: THREE.DoubleSide }, litU(0.25, 0.1, 1));
    const bootMat = mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true }, litU(0, 0.22, 0, 0.85));
    const addMesh = (g, m, order = 0, cull = false) => { const me = new THREE.Mesh(g, m); me.renderOrder = order; me.frustumCulled = cull; scene.add(me); return me; };
    const col = {
      dirt: mixc(cNight, cSlate, 0.25, 0.55), moss: colr('#3A4A44', 0.75), cobble: mixc(cSlate, cViolet, 0.3, 0.62),
      granite: mixc(cSlate, cPale, 0.38, 0.76), flag: mixc(cSlate, cViolet, 0.3, 0.52), iron: mixc(cNight, cSlate, 0.22, 0.75),
      rust: mixc(cNight, cAmber, 0.3, 0.6), steel: mixc(cSlate, cPale, 0.5, 0.7), wall: desat(mixc(cNight, cSlate, 0.45, 1.3), 0.6),
      leaf: mixc(cAmber, cPale, 0.5, 0.3), paper: cCream.clone().multiplyScalar(0.78), red: cRed.clone().multiplyScalar(0.85),
      glass: cAmber.clone(),
    };

    // ---- street surface: a strip in course coordinates, fine near the gutter ----
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    {
      const pos = [], aK = [], idx = [], P = new V3();
      const rows = []; for (let s = -80; s < S_END; s += 6) rows.push(s);
      // (repair 2) where the left kerb resumes (s 580) the street's skin used to climb to the pavement just in
      // front of the first kerb stones' end faces, a wall of stretched ground pattern. The step now lies between
      // s 581.2 and 581.8, inside those stones: what faces up the gutter there is kerb granite
      rows.push(409.5, 410.5, 579.5, 581.2, 581.8, S_END); rows.sort((a, b) => a - b);
      const rowS = (s) => (s > 580 && s < 581.5 ? 580 : s);
      const FAR = [-1500, -900, -500, -330, -240, -190, -150, -110];
      const ext = (s) => (s < 95 ? -60 : s < 300 ? -240 : s < 390 ? -190 : s <= 630 ? -1500 : -240);
      const cols = (s) => {
        const E = ext(s), e = kerbAt(s) ? 15 : wl(s), w = wr(s);
        return [...FAR, -(e + 50), -(e + 25), -(e + 13), -(e + 9.5), -(e + 5), -(e + 3), -(e + 1)].map((d) => Math.max(d, E))
          .concat([-(e - 1), -(e - 3), -e / 2, 0, w / 2, w - 3, w - 1, w + 1, w + 3, w + 5, w + 10, w + 20, w + 40, 130, 180, 260, 400, 700]);
      };
      let NC = 0;
      for (const s of rows) {
        const sg = rowS(s), cs = cols(sg); NC = cs.length;
        for (const d of cs) {
          const y = groundH(sg, d) + Gd(s) - Gd(sg); toWorld(s, d, y, P); pos.push(P.x, P.y, P.z);
          aK.push(d < -16.5 && kerbAt(sg) ? 1 : 0, y - Gd(s));
        }
      }
      for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < NC - 1; j++) { const a = i * NC + j, b = a + 1, c = a + NC, d = c + 1; idx.push(a, b, c, b, d, c); }
      const quad = (x0, x1, z0, z1, yf, pav) => {
        const n = pos.length / 3;
        for (const [x, z] of [[x0, z1], [x1, z1], [x0, z0], [x1, z0]]) { const y = yf(x, z); pos.push(x, y, z); aK.push(pav, pav ? 11.6 : 2.4); }
        idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      };
      quad(-240, -126, -126, 146, () => 11.6, 1); quad(126, 700, -126, 146, () => 2.4, 0);
      quad(-240, 36, -1700, -126, () => 11.6, 1); quad(36, 700, -1700, -126, () => 2.4, 0);
      const px = [-1500, -900, -500, -330, -270, -230, -190, -150], pz = [486, 500, 510, 520, 530, 545];
      const ph = (x, z) => Gd(toSD(x, z).s) + 11.3;
      for (let i = 0; i < px.length - 1; i++) for (let j = 0; j < pz.length - 1; j++) quad(px[i], px[i + 1], pz[j], pz[j + 1], ph, 1);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 2));
      g.setIndex(idx); g.computeVertexNormals();
      addMesh(g, mkMat(GROUND_VERT, GROUND_FRAG, {}, {
        uCob: { value: col.cobble }, uViolet: { value: cViolet }, uPale: { value: cPale }, uDirt: { value: col.dirt }, uMoss: { value: col.moss }, uFlag: { value: col.flag },
      }));
    }

    await ctx.yield();
    // ---- gutter water ----
    const WU = {
      uSurge: { value: new V3(0, 0, 30) }, uSplash: { value: new THREE.Vector4(0, 0, 0, 0) },
      uBoat: { value: [new V3(0, 0, 4), new V3(0, 0, 4), new V3(0, 0, 4)] }, uBoatD: { value: [new V3(1, 0, 1), new V3(1, 0, 1), new V3(1, 0, 1)] }, uRush: { value: 1 }, uPipe: { value: new V3(0, 0, 1) },
      uCoin: { value: new V3(672, 22, 1) }, uStrip: { value: new THREE.Vector4(-2000, 405, 0, 0) }, uStripC: { value: cAmber.clone().multiplyScalar(0.55) }, uIce: { value: L.season === 'winter' ? 1 : 0 }, uRainK: { value: 0.3 + 0.9 * L.crowns }, uWin: { value: L.win },
    };
    const flowSpeed = (s) => {
      let v = 10; v = lerp(3, v, smoothstep(40, 80, s));
      v = lerp(v, 24, smoothstep(590, 604, s) * (1 - smoothstep(640, 655, s)));
      v = lerp(v, 2.5, smoothstep(645, 660, s) * (1 - smoothstep(690, 702, s)));
      return lerp(v, 17, smoothstep(698, 708, s) * (1 - smoothstep(725, 752, s)));
    };
    {
      const pos = [], sd = [], aA = [], hd = [], idx = [], P = new V3(), NCW = 20; let nr = 0;
      for (let s = -46; ; s += (s >= 596 && s < 612 ? 1 : s >= 612 && s < 650 ? 1.25 : 2.5)) {
        if (s > S_END + 0.6) s = S_END + 0.6;
        const k = kerbAt(s), lift = (Wd(s) - Gd(s)) * 1.2, lE = k ? -15.4 : -(wl(s) + 1.3 + lift), rE = wr(s) + 1.3 + lift;
        const foam = smoothstep(596, 606, s) * (1 - smoothstep(640, 652, s)) + 0.7 * smoothstep(697, 703, s) * (1 - smoothstep(706, 718, s)), sp = flowSpeed(s);
        course(s, _c); const hx = _c.hx, hz = _c.hz;
        for (let j = 0; j <= NCW; j++) {
          const d = lerp(lE - 1.5, rE + 2.5, j / NCW); toWorld(s, d, Wd(s), P);
          pos.push(P.x, P.y, P.z); sd.push(s, d); aA.push(sp, foam, d - lE, rE - d); hd.push(hx, hz);
        }
        nr++; if (s >= S_END + 0.6) break;
      }
      for (let i = 0; i < nr - 1; i++) for (let j = 0; j < NCW; j++) { const a = i * (NCW + 1) + j, b = a + 1, c = a + NCW + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSD', new THREE.Float32BufferAttribute(sd, 2));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 4)); g.setAttribute('aHd', new THREE.Float32BufferAttribute(hd, 2)); g.setIndex(idx);
      addMesh(g, mkMat(WATER_VERT, WATER_FRAG, {}, WU), 1);
    }
    await ctx.yield();

    // ---- real cobble domes and moss cushions along the banks (the hero's lattice, continued) ----
    {
      const dg = domeGeo(), n = dg.attributes.position.count, P = 10.6, M = [], C = [], tc = new THREE.Color(), dr = rng.fork('domes');
      dg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
      dg.setAttribute('aRough', new THREE.Float32BufferAttribute(new Float32Array(n).fill(0.38), 1));
      for (let r = 26; r <= 97; r++) { if (r % 10 === 5) await ctx.yield(); for (let k = -42; k <= 26; k++) {
        const x = 12 + (r % 2) * P * 0.5 + k * P + dr.range(-0.5, 0.5), z = -122 + r * P + dr.range(-0.5, 0.5), q = toSD(x, z), s = q.s, d = q.d;
        if (s < -55 || s >= S_END + 3) continue;
        const right = d > wr(s) + 1.6 && d < wr(s) + 85, left = !kerbAt(s) && -d > wl(s) + 1.6 && -d < wl(s) + 75;
        if (!right && !left) continue;
        const inPud = pudF(x, z) > 0.66;
        const gy = groundH(s, d) - (inPud ? 2.6 : 0), sc = dr.range(9.0, 10.1);
        tc.copy(col.cobble).lerp(dr() < 0.5 ? cViolet : cPale, dr.range(0, 0.28)).multiplyScalar(dr.range(0.75, 1.15));
        M.push(trs(x, gy - 1.3, z, dr.range(-0.05, 0.05), dr.range(-0.12, 0.12), dr.range(-0.05, 0.05), sc, dr.range(3.0, 3.6), sc * dr.range(0.94, 1.04))); C.push(tc.r, tc.g, tc.b);
        if (dr.chance(0.3 * L.density * L.detail) && Math.abs(d) < 70) {       // a moss cushion in the joint beside it
          tc.copy(col.moss).multiplyScalar(dr.range(0.7, 1.2));
          M.push(trs(x + P * 0.5, gy - 0.6, z + P * 0.5, 0, dr.range(0, 6), 0, dr.range(3.5, 5.5), dr.range(1.8, 2.8), dr.range(3.5, 5.5))); C.push(tc.r, tc.g, tc.b);
        }
      } }
      await ctx.yield();
      const im = new THREE.InstancedMesh(dg, litMat, M.length);
      M.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(C), 3);
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // ---- static solids: kerb, lamp post, bicycle, downpipe, rails, wires, dandelion ----
    const S = makeAcc(), sr = rng.fork('solids');
    const at = (s, d, h, out = new V3()) => toWorld(s, d, Gd(s) + h, out);
    const rapidCobble = trs(...at(606, 10, -4).toArray(), 0.2, 0.5, 0.34, 14.5, 9, 12.5);      // the broken, tilted cobble of the rapid (a unit dome under this matrix)
    const ironC = () => col.iron.clone().lerp(col.rust, sr.range(0, 0.25)).multiplyScalar(sr.range(0.9, 1.15));
    {
      // (polish 3) wet granite: rough 2.x marks a kerb stone for the speckle, drips and glaze in LIT_FRAG; a
      // bright meniscus line lies along the face of each gutter stone at the water, moss sits in the joints
      const menC = mixc(cSlate, cPale, 0.7, 0.5 * clamp(L.hemi / 1.25, 0.55, 1.15)).lerp(cAmber, 0.12), mossR = ownRng('paper-boat-rapids:kerb-moss');
      const kerbStone = (x, z, ry, len, gy, sm = null) => {
        const M = trs(x, gy + 4.2 + sr.range(-0.25, 0.1), z, sr.range(-0.012, 0.012), ry, sr.range(-0.01, 0.01));
        S.add(chamferBox(len, 15.6, 12, 1.3), M,
          col.granite.clone().multiplyScalar(0.68 + (sr.range(0.82, 1.15) - 0.82) * 1.7), 2 + sr.range(0.4, 0.6), { shade: (px, py) => 0.7 + 0.3 * smoothstep(gy - 1, gy + 6, py) });      // (repair 2) each stone its own tone, 0.68 to 1.24 of the granite: separate stones, not one wall
        if (sm !== null && sm > -46 && (sm < 596 || sm > 652)) {
          const ang = Math.atan((Wd(sm + 1) - Wd(sm - 1)) / 2);
          S.add(new THREE.BoxGeometry(len - 3.2, 0.42, 0.3), M.clone().multiply(trs(0, Wd(sm) + 0.3 - (gy + 4.2), 6.0, 0, 0, ang)), menC, -1);
        }
      };
      const kerbRun = (s0, s1) => {
        for (let s = s0, pm = s0; s < s1 - 1;) {
          const len = Math.min(sr.range(34, 50), s1 - s), sm = s + len / 2; course(sm, _c);
          kerbStone(_c.x + _c.hz * 21.4, _c.z - _c.hx * 21.4, Math.atan2(-_c.hz, _c.hx), len - 0.9, Gd(sm), sm);
          if (s > -40 && s > s0) {
            // (repair 3) the joint between two stones: a dark wet seam set back from the faces, and moss in it (the
            // flora: 'Moss cushions in the cobble joints like dark rounded hills (desaturated slate-green #3A4A44,
            // never bright)'): each joint its own growth, from one tuft to a full seam; low hills along the arris
            // beside the joint, small round cushions down the seam (they were four near-black ovals to every
            // joint, the same at each, and read as holes in the stone). Where the street falls (the rapid) the
            // stones step down, and the seam and its moss keep to the lower of the two
            course(s, _c); const ry = Math.atan2(-_c.hz, _c.hx), lush = mossR(), nm = Math.floor(1 + lush * lush * 6.5);
            const gj = Math.min(Gd(pm), Gd(sm)), atJ = (sj, d, h) => toWorld(sj, d, gj + h, new V3());
            S.add(new THREE.BoxGeometry(1.7, 14.6, 1), trs(...atJ(s, -16.35, 4.1).toArray(), 0, ry, 0), col.granite.clone().multiplyScalar(0.6), 2.45);      // (granite like its neighbours, 2.x: it takes the water's light as they do; as plain dark matter it stood in the wall as a black slot)
            for (let k = 0; k < nm; k++) {
              const top = mossR.chance(0.4), r = top ? mossR.range(0.55, 1.1) : mossR.range(0.32, 0.72);
              const p = top ? atJ(s + mossR.range(-2.4, 2.4), -15.7 - mossR.range(0, 2.2), 11.7) : atJ(s + mossR.range(-0.45, 0.45), -15.5, mossR.range(0.5, 10.3));
              S.add(new THREE.SphereGeometry(1, 6, 3), trs(p.x, p.y, p.z, 0, ry, 0, r * (top ? 1.5 : 0.95), r * (top ? 0.5 : 1.05), r * (top ? 1.1 : 0.5)),
                col.moss.clone().multiplyScalar(mossR.range(0.85, 1.5)), 0.95);
            }
          }
          s += len; pm = sm;
        }
      };
      kerbRun(-80, 410); await ctx.yield(); kerbRun(580, S_END); await ctx.yield();
      await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
      for (const [z, g] of [[496.4, Gd(404)], [313.6, Gd(586)]]) for (let x = -27; x > -430;) { const len = sr.range(34, 50); kerbStone(x - len / 2, z, 0, len - 0.9, g); x -= len; }
      for (let z = -126; z > -700;) { const len = sr.range(32, 46); kerbStone(30, z - len / 2, PI / 2, len - 0.9, 0); z -= len; }
      // the broken, tilted cobble that makes the rapid (the space: 'a rapid over one broken, tilted cobble': one; the
      // second stone that lay awash below it is gone, and where it lay, in the lee between the two standing waves,
      // the water turns in an eddy with a foam line: the motion's 'eddies, foam lines'; WATER_FRAG)
      S.add(domeGeo(), rapidCobble, col.cobble.clone().multiplyScalar(1.1), 2.3);      // speckled wet granite dome, tilted out of its bed
      // plinth stones of the house that stands right on the kerb at the start
      for (let c = 0; c < 2; c++) for (let s = -80 - c * 22; s < 95;) {
        const len = Math.min(sr.range(40, 56), 96 - s), sm = s + len / 2; course(sm, _c);
        S.add(chamferBox(len - 0.8, 21, 7, 1.2), trs(_c.x + _c.hz * 36.5, Gd(sm) + 22.5 + c * 21.8, _c.z - _c.hx * 36.5, 0, Math.atan2(-_c.hz, _c.hx), 0),
          col.granite.clone().lerp(cViolet, 0.3).multiplyScalar(sr.range(0.7, 1.0)), sr.range(0.45, 0.65));
        s += len;
      }
    }
    await ctx.yield();
    // gas lamp at the bicycle (same proportions as the hero's)
    {
      const bx = lamp1Base.x, by = lamp1Base.y, bz = lamp1Base.z;
      const cyl = (rt, rb, h, seg, y) => S.add(new THREE.CylinderGeometry(rt, rb, h, seg, 1), trs(bx, by + y + h / 2, bz), ironC(), 0.3);
      cyl(15, 18, 10, 8, 0); cyl(11, 13, 13, 8, 10); cyl(7.6, 9.6, 40, 12, 23); cyl(4.3, 7, 283, 12, 63); cyl(9, 4.3, 10, 12, 346);
      S.add(chamferBox(46, 2.2, 2.2, 0.7), trs(bx, by + 312, bz, 0, 1.1, 0), ironC(), 0.3);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; rod(S, new V3(bx + Math.cos(a) * 9, by + 359, bz + Math.sin(a) * 9), new V3(bx + Math.cos(a) * 15.5, by + 389, bz + Math.sin(a) * 15.5), 0.8, ironC(), 0.3, 4); }
      S.add(new THREE.CylinderGeometry(14.6, 8.4, 29, 6, 1, true), trs(bx, by + 374, bz, 0, PI / 6, 0), cAmber.clone().lerp(cCream, 0.2), -2.6 * L.lampGain);
      S.add(new THREE.ConeGeometry(17.5, 14, 6, 1), trs(bx, by + 397, bz, 0, PI / 6, 0), ironC(), 0.3);
      S.add(new THREE.SphereGeometry(2.8, 8, 6), trs(bx, by + 407, bz), ironC(), 0.25);
    }
    // the bicycle: frame and rear wheel are static, the front wheel (built later) turns
    const wheelC = at(222, -5, 59), wheelAxis = new V3();
    { course(222, _c); wheelAxis.set(_c.hx, 0, _c.hz).applyAxisAngle(new V3(0, 1, 0), 0.5).applyAxisAngle(new V3(-_c.hz, 0, _c.hx), -0.26).normalize(); }
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    {
      const H = at(240, -23, 104), ST = at(292, -46, 100), BB = at(281, -44, 46), RH = at(320, -52, 47), tube = col.iron.clone().multiplyScalar(1.3);
      for (const k of [-1, 1]) rod(S, wheelC.clone().addScaledVector(wheelAxis, k * 4), H.clone().addScaledVector(wheelAxis, k * 2).setY(H.y - 14), 1.3, tube, 0.25);
      rod(S, H.clone().setY(H.y - 16), H.clone().setY(H.y + 10), 2.0, tube, 0.25);
      rod(S, H.clone().addScaledVector(wheelAxis, -24).setY(H.y + 12), H.clone().addScaledVector(wheelAxis, 24).setY(H.y + 9), 1.3, col.steel, 0.15);
      rod(S, H, ST, 1.7, tube, 0.25); rod(S, H.clone().setY(H.y - 12), BB, 1.9, tube, 0.25); rod(S, ST, BB, 1.7, tube, 0.25);
      rod(S, ST, RH, 1.0, tube, 0.25); rod(S, BB, RH, 1.1, tube, 0.25);
      rod(S, ST, ST.clone().setY(ST.y + 12), 1.5, col.steel, 0.2);
      S.add(new THREE.SphereGeometry(1, 10, 6), trs(ST.x, ST.y + 14, ST.z, 0, 0.4, 0, 13, 3, 7), col.iron.clone().multiplyScalar(0.7), 0.3);
      course(320, _c); const m = new THREE.Matrix4().lookAt(new V3(), new V3(-_c.hz, 0.12, _c.hx), new V3(0, 1, 0)).setPosition(RH);
      S.add(new THREE.TorusGeometry(35, 2.0, 6, 40), m, col.iron.clone().multiplyScalar(0.6), 0.4);
      S.add(new THREE.TorusGeometry(32.6, 0.9, 5, 40), m, col.steel, 0.15);
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; rod(S, RH, new V3(Math.cos(a) * 32, Math.sin(a) * 32, 0).applyMatrix4(m), 0.3, col.steel, 0.15, 3); }
    }
    // cast-iron downpipe on the wall of the first house, its shoe over the pool
    const pipeMouth = at(76, -20, 19), pipeLand = toWorld(80, -8.5, Wd(80), new V3());      // polish 2: 28 further down, so the spout and its whole arc are inside the first frames
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    {
      const top = at(72, -36, 620), elbow = at(72, -36, 30);
      rod(S, elbow, top, 5.5, ironC(), 0.3, 10); rod(S, elbow, pipeMouth, 5.5, ironC(), 0.3, 10, 6.2);
      S.add(new THREE.SphereGeometry(6.2, 10, 8), new THREE.Matrix4().setPosition(elbow), ironC(), 0.3);
      for (const h of [150, 320, 500]) S.add(new THREE.TorusGeometry(6.4, 1.5, 6, 14), trs(...at(72, -36, h).toArray(), PI / 2, 0, 0), ironC(), 0.3);
      // (repair 3) so that the shoe reads as a cast-iron downpipe's (the space: 'a cast-iron downpipe gushing'): its
      // mouth is hollow, a dark bore inside a rolled lip; a collar sits behind the lip; and a stay stands on the
      // kerb under the collar and carries the shoe, on a bolted foot
      const ax = pipeMouth.clone().sub(elbow).normalize(), qm = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), ax), collar = pipeMouth.clone().addScaledVector(ax, -5.5);
      const shoeRng = ownRng('paper-boat-rapids:downpipe-shoe'), shoeC = () => col.iron.clone().lerp(col.rust, shoeRng.range(0, 0.25)).multiplyScalar(shoeRng.range(0.9, 1.15));      // (the new irons' tones: their own stream)
      S.add(new THREE.TorusGeometry(6.2, 0.9, 6, 16), tmpM.compose(pipeMouth, qm, ONE), shoeC(), 0.25);
      S.add(new THREE.CircleGeometry(5.5, 16), tmpM.compose(tmpV.copy(pipeMouth).addScaledVector(ax, 0.12), qm, ONE), cNight.clone().multiplyScalar(0.25), 0.9);
      S.add(new THREE.TorusGeometry(6.3, 1.1, 6, 16), tmpM.compose(collar, qm, ONE), shoeC(), 0.3);
      const foot = toWorld(toSD(collar.x, collar.z).s, toSD(collar.x, collar.z).d, Gd(76) + 12, new V3());
      rod(S, foot, collar.clone().setY(collar.y - 5.6), 1.0, shoeC(), 0.3, 6);
      S.add(chamferBox(5, 0.9, 5, 0.3), trs(foot.x, foot.y + 0.4, foot.z, 0, 0.4, 0), shoeC(), 0.3);
      for (const k of [-1, 1]) S.add(new THREE.SphereGeometry(0.7, 6, 4), trs(foot.x + k * 1.6, foot.y + 0.9, foot.z + k * 1.1), shoeC(), 0.2);
    }
    await ctx.yield();
    // tram rails: two grooved rails out of the side street, across the gutter sheet and away down the road
    const TR1 = 1740, TRA = 200 * PI / 2;
    const tramAt = (t, o) => {            // centre line of the track at distance t; returns {x, z, hx, hz}
      if (t < TR1) { o.x = -1700 + t; o.z = 405; o.hx = 1; o.hz = 0; }
      else if (t < TR1 + TRA) { const a = (t - TR1) / 200; o.x = 40 + 200 * Math.sin(a); o.z = 205 + 200 * Math.cos(a); o.hx = Math.cos(a); o.hz = -Math.sin(a); }
      else { o.x = 240; o.z = 205 - (t - TR1 - TRA); o.hx = 0; o.hz = -1; }
      return o;
    };
    // rail head: flush with the cobbles, and awash (0.4 under the surface) where the gutter sheet crosses it
    const railY = (x, z) => { const q = toSD(x, z); return z < 146 ? 2.75 : Math.max(groundH(q.s, q.d) + 0.35, Wd(q.s) - 0.4); };
    const vehY = (x, z) => (z < 146 ? 2.75 : Gd(toSD(x, z).s) + 2.75);
    {
      const o = { x: 0, z: 0, hx: 1, hz: 0 }, dark = col.iron.clone().multiplyScalar(0.25), head = col.steel.clone().multiplyScalar(0.45), offs = [-4, -1.4, 1.4, 4], cs = [head, dark, head];
      for (const side of [-50, 50]) {
        let prev = null;
        for (let t = 900; t <= 3300; t += (t >= 1630 && t < 1742 ? 4 : 14)) {
          tramAt(t, o); const cur = offs.map((k) => { const x = o.x - o.hz * (side + k), z = o.z + o.hx * (side + k); return new V3(x, railY(x, z) - (k === -1.4 || k === 1.4 ? 0.5 : 0), z); });
          if (prev) for (let j = 0; j < 3; j++) { S.tri(prev[j], prev[j + 1], cur[j], cs[j], j === 1 ? 0.5 : 0.12); S.tri(prev[j + 1], cur[j + 1], cur[j], cs[j], j === 1 ? 0.5 : 0.12); }
          prev = cur;
        }
      }
      // the wire above the track and span wires across the street
      const wire = col.iron.clone().multiplyScalar(0.5); let pw = null;
      for (let t = 700; t <= 3300; t += 110) { tramAt(t, o); const p = new V3(o.x, 492 + 5 * Math.sin(t * 0.057), o.z); if (pw) rod(S, pw, p, 1.3, wire, 0.4, 4); pw = p; }
      for (const [ax, az, bx, bz] of [[-232, 180, 650, 200], [-232, -120, 650, -90], [-232, -520, 650, -560], [-330, 270, -360, 540], [-800, 270, -820, 540], [-236, 600, 650, 560]]) {
        const mid = new V3((ax + bx) / 2, 505, (az + bz) / 2); rod(S, new V3(ax, 560, az), mid, 1.3, wire, 0.4, 4); rod(S, mid, new V3(bx, 560, bz), 1.3, wire, 0.4, 4);
      }
    }
    // one dandelion growing from the kerb joint
    const seedHead = at(150, -14.5, 38);
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    {
      const root = at(150, -19.5, 12), midp = at(150, -18.5, 26), green = col.moss.clone().multiplyScalar(1.5);
      rod(S, root, midp, 0.55, green, 0.6, 5); rod(S, midp, seedHead, 0.45, green, 0.6, 5);
      S.add(new THREE.SphereGeometry(1.1, 8, 6), new THREE.Matrix4().setPosition(seedHead), green, 0.6);
      const dir = new V3();
      for (let i = 0; i < 46; i++) {
        dir.set(sr.gauss(), sr.gauss(), sr.gauss()).normalize();
        rod(S, seedHead, seedHead.clone().addScaledVector(dir, 4.6), 0.07, cCream.clone().multiplyScalar(0.5), -0.45, 3, 0.5);
      }
    }
    await ctx.yield();

    // ---- housefronts ----
    const FU = { uLit: { value: L.lit }, uWall: { value: col.wall }, uWinC: { value: cAmber.clone().multiplyScalar(L.hour === 'dawn' ? 0.7 : 1.0) }, uOne: { value: new V3(1, 1, 0) } };
    {
      const pos = [], uv = [], nor = [], sdv = [], idx = [], n = new V3();
      const wall = (ax, az, bx, bz, H) => {
        const len = Math.hypot(bx - ax, bz - az), seed = sr(), k = pos.length / 3;
        n.set(-(bz - az), 0, bx - ax).normalize(); const q = toSD((ax + bx) / 2 + n.x, (az + bz) / 2 + n.z), d1 = Math.abs(q.d);
        if (Math.abs(toSD((ax + bx) / 2 - n.x, (az + bz) / 2 - n.z).d) < d1) n.negate();        // face the gutter
        const ya = Gd(toSD(ax, az).s) - 4, yb = Gd(toSD(bx, bz).s) - 4;
        pos.push(ax, ya, az, bx, yb, bz, ax, ya + H, az, bx, yb + H, bz); uv.push(0, 0, len, 0, 0, H, len, H);
        for (let i = 0; i < 4; i++) { nor.push(n.x, n.y, n.z); sdv.push(seed); }
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        return seed;
      };
      const P = (s, d) => toWorld(s, d, 0, new V3()), run = (pts, hs) => pts.slice(1).map((p, i) => wall(pts[i].x, pts[i].z, p.x, p.z, hs[i % hs.length]));
      const Q = P(258, -232);
      run([P(-200, -40), P(95, -40), P(95, -232), P(180, -232), Q, new V3(-900, 0, Q.z), new V3(-1700, 0, Q.z)], [760, 760, 1000, 880, 1040, 900]);
      run([new V3(-1700, 0, 270), new V3(-800, 0, 270), new V3(-232, 0, 270), new V3(-232, 0, -230), new V3(-232, 0, -820), new V3(-232, 0, -1700)], [940, 1020, 900, 1060, 960]);
      const rs = run([P(-200, 650), P(60, 650), P(300, 650), P(345, 650), P(390, 650), new V3(650, 0, 40), new V3(650, 0, -500), new V3(650, 0, -1100), new V3(650, 0, -1700)], [900, 1040, 980, 980, 1010, 880, 1060, 940]);
      run([new V3(-232, 0, -1700), new V3(220, 0, -1700), new V3(650, 0, -1700)], [1000, 900]);
      FU.uOne.value.set(1, 1, rs[4]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(sdv, 1)); g.setIndex(idx);
      addMesh(g, mkMat(FACADE_VERT, FACADE_FRAG, { side: THREE.DoubleSide }, FU));
    }
    await ctx.yield();
    // ---- the corner shop: the light: 'Shop and house windows are soft amber panels'. One large soft panel on
    // the pavement side, its edges melted into the wall, three hanging lamps inside as soft pools of brightness;
    // nothing drawn sharp (no frame, jar, letter or awning). Its light lies across the flagstones, the rail
    // sheet and the pool as before. In deep night ('only the two lamps and one lit window') it is dark.
    const shopK = (L.hour === 'night' ? 0 : L.hour === 'dawn' ? 0.55 : 1) * L.lampGain;
    {
      const X = -229.4, py = Gd(710) + 11.6, warm = cAmber.clone().lerp(cCream, 0.14);
      // a glow laid over the wall (additive, so its edges melt into whatever the housefront shows there); now and
      // then a soft shadow crosses it, the built: 'People are only implied: lit windows, a shadow crossing a blind'
      if (shopK > 0) {
        const pm = new THREE.Mesh(new THREE.PlaneGeometry(172, 232).rotateY(PI / 2), new THREE.ShaderMaterial({
          uniforms: { uTime: HU.uTime, uC: { value: warm.clone().multiplyScalar(shopK) }, uFogD: { value: L.fogD }, uPh: { value: ownRng('paper-boat-rapids:shop-shadow')() * TAU } },      // (where the shadow is on its way across when we arrive is the seed's)
          vertexShader: /* glsl */`varying vec2 vQ; varying vec3 vW; void main(){ vQ = position.zy; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
          fragmentShader: GLSL_COMMON + /* glsl */`
            uniform vec3 uC; uniform float uFogD; uniform float uPh; varying vec2 vQ; varying vec3 vW;
            void main(){
              float fall = pbSS(86.0, 34.0, abs(vQ.x)) * pbSS(116.0, 46.0, abs(vQ.y));
              float b = 0.34 + 0.16 * pbSS(-84.0, 84.0, vQ.y);
              b += 0.6 * (exp(-(pbSq(vQ.x + 38.0) + pbSq(vQ.y - 40.0)) / 1200.0) + exp(-(pbSq(vQ.x) + pbSq(vQ.y - 40.0)) / 1200.0) + exp(-(pbSq(vQ.x - 38.0) + pbSq(vQ.y - 40.0)) / 1200.0));
              b *= 1.0 - 0.4 * pbSS(26.0, 4.0, abs(vQ.x - 70.0 * sin(uTime * 0.19 + uPh))) * pbSS(36.0, -30.0, vQ.y);
              float d = distance(cameraPosition, vW);
              gl_FragColor = vec4(uC * b * fall * fall * exp(-uFogD * uFogD * d * d), 1.0);
            }`,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
        }));
        pm.position.set(X, py + 112, 181); pm.renderOrder = 2; pm.frustumCulled = false; scene.add(pm);
      }
      S.add(new THREE.BoxGeometry(16, 4.2, 36), trs(X + 8, py + 1.1, 104), col.granite.clone().multiplyScalar(0.85), 0.45);             // the doorstep
      // (repair 2) the one sharp window of the street, as it stands in the live flight: the shop's glass with its
      // frame, mullions, transom and sill, and the jars and bottles that stand in it, seen only as shapes against
      // the light. Every other window of the street stays a soft panel; the glow above is now its halo on the
      // wall. In deep night the glass is dark. (No letters, no awning, no door glass: the window alone.)
      {
        let hs = 9173; const hr = () => { hs = (hs * 1664525 + 1013904223) >>> 0; return hs / 4294967296; };      // its own little generator: the seed's draws stay as they were
        const XG = X + 0.3, darkC = cNight.clone().multiplyScalar(0.55), frameC = col.iron.clone().multiplyScalar(0.8), glassC = cAmber.clone().lerp(cCream, 0.3);
        const bar = (y0, y1, z0, z1, depth, c, rough = 0.4, x = XG) => S.add(new THREE.BoxGeometry(depth, y1 - y0, z1 - z0), trs(x + depth / 2, (y0 + y1) / 2, (z0 + z1) / 2), c, rough);
        // the glass: three hanging lamps inside make three soft pools of brightness
        S.add(new THREE.PlaneGeometry(134, 168, 14, 10).rotateY(PI / 2), trs(XG, py + 110, 191), shopK > 0 ? (p) => {
          let b = 0.42 + 0.2 * smoothstep(-84, 84, p.y);
          for (const lz of [-44, 0, 44]) b += 0.75 * Math.exp(-((p.z - lz) ** 2 + (p.y - 42) ** 2) / 1100);
          return glassC.clone().multiplyScalar(b);
        } : darkC, shopK > 0 ? -1.55 * shopK : 0.4);
        bar(py + 22, py + 26, 120, 262, 5, frameC); bar(py + 194, py + 199, 120, 262, 4, frameC);
        for (const z of [121.5, 168.5, 213.5, 260.5]) bar(py + 24, py + 196, z - 1.6, z + 1.6, 3.5, frameC);
        bar(py + 150, py + 153, 122, 260, 2.5, frameC);
        bar(py, py + 23, 118, 264, 3, col.granite.clone().multiplyScalar(0.7), 0.5);
        await ctx.yield();
        for (const [y, n] of [[py + 26, 13], [py + 92, 10]]) {
          if (y > py + 60) bar(y - 2.5, y, 124, 258, 2, darkC, 0.6, XG + 0.4);
          for (let i = 0; i < n; i++) {
            const z = 128 + (i + 0.5) * (126 / n) + (hr() - 0.5) * 3, w = 5 + hr() * 4.5, h = 15 + hr() * 24, kind = hr();
            bar(y, y + h, z - w / 2, z + w / 2, 1.6, darkC, 0.6, XG + 0.5);
            if (kind > 0.45) bar(y + h, y + h + 4 + hr() * 6, z - w * 0.22, z + w * 0.22, 1.6, darkC, 0.6, XG + 0.5);       // a neck or a lid
          }
        }
      }
      HU.uShopP.value.set(-196, py + 112, 191); HU.uShopC.value.copy(warm).multiplyScalar(1.25 * shopK);
    }
    await ctx.yield();
    // ---- sky: a strip of slate cloud between the roofs ----
    const sky = addMesh(new THREE.SphereGeometry(3400, 24, 12), new THREE.ShaderMaterial({
      uniforms: { uTime: HU.uTime, uSkyA: { value: colr(L.skyA, L.skyK * 0.8) }, uSkyB: { value: colr(L.skyB, L.skyK * 1.15) }, uFogC: { value: fogC }, uBreak: { value: L.brk } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    }), -1);

    // ---- rain, sleet or petals in the air; crowns and rings where the drops land ----
    const wind = new V3(rng.range(-1, 1), 0, rng.range(-0.3, 0.8)).normalize().multiplyScalar(rng.range(20, 60));
    const airField = (n, vel, len, seedName) => {
      const r = rng.fork(seedName), a = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) a[i] = r();
      return addMesh(instQuad(n, { aS: { array: a, size: 4 } }), mkMat(RAIN_VERT, RAIN_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending },
        { uBox: { value: new V3(420, 300, 420) }, uVel: { value: vel }, uLen: { value: len } }), 6);
    };
    const drizzle = L.rainWord === 'drizzle', skyGlow = L.hour === 'dawn' ? 0.22 : L.hour === 'night' ? 0.1 : 0.14;
    airField(Math.round(1500 * L.rain * L.density * L.detail), new V3(wind.x, drizzle ? -190 : -310, wind.z), new V3(L.len, drizzle ? 0.32 : 0.45, skyGlow), 'rain');
    if (L.season === 'winter') airField(Math.round(520 * L.density * L.detail), new V3(wind.x * 0.6, -85, wind.z * 0.6), new V3(2.4, 1.1, 0.5), 'sleet');
    if (L.season === 'spring') airField(Math.round(240 * L.density * L.detail), new V3(wind.x * 0.5, -32, wind.z * 0.5), new V3(2.2, 1.5, 0.55), 'petals');
    const crownU = { uCamS: { value: 0 } };
    {
      const n = Math.max(60, Math.round(600 * L.crowns * L.density * L.detail)), r = rng.fork('crowns'), a = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) a[i] = r();
      const g = new THREE.InstancedBufferGeometry(), q = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
      g.setAttribute('position', new THREE.Float32BufferAttribute([...q, ...q], 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1], 1));
      g.setIndex([0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7]); g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
      addMesh(g, mkMat(CROWN_VERT, CROWN_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }, crownU), 5);
    }
    // (repair 2) a leaf's own colours: its edge paler and brighter where the water meets it (the styleNote: 'water
    // bulges with visible surface tension where it meets paper, kerb and leaf'), not where a lobe's tip has
    // curled up out of it. The leaf's geometry says how far out a vertex lies (uv.x) and how curled (uv.y).
    const leafCol = (geo, base) => {
      const uv = geo.attributes.uv, pa = geo.attributes.position, sp = [], c = new THREE.Color(), rimC = base.clone().multiply(new THREE.Color(1.7, 1.8, 2.1));
      for (let i = 0; i < pa.count; i++) if (uv.getX(i) > 0.99) sp.push([Math.atan2(-pa.getZ(i), pa.getX(i)), Math.hypot(pa.getX(i), pa.getZ(i)), uv.getY(i)]);
      return (p) => {
        const a = Math.atan2(-p.z, p.x), r = Math.hypot(p.x, p.z); let best = sp[0], bd = 9;
        for (const q of sp) { let d = Math.abs(q[0] - a); if (d > PI) d = TAU - d; if (d < bd) { bd = d; best = q; } }
        return c.copy(base).lerp(rimC, r > 0.9 * best[1] ? 0.8 * (1 - best[2]) : 0);
      };
    };
    // ---- things carried by the current: plane leaves and conkers, blossom petals, or a few winter leaves ----
    {
      const fr = rng.fork('floaters'), B = makeAcc(), spring = L.season === 'spring';
      if (spring) B.add(new THREE.CircleGeometry(1, 9).rotateX(-PI / 2).scale(1, 1, 0.62), null, cCream.clone().lerp(cPale, 0.25).multiplyScalar(0.7), 0.5);
      else { const lg = leafGeo(ownRng('paper-boat-rapids:floating-leaf-shape'), 30); B.add(lg, null, leafCol(lg, col.leaf.clone().multiplyScalar(1.2)), 10.42); }
      const base = B.build(), n = Math.round((spring ? 120 : L.season === 'autumn' ? 38 : 12) * L.density * L.detail), a = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { a[i * 4] = fr(); a[i * 4 + 1] = fr.range(-1, 1); a[i * 4 + 2] = spring ? fr.range(1.3, 2.4) : fr.range(5, 10); a[i * 4 + 3] = fr(); }
      const g = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'normal', 'color', 'aRough']) g.setAttribute(k, base.attributes[k]);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
      addMesh(g, mkMat(FLOAT_VERT, LIT_FRAG, { vertexColors: true, side: THREE.DoubleSide }, { ...litU(0.5), uFlow: { value: 9 } }), 2);
    }
    await ctx.yield();

    // ---- boats and other craft (local +x = bow) ----
    const dyn = (acc, mat = litMat) => addMesh(acc.build(), mat, 0, true);
    // A folded paper boat. Keel at local y = -0.6; it floats with the waterline at y = +0.6, so the
    // lower hull is under water and the band up to DAMP is darkened, soaked paper.
    const paperBoat = (paper, peak, pennant) => {
      // (repair 2) folded paper, not a cut stone: each side of the hull is one sheet, gently bowed and smoothly
      // shaded from stem to stern, of one colour; the folds (the crease amidships, the two where the ends were
      // turned in, the brim along the gunwale, the stern's and the stem's fold), the paper's grain and the
      // soaked band with its creeping edge are drawn on it by the material (aRough 4.x = hull paper, 6.x = sail
      // and floor paper)
      const B = makeAcc(), v = (x, y, z) => new V3(x, y, z), DAMP = 1.3;
      const deck = paper.clone().multiplyScalar(0.5);
      const T = (a, b, c, col, r = 4.6) => B.tri(a, b, c, col, r), Q = (a, b, c, d, col, r) => { T(a, b, c, col, r); T(a, c, d, col, r); };
      const NX = 16, NV = 3, keelAt = (x, sg, o) => { const xk = clamp(x * 3.5 / 3.2, -3.5, 3.5); return o.set(xk, -0.6, (0.85 + 0.2 * (1 - (xk / 3.5) ** 2)) * sg); };
      const gunAt = (x, sg, o) => o.set(x, 2.45 + 0.027 * x * x, 2.6 * (1 - Math.pow(Math.abs(x) / 6.2, 1.7)) * sg);
      const rows = [1, -1].map((sg) => {
        const P = [], idx = [], k = v(0, 0, 0), g = v(0, 0, 0);
        for (let i = 0; i <= NX; i++) { const x = -6.2 + 12.4 * i / NX; keelAt(x, sg, k); gunAt(x, sg, g); for (let j = 0; j <= NV; j++) P.push(lerp(k.x, g.x, j / NV), lerp(k.y, g.y, j / NV), lerp(k.z, g.z, j / NV)); }
        for (let i = 0; i < NX; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; if (sg > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
        const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sgeo.setIndex(idx); sgeo.computeVertexNormals();
        B.add(sgeo, null, paper, 4.6);
        const l = v(0, DAMP + 0.25, 1.5 * sg), ap = v(0, 6.3, 0);
        T(ap, v(2.6, DAMP, 0), l, peak, 6.6); T(ap, l, v(-2.6, DAMP, 0), peak, 6.6);
        const K = [-6.2, 6.2].map((x) => keelAt(x, sg, v(0, 0, 0))), G = [-6.2, 6.2].map((x) => gunAt(x, sg, v(0, 0, 0)));
        const D = K.map((q, i) => q.clone().lerp(G[i], (DAMP - q.y) / (G[i].y - q.y)));
        return { K, G, D };
      });
      const [a, b] = rows;
      for (const i of [0, 1]) { Q(a.K[i], b.K[i], b.D[i], a.D[i], paper); T(a.D[i], b.D[i], a.G[i], paper); }   // stern and stem: the narrow folded end between the two sheets
      Q(a.D[0], a.D[1], b.D[1], b.D[0], deck, 6.5);                                  // the wet floor inside
      if (pennant) { rod(B, v(0, 6.2, 0), v(0, 8.6, 0), 0.1, cCream.clone().multiplyScalar(0.5), 0.6, 4); T(v(0, 8.5, 0), v(0, 7.4, 0), v(-2.1, 7.95, 0.35), pennant, -0.55); }
      return B;
    };
    const cream = dyn(paperBoat(col.paper, col.paper.clone().multiplyScalar(1.1), null), boatMat);
    cream.name = 'cream-boat';
    await ctx.yield();
    let rival;
    if (L.rival === 'walnut') {
      const B = makeAcc(), shell = mixc(col.rust, cPale, 0.25, 0.9);
      B.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, PI / 2, PI / 2), trs(0, 2.2, 0, 0, 0, 0, 5.6, 2.9, 3.7), (p) => shell.clone().multiplyScalar(0.7 + 0.3 * Math.sin(p.x * 9) * Math.sin(p.z * 7 + p.y * 5)), 0.35);
      rod(B, new V3(0, 0, 0), new V3(0.3, 8.5, 0), 0.22, cCream.clone().multiplyScalar(0.6), 0.6, 5);
      B.add(new THREE.SphereGeometry(0.5, 6, 5), trs(0.3, 8.6, 0), col.red, 0.4);
      B.tri(new V3(0.3, 7.6, 0), new V3(0.3, 2.6, 0), new V3(-3.4, 3.2, 0.9), col.red, 0.6);
      rival = dyn(B, thinMat);
    } else if (L.rival === 'duck') {
      const B = makeAcc();
      B.add(new THREE.SphereGeometry(1, 14, 10), trs(0, 1.6, 0, 0, 0, 0, 5.2, 2.6, 3.2), col.red, 0.18);
      B.add(new THREE.SphereGeometry(1, 12, 8), trs(3.4, 5.0, 0, 0, 0, 0, 2.1, 2.0, 1.9), col.red, 0.18);
      B.add(new THREE.ConeGeometry(0.9, 2.2, 8), trs(5.6, 4.7, 0, 0, 0, -PI / 2, 1, 1, 1.4), cAmber.clone().multiplyScalar(0.6), 0.25);
      B.add(new THREE.ConeGeometry(1.5, 3.2, 8), trs(-4.9, 3.3, 0, 0, 0, 0.9), col.red.clone().multiplyScalar(0.8), 0.2);
      for (const sgn of [1, -1]) B.add(new THREE.SphereGeometry(0.42, 6, 5), trs(4.5, 5.6, 1.25 * sgn), cNight, 0.1);
      rival = dyn(B);
    } else {
      const news = L.rival === 'newsprint', grey = mixc(cCream, cPale, 0.45, 0.7);
      rival = dyn(news ? paperBoat(grey, grey.clone().multiplyScalar(1.08), cRed) : paperBoat(col.red, col.red.clone().multiplyScalar(1.12), null), news ? newsMat : boatMat);
    }
    rival.name = 'rival-boat';
    await ctx.yield();
    // matchbox barge, wine cork, bottle cap, horse chestnut
    const barge = (() => {
      const B = makeAcc();
      B.add(chamferBox(5.4, 1.7, 3.7, 0.2), trs(0, 0.7, 0), mixc(cViolet, cSlate, 0.5, 0.8), 0.5);
      B.add(chamferBox(4.6, 1.2, 3.3, 0.15), trs(1.6, 0.75, 0), cCream.clone().multiplyScalar(0.5), 0.6);
      for (let i = 0; i < 3; i++) { rod(B, new V3(-1.2, 1.75, -1 + i), new V3(3.6, 1.75 + 0.12 * i, -1.1 + i * 1.05), 0.2, cCream.clone().multiplyScalar(0.55), 0.6, 4); B.add(new THREE.SphereGeometry(0.34, 6, 5), trs(3.7, 1.8 + 0.12 * i, -1.1 + i * 1.05), col.rust, 0.5); }
      return dyn(B);
    })();
    const cork = (() => {
      const B = makeAcc(), cc = mixc(cAmber, cPale, 0.45, 0.42);
      B.add(new THREE.CylinderGeometry(1.25, 1.15, 4.5, 14, 3), trs(0, 0, 0, PI / 2, 0, 0), (p) => cc.clone().multiplyScalar(0.75 + 0.35 * noise.n3(p.x * 2, p.y * 2, p.z * 2) + (Math.atan2(p.z, p.x) > 2 ? -0.25 : 0)), 0.75);
      return dyn(B);
    })();
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    const cap = (() => {
      const B = makeAcc(), g = new THREE.CylinderGeometry(2.7, 3.0, 0.7, 21, 1), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), r = Math.hypot(p.getX(i), p.getZ(i)); if (r > 0.1 && p.getY(i) < 0) { const k = 1 + 0.06 * Math.cos(a * 21); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
      g.computeVertexNormals();
      B.add(g, null, col.steel, 0.14); B.add(new THREE.CylinderGeometry(1.7, 1.7, 0.74, 16), null, col.red.clone().lerp(col.iron, 0.75), 0.25);
      return dyn(B);
    })();
    const conker = (() => {
      const B = makeAcc(), cc = mixc(col.rust, cNight, 0.3, 1.1);
      B.add(new THREE.SphereGeometry(2, 14, 10), null, (p) => (p.y > 1.45 ? cPale.clone().multiplyScalar(0.5) : cc), 0.12);
      return dyn(B);
    })();
    await ctx.yield();
    // the bicycle's front wheel, turning slowly in the rain
    const wheel = (() => {
      const B = makeAcc(), o = new V3(0, 0, 0);
      B.add(new THREE.TorusGeometry(35, 2.0, 6, 44), null, col.iron.clone().multiplyScalar(0.6), 0.4);
      B.add(new THREE.TorusGeometry(32.6, 0.9, 5, 44), null, col.steel, 0.14);
      B.add(new THREE.CylinderGeometry(2.4, 2.4, 9, 8), trs(0, 0, 0, PI / 2, 0, 0), col.steel, 0.2);
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; rod(B, o.clone().setZ(i % 2 ? 3 : -3), new V3(Math.cos(a) * 32, Math.sin(a) * 32, 0), 0.3, col.steel, 0.12, 3); }
      B.add(chamferBox(5, 2.2, 1.2, 0.3), trs(22, 0, 0), cAmber, -0.9);          // spoke reflector
      const m = dyn(B); m.position.copy(wheelC); return m;
    })();
    const wheelQ = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), wheelAxis);

    // water beads: wheel drips, the downpipe's spatter, fat drops landing round the boats, splash
    const NBEAD = 44, beads = (() => {
      const g = new THREE.SphereGeometry(1, 10, 7), n = g.attributes.position.count, c = mixc(cPale, cSlate, 0.4, 0.5);
      const ca = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.Float32BufferAttribute(ca, 3)); g.setAttribute('aRough', new THREE.Float32BufferAttribute(new Float32Array(n).fill(8.05), 1));
      // the styleNote: 'raindrops are spheres big enough to see': shaded as glossy balls (a dark body, the sky on
      // the rim, a lamp's point of amber), not flat discs
      const im = new THREE.InstancedMesh(g, mkMat(LIT_VERT, LIT_FRAG, { vertexColors: true }, litU(0, 0.3, 0, 1)), NBEAD); im.frustumCulled = false; scene.add(im); return im;
    })();
    const setBead = (i, x, y, z, r, stretch = 1) => { tmpM.makeScale(r, r * stretch, r).setPosition(x, y, z); beads.setMatrixAt(i, tmpM); };

    await ctx.yield();
    // bokeh discs: 0 headlight, 1 wire spark, 2-5 and 30-37 falling sparks, 6-17 dandelion seeds, 18-29 fixed lamps
    const NBOK = 40, bokPos = new Float32Array(NBOK * 3), bokCol = new Float32Array(NBOK * 4);
    const setBok = (i, p, c, k, size) => { bokPos[i * 3] = p.x; bokPos[i * 3 + 1] = p.y; bokPos[i * 3 + 2] = p.z; bokCol[i * 4] = c.r * k; bokCol[i * 4 + 1] = c.g * k; bokCol[i * 4 + 2] = c.b * k; bokCol[i * 4 + 3] = size; };
    const lampGlow = cAmber.clone().lerp(cCream, 0.15);
    {
      let i = 18; const g = L.lampGain;
      setBok(i++, lamp1Pos, lampGlow, 1.5 * g, 46); setBok(i++, A.lampHead, lampGlow, 1.6 * g, 54);
      if (L.hour !== 'night') for (const [x, y, z] of [[-90, 400, -560], [-90, 400, -1050], [-90, 400, -1540], [590, 392, 330], [590, 388, -250], [590, 388, -820], [590, 388, -1400], [-600, 396, 505], [-1150, 396, 505], [470, 410, 760]])
        setBok(i++, tmpV.set(x, y, z), lampGlow, 1.25 * g, 60);
    }
    const bokGeo = instQuad(NBOK, { aPos: { array: bokPos, size: 3 }, aCol: { array: bokCol, size: 4 } });
    addMesh(bokGeo, new THREE.ShaderMaterial({ vertexShader: BOKEH_VERT, fragmentShader: BOKEH_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), 7);

    // the downpipe's column of water
    {
      const mid = pipeMouth.clone().lerp(pipeLand, 0.5); mid.y = pipeMouth.y - 7.5; mid.x = lerp(pipeMouth.x, pipeLand.x, 0.72); mid.z = lerp(pipeMouth.z, pipeLand.z, 0.72);
      // (repair 3) water leaving a pipe: it comes off the floor of the bore as a wide flat tongue, gathers into a
      // rope as it falls and frays just above the pool (it was one even rod from the middle of the mouth)
      const cv = new THREE.QuadraticBezierCurve3(pipeMouth.clone().setY(pipeMouth.y - 3.4), mid, pipeLand.clone().setY(pipeLand.y - 1));
      const tg = new THREE.TubeGeometry(cv, 14, 1.5, 10, false), tp = tg.attributes.position, cp = new V3();
      for (let i = 0; i <= 14; i++) {
        cv.getPointAt(i / 14, cp);
        const t = i / 14, wide = lerp(2.3, 0.95, smoothstep(0, 0.4, t)) * lerp(1, 1.3, smoothstep(0.75, 1, t)), flat = lerp(0.42, 1, smoothstep(0, 0.4, t));
        for (let j = 0; j <= 10; j++) { const k = i * 11 + j; tp.setXYZ(k, cp.x + (tp.getX(k) - cp.x) * wide, cp.y + (tp.getY(k) - cp.y) * wide * flat, cp.z + (tp.getZ(k) - cp.z) * wide); }
      }
      addMesh(tg, mkMat(COL_VERT, COL_FRAG, { transparent: true, depthWrite: false }), 3, true);
      WU.uPipe.value.set(pipeLand.x, pipeLand.z, 1);
    }

    await ctx.yield();
    // ---- the vehicle that crosses the gutter: a tram of three cars, or a horse and dray ----
    const cars = [], fanSpots = [];            // cars: { obj, off, half, spin: [meshes], legs: [meshes] }; fanSpots: { car, x, z }
    let vehLen = 690, headH = 95, poleCar = 1, tramWheels = null;
    const whQ = new THREE.Quaternion(), whQ2 = new THREE.Quaternion(), whS = new V3(1, 1, 1), YAX = new V3(0, 1, 0);
    if (L.vehicle === 'tram') {
      const B = makeAcc(), body = mixc(cSlate, cPale, 0.35, 0.9), dark = col.iron.clone().multiplyScalar(1.1), win = cAmber.clone().lerp(cCream, 0.12);
      // an open underframe (it was one solid slab from wheel to wheel): two sole bars and a spine under the floor,
      // spring pedestals down to each truck, and between them the lit street and the far wheels' fans show
      // through under the car, so that from the gutter the giant is wheels and daylight, not a dark lid
      for (const z of [-46, 0, 46]) B.add(chamferBox(204, 6, z ? 7 : 12, 1.5), trs(0, 54, z), dark, 0.5);
      for (const x of [-96, -28, 28, 96]) for (const z of [-46, 46]) B.add(chamferBox(7, 17, 7, 1.5), trs(x, 43.5, z), dark, 0.45);
      // (polish 3) a low panelled skirt, a tall window band: the car reads as a tram from the gutter
      B.add(chamferBox(220, 68, 150, 7), trs(0, 91, 0), body, 0.3);
      B.add(chamferBox(221, 8, 151, 2), trs(0, 123, 0), cCream.clone().multiplyScalar(0.6), 0.25);                      // the cream waist rail under the sills
      B.add(chamferBox(221.4, 4, 151.4, 1.4), trs(0, 59.5, 0), mixc(cPale, cAmber, 0.45, 1.25), 0.1);                   // the wet lower rim catching the lamps (repair 2: 4 deep, it was 2.4: from up the gutter it was a line one pixel thin that crawled)
      for (let x = -99; x <= 99; x += 22) for (const z of [-75.3, 75.3]) B.add(new THREE.BoxGeometry(1.1, 50, 0.9), trs(x, 92, z), dark.clone().multiplyScalar(0.7), 0.5);   // panel joints
      for (const z of [-75.4, 75.4]) { B.add(new THREE.BoxGeometry(206, 1.6, 1), trs(0, 110, z), cCream.clone().multiplyScalar(0.42), 0.2); B.add(new THREE.BoxGeometry(150, 12, 1), trs(0, 96, z), mixc(cSlate, cNight, 0.5, 0.8), 0.35); }   // coach line, name board
      // people only implied (the owner's amendment): flat, unlit dark shapes lying on the inside of the lit
      // glass, no face, no limb, no gesture
      for (const z of [-73.1, 73.1]) for (const [x, hgt] of [[-88, 52], [-58, 58], [-20, 49], [12, 56], [50, 51], [84, 57]]) {
        // (round 2: the same two flat shapes as flat discs facing out of the car; they were spheres pressed flat, 160 triangles a head)
        B.add(new THREE.CircleGeometry(8.5, 12), trs(x, 130 + hgt, z + 0.25 * Math.sign(z), 0, z < 0 ? PI : 0, 0, 1, 1.15, 1), cNight.clone().multiplyScalar(0.5), -1);
        B.add(new THREE.CircleGeometry(15, 12), trs(x, 130 + hgt - 22, z + 0.2 * Math.sign(z), 0, z < 0 ? PI : 0, 0, 1, 1, 1), cNight.clone().multiplyScalar(0.5), -1);
      }
      for (let x = -90; x <= 90; x += 36) for (const z of [-75.8, 75.8]) B.add(new THREE.BoxGeometry(16, 5, 1.6), trs(x, 74, z), win, -1.3);      // running lights low on the skirt
      for (const x of [-110.6, 110.6]) B.add(new THREE.BoxGeometry(1.6, 9, 60), trs(x, 108, 0), win, -1.4);                                   // the lit number board at each end
      await ctx.yield();
      B.add(new THREE.BoxGeometry(215, 134, 146), trs(0, 193, 0), win, -1.7);
      for (let x = -108; x <= 108; x += 36) for (const z of [-74.5, 74.5]) B.add(new THREE.BoxGeometry(7, 136, 4), trs(x, 193, z), body, 0.3);
      for (const x of [-109, 109]) for (const z of [-50, 0, 50]) B.add(new THREE.BoxGeometry(4, 136, 9), trs(x, 193, z), body, 0.3);
      for (const z of [-74.6, 74.6]) B.add(new THREE.BoxGeometry(216, 4, 3), trs(0, 232, z), body, 0.3);                // the transom under the top lights
      B.add(chamferBox(222, 28, 152, 5), trs(0, 273, 0), body, 0.3);
      B.add(chamferBox(212, 16, 132, 6), trs(0, 294, 0), dark, 0.4); B.add(chamferBox(160, 12, 70, 4), trs(0, 307, 0), dark, 0.4);
      // (repair 2) the truck frame lies between its wheels (it used to reach out past them, a dark bar across each
      // wheel's face); the wheels themselves are one turning wheel drawn twelve times (below): rim, spokes, hub
      for (const x of [-62, 62]) {
        B.add(chamferBox(86, 12, 74, 2), trs(x, 30, 0), dark, 0.4);
        B.add(new THREE.CylinderGeometry(3.2, 3.2, 104, 8), trs(x, 26, 0, PI / 2, 0, 0), dark, 0.3);
        for (const z of [-50, 50]) fanSpots.push({ x, z });
      }
      for (const x of [-112, 112]) B.add(new THREE.SphereGeometry(7, 10, 8), trs(x, 95, 0), cAmber.clone().lerp(cCream, 0.15), -3);      // amber end lamps (the light: 'Two colours only: slate and amber')
      rod(B, new V3(-10, 312, 0), new V3(-86, 486, 0), 1.8, dark, 0.3, 5); rod(B, new V3(-86, 486, -9), new V3(-86, 486, 9), 2.2, dark, 0.3, 5);
      const g = B.build(), spots = fanSpots.splice(0);
      for (let i = 0; i < 3; i++) { const obj = new THREE.Mesh(g, litMat); obj.frustumCulled = false; scene.add(obj); cars.push({ obj, off: 110 + i * 230, half: 62, spin: [], legs: [] }); for (const sp of spots) fanSpots.push({ car: i, x: sp.x, z: sp.z }); }
      // (repair 2) a tram wheel that reads as a wheel from the gutter: a round steel rim with its wet bright tyre
      // and flanges, eight spokes, a hub with a boss; one wheel, drawn at each of the twelve places and turning
      // with the car's run (the place and the turn are set each frame beside its fan)
      {
        const W = makeAcc(), steel = col.steel.clone().multiplyScalar(0.75), tyre = mixc(col.steel, cPale, 0.5, 1.2);
        // (round 2: the same wheel in a third of the triangles: still 28 round, since it fills half the frame as it crosses, but five-sided rim, three-sided flanges, six-sided spokes)
        W.add(new THREE.TorusGeometry(22.6, 3.3, 5, 28), trs(0, 0, 0, 0, 0, 0, 1, 1, 1.25), steel, 0.2);
        W.add(new THREE.CylinderGeometry(26, 26, 9, 28, 1, true), trs(0, 0, 0, PI / 2, 0, 0), tyre, 0.12);
        for (const k of [-4.6, 4.6]) W.add(new THREE.TorusGeometry(25.2, 1.5, 3, 28), trs(0, 0, k), tyre, 0.1);      // the wet tyre catches the lamps
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; W.add(new THREE.CylinderGeometry(1.7, 2.3, 15, 6, 1, true), trs(-Math.sin(a) * 13.2, Math.cos(a) * 13.2, 0, 0, 0, a), steel, 0.25); }
        W.add(new THREE.CylinderGeometry(7, 7, 12, 10), trs(0, 0, 0, PI / 2, 0, 0), dark, 0.3);
        for (const k of [-6, 6]) W.add(new THREE.SphereGeometry(3.6, 7, 4), trs(0, 0, k, 0, 0, 0, 1, 1, 0.5), tyre, 0.15);
        tramWheels = new THREE.InstancedMesh(W.build(), litMat, fanSpots.length); tramWheels.frustumCulled = false; scene.add(tramWheels);
      }
      await ctx.yield();
      // the lit windows lie on the wet road beside each car (this is what stands the tram on the street)
      const rg = new THREE.PlaneGeometry(250, 520, 1, 1).rotateX(-PI / 2), rm = new THREE.ShaderMaterial({
        uniforms: { uTime: HU.uTime, uC: { value: win.clone().multiplyScalar(0.55 * (0.5 + 0.5 * L.win) + 0.25) } },
        vertexShader: /* glsl */`varying vec2 vQ; varying vec3 vW; void main(){ vQ = position.xz; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: GLSL_COMMON + /* glsl */`
          uniform vec3 uC; varying vec2 vQ; varying vec3 vW;
          void main(){
            float az = abs(vQ.y), out1 = max(az - 70.0, 0.0);
            float g = exp(-out1 * 0.012) * pbSS(60.0, 80.0, az) * pbSS(125.0, 96.0, abs(vQ.x));
            g *= 0.55 + 0.45 * sin(vQ.x * 0.1745 + 1.5708);                                    // one bar of light per window
            g *= 0.35 + 0.65 * pbSS(0.25, 0.75, pbFbm(vW.xz * 0.11 + vec2(0.0, uTime * 0.15))); // broken by the wet cobbles
            g += 0.5 * exp(-out1 * 0.05) * pbSS(60.0, 76.0, az) * pbSS(118.0, 100.0, abs(vQ.x));
            g *= 1.0 - pbSS(-50.0, -44.0, vW.x) * pbSS(19.0, 14.0, vW.x);                             // the gutter's water carries the strip itself (WATER_FRAG)
            gl_FragColor = vec4(uC * g * pbSS(260.0, 180.0, az), 1.0);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      });
      for (const car of cars) { const m = new THREE.Mesh(rg, rm); m.position.y = 1.2; m.renderOrder = 2; m.frustumCulled = false; car.obj.add(m); }
    } else {
      vehLen = 520; headH = 150; poleCar = -1;
      const wood = mixc(col.rust, cSlate, 0.4, 0.8), dark = col.iron.clone().multiplyScalar(0.5), B = makeAcc(), W = makeAcc();
      B.add(chamferBox(290, 14, 124, 3), trs(0, 100, 0), wood, 0.6);
      for (const z of [-62, 62]) B.add(chamferBox(290, 34, 6, 2), trs(0, 122, z), wood.clone().multiplyScalar(0.8), 0.6);
      for (const x of [-95, 95]) rod(B, new V3(x, 48, -66), new V3(x, 48, 66), 5, dark, 0.3, 8);
      for (let i = 0; i < 4; i++) B.add(new THREE.CylinderGeometry(34, 34, 92, 14), trs(-90 + i * 62, 153, (i % 2 ? 1 : -1) * 6, 0, 0, 0), wood.clone().multiplyScalar(0.6 + 0.12 * i), 0.5);
      for (const z of [-40, 40]) rod(B, new V3(140, 100, z), new V3(330, 120, z), 3.5, wood, 0.5, 6);
      B.add(new THREE.SphereGeometry(9, 10, 8), trs(150, 150, 66), cAmber, -3.2); rod(B, new V3(145, 107, 62), new V3(150, 142, 66), 1.5, dark, 0.3, 4);
      W.add(new THREE.TorusGeometry(46, 3.2, 6, 30), null, col.steel.clone().multiplyScalar(0.7), 0.2);
      W.add(new THREE.CylinderGeometry(8, 8, 12, 10), trs(0, 0, 0, PI / 2, 0, 0), dark, 0.4);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; rod(W, new V3(0, 0, 0), new V3(Math.cos(a) * 45, Math.sin(a) * 45, 0), 2.2, wood, 0.5, 5, 1.6); }
      const cart = new THREE.Group(), wg = W.build(), bm = new THREE.Mesh(B.build(), litMat), spin = [];
      bm.frustumCulled = false; cart.add(bm);
      for (const x of [-95, 95]) for (const z of [-66, 66]) { const m = new THREE.Mesh(wg, litMat); m.position.set(x, 48, z); m.frustumCulled = false; cart.add(m); spin.push(m); fanSpots.push({ car: 1, x, z }); }
      // the horse: body, neck and head as one piece, four legs that walk
      const Hh = makeAcc(), hc = mixc(col.rust, cNight, 0.35, 0.9), Lg = makeAcc();
      Hh.add(new THREE.SphereGeometry(1, 14, 10), trs(0, 165, 0, 0, 0, 0, 78, 44, 38), hc, 0.5);
      rod(Hh, new V3(55, 180, 0), new V3(100, 250, 0), 26, hc, 0.5, 8, 17); Hh.add(new THREE.SphereGeometry(1, 10, 8), trs(118, 262, 0, 0, 0, -0.5, 32, 17, 15), hc, 0.5);
      rod(Hh, new V3(-74, 180, 0), new V3(-96, 110, 0), 5, cNight, 0.6, 5, 2);
      rod(Lg, new V3(0, 0, 0), new V3(4, -66, 0), 12, hc, 0.5, 6, 8); rod(Lg, new V3(4, -66, 0), new V3(0, -128, 0), 8, hc, 0.5, 6, 7);
      Lg.add(new THREE.CylinderGeometry(9, 12, 14, 8), trs(1, -133, 0), cNight, 0.3);
      const horse = new THREE.Group(), hm = new THREE.Mesh(Hh.build(), litMat), lg = Lg.build(), legs = [];
      hm.frustumCulled = false; horse.add(hm);
      for (const x of [-50, 50]) for (const z of [-20, 20]) { const m = new THREE.Mesh(lg, litMat); m.position.set(x, 140, z); m.frustumCulled = false; horse.add(m); legs.push(m); fanSpots.push({ car: 0, x, z }); }
      scene.add(horse, cart);
      cars.push({ obj: horse, off: 110, half: 50, spin: [], legs }, { obj: cart, off: 370, half: 95, spin, legs: [] });
    }
    await ctx.yield();
    // thrown water: a fan per wheel (or hoof), twelve for the boot's splash crown, two for the boats' slap in the rapid
    const NFAN = fanSpots.length + 14, fanF = new Float32Array(NFAN * 2), fans = (() => {
      const g = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
      g.setAttribute('aF', new THREE.InstancedBufferAttribute(fanF, 2));
      const im = new THREE.InstancedMesh(g, mkMat(FAN_VERT, FAN_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), NFAN);
      im.frustumCulled = false; im.renderOrder = 4; scene.add(im); return im;
    })();
    for (let i = 0; i < fanSpots.length + 12; i++) fanF[i * 2] = rng() + (i >= fanSpots.length ? 2 : 0);      // the wheels' fans and the boot's crown; 2+ marks the boot's soft splash crown
    { const slapRng = ownRng('paper-boat-rapids:slap-fans'); for (let i = fanSpots.length + 12; i < NFAN; i++) fanF[i * 2] = slapRng(); }      // the two fans of the boats' slap: phases from their own stream

    await ctx.yield();
    // ---- creatures ----
    const snail = (() => {
      const g = new THREE.Group(), B = makeAcc(), H = makeAcc(), flesh = mixc(cSlate, cPale, 0.5, 0.75), shell = mixc(col.rust, cAmber, 0.25, 0.9);
      B.add(new THREE.SphereGeometry(1, 12, 8), trs(0, 0.7, 0, 0, 0, 0, 4.6, 1.0, 1.5), flesh, 0.15);
      B.add(new THREE.SphereGeometry(1, 10, 8), trs(3.6, 1.3, 0, 0, 0, 0.5, 1.6, 1.0, 1.0), flesh, 0.15);
      B.add(new THREE.SphereGeometry(2.6, 14, 10), trs(-0.6, 3.0, 0, 0, 0, 0, 1, 1, 0.72), (p) => shell.clone().multiplyScalar(0.7 + 0.4 * Math.sin(Math.hypot(p.x, p.y) * 5)), 0.2);
      rod(H, new V3(0, 0, 0), new V3(0, 3.0, 0), 0.26, flesh, 0.2, 5, 0.18); H.add(new THREE.SphereGeometry(0.36, 6, 5), trs(0, 3.1, 0), cNight, 0.15);
      g.add(new THREE.Mesh(B.build(), litMat)); const hg = H.build(), horns = [];
      for (const z of [-0.5, 0.5]) { const h = new THREE.Mesh(hg, litMat); h.position.set(4.4, 1.9, z); h.rotation.set(z * 0.9, 0, -0.45); g.add(h); horns.push(h); }
      course(282, _c); at(282, -18, 12, g.position); g.rotation.y = Math.atan2(-_c.hz, _c.hx); scene.add(g);
      return { g, horns };
    })();
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    const sparrow = (() => {
      const g = new THREE.Group(), B = makeAcc(), Wg = makeAcc(), brown = mixc(col.rust, cSlate, 0.35, 1.1), pale = mixc(cPale, cCream, 0.3, 0.6);
      B.add(new THREE.SphereGeometry(1, 12, 9), trs(0, 0, 0, 0, 0, 0.25, 7.2, 4.6, 4.6), (p) => (p.y < -0.25 ? pale : brown), 0.7);
      B.add(new THREE.SphereGeometry(3.1, 10, 8), trs(5.6, 3.6, 0), (p) => (p.y < -0.6 ? pale : brown.clone().multiplyScalar(0.8)), 0.7);
      B.add(new THREE.ConeGeometry(1.0, 2.6, 6), trs(8.9, 3.3, 0, 0, 0, -PI / 2), cNight, 0.3);
      for (const z of [-1.5, 1.5]) B.add(new THREE.SphereGeometry(0.45, 6, 5), trs(7.3, 4.5, z), cNight, 0.08);
      B.add(chamferBox(8, 0.6, 3.6, 0.2), trs(-9, 0.4, 0, 0, 0, 0.12), brown.clone().multiplyScalar(0.7), 0.7);
      for (const z of [-1.4, 1.4]) rod(B, new V3(0.5, -3.6, z), new V3(1.5, -6.6, z), 0.3, cNight, 0.4, 4);
      Wg.tri(new V3(3.5, 0, 0), new V3(-4.5, 0, 0), new V3(-2, 0, 11), brown.clone().multiplyScalar(0.8), 0.7).tri(new V3(3.5, 0, 0), new V3(-2, 0, 11), new V3(2, 0, 7), brown, 0.7);
      g.add(new THREE.Mesh(B.build(), litMat)); const wg = Wg.build(), wings = [];
      for (const sgn of [1, -1]) { const w = new THREE.Mesh(wg, thinMat); w.position.set(0, 2.2, 2.6 * sgn); w.scale.z = sgn; g.add(w); wings.push(w); }
      g.traverse((o) => { o.frustumCulled = false; }); scene.add(g);
      return { g, wings };
    })();
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    const strider = (() => {
      const B = makeAcc(), dk = cNight.clone().multiplyScalar(0.8);
      B.add(new THREE.SphereGeometry(1, 8, 6), trs(0, 1.1, 0, 0, 0, 0, 2.6, 0.45, 0.55), dk, 0.3);
      for (const sgn of [1, -1]) for (const [x, fx, fz] of [[1.4, 5.5, 3.2], [0, 0.3, 6.2], [-1.2, -5.2, 4.2]]) {
        rod(B, new V3(x, 1.1, 0), new V3((x + fx) / 2, 2.1, fz * sgn * 0.5), 0.14, dk, 0.3, 4); rod(B, new V3((x + fx) / 2, 2.1, fz * sgn * 0.5), new V3(fx, 0.1, fz * sgn), 0.14, dk, 0.3, 4);
        B.add(new THREE.CircleGeometry(1.1, 10).rotateX(-PI / 2), trs(fx, 0.05, fz * sgn), cCream.clone().lerp(cAmber, 0.3), -1.3);   // a dimple of light under each foot
      }
      return dyn(B);
    })();
    await ctx.yield();   // a frame handed back here too: on a busy machine the stretch read over 50 ms
    const worm = (() => {
      // the design: 'An earthworm stretched across a cobble by the rapid, contracting slowly': it lies draped over
      // the rapid's own tilted cobble, beside the lane
      const B = makeAcc(), wc = mixc(col.rust, cPale, 0.45, 0.9), pts = [], o = new V3(0, 1, 0).applyMatrix4(rapidCobble);
      for (let i = 0; i <= 10; i++) {
        const lx = -0.41 + 0.82 * i / 10, lz = 0.07 * Math.sin(i * 0.9) - 0.05, r2 = (lx * lx + lz * lz) * 4;
        pts.push(new V3(lx, Math.pow(Math.sqrt(Math.max(1 - r2, 0.03)), 0.55) + 0.07, lz).applyMatrix4(rapidCobble).sub(o));
      }
      // coloured by distance along its length (read from position, not by counting vertices): ring after ring,
      // and one paler saddle a third of the way from the head
      const crv = new THREE.CatmullRomCurve3(pts), sp = crv.getSpacedPoints(96);
      const along = (p) => { let bi = 0, bd = 1e9; for (let i = 0; i <= 96; i++) { const dd = sp[i].distanceToSquared(p); if (dd < bd) { bd = dd; bi = i; } } return bi / 96; };
      B.add(new THREE.TubeGeometry(crv, 96, 0.62, 8, false), null, (p) => {
        const t = along(p), saddle = smoothstep(0.26, 0.29, t) * (1 - smoothstep(0.37, 0.4, t));
        return wc.clone().multiplyScalar(lerp(0.74 + 0.2 * smoothstep(-0.5, 0.5, Math.sin(t * 24 * TAU)), 1.2, saddle) * (0.85 + 0.15 * Math.sin(t * PI)));
      }, 0.22);
      const m = dyn(B); m.position.copy(o); m.frustumCulled = false; return m;
    })();
    await ctx.yield();
    // the leaf raft with its ladybird passenger, and the dam of jammed plane leaves
    const dr = rng.fork('dam');
    const raft = (() => {
      // the fauna: 'A ladybird (0.8 long, amber-lit, its red kept dull so the rival boat stays the accent)': small,
      // matt and brick-brown, on the lit material (the leaf's translucent one let the lamp glow through it)
      const B = makeAcc(), Lb = makeAcc(), dull = mixc(cRed, col.rust, 0.86, 0.42);
      { const lg = leafGeo(dr); B.add(lg, trs(0, 0, 0, 0, 0, 0, 12, 6, 12), leafCol(lg, col.leaf.clone().multiplyScalar(1.3)), 12.42); }
      Lb.add(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, PI / 2), trs(1.5, 0.4, 0.8, 0, 0, 0, 0.6, 0.42, 0.5), (p) => (Math.abs(Math.sin(p.x * 5.5) * Math.sin(p.z * 6)) > 0.8 ? cNight : dull), 0.8);
      Lb.add(new THREE.SphereGeometry(0.22, 8, 6), trs(2.05, 0.5, 0.8), cNight, 0.6);
      const m = dyn(B, thinMat), lb = new THREE.Mesh(Lb.build(), litMat); lb.frustumCulled = false; m.add(lb);
      return m;
    })();
    await ctx.yield();
    const NDAM = 12, damLeaves = (() => {
      const B = makeAcc(), lg = leafGeo(dr); B.add(lg, null, leafCol(lg, new THREE.Color(1, 1, 1)), 10.42);
      const im = new THREE.InstancedMesh(B.build(), thinMat, NDAM), c = new THREE.Color();
      for (let i = 0; i < NDAM; i++) im.setColorAt(i, c.copy(col.leaf).multiplyScalar(dr.range(0.8, 1.35)).lerp(col.rust, dr.range(0.1, 0.5)));
      im.frustumCulled = false; scene.add(im); return im;
    })();
    const damSeed = Array.from({ length: NDAM }, (_, i) => ({ d: -13 + i * 2.36, ds: dr.range(-2.5, 2.5), rx: dr.range(-0.7, 0.7), rz: dr.range(-0.6, 0.6), ry: dr.range(0, TAU), sc: dr.range(9, 12.5), sp: dr.range(0.8, 1.22), lane: (i % 2 ? 1 : -1) * dr.range(10, 12.5) }));
    await ctx.yield();
    // fallen leaves stuck to the wet cobbles and flagstones (polish 2: the road is no longer one bare pattern)
    {
      let hs = 40507; const hr = () => { hs = (hs * 1664525 + 1013904223) >>> 0; return hs / 4294967296; };
      const n = Math.round((L.season === 'autumn' ? 84 : L.season === 'winter' ? 26 : 14) * L.density * L.detail);
      const B = makeAcc(), lg = leafGeo(ownRng('paper-boat-rapids:stuck-leaf-shape'), 20, [0.88, 1.0]); B.add(lg, null, leafCol(lg, new THREE.Color(1, 1, 1)), 10.4);      // (round 2) stuck to the road and far from the lens: a coarse outline, two rings
      const im = new THREE.InstancedMesh(B.build(), thinMat, n + 2), c = new THREE.Color();
      // (repair 3) two more of them, small ones, plastered by the rain to the wet face of the gutter kerb above the
      // water, one somewhere in each half of the first run (the flora's plane leaves; their places, sizes, turn
      // and tones are dealt from a stream of their own)
      {
        const kl = ownRng('paper-boat-rapids:kerb-leaf'), yAx = new V3(0, 1, 0), spin = new THREE.Quaternion();
        for (let j = 0; j < 2; j++) {
          const s = kl.range(80 + 160 * j, 240 + 160 * j), sca = kl.range(5.2, 5.9);
          toWorld(s, -15.2, Wd(s) + kl.range(5.8, 6.1), tmpV); tmpV2.set(-_c.hz, 0, _c.hx);
          tmpQ.setFromUnitVectors(yAx, tmpV2).multiply(spin.setFromAxisAngle(yAx, kl.range(0, TAU)));
          tmpM.compose(tmpV, tmpQ, tmpV2.set(sca, sca * 0.3, sca)); im.setMatrixAt(n + j, tmpM);
          im.setColorAt(n + j, c.copy(col.leaf).multiplyScalar(kl.range(1.4, 1.9)).lerp(col.rust, kl.range(0.1, 0.4)));      // (lighter than the road's leaves: it hangs on the dark face, out of the lamps' way)
        }
      }
      for (let i = 0; i < n; i++) {
        const s = 30 + 700 * hr(), near = hr() * hr(), side = hr() < 0.72, sca = 7.5 + 5.5 * hr();
        const d = side ? wr(s) + 7 + 95 * near : -(kerbAt(s) ? 24 + 90 * near : wl(s) + 8 + 70 * near);
        toWorld(s, d, groundH(s, d) + (side || !kerbAt(s) ? 3.1 : 0.5), tmpV);
        tmpM.compose(tmpV, tmpQ.setFromEuler(tmpE.set((hr() - 0.5) * 0.3, hr() * TAU, (hr() - 0.5) * 0.3)), tmpV2.set(sca, sca * 0.45, sca)); im.setMatrixAt(i, tmpM);
        im.setColorAt(i, c.copy(col.leaf).multiplyScalar(0.75 + 0.6 * hr()).lerp(col.rust, 0.1 + 0.45 * hr()));
      }
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();
    // twigs wedged across the channel hold the dam
    for (let i = 0; i < 3; i++) rod(S, at(703 + i, -15, 0.9 + i * 0.5), at(705 - i, 15.5, 0.2 + i * 0.4), 0.28, col.rust.clone().multiplyScalar(0.35), 0.7, 5);
    // rare (the variations: 'a child's amber-yellow wellington boot stamps down into the still pool beside us'):
    // the boots and the trouser legs going up into the dark, nothing more; the child is only implied
    const bootFrom = toWorld(670, 96, Gd(670) + 2.5, new V3()), bootTo = toWorld(675, 34, Gd(675) - 2.7, new V3()), bootStand = toWorld(686, 80, Gd(686) + 2.5, new V3());
    const splashAt = bootTo.clone().setY(0), bootLight = toWorld(640, 12, Wd(640) + 46, new V3());
    const child = L.rare ? (() => {
      const B = makeAcc(), wc = new THREE.Color(cAmber.r, cAmber.g * 1.12, cAmber.b * 0.6).multiplyScalar(0.88), sole = wc.clone().multiplyScalar(0.4), cloth = mixc(cNight, cSlate, 0.4, 0.9);
      B.add(chamferBox(25, 9.5, 11, 4), trs(5.5, 5.4, 0), wc, 0.15);
      B.add(new THREE.SphereGeometry(1, 12, 8), trs(15, 5.4, 0, 0, 0, 0, 6.5, 5.2, 5.7), wc, 0.15);
      B.add(new THREE.CylinderGeometry(6.6, 5.4, 31, 16, 1), trs(-3.5, 23, 0), wc, 0.15);
      B.add(new THREE.TorusGeometry(6.5, 0.9, 6, 18), trs(-3.5, 38.5, 0, PI / 2, 0, 0), wc.clone().multiplyScalar(1.15), 0.15);
      B.add(chamferBox(27.5, 2.2, 12, 0.8), trs(6, 1.1, 0), sole, 0.4); B.add(chamferBox(9, 3.4, 11.5, 0.8), trs(-4.5, 1.7, 0), sole, 0.4);
      B.add(new THREE.CylinderGeometry(4.6, 4.0, 150, 10, 6), trs(-3.5, 112, 0), cloth, 0.8, { shade: (x, y) => 1 - 0.9 * smoothstep(60, 150, y) });      // the leg loses itself in the dark above
      const bg = B.build(), boots = [0].map(() => { const m = new THREE.Mesh(bg, bootMat); m.frustumCulled = false; scene.add(m); return m; });
      course(676, _c); const yaw = Math.atan2(-_c.hz, _c.hx) + PI / 2 + 0.35;      // toes toward the gutter
      boots[0].rotation.y = yaw + 0.5;
      return { boots };
    })() : null;
    await ctx.yield();
    // someone under an umbrella, far up the pavement beyond the drain
    const walker = (() => {
      const B = makeAcc(), dk = cNight.clone().multiplyScalar(0.5);
      B.add(new THREE.SphereGeometry(58, 14, 6, 0, TAU, 0, PI / 2.4), trs(0, 168, -8, -0.21, 0, 0, 1, 0.5, 1), dk, 0.3);
      rod(B, new V3(9, 118, -6), new V3(3, 197, -14), 1.2, dk, 0.5, 4);
      B.add(new THREE.CylinderGeometry(12, 17, 66, 8), trs(0, 108, 0), dk, 0.8);
      B.add(new THREE.SphereGeometry(1, 10, 6), trs(0, 141, 0, 0, 0, 0, 19, 7, 11), dk, 0.8);
      B.add(new THREE.SphereGeometry(9, 10, 8), trs(0, 157, -1), dk, 0.6);
      rod(B, new V3(15, 138, 0), new V3(10, 116, -7), 4, dk, 0.8, 5);
      const m = dyn(B), legs = [];
      for (const x of [-6.5, 6.5]) { const lb = makeAcc(); rod(lb, new V3(0, 0, 0), new V3(0, -78, 0), 6, dk, 0.8, 6, 7); lb.add(chamferBox(9, 5, 17, 1.5), trs(0, -76, -4), dk, 0.5); const lm = new THREE.Mesh(lb.build(), litMat); lm.position.set(x, 78, 0); m.add(lm); legs.push(lm); }
      return { m, legs };
    })();

    await ctx.yield();
    // the way out announces itself: warm light welling up out of the drain, seen from far up the street
    const exitU = addMesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: { ...HU, uK: { value: 0 } },
      vertexShader: /* glsl */`uniform float uK; varying vec2 vUv; varying float vF;
        void main(){ vUv = vec2(position.x * 2.0, position.y + 0.5);
          vec3 c = vec3(0.0, -6.0, -24.0), tc = cameraPosition - c; float dist = length(tc);
          vec3 rt = normalize(vec3(tc.z, 0.0, -tc.x) + 1e-5);
          vec3 p = c + rt * position.x * 130.0 + vec3(0.0, 1.0, 0.0) * (position.y + 0.5) * 210.0;
          vF = uK * smoothstep(60.0, 190.0, dist) * exp(-dist * 0.0012);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        varying vec2 vUv; varying float vF;
        void main(){
          float w = 0.16 + 0.6 * vUv.y, x = vUv.x / w;
          float n = pbFbm(vec2(vUv.x * 3.0, vUv.y * 2.2 - uTime * 0.22));
          float g = 0.4 * exp(-x * x * 3.4) * pbSS(0.62, 0.0, vUv.y) * pbSS(0.62, 0.0, vUv.y) * pbSS(0.0, 0.05, vUv.y) * (0.55 + 0.9 * n);      // (polish 3) a low glow over the mouth, not a column
          g += 1.6 * exp(-(vUv.x * vUv.x * 60.0 + vUv.y * vUv.y * 900.0));            // the bright mouth itself
          gl_FragColor = vec4(mix(uPortalCol, uLampCol * 0.4, 0.35) * g * vF * (0.85 + 0.15 * sin(uTime * 0.9)), 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
    }), 6).material.uniforms;

    await ctx.yield();
    addMesh(S.build(), litMat);
    await ctx.yield();

    // ---- the camera path: the stern ride. The lens rides behind the cream boat's stern (the design: 6 above
    // and 14 behind the stern) from the pool to the lip; then it takes the hero's line over the lip and down
    // into the culvert.
    const S0 = 10;
    const dcam = (s) => (2.4 * Math.sin(s * 0.021 + 1.0) + 5 * (1 - smoothstep(20, 75, s)) - 5.6 * Math.exp(-(((s - 606) / 22) ** 2))) * (1 - smoothstep(650, 740, s));   // the boats' lane
    // The stern ride breathes (the design: 'yawing and bobbing with it'): the lens stays behind the cream boat's
    // stern all the way, 14 to 26 from the boat's centre (8 to 20 behind its stern), 3 to 9 over the water, and
    // swings round the boat to either quarter by up to about 45 degrees. One table, by the lens's place on the
    // course (s), eased from row to row and held where two rows agree:
    //   s, swing (degrees, + = road side), distance to the boat's centre, height over the water,
    //   look turned off the boat (degrees, + = to the right of it), its play (degrees),
    //   the boat's angle under the look: least, most (radians; 0.2 to 0.46 is the lower third)
    const RIG = [
      // out of the pool close behind the stern, the boat large, the lens well off the kerb and the downpipe's
      // column. Holds on the pool: it ends at s 60 (the widening of wr dies between 45 and 75)
      [10, -4, 16.5, 6.2, 0, 16, 0.23, 0.37],
      [60, -5, 15.5, 6, -4, 10, 0.23, 0.36],
      // (hand mend 4b) from the pool's mouth the lens eases straight to the wheel's hold below: no row between them
      // the bicycle wheel (hub at s 222): low and far back, looking up through rim and spokes, both boats small at
      // the foot of the frame. Begins as the lens passes the dandelion (s 150); ends as the boat comes under the hub
      // (222 less the lead of 25)
      [152, 10, 25.5, 3.4, -5, 8, 0.4, 0.45],
      [197, 10, 25.5, 3.4, -5, 8, 0.4, 0.45],
      // the snail on the kerb wall (s 282, 18 to the kerb side), from the road-side quarter, low: the boat
      // three-quarter on, the kerb a band beyond it. Begins where the lens is out from under the wheel (its rim
      // reaches to s 239 along the gutter); ends where the snail passes out at the frame's left edge, 22 short of it
      [238, 24, 21, 4.2, 12, 6, 0.25, 0.33],
      [260, 24, 21, 4.2, 12, 6, 0.25, 0.33],
      // the tram (its front reaches the gutter at lens s 320, its last wheel clears at 404: vehKeys): astern again, a
      // little nearer and higher, so that with the boat at the upper border of the lower third the look lies 6 to 7
      // degrees under the level: the car's floor and beams are a band along the top, truck frames, wheels and fans
      // hang below it. The hold lies inside the crossing and ends before the last wheel clears
      [328, 8, 16.5, 6.8, 0, 22, 0.2, 0.235],
      [388, 8, 16.5, 6.8, 0, 22, 0.2, 0.235],
      // the corner shop's window comes into view on the left where the kerb ends (s 410); no hold: from here the
      // look eases across to the tram's tail
      [408, 12, 19, 6, -16, 4, 0.22, 0.3],
      // the rail sheet after the tram: close behind the stern on the gold water, the tram's tail going away up on
      // the right. Begins as the boat reaches the middle of the sheet between the rails (s 500, the lens 14 behind);
      // ends as the boat reaches the sheet's narrowing (wl falls from s 555)
      [486, -12, 14.5, 4.4, 8, 8, 0.25, 0.36],
      [538, -12, 14.5, 4.4, 8, 8, 0.25, 0.36],
      // the rapid: near behind the stern on its road-side quarter, 12 degrees round the boat (the rival goes down
      // the tongue a length ahead of us), and the lens keeps the table's height over its OWN water. Begins
      // as the boat reaches the resumed kerb (s 580); ends as the boat reaches the lip (LIP_S less the lead): from
      // there the lens falls back while the boat runs away down the fast water. The lens goes down the tongue
      // when it reaches the tongue itself, and no sooner
      [566, 12, 14.5, 4.8, 10, 6, 0.27, 0.34],
      [LIP_S - 14.5, 12, 14.5, 4.8, 10, 6, 0.27, 0.34],
      // the standing waves and the still pool from a little to the road side, where the pool has widened: the kerb
      // and the sparrow beyond our boat, the rival on the road side of us as we retake it. Begins as the boat
      // reaches the second crest (s 638 + a boat's half length); ends as the boat leaves the pool through the gap
      // (wr has narrowed again by s 710)
      [618, 14, 22, 6, -6, 8, 0.24, 0.34],
      [690, 8, 22, 7, -6, 8, 0.24, 0.34],
      // the last straight, from the kerb-side quarter across the released leaves: the boat large among them, the
      // ladybird's leaf on the near side of it, the rival beyond it, the lamp's ribbon and the glowing drain ahead on the left. Begins as
      // the boat enters the drain's own street (S_END); ends as the boat reaches the basin's widening (s 825), where
      // the kerb leaves the lane
      [S_END - 15, -30, 17.5, 4.4, 7, 6, 0.25, 0.34],
      [825 - 15, -30, 17.5, 4.4, 7, 6, 0.25, 0.34],
      // astern on the middle line, where the drain's own line takes the lens over (the hero's fly-through, from s 870)
      [850, 0, 19, 7, 0, 22, 0.23, 0.37],
    ];
    const rigV = new Float32Array(8);
    const rig = (s) => {
      let i = 1; while (i < RIG.length - 1 && s > RIG[i][0]) i++;
      const a = RIG[i - 1], b = RIG[i], t = smoothstep(a[0], b[0], s);
      for (let k = 1; k < 8; k++) rigV[k] = lerp(a[k], b[k], t);
      rigV[1] *= PI / 180; rigV[4] *= PI / 180; rigV[5] *= PI / 180;
      return rigV;
    };
    const leadAt = (s) => { const r = rig(s); return r[2] * Math.cos(r[1]); };      // how far ahead of the lens (along the course) the boat's centre rides
    const pts = [];
    for (let s = S0; s <= 850; s += (s >= 560 && s < 640 ? 5 : 10)) { const r = rig(s); pts.push(toWorld(s, dcam(s) + r[2] * Math.sin(r[1]), Wd(s) + 0.5 * stand(s) + r[3], new V3())); }
    for (const p of A.flyThrough.slice(2)) pts.push(p.clone());
    const path = makePath(pts), LP = path.length;
    await ctx.yield();
    const camTab = new Float32Array(257);
    for (let i = 0; i <= 256; i++) { path.pointAt(i / 256, tmpV); camTab[i] = tmpV.z <= 146 ? 900 - tmpV.z : toSD(tmpV.x, tmpV.z).s; }
    const camS = (u) => { const f = clamp(u, 0, 1) * 256, i = Math.min(255, Math.floor(f)); return lerp(camTab[i], camTab[i + 1], f - i); };
    const uOf = (s) => clamp((s - S0) / LP, 0, 1);
    const SPEED = LP / 40;

    // ---- per-frame helpers ----
    const keys = (x, arr, ease) => {
      if (x <= arr[0][0]) return arr[0][1];
      for (let i = 1; i < arr.length; i++) if (x <= arr[i][0]) { let t = (x - arr[i - 1][0]) / (arr[i][0] - arr[i - 1][0]); if (ease) t = t * t * (3 - 2 * t); return lerp(arr[i - 1][1], arr[i][1], t); }
      return arr[arr.length - 1][1];
    };
    const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
    const bellS = (x, a, b, f) => smoothstep(a, a + f, x) * (1 - smoothstep(b - f, b, x));
    // the surge that travels with the cream boat (the tram's wake over the rail sheet; on rare seeds the boot's wave
    // down the last straight): its place, height and width follow from where the lens is on the course, so whoever
    // needs the water's height (update, and the gaze on its own) works it out for itself into its own object
    const SG = { x: 0, y: 0, z: 17 }, wyV = new V3();
    const surgeOf = (sc, sb, o) => { o.x = sb + 4; o.y = Math.max(1.3 * bellS(sc, 392, 545, 40), L.rare ? 1.8 * smoothstep(636, 660, sc) * (1 - smoothstep(880, 900, sc)) : 0); o.z = 17; return o; };
    const waterY = (s, d, time, sg = SG) => {
      const bump = sg.y * Math.exp(-(((s - sg.x) / sg.z) ** 2));
      if (s > S_END) { toWorld(s, d, 0, wyV); return hero.waterHeight(wyV.x, wyV.z) + bump; }
      return Wd(s) + stand(s) + bump + 0.12 * Math.sin(time * 2.1 + s * 0.25);
    };
    // A hull's heading is the water's (the design: 'yawing and bobbing with it'), one rule for the whole run and for
    // every hull: the course's heading, turned by the thread of the current it rides (its lane's drift across the
    // gutter), by the eddy that turns whatever floats in the first pool (half a turn, dying out as the current takes
    // the bow between s 26 and 71), and by the water's own sway where it stands: more where it runs fast and where
    // its surface slopes. Nothing in it knows where the lens is.
    const eddyTurn = (s) => PI * (1 - smoothstep(26, 71, s));
    const swayAmp = (s, slope) => 0.1 + 0.006 * flowSpeed(s) + 0.3 * Math.abs(slope);
    const pose = (obj, s, d, time, id, lift, spin = 0, lane = null, sg = SG) => {
      let yaw, pitch, roll;
      if (s <= 898) {
        // a boat is 12 long: over the hollow at the foot of the rapid's step and between the standing waves it
        // bridges from crest to crest instead of sinking its stern into the slope behind it
        let y = waterY(s, d, time, sg); if (id < 2) y = Math.max(y, 0.5 * (waterY(s - 4.5, d, time, sg) + waterY(s + 4.5, d, time, sg)));
        toWorld(s, d, y + lift, obj.position); course(s, _c);
        const rise = waterY(s + 5, d, time, sg) - waterY(s - 5, d, time, sg), slope = rise / 10;
        yaw = Math.atan2(-_c.hz, _c.hx) + spin + swayAmp(s, slope) * noise.n2(time * 0.45, id * 7.1);
        if (lane) yaw += eddyTurn(s) - Math.atan((lane(s + 1) - lane(s - 1)) / 2);
        // a hull pitches with the water under its two ends, as a boat does (bow down the tongue, bow up the
        // standing wave); it never stands on its nose
        pitch = (id < 2 ? clamp(Math.atan2(rise, 10), -0.4, 0.38)
          : clamp(Math.atan2(waterY(s + 3, d, time, sg) - waterY(s - 3, d, time, sg), 6) * 1.3, -0.72, 0.62)) + 0.06 * Math.sin(time * 3.1 + id);
        roll = 0.12 * noise.n2(time * 0.6 + 5, id * 3.3) + 0.05 * Math.sin(time * 2.3 + id * 2);
      } else {                                   // over the lip: tip, fall with the sheet, bob in the chamber pool
        const k = s - 898; let y = -0.7 - 0.05 * k * k;
        yaw = PI / 2 + 0.3 * Math.sin(k * 0.2 + id); pitch = -Math.min(k * 0.075, 1.35); roll = 0.3 * Math.sin(k * 0.3 + id);
        if (y < -44.3) { y = -44.3 + 0.5 * Math.sin(time * 3 + id); pitch = 0.25 * Math.sin(time * 2.2 + id); yaw += time * 0.8; }
        obj.position.set(d * (1 - Math.min(k / 40, 0.6)), y + lift, 2 - Math.min(k * 0.8, 24 + id * 3));
      }
      obj.rotation.set(roll, yaw, pitch, 'YZX');
    };
    // the ring of bulged water and foam that hugs a hull at its waterline (an ellipse along the heading)
    if (hero.uniforms.uHull) { hero.uniforms.uHull.value = WU.uBoat.value; hero.uniforms.uHullD.value = WU.uBoatD.value; }      // (polish 3) the hero's basin sees the same hulls
    const hullRing = (i, obj, wid, ratio) => { const y = obj.rotation.y; WU.uBoat.value[i].set(obj.position.x, obj.position.z, wid); WU.uBoatD.value[i].set(Math.cos(y), -Math.sin(y), ratio); };
    const STAMP = 612;
    // The rival has a course of its own in the gutter. It lies at rest in the eddy on the road side of the first
    // pool (EDDY_S, where the eddy's other passenger, the bottle cap, circles just upstream of it) until OUR BOAT
    // has passed the pool's mouth (the journey: 'the red boat slides out of the eddy behind us'). From there it runs
    // by a thread of its own: how far ahead of our boat it is, by OUR BOAT's place in the gutter (sb), eased from
    // one thing of the gutter to the next. Each knot is a thing of the gutter:
    const EDDY_S = 50, POOL_MOUTH = 60;
    const rivalOff = [
      // the pool's mouth (the space: 's=0-60: a pool'): we pass it, and the rival lies on in the eddy behind us
      [POOL_MOUTH, EDDY_S - POOL_MOUTH],
      // the dandelion on the kerb (s 150): the rival itself is abreast of it, half a length behind us (so we are 6
      // past it); out of the eddy's slack water it has the stream's pace by here, and it is gaining
      [150 + 6, -6],
      // the far end of the bicycle wheel's rim (the hub hangs over s 222, the rim reaches to s 239 along the
      // gutter): level with us as we come out from under it (the journey: 'the red boat draws level and overtakes
      // on the right')
      [239, 0],
      // where the curve begins (SA): past us on the right, three quarters of a length ahead
      [SA, 9],
      // where the curve ends (SB): its lane is the outside of the left curve, 8 further out, and the longer way
      // round costs it 8 times the curve's angle
      [SB, 9 - 8 * TH],
      // the first tram rail (s 445): the tram's wake runs down the gutter as its last wheel clears and reaches the
      // leading boat first; it has carried the rival most of a length ahead of us
      [445, 11],
      // the tilted cobble of the rapid (s 606): a clear length and a little ahead, it has gone down the one tongue
      // beside the cobble in front of us; from here it comes out of the tongue's run to the road side and loses way
      // through the standing waves (the journey: 'through two standing waves, where we retake the red boat')
      [606, 14],
      // the coin on the bed of the still pool (s 672): retaken, a quarter of a length behind us
      [672, -3],
      // the leaf dam (s 703): all but level as the dam goes (the journey: 'the release carries both boats ... through the gap')
      [703, -1],
      // the storm drain's basin (the space: 's=860-900: the storm drain'): 'the red boat half a length in front'
      [860, 5.5],
      // the lip of the drain (s 900): the basin's draw has the leading boat first ('it goes over the lip first')
      [900, 7],
    ];
    // the rival's own place along the gutter. In the eddy it is at rest; when we have passed the mouth the stream
    // draws it out of the slack water, and it comes up from rest to the stream's pace by the next knot (the last
    // term is the cubic that starts it at a standstill)
    const rivalS = (sb) => {
      if (sb <= POOL_MOUTH) return EDDY_S;
      const run = rivalOff[1][0] - POOL_MOUTH, t = clamp((sb - POOL_MOUTH) / run, 0, 1);
      return sb + keys(sb, rivalOff, true) - run * t * (1 - t) * (1 - t);
    };
    // the rival's lane: in the pool it lies out in the eddy, 17 to the road side of our lane; it comes in as the pool
    // narrows (its s 38 to 62; the pool's own narrowing is wr, s 45 to 75) and runs 8 to the road side of our lane.
    // At the rapid the water is one tongue between the kerb and the tilted cobble (the cobble lies at s 606, 10 to
    // the road side, 14.5 across): the rival closes in to 1.5 from our line where the water narrows to the resumed
    // kerb (its s 560 to 590), which takes its hull past the cobble's flank with about 2 of water, and it comes back out
    // to its own lane from the cobble's middle to a boat's length below the cobble's end (its s 606 to 625). From
    // there on it keeps the road side: the kerb side below the dam is the ladybird's raft's water
    const rivalLane = (s) => dcam(s) + lerp(8, 1.5, smoothstep(560, 590, s) * (1 - smoothstep(606, 625, s))) + 9 * (1 - smoothstep(38, 62, s));
    // The crossing (the design: 'crossing 60 units ahead from left to right for four seconds ... its wake surge
    // lifts us over the rail grooves as the last wheel clears'). Track distance 1655 is the front at the gutter's
    // left edge. The car is 150 wide on rails at s 445 and 545, so its near side stands at s 420: the front comes
    // in while that side is some 90 ahead of the lens and the last wheel leaves our lane as the cream boat's bow
    // comes up to the first groove (lens at s 404), four seconds later; then it swings away down the road.
    const vehKeys = L.vehicle === 'tram' ? [[80, -360], [320, 1655], [404, 2367], [520, 3050], [650, 3740], [900, 4400]]
      : [[90, -350], [328, 1655], [404, 2200], [520, 2850], [650, 3440], [900, 3900]];
    // where the two hulls and the crossing car stand: our hull and the car from the lens's place on the course, the
    // rival from our hull's place (rivalS), all with the clock alone, into whatever object is handed in (update
    // places the meshes with these; the gaze works them out for itself)
    const rivalLift = L.rival === 'walnut' ? -0.35 : L.rival === 'duck' ? -0.2 : -0.6;
    const creamPose = (o, sb, time, sg) => pose(o, sb, dcam(sb), time, 0, -0.6 + 0.7 * bellS(sb, 598, 654, 8), 0, dcam, sg);      // (it rides high on the foam of the rapid)
    const rivalPose = (o, sb, time, sg) => { const rs = rivalS(sb); pose(o, rs, rivalLane(rs), time, 1, rivalLift + 0.6 * bellS(rs, 598, 654, 8), 0, rivalLane, sg); return rs; };
    const midCarAt = (sc, time, o, a, b) => {
      const ci = Math.min(1, cars.length - 1), car = cars[ci], tc = keys(sc, vehKeys) - car.off;
      tramAt(tc + car.half, a); tramAt(tc - car.half, b);
      const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2;
      return o.set(x, vehY(x, z) + (car.legs.length ? 0 : 0.3 * Math.sin(time * 7 + ci)), z);
    };
    const burstS = L.rare ? 640 : 668;
    const perch = at(716, -22, 18.6), flyIn = at(588, 34, 33),      // (polish 2) it swoops in over the rapid, across the frame, as the boats tip into it
       out1 = at(640, 0, 48), out2 = at(520, 70, 200);
    const sparrowAt = (sc, o) => {
      if (sc < 600) { const k = smoothstep(552, 600, sc); o.lerpVectors(flyIn, perch, k); o.y += 12 * Math.sin(PI * k) * (1 - k); }
      else if (sc < 692) o.copy(perch);
      else { const k = clamp((sc - 692) / 40, 0, 1.6), a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k; o.set(perch.x * a + out1.x * b + out2.x * c, perch.y * a + out1.y * b + out2.y * c, perch.z * a + out1.z * b + out2.z * c); }
      return o;
    };
    const tO = { x: 0, z: 0, hx: 1, hz: 0 }, tO2 = { x: 0, z: 0, hx: 1, hz: 0 }, bp = new V3(), up = new V3(0, 1, 0), ZAX = new V3(0, 0, 1);
    const windN = wind.clone().normalize();

    // one gaze for the whole flight: the way ahead, the cream boat, and each set piece in its turn
    // The stern ride looks down the lane over the boat. The set pieces are side gazes from the stern (all of
    // them together never more than SIDE of the look), and one rule holds for the whole flight: the look
    // may not rise, sink or turn so far that the cream boat leaves the lower third of the frame.
    const SIDE = 0.3, wfKeys = [[300, 0], [345, 0.26], [400, 0.2], [455, 0.08], [520, 0.16], [600, 0], [640, 0.22], [700, 0.22], [730, 0]];
    const gP = new V3(), gF = new V3(), gA = new V3(), gS = new V3(), gT = new V3(), gB = new V3(), gE = new V3(), farLamp = new V3(0, 170, -84);
    const sideTarget = L.rare ? bootTo.clone().setY(bootTo.y + 16) : perch.clone().setY(perch.y + 4);
    const gCream = { position: new V3(), rotation: new THREE.Euler() };
    const gSG = { x: 0, y: 0, z: 17 }, gCar = new V3(), gO = { x: 0, z: 0, hx: 1, hz: 0 }, gO2 = { x: 0, z: 0, hx: 1, hz: 0 };
    const gAdd = (p, w) => { if (w > 0.001) { gT.copy(p).sub(gP).normalize(); gS.addScaledVector(gT, w); } return w; };
    function gazeFn(time, u) {
      const sc = camS(u), d = clamp(u, 0, 1) * LP;
      path.posAtDist(d, gP); path.posAtDist(d + 34, gF); gF.y += 2.4; gS.set(0, 0, 0);
      let w = gAdd(wheelC, 0.25 * bellS(sc, 125, 214, 25));
      // (the hulls and the crossing car are worked out here, from u and the clock, into the gaze's own objects)
      const sb = sc + leadAt(sc); surgeOf(sc, sb, gSG); creamPose(gCream, sb, time, gSG);
      midCarAt(sc, time, gCar, gO, gO2); gCar.y += 14;      // the look goes to the wheels' feet and their fans, not up the car's side: the skirt stays a rim along the top of the frame
      w += gAdd(gCar, 0.3 * bellS(sc, 296, 436, 26));
      w += gAdd(farLamp, keys(sc, wfKeys));
      w += gAdd(sideTarget, (L.rare ? 0.3 : 0.22) * bellS(sc, L.rare ? 588 : 604, L.rare ? 650 : 696, 20));
      w += gAdd(A.viewpoints.approach.at, 0.3 * bellS(sc, 730, 880, 40));
      const k = w > SIDE ? SIDE / w : 1;
      gA.copy(gF).sub(gP).normalize().multiplyScalar(1 - w * k).addScaledVector(gS, k).normalize();
      // the lower third: keep the boat 13 degrees or more under the look (and its whole hull inside the frame) and within 22 degrees of it sideways
      const hold = 1 - smoothstep(866, 884, sc);
      if (hold > 0) {
        const cP = gCream.position;
        gB.copy(cP).sub(gP); gB.y += 2;
        const be = Math.atan2(gB.y, Math.hypot(gB.x, gB.z)), ge = Math.asin(clamp(gA.y, -1, 1)), by = Math.atan2(gB.x, gB.z), gy = Math.atan2(gA.x, gA.z);
        let dy = gy - by; dy -= TAU * Math.round(dy / TAU);
        // (the same for our own hull: both its ends, wherever it has pitched and turned them, stay 2 degrees inside
        // the frame; for that the look may sink until the boat stands at the upper border of the lower third)
        // where the lens has swung to a quarter the look is turned off the boat by the table's angle (so the boat
        // stands left or right of the middle and the picture opens beside it), with the table's play round that
        const r = rig(sc), yT = r[4], yPlay = r[5], eLo = r[6], eHi = r[7];
        const y = by + lerp(dy, clamp(dy, -yT - yPlay, -yT + yPlay), hold);
        // a thing that stands off the middle of the frame sits lower in it: the frame's lower edge is nearer
        const edge = (vx, vz) => { let a = Math.atan2(vx, vz) - y; a -= TAU * Math.round(a / TAU); return Math.atan(0.53 * Math.cos(clamp(a, -1.3, 1.3))); };
        let ends = 9;
        for (const sx of [-6, 6]) { gE.set(sx, -0.3, 0).applyEuler(gCream.rotation).add(cP).sub(gP); ends = Math.min(ends, Math.atan2(gE.y, Math.max(Math.hypot(gE.x, gE.z), 1)) + edge(gE.x, gE.z)); }
        const own = Math.min(be + eHi, ends);
        const low = Math.max(be + 0.208, Math.min(be + eLo, ends)), top = Math.max(low, own);
        const e = lerp(ge, clamp(ge, low, top), hold), ce = Math.cos(e);
        gA.set(Math.sin(y) * ce, Math.sin(e), Math.cos(y) * ce);
      }
      return gT.copy(gP).addScaledVector(gA, 100);
    }

    const beadIM = beads.instanceMatrix, fanIM = fans.instanceMatrix, damIM = damLeaves.instanceMatrix, whIM = tramWheels ? tramWheels.instanceMatrix : null;      // per-instance transforms (attribute data)
    function update(dt, time, camera, u) {
      const sc = camS(u), sb = sc + leadAt(sc);
      hero.setProgress(smoothstep(560, 900, sc)); hero.update(dt, time, camera);
      sky.position.setFromMatrixPosition(camera.matrixWorld);
      lamp1Col.copy(lamp1Col0).multiplyScalar(1 + 0.07 * Math.sin(time * 10.7) * Math.sin(time * 2.9) + 0.04 * Math.sin(time * 21.3 + 2));
      crownU.uCamS.value = Math.min(sc, 900);
      surgeOf(sc, sb, SG); WU.uSurge.value.set(SG.x, SG.y, SG.z);

      WU.uRush.value = lerp(0.7, 1.9, smoothstep(0, 900, sc));          // the water quickens all the way down

      // boats: ours 18 ahead of the lens, the rival trading places with it
      creamPose(cream, sb, time, SG);
      const rs = rivalPose(rival, sb, time, SG);
      hullRing(0, cream, 2.1, 0.42); hullRing(1, rival, L.rival === 'walnut' ? 3.4 : L.rival === 'duck' ? 3.0 : 2.1, L.rival === 'walnut' || L.rival === 'duck' ? 0.66 : 0.42);
      pose(barge, 80 + 0.68 * sc, -9.5, time, 3, 0.25);      // the matchbox barge drifts slower than we do: we pass it once, on the kerb side
      pose(cork, Math.min(250 + 0.62 * sc, 694), -9, time, 4, 0.2, PI / 2); cork.rotation.z = -time * 2.2;
      { const a = time * 0.9, s = 34 + 6 * Math.cos(a), d = 17 + 6 * Math.sin(a); toWorld(s, d, waterY(s, d, time) + 0.35, cap.position); cap.rotation.set(0.06 * Math.sin(time * 5), time * 3.1, 0.06 * Math.cos(time * 4.3)); }
      at(58, 20, 0, conker.position); conker.position.y = waterY(58, 20, time) + 0.2 + 0.3 * Math.sin(time * 2.2); conker.rotation.set(0.3 * Math.sin(time * 1.3), time * 0.4, 0.3 * Math.sin(time * 1.7));
      wheel.quaternion.copy(wheelQ).multiply(tmpQ.setFromAxisAngle(ZAX, time * 0.45));

      // beads of water
      for (let i = 0; i < 4; i++) {
        const T = 1.9, t = ((time / T + i * 0.27) % 1) * T, ang = -PI / 2 + (i - 1.5) * 0.3;
        bp.set(Math.cos(ang) * 35, Math.sin(ang) * 35, 0).applyQuaternion(wheelQ).add(wheelC);
        const y = bp.y - 190 * t * t; setBead(i, bp.x, y, bp.z, y > Wd(222) ? 0.95 : 0, 1 + t * 1.4);
      }
      for (let i = 0; i < 10; i++) {
        const T = 0.7 + 0.05 * i, c = time / T + i * 0.37, t = c - Math.floor(c), a = i * 2.4 + Math.floor(c) * 1.7, r = t * (6 + (i % 3) * 3.5);
        setBead(4 + i, pipeLand.x + Math.cos(a) * r, pipeLand.y + 30 * t * (1 - t) * (1 + (i % 4) * 0.5), pipeLand.z + Math.sin(a) * r, 0.32);
      }
      for (let i = 0; i < 14; i++) {
        const T = 1.2 + 0.09 * i, c = time / T + i * 0.61, id = Math.floor(c), t = c - id;
        const s = sc - 15 + ((hash(id, i) * 130 - (sc - 15)) % 130 + 130) % 130, d = (hash(id + 0.5, i) * 2 - 1) * 13;
        if (s > 890) { setBead(14 + i, 0, 0, 0, 0); continue; }
        toWorld(s, d, waterY(s, d, time) + 95 * (1 - t * t), bp); setBead(14 + i, bp.x, bp.y, bp.z, 0.2 + 0.08 * hash(i, 3), 1 + 1.6 * t);
      }

      // the tram (or the horse and dray): swings out of the side street and across the gutter ahead of us
      const front = keys(sc, vehKeys), vspeed = (keys(sc + 1, vehKeys) - front) * SPEED;
      for (let ci = 0; ci < cars.length; ci++) {
        const car = cars[ci], tc = front - car.off;
        tramAt(tc + car.half, tO); tramAt(tc - car.half, tO2);
        car.obj.position.set((tO.x + tO2.x) / 2, 0, (tO.z + tO2.z) / 2); car.obj.position.y = vehY(car.obj.position.x, car.obj.position.z) + (car.legs.length ? 0 : 0.3 * Math.sin(time * 7 + ci));
        car.obj.rotation.y = Math.atan2(-(tO.z - tO2.z), tO.x - tO2.x);
        for (const w of car.spin) w.rotation.z = -tc / 48;
        for (let k = 0; k < car.legs.length; k++) car.legs[k].rotation.z = 0.55 * Math.sin(tc * 0.03 + (k % 2 ? PI : 0) + (k > 1 ? 1.2 : 0));
        car.yaw = car.obj.rotation.y;
      }
      const mc = cars[Math.min(1, cars.length - 1)].obj.position;
      tramLight.set(mc.x, mc.y + (L.vehicle === 'tram' ? 235 : 150), mc.z);
      tramCol.copy(tramCol0);
      WU.uStrip.value.set(mc.x, mc.z, cars[Math.min(1, cars.length - 1)].yaw, L.vehicle === 'tram' ? 1 : 0);
      if (child) {                      // the vehicle is far away by now: its light becomes the amber key on the boots
        const k = smoothstep(552, 564, sc), dip = Math.abs(1 - 2 * k) * Math.abs(1 - 2 * smoothstep(730, 760, sc));
        if (k > 0.5 && sc < 745) { tramLight.copy(bootLight); tramCol.copy(cAmber).multiplyScalar(1.2 * L.lampGain); }
        tramCol.multiplyScalar(dip);
      }
      tramAt(front + 4, tO); setBok(0, tmpV.set(tO.x, vehY(tO.x, tO.z) + headH, tO.z), lampGlow, 2.0, 26);
      if (poleCar >= 0) {
        const pc = cars[poleCar], cy = Math.cos(pc.yaw), sy = Math.sin(pc.yaw), pulse = Math.pow(Math.max(0, Math.sin(time * 4.1) * Math.sin(time * 1.7 + 1)), 3) * clamp(vspeed / 120, 0, 1);
        tmpV2.set(pc.obj.position.x - 86 * cy, pc.obj.position.y + 488, pc.obj.position.z + 86 * sy);
        setBok(1, tmpV2, cCream, 3.2 * pulse, 20);
        // the design: 'cream sparks dropping from the wire': they arc out over the roof's edge and drop past the
        // car's sides to the wet street (before, they fell inside the car body and were never seen from the gutter)
        for (let i = 0; i < 12; i++) {
          const t = (time * 1.15 + (i % 4) * 0.25 + Math.floor(i / 4) * 0.09) % 1, lat = (i % 2 ? 1 : -1) * (100 + 14 * (i % 3)) * t, al = (i - 5.5) * 5 * t;
          setBok(i < 4 ? 2 + i : 26 + i, tmpV.set(tmpV2.x + cy * al + sy * lat, tmpV2.y - 486 * t * t, tmpV2.z - sy * al + cy * lat), cCream, 2.4 * (1 - 0.8 * t * t) * clamp(vspeed / 120, 0, 1), 4.5);
        }
      } else { for (let i = 1; i < 6; i++) setBok(i, tmpV.set(0, -500, 0), cCream, 0, 1); for (let i = 30; i < 38; i++) setBok(i, tmpV.set(0, -500, 0), cCream, 0, 1); }
      const fs = clamp(vspeed / (L.vehicle === 'tram' ? 130 : 220), 0, 1);
      for (let i = 0; i < fanSpots.length; i++) {
        const f = fanSpots[i], car = cars[f.car], cy = Math.cos(car.yaw), sy = Math.sin(car.yaw);
        const x = car.obj.position.x + f.x * cy + f.z * sy, z = car.obj.position.z - f.x * sy + f.z * cy, q = toSD(x, z);
        const wet = q.s > 415 && q.s < 575 && q.d > -50 && q.d < 20 ? 1 : 0.8, k = fs * wet;      // the design: 'each wheel throwing a fan of water 50 high' (the whole street is wet, the gutter sheet wettest)
        tmpM.makeBasis(tmpV.set(cy * 90, 0, -sy * 90), tmpV2.set(sy * 8 * Math.sign(f.z), 22 + 34 * k, cy * 8 * Math.sign(f.z)), tmpV3.set(sy, 0, cy)).setPosition(x - cy * 30, railY(x, z) + 0.5, z + sy * 30);
        fans.setMatrixAt(i, tmpM); fanF[i * 2 + 1] = k;
        if (tramWheels) {      // the wheel at this place, turned by the distance the car has run
          whQ.setFromAxisAngle(YAX, car.yaw).multiply(whQ2.setFromAxisAngle(ZAX, -(front - car.off) / 26));
          tramWheels.setMatrixAt(i, tmpM.compose(tmpV.set(x, car.obj.position.y + 26, z), whQ, whS));
        }
      }
      if (whIM) whIM.needsUpdate = true;

      // creatures
      const ext = smoothstep(212, 276, sc);
      for (let i = 0; i < 2; i++) { const h = snail.horns[i]; h.scale.y = 0.12 + 0.88 * ext; h.rotation.x = (i ? 0.45 : -0.45) + 0.12 * Math.sin(time * 1.1 + i * 2); }
      snail.g.position.y = Gd(282) + 12 + 0.05 * Math.sin(time * 0.7);
      {
        const g = sparrow.g, flying = sc < 600 || sc >= 692; g.visible = !L.rare && sc > 554 && sc < 758;       // (the child has scared it off)
        sparrowAt(sc, g.position);
        if (flying) { sparrowAt(sc + 0.6, tmpV); tmpV.sub(g.position); g.rotation.set(0, Math.atan2(-tmpV.z, tmpV.x), Math.atan2(tmpV.y, Math.hypot(tmpV.x, tmpV.z)) * 0.6, 'YZX'); }
        else { course(716, _c); g.rotation.set(0, Math.atan2(-_c.hx, -_c.hz) + 0.25 * Math.sin(time * 0.9), -0.95 * (bellS(sc, 640, 656, 5) + bellS(sc, 664, 682, 5)) + 0.05 * Math.sin(time * 9), 'YZX'); }
        const flap = flying ? Math.sin(time * 26) * 0.95 : -0.15;
        for (let i = 0; i < 2; i++) { const w = sparrow.wings[i]; w.rotation.x = (i ? 1 : -1) * flap; w.scale.z = (i ? -1 : 1) * (flying ? 1 : 0.28); w.rotation.y = flying ? 0 : (i ? -1 : 1) * 1.2; }
      }
      {
        const k = time * 0.8, i0 = Math.floor(k), f = k - i0, e = 1 - (1 - f) ** 3;
        const s0 = 668 + 11 * noise.n2(i0 * 7.3, 1.1), d0 = 38 + 14 * noise.n2(i0 * 3.7, 9.2), s1 = 668 + 11 * noise.n2((i0 + 1) * 7.3, 1.1), d1 = 38 + 14 * noise.n2((i0 + 1) * 3.7, 9.2);
        const s = lerp(s0, s1, e), d = lerp(d0, d1, e); toWorld(s, d, waterY(s, d, time) + 0.1, strider.position);
        toWorld(s1, d1, 0, tmpV); toWorld(s0, d0, 0, tmpV2); strider.rotation.y = Math.atan2(-(tmpV.z - tmpV2.z), tmpV.x - tmpV2.x);
      }
      worm.scale.x = 1 + 0.07 * Math.sin(time * 1.6); worm.scale.z = 1 - 0.09 * Math.sin(time * 1.6 + 0.8);

      // the leaf dam, its burst, and the ladybird's raft
      const prog = Math.max(0, sc - burstS), rel = smoothstep(0, 28, prog);
      for (let i = 0; i < NDAM; i++) {
        const q = damSeed[i], s = 703 + q.ds + prog * q.sp, d = lerp(q.d, q.lane, rel), flat = 1 - rel;
        let y = waterY(Math.min(s, 897), d, time) + 0.4 + (1.2 + Math.abs(q.rx) * 3) * flat, sca = q.sc;
        if (s > 897) { y -= 0.05 * (s - 897) ** 2; if (y < -46) sca = 0; }
        toWorld(Math.min(s, 898 + (s - 898) * 0.5), d, y, tmpV);
        tmpM.compose(tmpV, tmpQ.setFromEuler(tmpE.set(q.rx * flat + 0.1 * Math.sin(time * 2 + i), q.ry + prog * 0.02 * (i % 2 ? 1 : -1), q.rz * flat)), tmpV2.set(sca, sca * 0.5, sca));
        damLeaves.setMatrixAt(i, tmpM);
      }
      // (the fauna: 'a leaf raft that runs beside us from the dam to the final straight': out of the dam on the kerb
      // side, then off our stern quarter there; the rival keeps the road side of us below the dam)
      { const s = Math.min(lerp(704.5 + prog * 0.9, sb - 6, smoothstep(10, 60, prog)), 893); pose(raft, s, -9.5, time, 6, 0.35, 0.6 + prog * 0.01); hullRing(2, raft, 6.5, 1); }

      // rare: the wellington comes down in the still pool and its wave bursts the dam early
      let amp = 0, age = 0;
      if (child) {
        const k = smoothstep(STAMP - 44, STAMP, sc), kk = k * k * k, b0 = child.boots[0];
        b0.position.lerpVectors(bootFrom, bootTo, kk); b0.position.y += 34 * Math.sin(PI * Math.pow(kk, 0.6)) * (1 - kk);
        b0.rotation.z = -0.5 * Math.sin(PI * Math.pow(kk, 0.6)) * (1 - kk);
        age = (sc - STAMP) / 55; amp = age > 0 && age < 1.4 ? 1.6 * (1 - age / 1.4) : 0;
      }
      WU.uSplash.value.set(splashAt.x, splashAt.z, Math.max(age, 0), amp);
      for (let j = 0; j < 12; j++) {
        const i = fanSpots.length + j, a = j / 12 * TAU + 0.26, r = 7 + 26 * age, fade = clamp(1 - age / 1.4, 0, 1), k = amp > 0 ? fade * fade * 1.5 : 0, hgt = (26 + 12 * (j % 3)) * (1 - age * 0.45);
        tmpM.makeBasis(tmpV.set(-Math.sin(a) * 26, 0, Math.cos(a) * 26), tmpV2.set(Math.cos(a) * 12, hgt, Math.sin(a) * 12), tmpV3.set(Math.cos(a), 0, Math.sin(a))).setPosition(splashAt.x + Math.cos(a) * r, Wd(675) - 0.3, splashAt.z + Math.sin(a) * r);
        fans.setMatrixAt(i, tmpM); fanF[i * 2 + 1] = k;
        const t = clamp(age * 1.8 - (j % 3) * 0.08, 0, 1), br = 8 + (30 + 9 * (j % 4)) * t; setBead(28 + j, splashAt.x + Math.cos(a + 0.3) * br, Wd(675) + (70 + 20 * (j % 3)) * t * (1 - t), splashAt.z + Math.sin(a + 0.3) * br, amp > 0 && t < 1 ? 0.75 : 0);
      }
      // the slap (the design: 'bow up and slapping down through two standing waves'): each hull comes off the
      // first wave and smacks into the trough behind it in a fan of spray, beads flying off the cream bow
      for (let j = 0; j < 2; j++) {
        const bo = j ? rival : cream, k = bellS(j ? rs : sb, 621, 637, 4), yw = bo.rotation.y, cy = Math.cos(yw), sy = Math.sin(yw);
        tmpM.makeBasis(tmpV.set(sy * 14, 0, cy * 14), tmpV2.set(cy * 3, 6 + 6 * k, -sy * 3), tmpV3.set(cy, 0, -sy)).setPosition(bo.position.x + cy * 4.5, bo.position.y + 0.3, bo.position.z - sy * 4.5);
        fans.setMatrixAt(fanSpots.length + 12 + j, tmpM); fanF[(fanSpots.length + 12 + j) * 2 + 1] = 1.3 * k;
      }
      for (let i = 40; i < NBEAD; i++) {
        const t = clamp((sb - 622) / 13, 0, 1), sgn = i % 2 ? 1 : -1, r = 2 + (5 + 2 * (i - 40)) * t, yw = cream.rotation.y, cy = Math.cos(yw), sy = Math.sin(yw);
        setBead(i, cream.position.x + cy * (4 + 3 * t) + sy * sgn * r, cream.position.y + 1 + (16 + 4 * (i - 40)) * t * (1 - t), cream.position.z - sy * (4 + 3 * t) + cy * sgn * r, t > 0 && t < 1 ? 0.5 : 0);
      }
      beadIM.needsUpdate = true; fanIM.needsUpdate = true; fans.geometry.attributes.aF.needsUpdate = true; damIM.needsUpdate = true;

      // dandelion parachutes, shed each time a drop strikes the head. The strikes are places on the flight, not
      // moments of the clock: one falls when the lens is 40 short of the head (s 150), the others every 3.4 seconds
      // of flight before and after it, so the seeds are lifting past as we come by whatever the clock reads
      for (let i = 0; i < 12; i++) {
        const T = 3.4, c = (sc - 110) / (T * SPEED), t = c - Math.floor(c), t0 = hash(i, 5) * 0.35, a = (t - t0) * T;
        tmpV.copy(seedHead);
        if (a > 0) { tmpV.addScaledVector(windN, a * (7 + 5 * hash(i, 7))); tmpV.y += 4.6 + a * (2.5 + 3 * hash(i, 9)) + Math.sin(a * 2 + i); tmpV.x += Math.sin(a * 1.7 + i * 2) * 1.5; }
        setBok(6 + i, tmpV, cCream, a > 0 ? 0.9 * (1 - t) : 0, 1.5);
      }
      bokGeo.attributes.aPos.needsUpdate = true; bokGeo.attributes.aCol.needsUpdate = true;

      walker.m.position.set(-95, 12, Math.max(-1100, -420 - time * 2.4)); walker.m.rotation.y = 0.05 * Math.sin(time * 0.5); walker.m.position.y = 12 + 1.5 * Math.abs(Math.sin(time * 3.2));
      for (let i = 0; i < 2; i++) walker.legs[i].rotation.x = (i ? 1 : -1) * 0.45 * Math.sin(time * 3.2);
      exitU.uK.value = 0.5 * smoothstep(380, 600, sc) * (1 - 0.75 * smoothstep(760, 860, sc)) * (L.hour === 'dawn' ? 0.6 : 1);
    }
    update(0, 0, { position: path.start, matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0);

    return {
      scene, path, duration: 40,
      // linger on the climb while the boats run ahead, hurry the drop back down to them
      pace: (u) => 1 - 0.12 * bellS(u, 0.36, 0.50, 0.04),
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 34, sway: 0.5, bank: 0.1 },
      pois: [{ at: gazeFn, from: -1, to: 2, fade: 0.01, weight: 0.96 }],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#FFD9A0', glow: 1, revealDistance: 300 },
      post: {
        exposure: L.exposure, bloom: { strength: 0.75, radius: 0.8, threshold: 0.82 },
        grade: { saturation: 0.98, contrast: 1.0, tint: '#fff7ec', shadowTint: '#10141e', vignette: 0.42, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
