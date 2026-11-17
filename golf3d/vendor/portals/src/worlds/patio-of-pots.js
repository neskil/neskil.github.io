// PATIO OF THREE THOUSAND POTS
// A May morning in a chain of whitewashed Cordoban courtyards, built 10 times life size, three hours in
// forty-four seconds. x east, y up, z south; pebble floors at y = 0; the chain runs west along z = -30.
//
// OUTLINE OF THIS FILE
//   1. constants, the path, the looks
//   2. GLSL: WORLD_SUN (every patio's roof shadow, built on the hero's patioSun), PM_VERT / PM_FRAG (one
//      material for lime, pebbles, iron, timber, tiles, clay, water, pots, leaves and petals)
//   3. geometry builder (quads, boxes, lathes, arch walls) and the potted plant geometries
//   4. zones: A passage + gate wall + patio 1, B patio 2 + east wing, C the hero patio's other three sides
//   5. pots on every wall (instanced) with their shadows, sky dome, motes, water drops
//   6. build(): the hero wall, zones, trees, creatures, particles, the rare doves, update()
//
// LIGHT  no three.js lights. One function of the path u (the hero's setProgress) moves the sun; every material
//        here tests its point against the roof that shades it, so the edge crosses walls, floors, pots, motes.
// LOOKS  may (clear, scarlet and cobalt) | dawn (apricot edge, coral bloom, mist) | moon (silver on indigo,
//        brass lanterns) | shower (mirror pebbles, racing clouds). Rare: forty white doves from the top gallery.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/patio-of-pots.js';

const PALETTE = ['#F3EFE4', '#A9BCD8', '#1F47A6', '#D4221E', '#3E7A38', '#B5653A', '#2E62C4'];
const PATH_POINTS = [
  [312, 11, -30], [280, 11, -30], [242, 11, -30], [200, 12, -27], [160, 13, -30], [115, 14, -36], [72, 13, -30],
  [40, 14, -30], [8, 20, -27], [-21, 26, -11], [-36, 32, 13], [-36, 42, 38], [-20, 50, 52], [0, 55, 50],
  [14, 58, 36], [17.5, 63, 15.5], [14, 73, -4], [3, 86, -19.5], [-12.2, 117, -34.7], [-27.4, 147.5, -49.9],
];
const DUR = 44;
const sst = (a, b, x) => smoothstep(a, b, x);
// brisk through the two patios and arch 2, slow for the reveal (0.45-0.57) and the close pass, quick round the south end (0.64-0.71)
const paceOf = (u) => 1.7 - 0.95 * sst(0.37, 0.455, u) - 0.15 * sst(0.50, 0.57, u) + 0.6 * sst(0.635, 0.69, u) - 0.4 * sst(0.72, 0.80, u) + 0.15 * sst(0.90, 0.97, u);

// per look: sky colours (zenith, roofline), fog, lime tint of the grade, creature cast
const LOOKS = {
  may: { zen: '#2E62C4', hor: '#8FB6E6', fog: '#a9c0e4', fogD: 0.00105, cirrus: '#f4f7ff', stars: 0, lamp: 0, mist: 0, wet: 0.5, exposure: 1.06, shade: 1.25 },
  dawn: { zen: '#4f72c4', hor: '#f9be98', fog: '#c8b9c4', fogD: 0.0014, cirrus: '#ffd0a8', stars: 0, lamp: 0, mist: 1, wet: 0.5, exposure: 1.08, shade: 1.25 },
  moon: { zen: '#060b28', hor: '#1a2a66', fog: '#121b44', fogD: 0.0011, cirrus: '#8fa2d8', stars: 1, lamp: 1, mist: 0, wet: 0.45, exposure: 1.3, shade: 1.25 },
  shower: { zen: '#2a5cbc', hor: '#9fc0e8', fog: '#a4bbdc', fogD: 0.0011, cirrus: '#ffffff', stars: 0, lamp: 0, mist: 0, wet: 1, exposure: 1.06, shade: 1.25 },
};

// ---------------------------------------------------------------------------------------------
// 2. GLSL
// ---------------------------------------------------------------------------------------------
// the roof shadow of each patio, in world space (the hero's patioSun answers for the last patio)
const WORLD_SUN = /* glsl */`
float boxSun(vec3 p, float xe, float zs, float h){
  float te = max(xe - p.x, 0.) / 0.985, ts = max(zs - p.z, 0.) / 0.174;
  float t = min(te, ts);
  float zz = p.z + t * 0.174;
  float line = h + (abs(sin(zz * 1.5707963)) - 0.55) * 1.3 * step(te, ts);
  float pen = 0.25 + t * 0.008;
  return smoothstep(-pen, pen, p.y + t * uSunTan - line);
}
float worldSun(vec3 wp){
  if (wp.x < 61.) return patioSun((uHeroInv * vec4(wp, 1.)).xyz);
  if (wp.x < 155.) return boxSun(wp, 150., 15., 78.);
  if (wp.x < 230.) return boxSun(wp, 226., 0., 48.);
  return 0.;
}
vec3 skyColor(vec3 d){ return mix(uHor, uZen, smoothstep(0.02, 0.75, d.y)); }
`;

const PM_VERT = /* glsl */`
uniform float uTime;
attribute vec3 color; attribute float aMat;
#ifdef USE_INSTANCING
attribute vec4 iA, iB;
#endif
varying vec3 vW, vN, vCol, vL; varying vec2 vUv; varying float vMat, vSeed;
#include <fog_pars_vertex>
void main(){
  vec3 lp = position, ln = normal, col = color;
  vSeed = 0.;
  #ifdef USE_INSTANCING
    vSeed = iA.w;
    if (aMat > 11.5 && aMat < 13.5) {                          // leaves and petals nod
      float k = 0.05 * (0.4 + max(lp.y, -lp.y * 0.6));
      lp.x += k * sin(uTime * 1.3 + iA.w * 40. + lp.y * 1.7);
      lp.z += k * cos(uTime * 1.07 + iA.w * 31. + lp.x * 1.3);
    }
    if (aMat > 12.5 && aMat < 13.5) { col = iB.rgb * color.r; if (iB.a < color.b) lp = vec3(0.); }
    else if (aMat > 10.5 && aMat < 11.5) col = iA.rgb * color;
    vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.);
    vN = mat3(modelMatrix) * (mat3(instanceMatrix) * ln);
  #else
    vec4 wp = modelMatrix * vec4(lp, 1.);
    vN = mat3(modelMatrix) * ln;
  #endif
  vW = wp.xyz; vL = position; vCol = col; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const pmFrag = (COMMON) => /* glsl */`
