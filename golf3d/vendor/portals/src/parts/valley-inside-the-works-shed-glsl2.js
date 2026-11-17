// valley-inside-the-works, THE SHED: the shader text of its flat iron work (lace) and of its glass.
// Lace: thin iron drawn on plain panels and blended by its filtered cover, so no bar is ever thinner than a pixel.
export const LACE_FUNCS = /* glsl */`
// shSeg: how far the point p lies from the straight piece between its two ends, e0 and e1. Written here from the
// geometry itself: the share of the way from e0 to e1 at which p's foot falls on the line (one division: how far p
// reaches along the piece, over the piece's own length squared), held between the two ends; then the distance from
// p to that foot (with a grain added under the root, so that no root of nothing is taken).
float shSeg(vec2 p, vec2 e0, vec2 e1) {
  vec2 along = e1 - e0;
  float share = clamp(dot(p - e0, along) / dot(along, along), 0.0, 1.0);
  vec2 off = p - mix(e0, e1, share);
  return sqrt(dot(off, off) + 1e-8);
}
float shDisc(vec2 p, vec2 c) { vec2 d = p - c; return sqrt(dot(d, d) + 1e-8); }
// a light roof truss: u from the next valley (0) to this one (20), v up from the valleys (0) to the ridge (10) at u = 4
float shTruss(vec2 p, float f) {
  float d = shSeg(p, vec2(0.4, 0.5), vec2(19.6, 0.5));
  d = min(d, shSeg(p, vec2(4.0, 0.5), vec2(4.0, 9.1)));
  d = min(d, shSeg(p, vec2(4.0, 0.5), vec2(9.33, 5.75)));
  d = min(d, shSeg(p, vec2(9.33, 0.5), vec2(9.33, 5.75)));
  d = min(d, shSeg(p, vec2(9.33, 0.5), vec2(14.67, 2.45)));
  d = min(d, shSeg(p, vec2(14.67, 0.5), vec2(14.67, 2.45)));
  d = min(d, shSeg(p, vec2(4.0, 0.5), vec2(2.25, 4.6)));
  float g = min(min(shDisc(p, vec2(4.0, 0.5)), shDisc(p, vec2(9.33, 0.5))), min(shDisc(p, vec2(14.67, 0.5)), shDisc(p, vec2(9.33, 5.75))));
  g = min(g, min(shDisc(p, vec2(14.67, 2.45)), shDisc(p, vec2(4.0, 9.1))));
  return max(shEdge(0.1 - d, f), shEdge(0.36 - g, f));
}
// a railing: u along it, v up from the floor (0 to 3.3): standards every 5 m, three rails, slim balusters
float shRail(vec2 p, vec2 fw) {
  float c = shPulse(p.x / 5.0 + 0.026, 0.052, fw.x / 5.0);
  c = max(c, shPulse(p.x / 0.5, 0.16, fw.x / 0.5) * shEdge(3.1 - p.y, fw.y) * shEdge(p.y - 0.3, fw.y));
  c = max(c, shEdge(0.11 - abs(p.y - 3.19), fw.y));
  c = max(c, shEdge(0.07 - abs(p.y - 1.7), fw.y));
  return max(c, shEdge(0.08 - abs(p.y - 0.3), fw.y));
}
// a cast bracket under a gallery: u out from the wall, v down from the floor, 3.2 m each way, with a curved brace
float shBracket(vec2 p, float f) {
  float c = max(shEdge(0.24 - p.y, f), shEdge(0.24 - p.x, f));
  c = max(c, shEdge(0.13 - abs(shDisc(p, vec2(3.2, 3.2)) - 3.06), f));
  return max(c, shEdge(0.07 - abs(shDisc(p, vec2(0.98, 0.98)) - 0.5), f));
}
`;
export const LACE_MAIN = /* glsl */`
{
  float kind = floor(vP.z + 0.5);
  vec2 uv = vP.xy, fw = fwidth(vP.xy);
  float f = max(max(fw.x, fw.y), 1e-4), cov = 1.0;
  vec3 paint = uShedPaint;
  if (kind < 0.5) {
    float fa = fw.x / 1.55 + fw.y * 2.0;
    cov = 1.0 - (1.0 - shPulse(uv.x / 1.55 + uv.y * 2.0, 0.19, fa)) * (1.0 - shPulse(uv.x / 1.55 - uv.y * 2.0, 0.19, fa));
  } else if (kind < 1.5) { cov = shTruss(uv, f); }
  else if (kind < 2.5) { cov = shRail(uv, fw); paint = uShedRail; }
  else if (kind < 3.5) {
    cov = 1.0 - (1.0 - shPulse(uv.x / 0.3, 0.4, fw.x / 0.3)) * (1.0 - shPulse(uv.y / 1.2, 0.12, fw.y / 1.2)); paint = uShedRail;
  } else { cov = shBracket(uv, f); paint = uShedRail; }
  diffuseColor.rgb *= paint * mix(0.9, 1.08, shNoise(uv * 1.3));
  diffuseColor.a *= cov;
}
`;
// Glass: the sky beyond, seen through panes behind dark glazing bars. kind 0 a roof light (u across the hall, v up the face from
// the valley), 1 a round-headed wall window (u from its middle, v up from the sill, springing at 8.5, radius 4),
// 2 a wheel window (uv from its middle, radius 7), glazed with swirled sugar glass (w: which pair of colours).
export const GLASS_VERT = /* glsl */`
attribute vec4 aP;
varying vec4 vP; varying vec3 vW; varying vec3 vCol;
#include <common>
#include <fog_pars_vertex>
void main() {
  vP = aP; vCol = color;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
export const GLASS_PANES = /* glsl */`
// the cover of the glazing bars at uv (out: the pane's own number)
float shRoofBars(vec2 uv, vec2 fw, out vec2 pane) {
  float fine = shPulse(uv.x / 1.25 + 0.036, 0.072, fw.x / 1.25), big = shPulse(uv.x / 5.0 + 0.024, 0.048, fw.x / 5.0);
  float lap = shPulse((uv.y - 1.4) / 3.123 + 0.013, 0.026, fw.y / 3.123);
  pane = floor(vec2(uv.x / 1.25 + 0.036, (uv.y - 1.4) / 3.123 + 0.013));
  return 1.0 - (1.0 - fine) * (1.0 - big) * (1.0 - lap);
}
float shWallBars(vec2 uv, vec2 fw, float f, out vec2 pane) {
  vec2 q = vec2(uv.x, uv.y - 8.5);
  float r = sqrt(dot(q, q) + 1e-8), up = step(0.0, q.y), rr = max(r, 0.4);
  float rect = 1.0 - (1.0 - shPulse(uv.x + 0.04, 0.08, fw.x)) * (1.0 - shPulse(uv.y / 1.2143 + 0.033, 0.066, fw.y / 1.2143));
  rect = max(rect, shEdge(0.11 - abs(uv.x), f));
  float ang = atan(q.y, q.x + step(r, 1e-3)), sec = 0.3927, wa = 0.09 / rr;
  float arch = shPulse(ang / sec + 0.5 * wa / sec, wa / sec, f / rr / sec) * step(1.2, r);
  arch = max(arch, max(shEdge(0.06 - abs(r - 1.2), f), shEdge(0.06 - abs(r - 2.6), f)));
  float bars = mix(rect, arch, up);
  bars = max(bars, shEdge(0.12 - abs(q.y), f));
  bars = max(bars, mix(shEdge(abs(uv.x) - 3.84, f), shEdge(r - 3.84, f), up));
  pane = mix(floor(vec2(uv.x + 0.04, uv.y / 1.2143 + 0.033)), vec2(floor(ang / sec), 30.0 + step(1.2, r) + step(2.6, r)), up);
  return max(bars, shEdge(0.14 - uv.y, f));
}
float shWheelBars(vec2 uv, float f, out vec2 pane) {
  float r = sqrt(dot(uv, uv) + 1e-8), rr = max(r, 0.5);
  float ang = atan(uv.y, uv.x + step(r, 1e-3)), sec = 6.2832 / mix(12.0, 24.0, step(4.4, r)), wa = 0.2 / rr;
  float bars = shPulse(ang / sec + 0.5 * wa / sec, wa / sec, f / rr / sec) * step(1.3, r);
  bars = max(bars, max(shEdge(0.11 - abs(r - 1.3), f), shEdge(0.12 - abs(r - 4.4), f)));
  pane = vec2(floor(ang / sec), 50.0 + step(1.3, r) + step(4.4, r));
  return max(bars, shEdge(r - 6.86, f));
}
// the swirled sugar glass of a wheel window: two clear colours wound in a spiral of three arms each, like a great
// lollipop seen flat, with the fine streaks of pulled sugar along the arms; all filtered by the footprint f.
// pair: which two colours (0 red and white, 1 green and white, 2 orange and yellow, 3 rose and cream);
// turn: how far the spiral has turned, in turns
vec3 shSwirl(vec2 uv, float f, float pair, float turn) {
  float r = sqrt(dot(uv, uv) + 1e-8), ang = atan(uv.y, uv.x + step(r, 1e-3)) / 6.2832;
  float ph = 3.0 * (ang - turn) + 0.36 * r, fp = f * (3.0 / (6.2832 * max(r, 0.4)) + 0.36);
  vec3 a = pair < 0.5 ? vec3(0.80, 0.04, 0.06) : pair < 1.5 ? vec3(0.03, 0.46, 0.10) : pair < 2.5 ? vec3(1.0, 0.36, 0.03) : vec3(0.92, 0.22, 0.42);
  vec3 b = pair < 0.5 ? vec3(1.0, 0.84, 0.78) : pair < 1.5 ? vec3(0.60, 1.0, 0.48) : pair < 2.5 ? vec3(1.0, 0.82, 0.14) : vec3(1.0, 0.86, 0.66);
  float pulled = 1.0 - 0.06 * (1.0 + sin(6.2832 * 7.0 * ph + 2.0 * sin(1.3 * r))) * (1.0 - smoothstep(0.2, 0.6, 7.0 * fp));
  return mix(a, b, shPulse(ph, 0.5, fp)) * pulled;
}
`;
// THE SKY seen through a pane, by the direction d looked along (a unit vector), as any sky is: blue, deeper overhead,
// pale and warm toward the horizon, with sunlit cumulus on a level layer high over the roof that drifts by the clock,
// and the sun's own glare round the light's direction; below the horizon, far land in haze. Every colour but the
// glare is held under white. No pow, no sqrt, no division by a value that can be zero.
export const GLASS_SKY = /* glsl */`
vec3 shSky(vec3 d) {
  float up = clamp(d.y, 0.0, 1.0);
  vec3 sky = mix(uShedSkyLow, uShedSkyMid, smoothstep(0.0, 0.11, up));
  sky = mix(sky, uShedSkyTop, smoothstep(0.1, 0.85, up));
  sky = mix(uShedSkyLow * vec3(0.6, 0.7, 0.66), sky, smoothstep(-0.16, 0.0, d.y));
  // the cloud layer: the direction carried up to a level plane (flattened toward the horizon), drifting by the clock
  vec2 c = d.xz * (2.6 / (up + 0.2)) + uShedTime * vec2(0.011, 0.006) + vec2(3.7, 1.9);
  vec2 s = uShedLight.xz * 0.16;
  float fine = 1.0 - smoothstep(0.06, 0.16, max(fwidth(c.x), fwidth(c.y)));
  float a = 0.55 * shNoise(c) + 0.3 * shNoise(c * 2.13 + 7.3);
  float b = 0.55 * shNoise(c + s) + 0.3 * shNoise((c + s) * 2.13 + 7.3);
  float n = a + 0.15 * mix(0.5, shNoise(c * 4.3 + 19.1), fine);
  float cov = smoothstep(uShedSkyK.x, uShedSkyK.x + uShedSkyK.y, n) * smoothstep(-0.02, 0.07, d.y);
  // a cumulus from below: bright at its thin sunlit edge and on the side toward the sun, grey in its thick middle
  float core = smoothstep(uShedSkyK.x + 0.5 * uShedSkyK.y, uShedSkyK.x + uShedSkyK.y + 0.2, n);
  float lit = clamp(1.0 - 0.8 * core + 2.6 * (a - b), 0.0, 1.0);
  vec3 cl = mix(uShedCloudDark, uShedCloud, lit);
  cl = mix(uShedSkyLow, cl, 0.3 + 0.7 * smoothstep(0.0, 0.14, up));
  sky = mix(sky, cl, cov);
  // the sun: a disc and a tight glare round the light's own direction, dimmed behind cloud
  float sd = max(dot(d, uShedLight), 0.0), g8 = sd * sd; g8 *= g8; g8 *= g8;
  float g64 = g8 * g8; g64 *= g64; g64 *= g64;
  float g512 = g64 * g64; g512 *= g512; g512 *= g512;
  sky += uShedSun * (uShedSkyK.z * (1.0 - 0.6 * cov)) * (6.0 * smoothstep(0.9993, 0.9997, sd) + 1.8 * g512 + 0.5 * g64 + 0.08 * g8);
  return sky;
}
`;
export const GLASS_FRAG_HEAD = /* glsl */`
uniform vec3 uShedSky; uniform vec3 uShedSun; uniform vec3 uShedGlassBar; uniform vec3 uShedLight; uniform float uShedTime; uniform float uShedGlassGain;
uniform vec3 uShedSkyTop; uniform vec3 uShedSkyMid; uniform vec3 uShedSkyLow; uniform vec3 uShedCloud; uniform vec3 uShedCloudDark; uniform vec4 uShedSkyK;
varying vec4 vP; varying vec3 vW; varying vec3 vCol;
#include <common>
#include <fog_pars_fragment>
`;
export const GLASS_FRAG_MAIN = /* glsl */`
void main() {
  float kind = floor(vP.z + 0.5), w = vP.w;
  vec2 uv = vP.xy, fw = fwidth(vP.xy), pane = vec2(0.0);
  float f = max(max(fw.x, fw.y), 1e-4), bars = 0.0;
  // the sky beyond, by the eye's own ray through the pane (taken before any branch: it measures its own footprint)
  vec3 ray = vW - cameraPosition;
  vec3 g = shSky(ray / max(length(ray), 1e-3));
  if (kind < 0.5) bars = shRoofBars(uv, fw, pane);
  else if (kind < 1.5) bars = shWallBars(uv, fw, f, pane);
  else bars = shWheelBars(uv, f, pane);
  pane += floor(w * 97.0 + 0.5);
  float h = shHash(pane), h2 = shHash(pane + 41.7);
  // panes: most clear, a few a shade dustier, a few of greener old glass; the variety fades when panes are small
  float variety = 1.0 - smoothstep(0.5, 2.2, f);
  vec3 tint = mix(vec3(1.0), vec3(0.90, 0.88, 0.84), step(0.84, h)) * mix(vec3(1.0), vec3(0.90, 0.97, 0.93), step(0.9, h2)) * mix(0.96, 1.03, h2);
  g *= mix(vec3(0.955, 0.96, 0.945), tint, variety);
  // dirt gathered at the foot of a roof light, streaked down it
  float grime = (1.0 - smoothstep(1.2, 4.8, uv.y)) * (0.3 + 0.6 * shNoise(vec2(uv.x * 0.8, uv.y * 0.3))) * step(kind, 0.5);
  g *= mix(vec3(1.0), vec3(0.74, 0.70, 0.62), grime * 0.55);
  // a wheel window is glazed with swirled sugar glass (w: its pair of colours), lit from behind by the day: it glows
  // in its own colours, its brightest part under white. It turns slowly by the clock, one turn in 90 s, either way by the pair
  if (kind > 1.5) g = shSwirl(uv, f, w, (mod(w, 2.0) < 0.5 ? 1.0 : -1.0) * uShedTime / 90.0) * uShedSkyK.w;
  vec3 col = mix(g, uShedGlassBar, bars) * vCol;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;
