// TWENTY FLOODS
// Twenty years in forty seconds, seen from the bow of a stone barge carrying a gold capstone up a
// dead-straight canal: the sun laps the sky as a racing bead, the floodplain drowns and greens and
// ripens and is cut again and again, palms shoot up, a town spreads, and the Great Pyramid (the hero,
// src/parts/twenty-floods.js) rises course by course and closes white. Time lands, in real time, on
// one flock of ibis, with the portal in the water gate dead ahead.
//
// Frame: the path runs straight down -Z from (0, 3.4, 0) to the gate at z = -360; water is y = 0.
// The flood is done by SINKING the land (uSink) so the path stays level. Everything that stands on
// the plain (palms, houses, reeds, quays, pylons) rides the same sinkAt() in its vertex shader.
// Three clocks, all pure functions of path u (plus a small bounded sway so that a parked camera
// still sees the lapse breathe; it can never outrun the u-driven rate): day phase, year, the hero's build.
//
// Seeded variations (ctx.vary honoured): landing hour (afternoon / golden / full-moon night), last
// year (flood mirror / emerald / gold harvest with dust devils), weather (clear / khamsin / cirrus),
// capstone (electrum / black granite with a gilded tip), town bank, one or three small pyramids,
// density. Rare event: a great comet in the night dips mid-build.
// Style: long exposure (own shaders), so style: 'none'. World-built vehicle, so ride: 'none'.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import { makeDustDevil } from '../kit/fx.js';
import { buildHero } from '../parts/twenty-floods.js';

const PALETTE = ['#6FB4E0', '#F6EFE0', '#D9A95B', '#8C5A32', '#2FA36B', '#4B3A7A', '#FFD25A'];
const LEN = 360, EYE = 3.4, SINK_MAX = 2.7, PYR = [220, 30, -700];
const HS = 1.15, PH = (146 * HS).toFixed(2);   // the hero stands 15% larger than life so its steps, ramp and casing line read from the canal
const BARGE_DY = -0.68, BARGE_DZ = -0.95;      // the bow sits low and forward so that it holds the lower quarter of the frame, not more
const TAU = Math.PI * 2;
const AV_OPEN = -38;                           // south of this the right row of the avenue opens: the window to the pyramid
// the Great Pyramid (and its small neighbours) stand turned PYR_PHI from the canal axis, so that both the ramp face and
// the east face are in view from the barge all the way to the landing: one face takes the afternoon sun, the other is in shade
const PYR_PHI = Math.PI / 4 + 0.33, PC = Math.cos(PYR_PHI).toFixed(6), PS = Math.sin(PYR_PHI).toFixed(6);