${COMMON}
uniform vec3 uZen, uHor, uLime, uCobalt, uScarlet, uLampCol;
uniform vec4 uLamp[7];
uniform float uFloorWet, uPuddle, uLampK, uLift, uOpenSky;
${WORLD_SUN}
${WELL_GLSL}
${GATE_GLSL}
varying vec3 vW, vN, vCol, vL; varying vec2 vUv; varying float vMat, vSeed;
#include <fog_pars_fragment>
// black and white river stones laid in stars, rings and waves; returns the stone colour
vec3 pebbles(vec2 w, out float edge, out float dome){
  vec2 p = w * 1.3, ip = floor(p), fp = fract(p);
  float f1 = 9., f2 = 9.; vec2 cc = ip;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = g + h22(ip + g) * 0.8 + 0.1 - fp;
    float d = dot(o, o);
    if (d < f1) { f2 = f1; f1 = d; cc = ip + g; } else if (d < f2) { f2 = d; }
  }
  f1 = sqrt(f1); f2 = sqrt(f2);
  edge = smoothstep(0.03, 0.17, f2 - f1);
  dome = edge * (1. - f1 * 0.7);
  vec2 c = (cc + 0.5) / 1.3;
  vec2 g = fract(c / 26. + 0.5) - 0.5;
  float a = atan(g.y, g.x + 1e-5), r = length(g);
  float star = 0.25 + 0.11 * cos(a * 8.) - r;
  float ring = 0.022 - abs(r - 0.44);
  float wave = abs(sin(c.x * 0.5 + 1.7 * sin(c.y * 0.24))) - 0.86;
  float core = r - 0.07;
  float white = max(max(step(0., star) * step(0., core), step(0., ring)), step(0., wave) * step(0.47, r));
  float rr = h21(cc);
  return mix(vec3(0.045, 0.05, 0.065) + 0.05 * rr, vec3(0.66, 0.65, 0.6) * (0.78 + 0.3 * rr), white);
}
// what a wet floor mirrors: the sky square, or the wall the reflected ray meets
vec3 mirror(vec3 wp, vec3 r){
  vec4 bx = wp.x < 61. ? vec4(-50., 50., -70., 70.) : wp.x < 155. ? vec4(72., 150., -75., 15.) : vec4(160., 226., -60., 0.);
  float top = wp.x < 61. ? 140. : wp.x < 155. ? 78. : 48.;
  if (wp.x > 230.) return gateMirror(wp, r);
  float tx = r.x > 0. ? (bx.y - wp.x) / max(r.x, 1e-3) : (wp.x - bx.x) / max(-r.x, 1e-3);
  float tz = r.z > 0. ? (bx.w - wp.z) / max(r.z, 1e-3) : (wp.z - bx.z) / max(-r.z, 1e-3);
  float t = min(tx, tz);
  vec3 hit = wp + r * t;
  vec3 sky = skyColor(normalize(r + vec3(0., 1e-4, 0.)));
  float lit = worldSun(hit - r * 0.5);
  float dots = smoothstep(0.62, 0.8, vnoise(vec2(hit.x + hit.z, hit.y) * 0.27));
  vec3 wall = uLime * (uSunCol * 0.62 * lit + uSkyCol * 0.8);
  wall = mix(wall, mix(uCobalt, uScarlet, lit) * (0.25 + 0.75 * lit), dots * 0.6);
  return mix(wall, sky, smoothstep(top - 3., top + 3., hit.y));
}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  if (vMat > 11.5 && vMat < 13.5 && dot(n, cameraPosition - vW) < 0.) n = -n;      // cards are two-sided
  vec3 vv = cameraPosition - vW;
  float dist = length(vv);
  vec3 v = vv / max(dist, 1e-4);
  vec3 sunW = vec3(uSunDir.z, uSunDir.y, -uSunDir.x);
  float sun = worldSun(vW);
  vec3 alb = vCol; float gloss = 0., wrap = 0.15, wetRefl = 0., back = 0., ao = 1., sheen = 0., petal = 0.;
  float tc = vW.x * abs(n.z) + vW.z * abs(n.x) + (vW.x + vW.z) * abs(n.y);          // a coordinate along the surface
  vec2 sp = vec2(tc, vW.y);
  // arch 2 (x 50..72): its soffit and jambs are a dark, brush-marked frame for the hero wall beyond
  float arch2 = step(49.9, vW.x) * step(vW.x, 72.1) * step(abs(vW.z + 30.), 11.2) * step(0.5, vW.y);
  sp = mix(sp, vec2(vW.x, vW.y + vW.z * abs(n.y)), arch2);
  float n1 = vnoise(sp * 0.9 + 3.), n2 = vnoise(sp * 4.3 + 11.), n3 = vnoise(sp * 15.);
  float lod = smoothstep(160., 25., dist);
  if (vMat < 1.5) {                                            // lime (0: with a cobalt band at its foot, 1: plain)
    float br = mix(vnoise(vec2(sp.x * 0.33 + sp.y * 0.07, sp.y * 2.7)), vnoise(vec2(sp.x * 2.3, sp.y * 0.38)), smoothstep(0.35, 0.65, vnoise(sp * 0.11 + 9.3)));
    float coat = fbm3(sp * 0.045 + 3.3);
    alb = uLime * vCol * (0.76 + 0.13 * coat + 0.17 * (br - 0.5) * lod + 0.06 * (n3 - 0.5) * lod);
    alb = mix(alb, alb * vec3(1.03, 0.97, 0.88), smoothstep(0.42, 0.62, fbm3(sp * 0.021 + 17.)) * 0.8);        // an older, creamier coat
    float fl = fbm3(sp * 0.33 + 41.);
    alb *= 1. - 0.08 * smoothstep(0.615, 0.635, fl) * lod;
    alb = mix(alb, alb * vec3(0.9, 0.96, 0.86), 0.55 * smoothstep(0.5, 0.9, coat) * smoothstep(34., 0., vW.y));
    alb *= 1. - 0.16 * smoothstep(0.45, 0.85, fbm3(vec2(sp.x * 0.5, sp.y * 0.045))) * abs(n.x + n.z);     // rain streaks
    alb *= 1. + arch2 * (0.16 * (br - 0.5) + 0.4 * (n1 - 0.5) + 0.24 * (n2 - 0.5) - 0.16 * smoothstep(0.5, 0.8, fbm3(sp * 0.16 + 23.)));   // heavy brush marks, old damp
    if (vMat < 0.5 && abs(n.y) < 0.5) {
      float yb = 8.3 + 0.3 * (vnoise(vec2(sp.x * 0.35, 1.7)) - 0.5);
      float band = 1. - smoothstep(yb - 0.08, yb + 0.08, vW.y);
      vec3 dado = uCobalt * (0.8 + 0.5 * coat + 0.25 * (br - 0.5));
      dado = mix(dado, uCobalt * 0.5, smoothstep(0.5, 0.2, abs(vW.y - (yb - 0.55))) * 0.7);
      dado = mix(dado, uLime * 0.6, smoothstep(0.7, 0.9, n2) * smoothstep(4., 0., vW.y) * 0.8);
      alb = mix(alb, dado, band);
    }
    wrap = 0.1;
  } else if (vMat < 2.5) {                                     // pebble mosaic, wet
    float fw = fwidth(vW.x) + fwidth(vW.z);
    float edge, dome;
    vec3 st = pebbles(vW.xz, edge, dome);
    float far = smoothstep(0.25, 0.9, fw);
    alb = mix(st * (0.35 + 0.65 * edge) * (0.85 + 0.3 * dome), vec3(0.2, 0.2, 0.2), far);
    float moss = smoothstep(0.55, 0.8, fbm3(vW.xz * 0.07 + 5.)) * (1. - sun * 0.7);
    alb = mix(alb, vec3(0.1, 0.19, 0.06) * (0.7 + 0.6 * n2), moss * (1. - 0.6 * edge) * 0.8);
    float pud = smoothstep(0.42, 0.6, fbm3(vW.xz * 0.045 + 17.)) * uPuddle;
    wetRefl = uFloorWet * mix(0.35 + 0.65 * edge * (1. - far), 1., max(pud, 0.85 * far));     // far off, at a grazing angle, wet stones are a mirror
    alb *= 1. - 0.35 * uFloorWet;                               // wet stone is darker
    n = normalize(n + vec3(dFdx(dome), 0., dFdy(dome)) * ((1. - pud) * (1. - far) * 6.));
    gloss = 0.5 * uFloorWet; ao = vCol.r;
  } else if (vMat < 3.5) { alb = vCol * (0.7 + 0.5 * n2); alb = mix(alb, vec3(0.2, 0.09, 0.04), smoothstep(0.7, 0.9, n1) * 0.4); gloss = 0.4; wrap = 0.3; }
  else if (vMat < 4.5) { float gr = vnoise(vec2(vUv.x * 3., vUv.y * 46.) + vL.x * 0.3); alb = vCol * (0.66 + 0.5 * gr + 0.14 * n3); gloss = 0.1; }
  else if (vMat < 5.5) {                                       // blue and white tiles (uv in tiles)
    vec2 f = fract(vUv) - 0.5, id = floor(vUv);
    float d1 = abs(f.x) + abs(f.y), d2 = max(abs(f.x), abs(f.y)), rr = length(f);
    float star = min(d1 - 0.36, d2 - 0.27);
    float kb = step(star, 0.) * step(0.1, rr);
    float corner = step(0.56, d1);
    float lace = step(abs(rr - 0.455), 0.022);
    vec3 col = vec3(0.82, 0.81, 0.76);
    col = mix(col, uCobalt * 1.1, max(kb, lace));
    col = mix(col, vec3(0.75, 0.5, 0.12), step(rr, 0.075));
    col = mix(col, mix(vec3(0.12, 0.36, 0.2), uCobalt, step(0.5, h21(id))), corner);
    float grout = step(0.47, d2);
    alb = mix(col * (0.86 + 0.2 * h21(id + 3.)), vec3(0.42, 0.4, 0.36), grout) * vCol;
    gloss = 0.7 * (1. - grout); wrap = 0.1; sheen = 1. - grout;
  } else if (vMat < 6.5) { alb = vCol * (0.75 + 0.35 * n2 + 0.1 * n3); alb = mix(alb, vec3(0.62, 0.6, 0.55), smoothstep(0.62, 0.85, n1) * 0.35); wrap = 0.3; gloss = 0.06; }
  else if (vMat < 7.5) {                                       // water in a basin or bucket
    float rp = length(vUv - 0.5) * 2.;
    float rip = sin(rp * 26. - uTime * 5.) * (1. - rp) + 0.4 * sin(vW.x * 3. + uTime * 1.7) * sin(vW.z * 2.6 - uTime * 1.3);
    n = normalize(vec3(dFdx(rip) * 2.2, 1., dFdy(rip) * 2.2));
    alb = vec3(0.02, 0.07, 0.08); wetRefl = 1.; gloss = 1.;
  } else if (vMat < 8.5) { alb = vCol; wrap = 0.4; }
  else if (vMat < 9.5) { alb = vCol * 0.2; }
  else if (vMat < 11.5) {                                      // a painted clay pot
    float chip = smoothstep(0.6, 0.72, vnoise(vL.xy * 3.1 + vSeed * 60.) * 0.6 + vnoise(vL.zy * 7. + vSeed * 20.) * 0.4);
    alb = mix(vCol, vec3(0.5, 0.24, 0.13), chip * 0.75) * (0.82 + 0.3 * n2);
    alb = mix(alb, uLime * 0.8, smoothstep(0.55, 0.9, vnoise(vL.xz * 2. + vSeed * 9.)) * smoothstep(-0.5, -1.5, vL.y) * 0.5);
    alb *= 0.6 + 0.4 * smoothstep(-1.5, -0.9, vL.y);
    gloss = 0.3;
  } else if (vMat < 12.5) {                                    // geranium leaves: a card of round scalloped leaves
    vec2 q = vUv * 2. - 1.;
    float th = atan(q.y, q.x + 1e-5);
    float d = min(length(q - vec2(-0.4, -0.27)) - 0.55, min(length(q - vec2(0.42, -0.2)) - 0.5, length(q - vec2(0., 0.44)) - 0.52));
    d += 0.05 * sin(th * 9. + vSeed * 20.);
    if (d > 0.) discard;
    float band = smoothstep(0.1, 0.0, abs(d + 0.27) - 0.05);
    alb = vCol * (0.75 + 0.5 * vnoise(q * 3. + vSeed * 50.)) * (1. - 0.38 * band);
    wrap = 0.7; back = 0.5; gloss = 0.12;
  } else if (vMat < 13.5) {                                    // an umbel of florets
    vec2 q = vUv * 2. - 1.;
    float th = atan(q.y, q.x + 1e-5), rr = length(q);
    if (rr > 0.8 + 0.17 * sin(th * 7. + vSeed * 30.)) discard;
    float fl = 0.72 + 0.28 * smoothstep(0.1, 0.45, abs(sin(th * 3.5 + rr * 4.)) + 0.4 * vnoise(q * 5.));
    alb = vCol * fl * (0.66 + 0.5 * smoothstep(-0.5, 0.5, q.y)) * (1. - 0.3 * rr * rr);     // a shaded dome, not a flat disc
    wrap = 0.9; back = 0.2; petal = 1.;
  } else if (vMat < 14.5) { alb = vec3(0.09, 0.06, 0.04) * (0.6 + 0.8 * n2); }
  else {                                                       // roof tiles
    float ridge = abs(sin(tc * 1.5707963));
    alb = vCol * (0.6 + 0.45 * ridge) * (0.8 + 0.35 * n1);
    alb = mix(alb, vec3(0.4, 0.38, 0.28), smoothstep(0.55, 0.85, n2) * 0.4);
    wrap = 0.3;
  }
  // light: the sun through the roofs' shadow, blue sky from above (less at the foot of a deep patio), the warm
  // bounce off whatever is lit (strongest high on the shaded walls of the last patio), and the lanterns.
  // The passage is lit by the bright patio beyond its gate.
  float ndl = max((dot(n, sunW) + wrap) / (1. + wrap), 0.);
  float well = wp_well(vW);
  float inPass = smoothstep(228., 236., vW.x);
  well *= 1. - arch2 * (0.55 - 0.3 * abs(vW.x - 61.) / 11.);          // darkest in the middle of the arch's depth
  // the east galleries: the wall behind each deck and the deck's underside sit in a recess of blue shade, while the
  // posts, the rails and the front of each floor take the warm bounce of the lit wall opposite
  float east = step(vW.x, 50.05) * smoothstep(36., 41., vW.x);
  float recess = east * smoothstep(41.4, 46., vW.x) * (0.14 + 0.86 * exp(-(35. - mod(vW.y, 35.)) / 16.)) * step(vW.y, 105.);
  well *= 1. - 0.8 * recess;
  vec3 skyA = mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.3, 0.5, 0.2))), 0.2) * 1.22;
  skyA = mix(skyA, gateGlow() * 0.6, 0.62 * inPass);
  float hemi = mix(0.6 + 0.4 * n.y, 0.78 + 0.22 * n.y, inPass);
  float lift = vW.x < 61. ? (0.5 + 1.7 * smoothstep(-75., 25., vW.y - uEdgeY)) * uLift : 0.45;
  vec3 amb = skyA * (hemi * well * ao) + uBounce * ((0.75 + 0.25 * abs(n.x)) * lift * well * (1. - inPass) * (1. - recess) * (1. + 0.9 * east));
  vec3 lamp = vec3(0.);
  for (int i = 0; i < 7; i++) {
    vec3 dl = uLamp[i].xyz - vW; float d2 = dot(dl, dl);
    lamp += uLampCol * (uLamp[i].w * max(dot(n, dl) / sqrt(d2 + 1e-3) + 0.25, 0.) / (1. + d2 * 0.0026));
  }
  // petals are held under the tone map's shoulder so that sunlit scarlet stays scarlet
  vec3 col = alb * (uSunCol * (ndl * sun * (1. - 0.4 * petal)) + amb + lamp);
  col += alb * uSunCol * (back * sun * max(-dot(n, sunW), 0.) * 0.6);
  if (vMat > 8.5 && vMat < 9.5) col += vCol * (uLampK * 5.);
  // the bright wet patio throws slow ripples of light up the passage's tiles and vault
  if (inPass > 0. || arch2 > 0.) {
    vec2 cq = mix(vec2(vW.x * 0.6 + vW.z * 0.35, vW.y * 0.75 + vW.z * 0.4), vec2(vW.x * 2.6 + vW.z * 0.3, (vW.y + vW.z * abs(n.y)) * 1.5), arch2) * 0.42;
    float ca = sin(cq.x * 1.9 + uTime * 0.9 + 2.1 * sin(cq.y * 1.3 - uTime * 0.6));
    float cb = sin(cq.y * 2.3 - uTime * 0.7 + 1.9 * sin(cq.x * 1.1 + uTime * 0.5));
    float cau = clamp(0.5 + 0.25 * (ca + cb + sin((cq.x + cq.y) * 1.5 + uTime * 1.1)), 0., 1.);
    col += alb * gateGlow() * (cau * cau * cau * 0.62 * inPass * exp(-max(vW.x - 234., 0.) / 70.));
    col += alb * gateGlow() * ((0.1 + cau * cau * 0.36) * (1. - 0.6 * smoothstep(12., 32., vW.y)) * arch2 * step(vMat, 5.5) * (1. - step(1.5, vMat) * step(vMat, 2.5)));     // and up arch 2
  }
  // the passage floor: the pool of light that comes through the gate, crossed by the shadow of its lace
  if (vMat > 1.5 && vMat < 2.5 && vW.x > 232.) col += alb * gateGlow() * (gatePool(vW) * 1.5);
  col = patioTone(col, 1.0);
  vec3 hv = normalize(sunW + v + vec3(0., 1e-4, 0.));
  float ndh = max(dot(n, hv), 0.), fr = 1. - max(dot(n, v), 0.);
  float fr5 = fr * fr * fr * fr * fr;
  if (wetRefl > 0.) {
    vec3 r = reflect(-v, normalize(mix(n, vec3(0., 1., 0.), inPass * step(1.5, vMat)))); r.y = abs(r.y) + 0.03;   // the film lies flatter than the stones
    // a film of water still creeping over the passage floor makes the mirrored arch shiver
    r.xz += inPass * 0.07 * (vec2(vnoise(vW.xz * 0.7 + vec2(uTime * 0.5, 0.)), vnoise(vW.zx * 0.7 + vec2(0., uTime * 0.4))) - 0.5);
    vec3 m = mirror(vW, normalize(r));
    col = mix(col, m, clamp(wetRefl * (0.05 + 0.95 * fr5 + 0.5 * uPuddle * wetRefl) + inPass * (0.16 + 0.6 * fr * fr), 0., 0.92));
  }
  if (sheen > 0. && vW.x > 232.) col += gateMirror(vW, normalize(reflect(-v, n) + vec3(0., 1e-4, 0.))) * (sheen * (0.05 + 0.75 * fr * fr * fr));
  col += uSunCol * (gloss * sun * (pow(ndh, 60.) * 1.2 + pow(ndh, 8.) * 0.05)) + uSkyCol * (gloss * fr * fr * 0.35 * well);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// how much sky a point sees: the passage is lit only from its gate, a deep patio is dimmer at its foot
// (a shallow patio sees far more sky than a deep one, so the first is the brightest shade of the three)
const WELL_GLSL = /* glsl */`
float wp_well(vec3 w){
  float inPass = smoothstep(228., 236., w.x);
  float fall = 0.36 + 0.95 * exp(-max(w.x - 234., 0.) / 46.);
  float deep = w.x < 61. ? 0.62 + 0.38 * smoothstep(0., 90., w.y) : w.x < 155. ? 0.68 + 0.32 * smoothstep(0., 60., w.y) + 0.2 * uOpenSky : 0.78 + 0.22 * smoothstep(0., 40., w.y) + 0.36 * uOpenSky;
  return mix(deep, fall, inPass);
}
`;
// The gate (plane x = 230, opening 20 m wide, round head springing at y 18) as the passage sees it: how much light
// passes a point g = (z + 30, y) of its plane. The fan's rays and rings are fixed; the two leaves' bars fold toward
// their hinges as the gate opens (uGateOpen, radians). blur softens the lace with distance.
const GATE_GLSL = /* glsl */`
uniform float uGateOpen, uGateH;
vec3 gateGlow(){ return uLime * (uSunCol * 0.55 + uSkyCol * 1.05); }
float gateLace(vec2 g, float blur){
  float az = abs(g.x);
  float top = 18. + sqrt(max(100. - g.x * g.x, 0.));
  float inside = (1. - smoothstep(9.5, 10.1 + blur, az)) * (1. - smoothstep(top - 0.3, top + 0.3 + blur, g.y)) * step(0., g.y);
  float w = 0.2 + blur;
  vec2 f = vec2(g.x, max(g.y - 18., 0.));
  float r = length(f), a = atan(f.y, f.x + 1e-4);
  float ray = abs(fract(a / 3.14159265 * 14. + 0.5) - 0.5) * 0.2244 * max(r, 0.5);
  float rings = min(min(abs(r - 3.2), abs(r - 6.6)), abs(r - 9.7));
  float fan = 1. - smoothstep(w * 0.55, w * 1.5, min(min(ray, rings), abs(g.y - 18.)));
  float c = max(cos(uGateOpen), 0.03);
  float sl = (10. - az) / c;                                   // metres along a leaf from its hinge
  float bars = abs(fract((sl - 0.15) / 0.97 + 0.5) - 0.5) * 0.97 * c;
  float rails = min(min(abs(g.y - 0.5), abs(g.y - 5.4)), min(abs(g.y - 7.4), abs(g.y - 15.4)));
  float scroll = abs(length(vec2((fract((sl - 1.1) / 1.94 + 0.5) - 0.5) * 1.94 * c, g.y - 11.4)) - 0.9);
  float leaf = 1. - smoothstep(w * 0.5, w * 1.4, min(min(bars, rails), scroll));
  leaf *= step(sl, 10.) * step(g.y, 17.6);
  return inside * (1. - 0.92 * (g.y > 17.8 ? fan : leaf) * clamp(0.34 / w, 0., 1.));     // thin bars lose their bite as they blur
}
// the wet floor and the glazed tiles mirror the bright arch, lace and all
vec3 gateMirror(vec3 wp, vec3 r){
  float t = (wp.x - 230.) / max(-r.x, 1e-3);
  vec3 h = wp + r * t;
  float lace = step(1e-3, -r.x) * gateLace(vec2(h.z + 30., h.y), 0.12 + t * 0.008);
  vec3 beyond = mix(uLime * (uSkyCol * 1.5 + uSunCol * 0.14), uLime * (uSunCol * 0.72 + uSkyCol * 0.6), smoothstep(8., 16., h.y));
  return uLime * gateGlow() * 0.16 + beyond * lace;
}
// light thrown down the passage floor from the bright wall beyond the gate (a source uGateH high, 60 m past it)
float gatePool(vec3 wp){
  float sg = max(wp.x - 230., 0.), k = 60. / (sg + 60.);
  float lace = gateLace(vec2((wp.z + 30.) * k, uGateH * (1. - k)), 0.02 + sg * 0.004);
  return lace * (0.25 + 0.75 * exp(-sg / 55.)) * smoothstep(0., 3., sg);
}
`;

