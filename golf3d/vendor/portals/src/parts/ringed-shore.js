// THE RINGED SHORE: hero set piece
// ---------------------------------------------------------------------------------------------
// "The planet and its reflection": a banded, ringed gas giant standing over the vanishing point,
// mirrored completely in a wet tidal flat, and exactly under it a 30 m crystal arch (two bundled
// crystal spires leaning together, tips crossing) with room for the 14 m exit portal inside it.
//
// What this module builds (all self-contained, no kit imports):
//   1. skyFigure  one camera-following dome whose shader paints the ringed planet (bands, storm,
//                 ring gaps, planet shadow on the rings, ring shadow creeping on the planet), the
//                 violet/teal dusk gradient, the pink afterglow under the planet, the small
//                 blue-white second sun, two moons and stars. The LOWER hemisphere of the same dome
//                 is the mirror: it reflects the upper one through animated ripple normals
//                 (wind ripples + ring ripples from up to 8 sources), so planet-above and
//                 planet-below are one figure with the horizon as a teal seam.
//   2. arch       two bundles of faceted crystal shafts (terraced growth steps, pointed
//                 terminations, side shafts, out-growths), foot clusters and a shard field.
//                 Shader: reflects and refracts the real sky figure, spectral flashes, glowing tips.
//   3. archMirror the same geometry, y-flipped below y = 0 (correct mirrored-view lighting).
//   4. wetSand    one transparent plane at y = 0 over everything mirrored: rippled sand showing
//                 through at steep view angles (alpha 0.5), nearly clear at grazing angles (0.12).
//   5. glints     one additive billboard batch: tip sparks, drifting motes, the apex star and
//                 their mirror images.
//
// Size: arch 30-31 m high, ~27 m across the feet, shards out to ~30 m. radius 30, height 31.
// Origin at the base centre on the mirror plane (y = 0), +Y up, front toward +Z: the camera
// approaches from +Z flying toward -Z, and the planet hangs over -Z.
//
// opts
//   palette      [zenith, violet, teal, pink, sand, dark, ice] hex strings (brief palette default)
//   sky          'full' (default) dome paints sky + planet + mirror, and hides any sky behind it
//                'planet' dome paints only planet, rings, sun, moons and their rippled mirror images
//                         with alpha over YOUR sky (use with a y-flipped copy of your own sky dome
//                         for the lower hemisphere; keep opaque ground out of the way)
//                'none'   no dome at all (arch + its mirror + wet sand only)
//   wetSand      true (default) | false   the transparent wet-sand plane
//   sandRadius   2600   radius of that plane in metres
//   planetSize   38     angular diameter of the planet in degrees
//   planetElev   30     elevation of its centre in degrees
//   planetSize0, planetElev0   optional: size and elevation at progress 0. setProgress(u) then raises and grows the
//                planet to planetSize / planetElev by u 0.66 (uniform values only). Left out, the planet does not move.
//   planetElev1  optional: elevation at progress 1; the planet eases to it from u 0.7 (the final approach looks slightly
//                down, so a planet that settles a degree keeps its top inside the frame).
//   ringTilt     17     ring opening in degrees
//   look         optional { bandA, bandB (THREE.Color band colours), ring [inner, outer] in planet radii (1.24, 2.08),
//                moon [x, y, radius, drift per second] in planet radii: a small moon in transit with its shadow }
//   portalY      8.5    height of the portal centre inside the arch
//
// anchors (hero-local space)
//   portalSeat   { position (0, portalY, 0), facing (0,0,1), radius 7 }: centre and normal of the
//                14 m portal; the clear opening there is >= 16.5 m wide and 20 m high.
//   flyThrough   ordered points of the final straight run (+Z -> through the arch), >= 8 m clear.
//   approachDir  unit vector of the final approach (0,0,-1).
//   apex         where the tips cross (the apex star lives here).
//   feet         [left, right] foot centres on the mirror (ripple rings start here).
//   planetDir, planetMirrorDir, sunDir, glowDir   unit directions of the sky figure.
//   keyLight / fillLight  { dir, color, intensity } suggested real lights that match the shader.
//   viewpoints   { figure, threeQuarter, under } good camera positions, each { position, target }.
//
// hooks
//   update(dt, time, camera)  every frame (dome follows the camera; never caches it).
//   setProgress(u)            0..1 world progress. Until u 0.5 the apex star and a spark at the portal seat are
//                             boosted (uBeacon) so the arch reads as a spark under the planet from the entry.
//                             From u 0.6 the arch "answers" the approach: a
//                             light pulse climbs the shafts, the apex star swells and the foot
//                             ripples strengthen. Never wall-clock.
//   setRipple(i, x, z, strength, phase)  i = 2..7: extra ring-ripple sources (Strider feet).
//   uniforms                  the shared uniform table, for anything else.
//   buildCrystals(list, rng, pause?)  ASYNC (await it). More crystals in the arch's material, with their mirror images:
//                             list of { x, z, h, r?, lean?, sides?, glow?, shards?, tip? } in hero-local
//                             space -> { object, tips, triangles }; add `object` to hero.object.
//   buildTipGlints(tips, rng) one additive batch of tip sparks (and their mirror images) for those tips.
//                             `dark` (0..1) multiplies the body colour (dark silhouette spires).
//   colors                    the palette as THREE.Colors { zen, violet, teal, pink, sand, dark, ice }.
//
// Cost: ~28k triangles (arch ~11k, drawn twice; dome 6k), 5 draw calls (dome, arch, arch mirror,
// wet sand, glints), ~80 ms build. The dome is one full-screen procedural shader; crystals use a
// cheaper copy of it for their reflections.
// Lighting: self-lit. The crystal and sand shaders light themselves from the sky figure (blue-white
// key from sunDir on the right, pink afterglow from glowDir ahead), so no real lights are needed;
// scene fog is honoured (the dome ignores fog on purpose, it carries its own horizon haze).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#110838', '#371d78', '#22aea2', '#ff7ab8', '#dcae82', '#1a1630', '#b8fff0'];
const DEG = Math.PI / 180;

