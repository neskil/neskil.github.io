// THE BRIMSTONE PARASOL: hero set piece for the world "brimstone-parasol".
// A volcanic plume on an airless moon: a braided white jet 2,400 m tall that falls back as a ribbed, blown-glass bell
// 5 km across, standing on a white snow ring, with a second small bell (the lining) round the jet and the exit ring
// hanging in that lining inside a collar of frost blades.
//
// ONE LAW places everything that falls: P(a,k,s) = (2500 k s cos a, 2400 (1 - s*s), 2500 k s sin a), s = fract(phase + t/240).
// Rib/knot patterns are functions of (s - t/240), so pattern, ribbons and grain sprites fall together (never sped up).
//
// PARTS (13 draw calls, about 122k triangles, 134k while the camera is in the curtain; build about 150 ms)
//   outer shells k 1 and 0.88 (additive, limb-bright, 96 main + ~480 hair ribs in the fragment, mean-tone filtered),
//   lining k 0.19 and 0.166 (parts round the ring in a 46 m teardrop), 96 billboarded rib ribbons with a 2.5 px floor,
//   five curtain skirts (lowest 320 m, falling streaks, fade near the camera), ~14k grain sprites (shell, lining, jet
//   knots, jet sparkle, crown puffs), jet core + nine counter-braided strands, crown boss, the vent cone (60 m sinter
//   cone, terraces, frost blades), the frost collar, the snow ring (spokes under each rib), and camera-wrapped
//   six-point flakes that are only drawn in and near the curtain.
//
// SIZE: radius 2,500 m, height 2,400 m; origin = centre of the vent at ground level (y 0), +Y up.
//
// HANDEDNESS (read this): the brief's map has north = +Z and east = +X, which in three.js would put the sun to PORT at
// entry. So that the pictures match the brief (sun to starboard, jet right of centre at entry, jet on the right at the
// exit), everything is mirrored by default: east = -X (opts.east = -1). Every anchor below is already mirrored;
// pass opts.east = 1 for the literal brief coordinates. anchors.east tells you which was used.
//
// OPTS
//   palette   7 hex strings (brief order: plain yellow, snow, vermilion, sage, ghost blue, sky, dark)
//   detail    0.5..1 (default ctx.quality.detail or 1): thins grain sprites, flakes, frost blades; never the shells/jet
//   east      -1 (default) or 1, see above;  sunDir Vector3 (default 14 degrees up, due east);  sunElevation degrees
//   portal    Vector3 local position of the exit ring (default brief x 300, y 545, z -208 mirrored)
//   portalDir Vector3 direction of travel through the ring (default south, climbing 30 degrees); the collar faces it
//   snowRing  false to leave the white ground ring out (your terrain does it);  snowRingY (default 0.6)
//   surge     0..1 density waves riding down the ribs (default: seeded, 30 percent of visits)
//   fog       0..1 how much scene fog applies (default 0: no air). All materials carry the fog chunks.
//   view      viewer aid only ('out','entry','curtain','in','jet','crown','ring'; also ?hv= in the _part viewer,
//             where 'out' is the default and shows a 1:5 model so the orbit fits the viewer's far plane)
//
// ANCHORS (local space)
//   portalSeat  { position, facing (normal toward the arriving camera), direction (travel: south, climbing 30 deg), radius 7 }
//   flyThrough  17 points of the brief's journey (entry, shore, curtain, ceiling, lining, crest, jet pass at 150 m,
//               quarter spiral, final 240 m straight). Clear of every solid by far more than 6 m; it crosses only veils.
//   viewpoints  entry / ceiling / jetPass / exit, each { position, lookAt }
//   jetBase, crown, cone { radius, height, throatRadius }, snowRing { inner, outer }, liningRing { inner, outer }
//   ribCount 96, ribAzimuth(i) (atan2(z, x) of rib i, for rib-shadow stripes on your ground), sunDir, east
//   law(a, k, s, out), shellHeightAt(r, k), fallSeconds 240, rim 2500, apex 2400  (for child parasols, dust, masks)
//
// HOOKS: update(dt, time, camera) every frame; setProgress(u) with the path u (the jet surges and the cone's frost
//   shakes hardest as the camera passes at u 0.84; never wall clock); setSun(dir); setPortal(localPos); hero.uniforms.
//   hero.uniforms.uDim / uDimL (default 1) scale the outer bell (shells + rib ribbons) and the lining wall: the world
//   eases them down on the climb to the ring so that it hangs in a dark field; the teardrop glow round the ring stays.
//   hero.uniforms.uRibW (default 1) scales the width of the 96 rib ribbons (the world thins them on the climb; the
//   curtain skirts follow uDim at three quarters). uBraid (0..1, set here from the camera's distance to the jet: 1
//   within 190 m, 0 beyond 430 m) thins the strands, steps the core's fill back and brightens the knots, so that close
//   by the jet reads as separate braids with beads racing up them instead of one blown column.
//
// LIGHTING: self-lit. Shells, ribs, grain and jet are additive HDR (jet about 2 before bloom); the cone, collar and
//   snow ring are shaded in their own shader with the brief's hard key and three fills (sulphur bounce, plume, planet),
//   so they need no scene lights and never go black. Wants a black sky and bloom about 0.5.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const RIM = 2500, APEX = 2400, FALL = 240;      // the one law: P(a,k,s) = (RIM k s cos a, APEX (1 - s*s), RIM k s sin a), s = fract(phase + t / FALL)
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lin = (hex) => new THREE.Color(hex);

