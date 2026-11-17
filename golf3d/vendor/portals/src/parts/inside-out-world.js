// Hero set piece for "inside-out-world": THE ARCH OF THE WORLD.
//
// The far ring of a spinning ring habitat, seen from inside: a strip of radius 2000 m and width
// 1200 m whose axis is local X, lowest point at the origin (ring centre at y = 2000). The land
// is painted procedurally in the fragment shader (patchwork fields, woods, lakes, villages with
// lights in the shaded sector, a silver river that runs right round the ring, a monorail and
// boats as moving glints, a drifting cloud layer with shadows, blue scattering that grows with
// distance), plus two 300 m glass side walls with fresnel sheen and mullions, the hub axle with
// its line of sun-mirrors, structural wall spokes and slender elevator spokes with climbing lights.
//
// The nearest 500 m of arc either side of the origin is left OPEN (alpha fade 500..650 m): the
// world coder builds the real near terrain there, bent with hero.ringPoint().
//
// opts
//   palette      7 hex strings (brief order: space, sky blue, pale haze, leaf green, water, stone/tan, warm light)
//   openArc      arc length left open either side of the origin (default 500), openFade (default 150)
//   shadeCentre  arc angle (radians) of the centre of the shaded, lamp-lit sector (default: per seed, high on the +Z arch)
//   cloudCover   0..1 (default per seed ~0.5)
//   nearSpoke    { s, x } foot of the elevator spoke that rises from the near village (default { s: -225, x: 120 }),
//                or a function (riverX) => { s, x } so the world can seat it against this seed's river
//   fogMax       how much of the scene's fog may tint the arch (default 0.15; the arch does its own scattering)
//
// returned extras
//   ringPoint(s, x, h, outPos?, outUp?) -> { position, up }  local position of arc length s (0 = lowest
//       point, + toward +Z), x across (-600..600), h above the floor, and the radial up there.
//   riverX(s)    x of the river centre line at arc length s (0 at s = 0, slope 0.. gentle); width 25 m.
//   monorailX(s) x of the monorail line (left bank, riverX - 110).
//   setProgress(u) optional: 0..1 path progress; brightens the silver river / mirror line around u 0.45.
//   uniforms     shared uniforms (uSunDir, uSunCol, uHaze ...) if the world wants to retint.
//   landMaterial the painted-land ShaderMaterial. A world may drape a mesh with `position` (hero local space) and
//       `aTheta` (ring angle 0..2pi of each vertex) over its own terrain inside the fade zone and draw it with a
//       material sharing this one's shaders and uniforms object: the paint then cross-fades over real ground.
//
// anchors (local space)
//   ringCentre [0,2000,0], ringRadius 2000, ringWidth 1200, wallHeight 300
//   portalSeat { position, facing }  centre of a 14 m portal on the river at s = +450 (the aqueduct's
//       central arch), facing back down the path (-Z); world may re-seat with ringPoint/riverX.
//   flyThrough  ordered points following the river from s = -450 to s = +450 at 20/80/15 m, >= 6 m clear.
//   viewpoints  good camera positions with a `look` target (the overhead river crossing).
//   archPoi     point on the ring straight "up the arch" (35 degrees above the horizon from mid-path).
//   overhead    the top of the ring (0, 4000, 0).
//   spokes      [{ s, x, foot:[x,y,z] }] elevator spoke feet; index 0 is the near village spoke.
//   villages    [{ s, x }] painted villages on the far ring.
//
// Size: `radius` 170, `height` -560 and `center` (0,520,0) are hints for the orbit viewer only (they keep its camera low inside the ring, looking up the arch) (ground:false); the real
// extent is a 4000 m tall, 1200 m wide ring. Cost: ~27k triangles, 3 draw calls, no lights, one
// 64^3 single-channel noise texture (freed in dispose()). Lighting: self-lit by its own shader (warm key from -X through the left wall, blue
// ambient); it ignores scene lights, honours scene fog up to opts.fogMax, writes linear HDR
// (river glints, lamps and mirrors 2..6 for bloom). Needs camera far >= 5000.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp } from '../kit/core.js';

const R = 2000, W = 1200, WALL = 300, TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#0a1030', '#7fb6ff', '#dff1ff', '#4f9a56', '#2f6f9a', '#c9b68a', '#ffcf6a'];

const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uHaze, uHazeFar, uSunDir, uSunCol, uAmb;
uniform float uShade, uFogMax, uProgress;
uniform highp sampler3D uNoise;
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// value noise from a 64^3 tiling lattice texture: one filtered fetch per tap (smooth interpolation via the warped fraction)
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return texture(uNoise, (i + f + 0.5) / 64.0).r;
}
float fbm3(vec3 p){ return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.1) + 0.125 * vnoise(p * 4.1 + 3.3) + 0.0625 * vnoise(p * 8.2 + 1.7); }
float fbm2(vec3 p){ return 0.62 * vnoise(p) + 0.38 * vnoise(p * 2.07 + 5.3); }
// day factor around the ring: 1 in sunlight, 0 in the shaded, lamp-lit sector
float dayAt(float th){ return smoothstep(-0.12, 0.30, 0.62 - cos(th - uShade)); }
// blue scattering by distance through the ring's air, then a capped share of the scene fog
vec3 airAndFog(vec3 col, float dist, float day, float fogDepth, vec3 fogCol, float fogF){
  float a = 0.8 * (1.0 - exp(-pow(max(dist, 1.0) / 4200.0, 1.8)));
  vec3 hz = mix(uHaze, uHazeFar, smoothstep(600.0, 3800.0, dist)) * mix(0.16, 1.0, day);
  col = mix(col, hz, a);
  col = mix(col, fogCol * mix(0.12, 1.0, day), min(fogF, uFogMax) * smoothstep(0.0, 400.0, fogDepth));   // (the air of the night side is unlit)
  return col;
}
`;
const FOG_FACTOR = /* glsl */`
  float fogF = 0.0; vec3 fogC = vec3(0.0); float fogD = 0.0;
  #ifdef USE_FOG
    fogD = vFogDepth; fogC = fogColor;
    #ifdef FOG_EXP2
      fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
