// ORBITAL SUNRISE. A drift along a wheel-shaped station, 400 km up, as the sun breaks over the limb of the Earth.
//
// World frame = hero frame: wheel plane XY, hub at the origin, the camera travels toward -Z. The Earth is a 6000 m
// sphere whose surface lies 400 m below the hub; the limb sits about 20 degrees below the flight line.
// Sunrise is keyed to u (sun elevation schedule SUN_KEYS), ambient motion to time:
//   Earth turning (cities, clouds and their shadows, storm lightning, sea glitter), aurora shimmer, meteors below, wheel
//   rotation (phase steered by u so the camera always crosses mid-gap: simulated in motion at 0.5x, 1x, 2x and 6x, both
//   spoke trusses are 36 m away at the instant of crossing; the nearest a spoke sweeps while passing is 30.7 m at 1x,
//   35 m at 6x, and 23 m at 0.5x, where the wheel turns further during the slower pass: mid-gap is the best aim),
//   tracking solar wings, a tug working down to the dock beside the flight line (the close pass at u 0.8), the approach
//   gate the camera threads at u 0.88, thruster puffs, a ferry under way behind the dock, three
//   spacewalkers with helmet lamps, beacons, guide lights chasing down the aft truss, drifting and streaming ice
//   flecks, satellites, the sky (stars, moon) rising with the sun, the flare cut by passing spokes, a breathing corona.
// Nothing here reads scene lights: the hull shader (hero.material), planet and atmosphere are self-lit from uniforms.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, stationKit as K, makeBeacons } from '../parts/orbit-dawn.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const PALETTE = ['#000003', '#0a1a44', '#3fa0ff', '#ffe9c4', '#c8ccd4', '#1a1d24', '#ffb040'];
const R_EARTH = 6000, H_ATM = 40, ATM_TOP = 5;          // atmosphere scale height (m) and shell top in scale heights
// sun elevation (degrees above the camera's horizontal) against path progress; the limb is near -20.5
const SUN_KEYS = [[0, -31], [0.3, -31], [0.42, -23.6], [0.47, -20.5], [0.5, -18.9], [0.6, -8.5], [0.72, 0], [1, 0]];

// ---------------------------------------------------------------- shaders: planet
const PLANET_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;

// shared: colour of the air at a point of the terminator-lit atmosphere. mu = sine of the sun's elevation there.
const GLSL_AIR = /* glsl */`
uniform vec3 uSun; uniform vec3 uBlue;
vec3 warmAir(float mu) { return mix(vec3(1.0, 0.1, 0.02), vec3(1.0, 0.56, 0.16), smoothstep(-0.1, 0.02, mu)); }
float twilight(float mu) { float x = (mu + 0.03) / 0.085; return exp(-x * x); }
`;

