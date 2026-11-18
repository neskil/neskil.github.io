// THE CARILLON GROVE
// A flooded forest of bell-trees before dawn, flown in the bell-tender's balloon. Celadon glass bells hang
// from lacquer-black crooked stalks over a mirror lake; a toll does not spread as a ring, it HOPS from bell
// to bell over a neighbour graph (jittered delays, moth streaks on every edge). Small tolls teach the rule,
// one breaks right over the basket, then the Bourdon (src/parts/carillon-grove.js) speaks, the chain runs
// out through the whole grove and the overcast is rung toward gold. The flight ends up the inside of the
// Bourdon, through the portal seated in its crown collar.
//
// Everything of the grove is built into the hero's vertex layout and drawn with the hero's own materials
// (one solid mesh, one glass mesh, one halo mesh), so one clock (uS = seconds relative to the strike, keyed
// to path progress) drives every bell. The lake is a real mirror: y-flipped copies under a tinted surface.
//
// Variations by seed (ctx.vary.hour honoured): HOUR pearl pre-dawn | deep night | lilac blue hour;
// WEATHER clear | still drizzle | thick fog | frost season; CAST tuner-birds or glass herons, chime-fish or
// water-striders, ropeway gondolas or the tender's punt. Rare event (ctx.vary.rare): the answer, a second
// Bourdon beyond the eastern horizon lights the fog and its chain runs inward to meet ours.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, Buf, lathe, tube, blob, spline, GLSL_COMMON, GLSL_ADDFOG } from '../parts/carillon-grove.js';

const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hexOf = (c) => '#' + new THREE.Color(c[0], c[1], c[2]).getHexString();
const DURATION = 42, U_STRIKE = 0.36, T_STRIKE = U_STRIKE * DURATION;   // the Bourdon speaks from 262 m out: bell, arch and their light on the lake all in frame

// ---- hours ---------------------------------------------------------------------------------------------
// palette = [pearl (ambient / rim), slate, celadon, deep celadon, far stalk, lacquer, gold]
// skyPow = how fast the dome falls from horizon to zenith colour; dim = how far the overcast draws back for a breath when the
// Bourdon speaks (so its gold is the brightest thing in a bright hour); amber = gain of the lit glass; rim = lacquer rim light
const HOURS = {
  pearl: { palette: ['#D5DAE6', '#8FA5B8', '#A9D6C4', '#3F9C86', '#22323C', '#0B1016', '#FFC56B'], horizon: '#D5DAE6', zenith: '#BFC8DA', band: '#F1F1F0',
    horizonAfter: '#DDD3C0', zenithAfter: '#B9BCC8', bandAfter: '#FFDFA6', amb: 1, ambAfter: 1.0, stars: 0, deep: '#0d141b', exposure: 0.95, bandAz: [-0.8, -0.6], fauna: 1,
    skyPow: 0.55, dim: 0.3, amber: 1.7, vein: 0.5, rim: 0.8, glow: 0, haloK: 0.6, bloom: 0.3 },
  night: { palette: ['#8C9FC6', '#3A4B66', '#8FD0BC', '#3F9C86', '#111B28', '#03060A', '#FFC56B'], horizon: '#2A3B5C', zenith: '#0B1225', band: '#4C6694',
    horizonAfter: '#3F495E', zenithAfter: '#151C30', bandAfter: '#C08A4E', amb: 0.3, ambAfter: 0.5, stars: 1, deep: '#060B16', exposure: 1.12, bandAz: [-0.3, -0.95], bandE: [0.13, 0.2], fogK: 0.72, fauna: 0.35,
    skyPow: 1.15, dim: 0, amber: 1, vein: 1, rim: 0.62, glow: 1, haloK: 0.85, bloom: 0.55 },
  lilac: { palette: ['#C9C0E4', '#8E8FBA', '#A9D6C4', '#3F9C86', '#2A2A46', '#0D0B19', '#FFC56B'], horizon: '#BDB4DC', zenith: '#8482BC', band: '#F2CBDC',
    horizonAfter: '#C9BACB', zenithAfter: '#8F8ABA', bandAfter: '#FFD9A8', amb: 0.9, ambAfter: 0.96, stars: 0.25, deep: '#0d0c1c', exposure: 1.0, bandAz: [0.85, -0.52], fauna: 0.85,
    skyPow: 0.6, dim: 0.14, amber: 1.3, vein: 0.75, rim: 0.8, glow: 0.2, haloK: 0.6, bloom: 0.38 },
};