// ---------------------------------------------------------------------------------------------
// 3. geometry builder: everything of one zone goes into one buffer (position, normal, color, uv, aMat)
// ---------------------------------------------------------------------------------------------
const MAT = { LIME: 0, LIME1: 1, FLOOR: 2, IRON: 3, WOOD: 4, TILE: 5, CLAY: 6, WATER: 7, PLAIN: 8, GLASS: 9, POT: 11, LEAF: 12, PETAL: 13, SOIL: 14, ROOF: 15 };
const WHITE = [1, 1, 1];
function makeBuilder() {
  const P = [], N = [], C = [], T = [], M = [];
  const tmp = new THREE.Vector3(), nm = new THREE.Matrix3();
  const B = {
    uvS: [1, 1],
    count: () => M.length,
    // a quad a-b-c-d (around), normal n, optional per-corner colour multipliers
    quad(a, b, c, d, n, mat, col = WHITE, uv = [0, 0, 1, 1], k = null) {
      const vs = [a, b, c, a, c, d], ks = k ? [k[0], k[1], k[2], k[0], k[2], k[3]] : null;
      const us = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
      for (let i = 0; i < 6; i++) {
        const p = vs[i], s = ks ? ks[i] : 1;
        P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(col[0] * s, col[1] * s, col[2] * s); T.push(us[i][0], us[i][1]); M.push(mat);
      }
    },
    // append a three.js geometry, transformed; col null keeps its own colours
    geo(g, mat, col = WHITE, m4 = null, shade = null) {
      const src = g.index ? g.toNonIndexed() : g;
      const p = src.attributes.position, n = src.attributes.normal, t = src.attributes.uv, c = src.attributes.color;
      if (m4) nm.getNormalMatrix(m4);
      for (let i = 0; i < p.count; i++) {
        tmp.fromBufferAttribute(p, i); if (m4) tmp.applyMatrix4(m4);
        P.push(tmp.x, tmp.y, tmp.z);
        const s = shade ? shade(tmp.x, tmp.y, tmp.z) : 1;
        if (col) C.push(col[0] * s, col[1] * s, col[2] * s); else if (c) C.push(c.getX(i) * s, c.getY(i) * s, c.getZ(i) * s); else C.push(s, s, s);
        tmp.fromBufferAttribute(n, i); if (m4) tmp.applyMatrix3(nm).normalize();
        N.push(tmp.x, tmp.y, tmp.z);
        if (t) T.push(t.getX(i) * B.uvS[0], t.getY(i) * B.uvS[1]); else T.push(0, 0);
        M.push(mat);
      }
      if (src !== g) src.dispose();
      g.dispose();
    },
    box(cx, cy, cz, sx, sy, sz, mat, col = WHITE, rotY = 0, shade = null) {
      const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(cx, cy, cz);
      B.geo(new THREE.BoxGeometry(sx, sy, sz), mat, col, m, shade);
    },
    // a bar between two points
    rod(a, b, r, mat, col = WHITE, segs = 5) {
      const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length();
      const g = new THREE.CylinderGeometry(r, r, len, segs, 1, true);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1));
      B.geo(g, mat, col, m);
    },
    // a turned shape: profile [[r, y], ...] from the foot up
    lathe(profile, segs, at, mat, col = WHITE, scale = 1, shade = null) {
      const pts = profile.map((p) => new THREE.Vector2(p[0] * scale, p[1] * scale));
      const m = new THREE.Matrix4().setPosition(at[0], at[1], at[2]);
      B.geo(new THREE.LatheGeometry(pts, segs), mat, col, m, shade);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 1));
      g.computeBoundingSphere();
      return g;
    },
  };
  // walls at constant x or z, darker toward the foot (kb) so corners fall off; uv in tiles of 1.5 m
  B.wallX = (x, z0, z1, y0, y1, nx, mat, kb = 0.82, kt = 1) => B.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [nx, 0, 0], mat, WHITE, [z0 / 1.5, y0 / 1.5, z1 / 1.5, y1 / 1.5], [kb, kb, kt, kt]);
  B.wallZ = (z, x0, x1, y0, y1, nz, mat, kb = 0.82, kt = 1) => B.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, nz], mat, WHITE, [x0 / 1.5, y0 / 1.5, x1 / 1.5, y1 / 1.5], [kb, kb, kt, kt]);
  // a pebble floor whose border darkens toward the walls (contact shade)
  B.floor = (x0, x1, z0, z1, b = 7, y = 0) => {
    const xs = [x0, x0 + b, x1 - b, x1], zs = [z0, z0 + b, z1 - b, z1], kx = [0.45, 1, 1, 0.45];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const k = (a, c) => Math.min(kx[a], kx[c]);
      B.quad([xs[i], y, zs[j]], [xs[i], y, zs[j + 1]], [xs[i + 1], y, zs[j + 1]], [xs[i + 1], y, zs[j]], [0, 1, 0], MAT.FLOOR, WHITE, [0, 0, 1, 1], [k(i, j), k(i, j + 1), k(i + 1, j + 1), k(i + 1, j)]);
    }
  };
  // a wall at constant x pierced by a round-headed arch (centre zc, width w, height h), with the arch's own
  // depth from x to xb (jambs and soffit)
  B.archX = (x, xb, zc, w, h, z0, z1, H, nx, mat = MAT.LIME) => {
    const r = w / 2, sy = h - r, S = 14;
    B.wallX(x, z0, zc - r, 0, H, nx, mat); B.wallX(x, zc + r, z1, 0, H, nx, mat);
    for (let i = 0; i < S; i++) {
      const a0 = Math.PI * i / S, a1 = Math.PI * (i + 1) / S;
      const za = zc - r * Math.cos(a0), ya = sy + r * Math.sin(a0), zb = zc - r * Math.cos(a1), yb = sy + r * Math.sin(a1);
      B.quad([x, ya, za], [x, yb, zb], [x, H, zb], [x, H, za], [nx, 0, 0], mat, WHITE, [0, 0, 1, 1], [0.9, 0.9, 1, 1]);
      if (xb !== x) B.quad([x, ya, za], [xb, ya, za], [xb, yb, zb], [x, yb, zb], [0, -Math.sin((a0 + a1) / 2), Math.cos((a0 + a1) / 2)], MAT.LIME1, [0.86, 0.86, 0.86]);
    }
    if (xb !== x) {
      B.quad([x, 0, zc - r], [xb, 0, zc - r], [xb, sy, zc - r], [x, sy, zc - r], [0, 0, 1], MAT.LIME, [0.88, 0.88, 0.88], [0, 0, 1, 1], [0.7, 0.7, 1, 1]);
      B.quad([x, 0, zc + r], [xb, 0, zc + r], [xb, sy, zc + r], [x, sy, zc + r], [0, 0, -1], MAT.LIME, [0.88, 0.88, 0.88], [0, 0, 1, 1], [0.7, 0.7, 1, 1]);
    }
  };
  return B;
}

// a clay pot (rim radius 1 at y 0, foot at y -1.5) with a mound of leaf cards and umbels, or with trailing strands
function plantGeometry(rng, trailing) {
  const B = makeBuilder();
  B.lathe([[0.001, -1.5], [0.62, -1.5], [1.0, -0.06], [1.1, 0.04], [0.001, -0.1]], 6, [0, 0, 0], MAT.POT);
  const card = (c, right, up, s, mat, col) => {
    const a = [c[0] - right[0] * s - up[0] * s, c[1] - right[1] * s - up[1] * s, c[2] - right[2] * s - up[2] * s];
    const b = [c[0] + right[0] * s - up[0] * s, c[1] + right[1] * s - up[1] * s, c[2] + right[2] * s - up[2] * s];
    const cc = [c[0] + right[0] * s + up[0] * s, c[1] + right[1] * s + up[1] * s, c[2] + right[2] * s + up[2] * s];
    const d = [c[0] - right[0] * s + up[0] * s, c[1] - right[1] * s + up[1] * s, c[2] - right[2] * s + up[2] * s];
    const n = [right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]];
    B.quad(a, b, cc, d, n, mat, col);
  };
  const green = (k) => [0.13 * k, 0.34 * k, 0.1 * k];
  if (!trailing) {
    for (let i = 0; i < 10; i++) {                               // the mound
      const az = i / 10 * 6.283 * 1.3 + rng.range(-0.3, 0.3), el = i < 3 ? rng.range(0.9, 1.3) : rng.range(0.15, 0.7);
      const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      const R = rng.range(0.75, 1.15);
      const right = [-Math.sin(az), 0, Math.cos(az)], up = [-Math.cos(az) * Math.sin(el), Math.cos(el), -Math.sin(az) * Math.sin(el)];
      card([dir[0] * R, 0.25 + dir[1] * R * 0.9, dir[2] * R + 0.25], right, up, rng.range(0.8, 1.1), MAT.LEAF, green(rng.range(0.7, 1.35) * (0.75 + 0.25 * dir[1])));
    }
    for (let i = 0; i < 6; i++) {                                // umbels on stalks, the i-th shows when bloom > i / 6
      const az = i * 2.4 + rng.range(-0.4, 0.4), el = rng.range(0.35, 1.2), R = rng.range(1.35, 1.95);
      const dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      const right = [-Math.sin(az), 0, Math.cos(az)], up = [-Math.cos(az) * Math.sin(el), Math.cos(el), -Math.sin(az) * Math.sin(el)];
      card([dir[0] * R, 0.3 + dir[1] * R, dir[2] * R + 0.3], right, up, rng.range(0.42, 0.6), MAT.PETAL, [rng.range(0.8, 1.05), 0, i / 6 + 0.02]);
    }
  } else {
    for (let s = 0; s < 5; s++) {                                // strands over the rim and down
      const x = (s - 2) * 0.42 + rng.range(-0.1, 0.1), z = 0.55 + rng.range(0, 0.5), L = rng.range(0.6, 1);
      for (let j = 0; j < 3; j++) {
        const y = 0.3 - (j + 0.5) * 1.5 * L, tw = rng.range(-0.5, 0.5);
        card([x + rng.range(-0.15, 0.15), y, z + j * 0.1], [Math.cos(tw), 0, Math.sin(tw)], [0, 1, 0], 0.8, MAT.LEAF, green(rng.range(0.8, 1.35)));
        if ((s + j) % 2 === 0) card([x + rng.range(-0.4, 0.4), y - 0.3, z + 0.35 + j * 0.1], [1, 0, 0], [0, 0.94, 0.34], rng.range(0.34, 0.5), MAT.PETAL, [rng.range(0.8, 1.05), 0, (s * 3 + j) / 15]);
      }
    }
    card([0, 0.45, 0.2], [1, 0, 0], [0, 0.5, -0.86], 0.95, MAT.LEAF, green(1.1));
  }
  return B.build();
}

// ---------------------------------------------------------------------------------------------
// 4. zones
// ---------------------------------------------------------------------------------------------
const IRON = [0.035, 0.04, 0.05], TIMBER = [0.34, 0.2, 0.11], STRAW = [0.62, 0.5, 0.26], CLAYC = [0.6, 0.3, 0.16], GREEN = [0.07, 0.24, 0.12], ROOFC = [0.62, 0.3, 0.17];
const JAR = [[0.01, 0], [0.9, 0], [1.45, 1.1], [1.7, 2.5], [1.4, 3.9], [0.85, 4.5], [1.05, 4.95], [0.8, 5.0], [0.7, 4.6]];
const jarShade = (y0) => (x, y) => 0.55 + 0.45 * clamp((y - y0) / 2.5, 0, 1);

// a rush-seated chair, 10 times life: seat at 4.5 m, back to 9.6 m
function chair(B, x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), W = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c];
  for (const [lx, lz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) B.rod(W(lx, 0, lz), W(lx, lz < 0 ? 9.6 : 4.5, lz), 0.26, MAT.WOOD, TIMBER, 6);
  B.box(x, 4.5, z, 4.6, 0.45, 4.6, MAT.WOOD, STRAW, rot);
  for (const y of [1.6, 3.0]) { B.rod(W(-2, y, -2), W(2, y, -2), 0.15, MAT.WOOD, TIMBER, 5); B.rod(W(-2, y, 2), W(2, y, 2), 0.15, MAT.WOOD, TIMBER, 5); B.rod(W(-2, y - 0.4, -2), W(-2, y - 0.4, 2), 0.15, MAT.WOOD, TIMBER, 5); B.rod(W(2, y - 0.4, -2), W(2, y - 0.4, 2), 0.15, MAT.WOOD, TIMBER, 5); }
  for (const y of [6.2, 7.6, 9.0]) { const m = new THREE.Matrix4().makeRotationY(rot).setPosition(...W(0, y, -2)); B.geo(new THREE.BoxGeometry(4.2, 0.8, 0.22), MAT.WOOD, TIMBER, m); }
}
// a window with a grille and two green shutters on a wall at constant z (ax 'z') or x (ax 'x'); sgn = which way it faces
function windowOn(B, x, y, z, ax, sgn, w = 5, h = 7) {
  const W = (l, yy, o) => (ax === 'z' ? [x + l, yy, z + sgn * o] : [x + sgn * o, yy, z + l]);
  const bx = (l, yy, o, sl, sy, so, mat, col, rot = 0) => { const c = W(l, yy, o); if (ax === 'z') B.box(c[0], c[1], c[2], sl, sy, so, mat, col, rot); else B.box(c[0], c[1], c[2], so, sy, sl, mat, col, rot); };
  bx(0, y, 0.12, w, h, 0.2, MAT.PLAIN, [0.02, 0.025, 0.04]);
  bx(0, y - h / 2 - 0.3, 0.5, w + 1.4, 0.6, 1.2, MAT.LIME1, [0.95, 0.95, 0.95]);
  for (let i = -2; i <= 2; i++) B.rod(W(i * w / 5, y - h / 2, 0.6), W(i * w / 5, y + h / 2, 0.6), 0.12, MAT.IRON, IRON, 4);
  for (let j = -1; j <= 1; j++) B.rod(W(-w / 2, y + j * h / 3.2, 0.6), W(w / 2, y + j * h / 3.2, 0.6), 0.12, MAT.IRON, IRON, 4);
  for (const d of [-1, 1]) bx(d * (w / 2 + w / 4 - 0.1), y, 0.45, w / 2, h, 0.25, MAT.WOOD, GREEN, d * sgn * 0.25 * (ax === 'z' ? 1 : -1));
}