// ---------- shared GLSL ----------
const G_COMMON = /* glsl */`
uniform float uTime, uInside, uSeed, uDim, uDimL, uDimR, uRibW, uBraid;
uniform vec3 uSun, uGold, uBlue, uPortal;
float h11(float n){ return fract(sin(n * 127.1 + uSeed) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h11(i), h11(i + 1.), f); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// sun-side tint of the falling grain: white-gold where the sun strikes, ghost blue at a third on the far flank
vec3 grainTint(vec3 outward){ return mix(uBlue * 0.33, uGold, smoothstep(-0.2, 0.5, dot(outward, uSun))); }
// the same for the bell's walls: seen from outside, the sunlit flank is held back so that its foot never burns out to white
vec3 wallTint(vec3 outward){ return mix(uBlue * 0.33, uGold * mix(0.6, 1., uInside), smoothstep(-0.2, 0.5, dot(outward, uSun))); }
`;
const G_FOG_V = /* glsl */`
#include <common>
#include <fog_pars_vertex>
`;
const G_FOG_F = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uFogK;
float fogAmt(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return (1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * uFogK;
    #else
      return smoothstep(fogNear, fogFar, vFogDepth) * uFogK;
    #endif
  #else
    return 0.;
  #endif
}
vec3 fogAdd(vec3 c){ return c * (1. - fogAmt()); }      // additive things fade out
vec3 fogMix(vec3 c){
  #ifdef USE_FOG
    return mix(c, fogColor, fogAmt());
  #else
    return c;
  #endif
}
`;

// paraboloid of fall: a grid in (azimuth, s) at sideways speed k. uv = (a / TAU, s), normal points outward and up.
function parabGeo(k, nA, nS, s0 = 0.012, s1 = 1, sPow = 1) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let j = 0; j <= nS; j++) {
    const s = lerp(s0, s1, Math.pow(j / nS, sPow)), r = RIM * k * s, y = APEX * (1 - s * s);
    const slope = 2 * APEX * s / (RIM * k), il = 1 / Math.hypot(slope, 1);
    for (let i = 0; i <= nA; i++) {
      const a = (i / nA) * TAU, c = Math.cos(a), sn = Math.sin(a);
      pos.push(r * c, y, r * sn); nor.push(c * slope * il, il, sn * slope * il); uv.push(i / nA, s);
    }
  }
  for (let j = 0; j < nS; j++) for (let i = 0; i < nA; i++) {
    const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(V3(0, APEX * 0.4, 0), 3600);
  return g;
}

// ---------- the shells (outer bell k 1 and 0.88, lining k 0.16 and 0.19) ----------
const SHELL_V = /* glsl */`
${G_FOG_V}
attribute float aK;
varying vec3 vW, vN; varying vec2 vAS; varying float vK;
void main(){
  vAS = uv; vK = aK;
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHELL_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform float uRibsMain, uRibsHair, uBase, uLining, uSurge, uScale, uSoft; uniform vec3 uOrigin;
varying vec3 vW, vN; varying vec2 vAS; varying float vK;
// value noise that wraps in x after n cells (the azimuth closes on itself without a seam)
float vn2p(vec2 p, float n){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float x0 = mod(i.x, n), x1 = mod(i.x + 1., n);
  return mix(mix(h21(vec2(x0, i.y)), h21(vec2(x1, i.y)), f.x), mix(h21(vec2(x0, i.y + 1.)), h21(vec2(x1, i.y + 1.)), f.x), f.y); }
// one family of ribs from the azimuth; below ~2 px it settles to its mean tone (no moire)
float ribs(float a01, float n, float w, float fw, float salt){
  float x = a01 * n, id = floor(x), f = abs(fract(x) - 0.5), px = max(fw * n, 1e-4);
  float tt = clamp(1. - f / (w + px), 0., 1.), line = tt * tt * (3. - 2. * tt);       // soft bell across each rib
  float br = 0.25 + 0.75 * h11(mod(id, n) + salt);
  return mix(line * br, w * 0.62, smoothstep(0.22, 0.55, px));
}
void main(){
  float a01 = vAS.x, s = vAS.y;
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float nv = dot(N, V), anv = abs(nv);
  float fw = fwidth(a01); fw = min(fw, 0.02);
  float ph = s - uTime / ${FALL.toFixed(1)};                       // the grain's own phase: pattern and grains fall together
  float hair = ribs(a01, uRibsHair, 0.2, fw, 7.);
  float mainR = ribs(a01, uRibsMain, 0.16, fw, 91.);
  float fine = ribs(a01 + 0.37 / uRibsHair, uRibsHair * 4., 0.3, fw, 33.);
  float idH = floor(a01 * uRibsHair), idM = floor(a01 * uRibsMain);
  float knH = 0.45 + 0.9 * vn1(ph * 46. + h11(idH) * 40.) * vn1(ph * 9. + h11(idH + 5.) * 9.) * 2.;
  float knM = 0.6 + 0.8 * vn1(ph * 30. + h11(idM + 3.) * 40.);
  float wave = 1. + uSurge * (0.5 + 0.5 * sin(ph * 6.2832 * 14.));   // 'surging' variation: density waves riding down
  float crown = smoothstep(0.03, 0.22, s);                         // ribs fade into the crown boss
  float pat = 0.36 + crown * (1.5 * hair * knH + 2.6 * mainR * knM + 0.6 * fine) * wave;
  // close up the grain itself shows: fine falling streaks that melt into the mean tone with distance
  float fpx = fw * uRibsHair * 16.;
  pat *= mix(0.55 + 0.9 * vn2(vec2(a01 * uRibsHair * 16., ph * 1500.)), 1., smoothstep(0.04, 0.3, fpx));
  // from inside, the bell is a luminous ceiling and not a rain of hairlines: the hair ribs melt halfway into broad sheaves
  // and slow clouds of denser grain that fall with the pattern, so the fall reads as glowing volume
  float cl = vn2p(vec2(a01 * 144., ph * 26.), 144.) * (0.35 + 1.3 * vn2p(vec2(a01 * 48. + 0.5, ph * 9. + 7.), 48.));
  float sheaf = 0.45 + 1.1 * vn2p(vec2(a01 * 60., 3.7), 60.);
  float patIn = 0.42 + crown * ((0.55 * hair * knH + 1.5 * mainR * knM + 0.2 * fine) * wave + (0.26 + 2.0 * cl) * sheaf);
  pat = mix(pat, patIn, uInside * uSoft);
  pat = mix(1.3, pat, crown);
  float limb = min(7., 1. / max(0.08, anv));
  float farK = mix(mix(1., 0.5, step(nv, 0.)), 0.7, uInside);       // far wall at half strength; inside: 0.07 face-on
  float kNearP = uLining * (1. - smoothstep(50., 150., length(vW - uPortal) / uScale));      // the lining keeps its full light round the ring
  float alpha = uBase * limb * pat * farK * mix(uDim, mix(uDimL, max(uDimL, 0.6), kNearP), uLining);      // uDim: the world eases the outer bell down on the climb to the ring
  vec3 outward = normalize(vec3(N.x, 0., N.z) + vec3(1e-5, 0., 0.));
  vec3 col = wallTint(outward);
  // the sun seen through the grain: a gold aureole (forward scatter), strongest from inside
  float fs = max(dot(-V, uSun), 0.); float f2 = fs * fs; float f8 = f2 * f2 * f2 * f2; float aure = f8 * f8 * f8;
  col += uGold * aure * (0.3 + 0.7 * step(nv, 0.) + 0.45 * uInside) * (0.6 + 0.8 * min(pat, 1.6)) / max(limb * 0.5, 1.);
  // foot of the bell: brighten slightly where the curtain thickens; top: thin toward the apex
  alpha *= mix(1., 1.35, smoothstep(0.93, 1., s) * (1. - uLining));
  // lining: part round the exit ring in a 46 m teardrop (grain is swept aside above, closes below)
  if (uLining > 0.5) {
    vec3 d = (vW - uPortal) / uScale; float up = d.y;
    float wdt = up > 0. ? 9.5 * sqrt(max(1. - up * up / 121., 0.)) : 9.5 * max(1. + up / 35., 0.);
    vec2 pr = (uPortal - uOrigin).xz; pr = pr / max(length(pr), 1e-3);
    float lat = abs(dot(d.xz, vec2(-pr.y, pr.x))) + 0.25 * max(abs(dot(d.xz, pr)) - 30., 0.);
    float tear = smoothstep(wdt - 1.5, wdt + 2.5, lat) + step(11., up) + step(up, -35.);
    float edge = exp(-abs(lat - wdt - 1.5) * 0.8) * smoothstep(-35., -24., up) * (1. - smoothstep(8., 13., up + (9.5 - wdt) * 0.4));
    alpha = alpha * clamp(tear, 0., 1.) + 0.42 * edge * (0.5 + 0.9 * vn2(vec2(a01 * 2600., ph * 2400.))) * step(vK, 0.17);
    // the arrival: within 130 m of the ring the falling grain itself shows, sunlit, sliding down both sides of the teardrop
    // and closing below it (the pattern is a function of the grain's phase, so it falls at the grain's 18 m/s)
    float kR = (1. - smoothstep(70., 190., length(d))) * step(vK, 0.17);
    float gr = smoothstep(0.7, 0.96, vn2(vec2(a01 * 4200., ph * 2100.))) + 0.6 * smoothstep(0.8, 0.98, vn2(vec2(a01 * 9500. + 7., ph * 3900.)));
    float flow = exp(-abs(lat - wdt - 3.) * 0.3) * smoothstep(-48., -30., up) * (1. - smoothstep(10., 22., up));
    alpha += gr * (0.3 + 1.2 * flow) * kR * clamp(tear, 0., 1.);
    alpha += exp(-lat * lat / 26.) * smoothstep(-125., -70., up) * (1. - smoothstep(-44., -33., up)) * (0.3 + 0.9 * gr) * step(vK, 0.17);      // the two streams closing below the ring: a bright seam
  }
  // a shell must never pop as the camera crosses it
  float dC = length(cameraPosition - vW) / uScale;
  float nearFade = mix(smoothstep(4., 60., dC) * mix(0.22, 1., smoothstep(60., 900., dC)), smoothstep(3., 22., dC), uLining);
  gl_FragColor = vec4(fogAdd(col * alpha * nearFade), 1.);
}`;

// ---------- 96 real ribs: billboarded ribbons along P with a pixel floor (geometry, so they have parallax) ----------
const RIB_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
uniform float uResY, uScale;
attribute vec4 aRib;                    // azimuth, s, side (-1..1), id
varying vec3 vOut; varying vec3 vP;     // vP = across (-1..1), phase coordinate, energy
varying float vId;
void main(){
  float a = aRib.x, s = aRib.y, k = 0.94 + 0.05 * (h11(aRib.w + 2.) - 0.5);
  vec3 rad = vec3(cos(a), 0., sin(a));
  vec3 p = vec3(${RIM}. * k * s * rad.x, ${APEX}. * (1. - s * s), ${RIM}. * k * s * rad.z);
  vec3 tang = normalize(vec3(${RIM}. * k * rad.x, -2. * ${APEX}. * s, ${RIM}. * k * rad.z));
  vec4 w = modelMatrix * vec4(p, 1.);
  vec3 toCam = cameraPosition - w.xyz; float dist = length(toCam);
  vec3 tw = normalize(mat3(modelMatrix) * tang);
  vec3 sideDir = cross(tw, toCam / max(dist, 1e-3));
  sideDir = sideDir / max(length(sideDir), 1e-3);
  float halfW = mix(3., 15., s) * (0.7 + 0.6 * h11(aRib.w)) * uScale * uRibW;     // uRibW: the world thins the ribs on the climb
  float pxW = 1.25 * dist * 2. / max(projectionMatrix[1][1] * uResY, 1.);   // half of the 2.5 px floor, in metres
  float hw = max(halfW, pxW);
  w.xyz += sideDir * aRib.z * hw;
  vOut = rad; vP = vec3(aRib.z, s, halfW / hw); vId = aRib.w;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIB_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform float uSurge;
varying vec3 vOut; varying vec3 vP; varying float vId;
void main(){
  float x = vP.x, s = vP.y, ph = s - uTime / ${FALL.toFixed(1)};
  float g = exp(-x * x * 3.2);
  float kn = 0.35 + 1.3 * vn1(ph * 60. + h11(vId) * 50.) * (0.5 + vn1(ph * 13. + vId));
  kn += 1.6 * smoothstep(0.82, 1., vn1(ph * 240. + vId * 3.7));                 // bright packets of grain
  kn *= 1. + uSurge * (0.5 + 0.5 * sin(ph * 6.2832 * 14.));
  float fade = smoothstep(0.035, 0.16, s) * (0.55 + 0.45 * h11(vId + 11.));
  vec3 col = wallTint(vOut) * mix(1., 0.8, uInside) * uDimR + uBlue * 0.3 * (1. - smoothstep(-0.2, 0.5, dot(vOut, uSun))) * (1. - uDimR);      // uDimR: the ribbons keep more of their light than the shells on the climb, so they stay clean hairlines of gold and blue
  gl_FragColor = vec4(fogAdd(col * g * kn * fade * vP.z * 0.5), 1.);
}`;
function ribGeo(nRib, nSeg, rng) {
  const d = [], idx = [];
  for (let r = 0; r < nRib; r++) {
    const a = ((r + 0.5) / nRib) * TAU, base = d.length / 4;
    for (let j = 0; j <= nSeg; j++) {
      const s = lerp(0.03, 1, j / nSeg);
      d.push(a, s, -1, r, a, s, 1, r);
      if (j < nSeg) { const q = base + j * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('aRib', new THREE.Float32BufferAttribute(d, 4));
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((d.length / 4) * 3), 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(V3(0, APEX * 0.4, 0), 3600);
  return g;
}

// ---------- the snow curtain: the lowest 320 m of five skirt shells with falling streaks ----------
const SKIRT_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform float uScale;
varying vec3 vW, vN; varying vec2 vAS; varying float vK;
void main(){
  float a01 = vAS.x, s = vAS.y, ph = s - uTime / ${FALL.toFixed(1)};
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float anv = abs(dot(N, V));
  float fw = min(fwidth(a01), 0.01) * 2600., n = 2600.;             // streaks ~6 m apart at the rim
  float x = a01 * n + vK * 311., id = floor(x), f = abs(fract(x) - 0.5);
  float line = 1. - smoothstep(max(0.22 - fw, 0.), 0.22 + fw, f);
  float streak = line * (0.2 + 0.8 * h11(id)) * (0.3 + 1.4 * vn1(ph * 900. + h11(id + 9.) * 300.));
  streak = mix(streak, 0.3, smoothstep(0.2, 0.6, fw));
  float veil = 0.55 + 0.9 * vn2(vec2(a01 * 420. + vK * 40., ph * 150.)) * vn2(vec2(a01 * 90. - vK * 17., ph * 40.)) * 2.;
  float h01 = clamp((1. - s * s) * ${(APEX / 320).toFixed(3)}, 0., 1.);            // 0 at the ground, 1 at the skirt's top edge
  float body = (1. - smoothstep(0.35, 1., h01)) * (0.75 + 0.6 * (1. - h01));
  float limb = min(3.5, 1. / max(0.12, anv));
  float dC = length(cameraPosition - vW) / uScale;
  float nearFade = smoothstep(6., 34., dC) * mix(0.3, 1., smoothstep(40., 700., dC));   // crossing a veil never pops, and the wall never whites out from within
  vec3 outward = normalize(vec3(N.x, 0., N.z) + vec3(1e-5, 0., 0.));
  vec3 col = mix(wallTint(outward), vec3(0.82, 0.88, 0.95) * (0.45 + 0.55 * smoothstep(-0.3, 0.4, dot(outward, uSun))) * mix(0.7, 1., uInside), 0.45);
  float nearK = 1. - smoothstep(120., 900., dC);
  float alpha = 0.11 * limb * body * (0.45 * veil + (1.1 + 1.3 * nearK) * streak) * (1. + 0.5 * nearK) * nearFade * mix(1., 0.6, uInside) * mix(1., uDim, 0.75);
  gl_FragColor = vec4(fogAdd(col * alpha), 1.);
}`;

function mergeGeos(list, kList) {
  // tiny merge for same-layout indexed geometries, adding the per-shell aK attribute
  let nV = 0, nI = 0; for (const g of list) { nV += g.attributes.position.count; nI += g.index.count; }
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), kk = new Float32Array(nV), idx = new Uint32Array(nI);
  let v = 0, ii = 0;
  list.forEach((g, n) => {
    pos.set(g.attributes.position.array, v * 3); nor.set(g.attributes.normal.array, v * 3); uv.set(g.attributes.uv.array, v * 2);
    kk.fill(kList[n], v, v + g.attributes.position.count);
    const src = g.index.array; for (let i = 0; i < src.length; i++) idx[ii + i] = src[i] + v;
    v += g.attributes.position.count; ii += src.length; g.dispose();
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.BufferAttribute(kk, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(V3(0, APEX * 0.4, 0), 3600);
  return g;
}

// ---------- the jet: a tapered core, nine braided strands, knots racing up, a sheath of sparkle ----------
const G_JET = /* glsl */`
uniform float uTwist;
float jetR(float y01){ return mix(15., 35., y01) + 60. * y01 * y01 * y01 * y01 * y01 * y01 * y01 * y01; }
float flowQ(float y01){ return 1. - sqrt(max(1. - y01, 0.)); }       // inverse of y = APEX (1 - (1 - q)^2)
vec3 helix(float y, float id, float rMul){
  float y01 = clamp(y / ${APEX}., 0., 1.), ring = mod(id, 3.);
  float rr = (0.30 + 0.29 * ring) * jetR(y01) * rMul;
  float dir = ring > 0.5 && ring < 1.5 ? -1. : 1.;
  float ang = id * 0.6981 + dir * (y * ${(TAU / 400).toFixed(6)} * uTwist + uTime * 0.07) + 0.6 * sin(y * 0.004 + id * 1.7);
  return vec3(cos(ang) * rr, y, sin(ang) * rr);
}`;
const CORE_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
${G_JET}
varying vec3 vW, vN; varying vec2 vAQ;
void main(){
  float y01 = uv.y, a = uv.x * 6.2831853;
  float q = flowQ(y01) - uTime / 40.;
  float r = jetR(y01) * (0.86 + 0.2 * vn2(vec2(uv.x * 5., q * 60.)) + 0.1 * sin(a * 3. + y01 * 40. - uTime * 0.8));
  vec3 p = vec3(cos(a) * r, y01 * ${APEX}., sin(a) * r);
  vAQ = vec2(uv.x, y01);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * vec3(cos(a), 0., sin(a)));
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CORE_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
${G_JET}
uniform float uJet;
varying vec3 vW, vN; varying vec2 vAQ;
void main(){
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float f = abs(dot(N, V)), y01 = vAQ.y;
  float q = flowQ(y01) - uTime / 40.;
  float streak = vn2(vec2(vAQ.x * 28., q * 30.)) * 0.6 + vn2(vec2(vAQ.x * 9. + q * 3., q * 140.)) * 0.7;
  float puff = vn1(q * 55.) * vn1(q * 13. + 4.);
  float body = f * f * (0.35 + 0.9 * streak + 0.7 * puff);
  vec3 col = mix(vec3(0.80, 0.90, 1.0), grainTint(N) * 1.15 + vec3(0.25), 0.55);
  float foot = smoothstep(0.0, 0.004, y01) * (1. + 1.4 * exp(-y01 * 50.));         // hottest in the throat
  float top = 1. - 0.55 * smoothstep(0.8, 1., y01);
  gl_FragColor = vec4(fogAdd(col * body * foot * top * uJet * 0.24 * mix(1., 0.5, uBraid) * (gl_FrontFacing ? 1. : 0.55)), 1.);     // uBraid: close by, the core's fill steps back so the strands and knots carry the light
}`;
const STRAND_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
${G_JET}
uniform float uResY, uScale;
attribute vec3 aT;                      // y01, ring angle, strand id
varying vec3 vW, vN; varying vec3 vT;
void main(){
  float y01 = aT.x, y = y01 * ${APEX}. * 0.992, id = aT.z;
  vec3 c = helix(y, id, 1.);
  float q = flowQ(y01) - uTime / 40.;
  float tr = mix(3.2, 7., y01) * (0.75 + 0.7 * vn1(q * 90. + id * 7.)) * mix(1., 0.68, uBraid);               // lumpy: grain bunching; thinner close by, so dark gaps show between the braids
  vec4 wc = modelMatrix * vec4(c, 1.);
  float dist = length(cameraPosition - wc.xyz);
  float pxW = 0.8 * dist * 2. / max(projectionMatrix[1][1] * uResY, 1.);
  float rr = max(tr * uScale, pxW);
  vec3 n = vec3(cos(aT.y), 0., sin(aT.y));
  vec4 w = wc + vec4(mat3(modelMatrix) * n * (rr / uScale), 0.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vT = vec3(y01, id, tr * uScale / rr);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STRAND_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
${G_JET}
uniform float uJet;
varying vec3 vW, vN; varying vec3 vT;
void main(){
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float f = max(dot(N, V), 0.), y01 = vT.x, id = vT.y;
  float q = flowQ(y01) - uTime / 40.;
  float kn = (0.25 + 0.9 * vn1(q * 90. + id * 7.)) * mix(1., 0.8, uBraid) + (1.3 + 2.2 * uBraid) * smoothstep(0.72, 1., vn1(q * 260. + id * 31.));   // knots: beads of brighter grain
  float sun = 0.55 + 0.45 * smoothstep(-0.4, 0.6, dot(N, uSun));
  vec3 col = mix(grainTint(N), vec3(0.86, 0.93, 1.0), 0.5) * sun;
  float top = 1. - smoothstep(0.9, 1., y01);
  float foot = smoothstep(0.0, 0.006, y01);
  gl_FragColor = vec4(fogAdd(col * mix(f * sqrt(f), f * f * f * 1.2, uBraid) * kn * top * foot * vT.z * uJet * 0.6), 1.);
}`;
function coreGeo(nA, nH) {
  const g = new THREE.PlaneGeometry(1, 1, nA, nH);      // uv carries (azimuth, height); the vertex shader shapes it
  g.boundingSphere = new THREE.Sphere(V3(0, APEX * 0.5, 0), APEX * 0.6);
  return g;
}
function strandGeo(nStr, nRing, nSeg) {
  const d = [], idx = [];
  for (let s = 0; s < nStr; s++) {
    const base = d.length / 3;
    for (let j = 0; j <= nSeg; j++) {
      const y01 = Math.pow(j / nSeg, 1.5);              // denser near the foot, where the camera passes
      for (let i = 0; i <= nRing; i++) d.push(y01, (i / nRing) * TAU, s);
    }
    for (let j = 0; j < nSeg; j++) for (let i = 0; i < nRing; i++) {
      const a = base + j * (nRing + 1) + i, b = a + 1, c = a + nRing + 1, e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('aT', new THREE.Float32BufferAttribute(d, 3));
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(d.length), 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(V3(0, APEX * 0.5, 0), APEX * 0.6);
  return g;
}

// ---------- grain: instanced soft quads placed by the law in the vertex shader ----------
// aI = (azimuth | strand id | angle, k | radius mul | radius, phase, type)   aJ = (size m, rnd, rnd, brightness)
// type 0 shell grain, 1 lining grain, 2 jet knot, 3 jet sparkle, 4 crown puff
const GRAIN_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
${G_JET}
uniform float uResY, uScale;
attribute vec4 aI, aJ;
varying vec2 vC; varying vec4 vCol;
void main(){
  float type = aI.w, fade = 1., size = aJ.x, tw = 1.;
  vec3 p, outward;
  if (type < 1.5) {
    float s = fract(aI.z + uTime / ${FALL.toFixed(1)}), a = aI.x;
    outward = vec3(cos(a), 0., sin(a));
    p = vec3(${RIM}. * aI.y * s * outward.x, ${APEX}. * (1. - s * s), ${RIM}. * aI.y * s * outward.z);
    fade = smoothstep(0.03, 0.12, s) * (1. - smoothstep(0.985, 1., s));
    tw = 0.35 + 2.2 * pow(abs(sin(uTime * (0.5 + aJ.y) + aJ.z * 6.283)), 10.);
  } else if (type < 3.5) {
    float q = fract(aI.z + uTime / 40.), y01 = 1. - (1. - q) * (1. - q);
    p = helix(y01 * ${APEX}. * 0.992, aI.x, aI.y);
    if (type > 2.5) { p.xz += (vec2(aJ.y, aJ.z) - 0.5) * jetR(y01) * 0.9; tw = 0.3 + 2.4 * pow(abs(sin(uTime * (1.2 + 2. * aJ.y) + aJ.z * 6.283)), 8.); }
    else size *= mix(1., 2.4, y01) * (0.8 + 0.4 * sin(q * 40. + aJ.y * 6.283));
    outward = normalize(vec3(p.x, 0., p.z) + vec3(1e-4, 0., 0.));
    fade = smoothstep(0., 0.02, q) * (1. - smoothstep(0.8, 1., q));
  } else {
    float sw = 1. + 0.22 * sin(uTime * (0.25 + 0.3 * aJ.y) + aJ.z * 6.283);     // the crown boss swelling and settling
    outward = vec3(cos(aI.x), 0., sin(aI.x));
    p = outward * aI.y * sw + vec3(0., ${APEX}. - aI.y * aI.y * 0.0009 + aI.z * 34. * sw, 0.);
    size *= sw;
  }
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
  float sz = size * uScale, floorSz = 0.75 * (-mvPosition.z) * 2. / max(projectionMatrix[1][1] * uResY, 1.);
  float big = max(sz, floorSz);
  float energy = sz / big; energy = max(energy * energy, 0.1);
  mvPosition.xy += position.xy * big * 2.;
  vC = position.xy * 2.;
  vec3 tint = type < 1.5 ? grainTint(outward) : mix(grainTint(outward), vec3(0.86, 0.93, 1.), 0.45);
  float dimK = type < 0.5 ? mix(1., uDim, 0.8) : (type < 1.5 ? mix(1., uDimL, 0.6) : 1.);      // the bell's own grains ease down with it on the climb
  vCol = vec4(tint * aJ.w * fade * tw * energy * dimK, type);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GRAIN_F = /* glsl */`
${G_FOG_F}
uniform float uJet;
varying vec2 vC; varying vec4 vCol;
void main(){
  float r2 = dot(vC, vC);
  float soft = exp(-r2 * 3.5) * (1. - smoothstep(0.7, 1., r2));
  float core = exp(-r2 * 14.);
  float m = vCol.w > 3.5 ? soft * 0.55 : (vCol.w > 1.5 ? (soft * 0.4 + core * 0.7) * uJet : soft + core);
  gl_FragColor = vec4(fogAdd(vCol.rgb * m), 1.);
}`;

// ---------- crown boss: the 300 m cap where the strands turn over into ribs ----------
const BOSS_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
varying vec3 vW, vN; varying vec2 vAS;
void main(){
  vAS = uv; float e = 1. - clamp(uv.y / 0.1, 0., 1.);
  float sw = 1. + 0.16 * sin(uTime * 0.31) + 0.1 * sin(uTime * 0.83 + uv.x * 18.85);
  vec3 p = position; p.y += 55. * e * e * sw; p.xz *= 1. + 0.05 * (sw - 1.);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BOSS_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform float uJet, uRibsMain;
varying vec3 vW, vN; varying vec2 vAS;
void main(){
  float a01 = vAS.x, s = vAS.y, e = 1. - clamp(s / 0.1, 0., 1.);
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float limb = min(3., 1. / max(0.2, abs(dot(N, V))));
  float ph = s - uTime / ${FALL.toFixed(1)};
  float lobes = 0.5 + 0.5 * sin(a01 * 6.2832 * 9. + uTime * 0.07 * 9. + s * 60.);       // the nine strands turning over
  float spokes = 0.5 + 0.5 * cos(a01 * 6.2832 * uRibsMain);
  float rings = vn1(ph * 420. + 3. * sin(a01 * 6.2832 * 3.)) * 0.8 + vn2(vec2(a01 * 60., ph * 900.)) * 0.5;
  float d = e * e * (0.5 + 0.7 * lobes * e + 0.45 * rings) + (1. - e) * e * 1.2 * spokes * (0.4 + rings);
  vec3 col = mix(vec3(0.82, 0.91, 1.), uGold, 0.35 + 0.4 * smoothstep(-0.3, 0.6, dot(N, uSun)));
  float edge = smoothstep(0., 0.25, 1. - e) ;
  gl_FragColor = vec4(fogAdd(col * (0.05 + 0.3 * d) * limb * uJet * mix(1.5, 1., edge) * smoothstep(0., 0.2, e)), 1.);
}`;

// ---------- solid parts (vent cone, frost collar): lit by the brief's key and three fills, so they never go black ----------
const SOLID_V = /* glsl */`
${G_FOG_V}
uniform float uTime, uShake;
attribute vec3 color; attribute float aF;
varying vec3 vW, vN, vC; varying float vF;
void main(){
  vC = color; vF = aF;
  vec3 p = position;
  // frost shaking in the roar: a fine shiver on frosted parts only, strongest high on the cone
  float sh = uShake * aF * smoothstep(20., 60., p.y);
  p += normal * sh * 0.22 * sin(uTime * 23. + p.x * 1.7 + p.z * 2.3 + p.y) + vec3(sin(uTime * 17. + p.y * 0.9), 0., cos(uTime * 19. + p.y * 1.1)) * sh * 0.08;
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SOLID_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform vec3 uKeyCol, uBounce, uPlanetDir, uJetPos; uniform float uJetLight, uScale;
varying vec3 vW, vN, vC; varying float vF;
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing) N = -N;
  // fine procedural breakup: crystalline grain on frost, pitted crust on sulphur
  vec3 q = vW / uScale;
  float g1 = vn2(q.xz * 0.9 + q.y * 0.7), g2 = vn2(q.xz * 5.3 - q.y * 3.1), g3 = vn2(vec2(q.x + q.z, q.y) * 19.);
  vec3 alb = vC * (0.80 + 0.22 * g1 + 0.12 * g2 - 0.08 * g3 * (1. - vF));
  alb = min(alb, vec3(0.78));
  float ndl = dot(N, uSun);
  float key = mix(smoothstep(-0.02, 0.10, ndl) * max(ndl, 0.), clamp((ndl + 0.55) / 1.55, 0., 1.), vF * 0.55);   // frost scatters: light wraps round it
  vec3 fill = mix(uBounce * 0.35, vec3(0.56, 0.65, 0.78) * 0.62, vF * 0.85) * (0.75 - 0.25 * N.y)      // ground bounce; blue in snow shadow
            + vec3(0.81, 0.89, 1.) * 0.2 * (0.5 + 0.5 * N.y)                                              // the plume overhead
            + vec3(0.616, 0.722, 0.604) * 0.12 * max(dot(N, uPlanetDir), 0.);                             // planet-shine
  // the jet itself lights whatever stands near it
  vec3 toJ = uJetPos - vW; toJ.y = 0.; float dj = length(toJ) / uScale;
  fill += vec3(0.8, 0.9, 1.) * uJetLight * max(dot(N, toJ / max(length(toJ), 1e-3)) * 0.6 + 0.4, 0.) / (1. + dj * dj * 0.0006);
  vec3 col = alb * (uKeyCol * key * 1.12 + fill);
  // frost glints: sparse facets that catch the sun and turn over slowly
  vec2 cell = floor(q.xz * 2.2 + q.y * 1.3); float hh = h21(cell);
  vec3 fn = normalize(N + (vec3(h21(cell + 3.), h21(cell + 7.), h21(cell + 13.)) - 0.5) * 0.9);
  vec3 Hh = normalize(uSun + V + vec3(0., 1e-3, 0.)); float sp = max(dot(fn, Hh), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  float blink = smoothstep(0.55, 1., sin(uTime * (0.6 + hh) + hh * 40.));
  col += uGold * sp * blink * vF * step(0.72, hh) * 3.2 * smoothstep(-0.02, 0.1, ndl);
  { float rimF = 1. - abs(dot(N, V)); col += uGold * vF * 0.14 * rimF * rimF; }                                                // sub-surface rim on thin frost
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

// triangle soup builder with vertex colour and frost amount
function soup() {
  const P = [], N = [], C = [], F = [];
  const a = V3(), b = V3(), n = V3();
  return {
    P, N, C, F,
    tri(p0, p1, p2, col, f) {              // flat-shaded triangle
      a.subVectors(p1, p0); b.subVectors(p2, p0); n.crossVectors(a, b).normalize();
      for (const p of [p0, p1, p2]) { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); F.push(f); }
    },
    // a frost blade: a four-sided spindle, bevelled belly a third of the way up, slightly twisted
    blade(base, dir, len, wid, col, tipCol, f, twist = 0) {
      const d = dir.clone().normalize(), u = Math.abs(d.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
      const s = V3().crossVectors(d, u).normalize(), t = V3().crossVectors(d, s).normalize();
      const sc = Math.cos(twist), ss = Math.sin(twist);
      const s2 = s.clone().multiplyScalar(sc).addScaledVector(t, ss), t2 = t.clone().multiplyScalar(sc).addScaledVector(s, -ss);
      const mid = base.clone().addScaledVector(d, len * 0.32), tip = base.clone().addScaledVector(d, len);
      const m = [mid.clone().addScaledVector(s2, wid), mid.clone().addScaledVector(t2, wid * 0.35), mid.clone().addScaledVector(s2, -wid), mid.clone().addScaledVector(t2, -wid * 0.35)];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.tri(base, m[j], m[i], col, f * 0.7); this.tri(m[i], m[j], tip, tipCol, f); }
    },
    addIndexed(geo, colArr, fArr) {        // smooth-shaded indexed geometry with per-vertex colour / frost
      const g = geo.toNonIndexed(), p = g.attributes.position.array, nn = g.attributes.normal.array, src = geo.index.array;
      for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(nn[i]); }
      for (let i = 0; i < src.length; i++) { const v = src[i]; C.push(colArr[v * 3], colArr[v * 3 + 1], colArr[v * 3 + 2]); F.push(fArr[v]); }
      g.dispose(); geo.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 1));
      g.computeBoundingSphere();
      return g;
    },
  };
}

// ---------- the vent: a 60 m frost cone with a 24 m throat, sinter terraces, buttress flows, frost blades on the lip ----------
async function buildCone(rng, noise, pal, P, yld) {
  const sp = soup(), nA = 144, rows = [];
  const lobes = rng.int(6, 10), lobePh = rng.range(0, TAU), nz = rng.range(0, 100);
  for (let i = 0; i <= 52; i++) rows.push({ t: i / 52, part: 0 });
  rows.push({ t: 1, part: 1, r: 13.2, dy: 0.9 }, { t: 1, part: 1, r: 12.2, dy: 0.2 }, { t: 1, part: 1, r: 11.7, dy: -2.5 });
  for (let i = 1; i <= 4; i++) rows.push({ t: 1, part: 2, r: 11.7 - i * 0.5, dy: -2.5 - i * 7 });
  const surf = (a, t, out = V3()) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    let r = lerp(P.coneR, 14.6, Math.pow(t, 0.8)), y = P.coneH * Math.pow(t, 1.75);
    const flow = 0.5 + 0.5 * Math.sin(a * lobes + lobePh + 2.2 * noise.n2(ca * 1.3 + nz, sa * 1.3));
    r *= 1 + (1 - t) * (0.2 * flow + 0.14 * noise.fbm2(ca * 2.2 + nz, sa * 2.2 + t * 1.5, 3));
    const gul = Math.abs(noise.n3(ca * 3.4 + nz, sa * 3.4, t * 2.2));                              // gullies combed down the slope
    r *= 1 - 0.11 * (1 - gul) * (1 - gul) * Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const st = y / 3.6, fs = st - Math.floor(st);                                     // sinter terraces, bevelled risers
    y = lerp(y, (Math.floor(st) + smoothstep(0.6, 0.92, fs)) * 3.6, 0.9 * (1 - t * 0.7) * smoothstep(0.02, 0.15, t));
    y += t * t * P.rimBreak * noise.n2(ca * 2.6 + 9 + nz, sa * 2.6);                  // a broken crown
    return out.set(ca * r, y, sa * r);
  };
  const pos = [], col = [], fr = [], idx = [], v = V3(), c = new THREE.Color();
  const ver = lin(pal[2]), cus = lin(pal[0]), snow = lin(pal[1]), dark = lin(pal[6]);
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]; if (yld && j % 6 === 5) await yld();
    for (let i = 0; i <= nA; i++) {
      const a = (i / nA) * TAU; surf(a, row.t, v);
      if (row.part > 0) { const top = v.y; v.set(Math.cos(a) * row.r, top + row.dy, Math.sin(a) * row.r); }
      pos.push(v.x, v.y, v.z);
      const n1 = noise.fbm2(v.x * 0.045 + nz, v.z * 0.045, 3), n2 = noise.n3(Math.cos(a) * 4.5, Math.sin(a) * 4.5, row.t * 3 + nz);
      let f = smoothstep(0.1, 0.5, row.t + 0.3 * n1 + 0.12 * n2);                    // frost creeps down from the lip
      f = Math.max(f, 0.8 * smoothstep(0.55, 0.9, (v.y / 3.6) % 1) * smoothstep(0.08, 0.3, row.t)); // and lies on every terrace tread
      c.copy(ver).lerp(cus, 0.45).multiplyScalar(0.7).lerp(cus, smoothstep(-0.05, 0.26, row.t + 0.3 * n1)).multiplyScalar(0.72 + 0.2 * n2);
      c.lerp(snow, f * 0.92).multiplyScalar(0.78 / 0.9);
      const gl = Math.abs(noise.n3(Math.cos(a) * 3.4 + nz, Math.sin(a) * 3.4, row.t * 2.2)), ris = smoothstep(0.55, 0.75, (v.y / 3.6) % 1) * (1 - smoothstep(0.9, 1, (v.y / 3.6) % 1));
      c.multiplyScalar((0.62 + 0.38 * smoothstep(0, 0.35, gl)) * (1 - 0.3 * ris * (1 - row.t)));       // baked occlusion in gullies and under risers
      if (row.part === 2) { c.lerp(dark, 0.55); f *= 0.4; }
      col.push(c.r, c.g, c.b); fr.push(f);
    }
  }
  if (yld) await yld();
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nA; i++) {
    const a = j * (nA + 1) + i, b = a + 1, d = a + nA + 1, e = d + 1; idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (yld) await yld();
  sp.addIndexed(g, col, fr);
  if (yld) await yld();
  // frost blades: a ragged crown on the lip, rosettes down the flank in the lee of every terrace
  const gold = lin('#FFF0C8'), bc = new THREE.Color(), tc = new THREE.Color(), b0 = V3(), dir = V3();
  const nLip = Math.round(84 * P.detail);
  for (let i = 0; i < nLip; i++) {
    const a = (i / nLip) * TAU + rng.range(-0.03, 0.03); surf(a, rng.range(0.93, 1), b0); b0.y -= 0.4;
    dir.set(Math.cos(a) * rng.range(0.1, 0.9), 1, Math.sin(a) * rng.range(0.1, 0.9)).add(V3(rng.range(-0.3, 0.3), 0, rng.range(-0.3, 0.3)));
    bc.copy(snow).multiplyScalar(0.8); tc.copy(snow).lerp(gold, 0.5).multiplyScalar(0.86);
    sp.blade(b0, dir, rng.range(2.5, 8.5), rng.range(0.5, 1.1), bc, tc, 1, rng.range(0, 3));
  }
  const nRos = Math.round(46 * P.detail);
  for (let i = 0; i < nRos; i++) {
    const a = rng.range(0, TAU), t = rng.range(0.12, 0.9); surf(a, t, b0);
    const n = rng.int(6, 9), size = rng.range(1.6, 4.6), lean = V3(Math.cos(a), 1.1, Math.sin(a));
    for (let k = 0; k < n; k++) {
      const ka = (k / n) * TAU + rng.range(-0.2, 0.2);
      dir.set(Math.cos(ka), rng.range(0.25, 0.8), Math.sin(ka)).addScaledVector(lean, 0.5);
      bc.copy(cus).lerp(snow, 0.7).multiplyScalar(0.8); tc.copy(snow).multiplyScalar(0.86);
      sp.blade(b0, dir, size * rng.range(0.6, 1), size * 0.13, bc, tc, 1, rng.range(0, 3));
    }
  }
  return sp.build();
}

// ---------- the exit ring's collar: white-gold frost blades grown round the rim of the 14 m portal ----------
function buildCollar(rng, pal, P) {
  const sp = soup(), snow = lin(pal[1]), gold = lin('#FFF0C8'), bc = new THREE.Color(), tc = new THREE.Color();
  const R0 = 7.55, nSeg = 72, nTube = 8, pos = [], col = [], fr = [], idx = [];
  for (let i = 0; i <= nSeg; i++) for (let j = 0; j <= nTube; j++) {            // a lumpy rimed hoop for the blades to grow from
    const a = (i / nSeg) * TAU, b = (j / nTube) * TAU, lump = 0.4 + 0.12 * Math.sin(a * 11 + P.seed) + 0.1 * Math.sin(a * 29 + 2 * P.seed);
    const rr = R0 + lump + Math.cos(b) * lump;
    pos.push(Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(b) * lump * 1.2);
    bc.copy(snow).lerp(gold, 0.35 + 0.3 * Math.sin(a * 5 + b)).multiplyScalar(0.8); col.push(bc.r, bc.g, bc.b); fr.push(0.9);
  }
  for (let i = 0; i < nSeg; i++) for (let j = 0; j < nTube; j++) {
    const a = i * (nTube + 1) + j, b = a + 1, c = a + nTube + 1, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  sp.addIndexed(g, col, fr);
  const n = Math.round(420 * P.detail), b0 = V3(), dir = V3();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rng.range(-0.02, 0.02), tier = i % 3, ca = Math.cos(a), sa = Math.sin(a);
    const cant = tier === 0 ? rng.range(-0.15, 0.15) : (tier === 1 ? rng.range(0.5, 1.1) : -rng.range(0.5, 1.1));
    const len = (tier === 0 ? rng.range(2.2, 3.9) : rng.range(0.9, 2.6)) * (1 + 0.35 * Math.max(0, sa)) * (rng.chance(0.25) ? 0.5 : 1);     // longer on the upper arc
    b0.set(ca * (R0 + 0.5), sa * (R0 + 0.5), cant * 0.3);
    dir.set(ca + rng.range(-0.25, 0.25) * -sa, sa + rng.range(-0.25, 0.25) * ca, cant);
    bc.copy(snow).lerp(gold, 0.5).multiplyScalar(0.74); tc.copy(gold).lerp(snow, rng.range(0, 0.5)).multiplyScalar(0.9);
    sp.blade(b0, dir, len, len * rng.range(0.07, 0.12), bc, tc, 1, rng.range(0, 3));
  }
  return sp.build();
}

const DEF_PALETTE = ['#F2D24B', '#E9EFE6', '#D9502B', '#9DB89A', '#6FB4FF', '#0A0C1A', '#1A1410'];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('parasol') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.5, 1);
  const E = opts.east === 1 ? 1 : -1;                       // which way local X the brief's east lies (see header)
  const bx = (x, y, z) => V3(x * E, y, z);                  // brief coordinates -> local
  const sunEl = (opts.sunElevation ?? 14) * Math.PI / 180;
  const sunDir = opts.sunDir ? V3().copy(opts.sunDir).normalize() : V3(E * Math.cos(sunEl), Math.sin(sunEl), 0);
  const P = {
    detail, seed: rng.range(0, 50),
    coneR: rng.range(88, 104), coneH: 60, rimBreak: rng.range(3, 7),
    hair: rng.int(21, 27) * 20, twist: rng.sign() * rng.range(0.85, 1.25),
    surge: opts.surge ?? (rng.chance(0.3) ? rng.range(0.5, 0.9) : 0),
  };
  const portalPos = opts.portal ? V3().copy(opts.portal) : bx(300, 545, -208);
  const portalDir = (opts.portalDir ? V3().copy(opts.portalDir) : V3(0, 0.5, -Math.cos(Math.PI / 6))).normalize();   // direction of travel through the ring (default: south, climbing 30 degrees)

  // shared uniforms (same objects in every material)
  const U = {
    uTime: { value: 0 }, uFogK: { value: opts.fog ?? 0 }, uInside: { value: 0 }, uDim: { value: 1 }, uDimL: { value: 1 }, uDimR: { value: 1 }, uRibW: { value: 1 }, uBraid: { value: 0 }, uSeed: { value: P.seed },
    uSun: { value: sunDir }, uGold: { value: lin('#FFF0C8') }, uBlue: { value: lin(pal[4]) }, uPortal: { value: portalPos.clone() },
    uScale: { value: 1 }, uResY: { value: 900 }, uJet: { value: 1 }, uTwist: { value: P.twist }, uSurge: { value: P.surge },
    uRibsMain: { value: 96 }, uRibsHair: { value: P.hair }, uOrigin: { value: V3() }, uSoft: { value: 1 },
  };
  const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o,
  });
  const object = new THREE.Group(); object.name = 'brimstone-parasol';
  const add = (geo, m, order) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = order; object.add(me); return me; };

  // 1. the bell: two outer shells and the lining
  const outer = add(mergeGeos([parabGeo(1, 160, 36), parabGeo(0.88, 160, 36)], [1, 0.88]),
    mat(SHELL_V, SHELL_F, { uBase: { value: 0.052 }, uLining: { value: 0 } }), 2);
  await ctx.yield?.();
  const lining = add(mergeGeos([parabGeo(0.19, 96, 24, 0.05), parabGeo(0.166, 96, 24, 0.05)], [0.19, 0.166]),
    mat(SHELL_V, SHELL_F, { uBase: { value: 0.032 }, uLining: { value: 1 }, uRibsMain: { value: 48 }, uRibsHair: { value: P.hair / 4 } }), 3);
  await ctx.yield?.();
  // 2. ribs with parallax, 3. the snow curtain
  const ribs = add(ribGeo(96, 40, rng), mat(RIB_V, RIB_F), 4);
  await ctx.yield?.();
  const sk = [0.88, 0.91, 0.94, 0.97, 1];
  const skirts = add(mergeGeos(sk.map((k) => parabGeo(k, 160, 4, Math.sqrt(1 - 320 / APEX), 1)), sk), mat(SHELL_V, SKIRT_F), 5);
  await ctx.yield?.();
  // 4. the jet
  const core = add(coreGeo(32, 64), mat(CORE_V, CORE_F), 6);
  await ctx.yield?.();
  const strands = add(strandGeo(9, 6, 100), mat(STRAND_V, STRAND_F, {}, { side: THREE.FrontSide }), 7);
  const boss = add(parabGeo(1, 96, 10, 0.0005, 0.1), mat(BOSS_V, BOSS_F), 8);
  await ctx.yield?.();
  // 5. grain
  const aI = [], aJ = [];
  const nShell = Math.round(9000 * detail), nLin = Math.round(1800 * detail), nSpark = Math.round(2600 * detail);
  for (let i = 0; i < nShell; i++) {
    const onRib = rng.chance(0.65), a = onRib ? ((rng.int(0, 95) + 0.5) / 96) * TAU + rng.gauss() * 0.004 : rng.range(0, TAU);
    aI.push(a, onRib ? rng.range(0.92, 0.96) : rng.range(0.88, 1), rng(), 0); aJ.push(rng.range(2, 5), rng(), rng(), rng.range(0.5, 1.3));
  }
  for (let i = 0; i < nLin; i++) { aI.push(rng.range(0, TAU), rng.range(0.16, 0.19), rng(), 1); aJ.push(rng.range(0.7, 1.8), rng(), rng(), rng.range(0.5, 1.2)); }
  for (let i = 0; i < 9 * 56; i++) { aI.push(i % 9, 1, rng(), 2); aJ.push(rng.range(4.5, 9), rng(), rng(), rng.range(0.7, 1.4)); }
  for (let i = 0; i < nSpark; i++) { aI.push(rng.int(0, 8), rng.range(1.2, 2.5), rng(), 3); aJ.push(rng.range(0.5, 1.5), rng(), rng(), rng.range(0.8, 2)); }
  for (let i = 0; i < 24; i++) { aI.push(rng.range(0, TAU), 150 * Math.sqrt(rng()), rng.range(-0.3, 1), 4); aJ.push(rng.range(45, 110), rng(), rng(), rng.range(0.07, 0.15)); }
  await ctx.yield?.();
  const gg = new THREE.InstancedBufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  gg.setIndex([0, 1, 2, 0, 2, 3]);
  gg.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aI), 4));
  gg.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(aJ), 4));
  gg.instanceCount = aI.length / 4;
  const grains = add(gg, mat(GRAIN_V, GRAIN_F), 9);
  await ctx.yield?.();
  // 6. solids: the vent cone and the exit ring's frost collar
  const solidU = {
    uShake: { value: 0.6 }, uKeyCol: { value: lin('#FFF6E4') }, uBounce: { value: lin(pal[0]) },
    uPlanetDir: { value: V3(-E * Math.sin(32 * Math.PI / 180), 0.12, Math.cos(32 * Math.PI / 180)).normalize() },
    uJetPos: { value: V3() }, uJetLight: { value: 0.55 },
  };
  const solidMat = mat(SOLID_V, SOLID_F, solidU, { transparent: false, depthWrite: true, blending: THREE.NormalBlending });
  const cone = add(await buildCone(rng.fork ? rng.fork('cone') : rng, noise, pal, P, () => ctx.yield?.()), solidMat, 0);
  await ctx.yield?.();
  await ctx.yield?.();
  const collar = add(buildCollar(rng.fork ? rng.fork('collar') : rng, pal, P), solidMat, 0);
  collar.position.copy(portalPos);
  collar.quaternion.setFromUnitVectors(V3(0, 0, 1), portalDir.clone().negate());
  const extras = buildGroundParts ? buildGroundParts(object, mat, U, rng, pal, P, opts, add) : null;
  await ctx.yield?.();

  // ---------- anchors (local space; brief coordinates mirrored by E, see header) ----------
  const law = (a, k, s, out = V3()) => out.set(RIM * k * s * Math.cos(a), APEX * (1 - s * s), RIM * k * s * Math.sin(a));
  const anchors = {
    east: E, sunDir: sunDir.clone(),
    portalSeat: { position: portalPos.clone(), facing: portalDir.clone().negate(), direction: portalDir.clone(), radius: 7, tiltDeg: 30 },
    flyThrough: [
      bx(-380, 8, -3300), bx(-380, 9, -2840), bx(-380, 10, -2500), bx(-380, 10, -2150), bx(-372, 90, -1560), bx(-330, 70, -900),
      bx(-250, 47, -520), bx(-150, 47, -390), bx(60, 47, -375), bx(-250, 60, 300), bx(-120, 68, 190), bx(0, 70, 150),
      bx(150, 190, 165), bx(262, 330, 95), bx(300, 425, 0), bx(300, 485, -104), bx(300, 545, -208),
    ],
    viewpoints: {
      entry: { position: bx(-380, 8, -3300), lookAt: V3(0, 900, 0) },
      ceiling: { position: bx(-372, 90, -1560), lookAt: V3(0, 1500, 0) },
      jetPass: { position: bx(0, 70, 150), lookAt: V3(0, 110, 0) },
      exit: { position: bx(300, 425, 0), lookAt: portalPos.clone() },
    },
    jetBase: V3(0, P.coneH, 0), crown: V3(0, APEX, 0), jetRadiusBase: 15, jetRadiusTop: 35,
    cone: { radius: P.coneR * 1.2, height: P.coneH + P.rimBreak, throatRadius: 12 },
    snowRing: { inner: 2200, outer: 2500 }, liningRing: { inner: 400, outer: 475 },
    ribCount: 96, ribAzimuth: (i) => ((i + 0.5) / 96) * TAU,        // atan2(z, x) of main rib i: stripe the ground's sun term with these
    law, fallSeconds: FALL, rim: RIM, apex: APEX,
    shellHeightAt: (r, k = 1) => APEX * (1 - (r / (RIM * k)) ** 2),
  };

  // ---------- runtime ----------
  const camL = V3(), tmpS = V3(), tmpV2 = new THREE.Vector2(), inv = new THREE.Matrix4();
  let progress = -1;
  ribs.onBeforeRender = (renderer) => {
    const rt = renderer.getRenderTarget();
    U.uResY.value = rt ? rt.height : renderer.getDrawingBufferSize(tmpV2).y;
  };
  const hero = {
    object, radius: RIM, height: APEX, center: V3(0, APEX * 0.42, 0), anchors, ground: true, groundY: 0,
    uniforms: U,
    update(dt, time, camera) {
      U.uTime.value = time;
      object.updateMatrixWorld();
      U.uScale.value = tmpS.setFromMatrixScale(object.matrixWorld).x;
      solidU.uJetPos.value.setFromMatrixPosition(object.matrixWorld); U.uOrigin.value.copy(solidU.uJetPos.value);
      if (camera) {
        camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv.copy(object.matrixWorld).invert());
        const r = Math.hypot(camL.x, camL.z), top = APEX * (1 - (r / RIM) ** 2);
        U.uInside.value = smoothstep(-60, 120, top - camL.y) * smoothstep(-40, 160, RIM * 0.88 - r + 180);
        U.uBraid.value = 1 - smoothstep(190, 430, r);          // near the jet (the pass and the climb) the braids separate
        extras?.update(dt, time, camL, r);
      }
      const sg = progress < 0 ? 0 : smoothstep(0.74, 0.84, progress) * (1 - smoothstep(0.86, 0.95, progress));
      U.uJet.value = 1 + 0.3 * sg; solidU.uShake.value = 0.6 + 0.6 * sg;
    },
    // the world sets u (0..1 along its path): the jet surges and the cone's frost shakes hardest as the camera passes at u 0.84
    setProgress(u) { progress = u; },
    setSun(dir) { sunDir.copy(dir).normalize(); },
    setPortal(pos) { portalPos.copy(pos); U.uPortal.value.copy(pos).applyMatrix4(object.matrixWorld); collar.position.copy(pos); },
    dispose() {},
  };
  // uPortal is compared in world space in the lining shader: keep it in step with the object's transform
  const baseUpdate = hero.update;
  hero.update = (dt, time, camera) => { baseUpdate(dt, time, camera); U.uPortal.value.copy(portalPos).applyMatrix4(object.matrixWorld); };

  // ---------- viewer aid (src/worlds/_part.js only): ?hv=out|jet|crown|ring|in|curtain reframes the orbit ----------
  let hv = opts.view;
  try { const q = new URLSearchParams(globalThis.location?.search || ''); if (q.get('world') === '_part') hv = hv || q.get('hv') || 'out'; } catch (e) { /* no DOM */ }
  if (hv === 'out') { object.scale.setScalar(0.2); hero.radius = 520; hero.height = 480; hero.center = V3(0, 170, 0); }
  else if (hv === 'jet') { hero.radius = 105; hero.height = 150; hero.center = V3(0, 95, 0); }
  else if (hv === 'crown') { hero.radius = 330; hero.height = -500; hero.center = V3(0, 2340, 0); hero.ground = false; }
  else if (hv === 'ring') { hero.radius = 14; hero.height = 14; hero.center = portalPos.clone(); }
  else if (hv === 'in') { hero.radius = 500; hero.height = -3900; hero.center = V3(0, 2000, 0); }
  else if (hv === 'entry') { hero.radius = 1537; hero.height = -2340; hero.center = V3(0, 900, 0); }
  else if (hv === 'curtain') { hero.radius = 1095; hero.height = -100; hero.center = V3(0, 60, 0); }
  return hero;
}

// ---------- the white ring the curtain stands on, and the glitter you fly through inside it ----------
const RING_V = /* glsl */`
${G_FOG_V}
varying vec3 vW; varying vec2 vRA;
void main(){
  vRA = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RING_F = /* glsl */`
${G_FOG_F}
${G_COMMON}
uniform vec3 uSnow, uKeyCol; uniform float uRibsMain, uRibsHair;
varying vec3 vW; varying vec2 vRA;      // vRA = (0 inner edge .. 1 outer edge, azimuth 0..1)
void main(){
  float a01 = vRA.y, e = vRA.x, ang = a01 * 6.2831853;
  vec3 rad = vec3(cos(ang), 0., sin(ang)), tan_ = vec3(-rad.z, 0., rad.x);
  // spokes combed by the ribs: one ridge under each main rib, fine combing between; slope sign gives a lit and a blue side
  float fw = max(fwidth(a01), 1e-6);
  float xm = a01 * uRibsMain, xh = a01 * uRibsHair * 4.;
  float sm = cos(xm * 6.2831853 + 3.14159), sh = cos(xh * 6.2831853) * (1. - smoothstep(0.15, 0.5, fw * uRibsHair * 4.));
  float slope = -sin(xm * 6.2831853 + 3.14159) * 0.2 - sin(xh * 6.2831853) * 0.35 * (1. - smoothstep(0.15, 0.5, fw * uRibsHair * 4.));
  vec3 N = normalize(vec3(0., 1., 0.) - tan_ * slope * 0.55);
  float ndl = max(dot(N, uSun), 0.);
  float drift = vn2(vW.xz * 0.004) * 0.5 + vn2(vW.xz * 0.02) * 0.3 + vn2(vec2(e * 14., a01 * 900.)) * 0.2;
  vec3 alb = uSnow * (0.70 + 0.06 * sm + 0.05 * sh + 0.14 * drift);
  vec3 col = alb * (uKeyCol * ndl * 1.9 + vec3(0.56, 0.65, 0.78) * 0.5 + vec3(0.81, 0.89, 1.) * 0.16);
  col = min(col, vec3(0.8));
  vec2 cell = floor(vW.xz * 0.6); float hh = h21(cell);
  col += uGold * 2.4 * step(0.985, hh) * smoothstep(0.6, 1., sin(uTime * (0.5 + hh * 1.3) + hh * 50.)) * (1. - smoothstep(0.0, 0.004, fw));
  float edge = smoothstep(0., 0.22, e + 0.08 * (drift - 0.5)) * (1. - smoothstep(0.86, 1., e + 0.06 * (drift - 0.5)));
  gl_FragColor = vec4(fogMix(col), edge);
}`;
const FLAKE_V = /* glsl */`
${G_FOG_V}
${G_COMMON}
uniform vec3 uCamL; uniform float uResY, uScale;
attribute vec4 aB;                       // box position 0..1 (xyz), rnd
varying vec2 vC; varying vec3 vCol;
void main(){
  vec2 od = uCamL.xz / max(length(uCamL.xz), 1.);
  vec3 vel = vec3(od.x * 10., -20., od.y * 10.) * (0.8 + 0.4 * aB.w);          // sliding down and outward
  vec3 rel = mod(aB.xyz * 170. + vel * uTime - uCamL + 85., 170.) - 85.;
  vec3 p = uCamL + rel;
  float r = length(p.xz), kE = r / (${RIM}. * sqrt(max(1. - p.y / ${APEX}., 0.02)));
  float inC = smoothstep(0.868, 0.888, kE) * (1. - smoothstep(0.995, 1.012, kE)) * step(0.3, p.y);
  float veil = 0.5 + 0.5 * smoothstep(-0.2, 0.8, cos((kE - 0.88) / 0.03 * 6.2831853));     // five veils
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
  float dist = -mvPosition.z;
  float sz = (0.22 + 0.5 * fract(aB.w * 7.13)) * uScale, fl = 0.75 * dist * 2. / max(projectionMatrix[1][1] * uResY, 1.);
  float big = max(sz, fl), energy = max(sz * sz / (big * big), 0.2);
  // a spinning facet: it flashes when its normal crosses the half vector (well under two glints a second each)
  vec3 Vv = normalize(uCamL - p + vec3(1e-4)), Hh = normalize(uSun + Vv + vec3(0., 1e-3, 0.));
  float th = uTime * (1.3 + 2.2 * fract(aB.w * 3.7)) + aB.w * 80., phi = aB.w * 40. + uTime * 0.2;
  vec3 fn = vec3(sin(th) * cos(phi), cos(th), sin(th) * sin(phi));
  float g = abs(dot(fn, Hh)); g *= g; g *= g; g *= g; g *= g; g *= g; g *= g;                 // ^64
  float edgeF = (1. - smoothstep(55., 85., length(rel))) * smoothstep(0.8, 3., dist / uScale);
  vec3 tint = mix(vec3(0.75, 0.83, 0.95), uGold, 0.3 + 0.7 * g);
  vCol = tint * (0.95 + 7. * g) * inC * veil * edgeF * energy;
  mvPosition.xy += position.xy * big * 2.4;
  vC = position.xy * 2.;
  gl_Position = inC * edgeF > 0.001 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
  #include <fog_vertex>
}`;
const FLAKE_F = /* glsl */`
${G_FOG_F}
varying vec2 vC; varying vec3 vCol;
void main(){
  float r = length(vC);
  // a six-point card: three crossing needles and a soft heart
  float n0 = abs(vC.y), n1 = abs(dot(vC, vec2(0.866, 0.5))), n2 = abs(dot(vC, vec2(-0.866, 0.5)));
  float star = (exp(-n0 * 30.) + exp(-n1 * 30.) + exp(-n2 * 30.)) * (1. - smoothstep(0.25, 0.9, r)) * 0.75;
  float m = exp(-r * r * 22.) * 0.9 + star;
  gl_FragColor = vec4(fogAdd(vCol * m), 1.);
}`;
function buildGroundParts(object, mat, U, rng, pal, P, opts, add) {
  const out = { ring: null, flakes: null, update() {} };
  if (opts.snowRing !== false) {
    const g = new THREE.RingGeometry(2130, 2560, 384, 6);        // uv rebuilt as (radial 0..1, azimuth 0..1)
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y); let a = Math.atan2(y, x) / TAU; if (a < 0) a += 1;
      uv.setXY(i, (r - 2130) / 430, a); p.setXYZ(i, x, 0, y);
    }
    // close the azimuth seam: the last column of RingGeometry repeats angle 0, give it a = 1
    const cols = 385; for (let j = 0; j <= 6; j++) uv.setY(j * cols + 384, 1);
    out.ring = add(g, mat(RING_V, RING_F, { uSnow: { value: lin(pal[1]) }, uKeyCol: { value: lin('#FFF6E4') } },
      { blending: THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }), 1);
    out.ring.position.y = opts.snowRingY ?? 0.6;
  }
  const n = Math.round(8400 * P.detail), aB = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) aB[i] = rng();
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  fg.setIndex([0, 1, 2, 0, 2, 3]);
  fg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); fg.instanceCount = n;
  const fU = { uCamL: { value: V3() } };
  out.flakes = add(fg, mat(FLAKE_V, FLAKE_F, fU), 10);
  out.update = (dt, time, camL, r) => {
    fU.uCamL.value.copy(camL);
    out.flakes.visible = r > 1900 && r < 2800 && camL.y < 700;     // only drawn in and near the curtain
  };
  return out;
}