const PLANET_FRAG = /* glsl */`
uniform vec3 uC; uniform sampler2D uTex; uniform vec3 uAxis; uniform vec3 uAxU; uniform vec3 uAxV; uniform vec2 uSpin;
uniform float uTime; uniform vec2 uOff; uniform vec3 uCity; uniform float uCloud; uniform float uPop; uniform float uStorm; uniform float uLand;
uniform float uLift; uniform vec2 uSunT; uniform float uDawn;      // day-side lift of the sun's height (0 by night), sun heading in ground-track coordinates
varying vec3 vW;
${fx.GLSL_HASH}${GLSL_AIR}
// The lowest octaves are magnified a long way (20 m and more to the texel): bend the lookup so texels blend with a
// smooth curve instead of straight bilinear facets, which showed as blocky coasts and cloud edges.
// (Only where a texel really is magnified: the bend fades out as texels shrink toward a pixel across the short axis.)
vec4 texS(vec2 uv) {
  vec2 x = uv * 384.0 + 0.5; vec2 i = floor(x), f = x - i;
  float k = clamp(1.6 - 2.4 * min(length(dFdx(x)), length(dFdy(x))), 0.0, 1.0);
  f = mix(f, f * f * (3.0 - 2.0 * f), k);
  return texture2D(uTex, (i + f - 0.5) / 384.0);
}
// A low-pass lookup (mip 3, 48 texels to the tile, smooth between them) for the field that warps the clouds: warping by
// the full-detail field multiplies its texel facets into blocks.
vec4 texL(vec2 uv) { vec2 x = uv * 48.0 + 0.5; vec2 i = floor(x), f = x - i; f = f * f * (3.0 - 2.0 * f); return texture2D(uTex, (i + f - 0.5) / 48.0, 3.0); }
// cloud thickness at a point of the cloud layer's ground-track coordinates
float cloudAt(vec2 pc) {
  float cw = texL(pc * 0.08 + 0.6).g;
  return 0.5 * texS(pc * 0.12 + (cw - 0.5) * 0.3).r + 0.27 * texS(pc.yx * 0.5 + cw * 0.6 + uTime * 0.003).g + 0.14 * texture2D(uTex, pc * 2.3 - uTime * 0.006).r
    + 0.09 * texture2D(uTex, pc.yx * 9.1 + cw * 2.0 + uTime * 0.009).r;
}
void main() {
  vec3 n = normalize(vW - uC);
  vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  float mu = dot(n, uSun);
  // Once the sun is up the station is over the morning side: the ground below is lit as if the sun stood higher than
  // the grazing light the geometry alone gives (uLift), so cloud reads white and the sea blue instead of dusk brown.
  float muS = mu + uLift;
  float day = smoothstep(-0.07, 0.2, muS);
  // ground-track coordinates in km: x along the track (the Earth turns in x), y across it. All noise comes from one
  // baked tiling texture (r, g: fbm; b: ridged webs; a: fine grain), which is far cheaper than procedural noise here.
  float lat = asin(clamp(dot(n, uAxis), -1.0, 1.0)), lon = atan(dot(n, uAxV), dot(n, uAxU));
  vec2 p = vec2(lon - uSpin.x, lat) * 6.0 + uOff;
  float hd = texture2D(uTex, p * 1.7).r;
  float h = 0.6 * texS(p * 0.105).r + 0.28 * texS(p.yx * 0.43 + 0.21).g + 0.12 * hd + 0.045 * (texture2D(uTex, p * 6.3 + 0.4).g - 0.5);
  float land = smoothstep(uLand, uLand + 0.022, h);
  vec2 pc = vec2(lon - uSpin.y, lat) * 6.0 + uOff.yx;
  float cl = cloudAt(pc);
  float cloud = smoothstep(uCloud, uCloud + 0.1, cl);
  vec3 col = vec3(0.0);
  if (day < 0.995) {                                  // night side: moonlit cloud tops, city webs, storm lightning
    vec3 night = vec3(0.008, 0.014, 0.035) + vec3(0.045, 0.063, 0.11) * cloud * (0.4 + cl) + vec3(0.0, 0.006, 0.014) * land;
    // cities: clusters of points (two sizes of grain) strung on fine road webs; no filled glow under them
    float pop = (smoothstep(0.42, 0.7, texture2D(uTex, p * 0.31 + 0.7).g) + 0.15 * (1.0 - smoothstep(0.0, 0.035, abs(h - uLand - 0.012)))) * uPop;
    float web1 = texture2D(uTex, p * 1.6 + 0.11).b, web2 = texture2D(uTex, p.yx * 5.0 + 0.37).b;      // trunk roads, streets
    float hub = smoothstep(0.5, 0.85, hd);
    float spark = smoothstep(0.6, 0.9, texture2D(uTex, p * 4.3).a) + 0.7 * smoothstep(0.62, 0.92, texture2D(uTex, p.yx * 1.3 + 0.5).a);
    float graze = mix(0.35, 1.0, smoothstep(0.08, 0.45, dot(n, V)));
    float lights = land * pop * (0.1 * web1 + 0.16 * web2 * (0.35 + hub) + hub * 1.9 * spark + 0.45 * spark) * graze;      // the sparks carry the light; the roads only string them
    night += uCity * lights * 2.9 * (1.0 - cloud * 0.6) * (1.0 - smoothstep(-0.1, -0.015, mu));      // the cities switch off at dawn
    vec2 lc = floor(pc * 2.2); float lr = hash12(lc); float ph = uTime * 0.8 + lr * 17.0;
    float lx = fract(ph), ld = max(0.0, 1.0 - lx * 3.0);                         // one eased flash: 0.1 s up, 0.3 s down
    float fl = step(1.0 - 0.16 * uStorm, hash12(lc + floor(ph) * 0.37)) * smoothstep(0.0, 0.08, lx) * ld * ld * 0.9;
    vec2 lf = fract(pc * 2.2) - 0.5;
    night += vec3(0.5, 0.62, 1.0) * fl * exp(-dot(lf, lf) * 10.0) * smoothstep(0.2, 0.75, cloud) * 1.6;
    col = night * (1.0 - day);
  }
  if (day > 0.005) {                                  // day side
    vec3 sunC = mix(vec3(0.8, 0.52, 0.45), vec3(1.0, 0.95, 0.88), smoothstep(0.0, 0.3, muS)) * 2.3;      // low sun on the ground: dusty rose, not red (the clouds carry the gold)
    vec3 ocean = mix(vec3(0.011, 0.045, 0.16), vec3(0.025, 0.13, 0.3), smoothstep(uLand - 0.12, uLand, h));
    ocean = mix(ocean, vec3(0.03, 0.27, 0.34), 0.62 * smoothstep(uLand - 0.035, uLand, h));          // turquoise shallows along every coast
    vec3 landc = mix(vec3(0.1, 0.21, 0.065), vec3(0.45, 0.35, 0.19), smoothstep(uLand + 0.02, uLand + 0.16, h + (hd - 0.5) * 0.1));
    landc = mix(landc, vec3(0.62), smoothstep(uLand + 0.2, uLand + 0.28, h));
    vec3 surf = mix(ocean, landc, land);
    float dif = max(muS, 0.0) + 0.05;
    vec3 lit = surf * sunC * dif;
    // the sun's path on the sea: a faint sheen and a tight core, both broken into moving glitter; cloud hides it
    vec3 H = normalize(uSun + V);
    float ndh = max(dot(n, H), 0.0);
    float gl = 0.1 * pow(ndh, 90.0) + 1.3 * pow(ndh, 900.0);
    float sp = smoothstep(0.24, 0.42, texture2D(uTex, p * 2.1 + vec2(uTime * 0.021, 0.0)).a * texture2D(uTex, p.yx * 2.7 - vec2(0.0, uTime * 0.027)).a) * (0.4 + 1.2 * hd);
    lit += sunC * gl * sp * (1.0 - land) * (1.0 - cloud);
    // cloud: white tops, shaded where the cloud toward the sun is thicker, and a shadow laid on the ground behind it
    float clS = cloudAt(pc + uSunT * 0.05);
    float shadowCloud = smoothstep(uCloud, uCloud + 0.1, clS);
    lit *= 1.0 - 0.45 * shadowCloud;
    float shade = (0.5 + 0.5 * smoothstep(0.0, 0.25, cl - uCloud)) * (1.0 - 0.3 * smoothstep(0.0, 0.09, clS - cl));
    vec3 sunCc = mix(vec3(1.0, 0.6, 0.35), vec3(1.0, 0.97, 0.93), smoothstep(-0.02, 0.12, muS)) * 2.3;
    vec3 cc = sunCc * (max(muS + 0.04, 0.0) + 0.12) * shade;
    lit = mix(lit, cc, cloud);
    lit = mix(lit, uBlue * sunC * dif * 0.42, 0.16);                             // air over everything
    col += lit * day;
  }
  // air seen edge-on toward the limb: a deep blue haze band by day, red-gold on the terminator
  float ndv = 1.0 - max(dot(n, V), 0.0);
  float rim = pow(ndv, 6.0), rimD = ndv * ndv * ndv * ndv * ndv;
  col += uBlue * rimD * smoothstep(-0.1, 0.16, mu) * 1.05 + warmAir(mu) * rim * twilight(mu) * 1.3 * (1.0 - 0.75 * uDawn);      // once the sun is up the red haze leaves the ground
  col += uBlue * rim * 0.09;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- shaders: atmosphere shell (limb glow, airglow, aurora)
const ATM_FRAG = /* glsl */`
uniform vec3 uC; uniform mat3 uM; uniform float uTime; uniform float uR; uniform float uH;
uniform vec3 uPole; uniform vec3 uPoleA; uniform vec3 uPoleB; uniform vec4 uOval;   // radius rad, width rad, strength, second arc
uniform vec3 uAurLow; uniform vec3 uAurHigh; uniform float uGlow; uniform sampler2D uTex;
uniform float uArc; uniform float uHk; uniform float uAk;      // sunrise arc 0..1, limb thickness and aurora height multipliers
varying vec3 vW;
${GLSL_AIR}
// One horizontal slice of the curtains at relative height f (0 foot .. 1 top). The sheet is a thin bright core with a
// soft apron, it spreads as it climbs, and its rays are stripes in azimuth only, so they stand upright through the
// slices. Azimuth frequencies are whole numbers of turns: no seam.
float curtain(vec3 q, float f) {
  float ang = acos(clamp(dot(q, uPole), -1.0, 1.0));
  if (abs(ang - uOval.x + uOval.y * 2.0) > 0.075 + uOval.y * 9.0) return 0.0;     // nowhere near the oval: skip the noise
  float az = atan(dot(q, uPoleB), dot(q, uPoleA)) * 0.15915494;
  float wob = (texture2D(uTex, vec2(az * 3.0, uTime * 0.004)).r - 0.5) * 0.042 + (texture2D(uTex, vec2(az * 17.0 + 0.3, 0.5 - uTime * 0.007)).g - 0.5) * 0.013;
  float wd = uOval.y * (1.0 + 1.4 * f);
  float d = (ang - uOval.x - wob) / wd;
  float d2 = (ang - uOval.x - wob * 1.6 + uOval.y * 4.4) / (wd * 0.8);
  float band = exp(-d * d) + 0.15 * exp(-abs(d) * 0.75) + uOval.w * (exp(-d2 * d2) + 0.1 * exp(-abs(d2) * 0.8));
  if (band < 0.004) return 0.0;
  float ray = texture2D(uTex, vec2(az * 37.0 + uTime * 0.011, 0.37 + uTime * 0.0025)).a;
  float fold = texture2D(uTex, vec2(az * 8.0 - uTime * 0.006, 0.71)).g;
  return band * (0.28 + 1.15 * ray * (0.4 + 0.9 * fold)) * (0.86 + 0.14 * sin(uTime * 1.6 + az * 188.5));
}
void main() {
  vec3 oc = cameraPosition - uC; vec3 rd = normalize(vW - cameraPosition);
  float tca = -dot(oc, rd); float b2 = dot(oc, oc) - tca * tca; float b = sqrt(max(b2, 0.0));
  vec3 col = vec3(0.0);
  if (b > uR) {                                       // the ray misses the ground: limb glow
    float a = (b - uR) / (uH * uHk);
    vec3 nl = (oc + rd * tca) / b; float mu = dot(nl, uSun);
    float dens = exp(-a * mix(2.1, 1.45, uArc)), low = exp(-a * 6.5);
    float dayB = smoothstep(-0.13, 0.1, mu + a * 0.03);
    float fs = pow(max(dot(rd, uSun), 0.0), 10.0);
    // The sunrise arc. fa = how nearly this stretch of limb lies in the sun's compass direction. The lowest air burns:
    // white under the sun, gold to either side, red where it runs out along the limb; the blue stands above it.
    vec3 up = oc / max(length(oc), 1.0); vec3 rh = rd - up * dot(rd, up); vec3 sh = uSun - up * dot(uSun, up);
    float fa = max(dot(rh, sh) / max(length(rh) * length(sh), 1e-4), 0.0);
    float fa2 = fa * fa, fa4 = fa2 * fa2, fa16 = fa4 * fa4 * fa4 * fa4;
    float warmK = uArc * smoothstep(-0.07, 0.02, mu);
    float base = exp(-a * 3.0) * fa2 * warmK * (1.0 - 0.7 * smoothstep(0.12, 0.3, mu));      // the warm layer fades as morning comes on
    col += uBlue * dens * dayB * 1.25 * (1.0 + 1.2 * fs) * (1.0 - 0.8 * base);
    col += warmAir(mu) * low * twilight(mu) * 3.2 * (1.0 + 2.5 * fs);
    col += vec3(1.0, 0.9, 0.78) * low * smoothstep(-0.02, 0.2, mu) * 0.8 * (1.0 + 1.5 * fs) * (1.0 - 0.8 * base);
    col += uBlue * dens * smoothstep(-0.6, -0.08, mu) * (1.0 - dayB) * 1.3;       // pre-dawn blue
    float ag = (a - 0.95) / 0.2; col += vec3(0.05, 0.13, 0.08) * exp(-ag * ag) * (1.0 - dayB) * 2.4;   // airglow line
    vec3 hot = mix(vec3(1.0, 0.12, 0.03), vec3(1.0, 0.56, 0.16), smoothstep(0.55, 0.9, fa));
    col += hot * base * 2.6;
    col += vec3(1.0, 0.93, 0.8) * exp(-a * 2.0) * 2.2 * fa16 * warmK * smoothstep(0.0, 0.15, mu);
    col *= uGlow * (1.0 - smoothstep(0.72, 1.0, (b - uR) / (uH * ${ATM_TOP.toFixed(1)})));      // nothing left where the shell ends
  }
  if (uOval.z > 0.0) {                                // aurora: five slices of curtain between 0.6 and 2.3 scale heights
    for (int i = 0; i < 5; i++) {
      float f = float(i) * 0.25; float rr = uR + uH * uAk * (0.6 + 1.7 * f);
      float disc = rr * rr - b2;
      if (disc > 0.0) {
        float t = tca - sqrt(disc);
        if (t > 0.0) {
          vec3 nn = (oc + rd * t) / rr;
          float nightK = 1.0 - smoothstep(-0.2, 0.02, dot(nn, uSun));
          if (nightK > 0.01) col += mix(uAurLow, uAurHigh * 0.7, f * f) * curtain(uM * nn, f) * nightK * uOval.z * exp(-1.5 * f) * 0.56;   // bright foot, fading upward
        }
      }
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- shaders: the sky. No dome: the black of space costs
// nothing. Stars are points, the Milky Way is faint points and a few dozen big soft ones, sun and moon are billboards.
const STAR_VERT = /* glsl */`
attribute float aSize;
uniform float uPx; uniform float uTime; uniform vec2 uRot;
varying vec3 vC;
void main() {
  vec3 p = position; p.yz = vec2(uRot.x * p.y - uRot.y * p.z, uRot.y * p.y + uRot.x * p.z);      // the sky wheels up as the station rounds the Earth
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + p * 8800.0, 1.0);
  gl_PointSize = max(aSize * uPx, 1.5);
  vC = color * (aSize > 8.0 ? 1.0 : 0.9 + 0.1 * sin(uTime * (1.5 + aSize * 2.3) + position.x * 90.0));
}`;
const STAR_FRAG = /* glsl */`
varying vec3 vC;
void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); gl_FragColor = vec4(vC * exp(-d * 3.2) * (1.0 - smoothstep(0.7, 1.0, d)), 1.0); }`;
const DISC_VERT = /* glsl */`
uniform vec3 uDir; uniform float uDist; uniform float uHalf; varying vec2 vQ;
void main() { vQ = position.xy; vec4 mv = viewMatrix * vec4(cameraPosition + uDir * uDist, 1.0); mv.xy += position.xy * uHalf; gl_Position = projectionMatrix * mv; }`;
const SUN_FRAG = /* glsl */`
uniform vec3 uColor; uniform vec3 uP; uniform float uTime;       // uP: disc radius (fraction of the quad), disc radiance, glow
varying vec2 vQ;
void main() {
  float r = length(vQ), x = r / uP.x;
  float disc = (1.0 - smoothstep(0.92, 1.06, x)) * (0.6 + 0.4 * sqrt(max(1.0 - x * x, 0.0)));
  float w = max(1.0 - r, 0.0), w3 = w * w * w;
  // halo: every term carries w^2 or more, so it is exactly zero (with zero slope) at the edge of the quad
  float glow = exp(-max(x - 1.0, 0.0) / 0.9) * 1.5 * w + 0.4 * w3 / (0.05 + 14.0 * r) + 0.7 * w3 + 0.55 * exp(-r * 7.0) * w * w;
  // rays: six fine spikes and a fainter, slowly breathing set between them
  float an = atan(vQ.y, vQ.x);
  float ray = pow(abs(cos(an * 3.0 + 0.35)), 46.0) + 0.3 * pow(abs(cos(an * 6.0 + 1.2)), 24.0) * (0.75 + 0.25 * sin(uTime * 0.9 + an * 4.0))
    + 0.12 * (0.5 + 0.5 * sin(an * 23.0 + uTime * 0.6)) * (0.5 + 0.5 * sin(an * 9.0 - uTime * 0.43));
  glow += ray * (1.1 * exp(-r * 5.5) + 0.12) * w3 * smoothstep(0.6, 2.2, x);
  // Capped just under the bloom threshold (with the flare's streak on top): the post bloom blurs with truncated kernels,
  // and a source as hot and small as the sun came back as a grey disc with a hard, lumpy edge. The halo is all drawn here.
  gl_FragColor = vec4(min(uColor * (disc * uP.y + glow * uP.z * w), vec3(1.1)), 1.0);
}`;
// The corona the docking ring wears while the portal eclipses the sun: a billboard at the ring, streamers that drift and
// breathe, every term times w^2 so it ends without an edge.
const CORONA_VERT = /* glsl */`
uniform vec3 uPos; uniform float uHalf; varying vec2 vQ;
void main() { vQ = position.xy; vec4 mv = viewMatrix * vec4(uPos, 1.0); mv.xy += position.xy * uHalf; gl_Position = projectionMatrix * mv; }`;
const CORONA_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uI; uniform float uR0; uniform float uTime; varying vec2 vQ;
void main() {
  float r = length(vQ), w = max(1.0 - r, 0.0), x = max(r - uR0, 0.0), an = atan(vQ.y, vQ.x), t = uTime;
  float s1 = 0.5 + 0.5 * sin(an * 5.0 + 0.7 * sin(t * 0.31) + 1.0);
  float s2 = 0.5 + 0.5 * sin(an * 13.0 - t * 0.37 + 2.0 * sin(an * 3.0 + t * 0.17));
  float s3 = 0.5 + 0.5 * sin(an * 31.0 + t * 0.8 + 3.0 * sin(an * 4.0 - t * 0.23));
  float ray = s1 * s1 * s1 * 0.75 + s2 * s2 * 0.4 + s3 * 0.2;
  float glow = exp(-x * 8.0) * (0.4 + 0.95 * ray) + 0.6 * exp(-x * 20.0);
  gl_FragColor = vec4(uColor * 0.62 * (1.0 - exp(-glow * uI * w * w * 1.7)), 1.0);      // saturates softly below the bloom threshold (see SUN_FRAG)
}`;
const MOON_FRAG = /* glsl */`
uniform vec3 uL; uniform sampler2D uTex; varying vec2 vQ;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
  vec3 n = vec3(vQ, sqrt(1.0 - r2));
  float lit = smoothstep(-0.03, 0.14, dot(n, uL));
  float m = texture2D(uTex, vQ * 0.19 + 0.3).r * 0.7 + texture2D(uTex, vQ * 0.8).g * 0.3;
  vec3 alb = mix(vec3(0.42, 0.42, 0.44), vec3(0.95, 0.93, 0.88), smoothstep(0.35, 0.62, m));
  gl_FragColor = vec4(alb * (lit * 0.82 * (0.7 + 0.3 * n.z) + 0.012), 1.0);
}`;

function makeStars(rng, milkyPole) {
  const P = [], Cc = [], Sz = [], d = V3(), a = V3(), b = V3(), col = new THREE.Color();
  a.set(1, 0, 0).addScaledVector(milkyPole, -milkyPole.x).normalize(); b.crossVectors(milkyPole, a);
  const tints = ['#ffffff', '#cfdcff', '#aac4ff', '#fff1d8', '#ffd9a8', '#ffc08a'];
  const push = (dir, I, size, tint) => { col.set(tint); P.push(dir.x, dir.y, dir.z); Cc.push(col.r * I, col.g * I, col.b * I); Sz.push(size); };
  for (let i = 0; i < 2600; i++) {                                       // field stars
    const y = rng.range(-1, 1), ph = rng() * TAU, s = Math.sqrt(1 - y * y); d.set(s * Math.cos(ph), y, s * Math.sin(ph));
    const k = Math.pow(rng(), 7); push(d, 0.16 + 3.6 * k, 1.5 + 1.6 * k, rng.pick(tints));
  }
  const core = rng() * TAU;
  const band = (sigma) => { const lon = rng() * TAU, lat = rng.gauss() * sigma, c = Math.cos(lat); d.copy(a).multiplyScalar(Math.cos(lon) * c).addScaledVector(b, Math.sin(lon) * c).addScaledVector(milkyPole, Math.sin(lat)); return Math.cos(lon - core) * 0.5 + 0.5; };
  for (let i = 0; i < 5200; i++) { const k = band(0.13); if (rng() > 0.35 + 0.65 * k) continue; push(d, rng.range(0.1, 0.42), 1.5, rng.pick(tints)); }
  for (let i = 0; i < 220; i++) {                                        // the glow of unresolved stars
    const k = band(0.06); if (rng() > 0.25 + 0.75 * k) continue;
    push(d, rng.range(0.005, 0.009) * (0.5 + 1.1 * k), rng.range(40, 95), k > 0.75 ? '#e6dccf' : '#aab8e8');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(Sz, 1));
  const uniforms = { uPx: { value: 1 }, uTime: { value: 0 }, uRot: { value: new THREE.Vector2(1, 0) } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.renderOrder = -1; pts.name = 'stars';
  return { object: pts, uniforms };
}
function makeDisc(frag, uniforms, opaque) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial(opaque
    ? { uniforms, vertexShader: DISC_VERT, fragmentShader: frag }
    : { uniforms, vertexShader: DISC_VERT, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; return m;
}

// ---------------------------------------------------------------- shaders: meteors burning up over the night side
const METEOR_VERT = /* glsl */`
uniform vec3 uC; uniform float uTime; uniform float uR; uniform float uH;
attribute vec3 aDir; attribute vec3 aVel; attribute vec4 aParam;      // period, phase, track length (rad), brightness
varying vec2 vUv; varying float vI;
${fx.GLSL_HASH}
void main() {
  vUv = uv;
  float cyc = uTime / aParam.x + aParam.y, k = floor(cyc);
  float s = fract(cyc) * aParam.x / 1.3;
  float ra = hash12(vec2(k, aParam.y * 91.0)) * 6.2831853; float cr = cos(ra), sr = sin(ra);
  mat3 rot = mat3(cr, 0.0, -sr, 0.0, 1.0, 0.0, sr, 0.0, cr);
  vec3 d0 = rot * aDir, vel = rot * aVel;
  float sc = clamp(s, 0.0, 1.0);
  float tail = aParam.z * 0.55 * sin(3.14159265 * sc);
  float along = aParam.z * sc - (1.0 - uv.y) * tail;
  vec3 pw = uC + normalize(d0 + vel * along) * (uR + uH * (2.6 - 1.5 * sc));
  vec4 mv = viewMatrix * vec4(pw, 1.0);
  vec3 axv = normalize(mat3(viewMatrix) * vel);
  vec3 side = normalize(cross(axv, normalize(mv.xyz)));
  mv.xyz += side * position.x * max(1.6, -mv.z * 0.0022) * (0.35 + 0.65 * uv.y);
  vI = pow(sin(3.14159265 * sc), 0.6) * aParam.w;
  gl_Position = projectionMatrix * mv;
  if (s > 1.0 || vI < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const METEOR_FRAG = /* glsl */`
varying vec2 vUv; varying float vI;
void main() {
  float x = vUv.x * 2.0 - 1.0, y = vUv.y;
  float a = exp(-x * x * 6.0) * pow(y, 2.4) + exp(-(1.0 - y) * (1.0 - y) * 700.0 - x * x * 3.0) * 2.4;
  gl_FragColor = vec4(mix(vec3(1.0, 0.55, 0.2), vec3(0.85, 1.0, 0.95), pow(y, 2.5)) * a * vI * 3.2, 1.0);
}`;

// ---------------------------------------------------------------- small helpers
function keyed(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0])); }
  return keys[keys.length - 1][1];
}
const hash1 = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// one thruster puff every `every` seconds on average: returns 0..1 age of the current puff, or -1 when idle
function puffAge(time, rate, seed, prob = 0.42) { const x = time * rate + seed * 7.3, k = Math.floor(x); return hash1(k + seed * 31.7) < prob ? x - k : -1; }

