// THE CALVING: hero set piece for the world "the-calving".
//
// What it is
//   A lobe of glacier front (ice cliff ~70 m high, serac-split, 520 m wide by default) with one serac
//   tower 85 m tall and 25 m wide standing 10 m proud of it as a prow, in a dark sapphire cleft. On a single event clock the tower puffs ice
//   dust, leans out 14 degrees, breaks into five tumbling blocks that fall at 0.6 g, throws a 90 m
//   splash column and a foam fPatch, the blocks plunge, resurface and roll showing sapphire undersides,
//   and a ring wave (7 m at the cliff, ~2.2 m at 290 m, 36 m/s, two trailing swells) runs out through
//   the sea. When the wave reaches a low dirty-white hummock lying 230 m out, the hummock capsizes
//   through 100 degrees and heaves up as a sapphire ARCH 18 m tall with a 14 m opening, streaming
//   water, inner rim glowing: the portal frame.
//
// Local space
//   Origin = foot of the tower at still sea level (y = 0), +Y up, front +Z (the kayak approaches down
//   +Z looking toward -Z). The cliff runs along X. The arch sits at (0, 0, archDistance) with its
//   opening facing +-Z.
//
// Event clock (never wall-clock in a world)
//   hero.setProgress(u)   u 0..1 over hero.eventLength (20 s of event time). Brief time 20 s == u 0.
//                         0.00 dust puff / crack   0.00-0.20 lean   0.20 release   ~0.30 main impact
//                         (hero.timeline.hit)   0.30-0.60 splash column   ~0.61 wave reaches the arch
//                         and it capsizes (timeline.arch)   ~0.72 wave at z = 290 (timeline.waveAt(z))
//   hero.setEventTime(sec) same thing in seconds.   hero.setArchProgress(u|null) optionally overrides
//   the arch's own 0..1 capsizing (null = follow the event clock).
//   If neither is ever called, update() loops the event on wall time (viewer only).
//
// The sea (so the world's ocean, floes, creatures and camera can ride the same wave)
//   hero.waveHeight(x, z)        height of the sea at local (x,z) for the current event time (JS)
//   hero.waveGLSL                GLSL source: float calvWave(vec2 xz) + the uniforms it needs
//   hero.ringHeight(x, z, T)     ring wave only (no ambient swell) at event time T: for baking the camera path
//   hero.wallZ(x)                z of the cliff foot at x.   hero.kit: { pal, makeIceBlock(w,h,d,o), makeIceMaterial(o) }
//   hero.setShadows(list, dir, k) long shadows on the sea (and on anything that includes hero.shadowGLSL: float calvShadow(vec2 xz))
//   hero.waveUniforms            { uCalvT, uCalvTime, uCalvImp, uCalvSwell } shared uniform objects: put them in your
//                                own materials and they stay in sync
//
// anchors (all local space)
//   portalSeat   { position (0, 3.5, archDistance), normal (0,0,1), radius 7 }: centre of the 14 m
//                portal inside the arch, facing the incoming camera. The opening is clear for
//                |x| < 7.4 from y = -3 to y = 10.5.
//   flyThrough   ordered points down the channel (x = 0) from z = 440 to just behind the arch;
//                >= 6 m clear of the arch ice. Heights are eye heights above STILL water: add
//                waveHeight() for the kayak ride.
//   viewpoints   { kayakStart, kayakWave, archReveal }: positions with a good composed view.
//   impact       where the tower lands (wave centre).   towerTop, cliffTop, archCrown: gaze targets.
//   channelHalfWidth  the strip |x| < this is kept free of the hero's floes.
//
// opts
//   palette       brief palette [sky, iceLight, snow, cyanBounce, sapphire, water, red]
//   width         glacier lobe width in metres (default 520; up to 1400)
//   archDistance  z of the arch (default 230)
//   sea           true: build the hero's own sea disc with the wave, foam and sparkle (default true).
//                 false: use hero.waveGLSL in your own ocean.
//   floes         true: ~520 instanced floes that tilt and lift with the wave (default true)
//   archYaw       extra yaw of the arch (radians) so its opening can face an oblique approach
//   swell         scale of the ambient swell (default 1 = +-0.3 m)
//   iceGlow       multiplier on the ice's fake subsurface blue (default 1; overcast light wants ~1.3)
//   lightSweep    0..0.3: a broad brightening that travels along the cliff at ~20 m/s (default 0)
//   glitter       strength of the sea's hard white glitter (default 1)
//   sunDir        Vector3 direction TOWARD the sun for the unlit shaders (sea, spray).
//                 Default (-0.6, 0.7, 0.4): 40 degrees up behind the camera's left shoulder.
//   skyTop, skyHorizon   hex colours reflected by the sea (default palette[0], palette[1])
//
// Size: cliff lobe width/2 = 260 either side, ~80 m high, plateau running 190 m back; the event spans
//   z = -10 .. archDistance. The returned radius (170) / center frame the event, not the whole lobe.
//   Arch 29 m wide x 18 m tall. Splash column ~90 m.
// Cost: ~95k triangles, 11 draw calls (sea 28k, glacier 34k, floes 21k, arch 5k, blocks 5k, rest 2k),
//   no lights of its own, ~250-350 ms build. Without sea and floes: ~46k triangles, 9 draw calls.
// Lighting: one hard white directional key from the camera side (+Z, left, ~40 degrees up) plus a
//   cyan hemisphere fill. Ice is MeshStandardMaterial (takes scene lights and fog) with fake
//   subsurface blue as emissive (0.2-1.3) and an arch rim glow of ~3 that blooms.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#3F86C9', '#BFE2F2', '#F4FAFD', '#58B8D8', '#1C6FA0', '#06141F', '#E23B2E'];
const EVENT_LEN = 20, WAVE_SPEED = 36, G = 0.6 * 9.81, LEAN = 14 * Math.PI / 180, T_RELEASE = 4;

// ---------------------------------------------------------------- the wave (GLSL + JS mirror)
const WAVE_GLSL = /* glsl */`
uniform float uCalvT;      // event time, seconds
uniform float uCalvTime;   // free-running time for the ambient swell
uniform vec3 uCalvImp;     // impact x, impact z, impact time
uniform float uCalvSwell;  // ambient swell scale (opts.swell)
float calvProfile(float x){
  float a = exp(-(x*x)/289.0);
  a -= 0.30*exp(-((x+30.0)*(x+30.0))/400.0);
  a -= 0.28*exp(-((x-30.0)*(x-30.0))/324.0);
  a += 0.45*exp(-((x-60.0)*(x-60.0))/324.0);
  a -= 0.16*exp(-((x-90.0)*(x-90.0))/324.0);
  a += 0.25*exp(-((x-120.0)*(x-120.0))/400.0);
  return a;
}
float calvRing(vec2 p){
  float tt = uCalvT - uCalvImp.z;
  if (tt <= 0.0) return 0.0;
  float r = length(p - uCalvImp.xy);
  float A = 7.0*sqrt(28.6/max(r, 28.6))*smoothstep(0.0, 1.6, tt)*smoothstep(4.0, 26.0, r);
  float h = A*calvProfile(${WAVE_SPEED}.0*tt - r);
  h += 2.4*exp(-r/45.0)*exp(-0.22*tt)*sin(0.2*r - 2.1*tt)*smoothstep(0.0, 1.0, tt);
  return h;
}
float calvSwell(vec2 p){
  float t = uCalvTime;
  return uCalvSwell*(0.15*sin(p.x*0.052 + p.y*0.047 + t*0.85) + 0.10*sin(p.x*-0.091 + p.y*0.118 + t*1.25) + 0.05*sin(p.x*0.23 - p.y*0.17 + t*1.9));
}
float calvWave(vec2 p){ return calvRing(p) + calvSwell(p); }
`;
function profileJS(x) {
  let a = Math.exp(-(x * x) / 289);
  a -= 0.30 * Math.exp(-((x + 30) * (x + 30)) / 400);
  a -= 0.28 * Math.exp(-((x - 30) * (x - 30)) / 324);
  a += 0.45 * Math.exp(-((x - 60) * (x - 60)) / 324);
  a -= 0.16 * Math.exp(-((x - 90) * (x - 90)) / 324);
  a += 0.25 * Math.exp(-((x - 120) * (x - 120)) / 400);
  return a;
}
function waveJS(x, z, T, time, imp, swell = 1) {
  let h = swell * (0.15 * Math.sin(x * 0.052 + z * 0.047 + time * 0.85) + 0.10 * Math.sin(x * -0.091 + z * 0.118 + time * 1.25) + 0.05 * Math.sin(x * 0.23 - z * 0.17 + time * 1.9));
  const tt = T - imp.z;
  if (tt > 0) {
    const r = Math.hypot(x - imp.x, z - imp.y);
    const A = 7 * Math.sqrt(28.6 / Math.max(r, 28.6)) * smoothstep(0, 1.6, tt) * smoothstep(4, 26, r);
    h += A * profileJS(WAVE_SPEED * tt - r);
    h += 2.4 * Math.exp(-r / 45) * Math.exp(-0.22 * tt) * Math.sin(0.2 * r - 2.1 * tt) * smoothstep(0, 1, tt);
  }
  return h;
}