`;

const LAND_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aTheta;
varying vec3 vP; varying vec3 vW; varying float vTh; varying float vX;
void main(){
  vP = position - vec3(0.0, ${R}.0, 0.0); vTh = aTheta; vX = position.x;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const LAND_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec3 uGreen, uWater, uTan, uWarm, uPale, uSeed;
uniform vec4 uRiver[3];        // amplitude, integer frequency, unused, unused
uniform vec3 uVillage[8];
uniform float uOpen, uOpenFade, uCloud;
varying vec3 vP; varying vec3 vW; varying float vTh; varying float vX;
float riverX(float th){ return uRiver[0].x * sin(uRiver[0].y * th) + uRiver[1].x * sin(uRiver[1].y * th) + uRiver[2].x * sin(uRiver[2].y * th); }
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
// small cumulus drifting round the ring: a density field, cut hard so each cloud is a separate heap
float cloudD(vec3 p){
  vec3 q = rotX(p, uTime * 0.0035) * vec3(0.0030, 0.0040, 0.0040) + uSeed.zxy;
  return fbm3(q) + 0.05 * vnoise(q * 3.7 + uTime * 0.008);
}
float cloudCut(float d){ float t0 = mix(0.69, 0.60, uCloud); return smoothstep(t0, t0 + 0.028, d); }
void main(){
  float s = vTh * ${R}.0, x = vX;
  float arc = min(vTh, ${TAU.toFixed(6)} - vTh) * ${R}.0;       // arc distance from the lowest point
  float alpha = smoothstep(uOpen, uOpen + uOpenFade, arc);
  if (alpha < 0.004) discard;
  float px = length(fwidth(vP)) + 0.001;                 // metres per pixel
  vec3 q = vP + uSeed * 900.0;
  float day = dayAt(vTh);

  // ---- relief (painted) ----
  float hill = fbm2(q * 0.0021);
  float hillL = fbm2((q + vec3(-45.0, 0.0, 0.0)) * 0.0021);
  float relief = clamp((hill - hillL) * 11.0, -1.0, 1.0);

  // ---- water: river and lakes ----
  float rx = riverX(vTh), dr = abs(x - rx);
  // (25 m wide where it meets the real river, drawn finer up the arch so it stays a thread and not a road)
  float rw = max(mix(12.5, 5.0, smoothstep(uOpen + 60.0, uOpen + 900.0, arc)), px * 1.0);
  float river = 1.0 - smoothstep(rw, rw + max(px * 0.8, 2.0), dr);
  float bank = 1.0 - smoothstep(rw, rw + 22.0 + px, dr);
  float lakeN = vnoise(q * 0.0029 + 11.0) + 0.35 * vnoise(q * 0.0105);
  float edge = (1.0 - smoothstep(520.0, 600.0, abs(x)));
  float lake = smoothstep(0.955, 0.97 + px * 0.002, lakeN) * edge * smoothstep(60.0, 120.0, dr);
  float shore = smoothstep(0.90, 0.955, lakeN) * edge;
  float valley = 1.0 - smoothstep(40.0, 260.0, dr);

  // ---- patchwork of fields ----
  vec2 wq = vec2(s, x) + 36.0 * (vec2(vnoise(q * 0.0045), vnoise(q * 0.0045 + 19.0)) - 0.5)
                       + 190.0 * (vec2(vnoise(q * 0.0011 + 3.0), vnoise(q * 0.0011 + 31.0)) - 0.5);
  vec2 fc = vec2((vTh / ${TAU.toFixed(6)} + 0.5) * 150.0 + wq.x / ${(TAU * R / 150).toFixed(4)} - s / ${(TAU * R / 150).toFixed(4)}, wq.y / 64.0);
  vec2 ci = floor(fc);
  float d1 = 1e9, d2 = 1e9; vec2 cid = vec2(0.0);                       // voronoi fields with hedgerows on the borders
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = ci + vec2(float(i), float(j)); vec2 gw = vec2(mod(g.x, 150.0), g.y);
    vec2 o = vec2(hash12(gw + uSeed.xy * 50.0), hash12(gw * 1.7 + 9.3));
    vec2 r = (g + 0.12 + 0.76 * o - fc) * vec2(${(TAU * R / 150).toFixed(2)}, 64.0);
    float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; cid = gw; } else if (d < d2){ d2 = d; }
  }
  float fh0 = hash12(cid + uSeed.xy * 50.0 + 5.0), fh2 = hash12(cid * 1.7 + 9.0);
  float fh = clamp(0.5 + (fh0 - 0.5) * 1.05 + (vnoise(q * 0.0022 + 50.0) - 0.5) * 0.6, 0.0, 0.999);   // crops cluster a little by district, but every field is its own
  float ed = (sqrt(max(d2, 0.0)) - sqrt(max(d1, 0.0))) * 0.5;
  // hedges: never under a pixel and a half wide, so the patchwork keeps its edges all the way up the arch (fainter where a field is only a few pixels)
  float hwid = max(1.3, px * 0.66);
  float hedge = (1.0 - smoothstep(hwid, hwid + max(px * 0.7, 0.6), ed)) * mix(0.9, 0.4, smoothstep(6.0, 15.0, px));
  vec3 fGreen = mix(uGreen * vec3(0.72, 0.98, 0.6), uGreen * vec3(1.5, 1.2, 0.5), fh2) * (0.7 + 0.42 * fract(fh0 * 13.7));
  vec3 field = fGreen;
  field = mix(field, mix(uGreen, uTan, 0.55) * vec3(1.2, 1.16, 0.8), step(0.46, fh));     // ripening
  field = mix(field, uTan * vec3(1.12, 0.98, 0.62) * (0.8 + 0.36 * fh2), step(0.62, fh)); // wheat and stubble
  field = mix(field, vec3(0.27, 0.17, 0.11) * (0.8 + 0.5 * fh2), step(0.79, fh));         // plough
  field = mix(field, vec3(0.74, 0.66, 0.10), step(0.885, fh));                            // rape
  field = mix(field, vec3(0.52, 0.36, 0.34), step(0.968, fh));                            // orchards in bloom
  float furrow = sin((fh2 > 0.5 ? fc.x * 84.0 : fc.y * 64.0) * 0.9) * 0.5 + 0.5;
  field *= 1.0 - 0.14 * furrow * (1.0 - smoothstep(2.0, 6.0, px)) * step(0.46, fh);
  // strip farming: some fields are ploughed in broad two-tone bands that still read from far off
  float strip = step(0.5, fract((fh2 > 0.5 ? fc.x * 84.0 : fc.y * 64.0) / 21.0 + fh0)) * step(0.7, fract(fh0 * 7.3));
  field *= 1.0 - 0.2 * strip * (1.0 - smoothstep(7.0, 16.0, px));
  // rice paddies: little mirrors in the valley
  float paddy = step(0.72, fh2) * valley * (1.0 - step(0.74, fh));
  field = mix(field, mix(uWater, uGreen, 0.4) * 1.1 + 0.08 * uPale, paddy * 0.7);

  // ---- woods and meadow ----
  float wn = fbm2(q * 0.0046 + 5.0) + 0.12 * vnoise(q * 0.021) - 0.06 + 0.5 * (hill - 0.47);
  float wood = smoothstep(0.53, 0.57, wn) * (1.0 - 0.8 * valley);
  float tuft = vnoise(q * 0.09) * (1.0 - smoothstep(4.0, 14.0, px));
  vec3 woodC = uGreen * vec3(0.8, 1.0, 0.8) * mix(0.26, 0.46, vnoise(q * 0.02)) * (0.8 + 0.6 * tuft);
  woodC = mix(woodC, vec3(0.34, 0.22, 0.08), 0.3 * smoothstep(0.62, 0.8, vnoise(q * 0.035 + 40.0)));   // maples
  vec3 meadow = uGreen * 1.05 * (0.74 + 0.5 * vnoise(q * 0.012)) * (0.86 + 0.28 * fract(fh0 * 5.3));   // hill pasture: each enclosure grazed to its own tone
  vec3 land = mix(field, meadow, smoothstep(0.58, 0.72, hill) * 0.8);
  land = mix(land, uGreen * vec3(0.3, 0.42, 0.26), hedge);
  // the lanes between the villages: a wide net of pale roads that wanders with the land
  vec2 rg = wq / vec2(470.0, 340.0) + uSeed.xy * 3.0, rcell = abs(fract(rg) - 0.5);
  float rdm = min((0.5 - rcell.x) * 470.0, (0.5 - rcell.y) * 340.0), rwd = max(2.4, px * 0.62);
  float road = (1.0 - smoothstep(rwd, rwd + max(px * 0.6, 0.8), rdm)) * mix(0.85, 0.5, smoothstep(7.0, 16.0, px));
  land = mix(land, uPale * 0.5 + uTan * 0.32, road);
  // a hamlet where two lanes cross
  vec2 rcn = floor(rg + 0.5); float hmh = hash12(rcn + 3.0);
  float hamlet = step(0.42, hmh) * (1.0 - smoothstep(42.0 + 30.0 * hmh, 80.0 + 50.0 * hmh, length((rg - rcn) * vec2(470.0, 340.0))));
  land = mix(land, woodC, wood * (1.0 - 0.8 * road));
  land = mix(land, uTan * 0.9, bank * 0.35 + shore * 0.0);
  land *= 0.72 + 0.5 * hill;
  land = max(mix(vec3(dot(land, vec3(0.3, 0.55, 0.15))), land, 1.16), 0.0);

  // ---- villages ----
  float vil = 0.0, vd = 1e5;
  for (int i = 0; i < 8; i++){ float d = distance(vP, uVillage[i]); vd = min(vd, d); }
  float vr = 150.0 + 60.0 * vnoise(q * 0.02);
  vil = 1.0 - smoothstep(vr * 0.45, vr, vd);
  // market towns scattered over the country between the eight big ones (they are what lights the night side)
  float mkt = smoothstep(0.885, 0.925, vnoise(q * 0.0034 + 70.0) + 0.12 * vnoise(q * 0.013 + 4.0)) * (1.0 - lake) * smoothstep(50.0, 110.0, dr) * edge;
  vil = max(vil, max(mkt * 0.8, hamlet * (1.0 - lake)));
  // roofs: houses 13 m apart seen near; from far off whole blocks of roofs between streets, so a town is a cluster of roofs at any distance
  vec2 hc = vec2(s, x) / 13.0; vec2 hi = floor(hc), hf = fract(hc) - 0.5;
  float hh = hash12(hi + 7.0);
  float roof = step(0.3, hh) * (1.0 - smoothstep(0.30, 0.36 + px * 0.03, max(abs(hf.x), abs(hf.y))));
  vec2 bc = wq / 36.0; vec2 bi = floor(bc), bf = fract(bc) - 0.5;
  float bh = hash12(bi + 17.0);
  float block = step(0.2, bh) * (1.0 - smoothstep(0.31, 0.37 + px * 0.012, max(abs(bf.x), abs(bf.y))));
  float farT = smoothstep(2.2, 5.5, px);
  float roofFar = mix(mix(roof, block, farT), 0.62, smoothstep(11.0, 22.0, px));
  float quarter = vnoise(q * 0.016 + 60.0), hsel = mix(hh, bh, farT);
  vec3 roofC = mix(vec3(0.60, 0.25, 0.13), vec3(0.72, 0.66, 0.54), smoothstep(0.45, 0.7, quarter + 0.5 * (hsel - 0.5)));
  vec3 town = mix(uTan * 0.42, roofC * (0.85 + 0.3 * hsel), roofFar);
  town = mix(town, uGreen * 0.5, smoothstep(0.64, 0.72, vnoise(q * 0.03 + 80.0)));       // gardens and squares
  vil *= smoothstep(0.25, 0.5, vil + 0.5 * (vnoise(q * 0.012 + 33.0) - 0.5));
  land = mix(land, town, vil);
  // rim promenade under the glass
  float prom = smoothstep(572.0, 580.0, abs(x));
  land = mix(land, uPale * 0.62 * (0.9 + 0.1 * step(0.5, fract(s / 24.0))), prom);

  // ---- light ----
  vec3 V = normalize(cameraPosition - vW);
  vec3 Nin = -normalize(vec3(0.0, vP.y, vP.z));                   // the floor's normal: toward the axis
  float thin = 0.11 * valley + 0.6 * (1.0 - smoothstep(uOpen + 420.0, uOpen + 1100.0, arc));   // none over the river, none over the near land and the foot of the arch (seen edge-on a cloud there is a white bar)
  float cs = cloudCut(cloudD(vP + vec3(-150.0, 0.0, 0.0) + Nin * 130.0) - thin);   // cloud shadow, thrown from the sun wall
  float sun = (0.74 + 0.55 * relief) * (1.0 - 0.72 * cs);
  vec3 lit = land * (uSunCol * sun * day + uAmb * (0.35 + 0.65 * day) * (1.0 - 0.25 * cs));

  // ---- water shading ----
  float flow = 0.5 + 0.5 * sin(vTh * 2600.0 - uTime * 1.6 + 6.0 * vnoise(vec3(s * 0.02, x * 0.05, uTime * 0.1)));
  float ripple = mix(flow, 0.5, smoothstep(1.0, 5.0, px));
  float glide = 0.5 + 0.5 * sin(vTh * 29.0 - uTime * 0.3);        // bands of sun-glint travelling along the river
  float glint = glide * glide; glint *= glint; glint *= glint;      // (narrow: a flash 80 m long every 400 m)
  float farK = smoothstep(500.0, 1700.0, distance(cameraPosition, vW));
  float flash = 0.5 + 0.5 * sin(dot(vP, vec3(0.011, 0.016, 0.014)) - uTime * 0.5);   // the sun's reflection crossing each lake in turn: a streak, not the whole sheet
  flash *= flash; flash *= flash; flash *= flash; flash *= flash * flash;      // (narrow: a bar of light crossing the water, never the whole sheet white)
  vec3 lakeC = mix(uWater * 0.5, uPale * 0.8, 0.06 + 0.2 * vnoise(q * 0.01 + uTime * 0.02)) * (uSunCol * day + uAmb * 0.6);
  float lkn = vnoise(q * 0.03 + vec3(0.0, uTime * 0.05, 0.0)), lkn2 = lkn * lkn;
  lakeC += uSunCol * day * (1.3 * lkn2 * lkn2 * lkn + 1.7 * flash * (1.0 - 0.7 * cs));
  vec3 silver = mix(uWater * 0.9 + 0.25 * ripple, vec3(0.50, 0.64, 0.84) * (0.9 + 0.2 * ripple) + vec3(1.0, 0.96, 0.88) * glint * (2.4 + 1.2 * uProgress) * (1.0 - 0.6 * cs), farK);
  vec3 riverC = silver * mix(0.2, 1.0, day) + vec3(0.25, 0.4, 0.7) * 0.22 * (1.0 - day);
  lit = mix(lit, lakeC, lake);
  lit = mix(lit, riverC, river);

  // ---- moving glints: boats on the river, monorail on the left bank ----
  float boat = pow(max(1e-4, 1.0 - abs(fract(vTh / ${TAU.toFixed(6)} * 46.0 + uTime * 0.011) - 0.5) * 2.0), 60.0) * (1.0 - smoothstep(rw * 0.5, rw * 0.5 + px + 2.0, abs(dr - 3.0)));
  lit += vec3(2.2, 2.2, 2.0) * boat * (0.4 + 0.6 * day) + uWarm * 3.0 * boat * (1.0 - day);
  float mx = abs(x - (rx - 110.0)), mw = max(2.0, px * 0.6);
  float rail = 1.0 - smoothstep(mw, mw + max(px, 1.5), mx);
  lit = mix(lit, uPale * 0.38 * (uSunCol * day + uAmb), rail * 0.55 * (1.0 - smoothstep(4.0, 14.0, px)));
  float tr = fract(vTh / ${TAU.toFixed(6)} * 11.0 - uTime * 0.026);
  float train = smoothstep(0.90, 0.93, tr) * (1.0 - smoothstep(0.985, 1.0, tr));
  lit += (vec3(1.6, 1.9, 2.4) * day + uWarm * 3.5 * (1.0 - day) + vec3(4.0, 3.6, 3.0) * smoothstep(0.975, 0.99, tr)) * train * rail;

  // ---- lamps in the shaded sector ----
  float night = 1.0 - day;
  vec2 lc = vec2(s, x) / 17.0 + 2.0 * vec2(vnoise(q * 0.02 + 90.0), vnoise(q * 0.02 + 70.0)); vec2 li = floor(lc);
  float lh = hash12(li + 21.0);
  vec2 lf = fract(lc) - 0.5 - 0.55 * (vec2(hash12(li + 3.7), hash12(li + 11.3)) - 0.5);
  float tw = 0.75 + 0.25 * sin(uTime * (1.0 + 3.0 * lh) + lh * 40.0);
  float lr = 0.10 + px * 0.02;
  float lampDot = mix(1.0 - smoothstep(lr, lr + 0.12, length(lf)), 0.2, smoothstep(5.0, 16.0, px));
  float street = smoothstep(0.35, 0.75, vnoise(q * 0.03 + 12.0));
  float lamps = lampDot * (step(1.0 - 0.75 * vil * vil * street, lh) * (0.5 + lh) * 1.4 + step(0.9965, lh) * (1.0 - wood) + step(0.86, lh) * prom * 0.5 + step(0.95, lh) * bank * 0.5);
  lit += uWarm * 5.0 * lamps * tw * night * (1.0 - river) * (1.0 - lake);
  lit += uWarm * (0.3 * vil + 0.9 * max(mkt, 0.7 * hamlet) * (0.6 + 0.8 * hash12(li * 0.37 + 5.0)) + 0.3 * road * step(0.6, fract(rdm * 0.01 + (rg.x + rg.y) * 9.0))) * night;   // town glow: each market town a warm cluster on the night side

  // ---- clouds seen from above ----
  // (they float 130 m over the land: looked at aslant they slide off their shadows, and the side toward the sun wall is the bright one)
  vec3 pc = vP + (V - Nin * dot(V, Nin)) * (130.0 / max(dot(V, Nin), 0.3));
  float cd = cloudD(pc) - thin, cl = cloudCut(cd);
  float cdS = cloudD(pc + vec3(-55.0, 0.0, 0.0)) - thin;          // density one step toward the sun: less there means this is the lit flank
  float heap = smoothstep(0.0, 0.07, cd - mix(0.69, 0.60, uCloud));   // 0 at a cloud's rim, 1 in its tall middle
  float lightK = clamp(0.42 + 7.0 * (cd - cdS) + 0.45 * heap, 0.0, 1.0);
  vec3 cloudC = mix(vec3(0.40, 0.50, 0.74), vec3(1.04, 1.02, 0.98), lightK) * (uSunCol * 0.86 * day + uAmb * 0.85);
  lit = mix(lit, cloudC, cl * 0.94);
  // morning mist pooled along the river and lakes
  float mist = (valley * 0.5 + shore * 0.3) * vnoise(q * 0.004 + vec3(uTime * 0.01)) * (1.0 - cl);
  lit = mix(lit, uHazeFar * 0.9 * (0.25 + 0.75 * day), mist * 0.08);

  ${FOG_FACTOR}
  vec3 col = airAndFog(lit, distance(cameraPosition, vW), day, fogD, fogC, fogF);
  // lamps and glints punch through the haze a little
  col += uWarm * 1.6 * lamps * tw * night * (1.0 - cl);
  gl_FragColor = vec4(col, alpha);
}`;