// ---------- shared GLSL: the sky figure (planet, rings, sun, moons, gradient) ----------
const GLSL_SKY = /* glsl */`
uniform vec3 uZen, uMid, uHor, uPink, uSand, uDark, uIce;
uniform vec3 uPC, uPR, uPU;          // planet centre direction and tangent basis (hero-local)
uniform float uPTan;                 // tan(angular radius)
uniform vec3 uAxis, uE1, uE2;        // planet axis and equatorial basis, planet frame
uniform vec3 uL1, uL2;               // key (blue-white) and afterglow (pink) light, planet frame
uniform vec3 uSunD;                  // second sun direction (hero-local)
uniform vec2 uGlowAz;                // azimuth of the afterglow (xz, unit)
uniform vec4 uMoon[2];               // xyz dir, w = cos(angular radius)
uniform float uTime, uBandSeed, uFull;
uniform vec4 uStorm;                 // lon, lat, size, strength
uniform vec3 uBandA, uBandB;         // the two band colours of this seed's planet
uniform vec2 uRing;                  // ring inner radius and width, in planet radii
uniform vec4 uMoonSh;                // a small moon in transit: shadow x, y on the disc, radius (0: none), drift per second

float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h11(i), h11(i + 1.), f); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb2(vec2 p){ return vn2(p) * 0.55 + vn2(p * 2.07 + 7.1) * 0.3 + vn2(p * 4.3 + 3.7) * 0.15; }

vec3 skyGrad(vec3 d){
  float y = max(d.y, 0.);
  vec3 c = mix(uMid, uZen, smoothstep(0.04, 0.8, y));
  c = mix(c, uHor * 0.42, exp(-y * 6.0));
  float az = max(dot(normalize(d.xz + vec2(1e-5)), uGlowAz), 0.);
  c += uPink * (exp(-y * 5.5) * pow(az, 6.) * 0.46 + exp(-y * 14.) * pow(az, 2.5) * 0.3);
  c += uSand * exp(-y * 26.) * pow(az, 12.) * 0.3;
  // the set primary's afterglow: a soft pink band over the first six degrees, under the planet
  c += (uPink * 0.34 + uSand * 0.07) * exp(-y * y * 120.) * pow(az, 9.);
  return c;
}

float ringDensity(float rho){
  float x = (rho - uRing.x) / uRing.y;
  if (x <= 0. || x >= 1.) return 0.;
  float d = smoothstep(0., 0.03, x) * smoothstep(1., 0.94, x);
  d *= 0.42 + 0.58 * vn1(x * 26. + uBandSeed * 3.);
  d *= 0.75 + 0.25 * vn1(x * 90. + uBandSeed);
  d *= 1. - 0.93 * smoothstep(0.035, 0.008, abs(x - 0.6));
  d *= 1. - 0.7 * smoothstep(0.016, 0.003, abs(x - 0.31));
  d *= 1. - 0.6 * smoothstep(0.012, 0.002, abs(x - 0.84));
  d *= mix(0.3, 1., smoothstep(0.1, 0.19, x));
  return d;
}

// rgb = colour, a = coverage of bodies (planet, rings, sun, moons). d.y must be >= 0.
vec4 skyFigure(vec3 d, float withStars){
  vec3 grad = skyGrad(d);
  vec3 col = grad;
  float cov = 0.;
  // stars
  if (withStars > 0.5 && uFull > 0.5) {
    vec3 sp = d * 190.; vec3 ip = floor(sp); float h = h31(ip);
    float st = step(0.9945, h) * smoothstep(0.42, 0.05, length(fract(sp) - 0.5));
    st *= 0.6 + 0.4 * sin(uTime * (1.5 + h * 40.) + h * 300.);
    col += mix(uIce, uPink, fract(h * 91.)) * st * 2.2 * smoothstep(0.03, 0.3, d.y);
    // a second, finer and fainter layer behind the first, for depth
    vec3 sp2 = d * 420. + 17.; float h2 = h31(floor(sp2));
    float st2 = step(0.9945, h2) * smoothstep(0.45, 0.1, length(fract(sp2) - 0.5)) * (0.7 + 0.3 * sin(uTime * (1. + h2 * 30.) + h2 * 200.));
    col += mix(uIce, uHor * 1.6, fract(h2 * 57.)) * st2 * 1.1 * smoothstep(0.03, 0.3, d.y);
    // faint nebula: two soft bands of pink and teal in the upper sky
    float nb = fb2(d.xz * 2.2 / (0.35 + d.y) + 11.);
    col += (uPink * 0.07 + uHor * 0.05) * smoothstep(0.45, 0.85, nb) * smoothstep(0.15, 0.6, d.y);
  }
  // moons
  for (int i = 0; i < 2; i++) {
    vec3 m = uMoon[i].xyz; float md = dot(d, m), cr = uMoon[i].w;
    float k = sqrt(max(1. - md * md, 0.)) / sqrt(1. - cr * cr);
    if (md > 0. && k < 1.) {
      vec3 l = normalize(d - m * md + 1e-6);
      vec3 n = l * k - m * sqrt(1. - k * k);
      float df = smoothstep(-0.05, 0.3, dot(n, uSunD)) * (0.7 + 0.3 * vn2(n.xy * 9. + float(i) * 5.));
      float a = smoothstep(1., 0.86, k);
      col = mix(col, grad * 0.7 + mix(uSand, uIce, 0.3) * df * 1.3, a);
      cov = max(cov, a);
    }
  }
  // planet and rings
  float dz = dot(d, uPC);
  if (dz > 0.25) {
    vec2 q = vec2(dot(d, uPR), dot(d, uPU)) / (dz * uPTan);
    float r2 = dot(q, q);
    if (r2 < 5.8) {
      vec3 L1 = normalize(uL1 + uAxis * 0.16 * sin(uTime * 0.045));
      float zr = -(q.x * uAxis.x + q.y * uAxis.y) / uAxis.z;
      vec3 pr = vec3(q, zr);
      float rho = length(pr);
      float ra = ringDensity(rho);
      vec3 ringLit = vec3(0.);
      if (ra > 0.001) {
        float al1 = dot(pr, L1), al2 = dot(pr, uL2);
        float s1 = al1 < 0. ? smoothstep(1.03, 0.9, length(pr - al1 * L1)) : 0.;
        float s2 = al2 < 0. ? smoothstep(1.03, 0.9, length(pr - al2 * uL2)) : 0.;
        float side = smoothstep(-1.6, 1.6, q.x * sign(uL1.x));
        ringLit = mix(uSand * 1.35, uIce, 0.3) * (0.14 + 1.0 * side) * (1. - s1)
                + uPink * 1.25 * (1. - side) * (1. - s2 * 0.8) * (1. - s1 * 0.8)
                + uMid * 0.2;
        ringLit *= 0.7 + 0.5 * ra;
      }
      float rr = sqrt(r2);
      float pa = smoothstep(1.0, 0.985, rr);
      // back half of the rings
      if (zr < 0. || rr >= 1.) { col = col * (1. - ra * 0.8) + ringLit * ra; cov = max(cov, ra); }
      if (pa > 0.) {
        float nz = sqrt(max(1. - r2, 0.));
        vec3 n = vec3(q, nz);
        float lat = dot(n, uAxis);
        float lon = atan(dot(n, uE1), dot(n, uE2)) + uTime * 0.004;
        float turb = fb2(vec2(lon * 2.2, lat * 9.) + uBandSeed) - 0.5;
        float w = lat * 7.5 + turb * (0.55 + 0.5 * sin(lat * 5. + uBandSeed)) + uBandSeed;
        float b1 = 0.5 + 0.5 * sin(w * 2.0);
        float b2 = 0.5 + 0.5 * sin(w * 5.3 + 1.7 + turb * 2.);
        float b3 = vn1(lat * 34. + uBandSeed * 7. + turb * 3.);
        vec3 base = mix(uBandA, uBandB, b1);
        base = mix(base, uMid * 2.2 + uPink * 0.15, b2 * 0.5);
        base = mix(base, mix(uIce, uSand, 0.4) * 0.9, smoothstep(0.62, 0.95, b3) * 0.55);
        base = mix(base, uHor * 0.7 + uMid, smoothstep(0.72, 1., abs(lat)) * 0.7);
        base *= 0.5 + 0.5 * smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(w * 2.0 + 0.9)) + 0.18 * (b3 - 0.5);
        vec2 sv = vec2(mod(lon - uStorm.x + 3.1416, 6.2832) - 3.1416, (lat - uStorm.y) * 2.4) / uStorm.z;
        float storm = exp(-dot(sv, sv));
        base = mix(base, uPink * 1.1 + uSand * 0.3, storm * uStorm.w * (0.6 + 0.4 * sin(length(sv) * 9. - atan(sv.y, sv.x) * 2.)));
        float df1 = smoothstep(-0.1, 0.6, dot(n, L1));
        float df2 = pow(max(dot(n, uL2), 0.), 2.4);
        // ring shadow on the globe
        float tl = -dot(n, uAxis) / (dot(L1, uAxis) + 1e-4);
        float rsh = tl > 0. ? ringDensity(length(n + tl * L1)) : 0.;
        df1 *= 1. - 0.82 * rsh;
        // a small moon in transit throws a round shadow that creeps across the bands
        vec2 ms = q - vec2(uMoonSh.x + uTime * uMoonSh.w, uMoonSh.y);
        float msr = max(uMoonSh.z, 1e-3);
        df1 *= 1. - 0.9 * step(0.001, uMoonSh.z) * smoothstep(msr, msr * 0.5, length(ms));
        vec3 lit = base * (mix(uIce, vec3(0.9, 0.93, 1.), 0.55) * 0.95 * df1 + uPink * 0.85 * df2 + uMid * 0.2 + uHor * 0.02);
        lit *= mix(0.5, 1., sqrt(nz));
        float rim = pow(1. - nz, 3.5);
        lit += (uPink * (0.25 + 1.5 * df2) + uIce * 0.45 * df1 + uHor * 0.12) * rim;
        col = mix(col, grad * 0.5 + lit, pa);
        cov = max(cov, pa);
        if (uMoonSh.z > 0.) {
          // the moon itself, sunward of its shadow
          vec2 mq = (ms - normalize(L1.xy + vec2(1e-4)) * msr * 3.4) / (msr * 0.72);
          float md2 = dot(mq, mq);
          vec3 mn = vec3(mq, sqrt(max(1. - md2, 0.)));
          vec3 mc = mix(uSand, uIce, 0.45) * (0.12 + 1.05 * smoothstep(-0.1, 0.5, dot(mn, L1))) + uPink * 0.1;
          col = mix(col, mc, smoothstep(1., 0.7, md2) * pa);
        }
      }
      // front half of the rings
      if (zr >= 0. && rr < 1.) { col = col * (1. - ra * 0.85) + ringLit * ra; cov = max(cov, ra); }
    }
  }
  // the small blue-white second sun
  float sd = max(dot(d, uSunD), 0.);
  float disc = smoothstep(0.99987, 0.99994, sd);
  vec3 sun = mix(uIce, vec3(0.7, 0.84, 1.), 0.7) * (disc * 4.5 + pow(sd, 5200.) * 0.55) + mix(uIce, vec3(0.55, 0.72, 1.), 0.8) * (pow(sd, 320.) * 0.045 + pow(sd, 28.) * 0.018);
  col += sun;
  cov = max(cov, clamp(disc + pow(sd, 2600.) + pow(sd, 320.) * 0.3, 0., 1.));
  // horizon haze sits in front of everything
  float hz = exp(-max(d.y, 0.) * 22.);
  col = mix(col, grad, hz * 0.75);
  cov *= 1. - hz * 0.75 * (1. - uFull);
  return vec4(col, cov);
}
`;