// long shadows laid on the sea and the pack: up to six casters, each a soft-edged strip running down-sun
// uCalvSh[i] = (x, z, half-width, length), uCalvShDir = (dir x, dir z, strength)
const SHADOW_GLSL = /* glsl */`
uniform vec4 uCalvSh[6]; uniform vec3 uCalvShDir;
float calvShadow(vec2 p){
  if (uCalvShDir.z < 0.001) return 0.0;
  float s = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 c = uCalvSh[i]; vec2 d = p - c.xy;
    float al = dot(d, uCalvShDir.xy), ac = abs(d.x*uCalvShDir.y - d.y*uCalvShDir.x), soft = 2.0 + max(al, 0.0)*0.04;
    s = max(s, smoothstep(0.0, 6.0, al)*(1.0 - smoothstep(c.w*0.7, c.w + 1.0, al))*(1.0 - smoothstep(c.z - soft, c.z + soft, ac)));
  }
  return s*uCalvShDir.z;
}
`;
const NOISE_GLSL = /* glsl */`
float cvHash(vec3 p){ p = fract(p*0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float cvNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(cvHash(i), cvHash(i + vec3(1,0,0)), f.x), mix(cvHash(i + vec3(0,1,0)), cvHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(cvHash(i + vec3(0,0,1)), cvHash(i + vec3(1,0,1)), f.x), mix(cvHash(i + vec3(0,1,1)), cvHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float cvFbm(vec3 p){ return 0.55*cvNoise(p) + 0.3*cvNoise(p*2.13 + 7.1) + 0.15*cvNoise(p*4.7 + 3.3); }
`;