// ------------------------------------------------------------------------------------------ GLSL
const COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uShDir;
uniform vec3 uSunTrue, uZen, uHor, uGlow, uCloudLit, uCloudShade, uDiscCol;
uniform float uFogDen, uSink, uTime, uYear, uLapse, uTownX, uPalmH, uShadow, uAvGap;
uniform vec4 uPyr;       // great pyramid: x, z, half base, built height
uniform vec4 uSm[3];     // small pyramids: x, z, half base, height (0 = absent)
uniform vec4 uCloud;     // offset x, offset y, stretch, coverage
const float PC = ${PC}, PS = ${PS}, PH = ${PH}, HS = ${HS.toFixed(3)}, AVO = ${AV_OPEN.toFixed(1)};
float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm3(vec2 p){ return vn(p)*0.55 + vn(p*2.07 + 7.1)*0.28 + vn(p*4.3 + 3.3)*0.17; }
float sinkAt(vec2 p){ return uSink*smoothstep(-405.0, -345.0, p.y); }
float waterDist(vec2 p){
  float dc = max(abs(p.x) - 7.0, -(p.y + 238.0));
  vec2 q = abs(p - vec2(0.0, -300.0)) - vec2(80.0, 60.0);
  float db = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float dg = max(abs(p.x) - 7.0, abs(p.y + 368.0) - 10.0);
  return min(min(dc, db), dg);
}
// two hamlets on low mounds on the left bank (the right bank stays open towards the pyramid): islands when the flood is up
float hamletAt(vec2 p){
  const float hx = -24.0;
  vec2 a = (p - vec2(hx, -44.0))/vec2(11.0, 24.0), b = (p - vec2(hx, -152.0))/vec2(11.0, 26.0);
  return max(smoothstep(1.25, 0.5, length(a)), smoothstep(1.25, 0.5, length(b)));
}
float landH(vec2 p){
  float dw = waterDist(p);
  float quay = smoothstep(-226.0, -246.0, p.y);
  float top = mix(2.2, 3.2, quay);
  float field = 1.2 + 0.22*sin(p.x*0.021 + 1.3)*sin(p.y*0.017 + 0.4);
  vec2 tq = (p - vec2(uTownX, -172.0))/vec2(64.0, 128.0);
  field += 2.3*smoothstep(1.2, 0.55, length(tq));
  field += 2.5*hamletAt(p);
  float edge = mix(1.5, 0.45, quay);
  float h = mix(-3.0, top, smoothstep(-edge, edge, dw));
  h = mix(h, field, smoothstep(5.0 + quay*9.0, 13.0 + quay*13.0, dw));
  if (p.y < -360.0) {
    float n1 = vn(p*0.012), n2 = vn(p*0.045);
    float ext = 46.0*smoothstep(110.0, 205.0, p.x)*smoothstep(520.0, 340.0, p.x);
    float s = smoothstep(-405.0, -462.0 - ext, p.y + (n1 - 0.5)*40.0*(1.0 - ext/60.0) + (n2 - 0.5)*10.0);
    float pl = 30.0 + (n2 - 0.5)*1.2*smoothstep(240.0, 420.0, length(p - uPyr.xy));
    pl += smoothstep(-1150.0, -2000.0, p.y)*(30.0 + 110.0*vn(p*0.0016 + 3.0));
    float sc = mix(h, pl, s*s*(3.0 - 2.0*s));
    float ramp = mix(3.2, 30.0, clamp((-378.0 - p.y)/88.0, 0.0, 1.0));
    float cw = smoothstep(12.0, 8.0, abs(p.x))*smoothstep(-374.0, -382.0, p.y);
    h = mix(sc, min(sc, ramp) , cw);
  }
  return h;
}
// ray against a square pyramid turned 45 degrees (convex: 4 faces + the working top)
float pyrHit(vec3 o, vec3 d, vec4 py, float baseY, float fullH){
  vec3 q = o - vec3(py.x, baseY, py.y);
  q = vec3(q.x*PC + q.z*PS, q.y, q.z*PC - q.x*PS);
  vec3 e = vec3(d.x*PC + d.z*PS, d.y, d.z*PC - d.x*PS);
  float w = py.z, t0 = 0.0, t1 = 1.0e5, a, b;
  a = q.x*fullH + q.y*w - w*fullH; b = e.x*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) t0 = max(t0, -a/b); else if (a > 0.0) t1 = -1.0;
  a = -q.x*fullH + q.y*w - w*fullH; b = -e.x*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) t0 = max(t0, -a/b); else if (a > 0.0) t1 = -1.0;
  a = q.z*fullH + q.y*w - w*fullH; b = e.z*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) t0 = max(t0, -a/b); else if (a > 0.0) t1 = -1.0;
  a = -q.z*fullH + q.y*w - w*fullH; b = -e.z*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) t0 = max(t0, -a/b); else if (a > 0.0) t1 = -1.0;
  a = q.y - py.w; b = e.y;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) t0 = max(t0, -a/b); else if (a > 0.0) t1 = -1.0;
  return py.w > 0.5 ? smoothstep(0.0, 5.0, t1 - t0) : 0.0;
}
float pyrShadow(vec3 P){
  float s = pyrHit(P, uShDir, uPyr, 30.0, PH);
  s = max(s, pyrHit(P, uShDir, uSm[0], 30.0, uSm[0].w));
  s = max(s, pyrHit(P, uShDir, uSm[1], 30.0, uSm[1].w));
  s = max(s, pyrHit(P, uShDir, uSm[2], 30.0, uSm[2].w));
  return s;
}
// analytic shadows of the two palm rows of the avenue and the two markers at the basin mouth. A row stands at x = xr,
// one palm every gap metres counted from z = 28, between zmin and zmax
float rowShadow(vec2 p, float xr, vec2 s, float L, float gap, float zmin, float zmax){
  float sx = abs(s.x) < 0.04 ? 0.04 : s.x;
  float t = (xr - p.x)/sx;
  if (t < 0.0 || t > L*1.12) return 0.0;
  float bz = p.y + s.y*t;
  float zc = (fract((bz - 28.0)/gap + 0.5) - 0.5)*gap;
  if (bz - zc < zmin || bz - zc > zmax) return 0.0;
  float perp = abs(zc*sx);
  float trunk = smoothstep(0.42, 0.18, perp)*step(t, L*0.9);
  float crown = smoothstep(1.0, 0.35, length(vec2((t - L*0.94)/(0.28*uPalmH*max(L/uPalmH, 1.0)), perp/(0.3*uPalmH))));
  return max(trunk, crown*0.85);
}
float postShadow(vec2 p, vec2 base, vec2 s, float L, float w){
  vec2 v = base - p; float t = dot(v, s);
  if (t < 0.0 || t > L) return 0.0;
  return smoothstep(w, w*0.5, length(v - s*t));
}
float nearShadow(vec2 p){
  float hl = length(uShDir.xz);
  vec2 s = uShDir.xz/max(hl, 1e-3);
  float cot = min(hl/max(uShDir.y, 0.03), 14.0);
  float sh = max(rowShadow(p, 10.0, s, uPalmH*cot, 18.0, AVO, 34.0), rowShadow(p, -10.0, s, uPalmH*cot, 9.0, -237.0, 34.0));
  sh = max(sh, rowShadow(p, 10.0, s, uPalmH*0.62*cot, uAvGap, -237.0, AVO));     // the low palms of the open right bank, at the seeded rhythm
  sh = max(sh, postShadow(p, vec2(15.0, -241.0), s, 9.0*cot, 0.7));
  sh = max(sh, postShadow(p, vec2(-15.0, -241.0), s, 9.0*cot, 0.7));
  return sh;
}
// the two gate pylons (ray against a box a little inside the battered stone) and their four flagpoles
float boxSh(vec3 o, vec3 d, vec3 c, vec3 hb){
  vec3 dd = vec3(abs(d.x) < 0.02 ? 0.02 : d.x, max(d.y, 0.02), abs(d.z) < 0.02 ? 0.02 : d.z);
  vec3 t1 = (c - hb - o)/dd, t2 = (c + hb - o)/dd;
  vec3 lo = min(t1, t2), hi = max(t1, t2);
  float tn = max(max(lo.x, lo.y), max(lo.z, 0.0)), tf = min(min(hi.x, hi.y), hi.z);
  return smoothstep(0.0, 1.2, tf - tn);
}
float gateShadow(vec3 P){
  if (P.z > -150.0 || P.z < -400.0) return 0.0;
  float sh = max(boxSh(P, uShDir, vec3(11.6, 9.5, -364.5), vec3(3.8, 12.5, 4.1)), boxSh(P, uShDir, vec3(-11.6, 9.5, -364.5), vec3(3.8, 12.5, 4.1)));
  float hl = length(uShDir.xz);
  vec2 s = uShDir.xz/max(hl, 1e-3);
  float L = max(31.0 - P.y, 0.0)*min(hl/max(uShDir.y, 0.03), 14.0);
  sh = max(sh, postShadow(P.xz, vec2(9.3, -358.7), s, L, 0.5));
  sh = max(sh, postShadow(P.xz, vec2(13.9, -358.7), s, L, 0.5));
  sh = max(sh, postShadow(P.xz, vec2(-9.3, -358.7), s, L, 0.5));
  sh = max(sh, postShadow(P.xz, vec2(-13.9, -358.7), s, L, 0.5));
  return sh;
}
float cloudCov(vec2 uv){
  vec2 q = uv*vec2(mix(1.0, 0.34, uCloud.z), 1.0)*3.0 + uCloud.xy;
  return smoothstep(0.66 - uCloud.w*0.22, 0.86 - uCloud.w*0.22, fbm3(q) + 0.12*vn(q*5.0));
}
vec3 skyGrad(vec3 d){
  float y = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uHor, uZen, 1.0 - pow(1.0 - y, 3.2));
  vec2 dh = d.xz/max(length(d.xz), 1e-4), sh = uSunTrue.xz/max(length(uSunTrue.xz), 1e-4);
  float sa = max(dot(dh, sh), 0.0);
  c += uGlow*pow(1.0 - y, 5.0)*(0.3 + 0.7*sa*sa*sa);
  float sd = max(dot(d, uSunTrue), 0.0); sd *= sd; sd *= sd; sd *= sd;
  c += uDiscCol*(0.05*sd*sd + 0.012*sd)*smoothstep(-0.12, 0.05, uSunTrue.y);
  return c;
}
vec3 skyClouds(vec3 d){
  vec3 c = skyGrad(d);
  float y = max(d.y, 0.0);
  vec2 uv = d.xz/(y + 0.14)*0.5;
  float cv = cloudCov(uv)*smoothstep(0.1, 0.32, y);
  c = mix(c, mix(uCloudLit, uCloudShade, 0.3), cv*0.55);
  return c;
}
vec3 lit(vec3 alb, vec3 N, float sh){
  float ndl = max(dot(N, uSunDir), 0.0);
  return alb*(uSunCol*ndl*sh + mix(uGndCol, uSkyCol, N.y*0.5 + 0.5));
}
vec3 fogged(vec3 c, float dist){ float f = uFogDen*dist; return mix(uFogCol, c, exp(-f*f)); }
`;

const SKY_V = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition + position*4500.0, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_F = COMMON + /* glsl */`
uniform vec3 uArcE, uArcT, uArcA, uPole, uPoleX, uPoleY, uMoonDir, uCometDir, uCometTail;
uniform float uPhi, uStars, uStarRot, uStarArc, uMoon, uCirrus;
uniform vec2 uComet;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  vec3 col = skyGrad(d);
  if (uStars > 0.01 && d.y > -0.02) {
    float rho = acos(clamp(dot(d, uPole), -1.0, 1.0));
    float px = dot(d, uPoleX), py = dot(d, uPoleY);
    float th = atan(py, abs(px) < 1e-5 ? 1e-5 : px);
    float ring = floor(rho*110.0), fr = fract(rho*110.0);
    float hs = h21(vec2(ring, 3.7));
    float n = 4.0 + floor(hs*7.0);
    float tt = fract((th + uStarRot)/6.2831853 + hs)*n;
    float cell = floor(tt), ft = fract(tt);
    float lenA = max(uStarArc, 0.007/max(sin(rho), 0.06))*n/6.2831853;
    float hh = h21(vec2(ring*1.7 + 0.3, cell + 5.0));
    float st = step(ft, min(lenA, 0.92))*smoothstep(0.5, 0.2, abs(fr - 0.5)*2.6)*step(0.74, hh);
    st *= mix(1.0, 1.0 - ft/max(lenA, 1e-3)*0.6, step(0.03, uStarArc));
    col += vec3(0.85, 0.9, 1.0)*st*(1.1*(hh - 0.66))*uStars*smoothstep(-0.02, 0.1, d.y);
  }
  if (uMoon > 0.01) {
    float md = dot(d, uMoonDir);
    float ang = acos(clamp(md, -1.0, 1.0));
    float disc = smoothstep(0.03, 0.024, ang);
    float mm = max(md, 0.0); mm *= mm; mm *= mm; mm *= mm; mm *= mm; mm *= mm;
    col += uMoon*(vec3(0.9, 0.94, 1.0)*(2.6*disc*(0.8 + 0.2*vn(d.xy*90.0))) + vec3(0.35, 0.45, 0.8)*(mm*mm*0.5 + mm*0.08));
  }
  if (uComet.x > 0.01) {
    vec3 v = d - uCometDir;
    float al = dot(v, uCometTail), pe = length(v - al*uCometTail);
    float tail = smoothstep(uComet.y, 0.0, al)*step(0.0, al)*exp(-pe*pe/(0.00004 + al*al*0.012));
    col += vec3(0.8, 0.9, 1.0)*uComet.x*(exp(-dot(v, v)*14000.0)*3.5 + tail*0.9);
  }
  float y = max(d.y, 0.0);
  if (d.y > 0.0) {
    vec2 uv = d.xz/(y + 0.14)*0.5;
    float cv = cloudCov(uv)*smoothstep(0.015, 0.16, y);
    float thick = cloudCov(uv + uSunTrue.xz*0.06);
    vec3 cc = mix(uCloudLit, uCloudShade, thick*0.75);
    if (uCirrus > 0.01) {
      vec2 cu = d.xz/(y + 0.3)*vec2(0.5, 2.6) + uCloud.xy*0.3;
      float ci = smoothstep(0.56, 0.82, fbm3(cu + 11.0)*0.75 + 0.25*vn(cu*vec2(2.0, 9.0)))*smoothstep(0.03, 0.3, y)*uCirrus*smoothstep(0.3, 0.6, vn(cu*0.23 + 4.0));
      col = mix(col, uCloudLit + uGlow*0.9, ci*0.42);
    }
    col = mix(col, cc, cv*mix(0.92, 0.7, uCloud.z));
  }
  // the sun: a soft white disc in the real-time ends; in the lapse a long exposure of it, one steady band along its arc
  float sdot = dot(d, uSunTrue);
  float ang = acos(clamp(sdot, -1.0, 1.0));
  float vis = smoothstep(-0.03, 0.02, d.y);
  col += uDiscCol*(smoothstep(0.034, 0.018, ang) + 0.05*exp(-ang*ang/0.01))*vis*(1.0 - uLapse);
  if (uLapse > 0.01) {
    // a crisp arc of light where the sun has been all the long exposure, and on it the bead itself, racing, with a short comet tail
    float a = dot(d, uArcE), b = dot(d, uArcT), c = dot(d, uArcA);
    float al = max(sdot, 0.0);
    float band = (exp(-c*c/0.0005)*0.55 + exp(-c*c/0.012)*0.07)*smoothstep(0.02, 0.3, d.y)*(0.2 + 0.8*al*al);
    float psi = atan(b, abs(a) < 1e-5 ? 1e-5 : a);
    float dphi = mod(uPhi - psi + 3.14159265, 6.2831853) - 3.14159265;
    float tail = smoothstep(0.24 + 0.5*uLapse, 0.0, dphi)*step(0.0, dphi)*exp(-c*c/0.0024);
    float bead = exp(-(dphi*dphi + c*c)/0.0022);
    float halo = exp(-(dphi*dphi + c*c)/0.03);
    col += uDiscCol*(band + (tail*tail*0.4 + bead*1.25 + halo*0.07)*vis)*uLapse;
  }
  col = mix(col, uFogCol, smoothstep(0.035, -0.02, d.y));
  gl_FragColor = vec4(col, 1.0);
}`;

const LAND_V = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN;
void main(){
  vec2 p = position.xz;
  float h = landH(p);
  float e = 1.2;
  float hx = landH(p + vec2(e, 0.0)), hz = landH(p + vec2(0.0, e));
  vN = normalize(vec3(h - hx, e, h - hz));
  vP = vec3(p.x, h - sinkAt(p), p.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0);
}`;
const LAND_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN;
uniform float uDry;
vec3 fieldCol(vec2 p, out float wet){
  const float ca = 0.9801, sa = 0.1987;
  vec2 q = vec2(p.x*ca - p.y*sa, p.x*sa + p.y*ca)/vec2(46.0, 27.0);
  vec2 id = floor(q), f = fract(q);
  float hs = h21(id), hs2 = h21(id + 7.3);
  float off = (hs - 0.5)*0.13 + 0.035*sin(id.x*0.7 + id.y*1.3) + min(abs(p.x)/1400.0, 1.0)*0.07;
  float y = fract(uYear - off*1.1);
  float tex = vn(p*0.9), fineT = vn(p*4.7 + 2.0);
  // furrows run the length of each plot (a quarter of the plots are ploughed the other way)
  float fu = hs2 > 0.74 ? f.x*46.0 : f.y*27.0;
  float fw = clamp(1.0 - fwidth(fu)*1.3, 0.0, 1.0);
  float rows = mix(0.5, 0.5 + 0.5*sin(fu*4.4), fw);
  // basins: broader strips inside every plot (sown and watered a strip at a time), which still read where the furrows have blurred
  float fw2 = clamp(1.0 - fwidth(fu)*0.22, 0.0, 1.0);
  float basin = mix(0.5, h21(vec2(floor(fu/4.6), hs*17.0)), fw2);
  vec3 silt = vec3(0.22, 0.12, 0.055), haze = vec3(0.16, 0.25, 0.08), emer = vec3(0.06, 0.25, 0.09);
  vec3 gold = vec3(0.69, 0.4, 0.1), stub = vec3(0.6, 0.47, 0.25), dust = vec3(0.47, 0.34, 0.17);
  // the year, compressed between two long floods: silt, a haze of green, emerald, gold, cut in strips, cracked dust
  vec3 c = silt*(0.75 + 0.3*tex)*(0.86 + 0.28*rows);
  c = mix(c, mix(silt, haze, 0.25 + 0.75*rows), smoothstep(0.19, 0.25, y));
  vec3 em = mix(mix(emer, vec3(0.13, 0.25, 0.05), smoothstep(0.35, 0.9, hs2)*0.7), vec3(0.035, 0.19, 0.1), smoothstep(0.6, 1.0, hs)*0.6);   // every plot its own green
  c = mix(c, em*(0.7 + 0.34*tex + 0.2*fineT*fw)*(0.8 + 0.4*hs)*(0.8 + 0.34*rows)*(0.8 + 0.4*basin), smoothstep(0.24, 0.32, y));
  c = mix(c, gold*(0.74 + 0.3*tex + 0.16*fineT*fw)*(0.86 + 0.24*rows), smoothstep(0.37, 0.45, y));
  float strip = floor(f.y*7.0)/7.0;
  float cut = smoothstep(0.0, 0.012, y - (0.455 + 0.06*fract(strip*3.0 + hs)));
  // stubble: pale straw in close rows, with the darker earth showing between them
  vec3 stb = mix(stub*0.62, stub*1.08, mix(0.5, smoothstep(-0.2, 0.5, sin(fu*9.0)), fw*clamp(1.0 - fwidth(fu)*2.6, 0.0, 1.0)));
  c = mix(c, stb*(0.86 + 0.2*tex), cut);
  float dry = smoothstep(0.525, 0.575, y);
  float crack = smoothstep(0.035, 0.0, abs(vn(p*1.7) - 0.5))*0.5 + smoothstep(0.02, 0.0, abs(vn(p*0.45 + 9.0) - 0.5))*0.5;
  c = mix(c, dust*(0.85 + 0.25*tex)*(1.0 - 0.45*crack), dry*0.8);
  c *= 0.84 + 0.32*hs2;                                             // every plot its own value
  // plot bunds: a raised earth bank with a trodden crest, and a dark ditch at its foot
  float dd = min(min(f.x, 1.0 - f.x)*46.0, min(f.y, 1.0 - f.y)*27.0) + (tex - 0.5)*0.5;
  c = mix(c, vec3(0.1, 0.085, 0.05), 0.55*smoothstep(2.3, 1.7, dd)*smoothstep(1.1, 1.5, dd));
  c = mix(c, vec3(0.3, 0.2, 0.105)*(0.75 + 0.5*fineT), smoothstep(1.3, 1.0, dd));
  c = mix(c, vec3(0.5, 0.38, 0.22), 0.7*smoothstep(0.45, 0.25, dd));
  // irrigation ditches: a thread of standing water along one side of every plot and a feeder across it, glinting with the sky
  float dw1 = abs(f.x*46.0 - 3.4), dw2 = abs(f.y*27.0 - (8.0 + 11.0*hs));
  float aw = clamp(1.0 - fwidth(p.x + p.y)*0.5, 0.0, 1.0);
  float ditch = max(smoothstep(0.55, 0.3, dw1), smoothstep(0.34, 0.16, dw2)*step(0.4, hs2))*(1.0 - smoothstep(0.5, 0.56, y))*aw;
  float bankD = max(smoothstep(1.0, 0.55, dw1), smoothstep(0.7, 0.34, dw2)*step(0.4, hs2))*aw;
  c = mix(c, vec3(0.13, 0.09, 0.05), bankD*0.6);
  c = mix(c, (uZen*0.8 + uHor*0.25)*1.15, ditch*0.9);
  wet = (1.0 - smoothstep(0.1, 0.22, y)) + smoothstep(0.56, 0.62, y);
  return c;
}
// the scarp with the gullies and hard beds that are too fine for its mesh (shading only)
float scarpH(vec2 p, out float gul){
  float hh = landH(p);
  float m = smoothstep(4.5, 11.0, hh)*smoothstep(31.0, 25.0, hh);
  float g = abs(vn(vec2(p.x*0.105, p.y*0.03) + 4.0) - 0.5)*2.0;
  float g2 = abs(vn(vec2(p.x*0.29, p.y*0.075) + 9.0) - 0.5)*2.0;
  float led = smoothstep(0.3, 0.5, fract(hh*0.21 + vn(p*0.02)*0.8));
  gul = mix(1.0, smoothstep(0.0, 0.3, g)*(0.7 + 0.3*smoothstep(0.0, 0.3, g2)), m);
  return hh + m*((g - 0.5)*7.5 + (g2 - 0.5)*1.8 + led*1.3);
}
void main(){
  vec2 p = vP.xz;
  float h0 = landH(p), h = h0 - sinkAt(p);
  if (h < -0.03 && p.y > -420.0) discard;
  vec3 N = normalize(vN);
  float dist = length(vP - cameraPosition);
  float dw = waterDist(p), quay = smoothstep(-226.0, -246.0, p.y), wet;
  vec3 col = fieldCol(p, wet);
  float tex = vn(p*1.3), tex2 = vn(p*0.21);
  // town plinth and the hamlet mounds: trodden earth
  vec2 tq = (p - vec2(uTownX, -172.0))/vec2(64.0, 128.0);
  float trod = max(smoothstep(1.15, 0.8, length(tq)), smoothstep(0.25, 0.6, hamletAt(p)));
  col = mix(col, vec3(0.42, 0.29, 0.16)*(0.74 + 0.3*tex + 0.22*vn(p*5.0)), trod);
  // levee: a cut bank of bedded mud, a sod lip of grass breaking over it, a towpath on the crown; quay: dressed stone
  float near = smoothstep(150.0, 30.0, dist), near2 = smoothstep(70.0, 10.0, dist);
  float d6 = vn(p*6.0), d18 = vn(p*vec2(18.0, 5.0) + 3.0), d40 = vn(p*37.0 + 9.0), d7 = vn(p*7.0 + 1.7), d23 = vn(p*23.0 + 4.1);
  vec3 mud = vec3(0.31, 0.195, 0.1)*(0.6 + 0.4*tex + 0.24*d6 + near*(0.2*d18 - 0.1 + 0.16*d40 - 0.08) + near2*(0.17*d7 + 0.15*d23 - 0.16));
  float bedV = h0*2.1 + (d6 - 0.5)*0.5 + tex*0.4, bed = fract(bedV);
  float bedA = clamp(1.0 - fwidth(bedV)*0.7, 0.0, 1.0)*smoothstep(2.15, 1.7, h0);
  mud *= 1.0 + bedA*((h21(vec2(floor(bedV), 2.0)) - 0.5)*0.5 - 0.62*smoothstep(0.14, 0.0, bed));     // flood beds and the lines between them
  float rill = vn(vec2(p.y*2.6 + p.x*0.4, h0*0.35));
  mud *= 1.0 - 0.34*near*smoothstep(0.55, 0.8, rill)*smoothstep(2.1, 1.2, h0);                        // rain rills down the face
  mud = mix(mud, vec3(0.52, 0.37, 0.2), 0.34*smoothstep(0.62, 0.8, d18)*near*smoothstep(1.2, 2.0, h0));
  float season = 0.3*smoothstep(0.2, 0.6, fract(uYear + 0.75));
  float tuft = vn(vec2(p.y*1.9, p.x*0.6)), tuft2 = vn(vec2(p.y*8.0, p.x*2.5) + 5.0);
  float lip = 2.02 - 0.8*tuft - 0.3*tuft2*near;                                                        // where the sod hangs over the cut
  float gr = vn(p*0.7)*0.55 + vn(p*3.1 + 5.0)*0.3 + d18*0.15 + season;
  // near the eye the sward breaks into tussocks with a crisp, ragged edge (no soft blots), each with a dark foot
  float d5 = vn(p*5.3 + 1.0), d17 = vn(p*17.0 + 6.0);
  gr += near*(0.26*(d5 - 0.5) + 0.13*(d17 - 0.5)) + near2*0.07*(d40 - 0.5);
  float gw = mix(0.14, 0.035, near2);
  float gm = smoothstep(0.23 - gw, 0.23 + gw*0.4, gr), lipM = smoothstep(lip, lip + 0.1, h0);
  float grass = lipM*gm;
  mud *= 1.0 - 0.42*smoothstep(lip - 0.5, lip, h0)*(1.0 - grass);                                      // shadow under the lip
  mud *= 1.0 - 0.3*near*lipM*smoothstep(0.23 - gw - 0.1, 0.23 - gw, gr)*(1.0 - gm);                    // contact shadow round every tussock
  float blade = vn(vec2(p.x*31.0, p.y*7.0) + 2.0), blade2 = vn(vec2(p.x*9.0 + p.y*21.0, p.y*5.0 - p.x*3.0));
  float tus = h21(floor(p*2.3 + vec2(d6, d7)*1.5));
  vec3 gcol = mix(vec3(0.05, 0.13, 0.035), vec3(0.19, 0.26, 0.075), d6*0.6 + 0.4*d7)*(0.62 + 0.4*tex + near2*(0.6*blade - 0.3 + 0.44*blade2 - 0.22) + near*(0.36*d40 - 0.18 + 0.3*tus - 0.15));
  gcol *= 1.0 - 0.3*near*gm*(1.0 - smoothstep(0.23 + gw*0.4, 0.23 + gw*0.4 + 0.09, gr));                 // the edge of the sod is its darkest part
  gcol = mix(gcol, vec3(0.4, 0.34, 0.14)*(0.75 + 0.5*d23), (0.2 + 0.5*(0.3 - season)/0.3)*smoothstep(0.42, 0.75, vn(p*1.9 + 2.0)));
  mud = mix(mud, gcol, grass);
  float pathM = smoothstep(1.15, 0.7, abs(dw - 4.3) + (tex - 0.5)*0.8)*step(2.0, h0);
  float rut = smoothstep(0.16, 0.06, abs(abs(dw - 4.3) - 0.45));
  mud = mix(mud, vec3(0.5, 0.375, 0.215)*(0.78 + 0.22*d7 + 0.2*d23*near2)*(1.0 - 0.25*rut*near), pathM*0.85);
  vec3 stone = vec3(0.66, 0.58, 0.43)*(0.8 + 0.25*tex2 + 0.12*d6*near);
  vec2 bq = p/vec2(2.6, 1.4) + vec2(0.5*floor(p.y/1.4), 0.0);
  vec2 bj = fract(bq);
  stone *= 0.9 + 0.2*h21(floor(bq));
  stone *= 1.0 - 0.34*smoothstep(0.06, 0.02, min(bj.x, bj.y))*clamp(1.0 - fwidth(bq.y)*1.5, 0.0, 1.0);
  float bankM = 1.0 - smoothstep(9.0 + quay*10.0, 15.0 + quay*12.0, dw);
  col = mix(col, mix(mud, stone, quay), bankM*(1.0 - trod*(1.0 - smoothstep(9.0, 5.0, dw))));
  // far fields go to haze so the far bank is never one hard green line
  col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2)))*vec3(1.08, 1.0, 0.82), 0.62*smoothstep(45.0, 240.0, dist));
  // desert and scarp: bedded rock cut by gullies, a talus apron at its foot, sand on the plateau
  float des = smoothstep(4.5, 9.0, h0), gul = 1.0;
  float sv = h0*0.42 + vn(p*0.015)*1.6 + vn(p*0.13)*0.25, sb = fract(sv);
  float sa = clamp(1.0 - fwidth(sv)*1.4, 0.0, 1.0);
  if (des > 0.001) {
    const float e = 1.1;
    float g1, g2;
    float ha = scarpH(p, gul), hb = scarpH(p + vec2(e, 0.0), g1), hc = scarpH(p + vec2(0.0, e), g2);
    N = normalize(mix(N, normalize(vec3(ha - hb, e, ha - hc)), des));
    vec3 sand = mix(vec3(0.66, 0.47, 0.25), vec3(0.78, 0.62, 0.38), tex2)*(0.88 + 0.14*tex + 0.1*d6*near);
    vec3 rock = mix(vec3(0.69, 0.53, 0.32), vec3(0.81, 0.66, 0.43), mix(0.5, h21(vec2(floor(sv + (1.0 - gul)*0.9), 7.0)), sa*0.42))*(0.78 + 0.3*vn(vec2(p.x*0.9, p.y*0.31)) + 0.14*tex);
    vec3 rock0 = rock;
    sb = fract(sv + (1.0 - gul)*0.9);                                  // the beds sag into every gully: no ruled lines
    rock *= 1.0 + sa*(0.14*smoothstep(0.75, 1.0, sb) - 0.24*smoothstep(0.16, 0.0, sb));
    rock *= mix(0.52, 1.0, gul);
    rock *= 0.82 + 0.36*vn(vec2(p.x*0.06, p.y*0.02) + 2.0);           // buttresses catch the light, re-entrants hold shade
    float flu = vn(vec2(p.x*0.62, h0*0.07 + 3.0)), flu2 = vn(vec2(p.x*1.9 + 5.0, h0*0.16));
    rock *= 1.0 - (0.3*smoothstep(0.5, 0.82, flu) + 0.14*smoothstep(0.45, 0.8, flu2)*near)*smoothstep(8.0, 13.0, h0);   // rain flutes down the face
    rock *= 0.9 + 0.2*h21(vec2(floor(sv + (1.0 - gul)*0.9), floor(p.x*0.085 + 3.0*h21(vec2(floor(sv), 5.0)))))*sa;       // jointed beds: blocks, not ribbons
    rock = max(rock, rock0*0.74);                                      // gully, flute and joint together never go to mud
    float fanN = vn(vec2(p.x*0.034, 1.0));
    float talus = smoothstep(10.0 + 17.0*fanN*fanN + 5.0*(1.0 - gul), 6.0, h0);    // talus fans climb highest under the gullies
    vec3 scree = vec3(0.74, 0.59, 0.38)*(0.8 + 0.2*tex + 0.25*step(0.72, d7)*near)*(0.9 + 0.2*vn(vec2(p.x*0.4, h0*0.9)));
    rock = mix(rock, scree, talus*0.85);
    vec3 dcol = mix(rock, sand, smoothstep(26.5, 29.5, h0));
    dcol = mix(dcol, vec3(0.82, 0.75, 0.58), smoothstep(330.0, 170.0, length(p - uPyr.xy))*0.7*smoothstep(27.0, 29.5, h0));
    col = mix(col, dcol, des);
  }
  // wet band at the waterline and under a fresh flood
  float wlN = 0.05*vn(vec2(p.x + p.y, 0.3)*1.3);
  float wl = max(smoothstep(0.44 + wlN, 0.4 + wlN, h)*0.8, step(h, 0.16 + 0.07*vn(p*2.3 + uTime*0.25)))*step(p.y, 100.0)*(1.0 - des);   // soaked to a crisp wet line
  col = mix(col, vec3(0.6, 0.5, 0.36), 0.55*smoothstep(0.42 + wlN, 0.46 + wlN, h)*smoothstep(0.62 + wlN, 0.52 + wlN, h)*bankM*(1.0 - des));   // the pale tide mark of dried silt above it
  col *= mix(1.0, 0.36, max(wl, wet*0.45*(1.0 - des)*(1.0 - bankM)));
  col += vec3(0.5, 0.52, 0.5)*uSkyCol*smoothstep(0.1, 0.0, abs(h - 0.05))*(1.0 - des)*0.5;
  float sh = 1.0 - uShadow*max(pyrShadow(vP), max(nearShadow(p), gateShadow(vP))*(1.0 - des));
  sh *= 1.0 - 0.45*(1.0 - 0.65*des)*cloudCov(p*0.0011 + vec2(0.3, 0.7))*uShadow;
  vec3 c = lit(col, N, sh);
  c += col*(uSkyCol*0.45 + uSunCol*vec3(0.07, 0.065, 0.06))*bankM*(1.0 - quay)*(1.0 - des)*smoothstep(2.3, 1.2, h0);   // light off the water on the cut bank
  c += col*(uSunCol*vec3(0.58, 0.49, 0.35) + uGndCol*2.0 + uHor*0.12)*des*(1.0 - max(dot(N, uSunDir), 0.0))*(0.6 + 0.4*gul);   // sand-lit shade on the scarp, never mud grey
  c = mix(c, max(c, col*(uSunCol*0.64 + uSkyCol*0.6)), des);                // the cliff's own floor: pale honey even where it turns from the sun
  gl_FragColor = vec4(fogged(c, dist*(1.0 + 0.45*des*smoothstep(26.5, 20.0, h0))), 1.0);       // and the cliff sits a step back in the cream haze
}`;

const WATER_V = /* glsl */`
varying vec3 vP;
void main(){ vP = (modelMatrix*vec4(position, 1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0); }`;
const WATER_F = COMMON + /* glsl */`
varying vec3 vP;
uniform float uSilt, uRip, uLotus, uMirrorK, uLineY, uCapY, uRampHead, uCourseH, uDusk;
uniform vec3 uRampP[13];   // the hero's causeway + ramp polyline, in its own space
// like pyrHit, but returns where and on which face the ray enters (for the mirror image in the flood)
float pyrTrace(vec3 o, vec3 d, vec4 py, float baseY, float fullH, out vec3 nrm, out float tHit, out vec3 lp, out vec3 ln){
  vec3 q = o - vec3(py.x, baseY, py.y);
  q = vec3(q.x*PC + q.z*PS, q.y, q.z*PC - q.x*PS);
  vec3 e = vec3(d.x*PC + d.z*PS, d.y, d.z*PC - d.x*PS);
  float w = py.z, t0 = 0.0, t1 = 1.0e5, a, b, t; vec3 n = vec3(0.0, -1.0, 0.0);
  a = q.x*fullH + q.y*w - w*fullH; b = e.x*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(fullH, w, 0.0); } } else if (a > 0.0) t1 = -1.0;
  a = -q.x*fullH + q.y*w - w*fullH; b = -e.x*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(-fullH, w, 0.0); } } else if (a > 0.0) t1 = -1.0;
  a = q.z*fullH + q.y*w - w*fullH; b = e.z*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(0.0, w, fullH); } } else if (a > 0.0) t1 = -1.0;
  a = -q.z*fullH + q.y*w - w*fullH; b = -e.z*fullH + e.y*w;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(0.0, w, -fullH); } } else if (a > 0.0) t1 = -1.0;
  a = q.y - py.w; b = e.y;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(0.0, 1.0, 0.0); } } else if (a > 0.0) t1 = -1.0;
  a = -q.y; b = -e.y;
  if (b > 1e-5) t1 = min(t1, -a/b); else if (b < -1e-5) { t = -a/b; if (t > t0) { t0 = t; n = vec3(0.0, -1.0, 0.0); } } else if (a > 0.0) t1 = -1.0;
  nrm = normalize(vec3(n.x*PC - n.z*PS, n.y, n.x*PS + n.z*PC));
  tHit = t0; lp = q + e*t0; ln = normalize(n);
  return py.w > 0.5 ? smoothstep(0.0, 3.0, t1 - t0) : 0.0;
}
// the zigzag ramp on the south face (hero space +Z), as bands of mud brick up to the working head
float rampBand(vec3 lp){
  float m = 0.0;
  for (int k = 1; k < 12; k++) {
    vec3 A = uRampP[k], B = uRampP[k + 1];
    float dx = B.x - A.x; dx = abs(dx) < 0.5 ? 0.5 : dx;
    float t = (lp.x - A.x)/dx;
    if (t < 0.0 || t > 1.0 || float(k) + t > uRampHead) continue;
    float yr = mix(A.y, B.y, t);
    float dep = min(mix(12.0, 6.0, clamp(yr/146.0, 0.0, 1.0)), yr);
    m = max(m, step(yr - dep, lp.y)*step(lp.y, yr + 0.8)*(0.75 + 0.25*step(yr - 1.6, lp.y)));
  }
  return m;
}
// returns rgb = mirror image colour, a = coverage
vec4 mirrorPyr(vec3 o, vec3 R, vec4 py, float fullH, float lineY, float capY, float dist, float great){
  vec3 pn, lp, ln; float pt;
  float ph = pyrTrace(o, R, py, 30.0, fullH, pn, pt, lp, ln);
  if (ph < 0.01) return vec4(0.0);
  if (great > 0.5) lp /= HS;
  float y = lp.y;
  float cas = step(lineY, y);
  float crs = fract(y/max(uCourseH*2.0, 0.5));
  vec3 honey = vec3(0.8, 0.5, 0.16)*(0.66 + 0.34*step(0.42, crs))*(0.8 + 0.3*vn(vec2(lp.x + lp.z, y)*0.05));
  if (ln.y > 0.9) honey = vec3(0.78, 0.66, 0.44);                       // the working top
  vec3 alb = mix(honey, vec3(0.74, 0.7, 0.6)*(0.86 + 0.14*y/146.0), cas);
  if (great > 0.5 && ln.z > abs(ln.x) && ln.y < 0.9) {
    float rb = rampBand(lp);
    alb = mix(alb, vec3(0.19, 0.095, 0.04)*(0.8 + 0.4*step(lp.y - floor(lp.y/3.0)*3.0, 1.5)), rb*0.95);
  }
  alb = mix(alb, vec3(1.0, 0.64, 0.1), step(capY, y));
  float ndl = max(dot(pn, uSunDir), 0.0), bl = ndl*ndl; bl *= bl; bl *= bl;
  vec3 c = lit(alb, pn, 1.0) + alb*uSunCol*bl*2.5*cas;
  c *= mix(1.0, mix(0.78, 1.0, smoothstep(0.08, 0.45, ndl)), cas);                 // the casing's lit and shaded faces stay two values in the water
  c *= mix(1.0, 0.75, smoothstep(0.4, 0.6, uMirrorK)*(1.0 - cas));                 // raw stone stands dark on the clear flood mirror
  return vec4(fogged(c, dist + pt), ph*(1.0 - 0.3*clamp(y/146.0, 0.0, 1.0)));      // and the image thins towards its far end
}
uniform vec3 uBow;      // barge x, z, speed factor
// one row of avenue palms mirrored in the water: x = trunk line, y = crown blot. s = the reflected ray's heading, ct = its
// cotangent, H = palm height, b0 = height of the palm's foot above the water (a drowned foot is 0)
vec2 rowMir(vec2 p, float xr, vec2 s, float H, float ct, float b0, float gap, float zmin, float zmax){
  float sx = abs(s.x) < 0.04 ? (s.x < 0.0 ? -0.04 : 0.04) : s.x;
  float t = (xr - p.x)/sx - b0*ct, L = H*ct;
  if (t < 0.0 || t > L*1.2) return vec2(0.0);
  float bz = p.y + s.y*(xr - p.x)/sx;
  float zc = (fract((bz - 28.0)/gap + 0.5) - 0.5)*gap;
  if (bz - zc < zmin || bz - zc > zmax) return vec2(0.0);
  float perp = abs(zc*sx), cw = 0.3*H;
  float trunk = smoothstep(0.5, 0.2, perp)*step(t, L*0.92);
  float crown = smoothstep(1.0, 0.45, length(vec2((t - L*0.95)/(cw*max(ct, 1.0)), perp/cw)));
  return vec2(trunk, crown);
}
// the earth bunds between the plots (the same grid the land draws)
float bundD(vec2 p){
  const float ca = 0.9801, sa = 0.1987;
  vec2 f = fract(vec2(p.x*ca - p.y*sa, p.x*sa + p.y*ca)/vec2(46.0, 27.0));
  return min(min(f.x, 1.0 - f.x)*46.0, min(f.y, 1.0 - f.y)*27.0);
}
void main(){
  vec2 p = vP.xz;
  float h = landH(p) - sinkAt(p);
  float dist = length(vP - cameraPosition);
  vec3 V = (cameraPosition - vP)/max(dist, 1e-3);
  float t = uTime;
  float att = 1.0/(1.0 + dist*0.018);
  vec2 pw = p + (vec2(vn(p*0.45 + t*0.08), vn(p*0.45 + 7.3 - t*0.08)) - 0.5)*2.2;
  vec2 n = vec2(0.8, 0.6)*cos(dot(pw, vec2(0.8, 0.6))*2.3 + t*1.9);
  n += vec2(-0.5, 0.86)*cos(dot(pw, vec2(-0.5, 0.86))*3.7 + t*2.6)*0.7;
  n += vec2(0.2, -0.98)*cos(dot(pw, vec2(0.2, -0.98))*6.1 - t*3.4)*0.5;
  n += vec2(-0.9, -0.4)*cos(dot(pw, vec2(-0.9, -0.4))*1.2 + t*1.1)*0.6;
  n *= uRip*0.42*att;
  // bow wave: a V of crests off the stem and a boil under it
  float bz = p.y - uBow.y, bx = abs(p.x - uBow.x);
  float vee = exp(-pow((bx - (0.6 + max(bz + 5.0, 0.0)*0.42))/0.5, 2.0))*smoothstep(-6.5, -4.5, bz)*exp(-max(bz + 5.0, 0.0)*0.07);
  float vee2 = exp(-pow((bx - (0.2 + max(bz + 2.0, 0.0)*0.42))/0.7, 2.0))*smoothstep(-3.5, -1.5, bz)*exp(-max(bz + 2.0, 0.0)*0.09);
  float wake = (vee + vee2*0.6)*uBow.z*(0.6 + 0.4*vn(p*2.5 + vec2(0.0, t*3.0)));
  n.x += sign(p.x - uBow.x)*wake*0.35;
  vec3 N = normalize(vec3(n.x, 1.0, n.y));
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.002; R = normalize(R);
  // rough water mirrors the sky above the haze, not the cream horizon: lift the ray and lean to the zenith blue
  vec3 refl = skyClouds(normalize(R + vec3(0.0, 0.16, 0.0)))*vec3(0.74, 0.8, 0.88);
  refl = mix(refl, uZen*0.92, 0.44);
  // a value ramp over the sheet: deep zenith under the bow, the pale horizon haze where the water runs out at a grazing angle
  float gz = 1.0 - max(V.y, 0.0); gz *= gz; gz *= gz; gz *= gz;
  refl = mix(refl, skyGrad(normalize(vec3(R.x, R.y + 0.02, R.z)))*vec3(0.9, 0.92, 0.95), gz*(0.22 + 0.3*uMirrorK));
  refl *= 1.0 - 0.22*(1.0 - gz)*uMirrorK;
  vec3 o3 = vec3(p.x, 0.0, p.y);
  // the pyramids stand on their own reflections: traced with the ripples calmed so steps, ramp and edges stay readable
  vec3 Rm = reflect(-V, normalize(vec3(n.x*0.07, 1.0, n.y*0.22 - wake*0.1))); Rm.y = abs(Rm.y) + 0.002;
  // ... but never a cut-out: slow swells shift and stretch the image, so its edges waver
  float wz = dot(p, vec2(0.12, 1.0))*1.7 + (vn(p*0.13 + vec2(0.0, t*0.07)) - 0.5)*9.0;
  float wA = 0.004 + 0.035*uRip;
  Rm.x += wA*(sin(wz + t*1.1) + 0.5*smoothstep(60.0, 20.0, dist)*sin(wz*2.3 - t*1.7));
  Rm.y *= 1.0 + 3.0*wA*sin(wz*0.8 + t*0.9 + 1.0);
  Rm = normalize(Rm);
  vec4 mi = mirrorPyr(o3, Rm, uPyr, PH, uLineY, uCapY, dist, 1.0);
  if (mi.a < 0.5) {
    vec4 m2 = mirrorPyr(o3, Rm, uSm[0], uSm[0].w, -1.0, 1.0e4, dist, 0.0); if (m2.a > mi.a) mi = m2;
    m2 = mirrorPyr(o3, Rm, uSm[1], uSm[1].w, -1.0, 1.0e4, dist, 0.0); if (m2.a > mi.a) mi = m2;
    m2 = mirrorPyr(o3, Rm, uSm[2], uSm[2].w, -1.0, 1.0e4, dist, 0.0); if (m2.a > mi.a) mi = m2;
  }
  float streak = 0.9 + 0.1*cos(dot(pw, vec2(0.15, 1.0))*5.0 + t*1.3);     // ripple glints breaking the image
  refl = mix(refl, mi.rgb*streak, mi.a);
  float palmM = 0.0;
  if (p.y > -260.0 && p.y < 60.0 && abs(p.x) < 130.0) {     // the avenue stands on its reflection: trunk lines and crown blots, broken by the ripples
    vec2 rh = Rm.xz; float rl = max(length(rh), 1e-3); rh /= rl;
    float ct = min(rl/max(Rm.y, 0.02), 30.0), b0 = max(2.05 - uSink, 0.0);
    vec2 pp = p + n*4.0 + vec2(0.0, 0.2*sin(wz*1.3 + t));
    vec2 pm = max(rowMir(pp, 10.0, rh, uPalmH, ct, b0, 18.0, AVO, 34.0), rowMir(pp, -10.0, rh, uPalmH, ct, b0, 9.0, -237.0, 34.0));
    pm = max(pm, rowMir(pp, 10.0, rh, uPalmH*0.62, ct, b0, uAvGap, -237.0, AVO));
    palmM = max(pm.x, pm.y*(0.75 + 0.25*vn(pp*1.4)))*smoothstep(130.0, 80.0, abs(p.x));
    vec3 pc = mix(vec3(0.2, 0.15, 0.1), vec3(0.045, 0.085, 0.05), step(pm.x, pm.y*0.9));
    refl = mix(refl, fogged(lit(pc, vec3(0.0, 1.0, 0.0), 1.0), dist), palmM*(0.45 + 0.4*uMirrorK));
  }
  // the scarp is too far for a mirror copy: reflect it analytically as a lit band
  if (R.z < -0.02) {
    float tt = (-432.0 - p.y)/R.z, yh = R.y*tt;
    float m = smoothstep(31.0, 25.0, yh + vn(vec2(p.x + R.x*tt, 3.0)*0.02)*6.0)*step(0.0, tt);
    vec3 sc = lit(vec3(0.7, 0.56, 0.36), normalize(vec3(0.0, 0.7, 0.7)), 1.0) + vec3(0.7, 0.56, 0.36)*uSunCol*vec3(0.24, 0.19, 0.13);
    refl = mix(refl, fogged(sc, dist + tt)*vec3(0.8, 0.84, 0.92), m*0.5);      // broken by the ripples: half scarp, half sky
  }
  if (R.z < -0.02 && p.y > -360.0) {     // the gate pylons, their lintel and the glow of the portal between them
    float tt = (-360.0 - p.y)/R.z, yh = R.y*tt, xh = abs(p.x + R.x*tt);
    float py = step(7.4 + yh*0.016, xh)*step(xh, 15.8 - yh*0.016)*step(yh, 23.7);
    float li = step(xh, 8.2)*step(8.3, yh)*step(yh, 13.0);
    vec3 st = lit(vec3(0.66, 0.58, 0.42), vec3(0.0, 0.0, 1.0), 1.0);
    refl = mix(refl, fogged(st, dist + tt)*0.85, max(py, li)*0.92);
    float po = smoothstep(7.5, 5.0, xh)*smoothstep(8.2, 5.5, yh);
    refl = mix(refl, vec3(1.0, 0.82, 0.55)*0.95, po*0.8);
  }
  refl *= 1.0 - 0.38*uDusk;                                              // the dusk mirror never clips to white
  float fr = 0.04 + 0.96*pow(1.0 - max(dot(N, V), 0.0), 5.0);
  fr = mix(fr, 1.0, 0.28 + 0.4*uMirrorK);
  fr = max(fr, max(mi.a, palmM)*mix(0.8, 0.94, uMirrorK));
  vec3 amb = uSunCol*max(uSunDir.y, 0.0) + uSkyCol;
  float silt = uSilt*mix(1.0, 0.45, smoothstep(-225.0, -250.0, p.y));          // the basin settles clear before the canal does
  vec3 body = mix(vec3(0.025, 0.09, 0.1), vec3(0.23, 0.13, 0.062), silt)*amb;
  body = mix(body, vec3(0.3, 0.17, 0.07)*amb, smoothstep(1.3, 0.0, -h)*(0.6 - 0.4*uMirrorK));
  vec3 col = mix(body, refl, fr);
  float sdot = max(dot(R, uSunTrue), 0.0);
  float s2 = sdot*sdot; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;      // ^32
  float s3 = s2*s2; s3 *= s3; s3 *= s3;                              // ^256
  col += uDiscCol*(s3*s3*2.4 + s3*0.2 + s2*0.025)*smoothstep(-0.02, 0.05, uSunTrue.y)*(1.0 - 0.45*uDusk);
  // a flood never hides the land's lines: the bunds between the plots and the crown of the levee stand a hand proud of the
  // water as threads of wet earth and grass tips, so the mirror is crossed by the drowned country
  if (h < 0.0 && p.y > -236.0 && p.y < 300.0 && dist < 700.0) {
    float dwc = waterDist(p), tx = vn(p*0.9), tx2 = vn(p*2.6 + 4.0);
    float wdt = 0.5 + dist*0.007;
    float dyke = smoothstep(wdt, wdt*0.45, bundD(p) + (tx - 0.5)*0.5)*smoothstep(15.0, 20.0, dwc)*smoothstep(0.3, 0.5, vn(p*0.05 + 2.0));
    float crest = smoothstep(1.25, 0.6, abs(dwc - 4.4) + (tx - 0.5)*1.1)*smoothstep(0.16, 0.3, vn(vec2(p.y*0.06, p.x > 0.0 ? 3.0 : 9.0)));
    float em = max(dyke, crest)*smoothstep(0.02, 0.14, -h)*smoothstep(700.0, 350.0, dist);
    vec3 earth = mix(vec3(0.2, 0.13, 0.07), vec3(0.34, 0.25, 0.14), tx2*crest);
    earth = mix(earth, vec3(0.085, 0.13, 0.05)*(0.6 + 0.7*tx2), smoothstep(0.4, 0.7, vn(p*3.3 + 7.0)*0.6 + vn(p*0.7 + 2.0)*0.4)*0.7);     // grass and reed tips
    col = mix(col, lit(earth, vec3(0.0, 1.0, 0.0), 1.0), em);
  }
  col *= 1.0 - 0.6*uShadow*max(nearShadow(p), gateShadow(o3));
  // lotus pads in the last, real-time flood
  if (uLotus > 0.01 && dist < 160.0) {
    vec2 g = p/1.7, id = floor(g), f = fract(g) - 0.5;
    float hs = h21(id), hs2 = h21(id + 17.0);
    vec2 c = (vec2(hs, hs2) - 0.5)*0.5;
    float r = 0.16 + 0.2*hs2;
    float dd = length(f - c);
    float shal = max(smoothstep(2.4, 0.5, -h), smoothstep(0.5, 0.72, vn(p*0.05 + 3.0)))*smoothstep(0.05, 0.3, -h);
    float notch = step(0.25, abs(atan(f.y - c.y, f.x - c.x + 1e-4) - hs*6.0 + 3.0));
    float pad = smoothstep(r, r - 0.06, dd)*step(hs, 0.2 + 0.5*shal)*shal*notch*uLotus;
    col = mix(col, lit(vec3(0.07, 0.3, 0.1)*(0.7 + 0.6*hs2), vec3(0.0, 1.0, 0.0), 1.0) + refl*0.06, pad);
  }
  float foam = smoothstep(0.24, 0.0, -h)*(0.45 + 0.55*vn(p*3.0 + t*0.6)) + wake*0.8;
  col = mix(col, vec3(0.7, 0.66, 0.58)*amb, clamp(foam, 0.0, 1.0)*0.75);
  if (h > 0.0) col = vec3(0.15, 0.085, 0.035)*amb;
  gl_FragColor = vec4(fogged(col, dist), 1.0);
}`;

// palms: instanced, growing from a birth year, riding the sinking land, swaying
const PALM_V = COMMON + /* glsl */`
attribute vec4 aI;     // x, z, base height, size
attribute vec4 aJ;     // birth year, rotation, phase, hue
attribute vec3 aW;     // u along frond, v across (-1..1), frond flag
varying vec3 vP; varying vec3 vN; varying vec3 vW; varying float vHue; varying float vS;
void main(){
  float age = uYear - aJ.x;
  float g = mix(0.16, 1.0, smoothstep(0.0, 9.0, age))*smoothstep(-0.4, 0.3, age);
  vec3 p = position;
  float ph = aJ.z*6.2831853;
  float sw = sin(uTime*1.1 + ph)*0.6 + sin(uTime*0.43 + ph*1.7)*0.4;
  p.xz += vec2(0.8, 0.45)*sw*0.05*p.y*p.y;
  float fz = max(aW.z, 0.0)*aW.x;
  p.y += fz*sin(uTime*2.6 + ph + position.x*9.0 + position.z*7.0)*0.035;
  p.xz += fz*vec2(0.8, 0.45)*(0.04 + 0.03*sin(uTime*1.9 + ph*2.0));
  float cr = cos(aJ.y), sr = sin(aJ.y);
  p = vec3(p.x*cr + p.z*sr, p.y, -p.x*sr + p.z*cr);
  vec3 nn = vec3(normal.x*cr + normal.z*sr, normal.y, -normal.x*sr + normal.z*cr);
  vec2 b = aI.xy;
  vP = vec3(b.x, aI.z - sinkAt(b), b.y) + p*aI.w*g;
  vN = nn; vW = aW; vHue = aJ.w; vS = aI.w*g;
  gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0);
}`;
const PALM_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vW; varying float vHue; varying float vS;
void main(){
  vec3 N = normalize(vN); vec3 alb;
  float dist = length(vP - cameraPosition);
  vec3 V = (cameraPosition - vP)/max(dist, 1e-3);
  if (vW.z > 0.5) {
    // a feather: leaflets raked back from a pale midrib, narrow at the stalk and pointed at the tip
    float s = vW.x, v = abs(vW.y);
    float prof = smoothstep(0.0, 0.12, s)*(1.0 - s*s*s*0.9);
    float fq = 21.0, cut = fract(s*fq - v*2.6);
    float fine = clamp(1.0 - fwidth(s*fq)*0.8, 0.0, 1.0);
    float tooth = mix(0.7, 0.3 + 0.7*smoothstep(0.14, 0.4, cut)*smoothstep(1.0, 0.78, cut), fine);
    float edge = prof*tooth + 0.04 - v;
    if (edge < 0.0) discard;
    float ndl = dot(N, uSunDir), nv = dot(N, V);
    float under = step(nv*sign(ndl + 1e-4), 0.0);                                    // we are looking at the side the sun is not on
    // palette green #2FA36B pulled a third of the way to olive: never lime
    alb = mix(vec3(0.03, 0.06, 0.04), vec3(0.085, 0.14, 0.078), 0.35 + 0.65*vHue)*(0.6 + 0.5*s);
    alb = mix(alb, vec3(0.2, 0.24, 0.1), smoothstep(0.1, 0.0, v)*0.6);              // midrib
    alb *= 0.78 + 0.34*cut*fine;
    alb = mix(alb, vec3(0.36, 0.27, 0.1), smoothstep(0.7, 1.0, vHue)*0.5*step(vN.y, 0.3));   // old hanging fronds dry out
    float thru = max(dot(-V, uSunDir), 0.0); thru *= thru; thru *= thru;
    vec3 c = alb*(uSunCol*mix(abs(ndl)*0.95 + 0.08, abs(ndl)*0.34 + 0.1, under) + mix(uGndCol, uSkyCol, 0.5 + 0.4*N.y)*mix(1.0, 0.85, under));
    c += vec3(0.46, 0.52, 0.3)*alb*uSunCol*(thru*1.2 + under*(0.7*abs(ndl) + 0.2));       // sun through the leaflets
    c += alb*uSunCol*1.3*pow(1.0 - abs(nv), 3.0)*max(ndl, 0.0);                    // sun rim along the folded edge
    c += uSkyCol*0.1*pow(1.0 - abs(nv), 3.0);
    gl_FragColor = vec4(fogged(c, dist), 1.0);
    return;
  }
  // trunk: diamond scars of old leaf bases, darker towards the crown boss
  float a = vW.x*10.0, hgt = vW.y*vS*1.5;
  float d1 = abs(fract(a + hgt) - 0.5), d2 = abs(fract(a - hgt) - 0.5);
  float fine = clamp(1.0 - fwidth(hgt)*1.5, 0.0, 1.0);
  float scar = smoothstep(0.1, 0.0, min(d1, d2));
  float cell = h21(floor(vec2(a + hgt, a - hgt)));
  alb = mix(vec3(0.3, 0.215, 0.13), vec3(0.4, 0.31, 0.2), cell*fine)*(0.86 + 0.14*step(0.5, fract(hgt*0.5)));
  alb *= 1.0 - 0.5*scar*fine;
  alb = mix(alb, vec3(0.1, 0.075, 0.045), vW.z < -0.5 ? 0.85 : smoothstep(0.86, 0.99, vW.y)*0.6);
  if (vW.z < -1.5) alb = mix(vec3(0.07, 0.05, 0.06), vec3(0.5, 0.2, 0.04)*(0.6 + 0.8*vn(vP.xy*9.0 + vP.z*7.0)), clamp(dot(uSunCol, vec3(0.4)), 0.12, 1.0));          // date clusters, amber under the crown
  alb = mix(alb, vec3(0.12, 0.09, 0.05), smoothstep(0.06, 0.0, vW.y)*0.6);
  vec3 c = lit(alb, N, 1.0) + alb*uSkyCol*0.5*pow(1.0 - max(dot(N, V), 0.0), 3.0);
  gl_FragColor = vec4(fogged(c, dist), 1.0);
}`;