// cheap version of the figure for reflections in the crystals (no noise, stars or moons)
const GLSL_SKY_LITE = /* glsl */`
vec3 skyLite(vec3 d){
  vec3 grad = skyGrad(d);
  vec3 col = grad;
  float dz = dot(d, uPC);
  if (dz > 0.25) {
    vec2 q = vec2(dot(d, uPR), dot(d, uPU)) / (dz * uPTan);
    float r2 = dot(q, q);
    if (r2 < 5.8) {
      float zr = -(q.x * uAxis.x + q.y * uAxis.y) / uAxis.z;
      float x = (length(vec3(q, zr)) - uRing.x) / uRing.y;
      float ra = (x > 0. && x < 1.) ? smoothstep(0., 0.05, x) * smoothstep(1., 0.9, x) * (0.6 + 0.4 * sin(x * 40. + uBandSeed)) * (1. - 0.9 * smoothstep(0.04, 0.01, abs(x - 0.6))) : 0.;
      float side = smoothstep(-1.6, 1.6, q.x * sign(uL1.x));
      vec3 ringLit = mix(uSand * 1.35, uIce, 0.3) * (0.14 + side) + uPink * 1.25 * (1. - side);
      float rr = sqrt(r2);
      float pa = smoothstep(1., 0.97, rr);
      if (zr < 0. || rr >= 1.) col = col * (1. - ra * 0.8) + ringLit * ra * 0.9;
      if (pa > 0.) {
        vec3 n = vec3(q, sqrt(max(1. - r2, 0.)));
        float w = dot(n, uAxis) * 15. + uBandSeed * 2.;
        vec3 base = mix(uBandA, uBandB, 0.5 + 0.5 * sin(w)) * (0.72 + 0.28 * sin(w + 0.9));
        vec3 lit = base * (vec3(0.72, 0.96, 0.94) * 0.95 * smoothstep(-0.1, 0.6, dot(n, uL1)) + uPink * 0.85 * pow(max(dot(n, uL2), 0.), 2.4) + uMid * 0.2);
        col = mix(col, grad * 0.5 + lit, pa);
      }
      if (zr >= 0. && rr < 1.) col = col * (1. - ra * 0.85) + ringLit * ra * 0.9;
    }
  }
  float sd = max(dot(d, uSunD), 0.);
  col += vec3(0.75, 0.9, 1.) * (pow(sd, 2600.) * 6. + pow(sd, 320.) * 0.07);
  return col;
}
`;

// ---------- shared GLSL: ripples on the mirror ----------
const GLSL_RIPPLE = /* glsl */`
uniform vec4 uRip[8];       // x, z, strength, phase
uniform float uRipGain;
uniform int uRipN;         // number of sources in use
vec2 rippleSlope(vec2 p, float t){
  vec2 g = vec2(0.);
  for (int i = 0; i < 8; i++) {
    if (i >= uRipN) break;
    if (uRip[i].z <= 0.) continue;
    vec2 dv = p - uRip[i].xy; float dist = length(dv) + 1e-3;
    if (dist > 85.) continue;
    float env = uRip[i].z * exp(-dist * 0.065) * smoothstep(0.5, 4., dist);
    g += (dv / dist) * cos(dist * 2.6 - t * 1.9 + uRip[i].w) * env * uRipGain;
  }
  // wind ripples in drifting patches ("cat's paws") with calm mirror between them
  float calm = 0.25 + 0.75 * smoothstep(-0.3, 0.9, sin(p.x * 0.023 + 1.7 * sin(p.y * 0.019 + t * 0.02)) + 0.6 * sin(p.y * 0.031 - p.x * 0.013 + t * 0.03));
  g += 0.36 * calm * vec2(sin(p.x * 0.83 + p.y * 0.31 + t * 1.3) + 0.5 * sin(p.x * 2.3 - p.y * 1.1 - t * 2.0),
                   sin(p.y * 1.07 - p.x * 0.4 + t * 1.1) + 0.5 * sin(p.y * 2.7 + p.x * 0.8 + t * 2.3));
  // slow swell: long low waves that make the whole reflection breathe
  g += (0.3 + 0.25 * calm) * vec2(sin(p.x * 0.19 + p.y * 0.07 + t * 0.9), sin(p.y * 0.23 - p.x * 0.05 + t * 1.05) + 0.6 * sin(p.y * 0.11 + t * 0.6));
  return g;
}
`;