// Tiling noise atlas for the planet and the aurora: r, g = fbm; b = ridged "webs"; a = fine grain. 384 x 384, mipmapped.
async function noiseAtlas(rng, pause, N = 384) {
  const table = (P) => { const a = new Float32Array(P * P); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const vn = (t, P, x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y); let fx = x - xi, fy = y - yi; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const x0 = xi % P, x1 = (xi + 1) % P, y0 = (yi % P) * P, y1 = ((yi + 1) % P) * P;
    return (t[y0 + x0] * (1 - fx) + t[y0 + x1] * fx) * (1 - fy) + (t[y1 + x0] * (1 - fx) + t[y1 + x1] * fx) * fy;
  };
  const per = [4, 8, 16, 32, 64], tr = per.map(table), tg = per.map(table), tb = [table(8), table(16)], ta = [table(64), table(128)];
  await pause();
  const f = new Float32Array(N * N * 4), lo = [9, 9, 9, 9], hi = [-9, -9, -9, -9];
  for (let y = 0, o = 0; y < N; y++) {
    if (y % 24 === 0 && y > 0) await pause();
    for (let x = 0; x < N; x++, o += 4) {
      const u = x / N, v = y / N; let r = 0, g = 0, a = 0.5;
      for (let k = 0; k < 5; k++) { r += a * vn(tr[k], per[k], u * per[k], v * per[k]); if (k < 4) g += a * vn(tg[k], per[k], u * per[k], v * per[k]); a *= 0.5; }
      const w = 0.65 * vn(tb[0], 8, u * 8, v * 8) + 0.35 * vn(tb[1], 16, u * 16, v * 16);
      f[o] = r; f[o + 1] = g; f[o + 2] = Math.pow(Math.max(0, 1 - Math.abs(w - 0.5) * 45), 1.5); f[o + 3] = 0.6 * vn(ta[0], 64, u * 64, v * 64) + 0.4 * vn(ta[1], 128, u * 128, v * 128);
      for (let c = 0; c < 4; c++) { if (f[o + c] < lo[c]) lo[c] = f[o + c]; if (f[o + c] > hi[c]) hi[c] = f[o + c]; }
    }
  }
  await pause();
  const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < d.length; i++) { const c = i & 3; d[i] = Math.round(255 * (f[i] - lo[c]) / (hi[c] - lo[c])); }
  await pause();
  const tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = 8;      // the ground is seen at a grazing angle all the way to the limb: without this the coarse mips show as blocks
  tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// spherical cap about +Y, centred on the origin (place the mesh at the planet centre)