// A: the passage, the gate wall, patio 1 and the wall of arch 1
async function buildZoneA(B, rng, Y) {
  // passage: floor, tiled dado, lime above, barrel vault with ribs, the shut street door
  B.floor(226, 340, -40, -20, 3);
  for (const [z, nz] of [[-40, 1], [-20, -1]]) {
    B.wallZ(z, 234, 340, 0, 14, nz, MAT.TILE, 0.7, 1);
    B.wallZ(z, 234, 340, 14, 16.1, nz, MAT.LIME1, 1, 1);
    B.box(287, 14.2, z + nz * 0.25, 106, 0.7, 0.5, MAT.PLAIN, [0.05, 0.11, 0.36]);
    B.box(287, 0.6, z + nz * 0.3, 106, 1.2, 0.6, MAT.PLAIN, [0.05, 0.11, 0.36]);
  }
  const S = 12;
  for (let i = 0; i < S; i++) {
    const a0 = Math.PI * i / S, a1 = Math.PI * (i + 1) / S, am = (a0 + a1) / 2;
    const z0 = -30 - 10 * Math.cos(a0), y0 = 16 + 10 * Math.sin(a0), z1 = -30 - 10 * Math.cos(a1), y1 = 16 + 10 * Math.sin(a1);
    B.quad([234, y0, z0], [340, y0, z0], [340, y1, z1], [234, y1, z1], [0, -Math.sin(am), Math.cos(am)], MAT.LIME1);
    for (const x of [247, 273, 299, 325]) B.rod([x, y0 - 0.15 * Math.sin(a0), z0 + 0.15 * Math.cos(a0)], [x, y1 - 0.15 * Math.sin(a1), z1 + 0.15 * Math.cos(a1)], 0.7, MAT.LIME1, [0.9, 0.9, 0.9], 5);
  }
  B.wallX(340, -40, -20, 0, 26, -1, MAT.LIME, 0.6);
  B.box(339.5, 9, -30, 0.6, 18, 12, MAT.WOOD, [0.2, 0.12, 0.07]);
  for (let i = 0; i < 5; i++) {                                 // clay jars along the dado, alternately left and right
    const x = 252 + i * 17, z = i % 2 ? -37.6 : -22.4;
    B.lathe(JAR, 10, [x, 0, z], MAT.CLAY, CLAYC, 1.1 + 0.25 * rng(), jarShade(0));
  }
  B.geo(new THREE.SphereGeometry(1.5, 8, 5, 0, 6.283, 1.5, 1.7), MAT.CLAY, [0.3, 0.22, 0.16], new THREE.Matrix4().setPosition(268, 24.2, -35));     // the swallows' nest

  await Y();
  // gate wall and the fixed fan of rays in the arch head (the two leaves are separate meshes)
  B.archX(226, 234, -30, 20, 28, -60, 0, 48, -1);
  const hub = [230, 18, -30];
  B.rod([230, 18, -40], [230, 18, -20], 0.42, MAT.IRON, IRON, 6);
  for (let i = 1; i < 14; i++) {
    const a = Math.PI * i / 14;
    B.rod(hub, [230, 18 + 9.9 * Math.sin(a), -30 - 9.9 * Math.cos(a)], 0.2, MAT.IRON, IRON, 4);
  }
  for (const r of [3.2, 6.6, 9.7]) for (let i = 0; i < 14; i++) {
    const a0 = Math.PI * i / 14, a1 = Math.PI * (i + 1) / 14;
    B.rod([230, 18 + r * Math.sin(a0), -30 - r * Math.cos(a0)], [230, 18 + r * Math.sin(a1), -30 - r * Math.cos(a1)], 0.2, MAT.IRON, IRON, 4);
  }
  for (let i = 0; i < 14; i++) {                                // a curl between each pair of rays
    const a = Math.PI * (i + 0.5) / 14, m = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(230, 18 + 8.1 * Math.sin(a), -30 - 8.1 * Math.cos(a));
    B.geo(new THREE.TorusGeometry(0.75, 0.14, 4, 9), MAT.IRON, IRON, m);
  }

  await Y();
  // patio 1
  B.floor(160, 226, -60, 0, 7);
  B.wallZ(-60, 160, 226, 0, 48, 1, MAT.LIME); B.wallZ(0, 160, 226, 0, 48, -1, MAT.LIME);
  B.quad([160, 48, -60], [226, 48, -60], [226, 46.6, -56.5], [160, 46.6, -56.5], [0, -0.85, 0.5], MAT.ROOF, ROOFC);
  B.quad([160, 48, 0], [226, 48, 0], [226, 46.6, -3.5], [160, 46.6, -3.5], [0, -0.85, -0.5], MAT.ROOF, ROOFC);
  B.archX(160, 150, -30, 20, 28, -60, 0, 78, 1);
  windowOn(B, 176, 30, -60, 'z', 1); windowOn(B, 208, 31, 0, 'z', -1); windowOn(B, 184, 33, 0, 'z', -1, 4.6, 6.4);
  B.box(212, 8, -59.7, 8, 16, 0.6, MAT.WOOD, GREEN);                      // a green door
  B.box(212, 16.6, -59.5, 10, 1.2, 1, MAT.LIME1, [0.95, 0.95, 0.95]);
  await Y();
  // the fountain: tiled curb, water, a stone stem
  B.uvS = [22, 2];
  B.lathe([[4.3, 0], [5.1, 0], [5.3, 1.7], [5.1, 2.1], [4.4, 2.1], [4.3, 1.3]], 16, [196, 0, -44], MAT.TILE);
  B.uvS = [1, 1];
  B.geo(new THREE.CircleGeometry(4.35, 20), MAT.WATER, WHITE, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(196, 1.55, -44));
  B.lathe([[0.7, 0], [0.5, 2.6], [1.7, 3.5], [1.8, 3.75], [0.3, 3.6]], 10, [196, 0, -44], MAT.LIME1, [0.85, 0.85, 0.82]);
  // two rush chairs and a small table with a jug
  chair(B, 178, -50, 0.5); chair(B, 186, -53.5, -0.35);
  B.geo(new THREE.CylinderGeometry(3, 3, 0.4, 14), MAT.WOOD, TIMBER, new THREE.Matrix4().setPosition(181.5, 6.2, -55));
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; B.rod([181.5 + 2.3 * Math.cos(a), 0, -55 + 2.3 * Math.sin(a)], [181.5 + 0.6 * Math.cos(a), 6, -55 + 0.6 * Math.sin(a)], 0.2, MAT.WOOD, TIMBER, 5); }
  B.lathe([[0.01, 0], [0.6, 0], [0.95, 0.9], [0.8, 1.8], [0.4, 2.2], [0.5, 2.6]], 9, [181, 6.4, -55.3], MAT.CLAY, CLAYC);
  // patio 2's side of the same wall
  B.archX(150, 150, -30, 20, 28, -75, 15, 78, -1);
}

// one leaf of the iron gate: pivot at the origin, the leaf along +z for 10 m, 18 m high
function gateLeafGeometry() {
  const B = makeBuilder();
  for (let i = 0; i <= 10; i++) {
    const z = 0.15 + i * 0.97, top = i % 2 ? 16.4 : 17.6;
    B.rod([0, 0.3, z], [0, top, z], i === 0 || i === 10 ? 0.3 : 0.17, MAT.IRON, IRON, 5);
    if (i > 0 && i < 10) B.geo(new THREE.ConeGeometry(0.34, 1.1, 4), MAT.IRON, IRON, new THREE.Matrix4().setPosition(0, top + 0.5, z));
  }
  for (const y of [0.5, 5.4, 7.4, 15.4]) B.rod([0, y, 0], [0, y, 9.95], 0.26, MAT.IRON, IRON, 5);
  for (let i = 0; i < 5; i++) for (const [y, r] of [[6.4, 0.78], [11.4, 1.5]]) {
    const m = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, y, 1.1 + i * 1.94);
    B.geo(new THREE.TorusGeometry(r > 1 ? 0.9 : r, 0.13, 4, 12), MAT.IRON, IRON, m);
    if (r > 1) { B.geo(new THREE.TorusGeometry(0.55, 0.12, 4, 10, 4.4), MAT.IRON, IRON, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, y + 1.6, 1.1 + i * 1.94)); B.geo(new THREE.TorusGeometry(0.55, 0.12, 4, 10, 4.4), MAT.IRON, IRON, new THREE.Matrix4().makeRotationY(Math.PI / 2).multiply(new THREE.Matrix4().makeRotationZ(Math.PI)).setPosition(0, y - 1.6, 1.1 + i * 1.94)); }
  }
  for (let i = 0; i < 5; i++) B.geo(new THREE.TorusGeometry(0.72, 0.12, 4, 12), MAT.IRON, IRON, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, 2.95, 1.1 + i * 1.94));   // a row of rings low down
  return B.build();
}

// gitanillas hung on chains inside arch 2: [x, rim y, z, size]
const ARCH_POTS = [[66.5, 22.6, -37.3, 1.2], [66.5, 23.6, -22.7, 1.1], [55.5, 23.2, -37.5, 1.15], [55.5, 22.2, -22.5, 1.25]];
// B: patio 2 and the east wing with arch 2
async function buildZoneB(B, Y) {
  B.floor(72, 150, -75, 15, 7);
  B.floor(150, 160, -40, -20, 0); B.floor(50, 72, -41, -19, 0);
  B.wallZ(-75, 72, 150, 0, 78, 1, MAT.LIME); B.wallZ(15, 72, 150, 0, 78, -1, MAT.LIME);
  B.quad([72, 78, -75], [150, 78, -75], [150, 76.4, -71], [72, 76.4, -71], [0, -0.85, 0.5], MAT.ROOF, ROOFC);
  B.quad([72, 78, 15], [150, 78, 15], [150, 76.4, 11], [72, 76.4, 11], [0, -0.85, -0.5], MAT.ROOF, ROOFC);
  B.archX(72, 50, -30, 22, 32, -75, 15, 140, 1);
  B.quad([72, 141.5, -75], [72, 141.5, 15], [76, 139.6, 15], [76, 139.6, -75], [0.5, -0.85, 0], MAT.ROOF, ROOFC);
  for (const [z, nz] of [[-41, 1], [-19, -1]]) {                    // arch 2's jambs carry a dado of tiles under a cobalt cap
    B.wallZ(z + nz * 0.06, 50, 72, 0, 13.5, nz, MAT.TILE, 0.7, 1);
    B.box(61, 13.7, z + nz * 0.22, 22, 0.7, 0.5, MAT.PLAIN, [0.05, 0.11, 0.36]);
    B.box(61, 0.6, z + nz * 0.28, 22, 1.2, 0.6, MAT.PLAIN, [0.05, 0.11, 0.36]);
  }
  for (const [x, y, z, s] of ARCH_POTS) {                           // three chains to a ring, one more to the soffit
    const top = 21 + Math.sqrt(Math.max(121 - (z + 30) * (z + 30), 0)), ry = y + 3.4 * s;
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; B.rod([x + Math.cos(a) * 1.05 * s, y, z + Math.sin(a) * 1.05 * s], [x, ry, z], 0.07, MAT.IRON, IRON, 4); }
    B.rod([x, ry, z], [x, top, z], 0.08, MAT.IRON, IRON, 4);
    B.geo(new THREE.TorusGeometry(0.28, 0.07, 4, 8), MAT.IRON, IRON, new THREE.Matrix4().setPosition(x, ry, z));
  }
  windowOn(B, 96, 40, -75, 'z', 1); windowOn(B, 128, 52, -75, 'z', 1, 4.6, 6.6); windowOn(B, 110, 44, 15, 'z', -1);
  windowOn(B, 72, 58, -52, 'x', 1, 5.4, 7.6); windowOn(B, 72, 86, -8, 'x', 1); windowOn(B, 72, 112, -44, 'x', 1, 5, 7); windowOn(B, 72, 52, 2, 'x', 1, 4.6, 6.4);
  await Y();
  // the tiled bench round the orange tree, earth inside it
  B.uvS = [36, 2];
  B.lathe([[5.6, 0], [8.6, 0], [8.6, 2.6], [8.3, 3.0], [5.9, 3.0], [5.6, 2.6]], 18, [112, 0, -14], MAT.TILE);
  B.uvS = [1, 1];
  B.geo(new THREE.CircleGeometry(5.7, 14), MAT.SOIL, WHITE, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(112, 2.5, -14));
  B.lathe(JAR, 10, [84, 0, -66], MAT.CLAY, CLAYC, 1.5, jarShade(0)); B.lathe(JAR, 10, [141, 0, 6], MAT.CLAY, CLAYC, 1.3, jarShade(0)); B.lathe(JAR, 10, [80, 0, 7], MAT.CLAY, CLAYC, 1.2, jarShade(0));
}