// ---------- dome: sky figure above, rippled mirror of it below ----------
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
const DOME_FRAG = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform vec3 uCamL;
${GLSL_SKY}
${GLSL_RIPPLE}
void main(){
  vec3 d = normalize(vDir);
  vec4 s;
  if (d.y >= 0.) {
    s = skyFigure(d, 1.);
  } else {
    float h = max(uCamL.y, 0.5);
    float tHit = h / max(-d.y, 1e-4);
    vec2 hit = uCamL.xz + d.xz * tHit;
    float fade = 1. / (1. + tHit * 0.03);
    vec2 g = rippleSlope(hit, uTime) * 0.013 * fade;
    vec3 r = reflect(d, normalize(vec3(-g.x, 1., -g.y)));
    r.y = abs(r.y);
    s = skyFigure(normalize(r), 1.);
    float steep = smoothstep(0., 0.6, -d.y);
    s.rgb = mix(s.rgb * 0.88, s.rgb * 0.68 + uDark * 0.05, steep);
    s.a *= 0.9;
  }
  float seam = exp(-abs(d.y) * 42.);
  float az = max(dot(normalize(d.xz + vec2(1e-5)), uGlowAz), 0.);
  s.rgb = mix(s.rgb, uHor * 0.5 + uPink * 0.26 * pow(az, 3.) + uSand * 0.1 * pow(az, 14.), seam * 0.6 * uFull);
  gl_FragColor = vec4(s.rgb, mix(s.a, 1., uFull));
}
`;

// ---------- crystal ----------
const CRYSTAL_VERT = /* glsl */`
attribute vec3 aData;   // x: 0 base .. 1 tip, y: per-crystal seed, z: glow strength
attribute vec3 color;
varying vec3 vP, vN, vData, vCol;
uniform float uMirror, uTime;
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vData = aData; vCol = color;
  vec3 p = position;
  if (uMirror > 0.5) {
    float dep = max(p.y, 0.);
    p.x += sin(p.y * 0.9 + uTime * 1.3 + p.z * 0.3) * 0.012 * dep;
    p.z += sin(p.y * 1.2 - uTime * 1.1 + p.x * 0.3) * 0.008 * dep;
  }
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const CRYSTAL_FRAG = /* glsl */`
precision highp float;
varying vec3 vP, vN, vData, vCol;
uniform vec3 uCamL;
uniform float uMirror, uArrive, uPulse;
uniform vec3 uGlowDir;
#include <fog_pars_fragment>
${GLSL_SKY}
${GLSL_SKY_LITE}
void main(){
  if (vP.y < 0.) discard;
  vec3 cam = uCamL; if (uMirror > 0.5) cam.y = -cam.y;
  vec3 V = normalize(cam - vP);
  vec3 N = normalize(vN);
  if (dot(N, V) < 0.) N = -N;
  float tip = vData.x, seed = vData.y, glowK = vData.z;
  // tertiary detail: growth striations and internal frost / fracture planes
  float dk = smoothstep(0.14, 0.11, max(vCol.r, max(vCol.g, vCol.b)));     // 1 on the dark teeth (body colour multiplied down by the builder)
  float stri = sin(tip * (150. + seed * 120.) + seed * 40.) * (1. - 0.8 * dk);
  float frost = fb2(vP.xy * 1.3 + vP.z * 0.9 + seed * 17.);
  vec3 fd = normalize(vec3(sin(seed * 31.), 0.6, cos(seed * 47.)));
  float frac = smoothstep(0.955, 1., abs(sin(dot(vP, fd) * (1.6 + seed * 2.) + frost * 5.)));
  N = normalize(N + (stri * 0.035 + (frost - 0.5) * 0.12) * normalize(cross(N, vec3(0.31, 0.9, 0.3)) + 1e-4));
  float ndv = max(dot(N, V), 0.);
  float fres = pow(1. - ndv, 3.);
  vec3 R0 = reflect(-V, N);
  vec3 R = vec3(R0.x, abs(R0.y), R0.z);
  vec3 T = refract(-V, N, 0.74); T.y = abs(T.y) * 0.6 + 0.05; T = normalize(T);
  vec3 refl = skyLite(R);
  vec3 thru = skyGrad(T) + (uPink * 0.45 + uSand * 0.3) * smoothstep(0.78, 0.96, dot(T, uPC));
  vec3 body = vCol * (0.75 + 0.5 * frost);
  body = mix(uMid * (1.1 + 1.6 * frost) + uPink * 0.03, body, smoothstep(-1., 15., vP.y + frost * 6.));
  float keyD = max(dot(N, uSunD), 0.);
  float glowD = max(dot(N, uGlowDir), 0.);
  vec3 keyC = mix(uIce, vec3(0.75, 0.86, 1.), 0.5);
  vec3 col = body * (keyC * keyD * 0.85 + uPink * glowD * 0.75 + uMid * 0.5 + uHor * 0.08);
  col += thru * (body * 2.0 + 0.07) * (1. - fres) * 0.6;
  col += refl * mix(0.09, 0.85, fres);
  // the arch (everything within 30 m of the origin) has a key side and a shadow side: faces turned from the small sun sink
  // toward dark violet, so the lancet is a dark frame with bright edges against the planet
  float archK = 1. - smoothstep(30., 40., length(vP.xz));
  col = mix(col, col * 0.2 + (uDark * 0.6 + uMid * 0.4) * 0.7, 0.9 * archK * smoothstep(0.35, -0.3, dot(N, uSunD)) * (1. - 0.6 * fres));
  // the dark teeth (body colour multiplied down by the builder) stay silhouettes: little sky shows through or on them
  col *= 1. - 0.6 * dk;
  col += mix(keyC, vCol * 3., 0.25) * min(pow(max(dot(R0, uSunD), 0.), 70.) * 5., 1.0);
  col += uPink * pow(max(dot(R0, uGlowDir), 0.), 12.) * 0.5;
  // spectral flashes: thin-film colour that swings with the view angle
  vec3 spec = 0.5 + 0.5 * cos(6.2832 * (ndv * 2.6 + seed * 3. + frost * 0.6 + vec3(0., 0.33, 0.67)));
  float flash = smoothstep(0.55, 0.95, sin(ndv * 23. + seed * 50. + dot(vP, fd) * 0.6) * 0.5 + 0.5);
  col += spec * flash * (0.16 + 0.4 * fres) * (0.5 + 0.7 * keyD) * (1. - 0.6 * dk);
  col += (uIce * 0.5 + spec * 0.3) * frac * 0.22 * (1. - 0.75 * dk);
  // inner light gathering toward the tips
  float pulse = 0.8 + 0.2 * sin(uTime * 0.9 + seed * 20.);
  float glow = pow(clamp(tip, 0., 1.), 5.) * glowK * pulse;   // clamped: multisampling extrapolates tip past its range on facets seen edge-on
  vec3 glowC = mix(uHor, uIce, 0.4 + 0.35 * tip) * (0.75 + 0.5 * spec);
  col += glowC * glow * (1.7 + 0.4 * uArrive);
  // arrival: one band of light climbing the whole arch
  float band = (vP.y - uPulse * 32.) * 0.42;
  col += glowC * exp(-band * band) * uArrive * 0.6;
  // waterline: wet dark band and a thin bright meniscus
  col *= 0.6 + 0.4 * smoothstep(0., 1.3, vP.y);
  col += uIce * 0.5 * smoothstep(0.14, 0.0, vP.y);
  if (uMirror > 0.5) col = col * 0.82 + uDark * 0.03;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

// ---------- wet sand: the thin transparent film over everything mirrored ----------
const SAND_VERT = /* glsl */`
varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const SAND_FRAG = /* glsl */`
precision highp float;
varying vec3 vP;
uniform vec3 uCamL, uSand, uDark, uMid, uIce, uPink, uHor, uSunD;
uniform float uTime, uSandR;
#include <fog_pars_fragment>
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
${GLSL_RIPPLE}
void main(){
  vec3 toCam = uCamL - vP;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float ndv = clamp(V.y, 0., 1.);
  float look = smoothstep(0.22, 0.95, ndv);
  vec2 p = vP.xz;
  // rippled sand under the film: two crossing ripple trains, both bent by slow noise, shown only near the camera.
  // (Crests mostly run across the line of flight: crests along it turn into rays from the vanishing point.)
  float nearK = 1. - smoothstep(14., 60., dist);
  float wv = vn2(p * 0.045) * 6. + vn2(p * 0.013) * 9.;
  vec2 wq = vec2(vn2(p * 0.09 + 3.1), vn2(p * 0.09 + 17.7)) * 5.5;
  float phA = p.y * 2.05 + p.x * 0.38 + wq.x * 1.7 + wv * 1.2;
  float phB = (p.x * 0.866 + p.y * 0.5) * 1.33 + wq.y * 2.1 - wv * 0.9;
  float aaA = 1. - smoothstep(0.7, 2.4, fwidth(phA)), aaB = 1. - smoothstep(0.7, 2.4, fwidth(phB));
  float patch2 = smoothstep(0.3, 0.7, vn2(p * 0.031 + 40.));
  float rp = (sin(phA) * (0.75 - 0.35 * patch2) * aaA + sin(phB) * (0.2 + 0.5 * patch2) * aaB) * nearK;
  float rp2 = sin(p.x * 0.21 + p.y * 0.47 + wv * 1.7) * (1. - smoothstep(60., 220., dist));
  float tone = 0.5 + 0.36 * rp + 0.14 * rp2;
  vec3 sand = mix(uDark * 0.8, uSand * 0.17 + uMid * 0.22, tone);
  sand *= 0.78 + 0.5 * max(rp, 0.) + 0.25 * vn2(p * 0.3);
  sand += uHor * 0.035 * smoothstep(0.55, 1., vn2(p * 0.6 + 9.)) * nearK;        // wet teal pools between the ripples
  vec2 g = rippleSlope(p, uTime);
  float crest = smoothstep(0.85, 1.25, dot(g, normalize(uSunD.xz))) / (1. + dist * 0.018);
  float alpha = mix(0.06, 0.5, look);
  vec3 col = sand + mix(uHor, uIce, 0.5) * crest * 0.55;
  alpha = clamp(alpha + crest * 0.1, 0., 0.85);
  // glitter: sparks of the small sun on the wind ripples, drifting slowly with the breeze, only near the camera
  vec2 gp = (p + vec2(0.35, 0.12) * uTime) * 0.9, gi = floor(gp), gf = fract(gp) - 0.5;
  float gh = h21(gi), gk = step(0.9, gh);
  vec2 go = (vec2(h21(gi + 7.7), h21(gi + 31.3)) - 0.5) * 0.6;
  float tw = sin(uTime * (1.5 + gh * 37.) + gh * 80.); tw = max(tw, 0.); tw *= tw * tw;
  float gr = clamp(0.06 + dist * 0.005, 0.06, 0.3);                                   // a spark stays a pixel or two wide
  float spark = gk * tw * smoothstep(gr, gr * 0.25, length(gf - go * (1. - gr * 2.))) * (1. - smoothstep(20., 90., dist)) * smoothstep(3., 9., dist);
  col += mix(uIce, vec3(0.75, 0.88, 1.), 0.5) * spark * 1.2;
  alpha = clamp(alpha + spark * 0.4, 0., 0.9);
  alpha *= 1. - smoothstep(0.55, 1., length(p) / uSandR);
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}
`;