// props: houses (instanced, born in a year), stone work, small pyramids, shadufs
const PROP_V = COMMON + /* glsl */`
attribute vec3 color;
attribute vec2 aM;      // ride the sinking land (0/1), surface kind
#ifdef INST
attribute vec4 aI;      // x, y, z, rotation
attribute vec4 aJ;      // sx, sy, sz, birth year
attribute vec4 aC;      // tint rgb, phase
#endif
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec2 vM;
void main(){
  vec3 p = position, nn = normal; vC = color; vM = aM; vL = position;
#ifdef INST
  float grow = smoothstep(aJ.w, aJ.w + 0.7, uYear);
  #ifdef NOD
    float sp = 1.1 + 4.2*uLapse;
    float an = sin(uTime*sp + aC.w*6.2831853)*0.5 - 0.15;
    float ca = cos(an), sa = sin(an);
    p = mix(p, vec3(p.x, p.y*ca - p.z*sa, p.y*sa + p.z*ca), aM.y);
    nn = mix(nn, vec3(nn.x, nn.y*ca - nn.z*sa, nn.y*sa + nn.z*ca), aM.y);
    p.y += (1.0 - aM.y)*0.0;
  #endif
  p *= aJ.xyz*vec3(1.0, grow, 1.0);
  vL = p;
  float cr = cos(aI.w), sr = sin(aI.w);
  p = vec3(p.x*cr + p.z*sr, p.y, -p.x*sr + p.z*cr) + aI.xyz;
  nn = vec3(nn.x*cr + nn.z*sr, nn.y, -nn.x*sr + nn.z*cr);
  vC *= aC.rgb;
  if (grow < 0.002) p = vec3(0.0, -50.0, 0.0);
  p.y -= sinkAt(aI.xz);
#else
  p.y -= aM.x*sinkAt(p.xz);
#endif
  vP = p; vN = nn;
  gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0);
}`;
const PROP_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec2 vM;
float rbox(vec2 p, vec2 c, vec2 h){ vec2 d = abs(p - c) - h; return step(max(d.x, d.y), 0.0); }
// one cell of a carved register (2.0 m wide, 4.8 m tall, q.x from -1 to 1): a striding figure with a staff, or a column of signs
float relief(vec2 q, float hsh){
  float m = 0.0;
  if (hsh < 0.3) {
    float gy = q.y/0.62, gi = floor(gy), gh = h21(vec2(gi, hsh*91.0));
    vec2 g = vec2(q.x, (fract(gy) - 0.5)*0.62);
    float sg = gh < 0.33 ? rbox(g, vec2(0.0), vec2(0.2, 0.09)) : gh < 0.66 ? step(length(g), 0.17) - step(length(g), 0.08) : rbox(g, vec2(0.0), vec2(0.07, 0.2)) + rbox(g, vec2(0.0, 0.13), vec2(0.2, 0.05));
    m = sg*step(0.6, q.y)*step(q.y, 4.2);
    m = max(m, (step(abs(abs(q.x) - 0.42), 0.035))*step(0.4, q.y)*step(q.y, 4.4));
  } else {
    float tall = step(0.65, hsh);
    m = rbox(q, vec2(-0.17, 1.2), vec2(0.085, 0.75)) + rbox(q, vec2(0.2, 1.2), vec2(0.085, 0.75));               // striding legs
    m = max(m, step(abs(q.x), 0.4 - (q.y - 1.75)*0.3)*step(1.75, q.y)*step(q.y, 2.35));                          // kilt
    m = max(m, step(abs(q.x), 0.2 + (q.y - 2.3)*0.17)*step(2.3, q.y)*step(q.y, 3.2));                            // torso to the shoulders
    m = max(m, step(length(q - vec2(0.05, 3.5)), 0.23));                                                           // head
    m = max(m, rbox(q, vec2(0.02, 3.95 + 0.1*tall), vec2(0.15 - 0.04*tall, 0.22 + 0.14*tall)));                   // crown
    m = max(m, rbox(q, vec2(0.68, 2.2), vec2(0.035, 1.75)));                                                       // staff
    vec2 pa = q - vec2(0.3, 3.0), ba = vec2(0.38, -0.3);
    m = max(m, step(length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0)), 0.075));                             // the arm that holds it
  }
  return clamp(m, 0.0, 1.0);
}
void main(){
  vec3 N = normalize(vN); vec3 alb = vC;
#ifdef HOUSE
  // mud-brick: a dark door, a couple of window slits, a paler roof
  float wall = step(abs(N.y), 0.5)*step(vM.y, 0.5);
  vec2 f = vec2(abs(N.x) > 0.5 ? vL.z : vL.x, vL.y);
  float door = step(abs(f.x - 0.4), 0.45)*step(f.y, 1.9);
  float win = step(abs(fract(f.x*0.45 + 0.2) - 0.5), 0.09)*step(abs(f.y - 2.3), 0.28);
  float frame = step(abs(f.x - 0.4), 0.62)*step(f.y, 2.08)*(1.0 - door);
  alb *= 1.0 + wall*0.2*frame;                                                      // limewashed door surround
  alb *= 1.0 - wall*0.78*max(door, win);
  alb = mix(alb, vec3(0.16, 0.1, 0.06), wall*step(abs(f.x - 0.4), 0.72)*step(abs(f.y - 2.05), 0.1));   // timber lintel
  alb = mix(alb, vec3(0.16, 0.1, 0.06), wall*step(abs(fract(f.x*0.45 + 0.2) - 0.5), 0.13)*step(abs(f.y - 2.64), 0.05)*0.8);
  float crs = clamp(1.0 - fwidth(vL.y)*3.0, 0.0, 1.0)*smoothstep(0.4, 0.5, abs(fract(vL.y/0.34) - 0.5));
  alb *= mix(1.0, (0.78 + 0.3*vn(vP.xz*0.9 + vP.y))*(1.0 - 0.14*crs), wall);
  alb *= mix(1.0, 0.72 + 0.28*smoothstep(0.0, 1.1, vL.y), wall);                  // damp, splashed foot of the wall
  float stain = vn(vec2(f.x*1.7 + vP.x, f.y*0.25));                               // rain streaks and patched plaster
  alb *= mix(1.0, 0.86 + 0.26*stain, wall);
  alb = mix(alb, alb*vec3(1.22, 1.16, 1.02), wall*smoothstep(0.6, 0.75, vn(vP.xz*0.35 + f.y*0.4))*0.6);
  alb = mix(alb, alb*1.25 + 0.03, step(0.5, N.y));
#else
  alb *= 0.85 + 0.25*vn(vP.xz*0.6 + vP.y*0.8);
  if (vM.y > 2.5) {            // cavetto cornice: painted leaf stripes, red, blue-green and bare stone
    float cu = (abs(N.z) > abs(N.x) ? vP.x : vP.z)/0.5, k = mod(floor(cu), 4.0);
    float aa = clamp(1.0 - fwidth(cu)*1.2, 0.0, 1.0);
    vec3 pc = k < 0.5 ? vec3(0.5, 0.13, 0.06) : k < 2.5 && k > 1.5 ? vec3(0.08, 0.27, 0.3) : alb*1.05;
    alb = mix(alb*0.92, pc*(0.8 + 0.3*vn(vP.xy*2.0 + vP.z)), 0.72*aa);
    alb *= 1.0 - 0.3*aa*smoothstep(0.38, 0.5, abs(fract(cu) - 0.5));
  } else if (vM.y > 1.5) {     // dressed masonry: block courses, sunk-relief registers, flagpole niches, cornice shadow
    float front = step(0.5, abs(N.z)), wallF = step(abs(N.y), 0.5);
    float uw = mix(vP.z, vP.x, front);
    float fine = clamp(1.0 - fwidth(vP.y)*0.7, 0.0, 1.0), fine2 = clamp(1.0 - fwidth(vP.y)*1.6, 0.0, 1.0);
    vec2 bq = vec2(uw/2.3 + 0.5*floor(vP.y/1.15), vP.y/1.15), bj = fract(bq);
    alb *= 0.93 + 0.14*h21(floor(bq))*fine;
    alb *= 1.0 - 0.22*fine*wallF*smoothstep(0.05, 0.015, min(bj.x*2.0, bj.y));
    float tower = step(7.2, abs(vP.x))*wallF;
    float reg = (vP.y - 5.4)/4.8, row = floor(reg);
    float inReg = step(0.0, reg)*step(reg, 3.0)*tower;
    vec2 rq = vec2(uw/2.0 + row*0.37, 0.0);
    float cid = floor(rq.x), hh = h21(vec2(cid, row + 3.0));
    vec2 q = vec2((fract(rq.x) - 0.5)*2.0*(vP.x > 0.0 ? -1.0 : 1.0), fract(reg)*4.8);
    float m0 = relief(q, hh), m1 = relief(q + vec2(0.03, 0.08), hh);
    alb *= 1.0 - inReg*fine2*(0.2*m0 + 0.34*clamp(m0 - m1, 0.0, 1.0) - 0.22*clamp(m1 - m0, 0.0, 1.0));
    alb *= 1.0 - 0.3*fine*tower*step(5.2, vP.y)*step(vP.y, 20.0)*smoothstep(0.035, 0.01, abs(fract(reg + 0.5) - 0.5)/1.0);
    // flagpole niches: tall slots let into the front of each tower, in shade, with a lit reveal on one side
    float nx = min(abs(abs(vP.x) - 9.3), abs(abs(vP.x) - 13.9));
    float niche = smoothstep(0.82, 0.74, nx)*step(vP.y, 20.6)*step(0.5, N.z)*tower;
    alb *= 1.0 - niche*(0.42 - 0.3*smoothstep(0.6, 0.76, nx));
    alb *= 1.0 - 0.4*smoothstep(20.4, 22.1, vP.y)*tower*step(vP.y, 22.2);
    alb *= mix(0.8, 1.0, smoothstep(2.5, 7.0, vP.y))*(0.9 + 0.16*vn(vec2(uw*0.9, vP.y*0.12)));
  }
#endif
#ifdef INST
  vec3 c = lit(alb, N, 1.0 - uShadow*pyrShadow(vP)*step(vP.y, 29.0));
  c += alb*uSunCol*vec3(0.26, 0.21, 0.16)*(1.0 - max(dot(N, uSunDir), 0.0));        // light off the pale ground: shaded walls stay earth, not black
#else
  vec3 c = lit(alb, N, 1.0 - uShadow*max(pyrShadow(vP)*step(vP.y, 29.0), gateShadow(vP)));
#endif
  c += alb*uSunCol*vec3(0.2, 0.17, 0.12)*step(1.5, vM.y)*(1.0 - max(dot(N, uSunDir), 0.0));   // warm bounce off quay and water on the shaded stone
#ifndef INST
  if (vM.y > 0.5 && vM.y < 1.5) {  // white casing: blazes when the sun strikes it square
    float ndl = max(dot(N, uSunDir), 0.0); float b = ndl*ndl; b *= b; b *= b;
    c += alb*uSunCol*b*2.2;
  }
#endif
  gl_FragColor = vec4(fogged(c, length(vP - cameraPosition)), 1.0);
}`;

// boats: moored ones ghost in and out during the lapse, a few travel; sails are pale linen
const BOAT_V = COMMON + /* glsl */`
attribute vec3 color;
attribute vec4 aI;      // x, z, heading, size
attribute vec4 aJ;      // phase, speed (0 = moored), seed, lane length
uniform float uGhost, uFlood;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vA; varying vec3 vL;
void main(){
  vec3 p = position*aI.w, nn = normal; vL = position;
  float moving = step(0.01, aJ.y);
  p.z *= 1.0 + moving*uLapse*2.2;
  float s = fract(aJ.x + uTime*aJ.y/max(aJ.w, 1.0));
  p.z -= moving*(s - 0.5)*aJ.w;
  float roll = sin(uTime*0.9 + aJ.z*40.0)*0.03;
  p.xy += vec2(-p.y, p.x)*roll;
  p.y += sin(uTime*0.7 + aJ.z*31.0)*0.06 - 0.05;
  float cr = cos(aI.z), sr = sin(aI.z);
  p = vec3(p.x*cr + p.z*sr, p.y, -p.x*sr + p.z*cr) + vec3(aI.x, 0.0, aI.y);
  nn = vec3(nn.x*cr + nn.z*sr, nn.y, -nn.x*sr + nn.z*cr);
  float ghost = smoothstep(0.38, 0.62, vn(vec2(aJ.z*37.0, uGhost + aJ.z*11.0)));
  vA = mix(1.0, ghost*0.8, uLapse)*mix(1.0, smoothstep(0.0, 0.12, s)*smoothstep(1.0, 0.88, s)*mix(1.0, 0.55, uLapse), moving);
  vA *= aJ.w > 150.0 ? uFlood : 1.0;      // long lanes cross the drowned fields: only on a flood
  vA = mix(vA, 1.0, step(aJ.w, -0.5));    // the big moored hulls of the basin are no ghosts
  vP = p; vN = nn; vC = color;
  gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0);
}`;
const BOAT_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vA; varying vec3 vL;
void main(){
  if (vA < 0.01) discard;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  // linen: sewn of half-metre cloths, weathered, darker towards the foot
  float linen = step(0.5, vC.r), su = vL.x/0.5;
  float seam = smoothstep(0.4, 0.5, abs(fract(su) - 0.5))*clamp(1.0 - fwidth(su)*1.4, 0.0, 1.0);
  vec3 alb = vC*mix(1.0, (1.0 - 0.26*seam)*(0.8 + 0.2*smoothstep(1.5, 4.7, vL.y))*(0.88 + 0.2*vn(vL.xy*2.3 + vP.x)), linen);
  vec3 c = lit(alb, N, 1.0) + alb*uSunCol*0.25*max(-dot(N, uSunDir), 0.0)*linen;
  gl_FragColor = vec4(fogged(c, length(vP - cameraPosition)), vA);
}`;

