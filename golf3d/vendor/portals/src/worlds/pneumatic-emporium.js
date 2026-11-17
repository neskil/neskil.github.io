// THE PNEUMATIC EMPORIUM. We are a brass cash capsule fired through a glass pneumatic tube: along the rack
// in the basement dispatch room, up through the shop floor, two and a half laps up the galleried well of a
// 1910 Buenos Aires department store, across a glass bridge past the clock column and into the great horn
// under the cashier's nest. The hero set piece (src/parts/pneumatic-emporium.js) is the tube bundle, the
// clock, the nest and the horn; this file builds the building round it: basement, balconies, dome, lifts,
// goods, cash railway, silk, bunting, palms, birds, dust, and the capsule we ride.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { plantGeometry } from '../kit/interior.js';
import { buildHero, GLASS_VERT, GLASS_FRAG, premult } from '../parts/pneumatic-emporium.js';

const PAL = ['#EFE6D2', '#B88A3A', '#1C2B2A', '#1E8C7A', '#F4F8F6', '#B3202C', '#8FC1E3'];
const WA = 55, WB = 35, DEG = Math.PI / 180, TAU = Math.PI * 2;
const TIER = 13, NBAY = 24, BASE_LEN = 132, LEAD = 36, LIFT_OFF = -17.5;
const ID = { PLAIN: 0, STONE: 1, WOOD: 2, BRASS: 3, BRICK: 4, TILE: 5, CLOTH: 6, GLOW: 7 };

// ------------------------------------------------------------------ shaders
// One lighting model for everything the world builds: a zenith key through the dome (masked to the open well,
// dimmer toward the shop floor, tinted by the dome's feather pattern), a hemisphere fill, an optional low sun
// bar, or (BASEMENT) the pools under the pavement lights. Vertex colour is the albedo; its alpha is a surface id.
const LIGHT_PARS = /* glsl */`
uniform vec3 uKeyC; uniform vec3 uSkyC; uniform vec3 uGndC; uniform vec3 uFogC; uniform float uFogD;
uniform sampler2D uCookie; uniform vec4 uCk; uniform vec4 uSun; uniform vec3 uSunC; uniform float uTime;
uniform vec4 uSlot; uniform mat4 uBInv; uniform vec3 uPaneL;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
// the coloured panes' light on the ground: soft overlapping scallops, every other one coloured
float featherPatch(vec2 p) {
  vec2 g = p / vec2(15.0, 11.5); float row = floor(g.y); g.x += 0.5 * mod(row, 2.0);
  vec2 f = fract(g) - 0.5; float alt = mod(floor(g.x) + row, 2.0);
  float a = alt * (1.0 - smoothstep(0.27, 0.4, length(f * vec2(1.0, 0.82))));      // distinct patches, cream stone between them
  vec2 f2 = fract(g + vec2(0.5, 0.5)) - 0.5;
  return max(a, (1.0 - alt) * 0.55 * (1.0 - smoothstep(0.1, 0.24, length(f2))));
}
#ifdef BASEMENT
vec3 shopLight(vec3 P, vec3 N) {
  vec3 q = (uBInv * vec4(P, 1.0)).xyz; vec3 n = mat3(uBInv) * N;
  float zc = floor((q.z + 4.0) / 16.0) * 16.0 + 4.0; float xc = (q.x < 0.0 ? -1.0 : 1.0) * (abs(q.x) < 10.0 ? 5.0 : 15.0);
  float r = 1.9 + 0.12 * max(-1.0 - q.y, 0.0);
  vec2 d = q.xz - vec2(xc, zc);
  float I = exp(-dot(d, d) / (r * r)) * 4.4 / r;
  // no lamp is lit: cold white daylight falls through the pavement lenses in pools, and the rest of the room is left to their spill
  vec3 L = vec3(0.84, 0.95, 1.0) * I * (0.3 + 0.7 * max(n.y, 0.0));
  float dz = q.z + 24.0;
  L += vec3(0.86, 0.98, 0.96) * (2.0 / (1.0 + dz * dz / 1500.0)) * (0.22 + 0.78 * max(-n.z, 0.0));      // the white grid at the end of the room
  L += vec3(0.37, 0.3, 0.26) * (0.65 + 0.35 * n.y);                                    // what the brick and the flags throw back: the room's own warmth
  L += vec3(0.5, 0.53, 0.56) * max(-n.y, 0.0) * (0.27 + 1.7 * exp(-dot(d, d) / 45.0));   // the vault takes the light thrown back up round each lens
  return L;
}
#else
vec3 shopLight(vec3 P, vec3 N) {
  vec2 qe = P.xz / vec2(55.0, 35.0); float e = dot(qe, qe);
  float inside = step(-0.5, P.y);
  float open = (1.0 - smoothstep(0.95, 1.5, e)) * inside;      // sky seen: the fill
  float openK = (1.0 - smoothstep(0.95, 2.4, e)) * inside;     // the dome's light slants in under the balconies
  float hy = clamp(P.y / 84.0, 0.0, 1.0);
  float h = mix(0.55, 1.18, hy);
  // the dome's feather pattern fans out as it falls (a conic projection), so balcony fronts carry patches as well as floors
  // the pattern falls outward as well as down, so balcony fronts and the arcades behind carry patches as well as the floor
  float rr = length(P.xz);
  vec2 pp = P.xz - P.xz / max(rr, 1.0) * (84.0 - P.y) * 0.85 * smoothstep(14.0, 40.0, rr) + uCk.xy * 120.0;
  vec3 tint = mix(vec3(1.17, 1.13, 1.035), uPaneL, clamp(featherPatch(pp) * uCk.w, 0.0, 1.0));
  // under a balcony the slab above cuts the dome's light off: it reaches the floor and the counters, the upper wall stays in blue-grey shade
  float din = max(sqrt(e) - 1.0, 0.0) * 42.0, tyy = mod(max(P.y, 0.0), 13.0);
  float slab = step(1.0, e) * (1.0 - step(84.0, P.y)) * smoothstep(-2.5, 3.0, din * 0.85 - (11.6 - tyy));
  openK *= 1.0 - 0.52 * slab;
  float dn = dot(N.xz, -P.xz / max(length(P.xz), 1.0));
  float inw = mix((0.55 + 0.45 * dn) * length(N.xz), max(dn, 0.0), smoothstep(0.78, 0.95, e));   // things standing free in the well are lit all round
  float dif = clamp(0.24 + 0.7 * max(N.y, 0.0) + 0.5 * inw, 0.0, 1.0) * (1.0 + 0.85 * min(N.y, 0.0));
  vec3 L = uKeyC * uCk.z * tint * openK * h * dif;
  // under a balcony: the soffit and whatever faces down sit in soft blue-grey shade; walls, piers and goods take the light thrown
  // back by the cream floor and the bright well, so stone stays cream there, never grey
  vec3 shade = mix(vec3(0.8, 0.9, 1.1), vec3(1.12, 1.02, 0.84), smoothstep(-0.7, 0.15, N.y)) * (0.78 + 0.5 * max(inw, 0.0));
  L += mix(uGndC, uSkyC, N.y * 0.5 + 0.5) * mix(shade, vec3(1.0), open) * (0.55 + 0.45 * h) * mix(vec3(1.0), tint, 0.35 * open);
  L += uKeyC * vec3(0.3, 0.285, 0.24) * max(-N.y, 0.0) * inside * (0.6 + 0.4 * h) * (1.0 - smoothstep(1.0, 2.6, e));     // soffits take the light the cream floor throws back up
  L += step(P.y, -0.5) * vec3(0.2, 0.235, 0.27) * (0.65 + 0.35 * N.y);
  float t = (84.0 - P.y) / max(uSun.y, 0.05); vec2 qs = (P.xz + uSun.xz * t) / vec2(55.0, 35.0);
  float inS = mix(1.0 - smoothstep(0.84, 0.97, dot(qs, qs)), 1.0, smoothstep(82.0, 86.0, P.y));
  // under a balcony the slab above cuts the sun off: it reaches in only as far as its slope allows
  float kIn = max(sqrt(e) - 1.0, 0.0) * 42.0;
  inS *= 1.0 - step(1.0, e) * (1.0 - step(84.0, P.y)) * smoothstep(10.6, 12.6, mod(P.y, 13.0) + kIn * uSun.y / max(length(uSun.xz), 0.05));
  L += uSunC * uSun.w * inS * max(dot(N, uSun.xyz) * 0.8 + 0.2, 0.0);
  return max(L, vec3(0.0));
}
#endif
vec3 shopFog(vec3 col, float dist) { float f = dist * uFogD; return mix(col, uFogC, 1.0 - exp(-f * f)); }
`;
const SHOP_VERT = /* glsl */`
attribute vec4 aCol;
#ifdef SWAY
attribute float aSw; uniform float uTime;
#endif
#ifdef CLOTH
attribute vec3 aCl; uniform float uTime;
#endif
#ifdef HEROCOL
attribute vec3 color;
#endif
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec3 vO;
void main() {
  vec4 p = vec4(position, 1.0); vec3 n = normal; vO = position;
  #ifdef USE_INSTANCING
    #ifdef SWAY
      float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4;
      p.x += aSw * (0.22 * sin(uTime * 1.3 + ph + p.y * 0.6) + 0.09 * sin(uTime * 2.9 + ph * 1.7 + p.z * 1.6));
      p.z += aSw * 0.16 * sin(uTime * 1.1 + ph * 1.3 + p.x * 0.9);
    #endif
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
    #ifdef NEARCUT
      // a collar of our own tube is dropped just before it reaches the eye, where it would be one huge thin ring round the picture
      if (distance(cameraPosition, (modelMatrix * instanceMatrix[3]).xyz) < 6.5) p.xyz = instanceMatrix[3].xyz;
    #endif
  #endif
  #ifdef CLOTH
    float w = sin(uTime * 1.7 + aCl.y) * 0.6 + sin(uTime * 3.1 + aCl.y * 1.7 + p.y * 0.35) * 0.4;
    p.xyz += n * aCl.x * w; p.y += aCl.x * 0.25 * sin(uTime * 2.3 + aCl.y);
    // a flag within a few metres of the eye folds up against its cord, so none hangs in the face
    p.y += aCl.z * (1.0 - smoothstep(7.0, 16.0, distance(cameraPosition, (modelMatrix * p).xyz)));
  #endif
  vec4 w4 = modelMatrix * p; vW = w4.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0.0, 1e-6, 0.0)); vC = aCol;
  #ifdef HEROCOL
    vC = vec4(color, HEROID);
  #endif
  #ifdef HEROWHITE
    vC = vec4(1.0, 1.0, 1.0, HEROID);
  #endif
  #ifdef USE_INSTANCING_COLOR
    vC.rgb *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;
const SHOP_FRAG = LIGHT_PARS + /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec3 vO;
#ifdef CAPSULE
uniform float uSelf;
#endif
#ifdef NEARFADE
uniform vec3 uBrC; uniform float uFade;
#endif
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-6, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
  float id = vC.a; vec3 base = max(vC.rgb, vec3(0.0));       // (a sliver of a triangle can hand over an overshot colour)
  float fwT = max(fwidth(vW.x), fwidth(vW.z)) / 2.2;
  if (id > 6.5) { gl_FragColor = vec4(max(shopFog(base, dist * 0.5), vec3(0.0)), 1.0); return; }
  #ifndef BASEMENT
    if (id > 0.5 && id < 1.5 && vW.y < -0.02 && vW.y > -3.5) discard;      // the ground columns' corbels would hang through the basement vault
  #endif
  if (id > 3.5 && id < 5.5 && vW.y > -3.2 && vW.y < 0.5) {
    vec2 pa = vW.xz - uSlot.xy, ba = uSlot.zw - uSlot.xy; float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), -0.5, 1.15);
    float dSl = length(pa - ba * hh);
    if (dSl < (vW.y > -0.3 ? 4.3 : 3.0)) discard;
  }
  vec2 hp = abs(N.x) > abs(N.z) ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
  bool flat_ = abs(N.y) > 0.6;
  vec2 tp = flat_ ? vW.xz : hp;
  #ifdef CAPSULE
    tp = vec2(atan(vO.x, vO.z + 1e-5) * 0.32, vO.y);
  #endif
  float nearK = 1.0 - smoothstep(22.0, 70.0, dist);
  vec3 c = base * (0.9 + 0.2 * vn(tp * 0.9)) * (0.96 + 0.08 * nearK * vn(tp * 6.3));
  float gloss = id < 0.5 ? 0.14 : 0.0, selfLit = 0.0;
  if (id > 0.5 && id < 1.5) {
    float cy = tp.y / 1.3, row = floor(cy), fxx = tp.x / 2.6 + 0.5 * mod(row, 2.0);
    vec2 f = abs(fract(vec2(fxx, cy)) - 0.5);
    float j = flat_ ? 0.0 : max(smoothstep(0.475, 0.5, f.x), smoothstep(0.455, 0.5, f.y));
    c *= 1.0 - 0.2 * j * nearK; c *= 0.95 + 0.1 * nearK * h21(vec2(floor(fxx), row));
    c *= 0.93 + 0.07 * vn(tp * vec2(0.35, 2.1) + 7.0);
  } else if (id > 1.5 && id < 2.5) {
    float g = vn(vec2(tp.x * 0.7, tp.y * 9.0) + 3.0 * vn(tp * 0.8)); c *= 0.78 + 0.44 * g; gloss = 0.3;
  } else if (id > 2.5 && id < 3.5) { gloss = 1.0; c *= (0.72 + 0.28 * vn(tp * vec2(0.7, 4.0) + 11.0)) * vec3(1.19, 0.97, 0.65);
  } else if (id > 3.5 && id < 4.5) {
    float cy = tp.y / 0.32, row = floor(cy), fxx = tp.x / 0.78 + 0.5 * mod(row, 2.0);
    vec2 f = abs(fract(vec2(fxx, cy)) - 0.5);
    float bk = 1.0 - smoothstep(0.1, 0.42, fwT * 6.0);                       // courses too fine to draw melt into their average
    float j = max(smoothstep(0.45, 0.5, f.x), smoothstep(0.4, 0.5, f.y)) * nearK * bk;
    c *= mix(1.0, 0.72 + 0.56 * h21(vec2(floor(fxx), row)), bk);
    c = mix(c, vec3(0.55, 0.52, 0.47) * (base.r + base.g) * 0.9, j * 0.75);
  } else if (id > 4.5 && id < 5.5) {
    vec2 g = vW.xz / 2.2; vec2 ci = floor(g); float chk = mod(ci.x + ci.y, 2.0); vec2 f = abs(fract(g) - 0.5);
    float k = 1.0 - smoothstep(0.35, 1.2, fwT);
    float j = smoothstep(0.47, 0.5, max(f.x, f.y)) * k;
    #ifdef BASEMENT
      c *= 0.8 + 0.4 * h21(ci) * k; c *= 1.0 - 0.45 * j; gloss = 0.1;
    #else
      if (gl_FrontFacing && vW.y < 0.5) {
        // the shop floor is a mosaic, the dome's feathers answered in stone: fourteen feathers fan from under the clock's foot, a
        // gold ring is laid over the fan round every display island, and a dark band between two gold lines runs round the well's
        // edge, 0.6 m in from it and the same width all the way. Every edge is softened by the size of a picture point on the
        // floor (pm, from fwT above the discards) times how fast its own measure changes: no derivative is taken here.
        float nz = c.g / max(base.g, 1e-3), pm = fwT * 2.2 + 1e-3;
        vec2 q2 = vW.xz / vec2(33.0, 20.0); float r2 = max(length(q2), 1e-3), cell = atan(q2.y, q2.x) / 6.2831853 * 14.0, af = abs(fract(cell) - 0.5);
        float gA = 2.228 * length(vec2(q2.y / 33.0, q2.x / 20.0)) / (r2 * r2), gR = length(vec2(q2.x / 33.0, q2.y / 20.0)) / r2;      // what a metre is in af and in r2
        float hw = 0.47 * pow(sin(clamp((r2 - 0.25) / 0.75, 1e-4, 1.0) * 1.5708), 0.75);      // a feather's half width: from a point under the clock's foot to its full width at the islands, with no shoulder there
        float fF = r2 < 1.0 ? af / hw : length(vec2(af / 0.47, (r2 - 1.0) / 0.36));
        float fw = min(pm * max(gA / hw, gR / 0.36), 1.0) + 1e-4, inF = 1.0 - smoothstep(1.0 - fw, 1.0 + fw, fF);
        float rim = inF * smoothstep(0.8 - fw, 0.8 + fw, fF);
        float rib = (1.0 - smoothstep(0.07 - 0.5 * fw, 0.07 + 0.5 * fw, fF)) * (1.0 - smoothstep(1.0 - pm * gR, 1.0 + pm * gR, r2));
        float bx = r2 * 7.0 - af * 5.0, bd = pm * (7.0 * gR + 5.0 * gA);       // the barbs: drawn no finer than the picture can hold, melting into their average beyond
        float barb = mix(1.0 - smoothstep(0.06 - bd, 0.14 + bd, abs(fract(bx) - 0.5)), 0.2, smoothstep(0.15, 0.5, bd));
        // the rings: one round each island that is built (the same two rules as the build's: none at the oval's ends, none by our tube's
        // opening), laid over the fan, so a ring is whole even where its island stands wider than its feather, and begun under the
        // rug's edge so no sliver of floor shows between them; a boss ends every rib
        float ring = 0.0, ci0 = floor(cell); vec2 sm = 0.5 * (uSlot.xy + uSlot.zw);
        for (int n = -1; n <= 1; n++) {
          float ia = (ci0 + float(n) + 0.5) / 14.0 * 6.2831853; vec2 ic = vec2(cos(ia) * 33.0, sin(ia) * 20.0); float dn = length(vW.xz - ic);
          float built = (1.0 - step(30.0, abs(ic.x)) * step(abs(ic.y), 7.0)) * step(13.0, length(ic - sm));
          ring = max(ring, built * smoothstep(4.6 - pm, 4.6 + pm, dn) * (1.0 - smoothstep(5.5 - pm, 5.5 + pm, dn)));
          if (n == 0) rib = max(rib, 1.0 - smoothstep(0.9 - pm, 0.9 + pm, dn));
        }
        vec3 mG = vec3(0.04, 0.15, 0.125), mO = vec3(0.55, 0.32, 0.07), mD = vec3(0.015, 0.07, 0.06);
        vec3 mc = mix(mG * (1.0 + 0.5 * barb), mO, max(rim, rib));
        // the border, measured in metres in from the well's edge; where our tube comes up it runs to the opening's brass kerb and stops
        vec2 qe = vW.xz / vec2(55.0, 35.0); float mr = max(length(qe), 1e-3), dW = (1.0 - mr) * mr / max(length(vec2(qe.x / 55.0, qe.y / 35.0)), 1e-5);
        float line = smoothstep(0.6 - pm, 0.6 + pm, dW) * (1.0 - smoothstep(4.8 - pm, 4.8 + pm, dW));
        float band = smoothstep(1.2 - pm, 1.2 + pm, dW) * (1.0 - smoothstep(4.2 - pm, 4.2 + pm, dW));
        c = mix(c, mc * nz, inF); c = mix(c, mO * nz, max(ring, line)); c = mix(c, mD * 1.3 * nz, band);
      }
      c = mix(c, c * vec3(0.62, 0.7, 0.7), mix(0.2, chk * 0.4, k)); c *= 0.9 + 0.2 * k * h21(ci); c *= 1.0 - 0.3 * j; gloss = 0.22;
      if (!gl_FrontFacing && vW.y < 0.5) {      // the shop floor from below, on the way up: warm timber joists and boards, lit by the spill from the well
        vec2 pj = vW.xz - uSlot.xy, bj = uSlot.zw - uSlot.xy; float hj = clamp(dot(pj, bj) / max(dot(bj, bj), 1e-4), -0.5, 1.15);
        float dj = length(pj - bj * hj), jx = abs(fract(vW.x * 0.9) - 0.5), bz = abs(fract(vW.z * 2.2) - 0.5);
        float joist = 1.0 - smoothstep(0.1, 0.16, jx);
        c = mix(vec3(0.34, 0.2, 0.1) * (0.85 + 0.15 * smoothstep(0.44, 0.5, bz)), vec3(0.62, 0.4, 0.2), joist) * (0.8 + 0.4 * vn(vW.xz * vec2(1.3, 9.0)));
        c *= 0.45 + 1.5 * exp(-dj / 7.0); gloss = 0.0; selfLit = 1.0;
      }
    #endif
  } else if (id > 5.5) {
    c *= 0.92 + 0.08 * nearK * sin(tp.x * 31.0) * sin(tp.y * 31.0);
    #ifdef SILK
      float sw = fwidth(vO.x) + 1e-4, la = abs(vO.x);
      float band = smoothstep(0.68 - sw, 0.68 + sw, la) * (1.0 - smoothstep(0.92 - sw, 0.92 + sw, la));     // a woven border down each edge
      float pin = smoothstep(0.6 - sw, 0.6 + sw, la) * (1.0 - smoothstep(0.64 - sw, 0.64 + sw, la));
      float zig = abs(fract(vO.y / 0.56) - 0.5) * 2.0;                                                        // a running zigzag inside the border
      float zz = (1.0 - smoothstep(0.035, 0.035 + 2.0 * sw, abs(la - 0.74 - 0.12 * zig))) * band;
      vec2 mq = vec2(vO.x, vO.y) / 0.44; mq.x += 0.5 * mod(floor(mq.y), 2.0); vec2 mf = fract(mq) - 0.5;
      float motif = (1.0 - smoothstep(0.2, 0.2 + 3.0 * sw, abs(mf.x) + abs(mf.y))) * (1.0 - step(0.56, la)); // small lozenges woven into the field
      float eye = 1.0 - smoothstep(0.05, 0.05 + 3.0 * sw, abs(mf.x) + abs(mf.y));
      vec3 bordC = mix(vec3(0.74, 0.5, 0.13), vec3(0.93, 0.9, 0.8), step(0.2, c.r - c.b));
      vec3 c0 = c;
      c = mix(c, c0 * 0.66, 0.85 * motif); c = mix(c, bordC, 0.9 * eye * motif);
      c = mix(c, bordC, 0.88 * band); c = mix(c, c0 * 0.55, zz); c = mix(c, c0 * 0.5, pin);
      float stripe = 0.5 + 0.5 * sin(vO.x * 26.0); stripe = mix(0.5, stripe, clamp(0.12 / max(sw * 26.0, 1e-3), 0.0, 1.0));
      float weave = sin(vO.x * 150.0) * sin(vO.y * 150.0) * clamp(0.02 / max(sw * 150.0, 1e-3), 0.0, 1.0);
      c *= 0.93 + 0.1 * stripe + 0.05 * weave;
      c *= 0.9 + 0.1 * smoothstep(0.0, 0.5, abs(fract(vO.y / 3.2) - 0.5) * 2.0);                              // faint creases where it lay folded
      c *= mix(0.34, 1.14, smoothstep(-0.75, 0.85, dot(N, normalize(vec3(0.5, 0.45, 0.74)))));                // deep folds: lit crests, shadowed valleys
      float fl = sin(vO.x * 6.4 + vO.y * 0.21 + 0.6 * sin(vO.y * 0.4 - uTime * 1.1) + 0.9);                   // the long folds' own shade, sliding as the cloth runs
      c *= 0.8 + 0.26 * fl + 0.1 * smoothstep(0.55, 1.0, fl);
    #endif
    #ifdef CAPSULE
      c *= 0.72 + 0.5 * vn(tp * 130.0) * vn(tp * 47.0 + 3.0) + 0.16 * vn(tp * 9.0);
    #endif
  }
  vec3 L = mix(shopLight(vW, N), vec3(1.0), selfLit);
  vec3 R = reflect(-V, N); float up = smoothstep(-0.1, 0.9, R.y);
  float fr = 1.0 - max(dot(N, V), 0.0); fr = fr * fr;
  vec3 Lup = shopLight(vW, vec3(0.0, 1.0, 0.0));
  #ifdef CAPSULE
    L += vec3(uSelf) * (0.55 + 0.45 * N.y); Lup += vec3(uSelf);
  #endif
  vec3 col = c * L;
  #ifdef SWAY
    // light comes through a leaf: a frond carries through, in a leaf green, what the light on its far face has over half the
    // light on the face turned to the eye, as a frond does under a skylight. A frond seen from below under the dome, or against
    // the low sun, takes the most; a leaf in even light takes half its far light; a face about twice as well lit as its far face,
    // or better, stands as it was. Leaf matter is told by its own albedo (green well over red): the tub, the soil and the stalks
    // are not leaves (the tub's colour is pinned by this world). A leaf's body passes green whatever the colour of the light and
    // however dark its skin, so what comes through counts mostly by its brightness and the darkest frond tones still pass a share.
    float leafK = smoothstep(1.6, 2.2, base.g / max(base.r, 1e-3));
    if (leafK > 0.0) {
      vec3 sur = max(shopLight(vW, -N) - 0.5 * L, vec3(0.0));
      col += vec3(0.17, 0.6, 0.06) * (leafK * (0.09 + 0.6 * c.g)) * mix(sur, vec3(dot(sur, vec3(0.3, 0.5, 0.2))), 0.6);
    }
  #endif
  if (id > 2.5 && id < 3.5) {
    // polished brass: it mirrors the pale dome on everything that faces up, the cream stone round it, and a warm dark below;
    // the coloured panes barely tint it, so it stays gold rather than olive
    vec3 Lw = mix(Lup, vec3(dot(Lup, vec3(0.3, 0.5, 0.2))), 0.7) * vec3(1.06, 1.0, 0.88);
    vec3 Ld = mix(L, vec3(dot(L, vec3(0.3, 0.5, 0.2))), 0.6) * vec3(1.06, 1.0, 0.88);
    float ry = R.y, sky = smoothstep(-0.25, 0.5, ry);
    vec3 env = mix(vec3(0.2, 0.135, 0.07), vec3(0.62, 0.58, 0.5), sky) + vec3(0.9, 0.86, 0.74) * pow(max(ry, 0.0), 6.0);
    float topline = pow(max(N.y, 0.0), 8.0), flank = max(N.y, 0.0);            // a long pale highlight along the top of every rod, rim and flank
    env = mix(env, vec3(0.14, 0.09, 0.045), 0.7 * smoothstep(0.05, -0.6, N.y)) + vec3(1.0, 0.95, 0.82) * (topline + 0.22 * flank * flank);
    float lathe_ = 0.9 + 0.1 * sin(tp.y * 190.0) * nearK;
    col = c * (Ld * 0.42 + Lw * env * 1.25 * lathe_) + Lw * vec3(1.0, 0.93, 0.78) * (0.14 * fr * sky + 0.24 * topline + 0.07 * flank);
    #ifdef CAPSULE
      // turned brass in the dim basement: a dark belly, a long pale highlight along the top, a bright edge
      float groove = min(abs(vO.y + 0.7), abs(vO.y - 0.48));
      col *= mix(0.3, 1.0, smoothstep(-0.8, 0.3, N.y)) * vec3(0.9, 0.96, 1.08) * (0.5 + 0.5 * smoothstep(0.012, 0.05, groove));
      col += vec3(1.0, 0.94, 0.78) * uSelf * (5.0 * pow(max(N.y, 0.0), 6.0) + 1.3 * pow(max(N.y, 0.0), 40.0) + 0.6 * fr);
      // the end cap, seen when a rival is dead ahead: a turned boss and a ring, brighter toward the middle
      float capR = length(vO.xz), capK = 1.0 - smoothstep(-0.97, -0.9, vO.y);
      col *= mix(1.0, (0.5 + 0.5 * smoothstep(0.0, 0.03, abs(capR - 0.22))) * (0.6 + 0.4 * smoothstep(0.05, 0.09, capR)) * mix(1.9, 0.9, smoothstep(0.0, 0.38, capR)), capK);
    #endif
  } else if (id > 5.5) {
    col += c * Lup * 0.55 * fr;                                  // nap: cloth and felt glow a little at grazing angles
    #ifdef SILK
      vec3 Hs = normalize(V + vec3(0.1, 0.96, 0.1)); float sp = max(dot(N, Hs), 0.0); float sp2 = sp * sp; sp2 *= sp2;
      col += Lup * (0.16 * sp2 + 0.3 * sp2 * sp2 * sp2) * mix(vec3(1.0), c, 0.4);                              // the long sheen of silk
      col += c * Lup * (0.06 + 0.22 * smoothstep(0.7, 1.0, abs(vO.x)));                                         // light comes through it, most at the thin edges
      // and through the cloth that hangs unrolled, where we see the face the folds' shade falls on: the light that falls on the far
      // face, in the cloth's own colour and weave and deeper dyed for having passed the thread, as a banner shows against a skylight
      // (the shade's own measure is undone for the light that passes). It counts by the square of the shade, so a face in deep shade
      // is lit through and a fold on a face in the light keeps half or more of its own shade. A dyed thread glows in its own colour
      // whatever the tint of the pane the light fell through, so the far light counts mostly by its brightness: a red silk hanging in
      // the dome's green light is red, not black. A bolt of a deep dye shows the passing light most and a middling one a little (told
      // by the bolt's own colour, not the thread's, so its woven lines keep their order); a cream or white bolt, which already throws
      // back most of what falls on it, is left as it was. The part still wound in its roll is solid and passes none
      float litF = smoothstep(-0.75, 0.85, dot(N, normalize(vec3(0.5, 0.45, 0.74)))), shF = 1.0 - litF;
      vec3 cT = c / mix(0.34, 1.14, litF), Lfar = shopLight(vW, -N);
      float deep = (1.0 - smoothstep(0.09, 0.46, dot(base, vec3(0.3, 0.5, 0.2)))) * (1.0 - smoothstep(1.0, 1.03, vO.z));
      col += cT * cT / max(max(cT.r, cT.g), max(cT.b, 1e-3)) * mix(Lfar, vec3(dot(Lfar, vec3(0.3, 0.5, 0.2))), 0.7) * (0.8 * deep * shF * shF);
    #endif
  } else {
    col += Lup * up * gloss * vec3(0.05 + 0.3 * fr);
  }
  float aOut = 1.0;
  #ifdef NEARFADE
    // a bridge that hangs close overhead while we look up at the dome thins away, and comes back as we draw level or move off
    aOut = 1.0 - uFade * (1.0 - smoothstep(38.0, 56.0, distance(cameraPosition, uBrC))) * smoothstep(0.0, 5.0, uBrC.y - cameraPosition.y);
    if (aOut < 0.004) discard;
  #endif
  gl_FragColor = vec4(max(shopFog(col, dist), vec3(0.0)), aOut);      // never below black, whatever a sliver of a pixel does
}`;
// iron lace: drawn on plain quads. uv in metres, aMode picks the design:
// 0 bellied balustrade scrolls, 1 cage filigree, 2 folding gate, 3 shaft bracing.
const LACE_VERT = /* glsl */`
attribute float aMode;
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vMode;
void main() {
  vec4 p = vec4(position, 1.0); vec3 n = normal; vec2 u = uv;
  #ifdef USE_INSTANCING
    u.x *= length(instanceMatrix[0].xyz);
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w4 = modelMatrix * p; vW = w4.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0.0, 1e-6, 0.0)); vUv = u; vMode = aMode;
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;
const LACE_FRAG = LIGHT_PARS + /* glsl */`
uniform vec3 uIron;
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vMode;
float ring(vec2 p, float r, float w) { return abs(length(p) - r) - w; }
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-6, 0.0)); if (!gl_FrontFacing) N = -N;
  float dist = max(length(cameraPosition - vW), 1e-3);
  float aa = max(0.75 * (fwidth(vUv.x) + fwidth(vUv.y)), 1e-3);
  float d = 1e3, dens = 0.3, brassK = 0.0;
  if (vMode < 0.5) {
    float pw = 1.5; vec2 q = vec2(mod(vUv.x, pw) - pw * 0.5, vUv.y - 1.45);
    d = abs(q.x) - 0.05;                                        // upright between panels
    d = min(d, abs(abs(q.x) - pw * 0.5) - 0.035);
    vec2 a = vec2(abs(q.x) - 0.38, abs(q.y) - 0.62);
    d = min(d, ring(a, 0.3, 0.04));                              // four C scrolls
    d = min(d, ring(vec2(abs(q.x) - 0.38, q.y), 0.17, 0.035));
    d = min(d, ring(vec2(q.x, abs(q.y) - 1.12), 0.2, 0.035));
    d = min(d, abs(abs(q.x) + abs(q.y) * 0.6 - 0.34) / 1.166 - 0.035); // lozenge
    d = min(d, length(q) - 0.1);
    d = min(d, abs(abs(q.y) - 1.4) - 0.05);
    dens = 0.34;
  } else if (vMode < 1.5) {
    vec2 q = vec2(mod(vUv.x, 1.2) - 0.6, mod(vUv.y, 1.2) - 0.6);
    d = abs(abs(q.x) + abs(q.y) - 0.6) / 1.414 - 0.035;
    d = min(d, abs(mod(vUv.y, 2.4) - 1.2) - 0.05);
    float dB = min(ring(q, 0.2, 0.034), length(vec2(abs(q.x) - 0.6, q.y)) - 0.085);      // gilt rosettes and studs in the cage's filigree
    brassK = step(dB, d); d = min(d, dB);
    dens = 0.3;
  } else if (vMode < 2.5) {
    vec2 q = vec2(mod(vUv.x, 0.6) - 0.3, mod(vUv.y, 0.9) - 0.45);
    d = abs(abs(q.x) * 1.5 - abs(q.y)) / 1.803 - 0.028;
    d = min(d, abs(q.x) - 0.022);
    dens = 0.4; brassK = 1.0;                                    // the folding gate is brass
  } else {
    vec2 q = vec2(vUv.x, mod(vUv.y, 6.5) - 3.25);
    d = abs(abs(q.y) - 3.25) - 0.1;
    d = min(d, abs(abs(q.x * 1.0) - abs(q.y) * 0.92) / 1.36 - 0.05);
    d = min(d, ring(q, 0.9, 0.05));
    dens = 0.12;
  }
  float cov = 1.0 - smoothstep(-aa, aa, d);
  float farK = smoothstep(0.06, 0.3, aa);
  float a = mix(cov, dens, farK);
  // looked up through from underneath, a shaft's four walls of bracing would lie over one another across the dome: there each gives less
  if (vMode > 2.5) a *= 1.0 - 0.72 * smoothstep(0.4, 0.8, (vW.y - cameraPosition.y) / dist);
  if (a < 0.01) discard;
  vec3 Lu = shopLight(vW, vec3(0.0, 1.0, 0.0));
  vec3 col = mix(uIron * shopLight(vW, N) * 1.45, vec3(0.8, 0.56, 0.2) * (0.35 * shopLight(vW, N) + 0.55 * Lu), brassK * (1.0 - 0.6 * farK));
  col += Lu * mix(vec3(0.03, 0.045, 0.04), vec3(0.3, 0.26, 0.16), brassK) * cov * smoothstep(0.0, -0.05, d + 0.02);     // a lit line along the middle of every bar
  col = shopFog(col, dist);
  gl_FragColor = vec4(col * a, a);
}`;
// the dome: feather panes from the cookie canvas, a sky that breathes, pigeon shadows on the outside
const DOME_FRAG = LIGHT_PARS + /* glsl */`
uniform vec3 uPane; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uIron; uniform float uMilk; uniform vec3 uGold;
varying vec3 vW; varying vec3 vL;
void main() {
  float dist = max(length(cameraPosition - vW), 1e-3);
  vec2 uv = vL.xz / vec2(114.0, 74.0) + 0.5;
  vec4 t = texture2D(uCookie, uv);
  float hgt = clamp((vL.y - 84.0) / 28.0, 0.0, 1.0);
  float cl = vn(vL.xz * 0.035 + vec2(uTime * 0.17, uTime * 0.07)) * 0.6 + vn(vL.xz * 0.09 - vec2(uTime * 0.24, 0.05 * uTime)) * 0.4;
  vec3 sky = mix(uHor, uZen, 0.25 + 0.75 * hgt);
  sky = mix(sky, vec3(1.0, 0.99, 0.96), smoothstep(0.42, 0.72, cl) * 0.85);        // cloud: soft white heaps with blue between
  sky = mix(sky, vec3(0.83, 0.85, 0.85) * (0.86 + 0.28 * cl), uMilk);
  sky *= uCk.z * 0.86;
  float sat = max(max(t.r, t.g), t.b) - min(min(t.r, t.g), t.b);
  float lum = dot(t.rgb, vec3(0.3, 0.5, 0.2));
  float isPane = smoothstep(0.08, 0.22, sat);
  float rib = 1.0 - smoothstep(0.12, 0.3, lum);
  vec3 paneC = mix(uPane * 1.35, uGold, smoothstep(0.12, 0.4, t.r - t.b));        // the feathers' eyes are gold glass
  vec3 col = mix(sky, mix(sky, vec3(dot(sky, vec3(0.3, 0.5, 0.2))), 0.5) * paneC, isPane * (1.0 - uMilk * 0.9));
  // pigeons walking on the outside of the glass: soft dark blobs
  float sh = 0.0;
  for (int i = 0; i < 11; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(fi * 2.1 + 1.0) * 30.0 + 9.0 * sin(uTime * 0.23 + fi * 1.7), cos(fi * 1.3 + 0.4) * 17.0 + 7.0 * sin(uTime * 0.19 + fi * 2.9));
    vec2 dd = (vL.xz - c) / vec2(2.1, 1.4);
    sh = max(sh, 1.0 - smoothstep(0.5, 1.2, length(dd)));
  }
  col *= 1.0 - 0.45 * sh;
  col = mix(col, uIron * 2.2 * (uSkyC + uKeyC * 0.25), rib);
  gl_FragColor = vec4(shopFog(col, dist * 0.35), 1.0);
}`;
const DOME_VERT = /* glsl */`
varying vec3 vW; varying vec3 vL;
void main() { vL = position; vec4 w4 = modelMatrix * vec4(position, 1.0); vW = w4.xyz; gl_Position = projectionMatrix * viewMatrix * w4; }`;
// light cones under the pavement lenses
const CONE_FRAG = /* glsl */`
uniform float uTime; uniform float uGain;
varying vec3 vW; varying vec3 vN; varying float vH;
void main() {
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
  float f = abs(dot(normalize(vN + vec3(0.0, 1e-6, 0.0)), V));
  float dist = length(cameraPosition - vW);
  float a = f * f * f * (0.16 + 0.84 * clamp(vH, 0.0, 1.0) * clamp(vH, 0.0, 1.0)) * uGain * mix(1.0, 0.4, smoothstep(24.0, 80.0, dist)) * (0.1 + 0.9 * smoothstep(7.0, 30.0, dist));
  a *= 0.85 + 0.15 * sin(vW.y * 1.7 + uTime * 0.6 + vW.x);
  // dust turning in the cone
  vec2 dq = vec2(vW.x * 1.7 + vW.z * 1.3, vW.y * 2.2 + uTime * 0.22) * 2.6; vec2 di = floor(dq), df = fract(dq) - 0.5;
  vec2 dk = fract(di * vec2(0.1234, 0.3455)); dk += dot(dk, dk + 34.345); float dh = fract(dk.x * dk.y);
  a += step(0.9, dh) * (1.0 - smoothstep(0.05, 0.22, length(df))) * f * vH * 0.35 * (1.0 - smoothstep(10.0, 45.0, dist)) * (0.6 + 0.4 * sin(uTime * 2.0 + dh * 40.0));
  gl_FragColor = vec4(vec3(0.78, 0.92, 1.0) * a, 1.0);
}`;
const CONE_VERT = /* glsl */`
attribute float aH; varying vec3 vW; varying vec3 vN; varying float vH;
void main() { vH = aH; vec4 w4 = modelMatrix * vec4(position, 1.0); vW = w4.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0)); gl_Position = projectionMatrix * viewMatrix * w4; }`;
// silk: a ribbon that unrolls from a bolt on the balustrade; aT 0 at the rail, 1 at the free end
const SILK_VERT = /* glsl */`
attribute vec4 aCol; attribute vec3 aS; attribute vec3 aOut;
uniform float uTime; uniform vec3 uUn;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec3 vO;
// one point of the cloth: t along its 30 m, lat metres across. It falls from the bolt, ripples, hangs in long folds, and its free end flutters.
vec3 silkAt(float t, float lat, float un, vec3 side) {
  float te = min(t, un), fall = te * 30.0, open = smoothstep(0.0, 3.0, fall), ph = aS.z * 2.1;
  float rip = sin(fall * 0.55 - uTime * 3.2 + ph) * 0.3 + sin(fall * 1.3 - uTime * 5.1 + lat * 0.8 + ph) * 0.12;
  float fold = sin(lat * 6.4 + fall * 0.21 + ph + 0.6 * sin(fall * 0.4 - uTime * 1.1)) * 0.25 + sin(lat * 13.0 - fall * 0.3 + uTime * 0.9) * 0.045;
  float flut = sin(uTime * 7.0 + lat * 2.2 + ph) * 0.3 * smoothstep(0.72, 1.0, te / max(un, 1e-3)) * open;
  vec3 p = position + side * (lat * (1.0 - open * (0.16 + 0.1 * sin(fall * 0.23 + ph))) + 0.3 * sin(fall * 0.31 - uTime * 1.7 + ph) * open);
  p += aOut * (0.08 + (rip + fold) * open + flut);
  p.y -= fall;
  float rest = t - te, ang = rest * 60.0, rr = (0.16 + 0.5 * clamp(1.0 - un, 0.0, 1.0)) * step(1e-4, rest);   // still wound on the bolt
  p += (aOut * sin(ang) + vec3(0.0, 1.0, 0.0) * (cos(ang) - 1.0)) * rr;
  return p;
}
void main() {
  float un = aS.z < 0.5 ? uUn.x : (aS.z < 1.5 ? uUn.y : uUn.z);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), aOut));
  vec3 p = silkAt(aS.x, aS.y, un, side);
  vec3 pt = silkAt(aS.x + 0.004, aS.y, un, side), pl = silkAt(aS.x, aS.y + 0.04, un, side);
  vec3 n = cross(pl - p, pt - p); float nl = length(n); n = nl > 1e-6 ? n / nl : -aOut;
  vO = vec3(aS.y, min(aS.x, un) * 30.0, aS.x / max(un, 1e-3));
  vec4 w4 = modelMatrix * vec4(p, 1.0); vW = w4.xyz; vN = n; vC = aCol;
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;