// ---------- glints: tip sparks, motes, apex star and their mirror images ----------
const GLINT_VERT = /* glsl */`
attribute vec2 aCorner;
attribute vec4 aInfo;    // size, seed, kind (0 tip, 1 mote, 2 apex), mirror sign
uniform float uTime, uArrive, uBeacon;
varying vec2 vUv; varying vec3 vI;
void main(){
  vec3 c = position; float size = aInfo.x, seed = aInfo.y, kind = aInfo.z, inten = 1., minPx = 0.0016;
  if (kind > 0.5 && kind < 1.5) {
    float life = fract(seed * 7.3 + uTime * (0.014 + 0.018 * fract(seed * 13.)));
    float a = seed * 40. + uTime * 0.12 + life * 4.;
    c.y = 0.3 + life * 36.;
    c.x += sin(a) * 2.2; c.z += cos(a * 1.3) * 2.2;
    inten = sin(life * 3.1416) * (0.45 + 0.55 * sin(uTime * 2.1 + seed * 90.));
    minPx = 0.0;
  } else if (kind < 0.5) {
    inten = 0.55 + 0.45 * sin(uTime * (0.7 + fract(seed * 5.) * 1.7) + seed * 60.);
    inten *= inten * (1. + 0.15 * uArrive) * (0.25 + 0.75 * fract(seed * 9.7));
  } else if (kind < 2.5) {
    inten = 1.1 + 0.45 * uArrive + 7. * uBeacon * (0.85 + 0.15 * sin(uTime * 2.3));
    size *= 1. + 0.15 * uArrive + 0.07 * sin(uTime * 1.7);
    minPx = 0.006 + 0.026 * uBeacon;
  } else {
    // the far spark where the portal will hang: only seen from a distance
    inten = 5. * uBeacon * (0.8 + 0.2 * sin(uTime * 1.9 + 1.));
    minPx = 0.02;
    size *= uBeacon;
  }
  if (aInfo.w < 0.) { c.y = -c.y; inten *= 0.6; }
  vec4 mv = modelViewMatrix * vec4(c, 1.);
  size = max(size, -mv.z * minPx);
  mv.xy += aCorner * size;
  gl_Position = projectionMatrix * mv;
  vUv = aCorner; vI = vec3(inten, seed, kind);
}
`;
const GLINT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec3 vI;
uniform vec3 uIce, uPink, uHor;
void main(){
  float r = length(vUv);
  float core = exp(-r * r * 14.) + 0.25 * exp(-r * 3.2) * smoothstep(1., 0.6, r);
  float flare = 0.;
  if (vI.z > 1.5) {
    vec2 a = abs(vUv);
    flare = (exp(-a.y * 46.) * exp(-a.x * 3.2) + exp(-a.x * 46.) * exp(-a.y * 4.5)) * smoothstep(1., 0.5, r);
    core = exp(-r * r * 30.) * 1.6 + 0.3 * exp(-r * 4.) * smoothstep(1., 0.5, r);
  }
  vec3 c = mix(uIce, mix(uPink, uHor, step(0.5, fract(vI.y * 5.7))), fract(vI.y * 3.1) * 0.55);
  if (vI.z > 1.5) c = mix(uIce, vec3(1.), 0.4);
  gl_FragColor = vec4(c * (core + flare) * vI.x * 2.6, 1.);
}
`;

// ---------- crystal geometry builder (flat-faceted, non-indexed) ----------
function makeCrystalBuilder() {
  const pos = [], nor = [], dat = [], col = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), ctr = new THREE.Vector3();
  function tri(p0, p1, p2, t0, t1, t2, seed, glow, colr, axisPt) {
    e1.subVectors(p1, p0); e2.subVectors(p2, p0); n.crossVectors(e1, e2);
    if (n.lengthSq() < 1e-10) return;
    n.normalize();
    ctr.copy(p0).add(p1).add(p2).multiplyScalar(1 / 3).sub(axisPt);
    let q1 = p1, q2 = p2, u1 = t1, u2 = t2;
    if (n.dot(ctr) < 0) { n.negate(); q1 = p2; q2 = p1; u1 = t2; u2 = t1; }
    pos.push(p0.x, p0.y, p0.z, q1.x, q1.y, q1.z, q2.x, q2.y, q2.z);
    for (let i = 0; i < 3; i++) { nor.push(n.x, n.y, n.z); col.push(colr.r, colr.g, colr.b); }
    dat.push(t0, seed, glow, u1, seed, glow, u2, seed, glow);
  }
  // nodes: [{ p: Vector3, r: number, t: 0..1 }] along the growth axis; the last node gets a pointed cap.
  function prism(nodes, o) {
    const sides = o.sides, rng = o.rng, K = nodes.length;
    const ang = [], fac = [];
    for (let i = 0; i < sides; i++) { ang.push(((i + rng.range(-0.28, 0.28)) / sides) * Math.PI * 2 + o.spin); fac.push(rng.range(0.8, 1.16)); }
    const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3();
    const rings = [];
    for (let k = 0; k < K; k++) {
      const p = nodes[k].p;
      let i0 = k, i1 = k;
      while (i0 > 0 && nodes[i0].p.distanceToSquared(p) < 1e-8) i0--;
      while (i1 < K - 1 && nodes[i1].p.distanceToSquared(p) < 1e-8) i1++;
      T.subVectors(nodes[i1].p, nodes[i0].p).normalize();
      if (k === 0) {
        Nn.set(1, 0, 0); if (Math.abs(T.x) > 0.9) Nn.set(0, 0, 1);
        Nn.addScaledVector(T, -Nn.dot(T)).normalize();
      } else {
        // parallel transport of the frame
        Nn.addScaledVector(T, -Nn.dot(T)); if (Nn.lengthSq() < 1e-8) Nn.set(0, 0, 1); Nn.normalize();
      }
      B.crossVectors(T, Nn).normalize(); prevT.copy(T);
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const r = nodes[k].r * fac[i];
        ring.push(new THREE.Vector3().copy(p).addScaledVector(Nn, Math.cos(ang[i]) * r).addScaledVector(B, Math.sin(ang[i]) * r));
      }
      rings.push(ring);
    }
    for (let k = 0; k < K - 1; k++) {
      const r0 = rings[k], r1 = rings[k + 1], t0 = nodes[k].t, t1 = nodes[k + 1].t;
      ctr.copy(nodes[k].p).add(nodes[k + 1].p).multiplyScalar(0.5);
      const ax = ctr.clone();
      // a terrace (same point, different radius) faces along the axis: push its reference point back
      if (nodes[k].p.distanceToSquared(nodes[k + 1].p) < 1e-8) ax.addScaledVector(T.subVectors(nodes[Math.min(K - 1, k + 2)].p, nodes[k].p).normalize(), nodes[k].r > nodes[k + 1].r ? -5 : 5);
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        tri(r0[i], r0[j], r1[j], t0, t0, t1, o.seed, o.glow, o.color, ax);
        tri(r0[i], r1[j], r1[i], t0, t1, t1, o.seed, o.glow, o.color, ax);
      }
    }
    // termination: off-centre apex with one or two bevel facets
    const last = nodes[K - 1], lr = rings[K - 1];
    T.subVectors(last.p, nodes[K - 2].p);
    if (T.lengthSq() < 1e-8) T.subVectors(last.p, nodes[Math.max(0, K - 3)].p);
    T.normalize();
    const apex = new THREE.Vector3().copy(last.p).addScaledVector(T, o.tipLen);
    apex.addScaledVector(Nn, rng.range(-0.3, 0.3) * last.r).addScaledVector(B, rng.range(-0.3, 0.3) * last.r);
    for (let i = 0; i < sides; i++) tri(lr[i], lr[(i + 1) % sides], apex, last.t, last.t, 1, o.seed, o.glow, o.color, last.p);
    return apex;
  }
  function build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(dat, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }
  return { prism, build, count: () => pos.length / 9 };
}

// straight crystal from base along dir, with optional growth terraces
function straightNodes(base, dir, len, r0, rng, taper = 0.55) {
  const nodes = [];
  const steps = len > 2.5 ? rng.int(1, 2) : 0;
  const cuts = [0]; for (let i = 0; i < steps; i++) cuts.push(rng.range(0.3, 0.85)); cuts.push(1); cuts.sort((x, y) => x - y);
  let r = r0;
  for (let i = 0; i < cuts.length; i++) {
    const t = cuts[i], p = new THREE.Vector3().copy(base).addScaledVector(dir, len * t);
    const rr = r0 * (1 - taper * t) * (r / r0);
    nodes.push({ p, r: rr, t: t * 0.85 });
    if (i > 0 && i < cuts.length - 1) { r *= rng.range(0.78, 0.9); nodes.push({ p: p.clone(), r: r0 * (1 - taper * t) * (r / r0), t: t * 0.85 }); }
  }
  return nodes;
}

// ---------- the arch: two bundled spires leaning together, foot clusters, shard field ----------
function buildArchGeometry(rng, C, P) {
  const B = makeCrystalBuilder();
  const tips = [];            // { p, size, kind }
  const H = P.H, X0 = P.X0;
  const tmp = new THREE.Vector3();
  const tint = (seed, k = 1) => {
    // deep violet body drifting to teal, a few pink or sand-tinted crystals
    const c = C.violet.clone().lerp(C.teal, clamp(0.25 + 0.5 * seed + rng.range(-0.15, 0.15), 0, 1) * P.tealBias);
    if (rng.chance(0.14)) c.lerp(C.pink, 0.45); else if (rng.chance(0.1)) c.lerp(C.sand, 0.35);
    c.multiplyScalar(k * rng.range(0.8, 1.25));
    return c;
  };
  // centreline of a leg: a lancet curve, kinked like stacked crystal growth
  const legs = [];
  for (const s of [-1, 1]) {
    const tall = s === P.tallSide;
    const top = new THREE.Vector3(-s * (tall ? 1.1 : 0.2), tall ? H + 0.8 : H - 1.6, s * P.cross);
    const pw = P.pow * (tall ? 1 : rng.range(0.9, 1.08));
    const zb = rng.range(-1.2, 1.2);
    const centre = (t, out) => {
      const k = Math.pow(clamp(t, 0, 1), pw);
      out.set(lerp(s * X0, top.x, k), top.y * t, lerp(0, top.z, k) + zb * Math.sin(Math.PI * clamp(t, 0, 1)) * (1 - t));
      return out;
    };
    // kink the smooth curve into straight growth segments
    const NS = rng.int(7, 9), ts = [-0.05];
    for (let i = 1; i < NS; i++) ts.push(clamp(i / NS + rng.range(-0.035, 0.035), 0.02, 0.97));
    ts.push(1);
    const r0 = P.r0 * (tall ? 1 : 0.94);
    const rad = (t) => r0 * Math.pow(1 - clamp(t, 0, 1), 0.72) + 0.3;
    const nodes = [];
    let shrink = 1;
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i], p = centre(t, new THREE.Vector3());
      if (t < 0) p.set(s * X0, -1.5, 0);
      nodes.push({ p, r: rad(t) * shrink, t: Math.max(t, 0) * 0.9 });
      if (i > 0 && i < ts.length - 1 && rng.chance(0.6)) { shrink *= rng.range(0.9, 0.96); nodes.push({ p: p.clone(), r: rad(t) * shrink, t: Math.max(t, 0) * 0.9 }); }
    }
    const seed = rng();
    const apex = B.prism(nodes, { sides: P.sides, rng, spin: rng.range(0, 6.28), seed, glow: 1, color: tint(0.7, 1.0), tipLen: rng.range(2.2, 3.4) });
    tips.push({ p: apex, size: 2.6, kind: 0 });
    legs.push({ s, centre, rad, top, seed });

    // side shafts fused to the main one, always on the outside of the opening
    const nb = rng.int(4, 5);
    for (let j = 0; j < nb; j++) {
      const phi = rng.range(-1.9, 1.9);
      const ox = s * Math.cos(phi), oz = Math.sin(phi);
      const tEnd = rng.range(0.28, 0.86), rj = r0 * rng.range(0.42, 0.68);
      const sn = [], M = 6;
      let sh = 1;
      for (let i = 0; i <= M; i++) {
        const l = i / M, t = lerp(-0.04, tEnd, l);
        centre(Math.max(t, 0), tmp);
        if (t < 0) tmp.y = -1.5;
        const m = (rad(t) + rj) * 0.72 * (1 - 0.35 * l) + 2.4 * l * l * l;
        const p = new THREE.Vector3(tmp.x + ox * m, tmp.y, tmp.z + oz * m);
        const rr = rj * (1 - 0.6 * l) * sh;
        sn.push({ p, r: rr, t: l * 0.85 });
        if (i > 0 && i < M && rng.chance(0.4)) { sh *= rng.range(0.85, 0.94); sn.push({ p: p.clone(), r: rj * (1 - 0.6 * l) * sh, t: l * 0.85 }); }
      }
      const ap = B.prism(sn, { sides: rng.int(5, 6), rng, spin: rng.range(0, 6.28), seed: rng(), glow: 0.75, color: tint(rng(), 0.95), tipLen: rng.range(1.2, 2.6) });
      tips.push({ p: ap, size: 1.5, kind: 0 });
    }
    // out-growths sprouting from the shaft, pointing up and outward
    const ng = rng.int(6, 9);
    for (let j = 0; j < ng; j++) {
      const t = rng.range(0.12, 0.8);
      centre(t, tmp);
      const phi = rng.range(-2.0, 2.0);
      const dir = new THREE.Vector3(s * Math.cos(phi) * rng.range(0.5, 1.1), rng.range(0.5, 1.2), Math.sin(phi) * rng.range(0.5, 1.1)).normalize();
      const base = tmp.clone().addScaledVector(dir, rad(t) * 0.35);
      const len = rng.range(1.6, 4.6) * (1 - 0.4 * t);
      const ap = B.prism(straightNodes(base, dir, len, len * rng.range(0.085, 0.13), rng), { sides: rng.int(5, 6), rng, spin: rng.range(0, 6.28), seed: rng(), glow: 0.6, color: tint(rng(), 1.05), tipLen: len * 0.22 });
      if (rng.chance(0.3)) tips.push({ p: ap, size: 0.7, kind: 0 });
    }
    // foot cluster: a crown of leaning crystals around the base
    const nc = rng.int(11, 15);
    for (let j = 0; j < nc; j++) {
      const phi = rng.range(-2.3, 2.3);
      const rr = rng.range(1.6, 5.2);
      const base = new THREE.Vector3(s * X0 + s * Math.cos(phi) * rr, -0.8, Math.sin(phi) * rr * 1.15);
      const lean = rng.range(0.15, 0.95) * (rr / 5.2 + 0.35);
      const dir = new THREE.Vector3(s * Math.cos(phi) * lean, 1, Math.sin(phi) * lean).normalize();
      const len = rng.range(3.2, 12.5) * (1.15 - lean * 0.6);
      const ap = B.prism(straightNodes(base, dir, len, len * rng.range(0.07, 0.105) + 0.12, rng), { sides: rng.int(5, 7), rng, spin: rng.range(0, 6.28), seed: rng(), glow: 0.6, color: tint(rng(), 1), tipLen: len * rng.range(0.14, 0.24) });
      if (rng.chance(0.55)) tips.push({ p: ap, size: 0.5 + len * 0.08, kind: 0 });
    }
  }
  // shard field and druse: small crystals trailing away from both feet, never in the flight corridor
  const nsh = P.shards;
  for (let j = 0; j < nsh; j++) {
    const s = rng.sign();
    const far = Math.pow(rng(), 1.7);
    const x = s * (X0 - 2.2 + far * 20 + rng.range(0, 2.5)), z = rng.gauss() * (2.2 + far * 9);
    if (Math.abs(x) < 8.6) continue;
    const big = rng.chance(0.12);
    const len = big ? rng.range(2.5, 6.5) : rng.range(0.35, 1.9);
    const dir = new THREE.Vector3(rng.gauss() * 0.3, 1, rng.gauss() * 0.3).normalize();
    const base = new THREE.Vector3(x, -0.3, z);
    const ap = B.prism(straightNodes(base, dir, len + 0.3, len * rng.range(0.09, 0.16) + 0.05, rng), { sides: rng.int(4, 6), rng, spin: rng.range(0, 6.28), seed: rng(), glow: big ? 0.6 : 0.4, color: tint(rng(), 1), tipLen: len * 0.3 });
    if (big ? rng.chance(0.7) : rng.chance(0.05)) tips.push({ p: ap, size: big ? rng.range(0.6, 1.1) : 0.4, kind: 0 });
  }
  return { geometry: B.build(), tips, legs, triangles: B.count() };
}

function buildGlints(rng, tips, apex, feetX) {
  const N = tips.length, pos = [], corner = [], info = [], index = [];
  const quad = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  let v = 0;
  for (let i = 0; i < N; i++) {
    const t = tips[i], seed = rng();
    for (const mir of [1, -1]) {
      for (const q of quad) { pos.push(t.p.x, t.p.y, t.p.z); corner.push(q[0], q[1]); info.push(t.size, seed, t.kind, mir); }
      index.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 2));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 4));
  g.setIndex(index);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);
  return g;
}

// ---------- hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('ringed-shore-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hue = rng.range(-0.03, 0.03);
  for (const c of pal) c.offsetHSL(hue, 0, 0);
  const C = { zen: pal[0], violet: pal[1], teal: pal[2], pink: pal[3], sand: pal[4], dark: pal[5], ice: pal[6] };
  const skyMode = opts.sky ?? 'full';
  const portalY = opts.portalY ?? 8.5;
  const sandRadius = opts.sandRadius ?? 2600;

  // ----- sky figure layout -----
  const elev = (opts.planetElev ?? 30) * DEG, pRad = (opts.planetSize ?? 38) * 0.5 * DEG, open = (opts.ringTilt ?? 17) * DEG;
  const elev1 = (opts.planetElev1 ?? opts.planetElev ?? 30) * DEG;       // elevation at the end of the flight (default: no change)
  const elev0 = (opts.planetElev0 ?? opts.planetElev ?? 30) * DEG, pRad0 = (opts.planetSize0 ?? opts.planetSize ?? 38) * 0.5 * DEG;
  const PC = new THREE.Vector3(0, Math.sin(elev0), -Math.cos(elev0));
  const PR = new THREE.Vector3(1, 0, 0), PU = new THREE.Vector3(0, Math.cos(elev0), Math.sin(elev0));
  const roll = rng.sign() * rng.range(9, 17) * DEG;
  const axis = new THREE.Vector3(-Math.sin(roll) * Math.cos(open), Math.cos(roll) * Math.cos(open), Math.sin(open)).normalize();
  const e2 = new THREE.Vector3(0, 0, 1).addScaledVector(axis, -axis.z).normalize();
  const e1 = new THREE.Vector3().crossVectors(axis, e2).normalize();
  const sunAz = rng.range(39, 47) * DEG, sunEl = 12 * DEG;
  const sunD = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl));
  const L1 = new THREE.Vector3(0.78, rng.range(0.15, 0.4), rng.range(0.3, 0.5)).normalize();
  const L2 = new THREE.Vector3(rng.range(-0.4, -0.05), -0.86, -0.22).normalize();
  const glowDir = new THREE.Vector3(0, 0.12, -1).normalize();
  const dirAzEl = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  // The larger moon stands beside the ring of this seed's planet and clear of it: its place on the sky is told by the ring.
  // Seen from the planet's centre it lies 20 to 45 degrees round from the ring's ansa on the -x side toward the planet's upper
  // pole (its first draw), and so far out that the gap between its limb and the outline of the ringed planet (the outer edge
  // of the ring with this seed's roll and opening, and the disc) is 2 to 6 degrees (its second draw). The outline is taken
  // with the planet at its largest and at every elevation it holds along the flight. The two draws are the two the moon
  // always took.
  const moonR = 1.4 * DEG, ringOut = opts.look && opts.look.ring ? opts.look.ring[0] + Math.max(opts.look.ring[1] - opts.look.ring[0], 0.1) : 2.08;
  const pBig = Math.max(pRad, pRad0), tanBig = Math.tan(pBig), eLo = Math.min(elev0, elev, elev1), eHi = Math.max(elev0, elev, elev1);
  const cRoll = Math.cos(roll), sRoll = Math.sin(roll), sOpen = Math.sin(open);
  const figC = new THREE.Vector3(), figU = new THREE.Vector3(), figO = new THREE.Vector3();
  // the smallest angle between a sky direction and the outline of the ringed planet (the limb and the outer edge of the ring)
  const figureGap = (m) => {
    let g = 9;
    for (let j = 0; j <= 4; j++) {
      const e = lerp(eLo, eHi, j / 4);
      figC.set(0, Math.sin(e), -Math.cos(e)); figU.set(0, Math.cos(e), Math.sin(e));
      g = Math.min(g, m.angleTo(figC) - pBig);
      for (let i = 0; i < 240; i++) {
        const a = (i / 240) * Math.PI * 2, mj = Math.cos(a) * ringOut * tanBig, mn = Math.sin(a) * ringOut * sOpen * tanBig;     // along the long and the short axis of the ring's ellipse on the sky
        g = Math.min(g, m.angleTo(figO.copy(figC).addScaledVector(PR, mj * cRoll - mn * sRoll).addScaledVector(figU, mj * sRoll + mn * cRoll).normalize()));
      }
    }
    return g;
  };
  const moonTurn = (20 + (rng.range(62, 78) - 62) * (25 / 16)) * DEG, moonGap = (2 + (rng.range(16, 28) - 16) * (4 / 12)) * DEG;
  const mqx = -cRoll * Math.cos(moonTurn) - sRoll * Math.sin(moonTurn), mqy = -sRoll * Math.cos(moonTurn) + cRoll * Math.sin(moonTurn);
  // start where this direction leaves the outline (the edge of the ring, or the limb where the ring lies inside the disc) and go
  // outward until the gap is reached
  const m1 = new THREE.Vector3();
  for (let r = Math.atan(Math.max(1, ringOut / Math.hypot(Math.cos(moonTurn), Math.sin(moonTurn) / sOpen)) * tanBig); r < 80 * DEG; r += 0.2 * DEG) {
    m1.copy(PC).addScaledVector(PR, mqx * Math.tan(r)).addScaledVector(PU, mqy * Math.tan(r)).normalize();
    if (figureGap(m1) >= moonR + moonGap) break;
  }
  const m2 = dirAzEl(rng.range(-25, 25) * DEG, rng.range(74, 81) * DEG);
  const moons = [new THREE.Vector4(m1.x, m1.y, m1.z, Math.cos(moonR)), new THREE.Vector4(m2.x, m2.y, m2.z, Math.cos(0.8 * DEG))];

  // ----- arch parameters (per seed) -----
  const P = {
    H: rng.range(29.5, 31), X0: rng.range(11.3, 11.9), pow: rng.range(2.1, 2.9), r0: rng.range(2.6, 3.0),
    sides: rng.int(5, 7), tallSide: rng.sign(), cross: rng.range(0.5, 0.9), tealBias: rng.range(0.75, 1.3), shards: rng.int(280, 420),
  };
  const apexPos = new THREE.Vector3(0, P.H - 1.2, 0);
  const feet = [new THREE.Vector3(-P.X0, 0, 0), new THREE.Vector3(P.X0, 0, 0)];

  // ----- shared uniforms -----
  const rip = []; for (let i = 0; i < 8; i++) rip.push(new THREE.Vector4(0, 0, 0, 0));
  rip[0].set(feet[0].x, 0, 0.6, rng.range(0, 6.28)); rip[1].set(feet[1].x, 0, 0.6, rng.range(0, 6.28));
  const U = {
    uZen: { value: C.zen }, uMid: { value: C.violet }, uHor: { value: C.teal }, uPink: { value: C.pink },
    uSand: { value: C.sand }, uDark: { value: C.dark }, uIce: { value: C.ice },
    uPC: { value: PC }, uPR: { value: PR }, uPU: { value: PU }, uPTan: { value: Math.tan(pRad0) },
    uAxis: { value: axis }, uE1: { value: e1 }, uE2: { value: e2 }, uL1: { value: L1 }, uL2: { value: L2 },
    uSunD: { value: sunD }, uGlowAz: { value: new THREE.Vector2(0, -1) }, uGlowDir: { value: glowDir },
    uMoon: { value: moons }, uTime: { value: 0 }, uBandSeed: { value: rng.range(0, 40) },
    uFull: { value: skyMode === 'full' ? 1 : 0 },
    uStorm: { value: new THREE.Vector4(rng.range(-0.9, 0.9), rng.range(-0.45, 0.45), rng.range(0.16, 0.28), rng.range(0.5, 1)) },
    uCamL: { value: new THREE.Vector3(0, 10, 100) }, uRip: { value: rip }, uRipGain: { value: 1 }, uRipN: { value: 2 },
    uArrive: { value: 0 }, uBeacon: { value: 1 }, uPulse: { value: -1 }, uSandR: { value: sandRadius },
    uBandA: { value: C.sand.clone().multiplyScalar(0.95) }, uBandB: { value: C.pink.clone().multiplyScalar(0.8).add(C.sand.clone().multiplyScalar(0.15)) },
    uRing: { value: new THREE.Vector2(1.24, 0.84) }, uMoonSh: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  // opts.look: this seed's planet. { bandA, bandB: THREE.Color, ring: [inner, outer] in planet radii, moon: [x, y, radius, drift] }
  const look = opts.look || {};
  if (look.bandA) U.uBandA.value.copy(look.bandA);
  if (look.bandB) U.uBandB.value.copy(look.bandB);
  if (look.ring) U.uRing.value.set(look.ring[0], Math.max(look.ring[1] - look.ring[0], 0.1));
  if (look.moon) U.uMoonSh.value.set(look.moon[0], look.moon[1], look.moon[2], look.moon[3]);
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group();
  object.name = 'ringed-shore-hero';

  // ----- 1. sky figure dome -----
  let dome = null;
  if (skyMode !== 'none') {
    const full = skyMode === 'full';
    dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.ShaderMaterial({
      uniforms: U, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide,
      depthWrite: false, depthTest: true, transparent: !full, fog: false,
    }));
    dome.renderOrder = full ? -0.9 : -10;
    dome.frustumCulled = false;
    dome.scale.setScalar(3000);
    object.add(dome);
  }
  await ctx.yield?.();

  // ----- 2/3. arch and its mirror image -----
  const arch = buildArchGeometry(rng, C, P);
  arch.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 14, 0), 46);   // set by hand: computing it walks every vertex
  await ctx.yield?.();
  const mkCrystal = (mirror) => new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), U, { uMirror: { value: mirror } }),
    vertexShader: CRYSTAL_VERT, fragmentShader: CRYSTAL_FRAG, side: THREE.DoubleSide, fog: true,
  });
  const archMesh = new THREE.Mesh(arch.geometry, mkCrystal(0));
  const archMirror = new THREE.Mesh(arch.geometry, mkCrystal(1));
  archMirror.scale.y = -1;
  object.add(archMesh, archMirror);
  await ctx.yield?.();

  // ----- 4. wet sand film -----
  let sand = null;
  if (opts.wetSand !== false) {
    const sg = new THREE.CircleGeometry(sandRadius, 96); sg.rotateX(-Math.PI / 2);
    sand = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), U), vertexShader: SAND_VERT, fragmentShader: SAND_FRAG,
      transparent: true, depthWrite: false, fog: true,
    }));
    sand.renderOrder = 1;
    object.add(sand);
  }

  // ----- 5. glints, motes, apex star -----
  const tips = arch.tips.slice();
  tips.push({ p: apexPos.clone(), size: 4.2, kind: 2 });
  tips.push({ p: new THREE.Vector3(0, portalY, 0), size: 3.4, kind: 3 });
  const nm = rng.int(90, 130);
  for (let i = 0; i < nm; i++) {
    const s = rng.sign(), k = rng();
    tips.push({ p: new THREE.Vector3(s * P.X0 * (1 - k * k * 0.8) + rng.gauss() * 2.5, 0, rng.gauss() * 3.5), size: rng.range(0.1, 0.24), kind: 1 });
  }
  const glints = new THREE.Mesh(buildGlints(rng, tips), new THREE.ShaderMaterial({
    uniforms: U, vertexShader: GLINT_VERT, fragmentShader: GLINT_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  glints.renderOrder = 3; glints.frustumCulled = false;
  object.add(glints);
  await ctx.yield?.();

  // ----- anchors -----
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: v3(0, portalY, 0), facing: v3(0, 0, 1), radius: 7 },
    flyThrough: [v3(0, 20, 280), v3(0, 15.5, 170), v3(0, 11.5, 80), v3(0, portalY + 0.6, 25), v3(0, portalY, 0), v3(0, portalY, -40)],
    approachDir: v3(0, 0, -1),
    apex: apexPos.clone(),
    feet: feet.map((f) => f.clone()),
    planetDir: PC.clone(), planetMirrorDir: v3(PC.x, -PC.y, PC.z), sunDir: sunD.clone(), glowDir: glowDir.clone(),
    keyLight: { dir: sunD.clone(), color: '#cfe4ff', intensity: 2.2 },
    fillLight: { dir: glowDir.clone(), color: '#ff7ab8', intensity: 0.7 },
    viewpoints: {
      figure: { position: v3(0, 4, 300), target: v3(0, 4, 0) },
      threeQuarter: { position: v3(38, 9, 62), target: v3(0, 13, 0) },
      under: { position: v3(0, portalY, 30), target: v3(0, 22, -10) },
    },
  };

  // ----- extension hooks: more crystals in the arch's material (spire field of the world) -----
  // list: [{ x, z, h, r?, lean?: [lx, lz], sides?, glow?, shards?, tip? }] in hero-local space.
  // Returns { object (mesh + y-flipped mirror, add it to hero.object), tips, triangles }.
  // async: pass `pause` (for example () => ctx.yield()) and it is awaited every few crystals, so the build never stalls.
  async function buildCrystals(list, r, pause) {
    const B = makeCrystalBuilder(), tipsOut = [];
    const tintC = (k = 1) => {
      const c = C.violet.clone().lerp(C.teal, clamp(r.range(0.1, 0.9), 0, 1) * P.tealBias);
      if (r.chance(0.14)) c.lerp(C.pink, 0.45); else if (r.chance(0.1)) c.lerp(C.sand, 0.35);
      return c.multiplyScalar(k * r.range(0.8, 1.25));
    };
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hMax = 1, done = 0;
    for (const s of list) {
      if (pause && (++done % 10) === 0) await pause();
      x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); hMax = Math.max(hMax, s.h);
      const dir = new THREE.Vector3(s.lean ? s.lean[0] : 0, 1, s.lean ? s.lean[1] : 0).normalize();
      const base = new THREE.Vector3(s.x, -0.8, s.z);
      const r0 = s.r ?? (s.h * 0.048 + 0.28);
      const ap = B.prism(straightNodes(base, dir, s.h + 0.8, r0, r, 0.62), { sides: s.sides ?? r.int(5, 7), rng: r, spin: r.range(0, 6.28), seed: r(), glow: s.glow ?? 0.8, color: tintC(s.dark ?? 1), tipLen: s.h * r.range(0.1, 0.18) });
      if (s.tip ?? s.h > 7) tipsOut.push({ p: ap, size: 0.45 + s.h * 0.04, kind: 0 });
      const n = s.shards ?? r.int(2, 5);
      for (let j = 0; j < n; j++) {
        const phi = r.range(0, 6.283), rr = r0 * r.range(0.9, 2.4), lean = r.range(0.12, 0.6);
        const d2 = new THREE.Vector3(Math.cos(phi) * lean + dir.x, 1, Math.sin(phi) * lean + dir.z).normalize();
        const len = s.h * r.range(0.14, 0.55);
        const b2 = new THREE.Vector3(s.x + Math.cos(phi) * rr, -0.6, s.z + Math.sin(phi) * rr);
        const a2 = B.prism(straightNodes(b2, d2, len + 0.6, len * r.range(0.06, 0.1) + 0.12, r), { sides: r.int(4, 6), rng: r, spin: r.range(0, 6.28), seed: r(), glow: 0.55, color: tintC(s.dark ?? 1), tipLen: len * r.range(0.14, 0.24) });
        if (len > 7 && r.chance(0.4)) tipsOut.push({ p: a2, size: 0.4 + len * 0.04, kind: 0 });
      }
    }
    if (pause) await pause();
    const g = B.build();
    // bounding sphere by hand from the layout (leans and shards stay well inside the margin)
    if (list.length) g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, hMax * 0.5, (z0 + z1) / 2), Math.hypot((x1 - x0) / 2, (z1 - z0) / 2, hMax * 0.5) + hMax * 0.7 + 8);
    else g.computeBoundingSphere();
    if (pause) await pause();
    const mesh = new THREE.Mesh(g, archMesh.material), mirror = new THREE.Mesh(g, archMirror.material);
    mirror.scale.y = -1;
    const group = new THREE.Group(); group.add(mesh, mirror);
    return { object: group, tips: tipsOut, triangles: B.count() * 2 };
  }
  // one additive batch of tip sparks (with their mirror images) for crystals made by buildCrystals
  function buildTipGlints(tipList, r) {
    const m = new THREE.Mesh(buildGlints(r, tipList), glints.material);
    m.renderOrder = 3; m.frustumCulled = false;
    return m;
  }

  const camL = U.uCamL.value;
  let progress = 0;
  const hero = {
    buildCrystals, buildTipGlints, colors: C,
    object, radius: 30, height: P.H + 1, center: new THREE.Vector3(0, 13, 0), anchors,
    ground: false, groundY: 0, uniforms: U,
    triangles: arch.triangles * 2 + 64 * 48 * 2 + 96 + tips.length * 4,
    setProgress(u) {
      progress = clamp(u, 0, 1);
      const a = smoothstep(0.6, 0.97, progress);
      U.uArrive.value = a;
      U.uBeacon.value = 1 - smoothstep(0.12, 0.5, progress);
      U.uPulse.value = ((progress * 14) % 1) * 1.2 - 0.1;
      U.uRipGain.value = 1 + 0.5 * a;
      // the planet rises out of the seam and grows as the flight goes on (uniform values only)
      const k = smoothstep(0.0, 0.66, progress), e = lerp(lerp(elev0, elev, k), elev1, smoothstep(0.7, 0.96, progress));
      PC.set(0, Math.sin(e), -Math.cos(e)); PU.set(0, Math.cos(e), Math.sin(e));
      U.uPTan.value = Math.tan(lerp(pRad0, pRad, k));
      anchors.planetDir.copy(PC); anchors.planetMirrorDir.set(PC.x, -PC.y, PC.z);
    },
    setRipple(i, x, z, strength = 1, phase = 0) { if (i >= 2 && i < 8) { rip[i].set(x, z, strength, phase); U.uRipN.value = Math.max(U.uRipN.value, i + 1); } },
    update(dt, time, camera) {
      U.uTime.value = time;
      object.updateWorldMatrix(true, false);
      camL.setFromMatrixPosition(camera.matrixWorld);
      object.worldToLocal(camL);
      if (dome) {
        dome.position.copy(camL);
        dome.scale.setScalar(Math.min((camera.far || 4000) * 0.78, 3200));
      }
    },
    dispose() {},
  };
  return hero;
}
