// THE GILDED MARGIN: a bee-sized flight across a page of an illuminated manuscript.
//
// The page is the terrain (1 mm reads as 1 m): x 0 (gutter) .. 500 (fore-edge), z 0 (head) .. 720 (foot). Text
// stands up off it as rows of ink minims; the right margin (x 340-460) is full of growing vines and jointed
// paper creatures; a border of sliding wave scallops runs along z 600-620; the Great Initial (src/parts) stands
// at x 120, z 500 facing east toward the one candle, with the facing leaf curling up behind it as a cream wall.
// Everything is flat self-lit pigment in custom shaders (style: 'none'); only gold answers the flame. Every
// standing thing throws a planar fake shadow (same geometry, projected along the candle direction in the vertex
// shader, min-blended so overlaps do not darken twice), and the shadows sway with the flame.
//
// Variations by seed / ctx.vary: hour (candle-lit night, cloister-window morning with a crawling sunbeam, rose
// dawn with a guttering, smoking candle), season of the book of hours (spring, August, autumn, winter flora and
// ground), cast swaps (snail joust | fox preaching to geese | monkey musicians, hound and hare | cat and mouse, dragon | fighting
// cocks, cog ship | swan), a draught that lifts the fore-edge, and the rare event: inky cat paw-prints.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero } from '../parts/gilded-margin.js';

const TAU = Math.PI * 2;
const PALETTE = ['#EADBB8', '#CDB98C', '#1F3F9A', '#2F7D5B', '#C7361F', '#3B2A1A', '#E8B33A'];
const BEE = true;                         // camera dressing: antennae and wing blur
const HERO_X = 120, HERO_Z = 500;
const INK_X = 372;                        // the quill's line runs down the margin at about this x

// static part of the page height; must match pageH() in G_COMMON with uTime = 0, uGust = 0 away from the fore-edge
function pageH0(x, z) {
  let h = 1.1 * Math.sin(x * 0.023 + 1.3) * Math.sin(z * 0.019 + 0.4) + 0.5 * Math.sin(x * 0.051 + z * 0.037 + 2.0);
  const n = smoothstep(55, 0, z); h += 5 * n * n;
  const e = smoothstep(430, 505, x); h += e * e * 2.5;
  return h;
}

// ---------------------------------------------------------------- GLSL shared by every material
const G_COMMON = /* glsl */`
uniform float uTime, uGust, uU, uCandleI, uFlare;
uniform vec3 uCandleDir, uCandleCol, uShadowCol, uSepia, uWhite, uPaint, uGold;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float pageH(vec2 p){
  float h = 1.1 * sin(p.x * 0.023 + 1.3) * sin(p.y * 0.019 + 0.4) + 0.5 * sin(p.x * 0.051 + p.y * 0.037 + 2.0);
  float n = smoothstep(55.0, 0.0, p.y); h += 5.0 * n * n;
  float e = smoothstep(430.0, 505.0, p.x);
  h += e * e * (2.5 + 1.8 * sin(uTime * 0.6 + p.y * 0.012) + uGust * (6.0 + 3.0 * sin(p.y * 0.02 + uTime * 1.7)));
  return h;
}
float ink(float edge, float d, float px){ return 1.0 - smoothstep(edge - px, edge + px, d); }
`;
const G_VPARS = G_COMMON + /* glsl */`
#include <fog_pars_vertex>
`;
// expects `vec4 w` = world position; projects to the page when the material is a shadow
const G_VEND = /* glsl */`
#ifdef SHADOW
  { float ly = max(uCandleDir.y, 0.2); vec2 g = w.xz - uCandleDir.xz * (max(w.y - pageH(w.xz), 0.0) / ly);
    w.xyz = vec3(g.x, pageH(g) + 0.16, g.y); }
#endif
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;
const G_FPARS = G_COMMON + /* glsl */`
#include <fog_pars_fragment>
// gold leaf: dull ochre under the dark room, a mirror for the candle, tooled with punch-dots
vec3 goldLeaf(vec3 N, vec3 V, vec2 uv, float flare){
  vec2 q = uv; q.x += 0.5 * mod(floor(q.y), 2.0); vec2 id = floor(q), f = fract(q) - 0.5; float r = length(f);
  float dim = smoothstep(0.36, 0.30, r);
  vec3 N2 = normalize(N + vec3(f.x, f.y, -f.x) * dim * 1.3 + 0.05 * vec3(sin(uv.x * 0.9 + uv.y * 0.4), sin(uv.y * 1.3), 0.0));
  vec3 R = reflect(-V, N2);
  vec3 col = uGold * vec3(1.0, 0.86, 0.9) * (0.27 + 0.2 * smoothstep(0.25, -0.6, R.y));
  col *= 1.0 - 0.35 * dim * smoothstep(0.08, 0.3, r);
  float c = max(dot(R, uCandleDir), 0.0);
  col += vec3(1.0, 0.74, 0.32) * uCandleCol * uCandleI * (smoothstep(0.95, 0.997, c) * 3.5 + c * c * c * c * c * c * 0.4);
  float h = hash(id + 3.0), tw = pow(max(0.0, sin(uTime * (2.5 + 5.0 * h) + h * 50.0)), 16.0);
  col += vec3(1.0, 0.5, 0.08) * flare * (0.35 + 0.9 * max(dot(N, V), 0.0)) + vec3(1.0, 0.9, 0.6) * flare * dim * tw * 5.0;
  return col;
}
`;
const G_SHADOW = /* glsl */`
#ifdef SHADOW
  { gl_FragColor = vec4(uShadowCol, 1.0);
  #include <fog_fragment>
  }
  return;
#endif
`;
// far pigment pales and greys toward the haze faster than the page does: a cheap stand-in for a miniature's shallow focus
const G_FEND = /* glsl */`
  #ifdef USE_FOG
  { float mh = smoothstep(100.0, 320.0, vFogDepth) * 0.6; float ml = dot(gl_FragColor.rgb, vec3(0.3, 0.6, 0.1));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(ml), fogColor, 0.55), mh); }
  #endif
  #include <fog_fragment>