// C: the hero patio's north, south and east sides, eaves and roofs, galleries, iron stair, well
async function buildZoneC(B, rng, chimZ, chimH, Y) {
  B.floor(-50, 50, -70, 70, 8);
  B.wallZ(-70, -50, 50, 0, 140, 1, MAT.LIME, 0.8); B.wallZ(70, -50, 50, 0, 140, -1, MAT.LIME, 0.8);
  B.archX(50, 50, -30, 22, 32, -70, 70, 140, -1);
  // eaves (4 m out, tile ends) and the roofs behind them, so nothing is seen past the patio from above
  const eave = (a, b, c, d, n) => B.quad(a, b, c, d, n, MAT.ROOF, ROOFC);
  eave([-50, 141.5, -70], [50, 141.5, -70], [50, 139.6, -66], [-50, 139.6, -66], [0, -0.85, 0.5]);
  eave([-50, 139.6, -66], [50, 139.6, -66], [50, 140.5, -66], [-50, 140.5, -66], [0, 0, 1]);
  eave([-50, 141.5, 70], [50, 141.5, 70], [50, 139.6, 66], [-50, 139.6, 66], [0, -0.85, -0.5]);
  eave([-50, 139.6, 66], [50, 139.6, 66], [50, 140.5, 66], [-50, 140.5, 66], [0, 0, -1]);
  eave([50, 141.5, -70], [50, 141.5, 70], [46, 139.6, 70], [46, 139.6, -70], [-0.5, -0.85, 0]);
  eave([46, 139.6, -70], [46, 139.6, 70], [46, 140.5, 70], [46, 140.5, -70], [-1, 0, 0]);
  eave([-90, 152, -100], [90, 152, -100], [90, 140.5, -66], [-90, 140.5, -66], [0, 0.95, 0.31]);
  eave([-90, 152, 100], [90, 152, 100], [90, 140.5, 66], [-90, 140.5, 66], [0, 0.95, -0.31]);
  eave([61, 150, -100], [61, 150, 100], [46, 140.5, 100], [46, 140.5, -100], [-0.55, 0.83, 0]);
  eave([-84, 152, -100], [-84, 152, 100], [-45.4, 141.2, 100], [-45.4, 141.2, -100], [0.27, 0.96, 0]);
  await Y();
  // chimneys: the one that notches the edge, and three more against the sky
  const chim = (x, z, w, d, h) => { B.box(x, 140 + h / 2, z, w, h, d, MAT.LIME1); B.box(x, 140 + h + 0.5, z, w + 1.2, 1, d + 1.2, MAT.ROOF, ROOFC); B.box(x, 140 + h + 1.8, z, w * 0.6, 1.6, d * 0.6, MAT.LIME1, [0.9, 0.9, 0.9]); };
  chim(50, chimZ, 5, 8.4, chimH + 2.5); chim(20, -76, 6, 4, 13); chim(-58, -30, 4, 6, 11); chim(-30, 77, 6, 4, 9);
  // three timber galleries on the east wall
  const posts = [-63, -49, -35, -21, -7, 7, 21, 35, 49, 63];
  for (const z of posts) { const y0 = z === -35 || z === -21 ? 35 : 0; B.box(41.6, (140 + y0) / 2, z, 1.3, 140 - y0, 1.3, MAT.WOOD, TIMBER); }
  for (const gy of [35, 70, 105]) {
    await Y();
    B.box(45.5, gy - 0.4, 0, 9, 0.8, 140, MAT.WOOD, TIMBER);
    B.box(41.4, gy - 1.3, 0, 0.9, 1.6, 140, MAT.WOOD, [0.28, 0.16, 0.09]);
    B.box(41.3, gy + 4.9, 0, 0.6, 0.5, 140, MAT.WOOD, TIMBER);
    for (let i = 0; i < 20; i++) B.box(45.6, gy - 1.3, -66.5 + i * 7, 8.6, 1, 0.7, MAT.WOOD, [0.26, 0.15, 0.085]);
    await Y();
    for (let i = 0; i < 80; i++) B.lathe([[0.2, 0], [0.34, 1.1], [0.15, 2.3], [0.34, 3.5], [0.2, 4.7]], 4, [41.3, gy, -69.1 + i * 1.75], MAT.WOOD, TIMBER);
    for (const z of posts) { B.rod([41.6, gy - 5, z], [44.6, gy - 1.2, z], 0.4, MAT.WOOD, TIMBER, 4); }
    await Y();
    for (let i = 0; i < 5; i++) {                                // doors and windows behind the rail
      const z = -56 + i * 28 + (gy === 70 ? 9 : 0);
      B.box(49.7, gy + 6.5, z, 0.5, 13, 6.4, MAT.WOOD, i % 2 ? GREEN : [0.2, 0.12, 0.07]);
      windowOn(B, 50, gy + 9, z + 13, 'x', -1, 4.4, 6);
    }
  }
  for (let i = 0; i < 6; i++) B.lathe(JAR, 10, [45.5, 0, -62 + i * 14 + (i > 1 ? 30 : 0) - (i > 3 ? 4 : 0)], MAT.CLAY, CLAYC, 1.45 + 0.3 * rng(), jarShade(0));
  await Y();
  // jasmine up the north-east post
  for (let i = 0; i < 560; i++) {
    const second = i >= 300 && i < 470, swag = i >= 470;
    if ((i & 127) === 0) await Y();
    let y = second ? 2 + rng() * 104 : 2 + rng() * 136, a = rng() * 6.283, r = 0.9 + rng() * (second ? 1.1 : 1.5), s = 0.75 + rng() * 0.8, pz = second ? 21 : -63;
    if (swag) { const gy = [35, 70, 105][i % 3], t = rng(); pz = (i % 2 ? 21 : -63) + (rng() < 0.5 ? -1 : 1) * t * 9; y = gy + 4.6 - 3.4 * t * (1 - t) * 4 * 0.5 + rng() * 1.2; r = 0.3 + rng() * 0.6; a = Math.PI + (rng() - 0.5) * 2.4; }
    const c = [41.6 + Math.cos(a) * r, y, pz + Math.sin(a) * r], rt = [-Math.sin(a) * s, 0, Math.cos(a) * s], up = [0, s, 0];
    const k = 0.7 + 0.6 * rng(), flower = i % 3 === 0;
    B.quad([c[0] - rt[0] - up[0], c[1] - up[1], c[2] - rt[2] - up[2]], [c[0] + rt[0] - up[0], c[1] - up[1], c[2] + rt[2] - up[2]], [c[0] + rt[0] + up[0], c[1] + up[1], c[2] + rt[2] + up[2]], [c[0] - rt[0] + up[0], c[1] + up[1], c[2] - rt[2] + up[2]],
      [Math.cos(a), 0, Math.sin(a)], flower ? MAT.PETAL : MAT.LEAF, flower ? [0.85, 0.85, 0.78] : [0.09 * k, 0.25 * k, 0.07 * k]);
  }
  // the iron stair against the south wall, standing 7 m out: three flights and two landings
  const treads = [];
  for (let f = 0; f < 3; f++) {
    await Y();
    const x0 = f % 2 ? -32 : 8, dir = f % 2 ? 1 : -1, y0 = f * 26;
    for (let i = 0; i < 20; i++) {
      const x = x0 + dir * (i + 0.5) * 2, y = y0 + (i + 1) * 1.3;
      B.box(x, y, 66.4, 2.3, 0.28, 6.6, MAT.IRON, [0.05, 0.055, 0.065]);
      treads.push([x, y + 0.14, 68.6]);
      if (i % 2 === 0) B.rod([x, y, 63.3], [x, y + 5, 63.3], 0.14, MAT.IRON, IRON, 4);
    }
    for (const z of [63.2, 69.7]) B.rod([x0, y0 + 0.4, z], [x0 + dir * 40, y0 + 26.4, z], 0.34, MAT.IRON, IRON, 5);
    B.rod([x0, y0 + 5.6, 63.3], [x0 + dir * 40, y0 + 31.6, 63.3], 0.2, MAT.IRON, IRON, 5);
    const lx = x0 + dir * 43;
    B.box(lx, y0 + 26, 66.4, 6, 0.3, 6.6, MAT.IRON, [0.05, 0.055, 0.065]);
    B.rod([lx, y0 + 26, 63.4], [lx, y0 + 21, 70], 0.3, MAT.IRON, IRON, 5); B.rod([lx - dir * 3, y0 + 26, 63.4], [lx - dir * 3, y0 + 20, 70], 0.3, MAT.IRON, IRON, 5);
    B.rod([lx + dir * 3, y0 + 26, 63.3], [lx + dir * 3, y0 + 31.2, 63.3], 0.16, MAT.IRON, IRON, 4); B.rod([lx - dir * 3, y0 + 31.2, 63.3], [lx + dir * 3, y0 + 31.2, 63.3], 0.2, MAT.IRON, IRON, 5);
    for (const sx of [x0 + dir * 14, x0 + dir * 28]) B.rod([sx, y0 + (sx - x0) * dir * 0.65, 63.4], [sx, y0 + (sx - x0) * dir * 0.65 - 5, 70], 0.26, MAT.IRON, IRON, 5);
  }
  await Y();
  // the well: tiled curb, water, iron arch, pulley, rope and bucket
  B.uvS = [18, 6];
  B.lathe([[3.4, 0], [4.2, 0], [4.2, 8.4], [4.45, 8.5], [4.45, 9], [3.5, 9], [3.4, 8.2]], 20, [0, 0, 28], MAT.TILE, WHITE, 1, (x, y) => 0.6 + 0.4 * clamp(y / 3, 0, 1));
  B.uvS = [1, 1];
  B.geo(new THREE.CircleGeometry(3.45, 16), MAT.WATER, WHITE, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(0, 7.2, 28));
  for (const sx of [-4.3, 4.3]) { B.rod([sx, 0, 28], [sx, 14.6, 28], 0.34, MAT.IRON, IRON, 6); B.geo(new THREE.TorusGeometry(1.1, 0.16, 4, 12), MAT.IRON, IRON, new THREE.Matrix4().setPosition(sx * 0.72, 13.6, 28)); }
  for (let i = 0; i < 10; i++) {
    const a0 = Math.PI * i / 10, a1 = Math.PI * (i + 1) / 10;
    B.rod([-4.3 * Math.cos(a0), 14.6 + 4.3 * Math.sin(a0), 28], [-4.3 * Math.cos(a1), 14.6 + 4.3 * Math.sin(a1), 28], 0.32, MAT.IRON, IRON, 6);
  }
  B.rod([0, 18.9, 28], [0, 20.4, 28], 0.2, MAT.IRON, IRON, 4);
  B.geo(new THREE.TorusGeometry(0.9, 0.3, 5, 12), MAT.IRON, IRON, new THREE.Matrix4().setPosition(0, 17.4, 28));
  B.rod([0.9, 17.4, 28], [0.9, 12.6, 28], 0.1, MAT.WOOD, STRAW, 4);
  B.lathe([[0.01, 0], [0.75, 0], [1.0, 1.9], [0.92, 1.9], [0.7, 0.2]], 10, [0.9, 10.4, 28], MAT.WOOD, [0.3, 0.2, 0.12]);
  B.geo(new THREE.TorusGeometry(1.0, 0.07, 4, 10, Math.PI), MAT.IRON, IRON, new THREE.Matrix4().setPosition(0.9, 12.2, 28));
  return { treads };
}

// ---------------------------------------------------------------------------------------------
// 5. pots on the other walls, their shadows, the sky, motes, water drops
// ---------------------------------------------------------------------------------------------
// jittered rows and columns on a wall: o = { at: [x, z] of the wall's start, along: [ax, az], len, y0, y1,
// n: [nx, nz] the way the wall faces, count, skip(a, y) }
function scatterWall(out, rng, o) {
  const cols = Math.floor(o.len / 4.3), rows = Math.floor((o.y1 - o.y0) / 4.9), cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  rng.shuffle(cells);
  let n = 0;
  for (const [c, r] of cells) {
    if (n >= o.count) break;
    const a = (c + 0.5) * (o.len / cols) + rng.range(-1.1, 1.1), y = o.y0 + (r + 0.5) * ((o.y1 - o.y0) / rows) + rng.range(-0.8, 0.8);
    const s = 0.7 + 1.0 * Math.pow(rng(), 0.8), kind = rng(), q = [rng(), rng(), rng(), rng(), rng()];
    if (o.skip && o.skip(a, y)) continue;
    out.push({ p: [o.at[0] + o.along[0] * a + o.n[0] * 3, y, o.at[1] + o.along[1] * a + o.n[1] * 3], n: o.n, s, kind, q, wall: true });
    n++;
  }
}
// pots that stand on something (rails, treads, the floor): no wall shadow
const standPot = (out, rng, x, y, z, n, s) => out.push({ p: [x, y + 1.5 * s, z], n, s, kind: rng() * 0.92, q: [rng(), rng(), rng(), rng(), rng()], wall: false });

// two instanced meshes (mounds, trailers) and one of wall shadows for a list of pots
function makePotMeshes(list, geos, potMat, blobMat, C, look) {
  const dawn = look === 'dawn', moon = look === 'moon';
  const bloomW = dawn ? [0.12, 0.52, 0.30, 0.06] : moon ? [0.10, 0.08, 0.76, 0.06] : [0.72, 0.14, 0.09, 0.05];
  const terra = dawn ? 0.34 : 0.14;
  const group = new THREE.Group();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  for (const trailing of [false, true]) {
    const sub = list.filter((p) => (p.kind >= 0.72 && p.kind < 0.92) === trailing);
    if (!sub.length) continue;
    const mesh = new THREE.InstancedMesh(trailing ? geos.trail : geos.mound, potMat, sub.length);
    const iA = new Float32Array(sub.length * 4), iB = new Float32Array(sub.length * 4);
    sub.forEach((p, i) => {
      const yaw = Math.atan2(p.n[0], p.n[1]);
      e.set((p.q[0] - 0.5) * 0.28, yaw + (p.q[1] - 0.5) * 0.5, (p.q[2] - 0.5) * 0.28, 'YXZ');
      const s = trailing ? p.s * (0.9 + 0.5 * p.q[3]) : p.s;
      m4.compose(pos.set(p.p[0], p.p[1], p.p[2]), q.setFromEuler(e), sc.set(s, s, s));
      mesh.setMatrixAt(i, m4);
      const paint = p.q[3] < terra ? C.terra : p.q[3] < terra + 0.08 ? C.glaze : C.cobalt;
      const bx = p.q[4], bc = bx < bloomW[0] ? C.scarlet : bx < bloomW[0] + bloomW[1] ? C.coral : bx < bloomW[0] + bloomW[1] + bloomW[2] ? C.white : C.pink;
      iA.set([paint.r, paint.g, paint.b, p.q[0]], i * 4);
      iB.set([bc.r, bc.g, bc.b, p.kind >= 0.92 || p.fern ? 0 : 0.2 + 0.8 * p.q[2]], i * 4);
    });
    mesh.geometry = mesh.geometry.clone();
    mesh.geometry.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
    mesh.geometry.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  const walls = list.filter((p) => p.wall);
  if (walls.length) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const iP = new Float32Array(walls.length * 4), iN = new Float32Array(walls.length * 2);
    const bb = new THREE.Box3();
    walls.forEach((p, i) => {
      iP.set([p.p[0] - p.n[0] * 3, p.p[1], p.p[2] - p.n[1] * 3, p.s * 1.5], i * 4); iN.set(p.n, i * 2);
      bb.expandByPoint(pos.set(p.p[0], p.p[1], p.p[2]));
    });
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4));
    g.setAttribute('iN', new THREE.InstancedBufferAttribute(iN, 2));
    g.instanceCount = walls.length;
    g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 14;
    const blobs = new THREE.Mesh(g, blobMat); blobs.renderOrder = 1;
    group.add(blobs);
  }
  return group;
}
const blobVert = (COMMON) => /* glsl */`
${COMMON}
attribute vec4 iP; attribute vec2 iN;
varying vec2 vQ; varying vec3 vW, vPar;
#include <fog_pars_vertex>
void main(){
  vec3 n = vec3(iN.x, 0., iN.y), t = vec3(-n.z, 0., n.x);
  vec3 S = vec3(uSunDir.z, uSunDir.y, -uSunDir.x);
  float sn = dot(S, n);
  float k = sn > 0.02 ? 1. / max(sn, 0.4) : 1.;                 // a raking sun stretches the shadow
  vec2 sh = sn > 0.02 ? -3. * vec2(dot(S, t), S.y) * k : vec2(0., -0.01);
  float L = length(sh); vec2 e = sh / max(L, 1e-3);
  float r = iP.w, R = r + 1.7;
  float al = mix(-R, L + r * k + 0.6, position.x * 0.5 + 0.5), ac = position.y * R;
  vQ = vec2(al, ac);
  vec2 w2 = e * al + vec2(-e.y, e.x) * ac;
  vec3 wp = iP.xyz + t * w2.x + vec3(0., w2.y, 0.) + n * 0.08;
  vW = wp; vPar = vec3(L, r * k, r);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const blobFrag = (COMMON) => /* glsl */`
