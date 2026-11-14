// THE AIRBRUSHED ABYSS: hero set piece "The hole and its disc, painted" (procedural, no kit imports beyond core).
//
// WHAT     A black hole and its accretion disc as an airbrushed paperback cover, in BUILT metres (the brief's 1:4).
//          PLATE   one sky-filling shell drawn at infinity that paints, per pixel, a true Schwarzschild null ray:
//                  the dead-black shadow (500 across) with a razor frisket edge, the hairline cream ring, the disc
//                  shown twice or three times (floor of lanes, far side lifted over the shadow as an arch, the thin
//                  under-arc), 40 sheared lanes, frisket-hard gaps, teal threads, the splash bloom on the rim, the
//                  hot clumps, the wet trails of the spray cones, and behind it all the sprayed sky: ink ground,
//                  ultramarine haze along the disc plane, toothbrush-spatter stars and nine ruled four-point glints,
//                  all looked up by the BENT ray so they slide, stretch into arcs and double round the shadow.
//          NEAR    real geometry for parallax at the skim, faded out beyond ~700 m where the plate takes over:
//                  hot clumps (round knots, frisket-hard on the leading face only, the back half spray, with long
//                  tails running cream, orange, magenta), travelling spray
//                  cones (fans of mist, apex 120 m up), and arched plumes standing out of the lanes.
// STYLE    Tuned for EXACT COLOURS: the world should return post { flat: 1, bloom: { strength: 0 }, grade:
//          { saturation: 1, contrast: 1, vignette: 0, grain: 0 } } and style 'none'. Every shader writes the paint
//          colour itself, clamped to 0..1; glows are painted (under-spray halos), never bloomed.
//          Shared GLSL exported for the rest of the world: STYLE_GLSL (abSpray, abRamp, abFrisket, abChrome, noise),
//          DISC_GLSL (abDisc, abDiscMask, abWarp: needs the disc uniforms), styleUniforms(hero) and
//          styleMaterial({ paint, vertex, uniforms, ... }) which builds a ShaderMaterial in the style. See the notes
//          above each export. Viewer: --query "part=airbrush-black-hole&bg=night&flat=1&bloom=0".
// SIZE     Hole at the origin, disc in y = 0 (r 300..1500, turning clockwise seen from +Y: angle atan2(z, x)
//          increases with the flow). rs 96. radius 1500, height 1500 (the arch and cones; nothing solid above
//          y 130), center (0,0,0). The object may be moved, rotated and uniformly scaled by the world.
// OPTS     palette    7 hex strings in the brief's order (ink, ultramarine, magenta, orange, cream, teal, cold blue)
//          edition    'cadmium' | 'violet' | 'verdigris' (default: by seed, cadmium most often)
//          cones      3..7 spray cones (default by seed)      gaps  1..4 frisket gaps (default by seed)
//          warp       metres the outer lanes ride up on the far (+X) side (default by seed: 0 or 40..60)
//          clumps     number of hot clumps, at most 14 (default 14 x density by seed)
//          path       [[x,y,z],...] the camera line in local space (default: the brief's); plumes are seeded beside
//                     its skim so they pass 9..24 m off either fin, and nothing solid comes within 8 m of it;
//                     on the hole side between u 0.5 and 0.62 they are capped at 30 m so none cuts the shadow
//          conePass   { u, position } where and when cone 0 sweeps over the camera (default u 0.426, on the skim)
//          duration   seconds of the flight, used only to turn progress into cone travel (47)
//          near       (true) build the near geometry;  steps (32) ray steps before ctx.quality.detail
// PER SEED edition (whole ramp set), number and radii of gaps, number, radii and phases of cones, warp, clump count,
//          orbits and sizes, lane values, star spatter, glint positions, plume layout, splash strength.
// PROGRESS hero.setProgress(u)  path progress 0..1. Places cone 0 so that it sweeps over opts.conePass.position at
//                               conePass.u whatever the flight speed (never called: all cones run on the clock).
//          hero.setEinstein(e)  0..1 rare event: two blue arcs run round the shadow and close into a ring at 1.
// ANCHORS  (local space, built metres)
//          holeCentre (0,0,0)   splash (940,0,-1175): the rim point where the stream lands (the disc is painted
//          brighter there and teal threads start from it)   entry, moonlet, companion, streamTip: the brief's points
//          flyThrough  the brief's path, entry -> portal (clearance: nothing solid within 8 m)
//          portalSeat  { position (-79,117,-97), normal: facing back down the last leg, radius 8.5 }
//          exitDir     unit direction of the last leg (28 degrees up)
//          skim        the point of the single image (20 s), inner the inner-edge pause, viewpoints [{position,target}]
// LIGHTING Self-lit and at infinity: reads no lights, no fog, no shadow maps. The disc IS the lamp: light the ship
//          and moonlet from below with uInk[3] (orange) and from the left with uInk[6].
// COST     plate 1 call (320 triangles, 32 ray steps x detail per pixel: it is the whole sky, so draw nothing
//          opaque behind it), clumps 1, cones 1, plumes 1: 4 draw calls, 20-35k triangles, 4 programs, no
//          textures, no lights; build ~70 ms, yielding throughout. Near geometry is transparent, depthWrite off,
//          renderOrder 2..4: give the ship a higher renderOrder or let it write depth first.
//          hero.info = { edition, cones, gaps, warp, clumps, plumes } tells the world what the seed chose;
//          hero.uniforms.uInk.value are the edition's seven inks (THREE.Color) for the rest of the world.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const RS = 96, R_IN = 300, R_OUT = 1500, B_CRIT = 2.598 * RS;
const DEBUG_VIEW = null, DEBUG_FORCE = null;   // artist's switches for close-up test renders: leave null
const MAX_CONES = 7, MAX_GAPS = 4, MAX_CLUMPS = 14, GLINTS = 9;