// ---------------------------------------------------------------- glass side walls
const GLASS_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aTheta; attribute float aH;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying float vTh; varying float vH;
void main(){
  vP = position; vTh = aTheta; vH = aH;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLASS_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec3 uPale, uWarm, uSpace, uGlowDir;
uniform float uGlowAmt;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying float vTh; varying float vH;
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float dist = distance(cameraPosition, vW);
  float px = length(fwidth(vP)) + 0.001;
  float day = dayAt(vTh);
  float sunSide = step(vP.x, 0.0);                           // the -X wall lets the sunlight in
  float f1 = clamp(1.0 - abs(dot(V, vN)), 0.0, 1.0), fres = f1 * f1 * f1;
  // frame: mullions every 2 degrees, heavy ribs every 24, rails, cap and stone plinth
  float cellM = ${(TAU * R / 180).toFixed(3)};
  float am = vTh / ${TAU.toFixed(6)} * 180.0;
  float dm = (0.5 - abs(fract(am) - 0.5)) * cellM;
  float dM = (0.5 - abs(fract(am / 12.0) - 0.5)) * cellM * 12.0;
  float wv = max(0.7, px * 0.46);
  float mull = (1.0 - smoothstep(wv, wv + px, dm)) * (1.0 - smoothstep(10.0, 30.0, px));
  float rib = 1.0 - smoothstep(max(4.0, px * 0.7), max(4.0, px * 0.7) + px, dM);
  float dh = min(abs(vH - 100.0), abs(vH - 200.0));
  float rail = (1.0 - smoothstep(wv, wv + px, dh)) * (1.0 - smoothstep(12.0, 36.0, px));
  float cap = smoothstep(${WALL - 9}.0 - px, ${WALL - 7}.0, vH);
  float plinth = 1.0 - smoothstep(9.0, 10.0 + px, vH);
  // glazing bars: every pane is leaded into four by five lights; seen on the near stretch of wall, lost in the distance
  float gbx = (0.5 - abs(fract(am * 4.0) - 0.5)) * cellM * 0.25, gby = (0.5 - abs(fract(vH / 20.0) - 0.5)) * 20.0;
  float gbw = max(0.26, px * 0.4);
  float bars = (1.0 - smoothstep(gbw, gbw + px, min(gbx, gby))) * (1.0 - smoothstep(1.7, 4.6, px));
  float frame = clamp(max(max(max(mull * 0.85, bars * 0.7), rib), max(rail * 0.85, max(cap, plinth))), 0.0, 1.0);
  vec3 frameC = uPale * 0.74 * (uSunCol * (0.3 + 0.8 * (1.0 - sunSide)) * day + uAmb * 1.0);
  // panes
  vec2 pid = vec2(floor(am), floor(vH / 100.0));
  float ph = hash12(pid + 3.0);
  vec3 glass = uSpace * 0.25 + mix(uHaze, uPale, 0.5) * (0.10 + 0.9 * fres) * (0.8 + 0.4 * ph) * (0.3 + 0.7 * day);
  float a = 0.07 + 0.62 * fres;
  // the sun behind the sunward wall: a core that blooms, a golden fall-off round it, and plain dark glass with stars everywhere else
  float sd = max(dot(-V, uGlowDir), 0.0), sd2 = sd * sd, sd4 = sd2 * sd2, sd16 = sd4 * sd4 * sd4 * sd4, sd64 = sd16 * sd16 * sd16 * sd16;
  float core = sd64 * sd64 * sd64 * sd64 * sd64 * sd64, halo = sd64, skirt = sd4 * sd4, wide = sd16 * sd4 * sd4;
  // (the glass is old and a little dusty: each light passes its own share, and the dust shows as soft vertical streaks in the glow)
  float lightId = hash12(vec2(floor(am * 4.0), floor(vH / 20.0)) + 9.0);
  float dust = 0.72 + 0.56 * vnoise(vec3(am * 5.0, vH * 0.035, 3.0)) * (0.6 + 0.4 * vnoise(vec3(am * 37.0, vH * 0.21, 11.0)));
  float sunK = sunSide * uGlowAmt * (0.8 + 0.2 * ph) * mix(1.0, 0.82 + 0.3 * lightId, 1.0 - smoothstep(1.7, 4.6, px));
  glass += uWarm * uSunCol * (7.0 * core + 1.6 * halo + (0.22 * skirt + 0.55 * wide) * dust) * sunK;
  a += clamp(core + 0.85 * halo + (0.22 * skirt + 0.4 * wide) * dust, 0.0, 0.92) * sunK;
  frameC *= 1.0 - 0.62 * clamp(halo + 0.8 * wide + 0.45 * skirt, 0.0, 1.0) * sunSide * uGlowAmt;      // against the glow the frame is a dark tracery
  // panes that catch the sun: slow travelling glints
  float gl = smoothstep(0.972, 1.0, fract(ph * 7.31 + uTime * 0.05 + vTh * 0.8)) * (1.0 - smoothstep(8.0, 40.0, px));
  gl *= smoothstep(0.0, 0.5, fract(vH / 100.0)) * (1.0 - smoothstep(0.5, 1.0, fract(vH / 100.0))) * (1.0 - abs(fract(am) - 0.5) * 2.0);
  glass += (uWarm * 2.0 + 2.0) * gl * day; a += gl * 0.6;
  vec3 col = mix(glass, frameC, frame);
  a = mix(a, 0.96, frame);
  ${FOG_FACTOR}
  float air = 1.0 - exp(-pow(max(dist, 1.0) / 4200.0, 1.8));
  col = airAndFog(col, dist, day, fogD, fogC, fogF);
  a = clamp(a + air * 0.55, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

// ---------------------------------------------------------------- hub, spokes, rails
const STRUCT_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color; attribute vec2 aFx;      // aFx.x emissive strength, aFx.y position along a spoke (-1: none)
varying vec3 vC; varying vec3 vW; varying vec3 vN; varying vec2 vFx; varying float vLx;
void main(){
  vC = color; vFx = aFx; vLx = position.x;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STRUCT_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec3 uWarm;
varying vec3 vC; varying vec3 vW; varying vec3 vN; varying vec2 vFx; varying float vLx;
void main(){
  vec3 N = normalize(vN);
  float nl = max(dot(N, uSunDir), 0.0);
  vec3 col = vC * (uSunCol * (0.25 + 0.85 * nl) + uAmb * (0.6 + 0.4 * N.y));
  // sun mirrors: a shimmering line of light along the hub
  float shim = 0.8 + 0.2 * sin(vLx * 0.05 - uTime * 0.7) + 0.25 * uProgress;
  col += vC * vFx.x * shim;
  float jw = fwidth(vFx.y * 90.0);
  float joint = step(0.0, vFx.y) * (1.0 - smoothstep(0.06, 0.06 + jw, abs(fract(vFx.y * 90.0) - 0.5))) * (1.0 - smoothstep(0.12, 0.4, jw));
  col *= 1.0 - 0.16 * joint;
  // climbing elevator lights
  float along = max(vFx.y, 0.0);
  float bead = pow(max(1e-4, 1.0 - abs(fract(along * 5.0 - uTime * 0.035) - 0.5) * 2.0), 50.0) * step(0.0, vFx.y);
  col += uWarm * 6.0 * bead;
  ${FOG_FACTOR}
  float dist = distance(cameraPosition, vW);
  vec3 outC = airAndFog(col, dist, 1.0, fogD, fogC, fogF);
  outC += (vC * vFx.x * shim + uWarm * 6.0 * bead) * 0.45;      // lights carry through the haze
  gl_FragColor = vec4(outC, 1.0);
}`;

function ringPointRaw(s, x, h, pos, up) {
  const th = s / R, c = Math.cos(th), sn = Math.sin(th), r = R - h;
  pos.set(x, R - r * c, r * sn); up.set(0, c, -sn);
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const rnd = (a = 0, b = 1) => a + (b - a) * rng();
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cSpace, cSky, cPale, cGreen, cWater, cTan, cWarm] = pal;
  const openArc = opts.openArc ?? 500, openFade = opts.openFade ?? 150;

  // ---- per-seed layout ----
  const sign = () => (rng() < 0.5 ? -1 : 1);
  const river = [
    [rnd(95, 135) * sign(), rng() < 0.5 ? 2 : 3],
    [rnd(35, 55) * sign(), 5 + Math.floor(rng() * 3)],
    [rnd(10, 18) * sign(), 11 + Math.floor(rng() * 5)],
  ];
  const riverX = (s) => { const th = s / R; let x = 0; for (const [a, k] of river) x += a * Math.sin(k * th); return x; };
  const monorailX = (s) => riverX(s) - 110;
  const shade = opts.shadeCentre ?? rnd(2.0, 2.5);
  const cloudCover = opts.cloudCover ?? rnd(0.3, 0.5);
  const villages = [];
  for (let i = 0; i < 8; i++) {
    const th = 0.55 + ((i + rnd(0.15, 0.85)) / 8) * (TAU - 1.1);
    const s = th * R, x = clamp(riverX(s) + sign() * rnd(110, 300), -440, 440);
    villages.push({ s, x, th });
  }

  // tiling lattice for vnoise()
  const noiseData = new Uint8Array(64 * 64 * 64);
  for (let i = 0; i < noiseData.length; i++) { noiseData[i] = Math.floor(rng() * 256); if ((i & 65535) === 65535) await ctx.yield?.(); }
  const noiseTex = new THREE.Data3DTexture(noiseData, 64, 64, 64);
  noiseTex.format = THREE.RedFormat; noiseTex.type = THREE.UnsignedByteType; noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter;
  noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping; noiseTex.unpackAlignment = 1; noiseTex.needsUpdate = true;
  const uniforms = {
    uNoise: { value: noiseTex },
    uTime: { value: 0 }, uProgress: { value: 0 },
    uHaze: { value: cSky.clone().multiplyScalar(0.8) },
    uHazeFar: { value: cSky.clone().lerp(cPale, 0.35).multiplyScalar(0.9) },
    uSunDir: { value: new THREE.Vector3(-0.82, 0.5, 0.28).normalize() },
    uSunCol: { value: new THREE.Color(1.2, 1.02, 0.8) },
    uAmb: { value: new THREE.Color(0.15, 0.23, 0.42) },
    uShade: { value: shade }, uFogMax: { value: opts.fogMax ?? 0.15 },
    uGlowDir: { value: new THREE.Vector3(-0.96, 0.19, -0.2).normalize() }, uGlowAmt: { value: 1 },   // where the sun stands behind the -X wall, and how strong
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group(); object.name = 'ArchOfTheWorld';
  let landMaterial = null;

  // ---- the land strip ----
  {
    const NS = 320, NX = 8, th0 = (openArc - 20) / R, th1 = TAU - th0;
    const pos = new Float32Array((NS + 1) * (NX + 1) * 3), tha = new Float32Array((NS + 1) * (NX + 1)), idx = [];
    let k = 0;
    for (let i = 0; i <= NS; i++) {
      const th = lerp(th0, th1, i / NS), c = Math.cos(th), sn = Math.sin(th);
      for (let j = 0; j <= NX; j++, k++) {
        pos[k * 3] = (j / NX - 0.5) * W; pos[k * 3 + 1] = R - R * c; pos[k * 3 + 2] = R * sn; tha[k] = th;
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NX; j++) {
      const a = i * (NX + 1) + j, b = a + NX + 1; idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aTheta', new THREE.BufferAttribute(tha, 1));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, R, 0), R + W);
    const m = new THREE.ShaderMaterial({
      vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, fog: true, side: THREE.DoubleSide, transparent: true,
      uniforms: {
        ...fogU(), ...uniforms,
        uGreen: { value: cGreen.clone().multiplyScalar(0.95) }, uWater: { value: cWater }, uTan: { value: cTan.clone().multiplyScalar(0.8) },
        uWarm: { value: cWarm }, uPale: { value: cPale },
        uSeed: { value: new THREE.Vector3(rnd(0.5, 9), rnd(0.5, 9), rnd(0.5, 9)) },
        uRiver: { value: river.map(([a, kk]) => new THREE.Vector4(a, kk, 0, 0)) },
        uVillage: { value: villages.map((v) => new THREE.Vector3(v.x, -R * Math.cos(v.th), R * Math.sin(v.th))) },
        uOpen: { value: openArc }, uOpenFade: { value: openFade }, uCloud: { value: cloudCover },
      },
    });
    const mesh = new THREE.Mesh(g, m); mesh.name = 'ringLand'; mesh.renderOrder = 1; object.add(mesh); landMaterial = m;
  }
  await ctx.yield?.();

  // ---- glass side walls (one mesh, both sides) ----
  {
    const NS = 360, NH = 3, pos = [], nor = [], tha = [], hh = [], idx = [];
    for (let side = -1; side <= 1; side += 2) {
      const base = pos.length / 3;
      for (let i = 0; i <= NS; i++) {
        const th = (i / NS) * TAU, c = Math.cos(th), sn = Math.sin(th);
        for (let j = 0; j <= NH; j++) {
          const h = (j / NH) * WALL, r = R - h;
          pos.push(side * W * 0.5, R - r * c, r * sn); nor.push(-side, 0, 0); tha.push(th); hh.push(h);
        }
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NH; j++) {
        const a = base + i * (NH + 1) + j, b = a + NH + 1; idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aTheta', new THREE.Float32BufferAttribute(tha, 1));
    g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, R, 0), R + W);
    const m = new THREE.ShaderMaterial({
      vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: { ...fogU(), ...uniforms, uPale: { value: cPale }, uWarm: { value: cWarm }, uSpace: { value: cSpace } },
    });
    const mesh = new THREE.Mesh(g, m); mesh.name = 'ringGlass'; mesh.renderOrder = 3; object.add(mesh);
  }
  await ctx.yield?.();

  // ---- hub axle, sun mirrors, wall spokes, rails, elevator spokes (one merged mesh) ----
  const parts = [];
  const add = (g, col, emis = 0, along = null) => {
    const gg = g.index ? g.toNonIndexed() : g; if (gg !== g) g.dispose();
    const n = gg.attributes.position.count, c = new Float32Array(n * 3), fx = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
      fx[i * 2] = emis; fx[i * 2 + 1] = along ? along(gg.attributes.position, i) : -1;
    }
    gg.setAttribute('color', new THREE.BufferAttribute(c, 3));
    gg.setAttribute('aFx', new THREE.BufferAttribute(fx, 2));
    gg.deleteAttribute('uv');
    parts.push(gg);
  };
  const white = cPale.clone().multiplyScalar(0.66), grey = cPale.clone().lerp(cSpace, 0.45).multiplyScalar(0.6);
  const mirror = cWarm.clone().lerp(new THREE.Color(1, 1, 1), 0.45);
  const hubC = new THREE.Vector3(0, R, 0);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  const Y = new THREE.Vector3(0, 1, 0), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  // a tapered rod between two points; `along` attribute runs 0 (a) .. 1 (b)
  const rod = (a, b, r0, r1, col, seg = 6, lenSeg = 1, withAlong = false, emis = 0) => {
    const d = tmpA.copy(b).sub(a), len = d.length();
    const g = new THREE.CylinderGeometry(r1, r0, len, seg, lenSeg, true);
    Q.setFromUnitVectors(Y, d.normalize()); P.copy(a).add(b).multiplyScalar(0.5);
    const gg = g.toNonIndexed(); g.dispose();
    let al = null;
    if (withAlong) { const p = gg.attributes.position; al = new Float32Array(p.count); for (let i = 0; i < p.count; i++) al[i] = p.getY(i) / len + 0.5; }
    gg.applyMatrix4(M.compose(P, Q, S));
    add(gg, col, emis, al ? (attr, i) => al[i] : null);
  };
  // axle with collars
  {
    const g = new THREE.CylinderGeometry(11, 11, W + 60, 14, 1, false); g.rotateZ(Math.PI / 2); g.translate(0, R, 0); add(g, grey);
    for (let i = 0; i <= 12; i++) {
      const t = new THREE.TorusGeometry(19, 5, 6, 14); t.rotateY(Math.PI / 2); t.translate(-W / 2 + (i / 12) * W, R, 0); add(t, white);
      if (i % 5 === 4) await ctx.yield?.();
    }
    await ctx.yield?.();
    // sun mirrors: four rows of slightly tilted plates round the axle, 24 along
    for (let i = 0; i < 24; i++) for (let j = 0; j < 4; j++) {
      const b = new THREE.BoxGeometry(44, 2.5, 30);
      const a = (j / 4) * TAU + (i % 2) * 0.785 + rnd(-0.08, 0.08);
      b.rotateZ(rnd(-0.12, 0.12)); b.translate(0, 34, 0); b.rotateX(a); b.translate(-W / 2 + 25 + (i / 23) * (W - 50), R, 0);
      add(b, mirror, rnd(3.6, 5.2));
      if (j === 3 && i % 8 === 7) await ctx.yield?.();
    }
    await ctx.yield?.();
    for (const side of [-1, 1]) {
      const t = new THREE.TorusGeometry(64, 11, 8, 28); t.rotateY(Math.PI / 2); t.translate(side * W / 2, R, 0); add(t, white);
      const cap = new THREE.SphereGeometry(30, 14, 8); cap.scale(1.6, 1, 1); cap.translate(side * (W / 2 + 28), R, 0); add(cap, grey);
      const rail = new THREE.TorusGeometry(R - WALL, 5.5, 6, 180); rail.rotateY(Math.PI / 2); rail.translate(side * (W / 2 - 14), R, 0); add(rail, white);
      const foot = new THREE.TorusGeometry(R - 5, 7, 5, 180); foot.rotateY(Math.PI / 2); foot.translate(side * (W / 2 - 4), R, 0); add(foot, grey);
      const off = rnd(0, TAU);
      for (let k = 0; k < 6; k++) {                       // structural spokes in the wall plane
        const a = off + (k / 6) * TAU, c = Math.cos(a), sn = Math.sin(a);
        const xs = side * (W / 2 - 14);
        tmpB.set(xs, R - 64 * c, 64 * sn);
        rod(P.set(xs, R - (R - WALL) * c, (R - WALL) * sn).clone(), tmpB.clone(), 3.6, 2.2, white, 6, 1);
      }
      await ctx.yield?.();
    }
  }
  await ctx.yield?.();
  // elevator spokes: slender white lines from the floor to the hub, with a flared foot and climbing lights
  const spokes = [];
  const ns = (typeof opts.nearSpoke === 'function' ? opts.nearSpoke(riverX) : opts.nearSpoke) ?? { s: -225, x: 120 };
  spokes.push({ s: ns.s, x: ns.x });
  for (let i = 0; i < 4; i++) {
    const th = 0.75 + ((i + rnd(0.2, 0.8)) / 4) * (TAU - 1.5), s = th * R;
    spokes.push({ s, x: clamp(riverX(s) + sign() * rnd(120, 330), -470, 470) });
  }
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), upv = new THREE.Vector3();
  for (const sp of spokes) {
    ringPointRaw(sp.s, sp.x, 0, pA, upv); sp.foot = pA.toArray();
    pB.set(sp.x, R, 0).addScaledVector(upv, -14);
    rod(pA.clone(), pB.clone(), 4.6, 2.6, white, 6, 24, true);
    ringPointRaw(sp.s, sp.x, 46, pB, upv);
    rod(pA.clone(), pB.clone(), 17, 6, white, 10, 2);                    // flared base tower
    ringPointRaw(sp.s, sp.x, 58, pB, upv);
    const bulb = new THREE.SphereGeometry(9, 10, 6); bulb.scale(1, 1.5, 1);
    Q.setFromUnitVectors(Y, upv); bulb.applyMatrix4(M.compose(pB, Q, S)); add(bulb, mirror, 0.32);
    // guy cables
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + 0.4;
      ringPointRaw(sp.s + Math.cos(a) * 90, sp.x + Math.sin(a) * 90, 0, pB, upv);
      ringPointRaw(sp.s, sp.x, 260, P, upv);
      rod(pB.clone(), P.clone(), 0.9, 0.9, grey, 4, 1);
    }
  }
  let structTris = 0;
  {
    const g = mergeGeometries(parts, false); parts.forEach((p) => p.dispose());
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, R, 0), R + W);
    structTris = g.attributes.position.count / 3;
    const m = new THREE.ShaderMaterial({
      vertexShader: STRUCT_VERT, fragmentShader: STRUCT_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), ...uniforms, uWarm: { value: cWarm } },
    });
    const mesh = new THREE.Mesh(g, m); mesh.name = 'ringStructure'; mesh.renderOrder = 2; object.add(mesh);
  }
  await ctx.yield?.();

  // ---- helpers and anchors ----
  const ringPoint = (s, x = 0, h = 0, outPos = new THREE.Vector3(), outUp = new THREE.Vector3()) => {
    ringPointRaw(s, x, h, outPos, outUp); return { position: outPos, up: outUp };
  };
  const at = (s, x, h) => { ringPointRaw(s, x, h, pA, upv); return pA.toArray(); };
  const flyThrough = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, s = lerp(-450, 450, t);
    const h = t < 0.5 ? lerp(20, 80, Math.sin(t * Math.PI)) : lerp(15, 80, Math.sin(t * Math.PI));
    flyThrough.push(at(s, riverX(s) * (1 - 0.5 * Math.sin(t * Math.PI)), h));
  }
  const archS = 1.22 * R;
  const anchors = {
    ringCentre: [0, R, 0], ringRadius: R, ringWidth: W, wallHeight: WALL, openArc, openFade,
    portalSeat: { position: at(450, riverX(450), 9), facing: [0, 0, -1], up: [0, 1, 0], s: 450 },
    flyThrough,
    archPoi: at(archS, riverX(archS), 0),
    overhead: [riverX(Math.PI * R), 2 * R, 0],
    viewpoints: [
      { position: at(0, 0, 80), look: at(archS, riverX(archS), 0), note: 'mid-path, gaze 35 degrees up the arch' },
      { position: at(-430, riverX(-430), 22), look: at(900, riverX(900), 0), note: 'entry, valley that keeps climbing' },
      { position: at(300, riverX(300), 30), look: at(1500, riverX(1500), 0), note: 'descent, land rising like a wave behind the aqueduct' },
    ],
    spokes: spokes.map((sp) => ({ s: sp.s, x: sp.x, foot: sp.foot })),
    villages: villages.map((v) => ({ s: v.s, x: v.x })),
    shadeCentre: shade,
    sunDir: uniforms.uSunDir.value.toArray(),
  };

  return {
    object,
    radius: 170, height: -560,                 // orbit-viewer hints only (camera low, looking up); real size is in anchors
    center: new THREE.Vector3(0, 520, 0),
    anchors, uniforms, ringPoint, riverX, monorailX, landMaterial,
    triangles: Math.round(structTris + 320 * 8 * 2 + 360 * 3 * 4),
    setProgress(u) { const d = (u - 0.45) / 0.3; uniforms.uProgress.value = Math.exp(-d * d); },
    update(dt, time) { uniforms.uTime.value = time; },
    dispose() { noiseTex.dispose(); },
    ground: false, groundY: 0,
  };
}