`;

// ---------------------------------------------------------------- vellum (page + curled facing leaf)
const VELLUM_VS = /* glsl */`
varying vec2 vQ; varying vec3 vW; varying float vWall;
void main(){
  float s = position.x, z = position.z; vec3 P;
  if (s >= 0.0) { P = vec3(s, pageH(vec2(s, z)), z); vWall = 0.0; }
  else {
    float R = 70.0, th = min(-s / R, 1.5708), ext = max(-s - R * 1.5708, 0.0);
    P = vec3(-R * sin(th) + 2.5 * sin(z * 0.021 + ext * 0.017) * smoothstep(0.0, 60.0, ext), R * (1.0 - cos(th)) + ext + pageH(vec2(0.0, z)), z);
    vWall = th / 1.5708;
  }
  vQ = vec2(s, z); vW = P; vec4 w = vec4(P, 1.0);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VELLUM_FS = /* glsl */`
uniform vec3 uVellum, uLapis, uVerm, uVine, uPageTint, uBeamCol;
uniform vec4 uInk, uBeam, uPaw[6];
uniform float uSeason, uBlockFlare, uHeroXZ, uBarG;
varying vec2 vQ; varying vec3 vW; varying float vWall;
float lineAA(float d, float w, float px){ float ww = max(w, px * 0.7); return (1.0 - smoothstep(ww - px, ww + px, d)) * clamp(w / max(px * 0.7, 1e-4), 0.35, 1.0); }
// a painted bar: gold leaf and pigment, counter-changed along its length, with gold lozenge nodes at the joints
// d = signed offset across the bar (m), al = metres along it
vec3 barPaint(vec3 col, float d, float al, float px, vec3 gcol, float amt){
  float bd = abs(d), seg = floor(al / 16.0), jd = abs(al - seg * 16.0 - 8.0), odd = mod(seg, 2.0);
  float isGold = abs(step(0.0, d) - odd);
  vec3 pc = mod(seg, 4.0) < 1.5 ? uLapis * 1.3 : uVerm;
  pc = mix(pc, uWhite, ink(0.2, length(vec2(bd - 0.64, mod(al, 1.5) - 0.75)), px) * step(fract(al / 6.0), 0.75));
  vec3 bc = mix(pc, gcol, isGold);
  bc = mix(bc, uSepia, max(lineAA(bd, 0.07, px), smoothstep(1.12 - px, 1.12 + px, bd)));
  col = mix(col, bc, (1.0 - smoothstep(1.3 - px, 1.3 + px, bd)) * amt);
  float lz = bd + (8.0 - jd) * 0.75 - 2.5;
  col = mix(col, gcol, ink(0.0, lz, px) * amt);
  col = mix(col, uSepia, lineAA(abs(lz), 0.1, px) * amt);
  col = mix(col, uVerm, ink(0.5, length(vec2(bd, 8.0 - jd)), px) * amt);
  return col;
}
// pen spraywork beside a bar: hairline curls that end in a gold bezant and a three-lobed ivy leaf
// ox = distance from the bar (m), al = metres along it
vec3 spray(vec3 col, float ox, float al, float reach, float px, vec3 gcol, float seed, float amt){
  float fade = (1.0 - smoothstep(reach - 5.0, reach, ox)) * amt * (1.0 - 0.7 * smoothstep(0.45, 1.5, px));
  float sw = ox + 1.3 * sin(al * 0.33 + seed) + 1.2 * sin(al * 0.11 + 2.0 + seed);
  col = mix(col, uSepia, lineAA(abs(mod(sw, 9.0) - 4.5), 0.08, px) * 0.6 * fade * step(ox, 26.0));
  vec2 c = vec2(ox, al) / 9.0; c.y += 0.5 * mod(floor(c.x), 2.0);
  vec2 id = floor(c) + seed * 13.0, f = fract(c) - 0.5;
  float h = hash(id), h2 = hash(id + 17.3);
  if (h2 < mix(0.86, 0.5, smoothstep(4.0, 40.0, ox))) {
    vec2 d = (f - (vec2(h, hash(id + 5.7)) - 0.5) * 0.2) * 9.0; float r = length(d), th = -h * 6.2832, rr = 2.2 + 1.1 * h2;
    float a = atan(d.y, d.x + 1e-5) - th;
    col = mix(col, uSepia, lineAA(abs(r - rr), 0.09, px) * step(cos(a), 0.697) * 0.85 * fade);
    vec2 e1 = rr * vec2(cos(th + 0.8), sin(th + 0.8)), e2 = rr * vec2(cos(th - 0.8), sin(th - 0.8));
    float db = length(d - e1);
    col = mix(col, gcol, ink(1.0, db, px) * fade);
    col = mix(col, uSepia, lineAA(abs(db - 1.0), 0.1, px) * fade);
    vec2 t = d - e2; float tr = length(t), ta = atan(t.y, t.x + 1e-5) - th, lobe = tr - 1.5 * (0.6 + 0.4 * cos(3.0 * ta));
    float hc = hash(id + 2.9);
    vec3 tc = hc < 0.4 ? uLapis * 1.3 : (hc < 0.75 ? uVerm : uVine);
    col = mix(col, tc * mix(0.7, 1.0, step(0.0, sin(ta))), ink(0.0, lobe, px) * fade);
    col = mix(col, uSepia, lineAA(abs(lobe), 0.09, px) * fade);
    col = mix(col, uWhite, ink(0.2, tr, px) * fade);
  }
  return col;
}
void main(){
  vec2 q = vQ; float px = max(fwidth(q.x), fwidth(q.y));
  // the deckled edges of the leaf
  float dk = 3.0 * vnoise(q * 0.11) + 1.2 * vnoise(q * 0.47);
  if (q.x > 499.0 + dk || q.y < 1.0 - 4.0 + dk || q.y > 719.0 + dk || q.x < -326.0 + dk * 2.0) discard;
  vec3 col = uVellum;
  col *= 0.93 + 0.07 * vnoise(q * 0.03) + 0.05 * vnoise(q * 0.14);
  // hair follicles
  vec2 fq = q * 1.4, fi = floor(fq), ff = fract(fq) - 0.5 - (vec2(hash(fi), hash(fi + 9.1)) - 0.5) * 0.6;
  col *= 1.0 - 0.13 * smoothstep(0.17, 0.06, length(ff)) * step(0.5, hash(fi + 7.0)) * clamp(0.22 / max(px, 1e-4), 0.0, 1.0);
  // show-through of the writing on the other side
  float rowz = mod(q.y - 60.0, 14.0);
  float band = smoothstep(3.2, 1.6, abs(rowz - 7.0)) * step(54.0, q.y) * step(q.y, 690.0);
  float xs = abs(q.x) ; float inX = smoothstep(36.0, 44.0, xs) * smoothstep(338.0, 330.0, xs);
  float strokes = smoothstep(0.1, 0.6, sin(q.x * 2.1 + 2.0 * vnoise(q * 0.2)) ) * step(0.33, vnoise(vec2(q.x * 0.07, floor((q.y - 60.0) / 14.0) * 3.1)));
  float wallK = step(q.x, 0.0), rowi = floor((q.y - 60.0) / 14.0);
  float sAmt = band * inX * strokes * clamp(0.6 / max(px, 1e-4), 0.0, 1.0);
  float words = smoothstep(0.26, 0.4, vnoise(vec2(q.x * 0.045, rowi * 3.1)));
  float wAmt = smoothstep(4.8, 1.6, abs(rowz - 7.0)) * step(54.0, q.y) * step(q.y, 690.0) * inX * words * (0.5 + 0.5 * smoothstep(-0.5, 0.6, sin(q.x * 1.7 + 2.0 * vnoise(q * 0.2))));
  col = mix(col, col * vec3(0.5, 0.47, 0.45), mix(sAmt * 0.09, wAmt * 0.62, wallK));
  if (q.x < -50.0) {
    // ghosts of the painted panels on the other side of the facing leaf
    for (int i = 0; i < 2; i++) {
      vec3 gp = i == 0 ? vec3(338.0, 128.0, 44.0) : vec3(642.0, 112.0, 36.0);
      vec2 g = (vec2(q.y, -q.x - 40.0) - gp.xy) / gp.z + 0.06 * (vec2(vnoise(q * 0.07), vnoise(q * 0.07 + 9.0)) - 0.5);
      float m = max(abs(g.x), abs(g.y)), inP = smoothstep(1.06, 0.92, m);
      vec3 gc = mix(uVerm, uLapis * 1.3, smoothstep(0.74, 0.84, m));
      float ro = length(g * vec2(1.14, 1.0));
      gc = mix(gc, uLapis * 1.3, smoothstep(0.5, 0.42, ro));
      gc = mix(gc, uGold * 0.55, smoothstep(0.14, 0.06, abs(ro - 0.58)));
      col = mix(col, gc, inP * (0.19 + 0.07 * vnoise(q * 0.21)));
    }
  }
  if (q.x > 0.0) {
    // drypoint ruling
    float rd = min(min(rowz, abs(rowz - 5.0)), 14.0 - rowz);
    float rule = lineAA(rd, 0.07, px) * step(40.0, q.x) * step(q.x, 472.0) * step(50.0, q.y) * step(q.y, 596.0);
    float vd = min(min(abs(q.x - 50.0), abs(q.x - 330.0)), min(abs(q.x - 341.0), abs(q.x - 459.0)));
    rule = max(rule, lineAA(vd, 0.07, px) * step(20.0, q.y));
    col *= 1.0 - 0.17 * rule;
    // margin strip: winter's blue diaper, and red rules round it
    float inM = step(344.0, q.x) * step(q.x, 456.0) * step(30.0, q.y) * step(q.y, 594.0);
    if (uSeason > 2.5 && inM > 0.5) {
      vec2 dq = vec2(q.x + q.y, q.x - q.y) * 0.7071 / 7.0, df = fract(dq) - 0.5, di = floor(dq);
      vec3 dcol = mix(uLapis * 1.25, uLapis * 1.6, mod(di.x + di.y, 2.0));
      dcol = mix(dcol, uWhite, lineAA((0.5 - max(abs(df.x), abs(df.y))) * 7.0, 0.12, px));
      dcol = mix(dcol, uWhite, ink(0.3, length(df) * 7.0, px));
      col = mix(col, dcol, 0.42);
    }
    float md = min(min(abs(q.x - 344.0), abs(q.x - 456.0)), min(abs(q.y - 30.0), abs(q.y - 594.0)));
    col = mix(col, uVerm, lineAA(md, 0.28, px) * step(343.5, q.x) * step(q.x, 456.5) * step(29.5, q.y) * step(q.y, 594.5) * 0.85);
    // the illumination painted on the page itself: bar borders down both sides of the margin with pen spraywork,
    // bezants and ivy between them, and a bar frame that grows out of the Great Initial round the lines it heads
    bool inMar = q.x > 334.0 && q.x < 492.0 && q.y > 34.0 && q.y < 595.5;
    bool inBlk = q.x > 134.0 && q.x < 340.0 && q.y > 430.0 && q.y < 596.0;
    if (inMar || inBlk) {
      vec3 Vv = normalize(cameraPosition - vW);
      float gw = max(sin(q.y * 0.045 + q.x * 0.03 - uTime * 0.8), 0.0); gw *= gw; gw *= gw;
      vec3 gcol = goldLeaf(vec3(0.0, 1.0, 0.0), Vv, q * 1.1, 0.1 * gw + 0.5 * uFlare * step(q.x, 340.0)) + uGold * 0.36;
      if (inMar) {
        float sx = q.x < 399.0 ? 1.0 : -1.0, bx = q.x < 399.0 ? 364.5 : 433.5, ox = (q.x - bx) * sx;
        float reach = ox > 0.0 ? 36.0 : (sx > 0.0 ? 23.0 : 56.0), inZ = step(56.0, q.y) * step(q.y, 593.0);
        if (abs(ox) > 1.3) col = spray(col, abs(ox), q.y, reach, px, gcol, sx + sign(ox) * 0.37, inZ * step(abs(ox), reach));
        col = barPaint(col, ox, q.y - 56.0, px, gcol, inZ);
      }
      if (inBlk && uBarG > 0.001) {
        float xm = 138.0 + 199.0 * uBarG, tip = 1.0 - smoothstep(xm - 3.0, xm, q.x);
        float dn = 445.6 - q.y, ds = q.y - 584.4, on = step(138.0, q.x) * tip;
        if (dn > 1.3) col = spray(col, dn, q.x, 13.0, px, gcol, 3.1, on * step(dn, 13.0));
        if (ds > 1.3) col = spray(col, ds, q.x, 10.0, px, gcol, 4.3, on * step(ds, 10.0));
        col = barPaint(col, dn, q.x - 138.0, px, gcol, on);
        col = barPaint(col, ds, q.x - 138.0, px, gcol, on);
        col = barPaint(col, q.x - 138.2, q.y - 445.6, px, gcol, step(444.3, q.y) * step(q.y, 585.7) * smoothstep(0.0, 0.05, uBarG));
      }
    }
    // the wave border, painted flat under the standing scallops
    float wb = smoothstep(598.0, 598.6, q.y + 0.6 * sin(q.x * 0.9)) * smoothstep(622.0, 621.4, q.y + 0.6 * sin(q.x * 0.9 + 2.0));
    if (wb > 0.0) {
      float r = floor((q.y - 598.0) / 4.0), dir = mod(r, 2.0) * 2.0 - 1.0;
      vec2 sc = vec2(q.x / 5.0 + dir * uTime * 0.22 + r * 0.37, fract((q.y - 598.0) / 4.0));
      float d = length(vec2(fract(sc.x) - 0.5, sc.y * 0.8));
      vec3 wc = mix(uLapis * 0.7, uLapis, step(d, 0.46));
      wc = mix(wc, uWhite, lineAA(abs(d - 0.46) * 5.0, 0.13, px));
      wc = mix(wc, uWhite, ink(0.3, length(vec2(fract(sc.x) - 0.5, sc.y - 0.3) * vec2(5.0, 4.0)), px) * 0.9);
      col = mix(col, wc * uPaint, wb);
      col = mix(col, uSepia, lineAA(min(abs(q.y + 0.6 * sin(q.x * 0.9) - 598.3), abs(q.y + 0.6 * sin(q.x * 0.9 + 2.0) - 621.7)), 0.2, px));
    }
    // the lines the Initial heads, written flat on the page: textura minims with lozenge feet, a few words rubricated
    if (q.x > 146.0 && q.x < 331.0 && q.y > 452.0 && q.y < 578.0) {
      float rz = mod(q.y - 452.0, 14.0) - 7.0, ri = floor((q.y - 452.0) / 14.0);
      float cx = q.x / 2.8 + ri * 0.37, cf = (fract(cx) - 0.5) * 2.8;
      float word = smoothstep(0.3, 0.34, vnoise(vec2(q.x * 0.1, ri * 3.7 + 1.0))) * step(q.x, 330.0 - 60.0 * step(0.6, hash(vec2(ri, 4.0))) * hash(vec2(ri, 8.0)));
      float d = max(abs(cf) - 0.5, abs(rz) - 2.4);
      d = min(d, abs(cf + sign(rz) * 0.3) + abs(abs(rz) - 2.25) - 0.9);
      float m = 1.0 - smoothstep(-px, px, d);
      m = mix(m, 0.42 * step(abs(rz), 2.9), smoothstep(0.6, 1.5, px)) * word;
      float rw = hash(vec2(floor(q.x * 0.1 * 0.5 + ri * 0.7), ri + 5.0));
      vec3 ic = rw > 0.9 ? uVerm : (rw < 0.07 ? uLapis * 1.3 : vec3(0.05, 0.034, 0.024));
      col = mix(col, ic, m * 0.93);
    }
    // the quill's line: wet black with a bleeding halo behind the nib, drying to sepia
    if (q.y > uInk.y && q.y < uInk.x) {
      float cx = ${INK_X.toFixed(1)} + 5.0 * sin(q.y * 0.035 + uInk.z), sl = 0.175 * cos(q.y * 0.035 + uInk.z);
      float d = abs(q.x - cx) / sqrt(1.0 + sl * sl), wet = 1.0 - clamp((q.y - uInk.y) / 110.0, 0.0, 1.0);
      float nibT = smoothstep(0.0, 2.5, q.y - uInk.y);
      float wob = 0.75 + 0.25 * vnoise(q * 0.9);
      col = mix(col, uSepia * 0.8, smoothstep(0.75 + 2.6 * wet + px, 0.75, d / wob) * 0.5 * wet * nibT);
      col = mix(col, mix(uSepia, vec3(0.012, 0.01, 0.012), wet), ink(0.75 * nibT, d, px) * 0.96);
    }
    // rare: a cat has walked across the page
    for (int i = 0; i < 6; i++) {
      vec4 pw = uPaw[i];
      if (pw.z > 0.001) {
        vec2 d = (q - pw.xy) / 15.0; float cs = cos(pw.w), sn = sin(pw.w); d = vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs);
        float dm = length((d - vec2(0.0, 0.22)) * vec2(1.0, 1.25)) - 0.47;
        for (int k = 0; k < 4; k++) { float a = -0.9 + 0.6 * float(k); dm = min(dm, length(d - vec2(sin(a) * 0.74, -cos(a) * 0.62 + 0.1)) - 0.19); }
        float grow = smoothstep(0.0, 0.5, pw.z), dry = smoothstep(0.5, 1.0, pw.z);
        dm += (1.0 - grow) * 0.3 + 0.03 * vnoise(q * 0.7);
        col = mix(col, uSepia * 0.8, smoothstep(0.14, 0.0, dm) * 0.4 * (1.0 - dry * 0.7) * grow);
        col = mix(col, mix(vec3(0.012, 0.01, 0.012), uSepia * 0.75, dry), smoothstep(0.02, 0.0, dm) * 0.95);
      }
    }
  }
  // light: the candle lifts the page toward it, cockles take 10 % shading, the flaring gold warms the vellum
  vec2 xz = vW.xz; float hx = pageH(xz + vec2(1.5, 0.0)) - pageH(xz), hz = pageH(xz + vec2(0.0, 1.5)) - pageH(xz);
  vec3 n = normalize(mix(vec3(-hx / 1.5, 1.0, -hz / 1.5), vec3(1.0, 0.0, 0.0), vWall));
  float lit = dot(n, uCandleDir) - uCandleDir.y * (1.0 - vWall);
  col *= (1.0 + clamp(lit * 1.1, -0.12, 0.10)) * (0.955 + 0.06 * (uCandleI - 1.0) * 4.0 * 0.25 + 0.045 * smoothstep(0.0, 500.0, vW.x));
  col *= uPageTint;
  col *= mix(vec3(1.0), vec3(0.80, 0.75, 0.62), vWall * smoothstep(25.0, 260.0, vW.y));
  col *= 1.0 - 0.3 * smoothstep(165.0, 290.0, vW.y);
  { vec2 hs = vec2((vW.z - 500.0) / 150.0, (vW.y - 50.0) / 115.0); col *= 1.0 + 0.18 * vWall * exp(-dot(hs, hs)) * uCandleI; }
  col *= mix(vec3(0.975, 0.965, 0.955), vec3(1.02, 1.0, 0.95), smoothstep(200.0, 500.0, vW.x) * (1.0 - vWall));
  if (uBeam.z > 0.0) {
    vec2 b = xz - uBeam.xy; float cs = cos(uBeam.w), sn = sin(uBeam.w); b = vec2(b.x * cs - b.y * sn, b.x * sn + b.y * cs);
    float lx = abs(abs(b.x) - 17.0) - 12.0 * (1.0 - smoothstep(30.0, 62.0, b.y) * 0.999);
    float beam = smoothstep(2.5, -2.5, lx) * smoothstep(-70.0, -64.0, b.y) * step(q.x, 500.0) * (1.0 - vWall);
    beam *= 1.0 - 0.6 * lineAA(abs(mod(b.y + 70.0, 22.0) - 11.0), 0.7, px);
    col = col * (1.0 + 0.3 * beam * uBeam.z) + uBeamCol * 0.05 * beam * uBeam.z + vec3(0.1, 0.22, 0.5) * 0.16 * beam * (1.0 - beam) * 4.0 * uBeam.z;
  }
  vec4 hq = vec4((vW.x - 185.0) / 120.0, (vW.z - 500.0) / 85.0, (vW.z - 500.0) / 110.0, (vW.y - 60.0) / 110.0); hq *= hq;
  float hg = exp(-hq.x - hq.y) * step(119.0, vW.x) + 0.55 * vWall * exp(-hq.z - hq.w);
  col += vec3(1.0, 0.56, 0.2) * 0.2 * uFlare * hg * (0.92 + 0.08 * sin(uTime * 9.0) * sin(uTime * 5.3));
  col += vec3(1.0, 0.6, 0.22) * 0.25 * uBlockFlare * exp(-dot(vW.xz - vec2(uHeroXZ, 298.0), vW.xz - vec2(uHeroXZ, 298.0)) / 500.0);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the scriptorium (sky dome)
const ROOM_FS = /* glsl */`
uniform vec3 uRoom, uRoomGlow, uCandleDir, uCandleCol, uWin; uniform float uTime, uCandleI, uHour, uShelf;
varying vec3 vD;
float hash1(float n){ return fract(sin(n * 91.345) * 47453.5453); }
float rh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float rn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rh(i), rh(i + vec2(1.0, 0.0)), f.x), mix(rh(i + vec2(0.0, 1.0)), rh(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec3 d = normalize(vD);
  vec3 c = normalize(uCandleDir), rt = normalize(cross(vec3(0.0, 1.0, 0.0), c)), up = cross(c, rt);
  float fz = dot(d, c); vec2 t = vec2(dot(d, rt), dot(d, up)) / max(fz + 1.0, 0.2) * 2.0;   // stereographic, about the light
  float a = length(t) + step(fz, -0.5) * 4.0;
  vec3 col = uRoom * (0.75 + 0.5 * smoothstep(-0.6, 0.5, d.y)) + uRoomGlow * (exp(-a * 2.2) * 0.55 + 0.06 * smoothstep(0.1, -0.5, d.y) * exp(-a * 0.8));
  // the scriptorium, far out of focus: bays of shelved books between piers, a tall window, the desk below
  float azm = atan(d.z, d.x + 1e-5), elv = asin(clamp(d.y, -1.0, 1.0));
  float bandS = smoothstep(-0.1, 0.02, elv) * smoothstep(0.9, 0.5, elv);
  float se = elv / 0.15, sh = floor(se), sf = fract(se);
  float spine = rn(vec2(azm * 30.0, sh * 7.3)) * 0.6 + rn(vec2(azm * 75.0, sh * 3.1)) * 0.4;
  vec3 sc = mix(vec3(0.42, 0.16, 0.07), vec3(0.16, 0.2, 0.12), rn(vec2(azm * 11.0 + 3.0, sh * 1.7)));
  sc = mix(sc, vec3(0.3, 0.24, 0.14), rn(vec2(azm * 19.0, sh * 5.1)));
  float pier = smoothstep(0.03, 0.12, abs(fract(azm / 0.9) - 0.5));
  // (the flight looks south down the margin for a third of its length: that side of the room is given more of the glow)
  float southK = smoothstep(-0.25, 0.75, d.z) * smoothstep(-0.9, 0.2, d.x) * (uHour > 0.5 && uHour < 1.5 ? 0.3 : 1.0), shelfK = uShelf * (1.0 + 1.9 * southK);
  col += sc * shelfK * bandS * pier * smoothstep(0.0, 0.14, sf) * smoothstep(1.0, 0.78, sf) * (0.25 + 0.75 * spine) * (0.3 + 0.7 * exp(-a * 0.8) + 0.45 * southK);
  col += vec3(0.3, 0.15, 0.06) * shelfK * smoothstep(-0.02, -0.5, d.y) * (0.25 + 0.75 * exp(-a * 0.6)) * (0.6 + 0.4 * rn(vec2(azm * 3.0, elv * 40.0)));
  col += uRoomGlow * southK * (0.2 * exp(-elv * elv / 0.05) + 0.07 * smoothstep(0.9, 0.0, elv));
  // three great soft discs of light, far out of focus, drifting on that side
  vec3 bk = vec3(0.0);
  { vec3 b0 = normalize(vec3(0.55 + 0.05 * sin(uTime * 0.11), 0.26, 0.8)); float r0 = 0.2, d0 = length(d - b0);
    bk += vec3(0.075) * smoothstep(r0, r0 * 0.86, d0) * (0.65 + 0.35 * smoothstep(r0 * 0.7, r0 * 0.95, d0));
    vec3 b1 = normalize(vec3(-0.12, 0.4 + 0.03 * sin(uTime * 0.13 + 1.0), 0.9)); float r1 = 0.15, d1 = length(d - b1);
    bk += vec3(0.06) * smoothstep(r1, r1 * 0.86, d1) * (0.65 + 0.35 * smoothstep(r1 * 0.7, r1 * 0.95, d1));
    vec3 b2 = normalize(vec3(-0.62, 0.2, 0.75 + 0.05 * sin(uTime * 0.09 + 2.0))); float r2 = 0.25, d2 = length(d - b2);
    bk += vec3(0.05) * smoothstep(r2, r2 * 0.86, d2) * (0.65 + 0.35 * smoothstep(r2 * 0.7, r2 * 0.95, d2)); }
  col += (uRoomGlow * 1.4 + uCandleCol * 0.35) * bk * (uHour > 0.5 && uHour < 1.5 ? 0.4 : 1.0);
  vec3 wd = normalize(vec3(0.3, 0.42, 1.0)), wr = normalize(cross(vec3(0.0, 1.0, 0.0), wd)), wu = cross(wd, wr);
  float wf = dot(d, wd); vec2 wt = vec2(dot(d, wr), dot(d, wu)) / max(wf, 0.05);
  float wl = smoothstep(0.15, 0.0, abs(wt.x)) * smoothstep(-0.4, -0.2, wt.y) * smoothstep(0.0, 0.22, 0.4 - abs(wt.x) * 2.4 - wt.y) * step(0.2, wf); wl *= wl;
  col += uWin * wl * (0.7 + 0.3 * smoothstep(0.01, 0.03, abs(mod(wt.y + 0.36, 0.17) - 0.085)));
  if (uHour < 0.5 || uHour > 1.5) {
    // the candle flame, far out of focus: an amber orb with a paler core, and a wisp of smoke at dawn
    float e = length(t * vec2(1.0, 0.72) - vec2(0.0, 0.012));
    float r0 = uHour > 1.5 ? 0.07 : 0.105;
    col += uCandleCol * uCandleI * (smoothstep(r0, r0 * 0.62, e) * 1.25 + smoothstep(r0 * 0.6, 0.0, e) * 1.3 + exp(-e * 9.0) * 0.5);
    if (uHour > 1.5) {
      float sy = max(t.y - 0.08, 0.0), sx = t.x - 0.05 * sin(sy * 9.0 - uTime * 1.1) * sy * 3.0 - 0.03 * sin(sy * 21.0 - uTime * 1.9) * sy;
      col += vec3(0.5, 0.42, 0.45) * 0.3 * exp(-sx * sx / (0.0008 + sy * 0.012)) * smoothstep(0.0, 0.08, sy) * smoothstep(0.9, 0.2, sy);
      col += vec3(0.9, 0.42, 0.4) * 0.3 * exp(-(d.y + 0.02) * (d.y + 0.02) / 0.0256) * smoothstep(-0.2, 0.8, fz);   // first light along the sill
    }
  } else {
    // a cloister window: two blurred lancets of cool daylight
    float ty = t.y - 0.28;                         // the lancets stand high, out of the level view
    float lx = abs(abs(t.x) - 0.11) - 0.075 * (1.0 - smoothstep(0.1, 0.36, ty) * 0.999);
    float win = smoothstep(0.075, -0.065, lx) * smoothstep(-0.44, -0.2, ty) * step(-0.5, fz);
    win *= 0.85 + 0.15 * smoothstep(0.0, 0.05, abs(mod(ty + 0.36, 0.14) - 0.07));
    col += uCandleCol * (min(win, 0.85) * 0.78 + exp(-a * 3.0) * 0.16);
    float sd = max(-ty - 0.2, 0.0), sx = (abs(t.x) - 0.11) / (0.09 + 0.3 * sd);
    col += uCandleCol * 0.13 * exp(-sx * sx) * smoothstep(0.0, 0.25, sd) * smoothstep(2.2, 0.5, sd) * (0.8 + 0.2 * rn(vec2(t.x * 9.0 + uTime * 0.05, t.y * 2.0 - uTime * 0.03))) * step(-0.5, fz);
  }
  // dust motes in the light: slow bokeh discs
  for (int i = 0; i < 14; i++) {
    float fi = float(i), sp = 0.012 + 0.02 * hash1(fi + 3.0);
    vec2 p = vec2(hash1(fi) * 2.4 - 1.2 + sin(uTime * sp * 3.0 + fi) * 0.25, hash1(fi + 7.0) * 1.3 - 0.45 + mod(uTime * sp + hash1(fi + 11.0), 1.0) * 0.3 - 0.15);
    float rr = 0.03 + 0.06 * hash1(fi + 5.0), dd = length(t - p);
    col += uCandleCol * (0.05 + 0.07 * hash1(fi + 2.0)) * smoothstep(rr, rr * 0.82, dd) * (0.6 + 0.4 * smoothstep(rr * 0.8, rr * 0.95, dd)) * step(-0.2, fz);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- ink (text minims, line-fillers, block core)
const INK_VS = /* glsl */`
attribute vec3 aTint; varying vec3 vT, vL, vW;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vT = aTint; vL = position; vW = w.xyz;
${G_VEND}}`;
// iron-gall ink: warm sepia-black, glossy where the flame grazes it, lifted from below by the bright page
const INK_FS = /* glsl */`
uniform vec3 uVellum; varying vec3 vT, vL, vW;
void main(){
${G_SHADOW}
  vec3 V = normalize(cameraPosition - vW), n = cross(dFdx(vW), dFdy(vW));
  n = normalize(n + vec3(0.0, 1e-6, 0.0)); if (dot(n, V) < 0.0) n = -n;
  float top = smoothstep(0.6, 0.85, n.y), isInk = step(vT.r + vT.g + vT.b, 0.4), lightK = mix(0.3, 1.0, isInk);
  vec2 lh = normalize(uCandleDir.xz + vec2(1e-4, 0.0));
  float face = max(dot(n.xz, lh), 0.0);
  float st = vnoise(vec2((vW.x + vW.z) * 1.3, vW.y * 0.16)), fib = vnoise(vec2((vW.x + vW.z) * 2.6, vW.y * 0.3));
  vec3 col = vT * mix(mix(0.72, 1.08, step(0.15, face)), 1.0, isInk) * (0.92 + 0.12 * st);
  col += uCandleCol * vec3(1.0, 0.72, 0.45) * 0.03 * face * face * uCandleI * (0.6 + 0.8 * fib) * lightK * (1.0 - top);
  float lowK = 1.0 - clamp(vL.y, 0.0, 1.0);
  col += uVellum * (0.003 + 0.01 * lowK * lowK * lowK) * (1.0 - top) * lightK;
  vec3 R = reflect(-V, n); float sp = max(dot(R, uCandleDir), 0.0), sp4 = sp * sp * sp * sp;
  float fres = 1.0 - max(dot(n, V), 0.0); fres *= fres * fres;
  col += uCandleCol * uCandleI * vec3(1.0, 0.7, 0.4) * (sp4 * sp4 * sp4 * 0.25 + sp4 * 0.012) * (0.2 + 0.8 * fres) * (0.4 + 1.2 * fib) * lightK;
  col = mix(col, vT * (0.92 + 0.12 * st) + uCandleCol * vec3(1.0, 0.75, 0.5) * 0.004 * uCandleI * isInk * (0.5 + fib), top * 0.9);
  col = mix(col, vT * 0.5, isInk * (1.0 - top) * smoothstep(0.93, 0.99, vL.y) * 0.6);
  gl_FragColor = vec4(col * mix(uPaint, vec3(1.0), isInk), 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- vines (tubes that grow with u)
const VINE_VS = /* glsl */`
attribute float aR, aBirth, aArc; varying vec3 vN, vV; varying float vVis, vArc;
void main(){
  float vis = smoothstep(aBirth, aBirth + 0.012, uU);
  vec3 p = position + normal * aR * vis * (1.0 + 0.5 * sin(vis * 3.1416));
  vec4 w = modelMatrix * vec4(p, 1.0);
  vN = normal; vVis = vis; vArc = aArc; vV = cameraPosition - w.xyz;
${G_VEND}}`;
const VINE_FS = /* glsl */`
uniform vec3 uVine; varying vec3 vN, vV; varying float vVis, vArc;
void main(){
  if (vVis < 0.02) discard;
${G_SHADOW}
  vec3 n = normalize(vN);
  float tone = step(0.1, n.y * 0.8 + dot(n.xz, uCandleDir.xz) * 0.45);
  vec3 col = uVine * mix(0.58, 1.1, tone);
  col = mix(col, uWhite, step(0.9, n.y) * step(0.45, fract(vArc * 0.22)) * 0.85);
  float rim = 1.0 - abs(dot(n, normalize(vV)));
  col = mix(col, uSepia, smoothstep(0.6, 0.72, rim));
  gl_FragColor = vec4(col * uPaint, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- leaves, gold ivy, flowers and fruit (instanced cards)
const CARD_VS = /* glsl */`
attribute vec3 iPos, iRot; attribute vec4 iData;
varying vec2 vP; varying vec4 vD; varying float vVis, vAsp; varying vec3 vNw, vV;
void main(){
  float vis = smoothstep(iData.y, iData.y + 0.022, uU);
  float lean = iRot.y + (1.0 - vis) * 1.4 + (sin(uTime * 1.6 + iData.z * 40.0) * 0.07 + uGust * 0.35 * sin(uTime * 5.0 + iData.z * 9.0)) * vis;
  vec2 l = vec2(position.x, position.y * iData.w) * iRot.z * vis * (1.0 + 0.25 * sin(vis * 3.1416));
  vec3 p = vec3(l.x, l.y * cos(lean), l.y * sin(lean)), nl = vec3(0.0, -sin(lean), cos(lean));
  float cy = cos(iRot.x), sy = sin(iRot.x);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy); nl = vec3(nl.z * sy, nl.y, nl.z * cy);
  vec4 w = vec4(iPos + p, 1.0);
  vP = vec2(position.x * 2.0, position.y * 2.0 - 1.0); vD = iData; vVis = vis; vAsp = iData.w; vNw = nl; vV = cameraPosition - w.xyz;
${G_VEND}}`;
const CARD_FS = /* glsl */`
uniform vec4 uLeaf, uFlA; uniform vec3 uLeafCol, uLeafCol2, uFlACol, uFlBCol, uVine, uLapis, uVerm; uniform float uFlB;
varying vec2 vP; varying vec4 vD; varying float vVis, vAsp; varying vec3 vNw, vV;
void main(){
  if (vVis < 0.02) discard;
  float kind = vD.x, h = vD.z; vec2 p = vP; vec3 col; float px = fwidth(p.y) * 1.2;
  if (kind > 3.5) {
    // line-filler: one pointed lobe of a pleated red and blue pen flourish
    vec2 a = abs(p); float e = pow(a.x + 1e-4, 1.35) / 0.86 + pow(a.y + 1e-4, 1.35);
    if (e > 1.0) discard;
${G_SHADOW}
    col = (h < 0.5 ? uLapis * 1.3 : uVerm) * mix(0.66, 1.0, step(0.0, p.x * 0.8 - p.y * 0.35 + 0.05));
    col = mix(col, uWhite, ink(0.03, abs(e - 0.56), px * 1.4) * 0.9);
    float d3 = min(length(p * vec2(0.7, 1.0)), min(length((p - vec2(0.0, 0.34)) * vec2(0.7, 1.0)), length((p + vec2(0.0, 0.34)) * vec2(0.7, 1.0))));
    col = mix(col, uWhite, ink(0.075, d3, px));
    col = mix(col, uSepia, smoothstep(0.84 - px * 1.5, 0.84 + px * 1.5, e));
    col *= uPaint;
  } else if (kind < 1.5) {
    // leaf: lobed outline about a point above the stalk
    vec2 lp = p - vec2(0.0, -0.3); lp.x *= uFlA.x; float f = atan(lp.x + 1e-5, lp.y), r = length(lp);
    float rad = (uLeaf.x + uLeaf.y * pow(abs(cos(uLeaf.z * f)), uLeaf.w)) * 1.22;
    float stalk = step(abs(p.x), 0.05) * step(p.y, -0.3);
    float e = r / rad;
    if (e > 1.0 && stalk < 0.5) discard;
${G_SHADOW}
    if (kind < 0.5) {
      col = mix(uLeafCol, uLeafCol2, step(0.62, h)) * mix(0.6, 1.12, step(0.0, p.x)) * (0.9 + 0.2 * fract(h * 7.0));
      float d3 = min(length(lp - vec2(0.3, 0.05)), min(length(lp - vec2(0.3, 0.35)), length(lp - vec2(0.3, -0.25))));
      col = mix(col, uWhite, ink(0.075, d3, px));
      col = mix(col, uSepia, ink(0.03, abs(p.x), px) * step(p.y, 0.55));
      col *= uPaint;
    } else {
      vec3 N = normalize(vNw + 0.2 * vec3(sin(h * 40.0), 0.0, cos(h * 31.0))); vec3 V = normalize(vV);
      if (dot(N, V) < 0.0) N = -N;
      col = goldLeaf(N, V, p * 3.0, uFlare * 0.6) * uPaint;
    }
    col = mix(col, uSepia, max(smoothstep(0.84 - px, 0.84 + px, e), stalk));
  } else {
    // a bloom on a stalk; the bloom square is the top of the card
    vec2 b = vec2(p.x, (p.y + 1.0) * vAsp - (2.0 * vAsp - 1.0));
    float open = vVis * vVis, mask, edge;
    float stalk = step(abs(p.x), 0.045) * step(b.y, -0.2);
    if (kind < 2.5) {
      float f = atan(b.x + 1e-5, b.y), r = length(b), rad = 0.42 + 0.53 * open * pow(abs(cos(uFlA.w * 0.5 * f + h * 6.0)), 0.7);
      edge = r / rad; mask = step(edge, 1.0);
      col = uFlACol * mix(0.62, 1.0, step(0.52, edge)) * (0.85 + 0.3 * fract(h * 5.0));
      col = mix(col, uWhite, ink(0.05, abs(edge - 0.52) * rad, px) * 0.8);
      col = mix(col, uGold * 0.9, ink(0.2, r, px));
      col = mix(col, uSepia, ink(0.03, abs(r - 0.2), px));
    } else if (uFlB < 0.5) {
      // strawberry
      float wd = 0.5 + 0.22 * (b.y + 1.0); edge = length(vec2(b.x / wd, b.y * 0.98 + 0.02));
      mask = step(edge, 1.0);
      col = uFlBCol * mix(0.66, 1.0, step(b.x * 0.6 - b.y * 0.3, 0.1));
      vec2 g = b * 3.2; g.x += 0.5 * mod(floor(g.y), 2.0); col = mix(col, uWhite, ink(0.16, length(fract(g) - 0.5), px * 3.2));
      float cap = step(0.52 + 0.14 * abs(sin(b.x * 9.0)), b.y); col = mix(col, uVine, cap);
    } else if (uFlB < 1.5) {
      // ear of wheat
      edge = length(vec2(b.x / 0.42, b.y)); mask = step(edge, 1.0);
      float ch = fract((b.y - abs(b.x) * 1.5) * 3.0);
      col = uFlBCol * mix(0.66, 1.05, step(0.5, ch));
      col = mix(col, uSepia, ink(0.06, abs(ch - 0.5), px * 3.0) * 0.8);
      col = mix(col, uWhite, ink(0.05, length(vec2(abs(b.x) - 0.16, fract(b.y * 3.0) - 0.5) * vec2(1.0, 0.33)), px));
    } else if (uFlB < 2.5) {
      // bunch of grapes
      vec2 g = b * 3.3; g.x += 0.5 * mod(floor(g.y), 2.0); vec2 gi = floor(g); float gr = length(fract(g) - 0.5);
      float inT = step(abs((gi.x + 0.5 - 0.5 * mod(gi.y, 2.0)) / 3.3), 0.3 * ((gi.y + 0.5) / 3.3 + 1.15));
      edge = gr / 0.5; mask = step(edge, 1.0) * inT * step(abs(b.y), 0.95);
      col = uFlBCol * mix(0.62, 1.0, step(length(fract(g) - vec2(0.42, 0.58)), 0.33));
      col = mix(col, uWhite, ink(0.09, length(fract(g) - vec2(0.36, 0.64)), px * 3.3));
    } else {
      // holly berries
      float d = min(length(b - vec2(-0.4, -0.2)), min(length(b - vec2(0.4, -0.2)), length(b - vec2(0.0, 0.45)))) / 0.42;
      edge = d; mask = step(edge, 1.0);
      col = uFlBCol * mix(0.66, 1.0, step(d, 0.7));
      vec2 hb = vec2(abs(b.x) - 0.3 * step(b.y, 0.1), b.y - (b.y > 0.1 ? 0.55 : -0.1));
      col = mix(col, uWhite, ink(0.07, length(hb), px));
    }
    if (mask < 0.5 && stalk < 0.5) discard;
${G_SHADOW}
    col = mask > 0.5 ? mix(col, uSepia, smoothstep(0.86 - px, 0.86 + px, edge)) : uVine * 0.75;
    col *= uPaint;
  }
  gl_FragColor = vec4(col, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- jointed paper figures (atlas sprites)
const SPRITE_VS = /* glsl */`
attribute vec4 iUV, iFx; varying vec2 vUv; varying vec4 vFx;
void main(){
  vec3 p = position;
  p.z += sin(p.x * 7.0 - uTime * (4.0 + iFx.z)) * iFx.y * (p.x + 0.5);
  p.y += sin(p.x * 5.0 - uTime * (3.1 + iFx.z)) * iFx.y * 0.5 * (p.x + 0.5);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vUv = iUV.xy + uv * iUV.zw; vFx = iFx;
${G_VEND}}`;
const SPRITE_FS = /* glsl */`
uniform sampler2D uAtlas; varying vec2 vUv; varying vec4 vFx;
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  if (t.a < 0.5) discard;
${G_SHADOW}
  vec3 col = t.rgb / max(t.a, 0.5) * uPaint;
  float lamp = step(0.8, t.r) * step(0.5, t.g) * step(t.b, 0.25) * vFx.x;
  col *= 1.0 + lamp * (2.2 + 1.2 * sin(uTime * 7.0 + vUv.x * 90.0) * sin(uTime * 4.3 + vUv.y * 70.0));
  gl_FragColor = vec4(col, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- butterflies
const FLY_VS = /* glsl */`
attribute vec3 iC; attribute vec4 iD; uniform vec4 uScare;
varying vec2 vUv; varying float vH;
void main(){
  float ph = iD.x, t = uTime * iD.w;
  vec3 c = iC + vec3(sin(t * 0.5 + ph) * 5.0, sin(t * 0.83 + ph * 2.0) * 2.2 + sin(t * 3.1 + ph) * 0.35, cos(t * 0.41 + ph * 1.3) * 5.0);
  vec2 sd = c.xz - uScare.xy; float sl = max(length(sd), 1.0), sk = uScare.z * smoothstep(80.0, 12.0, sl);
  c.xz += sd / sl * sk * 34.0; c.y += sk * 16.0;
  float yaw = atan(cos(t * 0.5 + ph) * 2.5, -sin(t * 0.41 + ph * 1.3) * 2.05 + 1e-4);
  float flap = 0.25 + 0.95 * sin(uTime * (12.0 + 5.0 * fract(ph * 3.7)) * (1.0 + sk) + ph * 7.0);
  vec3 l = vec3(position.x * cos(flap), abs(position.x) * sin(flap), position.z) * iD.y;
  l = vec3(l.x, l.y * 0.88 - l.z * 0.47, l.y * 0.47 + l.z * 0.88);
  float cy = cos(yaw), sy = sin(yaw);
  vec4 w = vec4(c + vec3(l.x * cy + l.z * sy, l.y, -l.x * sy + l.z * cy), 1.0);
  vUv = vec2(abs(position.x), -position.z); vH = iD.z;
${G_VEND}}`;
const FLY_FS = /* glsl */`
uniform vec3 uLapis, uVerm; varying vec2 vUv; varying float vH;
void main(){
  vec2 q = vUv;
  float d = min(length((q - vec2(0.5, 0.12)) / vec2(0.5, 0.36)), length((q - vec2(0.38, -0.25)) / vec2(0.38, 0.25)));
  if (d > 1.0 && q.x > 0.07) discard;
${G_SHADOW}
  vec3 base = vH < 0.3 ? uLapis * 1.6 : (vH < 0.55 ? uVerm : (vH < 0.8 ? uGold : uWhite));
  vec3 col = mix(base, base * 0.5, step(0.66, d));
  float es = length(q - vec2(0.56, 0.16));
  col = mix(col, uWhite, step(es, 0.13)); col = mix(col, uSepia, step(es, 0.06));
  col = mix(col, uWhite, step(length(vec2(fract(q.x * 5.0) - 0.5, (d - 0.83) * 4.0)), 0.3) * step(0.66, d));
  col = mix(col, uSepia, max(step(0.92, d), step(q.x, 0.07)));
  gl_FragColor = vec4(col * uPaint, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- standing wave scallops
const WAVE_VS = /* glsl */`
uniform vec4 uRow; varying vec2 vUv; varying float vX;
void main(){
  vec3 p = position; p.y += sin(uTime * 1.1 + uRow.y * 2.0) * 0.35;
  vec4 w = modelMatrix * vec4(p, 1.0); w.y += pageH(w.xz); vUv = uv; vX = w.x;
${G_VEND}}`;
const WAVE_FS = /* glsl */`
uniform vec3 uLapis; uniform vec4 uRow; varying vec2 vUv; varying float vX;
void main(){
  float s = vX / uRow.z + uRow.x * uTime * 0.26 + uRow.y * 0.41, c = fract(s) - 0.5;
  float top = 0.5 + 0.5 * sqrt(max(1.0 - 4.0 * c * c, 0.0)) * 0.92;
  float e = top - vUv.y; if (e < 0.0) discard;
${G_SHADOW}
  float pe = fwidth(vUv.y) * 1.5;
  vec3 col = uLapis * mix(0.62, 1.0, step(0.34, e) * 0.0 + step(e, 0.34));
  col = mix(col, uLapis * 1.9 + 0.05, step(e, 0.2));
  col = mix(col, uWhite, ink(0.03, abs(e - 0.2), pe));
  vec2 dq = vec2(c * 3.0, (top - 0.42 - vUv.y) * 4.0);
  col = mix(col, uWhite, step(min(length(dq), min(length(dq - vec2(0.55, 0.0)), length(dq + vec2(0.55, 0.0)))), 0.17));
  col = mix(col, uSepia, step(e, 0.045));
  gl_FragColor = vec4(col * uPaint, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- the goose-quill
const QUILL_VS = /* glsl */`
attribute float aK; varying vec3 vL, vN, vW; varying float vK;
void main(){
  vec3 p = position;
  if (aK > 0.5) p.z += sin(p.y * 0.05 + uTime * 1.3) * 1.2 * abs(p.x) / 13.0 + p.x * p.x * 0.03;
  vec4 w = modelMatrix * vec4(p, 1.0); vL = position; vN = normalize(mat3(modelMatrix) * normal); vK = aK; vW = w.xyz;
${G_VEND}}`;
const QUILL_FS = /* glsl */`
uniform vec3 uRoom; varying vec3 vL, vN, vW; varying float vK;
void main(){
  vec3 col;
  if (vK > 0.5) {
    float u = vL.x / 13.0, v = (vL.y - 14.0) / 186.0;
    float wd = pow(max(sin(pow(clamp(v, 0.0, 1.0), 0.62) * 3.1416), 0.0), 0.55) * smoothstep(-0.02, 0.28, v) * (u > 0.0 ? 1.0 : 0.62);
    float bl = v * 58.0 - abs(u) * 9.0, notch = step(0.86, vnoise(vec2(floor(bl * 0.5), 3.0))) * 0.3 * smoothstep(0.2, 1.0, abs(u) / max(wd, 1e-3));
    if (abs(u) > wd * (1.0 - notch)) discard;
${G_SHADOW}
    col = vec3(0.80, 0.77, 0.68) * mix(0.82, 1.0, step(0.0, u));
    col *= 1.0 - 0.22 * ink(0.1, abs(fract(bl) - 0.5), fwidth(bl));
    col = mix(col, vec3(0.62, 0.55, 0.38), ink(0.05, abs(u), fwidth(u)));
    col = mix(col, uSepia, smoothstep(0.93, 0.97, abs(u) / max(wd * (1.0 - notch), 1e-3)) * 0.7);
  } else {
${G_SHADOW}
    vec3 n = normalize(vN);
    col = vec3(0.74, 0.68, 0.5) * mix(0.62, 1.0, step(0.0, dot(n, uCandleDir)));
    col = mix(col, uSepia, smoothstep(0.62, 0.78, 1.0 - abs(dot(n, normalize(cameraPosition - vW)))) * 0.85);
    col = mix(vec3(0.014, 0.012, 0.014), col, smoothstep(6.0, 13.0, vL.y + 3.0 * vnoise(vec2(vL.x * 2.0 + vL.z * 2.0, vL.y * 0.6))));
  }
  col = mix(col * uPaint, uRoom * 0.9, smoothstep(60.0, 190.0, vW.y));
  gl_FragColor = vec4(col, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- foliate block (gold frame, leaf-scroll field)
const BLOCK_VS = /* glsl */`
varying vec3 vL, vN, vV;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0); vL = position; vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz;
${G_VEND}}`;
const BLOCK_FS = /* glsl */`
uniform vec3 uLapis, uVerm; uniform float uBlockFlare; varying vec3 vL, vN, vV;
void main(){
${G_SHADOW}
  vec3 N = normalize(vN), V = normalize(vV); vec2 p = vL.xy; float px = max(fwidth(p.x), fwidth(p.y));
  float m = max(abs(p.x), abs(p.y)); vec3 col;
  float face = step(0.5, abs(N.z));
  if (face < 0.5 || m > 5.4) {
    vec3 Nb = normalize(N + face * vec3(sign(p.x) * step(abs(p.y), abs(p.x)), sign(p.y) * step(abs(p.x), abs(p.y)), 0.0) * smoothstep(5.4, 5.9, m) * (1.0 - smoothstep(6.5, 7.0, m)) * -0.5);
    col = goldLeaf(Nb, V, p * 1.4 + vL.z, uBlockFlare * 0.45);
    col = mix(col, uSepia, face * ink(0.07, abs(m - 5.45), px));
  } else {
    // leaf-scroll: counter-wound spirals, red on blue and blue on red, gold buds
    vec2 c = p / 3.6 + 0.5; vec2 id = floor(c), f = fract(c) - 0.5; float r = length(f), a = atan(f.y, f.x + 1e-5);
    float dir = mod(id.x + id.y, 2.0) * 2.0 - 1.0;
    float sp = fract(a * dir / 6.2832 + r * 3.2 - uTime * 0.04 * dir);
    vec3 A = dir > 0.0 ? uLapis * 1.3 : uVerm, B = dir > 0.0 ? uVerm : uLapis * 1.3;
    col = mix(A * 0.72, A, step(0.0, f.x - f.y));
    float leaf = smoothstep(0.3, 0.26, abs(sp - 0.5)) * step(r, 0.47) * step(0.07, r);
    col = mix(col, B, leaf);
    col = mix(col, uWhite, ink(0.02, abs(abs(sp - 0.5) - 0.28) / 3.2, px / 3.6) * step(r, 0.47) * 0.9);
    if (r < 0.085) col = goldLeaf(N, V, p * 2.0, uBlockFlare * 0.45);
    col = mix(col, uSepia, ink(0.012, abs(r - 0.085), px / 3.6));
    col = mix(col, uWhite, ink(0.035, length(abs(f) - 0.5), px / 3.6));
  }
  gl_FragColor = vec4(col * uPaint, 1.0);
${G_FEND}}`;

// ---------------------------------------------------------------- small helpers
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
// hold-then-ease through a cyclic list of key values; ph in cycles, hold = share of each step spent still
function keyed(ph, keys, hold = 0.6) {
  const n = keys.length, x = (((ph % 1) + 1) % 1) * n, i = Math.floor(x), f = x - i;
  return lerp(keys[i], keys[(i + 1) % n], ease((f - hold) / (1 - hold)));
}
// a textura minim, written on the page and standing off it in low relief: unit footprint, y 0..1. Seen from above
// it is a slanted pen stroke with a lozenge head and foot and a tapered waist; the detailed one has a bevelled top.
function minimGeometry(detailed) {
  const F = [[-0.95, -0.35], [-0.1, -0.5], [0.42, -0.31], [0.25, 0], [0.4, 0.27], [0.95, 0.35], [0.1, 0.5], [-0.42, 0.31], [-0.25, 0], [-0.4, -0.27]].map(([x, z]) => [x - z * 0.55, z]);
  const L = detailed ? [[0, 1.06, 1.02], [0.55, 1, 1], [1, 0.7, 0.94]] : [[0, 1, 1], [1, 0.8, 0.96]];
  const n = F.length, p = [], at = (l, i) => [F[i][0] * l[1], l[0], F[i][1] * l[2]];
  for (let k = 0; k < L.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = at(L[k], i), b = at(L[k], (i + 1) % n), c = at(L[k + 1], (i + 1) % n), d = at(L[k + 1], i);
    p.push(...a, ...d, ...c, ...a, ...c, ...b);
  }
  const t = L[L.length - 1];
  for (let i = 0; i < n; i++) p.push(0, 1, 0, ...at(t, (i + 1) % n), ...at(t, i));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return g;
}
// accumulates growing tubes: position = centre line, normal = ring direction, aR radius, aBirth (in path u), aArc
function makeTubes() {
  const P = [], N = [], R = [], B = [], A = [], I = [];
  const t = new THREE.Vector3(), s = new THREE.Vector3(), u = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  return {
    add(pts, r0, r1, birth, RS = 6) {            // pts [[x,y,z]], birth(i) -> u
      let arc = 0, prev = -1; const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        if (i) arc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
        t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        s.crossVectors(t, Math.abs(t.y) > 0.9 ? X : Y).normalize(); u.crossVectors(s, t);
        const k = i / (n - 1), r = lerp(r0, r1, k) * (i === n - 1 ? 0.2 : 1), bu = birth(i), ring = P.length / 3;
        for (let j = 0; j < RS; j++) {
          const an = (j / RS) * TAU, c = Math.cos(an), sn = Math.sin(an);
          P.push(p[0], p[1], p[2]); N.push(s.x * c + u.x * sn, s.y * c + u.y * sn, s.z * c + u.z * sn); R.push(r); B.push(bu); A.push(arc);
        }
        if (prev >= 0) for (let j = 0; j < RS; j++) { const j2 = (j + 1) % RS; I.push(prev + j, prev + j2, ring + j2, prev + j, ring + j2, ring + j); }
        prev = ring;
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 1)); g.setAttribute('aBirth', new THREE.Float32BufferAttribute(B, 1));
      g.setAttribute('aArc', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
      return g;
    },
  };
}

// ---------------------------------------------------------------- the painted atlas (figures are drawn once, from primitives)
const C = { lap: '#2B4DB0', lapD: '#1B3382', ver: '#C7361F', verD: '#8E2414', grn: '#2F7D5B', grnD: '#1F5A40', wht: '#F1EBDB', gry: '#B4AE9E',
  och: '#D9A441', ochD: '#A87A2A', pink: '#E0A58E', pinkD: '#B97A66', tan: '#C9A26B', tanD: '#9A774A', brn: '#8A5A32', brnD: '#5E3B1E',
  pale: '#C9D3A0', paleD: '#9CAB78', fox: '#C8642A', foxD: '#93431A', sep: '#3B2A1A', lamp: '#FFC020' };
function makeAtlas(S, N) {
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(S, S) : Object.assign(document.createElement('canvas'), { width: S, height: S });
  const g = cv.getContext('2d'), cell = S / N, rects = {}; let k = 0, open = false;
  const E = (x, y, rx, ry, rot = 0) => () => { g.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const Pg = (...q) => () => { g.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) g.lineTo(q[i], q[i + 1]); g.closePath(); };
  const Cv = (...q) => () => {                 // smooth closed curve through the points
    const n = q.length / 2, m = (i) => [(q[(i % n) * 2] + q[((i + 1) % n) * 2]) / 2, (q[(i % n) * 2 + 1] + q[((i + 1) % n) * 2 + 1]) / 2];
    const s = m(0); g.moveTo(s[0], s[1]);
    for (let i = 1; i <= n; i++) { const e = m(i); g.quadraticCurveTo(q[(i % n) * 2], q[(i % n) * 2 + 1], e[0], e[1]); }
    g.closePath();
  };
  const fill = (f, col, shade, lw = 0.04, ox = -0.06, oy = 0.08) => {
    g.beginPath(); f(); g.fillStyle = shade || col; g.fill();
    if (shade) { g.save(); g.clip(); g.translate(ox, oy); g.beginPath(); f(); g.fillStyle = col; g.fill(); g.restore(); }
    if (lw) { g.beginPath(); f(); g.lineWidth = lw; g.strokeStyle = C.sep; g.stroke(); }
  };
  const line = (q, lw, col = C.sep) => { g.beginPath(); g.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) g.lineTo(q[i], q[i + 1]); g.lineWidth = lw; g.strokeStyle = col; g.stroke(); };
  const limb = (q, lw, col) => { line(q, lw + 0.07); line(q, lw, col); };
  const dot = (x, y, r = 0.04, col = C.wht) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col; g.fill(); };
  const dots = (x, y, dx, dy, r = 0.04) => { for (let i = -1; i <= 1; i++) dot(x + dx * i, y + dy * i, r); };
  const eye = (x, y) => { dot(x, y, 0.05, C.wht); dot(x + 0.01, y, 0.028, C.sep); };
  const begin = (name) => {
    if (open) g.restore();
    const cx = (k % N) * cell, cy = Math.floor(k / N) * cell; k++; open = true;
    g.save(); g.setTransform(cell * 0.47, 0, 0, -cell * 0.47, cx + cell / 2, cy + cell / 2);
    g.beginPath(); g.rect(-1.05, -1.05, 2.1, 2.1); g.clip(); g.lineJoin = g.lineCap = 'round';
    rects[name] = [cx / S + 0.015 / N, 1 - (cy + cell) / S + 0.015 / N, 0.97 / N, 0.97 / N];
  };
  // a running four-legged beast facing +x; legs are a separate sprite
  const beast = (name, o) => {
    begin(name);
    if (o.tail === 'long') limb([-0.5, 0.0, -0.75, 0.12, -0.92, 0.38, -0.8, 0.6], 0.07, o.c);
    if (o.tail === 'brush') { fill(E(-0.72, 0.08, 0.3, 0.14, -0.4), o.c, o.d); fill(E(-0.92, 0.2, 0.1, 0.08, -0.4), C.wht, null, 0.03); }
    if (o.tail === 'thin') line([-0.5, 0.0, -0.7, -0.1, -0.85, 0.05, -0.98, -0.05], 0.045, o.d);
    fill(E(0, 0, 0.56, 0.22 * (o.fat || 1), 0.05), o.c, o.d);
    if (o.tail === 'scut') fill(E(-0.56, 0.1, 0.11, 0.1), C.wht, null, 0.03);
    if (o.ear === 'long') { fill(E(0.5, 0.52, 0.07, 0.28, 0.5), o.c, o.d); fill(E(0.62, 0.55, 0.07, 0.28, 0.2), o.c, o.d); }
    fill(E(0.64, 0.18, 0.2, 0.15, 0.25), o.c, o.d);
    if (o.snout) fill(Pg(0.76, 0.26, 0.98, 0.12, 0.78, 0.06), o.c, null);
    if (o.ear === 'flop') fill(E(0.52, 0.16, 0.08, 0.17, -0.3), o.d, null);
    if (o.ear === 'point') { fill(Pg(0.52, 0.28, 0.5, 0.5, 0.64, 0.33), o.c, null); fill(Pg(0.64, 0.32, 0.7, 0.52, 0.78, 0.3), o.c, null); }
    if (o.ear === 'round') { fill(E(0.56, 0.36, 0.1, 0.1), o.c, o.d); fill(E(0.56, 0.36, 0.05, 0.05), C.pink, null, 0); }
    if (o.collar) line([0.44, -0.04, 0.5, 0.3], 0.07, C.ver);
    eye(0.72, 0.22); dots(-0.05, 0.03, 0.17, 0.0);
    begin(name + 'Legs');
    for (const [x0, x1] of [[0.05, 0.55], [-0.05, -0.5]]) fill(Pg(x0 - 0.1, 0.85, x0 + 0.1, 0.85, x1 + 0.1, -0.8, x1 + 0.22, -0.92, x1 - 0.06, -0.92), o.c, o.d);
  };
  // a bird facing +x: goose, cock, swan, peacock body
  const bird = (name, o) => {
    begin(name);
    const nx = o.nx ?? 0.45, ny = o.ny ?? 0.5;
    if (o.legs !== false) { line([-0.05, -0.5, -0.02, -0.92, 0.12, -0.92], 0.05, C.och); line([-0.2, -0.5, -0.22, -0.92, -0.08, -0.92], 0.05, C.och); }
    if (o.tail === 'plume') for (let i = 0; i < 4; i++) limb([-0.5, -0.2, -0.75 - 0.05 * i, 0.15 + 0.14 * i, -0.95 + 0.06 * i, -0.05 + 0.2 * i], 0.06, i % 2 ? o.c2 : o.c);
    else fill(Pg(-0.5, -0.15, -0.92, 0.02, -0.55, -0.4), o.c, o.d);
    limb(o.sNeck ? [0.25, -0.15, 0.5, 0.1, 0.3, 0.35, nx - 0.1, ny - 0.1, nx, ny] : [0.25, -0.15, 0.36, 0.15, nx - 0.03, ny - 0.1, nx, ny], 0.13, o.c);
    fill(E(-0.1, -0.25, 0.5, 0.3, 0.12), o.c, o.d);
    fill(E(-0.15, -0.2, 0.3, 0.16, -0.15), o.c2 || o.c, o.d, 0.035);
    dots(-0.15, -0.2, 0.13, -0.02);
    if (o.comb) { fill(E(nx - 0.02, ny + 0.15, 0.12, 0.08, 0.3), C.ver, null, 0.03); fill(E(nx + 0.08, ny - 0.14, 0.05, 0.09), C.ver, null, 0.03); }
    if (o.crest) for (let i = -1; i <= 1; i++) { line([nx, ny + 0.05, nx + 0.1 * i, ny + 0.32], 0.025); dot(nx + 0.1 * i, ny + 0.34, 0.04, C.och); }
    fill(E(nx + 0.02, ny, 0.12, 0.1), o.c, o.d);
    fill(Pg(nx + 0.11, ny + 0.05, nx + 0.32, ny - 0.02, nx + 0.11, ny - 0.06), o.beak || C.och, null, 0.03);
    eye(nx + 0.04, ny + 0.02);
  };
  const paint = {
    shell() {
      begin('shell'); fill(E(0, 0, 0.9, 0.86), C.pink, C.pinkD);
      g.beginPath(); for (let i = 0; i <= 90; i++) { const th = (i / 90) * 5.6 * Math.PI, r = 0.86 * (1 - th / (6.3 * Math.PI)), x = r * Math.cos(th + 0.8), y = r * Math.sin(th + 0.8); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.lineWidth = 0.05; g.strokeStyle = C.sep; g.stroke();
      for (let i = 0; i < 9; i++) { const a = i * 0.7; dot(0.73 * Math.cos(a), 0.7 * Math.sin(a), 0.035); }
    },
    snail() {
      begin('snail');
      line([0.8, 0.45, 0.7, 0.9], 0.04); line([0.9, 0.42, 0.99, 0.82], 0.04); dot(0.7, 0.9, 0.05, C.sep); dot(0.99, 0.82, 0.05, C.sep);
      fill(Cv(-0.98, -0.62, -0.3, -0.4, 0.3, -0.36, 0.52, 0.0, 0.6, 0.42, 0.86, 0.52, 0.97, 0.3, 0.82, 0.05, 0.8, -0.4, 0.6, -0.7, -0.5, -0.72), C.pale, C.paleD);
      eye(0.82, 0.34); dots(0.2, -0.55, 0.2, 0.0);
    },
    knight() {
      begin('knight');
      fill(Pg(-0.05, -0.55, 0.3, -0.55, 0.36, -0.98, 0.62, -0.98, 0.62, -0.86, 0.5, -0.86, 0.42, -0.5), C.gry, null);
      fill(Pg(-0.36, -0.7, 0.36, -0.7, 0.3, 0.18, -0.3, 0.18), C.lap, C.lapD);
      line([0, -0.6, 0, 0.1], 0.07, C.wht); line([-0.2, -0.2, 0.2, -0.2], 0.07, C.wht);
      fill(E(-0.2, 0.9, 0.3, 0.09, 0.5), C.ver, null, 0.03);
      fill(Pg(-0.26, 0.18, 0.26, 0.18, 0.3, 0.72, 0, 0.88, -0.3, 0.72), C.wht, C.gry);
      line([0.0, 0.5, 0.28, 0.5], 0.06); dots(0.12, 0.33, 0.07, 0.0, 0.025);
    },
    lance() {
      begin('lance');
      fill(Pg(0.2, 0.04, 0.2, 0.34, -0.3, 0.3, -0.12, 0.2, -0.3, 0.1), C.ver, C.verD); dots(0.02, 0.2, 0.1, 0.0, 0.03);
      fill(Pg(-0.98, -0.035, 0.98, -0.012, 0.98, 0.012, -0.98, 0.035), C.wht, null, 0.03);
      for (let i = 0; i < 9; i++) line([-0.9 + i * 0.2, -0.02, -0.82 + i * 0.2, 0.02], 0.035, C.ver);
      fill(E(-0.5, 0, 0.1, 0.13), C.gry, null); fill(Pg(-0.75, -0.08, -0.5, -0.08, -0.5, 0.08, -0.75, 0.08), C.lap, null);
    },
    hare() {
      begin('hare');
      fill(E(-0.15, -0.6, 0.34, 0.3), C.tan, C.tanD); fill(E(-0.48, -0.66, 0.1, 0.1), C.wht, null, 0.03);
      fill(Pg(-0.2, -0.86, 0.35, -0.86, 0.42, -0.98, -0.2, -0.98), C.tan, null);
      fill(E(0.02, -0.15, 0.27, 0.52, -0.2), C.tan, C.tanD);
      fill(E(0.0, 0.76, 0.07, 0.26, 0.55), C.tan, C.tanD); fill(E(0.13, 0.8, 0.07, 0.26, 0.25), C.tan, C.tanD);
      fill(E(0.24, 0.42, 0.2, 0.16, 0.3), C.tan, C.tanD); eye(0.3, 0.46); dots(0.0, -0.2, 0.0, 0.18);
    },
    shield() {
      begin('shield'); limb([-0.6, 0, 0.3, 0.05], 0.1, C.tan);
      fill(Pg(0.1, 0.5, 0.9, 0.5, 0.9, -0.05, 0.5, -0.6, 0.1, -0.05), C.wht, C.gry);
      line([0.5, 0.42, 0.5, -0.42], 0.12, C.ver); line([0.18, 0.15, 0.82, 0.15], 0.12, C.ver);
    },
    pulpit() {
      begin('pulpit'); fill(Pg(-0.2, -0.98, 0.2, -0.98, 0.12, -0.3, -0.12, -0.3), C.brn, C.brnD);
      fill(Pg(-0.6, 0.3, 0.6, 0.3, 0.45, -0.35, -0.45, -0.35), C.lap, C.lapD);
      for (let i = -1; i <= 1; i++) { line([i * 0.3 - 0.1, -0.25, i * 0.3 - 0.1, 0.1, i * 0.3, 0.2, i * 0.3 + 0.1, 0.1, i * 0.3 + 0.1, -0.25], 0.03, C.wht); dot(i * 0.3, -0.05, 0.035); }
      fill(Pg(-0.68, 0.3, 0.68, 0.3, 0.68, 0.42, -0.68, 0.42), C.och, C.ochD);
    },
    fox() {
      begin('fox'); fill(E(-0.45, -0.5, 0.36, 0.17, 0.6), C.fox, C.foxD); fill(E(-0.7, -0.2, 0.1, 0.1), C.wht, null, 0.03);
      fill(E(0, -0.3, 0.3, 0.62), C.fox, C.foxD); fill(E(0.1, -0.2, 0.13, 0.4), C.wht, null, 0);
      fill(Pg(-0.12, 0.62, -0.1, 0.92, 0.06, 0.68), C.fox, null); fill(Pg(0.06, 0.66, 0.16, 0.92, 0.24, 0.62), C.fox, null);
      fill(Pg(-0.15, 0.3, 0.2, 0.68, 0.72, 0.36, 0.2, 0.22), C.fox, C.foxD); dot(0.7, 0.37, 0.04, C.sep); eye(0.22, 0.5);
      fill(Pg(-0.32, 0.25, 0.3, 0.25, 0.36, 0.12, -0.38, 0.12), C.wht, null, 0.03);
    },
    monkey() {
      begin('monkey'); limb([-0.35, -0.62, -0.7, -0.78, -0.92, -0.45, -0.78, -0.08, -0.6, -0.22], 0.07, C.brn);
      fill(Pg(-0.1, -0.74, 0.46, -0.74, 0.62, -0.95, -0.1, -0.95), C.brn, null);
      fill(E(-0.1, -0.35, 0.34, 0.5, -0.15), C.brn, C.brnD); fill(E(0.02, -0.32, 0.15, 0.3, -0.15), C.tan, null, 0);
      fill(E(-0.14, 0.42, 0.12, 0.12), C.brn, C.brnD); fill(E(-0.14, 0.42, 0.06, 0.06), C.pink, null, 0);
      fill(E(0.08, 0.4, 0.27, 0.25), C.brn, C.brnD); fill(E(0.25, 0.33, 0.17, 0.14), C.tan, C.tanD, 0.03);
      eye(0.16, 0.47); dot(0.37, 0.36, 0.025, C.sep); line([0.2, 0.27, 0.36, 0.27], 0.025);
      fill(Pg(-0.14, 0.6, 0.06, 0.9, 0.32, 0.58), C.ver, C.verD, 0.03); dot(0.06, 0.9, 0.05, C.och); dots(-0.12, -0.45, 0.0, 0.14, 0.03);
    },
    mArmPipe() {
      begin('mArmPipe'); fill(Pg(-0.9, -0.11, 0.15, -0.08, 0.15, 0.08, -0.9, 0.11), C.brn, C.brnD);
      fill(Pg(0.0, -0.05, 0.98, -0.14, 0.98, 0.14, 0.0, 0.05), C.och, C.ochD, 0.03); for (let i = 0; i < 3; i++) dot(0.35 + 0.18 * i, 0, 0.03, C.sep);
    },
    mArmStick() {
      begin('mArmStick'); line([0.1, 0, 0.92, 0.3], 0.1); line([0.1, 0, 0.92, 0.3], 0.05, C.wht); dot(0.92, 0.3, 0.08, C.och);
      fill(Pg(-0.9, -0.11, 0.2, -0.08, 0.2, 0.08, -0.9, 0.11), C.brn, C.brnD);
    },
    tabor() {
      begin('tabor'); fill(Pg(-0.7, -0.5, 0.7, -0.5, 0.7, 0.5, -0.7, 0.5), C.lap, C.lapD);
      for (let i = 0; i < 6; i++) line([-0.7 + i * 0.28, i % 2 ? 0.5 : -0.5, -0.42 + i * 0.28, i % 2 ? -0.5 : 0.5], 0.035, C.wht);
      fill(E(-0.7, 0, 0.16, 0.5), C.wht, C.gry); fill(E(0.7, 0, 0.16, 0.5), C.wht, C.gry); dots(0, 0.0, 0.3, 0.0, 0.035);
    },
    foxArm() { begin('foxArm'); fill(Pg(-0.9, -0.14, 0.6, -0.1, 0.9, 0.0, 0.6, 0.12, -0.9, 0.14), C.fox, C.foxD); fill(E(0.82, 0.0, 0.14, 0.13), C.wht, null, 0.03); },
    fan() {
      begin('fan'); fill(Pg(0, -0.95, -0.34, 0.72, -0.18, 0.93, 0.18, 0.93, 0.34, 0.72), C.grn, C.grnD);
      for (let i = -1; i <= 1; i++) line([0, -0.95, i * 0.2, 0.6], 0.025);
      fill(E(0, 0.55, 0.2, 0.25), C.och, C.ochD, 0.03); fill(E(0, 0.52, 0.11, 0.14), C.lap, null, 0.03); dot(0, 0.5, 0.04);
      dots(0, 0.0, 0.0, 0.2, 0.03);
    },
    dragon() {
      begin('dragon');
      for (const x of [-0.25, 0.3]) fill(Pg(x - 0.08, -0.3, x + 0.1, -0.3, x + 0.16, -0.82, x + 0.34, -0.9, x - 0.06, -0.9), C.ver, C.verD);
      fill(Pg(0.9, 0.42, 1.0, 0.2, 0.86, 0.36), C.ver, null, 0.03);
      fill(Cv(-0.98, -0.1, -0.5, 0.12, -0.1, -0.1, 0.3, 0.08, 0.48, 0.5, 0.78, 0.66, 0.98, 0.48, 0.76, 0.3, 0.62, -0.1, 0.3, -0.46, -0.2, -0.5, -0.62, -0.3), C.grn, C.grnD);
      for (let i = 0; i < 6; i++) dot(-0.6 + i * 0.2, -0.12 + 0.07 * Math.sin(i * 1.6), 0.035);
      fill(Pg(0.62, 0.66, 0.66, 0.86, 0.74, 0.66), C.grn, null, 0.03); eye(0.8, 0.52);
    },
    wing() {
      begin('wing'); fill(Pg(-0.8, -0.8, -0.5, 0.6, 0.0, 0.2, 0.3, 0.85, 0.6, 0.25, 0.95, 0.6, 0.7, -0.5, 0.2, -0.3, -0.2, -0.55), C.ver, C.verD);
      for (const [x, y] of [[-0.5, 0.6], [0.3, 0.85], [0.95, 0.6]]) line([-0.8, -0.8, x, y], 0.03);
      dots(0.2, 0.1, 0.16, 0.05, 0.035);
    },
    hull() {
      begin('hull'); fill(Pg(-0.05, 0.05, 0.05, 0.05, 0.04, 1.0, -0.04, 1.0), C.brn, null, 0.03);
      fill(Pg(-0.97, 0.1, -0.74, -0.46, 0.7, -0.46, 0.98, 0.16, 0.74, 0.1, 0.74, 0.38, 0.44, 0.38, 0.44, 0.08, -0.56, 0.08, -0.56, 0.32, -0.9, 0.32), C.brn, C.brnD);
      for (const y of [-0.08, -0.26]) line([-0.84 - y * 0.4, y, 0.84 + y * 0.5, y], 0.025);
      for (let i = 0; i < 8; i++) dot(-0.7 + i * 0.2, -0.17, 0.025);
      for (const x of [0.5, 0.62, -0.84, -0.7]) fill(Pg(x - 0.04, 0.38 - (x < 0 ? 0.06 : 0), x + 0.04, 0.38 - (x < 0 ? 0.06 : 0), x + 0.04, 0.48 - (x < 0 ? 0.06 : 0), x - 0.04, 0.48 - (x < 0 ? 0.06 : 0)), C.och, null, 0.025);
    },
    sail() {
      begin('sail'); fill(Cv(-0.8, 0.8, 0.0, 0.84, 0.8, 0.8, 0.9, 0.0, 0.7, -0.75, 0.0, -0.6, -0.7, -0.75, -0.9, 0.0), C.wht, C.gry);
      g.save(); g.beginPath(); Cv(-0.8, 0.8, 0.0, 0.84, 0.8, 0.8, 0.9, 0.0, 0.7, -0.75, 0.0, -0.6, -0.7, -0.75, -0.9, 0.0)(); g.clip();
      for (const x of [-0.45, 0, 0.45]) line([x, 0.9, x * 1.05, -0.9], 0.13, C.ver);
      g.restore(); line([-0.88, 0.82, 0.88, 0.82], 0.06, C.brn);
    },
    pennant() {
      begin('pennant'); fill(Pg(-0.95, 0.3, 0.95, 0.0, -0.95, -0.3), C.wht, null);
      g.save(); g.beginPath(); Pg(-0.95, 0.3, 0.95, 0.0, -0.95, -0.3)(); g.clip();
      for (let i = 0; i < 5; i++) line([-0.8 + i * 0.4, 0.4, -0.8 + i * 0.4, -0.4], 0.2, C.ver);
      g.restore(); g.beginPath(); Pg(-0.95, 0.3, 0.95, 0.0, -0.95, -0.3)(); g.lineWidth = 0.04; g.strokeStyle = C.sep; g.stroke();
    },
    castle() {
      begin('castle');
      const tower = (x, w, y0, y1, roof) => {
        const q = [x - w, y0, x - w, y1]; for (let i = 0; i < 3; i++) { const a = x - w + (2 * w * (i * 2)) / 5, b = x - w + (2 * w * (i * 2 + 1)) / 5; q.push(a, y1 + 0.08, b, y1 + 0.08, b, y1, Math.min(x + w, b + (2 * w) / 5), y1); }
        q.push(x + w, y0); fill(Pg(...q), C.wht, C.gry);
        if (roof) fill(Pg(x - w * 1.2, y1 + 0.08, x, y1 + 0.5, x + w * 1.2, y1 + 0.08), roof, null);
        fill(Pg(x - 0.035, y1 - 0.34, x + 0.035, y1 - 0.34, x + 0.035, y1 - 0.12, x - 0.035, y1 - 0.12), C.lamp, null, 0.02);
      };
      tower(-0.6, 0.2, -0.95, 0.2, C.lap); tower(0.6, 0.2, -0.95, 0.2, C.ver); tower(0, 0.42, -0.95, -0.05, null); tower(0, 0.24, -0.1, 0.45, C.lap);
      fill(Pg(-0.14, -0.95, -0.14, -0.6, 0, -0.45, 0.14, -0.6, 0.14, -0.95), C.sep, null, 0);
      for (const x of [-0.28, 0.28]) fill(Pg(x - 0.035, -0.5, x + 0.035, -0.5, x + 0.035, -0.28, x - 0.035, -0.28), C.lamp, null, 0.02);
      line([0, 0.9, 0, 1.0], 0.03); fill(Pg(0, 1.0, 0.25, 0.93, 0, 0.86), C.ver, null, 0.025);
    },
    mill() {
      begin('mill'); fill(Pg(-0.42, -0.98, 0.42, -0.98, 0.26, 0.3, -0.26, 0.3), C.wht, C.gry);
      fill(Pg(-0.36, 0.3, 0, 0.72, 0.36, 0.3), C.ver, C.verD);
      fill(Pg(-0.1, -0.98, -0.1, -0.66, 0, -0.56, 0.1, -0.66, 0.1, -0.98), C.sep, null, 0);
      fill(E(0, -0.2, 0.07, 0.09), C.lamp, null, 0.025); dots(0, 0.05, 0.12, 0, 0.03);
      begin('millSails');
      for (let i = 0; i < 4; i++) {
        g.save(); g.rotate((i * Math.PI) / 2); line([0, 0, 0.95, 0], 0.05, C.brn);
        fill(Pg(0.22, 0.03, 0.95, 0.03, 0.95, 0.3, 0.22, 0.3), C.wht, null, 0.03);
        for (let j = 1; j < 5; j++) line([0.22 + j * 0.146, 0.03, 0.22 + j * 0.146, 0.3], 0.02); line([0.22, 0.165, 0.95, 0.165], 0.02);
        g.restore();
      }
      dot(0, 0, 0.09, C.och);
    },
  };
  return { g, cv, rects, paint, beast, bird, finish() { if (open) g.restore(); open = false; } };
}

// ---------------------------------------------------------------- the world
const HOURS = [
  { name: 'candle', room: '#24170E', glow: '#6a3410', light: '#FFC98A', I: 1.0, tint: [1.0, 1.0, 1.0], shadow: '#C4AD7C', fog: '#DCCBA2', el: 0.35, grade: '#fff6e6', paint: [1, 1, 1], shelf: 0.2, win: '#26335c' },
  { name: 'cloister morning', room: '#2c3440', glow: '#5f7890', light: '#EEF4FF', I: 0.9, tint: [0.93, 0.92, 0.88], shadow: '#8E9288', fog: '#DAD5C0', el: 0.56, grade: '#f6f8ff', paint: [0.96, 0.99, 1.04], shelf: 0.2, win: '#4e5d74' },
  { name: 'rose dawn', room: '#3a2030', glow: '#a04c5c', light: '#FF9C62', I: 0.75, tint: [1.0, 0.925, 0.9], shadow: '#C7A698', fog: '#E2C6B4', el: 0.24, grade: '#fff0ec', paint: [1.04, 0.96, 0.97], shelf: 0.24, win: '#a8505c' },
];
const SEASONS = [
  { name: 'spring', leaf: [0.42, 0.58, 1.5, 0.9], leafCol: '#2F7D5B', leafCol2: '#3E9160', flA: '#3557C4', petals: 5, flB: 0, flBCol: '#C7361F', vine: '#2F7D5B' },
  { name: 'August', leaf: [0.25, 0.75, 0.5, 1.4], narrow: 2.6, leafCol: '#6E8F3A', leafCol2: '#B9963A', flA: '#C7361F', petals: 4, flB: 1, flBCol: '#D9A441', vine: '#5F8A3E' },
  { name: 'autumn', leaf: [0.45, 0.55, 2.5, 0.8], leafCol: '#3F7A4A', leafCol2: '#B5522A', flA: '#E9E2CF', petals: 5, flB: 2, flBCol: '#6B3A8E', vine: '#5A6B33' },
  { name: 'winter', leaf: [0.5, 0.45, 3.5, 2.5], leafCol: '#1F5F45', leafCol2: '#2A6E4E', flA: '#EFEADB', petals: 6, flB: 3, flBCol: '#C7361F', vine: '#27634A' },
];

export default {
  id: 'gilded-margin',
  name: 'The Gilded Margin',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const R = { text: rng.fork('text'), vine: rng.fork('vine'), cast: rng.fork('cast'), fly: rng.fork('fly'), misc: rng.fork('misc') };
    // ---- what kind of visit this is
    const hourI = vary.hour === 'night' || vary.hour === 'golden' ? 0 : vary.hour === 'day' ? 1 : vary.hour === 'dawn' ? 2 : rng.pick([1, 0, 2]);
    const H = HOURS[hourI], SE = SEASONS[rng.int(0, 3)], seasonI = SEASONS.indexOf(SE);
    const jr = rng();
    const cast = { joust: jr < 0.42 ? 'joust' : jr < 0.72 ? 'fox' : 'monkeys', chase: rng.chance(0.55) ? 'hound' : 'cat', dragon: rng.chance(0.6), ship: rng.chance(0.65) };
    const gustOn = rng.chance(0.45), rare = !!vary.rare, az0 = rng.sign() * rng.range(0.22, 0.4);
    const col = (h) => new THREE.Color(h);
    const pal = PALETTE.map(col);
    pal[2].offsetHSL(rng.range(-0.015, 0.015), 0, rng.range(0, 0.03)); pal[4].offsetHSL(rng.range(-0.008, 0.008), 0, 0);

    const scene = new THREE.Scene();
    scene.background = col(H.room);
    scene.fog = new THREE.Fog(col(H.fog), 135, 1250);     // a little heavy, so the far page softens like a miniature
    const U = {
      uTime: { value: 0 }, uGust: { value: 0 }, uU: { value: 0 }, uCandleI: { value: 1 }, uFlare: { value: 0 },
      uCandleDir: { value: new THREE.Vector3(Math.cos(H.el), Math.sin(H.el), 0) }, uCandleCol: { value: col(H.light) },
      uShadowCol: { value: col(H.shadow) }, uSepia: { value: pal[5] }, uWhite: { value: col('#F6F0E0').multiplyScalar(0.86) },
      uPaint: { value: new THREE.Color(H.paint[0], H.paint[1], H.paint[2]) }, uGold: { value: pal[6] },
    };
    const PIG = { uLapis: { value: pal[2] }, uVerm: { value: pal[4] }, uVine: { value: col(SE.vine) } };
    const uBlockFlare = { value: 0 };
    const mk = (vs, fs, uniforms = {}, o = {}) => new THREE.ShaderMaterial({
      vertexShader: G_VPARS + vs, fragmentShader: G_FPARS + fs, uniforms: { ...fogU(), ...U, ...PIG, ...uniforms }, fog: true, side: THREE.DoubleSide, ...o });
    const mkShadow = (vs, fs, uniforms = {}) => mk(vs, fs, uniforms, { defines: { SHADOW: 1 }, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
    const addShadow = (mesh, mat) => {
      const s = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, mat, mesh.count) : new THREE.Mesh(mesh.geometry, mat);
      if (mesh.isInstancedMesh) s.instanceMatrix = mesh.instanceMatrix;
      s.position.copy(mesh.position); s.quaternion.copy(mesh.quaternion); s.frustumCulled = false; s.renderOrder = 1; scene.add(s);
      return s;
    };

    await ctx.yield();
    // ---- the flight
    const heroY = pageH0(HERO_X, HERO_Z) - 0.4, PY = heroY + 45;
    // (the way in is a short run over the writing: the flight is above the lines, not between walls of ink)
    const path = makePath([[205, 9, 298], [262, 10, 298], [318, 11, 298.5], [352, 12, 303], [380, 17, 318], [396, 19, 345],
      [400, 16.5, 385], [400, 15, 430], [398, 15, 475], [396, 15, 520], [392, 13.5, 553], [378, 10.5, 574], [352, 8.5, 582], [318, 9.5, 583], [284, 13, 578],
      [256, 25, 549], [232, 39.5, 515], [204, PY - 0.5, 501.5], [185, PY, 500], [150, PY, 500], [HERO_X, PY, HERO_Z]]);
    const uNear = (x, z) => path.nearestXZ(x, z).u;
    // the script of this page was timed on a route 882 m long; the alley has since been cut short. PU turns today's u
    // into that page-u (same distance from the portal), MU turns a page-u into today's u.
    const LK = path.length / 882.33, PU = (u) => 1 - (1 - u) * LK, MU = (uo) => clamp(1 - (1 - uo) / LK, 0, 1);
    const bump = (u, a, b, w) => smoothstep(a - w, a + w, u) * (1 - smoothstep(b - w, b + w, u));
    const _pp = new THREE.Vector3();

    await ctx.yield();
    // ---- vellum and the dark room
    const vg = new THREE.PlaneGeometry(834, 730, 167, 146); vg.rotateX(-Math.PI / 2); vg.translate(87, 0, 360);
    await ctx.yield();
    const uInk = { value: new THREE.Vector4(596, 596, rng.range(0, TAU), 0) }, uBeam = { value: new THREE.Vector4(300, 380, hourI === 1 ? 1 : 0, 0.5) };
    const uBarG = { value: 0 };
    const uPaw = { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) };
    const BX = Math.round(R.misc.range(245, 252)), BZ = 286.5, uB = uNear(BX, 298);
    const vellum = new THREE.Mesh(vg, mk(VELLUM_VS, VELLUM_FS, { uVellum: { value: pal[0].clone() }, uPageTint: { value: new THREE.Color(H.tint[0], H.tint[1], H.tint[2]) },
      uBeamCol: { value: col(H.light) }, uInk, uBeam, uPaw, uSeason: { value: seasonI }, uBlockFlare, uHeroXZ: { value: BX }, uBarG }, { side: THREE.FrontSide }));
    vellum.frustumCulled = false; scene.add(vellum);
    await ctx.yield();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 20), new THREE.ShaderMaterial({
      uniforms: { uRoom: { value: col(H.room) }, uRoomGlow: { value: col(H.glow) }, uCandleDir: U.uCandleDir, uCandleCol: U.uCandleCol, uTime: U.uTime, uCandleI: U.uCandleI, uHour: { value: hourI }, uShelf: { value: H.shelf }, uWin: { value: col(H.win) } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: ROOM_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---- the text: rows of standing minims, never forming letters; line-fillers; the foliate block
    const HT = 1.25, cP = [], cR = [], cD = [], near = { M: [], T: [] }, far = { M: [], T: [] }; let cur = far;
    const INK = [0.015, 0.0115, 0.009], RED = [pal[4].r, pal[4].g, pal[4].b], BLU = [pal[2].r * 1.3, pal[2].g * 1.3, pal[2].b * 1.3];
    const put = (x, z, sx, sy, sz, tint) => { cur.M.push(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, x, pageH0(x, z) - 0.4, z, 1); cur.T.push(tint[0], tint[1], tint[2]); };
    // a line-filler: a pleated garland of red and blue lobes (cards of kind 4, drawn in CARD_FS)
    const filler = (xa, xb, zc, size = 3.1) => {
      for (let xf = xa, i = 0; xf < xb; xf += size * 0.74, i++) { cP.push(xf, pageH0(xf, zc) - 0.15, zc); cR.push(i % 2 ? 0.62 : -0.62, 0, size); cD.push(4, -1, (i % 2 ? 0.75 : 0.25) + 0.2 * R.text(), 1.45); }
    };
    const row = (zc, x0, x1, sz, plain, ht = HT) => {
      const T = R.text; let x = x0 + T.range(0, 3);
      const end = T.chance(0.3) ? T.range(x0 + (x1 - x0) * 0.68, x1 - 12) : x1;
      while (x < end) {
        const n = T.int(2, 7), rb = T.chance(0.05), rc = T.chance(0.6) ? RED : BLU, rub = rb && cur === near;   // no lone coloured slabs far off
        for (let i = 0; i < n && x < end; i++) {
          const asc = !plain && T.chance(0.07), dsc = !plain && !asc && T.chance(0.04);
          put(x, zc + T.range(-0.15, 0.15) + (asc ? -sz * 0.32 : dsc ? sz * 0.3 : 0), 1.25, (asc ? ht * 1.35 : ht) * T.range(0.96, 1.05), sz * (asc || dsc ? 1.62 : 1), rub ? rc : INK);
          x += T.range(2.5, 3.1);
        }
        x += T.range(3.4, 6);
      }
      if (end < x1) filler(end + 3, x1 - 1, zc, ht < 4 ? 2.3 : 3.1);
    };
    // the first text block; the flight alley runs between rows 16 and 17, and the entry end of the rows beside it is
    // left unwritten: a clearing of flourishes, vine and gold where the world is first seen
    for (let k = 0; k < 26; k++) {
      const z = 67 + 14 * k; cur = k >= 14 && k <= 19 ? near : far;
      if (k === 16) row(290.2, BX + 11, 330, 3.6, true);
      else if (k === 17) row(305.8, 244, 330, 3.6, true);
      else if (k === 15 || k === 18) row(z, 257, 330, 5, true);
      else row(z, 50, 330, 5, false, k >= 20 ? 0.95 : HT);      // the rows seen from the Initial's side are written lower
      if (k >= 15 && k <= 18) { cur = far; row(k === 16 ? 290.2 : k === 17 ? 305.8 : z, 50, 186, k === 16 || k === 17 ? 3.6 : 5, true); }   // behind the way in
    }
    await ctx.yield();
    filler(196, BX - 10, 288.2, 2.7); filler(196, 240, 307.8, 2.7);
    // (the second block, headed by the Great Initial, is written flat on the page: see VELLUM_FS)
    const uVellum = { value: pal[0] }, inkMat = mk(INK_VS, INK_FS, { uVellum }), inkShadow = mkShadow(INK_VS, INK_FS, { uVellum }), gShadow = minimGeometry(false);
    for (const [L, g] of [[near, minimGeometry(true)], [far, minimGeometry(false)]]) {
      const n = L.T.length / 3, m = new THREE.InstancedMesh(g, inkMat, n);
      m.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(L.M), 16);
      g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(L.T), 3));
      m.frustumCulled = false; scene.add(m);
      const sh = new THREE.InstancedMesh(gShadow, inkShadow, n); sh.instanceMatrix = m.instanceMatrix; sh.frustumCulled = false; sh.renderOrder = 1; scene.add(sh);
    }
    await ctx.yield();
    const block = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 3), mk(BLOCK_VS, BLOCK_FS, { uBlockFlare }));
    block.position.set(BX, pageH0(BX, BZ) + 6.8, BZ); block.rotation.y = -0.5; scene.add(block);     // turned to face the way in
    const flatShadow = mkShadow(BLOCK_VS, BLOCK_FS, { uBlockFlare });
    addShadow(block, flatShadow);
    await ctx.yield();

    // ---- the Great Initial
    const hero = await buildHero(ctx, { palette: PALETTE, candleDir: [Math.cos(H.el) * Math.cos(az0), Math.sin(H.el), Math.cos(H.el) * Math.sin(az0)], glow: false, demo: false });
    hero.object.position.set(HERO_X, heroY, HERO_Z); hero.object.rotation.y = Math.PI / 2; scene.add(hero.object);
    hero.uniforms.uPaint.value.copy(U.uPaint.value);
    hero.uniforms.uCandleCol.value.copy(U.uCandleCol.value);
    const heroPlane = new THREE.Mesh(new THREE.PlaneGeometry(90, 90).translate(0, 45, 0), flatShadow);
    heroPlane.position.copy(hero.object.position); heroPlane.rotation.y = Math.PI / 2; heroPlane.frustumCulled = false; heroPlane.renderOrder = 1; scene.add(heroPlane);
    await ctx.yield();

    // ---- vines that grow ahead of the camera, their leaves, gold ivy, flowers and fruit
    const tubes = makeTubes(), V = R.vine, LEAD = 0.085;
    const inkPh = uInk.value.z, inkX = (z) => INK_X + 5 * Math.sin(z * 0.035 + inkPh), inkU = (z) => MU(0.40 + ((596 - z) / 346) * 0.24);
    const addCard = (kind, x, y, z, yaw, lean, size, birth, asp = 1) => { cP.push(x, y, z); cR.push(yaw, lean, size); cD.push(kind, birth, V(), asp); };
    const facePath = (x, z) => { path.pointAt(uNear(x, z), _pp); return Math.atan2(_pp.x - x, _pp.z - z); };
    const bloom = (x, y, z, birth, big = 1) => {
      const size = (x > 338 && z > 335 && z < 600 ? V.range(6, 9) : V.range(4.2, 6)) * big, asp = V.range(1.5, 2.0);
      if (path.distanceTo(x, y + size * asp * 0.5, z) < size * asp * 0.5 + 7) return;
      addCard(V.chance(0.5) ? 2 : 3, x, y - 0.3, z, facePath(x, z) + V.range(-0.35, 0.35), V.range(-0.1, 0.12), size, birth, asp);
    };
    const leafAt = (p, psi, side, birth, size) => path.distanceTo(p[0], p[1] + size * 0.5, p[2]) > size * 0.5 + 4.5 && addCard(V.chance(0.17) ? 1 : 0, p[0], p[1] + 0.15, p[2], Math.PI / 2 - (psi + side * V.range(0.9, 1.35)), V.range(0.7, 1.15), size, birth);
    const scroll = (x, z, psi, curl, rho0, turns, ok, lift = 2.2) => {
      const pts = [[x, pageH0(x, z) + 0.5, z]], ds = 1.5, tot = turns * TAU; let turned = 0;
      while (turned < tot && pts.length < 60) {
        const rho = Math.max(1.3, rho0 * (1 - 0.75 * turned / tot));
        psi += (curl * ds) / rho; turned += ds / rho; x += Math.cos(psi) * ds; z += Math.sin(psi) * ds;
        if (ok && !ok(x, z)) return null;
        pts.push([x, pageH0(x, z) + 0.5 + (lift * turned) / tot, z]);
      }
      return pts;
    };
    const branch = (p, psi, side, b0, ok, r = 0.4, rho0 = V.range(6.5, 10), leaf = 4) => {
      let pts = null;
      for (let k = 0; k < 3 && !pts; k++) { pts = scroll(p[0], p[2], psi + side * V.range(0.5, 0.9), -side, rho0, V.range(1.2, 1.7), ok); rho0 *= 0.7; }
      if (!pts || pts.length < 6) return;
      pts[0][1] = p[1];
      tubes.add(pts, r, r * 0.45, (i) => b0 + i * 0.0011);
      for (let i = 2; i < pts.length - 2; i += 3) {
        const q = pts[i], a = Math.atan2(pts[i + 1][2] - pts[i - 1][2], pts[i + 1][0] - pts[i - 1][0]);
        leafAt(q, a, side, b0 + i * 0.0011 + 0.012, V.range(0.8, 1.2) * leaf);
      }
      const e = pts[pts.length - 1];
      if (leaf >= 3) bloom(e[0], e[1], e[2], Math.max(b0 + pts.length * 0.0011, uNear(e[0], e[2]) - 0.045));
    };
    const stem = (fn, len, ok, birth = (x, z) => uNear(x, z) - LEAD, r = 0.5) => {
      const n = Math.ceil(len / 1.5), pts = [];
      for (let i = 0; i <= n; i++) { const [x, z] = fn(i / n); pts.push([x, pageH0(x, z) + 0.55, z]); }
      const bs = pts.map((p) => birth(p[0], p[2]));
      tubes.add(pts, r, r * 0.8, (i) => bs[i]);
      let nextB = V.range(5, 12), nextL = 2, side = V.sign(), ls = 1;
      for (let i = 1; i < n; i++) {
        const arc = i * 1.5, psi = Math.atan2(pts[i + 1][2] - pts[i - 1][2], pts[i + 1][0] - pts[i - 1][0]);
        if (arc > nextL) { nextL += V.range(3.4, 4.8) / density; ls = -ls; leafAt(pts[i], psi, ls, bs[i] + 0.012, V.range(3.2, 4.8)); }
        if (arc > nextB) { nextB += V.range(13, 19) / density; side = -side; branch(pts[i], psi, side, bs[i] + 0.004, ok); }
      }
    };
    const ph = () => V.range(0, TAU), okMargin = (x, z) => x > 338 && x < 468 && z > 25 && z < 596;
    { const a = ph(); stem((t) => { const z = 250 + 310 * t; return [398 + 9 * Math.sin(z * 0.03 + a), z]; }, 315, okMargin); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 40 + 550 * t; return [352 + 5 * Math.sin(z * 0.027 + a), z]; }, 555, okMargin); }
    await ctx.yield();
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 60 + 530 * t; return [423 + 6 * Math.sin(z * 0.024 + a), z]; }, 535, okMargin); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 40 + 215 * t; return [380 + 7 * Math.sin(z * 0.033 + a), z]; }, 220, okMargin); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 40 + 550 * t; return [447 + 5 * Math.sin(z * 0.031 + a), z]; }, 555, okMargin); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const x = 455 - 435 * t; return [x, 591 + 2.5 * Math.sin(x * 0.04 + a)]; }, 440, (x, z) => z > 576 && z < 597.5 && x > 8 && x < 470); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 452 + 96 * t; return [131.5 + 2 * Math.sin(z * 0.08 + a), z]; }, 98, (x, z) => x > 124 && x < 141, (x, z) => MU(0.6 + 0.0028 * Math.abs(z - 500)), 0.42); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const z = 380 + 300 * t; return [28 + 5 * Math.sin(z * 0.03 + a), z]; }, 302, (x, z) => x > 6 && x < 47, (x, z) => MU(0.56 + (z - 380) * 0.0008)); }
    await ctx.yield();
    { const a = ph(); stem((t) => { const x = 482 - 464 * t; return [x, 656 + 7 * Math.sin(x * 0.03 + a)]; }, 470, (x, z) => z > 627 && z < 713 && x > 6 && x < 494); }
    await ctx.yield();
    await ctx.yield();
    // the wreath the chase runs round, the castle's tendril, the windmill's stalk, the dragon's tail
    // (the wreath stands across the foot of the margin, at the end of the tendril the flight follows: the chase is
    // centre frame all the way down, the ship sails past behind it, and the route turns west in front of it)
    const WR = { x: 406, y: 16.2, z: 590, r: 13.5, yaw: Math.PI + 0.3 };
    { const b = uNear(WR.x, WR.z) - 0.36, a = [], c = [], ex = Math.cos(WR.yaw), ez = -Math.sin(WR.yaw), nx = Math.sin(WR.yaw), nz = Math.cos(WR.yaw);
      for (let i = 0; i <= 50; i++) { const an = (i / 48) * TAU, sa = Math.sin(an); a.push([WR.x + ex * WR.r * sa, WR.y + WR.r * Math.cos(an), WR.z + ez * WR.r * sa]);
        const rr = WR.r + 0.8 * Math.cos(an * 7), w = 0.8 * Math.sin(an * 7); c.push([WR.x + ex * rr * sa + nx * w, WR.y + rr * Math.cos(an), WR.z + ez * rr * sa + nz * w]); }
      tubes.add(a, 0.8, 0.8, () => b); tubes.add(c, 0.42, 0.42, (i) => b + i * 0.0006);
      tubes.add([[WR.x, pageH0(WR.x, WR.z), WR.z], [WR.x + nx * 0.4, 1.4, WR.z + nz * 0.4], [WR.x, WR.y - WR.r, WR.z]], 0.7, 0.55, () => b);
      // two tall blooms beside the way down, a near layer in front of the wreath
      for (const [x, z, sz] of [[380, 545, 6.6], [414, 567, 5.8]]) addCard(V.chance(0.5) ? 2 : 3, x, pageH0(x, z) - 0.3, z, Math.PI + V.range(-0.25, 0.25), V.range(-0.06, 0.08), sz, uNear(x, z) - 0.2, 2.1);
      // the wreath's leaves, turned up the margin toward the way we come, some of them gold
      for (let i = 1; i < 48; i += 2) { if (i > 19 && i < 29) continue; const q = a[i], out = i > 12 && i < 36 ? -1 : 1;
        addCard(i % 6 === 1 ? 1 : 0, q[0], q[1] + (out < 0 ? -0.3 : 0.3), q[2], WR.yaw + (out < 0 ? Math.PI : 0) + V.range(-0.3, 0.3), out < 0 ? Math.PI - V.range(0.05, 0.3) : V.range(0.05, 0.3), V.range(3.2, 4.4), b + 0.03 + i * 0.0012); } }
    const CA = { x: 428, z: 552, top: 15.5 };      // ahead of the flight down the margin, where the route turns west
    { const b = uNear(CA.x, CA.z) - 0.13, a = [], g0 = pageH0(CA.x, CA.z);
      for (let i = 0; i <= 60; i++) { const t = i / 60, an = t * 3 * TAU, rad = 6 * (1 - 0.8 * t); a.push([CA.x + rad * Math.cos(an), g0 + 0.4 + CA.top * Math.pow(t, 0.9), CA.z + rad * Math.sin(an)]); }
      tubes.add(a, 0.9, 0.55, (i) => b + i * 0.0006); }
    const MI = { x: 350, z: 518, top: 9.5 };
    { const b = uNear(MI.x, MI.z) - 0.13, g0 = pageH0(MI.x, MI.z);
      tubes.add([[MI.x - 2, g0 + 0.3, MI.z + 3], [MI.x - 0.5, g0 + 2.5, MI.z + 1.5], [MI.x + 0.4, g0 + 5, MI.z + 0.3], [MI.x, g0 + MI.top, MI.z]], 0.6, 0.45, () => b);
      addCard(0, MI.x - 5, g0 + MI.top - 1.4, MI.z, Math.PI / 2, 1.3, 16, b + 0.01); addCard(0, MI.x + 1, g0 + MI.top - 1.2, MI.z, -Math.PI / 2, 1.2, 10, b + 0.02); }
    const DR = { x: 448, z: 476 };
    if (cast.dragon) {
      const g0 = pageH0(DR.x, DR.z), a = [], b0 = uNear(DR.x, DR.z) - 0.075;
      for (let i = 0; i <= 18; i++) { const t = i / 18, z = DR.z - 8.5 - 32 * t, x = DR.x + 4 * Math.sin(t * 4.2); a.push([x, lerp(g0 + 7, pageH0(x, z) + 0.5, ease(t * 1.7)), z]); }
      tubes.add(a, 1.1, 0.5, (i) => b0 + i * 0.0012);
      for (let i = 4; i < 18; i += 3) leafAt(a[i], -Math.PI / 2, i % 2 ? 1 : -1, b0 + i * 0.0012 + 0.012, V.range(2.6, 3.6));
      branch(a[18], -Math.PI / 2, V.sign(), b0 + 0.022, okMargin, 0.42, 9);
    }
    await ctx.yield();
    // tall acanthus standards: a swaying stem with a scrolling volute to either side by turns, big two-tone leaves, a
    // bloom in the eye of each scroll and one gold terminal leaf. They stand in the plane (dx, dz), turn their leaves
    // toward `yaw`, and grow by birth(t), t = 0 at the foot .. 1 at the tip.
    const standard = (x, z, Hh, dx, dz, yaw, birth, gold = 0.12, leafK = 1, stemK = 1) => {
      const g0 = pageH0(x, z), n = 26, sp = [], sc = Hh / 30, lk = sc * leafK, clear = (q, y, r) => path.distanceTo(q[0], y, q[2]) > r;
      const sway = V.sign() * Hh * 0.045, pa = V.range(0, 1);
      for (let i = 0; i <= n; i++) { const t = i / n, o = sway * Math.sin(t * 5.2 + pa) * (0.3 + 0.7 * t); sp.push([x + dx * o, g0 + 0.3 + Hh * t, z + dz * o]); }
      tubes.add(sp, 0.95 * sc * stemK, 0.4 * sc * stemK, (i) => birth(i / n));
      let side = V.sign();
      for (const t0 of [0.16, 0.34, 0.52, 0.68, 0.82]) {
        side = -side;
        const p0 = sp[Math.round(t0 * n)], rho0 = Hh * (0.2 - 0.09 * t0) * V.range(0.85, 1.1), tot = V.range(1.25, 1.55) * TAU, ds = rho0 / 6, pts = [[p0[0], p0[1], p0[2]]];
        let psi = V.range(0.45, 0.75), s = 0, y = p0[1], turned = 0;
        while (turned < tot && pts.length < 64) {
          const rho = Math.max(rho0 * 0.1, rho0 * (1 - 0.8 * turned / tot)), st = Math.min(ds, rho * 0.55);
          psi += st / rho; turned += st / rho; s += Math.cos(psi) * st; y += Math.sin(psi) * st;
          pts.push([p0[0] + dx * side * s, Math.max(y, g0 + 0.6), p0[2] + dz * side * s]);
        }
        const b0 = birth(t0) + 0.006, bt = (i) => b0 + i * 0.0009;
        tubes.add(pts, 0.6 * sc * stemK, 0.26 * sc * stemK, bt);
        for (let i = 2; i < pts.length - 3; i += 3) {
          const q = pts[i], size = V.range(5, 7.5) * lk * (1.05 - 0.4 * t0);
          if (clear(q, q[1] + size * 0.5, size * 0.5 + 5)) addCard(V.chance(gold) ? 1 : 0, q[0], q[1], q[2], yaw + V.range(-0.45, 0.45), V.range(-0.15, 0.5), size, bt(i) + 0.012);
        }
        const e = pts[pts.length - 1], bs = V.range(5.5, 7) * lk;
        if (clear(e, e[1], bs * 0.5 + 6)) addCard(gold >= 1 ? 1 : V.chance(0.5) ? 2 : 3, e[0], e[1] - bs * (gold >= 1 ? 0.3 : 0.9), e[2], yaw + V.range(-0.2, 0.2), V.range(-0.05, 0.1), bs, bt(pts.length) + 0.01, gold >= 1 ? 1 : 1.25);
      }
      const top = sp[n];
      addCard(1, top[0], top[1] - 0.5 * sc, top[2], yaw + V.range(-0.15, 0.15), 0.08, 10 * lk, birth(1) + 0.01);
    };
    // five down the margin, by turns west and east of the flight, a beat ahead of it: the mid layer that breaks the
    // horizon into the dark room (the west ones stand beyond the quill's line, the east ones south of the joust)
    for (const [x, z, Hh] of [[358, 374, 31], [357, 426, 35], [424, 464, 30], [359, 478, 33], [437, 503, 36]]) {
      const ub = uNear(x, z);
      standard(x, z, Hh * V.range(0.94, 1.06), 1, 0, Math.atan2(399 - x, -45), (t) => ub - 0.2 + 0.05 * t);
      await ctx.yield();
    }
    // two of gold ivy, already grown, either side of the way in
    standard(227, 285.2, 19, 0, 1, -Math.PI / 2, () => -1, 1, 0.82);
    standard(238, 310.8, 20.5, 0, 1, -Math.PI / 2, () => -1, 1, 0.82);
    await ctx.yield();
    // and two that climb beside the Great Initial as it comes into view, widening it against the wall
    for (const z of [431, 569]) { standard(124, z, 76, 0, 1, Math.PI / 2, (t) => MU(0.57 + 0.15 * t), 0.28, 0.72, 0.62); await ctx.yield(); }
    await ctx.yield();
    // more standing blooms beside the flight down the margin
    for (let z = 352; z < 566; z += V.range(11, 16)) for (const sd of [-1, 1]) {
      const u0 = uNear(399, z); path.pointAt(u0, _pp);
      const x = _pp.x + sd * V.range(13, 25);
      bloom(x, pageH0(x, z), z, u0 - V.range(0.1, 0.16));
    }
    await ctx.yield();
    // shoots that burst from the quill's wet line
    for (let z = 586; z > 256; z -= V.range(8, 13) / density) {
      const x = inkX(z), s = V.sign();
      branch([x, pageH0(x, z) + 0.4, z], s > 0 ? 0 : Math.PI, V.sign(), inkU(z) + 0.012, null, 0.26, V.range(3, 4.6), 2);
    }
    await ctx.yield();
    // the clearing at the way in: two vines, already grown, with gold ivy and blooms, behind the flourishes
    for (const [zc, zlo, zhi] of [[280.5, 271.5, 286], [315.5, 310, 326.5]]) {
      const a = ph(), xe = zc < 298 ? BX - 12 : 253, okE = (x, z) => x > 195 && x < xe + 2 && z > zlo && z < zhi;
      stem((t) => { const x = 198 + (xe - 198) * t; return [x, zc + 1.6 * Math.sin(x * 0.11 + a)]; }, xe - 198, okE, () => -1, 0.45);
      for (let x = 204, i = 0; x < xe; x += V.range(4.5, 7), i++) {      // gold ivy: upright leaves turned to the way in, and flat ones that mirror the flame
        const z = zc + 1.6 * Math.sin(x * 0.11 + a) + (zc < 298 ? 1 : -1) * V.range(0.5, 2.5), flat = i % 2 === 1;
        addCard(1, x, pageH0(x, z) + (flat ? 1.2 : 0.2), z, -Math.PI / 2 + V.range(-0.6, 0.6), flat ? V.range(1.3, 1.6) : V.range(0.2, 0.5), V.range(4.4, 5.6), -1);
      }
    }
    // near life over the writing: two sprigs of gold ivy that run out along the bare vellum of the alley as we come
    for (const [zc, s, x0] of [[293.9, 1, 276], [302.3, -1, 290]]) {
      const a = ph(), x1 = 328;
      stem((t) => { const x = x0 + (x1 - x0) * t; return [x, zc + 0.5 * Math.sin(x * 0.2 + a)]; }, x1 - x0, () => false, (x, z) => uNear(x, z) - 0.055, 0.36);
      for (let x = x0 + 3; x < x1; x += V.range(4, 6))
        addCard(1, x, pageH0(x, zc) + 0.2, zc - s * V.range(0.2, 0.9), -Math.PI / 2 + V.range(-0.7, 0.7), V.range(0.25, 0.6), V.range(3, 4.2), uNear(x, zc) - 0.045);
    }
    await ctx.yield();
    const SU = { uLeaf: { value: new THREE.Vector4(...SE.leaf) }, uFlA: { value: new THREE.Vector4(SE.narrow || 1, 0, 0, SE.petals) }, uLeafCol: { value: col(SE.leafCol) }, uLeafCol2: { value: col(SE.leafCol2) },
      uFlACol: { value: col(SE.flA) }, uFlBCol: { value: col(SE.flBCol) }, uFlB: { value: SE.flB } };
    const vines = new THREE.Mesh(tubes.geometry(), mk(VINE_VS, VINE_FS)); vines.frustumCulled = false; scene.add(vines);
    await ctx.yield();
    const cg = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    cg.index = quad.index; cg.setAttribute('position', quad.getAttribute('position'));
    cg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(cP), 3)); cg.setAttribute('iRot', new THREE.InstancedBufferAttribute(new Float32Array(cR), 3));
    cg.setAttribute('iData', new THREE.InstancedBufferAttribute(new Float32Array(cD), 4)); cg.instanceCount = cD.length / 4;
    const cards = new THREE.Mesh(cg, mk(CARD_VS, CARD_FS, SU)); cards.frustumCulled = false; scene.add(cards);
    addShadow(cards, mkShadow(CARD_VS, CARD_FS, SU));
    await ctx.yield();

    // ---- the marginalia: jointed paper figures that hold a pose, then ease to the next
    await ctx.yield();
    const atlas = makeAtlas(2048, 5), AP = atlas.paint, SP = [], anims = [], KS = 0.4845;
    atlas.g.clearRect(0, 0, 1, 1);      // the canvas is allotted on its first draw: let that be a step of its own
    const sprite = (name, w, h, px = 0, py = 0, o = {}) => { SP.push({ name, w, h, px, py, flip: o.flip ? -1 : 1, glow: o.glow || 0, wave: o.wave || 0 }); return SP.length - 1; };
    await ctx.yield();
    const mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), mC = new THREE.Matrix4(), mD = new THREE.Matrix4(), mE = new THREE.Matrix4(), mF = new THREE.Matrix4(), mG = new THREE.Matrix4();
    const _sv = new THREE.Vector3(), FIG = 2.85, JZ = 414;      // FIG: the marginal figures are drawn large; none is nearer than 40 m
    const frame = (x, y, z, yaw, out, sc = 1) => out.makeRotationY(yaw).scale(_sv.set(sc, sc, sc)).setPosition(x, y, z);
    const joint = (parent, ox, oy, rot, out, oz = 0) => out.copy(parent).multiply(mC.makeRotationZ(rot).setPosition(ox, oy, oz));
    let sprites = null;
    const emit = (i, M) => { const s = SP[i]; mC.makeScale(s.w * s.flip, s.h, 1).setPosition(-s.px * KS * s.w * s.flip, -s.py * KS * s.h, 0); sprites.setMatrixAt(i, mD.multiplyMatrices(M, mC)); };
    const EAST = -Math.PI / 2, WEST = Math.PI / 2;
    if (cast.joust === 'joust') {
      AP.shell(); AP.snail(); AP.knight(); AP.lance(); AP.hare(); AP.shield();
      const g0 = pageH0(442, JZ) + 0.2, iB = sprite('snail', 13, 13, 0, -0.72), iS = sprite('shell', 8, 8), iK = sprite('knight', 5.6, 5.6, 0, -0.7), iL = sprite('lance', 13, 13, -0.5, 0),
        iH = sprite('hare', 9.5, 9.5, 0, -0.98, { flip: 1 }), iA = sprite('shield', 5, 5, -0.6, 0, { flip: 1 });
      anims.push((t) => {
        const p = t / 6; frame(442, g0, JZ, EAST, mA, FIG);
        joint(mA, keyed(p, [-15, -4.5, -8.5, -15], 0.35), 0, keyed(p, [0, 0.03, -0.05, 0], 0.35), mB); emit(iB, mB);
        joint(mB, -1.6, 4.6, keyed(p, [0, 0.1, -0.12, 0], 0.35), mE, 0.08); emit(iS, mE);
        joint(mE, 0.3, 3.4, keyed(p, [0, 0.06, -0.2, 0], 0.35), mF, 0.08); emit(iK, mF);
        joint(mF, 0.7, 0.7, keyed(p, [0.1, -0.02, 0.5, 0.1], 0.35), mG, 0.08); emit(iL, mG);
        joint(mA, keyed(p, [7, 7, 10, 7], 0.35), 0, keyed(p, [0, 0.12, -0.32, 0], 0.35), mB); emit(iH, mB);
        joint(mB, -1.2, 5.2, keyed(p, [0.2, -0.1, 0.7, 0.2], 0.35), mE, 0.08); emit(iA, mE);
      });
    } else if (cast.joust === 'monkeys') {
      AP.monkey(); AP.mArmPipe(); AP.mArmStick(); AP.tabor();
      const g0 = pageH0(442, JZ) + 0.2, iM1 = sprite('monkey', 10, 10, 0, -0.95), iA1 = sprite('mArmPipe', 6, 6, -0.9, 0), iT = sprite('tabor', 4.6, 4.6),
        iM2 = sprite('monkey', 10, 10, 0, -0.95, { flip: 1 }), iA2 = sprite('mArmStick', 5.5, 5.5, -0.9, 0, { flip: 1 }), iM3 = sprite('monkey', 8.5, 8.5, 0, -0.95, { flip: 1 }), iA3 = sprite('mArmPipe', 5, 5, -0.9, 0, { flip: 1 });
      anims.push((t) => {
        const p = t / 3.6; frame(442, g0, JZ, EAST, mA, FIG);
        joint(mA, -11, 0, keyed(p, [-0.06, 0.08, 0.0], 0.5), mB); emit(iM1, mB);
        joint(mB, 0.5, 5.3, keyed(p, [0.22, 0.5, 0.08], 0.5), mE, 0.1); emit(iA1, mE);
        joint(mA, 3.5, 0, keyed(p + 0.3, [0.05, -0.07, 0.0], 0.5), mB, 0.05); emit(iM2, mB);
        joint(mB, -3.6, 3.3, keyed(p * 2, [0.08, -0.06], 0.3), mE, 0.08); emit(iT, mE);
        joint(mB, -0.5, 5.0, keyed(p * 2, [-0.75, 0.15], 0.3), mE, 0.14); emit(iA2, mE);
        joint(mA, 12.5, keyed(p + 0.5, [0, 2.4, 0.5], 0.4), keyed(p + 0.5, [0.1, -0.3, 0.2], 0.4), mB, 0.03); emit(iM3, mB);
        joint(mB, -0.4, 4.4, keyed(p + 0.5, [-0.3, -1.1, -0.6], 0.4), mE, 0.1); emit(iA3, mE);
      });
    } else {
      AP.pulpit(); AP.fox(); AP.foxArm(); atlas.bird('goose', { c: C.wht, d: C.gry, nx: 0.5, ny: 0.56 });
      const g0 = pageH0(442, JZ) + 0.2, iP = sprite('pulpit', 11, 11, 0, -0.98), iF = sprite('fox', 10.5, 10.5, 0, -0.9), iA = sprite('foxArm', 5.5, 5.5, -0.9, 0), gs = [0, 1, 2, 3].map(() => sprite('goose', 7, 7, 0, -0.92, { flip: 1 }));
      anims.push((t) => {
        const p = t / 5; frame(442, g0, JZ, EAST, mA, FIG);
        joint(mA, -11, 5.8, keyed(p, [-0.06, 0.1, 0.02], 0.5), mE); emit(iF, mE);
        joint(mA, -11, 0, 0, mB, 0.1); emit(iP, mB);
        joint(mE, 1.2, 5.5, keyed(p, [0.9, 0.1, 1.2], 0.5), mF, 0.18); emit(iA, mF);
        gs.forEach((gi, i) => { joint(mA, -1 + 6.4 * i, keyed(p + i * 0.21, [0, 0, 1.3], 0.5), keyed(p + i * 0.17, [0, -0.28, 0.12], 0.5), mB, 0.03 * i); emit(gi, mB); });
      });
    }
    await ctx.yield();
    {
      const AB = cast.chase === 'hound'
        ? [['hareRun', { c: C.tan, d: C.tanD, ear: 'long', tail: 'scut' }, 9], ['hound', { c: C.wht, d: C.gry, ear: 'flop', tail: 'long', snout: true, collar: true }, 11.5]]
        : [['mouse', { c: C.brn, d: C.brnD, ear: 'round', tail: 'thin' }, 7], ['cat', { c: '#8E8A80', d: '#66625A', ear: 'point', tail: 'long', fat: 1.15 }, 11.5]];
      const rig = AB.map(([n, o, s]) => { atlas.beast(n, o); return { s, b: sprite(n, s, s), f: sprite(n + 'Legs', s * 0.45, s * 0.45, 0, 0.85), h: sprite(n + 'Legs', s * 0.45, s * 0.45, 0, 0.85) }; });
      anims.push((t) => {
        frame(WR.x, WR.y, WR.z, WR.yaw, mA);
        rig.forEach((q, i) => {
          const a = -t * 0.85 + i * 1.25, rr = WR.r + 0.5 + q.s * 0.36, lp = t * 2.6 + i * 0.4;
          joint(mA, rr * Math.cos(a), rr * Math.sin(a), a - Math.PI / 2 + keyed(lp, [0.12, -0.1], 0.2), mB, 0.4 + i * 0.1); emit(q.b, mB);
          joint(mB, q.s * 0.2, -q.s * 0.02, keyed(lp, [0.6, -0.5], 0.2), mE, -0.04); emit(q.f, mE);
          joint(mB, -q.s * 0.2, -q.s * 0.02, keyed(lp, [-0.5, 0.6], 0.2), mE, -0.05); emit(q.h, mE);
        });
      });
    }
    await ctx.yield();
    {
      atlas.bird('peacock', { c: C.lap, d: C.lapD, c2: C.grn, crest: true, nx: 0.42, ny: 0.62 }); AP.fan();
      const PK = { x: 350, z: 664 }, g0 = pageH0(PK.x, PK.z) + 0.2, fans = [0, 1, 2, 3, 4, 5, 6].map(() => sprite('fan', 10.5, 10.5, 0, -0.95)), iB = sprite('peacock', 10, 10, 0, -0.95);
      anims.push((t) => {
        const p = t / 7, spread = keyed(p, [0.1, 0.5, 0.9, 1.3], 0.7); frame(PK.x, g0, PK.z, Math.PI, mA, 3.0);
        fans.forEach((fi, k) => { joint(mA, -2.1, 3.9, 0.3 + ((k - 3) / 3) * spread, mB, -0.05 - 0.012 * Math.abs(k - 3)); emit(fi, mB); });
        joint(mA, 0, 0, keyed(p, [0, 0.03, -0.03, 0.05], 0.7), mB, 0.05); emit(iB, mB);
      });
    }
    if (cast.dragon) {
      AP.dragon(); AP.wing();
      const g0 = pageH0(DR.x, DR.z) + 0.2, iB = sprite('dragon', 12, 12, 0, -0.9), iW = sprite('wing', 8.2, 8.2, -0.8, -0.8);
      anims.push((t) => {
        const p = t / 3.2; frame(DR.x, g0, DR.z, EAST, mA, 2.1);
        joint(mA, 0, 0, keyed(p, [0, 0.05, -0.03], 0.5), mB); emit(iB, mB);
        joint(mB, -0.8, 5.3, keyed(p, [0.05, 0.8, 0.3], 0.5), mE, -0.06); emit(iW, mE);
      });
    } else {
      atlas.bird('cock', { c: C.och, d: C.ochD, c2: C.ver, comb: true, tail: 'plume', nx: 0.4, ny: 0.42 });
      const g0 = pageH0(DR.x, DR.z) + 0.2, ck = [sprite('cock', 8.5, 8.5, 0, -0.92), sprite('cock', 8.5, 8.5, 0, -0.92, { flip: 1 })];
      anims.push((t) => {
        frame(DR.x, g0, DR.z, EAST, mA, 2.1);
        ck.forEach((ci, i) => { const s = i ? 1 : -1, p = t / 2.4 + i * 0.5; joint(mA, s * keyed(p, [6.5, 3, 6.5], 0.4), keyed(p, [0, 3.2, 0], 0.4), -s * keyed(p, [0, 0.4, -0.1], 0.4), mB, i * 0.05); emit(ci, mB); });
      });
    }
    await ctx.yield();
    {
      AP.castle(); AP.mill();
      const iC = sprite('castle', 25, 25, 0, -0.95, { glow: 1 }), iT = sprite('mill', 16, 16, 0, -0.98, { glow: 1 }), iS = sprite('millSails', 20, 20);
      const cy = pageH0(CA.x, CA.z) + CA.top, my = pageH0(MI.x, MI.z) + MI.top - 0.4;
      anims.push((t) => {
        frame(CA.x, cy, CA.z, EAST, mA); joint(mA, 0, 0, Math.sin(t * 0.6) * 0.03, mB); emit(iC, mB);
        frame(MI.x, my, MI.z, WEST, mA); joint(mA, 0, 0, Math.sin(t * 0.5 + 1) * 0.02, mB); emit(iT, mB);
        joint(mB, 0, 10.2, t * 0.9, mE, 0.1); emit(iS, mE);
      });
    }
    await ctx.yield();
    // the vessel on the wave border paces the camera along it
    const ship = { x: 480, y: 0 };
    {
      let iH, iS = -1, iP = -1;
      if (cast.ship) { AP.hull(); AP.sail(); AP.pennant(); iH = sprite('hull', 15, 15, 0, -0.46); iS = sprite('sail', 8.6, 8.6, 0, 0.82, { wave: 0.05 }); iP = sprite('pennant', 5, 5, -0.95, 0, { wave: 0.14, flip: 1 }); }
      else { atlas.bird('swan', { c: C.wht, d: C.gry, c2: C.wht, sNeck: true, nx: 0.56, ny: 0.66, legs: false, beak: C.ver }); iH = sprite('swan', 13, 13, 0, -0.52); }
      anims.push((t, u) => {
        ship.x = clamp(358 - (u - 0.66) * 980, 30, 492);
        const bob = Math.sin(t * 1.3 + ship.x * 0.3) * 0.45 + Math.sin(t * 2.1) * 0.2;
        ship.y = pageH0(ship.x, 611.5) + 1.7 + bob;
        frame(ship.x, ship.y, 611.5, Math.PI, mA); joint(mA, 0, 0, Math.sin(t * 1.3 + 1) * 0.07, mB); emit(iH, mB);
        if (iS >= 0) { joint(mB, 0, 10.2, Math.sin(t * 0.9) * 0.04, mE, 0.06); emit(iS, mE); joint(mB, 0, 10.9, 0.1 * Math.sin(t * 2), mE, 0.1); emit(iP, mE); }
      });
    }
    await ctx.yield();
    atlas.finish();
    const atlasTex = new THREE.CanvasTexture(atlas.cv); atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 4;
    await ctx.yield();
    const sg = new THREE.PlaneGeometry(1, 1, 6, 1), sUV = new Float32Array(SP.length * 4), sFx = new Float32Array(SP.length * 4);
    SP.forEach((s, i) => { sUV.set(atlas.rects[s.name], i * 4); sFx.set([s.glow, s.wave, R.cast.range(0, 2), s.flip], i * 4); });
    sg.setAttribute('iUV', new THREE.InstancedBufferAttribute(sUV, 4)); sg.setAttribute('iFx', new THREE.InstancedBufferAttribute(sFx, 4));
    const uAtlas = { value: atlasTex };
    sprites = new THREE.InstancedMesh(sg, mk(SPRITE_VS, SPRITE_FS, { uAtlas }), SP.length);
    sprites.frustumCulled = false; scene.add(sprites); addShadow(sprites, mkShadow(SPRITE_VS, SPRITE_FS, { uAtlas }));
    for (const a of anims) a(0, 0);
    await ctx.yield();

    // ---- the wave border: three rows of standing scallops sliding in alternate directions
    [[604, 4, 1, 5.5], [609, 5, -1, 6.5], [615, 6.5, 1, 7.5]].forEach(([z, h, dir, wl], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(524, h, 130, 1).translate(248, h / 2 - 1, z), mk(WAVE_VS, WAVE_FS, { uRow: { value: new THREE.Vector4(dir, i, wl, 0) } }));
      m.frustumCulled = false; scene.add(m);
    });

    await ctx.yield();
    // ---- the goose-quill and the line it lays
    const qParts = [new THREE.CylinderGeometry(0.35, 1.05, 190, 8, 1, true).translate(0, 105, 0), new THREE.CylinderGeometry(1.05, 0.08, 10, 8, 1, true).translate(0, 5, 0),
      new THREE.PlaneGeometry(26, 186, 2, 18).translate(0, 107, 0)];
    qParts.forEach((g, i) => g.setAttribute('aK', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(i === 2 ? 1 : 0), 1)));
    const quillU = { uRoom: { value: col(H.room) } };
    const quill = new THREE.Mesh(mergeGeometries(qParts), mk(QUILL_VS, QUILL_FS, quillU)); quill.frustumCulled = false; scene.add(quill);
    const quillShadow = addShadow(quill, mkShadow(QUILL_VS, QUILL_FS, quillU));
    qParts.forEach((g) => g.dispose());

    await ctx.yield();
    // ---- butterflies, the only creatures that come near
    const F = R.fly, nF0 = Math.round(70 * density * detail), nF = nF0 + 18, fC = new Float32Array(nF * 3), fD = new Float32Array(nF * 4), tv = new THREE.Vector3();
    for (let i = nF0; i < nF; i++) {            // a welcome of butterflies over the clearing, then more down the alley, at eye height
      const al = i - nF0 >= 8, x = al ? 266 + (i - nF0 - 8) * 7 + F.range(-3, 3) : F.range(230, 264), z = 298 + F.sign() * F.range(8, 12.5);
      fC.set([x, al ? F.range(6, 11.5) : F.range(6.5, 11), z], i * 3); fD.set([F.range(0, 25), F.range(1.5, 2.3), F(), F.range(0.6, 1.1)], i * 4);
    }
    for (let i = 0; i < nF0; i++) {
      const u = 0.012 + (0.96 * (i + F())) / nF0; path.pointAt(u, _pp); path.tangentAt(u, tv);
      const inAlley = _pp.x < 335 && _pp.z < 310, s = F.sign(), lat = inAlley ? F.range(8, 13) : F.range(5, 20), x = _pp.x - tv.z * s * lat, z = _pp.z + tv.x * s * lat;
      fC.set([x, Math.max(pageH0(x, z) + 3, _pp.y + (inAlley ? F.range(-3, 3) : F.range(-4, 6))), z], i * 3);
      fD.set([F.range(0, 25), F.range(1.0, 1.9), F(), F.range(0.6, 1.2)], i * 4);
    }
    const fg = new THREE.InstancedBufferGeometry(), wingQ = new THREE.PlaneGeometry(2, 1, 2, 1).rotateX(-Math.PI / 2);
    fg.index = wingQ.index; fg.setAttribute('position', wingQ.getAttribute('position'));
    fg.setAttribute('iC', new THREE.InstancedBufferAttribute(fC, 3)); fg.setAttribute('iD', new THREE.InstancedBufferAttribute(fD, 4)); fg.instanceCount = nF;
    const uScare = { value: new THREE.Vector4(0, 0, 0, 0) };
    const flies = new THREE.Mesh(fg, mk(FLY_VS, FLY_FS, { uScare })); flies.frustumCulled = false; scene.add(flies);
    addShadow(flies, mkShadow(FLY_VS, FLY_FS, { uScare }));

    await ctx.yield();
    // ---- dust motes in the candlelight
    const dust = fx.makeParticles({ rng: R.misc, preset: 'dust', time: U.uTime, count: Math.round((hourI === 1 ? 240 : 420) * detail), box: [80, 40, 80], size: hourI === 1 ? [0.15, 0.5] : [0.3, 1.0], intensity: hourI === 1 ? 0.35 : 0.5, twinkle: 0.2,
      colors: hourI === 1 ? ['#FFFFFF', '#E6F0FF', '#FFF6DC'] : ['#FFD98A', '#FFC060', '#FFF0C0'] });
    scene.add(dust.object);

    // ---- the viewer is a bee: two antennae at the foot of the frame, a blur of wings at its sides
    const bee = new THREE.Group(), ants = [], blurU = { uA: { value: 0 }, uT: U.uTime }, _bs = new THREE.Vector3();
    if (BEE) {
      const am = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.045, 0.03, 0.018), fog: false });
      for (const s of [-1, 1]) {
        const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.14, 0.17, -0.4), new THREE.Vector3(s * 0.34, 0.21, -0.8), new THREE.Vector3(s * 0.46, 0.09, -1.1)]);
        const a = new THREE.Group(); a.position.set(s * 0.16, -0.95, -0.9);
        a.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 14, 0.02, 6), am));
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), am); knob.position.set(s * 0.46, 0.09, -1.1); a.add(knob);
        bee.add(a); ants.push(a);
        const blur = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.ShaderMaterial({ uniforms: blurU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'uniform float uA, uT; varying vec2 vUv; void main(){ vec2 q = vUv * vec2(2.2, 1.6); float g = exp(-dot(q, q) * 5.0) * (0.85 + 0.15 * sin(vUv.y * 9.0 + uT * 61.0) * sin(vUv.y * 5.0 - uT * 37.0)); gl_FragColor = vec4(vec3(0.9, 0.85, 0.7) * g * uA, 1.0); }' }));
        blur.position.set(s * 1.98, -0.1, -1.6); blur.rotation.y = -s * 0.5; blur.renderOrder = 20; bee.add(blur);
      }
      bee.visible = false; scene.add(bee);
    }
    await ctx.yield();

    // ---- rare: a cat crosses the margin, pad by pad, ahead of us
    const paws = [];
    if (rare) for (let i = 0; i < 6; i++) {
      const z = 446 + i * 23 + R.misc.range(-4, 4), x = 426 + (i % 2 ? 13 : -9) + R.misc.range(-3, 3);
      paws.push({ x, z, u0: 0.33 + i * 0.035, rot: Math.PI + (i % 2 ? -0.2 : 0.2) + R.misc.range(-0.15, 0.15) });
    }

    const shipPoi = new THREE.Vector3(), heroC = new THREE.Vector3(HERO_X, PY, HERO_Z), cd = U.uCandleDir.value;
    return {
      scene, path, duration: 42,
      // hurry over the writing; linger at the joust, beside the ship and through the ignition; the approach is unhurried
      pace: (u) => 1 + 0.4 * (1 - smoothstep(0.1, 0.19, u)) - 0.3 * bump(u, MU(0.31), MU(0.44), 0.035) - 0.25 * bump(u, MU(0.62), MU(0.72), 0.03)
        - 0.2 * bump(u, MU(0.76), MU(0.88), 0.03),
      title: 'The Gilded Margin',
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 24, bank: 0.35 },
      pois: [
        { at: [BX, pageH0(BX, BZ) + 8, BZ + 1], from: 0, to: uB + 0.02, weight: 0.4 },
        { at: [442, 15, JZ - 6], from: MU(0.265), to: MU(0.43), weight: 0.6 },
        { at: [WR.x, WR.y - 2, WR.z], from: MU(0.47), to: MU(0.585), weight: 0.5 },
        { at: () => shipPoi.set(ship.x, ship.y + 5, 611.5), from: MU(0.6), to: MU(0.7), weight: 0.5 },
        { at: heroC, from: MU(0.66), to: 1, weight: 0.8 },
      ],
      portal: { shape: 'circle', radius: 7, color: hourI === 1 ? '#EAF2FF' : '#FFD890', glow: 1, revealDistance: 280 },
      post: { exposure: 1.08, bloom: { strength: 0.45, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.03, tint: H.grade, shadowTint: '#000000', vignette: 0.25, grain: 0.035, aberration: 0 } },
      update(dt, time, camera, u) {
        U.uTime.value = time; U.uU.value = u;
        const uNow = u; u = PU(u);                 // everything scripted below is in page-u; uNow is today's
        const gust = gustOn ? bell(u, 0.26, 0.42, 0.3) * (0.65 + 0.35 * Math.sin(time * 2.1)) : 0;
        U.uGust.value = gust;
        // the flame: sway, flicker, and the nudge into the Initial's mirror direction for the ignition
        const mirror = smoothstep(0.765, 0.8, u);
        const az = lerp(az0, Math.abs(az0), smoothstep(0.5, 0.64, u)) * (1 - mirror) + 0.1 * Math.sin(time * 0.7) + 0.05 * Math.sin(time * 1.9 + 1) + gust * 0.3 * Math.sin(time * 3.1);
        const el = H.el + 0.025 * Math.sin(time * 1.3) + gust * 0.05 * Math.sin(time * 2.3);
        let I = 1 + 0.1 * Math.sin(time * 9) * Math.sin(time * 5.3 + 1) + 0.04 * Math.sin(time * 23);
        if (hourI === 2) I *= 0.8 + 0.2 * Math.sin(time * 2.3) * Math.sin(time * 1.7 + 2);
        if (hourI === 1) I = 1 + 0.03 * Math.sin(time * 0.9);
        cd.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
        const kindle = bell(u, 0.77, 0.9, 0.3);
        U.uCandleI.value = I * H.I * (1 + 0.35 * kindle);
        uBlockFlare.value = Math.max(bell(uNow, uB - 0.045, uB + 0.04, 0.4), 0.45 * (1 - smoothstep(uB, uB + 0.06, uNow))) * (0.85 + 0.15 * I);
        hero.setCandle(cd, U.uCandleI.value); hero.setProgress(clamp((u - 0.775) / 0.075, 0, 1)); hero.setGrowth(0.5 + 0.57 * ease((u - 0.45) / 0.5));
        hero.update(dt, time, camera); U.uFlare.value = hero.flare;
        dome.position.setFromMatrixPosition(camera.matrixWorld);
        if (hourI === 1) { const k = ease(u / 0.8); uBeam.value.x = lerp(455, 205, k * k) + 6 * Math.sin(time * 0.1); uBeam.value.y = lerp(330, 500, Math.sqrt(k)); }
        // the quill sweeps north up the margin, laying its line
        const k = clamp((u - 0.4) / 0.24, 0, 1), tipZ = lerp(596, 250, k), inn = ease((u - 0.33) / 0.07), out = ease((u - 0.64) / 0.06), parked = u < 0.3 || u > 0.72;
        const qx = inkX(tipZ);
        quill.position.set(qx + (1 - inn) * 120 + (parked ? 5000 : 0), pageH0(qx, tipZ) + (1 - inn + out) * 160, tipZ + (1 - inn) * 60);
        quill.rotation.set(0.12 + 0.03 * Math.sin(time * 5), 0, -0.44 + 0.04 * Math.sin(time * 3.3));
        quillShadow.position.copy(quill.position); quillShadow.quaternion.copy(quill.quaternion);
        uInk.value.y = u < 0.4 ? 596 : tipZ;
        uBarG.value = smoothstep(0.55, 0.71, u);
        // marginalia
        for (const a of anims) a(time, u);
        sprites.instanceMatrix.needsUpdate = true;
        // paw-prints and the butterflies they scatter
        let scare = 0;
        for (let i = 0; i < paws.length; i++) {
          const p = paws[i], age = u - p.u0, amt = clamp(age / 0.03, 0, 1) * 0.5 + clamp((age - 0.03) / 0.12, 0, 1) * 0.5;
          uPaw.value[i].set(p.x, p.z, amt, p.rot);
          if (age > 0 && age < 0.035) { const s = Math.sin((age / 0.035) * Math.PI); if (s > scare) { scare = s; uScare.value.set(p.x, p.z, s, 0); } }
        }
        uScare.value.z = scare;
        dust.update(dt, time, camera);
        if (BEE) {
          const amt = smoothstep(0.0, 0.012, uNow) * (1 - smoothstep(0.985, 1, uNow));
          bee.visible = amt > 0.001;
          camera.matrixWorld.decompose(bee.position, bee.quaternion, _bs);
          for (let i = 0; i < ants.length; i++) { const a = ants[i]; a.rotation.x = (1 - amt) * -0.5 + 0.05 * Math.sin(time * 2.3 + i * 1.7) + 0.02 * Math.sin(time * 7.1 + i); a.rotation.z = 0.04 * Math.sin(time * 1.7 + i * 2.2); }
          blurU.uA.value = amt * (0.15 + 0.05 * Math.sin(time * 53) * Math.sin(time * 31));
        }
      },
      dispose() { atlasTex.dispose(); },
    };
  },
};