// ---------------------------------------------------------------------------------------------------------------
// STYLE_GLSL: the medium. Needs uniforms uInk[7] and uTime (styleUniforms gives both).
//   uInk: 0 ground ink, 1 cool (ultramarine), 2 mid (magenta), 3 hot (orange), 4 cream, 5 the accent (teal), 6 cold.
//   float abSpray(c, key, fp, salt)  GRAIN. c = coverage 0..1; key = position in the SURFACE's own coordinates
//         (metres on the disc, uv x size on a mesh, direction x k on the sky: never the screen); fp = one pixel's
//         footprint in the same units (fwidth(key) taken before any loop); salt re-deals the dots. Returns the
//         coverage as 55% smooth ramp and 45% hashed dots 1.5-3 px across, octave chosen from fp and cross-faded.
//   float abSpeck(c, key, fp, salt)  the dots alone (mist, thin spray, anything that must stay see-through).
//   vec3  abRamp(t)        the sprayed ramp ground -> cool -> mid -> hot -> cream (t 0..1).
//   vec3  abRampS(t, key, fp, salt)  the same ramp with GRAIN: each step between two inks is dots of the upper ink
//         over the lower one. This is how every gradient in the world should be coloured.
//   float abFrisket(d, w)  a mask edge one pixel wide from a signed distance d with pixel footprint w.
//   float abHalo(d, size)  under-spray past a mask: coverage 0.25 falling over 3% of the shape's size (d > 0 outside).
//   vec3  abChrome(refl, key, fp)  chrome bands from the reflection vector's elevation over the disc plane.
export const STYLE_GLSL = /* glsl */`
uniform vec3 uInk[7];
uniform float uTime;
float abHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float abHash3(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float abNoise(vec3 p){
  vec3 i = floor(p), f = p - i; f = f * f * (3. - 2. * f);
  float a = mix(mix(abHash3(i), abHash3(i + vec3(1,0,0)), f.x), mix(abHash3(i + vec3(0,1,0)), abHash3(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(abHash3(i + vec3(0,0,1)), abHash3(i + vec3(1,0,1)), f.x), mix(abHash3(i + vec3(0,1,1)), abHash3(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
float abDots(vec2 key, float cell, float c, float salt){
  vec2 g = vec2(.8776 * key.x - .4794 * key.y, .4794 * key.x + .8776 * key.y) / cell;   // the grid is turned and its rows slip, so dots never line up
  float row = floor(g.y);
  g.x += abHash(vec2(row, salt + 5.3)) * 7.;
  vec2 id = vec2(floor(g.x), row); vec2 f = g - id - .5;
  vec2 sid = id + salt * 17.13;
  float h = abHash(sid);
  float rad = .25 + .2 * abHash(sid + 9.7) + .05 * c;
  vec2 j = (vec2(abHash(sid + 71.7), abHash(sid + 113.1)) - .5) * (1. - 2. * rad);
  float d = length(f - j);
  return step(h, c * 1.04) * (1. - smoothstep(rad * .6, rad, d));
}
float abSpeck(float c, vec2 key, float fp, float salt){     // dots alone: for mist and thin spray
  c = clamp(c, 0., 1.);
  float l = log2(max(fp, 1e-5) * 2.3);
  float l0 = floor(l), f = l - l0;
  float c0 = exp2(l0);
  return mix(abDots(key, c0, c, salt), abDots(key + 37.7, c0 * 2., c, salt + 3.), smoothstep(.2, .8, f));
}
float abSpray(float c, vec2 key, float fp, float salt){
  c = clamp(c, 0., 1.);
  float d = abSpeck(c, key, fp, salt);
  float w = smoothstep(.0, .12, c) * (1. - .8 * smoothstep(.62, 1., c));
  return clamp(mix(c, d * 1.7, .45 * w), 0., 1.);
}
vec3 abRamp(float t){
  t = clamp(t, 0., 1.) * 4.;
  vec3 c = mix(uInk[0], uInk[1], clamp(t, 0., 1.));
  c = mix(c, uInk[2], clamp(t - 1., 0., 1.));
  c = mix(c, uInk[3], clamp(t - 2., 0., 1.));
  return mix(c, uInk[4], clamp(t - 3., 0., 1.));
}
vec3 abRampS(float t, vec2 key, float fp, float salt){
  t = clamp(t, 0., .9999) * 4.; float k = floor(t);
  float g = abSpray(t - k, key, fp, salt + k * 7.);
  vec3 lo = k < .5 ? uInk[0] : (k < 1.5 ? uInk[1] : (k < 2.5 ? uInk[2] : uInk[3]));
  vec3 hi = k < .5 ? uInk[1] : (k < 1.5 ? uInk[2] : (k < 2.5 ? uInk[3] : uInk[4]));
  return mix(lo, hi, g);
}
float abFrisket(float d, float w){ return smoothstep(-.5 * w, .5 * w, d); }
float abHalo(float d, float size){ return .25 * exp(-max(d, 0.) / max(size * .03, 1e-4)) * step(0., d); }
vec3 abChrome(vec3 refl, vec2 key, float fp){
  float e = refl.y / max(length(refl), 1e-4);
  float g = abSpray(.5, key, fp, 0.) - .5;
  e += g * .035;
  vec3 umber = mix(uInk[0], uInk[3], .16);
  vec3 c = mix(umber * .6, umber, smoothstep(-.9, -.25, e));
  c = mix(c, uInk[3], step(-.2, e));
  c = mix(c, mix(uInk[3], uInk[4], .6), step(-.07, e));
  c = mix(c, vec3(1.), step(-.018, e));
  c = mix(c, mix(uInk[6], vec3(1.), .25), step(.02, e));
  c = mix(c, mix(uInk[6], uInk[1], .55), step(.2, e));
  c = mix(c, uInk[1], step(.4, e));
  c = mix(c, mix(uInk[1], uInk[0], .75), step(.66, e));
  return c;
}
`;