// ---------------------------------------------------------------- ice material
// MeshStandardMaterial (scene lights + fog) with: aIce.x = blue depth (0 snow .. 1 deep crevasse blue),
// aIce.y = freshly exposed sapphire, aIce.z = inner-rim glow (arch only). Procedural fracture detail,
// bump and fake subsurface emission in the fragment shader; optional sheet-water scroll (uWet).
function makeIceMaterial(pal, shared, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, side: o.side ?? THREE.FrontSide });
  const u = {
    uIceBlue: { value: pal.cyan.clone() }, uIceDeep: { value: pal.sapphire.clone() }, uRimCol: { value: pal.iceLight.clone() },
    uWet: o.wet || { value: 0 }, uRim: o.rim || { value: 0 }, uGlowK: pal.glow, uIceTime: shared.uCalvTime, uDetail: { value: o.detail ?? 1 }, uScallop: { value: o.scallop ?? 0 }, uSweep: { value: o.sweep ?? 0 }, uFresh: { value: o.fresh ?? 1 }, uFrost: { value: o.frost ?? 0 }, uCrack: { value: o.crack ?? 1 },
  };
  mat.userData.u = u;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aIce;\nvarying vec3 vIce;\nvarying vec3 vIceP;\nvarying float vIceWY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvIce = aIce; vIceP = position; vIceWY = (modelMatrix*vec4(position, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vIce; varying vec3 vIceP; varying float vIceWY;
uniform vec3 uIceBlue, uIceDeep, uRimCol; uniform float uWet, uRim, uIceTime, uDetail, uScallop, uGlowK, uSweep, uFresh, uFrost, uCrack;
${NOISE_GLSL}
float iceH(vec3 p){
  float a = cvFbm(vec3(p.x*0.09, p.y*0.022, p.z*0.09));          // tall vertical fracture flutes
  float b = cvNoise(vec3(p.x*0.45, p.y*0.11, p.z*0.45));
  float c = abs(cvNoise(vec3(p.x*0.2, p.y*0.035, p.z*0.2) + 11.0) - 0.5)*2.0;                // crack lines
  float cw = max(0.12, 1.5*fwidth(c));                          // crack lines never thinner than a pixel and a half: they fade instead of breaking into dots
  float sc = uScallop > 0.0 ? uScallop*smoothstep(-0.5, 0.0, vIce.x)*(cvNoise(p*0.95)*0.55 + abs(cvNoise(p*0.42 + 4.0) - 0.5)*1.6 + abs(cvNoise(vec3(p.x*1.25, p.y*0.06, p.z*1.25) + 23.0) - 0.5)*2.2) : 0.0;   // + vertical melt flutes
  return a*1.6 + b*0.45 - (1.0 - smoothstep(0.0, cw, c))*0.9*(0.12/cw)*uCrack + sc;
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float hI = iceH(vIceP);
float crC = abs(cvNoise(vec3(vIceP.x*0.2, vIceP.y*0.035, vIceP.z*0.2) + 11.0) - 0.5)*2.0, crW = max(0.10, 1.5*fwidth(crC));
float crackI = (1.0 - smoothstep(0.0, crW, crC))*(0.10/crW)*uCrack;
float strata = 0.5 + 0.5*sin(vIceP.y*0.55 + cvNoise(vIceP*0.05)*9.0);
float blueI = clamp(vIce.x + crackI*0.35 + (0.5 - hI*0.3)*0.25*uDetail, 0.0, 1.0);
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.80, 0.93, 0.98), strata*0.35*(1.0 - vIce.y));
diffuseColor.rgb = mix(diffuseColor.rgb, uIceBlue*0.85, blueI*0.45);
diffuseColor.rgb = mix(diffuseColor.rgb, uIceDeep*0.9, clamp(vIce.y*0.8 + blueI*blueI*0.35 + vIce.z*0.8, 0.0, 1.0));
diffuseColor.rgb = mix(diffuseColor.rgb, uIceDeep*0.85, 0.4*min(uScallop, 1.0)*max(vIce.x, 0.0));   // the arch (the only scalloped ice) keeps its sapphire in any light
if (uScallop > 0.0) {                                                                       // darker sapphire bands and flutes in the new ice
  float bandA = smoothstep(0.35, 0.75, 0.5 + 0.5*sin(vIceP.y*1.15 + cvNoise(vIceP*0.22)*5.0));
  float fluteA = abs(cvNoise(vec3(vIceP.x*1.25, vIceP.y*0.06, vIceP.z*1.25) + 23.0) - 0.5)*2.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, uIceDeep*0.5, clamp(vIce.x, 0.0, 1.0)*(0.45*bandA + 0.35*(1.0 - smoothstep(0.0, 0.3, fluteA))));
}
if (uFrost > 0.0) {                                                                         // freshly broken ice: glassy sapphire with white fracture frost, paler toward its edges
  float frN = cvFbm(vIceP*0.33 + 5.0), frost = smoothstep(0.43, 0.6, frN)*0.85 + smoothstep(0.42, 0.5, abs(cvNoise(vIceP*0.9 + 3.0) - 0.5)*2.0)*0.25;
  float edgeI = pow(1.0 - clamp(dot(normalize(vViewPosition), normalize(vNormal)), 0.0, 1.0), 2.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, uRimCol*0.86, uFrost*vIce.y*clamp(frost*0.85 + edgeI*0.7, 0.0, 1.0));
  diffuseColor.rgb *= 1.0 - 0.45*uFrost*vIce.y*(1.0 - smoothstep(0.2, 0.34, frN));                   // dark crevices between the blocks of clean ice
  vec3 nWf = inverseTransformDirection(normalize(vNormal), viewMatrix);                      // mass: a lit side and a shaded side in any light
  float keyF = 0.5 + 0.5*dot(nWf, vec3(-0.55, 0.6, 0.58));
  diffuseColor.rgb *= 1.0 - 0.52*uFrost*(1.0 - smoothstep(0.25, 0.8, keyF));
}
if (uSweep > 0.0) diffuseColor.rgb *= 1.0 - uSweep*0.6 + uSweep*1.6*smoothstep(0.3, 0.72, cvNoise(vec3(vIceP.x*0.0045 - uIceTime*0.09, 1.7, 3.3)));
float sheet = 0.0;
if (uWet > 0.001) {
  float colm = cvNoise(vec3(vIceP.x*2.6, 3.0, vIceP.z*2.6));
  float run = cvNoise(vec3(vIceP.x*5.0, vIceWY*0.35 + uIceTime*(2.0 + colm*2.5), vIceP.z*5.0 + colm*3.0));
  sheet = uWet*smoothstep(0.55, 0.95, run)*smoothstep(0.35, 0.75, colm);
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.16, clamp(vIce.y + blueI*0.5 + uWet*0.6, 0.0, 1.0));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
  float fade = uDetail/(1.0 + length(vViewPosition)*0.004);
  float dhx = dFdx(hI)*fade, dhy = dFdy(hI)*fade;
  vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
  float det = dot(sx, r1);
  normal = normalize(abs(det)*normal - sign(det)*1.4*(dhx*r1 + dhy*r2));
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.0);
  totalEmissiveRadiance += (uIceBlue*(blueI*0.16 + 0.04) + uIceDeep*(vIce.y*(0.75 + 0.6*fres)*uFresh + blueI*blueI*0.3 + vIce.z*0.35))*uGlowK*(1.0 - 0.8*uFrost*vIce.y);
  totalEmissiveRadiance += mix(uIceBlue, uRimCol, 0.3)*vIce.z*uRim*(0.75 + 0.25*sin(uIceTime*2.1 + vIceP.y*0.4));
  totalEmissiveRadiance += vec3(0.5, 0.8, 1.0)*sheet*(0.3 + 0.8*min(uScallop, 1.0));
}`);
  };
  return mat;
}

// rounded, noise-broken block of ice. Faces whose normal passes `weathered(n)` get old snow colours,
// the rest are freshly fractured sapphire.
function makeIceBlock(noise, rng, w, h, d, pal, o = {}) {
  const seg = o.seg ?? 2.2;
  let g = new THREE.BoxGeometry(w, h, d, Math.max(3, Math.round(w / seg)), Math.max(3, Math.round(h / seg)), Math.max(3, Math.round(d / seg)));
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-3);
  const p = g.attributes.position, n = p.count, off = rng.range(0, 500);
  const hw = w / 2, hh = h / 2, hd = d / 2, round = o.round ?? 0.55, amp = o.amp ?? 1.5;
  for (let i = 0; i < n; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const u = x / hw, v = y / hh, q = z / hd;
    const pn = Math.pow(Math.pow(Math.abs(u), 6) + Math.pow(Math.abs(v), 6) + Math.pow(Math.abs(q), 6), 1 / 6) || 1;
    const s = lerp(1, 1 / pn, round);
    x *= s; y *= s; z *= s;
    const k = 1 + (noise.fbm3(x * 0.09 + off, y * 0.09, z * 0.09, 3) * amp + noise.n3(x * 0.3 + off, y * 0.3, z * 0.3) * amp * 0.25) / Math.max(hw, hh, hd) * 2.2;
    x *= k; y *= k; z *= k;
    // angular facets: snap a little toward tilted planes
    const f = noise.n3(x * 0.05 + off + 40, y * 0.05, z * 0.05);
    x += f * amp * 0.8; z += noise.n3(x * 0.05, y * 0.05 + off, z * 0.05 + 9) * amp * 0.8;
    if (o.spires && v > 0.2) {
      const r = noise.ridged2(x * 0.11 + off, z * 0.11, 3);
      y += smoothstep(0.2, 1, v) * (r * r * o.spires - o.spires * 0.25);
      const tp = 1 - 0.28 * smoothstep(0.3, 1, v); x *= tp; z *= tp;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const nr = g.attributes.normal, col = new Float32Array(n * 3), ice = new Float32Array(n * 3), c = new THREE.Color();
  const wf = o.weathered || ((nx, ny, nz) => smoothstep(0.2, 0.6, nz));
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const we = wf(nr.getX(i), nr.getY(i), nr.getZ(i), x, y, z);
    const m = 0.5 + 0.5 * noise.fbm3(x * 0.07 + off, y * 0.07, z * 0.07, 3);
    const streak = smoothstep(0.25, 0.7, noise.n2(x * 0.22 + off, y * 0.02)) * we;
    c.copy(pal.snow).multiplyScalar(0.78).lerp(pal.iceLight, 0.25 + 0.5 * m).multiplyScalar(0.9 + 0.1 * m).lerp(pal.cyan, streak * 0.35);
    if (we < 1) c.lerp(pal.cyan, (1 - we) * 0.6);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    ice[i * 3] = clamp((1 - we) * 0.6 + m * 0.25 + streak * 0.45, 0, 1); ice[i * 3 + 1] = (1 - we) * (0.6 + 0.4 * m); ice[i * 3 + 2] = 0;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aIce', new THREE.BufferAttribute(ice, 3));
  return g;
}

// ---------------------------------------------------------------- glacier front
async function buildGlacier(noise, rng, pal, width, pause) {
  const half = width / 2, nx = Math.round(clamp(width / 1.75, 200, 420)), nf = 46;
  const depths = [0, 2.5, 6, 11, 18, 27, 39, 55, 76, 104, 140, 190], nt = depths.length, rows = nf + nt - 1;
  // serac cells
  const cells = []; let cx = -half;
  while (cx < half) {
    const w = rng.range(9, 26);
    cells.push({ x0: cx, x1: cx + w, out: rng.range(-4, 7) + (rng.chance(0.18) ? rng.range(4, 9) : 0), top: rng.range(58, 80) + (rng.chance(0.12) ? rng.range(3, 7) : 0), gap: rng.range(0.35, 1), gapD: rng.range(4, 20) });
    cx += w;
  }
  const off = rng.range(0, 300);
  const pos = new Float32Array((nx + 1) * rows * 3), col = new Float32Array((nx + 1) * rows * 3), ice = new Float32Array((nx + 1) * rows * 3);
  const c = new THREE.Color(); let ci = 0, maxTop = 0;
  for (let i = 0; i <= nx; i++) {
    if ((i & 31) === 31) await pause();
    const x = -half + (i / nx) * width;
    while (ci < cells.length - 1 && x > cells[ci].x1) ci++;
    const cell = cells[ci], e = Math.min(x - cell.x0, cell.x1 - x);
    const nb = (x - cell.x0 < cell.x1 - x) ? cells[Math.max(0, ci - 1)] : cells[Math.min(cells.length - 1, ci + 1)];
    const gs = (cell.gap + nb.gap) * 0.5, groove = Math.exp(-(e * e) / 3.2) * gs;
    const bl = smoothstep(0, 2.5, e) * 0.5 + 0.5; // blend to neighbour at the cell edge so no tears
    const out = lerp((cell.out + nb.out) * 0.5, cell.out, bl * 2 - 1), ctop = lerp((cell.top + nb.top) * 0.5, cell.top, bl * 2 - 1);
    const endf = Math.abs(x) / half, nw = 1 - smoothstep(16.5, 22, Math.abs(x)), cleft = nw * smoothstep(9, 14.5, Math.abs(x));   // the tower's recess; cleft = its two side walls
    const smoothTop = 70 + noise.fbm2(x * 0.004 + off, 3.1, 3) * 6;
    let htop = (ctop - groove * (5 + (cell.gapD + nb.gapD) * 0.5) + noise.fbm2(x * 0.09 + off, 0.5, 3) * 3.6) * (1 - 0.3 * endf * endf);
    htop = lerp(htop, Math.min(htop, 56 + noise.n2(x * 0.09, off + 7) * 3), (1 - smoothstep(22, 70, Math.abs(x))) * 0.85);
    htop = lerp(htop, 53 + noise.n2(x * 0.2, off) * 3, nw);
    maxTop = Math.max(maxTop, htop);
    const base = noise.fbm2(x * 0.006 + off, 9.7, 3) * 16 - Math.pow(endf, 2.6) * 150 - 3 - nw * 12;
    let zLip = 0;
    for (let j = 0; j < rows; j++) {
      const k = (i * rows + j) * 3;
      let y, z, blue, fresh = 0, snow;
      if (j < nf) {
        const yf = j / (nf - 1); y = lerp(-6, htop, yf);
        z = base + out * (0.35 + 0.65 * yf) * (1 - nw) - groove * (3 + 13 * Math.pow(yf, 1.3)) * (1 - nw * 0.7)
          + noise.fbm3(x * 0.06 + off, y * 0.016, 1.7, 3) * 4.4 + noise.n3(x * 0.2, y * 0.05, off) * 1.1
          + (Math.round(noise.n3(x * 0.05 + off, y * 0.012, 5.5) * 3) * 1.3 + Math.round(noise.n3(x * 0.012 + off, y * 0.09, 8.2) * 2) * 0.8) * (1 - nw)
          - 3.5 * yf - 2.4 * Math.exp(-((y - 1.2) * (y - 1.2)) / 5);
        if (j === nf - 1) zLip = z;
        blue = clamp(groove * 0.85 + (1 - yf) * 0.3 + (y < 4 ? 0.35 * (1 - y / 4) : 0) + noise.n3(x * 0.04, y * 0.09, off + 3) * 0.15, 0, 1);
        fresh = nw * (0.6 + 0.4 * noise.n3(x * 0.2, y * 0.2, off)) * smoothstep(-2, 6, y) * (1 - 0.5 * cleft);
        blue = Math.max(blue, cleft);
        snow = smoothstep(0.9, 1, yf) * (1 - groove);
      } else {
        const d = depths[j - nf + 1], bs = smoothstep(0, 34, d);
        const cr = Math.sin((d + noise.fbm2(x * 0.012 + off, d * 0.012, 2) * 46) * 0.17), crev = smoothstep(0.7, 1, cr) * smoothstep(3, 16, d);
        y = lerp(htop, smoothTop * (1 - 0.3 * endf * endf), bs) + d * 0.11 - crev * 6 + noise.fbm2(x * 0.04, d * 0.04 + off, 3) * 2.2 * bs;
        z = zLip - d + noise.n2(x * 0.05, d * 0.05 + off) * 1.5;
        blue = clamp(crev * 0.9 + groove * (1 - bs) * 0.6, 0, 1); snow = 1 - blue;
        maxTop = Math.max(maxTop, d < 80 ? y : 0);
      }
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      const m = 0.5 + 0.5 * noise.fbm3(x * 0.035 + off, y * 0.06, z * 0.035, 3);
      c.copy(pal.iceLight).multiplyScalar(0.72 + 0.14 * m).lerp(pal.snow, snow * 0.8).lerp(pal.cyan, blue * 0.3).multiplyScalar(1 - 0.62 * groove * (j < nf ? 1 : 0.3));
      if (j < nf) c.multiplyScalar((0.86 + 0.14 * smoothstep(-4, 6, out)) * (1 - 0.42 * nw) * (1 - 0.5 * cleft));   // recessed seracs sit in shade; the tower's cleft is dark sapphire
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
      ice[k] = blue; ice[k + 1] = fresh; ice[k + 2] = 0;
    }
  }
  const idx = new Uint32Array(nx * (rows - 1) * 6); let q = 0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < rows - 1; j++) {
    const a = i * rows + j, b = a + rows;
    idx[q++] = a; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b + 1; idx[q++] = a + 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aIce', new THREE.BufferAttribute(ice, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await pause();
  g.computeVertexNormals();
  return { geometry: g, top: maxTop };
}

// ---------------------------------------------------------------- the arch berg (portal frame)
// Built in its final, upright pose: a closed ring of ice around a superellipse opening
// (half-width 7.5, y from -8 to 11, centred x = 0), the lower third under water. Origin at still
// water level in the middle of the opening; opening faces +-Z. The -Z face is old dirty snow (it is
// the top of the hummock before the roll); everything else is new sapphire ice.
const ARCH = { hw: 7.5, hh: 9.5, cy: 1.5, ex: 2.6 };
async function buildArch(noise, rng, pal, yaw0 = 0, A0 = 100*Math.PI/180, pivotY = -2, pause = async () => {}) {
  const ns = 112, nc = 22, off = rng.range(0, 400);
  const horn = rng.range(0.55, 0.95) * rng.sign(), horn2 = rng.range(2.0, 2.6) * -Math.sign(horn);
  const hornH = rng.range(4, 7.5), thick = rng.range(0.9, 1.12);
  const n = ns * nc, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ice = new Float32Array(n * 3), c = new THREE.Color();
  const e2 = 2 / ARCH.ex, deepMix = pal.cyan.clone().lerp(pal.sapphire, 0.45), grime = new THREE.Color('#7f898c');
  for (let i = 0; i < ns; i++) {
    if (i % 28 === 27) await pause();
    const th = (i / ns) * Math.PI * 2;                       // 0 = crown, increasing clockwise seen from +Z
    const sx = Math.sin(th), cy = Math.cos(th);
    const ix = ARCH.hw * Math.sign(sx) * Math.pow(Math.abs(sx), e2), iy = ARCH.cy + ARCH.hh * Math.sign(cy) * Math.pow(Math.abs(cy), e2);
    // outward normal of the superellipse
    let nx = Math.sign(sx) * Math.pow(Math.abs(sx), 2 - e2) / ARCH.hw, ny = Math.sign(cy) * Math.pow(Math.abs(cy), 2 - e2) / ARCH.hh;
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const up = cy; // 1 crown, -1 keel
    const dth = (a) => { let d = th - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return d; };
    let T = (lerp(6.6, 5.2, smoothstep(0.2, 1, up)) + (up < -0.3 ? -2.6 * smoothstep(-0.3, -0.9, up) : 0)) * thick;
    T += hornH * Math.exp(-Math.pow(dth(horn) / 0.2, 2)) + hornH * 0.45 * Math.exp(-Math.pow(dth(horn2 > 0 ? 1.15 : -1.15) / 0.3, 2));
    T += noise.fbm2(Math.cos(th) * 1.6 + off, Math.sin(th) * 1.6, 3) * 1.8 + noise.n2(th * 5 + off, 2) * 0.5;
    T = Math.max(2.4, T);
    const B = (lerp(3.5, 5.3, smoothstep(0.3, -1, up)) + noise.fbm2(Math.cos(th) * 1.3, Math.sin(th) * 1.3 + off, 2) * 0.9) * thick;
    for (let j = 0; j < nc; j++) {
      const ph = (j / nc) * Math.PI * 2, cp = Math.cos(ph), sp = Math.sin(ph);
      // boxy rounded section: radial r from 0 (inner rim, ph = PI) to T (outer, ph = 0), z half-depth B
      const rr = Math.sign(cp) * Math.pow(Math.abs(cp), 0.62), zz = Math.sign(sp) * Math.pow(Math.abs(sp), 0.62);
      let r = T * 0.5 * (1 + rr), z = B * zz * (1 - 0.3 * smoothstep(0.35, 1, r / T) * (0.5 + 0.5 * up));
      let x = ix + nx * r, y = iy + ny * r;
      const outer = smoothstep(0.25, 0.9, r / T);
      const dn = noise.fbm3(x * 0.11 + off, y * 0.11, z * 0.11, 3) * 1.5 + noise.n3(x * 0.33, y * 0.33 + off, z * 0.33) * 0.4 + (Math.abs(noise.n3(x * 0.15 + off, y * 0.15, z * 0.15 + 20)) - 0.3) * 1.9;
      x += nx * dn * outer; y += ny * dn * outer; z += noise.fbm3(x * 0.09, y * 0.09 + off, z * 0.2, 2) * 1.2 * (0.3 + 0.7 * Math.abs(zz));
      // undercut waterline groove on the outside
      const wl = Math.exp(-(y * y) / 1.6) * outer; x -= nx * wl * 0.7;
      const k = (i * nc + j) * 3;
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      const back = smoothstep(-0.15, 0.5, -zz) * smoothstep(0.02, 0.3, r / T + 0.1), inner = smoothstep(0.35, 0.02, r / T);
      const m = 0.5 + 0.5 * noise.fbm3(x * 0.1 + off, y * 0.1, z * 0.1, 3);
      const dirt = smoothstep(0.1, 0.55, noise.n2(x * 0.5 + off, y * 0.09 + z * 0.3));
      c.copy(pal.snow).multiplyScalar(0.7 + 0.08 * m).lerp(grime, 0.3 + 0.4 * dirt);
      c.lerp(deepMix, (1 - back) * (0.6 + 0.3 * m));
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
      ice[k] = clamp((1 - back) * 0.7 + m * 0.2, 0, 1) - 0.7 * back; ice[k + 1] = (1 - back) * (0.3 + 0.7 * m) * lerp(0.75, 1, inner); ice[k + 2] = inner * inner * smoothstep(-0.75, -0.2, up + 0.25);
    }
  }
  // A dirty-white pressure ridge on what is the camera end of the hummock before the roll (it stands ~7.5 m
  // high between the kayak and the centre of the ring, so the portal waiting there is hidden until the capsize);
  // it is its own mesh and shrinks away during the roll. Defined in hummock space (X across, Y up from the
  // pivot, Z toward the camera) and carried back into the mesh's own space.
  await pause();
  const RX = 46, RZ = 18, rn = (RX + 1) * (RZ + 1), cA = Math.cos(A0), sA = Math.sin(A0), cY = Math.cos(yaw0), sY = Math.sin(yaw0);
  const rpos = new Float32Array(rn * 3), rcol = new Float32Array(rn * 3), rice = new Float32Array(rn * 3);
  for (let i = 0; i <= RX; i++) for (let j = 0; j <= RZ; j++) {
    const u = i / RX * 2 - 1, v = j / RZ, edge = i === 0 || i === RX || j === 0 || j === RZ;
    let Zp = 12.2 + 8.6 * v, X = Zp * Math.tan(yaw0) + 11.4 * u;      // skewed along the line of approach (the arch faces yaw0 off the Z axis)
    const envX = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3)), 0.7);
    const prof = v < 0.36 ? Math.pow(smoothstep(0, 0.36, v), 0.75) : 1 - Math.pow(smoothstep(0.36, 1, v), 1.35);
    // old ice: a broad rounded back with small wind-cut sastrugi, not a crag
    const rg = noise.ridged2(X * 0.32 + off, Zp * 0.4, 3), bl = noise.n2(X * 0.2 + off, Zp * 0.2 + 7) * 0.9 + noise.n2(X * 0.7 + off, Zp * 0.7 + 3) * 0.22;
    let Yp = edge ? -1.2 : -0.6 + 9.3 * envX * prof * (0.95 + 0.05 * rg) + bl * prof * envX;
    if (!edge) { X += noise.n2(X * 0.4, Zp * 0.4 + off) * 0.7; Zp += noise.n2(X * 0.4 + 9, Zp * 0.4 + off) * 0.6; }
    const yg = Yp * cA + Zp * sA, zg = -Yp * sA + Zp * cA, k = (i * (RZ + 1) + j) * 3;
    rpos[k] = X * cY - zg * sY; rpos[k + 1] = yg + pivotY; rpos[k + 2] = X * sY + zg * cY;
    const m = 0.5 + 0.5 * noise.fbm2(X * 0.25 + off, Zp * 0.25 + Yp * 0.2, 3);
    const streak = smoothstep(0.38, 0.7, noise.n2(X * 0.5 + off, Zp * 0.1 + Yp * 0.08));      // a few faint grey moraine streaks down the old snow
    const wlK = 1 - smoothstep(0.3, 2.6, Yp + 0.6 * noise.n2(X * 0.6, off + 4)), hol = smoothstep(0.55, 0.85, rg) * 0.5;   // cyan where the sea has cut it, blue in the hollows
    c.copy(pal.snow).multiplyScalar(0.8 + 0.06 * m).lerp(grime, 0.3 * streak).lerp(pal.iceLight, 0.35 * hol).lerp(pal.cyan, 0.75 * wlK);
    rcol[k] = c.r; rcol[k + 1] = c.g; rcol[k + 2] = c.b;
    rice[k] = -0.8 + 1.25 * wlK + 0.5 * hol; rice[k + 1] = 0; rice[k + 2] = 0;                 // negative blue: no cyan in the old ice above the waterline band
  }
  const idx = new Uint16Array(n * 6), ridx = new Uint16Array(RX * RZ * 6); let q = 0;
  for (let i = 0; i < ns; i++) for (let j = 0; j < nc; j++) {
    const i1 = (i + 1) % ns, j1 = (j + 1) % nc, a = i * nc + j, b = i1 * nc + j, d = i1 * nc + j1, e = i * nc + j1;
    idx[q++] = a; idx[q++] = e; idx[q++] = b; idx[q++] = b; idx[q++] = e; idx[q++] = d;
  }
  q = 0;
  for (let i = 0; i < RX; i++) for (let j = 0; j < RZ; j++) {
    const a = i * (RZ + 1) + j, b = a + RZ + 1;
    ridx[q++] = a; ridx[q++] = a + 1; ridx[q++] = b; ridx[q++] = b; ridx[q++] = a + 1; ridx[q++] = b + 1;
  }
  const make = (P, C, I, X) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('aIce', new THREE.BufferAttribute(I, 3));
    g.setIndex(new THREE.BufferAttribute(X, 1)); g.computeVertexNormals();
    return g;
  };
  // the ridge is its own mesh: it crumbles away as the berg capsizes, so the upright arch carries no dirty hood
  return { ring: make(pos, col, ice, idx), ridge: make(rpos, rcol, rice, ridx) };
}

// ---------------------------------------------------------------- sea (optional), floes, spray, shards
function buildSea(pal, shared, o) {
  const rings = 118, segs = 120, R = 650, n = (rings + 1) * segs;
  const pos = new Float32Array(n * 3), idx = new Uint32Array(rings * segs * 6);
  for (let i = 0; i <= rings; i++) {
    const f = i / rings, r = R * (0.72 * f + 0.28 * f * f * f);
    for (let j = 0; j < segs; j++) {
      const a = (j + (i & 1) * 0.5) / segs * Math.PI * 2, k = (i * segs + j) * 3;
      pos[k] = o.imp.x + Math.sin(a) * r; pos[k + 1] = 0; pos[k + 2] = o.imp.y + Math.cos(a) * r;
    }
  }
  let q = 0;
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = i * segs + j, b = i * segs + (j + 1) % segs, c = a + segs, d = b + segs;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(o.imp.x, 0, o.imp.y), R + 10);
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uDeep: { value: pal.water.clone() }, uTeal: { value: pal.sapphire.clone() }, uTop: { value: o.skyTop.clone() }, uHor: { value: o.skyHor.clone() },
      uSun: { value: o.sunDir.clone() }, uFoamCol: { value: pal.snow.clone().multiplyScalar(0.92) }, uGlit: { value: o.glitter ?? 1 },
    }]),
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WAVE_GLSL}
varying vec3 vW; varying vec2 vL; varying vec3 vN; varying vec2 vRing;
void main(){
  vec3 p = position; vec2 xz = p.xz;
  float h = calvWave(xz), e = 1.5;
  float hx = calvWave(xz + vec2(e, 0.0)), hz = calvWave(xz + vec2(0.0, e));
  p.y += h;
  vN = normalize(mat3(modelMatrix)*vec3(h - hx, e, h - hz));
  float r = length(xz - uCalvImp.xy);
  vRing = vec2(calvRing(xz), 7.0*sqrt(28.6/max(r, 28.6)));
  vL = xz;
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uDeep, uTeal, uTop, uHor, uSun, uFoamCol;
uniform float uCalvT, uCalvTime, uGlit; uniform vec3 uCalvImp; uniform vec4 uArchFoam;
varying vec3 vW; varying vec2 vL; varying vec3 vN; varying vec2 vRing;
${NOISE_GLSL}
${SHADOW_GLSL}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float dist = length(cameraPosition - vW), t = uCalvTime;
  float lod = 1.0/(1.0 + dist*0.006);
  vec2 vS = vec2(vL.x*0.8 - vL.y*0.6, (vL.x*0.6 + vL.y*0.8)*0.42);          // stretched along the wind: elongated wavelets, not blobs
  vec3 q1 = vec3(vL*0.22 + vec2(t*0.25, t*0.12), t*0.35), q2 = vec3(vS*1.3 - vec2(t*0.3, -t*0.4), t*0.6);
  vec2 rip = (vec2(cvNoise(q1), cvNoise(q1 + 17.3)) - 0.5)*0.08 + (vec2(cvNoise(q2), cvNoise(q2 + 9.1)) - 0.5)*0.19*lod;
  vec3 q3 = vec3(vS*3.6 + vec2(-t*0.55, t*0.4), t*0.9);
  rip += (vec2(cvNoise(q3), cvNoise(q3 + 5.7)) - 0.5)*0.26*lod*lod;
  // crisp wavelets near the bow: two fine octaves, each faded out before it gets finer than a pixel
  float fp = max(length(dFdx(vL)), length(dFdy(vL)));
  float k4 = 1.0 - smoothstep(0.12, 0.45, fp*9.0), k5 = 1.0 - smoothstep(0.12, 0.45, fp*24.0);
  vec3 q4 = vec3(vS*9.0 + vec2(t*0.9, -t*0.7), t*1.4), q5 = vec3(vS*24.0 - vec2(t*1.3, t*1.1), t*2.0);
  rip += (vec2(cvNoise(q4), cvNoise(q4 + 3.9)) - 0.5)*0.52*k4 + (vec2(cvNoise(q5), cvNoise(q5 + 8.3)) - 0.5)*0.36*k5;
  vec3 n = normalize(vN + vec3(rip.x, 0.0, rip.y));
  float F = 0.02 + 0.98*pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0);
  vec3 R = reflect(-V, n); R.y = abs(R.y);
  vec3 sky = mix(uHor, uTop, smoothstep(0.0, 0.55, R.y));
  float steep = clamp(1.0 - vN.y, 0.0, 1.0)*14.0;
  float lift = clamp(vRing.x/vRing.y, -1.0, 1.0);
  vec2 outD = vL - uCalvImp.xy; float outL = length(outD);
  float face = outL > 1.0 ? smoothstep(0.015, 0.09, dot(outD/outL, vN.xz))*smoothstep(0.12, 0.4, lift) : 0.0;      // the advancing face of the ring wave
  vec3 col = uDeep*(0.75 + 0.5*clamp(dot(n, uSun), 0.0, 1.0));
  col += uTeal*(clamp(steep, 0.0, 1.0)*0.30 + max(lift, 0.0)*0.28)*(1.0 - 0.6*face);
  float raN = length(vL - uArchFoam.xy), nearArch = 1.0 - smoothstep(22.0, 70.0, raN);
  col = mix(col, sky*0.8, F*0.36*(1.0 - 0.55*nearArch)*(1.0 - 0.45*smoothstep(0.16, 0.34, R.y)));   // black body, sky only at grazing angles
  float wl1 = 1.0 - abs(2.0*cvNoise(vec3(vS*4.2 + vec2(t*0.7, -t*0.5), t*0.8)) - 1.0), wl2 = 1.0 - abs(2.0*cvNoise(vec3(vS*10.0 - vec2(t*1.1, t*0.9), t*1.3)) - 1.0);
  col += sky*(0.15*wl1*wl1*wl1*wl1*(1.0 - smoothstep(0.1, 0.4, fp*4.2)) + 0.13*wl2*wl2*wl2*wl2*k4)*(1.0 - 0.6*nearArch);      // thin lines of sky light along the wavelet crests
  float sd = max(dot(R, uSun), 0.0);
  float spark = step(0.86, cvNoise(vec3(vL*2.3, t*1.6)));
  float shd = calvShadow(vL);
  col += vec3(1.0, 0.98, 0.95)*(pow(sd, 380.0)*9.0 + pow(sd, 22.0)*spark*3.2*lod + pow(sd, 6.0)*0.05)*(1.0 - shd);
  // hard white glitter whatever the sun's azimuth: points that wink on the facets tilted toward the light
  float gcell = cvNoise(vec3(vL*13.0 + rip*6.0, t*2.2)), gpatch = smoothstep(0.3, 0.5, cvNoise(vec3(vL*0.6 + 31.0, t*0.35)));
  float glit = smoothstep(0.83, 0.87, gcell)*gpatch*smoothstep(1.5, 4.0, dist)*(1.0 - smoothstep(22.0, 60.0, dist))*(1.0 - smoothstep(0.3, 1.1, fp*13.0));
  col += vec3(2.5)*glit*(1.0 - shd)*uGlit;
  col = mix(col, uDeep*0.5 + uTeal*(0.08 + 0.55*smoothstep(0.45, 0.85, lift)), face*0.85);      // the face of the wave: dark water, turquoise where it thins under the crest
  // foam: the advancing crest, the trailing swells, the impact fPatch, the arch
  float fn = cvFbm(vec3(vL*0.16, t*0.15)), fn2 = cvNoise(vec3(vL*0.7, t*0.5));
  float ridge = 1.0 - abs(2.0*cvFbm(vec3(vL*0.23 + 5.0, t*0.12)) - 1.0);
  float ridge2 = 1.0 - abs(2.0*cvNoise(vec3(vL*0.8, t*0.3)) - 1.0);
  float veins = max(ridge, ridge2*0.9);
  float liftF = lift*(1.0 - 0.3*face);
  float dens = smoothstep(0.42, 0.9, liftF + (fn - 0.5)*0.4) + smoothstep(0.24, 0.5, liftF)*0.4;
  float tt = uCalvT - uCalvImp.z, r = length(vL - uCalvImp.xy);
  if (tt > 0.0) {
    float rad = min(125.0, 16.0 + 15.0*tt);
    float fPatch = (1.0 - smoothstep(rad*0.3, rad, r + (fn - 0.5)*40.0))*exp(-tt/10.0)*smoothstep(0.0, 1.2, tt);
    dens = max(dens, fPatch*1.1);
    dens = max(dens, exp(-pow((r - rad)/6.0, 2.0))*exp(-tt/7.0)*0.7);
  }
  float ra = raN, solid = smoothstep(0.4, 0.8, liftF);
  dens = max(dens, 0.4*uArchFoam.w*(1.0 - smoothstep(uArchFoam.z*0.25, uArchFoam.z, ra + (fn - 0.5)*14.0)));
  dens = clamp(dens, 0.0, 1.0);
  float foam = smoothstep(1.02 - dens, 1.22 - dens*0.9, veins)*smoothstep(0.0, 0.08, dens);
  // broken into streaks everywhere but on the advancing crest and the impact patch: never a white sheet
  float brk = smoothstep(0.5, 0.64, cvFbm(vec3(vL*0.13 + 3.0, t*0.1)))*(0.55 + 0.45*smoothstep(0.35, 0.7, fn2));
  if (tt > 0.0) solid = max(solid, (1.0 - smoothstep(30.0, 90.0, r))*exp(-tt/9.0));
  foam *= mix(brk, 1.0, solid)*(1.0 - 0.5*nearArch*(1.0 - solid));
  vec3 foamLit = min(uFoamCol*(0.36 + 0.6*clamp(dot(n, uSun), 0.0, 1.0) + 0.5*solid) + uHor*0.1, vec3(0.75 + 0.4*solid));
  col = mix(col, foamLit, foam);
  col *= mix(vec3(1.0), vec3(0.34, 0.48, 0.78), shd);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`,
  });
  Object.assign(mat.uniforms, shared, { uArchFoam: o.archFoam });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'calving-sea';
  return mesh;
}