// ------------------------------------------------------------------ small geometry kit
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
// merges coloured parts into one geometry: position, normal, aCol (rgb + surface id)
function makeB() {
  const pos = [], nor = [], col = [], idx = [];
  return {
    get tris() { return idx.length / 3; },
    add(g, m, c, id = 0, o = {}) {
      const p = g.attributes.position, nn = g.attributes.normal, base = pos.length / 3, k0 = o.k ?? 1, gr = o.grad;
      if (m) _nm.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) {
        _v.fromBufferAttribute(p, i); _n.fromBufferAttribute(nn, i);
        if (m) { _v.applyMatrix4(m); _n.applyMatrix3(_nm).normalize(); }
        let k = k0; if (gr) k *= lerp(gr[2], gr[3], clamp((_v.y - gr[0]) / (gr[1] - gr[0]), 0, 1));
        if (o.jit) k *= 1 + o.jit * (((i * 7919) % 13) / 13 - 0.5);
        pos.push(_v.x, _v.y, _v.z); nor.push(_n.x, _n.y, _n.z); col.push(c.r * k, c.g * k, c.b * k, id);
      }
      if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx.push(base + a[i]); }
      else for (let i = 0; i < p.count; i++) idx.push(base + i);
      g.dispose();
      return this;
    },
    quad(a, b, c, d, color, id = 0, k = 1) {                     // a,b,c,d anticlockwise seen from the lit side
      const base = pos.length / 3;
      _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _n.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); _v.cross(_n).normalize();
      for (const q of [a, b, c, d]) { pos.push(q[0], q[1], q[2]); nor.push(_v.x, _v.y, _v.z); col.push(color.r * k, color.g * k, color.b * k, id); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      return this;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
      g.computeBoundingSphere();
      return g;
    },
  };
}
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function M(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0, r1, h, s = 8, open = false) => new THREE.CylinderGeometry(r1, r0, h, s, 1, open);
const lathe = (prof, segs = 8) => new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), segs);
const ball = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
// point on the well edge moved outward by off, with its outward normal and its tangent (increasing angle)
function ellF(th, off = 0, y = 0) {
  const c = Math.cos(th), s = Math.sin(th);
  let nx = WB * c, nz = WA * s; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
  return { x: WA * c + nx * off, y, z: WB * s + nz * off, nx, nz, tx: -nz, tz: nx };
}
// matrix with X along the tangent, Y up, Z toward the well centre
function frameM(f, y, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().set(f.tx * sx, 0, -f.nx * sz, f.x, 0, sy, 0, y, f.tz * sx, 0, -f.nz * sz, f.z, 0, 0, 0, 1);
}
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

const LOOKS = [
  { name: 'spring', pane: '#1E8C7A', key: '#F4F8F6', keyI: 1.5, sky: '#cdd3d6', gnd: '#c9bea4', fog: '#f1f0e6', fogD: 0.0041, zen: '#5f9fe0', hor: '#dde9f2', milk: 0, ck: 1.0, sat: 1.14, sunI: 0, bunt: ['#8FC1E3', '#F4F8F6'], cloth: ['#EFE6D2', '#1E8C7A', '#B3202C', '#8FC1E3', '#c9a24a', '#F4F8F6'], tint: '#f9fafb' },
  { name: 'jacaranda', pane: '#8a63c9', key: '#f6f3fb', keyI: 1.28, sky: '#c0c0d6', gnd: '#c2b6a4', fog: '#efecf0', fogD: 0.0041, sat: 1.12, zen: '#7a9be0', hor: '#e4e2f4', milk: 0, ck: 0.85, sunI: 0, bunt: ['#b9a0e6', '#F4F8F6'], cloth: ['#EFE6D2', '#8a63c9', '#B3202C', '#b9a0e6', '#c9a24a', '#F4F8F6'], tint: '#f8f5ff' },
  { name: 'white-sale', pane: '#1E8C7A', key: '#F4F8F6', keyI: 1.36, sky: '#cfd5d8', gnd: '#c6c0ae', fog: '#eff1ee', fogD: 0.0043, zen: '#9fb9d2', hor: '#e6eef2', milk: 0.82, ck: 0, sat: 1.1, sunI: 0, bunt: ['#8FC1E3', '#F4F8F6'], cloth: ['#F4F8F6', '#8FC1E3', '#e9eef0', '#bcd9ee', '#F4F8F6', '#d6e6f2'], tint: '#fbfdff' },
  { name: 'four-pm', pane: '#1E8C7A', key: '#d2def2', keyI: 1.08, sky: '#b4c4de', gnd: '#b2aca8', fog: '#dde5f0', fogD: 0.0047, zen: '#4f86cc', hor: '#f3dcb8', milk: 0, ck: 0.5, sunI: 5.6, sun: [-0.42, 0.33, -0.84], sunC: '#ffb25e', sat: 1.12, bunt: ['#8FC1E3', '#F4F8F6'], cloth: ['#EFE6D2', '#1E8C7A', '#B3202C', '#8FC1E3', '#c9a24a', '#F4F8F6'], tint: '#f2f6ff' },
];