function capGeometry(R, thetaMax, nr, ns) {
  const pos = new Float32Array((nr + 1) * (ns + 1) * 3), idx = [];
  let o = 0;
  for (let i = 0; i <= nr; i++) {
    const th = thetaMax * Math.pow(i / nr, 0.85), st = Math.sin(th), ct = Math.cos(th);
    for (let j = 0; j <= ns; j++) { const ph = (j / ns) * TAU; pos[o++] = R * st * Math.cos(ph); pos[o++] = R * ct; pos[o++] = R * st * Math.sin(ph); }
  }
  for (let i = 0; i < nr; i++) for (let j = 0; j < ns; j++) { const a = i * (ns + 1) + j, b = a + ns + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(V3(0, 0, 0), R * 1.01);
  return g;
}

// ---------------------------------------------------------------- the rest of the station (drawn with hero.material)
const T4 = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

// Fore truss from the hero's fore stub (z 150) out to L.zEnd: modules, tanks, radiators, node, dish, mast, wing booms.
async function buildFore(C, rng, L, pause) {
  const g = new K.Geo(), M = K.M, sty = K.sty;
  const paint = sty(M.PAINT, C.white), dark = sty(M.PAINT, C.white, 0, 0.5), metal = sty(M.METAL, C.metal, 0, 1.25), foil = sty(M.FOIL, C.gold);
  const win = sty(M.ROOMS, C.white, 1, 0.95), acc = sty(M.PAINT, C.accent, 0, 0.9), rad = sty(M.RADIATOR, C.white, 0, 1.1);
  const lampW = sty(M.GLOW, C.warm, 2.8), lampB = sty(M.GLOW, C.blue, 2.4);
  const beacons = [], spots = [];
  g.rnd = rng();
  K.truss(g, V3(0, 0, 150), V3(0, 0, L.zEnd), 11, 11.6, metal, 0.55, { roll: Math.PI / 4 });
  // work lights along the two chords that face the flight line
  for (let z = 172; z < L.zEnd - 8; z += 23.2) {
    const k = Math.round(z / 23.2);
    if (k % 2) K.cbox(g, 8.25, 0, z, 0.22, 0.22, 1.5, 0.06, k % 4 === 1 ? lampW : lampB); else K.cbox(g, 0, 8.25, z, 0.22, 0.22, 1.5, 0.06, lampW);
  }
  const nearWing = (z, pad) => L.wings.some((w) => Math.abs(z - w.z) < pad);
  // modules
  let z = L.zEnd - 30, guard = 0, lastKind = -1;
  while (z > 196 && guard++ < 60) {
    await pause();
    let kind = rng.int(0, 4); if (kind === lastKind) kind = (kind + 1) % 5;
    const len = rng.range(15, 26); g.rnd = rng();
    if (nearWing(z - len / 2, len / 2 + 15)) { z -= 12; continue; }
    lastKind = kind;
    const zc = z - len / 2;
    if (kind === 0 || kind === 4) {                         // pressurised modules strapped alongside
      const n = kind === 4 ? 2 : 1, a0 = rng.range(0, TAU);
      for (let i = 0; i < n; i++) {
        const r = rng.range(4.4, 6.4), a = a0 + i * Math.PI + rng.range(-0.4, 0.4), off = 7.6 + r;
        g.push(K.rotZ(a).multiply(T4(off, 0, zc)));
        const mst = rng.chance(0.55) ? foil : sty(M.PAINT, C.white, 0, rng.range(0.7, 1.05));
        K.capsule(g, r, -len / 2, len / 2, mst, 18, 0.55);
        for (const zz of [-len * 0.28, len * 0.28]) K.lathe(g, [[r + 0.3, zz - 0.5], [r + 0.3, zz + 0.5]], metal, { n: 18 });
        if (rng.chance(0.75)) K.lathe(g, [[r + 0.08, -2.6], [r + 0.08, 2.6]], win, { n: 18 });
        K.tube(g, V3(-r - 1.6, 0, 0), V3(-r + 0.3, 0, 0), 1.3, 1.3, 8, metal);
        g.pop();
        spots.push(V3(Math.cos(a) * (off + r), Math.sin(a) * (off + r), zc));
      }
    } else if (kind === 1) {                                // tank cluster
      const r = rng.range(3.0, 3.8);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        g.push(T4(Math.cos(a) * (8.4 + r), Math.sin(a) * (8.4 + r), zc));
        K.capsule(g, r, -r, r, k % 2 ? foil : sty(M.PAINT, C.white, 0, 0.95), 14, 1); g.pop();
      }
      K.lathe(g, [[8.6 + r, zc - 0.5], [8.6 + r, zc + 0.5]], metal, { n: 4, a0: 0, a1: TAU });
    } else if (kind === 2) {                                // node wrapped round the truss, with a window band
      const hl = len / 2, r0 = rng.range(12.5, 14.5);
      g.push(T4(0, 0, zc));
      K.lathe(g, [[8.5, -hl], [r0 - 1.5, -hl], [r0, -hl + 2.2], [r0, -3.2], [r0 + 0.1, -3.2], [r0 + 0.1, 3.2], [r0, 3.2], [r0, hl - 2.2], [r0 - 1.5, hl], [8.5, hl]],
        [dark, paint, rng.chance(0.5) ? foil : paint, dark, win, dark, paint, acc, dark], { n: 36 });
      g.pop();
      for (const sg of [-1, 1]) beacons.push({ p: V3(sg * (r0 + 0.6), 0, zc), c: C.blue, s: 1.5, ph: zc, rate: 0 });
    } else {                                                // radiator pair, edge-on to the sun
      for (const sg of [-1, 1]) {
        K.plate(g, V3(sg * 0.6, sg * 8.5, zc - 7), V3(0, sg * 34, 0), V3(0, 0, 14), rad);
        K.tube(g, V3(0, sg * 7, zc), V3(0, sg * 43.5, zc), 0.45, 0.3, 5, metal);
        beacons.push({ p: V3(0, sg * 44.5, zc), c: C.amber, s: 1.6, ph: zc * 0.3, rate: 0 });
      }
    }
    z -= len + rng.range(12, 34);
  }
  await pause();
  // end node, mast with a strobe, dish
  const ze = L.zEnd;
  g.push(T4(0, 0, ze + 7)); g.rnd = rng(); K.capsule(g, 7.4, -8, 8, paint, 20, 0.7); K.lathe(g, [[7.5, -1], [7.5, 1]], acc, { n: 20 }); K.lathe(g, [[7.48, -5], [7.48, -2.4]], win, { n: 20 }); g.pop();
  K.tube(g, V3(0, 6, ze + 7), V3(0, 34, ze + 7), 0.5, 0.2, 5, metal);
  beacons.push({ p: V3(0, 34.6, ze + 7), c: C.white1, s: 3.2, ph: 0.4, rate: 2.2 });
  if (L.dish) {
    K.tube(g, V3(-5, -3, ze), V3(-20, -12, ze - 4), 0.5, 0.35, 5, metal);
    g.push(T4(-20, -12, ze - 4).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 + 0.5)).multiply(new THREE.Matrix4().makeRotationY(-0.5)));
    K.lathe(g, [[0.3, 0], [2.2, 0.2], [4.2, 0.8], [6.2, 1.75], [8, 2.9]], sty(M.RADIATOR, C.white, 0, 1.05), { n: 24 });
    K.lathe(g, [[8, 2.9], [8.25, 3.0], [8.25, 2.6]], metal, { n: 24 });
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; K.tube(g, V3(Math.cos(a) * 6, Math.sin(a) * 6, 1.6), V3(0, 0, 6.2), 0.12, 0.12, 3, metal); }
    g.pop();
  }
  await pause();
  // wing booms (the blankets are separate meshes that turn about the boom), root collars, marker lights
  for (const w of L.wings) {
    g.rnd = rng();
    K.tube(g, V3(-w.span - 1, 0, w.z), V3(w.span + 1, 0, w.z), 0.7, 0.7, 8, metal, { cap: true });
    g.push(T4(0, 0, w.z)); K.lathe(g, [[8.4, -2.2], [9.6, -1.4], [9.6, 1.4], [8.4, 2.2]], [paint, acc, paint], { n: 20 }); g.pop();
    for (const sg of [-1, 1]) {
      beacons.push({ p: V3(sg * (w.span + 2), 0, w.z), c: C.red, s: 3.0, ph: w.z * 0.1 + sg, rate: 2.0 });
      for (let x = 16; x < w.span; x += 38) beacons.push({ p: V3(sg * x, 1.1, w.z), c: (x / 38 | 0) % 2 ? C.blue : C.warm, s: 1.25, ph: x, rate: 0 });
    }
  }
  await pause();
  return { geometry: await g.buildAsync(pause), beacons, spots, tris: g.tris };
}

// Solar blankets of one wing pair, centred on the boom (local X), flat in local XZ.
function wingGeometry(C, span, rnd) {
  const g = new K.Geo(), M = K.M, metal = K.sty(M.METAL, C.metal, 0, 1.25), solar = K.sty(M.SOLAR, C.solar);
  const lamps = [K.sty(M.GLOW, C.blue, 3.2), K.sty(M.GLOW, C.warm, 3.2)];
  g.rnd = rnd;
  const pl = 34, gap = 4, hw = 11.5;
  for (const sg of [-1, 1]) {
    let x0 = 18;
    while (x0 + pl <= span + 0.5) {
      for (const zs of [-1, 1]) K.plate(g, V3(sg * x0, 0, zs * 0.95), V3(sg * pl, 0, 0), V3(0, 0, zs * (hw - 0.95)), solar);
      K.tube(g, V3(sg * x0, 0, -hw), V3(sg * x0, 0, hw), 0.2, 0.2, 3, metal);
      K.tube(g, V3(sg * (x0 + pl), 0, -hw), V3(sg * (x0 + pl), 0, hw), 0.2, 0.2, 3, metal);
      for (const zs of [-1, 1]) K.tube(g, V3(sg * x0, 0, zs * hw), V3(sg * (x0 + pl), 0, zs * hw), 0.12, 0.12, 3, metal);
      for (const zs of [-1, 1]) for (const xx of [x0, x0 + pl]) K.cbox(g, sg * xx, 0.1, zs * hw, 0.28, 0.14, 0.28, 0.05, lamps[zs > 0 ? 0 : 1]);
      x0 += pl + gap;
    }
  }
  return g.build();
}