// ---------------------------------------------------------------------------------------------------------------
// DISC_GLSL: the painted disc as a function of a point on its plane. Needs STYLE_GLSL first and the disc uniforms.
//   float abWarp(p)                   height of the disc surface over y = 0 at plane point p (x, z)
//   float abDiscMask(p, fpR)          the disc's opacity alone (inner razor, gaps, speckled rim): use it to fade
//                                     anything that lies under the disc: alpha *= 1. - abDiscMask(hit, footprint)
//   vec4  abDisc(p, rd, dist, pxA)    colour and opacity. rd = unit ray direction at the hit (for the flanks),
//                                     dist = path length from the eye, pxA = one pixel's angle in radians.
export const DISC_GLSL = /* glsl */`
uniform vec4 uGap[${MAX_GAPS}];      // x radius, y half width (0 = unused)
uniform vec4 uCone[${MAX_CONES}];    // x cos, y sin of its angle, z radius, w strength (0 = off)
uniform vec4 uClump[${MAX_CLUMPS}];  // x cos, y sin of its angle, z radius, w size (0 = off)
uniform vec4 uDiscA;                 // x warp height, y warp angle, z lane seed, w splash strength
uniform vec4 uDiscB;                 // x splash x, y splash z, z plate clump near fade (1 = fade them near the eye), w splash angle
float abWarp(vec2 p){
  float r = length(p); float m = smoothstep(850., 1500., r);
  float d = max(dot(p, vec2(cos(uDiscA.y), sin(uDiscA.y))) / max(r, 1.), 0.);
  return uDiscA.x * m * m * d * d;
}
float abRim(float r, float n){ return r < 1500. ? mix(1., .34, smoothstep(1290., 1500., r + (n - .5) * 150.)) : .26 * (1. - smoothstep(1500., 1720., r)); }
float abGaps(float r, float fpR, out float leak){
  float m = 1.; leak = 0.;
  for (int i = 0; i < ${MAX_GAPS}; i++){
    vec4 g = uGap[i];
    if (g.y > 0.){ float d = abs(r - g.x) - g.y; m = min(m, abFrisket(d, fpR)); leak = max(leak, .3 * exp(-max(-d, 0.) / (g.y * .45)) * step(d, 0.)); }
  }
  return m;
}
float abDiscMask(vec2 p, float fpR){
  float r = length(p); float leak;
  float a = abFrisket(r - 300., fpR) * abRim(r, .5);
  return a * max(abGaps(r, fpR, leak), leak);
}
float abWet(vec2 p, float r){
  float wet = 0.;
  for (int i = 0; i < ${MAX_CONES}; i++){
    vec4 c = uCone[i];
    vec2 l = vec2(c.x * p.x + c.y * p.y, -c.y * p.x + c.x * p.y);
    float ts = atan(l.y, abs(l.x) + 1e-3) * 6.3662;   // seconds since the cone passed (it travels toward -angle)
    ts = l.x > 0. ? ts : 99.;
    float tr = ts > 0. ? exp(-ts / 1.7) : smoothstep(-110., 0., ts * c.z * .15708);
    float dr = (r - c.z) / 105.;
    wet += c.w * tr * exp(-dr * dr);
  }
  return min(wet, 1.);
}
vec2 abClumps(vec2 p, float r, float fp){
  float cov = 0., head = 0.;
  for (int i = 0; i < ${MAX_CLUMPS}; i++){
    vec4 c = uClump[i];
    if (c.w > 0.){
      vec2 l = vec2(c.x * p.x + c.y * p.y, -c.y * p.x + c.x * p.y);
      if (l.x > 0.){
        float arc = atan(l.y, l.x + 1e-3) * c.z;      // + = ahead of the knot
        float dr = r - c.z;
        float tl = max(-arc, 0.), L = c.w * 6.9;
        float k = clamp(1. - tl / L, 0., 1.);
        float wdt = c.w * (.2 + .34 * k);
        float body = k * k * (1. - smoothstep(.25, 1., abs(dr) / wdt)) * step(arc, 0.);
        float hd = length(vec2(dr, arc * .8)) - c.w * .5;
        float hm = 1. - abFrisket(hd, fp);
        float hal = abHalo(hd, c.w * 6.);
        cov = max(cov, max(body, max(hm, hal)));
        head = max(head, hm);
      }
    }
  }
  return vec2(cov, head);
}
vec4 abDisc(vec2 p, vec3 rd, float dist, float pxA){
  float r = length(p);
  vec2 er = p / max(r, 1.);
  // footprint of a pixel on the plane: long axis along the ray's ground track
  float sinI = max(abs(rd.y), .012);
  float fMin = dist * pxA, fMaj = fMin / sinI;
  vec2 gt = rd.xz / max(length(rd.xz), 1e-4);
  float cb = dot(gt, er);
  float fpR = sqrt(fMaj * fMaj * cb * cb + fMin * fMin * (1. - cb * cb));
  float fpG = fMin * sqrt(min(fMaj / fMin, 9.));
  // lanes: 40 rigid rings, each turning at its own Keplerian rate
  float fl = (r - 300.) / 30.;
  float li = clamp(floor(fl), -1., 46.);
  float rl = 315. + li * 30.;
  float om = 240. * sqrt(300. / rl) / rl;
  float a = om * uTime + li * 2.399;
  float ca = cos(a), sa = sin(a);
  vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
  vec2 e = q / max(r, 1.) * rl;
  float seed = uDiscA.z;
  float laneV = abHash(vec2(li, seed));
  float n1 = abNoise(vec3(e / 330., li * 7.3 + seed));
  float f2 = 1. - smoothstep(2.5, 11., fpR), f3 = 1. - smoothstep(.5, 2.6, fpR);
  float n2 = abNoise(vec3(e / 170., r / 5.5 + seed));
  float n3 = f3 > 0. ? abNoise(vec3(e / 46., r / 1.25)) : .5;
  float laneFade = 1. - smoothstep(9., 34., fpR);
  // heat along the radius, pushed warmer on the flank that comes toward the eye
  float u = clamp((r - 300.) / 1200., 0., 1.);
  float T = mix(1.03, .33, pow(u, .7));
  float nb = abNoise(vec3(r / 170., seed, 2.)), nb2 = abNoise(vec3(r / 62., seed, 9.));
  T += (nb - .5) * .32 + (nb2 - .5) * .2;
  vec2 tng = vec2(-er.y, er.x);
  float flank = clamp(-(tng.x * rd.x + tng.y * rd.z), -1., 1.);
  T += .12 * flank;
  T += ((laneV - .5) * .2 + (n1 - .5) * .26) * mix(.3, 1., laneFade) + (n2 - .5) * .24 * f2 + (n3 - .5) * .16 * f3;
  // a darker seam where each lane shears against the next
  float lf = fl - floor(fl);
  T -= .1 * laneFade * (1. - smoothstep(0., .1 + fpR / 30., min(lf, 1. - lf))) * step(.35, abHash(vec2(li, seed + 4.)));
  // spray cones: wet trails brighten the lanes and coarsen the speckle
  float wet = abWet(p, r);
  T = r > 1500. ? .46 + (n1 - .5) * .2 : T;      // the blush off the rim is one ink step warmer than the last lanes
  T += .3 * wet;
  // splash on the rim
  vec2 sp = p - uDiscB.xy; float sd = dot(sp, sp);
  float spl = uDiscA.w * exp(-sd / 62000.);
  T += .75 * spl;
  // clumps
  vec2 ck = r < 640. ? abClumps(p, r, fpR) : vec2(0.);
  ck *= mix(1., smoothstep(380., 720., dist), uDiscB.z);
  T = max(T, mix(.5, 1.1, ck.x) * step(.02, ck.x));
  // opacity: razor inner edge, frisket gaps with a little under-spray, a rim that thins into separate specks
  float leak;
  float gm = abGaps(r, fpR, leak);
  float rim = abRim(r, n1) + spl * step(r, 1700.);
  float salt = step(.3, wet) * floor(uTime * 3.);
  float grainFp = fpG * (1. + 1.6 * wet);
  float alpha = abFrisket(r - 300., fpR) * (rim > .98 ? 1. : abSpray(rim, q, grainFp, salt));
  float lk = leak * abSpray(.5, q, grainFp, 0.);
  alpha *= max(gm, lk);
  alpha = max(alpha, ck.x * abFrisket(r - 300., fpR));
  // GRAIN: the heat itself is sprayed, so every gradient is specks
  float Tg = mix(T * .95, max(T, 1.), ck.y);
  vec3 col = abRampS(Tg, q, grainFp, salt + 5.);
  // teal threads carried round from the splash in the outer lanes
  float tn = abNoise(vec3(e / 420., r / 10. + seed * 3.));
  float tw = max(.035, fpR / 14.);
  float dth = atan(uDiscB.x * p.y - uDiscB.y * p.x, dot(uDiscB.xy, p) + 1e-3);
  dth = dth < 0. ? dth + 6.2832 : dth;
  float thr = (1. - smoothstep(0., tw, abs(tn - .5))) * (.035 / tw) * smoothstep(820., 1180., r) * (.3 + .7 * exp(-dth / 2.2));
  col = mix(col, uInk[5], clamp(thr * 1.1 + spl * .35 * step(Tg, .9), 0., .92));
  col = mix(col, mix(uInk[4], vec3(1.), .45), clamp(spl * 1.3 - .45, 0., .6));
  // flanks: 3:1 in value
  col *= mix(.4, 1.2, smoothstep(-1., 1., flank));
  return vec4(min(col, vec3(1.)), clamp(alpha, 0., 1.));
}
`;