// reeds, smoke threads, pennants: small strips with their own motion
const STRIP_V = COMMON + /* glsl */`
attribute vec4 aI; attribute vec4 aJ;
uniform float uFlow; uniform vec3 uWind;
varying vec3 vP; varying vec3 vC; varying float vA; varying vec2 vUv;
void main(){
  vec3 p; vA = 1.0; vUv = uv;
#ifdef REED
  // aI: x, z, base height, size   aJ: rotation, phase, hue, -
  float s = position.y;
  p = position*vec3(aI.w*0.5, aI.w, aI.w*0.5);
  float cr = cos(aJ.x), sr = sin(aJ.x);
  p = vec3(p.x*cr + p.z*sr, p.y, -p.x*sr + p.z*cr);
  float bend = s*s*aI.w;
  p.xz += vec2(0.7, 0.4)*bend*0.22*sin(uTime*1.7 + aJ.y*6.28 + aI.x*0.3);
  p.z += bend*uFlow*0.75; p.y -= bend*abs(uFlow)*0.45;
  p += vec3(aI.x, aI.z - sinkAt(aI.xy), aI.y);
  vC = mix(vec3(0.075, 0.16, 0.08), vec3(0.36, 0.32, 0.15), aJ.z)*(0.45 + 0.75*s);
#endif
#ifdef SMOKE
  // aI: x, y, z, height   aJ: birth year, seed, width, -
  float s = uv.y;
  float sm = 1.0 + uLapse*1.6;
  vec3 c = aI.xyz; c.y -= sinkAt(aI.xz);
  float wob = sin(s*5.0 - uTime*0.8 + aJ.y*20.0)*(0.3 + s*2.2)/sm;
  c += vec3(0.0, s*aI.w, 0.0) + uWind*(s*s*aI.w*0.9) + vec3(wob, 0.0, wob*0.6);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  p = c + right*position.x*aJ.z*(0.5 + s*3.2)*sm;
  vA = smoothstep(0.0, 0.08, s)*pow(1.0 - s, 1.2)*1.25/sm*smoothstep(aJ.x, aJ.x + 1.0, uYear);
  vC = vec3(0.4, 0.4, 0.46);
#endif
#ifdef FLAG
  // aI: pole top x, y, z, length   aJ: phase, colour mix, -, -
  float s = uv.x;
  vec3 c = aI.xyz; c.y -= sinkAt(aI.xz);
  float ph = aJ.x*6.28;
  vec3 wd = normalize(uWind + vec3(0.0, 0.0, 1e-4));
  vec3 sd = vec3(-wd.z, 0.0, wd.x);
  float wv = sin(s*9.0 - uTime*4.2 + ph)*0.5 + sin(s*4.3 - uTime*2.7 + ph*2.0)*0.5;
  p = c + wd*(s*aI.w) + sd*(wv*s*1.3) + vec3(0.0, (uv.y - 0.5)*mix(1.5, 0.35, s) - s*s*1.6 + 0.3*s*cos(s*7.0 - uTime*3.1 + ph), 0.0);
  vC = mix(vec3(0.8, 0.75, 0.64), vec3(0.6, 0.13, 0.05), aJ.y)*(0.8 + 0.25*wv);
#endif
  vP = p;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const STRIP_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vC; varying float vA; varying vec2 vUv;
void main(){
  float a = vA;
#ifdef SMOKE
  a *= smoothstep(1.0, 0.2, abs(vUv.x*2.0 - 1.0));
#endif
  vec3 c = vC*(uSunCol*(0.35 + 0.3*max(uSunDir.y, 0.0)) + mix(uGndCol, uSkyCol, 0.8));
  gl_FragColor = vec4(fogged(c, length(vP - cameraPosition)), a);
}`;

// the barge: cedar bow, prow post, sledge and capstone, with analytic shadows of its own posts
const BARGE_V = /* glsl */`
attribute vec3 color; attribute float aM;
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vM; varying vec3 vL;
void main(){ vL = position; vC = color; vM = aM; vN = normalize(mat3(modelMatrix)*normal);
  vP = (modelMatrix*vec4(position, 1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP, 1.0); }`;