// A spacewalker, 1.95 m, feet at the origin, +Y up, facing +Z.
function walkerGeometry(C) {
  const g = new K.Geo(), M = K.M, white = K.sty(M.PAINT, C.white, 0, 1.3), foil = K.sty(M.FOIL, C.gold), acc = K.sty(M.PAINT, C.accent, 0, 1.1);
  g.rnd = 0.37;
  K.cbox(g, 0, 1.25, 0, 0.3, 0.38, 0.2, 0.08, white);
  K.cbox(g, 0, 1.3, -0.36, 0.28, 0.44, 0.16, 0.06, white);
  K.cbox(g, 0, 1.0, 0.0, 0.31, 0.06, 0.21, 0.02, acc);
  g.push(T4(0, 1.74, 0)); K.capsule(g, 0.25, -0.25, 0.25, white, 8, 1); g.pop();
  K.cbox(g, 0, 1.76, 0.2, 0.17, 0.12, 0.07, 0.04, foil);
  for (const sg of [-1, 1]) {
    K.tube(g, V3(sg * 0.15, 0.9, 0), V3(sg * 0.2, 0.04, 0.12), 0.14, 0.11, 5, white, { cap: true });
    K.tube(g, V3(sg * 0.38, 1.52, 0), V3(sg * 0.52, 1.08, 0.36), 0.1, 0.09, 5, white, { cap: true });
  }
  return g.build();
}

// A station-keeping tug, about 14 m, nose toward -Z. Returns the geometry and where its lights and thrusters are.
function tugGeometry(C, rng) {
  const g = new K.Geo(), M = K.M, sty = K.sty;
  const paint = sty(M.PAINT, C.white, 0, 1.05), metal = sty(M.METAL, C.metal, 0, 1.3), foil = sty(M.FOIL, C.gold), solar = sty(M.SOLAR, C.solar);
  const golden = rng.chance(0.5);
  g.rnd = rng();
  K.capsule(g, 2.4, -6.5, 2.6, golden ? foil : paint, 16, 0.75);
  K.lathe(g, [[2.55, -0.8], [2.55, 1.6]], golden ? paint : foil, { n: 16 });
  K.lathe(g, [[2.46, -4.2], [2.46, -3.6]], sty(M.GLOW, C.warm, 2.6), { n: 10, a0: -0.9, a1: 0.9 });
  K.lathe(g, [[0.7, 2.4], [1.8, 5.0]], metal, { n: 12 });
  K.tube(g, V3(0, 0, -6.4), V3(0, 0, -8.2), 0.55, 0.38, 8, metal, { cap: true });
  for (const sg of [-1, 1]) {
    K.tube(g, V3(sg * 2.3, 0, 0.4), V3(sg * 3.4, 0, 0.4), 0.14, 0.14, 4, metal);
    K.plate(g, V3(sg * 3.4, -1.5, 0.4), V3(sg * 8.5, 0, 0), V3(0, 3, 0), solar);
    K.cbox(g, 0, sg * 2.75, -1.6, 0.9, 0.55, 1.8, 0.15, sg > 0 ? paint : sty(M.PAINT, C.accent, 0, 0.95));
  }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; K.cbox(g, Math.cos(a) * 2.5, Math.sin(a) * 2.5, 1.9, 0.28, 0.28, 0.4, 0.06, metal); }
  return { geometry: g.build(), nav: [V3(11.9, 0, 0.4), V3(-11.9, 0, 0.4), V3(0, 3.5, -1.6)], jets: [V3(3.1, 0, 2.2), V3(-3.1, 0, 2.2), V3(0, -3.1, 2.2)] };
}