function buildFloes(noise, rng, pal, shared, o) {
  // one irregular bevelled slab; instances vary it by rotation and non-uniform scale
  const sides = 8, ring = [], P = [], C = [], I = [];
  for (let i = 0; i < sides; i++) { const a = (i + rng.range(-0.3, 0.3)) / sides * Math.PI * 2, r = rng.range(0.6, 1.1); ring.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const snow = pal.snow.clone().multiplyScalar(0.78), edge = pal.iceLight.clone().multiplyScalar(0.74), wl = pal.cyan.clone().multiplyScalar(0.8);
  const push = (x, y, z, c) => { P.push(x, y, z); C.push(c.r, c.g, c.b); return P.length / 3 - 1; };
  const top = push(0, 1.12, 0, snow);
  for (let i = 0; i < sides; i++) { const [x, z] = ring[i]; push(x * 0.82, 1, z * 0.82, snow); push(x, 0.72, z, edge); push(x * 1.04, -0.25, z * 1.04, wl); }
  for (let i = 0; i < sides; i++) {
    const a = 1 + i * 3, b = 1 + ((i + 1) % sides) * 3;
    I.push(top, b, a, a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, a + 2, b + 1, b + 2, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
${WAVE_GLSL}
vec3 calvTilt(vec3 v, vec3 n){ vec3 k = vec3(n.z, 0.0, -n.x); return v*n.y + cross(k, v) + k*dot(k, v)/(1.0 + n.y); }
vec3 calvN(vec2 c){ float e = 2.0, h = calvWave(c); return normalize(vec3(h - calvWave(c + vec2(e, 0.0)), e, h - calvWave(c + vec2(0.0, e)))); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vec3 fc = instanceMatrix[3].xyz; vec3 fn = calvN(fc.xz);
transformed = (instanceMatrix*vec4(transformed, 1.0)).xyz - fc;
transformed = calvTilt(transformed, fn) + fc + vec3(0.0, calvWave(fc.xz), 0.0);`)
      .replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix*vec4(transformed, 1.0);\ngl_Position = projectionMatrix*mvPosition;');
  };
  // scatter
  const want = o.count, items = [], m = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let tries = 0; tries < want * 14 && items.length < want; tries++) {
    const x = rng.range(-o.half * 0.95, o.half * 0.95), z = rng.range(-30, 600);
    const big = rng() < 0.35, r = big ? rng.range(7, 17) : rng.range(1.6, 6.5);
    if (Math.hypot(x - o.imp.x, z - o.imp.y) < 46 + r) continue;
    if (z < o.wallZ(x) + 8 + r) continue;
    if (Math.abs(x) < o.channel + r && z > 40) { continue; }
    if (Math.hypot(x, z - o.archZ) < 30 + r) continue;
    let ok = true;
    for (const it of items) { const dx = it.x - x, dz = it.z - z, rr = it.r + r + 0.6; if (dx * dx + dz * dz < rr * rr) { ok = false; break; } }
    if (ok) items.push({ x, z, r });
  }
  const mesh = new THREE.InstancedMesh(g, mat, items.length), c = new THREE.Color();
  items.forEach((it, i) => {
    qt.setFromAxisAngle(up, rng.range(0, 6.283));
    const th = it.r > 7 ? rng.range(0.9, 2.2) : rng.range(0.35, 1.1);
    sc.set(it.r * rng.range(0.8, 1.1), th, it.r * rng.range(0.7, 1.05)); ps.set(it.x, 0, it.z);
    mesh.setMatrixAt(i, m.compose(ps, qt, sc));
    mesh.setColorAt(i, c.setScalar(rng.range(0.86, 1)).lerp(pal.iceLight, rng.range(0, 0.25)));
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'calving-floes';
  return mesh;
}

// spray / dust / drips: soft lit billboards. list items: { o:[x,y,z], v:[x,y,z], t0, life (negative = looping drip), s0, s1, clock (0 event, 1 arch), g, a }
function buildSpray(list, pal, shared, o) {
  const n = list.length, aO = new Float32Array(n * 3), aV = new Float32Array(n * 3), aT = new Float32Array(n * 4), aK = new Float32Array(n * 4);
  list.forEach((p, i) => {
    aO.set(p.o, i * 3); aV.set(p.v, i * 3);
    aT.set([p.t0, p.life, p.s0, p.s1], i * 4); aK.set([p.seed, p.clock, p.g, p.a], i * 4);
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 3));
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uSun: { value: o.sunDir.clone() }, uLit: { value: pal.snow.clone().multiplyScalar(1.15) },
      uShade: { value: pal.cyan.clone().multiplyScalar(0.55).lerp(pal.sapphire, 0.25) },
    }]),
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aO, aV; attribute vec4 aT, aK;
uniform float uCalvT, uArchT, uDrip; uniform vec3 uSun;
varying vec2 vUv; varying float vA, vSeed; varying vec3 vSunV;
void main(){
  float T = mix(uCalvT, uArchT, aK.y);
  float tau = T - aT.x, life = abs(aT.y), on = step(0.0, tau), amp = aK.w;
  if (aT.y < 0.0) { tau = mod(max(tau, 0.0), life); amp *= uDrip; }
  float f = tau/life; on *= step(f, 1.0);
  float d = (1.0 - exp(-0.22*tau))/0.22;
  float size = mix(aT.z, aT.w, sqrt(clamp(f, 0.0, 1.0)));
  vec3 p = aO + vec3(aV.x*d, aV.y*tau - 0.5*${G.toFixed(3)}*aK.z*tau*tau, aV.z*d);
  p.y = max(p.y, size*0.22);
  vA = amp*on*smoothstep(0.0, 0.07, f)*(1.0 - smoothstep(0.5, 1.0, f));
  float ang = aK.x*40.0 + f*(aK.x - 0.5)*1.5, ca = cos(ang), sa = sin(ang);
  vUv = position.xy; vSeed = aK.x;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  mvPosition.xy += mat2(ca, sa, -sa, ca)*position.xy*size*step(0.001, vA);
  vec3 sv = normalize((viewMatrix*vec4(uSun, 0.0)).xyz);
  vSunV = vec3(sv.x*ca + sv.y*sa, -sv.x*sa + sv.y*ca, sv.z);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uLit, uShade; uniform float uCalvTime;
varying vec2 vUv; varying float vA, vSeed; varying vec3 vSunV;
${NOISE_GLSL}
void main(){
  float r = length(vUv);
  if (r > 1.0 || vA < 0.003) discard;
  float n = cvFbm(vec3(vUv*1.9 + vSeed*31.0, vSeed*9.0 + uCalvTime*0.25));
  float a = smoothstep(1.0, 0.25, r + (n - 0.5)*1.1)*vA;
  vec3 nn = normalize(vec3(vUv + (n - 0.5)*0.6, sqrt(max(0.0, 1.0 - r*r)) + 0.25));
  float lit = clamp(dot(nn, vSunV)*0.62 + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(mix(uShade, uLit, lit*lit), a);
  #include <fog_fragment>
}`,
  });
  Object.assign(mat.uniforms, shared, { uArchT: o.archT, uDrip: o.drip });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'calving-spray';
  return mesh;
}

// shards: instanced angular splinters on ballistic paths, all in the vertex shader. list: { p:[..], v:[..], t0, s, spin, seed }
function buildShards(list, pal, shared) {
  const base = new THREE.OctahedronGeometry(1, 0); base.scale(1, 1.7, 0.6);
  const n = list.length, aP = new Float32Array(n * 3), aV = new Float32Array(n * 3), aS = new Float32Array(n * 4);
  list.forEach((p, i) => { aP.set(p.p, i * 3); aV.set(p.v, i * 3); aS.set([p.t0, p.s, p.spin, p.seed], i * 4); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', base.attributes.position); g.setIndex(base.index);
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(aP, 3)); g.setAttribute('aV0', new THREE.InstancedBufferAttribute(aV, 3)); g.setAttribute('aSp', new THREE.InstancedBufferAttribute(aS, 4));
  g.instanceCount = n;
  const mat = new THREE.MeshStandardMaterial({ color: pal.snow.clone().multiplyScalar(0.78).lerp(pal.iceLight, 0.4), emissive: pal.sapphire, emissiveIntensity: 0.08, roughness: 0.22, flatShading: true });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCalvT = shared.uCalvT;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aP0, aV0; attribute vec4 aSp; uniform float uCalvT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  float tau = uCalvT - aSp.x, vis = step(0.0, tau);
  vec3 pp = aP0 + aV0*tau + vec3(0.0, -0.5*${G.toFixed(3)}*tau*tau, 0.0);
  vis *= smoothstep(-2.5, 0.0, pp.y);
  vec3 ax = normalize(vec3(sin(aSp.w*37.0), cos(aSp.w*53.0), sin(aSp.w*91.0)));
  float an = tau*aSp.z + aSp.w*6.28, ca = cos(an), sa = sin(an);
  vec3 v = transformed*aSp.y*vis;
  transformed = v*ca + cross(ax, v)*sa + ax*dot(ax, v)*(1.0 - ca) + pp;
}`);
  };
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'calving-shards';
  return mesh;
}

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('calving-hero') : ctx.rng, noise = ctx.noise;
  const P = opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE;
  const pal = { glow: { value: opts.iceGlow ?? 1 }, sky: new THREE.Color(P[0]), iceLight: new THREE.Color(P[1]), snow: new THREE.Color(P[2]), cyan: new THREE.Color(P[3]), sapphire: new THREE.Color(P[4]), water: new THREE.Color(P[5]) };
  const width = clamp(opts.width ?? 520, 260, 1400), archZ = opts.archDistance ?? 230;
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.6, 0.7, 0.4)).normalize();
  const swell = opts.swell ?? 1;

  const object = new THREE.Group(); object.name = 'the-calving';
  const imp = new THREE.Vector3(rng.range(-2, 2), 24, 0); // x, z, time (time filled in below)
  const shared = { uCalvT: { value: 0 }, uCalvTime: { value: 0 }, uCalvImp: { value: imp }, uCalvSwell: { value: swell },
    uCalvSh: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 1)) }, uCalvShDir: { value: new THREE.Vector3(1, 0, 0) } };
  const archT = { value: 0 }, drip = { value: 0 }, archWet = { value: 0 }, archRim = { value: 0 }, archFoam = { value: new THREE.Vector4(0, archZ, 20, 0) };

  // --- glacier front
  const pause = () => ctx.yield();
  const gl = await buildGlacier(noise, rng, pal, width, pause);
  await ctx.yield();
  const iceMat = makeIceMaterial(pal, shared, { sweep: opts.lightSweep ?? 0 });
  const glacier = new THREE.Mesh(gl.geometry, iceMat); glacier.name = 'calving-glacier'; object.add(glacier);
  await ctx.yield();

  // --- the tower: five blocks
  const towerMat = makeIceMaterial(pal, shared, { detail: 0.8, fresh: 0.42, frost: 1 });
  const jit = () => rng.range(-0.8, 0.8);
  const TZ = 4.5;                                                 // the prow stands this far forward of the old wall line
  const defs = [
    { c: [0, 9.5, TZ], s: [25, 31, 14.5], delay: 0.0, kick: 2.5, vmax: 25, n: 46, eq: -0.34 },
    { c: [-5.4 + jit(), 35, TZ - 0.2], s: [14.5, 23, 14], delay: 0.3, kick: 3.5, vmax: 35, n: 70, eq: -0.3 },
    { c: [7.2 + jit(), 34, TZ + 0.4], s: [11.5, 22, 13], delay: 0.15, kick: 3.0, vmax: 28, n: 50, eq: -0.32 },
    { c: [0.6 + jit(), 56, TZ - 0.4], s: [22, 22, 13], delay: 0.5, kick: 4.0, vmax: 35, n: 84, eq: -0.12, main: true },
    { c: [-1 + jit(), 74.5, TZ - 0.6], s: [18.5, 19, 12], delay: 0.75, kick: 4.0, vmax: 29, n: 60, eq: -0.3, spires: 10 },
  ];
  const pivot = new THREE.Vector3(0, 0, TZ), X = new THREE.Vector3(1, 0, 0);
  const thetaAt = (t) => LEAN * Math.pow(Math.max(t, 0) / T_RELEASE, 2);
  const chunks = [];
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const geo = makeIceBlock(noise, rng, d.s[0], d.s[1], d.s[2], pal, { spires: d.spires, amp: 1.5, seg: 2.0,
      weathered: (nx, ny, nz) => Math.max(smoothstep(0.15, 0.6, nz), d.spires ? smoothstep(0.3, 0.8, ny) : 0) });
    const mesh = new THREE.Mesh(geo, towerMat); mesh.name = 'calving-block-' + i; object.add(mesh);
    const tr = T_RELEASE + d.delay, th = thetaAt(tr), om = 2 * LEAN * tr / (T_RELEASE * T_RELEASE);
    const c = new THREE.Vector3(...d.c), r = c.clone().sub(pivot).applyAxisAngle(X, th), p0 = r.clone().add(pivot);
    const v0 = new THREE.Vector3(rng.range(-1.6, 1.6) + (c.x - 0.5) * 0.12, -r.z * om + rng.range(-0.5, 1.2), r.y * om + d.kick * rng.range(0.8, 1.2));
    const yHit = d.s[1] * 0.25, tauH = (v0.y + Math.sqrt(v0.y * v0.y + 2 * G * Math.max(0.1, p0.y - yHit))) / G;
    const axis = new THREE.Vector3(1, rng.range(-0.35, 0.35), rng.range(-0.5, 0.5)).normalize();
    chunks.push({ d, mesh, c, tr, om, p0, v0, yHit, tauH, tHit: tr + tauH, axis, spin: rng.range(0.22, 0.5) * (d.main ? 1.1 : 1), rollAxis: new THREE.Vector3(rng.range(-0.3, 0.3), 0, 1).normalize(),
      hit: new THREE.Vector3(p0.x + v0.x * tauH, 0, p0.z + v0.z * tauH), depth: d.s[1] * rng.range(0.85, 1.1) });
    await ctx.yield();
  }
  // the wave starts when the second-heaviest wave of ice (the two mid blocks) lands
  imp.z = (chunks[1].tHit + chunks[2].tHit) * 0.5; imp.x = (chunks[1].hit.x + chunks[2].hit.x) * 0.5; imp.y = (chunks[1].hit.z + chunks[3].hit.z) * 0.5;
  const tArch = imp.z + Math.max(0, Math.hypot(imp.x, archZ - imp.y) - 22) / WAVE_SPEED, ARCH_LEN = 7.5;
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v1 = new THREE.Vector3();
  function poseChunk(ch, t) {
    const m = ch.mesh;
    if (t <= ch.tr) {
      const th = thetaAt(t);
      m.position.copy(ch.c).sub(pivot).applyAxisAngle(X, th).add(pivot); m.quaternion.setFromAxisAngle(X, th); return;
    }
    const tau = Math.min(t - ch.tr, ch.tauH), sg = Math.max(0, t - ch.tHit);
    m.position.set(ch.p0.x + ch.v0.x * tau, ch.p0.y + ch.v0.y * tau - 0.5 * G * tau * tau, ch.p0.z + ch.v0.z * tau);
    let spinT = tau;
    if (sg > 0) {
      const yEq = ch.d.eq * ch.d.s[1], dr = (1 - Math.exp(-0.7 * sg)) / 0.7;
      m.position.y = yEq + (ch.yHit - yEq) * Math.exp(-3 * sg) - ch.depth * Math.exp(-0.3 * sg) * Math.sin(0.9 * sg);
      m.position.x += ch.v0.x * dr; m.position.z += ch.v0.z * dr * 0.8 + (ch.d.main ? 1.4 : 0.6) * sg * Math.exp(-sg * 0.08);
      spinT += (1 - Math.exp(-0.45 * sg)) / 0.45;
    }
    q1.setFromAxisAngle(X, thetaAt(ch.tr) + ch.om * tau);
    q2.setFromAxisAngle(ch.axis, ch.spin * spinT);
    m.quaternion.copy(q2).multiply(q1);
    if (sg > 0 && ch.d.main) { q2.setFromAxisAngle(ch.rollAxis, 2.2 * (1 - Math.exp(-0.13 * sg)) + 0.12 * Math.sin(sg * 0.7)); m.quaternion.premultiply(q2); }
  }
  await ctx.yield();

  // --- shards
  const shardList = [];
  for (let i = 0; i < 200; i++) {
    const early = i < 50, ch = rng.pick(chunks), t0 = early ? rng.range(0.4, T_RELEASE) : ch.tr + rng.range(-0.2, 1.6), th = thetaAt(Math.min(t0, ch.tr));
    v1.set(ch.c.x + rng.range(-0.5, 0.5) * ch.d.s[0], ch.c.y + rng.range(-0.5, 0.5) * ch.d.s[1], early ? TZ + rng.pick([-7, 6.5]) : ch.c.z + rng.range(-0.5, 0.55) * ch.d.s[2]);
    v1.sub(pivot).applyAxisAngle(X, th).add(pivot);
    if (!early) { const ta = Math.max(0, t0 - ch.tr); v1.x += ch.v0.x * ta; v1.y += ch.v0.y * ta - 0.5 * G * ta * ta; v1.z += ch.v0.z * ta; }
    shardList.push({ p: [v1.x, Math.max(1, v1.y), v1.z], v: [rng.range(-5, 5), rng.range(-1, 6) + (early ? 0 : ch.v0.y), rng.range(1.5, 10)], t0, s: rng.range(0.5, 1.4) * (rng.chance(0.15) ? 2.2 : 1), spin: rng.range(0.8, 3.2) * rng.sign(), seed: rng() });
  }
  object.add(buildShards(shardList, pal, shared));

  // --- spray, dust, drips
  const spray = [];
  const add = (o, v, t0, life, s0, s1, a, g = 1, clock = 0) => spray.push({ o, v, t0, life, s0, s1, a, g, clock, seed: rng() });
  for (let i = 0; i < 28; i++) add([rng.range(-13, 13), rng.range(40, 84), rng.range(-5, 0)], [rng.range(-2, 2), rng.range(0.5, 3), rng.range(0.5, 4)], rng.range(0, 0.7), rng.range(4.5, 7), 3, rng.range(9, 15), 0.34, 0.04);
  for (let i = 0; i < 22; i++) add([rng.range(-12, 12), rng.range(2, 62), TZ + rng.range(5, 10)], [rng.range(-1.5, 1.5), rng.range(-1, 1), rng.range(1, 4)], rng.range(1, 4.6), rng.range(3, 5), 2.5, rng.range(7, 11), 0.3, 0.12);
  for (const ch of chunks) {
    for (let i = 0; i < ch.d.n; i++) {
      const up = Math.pow(rng(), 0.7), a = rng.range(0, 6.283), vr = (1 - up) * rng.range(4, 15) + rng.range(0, 3), ro = rng.range(0, 9);
      add([ch.hit.x + Math.cos(a) * ro, 0, ch.hit.z + Math.sin(a) * ro], [Math.cos(a) * vr, ch.d.vmax * (0.3 + 0.7 * up) * rng.range(0.9, 1.05), Math.sin(a) * vr * 0.8 + 1.5],
        ch.tHit + rng.range(0, 1.1), rng.range(5.8, 8.6) * (0.6 + 0.4 * up), rng.range(6.5, 11.5), rng.range(18, 32), rng.range(0.42, 0.62));
    }
    for (let i = 0; i < 14; i++) { // base surge rolling out along the water
      const a = rng.range(-0.4, Math.PI + 0.4), vr = rng.range(13, 30);
      add([ch.hit.x, 0, ch.hit.z], [Math.cos(a) * vr, rng.range(2, 6), Math.sin(a) * vr], ch.tHit + rng.range(0.1, 0.9), rng.range(4, 6.4), 9, rng.range(18, 28), 0.3);
    }
  }
  // arch (clock 1 = seconds since the arch began to roll): heave spray, then looping drips off the crown
  for (let i = 0; i < 52; i++) {
    const a = rng.range(0, 6.283), r = rng.range(8, 15);
    const sx = rng.sign() * rng.range(9, 16);
    add([sx, 0, archZ + Math.sin(a) * r * 0.5], [Math.sign(sx) * rng.range(1, 6), rng.range(5, 13), Math.sin(a) * rng.range(2, 6)], rng.range(0.3, 3), rng.range(2.6, 4.6), 2, rng.range(5, 9), 0.26, 1, 1);
  }
  for (let i = 0; i < 44; i++) {
    const x = rng.range(-13.5, 13.5), inner = Math.abs(x) < 7 && rng.chance(0.6);
    const y = inner ? ARCH.cy + ARCH.hh * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / ARCH.hw, ARCH.ex)), 1 / ARCH.ex) - 0.3 : rng.range(6, 13);
    add([x, y, archZ + rng.range(-3.5, 4)], [rng.range(-0.3, 0.3), -1, rng.range(-0.3, 0.3)], 2.6 + rng.range(0, 2), -rng.range(1.5, 2.3), inner ? 0.5 : 0.9, inner ? rng.range(1.0, 1.7) : rng.range(1.8, 3), inner ? 0.3 : 0.45, 1, 1);
  }
  object.add(buildSpray(spray, pal, shared, { sunDir, archT, drip }));
  await ctx.yield();

  // --- arch berg
  const archMat = makeIceMaterial(pal, shared, { wet: archWet, rim: archRim, detail: 1.0, scallop: 1.0 });
  const archPivotY = -2, arch = new THREE.Group(), A0 = 100 * Math.PI / 180;
  const archGeo = await buildArch(noise, rng, pal, opts.archYaw ?? 0, A0, archPivotY, pause);
  const archMesh = new THREE.Mesh(archGeo.ring, archMat);
  archMesh.position.y = -archPivotY; arch.add(archMesh); arch.name = 'calving-arch'; object.add(arch);
  archGeo.ridge.computeBoundingBox();
  const ridgeC = archGeo.ridge.boundingBox.getCenter(new THREE.Vector3()); archGeo.ridge.translate(-ridgeC.x, -ridgeC.y, -ridgeC.z);
  const ridgeMesh = new THREE.Mesh(archGeo.ridge, archMat); ridgeMesh.position.set(ridgeC.x, ridgeC.y - archPivotY, ridgeC.z); arch.add(ridgeMesh);
  const archYaw = (opts.archYaw ?? 0) + rng.range(-0.02, 0.02);
  await ctx.yield();

  // --- sea and floes
  const wallPos = gl.geometry.attributes.position, rowsPer = wallPos.count / (Math.round(clamp(width / 1.75, 200, 420)) + 1);
  const wallZ = (x) => { const i = clamp(Math.round((x + width / 2) / width * (wallPos.count / rowsPer - 1)), 0, wallPos.count / rowsPer - 1); return wallPos.getZ(i * rowsPer + 4); };
  if (opts.sea !== false) object.add(buildSea(pal, shared, { imp, sunDir, skyTop: new THREE.Color(opts.skyTop || P[0]), skyHor: new THREE.Color(opts.skyHorizon || P[1]), archFoam, glitter: opts.glitter }));
  await ctx.yield();
  const channel = 11;
  if (opts.floes !== false) object.add(buildFloes(noise, rng, pal, shared, { count: 520, half: Math.min(width / 2, 330), imp, wallZ, channel, archZ }));
  await ctx.yield();

  // --- clocks
  let evT = null, archOverride = null, curT = 0, curTime = 0;
  const sstep = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const waveHeight = (x, z) => waveJS(x, z, curT, curTime, imp, swell);
  const ringHeight = (x, z, T) => waveJS(x, z, T, 0, imp, 0);
  function apply(T, time) {
    curT = T; curTime = time; shared.uCalvT.value = T; shared.uCalvTime.value = time;
    for (const ch of chunks) poseChunk(ch, T);
    const tau = archOverride != null ? archOverride * ARCH_LEN : Math.max(0, T - tArch);
    const s = sstep(tau / 3.2), late = Math.max(0, tau - 3.2);
    const rock = s * 0.2 * Math.exp(-0.38 * late) * Math.sin(1.55 * late + 0.2) * (tau > 0 ? 1 : 0);
    const h = waveHeight(0, archZ), slope = (waveHeight(0, archZ + 5) - waveHeight(0, archZ - 5)) / 10;
    const heave = 0.9 * (1 - s) + 3.0 * Math.sin(Math.PI * clamp(tau / 4.6, 0, 1)) * s + 0.5 * Math.exp(-0.3 * late) * Math.sin(1.1 * late) * s;
    arch.position.set(0, archPivotY + heave + h * 0.75, archZ);
    arch.rotation.set(A0 * (1 - s) - rock + Math.atan(slope) * 0.6 + 0.012 * Math.sin(time * 0.7), archYaw, 0.02 * Math.sin(time * 0.53 + 1) + 0.05 * s * Math.exp(-0.3 * late) * Math.sin(1.2 * late));
    archT.value = tau;
    ridgeMesh.scale.setScalar(Math.max(0.001, 1 - smoothstep(0.5, 0.9, s)));       // the old ridge breaks up and is gone by the time the arch stands
    drip.value = smoothstep(2.3, 3.3, tau) * (0.4 + 0.6 * Math.exp(-late / 6));
    archWet.value = s * (0.35 + 0.65 * Math.exp(-late / 5));
    archRim.value = s * 1.35;
    archFoam.value.set(0, archZ, 20 + Math.min(tau, 8) * 2.2, 0.95 * smoothstep(0.2, 1.4, tau) * (1 - 0.5 * smoothstep(4, 9, tau)) + 0.4 * (1 - s));
  }
  apply(0, 0);

  const focusArch = false, camW = new THREE.Vector3();
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, 3.5, archZ), normal: new THREE.Vector3(0, 0, 1), radius: 7 },
    flyThrough: [[0, 0.8, 440], [0, 0.8, 380], [0, 0.8, 320], [0, 0.8, archZ + 60], [0, 2.1, archZ + 30], [0, 3.5, archZ], [0, 3.5, archZ - 14]].map((p) => new THREE.Vector3(...p)),
    viewpoints: {
      kayakStart: new THREE.Vector3(0, 0.8, 440), kayakWave: new THREE.Vector3(0, 0.8, 290), archReveal: new THREE.Vector3(0, 2.5, archZ + 30),
    },
    impact: new THREE.Vector3(imp.x, 0, imp.y),
    towerTop: new THREE.Vector3(0, 74, TZ), cliffTop: new THREE.Vector3(0, gl.top, -10), archCrown: new THREE.Vector3(0, 14, archZ),
    splashTop: new THREE.Vector3(imp.x, 96, imp.y),
    channelHalfWidth: channel, opening: { halfWidth: 7.4, yMin: -3, yMax: 10.5 },
  };

  return {
    object,
    radius: focusArch ? 20 : 170, height: focusArch ? 18 : 78,
    center: focusArch ? new THREE.Vector3(0, 6, archZ) : new THREE.Vector3(0, 24, 95),
    anchors,
    eventLength: EVENT_LEN,
    timeline: { release: T_RELEASE, hit: imp.z, arch: tArch, archLength: ARCH_LEN, waveSpeed: WAVE_SPEED, waveAt: (z) => imp.z + Math.max(0, z - imp.y) / WAVE_SPEED, blockHits: chunks.map((c) => c.tHit) },
    waveHeight, ringHeight, wallZ, waveGLSL: WAVE_GLSL, waveUniforms: shared, shadowGLSL: SHADOW_GLSL,
    // list: up to six { x, z, halfWidth, length }; dir: [x, z] down-sun; strength 0..1 (0 = off)
    setShadows(list, dir, strength) {
      const l = Math.hypot(dir[0], dir[1]) || 1; shared.uCalvShDir.value.set(dir[0] / l, dir[1] / l, strength);
      shared.uCalvSh.value.forEach((v, i) => { const c = list[i]; if (c) v.set(c.x, c.z, c.halfWidth, c.length); else v.set(0, 0, -100, 1); });
    },
    kit: { pal, makeIceBlock: (w, h, d, o) => makeIceBlock(noise, rng, w, h, d, pal, o), makeIceMaterial: (o) => makeIceMaterial(pal, shared, o) },
    setProgress(u) { evT = clamp(u, 0, 1.5) * EVENT_LEN; },
    setEventTime(sec) { evT = sec; },
    setArchProgress(u) { archOverride = u == null ? null : Math.max(0, u); },
    update(dt, time, camera) {
      let T = evT;
      if (T == null) T = Math.min(((time + 23) % 26), 25);
      apply(T, time);
      if (camera) { camera.getWorldPosition(camW); archRim.value *= clamp(Math.hypot(camW.x - object.position.x, camW.z - object.position.z - archZ) / 52, 0.12, 1); } // do not white out the fly-through
    },
    dispose() {},
    ground: opts.sea === false, groundY: 0,
  };
}
