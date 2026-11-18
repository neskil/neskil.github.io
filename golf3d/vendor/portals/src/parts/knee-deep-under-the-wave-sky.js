// KNEE-DEEP UNDER THE WAVE, part SKY (film worlds D): the dome round the eye. It shows the shared sky of the place
// (the three layers of the light file's kdSky, laid here in kdSky's own order: the thin deep air, the black hole
// with its bent ring of light, the high streaks of ice cloud) and, behind the cloud, what only the dome carries:
// the high sky, a far river of stars and gas and some four thousand stars (they thin out downward to 18 degrees of
// elevation and stand only where the air is dark). The mirrors of kdSky do not show those.
//   buildSky(ctx, { path, light }) -> { object, uniforms, update(time, s, camera), dispose() }
// THE LOOKS of kdAir, kdHole and kdCloud are this part's too; they stand in the light file
// (knee-deep-under-the-wave-light.js), because the sea and the wave mirror the same sky through them. The hole is
// drawn from the physics of a thin disc of glowing gas round a black hole, seen almost edge-on, and from nothing
// else: its near half seen straight (the band that crosses in front of the dark), the light of its far half bent
// over the top (the upper arch, one piece with the band), the light of its underside bent the other way round
// under the hole (the lower arch), and the light that has circled the hole as a thin ring at its edge.
// NOTHING HERE IS SCRIPTED: the hole is this world's sun and does not move; the sky is the same at every s. What
// moves runs on the clock (the gas turning in its orbits, the cloud's drift, the stars' slow twinkle): ambient loops.
// THE EYE is read for two allowed things only: the dome is a sky drawn round the eye (its place is copied from the
// camera in update), and the stars keep a least size of a pixel's footprint.
// THE HOLE GROWS past the crest by the law's holeGrow (the light's uniform uKdGrow, set by the world from the
// metres flown): kdHole draws it so, every mirror of kdSky with it, and the dome's dark disc grows with it. The
// stars keep out of the hole's glow by the air's own brightness, so their clear room grows as the glow does.
// THE DARK STAYS DARK: the picture's glow pass spreads every bright thing of the world as a soft veil, over the
// hole's disc of dark too. The dome writes that disc a little under zero (DARK_UNDER; not where the band of fire
// crosses in front of it), which takes the veil off again, since the picture is cut at zero after the glow is
// added. Only the dome does this; kdSky itself never gives a value under zero, so a mirror of it cannot go wrong.
// A SEED DEALS only where the stars stand (two draws); there is one look. The river of stars is one pattern.
// Everything is made in build; update copies one position. One draw call, 2,208 triangles.
import * as THREE from 'three';

const DARK_UNDER = 0.2;

const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;