function meteorMesh(rng, center, count) {
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const D = new Float32Array(count * 3), V = new Float32Array(count * 3), P = new Float32Array(count * 4), d = V3(), v = V3();
  for (let i = 0; i < count; i++) {
    const th = rng.range(4, 21) * DEG, a = rng() * TAU;
    d.set(Math.sin(th) * Math.cos(a), Math.cos(th), Math.sin(th) * Math.sin(a));
    v.set(rng() - 0.5, 0, rng() - 0.5); v.addScaledVector(d, -v.dot(d)).normalize();
    D.set([d.x, d.y, d.z], i * 3); V.set([v.x, v.y, v.z], i * 3);
    P.set([rng.range(6, 17), rng(), rng.range(0.03, 0.07), rng.range(0.55, 1)], i * 4);
  }
  g.setAttribute('aDir', new THREE.InstancedBufferAttribute(D, 3)); g.setAttribute('aVel', new THREE.InstancedBufferAttribute(V, 3)); g.setAttribute('aParam', new THREE.InstancedBufferAttribute(P, 4));
  g.instanceCount = count;
  const uniforms = { uC: { value: center }, uTime: { value: 0 }, uR: { value: R_EARTH }, uH: { value: H_ATM } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: METEOR_VERT, fragmentShader: METEOR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'orbit-dawn', name: 'Orbital Sunrise', category: 'sky', weirdness: 0.25,
  async build(ctx) {
    const rng = ctx.rng;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const time = { value: 0 };

    // ---- per-seed design
    const D = {
      sunAz: rng.range(-8, 8) * DEG,                        // where on the limb the sun comes up; it swings onto the axis
      dawnShift: rng.range(-0.02, 0.02),                    // sunrise a little early or late
      period: rng.range(52, 64),                            // wheel, seconds per turn
      earthSpin: rng.range(0.36, 0.5) * DEG,                // ground slides beneath, rad/s
      incl: rng.range(-0.35, 0.35),                         // heading of the ground track
      cloud: rng.range(0.5, 0.58), land: rng.range(0.45, 0.51), pop: rng.range(0.7, 1.0), storm: rng.range(0.35, 1.5),
      auroraR: rng.range(0.12, 0.16), auroraW: rng.range(0.0045, 0.0075), auroraI: rng.range(0.5, 0.66), aurora2: rng.chance(0.6) ? rng.range(0.35, 0.7) : 0,
      auroraSide: rng.range(-0.16, 0.16), auroraHigh: rng.pick(['#c040ff', '#ff3a6a', '#5a6cff']), auroraLow: rng.pick(['#30ff7a', '#30ff7a', '#4affc0']),
      blue: new THREE.Color(PALETTE[2]).offsetHSL(rng.range(-0.035, 0.02), 0, 0),
      city: new THREE.Color(rng.pick(['#ffb040', '#ffc070', '#ffa030'])),
      wing3: rng.chance(0.5), wingBz: rng.range(610, 640), wingBspan: rng.pick([134, 172]), dish: rng.chance(0.7),
      tug: rng.chance(0.8), tug2: rng.chance(0.75), sats: rng.int(2, 5), flecks: rng.range(0.6, 1.5), meteors: rng.int(5, 9),
      spare: rng(), moonEl: rng.range(9, 30), moonAz: rng.sign() * rng.range(20, 52), moonPhase: rng.range(0.25, 0.85),
      entryX: rng.range(36, 52), entryY: rng.range(50, 62),
    };

    // ---- sky: black, hard stars, the Milky Way, a moon; the sun billboard is driven along its arc in update()
    const atlas = await noiseAtlas(rng.fork('atlas'), () => ctx.yield());
    const milkyPole = V3(rng.range(-1, 1), rng.range(0.2, 1), rng.range(-0.4, 0.4)).normalize();
    const stars = makeStars(rng.fork('stars'), milkyPole); scene.add(stars.object);
    await ctx.yield();
    const sunDir = V3(0, -0.5, -0.86).normalize();
    const sunU = { uDir: { value: sunDir }, uDist: { value: 8600 }, uHalf: { value: Math.tan(14 * DEG) * 8600 }, uColor: { value: new THREE.Color(1, 1, 1) }, uP: { value: V3(0.9 / 14, 4, 0.5) }, uTime: time };
    const sunDisc = makeDisc(SUN_FRAG, sunU, false); sunDisc.renderOrder = 0.5; sunDisc.name = 'sun'; scene.add(sunDisc);
    const moonDir = V3(0, 0.1, -1).normalize(), moon0 = V3();      // aimed once the path is known (see below); it rises with the sky
    const mp = lerp(2.3, 0.8, D.moonPhase), ma = rng.range(-1.2, 1.2) - Math.PI / 2;
    const moon = makeDisc(MOON_FRAG, { uDir: { value: moonDir }, uDist: { value: 8500 }, uHalf: { value: Math.tan(1.45 * DEG) * 8500 }, uTex: { value: atlas },
      uL: { value: V3(Math.cos(ma) * Math.sin(mp), Math.sin(ma) * Math.sin(mp), Math.cos(mp)) } }, true);
    moon.name = 'moon'; scene.add(moon);
    const bufSize = new THREE.Vector2();
    const MOON_LIGHT = new THREE.Color(0.075, 0.095, 0.15);
    await ctx.yield();

    // ---- hero: the wheel, hub at the origin. Its own steering is off: the phase is steered here from u.
    const hero = await buildHero(ctx, { palette: PALETTE, hubAtOrigin: true, period: D.period, steer: false, sunrise: 0 });
    scene.add(hero.object);
    const A = hero.anchors, C = hero.colors, seat = A.portalSeat;
    hero.uniforms.uFill.value = 0.1; hero.uniforms.uMoonCol.value.copy(MOON_LIGHT);
    // the hull's night fill: moonlit sky and earthshine from above and behind the camera's side, so the faces it sees are not holes
    hero.uniforms.uMoonDir.value.set(Math.sign(D.moonAz) * 0.4, 0.55, 0.72).normalize();
    await ctx.yield();

    // ---- path: in above the fore truss, down over a solar wing, through the wheel, along the spindle into the dock
    const pts = [V3(D.entryX, D.entryY, 790), V3(D.entryX + 18, D.entryY - 11, 700), V3(96, 26, 588), ...A.flyThrough.map((p) => p.clone())];
    const path = makePath(pts);
    const duration = 48;
    let uCross = 0.67;
    { let lo = 0.3, hi = 0.9; const p = V3(); for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, p).z > 0) lo = m; else hi = m; } uCross = (lo + hi) / 2; }
    const crossPt = path.pointAt(uCross), crossAng = Math.atan2(crossPt.y, crossPt.x);
    // The moon hangs low inside the wheel, a few degrees off the entry heading: the previous world's portal shows only a
    // narrow level cone along that heading, and this puts a bright crescent, the spokes crossing it and the lit rim in it.
    {
      const t0 = path.tangentAt(0), yaw0 = Math.atan2(t0.x, -t0.z);
      const az = yaw0 + (-5 + 6.5 * (Math.abs(D.moonAz) - 20) / 32) * DEG, el = (2 + 4.5 * (D.moonEl - 9) / 21) * DEG;
      moon0.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); moonDir.copy(moon0);
    }

    // ---- the Earth
    const EC = V3(0, -(R_EARTH + 400), 180);
    const earthAxis = V3(Math.cos(D.incl), 0, Math.sin(D.incl)), axU = V3(0, 1, 0), axV = V3().crossVectors(earthAxis, axU).normalize();
    const uM = new THREE.Matrix3(), m4 = new THREE.Matrix4(), spin = new THREE.Vector2();
    const earthFrame = (out, axis, ang) => out.setFromMatrix4(m4.makeRotationAxis(axis, -ang));
    const planetU = {
      uC: { value: EC }, uTex: { value: atlas }, uAxis: { value: earthAxis }, uAxU: { value: axU }, uAxV: { value: axV }, uSpin: { value: spin },
      uTime: time, uSun: { value: sunDir }, uBlue: { value: D.blue }, uOff: { value: new THREE.Vector2(rng.range(-40, 40), rng.range(-40, 40)) }, uCity: { value: D.city },
      uCloud: { value: D.cloud }, uPop: { value: D.pop }, uStorm: { value: D.storm }, uLand: { value: D.land },
      uLift: { value: 0 }, uSunT: { value: new THREE.Vector2(0, -1) }, uDawn: { value: 0 },
    };
    await ctx.yield();
    const planet = new THREE.Mesh(capGeometry(R_EARTH * 1.0006, 34 * DEG, 44, 176), new THREE.ShaderMaterial({ uniforms: planetU, vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG }));
    planet.position.copy(EC); planet.frustumCulled = false; planet.name = 'earth'; scene.add(planet);
    // aurora oval: fixed to the ground, placed so that it lies ahead on entry and slides beneath before dawn
    const refAng = D.earthSpin * 14;
    const poleW = V3(D.auroraSide, 0, -Math.sin(9 * DEG)); poleW.y = Math.sqrt(1 - poleW.x * poleW.x - poleW.z * poleW.z);
    const pole = poleW.clone().applyMatrix3(earthFrame(uM, earthAxis, refAng));
    const poleA = V3(1, 0, 0).addScaledVector(pole, -pole.x).normalize(), poleB = V3().crossVectors(pole, poleA);
    const atmU = {
      uC: { value: EC }, uM: { value: uM }, uTime: time, uR: { value: R_EARTH }, uH: { value: H_ATM }, uSun: { value: sunDir }, uBlue: { value: D.blue },
      uPole: { value: pole }, uPoleA: { value: poleA }, uPoleB: { value: poleB }, uOval: { value: new THREE.Vector4(D.auroraR, D.auroraW, D.auroraI, D.aurora2) },
      uAurLow: { value: new THREE.Color(D.auroraLow) }, uAurHigh: { value: new THREE.Color(D.auroraHigh) }, uGlow: { value: 1 }, uTex: { value: atlas },
      uArc: { value: 0 }, uHk: { value: 1 }, uAk: { value: 1 },
    };
    const air = new THREE.Mesh(capGeometry(R_EARTH + H_ATM * ATM_TOP, 35 * DEG, 40, 176), new THREE.ShaderMaterial({
      uniforms: atmU, vertexShader: PLANET_VERT, fragmentShader: ATM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    air.position.copy(EC); air.frustumCulled = false; air.renderOrder = 0; air.name = 'air'; scene.add(air);
    const meteors = meteorMesh(rng.fork('meteors'), EC, D.meteors); scene.add(meteors.mesh);
    await ctx.yield();

    // ---- the rest of the station: fore truss, tracking wings, beacons
    const L = { zEnd: 742, dish: D.dish, wings: [{ z: 460, span: 172 }, { z: D.wingBz, span: D.wingBspan }] };
    if (D.wing3) L.wings.push({ z: rng.range(292, 316), span: 96 });
    const fore = await buildFore(C, rng.fork('fore'), L, () => ctx.yield());
    await ctx.yield();
    const foreMesh = new THREE.Mesh(fore.geometry, hero.material); foreMesh.name = 'fore'; hero.addPrepass(foreMesh); scene.add(foreMesh);
    await ctx.yield();
    for (const w of L.wings) {
      await ctx.yield();
      w.mesh = new THREE.Mesh(wingGeometry(C, w.span, rng()), hero.material); w.mesh.position.set(0, 0, w.z);
      w.night = rng.range(-0.13, 0.13); w.ph = rng() * TAU; scene.add(w.mesh);
    }
    // guide lights down the aft truss, on the chord facing the flight line: a pulse runs along them toward the dock
    for (let z = -106, k = 0; z > -344; z -= 17, k++) fore.beacons.push({ p: V3(8.7, 0, z), c: k % 3 === 0 ? C.amber : C.white1, s: 1.5, ph: z * 0.06, rate: 1.9 });
    const beacons = makeBeacons(fore.beacons); scene.add(beacons.object);
    await ctx.yield();

    // ---- spacewalkers: one on the boom of the wing the camera glides over, one on a module (or the truss)
    const walkerGeo = walkerGeometry(C), Y = V3(0, 1, 0);
    const walkers = [];
    {
      const a = new THREE.Mesh(walkerGeo, hero.material);
      walkers.push({ mesh: a, base: V3(54, 0.7, 460), up: V3(0, 1, 0), along: V3(1, 0, 0), range: 7, rate: 0.05, ph: rng() * TAU });
      let spot = null, best = -1e9;
      for (const s of fore.spots) { const sc = (s.x + s.y) / Math.hypot(s.x, s.y) - Math.abs(s.z - 560) * 0.004; if (s.z > 330 && sc > best) { best = sc; spot = s; } }
      if (!spot) spot = V3(0, 8.4, 560);
      const up = V3(spot.x, spot.y, 0).normalize();
      walkers.push({ mesh: new THREE.Mesh(walkerGeo, hero.material), base: spot.clone(), up, along: V3(0, 0, 1), range: 4, rate: 0.037, ph: rng() * TAU });
      // and one at work on the aft spindle, on the chord that faces the flight line
      let za = -250; for (const wz of A.solarWings) if (Math.abs(za - wz.z) < 24) za = wz.z + 26;
      if (Math.abs(za - A.gantry.position.z) < 14) za = A.gantry.position.z + 22;      // clear of the approach gate's struts
      walkers.push({ mesh: new THREE.Mesh(walkerGeo, hero.material), base: V3(8.36, 0, za), up: V3(1, 0, 0), along: V3(0, 0, 1), range: 8, rate: 0.19, ph: rng() * TAU });
      for (const w of walkers) { w.q0 = new THREE.Quaternion().setFromUnitVectors(Y, w.up); scene.add(w.mesh); }
    }

    // ---- craft holding station: a tug off the starboard wing, and usually another waiting off the aft dock
    const tugs = [];
    {
      const tg = tugGeometry(C, rng.fork('tug'));
      const add = (base, amp, yaw) => { const mesh = new THREE.Mesh(tg.geometry, hero.material); scene.add(mesh); tugs.push({ nav: tg.nav, jets: tg.jets, mesh, base, amp, yaw, ph: rng() * TAU }); };
      if (D.tug) add(V3(rng.range(168, 188), rng.range(-34, -14), rng.range(250, 330)), V3(9, 6, 26), rng.range(-0.5, 0.5));
      add(V3(rng.range(66, 84), rng.range(-26, 30), rng.range(-330, -262)), V3(6, 5, 14), Math.PI + rng.range(-0.6, 0.6));
      const aft = tugs[tugs.length - 1];
      aft.closing = D.tug2 ? rng.range(30, 46) : -rng.range(10, 20);          // it eases in toward the flight line (or, negative, off from it) over the last third
      aft.busy = true;
      // The close pass of the approach: the tug works its way down to the dock just off the flight line, low on the right,
      // and the camera overtakes it about 30 m away around u 0.82. Its run is keyed to u (aft.run), its bobbing is small.
      aft.base.set(57 + (aft.base.x - 66) / 18 * 4, -23 + (aft.base.y + 26) / 56 * 4, -158); aft.amp.set(2.5, 2.2, 4); aft.run = 40;      // stays clear of the approach gate
      // a ferry under way below and behind the dock: it crosses the day side as the camera runs down the spindle
      add(V3(-270, -64, -520), V3(0, 3, 0), 0);
      const ferry = tugs[tugs.length - 1]; ferry.dir = V3(0.943, 0.047, 0.33).normalize(); ferry.busy = true;
      ferry.yaw = Math.atan2(-ferry.dir.x, -ferry.dir.z);
    }

    await ctx.yield();
    // ---- small lights that move: helmet lamps, shuttle puffs, tug lights and thruster puffs, satellites (one draw call)
    const G = { lamp: 0, shuttle: 3, tug: 5, sat: 5 + 6 * tugs.length };
    const nG = G.sat + D.sats, gp = [], gc = [], gs = [];
    for (let i = 0; i < nG; i++) { gp.push([0, 0, 900]); gc.push('#bcd8ff'); gs.push(0); }
    gc[0] = gc[1] = gc[2] = '#dff0ff';
    for (let k = 0; k < tugs.length; k++) { const o = G.tug + 6 * k; gc[o] = '#ff3020'; gc[o + 1] = '#30ff60'; gc[o + 2] = '#ffffff'; }
    const sats = [];
    for (let i = 0; i < D.sats; i++) {
      gc[G.sat + i] = rng.pick(['#ffffff', '#ffe9c4', '#cfe4ff']);
      const a = V3(rng.range(-1800, 1800), rng.range(-150, 1100), rng.range(-2600, -1200)), d = V3(rng.sign() * rng.range(0.7, 1), rng.range(-0.25, 0.25), rng.range(-0.4, 0.4)).normalize();
      sats.push({ a, d, speed: rng.range(28, 70), span: rng.range(2200, 3600), off: rng() * 4000, size: rng.range(5, 9) * 0.55, blink: rng.chance(0.4) ? rng.range(1.5, 3) : 0 });
    }
    const glows = fx.makeGlows({ rng: rng.fork('glows'), time, positions: gp, colors: gc, sizes: gs, size: 1, intensity: 2.4, minAngle: 0.0045, fog: false });
    scene.add(glows.object);
    await ctx.yield();

    // ---- ice flecks drifting round the station (they light up when the sun reaches them)
    const flecks = fx.makeParticles({
      rng: rng.fork('ice'), preset: 'dust', count: Math.round(1400 * D.flecks), box: [150, 90, 170], velocity: [1.4, -0.4, 3.2], velocityRandom: [1.6, 1.0, 1.6],
      turbulence: [0, 0, 0], size: [0.06, 0.22], colors: ['#ffffff', '#cfe4ff', '#ffe9c4'], intensity: 4, twinkle: 0.7, minAngle: 0.003, near: [1.5, 6], fog: false, time });
    scene.add(flecks.object);
    await ctx.yield();
    // and a stream of it shed by the aft tanks, running back along the spindle past the camera on the way to the dock
    const stream = fx.makeParticles({
      rng: rng.fork('ice2'), preset: 'dust', count: Math.round(2400 * D.flecks), follow: false, center: [36, 0, -235], box: [84, 56, 330], velocity: [-0.5, 0.4, 7.5], velocityRandom: [1.4, 1.2, 3.5],
      turbulence: [0, 0, 0], size: [0.12, 0.5], colors: ['#ffffff', '#cfe4ff', '#ffe9c4'], intensity: 5.5, twinkle: 0.8, minAngle: 0.0042, near: [1.5, 6], fog: false, time });
    scene.add(stream.object);
    await ctx.yield();

    // ---- the sun's flare, and the corona the portal wears while it eclipses the sun
    const flare = fx.makeFlare({ rng: rng.fork('flare'), sunDir: [0, -0.5, -0.86], size: 0.36, ghosts: 6, streak: true, color: '#fff2dc', intensity: 1.1 });
    {   // the sun ends up near the screen centre, where the kit's ghosts pile onto it: big hard-edged hexagons there read
        // as a box round the sun, so large ghosts become soft discs and all of them a little fainter
      // (rings and hexagons stacked there drew a lumpy polygon round it). So: every ghost is a small soft disc, the kit's
      // burst is shrunk to a faint core, and only the streak is kept at full size. The halo and rays are in SUN_FRAG.
      const ag = flare.object.geometry.attributes.aGhost;
      if (ag) {
        for (let i = 0; i < ag.count; i++) {
          if (ag.getX(i) > 0.01) { ag.setZ(i, 0); ag.setY(i, Math.min(ag.getY(i), 0.065)); ag.setW(i, ag.getW(i) * 0.55); }
          else if (ag.getZ(i) < 3.5) { ag.setY(i, 0.13); ag.setW(i, 0.12); }
        }
        ag.needsUpdate = true;
      }
    }
    scene.add(flare.object);
    const coronaU = { uPos: { value: V3(seat.position.x, seat.position.y, seat.position.z - 5) }, uHalf: { value: 64 }, uR0: { value: (seat.radius + 3.4) / 64 }, uColor: { value: new THREE.Color('#ffe6c4') }, uI: { value: 0 }, uTime: time };
    const corona = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: coronaU, vertexShader: CORONA_VERT, fragmentShader: CORONA_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    corona.frustumCulled = false; corona.renderOrder = 1; corona.name = 'corona'; scene.add(corona);
    await ctx.yield();

    // ---- per-frame state
    const SR = 0.0157;                                      // angular radius of the sun
    const auroraLow = atmU.uAurLow.value;
    const sunAt = (u, out) => {
      const el = keyed(SUN_KEYS, u - D.dawnShift * (1 - smoothstep(0.6, 0.72, u))) * DEG, az = D.sunAz * (1 - smoothstep(0.46, 0.72, u));
      return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    };
    const oc = V3(), upC = V3(), toP = V3(), tmp = V3(), camP = V3(), poiSun = V3(), poiDir = V3(), cp = V3(), cx = V3(), cy = V3(), cz = V3();
    const sunCol = new THREE.Color(), heroCol = new THREE.Color(), shine = new THREE.Color(), puffCol = new THREE.Color(), qa = new THREE.Quaternion();
    const RED = new THREE.Color(1.0, 0.2, 0.05), GOLD = new THREE.Color(1.0, 0.62, 0.25), WHITE = new THREE.Color(1.0, 0.96, 0.9);
    const omega = TAU / D.period, pitch = TAU / 8, spinDir = hero.params.spinDir, phase0 = rng() * TAU;
    const steer = { rate: 1 / duration, prevU: -1, e: 0, corr: 0, has: false, frozen: null };
    const shuttleR = A.shuttle ? V3(A.shuttle.x, A.shuttle.y, 0).normalize() : null;

    function wheelPhase(dt, t, u) {
      if (dt > 1e-4 && steer.prevU >= 0 && u > steer.prevU && u - steer.prevU < 0.02) steer.rate = lerp(steer.rate, clamp((u - steer.prevU) / dt, 0.2 / duration, 5 / duration), 0.08);
      if (u < steer.prevU - 0.2) { steer.has = false; steer.frozen = null; steer.rate = 1 / duration; }      // a new visit
      const moved = u !== steer.prevU;
      steer.prevU = u;
      const base = phase0 + spinDir * omega * t;
      // The correction is only re-aimed while the camera is actually advancing. A camera held still (or the world seen
      // through a portal) leaves the wheel turning freely on time.
      if (moved || !steer.has) {
        let e;
        if (u > uCross && steer.frozen !== null) e = steer.frozen;
        else {
          // free-running phase the wheel would have when the camera reaches its plane; aim it at mid-gap
          e = crossAng - pitch / 2 - (base + spinDir * omega * (uCross - u) / steer.rate);
          e -= Math.round(e / pitch) * pitch;
          if (steer.has && smoothstep(0.32, 0.56, u) > 0) e += Math.round((steer.e - e) / pitch) * pitch;       // stay on one branch once the nudge has begun
          steer.e = e; steer.has = true;
          if (u > uCross) steer.frozen = e;
        }
        steer.corr = e * smoothstep(0.32, 0.56, u);
      }
      return base + steer.corr;
    }

    function update(dt, t, camera, u) {
      time.value = t;
      // the sun on its arc, and how it stands against the limb as seen from this camera
      sunAt(u, sunDir);
      const el = Math.asin(clamp(sunDir.y, -1, 1));
      cp.setFromMatrixPosition(camera.matrixWorld);            // never camera.position: the portal camera's matrix is set directly
      oc.subVectors(cp, EC); const dC = oc.length(); upC.copy(oc).divideScalar(dC);
      const above = Math.asin(clamp(sunDir.dot(upC), -1, 1)) + Math.acos(clamp(R_EARTH / dC, 0, 1));    // sun centre above the limb, rad
      const limbVis = smoothstep(-SR, SR * 0.7, above), lit = smoothstep(-0.012, 0.07, above), day = smoothstep(0.0, 0.3, above);
      sunCol.copy(RED).lerp(GOLD, smoothstep(-SR, 0.045, above)).lerp(WHITE, smoothstep(0.03, 0.2, above));
      // the wheel: steered phase, sunrise sweeping down it, earthshine from the ground below
      hero.setPhase(wheelPhase(dt, t, u));
      const edgeY = (el < 0 ? R_EARTH * (1 / Math.cos(el) - 1) : 0) - 400;                               // height of the Earth's shadow edge here
      hero.setSunrise(clamp((375 - edgeY) / 1125, 0, 1) + 0.33 * smoothstep(-9 * DEG, 0, el));
      // Arrival: seen through the previous world's portal (u = 0) and for the first seconds after it, the night scene is
      // held a little brighter (windows, earthshine on the hull, aurora), then eases down to its true level by u 0.2.
      const e0 = 1 - smoothstep(0.03, 0.2, u), nb = 1 + 1.4 * e0 * (1 - day);
      hero.uniforms.uWin.value = 1 + 1.6 * e0;
      hero.uniforms.uMoonCol.value.copy(MOON_LIGHT).multiplyScalar(1 + 1.3 * e0);
      // Arrival, and the view through the previous portal (u = 0): the air and the aurora stand taller, so their colour
      // reaches up into the level cone the opening shows; they settle to their true height over the first few seconds.
      const e1 = 1 - smoothstep(0, 0.1, u), arc = smoothstep(0.42, 0.52, u);
      atmU.uOval.value.z = D.auroraI * (1 + 0.7 * (1 - smoothstep(0.05, 0.3, u))) * (1 + 0.4 * e1);
      atmU.uAk.value = 1 + 0.8 * e1; atmU.uHk.value = 1 + 0.9 * e1 + 0.9 * arc; atmU.uArc.value = arc;
      // the morning side under the approach: the sun's light on the ground lifted, bigger cloud swirls, shadows toward the camera
      planetU.uLift.value = 0.3 * smoothstep(0.56, 0.8, u); planetU.uDawn.value = arc;
      planetU.uCloud.value = D.cloud - 0.03 * smoothstep(0.6, 0.85, u);
      { const sx = sunDir.dot(axV), sy = sunDir.dot(earthAxis), sl = Math.hypot(sx, sy) || 1; planetU.uSunT.value.set(sx / sl, sy / sl); }
      shine.setRGB(lerp(0.05, 0.12, day) * nb, lerp(0.09, 0.2, day) * nb, lerp(0.2, 0.38, day) * nb);
      const ak = 0.2 * e0 * (1 - day); shine.r += auroraLow.r * ak; shine.g += auroraLow.g * ak; shine.b += auroraLow.b * ak;      // the aurora below lights the wheel on arrival
      hero.setEarthshine(shine);
      // the whole sky (stars, moon) rises with the sun as the station rounds the Earth
      const skyA = el - SUN_KEYS[0][1] * DEG, skyC = Math.cos(skyA), skyS = Math.sin(skyA);
      stars.uniforms.uRot.value.set(skyC, skyS);
      moonDir.set(moon0.x, skyC * moon0.y - skyS * moon0.z, skyS * moon0.y + skyC * moon0.z);
      hero.setSun(sunDir, heroCol.copy(sunCol).multiplyScalar(1.2 * (0.72 + 0.28 * hero.sunVis)));
      hero.update(dt, t, camera);
      // is the portal in front of the sun?
      toP.subVectors(seat.position, cp); const dP = toP.length(), cosA = toP.dot(sunDir) / dP;
      let portalVis = 1;
      if (cosA > 0) { const rho = Math.atan2(seat.radius + 1.6, dP); portalVis = smoothstep(rho * 0.8, rho * 1.15 + SR, Math.acos(Math.min(1, cosA))); }
      const vis = hero.sunVis * limbVis * portalVis;
      sunU.uColor.value.copy(sunCol); sunU.uP.value.z = 0.85 * smoothstep(-0.06, 0.03, above) * (0.55 + 0.45 * hero.sunVis) * (0.55 + 0.45 * portalVis);
      stars.uniforms.uTime.value = t; stars.uniforms.uPx.value = (ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(bufSize).y : 540) / 540;
      // the flare belongs to a sun that is in the picture: once the disc is off the edge of the frame its streak goes with it
      cx.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); cy.setFromMatrixColumn(camera.matrixWorld, 1).normalize(); cz.setFromMatrixColumn(camera.matrixWorld, 2).normalize();
      const sz = -sunDir.dot(cz), pe = camera.projectionMatrix.elements;
      const inFrame = sz > 0.05 ? 1 - smoothstep(0.98, 1.14, Math.max(Math.abs(sunDir.dot(cx) * pe[0] / sz), Math.abs(sunDir.dot(cy) * pe[5] / sz))) : 0;
      flare.uniforms.uSun.value.copy(sunDir); flare.uniforms.uVisibility.value = vis * inFrame; flare.uniforms.uColor.value.copy(sunCol);
      flare.uniforms.uIntensity.value = 0.5 + 0.2 * day;       // streak and faint ghosts only: the halo is the sun billboard's own
      coronaU.uI.value = 1.25 * (1 - portalVis) * limbVis * (0.88 + 0.12 * Math.sin(t * 1.9));
      coronaU.uColor.value.copy(sunCol);
      flecks.setOpacity(lerp(0.14, 1, lit) * (0.45 + 0.55 * hero.sunVis));
      stream.setOpacity(lerp(0.14, 1, lit) * smoothstep(0.56, 0.7, u));
      // the Earth turns beneath
      const ang = D.earthSpin * t;
      earthFrame(uM, earthAxis, ang); spin.set(ang, ang * 1.06 + 0.02 * t * DEG + 0.3);
      meteors.uniforms.uTime.value = t;
      beacons.uniforms.uTime.value = t; beacons.uniforms.uPx.value = hero.beaconUniforms.uPx.value;
      // solar wings: feathered and hunting a little by night, then they swing round to face the sunrise
      const track = smoothstep(0.4, 0.64, u);
      for (const w of L.wings) w.mesh.rotation.x = -lerp(w.night + 0.07 * Math.sin(t * 0.21 + w.ph), Math.PI / 2 - el, track) - 0.01 * Math.sin(t * 0.9 + w.ph);
      // spacewalkers and their helmet lamps
      for (let i = 0; i < walkers.length; i++) {
        const w = walkers[i], k = Math.sin(t * w.rate + w.ph);
        w.mesh.position.copy(w.base).addScaledVector(w.along, k * w.range).addScaledVector(w.up, 0.06 + 0.05 * Math.sin(t * 1.3 + w.ph));
        w.mesh.quaternion.copy(w.q0).multiply(qa.setFromAxisAngle(Y, 0.6 * Math.sin(t * 0.21 + w.ph * 2)));
        w.mesh.updateMatrixWorld();
        glows.setPosition(G.lamp + i, tmp.set(0, 1.82, 0.36).applyMatrix4(w.mesh.matrixWorld));
        glows.setSize(G.lamp + i, 1.7 + 0.25 * Math.sin(t * 0.21 + w.ph * 2));
      }
      // the tugs: slow station keeping, nav lights, strobe, thruster puffs
      for (let k = 0; k < tugs.length; k++) {
        const tug = tugs[k], m = tug.mesh, p = tug.ph, o = G.tug + 6 * k;
        if (tug.dir) {           // the ferry: its run is keyed to u so it is always on stage for the approach, and it never stops moving
          const run = 340 - 560 * (1 - clamp((u - 0.52) / 0.48, 0, 1)) + 42 * Math.sin(0.2 * t + p);
          m.position.copy(tug.base).addScaledVector(tug.dir, run); m.position.y += tug.amp.y * Math.sin(0.3 * t + p);
          m.rotation.set(0.05 * Math.sin(0.23 * t + p), tug.yaw + 0.08 * Math.sin(0.11 * t + p), 0.35 * Math.sin(0.17 * t + p));
        } else {
          const sA = smoothstep(0.6, 1, u);
          const cl = tug.closing ? (tug.closing > 0 ? tug.closing * 0.4 * (1 - sA) : -tug.closing * 0.5 * sA) : 0;
          m.position.set(tug.base.x + tug.amp.x * Math.sin(0.11 * t + p) + cl, tug.base.y + tug.amp.y * Math.sin(0.07 * t + 1 + p), tug.base.z + tug.amp.z * Math.sin(0.045 * t + 2 + p) - (tug.run || 0) * sA);
          m.rotation.set(0.1 * Math.sin(0.13 * t + p), tug.yaw + 0.3 * Math.sin(0.05 * t + p), 0.2 * Math.sin(0.09 * t + p));
        }
        m.updateMatrixWorld();
        for (let i = 0; i < 2; i++) { glows.setPosition(o + i, tmp.copy(tug.nav[i]).applyMatrix4(m.matrixWorld)); glows.setSize(o + i, 1.3); }
        glows.setPosition(o + 2, tmp.copy(tug.nav[2]).applyMatrix4(m.matrixWorld));
        glows.setSize(o + 2, 0.01 + 3.2 * Math.pow(Math.max(0, Math.sin(t * 2.7 + p)), 24));
        for (let i = 0; i < 3; i++) {
          const age = tug.busy ? puffAge(t, 1.4, i + 1 + p, 0.62) : puffAge(t, 0.8, i + 1 + p);
          glows.setPosition(o + 3 + i, tmp.copy(tug.jets[i]).applyMatrix4(m.matrixWorld));
          glows.setSize(o + 3 + i, age < 0 ? 0 : 1.2 + 5 * age);
          if (age >= 0) glows.setColor(o + 3 + i, puffCol.setRGB(0.74, 0.85, 1).multiplyScalar(Math.exp(-age * 4.5)));
        }
      }
      // the docked shuttle trims its attitude now and then
      if (A.shuttle) for (let i = 0; i < 2; i++) {
        const age = puffAge(t, 0.55, i * 3 + 9), sg = i ? -1 : 1;
        glows.setPosition(G.shuttle + i, tmp.copy(A.shuttle).addScaledVector(shuttleR, 3.4 * sg).setZ(A.shuttle.z + (i ? -11 : 14)));
        glows.setSize(G.shuttle + i, age < 0 ? 0 : 1.4 + 6 * age);
        if (age >= 0) glows.setColor(G.shuttle + i, puffCol.setRGB(0.74, 0.85, 1).multiplyScalar(Math.exp(-age * 4)));
      }
      // satellites crossing far off
      for (let i = 0; i < sats.length; i++) {
        const s = sats[i], d = ((t * s.speed + s.off) % s.span) - s.span / 2;
        glows.setPosition(G.sat + i, tmp.copy(s.a).addScaledVector(s.d, d));
        glows.setSize(G.sat + i, s.size * (s.blink ? 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * s.blink + i)), 6) : 1));
      }
    }
    earthFrame(uM, earthAxis, 0); sunAt(0, sunDir);

    return {
      scene, path, duration,
      camera: { fov: 62, near: 1, far: 9000, lookAhead: 40, sway: 0.55, bank: 0.5 },
      pois: [
        { at: V3(-20, -330, 0), from: 0, to: 0.2, weight: 0.5 },                                            // the wheel over the night Earth
        { at: V3(120, -175, 170), from: 0.15, to: 0.37, weight: 0.42 },                                    // down across the wing to the city lights
        { at: (t, u) => { sunAt(u, poiDir); if (poiDir.y < -0.4) { poiDir.y = -0.4; poiDir.normalize(); } return poiSun.copy(path.pointAt(u, camP)).addScaledVector(poiDir, 3000); },
          from: 0.34, to: 0.58, weight: 0.62, fade: 0.2 },                                                 // the sunrise through the wheel
        // the crossing: the gaze stays ahead of the wheel's plane (looking square at the rim from beside it showed it
        // edge-on, one bar splitting the frame), with the garden rim sliding out on the right and the hub on the left
        { at: V3(A.gardenLook.x * 0.7, -40, -70), from: 0.54, to: 0.71, weight: 0.45, fade: 0.25 },      // ahead of the plane and to the right: rim in the right third, the sun kept in the left
        { at: V3(0, 0, -20), from: 0.6, to: 0.67, weight: 0.25, fade: 0.3 },                               // a glance at the hub as the plane goes by
        { at: V3(seat.position.x, seat.position.y - 260, seat.position.z - 600), from: 0.68, to: 1.0, weight: 0.4, fade: 0.12 },     // the dock, with the day side under it
      ],
      portal: { shape: 'circle', radius: Math.min(8.6, seat.radius - 0.15), color: '#ffe2b8', glow: 0.85, revealDistance: 300 },
      // contrast stays at exactly 1: anything above it clips the darkest tones to black, and against black space that
      // turned every faint, smooth falloff (the sun's halo, the corona, the aurora's skirt) into a hard, lumpy contour
      post: {
        exposure: 1.0, bloom: { strength: 0.46, radius: 0.6, threshold: 1.7 },      // threshold above the sun's capped halo: lamps, windows, glitter and the lit limb still bloom
        grade: { saturation: 1.1, contrast: 1.0, tint: '#f6f8ff', shadowTint: '#01030b', vignette: 0.34, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { hero.dispose?.(); atlas.dispose(); walkerGeo.dispose(); },
    };
  },
};