${COMMON}
uniform vec3 uZen, uHor, uLime;
${WORLD_SUN}
varying vec2 vQ; varying vec3 vW, vPar;
#include <fog_pars_fragment>
void main(){
  float ao = exp(-dot(vQ, vQ) / (vPar.z * vPar.z * 1.5)) * 0.55;
  vec2 q = (vQ - vec2(vPar.x, 0.)) / max(vPar.yz, vec2(1e-3));
  float sh = (1. - smoothstep(0.72, 1.08, length(q))) * worldSun(vW) * 0.9;
  float a = max(ao, sh);
  if (a < 0.01) discard;
  vec3 col = uLime * uSkyCol * mix(0.32, 0.7, clamp(sh / max(a, 1e-3) - ao, 0., 1.));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// the sky: deep blue paling to the rooflines, combs of cirrus on the sun's clock, puffs after rain, stars by moon
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const skyFrag = (COMMON) => /* glsl */`
${COMMON}
uniform vec3 uZen, uHor, uCirrus; uniform float uCloudT, uStars, uPuff, uHorTop;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  vec3 col = mix(uHor, uZen, smoothstep(-0.02, uHorTop, d.y));
  vec2 p = d.xz / max(d.y + 0.3, 0.12);
  p.x += uCloudT;
  // the north-west corner of the sky square, where the portal hangs, stays clean deep blue
  float clear = 1. - 0.9 * smoothstep(0.55, 0.9, dot(d, vec3(-0.38, 0.84, -0.38)));
  float band = fbm3(p * vec2(0.55, 1.7) + 4.);
  float comb = vnoise(vec2(p.x * 1.1 + 2.5 * vnoise(p * 0.6), p.y * 13.));
  float c = smoothstep(0.6, 0.84, band) * (0.25 + 0.75 * comb * comb) * smoothstep(0.0, 0.35, d.y) * clear;
  col = mix(col, uCirrus, c * 0.5);
  float pf = smoothstep(0.62, 0.76, fbm3(p * 1.25 + vec2(uCloudT * 1.6, 9.))) * uPuff * smoothstep(0.05, 0.4, d.y) * clear;
  col = mix(col, uCirrus * (0.62 + 0.3 * fbm3(p * 4. + uCloudT)), pf * 0.85);
  // stars: one small round point somewhere inside a cell in sixteen, each with its own size and twinkle
  vec2 sq = d.xz / max(d.y + 0.2, 0.1) * 60., sg = floor(sq);
  vec2 sr = h22(sg);
  float sd = length(fract(sq) - 0.5 - (sr - 0.5) * 0.6);
  float mag = h21(sg + 3.7);
  float st = step(0.94, h21(sg)) * (1. - smoothstep(0.03, 0.1 + 0.1 * mag, sd)) * (0.5 + 2.2 * mag * mag) * (0.72 + 0.28 * sin(uTime * (1.5 + 3. * sr.x) + sr.y * 40.));
  col += vec3(0.75, 0.84, 1.) * (st * uStars * (1. - c) * smoothstep(0.08, 0.4, d.y));
  gl_FragColor = vec4(col, 1.);
}`;

// motes: dim and blue in shade, bright above the shadow plane, so the plane is seen coming
const moteVert = (COMMON) => /* glsl */`
${COMMON}
uniform vec3 uZen, uHor;
${WORLD_SUN}
attribute vec4 iP;
uniform vec3 uCam; uniform float uPx, uMist;
varying vec2 vQ; varying vec3 vCol;
void main(){
  vec3 box = vec3(70., 56., 70.);
  vec3 drift = vec3(0.5 * sin(uTime * 0.21 + iP.w * 30.), 0.35 + 0.3 * sin(uTime * 0.17 + iP.w * 50.), 0.5 * cos(uTime * 0.19 + iP.w * 40.));
  vec3 p = iP.xyz * box + drift * 2. + vec3(uTime * 0.25, uTime * 0.12, 0.);
  p = mod(p - uCam + box * 0.5, box) - box * 0.5 + uCam;
  float sun = worldSun(p);
  vec4 mv = viewMatrix * vec4(p, 1.);
  float dist = max(-mv.z, 0.01);
  float size = 0.018 + 0.03 * fract(iP.w * 7.3);
  float minS = 1.4 * dist / max(uPx, 1.);
  float k = min(size / minS, 1.); k *= k;
  size = max(size, minS);
  float tw = 0.55 + 0.45 * sin(uTime * (1.5 + 3. * fract(iP.w * 3.1)) + iP.w * 80.);
  float fade = smoothstep(2.5, 8., dist) * (1. - smoothstep(26., 36., dist)) * (1. - smoothstep(126., 137., p.y)) * step(0.3, p.y);
  float gate = smoothstep(232., 240., p.x) * exp(-max(p.x - 234., 0.) / 50.);
  vCol = (uSunCol * (sun * 0.6 * tw) + uSkyCol * (0.07 + 0.1 * uMist) + (uSunCol * 0.8 + uSkyCol * 1.2) * (gate * tw)) * (k * fade);
  vQ = position.xy;
  mv.xy += position.xy * size;
  gl_Position = projectionMatrix * mv;
}`;
const MOTE_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vCol;
void main(){ float a = 1. - smoothstep(0.3, 1., length(vQ)); gl_FragColor = vec4(vCol * a, 0.); }`;

// water in the air: the fountain's jet and the bucket's drips, closed-form parabolas
const dropVert = (COMMON) => /* glsl */`
${COMMON}
uniform vec3 uZen, uHor;
${WORLD_SUN}
attribute vec4 iP, iV;
varying vec2 vQ; varying vec3 vCol;
#include <fog_pars_vertex>
void main(){
  float life = iV.w, t = fract(uTime / life + iP.w) * life;
  vec3 p = iP.xyz + iV.xyz * t + vec3(0., -9. * t * t, 0.);
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  float s = 0.09 + 0.1 * fract(iP.w * 9.7);
  vQ = position.xy;
  mvPosition.xy += position.xy * vec2(s, s * 1.5);
  vCol = uSkyCol * 1.3 + skyColor(vec3(0., 1., 0.)) * 0.5 + uSunCol * (worldSun(p) * 1.5);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DROP_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vCol;
#include <fog_pars_fragment>
void main(){ float r = length(vQ); if (r > 1.) discard; gl_FragColor = vec4(vCol * (0.5 + 0.7 * smoothstep(0.9, 0.2, length(vQ - vec2(-0.3, 0.3)))), 0.75); 
  #include <fog_fragment>
}`;
function quadInstances(count, fill) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(count * 4), b = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) fill(i, a, b);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(a, 4));
  g.setAttribute('iV', new THREE.InstancedBufferAttribute(b, 4));
  g.instanceCount = count;
  return g;
}

// a round-pruned tree of this world's own leaf cards (so the roof's shadow crosses it like everything else)
function treeGeometry(rng, o) {
  const B = makeBuilder(), H = o.height, R = o.radius, cy = H - R * 0.95;
  B.lathe([[R * 0.085, 0], [R * 0.075, H * 0.2], [R * 0.06, cy - R * 0.5], [R * 0.03, cy]], 8, [0, 0, 0], MAT.WOOD, [0.2, 0.15, 0.1]);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + rng() * 0.5, r = R * (0.45 + 0.3 * rng());
    B.rod([0, cy - R * (0.75 - 0.08 * i), 0], [Math.cos(a) * r, cy + R * (-0.1 + 0.5 * rng()), Math.sin(a) * r], R * 0.028, MAT.WOOD, [0.2, 0.15, 0.1], 5);
  }
  const N = o.leaves;
  for (let i = 0; i < N; i++) {
    const a = rng() * 6.283, el = Math.asin(rng() * 1.7 - 0.7), rr = R * (0.55 + 0.45 * Math.pow(rng(), 0.4));
    const d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
    const c = [d[0] * rr, cy + d[1] * rr * 0.92, d[2] * rr], s = R * (0.13 + 0.07 * rng()), tw = rng() * 6.283;
    const r0 = [-Math.sin(a), 0, Math.cos(a)], u0 = [-d[1] * Math.cos(a), Math.cos(el), -d[1] * Math.sin(a)];
    const rt = [(r0[0] * Math.cos(tw) + u0[0] * Math.sin(tw)) * s, (r0[1] * Math.cos(tw) + u0[1] * Math.sin(tw)) * s, (r0[2] * Math.cos(tw) + u0[2] * Math.sin(tw)) * s];
    const up = [(u0[0] * Math.cos(tw) - r0[0] * Math.sin(tw)) * s, (u0[1] * Math.cos(tw) - r0[1] * Math.sin(tw)) * s, (u0[2] * Math.cos(tw) - r0[2] * Math.sin(tw)) * s];
    const k = (0.5 + 0.7 * (rr / R - 0.55) / 0.45) * (0.75 + 0.5 * rng()) * (0.7 + 0.3 * (d[1] + 1) / 2);
    const P4 = [[c[0] - rt[0] - up[0], c[1] - rt[1] - up[1], c[2] - rt[2] - up[2]], [c[0] + rt[0] - up[0], c[1] + rt[1] - up[1], c[2] + rt[2] - up[2]], [c[0] + rt[0] + up[0], c[1] + rt[1] + up[1], c[2] + rt[2] + up[2]], [c[0] - rt[0] + up[0], c[1] - rt[1] + up[1], c[2] - rt[2] + up[2]]];
    B.quad(P4[0], P4[1], P4[2], P4[3], d, MAT.LEAF, [0.1 * k, 0.3 * k, 0.07 * k]);
    if (i < o.fruit) {
      const m = new THREE.Matrix4().makeScale(1, o.long, 1).setPosition(d[0] * R * 0.98, cy + d[1] * R * 0.9 - R * 0.06, d[2] * R * 0.98);
      B.geo(new THREE.IcosahedronGeometry(R * 0.055, 1), MAT.PLAIN, o.fruitColor, m, (x, y) => 0.75 + 0.25 * clamp((y - cy) / R + 0.5, 0, 1));
    } else if (i < o.fruit + o.blossom) {
      const cb = [d[0] * R * 1.02, cy + d[1] * R * 0.95, d[2] * R * 1.02], sb = R * 0.05;
      B.quad([cb[0] - r0[0] * sb - u0[0] * sb, cb[1] - u0[1] * sb, cb[2] - r0[2] * sb - u0[2] * sb], [cb[0] + r0[0] * sb - u0[0] * sb, cb[1] - u0[1] * sb, cb[2] + r0[2] * sb - u0[2] * sb],
        [cb[0] + r0[0] * sb + u0[0] * sb, cb[1] + u0[1] * sb, cb[2] + r0[2] * sb + u0[2] * sb], [cb[0] - r0[0] * sb + u0[0] * sb, cb[1] + u0[1] * sb, cb[2] - r0[2] * sb + u0[2] * sb], d, MAT.PETAL, [0.86, 0.86, 0.8]);
    }
  }
  return B.build();
}
// an iron lantern on its chain: origin at the hook, the lamp 6 m below
function lanternGeometry() {
  const B = makeBuilder(), brass = [0.42, 0.3, 0.1];
  B.rod([0, 0, 0], [0, -4.2, 0], 0.11, MAT.IRON, IRON, 4);
  B.geo(new THREE.ConeGeometry(1.25, 1.1, 6), MAT.IRON, brass, new THREE.Matrix4().setPosition(0, -4.6, 0));
  for (let i = 0; i < 6; i++) { const a = i * 1.047; B.rod([Math.cos(a) * 1.05, -5.1, Math.sin(a) * 1.05], [Math.cos(a) * 0.8, -7.4, Math.sin(a) * 0.8], 0.09, MAT.IRON, brass, 4); }
  B.geo(new THREE.CylinderGeometry(0.98, 0.74, 2.2, 6, 1, true), MAT.GLASS, [1.0, 0.62, 0.22], new THREE.Matrix4().setPosition(0, -6.25, 0));
  B.geo(new THREE.CylinderGeometry(0.85, 0.5, 0.35, 6), MAT.IRON, brass, new THREE.Matrix4().setPosition(0, -7.55, 0));
  B.geo(new THREE.TorusGeometry(0.3, 0.07, 4, 8), MAT.IRON, brass, new THREE.Matrix4().setPosition(0, -8.0, 0));
  return B.build();
}

// ---------------------------------------------------------------------------------------------
// 6. the world
// ---------------------------------------------------------------------------------------------
export default {
  id: 'patio-of-pots',
  name: 'Patio of Three Thousand Pots',
  category: 'domestic',
  weirdness: 0.05,
  media: ['air', 'interior'],
  async build(ctx) {
    const rng = ctx.rng.fork('patio-of-pots');
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // which morning: the hour hint decides when it can, otherwise the seed deals one of four looks
    const deal = ['may', 'dawn', 'moon', 'shower', 'may'][Math.abs(Math.floor(ctx.seed || 0)) % 5];
    const hour = vary.hour || 'any';
    const look = hour === 'night' ? 'moon' : hour === 'dawn' || hour === 'golden' ? 'dawn' : hour === 'day' ? (deal === 'shower' ? 'shower' : 'may') : deal;
    const L = LOOKS[look];
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(L.fog, L.fogD);
    const path = makePath(PATH_POINTS);

    // ---- the hero wall ----
    const hero = await buildHero(ctx, { palette: PALETTE, look, altitude: look === 'dawn' ? [9, 53] : undefined, demo: false });
    hero.object.position.set(-50, 0, 0); hero.object.rotation.y = Math.PI / 2;
    scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    hero.uniforms.uSkyCol.value.multiply(new THREE.Color(0.86, 0.97, 1.1)).multiplyScalar(L.shade);   // shade plainly blue, two stops under the sun
    await ctx.yield();

    // ---- shared uniforms and materials ----
    const col = (h) => new THREE.Color(h);
    const C = { lime: col(PALETTE[0]), cobalt: col(PALETTE[2]), scarlet: col(PALETTE[3]), terra: col(PALETTE[5]), glaze: new THREE.Color(0.78, 0.78, 0.74), coral: col('#F0603E'), white: new THREE.Color(0.84, 0.84, 0.8), pink: col('#C2185B') };
    const wallLamp = hero.anchors.toWorld(hero.anchors.lamp);            // the brass lantern on the hero wall's bracket
    const lampPos = [new THREE.Vector4(286, 19.5, -30, 0), new THREE.Vector4(196, 20, -56, 0), new THREE.Vector4(112, 21, 10.5, 0), new THREE.Vector4(7.5, 12, 28, 0), new THREE.Vector4(wallLamp.x, wallLamp.y, wallLamp.z, 0),
      new THREE.Vector4(69.5, 23.8, -30, 0), new THREE.Vector4(39.4, 59.6, 27, 0)];        // ... in the east mouth of arch 2, under the second gallery
    const U = {
      ...THREE.UniformsLib.fog, ...hero.uniforms,
      uZen: { value: col(L.zen) }, uHor: { value: col(L.hor) }, uCirrus: { value: col(L.cirrus) }, uLime: { value: C.lime }, uCobalt: { value: C.cobalt }, uScarlet: { value: C.scarlet },
      uLamp: { value: lampPos }, uLampCol: { value: new THREE.Color(1.0, 0.56, 0.2) }, uLampK: { value: L.lamp },
      uFloorWet: { value: L.wet }, uPuddle: { value: look === 'shower' ? 1 : 0 }, uCloudT: { value: 0 }, uStars: { value: L.stars }, uPuff: { value: look === 'shower' ? 1 : 0 }, uHorTop: { value: look === 'dawn' ? 1.08 : 0.72 },
      uCam: { value: new THREE.Vector3() }, uPx: { value: 500 }, uMist: { value: L.mist },
      uGateOpen: { value: 0 }, uGateH: { value: 50 }, uLift: { value: look === 'moon' ? 0.3 : 1 }, uOpenSky: { value: look === 'moon' ? 0 : 1 },
    };
    if (L.lamp) { for (const v of lampPos) v.w = 1.5; lampPos[4].w = 2.2; hero.uniforms.uHLamp.value.w = 3.0; }
    const COMMON = hero.glsl;
    const pmMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PM_VERT, fragmentShader: pmFrag(COMMON), fog: true, side: THREE.DoubleSide });
    const blobMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: blobVert(COMMON), fragmentShader: blobFrag(COMMON), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    await ctx.yield();

    // ---- zones ----
    const zoneA = new THREE.Group(), zoneB = new THREE.Group(), zoneC = new THREE.Group();
    scene.add(zoneA, zoneB, zoneC);
    const zmesh = (B, into) => { const m = new THREE.Mesh(B.build(), pmMat); into.add(m); return m; };
    {
      const B = makeBuilder(); await buildZoneA(B, rng.fork('zone-a'), ctx.yield); await ctx.yield(); zmesh(B, zoneA); await ctx.yield();
    }
    {
      const B = makeBuilder(); await buildZoneB(B, ctx.yield); await ctx.yield(); zmesh(B, zoneB); await ctx.yield();
    }
    let treads;
    {
      const B = makeBuilder();
      ({ treads } = await buildZoneC(B, rng.fork('zone-c'), -hero.uniforms.uChimX.value, hero.uniforms.uChimH.value, ctx.yield));
      await ctx.yield(); zmesh(B, zoneC); await ctx.yield();
    }
    // the gate's two leaves, pivoted on the jambs
    const leafGeo = gateLeafGeometry();
    const leafL = new THREE.Mesh(leafGeo, pmMat), leafR = new THREE.Mesh(leafGeo, pmMat);
    leafL.position.set(230, 0, -40); leafR.position.set(230, 0, -20); leafR.scale.z = -1;
    zoneA.add(leafL, leafR);
    // lanterns: the passage's, the hero wall's, arch 2's and the gallery's always hang there; by moon all seven burn
    const lanternGeo = lanternGeometry();
    const lanterns = lampPos.map((v, i) => {
      const m = new THREE.Mesh(lanternGeo, pmMat);
      const k = i === 5 ? 1.3 : 1;
      m.scale.setScalar(k); m.position.set(v.x, v.y + 6.3 * k, v.z); m.visible = i === 0 || i >= 4 || !!L.lamp;
      (i < 2 ? zoneA : i === 2 || i === 5 ? zoneB : zoneC).add(m);
      return m;
    });
    await ctx.yield();

    // ---- pots on every other wall ----
    const prng = rng.fork('pots'), nPots = (n) => Math.round(n * (0.85 + 0.15 * density));
    const listA = [], listB = [], listC = [];
    scatterWall(listA, prng, { at: [160, -60], along: [1, 0], len: 66, y0: 6, y1: 44, n: [0, 1], count: nPots(105), skip: (a, y) => Math.abs(a - 52) < 7 && y < 20 });
    scatterWall(listA, prng, { at: [160, 0], along: [1, 0], len: 66, y0: 6, y1: 44, n: [0, -1], count: nPots(95) });
    scatterWall(listA, prng, { at: [160, -60], along: [0, 1], len: 60, y0: 6, y1: 75, n: [1, 0], count: nPots(140), skip: (a, y) => Math.abs(a - 30) < 13.5 && y < 33 });
    {
      const grng = makeRng(hashSeed('patio-of-pots:garland:' + ctx.seed));     // its own stream: the other walls keep their pots
      const gq = () => [grng(), grng(), grng(), grng(), grng()];
      for (const dz of [-12.4, 12.4]) for (let k = 0; k < 4; k++) listA.push({ p: [163, 10.5 + k * 4.4 + grng(), -30 + dz + (grng() - 0.5)], n: [1, 0], s: 0.95 + 0.4 * grng(), kind: grng() * 0.7, q: gq(), wall: true });
      for (let k = 0; k < 7; k++) { const a = Math.PI * (k + 0.5) / 7; listA.push({ p: [163, 18.5 + 13.2 * Math.sin(a) + (grng() - 0.5), -30 - 13.2 * Math.cos(a) + (grng() - 0.5)], n: [1, 0], s: 0.95 + 0.4 * grng(), kind: grng() * 0.7, q: gq(), wall: true }); }
      for (const [x, y, z, sz] of ARCH_POTS) listB.push({ p: [x, y, z], n: [1, 0], s: sz, kind: 0.8, q: [grng(), grng(), 0.3 + 0.7 * grng(), 0.25 + 0.2 * grng(), grng()], wall: false });
    }
    for (let i = 0; i < 4; i++) standPot(listA, prng, 196 + 6.6 * Math.cos(i * 1.57 + 0.6), 0, -44 + 6.6 * Math.sin(i * 1.57 + 0.6), [0, 1], 0.8 + 0.3 * prng());
    for (const [x, z, s] of [[252, -37.6, 1.2], [269, -22.4, 1.2], [286, -37.6, 1.25], [303, -22.4, 1.2], [320, -37.6, 1.2]]) { standPot(listA, prng, x, 5.7 - 1.5 * s, z, [0, z < -30 ? 1 : -1], s); listA[listA.length - 1].fern = true; }
    scatterWall(listB, prng, { at: [72, -75], along: [0, 1], len: 90, y0: 6, y1: 136, n: [1, 0], count: nPots(320), skip: (a, y) => Math.abs(a - 45) < 14.5 && y < 37 });
    scatterWall(listB, prng, { at: [72, -75], along: [1, 0], len: 78, y0: 6, y1: 75, n: [0, 1], count: nPots(140) });
    scatterWall(listB, prng, { at: [72, 15], along: [1, 0], len: 78, y0: 6, y1: 75, n: [0, -1], count: nPots(110) });
    for (let i = 0; i < 7; i++) standPot(listB, prng, 112 + 7.2 * Math.cos(i * 0.9 + 0.3), 3, -14 + 7.2 * Math.sin(i * 0.9 + 0.3), [Math.cos(i * 0.9 + 0.3), Math.sin(i * 0.9 + 0.3)], 0.75 + 0.3 * prng());
    scatterWall(listC, prng, { at: [-50, -70], along: [1, 0], len: 100, y0: 6, y1: 136, n: [0, 1], count: nPots(420) });
    // the south wall: everywhere but in the way of the stair's three flights and landings
    const onStair = (a, y) => {
      const x = a - 50;
      if (x < -41 || x > 17 || y > 90) return false;
      for (let f = 0; f < 3; f++) {
        const x0 = f % 2 ? -32 : 8, dir = f % 2 ? 1 : -1, t = (x - x0) * dir;
        if (t > -4 && t < 47 && Math.abs(y - (f * 26 + clamp(t, 0, 40) * 0.65 + 1.5)) < 6.5) return true;
      }
      return false;
    };
    scatterWall(listC, prng, { at: [-50, 70], along: [1, 0], len: 100, y0: 6, y1: 136, n: [0, -1], count: nPots(390), skip: onStair });
    // the east wall behind the galleries: a band of pots over the doors of each floor
    for (const y0 of [18, 52, 87, 121]) scatterWall(listC, prng, { at: [50, -70], along: [0, 1], len: 140, y0, y1: y0 + 14.7, n: [-1, 0], count: nPots(46), skip: (a, y) => y0 < 30 && Math.abs(a - 40) < 15 });
    for (const t of treads) standPot(listC, prng, t[0], t[1], t[2], [0, -1], 0.5 + 0.12 * prng());
    for (const gy of [35, 70, 105]) {
      for (let z = -68; z < 69; z += 2.9) if (prng() < 0.82) standPot(listC, prng, 41.3, gy + 5.15, z + prng() * 0.8, [-1, 0], 0.5 + 0.28 * prng());
      for (const z of [-63, -49, -35, -21, -7, 7, 21, 35, 49, 63]) for (let k = 0; k < 2; k++) listC.push({ p: [40.0, gy + 12 + k * 11 + prng() * 3, z + (prng() - 0.5)], n: [-1, 0], s: 0.7 + 0.5 * prng(), kind: prng(), q: [prng(), prng(), prng(), prng(), prng()], wall: false });
    }
    for (let i = 0; i < 6; i++) { standPot(listC, prng, 45.5, 6.4, -62 + i * 14 + (i > 1 ? 30 : 0) - (i > 3 ? 4 : 0), [-1, 0], 1.3); listC[listC.length - 1].fern = true; }
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 1.2; standPot(listC, prng, 6.8 * Math.cos(a), 0, 28 + 6.8 * Math.sin(a), [Math.cos(a), Math.sin(a)], 0.8 + 0.5 * prng()); }
    await ctx.yield();
    const potGeos = { mound: plantGeometry(rng.fork('mound'), false), trail: plantGeometry(rng.fork('trail'), true) };
    zoneA.add(makePotMeshes(listA, potGeos, pmMat, blobMat, C, look)); await ctx.yield();
    zoneB.add(makePotMeshes(listB, potGeos, pmMat, blobMat, C, look)); await ctx.yield();
    zoneC.add(makePotMeshes(listC, potGeos, pmMat, blobMat, C, look)); await ctx.yield();

    // ---- trees: orange in blossom in patio 2, lemon (or bitter orange) by the well ----
    const trng = rng.fork('trees'), bitter = trng.chance(0.35);
    const orange = new THREE.Mesh(treeGeometry(trng, { height: 34, radius: 12.5, leaves: Math.round(420 * detail), fruit: 14, blossom: 90, fruitColor: [0.85, 0.36, 0.03], long: 1 }), pmMat);
    orange.position.set(112, 2.4, -14); zoneB.add(orange);
    await ctx.yield();
    const lemon = new THREE.Mesh(treeGeometry(trng, { height: 30, radius: 11, leaves: Math.round(380 * detail), fruit: 60, blossom: 0, fruitColor: bitter ? [0.85, 0.36, 0.03] : [0.86, 0.7, 0.06], long: bitter ? 1 : 1.3 }), pmMat);
    lemon.position.set(10, 0, 36); zoneC.add(lemon);
    await ctx.yield();

    // ---- sky, motes, water in the air ----
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 14), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: skyFrag(COMMON), side: THREE.BackSide, depthWrite: false, fog: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    const mrng = rng.fork('motes');
    const motes = new THREE.Mesh(quadInstances(Math.round(2400 * detail), (i, a) => a.set([mrng(), mrng(), mrng(), mrng()], i * 4)),
      new THREE.ShaderMaterial({ uniforms: U, vertexShader: moteVert(COMMON), fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, fog: false }));
    motes.frustumCulled = false; motes.renderOrder = 3; scene.add(motes);
    const dropMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: dropVert(COMMON), fragmentShader: DROP_FRAG, transparent: true, depthWrite: false, fog: true });
    const drng = rng.fork('drops');
    const jet = new THREE.Mesh(quadInstances(Math.round(260 * (0.5 + 0.5 * detail)), (i, a, b) => {
      const vy = 11 + 2.2 * drng(), an = drng() * 6.283, sp = 0.12 + 0.75 * drng() * drng();
      a.set([196, 3.7, -44, drng()], i * 4); b.set([Math.cos(an) * sp, vy, Math.sin(an) * sp, (vy + Math.sqrt(vy * vy + 77)) / 18], i * 4);
    }), dropMat);
    jet.frustumCulled = false; jet.renderOrder = 2; zoneA.add(jet);
    const drips = new THREE.Mesh(quadInstances(16, (i, a, b) => { a.set([0.9 + (drng() - 0.5) * 1.4, 10.4, 28 + (drng() - 0.5) * 1.4, drng()], i * 4); b.set([0, 0, 0, 0.6 + 0.1 * drng()], i * 4); }), dropMat);
    drips.frustumCulled = false; drips.renderOrder = 2; zoneC.add(drips);
    await ctx.yield();

    // ---- five more bell cages under the gallery beams (the sixth is on the hero wall) ----
    const HP = hero.parts, cageAt = [[39.6, 33.2, -42], [39.6, 33.2, 14], [39.6, 68.2, -14], [39.6, 68.2, 42], [39.6, 103.2, 0]];
    const cages = new THREE.InstancedMesh(HP.cageGeometry, HP.material, 5), cageBirds = new THREE.InstancedMesh(HP.birdGeometry, HP.material, 10);
    cages.frustumCulled = false; cageBirds.frustumCulled = false; zoneC.add(cages, cageBirds);
    const cM = new THREE.Matrix4(), bM = new THREE.Matrix4(), cQ = new THREE.Quaternion(), cE = new THREE.Euler(), cP = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), bP = new THREE.Vector3();
    const crng = rng.fork('cages'), cagePh = cageAt.map(() => crng() * 6.283), birdPh = Array.from({ length: 10 }, () => crng());
    function updateCages(time) {
      for (let c = 0; c < 5; c++) {
        cE.set(0.03 * Math.sin(time * 1.1 + cagePh[c]), 0.9 * Math.sin(time * 0.29 + cagePh[c]) + 0.25 * Math.sin(time * 0.8 + c), 0.035 * Math.sin(time * 1.3 + c));
        cM.compose(cP.set(cageAt[c][0], cageAt[c][1], cageAt[c][2]), cQ.setFromEuler(cE), ONE);
        cages.setMatrixAt(c, cM);
        for (let i = 0; i < 2; i++) {
          const b = c * 2 + i, per = 2.1 + i * 0.9 + c * 0.17, ph = time / per + birdPh[b], k = Math.floor(ph), f = ph - k, s = HP.birdSpots[i];
          const p0 = s[k % 3], p1 = s[(k + 1) % 3], t = smoothstep(0.82, 1, f);
          bP.set(lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t) + Math.sin(t * Math.PI) * 0.55 + 0.03 * Math.abs(Math.sin(time * 9 + b)), lerp(p0[2], p1[2], t));
          const face = Math.sin(k * 12.9898 + b * 4.1) * 43758.5453;
          cE.set(0, (face - Math.floor(face)) * 6.283 + Math.floor(f * 4) * 0.5 + t * 1.2, 0.12 * Math.sin(time * 5 + b * 2) - 0.25 * Math.sin(t * Math.PI));
          bM.compose(bP, cQ.setFromEuler(cE), ONE).premultiply(cM);
          cageBirds.setMatrixAt(b, bM);
        }
      }
      cages.instanceMatrix.needsUpdate = true; cageBirds.instanceMatrix.needsUpdate = true;
    }
    updateCages(0);
    await ctx.yield();

    // ---- creatures ----
    const moon = look === 'moon', dawn = look === 'dawn', camP0 = new THREE.Vector3();
    const birdLight = { sunDir: new THREE.Vector3(0.78, 0.6, 0.14).normalize(), sunColor: moon ? '#c9d6ff' : dawn ? '#ffd9b0' : '#fff4dc', sunIntensity: moon ? 0.7 : 1.7,
      sky: moon ? '#2a3a80' : '#a9bcd8', skyIntensity: moon ? 0.5 : 0.9, ground: moon ? '#1a2450' : '#c8c4b8', groundIntensity: moon ? 0.3 : 0.55 };
    const fauna = F.makeFauna(scene, { light: birdLight });
    const frng = rng.fork('fauna');
    const swiftC = dawn ? { body: '#1c2440', belly: '#e8dccb', wingC: '#182036', trail: '#1c2440', tip: '#0c1020', head: '#7a2a1c' }     // swallows at first light
      : { body: '#15161c', belly: '#2a2a30', wingC: '#111218', trail: '#191a20', tip: '#08080c', head: '#1c1c22' };
    const flier = moon ? 'bats' : 'swifts', flSize = moon ? 6.5 : 6;
    fauna.add(F.makeFlock({ rng: frng.fork('a'), species: flier, count: Math.round(27 * density), size: flSize, speed: moon ? 20 : 34, form: 'loose', spread: [16, 9, 60], wander: [7, 4, 6, 0.6],
      route: [[-30, 128, -42], [28, 137, -44], [36, 124, 18], [12, 112, 50], [-30, 122, 42], [-38, 134, -4]], closed: true, light: birdLight, ...(moon ? {} : swiftC) }));
    fauna.add(F.makeFlock({ rng: frng.fork('b'), species: flier, count: 11, size: flSize, speed: moon ? 18 : 30, form: 'loose', spread: [12, 7, 40], wander: [6, 4, 5, 0.6],
      route: [[205, 60, -30], [172, 72, -50], [122, 92, -42], [98, 98, -8], [140, 84, 2], [192, 64, -10]], closed: true, light: birdLight, ...(moon ? {} : swiftC) }));
    // nine dive across the reveal at u 0.46
    fauna.add(F.makeFlock({ rng: frng.fork('dive'), species: flier, count: 9, size: flSize, form: 'loose', spread: [9, 6, 22], wander: [3, 2, 3, 0.6], light: birdLight, ...(moon ? {} : swiftC),
      cross: { path, u: 0.46, lead: 42, angle: 62, side: 1, height: 16, span: 230, rise: -34, duration: DUR } }));
    // sparrows going up from the fountain as we pass it
    fauna.add(F.makeFlock({ rng: frng.fork('sparrows'), species: 'swifts', count: 8, size: 3.6, speed: 15, form: 'loose', spread: [5, 3, 9], wander: [2, 1.5, 2, 0.9], flap: 9, glide: 0.1, light: birdLight,
      body: '#6a5038', belly: '#c8b89c', wingC: '#4e3a28', trail: '#6a543c', tip: '#2e241a', head: '#5a3a24',
      cross: { path, u: 0.165, lead: 24, angle: 55, side: -1, height: 0, span: 110, rise: 34, duration: DUR } }));
    // the pair of swallows from the vault, ahead of us down the passage and out through the gate
    fauna.add(F.makeFlock({ rng: frng.fork('swallows'), species: 'swifts', count: 2, size: 4, form: 'loose', spread: [3, 1.5, 7], wander: [2.2, 1.2, 2, 0.9], glide: 0.35, light: { ...birdLight, sunIntensity: 0.6, skyIntensity: 1.9, groundIntensity: 1.2 },
      body: '#27325c', belly: '#f0e6d6', wingC: '#222c50', trail: '#27325c', tip: '#141a30', head: '#9a3a26',
      along: { path, side: 3.6, up: 3.2, lead: 25, from: -0.05, to: 0.2, drift: 6 } }));
    await ctx.yield();
    fauna.add(F.makeBees({ rng: frng.fork('bees'), count: Math.round(120 * (0.6 + 0.4 * detail)), size: 4, path, uFrom: 0.565, uTo: 0.685, clear: 4, spread: 10, lift: [-5, 5], light: birdLight }));
    fauna.add(F.makeButterflies({ rng: frng.fork('bf'), count: 24, size: 6.5, path, uFrom: 0.34, uTo: 0.72, clear: 5, spread: 24, lift: [-6, 12], varieties: [['#f6f2e8', '#fff8e0'], ['#f2f0ea', '#e8e0c8']], light: birdLight }));
    if (moon) fauna.add(F.makeMoths({ rng: frng.fork('moths'), count: 60, size: 6, positions: lampPos.map((v) => [v.x, v.y, v.z]), jitter: 5, light: birdLight }));
    await ctx.yield();
    // RARE: forty white doves burst from the top gallery and spiral up the shaft in front of us, turning from blue
    // to white as they rise through the shadow plane, then pour out of the sky square past the portal, to its right (north-east of the exit axis) so the ring stays clear. The route is
    // a corkscrew laid 38 m ahead of the camera along its own gaze from u 0.78 to 0.90; DOVE_U gives the u at which
    // the leading bird reaches each of its points (the rest trail up to 24 m behind, 14 to 38 m from the lens).
    let doves = null;
    const DOVE_PTS = [[40, 109, -6], [20.1, 87.1, 4.4], [6.3, 74, -6.7], [13.5, 83.5, -16.3], [5.8, 96.5, -17.5], [-4, 99.5, -23], [5, 106, -40], [11, 119, -50], [16, 134, -52], [17, 153, -58], [10, 192, -86], [-6, 255, -120]];
    const DOVE_U = DOVE_PTS.map((p, i) => 0.74 + i * 0.0196), doveS = DOVE_PTS.map(() => 0), DOVE_SPEED = 26;
    const doveP = new THREE.Vector3(), doveSun = new THREE.Color(), doveSky = new THREE.Color(), doveGnd = new THREE.Color(), doveShade = new THREE.Color();
    if (rare) {
      doves = F.makeFlock({ rng: frng.fork('doves'), species: 'gulls', count: 40, size: 5, speed: DOVE_SPEED, form: 'loose', spread: [10, 9, 26], wander: [3, 2.5, 3, 0.5], flap: 4.2, amp: 0.8, glide: 0.12,
        route: DOVE_PTS, closed: false, start: 0,
        light: { ...birdLight, sunIntensity: moon ? 1.5 : 2.3, skyIntensity: 1.5, groundIntensity: 0.9 }, body: '#f3f0e8', belly: '#ffffff', wingC: '#ebe8e0', trail: '#f6f4ee', tip: '#d2ccc2', beak: '#d28a6a', head: '#f8f6f0' });
      doves.object.visible = false; scene.add(doves.object);
      // where along the baked route each control point lies (metres)
      const RL = doves.route.length;
      for (let i = 0; i < DOVE_PTS.length; i++) {
        let bd = 1e9;
        for (let k = 0; k <= 400; k++) { const d = doves.route.pointAt(RL * k / 400, doveP).distanceToSquared(camP0.set(DOVE_PTS[i][0], DOVE_PTS[i][1], DOVE_PTS[i][2])); if (d < bd) { bd = d; doveS[i] = RL * k / 400; } }
      }
      doveSun.copy(doves.uniforms.uSunColor.value); doveSky.copy(doves.uniforms.uSkyColor.value); doveGnd.copy(doves.uniforms.uGroundColor.value);
      doveShade.copy(doveSky).multiplyScalar(0.75);                  // under the roof's shadow the birds are lit blue from below as well
    }
    await ctx.yield();
    // falling petals
    const tU = { value: 0 };
    const petals = fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time: tU, count: Math.round(400 * detail), box: [64, 46, 64], size: [0.2, 0.42], velocity: [0.5, -1.6, 0.3],
      colors: dawn ? ['#f0603e', '#f6c8b0', '#e8e6dc'] : moon ? ['#c8d0f0', '#e0e4ff', '#9aa4d0'] : ['#d4221e', '#e8402c', '#f0d8d0'], intensity: moon ? 0.35 : 0.8 });
    scene.add(petals.object);
    await ctx.yield();

    // ---- frame ----
    const camP = new THREE.Vector3(), bufSize = new THREE.Vector2(), edgeW = new THREE.Vector3(), cageW = hero.anchors.toWorld(hero.anchors.cage);
    const portalAt = new THREE.Vector3(...PATH_POINTS[PATH_POINTS.length - 1]);
    return {
      scene, path, duration: DUR, pace: paceOf,
      camera: { fov: 66, near: 0.5, far: 1600, lookAhead: 22, sway: 0.6, bank: 0.35 },
      pois: [
        { at: new THREE.Vector3(72, 66, -30), from: 0.2, to: 0.36, weight: 0.4 },          // the tall wall ahead, lit above the arch
        // the edge on the hero wall: the gaze rides it down and slides south along the wall into the close pass
        { at: (time, u) => edgeW.copy(hero.anchors.edgeAt(u, 18 - 44 * smoothstep(0.44, 0.63, u))).applyMatrix4(hero.object.matrixWorld).setY(edgeW.y - 2), from: 0.33, to: 0.63, weight: 0.78 },
        { at: cageW, from: 0.585, to: 0.67, weight: 0.5 },
        { at: new THREE.Vector3(15, 95, -70), from: 0.655, to: 0.80, weight: 0.5 },          // the sunlit diagonal on the north wall leads the turn
        { at: portalAt, from: 0.72, to: 1.0, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: moon ? '#aebcff' : '#cfe0ff', glow: 0.5, revealDistance: 420 },
      post: { exposure: L.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.03, tint: moon ? '#e6ecff' : dawn ? '#ffe9da' : '#ffffff', shadowTint: moon ? '#050818' : dawn ? '#0c0920' : '#060a1c', vignette: 0.2, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        tU.value = time;
        if (look === 'shower') hero.setCloud(1 - 0.5 * smoothstep(0.3, 0.7, 0.5 + 0.5 * Math.sin(time * 0.8 + 1.3 * Math.sin(time * 0.31))));
        hero.setProgress(u); hero.update(dt, time, camera);
        U.uCloudT.value = u * 2.4 + time * 0.006;
        const burn = 1 - smoothstep(0.12, 0.62, u);                    // first light: the mist the sun burns off
        // morning haze down the chain of arches: from the passage the far patios are luminous and pale behind the black gate
        const haze = moon ? 0 : (dawn ? 0.5 : 2.3) * (1 - smoothstep(0.03, 0.24, u));
        scene.fog.density = L.fogD * (1 + haze + (dawn ? 1.9 * burn : 0));
        if (dawn) U.uMist.value = burn;
        if (moon) U.uLampK.value = 1 + 0.07 * Math.sin(time * 9.1) * Math.sin(time * 5.3);
        camP.setFromMatrixPosition(camera.matrixWorld);
        U.uCam.value.copy(camP);
        ctx.renderer.getDrawingBufferSize(bufSize);
        U.uPx.value = bufSize.y / (2 * Math.tan((camera.fov || 60) * Math.PI / 360));
        // the gate: leaves swing away from u 0.03 to 0.10 and settle with a small rebound
        // (seen through the previous portal they stand ajar and stir in the draught)
        const g = smoothstep(0.02, 0.10, u), open = 0.1 + g * (Math.PI / 2 - 0.1) + 0.05 * Math.sin(g * Math.PI * 3) * (1 - g) + 0.035 * Math.sin(time * 1.1) * (1 - 0.8 * g);
        leafL.rotation.y = -open; leafR.rotation.y = open;
        U.uGateOpen.value = open; U.uGateH.value = 52 - 24 * smoothstep(0, 0.14, u);      // the lace shadow draws in as the sun climbs
        for (let i = 0; i < lanterns.length; i++) { lanterns[i].rotation.z = 0.1 * Math.sin(time * 0.9 + i * 2.1); lanterns[i].rotation.x = 0.05 * Math.sin(time * 0.7 + i); }
        zoneA.visible = u < 0.5;
        updateCages(time);
        fauna.update(dt, time, camera, u);
        petals.setOpacity(0.6 + 0.4 * smoothstep(0.1, 0.22, u));
        petals.update(dt, time, camera);
        if (doves) {
          doves.object.visible = u > DOVE_U[0];
          let i = 0; while (i < DOVE_U.length - 2 && u > DOVE_U[i + 1]) i++;
          const sLead = doveS[i] + (doveS[i + 1] - doveS[i]) * clamp((u - DOVE_U[i]) / (DOVE_U[i + 1] - DOVE_U[i]), 0, 1.6);
          doves.update(dt, sLead / DOVE_SPEED, camera);
          // blue in the roof's shadow, white above the shadow plane (judged at the middle of the flock)
          doves.route.pointAt(Math.max(sLead - 10, 0), doveP);
          const plane = 140 - (50 - doveP.x) * hero.uniforms.uSunTan.value / 0.985, lit = smoothstep(-9, 7, doveP.y - plane);
          doves.uniforms.uSunColor.value.copy(doveSun).multiplyScalar(lit);
          doves.uniforms.uSkyColor.value.copy(doveSky).multiplyScalar(1.15 - 0.15 * lit);
          doves.uniforms.uGroundColor.value.copy(doveGnd).lerp(doveShade, 1 - lit);
        }
      },
      dispose() { potGeos.mound.dispose(); potGeos.trail.dispose(); },
    };
  },
};