const DOME_FRAG = /* glsl */`
uniform vec2 uSkySeed;
varying vec3 vDir;
// THE HIGH SKY (the dome's own): a far river of stars and gas across the sky and some three thousand stars above 40
// degrees of elevation; under that, down to 18 degrees, the river's faint skirts and a thinner sheet of stars. All
// of it stands only where the air itself is dark, so the glow round the hole stays clean and the low sky calm.
const vec3 SKY_RIVER_POLE = vec3(-0.275, 0.454, 0.847);    // the river lies on the great circle about this pole
const vec3 SKY_RIVER_UP = vec3(0.140, 0.891, -0.432);      // its highest place: 63 degrees up, 18 degrees right of the hole's bearing
const vec3 SKY_RIVER_ALONG = vec3(0.951, 0., 0.309);       // the level line it runs along
// one sheet of stars on the sky's plane overhead: cells to the unit, and the share of the cells that hold a star
// (dealt by the seed). x: the star's light, y: a draw for its tint. Each star is about a pixel wide at the least
// (and fainter for it) and twinkles slowly at its own pace and phase: an ambient loop by the clock.
vec2 skySheet(vec3 d, float cells, float share, float px, float salt) {
  vec2 g = d.xz / d.y * cells, c = floor(g), hc = c + uSkySeed + salt;
  float h = kdSkyHash(hc);
  if (h > share) return vec2(0.);
  vec2 o = 0.25 + 0.5 * vec2(kdSkyHash(hc + 17.), kdSkyHash(hc + 43.));
  vec3 sd = vec3(c.x + o.x, cells, c.y + o.y);                                 // the star's own direction
  float ang = length(d - sd * inversesqrt(dot(sd, sd))), rad = max(0.0011, 0.95 * px), mag = h / share;
  float twinkle = 0.72 + 0.28 * sin(uKdTime * (0.9 + 1.4 * kdSkyHash(hc + 71.)) + 6.2832 * kdSkyHash(hc + 5.));
  return vec2((1. - smoothstep(0.3 * rad, rad, ang)) * (0.22 + 0.78 * mag * mag) * (0.5 + 0.55 * 0.0011 / rad) * twinkle, kdSkyHash(hc + 29.));
}
vec3 skyTint(float t) {                                    // most stars blue-white, some white, a few pale gold, a very few rose
  return mix(mix(vec3(0.78, 0.87, 1.0), vec3(1.0, 0.97, 0.92), step(0.55, t)), mix(vec3(1.0, 0.86, 0.60), vec3(1.0, 0.66, 0.52), step(0.94, t)), step(0.8, t));
}
// the lower stars, down to 18 degrees of elevation: one sheet on the sky's wall (bearing and elevation; cells of a
// degree and a half, 240 round the sky). keep (0 to 1) thins them: a star stands where its own draw is under keep.
vec2 skyWall(vec3 d, float px, float keep) {
  vec2 c = floor(vec2(atan(d.x, -d.z), asin(clamp(d.y, -1., 1.))) * 38.197), hc = c + uSkySeed + 113.;
  float h = kdSkyHash(hc), r = 0.85 * kdSkyHash(hc + 91.), on = smoothstep(r, r + 0.15, keep);
  if (h > 0.4 || on <= 0.) return vec2(0.);
  vec2 o = (c + 0.25 + 0.5 * vec2(kdSkyHash(hc + 17.), kdSkyHash(hc + 43.))) / 38.197;     // the star's bearing and elevation
  vec3 sd = vec3(sin(o.x) * cos(o.y), sin(o.y), -cos(o.x) * cos(o.y));
  float ang = length(d - sd), rad = max(0.0011, 0.95 * px), mag = h / 0.4;
  float twinkle = 0.72 + 0.28 * sin(uKdTime * (0.9 + 1.4 * kdSkyHash(hc + 71.)) + 6.2832 * kdSkyHash(hc + 5.));
  return vec2((1. - smoothstep(0.3 * rad, rad, ang)) * (0.2 + 0.9 * mag * mag * mag * mag) * (0.5 + 0.55 * 0.0011 / rad) * twinkle * on, kdSkyHash(hc + 29.));
}
// calm: 1 where the air itself is dark, 0 where it is bright (in the hole's glow, and toward the horizon)
vec3 skyHigh(vec3 d, float px, float calm) {
  if (d.y <= 0.3 || calm <= 0.) return vec3(0.);
  float hi = smoothstep(0.64, 0.82, d.y), low = smoothstep(0.31, 0.74, d.y);
  // the river: a soft band of far stars and gas, in clouds, with a dark lane of dust wandering along its middle;
  // its body stands above 40 degrees, its faint skirts reach down to 18
  float lat = dot(d, SKY_RIVER_POLE), core = exp(-lat * lat / 0.034), wide = exp(-lat * lat / 0.18), n1 = 0.5;
  vec3 col = vec3(0.);
  if (wide > 0.02) {
    float lon = atan(dot(d, SKY_RIVER_UP), dot(d, SKY_RIVER_ALONG));
    n1 = kdCloudNoise(vec2(lon * 2.6 + 11., lat * 8. + 5.));
    float n2 = kdCloudNoise(vec2(lon * 7.3 + 3., lat * 21. + 9.)), n3 = kdCloudNoise(vec2(lon * 19. + 7., lat * 55. + 2.));
    float clouds = smoothstep(0.2, 0.85, 0.6 * n1 + 0.4 * n2);
    float rl = lat + 0.03 * sin(lon * 2.3 + 1.) + 0.07 * (n1 - 0.5);
    float dust = exp(-rl * rl / 0.0022) * smoothstep(0.25, 0.7, 0.55 * n2 + 0.45 * n3);
    float glow = (core * (0.4 + 0.9 * clouds) * (0.75 + 0.5 * n3) * hi + 0.3 * wide * low) * (1. - 0.75 * dust);
    col = mix(vec3(0.14, 0.21, 0.46), vec3(0.40, 0.39, 0.50), core * clouds * hi) * (0.42 * glow);
  }
  // the stars above 40 degrees: a few bright, hundreds of middling, thousands of faint ones that crowd toward the river
  if (hi > 0.) {
    vec2 a = skySheet(d, 6., 0.3, px, 0.), b = skySheet(d, 20., 0.4, px, 31.), c = skySheet(d, 50., 0.14 + 0.45 * core * (0.5 + n1), px, 77.);
    col += (skyTint(a.y) * (1.25 * a.x) + skyTint(b.y) * (0.5 * b.x) + skyTint(c.y) * (0.22 * c.x)) * hi;
  }
  // and under them the lower stars, thinning smoothly downward to none at 18 degrees (a few more near the river)
  if (hi < 1.) {
    float x = clamp((d.y - 0.3) / 0.5, 0., 1.);
    vec2 w = skyWall(d, px, min(x * sqrt(x) * (1. + 1.2 * wide), 1.) * calm);
    col += skyTint(w.y) * (0.8 * (1. - hi) * w.x);
  }
  return col * calm;
}
void main() {
  vec3 d = vDir * inversesqrt(max(dot(vDir, vDir), 1e-6));
  float px = KD_PIXEL(d), gr = max(uKdGrow, 1.);                             // gr: the hole's growth past the crest
  // the sky as kdSky lays it (the air, the hole over it, the cloud over both), with the high sky behind the cloud
  vec4 h = kdHole(d), c = kdCloud(d);
  vec3 air = kdAir(d);
  // (the stars and the river stand only where the air itself is dark: none in the hole's glow, fewer toward the horizon)
  float calm = 1. - smoothstep(0.05, 0.085, dot(air, vec3(0.3, 0.59, 0.11)));
  vec3 col = mix(air * (1. - h.a) + h.rgb + skyHigh(d, px, calm) * (1. - h.a), c.rgb, c.a);
  float hr = degrees(acos(clamp(dot(d, KD_HOLE_DIR), -1., 1.)));              // degrees from the hole's centre
  float lit = clamp(dot(col, vec3(0.3, 0.59, 0.11)) * 5., 0., 1.);            // 1 where the band of fire crosses in front
  col -= ${DARK_UNDER.toFixed(3)} * (1. - lit) * (1. - smoothstep(KD_HOLE_SH * gr - 0.12, KD_HOLE_SH * gr + 0.04, hr));
  gl_FragColor = vec4(col, 1.);
}
`;

export async function buildSky(ctx, opts = {}) {
  const light = opts.light;
  const rng = ctx.core.makeRng(ctx.core.hashSeed('knee-deep-under-the-wave:sky:' + ctx.seed));
  const group = new THREE.Group();
  // the light's own uniform objects (the same ones, not copies) and the stars' deal
  const uniforms = { ...light.uniforms, uSkySeed: { value: new THREE.Vector2(Math.floor(rng() * 64), Math.floor(rng() * 64)) } };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: DOME_VERT, fragmentShader: light.GLSL + DOME_FRAG,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const geometry = new THREE.SphereGeometry(20000, 48, 24);
  const dome = new THREE.Mesh(geometry, material);
  dome.renderOrder = -10; dome.frustumCulled = false;
  group.add(dome);
  await ctx.yield();
  // the sky is drawn round the eye: the camera's place in the world (read from its world matrix)
  function update(time, s, camera) { if (camera) dome.position.setFromMatrixPosition(camera.matrixWorld); }
  update(0, 0, null);
  return { object: group, uniforms, update, dispose() { geometry.dispose(); material.dispose(); } };
}