// ---- sky: a shadowless overcast dome, symmetric about the horizon so the lake mirrors it ---------------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uHorizon, uZenith, uBand, uGold, uFogCol; uniform vec2 uBandAz, uAnsAz; uniform float uStars, uTime, uAnswer, uDawn, uSkyPow, uGlow; uniform vec2 uBandE;
varying vec3 vDir;
float hash3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
void main() {
  vec3 d = normalize(vDir); float e = abs(d.y);
  vec2 az = d.xz / max(length(d.xz), 1e-4);
  vec3 col = mix(uHorizon, uZenith, pow(e, uSkyPow));
  if (uGlow > 0.0) {                                    // night: thin high mist catches what light there is, so the dark has depth
    float an = atan(az.x, az.y + 1e-4);
    float wisp = 0.5 + 0.5 * sin(an * 3.0 + e * 11.0 + 1.3 * sin(an * 5.0 - e * 4.0 + uTime * 0.03));
    float wisp2 = 0.5 + 0.5 * sin(an * 7.0 - e * 23.0 + 2.0 * sin(an * 2.0 + uTime * 0.021));
    col += uHorizon * uGlow * (0.3 * exp(-e * 4.5) + (0.2 * wisp * wisp + 0.1 * wisp2 * wisp2) * smoothstep(0.04, 0.3, e) * (1.0 - smoothstep(0.35, 0.95, e)));
  }
  float a = max(dot(az, uBandAz), 0.0);
  float bq = (e - uBandE.x) / uBandE.y, band = exp(-bq * bq) * a * a * a;
  col = mix(col, uBand, band * 0.85);
  col += uGold * uDawn * (0.05 * a * a * exp(-e * 5.0));
  if (uStars > 0.0) {                                   // a few stars through thin mist
    vec3 q = d * 140.0, c = floor(q); float h = hash3(c);
    float s = step(0.9965, h) * (1.0 - smoothstep(0.0, 0.3, length(fract(q) - 0.5)));
    col += vec3(0.75, 0.82, 1.0) * s * uStars * smoothstep(0.2, 0.7, e) * (0.6 + 0.4 * sin(uTime * (2.0 + h * 40.0) + h * 90.0));
  }
  if (uAnswer > 0.0) {                                  // the answer: a second Bourdon beyond the horizon, cut out against its own light
    float x = atan(az.x * uAnsAz.y - az.y * uAnsAz.x, dot(az, uAnsAz) + 1e-4), y = asin(clamp(e, 0.0, 1.0));
    float glow = exp(-(x * x / 0.3 + y * y / 0.05));
    float h = 0.2, t = clamp(y / (h * 0.88), 0.0, 1.0);
    float bw = 0.02 + 0.05 * pow(1.0 - t, 0.6) + 0.04 * pow(1.0 - t, 7.0);
    float bell = (1.0 - smoothstep(0.0, 0.006, abs(x) - bw)) * step(0.03, y) * step(y, h * 0.88);
    float arch = (1.0 - smoothstep(0.007, 0.016, abs(abs(x) - 0.17 * sqrt(max(1.0 - y / h, 0.0))))) * step(y, h);
    float crk = 0.55 + 0.45 * sin(x * 190.0);
    col = mix(col, uGold * vec3(1.0, 0.76, 0.42) * 1.1, clamp(uAnswer * glow * (0.85 + 0.15 * sin(uTime * 1.7 + x * 9.0)), 0.0, 0.92));
    col = mix(col, uGold * vec3(1.0, 0.8, 0.5) * (0.55 + 0.5 * crk), bell * uAnswer * 0.55);
    col = mix(col, uFogCol * 0.4, arch * uAnswer * 0.7);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- the lake: a tinted pane over the mirrored world; rings, dimples, wakes, drizzle, ice --------------
const LAKE_VERT = /* glsl */`
varying vec3 vW; varying float vDist;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const LAKE_FRAG = /* glsl */`
uniform vec3 uDeep, uSky, uGold; uniform float uS, uTime, uDrizzle, uIce, uIceAmb, uFish, uGoldK, uDens, uColK;
uniform vec4 uRings[8]; uniform vec4 uWake[2]; uniform vec2 uWakeK; uniform vec3 uBird[6]; uniform vec3 uBirdCol;
varying vec3 vW; varying float vDist;
float hash2(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float cellRip(vec2 p, float S, float rate, float k, float maxR, float dens) {
  vec2 c = floor(p / S), f = p / S - c;
  float h = hash2(c), h2 = hash2(c + 17.3);
  float t = fract(uTime * rate * (0.6 + 0.8 * h2) + h * 7.0);
  float d = length(f - vec2(0.32 + 0.36 * h, 0.32 + 0.36 * h2)) * S, q = (d - t * maxR) * k;
  return sin(q) * exp(-q * q * 0.12) * (1.0 - t) * (1.0 - t) * step(hash2(c + 5.1), dens);
}
float wake(vec2 p, vec4 w, float k) {
  vec2 r = p - w.xy; float s = -dot(r, w.zw), l = abs(r.x * w.w - r.y * w.z), sb = max(s, 0.0);   // sb: the wake lies behind its head only; ahead of it the width is the head's own
  float q = (l - sb * 0.34) / (0.3 + sb * 0.035);
  return k * sin(q * 2.2 + 0.8) * exp(-q * q) * exp(-max(s, 0.0) / 38.0) * smoothstep(0.0, 1.5, s);
}
void main() {
  vec3 V = normalize(cameraPosition - vW); float c = clamp(V.y, 0.0, 1.0);
  vec2 p = vW.xz; float df = exp(-vDist / 190.0);
  float n = 0.0, gold = 0.0;
  for (int i = 0; i < 8; i++) {                         // chime-fish: a ring of small expanding circles under a bell that rang
    vec4 r = uRings[i]; float t = uS - r.z;
    if (t > 0.0 && t < 11.0) {
      vec2 q = p - r.xy; float ang = atan(q.y, q.x + 1e-4);
      float a6 = (floor(ang / 1.0472) + 0.5) * 1.0472;
      float dd = distance(q, r.w * vec2(cos(a6), sin(a6))), w = (dd - t * 2.6) * 2.4;
      float e = sin(w) * exp(-w * w * 0.1) * exp(-t * 0.42) * smoothstep(0.0, 0.4, t);
      float big = (length(q) - t * 13.0) * 0.7;
      e += 0.8 * sin(big) * exp(-big * big * 0.1) * exp(-t * 0.5);
      n += e; gold += max(e, 0.0) * exp(-t * 0.6);
    }
  }
  n += uFish * cellRip(p, 23.0, 0.11, 2.6, 6.0, 0.7) * df;
  n += uFish * 0.6 * cellRip(p + 71.3, 9.0, 0.19, 4.0, 2.4, 0.3) * df;
  if (uDrizzle > 0.0) { float dn = exp(-vDist / 70.0); n += uDrizzle * (cellRip(p, 1.1, 1.3, 16.0, 0.3, 0.8) + cellRip(p + 3.7, 1.9, 0.9, 11.0, 0.5, 0.7)) * dn * 0.8; }
  n += wake(p, uWake[0], uWakeK.x) + wake(p, uWake[1], uWakeK.y);
  n += 0.25 * pow(0.5 + 0.5 * sin(p.x * 0.043 + sin(p.y * 0.027 + uTime * 0.13) * 2.3 + uTime * 0.11), 10.0) * df;     // the mirror breathing
  // the lake carries the Bourdon upside down: its light lies on the water as the bell's own long image, mouth at its foot and
  // crown toward us, veined like the glass and broken by every ripple
  vec2 cdir = cameraPosition.xz; float cD = max(length(cdir), 1.0); cdir /= cD;
  float sC = dot(p, cdir), lC = p.x * cdir.y - p.y * cdir.x, kC = clamp(sC / max(cD * 0.86, 1.0), 0.0, 1.0);
  float wob = 2.6 * sin(sC * 0.19 + uTime * 0.7) + 1.7 * sin(sC * 0.47 - uTime * 1.3 + lC * 0.05) + 5.0 * clamp(n, -1.0, 1.0);
  float wC = mix(58.0, 9.0, pow(kC, 0.6)) + 6.0 * exp(-kC * 9.0), xb = (lC + wob) / wC;
  float inB = (1.0 - smoothstep(0.82, 1.0, abs(xb))) * (1.0 - smoothstep(0.86, 1.0, sC / max(cD * 0.86, 1.0))) * smoothstep(60.0, 120.0, cD) * exp(-max(-sC, 0.0) / 60.0);
  float th = asin(clamp(xb, -0.999, 0.999)), rib = 0.5 + 0.5 * cos(th * 24.0), lipB = exp(-kC * kC * 900.0);
  float dash = 0.5 + 0.5 * sin(sC * 0.8 + 2.2 * sin(lC * 0.13 + uTime * 0.6) - uTime * 1.7);
  dash = dash * dash * (0.55 + 0.45 * sin(sC * 0.21 + lC * 0.37 + uTime * 1.1));
  float column = uGoldK * inB * (0.3 + 0.5 * rib * rib * rib + 0.6 * dash + 0.5 * lipB) * (0.6 + 0.4 * sqrt(max(1.0 - xb * xb, 0.0)));
  float R = mix(0.2, 1.0, pow(1.0 - c, 2.2));
  float alpha = (1.0 - R) * 0.93;
  vec3 col = uDeep * alpha;
  col += (uSky * 0.42 + uGold * uGoldK * 0.5) * max(n, 0.0) * (0.25 + 0.75 * R) + uGold * gold * 0.9 * step(0.0, uS);
  col += uGold * vec3(1.0, 0.82, 0.55) * column * uColK;
  alpha += max(-n, 0.0) * 0.32 * (0.3 + 0.7 * R) + 0.8 * min(column, 1.0);
  if (uIce > 0.0) {                                     // frost season: a milky skin with dark leads
    vec2 q = p * 0.05 + 0.6 * vec2(sin(p.y * 0.021), sin(p.x * 0.017)), ic = floor(q), fr = fract(q); float md = 9.0, md2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), o = vec2(hash2(ic + g), hash2(ic + g + 9.7));
      float d = length(g + o - fr); if (d < md) { md2 = md; md = d; } else if (d < md2) md2 = d;
    }
    float lead = 0.45 + 0.55 * smoothstep(0.012, 0.05, md2 - md), milk = uIce * (0.3 + 0.16 * hash2(ic)) * lead;
    float fogI = exp(-uDens * uDens * vDist * vDist);
    col = col * (1.0 - milk) + uSky * uIceAmb * 0.74 * milk * fogI; alpha = alpha * (1.0 - milk) + milk * fogI;
  }
  float bird = 0.0;                                     // the tuner-birds stand doubled in the mirror
  for (int i = 0; i < 6; i++) {
    vec2 r = p - uBird[i].xy, tc = cameraPosition.xz - uBird[i].xy; float D = max(length(tc), 1.0); vec2 dir = tc / D;
    float s = dot(r, dir), l = abs(r.x * dir.y - r.y * dir.x) / uBird[i].z;
    float hh = s * max(cameraPosition.y, 0.5) / max(D - s, 1.0) / uBird[i].z, bq = (hh - 0.6) / 0.14;
    float wd = 0.03 + 0.17 * exp(-bq * bq) + 0.035 * step(0.88, hh);
    bird = max(bird, (1.0 - smoothstep(wd * 0.55, wd, l)) * step(0.0, s) * step(hh, 1.0) * step(s, D * 0.7));
  }
  bird *= 0.8 * (1.0 - 0.5 * clamp(abs(n), 0.0, 1.0));
  col = col * (1.0 - bird) + uBirdCol * bird; alpha = mix(alpha, 0.96, bird);
  float fogK = exp(-uDens * uDens * vDist * vDist * 0.6);
  gl_FragColor = vec4(col * fogK, clamp(alpha, 0.0, 0.97) * fogK);
}`;

// ---- ground-bells (instanced snowdrops) and their ember sparks ------------------------------------------
const GB_VERT = /* glsl */`
attribute vec4 iPos; attribute vec4 iToll; attribute vec2 aK;
varying vec2 vK; varying float vG, vSeed; varying vec3 vN;
${GLSL_COMMON}
#include <common>
#include <fog_pars_vertex>
void main() {
  float cy = cos(iPos.w), sy = sin(iPos.w), per = 1.2 + iToll.z;
  float g = max(tollEnv(uS - iToll.y, iToll.z, per), tollPre(iToll.x, iToll.z, per));
  vec3 p = position;
  float nod = (0.03 * sin(uTime * 1.1 + iToll.z * 40.0) + 0.3 * g * sin(uTime * 9.0 + iToll.z * 20.0)) * p.y * p.y;
  p.x += nod;
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy) * iPos.z + vec3(iPos.x, 0.0, iPos.y);
  vN = vec3(normal.x * cy + normal.z * sy, normal.y, -normal.x * sy + normal.z * cy);
  vK = aK; vG = g; vSeed = iToll.z;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GB_FRAG = /* glsl */`
uniform vec3 uBody, uLip, uGold, uSky, uLacq; uniform float uAmb, uTime;
varying vec2 vK; varying float vG, vSeed; varying vec3 vN;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 col;
  if (vK.x < 0.5) col = uLacq * uAmb * 1.6 + uSky * uAmb * 0.05;
  else {
    col = mix(uBody, uLip, vK.y) * uAmb * (0.62 + 0.3 * abs(normalize(vN).y));
    col += uGold * vec3(1.0, 0.82, 0.55) * (0.18 * vK.y + vG * (0.6 + 2.2 * vK.y));
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
const SPARK_VERT = /* glsl */`
attribute vec4 iToll;
uniform float uPx, uDrizzle;
varying float vA, vDist;
${GLSL_COMMON}
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; return fract(p * (p + p)); }
void main() {
  float per = 1.2 + iToll.z;
  float g = max(tollEnv(uS - iToll.y, iToll.z, per), tollPre(iToll.x, iToll.z, per));
  if (uDrizzle > 0.0) {                                 // every drop strikes a spark
    float q = uTime * 0.9 + iToll.z * 13.0, k = floor(q);
    g += uDrizzle * step(0.8, h11(k * 1.7 + iToll.z * 91.0)) * exp(-fract(q) * 5.0) * 0.9;
  }
  vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
  float px = uPx * (0.3 + 0.5 * min(g, 1.0)) * iToll.w / max(vDist, 1.0);
  gl_PointSize = clamp(px, 1.6, 26.0);
  vA = (0.85 + 0.2 * sin(uTime * 2.1 + iToll.z * 60.0) + 2.6 * g) * clamp(px / 1.6, 0.3, 1.0);
}`;
const SPARK_FRAG = /* glsl */`
uniform vec3 uGold;
varying float vA, vDist;
${GLSL_ADDFOG}
void main() {
  float d = length(clamp(gl_PointCoord, 0.0, 1.0) - 0.5); float m = (1.0 - smoothstep(0.0, 0.5, d)); m *= m;
  gl_FragColor = vec4(uGold * vec3(1.0, 0.85, 0.6) * m * vA * addFog(vDist, 0.55), 1.0);
}`;

// ---- hair-thin sedge: blades drawn in the fragment shader on crossed cards ------------------------------
const SEDGE_VERT = /* glsl */`
attribute vec4 iPos; attribute vec4 iSd;
varying vec2 vUv; varying float vSeed;
${GLSL_COMMON}
#include <common>
#include <fog_pars_vertex>
void main() {
  float cy = cos(iPos.w), sy = sin(iPos.w);
  float t = uS - iSd.y, sh = (t > 0.0 ? exp(-t / 3.5) * smoothstep(0.0, 0.2, t) : 0.0) + (iSd.z < -0.001 && uS > iSd.z ? exp(-(uS - iSd.z) / 3.0) : 0.0);
  vec3 p = position * vec3(iSd.w, iSd.w * 0.8, iSd.w);
  p.x += uv.y * uv.y * (0.5 * sh * sin(uTime * 13.0 + iSd.x * 30.0 + p.x * 3.0));
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy) + iPos.xyz;
  vUv = uv; vSeed = iSd.x;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SEDGE_FRAG = /* glsl */`
uniform vec3 uLacq, uSky; uniform float uAmb, uRime;
varying vec2 vUv; varying float vSeed;
#include <common>
#include <fog_pars_fragment>
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; return fract(p * (p + p)); }
void main() {
  float x = vUv.x * 13.0 + vSeed * 31.0, fw = fwidth(x), a = 0.0, vy = clamp(vUv.y, 0.0, 1.0);   // the blade's own coordinate, in its range
  float id = floor(x), h = h11(id + vSeed * 57.0);
  float lean = (h11(id * 3.1 + 2.0) - 0.5) * 1.3, top = 0.45 + 0.55 * h;
  float cx = fract(x) - 0.5 - lean * vy * vy * 0.6;
  float w = max(0.06 * (1.0 - vy / top), 0.0) + fw * 0.6 + 1e-4;
  a = (1.0 - smoothstep(w * 0.5, w, abs(cx))) * step(vy, top) * clamp(0.3 / max(fw, 1e-3), 0.4, 1.0);
  if (a < 0.02) discard;
  vec3 col = mix(uLacq, uSky * 0.8, uRime * (0.35 + 0.65 * vy)) * uAmb;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---- glass-moths: every edge of the toll graph owns a few; they carry the light from bell A to bell B ----
const MOTH_VERT = /* glsl */`
attribute vec3 aB; attribute vec4 aT;
uniform float uPx;
varying float vA, vGold, vDist;
${GLSL_COMMON}
void main() {
  float sd = aT.z, dur = max(aT.y - aT.x, 0.3), k = clamp((uS - aT.x) / dur, 0.0, 1.0), ks = k * k * (3.0 - 2.0 * k);
  vec3 jit = vec3(sin(uTime * 1.3 + sd * 50.0), sin(uTime * 1.7 + sd * 31.0), cos(uTime * 1.1 + sd * 77.0));
  vec3 dv = aB - position, side = normalize(vec3(-dv.z, 0.0, dv.x) + vec3(1e-3, 0.0, 0.0));
  float arc = sin(3.14159 * ks), tb = uS - aT.y;
  vec3 p = mix(position, aB, ks) + jit * (0.3 + 2.0 * arc) + side * arc * (fract(sd * 13.7) - 0.5) * 8.0;
  float roost = 1.0 - smoothstep(aT.x - 0.7, aT.x, uS), oa = uTime * (0.3 + 0.5 * fract(sd * 9.7)) + sd * 60.0, orr = 1.4 + 1.6 * fract(sd * 5.3);
  p += roost * orr * vec3(sin(oa), 0.6 * sin(oa * 1.3 + sd * 20.0), cos(oa));                 // roosting: a slow orbit off the glass
  p.y += arc * (3.0 + 7.0 * fract(sd * 7.3));
  float gold = smoothstep(0.0, 0.12, k), a = 0.6;
  if (tb > 0.0) {
    float an = tb * (0.5 + fract(sd * 5.1)) + sd * 40.0, r = (1.0 - exp(-tb * 0.6)) * (2.0 + 6.0 * fract(sd * 3.3));
    p += vec3(cos(an) * r, sin(an * 0.7) * r * 0.5, sin(an) * r);
    gold *= max(exp(-tb / 6.0), 0.55 * step(0.0, aT.y) * uAfter * 3.0);
  }
  a = mix(0.6, 1.0, gold);
  float tw = 0.6 + 0.4 * sin(uTime * (5.0 + sd * 9.0) + sd * 100.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
  float px = uPx * aT.w * (1.0 + 0.7 * gold) / max(vDist, 1.0);
  gl_PointSize = clamp(px, 1.6, 20.0);
  vA = a * tw * clamp(px / 1.6, 0.25, 1.0); vGold = gold;
}`;
const MOTH_FRAG = /* glsl */`
uniform vec3 uGold, uPale;
varying float vA, vGold, vDist;
${GLSL_ADDFOG}
void main() {
  vec2 q = clamp(gl_PointCoord, 0.0, 1.0) - 0.5; float d = length(q * vec2(1.0, 1.8));
  float m = (1.0 - smoothstep(0.06, 0.5, d)) * vA * addFog(vDist, 0.6);
  vec3 c = mix(uPale, uGold * vec3(1.0, 0.8, 0.5) * 2.6, vGold);
  gl_FragColor = vec4(c * m, 0.55 * m);
}`;

// water-striders (cast swap for the chime-fish): dark skaters that dart and rest
const STRIDER_VERT = /* glsl */`
attribute vec4 aSd;
uniform float uPx;
varying float vDist;
${GLSL_COMMON}
void main() {
  float q = uTime * (0.35 + aSd.x * 0.3) + aSd.y * 20.0, k = floor(q), f = fract(q), e = 1.0 - exp(-f * 6.0);
  vec2 a = vec2(sin(k * 12.9898 + aSd.y * 78.2), cos(k * 4.1414 + aSd.z * 31.7)), b = vec2(sin((k + 1.0) * 12.9898 + aSd.y * 78.2), cos((k + 1.0) * 4.1414 + aSd.z * 31.7));
  vec3 p = position; p.xz += mix(a, b, e) * aSd.w;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPx * 0.55 / max(vDist, 1.0), 1.5, 14.0);
}`;
const STRIDER_FRAG = /* glsl */`
uniform vec3 uLacq, uSky;
varying float vDist;
${GLSL_ADDFOG}
void main() {
  vec2 q = clamp(gl_PointCoord, 0.0, 1.0) - 0.5; float body = (1.0 - smoothstep(0.08, 0.2, length(q * vec2(1.0, 2.6))));
  float ring = (1.0 - smoothstep(0.0, 0.08, abs(length(q) - 0.4)));
  float f = addFog(vDist, 1.0);
  gl_FragColor = vec4(uLacq * body * f + uSky * 0.35 * ring * (1.0 - body) * f, body * f);
}`;

function box(buf, cx, cy, cz, sx, sy, sz, yaw, col) {
  const c = Math.cos(yaw), s = Math.sin(yaw), h = [sx / 2, sy / 2, sz / 2];
  for (const [a, b, cc, sg] of [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]]) {
    const n = [0, 0, 0]; n[a] = sg; const id = [];
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const l = [0, 0, 0]; l[a] = sg * h[a]; l[b] = u * h[b] * sg; l[cc] = v * h[cc];
      id.push(buf.v(cx + l[0] * c + l[2] * s, cy + l[1], cz - l[0] * s + l[2] * c, n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c, (u + 1) / 2, (v + 1) / 2, col));
    }
    buf.quad(id[0], id[1], id[2], id[3]);
  }
}

// box with any orientation: c = centre, ax/ay/az = half-axes (right-handed)
function obox(buf, c, ax, ay, az, col) {
  const A = [ax, ay, az];
  for (const [a, b, cc, sg] of [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]]) {
    const nn = A[a].clone().normalize().multiplyScalar(sg), id = [];
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const q = c.clone().addScaledVector(A[a], sg).addScaledVector(A[b], u * sg).addScaledVector(A[cc], v);
      id.push(buf.v(q.x, q.y, q.z, nn.x, nn.y, nn.z, (u + 1) / 2, (v + 1) / 2, col));
    }
    buf.quad(id[0], id[1], id[2], id[3]);
  }
}

export default {
  id: 'carillon-grove',
  name: 'The Carillon Grove',
  category: 'alien',
  weirdness: 0.65,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('variant');
    // ---------- which visit is this ----------
    let hourName = vr.pick(['pearl', 'night', 'lilac']);
    if (vary.hour === 'night') hourName = 'night'; else if (vary.hour === 'dawn' || vary.hour === 'day') hourName = 'pearl'; else if (vary.hour === 'golden') hourName = 'lilac';
    const weather = vr.pick(['clear', 'clear', 'drizzle', 'fog', 'frost']);
    const cast = { herons: vr.chance(0.4), striders: vr.chance(0.4), punt: vr.chance(0.35) };
    const rare = !!vary.rare, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const HR = { ...HOURS[hourName] }, frost = weather === 'frost', drizzle = weather === 'drizzle', thick = weather === 'fog';
    {                                                                     // the weather changes the picture, not only the particles
      const sh = (hex, to, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color(to), k).getHexString(), nightH = hourName === 'night';
      const SKYK = ['horizon', 'zenith', 'band', 'horizonAfter', 'zenithAfter', 'bandAfter'];
      if (frost) {                                                        // frost: blue-white air, bluer glass, whiter light
        for (const k of SKYK) HR[k] = sh(HR[k], nightH ? '#3C5682' : '#E2EEFB', k.endsWith('After') ? 0.35 : 0.6);
        HR.palette = HR.palette.slice(); HR.palette[0] = sh(HR.palette[0], '#DDEBFA', 0.6); HR.palette[1] = sh(HR.palette[1], '#86A6D0', 0.5);
        HR.palette[2] = sh(HR.palette[2], '#B4DCEC', 0.5); HR.palette[3] = sh(HR.palette[3], '#3C8FA4', 0.45); HR.palette[4] = sh(HR.palette[4], '#2A4266', 0.4);
        HR.deep = sh(HR.deep, '#16283C', 0.5);
      } else if (drizzle) {                                               // drizzle: a darker, wetter sky
        for (const k of SKYK) HR[k] = sh(HR[k], nightH ? '#04070c' : '#56606E', k.endsWith('After') ? 0.14 : 0.26);
        HR.exposure *= 0.97;
      } else if (thick) for (const k of ['zenith', 'zenithAfter']) HR[k] = sh(HR[k], HR.horizon, 0.6);
    }
    const P = HR.palette.map(lin), PEARL = P[0], CELADON = P[2], DEEP = P[3], FAR = P[4], LACQ = P[5], GOLD = P[6];
    const col = (c) => new THREE.Color(c[0], c[1], c[2]);
    const lacq = (k) => mix3(LACQ, FAR, clamp(k, 0, 1));
    const WOOD = mix3(FAR, P[1], 0.25), ROPE = mix3(LACQ, FAR, 0.6);

    const scene = new THREE.Scene();
    const horizon = new THREE.Color(HR.horizon), horizon0 = horizon.clone(), horizon1 = new THREE.Color(HR.horizonAfter);
    const fogK = (thick ? 1.95 : drizzle ? 1.15 : frost ? 0.92 : 1) * (HR.fogK ?? 1);
    scene.fog = new THREE.FogExp2(horizon.clone(), 0.0046 * fogK);
    scene.add(new THREE.HemisphereLight(col(PEARL), col(mix3(FAR, PEARL, 0.25)), 1.5 * HR.amb + 0.25));
    const keyLight = new THREE.DirectionalLight(col(PEARL), 0.5 * HR.amb + 0.1); keyLight.position.set(-0.5, 1, -0.4); scene.add(keyLight);

    // ---------- the Bourdon ----------
    const hero = await buildHero(ctx, { palette: HR.palette, ambient: HR.amb, rime: frost ? 0.85 : 0 });
    const A = hero.anchors, U = hero.uniforms;
    U.uHaloK.value = HR.haloK; U.uAmberK.value = HR.amber; U.uVeinK.value = HR.vein; U.uRim.value = HR.rim; U.uGlassAmb.value = hourName === 'night' ? 0.36 : 0;
    U.uDense.value = lerp(0.62, 0.76, smoothstep(0.4, 1, HR.amb));          // from inside, the Bourdon's upper wall is denser against a bright sky
    const detail = ctx.quality?.detail ?? 1;
    scene.add(hero.object);
    await ctx.yield();

    // ---------- the flight ----------
    const ft = A.flyThrough, seat = A.portalSeat.position, sn = A.portalSeat.normal;
    const side0 = rng.chance(0.5) ? 1 : -1;                               // which side aisle we start in
    const LEAD = [[54 * side0, 6, 505], [54 * side0, 7.5, 470], [52 * side0, 11, 438], [44 * side0, 19, 400], [27 * side0, 26.5, 360], [9 * side0, 32, 318], [0, 35, 270]];
    const LAST = [seat.clone().addScaledVector(sn, 60), seat.clone().addScaledVector(sn, 30), seat.clone()];
    const path = makePath([...LEAD, ft[1], ft[2], ft[3], ft[4], ft[5], ft[6], ft[7], ...LAST]);       // the line we fly
    // Every place and every clearance in the grove is taken from this line by METRES FROM THE START, never by a fraction of its
    // length, so the grove stands where it stands however long the way up inside the bell is. `marks` are the line's points
    // every MARK metres from the start: at the trees' 15 m clearance the nearest mark is within 4 cm of the true distance
    const rightAtDist = (d) => { const t = path.tangentAtDist(d); return V3(-t.z, 0, t.x).normalize(); };
    const LIP_ALONG = 456;                                                // metres from the start to where the line comes under the Bourdon's near lip (60 m from its axis)
    const MARK = 2, marks = []; for (let d = 0; d <= path.length; d += MARK) marks.push(path.posAtDist(d));
    const nearMark = (x, z) => { let b = Infinity, bm = marks[0]; for (const m of marks) { const dx = m.x - x, dz = m.z - z, d = dx * dx + dz * dz; if (d < b) { b = d; bm = m; } } return { dist: Math.sqrt(b), x: bm.x, y: bm.y, z: bm.z }; };
    const routeDist = (x, y, z) => { let b = Infinity; for (const m of marks) { const dx = m.x - x, dy = m.y - y, dz = m.z - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };

    // ---------- bell-trees: rows that leave curving aisles, LOD by distance from the path ----------
    const tr0 = rng.fork('trees'), trees = [];
    const bellClear = (tx, top, H, tz, R) => { for (const f of [0, 0.5, 1]) if (routeDist(tx, top - H * f, tz) < R + 7.5) return false; return true; };
    const finish = (t) => {
      t.tip = V3(t.x + t.dx * t.L, t.Ht - 4, t.z + t.dz * t.L); t.top = t.tip.y - t.tendon; t.bottom = t.top - t.H;
      t.c = V3(t.tip.x, t.top - t.H * 0.5, t.tip.z); t.sd = tr0(); t.pre = 0; t.delay = 0; return t;
    };
    // the bell that tolls right over the basket hangs OVER_ALONG metres from the start: where the line is halfway across from the
    // side aisle to the middle one (27 m off the middle aisle's line, 26.6 m up, a metre past the fifth of its points)
    const OVER_ALONG = 152, pOver = path.posAtDist(OVER_ALONG), rOver = rightAtDist(OVER_ALONG);
    { const R = 11, H = 24, tendon = 7, L = 25, bottom = pOver.y + 9.5;
      const over = finish({ x: pOver.x - rOver.x * L * side0, z: pOver.z - rOver.z * L * side0, dx: rOver.x * side0, dz: rOver.z * side0, L, R, H, tendon, Ht: bottom + H + tendon + 4, lod: 0, lean: 2, rBase: 1.5, fixed: true, isOver: true });
      trees.push(over); }
    // the bell that is already ringing as we arrive: a great gold bell hung low on the entry axis where the path swings away from it,
    // whole and on its crook in the middle of the opening seen through the last portal
    { const R = 11, H = 25, tendon = 7, L = 15, pe = path.posAtDist(0), bottom = 7.5;
      const et = finish({ x: pe.x + 6 * side0 + side0 * L, z: pe.z - 118, dx: -side0, dz: 0, L, R, H, tendon, Ht: bottom + H + tendon + 4, lod: 0, lean: -1.5, rBase: 1.3, fixed: true, isEntry: true });
      et.sd = 0.38; trees.push(et); }                                      // sd 0.4: it re-strikes six seconds after its toll, which is when it teaches the rule
    const ROW = 53, phRow = tr0() * TAU;
    for (let k = -15; k <= 14; k++) {
      const inner = k === -1 || k === 0, x0 = (k + 0.5) * ROW + (inner ? (k === 0 ? 7 : -7) : 0);
      for (let z = -770 + tr0() * 60; z < 770; z += tr0.range(46, 78)) {
        const x = x0 + (inner ? 5 : 15) * Math.sin(z / 160 + k * 1.7 + phRow) + tr0.range(-6, 6), rr = Math.hypot(x, z);
        const Ht0 = tr0.range(42, 90), Rk = tr0.range(0.085, 0.17), tendon = tr0.range(6, 14), Hk = tr0.range(2.1, 2.45), yawJ = tr0.range(-0.7, 0.7), Lk = tr0.range(7, 13), lean = tr0.range(-3, 3);
        if (rr > 765 || rr < 150) continue;
        const dp = nearMark(x, z).dist;
        if (dp < 15 || Math.hypot(x - trees[0].x, z - trees[0].z) < 34 || Math.hypot(x - trees[0].tip.x, z - trees[0].tip.z) < 30) continue;
        if (Math.hypot(x - trees[1].x, z - trees[1].z) < 22 || Math.hypot(x - trees[1].tip.x, z - trees[1].tip.z) < 29) continue;
        const R = clamp(Ht0 * Rk, 4, 15), H = R * Hk, L = Lk + R * 0.3;
        const Ht = Math.max(Ht0, 11 + H + tendon + 4);
        const lod = dp < 80 ? 0 : dp < 195 ? 1 : dp < 390 ? 2 : 3;
        let yaw = (x > Math.round(x / ROW) * ROW ? -1 : 1) * Math.PI / 2 + yawJ, ok = false, t = null;   // lean out over the nearest aisle
        for (let tries = 0; tries < 3 && !ok; tries++) {
          t = finish({ x, z, dx: Math.sin(yaw), dz: Math.cos(yaw), L, R, H, tendon, Ht, lod, lean, rBase: lerp(0.75, 1.5, (Ht - 42) / 48) });
          ok = lod === 3 || (bellClear(t.tip.x, t.top, H, t.tip.z, R) && !(inner && z > 40 && z < 450 && Math.abs(t.tip.x) < R + 21));
          yaw += Math.PI * (tries === 0 ? 1 : 0.5);
        }
        if (ok) trees.push(t);
      }
      if ((k & 3) === 3) await ctx.yield();
    }
    // The stilt house stands at the mooring, HOUSE_ON metres on from it and HOUSE_OFF to the side of the line, and no trunk
    // stands within HOUSE_CLEAR of its middle. The two rows that flank the middle aisle are never planted nearer its line than
    // 22.5 m (33.5 m, less 5 m of sway and 6 m of scatter); TRUNK_OFF is that and the thickest trunk's 1.5 m radius, so every trunk
    // of the grove is at least as far from our line, wherever it runs, as those rows are from the aisle's. A trunk nearer than
    // that is stood back to it, tree and bell together, straight away from the line. No tree is taken out
    const S0 = path.posAtDist(0), HOUSE_ON = 36, HOUSE_OFF = 17, HOUSE_CLEAR = 12, TRUNK_OFF = 24, HX = S0.x + HOUSE_OFF * side0, HZ = S0.z - HOUSE_ON;
    const standBack = (t, fx, fz, need) => {
      const d = Math.hypot(t.x - fx, t.z - fz); if (d >= need || d < 1e-3) return;
      const sx = (t.x - fx) / d * (need - d), sz = (t.z - fz) / d * (need - d);
      t.x += sx; t.z += sz; t.tip.x += sx; t.tip.z += sz; t.c.x += sx; t.c.z += sz;
    };
    for (const t of trees) {
      if (t.fixed) continue;
      standBack(t, HX, HZ, HOUSE_CLEAR);
      const m = nearMark(t.x, t.z); standBack(t, m.x, m.z, TRUNK_OFF);
    }
    trees.sort((a, b) => a.z - b.z);                                      // far end first: painter's order for the glass
    const n = trees.length, overIdx = trees.findIndex((t) => t.isOver), entryTree = trees.find((t) => t.isEntry);
    await ctx.yield();

    // ---------- the toll graph: light hops bell to bell ----------
    const adj = trees.map(() => []), er = rng.fork('edges');
    for (let i = 0; i < n; i++) {
      const a = trees[i].c, best = [];
      for (let j = 0; j < n; j++) { if (j === i) continue; const b = trees[j].c, d = (a.x - b.x) ** 2 + (a.z - b.z) ** 2; if (best.length < 3 || d < best[2][0]) { best.push([d, j]); best.sort((p, q) => p[0] - q[0]); if (best.length > 3) best.pop(); } }
      for (const [d2, j] of best) if (!adj[i].some((e) => e.j === j)) { const w = (Math.sqrt(d2) / 90) * er.range(0.7, 1.3); adj[i].push({ j, w }); adj[j].push({ j: i, w }); }
      if (i % 60 === 59) await ctx.yield();
    }
    const chain = (sources, limit = 0, filter = null) => {
      const arr = new Float64Array(n).fill(Infinity), par = new Int32Array(n).fill(-1), done = new Uint8Array(n), order = [];
      for (const s of sources) if (s.t < arr[s.i]) arr[s.i] = s.t;
      for (;;) {
        let b = -1, bt = Infinity; for (let i = 0; i < n; i++) if (!done[i] && arr[i] < bt) { bt = arr[i]; b = i; }
        if (b < 0) break; done[b] = 1; order.push(b); if (limit && order.length >= limit) break;
        for (const e of adj[b]) { if (done[e.j] || (filter && !filter(trees[e.j]))) continue; const t = bt + e.w; if (t < arr[e.j]) { arr[e.j] = t; par[e.j] = b; } }
      }
      return { arr, par, order };
    };
    const nearest = (x, z, maxLod = 1) => { let b = 0, bd = Infinity; for (let i = 0; i < n; i++) { const t = trees[i]; if (t.lod > maxLod || t.fixed) continue; const d = (t.c.x - x) ** 2 + (t.c.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
    const edges = [];                                                     // [from, to, depart, arrive] for the moths
    const preEvent = (src, base, limit, filter) => {
      const r = chain([{ i: src, t: 0 }], limit, filter);
      for (const i of r.order) { trees[i].pre = Math.min(-0.2, base + r.arr[i]); if (r.par[i] >= 0) edges.push([r.par[i], i, base + r.arr[r.par[i]], base + r.arr[i], 1]); }
      return r.order;
    };
    // the rule is taught by the entry bell: it strikes again, its moths streak out, and the two largest bells among its neighbours
    // further in catch from it, the nearer first. Further in: on the inner side of the aisle and nearer the Bourdon than the entry
    // bell, the way every toll of the grove runs. A neighbour is a bell within NEIGHBOUR metres of the entry bell: as far as this
    // fog still shows a bell as dark stalk and glass (further off it pales toward a bloom), and far enough to reach past the row
    // our own way in has cut, to the row across the middle aisle. The toll crosses at the grove's HOP speed
    const NEIGHBOUR = 120, HOP = 90, base1 = 4.2 - T_STRIKE, cand = [], entryIdx = trees.indexOf(entryTree);
    for (let i = 0; i < n; i++) {
      const t = trees[i], d = Math.hypot(t.c.x - entryTree.c.x, t.c.z - entryTree.c.z);
      if (t.fixed || t.lod > 1 || d > NEIGHBOUR || (t.c.x - entryTree.c.x) * side0 >= 0 || Math.hypot(t.c.x, t.c.z) >= Math.hypot(entryTree.c.x, entryTree.c.z)) continue;
      cand.push({ i, d, R: t.R });
    }
    cand.sort((a, b) => b.R - a.R);
    const e1 = [entryIdx];
    cand.slice(0, 2).sort((a, b) => a.d - b.d).forEach((c) => { const arr = base1 + c.d / HOP; trees[c.i].pre = arr; e1.push(c.i); edges.push([entryIdx, c.i, base1 + 0.05, arr, 2]); });
    const e1set = new Set(e1.map((i) => trees[i]));
    await ctx.yield();
    // the toll over the basket runs away down the aisle ahead: the bells of the two rows that flank our way catch one after the
    // other, nearest first, nine in four seconds, the moths streaking from each to the next across our bow
    const r2 = makeRng(hashSeed('carillon-round2:' + ctx.seed));          // this round's own stream: no existing stream is drawn from
    const e2 = [overIdx];
    {
      const ov = trees[overIdx], base2 = 7.7 - T_STRIKE, aisle = [];
      for (let i = 0; i < n; i++) { const t = trees[i]; if (!t.fixed && t.lod <= 1 && !e1set.has(t) && Math.abs(t.c.x) < 66 && t.c.z < ov.c.z - 10 && t.c.z > 130) aisle.push(i); }
      aisle.sort((a, b) => trees[b].c.z - trees[a].c.z);
      ov.pre = Math.min(-0.2, base2);
      let prev = overIdx, tPrev = base2, tArr = base2 + 0.05;
      for (const i of aisle.slice(0, 9)) {
        tArr += 0.44 * r2.range(0.8, 1.2);
        trees[i].pre = Math.min(-0.2, tArr); trees[i].aisle = true; edges.push([prev, i, tPrev, tArr, 1]); e2.push(i); prev = i; tPrev = tArr;
      }
    }
    // a short chain of five tolls goes off far to starboard as the aisle's shimmer dies: seen only as blooms in the fog. It starts at
    // the bell nearest the place FAR_ALONG metres from the start along the line we fly (where it comes under the Bourdon's near lip,
    // 60 m from the axis) and FAR_STAR metres to starboard of it (three aisles off, where the fog leaves only a bloom to see)
    const FAR_ALONG = LIP_ALONG, FAR_STAR = 3 * ROW, pF = path.posAtDist(FAR_ALONG), rF = rightAtDist(FAR_ALONG), far = (t) => !t.aisle && !e1set.has(t) && !t.fixed;
    const e3 = preEvent(nearest(pF.x + rF.x * FAR_STAR, pF.z + rF.z * FAR_STAR, 2), 11.6 - T_STRIKE, 5, far);
    while (e3.length < 5) {                                                // where the graph runs out the toll hops on to the nearest bell not yet rung: always five
      const from = trees[e3[e3.length - 1]]; let b = -1, bd = Infinity;
      for (let i = 0; i < n; i++) { const t = trees[i]; if (t.lod > 2 || !far(t) || e3.includes(i)) continue; const d = Math.hypot(t.c.x - from.c.x, t.c.z - from.c.z); if (d < bd) { bd = d; b = i; } }
      if (b < 0) break;
      const tArr = from.pre + (bd / HOP) * (0.7 + 0.6 * trees[b].sd);
      trees[b].pre = Math.min(-0.2, tArr); edges.push([e3[e3.length - 1], b, from.pre, tArr, 1]); e3.push(b);
    }
    for (const i of e3) trees[i].farToll = true;
    entryTree.pre = -T_STRIKE - 1.7;                                      // struck just before we came through
    await ctx.yield();
    // the Bourdon's own chain, unlimited
    const srcs = []; for (let i = 0; i < n; i++) { const c = trees[i].c; if (Math.hypot(c.x, c.z) < 250) srcs.push({ i, t: 0.2 + hero.tollArrival(c) * er.range(0.85, 1.15) }); }
    const main = chain(srcs);
    await ctx.yield();
    const EAST = [-0.59, -0.81];
    for (let i = 0; i < n; i++) {
      const t = trees[i], c = t.c;
      t.delay = isFinite(main.arr[i]) ? main.arr[i] : 0.3 + hero.tollArrival(c) * 1.15;
      if (main.par[i] >= 0 && t.lod < 3) edges.push([main.par[i], i, main.arr[main.par[i]], t.delay, 0]);
      if (rare) t.delay = Math.min(t.delay, 5.5 + (770 - (c.x * EAST[0] + c.z * EAST[1])) / 95 * (0.85 + 0.3 * t.sd));   // the answer runs inward from the east
    }
    await ctx.yield();

    // ---------- build the grove into the hero's vertex layout ----------
    const solid = new Buf(), glass = new Buf(), halo = new Buf(), nz = ctx.noise, gr = rng.fork('geo');
    solid.mdec = 2; glass.mdec = 2;                                       // the lake mirror draws the grove at half its grid, without spurs and lips
    const wallCol = (t) => mix3(CELADON, DEEP, t ** 3);
    const addHalo = (c, size, delay, gain, sd, pre, tall = 0, lift = 0, pillar = 0) => {
      halo.set([tall, lift, pillar, 0], [delay, size, sd, gain]); halo.pre = pre;
      const b = halo.count; for (let i = 0; i < 4; i++) halo.v(c.x, c.y, c.z, 0, 1, 0, i & 1, i >> 1, PEARL);
      halo.quad(b, b + 1, b + 2, b + 3);
    };
    const addTree = (t) => {
      const { x, z, Ht, R, L, dx, dz, lod, tip, sd, lean, H, top } = t, sx = -dz, sz = dx;
      const sides = lod === 0 ? 8 : lod === 1 ? 6 : 4, nseg = lod === 0 ? 22 : lod === 1 ? 13 : 8;
      const ctrl = [V3(x, -0.3, z), V3(x - dx * L * 0.1 + sx * lean * 0.4, Ht * 0.3, z - dz * L * 0.1 + sz * lean * 0.4), V3(x - dx * L * 0.06 + sx * lean, Ht * 0.66, z - dz * L * 0.06 + sz * lean),
        V3(x + dx * L * 0.2 + sx * lean * 0.5, Ht * 0.93, z + dz * L * 0.2 + sz * lean * 0.5), V3(x + dx * L * 0.62, Ht + 1.2, z + dz * L * 0.62), V3(tip.x + dx * L * 0.05, tip.y + 3, tip.z + dz * L * 0.05), tip.clone()];
      const nodes = []; if (lod === 0) for (let q = 0.06 + gr() * 0.04; q < 0.9; q += gr.range(0.07, 0.13)) nodes.push(q);
      const node = (q) => { let s = 0; for (const m of nodes) { const d = (q - m) / 0.008; s += Math.exp(-d * d); } return s; };
      const tipR = lod === 2 ? 0.34 : 0.26;
      solid.set([0, 0, 0, 0], [0, 0, sd, 0]); solid.pre = 0;
      tube(solid, spline(ctrl, nseg), sides, (q, ph) => lerp(t.rBase, tipR, Math.pow(q, 0.7)) * (1 + 0.7 * Math.exp(-q * 26)) * (lod === 0 ? 1 + 0.05 * Math.cos(5 * ph) + 0.2 * node(q) : 1),
        (q, ph) => lacq(0.1 + 0.2 * (0.5 + 0.5 * Math.cos(5 * ph)) + 0.3 * node(q) + 0.12 * nz.n2(q * 40 + sd * 9, ph)), { twist: lod === 0 ? (sd - 0.5) * 4 : 0 });
      if (lod === 0) {
        const nR = 3 + Math.floor(sd * 3), a0 = sd * TAU;
        for (let i = 0; i < nR; i++) {                                    // buttress roots
          const a = a0 + (i / nR) * TAU + gr.range(-0.3, 0.3), len = gr.range(3.5, 7), h = gr.range(3, 7), ox = Math.sin(a), oz = Math.cos(a);
          tube(solid, spline([V3(x + ox * 0.5, h, z + oz * 0.5), V3(x + ox * len * 0.4, h * 0.5, z + oz * len * 0.4), V3(x + ox * len * 0.85, 0.5, z + oz * len * 0.85), V3(x + ox * len, -0.3, z + oz * len)], 6), 5,
            (q) => lerp(t.rBase * 0.6, 0.2, q), (q, ph) => lacq(0.12 + 0.2 * Math.cos(3 * ph) ** 2), {});
        }
        for (const m of nodes) {                                          // thorn spurs
          if (m < 0.15 || !gr.chance(0.5)) continue;
          const b = spline(ctrl, 22)[Math.round(m * 22)], a = gr() * TAU, Ls = gr.range(1.6, 3.6);
          solid.mdec = 0; tube(solid, [b.clone(), V3(b.x + Math.sin(a) * Ls * 0.6, b.y + Ls * 0.3, b.z + Math.cos(a) * Ls * 0.6), V3(b.x + Math.sin(a) * Ls, b.y + Ls, b.z + Math.cos(a) * Ls)], 4, (q) => lerp(0.4, 0.05, q), () => lacq(0.2), {}); solid.mdec = 2;
        }
      }
      // the bell, its tendon, clapper and ember: all swing about the crook's tip
      const per = lerp(4, 9, (R - 4) / 11), piv = [tip.x, tip.y, tip.z, per], nv = 12 + Math.floor(sd * 5), fl = 0.14 + 0.1 * ((sd * 7) % 1), sk = 0.26 + 0.1 * ((sd * 13) % 1);
      const segA = lod === 0 ? 30 : lod === 1 ? 16 : 9, segT = lod === 0 ? 14 : lod === 1 ? 8 : 4;
      const bp = (q) => [R * (0.07 + (0.75 - fl) * Math.pow(Math.sin(Math.min(q / sk, 1) * Math.PI / 2), 0.8) + 0.18 * q + fl * q ** 6), top - H * Math.pow(q, 1.15)];
      glass.set(piv, [t.delay, nv, sd, 1]); glass.pre = t.pre;
      lathe(glass, segA, segT, bp, wallCol, tip.x, tip.z);
      if (lod < 2) {
        const lw = 0.03 * R + 0.1;
        glass.set(piv, [t.delay, nv, sd, 3]); glass.mdec = lod === 0 ? 2 : 0;
        lathe(glass, segA, lod === 0 ? 5 : 3, (q) => { const ph = -q * TAU; return [R + 0.05 + lw * Math.cos(ph), top - H - 0.1 + lw * 1.3 * Math.sin(ph)]; }, () => DEEP, tip.x, tip.z);
        glass.mdec = 2;
      }
      solid.set(piv, [t.delay, 0.15, sd, 0]); solid.pre = t.pre;
      tube(solid, [V3(tip.x, tip.y + 0.3, tip.z), V3(tip.x, top + 0.2, tip.z)], lod === 2 ? 3 : 4, () => (lod === 2 ? 0.26 : 0.17), () => lacq(0.3), {});
      if (lod < 2) {
        solid.mdec = 0;
        blob(solid, V3(tip.x, top + 0.1, tip.z), R * 0.12, R * 0.1, R * 0.12, 6, 4, () => lacq(0.35));
        tube(solid, [V3(tip.x, top, tip.z), V3(tip.x, top - H * 0.76, tip.z)], 3, () => 0.1, () => lacq(0.2), {});
        solid.mdec = 2;
      }
      const er0 = lod === 2 ? 0.2 : 0.14;
      solid.set(piv, [t.delay, 0, sd, 1]);
      blob(solid, V3(tip.x, top - H * 0.8, tip.z), R * er0, R * er0 * 1.3, R * er0, lod === 0 ? 8 : lod === 1 ? 6 : 4, lod === 0 ? 6 : lod === 1 ? 4 : 2, () => GOLD);
      solid.pre = 0;
      addHalo(t.c, R * (t.farToll ? 8 : 5), t.delay, t.farToll ? 0.26 : 0.16, sd, t.pre);
    };
    let built = 0;
    for (const t of trees) {
      if (t.lod === 3) { const hp = t.R * (5 + 5 * t.sd); addHalo(t.c, t.R * 2.6, t.delay, 0.8, t.sd, t.pre, hp / (t.R * 2.6 * 1.3) - 1, hp * 0.8, 1); } else addTree(t);
      if (t.lod === 0 || ++built % 6 === 0) await ctx.yield();
    }
    // the chain goes on past the limit of sight: beyond the last bell-trees with any shape, the grove is seen only as blooms in
    // the fog, each catching in its turn at the chain's own pace, so the gold is still spreading outward while we climb the Bourdon
    {
      const NF = Math.round(300 * (0.5 + 0.5 * detail));
      for (let i = 0; i < NF; i++) {
        const a = r2() * TAU, rr = Math.sqrt(lerp(775 * 775, 1560 * 1560, r2())), R = r2.range(6, 13), c = V3(Math.sin(a) * rr, r2.range(22, 60), Math.cos(a) * rr), sd = r2();
        let delay = 0.3 + hero.tollArrival(c) * 1.15 * r2.range(0.9, 1.2);
        if (rare) delay = Math.min(delay, 5.5 + (770 - (c.x * EAST[0] + c.z * EAST[1])) / 95 * (0.85 + 0.3 * sd));
        const hp = R * (6 + 7 * sd); addHalo(c, R * 2.8, delay, 0.8, sd, 0, hp / (R * 2.8 * 1.3) - 1, hp * 0.8, 1);
      }
    }
    await ctx.yield();

    // tuning platforms round four bells near the aisle, ladders hanging to the water
    const platTrees = trees.filter((t) => t.lod === 0 && !t.fixed && t.z > 120 && t.z < 420 && t.bottom > 13 && routeDist(t.c.x, t.bottom, t.c.z) > t.R + 13)
      .sort((a, b) => nearMark(a.c.x, a.c.z).dist - nearMark(b.c.x, b.c.z).dist).slice(0, 4);
    // A LADDER KEEPS 2 M OF CLEAR AIR FROM THE WHOLE LINE WE FLY, HOWEVER ITS BELL SWINGS. The ladder hangs with its
    // platform from the crook's tip and swings about it as the part's vertex shader has it (the pendulum of
    // src/parts/carillon-grove.js): a turn about the level axis at SWING_AXIS times the tree's sd, by the rest swing, SWING_REST
    // radians at any phase of the world's clock, and by SWING_TOLL radians more from the second a toll has reached the bell,
    // dying over TOLL_FADE seconds (the Bourdon's chain, from t.delay) or over PRE_FADE seconds (an earlier, scripted toll,
    // from t.pre, where the shader finds one: under -0.001). The line is asked every FINE metres from end to end (a sixteenth
    // of MARK: a fineness, not a clearance), each place with the toll's own second there (the sum update makes), and at each
    // place the ladder is tried at every angle the pendulum can have there (in steps that move it half of FINE at most). The
    // ladder is taken as the panel between the middles of its two ropes (LADDER_SIDE to either side of its middle line, from
    // the water to the platform) with a rope's radius LADDER_ROPE round it: the 0.4 and 0.11 it is built with below; the
    // rungs lie within. Nowhere may it come nearer the line than LADDER_CLEAR: 2 m of clear air between our line and the
    // ladder's ropes, and two steps of the asking, for the places and the angles between those asked. A ladder dealt a place that fails is turned round its platform plank by plank, the smallest turn first
    // and of two equal turns that both pass the one that hangs further from the line; if no plank passes it is not hung.
    // The dealt place is drawn from the chance stream as ever, whatever becomes of it.
    const SWING_REST = 0.035, SWING_TOLL = 0.105, TOLL_FADE = 16, PRE_FADE = 9, SWING_AXIS = 37, LADDER_SIDE = 0.4, LADDER_ROPE = 0.11;
    const FINE = MARK / 16, LADDER_CLEAR = 2 + 2 * FINE;
    const fine = []; for (let i = 0, nf = Math.ceil(path.length / FINE); i <= nf; i++) { const d = Math.min(path.length, i * FINE), p = path.posAtDist(d); fine.push([p.x, p.y, p.z, (d / path.length) * DURATION - T_STRIKE]); }
    for (const t of platTrees) {
      await ctx.yield();
      const GR = t.R + 2.3, GY = t.bottom + 1.0, N = Math.round(GR * 2.4), cx = t.c.x, cz = t.c.z;
      const gp = (a, r, y) => V3(cx + Math.sin(a) * r, y, cz + Math.cos(a) * r);
      const piv = [t.tip.x, t.tip.y, t.tip.z, lerp(4, 9, (t.R - 4) / 11)];   // the whole platform hangs from the crook and swings with its bell
      solid.pre = t.pre;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * TAU, a1 = ((i + 0.84) / N) * TAU, am = (a0 + a1) / 2, sag = 0.2 * Math.sin(i * 1.9);
        solid.set(piv, [t.delay, 0.12, t.sd, 3]); gr();
        tube(solid, [gp(a0, GR, GY + sag), gp(a1, GR, GY + sag)], 4, () => 0.9, () => mix3(WOOD, FAR, gr() * 0.6), { ref: V3(Math.sin(am), 0, Math.cos(am)), phase: Math.PI / 4, flat: 0.12 });
        if (i % 5 === 0) { solid.set(piv, [t.delay, 0.13, t.sd, 3]); tube(solid, [gp(am, GR + 0.6, GY + sag), V3(t.tip.x, t.tip.y, t.tip.z)], 4, () => 0.13, () => ROPE, {}); }
        if (i % 9 === 2) { solid.set(piv, [t.delay, 0, t.sd, 2]); gr(); blob(solid, gp(am, GR + 0.7, GY + sag + 1.5), 0.38, 0.5, 0.38, 6, 4, () => PEARL); }
      }
      solid.set(piv, [t.delay, 0.15, t.sd, 3]); gr();
      for (const rr of [GR + 0.85, GR - 0.85]) { const sp = []; for (let i = 0; i <= 28; i++) sp.push(gp((i / 28) * TAU, rr, GY - 0.12)); tube(solid, sp, 4, () => 0.15, () => ROPE, {}); }   // stringers under the planks
      { const sp = []; for (let i = 0; i <= 28; i++) sp.push(gp((i / 28) * TAU, GR + 0.9, GY + 1.15)); tube(solid, sp, 4, () => 0.15, () => ROPE, {}); }                                    // handrail
      const la0 = gr() * TAU;                                              // the place the ladder is dealt: the same draw as ever, whether it is kept, turned or not hung
      const hx = Math.cos(t.sd * SWING_AXIS), hz = Math.sin(t.sd * SWING_AXIS);   // the level axis this bell, its platform and its ladder swing about
      const swing = fine.map((f) => SWING_REST + (f[3] > t.delay ? SWING_TOLL * Math.exp(-(f[3] - t.delay) / TOLL_FADE) : 0) + (t.pre < -0.001 && f[3] > t.pre ? SWING_TOLL * Math.exp(-(f[3] - t.pre) / PRE_FADE) : 0));
      // the distance from a point to the ladder hung at angle a, hanging still; and how near the line comes to it so
      const hang = (a) => { const b = gp(a, GR + 1, 0), ux = Math.cos(a), uz = -Math.sin(a); return (x, y, z) => Math.hypot(Math.max(0, Math.abs((x - b.x) * ux + (z - b.z) * uz) - LADDER_SIDE), (x - b.x) * uz - (z - b.z) * ux, Math.max(0, y - GY, -0.2 - y)) - LADDER_ROPE; };
      const still = (a) => { const off = hang(a); let least = Infinity; for (const f of fine) least = Math.min(least, off(f[0], f[1], f[2])); return least; };
      const clear = (a) => {                                               // does the whole line keep LADDER_CLEAR from the ladder hung at angle a, at every angle of its swing
        const off = hang(a);
        for (let i = 0; i < fine.length; i++) {
          const f = fine[i], qx = f[0] - piv[0], qy = f[1] - piv[1], qz = f[2] - piv[2], reach = swing[i] * Math.hypot(qx, qy, qz);
          if (off(f[0], f[1], f[2]) - reach >= LADDER_CLEAR) continue;         // a turn of g radians about the tip carries nothing further than g times its distance from the tip
          const steps = Math.ceil(2 * reach / FINE), along = hx * qx + hz * qz;
          for (let k = -steps; k <= steps; k++) {                           // the place turned back about the axis, against the ladder hanging still: the same distance
            const g = swing[i] * k / steps, c = Math.cos(g), sn = Math.sin(g);
            if (off(piv[0] + qx * c - hz * qy * sn + hx * along * (1 - c), piv[1] + qy * c + (hz * qx - hx * qz) * sn, piv[2] + qz * c + hx * qy * sn + hz * along * (1 - c)) < LADDER_CLEAR) return false;
          }
        }
        return true;
      };
      let la = la0, hung = clear(la0);
      for (let k = 1; !hung && k <= N / 2; k++) { const a1 = la0 + k * TAU / N, a2 = la0 - k * TAU / N, c1 = clear(a1), c2 = clear(a2); if (c1 || c2) { la = c1 && c2 ? (still(a1) >= still(a2) ? a1 : a2) : c1 ? a1 : a2; hung = true; } }
      const tx = Math.cos(la), tz = -Math.sin(la);
      solid.set(piv, [t.delay, 0.11, t.sd, 3]);
      if (hung) for (const s of [-0.4, 0.4]) { const b = gp(la, GR + 1, GY); tube(solid, [V3(b.x + tx * s, GY, b.z + tz * s), V3(b.x + tx * s, -0.2, b.z + tz * s)], 4, () => 0.11, () => ROPE, {}); }
      solid.set(piv, [t.delay, 0.09, t.sd, 3]);
      if (hung) for (let y = 1; y < GY; y += 1.6) { const c = gp(la, GR + 1, y); tube(solid, [V3(c.x - tx * 0.45, y, c.z - tz * 0.45), V3(c.x + tx * 0.45, y, c.z + tz * 0.45)], 3, () => 0.09, () => WOOD, {}); }
      solid.pre = 0;
    }
    await ctx.yield();

    // sedge hummocks break the mirror near the path
    // hummocks stand beside the line from the start to HUM_TO metres along it: there the line is 92 m from the Bourdon's axis, at
    // the edge of its root apron (nothing is planted within 100 m of the axis)
    const hum = [], hr = rng.fork('hum'), HUM_TO = 424;
    for (let i = 0, tries = 0; i < Math.round(46 * dens) && tries < 600; tries++) {
      const d = hr.range(0, HUM_TO), p = path.posAtDist(d), r = rightAtDist(d), lat = (hr.chance(0.5) ? 1 : -1) * (7 + 130 * Math.pow(hr(), 1.7));
      const x = p.x + r.x * lat, z = p.z + r.z * lat, rad = hr.range(1.5, 4);
      if (Math.hypot(x, z) < 100 || trees.some((t) => t.lod < 3 && Math.hypot(t.x - x, t.z - z) < 5) || hum.some((h) => Math.hypot(h.x - x, h.z - z) < h.rad + rad + 2)) continue;
      hum.push({ x, z, rad, sd: hr() }); i++;
      solid.set([0, 0, 0, 0], [0, 0, hr(), 3]);
      const rz = rad * hr.range(0.6, 1), ya = hr() * TAU;
      hum[hum.length - 1].rz = rz;
      const MOSS = mix3(mix3(FAR, DEEP, 0.55), CELADON, 0.22);
      blob(solid, V3(x, -0.35, z), rad, 1.25, rz, 14, 6, (q, a) => mix3(LACQ, MOSS, clamp(0.02 + 0.95 * (1 - q) * (1 - q) + 0.3 * nz.n2(x + a * 2, z + q * 3), 0, 1)),
        (a, q) => 1 + 0.26 * Math.sin(a * 3 + ya) + 0.14 * Math.sin(a * 5 + ya * 2) + 0.4 * (1 - q) * nz.n2(x * 0.7 + Math.sin(a) * 2.2, z * 0.7 + Math.cos(a) * 2.2));
      for (let j = 0; j < 3; j++) {                                       // tussocks: smaller lumps riding the big one
        const a = hr() * TAU, rr = hr.range(0.25, 0.7), sr = rad * hr.range(0.22, 0.4);
        blob(solid, V3(x + Math.sin(a) * rad * rr, 0.25, z + Math.cos(a) * rz * rr), sr, hr.range(0.5, 0.95), sr * 0.85, 7, 4, (q) => mix3(LACQ, MOSS, 0.15 + 0.8 * (1 - q)));
      }
      solid.mdec = 0;                                                     // the wet black margin where it meets the water
      blob(solid, V3(x, 0.05, z), rad * 1.2, 0.05, rz * 1.2, 14, 2, () => [LACQ[0] * 0.5, LACQ[1] * 0.5, LACQ[2] * 0.5], (a) => 1 + 0.1 * Math.sin(a * 3 + ya) + 0.06 * Math.sin(a * 7 + ya * 3));
      solid.mdec = 2;
      if (hum.length % 3 === 0) await ctx.yield();
    }
    await ctx.yield();

    // the tender's stilt house, its moored punt and the mooring post we have just cast off from
    const hyaw = side0 > 0 ? -0.5 : 0.5;
    const hl = (lx, lz) => [HX + lx * Math.cos(hyaw) + lz * Math.sin(hyaw), HZ - lx * Math.sin(hyaw) + lz * Math.cos(hyaw)];
    solid.set([0, 0, 0, 0], [0, 0, 0.3, 3]);
    for (const lx of [-3.6, 0, 3.6]) for (const lz of [-3, 3]) { const [px, pz] = hl(lx, lz); tube(solid, [V3(px + lx * 0.08, -0.3, pz), V3(px, 4.7, pz)], 5, () => 0.2, () => lacq(0.3), {}); }
    box(solid, HX, 4.75, HZ, 8.6, 0.3, 7.4, hyaw, WOOD);
    box(solid, HX, 6.5, HZ, 5.2, 3.2, 4.4, hyaw, mix3(WOOD, LACQ, 0.45));
    { const hc = Math.cos(hyaw), hs = Math.sin(hyaw), hv = (x, y, z) => V3(x * hc + z * hs, y, -x * hs + z * hc), hp = (x, y, z) => { const [wx, wz] = hl(x, z); return V3(wx, y, wz); };
      const ROOF = mix3(LACQ, FAR, 0.4), th = Math.atan2(2.1, 3.05), ct = Math.cos(th), st = Math.sin(th);
      for (const sg of [-1, 1]) {                                         // pitched roof: two sloped slabs with eaves, shingle battens
        obox(solid, hp(0, 9.2, sg * 1.5), hv(3.5, 0, 0), hv(0, 0.1 * ct, 0.1 * st * sg), hv(0, -1.85 * st * sg, 1.85 * ct), ROOF);
        for (let b = 0; b < 5; b++) { const f = -0.8 + b * 0.4; obox(solid, hp(0, 9.2 - f * 1.85 * st + 0.13, sg * (1.5 + f * 1.85 * ct)), hv(3.56, 0, 0), hv(0, 0.05 * ct, 0.05 * st * sg), hv(0, -0.07 * st * sg, 0.07 * ct), mix3(LACQ, FAR, 0.7)); }
      }
      box(solid, HX, 8.45, HZ, 5.2, 0.75, 3.1, hyaw, mix3(WOOD, LACQ, 0.45)); box(solid, HX, 9.15, HZ, 5.2, 0.7, 1.7, hyaw, mix3(WOOD, LACQ, 0.45));   // gable
      solid.set([0, 0, 0, 0], [0, 0.16, 0.3, 3]); tube(solid, [hp(-3.6, 10.32, 0), hp(3.6, 10.32, 0)], 5, () => 0.16, () => lacq(0.2), {});          // ridge pole
      solid.set([0, 0, 0, 0], [0, 0.07, 0.3, 3]);                         // deck railing
      const rc = [[-4.2, -3.6], [4.2, -3.6], [4.2, 3.6], [-4.2, 3.6]];
      for (let e = 0; e < 4; e++) {
        const [x0, z0] = rc[e], [x1, z1] = rc[(e + 1) % 4], np = e % 2 ? 4 : 5;
        for (const y of [5.35, 5.9]) tube(solid, [hp(x0, y, z0), hp(x1, y, z1)], 4, () => 0.07, () => ROPE, {});
        for (let k = 0; k < np; k++) { const f = k / np; tube(solid, [hp(lerp(x0, x1, f), 4.9, lerp(z0, z1, f)), hp(lerp(x0, x1, f), 6.0, lerp(z0, z1, f))], 4, () => 0.08, () => lacq(0.3), {}); }
      }
      const ls = side0 > 0 ? -1 : 1;                                      // a cold lamp hung from the ridge end, on the side we leave by
      tube(solid, [hp(ls * 3.5, 10.3, 0), hp(ls * 4.5, 10.45, 0)], 4, () => 0.07, () => lacq(0.3), {}); tube(solid, [hp(ls * 4.4, 10.42, 0), hp(ls * 4.4, 9.3, 0)], 4, () => 0.05, () => ROPE, {});
      solid.set([0, 0, 0, 0], [0, 0, 0.47, 2]); blob(solid, hp(ls * 4.4, 9.0, 0), 0.3, 0.4, 0.3, 8, 5, () => PEARL);
      solid.set([0, 0, 0, 0], [0, 0, 0.3, 3]); }
    { const [cx2, cz2] = hl(1.5, -1.2); tube(solid, [V3(cx2, 8.6, cz2), V3(cx2, 11.6, cz2)], 5, () => 0.28, () => lacq(0.4), {}); }
    { const [lx, lz] = hl(-4.6, 2.2); solid.set([0, 0, 0, 0], [0, 0.07, 0.3, 3]); for (const s of [-0.35, 0.35]) tube(solid, [V3(lx + s, 4.7, lz), V3(lx + s, -0.2, lz)], 4, () => 0.07, () => ROPE, {}); for (let y = 0.6; y < 4.7; y += 0.8) tube(solid, [V3(lx - 0.35, y, lz), V3(lx + 0.35, y, lz)], 3, () => 0.06, () => WOOD, {}); solid.set([0, 0, 0, 0], [0, 0, 0.3, 3]); }
    { const wside = side0 > 0 ? -1 : 1; solid.set([0, 0, 0, 0], [0, 0.4, 0.61, 2]);             // the lit window faces the way we leave, cold celadon-white
      const [wx, wz] = hl(wside * 2.63, 0.5); box(solid, wx, 6.75, wz, 0.08, 0.95, 1.15, hyaw, PEARL);
      const [w2x, w2z] = hl(0.4, 2.23); box(solid, w2x, 6.75, w2z, 0.9, 0.85, 0.08, hyaw, PEARL);
      solid.set([0, 0, 0, 0], [0, 0, 0.3, 3]);
      const [w3x, w3z] = hl(wside * 2.68, 0.5); box(solid, w3x, 6.75, w3z, 0.1, 1.0, 0.09, hyaw, LACQ); box(solid, w3x, 6.75, w3z, 0.1, 0.09, 1.2, hyaw, LACQ);
      const [w4x, w4z] = hl(0.4, 2.28); box(solid, w4x, 6.75, w4z, 0.09, 0.9, 0.1, hyaw, LACQ); box(solid, w4x, 6.75, w4z, 0.95, 0.09, 0.1, hyaw, LACQ); }
    solid.set([0, 0, 0, 0], [0, 0, 0.3, 3]);
    { const [bx, bz] = hl(side0 > 0 ? -7.5 : 7.5, 1); blob(solid, V3(bx, 0.12, bz), 0.9, 0.42, 3.4, 10, 4, () => mix3(WOOD, LACQ, 0.3)); tube(solid, [V3(bx + 0.5, 0.2, bz - 2.4), V3(bx + 1.1, 4.4, bz - 3.2)], 3, () => 0.05, () => ROPE, {}); }
    await ctx.yield();
    const POST = V3(S0.x - 8.5 * side0, 0, S0.z - 13);
    tube(solid, [V3(POST.x, -0.3, POST.z), V3(POST.x + 0.15, 3.2, POST.z)], 5, (q) => 0.2 + 0.1 * Math.exp(-(1 - q) * 9), () => lacq(0.35), {});
    solid.set([0, 0, 0, 0], [0, 0, 0.83, 2]); blob(solid, V3(POST.x + 0.15, 3.65, POST.z), 0.22, 0.3, 0.22, 6, 4, () => PEARL);
    await ctx.yield();

    const M = hero.materials;
    const Y = () => ctx.yield();
    const solidGeo = await solid.geometry(Y), glassGeo = await glass.geometry(Y), haloGeo = await halo.geometry(Y);
    const big = new THREE.Sphere(V3(0, 40, 0), 1600);
    for (const g of [solidGeo, glassGeo, haloGeo]) { g.boundingSphere = big; g.userData.mirror.boundingSphere = big; }
    const solidMesh = new THREE.Mesh(solidGeo, M.solid), glassMesh = new THREE.Mesh(glassGeo, M.glass), haloMesh = new THREE.Mesh(haloGeo, M.halo);
    glassMesh.renderOrder = 3.2; haloMesh.renderOrder = 4;
    scene.add(solidMesh, glassMesh, haloMesh);
    await ctx.yield();

    // ---------- ground-bells: drifts of nodding snowdrops, each with a pinpoint ember ----------
    const gbr = rng.fork('gb'), GBN = Math.round(3000 * dens * (0.4 + 0.6 * detail)), gPos = new Float32Array(GBN * 4), gToll = new Float32Array(GBN * 4), sPos = new Float32Array(GBN * 3);
    const BIRD = V3(S0.x - 9 * side0, 0, S0.z - 74);                       // 30 m ahead and a little to port at the moment its fuse runs
    const nearTrees = trees.filter((t) => t.lod < 3);
    const drifts = [{ x: BIRD.x + 14 * side0, z: BIRD.z - 16, s: 13 }, { x: 0, z: 0, s: 34 }];
    for (let i = 0; i < Math.round(11 * dens); i++) {                    // drifts beside the line from 21 m along it (clear of the mooring's own water) to the root apron
      const d = gbr.range(21, HUM_TO), p = path.posAtDist(d), r = rightAtDist(d), lat = (gbr.chance(0.5) ? 1 : -1) * (5 + 105 * Math.pow(gbr(), 1.6));
      drifts.push({ x: p.x + r.x * lat, z: p.z + r.z * lat, s: gbr.range(9, 21) });
    }
    let gi = 0;
    const putBell = (x, z, pre) => {
      let bt = null, bd = Infinity; for (const t of nearTrees) { const d = (t.c.x - x) ** 2 + (t.c.z - z) ** 2; if (d < bd) { bd = d; bt = t; } }
      const sc = gbr.range(1, 2) * (pre < 0 ? 1.5 : 1), yaw = gbr() * TAU, sd = gbr();
      let delay = bt ? bt.delay + Math.sqrt(bd) / 45 + sd * 0.25 : 3;
      if (Math.hypot(x, z) < 110) delay = 0.4 + Math.hypot(x, z) / 60 + sd * 0.3;
      gPos.set([x, z, sc, yaw], gi * 4); gToll.set([pre, delay, sd, sc], gi * 4);
      sPos.set([x + 0.31 * sc * Math.cos(yaw), 0.62 * sc, z - 0.31 * sc * Math.sin(yaw)], gi * 3); gi++;
    };
    // the fuse the tuner-bird lights: thirty tall ground-bells in a wriggling line from its beak right across our way
    for (let i = 0; i < 30; i++) putBell(BIRD.x + side0 * (2.2 + i * 1.3), BIRD.z - 1.5 - 2.6 * Math.sin(i * 0.5) - i * 0.22, 1.15 - T_STRIKE + i * 0.055);
    for (const h of hum) for (let j = 0; j < 6 && gi < GBN; j++) { const a = hr() * TAU, k = hr.range(0.82, 1.08); putBell(h.x + Math.sin(a) * h.rad * k, h.z + Math.cos(a) * h.rz * k, 0); }   // a few nod on every hummock
    for (let tries = 0; gi < GBN && tries < GBN * 4; tries++) {
      if (tries % 40 === 39) await ctx.yield();
      const d = drifts[tries % drifts.length], x = d.x + gbr.gauss() * d.s, z = d.z + gbr.gauss() * d.s * 1.3, pn = nearMark(x, z);
      if (pn.dist < 3 && pn.y < 14) continue;
      putBell(x, z, 0);
    }
    await ctx.yield();
    {
      const P0 = [], Nn = [], K = [], I = [];
      const stem = [[0, 0], [0, 0.55], [0.06, 0.88], [0.2, 1.0], [0.31, 0.9]];
      for (let i = 0; i < stem.length; i++) for (const s of [-1, 1]) { P0.push(stem[i][0], stem[i][1], s * 0.024); Nn.push(0, 0, 1); K.push(0, i / 4); }
      for (let i = 0; i < stem.length - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      const b0 = P0.length / 3;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU, r = j ? 0.17 : 0.045; P0.push(0.31 + Math.cos(a) * r, j ? 0.6 : 0.9, Math.sin(a) * r); Nn.push(Math.cos(a), 0.4, Math.sin(a)); K.push(1, j); }
      for (let i = 0; i < 5; i++) { const a = b0 + i, b = b0 + (i + 1) % 5; I.push(a, b, a + 5, a + 5, b, b + 5); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P0, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
      g.setIndex(I); g.setAttribute('iPos', new THREE.InstancedBufferAttribute(gPos, 4)); g.setAttribute('iToll', new THREE.InstancedBufferAttribute(gToll, 4));
      g.instanceCount = gi; g.boundingSphere = big;
      var uDrizzle = { value: drizzle ? 1 : 0 }, uPale = { value: col(mix3(PEARL, [1, 1, 1], 0.3)).multiplyScalar(HR.amb * 0.9 + 0.1) }, uLacq = { value: col(LACQ) };
      const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
      var mkMat = (vs, fs, uni, extra) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), uS: U.uS, uTime: U.uTime, uAfter: U.uAfter, uGold: U.uGold, uSky: U.uSky, uAmb: U.uAmb, uPx: U.uPx, ...uni }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
      const gbMat = mkMat(GB_VERT, GB_FRAG, { uBody: U.uBody, uLip: U.uLip, uLacq }, { side: THREE.DoubleSide });
      var gbMesh = new THREE.Mesh(g, gbMat); scene.add(gbMesh);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sPos.subarray(0, gi * 3), 3)); sg.setAttribute('iToll', new THREE.BufferAttribute(gToll.subarray(0, gi * 4), 4)); sg.boundingSphere = big;
      var ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
      var sparkMat = mkMat(SPARK_VERT, SPARK_FRAG, { uDrizzle }, ADD);
      var sparks = new THREE.Points(sg, sparkMat); sparks.renderOrder = 4.5; scene.add(sparks);
      const ep = new Float32Array(n * 3), et = new Float32Array(n * 4);                  // every clapper's pilot ember, a field of gold points receding into the fog
      trees.forEach((t, i) => { ep.set([t.c.x, t.top - t.H * 0.8, t.c.z], i * 3); et.set([t.pre, t.delay, t.sd, t.R * (t.lod === 3 ? 0.8 : 0.55)], i * 4); });
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); eg.setAttribute('iToll', new THREE.BufferAttribute(et, 4)); eg.boundingSphere = big;
      var embers = new THREE.Points(eg, sparkMat); embers.renderOrder = 4.4; scene.add(embers);
    }
    await ctx.yield();

    // ---------- sedge on the hummocks ----------
    {
      const SPH = Math.round(40 * (0.5 + 0.5 * detail)), cnt = hum.length * SPH, iP = new Float32Array(cnt * 4), iS = new Float32Array(cnt * 4); let k = 0;
      for (const h of hum) {
        let bt = null, bd = Infinity; for (const t of nearTrees) { const d = (t.c.x - h.x) ** 2 + (t.c.z - h.z) ** 2; if (d < bd) { bd = d; bt = t; } }
        for (let i = 0; i < SPH; i++, k++) {
          const a = hr() * TAU, r = Math.sqrt(hr()) * 0.85;
          iP.set([h.x + Math.sin(a) * r * h.rad, 0.15 + 0.6 * (1 - r), h.z + Math.cos(a) * r * h.rz, hr() * TAU], k * 4);
          iS.set([hr(), bt ? bt.delay + Math.sqrt(bd) / 60 : 3, bt ? bt.pre : 0, hr.range(2.5, 5) * (1 - 0.35 * r)], k * 4);
        }
      }
      const g = new THREE.InstancedBufferGeometry(), q = [], uvs = [], I = [];
      for (let c = 0; c < 2; c++) { const b = q.length / 3; for (const [x, y] of [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]]) { q.push(c ? 0 : x, y, c ? x : 0); uvs.push(x + 0.5, y); } I.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(I);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iSd', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = k; g.boundingSphere = big;
      var sedge = new THREE.Mesh(g, mkMat(SEDGE_VERT, SEDGE_FRAG, { uLacq, uRime: { value: frost ? 0.8 : 0 } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false }));
      sedge.renderOrder = 2; scene.add(sedge);
    }

    // ---------- moths on the edges of the graph ----------
    {
      const mr = rng.fork('moths'), mp = [], mb = [], mt = [];
      for (const [a, b, dep, arr, isPre] of edges) {
        const A2 = trees[a], B2 = trees[b]; if (A2.lod === 3 && B2.lod === 3) continue;
        const cnt = isPre === 2 ? 90 : isPre ? 22 : Math.max(A2.lod, B2.lod) <= 1 ? 14 : 6;
        for (let i = 0; i < cnt && mp.length < Math.round(6000 * detail) * 3; i++) {
          const an = mr() * TAU, hA = mr.range(-0.45, 0.45), an2 = mr() * TAU;
          mp.push(A2.c.x + Math.sin(an) * A2.R * 0.9, A2.c.y + hA * A2.H, A2.c.z + Math.cos(an) * A2.R * 0.9);
          mb.push(B2.c.x + Math.sin(an2) * B2.R, B2.c.y + mr.range(-0.4, 0.4) * B2.H, B2.c.z + Math.cos(an2) * B2.R);
          mt.push(dep + mr() * 0.35, arr + mr.range(0, 0.5), mr(), mr.range(0.4, 0.85) * (isPre === 2 ? 2 : 1));
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(mb, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(mt, 4)); g.boundingSphere = big;
      var PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
      var moths = new THREE.Points(g, mkMat(MOTH_VERT, MOTH_FRAG, { uPale: frost ? { value: new THREE.Color(1.2, 1.3, 1.4).multiplyScalar(HR.amb * 0.7 + 0.3) } : uPale }, PREMULT));
      moths.renderOrder = 5; scene.add(moths);
    }
    if (cast.striders) {
      const sr = rng.fork('striders'), cnt = Math.round(300 * dens), sp = new Float32Array(cnt * 3), sd = new Float32Array(cnt * 4);
      for (let i = 0; i < cnt; i++) {                                     // on the water beside the line as far as 438 m along it, 18 m short of the Bourdon's lip
        const d = sr.range(0, 438), p = path.posAtDist(d), r = rightAtDist(d), lat = (sr.chance(0.5) ? 1 : -1) * (2 + 60 * Math.pow(sr(), 1.5));
        sp.set([p.x + r.x * lat, 0.06, p.z + r.z * lat], i * 3); sd.set([sr(), sr(), sr(), sr.range(1.5, 5)], i * 4);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aSd', new THREE.BufferAttribute(sd, 4)); g.boundingSphere = big;
      const striders = new THREE.Points(g, mkMat(STRIDER_VERT, STRIDER_FRAG, { uLacq }, PREMULT)); striders.renderOrder = 1.5; scene.add(striders);
    }
    await ctx.yield();

    // ---------- sky and lake ----------
    const zen0 = new THREE.Color(HR.zenith), zen1 = new THREE.Color(HR.zenithAfter), band0 = new THREE.Color(HR.band), band1 = new THREE.Color(HR.bandAfter);
    const baz = new THREE.Vector2(HR.bandAz[0] * (hourName === 'lilac' ? side0 : 1), HR.bandAz[1]).normalize();
    const skyU = { uHorizon: { value: horizon }, uZenith: { value: zen0.clone() }, uBand: { value: band0.clone() }, uGold: U.uGold, uFogCol: { value: horizon }, uBandAz: { value: baz },
      uAnsAz: { value: new THREE.Vector2(EAST[0], EAST[1]) }, uStars: { value: HR.stars * (thick ? 0.2 : 1) }, uTime: U.uTime, uAnswer: { value: 0 }, uDawn: { value: 0 }, uSkyPow: { value: HR.skyPow }, uBandE: { value: new THREE.Vector2(...(HR.bandE ?? [0.1, 0.075])) }, uGlow: { value: HR.glow * (thick ? 0.5 : 1) } };
    U.uLightAz.value.copy(baz);                                           // the bright band of the sky lights the Bourdon's glass from that side
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    const rings = []; for (let i = 0; i < 8; i++) rings.push(new THREE.Vector4(0, 0, 1e5, 10));
    {
      const ringTrees = [trees[e1[1] ?? overIdx], trees[overIdx], trees[e2[1] ?? overIdx], trees[e2[3] ?? overIdx], entryTree];
      const after = nearTrees.filter((t) => t.lod === 0 && !t.pre && t.z > 70).sort((a, b) => b.z - a.z);
      for (let i = 0; ringTrees.length < 8 && i < after.length; i += Math.max(1, Math.floor(after.length / 4))) ringTrees.push(after[i]);
      ringTrees.forEach((t, i) => { if (t && i < 8) rings[i].set(t.c.x, t.c.z, (t.pre < 0 ? t.pre : t.delay) + 0.9, t.R * 0.8); });
    }
    const lakeU = { uDeep: { value: new THREE.Color(HR.deep) }, uSky: U.uSky, uGold: U.uGold, uS: U.uS, uTime: U.uTime, uDrizzle, uIce: { value: frost ? 1 : 0 }, uIceAmb: { value: lerp(HR.amb, 1, 0.2) }, uFish: { value: cast.striders ? 0.35 : 1 },
      uGoldK: { value: 0 }, uColK: { value: hourName === 'night' ? 0.8 : 3.4 }, uDens: { value: 0.004 }, uRings: { value: rings }, uWake: { value: [new THREE.Vector4(0, 0, 0, -1), new THREE.Vector4(0, 0, 1, 0)] }, uWakeK: { value: new THREE.Vector2(0, 0) },
      uBird: { value: Array.from({ length: 6 }, () => new THREE.Vector3(0, 1e5, 3.8)) }, uBirdCol: { value: new THREE.Color(0, 0, 0) } };
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), new THREE.ShaderMaterial({ uniforms: lakeU, vertexShader: LAKE_VERT, fragmentShader: LAKE_FRAG, ...PREMULT }));
    lake.rotation.x = -Math.PI / 2; lake.renderOrder = 0.9; scene.add(lake);

    // ---------- the mirror: the grove and the Bourdon again, upside down under the pane ----------
    const mirror = new THREE.Group(); mirror.scale.y = -1;
    const mSolid = new THREE.Mesh(solidGeo.userData.mirror, M.solid), mGlass = new THREE.Mesh(glassGeo.userData.mirror, M.glass), mHalo = new THREE.Mesh(haloGeo, M.halo);
    const mEmb = new THREE.Points(embers.geometry, sparkMat); mEmb.renderOrder = 0.65;
    mGlass.renderOrder = 0.5; mHalo.renderOrder = 0.6; mirror.add(mSolid, mGlass, mHalo, mEmb); scene.add(mirror);
    const heroMirror = hero.makeMirror(); heroMirror.traverse((o) => { if (o.material === M.glass) o.renderOrder = 0.55; }); scene.add(heroMirror);
    await ctx.yield();

    // ---------- mist in three sheets, drifting three ways; weather in the air ----------
    const set = fx.fxGroup(); scene.add(set.object);
    const mistCol = hexOf(mix3(lin(HR.horizon), hourName === 'night' ? lin('#5A6E92') : [1, 1, 1], hourName === 'night' ? 0.35 : 0.45));
    const sheets = [], mistK = thick ? 1.6 : drizzle ? 2 : 1;
    // The middle sheet lies at 58 m and is 16 m thick, the faintest of the three. (Each sheet's fork keeps the name it had.)
    for (const [name, y, wind, sc, op, hgt, lay] of [['mist8', 8, [1.2, 0.3], 0.013, 0.26, 6, 2], ['mist58', 58, [-0.5, 0.6], 0.009, 0.07, 16, 4], ['mist96', 96, [0.2, -0.8], 0.007, 0.1, 16, 4]]) {
      const f = set.add(fx.makeGroundFog({ rng: rng.fork(name), time: U.uTime, layers: lay, size: 1000, y, height: hgt, color: mistCol, opacity: Math.min(op * mistK, 0.42), coverage: 0.56, scale: sc, wind, scatter: 0 }));
      sheets.push({ f, op: Math.min(op * mistK, 0.42) });
      await ctx.yield();
    }
    await ctx.yield();
    const darkMotes = hourName !== 'night';                               // against bright fog the motes must be darker than it to be seen at all
    const moteCol = darkMotes ? hexOf(mix3(CELADON, FAR, 0.72)) : hexOf(mix3(CELADON, PEARL, 0.5).map((v) => v * (HR.amb * 0.8 + 0.2)));
    if (drizzle) set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: U.uTime, count: 4200, velocity: [0, -15, 0], velocityRandom: [0.2, 3, 0.2], color: moteCol, opacity: 0.4 }));
    else if (frost) set.add(fx.makeParticles({ rng: rng.fork('ice'), preset: 'snow', time: U.uTime, count: 2200, shape: 'sparkle', velocity: [0.3, -0.5, 0.1], size: [0.05, 0.14], twinkle: 1, color: hexOf(mix3(PEARL, [1, 1, 1], 0.6)) }));
    else set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time: U.uTime, count: Math.round(2500 * detail), box: [60, 36, 60], color: moteCol, size: [0.06, 0.16], velocity: [0.35, 0.08, -0.2],
      ...(darkMotes ? { additive: 0, opacity: 0.85, twinkle: 0.3 } : {}) }));
    await ctx.yield();
    { const [cx2, cz2] = hl(1.5, -1.2);
      set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke'), time: U.uTime, position: [cx2, 11.6, cz2], height: 30, radius: [0.25, 2.6], size: [1.1, 6.5], count: 46, color: hexOf(mix3(lin(HR.horizon), FAR, 0.35)),
        colorTop: HR.horizon, shadowColor: hexOf(mix3(lin(HR.horizon), FAR, 0.55)), ambient: hexOf(mix3(lin(HR.horizon), FAR, 0.6)), opacity: 0.55, wind: [0.25, 0, 0.12], bend: 0.3, sunDir: [0, 1, 0], rim: 0, scatter: 0 }));
      // and its reflection: the same column falling away under the pane
      const sm = set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke'), time: U.uTime, position: [cx2, -11.6, cz2], height: -30, radius: [0.25, 2.6], size: [1.1, 6.5], count: 46, color: hexOf(mix3(lin(HR.horizon), FAR, 0.35)),
        colorTop: HR.horizon, shadowColor: hexOf(mix3(lin(HR.horizon), FAR, 0.55)), ambient: hexOf(mix3(lin(HR.horizon), FAR, 0.6)), opacity: 0.5, wind: [0.25, 0, 0.12], bend: 0.3, sunDir: [0, 1, 0], rim: 0, scatter: 0 }));
      sm.object.traverse((o) => { o.renderOrder = 0.7; o.frustumCulled = false; o.onAfterRender = () => {}; }); }

    await ctx.yield();
    // ---------- creatures ----------
    const fl = HR.fauna, light = { sunDir: [-0.5, 0.8, -0.4], sunColor: hexOf(PEARL), sunIntensity: 0.45 * fl, sky: hexOf(PEARL), skyIntensity: 1.1 * fl, ground: hexOf(P[1]), groundIntensity: 0.55 * fl };
    const fauna = F.makeFauna(scene, { light }), fr = rng.fork('fauna');
    // five waders stand beside the line, one in each 71 m of it from 57 m on to 376 m (where the Bourdon's
    // roots begin), each anywhere in the first 35 m of its stretch
    const birdPos = [[BIRD.x, 0, BIRD.z]];
    for (let i = 0; i < 5; i++) { const d = 57 + i * 71 + fr.range(0, 35), p = path.posAtDist(d), r = rightAtDist(d), lat = (i % 2 ? 1 : -1) * fr.range(11, 34); birdPos.push([p.x + r.x * lat, 0, p.z + r.z * lat]); }
    birdPos.forEach((b, i) => lakeU.uBird.value[i].set(b[0], b[2], 6));
    lakeU.uBirdCol.value.copy(cast.herons ? col(mix3(CELADON, PEARL, 0.4)).multiplyScalar(0.5 * HR.amb + 0.1) : col(LACQ));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: fr, species: cast.herons ? 'egret' : 'heron', positions: birdPos, count: 6, size: 6, level: 0, facing: Math.PI * (side0 > 0 ? 0.5 : -0.5), peckRate: 0.95, active: 0.95,
      ...(cast.herons ? { body: '#bfe6d8', belly: '#e6f4ee', wing: '#8fcdbb', neckC: '#d4efe6', cap: '#d4efe6', beakC: '#eef6f2', legC: '#22323c' }
        : { body: '#161d24', belly: '#2c3a46', wing: '#0b1016', neckC: '#1c262e', cap: '#0b1016', beakC: '#cfe6dc', legC: '#0b1016' }) }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr, species: fr.pick(['geese', 'flamingos', 'gulls']), count: Math.round(fr.range(7, 13) * dens), size: 1.6, body: '#1a232c', belly: '#44525e', wingC: '#0f151b', tip: '#0b1016', neckC: '#1a232c', head: '#1a232c', tailC: '#0f151b', beak: '#cfe6dc', legC: '#0b1016', trail: '#1a232c',
      cross: { path, u: 0.3, lead: 120, angle: 70, side: -side0, height: 22, span: 520, duration: DURATION } }));

    await ctx.yield();
    // ---------- other travellers: the ropeway (or the tender's punt), and other tenders' balloons ----------
    // the cable crosses the line we fly ROPE_ALONG metres from the start: where it has come onto the middle aisle and levelled
    // (1.5 m off the aisle's line, 34.5 m up, 13 m short of the seventh of its points)
    const ROPE_ALONG = 233;
    const pc = path.posAtDist(ROPE_ALONG), tc = path.tangentAtDist(ROPE_ALONG), ca = 1.15 * side0;
    const cd = V3(tc.x * Math.cos(ca) - tc.z * Math.sin(ca), 0, tc.x * Math.sin(ca) + tc.z * Math.cos(ca)).normalize();
    const SPAN = 82, CL = SPAN * 8, cableY = Math.min(29, pc.y - 6.2), cyaw = Math.atan2(cd.x, cd.z);
    const cableBase = (s) => { const f = s / SPAN + 0.5, q = f - Math.floor(f); return cableY - 12.8 * q * (1 - q); };
    const movers = [];
    let cable = null, punt = null, carRef = 0;
    // the ropeway runs on the flight's own clock, like the tolls (7 m/s for the flight's 42 s), so that one car crosses our bow
    // just below when the basket is CAR_LEAD metres short of the cable; carS = where along the cable a car is
    const CAR_LEAD = 15, U_CAR = (ROPE_ALONG - CAR_LEAD) / path.length;
    const carS = (s0, uu) => (((s0 - carRef + CL / 2 + 7 * DURATION * (uu - U_CAR)) % CL) + CL) % CL - CL / 2;
    if (!cast.punt) {
      const pb = new Buf(); pb.set([0, 0, 0, 0], [0, 0, 0.4, 0]);
      for (let k = -4; k < 4; k++) {
        const s = (k + 0.5) * SPAN, x = pc.x + cd.x * s, z = pc.z + cd.z * s;
        tube(pb, spline([V3(x + 1.5, -0.3, z), V3(x + 0.6, cableY * 0.5, z), V3(x - 0.4, cableY + 0.5, z), V3(x, cableY + 2.2, z), V3(x + cd.z * 1.2, cableY + 1.6, z - cd.x * 1.2)], 10), 6, (q) => lerp(0.55, 0.16, q) * (1 + 0.6 * Math.exp(-q * 20)), () => lacq(0.25), {});
      }
      await ctx.yield();
      pb.mdec = 2; const pyl = new THREE.Mesh(await pb.geometry(Y), M.solid), pylM = new THREE.Mesh(pyl.geometry.userData.mirror, M.solid); scene.add(pyl); mirror.add(pylM);
      const cb = new Buf(), cpts = [], NS = 128; cb.set([0, 0, 0, 0], [0, 0, 0.5, 3]);
      for (let i = 0; i <= NS; i++) { const s = (i / NS - 0.5) * CL; cpts.push(V3(pc.x + cd.x * s, cableBase(s), pc.z + cd.z * s)); }
      cb.set([0, 0, 0, 0], [0, 0.17, 0.5, 3]);
      tube(cb, cpts, 4, () => 0.17, () => ROPE, {});
      await ctx.yield();
      const cg = await cb.geometry(); cg.boundingSphere = new THREE.Sphere(V3(pc.x, cableY, pc.z), CL * 0.55);
      const baseY = Float32Array.from(cg.attributes.position.array);
      cable = { geo: cg, baseY, NS }; scene.add(new THREE.Mesh(cg, M.solid)); mirror.add(new THREE.Mesh(cg, M.solid));
      const gb = new Buf(); gb.set([0, 0, 0, 0], [0, 0.09, 0.2, 3]);
      tube(gb, [V3(0, 0.25, 0), V3(0, -1.5, 0)], 4, () => 0.09, () => ROPE, {});
      gb.set([0, 0, 0, 0], [0, 0, 0.2, 3]);
      box(gb, 0, 0.2, 0, 0.3, 0.3, 0.9, cyaw, lacq(0.5));
      box(gb, 0, -2.6, 0, 1.7, 2.1, 3.0, cyaw, mix3(WOOD, LACQ, 0.4)); box(gb, 0, -1.45, 0, 1.95, 0.22, 3.3, cyaw, lacq(0.3));
      gb.set([0, 0, 0, 0], [0, 0.34, 0.7, 2]);                             // lit windows: three dim panes a side between lacquer mullions
      box(gb, 0, -2.35, 0, 1.76, 0.75, 2.3, cyaw, PEARL);
      gb.set([0, 0, 0, 0], [0, 0, 0.2, 3]);
      for (const dz of [-0.4, 0.4]) box(gb, dz * Math.sin(cyaw), -2.35, dz * Math.cos(cyaw), 1.86, 0.8, 0.1, cyaw, LACQ);
      box(gb, 0, -3.72, 0, 1.2, 0.16, 2.0, cyaw, lacq(0.2));
      gb.set([0, 0, 0, 0], [0, 1.5, 0.7, 2]); blob(gb, V3(0, -4.1, 0), 0.34, 0.42, 0.34, 6, 4, () => PEARL);
      const gg = await gb.geometry();
      for (let i = 0; i < 6; i++) movers.push({ kind: 'gondola', s0: (i / 6) * CL + rng.range(-12, 12) });
      for (let i = 0; i < 4; i++) movers.push({ kind: 'gondola', s0: ((i + 0.5) / 4) * CL + 14 * Math.sin(i * 2.4) });      // enough cars that one is always in sight
      carRef = movers[3].s0;
      for (const m of movers) { m.mesh = new THREE.Mesh(gg, M.solid); m.twin = new THREE.Mesh(gg, M.solid); m.mesh.scale.setScalar(1.45); m.twin.scale.setScalar(1.45); scene.add(m.mesh); mirror.add(m.twin); }
    } else {
      const pb = new Buf(); pb.set([0, 0, 0, 0], [0, 0, 0.3, 3]);
      blob(pb, V3(0, 0.14, 0), 0.95, 0.45, 3.6, 10, 4, () => mix3(WOOD, LACQ, 0.3));
      blob(pb, V3(0, 1.45, 1.9), 0.3, 0.95, 0.26, 6, 5, () => lacq(0.25)); blob(pb, V3(0, 2.5, 1.9), 0.2, 0.22, 0.2, 6, 4, () => lacq(0.4));
      tube(pb, [V3(0.5, -0.2, 2.6), V3(0.35, 4.6, 1.6)], 4, () => 0.05, () => ROPE, {}); tube(pb, [V3(0, 0.3, -2.9), V3(0, 3.1, -3.1)], 4, () => 0.05, () => ROPE, {});
      pb.set([0, 0, 0, 0], [0, 0, 0.7, 2]); blob(pb, V3(0, 3.4, -3.1), 0.3, 0.38, 0.3, 8, 5, () => PEARL);
      const pg = await pb.geometry(), m = new THREE.Mesh(pg, M.solid), m2 = new THREE.Mesh(pg, M.solid); m.rotation.y = m2.rotation.y = cyaw + Math.PI; scene.add(m); mirror.add(m2);
      punt = { mesh: m, twin: m2 };
    }
    await ctx.yield();
    const br = rng.fork('balloons'), nBal = Math.round(br.range(2, 3.4) * dens);
    for (let i = 0; i < nBal; i++) {
      const k = (i % 2 ? 1 : -1) * (1 + (i >> 1)), pos = V3(k * ROW + br.range(-5, 5), br.range(34, 66), br.range(170, k * side0 === 1 ? 320 : 430)), sd = br();
      const g = new Buf(), s = new Buf(); g.mdec = 2;
      g.set([0, 0, 0, 0], [0.3 + hero.tollArrival(pos) * 1.1, 12, sd, 1]);
      lathe(g, 20, 12, (t) => [6.5 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(t + 0.004, 1), 0.6)), 0.75) + 1.2 * t * t * t, 8 - 17 * t], wallCol);
      s.set([0, 0, 0, 0], [0, 0, sd, 3]);
      box(s, 0, -12.2, 0, 1.7, 1.3, 1.7, sd * 3, mix3(WOOD, LACQ, 0.3));
      for (let c = 0; c < 4; c++) { const a = c * TAU / 4 + sd * 3 + 0.785; s.data = [0, 0.07, sd, 3]; tube(s, [V3(Math.sin(a) * 1.25, -9, Math.cos(a) * 1.25), V3(Math.sin(a) * 1.1, -11.6, Math.cos(a) * 1.1)], 4, () => 0.07, () => ROPE, {}); }
      s.set([0, 0, 0, 0], [0, 0, sd, 2]); blob(s, V3(1.05, -11.3, 0.6), 0.24, 0.3, 0.24, 6, 4, () => PEARL);
      const grp = new THREE.Group(), gm = new THREE.Mesh(await g.geometry(), M.glass); gm.renderOrder = 3.3; grp.add(new THREE.Mesh(await s.geometry(), M.solid), gm); grp.position.copy(pos); scene.add(grp);
      const twin = new THREE.Group(), tg = new THREE.Mesh(gm.geometry.userData.mirror, M.glass); tg.renderOrder = 0.52; twin.add(new THREE.Mesh(grp.children[0].geometry, M.solid), tg); mirror.add(twin);
      movers.push({ kind: 'balloon', mesh: grp, twin, p0: pos, ph: sd * TAU });
      await ctx.yield();
    }
    await ctx.yield();

    // ---------- the flight's gaze ----------
    const over = trees[overIdx];
    const teach = trees[e1[1] ?? e1[0]], teachAt = V3(teach.c.x, teach.c.y, teach.c.z).lerp(entryTree.c, 0.42);
    // GAZE_STEP is half the radius of the Bourdon's mouth
    const GAZE_STEP = 30;
    const pois = [
      { at: V3(BIRD.x + 13 * side0, 1.5, BIRD.z - 4), from: 0.0, to: 0.09, weight: 0.5 },          // the tuner-bird and its fuse
      { at: teachAt, from: 0.075, to: 0.155, weight: 0.5 },                                        // the light hops: entry bell to its neighbours
      { at: V3(over.c.x, over.bottom + 3, over.c.z), from: 0.14, to: 0.21, weight: 0.36 },
      { at: V3(0, 150, 0), from: 0.25, to: 0.6, weight: 0.6 },                                      // the Bourdon, apex and all
      ...(cast.punt ? [] : [{ at: (time, uu) => { const sC = carS(carRef, uu); return carV.set(pc.x + cd.x * sC, cableBase(sC) - 4.5, pc.z + cd.z * sC); }, from: (ROPE_ALONG - SPAN) / path.length, to: ROPE_ALONG / path.length, weight: 0.45, fade: 0.45 }]),   // the gondola crossing our bow
      { at: V3(-28, 100, -150), from: 0.6, to: 0.765, weight: 0.8 },                               // past the lip: out and across, through the clear glass
      { at: V3(30, 150, 25), from: 0.705, to: 0.85, weight: 0.85 },                                // the veined wall and the moth ribbon
      { at: seat.clone(), from: 0.83, to: 1.0, weight: 0.75 },                                     // the collar and the portal
    ];
    const carV = V3(0, 0, 0);
    const fogBase = scene.fog.density, tmpP = V3(0, 0, 0), tmpT = V3(0, 0, 0);
    const SHAFT_K = lerp(0.9, 0.4, smoothstep(0.4, 1, HR.amb));           // the Bourdon's toll in the moth dust of its own axis: fainter against a bright sky
    const dips = new Float32Array(16);

    function update(dt, time, camera, u) {
      const T = u * DURATION, s = T - T_STRIKE;
      hero.setToll(s); hero.update(dt, time, camera);
      // the dawn the bells ring up: sky, fog and ambient lean toward gold and stay there
      const dawn = smoothstep(0.2, 7.5, s);
      // when the Bourdon speaks the overcast draws back for a breath, so the gold is the brightest thing there is; then the dawn comes up
      const dim = 1 - HR.dim * smoothstep(0, 1.3, s) * (1 - 0.6 * smoothstep(5, 15, s));
      horizon.copy(horizon0).lerp(horizon1, dawn).multiplyScalar(dim); scene.fog.color.copy(horizon);
      skyU.uZenith.value.copy(zen0).lerp(zen1, dawn).multiplyScalar(dim); skyU.uBand.value.copy(band0).lerp(band1, dawn).multiplyScalar(lerp(dim, 1, 0.5)); skyU.uDawn.value = dawn;
      skyU.uAnswer.value = rare ? smoothstep(4.5, 8.5, s) * (0.82 + 0.18 * Math.sin(time * 1.3)) : 0;
      U.uAmb.value = lerp(HR.amb, HR.ambAfter, dawn) * lerp(1, 0.9, smoothstep(0.66, 0.78, u));     // inside the bell the eye settles, so the portal is the brightest thing
      U.uAfter.value = lerp(0.36, 0.62, smoothstep(0.6, 0.74, u)); U.uBackA.value = lerp(0.72, 0.95, smoothstep(0.6, 0.7, u));   // inside the bell the walls are all after-shimmer
      U.uDawnK.value = dawn;
      U.uShaft.value = SHAFT_K * smoothstep(LIP_ALONG, LIP_ALONG + GAZE_STEP, u * path.length);   // that column is seen from inside only: it comes up between the lip and half the mouth's radius in, by metres flown
      U.uIn.value = smoothstep(0.615, 0.665, u);                           // from inside, the Bourdon is clear at the mouth, veined green above, pale at the crown
      const upper = 1 - smoothstep(0.3, 0.4, u);                         // the high mist sheets are gone before we pass under the lip
      sheets[1].f.uniforms.uOpacity.value = sheets[1].op * upper; sheets[2].f.uniforms.uOpacity.value = sheets[2].op * upper;
      scene.fog.density = fogBase * lerp(1, 0.62, smoothstep(0.14, 0.34, u)) * lerp(1, 0.5, smoothstep(-0.4, 1.6, s));   // the mist thins and the arch stands ahead; the strike itself rings the air clear
      lakeU.uDens.value = scene.fog.density; lakeU.uGoldK.value = hero.goldLevel(s);
      sky.position.setFromMatrixPosition(camera.matrixWorld);
      mirror.visible = heroMirror.visible = u < 0.775;                     // high in the bell the lake is out of sight
      glassMesh.renderOrder = u > 0.64 ? 2.8 : 3.2;
      haloMesh.renderOrder = hero.haloMesh.renderOrder = u > 0.64 ? 2.9 : 4;   // from inside the Bourdon the grove's blooms are seen through its glass
      // the mooring line's wake behind us
      path.pointAt(u, tmpP); path.tangentAt(u, tmpT); const tl = Math.hypot(tmpT.x, tmpT.z) || 1;
      lakeU.uWake.value[0].set(tmpP.x - tmpT.x / tl * 6, tmpP.z - tmpT.z / tl * 6, tmpT.x / tl, tmpT.z / tl); lakeU.uWakeK.value.x = 0.9 * (1 - smoothstep(0.07, 0.17, u));
      // travellers
      let dipN = 0;
      for (const m of movers) {
        if (m.kind === 'gondola') {
          const sC = carS(m.s0, u), edge = smoothstep(0, 30, CL / 2 - Math.abs(sC));
          m.mesh.position.set(pc.x + cd.x * sC, cableBase(sC) - 0.9 * edge + 0.06 * Math.sin(time * 2.3 + m.s0), pc.z + cd.z * sC);
          m.mesh.rotation.x = 0.03 * Math.sin(time * 1.1 + m.s0); m.mesh.visible = edge > 0.01; dips[dipN++] = sC;
        } else {                                                          // other tenders drift down the grove with us (keyed to progress, so they can never reach the Bourdon)
          m.mesh.position.set(m.p0.x + 4 * Math.sin(time * 0.05 + m.ph), m.p0.y + 1.6 * Math.sin(time * 0.31 + m.ph) + 2 * hero.goldLevel(s), m.p0.z - 55 * u + 3 * Math.sin(time * 0.07 + m.ph * 2));
          m.mesh.rotation.y = 0.2 * Math.sin(time * 0.11 + m.ph);
        }
        m.twin.position.copy(m.mesh.position); m.twin.rotation.copy(m.mesh.rotation); m.twin.visible = m.mesh.visible;
      }
      if (cable) {
        const pos = cable.geo.attributes.position, a = pos.array, b = cable.baseY;
        for (let j = 0; j <= cable.NS; j++) {
          const sj = (j / cable.NS - 0.5) * CL; let d = 0;
          for (let k = 0; k < dipN; k++) { const q = (sj - dips[k]) / 9; d += 0.9 * Math.exp(-q * q); }
          for (let k = 0; k < 5; k++) { const i = (j * 5 + k) * 3 + 1; a[i] = b[i] - d; }
        }
        pos.needsUpdate = true;
      }
      if (punt) {
        const sP = ((time * 2.4 + 70) % 260) - 130, x = pc.x + cd.x * sP, z = pc.z + cd.z * sP, bob = 0.04 * Math.sin(time * 1.7);
        punt.mesh.position.set(x, bob, z); punt.twin.position.set(x, bob, z); punt.mesh.rotation.z = punt.twin.rotation.z = 0.02 * Math.sin(time * 0.9);
        lakeU.uWake.value[1].set(x + cd.x * 3, z + cd.z * 3, cd.x, cd.z); lakeU.uWakeK.value.y = 0.8;
      }
      set.update(dt, time, camera); fauna.update(dt, time, camera, u);
    }

    return {
      scene, path, duration: DURATION,
      // linger on the approach to the Bourdon and its strike, hurry a little up the middle of the climb
      pace: (u) => 1 - 0.22 * smoothstep(0.27, 0.34, u) * (1 - smoothstep(0.5, 0.6, u)) + 0.22 * smoothstep(0.7, 0.76, u) * (1 - smoothstep(0.82, 0.88, u)),
      title: hourName === 'night' ? 'The Carillon Grove, Night' : hourName === 'lilac' ? 'The Carillon Grove, Blue Hour' : 'The Carillon Grove',
      ride: 'balloon-basket',
      camera: { fov: 64, near: 0.3, far: 2600, lookAhead: 26, sway: 0.6, bank: 0.4 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFE0A6', glow: 1.5, tilt: true, revealDistance: 240 },
      post: { exposure: HR.exposure, bloom: { strength: HR.bloom, radius: 0.7, threshold: 0.88 },
        grade: { saturation: 1.12, contrast: 1.08, tint: '#ffffff', shadowTint: hourName === 'lilac' ? '#0a0818' : '#04080c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