export default {
  id: 'pneumatic-emporium',
  name: 'The Pneumatic Emporium',
  category: 'interior',
  weirdness: 0.3,
  media: ['rail', 'interior', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng.fork('emporium');
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const vr = ctx.rng.fork('emporium-look-d'), sd = Math.abs(Math.floor(Number(ctx.seed))) || 0;
    // 0 the late-spring morning (the brief's default, and the commonest), 1 jacaranda week, 2 the white sale, 3 four in the afternoon
    let lookI = [0, 1, 2, 3, 1, 0, 2, 0, 3, 2, 0, 1, 2, 0, 1, 3][sd % 16];
    if (vary.hour === 'golden') lookI = 3; else if (vary.hour === 'day' && lookI === 3) lookI = 0;
    const LK = LOOKS[lookI];
    const noseI = lookI === 2 ? (vr.int(0, 2), 0) : [0, 0, 2][vr.int(0, 2)], /* (the white sale: the red nose is the only warmth) */ swallows = vr.chance(0.4), liftLoad = vr.int(0, 2);
    const C = (h) => new THREE.Color(h);
    const cCream = C(PAL[0]), cBrass = C(PAL[1]), cIron = C(PAL[2]), cDay = C(PAL[4]), cRed = C(PAL[5]);
    const cPane = C(LK.pane), cWood = C('#5a2a17'), cWoodD = C('#34170e'), cStone = C('#ecdcb6');
    const cStoneD = cCream.clone().lerp(C('#aab6bf'), 0.3).multiplyScalar(0.9), cIronL = C('#27594e'), cValance = C('#14584f');
    const clothC = LK.cloth.map(C);
    const scene = new THREE.Scene();
    const fogDark = C('#3a3f3d'), fogPale = C(LK.fog);
    scene.fog = new THREE.FogExp2(fogDark.clone(), 0.006);
    scene.background = fogPale.clone();

    // ---------------------------------------------------------------- the hero and the path
    const sunDir = new THREE.Vector3(...(LK.sun || [-0.9, 0.27, 0.35])).normalize(), zenith = new THREE.Vector3(0.12, 1, 0.08).normalize();
    const hero = await buildHero(ctx, { palette: PAL, pane: LK.pane, capsules: 40, portalFill: false, leadIn: LEAD,
      light: { color: LK.key, intensity: LK.sunI ? 0.8 : 1.0, dir: LK.sunI ? sunDir : zenith }, rivalAhead: () => 70 });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors;
    const path = makePath(A.flyThrough);
    const DUR = 38;
    // The flight used to begin 132 m back in the dispatch room; it now begins LEAD metres before the ramp, so the first
    // second is already the way up into the store. Every scripted moment below is still written in the old measure
    // ("uo": 0 at the far end of the room); toOld and toNew convert between that and the path's own u.
    const LOLD = path.length + (BASE_LEN - LEAD), toOld = (u) => 1 - (1 - u) * path.length / LOLD, toNew = (uo) => clamp(1 - (1 - uo) * LOLD / path.length, 0, 1);
    const hemi = new THREE.HemisphereLight(C(LK.sky), C(LK.gnd), 1.0);
    const keyL = new THREE.DirectionalLight(C(LK.sunI ? '#ffe6bf' : LK.key), LK.sunI ? 1.5 : 1.6);
    keyL.position.copy(LK.sunI ? sunDir : zenith).multiplyScalar(200); keyL.target.position.set(0, 0, 0);
    scene.add(hemi, keyL, keyL.target);
    await ctx.yield();

    // where our tube comes up through the shop floor
    const slot = new THREE.Vector4();
    {
      const p = new THREE.Vector3(); let a = null, b = null;
      for (let i = 0; i <= 600; i++) { path.pointAt(toNew(0.1 + 0.1 * i / 600), p); if (!a && p.y > -3.2) a = p.clone(); if (!b && p.y > 1.2) { b = p.clone(); break; } }
      slot.set(a.x, a.z, b.x, b.z);
    }
    // the basement's frame: origin where the ramp starts, the camera flies toward local -z
    const bDir = A.entry.direction.clone().setY(0).normalize();
    const bOrg = A.entry.position.clone().addScaledVector(bDir, LEAD);
    const bX = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), bDir.clone().negate()).normalize();
    const bMat = new THREE.Matrix4().makeBasis(bX, new THREE.Vector3(0, 1, 0), bDir.clone().negate()).setPosition(bOrg.x, 0, bOrg.z);
    const bInv = bMat.clone().invert();

    // ---------------------------------------------------------------- dome pattern (also the light cookie)
    const cookieCv = document.createElement('canvas'); cookieCv.width = 512; cookieCv.height = 512;
    {
      const g = cookieCv.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 512);
      g.translate(256, 256);
      const paneHex = '#' + cPane.getHexString(), rib = '#0c1414';
      for (let k = 0; k < 11; k++) {
        const r = 248 - k * 22, n = Math.max(6, Math.round((TAU * r) / 44)), s = 26.5;
        for (let i = 0; i < n; i++) {
          const a = ((i + (k % 2) * 0.5) / n) * TAU, x = Math.cos(a) * r, y = Math.sin(a) * r, green = (i + k) % 2 === 0;
          g.beginPath(); g.arc(x, y, s, 0, TAU); g.fillStyle = green ? paneHex : '#fbfdfc'; g.fill();
          g.lineWidth = 3.2; g.strokeStyle = rib; g.stroke();
          g.beginPath(); g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, green ? 7 : 12, 0, TAU); g.fillStyle = green ? '#e8a82c' : paneHex; g.fill();
          if (!green) { g.beginPath(); g.arc(x + Math.cos(a) * 8.5, y + Math.sin(a) * 8.5, 5.5, 0, TAU); g.fillStyle = '#fbfdfc'; g.fill(); }
        }
      }
      g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.fillStyle = '#fbfdfc'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#e8a82c'; g.stroke();
      g.strokeStyle = rib; g.lineWidth = 3;
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a) * 262, Math.sin(a) * 262); g.stroke(); }
      g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 251, 0, TAU); g.stroke();
    }
    const cookie = new THREE.CanvasTexture(cookieCv); cookie.colorSpace = THREE.SRGBColorSpace;
    cookie.minFilter = THREE.LinearMipmapLinearFilter; cookie.generateMipmaps = true; cookie.anisotropy = 4;
    await ctx.yield();

    // ---------------------------------------------------------------- shared uniforms and materials
    const U = {
      uKeyC: { value: C(LK.key).multiplyScalar(LK.keyI) }, uSkyC: { value: C(LK.sky).multiplyScalar(0.62) }, uGndC: { value: C(LK.gnd).multiplyScalar(0.46) },
      uFogC: { value: fogPale.clone() }, uFogD: { value: LK.fogD }, uCookie: { value: cookie }, uCk: { value: new THREE.Vector4(0, 0, 1, LK.ck) },
      uSun: { value: new THREE.Vector4(sunDir.x, sunDir.y, sunDir.z, LK.sunI) }, uSunC: { value: C(LK.sunC || '#ffe2b4') }, uTime: { value: 0 },
      uSlot: { value: slot }, uBInv: { value: bInv }, uPaneL: { value: cPane.clone().multiplyScalar(0.45 / Math.max(0.08, 0.3 * cPane.r + 0.5 * cPane.g + 0.2 * cPane.b)).lerp(new THREE.Color(1, 1, 1), 0.06) },
    };
    const UB = { ...U, uFogC: { value: fogDark.clone() }, uFogD: { value: 0.0052 } };
    const shopMat = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...(o.basement ? UB : U), ...(o.uniforms || {}) }, vertexShader: o.vert || SHOP_VERT, fragmentShader: SHOP_FRAG,
      side: o.side ?? THREE.FrontSide, defines: { ...(o.basement ? { BASEMENT: 1 } : {}), ...(o.defines || {}) } });
    const mShop = shopMat(), mShop2 = shopMat({ side: THREE.DoubleSide }), mBase = shopMat({ basement: true }), mBase2 = shopMat({ basement: true, side: THREE.DoubleSide });
    const mSway = shopMat({ side: THREE.DoubleSide, defines: { SWAY: 1 } }), mCloth = shopMat({ side: THREE.DoubleSide, defines: { CLOTH: 1 } });
    const mLace = premult(new THREE.ShaderMaterial({ uniforms: { ...U, uIron: { value: C('#26493f') } }, vertexShader: LACE_VERT, fragmentShader: LACE_FRAG, side: THREE.DoubleSide }));
    const brFade = { value: 1 };
    const atrium = new THREE.Group(); atrium.name = 'atrium'; scene.add(atrium);
    const basement = new THREE.Group(); basement.name = 'basement'; scene.add(basement);
    const addMesh = (parent, geo, mat, name, order) => { const m = new THREE.Mesh(geo, mat); m.name = name; if (order !== undefined) m.renderOrder = order; parent.add(m); return m; };
    const instanced = (parent, geo, mat, list, name, colors) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
      list.forEach((m, i) => { im.setMatrixAt(i, m); if (colors) im.setColorAt(i, colors[i]); });
      im.count = list.length; im.instanceMatrix.needsUpdate = true; if (colors && im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false; im.name = name; parent.add(im); return im;
    };
    {
      const hm = (id, o = {}) => shopMat({ side: o.side, defines: { [o.white ? 'HEROWHITE' : 'HEROCOL']: 1, HEROID: id.toFixed(1), ...(o.near ? { NEARCUT: 1 } : {}) } });
      const hBrass = hm(ID.BRASS), hBrass2 = hm(ID.BRASS, { side: THREE.DoubleSide }), hIron = hm(ID.PLAIN), hFelt = hm(ID.CLOTH, { white: true }), hBrassN = hm(ID.BRASS, { near: true }), old = new Set();
      hero.object.traverse((o) => {
        if (!o.isMesh) return;
        if (o.name === 'bridgeBrass') {
          old.add(o.material); o.renderOrder = 0.3;
          o.material = shopMat({ uniforms: { uBrC: { value: o.userData.centre.clone() }, uFade: brFade }, defines: { HEROCOL: 1, HEROID: ID.BRASS.toFixed(1), NEARFADE: 1 } }); o.material.transparent = true;
          return;
        }
        const n = o.name, m = n === 'horn' ? hBrass2 : n === 'ironWork' ? hIron : n === 'capsuleNoses' ? hFelt : n === 'ourCollars' ? hBrassN : (n === 'brassWork' || n === 'collars' || n === 'ourCollars' || n === 'capsules' || (o.parent && o.parent.name === 'pendulum')) ? hBrass : null;
        if (m) { old.add(o.material); o.material = m; }
      });
      for (const m of old) m.dispose();
    }
    await ctx.yield();

    // ---------------------------------------------------------------- one bay of balcony, instanced round the well
    const bayW = [], bayF = [];                                   // chord frames: mid point, tangent, width
    for (let i = 0; i < NBAY; i++) {
      const a = ellF(i * 15 * DEG), b = ellF((i + 1) * 15 * DEG), w = Math.hypot(b.x - a.x, b.z - a.z);
      const tx = (b.x - a.x) / w, tz = (b.z - a.z) / w;
      bayF.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, tx, tz, nx: tz, nz: -tx }); bayW.push(w);
    }
    // local point of bay i -> world (lx across in metres, lz toward the well centre)
    const bayPt = (i, lx, y, lz) => { const f = bayF[i]; return [f.x + f.tx * lx - f.nx * lz, y, f.z + f.tz * lx - f.nz * lz]; };
    const bayRot = (i) => Math.atan2(bayF[i].tx, bayF[i].tz) - Math.PI / 2;      // rotation about y that turns +x onto the tangent
    const bayGeo = (upper) => {
      const b = makeB(), r = rng.fork(upper ? 'bay' : 'bay0'), shelfC = [...clothC, C('#c9a24a'), cRed, cPane, C('#e9dcc4')];
      if (upper) {
        b.quad([-0.5, 0, 0.45], [0.5, 0, 0.45], [0.7, 0, -16], [-0.7, 0, -16], cStone, ID.TILE);
        b.quad([-0.7, -0.6, -16], [0.7, -0.6, -16], [0.5, -0.6, 0.3], [-0.5, -0.6, 0.3], cStoneD, ID.PLAIN, 0.8);
        b.add(box(1, 0.38, 0.6), M(0, -0.01, 0.2), cStone, ID.STONE, { k: 1.06 });
        b.add(box(1, 0.6, 0.4), M(0, -0.5, 0.1), cStone, ID.STONE, { k: 0.9 });
        b.add(box(1, 0.3, 0.5), M(0, -0.95, 0.15), cStone, ID.STONE, { k: 1.0 });
        for (let i = 0; i < 3; i++) b.add(box(0.1, 0.2, 0.16), M((i + 0.5) / 3 - 0.5, -0.31, 0.39), cStone, ID.STONE, { k: 1.1 });
        b.add(box(1, 0.09, 0.44), M(0, -0.76, 0.1), cStone, ID.PLAIN, { k: 0.55 });          // shadow lines and a gilt bead, so the fascia is never a bare band
        b.add(box(1, 0.07, 0.62), M(0, -0.215, 0.2), cStone, ID.PLAIN, { k: 0.6 });
        b.add(box(1, 0.06, 0.04), M(0, 0.1, 0.51), cBrass, ID.BRASS);
        b.add(box(0.04, 0.45, 11.6), M(0, -0.82, -6.2), cIronL, ID.PLAIN, { k: 0.9 });
        b.add(box(1, 0.14, 0.22), M(0, 3.25, 0.12), cBrass, ID.BRASS);
        b.add(box(1, 0.1, 0.14), M(0, 0.28, 0.12), cIronL, ID.PLAIN);
      }
      b.quad([-0.5, 0.03, -1.7], [0.5, 0.03, -1.7], [0.5, 0.03, -4.3], [-0.5, 0.03, -4.3], C('#1d4a45'), ID.CLOTH, 0.9);
      for (const x of [-0.47, 0.47]) {
        b.add(box(0.34, 12.4, 0.9), M(x, 6.2, -12.5), cStone, ID.STONE, { grad: [0, 12.4, 0.82, 1.0] });
        b.add(box(0.365, 0.9, 1.15), M(x, 0.45, -12.5), cStone, ID.STONE, { k: 0.85 });
        b.add(box(0.355, 0.4, 1.1), M(x, 7.4, -12.5), cStone, ID.STONE, { k: 1.08 });
      }
      {
        const sh = new THREE.Shape(); sh.moveTo(-0.3, 7.4);
        for (let i = 1; i <= 10; i++) { const a = Math.PI * (1 - i / 10); sh.lineTo(0.3 * Math.cos(a), 7.4 + 2.6 * Math.sin(a)); }
        sh.lineTo(0.3, 12.4); sh.lineTo(-0.3, 12.4); sh.closePath();
        b.add(new THREE.ShapeGeometry(sh), M(0, 0, -12.08), cStone, ID.STONE, { k: 0.97 });
        b.add(new THREE.TorusGeometry(1, 0.07, 3, 6, Math.PI), M(0, 7.4, -12.02, 0, 0.3, 2.6, 2.4), cStone, ID.PLAIN, { k: 1.1 });
        b.add(box(0.05, 0.9, 0.5), M(0, 10.25, -12.0), cStone, ID.STONE, { k: 1.12 });
      }
      b.quad([-0.7, 0, -16], [0.7, 0, -16], [0.7, 12.4, -16], [-0.7, 12.4, -16], cWoodD, ID.WOOD, 1.5);       // mahogany fittings behind the arch: a real dark for the goods to stand against
      b.add(box(0.6, 0.8, 0.07), M(0, 7.0, -11.98), cValance, ID.CLOTH, { grad: [6.6, 7.4, 0.8, 1.1] });      // (peacock, not red: the red is kept for our nose)
      b.add(box(0.61, 0.09, 0.12), M(0, 7.42, -11.96), cBrass, ID.BRASS);
      b.add(box(0.2, 0.42, 0.05), M(0, 7.0, -11.92), cBrass, ID.BRASS, { k: 1.1 });
      if (!upper) b.quad([-0.65, 0.02, -12], [0.65, 0.02, -12], [0.7, 0.02, -16], [-0.7, 0.02, -16], C('#3b2a22'), ID.WOOD);
      for (const y of [3.4, 7.4]) {
        b.add(box(0.92, 0.2, 0.9), M(0, y, -15.5), cWood, ID.WOOD);
        for (let i = 0; i < 5; i++) { const w = r.range(0.09, 0.15), h = r.range(1.2, 2.6); b.add(box(w, h, 0.7), M(-0.38 + 0.19 * i + r.range(-0.02, 0.02), y + 0.1 + h / 2, -15.45), r.pick(shelfC), ID.CLOTH, { k: r.range(0.75, 1.05) }); }
      }
      b.add(box(0.84, 2.5, 1.3), M(0, 1.45, -5.9), cWoodD, ID.WOOD, { grad: [0.2, 2.7, 0.75, 1.1] });
      b.add(box(0.88, 0.16, 1.6), M(0, 2.78, -5.9), cWood, ID.WOOD, { k: 1.35 });
      b.add(box(0.86, 0.2, 1.4), M(0, 0.1, -5.9), cWoodD, ID.WOOD, { k: 0.7 });
      for (let i = 0; i < 2; i++) b.add(box(0.36, 1.5, 0.06), M(-0.21 + 0.42 * i, 1.5, -5.23), cWood, ID.WOOD, { k: 1.15 });
      b.add(cyl(0.07, 0.07, 0.84, 5), M(0, 0.55, -5.05, 0, 1, 1, 1, 0, Math.PI / 2), cBrass, ID.BRASS);
      return b.build();
    };
    const colGeo = (() => {
      const b = makeB();
      const prof = [[0.5, 0], [0.5, 0.4], [0.3, 0.7], [0.27, 5.7], [0.37, 5.85], [0.25, 6.0], [0.24, 11.0], [0.6, 12.0]];
      for (const x of [-0.75, 0.75]) b.add(lathe(prof, 5), M(x, 0, -1.3), cIronL, ID.PLAIN, { grad: [0, 12, 0.8, 1.25] });
      b.add(box(2.5, 0.4, 0.95), M(0, 12.2, -1.3), cIronL, ID.PLAIN, { k: 1.1 });
      b.add(new THREE.TorusGeometry(1.5, 0.08, 3, 4, Math.PI / 2), M(2.25, 10.5, -1.3, 0, 1, 1, 1, 0, Math.PI / 2), cIronL, ID.PLAIN, { k: 1.2 });
      b.add(new THREE.TorusGeometry(1.5, 0.08, 3, 4, Math.PI / 2), M(-2.25, 10.5, -1.3), cIronL, ID.PLAIN, { k: 1.2 });
      b.add(box(0.34, 3.5, 0.34), M(0, 1.75, 0.12), cIronL, ID.PLAIN, { grad: [0, 3.5, 0.8, 1.2] });
      b.add(ball(0.27, 6, 4), M(0, 3.72, 0.12), cBrass, ID.BRASS);
      b.add(box(0.5, 0.95, 0.4), M(0, -1.58, 0.2), cStone, ID.STONE, { grad: [-2.05, -1.1, 0.8, 1.05] });
      return b.build();
    })();
    await ctx.yield();
    {
      const up = [], upC = [], gr = [], grC = [], cols = [], lace = [], cr = rng.fork('baytint'), tc = new THREE.Color();
      for (let t = 0; t <= 6; t++) {
        const sy = t === 6 ? 0.5 : 1;
        for (let i = 0; i < NBAY; i++) {
          const f = bayF[i], m = frameM({ x: f.x, z: f.z, tx: f.tx, tz: f.tz, nx: f.nx, nz: f.nz }, t * TIER, bayW[i], sy, 1);
          const k = cr.range(0.93, 1.05); tc.setRGB(k, k * cr.range(0.98, 1.02), k * cr.range(0.97, 1.03));
          if (t === 0) { gr.push(m); grC.push(tc.clone()); } else { up.push(m); upC.push(tc.clone()); lace.push(frameM({ x: f.x, z: f.z, tx: f.tx, tz: f.tz, nx: f.nx, nz: f.nz }, t * TIER, bayW[i], 1, 1)); }
          const e = ellF(i * 15 * DEG);
          cols.push(frameM(e, t * TIER, 1, sy, 1));
        }
      }
      instanced(atrium, bayGeo(true), mShop, up, 'bays', upC);
      await ctx.yield();
      instanced(atrium, bayGeo(false), mShop, gr, 'groundBays', grC);
      await ctx.yield();
      instanced(atrium, colGeo, mShop, cols, 'columns');
      await ctx.yield();
      const lg = new THREE.PlaneGeometry(1, 2.85, 1, 4); lg.translate(0, 0.33 + 1.425, 0.12);
      { const p = lg.attributes.position, uv = lg.attributes.uv, md = new Float32Array(p.count);
        for (let i = 0; i < p.count; i++) { const v = (p.getY(i) - 0.33) / 2.85; p.setZ(i, 0.12 + 0.32 * Math.sin(Math.PI * v) * (1 - v * 0.5)); uv.setXY(i, p.getX(i), p.getY(i) - 0.33); }
        lg.setAttribute('aMode', new THREE.BufferAttribute(md, 1)); lg.computeVertexNormals(); }
      const lm = instanced(atrium, lg, mLace, lace, 'balustrades'); lm.renderOrder = 0.5;
    }
    await ctx.yield();

    // ---------------------------------------------------------------- shop floor, islands, cornice, roof ring, dome
    const islands = [];
    {
      const b = makeB();
      { const g = new THREE.CircleGeometry(1, 72); g.rotateX(-Math.PI / 2); b.add(g, M(0, 0, 0, 0, 72, 1, 52), cStone, ID.TILE); }
      { const g = new THREE.CircleGeometry(1, 40); g.rotateX(-Math.PI / 2); b.add(g, M(0, 0.03, 0, 0, 15, 1, 15), C('#1d4a45'), ID.CLOTH, { k: 0.85 }); }
      b.add(lathe([[13.2, 0.03], [13.2, 0.07], [12.6, 0.07], [12.6, 0.03]], 40), null, cBrass, ID.BRASS);
      b.add(lathe([[10.6, 0], [10.6, 0.9], [10.2, 1.1], [9.2, 1.1], [9.0, 0.9], [9.0, 0]], 24), null, cStone, ID.STONE);
      await ctx.yield();
      const sm = new THREE.Vector2((slot.x + slot.z) / 2, (slot.y + slot.w) / 2), ir = rng.fork('islands');
      for (let i = 0; i < 14; i++) {
        const a = (i + 0.5) / 14 * TAU, x = Math.cos(a) * 33, z = Math.sin(a) * 20;
        if (Math.hypot(x - sm.x, z - sm.y) < 13 || Math.abs(x) > 30 && Math.abs(z) < 7) continue;
        const ry = ir.range(0, TAU);
        b.add(lathe([[2.7, 0], [2.7, 0.28], [2.5, 0.34], [2.5, 2.45], [2.8, 2.58], [2.8, 2.78], [0.02, 2.78]], 8), M(x, 0, z, ry), cWoodD, ID.WOOD, { grad: [0, 2.8, 0.8, 1.4] });
        b.add(lathe([[2.56, 0.5], [2.56, 0.62], [2.5, 0.62]], 8), M(x, 0, z, ry), cBrass, ID.BRASS);
        { const g = new THREE.CircleGeometry(4.8, 20); g.rotateX(-Math.PI / 2); b.add(g, M(x, 0.03, z), i % 2 ? C('#5c1c22') : C('#1d4a45'), ID.CLOTH, { k: 0.9 }); }
        { const g = new THREE.RingGeometry(4.2, 4.45, 20); g.rotateX(-Math.PI / 2); b.add(g, M(x, 0.045, z), cCream, ID.CLOTH, { k: 0.8 }); }
        islands.push({ x, z, ry });
        if ((i & 3) === 3) await ctx.yield();
      }
      await ctx.yield();
      // entablature under the dome and the flat roof over the top gallery (seen from inside: double sided)
      for (const [o0, o1, y0, y1, k] of [[0.5, -0.4, 84.2, 84.25, 0.8], [-0.4, -0.4, 84.25, 85.2, 1.0], [-0.4, 0.3, 85.2, 85.35, 0.8], [0.3, 0.3, 85.35, 86.3, 0.92], [0.3, -1.0, 86.3, 86.7, 0.85], [-1.0, -1.0, 86.7, 87.1, 1.05], [-1.0, 1.4, 87.1, 87.3, 0.8]]) {
        const g = new THREE.CylinderGeometry(1 + o1 / 45, 1 + o0 / 45, y1 - y0, 72, 1, true);
        b.add(g, M(0, (y0 + y1) / 2, 0, 0, WA, 1, WB), cStone, ID.STONE, { k });
      }
      await ctx.yield();
      for (let i = 0; i < 48; i++) {
        const a0 = ellF(i / 48 * TAU, -0.3), a1 = ellF((i + 1) / 48 * TAU, -0.3), b0 = ellF(i / 48 * TAU, 16.2), b1 = ellF((i + 1) / 48 * TAU, 16.2);
        b.quad([a0.x, 84.2, a0.z], [a1.x, 84.2, a1.z], [b1.x, 84.2, b1.z], [b0.x, 84.2, b0.z], cStoneD, ID.PLAIN, 0.8);
      }
      addMesh(atrium, b.build(), mShop2, 'shopFloor');
      await ctx.yield();
      const dg = new THREE.SphereGeometry(1, 48, 12, 0, TAU, 0, Math.PI / 2); dg.scale(58.5, 28, 38.5); dg.translate(0, 84, 0);
      const dm = new THREE.ShaderMaterial({ uniforms: { ...U, uPane: { value: cPane.clone().lerp(cDay, 0.12) }, uZen: { value: C(LK.zen) }, uHor: { value: C(LK.hor) }, uIron: { value: cIron.clone() }, uMilk: { value: LK.milk }, uGold: { value: C('#f2b53c').multiplyScalar(1.25) } },
        vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide });
      addMesh(atrium, dg, dm, 'dome');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- bunting (and the white sale's paper streamers)
    {
      const pos = [], nor = [], col = [], cl = [], idx = [], bc = LK.bunt.map(C), cord = C('#9a7a34');
      const vtx = (p, n, c, w, ph, drop = 0) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], 0, n[1]); col.push(c.r, c.g, c.b, ID.CLOTH); cl.push(w, ph, drop); return pos.length / 3 - 1; };
      for (let t = 1; t <= 5; t++) for (let i = 0; i < NBAY; i++) {
        if (i === 0) await ctx.yield();                             // once a tier
        const f = bayF[i], w = bayW[i], n = [-f.nx, -f.nz], NP = Math.max(4, Math.round(w / 1.9)), y0 = t * TIER - 1.25;
        const at = (q, dy) => { const lx = (q - 0.5) * w; return [f.x + f.tx * lx - f.nx * 0.62, y0 - 1.0 * Math.sin(Math.PI * q) + dy, f.z + f.tz * lx - f.nz * 0.62]; };
        for (let k = 0; k < NP; k++) {
          const q0 = k / NP, q1 = (k + 1) / NP, ph = i * 1.7 + k * 0.9 + t, c = bc[(k + i) % 2];
          const a = vtx(at(q0, 0), n, c, 0, ph), b2 = vtx(at(q1, 0), n, c, 0, ph), d = vtx(at((q0 + q1) / 2, -2.0), n, c, 0.34, ph, 2.0);
          idx.push(a, b2, d);
          const c0 = vtx(at(q0, 0.05), n, cord, 0, ph), c1 = vtx(at(q1, 0.05), n, cord, 0, ph), c2 = vtx(at(q1, -0.05), n, cord, 0, ph), c3 = vtx(at(q0, -0.05), n, cord, 0, ph);
          idx.push(c0, c1, c2, c0, c2, c3);
        }
      }
      await ctx.yield();
      if (lookI === 2) {
        const white = C('#f6f8f7'), pale = C('#d4e6f3');
        for (let i = 0; i < NBAY; i++) for (const dth of [3.5, 11.5]) {
          // the white sale: long paper streamers from the top tier to the first, clear of the bridges
          const e = ellF((i * 15 + dth) * DEG, -0.62), n = [-e.nx, -e.nz], c = dth < 5 ? white : pale, NS = 26; let prev = null;
          if (A.bridges.some((br) => Math.hypot(br.from.x - e.x, br.from.z - e.z) < br.width / 2 + 2)) continue;
          for (let k = 0; k <= NS; k++) {
            const q = k / NS, y = lerp(83.6, 14.5 + 2.5 * (i % 2), q), sw = 0.4 * Math.sin(Math.PI * q) * (0.6 + 0.4 * Math.sin(q * 19)), ph = i * 2.3 + dth + q * 9;
            const a = vtx([e.x - e.tx * 0.25, y, e.z - e.tz * 0.25], n, c, sw, ph), b2 = vtx([e.x + e.tx * 0.25, y, e.z + e.tz * 0.25], n, c, sw, ph + 0.4);
            if (prev) idx.push(prev[0], prev[1], b2, prev[0], b2, a);
            prev = [a, b2];
          }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('aCl', new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 45, 0), 90);
      await ctx.yield();
      addMesh(atrium, g, mCloth, 'bunting');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- goods: four instanced kinds, tills, chairs, hats
    const propsB = makeB();                                        // static odds and ends of the atrium, one mesh
    const white = C('#ffffff');
    const hatboxGeo = (() => {
      const b = makeB(); let y = 0;
      for (const [r, h, c, k] of [[0.78, 0.72, white, 0.92], [0.62, 0.56, white, 0.78], [0.46, 0.46, white, 1.0]]) {
        b.add(lathe([[r, 0], [r, h - 0.15], [r + 0.05, h - 0.15], [r + 0.05, h], [0.02, h]], 6), M(0, y, 0, y * 2.1), c, ID.PLAIN, { k, grad: [y, y + h, 0.8, 1.05] });
        if (y < 0.1) b.add(lathe([[r + 0.012, h * 0.3], [r + 0.012, h * 0.3 + 0.1]], 6), M(0, y, 0, y * 2.1), cRed.clone().lerp(white, lookI === 2 ? 0.75 : 0), ID.CLOTH);
        y += h;
      }
      return b.build();
    })();
    const boltGeo = (() => {
      const b = makeB();
      for (const [x, y, z, k] of [[0, 0.3, -0.31, 0.95], [0, 0.3, 0.31, 0.8], [0, 0.82, 0, 1.05]]) {
        b.add(cyl(0.3, 0.3, 2.3, 6), M(x, y, z, 0, 1, 1, 1, 0, Math.PI / 2), white, ID.CLOTH, { k, jit: 0.12 });
      }
      return b.build();
    })();
    await ctx.yield();
    const gloveGeo = (() => {
      const b = makeB(), kid = C('#e9dcc4');
      b.add(lathe([[0.32, 0], [0.32, 0.06], [0.08, 0.12], [0.05, 0.7], [0.1, 0.78], [0.02, 0.82]], 6), null, cBrass, ID.BRASS);
      b.add(box(0.5, 0.14, 0.62), M(0, 0.9, 0, 0, 1, 1, 1, 0.25), kid, ID.CLOTH);
      for (let i = 0; i < 4; i++) b.add(box(0.1, 0.11, 0.5), M(-0.19 + 0.127 * i, 1.04, 0.5, (i - 1.5) * -0.06, 1, 1, 1, 0.42), kid, ID.CLOTH, { k: 0.94 + 0.04 * i });
      b.add(box(0.11, 0.11, 0.36), M(-0.34, 0.88, 0.12, 0.7, 1, 1, 1, 0.2), kid, ID.CLOTH, { k: 0.9 });
      b.add(box(0.54, 0.1, 0.2), M(0, 0.8, -0.34, 0, 1, 1, 1, 0.25), cRed, ID.CLOTH, { k: 0.8 });
      return b.build();
    })();
    const parasolGeo = (() => {
      const b = makeB();
      b.add(new THREE.TorusGeometry(0.75, 0.05, 4, 10), M(0, 1.5, 0, 0, 1, 1, 1, Math.PI / 2), cBrass, ID.BRASS);
      b.add(new THREE.TorusGeometry(0.8, 0.06, 4, 10), M(0, 0.12, 0, 0, 1, 1, 1, Math.PI / 2), cBrass, ID.BRASS);
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.add(box(0.07, 1.5, 0.07), M(Math.cos(a) * 0.77, 0.78, Math.sin(a) * 0.77), cBrass, ID.BRASS, { k: 0.85 }); }
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU + 0.5, c = clothC[(i * 2 + 1) % clothC.length];
        b.add(lathe([[0.03, 0], [0.2, 0.25], [0.24, 0.9], [0.13, 2.0], [0.04, 2.3], [0.03, 2.75], [0.09, 2.85], [0.02, 2.95]], 6), M(Math.cos(a) * 0.36, 0.15, Math.sin(a) * 0.36, a, 1, 1, 1, 0.14), c, ID.CLOTH, { grad: [0.2, 2.4, 0.75, 1.05] });
      }
      return b.build();
    })();
    await ctx.yield();
    const tillGeo = (() => {
      const b = makeB();
      b.add(box(1.0, 0.5, 0.9), M(0, 0.45, 0), cBrass, ID.BRASS, { k: 0.8 });
      b.add(box(0.94, 0.5, 0.6), M(0, 0.86, -0.12, 0, 1, 1, 1, -0.45), cBrass, ID.BRASS);
      b.add(box(1.04, 0.1, 0.94), M(0, 0.17, 0), cBrass, ID.BRASS, { k: 1.15 });
      b.add(box(0.8, 0.42, 0.08), M(0, 1.42, -0.36), cCream, ID.PLAIN);
      b.add(box(0.9, 0.08, 0.14), M(0, 1.18, -0.36), cBrass, ID.BRASS);
      for (let i = 0; i < 4; i++) b.add(box(0.13, 0.07, 0.4), M(-0.3 + 0.2 * i, 0.98, 0.1, 0, 1, 1, 1, -0.45), i % 2 ? cCream : cIron, ID.PLAIN);
      b.add(lathe([[0.03, 0], [0.14, 0.02], [0.14, 0.08], [0.03, 0.1]], 6), M(0.56, 0.6, 0.1, 0, 1, 1, 1, 0, -Math.PI / 2), cBrass, ID.BRASS);
      return b.build();
    })();
    const drawerGeo = (() => { const b = makeB(); b.add(box(0.86, 0.2, 0.8), M(0, 0.33, 0), cBrass, ID.BRASS, { k: 0.9 }); b.add(box(0.78, 0.06, 0.7), M(0, 0.42, 0), cIron, ID.PLAIN); b.add(ball(0.07, 5, 4), M(0, 0.33, 0.43), cCream, ID.PLAIN); return b.build(); })();
    await ctx.yield();
    const chairGeo = (() => {
      const b = makeB(), w = C('#3a2218');
      b.add(cyl(0.62, 0.66, 0.1, 9), M(0, 1.38, 0), w, ID.WOOD, { k: 1.2 });
      b.add(new THREE.TorusGeometry(0.6, 0.045, 3, 9), M(0, 0.7, 0, 0, 1, 1, 1, Math.PI / 2), w, ID.WOOD);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.785; b.add(cyl(0.06, 0.05, 1.36, 4, true), M(Math.cos(a) * 0.62, 0.68, Math.sin(a) * 0.62, 0, 1, 1, 1, Math.sin(a) * 0.09, -Math.cos(a) * 0.09), w, ID.WOOD); }
      b.add(new THREE.TorusGeometry(0.6, 0.05, 3, 10, Math.PI), M(0, 1.4, -0.5, 0, 1, 2.3, 1, -0.12), w, ID.WOOD, { k: 1.15 });
      b.add(new THREE.TorusGeometry(0.36, 0.04, 3, 8, Math.PI), M(0, 1.4, -0.5, 0, 1, 2.6, 1, -0.12), w, ID.WOOD);
      return b.build();
    })();
    const hatGeo = (() => {
      const b = makeB(), straw = C('#d8c79a');
      b.add(lathe([[0.3, 0], [0.3, 0.05], [0.06, 0.12], [0.045, 1.3], [0.16, 1.4], [0.02, 1.46]], 6), null, cBrass, ID.BRASS);
      b.add(lathe([[0.95, 1.5], [0.9, 1.46], [0.42, 1.5], [0.4, 1.92], [0.34, 2.0], [0.02, 2.02]], 12), null, straw, ID.CLOTH, { jit: 0.08 });
      b.add(lathe([[0.425, 1.52], [0.42, 1.7]], 12), null, cRed.clone().lerp(white, lookI === 2 ? 0.8 : 0), ID.CLOTH);
      b.add(box(0.5, 0.2, 0.05), M(0.43, 1.66, 0, 0, 1, 1, 1, 0, 0.3), C(LK.bunt[0]), ID.CLOTH);
      return b.build();
    })();
    await ctx.yield();
    const tills = [], hats = [], pyr = { x: 0, z: 0, lids: [] };
    const stands = [];                                            // where the parasol stands are put: a palm that is moved keeps its tub clear of them
    {
      const g = rng.fork('goods'), L = { hatbox: [], hatboxC: [], bolt: [], boltC: [], glove: [], parasol: [], till: [], chair: [], hat: [] };
      const boxCols = [C('#f1ead8'), C('#dbe9f1'), C('#cfe3dc'), C('#f6f1ea'), cPane.clone().lerp(white, 0.55)];
      const put = (kind, x, y, z, ry, s = 1) => {
        const m = M(x, y, z, ry, s, s, s);
        if (kind === 'hatbox') { L.hatbox.push(m); L.hatboxC.push(g.pick(boxCols)); }
        else if (kind === 'bolt') { L.bolt.push(m); L.boltC.push(g.pick(clothC).clone().multiplyScalar(g.range(0.8, 1))); }
        else if (kind === 'till') { L.till.push(m); tills.push({ x, y, z, ry, ph: tills.length }); }
        else if (kind === 'hat') { L.hat.push(m); hats.push({ x, y, z, ry, w: g.range(0.5, 0.9) * (g.chance(0.5) ? 1 : -1) }); }
        else L[kind].push(m);
      };
      for (let t = 0; t <= 5; t++) for (let i = 0; i < NBAY; i++) {
        if (i === 0) await ctx.yield();                             // once a tier
        const w = bayW[i], ry = bayRot(i), flower = t === 2 && (i === 21 || (lookI === 1 && i === 20));
        for (let s = -1; s <= 1; s++) {
          const [x, y, z] = bayPt(i, s * 0.29 * w, t * TIER + 2.86, -5.9), q = g();
          if (flower) continue;
          if (t === 1 && s === 0) { put('till', x, y, z, ry); continue; }
          if (q > 0.9 * Math.min(1, density)) continue;
          const kind = q < 0.24 ? 'hatbox' : q < 0.56 ? 'bolt' : q < 0.72 ? 'glove' : q < 0.8 ? 'till' : q < 0.84 ? 'hat' : 'bolt';
          put(kind, x, y, z, kind === 'till' ? ry : ry + (kind === 'bolt' ? g.range(-0.2, 0.2) : g.range(0, TAU)), kind === 'glove' ? 1.5 : g.range(0.9, 1.15));
        }
        if (g.chance(0.2)) { const [x, y, z] = bayPt(i, g.pick([-0.34, 0.34]) * w, t * TIER + 0.03, -3.4); put('parasol', x, y, z, g.range(0, TAU), 1.15); stands.push({ x, y, z, r: 0.86 * 1.15 }); }
        if (g.chance(0.2)) for (const sx of [-0.12, 0.1]) { const [x, y, z] = bayPt(i, sx * w, t * TIER + 0.03, -3.7 + sx * 3); put('chair', x, y, z, ry + Math.PI + g.range(-0.5, 0.5), 1.25); }
        if (t === 1 && (i === 10 || i === 11)) {                    // the wall of hatboxes
          for (let k = 0; k < 7; k++) { const [x, y, z] = bayPt(i, (k / 6 - 0.5) * 0.8 * w, t * TIER + 0.03, -3.9 - (k % 2) * 0.5), a = g.range(0, TAU), sc = g.range(1.5, 1.9); put('hatbox', x, y, z, a, sc); }
        }
      }
      await ctx.yield();
      for (const isl of islands) for (let k = 0; k < 3; k++) {
        const a = isl.ry + k / 3 * TAU, kind = g.pick(['hatbox', 'bolt', 'glove', 'hat', 'hatbox']);
        put(kind, isl.x + Math.cos(a) * 1.35, 2.8, isl.z + Math.sin(a) * 1.35, g.range(0, TAU), kind === 'glove' ? 1.5 : 1.1);
      }
      await ctx.yield();
      {
        // the milliner's pyramid at the first end of tier one (seen across the corner of the well, then passed close): three stepped rows of hatboxes on mahogany boards, some lids
        // lifting by themselves, a great straw hat turning on its stand at the top, a pair of glove stands beside it
        const bi = 13, ryB = bayRot(bi), cx = 0, S = 1.35, H = 1.74 * S, pitch = 2.3, lz = -4.1, pg = rng.fork('pyramid');
        for (let r = 0; r < 3; r++) {
          const n = 4 - r, y0 = TIER + 0.03 + r * (H + 0.16);
          for (let j = 0; j < n; j++) {
            const [x, y, z] = bayPt(bi, cx + (j - (n - 1) / 2) * pitch, y0, lz);
            L.hatbox.push(M(x, y, z, pg.range(0, TAU), S, S, S)); L.hatboxC.push(boxCols[(j * 2 + r * 3) % boxCols.length]);
          }
          { const [x, y, z] = bayPt(bi, cx, y0 + H + 0.08, lz); propsB.add(box((n - 1) * pitch + 0.9, 0.14, 2.7), M(x, y, z, ryB), cWood, ID.WOOD, { k: 1.3 }); }
        }
        const [hx, hy, hz] = bayPt(bi, cx, TIER + 0.03 + 3 * (H + 0.16), lz);
        hats.push({ x: hx, y: hy, z: hz, ry: 0, w: 0.55, s: 2.0 });
        for (const sx of [-1, 1]) { const [x, y, z] = bayPt(bi, cx + sx * (1.5 * pitch + 2.0), TIER + 0.03, lz + 0.4); L.glove.push(M(x, y, z, ryB + Math.PI + sx * 0.5, 2.7, 2.7, 2.7)); }
      }
      await ctx.yield();
      {
        // the milliner's tree: a centenary display standing in the well at the first end, a brass mast with four round mahogany
        // shelves of hatboxes (lids lifting by themselves), glove stands on the rims and a great straw hat turning at the top.
        // We come round the end with it close on our right, at the height of its upper shelves.
        const tx = -40.5, tz = 5.5, tg = rng.fork('tree'), S = 1.2, H = 1.74 * S;
        pyr.x = tx; pyr.z = tz;
        propsB.add(lathe([[3.4, 0], [3.4, 0.5], [3.1, 0.7], [2.9, 2.2], [3.2, 2.45], [3.2, 2.8], [0.5, 3.0], [0.02, 3.0]], 20), M(tx, 0, tz), cWoodD, ID.WOOD, { grad: [0, 3, 0.9, 1.5] });
        propsB.add(lathe([[2.96, 1.1], [3.02, 1.16], [2.96, 1.22]], 20), M(tx, 0, tz), cBrass, ID.BRASS);
        propsB.add(lathe([[0.5, 3.0], [0.34, 3.5], [0.26, 4.2], [0.26, 8.6], [0.4, 8.9], [0.26, 9.2], [0.24, 12.4], [0.38, 12.7], [0.24, 13.0], [0.22, 16.0], [0.34, 16.3], [0.2, 16.6], [0.18, 19.3]], 10), M(tx, 0, tz), cBrass, ID.BRASS);
        const shelves = [[9.2, 4.1, 8], [13.0, 3.3, 6], [16.6, 2.5, 4], [19.5, 1.5, 0]];
        for (const [sy, R, n] of shelves) {
          propsB.add(lathe([[0.2, sy - 0.02], [R * 0.5, sy - 0.2], [R, sy], [R + 0.07, sy + 0.05], [R + 0.07, sy + 0.2], [R, sy + 0.26], [0.2, sy + 0.26]], 24), M(tx, 0, tz), cWood, ID.WOOD, { k: 1.25, jit: 0.05 });
          propsB.add(lathe([[R + 0.08, sy + 0.03], [R + 0.14, sy + 0.12], [R + 0.08, sy + 0.22]], 24), M(tx, 0, tz), cBrass, ID.BRASS);
          for (let j = 0; j < n; j++) {
            const a = (j + 0.5 * (n % 3)) / n * TAU + sy, r = R - 1.15, x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r;
            if (j % 4 === 3) { L.glove.push(M(x, sy + 0.26, z, -a + Math.PI / 2, 2.0, 2.0, 2.0)); continue; }
            L.hatbox.push(M(x, sy + 0.26, z, tg.range(0, TAU), S, S, S)); L.hatboxC.push(boxCols[(j + Math.round(sy)) % boxCols.length]);
            if (j % 2 === 0 || n < 6) pyr.lids.push({ x, y: sy + 0.26 + H + 0.015, z, ph: tg.range(0, 7), ry: tg.range(0, TAU) });
          }
          await ctx.yield();
        }
        hats.push({ x: tx, y: 19.76, z: tz, ry: 0, w: -0.5, s: 2.3 });
      }
      await ctx.yield();
      instanced(atrium, hatboxGeo, mShop, L.hatbox, 'hatboxes', L.hatboxC);
      instanced(atrium, boltGeo, mShop, L.bolt, 'bolts', L.boltC);
      await ctx.yield();
      instanced(atrium, gloveGeo, mShop, L.glove, 'gloves');
      instanced(atrium, parasolGeo, mShop, L.parasol, 'parasols');
      await ctx.yield();
      instanced(atrium, tillGeo, mShop, L.till, 'tills');
      instanced(atrium, chairGeo, mShop, L.chair, 'chairs');
    }
    const drawerIM = instanced(atrium, drawerGeo, mShop, tills.map((t) => M(t.x, t.y, t.z, t.ry)), 'drawers');
    const hatIM = instanced(atrium, hatGeo, mShop, hats.map((h) => M(h.x, h.y, h.z, h.ry, h.s || 1.3, h.s || 1.3, h.s || 1.3)), 'hats');
    const lidIM = (() => {
      const b = makeB(); b.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.03], [0.56, 0.17], [0.5, 0.2], [0.02, 0.2]], 10), null, white, ID.PLAIN, { grad: [0, 0.2, 0.85, 1.05] });
      b.add(lathe([[0.565, 0.05], [0.565, 0.13]], 10), null, C(LK.bunt[0]), ID.CLOTH);
      return instanced(atrium, b.build(), mShop, pyr.lids.map((l) => M(l.x, l.y, l.z, l.ry, 1.2, 1.2, 1.2)), 'lids', pyr.lids.map((l, i) => C(i % 2 ? '#f1ead8' : '#dbe9f1')));
    })();
    await ctx.yield();

    // ---------------------------------------------------------------- palms, ferns and the flower counter
    const FT = { x: 41.5, z: -8, top: 27.2 };                      // the flower tree (below)
    const plantGeo = (kind, scale, o = {}) => {
      const src = plantGeometry({ rng: rng.fork('plant-' + kind), kind, scale, potColor: PAL[1], ...o });
      const n = src.attributes.position.count, sc = src.attributes.color, sf = src.attributes.surf, col = new Float32Array(n * 4), sw = new Float32Array(n);
      for (let i = 0; i < n; i++) { col[i * 4] = sc.getX(i); col[i * 4 + 1] = sc.getY(i); col[i * 4 + 2] = sc.getZ(i); col[i * 4 + 3] = ID.PLAIN; sw[i] = sf ? clamp(1 - sf.getW(i), 0, 1) : 0; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', src.attributes.position); g.setAttribute('normal', src.attributes.normal);
      g.setAttribute('aCol', new THREE.BufferAttribute(col, 4)); g.setAttribute('aSw', new THREE.BufferAttribute(sw, 1));
      if (src.index) g.setIndex(src.index);
      return g;
    };
    {
      const pg = plantGeo('palm', 3.3, { height: 2.0 }), ptris = (pg.index ? pg.index.count : pg.attributes.position.count) / 3;
      await ctx.yield();
      const maxP = Math.max(8, Math.floor(12000 / Math.max(300, ptris))), list = [], pr = rng.fork('palms');
      // A gallery palm that stands ACROSS the line our tube flies stands back from it, by PLACE. Its shape is taken free of
      // its dealt turn (swept round its own axis, the largest reach in each 0.1 m of height) and widened by the bound of
      // its sway. A palm whose shape comes within PALM_ACROSS of the line is across it at some turn of its fronds: it
      // stands back from the well until PALM_CLEAR of clear air lies between, and where its tub would then stand in the
      // counter's front or in a parasol stand it takes its bay's joint line, where the counters leave a gap (a guard
      // steps it a quarter metre further back at a time while a stand is in its way there; on some four thousand seeds counted
      // the joint line stood clear at once and the guard never ran). A palm that only comes near the line keeps its place to the
      // byte. Nothing reads the lens and no draw is added, removed or reordered.
      const PALM_CLEAR = 2.0, PALM_ACROSS = 1.0, palmClear = (() => {
        const P = pg.attributes.position, W = pg.attributes.aSw, ix = pg.index ? pg.index.array : null, env = new Float32Array(48);
        for (let k = 0; k < ptris * 3; k++) {
          const a = ix ? ix[k] : k, b = ix ? ix[k - k % 3 + (k % 3 + 1) % 3] : k - k % 3 + (k % 3 + 1) % 3;
          const r = Math.max(Math.hypot(P.getX(a), P.getZ(a)) + 0.35 * W.getX(a), Math.hypot(P.getX(b), P.getZ(b)) + 0.35 * W.getX(b));
          const b0 = Math.max(0, Math.floor(Math.min(P.getY(a), P.getY(b)) * 10)), b1 = Math.min(47, Math.floor(Math.max(P.getY(a), P.getY(b)) * 10));
          for (let j = b0; j <= b1; j++) if (r > env[j]) env[j] = r;
        }
        const nR = Math.floor(path.length / 0.25) + 1, R = new Float32Array(nR * 3), q = new THREE.Vector3();
        for (let j = 0; j < nR; j++) { path.pointAt(j * 0.25 / path.length, q); R[j * 3] = q.x; R[j * 3 + 1] = q.y; R[j * 3 + 2] = q.z; }
        let envMax = 0; for (let b = 0; b < 48; b++) if (env[b] > envMax) envMax = env[b];
        return (x, y, z, s) => {
          let best = 1e9;
          for (let j = 0; j < nR; j++) {
            const h = R[j * 3 + 1] - y; if (h < -6 || h > 11) continue;
            const rho = Math.hypot(R[j * 3] - x, R[j * 3 + 2] - z); if (rho > 16 || rho - envMax * s >= best) continue;   // (too far to come nearer than the nearest so far)
            for (let b = 0; b < 48; b++) {
              if (!env[b]) continue;
              const dr = Math.max(0, rho - env[b] * s); if (dr >= best) continue;
              const dy = Math.max(0, b * 0.1 * s - h, h - (b + 1) * 0.1 * s); if (dy >= best) continue;
              const d = Math.hypot(dr, dy); if (d < best) best = d;
            }
          }
          return best;
        };
      })();
      const stepBack = (th, y, s) => {                             // the least step back from the well that gives the clear air
        let e = ellF(th, 2.4); if (palmClear(e.x, y, e.z, s) >= PALM_CLEAR) return 0;
        let lo = 0, hi = 9;
        for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; e = ellF(th, 2.4 + mid); if (palmClear(e.x, y, e.z, s) >= PALM_CLEAR) hi = mid; else lo = mid; }
        return hi;
      };
      const tubFree = (e, y, s) => stands.every((q) => Math.abs(q.y - y) > 1 || Math.hypot(q.x - e.x, q.z - e.z) > q.r + 0.7 * s + 0.1);   // (a tub's rim stands 0.7 m from its axis at scale 1; a stand's ring 0.86 m at its own)
      await ctx.yield();
      for (let t = 1; t <= 3; t++) for (let i = t % 2; i < NBAY; i += 4) {
        const s = pr.range(0.85, 1.15), y = t * TIER + 0.03; let e = ellF((i * 15 + 3.2) * DEG, 2.4);
        const across = list.length < maxP - 1 && palmClear(e.x, y, e.z, s) < PALM_ACROSS;                 // (only the palms that are drawn are asked)
        if (across) {
          const f = bayF[i]; e = ellF((i * 15 + 3.2) * DEG, 2.4 + stepBack((i * 15 + 3.2) * DEG, y, s));
          if ((e.x - f.x) * f.nx + (e.z - f.z) * f.nz + 0.49 * s > 4.9 || !tubFree(e, y, s)) {              // (its tub would stand in the counter's rail or in a parasol stand)
            let b = stepBack(i * 15 * DEG, y, s); e = ellF(i * 15 * DEG, 2.4 + b);
            for (let k = 0; k < 12 && !tubFree(e, y, s); k++) e = ellF(i * 15 * DEG, 2.4 + (b += 0.25));
          }
        }
        list.push(M(e.x, y, e.z, pr.range(0, TAU), s, s, s));
        if (across) await ctx.yield();                               // a moved palm at a time: the search for its place is the long step here
      }
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.785; list.push(M(Math.cos(a) * 12.2, 0.03, Math.sin(a) * 12.2, pr.range(0, TAU), 1.25, 1.25, 1.25)); }
      list.unshift(M(FT.x, FT.top + 0.5, FT.z, 0.6, 1.45, 1.45, 1.45));      // the kentia that crowns the flower tree
      instanced(atrium, pg, mSway, list.slice(0, maxP), 'palms');
      await ctx.yield();
      const fg = plantGeo('fern', 4.2), fl = [];
      await ctx.yield();
      for (let i = 0; i < NBAY; i += 3) {
        const e = ellF((i * 15 + 7.5) * DEG, -1.0), y = 6 * TIER - 5.6;
        fl.push(M(e.x, y, e.z, pr.range(0, TAU)));
        propsB.add(box(0.07, 4.4, 0.07), M(e.x, y + 2.3, e.z), cBrass, ID.BRASS);
      }
      instanced(atrium, fg, mSway, fl, 'ferns');
      await ctx.yield();
      const fr = rng.fork('flowers'), lily = C('#f7f8f2'), hyd = C('#6c9be6'), leaf = C('#2f6a3a');
      for (const bi of lookI === 1 ? [21, 20] : [21]) for (let k = 0; k < 9; k++) {
        await ctx.yield();                                          // a vase at a time
        const onTop = k < 5, [x, y, z] = bayPt(bi, (onTop ? (k / 4 - 0.5) * 0.8 : ((k - 5) / 3 - 0.5) * 0.7) * bayW[bi], 2 * TIER + (onTop ? 2.86 : 0.03), onTop ? -5.9 : -3.6), s = onTop ? 1.5 : 2.3;
        propsB.add(lathe([[0.3 * s, 0], [0.42 * s, 0.75 * s], [0.46 * s, 0.78 * s], [0.4 * s, 0.8 * s]], 7), M(x, y, z), k % 2 ? cBrass : C('#dfe6e2'), k % 2 ? ID.BRASS : ID.PLAIN);
        const blue = (k + bi) % 2 === 0;
        for (let j = 0; j < (blue ? 4 : 6); j++) {
          const a = fr.range(0, TAU), r = fr.range(0.05, 0.42) * s, h = (blue ? fr.range(0.9, 1.4) : fr.range(1.2, 2.0)) * s, px = x + Math.cos(a) * r * 1.6, pz = z + Math.sin(a) * r * 1.6;
          propsB.add(cyl(0.035, 0.03, h, 3), M(lerp(x, px, 0.5), y + 0.3 * s + h / 2, lerp(z, pz, 0.5), 0, 1, 1, 1, Math.sin(a) * r * 0.5, -Math.cos(a) * r * 0.5), leaf, ID.PLAIN);
          if (blue) propsB.add(new THREE.IcosahedronGeometry(0.5 * s, 1), M(px, y + 0.4 * s + h, pz, a), lookI === 1 && j % 2 ? C('#a487e0') : hyd, ID.CLOTH, { jit: 0.3 });
          else propsB.add(new THREE.ConeGeometry(0.42 * s, 0.6 * s, 6, 1, true), M(px, y + 0.3 * s + h, pz, a, 1, 1, 1, Math.PI + fr.range(-0.5, 0.5), fr.range(-0.5, 0.5)), lily, ID.CLOTH, { grad: [y + h, y + h + 0.8 * s, 0.8, 1.05] });
        }
      }
    }
    {
      // the flower tree: the florist's centenary piece, standing in the well at the far end from the milliner's tree. A brass
      // mast on a mahogany drum carries four peacock-glazed basins heaped with white lilies and blue hydrangea, fern fronds
      // trailing over their rims, and a kentia in a brass urn at the top. We round the end with it close on our right.
      const tg = rng.fork('flowertree'), glaze = C('#1E8C7A'), lily = C('#f7f8f2'), hyd = lookI === 1 ? C('#9a7fe0') : C('#5f93e6'), hyd2 = C('#8FC1E3'), leaf = C('#2f7a44'), leafD = C('#1f5a34');
      const x0 = FT.x, z0 = FT.z;
      propsB.add(lathe([[3.3, 0], [3.3, 0.5], [3.0, 0.7], [2.8, 2.3], [3.1, 2.55], [3.1, 2.9], [0.5, 3.1], [0.02, 3.1]], 20), M(x0, 0, z0), cWoodD, ID.WOOD, { grad: [0, 3, 0.9, 1.5] });
      propsB.add(lathe([[2.86, 1.2], [2.93, 1.27], [2.86, 1.34]], 20), M(x0, 0, z0), cBrass, ID.BRASS);
      propsB.add(lathe([[0.5, 3.1], [0.36, 3.6], [0.28, 4.4], [0.28, 7.0], [0.44, 7.3], [0.27, 7.6], [0.26, 13.0], [0.42, 13.3], [0.25, 13.6], [0.24, 19.0], [0.4, 19.3], [0.23, 19.6], [0.22, 24.2], [0.36, 24.5], [0.6, FT.top], [0.9, FT.top + 0.5]], 10), M(x0, 0, z0), cBrass, ID.BRASS);
      await ctx.yield();
      for (const [sy, R, n] of [[8.6, 3.7, 10], [14.6, 3.1, 8], [20.6, 2.5, 7], [25.2, 1.8, 5]]) {
        propsB.add(lathe([[0.3, sy - 1.1], [R * 0.5, sy - 0.85], [R * 0.86, sy - 0.4], [R, sy], [R + 0.1, sy + 0.14], [R - 0.12, sy + 0.14], [R * 0.5, sy - 0.1], [0.3, sy - 0.1]], 20), M(x0, 0, z0), glaze, ID.PLAIN, { grad: [sy - 1.1, sy + 0.14, 0.7, 1.25], jit: 0.06 });
        propsB.add(lathe([[R + 0.1, sy + 0.06], [R + 0.19, sy + 0.14], [R + 0.1, sy + 0.22]], 20), M(x0, 0, z0), cBrass, ID.BRASS);
        propsB.add(lathe([[R * 0.5, sy - 0.86], [R * 0.52, sy - 0.74], [R * 0.5, sy - 0.66]], 20), M(x0, 0, z0), cBrass, ID.BRASS, { k: 0.9 });
        for (let j = 0; j < n; j++) {
          const a = (j + 0.5 * (n % 2)) / n * TAU + sy, r = R - 0.75, px = x0 + Math.cos(a) * r, pz = z0 + Math.sin(a) * r, s2 = tg.range(0.85, 1.15);
          if (j % 2 === 0) {
            propsB.add(new THREE.IcosahedronGeometry(0.95 * s2, 1), M(px, sy + 0.75 * s2, pz, a, 1, 0.85, 1), j % 4 === 0 ? hyd : hyd2, ID.CLOTH, { jit: 0.34 });
            propsB.add(new THREE.IcosahedronGeometry(0.6 * s2, 0), M(px - Math.cos(a) * 0.9, sy + 1.3 * s2, pz - Math.sin(a) * 0.9, a + 1, 1, 0.9, 1), hyd, ID.CLOTH, { jit: 0.3, k: 1.1 });
          } else {
            for (let q = 0; q < 3; q++) {
              const a2 = a + (q - 1) * 0.5 / Math.max(r, 1) * 1.6, h = tg.range(0.9, 1.7) * s2, lx = x0 + Math.cos(a2) * (r + 0.15 * q), lz = z0 + Math.sin(a2) * (r + 0.15 * q);
              propsB.add(cyl(0.04, 0.035, h, 3), M(lx, sy + h / 2, lz), leafD, ID.PLAIN);
              propsB.add(new THREE.ConeGeometry(0.5 * s2, 0.8 * s2, 6, 1, true), M(lx + Math.cos(a2) * 0.2, sy + h + 0.3, lz + Math.sin(a2) * 0.2, -a2, 1, 1, 1, Math.PI + tg.range(-0.25, 0.25), 0.55), lily, ID.CLOTH, { grad: [sy + h, sy + h + 0.8, 0.82, 1.06] });
              propsB.add(ball(0.09 * s2, 4, 3), M(lx + Math.cos(a2) * 0.2, sy + h + 0.42, lz + Math.sin(a2) * 0.2), C('#e2a52a'), ID.PLAIN);
            }
          }
          // a fern frond trailing over the rim between the heads
          const af = a + Math.PI / n, fx2 = x0 + Math.cos(af) * (R + 0.25), fz2 = z0 + Math.sin(af) * (R + 0.25), fl = tg.range(1.6, 2.6);
          propsB.add(new THREE.ConeGeometry(0.42, fl, 4, 1, true), M(fx2, sy - fl * 0.36, fz2, -af, 1, 1, 0.22, 0, Math.PI - 0.38), j % 3 ? leaf : leafD, ID.PLAIN, { grad: [sy - fl, sy + 0.3, 1.25, 0.8] });
        }
        await ctx.yield();
      }
      propsB.add(lathe([[0.9, FT.top + 0.5], [1.25, FT.top + 0.9], [1.3, FT.top + 1.5], [1.1, FT.top + 1.7]], 12), M(x0, 0, z0), cBrass, ID.BRASS);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- cash railway on tiers two and four
    const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
    const rod = (a, b, r, segs = 4) => {
      _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = Math.max(_d.length(), 1e-3); _d.divideScalar(len);
      const g = new THREE.CylinderGeometry(r, r, len, segs, 1, true);
      g.applyMatrix4(new THREE.Matrix4().compose(_p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q.setFromUnitVectors(_up, _d), _s.set(1, 1, 1)));
      return g;
    };
    const cashY = (t, th) => t * TIER + 10.3 + 0.5 * Math.abs((((th / (15 * DEG)) % 2) + 2) % 2 - 1);
    const cashPt = (t, th) => { const e = ellF(th, 3.4); return [e.x, cashY(t, th), e.z]; };
    const balls = [];
    {
      for (const t of [2, 4]) for (let i = 0; i < NBAY; i++) {
        const a = cashPt(t, i * 15 * DEG), b = cashPt(t, (i + 1) * 15 * DEG);
        propsB.add(rod(a, b, 0.06), null, cBrass, ID.BRASS);
        propsB.add(rod([a[0], a[1] - 0.06, a[2]], [a[0], t * TIER + 12.4, a[2]], 0.045, 3), null, cBrass, ID.BRASS, { k: 0.8 });
        propsB.add(ball(0.16, 5, 4), M(a[0], a[1], a[2]), cBrass, ID.BRASS);
        if ((i & 7) === 7) await ctx.yield();
      }
      await ctx.yield();
      const b = makeB(), wd = C('#8a5a2b');
      b.add(ball(0.36, 7, 5), null, wd, ID.WOOD, { jit: 0.3 });
      b.add(new THREE.TorusGeometry(0.365, 0.035, 3, 8), null, cBrass, ID.BRASS);
      const br = rng.fork('balls'), n = Math.round(60 * Math.min(1, density));
      for (let i = 0; i < n; i++) balls.push({ t: i % 2 ? 2 : 4, th0: br.range(0, TAU), w: br.range(0.05, 0.085) * (br.chance(0.5) ? 1 : -1) });
      balls.im = instanced(atrium, b.build(), mShop, balls.map(() => new THREE.Matrix4()), 'cashBalls');
    }

    await ctx.yield();

    // ---------------------------------------------------------------- three bolts of silk that unroll past us
    const silkUn = { value: new THREE.Vector3(0, 0, 0) };
    {
      const pos = [], out = [], aS = [], col = [], idx = [], NSEG = 60, NW = 10;
      const cols = lookI === 2 ? [C('#f6f8f7'), C('#8FC1E3'), C('#d6e6f2')] : [C('#f1ead6'), cPane.clone().lerp(white, 0.1), cRed.clone()];
      // each bolt hangs from a brass display boom over the well, a few metres inside our tube, and faces along the gallery,
      // so it falls past us as a narrow banner with the well in view between the three
      [[117, 5.8], [121.5, 11.3], [126.5, 5.9]].forEach(([deg, reach], k) => {
        const e = ellF(deg * DEG, -reach), r0 = ellF(deg * DEG, 0.1), base = pos.length / 3, y = 3 * TIER + 3.5;
        for (let i = 0; i <= NSEG; i++) for (let j = 0; j <= NW; j++) {
          pos.push(e.x, y, e.z); out.push(-e.tx, 0, -e.tz); aS.push(i / NSEG, (j / NW - 0.5) * 2.0, k);
          col.push(cols[k].r * 0.72, cols[k].g * 0.72, cols[k].b * 0.72, ID.CLOTH);
        }
        for (let i = 0; i < NSEG; i++) for (let j = 0; j < NW; j++) { const o = base + i * (NW + 1) + j; idx.push(o, o + 1, o + NW + 1, o + 1, o + NW + 2, o + NW + 1); }
        const ry = Math.atan2(-e.nz, e.nx);                        // the bolt's axis lies along the boom
        propsB.add(cyl(0.2, 0.2, 2.5, 8), M(e.x, y + 0.12, e.z, ry, 1, 1, 1, 0, Math.PI / 2), C('#6b5a48'), ID.WOOD);
        for (const sd of [-1.28, 1.28]) propsB.add(lathe([[0.02, -0.06], [0.3, -0.05], [0.33, 0], [0.3, 0.05], [0.02, 0.06]], 10), M(e.x + e.nx * sd, y + 0.12, e.z + e.nz * sd, ry, 1, 1, 1, 0, Math.PI / 2), cBrass, ID.BRASS);
        propsB.add(rod([r0.x, y - 0.25, r0.z], [e.x - e.nx * 1.6, y + 0.12, e.z - e.nz * 1.6], 0.075, 6), null, cBrass, ID.BRASS);
        propsB.add(rod([r0.x, y + 2.3, r0.z], [e.x + e.nx * 1.0, y + 0.2, e.z + e.nz * 1.0], 0.035, 5), null, cBrass, ID.BRASS, { k: 0.85 });
        propsB.add(rod([r0.x, y - 0.4, r0.z], [r0.x, y + 2.4, r0.z], 0.07, 6), null, cBrass, ID.BRASS);
        propsB.add(ball(0.17, 7, 5), M(r0.x, y + 2.5, r0.z), cBrass, ID.BRASS);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aOut', new THREE.Float32BufferAttribute(out, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-8, 28, 28), 44);
      addMesh(atrium, g, shopMat({ vert: SILK_VERT, side: THREE.DoubleSide, uniforms: { uUn: silkUn }, defines: { SILK: 1 } }), 'silk');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- two cage lifts in the well
    const lacePos = [], laceNor = [], laceUv = [], laceMode = [], laceIdx = [];
    const laceQuad = (arr, m, a, b, w, h, mode) => {                // a: bottom left, b: bottom right (local), rising h
      const [P, N, Uv, Md, Ix] = arr, base = P.length / 3;
      _n.set(b[0] - a[0], 0, b[2] - a[2]).normalize(); const nx = _n.z, nz = -_n.x;
      [[a, 0, 0], [b, w, 0], [b, w, h], [a, 0, h]].forEach(([q, u, v]) => {
        _v.set(q[0], q[1] + v, q[2]); if (m) _v.applyMatrix4(m); P.push(_v.x, _v.y, _v.z);
        _d.set(nx, 0, nz); if (m) _d.transformDirection(m); N.push(_d.x, _d.y, _d.z); Uv.push(u - w / 2, v); Md.push(mode);
      });
      Ix.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const laceGeo = (arr) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr[0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(arr[1], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(arr[2], 2)); g.setAttribute('aMode', new THREE.Float32BufferAttribute(arr[3], 1)); g.setIndex(arr[4]);
      g.computeBoundingSphere(); return g;
    };
    const liftClear = (th, yMax, off) => {
      const c = ellF(th * DEG, off); let best = 1e9;
      for (const br of A.bridges) {
        if (br.y > yMax + 2) continue;
        const ax = br.from.x, az = br.from.z, bx = br.to.x - ax, bz = br.to.z - az, h = clamp(((c.x - ax) * bx + (c.z - az) * bz) / (bx * bx + bz * bz), 0, 1);
        best = Math.min(best, Math.hypot(c.x - ax - bx * h, c.z - az - bz * h) - br.width / 2);
      }
      return best;
    };
    const pickTh = (cands, yMax, off = LIFT_OFF) => { let b = cands[0], bc = -1e9; for (const th of cands) { const c = liftClear(th, yMax, off); if (c > 6.5) return th; if (c > bc) { bc = c; b = th; } } return b; };
    const staticLace = [lacePos, laceNor, laceUv, laceMode, laceIdx];
    const makeLift = (th, top, load, name, off = LIFT_OFF, openCrown = false) => {
      const f = ellF(th * DEG, off), Mb = frameM(f, 0), at = (m) => Mb.clone().multiply(m), psi = Math.atan2(-f.tz, f.tx);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {        // slim round posts with a knuckle at every frame, so the well shows through the shaft
        propsB.add(cyl(0.085, 0.07, top + 4, 7, true), at(M(sx * 3.3, (top + 4) / 2, sz * 3.3)), cIronL, ID.PLAIN, { grad: [0, top, 0.8, 1.35] });
        for (let y = 6.5; y < top + 4.5; y += 6.5) propsB.add(lathe([[0.075, -0.16], [0.14, -0.1], [0.15, 0], [0.14, 0.1], [0.075, 0.16]], 7), at(M(sx * 3.3, y, sz * 3.3)), cIronL, ID.PLAIN, { k: 1.45 });
        propsB.add(lathe([[0.2, 0], [0.2, 0.25], [0.11, 0.5], [0.08, 0.9]], 7), at(M(sx * 3.3, 0.4, sz * 3.3)), cIronL, ID.PLAIN, { k: 1.1 });
      }
      for (const sx of [-1, 1]) { propsB.add(cyl(0.11, 0.11, top + 3, 5), at(M(sx * 3.05, (top + 3) / 2, 0)), cBrass, ID.BRASS); propsB.add(cyl(0.09, 0.09, top + 3, 4), at(M(sx * 1.6, (top + 3) / 2, 3.95)), cBrass, ID.BRASS, { k: 0.8 }); }
      for (let y = 6.5; y < top + 4.5; y += 6.5) { for (const s of [-1, 1]) { propsB.add(cyl(0.055, 0.055, 6.6, 6, true), at(M(0, y, s * 3.3, 0, 1, 1, 1, 0, Math.PI / 2)), cIronL, ID.PLAIN, { k: 1.25 }); propsB.add(cyl(0.055, 0.055, 6.6, 6, true), at(M(s * 3.3, y, 0, 0, 1, 1, 1, Math.PI / 2)), cIronL, ID.PLAIN, { k: 1.25 }); } }
      // the shaft's crown: a moulded ring, a ribbed ogee cap in dark iron with brass ribs, and a turned finial
      propsB.add(lathe([[4.75, 0], [4.9, 0.12], [4.9, 0.3], [4.7, 0.42], [4.55, 0.42]], 8), at(M(0, top + 3.95, 0, Math.PI / 8)), cIronL, ID.PLAIN, { k: 1.2 });
      if (!openCrown) { const g = new THREE.CircleGeometry(4.6, 16); g.rotateX(Math.PI / 2); propsB.add(g, at(M(0, top + 4.34, 0)), cCream, ID.PLAIN, { k: 1.15 }); }      // a pale soffit under the crown, seen from the lift's own height
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; propsB.add(rod(_v.set(Math.cos(a) * 1.1, top + 4.3, Math.sin(a) * 1.1).applyMatrix4(Mb).toArray(), _n.set(Math.cos(a) * 4.5, top + 4.3, Math.sin(a) * 4.5).applyMatrix4(Mb).toArray(), 0.06, 5), null, cBrass, ID.BRASS); }
      // (the shaft beside our way up has an open crown of brass ribs, so the dome is seen whole through it from below)
      if (!openCrown) propsB.add(lathe([[4.6, 0], [4.1, 0.35], [3.0, 0.8], [1.9, 1.5], [1.0, 2.5], [0.5, 3.3], [0.34, 3.6]], 16), at(M(0, top + 4.37, 0)), C('#1f7c6c'), ID.PLAIN, { grad: [top + 4.3, top + 8, 0.8, 1.3], jit: 0.08 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, pr = [[4.62, 0.02], [4.12, 0.37], [3.02, 0.83], [1.92, 1.53], [1.02, 2.53], [0.52, 3.33]];
        for (let k = 0; k < pr.length - 1; k++) { const p0 = _v.set(Math.cos(a) * pr[k][0], top + 4.37 + pr[k][1], Math.sin(a) * pr[k][0]).applyMatrix4(Mb).toArray(), p1 = _v.set(Math.cos(a) * pr[k + 1][0], top + 4.37 + pr[k + 1][1], Math.sin(a) * pr[k + 1][0]).applyMatrix4(Mb).toArray(); propsB.add(rod(p0, p1, 0.05, 5), null, cBrass, ID.BRASS); } }
      propsB.add(lathe([[0.36, 0], [0.5, 0.12], [0.3, 0.3], [0.16, 0.5], [0.42, 0.85], [0.44, 1.05], [0.14, 1.35], [0.07, 1.9], [0.02, 2.3]], 10), at(M(0, top + 7.95, 0)), cBrass, ID.BRASS);
      propsB.add(new THREE.TorusGeometry(1.1, 0.14, 4, 12), at(M(0, top + 2.9, 0.3, Math.PI / 2)), cBrass, ID.BRASS, { k: 0.8 });
      for (const sx of [-0.5, 0.5]) propsB.add(box(0.09, top + 3, 0.09), at(M(sx, (top + 3) / 2, 0.3)), cIron, ID.PLAIN, { k: 0.9 });
      propsB.add(box(7.5, 0.4, 7.5), at(M(0, 0.2, 0)), cStone, ID.STONE);
      laceQuad(staticLace, Mb, [-3.3, 0.4, -3.3], [3.3, 0.4, -3.3], 6.6, top + 3.6, 3); laceQuad(staticLace, Mb, [3.3, 0.4, 3.3], [-3.3, 0.4, 3.3], 6.6, top + 3.6, 3);
      laceQuad(staticLace, Mb, [3.3, 0.4, -3.3], [3.3, 0.4, 3.3], 6.6, top + 3.6, 3); laceQuad(staticLace, Mb, [-3.3, 0.4, 3.3], [-3.3, 0.4, -3.3], 6.6, top + 3.6, 3);
      // the cage
      const b = makeB(), cage = new THREE.Group(); cage.position.set(f.x, 0, f.z); cage.rotation.y = psi; cage.name = name;
      b.add(box(5.8, 0.3, 5.8), M(0, 0.15, 0), cWood, ID.WOOD, { k: 1.7 }); b.add(box(6.0, 0.14, 6.0), M(0, 0.05, 0), cBrass, ID.BRASS);
      b.quad([-2.2, 0.31, 2.2], [2.2, 0.31, 2.2], [2.2, 0.31, -2.2], [-2.2, 0.31, -2.2], C('#1d4a45'), ID.CLOTH, 1.1);
      b.quad([-2.7, 6.62, -2.7], [2.7, 6.62, -2.7], [2.7, 6.62, 2.7], [-2.7, 6.62, 2.7], cValance, ID.CLOTH, 1.2);      // (a peacock ceiling: seen from below it is not a blank pale square)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.add(lathe([[0.13, 0.3], [0.13, 0.5], [0.07, 0.62], [0.07, 6.1], [0.12, 6.2], [0.12, 6.36], [0.07, 6.45], [0.07, 6.62]], 8), M(sx * 2.8, 0, sz * 2.8), cBrass, ID.BRASS);
        b.add(ball(0.14, 7, 5), M(sx * 2.8, 6.9, sz * 2.8), cBrass, ID.BRASS);
      }
      for (const s of [-1, 1]) for (const y of [6.3, 6.56, 3.1]) { b.add(cyl(0.045, 0.045, 5.6, 6, true), M(0, y, s * 2.8, 0, 1, 1, 1, 0, Math.PI / 2), cBrass, ID.BRASS); if (y > 4 || s > 0) b.add(cyl(0.045, 0.045, 5.6, 6, true), M(s * 2.8, y, 0, 0, 1, 1, 1, Math.PI / 2), cBrass, ID.BRASS); }
      b.add(lathe([[4.05, 6.65], [4.15, 6.75], [4.0, 6.92], [2.9, 7.6], [1.5, 8.15], [0.6, 8.5], [0.3, 8.62]], 16), null, C('#1f7c6c'), ID.PLAIN, { grad: [6.6, 8.7, 0.85, 1.35], jit: 0.08 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, pr = [[4.02, 6.94], [2.92, 7.63], [1.52, 8.18], [0.62, 8.53]];
        for (let k = 0; k < pr.length - 1; k++) b.add(rod([Math.cos(a) * pr[k][0], pr[k][1], Math.sin(a) * pr[k][0]], [Math.cos(a) * pr[k + 1][0], pr[k + 1][1], Math.sin(a) * pr[k + 1][0]], 0.04, 5), null, cBrass, ID.BRASS); }
      b.add(lathe([[0.32, 8.58], [0.4, 8.7], [0.2, 8.85], [0.12, 9.05], [0.3, 9.3], [0.3, 9.42], [0.08, 9.65], [0.02, 10.0]], 10), null, cBrass, ID.BRASS);
      b.add(box(4.6, 0.22, 1.25), M(0, 1.35, 1.95), cWood, ID.WOOD, { k: 1.3 });
      for (const sx of [-1.9, 1.9]) b.add(box(0.2, 1.2, 1.1), M(sx, 0.75, 1.95), cWoodD, ID.WOOD);
      if (load === 0) {
        const kraft = C('#b08a5a');
        b.add(box(1.5, 1.0, 1.1), M(-1.1, 1.96, 1.9, 0.2), kraft, ID.PLAIN, { jit: 0.1 }); b.add(box(1.54, 0.06, 0.1), M(-1.1, 2.47, 1.9, 0.2), cCream, ID.PLAIN); b.add(box(0.1, 0.06, 1.14), M(-1.1, 2.47, 1.9, 0.2), cCream, ID.PLAIN);
        b.add(lathe([[0.03, 0], [0.2, 0.25], [0.24, 0.9], [0.13, 2.0], [0.04, 2.3], [0.03, 2.75], [0.09, 2.85], [0.02, 2.95]], 6), M(1.2, 1.5, 2.2, 0, 1.3, 1.3, 1.3, -0.35, 0.25), cRed, ID.CLOTH, { grad: [1.5, 5, 0.75, 1.05] });
      } else if (load === 1) {
        for (const [x, s, k] of [[-1.2, 1.25, 0.95], [0.3, 1.0, 0.8], [1.5, 0.8, 1.0]]) { b.add(lathe([[0.7 * s, 0], [0.7 * s, 0.6 * s], [0.75 * s, 0.6 * s], [0.75 * s, 0.75 * s], [0.02, 0.75 * s]], 9), M(x, 1.46, 1.95), C('#eef1ea'), ID.PLAIN, { k }); b.add(lathe([[0.712 * s, 0.2 * s], [0.712 * s, 0.32 * s]], 9), M(x, 1.46, 1.95), cRed, ID.CLOTH); }
      } else {
        for (let i = 0; i < 8; i++) b.add(new THREE.TorusGeometry(0.85, 0.03, 3, 7, Math.PI), M(0, 2.4, 1.95, i / 8 * Math.PI, 1, 1.5, 1), cBrass, ID.BRASS);
        for (const y of [1.5, 2.4]) b.add(new THREE.TorusGeometry(0.85, 0.04, 3, 12), M(0, y, 1.95, 0, 1, 1, 1, Math.PI / 2), cBrass, ID.BRASS);
        b.add(cyl(0.85, 0.85, 0.12, 12), M(0, 1.5, 1.95), cBrass, ID.BRASS, { k: 0.8 });
        b.add(ball(0.26, 7, 5), M(0, 2.3, 1.95, 0, 1, 0.9, 1.3), C('#e8c93a'), ID.PLAIN); b.add(ball(0.15, 6, 4), M(0, 2.56, 2.2), C('#e8c93a'), ID.PLAIN, { k: 1.1 });
        b.add(new THREE.ConeGeometry(0.05, 0.16, 4), M(0, 2.56, 2.4, 0, 1, 1, 1, Math.PI / 2), C('#d2702a'), ID.PLAIN);
      }
      addMesh(cage, b.build(), mShop2, name + 'Cage');
      const la = [[], [], [], [], []];
      laceQuad(la, null, [2.8, 0.3, 2.8], [-2.8, 0.3, 2.8], 5.6, 5.85, 1); laceQuad(la, null, [2.8, 0.3, -2.8], [2.8, 0.3, 2.8], 5.6, 5.85, 1);
      laceQuad(la, null, [-2.8, 0.3, 2.8], [-2.8, 0.3, -2.8], 5.6, 5.85, 1); laceQuad(la, null, [-2.8, 0.3, -2.8], [2.8, 0.3, -2.8], 5.6, 5.85, 2);
      addMesh(cage, laceGeo(la), mLace, name + 'Lace', 0.6);
      const cb = makeB();
      cb.add(box(2.8, 4.2, 0.7), M(0, 2.1, 3.95), cIronL, ID.PLAIN, { grad: [0, 4.2, 0.8, 1.2] });
      for (const y of [0.5, 2.1, 3.7]) cb.add(box(2.95, 0.2, 0.84), M(0, y, 3.95), cBrass, ID.BRASS);
      cb.add(new THREE.TorusGeometry(0.3, 0.07, 4, 8), M(0, 4.4, 3.95), cBrass, ID.BRASS);
      const cwG = new THREE.Group(); cwG.position.set(f.x, 0, f.z); cwG.rotation.y = psi; addMesh(cwG, cb.build(), mShop, name + 'Weight');
      atrium.add(cage, cwG);
      // where the camera passes this lift, and how high it is then
      const passes = [], p = new THREE.Vector3(); let prev = 1e9, pprev = 1e9;
      for (let i = 0; i <= 900; i++) {
        const u = 0.2 + 0.7 * i / 900; path.pointAt(toNew(u), p); const d = Math.hypot(p.x - f.x, p.z - f.z);
        if (prev < 34 && prev <= d && prev < pprev && p.y < top - 4) passes.push({ u: u - 0.7 / 900, y: p.y });
        pprev = prev; prev = d;
      }
      passes.length = Math.min(passes.length, 1);
      return { cage, cw: cwG, top, passes, pos: new THREE.Vector3(f.x, 0, f.z), ph: th };
    };
    // lift A stands well out on the shop floor at the first end, so that it is seen whole as we round it; lift B is the close pass
    const liftA = makeLift(pickTh([180, 188, 172, 196, 164, 204, 156], 25, -30), 25, liftLoad === 2 ? 0 : liftLoad, 'liftA', -30);
    await ctx.yield();
    const liftB = makeLift(pickTh([35, 33, 37, 31, 27], 40, -13), 38, 2, 'liftB', -13, true);      // (far enough round the end that the clock mast stands clear beside the cage as we pass)
    addMesh(atrium, laceGeo(staticLace), mLace, 'shaftLace', 0.4);
    await ctx.yield();

    // ---------------------------------------------------------------- birds and air
    const birdLight = F.lightFrom(scene, { sunIntensity: 1.6, skyIntensity: 1.1, groundIntensity: 0.8 });
    const pig = { body: '#59626d', belly: '#7b848c', wingC: '#6d7781', trail: '#59626d', tip: '#262a31', head: '#3f4652', beak: '#c9a27a', tailC: '#3a4048' };
    const swl = { body: '#1d2733', belly: '#e9e4d8', wingC: '#1a222c', trail: '#1d2733', tip: '#10151c', head: '#7a2f22', tailC: '#141a22' };
    const pair = F.makeFlock({ rng: rng.fork('pair'), species: swallows ? 'swifts' : 'crows', count: 2, size: swallows ? 4.2 : 3.0, speed: 13, form: 'loose', spread: [1.6, 0.8, 3], wander: [0.8, 0.5, 0.8, 0.5],
      cross: { path, u: toNew(0.335), lead: 15, angle: 62, side: -1, height: 1.5, span: 110, duration: DUR, rise: 5 }, light: birdLight, ...(swallows ? swl : pig) });
    scene.add(pair.object);
    await ctx.yield();
    const BURST_U = 0.8, nBurst = swallows ? 18 : 30;
    const burst = F.makeFlock({ rng: rng.fork('burst'), species: swallows ? 'swifts' : 'crows', count: nBurst, size: swallows ? 9.0 : 5.4, speed: 11, form: 'loose', spread: [5.5, 3.6, 11], wander: [1.6, 1.1, 1.6, 0.8],
      flap: swallows ? 7 : 5.2, glide: 0.1, closed: false, start: 0, light: birdLight, ...(swallows ? swl : pig),
      // off the nest's eave on the side we come from and out past the horn's back: the sheet crosses the bright panes to the
      // right of the nest and over the horn while we pass the rope
      route: [[-12, 99, -13], [-19, 90, -5], [-23, 87, 4], [-25, 89, 16], [-18, 94, 28], [-2, 100, 34], [18, 105, 26], [30, 108, 6]] });
    burst.object.visible = false; scene.add(burst.object);
    await ctx.yield();
    const BURST_T = (burst.route ? burst.route.length : 230) * 1.12 / 11;
    // the roost on the nest's eave, until they go up
    const roost = (() => {
      const b = makeB(), c = C(pig.body), list = [], rr = rng.fork('roost');
      b.add(ball(0.42, 7, 5), M(0, 0.36, 0, 0, 0.8, 0.85, 1.35), c, ID.PLAIN, { grad: [0, 0.8, 0.7, 1.15] });
      b.add(ball(0.2, 6, 4), M(0, 0.78, 0.42), C(pig.head), ID.PLAIN);
      b.add(new THREE.ConeGeometry(0.2, 0.7, 4), M(0, 0.3, -0.75, 0, 1, 0.4, 1, -Math.PI / 2 - 0.2), C(pig.tip), ID.PLAIN);
      for (let i = 0; i < 20; i++) { const a = -0.3 - i * 0.14 + rr.range(-0.04, 0.04), r = A.nest.radius + 0.75; list.push(M(Math.cos(a) * r, A.nest.floorY + 8.25, Math.sin(a) * r, -a + rr.range(-0.6, 0.6))); }
      return instanced(atrium, b.build(), mShop, list, 'roost');
    })();
    await ctx.yield();
    const time = { value: 0 };
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(1700 * detail), box: [64, 40, 64], size: [0.035, 0.11], colors: ['#ffffff', '#e9f3f0', '#dce8f4'], intensity: 1.3, opacity: 0.7, time });
    scene.add(dust.object);
    await ctx.yield();
    const rays = fx.makeGodRays({ rng: rng.fork('rays'), position: [0, 87, 0], direction: (LK.sunI ? sunDir : zenith).clone().negate(), radius: 27, count: LK.sunI ? 13 : 9, length: LK.sunI ? 104 : 80,
      width: [2.0, 6.5], color: LK.sunI ? (LK.sunC ? '#ffc888' : '#ffdc9c') : hexMix(LK.key, LK.pane, 0.25), intensity: LK.sunI ? 0.46 : 0.1, speed: 0.6, time });
    rays.object.name = 'sunShafts'; atrium.add(rays.object);
    let petals = null;
    if (lookI === 1) { petals = fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', count: Math.round(1100 * detail * density), box: [70, 46, 70], velocity: [0.25, -1.1, 0.15], size: [0.34, 0.62], colors: ['#b79be8', '#9a78d8', '#d9c9f6'], time }); scene.add(petals.object); }
    await ctx.yield();

    // ---------------------------------------------------------------- the basement dispatch room
    basement.matrixAutoUpdate = false; basement.matrix.copy(bMat); basement.updateMatrixWorld(true);
    const BZ0 = -24, BZ1 = 64, BF = -15;
    const cat = new THREE.Group(), parcels = [];
    {
      const b = makeB(), brick = C('#a05a40'), flag = C('#9c8c74'), lensQ = [];
      b.quad([-20, BF, BZ1], [20, BF, BZ1], [20, BF, BZ0], [-20, BF, BZ0], flag, ID.TILE);
      for (let z = BZ0; z < BZ1 - 0.01; z += 8) for (let k = 0; k < 6; k++) {
        const f0 = k / 6, f1 = (k + 1) / 6, y0 = -1 - 1.3 * (1 - Math.sin(Math.PI * f0)), y1 = -1 - 1.3 * (1 - Math.sin(Math.PI * f1));
        b.quad([-20, y0, z + 8 * f0], [20, y0, z + 8 * f0], [20, y1, z + 8 * f1], [-20, y1, z + 8 * f1], brick, ID.BRICK, 0.92);
      }
      b.quad([-20, BF, BZ1], [-20, BF, BZ0], [-20, -1, BZ0], [-20, -1, BZ1], brick, ID.BRICK);
      b.quad([20, BF, BZ0], [20, BF, BZ1], [20, -1, BZ1], [20, -1, BZ0], brick, ID.BRICK);
      b.quad([-20, BF, BZ0], [20, BF, BZ0], [20, -1, BZ0], [-20, -1, BZ0], brick, ID.BRICK, 0.9);
      b.quad([20, BF, BZ1], [-20, BF, BZ1], [-20, -1, BZ1], [20, -1, BZ1], brick, ID.BRICK, 0.8);
      await ctx.yield();
      for (let z = BZ0 + 8; z < BZ1; z += 8) b.add(box(40, 0.4, 0.8), M(0, -2.22, z), brick, ID.BRICK, { k: 1.25 });      // vault ribs in brick: no black beam across the top of the picture
      const cprof = [[0.75, 0], [0.75, 0.5], [0.55, 0.7], [0.42, 0.9], [0.36, 6.0], [0.46, 6.1], [0.46, 6.35], [0.36, 6.45], [0.33, 10.9], [0.45, 11.1], [0.8, 11.8], [0.8, 12.1]];
      for (let z = -16; z < BZ1; z += 16) for (const x of [-9.5, 9.5]) {
        b.add(lathe(cprof, 7), M(x, BF, z), cIronL, ID.PLAIN, { k: 1.25, grad: [BF, -3, 0.8, 1.2] });
        b.add(box(0.7, 0.4, 19), M(x, -2.65, z), cIronL, ID.PLAIN, { k: 2.0 });
        for (const sx of [-20, 20]) b.add(box(0.8, 14, 1.6), M(sx * 0.985, -8, z), brick, ID.BRICK, { k: 1.1 });
        if (x > 0) await ctx.yield();
      }
      await ctx.yield();
      for (let z = BZ0 + 12; z < BZ1; z += 16) for (const x of [-15, -5, 5, 15]) {
        for (const s of [-1, 1]) { b.add(box(4.1, 0.34, 0.24), M(x, -1.5, z + s * 1.93), cIron, ID.PLAIN, { k: 1.3 }); b.add(box(0.24, 0.34, 4.1), M(x + s * 1.93, -1.5, z), cIron, ID.PLAIN, { k: 1.3 }); }
        const pg = new THREE.PlaneGeometry(3.7, 3.7); pg.rotateX(Math.PI / 2); pg.translate(x, -1.46, z); lensQ.push(pg);
      }
      for (let i = 0; i <= 4; i++) b.add(box(0.9, 11.2, 0.4), M(-14 + i * 7, -8, BZ0 + 0.25), cIron, ID.PLAIN, { k: 0.8 });     // bold bars: the grid reads from the far end of the room
      for (let i = 0; i <= 2; i++) b.add(box(28.9, 0.9, 0.4), M(0, -13.4 + i * 5.4, BZ0 + 0.25), cIron, ID.PLAIN, { k: 0.8 });
      for (let i = 0; i < 12; i++) if (i % 3) b.add(box(0.2, 10.8, 0.25), M(-14 + i * 7 / 3, -8, BZ0 + 0.2), cIron, ID.PLAIN, { k: 0.8 });
      for (const y of [-10.7, -5.3]) b.add(box(28, 0.2, 0.25), M(0, y, BZ0 + 0.2), cIron, ID.PLAIN, { k: 0.8 });
      b.add(box(30, 0.7, 0.7), M(0, -2.2, BZ0 + 0.3), flag, ID.STONE); b.add(box(30, 0.7, 0.7), M(0, -13.9, BZ0 + 0.3), flag, ID.STONE);
      await ctx.yield();
      // shelving, parcels, crates
      const pr = rng.fork('parcels'), kraft = [C('#b08a5a'), C('#c9b48c'), C('#8b6b47'), C('#9db4c4'), C('#d9d2c0')];
      const twine = C('#e8dcc0'), labelC = C('#f3ecd9'), _pm = new THREE.Matrix4();
      const lq = (pts, col, id, k) => b.quad(...pts.map((q) => _v.set(q[0], q[1], q[2]).applyMatrix4(_pm).toArray()), col, id, k);
      const parcel = (x, y, z, s) => { const w = pr.range(0.8, 1.7) * s, h = pr.range(0.6, 1.2) * s, d = pr.range(0.8, 1.4) * s, ry = pr.range(-0.3, 0.3), kc = pr.pick(kraft);
        b.add(box(w, h, d), M(x, y + h / 2, z, ry), kc, ID.PLAIN, { jit: 0.12 });
        // tied both ways with twine, a paper label on the face toward the aisle, a red wax seal where the strings cross
        _pm.copy(M(x, y, z, ry)); const X = w / 2 + 0.012, Z = d / 2 + 0.012, T = h + 0.012, e = 0.045 * s, sg = x > 0 ? -1 : 1;
        lq([[-X, T, e], [X, T, e], [X, T, -e], [-X, T, -e]], twine, ID.PLAIN, 1); lq([[-e, T + 0.004, Z], [e, T + 0.004, Z], [e, T + 0.004, -Z], [-e, T + 0.004, -Z]], twine, ID.PLAIN, 0.92);
        lq([[-e, 0, Z], [e, 0, Z], [e, T, Z], [-e, T, Z]], twine, ID.PLAIN, 0.85); lq([[e, 0, -Z], [-e, 0, -Z], [-e, T, -Z], [e, T, -Z]], twine, ID.PLAIN, 0.85);
        lq([[X, 0, e], [X, 0, -e], [X, T, -e], [X, T, e]], twine, ID.PLAIN, 0.85); lq([[-X, 0, -e], [-X, 0, e], [-X, T, e], [-X, T, -e]], twine, ID.PLAIN, 0.85);
        const lw = Math.min(0.3 * s, d * 0.3), lh = Math.min(0.2 * s, h * 0.3), lz = d * 0.24, ly = h * 0.56;
        lq(sg > 0 ? [[X + 0.004, ly - lh, lz + lw], [X + 0.004, ly - lh, lz - lw], [X + 0.004, ly + lh, lz - lw], [X + 0.004, ly + lh, lz + lw]] : [[-X - 0.004, ly - lh, lz - lw], [-X - 0.004, ly - lh, lz + lw], [-X - 0.004, ly + lh, lz + lw], [-X - 0.004, ly + lh, lz - lw]], labelC, ID.PLAIN, 1.05);
        lq([[-lw, T + 0.006, -lz - lh], [-lw, T + 0.006, -lz + lh], [lw, T + 0.006, -lz + lh], [lw, T + 0.006, -lz - lh]].map((q) => [q[0] + w * 0.2, q[1], q[2]]), labelC, ID.PLAIN, 1.0);
        b.add(ball(0.1 * s, 6, 3), M(x, y + T + 0.02 * s, z, 0, 1, 0.5, 1), cRed, ID.CLOTH, { k: 1.15 });
        return h; };
      for (let z = -8; z < BZ1 - 14; z += 16) for (const sx of [-1, 1]) {
        if (pr.chance(0.15)) continue;
        const x = sx * 17.6;
        for (const dz of [-5.6, 0, 5.6]) b.add(box(0.3, 9.4, 2.4), M(x, BF + 4.7, z + dz), cWoodD, ID.WOOD, { k: 1.3 });
        for (const y of [BF + 0.5, BF + 3.3, BF + 6.1, BF + 8.9]) { b.add(box(2.4, 0.22, 11.6), M(x, y, z), cWood, ID.WOOD, { k: 1.2 }); b.add(box(0.07, 0.1, 11.5), M(x - sx * 1.24, y + 0.3, z), cBrass, ID.BRASS); b.add(box(0.1, 0.24, 11.6), M(x - sx * 1.22, y, z), cWood, ID.WOOD, { k: 1.9 });
          for (let k = 0; k < 4; k++) if (pr.chance(0.8)) parcel(x - sx * pr.range(0, 0.4), y + 0.11, z + (k - 1.5) * 2.7 + pr.range(-0.4, 0.4), 1.3); }
        await ctx.yield();                                          // a shelf unit at a time
      }
      for (let i = 0; i < 13; i++) {
        const x = pr.range(-15.5, 15.5), z = pr.range(-4, BZ1 - 8); if (Math.abs(Math.abs(x) - 9.5) < 1.6) continue;
        let y = BF; const n = pr.int(1, 3), s = pr.range(1.3, 2.0); for (let k = 0; k < n; k++) y += parcel(x + pr.range(-0.2, 0.2), y, z + pr.range(-0.2, 0.2), s * (1 - k * 0.15));
        b.add(box(0.09, 0.07, 1.5 * s), M(x, y + 0.005, z), cCream, ID.PLAIN, { k: 0.8 }); b.add(box(0.5 * s, 0.03, 0.34 * s), M(x + 0.3 * s, y + 0.01, z + 0.25 * s, 0.3), cCream, ID.PLAIN, { k: 1.1 });
        b.add(ball(0.07 * s, 5, 4), M(x, y + 0.06, z), cRed, ID.CLOTH);
        await ctx.yield();
      }
      await ctx.yield();
      { const sr = rng.fork('sacks'), jute = C('#b39a6b');
        for (let i = 0; i < 6; i++) {
          const x = (i % 2 ? 1 : -1) * sr.range(3.5, 7.5), z = 6 + i * 9 + sr.range(-3, 3), sc = sr.range(1.0, 1.5), ry = sr.range(0, TAU);
          b.add(ball(0.8, 8, 6), M(x, BF + 0.62 * sc, z, ry, sc, sc * 0.8, sc * 1.2), jute, ID.CLOTH, { jit: 0.2, grad: [BF, BF + 1.4 * sc, 0.7, 1.1] });
          b.add(new THREE.ConeGeometry(0.22, 0.5, 6), M(x + Math.sin(ry) * 0.2 * sc, BF + 1.3 * sc, z + Math.cos(ry) * 0.9 * sc, ry, sc, sc, sc, 0.9), jute, ID.CLOTH, { k: 0.85 });
          await ctx.yield();
        } }
      await ctx.yield();
      // cradles that carry the rack
      for (let z = -8; z < BZ1; z += 16) for (const sx of [-1, 1]) { if (z === 24) continue; b.add(box(10.2, 0.12, 0.2), M(sx * 8.2 + 0.6, -6.66, z), cBrass, ID.BRASS); for (const x of [3.3, 13.1]) b.add(box(0.1, 4.2, 0.1), M(sx * x + 0.6, -4.55, z), cBrass, ID.BRASS); }
      // the chute and the cat's tower
      b.add(box(11.5, 0.2, 2.4), M(14.6, -8.6, 24, 0, 1, 1, 1, 0, 0.72), cWood, ID.WOOD, { k: 1.3 });
      for (const dz of [-1.25, 1.25]) b.add(box(11.5, 0.6, 0.14), M(14.6, -8.3, 24 + dz, 0, 1, 1, 1, 0, 0.72), cWoodD, ID.WOOD, { k: 1.4 });
      for (const [x, z] of [[-5.4, 6.2], [-7.6, 6.2], [-5.4, 9.8], [-7.6, 9.8]]) b.add(box(0.28, 7.3, 0.28), M(x, BF + 3.65, z), cWoodD, ID.WOOD, { k: 1.4 });
      b.add(box(2.9, 0.25, 4.4), M(-6.5, -7.6, 8), cWood, ID.WOOD, { k: 1.3 }); b.add(box(2.9, 0.2, 4.4), M(-6.5, -11.2, 8), cWood, ID.WOOD);
      b.add(cyl(0.62, 0.62, 3.6, 10), M(-6.5, -6.86, 8, 0, 1, 1, 1, Math.PI / 2), C(LK.cloth[3]), ID.CLOTH, { jit: 0.1 });
      b.add(cyl(0.6, 0.6, 3.3, 10), M(-6.5, -10.5, 8.2, 0, 1, 1, 1, Math.PI / 2), C(LK.cloth[1]), ID.CLOTH, { jit: 0.1 });
      await ctx.yield();
      addMesh(basement, b.build(), mBase2, 'basementShell');
      {
        // the end wall is one great window of the dome's own feather glass, lit from the well beyond: the first thing seen
        const wg = new THREE.PlaneGeometry(28, 10.8); wg.translate(0, -8, BZ0 + 0.13);
        const wm = new THREE.ShaderMaterial({ uniforms: { uCookie: U.uCookie, uTime: U.uTime },
          vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D uCookie; uniform float uTime; varying vec2 vUv;
            void main() {
              vec2 q = vec2(0.5 + (vUv.x - 0.5) * 0.93, 0.5 + (vUv.y - 0.5) * 0.93 * 10.8 / 28.0);
              vec3 t = texture2D(uCookie, q).rgb; float sat = max(max(t.r, t.g), t.b) - min(min(t.r, t.g), t.b);
              vec3 col = mix(t * mix(1.9, 4.0, smoothstep(0.05, 0.3, sat)), vec3(2.5, 2.8, 2.9) * (0.4 + 0.6 * dot(t, vec3(0.3, 0.5, 0.2))), 0.45) * vec3(1.15, 1.26, 1.26);
              col *= 0.9 + 0.1 * sin(uTime * 0.63 + vUv.x * 5.0);
              gl_FragColor = vec4(col, 1.0);
            }` });
        addMesh(basement, wg, wm, 'featherWindow');
      }
      await ctx.yield();
      {
        // pavement lights: each panel is an iron frame set with thick round glass lenses that glow cold white with the street's daylight
        const mb = makeB(); for (const g of lensQ) mb.add(g, null, white, 0);
        const lgeo = mb.build(), lm = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uBInv: U.uBInv }, side: THREE.DoubleSide,
          vertexShader: 'uniform mat4 uBInv; varying vec2 vQ; varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vQ = (uBInv * w).xz; gl_Position = projectionMatrix * viewMatrix * w; }',
          fragmentShader: `uniform float uTime; varying vec2 vQ; varying vec3 vW;
            void main() {
              vec2 g = vQ / vec2(1.25, 1.2308) + vec2(0.48, 0.253), f = fract(g) - 0.5, ci = floor(g); float r = length(f), aa = max(fwidth(g.x) + fwidth(g.y), 1e-3);
              float lens = 1.0 - smoothstep(0.4 - aa, 0.4 + aa, r);
              float hh = fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5453);
              vec3 glass = mix(vec3(1.5, 1.9, 2.2), vec3(3.4, 3.8, 3.9), 1.0 - smoothstep(0.0, 0.36, r)) * (0.8 + 0.2 * hh);
              glass *= 0.9 + 0.1 * sin(uTime * 0.63 + ci.x * 0.7 + ci.y * 1.3);                // the street's light breathes
              glass *= 1.0 - 0.55 * smoothstep(0.5, 1.0, sin(vQ.x * 0.21 + vQ.y * 0.13 - uTime * 0.5) * 0.5 + 0.5) * step(0.82, hh);   // someone walks over
              vec3 col = mix(vec3(0.03, 0.045, 0.05), glass, mix(lens, 0.5, smoothstep(0.25, 0.6, aa)));
              gl_FragColor = vec4(col, 1.0);
            }` });
        addMesh(basement, lgeo, lm, 'pavementLights');
      }
      // the cat, asleep on the bolt
      const cb = makeB(), fur = C('#c98a3c'), furD = C('#9a5f24'), pale = C('#f0e2c8');
      cb.add(ball(1, 12, 8), M(0, 0.55, 0, 0, 0.82, 0.6, 1.5), fur, ID.CLOTH, { jit: 0.35, grad: [0, 1.2, 0.75, 1.1] });
      cb.add(ball(0.62, 9, 7), M(0.1, 0.5, -1.0, 0, 1, 0.9, 1), furD, ID.CLOTH, { jit: 0.3 });
      cb.add(ball(0.46, 9, 7), M(0.15, 0.62, 1.35, 0, 1, 0.9, 1), fur, ID.CLOTH, { jit: 0.2 });
      cb.add(ball(0.2, 6, 4), M(0.2, 0.5, 1.72), pale, ID.CLOTH);
      for (const sx of [-0.24, 0.24]) cb.add(new THREE.ConeGeometry(0.16, 0.34, 4), M(0.15 + sx, 1.04, 1.3), furD, ID.CLOTH);
      for (const sz of [0.5, 0.95]) cb.add(ball(0.2, 6, 4), M(0.62, 0.16, sz, 0, 1.5, 0.8, 1), pale, ID.CLOTH);
      addMesh(cat, cb.build(), mBase, 'cat');
      const tailC = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.45, -0.25, 0), new THREE.Vector3(0.65, -1.0, 0.05), new THREE.Vector3(0.6, -1.9, 0.1), new THREE.Vector3(0.75, -2.3, 0.1)]);
      const tb = makeB(); tb.add(new THREE.TubeGeometry(tailC, 10, 0.14, 6, false), null, furD, ID.CLOTH, { jit: 0.4 }); tb.add(ball(0.15, 6, 4), M(0.75, -2.3, 0.1), pale, ID.CLOTH);
      const tail = new THREE.Group(); tail.position.set(0.62, 0.45, -1.1); addMesh(tail, tb.build(), mBase, 'catTail'); cat.add(tail); cat.userData.tail = tail;
      cat.position.set(-6.4, -6.26, 8); cat.scale.setScalar(1.35); basement.add(cat);
      await ctx.yield();
      // parcels on the chute
      const pb = makeB(); pb.add(box(1.5, 0.9, 1.3), M(0, 0.45, 0), kraft[0], ID.PLAIN, { jit: 0.15 }); pb.add(box(1.53, 0.07, 0.1), M(0, 0.9, 0), cCream, ID.PLAIN); pb.add(box(0.1, 0.07, 1.33), M(0, 0.9, 0), cCream, ID.PLAIN);
      for (let i = 0; i < 6; i++) parcels.push({ ph: i / 6, dz: pr.range(-0.4, 0.4), ry: pr.range(-0.3, 0.3) });
      parcels.im = instanced(basement, pb.build(), mBase, parcels.map(() => new THREE.Matrix4()), 'chuteParcels');
      // cones of light under the pavement lenses
      const cg = [];
      for (let z = BZ0 + 12; z < BZ1; z += 16) for (const x of [-15, -5, 5, 15]) { const g = new THREE.CylinderGeometry(1.15, 3.3, 13.6, 16, 1, true); g.translate(x, -8.05, z); cg.push(g); }
      const merged = makeB(); for (const g of cg) merged.add(g, null, white, 0);
      const cgeo = merged.build(); { const p = cgeo.attributes.position, h = new Float32Array(p.count); for (let i = 0; i < p.count; i++) h[i] = clamp((p.getY(i) - BF) / 13.7, 0, 1); cgeo.setAttribute('aH', new THREE.BufferAttribute(h, 1)); }
      const cm = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uGain: { value: 0.5 } }, vertexShader: CONE_VERT, fragmentShader: CONE_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      addMesh(basement, cgeo, cm, 'lensCones', 2);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the rack: thirty-eight more tubes, and capsules in them
    const sampleTab = (tab, s, pos, tan) => {
      const f = clamp(s / tab.step, 0, tab.n - 1e-4), i = Math.floor(f), t = f - i, p = tab.p, k = i * 3;
      pos.set(p[k] + (p[k + 3] - p[k]) * t, p[k + 1] + (p[k + 4] - p[k + 1]) * t, p[k + 2] + (p[k + 5] - p[k + 2]) * t);
      if (tan) tan.set(p[k + 3] - p[k], p[k + 4] - p[k + 1], p[k + 5] - p[k + 2]).normalize();
      return pos;
    };
    const RACK_CLEAR = 1.03 + 2.0, rack = [], nb = hero.tubes.find((t) => t.info && t.info.kind === 'neighbour');
    {
      const nbK = nb ? Math.round(new THREE.Vector3(nb.p[0], nb.p[1], nb.p[2]).applyMatrix4(bInv).x / 1.2) : 1;
      const lanes = [];
      for (let k = -9; k <= 10; k++) if (k !== 0 && k !== nbK) lanes.push([k * 1.2, -6, k]);
      for (let k = -10; k <= 9; k++) lanes.push([(k + 0.5) * 1.2, -4.5, 99]);
      const rr = rng.fork('rack');
      // the line our tube flies through the room (to u 0.09; the basement is not drawn beyond), every 0.5 m: each lane's least
      // distance from it (clr, axis to line) decides below which lanes a free runner may take. RACK_CLEAR is a capsule's half
      // length and 2.0 m of clear air; a stretch of a lane farther than twice that from the line's box is not reckoned at all
      // (it cannot make its lane a near one), so clr is the true distance wherever it is under twice RACK_CLEAR. The line is
      // also kept in runs of eight points, each with its own box (rc): a run whose box lies no nearer a stretch than the
      // least distance found so far cannot lower clr, and a run whose box lies beyond twice RACK_CLEAR cannot bring clr under
      // twice RACK_CLEAR; both are passed over. So clr is the same number as the unpruned reckoning's wherever it is under
      // twice RACK_CLEAR; beyond that it is no longer a distance (it may stay 1e9) and is to be read only against RACK_CLEAR,
      // as nearLane below does. (Fewer reckonings: before this pruning the lanes' were most of what the cure added to the build.)
      const rl = [], rb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9], rc = [];
      { const q = new THREE.Vector3(); for (let d = 0; d <= 0.09 * path.length; d += 0.5) { path.pointAt(d / path.length, q); rl.push(q.x, q.y, q.z);
        rb[0] = Math.min(rb[0], q.x); rb[1] = Math.min(rb[1], q.y); rb[2] = Math.min(rb[2], q.z); rb[3] = Math.max(rb[3], q.x); rb[4] = Math.max(rb[4], q.y); rb[5] = Math.max(rb[5], q.z); } }
      for (let j = 0; j < rl.length; j += 24) { const o = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
        for (let m = j; m < Math.min(rl.length, j + 24); m += 3) for (let w = 0; w < 3; w++) { o[w] = Math.min(o[w], rl[m + w]); o[w + 3] = Math.max(o[w + 3], rl[m + w]); }
        rc.push(o); }
      for (const [x, y, k] of lanes) {
        const c = new THREE.CatmullRomCurve3([[x, y, BZ1], [x, y, 30], [x, y, -9], [x, y + 0.9, -14.5], [x, y + 2.6, -18.5], [x, y + 5.4, -21.5]].map((q) => new THREE.Vector3(q[0], q[1], q[2]).applyMatrix4(bMat)), false, 'centripetal', 0.5);
        const len = c.getLength(), n = Math.round(len / 2.5), sp = c.getSpacedPoints(n), p = new Float32Array((n + 1) * 3);
        for (let i = 0; i <= n; i++) { p[i * 3] = sp[i].x; p[i * 3 + 1] = sp[i].y; p[i * 3 + 2] = sp[i].z; }
        let clr = 1e18;
        for (let i = 0; i < n; i++) {
          const ax = p[i * 3], ay = p[i * 3 + 1], az = p[i * 3 + 2], ex = p[i * 3 + 3] - ax, ey = p[i * 3 + 4] - ay, ez = p[i * 3 + 5] - az, ll = ex * ex + ey * ey + ez * ez || 1;
          const lx = Math.min(ax, p[i * 3 + 3]), hx = Math.max(ax, p[i * 3 + 3]), ly = Math.min(ay, p[i * 3 + 4]), hy = Math.max(ay, p[i * 3 + 4]), lz = Math.min(az, p[i * 3 + 5]), hz = Math.max(az, p[i * 3 + 5]);
          const gx = Math.max(0, lx - rb[3], rb[0] - hx), gy = Math.max(0, ly - rb[4], rb[1] - hy), gz = Math.max(0, lz - rb[5], rb[2] - hz);
          if (gx * gx + gy * gy + gz * gz >= 4 * RACK_CLEAR * RACK_CLEAR) continue;
          for (let r = 0; r < rc.length; r++) {
            const o = rc[r], cx = Math.max(0, lx - o[3], o[0] - hx), cy = Math.max(0, ly - o[4], o[1] - hy), cz = Math.max(0, lz - o[5], o[2] - hz), g2 = cx * cx + cy * cy + cz * cz;
            if (g2 >= clr || g2 >= 4 * RACK_CLEAR * RACK_CLEAR) continue;                 // (no point of this run can lower clr, or the run lies beyond twice RACK_CLEAR)
            for (let j = r * 24, e = Math.min(rl.length, j + 24); j < e; j += 3) {
              const f = clamp(((rl[j] - ax) * ex + (rl[j + 1] - ay) * ey + (rl[j + 2] - az) * ez) / ll, 0, 1), dx = ax + ex * f - rl[j], dy = ay + ey * f - rl[j + 1], dz = az + ez * f - rl[j + 2], d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < clr) clr = d2;
            }
          }
        }
        rack.push({ p, n, len, step: len / n, ph: rr() * TAU, k, clr: Math.sqrt(clr) });
        if ((rack.length & 1) === 0) await ctx.yield();             // (two lanes at a time: each lane now also reckons its distance from our line)
      }
      await ctx.yield();
      let nv = 0, ni = 0; for (const t of rack) { nv += (t.n + 1) * 2; ni += t.n * 6; }
      const pos = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), ph = new Float32Array(nv), idx = new Uint32Array(ni);
      let v = 0, ii = 0;
      for (const t of rack) {
        const p = t.p;
        for (let i = 0; i <= t.n; i++) {
          const a = Math.max(0, i - 1) * 3, b = Math.min(t.n, i + 1) * 3;
          let tx = p[b] - p[a], ty = p[b + 1] - p[a + 1], tz = p[b + 2] - p[a + 2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
          for (let s = -1; s <= 1; s += 2) { pos[v * 3] = p[i * 3]; pos[v * 3 + 1] = p[i * 3 + 1]; pos[v * 3 + 2] = p[i * 3 + 2]; tan[v * 3] = tx; tan[v * 3 + 1] = ty; tan[v * 3 + 2] = tz; uv[v * 2] = s; uv[v * 2 + 1] = i * t.step; ph[v] = t.ph; v++; }
          if (i < t.n) { const o = v - 2; idx[ii++] = o; idx[ii++] = o + 1; idx[ii++] = o + 2; idx[ii++] = o + 1; idx[ii++] = o + 3; idx[ii++] = o + 2; }
        }
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
      g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.boundingSphere = new THREE.Sphere(bOrg.clone().addScaledVector(bDir, -60).setY(-6), 130);
      const gm = premult(new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true, side: THREE.DoubleSide, defines: { RACK: 1 } }));
      for (const k in hero.uniforms) gm.uniforms[k] = hero.uniforms[k];
      gm.uniforms.uKey = { value: new THREE.Color(0.86, 0.96, 1.0) }; gm.uniforms.uAmb = { value: new THREE.Color(0.12, 0.14, 0.15) }; gm.uniforms.uPane = { value: C('#5f8f8a') };
      const rm = new THREE.Mesh(g, gm); rm.renderOrder = 2; rm.name = 'rackTubes'; scene.add(rm); rack.mesh = rm;
    }
    const capProfile = [[0.02, -1.0], [0.3, -1.0], [0.385, -0.93], [0.4, -0.82], [0.4, -0.72], [0.355, -0.68], [0.355, 0.46], [0.4, 0.5], [0.4, 0.64], [0.37, 0.7]];
    const noseProfile = [[0.37, 0.7], [0.398, 0.79], [0.36, 0.94], [0.22, 1.03], [0.02, 1.06]];
    const noseCols = [cRed.clone(), C('#2a8c58'), C('#3f8fd0'), C('#eef1ea')];
    const rackCaps = [];
    {
      const bb = makeB(); bb.add(lathe(capProfile, 10), null, cBrass, ID.BRASS, { jit: 0.15 });
      const nbld = makeB(); nbld.add(lathe(noseProfile, 10), null, white, ID.CLOTH, { jit: 0.1 });
      const cr = rng.fork('rackcaps'), left = rack.filter((t) => t.k < 0 && t.k > -4).sort((a, b) => b.k - a.k)[0], right = rack.filter((t) => t.k > 0 && t.k < 4).sort((a, b) => a.k - b.k)[0];
      const cols = [];
      // The free runners keep to lanes away from the eye, by PLACE. The list they are dealt from is the one the lane numbers
      // give (two lanes off in the lower row; every upper lane carries 99, so the number never kept a runner out of the upper
      // lanes our own tube climbs through): it stays as it is, so that every draw still lands on the lane it did. A runner
      // dealt a lane whose axis comes nearer the line we fly than RACK_CLEAR (a capsule's half length and 2.0 m of clear air)
      // takes a clear lane instead: the runners of a run of such lanes take the clear lanes next after it, one lane each in
      // the same order. Nothing reads the lens; no draw is added, removed or reordered.
      const far = rack.filter((t) => Math.abs(t.k) > 1), nearLane = (t) => t.clr < RACK_CLEAR;
      for (let i = 0; i < 30; i++) {
        let fi = -1, tab = i === 0 ? left : i === 1 ? right : far[fi = cr.int(0, far.length - 1)];
        for (let g = 0; fi >= 0 && nearLane(far[fi]) && g < 6; g++) {
          let a = fi, b = fi; while (a > 0 && nearLane(far[a - 1])) a--; while (b < far.length - 1 && nearLane(far[b + 1])) b++;
          fi = (fi + b - a + 1) % far.length; tab = far[fi];
        }
        rackCaps.push({ tab: i === 2 ? (rack.find((t) => t.k === (right && right.k === 2 ? 3 : 2)) || tab) : tab, speed: cr.range(26, 52), off: cr() * tab.len }); cols.push(i === 0 ? noseCols[1] : i === 1 ? noseCols[2] : i === 2 ? noseCols[3] : noseCols[cr.int(0, 3)]);
      }
      if (nb) rackCaps[2].tab = nb;                              // the white-nosed rival starts beside us, in the neighbouring tube
      const mCapB = shopMat({ basement: true, uniforms: { uSelf: { value: 0.2 } }, defines: { CAPSULE: 1 } });
      rackCaps.body = instanced(basement, bb.build(), mCapB, rackCaps.map(() => new THREE.Matrix4()), 'rackCapsules');
      rackCaps.nose = instanced(basement, nbld.build(), mCapB, rackCaps.map(() => new THREE.Matrix4()), 'rackNoses', cols);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the rival's own strand
    // One more express tube comes up from the shop floor, runs level with us a few metres out in the well for the long
    // sweep and then leaps to the rope. The white-nosed rival rides it where the gaze is: drawing level, edging ahead, falling back.
    const spur = { n: 0, step: 1, len: 0, p: null, sAt: new Float32Array(65), u0: 0.455, u1: 0.69 };
    {
      const cp = [], q = new THREE.Vector3(), tg = new THREE.Vector3();
      const Q = (uo, off, dy) => { const u = toNew(uo); path.pointAt(u, q); path.tangentAt(u, tg); const l = Math.hypot(tg.x, tg.z) || 1; return new THREE.Vector3(q.x - tg.z / l * off, q.y + dy, q.z + tg.x / l * off); };
      const a = Q(spur.u0 - 0.012, 5.8, 0); cp.push(new THREE.Vector3(a.x, 0.2, a.z), new THREE.Vector3(a.x, a.y * 0.5, a.z), new THREE.Vector3(a.x, a.y - 9, a.z));
      for (let u = spur.u0; u <= spur.u1 + 1e-6; u += 0.0085) cp.push(Q(u, 5.8, 1.0));
      const e = Q(spur.u1 + 0.012, 9, 2.5), er = Math.hypot(e.x, e.z) || 1;
      cp.push(e, new THREE.Vector3(e.x * 0.62, e.y + 4, e.z * 0.62), new THREE.Vector3(e.x / er * 9.4, e.y + 7, e.z / er * 9.4));
      const c = new THREE.CatmullRomCurve3(cp, false, 'centripetal', 0.5), len = c.getLength(), n = Math.round(len / 1.5), sp = c.getSpacedPoints(n);
      await ctx.yield();
      const P = new Float32Array((n + 1) * 3); for (let i = 0; i <= n; i++) { P[i * 3] = sp[i].x; P[i * 3 + 1] = sp[i].y; P[i * 3 + 2] = sp[i].z; }
      spur.n = n; spur.len = len; spur.step = len / n; spur.p = P;
      for (let k = 0; k <= 64; k++) {                              // where on the strand each u of ours lies
        const t = Q(lerp(spur.u0, spur.u1, k / 64), 5.8, 1.0); let bi = 0, bd = 1e9;
        for (let i = 0; i <= n; i++) { const d = (P[i * 3] - t.x) ** 2 + (P[i * 3 + 1] - t.y) ** 2 + (P[i * 3 + 2] - t.z) ** 2; if (d < bd) { bd = d; bi = i; } }
        spur.sAt[k] = bi * spur.step;
      }
      const nv = (n + 1) * 2, pos = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), ph = new Float32Array(nv), idx = new Uint32Array(n * 6);
      let v = 0, ii = 0;
      for (let i = 0; i <= n; i++) {
        const a3 = Math.max(0, i - 1) * 3, b3 = Math.min(n, i + 1) * 3;
        let tx = P[b3] - P[a3], ty = P[b3 + 1] - P[a3 + 1], tz = P[b3 + 2] - P[a3 + 2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
        for (let sd2 = -1; sd2 <= 1; sd2 += 2) { pos[v * 3] = P[i * 3]; pos[v * 3 + 1] = P[i * 3 + 1]; pos[v * 3 + 2] = P[i * 3 + 2]; tan[v * 3] = tx; tan[v * 3 + 1] = ty; tan[v * 3 + 2] = tz; uv[v * 2] = sd2; uv[v * 2 + 1] = i * spur.step; ph[v] = 2.3; v++; }
        if (i < n) { const o = v - 2; idx[ii++] = o; idx[ii++] = o + 1; idx[ii++] = o + 2; idx[ii++] = o + 1; idx[ii++] = o + 3; idx[ii++] = o + 2; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
      g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      const tubesMesh = hero.object.getObjectByName('tubes');
      // its own glass, drawn bolder than the bundle's: two bright lines that hold right up to the eye
      const rg = premult(new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true, side: THREE.DoubleSide, defines: { BOLD: 1 } }));
      for (const k in hero.uniforms) rg.uniforms[k] = hero.uniforms[k];
      void tubesMesh;
      const sm = new THREE.Mesh(g, rg); sm.renderOrder = 2; sm.name = 'rivalTube'; atrium.add(sm);
      // brass collars along it, so the strand reads as a tube and not a pair of lines
      const cb = makeB();
      for (let s2 = 9; s2 < len - 4; s2 += (s2 > spur.sAt[0] - 8 && s2 < spur.sAt[64] + 4 ? 6 : 12)) {      // closer together where the rival runs beside us
        const i = Math.min(n - 1, Math.round(s2 / spur.step)), ax2 = new THREE.Vector3(P[i * 3 + 3] - P[i * 3], P[i * 3 + 4] - P[i * 3 + 1], P[i * 3 + 5] - P[i * 3 + 2]).normalize();
        const m = new THREE.Matrix4().compose(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]), new THREE.Quaternion().setFromUnitVectors(_up, ax2), new THREE.Vector3(1, 1, 1));
        cb.add(lathe([[0.5, -0.11], [0.56, -0.08], [0.56, 0.08], [0.5, 0.11]], 14), m, cBrass, ID.BRASS);
      }
      addMesh(atrium, cb.build(), mShop2, 'rivalCollars');
      const rm = shopMat({ uniforms: { uSelf: { value: 0.1 } }, defines: { CAPSULE: 1 } });
      spur.cap = new THREE.Group(); spur.cap.name = 'rival'; spur.cap.visible = false;
      // The runners of this strand are made at the range they are seen (the rack's own capsule is a ten-sided barrel, made for
      // the far end of the basement): a round body, a slimmer barrel between two felt sealing rings of the runner's own colour,
      // rims turned where the brass shader cuts its grooves (y = -0.7 and 0.48), two turned beads for a grip, a caged waist
      // through which the buff roll of paper it carries shows with its green band, a latch and an enamel tally on the cap, a
      // studded felt nose. It keeps the rack capsule's length and greatest radius (y from -1.0 to 1.06, 0.4 m at the felt).
      // Felt takes the runner's colour, so both rings and the nose are one geometry and the brass, the paper and the studs
      // the other. Each rolls about its own axis by the metres it has run along the strand (spur.roll radians a metre, in
      // the frame step below): about a turn in five seconds at the flight's pace; the two fellows start a third of a turn
      // and two thirds of a turn on (2.1 radians each).
      const RS = 24, rb = makeB(), rn = makeB(), paper = C('#dcc79a'), brassHi = cBrass.clone().lerp(cCream, 0.3);
      rb.add(lathe([[0.02, -1.0], [0.3, -1.0], [0.335, -0.975], [0.345, -0.93], [0.345, -0.9]], RS), null, cBrass, ID.BRASS, { jit: 0.06 });
      rb.add(lathe([[0.345, -0.79], [0.345, -0.72], [0.33, -0.7], [0.33, -0.66], [0.345, -0.64], [0.345, -0.62], [0.33, -0.6], [0.33, -0.56], [0.345, -0.54], [0.345, -0.52], [0.33, -0.5], [0.33, -0.44], [0.352, -0.42], [0.352, -0.38], [0.336, -0.36], [0.25, -0.36]], RS), null, cBrass, ID.BRASS, { jit: 0.06 });
      rb.add(lathe([[0.25, 0.28], [0.336, 0.28], [0.352, 0.3], [0.352, 0.34], [0.33, 0.36], [0.33, 0.46], [0.345, 0.5], [0.345, 0.62]], RS), null, cBrass, ID.BRASS, { jit: 0.06 });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; rb.add(box(0.07, 0.66, 0.02), M(Math.cos(a) * 0.337, -0.04, Math.sin(a) * 0.337, -a + Math.PI / 2), cBrass, ID.BRASS, { k: 1.05 }); }
      rb.add(lathe([[0.25, -0.3], [0.25, 0.22]], RS), null, paper, ID.PLAIN, { jit: 0.05 });
      for (const [y0, y1] of [[-0.36, -0.3], [0.22, 0.28]]) rb.add(lathe([[0.25, y0], [0.25, y1]], RS), null, paper, ID.PLAIN, { k: 0.74 });      // the roll goes into shade under either shoulder
      rb.add(lathe([[0.254, 0.04], [0.261, 0.055], [0.261, 0.12], [0.254, 0.135]], RS), null, cValance, ID.CLOTH, { k: 1.5 });
      rb.add(box(0.1, 0.09, 0.03), M(Math.cos(0.6) * 0.338, 0.385, Math.sin(0.6) * 0.338, -0.6 + Math.PI / 2), brassHi, ID.BRASS);      // (both stand clear of the shader's groove at 0.48)
      rb.add(box(0.14, 0.075, 0.014), M(Math.cos(3.0) * 0.334, 0.385, Math.sin(3.0) * 0.334, -3.0 + Math.PI / 2), cCream, ID.PLAIN, { k: 1.1 });
      // three studs on the nose's shoulder, each square to the felt there (the shoulder leans 0.64 radians to the tip) and sunk a few millimetres into it
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rb.add(lathe([[0.056, 0], [0.05, 0.018], [0.03, 0.04], [0.001, 0.045]], 8), M(Math.cos(a) * 0.329, 0.93, Math.sin(a) * 0.329, -a, 1, 1, 1, 0, -Math.PI / 2 + 0.64), brassHi, ID.BRASS); }
      rn.add(lathe([[0.345, -0.9], [0.385, -0.897], [0.4, -0.875], [0.4, -0.815], [0.385, -0.793], [0.345, -0.79]], RS), null, white, ID.CLOTH, { k: 0.9, jit: 0.1 });
      rn.add(lathe([[0.345, 0.62], [0.385, 0.623], [0.4, 0.645], [0.4, 0.7], [0.392, 0.79], [0.36, 0.9], [0.3, 0.98], [0.22, 1.03], [0.12, 1.052], [0.02, 1.06]], RS), null, white, ID.CLOTH, { jit: 0.1 });
      const rivalBodyG = rb.build(), rivalNoseG = rn.build(); spur.roll = 0.05;
      addMesh(spur.cap, rivalBodyG, rm, 'rivalBody'); addMesh(spur.cap, rivalNoseG, rm, 'rivalNose');
      spur.cap.scale.setScalar(1.0); atrium.add(spur.cap);
      // two more runners strung along the same strand ahead of it, bottle green and pale blue
      spur.xBody = new THREE.InstancedMesh(rivalBodyG, rm, 2); spur.xNose = new THREE.InstancedMesh(rivalNoseG, rm, 2);
      for (const [im, nm] of [[spur.xBody, 'rivalsAheadBody'], [spur.xNose, 'rivalsAheadNose']]) { im.name = nm; im.frustumCulled = false; im.visible = false; for (let i = 0; i < 2; i++) { im.setMatrixAt(i, new THREE.Matrix4()); im.setColorAt(i, im === spur.xNose ? noseCols[i + 1] : white); } im.instanceColor.needsUpdate = true; atrium.add(im); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the capsule we ride
    const capU = { uSkyC: { value: U.uSkyC.value.clone() }, uGndC: { value: U.uGndC.value.clone() }, uSelf: { value: 0 } };
    const myCap = new THREE.Group(); myCap.name = 'ourCapsule'; myCap.matrixAutoUpdate = false; scene.add(myCap);
    const myNose = new THREE.Group(), capInner = new THREE.Group();
    {
      // lathe axis +y = the way we fly. From the eye back: plain barrel, a turned rim, the milled cap, the felt nose with its studs.
      const capMat = shopMat({ uniforms: capU, defines: { CAPSULE: 1 } });
      capInner.rotation.x = -Math.PI / 2; capInner.position.set(0, 0, 0.26); myCap.add(capInner);
      const b = makeB(), hi = cBrass.clone().lerp(cCream, 0.3), lo = cBrass.clone().multiplyScalar(0.55);
      b.add(lathe([[0.3, -0.9], [0.3, 0.46], [0.306, 0.49], [0.322, 0.52], [0.332, 0.56], [0.332, 0.6], [0.32, 0.625], [0.312, 0.64], [0.32, 0.655], [0.332, 0.68], [0.332, 0.71], [0.318, 0.74], [0.306, 0.75],
        [0.306, 0.93], [0.318, 0.94], [0.328, 0.96], [0.328, 1.0], [0.316, 1.025], [0.3, 1.03]], 40), null, cBrass, ID.BRASS, { jit: 0.06 });
      for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU; b.add(box(0.014, 0.16, 0.01), M(Math.cos(a) * 0.308, 0.84, Math.sin(a) * 0.308, -a + Math.PI / 2), cBrass, ID.BRASS, { k: i % 2 ? 1.12 : 0.8 }); }
      addMesh(capInner, b.build(), capMat, 'ourCapsuleBody');
      const nb2 = makeB(), nc = noseCols[noseI].clone().multiplyScalar(1.7);      // (lit a little above its felt, so the one hot colour reads at this size)
      nb2.add(lathe([[0.3, 1.03], [0.385, 1.05], [0.41, 1.1], [0.41, 1.17], [0.385, 1.26], [0.33, 1.35], [0.25, 1.42], [0.16, 1.47], [0.08, 1.495], [0.01, 1.5]], 28), null, nc, ID.CLOTH, { jit: 0.1 });      // a fat felt bumper, wider than the barrel, so it shows from behind as well
      nb2.add(lathe([[0.302, 1.0], [0.36, 1.015], [0.385, 1.05]], 28), null, nc, ID.CLOTH, { k: 0.78 });
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; nb2.add(lathe([[0.001, 0.045], [0.03, 0.04], [0.05, 0.018], [0.056, 0]], 10), M(Math.cos(a) * 0.405, 1.14, Math.sin(a) * 0.405, -a, 1, 1, 1, 0, -Math.PI / 2), hi, ID.BRASS); }
      addMesh(myNose, nb2.build(), capMat, 'ourCapsuleNose'); capInner.add(myNose);
    }
    // ---------------------------------------------------------------- the well our tube rises through
    // Between the basement vault and the shop floor the opening is lined: splayed brick reveals that widen toward the
    // floor, a timber trimmer with joist ends under the boards, and a brass kerb round the opening on the shop floor.
    // Lit by the basement's warm light below and brighter toward the top, where the dome's light spills in.
    {
      const b = makeB(), brick = C('#93604c'), timber = C('#8a5a2b'), NA = 10, ring = (r) => {
        const ax0 = slot.x, az0 = slot.y, dx0 = slot.z - slot.x, dz0 = slot.w - slot.y, l = Math.hypot(dx0, dz0) || 1, dx = dx0 / l, dz = dz0 / l, nx = -dz, nz = dx;
        const ex = [[ax0 + dx0 * 1.15, az0 + dz0 * 1.15, 1], [ax0 - dx0 * 0.5, az0 - dz0 * 0.5, -1]], out = [];
        for (const [cx, cz, sg] of ex) for (let i = 0; i <= NA; i++) { const t = -Math.PI / 2 + Math.PI * i / NA, c = Math.cos(t) * sg, sn = Math.sin(t) * sg; out.push([cx + r * (dx * c + nx * sn), cz + r * (dz * c + nz * sn)]); }
        return out;
      };
      const band = (r0, y0, r1, y1, col, id, k0, k1) => {            // a smooth strip between two outlines, shaded lighter toward the top
        const A0 = ring(r0), A1 = ring(r1), n = A0.length, steps = Math.max(1, Math.round(Math.abs(y1 - y0) / 0.7)), pos = [], idx = [];
        for (let sI = 0; sI <= steps; sI++) { const f = sI / steps; for (let i = 0; i <= n; i++) { const q = i % n; pos.push(lerp(A0[q][0], A1[q][0], f), lerp(y0, y1, f), lerp(A0[q][1], A1[q][1], f)); } }
        for (let sI = 0; sI < steps; sI++) for (let i = 0; i < n; i++) { const o = sI * (n + 1) + i; idx.push(o + 1, o, o + n + 1, o + 1, o + n + 1, o + n + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        b.add(g, null, col, id, { grad: [y0, y1, k0, k1] });
      };
      band(3.1, -2.6, 4.15, -0.62, brick, ID.BRICK, 0.8, 1.05);
      band(3.1, -2.6, 3.5, -2.599, brick, ID.BRICK, 0.7, 0.7);          // the kerb that hangs below the vault is a solid ring of brick, not a skin
      band(3.5, -2.6, 3.5, -0.9, brick, ID.BRICK, 0.8, 0.9);
      band(4.15, -0.62, 4.22, -0.5, timber, ID.WOOD, 0.9, 0.9);          // a wall plate
      band(4.22, -0.5, 4.36, 0.0, timber, ID.WOOD, 1.1, 1.25);            // the trimmer under the boards
      { const R = ring(4.2), n = R.length;                            // joist ends let into the trimmer
        for (let i = 0; i < n; i++) { const j = (i + 1) % n, len = Math.hypot(R[j][0] - R[i][0], R[j][1] - R[i][1]), m = Math.max(1, Math.round(len / 1.1));
          for (let k = 0; k < m; k++) { const f = (k + 0.5) / m, x = lerp(R[i][0], R[j][0], f), z = lerp(R[i][1], R[j][1], f); b.add(box(0.34, 0.36, 0.3), M(x, -0.28, z, Math.atan2(R[j][0] - R[i][0], R[j][1] - R[i][1]) + Math.PI / 2), timber, ID.WOOD, { k: 0.85 }); } } }
      b.quad([-200, -15.3, 200], [200, -15.3, 200], [200, -15.3, -200], [-200, -15.3, -200], new THREE.Color(0.06, 0.035, 0.02), ID.GLOW);   // seen down the well once the basement is put away
      addMesh(atrium, b.build(), mBase2, 'floorWell');
      const R0 = ring(4.36), R1 = ring(4.75), n = R0.length;           // the brass kerb
      for (let i = 0; i < n; i++) { const j = (i + 1) % n;
        propsB.quad([R0[i][0], 0.22, R0[i][1]], [R0[j][0], 0.22, R0[j][1]], [R1[j][0], 0.22, R1[j][1]], [R1[i][0], 0.22, R1[i][1]], cBrass, ID.BRASS);
        propsB.quad([R0[j][0], 0.0, R0[j][1]], [R0[i][0], 0.0, R0[i][1]], [R0[i][0], 0.22, R0[i][1]], [R0[j][0], 0.22, R0[j][1]], cBrass, ID.BRASS, 0.8);
        propsB.quad([R1[i][0], 0.0, R1[i][1]], [R1[j][0], 0.0, R1[j][1]], [R1[j][0], 0.22, R1[j][1]], [R1[i][0], 0.22, R1[i][1]], cBrass, ID.BRASS, 0.9); }
    }
    await ctx.yield();
    addMesh(atrium, propsB.build(), mShop2, 'atriumProps');
    await ctx.yield();

    // ---------------------------------------------------------------- frame
    const camP = new THREE.Vector3(), pp = new THREE.Vector3(), pt = new THREE.Vector3(), rt = new THREE.Vector3(), upv = new THREE.Vector3();
    const m4 = new THREE.Matrix4(), m5 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), qR = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Matrix4().makeScale(0, 0, 0), ax = new THREE.Vector3();
    const ss = smoothstep, keyBase = keyL.intensity, heroKids = hero.object.children.slice();
    let uA = 0.15, uB = 0.2, uG = 0.17;
    { const p = new THREE.Vector3(); let a = null, b = null, g = null; for (let i = 0; i <= 400; i++) { const u = 0.1 + 0.14 * i / 400; path.pointAt(toNew(u), p); if (a === null && p.y > -5.9) a = u; if (g === null && p.y > -2.0) g = u; if (b === null && p.y > -1.2) { b = u; break; } } if (a !== null) uA = a; if (b !== null) uB = b; if (g !== null) uG = g; }
    // the building's frame shows as soon as the ramp begins (it is seen up the well); the goods on the counters join just
    // before the eye clears the floor, and the dispatch room is put away as it does, so the three are never all drawn at once
    const lateNames = new Set(['columns', 'bays', 'balustrades', 'bunting']), goodsNames = new Set(['hatboxes', 'bolts', 'gloves', 'parasols', 'tills', 'chairs', 'drawers', 'hats', 'lids', 'palms', 'ferns', 'cashBalls']);
    const late = atrium.children.filter((o) => lateNames.has(o.name)), lateGoods = atrium.children.filter((o) => goodsNames.has(o.name));
    const liftY = (L, u, t) => {
      let y = (L.top - 9.5) * (0.5 + 0.5 * Math.sin(t * 0.21 + L.ph));
      if (L === liftB) y = lerp(1.0, y, ss(0.2, 0.27, u));           // it waits at the foot of its shaft while we come up beside it, so the dome is seen whole past the shaft
      for (const ps of L.passes) { const w = ss(ps.u - 0.075, ps.u - 0.04, u) * (1 - ss(ps.u + 0.035, ps.u + 0.07, u)); if (w > 0) y = lerp(y, clamp(ps.y - 6.2 + (u - ps.u) * 70, 0, L.top - 9.5), w); }
      return y;
    };
    const gazeWide = new THREE.Vector3(-26, 55, 7);      // the frame to remember: down the length of the well from the long side
    const gazePoi = new THREE.Vector3(), gazeNest = new THREE.Vector3(0, 67, 0), gazeBridge = A.portalSeat.position.clone().add(new THREE.Vector3(2, -6, -3));
    const gazeLift = new THREE.Vector3(), gazeMast = new THREE.Vector3(0, 25, 0), gazeHall = new THREE.Vector3(0, 52, 0);
    const hornPoi = A.portalSeat.position.clone(), liftPoi = new THREE.Vector3(), passA = liftA.passes[0] ? liftA.passes[0].u : 0.267;
    const pB = clamp(liftB.passes[0] ? liftB.passes[0].u : 0.36, 0.33, 0.425);
    const heroKey = hero.uniforms.uKey.value.clone(), heroAmb = hero.uniforms.uAmb.value.clone(), skyBase = U.uSkyC.value.clone(), gndBase = U.uGndC.value.clone(), capDim = C('#9fb6c4').multiplyScalar(1.3);
    const update = (dt, t, camera, uN) => {
      const u = toOld(uN);
      time.value = t; U.uTime.value = t;
      U.uCk.value.z = 0.92 + 0.08 * Math.sin(t * 0.63) + 0.04 * Math.sin(t * 0.27 + 1.3);
      U.uCk.value.x = 0.03 * Math.sin(t * 0.21) + 0.012 * Math.sin(t * 0.47 + 1.0); U.uCk.value.y = 0.026 * Math.sin(t * 0.17 + 2.0);
      const up = ss(0.126, 0.16, u), below = u < 0.105;
      brFade.value = 1 - ss(0.15, 0.19, uN);
      scene.fog.color.copy(fogDark).lerp(fogPale, up); scene.fog.density = lerp(0.0052, LK.fogD, up); scene.background.copy(scene.fog.color);
      hero.uniforms.uKey.value.copy(heroKey).multiplyScalar(lerp(0.22, 1, up)); hero.uniforms.uAmb.value.copy(heroAmb).multiplyScalar(lerp(0.3, 1, up));
      hemi.intensity = lerp(0.65, 1, up); keyL.intensity = lerp(0.5, keyBase, up);
      capU.uSkyC.value.copy(capDim).lerp(skyBase, up); capU.uGndC.value.copy(capDim).multiplyScalar(0.6).lerp(gndBase, up); capU.uSelf.value = 0.1 * (1 - up);
      atrium.visible = !below; basement.visible = u < uB; rack.mesh.visible = u < uB;
      const hi = u >= uA - 0.04, hiG = u >= uG; for (let i = 0; i < late.length; i++) late[i].visible = hi; for (let i = 0; i < lateGoods.length; i++) lateGoods[i].visible = hiG;      // (the frame is already there when the well first shows in the vault)
      for (let i = 0; i < heroKids.length; i++) { const k = heroKids[i]; k.visible = !below || k.name === 'ourTube' || k.name === 'ourCollars'; }
      hero.setProgress(u); hero.setVolley(rare ? ss(0.5, 0.555, u) : 0); hero.update(dt, t, camera);
      dust.update(dt, t, camera); rays.update(dt, t); if (petals) { petals.update(dt, t, camera); petals.setOpacity(up); }
      pair.update(dt, t, camera, uN);
      const gone = u > BURST_U; burst.object.visible = gone; roost.visible = !gone;
      burst.update(dt, Math.min(Math.max(0, u - BURST_U) * DUR * 1.15, BURST_T), camera);
      silkUn.value.set(ss(0.405, 0.475, u), ss(0.415, 0.485, u), ss(0.425, 0.5, u));
      // lifts and counterweights
      for (const L of [liftA, liftB]) { const y = liftY(L, u, t); L.cage.position.y = y; L.cw.position.y = L.top - 5 - y; }
      if (!below) {
        for (let i = 0; i < tills.length; i++) {
          const tl = tills[i], ph = (((t * 0.9 - tl.ph * 0.42) % 6) + 6) % 6, o = ss(0, 0.12, ph) * (1 - ss(1.4, 2.6, ph)) * 0.6;
          drawerIM.setMatrixAt(i, m4.makeRotationY(tl.ry).setPosition(tl.x + Math.sin(tl.ry) * o, tl.y, tl.z + Math.cos(tl.ry) * o));
        }
        drawerIM.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < hats.length; i++) { const h = hats[i], hs = h.s || 1.3; hatIM.setMatrixAt(i, m4.makeRotationY(h.ry + t * h.w).scale(pp.set(hs, hs, hs)).setPosition(h.x, h.y, h.z)); }
        for (let i = 0; i < pyr.lids.length; i++) {               // lids lift, tip and settle by themselves, one after another
          const l = pyr.lids[i], ph = (((t * 0.55 + l.ph) % 7) + 7) % 7, o = ss(0, 0.7, ph) * (1 - ss(2.4, 3.6, ph));
          lidIM.setMatrixAt(i, m4.makeRotationY(l.ry).multiply(m5.makeRotationZ(0.55 * o)).scale(pp.set(1.2, 1.2, 1.2)).setPosition(l.x, l.y + 0.9 * o, l.z));
        }
        lidIM.instanceMatrix.needsUpdate = true;
        hatIM.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < balls.length; i++) {
          const bl = balls[i], th = bl.th0 + bl.w * t, e = ellF(th, 3.4);
          q4.setFromAxisAngle(ax.set(e.nx, 0, e.nz), -th * 120);
          balls.im.setMatrixAt(i, m4.compose(pp.set(e.x, cashY(bl.t, th) + 0.42, e.z), q4, one));
        }
        balls.im.instanceMatrix.needsUpdate = true;
      }
      if (basement.visible) {
        const tl = cat.userData.tail; tl.rotation.z = 0.22 * Math.sin(t * 1.4) + 0.08 * Math.sin(t * 3.7); tl.rotation.x = 0.12 * Math.sin(t * 0.9);
        for (let i = 0; i < parcels.length; i++) {
          const pc = parcels[i], f = (t * 0.16 + pc.ph) % 1, sc = ss(0, 0.06, f) * (1 - ss(0.93, 1, f));
          m4.makeRotationZ(0.72).multiply(m5.makeRotationY(pc.ry)).scale(pp.set(sc, sc, sc)).setPosition(18.6 - f * 8.4 - 0.08, -5.0 - f * 7.35 + 0.1, 24 + pc.dz);
          parcels.im.setMatrixAt(i, m4);
        }
        parcels.im.instanceMatrix.needsUpdate = true;
        const sCam = BZ1 - LEAD + uN * path.length;
        for (let i = 0; i < rackCaps.length; i++) {
          const c = rackCaps[i], tab = c.tab; let s;
          if (i === 0) s = sCam + lerp(-30, 60, ss(0.09, 0.135, u)); else if (i === 1) s = sCam + lerp(32, -45, ss(0.092, 0.14, u)); else if (i === 2) s = below ? uN * path.length + lerp(7.5, 26, ss(0.095, 0.125, u)) : -1;   // (the hero's own white-nosed rival takes over as the well opens)
          else s = (c.off + c.speed * t) % tab.len;
          if (s < 1 || s > tab.len - 1) { rackCaps.body.setMatrixAt(i, zero); rackCaps.nose.setMatrixAt(i, zero); continue; }
          sampleTab(tab, s, pp, pt); pp.applyMatrix4(bInv); pt.transformDirection(bInv);
          m4.compose(pp, q4.setFromUnitVectors(_up, pt), one); rackCaps.body.setMatrixAt(i, m4); rackCaps.nose.setMatrixAt(i, m4);
        }
        rackCaps.body.instanceMatrix.needsUpdate = true; rackCaps.nose.instanceMatrix.needsUpdate = true;
      }
      camP.setFromMatrixPosition(camera.matrixWorld);
      // the rival on its strand: found where the wanted bearing from the eye's own gaze meets the tube, so it is in the picture
      // for the ordinary and the steady camera alike (right of centre as it draws level, left as it edges ahead)
      const rOn = u > spur.u0 + 0.008 && u < spur.u1 - 0.004; spur.cap.visible = rOn;
      if (rOn) {
        const ce = camera.matrixWorld.elements, fl = Math.hypot(ce[8], ce[10]) || 1, fx = -ce[8] / fl, fz = -ce[10] / fl;
        const want = (60 - 34 * ss(0.462, 0.478, u) + 8 * ss(0.5, 0.53, u) - 20 * ss(0.574, 0.6, u) - 26 * ss(0.6, 0.625, u) + 20 * ss(0.63, 0.652, u) + 60 * ss(0.655, 0.685, u)) * DEG;
        const kf = clamp((u - spur.u0) / (spur.u1 - spur.u0), 0, 1) * 64, k0 = Math.min(63, Math.floor(kf)), sCam = lerp(spur.sAt[k0], spur.sAt[k0 + 1], kf - k0);
        let sR = -1, prevB = 9, P = spur.p;
        for (let s2 = Math.max(20, sCam - 14); s2 <= Math.min(spur.len - 12, sCam + 30); s2 += 0.5) {
          const i = Math.min(spur.n, Math.round(s2 / spur.step)) * 3, dx = P[i] - camP.x, dz = P[i + 2] - camP.z;
          const b = Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);
          if (b <= want && prevB > want) { sR = s2 - 0.5 * (want - b) / Math.max(prevB - b, 1e-4) * (prevB < 8 ? 1 : 0); break; }
          prevB = b;
        }
        if (sR < 0) spur.cap.visible = false;
        else {
          const f = clamp(sR / spur.step, 0, spur.n - 1e-3), i = Math.floor(f), tt = f - i, k = i * 3;
          spur.cap.position.set(lerp(P[k], P[k + 3], tt), lerp(P[k + 1], P[k + 4], tt), lerp(P[k + 2], P[k + 5], tt));
          spur.cap.quaternion.setFromUnitVectors(_up, ax.set(P[k + 3] - P[k], P[k + 4] - P[k + 1], P[k + 5] - P[k + 2]).normalize()).multiply(qR.setFromAxisAngle(_up, sR * spur.roll));
        }
        let sLast = sR;
        for (let j = 0; j < 2; j++) {                              // the two others: found the same way, further round to the right (they are falling back along the strand)
          const w2 = want + (j ? 31 : 16) * DEG; let s3 = -1, pb = 9;
          for (let s2 = Math.max(20, sCam - 46); s2 <= Math.min(spur.len - 12, sCam + 30); s2 += 0.5) {
            const i = Math.min(spur.n, Math.round(s2 / spur.step)) * 3, dx = P[i] - camP.x, dz = P[i + 2] - camP.z, b = Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);
            if (b <= w2 && pb > w2 && pb < 8) { s3 = s2; break; }
            pb = b;
          }
          if (sR >= 0) s3 = Math.min(s3 < 0 ? 1e9 : s3, sLast - 8);       // never bunched: at least four lengths between runners
          if (s3 < 20) { spur.xBody.setMatrixAt(j, zero); spur.xNose.setMatrixAt(j, zero); continue; }
          sLast = s3;
          const f = clamp(s3 / spur.step, 0, spur.n - 1e-3), i = Math.floor(f), tt = f - i, k = i * 3;
          m4.compose(pp.set(lerp(P[k], P[k + 3], tt), lerp(P[k + 1], P[k + 4], tt), lerp(P[k + 2], P[k + 5], tt)), q4.setFromUnitVectors(_up, ax.set(P[k + 3] - P[k], P[k + 4] - P[k + 1], P[k + 5] - P[k + 2]).normalize()).multiply(qR.setFromAxisAngle(_up, s3 * spur.roll + 2.1 * (j + 1))), one);
          spur.xBody.setMatrixAt(j, m4); spur.xNose.setMatrixAt(j, m4);
        }
        spur.xBody.instanceMatrix.needsUpdate = true; spur.xNose.instanceMatrix.needsUpdate = true;
      }
      spur.xBody.visible = rOn; spur.xNose.visible = rOn;
      // our capsule: on the tube's axis under the eye, nose turning with the distance flown
      path.pointAt(uN, pp); path.tangentAt(uN, pt);
      // It rides low in the picture, whole and small: placed from the eye (so it keeps its place whichever way the gaze turns)
      // but pointing the way the tube runs, so that looking into the well we see it from the side, red nose leading.
      const riding = !ctx.through;
      myCap.visible = riding;
      if (riding) {
        const ce = camera.matrixWorld.elements, T = 1 / Math.max(0.3, camera.projectionMatrix.elements[5]);
        const CS = 0.105, dc = 1.15, hc = 0.9 * T * dc, tr = 0.0012 * Math.sin(t * 37) + 0.0009 * Math.sin(t * 23.3);
        pp.set(camP.x - ce[8] * dc - ce[4] * (hc + tr), camP.y - ce[9] * dc - ce[5] * (hc + tr), camP.z - ce[10] * dc - ce[6] * (hc + tr));
        // the axis: the tube's own direction, lifted a little toward the eye's up so the nose shows over the rim from behind
        ax.set(pt.x + 0.2 * ce[4], pt.y + 0.2 * ce[5], pt.z + 0.2 * ce[6]).normalize();
        pt.copy(ax).negate();                                     // z: back along the axis (capInner turns the lathe's +y onto -z)
        rt.set(ce[4], ce[5], ce[6]).cross(pt); if (rt.lengthSq() < 1e-6) rt.set(ce[0], ce[1], ce[2]); rt.normalize();
        upv.crossVectors(pt, rt);
        myCap.matrix.makeBasis(rt, upv, pt).scale(_s.set(CS, CS, CS)).setPosition(pp);
        myCap.matrixWorldNeedsUpdate = true;
        myNose.rotation.y = u * path.length * 0.35 + t * 0.6;
      }
    };
    return {
      scene, path, duration: DUR,
      pace(uN) { const u = toOld(uN); return 1.1 - 0.22 * (1 - ss(0.1, 0.125, u)) - 0.25 * ss(0.14, 0.16, u) * (1 - ss(0.2, 0.235, u)) - 0.38 * ss(0.5, 0.57, u) + 0.38 * ss(0.66, 0.72, u) - 0.22 * ss(0.82, 0.87, u) + 0.12 * ss(0.9, 0.95, u); },
      camera: { fov: 70, near: 0.12, far: 900, lookAhead: 16, sway: 0, bank: 0.12 },
      pois: [
        // coming up through the floor the eye goes straight to the dome and the nest hanging under it
        { at: new THREE.Vector3(0, 74, 0), from: toNew(0.118), to: toNew(0.238), weight: 0.85, fade: 0.25 },
        // the first lap looks into the well, not along the shelf: lift A as we round the first end, lift B slim across the
        // floor and then beside us, then the silk falling
        { at: (t, uN) => {
          const u = toOld(uN);
          // the milliner's tree close on the right as we round the first end, lift A whole in the well, the mast and its pendulum, then lift B: far, near, beside us
          gazeLift.set(pyr.x, 17.2, pyr.z).lerp(liftPoi.set(liftA.pos.x, Math.max(liftA.cage.position.y + 6, 22), liftA.pos.z), ss(0.254, 0.28, u)).lerp(gazeMast, ss(0.29, 0.318, u));
          gazeLift.lerp(liftPoi.set(liftB.pos.x, Math.max(liftB.cage.position.y + 4.2, 24), liftB.pos.z), ss(0.336, 0.362, u));
          return gazeLift.lerp(gazeHall, ss(0.42, 0.45, u));
        }, from: toNew(0.2), to: toNew(0.565), weight: 0.8, fade: 0.13 },
        // one gaze for the last half: the nest on the long sweep, then the horn's mouth, held (a little under it, so the
        // dial sits below) across the bridge and round the rope, and squarely on it for the run-in
        { at: (t, uN) => { const u = toOld(uN); return gazePoi.copy(gazeNest).lerp(gazeWide, ss(0.612, 0.64, u) * (1 - ss(0.66, 0.688, u))).lerp(hornPoi, ss(0.7, 0.765, u)).lerp(gazeBridge, ss(0.745, 0.79, u) * (1 - ss(0.81, 0.85, u))); }, from: toNew(0.515), to: toNew(0.995), weight: 0.8, fade: 0.1 },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#ffe3b4', glow: 0.5, tilt: true, revealDistance: 180 },
      post: { exposure: 1.1, bloom: { strength: 0.16, radius: 0.5, threshold: 1.2 },
        grade: { saturation: LK.sat || 1.06, contrast: 1.09, tint: LK.tint, shadowTint: '#0c1622', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { cookie.dispose(); },
    };
  },
};