const BARGE_F = COMMON + /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying float vM; varying vec3 vL;
uniform vec3 uSeg[8];    // 4 shadow-casting segments (a, b) in barge space
uniform vec4 uSegR;      // their radii
uniform vec3 uCapA, uCapB;  // capstone base centre and apex
float segSh(vec3 o, vec3 d, vec3 a, vec3 b, float r0, float r1){
  vec3 e = b - a, w = o - a;
  float B = dot(d, e), C = dot(e, e), D = dot(d, w), E = dot(e, w);
  float s = clamp((E - B*D)/max(C - B*B, 1e-4), 0.0, 1.0);
  float t = B*s - D;
  if (t < 0.05) return 0.0;
  float r = mix(r0, r1, s);
  return smoothstep(r*1.25, r*0.75, length(w + d*t - e*s));
}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vP);
  vec3 d = uShDir;
  float sh = 0.0;
  sh = max(sh, segSh(vL, d, uSeg[0], uSeg[1], uSegR.x, uSegR.x));
  sh = max(sh, segSh(vL, d, uSeg[2], uSeg[3], uSegR.y, uSegR.y));
  sh = max(sh, segSh(vL, d, uSeg[4], uSeg[5], uSegR.z, uSegR.z));
  sh = max(sh, segSh(vL, d, uSeg[6], uSeg[7], uSegR.w, uSegR.w));
  if (vM < 0.5 || vM > 2.5) sh = max(sh, segSh(vL, d, uCapA, uCapB, 0.8, 0.02));
  sh = max(sh, nearShadow(vP.xz));
  float light = 1.0 - uShadow*sh;
  vec3 alb = vC, c;
  float fre = 1.0 - max(dot(N, V), 0.0); float fre3 = fre*fre*fre;
  if (vM > 0.5 && vM < 2.5) {          // the capstone: hammered electrum sheets, or polished black granite
    float gran = step(1.5, vM);
    vec3 q = vL - uCapA;
    float capH = max(uCapB.y - uCapA.y, 0.1), hwc = max(0.8*(1.0 - q.y/capH), 0.0);
    float inCap = step(max(abs(q.x), abs(q.z)), 0.86)*step(-0.03, q.y);
    float arris = inCap*max(smoothstep(0.035, 0.008, hwc - min(abs(q.x), abs(q.z))), smoothstep(0.03, 0.0, q.y)*0.6);
    vec3 hm = vec3(vn(vL.xy*9.0 + vL.z*5.0), vn(vL.yz*9.0 + 3.0), vn(vL.xz*9.0 + 7.0)) - 0.5;
    vec3 hm2 = vec3(vn(vL.xy*31.0 + vL.z*17.0), vn(vL.yz*31.0 + 5.0), vn(vL.xz*31.0 + 2.0)) - 0.5;
    vec3 Nh = normalize(N + hm*mix(0.26, 0.025, gran) + hm2*mix(0.12, 0.012, gran));
    float seam = smoothstep(0.03, 0.0, abs(fract(vL.y*3.0) - 0.5) - 0.47);
    // the sheathing is beaten sheets, lapped like roof tiles: every sheet its own tone, a dark line where two meet
    float sv_ = (abs(N.x) > abs(N.z) ? q.z : q.x)*2.6 + 0.5*floor(vL.y*3.0), shA = clamp(1.0 - fwidth(sv_)*1.5, 0.0, 1.0)*inCap*(1.0 - gran);
    float vseam = smoothstep(0.045, 0.0, abs(fract(sv_) - 0.5) - 0.455);
    alb *= 1.0 - 0.42*max(seam, vseam*shA)*(1.0 - gran);
    alb *= 1.0 + shA*(0.34*h21(vec2(floor(sv_), floor(vL.y*3.0) + 2.0)) - 0.17);
    vec3 R = reflect(-V, Nh);
    // what it mirrors: the sky and its clouds above, the bright bank and water below, a pale horizon line between
    float up = smoothstep(-0.12, 0.1, R.y);
    vec3 env = mix(uGndCol*1.6 + uSunCol*vec3(0.24, 0.18, 0.1), skyClouds(normalize(vec3(R.x, abs(R.y) + 0.03, R.z))), up);
    env += uHor*0.6*exp(-R.y*R.y*60.0);
    float sp = max(dot(R, uShDir), 0.0); float s4 = sp*sp; s4 *= s4; float s16 = s4*s4; s16 *= s16; float s64 = s16*s16; s64 *= s64;
    float day = smoothstep(-0.05, 0.1, uSunTrue.y);
    vec3 envg = mix(env, vec3(dot(env, vec3(0.3, 0.5, 0.2))), 0.8);            // metal tints what it mirrors: no green from a blue sky
    // an inscription round the foot of every face: a register of signs between two rules, gilt on the granite, chased into the electrum
    float hc = abs(N.x) > abs(N.z) ? q.z : q.x, ry = (q.y - 0.2)/0.12, gx = hc/0.082 + 0.5;
    float gh = h21(vec2(floor(gx), 3.0 + step(0.0, N.x) + 2.0*step(0.0, N.z))), gf = fract(gx) - 0.5, rc = ry - 0.5;
    float sign_ = gh < 0.22 ? step(abs(gf), 0.07)*step(abs(rc), 0.4)
      : gh < 0.44 ? step(abs(length(vec2(gf*0.68, rc)) - 0.24), 0.06)
      : gh < 0.62 ? step(abs(gf), 0.3)*step(abs(abs(rc) - 0.2), 0.06)
      : gh < 0.8 ? max(step(abs(gf), 0.065)*step(abs(rc), 0.4), step(abs(gf), 0.28)*step(abs(rc - 0.34), 0.06))
      : step(abs(abs(gf) - 0.16), 0.055)*step(abs(rc), 0.3 + 0.1*step(gf, 0.0));
    float gaa = clamp(1.0 - fwidth(gx)*1.2, 0.0, 1.0);
    float gild = max(sign_*step(abs(rc), 0.5)*step(abs(hc), hwc - 0.09), max(step(abs(ry + 0.24), 0.055), step(abs(ry - 1.24), 0.055))*step(abs(hc), hwc - 0.04))*inCap*gaa*step(q.y, 0.6);
    vec3 ga = mix(alb, vec3(0.8, 0.5, 0.09), gran*step(0.5, gild));
    vec3 galb = ga*vec3(1.0, 0.86, 0.62)*(0.86 + 0.28*vn(vL.xy*23.0 + vL.z*17.0))*(0.86 + 0.3*clamp(q.y/capH, 0.0, 1.0));
    // electrum: the sun's own image, wide enough to catch it once a lap and bright enough to bloom when it does
    vec3 gold = lit(galb, Nh, light)*0.5 + galb*envg*(1.0 + 1.6*fre3) + ga*uDiscCol*(s64*7.0 + s16*1.4 + s4*0.22)*light*day;
    gold *= 1.0 - 0.5*gild*(1.0 - gran);
    // granite: black, speckled with feldspar, polished: a clear blue sheen of sky with a horizon line and the sun in it
    float fleck = step(0.78, vn(vL.xy*70.0 + vL.z*53.0)), fleck2 = step(0.84, vn(vL.zy*37.0 + vL.x*41.0 + 9.0));
    float xt = vn(vL.xy*40.0 + vL.z*29.0), xt2 = vn(vL.zy*13.0 + vL.x*11.0 + 4.0);                    // crystals: grey quartz, rose feldspar, black mica
    vec3 galbG = alb*(1.6 + 2.0*fleck + 3.0*xt2) + vec3(0.07, 0.05, 0.045)*fleck2 + vec3(0.05, 0.03, 0.028)*smoothstep(0.55, 0.8, xt);
    vec3 eg = mix(env, vec3(dot(env, vec3(0.3, 0.5, 0.2))), 0.2);
    vec3 gr = lit(galbG, Nh, light) + min(eg, vec3(0.8))*(0.1 + 0.42*min(fre3, 0.9))*(0.55 + 0.45*light)*(0.94 + 0.12*xt) + uDiscCol*(s64*s64*s64*s64*3.0 + s64*0.22 + s16*0.04)*light*day;      // the sun's own disc, small and sharp, sliding over the polish
    c = mix(gold, gr, gran*(1.0 - step(0.5, gild)));
    c += arris*(env*mix(0.5, 0.22, gran) + uSunCol*0.12*light);                  // the dressed edge catches the light
  } else {
    // cedar: sewn planks with seams, butt joints, lashing stitches and a low sheen of sky
    float flat_ = smoothstep(0.6, 0.85, N.y);
    float u = mix(vL.y*2.2 + vL.x*0.4, vL.x, flat_)/0.3;
    float pl = floor(u), fu = fract(u);
    float tone = h21(vec2(pl, 3.0)), butt = fract(vL.z/2.6 + tone*7.0);
    float fine = clamp(1.0 - fwidth(u)*1.2, 0.0, 1.0);
    float seam = max(smoothstep(0.44, 0.5, abs(fu - 0.5)), smoothstep(0.012, 0.0, abs(butt - 0.5))*flat_);
    float stitch = smoothstep(0.36, 0.5, abs(fu - 0.5))*smoothstep(0.16, 0.06, abs(fract(vL.z/0.42) - 0.5))*flat_;
    float grain = vn(vec2(u*5.0, vL.z*1.1 + tone*9.0))*0.26 + vn(vec2(u*17.0, vL.z*2.3))*0.14 + vn(vL.xz*2.1)*0.14;
    float wood = step(2.5, vM)*step(vM, 3.5);                                      // planking, not rope / stone / paint
    float ropeM = step(3.5, vM);                                                   // laid rope: the twist of its strands
    float tw = dot(vL, vec3(1.0, 1.3, 1.0))*150.0;
    alb *= mix(1.0, 0.72 + 0.4*(0.5 + 0.5*sin(tw))*clamp(1.0 - fwidth(tw)*0.4, 0.0, 1.0), ropeM);
    alb *= mix(1.0, (0.68 + grain)*(0.86 + 0.28*tone*fine), wood);
    alb *= 1.0 - wood*fine*0.5*seam;
    alb = mix(alb, vec3(0.5, 0.42, 0.26), wood*fine*stitch*0.75);
    c = lit(alb, N, light);
    vec3 R = reflect(-V, N);
    c += skyGrad(normalize(vec3(R.x, abs(R.y) + 0.02, R.z)))*(0.03 + 0.3*fre3)*(0.4 + 0.6*light)*wood;
  }
  gl_FragColor = vec4(fogged(c, length(vP - cameraPosition)), 1.0);
}`;

// ------------------------------------------------------------------------------- geometry helpers
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
function GB() { return { p: [], n: [], c: [], m: [], i: [] }; }
function vert(G, p, n, col, m) { G.p.push(p[0], p[1], p[2]); G.n.push(n[0], n[1], n[2]); G.c.push(col[0], col[1], col[2]); G.m.push(m[0], m[1]); return G.p.length / 3 - 1; }
// flat polygon (3 or 4 points); the normal is turned to agree with `hint`
function face(G, pts, col, m, hint) {
  const a = pts[0], b = pts[1], c = pts[2];
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
  const k = pts.map((p) => vert(G, p, [nx, ny, nz], col, m));
  G.i.push(k[0], k[1], k[2]); if (k.length === 4) G.i.push(k[0], k[2], k[3]);
}
// box standing on y0, optionally turned about Y and tapered towards the top
function box(G, cx, y0, cz, sx, sy, sz, col, m, ry = 0, taper = 1, bottom = false) {
  const cr = Math.cos(ry), sr = Math.sin(ry);
  const P = (x, y, z) => { const t = y > 0 ? taper : 1; x *= t; z *= t; return [cx + x * cr + z * sr, y0 + y, cz - x * sr + z * cr]; };
  const hx = sx / 2, hz = sz / 2, mid = [cx, y0 + sy / 2, cz];
  const F4 = (a, b, c, d) => { const cen = [(a[0] + c[0]) / 2 - mid[0], (a[1] + c[1]) / 2 - mid[1], (a[2] + c[2]) / 2 - mid[2]]; face(G, [a, b, c, d], col, m, cen); };
  F4(P(-hx, 0, hz), P(hx, 0, hz), P(hx, sy, hz), P(-hx, sy, hz));
  F4(P(hx, 0, -hz), P(-hx, 0, -hz), P(-hx, sy, -hz), P(hx, sy, -hz));
  F4(P(hx, 0, hz), P(hx, 0, -hz), P(hx, sy, -hz), P(hx, sy, hz));
  F4(P(-hx, 0, -hz), P(-hx, 0, hz), P(-hx, sy, hz), P(-hx, sy, -hz));
  F4(P(-hx, sy, hz), P(hx, sy, hz), P(hx, sy, -hz), P(-hx, sy, -hz));
  if (bottom) F4(P(-hx, 0, -hz), P(hx, 0, -hz), P(hx, 0, hz), P(-hx, 0, hz));
}
// square rings stacked along a profile [[outward offset, height], ...] from a hx by hz rectangle: cornices and mouldings
function loft(G, cx, cz, hx, hz, y0, prof, col, m, cap = true) {
  const ring = (o, y) => [[-hx - o, hz + o], [hx + o, hz + o], [hx + o, -hz - o], [-hx - o, -hz - o]].map(([x, z]) => [cx + x, y0 + y, cz + z]);
  for (let k = 0; k < prof.length - 1; k++) {
    const a = ring(prof[k][0], prof[k][1]), b = ring(prof[k + 1][0], prof[k + 1][1]);
    for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; face(G, [a[j], a[j1], b[j1], b[j]], col, m, [(a[j][0] + a[j1][0]) / 2 - cx, -0.2, (a[j][2] + a[j1][2]) / 2 - cz]); }
  }
  if (cap) { const t = ring(prof[prof.length - 1][0], prof[prof.length - 1][1]); face(G, t, col, m, [0, 1, 0]); }
}
// round-ish beam between two points (smooth radial normals)
function beam(G, a, b, r, col, m, sides = 5, r2 = r) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
  d[0] /= l; d[1] /= l; d[2] /= l;
  const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let ux = d[1] * up[2] - d[2] * up[1], uy = d[2] * up[0] - d[0] * up[2], uz = d[0] * up[1] - d[1] * up[0];
  const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = d[1] * uz - d[2] * uy, vy = d[2] * ux - d[0] * uz, vz = d[0] * uy - d[1] * ux;
  const base = G.p.length / 3;
  for (let k = 0; k <= sides; k++) {
    const an = (k / sides) * TAU, c = Math.cos(an), s = Math.sin(an);
    const n = [ux * c + vx * s, uy * c + vy * s, uz * c + vz * s];
    vert(G, [a[0] + n[0] * r, a[1] + n[1] * r, a[2] + n[2] * r], n, col, m);
    vert(G, [b[0] + n[0] * r2, b[1] + n[1] * r2, b[2] + n[2] * r2], n, col, m);
  }
  for (let k = 0; k < sides; k++) { const o = base + k * 2; G.i.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
}
function finish(G, mSize = 2, Cls = THREE.BufferGeometry) {
  const g = new Cls();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.c, 3));
  if (mSize === 2) g.setAttribute('aM', new THREE.Float32BufferAttribute(G.m, 2));
  else { const a = new Float32Array(G.m.length / 2); for (let i = 0; i < a.length; i++) a[i] = G.m[i * 2 + 1]; g.setAttribute('aM', new THREE.Float32BufferAttribute(a, 1)); }
  g.setIndex(G.i);
  return g;
}
const inst = (g, name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size));

// JS copies of the floodplain part of the land function (placement only)
function waterDistJS(x, z) {
  const dc = Math.max(Math.abs(x) - 7, -(z + 238));
  const qx = Math.abs(x) - 80, qz = Math.abs(z + 300) - 60;
  const db = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
  const dg = Math.max(Math.abs(x) - 7, Math.abs(z + 368) - 10);
  return Math.min(dc, db, dg);
}
function hamletJS(x, z, townX) {
  const hx = -24;
  return Math.max(smoothstep(1.25, 0.5, Math.hypot((x - hx) / 11, (z + 44) / 24)), smoothstep(1.25, 0.5, Math.hypot((x - hx) / 11, (z + 152) / 26)));
}
function landHJS(x, z, townX) {
  const dw = waterDistJS(x, z), quay = smoothstep(-226, -246, z), top = lerp(2.2, 3.2, quay);
  let field = 1.2 + 0.22 * Math.sin(x * 0.021 + 1.3) * Math.sin(z * 0.017 + 0.4);
  field += 2.3 * smoothstep(1.2, 0.55, Math.hypot((x - townX) / 64, (z + 172) / 128));
  field += 2.5 * hamletJS(x, z, townX);
  const edge = lerp(1.5, 0.45, quay);
  const h = lerp(-3, top, smoothstep(-edge, edge, dw));
  return lerp(h, field, smoothstep(5 + quay * 9, 13 + quay * 13, dw));
}

// one palm, 1 unit tall: a tapered leaning trunk with a dark crown boss, hanging date clusters and three tiers of arching,
// drooping fronds (cut to feathers in the shader). rich = the avenue palm (fronds folded along the midrib, more of them);
// otherwise the cheap grove palm. aW: trunk (angle 0..1, height 0..1, 0 | -1 boss | -2 dates), frond (u along, v across, 1)
function palmGeometry(rng, rich) {
  const P = [], N = [], W = [], I = [];
  const sides = rich ? 6 : 5, prof = rich ? [[0, 0.046], [0.05, 0.034], [0.3, 0.027], [0.62, 0.023], [0.9, 0.021], [0.918, 0.04], [0.95, 0.046], [0.975, 0.03], [0.995, 0.008]]
    : [[0, 0.046], [0.3, 0.027], [0.9, 0.021], [0.918, 0.04], [0.95, 0.046], [0.995, 0.008]];
  const lean = (t) => 0.075 * t * t;
  prof.forEach(([t, r], k) => {
    for (let s = 0; s <= sides; s++) { const a = (s / sides) * TAU; P.push(lean(t) + Math.cos(a) * r, t, Math.sin(a) * r); N.push(Math.cos(a), 0.15, Math.sin(a)); W.push(s / sides, t, t >= 0.91 ? -1 : 0); }
  });
  for (let k = 0; k < prof.length - 1; k++) for (let s = 0; s < sides; s++) { const o = k * (sides + 1) + s; I.push(o, o + sides + 1, o + 1, o + 1, o + sides + 1, o + sides + 2); }
  const top = 0.955, ox = lean(top);
  if (rich) for (let d = 0; d < 5; d++) {                  // date clusters: a stalk arching out from under the crown, a heavy drop of fruit
    const az = (d / 5) * TAU + rng.range(-0.4, 0.4), ca = Math.cos(az), sa = Math.sin(az), base = P.length / 3;
    const ring = [[0.02, 0.925, 0.006], [0.06, 0.93, 0.008], [0.085, 0.905, 0.022], [0.09, 0.868, 0.026], [0.088, 0.835, 0.004]];
    ring.forEach(([r, y, rad]) => { for (let q = 0; q <= 4; q++) { const a = (q / 4) * TAU; P.push(ox + ca * r + Math.cos(a) * rad, y, sa * r + Math.sin(a) * rad); N.push(Math.cos(a), 0.2, Math.sin(a)); W.push(q / 4, y, -2); } });
    for (let k = 0; k < ring.length - 1; k++) for (let q = 0; q < 4; q++) { const o = base + k * 5 + q; I.push(o, o + 5, o + 1, o + 1, o + 5, o + 6); }
  }
  const fronds = rich ? 21 : 12, segs = rich ? 5 : 4;
  for (let f = 0; f < fronds; f++) {
    const tier = f % 3;                                   // 0 upright, 1 spreading, 2 hanging
    const az = (f / fronds) * TAU * 2.0 + rng.range(-0.25, 0.25), L = rng.range(0.4, 0.54) * (tier === 2 ? 0.85 : 1);
    let th = tier === 0 ? rng.range(0.9, 1.3) : tier === 1 ? rng.range(0.35, 0.75) : rng.range(-0.25, 0.15);
    const bend = tier === 0 ? rng.range(1.7, 2.2) : tier === 1 ? rng.range(1.4, 1.8) : rng.range(0.9, 1.3);
    const ca = Math.cos(az), sa = Math.sin(az), base = P.length / 3, w = rich ? 0.105 : 0.095, twist = rng.range(-0.35, 0.35);
    const across = rich ? [-1, 0, 1] : [-1, 1], nA = across.length;
    let r = 0.012, y = top;
    if (rich && f % 4 === 3) continue;                    // 16 of the 21 drawn (all 21 keep their random draws: a seed keeps its layout)
    for (let k = 0; k <= segs; k++) {
      const s = k / segs, tw = twist * s, ny = Math.cos(th), nr = -Math.sin(th);
      for (const v of across) {
        const fold = rich ? Math.abs(v) * w * 0.42 : 0;    // the two halves hang from the midrib like a roof
        P.push(ox + ca * r - sa * v * w - ca * nr * fold, y - 0.02 * s - v * w * tw - ny * fold, sa * r + ca * v * w - sa * nr * fold);
        const k2 = rich ? 0.55 * v : tw * v * 0.3;
        N.push(ca * nr - sa * k2, ny, sa * nr + ca * k2); W.push(s, v, 1);
      }
      const ds = L / segs; r += Math.cos(th) * ds; y += Math.sin(th) * ds; th -= bend / segs * (0.6 + 0.8 * s);
    }
    for (let k = 0; k < segs; k++) for (let q = 0; q < nA - 1; q++) { const o = base + k * nA + q; I.push(o, o + 1, o + nA, o + 1, o + nA + 1, o + nA); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3));
  g.setIndex(I);
  return g;
}

// a river boat about 6.5 m long, bow towards -Z: hull, mast, yard and a square linen sail
function boatGeometry(sail) {
  const G = GB(), hull = lin('#7d5d3c'), dark = lin('#4a3826'), linen = lin('#efe6d2'), M = [0, 0];
  const st = 8, zs = [], ws = [], ys = [];
  for (let k = 0; k <= st; k++) { const t = (k / st) * 2 - 1; zs.push(t * 3.2); ws.push(0.95 * Math.pow(Math.max(1 - t * t, 0), 0.6) + 0.04); ys.push(0.45 + 0.75 * t * t * t * t); }
  for (let k = 0; k < st; k++) {
    for (const sd of [-1, 1]) {
      face(G, [[sd * ws[k], ys[k], zs[k]], [sd * ws[k + 1], ys[k + 1], zs[k + 1]], [sd * ws[k + 1] * 0.35, -0.2, zs[k + 1]], [sd * ws[k] * 0.35, -0.2, zs[k]]], hull, M, [sd, -0.3, 0]);
    }
    face(G, [[-ws[k], ys[k] - 0.12, zs[k]], [ws[k], ys[k] - 0.12, zs[k]], [ws[k + 1], ys[k + 1] - 0.12, zs[k + 1]], [-ws[k + 1], ys[k + 1] - 0.12, zs[k + 1]]], dark, M, [0, 1, 0]);
  }
  box(G, 0, 0.3, 1.3, 1.1, 0.75, 1.3, lin('#8a6a3a'), M);          // deck house
  beam(G, [0.5, 1.4, 2.6], [0.9, -0.3, 3.6], 0.05, dark, M, 4);     // steering oar
  if (sail) {
    beam(G, [0, 0.3, -0.5], [0, 5.0, -0.5], 0.07, dark, M, 4, 0.04);
    beam(G, [-1.9, 4.7, -0.5], [1.9, 4.7, -0.5], 0.04, dark, M, 4);
    beam(G, [-1.9, 1.5, -0.5], [1.9, 1.5, -0.5], 0.04, dark, M, 4);
    // the sail: a bellied sheet between the two yards (smooth normals), its albedo kept under 0.75
    const NX = 6, NY = 4, sailC = linen.map((v) => v * 0.84), sz = (a, b) => -0.5 - 0.6 * (1 - a * a) * (0.45 + 0.55 * Math.sin(Math.PI * b)), ids = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const a = (i / NX) * 2 - 1, b = j / NY, e = 0.02;
      const dzx = (sz(a + e, b) - sz(a - e, b)) / (2 * e * 1.8), dzy = (sz(a, b + e) - sz(a, b - e)) / (2 * e * 3.2), nl = Math.hypot(dzx, dzy, 1);
      ids.push(vert(G, [a * 1.8, 1.5 + 3.2 * b + 0.08 * (1 - a * a) * (1 - 2 * b), sz(a, b)], [-dzx / nl, -dzy / nl, 1 / nl], sailC, M));
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const o = j * (NX + 1) + i; G.i.push(ids[o], ids[o + 1], ids[o + NX + 2], ids[o], ids[o + NX + 2], ids[o + NX + 1]); }
  } else {
    beam(G, [0, 0.3, -0.5], [0, 3.6, -0.5], 0.06, dark, M, 4, 0.035);
    beam(G, [-1.6, 1.3, -0.4], [1.6, 1.5, -0.4], 0.11, linen, M, 4);  // furled sail on a lowered yard
    beam(G, [0, 3.55, -0.5], [0, 1.2, -3.0], 0.022, dark, M, 3); beam(G, [0, 3.55, -0.5], [0, 1.25, 2.9], 0.022, dark, M, 3);   // stays
    beam(G, [0, 3.6, -0.5], [0, 4.1, -0.5], 0.03, lin('#a44524'), M, 3, 0.01);
  }
  return G;
}

// the bow of the stone barge in its own space: origin on the waterline under the eye, bow towards -Z
function bargeGeometry(granite) {
  const G = GB(), W = [0, 0], EL = [0, 1], GR = [0, 2], PL = [0, 3], RP = [0, 4];
  const cedar = [lin('#9b7248'), lin('#916a41'), lin('#a47a4e')], dark = lin('#4a3524'), ochre = lin('#a44524');
  const gold = lin('#FFD25A'), rope = lin('#b79a62'), stone = lin('#d9c9a0');
  const deckY = (z) => 1.35 + 0.9 * Math.pow(clamp((-z - 1) / 4, 0, 1), 2);
  const hw = (z) => Math.max(3.0 * Math.pow(clamp((z + 5.25) / 7, 0, 1), 0.55), 0.06);
  const zs = [9, 6.5]; for (let z = 4; z > -5.01; z -= 0.5) zs.push(z); zs.push(-5.22);
  for (let k = 0; k < zs.length - 1; k++) {
    const z0 = zs[k], z1 = zs[k + 1], w0 = hw(z0), w1 = hw(z1), y0 = deckY(z0), y1 = deckY(z1);
    const strips = 6;
    for (let s = 0; s < strips; s++) {
      const a = (s / strips) * 2 - 1, b = ((s + 1) / strips) * 2 - 1;
      face(G, [[a * w0 * 0.95, y0, z0], [b * w0 * 0.95, y0, z0], [b * w1 * 0.95, y1, z1], [a * w1 * 0.95, y1, z1]], cedar[0], PL, [0, 1, 0]);
    }
    for (const sd of [-1, 1]) {
      const rail = 0.42;
      face(G, [[sd * w0 * 0.95, y0, z0], [sd * w1 * 0.95, y1, z1], [sd * w1 * 0.95, y1 + rail, z1], [sd * w0 * 0.95, y0 + rail, z0]], cedar[1], PL, [-sd, 0, 0]);
      face(G, [[sd * w0 * 0.95, y0 + rail, z0], [sd * w1 * 0.95, y1 + rail, z1], [sd * (w1 * 1.04 + 0.06), y1 + rail, z1], [sd * (w0 * 1.04 + 0.06), y0 + rail, z0]], cedar[2], PL, [0, 1, 0]);
      face(G, [[sd * (w0 * 1.04 + 0.06), y0 + rail, z0], [sd * (w1 * 1.04 + 0.06), y1 + rail, z1], [sd * w1 * 0.8, -0.4, z1], [sd * w0 * 0.8, -0.4, z0]], cedar[0], PL, [sd, 0.2, 0]);
    }
    if (k % 3 === 1 && z0 < 1) {   // rope trusses: lashings across the deck where the sewn planks are girdled
      beam(G, [-w0 * 0.93, y0 + 0.05, z0], [w0 * 0.93, y0 + 0.05, z0], 0.04, rope, RP, 5);
    }
  }
  // lotus-bud prow post, left of centre
  const px = -0.92, pz = -4.25, py = deckY(pz) - 0.1;
  beam(G, [px, py, pz], [px, 3.05, pz], 0.13, cedar[1], W, 8, 0.1);
  beam(G, [px, 2.55, pz], [px, 2.7, pz], 0.125, ochre, W, 8, 0.12);
  beam(G, [px, 2.9, pz], [px, 3.05, pz], 0.115, gold, EL, 8, 0.11);
  beam(G, [px, 3.05, pz], [px, 3.3, pz], 0.1, lin('#557f6c'), W, 8, 0.18);
  beam(G, [px, 3.3, pz], [px, 3.55, pz], 0.18, lin('#6a977f'), W, 8, 0.15);
  beam(G, [px, 3.55, pz], [px, 3.88, pz], 0.15, lin('#e4d6b0'), W, 8, 0.02);
  // sledge on two baulks, the capstone, red-ochre lashings and (beyond it, so it frames the stone) a slim A-frame
  const cx = 0.95, cz = -2.7, dy0 = deckY(cz), dy = dy0 + 0.15;
  for (const dz of [-0.62, 0.62]) box(G, cx, dy0 - 0.08, cz + dz, 1.9, 0.25, 0.26, dark, W);
  for (const sd of [-1, 1]) {
    box(G, cx + sd * 0.74, dy, cz, 0.18, 0.2, 2.3, cedar[1], W);
    face(G, [[cx + sd * 0.74 - 0.09, dy + 0.2, cz - 1.15], [cx + sd * 0.74 + 0.09, dy + 0.2, cz - 1.15], [cx + sd * 0.74 + 0.09, dy + 0.42, cz - 1.5], [cx + sd * 0.74 - 0.09, dy + 0.42, cz - 1.5]], cedar[1], W, [0, 1, 0.5]);   // upturned runner noses
  }
  for (const dz of [-0.8, 0, 0.8]) box(G, cx, dy + 0.2, cz + dz, 1.8, 0.1, 0.2, cedar[2], W);
  for (const dx of [-0.56, 0, 0.56]) box(G, cx + dx, dy + 0.3, cz, 0.34, 0.24, 1.76, cedar[dx ? 0 : 2], W);     // a cradle of baulks lifts the stone clear of the sledge
  const by = dy + 0.54, hb = 0.8, ap = [cx, by + 1.0, cz];
  const cs = [[cx - hb, by, cz + hb], [cx + hb, by, cz + hb], [cx + hb, by, cz - hb], [cx - hb, by, cz - hb]];
  const tipK = 0.3, body = granite ? lin('#17171d') : gold, bodyM = granite ? GR : EL;
  for (let k = 0; k < 4; k++) {
    const a = cs[k], b = cs[(k + 1) % 4], out = [(a[0] + b[0]) / 2 - cx, 0.8, (a[2] + b[2]) / 2 - cz];
    const am = [lerp(ap[0], a[0], tipK), lerp(ap[1], a[1], tipK), lerp(ap[2], a[2], tipK)], bm = [lerp(ap[0], b[0], tipK), lerp(ap[1], b[1], tipK), lerp(ap[2], b[2], tipK)];
    face(G, [a, b, bm, am], body, bodyM, out);
    face(G, [am, bm, ap], gold, EL, out);
  }
  const fz = cz - 0.45, apex = [cx, ap[1] + 0.1, fz], legs = [[cx - 0.8, deckY(fz), fz], [cx + 0.5, deckY(fz) + 0.4, fz]];
  for (const l of legs) beam(G, l, apex, 0.036, cedar[1], W, 5, 0.03);
  const tb = (t) => legs.map((l) => [lerp(l[0], apex[0], t), lerp(l[1], apex[1], t), fz]);
  { const [l0, l1] = tb(0.62); beam(G, l0, l1, 0.028, cedar[0], W, 4); }
  beam(G, [apex[0], apex[1] - 0.04, apex[2]], [ap[0], ap[1] + 0.02, ap[2] - 0.03], 0.022, ochre, RP, 5);     // the lowering line
  for (let k = 0; k < 4; k++) {
    const a = cs[k], b = cs[(k + 1) % 4];
    const sx = Math.sign(a[0] - cx), sz = Math.sign(a[2] - cz);
    beam(G, [a[0] + sx * 0.14, dy + 0.2, a[2] + sz * 0.12], [lerp(a[0], ap[0], 0.2), lerp(a[1], ap[1], 0.2) + 0.012, lerp(a[2], ap[2], 0.2)], 0.034, ochre, RP, 6);   // corner ties to the sledge
    for (const t of [0.2, 0.46]) {                                                                        // two girdles round the stone
      const r0 = [lerp(a[0], ap[0], t), lerp(a[1], ap[1], t) + 0.012, lerp(a[2], ap[2], t)], r1 = [lerp(b[0], ap[0], t), lerp(b[1], ap[1], t) + 0.012, lerp(b[2], ap[2], t)];
      const ox = (r0[0] + r1[0]) / 2 - cx, oz = (r0[2] + r1[2]) / 2 - cz, ol = Math.hypot(ox, oz) || 1;
      beam(G, [r0[0] + ox / ol * 0.03, r0[1], r0[2] + oz / ol * 0.03], [r1[0] + ox / ol * 0.03, r1[1], r1[2] + oz / ol * 0.03], t < 0.3 ? 0.038 : 0.03, ochre, RP, 6);
    }
  }
  // spare limestone blocks and a coil of rope on the port side
  box(G, -1.25, deckY(-1.7), -1.7, 0.8, 0.5, 1.0, stone, W, 0.12);
  box(G, -1.3, deckY(-1.7) + 0.5, -1.75, 0.55, 0.35, 0.6, stone, W, -0.3);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) {
    const a0 = (k / 9) * TAU, a1 = ((k + 1) / 9) * TAU, R = 0.34 - r * 0.02, y = deckY(-3.1) + 0.05 + r * 0.075;
    beam(G, [-0.75 + Math.cos(a0) * R, y, -2.9 + Math.sin(a0) * R], [-0.75 + Math.cos(a1) * R, y, -2.9 + Math.sin(a1) * R], 0.04, rope, RP, 5);
  }
  return {
    geometry: finish(G, 1),
    segs: [[px, py, pz], [px, 3.2, pz], legs[0], apex, legs[1], apex, [px, 3.2, pz], [px, 3.8, pz]].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    radii: new THREE.Vector4(0.14, 0.05, 0.05, 0.23), capA: new THREE.Vector3(cx, by, cz), capB: new THREE.Vector3(ap[0], ap[1], ap[2]),
  };
}

// trapezoid ease: writes [integral 0..1, rate 0..1] into out for a clock that speeds up over a..b, holds, and slows over c..d
function trap(u, a, b, c, d, out) {
  const tot = (b - a) / 2 + (c - b) + (d - c) / 2;
  let I, v;
  if (u <= a) { I = 0; v = 0; }
  else if (u < b) { const t = (u - a) / (b - a); v = t * t * (3 - 2 * t); I = (b - a) * (t * t * t - t * t * t * t / 2); }
  else if (u <= c) { v = 1; I = (b - a) / 2 + (u - b); }
  else if (u < d) { const t = (d - u) / (d - c); v = t * t * (3 - 2 * t); I = tot - (d - c) * (t * t * t - t * t * t * t / 2); }
  else { I = tot; v = 0; }
  out[0] = I / tot; out[1] = v;
}

// ------------------------------------------------------------------------------------------ world
export default {
  id: 'twenty-floods',
  name: 'Twenty Floods',
  category: 'wilderness',
  weirdness: 0.25,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.6, 1.4);
    // ---- seeded cast (always drawn in this order so a seed is a world)
    const hourPick = rng.pick(['afternoon', 'afternoon', 'afternoon', 'golden', 'golden', 'night']);
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'golden' : vary.hour === 'day' ? 'afternoon'
      : vary.hour === 'dawn' ? (hourPick === 'night' ? 'golden' : hourPick) : hourPick;
    const lastYear = rng.pick(['flood', 'flood', 'emerald', 'harvest']);
    const weather = rng.pick(['clear', 'clear', 'cirrus', 'cirrus', 'khamsin', 'khamsin']);
    const granite = rng.chance(0.2);
    const townSide = rng.chance(0.7) ? -1 : 1;
    const nSmall = rng.pick([2, 2, 1, 3]);
    const windDir = rng.chance(0.5) ? 1 : -1;
    const rare = !!vary.rare;
    // later draws (appended, so the older cast keeps its seeds): sky hue, arc tilt, the season we start in, avenue rhythm
    const lookRng = rng.fork('look');
    const hueShift = lookRng.range(-0.035, 0.03), latBase = lookRng.range(22, 36), Y0 = lookRng.range(0.3, 0.64), avenueGap = lookRng.pick([2, 3, 3]);
    const lapK = lookRng.range(0.0, 1.0);
    const townX = townSide > 0 ? 118 : -90;
    // a stream of its own for what was added later (hamlets, skiffs, tufts, extra shadufs), so the older cast keeps its draws
    const extraRng = ctx.core.makeRng((((Number(ctx.seed) || 1) * 40503) ^ 0x5f3759df) >>> 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf0e4c8, 0.0007);
    const sun = new THREE.DirectionalLight(0xffffff, 3);      // light 0: the hero's casing blaze reads it
    scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(0xbcd9f2, 0x8a7350, 3);
    scene.add(hemi);

    const path = makePath([[0, EYE, 0], [0, EYE, -120], [0, EYE, -240], [0, EYE, -LEN]]);

    // ---- shared uniforms (one object per uniform, shared by every material)
    const V3 = (x = 0, y = 0, z = 0) => ({ value: new THREE.Vector3(x, y, z) });
    const C3 = () => ({ value: new THREE.Color(0, 0, 0) });
    const U = {
      uSunDir: V3(0, 1, 0), uShDir: V3(0, 1, 0), uSunTrue: V3(0, 1, 0), uSunCol: C3(), uSkyCol: C3(), uGndCol: C3(), uFogCol: C3(),
      uZen: C3(), uHor: C3(), uGlow: C3(), uCloudLit: C3(), uCloudShade: C3(), uDiscCol: C3(),
      uFogDen: { value: 0.0007 }, uSink: { value: 0 }, uTime: { value: 0 }, uYear: { value: 0.5 }, uLapse: { value: 0 },
      uTownX: { value: townX }, uPalmH: { value: 5 }, uShadow: { value: 1 }, uAvGap: { value: 9 * (avenueGap + 1) },
      uPyr: { value: new THREE.Vector4(PYR[0], PYR[2], 115 * HS, 8) },
      uSm: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
      uCloud: { value: new THREE.Vector4(rng.range(0, 40), rng.range(0, 40), 0, 0.5) },
    };
    const mat = (vs, fs, extra = {}, opts = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: vs, fragmentShader: fs, ...opts });

    // ---- sky dome
    const E = new THREE.Vector3(0.276, 0, 0.961), S = new THREE.Vector3(-0.961, 0, 0.276);   // 'east' and 'south' of the sun's arc
    const T = new THREE.Vector3(0, Math.cos(Math.PI / 6), 0).addScaledVector(S, Math.sin(Math.PI / 6)).normalize();
    const A = new THREE.Vector3().crossVectors(E, T).normalize();
    const d2r = Math.PI / 180;
    const pole = new THREE.Vector3(Math.sin(40 * d2r) * Math.cos(30 * d2r), Math.sin(30 * d2r), -Math.cos(40 * d2r) * Math.cos(30 * d2r));
    const poleX = new THREE.Vector3().crossVectors(pole, new THREE.Vector3(0, 1, 0)).normalize();
    const poleY = new THREE.Vector3().crossVectors(pole, poleX).normalize();
    const moonDir = new THREE.Vector3(-0.533, 0.5, -0.682).normalize(), moonKey = new THREE.Vector3(-0.75, 0.52, 0.12).normalize();
    const cometDir = new THREE.Vector3(-0.337, 0.342, -0.877).normalize();
    const cometTail = new THREE.Vector3(-0.45, 0.85, 0.2); cometTail.addScaledVector(cometDir, -cometTail.dot(cometDir)).normalize();
    const SU = {
      uArcE: { value: E }, uArcT: { value: T }, uArcA: { value: A }, uPole: { value: pole }, uPoleX: { value: poleX }, uPoleY: { value: poleY },
      uMoonDir: { value: moonDir }, uCometDir: { value: cometDir }, uCometTail: { value: cometTail },
      uPhi: { value: 0 }, uStars: { value: 0 }, uStarRot: { value: 0 }, uStarArc: { value: 0 }, uMoon: { value: 0 },
      uCirrus: { value: weather === 'cirrus' ? 1 : weather === 'khamsin' ? 0.45 : 0.12 }, uComet: { value: new THREE.Vector2(0, 0.1) },
    };
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat(SKY_V, SKY_F, SU, { side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

    // ---- land: one grid, dense round the canal and basin, coarse to the horizon
    {
      const half = [0]; let x = 0;
      while (x < 2600) { x += (x < 26 || (x > 72 && x < 92)) ? 1.5 : x < 110 ? 4 : x < 420 ? 14 : x < 900 ? 45 : 140; half.push(x); }
      const xs = [...half.slice(1).reverse().map((v) => -v), ...half];
      const zs = []; let z = 430;
      while (z > -2750) { zs.push(z); z -= z > 60 ? 20 : z > -220 ? 6 : z > -250 ? 4 : z > -480 ? 3 : z > -1000 ? 13 : 75; }
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      for (let j = 0, o = 0; j < nz; j++) for (let i = 0; i < nx; i++) { pos[o++] = xs[i]; pos[o++] = 0; pos[o++] = zs[j]; }
      for (let j = 0, o = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; idx[o++] = a; idx[o++] = a + 1; idx[o++] = a + nx; idx[o++] = a + 1; idx[o++] = a + nx + 1; idx[o++] = a + nx; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const land = new THREE.Mesh(g, mat(LAND_V, LAND_F, {}, { side: THREE.DoubleSide })); land.frustumCulled = false; scene.add(land);
    }
    await ctx.yield();
    // ---- water: fixed at y = 0, drawn last of the opaque things and without depth so the mirror shows in it
    const WU = { uSilt: { value: 0 }, uRip: { value: 0.1 }, uLotus: { value: 0 }, uMirrorK: { value: 0 }, uBow: V3(0, 0, 1), uLineY: { value: 146 }, uCapY: { value: 140 },
      uRampHead: { value: 0 }, uCourseH: { value: 2.7 }, uDusk: { value: 0 }, uRampP: { value: [...Array(13)].map(() => new THREE.Vector3()) } };
    {
      const g = new THREE.PlaneGeometry(5400, 3400); g.rotateX(-Math.PI / 2); g.translate(0, 0, 1100);
      const water = new THREE.Mesh(g, mat(WATER_V, WATER_F, WU));
      water.renderOrder = 50; water.frustumCulled = false; scene.add(water);
    }
    await ctx.yield();

    // ---- the hero: the Great Pyramid, on the scarp ahead and to the right
    const hero = await buildHero(ctx, { palette: PALETTE, density: Math.min(density, 1.15), mirror: false, wind: windDir, blaze: 2.6 });
    hero.object.position.set(PYR[0], PYR[1], PYR[2]); hero.object.rotation.y = -PYR_PHI; hero.object.scale.setScalar(HS);
    scene.add(hero.object);
    const heroLook = new THREE.Vector3(PYR[0], PYR[1] + 62, PYR[2]);
    WU.uRampP.value = hero.uniforms.uRamp.value; WU.uCourseH.value = hero.uniforms.uDim.value.w;
    await ctx.yield();

    // ---- palms: the avenue, then groves over the plain
    const propRng = rng.fork('props');
    {
      const g = palmGeometry(propRng, true), gFar = palmGeometry(propRng, false), aI = [], aJ = [];
      const add = (x, z, birth, size) => { aI.push(x, z, landHJS(x, z, townX) - 0.15, size); aJ.push(birth, propRng.range(0, TAU), propRng(), propRng()); };
      for (let z = 28, k = 0; z > -236; z -= 9, k++) for (const sd of [-1, 1]) {
        const open = sd > 0 && z < AV_OPEN;                          // the window to the pyramid, 17-33 degrees right: low palms at the seeded rhythm
        if (sd > 0 && k % (open ? avenueGap + 1 : 2) !== 0) continue;
        add(sd * 10 + propRng.range(-0.3, 0.3), z + propRng.range(-0.5, 0.5), propRng.range(-2.6, -0.6) - 2, open ? propRng.range(6.4, 7.8) : propRng.range(10, 13.5));
      }
      await ctx.yield();
      const want = Math.round(880 * Math.min(density, 1.1) * detail), groves = [];
      for (let k = 0; k < 30; k++) groves.push([propRng.gauss() * 260, propRng.range(40, -345), propRng.range(-2, 11)]);
      for (let k = 0; k < 8; k++) groves.push([townX + propRng.gauss() * 55, -140 + propRng.gauss() * 85, propRng.range(-2, 5)]);
      let guard = 0;
      while (aI.length / 4 < want && guard++ < want * 6) {
        const c = propRng.pick(groves), x = c[0] + propRng.gauss() * 20, z = c[1] + propRng.gauss() * 20;
        if (z > 60 || z < -372 || waterDistJS(x, z) < 17 || Math.abs(x) < 16) continue;
        if (x > 0 && x < 230 && z < -30 && x > (-40 - z) * 0.2 && x < (-40 - z) * 0.85 + 30 && propRng.chance(0.93)) continue;   // keep the sight line to the pyramid open
        if (Math.hypot((x - townX) / 64, (z + 172) / 128) < 0.85 && propRng.chance(0.8)) continue;
        add(x, z, c[2] + propRng.range(0, 5), propRng.range(9, 14));
      }
      await ctx.yield();
      // the two rows of the avenue get the rich palm; the groves and the plain beyond get the cheap one (same shader)
      const total = Math.round(aI.length / 4 * 0.89), nI = [], nJ = [], fI = [], fJ = [];
      for (let k = 0; k < total; k++) {
        const near = Math.abs(aI[k * 4]) < 16 && aI[k * 4 + 1] > -200;
        for (let j = 0; j < 4; j++) { (near ? nI : fI).push(aI[k * 4 + j]); (near ? nJ : fJ).push(aJ[k * 4 + j]); }
      }
      const palmMat = mat(PALM_V, PALM_F, {}, { side: THREE.DoubleSide });
      inst(g, 'aI', nI, 4); inst(g, 'aJ', nJ, 4); g.instanceCount = nI.length / 4;
      const palms = new THREE.Mesh(g, palmMat); palms.frustumCulled = false; scene.add(palms);
      await ctx.yield();
      inst(gFar, 'aI', fI, 4); inst(gFar, 'aJ', fJ, 4); gFar.instanceCount = fI.length / 4;
      const palmsFar = new THREE.Mesh(gFar, palmMat); palmsFar.frustumCulled = false; scene.add(palmsFar);
    }
    await ctx.yield();

    // ---- the workers' town: houses born year by year from the middle out, with smoke threads
    const stripU = { uFlow: { value: 0 }, uWind: V3(windDir * 0.8, 0, 0.35) };
    {
      const houseGeo = (full) => {
        const G = GB(); box(G, 0, 0, 0, 1, 1, 1, [1, 1, 1], [1, 0]);
        // parapet rim (open top), roof room, reed awning on two poles
        const n0 = G.i.length; box(G, 0, 0.9, 0, 1.05, 0.22, 1.05, [1.06, 1.04, 1.0], [1, 1]); G.i.splice(n0 + 24, 6);
        box(G, -0.24, 1.0, -0.2, 0.46, 0.5, 0.5, [0.96, 0.95, 0.93], [1, 0]);
        if (!full) return finish(G, 2, THREE.InstancedBufferGeometry);
        box(G, 0.1, 0.6, 0.72, 0.7, 0.035, 0.44, [1.2, 1.12, 0.84], [1, 1], 0, 1, true);
        for (const sx of [-0.22, 0.42]) box(G, sx, 0, 0.9, 0.035, 0.6, 0.03, [0.42, 0.33, 0.24], [1, 1]);
        for (let k = 0; k < 3; k++) box(G, -0.565, 0, 0.36 - k * 0.24, 0.13, 0.9 - k * 0.3, 0.24, [0.94, 0.92, 0.88], [1, 1]);      // outside stair to the roof
        for (const [jx, jz, jr] of [[0.3, -0.25, 0.05], [0.16, 0.3, 0.045]]) {                                // water jars on the roof
          beam(G, [jx, 1.0, jz], [jx, 1.1, jz], jr * 0.6, [0.82, 0.5, 0.36], [1, 1], 5, jr);
          beam(G, [jx, 1.1, jz], [jx, 1.17, jz], jr, [0.82, 0.5, 0.36], [1, 1], 5, jr * 0.45);
        }
        return finish(G, 2, THREE.InstancedBufferGeometry);
      };
      const g = houseGeo(false), gH = houseGeo(true), aI = [], aJ = [], aC = [], hI = [], hJ = [], hC = [], smoke = { aI: [], aJ: [] };
      const n = Math.round(400 * density * (0.5 + 0.5 * detail)), brick = ['#a07850', '#ac8358', '#94694a', '#b8926a', '#c09c72'];
      for (let k = 0; k < n; k++) {
        let r = 0, x = 0, z = 0;
        for (let tries = 0; tries < 12; tries++) {
          r = Math.sqrt(propRng()) * 0.98; const a = propRng.range(0, TAU);
          x = townX + Math.cos(a) * r * 58 + propRng.range(-2, 2); z = -172 + Math.sin(a) * r * 120;
          const sight = x > 0 && z < -30 && x > (-40 - z) * 0.2 && x < (-40 - z) * 0.85 + 30;     // the window to the pyramid stays fields
          if (waterDistJS(x, z) > 19 && !sight) break;
        }
        const w = propRng.range(4, 8), d = propRng.range(4, 7), h = propRng.chance(0.25) ? propRng.range(5, 6.6) : propRng.range(2.7, 4);
        const y = landHJS(x, z, townX) - 0.3, birth = Math.pow(r, 1.25) * 13 - 0.9 + propRng.range(-0.6, 0.6);
        aI.push(x, y, z, propRng.pick([0, 0, Math.PI / 2]) + propRng.range(-0.12, 0.12)); aJ.push(w, h, d, birth);
        const c = lin(propRng.pick(brick), propRng.range(0.85, 1.15)); aC.push(c[0], c[1], c[2], propRng());
        if (k % 12 === 3) { smoke.aI.push(x, y + h, z, propRng.range(20, 40)); smoke.aJ.push(birth + 0.5, propRng(), propRng.range(0.75, 1.35), 0); }
      }
      // two hamlets close to the canal on the left bank, on their mounds: the first is there from the start
      const hs = -1;
      for (let hm = 0; hm < 2; hm++) {
        const cz = hm ? -152 : -44;
        for (let col = 0; col < 3; col++) for (let row = 0; row < 6; row++) {
          if (extraRng.chance(0.16)) { extraRng(); continue; }
          const x = hs * (17.5 + col * 6.2 + extraRng.range(-0.8, 0.8)), z = cz + (row - 2.5) * 7.4 + extraRng.range(-1.2, 1.2) + (col % 2) * 2.2;
          const w = extraRng.range(3.6, 5.6), d = extraRng.range(3.6, 5.4), h = extraRng.chance(0.2) ? extraRng.range(4.6, 5.6) : extraRng.range(2.5, 3.6);
          const far = Math.abs(row - 2.5) / 2.5 + col * 0.3, birth = hm ? far * 4.5 + extraRng.range(-0.5, 2.5) : (far < 0.9 ? -3 : far * 2.2 + extraRng.range(-0.6, 1));
          hI.push(x, landHJS(x, z, townX) - 0.3, z, extraRng.pick([0, Math.PI / 2, Math.PI]) + extraRng.range(-0.14, 0.14)); hJ.push(w, h, d, birth);
          const c = lin(extraRng.pick(brick), extraRng.range(0.85, 1.15)); hC.push(c[0], c[1], c[2], extraRng());
          if (col === 1 && row % 3 === 1) { smoke.aI.push(x, landHJS(x, z, townX) - 0.3 + h, z, extraRng.range(14, 24)); smoke.aJ.push(Math.max(birth, -3) + 0.5, extraRng(), extraRng.range(0.6, 1.0), 0); }
        }
      }
      inst(g, 'aI', aI, 4); inst(g, 'aJ', aJ, 4); inst(g, 'aC', aC, 4); g.instanceCount = aI.length / 4;
      const houseMat = mat(PROP_V, PROP_F, {}, { defines: { INST: 1, HOUSE: 1 } });
      const houses = new THREE.Mesh(g, houseMat); houses.frustumCulled = false; scene.add(houses);
      inst(gH, 'aI', hI, 4); inst(gH, 'aJ', hJ, 4); inst(gH, 'aC', hC, 4); gH.instanceCount = hI.length / 4;
      const hamlets = new THREE.Mesh(gH, houseMat); hamlets.frustumCulled = false; scene.add(hamlets);
      await ctx.yield();
      // smoke threads
      const segs = 14, P = [], UV = [], I = [];
      for (let k = 0; k <= segs; k++) for (const sd of [-1, 1]) { P.push(sd, 0, 0); UV.push(sd * 0.5 + 0.5, k / segs); }
      for (let k = 0; k < segs; k++) { const o = k * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      const sg = new THREE.InstancedBufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); sg.setIndex(I);
      inst(sg, 'aI', smoke.aI, 4); inst(sg, 'aJ', smoke.aJ, 4); sg.instanceCount = smoke.aI.length / 4;
      const sm = new THREE.Mesh(sg, mat(STRIP_V, STRIP_F, stripU, { defines: { SMOKE: 1 }, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      sm.frustumCulled = false; sm.renderOrder = 3; scene.add(sm);
    }

    await ctx.yield();
    // ---- stone work: gate pylons and lintel, flagpoles, the two markers, small pyramids, quay blocks
    // the big hulls moored in the basin lie at berths between the ferry lanes: [x, z], dealt below with the quay yard
    const BIG = [];
    const flagTops = [];
    {
      const G = GB(), lime = lin('#d8c8a2'), limeD = lin('#c2ae84'), cedar = lin('#6e4526'), casing = lin('#F6EFE0', 0.86), gold = lin('#FFD25A');
      const MAS = [0, 2], ST = [0, 0], RIDE = [1, 2];
      const CORN = [0, 3], cav = [[0, 0], [0.04, 0.42], [0.18, 0.82], [0.44, 1.14], [0.84, 1.36]];
      for (const sd of [-1, 1]) {
        const tx = sd * 11.6, tz = -364.5, TOP = 0.85;
        box(G, tx, -3, tz, 8.4, 25, 9, lime, MAS, 0, TOP);                        // the tower, battered on all four faces
        for (const cxs of [-1, 1]) for (const czs of [-1, 1])                     // torus roll down every corner ...
          beam(G, [tx + cxs * 4.2, -3, tz + czs * 4.5], [tx + cxs * 4.2 * TOP, 22, tz + czs * 4.5 * TOP], 0.26, limeD, ST, 6, 0.22);
        const hx = 4.2 * TOP, hz = 4.5 * TOP;
        for (const [ax, az, bx, bz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]])   // ... and round the head of the wall
          beam(G, [tx + ax * hx, 22.05, tz + az * hz], [tx + bx * hx, 22.05, tz + bz * hz], 0.27, limeD, ST, 6);
        loft(G, tx, tz, hx, hz, 22.25, cav, lime, CORN, false);                    // cavetto cornice
        loft(G, tx, tz, hx, hz, 22.25, [[0.84, 1.36], [0.84, 1.78]], limeD, ST);   // and its fillet
        // a dressed quay kerb under each tower, with a roll along its head; the flagpoles stand on drum bases upon it
        box(G, sd * 11.85, -3, -363.3, 10.0, 5.9, 12.4, limeD, MAS, 0, 0.975);
        beam(G, [sd * 6.98, 2.78, -357.25], [sd * 16.72, 2.78, -357.25], 0.2, lime, ST, 6);
        for (const fx of [9.3, 13.9]) {
          const x = sd * fx;
          beam(G, [x, 2.9, -358.6], [x, 3.75, -358.6], 0.62, limeD, ST, 8, 0.46);
          beam(G, [x, 3.75, -358.6], [x, 31, -358.9], 0.34, cedar, ST, 6, 0.15);
          beam(G, [x, 31, -358.9], [x, 31.7, -358.9], 0.2, gold, [0, 1], 5, 0.02);
          flagTops.push([x, 30.4, -358.9]);
        }
      }
      box(G, 0, 8.3, -364.5, 16, 3.4, 7, lime, MAS, 0, 1, true);                 // lintel over the water gate
      beam(G, [-8, 11.75, -360.95], [8, 11.75, -360.95], 0.2, limeD, ST, 6);
      loft(G, 0, -364.5, 8, 3.5, 11.9, cav.map(([o, y]) => [o * 0.8, y * 0.8]), lime, CORN, false);
      loft(G, 0, -364.5, 8, 3.5, 11.9, [[0.67, 1.09], [0.67, 1.4]], limeD, ST);
      {                                                              // the winged sun disc carved and gilded on the lintel
        const zf = -360.8, cy = 10.0, teal = lin('#2f6f72'), red = lin('#a44524');
        for (let k = 0; k < 14; k++) {
          const a0 = (k / 14) * TAU, a1 = ((k + 1) / 14) * TAU;
          face(G, [[0, cy, zf + 0.08], [Math.cos(a0) * 0.78, cy + Math.sin(a0) * 0.78, zf + 0.08], [Math.cos(a1) * 0.78, cy + Math.sin(a1) * 0.78, zf + 0.08]], gold, [0, 1], [0, 0, 1]);
        }
        for (const sd of [-1, 1]) [[0.62, 0.2, 4.6, teal], [0.2, -0.16, 4.0, red], [-0.16, -0.5, 3.2, gold]].forEach(([ya, yb, L, c], t) => {
          const x0 = sd * 0.74, x1 = sd * (0.74 + L), dr = 0.12 + t * 0.05;
          face(G, [[x0, cy + ya, zf], [x1, cy + ya - dr, zf], [x1 - sd * 0.25, cy + yb - dr, zf], [x0, cy + yb, zf]], c, t === 2 ? [0, 1] : ST, [0, 0, 1]);
        });
      }
      for (const sd of [-1, 1]) {                                   // the two markers at the basin mouth
        box(G, sd * 15, 2.4, -241, 2.2, 1.2, 2.2, limeD, [1, 0]);
        box(G, sd * 15, 3.6, -241, 1.3, 7.2, 1.3, lime, [1, 0], 0, 0.72);
        box(G, sd * 15, 10.8, -241, 0.94, 1.1, 0.94, gold, [1, 1], 0, 0.02);
      }
      const yard = propRng.fork('yard');                           // blocks stacked on the quays
      for (let k = 0; k < 46; k++) {
        const sd = yard.chance(0.5) ? 1 : -1, far = yard.chance(0.3);
        const x = far ? sd * yard.range(14, 78) : sd * yard.range(83, 96), z = far ? yard.range(-236, -229) : yard.range(-352, -246);
        const s = yard.range(0.9, 1.8), n = yard.int(1, 3);
        for (let j = 0; j < n; j++) box(G, x + yard.range(-0.2, 0.2), 3.15 + j * s * 0.7, z, s * 1.5, s * 0.7, s, j % 2 ? lime : limeD, RIDE, yard.range(-0.2, 0.2));
      }
      const sm = [[-250, -790, 56, 72], [-395, -900, 43, 55], [-150, -960, 33, 42]];
      for (let k = 0; k < 3; k++) {
        if (k >= nSmall) continue;
        const [x, z, w, h] = sm[k]; U.uSm.value[k].set(x, z, w, h);
        const cph = Math.cos(PYR_PHI), sph = Math.sin(PYR_PHI);
        const cs = [[w, w], [-w, w], [-w, -w], [w, -w]].map(([a, b]) => [x + a * cph - b * sph, 30, z + a * sph + b * cph]);
        for (let j = 0; j < 4; j++) { const a = cs[j], b = cs[(j + 1) % 4]; face(G, [a, b, [x, 30 + h, z]], casing, [0, 1], [(a[0] + b[0]) / 2 - x, h * 0.5, (a[2] + b[2]) / 2 - z]); }
      }
      // berths by rule: the ferry lanes lie 12 m apart from x = 17 on either side of the barge's channel, and a line of
      // berths runs down the middle of every gap beyond a lane, one berth every 24 m from the basin mouth (z -240) to the
      // gate (z -360). A berth holds a hull or, more often, is empty (seeded), and a hull lies a little up or down its berth
      for (const sd of [-1, 1]) for (let lane = 0; lane < 4; lane++) for (let z = -240 - 24; z > -359; z -= 24) {
        const taken = yard.chance(0.3), dz = yard.range(-3, 3);
        if (taken) BIG.push([sd * (17 + lane * 12 + 6), z + dz]);
      }
      for (const [bx, bz] of BIG) for (const dz of [-1, 1]) {      // two mooring posts to every hull
        const x = bx + (bx > 0 ? -2.9 : 2.9), z = bz + dz * 6.5;
        beam(G, [x, -1.5, z], [x + yard.range(-0.15, 0.15), yard.range(2.0, 2.9), z + yard.range(-0.15, 0.15)], 0.17, cedar, ST, 6, 0.13);
        beam(G, [x, 1.2, z], [x, 1.45, z], 0.2, lin('#b79a62'), ST, 6, 0.2);
      }
      const stoneMesh = new THREE.Mesh(finish(G), mat(PROP_V, PROP_F, {}, { side: THREE.DoubleSide })); stoneMesh.frustumCulled = false; scene.add(stoneMesh);
    }
    await ctx.yield();

    // ---- shadufs nodding on the banks (so fast in the lapse that they blur)
    {
      const G = GB(), wood = lin('#665d53'), mudc = lin('#7e6b58'), ropeS = lin('#a8946c');
      for (const sd of [-1, 1]) {                                    // two forked uprights set in mud footings
        box(G, sd * 0.5, -2.75, 0, 0.5, 0.5, 0.6, mudc, [0, 0], 0, 0.7);
        beam(G, [sd * 0.5, -2.4, 0], [sd * 0.46, -0.12, 0], 0.1, wood, [0, 0], 6, 0.075);
        for (const fz of [-1, 1]) beam(G, [sd * 0.46, -0.14, 0], [sd * 0.46, 0.34, fz * 0.17], 0.06, wood, [0, 0], 5, 0.04);
      }
      beam(G, [-0.62, 0, 0], [0.62, 0, 0], 0.05, wood, [0, 0], 5);                 // the axle in the forks
      beam(G, [0, 0, -4.7], [0, 0, 1.75], 0.045, wood, [0, 1], 6, 0.11);           // the tapered pole
      { const ball = [[1.36, 0.06, 0], [1.48, 0.2, -0.05], [1.66, 0.3, -0.12], [1.86, 0.27, -0.16], [2.02, 0.31, -0.13], [2.16, 0.2, -0.06], [2.24, 0.05, 0]];   // a slumped lump of dried mud, bound on with rope, for the counterweight
        for (let k = 0; k < ball.length - 1; k++) beam(G, [0, ball[k][2], ball[k][0]], [0.03 * (k % 2), ball[k + 1][2], ball[k + 1][0]], ball[k][1], k % 2 ? mudc : mudc.map((v) => v * 0.86), [0, 1], 7, ball[k + 1][1]);
        for (const [z, y, r] of [[1.6, -0.1, 0.3], [1.93, -0.15, 0.31]]) beam(G, [0, y, z], [0, y, z + 0.05], r, ropeS, [0, 1], 7, r); }
      beam(G, [0, 0, -4.66], [0, -2.25, -4.66], 0.035, lin('#b79a62'), [0, 1], 4);  // rope
      beam(G, [0, -2.25, -4.66], [0, -2.8, -4.66], 0.24, lin('#3d2c1e'), [0, 1], 7, 0.15);   // leather bucket
      beam(G, [0, -2.2, -4.66], [0, -2.25, -4.66], 0.02, lin('#3d2c1e'), [0, 1], 7, 0.24);
      const g = finish(G, 2, THREE.InstancedBufferGeometry), aI = [], aJ = [], aC = [];
      const n = Math.round(14 * density);
      for (let k = 0; k < n; k++) {
        const sd = k % 2 ? 1 : -1, z = 5.5 - Math.floor(k / 2) * 36 - (sd > 0 ? 18 : 0);
        aI.push(sd * 12.6, 2.2 + 2.7, z, sd * Math.PI / 2); aJ.push(1, 1, 1, propRng.range(-1, 6)); aC.push(1, 1, 1, propRng());
        if (z - 18 > -232) { aI.push(sd * 12.6, 2.2 + 2.7, z - 18, sd * Math.PI / 2); aJ.push(1, 1, 1, extraRng.range(-1, 8)); aC.push(extraRng.range(0.85, 1.1), extraRng.range(0.85, 1.05), 1, extraRng()); }
      }
      inst(g, 'aI', aI, 4); inst(g, 'aJ', aJ, 4); inst(g, 'aC', aC, 4); g.instanceCount = aI.length / 4;
      const m = new THREE.Mesh(g, mat(PROP_V, PROP_F, {}, { defines: { INST: 1, NOD: 1 }, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- reeds along the canal
    {
      const P = [], UV = [], I = [];
      for (let b = 0; b < 5; b++) {
        const a = propRng.range(0, TAU), lx = Math.cos(a) * 0.3, lz = Math.sin(a) * 0.3, ox = Math.cos(a) * 0.12, oz = Math.sin(a) * 0.12, o = P.length / 3, hgt = propRng.range(0.7, 1);
        P.push(ox - lz * 0.2, 0, oz + lx * 0.2, ox + lz * 0.2, 0, oz - lx * 0.2, ox + lx * hgt - lz * 0.03, hgt, oz + lz * hgt + lx * 0.03, ox + lx * hgt + lz * 0.03, hgt, oz + lz * hgt - lx * 0.03);
        UV.push(0, 0, 1, 0, 0, 1, 1, 1); I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
      const aI = [], aJ = [];
      for (const sd of [-1, 1]) for (let z = 30 - propRng.range(0, 3); z > -236; z -= propRng.range(3, 5)) {   // a clump every 3-5 m at the wet line
        const n = Math.round(propRng.range(5, 9) * Math.min(density, 1.2)), cx = sd * propRng.range(6.75, 7.3), big = propRng.range(0.8, 1.25);
        for (let j = 0; j < n; j++) {
          const x = cx + propRng.range(-0.45, 0.45), zz = z + propRng.range(-0.7, 0.7);
          aI.push(x, zz, landHJS(x, zz, townX) - 0.12, propRng.range(1.7, 3.3) * big); aJ.push(propRng.range(0, TAU), propRng(), propRng() * propRng(), 0);
        }
      }
      for (let z = 30; z > -237; z -= 1.15) for (const sd of [-1, 1]) {            // and stragglers up the bank between them
        if (!propRng.chance(0.3)) continue;
        const x = sd * propRng.range(7.6, 9.6);
        aI.push(x, z + propRng.range(-0.5, 0.5), landHJS(x, z, townX) - 0.1, propRng.range(1.1, 2.0)); aJ.push(propRng.range(0, TAU), propRng(), propRng() * propRng(), 0);
      }
      await ctx.yield();
      for (let z = 30, k = 0; z > -237; z -= 0.7, k++) for (const sd of [-1, 1]) {   // grass tufts along the sod lip and beside the towpath
        if (!extraRng.chance(z > -130 ? 0.6 : 0.34)) { extraRng(); extraRng(); continue; }
        const x = sd * (extraRng.chance(0.62) ? extraRng.range(8.9, 10.1) : extraRng.range(12.6, 15.5));
        aI.push(x, z + extraRng.range(-0.35, 0.35), landHJS(x, z, townX) - 0.06, extraRng.range(0.4, 0.95)); aJ.push(extraRng.range(0, TAU), extraRng(), 0.25 + 0.75 * extraRng(), 0);
        if ((k & 255) === 255) await ctx.yield();
      }
      await ctx.yield();
      {   // a fringe of short grass on the levee crown, so the sward under the reeds has blades of its own (its own stream)
        const turfRng = ctx.core.makeRng((((Number(ctx.seed) || 1) * 1103515245) ^ 0x1b873593) >>> 0), nT = Math.round(700 * detail);
        for (let k = 0; k < nT; k++) {
          const sd = k % 2 ? 1 : -1, x = sd * (8.7 + 3.6 * Math.pow(turfRng(), 1.4)), z = 30 - 266 * Math.pow(turfRng(), 1.25);
          aI.push(x, z, landHJS(x, z, townX) - 0.04, turfRng.range(0.3, 0.6)); aJ.push(turfRng.range(0, TAU), turfRng(), 0.1 + 0.6 * turfRng(), 0);
          if ((k & 255) === 255) await ctx.yield();
        }
      }
      await ctx.yield();
      {   // tall reeds in runs along the plot bunds (the grid the land shader draws): hedges of the ditches in the dry months,
          // and on every flood their tips stand out of the mirror in lines, so the drowned country still shows its plan
        const bundRng = ctx.core.makeRng((((Number(ctx.seed) || 1) * 22695477) ^ 0x3c6ef372) >>> 0);
        const ca = 0.9801, sa = 0.1987, nB = Math.round(1300 * Math.min(density, 1) * detail);
        for (let k = 0, guard = 0; k < nB && guard < nB * 6; guard++) {
          let qx = bundRng.range(-4.4, 4.4), qy = bundRng.range(-10, 2.5);
          if (bundRng.chance(0.5)) qx = Math.round(qx); else qy = Math.round(qy);
          const X = qx * 46 + bundRng.range(-0.5, 0.5), Y = qy * 27 + bundRng.range(-0.5, 0.5), x = X * ca + Y * sa, z = -X * sa + Y * ca;
          if (z > 26 || z < -232 || Math.abs(x) < 20 || Math.abs(x) > 150 || waterDistJS(x, z) < 15) continue;
          if (Math.hypot((x - townX) / 64, (z + 172) / 128) < 1.15 || hamletJS(x, z, townX) > 0.03) continue;
          if (Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.09 + 0.7) + 0.5 * Math.sin(x * 0.031 + z * 0.043) < -0.15) continue;   // in runs, with gaps
          aI.push(x, z, landHJS(x, z, townX) - 0.1, bundRng.range(2.3, 3.3)); aJ.push(bundRng.range(0, TAU), bundRng(), 0.15 + 0.6 * bundRng() * bundRng(), 0);
          k++;
          if ((guard & 511) === 511) await ctx.yield();
        }
      }
      inst(g, 'aI', aI, 4); inst(g, 'aJ', aJ, 4); g.instanceCount = aI.length / 4;
      const m = new THREE.Mesh(g, mat(STRIP_V, STRIP_F, stripU, { defines: { REED: 1 }, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- boats: moored ghosts round the basin, and sailing boats that travel
    const boatU = { uGhost: { value: 0 }, uFlood: { value: 0 } };
    for (const sail of [false, true]) {
      const g = finish(boatGeometry(sail), 2, THREE.InstancedBufferGeometry), aI = [], aJ = [];
      const n = Math.round((sail ? 22 : 58) * density);
      for (let k = 0; k < n; k++) {
        const q = propRng(), sd = propRng.chance(0.5) ? 1 : -1; let x, z, hd;
        if (q < 0.5) { x = sd * (propRng.chance(0.5) ? 76.3 : 72.4); z = propRng.range(-352, -248); hd = propRng.chance(0.5) ? 0 : Math.PI; }
        else if (q < 0.75) { x = sd * propRng.range(13, 72); z = propRng.chance(0.5) ? -356.5 : -353; hd = Math.PI / 2 * sd; }
        else if (q < 0.9) { x = sd * propRng.range(16, 72); z = -243.5; hd = Math.PI / 2 * sd; }
        else { x = sd * propRng.range(22, 60); z = propRng.range(-335, -265); hd = propRng.range(0, TAU); }
        aI.push(x, z, hd + propRng.range(-0.06, 0.06), propRng.range(0.85, 1.45)); aJ.push(propRng(), 0, propRng(), 0);
      }
      if (!sail) {
        const skI = [], skJ = [];
        for (let k = 0; k < 12; k++) {     // reed skiffs moored under the banks of the canal
          const sd = k % 2 ? 1 : -1;
          skI.push(sd * extraRng.range(5.75, 6.05), -16 - k * 18.5 + extraRng.range(-4, 4), (extraRng.chance(0.5) ? 0 : Math.PI) + extraRng.range(-0.08, 0.08), extraRng.range(0.52, 0.7)); skJ.push(extraRng(), 0, extraRng(), 0);
        }
        // big hulls at their berths in the basin, sails furled: solid, never ghosts. They take their draws last from this
        // stream (the skiffs keep theirs) and are listed before the skiffs, so a skiff's ghost is drawn over a hull behind it
        for (const [bx, bz] of BIG) {
          aI.push(bx, bz, (extraRng.chance(0.5) ? 0 : Math.PI) + extraRng.range(-0.07, 0.07), extraRng.range(2.0, 2.6)); aJ.push(extraRng(), 0, extraRng(), -1);
        }
        for (let k = 0; k < skI.length; k++) { aI.push(skI[k]); aJ.push(skJ[k]); }
      }
      if (sail) {
        for (let k = 0; k < 8; k++) {      // ferries crossing the basin on lanes clear of the barge
          const sd = k % 2 ? 1 : -1, up = propRng.chance(0.5);
          aI.push(sd * (17 + (k >> 1) * 12 + propRng.range(-2, 2)), -300, up ? 0 : Math.PI, propRng.range(1.1, 1.6)); aJ.push(propRng(), propRng.range(2.4, 4.2), propRng(), 92);
        }
        for (let k = 0; k < 12; k++) {     // and out over the drowned fields on each flood
          const sd = k % 2 ? 1 : -1, up = propRng.chance(0.5);
          aI.push(sd * (34 + Math.pow(propRng(), 1.5) * 300), -70 + propRng.range(-30, 30), up ? 0 : Math.PI, propRng.range(1.2, 1.9)); aJ.push(propRng(), propRng.range(3, 5), propRng(), 380);
        }
      }
      inst(g, 'aI', aI, 4); inst(g, 'aJ', aJ, 4); g.instanceCount = aI.length / 4;
      const m = new THREE.Mesh(g, mat(BOAT_V, BOAT_F, boatU, { transparent: true, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
      await ctx.yield();
    }
    // ---- pennants on the four cedar flagpoles
    {
      const n = 18, P = [], UV = [], I = [];
      for (let k = 0; k <= n; k++) for (const v of [0, 1]) { P.push(0, 0, 0); UV.push(k / n, v); }
      for (let k = 0; k < n; k++) { const o = k * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
      const aI = [], aJ = [];
      flagTops.forEach((t, k) => { aI.push(t[0], t[1], t[2], propRng.range(10, 13)); aJ.push(propRng(), k % 2, 0, 0); });
      inst(g, 'aI', aI, 4); inst(g, 'aJ', aJ, 4); g.instanceCount = flagTops.length;
      const m = new THREE.Mesh(g, mat(STRIP_V, STRIP_F, stripU, { defines: { FLAG: 1 }, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- the barge bow, carried along the path
    const bg = bargeGeometry(granite);
    const BU = { uSeg: { value: bg.segs }, uSegR: { value: bg.radii }, uCapA: { value: bg.capA }, uCapB: { value: bg.capB } };
    const barge = new THREE.Mesh(bg.geometry, mat(BARGE_V, BARGE_F, BU, { side: THREE.DoubleSide }));
    barge.frustumCulled = false; scene.add(barge);

    await ctx.yield();
    // ---- ibis: six lift off the bank at the start; forty cross the bow when time lands
    // one light record for the creatures, refreshed from the clocks each frame (no scene walk, nothing allocated)
    const faunaLight = { _resolved: true, sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color(1, 1, 1), sky: new THREE.Color(0.5, 0.6, 0.8), ground: new THREE.Color(0.2, 0.16, 0.1) };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    const ibis = { body: '#f4f1ea', belly: '#ffffff', wingC: '#f2efe8', tip: '#0e0e0e', trail: '#161616', head: '#101010', beak: '#1c1a18', neckC: '#161616', tailC: '#ffffff', legC: '#6a5a50', legs: 0, neck: 0.42 };   // an ibis flies with its legs tucked under the tail (the kit's flamingo trails two long black lines)
    const duration = 40;
    // (the clear air round the line, 14 Oct: this six dealt an ibis 1.2 m from the flown line, and a crossing is keyed to the camera, so the
    // pass came on every visit. The crossing is raised from 1.5 m over the line to 3, which clears it almost by itself, and the kit holds off
    // what is left: it now moves the flight 2.3 m instead of 3.9, and the ibis cross the canal against the sky rather than among the palms.
    // Raised to 5 the flight stood too high and left the frame; the picture, not the figure, chose the 3.)
    fauna.add(F.makeFlock({ rng: rng.fork('ibis-a'), species: 'flamingos', count: 6, size: 1.6, speed: 9, palette: ibis,
      cross: { path, u: 0.055, lead: 20, height: 3, angle: 24, side: 1, span: 120, rise: 5, offset: -11, duration }, keepClear: { path, dist: 2, each: true } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('ibis-b'), species: 'flamingos', count: 40, size: 1.5, speed: 12, palette: ibis, spacing: 2.0,
      cross: { path, u: 0.9, lead: 34, height: 5.6, angle: 34, side: 1, span: 480, rise: 16, bow: 30, duration } }), { always: true });
    await ctx.yield();
    // the real-time opening has ordinary life on the banks: oxen at graze, egrets in the shallows. Once the clock runs they are
    // too quick to see (and by then they are behind the bow): they are sent below ground, never hidden.
    const openers = [], groundAt = (x, z) => landHJS(x, z, townX);
    const oxPreset = { ...F.HERD_PRESETS.bison, h: 1.45, hump: 0.07 };
    openers.push(fauna.add(F.makeHerd({ rng: rng.fork('oxen-a'), preset: oxPreset, count: 6, coat: '#a57c56', center: [19.5, 0, -24], radius: 6.5, heightAt: groundAt, speed: 0.5 }), { always: true }));
    await ctx.yield();
    openers.push(fauna.add(F.makeHerd({ rng: rng.fork('oxen-b'), preset: oxPreset, count: 5, coat: '#6e4c34', center: [-17.5, 0, -11], radius: 4.5, heightAt: groundAt, speed: 0.5 }), { always: true }));
    await ctx.yield();
    {
      const er = rng.fork('egrets'), positions = [];
      for (let k = 0; k < 8; k++) { const sd = k % 2 ? 1 : -1; positions.push([sd * er.range(6.5, 7.1), 0, -9 - k * 4.2 + er.range(-1.2, 1.2)]); }
      openers.push(fauna.add(F.makeWaders({ rng: er, species: 'egret', count: 8, size: 1.15, positions, level: 0, heightAt: groundAt }), { always: true }));
    }
    await ctx.yield();
    // and egrets on the quay by the gate for the landing (they ride the sinking land with the quay)
    let quayBirds = null;
    {
      const er = rng.fork('quay-egrets'), positions = [];
      for (let k = 0; k < 10; k++) { const sd = k % 2 ? 1 : -1; positions.push([sd * er.range(17.5, 34), 3.2, er.range(-361.3, -360.4)]); }
      quayBirds = fauna.add(F.makeWaders({ rng: er, species: 'egret', count: 10, size: 1.5, positions, level: 3.2, depth: 0, peckRate: 0.3 }), { always: true });
    }

    await ctx.yield();
    // ---- harvest landing: dust devils walking the cut fields
    const devils = [];
    if (lastYear === 'harvest') {
      for (let k = 0; k < 2; k++) {
        const d = makeDustDevil({ rng: rng.fork('devil' + k), position: [k ? -140 : 175, 0.8, k ? -335 : -290], height: k ? 30 : 42, radius: [0.9, 7], color: '#cfa66c', colorTop: '#ead2a4', opacity: 0.42, count: 50, debris: 80 });
        d.object.scale.setScalar(0.001); scene.add(d.object); devils.push(d);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- clocks and light
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const cirrus = weather === 'cirrus', khamsin = weather === 'khamsin';
    const K = {
      zenDay: col('#6FB4E0', 1.0).offsetHSL(hueShift, 0.05, khamsin ? 0.02 : -0.03), horDay: col('#F3E2C0', 0.8), zenNight: new THREE.Color(0.062, 0.052, 0.14), horNight: new THREE.Color(0.2, 0.15, 0.32),
      sunLow: new THREE.Color(1.0, 0.48, 0.36), sunHigh: col('#fff0d4', 1.46), skyDay: new THREE.Color(0.165, 0.235, 0.4), skyNight: new THREE.Color(0.3, 0.27, 0.54),
      gndDay: new THREE.Color(0.1, 0.078, 0.05), gndNight: new THREE.Color(0.18, 0.15, 0.28), gold: col(cirrus ? '#ff7f86' : '#ffae48', cirrus ? 1.0 : 0.8),
      rose: new THREE.Color(1.0, 0.5, 0.42), dawnZen: new THREE.Color(0.2, 0.25, 0.5),
      ochre: col('#c99548', 0.8), cloudLitD: new THREE.Color(0.95, 0.92, 0.86), cloudLitN: new THREE.Color(0.16, 0.13, 0.31),
      cloudShD: new THREE.Color(0.5, 0.56, 0.68), cloudShN: new THREE.Color(0.06, 0.05, 0.15), moon: new THREE.Color(0.5, 0.62, 1.0),
    };
    if (cirrus) K.horDay.lerp(new THREE.Color(0.86, 0.6, 0.6), 0.06);          // weather colours every lap, not only the landing
    if (khamsin) { K.horDay.lerp(K.ochre, 0.3); K.zenDay.lerp(K.ochre, 0.14); }
    // day and year are pure functions of u (so they can never run backwards when the flight slows); six laps, none under 3 s
    const DAYT = [0.05, 0.3, 0.62, 0.83], YEART = [0.06, 0.23, 0.71, 0.86];
    // the sun lingers over the day and hurries under the world, so each night is a short violet dip, not half the lap:
    // shown angle = raw + WARP*cos(raw) (monotonic); the ends are solved so the entry and landing suns stand where intended
    const WARP = 0.75, LAPS = 6, warp = (x) => x + WARP * Math.cos(x);
    const unwarp = (target) => { let a = target - 1, b = target + 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (warp(m) < target) a = m; else b = m; } return (a + b) / 2; };
    const phi0 = unwarp(0.1);
    const phiLand = hour === 'golden' ? 118 * d2r : hour === 'night' ? 256 * d2r : 110 * d2r;
    const PHI_MEAN = 118 * d2r, meanDir = new THREE.Vector3();        // where the long exposure holds the sun: high on the left, on the ramp face
    const phiEnd = LAPS * TAU + unwarp(phiLand);
    // ONE calendar: Y counts the years, twenty of them, and the floods, the seasons, every birth and all growth read it.
    // So that twenty floods in one flight do not flicker, each year's flood is long and soft: the water comes up over a
    // quarter of the year (f 0.54-0.78), stands as a mirror to the year's end and drains over the first fifth of the next
    // (f 0-0.22). The fields go under and come out at the same points of the year as the seasons painted on them expect.
    const Yend = lastYear === 'flood' ? 20 : lastYear === 'emerald' ? 19.33 : 19.5, Ystart = 0.26 + (Y0 - 0.3) * 0.7;
    const floodOf = (Y) => { const f = Y - Math.floor(Y); return clamp(smoothstep(0.54, 0.78, f) + 1 - smoothstep(0.0, 0.22, f), 0, 1); };
    const sunTrue = new THREE.Vector3(), keyDir = new THREE.Vector3(), shadeDir = new THREE.Vector3(), tc = new THREE.Color(), tp = new THREE.Vector3();
    const cloudBase = new THREE.Vector2(U.uCloud.value.x, U.uCloud.value.y);
    const trapD = [0, 0], trapY = [0, 0], trapB = [0, 0];
    // the hero's courses rise with the years: the share of the calendar gone by, out of the share that has gone by where
    // the last course is laid (a pure function of the path, like the calendar itself: it never sways with the wall clock)
    trap(hero.schedule.courses, YEART[0], YEART[1], YEART[2], YEART[3], trapB);
    const buildYears = () => clamp(trapY[0] / trapB[0], 0, 1);
    // one eased violet night and one gold dusk inside the held daylight of the lapse, both hung on the day clock: the long
    // exposure lets the dusk in round one sunset of the racing sun and the night in round the middle of one of its nights.
    // Each comes over half a lap of the sun, stands for a lap and goes over half a lap (no lap is under 3 s: the light
    // breathes, it never blinks). Which two days, and which of them is the night, is seeded: two days at least two apart,
    // among the days that lie wholly inside the lapse (the first and the last days belong to the real-time ends).
    const skyRng = ctx.core.makeRng((((Number(ctx.seed) || 1) * 69069) ^ 0x2c1b3c6d) >>> 0);
    const nightFirst = skyRng.chance(0.5);
    const lapDays = skyRng.pick([[1, LAPS - 3], [1, LAPS - 2], [2, LAPS - 2]]);
    const RISE = unwarp(0), SET_F = (unwarp(Math.PI) - RISE) / TAU;   // the clock's sunrise, and the share of a lap the sun is up
    const nightAt = lapDays[nightFirst ? 0 : 1] + (SET_F + 1) / 2, duskAt = lapDays[nightFirst ? 1 : 0] + SET_F;   // in laps since the first sunrise
    const lapWin = (laps, at) => 1 - smoothstep(0.5, 1, Math.abs(laps - at));
    // the khamsin keeps the same clock: it comes up over one lap of the sun, blows for one or two laps and dies over one
    // more. The day it comes and the laps it blows are seeded; it has always blown out before the sun's last full lap.
    const storm = skyRng.pick([[1, 1], [1, 2], [2, 1]]);              // [the day it comes up, the laps it blows]
    const duskKey = cirrus ? new THREE.Color(1.2, 0.5, 0.44) : new THREE.Color(1.3, 0.66, 0.27);

    function setClocks(time, uu) {
      trap(uu, DAYT[0], DAYT[1], DAYT[2], DAYT[3], trapD); trap(uu, YEART[0], YEART[1], YEART[2], YEART[3], trapY);
      const Ed = trapD[0], vd = trapD[1], Ey = trapY[0], vy = trapY[1];
      // a parked camera still sees the lapse breathe: a bounded sway, far slower than the u-driven rate
      const raw = phi0 + (phiEnd - phi0) * Ed + vd * vd * 0.22 * Math.sin(time * 0.2), phi = warp(raw);
      const Y = Ystart + (Yend - Ystart) * Ey + vy * vy * 0.02 * Math.sin(time * 0.17);
      const f = Y - Math.floor(Y), Fl = floodOf(Y), flow = clamp((floodOf(Y + 0.03) - Fl) * 6, -1, 1) * vy;
      // the long exposure: once the clock runs the sky is held in daylight and the sun is a steady band along its arc, so
      // nothing strobes. hold eases in with the lapse rate and lets go as it lands (earlier for the night landing: dusk falls once)
      const hold = uu < 0.5 ? smoothstep(0, 0.5, vd) : smoothstep(0, hour === 'night' ? 0.55 : 0.2, vd);
      // golden landing: the arc sinks towards the south so a low warm sun rakes the ramp face from the left
      const goldLand = hour === 'golden' ? smoothstep(0.6, 0.84, uu) : 0;
      const lat = (latBase - 9 * Fl * vd + (60 - latBase) * goldLand + (40 - latBase) * (hour === 'golden' ? 0 : smoothstep(0.6, 0.84, uu))) * d2r;
      T.set(0, Math.cos(lat), 0).addScaledVector(S, Math.sin(lat)).normalize(); A.crossVectors(E, T).normalize();
      sunTrue.copy(E).multiplyScalar(Math.cos(phi)).addScaledVector(T, Math.sin(phi)).normalize();
      const laps = (raw - RISE) / TAU;                               // sunrises gone by on the day clock
      const nightW = lapWin(laps, nightAt), duskW = lapWin(laps, duskAt);
      const phiMean = PHI_MEAN + 42 * d2r * duskW;                   // at dusk the held sun stands low on the left and every shadow rakes
      meanDir.copy(E).multiplyScalar(Math.cos(phiMean)).addScaledVector(T, Math.sin(phiMean)).normalize();
      const eTrue = sunTrue.y;
      sunTrue.lerp(meanDir, hold).normalize();                       // the sun as shown and as it lights: racing only in the real-time ends
      const e = lerp(eTrue, meanDir.y, hold);
      // the violet dip: the sky fill takes over at about a third of day brightness, soft and shadowless, never black
      const day = lerp(smoothstep(-0.14, 0.12, eTrue), 1, hold) * (1 - nightW), sunVis = lerp(lerp(smoothstep(-0.03, 0.09, eTrue), 1, hold), 0.15, nightW);
      const nightLand = hour === 'night' ? smoothstep(0.78, 0.9, uu) : 0, nightDrift = hour === 'night' ? smoothstep(0.6, 0.9, uu) : 0;
      const kham = khamsin ? smoothstep(storm[0], storm[0] + 1, laps) * (1 - smoothstep(storm[0] + storm[1] + 1, storm[0] + storm[1] + 2, laps)) : 0;
      const dawn = 1 - smoothstep(0.05, 0.17, uu);
      // gold at dusk, and a band of gold on the way into and out of the night
      const glowK = Math.max(Math.exp(-Math.pow((e - 0.03) / 0.17, 2)) * (1 - 0.5 * vd), 0.5 * goldLand, 0.95 * dawn, 0.9 * duskW, 2.2 * nightW * (1 - nightW));

      U.uSunTrue.value.copy(sunTrue); SU.uPhi.value = phi;
      U.uTime.value = time; U.uYear.value = Y; U.uLapse.value = vd; U.uSink.value = SINK_MAX * Fl;
      U.uPalmH.value = 11.5 * lerp(0.16, 1, smoothstep(0, 9, Y + 3.6));
      // key light: the sun, or (full-moon landing only) the moon once the sun is down
      tc.copy(K.sunLow).lerp(K.sunHigh, smoothstep(0.03, 0.42, e) * (1 - 0.8 * goldLand)).lerp(duskKey, 0.75 * duskW).lerp(K.moon, 0.5 * nightW).multiplyScalar(sunVis * (1 - 0.55 * kham) * (1 + 0.42 * dawn));
      if (kham > 0) tc.lerp(K.ochre, kham * 0.5 * sunVis);
      // night landing: as the held sun lets go the moon takes the key over from nearly the same quarter (its light leans onto
      // the ramp face), so the casing goes from gold to blue-white without ever standing flat and unlit
      const moonK = hour === 'night' ? smoothstep(0.74, 0.88, uu) * (1 - sunVis) : 0;
      keyDir.copy(sunTrue); if (hour === 'night') keyDir.lerp(moonKey, 1 - sunVis).normalize();
      tc.r += K.moon.r * moonK; tc.g += K.moon.g * moonK; tc.b += K.moon.b * moonK;
      const shadowK = Math.max(sunVis, 0.8 * moonK);
      // the second clock: in the lapse the brightness is held (no strobe) but every shadow still sweeps like a clock hand and
      // lengthens once a lap, and the shading leans a part of the way with it so the terminator swings on the pyramid's faces
      shadeDir.copy(keyDir);
      const swK = hold * (1 - nightW), swA = swK * (0.28 + 0.78 * Math.sin(raw));      // from ahead-left round to behind-left: they always cross the canal
      if (swK > 0) {
        let ca = Math.cos(swA), sa = Math.sin(swA), kx = keyDir.x, kz = keyDir.z;
        keyDir.x = kx * ca + kz * sa; keyDir.z = kz * ca - kx * sa;
        keyDir.y *= 1 - 0.62 * swK * (0.5 + 0.5 * Math.cos(raw)) * (1 - duskW); keyDir.normalize();
        ca = Math.cos(swA * 0.45); sa = Math.sin(swA * 0.45); kx = shadeDir.x; kz = shadeDir.z;
        shadeDir.x = kx * ca + kz * sa; shadeDir.z = kz * ca - kx * sa;
      }
      if (keyDir.y < 0.06) { keyDir.y = 0.06; keyDir.normalize(); }
      // shadows follow the true low sun (long, sweeping); the shading direction is lifted so raking light still paints the ground
      if (shadeDir.y < 0.2) { shadeDir.y = 0.2; shadeDir.normalize(); }
      U.uSunDir.value.copy(shadeDir); U.uShDir.value.copy(keyDir); U.uSunCol.value.copy(tc); U.uShadow.value = shadowK * (1 - 0.6 * kham);
      sun.color.copy(tc); sun.intensity = Math.PI; sun.position.copy(shadeDir).multiplyScalar(400).add(heroLook); sun.target.position.copy(heroLook); sun.target.updateMatrixWorld();
      U.uDiscCol.value.copy(K.sunLow).lerp(K.sunHigh, smoothstep(0.0, 0.3, e)).lerp(duskKey, 0.6 * duskW).multiplyScalar(4.4 * (1 - 0.5 * vd) * (1 - 0.7 * kham) * (1 - nightW) * (1 + 0.2 * duskW));
      const fillK = (1 - 0.45 * nightLand) * (1 - 0.2 * nightDrift) * (1 - 0.3 * dawn);
      U.uSkyCol.value.copy(K.skyNight).lerp(K.skyDay, day).multiplyScalar(fillK); if (kham > 0) U.uSkyCol.value.lerp(K.ochre, kham * 0.55 * day);
      if (dawn > 0) U.uSkyCol.value.lerp(tc.setRGB(0.26, 0.24, 0.5), 0.5 * dawn);
      U.uGndCol.value.copy(K.gndNight).lerp(K.gndDay, day).multiplyScalar(fillK);
      hemi.color.copy(U.uSkyCol.value); hemi.groundColor.copy(U.uGndCol.value); hemi.intensity = Math.PI;
      faunaLight.sunDir.copy(shadeDir); faunaLight.sunColor.copy(U.uSunCol.value).multiplyScalar(Math.PI);
      faunaLight.sky.copy(U.uSkyCol.value).multiplyScalar(Math.PI); faunaLight.ground.copy(U.uGndCol.value).multiplyScalar(Math.PI);
      U.uZen.value.copy(K.zenNight).lerp(K.zenDay, day); U.uHor.value.copy(K.horNight).lerp(K.horDay, day);
      if (dawn > 0) { U.uZen.value.lerp(K.dawnZen, 0.6 * dawn); U.uHor.value.lerp(tc.setRGB(0.78, 0.5, 0.46), 0.5 * dawn); }
      if (goldLand > 0) { U.uHor.value.multiplyScalar(1 - 0.24 * goldLand); U.uZen.value.lerp(tc.setRGB(0.1, 0.21, 0.48), 0.55 * goldLand); }
      if (duskW > 0) { U.uZen.value.lerp(tc.setRGB(0.085, 0.16, 0.43), 0.78 * duskW); if (cirrus) tc.setRGB(0.92, 0.5, 0.5); else tc.setRGB(0.98, 0.6, 0.28); U.uHor.value.lerp(tc, 0.42 * duskW); }
      if (nightDrift > 0) { U.uZen.value.lerp(tc.setRGB(0.07, 0.08, 0.3), 0.5 * nightDrift * day); }
      if (nightLand > 0) { U.uZen.value.multiplyScalar(1 - 0.45 * nightLand); U.uHor.value.multiplyScalar(1 - 0.35 * nightLand); }
      if (kham > 0) { tc.copy(K.ochre).multiplyScalar(0.25 + 0.75 * day); U.uZen.value.lerp(tc, kham * 0.85); U.uHor.value.lerp(tc, kham * 0.9); }
      tc.copy(K.gold).lerp(K.rose, dawn);
      U.uGlow.value.copy(tc).multiplyScalar(glowK * (1 - 0.6 * kham) * (1 - 0.8 * nightLand));
      U.uHor.value.lerp(tc.multiplyScalar(0.75), glowK * 0.35 * day);
      U.uFogCol.value.copy(U.uHor.value).multiplyScalar(0.94).add(tc.copy(U.uGlow.value).multiplyScalar(0.1));
      U.uFogDen.value = 0.0007 + 0.0016 * kham + (hour === 'golden' ? 0.00012 * smoothstep(0.8, 0.95, uu) : 0) + (cirrus ? 0.00008 : 0);
      scene.fog.color.copy(U.uFogCol.value); scene.fog.density = U.uFogDen.value;
      U.uCloudLit.value.copy(K.cloudLitN).lerp(K.cloudLitD, day).add(tc.copy(U.uGlow.value).multiplyScalar(0.55));
      U.uCloudShade.value.copy(K.cloudShN).lerp(K.cloudShD, day).add(tc.copy(U.uGlow.value).multiplyScalar(0.15));
      if (dawn > 0) U.uCloudShade.value.lerp(tc.setRGB(0.3, 0.27, 0.46), 0.6 * dawn);
      const cu = U.uCloud.value; cu.x = cloudBase.x + windDir * (time * 0.006 + raw * 0.11); cu.y = cloudBase.y + time * 0.002 + raw * 0.03;
      cu.z = vd; cu.w = (cirrus ? 0.24 : khamsin ? 0.3 : 0.26 + 0.2 * lapK) + 0.15 * kham - 0.1 * dawn;
      const dark = smoothstep(0.7, 1, 1 - day);
      // stars: in the violet dip of the lapse (as arcs round the pole), and once the clock has landed on a night (as points)
      SU.uStars.value = Math.max(dark * (1 - 0.8 * kham) * (1 + 0.5 * nightLand) * (1 - hold), smoothstep(0.45, 1, nightW) * (1 - 0.5 * kham));
      SU.uStarRot.value = raw * 0.45 + time * 0.002; SU.uStarArc.value = 0.32 * vd;
      SU.uMoon.value = nightLand;
      if (rare) { const cw = smoothstep(0.28, 0.34, uu) * (1 - smoothstep(0.6, 0.66, uu)); SU.uComet.value.set(Math.max(dark, 0.3 * hold) * cw * 1.4, 0.06 + 0.3 * clamp((uu - 0.28) / 0.36, 0, 1)); }
      // flood state for the water: the mirror clears as the rise stills and clouds again as it drains, as softly as the flood itself
      const clear = f < 0.5 ? 1 - smoothstep(0.0, 0.16, f) : smoothstep(0.72, 0.88, f);
      WU.uMirrorK.value = clear; WU.uDusk.value = duskW;
      WU.uSilt.value = f > 0.5 ? smoothstep(0.54, 0.68, f) * (1 - 0.8 * smoothstep(0.72, 0.88, f)) + 0.12 : 0.12 + 0.2 * (1 - clear);
      WU.uRip.value = lerp(0.11, 0.04, clear) + 0.1 * Math.abs(flow) + 0.03 * vd;
      // lotus pads lie on a clear mirror and show as the lapse slows to its landing (the share of its rate the day clock
      // has shed, once it is past the middle of its run): at the full rate a pad is gone before it can be seen
      WU.uLotus.value = (Ed > 0.5 ? 1 - vd : 0) * (lastYear === 'flood' ? Math.max(0.8 * clear, smoothstep(0.84, 0.92, uu)) : 0.8 * clear);
      stripU.uFlow.value = flow; boatU.uGhost.value = Y * 1.3; boatU.uFlood.value = smoothstep(0.75, 1, Fl);
    }

    const pt = new THREE.Vector3();
    function update(dt, time, camera, u) {
      const uu = clamp(u ?? 0, 0, 1);
      setClocks(time, uu);
      path.pointAt(uu, pt);
      barge.visible = !ctx.through;                                  // a mesh, no light below it: the portal's near plane would slice it
      barge.position.set(pt.x, BARGE_DY + Math.sin(time * 0.8) * 0.03 + Math.sin(time * 0.31) * 0.02, pt.z + BARGE_DZ);
      barge.rotation.x = Math.sin(time * 0.55) * 0.006; barge.rotation.z = Math.sin(time * 0.37 + 1) * 0.004;
      WU.uBow.value.set(pt.x, pt.z + BARGE_DZ, ctx.through ? 0 : 1);    // no bow wave where no bow is drawn
      hero.setProgress(uu, buildYears());
      hero.setGlint(smoothstep(0.79, 0.9, uu) * (0.6 + 0.4 * Math.sin(time * 1.1)));
      hero.update(dt, time, camera);
      WU.uLineY.value = hero.uniforms.uLineY.value; WU.uCapY.value = hero.uniforms.uDim.value.z;
      WU.uRampHead.value = hero.uniforms.uRampHead.value;
      U.uPyr.value.w = clamp(hero.uniforms.uCourse.value * hero.uniforms.uDim.value.w, 6, 146) * HS;
      if (camera) {
        fauna.setLight(faunaLight);
        const gone = uu > 0.105 ? -60 : 0;
        for (const o of openers) o.object.position.y = gone;
        quayBirds.object.position.y = -U.uSink.value * 0.82;
        fauna.update(dt, time, camera, uu);
        for (const d of devils) { d.object.scale.setScalar(uu > 0.7 ? smoothstep(0.7, 0.76, uu) + 0.001 : 0.001); if (d.update) d.update(dt, time, camera); }
      }
    }
    // start state without a camera: clocks at u = 0, the hero at its foundations, the barge at the entry
    setClocks(0, 0); hero.setProgress(0, buildYears()); path.pointAt(0, pt); barge.position.set(pt.x, BARGE_DY, pt.z + BARGE_DZ); WU.uBow.value.set(pt.x, pt.z + BARGE_DZ, 1);

    return {
      scene, path, duration,
      title: 'Twenty Floods',
      ride: 'none', style: 'none',
      camera: { fov: 58, near: 0.3, nearThrough: 0.3, far: 6000, lookAhead: 30, sway: 0.3, bank: 0 },
      pois: [{ at: new THREE.Vector3(-25, 3, -62), from: 0.015, to: 0.115, weight: 0.36 }, { at: heroLook, from: 0.07, to: 0.86, weight: 0.7 }],
      portal: { shape: 'rect', width: 12.6, height: 6.6, color: '#ffe3a6', glow: 0.8, revealDistance: 330 },
      post: {
        exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fff8ee', shadowTint: '#0c0a1c', vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); for (const d of devils) if (d.dispose) d.dispose(); },
    };
  },
};