// ---------------------------------------------------------------------------------------------------------------
// The plate: sky, stars and the lensed disc, one null ray per pixel.
const SKY_GLSL = /* glsl */`
uniform vec4 uGlint[${GLINTS}];   // xyz direction, w size
uniform vec3 uHazeCol;
uniform vec4 uSky;                // x haze amount, y star density, z spatter seed, w glint turn
vec2 abCube(vec3 d, out float face){
  vec3 a = abs(d);
  if (a.x >= a.y && a.x >= a.z){ face = d.x > 0. ? 0. : 1.; return d.yz / max(a.x, 1e-4); }
  if (a.y >= a.z){ face = d.y > 0. ? 2. : 3.; return d.xz / max(a.y, 1e-4); }
  face = d.z > 0. ? 4. : 5.; return d.xy / max(a.z, 1e-4);
}
vec3 abSky(vec3 d, float pa, float starFade){
  float face; vec2 uv = abCube(d, face);
  vec2 key = uv * 420. + face * 131.;
  // ink ground, ultramarine haze lying along the disc plane
  float hz = exp(-d.y * d.y / .045) * uSky.x;
  float band = abNoise(d * 2.3 + uSky.z) - .5;
  float cov = clamp(hz * (.5 + .5 * band), 0., 1.);
  vec3 col = mix(uInk[0], uHazeCol, mix(cov, abSpray(cov, key, pa * 420., 0.), .6) * .62);
  // toothbrush spatter: one dot per cell, thrown denser along three flicked arcs
  float N = 34.;
  vec2 g = uv * N * .5; vec2 id = floor(g); vec2 f = g - id;
  vec2 sid = id + face * 57. + uSky.z;
  float h = abHash(sid);
  float arcs = 0.;
  float a1 = (dot(d, vec3(.36, .8, .48)) - .1) / .07;
  float a2 = (dot(d, vec3(-.6, .64, -.48)) + .22) / .06;
  float a3 = (dot(d, vec3(.1, -.7, .7)) - .3) / .08;
  arcs += exp(-a1 * a1);
  arcs += exp(-a2 * a2);
  arcs += exp(-a3 * a3);
  float prob = uSky.y * (.5 + .5 * min(arcs, 1.));
  if (h < prob){
    float cls = abHash(sid + 3.1);
    float sr = cls < .62 ? .02 : (cls < .92 ? .034 : .055);            // radius in cells (a cell is ~3.4 degrees)
    vec2 c = .18 + .64 * vec2(abHash(sid + 11.3), abHash(sid + 23.9));
    float pr = pa * N * .5;                                             // one pixel in cells
    float rr = max(sr, pr * .8);
    float m = (1. - smoothstep(rr * .55, rr, length(f - c))) * min(1., (sr * sr) / (rr * rr) * 1.6);
    float tint = abHash(sid + 41.7);
    vec3 sc = tint < .1 ? uInk[5] : (tint < .2 ? uInk[2] : uInk[4]);
    col = mix(col, sc * (.55 + .45 * cls), m * starFade);
  }
  // nine ruled four-point glints: straight tapering rays
  for (int i = 0; i < ${GLINTS}; i++){
    vec4 gl = uGlint[i];
    vec3 dd = d - gl.xyz;
    float L = gl.w;
    if (dot(dd, dd) < L * L){
      vec3 t1 = normalize(cross(gl.xyz, vec3(0., 1., 0.)));
      vec3 t2 = cross(gl.xyz, t1);
      float cr = cos(uSky.w + float(i)), sr2 = sin(uSky.w + float(i));
      float x = dot(dd, t1), y = dot(dd, t2);
      vec2 xy = vec2(cr * x + sr2 * y, -sr2 * x + cr * y);
      vec2 ax = abs(xy);
      float w = L * .045;
      float r1 = (1. - smoothstep(0., w * max(1. - ax.x / L, 0.) + pa * .7, ax.y)) * max(1. - ax.x / L, 0.);
      float r2 = (1. - smoothstep(0., w * max(1. - ax.y / (L * .7), 0.) + pa * .7, ax.x)) * max(1. - ax.y / (L * .7), 0.);
      float core = 1. - smoothstep(w * .6, w * 1.6 + pa, length(xy));
      float halo = .25 * exp(-length(xy) / (L * .12));
      col = mix(col, mix(uInk[4], vec3(1.), .5), clamp(max(max(r1, r2), core) + halo, 0., 1.) * starFade);
    }
  }
  return col;
}
`;

const PLATE_VERT = /* glsl */`
uniform mat4 uWorldInv;
varying vec3 vDir;
varying vec3 vCam;
void main(){
  vDir = position;
  vCam = (uWorldInv * vec4(cameraPosition, 1.)).xyz;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * (mat3(modelMatrix) * position), 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}
`;

const PLATE_FRAG = /* glsl */`
precision highp float;
#define STEPS 32
#define RS ${RS.toFixed(1)}
#define BCRIT ${B_CRIT.toFixed(2)}
uniform int uSteps;
uniform float uEinstein;
varying vec3 vDir;
varying vec3 vCam;
${STYLE_GLSL}
${DISC_GLSL}
${SKY_GLSL}
void main(){
  vec3 ro = vCam;
  vec3 rd = normalize(vDir);
  // everything that needs derivatives is taken here, before the march
  float pxA = max(length(fwidth(rd)) * .7, 1e-5);
  vec3 hv = cross(ro, rd);
  float h2 = dot(hv, hv);
  float b = sqrt(h2);
  float bw = max(fwidth(b), 1e-3);
  float inward = step(dot(ro, rd), 0.);

  vec3 x = ro, v = rd;
  vec3 col = vec3(0.); float A = 0.;
  float r = max(length(x), 1.);
  float r2 = r * r;
  vec3 acc = -1.5 * RS * h2 * x / (r2 * r2 * r);
  float sPrev = x.y - abWarp(x.xz);
  float path = 0., captured = 0.;
  for (int i = 0; i < STEPS; i++){
    if (i >= uSteps) break;
    float dt = r * mix(.06, .18, smoothstep(RS * 1.5, RS * 4.2, r)) * (1. + .7 * smoothstep(1700., 3400., r));
    vec3 x0 = x;
    v += acc * (.5 * dt);
    x += v * dt;
    r = max(length(x), 1.); r2 = r * r;
    acc = -1.5 * RS * h2 * x / (r2 * r2 * r);
    v += acc * (.5 * dt);
    float s = x.y - abWarp(x.xz);
    if (s * sPrev < 0.){
      float k = sPrev / (sPrev - s);
      vec3 p = mix(x0, x, k);
      float rr = length(p.xz);
      if (rr > 290. && rr < 1730. && A < .995){
        vec4 d = abDisc(p.xz, v / max(length(v), 1e-4), path + k * dt, pxA);
        col += (1. - A) * d.a * d.rgb; A += (1. - A) * d.a;
      }
    }
    sPrev = s; path += dt;
    if (r < RS * 1.03){ captured = 1.; break; }
    if (r > 1760. && dot(x, v) > 0.) break;
  }
  // the shadow: a frisket mask from the impact parameter, razor sharp whatever the march did
  float lit = mix(1., abFrisket(b - BCRIT, bw * 1.2), inward) * (1. - captured);
  vec3 bent = v / max(length(v), 1e-4);
  float nearRing = smoothstep(BCRIT * 1.015, BCRIT * 1.22, b);
  float mag = 1. + inward * 2.2 * BCRIT * BCRIT / max(b * b - BCRIT * BCRIT, 400.);
  vec3 sky = abSky(bent, pxA * mag, mix(1., nearRing, inward));
  // hairline cream ring hugging the shadow, and its under-spray
  float dr = (b - BCRIT * 1.008) / (bw * 1.1);
  float ring = exp(-dr * dr) * inward;
  // (keyed on the angle round the shadow and the log of the impact parameter: a conformal pair, so a dot is a
  //  round speck at every distance; the angle's seam lies under the shadow, behind the floor of lanes)
  vec3 hk = hv / max(b, 1e-3);
  vec3 fw = -ro / max(length(ro), 1.);
  vec3 sx = normalize(cross(fw, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.));
  vec3 sy = cross(sx, fw);
  vec2 rkey = vec2(atan(dot(hk, sy), 1e-5 - dot(hk, sx)), log(max(b, 1.) / BCRIT)) * 160.;
  float hal = abSpray(abHalo(b - BCRIT, 500.) * 1.5, rkey, bw / max(b, 1.) * 160., 0.) * inward * step(BCRIT, b);
  sky = mix(sky, mix(uInk[3], uInk[4], .35), hal * .8);
  sky = mix(sky, mix(uInk[4], vec3(1.), .35), ring);
  // rare event: two images of a blue star run round the shadow and close into a ring
  if (uEinstein > 0.){
    float cx = abs(dot(hk, sy)) ;                      // 1 at the left and right of the shadow, 0 above and below
    float open = smoothstep(1. - uEinstein * 1.02, 1. - uEinstein * .9 + .02, cx);
    float de = (b - BCRIT * 1.085) / (bw * 1.6 + 1.5 * uEinstein);
    sky = mix(sky, mix(uInk[6], vec3(1.), .3), exp(-de * de) * open * inward * smoothstep(0., .06, uEinstein));
  }
  col += (1. - A) * sky * lit;
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// styleMaterial: a ShaderMaterial in the medium, for everything else in the world (ship, moonlet, star, stream).
//   opts.hero      the object returned by buildHero (shares its inks, clock and disc uniforms), or
//   opts.uniforms  your own (must then hold uInk and uTime, see styleUniforms)
//   opts.paint     GLSL that defines  vec4 abPaint()  returning the paint colour (0..1) and opacity. Available in
//                  it: varyings vUv, vPos (object space), vWorldPos, vNormal (world), vView (unit, eye -> surface),
//                  and everything in STYLE_GLSL (and DISC_GLSL when opts.disc is true).
//   opts.vertex    optional GLSL defining  vec3 abMove(vec3 p)  to animate object-space positions.
//   The rest (transparent, side, depthWrite, blending, extra uniforms) is passed on. No fog, no lights, no tone map.
export function styleUniforms(hero) {
  const u = hero.uniforms;
  return { uInk: u.uInk, uTime: u.uTime, uGap: u.uGap, uCone: u.uCone, uClump: u.uClump, uDiscA: u.uDiscA, uDiscB: u.uDiscB };
}
export function styleMaterial(opts = {}) {
  const { hero, paint, vertex, disc = false, uniforms = {}, ...rest } = opts;
  const shared = hero ? styleUniforms(hero) : {};
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, ...uniforms },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv; varying vec3 vPos; varying vec3 vWorldPos; varying vec3 vNormal; varying vec3 vView;
      ${vertex || 'vec3 abMove(vec3 p){ return p; }'}
      void main(){
        vUv = uv; vec3 p = abMove(position); vPos = p;
        vec4 w = vec4(p, 1.);
        #ifdef USE_INSTANCING
          w = instanceMatrix * w;
        #endif
        w = modelMatrix * w;
        vWorldPos = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        vView = normalize(w.xyz - cameraPosition + vec3(0., 1e-5, 0.));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv; varying vec3 vPos; varying vec3 vWorldPos; varying vec3 vNormal; varying vec3 vView;
      ${STYLE_GLSL}
      ${disc ? DISC_GLSL : ''}
      ${paint || 'vec4 abPaint(){ return vec4(abRamp(abSpray(vUv.y, vUv * 100., fwidth(vUv.x) * 100., 0.)), 1.); }'}
      void main(){ vec4 c = abPaint(); gl_FragColor = vec4(clamp(c.rgb, 0., 1.), clamp(c.a, 0., 1.)); }`,
    ...rest,
  });
}

const BRIEF_PALETTE = ['#04040C', '#1C2B8F', '#D4226B', '#FF6A14', '#FFE2A6', '#18B8A6', '#BFD4FF'];
const BRIEF_PATH = [[-2600, 330, 0], [-2540, 330, 0], [-2260, 322, -10], [-2182, 303, -26], [-1926, 184, -138], [-1747, 92, -227],
  [-1516, 37, -322], [-1082, 34, -440], [-784, 31, -469], [-534, 30, -454], [-346, 30, -391], [-269, 30, -328], [-204, 30, -252],
  [-162, 47, -200], [-79, 117, -97]];

// the three editions of the cover: each a whole ramp set [ground, cool, mid, hot, cream, accent, cold]
function editionInks(name, P) {
  if (name === 'violet') return { inks: [P[0], '#2A1670', '#7B3FE4', P[2], P[4], '#FFB81C', P[6]], haze: 0.3, hazeCol: '#2A1670', starN: 48, density: 0.95 };
  if (name === 'verdigris') return { inks: ['#1A0A20', '#0B5440', P[5], '#9FE8C8', P[4], P[3], '#FF5A3C'], haze: 0.9, hazeCol: '#5A1846', starN: 34, density: 0.9 };
  return { inks: [P[0], P[1], P[2], P[3], P[4], P[5], P[6]], haze: 1, hazeCol: P[1], starN: 34, density: 0.95 };
}

// distance from a point to a polyline (the camera line), for clearance checks at build time
function distToPath(pts, x, y, z) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const l2 = dx * dx + dy * dy + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / l2, 0, 1);
    const px = a[0] + dx * t - x, py = a[1] + dy * t - y, pz = a[2] + dz * t - z;
    best = Math.min(best, px * px + py * py + pz * pz);
  }
  return Math.sqrt(best);
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('airbrush-black-hole') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const P = (opts.palette && opts.palette.length >= 7) ? opts.palette : BRIEF_PALETTE;
  const pathPts = opts.path || BRIEF_PATH;
  const duration = opts.duration ?? 47;

  // ---- everything the seed decides, drawn in one fixed order (no yields in here)
  const edRoll = rng();
  if (DEBUG_FORCE) opts = { ...DEBUG_FORCE, ...opts };
  const edition = opts.edition || (edRoll < 0.5 ? 'cadmium' : edRoll < 0.76 ? 'violet' : 'verdigris');
  const ed = editionInks(edition, P);
  const nCones = clamp(Math.round(opts.cones ?? rng.int(3, 7)), 1, MAX_CONES);
  const nGaps = clamp(Math.round(opts.gaps ?? rng.int(1, 4)), 0, MAX_GAPS);
  const warpRoll = rng(), warpAmt = rng.range(40, 60), warpAng = rng.range(-0.9, 0.9);
  const warp = opts.warp ?? (warpRoll < 0.35 ? warpAmt : 0);
  const density = rng.range(0.7, 1);
  const nClumps = clamp(Math.round(opts.clumps ?? MAX_CLUMPS * density), 0, MAX_CLUMPS);
  const laneSeed = rng.range(1, 90), starSeed = rng.range(1, 60);
  const splashStrength = rng.range(0.8, 1.1);

  const gaps = [];
  { // gaps keep apart from each other, from the edges and from the clump belt
    const slots = rng.shuffle([640, 790, 930, 1090, 1230]);
    for (let i = 0; i < MAX_GAPS; i++) gaps.push(new THREE.Vector4(slots[i] + rng.range(-45, 45), i < nGaps ? rng.range(7, 17) : 0, 0, 0));
  }
  const pass = opts.conePass || { u: 0.426, position: [-900, 32, -458] };
  const passR = Math.hypot(pass.position[0], pass.position[2]), passAng = Math.atan2(pass.position[2], pass.position[0]);
  const cones = [];
  for (let i = 0; i < MAX_CONES; i++) {
    const r = i === 0 ? passR : lerp(520, 1330, (i - 0.5 + rng.range(-0.3, 0.3)) / (MAX_CONES - 1));
    cones.push({ r, phase: (i / nCones) * Math.PI * 2 + rng.range(-0.4, 0.4), strength: i < nCones ? rng.range(0.75, 1) : 0 });
  }
  const clumps = [];
  for (let i = 0; i < MAX_CLUMPS; i++) {
    clumps.push({ r: lerp(338, 512, (i + rng()) / MAX_CLUMPS), phase: rng.range(0, Math.PI * 2), period: rng.range(8, 14), size: i < nClumps ? rng.range(25, 40) : 0, seed: rng() });
  }
  rng.shuffle(clumps);
  const glints = [];
  for (let i = 0; i < GLINTS; i++) {
    const a = rng.range(0, Math.PI * 2), y = rng.range(-0.75, 0.75), s = Math.sqrt(1 - y * y);
    glints.push(new THREE.Vector4(Math.cos(a) * s, y, Math.sin(a) * s, rng.range(0.028, 0.06)));
  }
  // two glints always stand where the entry view looks (over the arch, heading +X)
  glints[0].set(0.93, 0.3, -0.21, 0.06).setW(0.06); glints[1].set(0.9, 0.16, 0.4, 0.04);
  for (const g of glints) { const w = g.w, l = Math.hypot(g.x, g.y, g.z); g.set(g.x / l, g.y / l, g.z / l, w); }

  const col = (h) => new THREE.Color(h);
  const uniforms = {
    uInk: { value: ed.inks.map(col) },
    uTime: { value: 0 },
    uGap: { value: gaps },
    uCone: { value: cones.map(() => new THREE.Vector4(1, 0, 900, 0)) },
    uClump: { value: clumps.map(() => new THREE.Vector4(1, 0, 400, 0)) },
    uDiscA: { value: new THREE.Vector4(warp, warpAng, laneSeed, splashStrength) },
    uDiscB: { value: new THREE.Vector4(940, -1175, opts.near === false ? 0 : 1, 0) },
    uGlint: { value: glints },
    uHazeCol: { value: col(ed.hazeCol) },
    uSky: { value: new THREE.Vector4(ed.haze, ed.density, starSeed, 0) },
    uSteps: { value: Math.max(14, Math.round((opts.steps ?? 32) * detail)) },
    uEinstein: { value: 0 },
    uWorldInv: { value: new THREE.Matrix4() },
  };
  const object = new THREE.Group();
  object.name = 'airbrush-black-hole';
  await ctx.yield();

  // ---- PLATE
  const plateMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG.replace('float N = 34.;', `float N = ${ed.starN.toFixed(1)};`),
    depthWrite: false, depthTest: true, side: THREE.BackSide, fog: false,
  });
  const plate = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), plateMat);
  plate.frustumCulled = false; plate.renderOrder = -0.5; plate.name = 'plate';
  object.add(plate);
  await ctx.yield();

  const group = new THREE.Group(); group.name = 'near';
  object.add(group);
  const nearOn = opts.near !== false;
  const nearHead = /* glsl */`
    precision highp float;
    uniform mat4 uWorldInv;
    ${STYLE_GLSL}
    ${DISC_GLSL}
    vec3 abCamLocal(){ return (uWorldInv * vec4(cameraPosition, 1.)).xyz; }
    // 1 when the hole does not stand between the eye and p (the plate cannot bend real geometry, so hide it there)
    float abClear(vec3 cam, vec3 p){
      vec3 d = p - cam; float t = clamp(-dot(cam, d) / max(dot(d, d), 1.), 0., 1.);
      float between = smoothstep(0., .02, t) * (1. - smoothstep(.9, 1., t));
      return mix(1., smoothstep(${(B_CRIT * 1.2).toFixed(1)}, ${(B_CRIT * 2.0).toFixed(1)}, length(cam + d * t)), between);
    }`;

  // ---- CLUMPS: lumpy knots with a frisket-hard leading face and a sprayed tail, bent round their orbits
  {
    const head = new THREE.IcosahedronGeometry(0.5, 3);
    const hp = head.attributes.position, n = ctx.noise;
    const kind = [], pos = [], nor = [], uvs = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < hp.count; i++) {
      v.fromBufferAttribute(hp, i).normalize();
      const lump = 1 + 0.09 * n.n3(v.x * 2.1 + 7, v.y * 2.1, v.z * 2.1) + 0.035 * n.n3(v.x * 5.3, v.y * 5.3 + 3, v.z * 5.3);
      const back = v.z < 0 ? 1 + 0.9 * v.z * v.z : 1;           // drawn out behind into a teardrop
      pos.push(v.x * 0.5 * lump, v.y * 0.5 * lump, v.z * 0.5 * lump * back);
      nor.push(v.x, v.y, v.z); uvs.push(0, 0); kind.push(0);
      if (i % 600 === 599) await ctx.yield();
    }
    const SEG = 18;
    for (let plane = 0; plane < 2; plane++) {
      for (let s = 0; s < SEG; s++) {
        const quad = [[-1, s], [1, s], [1, s + 1], [-1, s], [1, s + 1], [-1, s + 1]];
        for (const [u, sv] of quad) {
          const t = sv / SEG, z = -0.1 - t * 6.75, w = 0.5 * u;
          if (plane === 0) { pos.push(w, 0, z); nor.push(0, 1, 0); } else { pos.push(0, w * 0.55, z); nor.push(1, 0, 0); }
          uvs.push(u, t); kind.push(1);
        }
      }
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    geo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array(clumps.map((c, i) => i)), 1));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(clumps.map((c) => c.seed)), 1));
    geo.instanceCount = MAX_CLUMPS;
    head.dispose();
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: nearHead + /* glsl */`
        attribute float aKind; attribute float aIdx; attribute float aSeed;
        varying vec3 vP; varying vec2 vUv2; varying vec4 vK;   // vK: kind, fade, facing, size
        void main(){
          vec4 c = uClump[int(aIdx + .5)];
          float size = c.w;
          vec3 p = position;
          p += normal * sin(uTime * 3.1 + aSeed * 40. + position.x * 9. + position.y * 7.) * .035 * (1. - aKind);
          p.x *= mix(.9, 1.15, aSeed); p.y *= mix(1.1, .85, aSeed);
          float arc = p.z * size;
          float ang = arc / c.z;
          float cs = cos(ang), sn = sin(ang);
          vec2 e = vec2(c.x * cs - c.y * sn, c.y * cs + c.x * sn);
          float rad = c.z + p.x * size;
          float y = size * (.27 + p.y * .5) + 1.5 + aKind * sin(arc / 23. + uTime * 5. + aSeed * 9.) * 1.6 * min(-p.z, 1.);
          vec3 lp = vec3(e.x * rad, y, e.y * rad);
          vec3 ln = vec3(e.x * normal.x - e.y * normal.z, normal.y, e.y * normal.x + e.x * normal.z);
          vec4 w = modelMatrix * vec4(lp, 1.);
          vec3 wn = normalize(mat3(modelMatrix) * ln + vec3(0., 1e-5, 0.));
          vec3 vw = normalize(w.xyz - cameraPosition + vec3(0., 1e-5, 0.));
          vec3 cam = abCamLocal();
          float dist = length(lp - cam);
          float fade = mix(1., 1. - smoothstep(380., 720., dist), uDiscB.z) * abClear(cam, lp);
          vP = p * size; vUv2 = uv; vK = vec4(aKind, fade, abs(dot(wn, vw)), size);
          gl_Position = size > 0. && fade > 0. ? projectionMatrix * viewMatrix * w : vec4(2., 2., 2., 1.);
        }`,
      fragmentShader: nearHead + /* glsl */`
        varying vec3 vP; varying vec2 vUv2; varying vec4 vK;
        void main(){
          vec2 key = vec2(vP.z + vP.y * .6, vP.x - vP.y * .8);
          float fp = max(fwidth(key.x), fwidth(key.y));
          float size = max(vK.w, 1.);
          float T, a;
          if (vK.x < .5){
            if (!gl_FrontFacing) discard;
            float z = vP.z / size;                                   // + is the leading face
            float lump = abNoise(vP * .16 + 3.) - .5;
            float d = z - (.02 + lump * .08);                        // frisket: the leading cap, a round head
            float cap = abFrisket(d, max(fwidth(d), 1e-4));
            float back = exp(min(d, 0.) * 5.);                       // behind it spray only, thinning fast
            float limb = smoothstep(.0, .55, vK.z);                  // and the back half has no outline: it dissolves at the limb
            float cov = max(cap * (.45 + .55 * limb), back * .8 * limb);
            T = mix(mix(.42, .86, back), 1.04, cap) - (1. - vK.z) * .28 * (1. - cap) + lump * .1;
            a = max(cap, abSpray(cov, key, fp, 0.));
          } else {
            float s = 1. - abs(vUv2.x), k = 1. - vUv2.y;
            float streak = abNoise(vec3(vUv2.x * 5., vP.z * .05 + uTime * 2., 7.));
            float cov = k * sqrt(k) * smoothstep(0., .75, s) * (.55 + .7 * streak);
            T = mix(.45, .95, k) + (streak - .5) * .14;              // cream at the head, then orange, then magenta
            a = abSpray(cov * .9, key, fp, 0.) * smoothstep(0., .04, vUv2.y);
          }
          vec3 col = abRampS(T * .94, key + 91., fp, 3.);
          gl_FragColor = vec4(col, a * vK.y);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'clumps'; mesh.visible = nearOn && nClumps > 0;
    group.add(mesh);
  }
  await ctx.yield();

  // ---- SPRAY CONES: fans of mist, apex 120 m over the disc, travelling against the flow
  {
    const S = 44, H = 12, pos = [], nor = [], uvs = [], idx = [];
    for (let j = 0; j <= H; j++) {
      const h = j / H, rad = 100 * Math.pow(h, 0.8), y = 120 * (1 - h);
      for (let i = 0; i <= S; i++) {
        const a = (i / S) * Math.PI * 2;
        pos.push(Math.cos(a) * rad, y, Math.sin(a) * rad);
        const nl = Math.hypot(120, 100);
        nor.push(Math.cos(a) * 120 / nl, 100 / nl, Math.sin(a) * 120 / nl);
        uvs.push(i / S, h);
      }
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < S; i++) {
      const a = j * (S + 1) + i, b = a + 1, c = a + S + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3, 4, 5, 6]), 1));
    geo.instanceCount = MAX_CONES;
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: nearHead + /* glsl */`
        attribute float aIdx;
        varying vec2 vUv2; varying vec4 vK;   // facing, fade, index, distance
        void main(){
          vec4 c = uCone[int(aIdx + .5)];
          vec2 er = c.xy, et = vec2(-c.y, c.x);
          float h = uv.y;
          vec2 ctr = er * c.z;
          float lag = 55. * h * h;                               // the skirt trails behind the nozzle
          vec2 xz = ctr + er * position.x + et * (position.z + lag);
          vec3 lp = vec3(xz.x, position.y + abWarp(ctr) - 2., xz.y);
          vec3 ln = normalize(vec3(er.x * normal.x + et.x * normal.z, normal.y, er.y * normal.x + et.y * normal.z));
          vec4 w = modelMatrix * vec4(lp, 1.);
          vec3 wn = normalize(mat3(modelMatrix) * ln + vec3(0., 1e-5, 0.));
          vec3 vw = normalize(w.xyz - cameraPosition + vec3(0., 1e-5, 0.));
          vec3 cam = abCamLocal();
          float fade = abClear(cam, vec3(ctr.x, 40., ctr.y)) * smoothstep(0., .1, c.w);
          vUv2 = uv; vK = vec4(abs(dot(wn, vw)), fade, aIdx, length(lp - cam));
          gl_Position = fade > 0. ? projectionMatrix * viewMatrix * w : vec4(2., 2., 2., 1.);
        }`,
      fragmentShader: nearHead + /* glsl */`
        varying vec2 vUv2; varying vec4 vK;
        void main(){
          float h = vUv2.y;
          vec2 key = vec2(vUv2.x * 628. * (.15 + h), h * 156.);
          float fp = max(fwidth(vUv2.x) * 628. * (.15 + h), fwidth(h) * 156.) * 2.1;   // speckle is coarse under a cone
          float n = abNoise(vec3(vUv2.x * 30., h * 3.2 - uTime * 1.1, vK.z * 9.));
          float n2 = abNoise(vec3(vUv2.x * 9., h * 1.4 - uTime * .5, vK.z * 5. + 4.));
          float rays = abNoise(vec3(vUv2.x * 70., vK.z * 3., floor(uTime * 3.) * .37));
          float cov = pow(vK.x, 1.4) * (.5 * (1. - h) + .14) * (.25 + .7 * n + .4 * n2 + .22 * rays);
          cov *= smoothstep(0., .04, h) * (1. - smoothstep(.72, 1., h));
          float a = abSpeck(cov * .5 * mix(.5, 1., smoothstep(60., 500., vK.w)), key, fp, floor(uTime * 3.) + vK.z) * .88;
          vec3 col = abRamp(mix(.74, 1.02, clamp(cov * 2.2, 0., 1.)));
          gl_FragColor = vec4(col, a * vK.y);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'cones'; mesh.visible = nearOn;
    group.add(mesh);
  }
  await ctx.yield();

  // ---- PLUMES: arched filaments standing out of the lanes, leaning with the flow (camera-facing ribbons)
  let plumeCount = 0;
  {
    const prng = rng.fork ? rng.fork('plumes') : rng;
    const warpAt = (x, z) => {
      const r = Math.hypot(x, z), m = smoothstep(850, 1500, r), d = Math.max((x * Math.cos(warpAng) + z * Math.sin(warpAng)) / Math.max(r, 1), 0);
      return warp * m * m * d * d;
    };
    const A = [], B = [];
    const tryPlume = (x, z, H, margin) => {
      const r = Math.hypot(x, z);
      if (r < 345 || r > 1460) return false;
      for (const g of gaps) if (g.y > 0 && Math.abs(r - g.x) < g.y + 6) return false;
      const span = H * prng.range(1.3, 2.3), lean = prng.range(0.3, 1), phase = prng.range(0, 6.28), width = prng.range(2.6, 5.2) * (0.7 + H / 90), seed = prng();
      const ex = x / r, ez = z / r, tx = -ez, tz = ex, y0 = warpAt(x, z);
      for (let k = 0; k <= 10; k++) {          // the same curve as the vertex shader, checked against the camera line
        const t = k / 10, s = Math.sin(Math.PI * t), along = span * (t - 0.5 + lean * 0.35 * s * s), bow = span * 0.1 * Math.sin(6.283 * t + seed * 6);
        const px = x + tx * along + ex * bow, pz = z + tz * along + ez * bow, py = y0 + H * Math.pow(s, 0.75) * 1.06 - 1;
        if (distToPath(pathPts, px, py, pz) < margin + width) return false;
      }
      A.push(x, z, H, span); B.push(lean, phase, width, seed);
      return true;
    };
    // beside the skim: every 36 m or so, alternating sides, 13..30 m off the line
    let side = 1, carry = 0;
    for (let i = 0; i < pathPts.length - 1; i++) {
      const a = pathPts[i], b = pathPts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      let d = carry;
      for (; d < len; d += 36) {
        const t = d / len, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t);
        const j1 = prng.range(-12, 12), lat = prng.range(13, 30); let H = prng.range(20, 62);
        if (y > 70) continue;
        const dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len;
        const px = x + dx * j1 - dz * lat * side, pz = z + dz * j1 + dx * lat * side, uu = (i + t) / (pathPts.length - 1);
        if (uu > 0.5 && uu < 0.62 && Math.hypot(px, pz) < Math.hypot(x, z)) H = Math.min(H, 30);   // hole side, at the single image: frame the shadow, never cut it
        tryPlume(px, pz, H, 8);
        side = -side;
      }
      carry = d - len;
    }
    await ctx.yield();
    const field = Math.round(150 * detail * lerp(0.7, 1, density));
    for (let i = 0; i < field; i++) {
      const a = prng.range(0, Math.PI * 2), r = Math.sqrt(prng.range(350 * 350, 1450 * 1450)), H = prng.range(20, 70);
      tryPlume(Math.cos(a) * r, Math.sin(a) * r, H, 10);
      if (i % 40 === 39) await ctx.yield();
    }
    plumeCount = A.length / 4;
    const N = 22, pos = [], uvs = [], idx = [];
    for (let j = 0; j <= N; j++) { pos.push(0, 0, 0, 0, 0, 0); uvs.push(0, j / N, 1, j / N); }
    for (let j = 0; j < N; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A.length ? A : [0, 0, 0, 0]), 4));
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B.length ? B : [0, 0, 0, 0]), 4));
    geo.instanceCount = Math.max(plumeCount, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: nearHead + /* glsl */`
        attribute vec4 aA; attribute vec4 aB;
        varying vec2 vUv2; varying vec4 vK;   // fade, phase, seed, metres along
        vec3 abCurve(float t){
          vec2 b0 = aA.xy; float r0 = max(length(b0), 1.); vec2 er = b0 / r0; vec2 et = vec2(-er.y, er.x);
          float s = max(sin(3.14159 * t), 0.);
          float along = aA.w * (t - .5 + aB.x * .35 * s * s);
          float bow = aA.w * .1 * sin(6.283 * t + aB.w * 6.);
          float flick = 1. + .06 * sin(uTime * 2.3 + aB.y + t * 5.);
          vec2 xz = b0 + et * along + er * bow;
          return vec3(xz.x, abWarp(b0) + aA.z * pow(s + 1e-4, .75) * flick - 1., xz.y);
        }
        void main(){
          float t = uv.y;
          vec3 c = abCurve(t);
          vec3 tg = abCurve(t + .02) - abCurve(t - .02);
          vec3 cam = abCamLocal();
          vec3 toC = c - cam; float dist = max(length(toC), 1.);
          vec3 sd = cross(tg, toC);
          sd = sd / max(length(sd), 1e-4);
          float s = max(sin(3.14159 * t), 0.);
          float sa = length(cross(tg / max(length(tg), 1e-4), toC / dist));   // a ribbon seen end-on thins and fades instead of fanning out
          float w = max(aB.z * (.28 + .72 * s) * (.3 + .7 * sa), dist * .0016);
          vec3 lp = c + sd * (uv.x * 2. - 1.) * w;
          float fade = (1. - smoothstep(1000., 1700., dist)) * smoothstep(5., 12., dist) * abClear(cam, c) * step(.5, aA.z) * smoothstep(.04, .3, sa);
          vUv2 = uv; vK = vec4(fade, aB.y, aB.w, t * aA.w);
          gl_Position = fade > 0. ? projectionMatrix * viewMatrix * modelMatrix * vec4(lp, 1.) : vec4(2., 2., 2., 1.);
        }`,
      fragmentShader: nearHead + /* glsl */`
        varying vec2 vUv2; varying vec4 vK;
        void main(){
          float u = vUv2.x * 2. - 1., t = vUv2.y;
          vec2 key = vec2(u * 4., vK.w) + vK.z * 50.;
          float fp = max(fwidth(key.x), fwidth(key.y));
          float edge = abFrisket(.78 - u, fwidth(u));                    // frisket on one side
          float soft = smoothstep(-1., .35, u);                          // sprayed away on the other
          float pulse = .5 + .5 * sin(t * 11. - uTime * 3.4 + vK.y);
          float n = abNoise(vec3(vK.w * .22 - uTime * 2.2, u * 1.5, vK.z * 30.));
          float cov = edge * soft * (.38 + .4 * pulse + .4 * n) * smoothstep(0., .07, t) * (1. - smoothstep(.9, 1., t));
          float T = .34 + .2 * vK.z + .3 * soft * edge + .2 * pulse * n + .2 * sin(3.14159 * t);
          vec3 col = abRampS(T, key + 13., fp, 0.);
          gl_FragColor = vec4(col, max(abSpray(cov, key, fp, 0.), edge * soft * soft * .0) * vK.x);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'plumes'; mesh.visible = nearOn && plumeCount > 0;
    group.add(mesh);
  }
  await ctx.yield();

  // ---- anchors, progress, update
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const last = V(pathPts[pathPts.length - 1]), prev = V(pathPts[pathPts.length - 2]);
  const exitDir = last.clone().sub(prev).normalize();
  const anchors = {
    holeCentre: new THREE.Vector3(0, 0, 0),
    splash: new THREE.Vector3(940, 0, -1175),
    entry: V(pathPts[0]),
    moonlet: new THREE.Vector3(-2250, 125, 70),
    companion: new THREE.Vector3(750, 0, -2800),
    streamTip: new THREE.Vector3(660, 0, -2310),
    flyThrough: pathPts.map(V),
    portalSeat: { position: last.clone(), normal: exitDir.clone().negate(), radius: 8.5 },
    exitDir,
    skim: new THREE.Vector3(-784, 31, -469),
    inner: new THREE.Vector3(-269, 30, -328),
    conePass: V(pass.position),
    viewpoints: [
      { position: V(pathPts[0]), target: new THREE.Vector3(0, 60, 0) },
      { position: new THREE.Vector3(-2182, 303, -26), target: new THREE.Vector3(0, 40, 0) },
      { position: new THREE.Vector3(-784, 31, -469), target: new THREE.Vector3(0, 70, 0) },
      { position: new THREE.Vector3(-300, 30, -355), target: new THREE.Vector3(0, 30, 0) },
      { position: new THREE.Vector3(-120, 82, -148), target: last.clone() },
    ],
  };

  let progress = DEBUG_VIEW ? 0.44 : -1;
  const _m = new THREE.Matrix4(), _c = new THREE.Vector3();
  const CONE_RATE = Math.PI * 2 / 40;
  const hero = {
    object, radius: DEBUG_VIEW ? DEBUG_VIEW.radius : 1500, height: DEBUG_VIEW ? DEBUG_VIEW.height : 1500,
    center: DEBUG_VIEW ? V(DEBUG_VIEW.center) : new THREE.Vector3(0, 0, 0),
    anchors, uniforms, edition, ground: false, groundY: 0,
    info: { edition, cones: nCones, gaps: nGaps, warp, clumps: nClumps, plumes: plumeCount },
    setProgress(u) { progress = clamp(u, 0, 1); },
    setEinstein(e) { uniforms.uEinstein.value = clamp(e, 0, 1); },
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      object.updateWorldMatrix(true, false);
      uniforms.uWorldInv.value.copy(_m.copy(object.matrixWorld).invert());
      for (let i = 0; i < MAX_CONES; i++) {
        const c = cones[i];
        let a = c.phase - CONE_RATE * time;
        if (i === 0 && progress >= 0) a = passAng - CONE_RATE * (progress - pass.u) * duration;
        uniforms.uCone.value[i].set(Math.cos(a), Math.sin(a), c.r, c.strength);
      }
      for (let i = 0; i < MAX_CLUMPS; i++) {
        const c = clumps[i], a = c.phase + (Math.PI * 2 / c.period) * time;
        uniforms.uClump.value[i].set(Math.cos(a), Math.sin(a), c.r, c.size);
      }
      if (camera) {
        _c.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(uniforms.uWorldInv.value);
        uniforms.uSky.value.w = 0.0007 * (_c.x + _c.z * 0.7) + 0.04 * time;      // the ruled glints turn as we move
      }
    },
    dispose() {},
  };
  hero.update(0, 0, null);
  object.userData.hero = hero;
  return hero;
}
